const fs = require('fs');
const path = require('path');

const STATUS_DIR = path.join(__dirname, '..', 'status');

const AGENTS = [
  { id: 'agent-01', name: 'Smart Contract Core' },
  { id: 'agent-02', name: 'Contract Testing & Deploy' },
  { id: 'agent-03', name: 'Game Asset Pipeline' },
  { id: 'agent-04', name: 'Website Shell & Layout' },
  { id: 'agent-05', name: 'Game Map & Tile Engine' },
  { id: 'agent-06', name: 'Governance & War UI' },
  { id: 'agent-07', name: 'Wallet & Web3 Integration' },
  { id: 'agent-08', name: 'AI Connection System' },
  { id: 'agent-09', name: 'NPC Behavior Engine' },
  { id: 'agent-10', name: 'AI Strategy Advisor' },
  { id: 'agent-11', name: 'Character & Lore Bible' },
  { id: 'agent-12', name: 'Player Guide & Tutorial' },
  { id: 'agent-13', name: 'Technical Documentation' },
  { id: 'agent-14', name: 'README & Demo Script' },
  { id: 'agent-15', name: 'Full Integration & Wiring' },
  { id: 'agent-16', name: 'QA, Polish & Launch' },
];

function checkStatus() {
  console.clear();
  console.log('===============================================================');
  console.log('       🏰 COMMONWEALTH MULTI-AGENT BUILD MONITOR 🏰            ');
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
