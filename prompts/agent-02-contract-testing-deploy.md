# Agent 02: Contract Testing & Deployment (Foundry & Polygon Amoy)

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-02.lock`
   - Update file `status/agent-02.json` with:
     ```json
     {
       "agentId": "agent-02",
       "name": "Contract Testing & Deploy",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Configuring foundry.toml and writing 3D parcel test suite...",
       "exclusiveFiles": [
         "contracts/foundry.toml",
         "contracts/test/SovereignLands.t.sol",
         "contracts/test/SpatialQuery.t.sol",
         "contracts/script/Deploy.s.sol",
         "contracts/script/SeedWorldParcels.s.sol",
         "contracts/Makefile",
         "contracts/.env.example"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY:
   - `contracts/foundry.toml`
   - `contracts/test/**`
   - `contracts/script/**`
   - `contracts/Makefile`
   - `contracts/.env.example`
   - `status/agent-02.json`
   - `status/agent-02.lock`
   ⚠️ **DO NOT TOUCH** `contracts/src/**` (Agent 01 owns contracts) or `frontend/**`.

3. **PARALLEL INDEPENDENCE (STUB RULE)**:
   If Agent 01 has not finished writing `contracts/src/SovereignLands.sol` when you start, create a minimal mock contract in your test file or compile against the interface `contracts/src/ISovereignLands.sol`.

4. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-02.lock`
   - Update `status/agent-02.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead Smart Contract QA & DevOps Engineer**. You write comprehensive Foundry tests for `SovereignLands.sol`, test the 3D bounding-box spatial queries, and prepare production deployment scripts for **Polygon Amoy** and **Base Sepolia**.

## Key Deliverables

### 1. `contracts/foundry.toml`
Configure Solidity 0.8.20+, optimizer (200 runs), testnet RPC endpoints, Etherscan API keys, and test timeouts.

### 2. `contracts/test/SovereignLands.t.sol`
Critical path tests verifying:
- Buying 3D parcels at specific `(X, Z)` coordinates.
- Correct kingdom attribution: North for `Z < 0`, South for `Z > 0`.
- Constructing structures: Farmstead, GuardTower, StoneWall, CastleKeep.
- Resource generation: `claimGold()` with 10% kingdom treasury tithe.
- Governance proposal creation, quorum checking (20%), weighted voting.
- Deterministic war resolution between North and South.

### 3. `contracts/test/SpatialQuery.t.sol`
Tests the spatial bounding box queries (`getParcelsInBounds`) ensuring the 3D game engine can accurately query nearby plots within player view distance.

### 4. `contracts/script/Deploy.s.sol`
Production deployment script with broadcast to Polygon Amoy testnet. Logs deployed contract address.

### 5. `contracts/script/SeedWorldParcels.s.sol`
Initializes 100 default 3D world parcels across the North and South territories with realistic landscape coordinates. Pre-funds demo accounts so the 3D world is immediately populated upon first login.

### 6. `contracts/Makefile` & `.env.example`
One-command recipes: `make test`, `make deploy-amoy`, `make seed-world`.
