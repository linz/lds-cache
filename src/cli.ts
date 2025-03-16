import { lf } from '@linzjs/lambda';
import type { Context } from 'aws-lambda';

import { handler } from './index.ts';

if (process.argv.includes('--verbose')) lf.Logger.level = 'debug';
// Run the handler directly as a CLI
handler({}, {} as Context, () => {
  // noop
});
