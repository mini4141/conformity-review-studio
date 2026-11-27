#!/usr/bin/env bash
# Phase 3 check: exits non-zero if anything billable from this project still exists.
# Each service is checked with a direct call; the tagging API is informational (it lags for minutes after deletion).
set -uo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1
export AWS_PROFILE=conformity-review-studio-deployer AWS_REGION=ap-southeast-2 AWS_DEFAULT_REGION=ap-southeast-2
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
OUT=${1:-proof/phase3-destroy/verify-destroyed.txt}
mkdir -p "$(dirname "$OUT")"
redact() { sed -E 's/[0-9]{12}/<ACCOUNT_ID>/g'; }
fail=0
{
  echo "verify-destroyed: $(date -u +%FT%TZ)"
  check() { # label, output (empty = gone)
    if [ -z "$2" ] || [ "$2" = None ]; then echo "OK    $1: none"; else echo "FOUND $1: $2"; fail=1; fi
  }
  for s in ConformityReviewStudio CDKToolkit-conformity-review-studio; do
    st=$(aws cloudformation describe-stacks --stack-name "$s" --query 'Stacks[0].StackStatus' --output text 2>/dev/null)
    check "CloudFormation stack $s" "$st"
  done
  check "CloudFront distributions" "$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='conformity-review-studio'].Id" --output text 2>/dev/null)"
  check "API Gateway HTTP APIs" "$(aws apigatewayv2 get-apis --query "Items[?Name=='conformity-review-studio'].ApiId" --output text 2>/dev/null)"
  check "Lambda functions" "$(aws lambda list-functions --query "Functions[?starts_with(FunctionName,'ConformityReviewStudio')].FunctionName" --output text 2>/dev/null)"
  check "DynamoDB tables" "$(aws dynamodb list-tables --query "TableNames[?contains(@,'ConformityReviewStudio')]" --output text 2>/dev/null)"
  check "S3 buckets" "$(aws s3api list-buckets --query "Buckets[?contains(Name,'conformityreviewstudio') || contains(Name,'crstudio')].Name" --output text 2>/dev/null)"
  check "CloudWatch log groups" "$(aws logs describe-log-groups --log-group-name-prefix /aws/lambda/ConformityReviewStudio --query 'logGroups[].logGroupName' --output text 2>/dev/null)"
  check "ECR repositories" "$(aws ecr describe-repositories --query "repositories[?contains(repositoryName,'crstudio')].repositoryName" --output text 2>/dev/null)"
  check "IAM roles" "$(aws iam list-roles --query "Roles[?starts_with(RoleName,'ConformityReviewStudio') || contains(RoleName,'cdk-crstudio')].RoleName" --output text 2>/dev/null)"
  check "SSM bootstrap parameter" "$(aws ssm describe-parameters --parameter-filters Key=Name,Values=/cdk-bootstrap/crstudio/version --query 'Parameters[].Name' --output text 2>/dev/null)"
  echo "--- tagging API (informational; may lag after deletion) ---"
  for r in ap-southeast-2 us-east-1; do
    echo "region $r: $(aws resourcegroupstaggingapi get-resources --region $r --tag-filters Key=Project,Values=conformity-review-studio --query 'ResourceTagMappingList[].ResourceARN' --output text 2>/dev/null | tr '\t' ' ')"
  done
  [ "$fail" = 0 ] && echo "RESULT: nothing billable remains" || echo "RESULT: resources still exist"
  exit $fail
} 2>&1 | redact | tee "$OUT"
exit "${PIPESTATUS[0]}"
