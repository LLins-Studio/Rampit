#!/usr/bin/env bash
# Shared helpers for Stellar deploy scripts (sourced, not executed).

stellar_deployer_address() {
  if [[ -n "${STELLAR_SECRET_KEY:-}" ]]; then
    local tmp="__rampit_deploy_tmp"
    stellar keys rm "$tmp" 2>/dev/null || true
    # --secret-key reads from stdin (no value argument)
    printf '%s\n' "$STELLAR_SECRET_KEY" | stellar keys add "$tmp" --secret-key --overwrite >/dev/null
    stellar keys address "$tmp"
    stellar keys rm "$tmp" >/dev/null
  else
    stellar keys address "${STELLAR_SOURCE:-rampit-deploy}"
  fi
}

stellar_deployer_source() {
  if [[ -n "${STELLAR_SECRET_KEY:-}" ]]; then
    printf '%s' "$STELLAR_SECRET_KEY"
  else
    printf '%s' "${STELLAR_SOURCE:-rampit-deploy}"
  fi
}

stellar_horizon_base() {
  case "${STELLAR_NETWORK:-testnet}" in
    mainnet) echo "https://horizon.stellar.org" ;;
    testnet) echo "https://horizon-testnet.stellar.org" ;;
    *) echo "https://horizon-testnet.stellar.org" ;;
  esac
}

stellar_check_funded() {
  local addr="$1"
  local horizon
  horizon="$(stellar_horizon_base)"
  curl -sf "${horizon}/accounts/${addr}" >/dev/null
}

# Populate RPC_ARGS array from contracts/.env (optional overrides).
stellar_rpc_args() {
  RPC_ARGS=()
  if [[ -n "${STELLAR_RPC_URL:-}" ]]; then
    RPC_ARGS+=(--rpc-url "$STELLAR_RPC_URL")
  fi
  if [[ -n "${STELLAR_NETWORK_PASSPHRASE:-}" ]]; then
    RPC_ARGS+=(--network-passphrase "$STELLAR_NETWORK_PASSPHRASE")
  fi
}
