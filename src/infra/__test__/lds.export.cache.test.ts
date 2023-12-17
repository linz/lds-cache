import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import {describe, it} from 'node:test';
import assert from 'node:assert'

import { LdsExportCache } from '../lds.export.cache.js';

export interface Resource extends Record<string, unknown> {
  Name: string;
  Type: string;
  Properties: Record<string, unknown>;
  DependsOn?: string[];
}

function findResources(stack: Template, resource: string): Resource[] {
  const output: Resource[] = [];
  for (const [key, value] of Object.entries(stack.toJSON()['Resources'])) {
    const res = value as Omit<Resource, 'Name'>;
    if (res['Type'] === resource) output.push({ Name: key, ...res } as Resource);
  }

  return output;
}

describe('LdsDataCache', () => {
  it('should have a lambda function', () => {
    const stack = new Stack();
    const lds = new LdsExportCache(stack, 'Lds');
    const synth = Template.fromStack(lds);

    const functions = findResources(synth, 'AWS::Lambda::Function');

    assert.equal(functions.length,1);
    assert.equal(functions[0]?.Properties['MemorySize'],2048);
    assert.equal(functions[0]?.Properties['Runtime'],'nodejs20.x');

    // Should have a trigger set
    const rules = findResources(synth, 'AWS::Events::Rule');
    assert.equal(rules.length,1);
    assert.equal(Array.isArray(rules[0]!.Properties['Targets']),true);
    assert.equal((rules[0]?.Properties['Targets'] as Array<unknown>).length,1);
  });

  it('should use the correct bucket', () => {
    process.env['CACHE_BUCKET_NAME'] = 'cache-bucket';
    const stack = new Stack();
    const lds = new LdsExportCache(stack, 'Lds');
    const synth = Template.fromStack(lds);

    // A bucket is not created
    const buckets = findResources(synth, 'AWS::S3::Bucket');
    assert.equal(buckets.length,0);
  });
});
