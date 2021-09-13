import { LogType } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
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
// async function setCache<T>(cacheId: string, obj: T): Promise<void> {
//   await fs.mkdir('.cache', { recursive: true });
//   await fs.writeFile(`.cache/${cacheId}.json`, JSON.stringify(obj));
// }

// async function getCache<T>(cacheId: string): Promise<T | null> {
//   try {
//     const data = await fs.readFile(`.cache/${cacheId}.json`);
//     return JSON.parse(data.toString());
//   } catch (e) {
//     return null;
//   }
// }

// https://data.linz.govt.nz/services/api/v1/data/?kind=vector
export class KxApi {
  endpoint = 'https://data.linz.govt.nz/services/api/v1';
  apiKey: string;

  get auth(): string {
    return `key ${this.apiKey}`;
  }

  constructor(apiKey: string) {
    console.log('NewKx', { apiKey });
    this.apiKey = apiKey;
  }

  async listDatasets(since: Date, logger: LogType): Promise<KxDataset[]> {
    const res = await this.getAll<KxDatasetList>('data', { 'updated_at.after': since.toISOString() }, logger);
    return res.map((c) => new KxDataset(this, c, logger));
  }

  async listExports(logger: LogType): Promise<KxDatasetExport[]> {
    return await this.getAll<KxDatasetExport>('exports', {}, logger);
  }

  async listDatasetVersions(datasetId: number, logger: LogType): Promise<KxDatasetVersion[]> {
    const res = await this.get(`layers/${datasetId}/versions`, {}, logger);
    return (await res.json()) as KxDatasetVersion[];
  }

  async getDatasetVersion(datasetId: number, versionId: number, logger: LogType): Promise<KxDatasetVersionDetail> {
    const res = await this.get(`layers/${datasetId}/versions/${versionId}`, {}, logger);
    return (await res.json()) as KxDatasetVersionDetail;
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
    const error = await res.json();
    logger?.error({ error, datasetId, exportName, reason: res.statusText, status: res.status }, 'Export:Failed');
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
    if (res.status === 429) {
      if (backOff > 3) throw new Error('Fetch:BackOff overflow : ' + backOff);
      logger?.info({ url }, 'Fetch:Backoff');
      await new Promise((resolve) => setTimeout(resolve, 500));
      return this.get(uri, queryString, logger, backOff + 1);
    }
    logger?.info({ url, status: res.status }, 'Fetch:Done');

    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}: ${res.statusText}`);

    return res;
  }

  private async getAll<T>(uri: string, queryString: QueryRecord = {}, logger: LogType): Promise<T[]> {
    const output: T[] = [];

    const res = await this.get(uri, queryString, logger);
    const data = await res.json();
    for (const rec of data as T[]) output.push(rec);

    const pageRange = res.headers.get('x-resource-range');
    if (pageRange == null) return output;
    const recordCount = Number(pageRange.split('/').pop());
    if (isNaN(recordCount)) throw new Error('Invalid resource-range: ' + pageRange);

    const pageCount = Math.ceil(recordCount / Number(res.headers.get('x-paginate-by')));

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
