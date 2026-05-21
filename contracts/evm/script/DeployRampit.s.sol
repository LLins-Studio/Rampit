// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {RampitEscrow} from "../src/RampitEscrow.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @notice Deploys RampitEscrow implementation + ERC1967 proxy and initializes.
/// @dev    All EVM mainnets: `bash deploy-mainnet.sh` (Celo, Base, BNB).
///         One chain: `bash deploy-mainnet.sh celo`
contract DeployRampit is Script {
    function run() external returns (address proxy, address implementation) {
        address admin = vm.envAddress("RAMPIT_ADMIN");
        address relayer = vm.envAddress("RAMPIT_RELAYER");
        uint16 feeBps = uint16(vm.envUint("RAMPIT_FEE_BPS"));

        vm.startBroadcast();

        implementation = address(new RampitEscrow());
        bytes memory initData = abi.encodeCall(RampitEscrow.initialize, (admin, relayer, feeBps));
        proxy = address(new ERC1967Proxy(implementation, initData));

        vm.stopBroadcast();
    }
}
