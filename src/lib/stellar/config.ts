/** Stellar / Soroban configuration (client-safe + server-only accessors). */

export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_STELLAR_CONTRACT_ID ?? "";

export const RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://mainnet.sorobanrpc.com";

export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??
  "Public Global Stellar Network ; September 2015";

export const HORIZON_URL =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? "https://horizon.stellar.org";

/** Testnet contract for local / staging swaps. */
export const TESTNET_CONTRACT_ID =
  "CBALW6L6MMXHM272SUQNXCBJ5LA5WB6FS6DBEV2Z4W5CAUI4UIB3HOLL";

// TODO: replace with real token addresses when switching networks
export const USDC_MAINNET =
  "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";

export const USDC_TESTNET =
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

/** Native XLM SAC on mainnet. */
export const XLM_MAINNET =
  "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";

/** Server-only — never import from client components. */
export function getAdminSecretKey(): string {
  const key = process.env.ADMIN_SECRET_KEY;
  if (!key) {
    throw new Error("ADMIN_SECRET_KEY is not configured");
  }
  return key;
}

/** On-chain create/refund/cancel require the relayer signature; use the relayer secret here. */

export function getAdminApiSecret(): string {
  return process.env.ADMIN_API_SECRET ?? "";
}

export function assertContractConfigured(): void {
  if (!CONTRACT_ID) {
    throw new Error("NEXT_PUBLIC_STELLAR_CONTRACT_ID is not configured");
  }
}
