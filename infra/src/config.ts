
export class Config {
  static readonly ACCOUNT: string = this.strict_parse_string(process.env.ACCOUNT);
  static readonly REGION: string = process.env.REGION || 'eu-west-1'; 
  static readonly ENV: string = process.env.ENVIRONMENT || 'test';
  static readonly IS_PRODUCTION: boolean = Config.ENV === 'prod';
  static readonly ACM_CERT_ARN: string = this.strict_parse_string(process.env.ACM_CERT_ARN);
  static readonly PHZ: string = this.strict_parse_string(process.env.PHZ);
  static readonly DOMAIN: string = this.strict_parse_string(process.env.ACM_CERT_ARN);
  static readonly CLIENT_BUCKET: string = this.strict_parse_string(process.env.CLIENT_BUCKET);
  static readonly CLIENT_DIST: string = this.strict_parse_string(process.env.CLIENT_DIST);

  private static strict_parse_string(variable: string | undefined): string {
    if (variable == undefined) {
      throw new Error(`Variable ${variable} is undefined`);
    }

    return variable as string;
  }
}
