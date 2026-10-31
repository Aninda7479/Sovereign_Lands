# Sovereign Lands: Master Controls & Keyboard Reference Sheet

> Quick-reference operational manual for 3D character locomotion, camera manipulation, feudal interactions, architectural construction, and Web3 land management.

---

## 1. Quick Keyboard & Mouse Reference Matrix

| Category | Input / Key | Action | Description |
| :--- | :---: | :--- | :--- |
| **Locomotion** | `[W]` / `[↑]` | Forward | Run forward relative to current camera yaw |
| **Locomotion** | `[S]` / `[↓]` | Backward | Run backward relative to current camera yaw |
| **Locomotion** | `[A]` / `[←]` | Strafe Left | Move left perpendicular to camera forward |
| **Locomotion** | `[D]` / `[→]` | Strafe Right | Move right perpendicular to camera forward |
| **Locomotion** | `[Left Shift]` | Sprint | Sprint at 8.2 m/s; activates dynamic camera FOV surge |
| **Locomotion** | `[Space]` | Jump | Leap upward with Rapier physics vertical impulse |
| **Action** | `[E]` | Interact | Context-sensitive: Speak with NPCs, harvest gold, open War Table |
| **Building** | `[C]` | Build Mode | Toggle 3D architectural placement holograms & grid snapping |
| **Land Claim** | `[B]` | Claim Parcel | Open land deed purchasing menu for current 3D parcel |
| **Camera** | `[V]` | Camera Distance | Cycle camera orbit distance (2.5m Close, 5.2m Normal, 9.0m Wide) |
| **Camera** | `Mouse Move` | Orbit Look | Rotates camera yaw and pitch when pointer locked |
| **Camera** | `Scroll Wheel` | Camera Zoom | Smoothly zooms camera distance between 1.6m and 10.0m |
| **HUD** | `[M]` / Click | Radar Expand | Expand circular mini-map from 205px to 310px tactical view |
| **HUD** | `[+]` / `[-]` | Radar Zoom | Toggle minimap survey scale (60m, 120m, 240m radius) |
| **System** | `[Esc]` | Release Lock | Release pointer lock to interact with UI dialogs and modals |

---

## 2. Detailed Input Mechanics

### 2.1 Camera-Relative Locomotion
All movement in Sovereign Lands is calculated dynamically relative to the direction the camera is pointing:
- Pressing `[W]` moves your avatar directly into the horizon viewed on your screen.
- The character's 3D mesh smoothly interpolates its heading to face the direction of movement using spherical angle slerping.
- Running onto slopes and riverbanks automatically evaluates terrain elevation via continuous procedural heightmap calculations:
  $$Y = \text{getTerrainHeight}(X, Z)$$

### 2.2 Third-Person Camera & Pointer Lock
- **Mouse Click to Engage**: Clicking inside the 3D canvas initiates browser `requestPointerLock()`. Your cursor hides, allowing infinite 360-degree mouse look.
- **Pitch Clamping**: Vertical angle is constrained between $-14^\circ$ (looking up from low angle) and $+68^\circ$ (high top-down angle) to avoid inverted disorientations.
- **Obstacle Collision Avoidance**: The camera casts real-time raycasts from your character's upper torso to the camera lens. If a stone wall, guard tower, or cliff obstructs the line of sight, the camera automatically glides forward to prevent clipping through geometry.
- **Sprint FOV Shift**: When holding `[Shift]`, the perspective camera's Field of View dynamically lerps from 60° to 69°, producing an authentic GTA-style motion sensation.

### 2.3 Contextual Interaction (`[E]`)
The `[E]` key is the universal interaction trigger:
1. **Living NPCs (within 5 meters)**:
   - When within 5m of an NPC (e.g., Aldric, Sir Gareth, Merin, Zara), an interactive floating prompt appears over their head: `[E] Speak with <Name>`.
   - Pressing `[E]` opens the cinematic dialogue interface with live typewriter streaming and AI lore generation.
2. **Farmstead Crop Silos**:
   - Approach a constructed Farmstead on your parcel and press `[E]` to harvest accrued gold into your balance.
3. **Citadel War Table**:
   - Step beside the carved oak war table inside the Citadel and press `[E]` to open the full-screen tactical command overlay.

### 2.4 3D Holographic Construction Mode (`[C]`)
- Pressing `[C]` activates the structure holographic projector.
- A translucent blue wireframe of your selected structure snaps to the continuous 2.0-meter world grid (`WORLD_CONSTANTS.gridSnapSize`).
- **Safety Margin Validation**: The building footprint is checked against parcel boundaries:
  $$\text{posX} - \frac{W}{2} \ge \min X + \text{margin} \quad \text{and} \quad \text{posZ} + \frac{D}{2} \le \max Z - \text{margin}$$
- Green hologram indicates valid placement inside your owned parcel; red hologram indicates boundary overlap or unowned territory.
- Click to finalize placement and broadcast the on-chain construction event.

### 2.5 Land Claiming & Minting (`[B]`)
- Step onto any unowned parcel (identified on the Radar Mini-Map as uncolored geometric plots).
- Press `[B]` to inspect the exact continuous bounding box coordinates:
  - Minimum X & Z coordinates
  - Maximum X & Z coordinates
  - Kingdom territory (North / South)
  - Claim price (0.001 POL on Polygon Amoy)
- Click **"Sign Charter Deed"** to trigger MetaMask transaction approval.

---

## 3. Minimap & HUD Controls

- **`[CAM / N-UP]` Button**: Toggles between camera heading rotation (world rotates underneath player) and North-Up lock (world fixed, player chevron rotates).
- **Radar Zoom `[+]` / `[-]`**:
  - `60m`: Close-quarters tactical awareness for parcel borders and NPC conversations.
  - `120m` (Default): Optimal balance showing nearby parcels, bridges, and landmarks.
  - `240m`: Broad regional overview revealing Citadels and distant river crossings.
- **Radar Expand Button (`Maximize2`)**: Doubles radar dimensions for panoramic territory scanning.
- **Quest Tracker Directives**: Click any objective in the top-left HUD to toggle its completion state, or click the reload button to reset the mission.

---

## 4. Web3 & Browser Troubleshooting

### Cursor Trapped or Cannot Click UI Buttons
- **Solution**: Press `[Esc]` on your keyboard. This releases the pointer lock and restores standard mouse cursor functionality for clicking UI buttons and menus.

### Key Getting "Stuck" Running
- **Solution**: If you switch windows (Alt+Tab) while holding `[W]`, the window `blur` listener automatically resets movement flags. Simply tap `[W]` once inside the game to ensure clean key state synchronization.

### MetaMask Transaction Failing or Hanging
- **Verify Network**: Ensure MetaMask is connected to **Polygon Amoy Testnet (Chain ID: 80002)**.
- **Verify Gas Balance**: You need a fraction of a cent in testnet POL (0.01 POL is sufficient for dozens of actions). Claim free POL at [faucet.polygon.technology](https://faucet.polygon.technology/).
- **Clear Stale Nonce**: In MetaMask, go to **Settings → Advanced → Clear activity and nonce data** if a transaction is stalled.

---

*For narrative lore, heraldry, and faction guides, consult `docs/lore/factions-and-heraldry.md` and `docs/guide/players-field-manual.md`.*
