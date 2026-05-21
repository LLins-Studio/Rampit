import type { RampitChain } from "@/lib/rampit/chain";

import { NATIVE_TOKEN_ADDRESS } from "./constants";

export type EvmPayoutToken = "USDC" | "NATIVE";

export type EvmTokenOption = {
  id: EvmPayoutToken;
  label: string;
  hint: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
};

const TOKENS_BY_CHAIN: Record<"celo" | "base" | "bnb", EvmTokenOption[]> = {
  celo: [
    {
      id: "USDC",
      label: "USDC",
      hint: "Stablecoin",
      address: "0xcebA9300f2b948710d2653dD7B07f33A8b32118",
      decimals: 6,
      isNative: false,
    },
    {
      id: "NATIVE",
      label: "CELO",
      hint: "Native CELO (sent as tx value)",
      address: NATIVE_TOKEN_ADDRESS,
      decimals: 18,
      isNative: true,
    },
  ],
  base: [
    {
      id: "USDC",
      label: "USDC",
      hint: "Stablecoin",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913",
      decimals: 6,
      isNative: false,
    },
    {
      id: "NATIVE",
      label: "ETH",
      hint: "Native ETH on Base (sent as tx value)",
      address: NATIVE_TOKEN_ADDRESS,
      decimals: 18,
      isNative: true,
    },
  ],
  bnb: [
    {
      id: "USDC",
      label: "USDC",
      hint: "Stablecoin",
      address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      decimals: 18,
      isNative: false,
    },
    {
      id: "NATIVE",
      label: "BNB",
      hint: "Native BNB (sent as tx value)",
      address: NATIVE_TOKEN_ADDRESS,
      decimals: 18,
      isNative: true,
    },
  ],
};

export function getEvmTokenOptions(chain: "celo" | "base" | "bnb"): EvmTokenOption[] {
  return TOKENS_BY_CHAIN[chain];
}

export function getDefaultEvmToken(chain: "celo" | "base" | "bnb"): EvmTokenOption {
  return TOKENS_BY_CHAIN[chain][0];
}
