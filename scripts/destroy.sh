#!/usr/bin/env bash
# Phase 3: tears everything down. Idempotent and safe to re-run: every step tolerates "already gone".
set -uo pipefail
cd "$(dirname "$0")/.."
exec > >(sed -u -E 's/[0-9]{12}/<ACCOUNT_ID>/g') 2>&1   # never print the account id
export MSYS_NO_PATHCONV=1
export AWS_PROFILE=conformity-review-studio-deployer AWS_REGION=ap-southeast-2 AWS_DEFAULT_REGION=ap-southeast-2
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN DDB_ENDPOINT DOCS_DIR
STACK=ConformityReviewStudio
TOOLKIT=CDKToolkit-conformity-review-studio
redact() { sed -E 's/[0-9]{12}/<ACCOUNT_ID>/g'; }
ACCOUNT=$(aws sts get-caller-identity --query Account --output text) || { echo "no credentials"; exit 1; }

stack_exists() { aws cloudformation describe-stacks --stack-name "$1" >/dev/null 2>&1; }
empty_bucket() { # handles versioned buckets (the CDK staging bucket) too
  aws s3api head-bucket --bucket "$1" >/dev/null 2>&1 || return 0
  echo "emptying $1"
  aws s3 rm "s3://$1" --recursive --only-show-errors
  for _ in $(seq 1 50); do
    payload=$(aws s3api list-object-versions --bucket "$1" --max-items 500 --output json --query '{Objects: [Versions,DeleteMarkers][][].{Key:Key,VersionId:VersionId}}' 2>/dev/null)
    case "$payload" in *'"Key"'*) ;; *) return 0 ;; esac
    aws s3api delete-objects --bucket "$1" --delete "$payload" >/dev/null
  done
}

echo "== empty app buckets (they would block the stack delete) =="
if stack_exists "$STACK"; then
  for key in WebBucketName DocsBucketName; do
    b=$(aws cloudformation describe-stacks --stack-name "$STACK" --query "Stacks[0].Outputs[?OutputKey=='$key'].OutputValue" --output text)
    [ -n "$b" ] && [ "$b" != None ] && empty_bucket "$b"
  done
fi

echo "== cdk destroy --all --force =="
if stack_exists "$STACK"; then
  (cd infra && cdk destroy --all --force) 2>&1 | redact
  aws cloudformation wait stack-delete-complete --stack-name "$STACK" 2>/dev/null || true
else
  echo "stack $STACK already gone"
fi

echo "== toolkit stack, staging bucket, ECR repo, version parameter =="
STAGING="cdk-crstudio-assets-$ACCOUNT-$AWS_REGION"
empty_bucket "$STAGING"
aws ecr delete-repository --repository-name "cdk-crstudio-container-assets-$ACCOUNT-$AWS_REGION" --force >/dev/null 2>&1 && echo "deleted ECR repo"
if stack_exists "$TOOLKIT"; then
  aws cloudformation delete-stack --stack-name "$TOOLKIT"
  aws cloudformation wait stack-delete-complete --stack-name "$TOOLKIT" 2>/dev/null || true
fi
aws s3api head-bucket --bucket "$STAGING" >/dev/null 2>&1 && aws s3api delete-bucket --bucket "$STAGING" && echo "deleted staging bucket"
aws ssm delete-parameter --name /cdk-bootstrap/crstudio/version >/dev/null 2>&1 && echo "deleted ssm parameter"
echo "destroy finished"
