import { Construct } from 'constructs';
import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as redshift from 'aws-cdk-lib/aws-redshiftserverless';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Config } from "../config";
import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";

export class StreamingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // S3 Bucket for Firehose intermediate storage
    const bucket = new s3.Bucket(this, 'FirehoseBucket', {
      bucketName: Config.REDSHIFT_BUCKET,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false
    });

    const backupBucket = new s3.Bucket(this, 'FirehoseBackupBucket', {
      bucketName: Config.REDSHIFT_BUCKET,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false
    });

    // Create a VPC for Redshift
    const vpc = new ec2.Vpc(this, 'RedshiftVpc', {
      maxAzs: 3
    });

    // Redshift Serverless Workgroup and Namespace
    const namespace = new redshift.CfnNamespace(this, 'RedshiftNamespace', {
      namespaceName: Config.REDSHIFT_NS,
      adminUsername: Config.REDSHIFT_ADMIN_USERNAME,
      adminUserPassword: Config.REDSHIFT_ADMIN_PW,
      dbName: Config.REDSHIFT_DB
    });

    const workgroup = new redshift.CfnWorkgroup(this, 'RedshiftWorkgroup', {
      workgroupName: Config.REDSHIFT_WG,
      namespaceName: namespace.namespaceName,
      publiclyAccessible: true,
      baseCapacity: Config.REDSHIFT_CAPACITY,
      subnetIds: vpc.privateSubnets.map(s => s.subnetId)
    });

    // IAM Role for Firehose
    const firehoseRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    bucket.grantReadWrite(firehoseRole);
    backupBucket.grantReadWrite(firehoseRole);

    firehoseRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'redshift-data:ExecuteStatement',
          'redshift-data:BatchExecuteStatement',
        ],
        resources: ['*'], // Replace with specific resource ARN for tighter security
      })
    );

    // Kinesis Data Firehose Delivery Stream
    const stream = new firehose.CfnDeliveryStream(this, 'FirehoseToRedshift', {
      deliveryStreamType: 'DirectPut',
      deliveryStreamName: Config.FIREHOSE_STREAM_NAME,
      redshiftDestinationConfiguration: {
        clusterJdbcurl: `jdbc:redshift-serverless://${workgroup.workgroupName}.${namespace.namespaceName}.redshift-serverless.amazonaws.com:5439/dev`,
        copyCommand: {
          dataTableName: Config.REDSHIFT_DB,
          dataTableColumns: 'id, timestamp, coordinate_x, coordinate_y, is_drawing',
          // copyOptions: "FORMAT AS JSON 'auto'",
        },
        password: Config.REDSHIFT_ADMIN_USERNAME,
        username: Config.REDSHIFT_ADMIN_PW,
        roleArn: firehoseRole.roleArn,
        s3BackupConfiguration: {
          bucketArn: backupBucket.bucketArn,
          roleArn: firehoseRole.roleArn
        },
        s3Configuration: {
          bucketArn: bucket.bucketArn,
          roleArn: firehoseRole.roleArn,
          bufferingHints: {
            intervalInSeconds: 60,
            sizeInMBs: 1,
          },
          compressionFormat: "GZIP"
        }
      }
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
    });
    new CfnOutput(this, 'RedshiftNamespace', {
      value: namespace.namespaceName,
    });
    new CfnOutput(this, 'IdentityPool', {
      value: identityPool.attrId,
    });
  }
}
