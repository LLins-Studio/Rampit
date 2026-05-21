#!/usr/bin/env bash
# Deploy RampitEscrow (implementation + ERC1967 proxy) to EVM mainnets.
#
# Default: Celo, Base, and BNB Chain — skips a chain if deployer balance is too low.
# Single chain:  bash deploy-mainnet.sh celo|base|bnb
#
# Prerequisites: Foundry (forge, cast), contracts/.env (see contracts/.env.example)
#
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck disable=SC1091
source "$(dirname "$0")/../load-env.sh"

FEE_BPS="${RAMPIT_FEE_BPS:-50}"
DEPLOYER_KEY="${EVM_DEPLOYER_PRIVATE_KEY:-${CELO_DEPLOYER_PRIVATE_KEY:-}}"
ADMIN="${EVM_RAMPIT_ADMIN:-${CELO_RAMPIT_ADMIN:-}}"
RELAYER="${EVM_RAMPIT_RELAYER:-${CELO_RAMPIT_RELAYER:-}}"

if [[ -z "$ADMIN" || -z "$RELAYER" ]]; then
  echo "ERROR: Set EVM_RAMPIT_ADMIN and EVM_RAMPIT_RELAYER (or CELO_RAMPIT_*) in contracts/.env"
  exit 1
fi

if [[ -z "$DEPLOYER_KEY" && -z "${FOUNDRY_ACCOUNT:-}" ]]; then
  echo "ERROR: Set EVM_DEPLOYER_PRIVATE_KEY (or CELO_DEPLOYER_PRIVATE_KEY) in contracts/.env"
  exit 1
fi

export RAMPIT_ADMIN="$ADMIN" RAMPIT_RELAYER="$RELAYER"

DEPLOYER_ADDR=""
if [[ -n "$DEPLOYER_KEY" ]]; then
  DEPLOYER_ADDR="$(cast wallet address --private-key "$DEPLOYER_KEY")"
else
  DEPLOYER_ADDR="$(cast wallet address --account "$FOUNDRY_ACCOUNT")"
fi

echo "Deployer: $DEPLOYER_ADDR"
echo "Admin:    $ADMIN"
echo "Relayer:  $RELAYER"
echo "Fee bps:  $FEE_BPS"
echo ""

# name rpc_url chain_id explorer_url min_balance_wei
CHAINS=(
  "celo|${CELO_RPC_URL:-https://forno.celo.org}|42220|https://celoscan.io/address/|50000000000000000"
  "base|${BASE_RPC_URL:-https://mainnet.base.org}|8453|https://basescan.org/address/|50000000000000"
  "bnb|${BNB_RPC_URL:-https://bsc-dataseed.binance.org}|56|https://bscscan.com/address/|400000000000000"
)

extract_addresses() {
  local json="$1"
  python3 - <<'PY' "$json"
import json, sys
data = json.load(open(sys.argv[1]))
proxy = impl = ""
for tx in reversed(data.get("transactions", [])):
    if not impl and tx.get("contractName") == "RampitEscrow" and tx.get("transactionType") == "CREATE":
        impl = tx.get("contractAddress", "")
    if not proxy and tx.get("contractName") == "ERC1967Proxy":
        proxy = tx.get("contractAddress", "")
print(f"{proxy}\n{impl}")
PY
}

deploy_chain() {
  local name="$1" rpc="$2" chain_id="$3" explorer="$4" min_wei="$5"

  echo "=========================================="
  echo "  $name (chain id $chain_id)"
  echo "=========================================="

  local bal
  bal="$(cast balance "$DEPLOYER_ADDR" --rpc-url "$rpc")"
  local bal_eth
  bal_eth="$(cast --from-wei "$bal" ether 2>/dev/null || echo "$bal wei")"
  echo "Balance: $bal_eth"

  if [[ "$bal" -lt "$min_wei" ]]; then
    echo "SKIP: Balance below minimum for deploy on $name (have ${bal} wei, need ${min_wei} wei)."
    echo "      Fund $DEPLOYER_ADDR on $name and re-run: bash deploy-mainnet.sh $name"
    echo ""
    return 2
  fi

  local broadcast_args=(--rpc-url "$rpc" --chain-id "$chain_id" --broadcast)
  if [[ -n "$DEPLOYER_KEY" ]]; then
    broadcast_args+=(--private-key "$DEPLOYER_KEY")
  else
    broadcast_args+=(--account "$FOUNDRY_ACCOUNT")
  fi

  echo "==> Deploying RampitEscrow..."
  forge script script/DeployRampit.s.sol:DeployRampit "${broadcast_args[@]}" -vvv

  local broadcast_json="broadcast/DeployRampit.s.sol/${chain_id}/run-latest.json"
  if [[ ! -f "$broadcast_json" ]]; then
    echo "WARN: Missing $broadcast_json — check forge output above."
    echo ""
    return 1
  fi

  local addrs
  addrs="$(extract_addresses "$broadcast_json")"
  local proxy impl
  proxy="$(echo "$addrs" | sed -n '1p')"
  impl="$(echo "$addrs" | sed -n '2p')"

  echo ""
  echo "========== $name deploy complete =========="
  echo "Proxy:          $proxy"
  echo "Implementation: $impl"
  echo "Explorer:       ${explorer}${proxy}"
  echo "Record in contracts/deployments.json → evm.${name}.mainnet"
  echo ""

  DEPLOY_RESULTS+=("${name}|${chain_id}|${proxy}|${impl}|${explorer}")
  return 0
}

echo "==> Building RampitEscrow (once)"
forge build
echo ""

REQUESTED=()
if [[ $# -gt 0 ]]; then
  for arg in "$@"; do
    case "$arg" in
      celo|base|bnb) REQUESTED+=("$arg") ;;
      *)
        echo "Unknown chain: $arg (use celo, base, or bnb)"
        exit 1
        ;;
    esac
  done
fi

DEPLOY_RESULTS=()
FAILED=0
SKIPPED=0
OK=0

for entry in "${CHAINS[@]}"; do
  IFS='|' read -r name rpc chain_id explorer min_wei <<< "$entry"

  if [[ ${#REQUESTED[@]} -gt 0 ]]; then
    match=0
    for r in "${REQUESTED[@]}"; do
      [[ "$r" == "$name" ]] && match=1
    done
    [[ "$match" -eq 0 ]] && continue
  fi

  rc=0
  deploy_chain "$name" "$rpc" "$chain_id" "$explorer" "$min_wei" || rc=$?
  case "$rc" in
    0) OK=$((OK + 1)) ;;
    2) SKIPPED=$((SKIPPED + 1)) ;;
    *) FAILED=$((FAILED + 1)) ;;
  esac
done

echo "=========================================="
echo "  Summary"
echo "=========================================="
for row in "${DEPLOY_RESULTS[@]}"; do
  IFS='|' read -r name chain_id proxy impl explorer <<< "$row"
  echo "  [$name] proxy=$proxy"
done
printf 'Deployed: %s, Skipped (low balance): %s, Failed: %s\n' "$OK" "$SKIPPED" "$FAILED"

if [[ $OK -eq 0 ]]; then
  exit 1
fi
