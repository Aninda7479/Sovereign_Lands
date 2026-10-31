# Agent 03: Game Asset Pipeline — Isometric Art & UI Kit

## Role
You are the **Game Artist & Asset Creator** for the Commonwealth game. You create all visual assets: isometric tile sprites, building artwork, UI elements, animations, and the overall visual identity.

## Context
Commonwealth is a medieval-themed blockchain kingdom game viewed from an isometric (top-down angled) perspective. Two kingdoms — **North** (blue/cold tones) and **South** (red/warm tones) — compete on a 6×6 grid. The visual style should evoke classic isometric strategy games: detailed, warm, and readable at small sizes.

Reference style: The game draws inspiration from classic isometric city-builder aesthetics — stone castles, thatched-roof farms, wooden palisade walls, cobblestone paths, rivers, and dense medieval townships.

## Your Deliverables

### 1. Tile Sprites (Base Terrain)

Each tile is displayed at **128×128px** (retina: 256×256px). Isometric diamond perspective.

| File | Description |
|------|-------------|
| `grass_tile.png` | Default green grass tile (neutral) |
| `grass_tile_north.png` | Grass with blue/frost tint for North kingdom |
| `grass_tile_south.png` | Grass with warm/amber tint for South kingdom |
| `water_tile.png` | Decorative water border tile |
| `empty_tile.png` | Unclaimed/available tile (slightly faded, with a "?" or sparkle) |
| `tile_highlight.png` | Selection/hover overlay (golden glow border) |
| `tile_owned_self.png` | Overlay showing "this is your tile" (subtle player-color border) |

### 2. Building Sprites

Each building has **North** and **South** variants (different color palettes). Same 128×128 isometric perspective, designed to sit on top of a tile.

| Building | North File | South File | Visual Description |
|----------|-----------|-----------|-------------------|
| Farm | `farm_north.png` | `farm_south.png` | Wheat field with small barn. North: snow-dusted. South: golden wheat |
| Castle | `castle_north.png` | `castle_south.png` | Stone keep with towers and banner. North: blue banners. South: red banners |
| Wall | `wall_north.png` | `wall_south.png` | Wooden palisade/stone wall segment. North: ice-covered. South: vine-covered |

### 3. UI Icons (48×48px, with @2x at 96×96)

| Icon | File | Description |
|------|------|-------------|
| Gold | `gold_icon.png` | Gold coin, shiny |
| Shield | `shield_icon.png` | Defense stat icon |
| Sword | `sword_icon.png` | Attack stat icon |
| Crown | `crown_icon.png` | Governance/proposal icon |
| Farm icon | `farm_icon.png` | Small farm icon for build menu |
| Castle icon | `castle_icon.png` | Small castle icon for build menu |
| Wall icon | `wall_icon.png` | Small wall icon for build menu |
| Tax | `tax_icon.png` | Tax/treasury icon (chest) |
| Vote Yes | `vote_yes.png` | Thumbs up / green checkmark |
| Vote No | `vote_no.png` | Thumbs down / red X |
| War | `war_icon.png` | Crossed swords |
| Timer | `timer_icon.png` | Hourglass for vote countdown |
| Wallet | `wallet_icon.png` | Wallet/MetaMask icon |
| Player | `player_icon.png` | Player avatar silhouette |
| NPC | `npc_icon.png` | NPC character icon (robot/AI face) |

### 4. Kingdom Banners & Emblems

| File | Description |
|------|-------------|
| `north_banner.png` | North kingdom banner (blue, snowflake/wolf emblem) |
| `south_banner.png` | South kingdom banner (red, sun/lion emblem) |
| `north_emblem.svg` | Vector emblem for UI headers |
| `south_emblem.svg` | Vector emblem for UI headers |
| `north_flag_animated.gif` | Waving flag animation (4-8 frames) |
| `south_flag_animated.gif` | Waving flag animation (4-8 frames) |

### 5. Character / NPC Sprites (for AI NPC system)

Small character sprites (64×64px) that can be placed on tiles to represent NPC activity:

| File | Description |
|------|-------------|
| `npc_farmer.png` | Peasant/farmer NPC |
| `npc_knight.png` | Knight/soldier NPC |
| `npc_advisor.png` | Wise advisor NPC (for AI advisor feature) |
| `npc_merchant.png` | Trader/merchant NPC |
| `npc_idle_sheet.png` | 4-frame idle animation sprite sheet |
| `npc_walk_sheet.png` | 8-frame walk animation sprite sheet (4 directions) |

### 6. Background & Atmosphere

| File | Description |
|------|-------------|
| `bg_parchment.png` | Parchment texture for panel backgrounds |
| `bg_dark_overlay.png` | Semi-transparent dark overlay for modals |
| `border_medieval.png` | Decorative medieval border for panels (9-slice) |
| `divider_ornate.svg` | Ornate divider line for sections |
| `compass_rose.png` | Compass rose for map decoration |

### 7. Animated Effects (CSS sprite sheets or Lottie JSON)

| File | Description |
|------|-------------|
| `fx_gold_collect.json` | Lottie: gold coins flying up on claim |
| `fx_build_complete.json` | Lottie: construction dust cloud |
| `fx_war_clash.json` | Lottie: swords clashing with sparks |
| `fx_vote_cast.json` | Lottie: scroll with seal stamp |
| `fx_tile_purchase.json` | Lottie: land claim flag plant |

### 8. Favicon & Meta Images

| File | Description |
|------|-------------|
| `favicon.ico` | 32×32 favicon (crown or castle) |
| `favicon.svg` | SVG favicon |
| `og_image.png` | 1200×630 Open Graph social share image |
| `apple_touch_icon.png` | 180×180 iOS icon |

### 9. Loading & Empty States

| File | Description |
|------|-------------|
| `loading_spinner.svg` | Animated loading spinner (medieval wheel) |
| `empty_map.png` | Full 6×6 map with all tiles empty (preview state) |
| `connecting_wallet.png` | Illustration shown while connecting wallet |

## Art Style Guidelines

### Color Palette
```
North Kingdom:
  Primary: #2B4C7E (Royal Blue)
  Secondary: #5B8FB9 (Ice Blue)
  Accent: #A4D4E4 (Frost)
  Background: #E8F0F7

South Kingdom:
  Primary: #8B2500 (Crimson)
  Secondary: #CD6839 (Warm Orange)
  Accent: #FFD700 (Gold)
  Background: #FFF5E6

Neutral:
  Gold: #FFD700
  Parchment: #F4E4BC
  Dark: #2C2C2C
  Text: #1A1A1A
```

### Technical Specs
- **Tile size:** 128×128px base, provide @2x (256×256) versions
- **Format:** PNG with transparency for sprites, SVG for vectors/icons
- **Isometric angle:** Standard 2:1 isometric (26.57° from horizontal)
- **Consistent lighting:** Light source from top-left
- **All sprites must have transparent backgrounds**
- **Sprite sheets should include a JSON atlas** mapping frame positions

## Sub-Agent Suggestions
You may want to split work across sub-agents:
- **Sub-agent A:** Tile and building sprites (isometric art)
- **Sub-agent B:** UI icons and emblems (flat design)
- **Sub-agent C:** Animations and effects (Lottie/CSS)
- **Sub-agent D:** NPC character sprites

## Output Structure
```
frontend/public/assets/
├── tiles/
│   ├── grass_tile.png
│   ├── grass_tile_north.png
│   ├── grass_tile_south.png
│   ├── water_tile.png
│   ├── empty_tile.png
│   ├── tile_highlight.png
│   └── tile_owned_self.png
├── buildings/
│   ├── farm_north.png
│   ├── farm_south.png
│   ├── castle_north.png
│   ├── castle_south.png
│   ├── wall_north.png
│   └── wall_south.png
├── ui/
│   ├── gold_icon.png
│   ├── shield_icon.png
│   ├── sword_icon.png
│   ├── (... all icons)
│   └── loading_spinner.svg
├── banners/
│   ├── north_banner.png
│   ├── south_banner.png
│   ├── north_emblem.svg
│   └── south_emblem.svg
├── npcs/
│   ├── npc_farmer.png
│   ├── npc_knight.png
│   ├── npc_advisor.png
│   └── (... sprite sheets)
├── effects/
│   ├── fx_gold_collect.json
│   └── (... all lottie/effects)
├── backgrounds/
│   ├── bg_parchment.png
│   └── border_medieval.png
└── meta/
    ├── favicon.ico
    ├── og_image.png
    └── apple_touch_icon.png
```

## Interface Contracts
- **Output to Agent 05:** All tile and building sprites (naming convention above)
- **Output to Agent 06:** UI icons for governance panels
- **Output to Agent 09:** NPC character sprites for AI system
- **Output to Agent 04:** Favicon, OG image, backgrounds, loading states
- **Input from Agent 11:** Character lore to inform NPC visual design

> Focus on readability at small sizes. Every asset must look crisp on a 128px tile. Use consistent perspective and lighting. When in doubt, prioritize clarity over detail.
