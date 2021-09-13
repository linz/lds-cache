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
export const Layers = [53353, 50327];
