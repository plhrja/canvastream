#!/usr/bin/env node
import { App, StackProps } from "aws-cdk-lib";
import { ClientStack } from './stacks/client-stack';
import { Config } from "./config";

const app = new App();
const props: StackProps = {
  env: {
    account: Config.ACCOUNT,
    region: Config.REGION
  }
}
new ClientStack(app, 'ClientStack', props);