export type Direction = "OnRamp" | "OffRamp";

export type OrderStatus = "Pending" | "Released" | "Refunded" | "Cancelled";

export interface EscrowOrder {
  orderId: string;
  recipient: string;
  funder: string;
  token: string;
  amount: string;
  rate: string;
  expiry: number;
  direction: Direction;
  status: OrderStatus;
}

export type ContractResult<T = unknown> =
  | { success: true; data: T; txHash: string }
  | { success: false; error: string; code?: number };

export const POLL_ATTEMPTS = 30;
export const POLL_INTERVAL_MS = 2000;
