// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovereignLands.sol";
import "../src/Types.sol";
import "../src/ISovereignLands.sol";

/**
 * @title SpatialQueryTest
 * @notice Tests the 3D continuous bounding box spatial query engine (`getParcelsInBounds`).
 * Essential for the 3D game client to stream parcels within player camera frustum / view distance.
 */
contract SpatialQueryTest is Test {
    SovereignLands public lands;

    address public admin = address(0xAD);
    address public player1 = address(0x1111);
    address public player2 = address(0x2222);

    uint256 public constant PARCEL_PRICE = 0.01 ether;

    function setUp() public {
        vm.startPrank(admin);
        lands = new SovereignLands();

        // Seed 6 distinct parcels across the continuous 3D world
        // 1. North Far Citadel (X: [-200, -150], Z: [-300, -250])
        lands.registerParcel(10, -200, -300, -150, -250);

        // 2. North Riverbank (X: [-50, 0], Z: [-70, -20])
        lands.registerParcel(20, -50, -70, 0, -20);

        // 3. Central Divide / River Island (X: [-20, 20], Z: [-10, 10])
        lands.registerParcel(30, -20, -10, 20, 10);

        // 4. South Riverbank (X: [0, 50], Z: [20, 70])
        lands.registerParcel(40, 0, 20, 50, 70);

        // 5. South Far Plains (X: [150, 200], Z: [250, 300])
        lands.registerParcel(50, 150, 250, 200, 300);

        // 6. Eastern Outskirts (X: [400, 450], Z: [400, 450])
        lands.registerParcel(60, 400, 400, 450, 450);

        vm.stopPrank();

        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
    }

    // =========================================================================
    //                        SPATIAL FRUSTUM QUERIES
    // =========================================================================

    function testQueryExactBoundsSingleParcel() public view {
        // Query exact bounds of North Far Citadel (Parcel 10)
        Parcel[] memory parcels = lands.getParcelsInBounds(-200, -300, -150, -250);

        assertEq(parcels.length, 1);
        assertEq(parcels[0].id, 10);
        assertEq(parcels[0].bounds.minX, -200);
        assertEq(parcels[0].bounds.minZ, -300);
        assertEq(parcels[0].bounds.maxX, -150);
        assertEq(parcels[0].bounds.maxZ, -250);
    }

    function testQueryViewDistanceNorthOnly() public view {
        // Player standing in North at (-100, -150) with view radius ~120m
        // Bounding box: X: [-220, 20], Z: [-320, 0]
        // Should capture Parcel 10 and Parcel 20, but NO South parcels
        Parcel[] memory parcels = lands.getParcelsInBounds(-220, -320, 20, 0);

        assertEq(parcels.length, 2);
        assertTrue(parcels[0].id == 10 || parcels[0].id == 20);
        assertTrue(parcels[1].id == 10 || parcels[1].id == 20);
    }

    function testQueryViewDistanceCrossingBorder() public view {
        // Player standing on the Great Divide bridge at (0, 0) with view radius 80m
        // Bounding box: X: [-60, 60], Z: [-60, 60]
        // Intersects:
        // - Parcel 20 (North Riverbank, Z: [-70, -20]) -> overlaps [-60, -20]
        // - Parcel 30 (Central Divide, Z: [-10, 10])  -> overlaps [-10, 10]
        // - Parcel 40 (South Riverbank, Z: [20, 70])   -> overlaps [20, 60]
        // Total = 3 parcels
        Parcel[] memory parcels = lands.getParcelsInBounds(-60, -60, 60, 60);

        assertEq(parcels.length, 3);

        bool found20 = false;
        bool found30 = false;
        bool found40 = false;

        for (uint256 i = 0; i < parcels.length; i++) {
            if (parcels[i].id == 20) found20 = true;
            if (parcels[i].id == 30) found30 = true;
            if (parcels[i].id == 40) found40 = true;
        }

        assertTrue(found20, "Missing North Riverbank parcel 20");
        assertTrue(found30, "Missing Central Divide parcel 30");
        assertTrue(found40, "Missing South Riverbank parcel 40");
    }

    function testQueryEntireWorld() public view {
        // Global bounds query covering the entire playable map
        Parcel[] memory parcels = lands.getParcelsInBounds(-1000, -1000, 1000, 1000);

        assertEq(parcels.length, 6);
    }

    function testQueryEmptyZoneReturnsZero() public view {
        // Query an uninhabited coordinate zone in the deep wilderness
        Parcel[] memory parcels = lands.getParcelsInBounds(1000, 1000, 1200, 1200);

        assertEq(parcels.length, 0);
    }

    function testQueryEdgeTouchingCoordinates() public view {
        // Parcel 40 has maxX: 50, maxZ: 70
        // Query box starting exactly at minX: 50, minZ: 70
        // AABB intersection check: !(b.maxX < minX || b.minX > maxX || b.maxZ < minZ || b.minZ > maxZ)
        // With maxX = 50 and query minX = 50, 50 < 50 is false => touches border
        Parcel[] memory parcels = lands.getParcelsInBounds(50, 70, 100, 120);

        assertEq(parcels.length, 1);
        assertEq(parcels[0].id, 40);
    }

    function testNegativeQuadQueries() public view {
        // Query strictly within negative quadrant
        Parcel[] memory parcels = lands.getParcelsInBounds(-300, -400, -100, -200);

        assertEq(parcels.length, 1);
        assertEq(parcels[0].id, 10);
    }

    // =========================================================================
    //                    REGISTRY & PLAYER MAP QUERIES
    // =========================================================================

    function testGetAllParcelsAndMap() public view {
        Parcel[] memory all = lands.getAllParcels();
        Parcel[] memory map = lands.getMap();

        assertEq(all.length, 6);
        assertEq(map.length, 6);

        for (uint256 i = 0; i < all.length; i++) {
            assertEq(all[i].id, map[i].id);
        }
    }

    function testPlayerParcelsTracking() public {
        // Player 1 claims Parcel 10 & 20
        vm.startPrank(player1);
        lands.buyParcel{value: PARCEL_PRICE}(10);
        lands.buyParcel{value: PARCEL_PRICE}(20);
        vm.stopPrank();

        // Player 2 claims Parcel 40
        vm.prank(player2);
        lands.buyParcel{value: PARCEL_PRICE}(40);

        Parcel[] memory p1Parcels = lands.getPlayerParcels(player1);
        assertEq(p1Parcels.length, 2);
        assertEq(p1Parcels[0].id, 10);
        assertEq(p1Parcels[1].id, 20);
        assertEq(p1Parcels[0].owner, player1);
        assertEq(p1Parcels[1].owner, player1);

        Parcel[] memory p2Parcels = lands.getPlayerParcels(player2);
        assertEq(p2Parcels.length, 1);
        assertEq(p2Parcels[0].id, 40);
        assertEq(p2Parcels[0].owner, player2);
    }

    // =========================================================================
    //               DYNAMIC BATCH REGISTRATION & SPATIAL QUERIES
    // =========================================================================

    function testBatchRegisterAndSpatialQueryGrid() public {
        // Admin registers a 2x3 grid of parcels
        // Grid layout:
        // [101] [102] [103]  (Z: [100, 150])
        // [104] [105] [106]  (Z: [150, 200])
        // X ranges: [0, 50], [50, 100], [100, 150]

        uint256[] memory ids = new uint256[](6);
        ParcelBoundingBox[] memory boxes = new ParcelBoundingBox[](6);

        ids[0] = 101; boxes[0] = ParcelBoundingBox(0, 100, 50, 150);
        ids[1] = 102; boxes[1] = ParcelBoundingBox(50, 100, 100, 150);
        ids[2] = 103; boxes[2] = ParcelBoundingBox(100, 100, 150, 150);

        ids[3] = 104; boxes[3] = ParcelBoundingBox(0, 150, 50, 200);
        ids[4] = 105; boxes[4] = ParcelBoundingBox(50, 150, 100, 200);
        ids[5] = 106; boxes[5] = ParcelBoundingBox(100, 150, 150, 200);

        vm.prank(admin);
        lands.batchRegisterParcels(ids, boxes);

        // Query only first column (X: [0, 50], Z: [100, 200])
        // Should return exactly Parcel 101 and 104
        Parcel[] memory column1 = lands.getParcelsInBounds(0, 100, 50, 200);
        assertEq(column1.length, 2);
        assertTrue(column1[0].id == 101 || column1[0].id == 104);
        assertTrue(column1[1].id == 101 || column1[1].id == 104);

        // Query top row (X: [0, 150], Z: [100, 150])
        // Should return exactly 101, 102, 103
        Parcel[] memory topRow = lands.getParcelsInBounds(0, 100, 150, 150);
        assertEq(topRow.length, 3);
    }
}
