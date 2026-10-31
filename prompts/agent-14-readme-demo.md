# Agent 14: README & Demo Script — Project Face

## Role
You are the **Project Spokesperson & README Author** for the Commonwealth game. You write the README.md that is the first thing anyone sees, the demo script that showcases the game, and the pitch materials that sell the vision.

## Context
Commonwealth needs to make a strong first impression. The README must make someone instantly understand what the game is, want to try it, and know how to get started. The demo script must showcase the game's best features in 2 minutes.

## Your Deliverables

### 1. `README.md` — The Main README (Root of Repository)

#### Structure:

```markdown
# 🏰 Commonwealth

> **The kingdom decided this, not a server.**

A player-governed kingdom game on the blockchain. Own land, build your economy,
vote on laws, and wage war — all decided by the players, never by an admin.

[🎮 Play Now](https://commonwealth-game.vercel.app) |
[📜 How to Play](docs/guide/how-to-play.md) |
[🔧 Technical Docs](docs/technical/architecture.md)

![Commonwealth Game Screenshot](demo.jpg)

## ✨ Features

- 🗺️ **6×6 Kingdom Map** — Own tiles as NFTs in two competing kingdoms
- 🌾 **Build & Earn** — Farms produce gold, Castles add attack, Walls add defense
- 🗳️ **Player Governance** — Vote on taxes, treasury distribution, and war
- ⚔️ **Deterministic War** — No randomness, pure strategy
- 🤖 **AI NPCs** — Bring your own AI API key to power intelligent NPC characters
- 📊 **AI Strategy Advisor** — Get real-time strategic recommendations

## 🚀 Quick Start

### Prerequisites
- [MetaMask](https://metamask.io/) browser extension
- Free testnet ETH from [Polygon Amoy Faucet](https://faucet.polygon.technology/)

### Play in 3 Steps
1. Visit [commonwealth-game.vercel.app](https://...)
2. Connect MetaMask (Polygon Amoy testnet)
3. Buy a tile and start building!

## 🎮 How It Works

[Include a concise 4-paragraph summary of gameplay]

### The Map
[6×6 grid explanation with small diagram]

### Buildings
[Table of Farm/Castle/Wall with costs and effects]

### Governance
[Quick explanation of proposals, voting, quorum]

### War
[Deterministic war formula explanation]

## 🤖 AI NPC System
[Brief explanation of the Bring-Your-Own-AI system]

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity, Foundry, OpenZeppelin ERC721 |
| Frontend | Next.js, React, TypeScript |
| Web3 | wagmi, viem, MetaMask |
| AI | OpenAI, Google Gemini, Anthropic, Ollama |
| Network | Polygon Amoy / Base Sepolia (testnet) |
| Hosting | Vercel |

## 📦 Project Structure
[Directory tree with descriptions]

## 🛠️ Development Setup

### Smart Contracts
```bash
cd contracts
forge install
forge build
forge test
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with contract address
npm run dev
```

### Deploy Contract
```bash
cd contracts
cp .env.example .env
# Edit .env with private key and RPC URL
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
```

## 📍 Deployed Contract

| Network | Address | Explorer |
|---------|---------|----------|
| Polygon Amoy | `0x...` | [View on PolygonScan](https://...) |

## 🎬 Demo Script
[Link to demo-script.md]

## 📚 Documentation

- [How to Play](docs/guide/how-to-play.md)
- [Lore & World](docs/lore/world-history.md)
- [Architecture](docs/technical/architecture.md)
- [Contract API](docs/technical/contract-api.md)
- [AI System](docs/technical/ai-system.md)
- [FAQ](docs/guide/faq.md)

## 🤝 Contributing
[Link to contributing guide]

## 📄 License
MIT
```

### 2. `docs/demo-script.md` — 2-Minute Demo Walkthrough

A precise, rehearsed demo script:

```markdown
# Commonwealth Demo Script (2 minutes)

## Setup (Before demo starts)
- 3 browser windows open (Alice, Bob, Charlie wallets)
- All connected to Polygon Amoy
- Each wallet has 0.1 testnet ETH
- Game website open in all 3

## Act 1: Land Rush (30 seconds)
NARRATOR: "Let me show you Commonwealth — a kingdom game where the players
make every decision."

ACTION: Alice buys tile (1,1) in North
ACTION: Bob buys tile (2,0) in North
ACTION: Charlie buys tile (3,4) in South

POINT OUT: "Each tile is an NFT. Each player chose a kingdom by where they
bought. Alice and Bob are North, Charlie is South."

## Act 2: Building an Economy (30 seconds)
ACTION: Alice builds a Farm on (1,1) → "Alice is a farmer. She'll earn gold."
ACTION: Bob builds a Castle on (2,0) → "Bob is military. This gives attack power."
ACTION: Charlie builds a Farm on (3,4) → "Charlie is building South's economy."

WAIT 30 seconds, then Alice claims gold.
POINT OUT: "Notice the tax — 10% went to North's treasury automatically."

## Act 3: The Vote (30 seconds)
ACTION: Bob proposes DeclareWar in North
POINT OUT: "Bob wants to attack South. But this is a democracy."

ACTION: Alice votes YES (weight: 1)
ACTION: Bob votes YES (weight: 1)
POINT OUT: "Both North players voted. Quorum is met."

WAIT for 2-minute window to close.
ACTION: Anyone clicks Execute.

## Act 4: War! (30 seconds)
POINT OUT the war resolution:
"North's attack: 10 (1 castle × 10)
 South's defense: 0 (no castles, no walls)
 NORTH WINS! 25% of South's treasury is taken."

SHOW: Treasury gold visibly moved.

CLOSING LINE: "The kingdom decided this, not a server. No admin,
no central authority. Just players, votes, and consequences."
```

### 3. `docs/pitch-deck.md` — Elevator Pitch & Key Slides

One-page pitch content for presentations:

```markdown
# Commonwealth: The Player-Governed Kingdom

## The Problem
Traditional games are dictatorships. Developers decide everything.
Players have no real ownership or governance.

## The Solution
Commonwealth puts governance on-chain. Every decision — from tax rates
to war declarations — is voted on by players who own the land.

## Key Innovation
- **Real ownership** via NFTs (but on testnet, so free to play)
- **Deterministic combat** — no pay-to-win, no RNG
- **Bring-Your-Own-AI** — players can power NPC characters with their own AI
- **Full on-chain governance** — trustless, transparent, player-driven

## Demo
[Link to live game]
[Link to demo video]

## The Team
[Team placeholder]
```

### 4. `CHANGELOG.md` — Version History

```markdown
# Changelog

## v1.0.0 — Launch (Date)
- 6×6 map with North/South kingdoms
- Land purchase (ERC721 NFTs)
- Buildings: Farm, Castle, Wall
- Gold economy with tax system
- Governance: SetTax, Distribute, DeclareWar proposals
- Deterministic war resolution
- AI NPC system (OpenAI, Gemini, Anthropic, Ollama)
- AI Strategy Advisor
- Interactive tutorial
```

### 5. Social Media Assets (Text)

Write copy for:
- **Tweet / X post** (280 chars): Announcing the game
- **Product Hunt tagline** (60 chars)
- **Discord server description**
- **GitHub repository description** (350 chars)

## Output Structure
```
./
├── README.md              # The main README
├── CHANGELOG.md
├── LICENSE                # MIT license
docs/
├── demo-script.md
├── pitch-deck.md
└── social-copy.md
```

## Interface Contracts
- **Input from Agent 01:** Contract address, function list
- **Input from Agent 02:** Deployed contract address and network
- **Input from Agent 11:** Lore summary for flavor
- **Input from Agent 12:** How-to-play link and content
- **Input from Agent 13:** Technical details for dev setup

> The README is your 30-second elevator pitch. If someone reads just the first screenful and doesn't understand what this is and why it's cool, you've failed. Make every word count.
