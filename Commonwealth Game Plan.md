# Commonwealth: Game Plan

*A player-governed kingdom game on the blockchain. Team plan for a 5-hour build.*

## 1. The pitch (read this first)

Commonwealth is a browser game where every player owns a piece of a shared kingdom, and the kingdom is run by its players, not by a server or an admin. Players buy land (each plot is an NFT), build farms, castles and walls, earn gold, and vote on decisions such as the tax rate, how to share the treasury, and whether to declare war on the rival kingdom.

The one-sentence demo line: **"The kingdom decided this, not a server."**

## 2. Goals and constraints

- Web browser game, playable by 3 or more people at once.
- Smart contract deployed on a **free testnet** (Polygon Amoy or Base Sepolia). Mainnet always costs real gas, so we use testnet.
- Frontend hosted free on Vercel or GitHub Pages.
- Whole thing buildable in **5 hours** by the team.
- Demo-able in about 2 minutes.

## 3. The world

- One **6x6 map = 36 tiles**. Each tile is an NFT.
- Two kingdoms: **North** (columns 0 to 2) and **South** (columns 3 to 5). The tile you buy decides your kingdom, so there is no separate "join" step.
- Every tile has an owner (or is empty), a building (or none), and a last-claim time.

## 4. How the game plays

### 4.1 Land

- Buying a tile costs a small amount of testnet ETH (for example 0.01). That ETH goes into the contract.
- Buying mints the land NFT to you and gives you **100 starter gold**.
- In the MVP, land NFTs are **non-transferable**. Otherwise a player could vote, send the NFT to another wallet, and vote again. Trading is a stretch goal.

### 4.2 Gold

- Gold is just a number stored in the contract (not a separate token). It is earned from farms and spent on buildings.

### 4.3 Buildings (one per tile)

| Building | Cost | Effect |
| --- | --- | --- |
| Farm | 50 gold | +5 gold per minute to its owner |
| Castle | 150 gold | +10 attack and +4 defense for the kingdom |
| Wall | 80 gold | +8 defense for the kingdom |

Numbers are kept as constants in one place so we can tune them before the demo.

### 4.4 Claiming gold and taxes

- Farms produce gold over time. A player presses **Claim** to collect it.
- On every claim, a **tax** (default 10%) goes to the kingdom treasury. The rest goes to the player.
- The tax rate can be changed by vote (0 to 30%).

### 4.5 The treasury

- Each kingdom has its own **gold treasury**, filled by taxes.
- The contract also holds the testnet ETH from land sales.
- The treasury is only moved by passed proposals (never by one person).

## 5. Governance (the heart of the game)

Any player in a kingdom can create a proposal. Only **one active proposal per kingdom** at a time.

### 5.1 Proposal types

1. **SetTax**: change the tax rate (0 to 30%).
2. **Distribute**: split the kingdom's gold treasury among players in proportion to the tiles they own. This is the "resources distributed by ownership" mechanic.
3. **DeclareWar**: attack the other kingdom.

### 5.2 Voting rules

- **Vote weight = number of tiles you own** in that kingdom.
- Only members of that kingdom can vote, and each wallet votes once per proposal.
- Voting window is short (2 minutes) so it works live in a demo.
- A proposal **passes** if Yes is greater than No **and** at least 20% of the kingdom's owned tiles voted (quorum).
- After the window closes, **anyone** can press Execute to apply the result.

## 6. War (the twist)

War is deterministic. No randomness and no oracles, so it is simple and fair.

- **Attack** = attacker's castles x 10
- **Defense** = defender's walls x 8 + defender's castles x 4
- If Attack is greater than Defense: the attacker takes **25% of the defender's gold treasury**.
- Otherwise the attack fails and the attacker loses **10% of its own treasury**.
- A **10-minute cooldown** applies after each war declaration.

Strategy this creates: do we spend gold on farms (economy), on castles (offense), or walls (safety)? And do we dare to vote for war?

## 7. Smart contract design

One contract, **Kingdom.sol**, built on OpenZeppelin ERC721. The contract is also the treasury.

**Data**

- Per tile: building type and last-claim time.
- Per player: gold balance.
- Per kingdom: treasury gold and tax rate.
- Proposals: type, parameter, kingdom, yes/no weight, deadline, executed flag, who has voted.

**Functions**

- `buyLand(tileId)` (payable): mint the NFT and grant starter gold.
- `build(tileId, type)`: spend gold to place a building.
- `claim()`: collect farm gold, apply the tax.
- `propose(type, param)`: open a proposal.
- `vote(proposalId, support)`: cast a weighted vote.
- `execute(proposalId)`: apply a passed proposal after the window.
- `getMap()` (view): returns owners, buildings and kingdoms for all 36 tiles in one call.

**Design decisions**

- Non-transferable NFTs in the MVP (blocks double voting).
- A single `getMap()` view so the frontend needs one RPC call, not 36.
- Looping over 36 tiles is cheap, so no clever accounting.
- Tile-to-kingdom is a simple pure function (columns 0 to 2 North, 3 to 5 South).
- Events emitted for land bought, building built, proposal created, vote cast, war resolved.

## 8. Frontend design

- A **6x6 CSS grid** of tiles, coloured by kingdom, with emoji for buildings (farm, castle, wall). No art assets needed.
- **Side panel** on tile click: Buy, Build (choose building), or Claim.
- **Top bar**: your gold, each kingdom's treasury, and each kingdom's attack and defense totals.
- **Governance panel**: the active proposal with a countdown, Yes/No buttons, and a Create Proposal form.
- **Event log**: live feed of what is happening in the kingdoms.
- Wallet: MetaMask only (wagmi injected connector). No RainbowKit or WalletConnect, to save setup time.
- The map refreshes by polling `getMap()` every 5 seconds.

## 9. Tech stack

- **Contracts:** Solidity, Foundry, OpenZeppelin
- **Frontend:** Next.js, wagmi, viem
- **Network:** Polygon Amoy or Base Sepolia (free faucet ETH, public RPC)
- **Hosting:** Vercel or GitHub Pages

## 10. Team split and 5-hour schedule

Suggested roles (adjust to team size):

- **Contract dev:** `Kingdom.sol`, tests, deployment.
- **Frontend dev:** map, panels, wallet connection.
- **Integrator / demo lead:** ABI wiring, funding demo wallets, README, rehearsal.

| Time | Task |
| --- | --- |
| 0:00 to 0:20 | Review this plan, lock the spec, scaffold Foundry and Next.js |
| 0:20 to 1:50 | Contract: land, buildings, claim, then proposals and war. Frontend builds static map in parallel |
| 1:50 to 2:20 | Foundry tests for 5 critical paths: buy, build, claim, vote and pass, war (use `vm.warp` for time) |
| 2:20 to 2:40 | Deploy to testnet, share contract address and ABI |
| 2:40 to 4:15 | Frontend: connect to contract, actions, governance panel |
| 4:15 to 4:45 | Fund 3 demo wallets, play a full game, fix bugs, deploy to Vercel |
| 4:45 to 5:00 | Rehearse demo, write README |

**If we fall behind, cut in this order:** event log, then Distribute proposal, then SetTax proposal. Never cut land, buildings, voting or war, because those are the pitch.

## 11. Demo script (about 2 minutes)

1. Three wallets buy tiles: two in North, one in South.
2. Build farms, claim gold, and show tax flowing into the treasury.
3. North proposes war, both North wallets vote, the window closes, and Execute resolves it.
4. Loot visibly moves between treasuries. Close with: "The kingdom decided this, not a server."

## 12. Risks and how we handle them

- **Balance:** all numbers are constants, tune before the demo.
- **Waiting on real time:** use `vm.warp` in tests, and short windows in the live demo.
- **Single-person demo:** use multiple pre-funded wallets so governance can be shown.
- **Faucet delays:** request testnet ETH at the very start, not at deployment time.
- **Scope creep:** anything not in this document is a stretch goal.

## 13. Stretch goals (only if time remains)

- Tile capture after a won war.
- ETH payout proposal from the land-sale treasury.
- Tradable tiles with vote locking.
- A third kingdom.

## 14. Definition of done

- Contract deployed on testnet and verified.
- Live website where 3 wallets can buy land, build, claim, vote and resolve a war.
- README with the contract address, how to play, and the demo script.
