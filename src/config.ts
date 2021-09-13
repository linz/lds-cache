import de from 'dotenv';
import { KxApi } from './kx.js';
de.config();

const apiKey = process.env['KX_API_KEY'];
const bucket = process.env['CACHE_PREFIX'] ?? '';
if (apiKey == null) throw new Error('Missing $KX_API_KEY');
if (bucket == null) throw new Error('Missing $CACHE_PREFIX');

export const kx = new KxApi(apiKey);
export const Bucket = bucket;
export const Layers = [53353, 50327];
