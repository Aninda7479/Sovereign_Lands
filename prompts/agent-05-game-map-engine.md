# Agent 05: GTA-Style 3D Character & Camera Controller

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-05.lock`
   - Update file `status/agent-05.json` with:
     ```json
     {
       "agentId": "agent-05",
       "name": "3D Character & Camera Controller",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Building GTA-style third-person orbit camera and Rapier physics character...",
       "exclusiveFiles": [
         "frontend/src/components/character/PlayerController.tsx",
         "frontend/src/components/character/ThirdPersonCamera.tsx",
         "frontend/src/components/character/CharacterAnimation.tsx",
         "frontend/src/hooks/useCharacterControls.ts",
         "frontend/src/lib/physics/characterPhysics.ts"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the files listed in `exclusiveFiles`.
   ⚠️ **DO NOT TOUCH** `frontend/src/components/canvas/**` (Agent 04), `frontend/src/components/world/**` (Agent 06), or `frontend/src/app/**`.

3. **ATOMIC GIT COMMIT & ONLINE SYNC (MANDATORY AFTER EVERY FILE/TASK)**:
   After creating or editing any file in your jurisdiction, you MUST immediately record a commit and push it online to GitHub:
   ```bash
   node scripts/agent-git.js agent-05 "Created or updated [filename]" [filepath]
   ```
   *Note: This script safely handles concurrent git locks, rebases with parallel agents, and pushes directly to GitHub so any file can be rolled back if an error occurs.*

4. **PARALLEL INDEPENDENCE (STUB RULE)**:
   If 3D models from Agent 03 are still building, use a temporary low-poly humanoid capsule mesh with colored joints so you can develop and test movement independently.

5. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-05.lock`
   - Update `status/agent-05.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead Gameplay & Physics Programmer**. You bring the signature **GTA-style third-person feel** to Sovereign Lands: an over-the-shoulder orbit follow camera, responsive WASD character locomotion, sprint, jump, surface slope alignment, and Rapier 3D capsule physics.

## Key Deliverables

### 1. `frontend/src/hooks/useCharacterControls.ts`
Keyboard and mouse input listener:
- `forward` (`KeyW` / `ArrowUp`), `backward` (`KeyS` / `ArrowDown`).
- `left` (`KeyA`), `right` (`KeyD`).
- `sprint` (`ShiftLeft` / `ShiftRight`): increases movement speed by 1.8x.
- `jump` (`Space`): applies vertical impulse if grounded.
- `interact` (`KeyE`): triggers proximity interaction with NPCs or doors.
- `build` (`KeyC`): opens in-world 3D building menu on owned parcels.
- `buy` (`KeyB`): triggers land purchase on unowned parcels.

### 2. `frontend/src/components/character/ThirdPersonCamera.tsx`
GTA-style over-the-shoulder follow camera:
- Orbits around the player character with mouse movement (Pointer Lock or right-click drag).
- Smooth interpolation (`lerp`) dampening camera lag behind character velocity.
- Raycast camera collision avoidance (pulls closer if a building or wall obstructs the line of sight).
- Dynamic FOV shift: slightly widens during sprinting for speed sensation.

### 3. `frontend/src/components/character/PlayerController.tsx`
The player character entity inside Rapier Physics:
- Rigid body with dynamic capsule collider (`RigidBody` type `dynamic`, `lockRotations`).
- Moves relative to camera forward vector (pressing `W` always runs in the direction the camera is facing).
- Smooth character mesh rotation toward movement direction.
- Ground check raycast to prevent infinite jumping.

### 4. `frontend/src/components/character/CharacterAnimation.tsx`
Procedural or skeletal animation controller:
- State transitions: `idle` -> `walk` -> `run` -> `jump` -> `fall`.
- Procedural limb swing and bobbing motion if raw skeletal animations are still loading.
