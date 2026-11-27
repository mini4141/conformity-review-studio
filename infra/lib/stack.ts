import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

export class CrsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- data: single DynamoDB table + private documents bucket ---------------------------------
    const table = new ddb.Table(this, 'Table', {
      partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
      sortKey: { name: 'sk', type: ddb.AttributeType.STRING },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: ddb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: ddb.AttributeType.STRING },
    });

    const docs = new s3.Bucket(this, 'DocsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // scripts/destroy.sh empties it first
      cors: [{ allowedMethods: [s3.HttpMethods.GET], allowedOrigins: ['*'], allowedHeaders: ['*'], maxAge: 3000 }],
    });
    const web = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // --- API: Hono on Lambda behind an HTTP API ---------------------------------------------------
    const logGroup = new logs.LogGroup(this, 'ApiLogs', { retention: logs.RetentionDays.ONE_DAY, removalPolicy: cdk.RemovalPolicy.DESTROY });
    const fn = new NodejsFunction(this, 'Api', {
      entry: `${ROOT}apps/api/src/lambda.ts`,
      depsLockFilePath: `${ROOT}pnpm-lock.yaml`,
      projectRoot: ROOT,
      runtime: lambda.Runtime.NODEJS_24_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(25), // HTTP API integrations cap at 30 s
      logGroup,
      environment: { TABLE_NAME: table.tableName, DOCS_BUCKET: docs.bucketName, LLM_PROVIDER: 'rules', NODE_OPTIONS: '--enable-source-maps' },
      bundling: {
        format: OutputFormat.ESM,
        target: 'node24',
        mainFields: ['module', 'main'],
        banner: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
        minify: true,
        sourceMap: true,
      },
    });
    table.grantReadWriteData(fn);
    docs.grantReadWrite(fn);
    fn.addToRolePolicy(new iam.PolicyStatement({ actions: ['bedrock:InvokeModel'], resources: ['*'] }));

    const httpApi = new apigw.HttpApi(this, 'HttpApi', { apiName: 'conformity-review-studio', description: 'Conformity Review Studio API' });
    httpApi.addRoutes({ path: '/{proxy+}', methods: [apigw.HttpMethod.ANY], integration: new HttpLambdaIntegration('ApiIntegration', fn) });

    // --- CloudFront: SPA + Storybook at /storybook/ from S3, /api/* to API Gateway ------------------
    const dirIndex = new cloudfront.Function(this, 'DirIndex', {
      code: cloudfront.FunctionCode.fromInline("function handler(event){var r=event.request;if(r.uri.endsWith('/')){r.uri+='index.html';}return r;}"),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });
    const apiOrigin = new origins.HttpOrigin(`${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`, { protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY });
    const dist = new cloudfront.Distribution(this, 'Cdn', {
      comment: 'conformity-review-studio',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(web),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [{ function: dirIndex, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST }],
      },
      additionalBehaviors: {
        '/api/*': {
          origin: apiOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.seconds(0) },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.seconds(0) },
      ],
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', { value: `https://${dist.distributionDomainName}` });
    new cdk.CfnOutput(this, 'DistributionId', { value: dist.distributionId });
    new cdk.CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, 'TableName', { value: table.tableName });
    new cdk.CfnOutput(this, 'DocsBucketName', { value: docs.bucketName });
    new cdk.CfnOutput(this, 'WebBucketName', { value: web.bucketName });
    new cdk.CfnOutput(this, 'FunctionName', { value: fn.functionName });
  }
}
