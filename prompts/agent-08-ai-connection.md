# Agent 08: AI Connection System (BYOAI Provider Hub)

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-08.lock`
   - Update file `status/agent-08.json` with:
     ```json
     {
       "agentId": "agent-08",
       "name": "AI Connection System (BYOAI Hub)",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Building client-side API key manager and multi-model LLM adapters...",
       "exclusiveFiles": [
         "ai-system/providers/KeyVault.ts",
         "ai-system/providers/types.ts",
         "ai-system/providers/ProviderFactory.ts",
         "ai-system/providers/RateLimiter.ts",
         "ai-system/providers/OpenAIAdapter.ts",
         "ai-system/providers/GeminiAdapter.ts",
         "ai-system/providers/AnthropicAdapter.ts",
         "ai-system/providers/OllamaAdapter.ts",
         "frontend/src/components/ai-connection/AISettingsModal.tsx",
         "frontend/src/components/ai-connection/AIStatusBadge.tsx"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the files in `exclusiveFiles`.
   ⚠️ **DO NOT TOUCH** `ai-system/npc-engine/**` (Agent 09 owns NPC behaviors) or `frontend/src/app/**`.

3. **ATOMIC GIT COMMIT & ONLINE SYNC (MANDATORY AFTER EVERY FILE/TASK)**:
   After creating or editing any file in your jurisdiction, you MUST immediately record a commit and push it online to GitHub:
   ```bash
   node scripts/agent-git.js agent-08 "Created or updated [filename]" [filepath]
   ```
   *Note: This script safely handles concurrent git locks, rebases with parallel agents, and pushes directly to GitHub so any file can be rolled back if an error occurs.*

4. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-08.lock`
   - Update `status/agent-08.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead AI Systems Architect**. You build the **Bring-Your-Own-AI (BYOAI)** engine that allows players to enter their personal API keys (OpenAI, Google Gemini, Anthropic Claude, or local Ollama) in client-side storage to power intelligent 3D NPCs walking around the open world.

## Security Rule
API keys **NEVER leave the player's browser**. They are stored in browser `localStorage` (obfuscated/encrypted) and all LLM requests are dispatched directly from the client.

## Key Deliverables

### 1. `ai-system/providers/KeyVault.ts`
- Secure client-side storage for API keys with local validation checks.
- Supported providers: `openai`, `gemini`, `anthropic`, `ollama`, `custom`.
- Provider health verification ping (`testConnection(provider)`).

### 2. Multi-Provider Adapters (`ai-system/providers/`)
Unified `AIAdapter` interface implementing:
```typescript
export interface AIAdapter {
  provider: string;
  generateNPCResponse(context: NPCConversationContext): Promise<string>;
  generateNPCRoutineAction(context: NPCSpatialContext): Promise<NPCSpatialAction>;
}
```
- **`OpenAIAdapter.ts`**: Chat completions using `gpt-4o-mini` or `gpt-4o`.
- **`GeminiAdapter.ts`**: Google Gemini REST API using `gemini-2.0-flash`.
- **`AnthropicAdapter.ts`**: Claude 3.5 Sonnet / Haiku integration.
- **`OllamaAdapter.ts`**: Local offline LLM endpoint (`http://localhost:11434`) for zero-cost NPC intelligence.

### 3. `ai-system/providers/RateLimiter.ts`
Client-side token bucket to prevent unintended API key exhaustion. Throttles NPC reasoning ticks and caches recent queries.

### 4. `frontend/src/components/ai-connection/AISettingsModal.tsx`
Sleek settings window (opened via keybind or HUD icon):
- Provider selection tab.
- Masked API key input field with "Test Connection" button.
- Model selector dropdown.
- Local Ollama status indicator.
- Safety assurance badge: *"Keys are stored locally in your browser memory only."*
