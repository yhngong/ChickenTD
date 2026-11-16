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
  | 'ninja'
  | 'pirate'
  | 'bard'
  | 'phoenix'
  | 'mecha';

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
  | 'plasma';

export type EnemyTypeId =
  | 'ant'
  | 'aphid'
  | 'ladybug'
  | 'hornet'
  | 'camo_moth'
  | 'beetle'
  | 'mantis'
  | 'fox_scout'
  | 'fox_timber'
  | 'fox_kitsune'
  | 'fox_alpha';

export type TargetMode = 'first' | 'strong' | 'last' | 'close';

export type ClickerUpgradeId = 'beakPower' | 'goldenLuck' | 'peckRhythm' | 'harvestBasket';

export type TdUpgradeId = 'eagleRoost' | 'caffeinatedFeed' | 'razorTalons' | 'fortifiedNest';

export type PixelIconId =
  | 'chicken'
  | 'corn'
  | 'egg'
  | 'fox'
  | 'bug'
  | 'shield'
  | 'trophy'
  | 'cracked_egg'
  | 'beak_upg'
  | 'sparkle_upg'
  | 'flame_upg'
  | 'basket_upg'
  | 'bolt_upg'
  | 'scope_upg'
  | 'talon_upg'
  | 'nest_upg'
  | 'speed'
  | 'sound_on'
  | 'sound_off'
  | 'rules';

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
  description: string;
}

export interface ChickenTowerDef {
  id: ChickenTypeId;
  name: string;
  role: string;
  hotkey: string;
  baseCost: number;
  featherColor: string;
  bellyColor: string;
  accentColor: string;
  projectileStyle: ProjectileStyle;
  tiers: readonly [ChickenTierStats, ChickenTierStats, ChickenTierStats, ChickenTierStats];
}

export interface EnemySpawnChild {
  type: EnemyTypeId;
  count: number;
}

export interface EnemyDef {
  id: EnemyTypeId;
  name: string;
  isFoxBoss: boolean; // true = MOAB-class Fox Boss!
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

export interface ActiveEnemy {
  id: number;
  typeId: EnemyTypeId;
  hp: number;
  maxHp: number;
  distance: number; // distance along path
  lateralOffset: number; // slight visual jitter for swarms
  slowFactor: number;
  slowTimer: number;
  burnDps: number;
  burnTimer: number;
  hitFlash: number;
  walkPhase: number;
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
  armorPiercing: boolean;
  hitEnemyIds: Set<number>;
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
  currentCps: number;
}
