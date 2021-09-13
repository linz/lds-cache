import { CfnOutput, Construct, Duration, Stack, StackProps } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Runtime } from '@aws-cdk/aws-lambda';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { execFileSync } from 'node:child_process';

export class LdsDataCache extends Stack {
  constructor(scope?: Construct, id?: string, props?: StackProps) {
    super(scope, id, props);

    const kxApiKey = StringParameter.fromStringParameterName(this, 'KxApiKey', 'KxApiKey');

    const cacheBucket = new Bucket(this, 'Cache', {});

    const lambda = new NodejsFunction(this, 'Exporter', {
      entry: './src/index.ts',
      runtime: Runtime.NODEJS_14_X,
      timeout: Duration.minutes(5),
      memorySize: 2048,
      environment: {
        CACHE_PREFIX: `s3://${cacheBucket.bucketName}`,
        KX_API_KEY: kxApiKey.stringValue,
        GIT_HASH: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(),
        GIT_VERSION: execFileSync('git', ['describe', '--tags', '--always', '--match', 'v*']).toString().trim(),
      },
    });

    cacheBucket.grantReadWrite(lambda);
    new CfnOutput(this, 'CacheBucket', { value: cacheBucket.bucketName });
  }
}
