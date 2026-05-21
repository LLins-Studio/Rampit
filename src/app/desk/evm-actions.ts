"use server";

import { isAddress } from "viem";

import {
  evmCollectFees,
  evmCreateOrder,
  evmGetOrder,
  evmOrderExists,
  evmRefundOrder,
  evmReleaseOrder,
  type EvmChainKey,
} from "@/lib/evm/client";
import { getAdminApiSecret } from "@/lib/evm/config";
import type { ContractResult, EscrowOrder } from "@/lib/stellar/types";

function assertApiToken(apiToken: string): string | null {
  const secret = getAdminApiSecret();
  if (!secret || apiToken !== secret) {
    return "Unauthorized";
  }
  return null;
}

export async function getEvmOrderAction(
  chain: EvmChainKey,
  orderId: string,
): Promise<ContractResult<EscrowOrder>> {
  try {
    const id = orderId.trim();
    if (!id) {
      return { success: false, error: "Order ID is required" };
    }
    const exists = await evmOrderExists(chain, id);
    if (!exists) {
      return {
        success: false,
        error:
          "Order not found on this chain. Use the exact order ID from create (e.g. RMP-…).",
      };
    }
    const data = await evmGetOrder(chain, id);
    return { success: true, data, txHash: "" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Query failed",
    };
  }
}

export type EvmCreateOrderInput = {
  chain: EvmChainKey;
  orderId: string;
  recipient: string;
  token: `0x${string}`;
  amount: string;
};

export async function createEvmOrderAction(
  input: EvmCreateOrderInput,
): Promise<ContractResult> {
  try {
    const amount = BigInt(input.amount);
    if (amount <= BigInt(0)) {
      return { success: false, error: "Amount must be greater than 0" };
    }
    if (!input.orderId.trim()) {
      return { success: false, error: "Order ID is required" };
    }
    if (!isAddress(input.recipient)) {
      return { success: false, error: "Invalid recipient address (0x…)" };
    }
    if (!isAddress(input.token)) {
      return { success: false, error: "Invalid token address" };
    }

    const txHash = await evmCreateOrder(input.chain, {
      orderId: input.orderId.trim(),
      recipient: input.recipient,
      token: input.token,
      amount,
    });

    return { success: true, data: { chain: input.chain }, txHash };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create order failed";
    return { success: false, error: message };
  }
}

const ALLOWED_EVM_ADMIN = new Set([
  "releaseOrder",
  "refundOrder",
  "collectFees",
]);

export async function invokeEvmAdminAction(
  apiToken: string,
  chain: EvmChainKey,
  functionName: string,
  args: Record<string, unknown> = {},
): Promise<ContractResult> {
  const authErr = assertApiToken(apiToken);
  if (authErr) return { success: false, error: authErr };

  if (!ALLOWED_EVM_ADMIN.has(functionName)) {
    return { success: false, error: `Function not allowed: ${functionName}` };
  }

  try {
    let txHash: `0x${string}`;
    switch (functionName) {
      case "releaseOrder": {
        const orderId = String(args.orderId ?? "").trim();
        if (!orderId) return { success: false, error: "orderId required" };
        txHash = await evmReleaseOrder(chain, orderId);
        break;
      }
      case "refundOrder": {
        const orderId = String(args.orderId ?? "").trim();
        if (!orderId) return { success: false, error: "orderId required" };
        txHash = await evmRefundOrder(chain, orderId);
        break;
      }
      case "collectFees": {
        const token = args.token as string;
        if (!isAddress(token)) {
          return { success: false, error: "Invalid token address" };
        }
        txHash = await evmCollectFees(chain, token as `0x${string}`);
        break;
      }
      default:
        return { success: false, error: "Unknown function" };
    }
    return { success: true, data: { chain }, txHash };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Transaction failed",
    };
  }
}
