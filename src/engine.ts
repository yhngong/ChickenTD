import { ChickenAudioEngine } from './audio';
import {
  CAMPAIGN_WAVES,
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
} from './map';
import { MUTATION_DEFS, PROGRESSION } from './progression';
import {
  ActiveEnemy,
  ActiveProjectile,
  ActiveStand,
  ChickenTierStats,
  ChickenTypeId,
  ClickResult,
  ClickerUpgradeId,
  DifficultyDef,
  DifficultyId,
  EggBankResult,
  EnemyTypeId,
  FloatingMapPopup,
  MapId,
  MutationTier,
  PixelParticle,
  PlacedChicken,
  RoundEndSummary,
  TargetMode,
  TdUpgradeId,
  UpgradeDef,
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
  effectiveKnockback: number;
  effectiveCritChance: number;
  mutationTier: MutationTier | null;
  plusLevel: number;
}

export const CLUCK_CANNON_CHARGE_SEC = 22;

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

  // Battle Cats style rechargeable Cluck Cannon (0..1)
  public cannonCharge = 0.5;
  public cannonFlash = 0;

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
  public rings: VisualRingEffect[] = [];
  public particles: PixelParticle[] = [];
  public popups: FloatingMapPopup[] = [];

  private pendingSpawns: PendingSpawn[] = [];
  private nextEntityId = 1;

  public onUiChange: (() => void) | null = null;
  public onAutoPeck: ((res: ClickResult) => void) | null = null;

  public getDifficulty(): DifficultyDef {
    return DIFFICULTY_DEFS[this.difficultyId];
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
   */
  public bankPendingRunBugs(): EggBankResult {
    const delta = Math.max(0, this.totalBugsPopped - this.bugsBankedThisRun);
    this.bugsBankedThisRun = this.totalBugsPopped;
    const res = PROGRESSION.bankBugsAfterRound(delta);
    this.eggsEarnedThisRun += res.eggsEarned;
    return res;
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

  public resetGame(): void {
    if (this.totalBugsPopped > this.bugsBankedThisRun) {
      this.bankPendingRunBugs();
    }
    setActiveMap(this.mapId);
    const diff = this.getDifficulty();
    this.corn = diff.startingCorn;
    this.totalCornClicked = 0;
    this.eggs = diff.startingEggs;
    this.maxEggs = diff.startingEggs;
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
    this.cannonCharge = 0.5;
    this.cannonFlash = 0;
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
    this.stands = [];
    this.enemies = [];
    this.projectiles = [];
    this.rings = [];
    this.particles = [];
    this.popups = [];
    this.pendingSpawns = [];
    this.notifyUi();
  }

  private notifyUi(): void {
    if (this.onUiChange) this.onUiChange();
  }

  public getCurrentCps(nowPerfMs = performance.now()): number {
    this.clickTimestampsMs = this.clickTimestampsMs.filter((t) => nowPerfMs - t < 1000);
    return this.clickTimestampsMs.length;
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

    const basketMult = getHarvestBasketMult(this.clickerLevels.harvestBasket);
    const crossedTwelve = Math.floor(this.waveClickCounter / 12) > Math.floor(prevCounter / 12);
    const isMegaCob = basketMult > 0 && crossedTwelve;
    const megaBonus = isMegaCob ? Math.round(baseVal * basketMult * waveMult * foremanMult) : 0;

    const earned = Math.max(
      1,
      Math.round(baseVal * strikeCount * rhythmMult * critMult * waveMult * foremanMult) + megaBonus
    );
    this.corn += earned;
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

    if (!this.waveActive) {
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
    this.notifyUi();
    return res;
  }

  public startNextWave(): boolean {
    if (this.waveActive || this.status === 'gameover') return false;
    if (this.status === 'victory_prompt') {
      this.status = 'playing';
      this.freeplayUnlocked = true;
    }

    const def = getWaveDefinition(this.waveNumber);
    const queue: PendingSpawn[] = [];
    for (const grp of def.groups) {
      for (let i = 0; i < grp.count; i++) {
        queue.push({
          spawnAtWaveTime: grp.startDelaySec + i * grp.intervalSec,
          enemyType: grp.enemyType,
        });
      }
    }
    queue.sort((a, b) => a.spawnAtWaveTime - b.spawnAtWaveTime);

    this.pendingSpawns = queue;
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
   * Battle Cats-style Cluck Cannon! Fires a sweeping shockwave beam down the whole path,
   * knocking back and damaging all active Bugs & Fox Bosses!
   */
  public fireCluckCannon(): boolean {
    if (this.status === 'gameover' || this.cannonCharge < 1) return false;
    if (!this.waveActive && this.enemies.length === 0) return false;

    this.cannonCharge = 0;
    this.cannonFlash = 1.0;
    this.audio.playCluckCannon();

    const totalLen = getTotalPathLength();
    for (let d = 0; d <= totalLen; d += 110) {
      const pt = getPointAlongPath(d);
      this.spawnRing(pt.x, pt.y, 48, d % 220 === 0 ? '#22D3EE' : '#FACC15');
      this.spawnPixelBurst(pt.x, pt.y, 4, '#FEF08A');
    }

    const nestPt = getPointAlongPath(totalLen);
    this.spawnMapPopup('CLUCK CANNON!', nestPt.x, nestPt.y - 34, '#22D3EE', 1.2);

    const waveDmg = Math.max(18, Math.round(24 * getWaveHpScale(this.waveNumber)));
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
      hitEnemyIds: new Set<number>(),
      age: 0,
      maxLifetime: 0.05,
      color: '#22D3EE',
    };

    const snapshot = [...this.enemies];
    for (const e of snapshot) {
      if (!this.enemies.includes(e)) continue;
      e.kbCooldown = 0; // Cannon always overrides knockback cooldown!
      this.damageEnemy(e, waveDmg, cannonCarrier);
    }

    this.notifyUi();
    return true;
  }

  public getPendingWaveEnemyTotal(): number {
    return this.pendingSpawns.length + this.enemies.length;
  }

  public getEffectiveChickenStats(tower: PlacedChicken): EffectiveChickenStats {
    const def = CHICKEN_DEFS[tower.typeId];
    const base = def.tiers[tower.tier];
    const mutTier = PROGRESSION.getMutation(tower.typeId);
    const mutDef = mutTier ? MUTATION_DEFS[mutTier] : null;
    const plusLv = PROGRESSION.getPlusLevel(tower.typeId);

    const plusDmgMult = 1 + plusLv * 0.04;
    const plusRateMult = 1 + Math.min(0.6, plusLv * 0.015);

    const mutDmg = mutDef ? mutDef.damageMult : 1.0;
    const mutRate = mutDef ? mutDef.fireRateMult : 1.0;
    const mutRange = mutDef ? mutDef.rangeMult : 1.0;
    const mutPierce = mutDef ? mutDef.bonusPierce : 0;
    const mutProj = mutDef ? mutDef.bonusProjectiles : 0;
    const mutFox = mutDef ? mutDef.foxMult : 1.0;
    const mutCamo = mutDef ? mutDef.grantsCamo : false;
    const mutCrit = mutDef ? mutDef.bonusCritChance : 0;
    const mutKb = mutDef ? mutDef.bonusKnockback : 0;

    const rangeMult = (1 + this.tdLevels.eagleRoost * 0.08) * mutRange;
    const rateMult = (1 + this.tdLevels.caffeinatedFeed * 0.11) * mutRate * plusRateMult;
    const bonusPierce = Math.ceil(this.tdLevels.razorTalons / 2) + mutPierce;
    const foxMult = base.foxDamageMult * (1 + this.tdLevels.razorTalons * 0.22) * mutFox;
    const hasCamo = base.camoSight || mutCamo || this.tdLevels.eagleRoost >= 3;
    const rawDamage = base.damage * mutDmg * plusDmgMult;
    const effectiveDamage = rawDamage >= 10 ? Math.round(rawDamage * 10) / 10 : Math.round(rawDamage * 100) / 100;
    const effectiveBurnDps = Math.round(base.burnDps * mutDmg * plusDmgMult * 10) / 10;

    return {
      ...base,
      effectiveDamage,
      effectiveBurnDps,
      effectiveRange: Math.round(base.range * rangeMult),
      effectiveFireRate: base.fireRate * rateMult,
      effectivePierce: base.pierce + bonusPierce,
      effectiveProjectiles: base.projectiles + mutProj,
      effectiveFoxMult: foxMult,
      effectiveCamo: hasCamo,
      effectiveKnockback: (base.knockback ?? 0) + mutKb,
      effectiveCritChance: Math.min(0.75, (base.savageCritChance ?? 0) + mutCrit),
      mutationTier: mutTier,
      plusLevel: plusLv,
    };
  }

  public placeChicken(typeId: ChickenTypeId, x: number, y: number): PlacedChicken | null {
    if (this.status === 'gameover') return null;
    if (!this.isChickenUnlocked(typeId)) return null;
    const cost = this.getTowerBaseCost(typeId);
    if (this.corn < cost) return null;
    if (!canPlaceChickenAt(x, y, this.towers)) return null;

    this.corn -= cost;
    const strongDefaults = new Set<ChickenTypeId>([
      'ranger',
      'pirate',
      'mecha',
      'cyber_sniper',
      'gundam',
      'samurai_shogun',
      'stand_hen',
      'yukimura_shadow',
      'star_dread',
      'bahamut_wyrm',
      'chronos_empress',
      'omega_god',
      'gaia_creator',
      'void_singularity',
      'cat_god_supreme',
    ]);
    const placed: PlacedChicken = {
      id: this.nextEntityId++,
      typeId,
      x,
      y,
      tier: 0,
      targetMode: strongDefaults.has(typeId) ? 'strong' : 'first',
      angle: 0,
      cooldown: 0,
      recoil: 0,
      totalPopDamage: 0,
      totalSpent: cost,
    };
    this.towers.push(placed);
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
    const tower = this.towers.find((t) => t.id === towerId);
    if (!tower || tower.tier >= 3) return false;
    const nextTierIdx = (tower.tier + 1) as 1 | 2 | 3;
    const upgCost = this.getTowerUpgradeCost(tower.typeId, nextTierIdx);
    if (this.corn < upgCost) return false;

    this.corn -= upgCost;
    tower.tier = nextTierIdx;
    tower.totalSpent += upgCost;
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
    this.stands = this.stands.filter((s) => s.ownerTowerId !== removed.id);
    const refund = Math.round(removed.totalSpent * 0.7);
    this.corn += refund;
    this.spawnPixelBurst(removed.x, removed.y, 8, '#FACC15');
    this.spawnMapPopup(`+${refund} CORN`, removed.x, removed.y - 16, '#FACC15', 1.0);
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
    if (this.corn < cost) return false;

    this.corn -= cost;
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
    if (this.corn < cost) return false;

    this.corn -= cost;
    this.tdLevels[id] = lvl + 1;

    if (id === 'fortifiedNest') {
      this.maxEggs += 8;
      this.eggs = Math.min(this.maxEggs, this.eggs + 8);
    }

    this.audio.playUpgrade();
    this.notifyUi();
    return true;
  }

  private spawnEnemy(typeId: EnemyTypeId, distance: number): void {
    const def = ENEMY_DEFS[typeId];
    const hpScale = getWaveHpScale(this.waveNumber) * this.getDifficulty().enemyHpMult;
    const scaledHp = Math.max(1, Math.round(def.maxHp * hpScale));
    this.enemies.push({
      id: this.nextEntityId++,
      typeId,
      hp: scaledHp,
      maxHp: scaledHp,
      distance: Math.max(0, distance),
      lateralOffset: def.isFoxBoss ? 0 : (Math.random() - 0.5) * 14,
      slowFactor: 0,
      slowTimer: 0,
      burnDps: 0,
      burnTimer: 0,
      kbCooldown: 0,
      hitFlash: 0,
      walkPhase: Math.random() * Math.PI * 2,
    });
  }

  private buildDefeatSummary(killerTypeId: EnemyTypeId): RoundEndSummary {
    // Bank all unbanked bug kills for this round right as the round ends!
    const bankRes = this.bankPendingRunBugs();

    // Battle Cats style "BOSS HP REMAINING: X%" if a Fox Boss was on the field (or leaked!)
    let bossName: string | null = null;
    let bossHpPct: number | null = null;

    const activeFoxes = this.enemies.filter((e) => ENEMY_DEFS[e.typeId].isFoxBoss);
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

    const spawnedRatio =
      this.waveInitialSpawnCount > 0
        ? Math.max(
            0,
            Math.min(
              99,
              Math.round(
                ((this.waveInitialSpawnCount - this.pendingSpawns.length) /
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
    // 0. Farmhand Auto-Peckers + Cluck Cannon Charging during active waves!
    if (this.waveActive) {
      this.cannonCharge = Math.min(1, this.cannonCharge + dt / CLUCK_CANNON_CHARGE_SEC);
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

    // 1. Spawn queued wave enemies
    if (this.waveActive) {
      this.waveElapsedSec += dt;
      while (
        this.pendingSpawns.length > 0 &&
        this.pendingSpawns[0].spawnAtWaveTime <= this.waveElapsedSec
      ) {
        const next = this.pendingSpawns.shift()!;
        this.spawnEnemy(next.enemyType, 0);
      }
    }

    // 2. Move enemies, tick DoTs, check Nest leaks
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const def = ENEMY_DEFS[e.typeId];

      e.hitFlash = Math.max(0, e.hitFlash - dt * 6);
      e.kbCooldown = Math.max(0, e.kbCooldown - dt);
      e.walkPhase += dt * (def.isFoxBoss ? 6 : 12);

      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        if (e.slowTimer <= 0) e.slowFactor = 0;
      }

      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        const mutMult = 1.0;
        e.hp -= e.burnDps * mutMult * dt;
        if (e.hp <= 0) {
          this.popEnemyAtIndex(i);
          continue;
        }
      }

      const effectiveSlow = def.isFoxBoss ? e.slowFactor * 0.55 : e.slowFactor;
      const speedScale = getWaveSpeedScale(this.waveNumber) * this.getDifficulty().enemySpeedMult;
      const moveSpeed = def.speed * speedScale * (1 - Math.min(0.72, effectiveSlow));
      e.distance += moveSpeed * dt;

      const totalPathLen = getTotalPathLength();
      if (e.distance >= totalPathLen) {
        this.enemies.splice(i, 1);
        this.eggs = Math.max(0, this.eggs - def.eggDamage);
        const nestPt = getPointAlongPath(totalPathLen);
        this.spawnMapPopup(`-${def.eggDamage} EGG`, nestPt.x, nestPt.y - 26, '#EF4444', 1.15);
        this.spawnRing(nestPt.x, nestPt.y, 44, '#EF4444');
        this.spawnPixelBurst(nestPt.x, nestPt.y, 12, '#EF4444');

        if (this.eggs <= 0) {
          this.eggs = 0;
          this.waveActive = false;
          this.status = 'gameover';
          this.lastDefeatSummary = this.buildDefeatSummary(def.id);
          this.audio.playDefeatJingle();
          this.notifyUi();
          return;
        } else {
          this.audio.playEggLeak();
          this.notifyUi();
        }
      }
    }

    // 3. Tower targeting & projectile / pulse / Stand firing
    for (const tower of this.towers) {
      tower.recoil = Math.max(0, tower.recoil - dt * 5);
      tower.cooldown = Math.max(0, tower.cooldown - dt);

      if (tower.typeId === 'stand_hen') {
        this.updateStandUserTower(tower, dt);
        continue;
      }

      if (tower.cooldown > 0 || this.enemies.length === 0) continue;

      const stats = this.getEffectiveChickenStats(tower);
      const target = this.pickTargetForTower(tower, stats);
      if (!target) continue;

      const targetPos = getPointAlongPath(target.distance, target.lateralOffset);
      const baseAngle = Math.atan2(targetPos.y - tower.y, targetPos.x - tower.x);
      tower.angle = baseAngle;
      tower.cooldown = 1 / Math.max(0.2, stats.effectiveFireRate);
      tower.recoil = 1.0;

      const def = CHICKEN_DEFS[tower.typeId];
      const basicPeckSet = new Set<ChickenTypeId>([
        'bantam',
        'pecker',
        'honey',
        'boomerang',
        'chilly',
        'ninja',
      ]);
      const armorPiercing = !basicPeckSet.has(tower.typeId) || tower.tier >= 2;

      // Special 360-degree AoE Pulse for Mariachi ('sonic'), Eraser ('tremor_slam'), & Quasar ('quasar_pulse')!
      if (
        def.projectileStyle === 'sonic' ||
        def.projectileStyle === 'tremor_slam' ||
        def.projectileStyle === 'quasar_pulse'
      ) {
        const isQuasar = def.projectileStyle === 'quasar_pulse';
        const isTremor = def.projectileStyle === 'tremor_slam';
        const ringCol = isQuasar ? '#F472B6' : isTremor ? '#38BDF8' : '#FB7185';
        this.spawnRing(tower.x, tower.y, stats.effectiveRange, ringCol);
        if (isQuasar) {
          this.spawnRing(tower.x, tower.y, Math.round(stats.effectiveRange * 0.65), '#22D3EE');
          this.spawnPixelBurst(tower.x, tower.y, 12, '#22D3EE');
        } else if (isTremor) {
          this.spawnRing(tower.x, tower.y, Math.round(stats.effectiveRange * 0.55), '#E2E8F0');
          this.spawnPixelBurst(tower.x, tower.y, 10, '#93C5FD');
        } else {
          this.spawnPixelBurst(tower.x, tower.y, 8, '#FDE047');
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
          hitEnemyIds: new Set<number>(),
          age: 0,
          maxLifetime: 0.05,
          color: def.accentColor,
        };
        let hits = 0;
        const sonicTargets = [...this.enemies];
        for (const e of sonicTargets) {
          if (hits >= stats.effectivePierce) break;
          if (!this.enemies.includes(e)) continue;
          const eDef = ENEMY_DEFS[e.typeId];
          if (eDef.isCamo && !stats.effectiveCamo) continue;
          const pos = getPointAlongPath(e.distance, e.lateralOffset);
          if (Math.hypot(pos.x - tower.x, pos.y - tower.y) <= stats.effectiveRange + eDef.radius) {
            this.damageEnemy(e, stats.effectiveDamage, pulseCarrier);
            hits++;
          }
        }
        continue;
      }

      const count = stats.effectiveProjectiles;
      const spreadStep = def.projectileStyle === 'feather_slash' ? 0.24 : 0.13;
      const isBoomerang = def.projectileStyle === 'boomerang';

      for (let m = 0; m < count; m++) {
        const angOffset = count === 1 ? 0 : (m - (count - 1) / 2) * spreadStep;
        const ang = baseAngle + angOffset - (isBoomerang ? 0.34 : 0);
        const speed = stats.projectileSpeed;
        const maxLife = isBoomerang
          ? (stats.effectiveRange * 2.05) / speed
          : (stats.effectiveRange + 75) / speed;

        this.projectiles.push({
          id: this.nextEntityId++,
          ownerTowerId: tower.id,
          style: def.projectileStyle,
          x: tower.x + Math.cos(ang) * 14,
          y: tower.y + Math.sin(ang) * 14,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          curveRate: isBoomerang ? 2.15 : 0,
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
          hitEnemyIds: new Set<number>(),
          age: 0,
          maxLifetime: maxLife,
          color: def.accentColor,
        });
      }
    }

    // 4. Advance projectiles & resolve collisions
    for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.projectiles[pIdx];
      p.age += dt;

      if (p.curveRate !== 0) {
        const curAng = Math.atan2(p.vy, p.vx) + p.curveRate * dt;
        const spd = Math.hypot(p.vx, p.vy);
        p.vx = Math.cos(curAng) * spd;
        p.vy = Math.sin(curAng) * spd;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.style === 'shuriken' || p.style === 'boomerang' || p.style === 'black_hole') {
        p.rotation += dt * 18;
      } else {
        p.rotation = Math.atan2(p.vy, p.vx);
      }

      if (p.age >= p.maxLifetime) {
        this.projectiles.splice(pIdx, 1);
        continue;
      }

      let hitSomething = false;
      const candidates = [...this.enemies];
      for (const e of candidates) {
        if (p.hitEnemyIds.has(e.id) || !this.enemies.includes(e)) continue;
        const eDef = ENEMY_DEFS[e.typeId];
        if (eDef.isCamo && !p.canHitCamo) continue;
        const ePos = getPointAlongPath(e.distance, e.lateralOffset);
        const extraRadius = p.splashRadius > 0 || p.style === 'feather_slash' ? 11 : 8;
        const hitDist = eDef.radius + extraRadius;

        if (Math.hypot(p.x - ePos.x, p.y - ePos.y) <= hitDist) {
          p.hitEnemyIds.add(e.id);
          hitSomething = true;

          if (p.splashRadius > 0 && p.pierceLeft <= 1) {
            this.applySplashHit(p, ePos.x, ePos.y);
            p.pierceLeft = 0;
          } else if (p.splashRadius > 0) {
            this.applySplashHit(p, ePos.x, ePos.y);
            p.pierceLeft--;
          } else {
            this.damageEnemy(e, p.damage, p);
            p.pierceLeft--;
          }

          if (p.pierceLeft <= 0) {
            break;
          }
        }
      }

      if (hitSomething && p.pierceLeft <= 0) {
        this.projectiles.splice(pIdx, 1);
      }
    }

    // 5. Update pixel rings, particles & floating popups
    for (const r of this.rings) r.age += dt;
    this.rings = this.rings.filter((r) => r.age < r.lifetime);

    for (const pt of this.particles) {
      pt.age += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
    this.particles = this.particles.filter((pt) => pt.age < pt.lifetime);

    for (const pop of this.popups) {
      pop.age += dt;
      pop.y += pop.vy * dt;
    }
    this.popups = this.popups.filter((pop) => pop.age < pop.lifetime);

    // 6. Check Wave Complete! (Clicker locks immediately when wave ends!)
    if (this.waveActive && this.pendingSpawns.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      this.clickTimestampsMs = [];
      this.autoPeckAccumulator = 0;

      // Golden Corn Silo wave-clear harvest dividend!
      const siloRate = getCornSiloDividendRate(this.clickerLevels.cornSilo);
      if (siloRate > 0 && this.waveCornHarvested > 0) {
        const dividend = Math.max(1, Math.round(this.waveCornHarvested * siloRate));
        this.corn += dividend;
        this.totalCornClicked += dividend;
        const nestPt = getPointAlongPath(getTotalPathLength());
        this.spawnMapPopup(`SILO +${dividend} CORN!`, nestPt.x, nestPt.y - 30, '#FACC15', 1.1);
        this.spawnPixelBurst(nestPt.x, nestPt.y, 10, '#FACC15');
        this.audio.playUpgrade();
      }

      if (this.waveNumber === CAMPAIGN_WAVES && !this.freeplayUnlocked) {
        this.status = 'victory_prompt';
        const bankRes = this.bankPendingRunBugs();
        this.lastVictoryEggsEarned = bankRes.eggsEarned;
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
    const targetPos = getPointAlongPath(target.distance, target.lateralOffset);
    tower.angle = Math.atan2(targetPos.y - tower.y, targetPos.x - tower.x);

    const dx = targetPos.x - stand.x;
    const dy = targetPos.y - stand.y;
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
      if (Math.random() < dt * 12) {
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
      x: targetPos.x,
      y: targetPos.y,
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
      hitEnemyIds: new Set<number>(),
      age: 0,
      maxLifetime: 0.05,
      color: isRequiem ? '#FACC15' : '#C084FC',
    };

    const targetIdBeforeHit = target.id;
    this.damageEnemy(target, stats.effectiveDamage, punchCarrier);
    let hits = 1;

    if (stats.splashRadius > 0 && hits < stats.effectivePierce) {
      const cleaveCandidates = [...this.enemies];
      for (const e of cleaveCandidates) {
        if (hits >= stats.effectivePierce) break;
        if (e.id === targetIdBeforeHit || !this.enemies.includes(e)) continue;
        const eDef = ENEMY_DEFS[e.typeId];
        if (eDef.isCamo && !stats.effectiveCamo) continue;
        const pos = getPointAlongPath(e.distance, e.lateralOffset);
        if (Math.hypot(pos.x - targetPos.x, pos.y - targetPos.y) <= stats.splashRadius + eDef.radius) {
          this.damageEnemy(e, stats.effectiveDamage, punchCarrier);
          hits++;
        }
      }
    }

    this.spawnPixelBurst(targetPos.x, targetPos.y, 4, isRequiem ? '#FEF08A' : '#E879F9');
    if (stand.punchCount % 2 === 0) {
      this.spawnRing(
        targetPos.x,
        targetPos.y,
        Math.round(stats.splashRadius * 0.65),
        isRequiem ? '#FACC15' : '#C084FC'
      );
    }
    if (stand.punchCount % 8 === 1) {
      this.spawnMapPopup('ORA!', stand.x, stand.y - 18, isRequiem ? '#FEF08A' : '#F0ABFC', 1.0);
    }
  }

  private pickTargetForTower(
    tower: PlacedChicken,
    stats: EffectiveChickenStats
  ): ActiveEnemy | null {
    let best: ActiveEnemy | null = null;
    let bestScore = -Infinity;

    for (const e of this.enemies) {
      const def = ENEMY_DEFS[e.typeId];
      if (def.isCamo && !stats.effectiveCamo) continue;

      const pos = getPointAlongPath(e.distance, e.lateralOffset);
      const distToTower = Math.hypot(pos.x - tower.x, pos.y - tower.y);
      if (distToTower > stats.effectiveRange + def.radius * 0.5) continue;

      let score = 0;
      if (tower.targetMode === 'first') score = e.distance;
      else if (tower.targetMode === 'last') score = -e.distance;
      else if (tower.targetMode === 'close') score = -distToTower;
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
      proj.style === 'snow'
        ? '#38BDF8'
        : proj.style === 'acid' || proj.style === 'matrix_beam' || proj.style === 'soul_wisp'
        ? '#34D399'
        : proj.style === 'honey'
        ? '#FBBF24'
        : proj.style === 'plasma' ||
          proj.style === 'tesla_arc' ||
          proj.style === 'surge_pillar' ||
          proj.style === 'bahamut_orb'
        ? '#22D3EE'
        : proj.style === 'chrono_orb'
        ? '#2DD4BF'
        : proj.style === 'ion_lance' ||
          proj.style === 'antimatter' ||
          proj.style === 'cat_paw' ||
          proj.style === 'moon_slash' ||
          proj.style === 'shadow_talon'
        ? '#FB7185'
        : proj.style === 'stand_fist' ||
          proj.style === 'lightning' ||
          proj.style === 'black_hole'
        ? '#C084FC'
        : proj.style === 'genesis_beam' ||
          proj.style === 'valkyrie_spear' ||
          proj.style === 'judgment_ray' ||
          proj.style === 'nature_prism' ||
          proj.style === 'god_wrath'
        ? '#FEF08A'
        : proj.burnDps > 0
        ? '#F97316'
        : '#FDE047';
    this.spawnRing(cx, cy, proj.splashRadius, ringCol);
    this.spawnPixelBurst(cx, cy, 6, ringCol);

    const splashTargets = [...this.enemies];
    for (const e of splashTargets) {
      if (!this.enemies.includes(e)) continue;
      const def = ENEMY_DEFS[e.typeId];
      if (def.isCamo && !proj.canHitCamo) continue;
      const pos = getPointAlongPath(e.distance, e.lateralOffset);
      if (Math.hypot(pos.x - cx, pos.y - cy) <= proj.splashRadius + def.radius) {
        this.damageEnemy(e, proj.damage, proj);
      }
    }
  }

  private damageEnemy(e: ActiveEnemy, rawDamage: number, proj: ActiveProjectile): void {
    const liveIdx = this.enemies.indexOf(e);
    if (liveIdx === -1) return;
    const def = ENEMY_DEFS[e.typeId];
    if (def.isCamo && !proj.canHitCamo) return;

    let dmg = rawDamage;
    if (def.isFoxBoss) {
      dmg *= proj.foxDamageMult;
    }
    if (def.isArmored && !proj.armorPiercing) {
      dmg = Math.max(0.25, dmg * 0.45);
    }

    // Battle Cats SAVAGE BLOW Critical Strike (3.0x damage)!
    const isSavageCrit = proj.savageCritChance > 0 && Math.random() < proj.savageCritChance;
    if (isSavageCrit) {
      dmg *= 3.0;
      const pos = getPointAlongPath(e.distance, e.lateralOffset);
      this.spawnPixelBurst(pos.x, pos.y, 7, '#FACC15');
      if (Math.random() < 0.35 || def.isFoxBoss) {
        this.spawnMapPopup('SAVAGE!', pos.x, pos.y - 16, '#FEF08A', 1.0);
      }
      this.audio.playSavageCrit();
    }

    const dealt = Math.min(Math.max(0, e.hp), dmg);
    if (proj.ownerTowerId > 0) {
      const owner = this.towers.find((t) => t.id === proj.ownerTowerId);
      if (owner) {
        owner.totalPopDamage += dealt;
      }
    }

    e.hp -= dmg;
    e.hitFlash = 1.0;

    // Battle Cats Knockback (pushes enemy backward along the path with brief KB immunity)!
    if (proj.knockback > 0 && e.kbCooldown <= 0 && e.hp > 0) {
      const kbDist = def.isFoxBoss ? proj.knockback * 0.38 : proj.knockback;
      e.distance = Math.max(0, e.distance - kbDist);
      e.kbCooldown = 0.45;
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
      const idxNow = this.enemies.indexOf(e);
      if (idxNow !== -1) this.popEnemyAtIndex(idxNow);
    }
  }

  private popEnemyAtIndex(index: number): void {
    const [popped] = this.enemies.splice(index, 1);
    if (!popped) return;
    const def = ENEMY_DEFS[popped.typeId];
    const pos = getPointAlongPath(popped.distance, popped.lateralOffset);

    this.totalBugsPopped++;
    this.audio.playBugPop(def.isFoxBoss);

    // Celebratory visual callout every 2,500 bugs popped in a round!
    const currentPool = PROGRESSION.getBugKillRemainder() + (this.totalBugsPopped - this.bugsBankedThisRun);
    if (currentPool > 0 && currentPool % 2500 === 0) {
      const nestPt = getPointAlongPath(getTotalPathLength());
      this.spawnMapPopup('+1 EGG READY!', nestPt.x, nestPt.y - 36, '#38BDF8', 1.15);
      this.spawnRing(nestPt.x, nestPt.y, 52, '#38BDF8');
      this.audio.playUpgrade();
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
          ? 'COSMIC POPPED!'
          : popped.typeId === 'fox_phoenix'
          ? 'PHOENIX POPPED!'
          : 'FOX POPPED!';
      this.spawnRing(pos.x, pos.y, def.radius * 2.2, popCol);
      this.spawnPixelBurst(pos.x, pos.y, 20, def.bodyColor);
      this.spawnMapPopup(popLabel, pos.x, pos.y - 18, '#FDE047', 1.05);
    } else {
      this.spawnPixelBurst(pos.x, pos.y, 6, def.bodyColor);
    }

    let childIdx = 0;
    for (const childGroup of def.childrenOnPop) {
      for (let c = 0; c < childGroup.count; c++) {
        const offsetDist = popped.distance - childIdx * 9;
        this.spawnEnemy(childGroup.type, offsetDist);
        childIdx++;
      }
    }
  }

  private spawnRing(x: number, y: number, maxRadius: number, color: string): void {
    if (this.rings.length > 42) this.rings.shift();
    this.rings.push({ x, y, maxRadius, color, age: 0, lifetime: 0.24 });
  }

  private spawnPixelBurst(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length > 160) this.particles.shift();
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
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
    if (this.popups.length > 26) this.popups.shift();
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
