import Image from "next/image";

const CRYPTO_ICONS = [
  { src: "/icons/crypto/tether-usdt.svg",   alt: "USDT" },
  { src: "/icons/crypto/usdcoin-usdc.svg",  alt: "USDC" },
  { src: "/icons/crypto/celo-celo.svg",     alt: "CELO" },
  { src: "/icons/crypto/solana-sol.svg",    alt: "SOL"  },
  { src: "/icons/crypto/stellar-xlm.svg",   alt: "XLM"  },
] as const;

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center px-5 pt-32 pb-14 overflow-hidden text-center">
      {/* Mesh background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% -10%, rgba(181,204,24,0.09) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 85% 70%, rgba(181,204,24,0.04) 0%, transparent 55%),
            var(--bg-primary)
          `,
        }}
      />

      {/* Eyebrow */}
      <span
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-6"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--accent)",
          background: "var(--accent-muted)",
          border: "1px solid var(--border-accent)",
          animation: "var(--animate-fade-in-up)",
          animationDelay: "0s",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
        Africa&apos;s Crypto Onramp
      </span>

      {/* Headline */}
      <h1
        className="max-w-2xl text-4xl md:text-5xl lg:text-[64px] font-extrabold leading-[1.08] tracking-tight"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--text-primary)",
          animation: "var(--animate-fade-in-up)",
          animationDelay: "0.1s",
        }}
      >
        Buy Crypto.
        <br />
        <span style={{ color: "var(--accent)" }}>Pay Local.</span>
      </h1>

      {/* Subheadline */}
      <p
        className="mt-5 max-w-md text-base md:text-lg leading-relaxed"
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 400,
          color: "var(--text-secondary)",
          animation: "var(--animate-fade-in-up)",
          animationDelay: "0.18s",
        }}
      >
        Convert NGN, GHS, or KES to crypto in minutes.
        No bank drama, no delays.
      </p>

      {/* Token icons strip */}
      <div
        className="mt-10 flex items-center gap-3"
        style={{ animation: "var(--animate-fade-in-up)", animationDelay: "0.28s" }}
      >
        <span
          className="text-xs mr-1"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          Supported tokens
        </span>
        {CRYPTO_ICONS.map(({ src, alt }) => (
          <div
            key={alt}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }}
            title={alt}
          >
            <Image src={src} alt={alt} width={20} height={20} />
          </div>
        ))}
      </div>
    </section>
  );
}
