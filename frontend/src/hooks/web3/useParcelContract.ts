'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import {
  SOVEREIGN_LANDS_ABI,
  getContractAddress,
} from '@/lib/web3/contractAddresses';
import { ParcelEntity } from '@/lib/world/parcelCoordinates';

// Default mock parcels matching SeedWorldParcels.s.sol
const MOCK_DEFAULT_PARCELS: ParcelEntity[] = [
  // North Kingdom Parcels
  {
    id: 1,
    bounds: { minX: -250, minZ: -350, maxX: -200, maxZ: -300 },
    kingdom: 'North',
    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    structure: 4, // Castle Keep
  },
  {
    id: 2,
    bounds: { minX: -200, minZ: -350, maxX: -150, maxZ: -300 },
    kingdom: 'North',
    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    structure: 2, // Guard Tower
  },
  {
    id: 3,
    bounds: { minX: -150, minZ: -350, maxX: -100, maxZ: -300 },
    kingdom: 'North',
    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    structure: 3, // Stone Wall
  },
  {
    id: 4,
    bounds: { minX: -100, minZ: -350, maxX: -50, maxZ: -300 },
    kingdom: 'North',
    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    structure: 1, // Farmstead
  },
  {
    id: 5,
    bounds: { minX: -50, minZ: -350, maxX: 0, maxZ: -300 },
    kingdom: 'North',
    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    structure: 1, // Farmstead
  },
  // Unclaimed North Frontier
  {
    id: 10,
    bounds: { minX: -50, minZ: -120, maxX: 0, maxZ: -70 },
    kingdom: 'North',
    owner: '',
    structure: 0,
  },
  // South Kingdom Parcels
  {
    id: 51,
    bounds: { minX: -250, minZ: 50, maxX: -200, maxZ: 100 },
    kingdom: 'South',
    owner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    structure: 4, // Castle Keep
  },
  {
    id: 52,
    bounds: { minX: -200, minZ: 50, maxX: -150, maxZ: 100 },
    kingdom: 'South',
    owner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    structure: 2, // Guard Tower
  },
  {
    id: 53,
    bounds: { minX: -150, minZ: 50, maxX: -100, maxZ: 100 },
    kingdom: 'South',
    owner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    structure: 3, // Stone Wall
  },
  {
    id: 54,
    bounds: { minX: -100, minZ: 50, maxX: -50, maxZ: 100 },
    kingdom: 'South',
    owner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    structure: 1, // Farmstead
  },
  // Unclaimed South Frontier
  {
    id: 60,
    bounds: { minX: 0, minZ: 70, maxX: 50, maxZ: 120 },
    kingdom: 'South',
    owner: '',
    structure: 0,
  },
];

export interface UseParcelContractReturn {
  parcels: ParcelEntity[];
  playerGold: number;
  pendingGold: { totalGross: number; totalTax: number; totalNet: number };
  playerParcels: ParcelEntity[];
  isContractLoading: boolean;
  isTransacting: boolean;
  txHash: `0x${string}` | null;
  buyParcel: (parcelId: number) => Promise<void>;
  buyParcelWithBounds: (
    parcelId: number,
    minX: number,
    minZ: number,
    maxX: number,
    maxZ: number
  ) => Promise<void>;
  buildStructure: (parcelId: number, structureType: number) => Promise<void>;
  claimGold: () => Promise<void>;
  refetchParcels: () => void;
}

export function useParcelContract(): UseParcelContractReturn {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId);

  const [parcels, setParcels] = useState<ParcelEntity[]>(MOCK_DEFAULT_PARCELS);
  const [localGold, setLocalGold] = useState<number>(100);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isTransacting, setIsTransacting] = useState(false);

  // Wagmi Write Contract Hook
  const { writeContractAsync } = useWriteContract();

  // Read on-chain registered parcels
  const {
    data: onChainParcels,
    isLoading: isParcelsLoading,
    refetch: refetchParcels,
  } = useReadContract({
    address: contractAddress,
    abi: SOVEREIGN_LANDS_ABI,
    functionName: 'getAllParcels',
    query: {
      enabled: isConnected,
      refetchInterval: 5000, // Poll every 5s for open-world updates
    },
  });

  // Read player gold balance
  const { data: onChainGold, refetch: refetchGold } = useReadContract({
    address: contractAddress,
    abi: SOVEREIGN_LANDS_ABI,
    functionName: 'getPlayerGold',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address),
      refetchInterval: 5000,
    },
  });

  // Read pending harvest gold
  const { data: onChainPendingGold } = useReadContract({
    address: contractAddress,
    abi: SOVEREIGN_LANDS_ABI,
    functionName: 'getPendingGold',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address),
      refetchInterval: 3000,
    },
  });

  // Sync on-chain parcels or use mock fallback
  useEffect(() => {
    if (onChainParcels && Array.isArray(onChainParcels) && onChainParcels.length > 0) {
      const parsed: ParcelEntity[] = (onChainParcels as any[]).map((p) => ({
        id: Number(p.id),
        bounds: {
          minX: Number(p.bounds.minX),
          minZ: Number(p.bounds.minZ),
          maxX: Number(p.bounds.maxX),
          maxZ: Number(p.bounds.maxZ),
        },
        kingdom: p.kingdom === 1 ? 'North' : p.kingdom === 2 ? 'South' : 'None',
        owner: p.owner,
        structure: Number(p.structure),
        defenseRating: Number(p.defenseRating || 0),
        attackRating: Number(p.attackRating || 0),
      }));
      setParcels(parsed);
    }
  }, [onChainParcels]);

  // Compute effective player gold
  const playerGold = useMemo(() => {
    if (onChainGold !== undefined) {
      return Number(onChainGold);
    }
    return localGold;
  }, [onChainGold, localGold]);

  // Compute pending gold harvest
  const pendingGold = useMemo(() => {
    if (onChainPendingGold && Array.isArray(onChainPendingGold)) {
      return {
        totalGross: Number(onChainPendingGold[0]),
        totalTax: Number(onChainPendingGold[1]),
        totalNet: Number(onChainPendingGold[2]),
      };
    }
    return { totalGross: 25, totalTax: 3, totalNet: 22 };
  }, [onChainPendingGold]);

  // Player owned parcels
  const playerParcels = useMemo(() => {
    if (!address) return [];
    return parcels.filter(
      (p) => Boolean(p.owner) && p.owner.toLowerCase() === address.toLowerCase()
    );
  }, [parcels, address]);

  // Transaction: Buy Parcel
  const buyParcel = useCallback(
    async (parcelId: number) => {
      setIsTransacting(true);
      try {
        if (isConnected) {
          const hash = await writeContractAsync({
            address: contractAddress,
            abi: SOVEREIGN_LANDS_ABI,
            functionName: 'buyParcel',
            args: [BigInt(parcelId)],
            value: parseEther('0.01'),
          });
          setTxHash(hash);
          setTimeout(() => {
            refetchParcels();
            refetchGold();
          }, 2000);
        } else {
          // Mock Sandbox Purchase
          setParcels((prev) =>
            prev.map((p) =>
              p.id === parcelId ? { ...p, owner: '0xConnectedPlayerLocal' } : p
            )
          );
          setLocalGold((g) => g + 100);
        }
      } catch (err) {
        console.error('buyParcel error:', err);
        throw err;
      } finally {
        setIsTransacting(false);
      }
    },
    [isConnected, writeContractAsync, contractAddress, refetchParcels, refetchGold]
  );

  // Transaction: Buy Parcel With Custom Bounds
  const buyParcelWithBounds = useCallback(
    async (parcelId: number, minX: number, minZ: number, maxX: number, maxZ: number) => {
      setIsTransacting(true);
      try {
        if (isConnected) {
          const hash = await writeContractAsync({
            address: contractAddress,
            abi: SOVEREIGN_LANDS_ABI,
            functionName: 'buyParcelWithBounds',
            args: [BigInt(parcelId), minX, minZ, maxX, maxZ],
            value: parseEther('0.01'),
          });
          setTxHash(hash);
          setTimeout(() => {
            refetchParcels();
            refetchGold();
          }, 2000);
        } else {
          const kingdom = (minZ + maxZ) / 2 < 0 ? 'North' : 'South';
          setParcels((prev) => [
            ...prev,
            {
              id: parcelId,
              bounds: { minX, minZ, maxX, maxZ },
              kingdom,
              owner: '0xConnectedPlayerLocal',
              structure: 0,
            },
          ]);
          setLocalGold((g) => g + 100);
        }
      } catch (err) {
        console.error('buyParcelWithBounds error:', err);
        throw err;
      } finally {
        setIsTransacting(false);
      }
    },
    [isConnected, writeContractAsync, contractAddress, refetchParcels, refetchGold]
  );

  // Transaction: Build Structure
  const buildStructure = useCallback(
    async (parcelId: number, structureType: number) => {
      setIsTransacting(true);
      try {
        if (isConnected) {
          const hash = await writeContractAsync({
            address: contractAddress,
            abi: SOVEREIGN_LANDS_ABI,
            functionName: 'buildStructure',
            args: [BigInt(parcelId), structureType],
          });
          setTxHash(hash);
          setTimeout(() => {
            refetchParcels();
            refetchGold();
          }, 2000);
        } else {
          setParcels((prev) =>
            prev.map((p) => (p.id === parcelId ? { ...p, structure: structureType } : p))
          );
          setLocalGold((g) => Math.max(0, g - 50));
        }
      } catch (err) {
        console.error('buildStructure error:', err);
        throw err;
      } finally {
        setIsTransacting(false);
      }
    },
    [isConnected, writeContractAsync, contractAddress, refetchParcels, refetchGold]
  );

  // Transaction: Claim Gold & Tithe
  const claimGold = useCallback(async () => {
    setIsTransacting(true);
    try {
      if (isConnected) {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: SOVEREIGN_LANDS_ABI,
          functionName: 'claimGold',
        });
        setTxHash(hash);
        setTimeout(() => {
          refetchGold();
        }, 2000);
      } else {
        setLocalGold((g) => g + pendingGold.totalNet);
      }
    } catch (err) {
      console.error('claimGold error:', err);
      throw err;
    } finally {
      setIsTransacting(false);
    }
  }, [isConnected, writeContractAsync, contractAddress, refetchGold, pendingGold]);

  return {
    parcels,
    playerGold,
    pendingGold,
    playerParcels,
    isContractLoading: isParcelsLoading,
    isTransacting,
    txHash,
    buyParcel,
    buyParcelWithBounds,
    buildStructure,
    claimGold,
    refetchParcels,
  };
}

export default useParcelContract;
