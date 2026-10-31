/**
 * Sovereign Lands - BYOAI Provider Types & Interfaces
 * Unifies client-side LLM adapters for OpenAI, Google Gemini, Anthropic Claude, and local Ollama.
 */

export type AIProviderType = 'opencode' | 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'custom' | 'mock';

export interface DialogueMessage {
  role: 'player' | 'npc' | 'system';
  content: string;
  timestamp?: number;
}

export interface NPCWorldContext {
  currentKingdom?: 'North' | 'South' | 'Neutral' | string;
  weather?: 'Clear' | 'Snow' | 'Rain' | 'Fog' | 'Storm' | string;
  timeOfDay?: 'Dawn' | 'Day' | 'Dusk' | 'Night' | string;
  activeWar?: boolean;
  nearbyBuildings?: string[];
  playerReputation?: 'Hero' | 'Outlaw' | 'Citizen' | 'Stranger' | string;
  playerGold?: number;
  playerParcelsCount?: number;
}

export interface NPCConversationContext {
  npcId: string;
  npcName: string;
  npcRole: string;
  npcPersonality: string;
  playerMessage: string;
  conversationHistory?: DialogueMessage[];
  worldContext?: NPCWorldContext;
}

export type NPCSpatialActionType = 'move' | 'idle' | 'interact' | 'patrol' | 'flee' | 'emote' | 'bark';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface NPCSpatialAction {
  action: NPCSpatialActionType;
  targetPosition?: [number, number, number] | Vector3D;
  duration?: number; // duration in seconds
  barkText?: string;
  animation?: 'idle' | 'walk' | 'run' | 'talk' | 'inspect' | 'warm_hands' | 'patrol' | 'work' | string;
  reason?: string;
}

export interface NearbyEntity {
  type: 'player' | 'npc' | 'building' | 'bridge' | 'torch' | 'gate' | string;
  id: string;
  name?: string;
  distance: number;
  position?: [number, number, number] | Vector3D;
}

export interface NPCSpatialContext {
  npcId: string;
  npcName: string;
  npcRole: string;
  currentPosition: [number, number, number] | Vector3D;
  nearbyEntities?: NearbyEntity[];
  currentRoutine?: string;
  timeOfDay?: string;
  kingdom?: string;
  dangerLevel?: number;
  weather?: string;
}

export type StreamCallback = (chunk: string, fullText: string) => void;

export type NPCGestureType =
  | 'idle'
  | 'conversing'
  | 'thinking'
  | 'bowing'
  | 'saluting'
  | 'waving'
  | 'shrugging'
  | 'laughing'
  | 'gesturing'
  | 'inspecting'
  | 'warming_hands';

/**
 * Unified AI Adapter Interface
 * All LLM client adapters must implement this contract.
 */
export interface AIAdapter {
  provider: AIProviderType | string;
  generateNPCResponse(context: NPCConversationContext): Promise<string>;
  generateNPCResponseStream?(
    context: NPCConversationContext,
    onToken: StreamCallback
  ): Promise<string>;
  generateNPCRoutineAction(context: NPCSpatialContext): Promise<NPCSpatialAction>;
}

export interface ProviderConfig {
  provider: AIProviderType;
  apiKey?: string;
  model: string;
  endpointUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  error?: string;
  modelUsed?: string;
  testedAt: number;
}

export interface RateLimiterMetrics {
  requestsRemaining: number;
  windowResetTimeMs: number;
  totalRequestsMade: number;
  cachedHits: number;
  isThrottled: boolean;
}

export type AIErrorCode =
  | 'NO_API_KEY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'QUOTA_EXHAUSTED'
  | 'NETWORK_ERROR'
  | 'INVALID_API_KEY'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface AIErrorDetails {
  code: AIErrorCode;
  provider: AIProviderType;
  message: string;
  details?: string;
  retryAfterSeconds?: number;
  timestamp: number;
}

export interface KeyVaultData {
  activeProvider: AIProviderType;
  configs: Record<AIProviderType, ProviderConfig>;
  testResults: Partial<Record<AIProviderType, ConnectionTestResult>>;
  rateLimitRPM: number;
  enableCache: boolean;
  lastError?: AIErrorDetails | null;
}

export type ProviderEventType =
  | 'key-updated'
  | 'provider-changed'
  | 'request-start'
  | 'request-end'
  | 'rate-limit-hit'
  | 'test-complete'
  | 'error-occurred'
  | 'error-cleared';

export interface ProviderEventPayload {
  type: ProviderEventType;
  provider: AIProviderType;
  timestamp: number;
  data?: any;
}
