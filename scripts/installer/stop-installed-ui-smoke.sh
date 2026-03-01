#!/usr/bin/env bash
set -euo pipefail

STATE_FILE="/tmp/nextclaw-installer-ui/last-session.env"

if [[ ! -f "${STATE_FILE}" ]]; then
  echo "[installer-ui] no active session state found: ${STATE_FILE}"
  exit 0
fi

# shellcheck disable=SC1090
source "${STATE_FILE}"

if [[ -z "${NEXTCLAW_BIN:-}" || -z "${HOME:-}" ]]; then
  echo "[installer-ui] invalid state file: ${STATE_FILE}"
  exit 1
fi

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
if [[ "${RUN_MODE:-installer-bin}" == "installer-bin" ]]; then
  if [[ ! -x "${NEXTCLAW_BIN}" ]]; then
    echo "[installer-ui] nextclaw binary not found: ${NEXTCLAW_BIN}"
    exit 1
  fi
  STOP_CMD=("${NEXTCLAW_BIN}" stop)
else
  if [[ -z "${NODE_BIN:-}" || -z "${CLI_JS:-}" ]]; then
    echo "[installer-ui] invalid local-cli state in ${STATE_FILE}"
    exit 1
  fi
  if [[ ! -x "${NODE_BIN}" || ! -f "${CLI_JS}" ]]; then
    echo "[installer-ui] local-cli state target missing: NODE_BIN=${NODE_BIN} CLI_JS=${CLI_JS}"
    exit 1
  fi
  STOP_CMD=("${NODE_BIN}" "${CLI_JS}" stop)
fi

if ! "${STOP_CMD[@]}" >/tmp/nextclaw-installer-ui/stop.log 2>&1; then
  echo "[installer-ui] stop command reported error, see /tmp/nextclaw-installer-ui/stop.log"
  exit 1
fi

echo "[installer-ui] stopped session on port ${PORT:-unknown}"
