import { App } from '@aws-cdk/core';
import { LdsDataCache } from './lds.export.cache.js';

const app = new App();

new LdsDataCache(app, 'LdsExporter', { env: { region: 'ap-southeast-2' } });
