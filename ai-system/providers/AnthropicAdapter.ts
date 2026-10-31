/**
 * Sovereign Lands - Anthropic Claude LLM Adapter
 * Dispatches client-side queries to Anthropic Claude models (Claude 3.5 Haiku, Claude 3.5 Sonnet).
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

export class AnthropicAdapter implements AIAdapter {
  public readonly provider = 'anthropic';
  private configOverride?: Partial<ProviderConfig>;

  constructor(configOverride?: Partial<ProviderConfig>) {
    this.configOverride = configOverride;
  }

  private getConfig(): ProviderConfig {
    const base = keyVault.getConfig('anthropic');
    return { ...base, ...this.configOverride };
  }

  private buildSystemPrompt(context: NPCConversationContext): string {
    const world = context.worldContext;
    const kingdomStr = world?.currentKingdom ? `Kingdom: ${world.currentKingdom}.` : '';
    const weatherStr = world?.weather ? `Weather: ${world.weather}.` : '';
    const timeStr = world?.timeOfDay ? `Time: ${world.timeOfDay}.` : '';
    const warStr = world?.activeWar ? 'WAR is active between North and South!' : 'The kingdom is at peace.';

    return `You are ${context.npcName}, a resident of Sovereign Lands, a 3D open-world medieval realm.
Role: ${context.npcRole}
Personality: ${context.npcPersonality}
Context: ${kingdomStr} ${weatherStr} ${timeStr} ${warStr}

GUIDELINES:
1. Speak fully in character with medieval vocabulary and tone.
2. Limit your reply to 1 to 3 engaging sentences suited for video game dialogue HUD.
3. React to player questions, realm gold tithes, territory claims, and bridge defense.
4. Do not prefix with your name or role. Never break character.`;
  }

  public async generateNPCResponse(context: NPCConversationContext): Promise<string> {
    const cacheKey = rateLimiter.getConversationCacheKey(context);
    const cached = rateLimiter.getCached<string>(cacheKey);
    if (cached) return cached;

    const allowed = await rateLimiter.acquire(1, 3000);
    if (!allowed) {
      return `*${context.npcName} nods curtly, too preoccupied with their duties to talk at length.*`;
    }

    const config = this.getConfig();
    const apiKey = config.apiKey || keyVault.getApiKey('anthropic');

    if (!apiKey) {
      return this.getFallbackDialogue(context);
    }

    keyVault.emitEvent('request-start', 'anthropic', { npc: context.npcName });

    try {
      const messages: any[] = [];

      if (context.conversationHistory && context.conversationHistory.length > 0) {
        for (const msg of context.conversationHistory.slice(-4)) {
          messages.push({
            role: msg.role === 'player' ? 'user' : 'assistant',
            content: msg.content,
          });
        }
      }

      messages.push({
        role: 'user',
        content: context.playerMessage,
      });

      const endpoint = (config.endpointUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
      const response = await fetch(`${endpoint}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-haiku-20241022',
          max_tokens: config.maxTokens ?? 140,
          temperature: config.temperature ?? 0.7,
          system: this.buildSystemPrompt(context),
          messages,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Anthropic HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data?.content?.[0]?.text?.trim();

      if (!text) throw new Error('Empty response from Anthropic Claude');

      rateLimiter.setCached(cacheKey, text, 90 * 1000);
      keyVault.emitEvent('request-end', 'anthropic', { success: true });
      return text;
    } catch (err: any) {
      console.warn('[AnthropicAdapter] Error generating response:', err.message);
      keyVault.emitEvent('request-end', 'anthropic', { success: false, error: err.message });
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
    const apiKey = config.apiKey || keyVault.getApiKey('anthropic');

    if (!apiKey) {
      return this.getDefaultRoutineAction(context);
    }

    const pos = Array.isArray(context.currentPosition)
      ? { x: context.currentPosition[0], y: context.currentPosition[1], z: context.currentPosition[2] }
      : context.currentPosition;

    const prompt = `You dictate 3D AI routine behavior for "${context.npcName}" (${context.npcRole}) in Sovereign Lands.
Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}).
Respond ONLY with a valid JSON object matching:
{
  "action": "patrol",
  "targetPosition": { "x": ${pos.x.toFixed(1)}, "y": ${pos.y.toFixed(1)}, "z": ${pos.z.toFixed(1)} },
  "duration": 5,
  "barkText": "Brief thought or ambient shout",
  "animation": "walk",
  "reason": "Patrolling border perimeter"
}`;

    try {
      const endpoint = (config.endpointUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
      const response = await fetch(`${endpoint}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-haiku-20241022',
          max_tokens: 160,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const rawText = data?.content?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

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
      return `Aye, these northern soils yield little when frost settles in. We labor hard while the lords squabble in their high towers.`;
    }
    if (nameLower.includes('gareth') || roleLower.includes('guard')) {
      return `Move along unless you have royal transit papers. No bandits or Southern spies shall cross this span unpunished.`;
    }
    if (nameLower.includes('merin') || roleLower.includes('advisor')) {
      return `The Crown's ledger demands prudent stewardship. If you wish to influence royal policy, cast your vote in Citadel council.`;
    }
    if (nameLower.includes('zara') || roleLower.includes('trader')) {
      return `Keep your coin close and your ears open. The frontier is rife with danger, but fortune favors the daring.`;
    }

    return `May fortune favor your path, traveler. The Sovereign Lands test the mettle of all who wander here.`;
  }

  private getDefaultRoutineAction(context: NPCSpatialContext): NPCSpatialAction {
    const pos = Array.isArray(context.currentPosition)
      ? { x: context.currentPosition[0], y: context.currentPosition[1], z: context.currentPosition[2] }
      : context.currentPosition;

    return {
      action: 'patrol',
      targetPosition: {
        x: pos.x + (Math.random() * 6 - 3),
        y: pos.y,
        z: pos.z + (Math.random() * 6 - 3),
      },
      duration: 5,
      barkText: 'The watch never ends.',
      animation: 'walk',
      reason: 'Standard guard round',
    };
  }
}
