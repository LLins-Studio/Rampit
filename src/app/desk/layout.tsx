import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rampit Desk — On-ramp ops",
  description:
    "Create, release, and refund Rampit escrow orders on Stellar, Celo, Base, and BNB.",
};

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
