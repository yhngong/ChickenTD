export type ChickenTypeId =
  | 'bantam'
  | 'pecker'
  | 'honey'
  | 'boomerang'
  | 'chilly'
  | 'alchemist'
  | 'ranger'
  | 'lobber'
  | 'wizard'
  | 'roost_beacon'
  | 'ninja'
  | 'pirate'
  | 'bard'
  | 'brew_hen'
  | 'phoenix'
  | 'mecha'
  // === 22 GEM EGG EXCLUSIVE UNITS AFTER CYBER-CLUCK 9000 ('mecha') ===
  | 'macho_cat'
  | 'eraser_tank'
  | 'tesla'
  | 'kasli_oracle'
  | 'chrono'
  | 'overclock_engie'
  | 'cyber_sniper'
  | 'gundam'
  | 'samurai_shogun'
  | 'stand_hen'
  | 'necro_lich'
  | 'valkyrie'
  | 'idol_diva'
  | 'yukimura_shadow'
  | 'star_dread'
  | 'bahamut_wyrm'
  | 'quasar'
  | 'chronos_empress'
  | 'omega_god'
  | 'gaia_creator'
  | 'void_singularity'
  | 'cat_god_supreme'
  // === COMPLETIONIST ZENITH PINNACLE UNIT (UNLOCKED BY OWNING ALL 38 OTHERS) ===
  | 'complete_cluck';

export type ProjectileStyle =
  | 'feather_slash'
  | 'seed'
  | 'honey'
  | 'boomerang'
  | 'snow'
  | 'acid'
  | 'sniper'
  | 'egg_bomb'
  | 'lightning'
  | 'shuriken'
  | 'cannonball'
  | 'sonic'
  | 'solar'
  | 'plasma'
  | 'cat_paw'
  | 'tremor_slam'
  | 'tesla_arc'
  | 'surge_pillar'
  | 'chrono_orb'
  | 'matrix_beam'
  | 'ion_lance'
  | 'moon_slash'
  | 'stand_fist'
  | 'soul_wisp'
  | 'valkyrie_spear'
  | 'shadow_talon'
  | 'antimatter'
  | 'bahamut_orb'
  | 'quasar_pulse'
  | 'judgment_ray'
  | 'genesis_beam'
  | 'nature_prism'
  | 'black_hole'
  | 'god_wrath'
  | 'beacon_flare'
  | 'espresso_splash'
  | 'overclock_bolt'
  | 'idol_note'
  | 'zenith_blade';

export type MutationTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mastered' | 'aether';

export interface MutationDef {
  id: MutationTier;
  name: string;
  subtitle: string;
  chance: number; // 0..1 probability when rolling a mutation
  color: string;
  borderColor: string;
  bgTint: string;
  damageMult: number;
  fireRateMult: number;
  rangeMult: number;
  bonusPierce: number;
  bonusProjectiles: number;
  foxMult: number;
  costMult: number; // < 1 means discount
  grantsCamo: boolean;
  bonusCritChance: number;
  bonusKnockback: number;
  summary: string;
}

export type EnemyTypeId =
  | 'ant'
  | 'aphid'
  | 'ladybug'
  | 'hornet'
  | 'camo_moth'
  | 'beetle'
  | 'mantis'
  | 'firefly_wisp'
  | 'scorpion'
  | 'void_scarab'
  | 'fox_scout'
  | 'fox_timber'
  | 'fox_phantom'
  | 'fox_kitsune'
  | 'fox_frost'
  | 'fox_alpha'
  | 'fox_mecha'
  | 'fox_phoenix'
  | 'fox_cosmic';

export type DifficultyId = 'easy' | 'normal' | 'hard' | 'nightmare' | 'true_fox_hunt';

export type MapId =
  | 'sunny_meadow'
  | 'frostbite_fjord'
  | 'ember_caldera'
  | 'whispering_bog'
  | 'starlight_sanctum';

export interface DifficultyDef {
  id: DifficultyId;
  name: string;
  badge: string;
  startingCorn: number;
  startingEggs: number;
  costMult: number;
  enemyHpMult: number;
  enemyCountMult: number;
  enemySpeedMult: number;
  accentColor: string;
  description: string;
}

export type TargetMode = 'first' | 'strong' | 'last' | 'close';

export type ClickerUpgradeId =
  | 'beakPower'
  | 'farmhandChicks'
  | 'goldenLuck'
  | 'peckRhythm'
  | 'harvestBasket'
  | 'twinBeak'
  | 'roostForeman'
  | 'cornSilo'
  | 'cornucopia';

export type TdUpgradeId = 'eagleRoost' | 'caffeinatedFeed' | 'razorTalons' | 'fortifiedNest';

export type CannonTypeId =
  | 'shockwave'
  | 'time_stop'
  | 'damage_boost'
  | 'orbital_nova'
  | 'cornstorm';

export interface CannonDef {
  id: CannonTypeId;
  name: string;
  shortLabel: string;
  iconId: PixelIconId;
  gemEggCost: number;
  chargeSec: number;
  accentColor: string;
  badgeText: string;
  description: string;
}

export type PixelIconId =
  | 'chicken'
  | 'corn'
  | 'egg'
  | 'battle_egg'
  | 'gem_egg'
  | 'cannon'
  | 'cannon_timestop'
  | 'cannon_dmgboost'
  | 'cannon_nova'
  | 'cannon_cornstorm'
  | 'mutation_star'
  | 'lock'
  | 'skull_defeat'
  | 'fox'
  | 'bug'
  | 'shield'
  | 'trophy'
  | 'cracked_egg'
  | 'beak_upg'
  | 'farmhand_upg'
  | 'sparkle_upg'
  | 'flame_upg'
  | 'basket_upg'
  | 'twin_beak_upg'
  | 'foreman_upg'
  | 'silo_upg'
  | 'cornucopia_upg'
  | 'bolt_upg'
  | 'scope_upg'
  | 'talon_upg'
  | 'nest_upg'
  | 'speed'
  | 'sound_on'
  | 'sound_off'
  | 'rules'
  | 'menu'
  | 'idle_chick'
  | 'download_app';

export interface SupportAuraSpec {
  damageBonus: number; // e.g. 0.25 = +25% ally damage
  fireRateBonus: number; // e.g. 0.20 = +20% ally attack speed
  rangeBonus: number; // e.g. 0.15 = +15% ally range
  bonusPierce: number; // flat extra pierce to nearby allies
  bonusProjectiles: number; // extra multishot to nearby allies
  foxDamageBonus: number; // e.g. 0.25 = +25% bonus vs Giant Foxes
  grantsCamo: boolean; // Grants Camo Sight to nearby allies
  grantsArmorPierce: boolean; // Grants Armor-Piercing to nearby allies
  bonusCritChance: number; // extra Savage Blow crit chance
  bonusKnockback: number; // extra path knockback
}

export interface ChickenTierStats {
  tierName: string;
  upgradeCost: number; // 0 for Tier 1 (base purchase)
  damage: number;
  fireRate: number; // attacks per second
  range: number; // logical pixels (out of 920x600)
  pierce: number; // max enemies hit per projectile / pulse
  projectiles: number; // multishot count
  projectileSpeed: number;
  splashRadius: number; // 0 if single-target/pierce
  slowFactor: number; // 0..0.68 speed reduction
  slowDuration: number; // seconds
  burnDps: number; // burn / acid / sap DoT damage per sec
  foxDamageMult: number; // bonus multiplier vs Giant Fox bosses
  camoSight: boolean;
  knockback?: number; // Battle Cats style path knockback distance
  savageCritChance?: number; // Battle Cats Savage Blow (3x damage) probability
  supportAura?: SupportAuraSpec; // Nearby-tower support aura buff
  description: string;
}

export interface ChickenTowerDef {
  id: ChickenTypeId;
  name: string;
  role: string;
  baseCost: number;
  featherColor: string;
  bellyColor: string;
  accentColor: string;
  projectileStyle: ProjectileStyle;
  isSupport?: boolean;
  tiers: readonly [ChickenTierStats, ChickenTierStats, ChickenTierStats, ChickenTierStats];
}

export interface EnemySpawnChild {
  type: EnemyTypeId;
  count: number;
}

export interface EnemyDef {
  id: EnemyTypeId;
  name: string;
  isFoxBoss: boolean; // true = Giant Fox Boss
  isArmored: boolean; // resists basic sharp pecks unless armor-piercing/splash/magic/energy
  isCamo: boolean; // requires Camo Sight
  maxHp: number;
  speed: number; // logical path pixels per second
  radius: number;
  eggDamage: number; // Nest Eggs lost if this enemy reaches the Nest
  bodyColor: string;
  secondaryColor: string;
  childrenOnPop: readonly EnemySpawnChild[];
}

export interface PlacedChicken {
  id: number;
  typeId: ChickenTypeId;
  x: number;
  y: number;
  tier: 0 | 1 | 2 | 3; // 0 = Lv1, 3 = Lv4 MAX
  targetMode: TargetMode;
  angle: number;
  cooldown: number;
  recoil: number; // 0..1 pixel attack animation timer
  totalPopDamage: number;
  totalSpent: number;
}

export interface ActiveStand {
  ownerTowerId: number;
  x: number;
  y: number;
  angle: number;
  targetEnemyId: number | null;
  punchAnim: number; // 0..1 rapid alternating fist flurry animation
  punchCount: number;
  state: 'hover' | 'charging' | 'punching';
}

export interface ActiveEnemy {
  id: number;
  typeId: EnemyTypeId;
  hp: number;
  maxHp: number;
  distance: number; // distance along path
  lateralOffset: number; // slight visual jitter for swarms
  slowFactor: number;
  slowTimer: number;
  freezeTimer: number; // >0 = frozen solid at 0 speed (Time-Stop Cannon)
  vulnTimer: number; // >0 = shattered armor & takes +35% bonus damage (Orbital Nova Cannon)
  burnDps: number;
  burnTimer: number;
  kbCooldown: number; // prevents infinite perma-knockback lock
  hitFlash: number;
  walkPhase: number;
  // Runtime cached world coordinates & liveness (avoids millions of per-frame path recomputations)
  x?: number;
  y?: number;
  angle?: number;
  alive?: boolean;
  gridIdx?: number;
}

export interface ActiveProjectile {
  id: number;
  ownerTowerId: number;
  style: ProjectileStyle;
  x: number;
  y: number;
  vx: number;
  vy: number;
  curveRate: number; // radians/sec for curving boomerangs
  rotation: number;
  damage: number;
  pierceLeft: number;
  splashRadius: number;
  slowFactor: number;
  slowDuration: number;
  burnDps: number;
  foxDamageMult: number;
  knockback: number;
  savageCritChance: number;
  armorPiercing: boolean;
  canHitCamo: boolean;
  hitEnemyIds: Set<number> | null;
  age: number;
  maxLifetime: number;
  color: string;
}

export interface VisualRingEffect {
  x: number;
  y: number;
  maxRadius: number;
  color: string;
  age: number;
  lifetime: number;
}

export interface PixelParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  age: number;
  lifetime: number;
}

export interface FloatingMapPopup {
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  scale: number;
  age: number;
  lifetime: number;
}

export interface WaveSpawnGroup {
  enemyType: EnemyTypeId;
  count: number;
  intervalSec: number;
  startDelaySec: number;
}

export interface WaveDefinition {
  waveNumber: number;
  title: string;
  callout: string;
  groups: WaveSpawnGroup[];
}

export interface UpgradeDef<TId extends string> {
  id: TId;
  name: string;
  iconId: PixelIconId;
  maxLevel: number;
  baseCost: number;
  costMult: number;
  getEffectLabel: (level: number) => string;
  description: string;
}

export interface ClickResult {
  accepted: boolean;
  reason?: 'between_waves' | 'cps_cap' | 'gameover';
  amountEarned: number;
  isCrit: boolean;
  isMegaCob: boolean;
  isTwinPeck?: boolean;
  isAuto?: boolean;
  currentCps: number;
}

export interface PlayerSaveData {
  version: number;
  eggs: number;
  totalEggsEarned: number;
  lifetimeBugsKilled: number;
  bugKillRemainder: number; // 0..999 carry-over progress toward next Egg
  gemEggsOpened: number;
  unlockedUnits: Partial<Record<ChickenTypeId, boolean>>;
  unitMutations: Partial<Record<ChickenTypeId, MutationTier>>;
  unitPlusLevels: Partial<Record<ChickenTypeId, number>>;
  unlockedCannons: Partial<Record<CannonTypeId, boolean>>;
  equippedCannon: CannonTypeId;
  redeemedCodes?: Partial<Record<string, boolean>>;
}

export interface EggBankResult {
  bugsAdded: number;
  eggsEarned: number;
  previousRemainder: number;
  newRemainder: number;
  totalSavedEggs: number;
}

export interface EggRollOutcome {
  unitId: ChickenTypeId;
  isNewUnit: boolean;
  rolledMutation: MutationTier | null; // non-null whenever unit was already owned
  activeMutation: MutationTier | null; // resulting highest mutation on the unit
  mutationUpgraded: boolean; // true if rolledMutation improved the unit's mutation tier
  plusLevel: number; // Battle Cats style +1, +2, ...
}

export interface RoundEndSummary {
  mapId: MapId;
  difficultyId: DifficultyId;
  waveReached: number;
  freeplay: boolean;
  totalBugsKilledThisRun: number;
  totalCornHarvested: number;
  towersDeployed: number;
  eggsEarnedThisRun: number;
  newBugRemainder: number;
  totalSavedEggs: number;
  killerEnemyId: EnemyTypeId | null;
  bossName: string | null;
  bossHpPercentRemaining: number | null; // Battle Cats style "BOSS HP REMAINING: 42%"
  waveProgressPercent: number;
  mvpUnitId: ChickenTypeId | null;
  mvpDamage: number;
}

export interface SavedRunState {
  version: number;
  savedAtMs: number;
  inMainMenu: boolean;
  mapId: MapId;
  difficultyId: DifficultyId;
  corn: number;
  totalCornClicked: number;
  eggs: number;
  maxEggs: number;
  waveNumber: number;
  waveActive: boolean;
  waveElapsedSec: number;
  waveInitialSpawnCount: number;
  status: 'playing' | 'victory_prompt';
  freeplayUnlocked: boolean;
  speedMultiplier: 1 | 2;
  totalBugsPopped: number;
  bugsBankedThisRun: number;
  eggsEarnedThisRun: number;
  lastVictoryEggsEarned: number;
  totalClicksAccepted: number;
  waveClickCounter: number;
  waveCornHarvested: number;
  equippedCannon?: CannonTypeId;
  cannonCharge: number;
  cannonDamageBoostTimer?: number;
  cannonCornBoostTimer?: number;
  cannonTimeStopVisualTimer?: number;
  frenzyMeter: number;
  clickerLevels: Record<ClickerUpgradeId, number>;
  tdLevels: Record<TdUpgradeId, number>;
  towers: PlacedChicken[];
  enemies: ActiveEnemy[];
  pendingSpawns: { spawnAtWaveTime: number; enemyType: EnemyTypeId }[];
}

export interface UserPreferences {
  pendingMapId: MapId;
  pendingDifficultyId: DifficultyId;
  isMuted: boolean;
  inIdleMode?: boolean;
  lastIdleSyncMs?: number;
}
