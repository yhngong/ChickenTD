import { ENEMY_DEFS } from './data';
import { BUGS_PER_EGG, PROGRESSION } from './progression';
import { compileGridSprite, PIXEL_ATLAS } from './sprites';
import { EnemyTypeId } from './types';

export const IDLE_EGG_INTERVAL_SEC = 600; // 10 minutes per Gem Egg
export const IDLE_KILLS_PER_SEC = BUGS_PER_EGG / IDLE_EGG_INTERVAL_SEC; // 1,000 / 600 = 1.6667 kills/sec

export const IDLE_CANVAS_W = 380;
export const IDLE_CANVAS_H = 144;

const IDLE_ENEMY_ROTATION: readonly EnemyTypeId[] = [
  'ant',
  'aphid',
  'ladybug',
  'ant',
  'hornet',
  'aphid',
  'beetle',
  'ladybug',
  'mantis',
  'hornet',
];

interface IdleEnemyActor {
  id: number;
  typeId: EnemyTypeId;
  x: number;
  y: number;
  hpRatio: number;
  hitFlash: number;
  walkPhase: number;
}

interface IdleSeedShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  age: number;
}

interface IdleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  age: number;
  lifetime: number;
}

interface IdlePopup {
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  age: number;
  lifetime: number;
}

interface IdleRing {
  x: number;
  y: number;
  maxRadius: number;
  color: string;
  age: number;
  lifetime: number;
}

const SMALL_CHICK_PAL: Record<string, string> = {
  O: '#181425',
  R: '#EF4444',
  P: '#FB7185',
  Y: '#FACC15',
  H: '#FEF9C3',
  L: '#FDE047',
  D: '#CA8A04',
  B: '#F97316',
  W: '#FFFFFF',
};

const SMALL_CHICK_IDLE_ROWS: readonly string[] = [
  '.....OO.OO.....',
  '....ORRORRO....',
  '.....ORRRO.....',
  '...OOOYYYOOO...',
  '..OYYHHYYYYYO..',
  '.OYYYYYYYOWYYO.',
  '.OYYYYYYYOOYYBO',
  '.OYYLLYYYPPYOBO',
  '.OYYLLLLYYYYOO.',
  '..OYYDDDDYYYO..',
  '...OOOYYYYOO...',
  '.....OBO.OBO...',
  '.....OO...OO...',
  '...............',
];

const SMALL_CHICK_PECK_ROWS: readonly string[] = [
  '...............',
  '......OO.OO....',
  '.....ORRORRO...',
  '......ORRRO....',
  '...OOOOYYYOOO..',
  '..OYYHHYYYYYYO.',
  '.OYYYYYYYYOWYYO',
  '.OYYLLYYYYOOOBO',
  '..OYYLLLLYYPPBO',
  '..OYYYDDDDYYOO.',
  '...OOOYYYYOO...',
  '....OBO...OBO..',
  '....OO.....OO..',
  '...............',
];

export class IdlePastureSimulation {
  public active = false;
  public sessionElapsedSec = 0;
  public sessionKills = 0;
  public sessionGemEggsEarned = 0;

  public onStatsUpdated: (() => void) | null = null;
  public onEggEarned: ((eggsEarned: number) => void) | null = null;

  private lastWallMs = 0;
  private killCreditAccum = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private nextActorId = 1;
  private spawnCounter = 0;
  private enemies: IdleEnemyActor[] = [];
  private seeds: IdleSeedShot[] = [];
  private particles: IdleParticle[] = [];
  private popups: IdlePopup[] = [];
  private rings: IdleRing[] = [];

  private chickPeckAnim = 0;
  private seedFireCooldown = 0.12;

  private chickIdleCanvas: HTMLCanvasElement | null = null;
  private chickPeckCanvas: HTMLCanvasElement | null = null;

  private ensureChickSprites(): void {
    if (!this.chickIdleCanvas) {
      this.chickIdleCanvas = compileGridSprite(SMALL_CHICK_IDLE_ROWS, SMALL_CHICK_PAL, 2);
      this.chickPeckCanvas = compileGridSprite(SMALL_CHICK_PECK_ROWS, SMALL_CHICK_PAL, 2);
    }
  }

  public getLastWallMs(): number {
    return this.lastWallMs;
  }

  public start(nowMs = Date.now(), resumeFromWallMs?: number): void {
    this.stop();
    this.active = true;
    this.sessionElapsedSec = 0;
    this.sessionKills = 0;
    this.sessionGemEggsEarned = 0;
    this.killCreditAccum = 0;
    this.chickPeckAnim = 0;
    this.seedFireCooldown = 0.1;

    this.enemies = [];
    this.seeds = [];
    this.particles = [];
    this.popups = [];
    this.rings = [];
    this.spawnCounter = 0;

    // Populate initial strolling bugs along the pasture path
    for (let i = 0; i < 5; i++) {
      this.spawnVisualEnemy(156 + i * 52);
    }

    if (
      typeof resumeFromWallMs === 'number' &&
      Number.isFinite(resumeFromWallMs) &&
      resumeFromWallMs > 0 &&
      nowMs > resumeFromWallMs
    ) {
      this.lastWallMs = resumeFromWallMs;
      this.syncWallClock(nowMs);
    } else {
      this.lastWallMs = nowMs;
    }

    if (typeof globalThis.setInterval === 'function') {
      this.heartbeatTimer = globalThis.setInterval(() => {
        if (this.active) {
          this.syncWallClock(Date.now());
        }
      }, 1000);
    }

    if (this.onStatsUpdated) this.onStatsUpdated();
  }

  public stop(nowMs = Date.now()): void {
    if (this.active) {
      this.syncWallClock(nowMs);
    }
    this.active = false;
    if (this.heartbeatTimer !== null) {
      globalThis.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Credits exact wall-clock elapsed time at 1,000 kills / 600s (1 Gem Egg per 10 minutes),
   * immune to background-tab requestAnimationFrame throttling!
   */
  public syncWallClock(nowMs = Date.now()): void {
    if (!this.active) return;
    if (this.lastWallMs <= 0) {
      this.lastWallMs = nowMs;
      return;
    }

    const elapsedSec = Math.max(0, Math.min(86400, (nowMs - this.lastWallMs) / 1000));
    this.lastWallMs = nowMs;
    if (elapsedSec <= 0) return;

    this.sessionElapsedSec += elapsedSec;
    this.killCreditAccum += elapsedSec * IDLE_KILLS_PER_SEC;

    const wholeKills = Math.floor(this.killCreditAccum + 1e-9);
    if (wholeKills > 0) {
      this.killCreditAccum = Math.max(0, this.killCreditAccum - wholeKills);
      const bankRes = PROGRESSION.bankBugsAfterRound(wholeKills);
      this.sessionKills += wholeKills;
      this.sessionGemEggsEarned += bankRes.eggsEarned;

      if (wholeKills <= 4) {
        for (let k = 0; k < wholeKills; k++) {
          this.popFrontVisualEnemy();
        }
      } else {
        this.popFrontVisualEnemy();
        this.spawnPopup(`+${wholeKills.toLocaleString()} IDLE KILLS!`, 200, 56, '#4ADE80', 1.15);
      }

      if (bankRes.eggsEarned > 0) {
        this.rings.push({
          x: 52,
          y: 94,
          maxRadius: 48,
          color: '#F472B6',
          age: 0,
          lifetime: 0.45,
        });
        this.spawnBurst(52, 90, 14, '#FACC15');
        this.spawnPopup(
          `+${bankRes.eggsEarned} GEM EGG${bankRes.eggsEarned > 1 ? 'S' : ''}!`,
          86,
          52,
          '#F472B6',
          1.35
        );
        if (this.onEggEarned) this.onEggEarned(bankRes.eggsEarned);
      }
    }

    // Smoothly reflect fractional progress toward next kill on the lead bug's HP bar
    if (this.enemies.length > 0) {
      this.enemies[0].hpRatio = Math.max(0.08, 1 - Math.min(0.95, this.killCreditAccum));
    }

    if (this.onStatsUpdated) this.onStatsUpdated();
  }

  private spawnVisualEnemy(startX: number): void {
    this.spawnCounter++;
    const typeId: EnemyTypeId =
      this.spawnCounter % 20 === 0
        ? 'fox_scout'
        : IDLE_ENEMY_ROTATION[this.spawnCounter % IDLE_ENEMY_ROTATION.length];
    const laneOffset = ((this.spawnCounter * 7) % 3) * 4 - 4;
    this.enemies.push({
      id: this.nextActorId++,
      typeId,
      x: startX,
      y: 94 + laneOffset,
      hpRatio: 1,
      hitFlash: 0,
      walkPhase: this.spawnCounter * 1.1,
    });
  }

  private popFrontVisualEnemy(): void {
    if (this.enemies.length === 0) {
      this.spawnVisualEnemy(170);
    }
    const popped = this.enemies.shift()!;
    const def = ENEMY_DEFS[popped.typeId];
    this.spawnBurst(popped.x, popped.y - 4, def.isFoxBoss ? 12 : 7, def.bodyColor);
    this.spawnPopup('+1 KILL', popped.x, popped.y - 16, '#FEF08A', 0.62);

    const rightmostX = this.enemies.reduce((mx, e) => Math.max(mx, e.x), 210);
    this.spawnVisualEnemy(Math.max(IDLE_CANVAS_W + 14, rightmostX + 50));
  }

  private spawnBurst(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length > 90) this.particles.shift();
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spd = 28 + Math.random() * 55;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 12,
        color,
        size: i % 3 === 0 ? 3 : 2,
        age: 0,
        lifetime: 0.25 + Math.random() * 0.15,
      });
    }
  }

  private spawnPopup(
    text: string,
    x: number,
    y: number,
    color: string,
    lifetime = 0.75
  ): void {
    if (this.popups.length > 14) this.popups.shift();
    this.popups.push({
      text,
      x,
      y,
      vy: -24,
      color,
      age: 0,
      lifetime,
    });
  }

  public render(canvas: HTMLCanvasElement, dtSec: number, nowSec: number): void {
    this.ensureChickSprites();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const dt = Math.max(0.001, Math.min(0.08, dtSec));

    // 1. Update Small Chicken pecking & golden seed pellets
    this.chickPeckAnim = Math.max(0, this.chickPeckAnim - dt * 5.2);
    this.seedFireCooldown -= dt;
    if (this.seedFireCooldown <= 0 && this.enemies.length > 0) {
      this.seedFireCooldown = 0.22;
      this.chickPeckAnim = 1.0;
      const target = this.enemies[0];
      const startX = 94;
      const startY = 89;
      const dx = Math.max(16, target.x - startX);
      const dy = target.y - 4 - startY;
      const dist = Math.hypot(dx, dy);
      const spd = 260;
      this.seeds.push({
        x: startX,
        y: startY,
        vx: (dx / dist) * spd,
        vy: (dy / dist) * spd,
        targetY: target.y - 4,
        age: 0,
      });
    }

    // 2. Move bugs steadily along the pasture path (kept at cozy pecking distance >= 122px)
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      e.hitFlash = Math.max(0, e.hitFlash - dt * 6.5);
      e.walkPhase += dt * 10;
      const minStopX = 124 + i * 44;
      if (e.x > minStopX) {
        e.x = Math.max(minStopX, e.x - 68 * dt);
      }
    }

    // 3. Move seed pellets & trigger crisp white hit flashes
    for (let i = this.seeds.length - 1; i >= 0; i--) {
      const s = this.seeds[i];
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const lead = this.enemies[0];
      if (lead && Math.abs(s.x - lead.x) <= 12) {
        lead.hitFlash = 1.0;
        this.spawnBurst(lead.x - 4, lead.y - 4, 3, '#FEF08A');
        this.seeds.splice(i, 1);
        continue;
      }
      if (s.age > 1.2 || s.x > IDLE_CANVAS_W + 10) {
        this.seeds.splice(i, 1);
      }
    }

    // 4. Update rings, particles, and popups
    for (const r of this.rings) r.age += dt;
    this.rings = this.rings.filter((r) => r.age < r.lifetime);

    for (const p of this.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.lifetime);

    for (const pop of this.popups) {
      pop.age += dt;
      pop.y += pop.vy * dt;
    }
    this.popups = this.popups.filter((pop) => pop.age < pop.lifetime);

    // ==================== DRAW 16-BIT PIXEL PASTURE ====================
    // Cozy twilight sky bands
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, IDLE_CANVAS_W, 20);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 20, IDLE_CANVAS_W, 18);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 38, IDLE_CANVAS_W, 18);

    // Twinkling pixel stars
    const starCoords = [
      [24, 10],
      [78, 15],
      [136, 8],
      [198, 16],
      [264, 11],
      [320, 9],
      [356, 17],
    ];
    for (let idx = 0; idx < starCoords.length; idx++) {
      const [sx, sy] = starCoords[idx];
      const blink = Math.sin(nowSec * 3.2 + idx * 1.7) > 0.15;
      ctx.fillStyle = blink ? '#FEF08A' : '#64748B';
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Drifting pixel clouds
    ctx.fillStyle = '#475569';
    for (let c = 0; c < 3; c++) {
      const cx = Math.floor(((c * 138 + nowSec * 9) % (IDLE_CANVAS_W + 48)) - 24);
      const cy = 24 + (c % 2) * 8;
      ctx.fillRect(cx, cy, 26, 6);
      ctx.fillRect(cx + 5, cy - 4, 16, 4);
    }

    // Distant rolling hills
    ctx.fillStyle = '#14532D';
    ctx.fillRect(0, 50, IDLE_CANVAS_W, 18);
    for (let hx = 0; hx < IDLE_CANVAS_W; hx += 48) {
      ctx.fillRect(hx + 6, 45, 32, 6);
    }

    // Wooden pasture fence along horizon
    ctx.fillStyle = '#78350F';
    ctx.fillRect(0, 58, IDLE_CANVAS_W, 3);
    ctx.fillRect(0, 64, IDLE_CANVAS_W, 3);
    for (let fx = 8; fx < IDLE_CANVAS_W; fx += 24) {
      ctx.fillStyle = '#92400E';
      ctx.fillRect(fx, 53, 4, 17);
      ctx.fillStyle = '#B45309';
      ctx.fillRect(fx, 53, 4, 2);
    }

    // Lush meadow grass
    ctx.fillStyle = '#15803D';
    ctx.fillRect(0, 68, IDLE_CANVAS_W, IDLE_CANVAS_H - 68);
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(0, 68, IDLE_CANVAS_W, 8);

    // Grass tufts & tiny wildflowers
    for (let gx = 14; gx < IDLE_CANVAS_W; gx += 34) {
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(gx, 74, 4, 2);
      ctx.fillRect(gx + 14, 122, 5, 2);
      ctx.fillStyle = gx % 68 === 14 ? '#FACC15' : '#F472B6';
      ctx.fillRect(gx + 2, 72, 2, 2);
    }

    // Dirt garden trail (bugs walk right -> left)
    ctx.fillStyle = '#78350F';
    ctx.fillRect(42, 83, IDLE_CANVAS_W - 42, 28);
    ctx.fillStyle = '#92400E';
    ctx.fillRect(44, 85, IDLE_CANVAS_W - 44, 24);
    ctx.fillStyle = '#B45309';
    for (let px = 56; px < IDLE_CANVAS_W; px += 28) {
      ctx.fillRect(px, 91, 6, 2);
      ctx.fillRect(px + 12, 101, 5, 2);
    }

    // Cozy Gem Egg Nest Basket on the left!
    ctx.fillStyle = '#181425';
    ctx.fillRect(22, 87, 30, 18);
    ctx.fillStyle = '#D97706';
    ctx.fillRect(24, 89, 26, 14);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(24, 89, 26, 4);
    // Tiny Gem Eggs nestled inside the basket!
    const eggPixels = [28, 36, 43];
    for (const ex of eggPixels) {
      ctx.fillStyle = '#181425';
      ctx.fillRect(ex - 1, 82, 7, 8);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(ex, 83, 5, 6);
      ctx.fillStyle = '#F472B6';
      ctx.fillRect(ex + 1, 85, 3, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ex + 1, 83, 2, 1);
    }

    // Draw Small Chicken Hero!
    const chickHop = Math.abs(Math.sin(nowSec * 5.5)) * 2.5;
    const chickX = Math.round(68 + this.chickPeckAnim * 5);
    const chickY = Math.round(74 - chickHop);
    // Pixel shadow under chick
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(72, 101, 22, 4);

    const chickSpr =
      this.chickPeckAnim > 0.35 ? this.chickPeckCanvas : this.chickIdleCanvas;
    if (chickSpr) {
      ctx.drawImage(chickSpr, chickX, chickY);
    }

    // Draw golden corn seed pellets
    for (const s of this.seeds) {
      ctx.fillStyle = '#181425';
      ctx.fillRect(Math.round(s.x) - 2, Math.round(s.y) - 2, 5, 5);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 3, 3);
    }

    // Draw approaching Bugs & mini Foxes (facing left toward the Small Chicken)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const sprSet = PIXEL_ATLAS.getEnemySprite(e.typeId);
      const frameIdx: 0 | 1 = Math.floor(e.walkPhase) % 2 === 0 ? 0 : 1;
      const rawSpr =
        e.hitFlash > 0.25 ? sprSet?.flashFrames[frameIdx] : sprSet?.frames[frameIdx];

      const bob = Math.abs(Math.sin(e.walkPhase)) * 2;
      const ex = Math.round(e.x);
      const ey = Math.round(e.y - bob);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(ex - 8, Math.round(e.y) + 6, 16, 3);

      if (rawSpr) {
        const isFox = ENEMY_DEFS[e.typeId].isFoxBoss;
        const scale = isFox ? 0.85 : 1.25;
        const dw = Math.round(rawSpr.width * scale);
        const dh = Math.round(rawSpr.height * scale);
        ctx.save();
        ctx.translate(ex, ey);
        ctx.scale(-1, 1); // Face leftward toward our Small Chicken!
        ctx.drawImage(rawSpr, -Math.round(dw / 2), -Math.round(dh / 2), dw, dh);
        ctx.restore();
      }

      // Lead enemy HP bar
      if (i === 0) {
        const barW = 20;
        const bx = ex - 10;
        const by = ey - 15;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(bx - 1, by - 1, barW + 2, 5);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(bx, by, barW, 3);
        ctx.fillStyle = '#4ADE80';
        ctx.fillRect(bx, by, Math.max(2, Math.round(barW * e.hpRatio)), 3);
      }
    }

    // Draw shockwave rings
    for (const r of this.rings) {
      const t = r.age / r.lifetime;
      const rad = Math.round(r.maxRadius * t);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(r.x - rad), Math.round(r.y - rad * 0.6), rad * 2, rad * 1.2);
    }

    // Draw pixel particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }

    // Draw crisp pixel-font popups
    ctx.font = 'bold 9px "Press Start 2P", "Silkscreen", monospace';
    ctx.textAlign = 'center';
    for (const pop of this.popups) {
      const px = Math.round(pop.x);
      const py = Math.round(pop.y);
      ctx.fillStyle = '#0F172A';
      ctx.fillText(pop.text, px + 1, py + 1);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, px, py);
    }

    // Top-left pasture status badge on canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(6, 6, 174, 16);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    ctx.strokeRect(6.5, 6.5, 173, 15);
    ctx.fillStyle = '#4ADE80';
    ctx.fillRect(12, 11, 6, 6);
    ctx.textAlign = 'left';
    ctx.font = 'bold 8px "Silkscreen", monospace';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText('TINY CHICK ON PATROL • 100/MIN', 22, 17);
  }
}
