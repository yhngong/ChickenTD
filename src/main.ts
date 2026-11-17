import './style.css';
import {
  CAMPAIGN_WAVES,
  CHICKEN_DEFS,
  CHICKEN_ORDER,
  CLICKER_UPGRADES,
  DIFFICULTY_DEFS,
  DIFFICULTY_ORDER,
  getBaseCornPerClick,
  getCornucopiaWaveMult,
  getFarmhandAutoRate,
  getWaveDefinition,
  MAX_CPS_CAP,
  TD_UPGRADES,
} from './data';
import { ChickenTdEngine } from './engine';
import { MAP_DEFS, MAP_HEIGHT, MAP_ORDER, MAP_WIDTH } from './map';
import {
  bakeMapPreviewDataUrl,
  GhostPlacementState,
  MeadowRenderer,
  PIXEL_CANVAS_H,
  PIXEL_CANVAS_W,
} from './renderer';
import { PIXEL_ATLAS } from './sprites';
import { ChickenTypeId, DifficultyId, MapId } from './types';

// Main Menu Elements
const mainMenuScreen = document.getElementById('main-menu-screen') as HTMLDivElement;
const menuMapGrid = document.getElementById('menu-map-grid') as HTMLDivElement;
const menuDiffGrid = document.getElementById('menu-diff-grid') as HTMLDivElement;
const menuMapSummary = document.getElementById('menu-map-summary') as HTMLElement;
const menuDiffSummary = document.getElementById('menu-diff-summary') as HTMLElement;
const btnMenuStart = document.getElementById('btn-menu-start') as HTMLButtonElement;
const btnMenuResume = document.getElementById('btn-menu-resume') as HTMLButtonElement;
const btnMenuRules = document.getElementById('btn-menu-rules') as HTMLButtonElement;

const canvas = document.getElementById('td-canvas') as HTMLCanvasElement;
const brandSubText = document.getElementById('brand-sub-text') as HTMLElement;
const hudCorn = document.getElementById('hud-corn') as HTMLElement;
const hudEggs = document.getElementById('hud-eggs') as HTMLElement;
const hudWave = document.getElementById('hud-wave') as HTMLElement;
const hudPops = document.getElementById('hud-pops') as HTMLElement;

const btnSpeed = document.getElementById('btn-speed') as HTMLButtonElement;
const lblSpeed = document.getElementById('lbl-speed') as HTMLElement;
const btnMute = document.getElementById('btn-mute') as HTMLButtonElement;
const iconBtnSound = document.getElementById('icon-btn-sound') as HTMLImageElement;
const btnRules = document.getElementById('btn-rules') as HTMLButtonElement;
const btnMenu = document.getElementById('btn-menu') as HTMLButtonElement;

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
const btnMenuVictory = document.getElementById('btn-menu-victory') as HTMLButtonElement;
const gameoverModal = document.getElementById('gameover-modal') as HTMLDivElement;
const gameoverSummary = document.getElementById('gameover-summary') as HTMLElement;
const btnRestartGameover = document.getElementById('btn-restart-gameover') as HTMLButtonElement;
const btnMenuGameover = document.getElementById('btn-menu-gameover') as HTMLButtonElement;

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
  setImg('icon-btn-menu', PIXEL_ATLAS.getIconUrl('menu'));
  setImg('icon-clicker-corn', PIXEL_ATLAS.getIconUrl('corn'));
  setImg('icon-tab-troops', PIXEL_ATLAS.getIconUrl('chicken'));
  setImg('icon-tab-clicker', PIXEL_ATLAS.getIconUrl('corn'));
  setImg('icon-tab-td', PIXEL_ATLAS.getIconUrl('shield'));
  setImg('icon-rules-chicken', PIXEL_ATLAS.getIconUrl('chicken'));
  setImg('icon-victory-trophy', PIXEL_ATLAS.getIconUrl('trophy'));
  setImg('icon-gameover-egg', PIXEL_ATLAS.getIconUrl('cracked_egg'));
  setImg('menu-hero-chicken', PIXEL_ATLAS.getChickenSprite('omega_god')?.portraitUrl ?? '');
  henSceneImg.src = PIXEL_ATLAS.henhouseIdleUrl;
}

initStaticPixelIcons();

const engine = new ChickenTdEngine();
canvas.width = PIXEL_CANVAS_W;
canvas.height = PIXEL_CANVAS_H;
const renderer = new MeadowRenderer(canvas);

let selectedTowerId: number | null = null;
let peckAnimTimeout: number | null = null;
let inMainMenu = true;
let hasStartedRun = false;
let pendingMapId: MapId = 'sunny_meadow';
let pendingDifficultyId: DifficultyId = 'normal';

// Bake crisp pixel-art map thumbnails once for all 5 maps!
const MAP_THUMB_URLS = new Map<MapId, string>();
for (const mId of MAP_ORDER) {
  MAP_THUMB_URLS.set(mId, bakeMapPreviewDataUrl(mId));
}

function renderMainMenu(): void {
  const selMap = MAP_DEFS[pendingMapId];
  const selDiff = DIFFICULTY_DEFS[pendingDifficultyId];
  menuMapSummary.textContent = `${selMap.name.toUpperCase()} • ${selMap.badge}`;
  menuDiffSummary.textContent = `${selDiff.name.toUpperCase()} (${selDiff.badge})`;
  btnMenuStart.textContent = `>> START BATTLE — ${selMap.name.toUpperCase()} [${selDiff.badge}]`;

  const canResume = hasStartedRun && engine.status !== 'gameover';
  if (canResume) {
    btnMenuResume.textContent = `RESUME (WAVE ${engine.waveNumber})`;
    btnMenuResume.classList.remove('hidden');
  } else {
    btnMenuResume.classList.add('hidden');
  }

  menuMapGrid.innerHTML = '';
  for (const mId of MAP_ORDER) {
    const mDef = MAP_DEFS[mId];
    const isSel = mId === pendingMapId;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `map-card-btn${isSel ? ' selected' : ''}`;
    card.innerHTML = `
      <div class="map-thumb-wrap">
        <img class="map-thumb-img" src="${MAP_THUMB_URLS.get(mId) ?? ''}" alt="" />
        <span class="map-badge-pill" style="color: ${mDef.badgeColor}">${mDef.badge}</span>
        <span class="map-len-pill">${Math.round(mDef.totalPathLength)} PX</span>
      </div>
      <div class="map-card-title">${mDef.name}</div>
      <div class="map-card-desc">${mDef.description}</div>
    `;
    card.addEventListener('click', () => {
      pendingMapId = mId;
      engine.audio.playUpgrade();
      renderMainMenu();
    });
    menuMapGrid.appendChild(card);
  }

  menuDiffGrid.innerHTML = '';
  for (const dId of DIFFICULTY_ORDER) {
    const dDef = DIFFICULTY_DEFS[dId];
    const isSel = dId === pendingDifficultyId;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `diff-card-btn${isSel ? ' selected' : ''}`;
    card.innerHTML = `
      <div class="diff-card-top">
        <span class="diff-card-name">${dDef.name}</span>
        <span class="diff-badge" style="color: ${dDef.accentColor}">${dDef.badge}</span>
      </div>
      <div class="diff-card-desc">${dDef.description}</div>
    `;
    card.addEventListener('click', () => {
      pendingDifficultyId = dId;
      engine.audio.playUpgrade();
      renderMainMenu();
    });
    menuDiffGrid.appendChild(card);
  }
}

function openMainMenu(): void {
  inMainMenu = true;
  pendingMapId = engine.mapId;
  pendingDifficultyId = engine.difficultyId;
  victoryModal.classList.add('hidden');
  gameoverModal.classList.add('hidden');
  renderMainMenu();
  mainMenuScreen.classList.remove('hidden');
}

function launchSelectedRun(): void {
  selectedTowerId = null;
  ghost.typeId = null;
  placementBanner.classList.add('hidden');
  hasStartedRun = true;
  inMainMenu = false;
  mainMenuScreen.classList.add('hidden');
  engine.startNewRun(pendingMapId, pendingDifficultyId);
  renderer.setMap(pendingMapId);
  refreshFullUi();
}

function resumeActiveRun(): void {
  if (!hasStartedRun || engine.status === 'gameover') return;
  inMainMenu = false;
  mainMenuScreen.classList.add('hidden');
  refreshFullUi();
}

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
    const cost = engine.getTowerBaseCost(typeId);
    placementText.textContent = `DEPLOYING ${def.name.toUpperCase()} (${cost.toLocaleString()} CORN) — CLICK GRASS`;
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
    const cost = engine.getTowerBaseCost(id);
    const canAfford = engine.corn >= cost;
    const isSelected = ghost.typeId === id;
    const spr = PIXEL_ATLAS.getChickenSprite(id);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.cost = String(cost);
    btn.className = `troop-btn${isSelected ? ' selected' : ''}${!canAfford ? ' unaffordable' : ''}`;
    btn.title = `${def.name} (${def.role}) — ${cost.toLocaleString()} Corn — Hotkey [${def.hotkey}]`;
    btn.innerHTML = `
      <img class="troop-portrait" src="${spr?.portraitUrl ?? ''}" alt="" />
      <div class="troop-meta">
        <div class="troop-top">
          <span class="troop-key">[${def.hotkey}]</span>
          <span class="troop-cost"><img class="px-icon px-icon-sm" src="${cornIconUrl}" alt="" />${formatCompactCost(cost)}</span>
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
    const cost = maxed ? 0 : engine.getScaledUpgradeCost(def, lvl);
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
      <button type="button" class="upg-buy-btn" data-cost="${cost}" data-maxed="${
      maxed ? '1' : '0'
    }" ${canBuy ? '' : 'disabled'}>
        ${
          maxed
            ? 'MAX'
            : `<img class="px-icon px-icon-sm" src="${cornIconUrl}" alt="" />${formatCompactCost(cost)}`
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
    const cost = maxed ? 0 : engine.getScaledUpgradeCost(def, lvl);
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
      <button type="button" class="upg-buy-btn" data-cost="${cost}" data-maxed="${
      maxed ? '1' : '0'
    }" ${canBuy ? '' : 'disabled'}>
        ${
          maxed
            ? 'MAX'
            : `<img class="px-icon px-icon-sm" src="${cornIconUrl}" alt="" />${formatCompactCost(cost)}`
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
  const camoTag = eff.effectiveCamo ? ' | CAMO' : ' | NO CAMO';
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
    const nextTierIdx = (tower.tier + 1) as 1 | 2 | 3;
    const nextTier = def.tiers[nextTierIdx];
    const upgCost = engine.getTowerUpgradeCost(tower.typeId, nextTierIdx);
    inspNextDesc.textContent = `NEXT (${nextTier.tierName}): ${nextTier.description}`;
    btnInspUpgrade.textContent = `TIER ${tierNum + 1} (${upgCost.toLocaleString()} CORN)`;
    btnInspUpgrade.disabled = engine.corn < upgCost;
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
  const mapName = MAP_DEFS[engine.mapId].name.toUpperCase();
  const diffBadge = engine.getDifficulty().badge;
  brandSubText.textContent = `${mapName} • ${diffBadge}`;

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
  const waveMult = getCornucopiaWaveMult(engine.clickerLevels.cornucopia, engine.waveNumber);
  const effectiveBasePeck = Math.max(1, Math.round(baseClick * waveMult));
  const autoRate = getFarmhandAutoRate(engine.clickerLevels.farmhandChicks);
  clickMainLabel.textContent =
    autoRate > 0
      ? `+${effectiveBasePeck.toLocaleString()} / PECK • AUTO ${autoRate.toFixed(1)}/S`
      : `+${effectiveBasePeck.toLocaleString()} BASE CORN / CLICK`;

  if (engine.waveActive) {
    clickerCard.classList.remove('locked');
    clickStatusNote.textContent =
      autoRate > 0
        ? `WAVE ACTIVE — 12 CPS CLICK + ${autoRate.toFixed(1)}/S FARMHANDS!`
        : 'WAVE ACTIVE — CLICK UP TO 12 CPS FOR CORN!';
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

  if (!inMainMenu && engine.status === 'victory_prompt') {
    victorySummary.textContent = `You crushed the Nebula Cosmic Foxes & Solar Phoenix Foxes on ${MAP_DEFS[engine.mapId].name} (${engine.getDifficulty().badge})! Popped ${engine.totalBugsPopped.toLocaleString()} pests and harvested ${engine.totalCornClicked.toLocaleString()} Corn!`;
    victoryModal.classList.remove('hidden');
  } else {
    victoryModal.classList.add('hidden');
  }

  if (!inMainMenu && engine.status === 'gameover') {
    gameoverSummary.textContent = `The Foxes & Bugs raided ${MAP_DEFS[engine.mapId].name} (${engine.getDifficulty().badge}) on Wave ${engine.waveNumber}. Total Popped: ${engine.totalBugsPopped.toLocaleString()} | Total Corn Clicked: ${engine.totalCornClicked.toLocaleString()}.`;
    gameoverModal.classList.remove('hidden');
  } else {
    gameoverModal.classList.add('hidden');
  }
}

engine.onUiChange = refreshFullUi;

function syncLiveShopAffordability(): void {
  hudCorn.textContent = engine.corn.toLocaleString();
  troopGrid.querySelectorAll<HTMLButtonElement>('.troop-btn').forEach((btn) => {
    const cost = Number(btn.dataset.cost ?? '0');
    btn.classList.toggle('unaffordable', engine.corn < cost);
  });
  document.querySelectorAll<HTMLButtonElement>('.upg-buy-btn').forEach((btn) => {
    if (btn.dataset.maxed === '1') {
      btn.disabled = true;
    } else {
      const cost = Number(btn.dataset.cost ?? '0');
      btn.disabled = engine.corn < cost;
    }
  });
  if (selectedTowerId !== null) {
    const tower = engine.towers.find((t) => t.id === selectedTowerId);
    if (tower && tower.tier < 3) {
      const nextTierIdx = (tower.tier + 1) as 1 | 2 | 3;
      const upgCost = engine.getTowerUpgradeCost(tower.typeId, nextTierIdx);
      btnInspUpgrade.disabled = engine.corn < upgCost;
    }
  }
}

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
    syncLiveShopAffordability();
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

// Batch rapid Farmhand Chick auto-peck floaters cleanly so 20/s auto-pecks look crisp!
let pendingAutoFloatCorn = 0;
let pendingAutoFloatMega = false;
let lastAutoFloatPerfMs = 0;

engine.onAutoPeck = (res) => {
  pendingAutoFloatCorn += res.amountEarned;
  if (res.isMegaCob) pendingAutoFloatMega = true;
  const now = performance.now();
  if (now - lastAutoFloatPerfMs >= 240) {
    lastAutoFloatPerfMs = now;
    if (peckAnimTimeout === null) {
      triggerPixelHenPeckFrame();
    }
    const label = pendingAutoFloatMega
      ? `+${pendingAutoFloatCorn.toLocaleString()} AUTO COB!`
      : `+${pendingAutoFloatCorn.toLocaleString()} AUTO`;
    const color = pendingAutoFloatMega ? '#4ADE80' : '#7DD3FC';
    spawnClickFloat(label, color);
    pendingAutoFloatCorn = 0;
    pendingAutoFloatMega = false;
  }
};

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
    spawnClickFloat(`+${res.amountEarned.toLocaleString()} MEGA COB!`, '#4ADE80', e.clientX, e.clientY);
  } else if (res.isCrit && res.isTwinPeck) {
    spawnClickFloat(`+${res.amountEarned.toLocaleString()} TWIN CRIT!`, '#F472B6', e.clientX, e.clientY);
  } else if (res.isCrit) {
    spawnClickFloat(`+${res.amountEarned.toLocaleString()} CRIT!`, '#FEF08A', e.clientX, e.clientY);
  } else if (res.isTwinPeck) {
    spawnClickFloat(`+${res.amountEarned.toLocaleString()} TWIN!`, '#38BDF8', e.clientX, e.clientY);
  } else {
    spawnClickFloat(`+${res.amountEarned.toLocaleString()} CORN`, '#FFFFFF', e.clientX, e.clientY);
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
      if (!e.shiftKey || engine.corn < engine.getTowerBaseCost(ghost.typeId)) {
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
btnMenuRules.addEventListener('click', () => rulesModal.classList.remove('hidden'));
btnCloseRules.addEventListener('click', () => rulesModal.classList.add('hidden'));
rulesModal.addEventListener('click', (e) => {
  if (e.target === rulesModal) rulesModal.classList.add('hidden');
});

btnMenu.addEventListener('click', () => {
  btnMenu.blur();
  openMainMenu();
});
btnMenuStart.addEventListener('click', () => launchSelectedRun());
btnMenuResume.addEventListener('click', () => resumeActiveRun());

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

btnMenuVictory.addEventListener('click', () => openMainMenu());

btnRestartGameover.addEventListener('click', () => {
  selectedTowerId = null;
  setPlacementType(null);
  engine.resetGame();
});

btnMenuGameover.addEventListener('click', () => openMainMenu());

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
    } else if (inMainMenu) {
      resumeActiveRun();
    } else if (ghost.typeId) {
      setPlacementType(null);
    } else if (selectedTowerId !== null) {
      selectedTowerId = null;
      renderInspector();
    }
    return;
  }

  if (inMainMenu) return;

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

// Initial UI & Main Menu population
renderMainMenu();
refreshFullUi();

let lastPerfMs = performance.now();
function loop(nowMs: number): void {
  requestAnimationFrame(loop);
  try {
    const dt = Math.max(0.001, Math.min(0.08, (nowMs - lastPerfMs) / 1000));
    lastPerfMs = nowMs;

    if (!inMainMenu) {
      engine.tick(dt);
      updateLiveClickerMeters();
    }
    renderer.render(canvas, engine, selectedTowerId, ghost, nowMs / 1000);
  } catch (err) {
    console.error('ChickenTD tick error:', err);
  }
}
requestAnimationFrame(loop);
