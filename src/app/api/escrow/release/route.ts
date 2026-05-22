import { NextResponse } from "next/server";
import { evmReleaseOrder, type EvmChainKey } from "@/lib/evm/client";
import { invokeContractAdmin } from "@/lib/stellar/contract";
import { buildReleaseOrderArgs } from "@/lib/stellar/args";
import { getAdminApiSecret } from "@/lib/evm/config";

// POST /api/escrow/release
// Body: { orderId, chain }
// chain: "stellar" | "celo" | "base" | "bnb"

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${getAdminApiSecret()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { orderId, chain } = body ?? {};

  if (!orderId || !chain) {
    return NextResponse.json({ error: "Missing orderId or chain" }, { status: 400 });
  }

  try {
    if (chain === "stellar") {
      const args = buildReleaseOrderArgs(orderId);
      const tx = await invokeContractAdmin("release_order", args);
      return NextResponse.json({ success: true, txHash: tx.txHash });
    }

    const evmChains: EvmChainKey[] = ["celo", "base", "bnb"];
    if (!evmChains.includes(chain)) {
      return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });
    }

    const txHash = await evmReleaseOrder(chain as EvmChainKey, orderId);
    return NextResponse.json({ success: true, txHash });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Release failed" }, { status: 500 });
  }
}
