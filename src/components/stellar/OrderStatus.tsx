"use client";

import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import { useRampitOrder } from "@/hooks/useRampitOrder";
import type { RampitChain } from "@/lib/rampit/chain";
import type { OrderStatus as OrderStatusType } from "@/lib/stellar/types";

const STATUS_STYLES: Record<
  OrderStatusType,
  { label: string; bg: string; color: string }
> = {
  Pending: {
    label: "Pending",
    bg: "rgba(234, 179, 8, 0.15)",
    color: "#EAB308",
  },
  Released: {
    label: "Released",
    bg: "rgba(34, 197, 94, 0.15)",
    color: "var(--success)",
  },
  Refunded: {
    label: "Refunded",
    bg: "rgba(138, 135, 128, 0.15)",
    color: "var(--text-secondary)",
  },
  Cancelled: {
    label: "Cancelled",
    bg: "rgba(239, 68, 68, 0.15)",
    color: "var(--error)",
  },
};

type Props = {
  chain: RampitChain;
};

export function OrderStatus({ chain }: Props) {
  const [orderIdInput, setOrderIdInput] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useRampitOrder(chain, orderId);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setOrderId(orderIdInput.trim() || null);
  }

  const badge = data ? STATUS_STYLES[data.status] : null;

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border p-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}
    >
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Order status ({chain})
      </h2>

      <form onSubmit={handleLookup} className="flex gap-2">
        <input
          className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          placeholder="Order ID (e.g. RMP-…)"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--accent)", color: "#0A0A0B" }}
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          Lookup
        </button>
      </form>

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Loading…
        </p>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--error)" }}>
          {error.message}
        </p>
      )}

      {data && (
        <div className="flex flex-col gap-3 text-sm">
          {badge && (
            <span
              className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          )}
          <dl className="grid gap-2 font-mono text-xs">
            <Row label="Order ID" value={data.orderId} />
            <Row label="Recipient" value={data.recipient} />
            <Row label="Funder" value={data.funder} />
            <Row label="Token" value={data.token} />
            <Row label="Amount (raw)" value={data.amount} />
            <Row label="Rate" value={data.rate} />
            <Row label="Expiry" value={new Date(data.expiry * 1000).toISOString()} />
            <Row label="Direction" value={data.direction} />
          </dl>
          <button
            type="button"
            onClick={() => void mutate()}
            className="text-xs underline"
            style={{ color: "var(--accent)" }}
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: "var(--text-tertiary)" }}>{label}</dt>
      <dd className="break-all text-right" style={{ color: "var(--text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}
