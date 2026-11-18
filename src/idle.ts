import { ENEMY_DEFS } from './data';
import { BUGS_PER_EGG, PROGRESSION } from './progression';
import { PIXEL_ATLAS } from './sprites';
import { EnemyTypeId } from './types';

export const IDLE_EGG_INTERVAL_SEC = 600; // 10 minutes per Gem Egg
export const IDLE_KILLS_PER_SEC = BUGS_PER_EGG / IDLE_EGG_INTERVAL_SEC; // 1,000 / 600 = 1.6667 kills/sec

export const IDLE_CANVAS_W = 380;
export const IDLE_CANVAS_H = 144;

const IDLE_QUEUE_SIZE = 6;
const IDLE_FRONT_STOP_X = 128;
const IDLE_SLOT_SPACING = 44;
const IDLE_ENEMY_WALK_SPEED = 104; // > 44px / 0.6s so bugs always keep pace with kills and stay on-screen!
const IDLE_ENGAGE_MAX_X = 215; // Brawler Bantam only fires once a bug walks visibly into range!

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

interface IdleSlashShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
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

export class IdlePastureSimulation {
  public active = false;
  public sessionElapsedSec = 0;
  public sessionKills = 0;
  public sessionGemEggsEarned = 0;

  public onStatsUpdated: (() => void) | null = null;
  public onEggEarned: ((eggsEarned: number) => void) | null = null;

  private lastWallMs = 0;
  private lastRenderWallMs = 0;
  private killCreditAccum = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private nextActorId = 1;
  private spawnCounter = 0;
  private enemies: IdleEnemyActor[] = [];
  private slashes: IdleSlashShot[] = [];
  private particles: IdleParticle[] = [];
  private popups: IdlePopup[] = [];
  private rings: IdleRing[] = [];

  private bantamStrikeAnim = 0;
  private strikeFireCooldown = 0.12;

  private bantamIdleCanvas: HTMLCanvasElement | null = null;
  private bantamAttackCanvas: HTMLCanvasElement | null = null;

  private ensureBantamSprites(): void {
    if (this.bantamIdleCanvas && this.bantamAttackCanvas) return;
    if (typeof document === 'undefined') return;
    const spr = PIXEL_ATLAS.getChickenSprite('bantam');
    if (!spr) return;

    // Bake crisp 2x (44x44) grounded Brawler Bantam frames:
    // - Copy rows 0..19 of spr.idle (omitting row 20 overhang) so the subtle contact shadow
    //   sits strictly on row 19 beside the feet soles (zero shadow gap below feet!).
    const idleCan = document.createElement('canvas');
    idleCan.width = 44;
    idleCan.height = 44;
    const iCtx = idleCan.getContext('2d')!;
    iCtx.imageSmoothingEnabled = false;
    iCtx.drawImage(spr.idle, 0, 0, 22, 20, 0, 0, 44, 40);

    // - In spr.attack, drawChickenUnitPixelArt uses hopY = -1 (feet on rows 17..18, detached
    //   shadow on rows 19..20). Copy rows 0..18 shifted down +2px onto a sole-level contact
    //   strip so Brawler Bantam punches forward firmly planted on the dirt path!
    const atkCan = document.createElement('canvas');
    atkCan.width = 44;
    atkCan.height = 44;
    const aCtx = atkCan.getContext('2d')!;
    aCtx.imageSmoothingEnabled = false;
    aCtx.fillStyle = 'rgba(15, 23, 42, 0.34)';
    aCtx.fillRect(12, 38, 24, 2);
    aCtx.drawImage(spr.attack, 0, 0, 22, 19, 0, 2, 44, 38);

    this.bantamIdleCanvas = idleCan;
    this.bantamAttackCanvas = atkCan;
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
    this.bantamStrikeAnim = 0;
    this.strikeFireCooldown = 0.1;

    this.enemies = [];
    this.slashes = [];
    this.particles = [];
    this.popups = [];
    this.rings = [];
    this.spawnCounter = 0;

    // Populate initial strolling bugs along the pasture path
    for (let i = 0; i < IDLE_QUEUE_SIZE; i++) {
      this.spawnVisualEnemy(IDLE_FRONT_STOP_X + 4 + i * IDLE_SLOT_SPACING);
    }

    this.lastRenderWallMs = nowMs;
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

  private advanceVisualEnemies(dtSec: number): void {
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      e.hitFlash = Math.max(0, e.hitFlash - dtSec * 6.5);
      e.walkPhase += dtSec * 9.5;
      const minStopX = IDLE_FRONT_STOP_X + i * IDLE_SLOT_SPACING;
      if (e.x > minStopX) {
        e.x = Math.max(minStopX, e.x - IDLE_ENEMY_WALK_SPEED * dtSec);
      }
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

    // If requestAnimationFrame was throttled/paused (e.g. background tab), keep the visual
    // bug line walking forward so enemies never drift off-screen!
    if (nowMs - this.lastRenderWallMs > 220) {
      this.advanceVisualEnemies(elapsedSec);
    }

    const wholeKills = Math.floor(this.killCreditAccum + 1e-9);
    if (wholeKills > 0) {
      this.killCreditAccum = Math.max(0, this.killCreditAccum - wholeKills);
      const bankRes = PROGRESSION.bankBugsAfterRound(wholeKills);
      this.sessionKills += wholeKills;
      this.sessionGemEggsEarned += bankRes.eggsEarned;

      // Pop the front enemy visually once (and keep the remaining parade neatly on-screen!)
      this.popFrontVisualEnemy();
      if (wholeKills > 1) {
        this.advanceVisualEnemies(0.45);
      }
      if (wholeKills > 4) {
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
    const laneOffset = ((this.spawnCounter * 7) % 3) * 3 - 3;
    this.enemies.push({
      id: this.nextActorId++,
      typeId,
      x: startX,
      y: 95 + laneOffset,
      hpRatio: 1,
      hitFlash: 0,
      walkPhase: this.spawnCounter * 1.1,
    });
  }

  private popFrontVisualEnemy(): void {
    if (this.enemies.length === 0) {
      this.spawnVisualEnemy(IDLE_FRONT_STOP_X);
    }
    const popped = this.enemies.shift()!;
    const def = ENEMY_DEFS[popped.typeId];
    const burstX = Math.min(IDLE_CANVAS_W - 18, popped.x);
    this.spawnBurst(burstX, popped.y - 3, def.isFoxBoss ? 12 : 7, def.bodyColor);
    this.spawnPopup('+1 KILL', burstX, popped.y - 16, '#FEF08A', 0.62);

    while (this.enemies.length < IDLE_QUEUE_SIZE) {
      const rightmostX = this.enemies.reduce((mx, e) => Math.max(mx, e.x), IDLE_FRONT_STOP_X);
      // Strictly cap spawnX just outside the right edge so the queue can never drift off-screen!
      const spawnX = Math.min(
        IDLE_CANVAS_W + 18,
        Math.max(IDLE_CANVAS_W - 6, rightmostX + IDLE_SLOT_SPACING)
      );
      this.spawnVisualEnemy(spawnX);
    }
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
    this.ensureBantamSprites();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    this.lastRenderWallMs = Date.now();
    const dt = Math.max(0.001, Math.min(0.08, dtSec));

    // 1. Move bugs steadily along the pasture path into Brawler Bantam's melee/slash zone
    this.advanceVisualEnemies(dt);

    // 2. Update Brawler Bantam martial-arts strikes & crimson feather-slash projectiles
    this.bantamStrikeAnim = Math.max(0, this.bantamStrikeAnim - dt * 5.4);
    this.strikeFireCooldown -= dt;
    const leadTarget = this.enemies[0];
    if (
      this.strikeFireCooldown <= 0 &&
      leadTarget &&
      leadTarget.x <= IDLE_ENGAGE_MAX_X
    ) {
      this.strikeFireCooldown = 0.24;
      this.bantamStrikeAnim = 1.0;
      const startX = 96;
      const startY = 86;
      const dx = Math.max(14, leadTarget.x - startX);
      const dy = leadTarget.y - 2 - startY;
      const dist = Math.hypot(dx, dy);
      const spd = 290;
      this.slashes.push({
        x: startX,
        y: startY,
        vx: (dx / dist) * spd,
        vy: (dy / dist) * spd,
        age: 0,
      });
    }

    // 3. Move feather-slash waves & strike the front bug cleanly (zero tunneling!)
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const lead = this.enemies[0];
      if (lead && lead.x <= IDLE_CANVAS_W - 4 && s.x >= lead.x - 10) {
        lead.hitFlash = 1.0;
        this.spawnBurst(lead.x - 4, lead.y - 2, 4, '#FCA5A5');
        this.slashes.splice(i, 1);
        continue;
      }
      if (s.age > 0.85 || s.x > IDLE_ENGAGE_MAX_X + 28) {
        this.slashes.splice(i, 1);
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

    // Draw Brawler Bantam Hero (planted directly on the dirt trail — zero floating!)
    const isStriking = this.bantamStrikeAnim > 0.35;
    const bantamX = Math.round(58 + (isStriking ? 2 : 0));
    const bantamY = 59; // Feet soles (y=38..39) rest firmly at y=97..98 on the dirt trail!
    const bantamSpr = isStriking ? this.bantamAttackCanvas : this.bantamIdleCanvas;
    if (bantamSpr) {
      ctx.drawImage(bantamSpr, bantamX, bantamY);
    }

    // Draw Brawler Bantam's crimson/white feather-slash waves
    for (const s of this.slashes) {
      const sx = Math.round(s.x);
      const sy = Math.round(s.y);
      ctx.fillStyle = '#181425';
      ctx.fillRect(sx - 3, sy - 4, 7, 8);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(sx - 2, sy - 3, 3, 6);
      ctx.fillStyle = '#FCA5A5';
      ctx.fillRect(sx, sy - 3, 3, 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx + 1, sy - 2, 2, 4);
    }

    // Draw approaching Bugs & mini Foxes (facing left toward Brawler Bantam)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const sprSet = PIXEL_ATLAS.getEnemySprite(e.typeId);
      const frameIdx: 0 | 1 = Math.floor(e.walkPhase) % 2 === 0 ? 0 : 1;
      const rawSpr =
        e.hitFlash > 0.25 ? sprSet?.flashFrames[frameIdx] : sprSet?.frames[frameIdx];

      const stepLift = frameIdx === 1 ? 1 : 0;
      const ex = Math.round(e.x);
      const ey = Math.round(e.y) - stepLift;

      if (rawSpr) {
        const isFox = ENEMY_DEFS[e.typeId].isFoxBoss;
        const scale = isFox ? 0.9 : 1.25;
        const dw = Math.round(rawSpr.width * scale);
        const dh = Math.round(rawSpr.height * scale);

        // Grounded contact shadow right along the enemy's feet line (no floating gap!)
        const shadowW = Math.max(10, Math.round(dw * 0.72));
        const shadowY = Math.round(e.y) + Math.floor(dh / 2) - 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
        ctx.fillRect(ex - Math.floor(shadowW / 2), shadowY, shadowW, 2);

        ctx.save();
        ctx.translate(ex, ey);
        ctx.scale(-1, 1); // Face leftward toward Brawler Bantam!
        ctx.drawImage(rawSpr, -Math.round(dw / 2), -Math.round(dh / 2), dw, dh);
        ctx.restore();
      }

      // Lead enemy HP bar
      if (i === 0 && ex <= IDLE_CANVAS_W - 6) {
        const barW = 20;
        const bx = ex - 10;
        const by = ey - 14;
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
    ctx.fillRect(6, 6, 178, 16);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    ctx.strokeRect(6.5, 6.5, 177, 15);
    ctx.fillStyle = '#4ADE80';
    ctx.fillRect(12, 11, 6, 6);
    ctx.textAlign = 'left';
    ctx.font = 'bold 8px "Silkscreen", monospace';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText('BRAWLER BANTAM • 100/MIN', 22, 17);
  }
}
