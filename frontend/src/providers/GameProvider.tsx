'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/web3/wagmiConfig';

export type ActiveModalType = 'none' | 'council' | 'tactical' | 'aiSettings' | 'build';

export interface GameStateContextType {
  timeOfDay: 'day' | 'sunset' | 'night';
  setTimeOfDay: (time: 'day' | 'sunset' | 'night') => void;
  activeModal: ActiveModalType;
  setActiveModal: (modal: ActiveModalType) => void;
  activeNpcDialogue: string | null;
  setActiveNpcDialogue: (npcId: string | null) => void;
  selectedParcelId: number | null;
  setSelectedParcelId: (id: number | null) => void;
  playerPosition: [number, number, number];
  setPlayerPosition: (pos: [number, number, number]) => void;
  cameraYaw: number;
  setCameraYaw: (yaw: number) => void;
  isBuildingMode: boolean;
  setIsBuildingMode: (active: boolean) => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function useGameState(): GameStateContextType {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}

export interface GameProviderProps {
  children: React.ReactNode;
}

/**
 * Sovereign Lands Unified Game Provider
 * Wraps Web3 Wagmi v2 provider, TanStack React Query client, and reactive Game State context.
 */
export function GameProvider({ children }: GameProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 30, // 30s
            retry: 1,
          },
        },
      })
  );

  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  const [activeModal, setActiveModal] = useState<ActiveModalType>('none');
  const [activeNpcDialogue, setActiveNpcDialogue] = useState<string | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([0, 2.0, 0]);
  const [cameraYaw, setCameraYaw] = useState<number>(0);
  const [isBuildingMode, setIsBuildingMode] = useState<boolean>(false);

  const gameStateValue = useMemo<GameStateContextType>(
    () => ({
      timeOfDay,
      setTimeOfDay,
      activeModal,
      setActiveModal,
      activeNpcDialogue,
      setActiveNpcDialogue,
      selectedParcelId,
      setSelectedParcelId,
      playerPosition,
      setPlayerPosition,
      cameraYaw,
      setCameraYaw,
      isBuildingMode,
      setIsBuildingMode,
    }),
    [timeOfDay, activeModal, activeNpcDialogue, selectedParcelId, playerPosition, cameraYaw, isBuildingMode]
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <GameStateContext.Provider value={gameStateValue}>
          {children}
        </GameStateContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default GameProvider;
