#!/usr/bin/env bash
# Deploy RampitEscrow to Stellar testnet and initialize.
# Config: contracts/.env (see .env.example)
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck disable=SC1091
source "$(dirname "$0")/../load-env.sh"
# shellcheck disable=SC1091
source "$(dirname "$0")/lib-deploy.sh"

NETWORK="${STELLAR_NETWORK:-testnet}"
ADMIN="${RAMPIT_ADMIN:-}"
RELAYER="${RAMPIT_RELAYER:-}"
FEE_BPS="${RAMPIT_FEE_BPS:-50}"
SOURCE="$(stellar_deployer_source)"

if [[ -z "${STELLAR_SECRET_KEY:-}" ]]; then
  IDENTITY="${STELLAR_SOURCE:-rampit-deploy}"
  if ! stellar keys address "$IDENTITY" &>/dev/null; then
    stellar keys generate "$IDENTITY"
    stellar keys fund "$IDENTITY" --network "$NETWORK"
  fi
fi

DEPLOYER_ADDR="$(stellar_deployer_address)"
stellar network use "$NETWORK"

if [[ -z "$ADMIN" ]]; then
  ADMIN="$DEPLOYER_ADDR"
fi
if [[ -z "$RELAYER" ]]; then
  RELAYER="$ADMIN"
fi

stellar contract build
WASM="target/wasm32v1-none/release/rampit_escrow.wasm"

CONTRACT_ID="$(stellar contract deploy \
  --wasm "$WASM" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  --alias rampit-escrow)"

stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  -- initialize \
  --admin "$ADMIN" \
  --relayer "$RELAYER" \
  --fee_bps "$FEE_BPS"

echo "Contract: $CONTRACT_ID"
echo "Admin:    $ADMIN"
echo "Relayer:  $RELAYER"
echo "Fee bps:  $FEE_BPS"
echo "Add to contracts/.env: STELLAR_CONTRACT_ID=$CONTRACT_ID"
