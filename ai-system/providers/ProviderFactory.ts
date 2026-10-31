/**
 * Sovereign Lands - AI Provider Factory
 * Unified provider hub that dynamically selects and instantiates the active LLM adapter.
 * Provides fallback mock adapter for instant offline testing and development.
 */

import {
  AIAdapter,
  AIProviderType,
  NPCConversationContext,
  NPCSpatialContext,
  NPCSpatialAction,
  ProviderConfig,
} from './types';
import { keyVault } from './KeyVault';
import { OpenCodeAdapter } from './OpenCodeAdapter';
import { OpenAIAdapter } from './OpenAIAdapter';
import { GeminiAdapter } from './GeminiAdapter';
import { AnthropicAdapter } from './AnthropicAdapter';
import { OllamaAdapter } from './OllamaAdapter';

/**
 * Built-in Offline Mock Adapter
 * Generates instant, context-aware medieval NPC dialogue without requiring any API keys.
 */
export class MockMedievalAdapter implements AIAdapter {
  public readonly provider = 'mock';

  public async generateNPCResponse(context: NPCConversationContext): Promise<string> {
    // Artificial realistic thinking delay (150-300ms)
    await new Promise((r) => setTimeout(r, 200));

    const name = context.npcName.toLowerCase();
    const role = context.npcRole.toLowerCase();
    const msg = context.playerMessage.toLowerCase();

    // Check query keywords
    if (msg.includes('gold') || msg.includes('coin') || msg.includes('money')) {
      if (name.includes('aldric')) {
        return `Gold is scarce when the Crown claims ten parts in a hundred! Harvest early before the winter frost kills the barley.`;
      }
      if (name.includes('zara')) {
        return `Coin speaks every language across the Great Divide. Bring me 50 gold and I'll share what the scouts discovered in the valley.`;
      }
      return `Gold fuels the kingdom's expansion. Guard your pouch well in these lawless territories.`;
    }

    if (msg.includes('war') || msg.includes('battle') || msg.includes('enemy')) {
      if (name.includes('gareth')) {
        return `Our blades are honed and the ballistas are primed. If the Southerners step across the bridge, blood will grease the river stones.`;
      }
      if (name.includes('merin')) {
        return `War is costly, yet indecision costs more. The Citadel is tabulating defense ratings of every bordering parcel.`;
      }
      return `Rumors of conflict spread like wildfire across the frontier. Prepare yourself.`;
    }

    if (msg.includes('council') || msg.includes('vote') || msg.includes('citadel')) {
      return `The Town Hall in the Citadel welcomes all lords. Press [V] when you reach the council chamber to cast your vote!`;
    }

    // Role-specific defaults
    if (name.includes('aldric') || role.includes('farmer')) {
      return `Aye, traveler. Another cold dawn in the North. Mind you don't trample the wheat while you wander.`;
    }
    if (name.includes('gareth') || role.includes('guard')) {
      return `Halt! The Great Divide checkpoint is under sovereign decree. Identify your allegiance, traveler.`;
    }
    if (name.includes('merin') || role.includes('advisor')) {
      return `Greetings, Lord. The treasury records show steady gains from frontier harvests. What counsel do you seek?`;
    }
    if (name.includes('zara') || role.includes('trader')) {
      return `Well met! Rare silks, seasoned steel, or spicy rumors—Zara's caravan has what a discerning traveler needs.`;
    }
    if (name.includes('eleanor') || role.includes('botanist') || role.includes('park')) {
      return `The park is peaceful today, traveler. May the fragrance of blooming lavender ease your journey.`;
    }
    if (name.includes('torvald') || role.includes('smith')) {
      return `Good steel and steady iron! Tell me what you need forged for your estate, and I'll strike it true.`;
    }
    if (name.includes('lyra') || role.includes('bard') || role.includes('minstrel')) {
      return `Ah, a song for your ears! Tales of valiant heroes and lost kingdoms echo across this very square!`;
    }
    if (name.includes('cedric') || role.includes('merchant')) {
      return `Step right up! Fine building timber, mountain minerals, and silk bolts fresh from the caravan!`;
    }
    if (name.includes('beatrice') || role.includes('healer') || role.includes('priestess')) {
      return `Blessings upon you, traveler. Drink from the mountain spring and rest your weary soul beneath the sanctuary.`;
    }
    if (name.includes('kaelen') || role.includes('ranger') || role.includes('scout')) {
      return `Keep your eyes on the high ridges, traveler. The perimeter mountain trails are cold and unforgiving.`;
    }

    return `Greetings, wanderer. Walk carefully upon these sovereign lands; adventure and danger share the same road.`;
  }

  public async generateNPCRoutineAction(context: NPCSpatialContext): Promise<NPCSpatialAction> {
    const pos = Array.isArray(context.currentPosition)
      ? { x: context.currentPosition[0], y: context.currentPosition[1], z: context.currentPosition[2] }
      : context.currentPosition;

    const barks = [
      'The wind carries the scent of pine and distant campfires.',
      'Must ensure the perimeter is secure.',
      'Another hour, another patrol around the boundary.',
      'The Citadel towers look imposing under this sky.',
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
      reason: 'Standard patrol round',
    };
  }
}

export class ProviderFactory {
  private static instance: ProviderFactory | null = null;
  private adapterCache: Map<string, AIAdapter> = new Map();
  private mockAdapter: MockMedievalAdapter = new MockMedievalAdapter();

  private constructor() {
    // Clear cached adapters if key or provider changes
    keyVault.subscribe((payload) => {
      if (payload.type === 'key-updated' || payload.type === 'provider-changed') {
        this.adapterCache.clear();
      }
    });
  }

  public static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }

  /**
   * Returns the currently active AI adapter configured in KeyVault
   */
  public getActiveAdapter(): AIAdapter {
    const activeProvider = keyVault.getActiveProvider();
    return this.getAdapter(activeProvider);
  }

  /**
   * Returns adapter for a specific provider type
   */
  public getAdapter(provider: AIProviderType): AIAdapter {
    if (provider === 'mock') {
      return this.mockAdapter;
    }

    if (this.adapterCache.has(provider)) {
      return this.adapterCache.get(provider)!;
    }

    const config = keyVault.getConfig(provider);
    let adapter: AIAdapter;

    switch (provider) {
      case 'opencode':
        adapter = new OpenCodeAdapter(config);
        break;
      case 'openai':
        adapter = new OpenAIAdapter(config);
        break;
      case 'gemini':
        adapter = new GeminiAdapter(config);
        break;
      case 'anthropic':
        adapter = new AnthropicAdapter(config);
        break;
      case 'ollama':
        adapter = new OllamaAdapter(config);
        break;
      case 'custom':
        adapter = new OpenAIAdapter({
          ...config,
          endpointUrl: config.endpointUrl || 'http://localhost:8000/v1',
        });
        break;
      default:
        adapter = this.mockAdapter;
        break;
    }

    this.adapterCache.set(provider, adapter);
    return adapter;
  }

  /**
   * Helper shortcut to generate dialogue response using current active provider
   */
  public async generateNPCResponse(context: NPCConversationContext): Promise<string> {
    const adapter = this.getActiveAdapter();
    try {
      return await adapter.generateNPCResponse(context);
    } catch (err) {
      console.warn('[ProviderFactory] Active adapter failed, falling back to mock:', err);
      return await this.mockAdapter.generateNPCResponse(context);
    }
  }

  /**
   * Helper shortcut to stream dialogue response in real-time
   */
  public async generateNPCResponseStream(
    context: NPCConversationContext,
    onToken: (chunk: string, fullText: string) => void
  ): Promise<string> {
    const adapter = this.getActiveAdapter();
    try {
      if (adapter.generateNPCResponseStream) {
        return await adapter.generateNPCResponseStream(context, onToken);
      }
      const full = await adapter.generateNPCResponse(context);
      onToken(full, full);
      return full;
    } catch (err) {
      console.warn('[ProviderFactory] Active adapter stream failed, falling back to mock:', err);
      const mockText = await this.mockAdapter.generateNPCResponse(context);
      onToken(mockText, mockText);
      return mockText;
    }
  }

  /**
   * Helper shortcut to generate spatial routine action using current active provider
   */
  public async generateNPCRoutineAction(context: NPCSpatialContext): Promise<NPCSpatialAction> {
    const adapter = this.getActiveAdapter();
    try {
      return await adapter.generateNPCRoutineAction(context);
    } catch (err) {
      console.warn('[ProviderFactory] Active adapter spatial failed, falling back to mock:', err);
      return await this.mockAdapter.generateNPCRoutineAction(context);
    }
  }
}

export const providerFactory = ProviderFactory.getInstance();
