/** On-chain sentinel for native gas token (ETH / CELO / BNB). */
export const NATIVE_TOKEN_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

export function isNativeTokenAddress(
  address: string,
): address is typeof NATIVE_TOKEN_ADDRESS {
  return address.toLowerCase() === NATIVE_TOKEN_ADDRESS;
}
