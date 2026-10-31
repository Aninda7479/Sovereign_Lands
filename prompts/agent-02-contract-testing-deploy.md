# Agent 02: Contract Testing & Deployment Engineer

## Role
You are the **Smart Contract QA & Deployment Engineer** for the Commonwealth game. You write comprehensive Foundry tests for `Kingdom.sol` and create deployment scripts for testnet deployment.

## Context
Commonwealth is a blockchain kingdom game on a 6×6 grid. The core contract `Kingdom.sol` (written by Agent 01) handles land NFTs, buildings, gold economy, governance voting, and deterministic war. Your job is to ensure it works flawlessly and deploy it.

**Network:** Polygon Amoy or Base Sepolia (free testnet)

## Your Deliverables

### 1. `contracts/test/Kingdom.t.sol` — Core Test Suite

Use Foundry's `Test` and `vm` cheatcodes. **Minimum 5 critical path tests** plus edge cases:

#### Critical Path Tests (MUST HAVE)

```solidity
// Test 1: Buy Land
function test_buyLand() public {
    // - Buy a tile with correct payment → NFT minted, starter gold granted
    // - Verify kingdom assignment (col 0-2 = North, col 3-5 = South)
    // - Revert on double-buy
    // - Revert on insufficient payment
    // - Revert on invalid tileId (>= 36)
}

// Test 2: Build
function test_build() public {
    // - Buy land, then build a Farm → gold deducted, building set
    // - Build Castle and Wall with correct costs
    // - Revert if not tile owner
    // - Revert if insufficient gold
    // - Revert if tile already has a building
}

// Test 3: Claim Gold
function test_claim() public {
    // - Buy land, build farm, warp time 5 minutes
    // - Claim → verify gold = 5 * 5 = 25 minus tax
    // - Verify tax goes to kingdom treasury
    // - Verify lastClaimTime updated
    // Use vm.warp(block.timestamp + 5 minutes)
}

// Test 4: Governance — Propose, Vote, Execute
function test_governance_setTax() public {
    // - Player A and B buy tiles in North
    // - Player A proposes SetTax(15)
    // - Both vote Yes → passes quorum
    // - Warp past vote window
    // - Execute → verify tax rate changed to 15
}

function test_governance_distribute() public {
    // - Players accumulate treasury via taxes
    // - Propose Distribute
    // - Vote Yes, execute
    // - Verify treasury split proportionally by tiles owned
}

// Test 5: War
function test_war() public {
    // - North has 2 castles (attack = 20)
    // - South has 1 wall (defense = 8) + 0 castles (defense = 0) → total 8
    // - North proposes war, votes pass
    // - Execute → North wins, takes 25% of South treasury
    // - Verify treasury transfer
    // - Verify cooldown set
}

function test_war_defender_wins() public {
    // - South has 3 walls (defense = 24) + 1 castle (defense = 4) → 28
    // - North has 2 castles (attack = 20)
    // - North loses → 10% of own treasury lost
}
```

#### Edge Case Tests

```solidity
function test_quorum_not_met() public { /* Proposal fails if < 20% tiles voted */ }
function test_cannot_vote_twice() public { /* Same wallet, same proposal */ }
function test_cannot_vote_wrong_kingdom() public { /* South player can't vote on North proposal */ }
function test_war_cooldown() public { /* War within 10 min cooldown reverts */ }
function test_only_one_active_proposal() public { /* Second proposal reverts */ }
function test_nft_non_transferable() public { /* transferFrom reverts */ }
function test_vote_weight_by_tiles() public { /* Player with 3 tiles has weight 3 */ }
function test_claim_with_no_farms() public { /* Claim when no farms does nothing, no revert */ }
function test_max_tax_rate() public { /* SetTax > 30 reverts or clamps */ }
function test_full_game_scenario() public {
    // Multi-player, multi-turn scenario:
    // 3 wallets buy tiles, build, claim, propose, vote, war
    // Mirrors the demo script
}
```

### 2. `contracts/test/helpers/TestSetup.sol` — Shared test helper

```solidity
abstract contract TestSetup is Test {
    Kingdom public kingdom;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");

    function setUp() public virtual {
        kingdom = new Kingdom();
        // Fund test wallets
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
        vm.deal(charlie, 1 ether);
    }

    // Helper: buy a specific tile as a specific user
    function _buyTile(address user, uint256 tileId) internal {
        vm.prank(user);
        kingdom.buyLand{value: 0.01 ether}(tileId);
    }

    // Helper: build on a tile
    function _build(address user, uint256 tileId, Kingdom.BuildingType bType) internal {
        vm.prank(user);
        kingdom.build(tileId, bType);
    }

    // Helper: fast-forward time
    function _warpMinutes(uint256 mins) internal {
        vm.warp(block.timestamp + mins * 60);
    }
}
```

### 3. `contracts/script/Deploy.s.sol` — Deployment Script

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Kingdom.sol";

contract DeployKingdom is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        Kingdom kingdom = new Kingdom();
        console.log("Kingdom deployed at:", address(kingdom));

        vm.stopBroadcast();
    }
}
```

### 4. `contracts/script/FundWallets.s.sol` — Demo wallet funder

Script to send testnet ETH to 3 demo wallets for the live demo.

### 5. `contracts/script/DemoSetup.s.sol` — Demo state seeder

Script that buys tiles for demo wallets, builds some farms/castles, so the demo starts from an interesting state.

### 6. Deployment Config Files

- `contracts/.env.example` — Template for PRIVATE_KEY, RPC_URL, ETHERSCAN_API_KEY
- Update `contracts/foundry.toml` with:
  - Testnet RPC URLs
  - Etherscan verification config
  - Optimizer settings (200 runs)
  - Solidity version 0.8.20+

### 7. `contracts/Makefile` — Convenience commands

```makefile
deploy-amoy:
	forge script script/Deploy.s.sol --rpc-url $(AMOY_RPC) --broadcast --verify

deploy-base-sepolia:
	forge script script/Deploy.s.sol --rpc-url $(BASE_SEPOLIA_RPC) --broadcast --verify

test:
	forge test -vvv

test-gas:
	forge test --gas-report

fund-demo:
	forge script script/FundWallets.s.sol --rpc-url $(RPC_URL) --broadcast

seed-demo:
	forge script script/DemoSetup.s.sol --rpc-url $(RPC_URL) --broadcast
```

### 8. ABI Export

After compilation, export the ABI to a shared location the frontend agents can consume:

```bash
# After forge build:
cp out/Kingdom.sol/Kingdom.json ../frontend/lib/abi/Kingdom.json
```

Create a small script `contracts/script/export-abi.sh` that does this.

## Testing Philosophy
- **Every public function** must have at least one positive and one negative test
- **Use `vm.warp`** liberally — time-dependent logic (farming, vote windows, war cooldown) must be tested
- **Use `vm.prank`** for multi-wallet scenarios
- **Use `vm.expectRevert`** for all failure cases
- **Gas snapshots** — run `forge snapshot` and include `.gas-snapshot` in the repo
- **The full game scenario test** should mirror the 2-minute demo script exactly

## Output Structure
```
contracts/
├── test/
│   ├── Kingdom.t.sol
│   └── helpers/
│       └── TestSetup.sol
├── script/
│   ├── Deploy.s.sol
│   ├── FundWallets.s.sol
│   ├── DemoSetup.s.sol
│   └── export-abi.sh
├── .env.example
├── Makefile
└── foundry.toml (updated)
```

## Interface Contracts
- **Input from Agent 01:** The compiled `Kingdom.sol` contract
- **Output to Agent 07:** The ABI JSON file at `frontend/lib/abi/Kingdom.json`
- **Output to Agent 15:** Deployed contract address + network config
- **Output to Agent 14:** Contract address for README

> Every test should pass with `forge test -vvv`. Use descriptive test names. Include gas report output.
