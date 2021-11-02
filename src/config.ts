import de from 'dotenv';
import { KxApi } from './kx.js';
de.config();

const apiKey = process.env['KX_API_KEY'];
const cachePrefix = process.env['CACHE_PREFIX'] ?? '';
if (apiKey == null) throw new Error('Missing $KX_API_KEY');
if (cachePrefix == null) throw new Error('Missing $CACHE_PREFIX');

export const kx = new KxApi(apiKey);
/** prefix for where to store the cache, @example `s3://bucketName/prefix` */
export const CachePrefix = cachePrefix;
/** List of Kx datasetIds to monitor and import */
const Monitor = [
  { id: 50237, name: '50237-nz-airport-polygons-topo-150k' },
  { id: 50063, name: '50063-nz-chatham-island-airport-polygons-topo-150k' },
  { id: 50333, name: '50333-nz-runway-polygons-topo-150k' },
  { id: 50103, name: '50103-nz-chatham-island-runway-polygons-topo-150k' },
  { id: 50285, name: '50285-nz-helipad-points-topo-150k' },
  { id: 50914, name: '50914-nz-kermadec-is-runway-polygons-topo-125k' },
  { id: 51002, name: '51002-nz-aerial-photo-footprints-mainland-nz-1936-2005-polygons' },
  { id: 51000, name: '51000-historic-aerial-photos-survey-footprints-crown-1936-2005' },
  { id: 50772, name: '50772-nz-primary-parcels' },
  { id: 101290, name: '101290-nz-building-outlines' },
  { id: 50768, name: '50768-nz-contours-topo-150k' },
  { id: 51153, name: '51153-nz-coastlines-and-islands-polygons-topo-150k' },
  { id: 50932, name: '50932-nz-campbell-island-motu-ihupuku-island-polygons-topo-150k' },
  { id: 50959, name: '50959-nz-auckland-island-island-polygons-topo-150k' },
  { id: 50893, name: '50893-nz-snares-island-tini-heke-island-polygons-topo-125k' },
  { id: 50908, name: '50908-nz-kermadec-is-island-polygons-topo-125k' },
  { id: 50992, name: '50992-nz-bounty-islands-polygons-topo-125k' },
  { id: 50978, name: '50978-nz-antipodes-island-polygons-topo-125k' },
  { id: 52149, name: '52149-tokelau-island-polygons-topo-125k' },
  { id: 52293, name: '52293-cook-islands-island-polygons-topo-125k-zone3' },
  { id: 52251, name: '52251-cook-islands-island-polygons-topo-125k-zone4' },
  { id: 52181, name: '52181-niue-island-polygons-topo-150k' },
  { id: 52222, name: '52222-cook-islands-island-polygons-topo-150k-zone3' },
  { id: 52203, name: '52203-cook-islands-island-polygons-topo-150k-zone4' },
];

export const Layers = new Map<number, { id: number; name: string }>();
for (const layer of Monitor) Layers.set(layer.id, layer);
