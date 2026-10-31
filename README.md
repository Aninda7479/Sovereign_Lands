# 🏰 Sovereign Lands — 3D Third-Person Open-World Kingdom (GTA-Style Web3 Sandbox)

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.0-black?logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.165-blue?logo=three.js)](https://threejs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-8.16.0-black)](https://docs.pmnd.rs/react-three-fiber/)
[![Rapier 3D](https://img.shields.io/badge/Rapier_Physics-1.4.0-orange)](https://rapier.rs/)
[![Polygon Amoy](https://img.shields.io/badge/Polygon-Amoy_Testnet_(80002)-8247e5?logo=polygon)](https://amoy.polygonscan.com/)
[![BYOAI](https://img.shields.io/badge/AI-Bring--Your--Own--AI-success)](docs/technical/byoai-integration-protocol.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> *"Walk the streets of a living medieval realm. Own 3D land parcels as NFTs, construct strongholds in real-time, speak with roaming AI NPCs powered by your own API key, and battle for kingdom sovereignty — running 100% in your browser."*

---

## 🌟 The Hook

**Sovereign Lands** is an open-world medieval Web3 sandbox combining the visceral, tactile feel of a third-person action game (GTA-style camera, physics-driven character locomotion, real-time building) with true on-chain spatial land deeds and client-side autonomous AI inhabitants.

Forget 60GB client downloads, clunky point-and-click metaverses, and lifeless ghost towns. Sovereign Lands renders a continuous dual-biome continent at **60 FPS in Google Chrome, Brave, and Edge** in under two seconds.

```
       /\
      /  \        BOREAL REALM (NORTH)
     / /\ \       Frostfang Citadel • Slate Blue Banners • Stone Forges
    / /  \ \      ======================================================
   / /    \ \               THE GREAT DIVIDE RIVER & BRIDGE
  /_/      \_\    ======================================================
    \  |  /       SOLARA REALM (SOUTH)
   -- (O) --      Solara Keep • Crimson & Gold Banners • Fertile Plains
    /  |  \
```

---

## 🎮 Key Features

### 1. GTA-Style Third-Person Locomotion & Camera
- **Dynamic Spring-Arm Camera**: Over-the-shoulder third-person camera that raycasts against world geometry, preventing annoying wall clipping and providing responsive mouse-look steering (`PointerLock`).
- **Rapier 3D Physics Integration**: Fixed 60Hz physics stepping using `@react-three/rapier` with capsule collider locomotion, responsive sprint toggles (`[Shift]`), dynamic jump impulses (`[Space]`), and natural slope deceleration.

### 2. Seamless 3D Dual-Biome Open World
- **500m x 500m Continuous Landscape**: Procedural terrain transitioning smoothly from the frosted taiga and granite crags of **Frostfang** in the North to the sunlit meadows and fertile farmland of **Solara** in the South.
- **The Great Divide**: An animated river mesh with procedural vertex foam and stone rapids crossed by a monumental stone highway bridge.
- **Glowing Parcel Boundary Pillars**: In-world neon perimeter pillars projecting boundary wireframes directly onto the terrain with dynamic color states (unclaimed gold, owned cyan, hostile red).

### 3. Bring-Your-Own-AI (BYOAI) Autonomous NPCs
- **Zero Cloud GPU Costs & 100% Privacy**: API keys never leave your browser. All inference happens directly from the client via encrypted `localStorage` storage.
- **Multi-Provider Support**: Seamlessly toggle between:
  - **OpenAI**: GPT-4o, GPT-4o-mini
  - **Google Gemini**: Gemini 1.5 Pro, Gemini 1.5 Flash
  - **Anthropic Claude**: Claude 3.5 Sonnet, Claude 3 Haiku
  - **Local Ollama**: 100% offline local inference (`http://localhost:11434`)
  - **Custom Endpoints**: Any OpenAI-compatible vLLM or LM Studio local model.
- **Living Personalities**: Roaming NPCs with spatial awareness and 5-meter proximity turn-to-face behaviors:
  - **Sir Gareth the Iron Vanguard**: Disciplined border knight guarding the Great Divide bridge.
  - **Farmer Aldric**: Hardened northern yeoman offering advice on crops and kingdom rumors.
  - **Grand Master Raymond Vance**: Citadel military advisor plotting realm defensive strategies.

### 4. In-World Holographic Construction Engine
- **Real-Time Building (`[C]`)**: Tap `[C]` to enter construction mode. A floating 3D holographic wireframe of the structure snaps to the terrain elevation and follows your cursor.
- **Spatial Validation**: Translucent green when safely within your owned parcel bounds; red when crossing property lines or overlapping terrain obstacles.
- **Instant Deployment**: Click to construct Farmsteads, Lumber Mills, Guard Towers, Barracks, and Citadels that immediately collide with the physics engine and begin streaming passive gold yield into your treasury.

### 5. On-Chain Spatial Deeds & Kingdom Economy
- **ERC-721 Spatial NFTs**: Verified smart contracts deployed on **Polygon Amoy Testnet (Chain ID 80002)** and **Base Sepolia (Chain ID 84532)** storing precise 2D Cartesian boundaries (`minX`, `minZ`, `maxX`, `maxZ`).
- **Passive Gold Generation**: Claim real-time accrued gold (`claimGold`) based on your constructed buildings.
- **Citadel Council & War Voting**: Landholders hold parcel-weighted voting rights inside the Citadel Keep to enact realm tax rates and issue war declarations.

### 6. Citadel War Table & Tactical Strategy HUD
- **3D War Table Furniture Entity**: Walk into the Citadel Keep and examine the ancient carved oak table.
- **Levitating Hologram Projection**: An ethereal 3D mini-replica of the realm hovers above the table displaying troop garrisons, contested borders, and kingdom power balance percentages.
- **AI War Outcome Predictor**: Consult the AI military strategist to simulate hypothetical battle outcomes between North and South.

### 7. GTA-Style Navigation HUD & Onboarding Quests
- **Rotating Circular Radar Mini-Map**: Bottom-left radar rotates in real-time with your camera heading, displaying terrain contours, parcel boundaries, and NPC blips.
- **Compass Heading Tape**: Top-center ribbon showing cardinal directions (`N`, `S`, `E`, `W`) and active quest waypoints.
- **Interactive Mission Tracker**: Top-left quest tracker guiding players through their first land claim, building placement, gold harvest, and Citadel war vote.

---

## 🕹️ Controls & Keybindings Reference

| Key / Input | Action | Description |
| :---: | :--- | :--- |
| `W`, `A`, `S`, `D` | **Movement** | 8-directional character walking. |
| `Shift` (Hold) | **Sprint** | Increases movement velocity from 4.0 m/s to 8.5 m/s. |
| `Space` | **Jump** | Vertical impulse applying Rapier physics velocity jump. |
| `Mouse Look` | **Camera Yaw / Pitch** | Orbits over-the-shoulder camera (click canvas to lock pointer). |
| `[B]` | **Claim Parcel** | Opens Web3 deed claim prompt for current spatial coordinate. |
| `[C]` | **Construction Mode** | Toggles 3D holographic structure placement preview. |
| `[R]` | **Rotate Hologram** | Rotates active building hologram 90 degrees during build mode. |
| `[E]` | **Interact / Talk / Harvest** | Talks to nearby NPCs, examines War Table, or harvests parcel gold. |
| `[M]` | **Tactical War Map** | Toggles full-screen aerial 3D kingdom tactical overlay HUD. |
| `[Esc]` | **Settings / Release** | Unlocks mouse pointer and opens BYOAI / Game Settings modal. |

---

## 🏗️ Architecture Overview

Sovereign Lands is engineered as a zero-backend, client-first architecture where the client browser orchestrates 3D rendering, physics simulation, decentralized Web3 contracts, and private AI inference:

```
+---------------------------------------------------------------------------------------+
|                                    BROWSER CLIENT                                     |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   +------------------------------------+    +-------------------------------------+   |
|   |         PRESENTATION LAYER         |    |            3D ENGINE LOOP           |   |
|   |   Next.js 14 (App Router)          |    |   Three.js 0.165 + R3F (Canvas)     |   |
|   |   Tailwind CSS + Framer Motion     |    |   Rapier 3D Physics (Fixed 60Hz)    |   |
|   |   GTA Radar Mini-Map & HUD         |    |   Spring-Arm ThirdPersonCamera      |   |
|   +------------------------------------+    +-------------------------------------+   |
|                     |                                          |                      |
|                     v                                          v                      |
|   +------------------------------------+    +-------------------------------------+   |
|   |      BYOAI CLIENT KEY VAULT        |    |          WEB3 CONTRACT LAYER        |   |
|   |   Encrypted LocalStorage           |    |   Wagmi v2 + Viem 2.13              |   |
|   |   OpenAI / Gemini / Claude Adapters|    |   Polygon Amoy Testnet (80002)      |   |
|   |   Local Ollama (11434) Direct Fetch|    |   ERC-721 Spatial Land Deeds        |   |
|   +------------------------------------+    +-------------------------------------+   |
|                                                                                       |
+---------------------------------------------------------------------------------------+
                     |                                           |
                     v                                           v
       +----------------------------+             +-------------------------------+
       |   DECENTRALIZED LLM APIS   |             |     POLYGON AMOY BLOCKCHAIN   |
       |  (User Private API Keys)   |             |   0x49F27E9F8Bcf593744...     |
       +----------------------------+             +-------------------------------+
```

---

## ⛓️ Smart Contracts & Deployed Addresses

The core contracts are written in gas-optimized Solidity (`0.8.24`) using Foundry:

| Network | Chain ID | Contract Address | Explorer Link |
| :--- | :---: | :--- | :--- |
| **Polygon Amoy Testnet** | `80002` | `0x49F27E9F8Bcf5937446543D0A3bA84c8a514d246` | [View on Polygonscan](https://amoy.polygonscan.com/address/0x49F27E9F8Bcf5937446543D0A3bA84c8a514d246) |
| **Base Sepolia Testnet** | `84532` | `0x99A3142718E29bcFa54641c2f90918D16812Fa90` | [View on Basescan](https://sepolia.basescan.org/address/0x99A3142718E29bcFa54641c2f90918D16812Fa90) |
| **Local Anvil / Hardhat** | `31337` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | Local RPC (`http://127.0.0.1:8545`) |

### Core Contract Capabilities:
- `buyParcelWithBounds(uint256 parcelId, int32 minX, int32 minZ, int32 maxX, int32 maxZ)`: Mints ERC-721 spatial parcel deeds with validated coordinate dimensions.
- `buildStructure(uint256 parcelId, uint8 structureType)`: Upgrades parcel infrastructure to Farmstead, Lumber Mill, Guard Tower, Barracks, Stronghold, or Citadel.
- `claimGold(uint256 parcelId)`: Streams continuous passive gold yields based on accumulated block timestamps and structure tiers.
- `castWarVote(uint8 kingdomId, bool declareWar)`: Records parcel-weighted governance consensus for kingdom war mobilization.

---

## ⚡ Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 18.17.0` (Recommended: Node 20 LTS)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- *(Optional for contracts)*: [Foundry](https://book.getfoundry.sh/) (`forge`, `anvil`, `cast`)

### 1. Clone the Repository
```bash
git clone https://github.com/Aninda7479/Sovereign_Lands.git
cd Sovereign_Lands
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_DEFAULT_CHAIN_ID=80002
NEXT_PUBLIC_SOVEREIGN_LANDS_AMOY=0x49F27E9F8Bcf5937446543D0A3bA84c8a514d246
NEXT_PUBLIC_SOVEREIGN_LANDS_BASE=0x99A3142718E29bcFa54641c2f90918D16812Fa90
```

### 4. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```
Click inside the 3D viewport to lock your mouse pointer, and use `WASD` to begin exploring!

### 5. (Optional) Run Smart Contract Tests with Foundry
```bash
cd ../contracts
forge test -vvv
```

---

## 🤖 Bring-Your-Own-AI (BYOAI) Setup

Sovereign Lands lets you converse with living NPCs using your personal LLM keys:

1. Launch the game and press `[Esc]` to open the in-game Settings.
2. Navigate to the **AI Connection Hub** tab.
3. Select your preferred provider:
   - **Google Gemini**: Enter your free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
   - **OpenAI**: Enter your `sk-...` API key from [platform.openai.com](https://platform.openai.com/).
   - **Anthropic Claude**: Enter your Claude API key from [console.anthropic.com](https://console.anthropic.com/).
   - **Ollama (100% Offline)**: Run `ollama run llama3` locally and set the endpoint to `http://localhost:11434`.
4. Click **Save & Test Connection**. The status badge in your HUD will glow green `🟢 AI Brain: Active`.
5. Walk up to **Sir Gareth** on the bridge or **Farmer Aldric** and tap `[E]` to converse!

---

## 📁 Repository Structure

```
Sovereign_Lands/
├── README.md                           # Master Project Documentation & Quickstart
├── CHANGELOG.md                        # SemVer Release Notes
├── LICENSE                             # MIT Open Source License
├── contracts/                          # Foundry Smart Contract Suite
│   ├── src/
│   │   ├── SovereignLands.sol          # Main ERC-721 Spatial Contract & Economy
│   │   ├── ISovereignLands.sol         # Public Interface Specification
│   │   └── Types.sol                   # Enums, Structs & Spatial Bounding Boxes
│   ├── script/
│   │   ├── Deploy.s.sol                # Deployment Script for Polygon Amoy
│   │   └── SeedWorldParcels.s.sol      # Genesis Parcel Seeding Script
│   └── test/
│       ├── SovereignLands.t.sol        # Contract Integration Tests
│       └── SpatialQuery.t.sol          # Bounding Box Overlap & Gas Tests
├── frontend/                           # Next.js 14 WebGL Game Client
│   ├── package.json                    # Dependencies (Three.js, R3F, Rapier, Wagmi)
│   └── src/
│       ├── app/                        # Next.js App Router (Layout & Global Styles)
│       ├── components/
│       │   ├── character/              # PlayerController, 3rd-Person Camera, Rigs
│       │   ├── world/                  # Terrain, Water, Boundaries, Hologram Preview
│       │   ├── minimap/                # GTA Radar Mini-Map, Compass, Quest HUD
│       │   ├── npc-dialogue/           # Living NPC Entities, Bubbles, Dialogue HUD
│       │   ├── tactical-map/           # Citadel War Table & Strategic Overlay HUD
│       │   └── web3-hud/               # Resource Bar, Council Modal, Tx Toasts
│       ├── hooks/                      # Character Controls, Building, Web3 Hooks
│       └── lib/
│           ├── assets/                 # Procedural 3D Mesh Generator & Catalog
│           ├── physics/                # Rapier Kinematic Character Physics
│           ├── web3/                   # Contract ABIs, Addresses, Wagmi Config
│           └── world/                  # Spatial Coordinate Math & Bounding Boxes
├── docs/                               # Comprehensive Technical & Lore Docs
│   ├── presentation/                   # Trailer Script, Pitch Deck, Social Campaign
│   │   ├── 3d-trailer-script.md        # 2-Minute Cinematic Trailer Walkthrough
│   │   ├── investor-pitch-deck.md      # 12-Slide Executive Investment Deck
│   │   └── social-announcement.md      # Multi-Channel Launch Copy (X, Reddit, HN)
│   ├── technical/                      # 3D Architecture, Spatial API, WebGL Budgets
│   ├── lore/                           # Realm History, Factions, NPC Bibles
│   └── guide/                          # Player Field Manual & Controls Reference
├── prompts/                            # Agent System Prompts (1-17)
├── scripts/
│   └── agent-git.js                    # Thread-Safe Concurrent Multi-Agent Git Sync
└── status/                             # Real-Time Agent Lock & Status Registry
```

---

## 🎯 WebGL Performance Budget

To guarantee fluid 60 FPS gameplay on low-end laptops and mobile browsers, all 3D assets adhere to strict WebGL budgets:

- **Maximum Draw Calls**: `< 120` per frame (via procedural InstancedMesh geometries and texture atlasing).
- **Triangle Ceiling**: `< 150,000` visible triangles within the camera view frustum.
- **VRAM Footprint**: `< 45 MB` compressed texture and geometry buffer memory.
- **Draw Distance**: 250 meters with smooth exponential fog falloff.

---

## 🎬 Presentations & Media Assets

- 🎥 **Cinematic 3D Trailer Script**: [docs/presentation/3d-trailer-script.md](docs/presentation/3d-trailer-script.md)
- 📊 **Executive Investor Pitch Deck**: [docs/presentation/investor-pitch-deck.md](docs/presentation/investor-pitch-deck.md)
- 📢 **Social Launch & Press Kit**: [docs/presentation/social-announcement.md](docs/presentation/social-announcement.md)
- 📖 **Player's Field Manual**: [docs/guide/players-field-manual.md](docs/guide/players-field-manual.md)
- 🏰 **Realm Lore & Faction Bible**: [docs/lore/factions-and-heraldry.md](docs/lore/factions-and-heraldry.md)

---

## 🤝 Contributing

We welcome contributions from 3D graphics engineers, smart contract developers, game designers, and lore writers!
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/legendary-structure`).
3. Commit your changes (`git commit -m "feat: Add Trebuchet defensive structure"`).
4. Push to your branch (`git push origin feature/legendary-structure`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.

---

*🏰 Sovereign Lands — The Kingdom Decided This, Not a Server.*
