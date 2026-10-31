# Changelog

All notable changes to the **Sovereign Lands** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-31

### Added
- **Core ERC-721 Spatial Smart Contracts (`SovereignLands.sol`)**:
  - Full ERC-721 enumerable and metadata implementation for spatial land parcel deeds.
  - On-chain spatial coordinate registration via `buyParcelWithBounds(uint256 parcelId, int32 minX, int32 minZ, int32 maxX, int32 maxZ)`.
  - In-world structure upgrades (`buildStructure(uint256 parcelId, StructureType structure)`) with on-chain trait verification.
  - Continuous gold yield calculation based on structure tiers (Farmsteads, Mills, Barracks, Citadels) with on-chain claim mechanics (`claimGold(uint256 parcelId)`).
  - Kingdom Treasury system allocating parcel purchase fees (70% to kingdom treasury, 20% to public infrastructure pool, 10% burn/dev reserve).
  - Decentralized Council War & Governance voting (`castWarVote(uint8 kingdomId, bool declareWar)`) with quorum calculation based on parcel ownership weight.
  - Automated deployment scripts (`Deploy.s.sol`) and genesis seeding (`SeedWorldParcels.s.sol`) for Polygon Amoy (Chain ID 80002) and Base Sepolia (Chain ID 84532).
  - Exhaustive test suite (`SovereignLands.t.sol`, `SpatialQuery.t.sol`) achieving 100% test coverage with Foundry.

- **3D Engine, Rapier Physics & Third-Person Camera**:
  - Next.js 14 App Router paired with React Three Fiber (`@react-three/fiber`) and Three.js `0.165`.
  - Fixed-timestep Rapier 3D physics integration (`@react-three/rapier`) utilizing `CapsuleCollider` for characters and `HeightfieldCollider` / `TrimeshCollider` for complex terrain.
  - Over-the-shoulder GTA-style camera (`ThirdPersonCamera.tsx`) featuring smooth spring-arm damping, raycast camera collision avoidance, spherical pitch/yaw coordinate math, and mouse pointer-lock controls.
  - Tactile character locomotion controller (`PlayerController.tsx`, `useCharacterControls.ts`) supporting 8-directional WASD movement, sprint toggling (`Shift`), jump impulse (`Space`), and slope deceleration.

- **Procedural 3D Asset Pipeline (`proceduralModels.ts`, `modelRegistry.ts`)**:
  - High-performance, low-poly procedural geometries eliminating external binary download bottlenecks.
  - Articulated character models with hierarchically attached limbs, heads, helmets, breastplates, and tabards supporting smooth sine-wave walk/run cycle kinematics.
  - Full modular building catalog:
    - *Farmstead*: Wood-timber cottage with stone foundation, pitched thatch roof, and working waterwheel.
    - *Lumber Mill*: Timber cutting station with stacked logs and circular saw mechanism.
    - *Guard Tower*: Crenellated stone battlement with iron torches and archer slits.
    - *Barracks*: Sturdy military garrison with weapon racks, shield crests, and training dummies.
    - *Stronghold*: Multi-story fortified keep with reinforced portcullis.
    - *Citadel Keep*: Majestic palace featuring royal banners, grand staircases, and the Citadel War Council chamber.
  - Environmental foliage assets (pine trees, northern birch, southern golden oak, boulders, shrubs, campfire props).

- **Expansive Open-World Terrain & Water System**:
  - Continuous 500m x 500m procedural terrain mesh (`OpenWorldTerrain.tsx`) with dynamic dual-biome gradient:
    - *Kingdom of Boreal (North)*: Dark granite crags, snow-dusted slate, alpine pines, cold cyan ambient lighting.
    - *Kingdom of Solara (South)*: Golden meadows, fertile soil, sunlit oaks, warm amber ambient lighting.
  - Animated river mesh (`WaterRiver.tsx`) representing the historic *Great Divide* with custom vertex wave animation, flow direction, and stone riverbank foam.
  - Monumental stone bridge spanning the Great Divide connecting North and South realms.
  - Glowing parcel boundary pillars (`ParcelBoundaryRenderer.tsx`) projecting neon volumetric borders with dynamic ownership state shaders (unclaimed gold, friendly cyan, hostile crimson).

- **Holographic In-World Construction Engine (`useBuildingPlacement.ts`, `HologramBuildPreview.tsx`)**:
  - Real-time build mode toggled via `[C]` key.
  - Floating 3D holographic projection of the active structure snapping to terrain height and parcel bounds.
  - Real-time spatial validation: green translucent hologram when inside owned parcel boundaries with zero collisions; red translucent hologram when invalid or overlapping.
  - Direct integration with smart contract `buildStructure` transaction dispatch.

- **Bring-Your-Own-AI (BYOAI) Architecture (`ai-system/providers`)**:
  - Zero-backend, client-side privacy architecture: user API keys never leave the browser.
  - Encrypted `KeyVault.ts` storing keys in browser `localStorage`.
  - Multi-provider LLM adapters supporting:
    - **OpenAI**: GPT-4o, GPT-4o-mini
    - **Google Gemini**: Gemini 1.5 Pro, Gemini 1.5 Flash
    - **Anthropic**: Claude 3.5 Sonnet, Claude 3 Haiku
    - **Ollama**: Local offline inference (`http://localhost:11434`)
    - **Custom OpenAI-compatible**: Any self-hosted vLLM or LM Studio endpoint.
  - In-game settings modal (`AISettingsModal.tsx`) and HUD indicator (`AIStatusBadge.tsx`) with real-time ping and token rate-limiting safeguards.

- **Autonomous Living NPCs & Real-Time Dialogue Engine (`ai-system/npc-engine`)**:
  - State-machine driven NPC controllers with wander, patrol, idle, and talk states.
  - Spatial perception field with 5-meter proximity trigger and smooth turn-to-face rotation toward the player.
  - Roster of historical characters:
    - *Aldric the Northern Farmer*: Weather-beaten Boreal yeoman knowledgeable in agriculture, harvest cycles, and regional rumors.
    - *Sir Gareth the Iron Vanguard*: Disciplined Boreal border knight guarding the Great Divide bridge.
    - *Lady Lyra of the Gilded Leaf*: Solara merchant guild delegate specializing in trade economics.
    - *Raymond Vance*: Grand Master of Arms and Citadel military advisor.
  - In-world 3D billboard speech bubbles (`FloatingSpeechBubble.tsx`) displaying contextual barks when players walk past.
  - High-fidelity RPG dialogue modal (`DialogueHUD.tsx`) supporting streaming LLM responses, custom player input, and lore-grounded system prompts.

- **Citadel War Table & Tactical War Simulator (`ai-system/strategy`, `WarTableEntity.tsx`)**:
  - Interactive 3D furniture entity inside North and South Citadel Keeps.
  - Ethereal floating holographic mini-replica of the Sovereign continent hovering over the war table.
  - Full-screen strategic command HUD (`TacticalOverlayHUD.tsx`) accessible via `[M]` or interacting with the War Table (`[E]`).
  - Real-time balance of power analysis, territorial conquest percentages, and AI military outcome predictions.

- **GTA-Style Navigation HUD & Onboarding Quest System (`frontend/src/components/minimap`)**:
  - Rotating circular radar mini-map (`RadarMiniMap.tsx`) anchored at bottom-left with player arrow, view cone, terrain contours, parcel boundaries, and NPC blips.
  - Horizontal compass tape (`CompassHeading.tsx`) fixed at top-center showing cardinal directions and objective icons.
  - Step-by-step onboarding mission tracker (`QuestObjectiveHUD.tsx`) guiding players through:
    1. *The Claim*: Discover the frontier and buy an initial parcel with `[B]`.
    2. *Harvest & Tithe*: Erect a Farmstead with `[C]` and claim gold yield with `[E]`.
    3. *Council of War*: Travel to the Citadel Keep, review the War Table, and vote on kingdom policy.
  - Top resource HUD (`TopResourceHUD.tsx`) tracking Gold Treasury, Realm Status, Connected Wallet, and Amoy Network status.
  - Notification toast system (`TransactionToast.tsx`) displaying interactive Polygon Amoy block explorer transaction links.

- **Comprehensive Documentation & World Bible**:
  - `docs/technical/3d-engine-architecture.md`: Engine loop, physics sync, and state pipeline.
  - `docs/technical/spatial-coordinate-spec.md`: Coordinate system, bounding boxes, and quantization.
  - `docs/technical/webgl-performance-budget.md`: Draw call budgets (< 120), polygon ceilings (< 150k), and texture VRAM constraints (< 45MB).
  - `docs/technical/byoai-integration-protocol.md`: Client-side inference security and latency optimizations.
  - `docs/technical/smart-contract-spatial-api.md`: Solidity spatial indexing and ABI guide.
  - `docs/lore/realm-history.md`: Complete history of the Sovereign continent and the Great Divide.
  - `docs/lore/factions-and-heraldry.md`: Cultural profiles of Kingdom of Boreal and Kingdom of Solara.
  - `docs/guide/players-field-manual.md` & `controls-reference.md`: Comprehensive gameplay and wallet setup manual.
  - `docs/presentation/3d-trailer-script.md`: Cinematic 2-minute GTA-style gameplay trailer script.
  - `docs/presentation/investor-pitch-deck.md`: 12-slide executive investment thesis and market analysis.
  - `docs/presentation/social-announcement.md`: Multi-channel launch campaign (Twitter/X, Discord, Show HN, Reddit).

---

[1.0.0]: https://github.com/Aninda7479/Sovereign_Lands/releases/tag/v1.0.0
