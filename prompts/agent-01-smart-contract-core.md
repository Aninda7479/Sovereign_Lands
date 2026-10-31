# Agent 01: 3D Land & Economy Smart Contracts (Sovereign Lands)

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-01.lock`
   - Update file `status/agent-01.json` with:
     ```json
     {
       "agentId": "agent-01",
       "name": "Smart Contract Core (3D Land Registry)",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Drafting SovereignLands.sol 3D parcel bounding box contract...",
       "exclusiveFiles": [
         "contracts/src/SovereignLands.sol",
         "contracts/src/ISovereignLands.sol",
         "contracts/src/Types.sol"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the following files:
   - `contracts/src/SovereignLands.sol`
   - `contracts/src/ISovereignLands.sol`
   - `contracts/src/Types.sol`
   - `status/agent-01.json`
   - `status/agent-01.lock`
   ⚠️ **DO NOT TOUCH** `contracts/foundry.toml`, `contracts/test/**`, `contracts/script/**`, or `frontend/**`. Agent 02 owns deployment/tests, and Agent 07/15 own frontend Web3.

3. **RELEASE LOCK ON COMPLETION**:
   When your deliverables are finished and verified:
   - Delete `status/agent-01.lock`
   - Update `status/agent-01.json` with:
     ```json
     {
       "agentId": "agent-01",
       "name": "Smart Contract Core (3D Land Registry)",
       "status": "READY",
       "completedAt": "2026-10-31T06:30:00Z",
       "progress": "Complete & Verified",
       "exclusiveFiles": [
         "contracts/src/SovereignLands.sol",
         "contracts/src/ISovereignLands.sol",
         "contracts/src/Types.sol"
       ]
     }
     ```
---

## Role & Goal
You are the **Lead Blockchain Architect** for Sovereign Lands, a 3D Third-Person Open-World GTA-style medieval kingdom. You build the smart contract layer that turns the 3D world into sovereign on-chain territory.

## 3D Open-World Spatial Design
Unlike a tiny 2D grid, the open world is an expansive continuous 3D coordinate space `(X, Z)`.
- Parcels are 3D rectangular bounding zones: `minX, minZ, maxX, maxZ` (e.g. 50m × 50m plots).
- **Two Kingdoms**:
  - **North Kingdom (Boreal)**: `Z < 0` (Frozen mountains, stone citadels).
  - **South Kingdom (Solara)**: `Z > 0` (Sunlit plains, fertile valleys).
  - **Neutral / Frontier River Zone**: `Z between -20 and 20` (The Great Divide river).

## Key Deliverables

### 1. `contracts/src/Types.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum Kingdom { None, North, South }
enum StructureType { None, Farmstead, GuardTower, StoneWall, CastleKeep }
enum ProposalType { SetTaxRate, DistributeTreasury, DeclareWar, FundInfrastructure }

struct ParcelBoundingBox {
    int32 minX;
    int32 minZ;
    int32 maxX;
    int32 maxZ;
}

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
```

### 2. `contracts/src/SovereignLands.sol`
The core contract extending OpenZeppelin `ERC721Enumerable` and `ReentrancyGuard`:
- **Land Minting (`buyParcel(uint256 parcelId) external payable`)**:
  - Requires `msg.value >= PARCEL_PRICE` (0.01 testnet ETH).
  - Mints parcel NFT to caller, assigns starter gold (100 units).
  - Assigns kingdom based on 3D coordinate `Z` position.
  - Parcel NFTs are non-transferable during initial war seasons (or soulbound to active character).
- **In-World Construction (`buildStructure(uint256 parcelId, StructureType structure) external`)**:
  - Caller must own parcel. Deducts in-game gold balance.
  - Updates parcel defense and attack ratings based on structure:
    - `Farmstead`: Cost 50 gold. +5 gold/min.
    - `GuardTower`: Cost 80 gold. +8 defense.
    - `StoneWall`: Cost 60 gold. +6 defense.
    - `CastleKeep`: Cost 150 gold. +10 attack, +5 defense.
- **Gold Claim & Tithe (`claimGold() external`)**:
  - Loops owned parcels with Farmsteads, calculates elapsed time, takes kingdom tax (default 10%), deposits remainder to player gold.
- **Citadel Governance (`propose(...)`, `vote(...)`, `execute(...)`)**:
  - One active proposal per kingdom.
  - Proportional voting weight by owned 3D parcels.
  - 2-minute voting window for rapid demo.
- **Deterministic 3D War Resolution (`resolveWar(...)`)**:
  - Kingdom Attack = sum of all Castle Keeps attack power.
  - Kingdom Defense = sum of all Guard Towers & Stone Walls defense power.
  - Attacker wins if `Attack > Defense`: loots 25% of rival treasury.
- **Spatial Spatial Query View (`getParcelsInBounds(int32 minX, int32 minZ, int32 maxX, int32 maxZ) external view returns (Parcel[] memory)`)**:
  - Allows 3D game engine to stream and render parcels in the player's view distance (frustum/LOD).

### 3. `contracts/src/ISovereignLands.sol`
Full external interface exposing all view functions, administrative methods, and events (`ParcelClaimed`, `StructureBuilt`, `GoldHarvested`, `WarDeclared`, `WarResolved`).
