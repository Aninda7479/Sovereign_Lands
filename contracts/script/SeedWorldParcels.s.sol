// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovereignLands.sol";
import "../src/Types.sol";

/**
 * @title SeedWorldParcelsScript
 * @notice Initializes 100 default 3D world parcels across North and South territories with
 * realistic landscape coordinates, and pre-populates demo accounts with structures for immediate playability.
 */
contract SeedWorldParcelsScript is Script {
    // Standard Hardhat / Foundry test accounts
    address public constant DEMO_ALICE = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address public constant DEMO_BOB = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address public constant DEMO_CHARLIE = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;

    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        address contractAddr = vm.envOr("CONTRACT_ADDRESS", address(0));
        if (contractAddr == address(0)) {
            contractAddr = vm.envOr("SOVEREIGN_LANDS_CONTRACT_AMOY", address(0));
        }

        console.log("==================================================");
        console.log("   Seeding 100 3D World Parcels (Sovereign Lands) ");
        console.log("==================================================");

        vm.startBroadcast(deployerPrivateKey);

        SovereignLands lands;
        if (contractAddr == address(0)) {
            console.log("No existing contract specified. Deploying fresh SovereignLands instance...");
            lands = new SovereignLands();
            console.log("Deployed fresh contract at:", address(lands));
        } else {
            console.log("Connecting to SovereignLands at:", contractAddr);
            lands = SovereignLands(payable(contractAddr));
        }

        console.log("Seeding North Kingdom (Parcels 1 - 50, Z < 0)...");
        // North Kingdom: 50 parcels (5 rows x 10 cols)
        // X ranges: -250 to 250 in 50m steps
        // Z ranges: -350 to -50 in 60m steps
        for (uint256 row = 0; row < 5; row++) {
            int32 minZ = -350 + int32(uint32(row * 60));
            int32 maxZ = minZ + 50;

            for (uint256 col = 0; col < 10; col++) {
                uint256 parcelId = (row * 10) + col + 1; // 1 to 50
                int32 minX = -250 + int32(uint32(col * 50));
                int32 maxX = minX + 50;

                // Pre-seed demo structures for Alice (North Lady)
                if (parcelId == 1) {
                    lands.adminSeedParcel(parcelId, minX, minZ, maxX, maxZ, DEMO_ALICE, StructureType.CastleKeep);
                } else if (parcelId == 2) {
                    lands.adminSeedParcel(parcelId, minX, minZ, maxX, maxZ, DEMO_ALICE, StructureType.GuardTower);
                } else if (parcelId == 3) {
                    lands.adminSeedParcel(parcelId, minX, minZ, maxX, maxZ, DEMO_ALICE, StructureType.StoneWall);
                } else if (parcelId == 4 || parcelId == 5) {
                    lands.adminSeedParcel(parcelId, minX, minZ, maxX, maxZ, DEMO_ALICE, StructureType.Farmstead);
                } else if (parcelId == 15) {
                    lands.adminSeedParcel(parcelId, minX, minZ, maxX, maxZ, DEMO_CHARLIE, StructureType.Farmstead);
                } else {
                    lands.registerParcel(parcelId, minX, minZ, maxX, maxZ);
                }
            }
        }

        console.log("Seeding South Kingdom (Parcels 51 - 100, Z > 0)...");
        // South Kingdom: 50 parcels (5 rows x 10 cols)
        // X ranges: -250 to 250 in 50m steps
        // Z ranges: 50 to 350 in 60m steps
        for (uint256 row = 0; row < 5; row++) {
            int32 minZ = 50 + int32(uint32(row * 60));
            int32 maxZ = minZ + 50;

            for (uint256 col = 0; col < 10; col++) {
                uint256 parcelId = 50 + (row * 10) + col + 1; // 51 to 100
                int32 minX = -250 + int32(uint32(col * 50));
                int32 maxX = minX + 50;

                // Pre-seed demo structures for Bob (South General)
                if (parcelId == 51) {
                    lands.adminSeedParcel(parcelId, minX, minZ, maxX, maxZ, DEMO_BOB, StructureType.CastleKeep);
                } else if (parcelId == 52) {
                    lands.adminSeedParcel(parcelId, minX, minZ, maxX, maxZ, DEMO_BOB, StructureType.GuardTower);
                } else if (parcelId == 53) {
                    lands.adminSeedParcel(parcelId, minX, minZ, maxX, maxZ, DEMO_BOB, StructureType.StoneWall);
                } else if (parcelId == 54 || parcelId == 55) {
                    lands.adminSeedParcel(parcelId, minX, minZ, maxX, maxZ, DEMO_BOB, StructureType.Farmstead);
                } else {
                    lands.registerParcel(parcelId, minX, minZ, maxX, maxZ);
                }
            }
        }

        vm.stopBroadcast();

        console.log("==================================================");
        console.log("   100 3D World Parcels Successfully Seeded!     ");
        console.log("==================================================");
        console.log("Total Registered Parcels: 100 (50 North, 50 South)");
        console.log("Demo Alice (North Lord):   Parcels 1-5 (Keep, Tower, Wall, 2 Farms)");
        console.log("Demo Bob (South General):  Parcels 51-55 (Keep, Tower, Wall, 2 Farms)");
        console.log("Demo Charlie (Merchant):   Parcel 15 (Farmstead)");
        console.log("Available for Purchase:    89 open frontier plots");
        console.log("==================================================");
    }
}
