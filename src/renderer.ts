import { CHICKEN_DEFS, ENEMY_DEFS } from './data';
import { ChickenTdEngine } from './engine';
import {
  canPlaceChickenAt,
  DECOR_TREES,
  ENTRANCE_POSITION,
  getPointAlongPath,
  MAP_HEIGHT,
  MAP_WIDTH,
  NEST_POSITION,
  PATH_HALF_WIDTH,
  PATH_WAYPOINTS,
  POND_OBSTACLE,
} from './map';
import { ActiveEnemy, ChickenTypeId, PlacedChicken } from './types';

export interface GhostPlacementState {
  typeId: ChickenTypeId | null;
  mouseX: number;
  mouseY: number;
  insideCanvas: boolean;
}

const FLOWER_SPOTS: readonly { x: number; y: number; col: string }[] = [
  { x: 132, y: 245, col: '#FDE047' },
  { x: 158, y: 365, col: '#FB7185' },
  { x: 335, y: 220, col: '#FFFFFF' },
  { x: 358, y: 340, col: '#38BDF8' },
  { x: 565, y: 205, col: '#FDE047' },
  { x: 585, y: 460, col: '#FB7185' },
  { x: 785, y: 195, col: '#FFFFFF' },
  { x: 775, y: 345, col: '#C084FC' },
  { x: 120, y: 490, col: '#FDE047' },
];

export class MeadowRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = context;
  }

  public render(
    canvas: HTMLCanvasElement,
    engine: ChickenTdEngine,
    selectedTowerId: number | null,
    ghost: GhostPlacementState,
    timeSec: number
  ): void {
    const w = canvas.width;
    const h = canvas.height;
    if (w <= 0 || h <= 0) return;

    const ctx = this.ctx;
    ctx.save();
    try {
      const scaleX = w / MAP_WIDTH;
      const scaleY = h / MAP_HEIGHT;
      ctx.scale(scaleX, scaleY);

      this.drawMeadowBackdrop(timeSec);
      this.drawWindingPath(timeSec);
      this.drawPondAndTrees(timeSec);
      this.drawEntranceLog();
      this.drawGoldenNest(engine.eggs, engine.maxEggs, timeSec);

      // Selected chicken range circle
      const selectedTower =
        selectedTowerId !== null
          ? engine.towers.find((t) => t.id === selectedTowerId) ?? null
          : null;
      if (selectedTower) {
        const eff = engine.getEffectiveChickenStats(selectedTower);
        this.drawRangeCircle(selectedTower.x, selectedTower.y, eff.effectiveRange, true);
      }

      // Ghost placement preview
      if (ghost.typeId && ghost.insideCanvas) {
        const def = CHICKEN_DEFS[ghost.typeId];
        const baseRange = Math.round(def.tiers[0].range * (1 + engine.tdLevels.eagleRoost * 0.08));
        const valid =
          canPlaceChickenAt(ghost.mouseX, ghost.mouseY, engine.towers) &&
          engine.corn >= def.baseCost;
        this.drawRangeCircle(ghost.mouseX, ghost.mouseY, baseRange, valid);
        ctx.save();
        ctx.globalAlpha = 0.78;
        this.drawChickenSprite(
          {
            id: -1,
            typeId: ghost.typeId,
            x: ghost.mouseX,
            y: ghost.mouseY,
            tier: 0,
            targetMode: 'first',
            angle: 0,
            cooldown: 0,
            recoil: 0,
            totalPopDamage: 0,
            totalSpent: 0,
          },
          false,
          timeSec
        );
        ctx.restore();
      }

      // Placed Chicken Troops
      for (const tower of engine.towers) {
        this.drawChickenSprite(tower, tower.id === selectedTowerId, timeSec);
      }

      // Bugs & MOAB-Class Foxes (draw regular bugs first, then Giant Fox bosses on top!)
      for (const enemy of engine.enemies) {
        if (!ENEMY_DEFS[enemy.typeId].isFoxBoss) {
          this.drawEnemy(enemy, timeSec);
        }
      }
      for (const enemy of engine.enemies) {
        if (ENEMY_DEFS[enemy.typeId].isFoxBoss) {
          this.drawEnemy(enemy, timeSec);
        }
      }

      // Projectiles
      for (const proj of engine.projectiles) {
        this.drawProjectile(proj.x, proj.y, proj.rotation, proj.style, proj.color);
      }

      // Splash & Pop Rings
      for (const ring of engine.rings) {
        const p = Math.min(1, ring.age / ring.lifetime);
        const r = Math.max(2, ring.maxRadius * (0.25 + 0.75 * p));
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p);
        ctx.strokeStyle = ring.color;
        ctx.fillStyle = ring.color;
        ctx.lineWidth = 4 * (1 - p * 0.5);
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = Math.max(0, (1 - p) * 0.22);
        ctx.fill();
        ctx.restore();
      }

      // Floating Map Popups
      for (const pop of engine.popups) {
        const p = Math.min(1, pop.age / pop.lifetime);
        ctx.save();
        ctx.globalAlpha = p < 0.7 ? 1 : Math.max(0, 1 - (p - 0.7) / 0.3);
        ctx.font = `800 ${Math.round(16 * pop.scale)}px 'Fredoka', 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1E293B';
        ctx.strokeText(pop.text, pop.x, pop.y);
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      }
    } finally {
      ctx.restore();
    }
  }

  private drawMeadowBackdrop(timeSec: number): void {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, MAP_HEIGHT);
    grad.addColorStop(0, '#7AD957');
    grad.addColorStop(0.55, '#68C747');
    grad.addColorStop(1, '#55B336');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Subtle sunny pasture checkerboard patches
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    const tile = 64;
    for (let gx = 0; gx < MAP_WIDTH; gx += tile) {
      for (let gy = 0; gy < MAP_HEIGHT; gy += tile) {
        if (((gx / tile + gy / tile) | 0) % 2 === 0) {
          ctx.fillRect(gx, gy, tile, tile);
        }
      }
    }

    // Swaying wildflowers
    for (let i = 0; i < FLOWER_SPOTS.length; i++) {
      const f = FLOWER_SPOTS[i];
      const sway = Math.sin(timeSec * 2 + i) * 2;
      ctx.save();
      ctx.translate(f.x + sway, f.y);
      ctx.fillStyle = f.col;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 4.2, Math.sin(a) * 4.2, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawWindingPath(timeSec: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const traceWaypoints = () => {
      ctx.beginPath();
      ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
      for (let i = 1; i < PATH_WAYPOINTS.length; i++) {
        ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y);
      }
    };

    // Dark grassy verge shadow
    ctx.strokeStyle = '#3E8E26';
    ctx.lineWidth = PATH_HALF_WIDTH * 2 + 12;
    traceWaypoints();
    ctx.stroke();

    // Warm pebble outer rim
    ctx.strokeStyle = '#B88954';
    ctx.lineWidth = PATH_HALF_WIDTH * 2 + 5;
    traceWaypoints();
    ctx.stroke();

    // Sandy farm dirt road
    ctx.strokeStyle = '#E6C28B';
    ctx.lineWidth = PATH_HALF_WIDTH * 2 - 4;
    traceWaypoints();
    ctx.stroke();

    // Subtle animated path direction dashes
    ctx.strokeStyle = 'rgba(138, 92, 42, 0.25)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 18]);
    ctx.lineDashOffset = -(timeSec * 28) % 30;
    traceWaypoints();
    ctx.stroke();

    ctx.restore();
  }

  private drawPondAndTrees(timeSec: number): void {
    const ctx = this.ctx;

    // Scenic Duck Pond
    ctx.save();
    ctx.translate(POND_OBSTACLE.x, POND_OBSTACLE.y);
    ctx.fillStyle = '#A37B4C';
    ctx.beginPath();
    ctx.ellipse(0, 3, POND_OBSTACLE.rx + 6, POND_OBSTACLE.ry + 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const waterGrad = ctx.createLinearGradient(0, -POND_OBSTACLE.ry, 0, POND_OBSTACLE.ry);
    waterGrad.addColorStop(0, '#38BDF8');
    waterGrad.addColorStop(1, '#0284C7');
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, POND_OBSTACLE.rx, POND_OBSTACLE.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water shimmer + lilypad
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(
      -12 + Math.sin(timeSec * 1.8) * 3,
      -8,
      16,
      7,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(18, 10, 9, 0.3, Math.PI * 1.9);
    ctx.lineTo(18, 10);
    ctx.fill();
    ctx.restore();

    // Fluffy Farmyard Trees
    for (const tree of DECOR_TREES) {
      ctx.save();
      ctx.translate(tree.x, tree.y);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.ellipse(3, 8, tree.r, tree.r * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.arc(0, 0, tree.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(-tree.r * 0.22, -tree.r * 0.22, tree.r * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawEntranceLog(): void {
    const ctx = this.ctx;
    const { x, y } = ENTRANCE_POSITION;
    ctx.save();
    ctx.translate(x + 8, y);

    // Hollow dark woodland log tunnel where bugs & foxes emerge
    ctx.fillStyle = '#78350F';
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-22, -26, 38, 52, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1C1917';
    ctx.beginPath();
    ctx.ellipse(12, 0, 8, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "800 10px 'Fredoka', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FEF08A';
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 3;
    ctx.strokeText('BUG DEN', 0, -34);
    ctx.fillText('BUG DEN', 0, -34);
    ctx.restore();
  }

  private drawGoldenNest(eggs: number, maxEggs: number, timeSec: number): void {
    const ctx = this.ctx;
    const { x, y } = NEST_POSITION;
    ctx.save();
    ctx.translate(x + 12, y);

    // Warm golden glow under the Nest
    const pulse = 1 + Math.sin(timeSec * 3) * 0.05;
    ctx.fillStyle = 'rgba(250, 204, 21, 0.26)';
    ctx.beginPath();
    ctx.arc(0, 0, 40 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Woven straw outer ring
    ctx.fillStyle = '#D97706';
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 4, 32, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cozy inner straw bowl
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.ellipse(0, 2, 23, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw visible Eggs inside the Nest proportional to remaining Eggs!
    const visibleEggs = eggs <= 0 ? 0 : Math.max(1, Math.min(7, Math.ceil((eggs / Math.max(1, maxEggs)) * 7)));
    const eggOffsets: readonly [number, number][] = [
      [-10, 2],
      [10, 2],
      [0, 5],
      [-6, -4],
      [6, -4],
      [0, -2],
      [0, 1],
    ];
    for (let i = 0; i < visibleEggs; i++) {
      const [ex, ey] = eggOffsets[i];
      ctx.fillStyle = i === visibleEggs - 1 ? '#FDE047' : '#FFFBEB';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 6.2, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.font = "800 11px 'Fredoka', sans-serif";
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3.5;
    const label = `🥚 ${eggs}`;
    ctx.strokeText(label, 0, -31);
    ctx.fillStyle = '#FEF08A';
    ctx.fillText(label, 0, -31);

    ctx.restore();
  }

  private drawRangeCircle(x: number, y: number, radius: number, valid: boolean): void {
    if (radius <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = valid ? 'rgba(255, 255, 255, 0.18)' : 'rgba(239, 68, 68, 0.25)';
    ctx.strokeStyle = valid ? 'rgba(255, 255, 255, 0.82)' : 'rgba(239, 68, 68, 0.9)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawChickenSprite(tower: PlacedChicken, isSelected: boolean, timeSec: number): void {
    const ctx = this.ctx;
    const def = CHICKEN_DEFS[tower.typeId];
    const kickBack = tower.recoil * 4.5;

    ctx.save();
    ctx.translate(tower.x, tower.y);

    // Selection halo
    if (isSelected) {
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ground shadow + wooden roost pad for high-tier chickens
    ctx.fillStyle = tower.tier >= 2 ? '#B45309' : 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Solar aura for Sun Chantecler
    if (tower.typeId === 'phoenix') {
      ctx.fillStyle = `rgba(250, 204, 21, ${0.24 + Math.sin(timeSec * 6) * 0.08})`;
      ctx.beginPath();
      ctx.arc(0, 0, 23 + tower.tier * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.rotate(tower.angle);
    ctx.translate(-kickBack, 0);

    // Plump round chicken body
    ctx.fillStyle = def.featherColor;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Side wings
    ctx.fillStyle = def.bellyColor;
    ctx.beginPath();
    ctx.ellipse(-2, -13, 8, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-2, 13, 8, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sharp orange beak pointing toward +X target!
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(14, -5);
    ctx.lineTo(24, 0);
    ctx.lineTo(14, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cute eyes
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(9, -6, 2.3, 0, Math.PI * 2);
    ctx.arc(9, 6, 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Red雞冠 (comb) or Class Headgear!
    if (tower.typeId === 'ranger') {
      // Safari sniper hat + scope barrel!
      ctx.fillStyle = '#65A30D';
      ctx.beginPath();
      ctx.arc(-2, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, 8, 17, 4);
    } else if (tower.typeId === 'ninja') {
      // Red Shinobi headband + trailing tails!
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 14, -1.1, 1.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(-22, -9);
      ctx.moveTo(-12, 2);
      ctx.lineTo(-21, 7);
      ctx.stroke();
    } else if (tower.typeId === 'chilly') {
      // Fluffy frost crest
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(-2, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (tower.typeId === 'lobber') {
      // Cozy Mortar Chef Cap
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-3, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Classic rooster comb
      ctx.fillStyle = def.accentColor;
      ctx.beginPath();
      ctx.ellipse(-1, 0, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Tier Stars badge below chicken (Tier 2 = ★, Tier 3 = ★★, Tier 4 = 👑)
    if (tower.tier > 0) {
      ctx.font = "800 10px 'Fredoka', sans-serif";
      ctx.textAlign = 'center';
      const badge = tower.tier === 3 ? '👑 MAX' : '★'.repeat(tower.tier);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.strokeText(badge, 0, 23);
      ctx.fillStyle = '#FDE047';
      ctx.fillText(badge, 0, 23);
    }

    ctx.restore();
  }

  private drawEnemy(enemy: ActiveEnemy, timeSec: number): void {
    const ctx = this.ctx;
    const def = ENEMY_DEFS[enemy.typeId];
    const pos = getPointAlongPath(enemy.distance, enemy.lateralOffset);

    ctx.save();
    ctx.translate(pos.x, pos.y);

    if (def.isCamo) {
      ctx.globalAlpha = 0.68 + Math.sin(timeSec * 7) * 0.14;
    }

    ctx.save();
    ctx.rotate(pos.angle);

    if (def.isFoxBoss) {
      this.drawFoxBossBody(enemy, def.radius, def.bodyColor, def.secondaryColor);
    } else {
      this.drawBugBody(enemy, def.radius, def.bodyColor, def.secondaryColor, def.isArmored, def.isCamo);
    }

    // Frost / Burn overlays
    if (enemy.slowTimer > 0) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, def.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (enemy.burnTimer > 0) {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.38)';
      ctx.beginPath();
      ctx.arc(0, 0, def.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Overhead Health Bar for Giant Fox Bosses & Armored/Damaged Elite Bugs!
    if (def.isFoxBoss || enemy.hp < enemy.maxHp) {
      const barW = def.isFoxBoss ? 52 : 26;
      const barH = def.isFoxBoss ? 7 : 4.5;
      const by = -def.radius - (def.isFoxBoss ? 14 : 9);
      const pct = Math.max(0, Math.min(1, enemy.hp / Math.max(1, enemy.maxHp)));

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-barW / 2 - 1, by - 1, barW + 2, barH + 2);
      ctx.fillStyle = def.isFoxBoss ? '#EF4444' : '#22C55E';
      ctx.fillRect(-barW / 2, by, barW * pct, barH);

      if (def.isFoxBoss) {
        ctx.font = "800 10px 'Fredoka', sans-serif";
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3;
        const hpLabel = `🦊 ${Math.ceil(enemy.hp)}`;
        ctx.strokeText(hpLabel, 0, by - 7);
        ctx.fillStyle = '#FEF08A';
        ctx.fillText(hpLabel, 0, by - 7);
      }
    }

    ctx.restore();
  }

  private drawBugBody(
    enemy: ActiveEnemy,
    r: number,
    mainCol: string,
    secCol: string,
    isArmored: boolean,
    isCamo: boolean
  ): void {
    const ctx = this.ctx;
    const wiggle = Math.sin(enemy.walkPhase) * 2.5;

    // 6 skittering bug legs
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    for (const lx of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.moveTo(lx, -r * 0.6);
      ctx.lineTo(lx + wiggle * (lx === 0 ? -1 : 1), -r * 1.25);
      ctx.moveTo(lx, r * 0.6);
      ctx.lineTo(lx - wiggle * (lx === 0 ? -1 : 1), r * 1.25);
      ctx.stroke();
    }

    // Oval carapace
    ctx.fillStyle = enemy.hitFlash > 0.2 ? '#FFFFFF' : mainCol;
    ctx.strokeStyle = isArmored ? '#E2E8F0' : '#0F172A';
    ctx.lineWidth = isArmored ? 3.2 : 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.88, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Markings / Spots / Wings
    ctx.fillStyle = secCol;
    ctx.beginPath();
    ctx.arc(-3, -3, r * 0.24, 0, Math.PI * 2);
    ctx.arc(-3, 3, r * 0.24, 0, Math.PI * 2);
    ctx.fill();

    if (isCamo || enemy.typeId === 'hornet') {
      // Translucent fluttering wings
      ctx.fillStyle = isCamo ? 'rgba(199, 210, 254, 0.7)' : 'rgba(255, 255, 255, 0.72)';
      const flap = Math.abs(Math.sin(enemy.walkPhase * 1.8)) * 4;
      ctx.beginPath();
      ctx.ellipse(-2, -r * 0.75 - flap * 0.4, r * 0.7, r * 0.4, -0.35, 0, Math.PI * 2);
      ctx.ellipse(-2, r * 0.75 + flap * 0.4, r * 0.7, r * 0.4, 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Antennae
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(r * 0.9, -3);
    ctx.lineTo(r * 1.4, -7);
    ctx.moveTo(r * 0.9, 3);
    ctx.lineTo(r * 1.4, 7);
    ctx.stroke();
  }

  private drawFoxBossBody(
    enemy: ActiveEnemy,
    r: number,
    furCol: string,
    tipCol: string
  ): void {
    const ctx = this.ctx;
    const sway = Math.sin(enemy.walkPhase) * 0.14;
    const isKitsune = enemy.typeId === 'fox_kitsune';
    const isAlpha = enemy.typeId === 'fox_alpha';

    // Bushy Fox Tail(s) trailing behind (-X)!
    const tailAngles = isKitsune ? [-0.45, 0, 0.45] : [0];
    for (const ta of tailAngles) {
      ctx.save();
      ctx.translate(-r * 0.85, 0);
      ctx.rotate(sway + ta);
      ctx.fillStyle = furCol;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(-r * 0.55, 0, r * 0.7, r * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // White/glowing tail tip
      ctx.fillStyle = tipCol;
      ctx.beginPath();
      ctx.arc(-r * 0.98, 0, r * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Torso
    ctx.fillStyle = enemy.hitFlash > 0.2 ? '#FFFFFF' : furCol;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.05, r * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fox Head + Pointed Snout (+X) + Pointed Ears!
    ctx.fillStyle = enemy.hitFlash > 0.2 ? '#FFFFFF' : furCol;
    ctx.beginPath();
    ctx.moveTo(r * 0.45, -r * 0.58);
    ctx.lineTo(r * 1.38, 0);
    ctx.lineTo(r * 0.45, r * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ears
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.moveTo(r * 0.3, -r * 0.45);
    ctx.lineTo(r * 0.65, -r * 0.88);
    ctx.lineTo(r * 0.78, -r * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 0.3, r * 0.45);
    ctx.lineTo(r * 0.65, r * 0.88);
    ctx.lineTo(r * 0.78, r * 0.32);
    ctx.closePath();
    ctx.fill();

    // Black nose & fierce eyes
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(r * 1.35, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(r * 0.75, -r * 0.22, 3, 0, Math.PI * 2);
    ctx.arc(r * 0.75, r * 0.22, 3, 0, Math.PI * 2);
    ctx.fill();

    // Golden Crown on Mega Alpha Fox!
    if (isAlpha) {
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(r * 0.15, -7, 10, 14);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawProjectile(
    x: number,
    y: number,
    rot: number,
    style: string,
    color: string
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    if (style === 'shuriken') {
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
        ctx.lineTo(Math.cos(a + 0.4) * 3.2, Math.sin(a + 0.4) * 3.2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (style === 'egg_bomb') {
      ctx.fillStyle = '#FFFBEB';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 6.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (style === 'snow') {
      ctx.fillStyle = '#E0F2FE';
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (style === 'sniper') {
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
    } else if (style === 'solar') {
      ctx.fillStyle = '#FEF08A';
      ctx.strokeStyle = '#EA580C';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Corn seed kernel!
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#854D0E';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}
