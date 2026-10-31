/**
 * index.ts
 * Main entry point for the Sovereign Lands 3D Real-Time Multiplayer Server.
 * Combines HTTP health endpoints with WebSocket game server running at 20Hz.
 */

import http from 'http';
import { WebSocketServer } from 'ws';
import { WorldRoom } from './rooms/WorldRoom.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
const TICK_RATE = parseInt(process.env.TICK_RATE || '20', 10);

// Initialize HTTP server for health checks & monitoring
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || '/';

  if (url === '/health' || url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'sovereign-lands-multiplayer',
        playersCount: worldRoom.getPlayerCount(),
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        name: 'Sovereign Lands 3D Multiplayer Server',
        status: 'online',
        version: '1.0.0',
        playersOnline: worldRoom.getPlayerCount(),
        wsEndpoint: `ws://localhost:${PORT}`,
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Initialize World Room & WebSocket Server
const worldRoom = new WorldRoom({
  tickRate: TICK_RATE,
  heartbeatIntervalMs: 15000,
  clientTimeoutMs: 30000,
  spatialCellSize: 50,
  interestRadiusMeters: 100,
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  worldRoom.handleConnection(ws);
});

// Start WorldRoom tick & heartbeat timers
worldRoom.start();

// Start HTTP + WebSocket Server
server.listen(PORT, () => {
  console.log(`
==============================================================
⚔️  SOVEREIGN LANDS MULTIPLAYER SERVER (AGENT-17)
==============================================================
🌐 HTTP / Health:  http://localhost:${PORT}/health
⚡ WebSocket URL:  ws://localhost:${PORT}
⏱️  Tick Rate:     ${TICK_RATE} Hz (50ms tick interval)
🗺️  Spatial Grid:  50m x 50m cells (100m broadcast radius)
💬 Proximity Chat: 25m speech bubble radius
==============================================================
Server running and waiting for players...
`);
});

// Graceful shutdown handling
function handleShutdown(signal: string) {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

  worldRoom.stop();

  wss.close(() => {
    console.log('[Server] WebSocket server closed.');
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  });

  // Force exit if not cleanly closed in 5 seconds
  setTimeout(() => {
    console.error('[Server] Forcing shutdown after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export { server, wss, worldRoom };
