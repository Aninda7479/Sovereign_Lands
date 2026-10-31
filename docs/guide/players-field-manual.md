# Sovereign Lands: Player's Field Manual
### The Official Guide to Exploration, Warfare, and Sovereign Estate

> *"He who walks the Great Divide without a compass walks into an open grave. Know your heading, stake your soil, and let your stone walls speak for your honor."*  
> — **Sir Gareth, Vanguard of the Great Divide**

---

## 1. Welcome to Sovereign Lands

**Sovereign Lands** is a continuous 3D third-person open-world multiplayer sandbox bridging grand GTA-style exploration and urban traversal with high-medieval feudal warfare and on-chain decentralized land ownership. 

In this realm, you are not merely a visitor—you are a **Sovereign Lord**. Every parcel of land you claim is an indelible deed etched upon the blockchain ledger. Every farmstead, guard tower, and stone rampart you construct directly contributes to your kingdom's economic wealth and military fortification rating.

---

## 2. The Realm of Aethelgard: Factions & Geography

The world spans a massive 1,000m × 1,000m continuous 3D territory divided into two bitter rival kingdoms separated by a rushing mountain torrent:

```
+--------------------------------------------------------------------------+
|                       THE FROST MARCHES (NORTH)                          |
|  - Rugged alpine highlands, rocky cliffs, pine forests                   |
|  - Capital: North Citadel (High Keep at [0, -120])                       |
|  - NPC Residents: Aldric the Boreal Farmer, Merin the Royal Advisor      |
+--------------------------------------------------------------------------+
| ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ THE GREAT DIVIDE ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ |
|  - Rushing river channel running along Z = -20 to Z = +20                |
|  - The Great Bridge of Sir Gareth at X = 0, Z = 0                        |
|  - Contested frontier zone; site of skirmishes and border treaties       |
+--------------------------------------------------------------------------+
|                      THE SUNWARD REALM (SOUTH)                           |
|  - Rolling golden meadows, sunlit plateaus, fertile river valleys        |
|  - Capital: South Citadel (Sunward Fortress at [0, +120])                |
|  - NPC Residents: Zara the Frontier Trader, nomadic caravan merchants    |
+--------------------------------------------------------------------------+
```

---

## 3. Controls & Character Locomotion

Sovereign Lands employs an intuitive, responsive third-person camera and kinematic character controller driven by the Rapier physics engine:

### Locomotion & Stance
- `[W]`, `[A]`, `[S]`, `[D]` or Arrow Keys: Move forward, strafe left, move backward, strafe right (camera-relative).
- `[Left Shift]` / `[Right Shift]`: Sprint (increases locomotion speed from 4.5 m/s to 8.2 m/s; activates dynamic camera FOV expansion from 60° to 70°).
- `[Space]`: Jump over stone obstacles and irrigation furrows.

### Interaction & Building
- `[E]`: **Contextual Interaction**. Speak with nearby NPCs (within 5m), harvest gold from farmsteads, or inspect the Citadel War Table.
- `[C]`: **3D Construction Mode**. Toggles procedural architectural hologram projection for placing structures upon your claimed parcels.
- `[B]`: **Land Claim Mode**. Opens the parcel charter menu to buy and mint the 3D parcel beneath your feet.
- `[V]`: **Camera Perspective Toggle**. Shifts third-person camera orbit distance between close (2.5m), standard (5.2m), and cinematic distance (9.0m).

### Camera Orbit & Mouse Look
- **Left Click on Canvas**: Engages Pointer Lock for seamless mouse-look camera rotation.
- **Mouse Movement**: Orbits camera horizontally (Yaw) and vertically (Pitch). Pitch is clamped to prevent flipping or clipping below terrain.
- **Scroll Wheel**: Smoothly zooms camera distance between 1.6m and 10.0m.
- `[Esc]`: Releases mouse pointer lock to interact with UI buttons, radar controls, or quest menus.

---

## 4. The GTA-Style Navigation Suite

To navigate the vast continuous world of Sovereign Lands, your HUD features an integrated military reconnaissance suite:

### 4.1 Circular Radar Mini-Map (Bottom-Left)
Anchored to the lower-left corner of your view, the radar provides continuous spatial awareness:
- **Heading-Tracking Rotation**: By default, the world map rotates dynamically to match your camera yaw. Straight ahead on the radar is always the direction your character and camera face.
- **North-Up Mode**: Click the **`[CAM / N-UP]`** toggle to lock the map orientation with True North anchored to the top.
- **Dynamic Terrain & River**: Accurately shows the blue river channel of the Great Divide and the stone bridge causeway at X = 0.
- **Active Radar Blips**:
  - 🟡 **Player Indicator**: Centered chevron with a forward-projecting 60° vision cone.
  - 🔵 **North Citadel & Parcels**: Sky-blue fortress markers at `[0, -120]` and cold highland territories.
  - 🔴 **South Citadel & Parcels**: Crimson fortress markers at `[0, +120]` and southern plains.
  - 🟢 **Living NPCs**: Distinct badges for Aldric (`🌾`), Sir Gareth (`🛡️`), Merin (`📜`), and Zara (`💰`).
  - 🌟 **Quest Waypoint**: Golden star highlighting your current mission target.
- **Radar Clamping**: When an objective or citadel lies beyond the radar radius, its blip smoothly clamps to the outer circular perimeter with a directional pointer and distance readout (e.g., `185m`).
- **Telemetry Readout**: Shows current continuous `X` and `Z` world coordinates and selected zoom range (60m, 120m, or 240m).
- **Expand / Minimize**: Click the maximize button to expand the radar from compact (205px) to tactical surveillance size (310px).

### 4.2 Compass Heading Tape (Top-Center)
A sleek, minimalist horizontal bearing ribbon anchored at the top of your display:
- **Real-Time Bearing**: Displays numerical degrees (000° to 359°) and cardinal directions (`N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`).
- **Horizon POIs**: Pins Citadels, NPCs, and Quest Objectives onto the compass ribbon when they enter your forward field of view (110° FOV span).
- **Offscreen Guidance Chevrons**: Flashes directional indicators (`◄` or `►`) with meter distance when your active objective is outside your current line of sight.

### 4.3 Quest Objective HUD (Top-Left)
A GTA-style mission dossier tracking your sovereign ascension across three canonical onboarding missions:
1. **Mission I: The Claim**: Travel to the frontier and claim your first 3D parcel with `[B]`.
2. **Mission II: Harvest & Tithe**: Construct a Farmstead with `[C]`, reap gold yield with `[E]`, and tithe to the realm treasury.
3. **Mission III: Council of War**: Enter the Citadel, confer with Advisor Merin, and vote on the royal decree at the War Table.
- **Sound Synthesis**: Uses browser Web Audio for crisp objective chimes and glorious brass fanfare when you achieve **MISSION PASSED**.

---

## 5. Economy, Parcels, and Architectural Construction

Land in Sovereign Lands is divided into continuous spatial bounding boxes:
$$\text{Bounds} = [\min X, \min Z, \max X, \max Z]$$

### 5.1 Claiming Land (`[B]`)
1. Walk into an unclaimed frontier plot (boundaries glow white/amber on the ground).
2. Press `[B]` to inspect parcel coordinates and verify kingdom affiliation.
3. Sign the transaction via MetaMask to inscribe your Sovereign Deed onto the blockchain.

### 5.2 Constructing Structures (`[C]`)
Once you own a parcel, press `[C]` to open the 3D Construction hologram menu:
- **Farmstead (Cost: 50 Gold)**:
  - Generates continuous passive gold revenue from agricultural tithing.
  - Walk up to the silo and press `[E]` to harvest accrued gold.
- **Guard Tower (Cost: 100 Gold)**:
  - Grants **+15 Bastion Defense Rating** to your kingdom's military power.
  - Armed with automated archer sentries.
- **Stone Wall (Cost: 35 Gold)**:
  - Grants **+8 Defense Rating**; encloses your parcel boundary to prevent enemy incursions.
- **Castle Keep (Cost: 250 Gold)**:
  - Grants **+40 Defense Rating** and **+25 Vanguard Attack Rating**.
  - Serves as a forward staging bastion during kingdom warfare.

---

## 6. The Citadel, Royal Decrees, and Realm Warfare

At the heart of each kingdom stands a monumental Citadel:
- **The Royal Advisor (Merin)**: Analyzes treasury balances, council voting terms, and economic productivity.
- **The War Table**: An aerial holographic command projector displaying continuous territorial control, power balance meters, and deterministic siege battle simulations.
- **Royal Decrees**: Sovereign lords who own land hold voting weight in the Council DAO. Submit votes on decrees such as *Tax Rate Adjustments*, *Border Fortification Grants*, or *War Declarations*.

---

## 7. Web3 Setup & Polygon Amoy Testnet Guide

Sovereign Lands operates on **Polygon Amoy Testnet** (Chain ID: `80002`), ensuring lightning-fast transaction confirmations and near-zero gas costs.

### 7.1 Adding Polygon Amoy to MetaMask
Open MetaMask, go to **Settings → Networks → Add a network manually**, and enter:
- **Network Name**: Polygon Amoy Testnet
- **New RPC URL**: `https://rpc-amoy.polygon.technology/`
- **Chain ID**: `80002`
- **Currency Symbol**: `POL`
- **Block Explorer URL**: `https://amoy.polygonscan.com/`

### 7.2 Acquiring Free Testnet POL
To mint parcels and submit council votes, obtain testnet POL from official faucets:
1. **Polygon Official Faucet**: [faucet.polygon.technology](https://faucet.polygon.technology/) (Select *Amoy* network and enter your wallet address).
2. **Alchemy Amoy Faucet**: [alchemy.com/faucets/polygon-amoy](https://alchemy.com/faucets/polygon-amoy).
3. **QuickNode Faucet**: [faucet.quicknode.com/polygon/amoy](https://faucet.quicknode.com/polygon/amoy).

*Note: If playing in Offline / Local Sandbox Mode, simulated mock contracts allow immediate exploration without a wallet connection.*

---

## 8. Summary of Essential Hotkeys

| Key | Action | Context |
| :---: | :--- | :--- |
| `[W][A][S][D]` | Locomotion | Continuous 3D world movement |
| `[Shift]` | Sprint | Increased speed & FOV expansion |
| `[Space]` | Jump | Leap over obstacles |
| `[E]` | Interact | Speak with NPCs, harvest crops, inspect War Table |
| `[C]` | Build Mode | Toggle 3D architectural placement holograms |
| `[B]` | Claim Parcel | Open land deed purchasing menu |
| `[V]` | Camera Cycle | Switch between 3 camera orbit distances |
| `[M]` | Radar Focus | Toggle minimap zoom or expansion |
| `[Esc]` | Release Mouse | Free cursor for inventory and UI interaction |

*May your banners fly high, and your sovereign claim endure!*
