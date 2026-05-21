import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
const programId = anchor.workspace.RampitEscrow.programId as PublicKey;
const [statePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("state")],
  programId,
);
console.log(statePda.toBase58());
