import { keccak256, stringToBytes } from "viem";

/** Map human order id (e.g. RMP-…) to on-chain bytes32. */
export function orderIdToBytes32(orderId: string): `0x${string}` {
  return keccak256(stringToBytes(orderId.trim()));
}
