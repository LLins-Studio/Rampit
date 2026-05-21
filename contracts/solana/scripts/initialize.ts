import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { RampitEscrow } from "../target/types/rampit_escrow";

async function main() {
  const feeBps = parseInt(process.argv[2] ?? process.env.RAMPIT_FEE_BPS ?? "50", 10);
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RampitEscrow as Program<RampitEscrow>;
  const [statePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    program.programId,
  );

  const existing = await provider.connection.getAccountInfo(statePda);
  if (existing) {
    console.log("Already initialized:", statePda.toBase58());
    return;
  }

  const sig = await program.methods
    .initialize(feeBps)
    .accounts({
      state: statePda,
      admin: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Initialized:", statePda.toBase58());
  console.log("Tx:", sig);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
