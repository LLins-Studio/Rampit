import { describe, it, expect, beforeEach } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

const ESCROW = "rampit-escrow";
const TOKEN = "mock-token";
const TOKEN_2 = "mock-token-2";

const orderId = Cl.bufferFromHex(
  "aa".repeat(32)
);
const orderId2 = Cl.bufferFromHex(
  "bb".repeat(32)
);

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const FEE_BPS = 100; // 1%
const MINT_AMOUNT = 1_000_000_000; // 1000 tokens (6 decimals)
const ORDER_AMOUNT = 100_000_000; // 100 tokens
const RATE = 1_650_000; // NGN rate

function tokenArg(contractName: string = TOKEN) {
  return Cl.contractPrincipal(deployer, contractName);
}

function initialize(
  admin: string = deployer,
  relayer: string = wallet1,
  feeBps: number = FEE_BPS,
  sender: string = deployer
) {
  return simnet.callPublicFn(
    ESCROW,
    "initialize",
    [Cl.standardPrincipal(admin), Cl.standardPrincipal(relayer), Cl.uint(feeBps)],
    sender
  );
}

function mintTokens(
  recipient: string,
  amount: number = MINT_AMOUNT,
  contractName: string = TOKEN
) {
  return simnet.callPublicFn(
    contractName,
    "mint",
    [Cl.uint(amount), Cl.standardPrincipal(recipient)],
    deployer
  );
}

function createOrder(
  sender: string,
  id = orderId,
  amount: number = ORDER_AMOUNT,
  expiryOffset: number = 100,
  direction: string = "on-ramp",
  contractName: string = TOKEN
) {
  const expiry = simnet.blockHeight + expiryOffset;
  return simnet.callPublicFn(
    ESCROW,
    "create-order",
    [
      id,
      tokenArg(contractName),
      Cl.uint(amount),
      Cl.uint(RATE),
      Cl.uint(expiry),
      Cl.stringAscii(direction),
    ],
    sender
  );
}

function releaseOrder(
  sender: string,
  id = orderId,
  contractName: string = TOKEN
) {
  return simnet.callPublicFn(
    ESCROW,
    "release-order",
    [id, tokenArg(contractName)],
    sender
  );
}

function refundOrder(
  sender: string,
  id = orderId,
  contractName: string = TOKEN
) {
  return simnet.callPublicFn(
    ESCROW,
    "refund-order",
    [id, tokenArg(contractName)],
    sender
  );
}

function cancelOrder(
  sender: string,
  id = orderId,
  contractName: string = TOKEN
) {
  return simnet.callPublicFn(
    ESCROW,
    "cancel-order",
    [id, tokenArg(contractName)],
    sender
  );
}

function collectFees(sender: string, contractName: string = TOKEN) {
  return simnet.callPublicFn(
    ESCROW,
    "collect-fees",
    [tokenArg(contractName)],
    sender
  );
}

function getOrder(id = orderId) {
  return simnet.callReadOnlyFn(ESCROW, "get-order", [id], deployer);
}

function getAccumulatedFees(contractName: string = TOKEN) {
  return simnet.callReadOnlyFn(
    ESCROW,
    "get-accumulated-fees",
    [tokenArg(contractName)],
    deployer
  );
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe("rampit-escrow", () => {
  // ─── Initialize ─────────────────────────────────────────────────────────

  describe("initialize", () => {
    it("succeeds on first call", () => {
      const { result } = initialize();
      expect(result).toBeOk(Cl.bool(true));
    });

    it("fails on second call with ERR-ALREADY-INITIALIZED", () => {
      initialize();
      const { result } = initialize();
      expect(result).toBeErr(Cl.uint(1));
    });

    it("fails with invalid fee bps > 10000", () => {
      const { result } = initialize(deployer, wallet1, 10001);
      expect(result).toBeErr(Cl.uint(12));
    });

    it("sets admin, relayer, and fee-bps correctly", () => {
      initialize(wallet2, wallet3, 250);

      const admin = simnet.callReadOnlyFn(ESCROW, "get-admin", [], deployer);
      expect(admin.result).toStrictEqual(Cl.standardPrincipal(wallet2));

      const relayer = simnet.callReadOnlyFn(ESCROW, "get-relayer", [], deployer);
      expect(relayer.result).toStrictEqual(Cl.standardPrincipal(wallet3));

      const feeBps = simnet.callReadOnlyFn(ESCROW, "get-fee-bps", [], deployer);
      expect(feeBps.result).toStrictEqual(Cl.uint(250));
    });
  });

  // ─── Full Lifecycle: create → release → collect-fees ────────────────────

  describe("full lifecycle: create → release → collect-fees", () => {
    it("completes the full on-ramp lifecycle", () => {
      initialize();
      mintTokens(wallet2);

      const { result: createResult } = createOrder(wallet2);
      expect(createResult).toBeOk(Cl.bool(true));

      const order = getOrder();
      expect(order.result).toBeSome(
        Cl.tuple({
          user: Cl.standardPrincipal(wallet2),
          token: Cl.contractPrincipal(deployer, TOKEN),
          amount: Cl.uint(ORDER_AMOUNT),
          rate: Cl.uint(RATE),
          expiry: Cl.uint(simnet.blockHeight + 99),
          direction: Cl.stringAscii("on-ramp"),
          status: Cl.stringAscii("pending"),
        })
      );

      // relayer (wallet1) releases
      const { result: releaseResult } = releaseOrder(wallet1);
      expect(releaseResult).toBeOk(Cl.bool(true));

      // Verify order status
      const releasedOrder = getOrder();
      expect(releasedOrder.result.type).toBe(ClarityType.OptionalSome);

      // Verify fee accumulation: 1% of 100_000_000 = 1_000_000
      const fees = getAccumulatedFees();
      expect(fees.result).toStrictEqual(Cl.uint(1_000_000));

      // Admin (deployer) collects fees
      const { result: collectResult } = collectFees(deployer);
      expect(collectResult).toBeOk(Cl.bool(true));

      // Fees should be zero after collection
      const feesAfter = getAccumulatedFees();
      expect(feesAfter.result).toStrictEqual(Cl.uint(0));
    });
  });

  // ─── Cancel Order ───────────────────────────────────────────────────────

  describe("cancel-order", () => {
    it("user cancels before expiry — tokens returned", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2, orderId, ORDER_AMOUNT, 100);
      const { result } = cancelOrder(wallet2);
      expect(result).toBeOk(Cl.bool(true));

      const order = getOrder();
      expect(order.result.type).toBe(ClarityType.OptionalSome);
      if (order.result.type === ClarityType.OptionalSome) {
        const tuple = (order.result as any).value;
        expect(tuple.value.status).toStrictEqual(Cl.stringAscii("cancelled"));
      }
    });

    it("non-owner cannot cancel", () => {
      initialize();
      mintTokens(wallet2);
      createOrder(wallet2);

      const { result } = cancelOrder(wallet3);
      expect(result).toBeErr(Cl.uint(3)); // ERR-UNAUTHORIZED
    });
  });

  // ─── Refund Order ───────────────────────────────────────────────────────

  describe("refund-order", () => {
    it("user refunds after expiry succeeds", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2, orderId, ORDER_AMOUNT, 5);

      // Mine blocks to pass expiry
      simnet.mineEmptyBlocks(10);

      const { result } = refundOrder(wallet2);
      expect(result).toBeOk(Cl.bool(true));
    });

    it("user refund before expiry fails with ERR-UNAUTHORIZED", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2, orderId, ORDER_AMOUNT, 100);

      const { result } = refundOrder(wallet2);
      expect(result).toBeErr(Cl.uint(3)); // ERR-UNAUTHORIZED (not relayer, and not expired)
    });

    it("relayer refunds before expiry succeeds", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2, orderId, ORDER_AMOUNT, 100);

      const { result } = refundOrder(wallet1); // wallet1 is relayer
      expect(result).toBeOk(Cl.bool(true));
    });

    it("unauthorized address cannot refund", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2, orderId, ORDER_AMOUNT, 100);

      const { result } = refundOrder(wallet3);
      expect(result).toBeErr(Cl.uint(3)); // ERR-UNAUTHORIZED
    });
  });

  // ─── Token Mismatch ────────────────────────────────────────────────────

  describe("token mismatch", () => {
    it("release with wrong token fails with ERR-TOKEN-MISMATCH", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2, orderId, ORDER_AMOUNT, 100, "on-ramp", TOKEN);

      // Try to release with a different token
      const { result } = releaseOrder(wallet1, orderId, TOKEN_2);
      expect(result).toBeErr(Cl.uint(13)); // ERR-TOKEN-MISMATCH
    });

    it("refund with wrong token fails with ERR-TOKEN-MISMATCH", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2, orderId, ORDER_AMOUNT, 100, "on-ramp", TOKEN);

      const { result } = refundOrder(wallet1, orderId, TOKEN_2);
      expect(result).toBeErr(Cl.uint(13)); // ERR-TOKEN-MISMATCH
    });

    it("cancel with wrong token fails with ERR-TOKEN-MISMATCH", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2, orderId, ORDER_AMOUNT, 100, "on-ramp", TOKEN);

      const { result } = cancelOrder(wallet2, orderId, TOKEN_2);
      expect(result).toBeErr(Cl.uint(13)); // ERR-TOKEN-MISMATCH
    });
  });

  // ─── Collect Fees Edge Cases ───────────────────────────────────────────

  describe("collect-fees", () => {
    it("fails when no fees accumulated with ERR-NO-FEES", () => {
      initialize();

      const { result } = collectFees(deployer);
      expect(result).toBeErr(Cl.uint(11)); // ERR-NO-FEES
    });

    it("non-admin cannot collect fees", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2);
      releaseOrder(wallet1);

      const { result } = collectFees(wallet2);
      expect(result).toBeErr(Cl.uint(3)); // ERR-UNAUTHORIZED
    });
  });

  // ─── Duplicate Order ──────────────────────────────────────────────────

  describe("duplicate order", () => {
    it("creating order with same id fails with ERR-ORDER-ALREADY-EXISTS", () => {
      initialize();
      mintTokens(wallet2, MINT_AMOUNT * 2);

      createOrder(wallet2, orderId);

      const { result } = createOrder(wallet2, orderId);
      expect(result).toBeErr(Cl.uint(5)); // ERR-ORDER-ALREADY-EXISTS
    });
  });

  // ─── Uninitialized Guard ─────────────────────────────────────────────

  describe("uninitialized guard", () => {
    it("create-order fails when not initialized", () => {
      mintTokens(wallet2);
      const { result } = createOrder(wallet2);
      expect(result).toBeErr(Cl.uint(2)); // ERR-NOT-INITIALIZED
    });
  });

  // ─── Admin Functions ──────────────────────────────────────────────────

  describe("admin functions", () => {
    it("admin can update relayer", () => {
      initialize();
      const { result } = simnet.callPublicFn(
        ESCROW,
        "set-relayer",
        [Cl.standardPrincipal(wallet3)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      const relayer = simnet.callReadOnlyFn(ESCROW, "get-relayer", [], deployer);
      expect(relayer.result).toStrictEqual(Cl.standardPrincipal(wallet3));
    });

    it("admin can update admin", () => {
      initialize();
      const { result } = simnet.callPublicFn(
        ESCROW,
        "set-admin",
        [Cl.standardPrincipal(wallet2)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      const admin = simnet.callReadOnlyFn(ESCROW, "get-admin", [], deployer);
      expect(admin.result).toStrictEqual(Cl.standardPrincipal(wallet2));
    });

    it("admin can update fee", () => {
      initialize();
      const { result } = simnet.callPublicFn(
        ESCROW,
        "set-fee",
        [Cl.uint(500)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      const feeBps = simnet.callReadOnlyFn(ESCROW, "get-fee-bps", [], deployer);
      expect(feeBps.result).toStrictEqual(Cl.uint(500));
    });

    it("set-fee rejects fee > 10000 with ERR-INVALID-FEE-BPS", () => {
      initialize();
      const { result } = simnet.callPublicFn(
        ESCROW,
        "set-fee",
        [Cl.uint(10001)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(12)); // ERR-INVALID-FEE-BPS
    });

    it("non-admin cannot set relayer", () => {
      initialize();
      const { result } = simnet.callPublicFn(
        ESCROW,
        "set-relayer",
        [Cl.standardPrincipal(wallet3)],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(3)); // ERR-UNAUTHORIZED
    });
  });

  // ─── Edge Cases ──────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("create-order with amount 0 fails with ERR-INVALID-AMOUNT", () => {
      initialize();
      mintTokens(wallet2);

      const expiry = simnet.blockHeight + 100;
      const { result } = simnet.callPublicFn(
        ESCROW,
        "create-order",
        [
          orderId,
          tokenArg(),
          Cl.uint(0),
          Cl.uint(RATE),
          Cl.uint(expiry),
          Cl.stringAscii("on-ramp"),
        ],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(6)); // ERR-INVALID-AMOUNT
    });

    it("create-order with past expiry fails with ERR-INVALID-EXPIRY", () => {
      initialize();
      mintTokens(wallet2);

      const { result } = simnet.callPublicFn(
        ESCROW,
        "create-order",
        [
          orderId,
          tokenArg(),
          Cl.uint(ORDER_AMOUNT),
          Cl.uint(RATE),
          Cl.uint(1), // block height 1 is already passed
          Cl.stringAscii("on-ramp"),
        ],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(7)); // ERR-INVALID-EXPIRY
    });

    it("release on non-pending order fails with ERR-ORDER-NOT-PENDING", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2);
      releaseOrder(wallet1); // first release succeeds

      const { result } = releaseOrder(wallet1);
      expect(result).toBeErr(Cl.uint(8)); // ERR-ORDER-NOT-PENDING
    });

    it("cancel after expiry fails with ERR-ORDER-EXPIRED", () => {
      initialize();
      mintTokens(wallet2);

      createOrder(wallet2, orderId, ORDER_AMOUNT, 3);

      simnet.mineEmptyBlocks(10);

      const { result } = cancelOrder(wallet2);
      expect(result).toBeErr(Cl.uint(9)); // ERR-ORDER-EXPIRED
    });
  });
});
