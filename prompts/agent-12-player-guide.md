# Agent 12: GTA-Style Onboarding Quest & 3D Radar Mini-Map

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-12.lock`
   - Update file `status/agent-12.json` with:
     ```json
     {
       "agentId": "agent-12",
       "name": "GTA-Style Quest & Mini-Map",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Building circular radar mini-map, compass tape, and mission objectives HUD...",
       "exclusiveFiles": [
         "frontend/src/components/minimap/RadarMiniMap.tsx",
         "frontend/src/components/minimap/CompassHeading.tsx",
         "frontend/src/components/minimap/QuestObjectiveHUD.tsx",
         "docs/guide/players-field-manual.md",
         "docs/guide/controls-reference.md"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the files in `exclusiveFiles`.
   ⚠️ **DO NOT TOUCH** `frontend/src/components/canvas/**` or `frontend/src/app/**`.

3. **ATOMIC GIT COMMIT & ONLINE SYNC (MANDATORY AFTER EVERY FILE/TASK)**:
   After creating or editing any file in your jurisdiction, you MUST immediately record a commit and push it online to GitHub:
   ```bash
   node scripts/agent-git.js agent-12 "Created or updated [filename]" [filepath]
   ```
   *Note: This script safely handles concurrent git locks, rebases with parallel agents, and pushes directly to GitHub so any file can be rolled back if an error occurs.*

4. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-12.lock`
   - Update `status/agent-12.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead Player Experience & Navigation Designer**. You build the iconic **GTA-style circular radar mini-map**, compass heading tape, and the interactive onboarding mission sequence that teaches new players how to explore, buy land, build, and interact in the 3D world.

## Key Deliverables

### 1. `frontend/src/components/minimap/RadarMiniMap.tsx`
Circular radar HUD anchored to the bottom-left of the screen (GTA style):
- Rotates dynamically with player camera heading.
- Displays terrain boundaries and the Great Divide river.
- **Blips & Icons**:
  - 🟡 Player icon with view cone.
  - 🔵 North Kingdom parcels & Citadel.
  - 🔴 South Kingdom parcels & Citadel.
  - 🟢 NPC markers (Aldric, Sir Gareth, etc.).
  - 🌟 Active quest waypoint blip.

### 2. `frontend/src/components/minimap/CompassHeading.tsx`
Minimalist compass tape at the top center of the screen indicating North (N), South (S), East (E), West (W), and objective markers.

### 3. `frontend/src/components/minimap/QuestObjectiveHUD.tsx`
GTA-style mission tracker in the top-left:
- **Mission 1: The Claim**: *"Travel to the frontier and claim your first 3D parcel with `[B]`."*
- **Mission 2: Harvest & Tithe**: *"Press `[C]` to construct a Farmstead, then harvest your first gold with `[E]`."*
- **Mission 3: Council of War**: *"Enter the Citadel, speak with the Royal Advisor, and cast your vote on the realm decree."*

### 4. `docs/guide/players-field-manual.md` & `controls-reference.md`
- Comprehensive how-to-play guide explaining 3D controls (`WASD`, `Shift`, `Space`, `E`, `C`, `B`, `V`).
- Guide to Polygon Amoy testnet ETH faucets and MetaMask setup.
