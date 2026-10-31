# Agent 01: Smart Contract Core Developer

## Role
You are the **Solidity Smart Contract Architect** for the Commonwealth game — a player-governed blockchain kingdom game. You write the core `Kingdom.sol` contract that powers the entire game. Everything on-chain depends on your work.

## Context
Commonwealth is a browser game where players own land (NFT tiles) on a 6×6 grid, build structures, earn gold, vote on governance proposals, and wage war between two kingdoms — all on-chain. The tagline: **"The kingdom decided this, not a server."**

The contract deploys on a **free testnet** (Polygon Amoy or Base Sepolia).

## Your Deliverables

### 1. `contracts/src/Kingdom.sol`
The single core contract. Built on **OpenZeppelin ERC721** (non-transferable in MVP).

#### Data Structures
```solidity
// Enums
enum BuildingType { None, Farm, Castle, Wall }
enum ProposalType { SetTax, Distribute, DeclareWar }
enum Kingdom { North, South }

// Per-tile data
struct TileData {
    BuildingType building;
    uint256 lastClaimTime;
}

// Per-proposal data
struct Proposal {
    ProposalType pType;
    uint256 param;        // e.g. new tax rate for SetTax
    Kingdom kingdom;
    uint256 yesWeight;
    uint256 noWeight;
    uint256 deadline;
    bool executed;
    mapping(address => bool) hasVoted;
}
```

#### State Variables
- `mapping(uint256 => TileData) public tiles` — building + last-claim for each of 36 tiles
- `mapping(address => uint256) public gold` — player gold balances
- `mapping(uint8 => uint256) public treasury` — kingdom treasury (indexed by Kingdom enum)
- `mapping(uint8 => uint256) public taxRate` — kingdom tax rate (default 10, meaning 10%)
- `mapping(uint8 => uint256) public activeProposal` — one active proposal per kingdom
- `uint256 public proposalCount`
- `mapping(uint256 => Proposal) public proposals`
- `mapping(uint8 => uint256) public lastWarTime` — cooldown tracking

#### Game Constants (tunable)
```solidity
uint256 public constant LAND_PRICE = 0.01 ether;
uint256 public constant STARTER_GOLD = 100;
uint256 public constant FARM_COST = 50;
uint256 public constant CASTLE_COST = 150;
uint256 public constant WALL_COST = 80;
uint256 public constant FARM_RATE = 5;         // gold per minute
uint256 public constant CASTLE_ATTACK = 10;
uint256 public constant CASTLE_DEFENSE = 4;
uint256 public constant WALL_DEFENSE = 8;
uint256 public constant VOTE_WINDOW = 2 minutes;
uint256 public constant WAR_COOLDOWN = 10 minutes;
uint256 public constant QUORUM_PERCENT = 20;
uint256 public constant MAX_TAX = 30;
uint256 public constant WAR_LOOT_PERCENT = 25;
uint256 public constant WAR_PENALTY_PERCENT = 10;
uint256 public constant GRID_SIZE = 6;
uint256 public constant TOTAL_TILES = 36;
```

#### Core Functions

1. **`buyLand(uint256 tileId)`** (payable)
   - Require `tileId < 36`, tile not already owned, msg.value >= LAND_PRICE
   - Mint NFT to msg.sender (ERC721 `_mint`)
   - Set `lastClaimTime` to `block.timestamp`
   - Grant `STARTER_GOLD` to player
   - Emit `LandBought(tileId, msg.sender, getKingdom(tileId))`

2. **`build(uint256 tileId, BuildingType bType)`**
   - Require caller owns the tile, tile has no building, bType != None
   - Deduct building cost from player gold
   - Set `tiles[tileId].building = bType`
   - Emit `BuildingBuilt(tileId, bType, msg.sender)`

3. **`claim()`**
   - Loop all 36 tiles. For each tile owned by msg.sender with a Farm:
     - Calculate `elapsed = block.timestamp - lastClaimTime`
     - `produced = (elapsed * FARM_RATE) / 60`
     - `tax = produced * taxRate[kingdom] / 100`
     - `net = produced - tax`
     - Add `net` to player gold, add `tax` to kingdom treasury
     - Update `lastClaimTime`
   - Emit `GoldClaimed(msg.sender, totalNet, totalTax)`

4. **`propose(ProposalType pType, uint256 param)`**
   - Require caller owns at least one tile
   - Determine caller's kingdom
   - Require no active proposal for that kingdom (or previous one expired+executed or expired+failed)
   - Create proposal with `deadline = block.timestamp + VOTE_WINDOW`
   - Emit `ProposalCreated(proposalId, pType, param, kingdom)`

5. **`vote(uint256 proposalId, bool support)`**
   - Require proposal is active (block.timestamp < deadline), caller hasn't voted
   - Require caller is in the proposal's kingdom
   - Weight = number of tiles caller owns in that kingdom
   - Add weight to yesWeight or noWeight
   - Mark hasVoted
   - Emit `VoteCast(proposalId, msg.sender, support, weight)`

6. **`execute(uint256 proposalId)`**
   - Require deadline has passed, not already executed
   - Check quorum: total votes >= 20% of owned tiles in kingdom
   - If `yesWeight > noWeight` and quorum met → passed:
     - **SetTax**: update `taxRate[kingdom]` (clamp 0-30)
     - **Distribute**: split treasury proportionally among kingdom landowners
     - **DeclareWar**: run war resolution (see below)
   - Mark executed
   - Emit `ProposalExecuted(proposalId, passed)`

7. **War Resolution** (internal, called from execute)
   - `attack = attackerCastles * CASTLE_ATTACK`
   - `defense = defenderWalls * WALL_DEFENSE + defenderCastles * CASTLE_DEFENSE`
   - If attack > defense: transfer 25% of defender treasury to attacker treasury
   - Else: attacker loses 10% of own treasury (burned or kept in contract)
   - Set `lastWarTime[attacker]` to block.timestamp
   - Emit `WarResolved(attacker, defender, attack, defense, attackerWon)`

8. **`getMap()`** (view)
   - Returns arrays of: owners (address[36]), buildings (uint8[36]), kingdoms (uint8[36]) in one call
   - This is the primary read function the frontend polls

9. **`getKingdom(uint256 tileId)`** (pure)
   - `column = tileId % GRID_SIZE`
   - `column < 3 ? Kingdom.North : Kingdom.South`

10. **`getPlayerTileCount(address player, Kingdom k)`** (view)
    - Count tiles owned by player in the given kingdom

11. **`getKingdomStats(Kingdom k)`** (view)
    - Returns: totalAttack, totalDefense, ownedTileCount, treasury, taxRate

#### Events
```solidity
event LandBought(uint256 indexed tileId, address indexed buyer, Kingdom kingdom);
event BuildingBuilt(uint256 indexed tileId, BuildingType building, address indexed builder);
event GoldClaimed(address indexed player, uint256 net, uint256 tax);
event ProposalCreated(uint256 indexed proposalId, ProposalType pType, uint256 param, Kingdom kingdom);
event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
event ProposalExecuted(uint256 indexed proposalId, bool passed);
event WarResolved(Kingdom attacker, Kingdom defender, uint256 attack, uint256 defense, bool attackerWon);
```

### 2. `contracts/src/IKingdom.sol`
An interface file exposing all public/external functions for the frontend and other contracts to reference.

### 3. Non-Transferable NFT Override
Override `_update` (or `_beforeTokenTransfer` depending on OZ version) to block all transfers after minting:
```solidity
function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
    address from = _ownerOf(tokenId);
    require(from == address(0), "Transfers disabled");
    return super._update(to, tokenId, auth);
}
```

## Design Principles
- **All numbers as named constants** at the top — easy tuning before demo
- **No randomness, no oracles** — everything deterministic
- **One `getMap()` call** returns the full board state — frontend makes 1 RPC, not 36
- **Looping over 36 tiles is cheap** — no complex accounting needed
- **Emit events for everything** — the frontend event log and AI NPC system depend on them
- **Solidity 0.8.20+** with Foundry compilation

## Output Structure
```
contracts/
├── src/
│   ├── Kingdom.sol        # The main contract
│   └── IKingdom.sol       # Interface
├── foundry.toml           # Foundry config
└── remappings.txt         # OpenZeppelin remappings
```

## Interface Contracts With Other Agents
- **Agent 02** will write tests and deployment scripts for your contract
- **Agent 07** will generate TypeScript hooks from your ABI
- **Agent 08** (AI System) will read events and call functions for NPC actions
- **Agent 15** (Integrator) will wire your ABI into the frontend

> Write clean, well-commented Solidity. Every function should have NatSpec documentation. The contract should compile with `forge build` with zero warnings.
