"use client";

import { WalletIcon } from "@heroicons/react/24/outline";

import { useStellarWallet } from "@/hooks/useStellarWallet";

function truncateKey(key: string): string {
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export function WalletConnect() {
  const {
    publicKey,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    error,
  } = useStellarWallet();

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <span
          className="font-mono text-sm"
          style={{ color: "var(--text-secondary)" }}
          title={publicKey}
        >
          {truncateKey(publicKey)}
        </span>
        <button
          type="button"
          onClick={disconnectWallet}
          className="rounded-lg border px-3 py-1.5 text-sm transition-colors hover:opacity-90"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        Optional (create order uses server signer)
      </p>
      <button
        type="button"
        onClick={() => void connectWallet()}
        disabled={isConnecting}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
        style={{
          backgroundColor: "var(--accent)",
          color: "#0A0A0B",
        }}
      >
        <WalletIcon className="h-4 w-4" />
        {isConnecting ? "Connecting…" : "Connect Freighter"}
      </button>
      {error && (
        <p className="text-xs" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
