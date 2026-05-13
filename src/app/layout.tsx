import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import AuthModalRoot from "@/components/AuthModalRoot";
import KycModal from "@/components/KycModal";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RAMPIT — Buy Crypto with African Fiat",
  description:
    "The fastest, most secure way for Africans to convert local currency to crypto — no bank drama, no delays.",
  openGraph: {
    title: "RAMPIT — Buy Crypto with African Fiat",
    description: "Convert NGN, GHS, or KES to USDT, USDC, CELO, SOL, XLM in minutes.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`,
          }}
        />
      </head>
      <body style={{ fontFamily: "var(--font-display)" }}>
        <AuthProvider>
          <AuthModalRoot />
          <KycModal />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
