import { ChickenAudioEngine } from './audio';
import {
  CAMPAIGN_WAVES,
  CANNON_DEFS,
  CHICKEN_DEFS,
  CLICKER_UPGRADES,
  DIFFICULTY_DEFS,
  ENEMY_DEFS,
  getBaseCornPerClick,
  getCornSiloDividendRate,
  getCornucopiaWaveMult,
  getCritParams,
  getFarmhandAutoRate,
  getForemanMult,
  getHarvestBasketMult,
  getMaxRhythmMult,
  getTwinBeakChance,
  getUpgradeCost,
  getWaveDefinition,
  getWaveHpScale,
  getWaveSpeedScale,
  MAX_CPS_CAP,
  STARTING_CORN,
  STARTING_EGGS,
  TD_UPGRADES,
} from './data';
import {
  canPlaceChickenAt,
  getPointAlongPath,
  getTotalPathLength,
  setActiveMap,
  syncEnemyPathPosition,
} from './map';
import { BUGS_PER_EGG, MUTATION_DEFS, PROGRESSION } from './progression';
import {
  ActiveEnemy,
  ActiveHazardZone,
  ActiveProjectile,
  ActiveStand,
  CannonDef,
  CannonTypeId,
  ChickenTierStats,
  ChickenTypeId,
  ClickResult,
  ClickerUpgradeId,
  DifficultyDef,
  DifficultyId,
  EggBankResult,
  EnemyTypeId,
  FloatingMapPopup,
  HazardZoneStyle,
  MapId,
  MutationTier,
  PixelParticle,
  PlacedChicken,
  RoundEndSummary,
  SavedRunState,
  SupportAuraSpec,
  TargetMode,
  TdUpgradeId,
  UpgradeDef,
  VisualBeamEffect,
  VisualRingEffect,
} from './types';

interface PendingSpawn {
  spawnAtWaveTime: number;
  enemyType: EnemyTypeId;
}

export interface EffectiveChickenStats extends ChickenTierStats {
  effectiveDamage: number;
  effectiveBurnDps: number;
  effectiveRange: number;
  effectiveFireRate: number;
  effectivePierce: number;
  effectiveProjectiles: number;
  effectiveFoxMult: number;
  effectiveCamo: boolean;
  effectiveArmorPierce: boolean;
  effectiveKnockback: number;
  effectiveCritChance: number;
  mutationTier: MutationTier | null;
  plusLevel: number;
  supportBuffCount: number;
}

export const CLUCK_CANNON_CHARGE_SEC = 22;
export const SANDBOX_INF_CORN = 999_999_999_999;
export const MAX_SANDBOX_ENEMIES = 600;

const SPATIAL_COLS = 16;
const SPATIAL_ROWS = 11;
const SPATIAL_CELL_SHIFT = 6; // 64x64 logical pixel cells covering 920x600 map
const MAX_ACTIVE_PROJECTILES = 420;
const MAX_ACTIVE_BEAMS = 36;
const MAX_ACTIVE_ZONES = 28;
const MAX_ACTIVE_RINGS = 24;
const MAX_ACTIVE_PARTICLES = 110;
const MAX_ACTIVE_POPUPS = 24;

const BASIC_PECK_SET = new Set<ChickenTypeId>([
  'bantam',
  'pecker',
  'sling_chick',
  'honey',
  'boomerang',
  'chilly',
  'cactus_hen',
  'ninja',
]);

const STRONG_DEFAULT_SET = new Set<ChickenTypeId>([
  'ranger',
  'pirate',
  'mecha',
  'cowboy_desperado',
  'cyber_sniper',
  'aegis_mech',
  'pharaoh_ra',
  'samurai_shogun',
  'stand_hen',
  'oni_warlord',
  'tengu_shadow',
  'star_dread',
  'leviathan_kraken',
  'abyss_wyrm',
  'archangel_seraph',
  'chronos_empress',
  'omega_god',
  'mech_zilla',
  'gaia_creator',
  'void_singularity',
  'golden_deity',
  'solar_emperor',
  'eternity_weaver',
  'complete_cluck',
]);

export class ChickenTdEngine {
  public audio = new ChickenAudioEngine();

  public mapId: MapId = 'sunny_meadow';
  public difficultyId: DifficultyId = 'normal';

  public corn = STARTING_CORN;
  public totalCornClicked = 0;
  public eggs = STARTING_EGGS;
  public maxEggs = STARTING_EGGS;

  public waveNumber = 1;
  public waveActive = false;
  public waveElapsedSec = 0;
  public waveInitialSpawnCount = 1;
  public status: 'playing' | 'victory_prompt' | 'gameover' = 'playing';
  public freeplayUnlocked = false;
  public speedMultiplier: 1 | 2 = 1;

  public totalBugsPopped = 0;
  public bugsBankedThisRun = 0;
  public eggsEarnedThisRun = 0;
  public lastVictoryEggsEarned = 0;
  public lastDefeatSummary: RoundEndSummary | null = null;

  public totalClicksAccepted = 0;
  public waveClickCounter = 0; // counts toward 12-Peck Mega Cob
  public waveCornHarvested = 0; // tracks Corn harvested in the active wave for Golden Corn Silo

  // Rechargeable Cluck Cannon (locked per run — not interchangeable mid-game!)
  public equippedCannon: CannonTypeId = 'shockwave';
  public cannonCharge = 0.5;
  public cannonFlash = 0;
  public cannonDamageBoostTimer = 0;
  public cannonCornBoostTimer = 0;
  public cannonTimeStopVisualTimer = 0;

  // Strict 12 CPS sliding 1,000ms window (wall-clock milliseconds)
  private clickTimestampsMs: number[] = [];
  private autoPeckAccumulator = 0;
  public frenzyMeter = 0; // 0..1 built by active clicking & Farmhands during waves
  public capHitFlash = 0; // 0..1 visual indicator when clicking > 12 CPS

  public clickerLevels: Record<ClickerUpgradeId, number> = {
    beakPower: 0,
    farmhandChicks: 0,
    goldenLuck: 0,
    peckRhythm: 0,
    harvestBasket: 0,
    twinBeak: 0,
    roostForeman: 0,
    cornSilo: 0,
    cornucopia: 0,
  };

  public tdLevels: Record<TdUpgradeId, number> = {
    caffeinatedFeed: 0,
    eagleRoost: 0,
    razorTalons: 0,
    fortifiedNest: 0,
  };

  public towers: PlacedChicken[] = [];
  public stands: ActiveStand[] = [];
  public enemies: ActiveEnemy[] = [];
  public projectiles: ActiveProjectile[] = [];
  public beams: VisualBeamEffect[] = [];
  public hazardZones: ActiveHazardZone[] = [];
  public rings: VisualRingEffect[] = [];
  public particles: PixelParticle[] = [];
  public popups: FloatingMapPopup[] = [];

  private pendingSpawns: PendingSpawn[] = [];
  private pendingSpawnIdx = 0;
  private nextEntityId = 1;

  // O(1) lookup & stat caches + zero-allocation 16x11 spatial grid for projectiles/splashes
  private towerById = new Map<number, PlacedChicken>();
  private statsCache = new Map<number, EffectiveChickenStats>();
  private statsCacheBoostActive = false;
  private spatialBuckets: number[][] = Array.from(
    { length: SPATIAL_COLS * SPATIAL_ROWS },
    () => []
  );
  private inProjectilePhase = false;
  private queryStampCounter = 1;
  private enemyStampById = new Map<number, number>();

  public onUiChange: (() => void) | null = null;
  public onCornChange: (() => void) | null = null;
  public onAutoPeck: ((res: ClickResult) => void) | null = null;

  public invalidateStatsCache(): void {
    this.statsCache.clear();
  }

  public getTowerById(id: number): PlacedChicken | undefined {
    return this.towerById.get(id);
  }

  private getSpatialCell(x: number, y: number): number {
    const col = Math.max(0, Math.min(SPATIAL_COLS - 1, (x | 0) >> SPATIAL_CELL_SHIFT));
    const row = Math.max(0, Math.min(SPATIAL_ROWS - 1, (y | 0) >> SPATIAL_CELL_SHIFT));
    return row * SPATIAL_COLS + col;
  }

  private rebuildSpatialGrid(): void {
    const buckets = this.spatialBuckets;
    for (let i = 0; i < buckets.length; i++) {
      buckets[i].length = 0;
    }
    const arr = this.enemies;
    for (let i = 0; i < arr.length; i++) {
      const e = arr[i];
      if (e.alive === false) continue;
      e.gridIdx = i;
      if (e.x === undefined || e.y === undefined) {
        syncEnemyPathPosition(e);
      }
      buckets[this.getSpatialCell(e.x!, e.y!)].push(i);
    }
  }

  private compactAliveEnemies(): void {
    const arr = this.enemies;
    let write = 0;
    for (let i = 0; i < arr.length; i++) {
      const e = arr[i];
      if (e.alive !== false) {
        arr[write++] = e;
      } else {
        this.enemyStampById.delete(e.id);
      }
    }
    arr.length = write;
  }

  public getDifficulty(): DifficultyDef {
    return DIFFICULTY_DEFS[this.difficultyId];
  }

  public isSandboxMode(): boolean {
    return this.difficultyId === 'sandbox';
  }

  public getEnemyScaledHp(typeId: EnemyTypeId): number {
    const def = ENEMY_DEFS[typeId];
    const hpScale = getWaveHpScale(this.waveNumber) * this.getDifficulty().enemyHpMult;
    return Math.max(1, Math.round(def.maxHp * hpScale));
  }

  public getEquippedCannonId(): CannonTypeId {
    return this.equippedCannon;
  }

  public getEquippedCannonDef(): CannonDef {
    return CANNON_DEFS[this.equippedCannon];
  }

  public isChickenUnlocked(typeId: ChickenTypeId): boolean {
    return PROGRESSION.isUnlocked(typeId);
  }

  public getTowerBaseCost(typeId: ChickenTypeId): number {
    const mut = PROGRESSION.getMutation(typeId);
    const mutCostMult = mut ? MUTATION_DEFS[mut].costMult : 1.0;
    return Math.max(
      10,
      Math.round(CHICKEN_DEFS[typeId].baseCost * this.getDifficulty().costMult * mutCostMult)
    );
  }

  public getTowerUpgradeCost(typeId: ChickenTypeId, tierIdx: 1 | 2 | 3): number {
    const mut = PROGRESSION.getMutation(typeId);
    const mutCostMult = mut ? MUTATION_DEFS[mut].costMult : 1.0;
    return Math.max(
      10,
      Math.round(
        CHICKEN_DEFS[typeId].tiers[tierIdx].upgradeCost *
          this.getDifficulty().costMult *
          mutCostMult
      )
    );
  }

  public getScaledUpgradeCost<T extends string>(def: UpgradeDef<T>, currentLevel: number): number {
    return Math.round(getUpgradeCost(def, currentLevel) * this.getDifficulty().costMult);
  }

  /**
   * Saves any unbanked bug kills from the current round into persistent Eggs storage!
   * In Sandbox Mode, kills NEVER count towards Gem Eggs or lifetime kill progress.
   */
  public bankPendingRunBugs(): EggBankResult {
    if (this.isSandboxMode()) {
      this.bugsBankedThisRun = this.totalBugsPopped;
      return {
        bugsAdded: 0,
        eggsEarned: 0,
        previousRemainder: PROGRESSION.getBugKillRemainder(),
        newRemainder: PROGRESSION.getBugKillRemainder(),
        totalSavedEggs: PROGRESSION.getEggs(),
      };
    }
    const delta = Math.max(0, this.totalBugsPopped - this.bugsBankedThisRun);
    this.bugsBankedThisRun = this.totalBugsPopped;
    const res = PROGRESSION.bankBugsAfterRound(delta);
    this.eggsEarnedThisRun += res.eggsEarned;
    return res;
  }

  /**
   * Sandbox Mode Only: Summon any Bug or Giant Fox Boss directly at the entrance!
   */
  public summonSandboxEnemy(typeId: EnemyTypeId, count = 1): number {
    if (!this.isSandboxMode() || this.status === 'gameover') return 0;
    if (!(typeId in ENEMY_DEFS)) return 0;
    const req = Math.max(1, Math.floor(count));
    const room = Math.max(0, MAX_SANDBOX_ENEMIES - this.enemies.length);
    const toSpawn = Math.min(req, room);
    const entPt = getPointAlongPath(0);
    if (toSpawn <= 0) {
      this.spawnMapPopup('MAX ACTIVE!', entPt.x, entPt.y - 22, '#F43F5E', 1.0);
      this.audio.playBlockedClick();
      return 0;
    }

    for (let i = 0; i < toSpawn; i++) {
      this.spawnEnemy(typeId, Math.min(96, i * 3.5));
    }

    const def = ENEMY_DEFS[typeId];
    const col = def.isFoxBoss ? '#FACC15' : '#22D3EE';
    this.spawnRing(entPt.x, entPt.y, def.isFoxBoss ? 52 : 36, col);
    this.spawnPixelBurst(entPt.x, entPt.y, def.isFoxBoss ? 12 : 6, col);
    this.spawnMapPopup(
      toSpawn > 1 ? `+${toSpawn} ${def.name.toUpperCase()}` : `${def.name.toUpperCase()}!`,
      entPt.x + 26,
      entPt.y - 20,
      col,
      def.isFoxBoss ? 1.12 : 1.0
    );
    this.audio.playPlaceChicken();
    this.notifyUi();
    return toSpawn;
  }

  /**
   * Sandbox Mode Only: Instantly clear all active enemies, queued spawns, & projectiles.
   */
  public clearSandboxEnemies(): number {
    if (!this.isSandboxMode()) return 0;
    const cleared =
      this.enemies.length + Math.max(0, this.pendingSpawns.length - this.pendingSpawnIdx);
    this.enemies = [];
    this.enemyStampById.clear();
    this.pendingSpawns = [];
    this.pendingSpawnIdx = 0;
    this.waveActive = false;
    this.projectiles = [];
    this.beams = [];
    this.hazardZones = [];
    const nestPt = getPointAlongPath(getTotalPathLength() * 0.5);
    this.spawnRing(nestPt.x, nestPt.y, 80, '#22D3EE');
    this.spawnMapPopup('ENEMIES CLEARED!', nestPt.x, nestPt.y - 20, '#22D3EE', 1.15);
    this.audio.playUpgrade();
    this.notifyUi();
    return cleared;
  }

  /**
   * Sandbox Mode Only: Set current Wave # (1..999) to test enemy HP/speed scaling at any stage!
   */
  public setSandboxWaveNumber(waveNum: number): number {
    if (!this.isSandboxMode()) return this.waveNumber;
    this.waveNumber = Math.max(1, Math.min(999, Math.floor(waveNum)));
    this.freeplayUnlocked = this.waveNumber > CAMPAIGN_WAVES;
    this.audio.playUpgrade();
    this.notifyUi();
    return this.waveNumber;
  }

  /**
   * Sandbox Mode Only: Instantly recharge the equipped Cluck Cannon to 100%.
   */
  public instantChargeSandboxCannon(): boolean {
    if (!this.isSandboxMode()) return false;
    this.cannonCharge = 1.0;
    this.audio.playUpgrade();
    this.notifyUi();
    return true;
  }

  /**
   * Voluntarily ends the current active run, triggering the Defeat/Round-End report & saving Eggs!
   */
  public endRunEarly(): void {
    if (this.status === 'gameover') return;
    this.eggs = 0;
    this.waveActive = false;
    this.status = 'gameover';
    const topEnemy = this.enemies[0]?.typeId ?? 'ant';
    this.lastDefeatSummary = this.buildDefeatSummary(topEnemy);
    this.audio.playDefeatJingle();
    this.notifyUi();
  }

  public startNewRun(mapId: MapId, difficultyId: DifficultyId): void {
    if (this.totalBugsPopped > this.bugsBankedThisRun) {
      this.bankPendingRunBugs();
    }
    this.mapId = mapId;
    this.difficultyId = difficultyId;
    setActiveMap(mapId);
    this.resetGame();
  }

  public serializeRun(inMainMenu: boolean): SavedRunState | null {
    if (this.status === 'gameover') return null;
    return {
      version: 1,
      savedAtMs: Date.now(),
      inMainMenu,
      mapId: this.mapId,
      difficultyId: this.difficultyId,
      corn: this.corn,
      totalCornClicked: this.totalCornClicked,
      eggs: this.eggs,
      maxEggs: this.maxEggs,
      waveNumber: this.waveNumber,
      waveActive: this.waveActive,
      waveElapsedSec: this.waveElapsedSec,
      waveInitialSpawnCount: this.waveInitialSpawnCount,
      status: this.status,
      freeplayUnlocked: this.freeplayUnlocked,
      speedMultiplier: this.speedMultiplier,
      totalBugsPopped: this.totalBugsPopped,
      bugsBankedThisRun: this.bugsBankedThisRun,
      eggsEarnedThisRun: this.eggsEarnedThisRun,
      lastVictoryEggsEarned: this.lastVictoryEggsEarned,
      totalClicksAccepted: this.totalClicksAccepted,
      waveClickCounter: this.waveClickCounter,
      waveCornHarvested: this.waveCornHarvested,
      equippedCannon: this.equippedCannon,
      cannonCharge: this.cannonCharge,
      cannonDamageBoostTimer: this.cannonDamageBoostTimer,
      cannonCornBoostTimer: this.cannonCornBoostTimer,
      cannonTimeStopVisualTimer: this.cannonTimeStopVisualTimer,
      frenzyMeter: this.frenzyMeter,
      clickerLevels: { ...this.clickerLevels },
      tdLevels: { ...this.tdLevels },
      towers: this.towers.map((t) => ({ ...t })),
      enemies: this.enemies
        .filter((e) => e.alive !== false)
        .map((e) => ({
          id: e.id,
          typeId: e.typeId,
          hp: e.hp,
          maxHp: e.maxHp,
          distance: e.distance,
          lateralOffset: e.lateralOffset,
          slowFactor: e.slowFactor,
          slowTimer: e.slowTimer,
          freezeTimer: e.freezeTimer,
          vulnTimer: e.vulnTimer,
          burnDps: e.burnDps,
          burnTimer: e.burnTimer,
          kbCooldown: e.kbCooldown,
          hitFlash: e.hitFlash,
          walkPhase: e.walkPhase,
        })),
      pendingSpawns: this.pendingSpawns.slice(this.pendingSpawnIdx).map((s) => ({ ...s })),
    };
  }

  public restoreFromSavedRun(saved: SavedRunState): boolean {
    try {
      this.mapId = saved.mapId;
      this.difficultyId = saved.difficultyId;
      setActiveMap(this.mapId);

      this.corn = this.isSandboxMode()
        ? SANDBOX_INF_CORN
        : Math.max(0, Math.floor(Number(saved.corn ?? 150)));
      this.totalCornClicked = Math.max(0, Math.floor(Number(saved.totalCornClicked ?? 0)));
      this.maxEggs = this.isSandboxMode()
        ? 999
        : Math.max(1, Math.floor(Number(saved.maxEggs ?? 25)));
      this.eggs = this.isSandboxMode()
        ? 999
        : Math.max(1, Math.min(this.maxEggs, Math.floor(Number(saved.eggs ?? 25))));
      this.waveNumber = Math.max(1, Math.floor(Number(saved.waveNumber ?? 1)));
      this.waveActive = Boolean(saved.waveActive);
      this.waveElapsedSec = Math.max(0, Number(saved.waveElapsedSec ?? 0));
      this.waveInitialSpawnCount = Math.max(1, Math.floor(Number(saved.waveInitialSpawnCount ?? 1)));
      this.status = saved.status === 'victory_prompt' ? 'victory_prompt' : 'playing';
      this.freeplayUnlocked = Boolean(saved.freeplayUnlocked);
      this.speedMultiplier = saved.speedMultiplier === 2 ? 2 : 1;

      this.totalBugsPopped = Math.max(0, Math.floor(Number(saved.totalBugsPopped ?? 0)));
      this.bugsBankedThisRun = Math.max(
        0,
        Math.min(this.totalBugsPopped, Math.floor(Number(saved.bugsBankedThisRun ?? 0)))
      );
      this.eggsEarnedThisRun = Math.max(0, Math.floor(Number(saved.eggsEarnedThisRun ?? 0)));
      this.lastVictoryEggsEarned = Math.max(0, Math.floor(Number(saved.lastVictoryEggsEarned ?? 0)));
      this.lastDefeatSummary = null;

      this.totalClicksAccepted = Math.max(0, Math.floor(Number(saved.totalClicksAccepted ?? 0)));
      this.waveClickCounter = Math.max(0, Math.floor(Number(saved.waveClickCounter ?? 0)));
      this.waveCornHarvested = Math.max(0, Math.floor(Number(saved.waveCornHarvested ?? 0)));
      this.equippedCannon =
        saved.equippedCannon && saved.equippedCannon in CANNON_DEFS
          ? saved.equippedCannon
          : PROGRESSION.getEquippedCannon();
      this.cannonCharge = Math.max(0, Math.min(1, Number(saved.cannonCharge ?? 0.5)));
      this.cannonFlash = 0;
      this.cannonDamageBoostTimer = Math.max(0, Number(saved.cannonDamageBoostTimer ?? 0));
      this.cannonCornBoostTimer = Math.max(0, Number(saved.cannonCornBoostTimer ?? 0));
      this.cannonTimeStopVisualTimer = Math.max(0, Number(saved.cannonTimeStopVisualTimer ?? 0));
      this.frenzyMeter = Math.max(0, Math.min(1, Number(saved.frenzyMeter ?? 0)));
      this.capHitFlash = 0;
      this.clickTimestampsMs = [];
      this.autoPeckAccumulator = 0;

      for (const def of CLICKER_UPGRADES) {
        const lv = Math.floor(Number(saved.clickerLevels?.[def.id] ?? 0) || 0);
        this.clickerLevels[def.id] = Math.max(0, Math.min(def.maxLevel, lv));
      }
      for (const def of TD_UPGRADES) {
        const lv = Math.floor(Number(saved.tdLevels?.[def.id] ?? 0) || 0);
        this.tdLevels[def.id] = Math.max(0, Math.min(def.maxLevel, lv));
      }

      let maxId = 1;
      this.towers = [];
      this.towerById.clear();
      if (Array.isArray(saved.towers)) {
        for (const t of saved.towers) {
          if (!t || !(t.typeId in CHICKEN_DEFS)) continue;
          const cleanTower: PlacedChicken = {
            id: Math.max(1, Math.floor(Number(t.id))),
            typeId: t.typeId,
            x: Number(t.x),
            y: Number(t.y),
            tier: ([0, 1, 2, 3].includes(t.tier) ? t.tier : 0) as 0 | 1 | 2 | 3,
            targetMode: ['first', 'strong', 'last', 'close'].includes(t.targetMode)
              ? t.targetMode
              : 'first',
            angle: Number(t.angle ?? 0),
            cooldown: 0,
            recoil: 0,
            totalPopDamage: Math.max(0, Number(t.totalPopDamage ?? 0)),
            totalSpent: Math.max(0, Number(t.totalSpent ?? 0)),
          };
          maxId = Math.max(maxId, cleanTower.id);
          this.towers.push(cleanTower);
          this.towerById.set(cleanTower.id, cleanTower);
        }
      }

      this.enemies = [];
      this.enemyStampById.clear();
      if (Array.isArray(saved.enemies)) {
        for (const e of saved.enemies) {
          if (!e || !(e.typeId in ENEMY_DEFS)) continue;
          const cleanEnemy: ActiveEnemy = {
            id: Math.max(1, Math.floor(Number(e.id))),
            typeId: e.typeId,
            hp: Math.max(1, Number(e.hp)),
            maxHp: Math.max(1, Number(e.maxHp)),
            distance: Math.max(0, Number(e.distance ?? 0)),
            lateralOffset: Number(e.lateralOffset ?? 0),
            slowFactor: Math.max(0, Number(e.slowFactor ?? 0)),
            slowTimer: Math.max(0, Number(e.slowTimer ?? 0)),
            freezeTimer: Math.max(0, Number(e.freezeTimer ?? 0)),
            vulnTimer: Math.max(0, Number(e.vulnTimer ?? 0)),
            burnDps: Math.max(0, Number(e.burnDps ?? 0)),
            burnTimer: Math.max(0, Number(e.burnTimer ?? 0)),
            kbCooldown: 0,
            hitFlash: 0,
            walkPhase: Number(e.walkPhase ?? 0),
            alive: true,
          };
          syncEnemyPathPosition(cleanEnemy);
          maxId = Math.max(maxId, cleanEnemy.id);
          this.enemies.push(cleanEnemy);
        }
      }

      this.pendingSpawns = [];
      this.pendingSpawnIdx = 0;
      if (Array.isArray(saved.pendingSpawns)) {
        for (const s of saved.pendingSpawns) {
          if (!s || !(s.enemyType in ENEMY_DEFS)) continue;
          this.pendingSpawns.push({
            spawnAtWaveTime: Number(s.spawnAtWaveTime ?? 0),
            enemyType: s.enemyType,
          });
        }
      }

      if (this.waveActive && this.enemies.length === 0 && this.pendingSpawns.length === 0) {
        this.waveActive = false;
      }

      this.nextEntityId = maxId + 1;
      this.invalidateStatsCache();
      this.stands = [];
      for (const t of this.towers) {
        if (t.typeId === 'stand_hen') {
          this.getOrCreateStand(t);
        }
      }
      this.projectiles = [];
      this.beams = [];
      this.hazardZones = [];
      this.rings = [];
      this.particles = [];
      this.popups = [];
      this.notifyUi();
      return true;
    } catch {
      return false;
    }
  }

  public resetGame(): void {
    if (this.totalBugsPopped > this.bugsBankedThisRun) {
      this.bankPendingRunBugs();
    }
    setActiveMap(this.mapId);
    const diff = this.getDifficulty();
    this.corn = this.isSandboxMode() ? SANDBOX_INF_CORN : diff.startingCorn;
    this.totalCornClicked = 0;
    this.eggs = this.isSandboxMode() ? 999 : diff.startingEggs;
    this.maxEggs = this.isSandboxMode() ? 999 : diff.startingEggs;
    this.waveNumber = 1;
    this.waveActive = false;
    this.waveElapsedSec = 0;
    this.waveInitialSpawnCount = 1;
    this.status = 'playing';
    this.freeplayUnlocked = false;
    this.totalBugsPopped = 0;
    this.bugsBankedThisRun = 0;
    this.eggsEarnedThisRun = 0;
    this.lastVictoryEggsEarned = 0;
    this.lastDefeatSummary = null;
    this.totalClicksAccepted = 0;
    this.waveClickCounter = 0;
    this.waveCornHarvested = 0;
    this.equippedCannon = PROGRESSION.getEquippedCannon();
    this.cannonCharge = this.isSandboxMode() ? 1.0 : 0.5;
    this.cannonFlash = 0;
    this.cannonDamageBoostTimer = 0;
    this.cannonCornBoostTimer = 0;
    this.cannonTimeStopVisualTimer = 0;
    this.clickTimestampsMs = [];
    this.autoPeckAccumulator = 0;
    this.frenzyMeter = 0;
    this.capHitFlash = 0;

    this.clickerLevels = {
      beakPower: 0,
      farmhandChicks: 0,
      goldenLuck: 0,
      peckRhythm: 0,
      harvestBasket: 0,
      twinBeak: 0,
      roostForeman: 0,
      cornSilo: 0,
      cornucopia: 0,
    };
    this.tdLevels = {
      caffeinatedFeed: 0,
      eagleRoost: 0,
      razorTalons: 0,
      fortifiedNest: 0,
    };

    this.towers = [];
    this.towerById.clear();
    this.invalidateStatsCache();
    this.stands = [];
    this.enemies = [];
    this.enemyStampById.clear();
    this.projectiles = [];
    this.beams = [];
    this.hazardZones = [];
    this.rings = [];
    this.particles = [];
    this.popups = [];
    this.pendingSpawns = [];
    this.pendingSpawnIdx = 0;
    this.notifyUi();
  }

  private notifyUi(): void {
    if (this.onUiChange) this.onUiChange();
  }

  private notifyCornOnly(): void {
    if (this.onCornChange) this.onCornChange();
    else if (this.onUiChange) this.onUiChange();
  }

  public getCurrentCps(nowPerfMs = performance.now()): number {
    const arr = this.clickTimestampsMs;
    if (arr.length === 0) return 0;
    let firstValid = 0;
    while (firstValid < arr.length && nowPerfMs - arr[firstValid] >= 1000) {
      firstValid++;
    }
    if (firstValid > 0) {
      arr.splice(0, firstValid);
    }
    return arr.length;
  }

  public getCurrentFrenzyMultiplier(): number {
    const maxMult = getMaxRhythmMult(this.clickerLevels.peckRhythm);
    return 1 + (maxMult - 1) * this.frenzyMeter;
  }

  private executePeck(isAuto: boolean, currentCps: number): ClickResult {
    const twinChance = getTwinBeakChance(this.clickerLevels.twinBeak);
    const isTwinPeck = twinChance > 0 && Math.random() < twinChance;
    const strikeCount = isTwinPeck ? 2 : 1;

    const prevCounter = this.waveClickCounter;
    this.waveClickCounter += strikeCount;

    if (this.clickerLevels.peckRhythm > 0) {
      const gain = isAuto
        ? (this.clickerLevels.roostForeman > 0 ? 0.045 : 0.02) * strikeCount
        : 0.085 * strikeCount;
      this.frenzyMeter = Math.min(1, this.frenzyMeter + gain);
    }

    const baseVal = getBaseCornPerClick(this.clickerLevels.beakPower);
    const rhythmMult = this.getCurrentFrenzyMultiplier();

    const crit = getCritParams(this.clickerLevels.goldenLuck);
    const isCrit = crit.chance > 0 && Math.random() < crit.chance;
    const critMult = isCrit ? crit.mult : 1.0;

    const waveMult = getCornucopiaWaveMult(this.clickerLevels.cornucopia, this.waveNumber);
    const foremanMult = isAuto ? getForemanMult(this.clickerLevels.roostForeman) : 1.0;
    const cannonCornMult = this.cannonCornBoostTimer > 0 ? 2.0 : 1.0;

    const basketMult = getHarvestBasketMult(this.clickerLevels.harvestBasket);
    const crossedTwelve = Math.floor(this.waveClickCounter / 12) > Math.floor(prevCounter / 12);
    const isMegaCob = basketMult > 0 && crossedTwelve;
    const megaBonus = isMegaCob
      ? Math.round(baseVal * basketMult * waveMult * foremanMult * cannonCornMult)
      : 0;

    const earned = Math.max(
      1,
      Math.round(
        baseVal * strikeCount * rhythmMult * critMult * waveMult * foremanMult * cannonCornMult
      ) + megaBonus
    );
    if (this.isSandboxMode()) {
      this.corn = SANDBOX_INF_CORN;
    } else {
      this.corn += earned;
    }
    this.totalCornClicked += earned;
    this.waveCornHarvested += earned;

    return {
      accepted: true,
      amountEarned: earned,
      isCrit,
      isMegaCob,
      isTwinPeck,
      isAuto,
      currentCps,
    };
  }

  /**
   * Core Clicker Handler:
   *  1. Strictly locked between waves (awards 0 Corn).
   *  2. Strictly capped at 12 CPS in a rolling 1,000ms window — any click beyond 12 CPS does nothing!
   */
  public handleHenClick(nowPerfMs = performance.now()): ClickResult {
    if (this.status === 'gameover') {
      return {
        accepted: false,
        reason: 'gameover',
        amountEarned: 0,
        isCrit: false,
        isMegaCob: false,
        currentCps: this.getCurrentCps(nowPerfMs),
      };
    }

    if (!this.waveActive && !this.isSandboxMode()) {
      this.audio.playBlockedClick();
      return {
        accepted: false,
        reason: 'between_waves',
        amountEarned: 0,
        isCrit: false,
        isMegaCob: false,
        currentCps: 0,
      };
    }

    const activeCps = this.getCurrentCps(nowPerfMs);
    if (activeCps >= MAX_CPS_CAP) {
      this.capHitFlash = 1.0;
      return {
        accepted: false,
        reason: 'cps_cap',
        amountEarned: 0,
        isCrit: false,
        isMegaCob: false,
        currentCps: MAX_CPS_CAP,
      };
    }

    this.clickTimestampsMs.push(nowPerfMs);
    this.totalClicksAccepted++;

    const res = this.executePeck(false, this.clickTimestampsMs.length);
    this.audio.playHenClick(res.isCrit, res.isMegaCob);
    this.notifyCornOnly();
    return res;
  }

  public startNextWave(): boolean {
    if (this.waveActive || this.status === 'gameover') return false;
    if (this.status === 'victory_prompt') {
      this.status = 'playing';
      this.freeplayUnlocked = true;
    }

    const def = getWaveDefinition(this.waveNumber, this.difficultyId);
    const countMult = this.getDifficulty().enemyCountMult;
    const queue: PendingSpawn[] = [];
    for (const grp of def.groups) {
      const scaledCount = Math.max(1, Math.round(grp.count * countMult));
      const baseInterval = grp.intervalSec > 0.05 ? grp.intervalSec : 0.85;
      const scaledInterval =
        scaledCount <= 1 ? 0 : Math.max(0.05, baseInterval / Math.max(0.8, countMult));
      for (let i = 0; i < scaledCount; i++) {
        queue.push({
          spawnAtWaveTime: grp.startDelaySec + i * scaledInterval,
          enemyType: grp.enemyType,
        });
      }
    }
    queue.sort((a, b) => a.spawnAtWaveTime - b.spawnAtWaveTime);

    this.pendingSpawns = queue;
    this.pendingSpawnIdx = 0;
    this.waveInitialSpawnCount = Math.max(1, queue.length);
    this.waveElapsedSec = 0;
    this.waveCornHarvested = 0;
    this.autoPeckAccumulator = 0;
    this.waveActive = true;
    this.clickTimestampsMs = [];
    this.audio.playWaveStart();
    this.notifyUi();
    return true;
  }

  /**
   * Fires the currently equipped Cluck Cannon loadout!
   * Supports Shockwave, Time-Stop, Damage Boost, Orbital Nova, and Cornstorm!
   */
  public fireCluckCannon(): boolean {
    if (this.status === 'gameover' || this.cannonCharge < 1) return false;
    if (!this.waveActive && this.enemies.length === 0) return false;

    const cannonId = this.getEquippedCannonId();
    this.cannonCharge = 0;
    this.cannonFlash = 1.0;
    this.audio.playCluckCannon(cannonId);

    const totalLen = getTotalPathLength();
    const nestPt = getPointAlongPath(totalLen);
    const hpScale = getWaveHpScale(this.waveNumber);

    if (cannonId === 'time_stop') {
      // TIME-STOP CANNON: Freezes all enemies solid at 0 speed + temporal rift hit!
      this.cannonTimeStopVisualTimer = 5.0;
      for (let d = 0; d <= totalLen; d += 110) {
        const pt = getPointAlongPath(d);
        this.spawnRing(pt.x, pt.y, 50, d % 220 === 0 ? '#C084FC' : '#22D3EE');
        this.spawnPixelBurst(pt.x, pt.y, 5, '#E9D5FF');
      }
      this.spawnMapPopup('STOP TIME! 5.0S', nestPt.x, nestPt.y - 34, '#E879F9', 1.2);

      const riftDmg = Math.max(12, Math.round(14 * hpScale));
      const riftCarrier: ActiveProjectile = {
        id: this.nextEntityId++,
        ownerTowerId: -1,
        style: 'chrono_orb',
        x: nestPt.x,
        y: nestPt.y,
        vx: 0,
        vy: 0,
        curveRate: 0,
        rotation: 0,
        damage: riftDmg,
        pierceLeft: 9999,
        splashRadius: 9999,
        slowFactor: 0.55,
        slowDuration: 6.5,
        burnDps: 0,
        foxDamageMult: 1.35,
        knockback: 0,
        savageCritChance: 0,
        armorPiercing: true,
        canHitCamo: true,
        hitEnemyIds: null,
        age: 0,
        maxLifetime: 0.05,
        color: '#C084FC',
      };
      const initialCount = this.enemies.length;
      for (let i = 0; i < initialCount; i++) {
        const e = this.enemies[i];
        if (e.alive === false) continue;
        this.damageEnemy(e, riftDmg, riftCarrier);
      }
      // Freeze every surviving enemy (and any newly split child bugs!) at 0 speed!
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.alive === false) continue;
        const dur = ENEMY_DEFS[e.typeId].isFoxBoss ? 3.8 : 5.0;
        e.freezeTimer = Math.max(e.freezeTimer, dur);
      }
      this.compactAliveEnemies();
      this.notifyUi();
      return true;
    }

    if (cannonId === 'damage_boost') {
      // DAMAGE BOOST CANNON: 2.0x Damage & +35% Attack Speed to ALL Chickens for 8.0s!
      this.cannonDamageBoostTimer = 8.0;
      this.invalidateStatsCache();
      for (const t of this.towers) {
        this.spawnRing(t.x, t.y, 38, '#F97316');
        this.spawnPixelBurst(t.x, t.y, 6, '#FACC15');
      }
      for (let d = 0; d <= totalLen; d += 150) {
        const pt = getPointAlongPath(d);
        this.spawnRing(pt.x, pt.y, 40, '#FACC15');
      }
      this.spawnMapPopup('2X DMG BOOST! 8S', nestPt.x, nestPt.y - 34, '#FACC15', 1.2);

      const hornDmg = Math.max(12, Math.round(15 * hpScale));
      const hornCarrier: ActiveProjectile = {
        id: this.nextEntityId++,
        ownerTowerId: -1,
        style: 'solar',
        x: nestPt.x,
        y: nestPt.y,
        vx: 0,
        vy: 0,
        curveRate: 0,
        rotation: 0,
        damage: hornDmg,
        pierceLeft: 9999,
        splashRadius: 9999,
        slowFactor: 0.25,
        slowDuration: 1.2,
        burnDps: 0,
        foxDamageMult: 1.4,
        knockback: 28,
        savageCritChance: 0,
        armorPiercing: true,
        canHitCamo: true,
        hitEnemyIds: null,
        age: 0,
        maxLifetime: 0.05,
        color: '#F97316',
      };
      const initialCount = this.enemies.length;
      for (let i = 0; i < initialCount; i++) {
        const e = this.enemies[i];
        if (e.alive === false) continue;
        e.kbCooldown = 0;
        this.damageEnemy(e, hornDmg, hornCarrier);
      }
      this.compactAliveEnemies();
      this.notifyUi();
      return true;
    }

    if (cannonId === 'orbital_nova') {
      // ORBITAL NOVA CANNON: 4.5x Antimatter Nuke + Shatters Armor (+35% DMG taken for 8s)!
      for (let d = 0; d <= totalLen; d += 95) {
        const pt = getPointAlongPath(d);
        this.spawnRing(pt.x, pt.y, 56, d % 190 === 0 ? '#F43F5E' : '#FEF08A');
        this.spawnPixelBurst(pt.x, pt.y, 6, '#FB7185');
      }
      this.spawnMapPopup('ORBITAL NOVA!', nestPt.x, nestPt.y - 34, '#FB7185', 1.2);

      const novaDmg = Math.max(80, Math.round(108 * hpScale));
      const novaBurn = Math.max(15, Math.round(22 * hpScale));
      const novaCarrier: ActiveProjectile = {
        id: this.nextEntityId++,
        ownerTowerId: -1,
        style: 'antimatter',
        x: nestPt.x,
        y: nestPt.y,
        vx: 0,
        vy: 0,
        curveRate: 0,
        rotation: 0,
        damage: novaDmg,
        pierceLeft: 9999,
        splashRadius: 9999,
        slowFactor: 0.35,
        slowDuration: 1.8,
        burnDps: novaBurn,
        foxDamageMult: 2.5,
        knockback: 35,
        savageCritChance: 0,
        armorPiercing: true,
        canHitCamo: true,
        hitEnemyIds: null,
        age: 0,
        maxLifetime: 0.05,
        color: '#F43F5E',
      };
      const initialCount = this.enemies.length;
      for (let i = 0; i < initialCount; i++) {
        const e = this.enemies[i];
        if (e.alive === false) continue;
        e.kbCooldown = 0;
        this.damageEnemy(e, novaDmg, novaCarrier);
      }
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.alive === false) continue;
        e.vulnTimer = Math.max(e.vulnTimer, 8.0);
      }
      this.compactAliveEnemies();
      this.notifyUi();
      return true;
    }

    if (cannonId === 'cornstorm') {
      // CORNSTORM CANNON: 90px Mega-Knockback + Instant Corn Windfall + 2x Corn Pecking for 8s!
      this.cannonCornBoostTimer = 8.0;
      const basePeck =
        getBaseCornPerClick(this.clickerLevels.beakPower) *
        getCornucopiaWaveMult(this.clickerLevels.cornucopia, this.waveNumber);
      let stormPopupText = 'CORNSTORM! 90PX GALE';
      if (this.isSandboxMode()) {
        this.corn = SANDBOX_INF_CORN;
      } else {
        const instantCorn = Math.max(60, Math.round(basePeck * 18 + this.corn * 0.12));
        this.corn += instantCorn;
        this.totalCornClicked += instantCorn;
        this.waveCornHarvested += instantCorn;
        stormPopupText = `+${instantCorn} CORN! 2X 8S`;
      }

      for (let d = 0; d <= totalLen; d += 110) {
        const pt = getPointAlongPath(d);
        this.spawnRing(pt.x, pt.y, 50, d % 220 === 0 ? '#4ADE80' : '#FACC15');
        this.spawnPixelBurst(pt.x, pt.y, 5, '#FEF08A');
      }
      this.spawnMapPopup(stormPopupText, nestPt.x, nestPt.y - 34, '#4ADE80', 1.2);

      const galeDmg = Math.max(14, Math.round(16 * hpScale));
      const galeCarrier: ActiveProjectile = {
        id: this.nextEntityId++,
        ownerTowerId: -1,
        style: 'seed',
        x: nestPt.x,
        y: nestPt.y,
        vx: 0,
        vy: 0,
        curveRate: 0,
        rotation: 0,
        damage: galeDmg,
        pierceLeft: 9999,
        splashRadius: 9999,
        slowFactor: 0.45,
        slowDuration: 2.0,
        burnDps: 0,
        foxDamageMult: 1.35,
        knockback: 90,
        savageCritChance: 0,
        armorPiercing: true,
        canHitCamo: true,
        hitEnemyIds: null,
        age: 0,
        maxLifetime: 0.05,
        color: '#4ADE80',
      };
      const initialCount = this.enemies.length;
      for (let i = 0; i < initialCount; i++) {
        const e = this.enemies[i];
        if (e.alive === false) continue;
        e.kbCooldown = 0;
        this.damageEnemy(e, galeDmg, galeCarrier);
      }
      this.compactAliveEnemies();
      this.notifyUi();
      return true;
    }

    // DEFAULT ('shockwave'): Classic Balanced Shockwave Cannon!
    for (let d = 0; d <= totalLen; d += 110) {
      const pt = getPointAlongPath(d);
      this.spawnRing(pt.x, pt.y, 48, d % 220 === 0 ? '#22D3EE' : '#FACC15');
      this.spawnPixelBurst(pt.x, pt.y, 4, '#FEF08A');
    }

    this.spawnMapPopup('SHOCKWAVE CANNON!', nestPt.x, nestPt.y - 34, '#22D3EE', 1.2);

    const waveDmg = Math.max(18, Math.round(24 * hpScale));
    const cannonCarrier: ActiveProjectile = {
      id: this.nextEntityId++,
      ownerTowerId: -1,
      style: 'genesis_beam',
      x: nestPt.x,
      y: nestPt.y,
      vx: 0,
      vy: 0,
      curveRate: 0,
      rotation: 0,
      damage: waveDmg,
      pierceLeft: 9999,
      splashRadius: 9999,
      slowFactor: 0.58,
      slowDuration: 2.2,
      burnDps: 0,
      foxDamageMult: 1.5,
      knockback: 68,
      savageCritChance: 0,
      armorPiercing: true,
      canHitCamo: true,
      hitEnemyIds: null,
      age: 0,
      maxLifetime: 0.05,
      color: '#22D3EE',
    };

    const initialCount = this.enemies.length;
    for (let i = 0; i < initialCount; i++) {
      const e = this.enemies[i];
      if (e.alive === false) continue;
      e.kbCooldown = 0; // Cannon always overrides knockback cooldown!
      this.damageEnemy(e, waveDmg, cannonCarrier);
    }

    this.compactAliveEnemies();
    this.notifyUi();
    return true;
  }

  public getPendingWaveEnemyTotal(): number {
    return Math.max(0, this.pendingSpawns.length - this.pendingSpawnIdx) + this.enemies.length;
  }

  /**
   * Non-recursive aura radius of a Support Chicken (base * Watchtower Roost * Mutation range).
   */
  public getSupportAuraRadius(supportTower: PlacedChicken): number {
    const baseRange = CHICKEN_DEFS[supportTower.typeId].tiers[supportTower.tier].range;
    const mut = PROGRESSION.getMutation(supportTower.typeId);
    const mutRange = mut ? MUTATION_DEFS[mut].rangeMult : 1.0;
    return Math.round(baseRange * (1 + this.tdLevels.eagleRoost * 0.08) * mutRange);
  }

  public getPreviewRange(typeId: ChickenTypeId): number {
    const baseRange = CHICKEN_DEFS[typeId].tiers[0].range;
    const mut = PROGRESSION.getMutation(typeId);
    const mutRange = mut ? MUTATION_DEFS[mut].rangeMult : 1.0;
    return Math.round(baseRange * (1 + this.tdLevels.eagleRoost * 0.08) * mutRange);
  }

  public getTowersBuffedBy(supportTower: PlacedChicken): PlacedChicken[] {
    const auraSpec = CHICKEN_DEFS[supportTower.typeId].tiers[supportTower.tier].supportAura;
    if (!auraSpec) return [];
    const radius = this.getSupportAuraRadius(supportTower);
    return this.towers.filter(
      (t) =>
        t.id !== supportTower.id &&
        t.typeId !== 'complete_cluck' &&
        Math.hypot(t.x - supportTower.x, t.y - supportTower.y) <= radius
    );
  }

  public getTowersInPreviewSupportAura(
    typeId: ChickenTypeId,
    x: number,
    y: number
  ): PlacedChicken[] {
    if (!CHICKEN_DEFS[typeId].tiers[0].supportAura) return [];
    const radius = this.getPreviewRange(typeId);
    return this.towers.filter(
      (t) => t.typeId !== 'complete_cluck' && Math.hypot(t.x - x, t.y - y) <= radius
    );
  }

  /**
   * Computes combined nearby Support Aura buffs for a placed tower.
   * Note: "The Complete Cluck" ('complete_cluck') is completely unaffected by nearby support units!
   */
  private computeSupportBuffsForTower(target: PlacedChicken): SupportAuraSpec & { count: number } {
    if (target.typeId === 'complete_cluck') {
      return {
        damageBonus: 0,
        fireRateBonus: 0,
        rangeBonus: 0,
        bonusPierce: 0,
        bonusProjectiles: 0,
        foxDamageBonus: 0,
        grantsCamo: false,
        grantsArmorPierce: false,
        bonusCritChance: 0,
        bonusKnockback: 0,
        count: 0,
      };
    }
    const bestByType = new Map<ChickenTypeId, SupportAuraSpec>();

    for (const other of this.towers) {
      if (other.id === target.id) continue;
      const aura = CHICKEN_DEFS[other.typeId].tiers[other.tier].supportAura;
      if (!aura) continue;
      const radius = this.getSupportAuraRadius(other);
      if (Math.hypot(target.x - other.x, target.y - other.y) > radius) continue;

      const mut = PROGRESSION.getMutation(other.typeId);
      const potency =
        mut === 'legendary'
          ? 1.4
          : mut === 'epic'
          ? 1.25
          : mut === 'rare'
          ? 1.15
          : mut === 'common'
          ? 1.08
          : 1.0;

      const scaled: SupportAuraSpec = {
        damageBonus: aura.damageBonus * potency,
        fireRateBonus: aura.fireRateBonus * potency,
        rangeBonus: aura.rangeBonus * potency,
        bonusPierce: aura.bonusPierce,
        bonusProjectiles: aura.bonusProjectiles,
        foxDamageBonus: aura.foxDamageBonus * potency,
        grantsCamo: aura.grantsCamo,
        grantsArmorPierce: aura.grantsArmorPierce,
        bonusCritChance: aura.bonusCritChance * potency,
        bonusKnockback: Math.round(aura.bonusKnockback * potency),
      };

      const prev = bestByType.get(other.typeId);
      if (!prev) {
        bestByType.set(other.typeId, scaled);
      } else {
        bestByType.set(other.typeId, {
          damageBonus: Math.max(prev.damageBonus, scaled.damageBonus),
          fireRateBonus: Math.max(prev.fireRateBonus, scaled.fireRateBonus),
          rangeBonus: Math.max(prev.rangeBonus, scaled.rangeBonus),
          bonusPierce: Math.max(prev.bonusPierce, scaled.bonusPierce),
          bonusProjectiles: Math.max(prev.bonusProjectiles, scaled.bonusProjectiles),
          foxDamageBonus: Math.max(prev.foxDamageBonus, scaled.foxDamageBonus),
          grantsCamo: prev.grantsCamo || scaled.grantsCamo,
          grantsArmorPierce: prev.grantsArmorPierce || scaled.grantsArmorPierce,
          bonusCritChance: Math.max(prev.bonusCritChance, scaled.bonusCritChance),
          bonusKnockback: Math.max(prev.bonusKnockback, scaled.bonusKnockback),
        });
      }
    }

    const total: SupportAuraSpec & { count: number } = {
      damageBonus: 0,
      fireRateBonus: 0,
      rangeBonus: 0,
      bonusPierce: 0,
      bonusProjectiles: 0,
      foxDamageBonus: 0,
      grantsCamo: false,
      grantsArmorPierce: false,
      bonusCritChance: 0,
      bonusKnockback: 0,
      count: bestByType.size,
    };

    for (const s of bestByType.values()) {
      total.damageBonus += s.damageBonus;
      total.fireRateBonus += s.fireRateBonus;
      total.rangeBonus += s.rangeBonus;
      total.bonusPierce += s.bonusPierce;
      total.bonusProjectiles += s.bonusProjectiles;
      total.foxDamageBonus += s.foxDamageBonus;
      total.grantsCamo = total.grantsCamo || s.grantsCamo;
      total.grantsArmorPierce = total.grantsArmorPierce || s.grantsArmorPierce;
      total.bonusCritChance += s.bonusCritChance;
      total.bonusKnockback += s.bonusKnockback;
    }

    return total;
  }

  public getEffectiveChickenStats(tower: PlacedChicken): EffectiveChickenStats {
    const boostActiveNow = this.cannonDamageBoostTimer > 0;
    if (boostActiveNow !== this.statsCacheBoostActive) {
      this.statsCacheBoostActive = boostActiveNow;
      this.statsCache.clear();
    }
    const cached = this.statsCache.get(tower.id);
    if (cached) return cached;

    const def = CHICKEN_DEFS[tower.typeId];
    const base = def.tiers[tower.tier];
    const mutTier = PROGRESSION.getMutation(tower.typeId);
    const mutDef = mutTier ? MUTATION_DEFS[mutTier] : null;
    const plusLv = PROGRESSION.getPlusLevel(tower.typeId);
    const sup = this.computeSupportBuffsForTower(tower);

    const plusDmgMult = 1 + plusLv * 0.03;
    const plusRateMult = 1 + Math.min(0.45, plusLv * 0.01125);

    const mutDmg = mutDef ? mutDef.damageMult : 1.0;
    const mutRate = mutDef ? mutDef.fireRateMult : 1.0;
    const mutRange = mutDef ? mutDef.rangeMult : 1.0;
    const mutPierce = mutDef ? mutDef.bonusPierce : 0;
    const mutProj = mutDef ? mutDef.bonusProjectiles : 0;
    const mutFox = mutDef ? mutDef.foxMult : 1.0;
    const mutCamo = mutDef ? mutDef.grantsCamo : false;
    const mutCrit = mutDef ? mutDef.bonusCritChance : 0;
    const mutKb = mutDef ? mutDef.bonusKnockback : 0;

    const cannonDmgMult = boostActiveNow ? 2.0 : 1.0;
    const cannonRateMult = boostActiveNow ? 1.35 : 1.0;

    // Support towers use their own non-recursive aura range so two support towers don't loop infinitely
    const supRangeMult = def.isSupport ? 1.0 : 1 + sup.rangeBonus;
    const rangeMult = (1 + this.tdLevels.eagleRoost * 0.08) * mutRange * supRangeMult;
    const rateMult =
      (1 + this.tdLevels.caffeinatedFeed * 0.11) *
      mutRate *
      plusRateMult *
      (1 + sup.fireRateBonus) *
      cannonRateMult;
    const bonusPierce = Math.ceil(this.tdLevels.razorTalons / 2) + mutPierce + sup.bonusPierce;
    const foxMult =
      base.foxDamageMult *
      (1 + this.tdLevels.razorTalons * 0.22) *
      mutFox *
      (1 + sup.foxDamageBonus);
    const hasCamo = base.camoSight || mutCamo || sup.grantsCamo || this.tdLevels.eagleRoost >= 3;
    const hasArmorPierce =
      sup.grantsArmorPierce || !BASIC_PECK_SET.has(tower.typeId) || tower.tier >= 2;

    const rawDamage = base.damage * mutDmg * plusDmgMult * (1 + sup.damageBonus) * cannonDmgMult;
    const effectiveDamage =
      base.damage <= 0
        ? 0
        : rawDamage >= 10
        ? Math.round(rawDamage * 10) / 10
        : Math.round(rawDamage * 100) / 100;
    const effectiveBurnDps =
      Math.round(
        base.burnDps * mutDmg * plusDmgMult * (1 + sup.damageBonus) * cannonDmgMult * 10
      ) / 10;

    const computed: EffectiveChickenStats = {
      ...base,
      effectiveDamage,
      effectiveBurnDps,
      effectiveRange: Math.round(base.range * rangeMult),
      effectiveFireRate: base.fireRate * rateMult,
      effectivePierce: base.pierce > 0 ? base.pierce + bonusPierce : 0,
      effectiveProjectiles: base.projectiles > 0 ? base.projectiles + mutProj + sup.bonusProjectiles : 0,
      effectiveFoxMult: foxMult,
      effectiveCamo: hasCamo,
      effectiveArmorPierce: hasArmorPierce,
      effectiveKnockback: (base.knockback ?? 0) + mutKb + sup.bonusKnockback,
      effectiveCritChance: Math.min(0.8, (base.savageCritChance ?? 0) + mutCrit + sup.bonusCritChance),
      mutationTier: mutTier,
      plusLevel: plusLv,
      supportBuffCount: sup.count,
    };
    this.statsCache.set(tower.id, computed);
    return computed;
  }

  public placeChicken(typeId: ChickenTypeId, x: number, y: number): PlacedChicken | null {
    if (this.status === 'gameover') return null;
    if (!this.isChickenUnlocked(typeId)) return null;
    const cost = this.getTowerBaseCost(typeId);
    if (!this.isSandboxMode() && this.corn < cost) return null;
    if (!canPlaceChickenAt(x, y, this.towers, undefined, typeId)) return null;

    if (this.isSandboxMode()) {
      this.corn = SANDBOX_INF_CORN;
    } else {
      this.corn -= cost;
    }
    const placed: PlacedChicken = {
      id: this.nextEntityId++,
      typeId,
      x,
      y,
      tier: 0,
      targetMode: STRONG_DEFAULT_SET.has(typeId) ? 'strong' : 'first',
      angle: 0,
      cooldown: 0,
      recoil: 0,
      totalPopDamage: 0,
      totalSpent: cost,
    };
    this.towers.push(placed);
    this.towerById.set(placed.id, placed);
    this.invalidateStatsCache();
    if (typeId === 'stand_hen') {
      this.getOrCreateStand(placed);
      this.spawnRing(x, y, 42, '#C084FC');
    }
    const mut = PROGRESSION.getMutation(typeId);
    const ringCol = mut ? MUTATION_DEFS[mut].color : '#FACC15';
    this.spawnRing(x, y, 34, ringCol);
    this.spawnPixelBurst(x, y, 8, ringCol);
    this.audio.playPlaceChicken();
    this.notifyUi();
    return placed;
  }

  public upgradeChickenTower(towerId: number): boolean {
    const tower = this.towerById.get(towerId);
    if (!tower || tower.tier >= 3) return false;
    const nextTierIdx = (tower.tier + 1) as 1 | 2 | 3;
    const upgCost = this.getTowerUpgradeCost(tower.typeId, nextTierIdx);
    if (!this.isSandboxMode() && this.corn < upgCost) return false;

    if (this.isSandboxMode()) {
      this.corn = SANDBOX_INF_CORN;
    } else {
      this.corn -= upgCost;
    }
    tower.tier = nextTierIdx;
    tower.totalSpent += upgCost;
    this.invalidateStatsCache();
    this.spawnRing(tower.x, tower.y, 46, '#4ADE80');
    this.spawnPixelBurst(tower.x, tower.y, 12, '#4ADE80');
    this.spawnMapPopup(`TIER ${nextTierIdx + 1}!`, tower.x, tower.y - 24, '#FDE047', 1.0);
    this.audio.playUpgrade();
    this.notifyUi();
    return true;
  }

  public sellChickenTower(towerId: number): number {
    const idx = this.towers.findIndex((t) => t.id === towerId);
    if (idx === -1) return 0;
    const [removed] = this.towers.splice(idx, 1);
    this.towerById.delete(removed.id);
    this.invalidateStatsCache();
    this.stands = this.stands.filter((s) => s.ownerTowerId !== removed.id);
    const refund = Math.round(removed.totalSpent * 0.7);
    if (this.isSandboxMode()) {
      this.corn = SANDBOX_INF_CORN;
      this.spawnPixelBurst(removed.x, removed.y, 8, '#22D3EE');
      this.spawnMapPopup('SOLD', removed.x, removed.y - 16, '#22D3EE', 1.0);
    } else {
      this.corn += refund;
      this.spawnPixelBurst(removed.x, removed.y, 8, '#FACC15');
      this.spawnMapPopup(`+${refund} CORN`, removed.x, removed.y - 16, '#FACC15', 1.0);
    }
    this.audio.playUpgrade();
    this.notifyUi();
    return refund;
  }

  public cycleTargetMode(towerId: number): TargetMode | null {
    const tower = this.towers.find((t) => t.id === towerId);
    if (!tower) return null;
    const order: TargetMode[] = ['first', 'strong', 'last', 'close'];
    tower.targetMode = order[(order.indexOf(tower.targetMode) + 1) % order.length];
    this.notifyUi();
    return tower.targetMode;
  }

  public buyClickerUpgrade(id: ClickerUpgradeId): boolean {
    const def = CLICKER_UPGRADES.find((u) => u.id === id);
    if (!def) return false;
    const lvl = this.clickerLevels[id];
    if (lvl >= def.maxLevel) return false;
    const cost = this.getScaledUpgradeCost(def, lvl);
    if (!this.isSandboxMode() && this.corn < cost) return false;

    if (this.isSandboxMode()) {
      this.corn = SANDBOX_INF_CORN;
    } else {
      this.corn -= cost;
    }
    this.clickerLevels[id] = lvl + 1;
    this.audio.playUpgrade();
    this.notifyUi();
    return true;
  }

  public buyTdUpgrade(id: TdUpgradeId): boolean {
    const def = TD_UPGRADES.find((u) => u.id === id);
    if (!def) return false;
    const lvl = this.tdLevels[id];
    if (lvl >= def.maxLevel) return false;
    const cost = this.getScaledUpgradeCost(def, lvl);
    if (!this.isSandboxMode() && this.corn < cost) return false;

    if (this.isSandboxMode()) {
      this.corn = SANDBOX_INF_CORN;
    } else {
      this.corn -= cost;
    }
    this.tdLevels[id] = lvl + 1;
    this.invalidateStatsCache();

    if (id === 'fortifiedNest') {
      if (this.isSandboxMode()) {
        this.maxEggs = 999;
        this.eggs = 999;
      } else {
        this.maxEggs += 8;
        this.eggs = Math.min(this.maxEggs, this.eggs + 8);
      }
    }

    this.audio.playUpgrade();
    this.notifyUi();
    return true;
  }

  private spawnEnemy(typeId: EnemyTypeId, distance: number): void {
    const def = ENEMY_DEFS[typeId];
    const hpScale = getWaveHpScale(this.waveNumber) * this.getDifficulty().enemyHpMult;
    const scaledHp = Math.max(1, Math.round(def.maxHp * hpScale));
    const idx = this.enemies.length;
    const created: ActiveEnemy = {
      id: this.nextEntityId++,
      typeId,
      hp: scaledHp,
      maxHp: scaledHp,
      distance: Math.max(0, distance),
      lateralOffset: def.isFoxBoss ? 0 : (Math.random() - 0.5) * 14,
      slowFactor: 0,
      slowTimer: 0,
      freezeTimer: 0,
      vulnTimer: 0,
      burnDps: 0,
      burnTimer: 0,
      kbCooldown: 0,
      hitFlash: 0,
      walkPhase: Math.random() * Math.PI * 2,
      alive: true,
      gridIdx: idx,
    };
    syncEnemyPathPosition(created);
    this.enemies.push(created);
    if (this.inProjectilePhase) {
      this.spatialBuckets[this.getSpatialCell(created.x!, created.y!)].push(idx);
    }
  }

  private buildDefeatSummary(killerTypeId: EnemyTypeId): RoundEndSummary {
    // Bank all unbanked bug kills for this round & clear active run save!
    const bankRes = this.bankPendingRunBugs();
    PROGRESSION.clearActiveRun();

    // Show "BOSS HP REMAINING: X%" if a Fox Boss was on the field (or leaked!)
    let bossName: string | null = null;
    let bossHpPct: number | null = null;

    const activeFoxes = this.enemies.filter(
      (e) => e.alive !== false && ENEMY_DEFS[e.typeId].isFoxBoss
    );
    if (ENEMY_DEFS[killerTypeId].isFoxBoss) {
      bossName = ENEMY_DEFS[killerTypeId].name;
      const sameType = activeFoxes.find((f) => f.typeId === killerTypeId);
      bossHpPct = sameType
        ? Math.max(1, Math.round((sameType.hp / sameType.maxHp) * 100))
        : 100;
    } else if (activeFoxes.length > 0) {
      activeFoxes.sort((a, b) => b.maxHp - a.maxHp);
      const topBoss = activeFoxes[0];
      bossName = ENEMY_DEFS[topBoss.typeId].name;
      bossHpPct = Math.max(1, Math.round((topBoss.hp / topBoss.maxHp) * 100));
    }

    const remainingSpawns = Math.max(0, this.pendingSpawns.length - this.pendingSpawnIdx);
    const spawnedRatio =
      this.waveInitialSpawnCount > 0
        ? Math.max(
            0,
            Math.min(
              99,
              Math.round(
                ((this.waveInitialSpawnCount - remainingSpawns) /
                  this.waveInitialSpawnCount) *
                  100
              )
            )
          )
        : 50;

    let mvpUnitId: ChickenTypeId | null = null;
    let mvpDamage = 0;
    for (const t of this.towers) {
      if (t.totalPopDamage > mvpDamage || mvpUnitId === null) {
        mvpUnitId = t.typeId;
        mvpDamage = t.totalPopDamage;
      }
    }

    return {
      mapId: this.mapId,
      difficultyId: this.difficultyId,
      waveReached: this.waveNumber,
      freeplay: this.freeplayUnlocked,
      totalBugsKilledThisRun: this.totalBugsPopped,
      totalCornHarvested: this.totalCornClicked,
      towersDeployed: this.towers.length,
      eggsEarnedThisRun: this.eggsEarnedThisRun,
      newBugRemainder: bankRes.newRemainder,
      totalSavedEggs: bankRes.totalSavedEggs,
      killerEnemyId: killerTypeId,
      bossName,
      bossHpPercentRemaining: bossHpPct,
      waveProgressPercent: spawnedRatio,
      mvpUnitId,
      mvpDamage: Math.round(mvpDamage),
    };
  }

  public tick(realDtSec: number): void {
    this.capHitFlash = Math.max(0, this.capHitFlash - realDtSec * 3.2);
    this.cannonFlash = Math.max(0, this.cannonFlash - realDtSec * 2.8);
    const activeCps = this.getCurrentCps();
    const foremanHoldingFrenzy =
      this.waveActive &&
      this.clickerLevels.farmhandChicks > 0 &&
      this.clickerLevels.roostForeman > 0;
    if (!this.waveActive) {
      this.frenzyMeter = Math.max(0, this.frenzyMeter - realDtSec * 1.4);
    } else if (activeCps < 4 && !foremanHoldingFrenzy) {
      this.frenzyMeter = Math.max(0, this.frenzyMeter - realDtSec * 0.25);
    }

    if (this.status === 'gameover') return;

    const simSteps = this.speedMultiplier;
    const stepDt = Math.min(0.05, realDtSec);
    for (let s = 0; s < simSteps; s++) {
      this.simulateStep(stepDt);
      if ((this.status as string) === 'gameover') break;
    }
  }

  private simulateStep(dt: number): void {
    // Tick active Cluck Cannon buff timers
    this.cannonDamageBoostTimer = Math.max(0, this.cannonDamageBoostTimer - dt);
    this.cannonCornBoostTimer = Math.max(0, this.cannonCornBoostTimer - dt);
    this.cannonTimeStopVisualTimer = Math.max(0, this.cannonTimeStopVisualTimer - dt);

    // 0. Farmhand Auto-Peckers + Cluck Cannon Charging during active waves (or active Sandbox combat)!
    if (this.waveActive || (this.isSandboxMode() && this.enemies.length > 0)) {
      const chargeSec = this.getEquippedCannonDef().chargeSec;
      this.cannonCharge = Math.min(1, this.cannonCharge + dt / chargeSec);
    }
    if (this.waveActive) {
      const autoRate = getFarmhandAutoRate(this.clickerLevels.farmhandChicks);
      if (autoRate > 0) {
        this.autoPeckAccumulator += autoRate * dt;
        while (this.autoPeckAccumulator >= 1) {
          this.autoPeckAccumulator -= 1;
          const res = this.executePeck(true, this.getCurrentCps());
          if (this.onAutoPeck) this.onAutoPeck(res);
        }
      }
    }

    // 1. Spawn queued wave enemies (O(1) cursor instead of Array.shift())
    if (this.waveActive) {
      this.waveElapsedSec += dt;
      while (
        this.pendingSpawnIdx < this.pendingSpawns.length &&
        this.pendingSpawns[this.pendingSpawnIdx].spawnAtWaveTime <= this.waveElapsedSec
      ) {
        const next = this.pendingSpawns[this.pendingSpawnIdx++];
        this.spawnEnemy(next.enemyType, 0);
      }
    }

    // 2. Move enemies, tick DoTs, check Nest leaks
    const totalPathLen = getTotalPathLength();
    const speedScale = getWaveSpeedScale(this.waveNumber) * this.getDifficulty().enemySpeedMult;
    const moveCount = this.enemies.length;
    let leakedOrBurned = false;

    for (let i = 0; i < moveCount; i++) {
      const e = this.enemies[i];
      if (e.alive === false) continue;
      const def = ENEMY_DEFS[e.typeId];

      e.hitFlash = Math.max(0, e.hitFlash - dt * 6);
      e.kbCooldown = Math.max(0, e.kbCooldown - dt);
      if (e.freezeTimer > 0) {
        e.freezeTimer = Math.max(0, e.freezeTimer - dt);
      } else {
        e.walkPhase += dt * (def.isFoxBoss ? 6 : 12);
      }
      if (e.vulnTimer > 0) {
        e.vulnTimer = Math.max(0, e.vulnTimer - dt);
      }

      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        if (e.slowTimer <= 0) e.slowFactor = 0;
      }

      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        e.hp -= e.burnDps * dt;
        if (e.hp <= 0) {
          this.defeatEnemy(e);
          leakedOrBurned = true;
          continue;
        }
      }

      const effectiveSlow = def.isFoxBoss ? e.slowFactor * 0.55 : e.slowFactor;
      const moveSpeed =
        e.freezeTimer > 0 ? 0 : def.speed * speedScale * (1 - Math.min(0.72, effectiveSlow));
      e.distance += moveSpeed * dt;

      if (e.distance >= totalPathLen) {
        e.alive = false;
        leakedOrBurned = true;
        const nestPt = getPointAlongPath(totalPathLen);
        if (this.isSandboxMode()) {
          // Immortal Nest in Sandbox Mode so testing massive boss waves never forces Game Over!
          this.eggs = 999;
          this.spawnMapPopup(`LEAK (-${def.eggDamage})`, nestPt.x, nestPt.y - 26, '#38BDF8', 1.05);
          this.spawnRing(nestPt.x, nestPt.y, 40, '#38BDF8');
          this.audio.playEggLeak();
        } else {
          this.eggs = Math.max(0, this.eggs - def.eggDamage);
          this.spawnMapPopup(`-${def.eggDamage} EGG`, nestPt.x, nestPt.y - 26, '#EF4444', 1.15);
          this.spawnRing(nestPt.x, nestPt.y, 44, '#EF4444');
          this.spawnPixelBurst(nestPt.x, nestPt.y, 12, '#EF4444');

          if (this.eggs <= 0) {
            this.eggs = 0;
            this.waveActive = false;
            this.status = 'gameover';
            this.compactAliveEnemies();
            this.lastDefeatSummary = this.buildDefeatSummary(def.id);
            this.audio.playDefeatJingle();
            this.notifyUi();
            return;
          } else {
            this.audio.playEggLeak();
            this.notifyUi();
          }
        }
      } else {
        syncEnemyPathPosition(e);
      }
    }

    if (leakedOrBurned) {
      this.compactAliveEnemies();
    }

    // 3. Tower targeting & projectile / pulse / Stand firing
    let towerDirectKillPossible = false;
    for (let tIdx = 0; tIdx < this.towers.length; tIdx++) {
      const tower = this.towers[tIdx];
      tower.recoil = Math.max(0, tower.recoil - dt * 5);
      tower.cooldown = Math.max(0, tower.cooldown - dt);

      if (tower.typeId === 'stand_hen') {
        this.updateStandUserTower(tower, dt);
        towerDirectKillPossible = true;
        continue;
      }

      const def = CHICKEN_DEFS[tower.typeId];
      const baseTier = def.tiers[tower.tier];

      // Pure Support Aura Towers (e.g. Roost Beacon Tiers 1-3): drum & broadcast warm aura pulses!
      if (baseTier.damage <= 0 || baseTier.projectiles <= 0) {
        if (this.waveActive && tower.cooldown <= 0) {
          tower.cooldown = 2.4;
          tower.recoil = 0.75;
          this.spawnRing(
            tower.x,
            tower.y,
            Math.min(64, Math.round(this.getSupportAuraRadius(tower) * 0.42)),
            '#FDE047'
          );
        }
        continue;
      }

      if (tower.cooldown > 0 || this.enemies.length === 0) continue;

      const stats = this.getEffectiveChickenStats(tower);
      const target = this.pickTargetForTower(tower, stats);
      if (!target) continue;

      const tx = target.x!;
      const ty = target.y!;
      const baseAngle = Math.atan2(ty - tower.y, tx - tower.x);
      tower.angle = baseAngle;
      tower.cooldown = 1 / Math.max(0.2, stats.effectiveFireRate);
      tower.recoil = 1.0;

      const armorPiercing = stats.effectiveArmorPierce;

      // ARCHETYPE A: 360-Degree AoE Shockwave Pulse ('sonic', 'tremor_slam', 'bass_pulse', 'quasar_pulse')
      if (
        def.projectileStyle === 'sonic' ||
        def.projectileStyle === 'tremor_slam' ||
        def.projectileStyle === 'bass_pulse' ||
        def.projectileStyle === 'quasar_pulse'
      ) {
        const isQuasar = def.projectileStyle === 'quasar_pulse';
        const isTremor = def.projectileStyle === 'tremor_slam';
        const isBass = def.projectileStyle === 'bass_pulse';
        const ringCol = isQuasar
          ? '#F472B6'
          : isBass
          ? '#EC4899'
          : isTremor
          ? '#38BDF8'
          : '#FB7185';
        this.spawnRing(tower.x, tower.y, stats.effectiveRange, ringCol);
        if (isQuasar) {
          this.spawnRing(tower.x, tower.y, Math.round(stats.effectiveRange * 0.65), '#22D3EE');
          this.spawnPixelBurst(tower.x, tower.y, 8, '#22D3EE');
        } else if (isBass) {
          this.spawnRing(tower.x, tower.y, Math.round(stats.effectiveRange * 0.62), '#22D3EE');
          this.spawnPixelBurst(tower.x, tower.y, 7, '#FDE047');
        } else if (isTremor) {
          this.spawnRing(tower.x, tower.y, Math.round(stats.effectiveRange * 0.55), '#E2E8F0');
          this.spawnPixelBurst(tower.x, tower.y, 7, '#93C5FD');
        } else {
          this.spawnPixelBurst(tower.x, tower.y, 6, '#FDE047');
        }
        const pulseCarrier: ActiveProjectile = {
          id: this.nextEntityId++,
          ownerTowerId: tower.id,
          style: def.projectileStyle,
          x: tower.x,
          y: tower.y,
          vx: 0,
          vy: 0,
          curveRate: 0,
          rotation: 0,
          damage: stats.effectiveDamage,
          pierceLeft: stats.effectivePierce,
          splashRadius: stats.effectiveRange,
          slowFactor: stats.slowFactor,
          slowDuration: stats.slowDuration,
          burnDps: stats.effectiveBurnDps,
          foxDamageMult: stats.effectiveFoxMult,
          knockback: stats.effectiveKnockback,
          savageCritChance: stats.effectiveCritChance,
          armorPiercing: true,
          canHitCamo: stats.effectiveCamo,
          hitEnemyIds: null,
          age: 0,
          maxLifetime: 0.05,
          color: def.accentColor,
        };
        let hits = 0;
        const snapLen = this.enemies.length;
        for (let i = 0; i < snapLen; i++) {
          if (hits >= stats.effectivePierce) break;
          const e = this.enemies[i];
          if (e.alive === false) continue;
          const eDef = ENEMY_DEFS[e.typeId];
          if (eDef.isCamo && !stats.effectiveCamo) continue;
          const dx = e.x! - tower.x;
          const dy = e.y! - tower.y;
          const maxR = stats.effectiveRange + eDef.radius;
          if (dx * dx + dy * dy <= maxR * maxR) {
            this.damageEnemy(e, stats.effectiveDamage, pulseCarrier);
            hits++;
          }
        }
        towerDirectKillPossible = true;
        continue;
      }

      // ARCHETYPE B: Chain-Jumping Forked Lightning ('lightning' Wizard & 'tesla_arc' Tesla Cochin)!
      if (def.projectileStyle === 'lightning' || def.projectileStyle === 'tesla_arc') {
        this.fireChainLightningAttack(tower, stats, target);
        towerDirectKillPossible = true;
        continue;
      }

      // ARCHETYPE C: Instant Piercing Laser / Rail / Solar / Atomic Beams!
      if (
        def.projectileStyle === 'plasma' ||
        def.projectileStyle === 'matrix_beam' ||
        def.projectileStyle === 'ankh_beam' ||
        def.projectileStyle === 'judgment_ray' ||
        def.projectileStyle === 'genesis_beam' ||
        def.projectileStyle === 'atomic_breath'
      ) {
        this.fireLaserBeamAttack(tower, stats, baseAngle, tx, ty);
        towerDirectKillPossible = true;
        continue;
      }

      const count = stats.effectiveProjectiles;
      const pStyle = def.projectileStyle;

      // ARCHETYPE D: Elliptical Boomeranging Blades & Returning Axes!
      // Used by The Complete Cluck ('infinity_blade'), Outback Hen ('boomerang'), & Berserker Jarl ('viking_axe').
      // Blades launch out along wide left/right elliptical arcs, converge through (tx, ty), reset their hit set at
      // apex so they slice targets BOTH outbound and returning, and boomerang all the way back to the Chicken!
      if (
        pStyle === 'infinity_blade' ||
        pStyle === 'boomerang' ||
        pStyle === 'viking_axe'
      ) {
        const isInfinity = pStyle === 'infinity_blade';
        const projColor =
          isInfinity && stats.mutationTier === 'aether' ? '#E879F9' : def.accentColor;
        const targetDist = Math.max(46, Math.hypot(tx - tower.x, ty - tower.y));
        const reach = isInfinity
          ? Math.min(stats.effectiveRange * 1.08, Math.max(64, targetDist * 1.06))
          : Math.min(stats.effectiveRange * 1.04, Math.max(58, targetDist * 1.08));
        const baseLoopLife = isInfinity
          ? Math.max(0.32, Math.min(0.66, (reach * 2.15) / stats.projectileSpeed))
          : Math.max(0.48, Math.min(0.92, (reach * 2.3) / stats.projectileSpeed));

        for (let m = 0; m < count; m++) {
          if (this.projectiles.length >= MAX_ACTIVE_PROJECTILES) break;
          const sideSign = m % 2 === 0 ? 1 : -1;
          const layer = Math.floor(m / 2);
          const aimJitter = isInfinity
            ? (m - (count - 1) / 2) * 0.045
            : (m - (count - 1) / 2) * 0.11;
          const semiMinor = isInfinity
            ? Math.min(92, 18 + layer * 15 + reach * 0.08)
            : 26 + layer * 12;

          this.projectiles.push({
            id: this.nextEntityId++,
            ownerTowerId: tower.id,
            style: pStyle,
            x: tower.x,
            y: tower.y,
            vx: Math.cos(baseAngle) * stats.projectileSpeed,
            vy: Math.sin(baseAngle) * stats.projectileSpeed,
            curveRate: 0,
            rotation: baseAngle,
            damage: stats.effectiveDamage,
            pierceLeft: stats.effectivePierce,
            splashRadius: stats.splashRadius,
            slowFactor: stats.slowFactor,
            slowDuration: stats.slowDuration,
            burnDps: stats.effectiveBurnDps,
            foxDamageMult: stats.effectiveFoxMult,
            knockback: stats.effectiveKnockback,
            savageCritChance: stats.effectiveCritChance,
            armorPiercing,
            canHitCamo: stats.effectiveCamo,
            hitEnemyIds: new Set<number>(),
            age: 0,
            maxLifetime: baseLoopLife + (isInfinity ? m * 0.02 : 0),
            color: projColor,
            motionMode: 'ellipse_return',
            originX: tower.x,
            originY: tower.y,
            aimAngle: baseAngle + aimJitter,
            semiMajor: reach * 0.5,
            semiMinor,
            sideSign,
            returnPhaseReset: false,
          });
        }
        continue;
      }

      // ARCHETYPE E: Heavenly Sky-Pillars & Orbital Meteors raining directly from the sky onto targets!
      if (
        pStyle === 'surge_pillar' ||
        pStyle === 'star_comet' ||
        pStyle === 'antimatter' ||
        pStyle === 'god_wrath' ||
        pStyle === 'corona_flare'
      ) {
        for (let m = 0; m < count; m++) {
          if (this.projectiles.length >= MAX_ACTIVE_PROJECTILES) break;
          const scatter = m === 0 ? 0 : (m - (count - 1) / 2) * 24;
          const perpAng = baseAngle + Math.PI * 0.5;
          const strikeX = tx + Math.cos(perpAng) * scatter;
          const strikeY = ty + Math.sin(perpAng) * scatter;
          const startX = strikeX - (pStyle === 'surge_pillar' || pStyle === 'god_wrath' ? 0 : 28);
          const startY = strikeY - 135;
          const dropLife = pStyle === 'surge_pillar' ? 0.16 : 0.22 + (m % 3) * 0.03;

          this.projectiles.push({
            id: this.nextEntityId++,
            ownerTowerId: tower.id,
            style: pStyle,
            x: startX,
            y: startY,
            vx: (strikeX - startX) / dropLife,
            vy: (strikeY - startY) / dropLife,
            curveRate: 0,
            rotation: Math.atan2(strikeY - startY, strikeX - startX),
            damage: stats.effectiveDamage,
            pierceLeft: Math.max(1, stats.effectivePierce),
            splashRadius: Math.max(36, stats.splashRadius),
            slowFactor: stats.slowFactor,
            slowDuration: stats.slowDuration,
            burnDps: stats.effectiveBurnDps,
            foxDamageMult: stats.effectiveFoxMult,
            knockback: stats.effectiveKnockback,
            savageCritChance: stats.effectiveCritChance,
            armorPiercing,
            canHitCamo: stats.effectiveCamo,
            hitEnemyIds: null,
            age: 0,
            maxLifetime: dropLife,
            color: def.accentColor,
            motionMode: 'sky_drop',
            originX: startX,
            originY: startY,
            targetX: strikeX,
            targetY: strikeY,
          });
        }
        continue;
      }

      // ARCHETYPE F: Parabolic High-Arc Mortars & Persistent Ground Hazard Zone Flasks!
      if (
        pStyle === 'honey' ||
        pStyle === 'acid' ||
        pStyle === 'egg_bomb' ||
        pStyle === 'cannonball' ||
        pStyle === 'broth_splash' ||
        pStyle === 'miasma_vial' ||
        pStyle === 'abyss_whirl' ||
        pStyle === 'black_hole'
      ) {
        const zoneKind: HazardZoneStyle | undefined =
          pStyle === 'honey'
            ? 'honey'
            : pStyle === 'acid'
            ? 'acid'
            : pStyle === 'miasma_vial'
            ? 'miasma'
            : pStyle === 'abyss_whirl'
            ? 'whirlpool'
            : pStyle === 'black_hole'
            ? 'singularity'
            : undefined;
        const dist = Math.max(36, Math.hypot(tx - tower.x, ty - tower.y));
        const flightTime = Math.max(0.2, Math.min(0.54, dist / Math.max(380, stats.projectileSpeed)));
        const arcH = Math.min(62, 26 + dist * 0.14);

        for (let m = 0; m < count; m++) {
          if (this.projectiles.length >= MAX_ACTIVE_PROJECTILES) break;
          const scatter = count === 1 ? 0 : (m - (count - 1) / 2) * 22;
          const perpAng = baseAngle + Math.PI * 0.5;
          const landX = tx + Math.cos(perpAng) * scatter;
          const landY = ty + Math.sin(perpAng) * scatter;

          this.projectiles.push({
            id: this.nextEntityId++,
            ownerTowerId: tower.id,
            style: pStyle,
            x: tower.x,
            y: tower.y,
            vx: (landX - tower.x) / flightTime,
            vy: (landY - tower.y) / flightTime,
            curveRate: 0,
            rotation: baseAngle,
            damage: stats.effectiveDamage,
            pierceLeft: Math.max(1, stats.effectivePierce),
            splashRadius: Math.max(32, stats.splashRadius),
            slowFactor: stats.slowFactor,
            slowDuration: stats.slowDuration,
            burnDps: stats.effectiveBurnDps,
            foxDamageMult: stats.effectiveFoxMult,
            knockback: stats.effectiveKnockback,
            savageCritChance: stats.effectiveCritChance,
            armorPiercing,
            canHitCamo: stats.effectiveCamo,
            hitEnemyIds: null,
            age: 0,
            maxLifetime: flightTime,
            color: def.accentColor,
            motionMode: 'lob_arc',
            originX: tower.x,
            originY: tower.y,
            targetX: landX,
            targetY: landY,
            arcHeight: arcH,
            spawnsZone: zoneKind,
          });
        }
        continue;
      }

      // ARCHETYPE G & H: Sweeping Blade Crescents, Crimson Dash-Streaks, Reality Rifts & Directed Volleys!
      const spreadStep =
        pStyle === 'feather_slash' || pStyle === 'moon_slash' || pStyle === 'kanabo_crush'
          ? 0.24
          : pStyle === 'cactus_needle'
          ? 0.19
          : 0.13;
      const specMode =
        pStyle === 'shadow_talon'
          ? 'dash_streak'
          : pStyle === 'rift_slash'
          ? 'rift_cross'
          : 'linear';

      for (let m = 0; m < count; m++) {
        if (this.projectiles.length >= MAX_ACTIVE_PROJECTILES) break;
        const angOffset = count === 1 ? 0 : (m - (count - 1) / 2) * spreadStep;
        const ang = baseAngle + angOffset;
        const speed = stats.projectileSpeed;
        const maxLife = (stats.effectiveRange + 75) / speed;
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);

        this.projectiles.push({
          id: this.nextEntityId++,
          ownerTowerId: tower.id,
          style: pStyle,
          x: tower.x + cosA * 14,
          y: tower.y + sinA * 14,
          vx: cosA * speed,
          vy: sinA * speed,
          curveRate: 0,
          rotation: ang,
          damage: stats.effectiveDamage,
          pierceLeft: stats.effectivePierce,
          splashRadius: stats.splashRadius,
          slowFactor: stats.slowFactor,
          slowDuration: stats.slowDuration,
          burnDps: stats.effectiveBurnDps,
          foxDamageMult: stats.effectiveFoxMult,
          knockback: stats.effectiveKnockback,
          savageCritChance: stats.effectiveCritChance,
          armorPiercing,
          canHitCamo: stats.effectiveCamo,
          hitEnemyIds: null,
          age: 0,
          maxLifetime: maxLife,
          color: def.accentColor,
          motionMode: specMode,
          originX: tower.x,
          originY: tower.y,
        });
      }
    }

    if (towerDirectKillPossible) {
      this.compactAliveEnemies();
    }

    // 3.5. Tick Persistent Ground Hazard Zones (Honey puddles, Acid/Miasma pools, Whirlpools, Black Holes!)
    if (this.hazardZones.length > 0) {
      this.tickHazardZones(dt);
    }

    // 4. Advance projectiles & resolve collisions via 16x11 Spatial Grid
    if (this.projectiles.length > 0) {
      this.rebuildSpatialGrid();
      this.inProjectilePhase = true;
      const buckets = this.spatialBuckets;
      let writeProj = 0;

      for (let pIdx = 0; pIdx < this.projectiles.length; pIdx++) {
        const p = this.projectiles[pIdx];
        p.age += dt;
        const mode = p.motionMode ?? 'linear';

        // Lobbed mortars & Sky-drop pillars detonate directly at (targetX, targetY) upon arrival!
        if (mode === 'lob_arc' || mode === 'sky_drop') {
          if (p.age >= p.maxLifetime) {
            const lx = p.targetX ?? p.x;
            const ly = p.targetY ?? p.y;
            this.applySplashHit(p, lx, ly);
            if (mode === 'sky_drop' && this.beams.length < MAX_ACTIVE_BEAMS) {
              this.beams.push({
                kind: 'laser',
                points: [
                  { x: lx, y: ly - 95 },
                  { x: lx, y: ly },
                ],
                width: p.style === 'corona_flare' || p.style === 'antimatter' ? 5 : 4,
                outerColor: p.color,
                coreColor: '#FFFFFF',
                age: 0,
                lifetime: 0.16,
              });
            }
            if (p.spawnsZone) {
              this.spawnHazardZone(p, lx, ly);
            }
            continue;
          }
          const t = p.age / p.maxLifetime;
          p.x = p.originX! + (p.targetX! - p.originX!) * t;
          p.y = p.originY! + (p.targetY! - p.originY!) * t;
          if (p.style === 'abyss_whirl' || p.style === 'black_hole') {
            p.rotation += dt * 18;
          }
          this.projectiles[writeProj++] = p;
          continue;
        }

        if (p.age >= p.maxLifetime) continue;

        if (mode === 'ellipse_return') {
          const prog = p.age / p.maxLifetime;
          if (!p.returnPhaseReset && prog >= 0.5) {
            p.returnPhaseReset = true;
            if (p.hitEnemyIds) p.hitEnemyIds.clear();
          }
          const theta = Math.PI * 2 * prog;
          const fwd = p.semiMajor! * (1 - Math.cos(theta));
          const lat = p.sideSign! * p.semiMinor! * Math.sin(theta);
          const cosA = Math.cos(p.aimAngle!);
          const sinA = Math.sin(p.aimAngle!);
          const prevX = p.x;
          const prevY = p.y;
          p.x = p.originX! + cosA * fwd - sinA * lat;
          p.y = p.originY! + sinA * fwd + cosA * lat;
          p.vx = (p.x - prevX) / Math.max(0.001, dt);
          p.vy = (p.y - prevY) / Math.max(0.001, dt);
          if (p.style === 'infinity_blade') {
            p.rotation = Math.atan2(p.vy, p.vx);
          } else {
            p.rotation += dt * 20;
          }
        } else {
          if (p.curveRate !== 0) {
            const curAng = Math.atan2(p.vy, p.vx) + p.curveRate * dt;
            const spd = Math.hypot(p.vx, p.vy);
            p.vx = Math.cos(curAng) * spd;
            p.vy = Math.sin(curAng) * spd;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.style === 'shuriken' || p.style === 'rift_slash') {
            p.rotation += dt * 18;
          } else {
            p.rotation = Math.atan2(p.vy, p.vx);
          }
        }

        if (this.enemies.length > 0) {
          const cCol = Math.max(0, Math.min(SPATIAL_COLS - 1, (p.x | 0) >> SPATIAL_CELL_SHIFT));
          const cRow = Math.max(0, Math.min(SPATIAL_ROWS - 1, (p.y | 0) >> SPATIAL_CELL_SHIFT));
          const rMin = cRow > 0 ? cRow - 1 : 0;
          const rMax = cRow < SPATIAL_ROWS - 1 ? cRow + 1 : SPATIAL_ROWS - 1;
          const cMin = cCol > 0 ? cCol - 1 : 0;
          const cMax = cCol < SPATIAL_COLS - 1 ? cCol + 1 : SPATIAL_COLS - 1;
          const extraRadius =
            p.style === 'infinity_blade'
              ? 16
              : p.splashRadius > 0 ||
                p.style === 'feather_slash' ||
                p.style === 'moon_slash' ||
                p.style === 'rift_slash'
              ? 12
              : 8;

          for (let r = rMin; r <= rMax && p.pierceLeft > 0; r++) {
            const rowBase = r * SPATIAL_COLS;
            for (let c = cMin; c <= cMax && p.pierceLeft > 0; c++) {
              const bucket = buckets[rowBase + c];
              // Snapshot bucket length so newly split child bugs don't get double-pierced in same cell scan
              const bLen = bucket.length;
              for (let b = 0; b < bLen; b++) {
                const e = this.enemies[bucket[b]];
                if (!e || e.alive === false) continue;
                if (p.hitEnemyIds !== null && p.hitEnemyIds.has(e.id)) continue;
                const eDef = ENEMY_DEFS[e.typeId];
                if (eDef.isCamo && !p.canHitCamo) continue;

                const ex = e.x!;
                const ey = e.y!;
                const dx = p.x - ex;
                const dy = p.y - ey;
                const hitDist = eDef.radius + extraRadius;

                if (dx * dx + dy * dy <= hitDist * hitDist) {
                  if (p.pierceLeft > 1 || mode === 'ellipse_return') {
                    if (p.hitEnemyIds === null) p.hitEnemyIds = new Set<number>();
                    p.hitEnemyIds.add(e.id);
                  }

                  if (p.splashRadius > 0 && mode !== 'ellipse_return') {
                    this.applySplashHit(p, ex, ey);
                    p.pierceLeft--;
                  } else {
                    this.damageEnemy(e, p.damage, p);
                    if (mode === 'ellipse_return' && p.splashRadius > 0) {
                      this.spawnPixelBurst(ex, ey, 2, p.color);
                    }
                    p.pierceLeft--;
                  }

                  if (p.pierceLeft <= 0) {
                    break;
                  }
                }
              }
            }
          }
        }

        // Returning boomerangs stay visually in flight back to the Chicken even if pierce caps out!
        if (p.pierceLeft > 0 || mode === 'ellipse_return') {
          this.projectiles[writeProj++] = p;
        }
      }

      this.projectiles.length = writeProj;
      this.inProjectilePhase = false;
      this.compactAliveEnemies();
    }

    // 5. Update beams, pixel rings, particles & floating popups (in-place compaction)
    let writeBeam = 0;
    for (let i = 0; i < this.beams.length; i++) {
      const bm = this.beams[i];
      bm.age += dt;
      if (bm.age < bm.lifetime) {
        this.beams[writeBeam++] = bm;
      }
    }
    this.beams.length = writeBeam;
    let writeRing = 0;
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      r.age += dt;
      if (r.age < r.lifetime) {
        this.rings[writeRing++] = r;
      }
    }
    this.rings.length = writeRing;

    let writePt = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const pt = this.particles[i];
      pt.age += dt;
      if (pt.age < pt.lifetime) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        this.particles[writePt++] = pt;
      }
    }
    this.particles.length = writePt;

    let writePop = 0;
    for (let i = 0; i < this.popups.length; i++) {
      const pop = this.popups[i];
      pop.age += dt;
      if (pop.age < pop.lifetime) {
        pop.y += pop.vy * dt;
        this.popups[writePop++] = pop;
      }
    }
    this.popups.length = writePop;

    // 6. Check Wave Complete! (Clicker locks immediately when wave ends!)
    if (
      this.waveActive &&
      this.pendingSpawnIdx >= this.pendingSpawns.length &&
      this.enemies.length === 0
    ) {
      this.waveActive = false;
      this.pendingSpawns = [];
      this.pendingSpawnIdx = 0;
      this.clickTimestampsMs = [];
      this.autoPeckAccumulator = 0;

      // Golden Corn Silo wave-clear harvest dividend!
      const siloRate = getCornSiloDividendRate(this.clickerLevels.cornSilo);
      if (siloRate > 0 && this.waveCornHarvested > 0 && !this.isSandboxMode()) {
        const dividend = Math.max(1, Math.round(this.waveCornHarvested * siloRate));
        this.corn += dividend;
        this.totalCornClicked += dividend;
        const nestPt = getPointAlongPath(totalPathLen);
        this.spawnMapPopup(`SILO +${dividend} CORN!`, nestPt.x, nestPt.y - 30, '#FACC15', 1.1);
        this.spawnPixelBurst(nestPt.x, nestPt.y, 10, '#FACC15');
        this.audio.playUpgrade();
      }

      if (this.waveNumber === CAMPAIGN_WAVES && !this.freeplayUnlocked) {
        if (this.isSandboxMode()) {
          this.freeplayUnlocked = true;
        } else {
          this.status = 'victory_prompt';
          const bankRes = this.bankPendingRunBugs();
          this.lastVictoryEggsEarned = bankRes.eggsEarned;
        }
      }
      this.waveNumber++;
      this.notifyUi();
    }
  }

  private getOrCreateStand(tower: PlacedChicken): ActiveStand {
    let stand = this.stands.find((s) => s.ownerTowerId === tower.id);
    if (!stand) {
      stand = {
        ownerTowerId: tower.id,
        x: tower.x - 14,
        y: tower.y - 10,
        angle: tower.angle,
        targetEnemyId: null,
        punchAnim: 0,
        punchCount: 0,
        state: 'hover',
      };
      this.stands.push(stand);
    }
    return stand;
  }

  private updateStandUserTower(tower: PlacedChicken, dt: number): void {
    const stand = this.getOrCreateStand(tower);
    stand.punchAnim = Math.max(0, stand.punchAnim - dt * 6.5);

    const stats = this.getEffectiveChickenStats(tower);
    const target = this.enemies.length > 0 ? this.pickTargetForTower(tower, stats) : null;

    if (!target) {
      stand.state = 'hover';
      stand.targetEnemyId = null;
      const side = Math.cos(tower.angle) < -0.15 ? 14 : -14;
      const hoverX = tower.x + side;
      const hoverY = tower.y - 10 + Math.sin(this.waveElapsedSec * 4.5 + tower.id) * 2.5;
      const dx = hoverX - stand.x;
      const dy = hoverY - stand.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.8) {
        const move = Math.min(dist, Math.max(380, stats.projectileSpeed * 0.75) * dt);
        stand.x += (dx / dist) * move;
        stand.y += (dy / dist) * move;
      }
      stand.angle = tower.angle;
      return;
    }

    stand.targetEnemyId = target.id;
    const targetDef = ENEMY_DEFS[target.typeId];
    const tx = target.x!;
    const ty = target.y!;
    tower.angle = Math.atan2(ty - tower.y, tx - tower.x);

    const dx = tx - stand.x;
    const dy = ty - stand.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      stand.angle = Math.atan2(dy, dx);
    }

    const meleeStopDist = Math.max(13, targetDef.radius * 0.65);
    if (dist > meleeStopDist + 1.5) {
      const step = Math.min(dist - meleeStopDist, stats.projectileSpeed * dt);
      stand.x += (dx / dist) * step;
      stand.y += (dy / dist) * step;
    }

    const punchReach = targetDef.radius + 32;
    if (dist > punchReach) {
      stand.state = 'charging';
      if (Math.random() < dt * 10) {
        this.spawnPixelBurst(stand.x, stand.y, 1, tower.tier === 3 ? '#FEF08A' : '#C084FC');
      }
      return;
    }

    stand.state = 'punching';
    tower.recoil = Math.max(tower.recoil, 0.55);

    if (tower.cooldown > 0) return;

    tower.cooldown = 1 / Math.max(0.2, stats.effectiveFireRate);
    tower.recoil = 1.0;
    stand.punchAnim = 1.0;
    stand.punchCount++;

    const isRequiem = tower.tier === 3;
    const punchCarrier: ActiveProjectile = {
      id: this.nextEntityId++,
      ownerTowerId: tower.id,
      style: 'stand_fist',
      x: tx,
      y: ty,
      vx: 0,
      vy: 0,
      curveRate: 0,
      rotation: stand.angle,
      damage: stats.effectiveDamage,
      pierceLeft: stats.effectivePierce,
      splashRadius: stats.splashRadius,
      slowFactor: stats.slowFactor,
      slowDuration: stats.slowDuration,
      burnDps: stats.effectiveBurnDps,
      foxDamageMult: stats.effectiveFoxMult,
      knockback: stats.effectiveKnockback,
      savageCritChance: stats.effectiveCritChance,
      armorPiercing: true,
      canHitCamo: stats.effectiveCamo,
      hitEnemyIds: null,
      age: 0,
      maxLifetime: 0.05,
      color: isRequiem ? '#FACC15' : '#C084FC',
    };

    const targetIdBeforeHit = target.id;
    this.damageEnemy(target, stats.effectiveDamage, punchCarrier);
    let hits = 1;

    if (stats.splashRadius > 0 && hits < stats.effectivePierce) {
      const snapLen = this.enemies.length;
      for (let i = 0; i < snapLen; i++) {
        if (hits >= stats.effectivePierce) break;
        const e = this.enemies[i];
        if (e.alive === false || e.id === targetIdBeforeHit) continue;
        const eDef = ENEMY_DEFS[e.typeId];
        if (eDef.isCamo && !stats.effectiveCamo) continue;
        const cdx = e.x! - tx;
        const cdy = e.y! - ty;
        const maxR = stats.splashRadius + eDef.radius;
        if (cdx * cdx + cdy * cdy <= maxR * maxR) {
          this.damageEnemy(e, stats.effectiveDamage, punchCarrier);
          hits++;
        }
      }
    }

    this.spawnPixelBurst(tx, ty, 3, isRequiem ? '#FEF08A' : '#E879F9');
    if (stand.punchCount % 2 === 0) {
      this.spawnRing(
        tx,
        ty,
        Math.round(stats.splashRadius * 0.65),
        isRequiem ? '#FACC15' : '#C084FC'
      );
    }
    if (stand.punchCount % 8 === 1) {
      this.spawnMapPopup('STAR!', stand.x, stand.y - 18, isRequiem ? '#FEF08A' : '#F0ABFC', 1.0);
    }
  }

  /**
   * Chain-Jumping Forked Lightning ('lightning' & 'tesla_arc'):
   * Zaps primary target and arcs enemy-to-enemy down the path!
   */
  private fireChainLightningAttack(
    tower: PlacedChicken,
    stats: EffectiveChickenStats,
    primaryTarget: ActiveEnemy
  ): void {
    const def = CHICKEN_DEFS[tower.typeId];
    const isTesla = def.projectileStyle === 'tesla_arc';
    const outerCol = isTesla ? '#38BDF8' : '#A855F7';
    const coreCol = isTesla ? '#E0F2FE' : '#F5D0FE';
    const arcCount = Math.min(4, Math.max(1, stats.effectiveProjectiles));
    const maxJumps = Math.min(14, Math.max(2, stats.effectivePierce));
    const jumpRadiusSq = (isTesla ? 128 : 108) ** 2;

    const carrier: ActiveProjectile = {
      id: this.nextEntityId++,
      ownerTowerId: tower.id,
      style: def.projectileStyle,
      x: tower.x,
      y: tower.y,
      vx: 0,
      vy: 0,
      curveRate: 0,
      rotation: 0,
      damage: stats.effectiveDamage,
      pierceLeft: maxJumps,
      splashRadius: stats.splashRadius,
      slowFactor: stats.slowFactor,
      slowDuration: stats.slowDuration,
      burnDps: stats.effectiveBurnDps,
      foxDamageMult: stats.effectiveFoxMult,
      knockback: stats.effectiveKnockback,
      savageCritChance: stats.effectiveCritChance,
      armorPiercing: true,
      canHitCamo: stats.effectiveCamo,
      hitEnemyIds: null,
      age: 0,
      maxLifetime: 0.05,
      color: def.accentColor,
    };

    const usedStarters = new Set<number>();
    const snapLen = this.enemies.length;

    for (let a = 0; a < arcCount; a++) {
      let current: ActiveEnemy | null = a === 0 ? primaryTarget : null;
      if (!current || current.alive === false) {
        let bestD = Infinity;
        for (let i = 0; i < snapLen; i++) {
          const cand = this.enemies[i];
          if (!cand || cand.alive === false || usedStarters.has(cand.id)) continue;
          const eDef = ENEMY_DEFS[cand.typeId];
          if (eDef.isCamo && !stats.effectiveCamo) continue;
          const dSq = (cand.x! - tower.x) ** 2 + (cand.y! - tower.y) ** 2;
          if (dSq <= (stats.effectiveRange + eDef.radius) ** 2 && dSq < bestD) {
            bestD = dSq;
            current = cand;
          }
        }
        if (!current && primaryTarget.alive !== false) {
          current = primaryTarget;
        }
      }
      if (!current) continue;
      usedStarters.add(current.id);

      const visited = new Set<number>();
      const points: { x: number; y: number }[] = [{ x: tower.x, y: tower.y - 4 }];

      for (let hop = 0; hop < maxJumps && current; hop++) {
        visited.add(current.id);
        const cx = current.x!;
        const cy = current.y!;
        points.push({ x: cx, y: cy });
        const hopDmg = stats.effectiveDamage * Math.max(0.55, 1 - hop * 0.04);
        this.damageEnemy(current, hopDmg, carrier);
        if (hop === 0 && stats.splashRadius > 0) {
          this.spawnRing(cx, cy, stats.splashRadius, outerCol);
        }

        // Pick closest unvisited enemy within chain jump radius!
        let nextHop: ActiveEnemy | null = null;
        let bestHopSq = jumpRadiusSq;
        for (let i = 0; i < snapLen; i++) {
          const cand = this.enemies[i];
          if (!cand || cand.alive === false || visited.has(cand.id)) continue;
          const eDef = ENEMY_DEFS[cand.typeId];
          if (eDef.isCamo && !stats.effectiveCamo) continue;
          const dSq = (cand.x! - cx) ** 2 + (cand.y! - cy) ** 2;
          if (dSq <= bestHopSq) {
            bestHopSq = dSq;
            nextHop = cand;
          }
        }
        current = nextHop;
      }

      if (points.length >= 2 && this.beams.length < MAX_ACTIVE_BEAMS) {
        this.beams.push({
          kind: 'chain',
          points,
          width: isTesla ? 3 : 2,
          outerColor: outerCol,
          coreColor: coreCol,
          age: 0,
          lifetime: 0.16,
        });
      }
    }
  }

  /**
   * Instant Piercing Laser / Rail / Solar / Atomic Beam Attack!
   */
  private fireLaserBeamAttack(
    tower: PlacedChicken,
    stats: EffectiveChickenStats,
    baseAngle: number,
    tx: number,
    ty: number
  ): void {
    const def = CHICKEN_DEFS[tower.typeId];
    const pStyle = def.projectileStyle;
    const outerCol =
      pStyle === 'matrix_beam'
        ? '#10B981'
        : pStyle === 'ankh_beam' || pStyle === 'judgment_ray'
        ? '#FACC15'
        : pStyle === 'genesis_beam'
        ? '#38BDF8'
        : '#22D3EE';
    const coreCol = pStyle === 'genesis_beam' ? '#FEF08A' : '#FFFFFF';
    const beamCount = Math.min(6, Math.max(1, stats.effectiveProjectiles));
    const beamLen = stats.effectiveRange + 28;
    const corridorHalf =
      pStyle === 'atomic_breath' ? 24 : pStyle === 'genesis_beam' ? 18 : 13;
    const beamPxWidth =
      pStyle === 'atomic_breath' ? 5 : pStyle === 'genesis_beam' ? 4 : 3;

    const carrier: ActiveProjectile = {
      id: this.nextEntityId++,
      ownerTowerId: tower.id,
      style: pStyle,
      x: tx,
      y: ty,
      vx: 0,
      vy: 0,
      curveRate: 0,
      rotation: baseAngle,
      damage: stats.effectiveDamage,
      pierceLeft: stats.effectivePierce,
      splashRadius: stats.splashRadius,
      slowFactor: stats.slowFactor,
      slowDuration: stats.slowDuration,
      burnDps: stats.effectiveBurnDps,
      foxDamageMult: stats.effectiveFoxMult,
      knockback: stats.effectiveKnockback,
      savageCritChance: stats.effectiveCritChance,
      armorPiercing: stats.effectiveArmorPierce,
      canHitCamo: stats.effectiveCamo,
      hitEnemyIds: null,
      age: 0,
      maxLifetime: 0.05,
      color: outerCol,
    };

    const snapLen = this.enemies.length;
    for (let b = 0; b < beamCount; b++) {
      const ang = baseAngle + (beamCount === 1 ? 0 : (b - (beamCount - 1) / 2) * 0.09);
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const sx = tower.x + cosA * 12;
      const sy = tower.y + sinA * 12;
      const ex = tower.x + cosA * beamLen;
      const ey = tower.y + sinA * beamLen;

      if (this.beams.length < MAX_ACTIVE_BEAMS) {
        this.beams.push({
          kind: 'laser',
          points: [
            { x: sx, y: sy },
            { x: ex, y: ey },
          ],
          width: beamPxWidth,
          outerColor: outerCol,
          coreColor: coreCol,
          age: 0,
          lifetime: 0.14,
        });
      }

      let hits = 0;
      for (let i = 0; i < snapLen && hits < stats.effectivePierce; i++) {
        const e = this.enemies[i];
        if (!e || e.alive === false) continue;
        const eDef = ENEMY_DEFS[e.typeId];
        if (eDef.isCamo && !stats.effectiveCamo) continue;

        const rx = e.x! - tower.x;
        const ry = e.y! - tower.y;
        const along = rx * cosA + ry * sinA;
        if (along < -eDef.radius || along > beamLen + eDef.radius) continue;
        const perp = Math.abs(-rx * sinA + ry * cosA);
        if (perp <= corridorHalf + eDef.radius) {
          this.damageEnemy(e, stats.effectiveDamage, carrier);
          hits++;
        }
      }
    }

    if (stats.splashRadius > 0) {
      this.spawnRing(tx, ty, Math.min(72, stats.splashRadius), outerCol);
    }
    this.spawnPixelBurst(tx, ty, 4, outerCol);
  }

  /**
   * Persistent Ground Hazard Zones (Sticky Honey, Acid/Miasma Pools, Whirlpools, Singularity Wells)!
   */
  private spawnHazardZone(proj: ActiveProjectile, cx: number, cy: number): void {
    const zStyle = proj.spawnsZone;
    if (!zStyle) return;
    if (this.hazardZones.length >= MAX_ACTIVE_ZONES) {
      // Recycle oldest zone in-place
      this.hazardZones.shift();
    }
    const radius = Math.max(
      28,
      Math.min(
        92,
        Math.round(proj.splashRadius * (zStyle === 'singularity' || zStyle === 'whirlpool' ? 0.68 : 0.78))
      )
    );
    const col =
      zStyle === 'honey'
        ? '#F59E0B'
        : zStyle === 'acid'
        ? '#84CC16'
        : zStyle === 'miasma'
        ? '#10B981'
        : zStyle === 'whirlpool'
        ? '#06B6D4'
        : '#A855F7';
    this.hazardZones.push({
      id: this.nextEntityId++,
      ownerTowerId: proj.ownerTowerId,
      zoneStyle: zStyle,
      x: cx,
      y: cy,
      radius,
      tickDamage: Math.max(0.4, proj.damage * 0.22 + proj.burnDps * 0.14),
      slowFactor: Math.max(0.22, proj.slowFactor),
      slowDuration: Math.max(0.6, proj.slowDuration * 0.5),
      burnDps: proj.burnDps,
      foxDamageMult: proj.foxDamageMult,
      canHitCamo: proj.canHitCamo,
      color: col,
      age: 0,
      maxLifetime: zStyle === 'singularity' ? 0.72 : 2.1,
      tickCooldown: zStyle === 'singularity' ? 0.18 : 0.24,
    });
  }

  private tickHazardZones(dt: number): void {
    let writeZ = 0;
    let didDamage = false;
    for (let zIdx = 0; zIdx < this.hazardZones.length; zIdx++) {
      const z = this.hazardZones[zIdx];
      z.age += dt;
      if (z.age >= z.maxLifetime) continue;

      z.tickCooldown -= dt;
      if (z.tickCooldown <= 0 && this.enemies.length > 0) {
        z.tickCooldown = 0.28;
        const zoneCarrier: ActiveProjectile = {
          id: z.id,
          ownerTowerId: z.ownerTowerId,
          style: 'acid',
          x: z.x,
          y: z.y,
          vx: 0,
          vy: 0,
          curveRate: 0,
          rotation: 0,
          damage: z.tickDamage,
          pierceLeft: 30,
          splashRadius: z.radius,
          slowFactor: z.slowFactor,
          slowDuration: z.slowDuration,
          burnDps: z.burnDps,
          foxDamageMult: z.foxDamageMult,
          knockback: z.zoneStyle === 'singularity' ? 12 : 0,
          savageCritChance: 0,
          armorPiercing: true,
          canHitCamo: z.canHitCamo,
          hitEnemyIds: null,
          age: 0,
          maxLifetime: 0.05,
          color: z.color,
        };
        const snapLen = this.enemies.length;
        let hits = 0;
        for (let i = 0; i < snapLen && hits < 28; i++) {
          const e = this.enemies[i];
          if (!e || e.alive === false) continue;
          const eDef = ENEMY_DEFS[e.typeId];
          if (eDef.isCamo && !z.canHitCamo) continue;
          const dx = e.x! - z.x;
          const dy = e.y! - z.y;
          const maxR = z.radius + eDef.radius;
          if (dx * dx + dy * dy <= maxR * maxR) {
            this.damageEnemy(e, z.tickDamage, zoneCarrier);
            didDamage = true;
            hits++;
          }
        }
      }
      this.hazardZones[writeZ++] = z;
    }
    this.hazardZones.length = writeZ;
    if (didDamage) {
      this.compactAliveEnemies();
    }
  }

  private pickTargetForTower(
    tower: PlacedChicken,
    stats: EffectiveChickenStats
  ): ActiveEnemy | null {
    let best: ActiveEnemy | null = null;
    let bestScore = -Infinity;
    const tx = tower.x;
    const ty = tower.y;
    const baseRange = stats.effectiveRange;
    const mode = tower.targetMode;

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.alive === false) continue;
      const def = ENEMY_DEFS[e.typeId];
      if (def.isCamo && !stats.effectiveCamo) continue;

      if (e.x === undefined || e.y === undefined) {
        syncEnemyPathPosition(e);
      }
      const dx = e.x! - tx;
      const dy = e.y! - ty;
      const maxRange = baseRange + def.radius * 0.5;
      const distSq = dx * dx + dy * dy;
      if (distSq > maxRange * maxRange) continue;

      let score = 0;
      if (mode === 'first') score = e.distance;
      else if (mode === 'last') score = -e.distance;
      else if (mode === 'close') score = -distSq;
      else score = def.maxHp * 1000 + e.distance;

      if (score > bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }

  private applySplashHit(proj: ActiveProjectile, cx: number, cy: number): void {
    const ringCol =
      proj.style === 'snow' || proj.style === 'viking_axe'
        ? '#38BDF8'
        : proj.style === 'acid' ||
          proj.style === 'matrix_beam' ||
          proj.style === 'soul_wisp' ||
          proj.style === 'miasma_vial' ||
          proj.style === 'cactus_needle'
        ? '#34D399'
        : proj.style === 'honey' || proj.style === 'pebble_shot'
        ? '#FBBF24'
        : proj.style === 'plasma' ||
          proj.style === 'tesla_arc' ||
          proj.style === 'surge_pillar' ||
          proj.style === 'wyrm_orb' ||
          proj.style === 'overclock_bolt' ||
          proj.style === 'abyss_whirl' ||
          proj.style === 'atomic_breath'
        ? '#22D3EE'
        : proj.style === 'idol_note'
        ? '#F472B6'
        : proj.style === 'espresso_splash' ||
          proj.style === 'beacon_flare' ||
          proj.style === 'broth_splash' ||
          proj.style === 'revolver_slug' ||
          proj.style === 'kanabo_crush'
        ? '#F59E0B'
        : proj.style === 'chrono_orb'
        ? '#2DD4BF'
        : proj.style === 'infinity_blade'
        ? proj.color
        : proj.style === 'ion_lance' ||
          proj.style === 'antimatter' ||
          proj.style === 'iron_fist' ||
          proj.style === 'moon_slash' ||
          proj.style === 'shadow_talon'
        ? '#FB7185'
        : proj.style === 'stand_fist' ||
          proj.style === 'lightning' ||
          proj.style === 'black_hole' ||
          proj.style === 'star_comet' ||
          proj.style === 'rift_slash'
        ? '#C084FC'
        : proj.style === 'genesis_beam' ||
          proj.style === 'valkyrie_spear' ||
          proj.style === 'judgment_ray' ||
          proj.style === 'nature_prism' ||
          proj.style === 'god_wrath' ||
          proj.style === 'holy_hammer' ||
          proj.style === 'ankh_beam' ||
          proj.style === 'seraph_lance' ||
          proj.style === 'corona_flare'
        ? '#FEF08A'
        : proj.burnDps > 0
        ? '#F97316'
        : '#FDE047';
    this.spawnRing(cx, cy, proj.splashRadius, ringCol);
    this.spawnPixelBurst(cx, cy, 4, ringCol);

    if (this.inProjectilePhase) {
      // Fast O(local cells) splash lookup via 16x11 spatial grid!
      const reach = proj.splashRadius + 46;
      const cMin = Math.max(0, ((cx - reach) | 0) >> SPATIAL_CELL_SHIFT);
      const cMax = Math.min(SPATIAL_COLS - 1, ((cx + reach) | 0) >> SPATIAL_CELL_SHIFT);
      const rMin = Math.max(0, ((cy - reach) | 0) >> SPATIAL_CELL_SHIFT);
      const rMax = Math.min(SPATIAL_ROWS - 1, ((cy + reach) | 0) >> SPATIAL_CELL_SHIFT);
      const stamp = ++this.queryStampCounter;
      const maxExistingId = this.nextEntityId - 1;
      const buckets = this.spatialBuckets;

      for (let r = rMin; r <= rMax; r++) {
        const rowBase = r * SPATIAL_COLS;
        for (let c = cMin; c <= cMax; c++) {
          const bucket = buckets[rowBase + c];
          const bLen = bucket.length;
          for (let b = 0; b < bLen; b++) {
            const e = this.enemies[bucket[b]];
            if (!e || e.alive === false || e.id > maxExistingId) continue;
            if (this.enemyStampById.get(e.id) === stamp) continue;
            this.enemyStampById.set(e.id, stamp);

            const def = ENEMY_DEFS[e.typeId];
            if (def.isCamo && !proj.canHitCamo) continue;
            const dx = e.x! - cx;
            const dy = e.y! - cy;
            const maxR = proj.splashRadius + def.radius;
            if (dx * dx + dy * dy <= maxR * maxR) {
              this.damageEnemy(e, proj.damage, proj);
            }
          }
        }
      }
    } else {
      const snapLen = this.enemies.length;
      for (let i = 0; i < snapLen; i++) {
        const e = this.enemies[i];
        if (e.alive === false) continue;
        const def = ENEMY_DEFS[e.typeId];
        if (def.isCamo && !proj.canHitCamo) continue;
        const dx = e.x! - cx;
        const dy = e.y! - cy;
        const maxR = proj.splashRadius + def.radius;
        if (dx * dx + dy * dy <= maxR * maxR) {
          this.damageEnemy(e, proj.damage, proj);
        }
      }
    }
  }

  private damageEnemy(e: ActiveEnemy, rawDamage: number, proj: ActiveProjectile): void {
    if (e.alive === false) return;
    const def = ENEMY_DEFS[e.typeId];
    if (def.isCamo && !proj.canHitCamo) return;

    if (e.x === undefined || e.y === undefined) {
      syncEnemyPathPosition(e);
    }

    let dmg = rawDamage;
    if (def.isFoxBoss) {
      dmg *= proj.foxDamageMult;
    }
    if (def.isArmored && !proj.armorPiercing && e.vulnTimer <= 0) {
      dmg = Math.max(0.25, dmg * 0.45);
    }
    if (e.vulnTimer > 0) {
      dmg *= 1.35;
    }

    // 3x Savage Critical Strike!
    const isSavageCrit = proj.savageCritChance > 0 && Math.random() < proj.savageCritChance;
    if (isSavageCrit) {
      dmg *= 3.0;
      this.spawnPixelBurst(e.x!, e.y!, 5, '#FACC15');
      if (Math.random() < 0.35 || def.isFoxBoss) {
        this.spawnMapPopup('SAVAGE!', e.x!, e.y! - 16, '#FEF08A', 1.0);
      }
      this.audio.playSavageCrit();
    }

    const dealt = Math.min(Math.max(0, e.hp), dmg);
    if (proj.ownerTowerId > 0) {
      const owner = this.towerById.get(proj.ownerTowerId);
      if (owner) {
        owner.totalPopDamage += dealt;
      }
    }

    e.hp -= dmg;
    e.hitFlash = 1.0;

    // Path Knockback (pushes enemy backward along the path with brief KB immunity)!
    if (proj.knockback > 0 && e.kbCooldown <= 0 && e.hp > 0) {
      const oldCell = this.inProjectilePhase ? this.getSpatialCell(e.x!, e.y!) : -1;
      const kbDist = def.isFoxBoss ? proj.knockback * 0.38 : proj.knockback;
      e.distance = Math.max(0, e.distance - kbDist);
      e.kbCooldown = 0.45;
      syncEnemyPathPosition(e);
      if (this.inProjectilePhase && e.gridIdx !== undefined) {
        const newCell = this.getSpatialCell(e.x!, e.y!);
        if (newCell !== oldCell) {
          this.spatialBuckets[newCell].push(e.gridIdx);
        }
      }
    }

    if (proj.slowFactor > 0) {
      e.slowFactor = Math.max(e.slowFactor, proj.slowFactor);
      e.slowTimer = Math.max(e.slowTimer, proj.slowDuration);
    }
    if (proj.burnDps > 0) {
      e.burnDps = Math.max(e.burnDps, proj.burnDps);
      e.burnTimer = Math.max(e.burnTimer, 3.0);
    }

    if (e.hp <= 0) {
      this.defeatEnemy(e);
    }
  }

  private defeatEnemy(popped: ActiveEnemy): void {
    if (popped.alive === false) return;
    popped.alive = false;

    const def = ENEMY_DEFS[popped.typeId];
    if (popped.x === undefined || popped.y === undefined) {
      syncEnemyPathPosition(popped);
    }
    const px = popped.x!;
    const py = popped.y!;

    this.totalBugsPopped++;
    this.audio.playBugPop(def.isFoxBoss);

    // Auto-award & save +1 Gem Egg immediately every 1,000 enemies popped (NEVER in Sandbox Mode)!
    if (!this.isSandboxMode()) {
      const currentPool =
        PROGRESSION.getBugKillRemainder() + (this.totalBugsPopped - this.bugsBankedThisRun);
      if (currentPool >= BUGS_PER_EGG) {
        const bankRes = this.bankPendingRunBugs();
        if (bankRes.eggsEarned > 0) {
          const nestPt = getPointAlongPath(getTotalPathLength());
          this.spawnMapPopup(
            `+${bankRes.eggsEarned} GEM EGG!`,
            nestPt.x,
            nestPt.y - 36,
            '#F472B6',
            1.15
          );
          this.spawnRing(nestPt.x, nestPt.y, 52, '#F472B6');
          this.audio.playUpgrade();
        }
      }
    }

    if (def.isFoxBoss) {
      const popCol =
        popped.typeId === 'fox_cosmic'
          ? '#22D3EE'
          : popped.typeId === 'fox_phoenix'
          ? '#FACC15'
          : '#F97316';
      const popLabel =
        popped.typeId === 'fox_cosmic'
          ? 'COSMIC SLAIN!'
          : popped.typeId === 'fox_phoenix'
          ? 'PHOENIX SLAIN!'
          : 'FOX SLAIN!';
      this.spawnRing(px, py, def.radius * 2.2, popCol);
      this.spawnPixelBurst(px, py, 16, def.bodyColor);
      this.spawnMapPopup(popLabel, px, py - 18, '#FDE047', 1.05);
    } else {
      this.spawnPixelBurst(px, py, 4, def.bodyColor);
    }

    let childIdx = 0;
    for (const childGroup of def.childrenOnPop) {
      for (let c = 0; c < childGroup.count; c++) {
        if (this.isSandboxMode() && this.enemies.length >= 900) break;
        const offsetDist = popped.distance - childIdx * 9;
        this.spawnEnemy(childGroup.type, offsetDist);
        childIdx++;
      }
    }
  }

  private spawnRing(x: number, y: number, maxRadius: number, color: string): void {
    if (this.rings.length >= MAX_ACTIVE_RINGS) return;
    this.rings.push({ x, y, maxRadius, color, age: 0, lifetime: 0.24 });
  }

  private spawnPixelBurst(x: number, y: number, count: number, color: string): void {
    const remainingSlots = MAX_ACTIVE_PARTICLES - this.particles.length;
    if (remainingSlots <= 0) return;
    const toSpawn = Math.min(count, remainingSlots);
    for (let i = 0; i < toSpawn; i++) {
      const ang = (Math.PI * 2 * i) / toSpawn + (Math.random() - 0.5) * 0.5;
      const spd = 35 + Math.random() * 75;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color,
        size: Math.random() < 0.35 ? 2 : 1,
        age: 0,
        lifetime: 0.22 + Math.random() * 0.16,
      });
    }
  }

  public spawnMapPopup(
    text: string,
    x: number,
    y: number,
    color: string,
    scale = 1
  ): void {
    if (this.popups.length >= MAX_ACTIVE_POPUPS) {
      // Overwrite oldest popup in-place instead of Array.shift()
      let oldestIdx = 0;
      let oldestAge = -1;
      for (let i = 0; i < this.popups.length; i++) {
        if (this.popups[i].age > oldestAge) {
          oldestAge = this.popups[i].age;
          oldestIdx = i;
        }
      }
      const slot = this.popups[oldestIdx];
      slot.text = text;
      slot.x = x;
      slot.y = y;
      slot.vy = -36;
      slot.color = color;
      slot.scale = scale;
      slot.age = 0;
      slot.lifetime = 0.72;
      return;
    }
    this.popups.push({
      text,
      x,
      y,
      vy: -36,
      color,
      scale,
      age: 0,
      lifetime: 0.72,
    });
  }
}
