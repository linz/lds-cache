import { S3Client } from '@aws-sdk/client-s3';
import { fsa } from '@chunkd/fs';
import { FsAwsS3 } from '@chunkd/fs-aws';
import { LambdaRequest, lf } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import { StacCollection } from 'stac-ts';

import { kx, Layers } from './config.js';
import { cacheDataset } from './index.js';

fsa.register('s3://', new FsAwsS3(new S3Client()));

async function main(): Promise<void> {
  lf.Logger.level = 'trace';
  for (const layer of Layers.values()) {
    if (layer.id !== 50312) continue;
    const [s3, versions] = await Promise.all([
      fsa.readJson<StacCollection>(new URL(`s3://linz-lds-cache/${layer.id}/collection.json`)),
      kx.listDatasetVersions(layer.id, lf.Logger).catch(() => null),
    ]);

    if (versions == null) {
      lf.Logger.info({ layerId: layer.id, layerName: layer.name }, 'Layer:Missing');
      continue;
    }
    const latestVersion = versions[0]!;
    const latestLink = s3.links.at(-1)!;

    const isLatest = latestLink.href.includes(String(latestVersion.id));
    const currentVersion = latestLink.href.split('_').at(-1)?.replace('.json', '');

    if (!isLatest) {
      lf.Logger.warn(
        { layerId: layer.id, layerName: layer.name, versionId: latestVersion.id, currentVersion },
        'Layer:Version:Old',
      );
      await cacheDataset(new LambdaRequest({}, {} as Context, lf.Logger), layer.id);
    } else {
      lf.Logger.info({ layerId: layer.id, layerName: layer.name }, 'Layer:Version:Ok');
    }
  }
}

main();
