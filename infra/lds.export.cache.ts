import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { execFileSync } from 'node:child_process';
import { EventBus, Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export class LdsExportCache extends Stack {
  constructor(scope?: Construct, id?: string, props?: StackProps) {
    super(scope, id, props);
    const isProduction = process.env['NODE_ENV'] === 'production';
    const BucketName = process.env['CACHE_BUCKET_NAME'];

    const kxApiKey = StringParameter.fromStringParameterName(this, 'KxApiKey', 'KxApiKey');

    const cacheBucket = BucketName
      ? Bucket.fromBucketName(this, 'Cache', BucketName)
      : new Bucket(this, 'Cache', {
          blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
          lifecycleRules: [{ abortIncompleteMultipartUploadAfter: Duration.days(14) }],
        });
    const eventBus = new EventBus(this, 'ImportedEventBus', {});

    const lambda = new NodejsFunction(this, 'Exporter', {
      entry: './src/index.ts',
      runtime: Runtime.NODEJS_16_X,
      timeout: Duration.minutes(10),
      memorySize: 2048,
      environment: {
        CACHE_PREFIX: `s3://${cacheBucket.bucketName}`,
        KX_API_KEY: kxApiKey.stringValue,
        EVENT_BUS_ARN: eventBus.eventBusArn,
        KX_CHANGE_DAYS: '30',
        GIT_HASH: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(),
        GIT_VERSION: execFileSync('git', ['describe', '--tags', '--always', '--match', 'v*']).toString().trim(),
      },
    });

    // Schedule the lambda to run every 30 minutes
    const schedule = Schedule.rate(isProduction ? Duration.minutes(30) : Duration.hours(6));
    const eventRule = new Rule(this, 'scheduleRule', { schedule });
    eventRule.addTarget(new LambdaFunction(lambda));

    cacheBucket.grantReadWrite(lambda);
    new CfnOutput(this, 'CacheBucket', { value: cacheBucket.bucketName });

    // now you can just call methods on the event bus
    eventBus.grantPutEventsTo(lambda);
  }
}
