import { ChickenTypeId, EnemyTypeId, PixelIconId } from './types';
import { CHICKEN_DEFS } from './data';

const OUTLINE = '#181425';

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return c;
}

/**
 * Compiles an ASCII pixel matrix into an exact nearest-neighbor Canvas sprite.
 * '.' or ' ' = transparent pixel.
 */
export function compileGridSprite(
  rows: readonly string[],
  palette: Record<string, string>,
  scale = 1
): HTMLCanvasElement {
  const h = rows.length;
  const w = rows[0]?.length ?? 1;
  const c = makeCanvas(w * scale, h * scale);
  const ctx = c.getContext('2d')!;
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = palette[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return c;
}

/**
 * Creates a pure solid-color silhouette copy of a pixel sprite (for crisp 8-bit hit flashes!).
 */
export function makeFlashSprite(src: HTMLCanvasElement, flashColor = '#FFFFFF'): HTMLCanvasElement {
  const c = makeCanvas(src.width, src.height);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = flashColor;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

// ==================== 1. UI PIXEL ICONS (ZERO EMOJIS!) ====================
const UI_ICON_GRIDS: Record<PixelIconId, { rows: string[]; pal: Record<string, string> }> = {
  chicken: {
    pal: {
      O: OUTLINE,
      R: '#FB7185',
      C: '#EF4444',
      W: '#FFFBEB',
      H: '#FFFFFF',
      S: '#FDE68A',
      Y: '#FACC15',
      B: '#F97316',
    },
    rows: [
      '....OO.OO.....',
      '...OCCOCCO....',
      '....OCCCO.....',
      '..OOOWWWWOOO..',
      '.OWWHHWWWWWW0.'.replace('0', 'O'),
      '.OWWWWWWHOWWWO',
      'OWWWWWWWOOYYBO',
      'OWWSSWWWRRWWBO',
      '.OWWSSSSWWWWO.',
      '..OOWWWWWWWOO.',
      '....OBO.OBO...',
      '....OO...OO...',
    ],
  },
  corn: {
    pal: { O: OUTLINE, Y: '#FACC15', H: '#FEF08A', D: '#CA8A04', G: '#22C55E', K: '#15803D' },
    rows: [
      '......OOOO....',
      '.....OYYYYO...',
      '....OYHYYHYO..',
      '....OYYYYDYO..',
      '...OYHYYDYDO..',
      '..OOYYYYDYO...',
      '.OGGOYYYYGOO..',
      '.OGKGOYYGKGO..',
      '..OGKGGGGGO...',
      '...OGKKKKO....',
      '....OGGGO.....',
      '.....OOO......',
    ],
  },
  egg: {
    pal: { O: OUTLINE, W: '#FFFBEB', H: '#FFFFFF', S: '#FDE68A', G: '#F59E0B' },
    rows: [
      '.....OOOO.....',
      '...OOWWWWOO...',
      '..OWHWWWWWW0..'.replace('0', 'O'),
      '..OWHHWWWWWWO.',
      '.OWWWWWWWWSWO.',
      '.OWWWGWWWSSWO.',
      '.OWWWWWWWWSSO.',
      '.OWWWSWWGWWWO.',
      '..OWWSSSSWWO..',
      '...OOWWWWOO...',
      '.....OOOO.....',
      '..............',
    ],
  },
  battle_egg: {
    pal: {
      O: OUTLINE,
      Y: '#FACC15',
      H: '#FFFFFF',
      L: '#FEF08A',
      D: '#D97706',
      C: '#38BDF8',
    },
    rows: [
      '.....OOOO.....',
      '...OOLLLLOO...',
      '..OLHHYYYYLO..',
      '..OLHYYCCYYLO.',
      '.OYYYYYCCYYYDO',
      '.OYYCCYYYYYYDO',
      '.OYYYYYYYYCCDO',
      '.OYYYYDDDDYYDO',
      '..OYYDDDDDDYO.',
      '...OOYYYYYYOO.',
      '.....OOOOOO...',
      '..............',
    ],
  },
  gem_egg: {
    pal: {
      O: OUTLINE,
      P: '#EC4899',
      M: '#A855F7',
      C: '#22D3EE',
      H: '#FFFFFF',
      Y: '#FACC15',
    },
    rows: [
      '.....OOOO.....',
      '...OOPPPPOO...',
      '..OPHPPCCMMO..',
      '.OPHHPPCCMMMO.',
      '.OPPYYYYYYMMO.',
      '.OPCCMHHMMCCO.',
      '.OPCCMMMMMCCO.',
      '.OMMPPPPPPMMO.',
      '..OMMYYYYMMO..',
      '...OOMMMMOO...',
      '.....OOOO.....',
      '..............',
    ],
  },
  cannon: {
    pal: {
      O: OUTLINE,
      S: '#475569',
      L: '#CBD5E1',
      Y: '#FACC15',
      C: '#22D3EE',
      R: '#EF4444',
    },
    rows: [
      '.......OOOOOO.',
      '.....OOLLLLCCO',
      '...OOSSSSSSCCO',
      '..OSSYYYYSSCCO',
      '.OSSSSSSSSOO..',
      '.OSSOOOOOO....',
      '..OO.OYYO.....',
      '....OYRRYO....',
      '....OYYYYO....',
      '.....OOOO.....',
      '..............',
      '..............',
    ],
  },
  cannon_timestop: {
    pal: {
      O: OUTLINE,
      P: '#A855F7',
      C: '#22D3EE',
      Y: '#FACC15',
      H: '#FFFFFF',
    },
    rows: [
      '..OOOOOOOOOO..',
      '..OYYYYYYYYO..',
      '...OPPHHPPO...',
      '....OPCCPO....',
      '.....OCCO.....',
      '.....OCCO.....',
      '....OPCCPO....',
      '...OPPCCPPO...',
      '..OYYYYYYYYO..',
      '..OOOOOOOOOO..',
      '..............',
      '..............',
    ],
  },
  cannon_dmgboost: {
    pal: {
      O: OUTLINE,
      F: '#F97316',
      R: '#EF4444',
      Y: '#FACC15',
      H: '#FEF08A',
    },
    rows: [
      '.......OOOOOO.',
      '.....OOYYYYHHO',
      '...OOFFRRRRHHO',
      '..OFFYYYYFFRRO',
      '.OFFFFFFFFOO..',
      '.OFFOOOOOO....',
      '..OO.OYYO.....',
      '....OYHHYO....',
      '....OYYYYO....',
      '.....OOOO.....',
      '..............',
      '..............',
    ],
  },
  cannon_nova: {
    pal: {
      O: OUTLINE,
      R: '#F43F5E',
      C: '#38BDF8',
      Y: '#FACC15',
      H: '#FFFFFF',
    },
    rows: [
      '......OO......',
      '.....ORRO.....',
      '..OO.OHHO.OO..',
      '.ORRHOHHHORRO.',
      'ORHHYYYYYYHHRO',
      '.ORRHYCCYHRRO.',
      '..OO.OHHO.OO..',
      '.....ORRO.....',
      '....ORCCRO....',
      '....OOOOOO....',
      '..............',
      '..............',
    ],
  },
  cannon_cornstorm: {
    pal: {
      O: OUTLINE,
      G: '#22C55E',
      Y: '#FACC15',
      H: '#FEF08A',
    },
    rows: [
      '.......OOOOOO.',
      '.....OOYYYYHHO',
      '...OOGGYYYYHHO',
      '..OGGHHHHGGYYO',
      '.OGGGGGGGGOO..',
      '.OGGOOOOOO....',
      '..OO.OYYO.....',
      '....OYGGYO....',
      '....OYYYYO....',
      '.....OOOO.....',
      '..............',
      '..............',
    ],
  },
  mutation_star: {
    pal: {
      O: OUTLINE,
      P: '#C084FC',
      C: '#38BDF8',
      Y: '#FACC15',
      H: '#FFFFFF',
    },
    rows: [
      '......OO......',
      '.....OCCO.....',
      '..OO.OHHO.OO..',
      '.OPPHOHHHOPPO.',
      '.OPHYHHHHYHPO.',
      'OCHHHYYYYHHHCO',
      '.OPHYHHHHYHPO.',
      '.OPPHOHHHOPPO.',
      '..OO.OHHO.OO..',
      '.....OCCO.....',
      '......OO......',
      '..............',
    ],
  },
  lock: {
    pal: { O: OUTLINE, S: '#CBD5E1', Y: '#FACC15', D: '#CA8A04', H: '#FEF08A' },
    rows: [
      '....OOOOOO....',
      '...OSSSSSSO...',
      '...OSSOOSSO...',
      '...OSSOOSSO...',
      '..OOOOOOOOOO..',
      '..OYYHHHHYYO..',
      '..OYYYYYYYYO..',
      '..OYYYOYYDYO..',
      '..OYYYOYYDYO..',
      '..OYYDDDDDYO..',
      '...OOOOOOOO...',
      '..............',
    ],
  },
  skull_defeat: {
    pal: { O: OUTLINE, W: '#F1F5F9', S: '#94A3B8', R: '#EF4444' },
    rows: [
      '....OOOOOO....',
      '..OOWWWWWWOO..',
      '.OWWWWWWWWWWO.',
      '.OWWROWWORWWO.',
      '.OWWROWWORWWO.',
      '.OWWWWOOWWWWO.',
      '..OWWWWWWWWO..',
      '...OWOOWOOWO..',
      '...OOOOOOOOO..',
      '..............',
      '..............',
      '..............',
    ],
  },
  fox: {
    pal: { O: OUTLINE, F: '#EA580C', L: '#FB923C', W: '#FFF7ED', E: '#181425', N: '#0F172A' },
    rows: [
      '.OO........OO.',
      'OFFO......OFFO',
      'OFWFOOOOOOFWFO',
      'OFFFLLLLLLFFFO',
      '.OFFLLLLLLFFO.',
      '.OFLWWLLWWLFO.',
      '.OFWEWLLWEWFO.',
      '..OWWWFFWWWO..',
      '...OWWWWWWO...',
      '....OWNNWO....',
      '.....OOOO.....',
      '..............',
    ],
  },
  bug: {
    pal: { O: OUTLINE, G: '#10B981', L: '#6EE7B7', D: '#047857', R: '#FACC15' },
    rows: [
      '..OO......OO..',
      '...OO....OO...',
      '....OOOOOO....',
      '...OORRRROO...',
      '.OOGGLLLLGGOO.',
      'OO.OGLLLLGO.OO',
      '...OGGDDGGO...',
      'OO.OGGDDGGO.OO',
      '...OOGGGGOO...',
      '..OO.OOOO.OO..',
      '..............',
      '..............',
    ],
  },
  shield: {
    pal: { O: OUTLINE, B: '#38BDF8', D: '#0284C7', S: '#E2E8F0', Y: '#FACC15' },
    rows: [
      '..OOOOOOOOOO..',
      '.OSSSSSSSSSSO.',
      '.OSBBBBDBBBSO.',
      '.OSBBYYYYBBSO.',
      '.OSBBYBBYBBSO.',
      '.OSBBYYYYBBSO.',
      '..OSBBBBDBSO..',
      '..OSBBBBDBSO..',
      '...OSBBBBSO...',
      '....OSBBSO....',
      '.....OSSO.....',
      '......OO......',
    ],
  },
  trophy: {
    pal: { O: OUTLINE, Y: '#FACC15', H: '#FEF08A', D: '#CA8A04', B: '#92400E' },
    rows: [
      '.OOOOOOOOOOOO.',
      'OYYHHHHHHHHYYO',
      'OYOYYYYYYYYOYO',
      'OO.OYYYYYYO.OO',
      '....OYYYYO....',
      '.....OYYO.....',
      '.....ODDO.....',
      '....OYYYYO....',
      '...OBBBBBBO...',
      '...OOOOOOOO...',
      '..............',
      '..............',
    ],
  },
  cracked_egg: {
    pal: { O: OUTLINE, W: '#F1F5F9', S: '#CBD5E1', R: '#EF4444', Y: '#FACC15' },
    rows: [
      '.....OOOO.....',
      '...OOWWWWOO...',
      '..OWWWWWWWW0..'.replace('0', 'O'),
      '.OWWWWOOWWWWO.',
      '.OWWWOYYOOWWO.',
      '.OWWOYYYYOWWO.',
      '.OWWWOOOOSSWO.',
      '..OWWSSSSWWO..',
      '...OORRRROO...',
      '.....OOOO.....',
      '..............',
      '..............',
    ],
  },
  beak_upg: {
    pal: { O: OUTLINE, Y: '#FACC15', H: '#FEF08A', D: '#D97706', S: '#E2E8F0' },
    rows: [
      '.......OOOO...',
      '.....OOYYYYOO.',
      '....OYYHHHHYYO',
      '...OYYYYYYYYO.',
      '..OSSYYYYDDO..',
      '.OSSSSYYDDO...',
      '.OSSSSOO......',
      '..OOOO........',
      '..............',
      '..............',
      '..............',
      '..............',
    ],
  },
  sparkle_upg: {
    pal: { O: OUTLINE, Y: '#FACC15', H: '#FEF9C3', C: '#38BDF8' },
    rows: [
      '......OO......',
      '.....OYYO.....',
      '.....OHHO.....',
      '..OO.OHHO.OO..',
      '.OYYHOHHHOYYO.',
      'OYHHHHHHHHHHYO',
      '.OYYHOHHHOYYO.',
      '..OO.OHHO.OO..',
      '.....OHHO.....',
      '.....OYYO.....',
      '......OO......',
      '..............',
    ],
  },
  flame_upg: {
    pal: { O: OUTLINE, R: '#EF4444', F: '#F97316', Y: '#FACC15', H: '#FEF08A' },
    rows: [
      '......OO......',
      '.....ORRO.....',
      '....ORFFRO....',
      '...ORFFYFRO...',
      '..ORFFYYFFRO..',
      '..ORFYYYYFRO..',
      '.ORFFYHHYFFRO.',
      '.ORFYYHHYYFRO.',
      '..ORFYYYYFRO..',
      '...OORFFROO...',
      '.....OOOO.....',
      '..............',
    ],
  },
  basket_upg: {
    pal: { O: OUTLINE, Y: '#FACC15', G: '#22C55E', B: '#D97706', D: '#92400E' },
    rows: [
      '...OO.OO.OO...',
      '..OYYOYYOYYO..',
      '.OGYYYYYYYYGO.',
      'OOOOOOOOOOOOOO',
      'OBDBDBDBDBDBDO',
      '.OBBDBDBDBBDO.',
      '.ODBBBBBBBBDO.',
      '..OBDBDBDBDO..',
      '...OOOOOOOO...',
      '..............',
      '..............',
      '..............',
    ],
  },
  farmhand_upg: {
    pal: {
      O: OUTLINE,
      H: '#D97706',
      R: '#EF4444',
      Y: '#FEF08A',
      L: '#FFFFFF',
      P: '#FB7185',
      B: '#F97316',
    },
    rows: [
      '....OOOOOO....',
      '...OHHHHHHO...',
      '.OOOOOOOOOOOO.',
      '.OHHHHRRHHHHO.',
      '..OYYYYYYYYO..',
      '.OYYLLYYLOYYO.',
      '.OYYYYYYOOYBBO',
      '.OYYYYPPYYYYO.',
      '..OYYYYYYYYO..',
      '...OOOOOOOO...',
      '....OB..BO....',
      '..............',
    ],
  },
  twin_beak_upg: {
    pal: { O: OUTLINE, Y: '#FACC15', H: '#FEF08A', D: '#D97706', S: '#E2E8F0', C: '#38BDF8' },
    rows: [
      '......OOOO....',
      '....OOYYYYOO..',
      '...OYYHHHHYYO.',
      '..OSSYYYYDDO..',
      '.OSSSSOOOOOO..',
      '..OOOOOOYYYYOO',
      '....OOYYHHHHYO',
      '...OCCYYYYDDO.',
      '..OCCCCYYDDO..',
      '..OCCCCOO.....',
      '...OOOO.......',
      '..............',
    ],
  },
  foreman_upg: {
    pal: { O: OUTLINE, R: '#EF4444', Y: '#FACC15', H: '#FEF08A', D: '#CA8A04', C: '#38BDF8' },
    rows: [
      '...OO.OO.OO...',
      '..ORRORRORRO..',
      '..ORRRRRRRRO..',
      '.OOOOOOOOOOOO.',
      '.OYYHHHHHHYYO.',
      '.OYHCCCCCCYHO.',
      '.OYYYYYYYYYYO.',
      '..OYYDDDDYYO..',
      '...OOYYYYOO...',
      '.....OOOO.....',
      '..............',
      '..............',
    ],
  },
  silo_upg: {
    pal: { O: OUTLINE, S: '#E2E8F0', Y: '#FACC15', R: '#DC2626', D: '#991B1B' },
    rows: [
      '....OOOOOO....',
      '..OOSSSSSSOO..',
      '.OSSYYYYYYSSO.',
      '.OOOOOOOOOOOO.',
      '..ORRRRRRRRO..',
      '..ORROYYORRO..',
      '..ORROYYORRO..',
      '..ORRDRRDRRO..',
      '..ORRRRRRRRO..',
      '.OODDDDDDDDOO.',
      '.OOOOOOOOOOOO.',
      '..............',
    ],
  },
  cornucopia_upg: {
    pal: { O: OUTLINE, B: '#D97706', D: '#92400E', Y: '#FACC15', H: '#FEF08A', G: '#4ADE80', C: '#38BDF8' },
    rows: [
      '.......OOOO...',
      '.....OOBBBBOO.',
      '...OOBBYYYYBBO',
      '..OBBYYDDDDYBO',
      '.OBBYDDOOOOBO.',
      '.OBYDOOGGYYOO.',
      '..OBOOYHYYGGO.',
      '...OOYYHHYCYO.',
      '....OGGYYYYOO.',
      '.....OOOOOOO..',
      '..............',
      '..............',
    ],
  },
  bolt_upg: {
    pal: { O: OUTLINE, Y: '#FACC15', H: '#FEF9C3', C: '#38BDF8' },
    rows: [
      '......OOOOO...',
      '.....OYYYYO...',
      '....OYYHHO....',
      '...OYYHHO.....',
      '..OYYYYYYYYO..',
      '..OOOOOYYHHO..',
      '.....OYYHHO...',
      '....OYYHO.....',
      '...OYYO.......',
      '...OOO........',
      '..............',
      '..............',
    ],
  },
  scope_upg: {
    pal: { O: OUTLINE, R: '#EF4444', C: '#38BDF8', W: '#F8FAFC' },
    rows: [
      '.....OOOO.....',
      '...OOCRRCOO...',
      '..OC..RR..CO..',
      '.OC...RR...CO.',
      '.ORRRRRRRRRRO.',
      '.ORRRRWWRRRRO.',
      '.OC...RR...CO.',
      '..OC..RR..CO..',
      '...OOCRRCOO...',
      '.....OOOO.....',
      '..............',
      '..............',
    ],
  },
  talon_upg: {
    pal: { O: OUTLINE, S: '#F8FAFC', G: '#94A3B8', R: '#EF4444' },
    rows: [
      '..OO..OO..OO..',
      '.OSSO.OSSOSSO.',
      '.OSSOOSSOOSSO.',
      '..OSSOSSOSSO..',
      '...OSSGGGSO...',
      '...ORRRRRRO...',
      '....ORRRRO....',
      '.....OOOO.....',
      '..............',
      '..............',
      '..............',
      '..............',
    ],
  },
  nest_upg: {
    pal: { O: OUTLINE, W: '#FFFBEB', Y: '#FACC15', B: '#B45309', D: '#78350F' },
    rows: [
      '....OO..OO....',
      '...OWWOOWWO...',
      '..OWWWYYWWWO..',
      '.OOOOOOOOOOOO.',
      'OBDBBBDDBBBDBO',
      'ODBBBBBBBBBBDO',
      '.OBDBBBDDBBDO.',
      '..OOOOOOOOOO..',
      '..............',
      '..............',
      '..............',
      '..............',
    ],
  },
  speed: {
    pal: { O: OUTLINE, G: '#4ADE80', H: '#BBF7D0' },
    rows: [
      '.OO...OO......',
      '.OGOO.OGOO....',
      '.OGHGOOGHGO...',
      '.OGHHGOGHHGO..',
      '.OGHHGOGHHGO..',
      '.OGHGOOGHGO...',
      '.OGOO.OGOO....',
      '.OO...OO......',
      '..............',
      '..............',
      '..............',
      '..............',
    ],
  },
  sound_on: {
    pal: { O: OUTLINE, W: '#F8FAFC', C: '#38BDF8' },
    rows: [
      '.....OO..OO...',
      '....OWO...OCO.',
      '..OOOWO.O..CO.',
      '.OWWWWO.OC.CO.',
      '.OWWWWO.OC.CO.',
      '..OOOWO.O..CO.',
      '....OWO...OCO.',
      '.....OO..OO...',
      '..............',
      '..............',
      '..............',
      '..............',
    ],
  },
  sound_off: {
    pal: { O: OUTLINE, W: '#94A3B8', R: '#EF4444' },
    rows: [
      '.....OO.......',
      '....OWO.OO..OO',
      '..OOOWO..ORRO.',
      '.OWWWWO...RRO.',
      '.OWWWWO..ORRO.',
      '..OOOWO.OO..OO',
      '....OWO.......',
      '.....OO.......',
      '..............',
      '..............',
      '..............',
      '..............',
    ],
  },
  rules: {
    pal: { O: OUTLINE, Y: '#FACC15', W: '#FFFBEB' },
    rows: [
      '....OOOOOO....',
      '...OYYYYYYO...',
      '...OYYOOYYO...',
      '......OOYYO...',
      '.....OYYYO....',
      '.....OYYO.....',
      '.....OOOO.....',
      '.....OYYO.....',
      '.....OOOO.....',
      '..............',
      '..............',
      '..............',
    ],
  },
  menu: {
    pal: { O: OUTLINE, Y: '#FACC15', W: '#F8FAFC' },
    rows: [
      '..............',
      '.OOOOOOOOOOOO.',
      '.OYYYYYYYYYYO.',
      '.OOOOOOOOOOOO.',
      '.OOOOOOOOOOOO.',
      '.OWWWWWWWWWWO.',
      '.OOOOOOOOOOOO.',
      '.OOOOOOOOOOOO.',
      '.OYYYYYYYYYYO.',
      '.OOOOOOOOOOOO.',
      '..............',
      '..............',
    ],
  },
  idle_chick: {
    pal: {
      O: OUTLINE,
      W: '#FEF2F2',
      H: '#FFFFFF',
      P: '#FECACA',
      D: '#DC2626',
      R: '#EF4444',
      Y: '#FDE047',
      B: '#FB923C',
      C: '#38BDF8',
    },
    rows: [
      '....OO....OO..',
      '...ORRO..OCCO.',
      '.OODDDDO..OO..',
      'ORDDDDDDO.....',
      '.OWWHWWWO.....',
      '.OWWWOWWYO....',
      '.OWRRWWWBO....',
      '..OPPPPWO.....',
      '...OWWWO......',
      '...OB.OB......',
      '...OO.OO......',
      '..............',
    ],
  },
  download_app: {
    pal: {
      O: OUTLINE,
      C: '#38BDF8',
      H: '#E0F2FE',
      G: '#4ADE80',
      Y: '#FACC15',
      D: '#1E293B',
    },
    rows: [
      '.....OOOO.....',
      '.....OGGO.....',
      '.....OGGO.....',
      '...OOOGGOOO...',
      '....OGGGGO....',
      '.....OGGO.....',
      '.OOOO.OO.OOOO.',
      '.OCHH....HHCO.',
      '.OCCDDDDDDCCO.',
      '.OCCYYYYYYCCO.',
      '.OOOOOOOOOOOO.',
      '..............',
    ],
  },
};

// ==================== 2. KAWAII PIXEL CHICKEN GENERATOR (34 ULTRA-CUTE BORBS + STAND!) ====================
export interface ChickenSpritePair {
  idle: HTMLCanvasElement;
  attack: HTMLCanvasElement;
  portraitUrl: string;
  lockedPortraitUrl: string;
}

export interface StandSpriteSet {
  normalIdle: HTMLCanvasElement;
  normalPunch: HTMLCanvasElement;
  requiemIdle: HTMLCanvasElement;
  requiemPunch: HTMLCanvasElement;
}

function drawStandSpiritPixelArt(requiem: boolean, punchFrame: boolean): HTMLCanvasElement {
  const c = makeCanvas(24, 22);
  const ctx = c.getContext('2d')!;
  const px = (x: number, y: number, col: string, pw = 1, ph = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, pw, ph);
  };

  const out = requiem ? '#3B0764' : '#2E1065';
  const body = requiem ? '#FACC15' : '#A855F7';
  const hi = requiem ? '#FEF9C3' : '#E9D5FF';
  const core = requiem ? '#38BDF8' : '#22D3EE';
  const gold = requiem ? '#FFFFFF' : '#FACC15';
  const fistCol = requiem ? '#FEF08A' : '#F0ABFC';

  // Floating astral aura particles
  px(2, 5, core, 1, 2);
  px(4, 2, gold, 1, 1);
  px(15, 2, core, 1, 1);

  // Wispy Ghostly Stand Tail tapering bottom-left
  px(3, 17, out, 4, 3);
  px(4, 15, out, 6, 4);
  px(4, 17, body, 3, 2);
  px(5, 15, body, 4, 3);
  px(6, 13, out, 7, 4);
  px(7, 13, body, 5, 3);

  // Heroic Astral Rooster-Spirit Torso & Head
  px(6, 6, out, 9, 8);
  px(5, 8, out, 11, 5);
  px(7, 7, body, 7, 6);
  px(8, 8, hi, 5, 3);

  // Blazing Swept Astral Rooster Crest / Star Crown
  px(7, 3, out, 7, 4);
  px(8, 2, core, 2, 4);
  px(10, 1, gold, 2, 5);
  px(12, 3, body, 2, 3);

  // Golden Shoulder Pauldrons & Chest Star Emblem
  px(5, 8, gold, 3, 2);
  px(13, 8, gold, 3, 2);
  px(10, 10, core, 2, 2);

  // Fierce Glowing Stand Eye + Forehead Circlet
  px(8, 6, gold, 6, 1);
  px(11, 7, out, 3, 2);
  px(12, 7, '#FFFFFF', 2, 1);
  px(11, 8, core, 2, 1);
  // Spirit Beak Crest
  px(14, 7, gold, 2, 2);

  if (!punchFrame) {
    // Raised Guarded Stand Fists
    px(14, 10, out, 4, 4);
    px(15, 11, fistCol, 2, 2);
    px(12, 12, out, 3, 3);
    px(13, 13, gold, 2, 1);
  } else {
    // Rapid Multi-Fist Astral Pixel Barrage + Speed Lines!
    px(14, 6, '#FFFFFF', 4, 1);
    px(15, 10, core, 4, 1);
    px(14, 14, '#FFFFFF', 4, 1);

    // Upper Punch Fist
    px(18, 4, out, 5, 4);
    px(19, 5, fistCol, 3, 2);
    px(21, 5, '#FFFFFF', 1, 1);

    // Mid Main Power Fist (furthest forward!)
    px(19, 9, out, 5, 4);
    px(20, 10, gold, 3, 2);
    px(22, 10, '#FFFFFF', 1, 1);

    // Lower Hook Fist
    px(17, 14, out, 5, 4);
    px(18, 15, fistCol, 3, 2);
    px(20, 15, core, 1, 1);
  }

  return c;
}

type ChickenBodyModel =
  | 'compact_chick'
  | 'tall_strider'
  | 'robed_arcanist'
  | 'booth_turret'
  | 'heavy_juggernaut'
  | 'biped_mecha'
  | 'levitating_mystic'
  | 'winged_celestial'
  | 'star_dreadnought'
  | 'serpentine_leviathan'
  | 'colossal_titan';

function getChickenBodyModel(typeId: ChickenTypeId): {
  model: ChickenBodyModel;
  w: number;
  h: number;
} {
  switch (typeId) {
    case 'bantam':
    case 'pecker':
    case 'sling_chick':
    case 'honey':
    case 'chilly':
    case 'ninja':
      return { model: 'compact_chick', w: 20, h: 20 };

    case 'boomerang':
    case 'ranger':
    case 'cactus_hen':
    case 'cowboy_desperado':
    case 'samurai_shogun':
    case 'tengu_shadow':
      return { model: 'tall_strider', w: 24, h: 26 };

    case 'alchemist':
    case 'wizard':
    case 'plague_doctor':
    case 'surge_oracle':
    case 'pharaoh_ra':
    case 'necro_lich':
      return { model: 'robed_arcanist', w: 24, h: 26 };

    case 'roost_beacon':
    case 'pirate':
    case 'bard':
    case 'brew_hen':
    case 'ramen_chef':
    case 'overclock_engie':
    case 'cyber_sniper':
    case 'storm_dj':
      return { model: 'booth_turret', w: 30, h: 30 };

    case 'lobber':
    case 'iron_spurs':
    case 'bastion_shield':
    case 'viking_jarl':
    case 'paladin_crusader':
    case 'oni_warlord':
      return { model: 'heavy_juggernaut', w: 30, h: 30 };

    case 'mecha':
    case 'tesla':
    case 'aegis_mech':
      return { model: 'biped_mecha', w: 30, h: 30 };

    case 'chrono':
    case 'stand_hen':
    case 'valkyrie':
    case 'idol_diva':
      return { model: 'levitating_mystic', w: 28, h: 30 };

    case 'phoenix':
    case 'astral_astrologer':
    case 'quasar':
    case 'archangel_seraph':
    case 'chronos_empress':
    case 'omega_god':
      return { model: 'winged_celestial', w: 36, h: 34 };

    case 'star_dread':
      return { model: 'star_dreadnought', w: 36, h: 34 };

    case 'leviathan_kraken':
    case 'abyss_wyrm':
      return { model: 'serpentine_leviathan', w: 36, h: 34 };

    case 'mech_zilla':
    case 'gaia_creator':
    case 'void_singularity':
    case 'golden_deity':
    case 'solar_emperor':
    case 'eternity_weaver':
    case 'complete_cluck':
      return { model: 'colossal_titan', w: 42, h: 40 };
  }
}

function drawChickenUnitPixelArt(typeId: ChickenTypeId, attackFrame: boolean): HTMLCanvasElement {
  const def = CHICKEN_DEFS[typeId];
  const { model, w, h } = getChickenBodyModel(typeId);
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;

  const px = (x: number, y: number, col: string, pw = 1, ph = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, pw, ph);
  };

  const shiftX = attackFrame ? 1 : 0;
  const hopY = attackFrame ? -1 : 0;

  // Head/torso anchor coordinates updated per model silhouette so hats/props/eyes align cleanly!
  let bx = 4 + shiftX;
  let by = 6 + hopY;
  let drawStandardBeakFace = false;

  // ==================== PART A: 12 DISTINCT SILHOUETTE & BODY CHASSIS BUILDERS ====================
  if (model === 'compact_chick') {
    // 20x20 Nimble Baby Chick Silhouette
    bx = 3 + shiftX;
    by = 6 + hopY;
    px(4, 17, 'rgba(15,23,42,0.34)', 11, 2);
    px(bx + 2, by + 9, '#FB923C', 2, 2);
    px(bx + 7, by + 9, '#FB923C', 2, 2);
    px(bx - 2, by + 3, OUTLINE, 3, 3);
    px(bx - 1, by + 4, def.accentColor, 2, 1);
    px(bx + 2, by, OUTLINE, 7, 9);
    px(bx + 1, by + 1, OUTLINE, 9, 7);
    px(bx, by + 2, OUTLINE, 11, 5);
    px(bx + 2, by + 1, def.featherColor, 7, 7);
    px(bx + 1, by + 2, def.featherColor, 9, 5);
    px(bx + 2, by + 6, def.bellyColor, 7, 2);
    px(bx + 3, by + 1, '#FFFFFF', 3, 1);
    // Wing
    px(bx + 1, by + (attackFrame ? 3 : 4), OUTLINE, 4, 3);
    px(bx + 2, by + (attackFrame ? 4 : 5), def.bellyColor, 2, 1);
    // Expressive Chick Face (Ninja gets stealth mask & sharp eyes!)
    if (typeId === 'ninja') {
      px(bx + 1, by + 4, '#1E293B', 9, 4);
      px(bx + 7, by + 2, '#FEF08A', 2, 2);
      px(bx + 8, by + 2, OUTLINE, 1, 1);
    } else {
      px(bx + 7, by + 2, OUTLINE, 2, 3);
      px(bx + 7, by + 2, '#FFFFFF', 1, 1);
      px(bx + 6, by + 5, '#FB7185', 2, 1);
      px(bx + 10, by + 3, OUTLINE, 3, 2);
      px(bx + 10, by + 3, '#FDE047', 2, 1);
      px(bx + 10, by + 4, '#F97316', 2, 1);
    }
  } else if (model === 'tall_strider') {
    // 24x26 Tall, Lean Upright Raptor / Marksman / Ronin Rooster!
    bx = 6 + shiftX;
    by = 6 + hopY;
    px(5, 23, 'rgba(15,23,42,0.36)', 13, 2);
    // Long athletic spurred rooster legs!
    px(bx + 2, 18 + hopY, OUTLINE, 2, 5);
    px(bx + 6, 18 + hopY, OUTLINE, 2, 5);
    px(bx + 2, 19 + hopY, '#F59E0B', 2, 4);
    px(bx + 6, 19 + hopY, '#F59E0B', 2, 4);
    px(bx + 1, 22 + hopY, '#F97316', 4, 1);
    px(bx + 5, 22 + hopY, '#F97316', 4, 1);
    // Dramatic 3-plume sweeping rooster tail!
    px(bx - 5, by + 4, OUTLINE, 6, 8);
    px(bx - 4, by + 5, def.accentColor, 4, 2);
    px(bx - 3, by + 7, def.featherColor, 4, 2);
    px(bx - 4, by + 9, def.accentColor, 3, 2);
    if (typeId === 'tengu_shadow') {
      // Wide dark crow wings on Crimson Tengu-Hen!
      px(bx - 5, by + 1, OUTLINE, 6, 11);
      px(bx - 4, by + 2, '#1E293B', 4, 9);
      px(bx - 3, by + 3, '#EF4444', 2, 5);
    }
    // Tall slender torso + proud neck
    if (typeId === 'cactus_hen') {
      // Spiky green ribbed Saguaro Cactus Body with desert arms!
      px(bx + 1, by, OUTLINE, 9, 13);
      px(bx + 2, by + 1, '#16A34A', 7, 11);
      px(bx + 4, by + 1, '#4ADE80', 1, 11);
      px(bx + 7, by + 1, '#15803D', 1, 11);
      // Left & right cactus arms!
      px(bx - 3, by + 4, OUTLINE, 4, 5);
      px(bx - 2, by + 5, '#16A34A', 3, 3);
      px(bx - 2, by + 2, '#22C55E', 2, 3);
    } else {
      px(bx + 1, by + 4, OUTLINE, 9, 9);
      px(bx + 2, by, OUTLINE, 7, 6);
      px(bx + 2, by + 5, def.featherColor, 7, 7);
      px(bx + 3, by + 1, def.featherColor, 5, 5);
      px(bx + 4, by + 7, def.bellyColor, 4, 4);
    }
    // Sharp angled hunter eye + pointed hawk beak!
    px(bx + 6, by + 2, '#0F172A', 3, 1); // fierce brow
    px(bx + 7, by + 3, typeId === 'tengu_shadow' ? '#EF4444' : OUTLINE, 2, 2);
    px(bx + 7, by + 3, '#FFFFFF', 1, 1);
    px(bx + 9, by + 3, OUTLINE, 4, 2);
    px(bx + 9, by + 3, '#FACC15', 3, 1);
    px(bx + 9, by + 4, '#EA580C', 2, 1);
  } else if (model === 'robed_arcanist') {
    // 24x26 Bell-Shaped Flowing Wizard / Priest / Lich Robe (touches ground, glowing arcane eyes!)
    bx = 5 + shiftX;
    by = 6 + hopY;
    px(3, 23, 'rgba(15,23,42,0.4)', 17, 2);
    const robeCol =
      typeId === 'wizard'
        ? '#581C87'
        : typeId === 'alchemist'
        ? '#065F46'
        : typeId === 'plague_doctor'
        ? '#0F172A'
        : typeId === 'surge_oracle'
        ? '#1E293B'
        : typeId === 'pharaoh_ra'
        ? '#1E3A8A'
        : '#111827';
    const trimCol =
      typeId === 'pharaoh_ra' || typeId === 'wizard'
        ? '#FACC15'
        : typeId === 'surge_oracle'
        ? '#22D3EE'
        : '#10B981';
    // Flared bell-robe skirt + ornate bottom rune hem!
    px(bx - 1, 16, OUTLINE, 15, 8);
    px(bx, 12, OUTLINE, 13, 5);
    px(bx + 2, by, OUTLINE, 9, 7);
    px(bx, 17, robeCol, 13, 6);
    px(bx + 1, 13, robeCol, 11, 4);
    px(bx, 21, trimCol, 13, 2);
    px(bx + 5, 14, trimCol, 3, 7); // central robe stole!
    // Shadowed hood face + glowing mystic eyes!
    px(bx + 3, by + 1, typeId === 'pharaoh_ra' ? def.featherColor : '#0F172A', 7, 5);
    const eyeGlow =
      typeId === 'surge_oracle'
        ? '#22D3EE'
        : typeId === 'wizard'
        ? '#E879F9'
        : typeId === 'pharaoh_ra'
        ? '#FEF08A'
        : '#34D399';
    px(bx + 7, by + 3, eyeGlow, 2, 2);
    if (typeId === 'plague_doctor') {
      // Iconic long curved Plague Doctor beak-mask!
      px(bx + 9, by + 3, OUTLINE, 6, 3);
      px(bx + 9, by + 3, '#E2E8F0', 5, 2);
      px(bx + 13, by + 5, '#94A3B8', 2, 1);
    } else {
      px(bx + 10, by + 4, '#FACC15', 2, 2);
    }
    // Outstretched casting sleeve
    px(bx + 8, 13 + hopY, OUTLINE, 6, 4);
    px(bx + 9, 14 + hopY, robeCol, 4, 2);
    px(bx + 12, 14 + hopY, trimCol, 1, 2);
  } else if (model === 'booth_turret') {
    // 30x30 Full Pixel Emplacement / Stall / Deck / DJ Stage with Operator Chicken Inside!
    bx = 8 + shiftX;
    by = 7 + hopY;
    px(3, 27, 'rgba(15,23,42,0.42)', 24, 2);
    // Operator Chicken upper bust inside the booth
    px(bx + 2, by + 2, OUTLINE, 10, 10);
    px(bx + 3, by + 3, def.featherColor, 8, 8);
    px(bx + 9, by + 5, OUTLINE, 2, 2);
    px(bx + 9, by + 5, '#FFFFFF', 1, 1);
    px(bx + 12, by + 6, '#F97316', 2, 2);
  } else if (model === 'heavy_juggernaut') {
    // 30x30 Hulking Broad-Shouldered Plate/Muscle Juggernaut!
    bx = 6 + shiftX;
    by = 7 + hopY;
    px(4, 27, 'rgba(15,23,42,0.42)', 21, 2);
    // Heavy armored greaves / war-boots
    px(bx + 2, 23, OUTLINE, 5, 5);
    px(bx + 10, 23, OUTLINE, 5, 5);
    px(bx + 3, 24, '#475569', 3, 3);
    px(bx + 11, 24, '#475569', 3, 3);
    // Broad 17px hulking chest + bulky shoulder pauldrons!
    px(bx, 12 + hopY, OUTLINE, 17, 12);
    px(bx - 2, 13 + hopY, OUTLINE, 5, 6);  // left pauldron
    px(bx + 14, 13 + hopY, OUTLINE, 5, 6); // right pauldron
    px(bx + 1, 13 + hopY, def.featherColor, 15, 10);
    px(bx - 1, 14 + hopY, def.accentColor, 3, 4);
    px(bx + 15, 14 + hopY, def.accentColor, 3, 4);
    px(bx + 3, 17 + hopY, def.bellyColor, 11, 5);
    // Armored head + fierce war-brow
    px(bx + 3, by, OUTLINE, 11, 8);
    px(bx + 4, by + 1, def.featherColor, 9, 6);
    px(bx + 9, by + 2, OUTLINE, 4, 1); // furrowed brow!
    px(bx + 10, by + 3, typeId === 'oni_warlord' ? '#FEF08A' : OUTLINE, 2, 2);
    px(bx + 13, by + 4, OUTLINE, 4, 3);
    px(bx + 13, by + 4, '#FACC15', 3, 2);
  } else if (model === 'biped_mecha') {
    // 30x30 Geometric Robotic Exosuit / Cyber-Mech Chassis (LED Visor, Shoulder Pods, Thruster Legs!)
    bx = 6 + shiftX;
    by = 6 + hopY;
    px(5, 27, 'rgba(15,23,42,0.42)', 19, 2);
    const chassis = typeId === 'aegis_mech' ? '#E2E8F0' : typeId === 'tesla' ? '#312E81' : '#334155';
    const core = typeId === 'aegis_mech' ? '#EF4444' : typeId === 'tesla' ? '#38BDF8' : '#22D3EE';
    // Twin hydraulic mech legs + cyan jet thrusters!
    px(bx + 2, 21, OUTLINE, 5, 7);
    px(bx + 10, 21, OUTLINE, 5, 7);
    px(bx + 3, 22, '#64748B', 3, 5);
    px(bx + 11, 22, '#64748B', 3, 5);
    if (attackFrame) {
      px(bx, 24, '#22D3EE', 2, 3);
    }
    // Angular armored mecha torso + glowing reactor core!
    px(bx, 12 + hopY, OUTLINE, 17, 10);
    px(bx + 1, 13 + hopY, chassis, 15, 8);
    px(bx + 6, 15 + hopY, OUTLINE, 5, 5);
    px(bx + 7, 16 + hopY, core, 3, 3);
    px(bx + 8, 17 + hopY, '#FFFFFF', 1, 1);
    // Squared robotic head + glowing horizontal cyber LED visor!
    px(bx + 3, by, OUTLINE, 11, 8);
    px(bx + 4, by + 1, chassis, 9, 6);
    px(bx + 5, by + 3, '#0F172A', 8, 3);
    px(bx + 6, by + 4, core, 7, 1);
    px(bx + 10, by + 4, '#FFFFFF', 2, 1);
  } else if (model === 'levitating_mystic') {
    // 28x30 Floating Mystic Hovering Mid-Air Above Glowing Ground Rune / Stage!
    const floatY = attackFrame ? -2 : 0;
    bx = 7 + shiftX;
    by = 6 + floatY;
    const runeCol =
      typeId === 'chrono'
        ? '#2DD4BF'
        : typeId === 'stand_hen'
        ? '#A855F7'
        : typeId === 'valkyrie'
        ? '#38BDF8'
        : '#EC4899';
    // Glowing ground magic seal / idol stage!
    px(4, 26, OUTLINE, 20, 3);
    px(5, 27, runeCol, 18, 1);
    px(9, 26, '#FEF08A', 10, 1);
    // Trailing sash / cape ribbons floating underneath
    px(bx - 2, by + 10, OUTLINE, 5, 7);
    px(bx - 1, by + 11, def.accentColor, 3, 5);
    // Graceful hovering body
    px(bx + 1, by + 2, OUTLINE, 11, 12);
    px(bx + 2, by + 3, def.featherColor, 9, 10);
    px(bx + 3, by + 9, def.bellyColor, 7, 4);
    drawStandardBeakFace = true;
  } else if (model === 'winged_celestial') {
    // 36x34 Grand Symmetrical Outspread Wingspan Celestial!
    const flap = attackFrame ? -2 : 0;
    bx = 12;
    by = 10 + hopY;
    px(8, 31, 'rgba(15,23,42,0.35)', 20, 2);
    const wOuter =
      typeId === 'phoenix'
        ? '#EA580C'
        : typeId === 'astral_astrologer'
        ? '#4338CA'
        : typeId === 'quasar'
        ? '#EC4899'
        : '#F59E0B';
    const wInner =
      typeId === 'phoenix'
        ? '#FACC15'
        : typeId === 'astral_astrologer'
        ? '#38BDF8'
        : typeId === 'quasar'
        ? '#67E8F9'
        : '#FFFFFF';
    // Massive left & right outspread wings spanning 34px!
    px(1, 8 + flap, OUTLINE, 12, 14);
    px(23, 8 + flap, OUTLINE, 12, 14);
    px(2, 9 + flap, wOuter, 10, 11);
    px(24, 9 + flap, wOuter, 10, 11);
    px(4, 11 + flap, wInner, 8, 7);
    px(24, 11 + flap, wInner, 8, 7);
    if (typeId === 'archangel_seraph') {
      // Extra upper & lower seraphim wing pairs (6 wings total!)
      px(3, 3 + flap, '#FEF08A', 9, 4);
      px(24, 3 + flap, '#FEF08A', 9, 4);
      px(4, 22, '#FDE047', 8, 5);
      px(24, 22, '#FDE047', 8, 5);
    }
    // Slender radiant celestial core body
    px(12, 10 + hopY, OUTLINE, 12, 16);
    px(13, 11 + hopY, def.featherColor, 10, 14);
    px(14, 18 + hopY, def.bellyColor, 8, 6);
    px(19, 13 + hopY, '#38BDF8', 2, 3);
    px(19, 13 + hopY, '#FFFFFF', 1, 1);
    px(23, 15 + hopY, '#FACC15', 3, 2);
  } else if (model === 'star_dreadnought') {
    // 36x34 Full Galactic Capital Battlecruiser Hull + Bridge Captain!
    px(4, 30, 'rgba(15,23,42,0.42)', 28, 3);
    // Twin cyan rear ion-engine plumes
    px(1, 19, '#0284C7', 4, 6);
    px(2, 20, '#67E8F9', 3, 4);
    if (attackFrame) px(0, 20, '#FFFFFF', 2, 4);
    // Armored steel star-cruiser hull (32px long!)
    px(4, 16, OUTLINE, 29, 12);
    px(5, 17, '#334155', 27, 10);
    px(6, 18, '#64748B', 24, 5);
    px(8, 24, '#0EA5E9', 18, 2); // glowing hull trench lights!
    // Twin forward red antimatter capital cannons!
    px(30, 18, OUTLINE, 6, 3);
    px(30, 23, OUTLINE, 6, 3);
    px(31, 19, '#F43F5E', 5, 1);
    px(31, 24, '#F43F5E', 5, 1);
    // Glass command dome + Captain Rooster on top!
    px(12, 7 + hopY, OUTLINE, 12, 10);
    px(13, 8 + hopY, '#BAE6FD', 10, 8);
    px(14, 10 + hopY, '#FFFFFF', 8, 6); // Captain inside dome
    px(19, 11 + hopY, OUTLINE, 2, 2);
    px(22, 12 + hopY, '#FACC15', 2, 2);
    bx = 13;
    by = 7 + hopY;
  } else if (model === 'serpentine_leviathan') {
    // 36x34 Coiled Sea-Kraken / Winged Elder Dragon!
    px(4, 30, 'rgba(15,23,42,0.45)', 28, 3);
    bx = 11 + shiftX;
    by = 7 + hopY;
    if (typeId === 'leviathan_kraken') {
      // 6 Writhing Bioluminescent Sea-Tentacles fanning across the base!
      for (let t = 0; t < 6; t++) {
        const tx0 = 3 + t * 5;
        const wave = (t + (attackFrame ? 1 : 0)) % 2;
        px(tx0, 22 + wave, OUTLINE, 5, 9);
        px(tx0 + 1, 23 + wave, '#0F766E', 3, 7);
        px(tx0 + 2, 24 + wave, '#22D3EE', 1, 5);
      }
      // Armored deep-sea Kraken mantle torso
      px(10, 8 + hopY, OUTLINE, 15, 16);
      px(11, 9 + hopY, '#115E59', 13, 14);
      px(13, 16 + hopY, '#5EEAD4', 9, 6);
      px(20, 12 + hopY, '#FEF08A', 3, 2); // glowing abyssal eye!
      px(24, 14 + hopY, '#22D3EE', 3, 2);
    } else {
      // Coiled Winged Abyssal Elder Dragon ('abyss_wyrm')!
      // Jagged dark-cyan dragon wings
      px(1, 5 + hopY, OUTLINE, 12, 16);
      px(2, 6 + hopY, '#0F172A', 10, 13);
      px(3, 8 + hopY, '#0891B2', 7, 8);
      // Coiled S-curve scaled dragon tail at base
      px(4, 22, OUTLINE, 22, 9);
      px(5, 23, '#1E293B', 20, 7);
      px(7, 25, '#22D3EE', 14, 2);
      // Muscular horned dragon torso & snout
      px(12, 8 + hopY, OUTLINE, 14, 16);
      px(13, 9 + hopY, '#1E293B', 12, 14);
      px(16, 15 + hopY, '#67E8F9', 7, 7); // glowing reactor chest!
      px(21, 11 + hopY, '#22D3EE', 3, 2);
      px(25, 12 + hopY, OUTLINE, 5, 4);
      px(25, 13 + hopY, '#334155', 4, 2);
    }
  } else if (model === 'colossal_titan') {
    // 42x40 Boss-Scale Colossal Mythic Titans & #55 The Complete Cluck!
    px(5, 36, 'rgba(15,23,42,0.46)', 32, 3);
    bx = 14 + shiftX;
    by = 10 + hopY;

    if (typeId === 'mech_zilla') {
      // 42x40 Towering Armored Kaiju with Sweeping Tail & 5 Glowing Dorsal Spines!
      // Sweeping armored Kaiju tail on left
      px(1, 26, OUTLINE, 14, 9);
      px(2, 27, '#1E293B', 12, 7);
      // 5 Jagged Cherenkov neon-cyan dorsal plates up the back!
      for (let s = 0; s < 5; s++) {
        px(8 + s, 8 + s * 4, OUTLINE, 6, 4);
        px(9 + s, 9 + s * 4, s % 2 === 0 ? '#22D3EE' : '#67E8F9', 4, 2);
      }
      // Massive Kaiju legs & clawed feet
      px(14, 28, OUTLINE, 7, 10);
      px(23, 28, OUTLINE, 7, 10);
      px(15, 29, '#334155', 5, 8);
      px(24, 29, '#334155', 5, 8);
      // Colossal hunched Kaiju torso & roaring jaws!
      px(13, 8 + hopY, OUTLINE, 17, 22);
      px(14, 9 + hopY, '#1E293B', 15, 20);
      px(20, 15 + hopY, '#0284C7', 7, 12);
      px(22, 16 + hopY, '#67E8F9', 4, 9);
      px(25, 10 + hopY, '#22D3EE', 3, 2); // glowing atomic eye
      px(29, 11 + hopY, OUTLINE, 7, 6);
      px(29, 12 + hopY, '#334155', 6, 2);
      px(30, 14 + hopY, '#67E8F9', 5, 2); // glowing atomic maw!
    } else if (typeId === 'gaia_creator') {
      // 42x40 Sprawling Blooming World-Tree Sanctuary!
      // Gnarled golden-bark trunk & crystal roots
      px(12, 24, OUTLINE, 18, 13);
      px(14, 25, '#92400E', 14, 11);
      px(19, 26, '#34D399', 4, 9); // glowing life-stream vein!
      // Lush 38px-wide Emerald World-Tree Canopy studded with blossoms!
      px(2, 3, OUTLINE, 38, 18);
      px(4, 4, '#15803D', 34, 15);
      px(7, 5, '#22C55E', 28, 11);
      px(6, 7, '#F472B6', 3, 3);
      px(32, 8, '#FACC15', 3, 3);
      px(11, 4, '#38BDF8', 3, 3);
      px(27, 5, '#E879F9', 3, 3);
      // Radiant Mother-Hen Spirit nestled in the heart of the tree!
      px(15, 12 + hopY, OUTLINE, 12, 13);
      px(16, 13 + hopY, '#ECFCCB', 10, 11);
      px(22, 15 + hopY, '#10B981', 2, 3);
      px(26, 17 + hopY, '#FACC15', 3, 2);
    } else if (typeId === 'void_singularity') {
      // 42x40 Giant Tilted Black-Hole Accretion Disk + Event-Horizon Entity!
      px(1, 18, OUTLINE, 40, 12);
      px(2, 19, '#EC4899', 38, 10);
      px(5, 20, '#A855F7', 32, 8);
      px(9, 21, '#22D3EE', 24, 6);
      px(13, 22, '#090D16', 16, 4);
      // Dark-star astral entity rising from the singularity core!
      px(14, 7 + hopY, OUTLINE, 14, 17);
      px(15, 8 + hopY, '#1E1B4B', 12, 15);
      px(17, 10 + hopY, '#090D16', 8, 10);
      px(22, 12 + hopY, '#F472B6', 3, 2);
      px(23, 12 + hopY, '#FFFFFF', 1, 1);
      px(27, 14 + hopY, '#22D3EE', 3, 2);
    } else if (typeId === 'golden_deity') {
      // 42x40 Olympian Golden Roost-Deity Enthroned on Billowing Clouds + Twin Obelisks!
      // Billowing white & gold divine clouds
      px(4, 26, OUTLINE, 34, 11);
      px(5, 27, '#FFFFFF', 32, 9);
      px(8, 32, '#FEF08A', 26, 3);
      // Twin floating golden sky-pillars on left & right!
      px(3, 8 + hopY, OUTLINE, 5, 16);
      px(34, 8 + hopY, OUTLINE, 5, 16);
      px(4, 9 + hopY, '#FACC15', 3, 14);
      px(35, 9 + hopY, '#FACC15', 3, 14);
      // Radiant golden deity body & winged sun-crest!
      px(13, 9 + hopY, OUTLINE, 16, 18);
      px(14, 10 + hopY, '#FEF9C3', 14, 16);
      px(16, 18 + hopY, '#FACC15', 10, 7);
      px(23, 13 + hopY, '#F43F5E', 2, 3);
      px(28, 15 + hopY, '#F59E0B', 3, 2);
    } else if (typeId === 'solar_emperor') {
      // 42x40 Blazing Concentric Dyson-Sphere Corona Ring + Armored Sol Monarch!
      px(3, 2, OUTLINE, 36, 34);
      px(5, 4, '#EA580C', 32, 30);
      px(8, 7, '#FACC15', 26, 24);
      px(11, 10, '#1E1B4B', 20, 18); // Dyson ring interior!
      // Armored Solar Emperor inside the Dyson star!
      px(14, 11 + hopY, OUTLINE, 14, 18);
      px(15, 12 + hopY, '#FFFBEB', 12, 16);
      px(16, 20 + hopY, '#F59E0B', 10, 7);
      px(23, 15 + hopY, '#FEF08A', 3, 2);
      px(27, 17 + hopY, '#EA580C', 3, 2);
    } else if (typeId === 'eternity_weaver') {
      // 42x40 Colossal Twin-Winged Astral Rift Wyrm!
      px(1, 4 + hopY, OUTLINE, 14, 24);
      px(27, 4 + hopY, OUTLINE, 14, 24);
      px(2, 5 + hopY, '#A855F7', 12, 11);
      px(28, 5 + hopY, '#22D3EE', 12, 11);
      px(3, 16 + hopY, '#EC4899', 10, 10);
      px(29, 16 + hopY, '#818CF8', 10, 10);
      // Coiled astral wyrm body
      px(13, 9 + hopY, OUTLINE, 16, 24);
      px(14, 10 + hopY, '#F5D0FE', 14, 22);
      px(16, 18 + hopY, '#67E8F9', 10, 12);
      px(23, 13 + hopY, '#A855F7', 3, 2);
      px(28, 15 + hopY, '#22D3EE', 4, 2);
    } else if (typeId === 'complete_cluck') {
      // 42x40 #55 THE COMPLETE CLUCK — Semicircular 9-Sword Floating Halo Fan + Rune Dais + Sovereign!
      // Engraved Teal & Gold Sovereign Rune Dais at base
      px(6, 31, OUTLINE, 30, 6);
      px(7, 32, '#0F766E', 28, 4);
      px(11, 33, '#2DD4BF', 20, 2);
      px(17, 32, '#FACC15', 8, 1);

      // Semicircular Floating Halo Fan of 9 Distinct Elemental Swords behind the Sovereign!
      const haloColors = [
        '#4ADE80',
        '#22D3EE',
        '#38BDF8',
        '#818CF8',
        '#FACC15',
        '#E879F9',
        '#F472B6',
        '#FB7185',
        '#2DD4BF',
      ];
      for (let s = 0; s < 9; s++) {
        const ang = Math.PI + (s / 8) * Math.PI; // 180 deg top semicircle!
        const r = attackFrame ? 16 : 15;
        const sx = Math.round(20 + Math.cos(ang) * r);
        const sy = Math.round(18 + Math.sin(ang) * r * 0.88);
        px(sx - 2, sy - 2, OUTLINE, 4, 5);
        px(sx - 1, sy - 1, haloColors[s], 2, 3);
        px(sx - 1, sy - 1, '#FFFFFF', 1, 1);
      }

      // Twin Crystalline Sovereign Wings
      px(4, 14 + hopY, OUTLINE, 10, 13);
      px(28, 14 + hopY, OUTLINE, 10, 13);
      px(5, 15 + hopY, '#2DD4BF', 8, 11);
      px(29, 15 + hopY, '#E879F9', 8, 11);
      px(7, 17 + hopY, '#FFFFFF', 5, 6);
      px(30, 17 + hopY, '#FFFFFF', 5, 6);

      // Ascended Sovereign Cluck Body
      px(13, 11 + hopY, OUTLINE, 15, 19);
      px(14, 12 + hopY, '#ECFDF5', 13, 17);
      px(16, 20 + hopY, '#99F6E4', 9, 8);
      px(23, 15 + hopY, '#0F172A', 2, 3);
      px(23, 15 + hopY, '#2DD4BF', 1, 2);
      px(27, 17 + hopY, '#FACC15', 4, 2);
    }
  }

  if (drawStandardBeakFace) {
    px(bx + 8, by + 4, OUTLINE, 2, 3);
    px(bx + 8, by + 4, '#FFFFFF', 1, 1);
    px(bx + 6, by + 7, '#FB7185', 2, 1);
    px(bx + 11, by + 5, OUTLINE, 3, 2);
    px(bx + 11, by + 5, '#FDE047', 2, 1);
    px(bx + 11, by + 6, '#F97316', 2, 1);
  }

  // ==================== PART B: 55 UNIT-SPECIFIC CRESTS, BOOTHS, WEAPONS & DETAILS ====================
  switch (typeId) {
    case 'bantam': {
      // Fierce crimson dojo headband + twin red boxing gloves!
      px(bx + 4, by - 2, '#EF4444', 3, 2);
      px(bx + 1, by + 1, '#DC2626', 9, 2);
      px(bx - 2, by, '#EF4444', 3, 2);
      px(bx + 10, by + 5, OUTLINE, 4, 4);
      px(bx + 11, by + 6, '#EF4444', 2, 2);
      break;
    }
    case 'pecker': {
      // Classic triple ruby rooster comb + golden kernel satchel!
      px(bx + 3, by - 3, OUTLINE, 5, 3);
      px(bx + 3, by - 2, '#EF4444', 5, 2);
      px(bx + 3, by + 6, '#CA8A04', 4, 2);
      break;
    }
    case 'sling_chick': {
      // Green backwards cap + carved wooden Y-slingshot!
      px(bx + 1, by - 2, '#16A34A', 8, 3);
      px(bx - 1, by - 1, '#15803D', 3, 2);
      px(bx + 11, by + 4, '#92400E', 2, 4);
      px(bx + 10, by + 2, '#B45309', 4, 2);
      px(bx + 11, by + 2, '#E2E8F0', 2, 2);
      break;
    }
    case 'honey': {
      // Straw sunbonnet + dripping golden honey-pot & dipper!
      px(bx + 1, by - 2, '#FACC15', 9, 3);
      px(bx + 3, by - 1, '#FB7185', 2, 2);
      px(bx + 10, by + 5, OUTLINE, 5, 5);
      px(bx + 11, by + 6, '#F59E0B', 3, 3);
      px(bx + 11, by + 5, '#FEF08A', 3, 1);
      break;
    }
    case 'boomerang': {
      // Bushman slouch hat + large curved hardwood boomerang!
      px(bx, by - 2, '#78350F', 11, 2);
      px(bx + 2, by - 4, '#92400E', 7, 2);
      px(bx + 10, by + 4, OUTLINE, 5, 6);
      px(bx + 11, by + 5, '#F59E0B', 3, 2);
      px(bx + 12, by + 7, '#D97706', 2, 2);
      break;
    }
    case 'chilly': {
      // Fuzzy winter parka hood + ice crystal wand!
      px(bx + 1, by - 2, '#38BDF8', 9, 3);
      px(bx + 2, by - 3, '#FFFFFF', 7, 1);
      px(bx + 1, by + 6, '#0284C7', 9, 2);
      px(bx + 11, by + 3, '#BAE6FD', 3, 5);
      break;
    }
    case 'alchemist': {
      // Brass lab goggles on hood + bubbling green acid flask!
      px(bx + 2, by - 2, '#065F46', 9, 3);
      px(bx + 4, by - 1, '#6EE7B7', 2, 2);
      px(bx + 7, by - 1, '#6EE7B7', 2, 2);
      px(bx + 13, 11 + hopY, OUTLINE, 5, 6);
      px(bx + 14, 13 + hopY, '#84CC16', 3, 3);
      px(bx + 15, 10 + hopY, '#BEF264', 2, 2);
      break;
    }
    case 'ranger': {
      // Feathered forest sniper cap + long-barrel scoped rifle!
      px(bx + 1, by - 2, '#15803D', 9, 3);
      px(bx + 7, by - 4, '#EF4444', 2, 2);
      px(bx + 6, by + 7, OUTLINE, 11, 3);
      px(bx + 7, by + 8, '#78350F', 5, 1);
      px(bx + 12, by + 8, '#94A3B8', 4, 1);
      px(bx + 10, by + 6, '#38BDF8', 3, 1);
      break;
    }
    case 'cactus_hen': {
      // Blooming pink desert flower crown atop ribbed saguaro body!
      px(bx + 3, by - 3, OUTLINE, 5, 3);
      px(bx + 4, by - 3, '#EC4899', 3, 2);
      px(bx + 5, by - 3, '#FEF08A', 1, 1);
      break;
    }
    case 'lobber': {
      // Heavy olive bombardier helm + big iron siege mortar barrel!
      px(bx + 2, by - 2, '#4D7C0F', 11, 4);
      px(bx + 15, 14, OUTLINE, 8, 9);
      px(bx + 16, 15, '#334155', 6, 7);
      px(bx + 17, 13, '#FDBA74', 4, 2);
      break;
    }
    case 'wizard': {
      // Tall crooked star-spangled archmage hat + lightning staff!
      px(bx, by - 1, '#581C87', 13, 2);
      px(bx + 2, by - 4, '#7E22CE', 9, 3);
      px(bx + 4, by - 6, '#A855F7', 5, 2);
      px(bx + 5, by - 3, '#FACC15', 2, 2);
      px(bx + 14, 7 + hopY, '#92400E', 2, 16);
      px(bx + 13, 5 + hopY, '#C084FC', 4, 4);
      px(bx + 14, 6 + hopY, '#FEF08A', 2, 2);
      break;
    }
    case 'roost_beacon': {
      // 2-Story Stone & Timber Watchtower Battlement + Signal Brazier!
      px(4, 16, OUTLINE, 22, 12);
      px(5, 17, '#78350F', 20, 10);
      px(5, 17, '#94A3B8', 4, 3);
      px(13, 17, '#94A3B8', 4, 3);
      px(21, 17, '#94A3B8', 4, 3);
      // Spinning cyan-gold signal beacon on roof post
      px(5, 5, OUTLINE, 5, 12);
      px(6, 6, '#B45309', 3, 10);
      px(4, 2, '#38BDF8', 7, 4);
      px(6, 3, '#FEF08A', 3, 2);
      break;
    }
    case 'ninja': {
      // Fluttering crimson shinobi scarf + oversized 4-point steel shuriken!
      px(bx - 3, by + 2, '#DC2626', 4, 2);
      px(bx + 11, by + 3, '#E2E8F0', 4, 4);
      px(bx + 12, by + 4, '#0F172A', 2, 2);
      break;
    }
    case 'pirate': {
      // Wooden Galleon Gunwale + Captain Tricorn + Heavy Broadside Naval Cannon!
      px(bx + 1, by - 1, '#0F172A', 11, 4);
      px(bx + 1, by - 1, '#FACC15', 11, 1);
      px(3, 18, OUTLINE, 24, 10);
      px(4, 19, '#78350F', 22, 8);
      px(5, 20, '#B45309', 20, 2);
      px(9, 23, '#FACC15', 3, 3); // brass porthole!
      // Iron naval cannon barrel sticking out right!
      px(18, 14, OUTLINE, 10, 6);
      px(19, 15, '#1E293B', 8, 4);
      px(20, 16, '#64748B', 6, 1);
      break;
    }
    case 'bard': {
      // Wide Fiesta Sombrero + Wooden Stage + Acoustic Guitar!
      px(bx - 2, by, '#E11D48', 16, 2);
      px(bx + 2, by - 3, '#FACC15', 8, 3);
      px(4, 20, OUTLINE, 22, 8);
      px(5, 21, '#92400E', 20, 6);
      px(14, 15, OUTLINE, 11, 6);
      px(15, 16, '#F59E0B', 6, 4);
      px(21, 17, '#78350F', 4, 2);
      break;
    }
    case 'brew_hen': {
      // Cozy Brick Espresso Bar Counter + Brass Espresso Machine + Steaming Mug!
      px(bx + 2, by - 1, '#78350F', 8, 3);
      px(3, 18, OUTLINE, 24, 10);
      px(4, 19, '#9A3412', 22, 8);
      px(4, 18, '#FDE68A', 22, 2); // wood countertop!
      px(19, 11, OUTLINE, 7, 7);
      px(20, 12, '#D97706', 5, 5);
      px(21, 8, '#FFFFFF', 2, 3); // rising steam!
      break;
    }
    case 'phoenix': {
      // Blazing triple-flame solar crest!
      px(15, 4 + hopY, '#EA580C', 6, 6);
      px(16, 2 + hopY, '#FACC15', 4, 6);
      px(17, 4 + hopY, '#FFFFFF', 2, 3);
      break;
    }
    case 'mecha': {
      // Twin shoulder rail-laser pods!
      px(bx - 3, 9 + hopY, OUTLINE, 6, 5);
      px(bx + 14, 9 + hopY, OUTLINE, 9, 5);
      px(bx + 15, 10 + hopY, '#0891B2', 7, 3);
      px(bx + 21, 10 + hopY, '#67E8F9', 2, 3);
      break;
    }
    case 'iron_spurs': {
      // Tall crimson punk mohawk + oversized spiked iron gauntlets!
      px(bx + 5, by - 5, OUTLINE, 5, 6);
      px(bx + 6, by - 4, '#F43F5E', 3, 5);
      px(bx + 3, by + 1, '#DC2626', 10, 2);
      px(bx + 15, 14 + hopY, OUTLINE, 7, 7);
      px(bx + 16, 15 + hopY, '#E11D48', 5, 5);
      px(bx + 21, 15 + hopY, '#FFFFFF', 2, 2);
      px(bx + 21, 18 + hopY, '#FFFFFF', 2, 2);
      break;
    }
    case 'ramen_chef': {
      // Authentic Ramen Stall Counter + Red Paper Lantern + Steaming Noodle Bowl!
      px(bx + 2, by, '#FFFFFF', 9, 2);
      px(bx + 5, by, '#EF4444', 3, 2);
      // Overhead stall roof & glowing red chochin lantern!
      px(3, 2, OUTLINE, 24, 4);
      px(4, 3, '#92400E', 22, 2);
      px(4, 6, OUTLINE, 5, 7);
      px(5, 7, '#EF4444', 3, 5);
      px(5, 9, '#FEF08A', 3, 1);
      // Wooden ramen bar & steaming tonkotsu bowl!
      px(3, 19, OUTLINE, 24, 9);
      px(4, 20, '#B45309', 22, 7);
      px(18, 14, OUTLINE, 8, 5);
      px(19, 15, '#DC2626', 6, 3);
      px(19, 15, '#FEF08A', 6, 1);
      break;
    }
    case 'bastion_shield': {
      // Cobalt crest + Colossal 9x16 Granite Fortress Tower-Shield!
      px(bx + 4, by - 3, '#2563EB', 7, 4);
      px(bx + 13, 9, OUTLINE, 10, 18);
      px(bx + 14, 10, '#CBD5E1', 8, 16);
      px(bx + 15, 12, '#3B82F6', 6, 12);
      px(bx + 17, 15, '#FEF08A', 2, 6);
      break;
    }
    case 'tesla': {
      // Twin Copper-Indigo Gigavolt Tesla Coils arcing electricity overhead!
      px(bx - 1, 4 + hopY, OUTLINE, 5, 8);
      px(bx + 13, 4 + hopY, OUTLINE, 5, 8);
      px(bx, 5 + hopY, '#6366F1', 3, 6);
      px(bx + 14, 5 + hopY, '#6366F1', 3, 6);
      px(bx + 3, 3 + hopY, '#38BDF8', 11, 2);
      px(bx + 6, 2 + hopY, '#FEF08A', 5, 1);
      break;
    }
    case 'cowboy_desperado': {
      // Wide Western Sheriff Hat + Red Bandana + Dual Silver Six-Shooters!
      px(bx - 2, by - 1, '#78350F', 13, 2);
      px(bx + 1, by - 4, '#92400E', 7, 3);
      px(bx + 4, by - 3, '#FACC15', 2, 2);
      px(bx + 1, by + 5, '#DC2626', 8, 2);
      px(bx + 10, by + 6, OUTLINE, 7, 3);
      px(bx + 11, by + 7, '#E2E8F0', 5, 1);
      break;
    }
    case 'surge_oracle': {
      // Twin cyan ritual horns + tall Rift-Surge Staff!
      px(bx + 1, by - 4, '#0F172A', 2, 4);
      px(bx + 9, by - 4, '#0F172A', 2, 4);
      px(bx + 1, by - 5, '#22D3EE', 2, 2);
      px(bx + 9, by - 5, '#22D3EE', 2, 2);
      px(bx + 14, 5 + hopY, '#1E293B', 2, 18);
      px(bx + 12, 3 + hopY, '#06B6D4', 6, 5);
      px(bx + 14, 4 + hopY, '#FFFFFF', 2, 3);
      break;
    }
    case 'viking_jarl': {
      // Horned Nordic Helm + Great Runeforged Bearded Frost-Axe!
      px(bx + 2, by - 3, '#64748B', 11, 4);
      px(bx - 1, by - 6, '#FEF3C7', 3, 4);
      px(bx + 13, by - 6, '#FEF3C7', 3, 4);
      px(bx + 16, 8, '#78350F', 2, 16);
      px(bx + 15, 8, OUTLINE, 7, 8);
      px(bx + 16, 9, '#38BDF8', 5, 6);
      px(bx + 18, 10, '#E0F2FE', 2, 4);
      break;
    }
    case 'chrono': {
      // Brass Clockwork Top-Hat + Floating Golden Hourglass!
      px(bx + 1, by - 5, '#78350F', 9, 6);
      px(bx - 1, by, '#92400E', 13, 1);
      px(bx + 4, by - 3, '#5EEAD4', 3, 2);
      px(bx + 13, by + 3, OUTLINE, 5, 7);
      px(bx + 14, by + 4, '#FACC15', 3, 5);
      px(bx + 15, by + 5, '#2DD4BF', 1, 3);
      break;
    }
    case 'overclock_engie': {
      // Industrial Dynamo Generator Console + Yellow Hard-Hat + Wrench!
      px(bx + 2, by - 1, '#FACC15', 9, 3);
      px(3, 18, OUTLINE, 24, 10);
      px(4, 19, '#334155', 22, 8);
      px(6, 21, '#0284C7', 7, 4);
      px(7, 22, '#38BDF8', 5, 2);
      px(19, 11, '#94A3B8', 3, 8);
      px(18, 10, '#E2E8F0', 5, 3);
      break;
    }
    case 'cyber_sniper': {
      // High-Tech Holo-Sniper Nest + Green Matrix Visor + Long Rail Barrel!
      px(bx + 7, by + 4, '#10B981', 6, 2);
      px(3, 19, OUTLINE, 25, 9);
      px(4, 20, '#0F172A', 23, 7);
      px(6, 21, '#10B981', 6, 4); // holo-monitor!
      px(16, 15, OUTLINE, 13, 4);
      px(17, 16, '#34D399', 11, 2);
      break;
    }
    case 'plague_doctor': {
      // Dark Apothecary Top-Hat + Bubbling Emerald Blight Censer!
      px(bx, by - 1, '#0F172A', 13, 2);
      px(bx + 2, by - 5, '#1E293B', 9, 4);
      px(bx + 2, by - 2, '#10B981', 9, 1);
      px(bx + 13, 10 + hopY, OUTLINE, 5, 6);
      px(bx + 14, 11 + hopY, '#10B981', 3, 4);
      break;
    }
    case 'aegis_mech': {
      // Golden V-Crest Antenna + Long High-Output Ion Buster Rifle!
      px(bx + 1, by - 4, '#FACC15', 4, 3);
      px(bx + 12, by - 4, '#FACC15', 4, 3);
      px(bx + 6, by - 3, '#EF4444', 5, 3);
      px(bx + 14, 14 + hopY, OUTLINE, 10, 5);
      px(bx + 15, 15 + hopY, '#2563EB', 6, 3);
      px(bx + 21, 15 + hopY, '#FB7185', 3, 3);
      break;
    }
    case 'pharaoh_ra': {
      // Royal Blue & Gold Striped Nemes Crown + Blazing Solar Ankh Scepter!
      px(bx, by - 3, '#2563EB', 13, 5);
      px(bx + 1, by - 2, '#FACC15', 11, 1);
      px(bx + 1, by, '#FACC15', 11, 1);
      px(bx + 14, 6 + hopY, '#FACC15', 2, 17);
      px(bx + 12, 4 + hopY, '#FEF08A', 6, 5);
      px(bx + 14, 6 + hopY, '#1E3A8A', 2, 2);
      break;
    }
    case 'samurai_shogun': {
      // Horned Crimson Kabuto Helm + Twin Drawn Crescent Katanas!
      px(bx, by - 2, '#991B1B', 11, 3);
      px(bx + 2, by - 5, '#FACC15', 7, 3);
      px(bx + 10, by + 4, OUTLINE, 8, 3);
      px(bx + 11, by + 5, '#F8FAFC', 6, 1);
      break;
    }
    case 'storm_dj': {
      // Neon Rave DJ Booth + Dual Turntables + Side Subwoofers + Headphones!
      px(bx + 1, by, '#22D3EE', 10, 2);
      px(bx + 7, by + 4, '#EC4899', 6, 2);
      px(2, 17, OUTLINE, 26, 11);
      px(3, 18, '#0F172A', 24, 9);
      // Left & right neon subwoofers + center vinyl decks!
      px(4, 19, '#EC4899', 5, 7);
      px(21, 19, '#EC4899', 5, 7);
      px(10, 19, '#22D3EE', 10, 4);
      px(12, 20, '#FEF08A', 6, 2);
      break;
    }
    case 'stand_hen': {
      // Star Crusader peaked Astral Cap + golden chain + guardian spirit sparkles!
      px(bx + 1, by - 2, '#1E1B4B', 10, 4);
      px(bx + 1, by - 2, '#FACC15', 10, 1);
      px(2, 6, '#C084FC', 2, 2);
      px(23, 5, '#FEF08A', 2, 2);
      break;
    }
    case 'paladin_crusader': {
      // Winged Silver Great-Helm + Sanctified Golden Warhammer!
      px(bx + 2, by - 3, '#E2E8F0', 11, 5);
      px(bx + 6, by - 3, '#F59E0B', 3, 5);
      px(bx + 16, 7, '#92400E', 2, 16);
      px(bx + 13, 6, OUTLINE, 8, 6);
      px(bx + 14, 7, '#FACC15', 6, 4);
      break;
    }
    case 'necro_lich': {
      // Bone Lich Crown + Floating Emerald Soul-Skull Lantern!
      px(bx + 1, by - 4, OUTLINE, 11, 5);
      px(bx + 2, by - 3, '#F8FAFC', 9, 3);
      px(bx + 4, by - 2, '#10B981', 2, 1);
      px(bx + 8, by - 2, '#10B981', 2, 1);
      px(bx + 13, 7 + hopY, '#059669', 5, 6);
      px(bx + 14, 8 + hopY, '#A7F3D0', 3, 4);
      break;
    }
    case 'oni_warlord': {
      // Twin Curved Golden Oni Horns + Colossal Spiked Iron Kanabo Club!
      px(bx + 2, by - 6, '#FACC15', 3, 6);
      px(bx + 10, by - 6, '#FACC15', 3, 6);
      px(bx + 16, 6, OUTLINE, 6, 17);
      px(bx + 17, 7, '#334155', 4, 15);
      px(bx + 21, 8, '#FACC15', 2, 2);
      px(bx + 21, 13, '#FACC15', 2, 2);
      px(bx + 21, 18, '#FACC15', 2, 2);
      break;
    }
    case 'valkyrie': {
      // Winged Asgard Diadem + Bifrost Spear!
      px(bx - 1, by - 3, '#FFFFFF', 4, 4);
      px(bx + 9, by - 3, '#FFFFFF', 4, 4);
      px(bx + 2, by - 1, '#FACC15', 8, 2);
      px(bx + 13, 5, '#D97706', 2, 18);
      px(bx + 12, 3, '#7DD3FC', 4, 5);
      break;
    }
    case 'idol_diva': {
      // Twin Ribbon Tails + Tiara + Star Microphone!
      px(bx, by - 2, '#EC4899', 3, 4);
      px(bx + 9, by - 2, '#EC4899', 3, 4);
      px(bx + 4, by - 3, '#FACC15', 4, 2);
      px(bx + 13, by + 4, '#F472B6', 4, 4);
      break;
    }
    case 'tengu_shadow': {
      // Crimson Tengu Brow Crest + Scarlet Odachi Blade!
      px(bx + 2, by - 4, '#DC2626', 6, 4);
      px(bx + 10, by + 5, OUTLINE, 8, 3);
      px(bx + 11, by + 6, '#EF4444', 6, 1);
      break;
    }
    case 'astral_astrologer': {
      // Starry Cosmic Hat + Orbiting Golden Astrolabe Ring!
      px(13, 3 + hopY, '#312E81', 10, 7);
      px(16, 1 + hopY, '#6366F1', 5, 3);
      px(26, 14 + hopY, '#FDE047', 6, 6);
      px(28, 16 + hopY, '#FFFFFF', 2, 2);
      break;
    }
    case 'star_dread': {
      // Fleet Admiral Crest on Command Dome + Twin Escort Drones!
      px(15, 4 + hopY, '#1E293B', 6, 3);
      px(15, 6 + hopY, '#FACC15', 6, 1);
      px(4, 5, '#94A3B8', 6, 3);
      px(6, 4, '#38BDF8', 2, 1);
      break;
    }
    case 'leviathan_kraken': {
      // Sea-Emperor Crown + Giant Abyssal Trident!
      px(13, 4 + hopY, '#22D3EE', 9, 4);
      px(27, 5, '#0EA5E9', 2, 22);
      px(24, 3, '#67E8F9', 8, 5);
      px(26, 3, '#0F172A', 1, 3);
      px(29, 3, '#0F172A', 1, 3);
      break;
    }
    case 'abyss_wyrm': {
      // Swept Elder-Dragon Horns + Blazing Abyssal Sphere!
      px(12, 3 + hopY, '#22D3EE', 4, 5);
      px(21, 3 + hopY, '#22D3EE', 4, 5);
      px(29, 13 + hopY, '#06B6D4', 6, 6);
      px(31, 15 + hopY, '#FFFFFF', 2, 2);
      break;
    }
    case 'quasar': {
      // Orbiting Twin Pulsar Rings!
      px(11, 5 + hopY, '#22D3EE', 14, 2);
      px(13, 3 + hopY, '#F472B6', 10, 2);
      break;
    }
    case 'archangel_seraph': {
      // Radiant Floating Halo + Heavenly Lance!
      px(13, 4 + hopY, '#FACC15', 10, 2);
      px(15, 4 + hopY, '#FFFFFF', 6, 1);
      px(28, 4, '#F59E0B', 2, 24);
      px(26, 2, '#FEF08A', 6, 5);
      break;
    }
    case 'chronos_empress': {
      // Celestial Clockwork Halo + Time-Spear!
      px(10, 3 + hopY, '#FACC15', 16, 3);
      px(17, 2 + hopY, '#38BDF8', 2, 3);
      px(28, 5, '#CA8A04', 2, 23);
      px(26, 3, '#FEF08A', 6, 4);
      break;
    }
    case 'omega_god': {
      // Crown of Genesis + Orbiting Sacred Golden Egg!
      px(13, 4 + hopY, '#FEF08A', 10, 3);
      px(27, 11 + hopY, OUTLINE, 6, 8);
      px(28, 12 + hopY, '#FACC15', 4, 6);
      px(29, 13 + hopY, '#38BDF8', 2, 2);
      break;
    }
    case 'mech_zilla': {
      // Charging Cherenkov Atomic Sphere in front of roaring jaws!
      px(34, 11 + hopY, '#0284C7', 7, 7);
      px(35, 12 + hopY, '#67E8F9', 5, 5);
      px(37, 14 + hopY, '#FFFFFF', 2, 2);
      break;
    }
    case 'gaia_creator': {
      // Floating Rainbow Creation Prism!
      px(30, 14 + hopY, '#F43F5E', 7, 7);
      px(31, 15 + hopY, '#38BDF8', 5, 5);
      px(32, 16 + hopY, '#FEF08A', 3, 3);
      break;
    }
    case 'void_singularity': {
      // Dark-Star Crown above Event Horizon!
      px(15, 3 + hopY, '#EC4899', 12, 3);
      px(18, 1 + hopY, '#22D3EE', 6, 2);
      break;
    }
    case 'golden_deity': {
      // Winged Golden Sun-Laurel Crown (zero cat ears!) + Divine Scepter!
      px(14, 4 + hopY, '#FACC15', 14, 5);
      px(19, 2 + hopY, '#FFFFFF', 4, 3);
      px(20, 5 + hopY, '#F43F5E', 2, 2);
      break;
    }
    case 'solar_emperor': {
      // 5-Spiked Sol Invictus Crown!
      px(15, 6 + hopY, '#FEF08A', 12, 4);
      px(20, 3 + hopY, '#FFFFFF', 2, 4);
      break;
    }
    case 'eternity_weaver': {
      // Twin Continuum Horns + Crossing Rift Glaive!
      px(14, 4 + hopY, '#22D3EE', 3, 5);
      px(25, 4 + hopY, '#E879F9', 3, 5);
      break;
    }
    case 'complete_cluck': {
      // Twin-Gem Sovereign Diadem + Forged Prismatic Infinity Greatsword!
      px(15, 7 + hopY, OUTLINE, 11, 4);
      px(16, 8 + hopY, '#FACC15', 9, 2);
      px(17, 6 + hopY, '#2DD4BF', 3, 2);
      px(21, 6 + hopY, '#E879F9', 3, 2);
      // Forged Infinity Greatsword held forward!
      px(29, 20 + hopY, '#FACC15', 6, 2);
      px(31, 8 + hopY, OUTLINE, 5, 13);
      px(32, 9 + hopY, '#2DD4BF', 3, 4);
      px(32, 13 + hopY, '#38BDF8', 3, 4);
      px(32, 17 + hopY, '#E879F9', 3, 3);
      px(33, 9 + hopY, '#FFFFFF', 1, 9);
      break;
    }
  }

  return c;
}

// ==================== 3. ENEMY PIXEL SPRITES (10 BUGS + 9 GIANT FOXES) ====================
export interface EnemySpriteSet {
  frames: [HTMLCanvasElement, HTMLCanvasElement];
  flashFrames: [HTMLCanvasElement, HTMLCanvasElement];
  portraitUrl: string;
}

function buildBugSprite(typeId: EnemyTypeId, frameIdx: 0 | 1): HTMLCanvasElement {
  const legShift = frameIdx === 0 ? 0 : 1;

  if (typeId === 'ant' || typeId === 'aphid') {
    const c1 = typeId === 'ant' ? '#EF4444' : '#3B82F6';
    const c2 = typeId === 'ant' ? '#991B1B' : '#1D4ED8';
    const hi = typeId === 'ant' ? '#FCA5A5' : '#93C5FD';
    return compileGridSprite(
      [
        legShift ? '..O..O..O...' : '.O..O..O....',
        '..OOOOOOOO..',
        '.O1121111HO.',
        '.O1121111EO.',
        '..OOOOOOOO..',
        legShift ? '.O..O..O....' : '..O..O..O...',
      ],
      { O: OUTLINE, '1': c1, '2': c2, H: hi, E: '#FFFFFF' }
    );
  }

  if (typeId === 'ladybug') {
    return compileGridSprite(
      [
        legShift ? '..O..O..O...' : '.O..O..O....',
        '..OOOOOOO...',
        '.ORRRRRROO..',
        'ORROORRRWW0.'.replace('0', 'O'),
        'ORRRRRRRWEO.',
        'ORROORRRRRO.',
        '.ORRRRRROO..',
        '..OOOOOOO...',
        legShift ? '.O..O..O....' : '..O..O..O...',
      ],
      { O: OUTLINE, R: '#F43F5E', W: '#F8FAFC', E: '#181425' }
    );
  }

  if (typeId === 'hornet') {
    const wingRow = frameIdx === 0 ? '...OOWWOO...' : '..OOWWWWOO..';
    return compileGridSprite(
      [
        wingRow,
        '....OWWO....',
        '.OOOOOOOOOO.',
        'OOYYBBYYBYYO',
        '..YYBBYYBYEO',
        '.OOOOOOOOOO.',
        '....OOOO....',
      ],
      { O: OUTLINE, Y: '#FACC15', B: '#1C1917', W: '#E0F2FE', E: '#EF4444' }
    );
  }

  if (typeId === 'camo_moth') {
    const wingTop = frameIdx === 0 ? '.OOOO..OOOO.' : '..OOOOOOOO..';
    return compileGridSprite(
      [
        wingTop,
        'OIPPIOOPPIPO',
        'OIPPPPPPPPIO',
        '.OOOOPPOOOO.',
        '..OIPPPPIO..',
        '...OOOOOO...',
      ],
      { O: OUTLINE, P: '#6366F1', I: '#A5B4FC' }
    );
  }

  if (typeId === 'beetle') {
    return compileGridSprite(
      [
        legShift ? '..O..OO..O....' : '.O..OO..O.....',
        '..OOOOOOOOOO..',
        '.OSSSSSSSSOO..',
        'OSSDSSSSSSSOOO',
        'OSSDDSSSSSS..O',
        'OSSDSSSSSSSOOO',
        '.OSSSSSSSSOO..',
        '..OOOOOOOOOO..',
        legShift ? '.O..OO..O.....' : '..O..OO..O....',
      ],
      { O: OUTLINE, S: '#64748B', D: '#CBD5E1' }
    );
  }

  if (typeId === 'firefly_wisp') {
    const wingRow = frameIdx === 0 ? '..OOWWOOWWOO..' : '...OOWWWWOO...';
    return compileGridSprite(
      [
        wingRow,
        '....OOWWOO....',
        '.OOOOOOOOOOOO.',
        'OYYYYFFFFDDDEO',
        'OHHHYFFFFDDDEO',
        '.OOOOOOOOOOOO.',
        '..............',
      ],
      { O: OUTLINE, Y: '#FACC15', H: '#FFFFFF', F: '#F97316', D: '#7C2D12', W: '#FEF9C3', E: '#38BDF8' }
    );
  }

  if (typeId === 'scorpion') {
    const tailTip = frameIdx === 0 ? '.ORRO.........' : '..ORRO........';
    return compileGridSprite(
      [
        tailTip,
        '.OPPPO........',
        '..OPPOOOOOOO..',
        '..OPPPPPPPPPOO',
        '..OPPDDPPPPPRR',
        '..OPPPPPPPPPOO',
        '..OOOOOOOOOO..',
        legShift ? '..O..O..O..O..' : '...O..O..O..O.',
      ],
      { O: OUTLINE, P: '#581C87', D: '#A855F7', R: '#EF4444' }
    );
  }

  if (typeId === 'void_scarab') {
    return compileGridSprite(
      [
        legShift ? '..O..OO..O....' : '.O..OO..O.....',
        '..OOOOOOOOOO..',
        '.OYYCCCCCCYYO.',
        'OYCCICCCCCICYO',
        'OYCCIIYYYYCCEO',
        'OYCCICCCCCICYO',
        '.OYYCCCCCCYYO.',
        '..OOOOOOOOOO..',
        legShift ? '.O..OO..O.....' : '..O..OO..O....',
      ],
      { O: OUTLINE, C: '#0891B2', I: '#67E8F9', Y: '#FACC15', E: '#FFFFFF' }
    );
  }

  // Emerald Mantis
  return compileGridSprite(
    [
      legShift ? '...O...O....OO' : '..O...O....OO.',
      '..OOOOOOOOOO..',
      '.OGGGGGGGGGGO.',
      'OGGLLGGGGGGGEO',
      '.OGGGGGGGGGGO.',
      '..OOOOOOOOOOO.',
      '..........OGGO',
      legShift ? '..O...O...OO..' : '...O...O..OO..',
    ],
    { O: OUTLINE, G: '#10B981', L: '#6EE7B7', E: '#FEF08A' }
  );
}

function buildFoxBossSprite(typeId: EnemyTypeId, frameIdx: 0 | 1): HTMLCanvasElement {
  const step = frameIdx === 0 ? 0 : 1;

  // Bespoke Winged Solar Phoenix Fox (30x14 pixel art with flapping Flame Wings!)
  if (typeId === 'fox_phoenix') {
    const wingTop = step
      ? '..........OOYYYYOO..OO..OO....'
      : '........OOYYYYYYOO..OO..OO....';
    const wingMid = step
      ? '........OOYYFFFFYYOOFFOOFFO...'
      : '.......OYYFFFFFFFFYYFFOOFFO...';
    return compileGridSprite(
      [
        wingTop,
        wingMid,
        '.OOOO....OFFFFFFFFFFFFLLFFFO..',
        'OYYYYFOO..OFFFFYYFFFFLLLLLLFFO',
        'OWWYYFFFOOOFFFFYYYYFFLLFEWLLFO',
        '.OYYYYFFFFFFFFFYYYYFFFFFWWFFO.',
        '..OFFYYYYFFFFFFFFFFFFFFFWWWW0.'.replace('0', 'O'),
        '...OOFFFFFFFFYYYYYYFFFFFFFOO..',
        '.....OOOOOFFFFWWWWWWFFFFOO....',
        '..........OOOOOOOOOOOOOO......',
        step ? '........OO..OO......OO..OO....' : '.........OO..OO....OO..OO.....',
        step ? '........OYY.OYY.....OYY.OYY...' : '.........OYY.OYY...OYY.OYY....',
      ],
      {
        O: OUTLINE,
        F: '#EA580C',
        L: '#F97316',
        Y: '#FACC15',
        W: '#FEF9C3',
        E: '#38BDF8',
      }
    );
  }

  // Bespoke Galaxy-Devouring Nebula Cosmic Fox (32x14 pixel art with Saturn Halo & Starfield!)
  if (typeId === 'fox_cosmic') {
    return compileGridSprite(
      [
        '...............OCCCCCCCO........',
        '.............OOCCYYYYYCCOO......',
        '.OOOO........OC..OFFO.OFFOC.....',
        'OCCPPFOO........OFFLLLLLFFO.....',
        'OSWPPPFFOO.....OFFLLSLFEWLLFO...',
        '.OCCPPPFFFOOOOOFFFMPMMPFFWWFFO..',
        '..OPPPPSPPPPPPPPMMSMMMMPFFFFCC0.'.replace('0', 'O'),
        '...OOPPPPPPPPPPPMMMMMMMMPPPFOO..',
        '.....OOOOOPPPPPCCCCCCCCPPPOO....',
        '..........OOOOOOOOOOOOOOOO......',
        step ? '........OO..OO......OO..OO......' : '.........OO..OO....OO..OO.......',
        step ? '........OCC.OCC.....OCC.OCC.....' : '.........OCC.OCC...OCC.OCC......',
      ],
      {
        O: OUTLINE,
        P: '#312E81',
        F: '#4C1D95',
        L: '#7E22CE',
        M: '#A855F7',
        C: '#22D3EE',
        Y: '#FACC15',
        S: '#FFFFFF',
        W: '#F0ABFC',
        E: '#FEF08A',
      }
    );
  }

  const pal: Record<string, string> = {
    O: OUTLINE,
    F: '#EA580C',
    L: '#FB923C',
    W: '#FFF7ED',
    E: '#FEF08A',
    A: '#94A3B8',
    C: '#FACC15',
  };

  if (typeId === 'fox_timber') {
    pal.F = '#7C2D12';
    pal.L = '#9A3412';
    pal.W = '#CBD5E1';
  } else if (typeId === 'fox_phantom') {
    pal.F = '#0F172A';
    pal.L = '#0284C7';
    pal.W = '#67E8F9';
    pal.E = '#F43F5E';
    pal.C = '#22D3EE';
  } else if (typeId === 'fox_kitsune') {
    pal.F = '#7E22CE';
    pal.L = '#A855F7';
    pal.W = '#F5D0FE';
    pal.E = '#38BDF8';
  } else if (typeId === 'fox_frost') {
    pal.F = '#0284C7';
    pal.L = '#38BDF8';
    pal.W = '#FFFFFF';
    pal.E = '#FEF08A';
    pal.C = '#BAE6FD';
  } else if (typeId === 'fox_alpha') {
    pal.F = '#B91C1C';
    pal.L = '#EF4444';
    pal.W = '#FEF08A';
    pal.E = '#38BDF8';
  } else if (typeId === 'fox_mecha') {
    pal.F = '#334155';
    pal.L = '#64748B';
    pal.W = '#22D3EE';
    pal.E = '#10B981';
    pal.C = '#F43F5E';
  }

  const hasCrown = typeId === 'fox_alpha' || typeId === 'fox_frost' || typeId === 'fox_mecha';
  const crownRow = hasCrown
    ? '.................OC.OC.OCO..'
    : '..................OO...OO...';
  const earRow = hasCrown
    ? '.................OCCCCCCC0..'.replace('0', 'O')
    : '.................OFFO.OFFO..';
  pal.M =
    typeId === 'fox_timber' || typeId === 'fox_alpha'
      ? '#94A3B8'
      : typeId === 'fox_mecha'
      ? '#10B981'
      : typeId === 'fox_frost'
      ? '#E0F2FE'
      : pal.L;

  const legRow1 = step
    ? '.......OO..OO......OO..OO...'
    : '........OO..OO....OO..OO....';
  const legRow2 = step
    ? '.......OFO.OFO.....OFO.OFO..'
    : '........OFO.OFO...OFO.OFO...';

  return compileGridSprite(
    [
      crownRow,
      earRow,
      '.OOOO...........OFFFLLLFFFO.',
      'OWWWFOO........OFFLLLLLLLFFO',
      'OWWWWFFOO.....OFFLLLLFEWLLFO',
      '.OWWWWFFFOOOOOFFFMMMMFFWWFFO',
      '..OFFFFFFFFFFFMMMMMMMFFFFWW0'.replace('0', 'O'),
      '...OOFFFFFFFFMMMMMMMMFFFFOO.',
      '.....OOOOOFFFFWWWWWWFFFOO...',
      '..........OOOOOOOOOOOOO.....',
      legRow1,
      legRow2,
    ],
    pal
  );
}

// ==================== 4. HENHOUSE CLICKER PIXEL SCENE (40x22, ULTRA-CUTE MAMA BORB!) ====================
function buildHenhouseScene(pecking: boolean): HTMLCanvasElement {
  const c = makeCanvas(40, 22);
  const ctx = c.getContext('2d')!;
  const px = (x: number, y: number, col: string, w = 1, h = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };

  // Cozy woven straw nest cushion under Mama Hen
  px(2, 16, OUTLINE, 20, 4);
  px(3, 17, '#D97706', 18, 2);
  px(5, 16, '#FACC15', 14, 1);

  // Ultra-plump Round Mama Borb (leans right & squishes happily when pecking!)
  const hx = pecking ? 7 : 4;
  const hy = pecking ? 6 : 5;

  // Fluffy tail poof
  px(hx - 2, hy + 5, OUTLINE, 3, 4);
  px(hx - 1, hy + 6, '#FDE68A', 2, 2);

  // Rounded marshmallow borb body
  px(hx + 3, hy + 1, OUTLINE, 8, 11);
  px(hx + 1, hy + 2, OUTLINE, 12, 9);
  px(hx, hy + 4, OUTLINE, 14, 6);
  px(hx + 3, hy + 2, '#FFFBEB', 8, 9);
  px(hx + 2, hy + 3, '#FFFBEB', 10, 7);
  px(hx + 1, hy + 4, '#FFFBEB', 12, 5);
  px(hx + 4, hy + 2, '#FFFFFF', 5, 1); // glossy crown highlight
  px(hx + 2, hy + 8, '#FDE68A', 10, 2);

  // Cute stubby wing
  px(hx + 3, hy + (pecking ? 5 : 6), OUTLINE, 5, 4);
  px(hx + 4, hy + (pecking ? 6 : 7), '#FEF3C7', 3, 2);

  // Bouncy ruby heart-comb on head
  px(hx + 4, hy - 1, '#EF4444', 2, 2);
  px(hx + 7, hy - 1, '#EF4444', 2, 2);
  px(hx + 5, hy, '#FB7185', 3, 2);

  // Kawaii Eye (sparkly 2x3 idle, happy ^_^ squint + floating pink heart when pecking!)
  if (pecking) {
    px(hx + 9, hy + 5, OUTLINE, 3, 1);
    px(hx + 9, hy + 6, OUTLINE, 1, 1);
    px(hx + 11, hy + 6, OUTLINE, 1, 1);
    // Tiny pink pixel heart above Mama Hen!
    px(hx + 1, hy - 3, '#FB7185', 1, 2);
    px(hx + 3, hy - 3, '#FB7185', 1, 2);
    px(hx + 2, hy - 2, '#FB7185', 1, 2);
  } else {
    px(hx + 9, hy + 4, OUTLINE, 2, 3);
    px(hx + 9, hy + 4, '#FFFFFF', 1, 1);
  }

  // Rosy strawberry cheek blush + cute chirp beak!
  px(hx + 7, hy + 7, '#FB7185', 2, 1);
  px(hx + 13, hy + 5, OUTLINE, 3, 2);
  px(hx + 13, hy + 5, '#FDE047', 2, 1);
  px(hx + 13, hy + 6, '#F97316', 2, 1);

  // Giant Golden Pixel Corn Cob on right!
  const cx = pecking ? 25 : 26;
  px(cx, 5, OUTLINE, 9, 13);
  px(cx + 1, 6, '#FACC15', 7, 10);
  px(cx + 2, 7, '#FEF08A', 2, 7);
  px(cx + 5, 8, '#CA8A04', 2, 7);
  // Green husk leaves at bottom
  px(cx - 1, 13, '#15803D', 3, 5);
  px(cx + 7, 13, '#15803D', 3, 5);
  px(cx + 1, 15, '#22C55E', 7, 3);

  // Peck impact pixel sparks!
  if (pecking) {
    px(22, 6, '#FEF08A', 2, 2);
    px(23, 13, '#FACC15', 2, 2);
  }
  return c;
}

// ==================== 4.5. GEM EGG CUTSCENE PIXEL SPRITES (4 STAGES: WHOLE -> CRACK 1 -> CRACK 2 -> BURST!) ====================
function buildGemEggStageSprite(stage: 0 | 1 | 2 | 3): HTMLCanvasElement {
  const c = makeCanvas(36, 40);
  const ctx = c.getContext('2d')!;
  const px = (x: number, y: number, col: string, w = 1, h = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };

  // Ambient sparkles around the Gem Egg
  px(5, 8, '#22D3EE', 2, 2);
  px(29, 7, '#FACC15', 2, 2);
  px(4, 28, '#F472B6', 2, 2);
  px(30, 26, '#4ADE80', 2, 2);

  if (stage === 3) {
    // Stage 3: SHATTERED SHELL BURST! Top & bottom crystal shell halves blown apart + radiant starburst!
    // Blinding central light core
    px(11, 12, '#FEF9C3', 14, 14);
    px(8, 15, '#FACC15', 20, 8);
    px(14, 9, '#38BDF8', 8, 20);
    px(13, 14, '#FFFFFF', 10, 10);

    // Top shattered shell cap flying up-left/right
    px(11, 2, OUTLINE, 14, 8);
    px(12, 3, '#EC4899', 6, 6);
    px(18, 3, '#A855F7', 6, 6);
    px(14, 4, '#FFFFFF', 3, 2);
    px(13, 8, '#FACC15', 10, 2);

    // Bottom shattered shell bowl with jagged rim
    px(9, 28, OUTLINE, 18, 9);
    px(10, 29, '#7E22CE', 16, 7);
    px(11, 29, '#22D3EE', 5, 4);
    px(20, 30, '#EC4899', 5, 4);
    px(12, 34, '#FACC15', 12, 2);

    // Flying crystal shards
    px(3, 14, OUTLINE, 4, 4);
    px(4, 15, '#22D3EE', 2, 2);
    px(29, 13, OUTLINE, 4, 4);
    px(30, 14, '#EC4899', 2, 2);
    px(5, 22, '#FACC15', 3, 2);
    px(28, 21, '#A855F7', 3, 2);
    return c;
  }

  // Pedestal shadow
  px(10, 36, 'rgba(15,23,42,0.55)', 16, 3);

  // Intact / Cracking Faceted Crystal Gem Egg Silhouette (ovoid 22x30 centered at x=7..28, y=5..34)
  px(14, 5, OUTLINE, 8, 31);
  px(11, 7, OUTLINE, 14, 27);
  px(9, 10, OUTLINE, 18, 22);
  px(8, 14, OUTLINE, 20, 15);

  // Faceted Crystal Shell Base Colors (Magenta -> Amethyst -> Cyan facets)
  px(14, 6, '#EC4899', 8, 29);
  px(12, 8, '#D946EF', 12, 25);
  px(10, 11, '#A855F7', 16, 20);
  px(9, 15, '#7E22CE', 18, 13);

  // Upper-left specular crystal shine
  px(12, 9, '#F9A8D4', 5, 7);
  px(13, 10, '#FFFFFF', 3, 4);

  // Ornate Golden Filigree Belt & Embedded Gems!
  px(9, 19, '#CA8A04', 18, 4);
  px(10, 20, '#FACC15', 16, 2);
  // Center Diamond Gem
  px(16, 17, OUTLINE, 4, 8);
  px(17, 18, '#22D3EE', 2, 6);
  px(17, 19, '#FFFFFF', 1, 2);
  // Side Emerald & Ruby Studs
  px(11, 19, '#4ADE80', 2, 3);
  px(23, 19, '#F43F5E', 2, 3);

  if (stage >= 1) {
    // Stage 1+: Jagged Hairline Cracks spiderwebbing across shell!
    px(15, 11, OUTLINE, 2, 3);
    px(17, 13, OUTLINE, 2, 3);
    px(14, 15, OUTLINE, 3, 2);
    px(19, 23, OUTLINE, 2, 4);
    px(16, 26, OUTLINE, 3, 3);
    px(15, 12, '#FEF08A', 1, 2);
    px(17, 14, '#FEF08A', 1, 2);
    px(19, 24, '#22D3EE', 1, 3);
  }

  if (stage >= 2) {
    // Stage 2: Deep Blazing Energy Fissures + Escaping Light Rays!
    px(13, 11, '#FFFFFF', 2, 4);
    px(15, 14, '#FEF08A', 4, 3);
    px(18, 16, '#22D3EE', 4, 3);
    px(12, 23, '#FEF08A', 4, 3);
    px(16, 25, '#FFFFFF', 4, 4);
    // Light rays shooting outward from cracks!
    px(4, 12, '#FEF08A', 5, 2);
    px(27, 15, '#22D3EE', 6, 2);
    px(5, 24, '#F472B6', 5, 2);
    px(26, 25, '#FEF08A', 6, 2);
  }

  return c;
}

// ==================== 5. SINGLETON PIXEL ATLAS ====================
export class PixelSpriteAtlas {
  private iconUrls = new Map<PixelIconId, string>();
  private chickenSprites = new Map<ChickenTypeId, ChickenSpritePair>();
  private enemySprites = new Map<EnemyTypeId, EnemySpriteSet>();
  public standSprites: StandSpriteSet | null = null;
  public henhouseIdleUrl = '';
  public henhousePeckUrl = '';
  public gemEggStageUrls: [string, string, string, string] = ['', '', '', ''];

  constructor() {
    if (typeof document === 'undefined') return;

    // Bake UI Icons at 2x crisp pixel scale (28x24)
    for (const id of Object.keys(UI_ICON_GRIDS) as PixelIconId[]) {
      const spec = UI_ICON_GRIDS[id];
      const canvas = compileGridSprite(spec.rows, spec.pal, 2);
      this.iconUrls.set(id, canvas.toDataURL());
    }

    // Bake Astral Stand Spirit sprites (Star Feather & Golden Requiem!)
    this.standSprites = {
      normalIdle: drawStandSpiritPixelArt(false, false),
      normalPunch: drawStandSpiritPixelArt(false, true),
      requiemIdle: drawStandSpiritPixelArt(true, false),
      requiemPunch: drawStandSpiritPixelArt(true, true),
    };

    // Bake all 55 variable-sized Chicken Unit sprites (20x20 up to 42x40) + crisp 2x square portraits!
    for (const id of Object.keys(CHICKEN_DEFS) as ChickenTypeId[]) {
      const idle = drawChickenUnitPixelArt(id, false);
      const attack = drawChickenUnitPixelArt(id, true);
      const pDim = Math.max(idle.width, idle.height) * 2;
      const portraitCanvas = makeCanvas(pDim, pDim);
      const pCtx = portraitCanvas.getContext('2d')!;
      if (id === 'stand_hen' && this.standSprites) {
        pCtx.save();
        pCtx.globalAlpha = 0.85;
        pCtx.drawImage(this.standSprites.normalIdle, 0, 2, 42, 38);
        pCtx.restore();
        pCtx.drawImage(
          idle,
          Math.floor((pDim - idle.width * 2) / 2) + 4,
          Math.floor((pDim - idle.height * 2) / 2) + 2,
          idle.width * 2 - 4,
          idle.height * 2 - 4
        );
      } else {
        pCtx.drawImage(
          idle,
          Math.floor((pDim - idle.width * 2) / 2),
          Math.floor((pDim - idle.height * 2) / 2),
          idle.width * 2,
          idle.height * 2
        );
      }

      const lockedCanvas = makeFlashSprite(portraitCanvas, '#0F172A');
      this.chickenSprites.set(id, {
        idle,
        attack,
        portraitUrl: portraitCanvas.toDataURL(),
        lockedPortraitUrl: lockedCanvas.toDataURL(),
      });
    }

    // Bake all 19 Enemy sprites (10 Bugs + 9 Giant Foxes) + hit-flash silhouettes + 2x portraits
    const bugIds: EnemyTypeId[] = [
      'ant',
      'aphid',
      'ladybug',
      'hornet',
      'camo_moth',
      'beetle',
      'mantis',
      'firefly_wisp',
      'scorpion',
      'void_scarab',
    ];
    for (const id of bugIds) {
      const f0 = buildBugSprite(id, 0);
      const f1 = buildBugSprite(id, 1);
      const pCan = makeCanvas(f0.width * 2, f0.height * 2);
      pCan.getContext('2d')!.drawImage(f0, 0, 0, f0.width * 2, f0.height * 2);
      this.enemySprites.set(id, {
        frames: [f0, f1],
        flashFrames: [makeFlashSprite(f0), makeFlashSprite(f1)],
        portraitUrl: pCan.toDataURL(),
      });
    }

    const foxIds: EnemyTypeId[] = [
      'fox_scout',
      'fox_timber',
      'fox_phantom',
      'fox_kitsune',
      'fox_frost',
      'fox_alpha',
      'fox_mecha',
      'fox_phoenix',
      'fox_cosmic',
    ];
    for (const id of foxIds) {
      const f0 = buildFoxBossSprite(id, 0);
      const f1 = buildFoxBossSprite(id, 1);
      const pCan = makeCanvas(f0.width * 2, f0.height * 2);
      pCan.getContext('2d')!.drawImage(f0, 0, 0, f0.width * 2, f0.height * 2);
      this.enemySprites.set(id, {
        frames: [f0, f1],
        flashFrames: [makeFlashSprite(f0), makeFlashSprite(f1)],
        portraitUrl: pCan.toDataURL(),
      });
    }

    // Bake Henhouse Clicker centerpiece frames (upscaled 3x -> 120x66 crisp PNGs)
    const idleRaw = buildHenhouseScene(false);
    const peckRaw = buildHenhouseScene(true);
    const idleUp = makeCanvas(120, 66);
    idleUp.getContext('2d')!.drawImage(idleRaw, 0, 0, 120, 66);
    const peckUp = makeCanvas(120, 66);
    peckUp.getContext('2d')!.drawImage(peckRaw, 0, 0, 120, 66);
    this.henhouseIdleUrl = idleUp.toDataURL();
    this.henhousePeckUrl = peckUp.toDataURL();

    // Bake 4 Gem Egg Cutscene Stage Sprites (upscaled 3x -> 108x120 crisp PNGs)
    const stages: [string, string, string, string] = ['', '', '', ''];
    for (const s of [0, 1, 2, 3] as const) {
      const raw = buildGemEggStageSprite(s);
      const up = makeCanvas(raw.width * 3, raw.height * 3);
      up.getContext('2d')!.drawImage(raw, 0, 0, up.width, up.height);
      stages[s] = up.toDataURL();
    }
    this.gemEggStageUrls = stages;
  }

  public getIconUrl(id: PixelIconId): string {
    return this.iconUrls.get(id) ?? '';
  }

  public getChickenSprite(id: ChickenTypeId): ChickenSpritePair | undefined {
    return this.chickenSprites.get(id);
  }

  public getEnemySprite(id: EnemyTypeId): EnemySpriteSet | undefined {
    return this.enemySprites.get(id);
  }
}

export const PIXEL_ATLAS = new PixelSpriteAtlas();
