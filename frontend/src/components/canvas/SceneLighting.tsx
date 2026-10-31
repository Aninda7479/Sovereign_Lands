'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';

export interface SceneLightingProps {
  timeOfDay?: 'day' | 'sunset' | 'night';
  enableShadows?: boolean;
  shadowResolution?: number;
}

/**
 * Atmospheric open-world lighting component for Sovereign Lands:
 * Directional sunlight with optimized shadow cascades, soft ambient fill, hemisphere lighting,
 * and point lights for torches.
 */
export function SceneLighting({
  timeOfDay = 'day',
  enableShadows = true,
  shadowResolution = 1024,
}: SceneLightingProps) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  // Time-of-day atmospheric configurations
  const config = {
    day: {
      sunColor: '#fffbeb',
      sunIntensity: 2.2,
      sunPos: [80, 130, 60] as [number, number, number],
      ambientColor: '#e0f2fe',
      ambientIntensity: 0.45,
      hemiSky: '#7dd3fc',
      hemiGround: '#451a03',
      hemiIntensity: 0.5,
      fogColor: '#93c5fd',
      fogNear: 250,
      fogFar: 3500,
    },
    sunset: {
      sunColor: '#fdba74',
      sunIntensity: 2.6,
      sunPos: [140, 45, -30] as [number, number, number],
      ambientColor: '#fed7aa',
      ambientIntensity: 0.4,
      hemiSky: '#fb923c',
      hemiGround: '#292524',
      hemiIntensity: 0.4,
      fogColor: '#f97316',
      fogNear: 200,
      fogFar: 3000,
    },
    night: {
      sunColor: '#93c5fd',
      sunIntensity: 0.6,
      sunPos: [-60, 90, -40] as [number, number, number],
      ambientColor: '#1e293b',
      ambientIntensity: 0.25,
      hemiSky: '#0f172a',
      hemiGround: '#020617',
      hemiIntensity: 0.2,
      fogColor: '#020617',
      fogNear: 150,
      fogFar: 2500,
    },
  }[timeOfDay];

  return (
    <>
      {/* Distance Atmosphere Fog */}
      <fog attach="fog" args={[config.fogColor, config.fogNear, config.fogFar]} />

      {/* Soft Omnidirectional Ambient Fill Light */}
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity} />

      {/* Hemisphere Natural Ground/Sky Bounce */}
      <hemisphereLight
        args={[config.hemiSky, config.hemiGround, config.hemiIntensity]}
        position={[0, 100, 0]}
      />

      {/* Main Directional Sun / Moon with Shadow Mapping */}
      <directionalLight
        ref={dirLightRef}
        position={config.sunPos}
        color={config.sunColor}
        intensity={config.sunIntensity}
        castShadow={enableShadows}
        shadow-mapSize-width={shadowResolution}
        shadow-mapSize-height={shadowResolution}
        shadow-camera-near={1.0}
        shadow-camera-far={600}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.0004}
      />

      {/* Central Great Divide Bridge Torch Lights (Warm Glow) */}
      <pointLight
        position={[0, 4, 0]}
        color="#f59e0b"
        intensity={3.0}
        distance={25}
        decay={2}
      />
      <pointLight
        position={[-15, 5, 0]}
        color="#f97316"
        intensity={2.5}
        distance={20}
        decay={2}
      />
      <pointLight
        position={[15, 5, 0]}
        color="#f97316"
        intensity={2.5}
        distance={20}
        decay={2}
      />
    </>
  );
}

export default SceneLighting;
