import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { RampitEscrow } from "../target/types/rampit_escrow";

async function main() {
  const newRelayer = process.argv[2];
  if (!newRelayer) {
    throw new Error("Usage: set-relayer.ts <RELAYER_PUBKEY>");
  }

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.RampitEscrow as Program<RampitEscrow>;

  const [statePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    program.programId,
  );

  const sig = await program.methods
    .setRelayer(new PublicKey(newRelayer))
    .accounts({
      state: statePda,
      admin: provider.wallet.publicKey,
    })
    .rpc();

  console.log("Relayer set to:", newRelayer);
  console.log("Tx:", sig);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
