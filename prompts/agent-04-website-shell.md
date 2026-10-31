# Agent 04: Next.js Shell & 3D Canvas Viewport (React Three Fiber)

---
## 🔒 BUILT-IN LOCK & PARALLEL EXECUTION PROTOCOL (MANDATORY)

To enable 100% safe parallel execution alongside 15 other concurrent coding agents with ZERO collision:

1. **ACQUIRE LOCK ON START**:
   Immediately at the start of your execution:
   - Create file `status/agent-04.lock`
   - Update file `status/agent-04.json` with:
     ```json
     {
       "agentId": "agent-04",
       "name": "Website Shell & 3D Canvas",
       "status": "UNDER_CONSTRUCTION",
       "startedAt": "2026-10-31T06:00:00Z",
       "progress": "Scaffolding Next.js 14, React Three Fiber Canvas, and UI shell...",
       "exclusiveFiles": [
         "frontend/package.json",
         "frontend/tsconfig.json",
         "frontend/next.config.js",
         "frontend/tailwind.config.ts",
         "frontend/src/app/globals.css",
         "frontend/src/app/layout.tsx",
         "frontend/src/components/canvas/GameCanvas.tsx",
         "frontend/src/components/canvas/SceneLighting.tsx",
         "frontend/src/components/canvas/PostProcessing.tsx",
         "frontend/src/components/ui/LoadingScreen.tsx",
         "frontend/src/components/ui/UnderConstruction.tsx"
       ]
     }
     ```

2. **EXCLUSIVE FILE JURISDICTION (STRICT BOUNDARY)**:
   You are strictly permitted to create or modify ONLY the files listed above.
   ⚠️ **DO NOT TOUCH** `frontend/src/app/page.tsx` (owned by Agent 15), `frontend/src/components/character/**` (Agent 05), or `frontend/src/components/world/**` (Agent 06).

3. **RELEASE LOCK ON COMPLETION**:
   - Delete `status/agent-04.lock`
   - Update `status/agent-04.json` with `"status": "READY"`.
---

## Role & Goal
You are the **Lead Web & 3D Engine Systems Engineer**. You set up the Next.js 14 project, configure the 3D WebGL Canvas via `@react-three/fiber` and `@react-three/drei`, establish post-processing, cinematic lighting, and the shared UI design system.

## Key Deliverables

### 1. `frontend/package.json`
Dependencies for 3D open-world gaming:
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "three": "^0.165.0",
    "@types/three": "^0.165.0",
    "@react-three/fiber": "^8.16.0",
    "@react-three/drei": "^9.106.0",
    "@react-three/rapier": "^1.4.0",
    "lucide-react": "^0.395.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "framer-motion": "^11.2.0"
  }
}
```

### 2. `frontend/src/components/canvas/GameCanvas.tsx`
Full-viewport 3D Canvas with:
- WebGL 2 rendering context.
- Antialiasing and shadow map configuration (PCFSoftShadowMap).
- Responsive resizing with device pixel ratio clamp `Math.min(window.devicePixelRatio, 2)`.
- Suspense boundary with a stylish medieval loading screen.

### 3. `frontend/src/components/canvas/SceneLighting.tsx`
Atmospheric medieval open-world lighting:
- Dynamic directional sunlight with shadow cascades.
- Sky dome with sun/moon positioning.
- Soft ambient fill light.
- Warm point lights for torches and lanterns.

### 4. `frontend/src/components/ui/LoadingScreen.tsx`
Medieval parchment loading screen with animated 3D crest, progress bar, and randomized world lore tips.

### 5. `frontend/src/components/ui/UnderConstruction.tsx`
Standardized 3D / HUD fallback card that visually indicates when a module is currently being built by another parallel agent.
