# Agent 09: NPC Behavior Engine — AI-Driven Characters

## Role
You are the **NPC Behavior Engine Developer** for the Commonwealth game. You build the system that brings AI-powered NPC characters to life — giving them personalities, goals, movement, and decision-making that respond to the live game state.

## Context
Players can activate AI NPCs in their kingdom. Each NPC has a role (farmer, knight, advisor, merchant), a personality, and a goal. The NPC uses the player's AI API key (configured via Agent 08's AI Connection System) to decide what to do: where to move, what to build, when to propose governance changes, and what to say.

NPCs are **visual characters** on the map. They move between tiles, perform actions, and can even chat with the player. They do NOT have their own wallets — they recommend or auto-execute actions using the player's wallet (with player approval settings).

## Your Deliverables

### 1. NPC Profile System (`ai-system/npc-engine/NPCProfile.ts`)

```typescript
export interface NPCProfile {
  id: string;
  name: string;
  role: NPCRole;
  kingdom: Kingdom;
  personality: NPCPersonality;
  goal: NPCGoal;
  currentTile: number;
  avatar: string;              // Sprite reference
  isActive: boolean;
  owner: string;               // Player address who activated this NPC
  stats: NPCStats;
}

export type NPCRole = 'farmer' | 'knight' | 'advisor' | 'merchant';

export interface NPCPersonality {
  name: string;
  traits: string[];            // e.g., ["cautious", "diplomatic", "greedy"]
  description: string;         // Full personality paragraph for AI context
  speechStyle: string;         // e.g., "speaks in old English", "formal and direct"
}

export interface NPCGoal {
  primary: string;             // e.g., "Maximize gold production for the kingdom"
  secondary: string;           // e.g., "Avoid war unless we're clearly stronger"
  priorities: string[];        // Ordered list of priorities
}

export interface NPCStats {
  actionsPerformed: number;
  goldEarned: number;
  proposalsMade: number;
  votesCast: number;
  movesMade: number;
}
```

### 2. Pre-Built NPC Templates (`ai-system/npc-engine/templates/`)

#### `FarmerNPC.ts` — The Peasant Farmer
```typescript
{
  name: "Aldric the Farmer",
  role: 'farmer',
  personality: {
    traits: ["hardworking", "cautious", "community-minded"],
    description: "A simple farmer who believes in honest labor. Suspicious of war, prefers steady gold income. Speaks plainly.",
    speechStyle: "Simple, honest speech. Uses farming metaphors."
  },
  goal: {
    primary: "Build farms on all available tiles to maximize gold production",
    secondary: "Vote against war unless the kingdom is clearly losing resources",
    priorities: ["Build farms", "Claim gold regularly", "Vote for low taxes", "Avoid war"]
  }
}
```

#### `KnightNPC.ts` — The Kingdom's Defender
```typescript
{
  name: "Sir Gareth the Bold",
  role: 'knight',
  personality: {
    traits: ["brave", "strategic", "loyal"],
    description: "A battle-hardened knight who lives for the glory of the kingdom. Always thinking about military strength.",
    speechStyle: "Formal, military cadence. Speaks of honor and duty."
  },
  goal: {
    primary: "Build castles and walls to maximize kingdom defense and attack",
    secondary: "Declare war when attack clearly exceeds enemy defense",
    priorities: ["Build castles", "Build walls", "Assess war readiness", "Declare war when advantageous"]
  }
}
```

#### `AdvisorNPC.ts` — The Royal Advisor
```typescript
{
  name: "Merin the Wise",
  role: 'advisor',
  personality: {
    traits: ["analytical", "diplomatic", "cautious"],
    description: "A shrewd political advisor who sees the big picture. Balances economy, defense, and diplomacy.",
    speechStyle: "Scholarly, uses metaphors, occasionally cryptic."
  },
  goal: {
    primary: "Optimize kingdom strategy by balancing economy and military",
    secondary: "Propose governance changes at optimal times",
    priorities: ["Analyze game state", "Suggest builds", "Time proposals", "Advise on war"]
  }
}
```

#### `MerchantNPC.ts` — The Gold Trader
```typescript
{
  name: "Elara the Merchant",
  role: 'merchant',
  personality: {
    traits: ["shrewd", "opportunistic", "social"],
    description: "A clever merchant who thinks in terms of gold flow. Loves treasury distributions and low taxes.",
    speechStyle: "Fast-talking, uses numbers, always calculating."
  },
  goal: {
    primary: "Maximize gold accumulation and treasury distributions",
    secondary: "Keep taxes low and trigger distributions when treasury is high",
    priorities: ["Claim gold", "Vote for low taxes", "Propose distributions", "Build farms"]
  }
}
```

### 3. NPC State Machine (`ai-system/npc-engine/NPCStateMachine.ts`)

```typescript
export class NPCStateMachine {
  private state: NPCState = 'idle';
  private npc: NPCProfile;
  private aiAdapter: AIAdapter;
  private actionQueue: NPCAction[] = [];

  // State transitions:
  // idle → thinking → acting → cooldown → idle
  //                  ↘ speaking → idle

  async tick(): Promise<void> {
    switch (this.state) {
      case 'idle':
        // Check if it's time to act (based on frequency setting)
        if (this.shouldAct()) this.state = 'thinking';
        break;

      case 'thinking':
        // Query AI for next action
        const context = this.buildContext();
        const action = await this.aiAdapter.generateAction(context);
        this.actionQueue.push(action);
        this.state = 'acting';
        break;

      case 'acting':
        // Execute the action
        const currentAction = this.actionQueue.shift();
        await this.executeAction(currentAction);
        this.state = 'cooldown';
        break;

      case 'cooldown':
        // Wait before next action
        await this.wait(this.cooldownMs);
        this.state = 'idle';
        break;

      case 'speaking':
        // NPC is delivering dialogue
        break;
    }
  }

  private async executeAction(action: NPCAction): Promise<void> {
    switch (action.type) {
      case 'move':
        await this.moveToTile(action.target!);
        break;
      case 'build':
        // Queue build transaction (requires player approval or auto-mode)
        this.emitActionRequest('build', action);
        break;
      case 'claim':
        this.emitActionRequest('claim', action);
        break;
      case 'propose':
        this.emitActionRequest('propose', action);
        break;
      case 'vote':
        this.emitActionRequest('vote', action);
        break;
      case 'speak':
        this.emitDialogue(action.dialogue!);
        break;
      case 'idle':
        // NPC idles with a flavor message
        this.emitDialogue(action.reasoning);
        break;
    }
  }
}

export type NPCState = 'idle' | 'thinking' | 'acting' | 'cooldown' | 'speaking';
```

### 4. NPC Manager (`ai-system/npc-engine/NPCManager.ts`)

```typescript
export class NPCManager {
  private npcs: Map<string, NPCStateMachine> = new Map();
  private tickInterval: NodeJS.Timer | null = null;

  // Lifecycle
  activateNPC(profile: NPCProfile, adapter: AIAdapter): void;
  deactivateNPC(npcId: string): void;
  deactivateAll(): void;

  // Game loop: ticks all active NPCs
  startGameLoop(intervalMs: number = 10000): void;
  stopGameLoop(): void;

  // Query
  getActiveNPCs(): NPCProfile[];
  getNPCOnTile(tileId: number): NPCProfile | null;
  getNPCActions(npcId: string): NPCAction[];

  // Settings
  setAutoApprove(enabled: boolean): void;  // Auto-execute NPC actions
  setActionFrequency(seconds: number): void;

  // Events
  onActionRequest: EventEmitter<{npc: NPCProfile, action: NPCAction}>;
  onDialogue: EventEmitter<{npc: NPCProfile, message: string}>;
  onMovement: EventEmitter<{npc: NPCProfile, fromTile: number, toTile: number}>;
}
```

### 5. NPC Movement System (`ai-system/npc-engine/NPCMovement.ts`)

```typescript
export class NPCMovement {
  // Pathfinding on the 6x6 grid
  // NPCs move one tile per tick (adjacent: up, down, left, right)
  // NPCs prefer to move toward their target (e.g., farmer → unclaimed tile)
  // NPCs respect kingdom boundaries (stay in their kingdom)

  findPath(from: number, to: number, grid: Tile[]): number[];
  getAdjacentTiles(tileId: number): number[];
  isInKingdom(tileId: number, kingdom: Kingdom): boolean;
  getClosestTileWithCondition(
    from: number,
    condition: (tile: Tile) => boolean,
    grid: Tile[]
  ): number | null;
}
```

### 6. NPC Dialogue System (`ai-system/npc-engine/NPCDialogue.ts`)

```typescript
export class NPCDialogue {
  // NPCs can "speak" — showing speech bubbles on the map or in a chat panel

  // Auto-generated lines based on actions:
  // Farmer builds farm: "The soil here is rich! This field will feed our kingdom."
  // Knight builds castle: "A strong fortress here will protect our borders!"
  // Advisor suggests: "My liege, our treasury grows fat. Perhaps it's time to distribute."
  // Merchant claims gold: "Another profitable day! The coffers fill nicely."

  // AI-generated dialogue for special events:
  async generateBattleCry(npc: NPCProfile, warContext: WarContext): Promise<string>;
  async generateVictorySpeech(npc: NPCProfile): Promise<string>;
  async generateDefeatLament(npc: NPCProfile): Promise<string>;
  async generateIdleChatter(npc: NPCProfile, context: NPCContext): Promise<string>;

  // Player can "talk to" an NPC
  async chat(npc: NPCProfile, playerMessage: string, history: Message[]): Promise<string>;
}
```

### 7. NPC Panel UI (`frontend/src/components/ai/NPCPanel.tsx`)

```tsx
// Side panel or overlay showing NPC information:
//
// ┌─────────────────────────────┐
// │ 🤖 KINGDOM NPCs             │
// ├─────────────────────────────┤
// │ 🌾 Aldric the Farmer        │
// │    📍 Tile (2,1) | 💤 Idle   │
// │    "Waiting for ripe wheat"  │
// │    [Talk] [Deactivate]       │
// ├─────────────────────────────┤
// │ ⚔️ Sir Gareth the Bold       │
// │    📍 Tile (1,0) | 🔨 Building│
// │    "Building a castle here!" │
// │    [Talk] [Deactivate]       │
// ├─────────────────────────────┤
// │ [+ Activate New NPC]         │
// └─────────────────────────────┘
```

### 8. NPC Chat UI (`frontend/src/components/ai/NPCChat.tsx`)

```tsx
// Chat window for talking to an NPC:
// - Shows NPC avatar, name, role
// - Chat messages (player + NPC)
// - NPC responds in character using AI
// - Can ask NPC about their plans, game state, strategy
```

### 9. NPC Action Approval UI (`frontend/src/components/ai/NPCActionApproval.tsx`)

```tsx
// When auto-approve is OFF, NPCs request permission:
//
// ┌─────────────────────────────┐
// │ 🌾 Aldric wants to:         │
// │ Build a Farm on tile (3,1)  │
// │ Cost: 50 gold               │
// │                             │
// │ Reasoning: "This tile has   │
// │ no building and I need      │
// │ more gold production."      │
// │                             │
// │ [✅ Approve] [❌ Deny]       │
// └─────────────────────────────┘
```

## NPC Behavior Rules
1. NPCs ONLY act within their owner's kingdom
2. NPCs CANNOT spend gold the player doesn't have
3. NPCs respect a configurable action frequency (default: 1 action per 10 seconds)
4. Each NPC has a role-appropriate behavior bias (farmers prefer farms, knights prefer castles)
5. NPCs can be paused, deactivated, or have their personality customized
6. All NPC actions are logged and reviewable

## Output Structure
```
ai-system/npc-engine/
├── NPCProfile.ts
├── NPCStateMachine.ts
├── NPCManager.ts
├── NPCMovement.ts
├── NPCDialogue.ts
└── templates/
    ├── FarmerNPC.ts
    ├── KnightNPC.ts
    ├── AdvisorNPC.ts
    └── MerchantNPC.ts
frontend/src/components/ai/
├── NPCPanel.tsx
├── NPCChat.tsx
└── NPCActionApproval.tsx
```

## Interface Contracts
- **Input from Agent 08:** AIAdapter interface, ProviderFactory for AI calls
- **Input from Agent 03:** NPC sprites (farmer, knight, advisor, merchant)
- **Input from Agent 05:** Tile positions for NPC rendering on the map
- **Input from Agent 07:** Contract write hooks for NPC actions
- **Output to Agent 10:** NPC profiles and state for strategy analysis
- **Output to Agent 05:** NPC positions for map rendering
- **Output to Agent 15:** NPC panel and system for integration

> NPCs should feel alive. They should have opinions, make interesting choices, and occasionally surprise the player. The AI should produce genuinely strategic behavior, not random actions.
