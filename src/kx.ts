import { fsa } from '@chunkd/fs';
import { LogType } from '@linzjs/lambda';
import { mkdir } from 'fs/promises';
import fetch, { Response } from 'node-fetch';
import { GeoJSONPolygon } from 'stac-ts/src/types/geojson';
import { URLSearchParams } from 'url';
import { KxDataset } from './kx.dataset.js';

export interface KxDatasetList {
  id: number;
  url: string;
  type: string;
  title: string;
  published_at: string;
}
export interface KxDatasetExport {
  id: number;
  name: string;
  created_at: string;
  state: 'complete' | 'processing' | 'cancelled' | 'error' | 'gone';
  download_url: string;
}

export interface KxDatasetVersion {
  id: number;
  url: string;
  status: 'ok';
  created_at: string;
  reference: string;
  progress: number;
}

export interface KxDatasetVersionDetail {
  /**
   * Dataset Id
   * *This is not the version id*
   * @see this.version.id
   */
  id: number;
  url: string;
  type: 'layer';
  title: string;
  first_published_at: string;
  published_at: string;
  description: string;
  description_html: string;
  group: unknown;
  license: KxDatasetVersionDetailLicense;
  data: KxDatasetVersionDetailData;
  version: KxDatasetVersionDetailVersion;
}

export interface KxDatasetVersionDetailLicense {
  id: number;
  title: string;
  type: string;
  version: string;
}
export interface KxDatasetVersionDetailVersion {
  id: number;
  url: string;
}

export interface KxDatasetVersionDetailData {
  datasources: string;
  fields: { name: string; type: string }[];
  encoding: 'utf-8';
  crs: 'string';
  extent: GeoJSONPolygon;
  tile_revision: number;
  feature_count: number;
}

interface QueryRecord {
  [key: string]: string | number | undefined;
}

const BackOffMs = 500;
/** If we get one of these codes retry after the back off */
const RetryCodes = new Set([
  429, // Too many requests
  502, // Gateway timeout
  503, // Service unavailable
  504, // Request timed out
]);

const CacheFolder = '.cache';

async function getCached<T>(cacheId: string, fn: () => Promise<T>): Promise<T> {
  if (process.env.KX_USE_CACHE !== 'true') return fn();
  await mkdir(CacheFolder, { recursive: true });

  const cacheFileName = fsa.join(CacheFolder, cacheId);
  try {
    return await fsa.readJson(cacheFileName);
  } catch (e) {
    // Ignore
  }
  const res = await fn();
  await fsa.write(cacheFileName, JSON.stringify(res));
  return res;
}

export class KxApi {
  endpoint = 'https://data.linz.govt.nz/services/api/v1';
  apiKey: string;

  get auth(): string {
    return `key ${this.apiKey}`;
  }

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listDatasets(since: Date, logger: LogType): Promise<KxDataset[]> {
    const datasets = await getCached<KxDatasetList[]>(`list__dataset.json`, () =>
      this.getAll<KxDatasetList>('data', { 'updated_at.after': since.toISOString() }, 100, logger),
    );
    return datasets.map((c) => new KxDataset(this, c, logger));
  }

  async listExports(logger: LogType): Promise<KxDatasetExport[]> {
    return await this.getAll<KxDatasetExport>('exports', {}, 10, logger);
  }

  async listDatasetVersions(datasetId: number, logger: LogType): Promise<KxDatasetVersion[]> {
    return await getCached<KxDatasetVersion[]>(`layers__${datasetId}__versions.json`, async () => {
      const res = await this.get(`layers/${datasetId}/versions`, {}, logger);
      const json = await res.json();
      return json as KxDatasetVersion[];
    });
  }

  async getDatasetVersion(datasetId: number, versionId: number, logger: LogType): Promise<KxDatasetVersionDetail> {
    return await getCached<KxDatasetVersionDetail>(`layers__${datasetId}__versions__${versionId}.json`, async () => {
      const res = await this.get(`layers/${datasetId}/versions/${versionId}`, {}, logger);
      const json = await res.json();
      return json as KxDatasetVersionDetail;
    });
  }

  async createExport(datasetId: number, crs: string, exportName: string, logger: LogType): Promise<void> {
    const headers = { Authorization: this.auth, 'Content-Type': 'application/json' };
    const url = `${this.endpoint}/exports/`;

    const body = Buffer.from(
      JSON.stringify({
        crs,
        name: exportName,
        formats: { vector: 'application/x-ogc-gpkg' },
        items: [{ item: `${this.endpoint}/layers/${datasetId}/` }],
      }),
    );

    logger?.info({ datasetId, exportName, url }, 'Export:Create');

    const res = await fetch(url, { method: 'POST', body, headers });
    if (res.ok) return;
    const err = await res.json();
    logger?.error({ err, datasetId, exportName, reason: res.statusText, status: res.status }, 'Export:Failed');
  }

  private async get(uri: string, queryString: QueryRecord = {}, logger: LogType, backOff = 0): Promise<Response> {
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryString)) {
      if (value == null) continue;
      urlParams.append(key, String(value));
    }

    const url = `${this.endpoint}/${uri}?${urlParams.toString()}`;
    const headers = { Authorization: this.auth };

    logger?.debug({ url }, 'Fetch:Start');
    const res = await fetch(url, { headers });
    if (RetryCodes.has(res.status)) {
      if (backOff > 3) throw new Error('Fetch:BackOff overflow : ' + backOff);
      logger?.info({ backOff, url, status: res.status }, 'Fetch:BackOff');
      backOff++;
      await new Promise((resolve) => setTimeout(resolve, BackOffMs * backOff));
      return this.get(uri, queryString, logger, backOff);
    }
    logger?.info({ url, status: res.status }, 'Fetch:Done');

    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}: ${res.statusText}`);

    return res;
  }

  private async getAll<T>(uri: string, queryString: QueryRecord = {}, pageLimit = 100, logger: LogType): Promise<T[]> {
    const output: T[] = [];

    const res = await this.get(uri, queryString, logger);
    const data = await res.json();
    for (const rec of data as T[]) output.push(rec);

    const pageRange = res.headers.get('x-resource-range');
    if (pageRange == null) return output;
    const recordCount = Number(pageRange.split('/').pop());
    if (isNaN(recordCount)) throw new Error('Invalid resource-range: ' + pageRange);

    const pageCount = Math.min(pageLimit, Math.ceil(recordCount / Number(res.headers.get('x-paginate-by'))));
    if (pageCount === pageLimit) logger.warn({ count: pageCount, uri }, 'Fetch:Pages:Limit');
    logger?.info({ count: pageCount, uri }, 'Fetch:Pages');

    for (let i = 1; i < pageCount; i++) {
      logger?.debug({ page: i, uri }, 'Fetch:Page');
      const res = await this.get(uri, { ...queryString, page: i }, logger);
      const data = await res.json();
      for (const rec of data as T[]) output.push(rec);
    }

    return output;
  }
}
