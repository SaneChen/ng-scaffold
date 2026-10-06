#!/usr/bin/env bash
# Local quality gate: run it before every commit (CI runs the same steps).
# Usage: tools/verify.sh            — lint, stylelint, unit tests, production build
# Exits non-zero on the first failure and prints that step's log.
set -euo pipefail
cd "$(dirname "$0")/.."
log=$(mktemp)
trap 'rm -f "$log"' EXIT
run() {
  echo "== $1"
  shift
  "$@" >"$log" 2>&1 || { tail -60 "$log"; exit 1; }
}
run lint yarn -s lint
run lint:scss yarn -s lint:scss
run test yarn -s ng test --watch=false
grep -E "Test Files|Tests " "$log" | sed 's/\x1b\[[0-9;]*m//g' || true
run build yarn -s build
grep -E "Initial total|WARNING|▲" "$log" | sed 's/\x1b\[[0-9;]*m//g' || true
echo "== OK"
