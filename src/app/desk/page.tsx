"use client";

import Link from "next/link";
import { useState } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  AdminPanel,
  ChainSelect,
  CreateOrderForm,
  OrderStatus,
  WalletConnect,
} from "@/components/stellar";
import { StellarWalletProvider } from "@/hooks/StellarWalletProvider";
import { EVM_ESCROW_PROXY, getEvmExplorer } from "@/lib/evm/config";
import type { RampitChain } from "@/lib/rampit/chain";
import { isEvmChain } from "@/lib/rampit/chain";
import { CONTRACT_ID } from "@/lib/stellar/config";

function truncateContract(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}…${id.slice(-8)}`;
}

function DeskPageContent() {
  const [chain, setChain] = useState<RampitChain>("stellar");

  const contractLabel = isEvmChain(chain)
    ? EVM_ESCROW_PROXY
    : CONTRACT_ID;

  return (
    <>
      <Header />
      <main
        className="min-h-screen"
        style={{
          background: "var(--bg-primary)",
          paddingTop: "96px",
          paddingBottom: "60px",
        }}
      >
        <div className="mx-auto max-w-5xl space-y-8 px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href="/"
                className="mb-3 inline-flex items-center gap-2 transition-colors"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  textDecoration: "none",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path
                    d="M8 2L4 6l4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Home
              </Link>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                Rampit Desk
              </h1>
              <p
                className="mt-1 max-w-xl"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                Multi-chain on-ramp ops — lock, release, and refund across Stellar,
                Celo, Base, and BNB.
              </p>
              {contractLabel ? (
                <p
                  className="mt-2 font-mono text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                  title={contractLabel}
                >
                  {isEvmChain(chain) ? "Proxy" : "Contract"}:{" "}
                  <a
                    href={
                      isEvmChain(chain)
                        ? getEvmExplorer(chain, contractLabel)
                        : undefined
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--accent)" }}
                  >
                    {truncateContract(contractLabel)}
                  </a>
                </p>
              ) : (
                <p className="mt-2 text-xs" style={{ color: "var(--error)" }}>
                  Set NEXT_PUBLIC_STELLAR_CONTRACT_ID in .env.local
                </p>
              )}
            </div>
            {chain === "stellar" && <WalletConnect />}
          </div>

          <ChainSelect value={chain} onChange={setChain} />

          <div className="grid gap-6 lg:grid-cols-2">
            <CreateOrderForm chain={chain} />
            <OrderStatus chain={chain} />
          </div>

          <AdminPanel chain={chain} />
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function DeskPage() {
  return (
    <StellarWalletProvider>
      <DeskPageContent />
    </StellarWalletProvider>
  );
}
