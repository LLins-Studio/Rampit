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

export default function PrivacyPage() {
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
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px" }}>Privacy Policy</h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-tertiary)" }}>Last updated: May 13, 2026 · Effective immediately</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <Section title="1. Introduction">
            <P>Rampit Technologies Ltd. ("RAMPIT", "we", "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and share your data when you use our platform.</P>
          </Section>

          <Section title="2. Information We Collect">
            <P>We collect the following categories of personal data:</P>
            <Ul items={[
              "Identity data: full name, date of birth, BVN or NIN (for KYC verification).",
              "Contact data: email address, phone number, country of residence.",
              "Transaction data: order history, fiat amounts, cryptocurrency amounts, wallet addresses, transaction hashes.",
              "Technical data: IP address, browser type, device identifiers, and usage logs.",
              "Communications: support messages and correspondence with our team.",
            ]} />
          </Section>

          <Section title="3. How We Use Your Data">
            <P>We use your personal data to:</P>
            <Ul items={[
              "Process and fulfil cryptocurrency purchase orders.",
              "Verify your identity in compliance with KYC/AML regulations.",
              "Send transactional notifications and order updates (if enabled).",
              "Detect and prevent fraud, money laundering, and other illegal activity.",
              "Improve our platform and user experience through aggregated analytics.",
              "Comply with legal obligations and respond to regulatory requests.",
            ]} />
          </Section>

          <Section title="4. KYC Data Handling">
            <P>BVN and NIN numbers are transmitted over TLS encryption and are used solely for identity verification against authorised verification bureaus. We do not store raw identity numbers in plain text. Verification results are stored as a hashed status record only.</P>
          </Section>

          <Section title="5. Data Sharing">
            <P>We do not sell your personal data. We may share data with:</P>
            <Ul items={[
              "Identity verification partners (e.g., Smile Identity, Dojah) for KYC processing.",
              "Payment processors and banking partners to facilitate fiat transactions.",
              "Law enforcement or regulatory authorities when required by law.",
              "Service providers (hosting, analytics) under strict data processing agreements.",
            ]} />
          </Section>

          <Section title="6. Data Retention">
            <P>We retain your personal data for as long as your account is active and for up to 7 years thereafter to comply with financial regulations. You may request deletion of non-regulatory data by contacting us.</P>
          </Section>

          <Section title="7. Your Rights">
            <P>Depending on your jurisdiction, you may have the right to:</P>
            <Ul items={[
              "Access the personal data we hold about you.",
              "Request correction of inaccurate data.",
              "Request deletion of your data (subject to legal retention requirements).",
              "Object to or restrict certain processing activities.",
              "Data portability — receive your data in a structured, machine-readable format.",
            ]} />
            <P>To exercise any of these rights, contact us at <a href="mailto:privacy@rampit.io" style={{ color: "var(--accent)", textDecoration: "none" }}>privacy@rampit.io</a>.</P>
          </Section>

          <Section title="8. Cookies & Tracking">
            <P>We use essential cookies to maintain your session and preferences (e.g., theme). We do not use third-party advertising trackers. You can disable cookies in your browser settings, though this may affect platform functionality.</P>
          </Section>

          <Section title="9. Security">
            <P>We implement industry-standard security measures including TLS encryption in transit, AES-256 encryption at rest for sensitive fields, and regular security audits. However, no system is completely secure and we cannot guarantee absolute security.</P>
          </Section>

          <Section title="10. Children's Privacy">
            <P>Our Service is not directed at individuals under 18 years of age. We do not knowingly collect personal data from minors. If you believe a minor has provided us with data, please contact us immediately.</P>
          </Section>

          <Section title="11. Changes to This Policy">
            <P>We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on our platform. Continued use of the Service constitutes acceptance of the updated policy.</P>
          </Section>

          <Section title="12. Contact">
            <P>For privacy-related enquiries: <a href="mailto:privacy@rampit.io" style={{ color: "var(--accent)", textDecoration: "none" }}>privacy@rampit.io</a><br />Rampit Technologies Ltd., Lagos, Nigeria.</P>
          </Section>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Link href="/terms" style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-tertiary)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}>
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}
