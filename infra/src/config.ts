
export class Config {
  static readonly ACCOUNT: string = this.strict_parse_string(process.env.ACCOUNT);
  static readonly REGION: string = process.env.REGION || 'eu-west-1'; 
  static readonly ENV: string = process.env.ENVIRONMENT || 'test';
  static readonly IS_PRODUCTION: boolean = Config.ENV === 'prod';
  static readonly ACM_CERT_ARN: string = this.strict_parse_string(process.env.ACM_CERT_ARN);
  static readonly PHZ: string = this.strict_parse_string(process.env.PHZ);
  static readonly DOMAIN: string = this.strict_parse_string(process.env.DOMAIN);
  static readonly CLIENT_BUCKET: string = this.strict_parse_string(process.env.CLIENT_BUCKET);
  static readonly CLIENT_DIST: string = this.strict_parse_string(process.env.CLIENT_DIST);
  static readonly FIREHOSE_BUCKET: string = this.strict_parse_string(process.env.FIREHOSE_BUCKET);
  static readonly FIREHOSE_BACKUP_BUCKET: string = this.strict_parse_string(process.env.FIREHOSE_BACKUP_BUCKET);
  static readonly FIREHOSE_HANDLER_DIST: string = this.strict_parse_string(process.env.FIREHOSE_HANDLER_DIST);
  static readonly DYNAMODB_TABLE: string = this.strict_parse_string(process.env.DYNAMODB_TABLE);
  static readonly FIREHOSE_STREAM_NAME: string = this.strict_parse_string(process.env.FIREHOSE_STREAM_NAME);
  static readonly COGNITO_ID_POOL_NAME: string = this.strict_parse_string(process.env.COGNITO_ID_POOL_NAME);

  private static strict_parse_string(variable: string | undefined): string {
    if (variable == undefined) {
      throw new Error(`Variable ${variable} is undefined`);
    }

    return variable as string;
  }
}
