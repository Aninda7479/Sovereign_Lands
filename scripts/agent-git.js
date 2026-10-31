const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOCK_FILE = path.join(ROOT_DIR, '.git_agent_sync.lock');

/**
 * Acquire atomic mutex lock to prevent concurrent git index.lock collisions
 */
function acquireLock(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      // wx flag: open for writing, fails if path exists
      fs.writeFileSync(LOCK_FILE, `${process.pid} at ${new Date().toISOString()}`, { flag: 'wx' });
      return true;
    } catch (e) {
      // Lock is held by another concurrent agent, wait 200-500ms and retry
      const delay = 200 + Math.floor(Math.random() * 300);
      const waitTill = Date.now() + delay;
      while (Date.now() < waitTill) {} // sync sleep
    }
  }

  // Stale lock check (if lock is older than 45 seconds, break it)
  try {
    const stats = fs.statSync(LOCK_FILE);
    if (Date.now() - stats.mtimeMs > 45000) {
      fs.unlinkSync(LOCK_FILE);
      return acquireLock(5000);
    }
  } catch (err) {}

  throw new Error(`[agent-git] Timed out waiting for git lock (${timeoutMs}ms)`);
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (err) {}
}

/**
 * Safe concurrent commit and push for multi-agent workflows
 * Usage: node scripts/agent-git.js <agentId> "<commit message>" [file1] [file2] ...
 */
function runAgentGit() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/agent-git.js <agentId> "<commit message>" [specific_files...]');
    process.exit(1);
  }

  const agentId = args[0].toLowerCase();
  const rawMessage = args[1];
  const specificFiles = args.slice(2);

  const commitMessage = `[${agentId.toUpperCase()}] ${rawMessage}`;

  console.log(`\n🔒 [${agentId.toUpperCase()}] Requesting git sync lock...`);
  acquireLock();

  try {
    // 1. Stage specified files (or status file if nothing else passed)
    if (specificFiles.length > 0) {
      for (const file of specificFiles) {
        if (fs.existsSync(path.resolve(ROOT_DIR, file))) {
          execSync(`git add "${file}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
        }
      }
    }

    // Always stage the agent's status file
    const statusFile = path.join('status', `${agentId}.json`);
    if (fs.existsSync(path.resolve(ROOT_DIR, statusFile))) {
      execSync(`git add "${statusFile}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
    }

    // 2. Check if anything is actually staged
    const statusOutput = execSync('git status --porcelain', { cwd: ROOT_DIR }).toString().trim();
    if (!statusOutput) {
      console.log(`ℹ️ [${agentId.toUpperCase()}] No staged changes to commit.`);
      return;
    }

    // 3. Commit
    console.log(`💾 [${agentId.toUpperCase()}] Committing: "${commitMessage}"...`);
    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: ROOT_DIR, stdio: 'inherit' });

    // 4. Pull with rebase to incorporate work from other parallel agents
    console.log(`🔄 [${agentId.toUpperCase()}] Syncing latest commits from remote...`);
    try {
      execSync('git pull --rebase origin main', { cwd: ROOT_DIR, stdio: 'inherit' });
    } catch (pullErr) {
      console.warn(`⚠️ [${agentId.toUpperCase()}] Pull rebase warning (continuing push):`, pullErr.message);
    }

    // 5. Push online
    console.log(`🚀 [${agentId.toUpperCase()}] Publishing commit online to GitHub...`);
    try {
      execSync('git push origin main', { cwd: ROOT_DIR, stdio: 'inherit' });
      console.log(`✅ [${agentId.toUpperCase()}] Successfully published to remote repository!`);
    } catch (pushErr) {
      console.warn(`⚠️ [${agentId.toUpperCase()}] Push failed (changes committed locally, will push next cycle):`, pushErr.message);
    }

  } catch (error) {
    console.error(`❌ [${agentId.toUpperCase()}] Git sync error:`, error.message);
    process.exitCode = 1;
  } finally {
    releaseLock();
    console.log(`🔓 [${agentId.toUpperCase()}] Released git lock.\n`);
  }
}

if (require.main === module) {
  runAgentGit();
}

module.exports = { runAgentGit };
