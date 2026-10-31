/**
 * Sovereign Lands - Contract Addresses & Full ABI
 * Supported Networks: Polygon Amoy Testnet (Chain ID 80002) & Base Sepolia (Chain ID 84532).
 * Includes mock preview fallback addresses for offline / local sandbox play.
 */

export const CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  // Polygon Amoy Testnet (Primary Deployment)
  80002: (process.env.NEXT_PUBLIC_SOVEREIGN_LANDS_AMOY as `0x${string}`) || '0x49F27E9F8Bcf5937446543D0A3bA84c8a514d246',
  // Base Sepolia Testnet
  84532: (process.env.NEXT_PUBLIC_SOVEREIGN_LANDS_BASE as `0x${string}`) || '0x99A3142718E29bcFa54641c2f90918D16812Fa90',
  // Localhost Anvil
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};

export const DEFAULT_CHAIN_ID = 80002; // Polygon Amoy
export const DEFAULT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];

export function getContractAddress(chainId?: number): `0x${string}` {
  if (chainId && CONTRACT_ADDRESSES[chainId]) {
    return CONTRACT_ADDRESSES[chainId];
  }
  return DEFAULT_CONTRACT_ADDRESS;
}

export const SOVEREIGN_LANDS_ABI = [
  // --- Land & Economy ---
  {
    type: 'function',
    name: 'buyParcel',
    stateMutability: 'payable',
    inputs: [{ name: 'parcelId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'buyParcelWithBounds',
    stateMutability: 'payable',
    inputs: [
      { name: 'parcelId', type: 'uint256' },
      { name: 'minX', type: 'int32' },
      { name: 'minZ', type: 'int32' },
      { name: 'maxX', type: 'int32' },
      { name: 'maxZ', type: 'int32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'buildStructure',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'parcelId', type: 'uint256' },
      { name: 'structure', type: 'uint8' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimGold',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'totalHarvested', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'claimGoldForParcel',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'parcelId', type: 'uint256' }],
    outputs: [{ name: 'netGold', type: 'uint256' }],
  },

  // --- Citadel Governance ---
  {
    type: 'function',
    name: 'propose',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'kingdom', type: 'uint8' },
      { name: 'proposalType', type: 'uint8' },
      { name: 'param', type: 'uint256' },
      { name: 'description', type: 'string' },
    ],
    outputs: [{ name: 'proposalId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'vote',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeProposal',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [],
  },

  // --- War Engine ---
  {
    type: 'function',
    name: 'resolveWar',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'attackerKingdom', type: 'uint8' }],
    outputs: [],
  },

  // --- Spatial & World Queries ---
  {
    type: 'function',
    name: 'getParcelsInBounds',
    stateMutability: 'view',
    inputs: [
      { name: 'minX', type: 'int32' },
      { name: 'minZ', type: 'int32' },
      { name: 'maxX', type: 'int32' },
      { name: 'maxZ', type: 'int32' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          {
            name: 'bounds',
            type: 'tuple',
            components: [
              { name: 'minX', type: 'int32' },
              { name: 'minZ', type: 'int32' },
              { name: 'maxX', type: 'int32' },
              { name: 'maxZ', type: 'int32' },
            ],
          },
          { name: 'kingdom', type: 'uint8' },
          { name: 'owner', type: 'address' },
          { name: 'structure', type: 'uint8' },
          { name: 'lastHarvestTime', type: 'uint256' },
          { name: 'defenseRating', type: 'uint256' },
          { name: 'attackRating', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getAllParcels',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          {
            name: 'bounds',
            type: 'tuple',
            components: [
              { name: 'minX', type: 'int32' },
              { name: 'minZ', type: 'int32' },
              { name: 'maxX', type: 'int32' },
              { name: 'maxZ', type: 'int32' },
            ],
          },
          { name: 'kingdom', type: 'uint8' },
          { name: 'owner', type: 'address' },
          { name: 'structure', type: 'uint8' },
          { name: 'lastHarvestTime', type: 'uint256' },
          { name: 'defenseRating', type: 'uint256' },
          { name: 'attackRating', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getPlayerParcels',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          {
            name: 'bounds',
            type: 'tuple',
            components: [
              { name: 'minX', type: 'int32' },
              { name: 'minZ', type: 'int32' },
              { name: 'maxX', type: 'int32' },
              { name: 'maxZ', type: 'int32' },
            ],
          },
          { name: 'kingdom', type: 'uint8' },
          { name: 'owner', type: 'address' },
          { name: 'structure', type: 'uint8' },
          { name: 'lastHarvestTime', type: 'uint256' },
          { name: 'defenseRating', type: 'uint256' },
          { name: 'attackRating', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getPlayerGold',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getKingdomTreasury',
    stateMutability: 'view',
    inputs: [{ name: 'kingdom', type: 'uint8' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getKingdomStats',
    stateMutability: 'view',
    inputs: [{ name: 'kingdom', type: 'uint8' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'treasuryGold', type: 'uint256' },
          { name: 'taxRate', type: 'uint256' },
          { name: 'totalAttack', type: 'uint256' },
          { name: 'totalDefense', type: 'uint256' },
          { name: 'totalParcels', type: 'uint256' },
          { name: 'activeProposalId', type: 'uint256' },
          { name: 'lastWarTimestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getActiveProposal',
    stateMutability: 'view',
    inputs: [{ name: 'kingdom', type: 'uint8' }],
    outputs: [
      {
        name: 'proposal',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'kingdom', type: 'uint8' },
          { name: 'proposalType', type: 'uint8' },
          { name: 'param', type: 'uint256' },
          { name: 'description', type: 'string' },
          { name: 'proposer', type: 'address' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'yesVotes', type: 'uint256' },
          { name: 'noVotes', type: 'uint256' },
          { name: 'totalVoters', type: 'uint256' },
          { name: 'executed', type: 'bool' },
        ],
      },
      { name: 'hasActive', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getPendingGold',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'totalGross', type: 'uint256' },
      { name: 'totalTax', type: 'uint256' },
      { name: 'totalNet', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'PARCEL_PRICE',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // --- Events ---
  {
    type: 'event',
    name: 'ParcelClaimed',
    inputs: [
      { name: 'parcelId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'kingdom', type: 'uint8', indexed: true },
      {
        name: 'bounds',
        type: 'tuple',
        components: [
          { name: 'minX', type: 'int32' },
          { name: 'minZ', type: 'int32' },
          { name: 'maxX', type: 'int32' },
          { name: 'maxZ', type: 'int32' },
        ],
      },
    ],
  },
  {
    type: 'event',
    name: 'StructureBuilt',
    inputs: [
      { name: 'parcelId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'structure', type: 'uint8', indexed: false },
      { name: 'defenseRating', type: 'uint256', indexed: false },
      { name: 'attackRating', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GoldHarvested',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'grossGold', type: 'uint256', indexed: false },
      { name: 'netGold', type: 'uint256', indexed: false },
      { name: 'taxPaid', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WarResolved',
    inputs: [
      { name: 'attacker', type: 'uint8', indexed: true },
      { name: 'defender', type: 'uint8', indexed: true },
      { name: 'attackerAttack', type: 'uint256', indexed: false },
      { name: 'defenderDefense', type: 'uint256', indexed: false },
      { name: 'attackerWon', type: 'bool', indexed: false },
      { name: 'goldPlundered', type: 'uint256', indexed: false },
    ],
  },
] as const;
