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

const eb = new AwsEventBridgeBus();

async function cacheDataset(req: LambdaRequest, datasetId: number): Promise<void> {
  const [latestVersion] = await kx.listDatasetVersions(datasetId, req.log);
  // Could not find the dataset ignore
  if (latestVersion == null) {
    req.log.warn({ datasetId }, 'Export:Failed:Missing');
    return;
  }
  // Latest version already exists in the cache
  const existingFiles = await Storage.listStacFiles();
  const existing = existingFiles.find((f) => f.endsWith(`${datasetId}_${latestVersion.id}.json`));
  if (existing != null) {
    req.log.debug({ datasetId, version: latestVersion.id }, 'Export:Exists');
    return;
  }

  const datasetVersion = await kx.getDatasetVersion(datasetId, latestVersion.id, req.log);
  const exportName = `${datasetId}-${latestVersion.id}-gpkg`;

  const datasetExports = await kx.listExports(req.log);
  for (const ex of datasetExports) {
    if (!ex.name.includes(exportName)) continue;
    // Dataset is currently exporting ignore
    if (ex.state === 'processing') {
      req.log.info({ datasetId, version: latestVersion.id }, 'Export:Processing');
      return;
    }
    // dataset has been exported attempt to ingest
    if (ex.state === 'complete') {
      req.log.info({ datasetId, version: latestVersion.id }, 'Export:Done');
      if (await Storage.ingest(req, datasetVersion, ex)) await eb.putDatasetIngestedEvent(req, datasetVersion);
      return;
    }
  }

  if (kx.exportsInProgress >= MaxExports) {
    req.log.warn(
      { datasetId, version: latestVersion.id, exports: kx.exportsInProgress },
      'Export:Skip - Too many in progress',
    );
    return;
  }
  // Export the dataset
  await kx.createExport(datasetId, datasetVersion.data.crs, exportName + '-' + req.id.slice(-4), req.log);
}

// Force update all layers in the cache
async function forceUpdate(req: LambdaRequest): Promise<void> {
  req.log.info({ datasetCount: Layers.size }, 'Export:Forced');
  for (const layer of Layers.values()) await cacheDataset(req, layer.id);
  req.set('datasetCount', String(Layers.size));
}

// Look for layers that have changed recently then update them
async function exportLatest(req: LambdaRequest): Promise<void> {
  const datasetAge = new Date(new Date(Date.now() - TimeAgoMs).toISOString().slice(0, 10));
  const datasets = await kx.listDatasets(datasetAge, req.log);

  let datasetCount = 0;

  const seen = new Set<number>();
  for (const dataset of datasets) {
    // Not watching this dataset ignore
    if (!Layers.has(dataset.id)) continue;

    // Datasets can be in this list multiple times
    if (seen.has(dataset.id)) continue;
    seen.add(dataset.id);

    datasetCount++;
    await cacheDataset(req, dataset.id);
  }

  req.set('datasetCount', datasetCount);
}

async function main(req: LambdaRequest): Promise<void> {
  eb.reset();
  kx.reset();
  if (TimeAgoMs === 0) {
    await forceUpdate(req); // Force a full update
  } else {
    await exportLatest(req); // Update since
  }

  const events = eb.events.map((c) => c.datasetId);

  if (kx._exportsInProgress > 0) req.set('exportsInProgress', kx.exportsInProgress);
  if (kx.exports.length > 0) req.set('exports', kx.exports);
  if (events.length > 0) req.set('events', events);
}

export const handler = lf.handler(main);
