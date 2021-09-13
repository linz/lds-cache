import { LambdaRequest, lf } from '@linzjs/lambda';
import { kx, Layers } from './config.js';
import * as Storage from './storage.js';

async function main(req: LambdaRequest): Promise<void> {
  const lastWeek = new Date(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [datasets, exports] = await Promise.all([kx.listDatasets(lastWeek, req.log), kx.listExports(req.log)]);

  const toWatch = new Set(Layers);

  const exportIds: number[] = [];
  const ingestIds: number[] = [];
  let datasetCount = 0;

  const seen = new Set<number>();
  for (const dataset of datasets) {
    if (seen.has(dataset.id)) continue;
    seen.add(dataset.id);
    if (!toWatch.has(dataset.id)) continue;
    datasetCount++;
    req.log.info({ datasetId: dataset.id, updatedAt: dataset.info.published_at }, 'Dataset:Fetch');
    const [latestVersion] = await dataset.versions;
    const exportName = `${dataset.id}-${latestVersion.id}`;

    const datasetExports = exports.filter((f) => f.name.startsWith(`lds-${exportName}`));

    req.log.info(
      { datasetId: dataset.id, updatedAt: dataset.info.published_at, count: datasetExports.length },
      'Dataset:Exports',
    );

    let isExportedNeeded = true;
    for (const ex of datasetExports) {
      if (ex.state === 'processing') {
        req.log.info({ datasetId: dataset.id, version: latestVersion.id }, 'Export:Processing');
        isExportedNeeded = false;
        break;
      }
      if (ex.state === 'complete') {
        req.log.info({ datasetId: dataset.id, version: latestVersion.id }, 'Export:Done');
        isExportedNeeded = false;
        if (await Storage.ingest(req, dataset, ex)) {
          ingestIds.push(dataset.id);
        }
        break;
      }
    }
    if (!isExportedNeeded) continue;

    const version = await dataset.getLatestVersion();
    await kx.createExport(dataset.id, version.data.crs, exportName + '-' + req.id.slice(-4), req.log);
    exportIds.push(dataset.id);
  }
  if (exportIds.length > 0) req.set('exports', exportIds);
  if (ingestIds.length > 0) req.set('ingests', ingestIds);
  req.set('exportCount', exportIds.length);
  req.set('datasetCount', datasetCount);
}

export const handler = lf.handler(main);
