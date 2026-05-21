#!/usr/bin/env bash
# Build size-optimized SBF binary for rampit-escrow-native.
set -euo pipefail
cd "$(dirname "$0")"
cargo build-sbf
SO="${CARGO_TARGET_SBF_OUT_DIR:-target/deploy}/rampit_escrow_native.so"
if [[ ! -f "$SO" ]]; then
  SO=$(find target -name 'rampit_escrow_native.so' | head -1)
fi
if [[ -f "$SO" ]]; then
  ls -lh "$SO"
  wc -c "$SO"
else
  echo "Build finished but .so not found under target/"
  find target -name '*.so' 2>/dev/null | head -5
fi
