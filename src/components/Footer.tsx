import Link from "next/link";

const NAV_LINKS = [
  { label: "Terms",   href: "/terms"   },
  { label: "Privacy", href: "/privacy" },
  { label: "Support", href: "mailto:support@rampit.xyz" },
] as const;

export default function Footer() {
  return (
    <footer className="px-5 py-6" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div
          className="flex items-center gap-2 text-sm"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          <span
            className="font-bold tracking-widest"
            style={{ fontFamily: "var(--font-display)", fontSize: "15px", color: "var(--text-secondary)" }}
          >
            RAMPIT
          </span>
          <span aria-hidden="true">·</span>
          <span>© 2025 Rampit Technologies Ltd.</span>
        </div>

        <nav className="flex items-center gap-5" aria-label="Footer navigation">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="footer-link text-sm"
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--text-tertiary)",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
