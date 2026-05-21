#!/usr/bin/env bash
# Source contracts/.env if present (used by deploy scripts).
CONTRACTS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "${CONTRACTS_ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${CONTRACTS_ROOT}/.env"
  set +a
fi
