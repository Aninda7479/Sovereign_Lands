# Agent 09: Roaming 3D NPC Engine & GTA-Style Dialogue HUD

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-09.lock`
   - Update file `status/agent-09.json` with:
     ```json
     {
       "agentId": "agent-09",
       "name": "3D Roaming NPC Engine & Dialogue HUD",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Building 3D waypoint navigation, proximity trigger, and GTA dialogue interface...",
       "exclusiveFiles": [
         "ai-system/npc-engine/NPCManager.ts",
         "ai-system/npc-engine/NPCRoamingController.ts",
         "ai-system/npc-engine/NPCProfiles.ts",
         "frontend/src/components/npc-dialogue/NPCWorldEntity.tsx",
         "frontend/src/components/npc-dialogue/DialogueHUD.tsx",
         "frontend/src/components/npc-dialogue/FloatingSpeechBubble.tsx"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the files in `exclusiveFiles`.
   ⚠️ **DO NOT TOUCH** `ai-system/providers/**` (Agent 08 owns providers) or `frontend/src/app/**`.

3. **ATOMIC GIT COMMIT & ONLINE SYNC (MANDATORY AFTER EVERY FILE/TASK)**:
   After creating or editing any file in your jurisdiction, you MUST immediately record a commit and push it online to GitHub:
   ```bash
   node scripts/agent-git.js agent-09 "Created or updated [filename]" [filepath]
   ```
   *Note: This script safely handles concurrent git locks, rebases with parallel agents, and pushes directly to GitHub so any file can be rolled back if an error occurs.*

4. **PARALLEL INDEPENDENCE (STUB RULE)**:
   If Agent 08's LLM adapters are not ready, use a fallback mock response generator with canned medieval dialogue so NPC wandering and UI interaction can be tested immediately.

5. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-09.lock`
   - Update `status/agent-09.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead NPC AI & Dialogue Systems Programmer**. You implement GTA-style living NPCs that wander the 3D world along waypoints, carry out daily routines (farming, patrolling, trading), display floating 3D speech bubbles, and engage in voice/text dialogue when approached by the player.

## Key Deliverables

### 1. `ai-system/npc-engine/NPCProfiles.ts`
Rich character profiles for 3D world entities:
- **Aldric (The Boreal Farmer)**: Tends crops in North; complains of the frost; dreams of low taxes.
- **Sir Gareth (The Fortress Guard)**: Patrols the Great Divide bridge; evaluates enemy armies; demands high defense ratings.
- **Merin (The Citadel Royal Advisor)**: Studies kingdom war statistics; counsels on treasury distributions.
- **Zara (The Frontier Trader)**: Wanders between North and South; trades gold tips and rumors of imminent wars.

### 2. `ai-system/npc-engine/NPCRoamingController.ts`
3D movement & spatial AI:
- Waypoint patrol paths between buildings, roads, and bridges.
- Idle behaviors: stops to inspect fields, warms hands by torches, looks around.
- Player avoidance / stopping to face the player when approached.

### 3. `frontend/src/components/npc-dialogue/NPCWorldEntity.tsx`
3D React Three Fiber entity for each NPC:
- 3D mesh positioned in world coordinates.
- Proximity detection sphere (5-meter radius): shows `[E] Speak with {NPC Name}` prompt.
- Smooth turn-to-face rotation when the player enters conversation.

### 4. `frontend/src/components/npc-dialogue/DialogueHUD.tsx`
Cinematic GTA / Witcher style conversation overlay:
- Bottom-screen dialogue box with NPC portrait, name, and role.
- Dynamic AI speech generation powered by Agent 08's LLM adapter.
- Real-time text streaming effect with typing sounds.
- Player response choices or free-form text input ("Ask about kingdom rumors", "Hire for farm work", "Inquire about rival kingdom defenses").

### 5. `frontend/src/components/npc-dialogue/FloatingSpeechBubble.tsx`
3D billboard text bubble hovering over NPCs' heads for ambient barking ("Cold winds from the North...", "Taxes are too high!", "The bridge is guarded!").
