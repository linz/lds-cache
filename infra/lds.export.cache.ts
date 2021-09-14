import { CfnOutput, Construct, Duration, Stack, StackProps } from '@aws-cdk/core';
import { BlockPublicAccess, Bucket } from '@aws-cdk/aws-s3';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Runtime } from '@aws-cdk/aws-lambda';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { execFileSync } from 'node:child_process';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';

const BucketName = process.env['CACHE_BUCKET_NAME'];

export class LdsExportCache extends Stack {
  constructor(scope?: Construct, id?: string, props?: StackProps) {
    super(scope, id, props);

    const kxApiKey = StringParameter.fromStringParameterName(this, 'KxApiKey', 'KxApiKey');

    const cacheBucket = BucketName
      ? Bucket.fromBucketName(this, 'Cache', BucketName)
      : new Bucket(this, 'Cache', { blockPublicAccess: BlockPublicAccess.BLOCK_ALL });

    const lambda = new NodejsFunction(this, 'Exporter', {
      entry: './src/index.ts',
      runtime: Runtime.NODEJS_14_X,
      timeout: Duration.minutes(10),
      memorySize: 2048,
      environment: {
        CACHE_PREFIX: `s3://${cacheBucket.bucketName}`,
        KX_API_KEY: kxApiKey.stringValue,
        GIT_HASH: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(),
        GIT_VERSION: execFileSync('git', ['describe', '--tags', '--always', '--match', 'v*']).toString().trim(),
      },
    });

    // Schedule the lambda to run every 30 minutes
    const schedule = Schedule.rate(Duration.minutes(30));
    const eventRule = new Rule(this, 'scheduleRule', { schedule });
    eventRule.addTarget(new LambdaFunction(lambda));

    cacheBucket.grantReadWrite(lambda);
    new CfnOutput(this, 'CacheBucket', { value: cacheBucket.bucketName });
  }
}
