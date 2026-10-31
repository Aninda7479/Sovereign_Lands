'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Compass, Navigation2 } from 'lucide-react';
import { WaypointData } from './RadarMiniMap';

export interface CompassHeadingProps {
  cameraYaw?: number; // radians
  playerPosition?: [number, number, number];
  activeWaypoint?: WaypointData | null;
  className?: string;
  fovDegrees?: number; // visible angular span across the compass tape (e.g. 100 degrees)
}

interface CompassMarker {
  id: string;
  worldX: number;
  worldZ: number;
  label: string;
  badge: string;
  color: string;
  type: 'quest' | 'citadel' | 'npc';
}

// Major POIs on the compass horizon
const KNOWN_POIS: CompassMarker[] = [
  {
    id: 'north_citadel',
    worldX: 0,
    worldZ: -120,
    label: 'North Citadel',
    badge: '🏰',
    color: '#38bdf8',
    type: 'citadel',
  },
  {
    id: 'south_citadel',
    worldX: 0,
    worldZ: 120,
    label: 'South Citadel',
    badge: '🏰',
    color: '#f87171',
    type: 'citadel',
  },
  {
    id: 'npc_gareth',
    worldX: 0,
    worldZ: -22,
    label: 'Sir Gareth',
    badge: '🛡️',
    color: '#60a5fa',
    type: 'npc',
  },
  {
    id: 'npc_aldric',
    worldX: -35,
    worldZ: -65,
    label: 'Aldric',
    badge: '🌾',
    color: '#4ade80',
    type: 'npc',
  },
  {
    id: 'npc_merin',
    worldX: 30,
    worldZ: -110,
    label: 'Merin',
    badge: '📜',
    color: '#c084fc',
    type: 'npc',
  },
  {
    id: 'npc_zara',
    worldX: 15,
    worldZ: 45,
    label: 'Zara',
    badge: '💰',
    color: '#fbbf24',
    type: 'npc',
  },
];

/**
 * GTA / Skyrim-Style Minimalist 3D Compass Heading Tape
 * - Positioned at top-center of the screen
 * - Continuous rotating tape showing cardinal directions (N, E, S, W) and degree bearings
 * - Renders dynamic POI markers (Citadels, NPCs, and Active Quest Objective)
 * - Highlights off-screen waypoint directions with left/right guidance chevrons
 */
export function CompassHeading({
  cameraYaw: propsYaw,
  playerPosition: propsPos,
  activeWaypoint: propsWaypoint,
  className = '',
  fovDegrees = 110,
}: CompassHeadingProps) {
  const [yaw, setYaw] = useState<number>(propsYaw || 0);
  const [playerPos, setPlayerPos] = useState<[number, number, number]>(propsPos || [0, 1.8, 0]);
  const [activeWaypoint, setActiveWaypoint] = useState<WaypointData | null>(
    propsWaypoint || {
      id: 'default_quest',
      x: -40,
      z: -40,
      label: 'The Claim',
      description: 'Frontier Settlement',
    }
  );

  // Sync props
  useEffect(() => {
    if (propsYaw !== undefined) setYaw(propsYaw);
  }, [propsYaw]);

  useEffect(() => {
    if (propsPos) setPlayerPos(propsPos);
  }, [propsPos]);

  useEffect(() => {
    if (propsWaypoint !== undefined) setActiveWaypoint(propsWaypoint);
  }, [propsWaypoint]);

  // Window event listeners for universal game canvas integration
  useEffect(() => {
    const handleYaw = (e: Event) => {
      const custom = e as CustomEvent<number>;
      if (typeof custom.detail === 'number') {
        setYaw(custom.detail);
      }
    };

    const handlePos = (e: Event) => {
      const custom = e as CustomEvent<[number, number, number] | { x: number; y: number; z: number }>;
      if (Array.isArray(custom.detail)) {
        setPlayerPos(custom.detail);
      } else if (custom.detail && typeof custom.detail === 'object') {
        setPlayerPos([custom.detail.x, custom.detail.y, custom.detail.z]);
      }
    };

    const handleWaypoint = (e: Event) => {
      const custom = e as CustomEvent<WaypointData | null>;
      if (custom.detail !== undefined) {
        setActiveWaypoint(custom.detail);
      }
    };

    window.addEventListener('sovereign-camera-yaw', handleYaw);
    window.addEventListener('sovereign-player-move', handlePos);
    window.addEventListener('sovereign-waypoint-set', handleWaypoint);

    return () => {
      window.removeEventListener('sovereign-camera-yaw', handleYaw);
      window.removeEventListener('sovereign-player-move', handlePos);
      window.removeEventListener('sovereign-waypoint-set', handleWaypoint);
    };
  }, []);

  // Convert camera yaw (radians) into heading degrees (0 to 360)
  // In our coordinate space: 0 rad looks towards -Z (North = 0 deg)
  const currentHeadingDeg = useMemo(() => {
    const rawDeg = (yaw * 180) / Math.PI;
    return ((rawDeg % 360) + 360) % 360;
  }, [yaw]);

  // Cardinal abbreviation for current bearing
  const headingText = useMemo(() => {
    const deg = Math.round(currentHeadingDeg);
    const cardinals = [
      { max: 22.5, text: 'N' },
      { max: 67.5, text: 'NE' },
      { max: 112.5, text: 'E' },
      { max: 157.5, text: 'SE' },
      { max: 202.5, text: 'S' },
      { max: 247.5, text: 'SW' },
      { max: 292.5, text: 'W' },
      { max: 337.5, text: 'NW' },
      { max: 360, text: 'N' },
    ];
    const match = cardinals.find((c) => deg <= c.max) || { text: 'N' };
    return `${deg.toString().padStart(3, '0')}° ${match.text}`;
  }, [currentHeadingDeg]);

  // Width of the tape container in px
  const tapeWidthPx = 420;

  // Generate tick marks from -fov/2 to +fov/2 around the current heading
  const tickMarks = useMemo(() => {
    const halfFov = fovDegrees / 2;
    const minDeg = Math.floor((currentHeadingDeg - halfFov) / 5) * 5;
    const maxDeg = Math.ceil((currentHeadingDeg + halfFov) / 5) * 5;

    const ticks = [];
    for (let deg = minDeg; deg <= maxDeg; deg += 5) {
      const normalizedDeg = ((deg % 360) + 360) % 360;
      const offsetDeg = deg - currentHeadingDeg;
      // Calculate horizontal pixel offset from center
      const xPercent = (offsetDeg / fovDegrees) * 100 + 50;

      let label: string | null = null;
      let isMajor = false;

      if (normalizedDeg === 0) {
        label = 'N';
        isMajor = true;
      } else if (normalizedDeg === 45) {
        label = 'NE';
      } else if (normalizedDeg === 90) {
        label = 'E';
        isMajor = true;
      } else if (normalizedDeg === 135) {
        label = 'SE';
      } else if (normalizedDeg === 180) {
        label = 'S';
        isMajor = true;
      } else if (normalizedDeg === 225) {
        label = 'SW';
      } else if (normalizedDeg === 270) {
        label = 'W';
        isMajor = true;
      } else if (normalizedDeg === 315) {
        label = 'NW';
      } else if (normalizedDeg % 15 === 0) {
        label = `${normalizedDeg}°`;
      }

      ticks.push({
        deg: normalizedDeg,
        xPercent,
        label,
        isMajor,
        isCardinal: ['N', 'E', 'S', 'W'].includes(label || ''),
      });
    }

    return ticks;
  }, [currentHeadingDeg, fovDegrees]);

  // Compute POI positions on the horizon
  const visiblePOIs = useMemo(() => {
    const list: (CompassMarker & {
      xPercent: number;
      distanceMeters: number;
      isOffscreenLeft: boolean;
      isOffscreenRight: boolean;
    })[] = [];

    const allMarkers = [...KNOWN_POIS];
    if (activeWaypoint) {
      allMarkers.push({
        id: 'active_quest_marker',
        worldX: activeWaypoint.x,
        worldZ: activeWaypoint.z,
        label: activeWaypoint.label,
        badge: '★',
        color: '#fbbf24',
        type: 'quest',
      });
    }

    const halfFov = fovDegrees / 2;

    for (const poi of allMarkers) {
      const dx = poi.worldX - playerPos[0];
      const dz = poi.worldZ - playerPos[2];
      const dist = Math.hypot(dx, dz);

      // Angle from player to POI in world space
      // Three.js: -Z is 0 rad, +X is +90 deg (pi/2)
      // atan2(dx, -dz) gives angle from North (+X is East)
      let poiBearingRad = Math.atan2(dx, -dz);
      let poiBearingDeg = ((poiBearingRad * 180) / Math.PI + 360) % 360;

      // Angular difference relative to camera heading (-180 to 180)
      let diffDeg = poiBearingDeg - currentHeadingDeg;
      while (diffDeg > 180) diffDeg -= 360;
      while (diffDeg < -180) diffDeg += 360;

      const isOffscreenLeft = diffDeg < -halfFov;
      const isOffscreenRight = diffDeg > halfFov;

      const xPercent = (diffDeg / fovDegrees) * 100 + 50;

      list.push({
        ...poi,
        xPercent: Math.max(4, Math.min(96, xPercent)),
        distanceMeters: Math.round(dist),
        isOffscreenLeft,
        isOffscreenRight,
      });
    }

    return list;
  }, [playerPos, currentHeadingDeg, activeWaypoint, fovDegrees]);

  // Find quest waypoint offscreen indicator if applicable
  const activeQuestPOI = visiblePOIs.find((p) => p.type === 'quest');

  return (
    <div
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-40 select-none flex flex-col items-center pointer-events-none font-sans ${className}`}
      data-testid="compass-heading"
    >
      {/* Compass Tape Container */}
      <div
        className="relative flex flex-col items-center h-12 rounded-2xl border border-zinc-700/80 bg-zinc-950/90 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.8)] overflow-hidden"
        style={{ width: tapeWidthPx }}
      >
        {/* Soft edge fade mask via gradient overlays */}
        <div className="absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-zinc-950 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-zinc-950 to-transparent z-20 pointer-events-none" />

        {/* Center Target Reticle & Indicator Needle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
          <div className="w-0.5 h-3 bg-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[5px] border-t-amber-400" />
        </div>

        {/* Horizontal Moving Tape with Ticks & Cardinal Labels */}
        <div className="relative w-full h-8 overflow-hidden">
          {tickMarks.map((tick, i) => (
            <div
              key={i}
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-transform duration-75"
              style={{ left: `${tick.xPercent}%` }}
            >
              {/* Vertical Tick Line */}
              <div
                className={`w-px ${
                  tick.isCardinal
                    ? 'h-3.5 bg-red-400 font-bold'
                    : tick.isMajor
                    ? 'h-2.5 bg-zinc-200'
                    : 'h-1.5 bg-zinc-600'
                }`}
              />

              {/* Cardinal or Degree Label */}
              {tick.label && (
                <span
                  className={`mt-0.5 font-mono text-[9px] leading-none ${
                    tick.label === 'N'
                      ? 'text-red-400 font-black text-[11px]'
                      : tick.isCardinal
                      ? 'text-amber-300 font-bold text-[10px]'
                      : 'text-zinc-400 text-[8px]'
                  }`}
                >
                  {tick.label}
                </span>
              )}
            </div>
          ))}

          {/* Dynamic Horizon POI Blips */}
          {visiblePOIs.map((poi) => {
            if (poi.isOffscreenLeft || poi.isOffscreenRight) return null;
            const isQuest = poi.type === 'quest';

            return (
              <div
                key={poi.id}
                className="absolute top-1 -translate-x-1/2 flex flex-col items-center z-15 group transition-transform duration-75"
                style={{ left: `${poi.xPercent}%` }}
              >
                <div
                  className={`flex items-center justify-center rounded-full shadow-md text-[9px] font-bold ${
                    isQuest
                      ? 'w-5 h-5 bg-amber-500 border border-white text-zinc-950 animate-pulse'
                      : 'w-4 h-4 bg-zinc-900 border border-zinc-600'
                  }`}
                  style={{
                    borderColor: isQuest ? '#ffffff' : poi.color,
                    color: isQuest ? '#09090b' : poi.color,
                  }}
                  title={`${poi.label} (${poi.distanceMeters}m)`}
                >
                  <span>{poi.badge}</span>
                </div>

                {/* Distance readout below icon */}
                <span className="text-[7px] font-mono text-zinc-300 bg-zinc-950/80 px-0.5 rounded leading-tight mt-0.5">
                  {poi.distanceMeters}m
                </span>
              </div>
            );
          })}
        </div>

        {/* Real-time Bearing Digits Footer */}
        <div className="flex items-center justify-center w-full pb-0.5">
          <span className="font-mono text-[9px] font-bold tracking-wider text-amber-400/90">
            {headingText}
          </span>
        </div>
      </div>

      {/* Quest Waypoint Offscreen Direction Chevrons */}
      {activeQuestPOI && (activeQuestPOI.isOffscreenLeft || activeQuestPOI.isOffscreenRight) && (
        <div
          className={`mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-amber-400/60 bg-zinc-950/90 backdrop-blur-md shadow-lg text-[9px] font-mono text-amber-300 ${
            activeQuestPOI.isOffscreenLeft ? '-translate-x-12' : 'translate-x-12'
          }`}
        >
          {activeQuestPOI.isOffscreenLeft && <span>◄</span>}
          <span className="font-bold">★ {activeQuestPOI.label}</span>
          <span className="text-zinc-400">({activeQuestPOI.distanceMeters}m)</span>
          {activeQuestPOI.isOffscreenRight && <span>►</span>}
        </div>
      )}
    </div>
  );
}

export default CompassHeading;
