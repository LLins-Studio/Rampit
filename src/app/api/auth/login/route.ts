import { NextResponse } from "next/server";

const API_BASE = process.env.RAMPIT_API_BASE?.trim() || "https://api.rampit.xyz/api/v1";

async function proxy(request: Request, path: string) {
  const payload = await request.json().catch(() => null);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    return NextResponse.json(body, { status: response.status });
  } catch (err) {
    console.error("Upstream auth/login proxy error:", err);
    return NextResponse.json({ error: "Upstream request failed" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  return proxy(request, "/auth/login");
}
