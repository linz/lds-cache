import { fsa } from '@chunkd/fs';
import { LambdaRequest } from '@linzjs/lambda';
import { createHash } from 'crypto';
import fetch from 'node-fetch';
import { createGzip } from 'zlib';
import unzipper from 'unzipper';
import { CachePrefix, kx } from './config.js';
import { KxDataset } from './kx.dataset.js';
import { KxDatasetExport } from './kx.js';
import { Stac } from './stac.js';

/** Assume geopackage */
const PackageExtension = '.gpkg';

export async function getOrCreate<T extends Record<string, unknown>>(
  uri: string,
  create: () => Promise<T>,
): Promise<T> {
  const exists = await fsa.exists(uri);
  if (exists === false) {
    const rec = await create();
    await fsa.write(uri, rec);
    return rec;
  }

  return fsa.readJson<T>(uri);
}

/** Ingest the export into our cache */
export async function ingest(req: LambdaRequest, dataset: KxDataset, ex: KxDatasetExport): Promise<boolean> {
  const datasetUri = fsa.join(CachePrefix, String(dataset.id));
  const collectionUri = fsa.join(datasetUri, 'collection.json');

  const collectionJson = await getOrCreate(collectionUri, () => Stac.createStacCollection(dataset));
  req.log.info({ datasetUri, collectionUri }, 'Ingest:CollectionJson');

  const versionId = await Stac.createDatasetId(dataset);
  const link = collectionJson?.links.find((f) => f.href.includes(versionId));
  if (link != null) {
    req.log.info({ link }, 'Ingest:Exists');
    return false;
  }

  const itemUri = fsa.join(datasetUri, versionId + '.json');
  collectionJson?.links.push({ href: `./${versionId}.json`, rel: 'item', type: 'application/json' });

  const stacItem = await Stac.createStacItem(dataset);
  const targetFileName = versionId + `${PackageExtension}.gz`;
  const targetFileUri = fsa.join(datasetUri, targetFileName);

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

  const zip = source.body.pipe(unzipper.Parse());

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

  const checksum = '1220' + hash.digest('hex');
  req.log.info({ target: targetFileUri }, 'Ingest:Uploaded:Item');
  stacItem.assets['export'] = {
    href: `./${targetFileName}`,
    title: 'Export',
    roles: ['data'],
    type: 'application/geopackage+vnd.sqlite3',
    encoding: 'gzip',
    datetime: dataset.info.published_at,
    'file:checksum': checksum,
    'file:size': fileSize,
  };

  const fileInfo = { checksum, size: fileSize, id: dataset.id, version: versionId };
  req.logContext['files'] = req.logContext['files'] ?? [];
  (req.logContext['files'] as unknown[]).push(fileInfo);

  await fsa.write(itemUri, stacItem);
  req.log.info({ target: itemUri }, 'Ingest:Uploaded:StacItem');

  await fsa.write(collectionUri, collectionJson);
  req.log.info({ target: collectionUri }, 'Ingest:Uploaded:StacCollection');

  // Update top level catalog to include a link to our collection
  const catalogUri = fsa.join(CachePrefix, 'catalog.json');
  const catalogJson = await getOrCreate(catalogUri, () => Stac.createStacCatalog());
  const existing = catalogJson.links.find((f) => f.href.endsWith(dataset.id + '/collection.json'));
  if (existing == null) {
    catalogJson.links.push({
      href: './' + dataset.id + '/collection.json',
      title: dataset.info.title,
      type: 'application/json',
      rel: 'child',
    });
    await fsa.write(catalogUri, catalogJson);
  }
  return true;
}
