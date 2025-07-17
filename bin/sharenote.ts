#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ShareNoteStack } from '../lib/sharenote-stack';

const app = new cdk.App();

const environment = process.env.CDK_ENV || 'dev';
const account = process.env.CDK_ACCOUNT;
const region = process.env.CDK_REGION || 'ap-northeast-1';

// 新しいAlexaスキル「共有手帳」用のスタック
new ShareNoteStack(app, `sharenote-${environment}`, {
  env: { account, region },
  projectName: 'sharenote',
  environment: environment,
});