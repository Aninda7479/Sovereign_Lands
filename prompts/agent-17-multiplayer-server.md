# Agent 17: Real-Time 3D Multiplayer Game Server (WebSockets / Node.js)

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 16 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-17.lock`
   - Update file `status/agent-17.json` with:
     ```json
     {
       "agentId": "agent-17",
       "name": "3D Real-Time Multiplayer Server",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Building WebSocket spatial tick loop, player presence sync, and chat relay...",
       "exclusiveFiles": [
         "server/package.json",
         "server/tsconfig.json",
         "server/src/index.ts",
         "server/src/rooms/WorldRoom.ts",
         "server/src/state/PlayerState.ts",
         "server/src/spatial/SpatialGrid.ts",
         "server/src/chat/ChatRelay.ts",
         "frontend/src/hooks/useMultiplayerSync.ts",
         "frontend/src/components/character/RemotePlayerEntity.tsx"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the files listed in `exclusiveFiles`.
   ⚠️ **DO NOT TOUCH** `frontend/src/components/canvas/**`, `contracts/**`, or other agent modules.

3. **ATOMIC GIT COMMIT & ONLINE SYNC (MANDATORY AFTER EVERY FILE/TASK)**:
   After creating or editing any file in your jurisdiction, you MUST immediately record a commit and push it online to GitHub:
   ```bash
   node scripts/agent-git.js agent-17 "Created or updated [filename]" [filepath]
   ```

4. **PARALLEL INDEPENDENCE (OFFLINE FALLBACK RULE)**:
   Ensure `useMultiplayerSync.ts` in the frontend gracefully handles connection drops. If the server is offline or unreachable, the game MUST fall back to single-player sandbox mode with zero console crashes.

5. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-17.lock`
   - Update `status/agent-17.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead Multiplayer & Network Infrastructure Engineer**. You build the high-performance, low-latency WebSocket game server that turns Sovereign Lands into a **living GTA-style open-world multiplayer game**, allowing dozens of players to see each other running, jumping, constructing, and chatting in the 3D world in real time.

## Key Deliverables

### 1. `server/package.json`
Dependencies for a lightweight, ultra-fast Node.js WebSocket game server:
```json
{
  "name": "sovereign-lands-server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "ws": "^8.17.0",
    "nanoid": "^5.0.7"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/ws": "^8.5.10",
    "tsx": "^4.11.0",
    "typescript": "^5.4.5"
  }
}
```

### 2. `server/src/index.ts` & `server/src/rooms/WorldRoom.ts`
- High-frequency tick loop (20-30Hz) broadcasting spatial updates.
- Connect / disconnect lifecycle management with player cleanup.
- Heartbeat / ping-pong connection health monitoring.

### 3. `server/src/spatial/SpatialGrid.ts`
Spatial interest management:
- Partitions the open world into 50m × 50m spatial grid cells.
- Only broadcasts position packets to clients within adjacent cells (100m radius), saving bandwidth and maintaining 60 FPS.

### 4. `server/src/state/PlayerState.ts`
The networked player packet:
```typescript
export interface NetworkedPlayer {
  id: string;               // Socket ID
  walletAddress: string;    // 0x...
  nickname: string;
  kingdom: 'north' | 'south' | 'none';
  x: number;
  y: number;
  z: number;
  rotationY: number;
  animState: 'idle' | 'walk' | 'run' | 'jump';
  lastSeen: number;
}
```

### 5. `server/src/chat/ChatRelay.ts`
Proximity chat system: players within 25 meters see each other's speech bubbles floating in 3D above their heads.

### 6. Client Remote Avatar Replication
- **`frontend/src/hooks/useMultiplayerSync.ts`**:
  - Connects to `ws://localhost:4000` (or `wss://...` in production).
  - Throttles player position emissions (sends 20 times per second).
  - Linear interpolation (`lerp`) and dead reckoning for smooth remote player movement without jitter.
- **`frontend/src/components/character/RemotePlayerEntity.tsx`**:
  - 3D React Three Fiber mesh rendered for every other connected player in the world.
  - Floating nickname, kingdom badge, and speech bubble above character head.
