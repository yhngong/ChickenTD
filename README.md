# ChickenTD

A 16-bit pixel-art mashup of an **active Clicker game** and a **Bloons TD-inspired Tower Defense game**! Deploy and upgrade **14 specialized pixel-art Chicken Troops** to protect your **Golden Egg Nest** from multi-layered **Bugs** and giant MOAB-class **Fox Bosses**.

## Core Mechanics

- **100% Handcrafted Pixel-Art Graphics**:
  - Custom nearest-neighbor `460x300` pixel-art meadow stage, midpoint pixel circles, square pixel pop particles, and bespoke pixel-art sprites for all 14 Chicken classes, 7 Bug types, 4 Giant Fox Bosses, and UI icons (with zero emoji sprites).
- **Zero Enemy Gold — 100% Clicker Economy**:
  - Popping Bugs and Foxes awards **0 Corn**! Every single kernel of **Corn** is earned by clicking the **Henhouse Clicker**.
- **Active-Wave Clicking Only (`12 CPS` Hard Cap)**:
  - The Henhouse Clicker is **locked between waves** — you can only click to harvest Corn while a wave of Bugs and Foxes is actively marching toward your Nest!
  - Clicking speed is strictly capped at **12 CPS** (clicks per second) in a rolling 1-second window; any clicks beyond 12 CPS do nothing.
- **14 Upgradable Chicken Units (4 Tiers Each)**:
  1. `[1]` **Brawler Bantam** — Close Melee Flurry
  2. `[2]` **Pecker Hen** — Fast Seed Shooter
  3. `[3]` **Honeycomb Hen** — Sticky Glue Gunner
  4. `[4]` **Outback Hen** — Curving Boomerang
  5. `[5]` **Silkie Frost-Hen** — Crowd Slow & Chill
  6. `[6]` **Plague Pullet** — Corrosive Acid Flask
  7. `[7]` **Ranger Rooster** — Long-Range Fox Sniper
  8. `[8]` **Orpington Lobber** — Explosive Egg Mortar
  9. `[9]` **Arcane Wyandotte** — Lightning Archmage
  10. `[0]` **Shinobi Chick** — Camo Shuriken Master
  11. `[Q]` **Buccaneer Broiler** — Heavy Fox Cannon
  12. `[W]` **Mariachi Rooster** — 360-Degree Sonic Shockwave
  13. `[E]` **Sun Chantecler** — Super Solar Rooster
  14. `[R]` **Cyber-Cluck 9000** — Twin Laser Railgun
- **Dual Upgrade Paths**:
  - Invest Corn into **Clicker Upgrades** (*Sharper Beak*, *Golden Egg Luck*, *Frenzy Peck Streak*, *12-Peck Mega Cob*), **Individual Chicken Unit Tiers (1–4)**, or **Global TD Roost Lab Upgrades** (*Caffeinated Feed*, *Watchtower Roost*, *Fox-Slayer Talons*, *Woven Golden Nest*).

## Controls

| Input | Action |
| :--- | :--- |
| **Pointer Click on Henhouse** | Harvest Corn during active waves (strictly capped at `12 CPS`) |
| `1`–`9`, `0`, `Q`, `W`, `E`, `R` | Select any of the 14 Chicken Troops to deploy |
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
