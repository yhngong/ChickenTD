# ChickenTD

A 16-bit pixel-art mashup of an **active Clicker game** and a **Bloons TD-inspired Tower Defense game**! Choose across **5 Pixel-Art Biome Maps** and **4 Difficulties**, then deploy and upgrade **22 specialized pixel-art Chicken Troops** to protect your **Golden Egg Nest** from **19 multi-layered Bugs and Mythic Fox Bosses** — including the **Solar Phoenix Fox** and **Nebula Cosmic Fox**.

## Core Mechanics

- **Main Menu — 5 Maps & 4 Difficulties**:
  - **Maps**: *Sunny Clover Meadow* (`Beginner`), *Frostbite Pine Fjord* (`Intermediate`), *Scorched Roost Caldera* (`Advanced`), *Whispering Honey-Bog* (`Expert`), and *Cosmic Egg Sanctum* (`Master`).
  - **Difficulties**: *Chickadee* (`Easy`), *Barnyard* (`Normal`), *Fox-Hunt* (`Hard`), and *Henpocalypse* (`Nightmare`).
- **100% Handcrafted Pixel-Art Graphics**:
  - Custom nearest-neighbor `460x300` pixel-art biome stages, live baked pixel-art map thumbnails, midpoint pixel circles, square pixel pop particles, and bespoke pixel-art sprites for all 22 Chicken classes, 10 Bug types, 9 Giant Fox Bosses, and UI icons (with zero emoji sprites).
- **19 Multi-Layered Pests & Giant Fox Bosses**:
  - **10 Bugs**: Red Ant, Blue Aphid, Spotted Ladybug, Yellow Hornet, Camo Night-Moth, Iron Stag Beetle, Emerald Mantis, Blazing Firefly (`Camo`), Obsidian Scorpion (`Armored`), and Astral Scarab (`Camo + Armored`).
  - **9 Giant Fox Bosses**: Red Scout Fox, Armored Timber Fox, Wraith Camo-Fox (`DDT-class Camo + Armored`), Shadow Kitsune, Glacial Frost-Fox, Mega Alpha Reynard, Cyber-Reynard MK-X, **Solar Phoenix Fox**, and **Nebula Cosmic Fox**.
- **Zero Enemy Gold — 100% Clicker Economy**:
  - Popping Bugs and Foxes awards **0 Corn**! Every single kernel of **Corn** is earned by clicking the **Henhouse Clicker**.
- **Active-Wave Clicking Only (`12 CPS` Hard Cap)**:
  - The Henhouse Clicker is **locked between waves** — you can only click to harvest Corn while a wave of Bugs and Foxes is actively marching toward your Nest!
  - Clicking speed is strictly capped at **12 CPS** (clicks per second) in a rolling 1-second window; any clicks beyond 12 CPS do nothing.
- **Post-Wave-10 Overdrive Scaling**:
  - Every wave after Wave 10 ramps steeply in enemy HP, enemy movement speed (`+7%` per wave), and Mythic Fox Boss armada density.
- **22 Upgradable Chicken Units (4 Tiers Each)**:
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
  15. `[A]` **Tesla Cochin** — Gigavolt Storm Coil
  16. `[S]` **Chrono Leghorn** — Time-Warp Disruptor
  17. `[D]` **Gund-Hen RX-78** — Mecha Ion Buster
  18. `[F]` **Void Ayam Cemani** — Singularity Black-Hole
  19. `[Z]` **Valkyrie Brahma** — Celestial Spear Storm
  20. `[X]` **Star-Cluck Armada** — Antimatter Fleet Nuke
  21. `[C]` **Quasar Serama** — 360-Degree Supernova Pulse
  22. `[V]` **Omnicluck Prime** — Apex Cosmic Egg-God
- **Dual Upgrade Paths**:
  - Invest Corn into **Clicker Upgrades** (*Sharper Beak*, *Golden Egg Luck*, *Frenzy Peck Streak*, *12-Peck Mega Cob*), **Individual Chicken Unit Tiers (1–4)**, or **Global TD Roost Lab Upgrades** (*Caffeinated Feed*, *Watchtower Roost*, *Fox-Slayer Talons*, *Woven Golden Nest*).

## Controls

| Input | Action |
| :--- | :--- |
| **Pointer Click on Henhouse** | Harvest Corn during active waves (strictly capped at `12 CPS`) |
| `1`–`9`, `0`, `Q`–`R`, `A`–`F`, `Z`–`V` | Select any of the 22 Chicken Troops to deploy |
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
