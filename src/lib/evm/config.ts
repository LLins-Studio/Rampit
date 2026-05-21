import type { RampitChain } from "@/lib/rampit/chain";

export const EVM_ESCROW_PROXY =
  process.env.NEXT_PUBLIC_EVM_ESCROW_PROXY ??
  "0x748c312bb1bfa8ff24820c16d11757177d57ed3c";

const RPC: Record<"celo" | "base" | "bnb", string> = {
  celo: process.env.NEXT_PUBLIC_CELO_RPC_URL ?? "https://forno.celo.org",
  base: process.env.NEXT_PUBLIC_BASE_RPC_URL ?? "https://mainnet.base.org",
  bnb: process.env.NEXT_PUBLIC_BNB_RPC_URL ?? "https://bsc-dataseed.binance.org",
};

export function getEvmRpcUrl(chain: "celo" | "base" | "bnb"): string {
  return RPC[chain];
}

export function getEvmExplorer(chain: RampitChain, address: string): string {
  switch (chain) {
    case "celo":
      return `https://celoscan.io/address/${address}`;
    case "base":
      return `https://basescan.org/address/${address}`;
    case "bnb":
      return `https://bscscan.com/address/${address}`;
    default:
      return address;
  }
}

export function getEvmTxExplorer(chain: RampitChain, hash: string): string {
  switch (chain) {
    case "celo":
      return `https://celoscan.io/tx/${hash}`;
    case "base":
      return `https://basescan.org/tx/${hash}`;
    case "bnb":
      return `https://bscscan.com/tx/${hash}`;
    default:
      return hash;
  }
}

/** Server-only relayer key for EVM txs. */
export function getEvmRelayerPrivateKey(): `0x${string}` {
  const key =
    process.env.EVM_RELAYER_PRIVATE_KEY ??
    process.env.CELO_DEPLOYER_PRIVATE_KEY;
  if (!key?.startsWith("0x")) {
    throw new Error("EVM_RELAYER_PRIVATE_KEY is not configured");
  }
  return key as `0x${string}`;
}

export function getAdminApiSecret(): string {
  return process.env.ADMIN_API_SECRET ?? "";
}
