import { StacCatalog, StacCollection, StacItem, StacProvider } from 'stac-ts';
import ulid from 'ulid';
import { KxDataset } from './kx.dataset.js';

const providers: StacProvider[] = [
  { name: 'Land Information New Zealand', url: 'https://www.linz.govt.nz/', roles: ['processor', 'host'] },
];

export const Stac = {
  async createDatasetId(dataset: KxDataset): Promise<string> {
    const [lastVersion] = await dataset.versions;
    return `${dataset.id}_${lastVersion.id}`;
  },

  async createStacCollection(dataset: KxDataset): Promise<StacCollection> {
    const version = await dataset.getLatestVersion();
    return {
      stac_version: '1.0.0',
      stac_extensions: [],
      type: 'Collection',
      license: `${version.license.type}  ${version.license.version}`.toUpperCase().trim(),
      id: 'sc_' + ulid.ulid(),
      title: dataset.info.title,
      description: version.description,
      extent: {
        spatial: {
          bbox: version.data.extent.bbox as any,
        },
        temporal: { interval: [[dataset.info.published_at, null]] },
      },
      links: [
        { rel: 'self', href: './collection.json', type: 'application/json' },
        { rel: 'layer', href: dataset.info.url },
      ],
      providers,
      summaries: {},
    };
  },

  async createStacItem(dataset: KxDataset, id?: string): Promise<StacItem> {
    if (id == null) id = await Stac.createDatasetId(dataset);
    const version = await dataset.getLatestVersion();
    const creationTime = new Date().toISOString();
    return {
      stac_version: '1.0.0',
      stac_extensions: ['https://stac-extensions.github.io/projection/v1.0.0/schema.json'],
      id: 'si_' + ulid.ulid(),
      collection: String(dataset.id),
      type: 'Feature',
      geometry: version.data.extent,
      properties: {
        'proj:epsg': version.data.crs,
        datetime: version.published_at,
        created: creationTime,
        'lds:id': version.id,
        'lds:version': version.version.id,
      },
      links: [
        { rel: 'self', href: `./${id}.json`, type: 'application/json' },
        { rel: 'collection', href: './collection.json', type: 'application/json' },
        { rel: 'layer', href: dataset.info.url },
        { rel: 'layer:version', href: version.version.url },
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
