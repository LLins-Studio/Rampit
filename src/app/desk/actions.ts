"use server";

import { Keypair, rpc } from "@stellar/stellar-sdk";

import { buildCreateOrderArgs } from "@/lib/stellar/args";
import { buildArgsFromPayload, buildQueryArgs } from "@/lib/stellar/api-args";
import { getAdminApiSecret, getAdminSecretKey } from "@/lib/stellar/config";
import { invokeContractAdmin, simulateContractCall } from "@/lib/stellar/contract";
import {
  parseAddressResult,
  parseI128Result,
  parseOrderResult,
  parseU32Result,
  scValToJson,
} from "@/lib/stellar/parse";
import type { ContractResult, EscrowOrder } from "@/lib/stellar/types";

function parseQueryResult(fn: string, raw: unknown): unknown {
  switch (fn) {
    case "get_order":
      return parseOrderResult(raw);
    case "get_fee_bps":
      return parseU32Result(raw);
    case "get_accumulated_fees":
      return parseI128Result(raw);
    case "get_relayer":
    case "get_admin":
      return parseAddressResult(raw);
    case "order_exists":
      return Boolean(raw);
    default:
      return raw;
  }
}

/** Read-only contract query (server action — works with static export; API routes do not). */
export async function queryStellarAction<T = unknown>(
  fn: string,
  params: Record<string, string> = {},
): Promise<ContractResult<T>> {
  try {
    const { functionName, args } = buildQueryArgs(fn, params);
    let sourceKey: string;
    try {
      sourceKey = Keypair.fromSecret(getAdminSecretKey()).publicKey();
    } catch {
      sourceKey = Keypair.random().publicKey();
    }

    const simulation = await simulateContractCall(sourceKey, functionName, args);
    const raw = scValToJson(simulation.result?.retval);
    const result = parseQueryResult(fn, raw) as T;
    return { success: true, data: result, txHash: "" };
  } catch (err) {
    let message = err instanceof Error ? err.message : "Query failed";
    if (/OrderNotFound|order not found/i.test(message)) {
      message =
        "Order not found on this contract. Check the order ID matches the create tx exactly (e.g. RMP-MP6W07H0, not a similar-looking ID).";
    }
    return { success: false, error: message };
  }
}

export async function getOrderAction(
  orderId: string,
): Promise<ContractResult<EscrowOrder>> {
  return queryStellarAction<EscrowOrder>("get_order", { orderId: orderId.trim() });
}

export async function invokeStellarAdminAction(
  apiToken: string,
  functionName: string,
  args: Record<string, unknown> = {},
): Promise<ContractResult> {
  const secret = getAdminApiSecret();
  if (!secret || apiToken !== secret) {
    return { success: false, error: "Unauthorized" };
  }

  if (!ALLOWED_ADMIN_FUNCTIONS.has(functionName)) {
    return { success: false, error: `Function not allowed: ${functionName}` };
  }

  try {
    getAdminSecretKey();
    const scArgs = buildArgsFromPayload(functionName, args);
    const tx = await invokeContractAdmin(functionName, scArgs);

    if (tx.status === rpc.Api.GetTransactionStatus.FAILED) {
      return { success: false, error: "Transaction failed on ledger" };
    }

    const success = tx as rpc.Api.GetSuccessfulTransactionResponse;
    return {
      success: true,
      data: scValToJson(success.returnValue),
      txHash: success.txHash,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invoke failed";
    return { success: false, error: message };
  }
}

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

const ALLOWED_ADMIN_FUNCTIONS = new Set([
  "initialize",
  "release_order",
  "refund_order",
  "collect_fees",
  "set_relayer",
  "set_admin",
  "set_fee",
]);

export type CreateOrderInput = {
  orderId: string;
  recipient: string;
  token: string;
  amount: string;
};

function defaultOrderExpiry(): number {
  return Math.floor(Date.now() / 1000) + ONE_YEAR_SECONDS;
}

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<ContractResult> {
  try {
    const secret = getAdminSecretKey();
    const signer = Keypair.fromSecret(secret);
    const amount = BigInt(input.amount);
    const rate = BigInt(0);

    if (amount <= BigInt(0)) {
      return { success: false, error: "Amount must be greater than 0" };
    }
    if (!input.orderId.trim() || !input.token.trim() || !input.recipient.trim()) {
      return {
        success: false,
        error: "Order ID, recipient address, and token are required",
      };
    }

    const expiry = defaultOrderExpiry();
    const args = buildCreateOrderArgs(
      input.orderId.trim(),
      input.recipient.trim(),
      input.token.trim(),
      amount,
      rate,
      expiry,
      "OnRamp",
    );

    const tx = await invokeContractAdmin("create_order", args);

    if (tx.status === rpc.Api.GetTransactionStatus.FAILED) {
      return { success: false, error: "Transaction failed on ledger" };
    }

    return { success: true, data: { expiry }, txHash: tx.txHash };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create order failed";
    return { success: false, error: message };
  }
}
