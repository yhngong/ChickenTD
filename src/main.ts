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
import { GhostPlacementState, MeadowRenderer } from './renderer';
import { ChickenTypeId } from './types';

const canvas = document.getElementById('td-canvas') as HTMLCanvasElement;
const hudCorn = document.getElementById('hud-corn') as HTMLElement;
const hudEggs = document.getElementById('hud-eggs') as HTMLElement;
const hudWave = document.getElementById('hud-wave') as HTMLElement;
const hudPops = document.getElementById('hud-pops') as HTMLElement;

const btnSpeed = document.getElementById('btn-speed') as HTMLButtonElement;
const btnMute = document.getElementById('btn-mute') as HTMLButtonElement;
const btnRules = document.getElementById('btn-rules') as HTMLButtonElement;

const bannerTitle = document.getElementById('banner-title') as HTMLElement;
const bannerDesc = document.getElementById('banner-desc') as HTMLElement;
const placementBanner = document.getElementById('placement-banner') as HTMLDivElement;
const placementText = document.getElementById('placement-text') as HTMLElement;
const btnCancelPlace = document.getElementById('btn-cancel-place') as HTMLButtonElement;

// Inspector Elements
const inspectorCard = document.getElementById('inspector-card') as HTMLDivElement;
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

const engine = new ChickenTdEngine();
const renderer = new MeadowRenderer(canvas);

let selectedTowerId: number | null = null;
const ghost: GhostPlacementState = {
  typeId: null,
  mouseX: MAP_WIDTH / 2,
  mouseY: MAP_HEIGHT / 2,
  insideCanvas: false,
};

function syncCanvasResolution(): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }
}
window.addEventListener('resize', syncCanvasResolution);
syncCanvasResolution();

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
    placementText.textContent = `Placing ${def.name} (🌽 ${def.baseCost}) — Click grass to deploy`;
    placementBanner.classList.remove('hidden');
  } else {
    placementBanner.classList.add('hidden');
  }
  refreshFullUi();
}

// ==================== SHOP RENDERING ====================
function renderTroopCards(): void {
  troopGrid.innerHTML = '';
  for (const id of CHICKEN_ORDER) {
    const def = CHICKEN_DEFS[id];
    const canAfford = engine.corn >= def.baseCost;
    const isSelected = ghost.typeId === id;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `troop-btn${isSelected ? ' selected' : ''}${!canAfford ? ' unaffordable' : ''}`;
    btn.innerHTML = `
      <div class="troop-top">
        <span class="troop-swatch" style="background:${def.featherColor};border-color:${def.accentColor}"></span>
        <span class="troop-cost">🌽 ${def.baseCost}</span>
      </div>
      <span class="troop-name">[${def.hotkey}] ${def.name}</span>
      <span class="troop-role">${def.role}</span>
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

    const row = document.createElement('div');
    row.className = 'upg-row';
    row.innerHTML = `
      <div class="upg-info">
        <div class="upg-title">${def.icon} ${def.name} (Lv ${lvl}/${def.maxLevel})</div>
        <div class="upg-effect">${def.getEffectLabel(lvl)}${
      maxed ? ' • MAX' : ` → ${def.getEffectLabel(lvl + 1)}`
    }</div>
        <div class="upg-desc">${def.description}</div>
      </div>
      <button type="button" class="upg-buy-btn" ${canBuy ? '' : 'disabled'}>
        ${maxed ? 'MAX' : `🌽 ${cost}`}
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

    const row = document.createElement('div');
    row.className = 'upg-row';
    row.innerHTML = `
      <div class="upg-info">
        <div class="upg-title">${def.icon} ${def.name} (Lv ${lvl}/${def.maxLevel})</div>
        <div class="upg-effect">${def.getEffectLabel(lvl)}${
      maxed ? ' • MAX' : ` → ${def.getEffectLabel(lvl + 1)}`
    }</div>
        <div class="upg-desc">${def.description}</div>
      </div>
      <button type="button" class="upg-buy-btn" ${canBuy ? '' : 'disabled'}>
        ${maxed ? 'MAX' : `🌽 ${cost}`}
      </button>
    `;
    row.querySelector('button')!.addEventListener('click', () => {
      engine.buyTdUpgrade(def.id);
    });
    tdUpgList.appendChild(row);
  }
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

  inspName.textContent = `${def.name} — ${eff.tierName}`;
  inspTierBadge.textContent = tower.tier === 3 ? '👑 Tier 4 MAX' : `Tier ${tierNum} / 4`;

  const camoTag = eff.effectiveCamo ? ' • 👁️ Camo' : '';
  inspStats.textContent = `DMG ${eff.damage} • ${eff.effectiveFireRate.toFixed(
    2
  )}/s • RNG ${eff.effectiveRange} • 💥 ${Math.round(tower.totalPopDamage).toLocaleString()}${camoTag}`;

  btnInspTarget.textContent = `🎯 Target: ${
    tower.targetMode.charAt(0).toUpperCase() + tower.targetMode.slice(1)
  }`;

  if (tower.tier < 3) {
    const nextTier = def.tiers[(tower.tier + 1) as 1 | 2 | 3];
    inspNextDesc.textContent = `Next (${nextTier.tierName}): ${nextTier.description}`;
    btnInspUpgrade.textContent = `⬆ Tier ${tierNum + 1} (🌽 ${nextTier.upgradeCost})`;
    btnInspUpgrade.disabled = engine.corn < nextTier.upgradeCost;
  } else {
    inspNextDesc.textContent = 'Maximum Chicken Evolution achieved!';
    btnInspUpgrade.textContent = '👑 MAX TIER';
    btnInspUpgrade.disabled = true;
  }

  const refund = Math.round(tower.totalSpent * 0.7);
  btnInspSell.textContent = `💰 Sell (+${refund})`;
  inspectorCard.classList.remove('hidden');
}

function refreshFullUi(): void {
  hudCorn.textContent = engine.corn.toLocaleString();
  hudEggs.textContent = `${engine.eggs} / ${engine.maxEggs}`;
  hudWave.textContent = engine.freeplayUnlocked
    ? `${engine.waveNumber} (Freeplay)`
    : `${Math.min(engine.waveNumber, CAMPAIGN_WAVES)} / ${CAMPAIGN_WAVES}`;
  hudPops.textContent = engine.totalBugsPopped.toLocaleString();

  const previewWaveNum = engine.waveActive ? engine.waveNumber : engine.waveNumber;
  const waveDef = getWaveDefinition(previewWaveNum);
  bannerTitle.textContent = `Wave ${waveDef.waveNumber}: ${waveDef.title}`;
  bannerDesc.textContent = waveDef.callout;

  // Clicker card lock vs active state
  const baseClick = getBaseCornPerClick(engine.clickerLevels.beakPower);
  clickMainLabel.textContent = `+${baseClick} Base Corn / Click`;

  if (engine.waveActive) {
    clickerCard.classList.remove('locked');
    clickStatusNote.textContent = '⚡ WAVE ACTIVE — Click up to 12 CPS for Corn!';
    const rem = engine.getPendingWaveEnemyTotal();
    btnStartWave.textContent = `⚔️ Wave ${waveDef.waveNumber} Active (${rem} Bugs/Foxes Left)`;
    btnStartWave.classList.add('wave-running');
    btnStartWave.disabled = true;
  } else {
    clickerCard.classList.add('locked');
    clickStatusNote.textContent = '😴 Locked Between Waves — Start Wave to Click!';
    btnStartWave.textContent = `▶ Start Wave ${waveDef.waveNumber} (Unlock Clicker!)`;
    btnStartWave.classList.remove('wave-running');
    btnStartWave.disabled = false;
  }

  renderTroopCards();
  renderUpgradeLists();
  renderInspector();

  // Modals
  if (engine.status === 'victory_prompt') {
    victorySummary.textContent = `You crushed Mega Alpha Reynard on Wave 25! Popped ${engine.totalBugsPopped.toLocaleString()} pests and harvested ${engine.totalCornClicked.toLocaleString()} Corn!`;
    victoryModal.classList.remove('hidden');
  } else {
    victoryModal.classList.add('hidden');
  }

  if (engine.status === 'gameover') {
    gameoverSummary.textContent = `The Bugs & Foxes raided the Nest on Wave ${engine.waveNumber}. Total Popped: ${engine.totalBugsPopped.toLocaleString()} • Total Corn Clicked: ${engine.totalCornClicked.toLocaleString()}.`;
    gameoverModal.classList.remove('hidden');
  } else {
    gameoverModal.classList.add('hidden');
  }
}

engine.onUiChange = refreshFullUi;

// ==================== REAL-TIME CLICKER METER HUD ====================
function updateLiveClickerMeters(): void {
  const cps = engine.getCurrentCps();
  const isAtCap = cps >= MAX_CPS_CAP || engine.capHitFlash > 0.15;
  cpsBadge.textContent = isAtCap ? `MAX ${MAX_CPS_CAP} CPS CAP!` : `${cps} / ${MAX_CPS_CAP} CPS`;
  cpsBadge.classList.toggle('capped', isAtCap);

  meterCpsText.textContent = `${cps} / ${MAX_CPS_CAP}`;
  meterCpsFill.style.width = `${Math.min(100, (cps / MAX_CPS_CAP) * 100)}%`;

  const fMult = engine.getCurrentFrenzyMultiplier();
  frenzyLabel.textContent = `Frenzy Streak (${fMult.toFixed(2)}x)`;
  meterFrenzyFill.style.width = `${Math.round(engine.frenzyMeter * 100)}%`;

  if (engine.clickerLevels.harvestBasket > 0) {
    const step = engine.waveClickCounter % 12;
    basketLabel.textContent = `Mega Cob: ${step} / 12`;
  } else {
    basketLabel.textContent = 'Mega Cob: Locked';
  }

  hudPops.textContent = engine.totalBugsPopped.toLocaleString();
  if (engine.waveActive) {
    const rem = engine.getPendingWaveEnemyTotal();
    btnStartWave.textContent = `⚔️ Wave ${engine.waveNumber} Active (${rem} Bugs/Foxes Left)`;
    if (selectedTowerId !== null) {
      const t = engine.towers.find((tw) => tw.id === selectedTowerId);
      if (t) {
        const eff = engine.getEffectiveChickenStats(t);
        const camoTag = eff.effectiveCamo ? ' • 👁️ Camo' : '';
        inspStats.textContent = `DMG ${eff.damage} • ${eff.effectiveFireRate.toFixed(
          2
        )}/s • RNG ${eff.effectiveRange} • 💥 ${Math.round(t.totalPopDamage).toLocaleString()}${camoTag}`;
      }
    }
  }
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
  setTimeout(() => el.remove(), 660);
}

// ==================== INPUT LISTENERS ====================
btnHenClick.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const res = engine.handleHenClick(performance.now());
  if (!res.accepted) {
    if (res.reason === 'between_waves') {
      spawnClickFloat('Start Wave First!', '#94A3B8', e.clientX, e.clientY);
    }
    // Note: when res.reason === 'cps_cap' (>12 CPS), extra clicks do nothing!
    updateLiveClickerMeters();
    return;
  }

  if (res.isMegaCob) {
    spawnClickFloat(`🧺 +${res.amountEarned} MEGA!`, '#4ADE80', e.clientX, e.clientY);
  } else if (res.isCrit) {
    spawnClickFloat(`✨ +${res.amountEarned} CRIT!`, '#FEF08A', e.clientX, e.clientY);
  } else {
    spawnClickFloat(`+${res.amountEarned} 🌽`, '#FFFFFF', e.clientX, e.clientY);
  }
  updateLiveClickerMeters();
});

// Prevent Space/Enter from synthesizing button clicks on the Hen Clicker!
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
      // If player still has enough Corn and holds Shift, keep placing; otherwise select newly placed Chicken!
      if (!e.shiftKey || engine.corn < CHICKEN_DEFS[ghost.typeId].baseCost) {
        ghost.typeId = null;
        placementBanner.classList.add('hidden');
        selectedTowerId = placed.id;
      }
      refreshFullUi();
    }
    return;
  }

  // Otherwise check if user clicked an existing placed Chicken Troop!
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
  btnSpeed.textContent = `⏩ ${engine.speedMultiplier}x`;
  btnSpeed.classList.toggle('active-speed', engine.speedMultiplier === 2);
});

btnMute.addEventListener('click', () => {
  btnMute.blur();
  const muted = engine.audio.toggleMute();
  btnMute.textContent = muted ? '🔇' : '🔊';
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

  const num = Number(e.key);
  if (num >= 1 && num <= 6) {
    const pick = CHICKEN_ORDER[num - 1];
    if (pick) setPlacementType(ghost.typeId === pick ? null : pick);
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
