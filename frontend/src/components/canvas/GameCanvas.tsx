'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneLighting } from './SceneLighting';
import { PostProcessing } from './PostProcessing';
import { LoadingScreen } from '../ui/LoadingScreen';

export interface GameCanvasProps {
  children?: React.ReactNode;
  timeOfDay?: 'day' | 'sunset' | 'night';
  enableShadows?: boolean;
  showLighting?: boolean;
  className?: string;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
}

/**
 * Full-viewport 3D WebGL Canvas for Sovereign Lands.
 * Configured with WebGL 2, PCFSoftShadowMap, ACESFilmic tone mapping,
 * devicePixelRatio clamp, and Suspense loading fallback.
 */
export function GameCanvas({
  children,
  timeOfDay = 'day',
  enableShadows = true,
  showLighting = true,
  className = '',
  cameraPosition = [0, 8, 14],
  cameraFov = 60,
}: GameCanvasProps) {
  return (
    <div className={`game-viewport relative w-screen h-screen overflow-hidden bg-slate-950 ${className}`}>
      <Canvas
        shadows={{
          type: THREE.PCFSoftShadowMap,
        }}
        dpr={[1, 2]} // Clamps device pixel ratio to 2 for crisp 60 FPS on Retina displays
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
          preserveDrawingBuffer: false,
        }}
        camera={{
          position: cameraPosition,
          fov: cameraFov,
          near: 0.1,
          far: 1000,
        }}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <Suspense fallback={null}>
          {showLighting && <SceneLighting timeOfDay={timeOfDay} enableShadows={enableShadows} />}
          {children}
        </Suspense>
      </Canvas>

      {/* Cinematic Vignette Overlay */}
      <PostProcessing />
    </div>
  );
}

export default GameCanvas;
