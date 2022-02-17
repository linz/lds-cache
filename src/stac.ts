import { Wgs84 } from '@linzjs/geojson';
import { StacCatalog, StacCollection, StacItem, StacProvider } from 'stac-ts';
import ulid from 'ulid';
import { KxDatasetVersionDetail } from './kx.js';

const providers: StacProvider[] = [
  { name: 'Land Information New Zealand', url: 'https://www.linz.govt.nz/', roles: ['processor', 'host'] },
];

export const Stac = {
  async createDatasetId(datasetId: number, versionId: number): Promise<string> {
    return `${datasetId}_${versionId}`;
  },

  getLicense(dataset: KxDatasetVersionDetail): string {
    if (dataset.license == null) return 'CC-BY-4.0';
    return `${dataset.license.type} ${dataset.license.version}`.toUpperCase().trim().replace(/ /g, '-');
  },

  async createStacCollection(dataset: KxDatasetVersionDetail): Promise<StacCollection> {
    return {
      stac_version: '1.0.0',
      stac_extensions: [],
      type: 'Collection',
      license: Stac.getLicense(dataset),
      id: 'sc_' + ulid.ulid(),
      title: dataset.title,
      description: dataset.description,
      extent: {
        spatial: {
          bbox: [Wgs84.ringToBbox(dataset.data.extent.coordinates[0] as [number, number][])],
        },
        temporal: { interval: [[dataset.published_at, null]] },
      },
      links: [
        { rel: 'self', href: './collection.json', type: 'application/json' },
        { rel: 'layer', href: dataset.url },
      ],
      providers,
      summaries: {},
    };
  },

  async createStacItem(dataset: KxDatasetVersionDetail, id?: string): Promise<StacItem> {
    if (id == null) id = await Stac.createDatasetId(dataset.id, dataset.version.id);
    const creationTime = new Date().toISOString();
    return {
      stac_version: '1.0.0',
      stac_extensions: ['https://stac-extensions.github.io/projection/v1.0.0/schema.json'],
      id: 'si_' + ulid.ulid(),
      collection: String(dataset.id),
      type: 'Feature',
      geometry: dataset.data.extent,
      bbox: Wgs84.ringToBbox(dataset.data.extent.coordinates[0] as [number, number][]),
      properties: {
        'proj:epsg': Number(dataset.data.crs.slice(dataset.data.crs.indexOf(':') + 1)),
        datetime: dataset.published_at,
        created: creationTime,
        'lds:id': dataset.id,
        'lds:version': dataset.version.id,
      },
      links: [
        { rel: 'self', href: `./${id}.json`, type: 'application/json' },
        { rel: 'collection', href: './collection.json', type: 'application/json' },
        { rel: 'layer', href: dataset.url },
        { rel: 'layer:version', href: dataset.version.url },
      ],
      assets: {},
    };
  },

  async createStacCatalog(): Promise<StacCatalog> {
    return {
      stac_version: '1.0.0',
      stac_extensions: [],
      type: 'Catalog',
      title: 'LDS Data Cache',
      description: 'Cache of data exported from LINZ dataservice',
      id: 'sl_' + ulid.ulid(),
      links: [{ rel: 'self', href: './catalog.json', type: 'application/json' }],
    };
  },
};
