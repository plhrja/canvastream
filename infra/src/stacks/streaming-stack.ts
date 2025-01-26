import { Construct } from 'constructs';
import { Config } from "../config";
import {
  aws_s3 as s3, 
  aws_kinesisfirehose as firehose,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_iam as iam,
  aws_cognito as cognito,
  CfnOutput, RemovalPolicy, Stack, StackProps 
} from "aws-cdk-lib";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";

export class StreamingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // S3 Bucket for Firehose intermediate storage
    const bucket = new s3.Bucket(this, 'FirehoseBucket', {
      bucketName: Config.FIREHOSE_BUCKET,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      eventBridgeEnabled: true
    });

    const backupBucket = new s3.Bucket(this, 'FirehoseBackupBucket', {
      bucketName: Config.FIREHOSE_BACKUP_BUCKET,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false
    });

    // DynamoDB Table
    const dynamoTable = new dynamodb.Table(this, 'FirehoseDynamoTable', {
      tableName: Config.DYNAMODB_TABLE,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    // Lambda Function for Firehose processing
    const firehoseProcessor = new PythonFunction(this, 'FirehoseProcessor', {
      runtime: lambda.Runtime.PYTHON_3_12,
      entry: Config.FIREHOSE_HANDLER_DIST,
      index: "firehose_handler.py",
      handler: "handler",
      environment: {
        TABLE_NAME: Config.DYNAMODB_TABLE,
      }
    });

    dynamoTable.grantReadWriteData(firehoseProcessor);

    // IAM Role for Firehose
    const firehoseRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    bucket.grantReadWrite(firehoseRole);
    backupBucket.grantReadWrite(firehoseRole);
    firehoseProcessor.grantInvoke(firehoseRole);

    // CloudWatch Logs for Firehose
    const logGroup = new logs.LogGroup(this, 'FirehoseLogGroup', {
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK
    });

    const logStream = new logs.LogStream(this, 'FirehoseLogStream', {
      logGroup
    });

    logGroup.grantWrite(firehoseRole);

    // Kinesis Firehose Delivery Stream
    const stream = new firehose.CfnDeliveryStream(this, 'FirehoseToDynamoDB', {
      deliveryStreamType: 'DirectPut',
      deliveryStreamName: Config.FIREHOSE_STREAM_NAME,
      extendedS3DestinationConfiguration: {
        bucketArn: bucket.bucketArn,
        roleArn: firehoseRole.roleArn,
        bufferingHints: {
          intervalInSeconds: 60,
          sizeInMBs: 1,
        },
        compressionFormat: 'GZIP',
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: logGroup.logGroupName,
          logStreamName: logStream.logStreamName,
        },
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: 'Lambda',
              parameters: [
                {
                  parameterName: 'LambdaArn',
                  parameterValue: firehoseProcessor.functionArn,
                },
              ],
            },
          ],
        },
        s3BackupConfiguration: {
          bucketArn: backupBucket.bucketArn,
          roleArn: firehoseRole.roleArn,
        },
      },
    });

    // Cognito Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: Config.COGNITO_ID_POOL_NAME,
      allowUnauthenticatedIdentities: true
    });

    const unauthenticatedRole = new iam.Role(this, 'UnauthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    });

    unauthenticatedRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonKinesisFirehoseFullAccess')
    );

    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoles', {
      identityPoolId: identityPool.ref,
      roles: {
        unauthenticated: unauthenticatedRole.roleArn,
      },
    });

    // Outputs
    new CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      exportName: 'FirehoseBucket',
    });
    new CfnOutput(this, 'DynamoDBTableName', {
      value: dynamoTable.tableName,
      exportName: 'DynamoDBTable',
    });
    new CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.attrId,
      exportName: 'CognitoIdentityPoolId'
    });
  }
}
