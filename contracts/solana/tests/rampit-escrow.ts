import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { RampitEscrow } from "../target/types/rampit_escrow";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { expect } from "chai";

describe("rampit-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RampitEscrow as Program<RampitEscrow>;
  const admin = provider.wallet as anchor.Wallet;
  const relayer = Keypair.generate();
  const recipient = Keypair.generate();
  const stranger = Keypair.generate();

  let mint: PublicKey;
  let relayerAta: PublicKey;
  let recipientAta: PublicKey;
  let adminAta: PublicKey;
  let escrowAta: PublicKey;
  let statePda: PublicKey;

  const FEE_BPS = 50;
  const AMOUNT = 1_000_000_000;

  function orderId(n: number): number[] {
    const id = new Array(32).fill(0);
    id[0] = n;
    return id;
  }

  before(async () => {
    const airdrop = async (pk: PublicKey) => {
      const sig = await provider.connection.requestAirdrop(
        pk,
        10 * LAMPORTS_PER_SOL,
      );
      await provider.connection.confirmTransaction(sig);
    };
    await airdrop(relayer.publicKey);
    await airdrop(recipient.publicKey);
    await airdrop(stranger.publicKey);

    mint = await createMint(
      provider.connection,
      admin.payer,
      admin.publicKey,
      null,
      6,
    );

    relayerAta = await createAssociatedTokenAccount(
      provider.connection,
      admin.payer,
      mint,
      relayer.publicKey,
    );
    recipientAta = await createAssociatedTokenAccount(
      provider.connection,
      admin.payer,
      mint,
      recipient.publicKey,
    );
    adminAta = await createAssociatedTokenAccount(
      provider.connection,
      admin.payer,
      mint,
      admin.publicKey,
    );

    await mintTo(
      provider.connection,
      admin.payer,
      mint,
      relayerAta,
      admin.publicKey,
      10_000_000_000,
    );

    [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state")],
      program.programId,
    );
    escrowAta = await getAssociatedTokenAddress(mint, statePda, true);
  });

  async function createOrder(oid: number[], expiry?: BN) {
    const [orderPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), Buffer.from(oid)],
      program.programId,
    );
    const exp = expiry ?? new BN(Math.floor(Date.now() / 1000) + 3600);

    await program.methods
      .createOrder(oid, new BN(AMOUNT), new BN(0), exp, { onRamp: {} })
      .accounts({
        relayer: relayer.publicKey,
        recipient: recipient.publicKey,
        systemProgram: SystemProgram.programId,
        order: orderPda,
        state: statePda,
        tokenMint: mint,
        relayerTokenAccount: relayerAta,
        escrowTokenAccount: escrowAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([relayer])
      .rpc();

    return orderPda;
  }

  it("initializes the escrow state", async () => {
    await program.methods
      .initialize(FEE_BPS)
      .accounts({
        state: statePda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const state = await program.account.escrowState.fetch(statePda);
    expect(state.admin.toBase58()).to.equal(admin.publicKey.toBase58());
    expect(state.feeBps).to.equal(FEE_BPS);
  });

  it("fails on double initialization", async () => {
    try {
      await program.methods
        .initialize(FEE_BPS)
        .accounts({
          state: statePda,
          admin: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("should have thrown");
    } catch (e: unknown) {
      expect(e).to.exist;
    }
  });

  it("sets the relayer", async () => {
    await program.methods
      .setRelayer(relayer.publicKey)
      .accounts({ state: statePda, admin: admin.publicKey })
      .rpc();

    const state = await program.account.escrowState.fetch(statePda);
    expect(state.relayer.toBase58()).to.equal(relayer.publicKey.toBase58());
  });

  it("creates an order (relayer funds, recipient stored)", async () => {
    const oid = orderId(1);
    const orderPda = await createOrder(oid);

    const order = await program.account.order.fetch(orderPda);
    expect(order.recipient.toBase58()).to.equal(
      recipient.publicKey.toBase58(),
    );
    expect(order.funder.toBase58()).to.equal(relayer.publicKey.toBase58());
    expect(order.amount.toNumber()).to.equal(AMOUNT);
    expect(order.status).to.deep.equal({ pending: {} });

    const escrow = await getAccount(provider.connection, escrowAta);
    expect(Number(escrow.amount)).to.be.gte(AMOUNT);
  });

  it("releases an order to recipient (full lifecycle)", async () => {
    const oid = orderId(2);
    const orderPda = await createOrder(oid);
    const [feePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fees"), mint.toBuffer()],
      program.programId,
    );

    const balBefore = (await getAccount(provider.connection, recipientAta))
      .amount;

    await program.methods
      .releaseOrder(oid)
      .accounts({
        order: orderPda,
        state: statePda,
        relayer: relayer.publicKey,
        recipient: recipient.publicKey,
        tokenMint: mint,
        recipientTokenAccount: recipientAta,
        escrowTokenAccount: escrowAta,
        feeAccount: feePda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([relayer])
      .rpc();

    const balAfter = (await getAccount(provider.connection, recipientAta)).amount;
    const fee = Math.floor((AMOUNT * FEE_BPS) / 10_000);
    const net = AMOUNT - fee;
    expect(Number(balAfter) - Number(balBefore)).to.equal(net);

    const feeAcc = await program.account.feeAccount.fetch(feePda);
    expect(feeAcc.accumulated.toNumber()).to.equal(fee);

    const info = await provider.connection.getAccountInfo(orderPda);
    expect(info).to.be.null;
  });

  it("cancels an order (relayer, before expiry)", async () => {
    const oid = orderId(3);
    const orderPda = await createOrder(oid);

    const balBefore = (await getAccount(provider.connection, relayerAta)).amount;

    await program.methods
      .cancelOrder(oid)
      .accounts({
        order: orderPda,
        state: statePda,
        relayer: relayer.publicKey,
        tokenMint: mint,
        funderTokenAccount: relayerAta,
        escrowTokenAccount: escrowAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([relayer])
      .rpc();

    const balAfter = (await getAccount(provider.connection, relayerAta)).amount;
    expect(Number(balAfter) - Number(balBefore)).to.equal(AMOUNT);
  });

  it("refunds by relayer", async () => {
    const oid = orderId(4);
    const orderPda = await createOrder(oid);

    await program.methods
      .refundOrder(oid)
      .accounts({
        order: orderPda,
        state: statePda,
        relayer: relayer.publicKey,
        tokenMint: mint,
        funderTokenAccount: relayerAta,
        escrowTokenAccount: escrowAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([relayer])
      .rpc();

    const info = await provider.connection.getAccountInfo(orderPda);
    expect(info).to.be.null;
  });

  it("rejects create from non-relayer", async () => {
    const oid = orderId(8);
    const [orderPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("order"), Buffer.from(oid)],
      program.programId,
    );

    try {
      await program.methods
        .createOrder(oid, new BN(AMOUNT), new BN(0), new BN(Math.floor(Date.now() / 1000) + 3600), {
          onRamp: {},
        })
        .accounts({
          relayer: stranger.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
          order: orderPda,
          state: statePda,
          tokenMint: mint,
          relayerTokenAccount: relayerAta,
          escrowTokenAccount: escrowAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([stranger])
        .rpc();
      expect.fail("should have thrown");
    } catch (e: any) {
      expect(e.error?.errorCode?.code).to.equal("Unauthorized");
    }
  });

  it("collects fees", async () => {
    const [feePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fees"), mint.toBuffer()],
      program.programId,
    );

    const feeAcc = await program.account.feeAccount.fetch(feePda);
    const expected = feeAcc.accumulated.toNumber();
    expect(expected).to.be.gt(0);

    const balBefore = (await getAccount(provider.connection, adminAta)).amount;

    await program.methods
      .collectFees()
      .accounts({
        state: statePda,
        admin: admin.publicKey,
        tokenMint: mint,
        feeAccount: feePda,
        escrowTokenAccount: escrowAta,
        adminTokenAccount: adminAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const balAfter = (await getAccount(provider.connection, adminAta)).amount;
    expect(Number(balAfter) - Number(balBefore)).to.equal(expected);

    const feeAccAfter = await program.account.feeAccount.fetch(feePda);
    expect(feeAccAfter.accumulated.toNumber()).to.equal(0);
  });
});
