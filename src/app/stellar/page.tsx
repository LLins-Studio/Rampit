"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — forwards to /desk */
export default function StellarRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/desk");
  }, [router]);

  return (
    <p className="p-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
      Redirecting to Rampit Desk…
    </p>
  );
}
