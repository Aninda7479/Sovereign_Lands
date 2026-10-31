/**
 * WorldRoom.ts
 * Authoritative World Room for Sovereign Lands.
 * Coordinates 20Hz spatial interest tick loop, player presence lifecycle,
 * connection heartbeat monitoring, and proximity chat dispatch.
 */

import { WebSocket } from 'ws';
import { nanoid } from 'nanoid';
import {
  NetworkedPlayer,
  ClientMessage,
  ServerMessage,
  createNetworkedPlayer,
  sanitizeCoordinates,
} from '../state/PlayerState.js';
import { SpatialGrid } from '../spatial/SpatialGrid.js';
import { ChatRelay } from '../chat/ChatRelay.js';

export interface ClientSession {
  id: string;
  ws: WebSocket;
  player: NetworkedPlayer;
  isAlive: boolean;
  lastPing: number;
}

export interface WorldRoomConfig {
  tickRate?: number;            // Ticks per second (default 20Hz)
  heartbeatIntervalMs?: number; // Ping interval (default 15000ms)
  clientTimeoutMs?: number;     // Idle timeout (default 30000ms)
  spatialCellSize?: number;     // Grid cell size in meters (default 50m)
  interestRadiusMeters?: number;// Broadcast distance limit (default 100m)
}

export class WorldRoom {
  private readonly tickRate: number;
  private readonly tickIntervalMs: number;
  private readonly heartbeatIntervalMs: number;
  private readonly clientTimeoutMs: number;
  private readonly interestRadiusMeters: number;

  private readonly sessions: Map<string, ClientSession> = new Map();
  private readonly spatialGrid: SpatialGrid;
  private readonly chatRelay: ChatRelay;

  private tickTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: WorldRoomConfig = {}) {
    this.tickRate = config.tickRate ?? 20;
    this.tickIntervalMs = Math.round(1000 / this.tickRate);
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 15000;
    this.clientTimeoutMs = config.clientTimeoutMs ?? 30000;
    this.interestRadiusMeters = config.interestRadiusMeters ?? 100;

    this.spatialGrid = new SpatialGrid(config.spatialCellSize ?? 50);
    this.chatRelay = new ChatRelay({ maxProximityDistance: 25.0 });
  }

  /**
   * Starts the tick loop and connection heartbeat timers.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // High-frequency spatial tick loop (20Hz)
    this.tickTimer = setInterval(() => {
      this.tick();
    }, this.tickIntervalMs);

    // Heartbeat monitoring loop
    this.heartbeatTimer = setInterval(() => {
      this.checkHeartbeats();
    }, this.heartbeatIntervalMs);

    console.log(`[WorldRoom] Running at ${this.tickRate}Hz (${this.tickIntervalMs}ms tick interval)`);
  }

  /**
   * Gracefully stops the room and closes active sessions.
   */
  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    for (const session of this.sessions.values()) {
      try {
        session.ws.close(1000, 'Server shutting down');
      } catch (err) {}
    }
    this.sessions.clear();
    this.spatialGrid.clear();

    console.log('[WorldRoom] Stopped.');
  }

  /**
   * Accepts and attaches a new incoming WebSocket connection.
   */
  public handleConnection(ws: WebSocket): string {
    const playerId = nanoid(10);
    const initialPlayer = createNetworkedPlayer(playerId, {
      x: 0,
      y: 2.0,
      z: 0,
    });

    const session: ClientSession = {
      id: playerId,
      ws,
      player: initialPlayer,
      isAlive: true,
      lastPing: Date.now(),
    };

    this.sessions.set(playerId, session);
    this.spatialGrid.insert(playerId, initialPlayer.x, initialPlayer.z);

    // Native WS pong listener
    ws.on('pong', () => {
      session.isAlive = true;
      session.lastPing = Date.now();
    });

    // Handle incoming client packets
    ws.on('message', (data) => {
      this.handleClientMessage(session, data);
    });

    // Handle socket closure
    ws.on('close', () => {
      this.handleDisconnect(playerId);
    });

    // Handle socket errors
    ws.on('error', (err) => {
      console.warn(`[WorldRoom] Socket error for ${playerId}:`, err.message);
      this.handleDisconnect(playerId);
    });

    // Send immediate Welcome packet to client
    const welcomePacket: ServerMessage = {
      type: 'welcome',
      playerId,
      player: session.player,
      serverTime: Date.now(),
      tickRate: this.tickRate,
    };
    this.send(ws, welcomePacket);

    // Broadcast player_joined to other active players
    this.broadcastExcept(playerId, {
      type: 'player_joined',
      player: session.player,
    });

    console.log(`[WorldRoom] Player connected: ${playerId} (Total: ${this.sessions.size})`);
    return playerId;
  }

  /**
   * Handles incoming parsed packet from a client session.
   */
  private handleClientMessage(session: ClientSession, rawData: any): void {
    try {
      const message: ClientMessage = JSON.parse(rawData.toString());
      session.isAlive = true;
      session.lastPing = Date.now();

      switch (message.type) {
        case 'join': {
          if (message.nickname) {
            session.player.nickname = message.nickname.slice(0, 24);
          }
          if (message.walletAddress) {
            session.player.walletAddress = message.walletAddress.slice(0, 44);
          }
          if (message.kingdom && ['north', 'south', 'none'].includes(message.kingdom)) {
            session.player.kingdom = message.kingdom;
          }
          if (typeof message.x === 'number') {
            session.player.x = sanitizeCoordinates(message.x);
          }
          if (typeof message.y === 'number') {
            session.player.y = sanitizeCoordinates(message.y, 2.0);
          }
          if (typeof message.z === 'number') {
            session.player.z = sanitizeCoordinates(message.z);
          }
          if (typeof message.rotationY === 'number') {
            session.player.rotationY = message.rotationY;
          }

          // Update spatial grid
          this.spatialGrid.update(session.id, session.player.x, session.player.z);

          // Broadcast updated player state to other players
          this.broadcastExcept(session.id, {
            type: 'player_joined',
            player: session.player,
          });
          break;
        }

        case 'move': {
          session.player.x = sanitizeCoordinates(message.x, session.player.x);
          session.player.y = sanitizeCoordinates(message.y, session.player.y);
          session.player.z = sanitizeCoordinates(message.z, session.player.z);
          session.player.rotationY = typeof message.rotationY === 'number' ? message.rotationY : session.player.rotationY;
          session.player.animState = ['idle', 'walk', 'run', 'jump'].includes(message.animState)
            ? message.animState
            : 'idle';
          session.player.lastSeen = Date.now();

          // Keep spatial grid in sync
          this.spatialGrid.update(session.id, session.player.x, session.player.z);
          break;
        }

        case 'chat': {
          const allPlayersMap = new Map<string, NetworkedPlayer>();
          for (const [id, s] of this.sessions.entries()) {
            allPlayersMap.set(id, s.player);
          }

          const result = this.chatRelay.processProximityChat(
            session.player,
            message.message,
            allPlayersMap
          );

          if (result) {
            // Send chat packet to all players within 25m
            for (const targetId of result.targets) {
              const targetSession = this.sessions.get(targetId);
              if (targetSession && targetSession.ws.readyState === WebSocket.OPEN) {
                this.send(targetSession.ws, result.chatPacket);
              }
            }
          }
          break;
        }

        case 'ping': {
          const pongPacket: ServerMessage = {
            type: 'pong',
            clientTimestamp: message.timestamp,
            serverTime: Date.now(),
          };
          this.send(session.ws, pongPacket);
          break;
        }
      }
    } catch (err: any) {
      console.warn(`[WorldRoom] Failed to parse client message from ${session.id}:`, err.message);
    }
  }

  /**
   * Cleans up disconnected client session and notifies other clients.
   */
  public handleDisconnect(playerId: string): void {
    const session = this.sessions.get(playerId);
    if (!session) return;

    this.sessions.delete(playerId);
    this.spatialGrid.remove(playerId);
    this.chatRelay.removePlayer(playerId);

    try {
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.close();
      }
    } catch (err) {}

    // Broadcast player_left to remaining clients
    this.broadcastAll({
      type: 'player_left',
      playerId,
    });

    console.log(`[WorldRoom] Player disconnected: ${playerId} (Remaining: ${this.sessions.size})`);
  }

  /**
   * Main 20Hz Tick Loop:
   * Uses SpatialGrid interest management to broadcast position updates to relevant clients.
   */
  private tick(): void {
    if (this.sessions.size === 0) return;

    const now = Date.now();

    // Fast path: if 20 or fewer players, broadcast all players to everyone
    if (this.sessions.size <= 20) {
      const allPlayers: NetworkedPlayer[] = [];
      for (const s of this.sessions.values()) {
        allPlayers.push(s.player);
      }

      const syncPacket: ServerMessage = {
        type: 'sync',
        timestamp: now,
        players: allPlayers,
      };
      const serialized = JSON.stringify(syncPacket);

      for (const session of this.sessions.values()) {
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(serialized);
        }
      }
      return;
    }

    // High player count: Spatial Interest Partitioning (100m radius)
    for (const session of this.sessions.values()) {
      if (session.ws.readyState !== WebSocket.OPEN) continue;

      // Find players within 100m radius
      const nearbyIds = this.spatialGrid.getNearbyPlayersWithinRadius(
        session.player.x,
        session.player.z,
        this.interestRadiusMeters
      );

      const nearbyPlayers: NetworkedPlayer[] = [];
      for (const id of nearbyIds) {
        const s = this.sessions.get(id);
        if (s) {
          nearbyPlayers.push(s.player);
        }
      }

      // Always include self for synchronization confirmation
      if (!nearbyIds.includes(session.id)) {
        nearbyPlayers.push(session.player);
      }

      const syncPacket: ServerMessage = {
        type: 'sync',
        timestamp: now,
        players: nearbyPlayers,
      };

      session.ws.send(JSON.stringify(syncPacket));
    }
  }

  /**
   * Heartbeat health check: drops stale or dead client connections.
   */
  private checkHeartbeats(): void {
    const now = Date.now();

    for (const [playerId, session] of this.sessions.entries()) {
      if (!session.isAlive || now - session.lastPing > this.clientTimeoutMs) {
        console.log(`[WorldRoom] Terminating timed out player: ${playerId}`);
        session.ws.terminate();
        this.handleDisconnect(playerId);
        continue;
      }

      session.isAlive = false;
      try {
        session.ws.ping();
      } catch (err) {
        this.handleDisconnect(playerId);
      }
    }
  }

  /**
   * Sends a JSON packet to a specific WebSocket.
   */
  private send(ws: WebSocket, packet: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(packet));
    }
  }

  /**
   * Broadcasts a JSON packet to all connected clients.
   */
  public broadcastAll(packet: ServerMessage): void {
    const serialized = JSON.stringify(packet);
    for (const session of this.sessions.values()) {
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(serialized);
      }
    }
  }

  /**
   * Broadcasts a JSON packet to all connected clients except one.
   */
  public broadcastExcept(excludeId: string, packet: ServerMessage): void {
    const serialized = JSON.stringify(packet);
    for (const [id, session] of this.sessions.entries()) {
      if (id !== excludeId && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(serialized);
      }
    }
  }

  /**
   * Returns current active player count.
   */
  public getPlayerCount(): number {
    return this.sessions.size;
  }

  /**
   * Returns snapshot array of all active networked players.
   */
  public getAllPlayers(): NetworkedPlayer[] {
    return Array.from(this.sessions.values()).map((s) => ({ ...s.player }));
  }
}
