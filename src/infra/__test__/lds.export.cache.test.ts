import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import o from 'ospec';

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

o.spec('LdsDataCache', () => {
  o('should have a lambda function', () => {
    const stack = new Stack();
    const lds = new LdsExportCache(stack, 'Lds');
    const synth = Template.fromStack(lds);

    const functions = findResources(synth, 'AWS::Lambda::Function');

    o(functions.length).equals(1);
    o(functions[0]!.Properties['MemorySize']).equals(2048);
    o(functions[0]!.Properties['Runtime']).equals('nodejs20.x');

    // Should have a trigger set
    const rules = findResources(synth, 'AWS::Events::Rule');
    o(rules.length).equals(1);
    o(Array.isArray(rules[0]!.Properties['Targets'])).equals(true);
    o((rules[0]!.Properties['Targets'] as Array<unknown>).length).equals(1);
  });

  o('should use the correct bucket', () => {
    process.env['CACHE_BUCKET_NAME'] = 'cache-bucket';
    const stack = new Stack();
    const lds = new LdsExportCache(stack, 'Lds');
    const synth = Template.fromStack(lds);

    // A bucket is not created
    const buckets = findResources(synth, 'AWS::S3::Bucket');
    o(buckets.length).equals(0);
  });
});
