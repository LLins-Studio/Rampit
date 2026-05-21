// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Initializable} from
    "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {PausableUpgradeable} from
    "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title  RampitEscrow
/// @notice On-ramp escrow: relayer funds orders; customer (`recipient`) receives crypto on release.
///         Supports ERC-20 tokens and native chain currency (token = address(0)).
contract RampitEscrow is Initializable, ReentrancyGuard, PausableUpgradeable {
    using SafeERC20 for IERC20;

    /// @dev Sentinel: native ETH / CELO / BNB (chain gas token).
    address public constant NATIVE_TOKEN = address(0);

    enum Direction {
        OnRamp,
        OffRamp
    }

    enum OrderStatus {
        Pending,
        Released,
        Refunded,
        Cancelled
    }

    struct Order {
        bytes32 orderId;
        address recipient;
        address funder;
        address token;
        uint256 amount;
        uint256 rate;
        uint256 expiry;
        OrderStatus status;
        Direction direction;
    }

    mapping(bytes32 => Order) private _orders;

    address public admin;
    uint16 public feeBps;
    address public pendingAdmin;
    address public relayer;
    mapping(address => uint256) public accumulatedFees;

    error Unauthorized();
    error ZeroAddress();
    error OrderNotFound();
    error OrderAlreadyExists();
    error InvalidAmount();
    error InvalidExpiry();
    error InvalidFeeBps();
    error OrderNotPending();
    error OrderExpired();
    error NoFeesToCollect();
    error NoPendingAdmin();
    error UnexpectedNativeValue();
    error NativeTransferFailed();

    event OrderCreated(
        bytes32 indexed orderId,
        address indexed recipient,
        address indexed funder,
        address token,
        uint256 amount,
        uint256 rate,
        uint256 expiry,
        Direction direction
    );

    event OrderReleased(
        bytes32 indexed orderId, address indexed recipient, uint256 netAmount, uint256 fee
    );

    event OrderRefunded(bytes32 indexed orderId, address indexed funder, uint256 amount);

    event OrderCancelled(bytes32 indexed orderId, address indexed funder, uint256 amount);

    event FeesCollected(address indexed token, address indexed recipient, uint256 amount);

    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    event AdminProposed(address indexed currentAdmin, address indexed proposedAdmin);

    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    event FeeUpdated(uint16 oldFeeBps, uint16 newFeeBps);

    modifier onlyAdmin() {
        _checkAdmin();
        _;
    }

    modifier onlyRelayer() {
        _checkRelayer();
        _;
    }

    function _checkAdmin() internal view {
        if (msg.sender != admin) revert Unauthorized();
    }

    function _checkRelayer() internal view {
        if (msg.sender != relayer) revert Unauthorized();
    }

    function _isNative(address token) internal pure returns (bool) {
        return token == NATIVE_TOKEN;
    }

    function _transferOut(address token, address to, uint256 amount) internal {
        if (_isNative(token)) {
            (bool ok,) = to.call{value: amount}("");
            if (!ok) revert NativeTransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    receive() external payable {}

    function initialize(address _admin, address _relayer, uint16 _feeBps) external initializer {
        if (_admin == address(0) || _relayer == address(0)) revert ZeroAddress();
        if (_feeBps > 10_000) revert InvalidFeeBps();

        __Pausable_init();

        admin = _admin;
        relayer = _relayer;
        feeBps = _feeBps;
    }

    /// @notice Relayer creates an order and locks funds in escrow.
    /// @param token ERC-20 address, or `NATIVE_TOKEN` (address(0)) for native gas token.
    ///         Native: send `amount` as `msg.value`. ERC-20: approve proxy first.
    function createOrder(
        bytes32 orderId,
        address recipient,
        address token,
        uint256 amount,
        uint256 rate,
        uint256 expiry,
        Direction direction
    ) external payable nonReentrant onlyRelayer whenNotPaused {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (expiry <= block.timestamp) revert InvalidExpiry();
        if (_orders[orderId].funder != address(0)) revert OrderAlreadyExists();

        _orders[orderId] = Order({
            orderId: orderId,
            recipient: recipient,
            funder: msg.sender,
            token: token,
            amount: amount,
            rate: rate,
            expiry: expiry,
            direction: direction,
            status: OrderStatus.Pending
        });

        if (_isNative(token)) {
            if (msg.value != amount) revert InvalidAmount();
        } else {
            if (msg.value != 0) revert UnexpectedNativeValue();
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        emit OrderCreated(orderId, recipient, msg.sender, token, amount, rate, expiry, direction);
    }

    function releaseOrder(bytes32 orderId) external nonReentrant onlyRelayer whenNotPaused {
        Order storage order = _orders[orderId];
        if (order.funder == address(0)) revert OrderNotFound();
        if (order.status != OrderStatus.Pending) revert OrderNotPending();

        uint256 fee = (order.amount * feeBps) / 10_000;
        uint256 netAmount = order.amount - fee;

        order.status = OrderStatus.Released;
        if (fee > 0) {
            accumulatedFees[order.token] += fee;
        }

        _transferOut(order.token, order.recipient, netAmount);

        emit OrderReleased(orderId, order.recipient, netAmount, fee);
    }

    function refundOrder(bytes32 orderId) external nonReentrant onlyRelayer {
        Order storage order = _orders[orderId];
        if (order.funder == address(0)) revert OrderNotFound();
        if (order.status != OrderStatus.Pending) revert OrderNotPending();

        order.status = OrderStatus.Refunded;

        _transferOut(order.token, order.funder, order.amount);

        emit OrderRefunded(orderId, order.funder, order.amount);
    }

    function cancelOrder(bytes32 orderId) external nonReentrant onlyRelayer {
        Order storage order = _orders[orderId];
        if (order.funder == address(0)) revert OrderNotFound();
        if (order.status != OrderStatus.Pending) revert OrderNotPending();
        if (block.timestamp >= order.expiry) revert OrderExpired();

        order.status = OrderStatus.Cancelled;

        _transferOut(order.token, order.funder, order.amount);

        emit OrderCancelled(orderId, order.funder, order.amount);
    }

    /// @param token ERC-20 address or `NATIVE_TOKEN` for accumulated native fees.
    function collectFees(address token) external nonReentrant onlyAdmin {
        uint256 fees = accumulatedFees[token];
        if (fees == 0) revert NoFeesToCollect();

        accumulatedFees[token] = 0;

        _transferOut(token, admin, fees);

        emit FeesCollected(token, admin, fees);
    }

    function setRelayer(address newRelayer) external nonReentrant onlyAdmin {
        if (newRelayer == address(0)) revert ZeroAddress();
        emit RelayerUpdated(relayer, newRelayer);
        relayer = newRelayer;
    }

    function setAdmin(address newAdmin) external nonReentrant onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        pendingAdmin = newAdmin;
        emit AdminProposed(admin, newAdmin);
    }

    function acceptAdmin() external nonReentrant {
        if (msg.sender != pendingAdmin) revert NoPendingAdmin();

        emit AdminTransferred(admin, msg.sender);
        admin = msg.sender;
        pendingAdmin = address(0);
    }

    function setFee(uint16 newFeeBps) external nonReentrant onlyAdmin {
        if (newFeeBps > 10_000) revert InvalidFeeBps();
        emit FeeUpdated(feeBps, newFeeBps);
        feeBps = newFeeBps;
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function getOrder(bytes32 orderId) external view returns (Order memory order) {
        order = _orders[orderId];
        if (order.funder == address(0)) revert OrderNotFound();
    }

    function orderExists(bytes32 orderId) external view returns (bool) {
        return _orders[orderId].funder != address(0);
    }

    uint256[44] private __gap;
}
