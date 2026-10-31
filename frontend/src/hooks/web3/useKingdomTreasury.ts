'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract } from 'wagmi';
import {
  SOVEREIGN_LANDS_ABI,
  getContractAddress,
} from '@/lib/web3/contractAddresses';

export interface KingdomStatsData {
  treasuryGold: number;
  taxRate: number;
  totalAttack: number;
  totalDefense: number;
  totalParcels: number;
  activeProposalId: number;
  lastWarTimestamp: number;
}

export interface ActiveProposalData {
  id: number;
  kingdom: 'North' | 'South';
  proposalType: number; // 0=SetTaxRate, 1=DistributeTreasury, 2=DeclareWar, 3=FundInfrastructure
  param: number;
  description: string;
  proposer: string;
  endTime: number;
  yesVotes: number;
  noVotes: number;
  totalVoters: number;
  executed: boolean;
}

export function useKingdomTreasury() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId);

  const { writeContractAsync } = useWriteContract();
  const [isVoting, setIsVoting] = useState(false);

  // Read North Kingdom Stats (enum 1 = North)
  const { data: northData, refetch: refetchNorth } = useReadContract({
    address: contractAddress,
    abi: SOVEREIGN_LANDS_ABI,
    functionName: 'getKingdomStats',
    args: [1],
    query: {
      enabled: isConnected,
      refetchInterval: 6000,
    },
  });

  // Read South Kingdom Stats (enum 2 = South)
  const { data: southData, refetch: refetchSouth } = useReadContract({
    address: contractAddress,
    abi: SOVEREIGN_LANDS_ABI,
    functionName: 'getKingdomStats',
    args: [2],
    query: {
      enabled: isConnected,
      refetchInterval: 6000,
    },
  });

  // Read North Active Proposal
  const { data: northPropData, refetch: refetchNorthProp } = useReadContract({
    address: contractAddress,
    abi: SOVEREIGN_LANDS_ABI,
    functionName: 'getActiveProposal',
    args: [1],
    query: {
      enabled: isConnected,
      refetchInterval: 4000,
    },
  });

  // Read South Active Proposal
  const { data: southPropData, refetch: refetchSouthProp } = useReadContract({
    address: contractAddress,
    abi: SOVEREIGN_LANDS_ABI,
    functionName: 'getActiveProposal',
    args: [2],
    query: {
      enabled: isConnected,
      refetchInterval: 4000,
    },
  });

  // Format Kingdom Stats
  const northStats: KingdomStatsData = useMemo(() => {
    if (northData) {
      const d = northData as any;
      return {
        treasuryGold: Number(d.treasuryGold),
        taxRate: Number(d.taxRate),
        totalAttack: Number(d.totalAttack),
        totalDefense: Number(d.totalDefense),
        totalParcels: Number(d.totalParcels),
        activeProposalId: Number(d.activeProposalId),
        lastWarTimestamp: Number(d.lastWarTimestamp),
      };
    }
    return {
      treasuryGold: 480,
      taxRate: 10,
      totalAttack: 10,
      totalDefense: 14,
      totalParcels: 5,
      activeProposalId: 1,
      lastWarTimestamp: 0,
    };
  }, [northData]);

  const southStats: KingdomStatsData = useMemo(() => {
    if (southData) {
      const d = southData as any;
      return {
        treasuryGold: 390,
        taxRate: 10,
        totalAttack: 10,
        totalDefense: 14,
        totalParcels: 5,
        activeProposalId: 0,
        lastWarTimestamp: 0,
      };
    }
    return {
      treasuryGold: 390,
      taxRate: 10,
      totalAttack: 10,
      totalDefense: 14,
      totalParcels: 5,
      activeProposalId: 0,
      lastWarTimestamp: 0,
    };
  }, [southData]);

  // Format Active Proposal
  const activeProposal: ActiveProposalData | null = useMemo(() => {
    if (northPropData && (northPropData as any)[1]) {
      const p = (northPropData as any)[0];
      return {
        id: Number(p.id),
        kingdom: 'North',
        proposalType: Number(p.proposalType),
        param: Number(p.param),
        description: p.description,
        proposer: p.proposer,
        endTime: Number(p.endTime),
        yesVotes: Number(p.yesVotes),
        noVotes: Number(p.noVotes),
        totalVoters: Number(p.totalVoters),
        executed: p.executed,
      };
    }
    if (southPropData && (southPropData as any)[1]) {
      const p = (southPropData as any)[0];
      return {
        id: Number(p.id),
        kingdom: 'South',
        proposalType: Number(p.proposalType),
        param: Number(p.param),
        description: p.description,
        proposer: p.proposer,
        endTime: Number(p.endTime),
        yesVotes: Number(p.yesVotes),
        noVotes: Number(p.noVotes),
        totalVoters: Number(p.totalVoters),
        executed: p.executed,
      };
    }
    // Mock Active Proposal
    return {
      id: 1,
      kingdom: 'North',
      proposalType: 0,
      param: 15,
      description: 'Raise royal tax rate from 10% to 15% to fund border bastion defenses',
      proposer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      endTime: Math.floor(Date.now() / 1000) + 120,
      yesVotes: 3,
      noVotes: 1,
      totalVoters: 2,
      executed: false,
    };
  }, [northPropData, southPropData]);

  // Vote on active proposal
  const castVote = useCallback(
    async (proposalId: number, support: boolean) => {
      setIsVoting(true);
      try {
        if (isConnected) {
          await writeContractAsync({
            address: contractAddress,
            abi: SOVEREIGN_LANDS_ABI,
            functionName: 'vote',
            args: [BigInt(proposalId), support],
          });
          refetchNorthProp();
          refetchSouthProp();
        } else {
          // Local simulation
          if (activeProposal) {
            if (support) activeProposal.yesVotes += 1;
            else activeProposal.noVotes += 1;
          }
        }
      } catch (err) {
        console.error('castVote error:', err);
        throw err;
      } finally {
        setIsVoting(false);
      }
    },
    [isConnected, writeContractAsync, contractAddress, refetchNorthProp, refetchSouthProp, activeProposal]
  );

  // Trigger Deterministic War
  const declareWar = useCallback(
    async (attackerKingdom: 1 | 2 | 'North' | 'South') => {
      try {
        const kingdomId = attackerKingdom === 1 || attackerKingdom === 'North' ? 1 : 2;
        if (isConnected) {
          await writeContractAsync({
            address: contractAddress,
            abi: SOVEREIGN_LANDS_ABI,
            functionName: 'resolveWar',
            args: [kingdomId],
          });
          refetchNorth();
          refetchSouth();
        }
      } catch (err) {
        console.error('declareWar error:', err);
        throw err;
      }
    },
    [isConnected, writeContractAsync, contractAddress, refetchNorth, refetchSouth]
  );

  return {
    northStats,
    southStats,
    activeProposal,
    isVoting,
    castVote,
    declareWar,
    refetchTreasury: () => {
      refetchNorth();
      refetchSouth();
    },
  };
}

export default useKingdomTreasury;
