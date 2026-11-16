# ChickenTD 🐔🌽🦊

A mashup of an **active Clicker game** and a **Bloons TD-inspired Tower Defense game**! Deploy and upgrade specialized **Chicken Troops** to protect your **Golden Egg Nest** from multi-layered **Bugs** and giant MOAB-class **Fox Bosses**.

## Core Mechanics

- **Zero Enemy Gold — 100% Clicker Economy**:
  - Popping Bugs and Foxes awards **$0**! Every single kernel of **Corn (`🌽`)** is earned by clicking the **Henhouse Clicker**.
- **Active-Wave Clicking Only (`12 CPS` Hard Cap)**:
  - The Henhouse Clicker is **locked between waves**—you can only click to harvest Corn while a wave of Bugs and Foxes is actively marching toward your Nest!
  - Clicking speed is strictly capped at **12 CPS** (clicks per second) in a rolling 1-second window; any clicks beyond 12 CPS do nothing.
- **Strategic Economy Split**:
  - Choose whether to invest Corn into **Clicker Upgrades** (*Sharper Beak*, *Golden Egg Luck*, *Frenzy Peck Streak*, *12-Peck Mega Cob*), **6 Upgradable Chicken Troop Classes** (4 Tiers each), or **Global TD Roost Lab Upgrades** (*Caffeinated Feed*, *Watchtower Roost*, *Fox-Slayer Talons*, *Woven Golden Nest*).
- **Bloons-Style Multi-Layer Bugs & MOAB-Class Foxes**:
  - Popping outer Bugs (*Emerald Mantis → Iron Stag Beetle → Yellow Hornet → Spotted Ladybug → Blue Aphid → Red Ant*) spawns inner layers along the path, while Giant **Fox Bosses** (*Red Scout Fox*, *Armored Timber Fox*, *Shadow Kitsune*, *Mega Alpha Reynard*) act like MOAB blimps that burst into packs of Bugs and smaller Foxes!

## Controls

| Input | Action |
| :--- | :--- |
| **Pointer Click on Henhouse** | Harvest Corn during active waves (strictly capped at `12 CPS`) |
| `1`–`6` | Select Chicken Troop to deploy on the meadow |
| **Click Placed Chicken** | Open Inspector to Upgrade (`Tier 1–4`), change Targeting (`First`/`Strong`/`Last`/`Close`), or Sell |
| `Space` | Start Next Wave (when between waves) |
| `Esc` / Right-Click | Cancel placement or close inspector |

## Run Locally

```bash
npm install
npm run dev
```

Build production bundle:

```bash
npm run build
```
