import { LambdaRequest } from '@linzjs/lambda';
import { fsa, FsS3 } from '@linzjs/s3fs';
import S3 from 'aws-sdk/clients/s3.js';
import { createHash } from 'crypto';
import { StacItem } from 'stac-ts';
import { Readable } from 'stream';
import { CachePrefix, kx } from './config.js';
import { KxDatasetExport } from './kx.js';
import { KxDataset } from './kx.dataset.js';
import { Stac } from './stac.js';
import fetch from 'node-fetch';

const s3 = new S3();
fsa.register('s3://', new FsS3(s3));

export async function readJson<T>(uri: string): Promise<T> {
  const res = await fsa.read(uri);
  return JSON.parse(res.toString());
}

export async function getOrCreate<T>(uri: string, create: () => Promise<T>): Promise<T> {
  const exists = await fsa.exists(uri);
  if (exists === false) {
    const rec = await create();
    await fsa.write(uri, Buffer.from(JSON.stringify(rec)));
    return rec;
  }

  return readJson<T>(uri);
}

/** Set the current record for a dataset to the referenced stac */
async function setCurrentRecord(req: LambdaRequest, dataset: KxDataset, item: StacItem): Promise<void> {
  const datasetUri = fsa.join(CachePrefix, String(dataset.id));
  const currentItemUri = fsa.join(datasetUri, `${dataset.id}.json`);

  const rec = await getOrCreate(currentItemUri, () => Stac.createStacItem(dataset, String(dataset.id)));

  const existingZipUri = fsa.join(datasetUri, item.assets['export'].href).replace('./', '');
  rec.assets['export'] = { ...item.assets['export'] };
  rec.id = item.id;

  req.log.info({ dataset: dataset.id, currentRecord: existingZipUri }, 'Ingest:SetCurrent');
  await fsa.write(currentItemUri, Buffer.from(JSON.stringify(rec, null, 2)));
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
  const targetFileName = `${versionId}.zip`;
  const targetFileUri = fsa.join(datasetUri, versionId + `.zip`);

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
  let fileSize = 0;
  source.body.on('data', (d) => {
    fileSize += d.length;
    hash.update(d);
  });

  await fsa.write(targetFileUri, source.body as Readable);

  const checksum = '1220' + hash.digest('hex');
  req.log.info({ target: targetFileUri }, 'Ingest:Uploaded:Item');
  stacItem.assets['export'] = {
    href: `./${targetFileName}`,
    title: 'Export',
    roles: ['data'],
    type: 'application/zip',
    datetime: dataset.info.published_at,
    'file:checksum': checksum,
    'file:size': fileSize,
  };

  const fileInfo = { checksum, size: fileSize, id: dataset.id, version: versionId };
  req.logContext['files'] = req.logContext['files'] ?? [];
  (req.logContext['files'] as unknown[]).push(fileInfo);

  await fsa.write(itemUri, Buffer.from(JSON.stringify(stacItem, null, 2)));
  req.log.info({ target: itemUri }, 'Ingest:Uploaded:StacItem');

  await setCurrentRecord(req, dataset, stacItem);

  await fsa.write(collectionUri, Buffer.from(JSON.stringify(collectionJson, null, 2)));
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
    await fsa.write(catalogUri, Buffer.from(JSON.stringify(catalogJson, null, 2)));
  }
  return true;
}
