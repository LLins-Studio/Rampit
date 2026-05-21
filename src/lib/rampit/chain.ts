export type RampitChain = "stellar" | "celo" | "base" | "bnb";

export const RAMPIT_CHAINS: {
  id: RampitChain;
  label: string;
  nativeSymbol: string;
}[] = [
  { id: "stellar", label: "Stellar", nativeSymbol: "XLM" },
  { id: "celo", label: "Celo", nativeSymbol: "CELO" },
  { id: "base", label: "Base", nativeSymbol: "ETH" },
  { id: "bnb", label: "BNB Chain", nativeSymbol: "BNB" },
];

export function isEvmChain(chain: RampitChain): chain is "celo" | "base" | "bnb" {
  return chain !== "stellar";
}
