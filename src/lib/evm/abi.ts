export const RAMPIT_ESCROW_ABI = [
  "function createOrder(bytes32 orderId, address recipient, address token, uint256 amount, uint256 rate, uint256 expiry, uint8 direction) payable",
  "function releaseOrder(bytes32 orderId)",
  "function refundOrder(bytes32 orderId)",
  "function cancelOrder(bytes32 orderId)",
  "function collectFees(address token)",
  "function getOrder(bytes32 orderId) view returns ((bytes32 orderId, address recipient, address funder, address token, uint256 amount, uint256 rate, uint256 expiry, uint8 status, uint8 direction))",
  "function orderExists(bytes32 orderId) view returns (bool)",
  "function feeBps() view returns (uint16)",
  "function relayer() view returns (address)",
  "function admin() view returns (address)",
] as const;
