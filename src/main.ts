import './style.css';
import {
  CAMPAIGN_WAVES,
  CANNON_DEFS,
  CANNON_ORDER,
  CHICKEN_DEFS,
  CHICKEN_ORDER,
  CLICKER_UPGRADES,
  DIFFICULTY_DEFS,
  DIFFICULTY_ORDER,
  ENEMY_DEFS,
  GEM_EGG_CHICKEN_IDS,
  getBaseCornPerClick,
  getCornucopiaWaveMult,
  getFarmhandAutoRate,
  getWaveDefinition,
  MAX_CPS_CAP,
  STARTER_CHICKEN_IDS,
  TD_UPGRADES,
} from './data';
import { ChickenTdEngine } from './engine';
import {
  IDLE_CANVAS_H,
  IDLE_CANVAS_W,
  IDLE_KILLS_PER_SEC,
  IdlePastureSimulation,
} from './idle';
import { MAP_DEFS, MAP_HEIGHT, MAP_ORDER, MAP_WIDTH } from './map';
import { BUGS_PER_EGG, GEM_EGG_COST_EACH, MUTATION_DEFS, PROGRESSION } from './progression';
import {
  bakeMapPreviewDataUrl,
  GhostPlacementState,
  MeadowRenderer,
  PIXEL_CANVAS_H,
  PIXEL_CANVAS_W,
} from './renderer';
import { PIXEL_ATLAS } from './sprites';
import { CannonTypeId, ChickenTypeId, DifficultyId, EggRollOutcome, MapId } from './types';

// Main Menu Elements
const mainMenuScreen = document.getElementById('main-menu-screen') as HTMLDivElement;
const menuHeroChicken = document.getElementById('menu-hero-chicken') as HTMLImageElement;
const menuMapGrid = document.getElementById('menu-map-grid') as HTMLDivElement;
const menuDiffGrid = document.getElementById('menu-diff-grid') as HTMLDivElement;
const menuCannonGrid = document.getElementById('menu-cannon-grid') as HTMLDivElement;
const menuMapSummary = document.getElementById('menu-map-summary') as HTMLElement;
const menuDiffSummary = document.getElementById('menu-diff-summary') as HTMLElement;
const menuCannonSummary = document.getElementById('menu-cannon-summary') as HTMLElement;
const menuEggsCount = document.getElementById('menu-eggs-count') as HTMLElement;
const menuEggsSub = document.getElementById('menu-eggs-sub') as HTMLElement;
const menuCollectionSub = document.getElementById('menu-collection-sub') as HTMLElement;
const btnOpenGemShop = document.getElementById('btn-open-gem-shop') as HTMLButtonElement;
const btnMenuGemShopCta = document.getElementById('btn-menu-gem-shop-cta') as HTMLButtonElement;
const btnMenuStart = document.getElementById('btn-menu-start') as HTMLButtonElement;
const btnMenuResume = document.getElementById('btn-menu-resume') as HTMLButtonElement;
const btnMenuEndRun = document.getElementById('btn-menu-end-run') as HTMLButtonElement;
const btnMenuIdle = document.getElementById('btn-menu-idle') as HTMLButtonElement;
const btnMenuApp = document.getElementById('btn-menu-app') as HTMLButtonElement;
const lblMenuApp = document.getElementById('lbl-menu-app') as HTMLElement;
const btnMenuRules = document.getElementById('btn-menu-rules') as HTMLButtonElement;

// Gem Egg Capsule Shop Elements
const gemShopScreen = document.getElementById('gem-shop-screen') as HTMLDivElement;
const btnCloseGemShop = document.getElementById('btn-close-gem-shop') as HTMLButtonElement;
const btnShopIdle = document.getElementById('btn-shop-idle') as HTMLButtonElement;
const shopEggsCount = document.getElementById('shop-eggs-count') as HTMLElement;
const shopBugProgress = document.getElementById('shop-bug-progress') as HTMLElement;
const shopShowcaseEgg = document.getElementById('shop-showcase-egg') as HTMLImageElement;
const btnBuyEgg1 = document.getElementById('btn-buy-egg-1') as HTMLButtonElement;
const btnBuyEgg4 = document.getElementById('btn-buy-egg-4') as HTMLButtonElement;
const btnBuyEgg8 = document.getElementById('btn-buy-egg-8') as HTMLButtonElement;
const shopCannonHeading = document.getElementById('shop-cannon-heading') as HTMLElement;
const shopCannonGrid = document.getElementById('shop-cannon-grid') as HTMLDivElement;
const collectionHeading = document.getElementById('collection-heading') as HTMLElement;
const collectionGrid = document.getElementById('collection-grid') as HTMLDivElement;

// Gem Egg Cutscene Elements
const eggCutsceneModal = document.getElementById('egg-cutscene-modal') as HTMLDivElement;
const cutsceneFlash = document.getElementById('cutscene-flash') as HTMLDivElement;
const cutsceneTitle = document.getElementById('cutscene-title') as HTMLElement;
const cutsceneSubtitle = document.getElementById('cutscene-subtitle') as HTMLElement;
const cutsceneStage = document.getElementById('cutscene-stage') as HTMLDivElement;
const btnCutsceneSkip = document.getElementById('btn-cutscene-skip') as HTMLButtonElement;
const cutsceneDoneActions = document.getElementById('cutscene-done-actions') as HTMLDivElement;
const btnCutsceneAgain1 = document.getElementById('btn-cutscene-again-1') as HTMLButtonElement;
const btnCutsceneAgain4 = document.getElementById('btn-cutscene-again-4') as HTMLButtonElement;
const btnCutsceneAgain8 = document.getElementById('btn-cutscene-again-8') as HTMLButtonElement;
const btnCutsceneDone = document.getElementById('btn-cutscene-done') as HTMLButtonElement;

// HUD & Stage Elements
const stagePanel = document.getElementById('stage-panel') as HTMLElement;
const canvasFrame = document.getElementById('canvas-frame') as HTMLDivElement;
const canvas = document.getElementById('td-canvas') as HTMLCanvasElement;
const brandSubText = document.getElementById('brand-sub-text') as HTMLElement;
const hudCorn = document.getElementById('hud-corn') as HTMLElement;
const hudEggs = document.getElementById('hud-eggs') as HTMLElement;
const hudWave = document.getElementById('hud-wave') as HTMLElement;
const hudPops = document.getElementById('hud-pops') as HTMLElement;
const hudBattleEggs = document.getElementById('hud-battle-eggs') as HTMLElement;

const btnSpeed = document.getElementById('btn-speed') as HTMLButtonElement;
const lblSpeed = document.getElementById('lbl-speed') as HTMLElement;
const btnMute = document.getElementById('btn-mute') as HTMLButtonElement;
const iconBtnSound = document.getElementById('icon-btn-sound') as HTMLImageElement;
const btnHudIdle = document.getElementById('btn-hud-idle') as HTMLButtonElement;
const btnRules = document.getElementById('btn-rules') as HTMLButtonElement;
const btnMenu = document.getElementById('btn-menu') as HTMLButtonElement;

// Idle Mode Screen Elements
const idleModeScreen = document.getElementById('idle-mode-screen') as HTMLDivElement;
const idleCanvas = document.getElementById('idle-canvas') as HTMLCanvasElement;
const idleStatTime = document.getElementById('idle-stat-time') as HTMLElement;
const idleStatKills = document.getElementById('idle-stat-kills') as HTMLElement;
const idleStatEarned = document.getElementById('idle-stat-earned') as HTMLElement;
const idleStatBank = document.getElementById('idle-stat-bank') as HTMLElement;
const idleProgressText = document.getElementById('idle-progress-text') as HTMLElement;
const idleProgressFill = document.getElementById('idle-progress-fill') as HTMLDivElement;
const idleEtaText = document.getElementById('idle-eta-text') as HTMLElement;
const lblIdleOpenEggs = document.getElementById('lbl-idle-open-eggs') as HTMLElement;
const btnIdleOpenEggs = document.getElementById('btn-idle-open-eggs') as HTMLButtonElement;
const btnIdleExit = document.getElementById('btn-idle-exit') as HTMLButtonElement;

const bannerTitle = document.getElementById('banner-title') as HTMLElement;
const bannerDesc = document.getElementById('banner-desc') as HTMLElement;
const placementBanner = document.getElementById('placement-banner') as HTMLDivElement;
const placementText = document.getElementById('placement-text') as HTMLElement;
const btnCancelPlace = document.getElementById('btn-cancel-place') as HTMLButtonElement;

const stageCannonCluster = document.getElementById('stage-cannon-cluster') as HTMLDivElement;
const btnCannonLoadout = document.getElementById('btn-cannon-loadout') as HTMLButtonElement;
const btnCluckCannon = document.getElementById('btn-cluck-cannon') as HTMLButtonElement;
const iconCluckCannon = document.getElementById('icon-cluck-cannon') as HTMLImageElement;
const lblCannonState = document.getElementById('lbl-cannon-state') as HTMLElement;
const cannonBarFill = document.getElementById('cannon-bar-fill') as HTMLDivElement;

// Inspector Elements
const inspectorCard = document.getElementById('inspector-card') as HTMLDivElement;
const inspPortrait = document.getElementById('insp-portrait') as HTMLImageElement;
const inspName = document.getElementById('insp-name') as HTMLElement;
const inspTierBadge = document.getElementById('insp-tier-badge') as HTMLElement;
const inspMutBadge = document.getElementById('insp-mut-badge') as HTMLElement;
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
const lblTabTroops = document.getElementById('lbl-tab-troops') as HTMLElement;
const lblTabCannon = document.getElementById('lbl-tab-cannon') as HTMLElement;
const troopGrid = document.getElementById('troop-grid') as HTMLDivElement;
const clickerUpgList = document.getElementById('clicker-upg-list') as HTMLDivElement;
const tdUpgList = document.getElementById('td-upg-list') as HTMLDivElement;
const sidebarCannonList = document.getElementById('sidebar-cannon-list') as HTMLDivElement;
const btnStartWave = document.getElementById('btn-start-wave') as HTMLButtonElement;

// Modals & Defeat Endscreen Elements
const rulesModal = document.getElementById('rules-modal') as HTMLDivElement;
const btnCloseRules = document.getElementById('btn-close-rules') as HTMLButtonElement;

const victoryModal = document.getElementById('victory-modal') as HTMLDivElement;
const victorySummary = document.getElementById('victory-summary') as HTMLElement;
const victoryEggsEarned = document.getElementById('victory-eggs-earned') as HTMLElement;
const victoryEggsTotal = document.getElementById('victory-eggs-total') as HTMLElement;
const btnContinueFreeplay = document.getElementById('btn-continue-freeplay') as HTMLButtonElement;
const btnShopVictory = document.getElementById('btn-shop-victory') as HTMLButtonElement;
const btnMenuVictory = document.getElementById('btn-menu-victory') as HTMLButtonElement;

const gameoverModal = document.getElementById('gameover-modal') as HTMLDivElement;
const defeatStageTag = document.getElementById('defeat-stage-tag') as HTMLElement;
const gameoverSummary = document.getElementById('gameover-summary') as HTMLElement;
const defeatBossLabel = document.getElementById('defeat-boss-label') as HTMLElement;
const defeatBossPct = document.getElementById('defeat-boss-pct') as HTMLElement;
const defeatBossFill = document.getElementById('defeat-boss-fill') as HTMLDivElement;
const defeatEggsEarned = document.getElementById('defeat-eggs-earned') as HTMLElement;
const defeatEggsBank = document.getElementById('defeat-eggs-bank') as HTMLElement;
const defeatRemainderText = document.getElementById('defeat-remainder-text') as HTMLElement;
const defeatRemainderFill = document.getElementById('defeat-remainder-fill') as HTMLDivElement;
const defeatStatWave = document.getElementById('defeat-stat-wave') as HTMLElement;
const defeatStatBugs = document.getElementById('defeat-stat-bugs') as HTMLElement;
const defeatStatCorn = document.getElementById('defeat-stat-corn') as HTMLElement;
const defeatMvpImg = document.getElementById('defeat-mvp-img') as HTMLImageElement;
const defeatStatMvp = document.getElementById('defeat-stat-mvp') as HTMLElement;
const lblDefeatShopBtn = document.getElementById('lbl-defeat-shop-btn') as HTMLElement;
const btnRestartGameover = document.getElementById('btn-restart-gameover') as HTMLButtonElement;
const btnShopGameover = document.getElementById('btn-shop-gameover') as HTMLButtonElement;
const btnMenuGameover = document.getElementById('btn-menu-gameover') as HTMLButtonElement;

// Secret Promo Code Vault Elements (only accessible by tapping Omnicluck Prime 4x on Main Menu!)
const secretCodeModal = document.getElementById('secret-code-modal') as HTMLDivElement;
const secretCodeInput = document.getElementById('secret-code-input') as HTMLInputElement;
const secretCodeFeedback = document.getElementById('secret-code-feedback') as HTMLElement;
const btnRedeemCode = document.getElementById('btn-redeem-code') as HTMLButtonElement;
const btnCloseCodeModal = document.getElementById('btn-close-code-modal') as HTMLButtonElement;

// Standalone App Install / Portable Offline Download Modal Elements
const appInstallModal = document.getElementById('app-install-modal') as HTMLDivElement;
const appPwaDesc = document.getElementById('app-pwa-desc') as HTMLElement;
const btnPwaInstallNow = document.getElementById('btn-pwa-install-now') as HTMLButtonElement;
const appPwaManualSteps = document.getElementById('app-pwa-manual-steps') as HTMLDivElement;
const btnDownloadPortable = document.getElementById('btn-download-portable') as HTMLButtonElement;
const lblDownloadPortable = document.getElementById('lbl-download-portable') as HTMLElement;
const btnCloseAppModal = document.getElementById('btn-close-app-modal') as HTMLButtonElement;

function setText(el: HTMLElement, next: string): void {
  if (el.textContent !== next) {
    el.textContent = next;
  }
}

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
  setImg('icon-hud-battle-egg', PIXEL_ATLAS.getIconUrl('gem_egg'));
  const bantamIconUrl =
    PIXEL_ATLAS.getChickenSprite('bantam')?.portraitUrl ?? PIXEL_ATLAS.getIconUrl('idle_chick');
  setImg('icon-btn-speed', PIXEL_ATLAS.getIconUrl('speed'));
  setImg('icon-btn-sound', PIXEL_ATLAS.getIconUrl('sound_on'));
  setImg('icon-btn-idle', bantamIconUrl);
  setImg('icon-btn-rules', PIXEL_ATLAS.getIconUrl('rules'));
  setImg('icon-btn-menu', PIXEL_ATLAS.getIconUrl('menu'));
  setImg('icon-menu-idle', bantamIconUrl);
  setImg('icon-shop-idle', bantamIconUrl);
  setImg('icon-idle-title-chick', bantamIconUrl);
  setImg('icon-idle-gem-egg', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-menu-app', PIXEL_ATLAS.getIconUrl('download_app'));
  setImg('icon-app-modal', PIXEL_ATLAS.getIconUrl('download_app'));
  setImg('icon-btn-portable', PIXEL_ATLAS.getIconUrl('download_app'));
  setImg('icon-clicker-corn', PIXEL_ATLAS.getIconUrl('corn'));
  setImg('icon-tab-troops', PIXEL_ATLAS.getIconUrl('chicken'));
  setImg('icon-tab-clicker', PIXEL_ATLAS.getIconUrl('corn'));
  setImg('icon-tab-td', PIXEL_ATLAS.getIconUrl('shield'));
  setImg('icon-tab-cannon', PIXEL_ATLAS.getIconUrl('cannon'));
  setImg('icon-shop-cannon-armory', PIXEL_ATLAS.getIconUrl('cannon'));
  setImg('icon-rules-chicken', PIXEL_ATLAS.getIconUrl('chicken'));
  setImg('icon-victory-trophy', PIXEL_ATLAS.getIconUrl('trophy'));
  setImg('icon-victory-battle-egg', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-gameover-skull', PIXEL_ATLAS.getIconUrl('skull_defeat'));
  setImg('icon-defeat-battle-egg', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-defeat-gem-shop', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-cluck-cannon', PIXEL_ATLAS.getIconUrl('cannon'));
  setImg('icon-secret-gem', PIXEL_ATLAS.getIconUrl('gem_egg'));

  setImg('icon-menu-battle-egg', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-menu-gem-egg', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-cta-gem-egg', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-shop-title-gem', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-shop-egg', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-shop-bug', PIXEL_ATLAS.getIconUrl('bug'));
  setImg('icon-buy-gem-1', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-buy-gem-4', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-buy-gem-8', PIXEL_ATLAS.getIconUrl('gem_egg'));
  setImg('icon-collection-star', PIXEL_ATLAS.getIconUrl('mutation_star'));

  // Omnicluck Prime presides over the Main Menu hero header (tap 4x to open secret codes!)
  const omnicluckPortraitUrl = PIXEL_ATLAS.getChickenSprite('omega_god')?.portraitUrl ?? '';
  setImg('menu-hero-chicken', omnicluckPortraitUrl);
  setImg('icon-secret-omni', omnicluckPortraitUrl);
  shopShowcaseEgg.src = PIXEL_ATLAS.gemEggStageUrls[0];
  henSceneImg.src = PIXEL_ATLAS.henhouseIdleUrl;
}

initStaticPixelIcons();

const engine = new ChickenTdEngine();
canvas.width = PIXEL_CANVAS_W;
canvas.height = PIXEL_CANVAS_H;
const renderer = new MeadowRenderer(canvas);

idleCanvas.width = IDLE_CANVAS_W;
idleCanvas.height = IDLE_CANVAS_H;
const idleSim = new IdlePastureSimulation();

let selectedTowerId: number | null = null;
let peckAnimTimeout: number | null = null;
let inMainMenu = true;
let inGemShop = false;
let inCutscene = false;
let inIdleMode = false;
let idleReturnDestination: 'menu' | 'shop' | 'game' = 'menu';
let hasStartedRun = false;
let pendingMapId: MapId = 'sunny_meadow';
let pendingDifficultyId: DifficultyId = 'normal';
let activeCollectionFilter: 'all' | 'gacha' | 'starter' | 'support' | 'mutated' = 'all';

const MAP_THUMB_URLS = new Map<MapId, string>();
for (const mId of MAP_ORDER) {
  MAP_THUMB_URLS.set(mId, bakeMapPreviewDataUrl(mId));
}

function formatCompactCost(n: number): string {
  if (n >= 1000000000) {
    const b = n / 1000000000;
    return b >= 100 ? `${Math.round(b)}B` : `${b.toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (n >= 1000000) {
    const m = n / 1000000;
    return m >= 100 ? `${Math.round(m)}M` : `${m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 100000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString();
}

const gemEggIconUrl = PIXEL_ATLAS.getIconUrl('gem_egg');

function handleCannonSelectOrBuy(cId: CannonTypeId): void {
  if (PROGRESSION.isCannonUnlocked(cId)) {
    if (PROGRESSION.getEquippedCannon() !== cId) {
      engine.equipCannonLoadout(cId);
      engine.audio.playUpgrade();
    } else {
      engine.audio.playUpgrade();
    }
  } else {
    if (PROGRESSION.buyCannon(cId)) {
      engine.audio.playEggReveal('epic');
      engine.equipCannonLoadout(cId);
    } else {
      engine.audio.playBlockedClick();
      return;
    }
  }
  renderMainMenu();
  renderGemEggShop();
  refreshFullUi();
  updateLiveClickerMeters();
}

// ==================== MAIN MENU & GEM EGG CAPSULE SHOP ====================
function renderMainMenu(): void {
  const selMap = MAP_DEFS[pendingMapId];
  const selDiff = DIFFICULTY_DEFS[pendingDifficultyId];
  const eqCannon = CANNON_DEFS[PROGRESSION.getEquippedCannon()];
  const unlockedCannonCount = PROGRESSION.getUnlockedCannonCount();
  menuMapSummary.textContent = `${selMap.name.toUpperCase()} • ${selMap.badge}`;
  menuDiffSummary.textContent = `${selDiff.name.toUpperCase()} (${selDiff.badge})`;
  menuCannonSummary.textContent = `${eqCannon.name.toUpperCase()} • ${unlockedCannonCount} / ${CANNON_ORDER.length} UNLOCKED`;
  btnMenuStart.textContent = `>> START BATTLE — ${selMap.name.toUpperCase()} [${selDiff.badge}]`;

  const savedEggs = PROGRESSION.getEggs();
  const rem = PROGRESSION.getBugKillRemainder();
  const unlockedCount = PROGRESSION.getUnlockedCount();

  menuEggsCount.textContent = `${savedEggs.toLocaleString()} ${
    savedEggs === 1 ? 'GEM EGG' : 'GEM EGGS'
  }`;
  menuEggsSub.textContent = `${rem.toLocaleString()} / ${BUGS_PER_EGG.toLocaleString()} KILLS TO NEXT`;
  menuCollectionSub.textContent = `${unlockedCount}/${CHICKEN_ORDER.length} UNITS • ${unlockedCannonCount}/${CANNON_ORDER.length} CANNONS`;
  btnOpenGemShop.classList.toggle('has-eggs', savedEggs >= GEM_EGG_COST_EACH);

  const canResume = hasStartedRun && engine.status !== 'gameover';
  if (canResume) {
    btnMenuResume.textContent = `RESUME (WAVE ${engine.waveNumber})`;
    btnMenuResume.classList.remove('hidden');
    btnMenuEndRun.classList.remove('hidden');
  } else {
    btnMenuResume.classList.add('hidden');
    btnMenuEndRun.classList.add('hidden');
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

  menuCannonGrid.innerHTML = '';
  const equippedCannonId = PROGRESSION.getEquippedCannon();
  for (const cId of CANNON_ORDER) {
    const cDef = CANNON_DEFS[cId];
    const unlocked = PROGRESSION.isCannonUnlocked(cId);
    const isEquipped = unlocked && cId === equippedCannonId;
    const canAfford = !unlocked && savedEggs >= cDef.gemEggCost;
    const iconUrl = PIXEL_ATLAS.getIconUrl(cDef.iconId);

    const card = document.createElement('button');
    card.type = 'button';
    card.className = `cannon-card-btn${isEquipped ? ' equipped' : ''}${
      !unlocked ? ' locked-cannon' : ''
    }${canAfford ? ' affordable-cannon' : ''}`;
    card.title = unlocked
      ? `${cDef.name} (${cDef.chargeSec}s charge) — Click to equip!`
      : `Buy ${cDef.name} for ${cDef.gemEggCost} Gem Eggs! (${cDef.description})`;

    const statusHtml = isEquipped
      ? `<span class="cannon-status-pill" style="color:#facc15">EQUIPPED</span>`
      : unlocked
      ? `<span class="cannon-status-pill" style="color:#4ade80">EQUIP</span>`
      : `<span class="cannon-status-pill" style="color:${canAfford ? '#f472b6' : '#94a3b8'}"><img class="px-icon px-icon-sm" src="${gemEggIconUrl}" alt="" />${cDef.gemEggCost}</span>`;

    card.innerHTML = `
      <div class="cannon-card-top">
        <div class="cannon-card-title-row">
          <img class="px-icon px-icon-sm" src="${iconUrl}" alt="" />
          <span class="cannon-card-name">${cDef.shortLabel}</span>
        </div>
        ${statusHtml}
      </div>
      <div class="cannon-card-badge" style="color:${cDef.accentColor}">${cDef.badgeText} • ${cDef.chargeSec}S</div>
      <div class="cannon-card-desc">${cDef.description}</div>
    `;
    card.addEventListener('click', () => handleCannonSelectOrBuy(cId));
    menuCannonGrid.appendChild(card);
  }
}

function renderGemEggShop(): void {
  const savedEggs = PROGRESSION.getEggs();
  const rem = PROGRESSION.getBugKillRemainder();
  const unlockedCount = PROGRESSION.getUnlockedCount();
  const unlockedCannonCount = PROGRESSION.getUnlockedCannonCount();
  const equippedCannonId = PROGRESSION.getEquippedCannon();

  shopEggsCount.textContent = savedEggs.toLocaleString();
  shopBugProgress.textContent = `${rem.toLocaleString()} / ${BUGS_PER_EGG.toLocaleString()}`;
  shopCannonHeading.textContent = `CLUCK CANNON ARMORY (${unlockedCannonCount} / ${CANNON_ORDER.length} UNLOCKED)`;
  collectionHeading.textContent = `CHICKEN ROSTER & MUTATIONS (${unlockedCount} / ${CHICKEN_ORDER.length} UNLOCKED)`;

  btnBuyEgg1.disabled = savedEggs < 1;
  btnBuyEgg4.disabled = savedEggs < 4;
  btnBuyEgg8.disabled = savedEggs < 8;

  shopCannonGrid.innerHTML = '';
  for (const cId of CANNON_ORDER) {
    const cDef = CANNON_DEFS[cId];
    const unlocked = PROGRESSION.isCannonUnlocked(cId);
    const isEquipped = unlocked && cId === equippedCannonId;
    const canAfford = !unlocked && savedEggs >= cDef.gemEggCost;
    const iconUrl = PIXEL_ATLAS.getIconUrl(cDef.iconId);

    const card = document.createElement('div');
    card.className = `shop-cannon-card${isEquipped ? ' equipped' : ''}`;
    const btnClass = isEquipped
      ? 'shop-cannon-action-btn is-equipped'
      : unlocked
      ? 'shop-cannon-action-btn equip-ready'
      : 'shop-cannon-action-btn buy-gem';
    const btnDisabled = !unlocked && !canAfford;
    const btnHtml = isEquipped
      ? 'EQUIPPED'
      : unlocked
      ? 'EQUIP CANNON'
      : `<img class="px-icon px-icon-sm" src="${gemEggIconUrl}" alt="" />BUY (${cDef.gemEggCost} GEM ${
          cDef.gemEggCost === 1 ? 'EGG' : 'EGGS'
        })`;

    card.innerHTML = `
      <div>
        <div class="cannon-card-top">
          <div class="cannon-card-title-row">
            <img class="px-icon px-icon-sm" src="${iconUrl}" alt="" />
            <span class="cannon-card-name">${cDef.name}</span>
          </div>
        </div>
        <div class="cannon-card-badge" style="color:${cDef.accentColor}; margin-top:4px">${cDef.badgeText} • ${cDef.chargeSec}S</div>
        <div class="cannon-card-desc" style="margin-top:4px">${cDef.description}</div>
      </div>
      <button type="button" class="${btnClass}" ${btnDisabled ? 'disabled' : ''}>${btnHtml}</button>
    `;
    card.querySelector('button')!.addEventListener('click', () => handleCannonSelectOrBuy(cId));
    shopCannonGrid.appendChild(card);
  }

  let filteredIds: readonly ChickenTypeId[] = CHICKEN_ORDER;
  if (activeCollectionFilter === 'gacha') {
    filteredIds = GEM_EGG_CHICKEN_IDS;
  } else if (activeCollectionFilter === 'starter') {
    filteredIds = STARTER_CHICKEN_IDS;
  } else if (activeCollectionFilter === 'support') {
    filteredIds = CHICKEN_ORDER.filter((id) => CHICKEN_DEFS[id].isSupport);
  } else if (activeCollectionFilter === 'mutated') {
    filteredIds = CHICKEN_ORDER.filter((id) => PROGRESSION.getMutation(id) !== null);
  }

  collectionGrid.innerHTML = '';
  if (filteredIds.length === 0) {
    const empty = document.createElement('div');
    empty.style.gridColumn = '1 / -1';
    empty.style.padding = '18px';
    empty.style.textAlign = 'center';
    empty.style.color = '#94a3b8';
    empty.style.fontSize = '11px';
    empty.textContent = 'No mutated units yet — hatch duplicate units from Gem Eggs to awaken Mutations!';
    collectionGrid.appendChild(empty);
    return;
  }

  for (const id of filteredIds) {
    const def = CHICKEN_DEFS[id];
    const unlocked = PROGRESSION.isUnlocked(id);
    const mut = PROGRESSION.getMutation(id);
    const plusLv = PROGRESSION.getPlusLevel(id);
    const spr = PIXEL_ATLAS.getChickenSprite(id);
    const isStarter = STARTER_CHICKEN_IDS.includes(id);

    const card = document.createElement('div');
    card.className = `coll-card${!unlocked ? ' locked' : ''}${mut ? ` mut-${mut}` : ''}`;

    if (!unlocked) {
      card.title = `Locked Gem Egg Unit! Base Cost: ${def.baseCost.toLocaleString()} Corn — Hatch Gem Eggs to unlock!`;
      card.innerHTML = `
        <img class="coll-portrait" src="${spr?.lockedPortraitUrl ?? ''}" alt="" />
        <div class="coll-meta">
          <div class="coll-name-row">
            <span class="coll-name">??? [LOCKED]</span>
          </div>
          <span class="coll-role">${def.role}</span>
          <div class="coll-bottom-row">
            <span class="coll-cost">${formatCompactCost(def.baseCost)} CORN</span>
            <span class="mut-badge" style="color:#f472b6">GEM EGG</span>
          </div>
        </div>
      `;
    } else {
      const mutDef = mut ? MUTATION_DEFS[mut] : null;
      card.title = mutDef
        ? `${def.name}${plusLv > 0 ? ` +${plusLv}` : ''} — ${mutDef.name.toUpperCase()} MUTATION (${mutDef.summary})`
        : `${def.name} (${def.role}) — ${isStarter ? 'Starter Unit' : 'Gem Egg Unit'}`;
      card.innerHTML = `
        <img class="coll-portrait" src="${spr?.portraitUrl ?? ''}" alt="" />
        <div class="coll-meta">
          <div class="coll-name-row">
            <span class="coll-name">${def.name}</span>
            ${plusLv > 0 ? `<span class="coll-plus">+${plusLv}</span>` : ''}
          </div>
          <span class="coll-role">${def.role}</span>
          <div class="coll-bottom-row">
            <span class="coll-cost">${formatCompactCost(def.baseCost)} CORN</span>
            ${
              mutDef
                ? `<span class="mut-badge ${mut}">${mutDef.name}</span>`
                : `<span class="mut-badge" style="color:#64748b">${isStarter ? 'STARTER' : 'OWNED'}</span>`
            }
          </div>
        </div>
      `;
    }
    collectionGrid.appendChild(card);
  }
}

function persistFullGameState(): void {
  PROGRESSION.savePrefs({
    pendingMapId,
    pendingDifficultyId,
    isMuted: engine.audio.getMuted(),
    inIdleMode,
    lastIdleSyncMs: inIdleMode ? idleSim.getLastWallMs() : undefined,
  });
  if (hasStartedRun && engine.status !== 'gameover') {
    const snap = engine.serializeRun(inMainMenu);
    if (snap) {
      PROGRESSION.saveActiveRun(snap);
    }
  }
}

function flushAllSavesBeforeExit(): void {
  if (inIdleMode) {
    idleSim.syncWallClock(Date.now());
  }
  if (hasStartedRun && engine.status !== 'gameover' && engine.totalBugsPopped > engine.bugsBankedThisRun) {
    engine.bankPendingRunBugs();
  }
  PROGRESSION.save();
  persistFullGameState();
}

function formatIdleDuration(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const rem = sec % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

function renderIdleModeUi(): void {
  const savedEggs = PROGRESSION.getEggs();
  const rem = PROGRESSION.getBugKillRemainder();
  const pct = Math.min(100, (rem / BUGS_PER_EGG) * 100);
  const killsLeft = Math.max(1, BUGS_PER_EGG - rem);
  const secLeft = Math.ceil(killsLeft / IDLE_KILLS_PER_SEC);
  const etaMins = Math.floor(secLeft / 60);
  const etaSecs = secLeft % 60;

  idleStatTime.textContent = formatIdleDuration(idleSim.sessionElapsedSec);
  idleStatKills.textContent = idleSim.sessionKills.toLocaleString();
  idleStatEarned.textContent = `+${idleSim.sessionGemEggsEarned.toLocaleString()}`;
  idleStatBank.textContent = savedEggs.toLocaleString();
  idleProgressText.textContent = `${rem.toLocaleString()} / ${BUGS_PER_EGG.toLocaleString()} KILLS`;
  idleProgressFill.style.width = `${pct.toFixed(1)}%`;
  idleEtaText.textContent = `~${etaMins}M ${String(etaSecs).padStart(2, '0')}S TO NEXT EGG`;
  lblIdleOpenEggs.textContent =
    savedEggs > 0 ? `OPEN GEM EGGS (${savedEggs} READY)` : 'OPEN GEM EGGS';
}

function openIdleMode(resumeFromWallMs?: number): void {
  if (inCutscene) return;
  if (!inIdleMode) {
    if (inGemShop) idleReturnDestination = 'shop';
    else if (inMainMenu) idleReturnDestination = 'menu';
    else idleReturnDestination = 'game';
  }

  // Bank any unbanked active-run kills first so progress meter is 100% accurate
  if (hasStartedRun && engine.status !== 'gameover' && engine.totalBugsPopped > engine.bugsBankedThisRun) {
    engine.bankPendingRunBugs();
  }

  inIdleMode = true;
  rulesModal.classList.add('hidden');
  secretCodeModal.classList.add('hidden');
  idleModeScreen.classList.remove('hidden');
  idleSim.start(Date.now(), resumeFromWallMs);
  renderIdleModeUi();
  persistFullGameState();
}

function closeIdleMode(goToGemShop = false): void {
  if (!inIdleMode) return;
  idleSim.stop(Date.now());
  inIdleMode = false;
  idleModeScreen.classList.add('hidden');
  persistFullGameState();

  if (goToGemShop || idleReturnDestination === 'shop') {
    openGemEggShop();
  } else if (idleReturnDestination === 'game' && hasStartedRun && engine.status !== 'gameover') {
    resumeActiveRun();
  } else {
    openMainMenu();
  }
}

idleSim.onStatsUpdated = () => {
  if (!inIdleMode) return;
  renderIdleModeUi();
  persistFullGameState();
};

idleSim.onEggEarned = () => {
  engine.audio.playUpgrade();
  refreshFullUi();
};

function openMainMenu(): void {
  inMainMenu = true;
  inGemShop = false;
  pendingMapId = engine.mapId;
  pendingDifficultyId = engine.difficultyId;
  victoryModal.classList.add('hidden');
  gameoverModal.classList.add('hidden');
  gemShopScreen.classList.add('hidden');
  persistFullGameState();
  renderMainMenu();
  mainMenuScreen.classList.remove('hidden');
}

function openGemEggShop(): void {
  inMainMenu = true;
  inGemShop = true;
  victoryModal.classList.add('hidden');
  gameoverModal.classList.add('hidden');
  secretCodeModal.classList.add('hidden');
  mainMenuScreen.classList.add('hidden');
  persistFullGameState();
  renderGemEggShop();
  gemShopScreen.classList.remove('hidden');
}

function closeGemEggShop(): void {
  inGemShop = false;
  gemShopScreen.classList.add('hidden');
  renderMainMenu();
  mainMenuScreen.classList.remove('hidden');
}

// ==================== GEM EGG BREAKING CUTSCENE (1X / 4X / 8X) ====================
let cutsceneTimers: number[] = [];
let activeCutsceneOutcomes: EggRollOutcome[] = [];
let activeCutsceneSlots: HTMLDivElement[] = [];
let cutsceneFinished = false;

function clearCutsceneTimers(): void {
  for (const id of cutsceneTimers) {
    window.clearTimeout(id);
  }
  cutsceneTimers = [];
}

function triggerCutsceneFlash(): void {
  cutsceneFlash.classList.add('active');
  const t = window.setTimeout(() => {
    cutsceneFlash.classList.remove('active');
  }, 150);
  cutsceneTimers.push(t);
}

function renderRevealedSlotHtml(
  slot: HTMLDivElement,
  outcome: EggRollOutcome,
  isSingleHero: boolean
): void {
  slot.classList.remove('wobbling', 'cracking');
  const def = CHICKEN_DEFS[outcome.unitId];
  const spr = PIXEL_ATLAS.getChickenSprite(outcome.unitId);

  if (outcome.isNewUnit) {
    slot.classList.add('revealed-new');
    slot.innerHTML = `
      <span class="reveal-kicker-pill" style="color:#facc15; background:#3a290c">NEW UNIT UNLOCKED!</span>
      <img class="reveal-unit-img" src="${spr?.portraitUrl ?? ''}" alt="" />
      <div class="reveal-unit-name">${def.name}</div>
      <div class="reveal-unit-role">${def.role} &bull; ${formatCompactCost(def.baseCost)} CORN</div>
      <div class="reveal-mut-summary">${
        isSingleHero ? def.tiers[0].description : 'NOW DEPLOYABLE IN BATTLE!'
      }</div>
    `;
  } else {
    const rolled = outcome.rolledMutation ?? 'common';
    const rolledDef = MUTATION_DEFS[rolled];
    const activeTier = outcome.activeMutation ?? rolled;
    const activeDef = MUTATION_DEFS[activeTier];
    slot.classList.add(`revealed-${rolled}`);

    const bannerLabel = outcome.mutationUpgraded
      ? `${rolledDef.name.toUpperCase()} MUTATION!`
      : `${rolledDef.name.toUpperCase()} ROLL (+${outcome.plusLevel})`;
    const detailLine = isSingleHero
      ? outcome.mutationUpgraded
        ? `${rolledDef.subtitle}: ${rolledDef.summary}`
        : `Kept ${activeDef.name} Mutation + Level Up (+${outcome.plusLevel}: +${outcome.plusLevel * 3}% DMG)!`
      : outcome.mutationUpgraded
      ? `${activeDef.summary}`
      : `ACTIVE: ${activeDef.name.toUpperCase()} (+${outcome.plusLevel})`;

    slot.innerHTML = `
      <span class="reveal-kicker-pill" style="color:${rolledDef.color}; background:${rolledDef.bgTint}">${bannerLabel}</span>
      <img class="reveal-unit-img" src="${spr?.portraitUrl ?? ''}" style="border-color:${rolledDef.color}" alt="" />
      <div class="reveal-unit-name">${def.name} +${outcome.plusLevel}</div>
      <div class="reveal-unit-role">${def.role}</div>
      <div class="reveal-mut-summary" style="color:${rolledDef.color}">${detailLine}</div>
    `;
  }
}

function finalizeCutsceneState(): void {
  cutsceneFinished = true;
  const count = activeCutsceneOutcomes.length;
  const newCount = activeCutsceneOutcomes.filter((o) => o.isNewUnit).length;
  const mutCount = count - newCount;

  cutsceneTitle.textContent =
    count === 1
      ? activeCutsceneOutcomes[0].isNewUnit
        ? 'NEW CHICKEN HATCHED!'
        : 'MUTATION AWAKENED!'
      : `${count}X GEM EGG HATCH COMPLETE!`;
  cutsceneSubtitle.textContent =
    count === 1
      ? `GEM EGGS REMAINING: ${PROGRESSION.getEggs().toLocaleString()}`
      : `${newCount} NEW ${newCount === 1 ? 'UNIT' : 'UNITS'} & ${mutCount} ${
          mutCount === 1 ? 'MUTATION' : 'MUTATIONS'
        } • GEM EGGS LEFT: ${PROGRESSION.getEggs().toLocaleString()}`;

  btnCutsceneSkip.classList.add('hidden');
  const eggsNow = PROGRESSION.getEggs();
  btnCutsceneAgain1.disabled = eggsNow < 1;
  btnCutsceneAgain4.disabled = eggsNow < 4;
  btnCutsceneAgain8.disabled = eggsNow < 8;
  cutsceneDoneActions.classList.remove('hidden');
  renderGemEggShop();
  renderMainMenu();
  refreshFullUi();
}

function skipCutsceneToRevealAll(): void {
  if (cutsceneFinished || !inCutscene) return;
  clearCutsceneTimers();
  triggerCutsceneFlash();

  const isSingle = activeCutsceneOutcomes.length === 1;
  let playedLegendary = false;
  for (let i = 0; i < activeCutsceneOutcomes.length; i++) {
    const out = activeCutsceneOutcomes[i];
    const slot = activeCutsceneSlots[i];
    if (slot && !slot.dataset.revealed) {
      slot.dataset.revealed = '1';
      renderRevealedSlotHtml(slot, out, isSingle);
    }
    if (out.isNewUnit || out.rolledMutation === 'legendary' || out.rolledMutation === 'epic') {
      playedLegendary = true;
    }
  }
  engine.audio.playEggReveal(playedLegendary ? 'legendary' : 'rare');
  finalizeCutsceneState();
}

function startGemEggPurchase(count: 1 | 4 | 8): void {
  const outcomes = PROGRESSION.buyGemEggs(count);
  if (!outcomes) {
    engine.audio.playBlockedClick();
    return;
  }
  engine.invalidateStatsCache();

  clearCutsceneTimers();
  inCutscene = true;
  cutsceneFinished = false;
  activeCutsceneOutcomes = outcomes;
  activeCutsceneSlots = [];

  cutsceneTitle.textContent =
    count === 1 ? 'CRACKING GEM EGG...' : `CRACKING ${count} GEM EGGS...`;
  cutsceneSubtitle.textContent = 'STAND BACK — CRYSTALLINE SHELL DESTABILIZING!';
  btnCutsceneSkip.classList.remove('hidden');
  cutsceneDoneActions.classList.add('hidden');

  cutsceneStage.innerHTML = '';
  const grid = document.createElement('div');
  grid.className =
    count === 1 ? 'cutscene-grid-single' : count === 4 ? 'cutscene-grid-4' : 'cutscene-grid-8';

  const isSingle = count === 1;
  for (let i = 0; i < count; i++) {
    const slot = document.createElement('div');
    slot.className = `hatch-slot wobbling${isSingle ? ' single-hero' : ''}`;
    slot.innerHTML = `
      <img class="hatch-egg-img" src="${PIXEL_ATLAS.gemEggStageUrls[0]}" alt="" />
      <div class="hatch-slot-status">GEM EGG #${i + 1}</div>
    `;
    grid.appendChild(slot);
    activeCutsceneSlots.push(slot);
  }
  cutsceneStage.appendChild(grid);
  eggCutsceneModal.classList.remove('hidden');
  engine.audio.playEggWobble();

  if (isSingle) {
    const slot = activeCutsceneSlots[0];
    const outcome = outcomes[0];
    const setStage = (ms: number, fn: () => void) => {
      cutsceneTimers.push(window.setTimeout(fn, ms));
    };

    setStage(480, () => {
      const img = slot.querySelector<HTMLImageElement>('.hatch-egg-img');
      const st = slot.querySelector<HTMLElement>('.hatch-slot-status');
      if (img) img.src = PIXEL_ATLAS.gemEggStageUrls[1];
      if (st) st.textContent = 'CRACKING...';
      slot.classList.remove('wobbling');
      slot.classList.add('cracking');
      engine.audio.playEggCrack(1);
    });

    setStage(980, () => {
      const img = slot.querySelector<HTMLImageElement>('.hatch-egg-img');
      const st = slot.querySelector<HTMLElement>('.hatch-slot-status');
      if (img) img.src = PIXEL_ATLAS.gemEggStageUrls[2];
      if (st) st.textContent = 'ENERGY SURGING!';
      engine.audio.playEggCrack(2);
    });

    setStage(1440, () => {
      const img = slot.querySelector<HTMLImageElement>('.hatch-egg-img');
      const st = slot.querySelector<HTMLElement>('.hatch-slot-status');
      if (img) img.src = PIXEL_ATLAS.gemEggStageUrls[3];
      if (st) st.textContent = 'SHATTERED!';
      triggerCutsceneFlash();
    });

    setStage(1680, () => {
      slot.dataset.revealed = '1';
      renderRevealedSlotHtml(slot, outcome, true);
      engine.audio.playEggReveal(outcome.isNewUnit ? 'new' : (outcome.rolledMutation ?? 'common'));
      finalizeCutsceneState();
    });
  } else {
    // 4x or 8x Multi-Hatch Sequential Cascade!
    const stepDelay = count === 4 ? 390 : 280;
    for (let i = 0; i < count; i++) {
      const slot = activeCutsceneSlots[i];
      const outcome = outcomes[i];
      const baseMs = 320 + i * stepDelay;

      cutsceneTimers.push(
        window.setTimeout(() => {
          const img = slot.querySelector<HTMLImageElement>('.hatch-egg-img');
          if (img) img.src = PIXEL_ATLAS.gemEggStageUrls[1];
          slot.classList.remove('wobbling');
          slot.classList.add('cracking');
          engine.audio.playEggCrack(1);
        }, baseMs)
      );

      cutsceneTimers.push(
        window.setTimeout(() => {
          const img = slot.querySelector<HTMLImageElement>('.hatch-egg-img');
          if (img) img.src = PIXEL_ATLAS.gemEggStageUrls[2];
        }, baseMs + 110)
      );

      cutsceneTimers.push(
        window.setTimeout(() => {
          const img = slot.querySelector<HTMLImageElement>('.hatch-egg-img');
          if (img) img.src = PIXEL_ATLAS.gemEggStageUrls[3];
          if (
            outcome.isNewUnit ||
            outcome.rolledMutation === 'epic' ||
            outcome.rolledMutation === 'legendary'
          ) {
            triggerCutsceneFlash();
          }
        }, baseMs + 210)
      );

      cutsceneTimers.push(
        window.setTimeout(() => {
          slot.dataset.revealed = '1';
          renderRevealedSlotHtml(slot, outcome, false);
          engine.audio.playEggReveal(
            outcome.isNewUnit ? 'new' : (outcome.rolledMutation ?? 'common')
          );
          if (i === count - 1) {
            finalizeCutsceneState();
          }
        }, baseMs + 310)
      );
    }
  }
}

function closeCutsceneModal(): void {
  clearCutsceneTimers();
  inCutscene = false;
  eggCutsceneModal.classList.add('hidden');
  renderGemEggShop();
}

// ==================== STRICT 460:300 STAGE ASPECT RATIO FIT ====================
function syncStageAspectRatio(): void {
  if (typeof window === 'undefined') return;
  if (window.innerWidth <= 960) {
    canvasFrame.style.width = '';
    canvasFrame.style.height = '';
    return;
  }
  // Subtract stage-panel padding (4px * 2 = 8px) so canvas-frame fits cleanly with zero overflow
  const availW = Math.max(0, stagePanel.clientWidth - 8);
  const availH = Math.max(0, stagePanel.clientHeight - 8);
  if (availW <= 0 || availH <= 0) return;

  const targetRatio = PIXEL_CANVAS_W / PIXEL_CANVAS_H; // 460 / 300
  let fitW = availW;
  let fitH = Math.round(fitW / targetRatio);
  if (fitH > availH) {
    fitH = availH;
    fitW = Math.round(fitH * targetRatio);
  }
  canvasFrame.style.width = `${fitW}px`;
  canvasFrame.style.height = `${fitH}px`;
}

if (typeof ResizeObserver !== 'undefined') {
  const stageResizeObs = new ResizeObserver(() => syncStageAspectRatio());
  stageResizeObs.observe(stagePanel);
}
window.addEventListener('resize', syncStageAspectRatio);

// ==================== GAMEPLAY LAUNCH & RESUME ====================
function launchSelectedRun(): void {
  selectedTowerId = null;
  ghost.typeId = null;
  placementBanner.classList.add('hidden');
  secretCodeModal.classList.add('hidden');
  appInstallModal.classList.add('hidden');
  hasStartedRun = true;
  inMainMenu = false;
  inGemShop = false;
  mainMenuScreen.classList.add('hidden');
  gemShopScreen.classList.add('hidden');
  engine.startNewRun(pendingMapId, pendingDifficultyId);
  renderer.setMap(pendingMapId);
  syncStageAspectRatio();
  refreshFullUi();
}

function resumeActiveRun(): void {
  if (!hasStartedRun || engine.status === 'gameover') return;
  secretCodeModal.classList.add('hidden');
  appInstallModal.classList.add('hidden');
  inMainMenu = false;
  inGemShop = false;
  mainMenuScreen.classList.add('hidden');
  gemShopScreen.classList.add('hidden');
  syncStageAspectRatio();
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
  if (typeId && !engine.isChickenUnlocked(typeId)) {
    engine.audio.playBlockedClick();
    bannerTitle.textContent = 'LOCKED GEM EGG UNIT!';
    bannerDesc.textContent =
      `Earn 1 Gem Egg per ${BUGS_PER_EGG.toLocaleString()} Enemies killed, then open your Gem Eggs in the Main Menu!`;
    return;
  }
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

// ==================== 38-UNIT PIXEL SHOP RENDERING ====================
const cornIconUrl = PIXEL_ATLAS.getIconUrl('corn');
const lockIconUrl = PIXEL_ATLAS.getIconUrl('lock');

// Cached live shop button arrays to avoid 60 FPS querySelectorAll scans!
let cachedTroopBtns: HTMLButtonElement[] = [];
let cachedCornUpgBtns: HTMLButtonElement[] = [];
let cachedCannonSidebarBtns: HTMLButtonElement[] = [];
let lastAffordCorn = -1;
let lastAffordEggs = -1;
let lastAffordTowerId: number | null = null;

function renderTroopCards(): void {
  setText(lblTabTroops, `TROOPS ${PROGRESSION.getUnlockedCount()}/${CHICKEN_ORDER.length}`);
  troopGrid.innerHTML = '';
  cachedTroopBtns = [];
  lastAffordCorn = -1;
  const frag = document.createDocumentFragment();

  for (const id of CHICKEN_ORDER) {
    const def = CHICKEN_DEFS[id];
    const unlocked = engine.isChickenUnlocked(id);
    const cost = engine.getTowerBaseCost(id);
    const canAfford = unlocked && engine.corn >= cost;
    const isSelected = ghost.typeId === id;
    const spr = PIXEL_ATLAS.getChickenSprite(id);
    const mut = PROGRESSION.getMutation(id);
    const plusLv = PROGRESSION.getPlusLevel(id);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.cost = String(cost);
    btn.dataset.unlocked = unlocked ? '1' : '0';

    if (!unlocked) {
      btn.className = 'troop-btn locked-troop';
      btn.title = `${def.name} — LOCKED! Earn Gem Eggs (1 per ${BUGS_PER_EGG.toLocaleString()} Enemies) & open them in the Main Menu!`;
      btn.innerHTML = `
        <img class="troop-portrait" src="${spr?.lockedPortraitUrl ?? ''}" alt="" />
        <div class="troop-meta">
          <div class="troop-top">
            <span class="troop-cost" style="color:#f472b6"><img class="px-icon px-icon-sm" src="${lockIconUrl}" alt="" />GEM</span>
          </div>
          <span class="troop-name">??? (${formatCompactCost(def.baseCost)})</span>
          <span class="troop-role">Open Gem Eggs</span>
        </div>
      `;
      btn.addEventListener('click', () => setPlacementType(id));
    } else {
      const mutDef = mut ? MUTATION_DEFS[mut] : null;
      btn.className = `troop-btn${isSelected ? ' selected' : ''}${!canAfford ? ' unaffordable' : ''}`;
      btn.title = `${def.name}${plusLv > 0 ? ` +${plusLv}` : ''} (${def.role})${
        mutDef ? ` [${mutDef.name.toUpperCase()} MUTATION: ${mutDef.summary}]` : ''
      } — ${cost.toLocaleString()} Corn`;

      const shortMutLabel = mut
        ? `${mut.slice(0, 3).toUpperCase()}${plusLv > 0 ? `+${plusLv}` : ''}`
        : '';

      btn.innerHTML = `
        <img class="troop-portrait" src="${spr?.portraitUrl ?? ''}" alt="" style="${
        mutDef ? `border-color:${mutDef.color}` : ''
      }" />
        ${
          mutDef
            ? `<span class="troop-mut-tag" style="color:${mutDef.color}; background:${mutDef.bgTint}">${shortMutLabel}</span>`
            : ''
        }
        <div class="troop-meta">
          <div class="troop-top">
            <span class="troop-cost"><img class="px-icon px-icon-sm" src="${cornIconUrl}" alt="" />${formatCompactCost(cost)}</span>
          </div>
          <span class="troop-name">${def.name}</span>
          <span class="troop-role" style="${def.isSupport ? 'color:#67e8f9; font-weight:700' : ''}">${def.role}</span>
        </div>
      `;
      btn.addEventListener('click', () => {
        if (ghost.typeId === id) {
          setPlacementType(null);
        } else {
          setPlacementType(id);
        }
      });
    }
    cachedTroopBtns.push(btn);
    frag.appendChild(btn);
  }
  troopGrid.appendChild(frag);
}

function renderUpgradeLists(): void {
  cachedCornUpgBtns = [];
  cachedCannonSidebarBtns = [];
  lastAffordCorn = -1;
  lastAffordEggs = -1;

  clickerUpgList.innerHTML = '';
  const clickerFrag = document.createDocumentFragment();
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
    const btn = row.querySelector('button')!;
    btn.addEventListener('click', () => {
      engine.buyClickerUpgrade(def.id);
    });
    cachedCornUpgBtns.push(btn);
    clickerFrag.appendChild(row);
  }
  clickerUpgList.appendChild(clickerFrag);

  tdUpgList.innerHTML = '';
  const tdFrag = document.createDocumentFragment();
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
    const btn = row.querySelector('button')!;
    btn.addEventListener('click', () => {
      engine.buyTdUpgrade(def.id);
    });
    cachedCornUpgBtns.push(btn);
    tdFrag.appendChild(row);
  }
  tdUpgList.appendChild(tdFrag);

  // Render Cluck Cannon Loadouts in the CANNON sidebar tab!
  setText(lblTabCannon, `CANNON ${PROGRESSION.getUnlockedCannonCount()}/${CANNON_ORDER.length}`);
  sidebarCannonList.innerHTML = '';
  const cannonFrag = document.createDocumentFragment();
  const savedEggs = PROGRESSION.getEggs();
  const equippedCannonId = PROGRESSION.getEquippedCannon();

  for (const cId of CANNON_ORDER) {
    const cDef = CANNON_DEFS[cId];
    const unlocked = PROGRESSION.isCannonUnlocked(cId);
    const isEquipped = unlocked && cId === equippedCannonId;
    const canAfford = !unlocked && savedEggs >= cDef.gemEggCost;
    const iconUrl = PIXEL_ATLAS.getIconUrl(cDef.iconId);

    const row = document.createElement('div');
    row.className = 'upg-row';
    if (isEquipped) {
      row.style.borderColor = cDef.accentColor;
      row.style.background = '#172554';
    }

    const btnClass = isEquipped
      ? 'upg-buy-btn cannon-sidebar-btn equipped-btn'
      : unlocked
      ? 'upg-buy-btn cannon-sidebar-btn'
      : 'upg-buy-btn cannon-sidebar-btn gem-buy-btn';
    const btnDisabled = !unlocked && !canAfford;
    const btnHtml = isEquipped
      ? 'EQUIPPED'
      : unlocked
      ? 'EQUIP'
      : `<img class="px-icon px-icon-sm" src="${gemEggIconUrl}" alt="" />${cDef.gemEggCost} GEM`;

    row.innerHTML = `
      <div class="upg-icon-box" style="border-color:${cDef.accentColor}">
        <img class="px-icon px-icon-md" src="${iconUrl}" alt="" />
      </div>
      <div class="upg-info">
        <div class="upg-title">${cDef.name} (${cDef.chargeSec}S)</div>
        <div class="upg-effect" style="color:${cDef.accentColor}">${cDef.badgeText}</div>
        <div class="upg-desc">${cDef.description}</div>
      </div>
      <button type="button" class="${btnClass}" data-cannon-id="${cId}" ${
      btnDisabled ? 'disabled' : ''
    }>
        ${btnHtml}
      </button>
    `;
    const btn = row.querySelector('button')!;
    btn.addEventListener('click', () => handleCannonSelectOrBuy(cId));
    cachedCannonSidebarBtns.push(btn);
    cannonFrag.appendChild(row);
  }
  sidebarCannonList.appendChild(cannonFrag);
}

function formatInspectorStats(towerId: number): string {
  const tower = engine.getTowerById(towerId);
  if (!tower) return '';
  const def = CHICKEN_DEFS[tower.typeId];
  const eff = engine.getEffectiveChickenStats(tower);

  if (def.isSupport) {
    const buffedCount = engine.getTowersBuffedBy(tower).length;
    if (eff.effectiveDamage <= 0) {
      return `SUPPORT AURA | RNG ${eff.effectiveRange} | BUFFING ${buffedCount} ${
        buffedCount === 1 ? 'UNIT' : 'UNITS'
      }`;
    }
    const dmgText = Number.isInteger(eff.effectiveDamage)
      ? eff.effectiveDamage.toLocaleString()
      : eff.effectiveDamage.toFixed(1);
    return `DMG ${dmgText} | ${eff.effectiveFireRate.toFixed(2)}/S | RNG ${
      eff.effectiveRange
    } | BUFFING ${buffedCount}`;
  }

  const buffTag = eff.supportBuffCount > 0 ? ` | BUFFED x${eff.supportBuffCount}` : '';
  const camoTag = eff.effectiveCamo ? ' | CAMO' : '';
  const kbTag = eff.effectiveKnockback > 0 ? ' | KB' : '';
  const critTag =
    eff.effectiveCritChance > 0 ? ` | ${Math.round(eff.effectiveCritChance * 100)}% CRIT` : '';
  const dmgText = Number.isInteger(eff.effectiveDamage)
    ? eff.effectiveDamage.toLocaleString()
    : eff.effectiveDamage.toFixed(1);
  return `DMG ${dmgText} | ${eff.effectiveFireRate.toFixed(2)}/S | RNG ${
    eff.effectiveRange
  } | DEALT ${Math.round(tower.totalPopDamage).toLocaleString()}${buffTag}${camoTag}${kbTag}${critTag}`;
}

function renderInspector(): void {
  const tower =
    selectedTowerId !== null
      ? engine.getTowerById(selectedTowerId) ?? null
      : null;

  if (!tower) {
    inspectorCard.classList.add('hidden');
    stageCannonCluster.classList.remove('lifted');
    return;
  }

  const def = CHICKEN_DEFS[tower.typeId];
  const eff = engine.getEffectiveChickenStats(tower);
  const tierNum = tower.tier + 1;
  const spr = PIXEL_ATLAS.getChickenSprite(tower.typeId);

  inspPortrait.src = spr?.portraitUrl ?? '';
  setText(inspName, `${def.name}${eff.plusLevel > 0 ? ` +${eff.plusLevel}` : ''} — ${eff.tierName}`);
  setText(inspTierBadge, tower.tier === 3 ? 'TIER 4 MAX' : `TIER ${tierNum}/4`);

  if (eff.mutationTier) {
    setText(inspMutBadge, `${MUTATION_DEFS[eff.mutationTier].name.toUpperCase()}`);
    inspMutBadge.className = `mut-badge ${eff.mutationTier}`;
  } else {
    inspMutBadge.className = 'mut-badge hidden';
  }

  setText(inspStats, formatInspectorStats(tower.id));
  setText(btnInspTarget, `AIM: ${tower.targetMode.toUpperCase()}`);
  btnInspTarget.classList.toggle('hidden', eff.effectiveDamage <= 0);

  if (tower.tier < 3) {
    const nextTierIdx = (tower.tier + 1) as 1 | 2 | 3;
    const nextTier = def.tiers[nextTierIdx];
    const upgCost = engine.getTowerUpgradeCost(tower.typeId, nextTierIdx);
    setText(inspNextDesc, `NEXT (${nextTier.tierName}): ${nextTier.description}`);
    setText(btnInspUpgrade, `TIER ${tierNum + 1} (${formatCompactCost(upgCost)} CORN)`);
    btnInspUpgrade.disabled = engine.corn < upgCost;
  } else {
    setText(inspNextDesc, 'MAXIMUM CHICKEN EVOLUTION ACHIEVED!');
    setText(btnInspUpgrade, 'MAX TIER');
    btnInspUpgrade.disabled = true;
  }

  const refund = Math.round(tower.totalSpent * 0.7);
  setText(btnInspSell, `SELL (+${formatCompactCost(refund)})`);
  inspectorCard.classList.remove('hidden');
  stageCannonCluster.classList.add('lifted');
}

function populateDefeatEndscreen(): void {
  const rep = engine.lastDefeatSummary;
  const mapName = MAP_DEFS[engine.mapId].name;
  const diffBadge = engine.getDifficulty().badge;
  defeatStageTag.textContent = `${mapName.toUpperCase()} • ${diffBadge}`;

  if (!rep) {
    gameoverSummary.textContent = `The Foxes & Bugs overran ${mapName} on Wave ${engine.waveNumber}.`;
    return;
  }

  const killerName = rep.killerEnemyId ? ENEMY_DEFS[rep.killerEnemyId].name : 'Fox Armada';
  gameoverSummary.textContent = `${killerName} broke through the Golden Nest on Wave ${rep.waveReached}!`;

  if (rep.bossName && rep.bossHpPercentRemaining !== null) {
    defeatBossLabel.textContent = `BOSS HP REMAINING: ${rep.bossName.toUpperCase()}`;
    defeatBossPct.textContent = `${rep.bossHpPercentRemaining}%`;
    defeatBossFill.style.width = `${rep.bossHpPercentRemaining}%`;
  } else {
    defeatBossLabel.textContent = `WAVE ${rep.waveReached} CLEAR PROGRESS`;
    defeatBossPct.textContent = `${rep.waveProgressPercent}%`;
    defeatBossFill.style.width = `${rep.waveProgressPercent}%`;
  }

  defeatEggsEarned.textContent = `+${rep.eggsEarnedThisRun.toLocaleString()} ${
    rep.eggsEarnedThisRun === 1 ? 'GEM EGG' : 'GEM EGGS'
  } EARNED!`;
  defeatEggsBank.textContent = `OWNED: ${rep.totalSavedEggs.toLocaleString()} GEM EGGS`;
  defeatRemainderText.textContent = `${rep.newBugRemainder.toLocaleString()} / ${BUGS_PER_EGG.toLocaleString()} KILLS`;
  defeatRemainderFill.style.width = `${Math.min(
    100,
    Math.round((rep.newBugRemainder / BUGS_PER_EGG) * 100)
  )}%`;

  defeatStatWave.textContent = rep.freeplay ? `WAVE ${rep.waveReached} (FREE)` : `WAVE ${rep.waveReached} / ${CAMPAIGN_WAVES}`;
  defeatStatBugs.textContent = rep.totalBugsKilledThisRun.toLocaleString();
  defeatStatCorn.textContent = formatCompactCost(rep.totalCornHarvested);

  if (rep.mvpUnitId) {
    const mvpDef = CHICKEN_DEFS[rep.mvpUnitId];
    const mvpSpr = PIXEL_ATLAS.getChickenSprite(rep.mvpUnitId);
    defeatMvpImg.src = mvpSpr?.portraitUrl ?? '';
    defeatMvpImg.classList.remove('hidden');
    defeatStatMvp.textContent = `${mvpDef.name} (${formatCompactCost(rep.mvpDamage)})`;
  } else {
    defeatMvpImg.classList.add('hidden');
    defeatStatMvp.textContent = 'NONE';
  }

  lblDefeatShopBtn.textContent =
    rep.totalSavedEggs > 0 ? `OPEN GEM EGGS (${rep.totalSavedEggs})` : 'OPEN GEM EGGS';
}

function updateHudBattleEggsLive(): void {
  const saved = PROGRESSION.getEggs();
  const unbanked = Math.max(0, engine.totalBugsPopped - engine.bugsBankedThisRun);
  const pendingFromRun = Math.floor((PROGRESSION.getBugKillRemainder() + unbanked) / BUGS_PER_EGG);
  setText(
    hudBattleEggs,
    pendingFromRun > 0 && engine.status !== 'gameover'
      ? `${saved.toLocaleString()} (+${pendingFromRun})`
      : saved.toLocaleString()
  );
}

function refreshFullUi(): void {
  const mapName = MAP_DEFS[engine.mapId].name.toUpperCase();
  const diffBadge = engine.getDifficulty().badge;
  setText(brandSubText, `${mapName} • ${diffBadge}`);

  setText(hudCorn, engine.corn.toLocaleString());
  setText(hudEggs, `${engine.eggs} / ${engine.maxEggs}`);
  setText(
    hudWave,
    engine.freeplayUnlocked
      ? `${engine.waveNumber} (FREE)`
      : `${Math.min(engine.waveNumber, CAMPAIGN_WAVES)} / ${CAMPAIGN_WAVES}`
  );
  setText(hudPops, engine.totalBugsPopped.toLocaleString());
  updateHudBattleEggsLive();

  const waveDef = getWaveDefinition(engine.waveNumber);
  setText(bannerTitle, `WAVE ${waveDef.waveNumber}: ${waveDef.title.toUpperCase()}`);
  setText(bannerDesc, waveDef.callout);

  const baseClick = getBaseCornPerClick(engine.clickerLevels.beakPower);
  const waveMult = getCornucopiaWaveMult(engine.clickerLevels.cornucopia, engine.waveNumber);
  const effectiveBasePeck = Math.max(1, Math.round(baseClick * waveMult));
  const autoRate = getFarmhandAutoRate(engine.clickerLevels.farmhandChicks);
  setText(
    clickMainLabel,
    autoRate > 0
      ? `+${effectiveBasePeck.toLocaleString()} / PECK • AUTO ${autoRate.toFixed(1)}/S`
      : `+${effectiveBasePeck.toLocaleString()} BASE CORN / CLICK`
  );

  if (engine.waveActive) {
    clickerCard.classList.remove('locked');
    setText(
      clickStatusNote,
      autoRate > 0
        ? `WAVE ACTIVE — 12 CPS CLICK + ${autoRate.toFixed(1)}/S FARMHANDS!`
        : 'WAVE ACTIVE — CLICK UP TO 12 CPS FOR CORN!'
    );
    const rem = engine.getPendingWaveEnemyTotal();
    setText(btnStartWave, `WAVE ${waveDef.waveNumber} ACTIVE (${rem} LEFT)`);
    btnStartWave.classList.add('wave-running');
    btnStartWave.disabled = true;
  } else {
    clickerCard.classList.add('locked');
    setText(clickStatusNote, 'LOCKED BETWEEN WAVES — START WAVE TO CLICK!');
    setText(btnStartWave, `>> START WAVE ${waveDef.waveNumber} (UNLOCK CLICKER!)`);
    btnStartWave.classList.remove('wave-running');
    btnStartWave.disabled = false;
  }

  renderTroopCards();
  renderUpgradeLists();
  renderInspector();
  updateLiveClickerMeters();

  if (!inMainMenu && engine.status === 'victory_prompt') {
    victorySummary.textContent = `You crushed the Nebula Cosmic Foxes on ${MAP_DEFS[engine.mapId].name} (${engine.getDifficulty().badge})! Defeated ${engine.totalBugsPopped.toLocaleString()} pests and harvested ${engine.totalCornClicked.toLocaleString()} Corn!`;
    victoryEggsEarned.textContent = `+${engine.lastVictoryEggsEarned.toLocaleString()} GEM EGGS EARNED!`;
    victoryEggsTotal.textContent = `OWNED GEM EGGS: ${PROGRESSION.getEggs().toLocaleString()} • OPEN IN MAIN MENU!`;
    victoryModal.classList.remove('hidden');
  } else {
    victoryModal.classList.add('hidden');
  }

  if (!inMainMenu && engine.status === 'gameover') {
    populateDefeatEndscreen();
    gameoverModal.classList.remove('hidden');
  } else {
    gameoverModal.classList.add('hidden');
  }

  // Only flush synchronous localStorage immediately when between waves / on victory / on defeat!
  if (!engine.waveActive || engine.status !== 'playing') {
    persistFullGameState();
  }
}

engine.onUiChange = refreshFullUi;
engine.onCornChange = syncLiveShopAffordability;

function syncLiveShopAffordability(): void {
  const cornNow = engine.corn;
  const liveEggs = PROGRESSION.getEggs();
  setText(hudCorn, cornNow.toLocaleString());

  if (cornNow !== lastAffordCorn) {
    lastAffordCorn = cornNow;
    for (let i = 0; i < cachedTroopBtns.length; i++) {
      const btn = cachedTroopBtns[i];
      if (btn.dataset.unlocked !== '1') continue;
      const cost = Number(btn.dataset.cost ?? '0');
      btn.classList.toggle('unaffordable', cornNow < cost);
    }
    for (let i = 0; i < cachedCornUpgBtns.length; i++) {
      const btn = cachedCornUpgBtns[i];
      if (btn.dataset.maxed === '1') {
        btn.disabled = true;
      } else {
        const cost = Number(btn.dataset.cost ?? '0');
        btn.disabled = cornNow < cost;
      }
    }
  }

  if (liveEggs !== lastAffordEggs) {
    lastAffordEggs = liveEggs;
    for (let i = 0; i < cachedCannonSidebarBtns.length; i++) {
      const btn = cachedCannonSidebarBtns[i];
      const cId = btn.dataset.cannonId as CannonTypeId | undefined;
      if (!cId || PROGRESSION.isCannonUnlocked(cId)) continue;
      btn.disabled = liveEggs < CANNON_DEFS[cId].gemEggCost;
    }
  }

  if (selectedTowerId !== null && (cornNow !== lastAffordCorn || selectedTowerId !== lastAffordTowerId)) {
    lastAffordTowerId = selectedTowerId;
  }
  if (selectedTowerId !== null) {
    const tower = engine.getTowerById(selectedTowerId);
    if (tower && tower.tier < 3) {
      const nextTierIdx = (tower.tier + 1) as 1 | 2 | 3;
      const upgCost = engine.getTowerUpgradeCost(tower.typeId, nextTierIdx);
      btnInspUpgrade.disabled = cornNow < upgCost;
    }
  }
}

// ==================== REAL-TIME PIXEL METERS & CLUCK CANNON HUD ====================
let lastInspLiveSyncMs = 0;
let lastCannonTitleId = '';
let lastMeterCpsWidth = '';
let lastMeterFrenzyWidth = '';
let lastCannonBarWidth = '';
let lastCannonBarBg = '';

function updateLiveClickerMeters(): void {
  const cps = engine.getCurrentCps();
  const isAtCap = cps >= MAX_CPS_CAP || engine.capHitFlash > 0.15;
  setText(cpsBadge, isAtCap ? `MAX ${MAX_CPS_CAP} CPS CAP!` : `${cps} / ${MAX_CPS_CAP} CPS`);
  cpsBadge.classList.toggle('capped', isAtCap);

  setText(meterCpsText, `${cps} / ${MAX_CPS_CAP}`);
  const cpsW = `${Math.min(100, Math.round((cps / MAX_CPS_CAP) * 100))}%`;
  if (cpsW !== lastMeterCpsWidth) {
    lastMeterCpsWidth = cpsW;
    meterCpsFill.style.width = cpsW;
  }

  const fMult = engine.getCurrentFrenzyMultiplier();
  setText(
    frenzyLabel,
    engine.cannonCornBoostTimer > 0
      ? `FRENZY (${fMult.toFixed(2)}X) • 2X CORN!`
      : `FRENZY (${fMult.toFixed(2)}X)`
  );
  const frenzyW = `${Math.round(engine.frenzyMeter * 100)}%`;
  if (frenzyW !== lastMeterFrenzyWidth) {
    lastMeterFrenzyWidth = frenzyW;
    meterFrenzyFill.style.width = frenzyW;
  }

  if (engine.clickerLevels.harvestBasket > 0) {
    const step = engine.waveClickCounter % 12;
    setText(basketLabel, `MEGA COB: ${step} / 12`);
  } else {
    setText(basketLabel, 'MEGA COB: LOCKED');
  }

  // Cluck Cannon live gauge + equipped loadout icon & active buff timer!
  const eqCannon = engine.getEquippedCannonDef();
  if (lastCannonTitleId !== eqCannon.id) {
    lastCannonTitleId = eqCannon.id;
    iconCluckCannon.src = PIXEL_ATLAS.getIconUrl(eqCannon.iconId);
    btnCluckCannon.title = `${eqCannon.name} (${eqCannon.chargeSec}s charge) — ${eqCannon.description} [TAB]`;
  }

  const cannonPct = Math.min(100, Math.floor(engine.cannonCharge * 100));
  const cannonReady = engine.cannonCharge >= 1 && (engine.waveActive || engine.enemies.length > 0);
  const buffActive =
    engine.cannonTimeStopVisualTimer > 0 ||
    engine.cannonDamageBoostTimer > 0 ||
    engine.cannonCornBoostTimer > 0;

  const nextBarW = `${cannonPct}%`;
  if (nextBarW !== lastCannonBarWidth) {
    lastCannonBarWidth = nextBarW;
    cannonBarFill.style.width = nextBarW;
  }
  const nextBarBg = cannonReady ? '#facc15' : eqCannon.accentColor;
  if (nextBarBg !== lastCannonBarBg) {
    lastCannonBarBg = nextBarBg;
    cannonBarFill.style.background = nextBarBg;
  }
  btnCluckCannon.classList.toggle('ready', cannonReady);
  btnCluckCannon.classList.toggle('buff-active', !cannonReady && buffActive);

  if (cannonReady) {
    setText(lblCannonState, `FIRE ${eqCannon.shortLabel}! [TAB]`);
  } else if (engine.cannonTimeStopVisualTimer > 0) {
    setText(lblCannonState, `TIME STOP ${engine.cannonTimeStopVisualTimer.toFixed(1)}S!`);
  } else if (engine.cannonDamageBoostTimer > 0) {
    setText(lblCannonState, `2X DMG ${engine.cannonDamageBoostTimer.toFixed(1)}S!`);
  } else if (engine.cannonCornBoostTimer > 0) {
    setText(lblCannonState, `2X CORN ${engine.cannonCornBoostTimer.toFixed(1)}S!`);
  } else if (engine.cannonCharge >= 1) {
    setText(lblCannonState, `${eqCannon.shortLabel} READY!`);
  } else {
    setText(lblCannonState, `${eqCannon.shortLabel} ${cannonPct}%`);
  }

  setText(hudPops, engine.totalBugsPopped.toLocaleString());
  updateHudBattleEggsLive();

  if (engine.waveActive) {
    syncLiveShopAffordability();
    const rem = engine.getPendingWaveEnemyTotal();
    setText(btnStartWave, `WAVE ${engine.waveNumber} ACTIVE (${rem} LEFT)`);
    if (selectedTowerId !== null) {
      const now = performance.now();
      if (now - lastInspLiveSyncMs >= 160) {
        lastInspLiveSyncMs = now;
        setText(inspStats, formatInspectorStats(selectedTowerId));
      }
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
  while (clickFloatLayer.childElementCount >= 10) {
    clickFloatLayer.firstElementChild?.remove();
  }

  let relX: number;
  let relY: number;
  if (clientX !== undefined && clientY !== undefined && clientX > 0 && clientY > 0) {
    const rect = btnHenClick.getBoundingClientRect();
    relX = clientX - rect.left + (Math.random() - 0.5) * 20;
    relY = clientY - rect.top - 8;
  } else {
    const w = btnHenClick.clientWidth || 180;
    const h = btnHenClick.clientHeight || 64;
    relX = w / 2 + (Math.random() - 0.5) * 50;
    relY = h / 2;
  }

  const el = document.createElement('span');
  el.className = 'click-float-num';
  el.textContent = text;
  el.style.left = `${Math.round(relX)}px`;
  el.style.top = `${Math.round(relY)}px`;
  el.style.color = color;
  clickFloatLayer.appendChild(el);
  setTimeout(() => el.remove(), 630);
}

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

function switchShopTab(which: 'troops' | 'clicker' | 'td' | 'cannon'): void {
  document.querySelectorAll<HTMLButtonElement>('.shop-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === which);
  });
  document.getElementById('tab-troops')!.classList.toggle('hidden', which !== 'troops');
  document.getElementById('tab-clicker')!.classList.toggle('hidden', which !== 'clicker');
  document.getElementById('tab-td')!.classList.toggle('hidden', which !== 'td');
  document.getElementById('tab-cannon')!.classList.toggle('hidden', which !== 'cannon');
}

btnCannonLoadout.addEventListener('click', (e) => {
  e.stopPropagation();
  btnCannonLoadout.blur();
  engine.audio.playUpgrade();
  switchShopTab('cannon');
});

btnCluckCannon.addEventListener('click', (e) => {
  e.stopPropagation();
  btnCluckCannon.blur();
  if (!engine.fireCluckCannon()) {
    engine.audio.playBlockedClick();
  }
  updateLiveClickerMeters();
});

// Shop tab switching
document.querySelectorAll<HTMLButtonElement>('.shop-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const which = (tab.dataset.tab as 'troops' | 'clicker' | 'td' | 'cannon') ?? 'troops';
    switchShopTab(which);
  });
});

// Collection filter switching inside Gem Egg Shop
document.querySelectorAll<HTMLButtonElement>('.coll-filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.coll-filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeCollectionFilter =
      (btn.dataset.filter as 'all' | 'gacha' | 'starter' | 'support' | 'mutated') ?? 'all';
    engine.audio.playUpgrade();
    renderGemEggShop();
  });
});

// Gem Egg Shop navigation & purchases (1x, 4x, 8x!)
btnOpenGemShop.addEventListener('click', () => {
  engine.audio.playUpgrade();
  openGemEggShop();
});
btnMenuGemShopCta.addEventListener('click', () => {
  engine.audio.playUpgrade();
  openGemEggShop();
});
btnCloseGemShop.addEventListener('click', () => {
  engine.audio.playUpgrade();
  closeGemEggShop();
});

btnBuyEgg1.addEventListener('click', () => startGemEggPurchase(1));
btnBuyEgg4.addEventListener('click', () => startGemEggPurchase(4));
btnBuyEgg8.addEventListener('click', () => startGemEggPurchase(8));

btnCutsceneSkip.addEventListener('click', () => skipCutsceneToRevealAll());
btnCutsceneDone.addEventListener('click', () => closeCutsceneModal());
btnCutsceneAgain1.addEventListener('click', () => startGemEggPurchase(1));
btnCutsceneAgain4.addEventListener('click', () => startGemEggPurchase(4));
btnCutsceneAgain8.addEventListener('click', () => startGemEggPurchase(8));

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
  persistFullGameState();
});

btnMute.addEventListener('click', () => {
  btnMute.blur();
  const muted = engine.audio.toggleMute();
  iconBtnSound.src = PIXEL_ATLAS.getIconUrl(muted ? 'sound_off' : 'sound_on');
  persistFullGameState();
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
btnMenuEndRun.addEventListener('click', () => {
  if (!hasStartedRun || engine.status === 'gameover') return;
  inMainMenu = false;
  inGemShop = false;
  mainMenuScreen.classList.add('hidden');
  gemShopScreen.classList.add('hidden');
  engine.endRunEarly();
});

btnContinueFreeplay.addEventListener('click', () => {
  engine.freeplayUnlocked = true;
  engine.status = 'playing';
  refreshFullUi();
});

btnShopVictory.addEventListener('click', () => openGemEggShop());
btnMenuVictory.addEventListener('click', () => openMainMenu());

btnRestartGameover.addEventListener('click', () => {
  selectedTowerId = null;
  setPlacementType(null);
  engine.resetGame();
});

btnShopGameover.addEventListener('click', () => openGemEggShop());
btnMenuGameover.addEventListener('click', () => openMainMenu());

btnMenuIdle.addEventListener('click', () => {
  btnMenuIdle.blur();
  engine.audio.playUpgrade();
  openIdleMode();
});
btnShopIdle.addEventListener('click', () => {
  btnShopIdle.blur();
  engine.audio.playUpgrade();
  openIdleMode();
});
btnHudIdle.addEventListener('click', () => {
  btnHudIdle.blur();
  engine.audio.playUpgrade();
  openIdleMode();
});
btnIdleOpenEggs.addEventListener('click', () => {
  engine.audio.playUpgrade();
  closeIdleMode(true);
});
btnIdleExit.addEventListener('click', () => {
  engine.audio.playUpgrade();
  closeIdleMode(false);
});

// ==================== 4-TAP OMNICLUCK PRIME SECRET PROMO CODE VAULT ====================
let omniTapCount = 0;
let lastOmniTapMs = 0;
let omniTapBounceTimer: number | null = null;

function isSecretCodeModalOpen(): boolean {
  return !secretCodeModal.classList.contains('hidden');
}

function openSecretCodeModal(): void {
  secretCodeInput.value = '';
  secretCodeFeedback.className = 'secret-code-feedback';
  secretCodeFeedback.textContent = 'ENTER A CODE AND PRESS REDEEM';
  secretCodeModal.classList.remove('hidden');
  window.setTimeout(() => secretCodeInput.focus(), 20);
}

function closeSecretCodeModal(): void {
  secretCodeModal.classList.add('hidden');
  secretCodeInput.blur();
}

function submitSecretCode(): void {
  const res = PROGRESSION.redeemSecretCode(secretCodeInput.value);
  if (res.status === 'success') {
    secretCodeInput.value = '';
    secretCodeFeedback.className = 'secret-code-feedback success';
    secretCodeFeedback.textContent = `+${res.rewardEggs.toLocaleString()} GEM EGGS CLAIMED! (OWNED: ${res.totalEggs.toLocaleString()})`;
    engine.audio.playEggReveal('legendary');
    renderMainMenu();
    renderGemEggShop();
    refreshFullUi();
  } else if (res.status === 'already_redeemed') {
    secretCodeFeedback.className = 'secret-code-feedback warn';
    secretCodeFeedback.textContent = `CODE "${res.code}" WAS ALREADY REDEEMED!`;
    engine.audio.playBlockedClick();
  } else {
    secretCodeFeedback.className = 'secret-code-feedback error';
    secretCodeFeedback.textContent = 'INVALID SECRET CODE!';
    engine.audio.playBlockedClick();
  }
}

menuHeroChicken.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!inMainMenu || inGemShop || inCutscene || inIdleMode) return;

  const now = performance.now();
  if (now - lastOmniTapMs > 3500) {
    omniTapCount = 0;
  }
  lastOmniTapMs = now;
  omniTapCount++;

  menuHeroChicken.classList.add('omni-tap-pop');
  if (omniTapBounceTimer !== null) {
    window.clearTimeout(omniTapBounceTimer);
  }
  omniTapBounceTimer = window.setTimeout(() => {
    menuHeroChicken.classList.remove('omni-tap-pop');
    omniTapBounceTimer = null;
  }, 110);

  if (omniTapCount >= 4) {
    omniTapCount = 0;
    engine.audio.playEggReveal('legendary');
    openSecretCodeModal();
  } else {
    engine.audio.playEggWobble();
  }
});

btnRedeemCode.addEventListener('click', () => submitSecretCode());
btnCloseCodeModal.addEventListener('click', () => {
  engine.audio.playUpgrade();
  closeSecretCodeModal();
});
secretCodeModal.addEventListener('click', (e) => {
  if (e.target === secretCodeModal) {
    closeSecretCodeModal();
  }
});
secretCodeInput.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') {
    e.preventDefault();
    submitSecretCode();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeSecretCodeModal();
  }
});

// ==================== PWA STANDALONE APP INSTALL & PORTABLE OFFLINE DOWNLOAD ====================
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

function isRunningStandaloneApp(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as unknown as { standalone?: boolean }).standalone) ||
    window.location.protocol === 'file:'
  );
}

function syncAppInstallUi(): void {
  if (isRunningStandaloneApp()) {
    setText(lblMenuApp, 'OFFLINE FILE');
    appPwaDesc.textContent =
      'ChickenTD is already running in standalone / offline mode! You can also save a portable .html copy below.';
    btnPwaInstallNow.classList.add('hidden');
    appPwaManualSteps.classList.add('hidden');
  } else if (deferredInstallPrompt) {
    setText(lblMenuApp, 'INSTALL APP');
    appPwaDesc.textContent =
      'One-click install ready! Adds ChickenTD directly to your Applications / Dock / Start Menu / Home Screen:';
    btnPwaInstallNow.classList.remove('hidden');
    appPwaManualSteps.classList.add('hidden');
  } else {
    setText(lblMenuApp, 'GET APP');
    btnPwaInstallNow.classList.add('hidden');
    appPwaManualSteps.classList.remove('hidden');
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
  syncAppInstallUi();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  syncAppInstallUi();
});

if (
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

btnMenuApp.addEventListener('click', () => {
  btnMenuApp.blur();
  engine.audio.playUpgrade();
  syncAppInstallUi();
  appInstallModal.classList.remove('hidden');
});

btnCloseAppModal.addEventListener('click', () => {
  engine.audio.playUpgrade();
  appInstallModal.classList.add('hidden');
});

appInstallModal.addEventListener('click', (e) => {
  if (e.target === appInstallModal) {
    appInstallModal.classList.add('hidden');
  }
});

btnPwaInstallNow.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  engine.audio.playUpgrade();
  await deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(() => null);
  deferredInstallPrompt = null;
  syncAppInstallUi();
});

btnDownloadPortable.addEventListener('click', async () => {
  engine.audio.playUpgrade();
  setText(lblDownloadPortable, 'PREPARING OFFLINE FILE...');
  btnDownloadPortable.disabled = true;
  try {
    let htmlPayload = '';
    if (window.location.protocol !== 'file:') {
      const res = await fetch('./ChickenTD-Standalone.html', { cache: 'no-cache' }).catch(
        () => null
      );
      if (res && res.ok) {
        const txt = await res.text();
        if (txt.includes('id="td-canvas"') && txt.includes('<style>')) {
          htmlPayload = txt;
        }
      }
    }
    if (!htmlPayload) {
      // Fallback if running from local file:// or dev server
      htmlPayload = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    }
    const blob = new Blob([htmlPayload], { type: 'text/html;charset=utf-8' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = 'ChickenTD.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(dlUrl), 3000);
    setText(lblDownloadPortable, 'DOWNLOADED CHICKENTD.HTML!');
  } catch {
    setText(lblDownloadPortable, 'DOWNLOAD OFFLINE FILE (CHICKENTD.HTML)');
  } finally {
    btnDownloadPortable.disabled = false;
    window.setTimeout(() => {
      setText(lblDownloadPortable, 'DOWNLOAD OFFLINE FILE (CHICKENTD.HTML)');
    }, 2600);
  }
});

syncAppInstallUi();
syncStageAspectRatio();

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;

  if (isSecretCodeModalOpen()) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSecretCodeModal();
    }
    return;
  }

  if (!appInstallModal.classList.contains('hidden')) {
    if (e.key === 'Escape') {
      e.preventDefault();
      appInstallModal.classList.add('hidden');
    }
    return;
  }

  if (inCutscene) {
    if (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      if (!cutsceneFinished) {
        skipCutsceneToRevealAll();
      } else {
        closeCutsceneModal();
      }
    }
    return;
  }

  if (inIdleMode) {
    if (e.key === 'Escape') {
      e.preventDefault();
      engine.audio.playUpgrade();
      closeIdleMode(false);
    }
    return;
  }

  if (e.key === 'Escape') {
    if (!rulesModal.classList.contains('hidden')) {
      rulesModal.classList.add('hidden');
    } else if (inGemShop) {
      closeGemEggShop();
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

  if (inMainMenu || inGemShop) return;

  if (e.key === 'Tab') {
    e.preventDefault();
    if (!engine.fireCluckCannon()) {
      engine.audio.playBlockedClick();
    }
    updateLiveClickerMeters();
    return;
  }

  if (e.key === ' ' && !engine.waveActive && engine.status === 'playing') {
    e.preventDefault();
    engine.startNextWave();
  }
});

window.addEventListener('beforeunload', () => {
  flushAllSavesBeforeExit();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    flushAllSavesBeforeExit();
  } else if (document.visibilityState === 'visible' && inIdleMode) {
    idleSim.syncWallClock(Date.now());
  }
});

// Restore saved Preferences & Active Game Run on startup!
function restoreSavedSessionOnBoot(): void {
  const prefs = PROGRESSION.loadPrefs();
  if (prefs) {
    pendingMapId = prefs.pendingMapId;
    pendingDifficultyId = prefs.pendingDifficultyId;
    engine.audio.setMuted(prefs.isMuted);
    iconBtnSound.src = PIXEL_ATLAS.getIconUrl(prefs.isMuted ? 'sound_off' : 'sound_on');
  }

  const savedRun = PROGRESSION.loadActiveRun();
  if (savedRun && engine.restoreFromSavedRun(savedRun)) {
    hasStartedRun = true;
    pendingMapId = engine.mapId;
    pendingDifficultyId = engine.difficultyId;
    renderer.setMap(engine.mapId);
    lblSpeed.textContent = `${engine.speedMultiplier}X`;
    btnSpeed.classList.toggle('active-speed', engine.speedMultiplier === 2);

    if (!savedRun.inMainMenu) {
      inMainMenu = false;
      mainMenuScreen.classList.add('hidden');
    } else {
      inMainMenu = true;
      mainMenuScreen.classList.remove('hidden');
    }
  }

  if (prefs?.inIdleMode) {
    openIdleMode(prefs.lastIdleSyncMs);
  }
}

restoreSavedSessionOnBoot();
renderMainMenu();
refreshFullUi();

let lastPerfMs = performance.now();
let autoSaveAccumulatorSec = 0;

function loop(nowMs: number): void {
  requestAnimationFrame(loop);
  try {
    const dt = Math.max(0.001, Math.min(0.08, (nowMs - lastPerfMs) / 1000));
    lastPerfMs = nowMs;

    if (inIdleMode) {
      idleSim.syncWallClock(Date.now());
      idleSim.render(idleCanvas, dt, nowMs / 1000);
      return;
    }

    // Skip all battlefield simulation & canvas rendering when covered by fullscreen menus/cutscenes!
    if (!inMainMenu && !inGemShop && !inCutscene) {
      engine.tick(dt);
      updateLiveClickerMeters();
      renderer.render(canvas, engine, selectedTowerId, ghost, nowMs / 1000);

      autoSaveAccumulatorSec += dt;
      if (autoSaveAccumulatorSec >= 5.0) {
        autoSaveAccumulatorSec = 0;
        persistFullGameState();
      }
    }
  } catch (err) {
    console.error('ChickenTD tick error:', err);
  }
}
requestAnimationFrame(loop);
