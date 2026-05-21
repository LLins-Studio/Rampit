"use client";

import { useEffect, useMemo, useState } from "react";

import { invokeStellarAdminAction } from "@/app/desk/actions";
import { invokeEvmAdminAction } from "@/app/desk/evm-actions";
import { getDefaultEvmToken, getEvmTokenOptions } from "@/lib/evm/tokens";
import type { RampitChain } from "@/lib/rampit/chain";
import { isEvmChain } from "@/lib/rampit/chain";
import { USDC_MAINNET } from "@/lib/stellar/config";
import type { ContractResult } from "@/lib/stellar/types";

type Tab = "release" | "refund" | "fees" | "settings";

const API_TOKEN_KEY = "rampit_admin_api_token";

type Props = {
  chain: RampitChain;
};

export function AdminPanel({ chain }: Props) {
  const [tab, setTab] = useState<Tab>("release");
  const [apiToken, setApiToken] = useState("");
  const [orderId, setOrderId] = useState("");
  const [evmTokenId, setEvmTokenId] = useState<string>("USDC");
  const [stellarFeeToken, setStellarFeeToken] = useState(USDC_MAINNET);
  const evmTokens = useMemo(
    () => (isEvmChain(chain) ? getEvmTokenOptions(chain) : []),
    [chain],
  );
  const selectedEvmToken = isEvmChain(chain)
    ? (evmTokens.find((t) => t.id === evmTokenId) ?? getDefaultEvmToken(chain))
    : null;
  const [newRelayer, setNewRelayer] = useState("");
  const [newAdmin, setNewAdmin] = useState("");
  const [feeBps, setFeeBps] = useState("50");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContractResult | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(API_TOKEN_KEY);
    if (saved) setApiToken(saved);
  }, []);

  useEffect(() => {
    setEvmTokenId("USDC");
  }, [chain]);

  function saveToken(value: string) {
    setApiToken(value);
    sessionStorage.setItem(API_TOKEN_KEY, value);
  }

  async function run(functionName: string, args: Record<string, unknown>) {
    if (!apiToken) {
      setResult({ success: false, error: "Enter ADMIN_API_SECRET bearer token first" });
      return;
    }
    setLoading(true);
    setResult(null);

    const out = isEvmChain(chain)
      ? await invokeEvmAdminAction(apiToken, chain, functionName, args)
      : await invokeStellarAdminAction(apiToken, functionName, args);

    setResult(out);
    setLoading(false);
  }

  const tabBtn = (id: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
      style={{
        backgroundColor: tab === id ? "var(--accent-muted)" : "transparent",
        color: tab === id ? "var(--accent)" : "var(--text-secondary)",
      }}
    >
      {label}
    </button>
  );

  const panelStyle = {
    borderColor: "var(--border)",
    backgroundColor: "var(--bg-secondary)",
  } as const;

  const inputStyle = {
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  } as const;

  const releaseFn = isEvmChain(chain) ? "releaseOrder" : "release_order";
  const refundFn = isEvmChain(chain) ? "refundOrder" : "refund_order";
  const feesFn = isEvmChain(chain) ? "collectFees" : "collect_fees";

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-6" style={panelStyle}>
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Admin panel ({chain})
      </h2>
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        {isEvmChain(chain)
          ? "EVM txs signed server-side with EVM_RELAYER_PRIVATE_KEY."
          : "Stellar txs signed with ADMIN_SECRET_KEY."}{" "}
        Paste ADMIN_API_SECRET below (session only).
      </p>

      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: "var(--text-secondary)" }}>API bearer token</span>
        <input
          type="password"
          className="rounded-lg border bg-transparent px-3 py-2 text-sm font-mono"
          style={inputStyle}
          value={apiToken}
          onChange={(e) => saveToken(e.target.value)}
          placeholder="ADMIN_API_SECRET value"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {tabBtn("release", "Release order")}
        {tabBtn("refund", "Refund order")}
        {tabBtn("fees", "Collect fees")}
        {!isEvmChain(chain) && tabBtn("settings", "Settings")}
      </div>

      {tab === "release" && (
        <div className="flex flex-col gap-3">
          <input
            className="rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={inputStyle}
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button
            type="button"
            disabled={loading || !orderId}
            onClick={() => void run(releaseFn, { orderId })}
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", color: "#0A0A0B" }}
          >
            Release to recipient
          </button>
        </div>
      )}

      {tab === "refund" && (
        <div className="flex flex-col gap-3">
          <input
            className="rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={inputStyle}
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <button
            type="button"
            disabled={loading || !orderId}
            onClick={() => void run(refundFn, { orderId })}
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", color: "#0A0A0B" }}
          >
            Refund to funder
          </button>
        </div>
      )}

      {tab === "fees" && (
        <div className="flex flex-col gap-3">
          {isEvmChain(chain) ? (
            <select
              className="select-rampit"
              value={evmTokenId}
              onChange={(e) => setEvmTokenId(e.target.value)}
            >
              {evmTokens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.address.slice(0, 10)}…)
                </option>
              ))}
            </select>
          ) : (
            <input
              className="rounded-lg border bg-transparent px-3 py-2 text-sm font-mono text-xs"
              style={inputStyle}
              placeholder="Token contract"
              value={stellarFeeToken}
              onChange={(e) => setStellarFeeToken(e.target.value)}
            />
          )}
          <button
            type="button"
            disabled={
              loading || !(isEvmChain(chain) ? selectedEvmToken : stellarFeeToken)
            }
            onClick={() =>
              void run(feesFn, {
                token: isEvmChain(chain)
                  ? selectedEvmToken!.address
                  : stellarFeeToken,
              })
            }
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", color: "#0A0A0B" }}
          >
            Collect fees
          </button>
        </div>
      )}

      {tab === "settings" && !isEvmChain(chain) && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <input
              className="rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={inputStyle}
              placeholder="New relayer G-address"
              value={newRelayer}
              onChange={(e) => setNewRelayer(e.target.value)}
            />
            <button
              type="button"
              disabled={loading || !newRelayer}
              onClick={() => void run("set_relayer", { newRelayer })}
              className="rounded-lg border px-4 py-2 text-sm"
              style={inputStyle}
            >
              Set relayer
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input
              className="rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={inputStyle}
              placeholder="New admin G-address"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
            />
            <button
              type="button"
              disabled={loading || !newAdmin}
              onClick={() => void run("set_admin", { newAdmin })}
              className="rounded-lg border px-4 py-2 text-sm"
              style={inputStyle}
            >
              Set admin
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="number"
              className="rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={inputStyle}
              placeholder="Fee bps"
              value={feeBps}
              onChange={(e) => setFeeBps(e.target.value)}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void run("set_fee", { feeBps: Number(feeBps) })}
              className="rounded-lg border px-4 py-2 text-sm"
              style={inputStyle}
            >
              Set fee
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="text-sm">
          {result.success ? (
            <p style={{ color: "var(--success)" }}>
              Success — tx: {result.txHash}
            </p>
          ) : (
            <p style={{ color: "var(--error)" }}>{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
