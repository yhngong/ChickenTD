import { CHICKEN_DEFS, ENEMY_DEFS } from './data';
import { ChickenTdEngine } from './engine';
import {
  canPlaceChickenAt,
  getActiveMap,
  getPointAlongPath,
  MAP_DEFS,
  MapDefinition,
  PATH_HALF_WIDTH,
} from './map';
import { MUTATION_DEFS, PROGRESSION } from './progression';
import { PIXEL_ATLAS } from './sprites';
import {
  ActiveEnemy,
  ActiveProjectile,
  ActiveStand,
  ChickenTypeId,
  MapId,
  PlacedChicken,
} from './types';

export interface GhostPlacementState {
  typeId: ChickenTypeId | null;
  mouseX: number;
  mouseY: number;
  insideCanvas: boolean;
}

// Low-resolution integer pixel-art canvas dimensions (exact 1:2 of 920x600 logical map!)
export const PIXEL_CANVAS_W = 460;
export const PIXEL_CANVAS_H = 300;
const S = 0.5; // logical -> pixel scale

const OUTLINE = '#181425';

const PIXEL_FONT_3X5: Record<string, readonly string[]> = {
  A: ['.1.', '1.1', '111', '1.1', '1.1'],
  B: ['11.', '1.1', '11.', '1.1', '11.'],
  C: ['.11', '1..', '1..', '1..', '.11'],
  D: ['11.', '1.1', '1.1', '1.1', '11.'],
  E: ['111', '1..', '11.', '1..', '111'],
  F: ['111', '1..', '11.', '1..', '1..'],
  G: ['.11', '1..', '1.1', '1.1', '.11'],
  H: ['1.1', '1.1', '111', '1.1', '1.1'],
  I: ['111', '.1.', '.1.', '.1.', '111'],
  J: ['..1', '..1', '..1', '1.1', '.1.'],
  K: ['1.1', '1.1', '11.', '1.1', '1.1'],
  L: ['1..', '1..', '1..', '1..', '111'],
  M: ['1.1', '111', '111', '1.1', '1.1'],
  N: ['1.1', '111', '111', '111', '1.1'],
  O: ['.1.', '1.1', '1.1', '1.1', '.1.'],
  P: ['11.', '1.1', '11.', '1..', '1..'],
  Q: ['.1.', '1.1', '1.1', '11.', '..1'],
  R: ['11.', '1.1', '11.', '1.1', '1.1'],
  S: ['.11', '1..', '.1.', '..1', '11.'],
  T: ['111', '.1.', '.1.', '.1.', '.1.'],
  U: ['1.1', '1.1', '1.1', '1.1', '111'],
  V: ['1.1', '1.1', '1.1', '.1.', '.1.'],
  W: ['1.1', '1.1', '111', '111', '1.1'],
  X: ['1.1', '1.1', '.1.', '1.1', '1.1'],
  Y: ['1.1', '1.1', '.1.', '.1.', '.1.'],
  Z: ['111', '..1', '.1.', '1..', '111'],
  '0': ['111', '1.1', '1.1', '1.1', '111'],
  '1': ['.1.', '11.', '.1.', '.1.', '111'],
  '2': ['111', '..1', '111', '1..', '111'],
  '3': ['111', '..1', '.11', '..1', '111'],
  '4': ['1.1', '1.1', '111', '..1', '..1'],
  '5': ['111', '1..', '111', '..1', '111'],
  '6': ['111', '1..', '111', '1.1', '111'],
  '7': ['111', '..1', '.1.', '.1.', '.1.'],
  '8': ['111', '1.1', '111', '1.1', '111'],
  '9': ['111', '1.1', '111', '..1', '111'],
  '+': ['...', '.1.', '111', '.1.', '...'],
  '-': ['...', '...', '111', '...', '...'],
  '!': ['.1.', '.1.', '.1.', '...', '.1.'],
  '%': ['1.1', '..1', '.1.', '1..', '1.1'],
  '/': ['..1', '..1', '.1.', '1..', '1..'],
  ':': ['...', '.1.', '...', '.1.', '...'],
  '.': ['...', '...', '...', '...', '.1.'],
  ' ': ['...', '...', '...', '...', '...'],
};

const TEXT_STAMP_CACHE = new Map<string, HTMLCanvasElement>();
const MAX_TEXT_STAMP_CACHE = 96;

function renderCrispPixelTextDirect(
  ctx: CanvasRenderingContext2D,
  text: string,
  startX: number,
  startY: number,
  color: string
): void {
  // Dark pixel backing plate / shadow for instant readability
  ctx.fillStyle = OUTLINE;
  for (let i = 0; i < text.length; i++) {
    const glyph = PIXEL_FONT_3X5[text[i]] ?? PIXEL_FONT_3X5[' '];
    const gx = startX + i * 4;
    for (let ry = 0; ry < 5; ry++) {
      for (let rx = 0; rx < 3; rx++) {
        if (glyph[ry][rx] === '1') {
          ctx.fillRect(gx + rx - 1, startY + ry, 3, 1);
          ctx.fillRect(gx + rx, startY + ry - 1, 1, 3);
          ctx.fillRect(gx + rx + 1, startY + ry + 1, 1, 1);
        }
      }
    }
  }

  ctx.fillStyle = color;
  for (let i = 0; i < text.length; i++) {
    const glyph = PIXEL_FONT_3X5[text[i]] ?? PIXEL_FONT_3X5[' '];
    const gx = startX + i * 4;
    for (let ry = 0; ry < 5; ry++) {
      for (let rx = 0; rx < 3; rx++) {
        if (glyph[ry][rx] === '1') {
          ctx.fillRect(gx + rx, startY + ry, 1, 1);
        }
      }
    }
  }
}

function drawCrispPixelText(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  cx: number,
  cy: number,
  color: string
): void {
  const text = rawText.toUpperCase();
  if (text.length === 0) return;
  const totalW = text.length * 4 - 1;
  const startX = Math.round(cx - totalW / 2);
  const startY = Math.round(cy - 2);

  if (typeof document === 'undefined') {
    renderCrispPixelTextDirect(ctx, text, startX, startY, color);
    return;
  }

  const key = `${text}|${color}`;
  let stamp = TEXT_STAMP_CACHE.get(key);
  if (!stamp) {
    if (TEXT_STAMP_CACHE.size >= MAX_TEXT_STAMP_CACHE) {
      const oldestKey = TEXT_STAMP_CACHE.keys().next().value;
      if (oldestKey !== undefined) TEXT_STAMP_CACHE.delete(oldestKey);
    }
    stamp = document.createElement('canvas');
    stamp.width = totalW + 3;
    stamp.height = 8;
    const sCtx = stamp.getContext('2d')!;
    sCtx.imageSmoothingEnabled = false;
    renderCrispPixelTextDirect(sCtx, text, 1, 1, color);
    TEXT_STAMP_CACHE.set(key, stamp);
  }

  ctx.drawImage(stamp, startX - 1, startY - 1);
}

function toPx(logicalVal: number): number {
  return Math.round(logicalVal * S);
}

/**
 * Midpoint integer pixel circle (dashed optional) — zero anti-aliased vector arcs!
 */
function drawPixelCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  dashed = false
): void {
  const rad = Math.max(1, Math.round(r));
  ctx.fillStyle = color;
  let x = rad;
  let y = 0;
  let err = 1 - x;
  let step = 0;

  while (x >= y) {
    if (!dashed || (step >> 1) % 2 === 0) {
      ctx.fillRect(cx + x, cy + y, 1, 1);
      ctx.fillRect(cx + y, cy + x, 1, 1);
      ctx.fillRect(cx - y, cy + x, 1, 1);
      ctx.fillRect(cx - x, cy + y, 1, 1);
      ctx.fillRect(cx - x, cy - y, 1, 1);
      ctx.fillRect(cx - y, cy - x, 1, 1);
      ctx.fillRect(cx + y, cy - x, 1, 1);
      ctx.fillRect(cx + x, cy - y, 1, 1);
    }
    step++;
    y++;
    if (err < 0) {
      err += 2 * y + 1;
    } else {
      x--;
      err += 2 * (y - x) + 1;
    }
  }
}

function drawFilledPixelDisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string
): void {
  ctx.fillStyle = color;
  const irx = Math.max(1, Math.round(rx));
  const iry = Math.max(1, Math.round(ry));
  for (let dy = -iry; dy <= iry; dy++) {
    const normY = dy / iry;
    const span = Math.floor(irx * Math.sqrt(Math.max(0, 1 - normY * normY)));
    ctx.fillRect(cx - span, cy + dy, span * 2 + 1, 1);
  }
}

function bakeStaticMapOntoCanvas(targetCanvas: HTMLCanvasElement, mapDef: MapDefinition): void {
  const ctx = targetCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const th = mapDef.theme;

  // 1. Pixel-art checkerboard biome tiles (20x20 px tiles)
  const tile = 20;
  for (let py = 0; py < PIXEL_CANVAS_H; py += tile) {
    for (let px = 0; px < PIXEL_CANVAS_W; px += tile) {
      const odd = ((px / tile + py / tile) & 1) === 1;
      ctx.fillStyle = odd ? th.tileOdd : th.tileEven;
      ctx.fillRect(px, py, tile, tile);

      // Deterministic pixel grass/snow/ash/star tufts inside each tile
      const hash = ((px * 73856093) ^ (py * 19349663)) >>> 0;
      ctx.fillStyle = odd ? th.tuftOdd : th.tuftEven;
      if (mapDef.biome === 'cosmic') {
        ctx.fillRect(px + (hash % 15) + 2, py + ((hash >> 4) % 15) + 2, 1, 1);
        if ((hash & 3) === 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(px + ((hash >> 8) % 14) + 3, py + ((hash >> 12) % 14) + 3, 1, 1);
        }
      } else {
        ctx.fillRect(px + (hash % 14) + 2, py + ((hash >> 4) % 14) + 2, 1, 2);
        ctx.fillRect(px + ((hash >> 8) % 14) + 3, py + ((hash >> 12) % 14) + 2, 2, 1);
      }
    }
  }

  // 2. Biome ground details (wildflowers / frost crystals / ember vents / bog mushrooms / star prisms)
  for (const f of mapDef.flowers) {
    const fx = toPx(f.x);
    const fy = toPx(f.y);
    if (mapDef.biome === 'meadow') {
      ctx.fillStyle = '#2E6F21';
      ctx.fillRect(fx, fy + 2, 1, 2);
    }
    ctx.fillStyle = f.c;
    ctx.fillRect(fx - 1, fy, 3, 1);
    ctx.fillRect(fx, fy - 1, 1, 3);
    ctx.fillStyle = mapDef.biome === 'cosmic' ? '#FFFFFF' : '#F59E0B';
    ctx.fillRect(fx, fy, 1, 1);
  }

  // 3. Chunky Stepped Pixel Road
  const halfPx = toPx(PATH_HALF_WIDTH);
  const wps = mapDef.waypoints;
  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i];
    const b = wps[i + 1];
    const x1 = Math.min(toPx(a.x), toPx(b.x)) - (halfPx + 2);
    const y1 = Math.min(toPx(a.y), toPx(b.y)) - (halfPx + 2);
    const x2 = Math.max(toPx(a.x), toPx(b.x)) + (halfPx + 2);
    const y2 = Math.max(toPx(a.y), toPx(b.y)) + (halfPx + 2);
    ctx.fillStyle = th.roadBorder;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }
  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i];
    const b = wps[i + 1];
    const x1 = Math.min(toPx(a.x), toPx(b.x)) - (halfPx + 1);
    const y1 = Math.min(toPx(a.y), toPx(b.y)) - (halfPx + 1);
    const x2 = Math.max(toPx(a.x), toPx(b.x)) + (halfPx + 1);
    const y2 = Math.max(toPx(a.y), toPx(b.y)) + (halfPx + 1);
    ctx.fillStyle = th.roadCurb;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }
  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i];
    const b = wps[i + 1];
    const x1 = Math.min(toPx(a.x), toPx(b.x)) - (halfPx - 1);
    const y1 = Math.min(toPx(a.y), toPx(b.y)) - (halfPx - 1);
    const x2 = Math.max(toPx(a.x), toPx(b.x)) + (halfPx - 1);
    const y2 = Math.max(toPx(a.y), toPx(b.y)) + (halfPx - 1);
    ctx.fillStyle = th.roadFill;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  }

  // Center pixel cobble trail markers
  for (let d = 18; d < mapDef.totalPathLength - 20; d += 26) {
    const pt = getPointAlongPath(d, 0, mapDef);
    const px = toPx(pt.x);
    const py = toPx(pt.y);
    ctx.fillStyle = th.cobbleDark;
    ctx.fillRect(px - 2, py - 1, 4, 2);
    ctx.fillStyle = th.cobbleLight;
    ctx.fillRect(px - 1, py - 1, 2, 1);
  }

  // 4. Pixel Pools / Glacier Lakes / Magma Pools / Void Rifts
  for (const pond of mapDef.ponds) {
    const pondX = toPx(pond.x);
    const pondY = toPx(pond.y);
    const pondRx = toPx(pond.rx);
    const pondRy = toPx(pond.ry);
    drawFilledPixelDisk(ctx, pondX, pondY, pondRx + 3, pondRy + 3, th.poolOuter);
    drawFilledPixelDisk(ctx, pondX, pondY, pondRx + 1, pondRy + 1, th.poolRim);
    drawFilledPixelDisk(ctx, pondX, pondY, pondRx, pondRy, th.poolFill);
    drawFilledPixelDisk(
      ctx,
      pondX - 2,
      pondY - 2,
      Math.max(3, pondRx - 4),
      Math.max(3, pondRy - 4),
      th.poolHighlight
    );

    if (mapDef.biome === 'meadow' || mapDef.biome === 'bog') {
      drawFilledPixelDisk(ctx, pondX + 7, pondY + 4, 5, 4, '#16A34A');
      ctx.fillStyle = th.poolAccent;
      ctx.fillRect(pondX + 6, pondY + 2, 2, 2);
    } else if (mapDef.biome === 'caldera') {
      drawFilledPixelDisk(ctx, pondX + 6, pondY + 3, 4, 3, th.poolAccent);
      drawFilledPixelDisk(ctx, pondX - 7, pondY - 3, 3, 2, '#FFFFFF');
    } else if (mapDef.biome === 'cosmic') {
      drawPixelCircle(ctx, pondX, pondY, Math.max(4, pondRy - 4), th.poolAccent, true);
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(pondX - 9, pondY - 5, 5, 1);
    ctx.fillRect(pondX - 6, pondY - 3, 3, 1);
  }

  // 5. Pixel Trees / Snow Pines / Obsidian Spires / Crystal Obelisks
  for (const tree of mapDef.trees) {
    const tx = toPx(tree.x);
    const ty = toPx(tree.y);
    const tr = toPx(tree.r);
    drawFilledPixelDisk(ctx, tx + 2, ty + 6, tr, Math.max(4, tr - 4), 'rgba(15,23,42,0.32)');

    if (mapDef.biome === 'caldera' || mapDef.biome === 'cosmic') {
      // Jagged obsidian volcano spire or floating astral crystal!
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(tx - 6, ty - 7, 12, 15);
      ctx.fillStyle = th.treeDark;
      ctx.fillRect(tx - 5, ty - 6, 10, 13);
      ctx.fillStyle = th.treeMid;
      ctx.fillRect(tx - 3, ty - 8, 6, 12);
      ctx.fillStyle = th.treeLight;
      ctx.fillRect(tx - 1, ty - 9, 3, 7);
    } else {
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(tx - 3, ty + 2, 6, 7);
      ctx.fillStyle = th.treeTrunk;
      ctx.fillRect(tx - 2, ty + 2, 4, 6);
      drawFilledPixelDisk(ctx, tx, ty, tr + 1, tr, OUTLINE);
      drawFilledPixelDisk(ctx, tx, ty, tr, tr - 1, th.treeDark);
      drawFilledPixelDisk(
        ctx,
        tx - 2,
        ty - 2,
        Math.max(3, tr - 3),
        Math.max(3, tr - 3),
        th.treeMid
      );
      drawFilledPixelDisk(
        ctx,
        tx - 3,
        ty - 4,
        Math.max(2, tr - 7),
        Math.max(2, tr - 7),
        th.treeLight
      );
    }
  }

  // 6. Pixel Den / Portal Entrance
  const ex = toPx(mapDef.entrancePos.x);
  const ey = toPx(mapDef.entrancePos.y);
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(ex - 9, ey - 13, 18, 26);
  ctx.fillStyle = th.denOuter;
  ctx.fillRect(ex - 8, ey - 12, 16, 24);
  ctx.fillStyle = th.denStripe;
  ctx.fillRect(ex - 7, ey - 10, 13, 5);
  ctx.fillRect(ex - 7, ey + 5, 13, 5);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(ex + 2, ey - 10, 6, 20);
  ctx.fillStyle = th.denEye;
  ctx.fillRect(ex + 4, ey - 3, 1, 1);
  ctx.fillRect(ex + 4, ey + 2, 1, 1);
}

/**
 * Bakes a crisp 115x75 pixel-art thumbnail PNG data URL for Main Menu Map Cards!
 */
export function bakeMapPreviewDataUrl(mapId: MapId): string {
  if (typeof document === 'undefined') return '';
  const mapDef = MAP_DEFS[mapId];
  const full = document.createElement('canvas');
  full.width = PIXEL_CANVAS_W;
  full.height = PIXEL_CANVAS_H;
  bakeStaticMapOntoCanvas(full, mapDef);

  // Stamp Golden Nest marker onto full canvas before downsampling
  const fCtx = full.getContext('2d')!;
  const nx = toPx(mapDef.nestPos.x);
  const ny = toPx(mapDef.nestPos.y);
  drawFilledPixelDisk(fCtx, nx, ny, 14, 11, OUTLINE);
  drawFilledPixelDisk(fCtx, nx, ny, 11, 8, '#FACC15');
  drawFilledPixelDisk(fCtx, nx, ny, 6, 5, '#FEF9C3');

  const thumb = document.createElement('canvas');
  thumb.width = 115;
  thumb.height = 75;
  const tCtx = thumb.getContext('2d')!;
  tCtx.imageSmoothingEnabled = false;
  tCtx.drawImage(full, 0, 0, 115, 75);
  return thumb.toDataURL();
}

export class MeadowRenderer {
  private mainCtx: CanvasRenderingContext2D | null;
  private staticBg: HTMLCanvasElement;
  private bakedMapId: MapId | null = null;
  private sortedTowersBuf: PlacedChicken[] = [];
  private lastTowerSortSig = '';
  // Overdraw guard for dense stacked swarms (230x150 = 2x2 pixel cells)
  private bugCellFrame = new Int32Array(230 * 150);
  private bugCellCount = new Uint8Array(230 * 150);
  private renderFrameCounter = 1;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = PIXEL_CANVAS_W;
    canvas.height = PIXEL_CANVAS_H;
    this.mainCtx =
      (canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D | null) ??
      canvas.getContext('2d');
    if (this.mainCtx) {
      this.mainCtx.imageSmoothingEnabled = false;
    }

    this.staticBg = document.createElement('canvas');
    this.staticBg.width = PIXEL_CANVAS_W;
    this.staticBg.height = PIXEL_CANVAS_H;
    this.setMap(getActiveMap().id);
  }

  public setMap(mapId: MapId): void {
    if (this.bakedMapId === mapId) return;
    this.bakedMapId = mapId;
    bakeStaticMapOntoCanvas(this.staticBg, MAP_DEFS[mapId]);
  }

  public render(
    canvas: HTMLCanvasElement,
    engine: ChickenTdEngine,
    selectedTowerId: number | null,
    ghost: GhostPlacementState,
    nowSec: number
  ): void {
    if (this.bakedMapId !== engine.mapId) {
      this.setMap(engine.mapId);
    }
    const ctx = this.mainCtx ?? canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    // 1. Static pixel biome background
    ctx.drawImage(this.staticBg, 0, 0);

    // 2. Pixel Golden Egg Nest
    this.drawPixelGoldenNest(ctx, engine.eggs, nowSec);

    // 3. Selected Chicken Pixel Range Circle (+ Highlighted Buffed Allies for Support Units!)
    if (selectedTowerId !== null) {
      const sel = engine.getTowerById(selectedTowerId);
      if (sel) {
        const selDef = CHICKEN_DEFS[sel.typeId];
        const eff = engine.getEffectiveChickenStats(sel);
        const cx = toPx(sel.x);
        const cy = toPx(sel.y);
        const r = toPx(eff.effectiveRange);
        drawFilledPixelDisk(
          ctx,
          cx,
          cy,
          r,
          r,
          selDef.isSupport ? 'rgba(56, 189, 248, 0.12)' : 'rgba(250, 204, 21, 0.10)'
        );
        drawPixelCircle(ctx, cx, cy, r, selDef.isSupport ? '#67E8F9' : '#FEF08A', true);

        if (selDef.isSupport) {
          const buffedAllies = engine.getTowersBuffedBy(sel);
          for (const ally of buffedAllies) {
            drawPixelCircle(ctx, toPx(ally.x), toPx(ally.y) + 2, 12, '#4ADE80', false);
          }
        }
      }
    }

    // 4. Ghost Placement Preview (Pixel Sprite + Pixel Range Ring + Support Aura Preview!)
    if (ghost.typeId && ghost.insideCanvas) {
      const def = CHICKEN_DEFS[ghost.typeId];
      const cost = engine.getTowerBaseCost(ghost.typeId);
      const valid =
        engine.isChickenUnlocked(ghost.typeId) &&
        canPlaceChickenAt(ghost.mouseX, ghost.mouseY, engine.towers) &&
        engine.corn >= cost;
      const range = engine.getPreviewRange(ghost.typeId);
      const gx = toPx(ghost.mouseX);
      const gy = toPx(ghost.mouseY);
      const gr = toPx(range);

      drawFilledPixelDisk(
        ctx,
        gx,
        gy,
        gr,
        gr,
        valid ? 'rgba(74, 222, 128, 0.13)' : 'rgba(239, 68, 68, 0.16)'
      );
      drawPixelCircle(ctx, gx, gy, gr, valid ? '#4ADE80' : '#EF4444', true);

      if (def.isSupport) {
        const previewBuffed = engine.getTowersInPreviewSupportAura(
          ghost.typeId,
          ghost.mouseX,
          ghost.mouseY
        );
        for (const ally of previewBuffed) {
          drawPixelCircle(ctx, toPx(ally.x), toPx(ally.y) + 2, 12, '#67E8F9', false);
        }
      }

      const spr = PIXEL_ATLAS.getChickenSprite(ghost.typeId);
      if (spr) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        if (ghost.typeId === 'stand_hen' && PIXEL_ATLAS.standSprites) {
          ctx.globalAlpha = 0.62;
          ctx.drawImage(PIXEL_ATLAS.standSprites.normalIdle, gx - 18, gy - 17);
          ctx.globalAlpha = 0.88;
        }
        ctx.drawImage(spr.idle, gx - 11, gy - 12);
        ctx.restore();
      }
    }

    // 5. Placed Chicken Troops (cached depth-sort by Y for authentic 2D pixel overlap!)
    const tLen = engine.towers.length;
    const sig =
      tLen === 0
        ? '0'
        : `${tLen}:${engine.towers[0].id}:${engine.towers[tLen - 1].id}`;
    if (sig !== this.lastTowerSortSig) {
      this.lastTowerSortSig = sig;
      this.sortedTowersBuf = engine.towers.slice().sort((a, b) => a.y - b.y);
    }
    for (let i = 0; i < this.sortedTowersBuf.length; i++) {
      const tower = this.sortedTowersBuf[i];
      this.drawPixelPlacedChicken(ctx, engine, tower, tower.id === selectedTowerId, nowSec);
    }

    // 6. Bugs & Giant Fox Bosses (regular bugs first with 2x2 pixel overdraw culling, Giant Foxes on top)
    const frameTag = ++this.renderFrameCounter;
    let hasFoxBoss = false;
    for (let i = 0; i < engine.enemies.length; i++) {
      const e = engine.enemies[i];
      if (e.alive === false) continue;
      if (ENEMY_DEFS[e.typeId].isFoxBoss) {
        hasFoxBoss = true;
      } else {
        const cx = Math.max(0, Math.min(229, toPx(e.x ?? 0) >> 1));
        const cy = Math.max(0, Math.min(149, toPx(e.y ?? 0) >> 1));
        const cellIdx = cy * 230 + cx;
        if (this.bugCellFrame[cellIdx] !== frameTag) {
          this.bugCellFrame[cellIdx] = frameTag;
          this.bugCellCount[cellIdx] = 1;
        } else if (this.bugCellCount[cellIdx] >= 2) {
          continue;
        } else {
          this.bugCellCount[cellIdx]++;
        }
        this.drawPixelEnemy(ctx, e);
      }
    }
    if (hasFoxBoss) {
      for (let i = 0; i < engine.enemies.length; i++) {
        const e = engine.enemies[i];
        if (e.alive !== false && ENEMY_DEFS[e.typeId].isFoxBoss) {
          this.drawPixelEnemy(ctx, e);
        }
      }
    }

    // 6.5. Summoned Astral Stands (fly out from Star Crusader & ORA-punch enemies!)
    for (let i = 0; i < engine.stands.length; i++) {
      const stand = engine.stands[i];
      const owner = engine.getTowerById(stand.ownerTowerId);
      if (owner) {
        this.drawPixelActiveStand(ctx, stand, owner, nowSec);
      }
    }

    // 7. Pixel Projectiles
    for (let i = 0; i < engine.projectiles.length; i++) {
      this.drawPixelProjectile(ctx, engine.projectiles[i]);
    }

    // 8. Expanding Pixel Shockwave Rings & Pixel Burst Particles
    for (let i = 0; i < engine.rings.length; i++) {
      const r = engine.rings[i];
      const t = r.age / r.lifetime;
      const curRad = toPx(r.maxRadius * (0.25 + 0.75 * t));
      drawPixelCircle(ctx, toPx(r.x), toPx(r.y), curRad, r.color, t > 0.55);
    }

    for (let i = 0; i < engine.particles.length; i++) {
      const pt = engine.particles[i];
      ctx.fillStyle = pt.color;
      ctx.fillRect(toPx(pt.x), toPx(pt.y), pt.size, pt.size);
    }

    // 8.5. Active Cannon Battlefield Visual Frame (Time-Stop Chrono Border!)
    if (engine.cannonTimeStopVisualTimer > 0) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.10)';
      ctx.fillRect(0, 0, PIXEL_CANVAS_W, PIXEL_CANVAS_H);
      ctx.fillStyle = Math.floor(nowSec * 6) % 2 === 0 ? '#C084FC' : '#22D3EE';
      ctx.fillRect(0, 0, PIXEL_CANVAS_W, 2);
      ctx.fillRect(0, PIXEL_CANVAS_H - 2, PIXEL_CANVAS_W, 2);
      ctx.fillRect(0, 0, 2, PIXEL_CANVAS_H);
      ctx.fillRect(PIXEL_CANVAS_W - 2, 0, 2, PIXEL_CANVAS_H);
    }

    // 9. Crisp Pixel Bitmap Labels & Floating Popups
    this.drawPixelLabelsAndPopups(ctx, engine);
  }

  private drawPixelGoldenNest(
    ctx: CanvasRenderingContext2D,
    eggs: number,
    nowSec: number
  ): void {
    const nestPos = getActiveMap().nestPos;
    const nx = toPx(nestPos.x);
    const ny = toPx(nestPos.y);

    // Subtle pulsing pixel halo
    const pulseR = 16 + Math.round(Math.sin(nowSec * 3.2));
    drawPixelCircle(ctx, nx, ny, pulseR, 'rgba(250, 204, 21, 0.55)', true);

    // Woven Straw Pixel Nest
    drawFilledPixelDisk(ctx, nx, ny + 1, 14, 11, OUTLINE);
    drawFilledPixelDisk(ctx, nx, ny, 13, 10, '#92400E');
    drawFilledPixelDisk(ctx, nx, ny, 11, 8, '#D97706');
    drawFilledPixelDisk(ctx, nx, ny + 1, 8, 6, '#78350F');

    // Straw weave pixel highlights
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(nx - 9, ny - 5, 3, 1);
    ctx.fillRect(nx + 6, ny - 4, 3, 1);
    ctx.fillRect(nx - 7, ny + 6, 4, 1);
    ctx.fillRect(nx + 4, ny + 5, 4, 1);

    // Individual Pixel Eggs inside the Nest!
    const visibleEggs = Math.min(7, Math.max(0, Math.ceil(eggs / 4)));
    const offsets = [
      [-4, -2],
      [0, -3],
      [4, -2],
      [-5, 1],
      [-1, 1],
      [3, 1],
      [0, -1],
    ];
    for (let i = 0; i < visibleEggs; i++) {
      const [ox, oy] = offsets[i];
      const isGoldCenter = i === visibleEggs - 1;
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(nx + ox - 2, ny + oy - 3, 4, 5);
      ctx.fillStyle = isGoldCenter ? '#FACC15' : '#FFFBEB';
      ctx.fillRect(nx + ox - 1, ny + oy - 2, 2, 3);
      if (isGoldCenter) {
        ctx.fillStyle = '#FEF9C3';
        ctx.fillRect(nx + ox - 1, ny + oy - 2, 1, 1);
      }
    }
  }

  private drawPixelPlacedChicken(
    ctx: CanvasRenderingContext2D,
    engine: ChickenTdEngine,
    tower: PlacedChicken,
    isSelected: boolean,
    nowSec: number
  ): void {
    const spr = PIXEL_ATLAS.getChickenSprite(tower.typeId);
    if (!spr) return;

    const px = toPx(tower.x);
    const py = toPx(tower.y);
    const def = CHICKEN_DEFS[tower.typeId];
    const eff = engine.getEffectiveChickenStats(tower);
    const mutTier = PROGRESSION.getMutation(tower.typeId);
    const mutColor = mutTier ? MUTATION_DEFS[mutTier].color : null;

    if (engine.cannonDamageBoostTimer > 0) {
      // Blazing golden-orange Overdrive ring when Damage Boost Cannon is active!
      const boostR = 11 + (Math.floor(nowSec * 8) % 2);
      drawPixelCircle(
        ctx,
        px,
        py + 2,
        boostR,
        Math.floor(nowSec * 10) % 2 === 0 ? '#F97316' : '#FACC15',
        false
      );
    } else if (def.isSupport && !isSelected) {
      // Subtle ambient support beacon ring under Support Chickens!
      const supR = 11 + (Math.floor(nowSec * 3) % 2);
      drawPixelCircle(ctx, px, py + 2, supR, '#67E8F9', true);
    }

    if (isSelected) {
      drawPixelCircle(ctx, px, py + 2, 10, '#FACC15', false);
    } else if (mutColor) {
      const auraR = (mutTier === 'legendary' ? 10 : 9) + (Math.floor(nowSec * 5) % 2);
      drawPixelCircle(ctx, px, py + 2, auraR, mutColor, true);
    } else if (tower.tier === 3) {
      const auraR = 9 + (Math.floor(nowSec * 4) % 2);
      drawPixelCircle(ctx, px, py + 2, auraR, '#FDE047', true);
    }

    const frame = tower.recoil > 0.35 ? spr.attack : spr.idle;
    const faceLeft = Math.cos(tower.angle) < -0.15;
    const cuteIdleBob =
      tower.recoil <= 0.05 && Math.sin(nowSec * 3.6 + tower.id * 1.9) > 0.62 ? -1 : 0;

    if (faceLeft) {
      ctx.save();
      ctx.translate(px, py + cuteIdleBob);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, -11, -12);
      ctx.restore();
    } else {
      ctx.drawImage(frame, px - 11, py + cuteIdleBob - 12);
    }

    // Crisp Pixel Buff Indicator Arrow above Chicken if buffed by a nearby Support Chicken!
    if (eff.supportBuffCount > 0 && !def.isSupport) {
      const by = py - 14 + (Math.floor(nowSec * 4 + tower.id) % 2);
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(px + 6, by - 1, 5, 5);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(px + 8, by, 1, 3);
      ctx.fillRect(px + 7, by + 1, 3, 1);
    }

    // Crisp Pixel Tier Pips underneath the Chicken (1..4 golden stars/pips + Mutation Crystal!)
    const pipCount = tower.tier + 1;
    const extraMutWidth = mutColor ? 4 : 0;
    const totalW = pipCount * 3 - 1 + extraMutWidth;
    const startX = px - Math.floor(totalW / 2);
    const pipY = py + 9;
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(startX - 1, pipY - 1, totalW + 2, 4);
    for (let p = 0; p < pipCount; p++) {
      ctx.fillStyle = tower.tier === 3 ? '#38BDF8' : '#FACC15';
      ctx.fillRect(startX + p * 3, pipY, 2, 2);
    }
    if (mutColor) {
      ctx.fillStyle = mutColor;
      ctx.fillRect(startX + pipCount * 3 + 1, pipY - 1, 2, 3);
    }
  }

  private drawPixelActiveStand(
    ctx: CanvasRenderingContext2D,
    stand: ActiveStand,
    owner: PlacedChicken,
    nowSec: number
  ): void {
    const standSet = PIXEL_ATLAS.standSprites;
    if (!standSet) return;

    const ox = toPx(owner.x);
    const oy = toPx(owner.y);
    const sx = toPx(stand.x);
    const sy = toPx(stand.y);
    const isRequiem = owner.tier === 3;

    // 1. Dotted Astral Spirit Tether linking Stand User Chicken -> Summoned Stand!
    const distPx = Math.hypot(sx - ox, sy - oy);
    if (distPx > 8) {
      const steps = Math.min(8, Math.max(2, Math.floor(distPx / 7)));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const lx = Math.round(ox + (sx - ox) * t);
        const ly = Math.round(oy - 3 + (sy - (oy - 3)) * t);
        ctx.fillStyle = (i + Math.floor(nowSec * 10)) % 2 === 0
          ? (isRequiem ? '#FEF08A' : '#E879F9')
          : (isRequiem ? '#38BDF8' : '#A855F7');
        ctx.fillRect(lx, ly, 1, 1);
      }
    }

    // 2. Requiem Golden Aura Ring at Tier 4!
    if (isRequiem) {
      drawPixelCircle(ctx, sx, sy, 10 + (Math.floor(nowSec * 6) % 2), '#FACC15', true);
    }

    // 3. Astral Stand Spirit Sprite (rapidly alternates idle & multi-fist ORA barrage while punching!)
    const isPunchFlurry =
      stand.punchAnim > 0.12 ||
      (stand.state === 'punching' && Math.floor(nowSec * 22) % 2 === 0);
    const sprite = isRequiem
      ? isPunchFlurry
        ? standSet.requiemPunch
        : standSet.requiemIdle
      : isPunchFlurry
      ? standSet.normalPunch
      : standSet.normalIdle;

    const faceLeft = Math.cos(stand.angle) < -0.15;
    const hoverBob = stand.state === 'hover' ? Math.round(Math.sin(nowSec * 5 + owner.id)) : 0;

    ctx.save();
    ctx.globalAlpha = stand.state === 'hover' ? 0.86 : 0.96;
    ctx.translate(sx, sy + hoverBob);
    if (faceLeft) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(sprite, -11, -11);
    ctx.restore();

    // 4. Extra Dynamic Directional ORA Fist Streaks right into the enemy when punching!
    if (stand.punchAnim > 0.2) {
      const cos = Math.cos(stand.angle);
      const sin = Math.sin(stand.angle);
      const perpX = -sin;
      const perpY = cos;
      const fistCount = owner.tier >= 2 ? 3 : 2;
      for (let f = 0; f < fistCount; f++) {
        const spread = (f - (fistCount - 1) / 2) * 3.5;
        const reach = 8 + ((Math.floor(nowSec * 30) + f * 3) % 6);
        const fx = Math.round(sx + cos * reach + perpX * spread);
        const fy = Math.round(sy + sin * reach + perpY * spread);
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(fx - 2, fy - 2, 4, 4);
        ctx.fillStyle = isRequiem ? '#FACC15' : '#F0ABFC';
        ctx.fillRect(fx - 1, fy - 1, 2, 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(fx, fy - 1, 1, 1);
      }
    }
  }

  private drawPixelEnemy(ctx: CanvasRenderingContext2D, e: ActiveEnemy): void {
    const def = ENEMY_DEFS[e.typeId];
    const sprSet = PIXEL_ATLAS.getEnemySprite(e.typeId);
    if (!sprSet) return;

    let ex = e.x;
    let ey = e.y;
    let eAng = e.angle;
    if (ex === undefined || ey === undefined || eAng === undefined) {
      const pos = getPointAlongPath(e.distance, e.lateralOffset);
      ex = pos.x;
      ey = pos.y;
      eAng = pos.angle;
    }
    const px = toPx(ex);
    const py = toPx(ey);

    const fIdx = (Math.floor(e.walkPhase) & 1) as 0 | 1;
    const img = e.hitFlash > 0.45 ? sprSet.flashFrames[fIdx] : sprSet.frames[fIdx];
    const faceLeft = Math.cos(eAng) < -0.15;
    const halfW = img.width >> 1;
    const halfH = img.height >> 1;

    if (!faceLeft && !def.isCamo) {
      ctx.drawImage(img, px - halfW, py - halfH);
    } else {
      ctx.save();
      ctx.translate(px, py);
      if (def.isCamo) {
        ctx.globalAlpha = 0.78;
      }
      if (faceLeft) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, -halfW, -halfH);
      ctx.restore();
    }

    // Pixel Status Pips (Time-Stop Freeze / Armor Shatter / Slow / Burn)
    if (e.freezeTimer > 0) {
      drawPixelCircle(ctx, px, py, Math.max(5, Math.floor(img.width / 2) + 1), '#C084FC', true);
      ctx.fillStyle = '#22D3EE';
      ctx.fillRect(px - 5, py - Math.floor(img.height / 2) - 2, 2, 2);
    }
    if (e.vulnTimer > 0) {
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(px + 4, py - Math.floor(img.height / 2) - 2, 2, 2);
    }
    if (e.slowTimer > 0) {
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(px - 2, py - Math.floor(img.height / 2) - 2, 2, 2);
    }
    if (e.burnTimer > 0) {
      ctx.fillStyle = '#F97316';
      ctx.fillRect(px + 1, py - Math.floor(img.height / 2) - 2, 2, 2);
    }

    // Pixel HP Bar
    if (def.isFoxBoss) {
      const barW = 24;
      const bx = px - 12;
      const by = py - Math.floor(img.height / 2) - 6;
      const ratio = Math.max(0, Math.min(1, e.hp / e.maxHp));
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(bx - 1, by - 1, barW + 2, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(bx, by, barW, 3);
      ctx.fillStyle = ratio > 0.5 ? '#EF4444' : '#FACC15';
      ctx.fillRect(bx, by, Math.max(1, Math.round(barW * ratio)), 3);
    } else if (e.hp < e.maxHp) {
      const barW = 10;
      const bx = px - 5;
      const by = py - Math.floor(img.height / 2) - 4;
      const ratio = Math.max(0, Math.min(1, e.hp / e.maxHp));
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(bx - 1, by - 1, barW + 2, 3);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(bx, by, Math.max(1, Math.round(barW * ratio)), 1);
    }
  }

  private drawPixelProjectile(ctx: CanvasRenderingContext2D, p: ActiveProjectile): void {
    const px = toPx(p.x);
    const py = toPx(p.y);

    switch (p.style) {
      case 'feather_slash': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#FCA5A5';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 2, 2, 2);
        break;
      }
      case 'seed': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'honey': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 2, 5, 5);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(px - 2, py - 1, 3, 3);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - 2, py - 1, 1, 1);
        break;
      }
      case 'boomerang': {
        const phase = Math.floor(p.age * 16) % 4;
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = p.burnDps > 0 ? '#F97316' : '#D97706';
        if (phase === 0) {
          ctx.fillRect(px - 2, py - 2, 4, 1);
          ctx.fillRect(px + 1, py - 2, 1, 4);
        } else if (phase === 1) {
          ctx.fillRect(px + 1, py - 2, 1, 4);
          ctx.fillRect(px - 2, py + 1, 4, 1);
        } else if (phase === 2) {
          ctx.fillRect(px - 2, py + 1, 4, 1);
          ctx.fillRect(px - 2, py - 2, 1, 4);
        } else {
          ctx.fillRect(px - 2, py - 2, 1, 4);
          ctx.fillRect(px - 2, py - 2, 4, 1);
        }
        break;
      }
      case 'snow': {
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#E0F2FE';
        ctx.fillRect(px - 2, py, 5, 1);
        ctx.fillRect(px, py - 2, 1, 5);
        break;
      }
      case 'acid': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 2, py - 3, 5, 6);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(px - 1, py - 2, 3, 4);
        ctx.fillStyle = '#A7F3D0';
        ctx.fillRect(px, py - 2, 1, 1);
        break;
      }
      case 'sniper': {
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - dx, py - dy, 2, 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py, 2, 2);
        break;
      }
      case 'egg_bomb': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 7);
        ctx.fillStyle = p.burnDps > 0 ? '#F97316' : '#FFF7ED';
        ctx.fillRect(px - 2, py - 2, 4, 5);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'lightning': {
        ctx.fillStyle = '#A855F7';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - 2, py - 1, 2, 2);
        ctx.fillRect(px, py, 3, 2);
        break;
      }
      case 'shuriken': {
        const spin = Math.floor(p.age * 20) % 2;
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#E2E8F0';
        if (spin === 0) {
          ctx.fillRect(px - 2, py, 5, 1);
          ctx.fillRect(px, py - 2, 1, 5);
        } else {
          ctx.fillRect(px - 2, py - 2, 2, 2);
          ctx.fillRect(px + 1, py - 2, 2, 2);
          ctx.fillRect(px - 2, py + 1, 2, 2);
          ctx.fillRect(px + 1, py + 1, 2, 2);
        }
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(px, py, 1, 1);
        break;
      }
      case 'cannonball': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#334155';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(px - 2, py - 2, 2, 1);
        break;
      }
      case 'solar': {
        ctx.fillStyle = '#EA580C';
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'plasma': {
        const dx = Math.round(Math.cos(p.rotation) * 3);
        const dy = Math.round(Math.sin(p.rotation) * 3);
        ctx.fillStyle = '#0891B2';
        ctx.fillRect(px - dx - 1, py - dy - 1, 4, 4);
        ctx.fillStyle = '#22D3EE';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py, 2, 2);
        break;
      }
      case 'tesla_arc': {
        const dx = Math.round(Math.cos(p.rotation) * 3);
        const dy = Math.round(Math.sin(p.rotation) * 3);
        ctx.fillStyle = '#6366F1';
        ctx.fillRect(px - dx - 2, py - dy - 2, 5, 5);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'chrono_orb': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 7, 7);
        ctx.fillStyle = '#0D9488';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#99F6E4';
        ctx.fillRect(px - 1, py - 2, 3, 2);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px, py, 1, 2);
        break;
      }
      case 'ion_lance': {
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(px - dx - 1, py - dy - 1, 4, 4);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py, 2, 2);
        break;
      }
      case 'stand_fist': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#F0ABFC';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py - 1, 1, 1);
        break;
      }
      case 'valkyrie_spear': {
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(px - dx - 1, py - dy - 1, 3, 3);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(px - 1, py - 1, 4, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py, 2, 2);
        break;
      }
      case 'antimatter': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 7, 7);
        ctx.fillStyle = '#F43F5E';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py, 1, 1);
        break;
      }
      case 'genesis_beam': {
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(px - dx - 2, py - dy - 2, 5, 5);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        break;
      }
      case 'cat_paw': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FB7185';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'surge_pillar': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 2, py - 5, 5, 9);
        ctx.fillStyle = '#06B6D4';
        ctx.fillRect(px - 1, py - 4, 3, 7);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py - 3, 1, 5);
        break;
      }
      case 'matrix_beam': {
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        ctx.fillStyle = '#065F46';
        ctx.fillRect(px - dx - 1, py - dy - 1, 4, 4);
        ctx.fillStyle = '#4ADE80';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'moon_slash': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 7, 7);
        ctx.fillStyle = '#E11D48';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - 1, py - 2, 3, 2);
        break;
      }
      case 'soul_wisp': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#ECFDF5';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'shadow_talon': {
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(px - dx - 1, py - dy - 1, 5, 5);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FCA5A5';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'bahamut_orb': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#22D3EE';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'judgment_ray': {
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        ctx.fillStyle = '#CA8A04';
        ctx.fillRect(px - dx - 1, py - dy - 1, 4, 4);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        break;
      }
      case 'nature_prism': {
        ctx.fillStyle = '#10B981';
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#F472B6';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'black_hole': {
        ctx.fillStyle = '#F472B6';
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.fillStyle = '#A855F7';
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        break;
      }
      case 'god_wrath': {
        const dx = Math.round(Math.cos(p.rotation) * 5);
        const dy = Math.round(Math.sin(p.rotation) * 5);
        ctx.fillStyle = '#F43F5E';
        ctx.fillRect(px - dx - 2, py - dy - 2, 5, 5);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        break;
      }
      case 'beacon_flare': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FEF9C3';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'espresso_splash': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#92400E';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FDBA74';
        ctx.fillRect(px - 1, py - 2, 2, 2);
        break;
      }
      case 'overclock_bolt': {
        const dx = Math.round(Math.cos(p.rotation) * 3);
        const dy = Math.round(Math.sin(p.rotation) * 3);
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(px - dx - 1, py - dy - 1, 4, 4);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'idol_note': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#EC4899';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#67E8F9';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'pebble_shot': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(px - 1, py - 1, 1, 1);
        break;
      }
      case 'cactus_needle': {
        const dx = Math.round(Math.cos(p.rotation) * 2);
        const dy = Math.round(Math.sin(p.rotation) * 2);
        ctx.fillStyle = '#15803D';
        ctx.fillRect(px - dx - 1, py - dy - 1, 3, 3);
        ctx.fillStyle = '#86EFAC';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px + dx, py + dy, 2, 2);
        break;
      }
      case 'broth_splash': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#EA580C';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'revolver_slug': {
        const dx = Math.round(Math.cos(p.rotation) * 3);
        const dy = Math.round(Math.sin(p.rotation) * 3);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(px - dx - 1, py - dy - 1, 3, 3);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py, 2, 2);
        break;
      }
      case 'viking_axe': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 7, 7);
        ctx.fillStyle = '#92400E';
        ctx.fillRect(px - 1, py - 2, 2, 5);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(px - 2, py - 2, 5, 3);
        ctx.fillStyle = '#E0F2FE';
        ctx.fillRect(px - 1, py - 2, 3, 1);
        break;
      }
      case 'miasma_vial': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        ctx.fillStyle = '#A7F3D0';
        ctx.fillRect(px - 1, py - 2, 2, 2);
        break;
      }
      case 'ankh_beam': {
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        ctx.fillStyle = '#2563EB';
        ctx.fillRect(px - dx - 1, py - dy - 1, 4, 4);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'holy_hammer': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 7, 7);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(px - 2, py - 2, 5, 4);
        ctx.fillStyle = '#FEF9C3';
        ctx.fillRect(px - 1, py - 1, 3, 2);
        break;
      }
      case 'kanabo_crush': {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(px - 2, py - 2, 4, 4);
        break;
      }
      case 'star_comet': {
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        ctx.fillStyle = '#818CF8';
        ctx.fillRect(px - dx - 1, py - dy - 1, 4, 4);
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        break;
      }
      case 'abyss_whirl': {
        ctx.fillStyle = '#0F766E';
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.fillStyle = '#22D3EE';
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        break;
      }
      case 'seraph_lance': {
        const dx = Math.round(Math.cos(p.rotation) * 5);
        const dy = Math.round(Math.sin(p.rotation) * 5);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(px - dx - 1, py - dy - 1, 4, 4);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        break;
      }
      case 'atomic_breath': {
        const dx = Math.round(Math.cos(p.rotation) * 5);
        const dy = Math.round(Math.sin(p.rotation) * 5);
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(px - dx - 2, py - dy - 2, 5, 5);
        ctx.fillStyle = '#22D3EE';
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        break;
      }
      case 'corona_flare': {
        const dx = Math.round(Math.cos(p.rotation) * 5);
        const dy = Math.round(Math.sin(p.rotation) * 5);
        ctx.fillStyle = '#EA580C';
        ctx.fillRect(px - dx - 2, py - dy - 2, 5, 5);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(px - 3, py - 3, 7, 7);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 3, 3);
        break;
      }
      case 'rift_slash': {
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        ctx.fillStyle = '#22D3EE';
        ctx.fillRect(px - dx - 2, py - dy - 2, 5, 5);
        ctx.fillStyle = '#A855F7';
        ctx.fillRect(px - 3, py - 3, 7, 7);
        ctx.fillStyle = '#F472B6';
        ctx.fillRect(px - 2, py - 2, 5, 5);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 1, py - 1, 2, 2);
        break;
      }
      case 'bass_pulse':
        break;
      case 'zenith_blade': {
        // Terraria Zenith: spinning multi-sword rainbow arcs (or Shimmer-violet Aether blades)!
        const isAether = p.color === '#E879F9';
        const swordColors = isAether
          ? ['#E879F9', '#C084FC', '#38BDF8', '#F472B6']
          : ['#4ADE80', '#22D3EE', '#F472B6', '#FACC15', '#C084FC', '#FB7185'];
        const bladeCol = swordColors[p.id % swordColors.length];
        const dx = Math.round(Math.cos(p.rotation) * 4);
        const dy = Math.round(Math.sin(p.rotation) * 4);
        // Afterimage arc trail
        ctx.fillStyle = isAether ? '#A855F7' : '#14B8A6';
        ctx.fillRect(px - dx - 1, py - dy - 1, 3, 3);
        // Outlined spinning Terraria sword blade + golden hilt + white edge gleam
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px - 3, py - 3, 7, 7);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(px - 2, py + 1, 2, 2);
        ctx.fillStyle = bladeCol;
        ctx.fillRect(px - 2, py - 2, 5, 4);
        ctx.fillRect(px + dx * 0.5, py + dy * 0.5, 2, 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py - 2, 2, 2);
        break;
      }
      default:
        break;
    }
  }

  private drawPixelLabelsAndPopups(
    ctx: CanvasRenderingContext2D,
    engine: ChickenTdEngine
  ): void {
    const mapDef = getActiveMap();
    // BUG DEN pixel sign
    const ex = toPx(mapDef.entrancePos.x) + 14;
    const ey = toPx(mapDef.entrancePos.y) - 18;
    drawCrispPixelText(ctx, 'BUG DEN', ex, ey, '#FEF08A');

    // NEST EGGS pixel counter above Nest
    const nx = toPx(mapDef.nestPos.x);
    const ny = toPx(mapDef.nestPos.y) - 17;
    drawCrispPixelText(
      ctx,
      engine.isSandboxMode() ? 'INF EGGS' : `${engine.eggs} EGGS`,
      nx,
      ny,
      engine.isSandboxMode() ? '#67E8F9' : '#FFFBEB'
    );

    // Floating combat / upgrade pixel popups
    for (const pop of engine.popups) {
      drawCrispPixelText(ctx, pop.text, toPx(pop.x), toPx(pop.y), pop.color);
    }
  }
}
