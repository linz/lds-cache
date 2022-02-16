import { LambdaRequest, lf } from '@linzjs/lambda';
import { kx, Layers } from './config.js';
import { AwsEventBridgeBus } from './event.bus.js';
import * as Storage from './storage.js';

const OneDayMs = 24 * 60 * 60 * 1000;

const ChangeDurationDays = Number(process.env['KX_CHANGE_DAYS'] ?? NaN);
/** Fetch the last 7 days of changes */
const TimeAgoMs = isNaN(ChangeDurationDays) ? 7 * OneDayMs : ChangeDurationDays * OneDayMs;
/** Limit to 5 exports at a time */

const MaxExportsEnv = Number(process.env['KX_MAX_EXPORTS'] ?? NaN);
const MaxExports = isNaN(MaxExportsEnv) ? 5 : MaxExportsEnv;

async function main(req: LambdaRequest): Promise<void> {
  const datasetAge = new Date(new Date(Date.now() - TimeAgoMs).toISOString().slice(0, 10));
  const [datasets, exports] = await Promise.all([kx.listDatasets(datasetAge, req.log), kx.listExports(req.log)]);

  let exportsInProgress = 0;
  for (const e of exports) if (e.state === 'processing') exportsInProgress++;

  const eb = new AwsEventBridgeBus();

  const exportIds: number[] = [];
  const ingestIds: number[] = [];
  let datasetCount = 0;
  let exportSkipped = 0;

  const seen = new Set<number>();
  for (const dataset of datasets) {
    // Not watching this dataset ignore
    if (!Layers.has(dataset.id)) continue;

    // Datasets can be in this list multiple times
    if (seen.has(dataset.id)) continue;
    seen.add(dataset.id);

    datasetCount++;
    req.log.info({ datasetId: dataset.id, updatedAt: dataset.info.published_at }, 'Dataset:Fetch');
    const [latestVersion] = await dataset.versions;
    const exportName = `${dataset.id}-${latestVersion.id}-gpkg`;

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
          await eb.putDatasetIngestedEvent(req, dataset);
        }
        break;
      }
    }
    if (!isExportedNeeded) continue;

    if (exportsInProgress >= MaxExports) {
      req.log.warn(
        { datasetId: dataset.id, version: latestVersion.id, exports: exportsInProgress },
        'Export:Skip - Too many in progress',
      );
      exportSkipped++;
      continue;
    }
    const version = await dataset.getLatestVersion();
    await kx.createExport(dataset.id, version.data.crs, exportName + '-' + req.id.slice(-4), req.log);
    exportIds.push(dataset.id);
    exportsInProgress++;
  }
  if (exportsInProgress > 0) req.set('exportsInProgress', exportsInProgress);

  if (exportIds.length > 0) req.set('exports', exportIds);
  if (ingestIds.length > 0) req.set('ingests', ingestIds);
  req.set('exportCount', exportIds.length);
  req.set('exportSkippedCount', exportSkipped);

  req.set('datasetCount', datasetCount);
}

export const handler = lf.handler(main);
