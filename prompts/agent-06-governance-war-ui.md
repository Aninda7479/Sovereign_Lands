# Agent 06: Governance & War UI

## Role
You are the **Governance & War UI Developer** for the Commonwealth game. You build all UI panels related to proposals, voting, war declarations, and war resolution — the political heart of the game.

## Context
Governance is what makes Commonwealth special. Any landowner can propose changes (set tax, distribute treasury, declare war). Players vote with weight proportional to tiles owned. Proposals have a 2-minute vote window and require 20% quorum. War is deterministic: castles provide attack, walls + castles provide defense.

**The tagline is: "The kingdom decided this, not a server."** Your UI must make governance feel dramatic and consequential.

## Your Deliverables

### 1. `GovernancePanel.tsx` — Main Governance Container

```tsx
// frontend/src/components/governance/GovernancePanel.tsx

interface GovernancePanelProps {
  playerKingdom: Kingdom | null;
  playerTileCount: number;
  activeProposals: Proposal[];    // Max 1 per kingdom
  kingdomStats: { north: KingdomStats; south: KingdomStats };
  onPropose: (type: ProposalType, param: number) => void;
  onVote: (proposalId: number, support: boolean) => void;
  onExecute: (proposalId: number) => void;
}
```

Layout:
```
┌─────────────────────────────────────────────────┐
│ ⚔️ KINGDOM GOVERNANCE                           │
├────────────────────────┬────────────────────────┤
│ 🔵 NORTH KINGDOM       │ 🔴 SOUTH KINGDOM       │
│                        │                        │
│ [Active Proposal]      │ [Active Proposal]      │
│ or                     │ or                     │
│ [Create Proposal]      │ [Create Proposal]      │
└────────────────────────┴────────────────────────┘
```

### 2. `ActiveProposal.tsx` — Display an Active Proposal

```tsx
// frontend/src/components/governance/ActiveProposal.tsx

// Displays:
// - Proposal type icon + title ("Set Tax to 15%", "Distribute Treasury", "Declare War!")
// - Proposer address
// - Vote counts: YES bar vs NO bar (animated progress)
// - Quorum indicator (e.g., "3/4 needed for quorum")
// - Countdown timer (2-minute window) with urgency colors
// - Vote buttons (YES / NO) — only if player is in this kingdom and hasn't voted
// - Execute button — appears after deadline, if passed
// - Result badge — PASSED ✅ / FAILED ❌ / PENDING ⏳
```

#### Visual Design for Each Proposal Type

**SetTax:**
- Icon: 💰 Tax chest
- Color: Gold/amber
- Display: "Change tax rate from X% to Y%"
- Impact preview: "This will affect all farm income in the kingdom"

**Distribute:**
- Icon: 🎁 Treasury distribution
- Color: Green/gold
- Display: "Split X gold among Y landowners"
- Per-player preview: "You would receive approximately Z gold (based on N tiles)"

**DeclareWar:**
- Icon: ⚔️ Crossed swords
- Color: Red/crimson, dramatic styling
- Display: "Attack [Enemy Kingdom]!"
- Battle preview panel showing:
  ```
  OUR ATTACK:  ⚔️ 20  (2 Castles × 10)
  THEIR DEFENSE: 🛡️ 12  (1 Wall × 8 + 1 Castle × 4)
  
  PREDICTION: VICTORY — We'd take 25% of their treasury (150 gold)
  ```
  or
  ```
  PREDICTION: DEFEAT — We'd lose 10% of our treasury (50 gold)
  ```

### 3. `CreateProposal.tsx` — Proposal Creation Form

```tsx
// frontend/src/components/governance/CreateProposal.tsx

// Only shown if:
// - Player owns tiles in this kingdom
// - No active proposal for this kingdom

// Three proposal type buttons:
// [📊 Set Tax Rate]  [💰 Distribute Treasury]  [⚔️ Declare War]

// SetTax selected → Slider from 0% to 30% with current rate highlighted
// Distribute selected → Confirmation dialog showing treasury amount
// DeclareWar selected → War preview panel (see above) + confirmation
```

### 4. `VotePanel.tsx` — Voting Interface

```tsx
// frontend/src/components/governance/VotePanel.tsx

// Prominent YES / NO buttons
// Shows player's vote weight: "Your vote counts as 3 (you own 3 tiles)"
// Animated vote submission: scroll + seal stamp animation
// After voting: "You voted YES ✅" with no ability to change
// Real-time vote count updates
```

### 5. `VoteBar.tsx` — Animated Vote Progress Bar

```tsx
// frontend/src/components/governance/VoteBar.tsx

// Dual-sided progress bar:
// [████████ YES (60%) ████████|████ NO (40%) ████]
//
// Green for YES, red for NO
// Animated when votes come in
// Shows absolute numbers + percentages
// Quorum line marker
```

### 6. `WarResolution.tsx` — War Result Display

```tsx
// frontend/src/components/governance/WarResolution.tsx

// Dramatic full-width panel that appears when a war is resolved:
//
// ⚔️ WAR BETWEEN NORTH AND SOUTH ⚔️
//
// NORTH ATTACK: 20          SOUTH DEFENSE: 12
// [Animated sword clash]
//
// 🏆 NORTH WINS!
// 150 gold transferred from South to North treasury
//
// [Animated gold coins moving between kingdom treasuries]
//
// or
//
// 🛡️ SOUTH DEFENDS SUCCESSFULLY!
// North loses 50 gold from treasury
```

### 7. `WarPreview.tsx` — Pre-War Analysis

```tsx
// frontend/src/components/governance/WarPreview.tsx

// Side-by-side comparison:
//
// 🔵 NORTH (Attacker)     vs     🔴 SOUTH (Defender)
// ─────────────────              ─────────────────
// 🏰 3 Castles                   🏰 1 Castle
// 🧱 1 Wall                      🧱 2 Walls
//
// ⚔️ Attack Power: 30            🛡️ Defense Power: 24
//                                (Walls: 16 + Castles: 4)
//
// RESULT PREVIEW: NORTH WINS by 6 points
// LOOT: 25% of South treasury = 200 gold
```

### 8. `ProposalHistory.tsx` — Past Proposals (Stretch)

```tsx
// frontend/src/components/governance/ProposalHistory.tsx

// Scrollable list of past proposals:
// - Type, result (passed/failed), vote counts
// - Useful for understanding kingdom politics
```

### 9. `CooldownTimer.tsx` — War Cooldown Display

```tsx
// frontend/src/components/governance/CooldownTimer.tsx

// Shows "War available in X:XX" countdown after a war declaration
// Red pulsing when cooldown is about to expire
// "War available!" when cooldown is done
```

### 10. Governance Hooks

```tsx
// frontend/src/hooks/useGovernance.ts

export function useGovernance(kingdom: Kingdom) {
  return {
    activeProposal: Proposal | null,
    canPropose: boolean,
    canVote: boolean,
    hasVoted: boolean,
    voteWeight: number,
    warCooldownRemaining: number,
    propose: (type: ProposalType, param: number) => Promise<void>,
    vote: (proposalId: number, support: boolean) => Promise<void>,
    execute: (proposalId: number) => Promise<void>,
  }
}
```

## Animation & Sound Suggestions

| Event | Animation | Audio (optional) |
|-------|-----------|---------|
| Vote cast | Scroll unfurling + seal stamp | Stamp sound |
| Proposal passes | Green flash + confetti | Trumpet fanfare |
| Proposal fails | Red flash + scroll crumbles | Somber horn |
| War declared | Screen shake + red overlay | War drums |
| War won | Gold particles + victory banner | Victory fanfare |
| War lost | Smoke + damage cracks | Defeat horn |

## Output Structure
```
frontend/src/
├── components/
│   └── governance/
│       ├── GovernancePanel.tsx
│       ├── ActiveProposal.tsx
│       ├── CreateProposal.tsx
│       ├── VotePanel.tsx
│       ├── VoteBar.tsx
│       ├── WarResolution.tsx
│       ├── WarPreview.tsx
│       ├── ProposalHistory.tsx
│       └── CooldownTimer.tsx
└── hooks/
    └── useGovernance.ts
```

## Interface Contracts
- **Input from Agent 04:** UI components (Button, Card, Badge, Timer, Modal), types
- **Input from Agent 05:** Kingdom stats, map state for war preview calculations
- **Input from Agent 07:** Contract write hooks (propose, vote, execute)
- **Output to Agent 15:** Complete governance panel for integration

> Governance should feel **dramatic and consequential**. A war vote should feel tense. A passed proposal should feel triumphant. The UI must tell a story.
