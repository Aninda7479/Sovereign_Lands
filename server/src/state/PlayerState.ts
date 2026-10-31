/**
 * PlayerState.ts
 * Networked Player data model and WebSocket packet protocol definitions for Sovereign Lands.
 */

export type KingdomType = 'north' | 'south' | 'none';
export type AnimationState = 'idle' | 'walk' | 'run' | 'jump';

/**
 * Authoritative networked player state broadcast across clients.
 */
export interface NetworkedPlayer {
  id: string;               // Socket ID / Unique session ID
  walletAddress: string;    // 0x... or guest address
  nickname: string;         // Visible display name
  kingdom: KingdomType;     // Faction alignment
  x: number;                // World coordinate X (meters)
  y: number;                // World coordinate Y (meters)
  z: number;                // World coordinate Z (meters)
  rotationY: number;        // Yaw rotation in radians
  animState: AnimationState;// Active locomotion animation state
  lastSeen: number;         // Unix timestamp in ms of last received packet
}

// =============================================================================
//                             CLIENT -> SERVER PACKETS
// =============================================================================

export interface ClientJoinMessage {
  type: 'join';
  walletAddress?: string;
  nickname?: string;
  kingdom?: KingdomType;
  x?: number;
  y?: number;
  z?: number;
  rotationY?: number;
}

export interface ClientMoveMessage {
  type: 'move';
  x: number;
  y: number;
  z: number;
  rotationY: number;
  animState: AnimationState;
  timestamp?: number;
}

export interface ClientChatMessage {
  type: 'chat';
  message: string;
  x?: number;
  y?: number;
  z?: number;
}

export interface ClientPingMessage {
  type: 'ping';
  timestamp: number;
}

export type ClientMessage =
  | ClientJoinMessage
  | ClientMoveMessage
  | ClientChatMessage
  | ClientPingMessage;

// =============================================================================
//                             SERVER -> CLIENT PACKETS
// =============================================================================

export interface ServerWelcomeMessage {
  type: 'welcome';
  playerId: string;
  player: NetworkedPlayer;
  serverTime: number;
  tickRate: number;
}

export interface ServerSyncMessage {
  type: 'sync';
  timestamp: number;
  players: NetworkedPlayer[];
}

export interface ServerPlayerJoinedMessage {
  type: 'player_joined';
  player: NetworkedPlayer;
}

export interface ServerPlayerLeftMessage {
  type: 'player_left';
  playerId: string;
}

export interface ServerChatMessage {
  type: 'chat_message';
  id: string;
  senderId: string;
  senderName: string;
  kingdom: KingdomType;
  message: string;
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface ServerPongMessage {
  type: 'pong';
  clientTimestamp: number;
  serverTime: number;
}

export type ServerMessage =
  | ServerWelcomeMessage
  | ServerSyncMessage
  | ServerPlayerJoinedMessage
  | ServerPlayerLeftMessage
  | ServerChatMessage
  | ServerPongMessage;

// =============================================================================
//                             HELPER FACTORIES & VALIDATION
// =============================================================================

/**
 * Creates a default networked player representation.
 */
export function createNetworkedPlayer(
  id: string,
  options: Partial<NetworkedPlayer> = {}
): NetworkedPlayer {
  return {
    id,
    walletAddress: options.walletAddress || `0x${id.slice(0, 8)}...guest`,
    nickname: options.nickname || `Lord_${id.slice(0, 4)}`,
    kingdom: options.kingdom || 'none',
    x: typeof options.x === 'number' && !isNaN(options.x) ? options.x : 0,
    y: typeof options.y === 'number' && !isNaN(options.y) ? options.y : 2.0,
    z: typeof options.z === 'number' && !isNaN(options.z) ? options.z : 0,
    rotationY: typeof options.rotationY === 'number' && !isNaN(options.rotationY) ? options.rotationY : 0,
    animState: options.animState || 'idle',
    lastSeen: Date.now(),
  };
}

/**
 * Sanitizes and validates position coordinates to prevent NaN or extreme desync.
 */
export function sanitizeCoordinates(
  val: number,
  fallback = 0,
  min = -10000,
  max = 10000
): number {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, val));
}
