import * as cdk from 'aws-cdk-lib';
import { CrsStack } from '../lib/stack.js';

const app = new cdk.App();
new CrsStack(app, 'ConformityReviewStudio', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-southeast-2' },
  synthesizer: new cdk.DefaultStackSynthesizer({ qualifier: 'crstudio' }),
  description: 'Conformity Review Studio showcase (ephemeral)',
});

cdk.Tags.of(app).add('Project', 'conformity-review-studio');
cdk.Tags.of(app).add('Ephemeral', 'true');
cdk.Tags.of(app).add('ManagedBy', 'cdk');
cdk.Tags.of(app).add('Owner', 'alvieirvansyah');
