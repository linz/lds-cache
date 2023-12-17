import de from 'dotenv';
de.config();

import { App } from 'aws-cdk-lib';

import { LdsExportCache } from './lds.export.cache.js';

const app = new App();

new LdsExportCache(app, 'LdsExporter', { env: { region: 'ap-southeast-2' } });
