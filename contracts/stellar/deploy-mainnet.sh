#!/usr/bin/env bash
# Deploy RampitEscrow to Stellar mainnet and initialize.
# Config: contracts/.env (see .env.example)
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck disable=SC1091
source "$(dirname "$0")/../load-env.sh"
# shellcheck disable=SC1091
source "$(dirname "$0")/lib-deploy.sh"

NETWORK="${STELLAR_NETWORK:-mainnet}"
ADMIN="${RAMPIT_ADMIN:-}"
RELAYER="${RAMPIT_RELAYER:-}"
FEE_BPS="${RAMPIT_FEE_BPS:-50}"
SOURCE="$(stellar_deployer_source)"
DEPLOYER_ADDR="$(stellar_deployer_address)"

stellar network use "$NETWORK"

# Ensure mainnet Soroban RPC is configured (built-in defaults can be invalid).
if [[ "$NETWORK" == "mainnet" ]] && ! stellar network health --network mainnet &>/dev/null; then
  RPC="${STELLAR_RPC_URL:-https://mainnet.sorobanrpc.com}"
  PASS="${STELLAR_NETWORK_PASSPHRASE:-Public Global Stellar Network ; September 2015}" # bash default; .env must use quotes
  stellar network rm mainnet 2>/dev/null || true
  stellar network add mainnet --rpc-url "$RPC" --network-passphrase "$PASS"
fi

if [[ "$NETWORK" != "mainnet" ]]; then
  echo "ERROR: deploy-mainnet.sh requires STELLAR_NETWORK=mainnet (got ${NETWORK})."
  exit 1
fi

if ! stellar_check_funded "$DEPLOYER_ADDR"; then
  echo "ERROR: Deployer (${DEPLOYER_ADDR}) is not funded on mainnet."
  echo "Send at least ~15 XLM, then re-run."
  exit 1
fi

if [[ -z "$ADMIN" ]]; then
  ADMIN="$DEPLOYER_ADDR"
fi
if [[ -z "$RELAYER" ]]; then
  RELAYER="$ADMIN"
fi

stellar contract build
WASM="target/wasm32v1-none/release/rampit_escrow.wasm"

stellar_rpc_args

CONTRACT_ID="$(stellar contract deploy \
  --wasm "$WASM" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  "${RPC_ARGS[@]}" \
  --alias rampit-escrow-mainnet)"

stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  "${RPC_ARGS[@]}" \
  -- initialize \
  --admin "$ADMIN" \
  --relayer "$RELAYER" \
  --fee_bps "$FEE_BPS"

echo "Contract: $CONTRACT_ID"
echo "Admin:    $ADMIN"
echo "Relayer:  $RELAYER"
echo "Fee bps:  $FEE_BPS"
echo "Add to contracts/.env: STELLAR_CONTRACT_ID=$CONTRACT_ID"
