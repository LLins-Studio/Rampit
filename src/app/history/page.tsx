"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth, Order, OrderStatus } from "@/lib/AuthContext";

const PAGE_SIZE = 8;

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string; dot: string }> = {
  completed: { bg: "rgba(34,197,94,0.1)",   color: "var(--success)",        dot: "var(--success)" },
  pending:   { bg: "rgba(234,179,8,0.1)",   color: "#ca8a04",               dot: "#eab308" },
  failed:    { bg: "rgba(239,68,68,0.1)",   color: "var(--error)",          dot: "var(--error)" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ background: s.bg, fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: s.color, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}
      style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "var(--accent)" : "var(--text-tertiary)", padding: "0 0 0 4px" }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        {copied
          ? <path d="M1.5 6l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          : <><rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4H.5A.5.5 0 0 0 0 4.5V11a.5.5 0 0 0 .5.5H7a.5.5 0 0 0 .5-.5V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>
        }
      </svg>
    </button>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const rows: [string, React.ReactNode][] = [
    ["Reference",   <span className="flex items-center gap-1" key="ref"><span style={{ fontFamily: "var(--font-mono)" }}>{order.ref}</span><CopyBtn text={order.ref} /></span>],
    ["Date & Time", new Date(order.date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })],
    ["Status",      <StatusBadge key="s" status={order.status} />],
    ["You Paid",    `${order.fiatSymbol}${order.fiatAmount.toLocaleString()} ${order.fiatCurrency}`],
    ["You Received",`${order.cryptoAmount} ${order.token}`],
    ["Network",     order.network],
    ["Rate",        `${order.fiatSymbol}${order.rate.toLocaleString()} / USD`],
    ["Wallet",      <span className="flex items-center gap-1 flex-wrap" key="w"><span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", wordBreak: "break-all" }}>{order.wallet}</span><CopyBtn text={order.wallet} /></span>],
    ...(order.memo ? [["Memo", order.memo] as [string, React.ReactNode]] : []),
    ["Tx Hash",     <span className="flex items-center gap-1" key="h"><span style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{order.txHash.slice(0,20)}…</span><CopyBtn text={order.txHash} /></span>],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", animation: "var(--animate-fade-in-up)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} /></div>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Order Details</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer" }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-0 max-h-[70vh] overflow-y-auto">
          {rows.map(([label, value]) => (
            <div key={label as string} className="flex items-start justify-between gap-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-tertiary)", flexShrink: 0, paddingTop: "2px" }}>{label}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { user, orders } = useAuth();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch]             = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<Order | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (dateFrom && o.date < dateFrom) return false;
      if (dateTo   && o.date > dateTo + "T23:59:59Z") return false;
      if (search) {
        const q = search.toLowerCase();
        if (![o.ref, o.txHash, o.token, o.network, o.wallet, o.fiatCurrency].some((v) => v.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageOrders = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() { setStatusFilter("all"); setSearch(""); setDateFrom(""); setDateTo(""); setPage(1); }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", paddingTop: "80px", paddingBottom: "60px" }}>
      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 transition-colors duration-200"
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-tertiary)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back
          </Link>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>Order History</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {filtered.length} order{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl p-4 mb-4 space-y-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="flex flex-wrap gap-2">
            {(["all", "completed", "pending", "failed"] as const).map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className="px-3 py-1.5 rounded-full transition-all duration-150"
                style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                  background: statusFilter === s ? "var(--accent-muted)" : "var(--bg-tertiary)",
                  border: `1px solid ${statusFilter === s ? "var(--border-accent)" : "var(--border)"}`,
                  color: statusFilter === s ? "var(--accent)" : "var(--text-tertiary)" }}>
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder="Search ref, hash, token, wallet…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-dark rounded-xl px-3 py-2 flex-1 min-w-48" style={{ fontSize: "13px" }} />
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="input-dark rounded-xl px-3 py-2" style={{ fontSize: "13px", colorScheme: "dark" }} />
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="input-dark rounded-xl px-3 py-2" style={{ fontSize: "13px", colorScheme: "dark" }} />
            {(search || dateFrom || dateTo || statusFilter !== "all") && (
              <button onClick={resetFilters}
                className="px-3 py-2 rounded-xl transition-colors duration-150"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: "var(--text-tertiary)", fontFamily: "var(--font-body)", fontSize: "12px", cursor: "pointer" }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Reference", "Paid", "Received", "Network", "Status", ""].map((h) => (
                    <th key={h} style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", padding: "12px 16px", textAlign: "left", background: "var(--bg-tertiary)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageOrders.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-tertiary)" }}>No orders match your filters</td></tr>
                ) : pageOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                    onClick={() => setSelected(o)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>
                        {new Date(o.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-tertiary)" }}>
                        {new Date(o.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>{o.ref}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{o.fiatSymbol}{o.fiatAmount.toLocaleString()}</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-tertiary)" }}>{o.fiatCurrency}</p>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)" }}>{o.cryptoAmount} {o.token}</p>
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>{o.network}</td>
                    <td style={{ padding: "14px 16px" }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--text-tertiary)" }}>
                        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y" style={{ borderColor: "var(--border)" }}>
            {pageOrders.length === 0 ? (
              <p className="p-8 text-center" style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-tertiary)" }}>No orders match your filters</p>
            ) : pageOrders.map((o) => (
              <button key={o.id} type="button" onClick={() => setSelected(o)}
                className="w-full text-left px-4 py-4 transition-colors duration-150"
                style={{ background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-tertiary)" }}>{o.ref}</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                      {new Date(o.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{o.fiatSymbol}{o.fiatAmount.toLocaleString()} {o.fiatCurrency}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--accent)" }}>{o.cryptoAmount} {o.token}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-tertiary)" }}>
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: page === 1 ? "var(--text-tertiary)" : "var(--text-primary)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                      background: page === n ? "var(--accent)" : "var(--bg-tertiary)",
                      border: `1px solid ${page === n ? "var(--accent)" : "var(--border)"}`,
                      color: page === n ? "var(--bg-primary)" : "var(--text-secondary)" }}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: page === totalPages ? "var(--text-tertiary)" : "var(--text-primary)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
