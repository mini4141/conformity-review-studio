#!/usr/bin/env bash
# Starts DynamoDB Local (Docker), seeds, then the API (:8787), Vite (:5173) and Storybook (:6006).
set -euo pipefail
. "$(dirname "$0")/env.sh"
mkdir -p .local/logs .local/pids
if ! docker ps --format '{{.Names}}' | grep -qx crs-ddb; then
  docker rm -f crs-ddb >/dev/null 2>&1 || true
  docker run -d --name crs-ddb -p 8000:8000 amazon/dynamodb-local:2.6.1 -jar DynamoDBLocal.jar -inMemory -sharedDb >/dev/null
fi
for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:8000 && break; sleep 1; done
bash scripts/seed.sh
start() { # name, command...
  n=$1; shift
  nohup "$@" > ".local/logs/$n.log" 2>&1 &
  echo $! > ".local/pids/$n.pid"
}
start api pnpm --filter @crs/api start
wait_for http://localhost:8787/healthz 60
start web pnpm --filter @crs/web dev
[ "${NO_STORYBOOK:-0}" = 1 ] || start storybook pnpm exec storybook dev -p 6006 --ci --no-open
wait_for http://localhost:5173/ 60
echo "up: web http://localhost:5173  api http://localhost:8787/healthz  storybook http://localhost:6006"
