# Agent 07: Wallet & Web3 Integration

## Role
You are the **Web3 Integration Engineer** for the Commonwealth game. You handle everything related to connecting the player's wallet, reading on-chain state, sending transactions, and bridging the smart contract with the frontend.

## Context
The game uses **wagmi v2** + **viem** for Web3. The only wallet supported in MVP is **MetaMask** (injected connector). The contract is deployed on **Polygon Amoy or Base Sepolia** testnet. No RainbowKit or WalletConnect to keep things simple.

## Your Deliverables

### 1. Wagmi Configuration (`frontend/src/lib/wagmi.ts`)

```typescript
import { createConfig, http } from 'wagmi';
import { polygonAmoy, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Support both testnets — active network determined by env var
const activeChain = process.env.NEXT_PUBLIC_CHAIN === 'base-sepolia' ? baseSepolia : polygonAmoy;

export const config = createConfig({
  chains: [activeChain],
  connectors: [injected()],   // MetaMask only
  transports: {
    [activeChain.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
});
```

### 2. Provider Wrapper (`frontend/src/providers/Web3Provider.tsx`)

```tsx
'use client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 3. Contract ABI & Address (`frontend/src/lib/contract.ts`)

```typescript
import KingdomABI from './abi/Kingdom.json';

export const KINGDOM_CONTRACT = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
  abi: KingdomABI.abi,
} as const;
```

### 4. Contract Read Hooks (`frontend/src/hooks/useContractReads.ts`)

```typescript
// Primary map hook — polls every 5 seconds
export function useGameMap() {
  return useReadContract({
    ...KINGDOM_CONTRACT,
    functionName: 'getMap',
    query: { refetchInterval: 5000 },
  });
  // Parse return: owners[36], buildings[36], kingdoms[36] → Tile[]
}

// Player gold balance
export function usePlayerGold(address: string) {
  return useReadContract({
    ...KINGDOM_CONTRACT,
    functionName: 'gold',
    args: [address],
    query: { refetchInterval: 5000 },
  });
}

// Kingdom stats
export function useKingdomStats(kingdom: 0 | 1) {
  return useReadContract({
    ...KINGDOM_CONTRACT,
    functionName: 'getKingdomStats',
    args: [kingdom],
  });
}

// Active proposal for a kingdom
export function useActiveProposal(kingdom: 0 | 1) {
  // Read activeProposal mapping + proposal details
}

// Player tile count in a kingdom
export function usePlayerTileCount(address: string, kingdom: 0 | 1) {
  return useReadContract({
    ...KINGDOM_CONTRACT,
    functionName: 'getPlayerTileCount',
    args: [address, kingdom],
  });
}

// Tax rate
export function useTaxRate(kingdom: 0 | 1) { ... }

// Treasury
export function useTreasury(kingdom: 0 | 1) { ... }

// War cooldown
export function useWarCooldown(kingdom: 0 | 1) { ... }
```

### 5. Contract Write Hooks (`frontend/src/hooks/useContractWrites.ts`)

```typescript
// Buy land
export function useBuyLand() {
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  const buyLand = (tileId: number) => {
    writeContract({
      ...KINGDOM_CONTRACT,
      functionName: 'buyLand',
      args: [BigInt(tileId)],
      value: parseEther('0.01'),
    });
  };

  return { buyLand, isPending, isSuccess, error };
}

// Build
export function useBuild() {
  const { writeContract, isPending, isSuccess, error } = useWriteContract();

  const build = (tileId: number, buildingType: number) => {
    writeContract({
      ...KINGDOM_CONTRACT,
      functionName: 'build',
      args: [BigInt(tileId), buildingType],
    });
  };

  return { build, isPending, isSuccess, error };
}

// Claim gold
export function useClaim() { ... }

// Propose
export function usePropose() { ... }

// Vote
export function useVote() { ... }

// Execute
export function useExecute() { ... }
```

### 6. Event Listening Hook (`frontend/src/hooks/useContractEvents.ts`)

```typescript
export function useGameEvents() {
  // Listen to all contract events in real-time:
  // LandBought, BuildingBuilt, GoldClaimed, ProposalCreated, VoteCast, ProposalExecuted, WarResolved

  // Convert each event to a GameEvent object with human-readable message
  // Store in a local array (last 50 events)
  // Used by the EventLog component

  useWatchContractEvent({
    ...KINGDOM_CONTRACT,
    eventName: 'LandBought',
    onLogs(logs) {
      // Parse and add to event feed
    },
  });

  // ... repeat for all events
}
```

### 7. Wallet Connection Components

#### `ConnectButton.tsx`
```tsx
// frontend/src/components/wallet/ConnectButton.tsx

// Medieval-styled connect button:
// - Not connected: "🔗 Connect Thy Wallet" button
// - Connecting: Loading spinner
// - Connected: Truncated address + kingdom badge + disconnect option
// - Wrong network: "⚠️ Switch to [Network]" button with auto-switch
```

#### `WalletInfo.tsx`
```tsx
// frontend/src/components/wallet/WalletInfo.tsx

// Displays:
// - Connected address (truncated with copy button)
// - Network name + status indicator
// - Player's gold balance
// - Number of tiles owned
// - Kingdom membership
// - Testnet ETH balance
```

#### `NetworkSwitch.tsx`
```tsx
// frontend/src/components/wallet/NetworkSwitch.tsx

// If user is on wrong network:
// - Show warning banner
// - "Switch Network" button that calls wallet_switchEthereumChain
// - Auto-detect and suggest correct testnet
```

### 8. Transaction Status Manager (`frontend/src/hooks/useTransactionStatus.ts`)

```typescript
export function useTransactionStatus() {
  // Manages pending transactions with toast notifications:
  // 1. Transaction submitted → "⏳ Transaction pending..."
  // 2. Transaction confirmed → "✅ Land purchased!" (or relevant action)
  // 3. Transaction failed → "❌ Transaction failed: insufficient gold"
  //
  // Shows toast notifications using the Toast component
  // Tracks multiple simultaneous transactions
}
```

### 9. Game State Context (`frontend/src/providers/GameStateProvider.tsx`)

```tsx
// Combines all read hooks into a single context:
export interface GameState {
  map: Tile[];
  playerGold: bigint;
  playerKingdom: Kingdom | null;
  playerTileCount: number;
  northStats: KingdomStats;
  southStats: KingdomStats;
  events: GameEvent[];
  isLoading: boolean;
  isConnected: boolean;
}

// Provides this to all child components via React Context
// Handles loading states, error states, and reconnection
```

### 10. Environment Configuration

```env
# frontend/.env.local.example
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN=polygon-amoy  # or base-sepolia
NEXT_PUBLIC_RPC_URL=https://rpc-amoy.polygon.technology
```

### 11. Data Parsing Utilities (`frontend/src/lib/contractParser.ts`)

```typescript
// Converts raw contract return values to frontend types:

export function parseMapData(raw: any): Tile[] {
  // raw.owners: address[36]
  // raw.buildings: uint8[36]
  // Convert to Tile[] array with computed fields (row, col, kingdom)
}

export function parseProposal(raw: any): Proposal { ... }

export function formatGold(amount: bigint): string {
  // "1,234 gold" with icon
}

export function formatAddress(address: string): string {
  // "0x1234...5678"
}
```

## Error Handling
- **No wallet installed:** Show install MetaMask prompt
- **Wrong network:** Auto-suggest switch, show clear error
- **Transaction reverted:** Parse revert reason, show user-friendly message
- **RPC errors:** Retry with exponential backoff
- **Stale data:** Show "last updated X seconds ago" indicator

## Output Structure
```
frontend/src/
├── lib/
│   ├── wagmi.ts
│   ├── contract.ts
│   ├── contractParser.ts
│   └── abi/
│       └── Kingdom.json     # From Agent 02
├── providers/
│   ├── Web3Provider.tsx
│   └── GameStateProvider.tsx
├── hooks/
│   ├── useContractReads.ts
│   ├── useContractWrites.ts
│   ├── useContractEvents.ts
│   └── useTransactionStatus.ts
├── components/
│   └── wallet/
│       ├── ConnectButton.tsx
│       ├── WalletInfo.tsx
│       └── NetworkSwitch.tsx
└── .env.local.example
```

## Interface Contracts
- **Input from Agent 01:** Contract ABI (function signatures, event signatures)
- **Input from Agent 02:** ABI JSON file at `frontend/lib/abi/Kingdom.json`
- **Input from Agent 04:** UI components, types, provider wrappers
- **Output to Agent 05:** Map data hooks (useGameMap)
- **Output to Agent 06:** Write hooks (usePropose, useVote, useExecute)
- **Output to Agent 08:** Contract interaction methods for AI NPC system
- **Output to Agent 15:** Full Web3 layer for integration

> Every transaction must have clear feedback. Never leave the player wondering what happened. Handle every error gracefully with human-readable messages.
