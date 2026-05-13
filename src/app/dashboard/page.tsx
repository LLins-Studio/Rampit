"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth, Order } from "@/lib/AuthContext";

// ── Tiny SVG line chart ──────────────────────────────────────────────────────
function LineChart({ orders }: { orders: Order[] }) {
  const W = 600, H = 160, PAD = { t: 16, r: 16, b: 32, l: 48 };

  const points = useMemo(() => {
    // Group completed orders by date (last 10 days)
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    orders.filter((o) => o.status === "completed").forEach((o) => {
      const k = o.date.slice(0, 10);
      if (k in days) days[k] += o.fiatAmount;
    });
    return Object.entries(days).map(([date, val]) => ({ date, val }));
  }, [orders]);

  const maxVal = Math.max(...points.map((p) => p.val), 1);
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const coords = points.map((p, i) => ({
    x: PAD.l + (i / (points.length - 1)) * iW,
    y: PAD.t + iH - (p.val / maxVal) * iH,
    ...p,
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaD = pathD + ` L${coords[coords.length - 1].x.toFixed(1)},${(PAD.t + iH).toFixed(1)} L${PAD.l},${(PAD.t + iH).toFixed(1)} Z`;

  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; val: number } | null>(null);

  return (
    <div className="relative w-full" style={{ aspectRatio: `${W}/${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Y grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD.t + iH - t * iH;
          return (
            <g key={t}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="var(--border)" strokeWidth="1" />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fill: "var(--text-tertiary)" }}>
                {t === 0 ? "0" : `₦${((maxVal * t) / 1000).toFixed(0)}k`}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <path d={areaD} fill="url(#chartGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots + hover targets */}
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="3.5" fill="var(--accent)" stroke="var(--bg-secondary)" strokeWidth="2" />
            <rect x={c.x - 20} y={PAD.t} width="40" height={iH + PAD.b} fill="transparent"
              onMouseEnter={() => setTooltip({ x: c.x, y: c.y, date: c.date, val: c.val })}
              onMouseLeave={() => setTooltip(null)} style={{ cursor: "crosshair" }} />
            {/* X label */}
            <text x={c.x} y={H - 6} textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fill: "var(--text-tertiary)" }}>
              {c.date.slice(5)}
            </text>
          </g>
        ))}
        {/* Tooltip */}
        {tooltip && tooltip.val > 0 && (
          <g>
            <line x1={tooltip.x} y1={PAD.t} x2={tooltip.x} y2={PAD.t + iH} stroke="var(--border-accent)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x={Math.min(tooltip.x + 8, W - 110)} y={tooltip.y - 28} width="100" height="24" rx="6" fill="var(--bg-tertiary)" stroke="var(--border-accent)" strokeWidth="1" />
            <text x={Math.min(tooltip.x + 58, W - 60)} y={tooltip.y - 12} textAnchor="middle" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fill: "var(--text-primary)", fontWeight: 700 }}>
              ₦{tooltip.val.toLocaleString()}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-secondary)", border: `1px solid ${accent ? "var(--border-accent)" : "var(--border)"}` }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "10px" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "26px", fontWeight: 800, color: accent ? "var(--accent)" : "var(--text-primary)", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-tertiary)", marginTop: "6px" }}>{sub}</p>}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, orders } = useAuth();

  const completed = orders.filter((o) => o.status === "completed");
  const pending   = orders.filter((o) => o.status === "pending");
  const failed    = orders.filter((o) => o.status === "failed");
  const totalVol  = completed.reduce((s, o) => s + o.fiatAmount, 0);
  const avgOrder  = completed.length ? totalVol / completed.length : 0;

  // Token breakdown
  const tokenBreakdown = completed.reduce<Record<string, number>>((acc, o) => {
    acc[o.token] = (acc[o.token] ?? 0) + parseFloat(o.cryptoAmount);
    return acc;
  }, {});

  // Recent 5 orders
  const recent = [...orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const STATUS_COLOR: Record<string, string> = { completed: "var(--success)", pending: "#eab308", failed: "var(--error)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", paddingTop: "80px", paddingBottom: "60px" }}>
      <div className="mx-auto max-w-5xl px-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-3 transition-colors duration-200"
              style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-tertiary)", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </Link>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>Dashboard</h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Welcome back, <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{user}</span>
            </p>
          </div>
          <Link href="/history"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-150"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            View All Orders →
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Volume" value={`₦${(totalVol / 1000).toFixed(0)}k`} sub={`${orders.length} orders`} accent />
          <StatCard label="Completed"    value={String(completed.length)} sub={`${orders.length ? ((completed.length / orders.length) * 100).toFixed(0) : 0}% success rate`} />
          <StatCard label="Pending"      value={String(pending.length)}   sub="Awaiting confirmation" />
          <StatCard label="Avg Order"    value={`₦${(avgOrder / 1000).toFixed(1)}k`} sub="Per completed order" />
        </div>

        {/* Line chart */}
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "2px" }}>Volume (Last 10 Days)</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>₦{totalVol.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded" style={{ background: "var(--accent)", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-tertiary)" }}>Fiat paid</span>
            </div>
          </div>
          <LineChart orders={orders} />
        </div>

        {/* Bottom row: token breakdown + recent orders */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Token breakdown */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Token Breakdown</h2>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(tokenBreakdown).length === 0 ? (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-tertiary)", padding: "8px 0" }}>No completed orders yet</p>
              ) : Object.entries(tokenBreakdown).map(([token, amt]) => {
                const total = Object.values(tokenBreakdown).reduce((s, v) => s + v, 0);
                const pct = total ? (amt / total) * 100 : 0;
                return (
                  <div key={token}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{token}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>{amt.toFixed(2)} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent orders */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Recent Orders</h2>
              <Link href="/history" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>See all</Link>
            </div>
            <div>
              {recent.map((o, i) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {o.cryptoAmount} {o.token}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                      {new Date(o.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · {o.ref}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {o.fiatSymbol}{o.fiatAmount.toLocaleString()}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1" style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700, color: STATUS_COLOR[o.status], textTransform: "capitalize" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[o.status] }} />
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
