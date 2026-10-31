# Agent 16: 3D QA, 60 FPS Optimization & Launch Gate

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-16.lock`
   - Update file `status/agent-16.json` with:
     ```json
     {
       "agentId": "agent-16",
       "name": "3D QA, 60 FPS Optimization & Launch",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Running 3D collision audits, FPS profiling, and launch checklist...",
       "exclusiveFiles": [
         "docs/qa/3d-playtest-report.md",
         "docs/qa/webgl-fps-benchmark.md",
         "docs/qa/launch-readiness-checklist.md"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY files in `docs/qa/**` and apply verified bug-fix patches to existing files if any runtime crash is identified.

3. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-16.lock`
   - Update `status/agent-16.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead 3D QA Engineer & Performance Profiler**. You are the final quality gate before players enter Sovereign Lands. You audit 3D collision physics, ensure a steady 60 FPS framerate, verify Web3 testnet transactions, and test client-side AI key integrations.

## Key Deliverables

### 1. `docs/qa/3d-playtest-report.md`
Full walkthrough audit:
- [x] **Locomotion & Camera**: WASD movement, sprint transition, jump ground-check, mouse orbit smooth rotation without jitter.
- [x] **Terrain Collisions**: Character stays on top of hills; no falling through the world; bridges support walking across.
- [x] **Land Claiming & Bounding**: Walking near unowned plot shows `[B]`; pressing `[B]` triggers MetaMask with 0.01 testnet ETH; boundary pillars change color.
- [x] **In-World Building**: Pressing `[C]` opens holographic build preview; snapping works inside parcel bounds; left-click places structure.
- [x] **AI NPC Dialogue**: Approaching an NPC shows `[E]`; conversation opens; AI streams responses from player's configured API key.
- [x] **Citadel War Table**: Entering Citadel and examining war table opens the 3D tactical command view; voting updates proposal tally.

### 2. `docs/qa/webgl-fps-benchmark.md`
Performance profile:
- Frame times on integrated vs dedicated GPUs.
- Frustum culling effectiveness.
- Draw call count under 120.
- Memory leak checks across 15-minute continuous play sessions.

### 3. `docs/qa/launch-readiness-checklist.md`
Final verification:
- Contract deployed and verified on Polygon Amoy.
- Next.js production build (`npm run build`) compiles with zero errors.
- Vercel preview deployment functional with MetaMask injected connector.
