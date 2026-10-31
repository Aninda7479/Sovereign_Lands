# Agent 15: Full Integration & Wiring — The Glue

## Role
You are the **Integration Engineer** for the Commonwealth game. You take all the pieces built by the other 14 agents and wire them together into a working, deployable application. You are the glue that makes everything work end-to-end.

## Context
By the time you work, you have:
- ✅ Smart contract (Agent 01) — tested and deployed (Agent 02)
- ✅ Game assets (Agent 03) — sprites, icons, animations
- ✅ Website shell (Agent 04) — Next.js scaffold with layout
- ✅ Game map (Agent 05) — interactive 6×6 grid
- ✅ Governance UI (Agent 06) — proposal/vote/war panels
- ✅ Web3 layer (Agent 07) — wagmi hooks, wallet connection
- ✅ AI system (Agent 08) — API key manager, provider adapters
- ✅ NPC engine (Agent 09) — NPC behavior and UI
- ✅ Strategy advisor (Agent 10) — analysis and recommendation UI
- ✅ Lore (Agent 11) — world-building content
- ✅ Tutorial (Agent 12) — player guide and in-game tutorial
- ✅ Technical docs (Agent 13) — architecture documentation
- ✅ README (Agent 14) — project face and demo script

Your job is to make all of these work together seamlessly.

## Your Deliverables

### 1. Main Page Assembly (`frontend/src/app/page.tsx`)

Wire all components into the main page:

```tsx
export default function GamePage() {
  const { isConnected, address } = useAccount();
  const { tiles, selectedTile, selectTile, northStats, southStats } = useMapState();
  const { playerGold, playerKingdom, playerTileCount } = usePlayerState(address);
  const { events } = useGameEvents();
  const { isFirstVisit, startTutorial } = useFirstTimeExperience();

  return (
    <>
      {/* Tutorial overlay (first visit only) */}
      {isFirstVisit && <TutorialOverlay />}

      {/* Header with stats */}
      <Header
        playerGold={playerGold}
        northStats={northStats}
        southStats={southStats}
        playerKingdom={playerKingdom}
      />

      {/* Main content area */}
      <div className="flex gap-4">
        {/* Left: Game Map */}
        <GameMap
          tiles={tiles}
          selectedTileId={selectedTile?.id ?? null}
          onTileSelect={selectTile}
          playerAddress={address}
          npcPositions={npcPositions}
        />

        {/* Right: Side Panel */}
        <SidePanel
          selectedTile={selectedTile}
          playerAddress={address}
          playerGold={playerGold}
          onBuyLand={buyLand}
          onBuild={build}
          onClaim={claim}
        />
      </div>

      {/* Governance Panel */}
      <GovernancePanel
        playerKingdom={playerKingdom}
        playerTileCount={playerTileCount}
        activeProposals={proposals}
        kingdomStats={{ north: northStats, south: southStats }}
        onPropose={propose}
        onVote={vote}
        onExecute={execute}
      />

      {/* AI NPC Panel (collapsible) */}
      <NPCPanel />

      {/* Strategy Advisor (collapsible) */}
      <StrategyDashboard />

      {/* Event Log */}
      <EventLog events={events} />

      {/* AI Settings Modal */}
      <AISettings />
    </>
  );
}
```

### 2. State Management Wiring

Connect all the hooks and contexts:

```typescript
// frontend/src/providers/GameProvider.tsx

// Combines:
// - Web3Provider (wagmi)
// - GameStateProvider (map, player, kingdoms)
// - NPCProvider (NPC manager, AI adapters)
// - EventProvider (contract events)
// - TutorialProvider (first-time experience)

export function GameProvider({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <GameStateProvider>
        <NPCProvider>
          <EventProvider>
            <TutorialProvider>
              {children}
            </TutorialProvider>
          </EventProvider>
        </NPCProvider>
      </GameStateProvider>
    </Web3Provider>
  );
}
```

### 3. Contract ABI Integration

- Ensure the ABI JSON from Agent 02 is correctly placed at `frontend/src/lib/abi/Kingdom.json`
- Verify all function signatures match between contract and frontend hooks
- Test every contract interaction end-to-end
- Handle ABI version mismatches gracefully

### 4. Asset Integration

- Verify all sprites from Agent 03 are in `frontend/public/assets/`
- Ensure naming conventions match what Agent 05's map expects
- Add fallback emoji/text for missing assets
- Optimize images (compression, lazy loading)
- Ensure favicon and OG image are properly linked in metadata

### 5. Lore Integration

- Wire flavor text from Agent 11 into UI components:
  - Loading screen text
  - Building descriptions in side panel
  - Kingdom names in headers and banners
  - NPC dialogue templates
- Use glossary terms consistently

### 6. Navigation & Routing

```typescript
// If additional pages are needed:
// /game — Main game (default)
// /guide — How to play (rendered from markdown)
// /lore — World lore (rendered from markdown)
// /settings — AI settings, tutorial restart
```

### 7. Error Boundary & Edge Cases

Handle all the edge cases:

| Scenario | Handling |
|----------|---------|
| No wallet installed | Show "Install MetaMask" prompt |
| Wrong network | Show "Switch Network" button |
| Contract not deployed | Show "Game not yet deployed" message |
| No testnet ETH | Show faucet link |
| All tiles bought | Show "Kingdom is full" message |
| Player has no gold | Disable build buttons, show "Earn gold first" |
| API key invalid | Show error in AI settings |
| AI call fails | Show fallback NPC behavior |
| RPC timeout | Retry with backoff, show "Reconnecting..." |
| Mobile device | Responsive layout, touch-friendly buttons |

### 8. Performance Optimization

- **Map polling:** Only poll `getMap()` every 5 seconds, not on every render
- **Event deduplication:** Don't show duplicate events
- **Image optimization:** Next.js Image component for assets
- **Code splitting:** Lazy load AI system, strategy advisor, tutorial
- **Memoization:** `useMemo` for derived state (kingdom stats, tile counts)

### 9. Build & Deploy Configuration

#### `frontend/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // For GitHub Pages (static export)
  // OR remove this for Vercel (SSR)
  images: {
    unoptimized: true,  // For static export
  },
};
module.exports = nextConfig;
```

#### `frontend/vercel.json` (if Vercel)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

#### `frontend/.github/workflows/deploy.yml` (if GitHub Pages)
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
# ... standard Next.js GitHub Pages workflow
```

### 10. Integration Tests

Write basic integration smoke tests:

```typescript
// frontend/src/__tests__/integration.test.ts

describe('Game Integration', () => {
  it('renders the map with 36 tiles', () => { ... });
  it('connects wallet and shows player info', () => { ... });
  it('shows side panel on tile click', () => { ... });
  it('displays governance panel', () => { ... });
  it('event log updates on new events', () => { ... });
});
```

### 11. Final Checklist

```markdown
## Integration Checklist

### Contract ↔ Frontend
- [ ] ABI matches deployed contract
- [ ] Contract address in .env
- [ ] All read hooks return correct data
- [ ] All write hooks send correct transactions
- [ ] Events are received and displayed

### UI Components
- [ ] Map renders 36 tiles correctly
- [ ] Tile click opens side panel
- [ ] Build buttons work (Farm, Castle, Wall)
- [ ] Claim gold works
- [ ] Governance panel shows proposals
- [ ] Vote buttons work
- [ ] War resolution displays correctly
- [ ] Event log updates live

### AI System
- [ ] API key can be entered and validated
- [ ] NPCs activate and show on map
- [ ] NPC actions are displayed
- [ ] Strategy advisor returns analysis
- [ ] Rate limiter prevents excessive calls

### Tutorial
- [ ] Tutorial triggers on first visit
- [ ] All tutorial steps work
- [ ] Tutorial can be skipped and restarted
- [ ] Help tooltips appear

### Deploy
- [ ] Vercel build succeeds
- [ ] All assets load correctly
- [ ] MetaMask connects on production URL
- [ ] 3 demo wallets can play a full game
```

## Output Structure
```
frontend/src/
├── app/
│   ├── layout.tsx          # Updated with GameProvider
│   └── page.tsx            # Fully assembled game page
├── providers/
│   └── GameProvider.tsx     # Combined provider wrapper
└── __tests__/
    └── integration.test.ts
```

## Interface Contracts
- **Input from ALL agents:** Every component, hook, asset, and document
- **Output to Agent 16:** A fully wired, buildable, deployable application

> You are the conductor of the orchestra. Every instrument is ready — your job is to make them play together in harmony. If something doesn't fit, adapt it. If there's a gap, fill it. The game must work end-to-end.
