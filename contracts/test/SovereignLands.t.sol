// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovereignLands.sol";
import "../src/Types.sol";
import "../src/ISovereignLands.sol";

/**
 * @title SovereignLandsTest
 * @notice Comprehensive Foundry test suite for SovereignLands core contract.
 * Verifies 3D parcel purchases, kingdom attribution, structure construction,
 * gold economy & kingdom tithe, citadel governance, deterministic war, and soulbound rules.
 */
contract SovereignLandsTest is Test {
    SovereignLands public lands;

    address public admin = address(0xAD);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public charlie = address(0xCAFE);
    address public david = address(0xD00D);

    uint256 public constant PARCEL_PRICE = 0.01 ether;

    event ParcelClaimed(uint256 indexed parcelId, address indexed owner, Kingdom indexed kingdom, ParcelBoundingBox bounds);
    event StructureBuilt(uint256 indexed parcelId, address indexed owner, StructureType structure, uint256 defenseRating, uint256 attackRating);
    event GoldHarvested(address indexed player, uint256 grossGold, uint256 netGold, uint256 taxPaid);
    event ProposalCreated(uint256 indexed proposalId, Kingdom indexed kingdom, ProposalType proposalType, uint256 param, string description, address indexed proposer, uint256 endTime);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event WarDeclared(Kingdom indexed attacker, Kingdom indexed defender);
    event WarResolved(Kingdom indexed attacker, Kingdom indexed defender, uint256 attackerAttack, uint256 defenderDefense, bool attackerWon, uint256 goldPlundered);

    function setUp() public {
        vm.startPrank(admin);
        lands = new SovereignLands();
        vm.stopPrank();

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
        vm.deal(david, 100 ether);
        vm.deal(admin, 100 ether);
    }

    // =========================================================================
    //                      1. 3D PARCEL PURCHASES & KINGDOMS
    // =========================================================================

    function testBuyParcelNorthDefault() public {
        // Parcel ID 1 has default bounds with Z < -20 (North)
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);

        assertEq(lands.ownerOf(1), alice);
        assertEq(lands.getPlayerGold(alice), 100);

        Parcel memory p = lands.getParcel(1);
        assertEq(uint8(p.kingdom), uint8(Kingdom.North));
        assertEq(p.owner, alice);
        assertEq(lands.getKingdomParcelCount(alice, Kingdom.North), 1);
    }

    function testBuyParcelSouthDefault() public {
        // Parcel ID 60 has default bounds with Z > 20 (South)
        vm.prank(bob);
        lands.buyParcel{value: PARCEL_PRICE}(60);

        assertEq(lands.ownerOf(60), bob);
        assertEq(lands.getPlayerGold(bob), 100);

        Parcel memory p = lands.getParcel(60);
        assertEq(uint8(p.kingdom), uint8(Kingdom.South));
        assertEq(p.owner, bob);
        assertEq(lands.getKingdomParcelCount(bob, Kingdom.South), 1);
    }

    function testBuyParcelWithCustomBoundsNorth() public {
        // Explicit 3D bounding box in North (Z < 0)
        vm.prank(alice);
        lands.buyParcelWithBounds{value: PARCEL_PRICE}(
            101,
            -150, -200,
            -100, -150
        );

        Parcel memory p = lands.getParcel(101);
        assertEq(p.owner, alice);
        assertEq(uint8(p.kingdom), uint8(Kingdom.North));
        assertEq(p.bounds.minX, -150);
        assertEq(p.bounds.minZ, -200);
        assertEq(p.bounds.maxX, -100);
        assertEq(p.bounds.maxZ, -150);
    }

    function testBuyParcelWithCustomBoundsSouth() public {
        // Explicit 3D bounding box in South (Z > 0)
        vm.prank(bob);
        lands.buyParcelWithBounds{value: PARCEL_PRICE}(
            201,
            100, 150,
            150, 200
        );

        Parcel memory p = lands.getParcel(201);
        assertEq(p.owner, bob);
        assertEq(uint8(p.kingdom), uint8(Kingdom.South));
        assertEq(p.bounds.minX, 100);
        assertEq(p.bounds.minZ, 150);
        assertEq(p.bounds.maxX, 150);
        assertEq(p.bounds.maxZ, 200);
    }

    function testBuyParcelInsufficientPaymentReverts() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                SovereignLands.InsufficientPayment.selector,
                0.005 ether,
                0.01 ether
            )
        );
        lands.buyParcel{value: 0.005 ether}(1);
    }

    function testBuyParcelAlreadyClaimedReverts() public {
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                SovereignLands.ParcelAlreadyClaimed.selector,
                1
            )
        );
        lands.buyParcel{value: PARCEL_PRICE}(1);
    }

    function testBuyParcelInvalidCoordinatesReverts() public {
        // maxX <= minX or maxZ <= minZ
        vm.prank(alice);
        vm.expectRevert(SovereignLands.InvalidCoordinates.selector);
        lands.buyParcelWithBounds{value: PARCEL_PRICE}(105, 50, -50, 20, -10);
    }

    // =========================================================================
    //                      2. IN-WORLD CONSTRUCTION
    // =========================================================================

    function testBuildFarmstead() public {
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1); // 100 gold

        vm.prank(alice);
        lands.buildStructure(1, StructureType.Farmstead); // Cost 50

        assertEq(lands.getPlayerGold(alice), 50);
        Parcel memory p = lands.getParcel(1);
        assertEq(uint8(p.structure), uint8(StructureType.Farmstead));
    }

    function testBuildGuardTower() public {
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1); // 100 gold

        vm.prank(alice);
        lands.buildStructure(1, StructureType.GuardTower); // Cost 80, Def +8

        assertEq(lands.getPlayerGold(alice), 20);
        Parcel memory p = lands.getParcel(1);
        assertEq(uint8(p.structure), uint8(StructureType.GuardTower));
        assertEq(p.defenseRating, 8);
        assertEq(lands.kingdomDefense(Kingdom.North), 8);
    }

    function testBuildStoneWall() public {
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1); // 100 gold

        vm.prank(alice);
        lands.buildStructure(1, StructureType.StoneWall); // Cost 60, Def +6

        assertEq(lands.getPlayerGold(alice), 40);
        Parcel memory p = lands.getParcel(1);
        assertEq(uint8(p.structure), uint8(StructureType.StoneWall));
        assertEq(p.defenseRating, 6);
        assertEq(lands.kingdomDefense(Kingdom.North), 6);
    }

    function testBuildCastleKeep() public {
        // CastleKeep costs 150 gold. Alice buys 2 parcels to get 200 gold.
        vm.startPrank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);
        lands.buyParcel{value: PARCEL_PRICE}(2);
        assertEq(lands.getPlayerGold(alice), 200);

        lands.buildStructure(1, StructureType.CastleKeep); // Cost 150, Att +10, Def +5
        vm.stopPrank();

        assertEq(lands.getPlayerGold(alice), 50);
        Parcel memory p = lands.getParcel(1);
        assertEq(uint8(p.structure), uint8(StructureType.CastleKeep));
        assertEq(p.attackRating, 10);
        assertEq(p.defenseRating, 5);
        assertEq(lands.kingdomAttack(Kingdom.North), 10);
        assertEq(lands.kingdomDefense(Kingdom.North), 5);
    }

    function testBuildStructureNotOwnerReverts() public {
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                SovereignLands.NotParcelOwner.selector,
                1,
                bob
            )
        );
        lands.buildStructure(1, StructureType.Farmstead);
    }

    function testBuildStructureInsufficientGoldReverts() public {
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1); // Alice has 100 gold

        // CastleKeep costs 150 gold
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                SovereignLands.InsufficientGold.selector,
                100,
                150
            )
        );
        lands.buildStructure(1, StructureType.CastleKeep);
    }

    // =========================================================================
    //                 3. RESOURCE GENERATION & KINGDOM TITHE
    // =========================================================================

    function testClaimGoldWithTithe() public {
        vm.startPrank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1); // 100 gold
        lands.buildStructure(1, StructureType.Farmstead); // Alice has 50 gold left
        vm.stopPrank();

        // Advance block timestamp by 12 minutes (720 seconds)
        // Rate: 5 gold / min => 12 * 5 = 60 gross gold
        // Tithe: 10% default tax => 6 gold to North treasury, 54 net to Alice
        vm.warp(block.timestamp + 12 minutes);

        (uint256 pendingGross, uint256 pendingTax, uint256 pendingNet) = lands.getPendingGold(alice);
        assertEq(pendingGross, 60);
        assertEq(pendingTax, 6);
        assertEq(pendingNet, 54);

        vm.prank(alice);
        uint256 harvested = lands.claimGold();

        assertEq(harvested, 54);
        assertEq(lands.getPlayerGold(alice), 50 + 54); // 104 gold
        assertEq(lands.kingdomTreasury(Kingdom.North), 6);
    }

    function testClaimGoldForSingleParcel() public {
        vm.startPrank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);
        lands.buildStructure(1, StructureType.Farmstead);
        vm.stopPrank();

        vm.warp(block.timestamp + 6 minutes); // 30 gross gold, 3 tax, 27 net

        vm.prank(alice);
        uint256 net = lands.claimGoldForParcel(1);

        assertEq(net, 27);
        assertEq(lands.kingdomTreasury(Kingdom.North), 3);
        assertEq(lands.getPlayerGold(alice), 50 + 27);
    }

    function testNoFarmsteadProducesNoGold() public {
        vm.startPrank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);
        lands.buildStructure(1, StructureType.GuardTower);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 hours);

        (uint256 gross,,) = lands.getPendingGold(alice);
        assertEq(gross, 0);

        vm.prank(alice);
        uint256 claimed = lands.claimGold();
        assertEq(claimed, 0);
    }

    // =========================================================================
    //                        4. CITADEL GOVERNANCE
    // =========================================================================

    function testGovernanceProposalAndWeightedVote() public {
        // Alice owns 2 parcels in North (Weight 2)
        // Charlie owns 1 parcel in North (Weight 1)
        // Total North parcels = 3. Quorum 20% requires >= 1 vote.
        vm.startPrank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);
        lands.buyParcel{value: PARCEL_PRICE}(2);
        vm.stopPrank();

        vm.prank(charlie);
        lands.buyParcel{value: PARCEL_PRICE}(3);

        // Alice proposes tax rate update to 15%
        vm.prank(alice);
        uint256 propId = lands.propose(
            Kingdom.North,
            ProposalType.SetTaxRate,
            15,
            "Increase royal tax to 15% for border defenses"
        );

        assertEq(propId, 1);
        (Proposal memory prop, bool hasActive) = lands.getActiveProposal(Kingdom.North);
        assertTrue(hasActive);
        assertEq(prop.yesVotes, 2); // Alice auto-voted with 2 parcels
        assertEq(prop.noVotes, 0);

        // Charlie votes NO with 1 parcel
        vm.prank(charlie);
        lands.vote(propId, false);

        (prop,) = lands.getActiveProposal(Kingdom.North);
        assertEq(prop.yesVotes, 2);
        assertEq(prop.noVotes, 1);

        // Try to execute before voting period ends (reverts)
        vm.expectRevert(
            abi.encodeWithSelector(
                SovereignLands.VotingPeriodStillActive.selector,
                propId,
                prop.endTime
            )
        );
        lands.executeProposal(propId);

        // Fast forward past 2-minute voting period
        vm.warp(block.timestamp + 3 minutes);

        lands.executeProposal(propId);

        // Check new tax rate
        KingdomStats memory stats = lands.getKingdomStats(Kingdom.North);
        assertEq(stats.taxRate, 15);
    }

    function testProposalQuorumFailure() public {
        // Admin seeds 10 North parcels to Bob
        vm.startPrank(bob);
        for (uint256 i = 1; i <= 10; i++) {
            lands.buyParcel{value: PARCEL_PRICE}(i);
        }
        vm.stopPrank();

        // Charlie buys 1 North parcel (101)
        vm.prank(charlie);
        lands.buyParcelWithBounds{value: PARCEL_PRICE}(101, -50, -50, 0, -10);

        // Total North parcels = 11.
        // 20% Quorum requires at least ceil(11 * 0.20) = 3 votes.
        // Charlie proposes (has 1 vote)
        vm.prank(charlie);
        uint256 propId = lands.propose(
            Kingdom.North,
            ProposalType.SetTaxRate,
            25,
            "Hike tax to 25%"
        );

        // Bob doesn't vote. Only Charlie voted (1 vote). 1 * 100 = 100 < 11 * 20 = 220. Quorum fails.
        vm.warp(block.timestamp + 3 minutes);

        lands.executeProposal(propId);

        // Tax rate should remain default 10%
        KingdomStats memory stats = lands.getKingdomStats(Kingdom.North);
        assertEq(stats.taxRate, 10);
    }

    function testProposeWithoutKingdomParcelsReverts() public {
        // David owns no parcels
        vm.prank(david);
        vm.expectRevert(
            abi.encodeWithSelector(
                SovereignLands.MustOwnParcelInKingdom.selector,
                Kingdom.North
            )
        );
        lands.propose(Kingdom.North, ProposalType.SetTaxRate, 20, "Invalid proposal");
    }

    function testDistributeTreasuryProposal() public {
        // Alice & Charlie own North parcels
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);

        vm.prank(charlie);
        lands.buyParcel{value: PARCEL_PRICE}(2);

        // Add 1000 gold directly to North treasury via tithe or simulate treasury
        vm.startPrank(alice);
        lands.buildStructure(1, StructureType.Farmstead);
        vm.stopPrank();

        vm.warp(block.timestamp + 200 minutes); // Generates gold & tax
        vm.prank(alice);
        lands.claimGold();

        uint256 initialTreasury = lands.kingdomTreasury(Kingdom.North);
        assertTrue(initialTreasury > 0);

        uint256 alicePreGold = lands.getPlayerGold(alice);
        uint256 charliePreGold = lands.getPlayerGold(charlie);

        // Propose DistributeTreasury
        vm.prank(alice);
        uint256 propId = lands.propose(
            Kingdom.North,
            ProposalType.DistributeTreasury,
            0,
            "Distribute surplus royal gold to landholders"
        );

        vm.warp(block.timestamp + 3 minutes);
        lands.executeProposal(propId);

        // Both Alice & Charlie should receive treasury dividends
        assertGt(lands.getPlayerGold(alice), alicePreGold);
        assertGt(lands.getPlayerGold(charlie), charliePreGold);
    }

    // =========================================================================
    //                        5. DETERMINISTIC 3D WAR
    // =========================================================================

    function testWarResolutionNorthWins() public {
        // Alice builds attack in North (Castle Keep: Att +10)
        vm.startPrank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);
        lands.buyParcel{value: PARCEL_PRICE}(2);
        lands.buildStructure(1, StructureType.CastleKeep);
        vm.stopPrank();

        // Bob has South parcel with 0 defense
        vm.prank(bob);
        lands.buyParcel{value: PARCEL_PRICE}(60);

        // Fund South treasury with 400 gold via farmstead
        vm.startPrank(bob);
        lands.buildStructure(60, StructureType.Farmstead);
        vm.stopPrank();

        vm.warp(block.timestamp + 80 minutes);
        vm.prank(bob);
        lands.claimGold();

        uint256 southPreTreasury = lands.kingdomTreasury(Kingdom.South);
        uint256 northPreTreasury = lands.kingdomTreasury(Kingdom.North);
        assertTrue(southPreTreasury > 0);

        // North attacks South: North Att (10) > South Def (0) => North Wins!
        // North loots 25% of South's treasury
        lands.resolveWar(Kingdom.North);

        uint256 southPostTreasury = lands.kingdomTreasury(Kingdom.South);
        uint256 northPostTreasury = lands.kingdomTreasury(Kingdom.North);

        uint256 expectedLoot = (southPreTreasury * 25) / 100;
        assertEq(southPostTreasury, southPreTreasury - expectedLoot);
        assertEq(northPostTreasury, northPreTreasury + expectedLoot);
    }

    function testWarResolutionNorthDefeated() public {
        // Alice has North parcel with 0 attack
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);

        // Bob builds strong defense in South (Guard Tower: Def +8)
        vm.startPrank(bob);
        lands.buyParcel{value: PARCEL_PRICE}(60);
        lands.buildStructure(60, StructureType.GuardTower);
        vm.stopPrank();

        // Give North some treasury via Alice's farmstead before building
        vm.startPrank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(2);
        lands.buildStructure(2, StructureType.Farmstead);
        vm.stopPrank();

        vm.warp(block.timestamp + 50 minutes);
        vm.prank(alice);
        lands.claimGold();

        uint256 northPreTreasury = lands.kingdomTreasury(Kingdom.North);
        uint256 southPreTreasury = lands.kingdomTreasury(Kingdom.South);
        assertTrue(northPreTreasury > 0);

        // North attacks South: North Att (0) <= South Def (8) => North Loses!
        // Attacker loses 10% penalty to defender
        lands.resolveWar(Kingdom.North);

        uint256 expectedPenalty = (northPreTreasury * 10) / 100;
        assertEq(lands.kingdomTreasury(Kingdom.North), northPreTreasury - expectedPenalty);
        assertEq(lands.kingdomTreasury(Kingdom.South), southPreTreasury + expectedPenalty);
    }

    function testWarCooldownEnforced() public {
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);
        vm.prank(bob);
        lands.buyParcel{value: PARCEL_PRICE}(60);

        lands.resolveWar(Kingdom.North);

        // Second war before 10 min cooldown must revert
        vm.expectRevert();
        lands.resolveWar(Kingdom.North);

        // After 10 minutes, war is allowed again
        vm.warp(block.timestamp + 11 minutes);
        lands.resolveWar(Kingdom.North);
    }

    // =========================================================================
    //                 6. SOULBOUND / TRANSFERS LOCKED
    // =========================================================================

    function testTransfersLockedByDefault() public {
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);

        // Alice attempts to transfer parcel to Bob -> reverts
        vm.prank(alice);
        vm.expectRevert(SovereignLands.TransfersAreLocked.selector);
        lands.transferFrom(alice, bob, 1);
    }

    function testTransfersAllowedWhenAdminUnlocks() public {
        vm.prank(alice);
        lands.buyParcel{value: PARCEL_PRICE}(1);

        // Admin unlocks transfers
        vm.prank(admin);
        lands.setTransfersLocked(false);

        // Alice transfers parcel to Bob successfully
        vm.prank(alice);
        lands.transferFrom(alice, bob, 1);

        assertEq(lands.ownerOf(1), bob);
    }
}
