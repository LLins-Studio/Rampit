#!/usr/bin/env bash
# Deploy rampit-escrow to Solana mainnet-beta and initialize escrow state.
#
# Prerequisites:
#   - solana-cli, anchor CLI installed
#   - Deployer keypair with ~3+ SOL (deploy cost varies by program size)
#   - Default wallet: ~/.config/solana/id.json (override with SOLANA_KEYPAIR)
#
# Optional env (or contracts/.env):
#   RAMPIT_FEE_BPS=50
#   RAMPIT_RELAYER=<pubkey>  # if different from deployer; calls set_relayer after init
#
set -euo pipefail
cd "$(dirname "$0")"

if [[ -f ../.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source ../.env
  set +a
fi

FEE_BPS="${RAMPIT_FEE_BPS:-50}"
KEYPAIR="${SOLANA_KEYPAIR:-${SOLANA_WALLET:-$HOME/.config/solana/id.json}}"
ANCHOR_WALLET="${ANCHOR_WALLET:-$KEYPAIR}"
export ANCHOR_WALLET

echo "==> Building program"
anchor build
anchor keys sync

DEPLOYER="$(solana address -k "$KEYPAIR")"
echo "Deployer: $DEPLOYER"

solana config set --url mainnet-beta
solana config set --keypair "$KEYPAIR"

BAL="$(solana balance | awk '{print $1}')"
echo "Balance: $BAL SOL"
if awk "BEGIN { exit !($BAL < 2) }"; then
  echo "ERROR: Need at least ~2–3 SOL on mainnet for program deploy. Fund: $DEPLOYER"
  exit 1
fi

echo "==> Deploying to mainnet-beta"
anchor deploy --provider.cluster mainnet --provider.wallet "$KEYPAIR"

PROGRAM_ID="$(anchor keys list | awk '/rampit_escrow/ {print $2}')"
echo "Program ID: $PROGRAM_ID"

echo "==> Initializing escrow state (admin + relayer = deployer, fee ${FEE_BPS} bps)"
export ANCHOR_PROVIDER_URL="https://api.mainnet-beta.solana.com"
export ANCHOR_WALLET="$KEYPAIR"

npx ts-node --transpile-only scripts/initialize.ts "$FEE_BPS"

if [[ -n "${RAMPIT_RELAYER:-}" && "${RAMPIT_RELAYER}" != "$DEPLOYER" ]]; then
  echo "==> Setting relayer to $RAMPIT_RELAYER"
  npx ts-node --transpile-only scripts/set-relayer.ts "$RAMPIT_RELAYER"
fi

STATE_PDA="$(npx ts-node --transpile-only scripts/print-state-pda.ts)"

echo ""
echo "========== Mainnet deploy complete =========="
echo "Program:  $PROGRAM_ID"
echo "State:    $STATE_PDA"
echo "Admin:    $DEPLOYER"
echo "Relayer:  ${RAMPIT_RELAYER:-$DEPLOYER}"
echo "Fee bps:  $FEE_BPS"
echo ""
echo "Add to contracts/deployments.json and app env when you wire Solana UI."
