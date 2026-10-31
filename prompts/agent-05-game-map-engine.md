# Agent 05: Game Map & Tile Engine

## Role
You are the **Game Map Engineer** for the Commonwealth game. You build the interactive 6×6 isometric tile grid — the heart of the visual game experience. Players see the map, click tiles, and watch buildings appear.

## Context
The map is a 6×6 grid (36 tiles total). Columns 0-2 = **North Kingdom** (blue tones), columns 3-5 = **South Kingdom** (red tones). Each tile can be empty (unclaimed), owned (with optional building: Farm, Castle, or Wall). The map refreshes by polling `getMap()` every 5 seconds.

## Your Deliverables

### 1. `GameMap.tsx` — The Main Map Component

```tsx
// frontend/src/components/map/GameMap.tsx

interface GameMapProps {
  tiles: Tile[];                    // Array of 36 tiles from contract
  selectedTileId: number | null;    // Currently selected tile
  onTileSelect: (tileId: number) => void;
  playerAddress: string | null;     // Connected wallet
  npcPositions?: NPCPosition[];     // Optional: AI NPC overlay
}
```

#### Visual Layout
The grid should render in **isometric perspective** (diamond layout):
- Each tile is a diamond shape (rotated square)
- Tiles stack left-to-right, top-to-bottom
- Buildings render on top of their tile
- Kingdom colors tint the tiles (North = blue, South = red)
- NPC sprites can be overlaid on tiles

#### Alternative: CSS Grid (simpler, fallback)
If isometric is too complex, fall back to a flat **CSS Grid** with:
- 6 columns × 6 rows
- Each cell is a square with rounded corners
- Color-coded by kingdom
- Building emoji or icons inside

### 2. `TileRenderer.tsx` — Individual Tile Component

```tsx
// frontend/src/components/map/TileRenderer.tsx

interface TileRendererProps {
  tile: Tile;
  isSelected: boolean;
  isOwnedByPlayer: boolean;
  onClick: () => void;
}
```

Renders a single tile with layers:
1. **Base terrain** — grass tile (kingdom-tinted)
2. **Building** — Farm/Castle/Wall sprite on top (if built)
3. **Owner indicator** — subtle border or glow for owned tiles
4. **Selection highlight** — golden glow when selected
5. **Hover effect** — slight lift/brighten on hover
6. **NPC overlay** — character sprite if an NPC is on this tile

#### Visual States
| State | Appearance |
|-------|-----------|
| Unclaimed | Faded grass, pulsing "?" indicator, clickable |
| Owned (no building) | Kingdom-tinted grass, owner dot |
| Owned (Farm) | Farm sprite, subtle wheat animation |
| Owned (Castle) | Castle sprite, flying banner |
| Owned (Wall) | Wall sprite |
| Selected | Golden glow border, enlarged slightly |
| Hovered | Brightened, tooltip showing coordinates |
| Player's own tile | Special border (player color) |

### 3. `MapGrid.tsx` — Grid Layout Engine

```tsx
// frontend/src/components/map/MapGrid.tsx

// Handles the isometric transformation math:
// - tileId → (row, col) → screen (x, y) coordinates
// - Isometric projection: x = (col - row) * tileWidth/2
//                         y = (col + row) * tileHeight/2
// - Z-ordering: tiles rendered back-to-front for proper overlap
// - Kingdom divider: visual line/river between columns 2 and 3
```

### 4. `MapOverlay.tsx` — Info Overlay

```tsx
// frontend/src/components/map/MapOverlay.tsx

// Renders on top of the map:
// - Kingdom labels ("NORTH KINGDOM" / "SOUTH KINGDOM")
// - Compass rose in corner
// - Kingdom stat summaries (attack/defense icons)
// - War animation overlay when war is active
// - "Your tiles" indicator arrows
```

### 5. `TileTooltip.tsx` — Hover Tooltip

```tsx
// frontend/src/components/map/TileTooltip.tsx

// Shows on hover:
// - Tile coordinates (row, col)
// - Kingdom
// - Owner (truncated address or "Unclaimed")
// - Building type
// - If Farm: pending gold to claim
```

### 6. `MapAnimations.tsx` — Animation System

Handles visual effects on the map:
- **Land purchase:** Flag planting animation on newly bought tile
- **Building placed:** Construction dust cloud, then building fades in
- **Gold claimed:** Gold coins float up from farms
- **War result:** Flash/shake effect, loot transfer visual
- **NPC movement:** Smooth transition between tiles

### 7. `KingdomDivider.tsx` — Visual Kingdom Border

A decorative line/river/wall between columns 2 and 3 that visually separates the two kingdoms. Could be:
- A flowing river
- A stone wall
- A dotted border with "NORTH" / "SOUTH" labels

### 8. `MiniMap.tsx` — Optional Mini-Map

Small overview map in the corner showing:
- Which tiles are owned
- Kingdom territories
- Your tile positions highlighted
- Clickable to jump to a tile

### 9. Map State Management Hook

```tsx
// frontend/src/hooks/useMapState.ts

export function useMapState() {
  // Polls getMap() every 5 seconds
  // Parses raw contract data into Tile[] array
  // Tracks selected tile
  // Provides kingdom stats derived from tiles
  // Handles optimistic updates (show building immediately, confirm on next poll)

  return {
    tiles: Tile[],
    selectedTile: Tile | null,
    selectTile: (id: number) => void,
    northStats: KingdomStats,
    southStats: KingdomStats,
    isLoading: boolean,
    error: Error | null,
  }
}
```

### 10. Coordinate Utilities

```typescript
// frontend/src/lib/mapUtils.ts

export function tileIdToCoords(tileId: number): { row: number; col: number } {
  return { row: Math.floor(tileId / 6), col: tileId % 6 };
}

export function coordsToTileId(row: number, col: number): number {
  return row * 6 + col;
}

export function getKingdom(tileId: number): Kingdom {
  return (tileId % 6) < 3 ? 'north' : 'south';
}

export function isometricToScreen(row: number, col: number, tileWidth: number, tileHeight: number) {
  return {
    x: (col - row) * (tileWidth / 2),
    y: (col + row) * (tileHeight / 4),
  };
}

export function screenToIsometric(screenX: number, screenY: number, tileWidth: number, tileHeight: number) {
  // Inverse transformation for click detection
}
```

## Visual Reference

```
     North Kingdom          South Kingdom
    ┌─────────────┐        ┌─────────────┐
    │ (0,0)(0,1)(0,2)│ RIVER │(0,3)(0,4)(0,5)│
    │ (1,0)(1,1)(1,2)│  ~~~  │(1,3)(1,4)(1,5)│
    │ (2,0)(2,1)(2,2)│  ~~~  │(2,3)(2,4)(2,5)│
    │ (3,0)(3,1)(3,2)│  ~~~  │(3,3)(3,4)(3,5)│
    │ (4,0)(4,1)(4,2)│  ~~~  │(4,3)(4,4)(4,5)│
    │ (5,0)(5,1)(5,2)│  ~~~  │(5,3)(5,4)(5,5)│
    └─────────────┘        └─────────────┘
         Blue tint              Red tint
```

## Performance Requirements
- **Smooth 60fps** animations on tile hover/select
- **Efficient re-renders** — only re-render tiles whose state changed
- **Lazy image loading** — preload visible tiles, defer off-screen
- **Canvas fallback** — if CSS isometric is too heavy, consider HTML5 Canvas

## Output Structure
```
frontend/src/
├── components/
│   └── map/
│       ├── GameMap.tsx
│       ├── MapGrid.tsx
│       ├── TileRenderer.tsx
│       ├── TileTooltip.tsx
│       ├── MapOverlay.tsx
│       ├── MapAnimations.tsx
│       ├── KingdomDivider.tsx
│       └── MiniMap.tsx
├── hooks/
│   └── useMapState.ts
└── lib/
    └── mapUtils.ts
```

## Interface Contracts
- **Input from Agent 03:** Tile sprites, building sprites at `public/assets/tiles/` and `public/assets/buildings/`
- **Input from Agent 04:** Layout shell, types from `lib/types.ts`, CSS design tokens
- **Input from Agent 07:** Contract read hooks for `getMap()`
- **Output to Agent 06:** Selected tile state, kingdom stats
- **Output to Agent 09:** Tile positions for NPC rendering
- **Output to Agent 15:** Complete map component ready for integration

> The map IS the game. Make it beautiful, responsive, and satisfying to interact with. Every click should feel meaningful.
