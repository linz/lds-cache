import { Context } from 'aws-lambda';
import { handler } from './index.js';

// Run the handler directly as a CLI
handler({}, {} as Context, () => {
  // noop
});
