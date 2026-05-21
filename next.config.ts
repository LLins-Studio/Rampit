import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Standard Next build — required for /desk server actions and /api/auth routes.
  // Static export (`output: "export"`) breaks those in production (Netlify included).
  images: { unoptimized: true },
  // Pin workspace root so Turbopack does not scan $HOME (extra lockfile there).
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
