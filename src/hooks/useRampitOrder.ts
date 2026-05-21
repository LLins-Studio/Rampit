"use client";

import useSWR from "swr";

import { getEvmOrderAction } from "@/app/desk/evm-actions";
import { getOrderAction } from "@/app/desk/actions";
import type { RampitChain } from "@/lib/rampit/chain";
import { isEvmChain } from "@/lib/rampit/chain";
import type { EscrowOrder } from "@/lib/stellar/types";

export function useRampitOrder(chain: RampitChain, orderId: string | null) {
  return useSWR<EscrowOrder>(
    orderId ? (["rampit-order", chain, orderId] as const) : null,
    async ([, ch, id]: readonly ["rampit-order", RampitChain, string]) => {
      if (isEvmChain(ch)) {
        const r = await getEvmOrderAction(ch, id);
        if (!r.success) throw new Error(r.error);
        return r.data;
      }
      const r = await getOrderAction(id);
      if (!r.success) throw new Error(r.error);
      return r.data;
    },
    {
      refreshInterval: (data) => (data?.status === "Pending" ? 10_000 : 0),
      revalidateOnFocus: true,
    },
  );
}
