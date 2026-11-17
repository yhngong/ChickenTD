import './style.css';
import {
  CAMPAIGN_WAVES,
  CHICKEN_DEFS,
  CHICKEN_ORDER,
  CLICKER_UPGRADES,
  getBaseCornPerClick,
  getUpgradeCost,
  getWaveDefinition,
  MAX_CPS_CAP,
  TD_UPGRADES,
} from './data';
import { ChickenTdEngine } from './engine';
import { MAP_HEIGHT, MAP_WIDTH } from './map';
import { GhostPlacementState, MeadowRenderer, PIXEL_CANVAS_H, PIXEL_CANVAS_W } from './renderer';
import { PIXEL_ATLAS } from './sprites';
import { ChickenTypeId } from './types';

const canvas = document.getElementById('td-canvas') as HTMLCanvasElement;
const hudCorn = document.getElementById('hud-corn') as HTMLElement;
const hudEggs = document.getElementById('hud-eggs') as HTMLElement;
const hudWave = document.getElementById('hud-wave') as HTMLElement;
const hudPops = document.getElementById('hud-pops') as HTMLElement;

const btnSpeed = document.getElementById('btn-speed') as HTMLButtonElement;
const lblSpeed = document.getElementById('lbl-speed') as HTMLElement;
const btnMute = document.getElementById('btn-mute') as HTMLButtonElement;
const iconBtnSound = document.getElementById('icon-btn-sound') as HTMLImageElement;
const btnRules = document.getElementById('btn-rules') as HTMLButtonElement;

const bannerTitle = document.getElementById('banner-title') as HTMLElement;
const bannerDesc = document.getElementById('banner-desc') as HTMLElement;
const placementBanner = document.getElementById('placement-banner') as HTMLDivElement;
const placementText = document.getElementById('placement-text') as HTMLElement;
const btnCancelPlace = document.getElementById('btn-cancel-place') as HTMLButtonElement;

// Inspector Elements
const inspectorCard = document.getElementById('inspector-card') as HTMLDivElement;
const inspPortrait = document.getElementById('insp-portrait') as HTMLImageElement;
const inspName = document.getElementById('insp-name') as HTMLElement;
const inspTierBadge = document.getElementById('insp-tier-badge') as HTMLElement;
const inspStats = document.getElementById('insp-stats') as HTMLElement;
const inspNextDesc = document.getElementById('insp-next-desc') as HTMLElement;
const btnInspTarget = document.getElementById('btn-insp-target') as HTMLButtonElement;
const btnInspUpgrade = document.getElementById('btn-insp-upgrade') as HTMLButtonElement;
const btnInspSell = document.getElementById('btn-insp-sell') as HTMLButtonElement;
const btnInspClose = document.getElementById('btn-insp-close') as HTMLButtonElement;

// Clicker Elements
const clickerCard = document.getElementById('clicker-card') as HTMLDivElement;
const cpsBadge = document.getElementById('cps-badge') as HTMLElement;
const btnHenClick = document.getElementById('btn-hen-click') as HTMLButtonElement;
const henSceneImg = document.getElementById('hen-scene-img') as HTMLImageElement;
const clickFloatLayer = document.getElementById('click-float-layer') as HTMLDivElement;
const clickMainLabel = document.getElementById('click-main-label') as HTMLElement;
const clickStatusNote = document.getElementById('click-status-note') as HTMLElement;
const meterCpsText = document.getElementById('meter-cps-text') as HTMLElement;
const meterCpsFill = document.getElementById('meter-cps-fill') as HTMLDivElement;
const frenzyLabel = document.getElementById('frenzy-label') as HTMLElement;
const basketLabel = document.getElementById('basket-label') as HTMLElement;
const meterFrenzyFill = document.getElementById('meter-frenzy-fill') as HTMLDivElement;

// Shop & Wave Elements
const troopGrid = document.getElementById('troop-grid') as HTMLDivElement;
const clickerUpgList = document.getElementById('clicker-upg-list') as HTMLDivElement;
const tdUpgList = document.getElementById('td-upg-list') as HTMLDivElement;
const btnStartWave = document.getElementById('btn-start-wave') as HTMLButtonElement;

// Modals
const rulesModal = document.getElementById('rules-modal') as HTMLDivElement;
const btnCloseRules = document.getElementById('btn-close-rules') as HTMLButtonElement;
const victoryModal = document.getElementById('victory-modal') as HTMLDivElement;
const victorySummary = document.getElementById('victory-summary') as HTMLElement;
const btnContinueFreeplay = document.getElementById('btn-continue-freeplay') as HTMLButtonElement;
const btnRestartVictory = document.getElementById('btn-restart-victory') as HTMLButtonElement;
const gameoverModal = document.getElementById('gameover-modal') as HTMLDivElement;
const gameoverSummary = document.getElementById('gameover-summary') as HTMLElement;
const btnRestartGameover = document.getElementById('btn-restart-gameover') as HTMLButtonElement;

// Wire all Pixel-Art UI Icons into the DOM (zero emojis!)
function initStaticPixelIcons(): void {
  const setImg = (id: string, url: string) => {
    const el = document.getElementById(id) as HTMLImageElement | null;
    if (el) el.src = url;
  };
  setImg('icon-brand', PIXEL_ATLAS.getIconUrl('chicken'));
  setImg('icon-hud-corn', PIXEL_ATLAS.getIconUrl('corn'));
  setImg('icon-hud-egg', PIXEL_ATLAS.getIconUrl('egg'));
  setImg('icon-hud-fox', PIXEL_ATLAS.getIconUrl('fox'));
  setImg('icon-hud-bug', PIXEL_ATLAS.getIconUrl('bug'));
  setImg('icon-btn-speed', PIXEL_ATLAS.getIconUrl('speed'));
  setImg('icon-btn-sound', PIXEL_ATLAS.getIconUrl('sound_on'));
  setImg('icon-btn-rules', PIXEL_ATLAS.getIconUrl('rules'));
  setImg('icon-clicker-corn', PIXEL_ATLAS.getIconUrl('corn'));
  setImg('icon-tab-troops', PIXEL_ATLAS.getIconUrl('chicken'));
  setImg('icon-tab-clicker', PIXEL_ATLAS.getIconUrl('corn'));
  setImg('icon-tab-td', PIXEL_ATLAS.getIconUrl('shield'));
  setImg('icon-rules-chicken', PIXEL_ATLAS.getIconUrl('chicken'));
  setImg('icon-victory-trophy', PIXEL_ATLAS.getIconUrl('trophy'));
  setImg('icon-gameover-egg', PIXEL_ATLAS.getIconUrl('cracked_egg'));
  henSceneImg.src = PIXEL_ATLAS.henhouseIdleUrl;
}

initStaticPixelIcons();

const engine = new ChickenTdEngine();
canvas.width = PIXEL_CANVAS_W;
canvas.height = PIXEL_CANVAS_H;
const renderer = new MeadowRenderer(canvas);

let selectedTowerId: number | null = null;
let peckAnimTimeout: number | null = null;

const ghost: GhostPlacementState = {
  typeId: null,
  mouseX: MAP_WIDTH / 2,
  mouseY: MAP_HEIGHT / 2,
  insideCanvas: false,
};

function clientToLogicalCoords(clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  return {
    x: ((clientX - rect.left) / rect.width) * MAP_WIDTH,
    y: ((clientY - rect.top) / rect.height) * MAP_HEIGHT,
  };
}

function setPlacementType(typeId: ChickenTypeId | null): void {
  ghost.typeId = typeId;
  if (typeId) {
    selectedTowerId = null;
    const def = CHICKEN_DEFS[typeId];
    placementText.textContent = `DEPLOYING ${def.name.toUpperCase()} (${def.baseCost.toLocaleString()} CORN) — CLICK GRASS`;
    placementBanner.classList.remove('hidden');
  } else {
    placementBanner.classList.add('hidden');
  }
  refreshFullUi();
}

// ==================== 22-UNIT PIXEL SHOP RENDERING ====================
const cornIconUrl = PIXEL_ATLAS.getIconUrl('corn');

function formatCompactCost(n: number): string {
  if (n >= 100000) return `${(n / 1000).toFixed(0)}K`;
  return n.toLocaleString();
}

function renderTroopCards(): void {
  troopGrid.innerHTML = '';
  for (const id of CHICKEN_ORDER) {
    const def = CHICKEN_DEFS[id];
    const canAfford = engine.corn >= def.baseCost;
    const isSelected = ghost.typeId === id;
    const spr = PIXEL_ATLAS.getChickenSprite(id);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `troop-btn${isSelected ? ' selected' : ''}${!canAfford ? ' unaffordable' : ''}`;
    btn.title = `${def.name} (${def.role}) — ${def.baseCost.toLocaleString()} Corn — Hotkey [${def.hotkey}]`;
    btn.innerHTML = `
      <img class="troop-portrait" src="${spr?.portraitUrl ?? ''}" alt="" />
      <div class="troop-meta">
        <div class="troop-top">
          <span class="troop-key">[${def.hotkey}]</span>
          <span class="troop-cost"><img class="px-icon px-icon-sm" src="${cornIconUrl}" alt="" />${formatCompactCost(def.baseCost)}</span>
        </div>
        <span class="troop-name">${def.name}</span>
        <span class="troop-role">${def.role}</span>
      </div>
    `;
    btn.addEventListener('click', () => {
      if (ghost.typeId === id) {
        setPlacementType(null);
      } else {
        setPlacementType(id);
      }
    });
    troopGrid.appendChild(btn);
  }
}

function renderUpgradeLists(): void {
  clickerUpgList.innerHTML = '';
  for (const def of CLICKER_UPGRADES) {
    const lvl = engine.clickerLevels[def.id];
    const maxed = lvl >= def.maxLevel;
    const cost = maxed ? 0 : getUpgradeCost(def, lvl);
    const canBuy = !maxed && engine.corn >= cost;
    const iconUrl = PIXEL_ATLAS.getIconUrl(def.iconId);

    const row = document.createElement('div');
    row.className = 'upg-row';
    row.innerHTML = `
      <div class="upg-icon-box">
        <img class="px-icon px-icon-md" src="${iconUrl}" alt="" />
      </div>
      <div class="upg-info">
        <div class="upg-title">${def.name} (LV ${lvl}/${def.maxLevel})</div>
        <div class="upg-effect">${def.getEffectLabel(lvl)}${
      maxed ? ' [MAX]' : ` -> ${def.getEffectLabel(lvl + 1)}`
    }</div>
        <div class="upg-desc">${def.description}</div>
      </div>
      <button type="button" class="upg-buy-btn" ${canBuy ? '' : 'disabled'}>
        ${
          maxed
            ? 'MAX'
            : `<img class="px-icon px-icon-sm" src="${cornIconUrl}" alt="" />${cost}`
        }
      </button>
    `;
    row.querySelector('button')!.addEventListener('click', () => {
      engine.buyClickerUpgrade(def.id);
    });
    clickerUpgList.appendChild(row);
  }

  tdUpgList.innerHTML = '';
  for (const def of TD_UPGRADES) {
    const lvl = engine.tdLevels[def.id];
    const maxed = lvl >= def.maxLevel;
    const cost = maxed ? 0 : getUpgradeCost(def, lvl);
    const canBuy = !maxed && engine.corn >= cost;
    const iconUrl = PIXEL_ATLAS.getIconUrl(def.iconId);

    const row = document.createElement('div');
    row.className = 'upg-row';
    row.innerHTML = `
      <div class="upg-icon-box">
        <img class="px-icon px-icon-md" src="${iconUrl}" alt="" />
      </div>
      <div class="upg-info">
        <div class="upg-title">${def.name} (LV ${lvl}/${def.maxLevel})</div>
        <div class="upg-effect">${def.getEffectLabel(lvl)}${
      maxed ? ' [MAX]' : ` -> ${def.getEffectLabel(lvl + 1)}`
    }</div>
        <div class="upg-desc">${def.description}</div>
      </div>
      <button type="button" class="upg-buy-btn" ${canBuy ? '' : 'disabled'}>
        ${
          maxed
            ? 'MAX'
            : `<img class="px-icon px-icon-sm" src="${cornIconUrl}" alt="" />${cost}`
        }
      </button>
    `;
    row.querySelector('button')!.addEventListener('click', () => {
      engine.buyTdUpgrade(def.id);
    });
    tdUpgList.appendChild(row);
  }
}

function formatInspectorStats(towerId: number): string {
  const tower = engine.towers.find((t) => t.id === towerId);
  if (!tower) return '';
  const eff = engine.getEffectiveChickenStats(tower);
  const camoTag = eff.effectiveCamo ? ' | CAMO' : '';
  const dmgText = Number.isInteger(eff.damage)
    ? eff.damage.toLocaleString()
    : eff.damage.toFixed(1);
  return `DMG ${dmgText} | ${eff.effectiveFireRate.toFixed(2)}/S | RNG ${
    eff.effectiveRange
  } | DEALT ${Math.round(tower.totalPopDamage).toLocaleString()}${camoTag}`;
}

function renderInspector(): void {
  const tower =
    selectedTowerId !== null
      ? engine.towers.find((t) => t.id === selectedTowerId) ?? null
      : null;

  if (!tower) {
    inspectorCard.classList.add('hidden');
    return;
  }

  const def = CHICKEN_DEFS[tower.typeId];
  const eff = engine.getEffectiveChickenStats(tower);
  const tierNum = tower.tier + 1;
  const spr = PIXEL_ATLAS.getChickenSprite(tower.typeId);

  inspPortrait.src = spr?.portraitUrl ?? '';
  inspName.textContent = `${def.name} — ${eff.tierName}`;
  inspTierBadge.textContent = tower.tier === 3 ? 'TIER 4 MAX' : `TIER ${tierNum}/4`;
  inspStats.textContent = formatInspectorStats(tower.id);

  btnInspTarget.textContent = `AIM: ${tower.targetMode.toUpperCase()}`;

  if (tower.tier < 3) {
    const nextTier = def.tiers[(tower.tier + 1) as 1 | 2 | 3];
    inspNextDesc.textContent = `NEXT (${nextTier.tierName}): ${nextTier.description}`;
    btnInspUpgrade.textContent = `TIER ${tierNum + 1} (${nextTier.upgradeCost.toLocaleString()} CORN)`;
    btnInspUpgrade.disabled = engine.corn < nextTier.upgradeCost;
  } else {
    inspNextDesc.textContent = 'MAXIMUM CHICKEN EVOLUTION ACHIEVED!';
    btnInspUpgrade.textContent = 'MAX TIER';
    btnInspUpgrade.disabled = true;
  }

  const refund = Math.round(tower.totalSpent * 0.7);
  btnInspSell.textContent = `SELL (+${refund.toLocaleString()})`;
  inspectorCard.classList.remove('hidden');
}

function refreshFullUi(): void {
  hudCorn.textContent = engine.corn.toLocaleString();
  hudEggs.textContent = `${engine.eggs} / ${engine.maxEggs}`;
  hudWave.textContent = engine.freeplayUnlocked
    ? `${engine.waveNumber} (FREE)`
    : `${Math.min(engine.waveNumber, CAMPAIGN_WAVES)} / ${CAMPAIGN_WAVES}`;
  hudPops.textContent = engine.totalBugsPopped.toLocaleString();

  const waveDef = getWaveDefinition(engine.waveNumber);
  bannerTitle.textContent = `WAVE ${waveDef.waveNumber}: ${waveDef.title.toUpperCase()}`;
  bannerDesc.textContent = waveDef.callout;

  const baseClick = getBaseCornPerClick(engine.clickerLevels.beakPower);
  clickMainLabel.textContent = `+${baseClick} BASE CORN / CLICK`;

  if (engine.waveActive) {
    clickerCard.classList.remove('locked');
    clickStatusNote.textContent = 'WAVE ACTIVE — CLICK UP TO 12 CPS FOR CORN!';
    const rem = engine.getPendingWaveEnemyTotal();
    btnStartWave.textContent = `WAVE ${waveDef.waveNumber} ACTIVE (${rem} LEFT)`;
    btnStartWave.classList.add('wave-running');
    btnStartWave.disabled = true;
  } else {
    clickerCard.classList.add('locked');
    clickStatusNote.textContent = 'LOCKED BETWEEN WAVES — START WAVE TO CLICK!';
    btnStartWave.textContent = `>> START WAVE ${waveDef.waveNumber} (UNLOCK CLICKER!)`;
    btnStartWave.classList.remove('wave-running');
    btnStartWave.disabled = false;
  }

  renderTroopCards();
  renderUpgradeLists();
  renderInspector();

  if (engine.status === 'victory_prompt') {
    victorySummary.textContent = `You crushed the Omega Reynard Armada on Wave 25! Popped ${engine.totalBugsPopped.toLocaleString()} pests and harvested ${engine.totalCornClicked.toLocaleString()} Corn!`;
    victoryModal.classList.remove('hidden');
  } else {
    victoryModal.classList.add('hidden');
  }

  if (engine.status === 'gameover') {
    gameoverSummary.textContent = `The Bugs & Foxes raided the Nest on Wave ${engine.waveNumber}. Total Popped: ${engine.totalBugsPopped.toLocaleString()} | Total Corn Clicked: ${engine.totalCornClicked.toLocaleString()}.`;
    gameoverModal.classList.remove('hidden');
  } else {
    gameoverModal.classList.add('hidden');
  }
}

engine.onUiChange = refreshFullUi;

// ==================== REAL-TIME PIXEL METER HUD ====================
function updateLiveClickerMeters(): void {
  const cps = engine.getCurrentCps();
  const isAtCap = cps >= MAX_CPS_CAP || engine.capHitFlash > 0.15;
  cpsBadge.textContent = isAtCap ? `MAX ${MAX_CPS_CAP} CPS CAP!` : `${cps} / ${MAX_CPS_CAP} CPS`;
  cpsBadge.classList.toggle('capped', isAtCap);

  meterCpsText.textContent = `${cps} / ${MAX_CPS_CAP}`;
  meterCpsFill.style.width = `${Math.min(100, (cps / MAX_CPS_CAP) * 100)}%`;

  const fMult = engine.getCurrentFrenzyMultiplier();
  frenzyLabel.textContent = `FRENZY (${fMult.toFixed(2)}X)`;
  meterFrenzyFill.style.width = `${Math.round(engine.frenzyMeter * 100)}%`;

  if (engine.clickerLevels.harvestBasket > 0) {
    const step = engine.waveClickCounter % 12;
    basketLabel.textContent = `MEGA COB: ${step} / 12`;
  } else {
    basketLabel.textContent = 'MEGA COB: LOCKED';
  }

  hudPops.textContent = engine.totalBugsPopped.toLocaleString();
  if (engine.waveActive) {
    const rem = engine.getPendingWaveEnemyTotal();
    btnStartWave.textContent = `WAVE ${engine.waveNumber} ACTIVE (${rem} LEFT)`;
    if (selectedTowerId !== null) {
      inspStats.textContent = formatInspectorStats(selectedTowerId);
    }
  }
}

function triggerPixelHenPeckFrame(): void {
  henSceneImg.src = PIXEL_ATLAS.henhousePeckUrl;
  if (peckAnimTimeout !== null) {
    window.clearTimeout(peckAnimTimeout);
  }
  peckAnimTimeout = window.setTimeout(() => {
    henSceneImg.src = PIXEL_ATLAS.henhouseIdleUrl;
    peckAnimTimeout = null;
  }, 95);
}

function spawnClickFloat(text: string, color: string, clientX?: number, clientY?: number): void {
  const rect = btnHenClick.getBoundingClientRect();
  const relX =
    clientX !== undefined && clientX > 0
      ? clientX - rect.left + (Math.random() - 0.5) * 20
      : rect.width / 2 + (Math.random() - 0.5) * 50;
  const relY =
    clientY !== undefined && clientY > 0 ? clientY - rect.top - 8 : rect.height / 2;

  const el = document.createElement('span');
  el.className = 'click-float-num';
  el.textContent = text;
  el.style.left = `${relX}px`;
  el.style.top = `${relY}px`;
  el.style.color = color;
  clickFloatLayer.appendChild(el);
  setTimeout(() => el.remove(), 630);
}

// ==================== INPUT LISTENERS ====================
btnHenClick.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const res = engine.handleHenClick(performance.now());
  if (!res.accepted) {
    if (res.reason === 'between_waves') {
      spawnClickFloat('START WAVE FIRST!', '#94A3B8', e.clientX, e.clientY);
    }
    // When res.reason === 'cps_cap' (>12 CPS), excess clicks strictly do nothing!
    updateLiveClickerMeters();
    return;
  }

  triggerPixelHenPeckFrame();

  if (res.isMegaCob) {
    spawnClickFloat(`+${res.amountEarned} MEGA COB!`, '#4ADE80', e.clientX, e.clientY);
  } else if (res.isCrit) {
    spawnClickFloat(`+${res.amountEarned} CRIT!`, '#FEF08A', e.clientX, e.clientY);
  } else {
    spawnClickFloat(`+${res.amountEarned} CORN`, '#FFFFFF', e.clientX, e.clientY);
  }
  updateLiveClickerMeters();
});

btnHenClick.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
  }
});

// Shop tab switching
document.querySelectorAll<HTMLButtonElement>('.shop-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.shop-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const which = tab.dataset.tab;
    document.getElementById('tab-troops')!.classList.toggle('hidden', which !== 'troops');
    document.getElementById('tab-clicker')!.classList.toggle('hidden', which !== 'clicker');
    document.getElementById('tab-td')!.classList.toggle('hidden', which !== 'td');
  });
});

// Canvas mouse tracking & placement / selection
canvas.addEventListener('mousemove', (e) => {
  const pt = clientToLogicalCoords(e.clientX, e.clientY);
  ghost.mouseX = pt.x;
  ghost.mouseY = pt.y;
  ghost.insideCanvas = true;
});

canvas.addEventListener('mouseleave', () => {
  ghost.insideCanvas = false;
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (ghost.typeId) setPlacementType(null);
  else {
    selectedTowerId = null;
    renderInspector();
  }
});

canvas.addEventListener('click', (e) => {
  const pt = clientToLogicalCoords(e.clientX, e.clientY);

  if (ghost.typeId) {
    const placed = engine.placeChicken(ghost.typeId, pt.x, pt.y);
    if (placed) {
      if (!e.shiftKey || engine.corn < CHICKEN_DEFS[ghost.typeId].baseCost) {
        ghost.typeId = null;
        placementBanner.classList.add('hidden');
        selectedTowerId = placed.id;
      }
      refreshFullUi();
    }
    return;
  }

  let clickedTowerId: number | null = null;
  for (let i = engine.towers.length - 1; i >= 0; i--) {
    const t = engine.towers[i];
    if (Math.hypot(pt.x - t.x, pt.y - t.y) <= 24) {
      clickedTowerId = t.id;
      break;
    }
  }
  selectedTowerId = clickedTowerId;
  renderInspector();
});

btnCancelPlace.addEventListener('click', () => setPlacementType(null));

btnInspTarget.addEventListener('click', () => {
  if (selectedTowerId !== null) engine.cycleTargetMode(selectedTowerId);
});

btnInspUpgrade.addEventListener('click', () => {
  if (selectedTowerId !== null) engine.upgradeChickenTower(selectedTowerId);
});

btnInspSell.addEventListener('click', () => {
  if (selectedTowerId !== null) {
    engine.sellChickenTower(selectedTowerId);
    selectedTowerId = null;
    renderInspector();
  }
});

btnInspClose.addEventListener('click', () => {
  selectedTowerId = null;
  renderInspector();
});

btnStartWave.addEventListener('click', () => {
  btnStartWave.blur();
  engine.startNextWave();
});

btnSpeed.addEventListener('click', () => {
  btnSpeed.blur();
  engine.speedMultiplier = engine.speedMultiplier === 1 ? 2 : 1;
  lblSpeed.textContent = `${engine.speedMultiplier}X`;
  btnSpeed.classList.toggle('active-speed', engine.speedMultiplier === 2);
});

btnMute.addEventListener('click', () => {
  btnMute.blur();
  const muted = engine.audio.toggleMute();
  iconBtnSound.src = PIXEL_ATLAS.getIconUrl(muted ? 'sound_off' : 'sound_on');
});

btnRules.addEventListener('click', () => rulesModal.classList.remove('hidden'));
btnCloseRules.addEventListener('click', () => rulesModal.classList.add('hidden'));
rulesModal.addEventListener('click', (e) => {
  if (e.target === rulesModal) rulesModal.classList.add('hidden');
});

btnContinueFreeplay.addEventListener('click', () => {
  engine.freeplayUnlocked = true;
  engine.status = 'playing';
  refreshFullUi();
});

btnRestartVictory.addEventListener('click', () => {
  selectedTowerId = null;
  setPlacementType(null);
  engine.resetGame();
});

btnRestartGameover.addEventListener('click', () => {
  selectedTowerId = null;
  setPlacementType(null);
  engine.resetGame();
});

// Hotkey map for all 22 Chicken Units!
const HOTKEY_TO_CHICKEN = new Map<string, ChickenTypeId>();
for (const id of CHICKEN_ORDER) {
  HOTKEY_TO_CHICKEN.set(CHICKEN_DEFS[id].hotkey.toUpperCase(), id);
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.key === 'Escape') {
    if (!rulesModal.classList.contains('hidden')) {
      rulesModal.classList.add('hidden');
    } else if (ghost.typeId) {
      setPlacementType(null);
    } else if (selectedTowerId !== null) {
      selectedTowerId = null;
      renderInspector();
    }
    return;
  }

  const mappedUnit = HOTKEY_TO_CHICKEN.get(e.key.toUpperCase());
  if (mappedUnit) {
    setPlacementType(ghost.typeId === mappedUnit ? null : mappedUnit);
    return;
  }

  if (e.key === ' ' && !engine.waveActive && engine.status === 'playing') {
    e.preventDefault();
    engine.startNextWave();
  }
});

// Initial UI population
refreshFullUi();

let lastPerfMs = performance.now();
function loop(nowMs: number): void {
  requestAnimationFrame(loop);
  try {
    const dt = Math.max(0.001, Math.min(0.08, (nowMs - lastPerfMs) / 1000));
    lastPerfMs = nowMs;

    engine.tick(dt);
    updateLiveClickerMeters();
    renderer.render(canvas, engine, selectedTowerId, ghost, nowMs / 1000);
  } catch (err) {
    console.error('ChickenTD tick error:', err);
  }
}
requestAnimationFrame(loop);
