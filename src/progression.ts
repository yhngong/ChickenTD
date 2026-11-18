import {
  CHICKEN_DEFS,
  CHICKEN_ORDER,
  GEM_EGG_CHICKEN_IDS,
  STARTER_CHICKEN_IDS,
} from './data';
import {
  ChickenTypeId,
  EggBankResult,
  EggRollOutcome,
  MutationDef,
  MutationTier,
  PlayerSaveData,
} from './types';

export const SAVE_STORAGE_KEY = 'chickentd_battlecats_save_v1';
export const BUGS_PER_EGG = 2500;
export const GEM_EGG_COST_EACH = 1; // 1 Egg = 1 Gem Egg, 4 Eggs = 4x, 8 Eggs = 8x

export const MUTATION_ORDER: readonly MutationTier[] = [
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
    damageMult: 1.2,
    fireRateMult: 1.08,
    rangeMult: 1.0,
    bonusPierce: 0,
    bonusProjectiles: 0,
    foxMult: 1.05,
    costMult: 0.95,
    grantsCamo: false,
    bonusCritChance: 0,
    bonusKnockback: 0,
    summary: '+20% DMG • +8% Fire Rate • -5% Corn Cost',
  },
  rare: {
    id: 'rare',
    name: 'Rare',
    subtitle: 'Cobalt Overdrive',
    chance: 0.28,
    color: '#38BDF8',
    borderColor: '#0284C7',
    bgTint: '#102A43',
    damageMult: 1.45,
    fireRateMult: 1.16,
    rangeMult: 1.1,
    bonusPierce: 1,
    bonusProjectiles: 0,
    foxMult: 1.15,
    costMult: 0.9,
    grantsCamo: false,
    bonusCritChance: 0.04,
    bonusKnockback: 0,
    summary: '+45% DMG • +16% Spd • +10% Range • +1 Pierce • -10% Cost',
  },
  epic: {
    id: 'epic',
    name: 'Epic',
    subtitle: 'Void-Crazed DNA',
    chance: 0.13,
    color: '#C084FC',
    borderColor: '#9333EA',
    bgTint: '#291544',
    damageMult: 1.85,
    fireRateMult: 1.26,
    rangeMult: 1.18,
    bonusPierce: 3,
    bonusProjectiles: 0,
    foxMult: 1.25,
    costMult: 0.85,
    grantsCamo: true,
    bonusCritChance: 0.08,
    bonusKnockback: 8,
    summary: '+85% DMG • +26% Spd • +18% Rng • +3 Pierce • Camo • -15% Cost',
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary',
    subtitle: 'Celestial True-Form',
    chance: 0.04,
    color: '#FACC15',
    borderColor: '#F59E0B',
    bgTint: '#3A290C',
    damageMult: 2.5,
    fireRateMult: 1.4,
    rangeMult: 1.28,
    bonusPierce: 6,
    bonusProjectiles: 1,
    foxMult: 1.6,
    costMult: 0.78,
    grantsCamo: true,
    bonusCritChance: 0.15,
    bonusKnockback: 18,
    summary:
      '+150% DMG • +40% Spd • +1 Shot • +6 Pierce • 15% Crit & KB • -22% Cost',
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

function pickWeightedUnit(candidates: readonly ChickenTypeId[]): ChickenTypeId {
  // Gently weight cheaper/mid capsule units slightly higher while keeping mythics exciting & reachable!
  const weights = candidates.map((id) => {
    const cost = CHICKEN_DEFS[id].baseCost;
    if (cost <= 2000) return 10;
    if (cost <= 12000) return 8.5;
    if (cost <= 50000) return 6.8;
    if (cost <= 200000) return 5.0;
    if (cost <= 500000) return 3.6;
    return 2.6;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
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

  private loadFromStorage(): PlayerSaveData {
    const fallback = createDefaultSaveData();
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    try {
      const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<PlayerSaveData>;

      const unlockedUnits: Partial<Record<ChickenTypeId, boolean>> = {};
      // Starter units up to Cyber-Cluck 9000 are ALWAYS owned
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
          if (m && m in MUTATION_DEFS) {
            unitMutations[id] = m;
          }
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

      return {
        version: 1,
        eggs: Math.max(0, Math.floor(Number(parsed.eggs ?? 0) || 0)),
        totalEggsEarned: Math.max(0, Math.floor(Number(parsed.totalEggsEarned ?? 0) || 0)),
        lifetimeBugsKilled: Math.max(0, Math.floor(Number(parsed.lifetimeBugsKilled ?? 0) || 0)),
        bugKillRemainder: Math.max(
          0,
          Math.min(BUGS_PER_EGG - 1, Math.floor(Number(parsed.bugKillRemainder ?? 0) || 0))
        ),
        gemEggsOpened: Math.max(0, Math.floor(Number(parsed.gemEggsOpened ?? 0) || 0)),
        unlockedUnits,
        unitMutations,
        unitPlusLevels,
      };
    } catch {
      return fallback;
    }
  }

  public save(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Ignore quota errors in restricted sandboxes
    }
    if (this.onChange) this.onChange();
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

  public isUnlocked(id: ChickenTypeId): boolean {
    if (STARTER_CHICKEN_IDS.includes(id)) return true;
    return this.data.unlockedUnits[id] === true;
  }

  public getUnlockedCount(): number {
    let count = 0;
    for (const id of CHICKEN_ORDER) {
      if (this.isUnlocked(id)) count++;
    }
    return count;
  }

  public getMutation(id: ChickenTypeId): MutationTier | null {
    return this.data.unitMutations[id] ?? null;
  }

  public getPlusLevel(id: ChickenTypeId): number {
    return this.data.unitPlusLevels[id] ?? 0;
  }

  /**
   * Banks unbanked bug kills when a round ends!
   * Awards 1 Egg per 2,500 bugs killed and persists carry-over remainder to localStorage.
   */
  public bankBugsAfterRound(bugsKilledDelta: number): EggBankResult {
    const cleanDelta = Math.max(0, Math.floor(bugsKilledDelta));
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
        // Very first Gem Egg ever guarantees an exciting new post-Cyber-Cluck unit!
        const lockedGacha = GEM_EGG_CHICKEN_IDS.filter((id) => !this.isUnlocked(id));
        chosenUnit = pickWeightedUnit(lockedGacha.length > 0 ? lockedGacha : GEM_EGG_CHICKEN_IDS);
      } else {
        // 82% Gem Egg Exclusive Pool, 18% Classic Starter Pool (so starters can also earn Mutations!)
        const useGachaPool = Math.random() < 0.82;
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
        // Already owned -> Awaken / Upgrade a Mutation + increment Battle Cats +Level!
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

    this.save();
    return results;
  }
}

export const PROGRESSION = new ProgressionStore();
