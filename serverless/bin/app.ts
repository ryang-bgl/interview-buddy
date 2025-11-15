#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { InterviewBuddyApiStack } from '../lib/interview-buddy-api-stack';

const app = new App();
const sharedEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const contextStages = app.node.tryGetContext('stages') ?? app.node.tryGetContext('stage');
const stages = normalizeStages(contextStages);

stages.forEach((stage) => {
  new InterviewBuddyApiStack(app, `InterviewBuddyApiStack-${stage}`, {
    env: sharedEnv,
    stage,
  });
});

function normalizeStages(value: unknown): string[] {
  if (!value) {
    return ['dev'];
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  const stringValue = String(value);
  if (stringValue.includes(',')) {
    return stringValue.split(',').map((stage) => stage.trim()).filter(Boolean);
  }
  return [stringValue];
}
