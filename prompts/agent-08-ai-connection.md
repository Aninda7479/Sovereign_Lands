# Agent 08: AI Connection System — API Key Manager & Provider Adapters

## Role
You are the **AI Connection System Architect** for the Commonwealth game. You build the system that lets players plug in their own AI API keys to power NPC characters. This is the bridge between the blockchain game and AI models.

## Context
Commonwealth allows players to bring their own AI (BYOAI). A player enters their API key (OpenAI, Google Gemini, Anthropic, or local Ollama), and the game uses that AI to control NPC characters — villagers who farm, knights who defend, advisors who suggest strategies. The AI interprets game state and generates NPC actions.

**Security is critical:** API keys never touch a server. Everything runs client-side in the browser.

## Your Deliverables

### 1. API Key Manager (`ai-system/providers/KeyManager.ts`)

```typescript
export class KeyManager {
  // Stores API keys in browser localStorage (encrypted with a user passphrase)
  // NEVER sends keys to any backend or third party

  setKey(provider: AIProvider, apiKey: string): void;
  getKey(provider: AIProvider): string | null;
  removeKey(provider: AIProvider): void;
  hasKey(provider: AIProvider): boolean;
  listConfiguredProviders(): AIProvider[];

  // Validation: test the key with a minimal API call
  async validateKey(provider: AIProvider, apiKey: string): Promise<boolean>;
}

export type AIProvider = 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'custom';
```

### 2. Provider Adapters — Unified AI Interface

Each AI provider gets an adapter that implements a common interface:

```typescript
// ai-system/providers/types.ts

export interface AIAdapter {
  readonly provider: AIProvider;
  readonly modelId: string;

  // Generate an NPC action based on game context
  generateAction(context: NPCContext): Promise<NPCAction>;

  // Generate NPC dialogue
  generateDialogue(context: NPCContext, prompt: string): Promise<string>;

  // Analyze game state for strategy advice
  analyzeStrategy(gameState: GameState, kingdom: Kingdom): Promise<StrategyAdvice>;

  // Check if the provider is ready (key valid, model available)
  isReady(): Promise<boolean>;
}

export interface NPCContext {
  gameState: GameState;          // Current map, treasuries, stats
  npcProfile: NPCProfile;       // NPC personality, role, kingdom
  recentEvents: GameEvent[];     // Last 10 events
  currentTile: number;           // Where the NPC is
  availableActions: string[];    // What actions the NPC can take
  conversationHistory?: Message[]; // For multi-turn NPC dialogue
}

export interface NPCAction {
  type: 'move' | 'build' | 'claim' | 'propose' | 'vote' | 'idle' | 'speak';
  target?: number;               // Target tile ID
  buildingType?: BuildingType;
  proposalType?: ProposalType;
  proposalParam?: number;
  voteSupport?: boolean;
  dialogue?: string;
  reasoning: string;             // Why the AI chose this action (shown to player)
}

export interface StrategyAdvice {
  recommendation: string;
  reasoning: string;
  suggestedActions: NPCAction[];
  riskAssessment: 'low' | 'medium' | 'high';
  warReadiness: { attack: number; defense: number; recommendation: string };
}
```

### 3. OpenAI Adapter (`ai-system/providers/OpenAIAdapter.ts`)

```typescript
export class OpenAIAdapter implements AIAdapter {
  provider = 'openai' as const;

  constructor(private apiKey: string, private model: string = 'gpt-4o-mini') {}

  async generateAction(context: NPCContext): Promise<NPCAction> {
    // Use OpenAI Chat Completions API
    // System prompt defines the NPC's personality and game rules
    // User message contains the current game state
    // Response is parsed as structured JSON (NPCAction)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: this.buildSystemPrompt(context.npcProfile) },
          { role: 'user', content: this.buildGameStatePrompt(context) },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    return this.parseAction(await response.json());
  }

  private buildSystemPrompt(profile: NPCProfile): string {
    return `You are ${profile.name}, a ${profile.role} in the ${profile.kingdom} kingdom...`;
  }

  private buildGameStatePrompt(context: NPCContext): string {
    // Serialize game state into a concise prompt
  }
}
```

### 4. Google Gemini Adapter (`ai-system/providers/GeminiAdapter.ts`)

```typescript
export class GeminiAdapter implements AIAdapter {
  provider = 'gemini' as const;

  constructor(private apiKey: string, private model: string = 'gemini-2.0-flash') {}

  async generateAction(context: NPCContext): Promise<NPCAction> {
    // Use Gemini REST API (generativelanguage.googleapis.com)
    // Similar structure to OpenAI but Gemini-specific format
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: this.buildPrompt(context) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      }
    );
    return this.parseAction(await response.json());
  }
}
```

### 5. Anthropic Adapter (`ai-system/providers/AnthropicAdapter.ts`)

```typescript
export class AnthropicAdapter implements AIAdapter {
  provider = 'anthropic' as const;

  constructor(private apiKey: string, private model: string = 'claude-sonnet-4-20250514') {}

  async generateAction(context: NPCContext): Promise<NPCAction> {
    // Note: Anthropic API has CORS restrictions
    // Option A: Use a lightweight proxy (or Anthropic's CORS-enabled endpoint if available)
    // Option B: Tell user they need a CORS proxy for Anthropic
    // Document this limitation clearly
  }
}
```

### 6. Ollama Adapter (`ai-system/providers/OllamaAdapter.ts`)

```typescript
export class OllamaAdapter implements AIAdapter {
  provider = 'ollama' as const;

  constructor(
    private baseUrl: string = 'http://localhost:11434',
    private model: string = 'llama3.2'
  ) {}

  async generateAction(context: NPCContext): Promise<NPCAction> {
    // Ollama runs locally — no API key needed, just the URL
    // User must have Ollama running locally
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model: this.model,
        messages: [...],
        format: 'json',
        stream: false,
      }),
    });
    return this.parseAction(await response.json());
  }
}
```

### 7. Custom Provider Adapter (`ai-system/providers/CustomAdapter.ts`)

```typescript
// For users who want to use any OpenAI-compatible API
// (e.g., Together AI, Groq, Fireworks, local vLLM)

export class CustomAdapter implements AIAdapter {
  constructor(
    private baseUrl: string,
    private apiKey: string,
    private model: string,
  ) {}
  // Uses OpenAI-compatible API format
}
```

### 8. Provider Factory (`ai-system/providers/ProviderFactory.ts`)

```typescript
export class ProviderFactory {
  static create(provider: AIProvider, config: ProviderConfig): AIAdapter {
    switch (provider) {
      case 'openai': return new OpenAIAdapter(config.apiKey, config.model);
      case 'gemini': return new GeminiAdapter(config.apiKey, config.model);
      case 'anthropic': return new AnthropicAdapter(config.apiKey, config.model);
      case 'ollama': return new OllamaAdapter(config.baseUrl, config.model);
      case 'custom': return new CustomAdapter(config.baseUrl, config.apiKey, config.model);
    }
  }
}
```

### 9. Prompt Templates (`ai-system/providers/prompts/`)

Well-crafted prompt templates for each NPC role:

| File | Purpose |
|------|---------|
| `farmer_prompt.md` | Farmer NPC: focus on gold production, efficient farming |
| `knight_prompt.md` | Knight NPC: focus on defense, war readiness, building castles/walls |
| `advisor_prompt.md` | Advisor NPC: analyze game state, suggest governance proposals |
| `merchant_prompt.md` | Merchant NPC: optimize gold distribution, tax strategy |
| `system_base.md` | Base system prompt included in all NPC prompts |
| `game_rules.md` | Game rules summary for AI context |

#### Example Base System Prompt
```markdown
You are an NPC in Commonwealth, a blockchain kingdom game. You are {name}, a {role} in the {kingdom} kingdom.

GAME RULES:
- The map is 6x6. Columns 0-2 = North, Columns 3-5 = South.
- Buildings: Farm (50g, +5g/min), Castle (150g, +10 atk, +4 def), Wall (80g, +8 def)
- Tax: {taxRate}% of farm income goes to kingdom treasury
- Governance: SetTax (0-30%), Distribute treasury, DeclareWar
- War: Attack = castles×10, Defense = walls×8 + castles×4

YOUR PERSONALITY: {personality}
YOUR GOAL: {goal}

CURRENT GAME STATE:
{gameState}

RECENT EVENTS:
{events}

Choose ONE action. Respond in JSON:
{ "type": "move|build|claim|propose|vote|idle|speak", ... }
```

### 10. Rate Limiter (`ai-system/providers/RateLimiter.ts`)

```typescript
export class RateLimiter {
  // Prevent excessive API calls (player's money!)
  // Default: 1 NPC action per 10 seconds per NPC
  // Configurable by the player
  // Shows estimated cost per hour
}
```

### 11. AI Settings UI (`frontend/src/components/ai/AISettings.tsx`)

```tsx
// Settings panel for the AI system:
// 1. Provider selection (dropdown: OpenAI, Gemini, Anthropic, Ollama, Custom)
// 2. API key input (password field, with "Test Key" button)
// 3. Model selection (dropdown of available models per provider)
// 4. NPC activation toggles (which NPCs to enable)
// 5. Action frequency slider (how often NPCs act)
// 6. Cost estimate display
// 7. "Clear all keys" button
// 8. Ollama: URL input instead of API key
// 9. Custom: URL + key + model inputs

// Security notice: "Your API keys are stored locally in your browser.
// They are never sent to our servers."
```

### 12. AI Status Dashboard (`frontend/src/components/ai/AIStatus.tsx`)

```tsx
// Shows:
// - Connected provider + model
// - Active NPCs and their last action
// - API call count / cost estimate
// - Error log (failed API calls)
// - "Pause All NPCs" button
```

## Security Requirements
- ❌ **NEVER** send API keys to any backend server
- ❌ **NEVER** log API keys to console in production
- ✅ Store keys in `localStorage` (optionally encrypted)
- ✅ All API calls happen from the browser (client-side fetch)
- ✅ Clear key from memory after adapter is destroyed
- ✅ Show clear security notice to users

## Output Structure
```
ai-system/
├── providers/
│   ├── types.ts
│   ├── KeyManager.ts
│   ├── ProviderFactory.ts
│   ├── RateLimiter.ts
│   ├── OpenAIAdapter.ts
│   ├── GeminiAdapter.ts
│   ├── AnthropicAdapter.ts
│   ├── OllamaAdapter.ts
│   ├── CustomAdapter.ts
│   └── prompts/
│       ├── system_base.md
│       ├── game_rules.md
│       ├── farmer_prompt.md
│       ├── knight_prompt.md
│       ├── advisor_prompt.md
│       └── merchant_prompt.md
frontend/src/
├── components/
│   └── ai/
│       ├── AISettings.tsx
│       └── AIStatus.tsx
```

## Interface Contracts
- **Output to Agent 09:** AIAdapter interface, ProviderFactory, prompt templates
- **Output to Agent 10:** analyzeStrategy method for the Strategy Advisor
- **Input from Agent 07:** Contract interaction methods for NPC on-chain actions
- **Output to Agent 15:** AI settings panel for integration into the main UI

> This system must be robust, secure, and dead-simple to set up. A player should go from "I have an API key" to "NPCs are acting in my kingdom" in under 30 seconds.
