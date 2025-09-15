import assert from 'node:assert';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';

import { HashTransform } from '@chunkd/fs/build/src/hash.stream.js';
import type { LogType } from '@linzjs/lambda';
import { ZipFile } from 'yazl';

describe('StorageTest', () => {
  it('should unzip geopackage file', async () => {
    process.env['KX_API_KEY'] = 'test';
    const { extractAndWritePackage } = await import('../storage.ts');

    const zipFile = new ZipFile();
    zipFile.addBuffer(Buffer.from('hello'), 'test.gpkg');
    zipFile.end();

    const stream = Readable.from(zipFile.outputStream);
    const targetFileUri = new URL('file:///tmp/output.gpkg');
    const ht = new HashTransform('sha256');
    const datasetId = 0;
    const log: Partial<LogType> = {
      debug: () => {},
      info: () => {},
    };

    await extractAndWritePackage(stream, targetFileUri, ht, datasetId, log as LogType);

    const expectedHash = createHash('sha256').update('hello').digest('hex');
    assert.strictEqual(ht.digestHex, expectedHash);
  });
});
