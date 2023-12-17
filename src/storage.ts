import { fsa } from '@chunkd/fs';
import { FsAwsS3 } from '@chunkd/fs-aws'
import { S3Client } from '@aws-sdk/client-s3';
import { LambdaRequest } from '@linzjs/lambda';
import { createHash } from 'crypto';
import fetch from 'node-fetch';
import { createGzip } from 'zlib';
import unzip from 'unzip-stream';
import { CachePrefix, ExportLayerId, kx } from './config.js';
import { KxDatasetExport, KxDatasetVersionDetail } from './kx.js';
import { Stac } from './stac.js';

fsa.register('s3://', new FsAwsS3(new S3Client()))

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
  if (ExportLayerId > 0) cachePrefix = `${cachePrefix}/${ExportLayerId}`;

  if (_fileList == null) {
    const fileList = await fsa.toArray(fsa.list(fsa.toUrl(cachePrefix)));
    _fileList = fileList.filter((f) => f.pathname.endsWith('.json'));
  }
  return _fileList;
}

/** Ingest the export into our cache */
export async function ingest(
  req: LambdaRequest,
  dataset: KxDatasetVersionDetail,
  ex: KxDatasetExport,
): Promise<boolean> {
  const datasetUri = `${CachePrefix}/${dataset.id}`;
  const collectionUri = new URL('collection.json', datasetUri);

  const collectionJson = await getOrCreate(collectionUri, () => Stac.createStacCollection(dataset));
  req.log.info({ datasetUri, collectionUri }, 'Ingest:CollectionJson');

  const versionId = await Stac.createDatasetId(dataset.id, dataset.version.id);
  const link = collectionJson?.links.find((f) => f.href.includes(versionId));
  if (link != null) {
    req.log.info({ link }, 'Ingest:Exists');
    return false;
  }

  const itemUri = new URL(`${versionId}.json`, datasetUri);
  collectionJson?.links.push({ href: `./${versionId}.json`, rel: 'item', type: 'application/json' });

  const stacItem = await Stac.createStacItem(dataset);
  const targetFileName = versionId + `${PackageExtension}`;
  const targetFileUri = new URL(targetFileName, datasetUri);

  const res = await fetch(ex.download_url, { headers: { Authorization: kx.auth }, redirect: 'manual' });

  const nextLocation = res.headers.get('location');
  if (res.status !== 302 || nextLocation == null) {
    req.log.warn({ status: res.status, reason: res.statusText }, 'Ingest:Failed:Redirect');
    return false;
  }

  const source = await fetch(nextLocation);
  if (!source.ok || source.body == null) {
    req.log.warn({ status: source.status, reason: source.statusText }, 'Ingest:Failed:Download');
    return false;
  }

  const hash = createHash('sha256');

  const zip = source.body.pipe(unzip.Parse());

  // Unzip the export and look for a geopackage
  let fileSize = 0;
  await new Promise((resolve, reject) => {
    let fileName: string | null = null;
    zip.on('entry', (e) => {
      req.log.debug({ path: e.path }, 'Export:Zip:File');
      if (!e.path.endsWith(PackageExtension)) return e.autodrain();
      if (fileName != null) return reject(`Duplicate export package: ${fileName} vs ${e.path}`);
      fileName = e.path;

      // Compress the geopackage with gzip
      const gz = e.pipe(createGzip());
      // Hash and calculate file size as it flows through
      gz.on('data', (d: Buffer) => {
        fileSize += d.length;
        hash.update(d);
      });
      fsa
        .write(targetFileUri, gz, { contentType: 'application/geopackage+vnd.sqlite3', contentEncoding: 'gzip' })
        .then(resolve)
        .catch(reject);
    });
    zip.on('error', reject);
  });

  const head = await fsa.head(targetFileUri);
  if (head == null || head.size !== fileSize) throw new Error('Failed to copy file: ' + targetFileUri);

  const checksum = '1220' + hash.digest('hex');
  req.log.info({ target: targetFileUri }, 'Ingest:Uploaded:Item');
  stacItem.assets['export'] = {
    href: `./${targetFileName}`,
    title: 'Export',
    roles: ['data'],
    type: 'application/geopackage+vnd.sqlite3',
    encoding: 'gzip',
    datetime: dataset.published_at,
    'file:checksum': checksum,
    'file:size': fileSize,
  };

  const fileInfo = { checksum, size: fileSize, id: dataset.id, version: versionId };
  req.logContext['files'] = req.logContext['files'] ?? [];
  (req.logContext['files'] as unknown[]).push(fileInfo);

  await fsa.write(itemUri, JSON.stringify(stacItem));
  req.log.info({ target: itemUri }, 'Ingest:Uploaded:StacItem');

  await fsa.write(collectionUri, JSON.stringify(collectionJson));
  req.log.info({ target: collectionUri }, 'Ingest:Uploaded:StacCollection');

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
