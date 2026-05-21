import { Address, scValToNative, xdr } from "@stellar/stellar-sdk";

import type { Direction, EscrowOrder, OrderStatus } from "./types";

function bytesToString(val: unknown): string {
  if (Buffer.isBuffer(val)) {
    return val.toString("utf-8");
  }
  if (val instanceof Uint8Array) {
    return Buffer.from(val).toString("utf-8");
  }
  return String(val);
}

function parseDirection(raw: unknown): Direction {
  if (Array.isArray(raw) && raw.length > 0) {
    const tag = String(raw[0]);
    if (tag === "OnRamp" || tag === "OffRamp") return tag;
  }
  if (raw === "OnRamp" || raw === "OffRamp") return raw;
  return "OnRamp";
}

function parseStatus(raw: unknown): OrderStatus {
  if (Array.isArray(raw) && raw.length > 0) {
    const tag = String(raw[0]);
    if (
      tag === "Pending" ||
      tag === "Released" ||
      tag === "Refunded" ||
      tag === "Cancelled"
    ) {
      return tag;
    }
  }
  if (
    raw === "Pending" ||
    raw === "Released" ||
    raw === "Refunded" ||
    raw === "Cancelled"
  ) {
    return raw;
  }
  return "Pending";
}

function addressToString(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "toString" in val) {
    return String(val);
  }
  return Address.fromScVal(val as xdr.ScVal).toString();
}

export function scValToJson(val: xdr.ScVal | undefined): unknown {
  if (!val) return null;
  return scValToNative(val);
}

export function parseOrderResult(raw: unknown): EscrowOrder {
  const record = raw as Record<string, unknown>;
  return {
    orderId: bytesToString(record.order_id ?? record.orderId ?? ""),
    recipient: addressToString(record.recipient ?? record.user),
    funder: addressToString(record.funder),
    token: addressToString(record.token),
    amount: String(record.amount ?? "0"),
    rate: String(record.rate ?? "0"),
    expiry: Number(record.expiry ?? 0),
    direction: parseDirection(record.direction),
    status: parseStatus(record.status),
  };
}

export function parseAddressResult(raw: unknown): string {
  if (typeof raw === "string") return raw;
  return addressToString(raw);
}

export function parseU32Result(raw: unknown): number {
  return Number(raw ?? 0);
}

export function parseI128Result(raw: unknown): string {
  return String(raw ?? "0");
}
