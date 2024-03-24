import { App, Tags } from 'aws-cdk-lib';

import { getGitBuildInfo } from './build.js';
import { LdsExportCache } from './lds.export.cache.js';

const app = new App();

const lambda = new LdsExportCache(app, 'LdsExporter', { env: { region: 'ap-southeast-2' } });

Tags.of(lambda).add('linz:app:name', 'lds-cache');
Tags.of(lambda).add('linz:app:version', getGitBuildInfo().version);
Tags.of(lambda).add('linz:environment', 'prod');
Tags.of(lambda).add('linz:git:hash', getGitBuildInfo().hash);
if (process.env['GITHUB_REPOSITORY']) Tags.of(lambda).add('linz:git:repository', process.env['GITHUB_REPOSITORY']);
Tags.of(lambda).add('linz:security:classification', 'unclassified');
Tags.of(lambda).add('linz:build:id', getGitBuildInfo().buildId);
