"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type SavedWallet = { network: string; address: string; memo?: string; label?: string };

export type OrderStatus = "completed" | "pending" | "failed";
export type Order = {
  id: string;
  ref: string;
  txHash: string;
  date: string; // ISO
  fiatAmount: number;
  fiatCurrency: string;
  fiatSymbol: string;
  cryptoAmount: string;
  token: string;
  network: string;
  rate: number;
  wallet: string;
  memo?: string;
  status: OrderStatus;
};

function makeOrder(overrides: Partial<Order> & Pick<Order, "id" | "ref" | "date" | "status">): Order {
  return {
    txHash: "0x" + Math.random().toString(16).slice(2, 18) + Math.random().toString(16).slice(2, 18),
    fiatAmount: 25000, fiatCurrency: "NGN", fiatSymbol: "₦",
    cryptoAmount: "15.12", token: "USDT", network: "TRC-20",
    rate: 1620, wallet: "TXYZabc123456789012345678901234567",
    ...overrides,
  };
}

export const MOCK_ORDERS: Order[] = [
  makeOrder({ id: "1", ref: "RMP-001", date: "2026-05-13T09:15:00Z", status: "completed", fiatAmount: 50000, cryptoAmount: "30.25", token: "USDT", network: "TRC-20" }),
  makeOrder({ id: "2", ref: "RMP-002", date: "2026-05-12T14:30:00Z", status: "completed", fiatAmount: 20000, fiatCurrency: "GHS", fiatSymbol: "₵", cryptoAmount: "1.28", token: "SOL", network: "Solana", rate: 15.4 }),
  makeOrder({ id: "3", ref: "RMP-003", date: "2026-05-11T08:00:00Z", status: "failed",    fiatAmount: 15000, cryptoAmount: "9.07", token: "USDC", network: "ERC-20" }),
  makeOrder({ id: "4", ref: "RMP-004", date: "2026-05-10T17:45:00Z", status: "completed", fiatAmount: 80000, cryptoAmount: "48.40", token: "USDT", network: "BEP-20" }),
  makeOrder({ id: "5", ref: "RMP-005", date: "2026-05-09T11:20:00Z", status: "pending",   fiatAmount: 30000, cryptoAmount: "18.15", token: "USDT", network: "TRC-20" }),
  makeOrder({ id: "6", ref: "RMP-006", date: "2026-05-08T06:55:00Z", status: "completed", fiatAmount: 10000, fiatCurrency: "KES", fiatSymbol: "KSh", cryptoAmount: "76.92", token: "XLM", network: "Stellar", memo: "123456", rate: 130 }),
  makeOrder({ id: "7", ref: "RMP-007", date: "2026-05-07T20:10:00Z", status: "completed", fiatAmount: 45000, cryptoAmount: "27.22", token: "USDT", network: "TRC-20" }),
  makeOrder({ id: "8", ref: "RMP-008", date: "2026-05-06T13:00:00Z", status: "failed",    fiatAmount: 12000, cryptoAmount: "7.26", token: "USDC", network: "BEP-20" }),
  makeOrder({ id: "9", ref: "RMP-009", date: "2026-05-05T09:30:00Z", status: "completed", fiatAmount: 60000, cryptoAmount: "36.30", token: "USDT", network: "ERC-20" }),
  makeOrder({ id: "10", ref: "RMP-010", date: "2026-05-04T16:00:00Z", status: "completed", fiatAmount: 35000, cryptoAmount: "21.18", token: "USDT", network: "TRC-20" }),
  makeOrder({ id: "11", ref: "RMP-011", date: "2026-05-03T10:45:00Z", status: "pending",   fiatAmount: 22000, cryptoAmount: "13.31", token: "USDC", network: "ERC-20" }),
  makeOrder({ id: "12", ref: "RMP-012", date: "2026-05-02T07:20:00Z", status: "completed", fiatAmount: 90000, cryptoAmount: "54.45", token: "USDT", network: "BEP-20" }),
];

export type KycStatus = "unverified" | "pending" | "verified";

export type UserProfile = {
  id: string;
  email: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  phone: string | null;
  country: string | null;
  status: string;
  type: string;
  email_verified_at: string | null;
  created_at: string;
};

type AuthCtx = {
  user: string | null;
  setUser: (u: string | null) => void;
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
  authOpen: boolean;
  setAuthOpen: (o: boolean) => void;
  savedWallets: SavedWallet[];
  setSavedWallets: (w: SavedWallet[]) => void;
  orders: Order[];
  kycStatus: KycStatus;
  setKycStatus: (s: KycStatus) => void;
  kycOpen: boolean;
  setKycOpen: (o: boolean) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx>({
  user: null, setUser: () => {}, profile: null, setProfile: () => {},
  authOpen: false, setAuthOpen: () => {},
  savedWallets: [], setSavedWallets: () => {}, orders: [],
  kycStatus: "unverified", setKycStatus: () => {}, kycOpen: false, setKycOpen: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<string | null>(null);
  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [authOpen, setAuthOpen]       = useState(false);
  const [kycStatus, setKycStatus]     = useState<KycStatus>("unverified");
  const [kycOpen, setKycOpen]         = useState(false);
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const email = localStorage.getItem("rampit_session_email");
    if (email) setUser(email);
  }, []);

  function logout() {
    localStorage.removeItem("rampit_session_email");
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, profile, setProfile, authOpen, setAuthOpen, savedWallets, setSavedWallets, orders: MOCK_ORDERS, kycStatus, setKycStatus, kycOpen, setKycOpen, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
