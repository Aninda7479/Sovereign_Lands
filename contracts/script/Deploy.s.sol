// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovereignLands.sol";

/**
 * @title DeployScript
 * @notice Production Foundry deployment script for SovereignLands on Polygon Amoy & Base Sepolia.
 * Deploys core land contract, logs deployed addresses, and outputs deployment artifacts.
 */
contract DeployScript is Script {
    function run() external returns (SovereignLands lands) {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        address deployer = vm.addr(deployerPrivateKey);

        console.log("==================================================");
        console.log("   Deploying Sovereign Lands Smart Contract       ");
        console.log("==================================================");
        console.log("Deployer Address:", deployer);
        console.log("Chain ID:        ", block.chainid);
        console.log("Block Number:    ", block.number);

        vm.startBroadcast(deployerPrivateKey);

        lands = new SovereignLands();

        vm.stopBroadcast();

        console.log("==================================================");
        console.log("   Deployment Successful!                         ");
        console.log("==================================================");
        console.log("Contract Address:  ", address(lands));
        console.log("Parcel Price (ETH):", lands.PARCEL_PRICE() / 1e18);
        console.log("Default Tax Rate:  ", lands.DEFAULT_TAX_RATE(), "%");
        console.log("Voting Period (s): ", lands.VOTING_PERIOD());
        console.log("Transfers Locked:  ", lands.transfersLocked());
        console.log("==================================================");

        return lands;
    }
}
