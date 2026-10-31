# Agent 06: 3D Open-World Terrain & In-World Construction Engine

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-06.lock`
   - Update file `status/agent-06.json` with:
     ```json
     {
       "agentId": "agent-06",
       "name": "3D Open-World Terrain & Construction",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Building 3D terrain mesh, parcel boundary renderer, and holographic construction mode...",
       "exclusiveFiles": [
         "frontend/src/components/world/OpenWorldTerrain.tsx",
         "frontend/src/components/world/ParcelBoundaryRenderer.tsx",
         "frontend/src/components/world/StructureManager.tsx",
         "frontend/src/components/world/HologramBuildPreview.tsx",
         "frontend/src/components/world/WaterRiver.tsx",
         "frontend/src/hooks/useBuildingPlacement.ts",
         "frontend/src/lib/world/parcelCoordinates.ts"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the files in `exclusiveFiles`.
   ⚠️ **DO NOT TOUCH** `frontend/src/components/character/**` (Agent 05) or `frontend/src/app/**`.

3. **ATOMIC GIT COMMIT & ONLINE SYNC (MANDATORY AFTER EVERY FILE/TASK)**:
   After creating or editing any file in your jurisdiction, you MUST immediately record a commit and push it online to GitHub:
   ```bash
   node scripts/agent-git.js agent-06 "Created or updated [filename]" [filepath]
   ```
   *Note: This script safely handles concurrent git locks, rebases with parallel agents, and pushes directly to GitHub so any file can be rolled back if an error occurs.*

4. **PARALLEL INDEPENDENCE (STUB RULE)**:
   If 3D structure models from Agent 03 are still building, render transparent geometric box holograms (green for valid placement, red for invalid) so your construction engine functions immediately.

5. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-06.lock`
   - Update `status/agent-06.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead 3D World Architect & Systems Engineer**. You construct the seamless open-world 3D terrain, render glowing parcel boundary pillars on the landscape, and build the in-world holographic construction system that lets players place buildings in real-time.

## Key Deliverables

### 1. `frontend/src/components/world/OpenWorldTerrain.tsx`
The expansive 3D continuous landscape:
- Terrain mesh with gentle hills, valleys, roads, and plateaus.
- Rapier physics `HeightfieldCollider` or `TrimeshCollider` so characters walk naturally over terrain slopes.
- North zone (`Z < 0`): dark stone, frost grass, pine trees, snow-capped peaks.
- South zone (`Z > 0`): golden grass, wheat patches, deciduous trees, sandy riverbanks.

### 2. `frontend/src/components/world/WaterRiver.tsx`
The Great Divide:
- Flowing river separating the North and South kingdoms (`Z = 0`).
- Great Stone Bridge connecting the two kingdoms.
- Animated water shader with reflective foam and surface ripples.

### 3. `frontend/src/components/world/ParcelBoundaryRenderer.tsx`
Renders 3D land plots on the landscape:
- Glowing corner runes/pillars for every parcel.
- Colored boundary lines on the terrain:
  - 🔵 Blue lines: North Kingdom parcels.
  - 🔴 Red lines: South Kingdom parcels.
  - 🟡 Golden beacon: Parcels owned by the connected player.
  - ⚪ Faint white pulse: Unclaimed parcels available for purchase.

### 4. `frontend/src/components/world/HologramBuildPreview.tsx` & `useBuildingPlacement.ts`
GTA / Rust style in-world building mode:
- Activated when the player presses `[C]` while standing on their owned parcel.
- Shows a glowing holographic 3D ghost preview of the selected structure (Farmstead, Guard Tower, Stone Wall, Castle Keep).
- Snaps to valid coordinates within the parcel bounding box.
- Turns green if valid and affordable, red if intersecting or out of bounds.
- Left-click confirms and triggers the smart contract build transaction.

### 5. `frontend/src/components/world/StructureManager.tsx`
Instanced mesh renderer displaying all constructed buildings across the world with LOD (Level of Detail) optimization for high frame rates.
