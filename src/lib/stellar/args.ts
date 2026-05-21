import { Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";

import type { Direction } from "./types";

/** UTF-8 bytes (matches Soroban `Bytes::from_slice` in contract tests). */
export function orderIdToBytes(orderId: string): Buffer {
  return Buffer.from(orderId, "utf-8");
}

function directionToScVal(direction: Direction): xdr.ScVal {
  return xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(direction)]);
}

export function buildInitializeArgs(
  admin: string,
  relayer: string,
  feeBps: number,
): xdr.ScVal[] {
  return [
    Address.fromString(admin).toScVal(),
    Address.fromString(relayer).toScVal(),
    nativeToScVal(feeBps, { type: "u32" }),
  ];
}

export function buildCreateOrderArgs(
  orderId: string,
  recipient: string,
  token: string,
  amount: bigint,
  rate: bigint,
  expiry: number,
  direction: Direction,
): xdr.ScVal[] {
  return [
    nativeToScVal(orderIdToBytes(orderId), { type: "bytes" }),
    Address.fromString(recipient).toScVal(),
    Address.fromString(token).toScVal(),
    nativeToScVal(amount, { type: "i128" }),
    nativeToScVal(rate, { type: "i128" }),
    nativeToScVal(BigInt(expiry), { type: "u64" }),
    directionToScVal(direction),
  ];
}

export function buildReleaseOrderArgs(orderId: string): xdr.ScVal[] {
  return [nativeToScVal(orderIdToBytes(orderId), { type: "bytes" })];
}

export function buildRefundOrderArgs(orderId: string): xdr.ScVal[] {
  return [nativeToScVal(orderIdToBytes(orderId), { type: "bytes" })];
}

export function buildOrderExistsArgs(orderId: string): xdr.ScVal[] {
  return [nativeToScVal(orderIdToBytes(orderId), { type: "bytes" })];
}

export function buildCancelOrderArgs(orderId: string): xdr.ScVal[] {
  return [nativeToScVal(orderIdToBytes(orderId), { type: "bytes" })];
}

export function buildCollectFeesArgs(token: string): xdr.ScVal[] {
  return [Address.fromString(token).toScVal()];
}

export function buildSetRelayerArgs(newRelayer: string): xdr.ScVal[] {
  return [Address.fromString(newRelayer).toScVal()];
}

export function buildSetAdminArgs(newAdmin: string): xdr.ScVal[] {
  return [Address.fromString(newAdmin).toScVal()];
}

export function buildSetFeeArgs(feeBps: number): xdr.ScVal[] {
  return [nativeToScVal(feeBps, { type: "u32" })];
}

export function buildGetOrderArgs(orderId: string): xdr.ScVal[] {
  return [nativeToScVal(orderIdToBytes(orderId), { type: "bytes" })];
}

export function buildGetAccumulatedFeesArgs(token: string): xdr.ScVal[] {
  return [Address.fromString(token).toScVal()];
}
