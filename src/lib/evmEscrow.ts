// This file is superseded by src/lib/evm/client.ts which uses the real ABI and viem.
// Re-export from the canonical implementation to avoid duplication.
export { evmGetOrder as getOrder, evmReleaseOrder as releaseOrder, evmRefundOrder as refundOrder, type EvmChainKey as EvmNetwork } from "@/lib/evm/client";
