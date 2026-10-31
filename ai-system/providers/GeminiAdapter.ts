/**
 * Sovereign Lands - Google Gemini LLM Adapter
 * Dispatches client-side REST queries to Google Gemini API (gemini-2.0-flash, gemini-1.5-flash).
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

export class GeminiAdapter implements AIAdapter {
  public readonly provider = 'gemini';
  private configOverride?: Partial<ProviderConfig>;

  constructor(configOverride?: Partial<ProviderConfig>) {
    this.configOverride = configOverride;
  }

  private getConfig(): ProviderConfig {
    const base = keyVault.getConfig('gemini');
    return { ...base, ...this.configOverride };
  }

  private buildSystemPrompt(context: NPCConversationContext): string {
    const world = context.worldContext;
    const kingdomStr = world?.currentKingdom ? `Kingdom: ${world.currentKingdom}.` : '';
    const weatherStr = world?.weather ? `Weather: ${world.weather}.` : '';
    const timeStr = world?.timeOfDay ? `Time of day: ${world.timeOfDay}.` : '';
    const warStr = world?.activeWar ? 'The realm is in a state of OPEN WAR!' : 'The realm enjoys uneasy peace.';
    const goldStr = world?.playerGold !== undefined ? `Player possesses ${world.playerGold} gold.` : '';

    return `You are ${context.npcName}, a resident of the 3D medieval realm of Sovereign Lands.
Character Role: ${context.npcRole}
Personality: ${context.npcPersonality}
Environment: ${kingdomStr} ${weatherStr} ${timeStr} ${warStr} ${goldStr}

INSTRUCTIONS:
1. Always stay in character. Speak in first-person as a medieval fantasy / GTA-style game NPC.
2. Deliver 1-3 concise, lively sentences suitable for a bottom dialogue box.
3. React naturally to the player's message and current realm events.
4. Never mention artificial intelligence, prompt guidelines, or break the fourth wall.`;
  }

  public async generateNPCResponse(context: NPCConversationContext): Promise<string> {
    const cacheKey = rateLimiter.getConversationCacheKey(context);
    const cached = rateLimiter.getCached<string>(cacheKey);
    if (cached) return cached;

    const allowed = await rateLimiter.acquire(1, 1500);
    if (!allowed) {
      const waitSec = rateLimiter.getRetryAfterSeconds();
      keyVault.setLastError({
        code: 'RATE_LIMIT_EXCEEDED',
        provider: 'gemini',
        message: `AI Rate Limit Reached: Gemini quota throttled (${rateLimiter.getLimit()} req/min limit).`,
        details: `Throttled to avoid API exhaustion. Resumes in ~${waitSec}s.`,
        retryAfterSeconds: waitSec,
        timestamp: Date.now(),
      });
      return this.getFallbackDialogue(context);
    }

    const config = this.getConfig();
    const apiKey = config.apiKey || keyVault.getApiKey('gemini');

    if (!apiKey) {
      keyVault.setLastError({
        code: 'NO_API_KEY',
        provider: 'gemini',
        message: 'Google Gemini API Key Not Connected.',
        details: 'Please add your Google Gemini API key in Settings [K] or switch to Offline Mock Mode.',
        timestamp: Date.now(),
      });
      return this.getFallbackDialogue(context);
    }

    keyVault.emitEvent('request-start', 'gemini', { npc: context.npcName });

    try {
      const contents: any[] = [];

      if (context.conversationHistory && context.conversationHistory.length > 0) {
        for (const msg of context.conversationHistory.slice(-4)) {
          contents.push({
            role: msg.role === 'player' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: context.playerMessage }],
      });

      const endpoint = (config.endpointUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
      const model = config.model || 'gemini-2.0-flash';
      const url = `${endpoint}/models/${model}:generateContent?key=${apiKey}`;

      const requestBody = {
        system_instruction: {
          parts: [{ text: this.buildSystemPrompt(context) }],
        },
        contents,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 140,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Gemini HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!text) throw new Error('Empty response from Gemini');

      rateLimiter.setCached(cacheKey, text, 90 * 1000);
      keyVault.clearError();
      keyVault.emitEvent('request-end', 'gemini', { success: true });
      return text;
    } catch (err: any) {
      console.warn('[GeminiAdapter] Error in generateNPCResponse:', err.message);
      const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
      const isAuth = err.message?.includes('401') || err.message?.includes('403') || err.message?.includes('API_KEY_INVALID');
      keyVault.setLastError({
        code: isQuota ? 'QUOTA_EXHAUSTED' : isAuth ? 'INVALID_API_KEY' : 'NETWORK_ERROR',
        provider: 'gemini',
        message: isQuota
          ? 'Gemini API Quota Exceeded (HTTP 429).'
          : isAuth
          ? 'Gemini API Key Authentication Failed (401/403).'
          : `Gemini API Error: ${err.message}`,
        details: err.message,
        timestamp: Date.now(),
      });
      keyVault.emitEvent('request-end', 'gemini', { success: false, error: err.message });
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
    const apiKey = config.apiKey || keyVault.getApiKey('gemini');

    if (!apiKey) {
      return this.getDefaultRoutineAction(context);
    }

    const pos = Array.isArray(context.currentPosition)
      ? { x: context.currentPosition[0], y: context.currentPosition[1], z: context.currentPosition[2] }
      : context.currentPosition;

    const promptText = `Determine 3D NPC spatial action for "${context.npcName}" (${context.npcRole}) in Sovereign Lands.
Position: x=${pos.x.toFixed(1)}, y=${pos.y.toFixed(1)}, z=${pos.z.toFixed(1)}.
Time: ${context.timeOfDay || 'day'}. Realm: ${context.kingdom || 'North'}.
Output ONLY raw JSON matching:
{
  "action": "patrol",
  "targetPosition": { "x": ${pos.x.toFixed(1)}, "y": ${pos.y.toFixed(1)}, "z": ${pos.z.toFixed(1)} },
  "duration": 5,
  "barkText": "Short ambient voice bark",
  "animation": "walk",
  "reason": "Patrolling border"
}`;

    try {
      const endpoint = (config.endpointUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
      const model = config.model || 'gemini-2.0-flash';
      const url = `${endpoint}/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 160,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
      return `Look at these frostbitten stalks... If the North doesn't secure lower tithes at the Citadel, many barns will sit empty.`;
    }
    if (nameLower.includes('gareth') || roleLower.includes('guard')) {
      return `Eyes front! No scoundrels cross the Great Divide on my watch. Keep your weapons peace-tied in town.`;
    }
    if (nameLower.includes('merin') || roleLower.includes('advisor')) {
      return `The balance of power shifts with each parcel claimed. A wise sovereign invests in defensive towers before seeking war.`;
    }
    if (nameLower.includes('zara') || roleLower.includes('trader')) {
      return `Got coin? I carry goods from across the divide. Don't ask how I passed the bridge checkpoints.`;
    }

    return `Hail, citizen. The winds of Sovereign Lands blow fierce today. What brings you to this district?`;
  }

  private getDefaultRoutineAction(context: NPCSpatialContext): NPCSpatialAction {
    const pos = Array.isArray(context.currentPosition)
      ? { x: context.currentPosition[0], y: context.currentPosition[1], z: context.currentPosition[2] }
      : context.currentPosition;

    return {
      action: 'patrol',
      targetPosition: {
        x: pos.x + (Math.random() * 5 - 2.5),
        y: pos.y,
        z: pos.z + (Math.random() * 5 - 2.5),
      },
      duration: 6,
      barkText: 'Inspecting territory boundaries.',
      animation: 'walk',
      reason: 'Ambient patrol behavior',
    };
  }
}
