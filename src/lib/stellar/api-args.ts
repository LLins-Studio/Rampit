import type { xdr } from "@stellar/stellar-sdk";

import {
  buildCancelOrderArgs,
  buildCollectFeesArgs,
  buildCreateOrderArgs,
  buildGetAccumulatedFeesArgs,
  buildGetOrderArgs,
  buildOrderExistsArgs,
  buildInitializeArgs,
  buildRefundOrderArgs,
  buildReleaseOrderArgs,
  buildSetAdminArgs,
  buildSetFeeArgs,
  buildSetRelayerArgs,
} from "./args";
import type { Direction } from "./types";

export type InvokeArgsPayload = Record<string, unknown>;

export function buildArgsFromPayload(
  functionName: string,
  payload: InvokeArgsPayload,
): xdr.ScVal[] {
  switch (functionName) {
    case "initialize":
      return buildInitializeArgs(
        String(payload.admin),
        String(payload.relayer),
        Number(payload.feeBps),
      );
    case "create_order":
      return buildCreateOrderArgs(
        String(payload.orderId),
        String(payload.recipient),
        String(payload.token),
        BigInt(String(payload.amount)),
        BigInt(String(payload.rate)),
        Number(payload.expiry),
        payload.direction as Direction,
      );
    case "release_order":
      return buildReleaseOrderArgs(String(payload.orderId));
    case "refund_order":
      return buildRefundOrderArgs(String(payload.orderId));
    case "cancel_order":
      return buildCancelOrderArgs(String(payload.orderId));
    case "collect_fees":
      return buildCollectFeesArgs(String(payload.token));
    case "set_relayer":
      return buildSetRelayerArgs(String(payload.newRelayer));
    case "set_admin":
      return buildSetAdminArgs(String(payload.newAdmin));
    case "set_fee":
      return buildSetFeeArgs(Number(payload.feeBps));
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

export function buildQueryArgs(
  fn: string,
  params: Record<string, string>,
): { functionName: string; args: xdr.ScVal[] } {
  switch (fn) {
    case "get_order":
      return {
        functionName: "get_order",
        args: buildGetOrderArgs(params.orderId ?? ""),
      };
    case "get_fee_bps":
      return { functionName: "get_fee_bps", args: [] };
    case "get_accumulated_fees":
      return {
        functionName: "get_accumulated_fees",
        args: buildGetAccumulatedFeesArgs(params.token ?? ""),
      };
    case "get_relayer":
      return { functionName: "get_relayer", args: [] };
    case "get_admin":
      return { functionName: "get_admin", args: [] };
    case "order_exists":
      return {
        functionName: "order_exists",
        args: buildOrderExistsArgs(params.orderId ?? ""),
      };
    default:
      throw new Error(`Unsupported query: ${fn}`);
  }
}
