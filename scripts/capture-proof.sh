#!/usr/bin/env bash
# Usage: scripts/capture-proof.sh phase1|phase2   (phase2 needs BASE_URL = the CloudFront URL)
set -euo pipefail
. "$(dirname "$0")/env.sh"
phase=${1:?usage: capture-proof.sh phase1|phase2}
case "$phase" in
  phase1)
    dir=proof/phase1-local
    mkdir -p "$dir/screenshots" "$dir/logs" .local/pids .local/logs
    [ -d storybook-static ] || pnpm build-storybook > "$dir/logs/storybook-build.log" 2>&1
    nohup pnpm exec http-server storybook-static -p 6007 -s > .local/logs/sbstatic.log 2>&1 &
    echo $! > .local/pids/sbstatic.pid
    trap 'stop_pid .local/pids/sbstatic.pid' EXIT
    wait_for http://127.0.0.1:6007/index.json 30
    bash scripts/seed.sh > "$dir/logs/seed.log" 2>&1
    (cd e2e && CAPTURE=phase1 PROOF_SHOTS_DIR="../$dir/screenshots" PROOF_TESTS_DIR=../.local/capture-report pnpm exec playwright test capture.spec.ts)
    for n in api web; do
      [ -f ".local/logs/$n.log" ] && sed -E 's/[0-9]{12}/<ACCOUNT_ID>/g' ".local/logs/$n.log" > "$dir/logs/$n.log"
    done
    ;;
  phase2)
    : "${BASE_URL:?set BASE_URL to the CloudFront URL}"
    dir=proof/phase2-cloud
    mkdir -p "$dir/screenshots" "$dir/logs" "$dir/tests"
    (cd e2e && BASE_URL="$BASE_URL" CAPTURE=phase2 PROOF_SHOTS_DIR="../$dir/screenshots" PROOF_TESTS_DIR=../.local/capture-report pnpm exec playwright test capture.spec.ts)
    ;;
  *) echo "unknown phase" >&2; exit 2 ;;
esac
echo "captured $phase -> $dir/screenshots"
