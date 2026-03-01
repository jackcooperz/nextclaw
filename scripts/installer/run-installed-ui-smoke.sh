#!/usr/bin/env bash
set -euo pipefail

NEXTCLAW_BIN="${NEXTCLAW_BIN:-/Applications/NextClaw/nextclaw}"
STATE_DIR="/tmp/nextclaw-installer-ui"
STATE_FILE="${STATE_DIR}/last-session.env"
LOG_DIR="${STATE_DIR}/logs"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOCAL_CLI="${REPO_ROOT}/packages/nextclaw/dist/cli/index.js"
LOCAL_NODE_BIN="$(command -v node 2>/dev/null || true)"
LOCAL_PNPM_BIN="$(command -v pnpm 2>/dev/null || true)"
REQUIRE_INSTALLER_BIN="${NEXTCLAW_REQUIRE_INSTALLER_BIN:-0}"

mkdir -p "${STATE_DIR}" "${LOG_DIR}"

choose_port() {
  if [[ -n "${NEXTCLAW_UI_PORT:-}" ]]; then
    echo "${NEXTCLAW_UI_PORT}"
    return 0
  fi

  local start=20000
  local end=39999
  local attempts=120
  local port

  for _ in $(seq 1 "${attempts}"); do
    port=$((RANDOM % (end - start + 1) + start))
    if command -v lsof >/dev/null 2>&1; then
      if lsof -iTCP:"${port}" -sTCP:LISTEN -t >/dev/null 2>&1; then
        continue
      fi
      echo "${port}"
      return 0
    fi
    if command -v nc >/dev/null 2>&1; then
      if nc -z 127.0.0.1 "${port}" >/dev/null 2>&1; then
        continue
      fi
      echo "${port}"
      return 0
    fi
    echo "${port}"
    return 0
  done

  echo "[installer-ui] failed to find a free UI port in ${start}-${end}"
  return 1
}

PORT="$(choose_port)"
SESSION_ID="$(date +%s)"
TEST_HOME="${STATE_DIR}/home-${SESSION_ID}"
START_LOG="${LOG_DIR}/start-${SESSION_ID}.log"

mkdir -p "${TEST_HOME}"
export HOME="${TEST_HOME}"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

RUN_MODE=""
NODE_BIN=""
CLI_JS=""

if [[ -x "${NEXTCLAW_BIN}" ]]; then
  RUN_MODE="installer-bin"
else
  if [[ "${REQUIRE_INSTALLER_BIN}" == "1" ]]; then
    echo "[installer-ui] installer binary is required but not found: ${NEXTCLAW_BIN}"
    exit 1
  fi
  if [[ -z "${LOCAL_NODE_BIN}" ]]; then
    echo "[installer-ui] nextclaw installer binary not found: ${NEXTCLAW_BIN}"
    echo "[installer-ui] and local node is unavailable, cannot run fallback CLI."
    exit 1
  fi
  if [[ ! -f "${LOCAL_CLI}" ]]; then
    if [[ -z "${LOCAL_PNPM_BIN}" ]]; then
      echo "[installer-ui] local CLI dist missing: ${LOCAL_CLI}"
      echo "[installer-ui] pnpm not found, cannot auto-build fallback CLI."
      exit 1
    fi
    "${LOCAL_PNPM_BIN}" -C "${REPO_ROOT}/packages/nextclaw" build >/dev/null
  fi
  if [[ ! -f "${LOCAL_CLI}" ]]; then
    echo "[installer-ui] failed to prepare fallback CLI: ${LOCAL_CLI}"
    exit 1
  fi
  RUN_MODE="local-cli"
  NODE_BIN="${LOCAL_NODE_BIN}"
  CLI_JS="${LOCAL_CLI}"
fi

run_nextclaw() {
  if [[ "${RUN_MODE}" == "installer-bin" ]]; then
    "${NEXTCLAW_BIN}" "$@"
    return
  fi
  "${NODE_BIN}" "${CLI_JS}" "$@"
}

run_nextclaw init --force >/dev/null 2>&1

if ! run_nextclaw start --ui-port "${PORT}" >"${START_LOG}" 2>&1; then
  echo "[installer-ui] failed to start nextclaw"
  sed -n '1,120p' "${START_LOG}"
  exit 1
fi

cat >"${STATE_FILE}" <<EOF
RUN_MODE=${RUN_MODE}
NEXTCLAW_BIN=${NEXTCLAW_BIN}
HOME=${TEST_HOME}
PORT=${PORT}
START_LOG=${START_LOG}
NODE_BIN=${NODE_BIN}
CLI_JS=${CLI_JS}
EOF

echo "RUN_MODE=${RUN_MODE}"
echo "UI_URL=http://127.0.0.1:${PORT}"
echo "START_LOG=${START_LOG}"
echo "STOP_CMD=pnpm installer:verify:ui:stop"
