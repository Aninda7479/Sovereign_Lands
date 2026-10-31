'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Compass,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Navigation,
  Shield,
  Castle,
  User,
  MapPin,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';
import { WORLD_CONSTANTS } from '@/lib/world/parcelCoordinates';

export interface WaypointData {
  id?: string;
  x: number;
  z: number;
  label: string;
  color?: string;
  icon?: 'quest' | 'citadel' | 'npc' | 'parcel';
  description?: string;
}

export interface RadarMiniMapProps {
  playerPosition?: [number, number, number];
  cameraYaw?: number; // radians
  activeWaypoint?: WaypointData | null;
  onSelectWaypoint?: (waypoint: WaypointData) => void;
  className?: string;
  defaultExpanded?: boolean;
}

interface BlipInfo {
  id: string;
  label: string;
  role: string;
  worldX: number;
  worldZ: number;
  type: 'player' | 'north_citadel' | 'south_citadel' | 'npc' | 'parcel' | 'quest';
  color: string;
  badge: string;
}

// Known Landmarks & NPCs in Sovereign Lands
const STATIC_BLIPS: BlipInfo[] = [
  {
    id: 'north_citadel',
    label: 'North Citadel',
    role: 'Frost Fortress & Royal Hall',
    worldX: 0,
    worldZ: -120,
    type: 'north_citadel',
    color: '#38bdf8', // sky-400
    badge: '🏰',
  },
  {
    id: 'south_citadel',
    label: 'South Citadel',
    role: 'Sunward Keep & High Court',
    worldX: 0,
    worldZ: 120,
    type: 'south_citadel',
    color: '#f87171', // red-400
    badge: '🏰',
  },
  {
    id: 'npc_aldric',
    label: 'Aldric',
    role: 'Boreal Farmer & Harvester',
    worldX: -35,
    worldZ: -65,
    type: 'npc',
    color: '#4ade80', // green-400
    badge: '🌾',
  },
  {
    id: 'npc_gareth',
    label: 'Sir Gareth',
    role: 'Vanguard Bridge Sentry',
    worldX: 0,
    worldZ: -22,
    type: 'npc',
    color: '#60a5fa', // blue-400
    badge: '🛡️',
  },
  {
    id: 'npc_merin',
    label: 'Merin',
    role: 'Citadel Royal Advisor',
    worldX: 30,
    worldZ: -110,
    type: 'npc',
    color: '#c084fc', // purple-400
    badge: '📜',
  },
  {
    id: 'npc_zara',
    label: 'Zara',
    role: 'Frontier Trader & Broker',
    worldX: 15,
    worldZ: 45,
    type: 'npc',
    color: '#fbbf24', // amber-400
    badge: '💰',
  },
  {
    id: 'sovereign_park',
    label: 'Sovereign Central Park',
    role: 'Botanical Gardens & Royal Fountain',
    worldX: 34,
    worldZ: -46,
    type: 'quest',
    color: '#34d399', // emerald-400
    badge: '⛲',
  },
  {
    id: 'north_village',
    label: 'Northern Thatched Village',
    role: 'Village Square & Crafting District',
    worldX: -50,
    worldZ: -95,
    type: 'parcel',
    color: '#f59e0b', // amber-500
    badge: '🏘️',
  },
  {
    id: 'npc_eleanor',
    label: 'Lady Eleanor',
    role: 'Royal Park Botanist',
    worldX: 34,
    worldZ: -42,
    type: 'npc',
    color: '#10b981', // emerald-500
    badge: '🌸',
  },
  {
    id: 'npc_torvald',
    label: 'Torvald',
    role: 'Master Blacksmith',
    worldX: -22,
    worldZ: -120,
    type: 'npc',
    color: '#f97316', // orange-500
    badge: '⚒️',
  },
  {
    id: 'npc_lyra',
    label: 'Lyra',
    role: 'Wandering Minstrel',
    worldX: -46,
    worldZ: -94,
    type: 'npc',
    color: '#ec4899', // pink-500
    badge: '🪕',
  },
  {
    id: 'npc_cedric',
    label: 'Cedric',
    role: 'Guild Merchant',
    worldX: -56,
    worldZ: -114,
    type: 'npc',
    color: '#eab308', // yellow-500
    badge: '📦',
  },
  {
    id: 'npc_beatrice',
    label: 'Sister Beatrice',
    role: 'Sanctuary Apothecary',
    worldX: -80,
    worldZ: -132,
    type: 'npc',
    color: '#10b981', // emerald-500
    badge: '🧪',
  },
  {
    id: 'arcane_observatory',
    label: 'Archmage Vaelin',
    role: 'The Arcane Reliquary',
    worldX: -94,
    worldZ: -96,
    type: 'npc',
    color: '#8b5cf6', // purple-500
    badge: '🔮',
  },
  {
    id: 'npc_kaelen',
    label: 'Kaelen',
    role: 'Mountain Ranger',
    worldX: -112,
    worldZ: -62,
    type: 'npc',
    color: '#78716c', // stone-500
    badge: '🏹',
  },
  {
    id: 'south_district',
    label: 'Solara Riverside Settlement',
    role: 'Southern Trading District & Fountain',
    worldX: -30,
    worldZ: 90,
    type: 'parcel',
    color: '#ef4444', // red-500
    badge: '🏛️',
  },
];

// Sample frontier parcel clusters
const SAMPLE_PARCELS = [
  { id: 'p1', x: -50, z: -50, kingdom: 'North', owner: '0x3A...7F9' },
  { id: 'p2', x: -20, z: -40, kingdom: 'North', owner: 'Player (You)' },
  { id: 'p3', x: 25, z: -60, kingdom: 'North', owner: '0x99...4A1' },
  { id: 'p4', x: -30, z: 40, kingdom: 'South', owner: '0x12...BC8' },
  { id: 'p5', x: 35, z: 50, kingdom: 'South', owner: '0x88...DE4' },
];

/**
 * GTA-Style Circular Radar Mini-Map HUD for Sovereign Lands
 * - Rotates dynamically with player camera heading
 * - Displays terrain boundaries, Great Divide river, and bridge crossing
 * - Dynamic blips: Player (with vision cone), North Citadel, South Citadel, NPCs, Parcels, Quest Waypoint
 * - Edge clamping with bearing arrow and distance badge for distant objectives
 * - Zoom controls, coordinate readout, and territory zone HUD
 */
export function RadarMiniMap({
  playerPosition: propsPos,
  cameraYaw: propsYaw,
  activeWaypoint: propsWaypoint,
  onSelectWaypoint,
  className = '',
  defaultExpanded = false,
}: RadarMiniMapProps) {
  // Local state with window-event fallback
  const [playerPos, setPlayerPos] = useState<[number, number, number]>(propsPos || [0, 1.8, 0]);
  const [yaw, setYaw] = useState<number>(propsYaw || 0);
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [zoomIndex, setZoomIndex] = useState<number>(1); // 0: 60m, 1: 120m, 2: 240m
  const [isNorthUp, setIsNorthUp] = useState<boolean>(false);
  const [hoveredBlip, setHoveredBlip] = useState<BlipInfo | null>(null);
  const [activeWaypoint, setActiveWaypoint] = useState<WaypointData | null>(
    propsWaypoint || {
      id: 'default_quest',
      x: -40,
      z: -40,
      label: 'Frontier Claim',
      description: 'Travel to the frontier and claim your first 3D parcel with [B]',
      icon: 'quest',
    }
  );

  const zoomScales = [60, 120, 240]; // radar radius in world meters
  const currentRadarRange = zoomScales[zoomIndex];

  // Radar pixel dimensions
  const radarSize = isExpanded ? 310 : 205;
  const radarRadius = (radarSize - 16) / 2;
  const center = radarSize / 2;

  // Sync props if provided
  useEffect(() => {
    if (propsPos) setPlayerPos(propsPos);
  }, [propsPos]);

  useEffect(() => {
    if (propsYaw !== undefined) setYaw(propsYaw);
  }, [propsYaw]);

  useEffect(() => {
    if (propsWaypoint !== undefined) setActiveWaypoint(propsWaypoint);
  }, [propsWaypoint]);

  // Window custom events listeners for universal integration
  useEffect(() => {
    const handlePosChange = (e: Event) => {
      const custom = e as CustomEvent<[number, number, number] | { x: number; y: number; z: number }>;
      if (Array.isArray(custom.detail)) {
        setPlayerPos(custom.detail);
      } else if (custom.detail && typeof custom.detail === 'object') {
        setPlayerPos([custom.detail.x, custom.detail.y, custom.detail.z]);
      }
    };

    const handleYawChange = (e: Event) => {
      const custom = e as CustomEvent<number>;
      if (typeof custom.detail === 'number') {
        setYaw(custom.detail);
      }
    };

    const handleWaypointChange = (e: Event) => {
      const custom = e as CustomEvent<WaypointData | null>;
      if (custom.detail !== undefined) {
        setActiveWaypoint(custom.detail);
      }
    };

    window.addEventListener('sovereign-player-move', handlePosChange);
    window.addEventListener('sovereign-camera-yaw', handleYawChange);
    window.addEventListener('sovereign-waypoint-set', handleWaypointChange);

    return () => {
      window.removeEventListener('sovereign-player-move', handlePosChange);
      window.removeEventListener('sovereign-camera-yaw', handleYawChange);
      window.removeEventListener('sovereign-waypoint-set', handleWaypointChange);
    };
  }, []);

  // Determine current territorial kingdom zone
  const territoryZone = useMemo(() => {
    const z = playerPos[2];
    if (z < WORLD_CONSTANTS.riverMinZ) {
      return {
        name: 'NORTH KINGDOM',
        sub: 'Frost Marches & Citadel Valleys',
        color: 'text-sky-400',
        borderColor: 'border-sky-500/40',
        bg: 'bg-sky-950/40',
      };
    }
    if (z > WORLD_CONSTANTS.riverMaxZ) {
      return {
        name: 'SOUTH KINGDOM',
        sub: 'Sunward Realm & Amber Plains',
        color: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        bg: 'bg-amber-950/40',
      };
    }
    return {
      name: 'THE GREAT DIVIDE',
      sub: 'Neutral Waters & Contested Crossing',
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      bg: 'bg-emerald-950/40',
    };
  }, [playerPos]);

  // Transform world (X, Z) coordinate into radar screen (rx, ry)
  // In GTA mode: Camera heading rotates the map underneath the player
  // Rotation angle applied to world: rotationAngle = isNorthUp ? 0 : -yaw
  const transformWorldToRadar = useCallback(
    (wx: number, wz: number) => {
      const dx = wx - playerPos[0];
      const dz = wz - playerPos[2];

      const rotationAngle = isNorthUp ? 0 : -yaw;
      const cos = Math.cos(rotationAngle);
      const sin = Math.sin(rotationAngle);

      // In Three.js: +X is East (right), +Z is South (down)
      // Screen space: +X is right, +Y is down
      const rotX = dx * cos - dz * sin;
      const rotZ = dx * sin + dz * cos;

      // Scale to radar pixels
      const pixelsPerMeter = radarRadius / currentRadarRange;
      const screenX = center + rotX * pixelsPerMeter;
      const screenY = center + rotZ * pixelsPerMeter;

      const distFromCenter = Math.sqrt((screenX - center) ** 2 + (screenY - center) ** 2);
      const isClamped = distFromCenter > radarRadius - 8;

      let clampedX = screenX;
      let clampedY = screenY;
      let angleToCenter = Math.atan2(screenY - center, screenX - center);

      if (isClamped) {
        clampedX = center + (radarRadius - 10) * Math.cos(angleToCenter);
        clampedY = center + (radarRadius - 10) * Math.sin(angleToCenter);
      }

      const worldDistance = Math.hypot(dx, dz);

      return {
        screenX,
        screenY,
        clampedX,
        clampedY,
        isClamped,
        worldDistance,
        angleToCenter,
      };
    },
    [playerPos, yaw, isNorthUp, radarRadius, currentRadarRange, center]
  );

  // North Indicator position on the outer rim
  const northAngle = isNorthUp ? -Math.PI / 2 : -yaw - Math.PI / 2;
  const northIndicatorX = center + (radarRadius + 1) * Math.cos(northAngle);
  const northIndicatorY = center + (radarRadius + 1) * Math.sin(northAngle);

  // Waypoint transformation
  const waypointTransform = useMemo(() => {
    if (!activeWaypoint) return null;
    return transformWorldToRadar(activeWaypoint.x, activeWaypoint.z);
  }, [activeWaypoint, transformWorldToRadar]);

  // River and bridge geometry for SVG rendering
  const riverGeometry = useMemo(() => {
    // We compute the rotated river band corners in radar coordinates
    // River runs from X = -500..500 at Z = -20..20
    const samplePointsTop = [];
    const samplePointsBottom = [];
    const step = 40;

    for (let x = -500; x <= 500; x += step) {
      samplePointsTop.push(transformWorldToRadar(x, WORLD_CONSTANTS.riverMinZ));
      samplePointsBottom.push(transformWorldToRadar(x, WORLD_CONSTANTS.riverMaxZ));
    }

    return { samplePointsTop, samplePointsBottom };
  }, [transformWorldToRadar]);

  // Zoom controls
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomIndex((prev) => Math.max(0, prev - 1));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomIndex((prev) => Math.min(zoomScales.length - 1, prev + 1));
  };

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 select-none flex flex-col items-start font-sans ${className}`}
      data-testid="radar-minimap"
    >
      {/* Territory & Zone Banner (GTA Style street name bar above radar) */}
      <div
        className={`mb-1.5 flex items-center justify-between w-full max-w-[${radarSize}px] px-2.5 py-1 rounded-lg border ${territoryZone.borderColor} ${territoryZone.bg} backdrop-blur-md shadow-lg transition-all duration-300`}
        style={{ width: radarSize }}
      >
        <div className="flex flex-col overflow-hidden">
          <span className={`text-[11px] font-black uppercase tracking-wider ${territoryZone.color} truncate leading-tight`}>
            {territoryZone.name}
          </span>
          <span className="text-[9px] text-zinc-400 truncate leading-tight">
            {territoryZone.sub}
          </span>
        </div>

        {/* Dynamic Compass / Mode Toggle */}
        <button
          onClick={() => setIsNorthUp((prev) => !prev)}
          title={isNorthUp ? 'Switch to Camera Heading tracking' : 'Lock to North-Up mode'}
          className="flex items-center gap-1 text-[10px] text-zinc-300 hover:text-amber-300 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-700/60 transition"
        >
          <Compass className="w-3 h-3 text-amber-400" />
          <span className="font-mono text-[9px] font-bold">
            {isNorthUp ? 'N-UP' : 'CAM'}
          </span>
        </button>
      </div>

      {/* Main Circular Radar Housing */}
      <div
        className="relative group rounded-full border-2 border-zinc-600/70 bg-zinc-950/95 shadow-[0_0_35px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden transition-all duration-300"
        style={{ width: radarSize, height: radarSize }}
      >
        {/* Subtle Military Radar Sweep Effect */}
        <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden opacity-30">
          <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(56,189,248,0.15)_60deg,transparent_90deg)] animate-[spin_4s_linear_infinite]" />
        </div>

        {/* Concentric Distance Rings & Crosshairs */}
        <svg
          className="absolute inset-0 pointer-events-none w-full h-full"
          viewBox={`0 0 ${radarSize} ${radarSize}`}
        >
          {/* Outer circle accent */}
          <circle
            cx={center}
            cy={center}
            r={radarRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1.5"
          />
          {/* 50% radius ring */}
          <circle
            cx={center}
            cy={center}
            r={radarRadius * 0.5}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          {/* Subtle crosshair axes */}
          <line
            x1={center}
            y1={center - radarRadius}
            x2={center}
            y2={center + radarRadius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
          <line
            x1={center - radarRadius}
            y1={center}
            x2={center + radarRadius}
            y2={center}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />

          {/* Terrain & River Visualization */}
          {/* The Great Divide River channel */}
          <g opacity="0.6">
            {riverGeometry.samplePointsTop.map((pt, idx) => {
              const nextTop = riverGeometry.samplePointsTop[idx + 1];
              const btm = riverGeometry.samplePointsBottom[idx];
              const nextBtm = riverGeometry.samplePointsBottom[idx + 1];
              if (!nextTop || !btm || !nextBtm) return null;

              return (
                <polygon
                  key={idx}
                  points={`${pt.screenX},${pt.screenY} ${nextTop.screenX},${nextTop.screenY} ${nextBtm.screenX},${nextBtm.screenY} ${btm.screenX},${btm.screenY}`}
                  fill="#1d4ed8"
                  opacity="0.25"
                />
              );
            })}
          </g>

          {/* Bridge at X=0 crossing the River */}
          {(() => {
            const b1 = transformWorldToRadar(-7, -25);
            const b2 = transformWorldToRadar(7, -25);
            const b3 = transformWorldToRadar(7, 25);
            const b4 = transformWorldToRadar(-7, 25);
            return (
              <polygon
                points={`${b1.screenX},${b1.screenY} ${b2.screenX},${b2.screenY} ${b3.screenX},${b3.screenY} ${b4.screenX},${b4.screenY}`}
                fill="#64748b"
                stroke="#94a3b8"
                strokeWidth="1"
                opacity="0.8"
              />
            );
          })()}

          {/* Frontier Parcels Rendered as Geometric Rectangles */}
          {SAMPLE_PARCELS.map((p) => {
            const trans = transformWorldToRadar(p.x, p.z);
            if (trans.worldDistance > currentRadarRange * 1.2) return null;
            const isNorth = p.kingdom === 'North';
            const isPlayer = p.owner.includes('Player');

            return (
              <rect
                key={p.id}
                x={trans.screenX - 7}
                y={trans.screenY - 7}
                width={14}
                height={14}
                fill={isPlayer ? '#fbbf24' : isNorth ? '#0284c7' : '#dc2626'}
                fillOpacity={isPlayer ? '0.6' : '0.35'}
                stroke={isPlayer ? '#fef08a' : isNorth ? '#38bdf8' : '#f87171'}
                strokeWidth={isPlayer ? '2' : '1'}
                className="cursor-pointer transition hover:scale-125"
              >
                <title>{`Parcel #${p.id} (${p.kingdom}) - Owner: ${p.owner}`}</title>
              </rect>
            );
          })}
        </svg>

        {/* Dynamic Static Blips: Citadels & NPCs */}
        {STATIC_BLIPS.map((blip) => {
          const trans = transformWorldToRadar(blip.worldX, blip.worldZ);
          // If way out of range, clamp or hide
          const isFar = trans.worldDistance > currentRadarRange;
          const displayX = isFar ? trans.clampedX : trans.screenX;
          const displayY = isFar ? trans.clampedY : trans.screenY;

          return (
            <div
              key={blip.id}
              onClick={() => {
                const wp: WaypointData = {
                  id: blip.id,
                  x: blip.worldX,
                  z: blip.worldZ,
                  label: blip.label,
                  description: blip.role,
                  color: blip.color,
                };
                setActiveWaypoint(wp);
                onSelectWaypoint?.(wp);
              }}
              onMouseEnter={() => setHoveredBlip(blip)}
              onMouseLeave={() => setHoveredBlip(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/blip transition-transform hover:scale-125 active:scale-95"
              style={{
                left: displayX,
                top: displayY,
                opacity: isFar ? 0.7 : 1,
              }}
            >
              <div
                className="flex items-center justify-center w-5 h-5 rounded-full border shadow-md font-mono text-[9px] font-bold"
                style={{
                  backgroundColor: `${blip.color}33`,
                  borderColor: blip.color,
                  color: blip.color,
                }}
              >
                <span>{blip.badge}</span>
              </div>
            </div>
          );
        })}

        {/* Active Quest Objective Blip (Golden Star / Diamond with Clamping) */}
        {waypointTransform && (
          <div
            onClick={() => {
              if (activeWaypoint) onSelectWaypoint?.(activeWaypoint);
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-all duration-75"
            style={{
              left: waypointTransform.isClamped
                ? waypointTransform.clampedX
                : waypointTransform.screenX,
              top: waypointTransform.isClamped
                ? waypointTransform.clampedY
                : waypointTransform.screenY,
            }}
          >
            {/* Clamped Pointer Arrow pointing outward toward objective */}
            {waypointTransform.isClamped && (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  transform: `rotate(${waypointTransform.angleToCenter + Math.PI / 2}rad)`,
                }}
              >
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
              </div>
            )}

            {/* Glowing Objective Star Icon */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-7 h-7 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-[0_0_12px_rgba(251,191,36,1)] text-zinc-950 font-black text-xs">
                ★
              </div>

              {/* Edge Clamped Distance Badge (e.g. "145m") */}
              {waypointTransform.isClamped && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-zinc-950/95 border border-amber-400/80 px-1 py-0.2 rounded text-[8px] font-mono font-bold text-amber-300 whitespace-nowrap shadow-md">
                  {Math.round(waypointTransform.worldDistance)}m
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player Icon at Radar Center with Vision Cone */}
        <div
          className="absolute z-25 pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: center, top: center }}
        >
          {/* Translucent Vision Cone extending forward */}
          <div
            className="absolute left-1/2 bottom-1/2 -translate-x-1/2 origin-bottom pointer-events-none"
            style={{
              transform: isNorthUp ? `rotate(${yaw}rad)` : 'none',
              width: 0,
              height: 0,
              borderLeft: '28px solid transparent',
              borderRight: '28px solid transparent',
              borderTop: '55px solid rgba(251, 191, 36, 0.18)',
              filter: 'blur(0.5px)',
            }}
          />

          {/* Yellow Player Chevron Icon */}
          <div
            className="flex items-center justify-center transition-transform duration-75"
            style={{
              transform: isNorthUp ? `rotate(${yaw}rad)` : 'none',
            }}
          >
            <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[14px] border-b-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,1)]" />
          </div>
        </div>

        {/* Orbiting North Indicator ("N") on Perimeter */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 transition-transform duration-100"
          style={{ left: northIndicatorX, top: northIndicatorY }}
        >
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600/90 border border-white/80 shadow-md">
            <span className="font-mono font-black text-[10px] text-white leading-none">
              N
            </span>
          </div>
        </div>

        {/* Hover Blip Tooltip */}
        {hoveredBlip && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/95 border border-zinc-700 px-2.5 py-1 rounded-md shadow-xl text-center pointer-events-none">
            <div className="text-[10px] font-bold text-zinc-100">
              {hoveredBlip.label}
            </div>
            <div className="text-[8px] text-zinc-400">
              {hoveredBlip.role}
            </div>
          </div>
        )}
      </div>

      {/* Mini-Map Control Bar & Coordinate Telemetry */}
      <div
        className={`mt-1.5 flex items-center justify-between w-full max-w-[${radarSize}px] px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-950/90 backdrop-blur-md shadow-lg text-[10px] font-mono text-zinc-400`}
        style={{ width: radarSize }}
      >
        {/* World Coordinate Readout */}
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <span>
            <strong className="text-zinc-200">X:</strong> {Math.round(playerPos[0])}
          </span>
          <span>
            <strong className="text-zinc-200">Z:</strong> {Math.round(playerPos[2])}
          </span>
          <span className="text-zinc-500">
            {Math.round(currentRadarRange)}m
          </span>
        </div>

        {/* Zoom & Expand Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            disabled={zoomIndex === 0}
            title="Zoom In"
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 transition"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoomIndex === zoomScales.length - 1}
            title="Zoom Out"
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 transition"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? 'Minimize Radar' : 'Expand Radar'}
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition"
          >
            {isExpanded ? (
              <Minimize2 className="w-3 h-3 text-amber-400" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RadarMiniMap;
