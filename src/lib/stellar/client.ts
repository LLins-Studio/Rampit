import { rpc } from "@stellar/stellar-sdk";

import { RPC_URL } from "./config";

let server: rpc.Server | null = null;

/** Shared Soroban RPC client (singleton). */
export function getSorobanRpc(): rpc.Server {
  if (!server) {
    server = new rpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith("http://") });
  }
  return server;
}
