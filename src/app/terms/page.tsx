"use client";

import Link from "next/link";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>{title}</h2>
      <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: "10px" }}>{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: "6px", listStyleType: "disc" }}>{item}</li>)}
    </ul>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", paddingTop: "80px", paddingBottom: "80px" }}>
      <div className="mx-auto max-w-3xl px-5">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-5 transition-colors duration-200"
            style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-tertiary)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back
          </Link>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "8px" }}>Legal</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px" }}>Terms of Service</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-tertiary)" }}>Last updated: May 13, 2026 · Effective immediately</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <Section title="1. Acceptance of Terms">
            <P>By accessing or using the RAMPIT platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use the Service. RAMPIT is operated by Rampit Technologies Ltd., a company registered in Nigeria.</P>
          </Section>

          <Section title="2. Eligibility">
            <P>You must be at least 18 years of age and a resident of a supported country (Nigeria, Ghana, or Kenya) to use the Service. By using RAMPIT, you represent and warrant that you meet these requirements.</P>
          </Section>

          <Section title="3. Services Provided">
            <P>RAMPIT provides a peer-to-peer crypto on-ramp service that allows users to purchase cryptocurrency using local African fiat currencies. We act as an intermediary escrow service and do not hold cryptocurrency on your behalf beyond the duration of a transaction.</P>
          </Section>

          <Section title="4. User Obligations">
            <P>You agree to:</P>
            <Ul items={[
              "Provide accurate and complete information during registration and KYC verification.",
              "Use the Service only for lawful purposes and in compliance with all applicable laws.",
              "Not use the Service to facilitate money laundering, fraud, or any other illegal activity.",
              "Keep your account credentials confidential and notify us immediately of any unauthorised access.",
              "Provide a correct and compatible receiving wallet address. RAMPIT is not responsible for funds sent to incorrect addresses.",
            ]} />
          </Section>

          <Section title="5. KYC & AML Compliance">
            <P>RAMPIT is required to comply with Know Your Customer (KYC) and Anti-Money Laundering (AML) regulations. Orders exceeding $50 USD equivalent require identity verification. We reserve the right to suspend or terminate accounts that fail to complete verification or are suspected of fraudulent activity.</P>
          </Section>

          <Section title="6. Transaction Finality">
            <P>All cryptocurrency transactions are irreversible once broadcast to the blockchain. RAMPIT is not liable for losses arising from incorrect wallet addresses, network selection errors, or user mistakes. You are solely responsible for verifying all transaction details before confirming an order.</P>
          </Section>

          <Section title="7. Fees">
            <P>RAMPIT charges a network fee per transaction, displayed clearly before order confirmation. Rates are updated in real time and are subject to change. The rate displayed at the time of order confirmation is the rate applied to your transaction.</P>
          </Section>

          <Section title="8. Limitation of Liability">
            <P>To the maximum extent permitted by law, RAMPIT and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to loss of funds due to market volatility, network failures, or user error.</P>
          </Section>

          <Section title="9. Termination">
            <P>We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.</P>
          </Section>

          <Section title="10. Governing Law">
            <P>These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved through binding arbitration in Lagos, Nigeria, except where prohibited by applicable law.</P>
          </Section>

          <Section title="11. Changes to Terms">
            <P>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms. We will notify registered users of material changes via email.</P>
          </Section>

          <Section title="12. Contact">
            <P>For questions about these Terms, contact us at <a href="mailto:legal@rampit.io" style={{ color: "var(--accent)", textDecoration: "none" }}>legal@rampit.io</a>.</P>
          </Section>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Link href="/privacy" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-tertiary)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}>
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
