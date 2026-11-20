import { ActiveEnemy, ChickenTypeId, MapId, PlacedChicken } from './types';

export const MAP_WIDTH = 920;
export const MAP_HEIGHT = 600;
export const PATH_HALF_WIDTH = 25;
export const CHICKEN_FOOTPRINT_RADIUS = 22;

const COMPACT_CHICK_SET = new Set<ChickenTypeId>([
  'bantam',
  'pecker',
  'sling_chick',
  'honey',
  'chilly',
  'ninja',
]);

const STANDARD_TROOP_SET = new Set<ChickenTypeId>([
  'boomerang',
  'alchemist',
  'ranger',
  'cactus_hen',
  'wizard',
  'phoenix',
  'cowboy_desperado',
  'chrono',
  'plague_doctor',
  'samurai_shogun',
  'necro_lich',
  'tengu_shadow',
]);

const BEHEMOTH_TROOP_SET = new Set<ChickenTypeId>([
  'astral_astrologer',
  'star_dread',
  'leviathan_kraken',
  'abyss_wyrm',
  'quasar',
  'archangel_seraph',
  'chronos_empress',
  'omega_god',
]);

const COLOSSAL_TITAN_SET = new Set<ChickenTypeId>([
  'mech_zilla',
  'gaia_creator',
  'void_singularity',
  'malevolent_chicken',
  'limitless_chicken',
  'golden_deity',
  'solar_emperor',
  'eternity_weaver',
  'complete_cluck',
]);

export function getChickenFootprintRadius(typeId?: ChickenTypeId): number {
  if (!typeId) return CHICKEN_FOOTPRINT_RADIUS;
  if (COMPACT_CHICK_SET.has(typeId)) return 18;
  if (STANDARD_TROOP_SET.has(typeId)) return 22;
  if (BEHEMOTH_TROOP_SET.has(typeId)) return 31;
  if (COLOSSAL_TITAN_SET.has(typeId)) return 36;
  return 26;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface PondObstacle {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface PathSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dx: number;
  dy: number;
  length: number;
  invLen: number;
  cumStart: number;
  angle: number;
  cos: number;
  sin: number;
}

export type MapBiomeStyle = 'meadow' | 'fjord' | 'caldera' | 'bog' | 'cosmic';

export interface MapTheme {
  tileOdd: string;
  tileEven: string;
  tuftOdd: string;
  tuftEven: string;
  roadBorder: string;
  roadCurb: string;
  roadFill: string;
  cobbleDark: string;
  cobbleLight: string;
  poolOuter: string;
  poolRim: string;
  poolFill: string;
  poolHighlight: string;
  poolAccent: string;
  treeTrunk: string;
  treeDark: string;
  treeMid: string;
  treeLight: string;
  denOuter: string;
  denStripe: string;
  denEye: string;
}

export interface RawMapSpec {
  id: MapId;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  biome: MapBiomeStyle;
  waypoints: readonly Point2D[];
  ponds: readonly PondObstacle[];
  trees: readonly { x: number; y: number; r: number }[];
  flowers: readonly { x: number; y: number; c: string }[];
  theme: MapTheme;
}

export interface MapDefinition extends RawMapSpec {
  segments: readonly PathSegment[];
  totalPathLength: number;
  entrancePos: Point2D;
  nestPos: Point2D;
}

function compileMapSpec(spec: RawMapSpec): MapDefinition {
  const segments: PathSegment[] = [];
  let totalLen = 0;
  for (let i = 0; i < spec.waypoints.length - 1; i++) {
    const a = spec.waypoints[i];
    const b = spec.waypoints[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    segments.push({
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      dx,
      dy,
      length: len,
      invLen: len > 0 ? 1 / len : 0,
      cumStart: totalLen,
      angle,
      cos: Math.cos(angle),
      sin: Math.sin(angle),
    });
    totalLen += len;
  }
  return {
    ...spec,
    segments,
    totalPathLength: totalLen,
    entrancePos: spec.waypoints[0],
    nestPos: spec.waypoints[spec.waypoints.length - 1],
  };
}

export const MAP_ORDER: readonly MapId[] = [
  'sunny_meadow',
  'frostbite_fjord',
  'ember_caldera',
  'whispering_bog',
  'starlight_sanctum',
];

const RAW_MAPS: Record<MapId, RawMapSpec> = {
  // 1. SUNNY CLOVER MEADOW — Beginner (1,829 px, classic triple U-bends)
  sunny_meadow: {
    id: 'sunny_meadow',
    name: 'Sunny Clover Meadow',
    badge: 'BEGINNER',
    badgeColor: '#4ADE80',
    description: 'Long winding farm road with generous U-bends around the lilypad pond.',
    biome: 'meadow',
    waypoints: [
      { x: 18, y: 130 },
      { x: 230, y: 130 },
      { x: 230, y: 455 },
      { x: 455, y: 455 },
      { x: 455, y: 120 },
      { x: 690, y: 120 },
      { x: 690, y: 465 },
      { x: 842, y: 465 },
    ],
    ponds: [{ x: 572, y: 310, rx: 52, ry: 38 }],
    trees: [
      { x: 54, y: 46, r: 28 },
      { x: 868, y: 58, r: 30 },
      { x: 58, y: 542, r: 30 },
      { x: 342, y: 548, r: 25 },
      { x: 868, y: 242, r: 27 },
    ],
    flowers: [
      { x: 115, y: 235, c: '#FEF08A' },
      { x: 145, y: 380, c: '#FB7185' },
      { x: 335, y: 340, c: '#93C5FD' },
      { x: 405, y: 225, c: '#FDE047' },
      { x: 575, y: 205, c: '#FFFFFF' },
      { x: 565, y: 455, c: '#F472B6' },
      { x: 775, y: 355, c: '#C4B5FD' },
      { x: 785, y: 185, c: '#FEF08A' },
      { x: 130, y: 495, c: '#FDE047' },
      { x: 350, y: 165, c: '#FFFFFF' },
    ],
    theme: {
      tileOdd: '#49A835',
      tileEven: '#54B83C',
      tuftOdd: '#3B8D29',
      tuftEven: '#68CC4E',
      roadBorder: '#5C3A1E',
      roadCurb: '#9C6B3B',
      roadFill: '#DFBA84',
      cobbleDark: '#C69B61',
      cobbleLight: '#EED3A7',
      poolOuter: '#6B4F35',
      poolRim: '#93704D',
      poolFill: '#0284C7',
      poolHighlight: '#38BDF8',
      poolAccent: '#F472B6',
      treeTrunk: '#78350F',
      treeDark: '#15803D',
      treeMid: '#22C55E',
      treeLight: '#86EFAC',
      denOuter: '#78350F',
      denStripe: '#92400E',
      denEye: '#EF4444',
    },
  },

  // 2. FROSTBITE PINE FJORD — Intermediate (1,702 px, inward glacial spiral)
  frostbite_fjord: {
    id: 'frostbite_fjord',
    name: 'Frostbite Pine Fjord',
    badge: 'INTERMEDIATE',
    badgeColor: '#38BDF8',
    description: 'Inward-coiling permafrost road circling an icy central sanctuary.',
    biome: 'fjord',
    waypoints: [
      { x: 18, y: 465 },
      { x: 240, y: 465 },
      { x: 240, y: 130 },
      { x: 680, y: 130 },
      { x: 680, y: 455 },
      { x: 465, y: 455 },
      { x: 465, y: 290 },
    ],
    ponds: [
      { x: 125, y: 265, rx: 46, ry: 36 },
      { x: 805, y: 295, rx: 44, ry: 46 },
    ],
    trees: [
      { x: 72, y: 72, r: 27 },
      { x: 845, y: 76, r: 29 },
      { x: 835, y: 520, r: 28 },
      { x: 355, y: 540, r: 24 },
      { x: 585, y: 540, r: 24 },
    ],
    flowers: [
      { x: 345, y: 215, c: '#38BDF8' },
      { x: 565, y: 220, c: '#E0F2FE' },
      { x: 355, y: 380, c: '#7DD3FC' },
      { x: 575, y: 345, c: '#BAE6FD' },
      { x: 155, y: 125, c: '#FFFFFF' },
      { x: 785, y: 165, c: '#38BDF8' },
      { x: 115, y: 540, c: '#7DD3FC' },
    ],
    theme: {
      tileOdd: '#CBD5E1',
      tileEven: '#DBEAFE',
      tuftOdd: '#94A3B8',
      tuftEven: '#FFFFFF',
      roadBorder: '#1E3A8A',
      roadCurb: '#3B82F6',
      roadFill: '#93C5FD',
      cobbleDark: '#60A5FA',
      cobbleLight: '#E0F2FE',
      poolOuter: '#334155',
      poolRim: '#64748B',
      poolFill: '#0EA5E9',
      poolHighlight: '#7DD3FC',
      poolAccent: '#FFFFFF',
      treeTrunk: '#475569',
      treeDark: '#0F766E',
      treeMid: '#14B8A6',
      treeLight: '#F8FAFC',
      denOuter: '#334155',
      denStripe: '#475569',
      denEye: '#38BDF8',
    },
  },

  // 3. SCORCHED ROOST CALDERA — Advanced (1,537 px, twin magma switchbacks)
  ember_caldera: {
    id: 'ember_caldera',
    name: 'Scorched Roost Caldera',
    badge: 'ADVANCED',
    badgeColor: '#FB923C',
    description: 'Volcanic basalt switchbacks flanked by bubbling magma pools.',
    biome: 'caldera',
    waypoints: [
      { x: 18, y: 150 },
      { x: 285, y: 150 },
      { x: 285, y: 445 },
      { x: 575, y: 445 },
      { x: 575, y: 155 },
      { x: 765, y: 155 },
      { x: 765, y: 380 },
    ],
    ponds: [
      { x: 430, y: 295, rx: 52, ry: 40 },
      { x: 145, y: 365, rx: 46, ry: 34 },
    ],
    trees: [
      { x: 70, y: 520, r: 26 },
      { x: 430, y: 72, r: 25 },
      { x: 855, y: 80, r: 28 },
      { x: 855, y: 515, r: 28 },
      { x: 675, y: 525, r: 25 },
    ],
    flowers: [
      { x: 175, y: 245, c: '#F97316' },
      { x: 425, y: 175, c: '#FACC15' },
      { x: 670, y: 275, c: '#EF4444' },
      { x: 670, y: 410, c: '#FB923C' },
      { x: 215, y: 525, c: '#FACC15' },
      { x: 845, y: 275, c: '#F97316' },
    ],
    theme: {
      tileOdd: '#292524',
      tileEven: '#332D2B',
      tuftOdd: '#1C1917',
      tuftEven: '#57534E',
      roadBorder: '#450A0A',
      roadCurb: '#991B1B',
      roadFill: '#78716C',
      cobbleDark: '#57534E',
      cobbleLight: '#FDBA74',
      poolOuter: '#451A03',
      poolRim: '#9A3412',
      poolFill: '#EA580C',
      poolHighlight: '#FACC15',
      poolAccent: '#FEF08A',
      treeTrunk: '#1C1917',
      treeDark: '#44403C',
      treeMid: '#78716C',
      treeLight: '#F97316',
      denOuter: '#450A0A',
      denStripe: '#7F1D1D',
      denEye: '#FACC15',
    },
  },

  // 4. WHISPERING HONEY-BOG — Expert (1,332 px, fast murky swamp march)
  whispering_bog: {
    id: 'whispering_bog',
    name: 'Whispering Honey-Bog',
    badge: 'EXPERT',
    badgeColor: '#A855F7',
    description: 'Short, treacherous twilight marsh — slow & splash towers are vital!',
    biome: 'bog',
    waypoints: [
      { x: 18, y: 470 },
      { x: 265, y: 470 },
      { x: 265, y: 175 },
      { x: 575, y: 175 },
      { x: 575, y: 395 },
      { x: 835, y: 395 },
    ],
    ponds: [
      { x: 420, y: 345, rx: 54, ry: 42 },
      { x: 135, y: 245, rx: 44, ry: 36 },
    ],
    trees: [
      { x: 72, y: 82, r: 28 },
      { x: 420, y: 72, r: 26 },
      { x: 745, y: 105, r: 30 },
      { x: 420, y: 525, r: 27 },
      { x: 855, y: 525, r: 28 },
    ],
    flowers: [
      { x: 185, y: 365, c: '#34D399' },
      { x: 355, y: 255, c: '#E879F9' },
      { x: 495, y: 260, c: '#A3E635' },
      { x: 685, y: 265, c: '#C084FC' },
      { x: 695, y: 495, c: '#34D399' },
      { x: 215, y: 105, c: '#E879F9' },
    ],
    theme: {
      tileOdd: '#1B3329',
      tileEven: '#223F33',
      tuftOdd: '#12241C',
      tuftEven: '#34D399',
      roadBorder: '#3B0764',
      roadCurb: '#6B21A8',
      roadFill: '#854D0E',
      cobbleDark: '#713F12',
      cobbleLight: '#CA8A04',
      poolOuter: '#14532D',
      poolRim: '#15803D',
      poolFill: '#10B981',
      poolHighlight: '#6EE7B7',
      poolAccent: '#E879F9',
      treeTrunk: '#3F2E21',
      treeDark: '#064E3B',
      treeMid: '#047857',
      treeLight: '#A7F3D0',
      denOuter: '#3B0764',
      denStripe: '#581C87',
      denEye: '#34D399',
    },
  },

  // 5. COSMIC EGG SANCTUM — Master (1,242 px, high-speed astral bridge)
  starlight_sanctum: {
    id: 'starlight_sanctum',
    name: 'Cosmic Egg Sanctum',
    badge: 'MASTER',
    badgeColor: '#F43F5E',
    description: 'Ultra-short celestial star-bridge! Built for true Apex Egg-God masters.',
    biome: 'cosmic',
    waypoints: [
      { x: 18, y: 300 },
      { x: 250, y: 300 },
      { x: 250, y: 155 },
      { x: 590, y: 155 },
      { x: 590, y: 435 },
      { x: 835, y: 435 },
    ],
    ponds: [
      { x: 420, y: 315, rx: 52, ry: 40 },
      { x: 745, y: 235, rx: 46, ry: 36 },
    ],
    trees: [
      { x: 85, y: 115, r: 26 },
      { x: 85, y: 485, r: 26 },
      { x: 420, y: 495, r: 26 },
      { x: 845, y: 95, r: 28 },
    ],
    flowers: [
      { x: 165, y: 205, c: '#22D3EE' },
      { x: 340, y: 230, c: '#FEF08A' },
      { x: 505, y: 235, c: '#F472B6' },
      { x: 515, y: 410, c: '#FFFFFF' },
      { x: 705, y: 345, c: '#38BDF8' },
      { x: 350, y: 75, c: '#E879F9' },
      { x: 720, y: 525, c: '#FEF08A' },
    ],
    theme: {
      tileOdd: '#17153B',
      tileEven: '#1E1B4B',
      tuftOdd: '#312E81',
      tuftEven: '#818CF8',
      roadBorder: '#701A75',
      roadCurb: '#C026D3',
      roadFill: '#FDE68A',
      cobbleDark: '#F59E0B',
      cobbleLight: '#FFFFFF',
      poolOuter: '#2E1065',
      poolRim: '#7E22CE',
      poolFill: '#4C1D95',
      poolHighlight: '#22D3EE',
      poolAccent: '#FEF08A',
      treeTrunk: '#312E81',
      treeDark: '#6D28D9',
      treeMid: '#EC4899',
      treeLight: '#67E8F9',
      denOuter: '#2E1065',
      denStripe: '#7E22CE',
      denEye: '#22D3EE',
    },
  },
};

export const MAP_DEFS: Record<MapId, MapDefinition> = {
  sunny_meadow: compileMapSpec(RAW_MAPS.sunny_meadow),
  frostbite_fjord: compileMapSpec(RAW_MAPS.frostbite_fjord),
  ember_caldera: compileMapSpec(RAW_MAPS.ember_caldera),
  whispering_bog: compileMapSpec(RAW_MAPS.whispering_bog),
  starlight_sanctum: compileMapSpec(RAW_MAPS.starlight_sanctum),
};

let activeMapId: MapId = 'sunny_meadow';

export function setActiveMap(id: MapId): MapDefinition {
  activeMapId = id;
  return MAP_DEFS[activeMapId];
}

export function getActiveMap(): MapDefinition {
  return MAP_DEFS[activeMapId];
}

export function getTotalPathLength(mapDef = getActiveMap()): number {
  return mapDef.totalPathLength;
}

export function getEntrancePosition(mapDef = getActiveMap()): Point2D {
  return mapDef.entrancePos;
}

export function getNestPosition(mapDef = getActiveMap()): Point2D {
  return mapDef.nestPos;
}

export function getPointAlongPath(
  distance: number,
  lateralOffset = 0,
  mapDef = getActiveMap()
): { x: number; y: number; angle: number } {
  const segs = mapDef.segments;
  const clamped = Math.max(0, Math.min(mapDef.totalPathLength, distance));
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (clamped <= seg.cumStart + seg.length || i === segs.length - 1) {
      const t = (clamped - seg.cumStart) * seg.invLen;
      return {
        x: seg.x1 + seg.dx * t - seg.sin * lateralOffset,
        y: seg.y1 + seg.dy * t + seg.cos * lateralOffset,
        angle: seg.angle,
      };
    }
  }
  return { x: mapDef.nestPos.x, y: mapDef.nestPos.y, angle: 0 };
}

/**
 * Zero-allocation in-place path coordinate update for ActiveEnemy!
 * Avoids millions of {x, y, angle} heap allocations & trig calls during swarm waves.
 */
export function syncEnemyPathPosition(
  enemy: ActiveEnemy,
  mapDef = getActiveMap()
): void {
  const segs = mapDef.segments;
  const clamped = Math.max(0, Math.min(mapDef.totalPathLength, enemy.distance));
  const lat = enemy.lateralOffset;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (clamped <= seg.cumStart + seg.length || i === segs.length - 1) {
      const t = (clamped - seg.cumStart) * seg.invLen;
      enemy.x = seg.x1 + seg.dx * t - seg.sin * lat;
      enemy.y = seg.y1 + seg.dy * t + seg.cos * lat;
      enemy.angle = seg.angle;
      return;
    }
  }
  enemy.x = mapDef.nestPos.x;
  enemy.y = mapDef.nestPos.y;
  enemy.angle = 0;
}

function distPointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function canPlaceChickenAt(
  x: number,
  y: number,
  existingTowers: readonly PlacedChicken[],
  mapDef = getActiveMap(),
  typeId?: ChickenTypeId
): boolean {
  const footR = getChickenFootprintRadius(typeId);
  const edgeMargin = Math.max(30, footR + 4);

  // 1. Inside playable stage bounds
  if (
    x < edgeMargin ||
    x > MAP_WIDTH - edgeMargin ||
    y < edgeMargin ||
    y > MAP_HEIGHT - edgeMargin
  ) {
    return false;
  }

  // 2. Keep clear of the Golden Egg Nest & Bug Entrance
  if (Math.hypot(x - mapDef.nestPos.x, y - mapDef.nestPos.y) < 34 + footR) return false;
  if (Math.hypot(x - mapDef.entrancePos.x, y - mapDef.entrancePos.y) < 28 + footR) return false;

  // 3. Keep clear of the active map's winding path
  for (const seg of mapDef.segments) {
    if (
      distPointToSegment(x, y, seg.x1, seg.y1, seg.x2, seg.y2) <
      PATH_HALF_WIDTH + footR - 2
    ) {
      return false;
    }
  }

  // 4. Keep clear of map pools/lava/rifts & decorative trees/spires/crystals
  for (const pond of mapDef.ponds) {
    const pondPad = Math.max(12, footR * 0.65);
    const pondNorm =
      Math.pow((x - pond.x) / (pond.rx + pondPad), 2) +
      Math.pow((y - pond.y) / (pond.ry + pondPad), 2);
    if (pondNorm < 1) return false;
  }

  for (const tree of mapDef.trees) {
    if (Math.hypot(x - tree.x, y - tree.y) < tree.r + footR * 0.72) return false;
  }

  // 5. Keep clear of existing Chicken Troops (scaled by both units' physical footprints!)
  for (const t of existingTowers) {
    const otherR = getChickenFootprintRadius(t.typeId);
    if (Math.hypot(x - t.x, y - t.y) < footR + otherR) {
      return false;
    }
  }

  return true;
}
