import { Context } from 'aws-lambda';
import { handler } from './index.js';

handler({}, {} as Context, () => {
  // noop
});
