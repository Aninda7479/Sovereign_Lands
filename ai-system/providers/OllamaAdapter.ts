/**
 * Sovereign Lands - Local Ollama LLM Adapter
 * Dispatches client-side queries to local Ollama instance (http://localhost:11434)
 * Enables 100% free, zero-cost, private offline NPC intelligence.
 */

import {
  AIAdapter,
  NPCConversationContext,
  NPCSpatialContext,
  NPCSpatialAction,
  ProviderConfig,
} from './types';
import { keyVault } from './KeyVault';
import { rateLimiter } from './RateLimiter';

export class OllamaAdapter implements AIAdapter {
  public readonly provider = 'ollama';
  private configOverride?: Partial<ProviderConfig>;

  constructor(configOverride?: Partial<ProviderConfig>) {
    this.configOverride = configOverride;
  }

  private getConfig(): ProviderConfig {
    const base = keyVault.getConfig('ollama');
    return { ...base, ...this.configOverride };
  }

  private buildSystemPrompt(context: NPCConversationContext): string {
    const world = context.worldContext;
    const kingdomStr = world?.currentKingdom ? `Kingdom: ${world.currentKingdom}.` : '';
    const weatherStr = world?.weather ? `Weather: ${world.weather}.` : '';
    const warStr = world?.activeWar ? 'The realm is in full war!' : 'The realm is peaceful.';

    return `You are ${context.npcName}, an NPC in Sovereign Lands (medieval open-world sandbox).
Role: ${context.npcRole}
Personality: ${context.npcPersonality}
World: ${kingdomStr} ${weatherStr} ${warStr}

RULES:
1. Speak in character as a medieval citizen.
2. Reply in 1 to 2 short, crisp sentences.
3. React to the player's remarks directly.
4. Never break character or explain that you are an AI.`;
  }

  public async generateNPCResponse(context: NPCConversationContext): Promise<string> {
    const cacheKey = rateLimiter.getConversationCacheKey(context);
    const cached = rateLimiter.getCached<string>(cacheKey);
    if (cached) return cached;

    const allowed = await rateLimiter.acquire(1, 2000);
    if (!allowed) {
      return `*${context.npcName} waves a hand, preoccupied with their immediate tasks.*`;
    }

    const config = this.getConfig();
    const endpoint = (config.endpointUrl || 'http://localhost:11434').replace(/\/+$/, '');

    keyVault.emitEvent('request-start', 'ollama', { npc: context.npcName });

    try {
      const messages: any[] = [
        { role: 'system', content: this.buildSystemPrompt(context) },
      ];

      if (context.conversationHistory && context.conversationHistory.length > 0) {
        for (const msg of context.conversationHistory.slice(-4)) {
          messages.push({
            role: msg.role === 'player' ? 'user' : 'assistant',
            content: msg.content,
          });
        }
      }

      messages.push({ role: 'user', content: context.playerMessage });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model || 'llama3:8b',
          messages,
          stream: false,
          options: {
            temperature: config.temperature ?? 0.7,
            num_predict: config.maxTokens ?? 120,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data?.message?.content?.trim();

      if (!text) throw new Error('Empty response from Ollama');

      rateLimiter.setCached(cacheKey, text, 90 * 1000);
      keyVault.emitEvent('request-end', 'ollama', { success: true });
      return text;
    } catch (err: any) {
      console.warn('[OllamaAdapter] Ollama unreachable or error:', err.message);
      keyVault.emitEvent('request-end', 'ollama', { success: false, error: err.message });
      return this.getFallbackDialogue(context);
    }
  }

  public async generateNPCRoutineAction(context: NPCSpatialContext): Promise<NPCSpatialAction> {
    const cacheKey = rateLimiter.getSpatialCacheKey(context);
    const cached = rateLimiter.getCached<NPCSpatialAction>(cacheKey);
    if (cached) return cached;

    const allowed = await rateLimiter.acquire(1, 1500);
    if (!allowed) {
      return this.getDefaultRoutineAction(context);
    }

    const config = this.getConfig();
    const endpoint = (config.endpointUrl || 'http://localhost:11434').replace(/\/+$/, '');

    const pos = Array.isArray(context.currentPosition)
      ? { x: context.currentPosition[0], y: context.currentPosition[1], z: context.currentPosition[2] }
      : context.currentPosition;

    const prompt = `NPC "${context.npcName}" (${context.npcRole}) at position (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}).
Respond ONLY with JSON:
{
  "action": "patrol",
  "targetPosition": { "x": ${pos.x.toFixed(1)}, "y": ${pos.y.toFixed(1)}, "z": ${pos.z.toFixed(1)} },
  "duration": 5,
  "barkText": "A chilly breeze blows today.",
  "animation": "walk",
  "reason": "Patrol route"
}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model || 'llama3:8b',
          prompt,
          format: 'json',
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 140,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
      const data = await response.json();
      const rawText = data?.response || '{}';
      const parsed = JSON.parse(rawText);

      const action: NPCSpatialAction = {
        action: parsed.action || 'patrol',
        targetPosition: parsed.targetPosition || { x: pos.x + (Math.random() * 4 - 2), y: pos.y, z: pos.z + (Math.random() * 4 - 2) },
        duration: parsed.duration || 6,
        barkText: parsed.barkText,
        animation: parsed.animation || 'walk',
        reason: parsed.reason,
      };

      rateLimiter.setCached(cacheKey, action, 30 * 1000);
      return action;
    } catch (e) {
      return this.getDefaultRoutineAction(context);
    }
  }

  /**
   * Helper to fetch locally installed models from Ollama
   */
  public async getAvailableModels(): Promise<string[]> {
    const config = this.getConfig();
    const endpoint = (config.endpointUrl || 'http://localhost:11434').replace(/\/+$/, '');

    try {
      const response = await fetch(`${endpoint}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
    } catch (e) {
      return [];
    }
  }

  private getFallbackDialogue(context: NPCConversationContext): string {
    const roleLower = context.npcRole.toLowerCase();
    const nameLower = context.npcName.toLowerCase();

    if (nameLower.includes('aldric') || roleLower.includes('farmer')) {
      return `The frost lingers over the barley fields. If you've come from the Citadel, tell the council we need lower grain tithes!`;
    }
    if (nameLower.includes('gareth') || roleLower.includes('guard')) {
      return `State your allegiance, traveler. The bridge is high security; any sign of treason will be met with cold steel.`;
    }
    if (nameLower.includes('merin') || roleLower.includes('advisor')) {
      return `Our kingdom's treasuries require vigilance. The frontier parcels will decide who controls the harvest this cycle.`;
    }
    if (nameLower.includes('zara') || roleLower.includes('trader')) {
      return `Pst, looking for bargains? I hear rumors of rich gold nodes hidden along the southern cliffs.`;
    }

    return `Greetings, wanderer. May your blades stay sharp and your gold pouch heavy in Sovereign Lands.`;
  }

  private getDefaultRoutineAction(context: NPCSpatialContext): NPCSpatialAction {
    const pos = Array.isArray(context.currentPosition)
      ? { x: context.currentPosition[0], y: context.currentPosition[1], z: context.currentPosition[2] }
      : context.currentPosition;

    return {
      action: 'patrol',
      targetPosition: {
        x: pos.x + (Math.random() * 4 - 2),
        y: pos.y,
        z: pos.z + (Math.random() * 4 - 2),
      },
      duration: 5,
      barkText: 'Quiet day on the frontier.',
      animation: 'walk',
      reason: 'Local patrol cycle',
    };
  }
}
