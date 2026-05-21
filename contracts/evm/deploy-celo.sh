#!/usr/bin/env bash
# Deploy to Celo mainnet only. For all chains use deploy-mainnet.sh
set -euo pipefail
exec "$(dirname "$0")/deploy-mainnet.sh" celo
