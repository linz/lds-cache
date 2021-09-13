import { LogType } from '@linzjs/lambda';
import { KxApi, KxDatasetVersion, KxDatasetList, KxDatasetVersionDetail } from './kx';

/**
 * Caching wrapper for a kx dataset
 */
export class KxDataset {
  kx: KxApi;
  info: KxDatasetList;
  logger: LogType;

  /** Get the dataset id */
  get id(): number {
    return this.info.id;
  }

  constructor(kx: KxApi, dataset: KxDatasetList, logger: LogType) {
    this.kx = kx;
    this.info = dataset;
    this.logger = logger;
  }

  /** Get the most recent version of this dataset */
  async getLatestVersion(): Promise<KxDatasetVersionDetail> {
    const [lastVersion] = await this.versions;
    return this.getVersion(lastVersion.id);
  }

  _versions: Promise<KxDatasetVersion[]> | null;
  /** List last 100 versions of the dataset */
  get versions(): Promise<KxDatasetVersion[]> {
    if (this._versions == null) this._versions = this.kx.listDatasetVersions(this.info.id, this.logger);
    return this._versions;
  }

  _versionDetail: Map<number, Promise<KxDatasetVersionDetail>> = new Map();
  /** Lookup a specific version */
  getVersion(versionId: number): Promise<KxDatasetVersionDetail> {
    let existing = this._versionDetail.get(versionId);
    if (existing == null) {
      existing = this.kx.getDatasetVersion(this.info.id, versionId, this.logger);
      this._versionDetail.set(versionId, existing);
    }
    return existing;
  }
}
