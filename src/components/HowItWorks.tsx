const STEPS = [
  {
    num: "01",
    title: "Choose Currency & Token",
    desc: "Select NGN, GHS, or KES. Enter your amount and pick the crypto you want to receive.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="1.5" y="4" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 10h8M6 13.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 7h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "02",
    title: "Send Fiat to Escrow",
    desc: "Transfer the exact amount to our local bank account. You have 30 minutes to complete the payment.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 10h14M11 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: "03",
    title: "Receive Crypto Instantly",
    desc: "We confirm your transfer and release crypto to your wallet — typically within 5 minutes.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="1.5" y="9" width="17" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6.5 9V7.5a3.5 3.5 0 0 1 7 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="10" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
] as const;

const STATS = [
  { value: "< 5 min", label: "Settlement" },
  { value: "3",       label: "Currencies"  },
  { value: "5",       label: "Tokens"      },
  { value: "24 / 7",  label: "Uptime"      },
] as const;

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-5 py-24">
      <div className="mx-auto max-w-5xl">

        {/* ── Header ── */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span
              className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", background: "var(--accent-muted)", border: "1px solid var(--border-accent)" }}
            >
              How It Works
            </span>
            <h2
              className="text-4xl md:text-5xl font-extrabold leading-[1.08]"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Three steps.<br />
              <span style={{ color: "var(--accent)" }}>Zero friction.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed md:text-right"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
            No sign-ups. No KYC under threshold. Just local currency in — crypto out.
          </p>
        </div>

        {/* ── Steps ── */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-px rounded-2xl overflow-hidden mb-4"
          style={{ background: "var(--border)" }}>

          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="relative flex flex-col p-7 hiw-step transition-colors duration-300"
              style={{ background: "var(--bg-secondary)" }}
            >
              {/* Large ghost number */}
              <span
                className="absolute top-5 right-5 select-none pointer-events-none font-extrabold leading-none"
                aria-hidden="true"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "88px",
                  color: "var(--accent)",
                  opacity: 0.05,
                  lineHeight: 1,
                }}
              >
                {step.num}
              </span>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300"                style={{
                  background: "var(--accent-muted)",
                  border: "1px solid var(--border-accent)",
                  color: "var(--accent)",
                }}
              >
                {step.icon}
              </div>

              <h3
                className="font-bold mb-2 text-base leading-snug"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
              >
                {step.desc}
              </p>

            </div>
          ))}
        </div>

        {/* ── Stats bar ── */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-6 px-4 text-center relative"
              style={{ borderRight: i < 3 ? "1px solid var(--border)" : "none" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--accent)",
                  lineHeight: 1,
                  marginBottom: "5px",
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.04em",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
