import {
  BASE_FEE,
  Contract,
  FeeBumpTransaction,
  Keypair,
  rpc,
  Transaction,
  TransactionBuilder,
  type xdr,
} from "@stellar/stellar-sdk";

import { assertContractConfigured, CONTRACT_ID, NETWORK_PASSPHRASE } from "./config";
import { getSorobanRpc } from "./client";
import { POLL_ATTEMPTS, POLL_INTERVAL_MS } from "./types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertSimulation(
  sim: rpc.Api.SimulateTransactionResponse,
): rpc.Api.SimulateTransactionSuccessResponse {
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }
  if (rpc.Api.isSimulationRestore(sim)) {
    throw new Error(
      "Simulation requires ledger entry restoration; run a restore transaction first",
    );
  }
  return sim;
}

export async function pollTransaction(
  hash: string,
): Promise<rpc.Api.GetTransactionResponse> {
  const server = getSorobanRpc();
  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    const tx = await server.getTransaction(hash);
    if (tx.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) {
      return tx;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Transaction ${hash} not confirmed after ${POLL_ATTEMPTS} attempts`);
}

async function buildContractTransaction(
  sourcePublicKey: string,
  functionName: string,
  args: xdr.ScVal[],
): Promise<{
  prepared: ReturnType<TransactionBuilder["build"]>;
  simulation: rpc.Api.SimulateTransactionSuccessResponse;
}> {
  assertContractConfigured();
  const server = getSorobanRpc();
  const account = await server.getAccount(sourcePublicKey);
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(180)
    .build();

  const simulated = await server.simulateTransaction(tx);
  const simulation = assertSimulation(simulated);

  const prepared = rpc.assembleTransaction(tx, simulation).build();

  return { prepared, simulation };
}

/** Read-only simulation (no submit). */
export async function simulateContractCall(
  sourcePublicKey: string,
  functionName: string,
  args: xdr.ScVal[],
): Promise<rpc.Api.SimulateTransactionSuccessResponse> {
  const { simulation } = await buildContractTransaction(
    sourcePublicKey,
    functionName,
    args,
  );
  return simulation;
}

async function submitSignedTransaction(
  signed: Transaction | FeeBumpTransaction,
): Promise<rpc.Api.GetTransactionResponse> {
  const server = getSorobanRpc();
  const send = await server.sendTransaction(signed);

  if (send.status === "ERROR") {
    throw new Error(
      send.errorResult
        ? `Submit failed: ${send.errorResult.toXDR("base64")}`
        : "Submit failed",
    );
  }

  return pollTransaction(send.hash);
}

/**
 * Server-side invoke — signs with ADMIN_SECRET_KEY.
 * Do not call from client code.
 */
export async function invokeContractAdmin(
  functionName: string,
  args: xdr.ScVal[],
): Promise<rpc.Api.GetTransactionResponse> {
  if (typeof window !== "undefined") {
    throw new Error("invokeContractAdmin must only run on the server");
  }

  const { getAdminSecretKey } = await import("./config");
  const admin = Keypair.fromSecret(getAdminSecretKey());
  const { prepared } = await buildContractTransaction(
    admin.publicKey(),
    functionName,
    args,
  );

  prepared.sign(admin);
  return submitSignedTransaction(prepared);
}

/**
 * Client-side invoke — returns prepared XDR for Freighter signing.
 */
export async function prepareContractUserTransaction(
  functionName: string,
  args: xdr.ScVal[],
  userPublicKey: string,
): Promise<string> {
  const { prepared } = await buildContractTransaction(
    userPublicKey,
    functionName,
    args,
  );
  return prepared.toXDR();
}

/**
 * Submit a Freighter-signed transaction and poll for result.
 */
export async function submitSignedUserTransaction(
  signedXdr: string,
): Promise<rpc.Api.GetTransactionResponse> {
  const tx = TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE,
  ) as Transaction;
  return submitSignedTransaction(tx);
}

/**
 * Client-side: prepare → sign via callback → submit.
 */
export async function invokeContractUser(
  functionName: string,
  args: xdr.ScVal[],
  userPublicKey: string,
  signXdr: (xdr: string) => Promise<string>,
): Promise<rpc.Api.GetTransactionResponse> {
  const unsignedXdr = await prepareContractUserTransaction(
    functionName,
    args,
    userPublicKey,
  );
  const signedXdr = await signXdr(unsignedXdr);
  return submitSignedUserTransaction(signedXdr);
}
