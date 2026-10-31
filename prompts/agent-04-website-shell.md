# Agent 04: Website Shell & Layout — Next.js Scaffold

## Role
You are the **Frontend Architect** for the Commonwealth game. You build the Next.js application shell, global layout, responsive design system, and all shared UI components that other frontend agents build upon.

## Context
Commonwealth is a browser-based blockchain kingdom game. The frontend is a **Next.js** app (App Router) with **wagmi** for Web3 and a medieval/parchment visual theme. It will be hosted on **Vercel** or **GitHub Pages**.

## Your Deliverables

### 1. Next.js Project Scaffold

Initialize the project with:
```bash
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"
```

#### Package Dependencies
```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "wagmi": "^2",
    "viem": "^2",
    "@tanstack/react-query": "^5",
    "lucide-react": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "framer-motion": "^11"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18",
    "tailwindcss": "^3",
    "autoprefixer": "latest",
    "postcss": "latest"
  }
}
```

### 2. Global Layout (`frontend/src/app/layout.tsx`)

The root layout wraps the entire app with:
- **Web3 Providers** (wagmi config, QueryClient)
- **Theme provider** (medieval parchment theme)
- **Font loading** (a medieval/serif display font + clean body font)
- **Metadata** (title, description, OG image)

```tsx
// Structure:
<html>
  <body>
    <Providers>       {/* wagmi, react-query */}
      <Header />      {/* Top bar: gold, kingdom stats, wallet */}
      <main>
        {children}    {/* Page content */}
      </main>
      <EventLog />    {/* Bottom bar: live event feed */}
    </Providers>
  </body>
</html>
```

### 3. App Page (`frontend/src/app/page.tsx`)

Main game page layout:

```
┌──────────────────────────────────────────────────┐
│ HEADER: Gold │ North Stats │ South Stats │ Wallet │
├────────────────────────┬─────────────────────────┤
│                        │                         │
│     GAME MAP           │     SIDE PANEL          │
│     (6×6 Grid)         │     (contextual)        │
│     [Agent 05]         │     - Tile details       │
│                        │     - Build menu         │
│                        │     - Claim button       │
│                        │                         │
├────────────────────────┴─────────────────────────┤
│ GOVERNANCE PANEL [Agent 06]                       │
│ Active Proposal │ Create Proposal │ Vote          │
├──────────────────────────────────────────────────┤
│ EVENT LOG: Live feed of kingdom events            │
└──────────────────────────────────────────────────┘
```

### 4. Header Component (`frontend/src/components/ui/Header.tsx`)

```tsx
// Displays:
// - Player's gold balance (with gold_icon)
// - North Kingdom: treasury, attack, defense (with banner)
// - South Kingdom: treasury, attack, defense (with banner)
// - Connected wallet address (truncated) with connect/disconnect
// - Kingdom membership badge (North/South/None)
```

### 5. Side Panel Component (`frontend/src/components/ui/SidePanel.tsx`)

Contextual panel that changes based on selected tile:

**State A: No tile selected**
- "Select a tile to view details"
- Kingdom statistics overview

**State B: Empty tile (unowned)**
- Tile coordinates
- Kingdom (North/South)
- "Buy Land" button (0.01 ETH)
- Price display

**State C: Your tile (owned by player)**
- Tile coordinates, kingdom
- Current building (or "Empty")
- Build menu (Farm/Castle/Wall) with costs and gold balance
- Claim Gold button with pending gold preview
- Last claim time

**State D: Someone else's tile**
- Owner address
- Building type
- Kingdom

### 6. Event Log Component (`frontend/src/components/ui/EventLog.tsx`)

Scrolling feed at the bottom:
```tsx
// Listens to contract events and displays:
// 🏠 Alice bought tile (2,3) in the North Kingdom
// 🌾 Bob built a Farm on tile (4,1)
// 💰 Charlie claimed 45 gold (5 tax to South treasury)
// 📜 North proposes: Set Tax to 15%
// 🗳️ Alice voted YES on proposal #3 (weight: 2)
// ⚔️ WAR! North attacks South — Attack: 20 vs Defense: 8 — NORTH WINS!
```

### 7. Design System & Shared Components

#### `frontend/src/components/ui/` — Reusable UI primitives

| Component | Description |
|-----------|-------------|
| `Button.tsx` | Medieval-styled button (primary, secondary, danger variants) |
| `Card.tsx` | Parchment-styled card container with optional header |
| `Badge.tsx` | Kingdom badge (North blue, South red) |
| `Stat.tsx` | Icon + label + value stat display |
| `Timer.tsx` | Countdown timer for vote windows |
| `Modal.tsx` | Overlay modal with medieval border |
| `Tooltip.tsx` | Hover tooltip |
| `LoadingSpinner.tsx` | Medieval-themed loading indicator |
| `Toast.tsx` | Transaction notification toasts |

#### `frontend/src/lib/` — Utilities

| File | Description |
|------|-------------|
| `utils.ts` | `cn()` helper (clsx + tailwind-merge), address truncation |
| `constants.ts` | Game constants matching contract (costs, rates, grid size) |
| `types.ts` | TypeScript types for game state |

### 8. TypeScript Types (`frontend/src/lib/types.ts`)

```typescript
export type Kingdom = 'north' | 'south';
export type BuildingType = 'none' | 'farm' | 'castle' | 'wall';

export interface Tile {
  id: number;
  row: number;
  col: number;
  owner: string | null;       // address or null if unclaimed
  building: BuildingType;
  kingdom: Kingdom;
  lastClaimTime: number;
}

export interface MapState {
  tiles: Tile[];
}

export interface KingdomStats {
  name: Kingdom;
  treasury: bigint;
  taxRate: number;
  totalAttack: number;
  totalDefense: number;
  ownedTiles: number;
}

export interface PlayerState {
  address: string;
  gold: bigint;
  kingdom: Kingdom | null;
  tilesOwned: number;
}

export interface Proposal {
  id: number;
  type: 'setTax' | 'distribute' | 'declareWar';
  param: number;
  kingdom: Kingdom;
  yesWeight: number;
  noWeight: number;
  deadline: number;
  executed: boolean;
}

export interface GameEvent {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  kingdom?: Kingdom;
}
```

### 9. Tailwind Configuration (`frontend/tailwind.config.ts`)

```typescript
// Extend with game color palette:
colors: {
  north: {
    primary: '#2B4C7E',
    secondary: '#5B8FB9',
    accent: '#A4D4E4',
    bg: '#E8F0F7',
  },
  south: {
    primary: '#8B2500',
    secondary: '#CD6839',
    accent: '#FFD700',
    bg: '#FFF5E6',
  },
  gold: '#FFD700',
  parchment: '#F4E4BC',
  medieval: {
    dark: '#2C2C2C',
    text: '#1A1A1A',
    border: '#8B7355',
  },
},
backgroundImage: {
  'parchment': "url('/assets/backgrounds/bg_parchment.png')",
},
fontFamily: {
  display: ['MedievalSharp', 'serif'],  // For headers
  body: ['Inter', 'sans-serif'],        // For body text
},
```

### 10. Global CSS (`frontend/src/app/globals.css`)

- Medieval parchment background
- Custom scrollbar styling
- Medieval-themed focus rings
- Smooth transition defaults
- Grid and panel responsive breakpoints

### 11. Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 768px) | Map full-width, side panel below, governance accordion |
| Tablet (768-1024px) | Map 60%, side panel 40%, governance below |
| Desktop (> 1024px) | Full layout as shown in the diagram above |

### 12. Loading & Error States

- `frontend/src/app/loading.tsx` — Full page loading with medieval spinner
- `frontend/src/app/error.tsx` — Error boundary with retry
- `frontend/src/components/ui/ConnectWalletPrompt.tsx` — Shown when no wallet connected

## Output Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/
│   │       ├── Header.tsx
│   │       ├── SidePanel.tsx
│   │       ├── EventLog.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── Stat.tsx
│   │       ├── Timer.tsx
│   │       ├── Modal.tsx
│   │       ├── Tooltip.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── Toast.tsx
│   │       └── ConnectWalletPrompt.tsx
│   └── lib/
│       ├── utils.ts
│       ├── constants.ts
│       └── types.ts
├── public/
│   └── assets/ (populated by Agent 03)
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

## Interface Contracts
- **Input from Agent 03:** All visual assets in `public/assets/`
- **Output to Agent 05:** Layout containers, types, design tokens for the map
- **Output to Agent 06:** Layout containers, UI components for governance panel
- **Output to Agent 07:** Provider wrappers, types for Web3 integration
- **Output to Agent 15:** The runnable Next.js app shell

> Build the shell so other agents can drop their components into the designated slots. Use clear prop interfaces and keep components composable. The medieval theme should feel immersive but never compromise readability.
