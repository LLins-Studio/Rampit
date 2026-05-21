import { USDC_MAINNET, XLM_MAINNET } from "./config";

export type StellarPayoutToken = "USDC" | "XLM";

export type StellarTokenOption = {
  id: StellarPayoutToken;
  label: string;
  contractId: string;
  decimals: number;
};

/** Mainnet payout tokens (matches NEXT_PUBLIC_STELLAR_* mainnet config). */
export function getStellarTokenOptions(): StellarTokenOption[] {
  return [
    { id: "USDC", label: "USDC", contractId: USDC_MAINNET, decimals: 7 },
    { id: "XLM", label: "XLM", contractId: XLM_MAINNET, decimals: 7 },
  ];
}

export function tokenOptionById(id: StellarPayoutToken): StellarTokenOption {
  const opt = getStellarTokenOptions().find((t) => t.id === id);
  if (!opt) throw new Error(`Unknown token: ${id}`);
  return opt;
}
