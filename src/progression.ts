import {
  CANNON_DEFS,
  CANNON_ORDER,
  CHICKEN_ORDER,
  DIFFICULTY_ORDER,
  GEM_EGG_CHICKEN_IDS,
  REQUIRED_FOR_COMPLETE_CLUCK_IDS,
  STARTER_CHICKEN_IDS,
} from './data';
import { MAP_ORDER } from './map';
import {
  CannonTypeId,
  ChickenTypeId,
  DifficultyId,
  EggBankResult,
  EggRollOutcome,
  MapId,
  MutationDef,
  MutationTier,
  PlayerSaveData,
  SavedRunState,
  UserPreferences,
} from './types';

export const SAVE_STORAGE_KEY = 'chickentd_save_v2';
export const ACTIVE_RUN_STORAGE_KEY = 'chickentd_active_run_v1';
export const PREFS_STORAGE_KEY = 'chickentd_prefs_v1';

export const BUGS_PER_EGG = 1000;
export const GEM_EGG_COST_EACH = 1; // 1 Egg = 1 Gem Egg, 4 Eggs = 4x, 8 Eggs = 8x
export const GACHA_POOL_SHARE = 0.8; // 80% Gem Egg Exclusive pool, 20% Starter Mutation pool

export const SECRET_PROMO_CODES: Readonly<Record<string, number>> = {
  GEMEGGS: 8,
  DEVSLOPEGGS: 1024,
};

export type RedeemCodeResult =
  | { status: 'success'; code: string; rewardEggs: number; totalEggs: number }
  | { status: 'already_redeemed'; code: string }
  | { status: 'invalid' };

export const MUTATION_ORDER: readonly ('common' | 'rare' | 'epic' | 'legendary')[] = [
  'common',
  'rare',
  'epic',
  'legendary',
];

export const MUTATION_RANK: Record<MutationTier, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mastered: 5,
  aether: 5,
};

export const MUTATION_DEFS: Record<MutationTier, MutationDef> = {
  common: {
    id: 'common',
    name: 'Common',
    subtitle: 'Feral Spur Gene',
    chance: 0.55,
    color: '#4ADE80',
    borderColor: '#22C55E',
    bgTint: '#143823',
    damageMult: 1.15,
    fireRateMult: 1.06,
    rangeMult: 1.0,
    bonusPierce: 0,
    bonusProjectiles: 0,
    foxMult: 1.0375,
    costMult: 0.9625,
    grantsCamo: false,
    bonusCritChance: 0,
    bonusKnockback: 0,
    summary: '+15% DMG • +6% Fire Rate • -4% Corn Cost',
  },
  rare: {
    id: 'rare',
    name: 'Rare',
    subtitle: 'Cobalt Overdrive',
    chance: 0.28,
    color: '#38BDF8',
    borderColor: '#0284C7',
    bgTint: '#102A43',
    damageMult: 1.3375,
    fireRateMult: 1.12,
    rangeMult: 1.075,
    bonusPierce: 1,
    bonusProjectiles: 0,
    foxMult: 1.1125,
    costMult: 0.925,
    grantsCamo: false,
    bonusCritChance: 0.03,
    bonusKnockback: 0,
    summary: '+34% DMG • +12% Spd • +7.5% Range • +1 Pierce • -7.5% Cost',
  },
  epic: {
    id: 'epic',
    name: 'Epic',
    subtitle: 'Void-Crazed DNA',
    chance: 0.13,
    color: '#C084FC',
    borderColor: '#9333EA',
    bgTint: '#291544',
    damageMult: 1.6375,
    fireRateMult: 1.195,
    rangeMult: 1.135,
    bonusPierce: 2,
    bonusProjectiles: 0,
    foxMult: 1.1875,
    costMult: 0.8875,
    grantsCamo: true,
    bonusCritChance: 0.06,
    bonusKnockback: 6,
    summary: '+64% DMG • +19.5% Spd • +13.5% Rng • +2 Pierce • Camo • -11% Cost',
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary',
    subtitle: 'Celestial True-Form',
    chance: 0.04,
    color: '#FACC15',
    borderColor: '#F59E0B',
    bgTint: '#3A290C',
    damageMult: 2.125,
    fireRateMult: 1.3,
    rangeMult: 1.21,
    bonusPierce: 4,
    bonusProjectiles: 1,
    foxMult: 1.45,
    costMult: 0.835,
    grantsCamo: true,
    bonusCritChance: 0.1125,
    bonusKnockback: 13.5,
    summary:
      '+112.5% DMG • +30% Spd • +1 Shot • +4 Pierce • 11% Crit & KB • -16.5% Cost',
  },
  mastered: {
    id: 'mastered',
    name: 'Mastered',
    subtitle: 'Sovereign Blade Mastery',
    chance: 0,
    color: '#2DD4BF',
    borderColor: '#14B8A6',
    bgTint: '#0D2D2A',
    damageMult: 2.5,
    fireRateMult: 1.0,
    rangeMult: 3.0,
    bonusPierce: 0,
    bonusProjectiles: 0,
    foxMult: 1.0,
    costMult: 1.0,
    grantsCamo: true,
    bonusCritChance: 0,
    bonusKnockback: 0,
    summary: '+150% DMG • +200% Range (Wide-Map Boomerang Blades)',
  },
  aether: {
    id: 'aether',
    name: 'Aether',
    subtitle: 'Aetherial Overdrive',
    chance: 0,
    color: '#E879F9',
    borderColor: '#C084FC',
    bgTint: '#2E1042',
    damageMult: 4.0,
    fireRateMult: 1.0,
    rangeMult: 1.0,
    bonusPierce: 0,
    bonusProjectiles: 0,
    foxMult: 1.0,
    costMult: 1.0,
    grantsCamo: true,
    bonusCritChance: 0,
    bonusKnockback: 0,
    summary: '+300% DMG • +0% Extra Range (Close-Range Shredder)',
  },
};

function createDefaultSaveData(): PlayerSaveData {
  const unlockedUnits: Partial<Record<ChickenTypeId, boolean>> = {};
  for (const id of STARTER_CHICKEN_IDS) {
    unlockedUnits[id] = true;
  }
  return {
    version: 1,
    eggs: 0,
    totalEggsEarned: 0,
    lifetimeBugsKilled: 0,
    bugKillRemainder: 0,
    gemEggsOpened: 0,
    unlockedUnits,
    unitMutations: {},
    unitPlusLevels: {},
    unlockedCannons: { shockwave: true },
    equippedCannon: 'shockwave',
    redeemedCodes: {},
  };
}

function rollMutationTier(): MutationTier {
  const r = Math.random();
  let acc = 0;
  for (const tier of MUTATION_ORDER) {
    acc += MUTATION_DEFS[tier].chance;
    if (r < acc) return tier;
  }
  return 'common';
}

/**
 * Progressive rarity weight curve: every Chicken further down the roster is strictly rarer
 * than the ones before it, with an accelerating rarity tail on endgame mythic titans!
 */
export function getChickenHatchWeight(id: ChickenTypeId): number {
  const starterIdx = STARTER_CHICKEN_IDS.indexOf(id);
  if (starterIdx >= 0) {
    return 100 * Math.pow(0.896, starterIdx);
  }
  const gachaIdx = GEM_EGG_CHICKEN_IDS.indexOf(id);
  if (gachaIdx >= 0) {
    const progress =
      GEM_EGG_CHICKEN_IDS.length > 1 ? gachaIdx / (GEM_EGG_CHICKEN_IDS.length - 1) : 0;
    const accelExponent = gachaIdx * (1 + 0.28 * progress * progress);
    return 100 * Math.pow(0.908, accelExponent);
  }
  return 0;
}

const TOTAL_STARTER_WEIGHT = STARTER_CHICKEN_IDS.reduce(
  (sum, id) => sum + getChickenHatchWeight(id),
  0
);
const TOTAL_GACHA_WEIGHT = GEM_EGG_CHICKEN_IDS.reduce(
  (sum, id) => sum + getChickenHatchWeight(id),
  0
);

export function getChickenHatchChancePercent(id: ChickenTypeId): number {
  if (id === 'complete_cluck') return 0;
  const w = getChickenHatchWeight(id);
  if (w <= 0) return 0;
  if (STARTER_CHICKEN_IDS.includes(id)) {
    return TOTAL_STARTER_WEIGHT > 0 ? ((1 - GACHA_POOL_SHARE) * w * 100) / TOTAL_STARTER_WEIGHT : 0;
  }
  return TOTAL_GACHA_WEIGHT > 0 ? (GACHA_POOL_SHARE * w * 100) / TOTAL_GACHA_WEIGHT : 0;
}

export function formatHatchOddsPercent(pct: number): string {
  if (pct <= 0) return '0%';
  if (pct >= 1) return `${pct.toFixed(2)}%`;
  if (pct >= 0.1) return `${pct.toFixed(2)}%`;
  return `${pct.toFixed(3)}%`;
}

function pickWeightedUnit(candidates: readonly ChickenTypeId[]): ChickenTypeId {
  const weights = candidates.map((id) => getChickenHatchWeight(id));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) return candidates[0];
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export class ProgressionStore {
  private data: PlayerSaveData;
  public onChange: (() => void) | null = null;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private getSafeLocalStorage(): Storage | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage;
    } catch {
      return null;
    }
  }

  private loadFromStorage(): PlayerSaveData {
    const fallback = createDefaultSaveData();
    const storage = this.getSafeLocalStorage();
    if (!storage) {
      return fallback;
    }
    try {
      const raw = storage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<PlayerSaveData>;

      const unlockedUnits: Partial<Record<ChickenTypeId, boolean>> = {};
      for (const id of STARTER_CHICKEN_IDS) {
        unlockedUnits[id] = true;
      }
      if (parsed.unlockedUnits && typeof parsed.unlockedUnits === 'object') {
        for (const id of GEM_EGG_CHICKEN_IDS) {
          if (parsed.unlockedUnits[id] === true) {
            unlockedUnits[id] = true;
          }
        }
      }

      const unitMutations: Partial<Record<ChickenTypeId, MutationTier>> = {};
      if (parsed.unitMutations && typeof parsed.unitMutations === 'object') {
        for (const id of CHICKEN_ORDER) {
          const m = parsed.unitMutations[id];
          if (id === 'complete_cluck') {
            if (m === 'mastered' || m === 'aether') {
              unitMutations[id] = m;
            }
          } else if (m === 'common' || m === 'rare' || m === 'epic' || m === 'legendary') {
            unitMutations[id] = m;
          }
        }
      }

      const ownsAllOthers = REQUIRED_FOR_COMPLETE_CLUCK_IDS.every(
        (id) => unlockedUnits[id] === true
      );
      if (ownsAllOthers) {
        unlockedUnits.complete_cluck = true;
        if (unitMutations.complete_cluck !== 'aether') {
          unitMutations.complete_cluck = 'mastered';
        }
      }

      const unitPlusLevels: Partial<Record<ChickenTypeId, number>> = {};
      if (parsed.unitPlusLevels && typeof parsed.unitPlusLevels === 'object') {
        for (const id of CHICKEN_ORDER) {
          const lv = Number(parsed.unitPlusLevels[id] ?? 0);
          if (Number.isFinite(lv) && lv > 0) {
            unitPlusLevels[id] = Math.floor(lv);
          }
        }
      }

      const unlockedCannons: Partial<Record<CannonTypeId, boolean>> = {
        shockwave: true,
      };
      if (parsed.unlockedCannons && typeof parsed.unlockedCannons === 'object') {
        for (const cId of CANNON_ORDER) {
          if (parsed.unlockedCannons[cId] === true || CANNON_DEFS[cId].gemEggCost === 0) {
            unlockedCannons[cId] = true;
          }
        }
      }
      const equippedCannon: CannonTypeId =
        parsed.equippedCannon &&
        CANNON_ORDER.includes(parsed.equippedCannon) &&
        unlockedCannons[parsed.equippedCannon] === true
          ? parsed.equippedCannon
          : 'shockwave';

      const redeemedCodes: Partial<Record<string, boolean>> = {};
      if (parsed.redeemedCodes && typeof parsed.redeemedCodes === 'object') {
        for (const code of Object.keys(SECRET_PROMO_CODES)) {
          if (parsed.redeemedCodes[code] === true) {
            redeemedCodes[code] = true;
          }
        }
      }

      const rawRem = Math.max(0, Math.floor(Number(parsed.bugKillRemainder ?? 0) || 0));
      const migratedEggs = Math.floor(rawRem / BUGS_PER_EGG);
      const cleanRem = rawRem % BUGS_PER_EGG;

      return {
        version: 1,
        eggs: Math.max(0, Math.floor(Number(parsed.eggs ?? 0) || 0)) + migratedEggs,
        totalEggsEarned:
          Math.max(0, Math.floor(Number(parsed.totalEggsEarned ?? 0) || 0)) + migratedEggs,
        lifetimeBugsKilled: Math.max(0, Math.floor(Number(parsed.lifetimeBugsKilled ?? 0) || 0)),
        bugKillRemainder: cleanRem,
        gemEggsOpened: Math.max(0, Math.floor(Number(parsed.gemEggsOpened ?? 0) || 0)),
        unlockedUnits,
        unitMutations,
        unitPlusLevels,
        unlockedCannons,
        equippedCannon,
        redeemedCodes,
      };
    } catch {
      return fallback;
    }
  }

  public save(): void {
    const storage = this.getSafeLocalStorage();
    if (storage) {
      try {
        storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(this.data));
      } catch {
        // Ignore quota errors in restricted sandboxes
      }
    }
    if (this.onChange) this.onChange();
  }

  public saveActiveRun(state: SavedRunState): void {
    const storage = this.getSafeLocalStorage();
    if (!storage) return;
    try {
      storage.setItem(ACTIVE_RUN_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }

  public loadActiveRun(): SavedRunState | null {
    const storage = this.getSafeLocalStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(ACTIVE_RUN_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<SavedRunState>;
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !parsed.mapId ||
        !MAP_ORDER.includes(parsed.mapId as MapId) ||
        !parsed.difficultyId ||
        !DIFFICULTY_ORDER.includes(parsed.difficultyId as DifficultyId) ||
        !Array.isArray(parsed.towers)
      ) {
        return null;
      }
      return parsed as SavedRunState;
    } catch {
      return null;
    }
  }

  public clearActiveRun(): void {
    const storage = this.getSafeLocalStorage();
    if (!storage) return;
    try {
      storage.removeItem(ACTIVE_RUN_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  public savePrefs(prefs: UserPreferences): void {
    const storage = this.getSafeLocalStorage();
    if (!storage) return;
    try {
      storage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore
    }
  }

  public loadPrefs(): UserPreferences | null {
    const storage = this.getSafeLocalStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(PREFS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<UserPreferences>;
      if (!parsed || typeof parsed !== 'object') return null;
      const pendingMapId: MapId =
        parsed.pendingMapId && MAP_ORDER.includes(parsed.pendingMapId)
          ? parsed.pendingMapId
          : 'sunny_meadow';
      const pendingDifficultyId: DifficultyId =
        parsed.pendingDifficultyId && DIFFICULTY_ORDER.includes(parsed.pendingDifficultyId)
          ? parsed.pendingDifficultyId
          : 'normal';
      return {
        pendingMapId,
        pendingDifficultyId,
        isMuted: Boolean(parsed.isMuted),
        inIdleMode: Boolean(parsed.inIdleMode),
        lastIdleSyncMs:
          typeof parsed.lastIdleSyncMs === 'number' && Number.isFinite(parsed.lastIdleSyncMs)
            ? parsed.lastIdleSyncMs
            : undefined,
      };
    } catch {
      return null;
    }
  }

  public getEggs(): number {
    return this.data.eggs;
  }

  public getTotalEggsEarned(): number {
    return this.data.totalEggsEarned;
  }

  public getLifetimeBugsKilled(): number {
    return this.data.lifetimeBugsKilled;
  }

  public getBugKillRemainder(): number {
    return this.data.bugKillRemainder;
  }

  public getGemEggsOpened(): number {
    return this.data.gemEggsOpened;
  }

  private hasAllOtherChickens(): boolean {
    for (const id of REQUIRED_FOR_COMPLETE_CLUCK_IDS) {
      if (!STARTER_CHICKEN_IDS.includes(id) && this.data.unlockedUnits[id] !== true) {
        return false;
      }
    }
    return true;
  }

  public isUnlocked(id: ChickenTypeId): boolean {
    if (id === 'complete_cluck') {
      const unlocked = this.hasAllOtherChickens();
      if (unlocked) {
        this.data.unlockedUnits.complete_cluck = true;
        if (
          this.data.unitMutations.complete_cluck !== 'mastered' &&
          this.data.unitMutations.complete_cluck !== 'aether'
        ) {
          this.data.unitMutations.complete_cluck = 'mastered';
        }
      }
      return unlocked;
    }
    if (STARTER_CHICKEN_IDS.includes(id)) return true;
    return this.data.unlockedUnits[id] === true;
  }

  public getNonCompleteUnlockedCount(): number {
    let count = 0;
    for (const id of REQUIRED_FOR_COMPLETE_CLUCK_IDS) {
      if (this.isUnlocked(id)) count++;
    }
    return count;
  }

  public getUnlockedCount(): number {
    let count = 0;
    for (const id of CHICKEN_ORDER) {
      if (this.isUnlocked(id)) count++;
    }
    return count;
  }

  public getMutation(id: ChickenTypeId): MutationTier | null {
    if (id === 'complete_cluck') {
      if (!this.isUnlocked('complete_cluck')) return null;
      return this.data.unitMutations.complete_cluck === 'aether' ? 'aether' : 'mastered';
    }
    return this.data.unitMutations[id] ?? null;
  }

  public toggleCompleteCluckMutation(): 'mastered' | 'aether' | null {
    if (!this.isUnlocked('complete_cluck')) return null;
    const next: 'mastered' | 'aether' =
      this.data.unitMutations.complete_cluck === 'aether' ? 'mastered' : 'aether';
    this.data.unitMutations.complete_cluck = next;
    this.save();
    return next;
  }

  public getPlusLevel(id: ChickenTypeId): number {
    return this.data.unitPlusLevels[id] ?? 0;
  }

  public isCannonUnlocked(id: CannonTypeId): boolean {
    if (CANNON_DEFS[id].gemEggCost === 0) return true;
    return this.data.unlockedCannons[id] === true;
  }

  public getUnlockedCannonCount(): number {
    let count = 0;
    for (const id of CANNON_ORDER) {
      if (this.isCannonUnlocked(id)) count++;
    }
    return count;
  }

  public getEquippedCannon(): CannonTypeId {
    const eq = this.data.equippedCannon;
    return this.isCannonUnlocked(eq) ? eq : 'shockwave';
  }

  public equipCannon(id: CannonTypeId): boolean {
    if (!this.isCannonUnlocked(id)) return false;
    this.data.equippedCannon = id;
    this.save();
    return true;
  }

  /**
   * Unlocks a Cluck Cannon loadout permanently using Gem Eggs and equips it!
   */
  public buyCannon(id: CannonTypeId): boolean {
    if (this.isCannonUnlocked(id)) {
      return this.equipCannon(id);
    }
    const cost = CANNON_DEFS[id].gemEggCost;
    if (this.data.eggs < cost) return false;

    this.data.eggs -= cost;
    this.data.unlockedCannons[id] = true;
    this.data.equippedCannon = id;
    this.save();
    return true;
  }

  /**
   * Redeems a secret promo code unlocked via 4-tapping Omnicluck Prime on the Main Menu!
   */
  public redeemSecretCode(rawInput: string): RedeemCodeResult {
    const code = rawInput.trim().toUpperCase();
    if (!code || !(code in SECRET_PROMO_CODES)) {
      return { status: 'invalid' };
    }
    if (!this.data.redeemedCodes) {
      this.data.redeemedCodes = {};
    }
    if (this.data.redeemedCodes[code] === true) {
      return { status: 'already_redeemed', code };
    }
    const rewardEggs = SECRET_PROMO_CODES[code];
    this.data.redeemedCodes[code] = true;
    this.data.eggs += rewardEggs;
    this.data.totalEggsEarned += rewardEggs;
    this.save();
    return {
      status: 'success',
      code,
      rewardEggs,
      totalEggs: this.data.eggs,
    };
  }

  /**
   * Banks unbanked bug kills into persistent storage!
   * Awards 1 Egg per 1,000 enemies killed and persists carry-over remainder to localStorage.
   */
  public bankBugsAfterRound(bugsKilledDelta: number): EggBankResult {
    const rawDelta = Number(bugsKilledDelta);
    const cleanDelta = Number.isFinite(rawDelta) ? Math.max(0, Math.floor(rawDelta)) : 0;
    const previousRemainder = this.data.bugKillRemainder;
    const pool = previousRemainder + cleanDelta;
    const eggsEarned = Math.floor(pool / BUGS_PER_EGG);
    const newRemainder = pool % BUGS_PER_EGG;

    this.data.lifetimeBugsKilled += cleanDelta;
    this.data.eggs += eggsEarned;
    this.data.totalEggsEarned += eggsEarned;
    this.data.bugKillRemainder = newRemainder;
    this.save();

    return {
      bugsAdded: cleanDelta,
      eggsEarned,
      previousRemainder,
      newRemainder,
      totalSavedEggs: this.data.eggs,
    };
  }

  /**
   * Buys and rolls 1, 4, or 8 Gem Eggs at once!
   * - Unowned unit -> Unlocks the new unit!
   * - Already owned unit -> Rolls a 4-tier Mutation (Common/Rare/Epic/Legendary) + increments +Level!
   */
  public buyGemEggs(count: 1 | 4 | 8): EggRollOutcome[] | null {
    const totalCost = count * GEM_EGG_COST_EACH;
    if (this.data.eggs < totalCost) return null;

    this.data.eggs -= totalCost;
    const results: EggRollOutcome[] = [];

    for (let i = 0; i < count; i++) {
      let chosenUnit: ChickenTypeId;
      if (this.data.gemEggsOpened === 0) {
        const lockedGacha = GEM_EGG_CHICKEN_IDS.filter((id) => !this.isUnlocked(id));
        chosenUnit = pickWeightedUnit(lockedGacha.length > 0 ? lockedGacha : GEM_EGG_CHICKEN_IDS);
      } else {
        const useGachaPool = Math.random() < GACHA_POOL_SHARE;
        chosenUnit = pickWeightedUnit(useGachaPool ? GEM_EGG_CHICKEN_IDS : STARTER_CHICKEN_IDS);
      }

      this.data.gemEggsOpened++;

      if (!this.isUnlocked(chosenUnit)) {
        this.data.unlockedUnits[chosenUnit] = true;
        results.push({
          unitId: chosenUnit,
          isNewUnit: true,
          rolledMutation: null,
          activeMutation: this.getMutation(chosenUnit),
          mutationUpgraded: false,
          plusLevel: this.getPlusLevel(chosenUnit),
        });
      } else {
        const rolledTier = rollMutationTier();
        const currentTier = this.getMutation(chosenUnit);
        const currentRank = currentTier ? MUTATION_RANK[currentTier] : 0;
        const newRank = MUTATION_RANK[rolledTier];
        const upgraded = newRank > currentRank;
        const activeTier: MutationTier = upgraded ? rolledTier : (currentTier ?? rolledTier);

        this.data.unitMutations[chosenUnit] = activeTier;
        const nextPlus = (this.data.unitPlusLevels[chosenUnit] ?? 0) + 1;
        this.data.unitPlusLevels[chosenUnit] = nextPlus;

        results.push({
          unitId: chosenUnit,
          isNewUnit: false,
          rolledMutation: rolledTier,
          activeMutation: activeTier,
          mutationUpgraded: upgraded,
          plusLevel: nextPlus,
        });
      }
    }

    // Automatically forge & unlock "The Complete Cluck" (preset to Mastered) once all 38 other Chickens are owned!
    if (this.hasAllOtherChickens()) {
      this.data.unlockedUnits.complete_cluck = true;
      if (
        this.data.unitMutations.complete_cluck !== 'mastered' &&
        this.data.unitMutations.complete_cluck !== 'aether'
      ) {
        this.data.unitMutations.complete_cluck = 'mastered';
      }
    }

    this.save();
    return results;
  }
}

export const PROGRESSION = new ProgressionStore();
