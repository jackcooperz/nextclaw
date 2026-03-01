#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[e2e] step 1/2: verify node mirror bootstrap logic"
"${ROOT_DIR}/run-docker-smoke.sh"

echo "[e2e] step 2/2: verify nextclaw functional flow"
"${ROOT_DIR}/run-docker-nextclaw-smoke.sh"

echo "[e2e] all installer docker checks passed"
