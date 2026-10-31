# Agent 13: 3D Technical Architecture & Performance Specifications

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-13.lock`
   - Update file `status/agent-13.json` with:
     ```json
     {
       "agentId": "agent-13",
       "name": "3D Technical & Performance Architecture",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Documenting 3D engine specifications, spatial coordinate systems, and WebGL budgets...",
       "exclusiveFiles": [
         "docs/technical/3d-engine-architecture.md",
         "docs/technical/spatial-coordinate-spec.md",
         "docs/technical/webgl-performance-budget.md",
         "docs/technical/byoai-integration-protocol.md",
         "docs/technical/smart-contract-spatial-api.md"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY files in `docs/technical/**`.
   ⚠️ **DO NOT TOUCH** `frontend/**` or `contracts/**`.

3. **ATOMIC GIT COMMIT & ONLINE SYNC (MANDATORY AFTER EVERY FILE/TASK)**:
   After creating or editing any file in your jurisdiction, you MUST immediately record a commit and push it online to GitHub:
   ```bash
   node scripts/agent-git.js agent-13 "Created or updated [filename]" [filepath]
   ```
   *Note: This script safely handles concurrent git locks, rebases with parallel agents, and pushes directly to GitHub so any file can be rolled back if an error occurs.*

4. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-13.lock`
   - Update `status/agent-13.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Principal 3D Graphics & Engine Architect**. You document the core technical specifications, 3D coordinate mapping rules, Rapier physics parameters, and WebGL performance budgets to ensure Sovereign Lands runs smoothly at 60 FPS on standard laptops and mobile browsers.

## Key Deliverables

### 1. `docs/technical/3d-engine-architecture.md`
System diagram and pipeline breakdown:
- Next.js 14 App Router + React Three Fiber loop.
- Rapier 3D physics stepping (fixed timestep 60Hz).
- Three-tier state management: Zustand for high-frequency 3D coordinates, React Query / Wagmi for on-chain state, LocalStorage for AI keys.

### 2. `docs/technical/spatial-coordinate-spec.md`
Formal mathematical specification:
- Real-world meters to WebGL Three.js units (1 unit = 1 meter).
- Global origin `(0, 0, 0)` located at the center of the Great Divide bridge.
- Bounding box collision schemas and parcel coordinate quantization.

### 3. `docs/technical/webgl-performance-budget.md`
Strict performance constraints for all 3D assets:
- Maximum draw calls: `< 120` per frame (via InstancedMesh and texture atlasing).
- Maximum polygon count: `< 150,000` triangles visible in view frustum.
- Texture memory budget: `< 45 MB` compressed VRAM.
- Draw distance: 250 meters with smooth fog falloff.

### 4. `docs/technical/byoai-integration-protocol.md`
Protocol specification for client-side AI inference, prompt sanitation, token throttling, and offline fallback mechanics.

### 5. `docs/technical/smart-contract-spatial-api.md`
API documentation for on-chain spatial bounding boxes, events, and gas estimates.
