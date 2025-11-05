import { createGzip } from 'node:zlib';

import { S3Client } from '@aws-sdk/client-s3';
import { fsa } from '@chunkd/fs';
import { HashTransform } from '@chunkd/fs/build/src/hash.stream.js';
import { FsAwsS3 } from '@chunkd/fs-aws';
import type { LambdaRequest, LogType } from '@linzjs/lambda';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import type { Entry } from 'yauzl';
import yauzl from 'yauzl';

import { CachePrefix, ExportLayerId, kx } from './config.ts';
import type { KxDatasetExport, KxDatasetVersionDetail } from './kx.ts';
import { Stac } from './stac.ts';

fsa.register('s3://', new FsAwsS3(new S3Client()));

/** Assume geopackage */
const PackageExtension = '.gpkg';

export async function getOrCreate<T extends Record<string, unknown>>(uri: URL, create: () => Promise<T>): Promise<T> {
  const exists = await fsa.exists(uri);
  if (exists === false) {
    const rec = await create();
    await fsa.write(uri, JSON.stringify(rec));
    return rec;
  }

  return fsa.readJson<T>(uri);
}

let _fileList: URL[] | undefined;
/** List all STAC files in a bucket (assuming anything ending in.json is STAC) */
export async function listStacFiles(): Promise<URL[]> {
  let cachePrefix = CachePrefix;
  // Don't need to get all stac files if only export single layer
  if (ExportLayerId > 0) cachePrefix = new URL(`${ExportLayerId}/`, cachePrefix);

  if (_fileList == null) {
    // Local file system does not like listing folders that don't exist.
    if (cachePrefix.protocol === 'file:') {
      const exists = await fsa.head(cachePrefix);
      if (exists == null) return [];
    }

    const fileList = await fsa.toArray(fsa.list(cachePrefix));
    _fileList = fileList.filter((f) => f.pathname.endsWith('.json'));
  }
  return _fileList;
}

export async function extractAndWritePackage(
  stream: Readable,
  targetFileUri: URL,
  ht: HashTransform,
  datasetId: number,
  log: LogType,
): Promise<void> {
  const tmpZipFile = `/tmp/${datasetId}.zip`;
  await pipeline(stream, createWriteStream(tmpZipFile));

  return new Promise((resolve) => {
    yauzl.open(tmpZipFile, { lazyEntries: true }, (err, zipFile) => {
      if (err) throw new Error(``);

      zipFile.on('entry', (entry: Entry) => {
        log.debug({ datasetId, path: entry.fileName }, 'Export:Zip:File');
        if (entry.fileName.endsWith(PackageExtension)) {
          log.info({ datasetId, path: entry.fileName, target: targetFileUri.href }, 'Ingest:Read:Start');
          zipFile.openReadStream(entry, (err, readStream) => {
            if (err) throw new Error(``);

            const gzipOut = readStream.pipe(ht).pipe(createGzip({ level: 9 }));
            void fsa
              .write(targetFileUri, gzipOut, {
                contentType: 'application/geopackage+vnd.sqlite3',
                contentEncoding: 'gzip',
              })
              .then(resolve);
          });
        }
      });
      zipFile.readEntry();
    });
  });
}

/** Ingest the export into our cache */
export async function ingest(
  req: LambdaRequest,
  dataset: KxDatasetVersionDetail,
  ex: KxDatasetExport,
): Promise<boolean> {
  const datasetUrl = new URL(`${dataset.id}/`, CachePrefix);
  const collectionUrl = new URL(`collection.json`, datasetUrl);

  const collectionJson = await getOrCreate(collectionUrl, () => Stac.createStacCollection(dataset));
  req.log.info(
    { datasetId: dataset.id, datasetUrl: datasetUrl.href, collectionUrl: collectionUrl.href },
    'Ingest:CollectionJson',
  );

  const versionId = await Stac.createDatasetId(dataset.id, dataset.version.id);
  const link = collectionJson?.links.find((f) => f.href.includes(versionId));
  if (link != null) {
    req.log.info({ datasetId: dataset.id, datasetUrl: datasetUrl.href, link }, 'Ingest:Exists');
    return false;
  }

  const itemUri = new URL(`${versionId}.json`, datasetUrl);
  collectionJson?.links.push({ href: `./${versionId}.json`, rel: 'item', type: 'application/json' });

  const stacItem = await Stac.createStacItem(dataset);
  const targetFileName = versionId + `${PackageExtension}`;
  const targetFileUri = new URL(targetFileName, datasetUrl);

  const res = await fetch(ex.download_url, { headers: { Authorization: kx.auth }, redirect: 'manual' });

  const nextLocation = res.headers.get('location');
  if (res.status !== 302 || nextLocation == null) {
    req.log.warn(
      { datasetId: dataset.id, datasetUrl: datasetUrl.href, status: res.status, reason: res.statusText },
      'Ingest:Failed:Redirect',
    );
    return false;
  }

  const source = await fetch(nextLocation);
  if (!source.ok || source.body == null) {
    req.log.warn(
      { datasetId: dataset.id, datasetUrl: datasetUrl.href, status: source.status, reason: source.statusText },
      'Ingest:Failed:Download',
    );
    return false;
  }

  req.log.info(
    { datasetId: dataset.id, datasetUrl: datasetUrl.href, source: nextLocation, status: source.status },
    'Ingest:Read:Http',
  );
  const ht = new HashTransform('sha256');
  const stream = Readable.fromWeb(source.body);
  await extractAndWritePackage(stream, targetFileUri, ht, dataset.id, req.log);

  req.log.info(
    { datasetId: dataset.id, datasetUrl: datasetUrl.href, target: targetFileUri.href },
    'Ingest:Read:Complete',
  );

  req.log.info(
    {
      datasetId: dataset.id,
      datasetUrl: datasetUrl.href,
      target: targetFileUri.href,
      hash: ht.multihash,
      size: ht.size,
    },
    'Ingest:Write:Complete',
  );

  const head = await fsa.head(targetFileUri);
  if (head == null || head.size == null) throw new Error('Failed to copy file: ' + targetFileUri.href);

  req.log.info({ datasetId: dataset.id, datasetUrl: datasetUrl.href, target: targetFileUri }, 'Ingest:Uploaded:Item');
  stacItem.assets['export'] = {
    href: `./${targetFileName}`,
    title: 'Export',
    roles: ['data'],
    type: 'application/geopackage+vnd.sqlite3',
    encoding: 'gzip',
    datetime: dataset.published_at,
    'file:checksum': ht.multihash,
    'file:size': ht.size,
  };

  const fileInfo = { checksum: ht.multihash, size: ht.size, id: dataset.id, version: versionId };
  req.logContext['files'] = req.logContext['files'] ?? [];
  (req.logContext['files'] as unknown[]).push(fileInfo);

  await fsa.write(itemUri, JSON.stringify(stacItem));
  req.log.info({ datasetId: dataset.id, datasetUrl: datasetUrl.href, target: itemUri }, 'Ingest:Uploaded:StacItem');

  await fsa.write(collectionUrl, JSON.stringify(collectionJson));
  req.log.info(
    { datasetId: dataset.id, datasetUrl: datasetUrl.href, target: collectionUrl },
    'Ingest:Uploaded:StacCollection',
  );

  // Update top level catalog to include a link to our collection
  const catalogUri = new URL('catalog.json', CachePrefix);
  const catalogJson = await getOrCreate(catalogUri, () => Stac.createStacCatalog());
  const existing = catalogJson.links.find((f) => f.href.endsWith(dataset.id + '/collection.json'));
  if (existing == null) {
    catalogJson.links.push({
      href: './' + dataset.id + '/collection.json',
      title: dataset.title,
      type: 'application/json',
      rel: 'child',
    });
    await fsa.write(catalogUri, JSON.stringify(catalogJson));
  }
  return true;
}
