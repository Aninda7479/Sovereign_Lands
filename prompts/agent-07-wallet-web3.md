# Agent 07: 3D Web3 Interaction & In-World HUD

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-07.lock`
   - Update file `status/agent-07.json` with:
     ```json
     {
       "agentId": "agent-07",
       "name": "3D Web3 Interaction & In-World HUD",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Building in-world 3D interaction triggers, wagmi v2 hooks, and transaction HUD...",
       "exclusiveFiles": [
         "frontend/src/lib/web3/wagmiConfig.ts",
         "frontend/src/lib/web3/contractAddresses.ts",
         "frontend/src/hooks/web3/useParcelContract.ts",
         "frontend/src/hooks/web3/useKingdomTreasury.ts",
         "frontend/src/components/web3-hud/InteractionPrompt.tsx",
         "frontend/src/components/web3-hud/TopResourceHUD.tsx",
         "frontend/src/components/web3-hud/TransactionToast.tsx",
         "frontend/src/components/web3-hud/CitadelCouncilModal.tsx"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the files in `exclusiveFiles`.
   ⚠️ **DO NOT TOUCH** `frontend/src/components/canvas/**` or `frontend/src/app/**`.

3. **PARALLEL INDEPENDENCE (STUB RULE)**:
   Include a dummy contract address fallback in `contractAddresses.ts` so all hooks and HUD prompts run in mock preview mode when no wallet is connected.

4. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-07.lock`
   - Update `status/agent-07.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead Web3 & Gameplay HUD Engineer**. You build the seamless bridge between the player's 3D avatar position and blockchain transactions: in-world contextual action prompts (`[B] Buy Parcel`, `[E] Harvest Gold`, `[V] Vote in Citadel`), player gold/inventory HUD, and wagmi v2 contract hooks.

## Key Deliverables

### 1. `frontend/src/lib/web3/wagmiConfig.ts` & `contractAddresses.ts`
Wagmi v2 configuration for **Polygon Amoy** and **Base Sepolia** testnets, public RPC transports, and MetaMask injected connector.

### 2. `frontend/src/hooks/web3/useParcelContract.ts`
Contract interaction hooks for:
- `buyParcel(parcelId)` with payable value (0.01 testnet ETH).
- `buildStructure(parcelId, structureType)`.
- `claimGold()` to harvest from all owned farmsteads.
- Spatial parcel polling to update world state every 5 seconds.

### 3. `frontend/src/components/web3-hud/InteractionPrompt.tsx`
GTA-style in-world contextual prompt hovering in the bottom center of the screen when near an interactive zone:
- Near unowned parcel: `[B] Claim Parcel — 0.01 ETH`
- Near owned farmstead: `[E] Harvest Gold (+25 Gold Ready)`
- Inside Citadel Town Hall: `[V] Open Kingdom Council & Vote`

### 4. `frontend/src/components/web3-hud/TopResourceHUD.tsx`
Sleek, transparent top-bar overlay (GTA style):
- Player Gold balance (with animated coin increment).
- Owned parcels count.
- Current Kingdom badge (North Frostfang / South Sunspear).
- Realm Attack & Defense stats.
- Connected wallet pill with network indicator.

### 5. `frontend/src/components/web3-hud/CitadelCouncilModal.tsx`
In-depth governance interface opened when pressing `[V]` inside the kingdom citadel:
- View active proposal (Tax Rate, Treasury Payout, War Declaration).
- Vote YES / NO with weight equal to owned 3D parcels.
- War resolution countdown timer with live attack vs defense calculation.
