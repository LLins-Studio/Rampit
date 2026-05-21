"use client";

import { rpc } from "@stellar/stellar-sdk";
import {
  getAddress,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { buildArgsFromPayload } from "@/lib/stellar/api-args";
import { NETWORK_PASSPHRASE } from "@/lib/stellar/config";
import { invokeContractUser } from "@/lib/stellar/contract";
import type { ContractResult } from "@/lib/stellar/types";

type StellarWalletContextValue = {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  signAndSubmit: (
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<ContractResult>;
};

const StellarWalletContext = createContext<StellarWalletContextValue | null>(
  null,
);

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const connected = await isConnected();
      if (!connected.isConnected) {
        const access = await requestAccess();
        if (access.error) throw new Error(access.error.message ?? "Access denied");
        setPublicKey(access.address);
        return access.address;
      }
      const addr = await getAddress();
      if (addr.error) throw new Error(addr.error.message ?? "Could not get address");
      setPublicKey(addr.address);
      return addr.address;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setPublicKey(null);
    setError(null);
  }, []);

  const signAndSubmit = useCallback(
    async (
      functionName: string,
      args: Record<string, unknown>,
    ): Promise<ContractResult> => {
      if (!publicKey) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsLoading(true);
      setError(null);

      try {
        const scArgs = buildArgsFromPayload(functionName, args);
        const tx = await invokeContractUser(
          functionName,
          scArgs,
          publicKey,
          async (xdr) => {
            const signed = await signTransaction(xdr, {
              networkPassphrase: NETWORK_PASSPHRASE,
              address: publicKey,
            });
            if (signed.error) {
              throw new Error(signed.error.message ?? "Signing rejected");
            }
            return signed.signedTxXdr;
          },
        );

        if (tx.status === rpc.Api.GetTransactionStatus.FAILED) {
          return { success: false, error: "Transaction failed on ledger" };
        }

        return { success: true, data: null, txHash: tx.txHash };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transaction failed";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey],
  );

  const value = useMemo(
    () => ({
      publicKey,
      isConnected: Boolean(publicKey),
      isConnecting,
      isLoading,
      error,
      connectWallet,
      disconnectWallet,
      signAndSubmit,
    }),
    [
      publicKey,
      isConnecting,
      isLoading,
      error,
      connectWallet,
      disconnectWallet,
      signAndSubmit,
    ],
  );

  return (
    <StellarWalletContext.Provider value={value}>
      {children}
    </StellarWalletContext.Provider>
  );
}

export function useStellarWallet(): StellarWalletContextValue {
  const ctx = useContext(StellarWalletContext);
  if (!ctx) {
    throw new Error("useStellarWallet must be used within StellarWalletProvider");
  }
  return ctx;
}
