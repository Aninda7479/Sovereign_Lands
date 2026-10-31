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
  graphicsQuality?: 'low' | 'medium' | 'high';
}

/**
 * Full-viewport 3D WebGL Canvas for Sovereign Lands.
 * Configured for high FPS with adaptive DPR clamp, optimized ACESFilmic tone mapping,
 * and scalable graphics quality presets.
 */
export function GameCanvas({
  children,
  timeOfDay = 'day',
  enableShadows = true,
  showLighting = true,
  className = '',
  cameraPosition = [0, 8, 14],
  cameraFov = 60,
  graphicsQuality = 'medium',
}: GameCanvasProps) {
  // Adaptive resolution scaling
  const effectiveDpr: number | [number, number] =
    graphicsQuality === 'high' ? [1, 1.25] : 1;

  const effectiveShadows =
    graphicsQuality === 'low'
      ? false
      : graphicsQuality === 'medium'
      ? { type: THREE.BasicShadowMap }
      : { type: THREE.PCFSoftShadowMap };

  return (
    <div className={`game-viewport relative w-screen h-screen overflow-hidden bg-slate-950 ${className}`}>
      <Canvas
        shadows={effectiveShadows}
        dpr={effectiveDpr} // Capped at 1.0 (or 1.25 on High) to prevent GPU fillrate lag on high-DPI screens
        gl={{
          antialias: graphicsQuality !== 'low',
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
          far: 4500,
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
          {showLighting && (
            <SceneLighting
              timeOfDay={timeOfDay}
              enableShadows={enableShadows && graphicsQuality !== 'low'}
            />
          )}
          {children}
        </Suspense>
      </Canvas>

      {/* Cinematic Vignette Overlay */}
      <PostProcessing />
    </div>
  );
}

export default GameCanvas;
