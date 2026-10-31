// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./Types.sol";
import "./ISovereignLands.sol";

/**
 * @title SovereignLands
 * @notice 3D Open-World Spatial Land Registry, Resource Economy, Citadel Governance, and War Engine.
 * @dev Extends ERC721Enumerable and ReentrancyGuard for sovereign on-chain parcels.
 */
contract SovereignLands is ERC721Enumerable, ReentrancyGuard, Ownable, ISovereignLands {
    // --- Constants ---
    uint256 public constant PARCEL_PRICE = 0.01 ether;
    uint256 public constant STARTER_GOLD = 100;
    uint256 public constant DEFAULT_TAX_RATE = 10; // 10%
    uint256 public constant MAX_TAX_RATE = 30; // 30% max
    uint256 public constant VOTING_PERIOD = 2 minutes; // 120 seconds
    uint256 public constant WAR_COOLDOWN = 10 minutes; // 600 seconds
    uint256 public constant QUORUM_PERCENT = 20; // 20% quorum

    // Structure Economy Constants
    uint256 public constant FARMSTEAD_COST = 50;
    uint256 public constant GUARD_TOWER_COST = 80;
    uint256 public constant STONE_WALL_COST = 60;
    uint256 public constant CASTLE_KEEP_COST = 150;

    uint256 public constant FARMSTEAD_GOLD_PER_MIN = 5;
    uint256 public constant GUARD_TOWER_DEFENSE = 8;
    uint256 public constant STONE_WALL_DEFENSE = 6;
    uint256 public constant CASTLE_KEEP_ATTACK = 10;
    uint256 public constant CASTLE_KEEP_DEFENSE = 5;

    // --- Custom Errors ---
    error InsufficientPayment(uint256 provided, uint256 required);
    error ParcelAlreadyClaimed(uint256 parcelId);
    error ParcelDoesNotExist(uint256 parcelId);
    error NotParcelOwner(uint256 parcelId, address caller);
    error InsufficientGold(uint256 available, uint256 required);
    error InvalidStructureType();
    error InvalidCoordinates();
    error InvalidKingdom();
    error MustOwnParcelInKingdom(Kingdom kingdom);
    error ActiveProposalAlreadyExists(Kingdom kingdom, uint256 proposalId);
    error ProposalDoesNotExist(uint256 proposalId);
    error ProposalNotActive(uint256 proposalId);
    error AlreadyVoted(uint256 proposalId, address voter);
    error VotingPeriodStillActive(uint256 proposalId, uint256 endTime);
    error ProposalAlreadyExecuted(uint256 proposalId);
    error WarCooldownActive(uint256 timeRemaining);
    error InvalidTaxRate(uint256 rate);
    error TransfersAreLocked();

    // --- Storage ---
    mapping(uint256 => Parcel) private _parcels;
    uint256[] private _registeredParcelIds;
    mapping(uint256 => bool) private _isRegistered;

    mapping(address => uint256) public playerGold;
    mapping(Kingdom => uint256) public kingdomTreasury;
    mapping(Kingdom => uint256) public kingdomTaxRate;
    mapping(Kingdom => uint256) public kingdomAttack;
    mapping(Kingdom => uint256) public kingdomDefense;
    mapping(Kingdom => uint256) public totalParcelsInKingdom;
    mapping(Kingdom => uint256[]) private _kingdomParcelIds;

    mapping(Kingdom => uint256) public activeProposalIdByKingdom;
    mapping(Kingdom => uint256) public lastWarTimestamp;

    bool public transfersLocked;

    // Governance
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // --- Constructor ---
    constructor() ERC721("Sovereign Lands", "SLAND") Ownable(msg.sender) {
        kingdomTaxRate[Kingdom.North] = DEFAULT_TAX_RATE;
        kingdomTaxRate[Kingdom.South] = DEFAULT_TAX_RATE;
        transfersLocked = true; // Soulbound / locked during initial war seasons
    }

    // --- Modifier ---
    modifier onlyParcelOwner(uint256 parcelId) {
        if (ownerOf(parcelId) != msg.sender) {
            revert NotParcelOwner(parcelId, msg.sender);
        }
        _;
    }

    // =========================================================================
    //                            LAND MINTING
    // =========================================================================

    /**
     * @notice Purchase an unowned 3D parcel with 0.01 testnet ETH.
     * @param parcelId ID of the parcel to purchase.
     */
    function buyParcel(uint256 parcelId) public payable nonReentrant {
        if (msg.value < PARCEL_PRICE) {
            revert InsufficientPayment(msg.value, PARCEL_PRICE);
        }
        _buyParcelInternal(parcelId, msg.sender);
    }

    /**
     * @notice Alias for buyParcel matching Commonwealth Game Plan specification.
     */
    function buyLand(uint256 parcelId) external payable {
        buyParcel(parcelId);
    }

    /**
     * @notice Purchase a parcel specifying continuous 3D bounding box coordinates.
     */
    function buyParcelWithBounds(
        uint256 parcelId,
        int32 minX,
        int32 minZ,
        int32 maxX,
        int32 maxZ
    ) external payable nonReentrant {
        if (msg.value < PARCEL_PRICE) {
            revert InsufficientPayment(msg.value, PARCEL_PRICE);
        }
        if (maxX <= minX || maxZ <= minZ) {
            revert InvalidCoordinates();
        }
        if (_isRegistered[parcelId] && _parcels[parcelId].owner != address(0)) {
            revert ParcelAlreadyClaimed(parcelId);
        }

        Kingdom kingdom = determineKingdom(minZ, maxZ);
        if (kingdom == Kingdom.None) {
            revert InvalidKingdom();
        }

        if (!_isRegistered[parcelId]) {
            _registeredParcelIds.push(parcelId);
            _isRegistered[parcelId] = true;
        }

        _parcels[parcelId] = Parcel({
            id: parcelId,
            bounds: ParcelBoundingBox(minX, minZ, maxX, maxZ),
            kingdom: kingdom,
            owner: address(0),
            structure: StructureType.None,
            lastHarvestTime: block.timestamp,
            defenseRating: 0,
            attackRating: 0
        });

        _buyParcelInternal(parcelId, msg.sender);
    }

    function _buyParcelInternal(uint256 parcelId, address buyer) internal {
        if (!_isRegistered[parcelId]) {
            ParcelBoundingBox memory defaultBounds = getDefaultBounds(parcelId);
            Kingdom kingdom = determineKingdom(defaultBounds.minZ, defaultBounds.maxZ);
            _parcels[parcelId] = Parcel({
                id: parcelId,
                bounds: defaultBounds,
                kingdom: kingdom,
                owner: address(0),
                structure: StructureType.None,
                lastHarvestTime: block.timestamp,
                defenseRating: 0,
                attackRating: 0
            });
            _registeredParcelIds.push(parcelId);
            _isRegistered[parcelId] = true;
        }

        if (_parcels[parcelId].owner != address(0)) {
            revert ParcelAlreadyClaimed(parcelId);
        }

        _parcels[parcelId].owner = buyer;
        _parcels[parcelId].lastHarvestTime = block.timestamp;

        Kingdom parcelKingdom = _parcels[parcelId].kingdom;
        totalParcelsInKingdom[parcelKingdom] += 1;
        _kingdomParcelIds[parcelKingdom].push(parcelId);

        _mint(buyer, parcelId);

        playerGold[buyer] += STARTER_GOLD;

        emit ParcelClaimed(parcelId, buyer, parcelKingdom, _parcels[parcelId].bounds);
    }

    // =========================================================================
    //                         IN-WORLD CONSTRUCTION
    // =========================================================================

    /**
     * @notice Construct or upgrade a structure on an owned 3D parcel.
     * @param parcelId ID of the owned parcel.
     * @param structure Type of structure to build.
     */
    function buildStructure(uint256 parcelId, StructureType structure)
        public
        nonReentrant
        onlyParcelOwner(parcelId)
    {
        if (structure == StructureType.None) {
            revert InvalidStructureType();
        }

        (uint256 cost, uint256 attack, uint256 defense) = getStructureStats(structure);

        if (playerGold[msg.sender] < cost) {
            revert InsufficientGold(playerGold[msg.sender], cost);
        }

        playerGold[msg.sender] -= cost;

        Parcel storage parcel = _parcels[parcelId];

        // Deduct previous structure ratings if replacing
        if (parcel.attackRating > 0) {
            kingdomAttack[parcel.kingdom] -= parcel.attackRating;
        }
        if (parcel.defenseRating > 0) {
            kingdomDefense[parcel.kingdom] -= parcel.defenseRating;
        }

        parcel.structure = structure;
        parcel.attackRating = attack;
        parcel.defenseRating = defense;

        if (structure == StructureType.Farmstead) {
            parcel.lastHarvestTime = block.timestamp;
        }

        kingdomAttack[parcel.kingdom] += attack;
        kingdomDefense[parcel.kingdom] += defense;

        emit StructureBuilt(parcelId, msg.sender, structure, defense, attack);
    }

    /**
     * @notice Alias for buildStructure matching Commonwealth Game Plan specification.
     */
    function build(uint256 parcelId, StructureType structure) external {
        buildStructure(parcelId, structure);
    }

    // =========================================================================
    //                           GOLD CLAIM & TITHE
    // =========================================================================

    /**
     * @notice Harvest gold from all owned farmsteads, paying the kingdom tithe.
     */
    function claimGold() public nonReentrant returns (uint256 totalHarvested) {
        uint256 ownedCount = balanceOf(msg.sender);
        uint256 totalGross = 0;
        uint256 totalTax = 0;
        uint256 totalNet = 0;

        for (uint256 i = 0; i < ownedCount; i++) {
            uint256 parcelId = tokenOfOwnerByIndex(msg.sender, i);
            Parcel storage parcel = _parcels[parcelId];

            if (parcel.structure == StructureType.Farmstead) {
                uint256 elapsed = block.timestamp - parcel.lastHarvestTime;
                if (elapsed >= 1) {
                    uint256 gross = (elapsed * FARMSTEAD_GOLD_PER_MIN) / 60;
                    if (gross > 0) {
                        parcel.lastHarvestTime = block.timestamp;
                        uint256 tax = (gross * kingdomTaxRate[parcel.kingdom]) / 100;
                        uint256 net = gross - tax;

                        kingdomTreasury[parcel.kingdom] += tax;
                        totalGross += gross;
                        totalTax += tax;
                        totalNet += net;
                    }
                }
            }
        }

        if (totalNet > 0) {
            playerGold[msg.sender] += totalNet;
            emit GoldHarvested(msg.sender, totalGross, totalNet, totalTax);
        }

        return totalNet;
    }

    /**
     * @notice Alias for claimGold matching Commonwealth Game Plan specification.
     */
    function claim() external returns (uint256 totalHarvested) {
        return claimGold();
    }

    /**
     * @notice Harvest gold from a single owned parcel.
     */
    function claimGoldForParcel(uint256 parcelId)
        external
        nonReentrant
        onlyParcelOwner(parcelId)
        returns (uint256 netGold)
    {
        Parcel storage parcel = _parcels[parcelId];
        if (parcel.structure != StructureType.Farmstead) {
            return 0;
        }

        uint256 elapsed = block.timestamp - parcel.lastHarvestTime;
        if (elapsed < 1) {
            return 0;
        }

        uint256 gross = (elapsed * FARMSTEAD_GOLD_PER_MIN) / 60;
        if (gross == 0) {
            return 0;
        }

        parcel.lastHarvestTime = block.timestamp;
        uint256 tax = (gross * kingdomTaxRate[parcel.kingdom]) / 100;
        netGold = gross - tax;

        kingdomTreasury[parcel.kingdom] += tax;
        playerGold[msg.sender] += netGold;

        emit GoldHarvested(msg.sender, gross, netGold, tax);
        return netGold;
    }

    // =========================================================================
    //                          CITADEL GOVERNANCE
    // =========================================================================

    /**
     * @notice Propose a kingdom governance action with explicit kingdom.
     */
    function propose(
        Kingdom kingdom,
        ProposalType proposalType,
        uint256 param,
        string calldata description
    ) public returns (uint256 proposalId) {
        uint256 weight = getKingdomParcelCount(msg.sender, kingdom);
        if (weight == 0) {
            revert MustOwnParcelInKingdom(kingdom);
        }

        uint256 activeId = activeProposalIdByKingdom[kingdom];
        if (activeId != 0) {
            Proposal storage activeProp = proposals[activeId];
            if (!activeProp.executed && block.timestamp < activeProp.endTime) {
                revert ActiveProposalAlreadyExists(kingdom, activeId);
            }
        }

        if (proposalType == ProposalType.SetTaxRate && param > MAX_TAX_RATE) {
            revert InvalidTaxRate(param);
        }

        proposalCount++;
        proposalId = proposalCount;
        uint256 endTime = block.timestamp + VOTING_PERIOD;

        Proposal storage prop = proposals[proposalId];
        prop.id = proposalId;
        prop.kingdom = kingdom;
        prop.proposalType = proposalType;
        prop.param = param;
        prop.description = description;
        prop.proposer = msg.sender;
        prop.startTime = block.timestamp;
        prop.endTime = endTime;
        prop.yesVotes = weight; // Proposer automatically votes YES with their parcels
        prop.noVotes = 0;
        prop.totalVoters = 1;
        prop.executed = false;

        hasVoted[proposalId][msg.sender] = true;
        activeProposalIdByKingdom[kingdom] = proposalId;

        emit ProposalCreated(proposalId, kingdom, proposalType, param, description, msg.sender, endTime);
        emit VoteCast(proposalId, msg.sender, true, weight);
    }

    /**
     * @notice Propose inferring kingdom from caller's owned parcels.
     */
    function propose(
        ProposalType proposalType,
        uint256 param,
        string calldata description
    ) external returns (uint256 proposalId) {
        uint256 northCount = getKingdomParcelCount(msg.sender, Kingdom.North);
        uint256 southCount = getKingdomParcelCount(msg.sender, Kingdom.South);
        Kingdom kingdom = Kingdom.None;

        if (northCount > 0 && southCount == 0) {
            kingdom = Kingdom.North;
        } else if (southCount > 0 && northCount == 0) {
            kingdom = Kingdom.South;
        } else if (northCount > 0 && southCount > 0) {
            kingdom = (northCount >= southCount) ? Kingdom.North : Kingdom.South;
        } else {
            revert MustOwnParcelInKingdom(Kingdom.None);
        }

        return propose(kingdom, proposalType, param, description);
    }

    /**
     * @notice Propose with default empty description.
     */
    function propose(ProposalType proposalType, uint256 param) external returns (uint256 proposalId) {
        uint256 northCount = getKingdomParcelCount(msg.sender, Kingdom.North);
        uint256 southCount = getKingdomParcelCount(msg.sender, Kingdom.South);
        Kingdom kingdom = Kingdom.None;

        if (northCount > 0 && southCount == 0) {
            kingdom = Kingdom.North;
        } else if (southCount > 0 && northCount == 0) {
            kingdom = Kingdom.South;
        } else if (northCount > 0 && southCount > 0) {
            kingdom = (northCount >= southCount) ? Kingdom.North : Kingdom.South;
        } else {
            revert MustOwnParcelInKingdom(Kingdom.None);
        }

        return propose(kingdom, proposalType, param, "");
    }

    /**
     * @notice Cast a weighted vote on an active proposal.
     */
    function vote(uint256 proposalId, bool support) external {
        if (proposalId == 0 || proposalId > proposalCount) {
            revert ProposalDoesNotExist(proposalId);
        }

        Proposal storage prop = proposals[proposalId];
        if (prop.executed || block.timestamp >= prop.endTime) {
            revert ProposalNotActive(proposalId);
        }

        uint256 weight = getKingdomParcelCount(msg.sender, prop.kingdom);
        if (weight == 0) {
            revert MustOwnParcelInKingdom(prop.kingdom);
        }

        if (hasVoted[proposalId][msg.sender]) {
            revert AlreadyVoted(proposalId, msg.sender);
        }

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            prop.yesVotes += weight;
        } else {
            prop.noVotes += weight;
        }
        prop.totalVoters += 1;

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    /**
     * @notice Execute a concluded proposal.
     */
    function executeProposal(uint256 proposalId) public nonReentrant {
        if (proposalId == 0 || proposalId > proposalCount) {
            revert ProposalDoesNotExist(proposalId);
        }

        Proposal storage prop = proposals[proposalId];
        if (prop.executed) {
            revert ProposalAlreadyExecuted(proposalId);
        }

        if (block.timestamp < prop.endTime) {
            revert VotingPeriodStillActive(proposalId, prop.endTime);
        }

        prop.executed = true;

        if (activeProposalIdByKingdom[prop.kingdom] == proposalId) {
            activeProposalIdByKingdom[prop.kingdom] = 0;
        }

        uint256 totalVotes = prop.yesVotes + prop.noVotes;
        uint256 kingdomParcels = totalParcelsInKingdom[prop.kingdom];

        // Quorum: at least 20% of owned kingdom tiles voted
        bool quorumReached = (kingdomParcels > 0) && ((totalVotes * 100) >= (kingdomParcels * QUORUM_PERCENT));
        bool passed = quorumReached && (prop.yesVotes > prop.noVotes);

        if (passed) {
            if (prop.proposalType == ProposalType.SetTaxRate) {
                uint256 oldRate = kingdomTaxRate[prop.kingdom];
                kingdomTaxRate[prop.kingdom] = prop.param;
                emit TaxRateUpdated(prop.kingdom, oldRate, prop.param);
            } else if (prop.proposalType == ProposalType.DistributeTreasury) {
                _distributeTreasury(prop.kingdom);
            } else if (prop.proposalType == ProposalType.DeclareWar) {
                _executeWar(prop.kingdom);
            } else if (prop.proposalType == ProposalType.FundInfrastructure) {
                uint256 cost = prop.param > 0 ? prop.param : 100;
                if (kingdomTreasury[prop.kingdom] >= cost) {
                    kingdomTreasury[prop.kingdom] -= cost;
                    kingdomDefense[prop.kingdom] += 15;
                }
            }
        }

        emit ProposalExecuted(proposalId, passed);
    }

    /// @inheritdoc ISovereignLands
    function execute(uint256 proposalId) external {
        executeProposal(proposalId);
    }

    function _distributeTreasury(Kingdom kingdom) internal {
        uint256 treasury = kingdomTreasury[kingdom];
        uint256 parcelCount = totalParcelsInKingdom[kingdom];
        if (treasury == 0 || parcelCount == 0) return;

        uint256 perParcel = treasury / parcelCount;
        if (perParcel == 0) return;

        uint256[] storage parcelIds = _kingdomParcelIds[kingdom];
        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < parcelIds.length; i++) {
            address pOwner = _parcels[parcelIds[i]].owner;
            if (pOwner != address(0)) {
                playerGold[pOwner] += perParcel;
                totalDistributed += perParcel;
            }
        }

        kingdomTreasury[kingdom] -= totalDistributed;
        emit TreasuryDistributed(kingdom, totalDistributed, perParcel);
    }

    // =========================================================================
    //                         DETERMINISTIC 3D WAR
    // =========================================================================

    /**
     * @notice Manually resolve a war declaration between kingdoms.
     */
    function resolveWar(Kingdom attackerKingdom) public nonReentrant {
        if (attackerKingdom != Kingdom.North && attackerKingdom != Kingdom.South) {
            revert InvalidKingdom();
        }

        uint256 cooldownEnd = lastWarTimestamp[attackerKingdom] + WAR_COOLDOWN;
        if (block.timestamp < cooldownEnd) {
            revert WarCooldownActive(cooldownEnd - block.timestamp);
        }

        _executeWar(attackerKingdom);
    }

    /**
     * @notice Automatic war resolution overload checking available kingdom.
     */
    function resolveWar() external {
        if (block.timestamp >= lastWarTimestamp[Kingdom.North] + WAR_COOLDOWN) {
            resolveWar(Kingdom.North);
        } else {
            resolveWar(Kingdom.South);
        }
    }

    function _executeWar(Kingdom attackerKingdom) internal {
        Kingdom defenderKingdom = (attackerKingdom == Kingdom.North) ? Kingdom.South : Kingdom.North;

        uint256 attack = kingdomAttack[attackerKingdom];
        uint256 defense = kingdomDefense[defenderKingdom];

        emit WarDeclared(attackerKingdom, defenderKingdom);

        lastWarTimestamp[attackerKingdom] = block.timestamp;

        bool attackerWon = attack > defense;
        uint256 goldPlundered = 0;

        if (attackerWon) {
            // Attacker loots 25% of rival treasury
            goldPlundered = (kingdomTreasury[defenderKingdom] * 25) / 100;
            if (goldPlundered > 0) {
                kingdomTreasury[defenderKingdom] -= goldPlundered;
                kingdomTreasury[attackerKingdom] += goldPlundered;
            }
        } else {
            // Failed attack: attacker loses 10% of own treasury
            uint256 penalty = (kingdomTreasury[attackerKingdom] * 10) / 100;
            if (penalty > 0) {
                kingdomTreasury[attackerKingdom] -= penalty;
                kingdomTreasury[defenderKingdom] += penalty;
            }
        }

        emit WarResolved(attackerKingdom, defenderKingdom, attack, defense, attackerWon, goldPlundered);
    }

    // =========================================================================
    //                         SPATIAL QUERIES
    // =========================================================================

    /**
     * @notice Returns all 3D parcels intersecting the given bounding box for streaming/LOD.
     */
    function getParcelsInBounds(
        int32 minX,
        int32 minZ,
        int32 maxX,
        int32 maxZ
    ) external view returns (Parcel[] memory) {
        uint256 total = _registeredParcelIds.length;
        uint256 matchCount = 0;

        for (uint256 i = 0; i < total; i++) {
            uint256 pid = _registeredParcelIds[i];
            ParcelBoundingBox memory b = _parcels[pid].bounds;

            // AABB intersection check
            if (!(b.maxX < minX || b.minX > maxX || b.maxZ < minZ || b.minZ > maxZ)) {
                matchCount++;
            }
        }

        Parcel[] memory results = new Parcel[](matchCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < total; i++) {
            uint256 pid = _registeredParcelIds[i];
            ParcelBoundingBox memory b = _parcels[pid].bounds;

            if (!(b.maxX < minX || b.minX > maxX || b.maxZ < minZ || b.minZ > maxZ)) {
                results[currentIndex] = _parcels[pid];
                currentIndex++;
            }
        }

        return results;
    }

    function getParcel(uint256 parcelId) external view returns (Parcel memory) {
        if (!_isRegistered[parcelId]) {
            revert ParcelDoesNotExist(parcelId);
        }
        return _parcels[parcelId];
    }

    function getAllParcels() public view returns (Parcel[] memory) {
        uint256 total = _registeredParcelIds.length;
        Parcel[] memory items = new Parcel[](total);
        for (uint256 i = 0; i < total; i++) {
            items[i] = _parcels[_registeredParcelIds[i]];
        }
        return items;
    }

    function getMap() external view returns (Parcel[] memory) {
        return getAllParcels();
    }

    function getPlayerParcels(address player) external view returns (Parcel[] memory) {
        uint256 count = balanceOf(player);
        Parcel[] memory playerItems = new Parcel[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 pid = tokenOfOwnerByIndex(player, i);
            playerItems[i] = _parcels[pid];
        }
        return playerItems;
    }

    // =========================================================================
    //                        STATE & STATS QUERIES
    // =========================================================================

    function getPlayerGold(address player) external view returns (uint256) {
        return playerGold[player];
    }

    function getKingdomTreasury(Kingdom kingdom) external view returns (uint256) {
        return kingdomTreasury[kingdom];
    }

    function getKingdomStats(Kingdom kingdom) external view returns (KingdomStats memory) {
        return KingdomStats({
            treasuryGold: kingdomTreasury[kingdom],
            taxRate: kingdomTaxRate[kingdom],
            totalAttack: kingdomAttack[kingdom],
            totalDefense: kingdomDefense[kingdom],
            totalParcels: totalParcelsInKingdom[kingdom],
            activeProposalId: activeProposalIdByKingdom[kingdom],
            lastWarTimestamp: lastWarTimestamp[kingdom]
        });
    }

    function getActiveProposal(Kingdom kingdom) external view returns (Proposal memory proposal, bool hasActive) {
        uint256 activeId = activeProposalIdByKingdom[kingdom];
        if (activeId == 0) {
            return (proposal, false);
        }
        Proposal storage p = proposals[activeId];
        if (p.executed || block.timestamp >= p.endTime) {
            return (proposal, false);
        }
        return (p, true);
    }

    function getPendingGold(address player) external view returns (uint256 totalGross, uint256 totalTax, uint256 totalNet) {
        uint256 count = balanceOf(player);
        for (uint256 i = 0; i < count; i++) {
            uint256 pid = tokenOfOwnerByIndex(player, i);
            Parcel storage parcel = _parcels[pid];
            if (parcel.structure == StructureType.Farmstead) {
                uint256 elapsed = block.timestamp - parcel.lastHarvestTime;
                if (elapsed >= 1) {
                    uint256 gross = (elapsed * FARMSTEAD_GOLD_PER_MIN) / 60;
                    if (gross > 0) {
                        uint256 tax = (gross * kingdomTaxRate[parcel.kingdom]) / 100;
                        uint256 net = gross - tax;
                        totalGross += gross;
                        totalTax += tax;
                        totalNet += net;
                    }
                }
            }
        }
    }

    function hasUserVoted(uint256 proposalId, address voter) external view returns (bool) {
        return hasVoted[proposalId][voter];
    }

    function getKingdomParcelCount(address player, Kingdom kingdom) public view returns (uint256) {
        uint256 count = balanceOf(player);
        uint256 inKingdom = 0;
        for (uint256 i = 0; i < count; i++) {
            uint256 pid = tokenOfOwnerByIndex(player, i);
            if (_parcels[pid].kingdom == kingdom) {
                inKingdom++;
            }
        }
        return inKingdom;
    }

    // =========================================================================
    //                        ADMIN & WORLD SEEDING
    // =========================================================================

    function registerParcel(
        uint256 parcelId,
        int32 minX,
        int32 minZ,
        int32 maxX,
        int32 maxZ
    ) public onlyOwner {
        if (maxX <= minX || maxZ <= minZ) {
            revert InvalidCoordinates();
        }

        Kingdom kingdom = determineKingdom(minZ, maxZ);
        if (kingdom == Kingdom.None) {
            revert InvalidKingdom();
        }

        if (!_isRegistered[parcelId]) {
            _registeredParcelIds.push(parcelId);
            _isRegistered[parcelId] = true;
        }

        _parcels[parcelId] = Parcel({
            id: parcelId,
            bounds: ParcelBoundingBox(minX, minZ, maxX, maxZ),
            kingdom: kingdom,
            owner: address(0),
            structure: StructureType.None,
            lastHarvestTime: block.timestamp,
            defenseRating: 0,
            attackRating: 0
        });

        emit ParcelRegistered(parcelId, kingdom, minX, minZ, maxX, maxZ);
    }

    function batchRegisterParcels(
        uint256[] calldata parcelIds,
        ParcelBoundingBox[] calldata boxes
    ) external onlyOwner {
        require(parcelIds.length == boxes.length, "Mismatched arrays");
        for (uint256 i = 0; i < parcelIds.length; i++) {
            registerParcel(
                parcelIds[i],
                boxes[i].minX,
                boxes[i].minZ,
                boxes[i].maxX,
                boxes[i].maxZ
            );
        }
    }

    /**
     * @notice Admin function to pre-seed populated parcels for immediate demo playability.
     */
    function adminSeedParcel(
        uint256 parcelId,
        int32 minX,
        int32 minZ,
        int32 maxX,
        int32 maxZ,
        address initialOwner,
        StructureType structure
    ) external onlyOwner {
        registerParcel(parcelId, minX, minZ, maxX, maxZ);
        if (initialOwner != address(0)) {
            _parcels[parcelId].owner = initialOwner;
            _parcels[parcelId].lastHarvestTime = block.timestamp;
            Kingdom kingdom = _parcels[parcelId].kingdom;
            totalParcelsInKingdom[kingdom] += 1;
            _kingdomParcelIds[kingdom].push(parcelId);
            _mint(initialOwner, parcelId);
            playerGold[initialOwner] += STARTER_GOLD;

            if (structure != StructureType.None) {
                (, uint256 attack, uint256 defense) = getStructureStats(structure);
                _parcels[parcelId].structure = structure;
                _parcels[parcelId].attackRating = attack;
                _parcels[parcelId].defenseRating = defense;
                kingdomAttack[kingdom] += attack;
                kingdomDefense[kingdom] += defense;
            }
        }
    }

    function setTransfersLocked(bool locked) external onlyOwner {
        transfersLocked = locked;
        emit TransfersLockedToggled(locked);
    }

    // =========================================================================
    //                        HELPERS & PURE UTILS
    // =========================================================================

    /**
     * @notice Assigns kingdom based on continuous 3D coordinate Z position.
     * North Kingdom (Boreal): Z < 0
     * South Kingdom (Solara): Z > 0
     * Neutral / River Zone: Z between -20 and 20
     */
    function determineKingdom(int32 minZ, int32 maxZ) public pure returns (Kingdom) {
        int32 midZ = (minZ + maxZ) / 2;
        if (midZ < 0) {
            return Kingdom.North;
        } else if (midZ > 0) {
            return Kingdom.South;
        } else {
            return (minZ < 0) ? Kingdom.North : Kingdom.South;
        }
    }

    function getDefaultBounds(uint256 parcelId) public pure returns (ParcelBoundingBox memory) {
        int32 idVal = int32(uint32(parcelId));
        int32 col = (idVal % 10) - 5;
        int32 minX = col * 50;
        int32 maxX = minX + 50;
        int32 minZ;
        int32 maxZ;

        if (parcelId <= 50) {
            // North: Z < -20
            maxZ = -30 - (idVal * 15);
            minZ = maxZ - 50;
        } else {
            // South: Z > 20
            minZ = 30 + ((idVal - 50) * 15);
            maxZ = minZ + 50;
        }

        return ParcelBoundingBox(minX, minZ, maxX, maxZ);
    }

    function getStructureStats(StructureType structure)
        public
        pure
        returns (uint256 cost, uint256 attack, uint256 defense)
    {
        if (structure == StructureType.Farmstead) {
            return (FARMSTEAD_COST, 0, 0);
        } else if (structure == StructureType.GuardTower) {
            return (GUARD_TOWER_COST, 0, GUARD_TOWER_DEFENSE);
        } else if (structure == StructureType.StoneWall) {
            return (STONE_WALL_COST, 0, STONE_WALL_DEFENSE);
        } else if (structure == StructureType.CastleKeep) {
            return (CASTLE_KEEP_COST, CASTLE_KEEP_ATTACK, CASTLE_KEEP_DEFENSE);
        } else {
            revert InvalidStructureType();
        }
    }

    function getStructureCost(StructureType structure) public pure returns (uint256) {
        (uint256 cost, , ) = getStructureStats(structure);
        return cost;
    }

    // =========================================================================
    //                        ERC721 OVERRIDES (OZ v5)
    // =========================================================================

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0) && transfersLocked) {
            revert TransfersAreLocked();
        }
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // =========================================================================
    //                            FALLBACK / RECEIVE
    // =========================================================================

    receive() external payable {}
}
