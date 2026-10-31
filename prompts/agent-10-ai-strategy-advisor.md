# Agent 10: AI Strategy Advisor — Player Intelligence System

## Role
You are the **AI Strategy Advisor Developer** for the Commonwealth game. You build a smart analytics panel that gives players AI-powered strategic advice — "Should I build a farm or a castle?", "Is this a good time for war?", "What's the optimal tax rate?"

## Context
The Strategy Advisor is an optional AI companion that analyzes the entire game state and provides recommendations. Unlike NPCs (Agent 09) which act autonomously, the Advisor is a consultative tool the player interacts with directly. It uses the same AI provider system (Agent 08) but focuses on high-level strategy rather than individual NPC actions.

## Your Deliverables

### 1. Strategy Analyzer (`ai-system/strategy/StrategyAnalyzer.ts`)

```typescript
export class StrategyAnalyzer {
  constructor(private aiAdapter: AIAdapter) {}

  // Full game analysis
  async analyzeGameState(gameState: GameState, playerKingdom: Kingdom): Promise<GameAnalysis> {
    // Sends game state to AI with a strategy-focused prompt
    // Returns comprehensive analysis
  }

  // Specific strategy questions
  async shouldBuild(tile: Tile, options: BuildingType[]): Promise<BuildRecommendation>;
  async shouldDeclareWar(gameState: GameState, kingdom: Kingdom): Promise<WarAnalysis>;
  async optimalTaxRate(gameState: GameState, kingdom: Kingdom): Promise<TaxRecommendation>;
  async shouldDistribute(gameState: GameState, kingdom: Kingdom): Promise<DistributeAnalysis>;
  async predictEnemyMoves(gameState: GameState, kingdom: Kingdom): Promise<EnemyPrediction>;

  // Quick one-liner advice
  async getQuickTip(gameState: GameState, kingdom: Kingdom): Promise<string>;
}

export interface GameAnalysis {
  overallAssessment: 'dominating' | 'strong' | 'balanced' | 'weak' | 'critical';
  economyScore: number;          // 0-100
  militaryScore: number;         // 0-100
  goldPerMinute: number;
  estimatedWarOutcome: 'win' | 'lose' | 'close';
  recommendations: Recommendation[];
  threats: Threat[];
  opportunities: Opportunity[];
  narrative: string;             // AI-generated story-like summary
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;                // e.g., "Build a Wall on tile (2,1)"
  reasoning: string;
  estimatedImpact: string;
}

export interface WarAnalysis {
  ourAttack: number;
  theirDefense: number;
  ourDefense: number;
  theirAttack: number;
  winProbability: string;         // "Certain", "Likely", "Risky", "Foolish"
  lootIfWin: number;
  costIfLose: number;
  recommendation: 'attack_now' | 'build_more' | 'defend' | 'wait';
  reasoning: string;
  optimalBuildBeforeWar: BuildingType[];
}
```

### 2. Strategy Dashboard UI (`frontend/src/components/strategy/StrategyDashboard.tsx`)

```tsx
// Full strategy panel with tabs:
//
// ┌────────────────────────────────────────────┐
// │ 📊 KINGDOM STRATEGY ADVISOR                │
// │ ┌──────┬──────┬──────┬──────┐             │
// │ │Overview│Economy│Military│Threats│         │
// │ └──────┴──────┴──────┴──────┘             │
// ├────────────────────────────────────────────┤
// │ OVERALL: 🟢 STRONG                         │
// │                                            │
// │ Economy: ████████░░ 80/100                 │
// │ Military: ██████░░░░ 60/100                │
// │ Gold/min: +15 gold                         │
// │                                            │
// │ TOP RECOMMENDATIONS:                       │
// │ 🔴 HIGH: Build a Wall on (2,0) — we're    │
// │    exposed on the border                   │
// │ 🟡 MED: Claim gold — 120 unclaimed gold   │
// │ 🟢 LOW: Consider SetTax to 15% — treasury │
// │    is growing slowly                       │
// │                                            │
// │ [🔄 Refresh Analysis]  [💬 Ask Advisor]    │
// └────────────────────────────────────────────┘
```

### 3. War Simulator (`frontend/src/components/strategy/WarSimulator.tsx`)

```tsx
// Interactive war outcome predictor:
//
// ┌────────────────────────────────────────────┐
// │ ⚔️ WAR SIMULATOR                           │
// ├────────────────────────────────────────────┤
// │ CURRENT STATE:                             │
// │ Our Attack: ⚔️ 20  |  Their Defense: 🛡️ 12 │
// │ Our Defense: 🛡️ 16  |  Their Attack: ⚔️ 10 │
// │                                            │
// │ IF WE ATTACK:                              │
// │ 🟢 We WIN — Gain 150 gold (25% of 600)    │
// │                                            │
// │ IF THEY ATTACK:                            │
// │ 🟢 We DEFEND — They lose 50 gold           │
// │                                            │
// │ "WHAT IF" BUILDER:                         │
// │ + 1 more Castle → Attack: 30 ✅            │
// │ + 1 more Wall → Defense: 24 ✅             │
// │                                            │
// │ AI SAYS: "Build one more castle before     │
// │ declaring war. This guarantees victory."   │
// └────────────────────────────────────────────┘
```

### 4. Economy Planner (`frontend/src/components/strategy/EconomyPlanner.tsx`)

```tsx
// Gold income projections:
//
// Current gold/minute: +15 (3 farms)
// Current tax drain: -1.5/min (10% tax)
// Net income: +13.5/min
//
// Treasury projections:
// In 5 minutes: ~67 gold treasury growth
// In 10 minutes: ~135 gold treasury growth
//
// Build analysis:
// If you build another Farm: +5/min → total +18.5/min
// If you build a Castle: +0/min but +10 attack
// ROI: Farm pays for itself in 10 minutes
```

### 5. Ask Advisor Chat (`frontend/src/components/strategy/AdvisorChat.tsx`)

```tsx
// Direct chat with the AI advisor:
//
// Player: "Should I build a castle or a wall?"
// Advisor: "Given that the South has 2 castles (attack: 20) and we
//          have only 1 wall (defense: 8), I strongly recommend
//          building a Wall first. Our border is vulnerable. A wall
//          costs 80 gold and adds 8 defense, bringing us to 16.
//          After that, build a Castle to prepare for a counter-attack."
//
// Player: "What if they attack before I finish?"
// Advisor: "Their attack (20) exceeds our defense (8), so we'd lose
//          10% of our treasury. Build the wall urgently."
```

### 6. Threat Monitor (`ai-system/strategy/ThreatMonitor.ts`)

```typescript
export class ThreatMonitor {
  // Continuously monitors game state for threats:
  // - Enemy building castles → attack power increasing
  // - Enemy treasury growing → potential war fund
  // - Active war proposal against us
  // - Tax rate changes in enemy kingdom
  // - Enemy players buying tiles near our border

  assessThreats(gameState: GameState, kingdom: Kingdom): Threat[];
  getAlertLevel(): 'peaceful' | 'cautious' | 'alert' | 'danger';
  getRecommendedDefense(): BuildingType[];
}

export interface Threat {
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  timeframe: string;  // "immediate", "within 5 minutes", "long-term"
}
```

### 7. Strategy Prompt Templates

```markdown
# Strategy Advisor System Prompt

You are the Royal Strategy Advisor for the {kingdom} kingdom in Commonwealth.

You analyze the game state and provide strategic recommendations.
Be specific, quantitative, and actionable.

GAME STATE:
- Our tiles: {tileList}
- Our buildings: {buildings}
- Our gold: {gold} | Treasury: {treasury}
- Our attack: {attack} | Our defense: {defense}
- Enemy attack: {enemyAttack} | Enemy defense: {enemyDefense}
- Enemy treasury: {enemyTreasury}
- Tax rate: {taxRate}%
- Active proposals: {proposals}
- War cooldown: {cooldown}

ANALYSIS FRAMEWORK:
1. Economy: Are we producing enough gold? Should we build more farms?
2. Military: Can we win a war? Do we need more defenses?
3. Governance: Should we change tax rate? Distribute treasury?
4. Timing: Is this the right moment for any major action?

Provide your analysis in JSON format:
{
  "overallAssessment": "strong",
  "recommendations": [...],
  "threats": [...],
  "narrative": "A concise strategic summary..."
}
```

## Output Structure
```
ai-system/strategy/
├── StrategyAnalyzer.ts
├── ThreatMonitor.ts
└── prompts/
    └── strategy_prompt.md
frontend/src/components/strategy/
├── StrategyDashboard.tsx
├── WarSimulator.tsx
├── EconomyPlanner.tsx
├── AdvisorChat.tsx
└── ThreatAlerts.tsx
```

## Interface Contracts
- **Input from Agent 08:** AIAdapter for AI calls
- **Input from Agent 09:** NPC state and actions for coordinated strategy
- **Input from Agent 07:** Game state hooks
- **Output to Agent 15:** Strategy panels for integration

> The advisor should feel like having a brilliant strategist whispering in your ear. Make the analysis sharp, the predictions accurate, and the advice actionable.
