#!/usr/bin/env bash
# Sourced by the other scripts: local defaults from .env.example, overridden by .env.
cd "$(dirname "${BASH_SOURCE[0]}")/.."
set -a
. ./.env.example
[ -f .env ] && . ./.env
set +a
export MSYS_NO_PATHCONV=1
wait_for() { # url, seconds
  for _ in $(seq 1 "${2:-60}"); do curl -sf "$1" >/dev/null 2>&1 && return 0; sleep 1; done
  echo "timeout waiting for $1" >&2; return 1
}
stop_pid() {
  [ -f "$1" ] || return 0
  pid=$(cat "$1"); rm -f "$1"
  if command -v taskkill >/dev/null 2>&1; then taskkill //PID "$pid" //T //F >/dev/null 2>&1 || true; else kill "$pid" 2>/dev/null || true; fi
}
