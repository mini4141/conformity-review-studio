#!/usr/bin/env bash
# Loads demo data: 25 queue files, the sample PDF and its analysed findings. Idempotent (resets the local table).
set -euo pipefail
. "$(dirname "$0")/env.sh"
[ -f data/samples/aquila-ip200-tech-file-v3.pdf ] || pnpm --filter @crs/sample-gen generate
pnpm --filter @crs/api seed
