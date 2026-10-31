const fs = require('fs');
const path = require('path');

const STATUS_DIR = path.join(__dirname, '..', 'status');

const AGENTS = [
  { id: 'agent-01', name: '3D Land & Economy Contracts' },
  { id: 'agent-02', name: 'Contract Test & Deploy' },
  { id: 'agent-03', name: '3D Low-Poly Asset Pipeline' },
  { id: 'agent-04', name: '3D Canvas & Web Shell' },
  { id: 'agent-05', name: 'GTA Character & Camera' },
  { id: 'agent-06', name: '3D Terrain & Building Engine' },
  { id: 'agent-07', name: '3D Web3 Interaction & HUD' },
  { id: 'agent-08', name: 'BYOAI Provider Hub' },
  { id: 'agent-09', name: '3D Roaming NPC Engine' },
  { id: 'agent-10', name: 'Citadel Tactical War Table' },
  { id: 'agent-11', name: '3D Kingdom Lore & Monuments' },
  { id: 'agent-12', name: 'GTA Quest & Radar Mini-Map' },
  { id: 'agent-13', name: '3D Tech Architecture' },
  { id: 'agent-14', name: 'README & 3D Trailer Script' },
  { id: 'agent-15', name: 'Master 3D Scene Assembly' },
  { id: 'agent-16', name: '3D QA & 60 FPS Optimization' },
];

function checkStatus() {
  console.clear();
  console.log('===============================================================');
  console.log('   🏰 SOVEREIGN LANDS: 3D OPEN-WORLD MULTI-AGENT MONITOR 🏰    ');
  console.log('===============================================================');
  console.log(new Date().toLocaleString());
  console.log('');

  let readyCount = 0;
  let buildingCount = 0;
  let waitingCount = 0;

  AGENTS.forEach((agent) => {
    const statusFile = path.join(STATUS_DIR, `${agent.id}.json`);
    const lockFile = path.join(STATUS_DIR, `${agent.id}.lock`);
    const hasLock = fs.existsSync(lockFile);

    let statusText = '⚪ WAITING TO START';
    let details = '';

    if (fs.existsSync(statusFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        if (data.status === 'UNDER_CONSTRUCTION' || hasLock) {
          statusText = '🚧 UNDER CONSTRUCTION (BUILDING)';
          buildingCount++;
          if (data.progress) details = ` - ${data.progress}`;
        } else if (data.status === 'READY') {
          statusText = '🟢 READY & VERIFIED';
          readyCount++;
          if (data.completedAt) details = ` (done: ${new Date(data.completedAt).toLocaleTimeString()})`;
        } else {
          statusText = `🟡 ${data.status}`;
          waitingCount++;
        }
      } catch (e) {
        statusText = '⚠️ STATUS CORRUPT / PARSING';
      }
    } else {
      waitingCount++;
    }

    const padName = agent.name.padEnd(28, ' ');
    console.log(`[${agent.id.toUpperCase()}] ${padName} : ${statusText}${details}`);
  });

  console.log('---------------------------------------------------------------');
  console.log(`Summary: 🟢 Ready: ${readyCount} | 🚧 Building: ${buildingCount} | ⚪ Waiting: ${waitingCount} / Total: ${AGENTS.length}`);
  console.log('===============================================================');
}

if (require.main === module) {
  checkStatus();
  if (process.argv.includes('--watch')) {
    setInterval(checkStatus, 3000);
  }
}

module.exports = { checkStatus };
