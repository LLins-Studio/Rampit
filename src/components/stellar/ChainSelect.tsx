"use client";

import type { RampitChain } from "@/lib/rampit/chain";
import { RAMPIT_CHAINS } from "@/lib/rampit/chain";

type Props = {
  value: RampitChain;
  onChange: (chain: RampitChain) => void;
};

export function ChainSelect({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {RAMPIT_CHAINS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor:
              value === c.id ? "var(--accent-muted)" : "var(--bg-secondary)",
            color: value === c.id ? "var(--accent)" : "var(--text-secondary)",
            border: `1px solid ${value === c.id ? "var(--accent)" : "var(--border)"}`,
          }}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
