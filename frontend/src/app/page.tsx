'use client';

import dynamic from 'next/dynamic';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// Dynamically import the 3D Canvas, Physics engine & Web3 HUD with SSR disabled.
// This decouples the initial page load from the heavy Three.js/Rapier WASM bundle,
// allowing Next.js to immediately stream and paint the Sovereign Lands LoadingScreen.
const GameWorldWithProvider = dynamic(
  () => import('@/components/game/GameWorldContent').then((mod) => mod.GameWorldWithProvider),
  {
    ssr: false,
    loading: () => <LoadingScreen statusText="Loading WebGL Engine & 3D Sandbox..." />,
  }
);

export default function GamePage() {
  return <GameWorldWithProvider />;
}
