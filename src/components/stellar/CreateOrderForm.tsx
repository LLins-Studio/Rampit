"use client";

import { useMemo, useState } from "react";

import { createOrderAction } from "@/app/desk/actions";
import { createEvmOrderAction } from "@/app/desk/evm-actions";
import { humanAmountToUnits } from "@/lib/stellar/amount";
import { getStellarTokenOptions } from "@/lib/stellar/tokens";
import { getDefaultEvmToken, getEvmTokenOptions } from "@/lib/evm/tokens";
import type { RampitChain } from "@/lib/rampit/chain";
import { isEvmChain } from "@/lib/rampit/chain";

const inputClass =
  "w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1";

function newOrderId(): string {
  const t = Date.now().toString(36).toUpperCase();
  return `RMP-${t}`;
}

type Props = {
  chain: RampitChain;
};

export function CreateOrderForm({ chain }: Props) {
  const stellarTokens = useMemo(() => getStellarTokenOptions(), []);
  const evmTokens = useMemo(
    () => (isEvmChain(chain) ? getEvmTokenOptions(chain) : []),
    [chain],
  );

  const [orderId, setOrderId] = useState(() => newOrderId());
  const [recipient, setRecipient] = useState("");
  const [tokenId, setTokenId] = useState<string>("USDC");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedStellar =
    stellarTokens.find((t) => t.id === tokenId) ?? stellarTokens[0];
  const selectedEvm = isEvmChain(chain)
    ? (evmTokens.find((t) => t.id === tokenId) ?? getDefaultEvmToken(chain))
    : getDefaultEvmToken("celo");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setTxHash(null);
    setCreatedOrderId(null);

    if (!recipient.trim()) {
      setFormError(
        isEvmChain(chain)
          ? "Recipient wallet address (0x…) is required"
          : "Recipient Stellar address is required",
      );
      return;
    }

    setIsLoading(true);

    if (isEvmChain(chain)) {
      let amountUnits: bigint;
      try {
        amountUnits = humanAmountToUnits(amount, selectedEvm.decimals);
      } catch (err) {
        setIsLoading(false);
        setFormError(err instanceof Error ? err.message : "Invalid amount");
        return;
      }

      const result = await createEvmOrderAction({
        chain,
        orderId: orderId.trim(),
        recipient: recipient.trim() as `0x${string}`,
        token: selectedEvm.address,
        amount: amountUnits.toString(),
      });
      setIsLoading(false);

      if (result.success) {
        setTxHash(result.txHash);
        setCreatedOrderId(orderId.trim());
      } else {
        setFormError(result.error);
      }
      return;
    }

    let amountUnits: bigint;
    try {
      amountUnits = humanAmountToUnits(amount, selectedStellar.decimals);
    } catch (err) {
      setIsLoading(false);
      setFormError(err instanceof Error ? err.message : "Invalid amount");
      return;
    }

    if (amountUnits <= BigInt(0)) {
      setIsLoading(false);
      setFormError("Amount must be greater than 0");
      return;
    }

    const result = await createOrderAction({
      orderId: orderId.trim(),
      recipient: recipient.trim(),
      token: selectedStellar.contractId,
      amount: amountUnits.toString(),
    });
    setIsLoading(false);

    if (result.success) {
      setTxHash(result.txHash);
      setCreatedOrderId(orderId.trim());
    } else {
      setFormError(result.error);
    }
  }

  const tokenOptions = isEvmChain(chain) ? evmTokens : stellarTokens;
  const selectedLabel = isEvmChain(chain) ? selectedEvm.label : selectedStellar.label;

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-4 rounded-xl border p-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}
    >
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        On-ramp ({chain})
      </h2>

      <p className="text-xs" style={{ color: "var(--text-tertiary)", lineHeight: 1.5 }}>
        Lock crypto from the relayer wallet, then release to the customer after Naira is
        paid.
        {isEvmChain(chain) && (
          <>
            {" "}
            Choose native (CELO/ETH/BNB) to lock gas token via tx value, or USDC (ERC-20
            approve).
          </>
        )}
      </p>

      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: "var(--text-secondary)" }}>Order ID</span>
        <div className="flex gap-2">
          <input
            className={inputClass}
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
          />
          <button
            type="button"
            className="shrink-0 rounded-lg border px-3 text-xs font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            onClick={() => setOrderId(newOrderId())}
          >
            New ID
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: "var(--text-secondary)" }}>
          {isEvmChain(chain) ? "Recipient (0x address)" : "Recipient (G-address)"}
        </span>
        <input
          className={inputClass}
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder={isEvmChain(chain) ? "0x…" : "Customer wallet"}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Token</span>
          <select
            className="select-rampit"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
          >
            {tokenOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {isEvmChain(chain) && "hint" in t
                  ? `${t.label} — ${(t as { hint: string }).hint}`
                  : t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Amount ({selectedLabel})</span>
          <input
            type="text"
            inputMode="decimal"
            className={inputClass}
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="e.g. 10.5"
            required
          />
        </label>
      </div>

      {formError && (
        <p className="text-sm" style={{ color: "var(--error)" }}>
          {formError}
        </p>
      )}

      {createdOrderId && (
        <div
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--success)", color: "var(--success)" }}
        >
          <p className="font-semibold">Order created on {chain}</p>
          <p className="mt-1 font-mono">ID: {createdOrderId}</p>
          <p className="mt-1 break-all text-xs opacity-90">Tx: {txHash}</p>
          <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            Use this exact order ID in Order status (same chain).
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)", color: "#0A0A0B" }}
      >
        {isLoading ? "Submitting…" : "Lock & create order"}
      </button>
    </form>
  );
}
