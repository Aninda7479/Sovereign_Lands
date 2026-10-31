# Agent 11: 3D Kingdom Lore & World Monuments

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-11.lock`
   - Update file `status/agent-11.json` with:
     ```json
     {
       "agentId": "agent-11",
       "name": "3D Kingdom Lore & World Bible",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Writing open-world lore, runestone inscriptions, and kingdom histories...",
       "exclusiveFiles": [
         "docs/lore/realm-history.md",
         "docs/lore/factions-and-heraldry.md",
         "docs/lore/monument-inscriptions.md",
         "docs/lore/npc-character-dialogue.md",
         "docs/lore/in-game-lexicon.md"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY files in `docs/lore/**`.
   ⚠️ **DO NOT TOUCH** `frontend/**` or other doc directories.

3. **ATOMIC GIT COMMIT & ONLINE SYNC (MANDATORY AFTER EVERY FILE/TASK)**:
   After creating or editing any file in your jurisdiction, you MUST immediately record a commit and push it online to GitHub:
   ```bash
   node scripts/agent-git.js agent-11 "Created or updated [filename]" [filepath]
   ```
   *Note: This script safely handles concurrent git locks, rebases with parallel agents, and pushes directly to GitHub so any file can be rolled back if an error occurs.*

4. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-11.lock`
   - Update `status/agent-11.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead World Builder & Narrative Designer**. You craft the deep lore, faction histories, and environmental storytelling for the 3D open world of Sovereign Lands.

## Key Deliverables

### 1. `docs/lore/realm-history.md`
The saga of the Sovereign Continent:
- The Ancient Cataclysm that carved the Great Divide river.
- The founding of **Frostfang Citadel** (North Kingdom) and **Solara Keep** (South Kingdom).
- The Covenant of Land: Why land deeds are permanent, cryptographic seals granted by the ancient monarchs.

### 2. `docs/lore/factions-and-heraldry.md`
Detailed cultural profiles:
- **Kingdom of Boreal (The North)**: Slate blue heraldry, Direwolf crest, austere stone fortresses, emphasis on collective fortress defense and mountain mining.
- **Kingdom of Solara (The South)**: Sun-gold and crimson heraldry, Golden Lion crest, sprawling fertile farmsteads, merchant guilds, rapid economic expansion.

### 3. `docs/lore/monument-inscriptions.md`
Flavor text and lore fragments carved onto 3D runestones, ruins, and bridge plaques scattered across the open world for players to discover when exploring.

### 4. `docs/lore/npc-character-dialogue.md`
Pre-authored character bibles and personality seeds for the AI NPC engine (Aldric, Sir Gareth, Merin, Zara) ensuring their dialogue stays authentic and immersive.

### 5. `docs/lore/in-game-lexicon.md`
Terminology guide mapping Web3 mechanics into medieval lore (e.g. NFT -> *Sovereign Deed*, Gas -> *Royal Offering*, Testnet ETH -> *Alchemical Silver*).
