# Agent 15: Master 3D Integration & Scene Wiring

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-15.lock`
   - Update file `status/agent-15.json` with:
     ```json
     {
       "agentId": "agent-15",
       "name": "Master 3D Integration & Wiring",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Assembling 3D Canvas, Physics world, Character controller, and HUD overlays into page.tsx...",
       "exclusiveFiles": [
         "frontend/src/app/page.tsx",
         "frontend/src/providers/GameProvider.tsx",
         "frontend/src/components/scene/MainScene.tsx",
         "frontend/vercel.json"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the files in `exclusiveFiles`.
   ⚠️ **DO NOT TOUCH** individual module components (Agents 04-12 own their components). You import them and wire them into the live scene.

3. **ATOMIC GIT COMMIT & ONLINE SYNC (MANDATORY AFTER EVERY FILE/TASK)**:
   After creating or editing any file in your jurisdiction, you MUST immediately record a commit and push it online to GitHub:
   ```bash
   node scripts/agent-git.js agent-15 "Created or updated [filename]" [filepath]
   ```
   *Note: This script safely handles concurrent git locks, rebases with parallel agents, and pushes directly to GitHub so any file can be rolled back if an error occurs.*

4. **PARALLEL INDEPENDENCE (UNDER-CONSTRUCTION SHIELD)**:
   When assembling `MainScene.tsx` and `page.tsx`, check `status/agent-XX.json` for each module. If an agent is not yet `"status": "READY"`, render the module inside a safe `<Suspense fallback={<UnderConstruction moduleName="..." agentId="..." />}>` wrapper so the build NEVER fails!

5. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-15.lock`
   - Update `status/agent-15.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead Integration Architect & Master Assembler**. You take the 3D Canvas from Agent 04, the Character Controller from Agent 05, the Terrain and Parcels from Agent 06, the Web3 HUD from Agent 07, the AI NPC Spawner from Agent 09, and the Radar Mini-Map from Agent 12, and assemble them into the unified, playable 3D experience in `frontend/src/app/page.tsx`.

## Key Deliverables

### 1. `frontend/src/components/scene/MainScene.tsx`
The primary 3D scene tree inside React Three Fiber & Rapier Physics:
```tsx
export function MainScene() {
  return (
    <>
      <SceneLighting />
      <Physics gravity={[0, -9.81, 0]}>
        <OpenWorldTerrain />
        <WaterRiver />
        <ParcelBoundaryRenderer />
        <StructureManager />
        <HologramBuildPreview />
        <PlayerController />
        <NPCWorldEntity npcId="aldric" />
        <NPCWorldEntity npcId="gareth" />
        <WarTableEntity />
      </Physics>
      <PostProcessing />
    </>
  );
}
```

### 2. `frontend/src/app/page.tsx`
The root page assembling the 3D Canvas with 2D DOM HUD overlays:
```tsx
export default function GamePage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D Canvas Viewport */}
      <GameCanvas>
        <MainScene />
      </GameCanvas>

      {/* 2D HUD Overlays */}
      <TopResourceHUD />
      <RadarMiniMap />
      <CompassHeading />
      <QuestObjectiveHUD />
      <InteractionPrompt />
      <DialogueHUD />
      <CitadelCouncilModal />
      <AISettingsModal />
      <TransactionToast />
    </main>
  );
}
```

### 3. `frontend/src/providers/GameProvider.tsx`
Wraps React Query, WagmiProvider, and Zustand game store providers.

### 4. `frontend/vercel.json`
Deployment configuration for one-click Vercel hosting.
