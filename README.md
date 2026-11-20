# ChickenTD

A 16-bit pixel-art mashup of an **active Clicker game**, **strategic layered tower defense & support auras**, and **Gem Egg mutations & Cluck Cannon combat**! Choose across **5 Pixel-Art Biome Maps** and **6 Modes / Difficulties** (including **True Fox-Hunt** and **Sandbox Lab**), deploy and upgrade **57 specialized variable-size pixel-art Chicken Troops** (spanning 5 physical size classes from compact chicks up to colossal mythic titans, including 6 **Support Aura** Chickens, **Malevolent Chicken**, **Limitless Chicken**, and **The Complete Cluck**), fire and customize **5 rechargeable Cluck Cannons**, and earn **Gem Eggs** directly (`1 Gem Egg per 1,000 Enemies killed`) to unlock new units, **Cluck Cannon loadouts**, and **Mutations** in the **Shop**.

## Core Mechanics

- **Main Menu & Shop — 5 Maps, 6 Modes (Including Sandbox!), Cluck Cannon Loadout & Idle Mode**:
  - **Maps**: *Sunny Clover Meadow* (`Beginner`), *Frostbite Pine Fjord* (`Intermediate`), *Scorched Roost Caldera* (`Advanced`), *Whispering Honey-Bog* (`Expert`), and *Cosmic Egg Sanctum* (`Master`).
  - **6 Modes & Difficulties (Including True Fox-Hunt & Sandbox Lab!)**: Higher difficulties keep Enemy HP at `1.0x` and spawn **larger swarms** — *Chickadee* (`0.75x` Enemies), *Barnyard* (`1.0x` Enemies), *Fox-Hunt* (`1.65x` Enemies), *Henpocalypse* (`2.4x` Enemies), **True Fox-Hunt** (`+40%` Shop Costs & Giant Fox Bosses ambushing way earlier starting on Wave 3!), and **Sandbox Lab** (**Infinite Corn**, summon any of the **19 Bugs & Giant Fox Bosses** at any Wave HP scale, and kills award **`0` Gem Eggs**!).
  - **Brawler Bantam Idle Mode (`GO IDLE`)**: Click **GO IDLE** from the Main Menu, Shop, or Top HUD to watch **Brawler Bantam** patrol the pasture and strike down strolling enemies (`100` kills/min = **1 Gem Egg every 10 minutes**), safely pausing your active battle and tracking wall-clock time even in background tabs!
  - **Installable App & Portable Offline Download (`GET APP`)**: Install ChickenTD as a standalone Desktop/Mobile App (PWA with offline caching, custom pixel icon, and its own window) or download a single self-contained `ChickenTD.html` file to play offline anywhere!
- **Gem Egg Progression — Full Auto-Save, Awakening `+Levels` & Mutations**:
  - **Direct Gem Egg Drops**: Earn **1 Gem Egg per 1,000 Enemies killed** (kill progress carries over across rounds and saves automatically!).
  - **Full Game Auto-Save**: Automatically saves your active run (wave, Corn, Nest HP, placed Chickens, tiers, upgrades, cannon state, and enemies) alongside your Gem Eggs, unlocked units, unlocked cannons, and Mutations in `localStorage`.
  - **Starter vs. Gem Egg Roster**: You start with **18 Starter Chickens up to Cyber-Cluck 9000** (including **Roost Beacon** & **Espresso Brew-Hen** support towers). All **38 Gem Egg Exclusives** after Cyber-Cluck 9000 are unlocked in the **Shop**, and owning all **56** forges **#57 The Complete Cluck**!
  - **1x, 4x & 8x Multi-Hatch Cutscene**: Crack open **1 Gem Egg**, **4 Gem Eggs at a time**, or **8 Gem Eggs at a time** in an animated crystalline egg-shattering cutscene!
  - **4-Tier Duplicate Mutations & `+Levels`**: Pulling a unit you already own awakens a **Mutation** (**Common `55%`**, **Rare `28%`**, **Epic `13%`**, **Legendary `4%`**) plus permanent Awakening **`+Levels`**!
- **8 Distinct Combat Attack Archetypes**:
  - **Closed-Loop Boomeranging Blades & Axes**: Sweeping elliptical trajectories (**The Complete Cluck**, **Outback Hen**, **Berserker Jarl-Hen**) that arc wide through targets, slice enemies both outbound and returning, and curve all the way back to the Chicken!
  - **Jagged Chain Lightning**: Instant forked lightning bolts (**Arcane Wyandotte**, **Tesla Cochin**) hopping enemy-to-enemy across swarms.
  - **Instant Piercing Laser & Rail Beams**: Hitscan railguns, solar obelisks, and kaiju plasma beams (**Cyber-Cluck 9000**, **Hacker Nerd-Hen**, **Pharaoh Cluck-Ra**, **Omnicluck Prime**, **Apex Kaiju-Cluck Zero**).
  - **Heavenly Sky-Drop Pillars & Orbital Meteors**: Vertical light pillars, star comets, antimatter bombardments, and solar flares raining down from above!
  - **Parabolic Mortars & Persistent Ground Hazard Zones**: High-arc mortars and flasks leaving sticky honey puddles, corrosive acid/miasma pools, spinning abyssal whirlpools, and black-hole singularities on the road!
  - **Crimson Assassin Dash-Streaks & Crossing Reality Rifts**: High-speed directional slash blurs and dimensional cross-cleaves.
  - **360-Degree Radial Shockwaves & Summoned Astral Guardian**: Full-circle shockwaves (**Mariachi Rooster**, **Granite Bastion-Hen**, **Bass-Drop DJ Hen**, **Quasar Serama**) and a tethered melee guardian spirit (**Star Crusader**).
- **5 Swappable Cluck Cannons (Equip in Shop Before Battle)**:
  - **Cluck Cannon Loadout (`[TAB]`)**: Buy new cannons permanently with **Gem Eggs** and equip your loadout in the **Shop** before starting a run (your chosen cannon is locked for the duration of each game!):
    - **Shockwave Cannon** (*Starter — Free*): Full-lane shockwave beam with wave-scaled damage, `68px` knockback, and `58%` slow.
    - **Time-Stop Cannon** (*`2` Gem Eggs*): Stops time across the map — freezes all Bugs solid at `0` speed for `5.0s` (`3.8s` vs Giant Fox Bosses) + temporal rift damage!
    - **Damage Boost Cannon** (*`2` Gem Eggs*): Supercharges ALL Chicken Troops with **`2.0x` Damage** & **`+35%` Attack Speed** for `8.0s` + shock burst!
    - **Orbital Nova Cannon** (*`3` Gem Eggs*): Calls down a `4.5x` antimatter beam (`2.5x` vs Foxes) that shatters armor and boosts enemy damage taken by `+35%` for `8.0s`!
    - **Cornstorm Cannon** (*`3` Gem Eggs*): `90px` mega-knockback gale + instant Corn windfall & **`2.0x` Henhouse/Farmhand Corn yield** for `8.0s`!
  - **Knockback & 3x Savage Blows**: Specialized brawlers and ronin units knock enemies backward along the path and land explosive **3x Savage Crit** strikes!
  - **Nest Defense Defeat Report**: Detailed endscreen when you lose showing Boss HP Remaining % / Stage Wave Progress %, Bugs Killed, MVP Chicken Unit, and Gem Egg rewards!
- **6 Nearby Support Aura Towers**:
  - Deploy **Roost Beacon** (`Watchtower`), **Espresso Brew-Hen** (`Roast Barista`), **Ramen Chef-Hen** (`Broth Chef`), **Overclock Engie-Hen** (`Speed Tuner`), **Aegis Paladin-Hen** (`Holy Templar`), and **Shrine Idol-Hen** (`Shrine Choir`) to buff nearby Chickens' range, attack speed, damage, pierce, Camo Sight, Armor-Piercing, Savage Crit, Knockback, and multishot!
- **12 Distinct Variable-Size Pixel-Art Chicken Silhouettes**:
  - Custom nearest-neighbor `460x300` pixel-art biome stages and 12 distinct body architectures spanning 5 physical footprint tiers (`20x20` compact chicks, `24x26` tall striders & robed arcanists, `30x30` wooden booths/turrets, armored juggernauts & mechas, `36x34` grand winged celestials, star dreadnoughts & serpentine krakens/wyrms, and `42x40` colossal mythic titans!).
- **Zero Enemy Gold — 100% Henhouse Economy (`12 CPS` Cap)**:
  - Defeating Bugs and Foxes awards **0 Corn**! Harvest Corn during active waves at the **Henhouse Clicker** (capped at `12 CPS`) alongside passive **Farmhand Chicks** and **9 Clicker Upgrades**.

## All 57 Chicken Units (7 Tiers Each — Overdrive T5, Transcendent T6 & Omega T7!)

### Starter Coop (Unlocked from Start — Units 1–18)
1. **Brawler Bantam** — Close Melee Flurry (`95` Corn)
2. **Pecker Hen** — Fast Seed Shooter (`120` Corn)
3. **Pebbleshot Chick** — Ricochet Slingshot (`145` Corn)
4. **Honeycomb Hen** — Sticky Honey Sprayer (`175` Corn)
5. **Outback Hen** — Returning Boomerang (`210` Corn)
6. **Silkie Frost-Hen** — Crowd Slow & Chill (`220` Corn)
7. **Plague Pullet** — Corrosive Acid Pool (`260` Corn)
8. **Ranger Rooster** — Long-Range Fox Sniper (`275` Corn)
9. **Prickly Cactus-Hen** — Multi-Thorn Volley (`305` Corn)
10. **Orpington Lobber** — Explosive Egg Mortar (`325` Corn)
11. **Arcane Wyandotte** — Chain-Lightning Mage (`350` Corn)
12. **Roost Beacon** — *Support Watchtower* (`380` Corn)
13. **Shinobi Chick** — Camo Shuriken Master (`390` Corn)
14. **Buccaneer Broiler** — Heavy Siege Mortar (`430` Corn)
15. **Mariachi Rooster** — 360-Degree Sonic Shockwave (`490` Corn)
16. **Espresso Brew-Hen** — *Support Roast Barista* (`640` Corn)
17. **Sun Chantecler** — Solar Flare Rooster (`780` Corn)
18. **Cyber-Cluck 9000** — Piercing Laser Railgun (`950` Corn)

### Gem Egg Exclusive Roster (Earned from Gem Eggs — Units 19–56)
19. **Iron-Spur Brawler** — Knockback Gauntlet Fighter (`1,150` Corn)
20. **Ramen Chef-Hen** — *Support Broth Chef* (`1,380` Corn)
21. **Granite Bastion-Hen** — 360-Degree Tremor Wall (`1,620` Corn)
22. **Tesla Cochin** — Chain-Arc Storm Coil (`1,900` Corn)
23. **Six-Beak Desperado** — Fan-the-Hammer Crit (`2,350` Corn)
24. **Rift Surge-Priestess** — Sky-Pillar Surge Caster (`2,800` Corn)
25. **Berserker Jarl-Hen** — Returning Frost-Axe (`3,350` Corn)
26. **Chrono Leghorn** — Time-Warp Disruptor (`3,800` Corn)
27. **Overclock Engie-Hen** — *Support Speed Tuner* (`4,400` Corn)
28. **Hacker Nerd-Hen** — Orbital Beam Sniper (`5,200` Corn)
29. **Miasma Doctor-Hen** — Blight Pool Alchemist (`6,500` Corn)
30. **Aegis Mecha RX-9** — Heavy Ion Buster (`7,600` Corn)
31. **Pharaoh Cluck-Ra** — Solar Obelisk Beam (`9,300` Corn)
32. **Musashi Blade-Hen** — Savage Crit Ronin (`10,800` Corn)
33. **Bass-Drop DJ Hen** — 360-Degree Sub-Bass Pulse (`13,200` Corn)
34. **Star Crusader** — Summoned Spirit Brawler (`15,000` Corn)
35. **Aegis Paladin-Hen** — *Support Holy Templar* (`18,500` Corn)
36. **Necro-Cluck Lich** — Soul-Flame Summoner (`21,500` Corn)
37. **Crimson Oni-Rooster** — Kanabo Slam Demon (`26,000` Corn)
38. **Valkyrie Brahma** — Celestial Spear Storm (`30,500` Corn)
39. **Shrine Idol-Hen** — *Support Crit & Shot Idol* (`36,000` Corn)
40. **Crimson Tengu-Hen** — Dash-Slash Fox Assassin (`44,000` Corn)
41. **Starweaver Hen** — Falling Star Comet (`53,000` Corn)
42. **Star-Cluck Armada** — Orbital Antimatter Drop (`63,000` Corn)
43. **Abyssal Kraken-Hen** — Tidal Whirlpool Titan (`76,000` Corn)
44. **Abyssal Wyrm-Rooster** — Draconic Plasma Nuker (`94,000` Corn)
45. **Quasar Serama** — 360-Degree Supernova Pulse (`120,000` Corn)
46. **Seraphim Cluck-el** — 6-Winged Halo Spear (`150,000` Corn)
47. **Empress Chronos** — Time-Freeze Goddess (`190,000` Corn)
48. **Omnicluck Prime** — Genesis Ray Sovereign (`250,000` Corn)
49. **Apex Kaiju-Cluck Zero** — Atomic Beam Titan (`320,000` Corn)
50. **Gaia Mother-Hen** — Prismatic World-Tree (`430,000` Corn)
51. **Singularity Hen** — Black-Hole Vortex (`660,000` Corn)
52. **Malevolent Chicken** — Dismantle Shockwaves & T7 MAX 10s Giant Malevolent Shrine (`820,000` Corn)
53. **Limitless Chicken** — Fixed-Range Heavy Punches & T7 MAX 80%-Slow Infinity (`820,000` Corn)
54. **Golden Roost-Deity** — Heavenly Pillar Deity (`1,000,000` Corn)
55. **Helios Sun-Emperor** — Solar Meteor Sovereign (`1,450,000` Corn)
56. **Astral Genesis-Wyrm** — Crossing Rift Architect (`2,150,000` Corn)

### Completionist Pinnacle Unit (Unlocked Only by Owning All 56 Other Chickens)
57. **The Complete Cluck** — Boomerang Blade Storm (`3,000,000` Corn! Preset **Mastered** `+150% DMG, +200% Range` <-> **Aether** `+300% DMG, +0% Extra Range`!)

## Controls

| Input | Action |
| :--- | :--- |
| **Pointer Click on Henhouse** | Harvest Corn during active waves (strictly capped at `12 CPS`) |
| **Click Chicken Card in Troops Tab** | Select any unlocked Chicken Troop to deploy on the map |
| `Tab` / **Cluck Cannon Button** | Fire equipped Cluck Cannon when 100% charged |
| **`SHOP` (Main Menu)** | Open Gem Eggs & select your Cluck Cannon loadout before starting a game |
| **Click Placed Chicken** | Open Inspector to Upgrade (`Tier 1–7`), change Targeting, or Sell |
| `Space` | Start Next Wave (or Skip Gem Egg Cutscene) |
| `Esc` / Right-Click | Cancel placement or close inspector / shop |

## Run Locally

```bash
npm install
npm run dev
```

Build production bundle:

```bash
npm run build
```
