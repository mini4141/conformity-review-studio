#!/usr/bin/env bash
# Phase 2: deploys the showcase to AWS from this machine, seeds it, and runs smoke + e2e against CloudFront.
# Always uses the dedicated profile and region. GitHub Actions never runs this.
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1
export AWS_PROFILE=conformity-review-studio-deployer AWS_REGION=ap-southeast-2 AWS_DEFAULT_REGION=ap-southeast-2
# cloud runs must use the real profile credentials, never the local stand-ins
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN DDB_ENDPOINT DOCS_DIR

P=proof/phase2-cloud
STACK=ConformityReviewStudio
TOOLKIT=CDKToolkit-conformity-review-studio
mkdir -p "$P/logs" "$P/screenshots" "$P/tests" .local
redact() { sed -E 's/[0-9]{12}/<ACCOUNT_ID>/g'; }

aws sts get-caller-identity --query Arn --output text | redact
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

echo "== 1. bootstrap (qualifier crstudio) =="
(cd infra && cdk bootstrap "aws://$ACCOUNT/$AWS_REGION" --qualifier crstudio --toolkit-stack-name "$TOOLKIT" \
  --tags Project=conformity-review-studio --tags Ephemeral=true --tags ManagedBy=cdk --tags Owner=alvieirvansyah) 2>&1 | redact | tee "$P/logs/cdk-bootstrap.log"

echo "== 2. build web app + Storybook =="
pnpm --filter @crs/web build
pnpm build-storybook > "$P/logs/storybook-build.log" 2>&1

echo "== 3. cdk deploy =="
(cd infra && cdk deploy --require-approval never --outputs-file ../.local/cdk-outputs.json) 2>&1 | redact | tee "$P/logs/cdk-deploy.log"
out() { node -e "console.log(require('./.local/cdk-outputs.json').$STACK['$1'])"; }
CF=$(out CloudFrontUrl); DIST=$(out DistributionId); TABLE=$(out TableName); DOCS=$(out DocsBucketName); WEB=$(out WebBucketName)

echo "== 4. publish SPA + Storybook =="
aws s3 sync apps/web/dist "s3://$WEB/" --delete --exclude 'storybook/*' --only-show-errors
aws s3 sync storybook-static "s3://$WEB/storybook/" --delete --only-show-errors
aws cloudfront create-invalidation --distribution-id "$DIST" --paths '/*' --query Invalidation.Status --output text

echo "== 5. seed: upload sample PDF, analyse with Bedrock (falls back, logged) =="
bash scripts/cloud-seed.sh

echo "== 6. smoke + e2e against CloudFront =="
for i in $(seq 1 60); do curl -sf "$CF/api/healthz" >/dev/null && break; sleep 5; done
set +e # a failing cloud test must not stop the resource list, screenshots and (later) the mandatory destroy
(cd e2e && BASE_URL="$CF" PROOF_TESTS_DIR="../$P/tests/playwright-cloud" PROOF_LOGS_DIR="../$P/logs" pnpm exec playwright test 00-smoke 02-flow 03-perf) 2>&1 | redact | tee "$P/logs/playwright-cloud.log"
TEST_RC=${PIPESTATUS[0]}
BASE_URL="$CF" bash scripts/capture-proof.sh phase2 2>&1 | redact | tee -a "$P/logs/playwright-cloud.log"
set -e

echo "== 7. resources =="
{
  echo "# Deployed AWS resources (account id redacted)"; echo "# stack outputs"
  node -e "const o=require('./.local/cdk-outputs.json').$STACK; for (const k in o) console.log(k+' = '+o[k])"
  echo; echo "# CloudFormation resources"
  aws cloudformation describe-stack-resources --stack-name "$STACK" --query 'StackResources[].[ResourceType,LogicalResourceId,PhysicalResourceId,ResourceStatus]' --output text
  echo; echo "# tagged resources (Project=conformity-review-studio)"
  aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=conformity-review-studio --query 'ResourceTagMappingList[].ResourceARN' --output text | tr '\t' '\n'
} 2>&1 | redact > "$P/resources.txt"
echo "$CF" > .local/cloudfront-url.txt
echo "DEPLOYED: $CF (cloud tests exit code: ${TEST_RC:-0})"
