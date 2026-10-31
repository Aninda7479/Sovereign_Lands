# Agent 14: Project Face, 3D Gameplay Trailer Script & Pitch

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-14.lock`
   - Update file `status/agent-14.json` with:
     ```json
     {
       "agentId": "agent-14",
       "name": "README, 3D Trailer Script & Pitch",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Writing master README.md, GTA-style demo trailer script, and pitch deck...",
       "exclusiveFiles": [
         "README.md",
         "CHANGELOG.md",
         "LICENSE",
         "docs/presentation/3d-trailer-script.md",
         "docs/presentation/investor-pitch-deck.md",
         "docs/presentation/social-announcement.md"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the root `README.md`, `CHANGELOG.md`, `LICENSE`, and `docs/presentation/**`.
   ⚠️ **DO NOT TOUCH** `frontend/**` or `contracts/**`.

3. **ATOMIC GIT COMMIT & ONLINE SYNC (MANDATORY AFTER EVERY FILE/TASK)**:
   After creating or editing any file in your jurisdiction, you MUST immediately record a commit and push it online to GitHub:
   ```bash
   node scripts/agent-git.js agent-14 "Created or updated [filename]" [filepath]
   ```
   *Note: This script safely handles concurrent git locks, rebases with parallel agents, and pushes directly to GitHub so any file can be rolled back if an error occurs.*

4. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-14.lock`
   - Update `status/agent-14.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead Evangelist & Product Storyteller**. You write the master root `README.md` that immediately captivates any developer or player who lands on the repository, the cinematic 2-minute GTA-style gameplay trailer script, and the executive pitch deck.

## Key Deliverables

### 1. `README.md` (Root)
- **Hero Title**: *"🏰 Sovereign Lands — 3D Third-Person Open-World Kingdom (GTA-Style Web3 Sandbox)"*
- **The Hook**: *"Walk the streets of a living medieval realm. Own 3D land parcels as NFTs, construct strongholds in real-time, speak with roaming AI NPCs powered by your own API key, and battle for kingdom sovereignty — running 100% in your browser."*
- **Live Demo Link & Screenshots / GIFs**.
- **Key Features**:
  - 🎮 Third-person over-the-shoulder GTA camera with WASD locomotion.
  - 🌐 Expansive 3D medieval landscape (North Frostfang vs. South Solara).
  - 🤖 BYOAI NPCs (villagers, guards, advisors) roaming with real-time LLM intelligence.
  - 🧱 In-world holographic building placement.
  - ⛓️ Smart contract parcel deeds on Polygon Amoy testnet.
- **Quickstart Guide** (install, dev server, deploy).

### 2. `docs/presentation/3d-trailer-script.md`
A high-energy, 2-minute cinematic gameplay walkthrough:
- *0:00 - 0:30 (The World)*: Camera swoops across the Great Divide river. Player spawns, runs down the cobblestone road with third-person camera.
- *0:30 - 1:00 (Land & Build)*: Player approaches a glowing parcel pillar, presses `[B]` to buy. Presses `[C]`, holographic Farmstead rotates and snaps to ground.
- *1:00 - 1:30 (The AI NPCs)*: Walks up to Sir Gareth patrolling the bridge, presses `[E]`. Talks to him using local Ollama/OpenAI API key.
- *1:30 - 2:00 (Citadel & War)*: Enters Citadel Keep, looks at the 3D War Table hologram, votes on war. Closing slogan: *"Sovereign Lands: The Kingdom decided this, not a server."*

### 3. `docs/presentation/investor-pitch-deck.md`
Executive summary of the market opportunity: merging open-world browser gaming, autonomous AI agents, and player-owned decentralized real estate.
