import { Configuration } from 'webpack';
import * as webpack from 'webpack';

// Load environment variables
const AWS_IDENTITY_POOL: string | undefined = process.env["IDENTITY_POOL"];
const AWS_REGION: string | undefined = process.env["REGION"];
const AWS_FIREHOSE_STREAM: string | undefined = process.env["FIREHOSE_STREAM_NAME"];

const config: Configuration = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.AWS_IDENTITY_POOL': JSON.stringify(AWS_IDENTITY_POOL),
      'process.env.AWS_REGION': JSON.stringify(AWS_REGION),
      'process.env.AWS_FIREHOSE_STREAM': JSON.stringify(AWS_FIREHOSE_STREAM),
    }),
  ],
};

export default config;
