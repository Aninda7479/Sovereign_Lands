'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type KingdomType = 'north' | 'south' | 'none';
export type AnimationState = 'idle' | 'walk' | 'run' | 'jump';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface NetworkedRemotePlayer {
  id: string;
  walletAddress: string;
  nickname: string;
  kingdom: KingdomType;
  // Current interpolated positions
  x: number;
  y: number;
  z: number;
  rotationY: number;
  animState: AnimationState;
  // Dead reckoning & interpolation targets
  targetX: number;
  targetY: number;
  targetZ: number;
  targetRotationY: number;
  velocityX: number;
  velocityZ: number;
  lastUpdate: number;
}

export interface ChatMessage {
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

export interface ActiveSpeechBubble {
  id: string;
  text: string;
  speakerName: string;
  kingdom: KingdomType;
  timestamp: number;
}

export interface UseMultiplayerSyncOptions {
  serverUrl?: string;
  walletAddress?: string;
  nickname?: string;
  kingdom?: KingdomType;
  initialPosition?: [number, number, number];
  enabled?: boolean;
}

export interface UseMultiplayerSyncReturn {
  connected: boolean;
  connectionStatus: ConnectionStatus;
  myPlayerId: string | null;
  remotePlayers: Record<string, NetworkedRemotePlayer>;
  remotePlayerList: NetworkedRemotePlayer[];
  recentMessages: ChatMessage[];
  activeSpeechBubbles: Record<string, ActiveSpeechBubble>;
  pingMs: number;
  sendPositionUpdate: (
    position: [number, number, number] | { x: number; y: number; z: number },
    rotationY: number,
    animState: AnimationState
  ) => void;
  sendChatMessage: (message: string) => void;
  reconnect: () => void;
}

const DEFAULT_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
const POSITION_SEND_INTERVAL_MS = 50; // 20Hz broadcast
const SPEECH_BUBBLE_LIFETIME_MS = 6000; // 6 seconds speech bubble duration

/**
 * Resolves the appropriate WebSocket URL based on runtime environment.
 */
function resolveWebSocketUrl(explicitUrl?: string): string {
  if (explicitUrl) return explicitUrl;
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    return `${protocol}//${host}:4000`;
  }
  return DEFAULT_WS_URL;
}

/**
 * useMultiplayerSync
 * Real-time WebSocket hook connecting to Sovereign Lands 3D Multiplayer Server.
 * Supports 20Hz dead-reckoning position sync, proximity chat, and graceful offline fallback.
 */
export function useMultiplayerSync(
  options: UseMultiplayerSyncOptions = {}
): UseMultiplayerSyncReturn {
  const {
    serverUrl,
    enabled = true,
  } = options;

  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [remotePlayers, setRemotePlayers] = useState<Record<string, NetworkedRemotePlayer>>({});
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [activeSpeechBubbles, setActiveSpeechBubbles] = useState<Record<string, ActiveSpeechBubble>>({});
  const [pingMs, setPingMs] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastSendTimeRef = useRef(0);
  const lastSentStateRef = useRef<{ x: number; y: number; z: number; rot: number; anim: string }>({
    x: 0,
    y: 0,
    z: 0,
    rot: 0,
    anim: 'idle',
  });

  // Keep latest options in ref to avoid socket reconnect churn on every render
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const myPlayerIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reference to current remote players for instant packet processing without stale closures
  const remotePlayersRef = useRef<Record<string, NetworkedRemotePlayer>>({});
  useEffect(() => {
    remotePlayersRef.current = remotePlayers;
  }, [remotePlayers]);

  // Connect / Reconnect handler - stable reference, reads mutable options from optionsRef
  const connectSocket = useCallback(() => {
    if (!isMountedRef.current) return;
    if (optionsRef.current.enabled === false) return;

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      setConnectionStatus(reconnectAttemptsRef.current === 0 ? 'connecting' : 'reconnecting');
      const wsUrl = resolveWebSocketUrl(optionsRef.current.serverUrl);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          try {
            ws.close();
          } catch {
            // Safe ignore
          }
          return;
        }
        reconnectAttemptsRef.current = 0;
        setConnected(true);
        setConnectionStatus('connected');

        // Send initial join packet with player profile
        const opts = optionsRef.current;
        const initPos = opts.initialPosition || [0, 2.0, 0];
        const joinPacket = {
          type: 'join',
          walletAddress: opts.walletAddress || '0x0000000000000000000000000000000000000000',
          nickname: opts.nickname || 'Wanderer',
          kingdom: opts.kingdom || 'none',
          x: initPos[0],
          y: initPos[1],
          z: initPos[2],
          rotationY: 0,
        };
        ws.send(JSON.stringify(joinPacket));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'welcome': {
              myPlayerIdRef.current = data.playerId;
              setMyPlayerId(data.playerId);
              break;
            }

            case 'sync': {
              const serverPlayers = data.players as Array<{
                id: string;
                walletAddress: string;
                nickname: string;
                kingdom: KingdomType;
                x: number;
                y: number;
                z: number;
                rotationY: number;
                animState: AnimationState;
                lastSeen: number;
              }>;

              const now = Date.now();
              const currentPlayers = remotePlayersRef.current;
              const receivedIds = new Set<string>();
              let listChanged = false;
              const currentMyId = myPlayerIdRef.current;

              for (const sp of serverPlayers) {
                // Skip local player
                if (sp.id === currentMyId) continue;
                receivedIds.add(sp.id);

                const existing = currentPlayers[sp.id];
                if (existing) {
                  // In-place mutate target coordinates for silky 60 FPS interpolation without React re-renders
                  const dt = Math.max((now - existing.lastUpdate) / 1000, 0.01);
                  const vx = (sp.x - existing.targetX) / dt;
                  const vz = (sp.z - existing.targetZ) / dt;

                  existing.walletAddress = sp.walletAddress;
                  existing.nickname = sp.nickname;
                  existing.kingdom = sp.kingdom;
                  existing.animState = sp.animState;
                  existing.targetX = sp.x;
                  existing.targetY = sp.y;
                  existing.targetZ = sp.z;
                  existing.targetRotationY = sp.rotationY;
                  existing.velocityX = isFinite(vx) ? vx : 0;
                  existing.velocityZ = isFinite(vz) ? vz : 0;
                  existing.lastUpdate = now;
                } else {
                  // New remote player detected
                  currentPlayers[sp.id] = {
                    id: sp.id,
                    walletAddress: sp.walletAddress,
                    nickname: sp.nickname,
                    kingdom: sp.kingdom,
                    x: sp.x,
                    y: sp.y,
                    z: sp.z,
                    rotationY: sp.rotationY,
                    animState: sp.animState,
                    targetX: sp.x,
                    targetY: sp.y,
                    targetZ: sp.z,
                    targetRotationY: sp.rotationY,
                    velocityX: 0,
                    velocityZ: 0,
                    lastUpdate: now,
                  };
                  listChanged = true;
                }
              }

              // Remove disconnected players
              for (const id of Object.keys(currentPlayers)) {
                if (!receivedIds.has(id)) {
                  delete currentPlayers[id];
                  listChanged = true;
                }
              }

              // Only trigger React re-render when a player actually connects or disconnects
              if (listChanged) {
                setRemotePlayers({ ...currentPlayers });
              }
              break;
            }

            case 'player_joined': {
              const p = data.player;
              if (p && p.id !== myPlayerIdRef.current) {
                setRemotePlayers((prev) => ({
                  ...prev,
                  [p.id]: {
                    id: p.id,
                    walletAddress: p.walletAddress,
                    nickname: p.nickname,
                    kingdom: p.kingdom,
                    x: p.x,
                    y: p.y,
                    z: p.z,
                    rotationY: p.rotationY,
                    animState: p.animState,
                    targetX: p.x,
                    targetY: p.y,
                    targetZ: p.z,
                    targetRotationY: p.rotationY,
                    velocityX: 0,
                    velocityZ: 0,
                    lastUpdate: Date.now(),
                  },
                }));
              }
              break;
            }

            case 'player_left': {
              const leftId = data.playerId;
              if (leftId) {
                setRemotePlayers((prev) => {
                  const copy = { ...prev };
                  delete copy[leftId];
                  return copy;
                });
                setActiveSpeechBubbles((prev) => {
                  const copy = { ...prev };
                  delete copy[leftId];
                  return copy;
                });
              }
              break;
            }

            case 'chat_message': {
              const msg: ChatMessage = {
                id: data.id,
                senderId: data.senderId,
                senderName: data.senderName,
                kingdom: data.kingdom,
                message: data.message,
                x: data.x,
                y: data.y,
                z: data.z,
                timestamp: data.timestamp,
              };

              setRecentMessages((prev) => [...prev.slice(-49), msg]);

              // Update active speech bubble over sender's avatar
              setActiveSpeechBubbles((prev) => ({
                ...prev,
                [data.senderId]: {
                  id: data.id,
                  text: data.message,
                  speakerName: data.senderName,
                  kingdom: data.kingdom,
                  timestamp: Date.now(),
                },
              }));
              break;
            }

            case 'pong': {
              const roundTrip = Date.now() - data.clientTimestamp;
              setPingMs(roundTrip);
              break;
            }
          }
        } catch {
          // Graceful ignore
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setConnectionStatus('disconnected');
        socketRef.current = null;

        // Offline fallback & safe auto-reconnection with exponential backoff if still mounted
        if (isMountedRef.current && (optionsRef.current.enabled ?? true)) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(2000 * Math.pow(1.5, reconnectAttemptsRef.current - 1), 20000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSocket();
          }, delay);
        }
      };

      ws.onerror = () => {
        // Suppress browser console throw - enables silent single-player fallback
        setConnected(false);
      };
    } catch {
      // Graceful offline fallback
      setConnected(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  // Initial connection mount & teardown - only restarts if enabled or serverUrl explicitly changes
  useEffect(() => {
    if (enabled === false) return;

    connectSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      const ws = socketRef.current;
      if (ws) {
        socketRef.current = null;
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.close();
          } catch {
            // Safe ignore
          }
        } else if (ws.readyState === WebSocket.CONNECTING) {
          // Prevent browser error: "WebSocket is closed before the connection is established"
          ws.onopen = () => {
            try {
              ws.close();
            } catch {
              // Safe ignore
            }
          };
          ws.onerror = () => {};
        }
      }
    };
  }, [enabled, serverUrl, connectSocket]);

  // Periodic Speech Bubble Cleanup
  useEffect(() => {
    const bubbleInterval = setInterval(() => {
      const now = Date.now();
      setActiveSpeechBubbles((prev) => {
        let changed = false;
        const next: Record<string, ActiveSpeechBubble> = {};
        for (const [key, bubble] of Object.entries(prev)) {
          if (now - bubble.timestamp < SPEECH_BUBBLE_LIFETIME_MS) {
            next[key] = bubble;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(bubbleInterval);
  }, []);

  // Periodic Ping
  useEffect(() => {
    if (!connected) return;

    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'ping',
            timestamp: Date.now(),
          })
        );
      }
    }, 10000);

    return () => clearInterval(pingInterval);
  }, [connected]);

  // Throttled position update sender (20Hz)
  const sendPositionUpdate = useCallback(
    (
      position: [number, number, number] | { x: number; y: number; z: number },
      rotationY: number,
      animState: AnimationState
    ) => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const now = Date.now();
      if (now - lastSendTimeRef.current < POSITION_SEND_INTERVAL_MS) {
        return;
      }

      const posX = Array.isArray(position) ? position[0] : position.x;
      const posY = Array.isArray(position) ? position[1] : position.y;
      const posZ = Array.isArray(position) ? position[2] : position.z;

      // Delta check: only send if moved or rotated significantly, or heartbeat every 1s
      const prev = lastSentStateRef.current;
      const dx = Math.abs(posX - prev.x);
      const dy = Math.abs(posY - prev.y);
      const dz = Math.abs(posZ - prev.z);
      const dr = Math.abs(rotationY - prev.rot);
      const changedAnim = animState !== prev.anim;

      if (dx < 0.02 && dy < 0.02 && dz < 0.02 && dr < 0.02 && !changedAnim && now - lastSendTimeRef.current < 1000) {
        return;
      }

      lastSendTimeRef.current = now;
      lastSentStateRef.current = { x: posX, y: posY, z: posZ, rot: rotationY, anim: animState };

      socketRef.current.send(
        JSON.stringify({
          type: 'move',
          x: posX,
          y: posY,
          z: posZ,
          rotationY,
          animState,
          timestamp: now,
        })
      );
    },
    []
  );

  // Proximity chat sender
  const sendChatMessage = useCallback((message: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    const trimmed = message.trim();
    if (!trimmed) return;

    socketRef.current.send(
      JSON.stringify({
        type: 'chat',
        message: trimmed,
      })
    );
  }, []);

  // Manual reconnect trigger
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    const ws = socketRef.current;
    if (ws) {
      socketRef.current = null;
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.close();
        } catch {
          // Safe ignore
        }
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => {
          try {
            ws.close();
          } catch {
            // Safe ignore
          }
        };
        ws.onerror = () => {};
      }
    }
    reconnectAttemptsRef.current = 0;
    connectSocket();
  }, [connectSocket]);

  return {
    connected,
    connectionStatus,
    myPlayerId,
    remotePlayers,
    remotePlayerList: Object.values(remotePlayers),
    recentMessages,
    activeSpeechBubbles,
    pingMs,
    sendPositionUpdate,
    sendChatMessage,
    reconnect,
  };
}

export default useMultiplayerSync;
