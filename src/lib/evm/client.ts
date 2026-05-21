import "server-only";

import {
  createPublicClient,
  createWalletClient,
  http,
  maxUint256,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, bsc, celo } from "viem/chains";

import { RAMPIT_ESCROW_ABI } from "@/lib/evm/abi";
import {
  EVM_ESCROW_PROXY,
  getEvmRelayerPrivateKey,
  getEvmRpcUrl,
} from "@/lib/evm/config";
import { isNativeTokenAddress } from "@/lib/evm/constants";
import { orderIdToBytes32 } from "@/lib/evm/order-id";
import type { Direction, EscrowOrder, OrderStatus } from "@/lib/stellar/types";

const abi = parseAbi(RAMPIT_ESCROW_ABI);

const CHAINS = { celo, base, bnb: bsc } as const;

export type EvmChainKey = keyof typeof CHAINS;

function getChain(chain: EvmChainKey) {
  return CHAINS[chain];
}

export function getPublicClient(chain: EvmChainKey) {
  return createPublicClient({
    chain: getChain(chain),
    transport: http(getEvmRpcUrl(chain)),
  });
}

function getWalletClient(chain: EvmChainKey) {
  const account = privateKeyToAccount(getEvmRelayerPrivateKey());
  return createWalletClient({
    account,
    chain: getChain(chain),
    transport: http(getEvmRpcUrl(chain)),
  });
}

const STATUS_MAP: OrderStatus[] = [
  "Pending",
  "Released",
  "Refunded",
  "Cancelled",
];

const DIRECTION_MAP: Direction[] = ["OnRamp", "OffRamp"];

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export function defaultOrderExpiry(): number {
  return Math.floor(Date.now() / 1000) + ONE_YEAR_SECONDS;
}

export async function evmOrderExists(
  chain: EvmChainKey,
  humanOrderId: string,
): Promise<boolean> {
  const publicClient = getPublicClient(chain);
  return publicClient.readContract({
    address: EVM_ESCROW_PROXY as `0x${string}`,
    abi,
    functionName: "orderExists",
    args: [orderIdToBytes32(humanOrderId)],
  });
}

export async function evmGetOrder(
  chain: EvmChainKey,
  humanOrderId: string,
): Promise<EscrowOrder> {
  const publicClient = getPublicClient(chain);
  const raw = await publicClient.readContract({
    address: EVM_ESCROW_PROXY as `0x${string}`,
    abi,
    functionName: "getOrder",
    args: [orderIdToBytes32(humanOrderId)],
  });

  const o = raw as {
    recipient: string;
    funder: string;
    token: string;
    amount: bigint;
    rate: bigint;
    expiry: bigint;
    status: number;
    direction: number;
  };

  return {
    orderId: humanOrderId.trim(),
    recipient: o.recipient,
    funder: o.funder,
    token: o.token,
    amount: o.amount.toString(),
    rate: o.rate.toString(),
    expiry: Number(o.expiry),
    direction: DIRECTION_MAP[o.direction] ?? "OnRamp",
    status: STATUS_MAP[o.status] ?? "Pending",
  };
}

async function ensureAllowance(
  chain: EvmChainKey,
  token: `0x${string}`,
  amount: bigint,
) {
  const account = privateKeyToAccount(getEvmRelayerPrivateKey());
  const publicClient = getPublicClient(chain);
  const wallet = getWalletClient(chain);
  const proxy = EVM_ESCROW_PROXY as `0x${string}`;

  const allowance = await publicClient.readContract({
    address: token,
    abi: parseAbi([
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
    ]),
    functionName: "allowance",
    args: [account.address, proxy],
  });

  if (allowance >= amount) return;

  const hash = await wallet.writeContract({
    address: token,
    abi: parseAbi([
      "function approve(address spender, uint256 amount) returns (bool)",
    ]),
    functionName: "approve",
    args: [proxy, maxUint256],
  });

  await publicClient.waitForTransactionReceipt({ hash });
}

export async function evmCreateOrder(
  chain: EvmChainKey,
  input: {
    orderId: string;
    recipient: `0x${string}`;
    token: `0x${string}`;
    amount: bigint;
  },
): Promise<`0x${string}`> {
  const wallet = getWalletClient(chain);
  const publicClient = getPublicClient(chain);
  const proxy = EVM_ESCROW_PROXY as `0x${string}`;
  const orderBytes = orderIdToBytes32(input.orderId);
  const expiry = BigInt(defaultOrderExpiry());

  const isNative = isNativeTokenAddress(input.token);
  if (!isNative) {
    await ensureAllowance(chain, input.token, input.amount);
  }

  const hash = await wallet.writeContract({
    address: proxy,
    abi,
    functionName: "createOrder",
    args: [
      orderBytes,
      input.recipient,
      input.token,
      input.amount,
      BigInt(0),
      expiry,
      0,
    ],
    value: isNative ? input.amount : BigInt(0),
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function evmReleaseOrder(
  chain: EvmChainKey,
  humanOrderId: string,
): Promise<`0x${string}`> {
  const wallet = getWalletClient(chain);
  const publicClient = getPublicClient(chain);
  const hash = await wallet.writeContract({
    address: EVM_ESCROW_PROXY as `0x${string}`,
    abi,
    functionName: "releaseOrder",
    args: [orderIdToBytes32(humanOrderId)],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function evmRefundOrder(
  chain: EvmChainKey,
  humanOrderId: string,
): Promise<`0x${string}`> {
  const wallet = getWalletClient(chain);
  const publicClient = getPublicClient(chain);
  const hash = await wallet.writeContract({
    address: EVM_ESCROW_PROXY as `0x${string}`,
    abi,
    functionName: "refundOrder",
    args: [orderIdToBytes32(humanOrderId)],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function evmCollectFees(
  chain: EvmChainKey,
  token: `0x${string}`,
): Promise<`0x${string}`> {
  const wallet = getWalletClient(chain);
  const publicClient = getPublicClient(chain);
  const hash = await wallet.writeContract({
    address: EVM_ESCROW_PROXY as `0x${string}`,
    abi,
    functionName: "collectFees",
    args: [token],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
