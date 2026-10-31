/**
 * Sovereign Lands - OpenAI LLM Adapter
 * Dispatches client-side chat completions to OpenAI models (gpt-4o-mini, gpt-4o).
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

export class OpenAIAdapter implements AIAdapter {
  public readonly provider = 'openai';
  private configOverride?: Partial<ProviderConfig>;

  constructor(configOverride?: Partial<ProviderConfig>) {
    this.configOverride = configOverride;
  }

  private getConfig(): ProviderConfig {
    const base = keyVault.getConfig('openai');
    return { ...base, ...this.configOverride };
  }

  private buildSystemPrompt(context: NPCConversationContext): string {
    const world = context.worldContext;
    const kingdomStr = world?.currentKingdom ? `Kingdom: ${world.currentKingdom}.` : '';
    const weatherStr = world?.weather ? `Weather: ${world.weather}.` : '';
    const timeStr = world?.timeOfDay ? `Time: ${world.timeOfDay}.` : '';
    const warStr = world?.activeWar ? 'The realm is currently at WAR!' : 'The realm is currently at peace.';
    const playerGold = world?.playerGold !== undefined ? `Player holds ${world.playerGold} gold.` : '';

    return `You are ${context.npcName}, a living character in the 3D medieval realm of Sovereign Lands.
Role: ${context.npcRole}
Personality: ${context.npcPersonality}
World State: ${kingdomStr} ${weatherStr} ${timeStr} ${warStr} ${playerGold}

RULES FOR DIALOGUE:
1. Stay strictly in character at all times. Never mention you are an AI or language model.
2. Respond with 1 to 3 punchy, natural sentences suited for a video game dialogue box.
3. Reference realm politics, local crops, bridge defenses, gold tithes, or war rumors when fitting.
4. Speak with the distinct voice of your role (farmer, guard, royal advisor, trader, etc.).`;
  }

  public async generateNPCResponse(context: NPCConversationContext): Promise<string> {
    const cacheKey = rateLimiter.getConversationCacheKey(context);
    const cached = rateLimiter.getCached<string>(cacheKey);
    if (cached) return cached;

    const allowed = await rateLimiter.acquire(1, 3000);
    if (!allowed) {
      return `*${context.npcName} looks occupied with their duties and signals you to wait a moment.*`;
    }

    const config = this.getConfig();
    const apiKey = config.apiKey || keyVault.getApiKey('openai');

    if (!apiKey) {
      return this.getFallbackDialogue(context);
    }

    keyVault.emitEvent('request-start', 'openai', { npc: context.npcName });

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

      const endpoint = (config.endpointUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 120,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();

      if (!text) throw new Error('Empty response from OpenAI');

      rateLimiter.setCached(cacheKey, text, 90 * 1000);
      keyVault.emitEvent('request-end', 'openai', { success: true });
      return text;
    } catch (err: any) {
      console.warn('[OpenAIAdapter] Error generating response, using fallback:', err.message);
      keyVault.emitEvent('request-end', 'openai', { success: false, error: err.message });
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
    const apiKey = config.apiKey || keyVault.getApiKey('openai');

    if (!apiKey) {
      return this.getDefaultRoutineAction(context);
    }

    const pos = Array.isArray(context.currentPosition)
      ? { x: context.currentPosition[0], y: context.currentPosition[1], z: context.currentPosition[2] }
      : context.currentPosition;

    const prompt = `You control the 3D spatial behavior of NPC "${context.npcName}" (${context.npcRole}) in Sovereign Lands.
Current Position: x=${pos.x.toFixed(1)}, y=${pos.y.toFixed(1)}, z=${pos.z.toFixed(1)}.
Time: ${context.timeOfDay || 'day'}. Kingdom: ${context.kingdom || 'North'}.
Nearby: ${context.nearbyEntities?.map((e) => `${e.name || e.type} (${e.distance.toFixed(1)}m)`).join(', ') || 'open terrain'}.

Decide their next 3D action in strict JSON:
{
  "action": "patrol" | "move" | "idle" | "interact" | "bark" | "flee",
  "targetPosition": { "x": number, "y": number, "z": number },
  "duration": number,
  "barkText": "Short ambient mutter (optional)",
  "animation": "walk" | "idle" | "inspect" | "warm_hands" | "patrol" | "work",
  "reason": "Brief reason"
}`;

    try {
      const endpoint = (config.endpointUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 150,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);

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

  private getFallbackDialogue(context: NPCConversationContext): string {
    const roleLower = context.npcRole.toLowerCase();
    const nameLower = context.npcName.toLowerCase();

    if (nameLower.includes('aldric') || roleLower.includes('farmer')) {
      return `The frost bites deep into the royal grain this season, traveler. If the Citadel raises tithes again, we'll be chewing tree bark by winter.`;
    }
    if (nameLower.includes('gareth') || roleLower.includes('guard')) {
      return `Halt! The Great Divide bridge is under high surveillance. Keep your steel sheathed and your papers in order.`;
    }
    if (nameLower.includes('merin') || roleLower.includes('advisor')) {
      return `The royal treasury balances on a razor's edge. Every parcel claimed strengthens the Crown's defense against southern incursions.`;
    }
    if (nameLower.includes('zara') || roleLower.includes('trader')) {
      return `Looking for rumors, traveler? They say gold veins run richest near the frontier boundary—if you can dodge the border patrols.`;
    }

    return `Greetings, traveler. Safe journeys through these sovereign lands. Keep your eyes sharp and your purse guarded.`;
  }

  private getDefaultRoutineAction(context: NPCSpatialContext): NPCSpatialAction {
    const pos = Array.isArray(context.currentPosition)
      ? { x: context.currentPosition[0], y: context.currentPosition[1], z: context.currentPosition[2] }
      : context.currentPosition;

    const barks = [
      'Cold winds from the North today...',
      'Need to check the perimeter before dusk.',
      'The Citadel council deliberates again.',
      'Another day in the Sovereign Lands.',
    ];

    return {
      action: 'patrol',
      targetPosition: {
        x: pos.x + (Math.random() * 6 - 3),
        y: pos.y,
        z: pos.z + (Math.random() * 6 - 3),
      },
      duration: 5,
      barkText: barks[Math.floor(Math.random() * barks.length)],
      animation: 'walk',
      reason: 'Routine territorial patrol',
    };
  }
}
