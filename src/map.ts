import { PlacedChicken } from './types';

export const MAP_WIDTH = 920;
export const MAP_HEIGHT = 600;
export const PATH_HALF_WIDTH = 25;
export const CHICKEN_FOOTPRINT_RADIUS = 22;

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

// Winding Bloons-style meadow path with juicy inner U-bends for splash/frost/ninja chickens!
export const PATH_WAYPOINTS: readonly Point2D[] = [
  { x: 18, y: 130 },
  { x: 230, y: 130 },
  { x: 230, y: 455 },
  { x: 455, y: 455 },
  { x: 455, y: 120 },
  { x: 690, y: 120 },
  { x: 690, y: 465 },
  { x: 842, y: 465 },
];

export const POND_OBSTACLE: PondObstacle = {
  x: 572,
  y: 310,
  rx: 52,
  ry: 38,
};

export const DECOR_TREES: readonly { x: number; y: number; r: number }[] = [
  { x: 54, y: 46, r: 28 },
  { x: 868, y: 58, r: 30 },
  { x: 58, y: 542, r: 30 },
  { x: 342, y: 548, r: 25 },
  { x: 868, y: 242, r: 27 },
];

interface PathSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  cumStart: number;
  angle: number;
}

const SEGMENTS: PathSegment[] = [];
let totalLen = 0;

for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
  const a = PATH_WAYPOINTS[i];
  const b = PATH_WAYPOINTS[i + 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  SEGMENTS.push({
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    length: len,
    cumStart: totalLen,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  });
  totalLen += len;
}

export const TOTAL_PATH_LENGTH = totalLen;
export const NEST_POSITION: Point2D = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1];
export const ENTRANCE_POSITION: Point2D = PATH_WAYPOINTS[0];

export function getPointAlongPath(
  distance: number,
  lateralOffset = 0
): { x: number; y: number; angle: number } {
  const clamped = Math.max(0, Math.min(TOTAL_PATH_LENGTH, distance));
  for (let i = 0; i < SEGMENTS.length; i++) {
    const seg = SEGMENTS[i];
    if (clamped <= seg.cumStart + seg.length || i === SEGMENTS.length - 1) {
      const t = seg.length > 0 ? (clamped - seg.cumStart) / seg.length : 0;
      const bx = seg.x1 + (seg.x2 - seg.x1) * t;
      const by = seg.y1 + (seg.y2 - seg.y1) * t;
      const nx = -Math.sin(seg.angle) * lateralOffset;
      const ny = Math.cos(seg.angle) * lateralOffset;
      return { x: bx + nx, y: by + ny, angle: seg.angle };
    }
  }
  return { x: NEST_POSITION.x, y: NEST_POSITION.y, angle: 0 };
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
  existingTowers: readonly PlacedChicken[]
): boolean {
  // 1. Inside playable meadow bounds
  if (x < 34 || x > MAP_WIDTH - 34 || y < 34 || y > MAP_HEIGHT - 34) {
    return false;
  }

  // 2. Keep clear of the Golden Egg Nest & Bug Entrance
  if (Math.hypot(x - NEST_POSITION.x, y - NEST_POSITION.y) < 54) return false;
  if (Math.hypot(x - ENTRANCE_POSITION.x, y - ENTRANCE_POSITION.y) < 46) return false;

  // 3. Keep clear of the winding dirt path
  for (const seg of SEGMENTS) {
    if (
      distPointToSegment(x, y, seg.x1, seg.y1, seg.x2, seg.y2) <
      PATH_HALF_WIDTH + CHICKEN_FOOTPRINT_RADIUS - 2
    ) {
      return false;
    }
  }

  // 4. Keep clear of decorative pond & trees
  const pondNorm =
    Math.pow((x - POND_OBSTACLE.x) / (POND_OBSTACLE.rx + 14), 2) +
    Math.pow((y - POND_OBSTACLE.y) / (POND_OBSTACLE.ry + 14), 2);
  if (pondNorm < 1) return false;

  for (const tree of DECOR_TREES) {
    if (Math.hypot(x - tree.x, y - tree.y) < tree.r + 16) return false;
  }

  // 5. Keep clear of existing Chicken Troops
  for (const t of existingTowers) {
    if (Math.hypot(x - t.x, y - t.y) < CHICKEN_FOOTPRINT_RADIUS * 2) {
      return false;
    }
  }

  return true;
}
