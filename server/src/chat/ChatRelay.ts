/**
 * ChatRelay.ts
 * Proximity Chat System for Sovereign Lands.
 * Relays messages to players within 25 meters with rate limiting, sanitization, and bubble duration metadata.
 */

import { nanoid } from 'nanoid';
import { NetworkedPlayer, ServerChatMessage } from '../state/PlayerState.js';

export interface ChatRelayConfig {
  maxProximityDistance?: number; // In meters (default 25.0)
  maxMessageLength?: number;     // In characters (default 140)
  rateLimitWindowMs?: number;    // Window for rate limiting (default 3000ms)
  rateLimitMaxMessages?: number; // Max messages per window (default 5)
}

export interface ChatHistoryEntry {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  targetsCount: number;
}

export class ChatRelay {
  private readonly maxProximityDistance: number;
  private readonly maxMessageLength: number;
  private readonly rateLimitWindowMs: number;
  private readonly rateLimitMaxMessages: number;

  // Track message timestamps per player for spam prevention
  private readonly playerMessageTimestamps: Map<string, number[]> = new Map();
  // In-memory chat log buffer (up to 100 recent entries)
  private readonly recentChatLog: ChatHistoryEntry[] = [];
  private readonly maxLogSize = 100;

  constructor(config: ChatRelayConfig = {}) {
    this.maxProximityDistance = config.maxProximityDistance ?? 25.0;
    this.maxMessageLength = config.maxMessageLength ?? 140;
    this.rateLimitWindowMs = config.rateLimitWindowMs ?? 3000;
    this.rateLimitMaxMessages = config.rateLimitMaxMessages ?? 5;
  }

  /**
   * Cleans up state when a player leaves the room.
   */
  public removePlayer(playerId: string): void {
    this.playerMessageTimestamps.delete(playerId);
  }

  /**
   * Sanitizes user chat text by trimming and stripping control characters.
   */
  public sanitizeMessage(rawText: string): string {
    if (!rawText || typeof rawText !== 'string') return '';
    // Trim and collapse excessive whitespace
    const cleaned = rawText.replace(/[\x00-\x1F\x7F]/g, '').trim();
    return cleaned.slice(0, this.maxMessageLength);
  }

  /**
   * Checks whether a player is exceeding rate limits.
   * @returns true if allowed, false if rate limited.
   */
  public checkRateLimit(playerId: string): boolean {
    const now = Date.now();
    let timestamps = this.playerMessageTimestamps.get(playerId);
    if (!timestamps) {
      timestamps = [];
      this.playerMessageTimestamps.set(playerId, timestamps);
    }

    // Filter out timestamps outside the sliding window
    const windowStart = now - this.rateLimitWindowMs;
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= this.rateLimitMaxMessages) {
      this.playerMessageTimestamps.set(playerId, validTimestamps);
      return false;
    }

    validTimestamps.push(now);
    this.playerMessageTimestamps.set(playerId, validTimestamps);
    return true;
  }

  /**
   * Calculates Euclidean distance between two players in 3D space.
   */
  public calculateDistance(p1: NetworkedPlayer, p2: NetworkedPlayer): number {
    const dx = p1.x - p2.x;
    const dy = (p1.y ?? 0) - (p2.y ?? 0);
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Processes an incoming chat message, validates and sanitizes it,
   * calculates proximity targets (within 25m), and produces a broadcast packet.
   */
  public processProximityChat(
    sender: NetworkedPlayer,
    rawText: string,
    allPlayers: Map<string, NetworkedPlayer>
  ): { targets: string[]; chatPacket: ServerChatMessage } | null {
    if (!this.checkRateLimit(sender.id)) {
      return null;
    }

    const message = this.sanitizeMessage(rawText);
    if (!message || message.length === 0) {
      return null;
    }

    const now = Date.now();
    const chatPacket: ServerChatMessage = {
      type: 'chat_message',
      id: nanoid(10),
      senderId: sender.id,
      senderName: sender.nickname,
      kingdom: sender.kingdom,
      message,
      x: sender.x,
      y: sender.y,
      z: sender.z,
      timestamp: now,
    };

    // Find all players within proximity threshold (including sender)
    const targets: string[] = [];
    for (const [targetId, targetPlayer] of allPlayers.entries()) {
      const dist = this.calculateDistance(sender, targetPlayer);
      if (dist <= this.maxProximityDistance) {
        targets.push(targetId);
      }
    }

    // Record in history log
    this.recentChatLog.push({
      id: chatPacket.id,
      senderId: sender.id,
      senderName: sender.nickname,
      message,
      timestamp: now,
      targetsCount: targets.length,
    });

    if (this.recentChatLog.length > this.maxLogSize) {
      this.recentChatLog.shift();
    }

    return { targets, chatPacket };
  }

  /**
   * Returns recent chat history log for debugging or moderation.
   */
  public getRecentChatLog(): readonly ChatHistoryEntry[] {
    return this.recentChatLog;
  }
}
