#!/usr/bin/env bash
set -uo pipefail
. "$(dirname "$0")/env.sh"
for n in storybook web api; do stop_pid ".local/pids/$n.pid"; done
docker rm -f crs-ddb >/dev/null 2>&1 || true
echo "stopped"
