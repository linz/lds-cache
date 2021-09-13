import { lf } from '@linzjs/lambda';
// lf.Logger.level = 'trace';

import { Context } from 'aws-lambda';
import { kx } from './config.js';
import { handler } from './index.js';
import { KxApi } from './kx.js';

handler({}, {} as Context, () => {
  // noop
});

// async function main(): Promise<void> {
//   const versions = await kx.listDatasetVersions(53353, lf.Logger);
//   console.log(versions[0]);
// }
// main();
