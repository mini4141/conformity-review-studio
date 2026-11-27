#!/usr/bin/env bash
# Seeds the deployed stack: uploads the sample PDF to S3 and analyses it into DynamoDB.
# Provider order: Bedrock Claude (BEDROCK_MODEL_ID) -> another Bedrock model (BEDROCK_FALLBACK_MODEL_ID) -> rules.
# The first one that answers a probe is used; every fallback is logged.
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1
export AWS_PROFILE=conformity-review-studio-deployer AWS_REGION=ap-southeast-2 AWS_DEFAULT_REGION=ap-southeast-2
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN DDB_ENDPOINT DOCS_DIR
P=proof/phase2-cloud
STACK=ConformityReviewStudio
mkdir -p "$P/logs"
redact() { sed -E 's/[0-9]{12}/<ACCOUNT_ID>/g'; }
out() { node -e "console.log(require('./.local/cdk-outputs.json').$STACK['$1'])"; }
TABLE=$(out TableName); DOCS=$(out DocsBucketName)

CLAUDE=${BEDROCK_MODEL_ID:-$(grep -E '^BEDROCK_MODEL_ID=' .env.example | cut -d= -f2 | cut -d' ' -f1)}
OTHER=${BEDROCK_FALLBACK_MODEL_ID:-apac.amazon.nova-lite-v1:0}
probe() { aws bedrock-runtime converse --model-id "$1" --messages '[{"role":"user","content":[{"text":"ping"}]}]' --inference-config '{"maxTokens":5}' >/dev/null 2>"$P/logs/.probe.err"; }

PROVIDER=rules; MODEL=none
: > "$P/logs/bedrock-fallback.log"
if probe "$CLAUDE"; then
  PROVIDER=bedrock; MODEL=$CLAUDE
else
  { echo "Claude model $CLAUDE is not enabled for this account:"; cat "$P/logs/.probe.err"; } | redact >> "$P/logs/bedrock-fallback.log"
  if probe "$OTHER"; then
    PROVIDER=bedrock; MODEL=$OTHER
    echo "Using $OTHER through the same Bedrock Converse provider instead." >> "$P/logs/bedrock-fallback.log"
  else
    { echo "Fallback model $OTHER unavailable too:"; cat "$P/logs/.probe.err"; echo "Using the rules provider."; } | redact >> "$P/logs/bedrock-fallback.log"
  fi
fi
rm -f "$P/logs/.probe.err"
echo "provider=$PROVIDER model=$MODEL"
SEED_SAMPLE_OUT="$(pwd -W 2>/dev/null || pwd)/$P/logs/bedrock-findings-sample.json" TABLE_NAME=$TABLE DOCS_BUCKET=$DOCS LLM_PROVIDER=$PROVIDER BEDROCK_MODEL_ID=$MODEL \
  pnpm --filter @crs/api seed 2>&1 | redact | tee "$P/logs/cloud-seed.log"
