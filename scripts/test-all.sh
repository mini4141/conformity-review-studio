#!/usr/bin/env bash
# Runs every local test layer; exits non-zero on the first failing layer. Reports land in proof/phase1-local/tests/.
# --ci: DynamoDB is provided by the CI service container, so Docker is not touched.
set -euo pipefail
. "$(dirname "$0")/env.sh"
CI_MODE=0; [ "${1:-}" = "--ci" ] && CI_MODE=1
T=proof/phase1-local/tests; L=proof/phase1-local/logs
mkdir -p "$T" "$L" .local/pids .local/logs
rm -f "$L/axe-stories.jsonl" "$L/axe-app.jsonl"

cleanup() { for n in sbstatic preview api; do stop_pid ".local/pids/$n.pid"; done; }
trap cleanup EXIT
bg() { n=$1; shift; nohup "$@" > ".local/logs/$n.log" 2>&1 & echo $! > ".local/pids/$n.pid"; }
step() { echo; echo "== $* =="; }

if [ "$CI_MODE" = 0 ] && ! docker ps --format '{{.Names}}' | grep -qx crs-ddb; then
  docker rm -f crs-ddb >/dev/null 2>&1 || true
  docker run -d --name crs-ddb -p 8000:8000 amazon/dynamodb-local:2.6.1 -jar DynamoDBLocal.jar -inMemory -sharedDb >/dev/null
fi
for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:8000 && break; sleep 1; done
[ -f data/samples/aquila-ip200-tech-file-v3.pdf ] || pnpm --filter @crs/sample-gen generate

step "typecheck + lint"
{ pnpm typecheck && pnpm lint; } 2>&1 | tee "$T/typecheck-lint.log"

step "unit + component tests (Vitest + RTL)"
pnpm --filter @crs/api exec vitest run --reporter=default --reporter=junit --outputFile.junit="../../$T/vitest-api.xml" 2>&1 | tee "$T/vitest-api.log"
pnpm --filter @crs/web exec vitest run --reporter=default --reporter=junit --outputFile.junit="../../$T/vitest-web.xml" 2>&1 | tee "$T/vitest-web.log"

step "Storybook build + interaction tests + axe"
pnpm build-storybook > "$T/storybook-build.log" 2>&1
bg sbstatic pnpm exec http-server storybook-static -p 6007 -s
wait_for http://127.0.0.1:6007/index.json 30
pnpm exec test-storybook --url http://127.0.0.1:6007 --index-json --junit 2>&1 | tee "$T/storybook-test-runner.log"
[ -f junit.xml ] && mv junit.xml "$T/storybook-junit.xml"

step "Playwright e2e + visual + perf + axe (production build)"
export PROOF_TESTS_DIR="../$T" PROOF_LOGS_DIR="../$L"
( cd e2e && pnpm exec playwright test 2>&1 ) | tee "$T/playwright.log"
node scripts/axe-summary.mjs "$L"

step "Lighthouse CI"
bg api pnpm --filter @crs/api start
pnpm --filter @crs/web build > "$T/web-build.log" 2>&1
bg preview pnpm --filter @crs/web preview
wait_for http://localhost:8787/healthz 60
wait_for http://localhost:4173/ 60
CHROME_PATH=$(cd e2e && node -e "console.log(require('@playwright/test').chromium.executablePath())") pnpm exec lhci autorun 2>&1 | tee "$T/lighthouse.log"
echo; echo "ALL LOCAL TEST LAYERS PASSED"
