"use client";

import useSWR from "swr";

import { getOrderAction, queryStellarAction } from "@/app/desk/actions";
import type { EscrowOrder } from "@/lib/stellar/types";

async function runQuery<T>(fn: string, params: Record<string, string>): Promise<T> {
  const result = await queryStellarAction<T>(fn, params);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}

export function useOrder(orderId: string | null) {
  return useSWR<EscrowOrder>(
    orderId ? (["stellar-order", orderId] as const) : null,
    ([, id]: readonly ["stellar-order", string]) =>
      getOrderAction(id).then((r) => {
      if (!r.success) throw new Error(r.error);
      return r.data;
    }),
    {
      refreshInterval: (data) => (data?.status === "Pending" ? 10_000 : 0),
      revalidateOnFocus: true,
    },
  );
}

export function useAccumulatedFees(token: string | null) {
  return useSWR<string>(
    token ? (["stellar-fees", token] as const) : null,
    ([, t]: readonly ["stellar-fees", string]) =>
      runQuery<string>("get_accumulated_fees", { token: t }),
  );
}

export function useFeeBps() {
  return useSWR<number>(["stellar-fee-bps"], () => runQuery<number>("get_fee_bps", {}), {
    revalidateOnFocus: false,
  });
}

export function useRelayer() {
  return useSWR<string>(["stellar-relayer"], () => runQuery<string>("get_relayer", {}), {
    revalidateOnFocus: false,
  });
}

export function useAdmin() {
  return useSWR<string>(["stellar-admin"], () => runQuery<string>("get_admin", {}), {
    revalidateOnFocus: false,
  });
}

/** Convenience accessors matching the spec naming. */
export function useStellarContract() {
  return {
    getOrder: useOrder,
    getAccumulatedFees: useAccumulatedFees,
    getFee: useFeeBps,
    getRelayer: useRelayer,
    getAdmin: useAdmin,
  };
}
