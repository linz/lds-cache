import { lf } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import { handler } from './index.js';

if (process.argv.includes('--verbose')) lf.Logger.level = 'debug';
// Run the handler directly as a CLI
handler({}, {} as Context, () => {
  // noop
});
