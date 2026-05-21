// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {RampitEscrow} from "../src/RampitEscrow.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract RampitEscrowTest is Test {
    RampitEscrow public escrow;
    MockERC20 public token;

    address admin = makeAddr("admin");
    address relayer = makeAddr("relayer");
    address recipient = makeAddr("recipient");
    address stranger = makeAddr("stranger");

    uint16 constant FEE_BPS = 50;
    uint256 constant AMOUNT = 1_000e18;
    bytes32 constant ORDER_ID = keccak256("order-001");
    address constant NATIVE = address(0);

    function setUp() public {
        RampitEscrow impl = new RampitEscrow();
        bytes memory data = abi.encodeCall(RampitEscrow.initialize, (admin, relayer, FEE_BPS));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        escrow = RampitEscrow(payable(address(proxy)));

        token = new MockERC20();
        token.mint(relayer, 100_000e18);

        vm.prank(relayer);
        token.approve(address(escrow), type(uint256).max);
    }

    function _createDefaultOrder() internal {
        vm.prank(relayer);
        escrow.createOrder(
            ORDER_ID,
            recipient,
            address(token),
            AMOUNT,
            4_500e18,
            block.timestamp + 1 hours,
            RampitEscrow.Direction.OnRamp
        );
    }

    function test_createOrder() public {
        _createDefaultOrder();

        RampitEscrow.Order memory o = escrow.getOrder(ORDER_ID);
        assertEq(o.recipient, recipient);
        assertEq(o.funder, relayer);
        assertEq(o.amount, AMOUNT);
        assertEq(uint8(o.status), uint8(RampitEscrow.OrderStatus.Pending));
        assertTrue(escrow.orderExists(ORDER_ID));
        assertEq(token.balanceOf(address(escrow)), AMOUNT);
    }

    function test_createOrderByStranger_reverts() public {
        vm.prank(stranger);
        vm.expectRevert(RampitEscrow.Unauthorized.selector);
        escrow.createOrder(
            ORDER_ID,
            recipient,
            address(token),
            AMOUNT,
            4_500e18,
            block.timestamp + 1 hours,
            RampitEscrow.Direction.OnRamp
        );
    }

    function test_releaseOrder() public {
        _createDefaultOrder();

        vm.prank(relayer);
        escrow.releaseOrder(ORDER_ID);

        RampitEscrow.Order memory o = escrow.getOrder(ORDER_ID);
        assertEq(uint8(o.status), uint8(RampitEscrow.OrderStatus.Released));
        assertEq(escrow.accumulatedFees(address(token)), 5e18);

        uint256 net = AMOUNT - 5e18;
        assertEq(token.balanceOf(recipient), net);
        assertEq(token.balanceOf(relayer), 100_000e18 - AMOUNT);
    }

    function test_cancelOrder() public {
        _createDefaultOrder();

        vm.prank(relayer);
        escrow.cancelOrder(ORDER_ID);

        RampitEscrow.Order memory o = escrow.getOrder(ORDER_ID);
        assertEq(uint8(o.status), uint8(RampitEscrow.OrderStatus.Cancelled));
        assertEq(token.balanceOf(relayer), 100_000e18);
    }

    function test_cancelByStranger_reverts() public {
        _createDefaultOrder();

        vm.prank(stranger);
        vm.expectRevert(RampitEscrow.Unauthorized.selector);
        escrow.cancelOrder(ORDER_ID);
    }

    function test_cancelAfterExpiry_reverts() public {
        _createDefaultOrder();

        vm.warp(block.timestamp + 2 hours);

        vm.prank(relayer);
        vm.expectRevert(RampitEscrow.OrderExpired.selector);
        escrow.cancelOrder(ORDER_ID);
    }

    function test_refundByRelayer() public {
        _createDefaultOrder();

        vm.prank(relayer);
        escrow.refundOrder(ORDER_ID);

        RampitEscrow.Order memory o = escrow.getOrder(ORDER_ID);
        assertEq(uint8(o.status), uint8(RampitEscrow.OrderStatus.Refunded));
        assertEq(token.balanceOf(relayer), 100_000e18);
    }

    function test_refundByRecipient_reverts() public {
        _createDefaultOrder();

        vm.prank(recipient);
        vm.expectRevert(RampitEscrow.Unauthorized.selector);
        escrow.refundOrder(ORDER_ID);
    }

    function test_doubleCreate_reverts() public {
        _createDefaultOrder();

        vm.prank(relayer);
        vm.expectRevert(RampitEscrow.OrderAlreadyExists.selector);
        escrow.createOrder(
            ORDER_ID,
            recipient,
            address(token),
            AMOUNT,
            4_500e18,
            block.timestamp + 1 hours,
            RampitEscrow.Direction.OnRamp
        );
    }

    function test_releaseNonPending_reverts() public {
        _createDefaultOrder();

        vm.prank(relayer);
        escrow.releaseOrder(ORDER_ID);

        vm.prank(relayer);
        vm.expectRevert(RampitEscrow.OrderNotPending.selector);
        escrow.releaseOrder(ORDER_ID);
    }

    function test_collectFees() public {
        _createDefaultOrder();

        vm.prank(relayer);
        escrow.releaseOrder(ORDER_ID);

        uint256 before = token.balanceOf(admin);

        vm.prank(admin);
        escrow.collectFees(address(token));

        assertEq(token.balanceOf(admin) - before, 5e18);
        assertEq(escrow.accumulatedFees(address(token)), 0);
    }

    function test_setRelayer() public {
        address newRelayer = makeAddr("newRelayer");

        vm.prank(admin);
        escrow.setRelayer(newRelayer);

        assertEq(escrow.relayer(), newRelayer);
    }

    function test_twoStepAdminTransfer() public {
        address newAdmin = makeAddr("newAdmin");

        vm.prank(admin);
        escrow.setAdmin(newAdmin);

        vm.prank(newAdmin);
        escrow.acceptAdmin();

        assertEq(escrow.admin(), newAdmin);
    }

    function test_pauseBlocksCreate() public {
        vm.prank(admin);
        escrow.pause();

        vm.prank(relayer);
        vm.expectRevert();
        escrow.createOrder(
            ORDER_ID,
            recipient,
            address(token),
            AMOUNT,
            4_500e18,
            block.timestamp + 1 hours,
            RampitEscrow.Direction.OnRamp
        );
    }

    function test_refundStillWorksDuringPause() public {
        _createDefaultOrder();

        vm.prank(admin);
        escrow.pause();

        vm.prank(relayer);
        escrow.refundOrder(ORDER_ID);

        assertEq(uint8(escrow.getOrder(ORDER_ID).status), uint8(RampitEscrow.OrderStatus.Refunded));
    }

    function test_orderExists_false() public view {
        assertFalse(escrow.orderExists(keccak256("missing")));
    }

    function test_createNativeOrder() public {
        uint256 nativeAmt = 1 ether;
        vm.deal(relayer, 10 ether);

        vm.prank(relayer);
        escrow.createOrder{value: nativeAmt}(
            ORDER_ID,
            recipient,
            NATIVE,
            nativeAmt,
            4_500e18,
            block.timestamp + 1 hours,
            RampitEscrow.Direction.OnRamp
        );

        RampitEscrow.Order memory o = escrow.getOrder(ORDER_ID);
        assertEq(o.token, NATIVE);
        assertEq(address(escrow).balance, nativeAmt);
    }

    function test_releaseNativeOrder() public {
        uint256 nativeAmt = 1 ether;
        vm.deal(relayer, 10 ether);

        vm.prank(relayer);
        escrow.createOrder{value: nativeAmt}(
            ORDER_ID,
            recipient,
            NATIVE,
            nativeAmt,
            4_500e18,
            block.timestamp + 1 hours,
            RampitEscrow.Direction.OnRamp
        );

        uint256 fee = (nativeAmt * FEE_BPS) / 10_000;
        uint256 net = nativeAmt - fee;

        vm.prank(relayer);
        escrow.releaseOrder(ORDER_ID);

        assertEq(recipient.balance, net);
        assertEq(escrow.accumulatedFees(NATIVE), fee);
    }

    function test_createNative_wrongValue_reverts() public {
        uint256 nativeAmt = 1 ether;
        vm.deal(relayer, 10 ether);

        vm.prank(relayer);
        vm.expectRevert(RampitEscrow.InvalidAmount.selector);
        escrow.createOrder{value: nativeAmt - 1}(
            ORDER_ID,
            recipient,
            NATIVE,
            nativeAmt,
            4_500e18,
            block.timestamp + 1 hours,
            RampitEscrow.Direction.OnRamp
        );
    }

    function test_createErc20_withValue_reverts() public {
        vm.deal(relayer, 100 ether);

        vm.prank(relayer);
        vm.expectRevert(RampitEscrow.UnexpectedNativeValue.selector);
        escrow.createOrder{value: 1}(
            ORDER_ID,
            recipient,
            address(token),
            AMOUNT,
            4_500e18,
            block.timestamp + 1 hours,
            RampitEscrow.Direction.OnRamp
        );
    }
}
