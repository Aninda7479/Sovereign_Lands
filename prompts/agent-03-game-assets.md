# Agent 03: 3D Asset Pipeline & Low-Poly Models (Three.js / GLTF)

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-03.lock`
   - Update file `status/agent-03.json` with:
     ```json
     {
       "agentId": "agent-03",
       "name": "3D Asset Pipeline & Models",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Generating 3D model loaders, procedural fallback meshes, and textures...",
       "exclusiveFiles": [
         "frontend/public/models/**",
         "frontend/public/textures/**",
         "frontend/src/lib/assets/modelRegistry.ts",
         "frontend/src/lib/assets/proceduralModels.ts"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY:
   - `frontend/public/models/**`
   - `frontend/public/textures/**`
   - `frontend/src/lib/assets/**`
   - `status/agent-03.json`
   - `status/agent-03.lock`
   ⚠️ **DO NOT TOUCH** `frontend/src/components/**` or `frontend/src/app/**`.

3. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-03.lock`
   - Update `status/agent-03.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead 3D Game Artist & Asset Engineer**. You create the 3D low-poly models, material shaders, textures, and procedural geometric fallbacks for the 3D open-world Sovereign Lands game.

## Visual Aesthetic
Low-poly medieval fantasy (inspired by *Valheim*, *Runescape 3D*, and low-poly GTA mods).
- Optimized for smooth 60 FPS in WebGL browsers.
- Warm, stylized textures with baked ambient occlusion and vertex colors.
- Color coding: North (cobblestone, slate blue, snow accents) vs South (terracotta, sandstone, crimson banners).

## Key Deliverables

### 1. `frontend/src/lib/assets/proceduralModels.ts`
High-performance procedural Three.js component meshes that load instantly with zero external network lag:
- **`CharacterMesh`**: Stylized medieval hero model with head, body, arms, legs, and a back-mounted sheath.
- **`NPCFarmerMesh`**: Villager tunic, straw hat, wooden hoe.
- **`NPCKnightMesh`**: Plate armor, horned helmet, tower shield, longsword.
- **`NPCAdvisorMesh`**: Robed scholar with hood and ancient scroll.
- **`FarmsteadModel`**: Thatched-roof cottage, wooden fences, tilled soil beds, animated windmill blades.
- **`GuardTowerModel`**: Multi-tiered stone watchtower with battlements and flaming torch brazier.
- **`StoneWallModel`**: Heavy stone defensive curtain wall segment with crenellations.
- **`CastleKeepModel`**: Majestic fortress with twin gatehouses and kingdom faction banner.
- **`BoundaryPillarModel`**: Glowing rune-engraved pillar marking 3D parcel corners (Blue for North, Red for South, Gold for Player-owned).

### 2. `frontend/src/lib/assets/modelRegistry.ts`
Central registry mapping structure types and NPC roles to GLTF URLs with automatic fallback to procedural meshes if the GLTF file is not yet cached.

### 3. Textures & Shaders (`frontend/public/textures/`)
- Terrain ground textures: grass, cobblestone, riverbank sand, dirt path, snow.
- Water normal map for realistic flowing river effects across the Great Divide.
- Glow texture for parcel boundaries and loot particle effects.
