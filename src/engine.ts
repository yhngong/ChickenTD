import { ChickenAudioEngine } from './audio';
import {
  CAMPAIGN_WAVES,
  CHICKEN_DEFS,
  CLICKER_UPGRADES,
  DIFFICULTY_DEFS,
  ENEMY_DEFS,
  getBaseCornPerClick,
  getCritParams,
  getHarvestBasketMult,
  getMaxRhythmMult,
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
import {
  ActiveEnemy,
  ActiveProjectile,
  ChickenTierStats,
  ChickenTypeId,
  ClickResult,
  ClickerUpgradeId,
  DifficultyDef,
  DifficultyId,
  EnemyTypeId,
  FloatingMapPopup,
  MapId,
  PixelParticle,
  PlacedChicken,
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
  effectiveRange: number;
  effectiveFireRate: number;
  effectivePierce: number;
  effectiveFoxMult: number;
  effectiveCamo: boolean;
}

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
  public status: 'playing' | 'victory_prompt' | 'gameover' = 'playing';
  public freeplayUnlocked = false;
  public speedMultiplier: 1 | 2 = 1;

  public totalBugsPopped = 0;
  public totalClicksAccepted = 0;
  public waveClickCounter = 0; // counts toward 12-Peck Mega Cob

  // Strict 12 CPS sliding 1,000ms window (wall-clock milliseconds)
  private clickTimestampsMs: number[] = [];
  public frenzyMeter = 0; // 0..1 built by active clicking during waves
  public capHitFlash = 0; // 0..1 visual indicator when clicking > 12 CPS

  public clickerLevels: Record<ClickerUpgradeId, number> = {
    beakPower: 0,
    goldenLuck: 0,
    peckRhythm: 0,
    harvestBasket: 0,
  };

  public tdLevels: Record<TdUpgradeId, number> = {
    caffeinatedFeed: 0,
    eagleRoost: 0,
    razorTalons: 0,
    fortifiedNest: 0,
  };

  public towers: PlacedChicken[] = [];
  public enemies: ActiveEnemy[] = [];
  public projectiles: ActiveProjectile[] = [];
  public rings: VisualRingEffect[] = [];
  public particles: PixelParticle[] = [];
  public popups: FloatingMapPopup[] = [];

  private pendingSpawns: PendingSpawn[] = [];
  private nextEntityId = 1;

  public onUiChange: (() => void) | null = null;

  public getDifficulty(): DifficultyDef {
    return DIFFICULTY_DEFS[this.difficultyId];
  }

  public getTowerBaseCost(typeId: ChickenTypeId): number {
    return Math.round(CHICKEN_DEFS[typeId].baseCost * this.getDifficulty().costMult);
  }

  public getTowerUpgradeCost(typeId: ChickenTypeId, tierIdx: 1 | 2 | 3): number {
    return Math.round(
      CHICKEN_DEFS[typeId].tiers[tierIdx].upgradeCost * this.getDifficulty().costMult
    );
  }

  public getScaledUpgradeCost<T extends string>(def: UpgradeDef<T>, currentLevel: number): number {
    return Math.round(getUpgradeCost(def, currentLevel) * this.getDifficulty().costMult);
  }

  public startNewRun(mapId: MapId, difficultyId: DifficultyId): void {
    this.mapId = mapId;
    this.difficultyId = difficultyId;
    setActiveMap(mapId);
    this.resetGame();
  }

  public resetGame(): void {
    setActiveMap(this.mapId);
    const diff = this.getDifficulty();
    this.corn = diff.startingCorn;
    this.totalCornClicked = 0;
    this.eggs = diff.startingEggs;
    this.maxEggs = diff.startingEggs;
    this.waveNumber = 1;
    this.waveActive = false;
    this.waveElapsedSec = 0;
    this.status = 'playing';
    this.freeplayUnlocked = false;
    this.totalBugsPopped = 0;
    this.totalClicksAccepted = 0;
    this.waveClickCounter = 0;
    this.clickTimestampsMs = [];
    this.frenzyMeter = 0;
    this.capHitFlash = 0;

    this.clickerLevels = {
      beakPower: 0,
      goldenLuck: 0,
      peckRhythm: 0,
      harvestBasket: 0,
    };
    this.tdLevels = {
      caffeinatedFeed: 0,
      eagleRoost: 0,
      razorTalons: 0,
      fortifiedNest: 0,
    };

    this.towers = [];
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
      // Strictly ignore clicks beyond 12 CPS!
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
    this.waveClickCounter++;

    if (this.clickerLevels.peckRhythm > 0) {
      this.frenzyMeter = Math.min(1, this.frenzyMeter + 0.085);
    }

    const baseVal = getBaseCornPerClick(this.clickerLevels.beakPower);
    const rhythmMult = this.getCurrentFrenzyMultiplier();

    const crit = getCritParams(this.clickerLevels.goldenLuck);
    const isCrit = crit.chance > 0 && Math.random() < crit.chance;
    const critMult = isCrit ? crit.mult : 1.0;

    const basketMult = getHarvestBasketMult(this.clickerLevels.harvestBasket);
    const isMegaCob = basketMult > 0 && this.waveClickCounter % 12 === 0;
    const megaBonus = isMegaCob ? Math.round(baseVal * basketMult) : 0;

    const earned = Math.max(1, Math.round(baseVal * rhythmMult * critMult) + megaBonus);
    this.corn += earned;
    this.totalCornClicked += earned;

    this.audio.playHenClick(isCrit, isMegaCob);
    this.notifyUi();

    return {
      accepted: true,
      amountEarned: earned,
      isCrit,
      isMegaCob,
      currentCps: this.clickTimestampsMs.length,
    };
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
    this.waveElapsedSec = 0;
    this.waveActive = true;
    this.clickTimestampsMs = [];
    this.audio.playWaveStart();
    this.notifyUi();
    return true;
  }

  public getPendingWaveEnemyTotal(): number {
    return this.pendingSpawns.length + this.enemies.length;
  }

  public getEffectiveChickenStats(tower: PlacedChicken): EffectiveChickenStats {
    const def = CHICKEN_DEFS[tower.typeId];
    const base = def.tiers[tower.tier];
    const rangeMult = 1 + this.tdLevels.eagleRoost * 0.08;
    const rateMult = 1 + this.tdLevels.caffeinatedFeed * 0.11;
    const bonusPierce = Math.ceil(this.tdLevels.razorTalons / 2);
    const foxMult = base.foxDamageMult * (1 + this.tdLevels.razorTalons * 0.22);
    const hasCamo = base.camoSight || this.tdLevels.eagleRoost >= 3;

    return {
      ...base,
      effectiveRange: Math.round(base.range * rangeMult),
      effectiveFireRate: base.fireRate * rateMult,
      effectivePierce: base.pierce + bonusPierce,
      effectiveFoxMult: foxMult,
      effectiveCamo: hasCamo,
    };
  }

  public placeChicken(typeId: ChickenTypeId, x: number, y: number): PlacedChicken | null {
    if (this.status === 'gameover') return null;
    const cost = this.getTowerBaseCost(typeId);
    if (this.corn < cost) return null;
    if (!canPlaceChickenAt(x, y, this.towers)) return null;

    this.corn -= cost;
    const placed: PlacedChicken = {
      id: this.nextEntityId++,
      typeId,
      x,
      y,
      tier: 0,
      targetMode:
        typeId === 'ranger' ||
        typeId === 'pirate' ||
        typeId === 'mecha' ||
        typeId === 'gundam' ||
        typeId === 'star_dread' ||
        typeId === 'omega_god'
          ? 'strong'
          : 'first',
      angle: 0,
      cooldown: 0,
      recoil: 0,
      totalPopDamage: 0,
      totalSpent: cost,
    };
    this.towers.push(placed);
    this.spawnRing(x, y, 34, '#FACC15');
    this.spawnPixelBurst(x, y, 8, '#FACC15');
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
      hitFlash: 0,
      walkPhase: Math.random() * Math.PI * 2,
    });
  }

  public tick(realDtSec: number): void {
    // Decay real-time clicker visual meters
    this.capHitFlash = Math.max(0, this.capHitFlash - realDtSec * 3.2);
    const activeCps = this.getCurrentCps();
    if (!this.waveActive) {
      this.frenzyMeter = Math.max(0, this.frenzyMeter - realDtSec * 1.4);
    } else if (activeCps < 4) {
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
      e.walkPhase += dt * (def.isFoxBoss ? 6 : 12);

      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        if (e.slowTimer <= 0) e.slowFactor = 0;
      }

      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        e.hp -= e.burnDps * dt;
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
        this.audio.playEggLeak();
        this.notifyUi();

        if (this.eggs <= 0) {
          this.eggs = 0;
          this.waveActive = false;
          this.status = 'gameover';
          this.notifyUi();
          return;
        }
      }
    }

    // 3. Tower targeting & projectile / pulse firing
    for (const tower of this.towers) {
      tower.recoil = Math.max(0, tower.recoil - dt * 5);
      tower.cooldown = Math.max(0, tower.cooldown - dt);
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
      const armorPiercing =
        tower.typeId === 'ranger' ||
        tower.typeId === 'lobber' ||
        tower.typeId === 'alchemist' ||
        tower.typeId === 'wizard' ||
        tower.typeId === 'pirate' ||
        tower.typeId === 'bard' ||
        tower.typeId === 'phoenix' ||
        tower.typeId === 'mecha' ||
        tower.typeId === 'tesla' ||
        tower.typeId === 'chrono' ||
        tower.typeId === 'gundam' ||
        tower.typeId === 'void_hen' ||
        tower.typeId === 'valkyrie' ||
        tower.typeId === 'star_dread' ||
        tower.typeId === 'quasar' ||
        tower.typeId === 'omega_god' ||
        tower.tier >= 2;

      // Special 360-degree AoE Pulse for Mariachi Rooster ('sonic') & Quasar Serama ('quasar_pulse')!
      if (def.projectileStyle === 'sonic' || def.projectileStyle === 'quasar_pulse') {
        const isQuasar = def.projectileStyle === 'quasar_pulse';
        this.spawnRing(tower.x, tower.y, stats.effectiveRange, isQuasar ? '#F472B6' : '#FB7185');
        if (isQuasar) {
          this.spawnRing(tower.x, tower.y, Math.round(stats.effectiveRange * 0.65), '#22D3EE');
          this.spawnPixelBurst(tower.x, tower.y, 12, '#22D3EE');
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
          damage: stats.damage,
          pierceLeft: stats.effectivePierce,
          splashRadius: stats.effectiveRange,
          slowFactor: stats.slowFactor,
          slowDuration: stats.slowDuration,
          burnDps: stats.burnDps,
          foxDamageMult: stats.effectiveFoxMult,
          armorPiercing: true,
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
            this.damageEnemy(e, stats.damage, pulseCarrier);
            hits++;
          }
        }
        continue;
      }

      const count = stats.projectiles;
      const spreadStep = def.projectileStyle === 'feather_slash' ? 0.24 : 0.14;
      const isBoomerang = def.projectileStyle === 'boomerang';

      for (let m = 0; m < count; m++) {
        const angOffset = count === 1 ? 0 : (m - (count - 1) / 2) * spreadStep;
        const ang = baseAngle + angOffset - (isBoomerang ? 0.34 : 0);
        const speed = stats.projectileSpeed;
        const maxLife = isBoomerang
          ? ((stats.effectiveRange * 2.05) / speed)
          : (stats.effectiveRange + 70) / speed;

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
          damage: stats.damage,
          pierceLeft: stats.effectivePierce,
          splashRadius: stats.splashRadius,
          slowFactor: stats.slowFactor,
          slowDuration: stats.slowDuration,
          burnDps: stats.burnDps,
          foxDamageMult: stats.effectiveFoxMult,
          armorPiercing,
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
      if (p.style === 'shuriken' || p.style === 'boomerang') {
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
        const ePos = getPointAlongPath(e.distance, e.lateralOffset);
        const extraRadius =
          p.style === 'egg_bomb' ||
          p.style === 'snow' ||
          p.style === 'acid' ||
          p.style === 'honey' ||
          p.style === 'cannonball' ||
          p.style === 'feather_slash' ||
          p.style === 'chrono_orb' ||
          p.style === 'void_hole' ||
          p.style === 'antimatter' ||
          p.style === 'genesis_beam'
            ? 11
            : 8;
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

      if (this.waveNumber === CAMPAIGN_WAVES && !this.freeplayUnlocked) {
        this.status = 'victory_prompt';
      }
      this.waveNumber++;
      this.notifyUi();
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
        : proj.style === 'acid'
        ? '#34D399'
        : proj.style === 'honey'
        ? '#FBBF24'
        : proj.style === 'plasma' || proj.style === 'tesla_arc'
        ? '#22D3EE'
        : proj.style === 'chrono_orb'
        ? '#2DD4BF'
        : proj.style === 'ion_lance' || proj.style === 'antimatter'
        ? '#FB7185'
        : proj.style === 'void_hole' || proj.style === 'lightning'
        ? '#C084FC'
        : proj.style === 'genesis_beam' || proj.style === 'valkyrie_spear'
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

    let dmg = rawDamage;
    if (def.isFoxBoss) {
      dmg *= proj.foxDamageMult;
    }
    if (def.isArmored && !proj.armorPiercing) {
      dmg = Math.max(0.25, dmg * 0.45);
    }

    const dealt = Math.min(Math.max(0, e.hp), dmg);
    const owner = this.towers.find((t) => t.id === proj.ownerTowerId);
    if (owner) {
      owner.totalPopDamage += dealt;
    }

    e.hp -= dmg;
    e.hitFlash = 1.0;

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

    // Spawn inner Bloons-style child bugs/foxes at popped enemy's path position! (Zero money!)
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
    if (this.rings.length > 36) this.rings.shift();
    this.rings.push({ x, y, maxRadius, color, age: 0, lifetime: 0.24 });
  }

  private spawnPixelBurst(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length > 140) this.particles.shift();
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
    if (this.popups.length > 24) this.popups.shift();
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
