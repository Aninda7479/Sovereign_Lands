// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Sovereign Lands Core Types
 * @notice Defines kingdoms, structure types, proposals, spatial bounding boxes, and parcel structures.
 */

enum Kingdom { None, North, South }

enum StructureType { None, Farmstead, GuardTower, StoneWall, CastleKeep }

enum ProposalType { SetTaxRate, DistributeTreasury, DeclareWar, FundInfrastructure }

/**
 * @notice Continuous 3D world bounding box coordinates (X, Z plane in meters/units).
 */
struct ParcelBoundingBox {
    int32 minX;
    int32 minZ;
    int32 maxX;
    int32 maxZ;
}

/**
 * @notice On-chain 3D parcel entity.
 */
struct Parcel {
    uint256 id;
    ParcelBoundingBox bounds;
    Kingdom kingdom;
    address owner;
    StructureType structure;
    uint256 lastHarvestTime;
    uint256 defenseRating;
    uint256 attackRating;
}

/**
 * @notice Citadel council proposal entity.
 */
struct Proposal {
    uint256 id;
    Kingdom kingdom;
    ProposalType proposalType;
    uint256 param;
    string description;
    address proposer;
    uint256 startTime;
    uint256 endTime;
    uint256 yesVotes;
    uint256 noVotes;
    uint256 totalVoters;
    bool executed;
}

/**
 * @notice Kingdom real-time statistics.
 */
struct KingdomStats {
    uint256 treasuryGold;
    uint256 taxRate; // in percent (e.g. 10 = 10%)
    uint256 totalAttack;
    uint256 totalDefense;
    uint256 totalParcels;
    uint256 activeProposalId;
    uint256 lastWarTimestamp;
}

/**
 * @notice War resolution summary.
 */
struct WarResult {
    Kingdom attacker;
    Kingdom defender;
    uint256 attackerAttack;
    uint256 defenderDefense;
    bool attackerWon;
    uint256 goldPlundered;
    uint256 timestamp;
}
