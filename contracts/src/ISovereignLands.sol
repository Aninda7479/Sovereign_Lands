// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Types.sol";

/**
 * @title ISovereignLands
 * @notice Interface for Sovereign Lands 3D open-world land registry, economy, citadel governance, and war.
 */
interface ISovereignLands {
    // --- Events ---
    event ParcelRegistered(uint256 indexed parcelId, Kingdom indexed kingdom, int32 minX, int32 minZ, int32 maxX, int32 maxZ);
    event ParcelClaimed(uint256 indexed parcelId, address indexed owner, Kingdom indexed kingdom, ParcelBoundingBox bounds);
    event StructureBuilt(uint256 indexed parcelId, address indexed owner, StructureType structure, uint256 defenseRating, uint256 attackRating);
    event GoldHarvested(address indexed player, uint256 grossGold, uint256 netGold, uint256 taxPaid);
    event ProposalCreated(uint256 indexed proposalId, Kingdom indexed kingdom, ProposalType proposalType, uint256 param, string description, address indexed proposer, uint256 endTime);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event WarDeclared(Kingdom indexed attacker, Kingdom indexed defender);
    event WarResolved(Kingdom indexed attacker, Kingdom indexed defender, uint256 attackerAttack, uint256 defenderDefense, bool attackerWon, uint256 goldPlundered);
    event TreasuryDistributed(Kingdom indexed kingdom, uint256 totalAmount, uint256 amountPerParcel);
    event TaxRateUpdated(Kingdom indexed kingdom, uint256 oldRate, uint256 newRate);
    event TransfersLockedToggled(bool locked);

    // --- Land & Economy ---
    function buyParcel(uint256 parcelId) external payable;
    function buyLand(uint256 parcelId) external payable;
    function buyParcelWithBounds(uint256 parcelId, int32 minX, int32 minZ, int32 maxX, int32 maxZ) external payable;
    function buildStructure(uint256 parcelId, StructureType structure) external;
    function build(uint256 parcelId, StructureType structure) external;
    function claimGold() external returns (uint256 totalHarvested);
    function claim() external returns (uint256 totalHarvested);
    function claimGoldForParcel(uint256 parcelId) external returns (uint256 netGold);

    // --- Governance ---
    function propose(Kingdom kingdom, ProposalType proposalType, uint256 param, string calldata description) external returns (uint256 proposalId);
    function propose(ProposalType proposalType, uint256 param, string calldata description) external returns (uint256 proposalId);
    function propose(ProposalType proposalType, uint256 param) external returns (uint256 proposalId);
    function vote(uint256 proposalId, bool support) external;
    function executeProposal(uint256 proposalId) external;
    function execute(uint256 proposalId) external;

    // --- War System ---
    function resolveWar(Kingdom attackerKingdom) external;
    function resolveWar() external;

    // --- Spatial & World Queries ---
    function getParcelsInBounds(int32 minX, int32 minZ, int32 maxX, int32 maxZ) external view returns (Parcel[] memory);
    function getParcel(uint256 parcelId) external view returns (Parcel memory);
    function getAllParcels() external view returns (Parcel[] memory);
    function getMap() external view returns (Parcel[] memory);
    function getPlayerParcels(address player) external view returns (Parcel[] memory);

    // --- State & Statistics Queries ---
    function getPlayerGold(address player) external view returns (uint256);
    function getKingdomTreasury(Kingdom kingdom) external view returns (uint256);
    function getKingdomStats(Kingdom kingdom) external view returns (KingdomStats memory);
    function getActiveProposal(Kingdom kingdom) external view returns (Proposal memory proposal, bool hasActive);
    function getPendingGold(address player) external view returns (uint256 totalGross, uint256 totalTax, uint256 totalNet);
    function hasUserVoted(uint256 proposalId, address voter) external view returns (bool);
    function getKingdomParcelCount(address player, Kingdom kingdom) external view returns (uint256);

    // --- Administration & Seeding ---
    function registerParcel(uint256 parcelId, int32 minX, int32 minZ, int32 maxX, int32 maxZ) external;
    function batchRegisterParcels(uint256[] calldata parcelIds, ParcelBoundingBox[] calldata boxes) external;
    function adminSeedParcel(uint256 parcelId, int32 minX, int32 minZ, int32 maxX, int32 maxZ, address initialOwner, StructureType structure) external;
    function setTransfersLocked(bool locked) external;

    // --- Pure Helpers ---
    function determineKingdom(int32 minZ, int32 maxZ) external pure returns (Kingdom);
    function getDefaultBounds(uint256 parcelId) external pure returns (ParcelBoundingBox memory);
    function getStructureStats(StructureType structure) external pure returns (uint256 cost, uint256 attack, uint256 defense);
    function getStructureCost(StructureType structure) external pure returns (uint256);
}
