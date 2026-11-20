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

type MochiBorbSize = 'petite' | 'classic' | 'king';

interface ChickenSpriteLayout {
  w: number;
  h: number;
  borb: MochiBorbSize;
  bx: number;
  by: number;
  hideFeet?: boolean;
}

function getChickenSpriteLayout(typeId: ChickenTypeId): ChickenSpriteLayout {
  switch (typeId) {
    // 1. Classic 22x22 Brawler Bantam (100% original reference!)
    case 'bantam':
      return { w: 22, h: 22, borb: 'classic', bx: 4, by: 7 };

    // 2. Petite Round Mochi-Chicks (20x20)
    case 'pecker':
    case 'sling_chick':
    case 'honey':
    case 'chilly':
    case 'ninja':
      return { w: 20, h: 20, borb: 'petite', bx: 4, by: 7 };

    // 3. Classic Round Mochi-Borbs with Tall Hats, Capes & Weapons (26x26)
    case 'boomerang':
    case 'alchemist':
    case 'ranger':
    case 'cactus_hen':
    case 'wizard':
    case 'phoenix':
    case 'iron_spurs':
    case 'cowboy_desperado':
    case 'viking_jarl':
    case 'chrono':
    case 'plague_doctor':
    case 'samurai_shogun':
    case 'necro_lich':
    case 'tengu_shadow':
      return { w: 26, h: 26, borb: 'classic', bx: 6, by: 9 };

    // 4. Classic Round Mochi-Borbs in Cozy Stalls, Open-Top Walkers & Turrets (30x28)
    case 'mecha':
    case 'aegis_mech':
    case 'brew_hen':
    case 'ramen_chef':
      return { w: 30, h: 28, borb: 'classic', bx: 8, by: 8, hideFeet: true };

    case 'lobber':
    case 'roost_beacon':
    case 'pirate':
    case 'bard':
    case 'bastion_shield':
    case 'tesla':
    case 'surge_oracle':
    case 'overclock_engie':
    case 'cyber_sniper':
    case 'pharaoh_ra':
    case 'storm_dj':
    case 'stand_hen':
    case 'paladin_crusader':
    case 'idol_diva':
      return { w: 30, h: 28, borb: 'classic', bx: 8, by: 10 };

    // 5. Grand Winged, Cloud-Riding & Seafaring Round Mochi-Borbs (34x32)
    case 'oni_warlord':
      return { w: 34, h: 32, borb: 'king', bx: 8, by: 11 };

    case 'valkyrie':
    case 'astral_astrologer':
    case 'star_dread':
    case 'leviathan_kraken':
    case 'abyss_wyrm':
    case 'quasar':
    case 'archangel_seraph':
    case 'chronos_empress':
    case 'omega_god':
      return { w: 34, h: 32, borb: 'classic', bx: 10, by: 11 };

    // 6. Chubby King-Borb Mythic Titans (38x36 — extra-plump round mochi-borb!)
    case 'mech_zilla':
    case 'gaia_creator':
    case 'void_singularity':
    case 'malevolent_chicken':
    case 'limitless_chicken':
    case 'golden_deity':
    case 'solar_emperor':
    case 'eternity_weaver':
    case 'complete_cluck':
      return { w: 38, h: 36, borb: 'king', bx: 10, by: 12 };
  }
}

function drawChickenUnitPixelArt(typeId: ChickenTypeId, attackFrame: boolean): HTMLCanvasElement {
  const def = CHICKEN_DEFS[typeId];
  const layout = getChickenSpriteLayout(typeId);
  const { w, h, borb } = layout;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;

  const px = (x: number, y: number, col: string, pw = 1, ph = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, pw, ph);
  };

  const shiftX = attackFrame ? 1 : 0;
  const hopY = attackFrame ? -1 : 0;
  const bx = layout.bx + shiftX;
  const by = layout.by + hopY;
  const borbW = borb === 'petite' ? 11 : borb === 'king' ? 17 : 13;

  // ==================== 1. GROUND SHADOW & UNDER-BORB PEDESTALS / MOUNTS ====================
  px(
    Math.floor((w - (borbW + 2)) / 2),
    h - 3,
    'rgba(15,23,42,0.34)',
    borbW + 2,
    2
  );

  // Cute bases, rune circles, clouds, waves & open-top walker legs drawn UNDER the round chicken!
  if (typeId === 'wizard') {
    px(4, 22, '#7E22CE', 18, 2);
    px(6, 22, '#E879F9', 14, 1);
  } else if (typeId === 'surge_oracle') {
    px(5, 23, '#0E7490', 20, 2);
    px(8, 23, '#67E8F9', 14, 1);
  } else if (typeId === 'roost_beacon') {
    // Cozy wooden watchtower platform under the round chicken
    px(5, 21, OUTLINE, 20, 5);
    px(6, 22, '#92400E', 18, 3);
    px(6, 22, '#D97706', 18, 1);
  } else if (typeId === 'tesla') {
    // Copper & cobalt Tesla coil base pad
    px(5, 22, OUTLINE, 20, 4);
    px(6, 23, '#334155', 18, 2);
    px(9, 23, '#38BDF8', 12, 1);
  } else if (typeId === 'paladin_crusader') {
    // Golden radiant sanctuary seal on ground
    px(5, 23, '#B45309', 20, 2);
    px(8, 23, '#FEF08A', 14, 1);
  } else if (typeId === 'idol_diva') {
    // Starry pastel idol stage cushion
    px(5, 22, OUTLINE, 20, 4);
    px(6, 23, '#BE185D', 18, 2);
    px(8, 23, '#F9A8D4', 14, 1);
  } else if (typeId === 'mecha' || typeId === 'aegis_mech') {
    // Chibi open-top walker legs & seat rim underneath the round chicken!
    const legCol = typeId === 'mecha' ? '#0891B2' : '#2563EB';
    const trimCol = typeId === 'mecha' ? '#67E8F9' : '#FACC15';
    px(8, 19, OUTLINE, 4, 7);
    px(9, 20, legCol, 2, 5);
    px(17, 19, OUTLINE, 4, 7);
    px(18, 20, legCol, 2, 5);
    px(6, 16, OUTLINE, 17, 5);
    px(7, 17, '#334155', 15, 3);
    px(9, 18, trimCol, 11, 1);
  } else if (typeId === 'astral_astrologer') {
    // Fluffy golden-white star cloud under the round chicken!
    px(6, 22, OUTLINE, 22, 6);
    px(7, 23, '#E0E7FF', 20, 4);
    px(9, 22, '#FFFFFF', 16, 3);
    px(12, 24, '#FDE047', 2, 2);
    px(20, 24, '#38BDF8', 2, 2);
  } else if (typeId === 'star_dread') {
    // Cute flying saucer bridge deck under the round captain chicken!
    px(4, 21, OUTLINE, 26, 6);
    px(5, 22, '#334155', 24, 4);
    px(7, 23, '#38BDF8', 20, 2);
    px(10, 23, '#FEF08A', 3, 1);
    px(16, 23, '#F43F5E', 3, 1);
    px(22, 23, '#FEF08A', 3, 1);
  } else if (typeId === 'leviathan_kraken') {
    // Cresting turquoise ocean wave + cute curling tentacles under the round chicken!
    px(4, 21, OUTLINE, 26, 7);
    px(5, 22, '#0F766E', 24, 5);
    px(6, 22, '#22D3EE', 22, 2);
    px(8, 21, '#E0F2FE', 6, 1);
    px(18, 21, '#E0F2FE', 6, 1);
  } else if (typeId === 'golden_deity') {
    // Fluffy divine golden cloud cushion under the chubby King-Borb!
    px(5, 26, OUTLINE, 28, 7);
    px(6, 27, '#FACC15', 26, 5);
    px(8, 26, '#FEF9C3', 22, 4);
    px(10, 27, '#FFFFFF', 18, 2);
  } else if (typeId === 'malevolent_chicken') {
    // Cursed crimson & bleached-bone Domain seal beneath Malevolent Chicken!
    px(6, 29, OUTLINE, 26, 4);
    px(7, 30, '#450A0A', 24, 2);
    px(9, 30, '#E11D48', 20, 1);
    px(7, 28, '#F8FAFC', 2, 2);
    px(29, 28, '#F8FAFC', 2, 2);
  } else if (typeId === 'limitless_chicken') {
    // Shimmering Six-Eyes Azure & White Infinity spatial horizon ring under Limitless Chicken!
    px(5, 29, OUTLINE, 28, 4);
    px(6, 30, '#0284C7', 26, 2);
    px(8, 30, '#38BDF8', 22, 1);
    px(12, 30, '#FFFFFF', 14, 1);
  }

  // ==================== 2. BACK-LAYER WINGS, CAPES, TREES & SWORD HALOS ====================
  if (typeId === 'phoenix') {
    px(bx - 4, by + 1, OUTLINE, 6, 8);
    px(bx - 3, by + 2, '#EA580C', 4, 6);
    px(bx - 2, by + 3, '#FACC15', 3, 4);
  } else if (typeId === 'viking_jarl') {
    // Cozy snow-wolf fur cape behind the round borb
    px(bx - 3, by + 2, OUTLINE, 5, 8);
    px(bx - 2, by + 3, '#CBD5E1', 3, 6);
  } else if (typeId === 'tengu_shadow') {
    // Fluttering crimson tengu feather cloak
    px(bx - 4, by + 1, OUTLINE, 6, 9);
    px(bx - 3, by + 2, '#DC2626', 4, 7);
    px(bx - 2, by + 3, '#FCA5A5', 2, 4);
  } else if (typeId === 'paladin_crusader') {
    px(bx - 4, by + 2, OUTLINE, 6, 8);
    px(bx - 3, by + 3, '#F8FAFC', 4, 6);
    px(bx - 3, by + 7, '#F59E0B', 4, 2);
  } else if (typeId === 'valkyrie') {
    // Fluffy sky-blue & white feathered valkyrie wings!
    px(bx - 6, by - 1, OUTLINE, 8, 11);
    px(bx - 5, by, '#FFFFFF', 6, 5);
    px(bx - 5, by + 5, '#7DD3FC', 5, 4);
    px(bx + 11, by, OUTLINE, 6, 8);
    px(bx + 12, by + 1, '#E0F2FE', 4, 6);
  } else if (typeId === 'archangel_seraph') {
    // Grand 6-winged golden-white seraphim pinions behind the round borb!
    px(bx - 7, by - 2, OUTLINE, 9, 13);
    px(bx - 6, by - 1, '#FFFFFF', 7, 4);
    px(bx - 6, by + 3, '#FEF08A', 7, 4);
    px(bx - 5, by + 7, '#F59E0B', 6, 3);
    px(bx + 11, by - 1, OUTLINE, 7, 10);
    px(bx + 12, by, '#FFFFFF', 5, 4);
    px(bx + 12, by + 4, '#FEF08A', 5, 4);
  } else if (typeId === 'abyss_wyrm') {
    // Wide obsidian & glowing cyan dragon wings behind the round borb!
    px(bx - 7, by - 2, OUTLINE, 9, 12);
    px(bx - 6, by - 1, '#0F172A', 7, 10);
    px(bx - 5, by + 1, '#22D3EE', 5, 6);
    px(bx + 11, by - 1, OUTLINE, 7, 10);
    px(bx + 12, by, '#0F172A', 5, 8);
    px(bx + 12, by + 2, '#06B6D4', 3, 4);
  } else if (typeId === 'quasar') {
    // Glowing pastel nebula halo ring behind the round borb!
    px(bx - 5, by - 2, '#7E22CE', 23, 14);
    px(bx - 3, by, '#22D3EE', 19, 10);
    px(bx - 2, by + 1, '#1E1B4B', 17, 8);
  } else if (typeId === 'chronos_empress') {
    // Radiant golden clockwork sun-wheel behind the round borb!
    px(bx - 5, by - 3, OUTLINE, 23, 15);
    px(bx - 4, by - 2, '#FACC15', 21, 13);
    px(bx - 2, by, '#1E293B', 17, 9);
    px(bx + 6, by - 4, '#FEF08A', 2, 3);
    px(bx - 6, by + 4, '#FEF08A', 3, 2);
  } else if (typeId === 'omega_god') {
    // Luminous golden-white Genesis wings!
    px(bx - 7, by - 2, OUTLINE, 9, 12);
    px(bx - 6, by - 1, '#FEF08A', 7, 10);
    px(bx - 4, by + 1, '#FFFFFF', 5, 6);
    px(bx + 11, by - 1, OUTLINE, 7, 10);
    px(bx + 12, by, '#FEF08A', 5, 8);
  } else if (typeId === 'mech_zilla') {
    // Cute glowing neon-cyan crystal dorsal fins along the chubby King-Borb's back!
    px(bx - 5, by + 1, OUTLINE, 6, 4);
    px(bx - 4, by + 2, '#22D3EE', 4, 2);
    px(bx - 6, by + 5, OUTLINE, 7, 4);
    px(bx - 5, by + 6, '#67E8F9', 5, 2);
    px(bx - 5, by + 9, OUTLINE, 6, 4);
    px(bx - 4, by + 10, '#06B6D4', 4, 2);
  } else if (typeId === 'gaia_creator') {
    // Lush emerald World-Tree canopy & pink sakura blossoms behind the round King-Borb!
    px(3, 3, OUTLINE, 32, 16);
    px(4, 4, '#15803D', 30, 14);
    px(6, 5, '#22C55E', 26, 10);
    px(7, 6, '#F472B6', 3, 3);
    px(15, 4, '#F9A8D4', 3, 3);
    px(26, 6, '#FACC15', 3, 3);
    px(22, 9, '#F472B6', 2, 2);
  } else if (typeId === 'void_singularity') {
    // Back half of tilted magenta-cyan cosmic Saturn ring!
    px(2, by + 3, OUTLINE, 34, 7);
    px(3, by + 4, '#A855F7', 32, 5);
    px(5, by + 5, '#22D3EE', 28, 3);
  } else if (typeId === 'malevolent_chicken') {
    // Jagged flickering black-and-crimson King-of-Curses flame wisps behind the King-Borb!
    // Left flame wisp tapering upward to a sharp tip
    px(6, 7, OUTLINE, 2, 3);
    px(5, 10, OUTLINE, 4, 4);
    px(4, 13, OUTLINE, 6, 9);
    px(6, 8, '#E11D48', 1, 3);
    px(5, 11, '#991B1B', 3, 10);
    px(6, 13, '#FB7185', 2, 6);
    // Right flame wisp tapering upward to a sharp tip
    px(29, 6, OUTLINE, 2, 3);
    px(28, 9, OUTLINE, 4, 4);
    px(27, 12, OUTLINE, 6, 10);
    px(29, 7, '#E11D48', 1, 3);
    px(28, 10, '#991B1B', 3, 11);
    px(28, 12, '#FB7185', 2, 6);
  } else if (typeId === 'limitless_chicken') {
    // Hovering Lapse Blue (left) & Reversal Red (right) Limitless spheres behind shoulders!
    px(3, 10, OUTLINE, 7, 7);
    px(4, 11, '#0284C7', 5, 5);
    px(5, 12, '#38BDF8', 3, 3);
    px(5, 12, '#FFFFFF', 1, 1);
    px(27, 9, OUTLINE, 7, 7);
    px(28, 10, '#DC2626', 5, 5);
    px(29, 11, '#FB7185', 3, 3);
    px(29, 11, '#FFFFFF', 1, 1);
  } else if (typeId === 'golden_deity') {
    // Radiant golden sun-mandala halo behind the round King-Borb!
    px(4, 4, OUTLINE, 28, 20);
    px(5, 5, '#FACC15', 26, 18);
    px(7, 7, '#FEF08A', 22, 14);
    px(9, 9, '#FFFFFF', 18, 10);
  } else if (typeId === 'solar_emperor') {
    // Blazing 8-rayed solar corona flare behind the round King-Borb!
    px(3, 4, OUTLINE, 30, 22);
    px(4, 5, '#EA580C', 28, 20);
    px(6, 7, '#FACC15', 24, 16);
    px(9, 10, '#FEF08A', 18, 10);
  } else if (typeId === 'eternity_weaver') {
    // Prismatic astral butterfly-dragon wings behind the round King-Borb!
    px(2, 6, OUTLINE, 10, 20);
    px(3, 7, '#A855F7', 8, 9);
    px(3, 16, '#22D3EE', 8, 9);
    px(5, 9, '#F472B6', 5, 6);
    px(25, 7, OUTLINE, 9, 16);
    px(26, 8, '#A855F7', 7, 7);
    px(26, 15, '#22D3EE', 7, 7);
  } else if (typeId === 'complete_cluck') {
    // Iconic Fan of 7 Floating Prismatic Swords radiating behind the round King-Borb!
    const fanCols = ['#4ADE80', '#22D3EE', '#38BDF8', '#FACC15', '#F472B6', '#C084FC', '#FB7185'];
    const fanPos = [
      [3, 14],
      [4, 9],
      [8, 5],
      [15, 2],
      [22, 5],
      [27, 9],
      [29, 14],
    ];
    for (let i = 0; i < fanPos.length; i++) {
      const [fx, fy] = fanPos[i];
      px(fx - 1, fy - 1, OUTLINE, 5, 8);
      px(fx, fy, fanCols[i], 3, 6);
      px(fx + 1, fy, '#FFFFFF', 1, 4);
    }
  }

  // ==================== 3, 4, 5, 6. ROUND, PLUMP, SQUISHY MOCHI-BORB BODY ====================
  // Every single Chicken unit uses the adorable Brawler-Bantam round mochi-borb silhouette!
  const wingY =
    borb === 'petite'
      ? by + (attackFrame ? 3 : 4)
      : borb === 'king'
      ? by + (attackFrame ? 5 : 6)
      : by + (attackFrame ? 4 : 5);

  if (borb === 'petite') {
    if (!layout.hideFeet) {
      px(bx + 2, by + 9, '#FB923C', 2, 2);
      px(bx + 7, by + 9, '#FB923C', 2, 2);
    }
    const tailY = by + (attackFrame ? 2 : 3);
    px(bx - 2, tailY, OUTLINE, 3, 4);
    px(bx - 1, tailY + 1, def.accentColor, 2, 2);
    px(bx - 1, tailY + 1, def.featherColor, 1, 1);

    // 11x9 Round Baby Mochi-Borb
    px(bx + 3, by, OUTLINE, 5, 9);
    px(bx + 1, by + 1, OUTLINE, 9, 7);
    px(bx, by + 2, OUTLINE, 11, 5);

    px(bx + 3, by + 1, def.featherColor, 5, 7);
    px(bx + 2, by + 2, def.featherColor, 7, 5);
    px(bx + 1, by + 3, def.featherColor, 9, 3);
    px(bx + 3, by + 1, '#FFFFFF', 3, 1);
    px(bx + 2, by + 6, def.bellyColor, 7, 1);
    px(bx + 3, by + 7, def.bellyColor, 5, 1);

    px(bx + 1, wingY, OUTLINE, 4, 3);
    px(bx + 2, wingY + 1, def.bellyColor, 2, 1);
  } else if (borb === 'classic') {
    // 13x11 Classic Brawler-Bantam Mochi-Borb (100% exact pixel match!)
    if (!layout.hideFeet) {
      px(bx + 3, by + 11, '#FB923C', 2, 2);
      px(bx + 8, by + 11, '#FB923C', 2, 2);
    }
    const tailY = by + (attackFrame ? 3 : 4);
    px(bx - 2, tailY, OUTLINE, 3, 4);
    px(bx - 1, tailY + 1, def.accentColor, 2, 2);
    px(bx - 1, tailY + 1, def.featherColor, 1, 1);

    px(bx + 3, by, OUTLINE, 7, 11);
    px(bx + 1, by + 1, OUTLINE, 11, 9);
    px(bx, by + 3, OUTLINE, 13, 5);

    px(bx + 3, by + 1, def.featherColor, 7, 9);
    px(bx + 2, by + 2, def.featherColor, 9, 7);
    px(bx + 1, by + 3, def.featherColor, 11, 5);
    px(bx + 4, by + 1, '#FFFFFF', 4, 1);
    px(bx + 2, by + 7, def.bellyColor, 9, 2);
    px(bx + 3, by + 9, def.bellyColor, 7, 1);

    px(bx + 1, wingY, OUTLINE, 5, 4);
    px(bx + 2, wingY + 1, def.bellyColor, 3, 2);
    px(bx + 2, wingY + 1, '#FFFFFF', 2, 1);
  } else {
    // 17x15 Extra-Plump Chubby King-Borb (smooth 4-step round borb curve!)
    if (!layout.hideFeet) {
      px(bx + 4, by + 15, '#FB923C', 3, 2);
      px(bx + 10, by + 15, '#FB923C', 3, 2);
    }
    const tailY = by + (attackFrame ? 4 : 5);
    px(bx - 3, tailY, OUTLINE, 4, 5);
    px(bx - 2, tailY + 1, def.accentColor, 3, 3);
    px(bx - 2, tailY + 1, def.featherColor, 2, 2);

    px(bx + 5, by, OUTLINE, 7, 15);
    px(bx + 3, by + 1, OUTLINE, 11, 13);
    px(bx + 2, by + 2, OUTLINE, 13, 11);
    px(bx + 1, by + 3, OUTLINE, 15, 9);
    px(bx, by + 5, OUTLINE, 17, 5);

    px(bx + 5, by + 1, def.featherColor, 7, 13);
    px(bx + 3, by + 2, def.featherColor, 11, 11);
    px(bx + 2, by + 3, def.featherColor, 13, 9);
    px(bx + 1, by + 5, def.featherColor, 15, 5);
    px(bx + 6, by + 1, '#FFFFFF', 5, 1);
    px(bx + 5, by + 2, '#FFFFFF', 2, 1);
    px(bx + 3, by + 10, def.bellyColor, 11, 3);
    px(bx + 5, by + 13, def.bellyColor, 7, 1);

    px(bx + 1, wingY, OUTLINE, 6, 5);
    px(bx + 2, wingY + 1, def.bellyColor, 4, 3);
    px(bx + 2, wingY + 1, '#FFFFFF', 3, 1);
  }

  // ==================== 7. CUTE BESPOKE HATS, STALLS & PROPS ====================
  switch (typeId) {
    case 'bantam': {
      // Original Brawler Bantam: bouncy red comb tuft + crimson dojo headband + tiny boxing mitts!
      px(bx + 5, by - 3, '#EF4444', 3, 3);
      px(bx + 6, by - 4, '#FB7185', 2, 2);
      px(bx + 2, by + 1, '#DC2626', 9, 2);
      px(bx - 1, by, '#EF4444', 3, 2);
      px(bx + 5, wingY + 1, '#EF4444', 2, 2);
      break;
    }
    case 'pecker': {
      // Bouncy ruby heart-comb + cute little golden seed pouch!
      px(bx + 3, by - 3, OUTLINE, 5, 3);
      px(bx + 3, by - 3, '#EF4444', 2, 2);
      px(bx + 6, by - 3, '#EF4444', 2, 2);
      px(bx + 4, by - 2, '#FB7185', 3, 2);
      px(bx + 3, by + 6, '#CA8A04', 3, 2);
      px(bx + 4, by + 6, '#FEF08A', 1, 1);
      break;
    }
    case 'sling_chick': {
      // Sporty green backwards cap + cute wooden Y-slingshot!
      px(bx + 2, by - 2, '#16A34A', 7, 3);
      px(bx, by - 1, '#15803D', 3, 2);
      px(bx + 3, by - 2, '#86EFAC', 3, 1);
      px(bx + 11, by + 5, '#92400E', 2, 3);
      px(bx + 10, by + 3, '#B45309', 1, 2);
      px(bx + 13, by + 3, '#B45309', 1, 2);
      px(bx + 11, by + 3, '#94A3B8', 2, 2);
      break;
    }
    case 'honey': {
      // Cozy straw sunbonnet with a pink daisy + dripping honey dipper!
      px(bx + 1, by, '#FACC15', 9, 2);
      px(bx + 3, by - 2, '#FDE047', 5, 2);
      px(bx + 3, by - 1, '#FB7185', 2, 2);
      px(bx + 4, by - 1, '#FFFFFF', 1, 1);
      px(bx + 11, by + 5, '#92400E', 2, 1);
      px(bx + 12, by + 4, '#F59E0B', 2, 3);
      break;
    }
    case 'boomerang': {
      // Cute tilted Outback explorer hat + curved wooden boomerang!
      px(bx + 1, by + 1, '#78350F', 11, 1);
      px(bx + 3, by - 2, '#92400E', 7, 3);
      px(bx + 3, by, '#FACC15', 7, 1);
      px(bx + 14, by + 1, '#B45309', 2, 4);
      px(bx + 15, by + 4, '#FBBF24', 3, 2);
      break;
    }
    case 'chilly': {
      // Fluffy snow-pom tuft + sky earmuff + cozy winter scarf!
      px(bx + 3, by - 3, '#FFFFFF', 5, 3);
      px(bx + 2, by - 1, '#38BDF8', 7, 2);
      px(bx + 1, by, '#0284C7', 2, 3);
      px(bx + 2, by + 6, '#0284C7', 7, 2);
      px(bx + 4, by + 6, '#BAE6FD', 2, 2);
      break;
    }
    case 'alchemist': {
      // Cute emerald beret + shiny mint goggles on forehead + bubbling potion flask!
      px(bx + 2, by - 2, '#065F46', 8, 3);
      px(bx + 4, by, '#10B981', 2, 2);
      px(bx + 7, by, '#10B981', 2, 2);
      px(bx + 4, by, '#A7F3D0', 1, 1);
      px(bx + 7, by, '#A7F3D0', 1, 1);
      px(bx + 13, by + 5, OUTLINE, 5, 5);
      px(bx + 14, by + 6, '#10B981', 3, 3);
      px(bx + 15, by + 4, '#A7F3D0', 1, 2);
      break;
    }
    case 'ranger': {
      // Forest-scout cap with gold acorn badge + sleek wooden sniper rifle!
      px(bx + 2, by + 1, '#14532D', 10, 1);
      px(bx + 3, by - 2, '#15803D', 7, 3);
      px(bx + 6, by - 1, '#FACC15', 2, 2);
      px(bx + 9, by + 7, OUTLINE, 10, 2);
      px(bx + 12, by + 6, '#38BDF8', 3, 1);
      break;
    }
    case 'cactus_hen': {
      // Cute green saguaro cactus crown + blooming pink desert flower!
      px(bx + 4, by - 4, OUTLINE, 5, 5);
      px(bx + 5, by - 3, '#16A34A', 3, 4);
      px(bx + 2, by - 2, '#15803D', 2, 2);
      px(bx + 9, by - 2, '#15803D', 2, 2);
      px(bx + 5, by - 6, '#EC4899', 3, 2);
      px(bx + 6, by - 6, '#FEF08A', 1, 1);
      break;
    }
    case 'lobber': {
      // Oversized olive helmet + chunky green egg-mortar beside the cute round chicken!
      px(bx + 2, by - 2, '#4D7C0F', 9, 3);
      px(bx + 1, by + 1, '#365314', 11, 1);
      px(bx + 4, by - 1, '#BEF264', 3, 1);
      px(bx + 13, by + 4, OUTLINE, 7, 8);
      px(bx + 14, by + 5, '#475569', 5, 6);
      px(bx + 15, by + 3, '#FFFBEB', 3, 2);
      break;
    }
    case 'wizard': {
      // Tall crooked starry purple wizard hat + glowing star wand!
      px(bx + 1, by + 1, '#581C87', 11, 1);
      px(bx + 3, by - 2, '#7E22CE', 7, 3);
      px(bx + 3, by, '#FACC15', 7, 1);
      px(bx + 4, by - 5, '#9333EA', 5, 3);
      px(bx + 2, by - 7, '#C084FC', 4, 2);
      px(bx + 14, by + 4, '#92400E', 1, 7);
      px(bx + 13, by + 1, '#FEF08A', 3, 3);
      px(bx + 14, by + 2, '#FFFFFF', 1, 1);
      break;
    }
    case 'roost_beacon': {
      // Watchtower roof cap + spinning cyan beacon + red-and-gold war drum!
      px(bx + 1, by, '#78350F', 11, 2);
      px(bx + 3, by - 2, '#D97706', 7, 2);
      px(bx + 5, by - 5, '#94A3B8', 2, 3);
      px(bx + 5, by - 7, '#38BDF8', 2, 2);
      px(bx + 13, by + 6, OUTLINE, 6, 5);
      px(bx + 14, by + 7, '#DC2626', 4, 3);
      px(bx + 14, by + 7, '#FEF08A', 4, 1);
      break;
    }
    case 'ninja': {
      // Dark shinobi headband + silver plate + fluttering red ribbons + shuriken!
      px(bx + 2, by + 1, '#1E293B', 7, 1);
      px(bx + 5, by + 1, '#E2E8F0', 2, 1);
      px(bx - 1, by, '#DC2626', 3, 2);
      px(bx + 12, by + 5, '#E2E8F0', 3, 3);
      px(bx + 13, by + 6, '#DC2626', 1, 1);
      break;
    }
    case 'pirate': {
      // Captain tricorn hat with gold trim + chunky iron broadside cannon out front!
      px(bx + 1, by + 1, OUTLINE, 11, 1);
      px(bx + 2, by - 3, '#0F172A', 9, 4);
      px(bx + 2, by - 3, '#FACC15', 9, 1);
      px(bx + 6, by - 2, '#FDA4AF', 2, 2);
      px(bx + 13, by + 6, OUTLINE, 8, 5);
      px(bx + 14, by + 7, '#334155', 6, 3);
      px(bx + 15, by + 7, '#94A3B8', 4, 1);
      px(bx + 15, by + 10, '#92400E', 3, 2);
      break;
    }
    case 'bard': {
      // Wide festive red-and-gold sombrero + cute acoustic guitar!
      px(bx - 2, by + 1, '#E11D48', 17, 1);
      px(bx - 1, by, '#FACC15', 15, 1);
      px(bx + 4, by - 3, '#BE123C', 5, 3);
      px(bx + 5, by - 2, '#FDE047', 3, 1);
      px(bx + 6, by + 7, '#D97706', 5, 3);
      px(bx + 7, by + 8, '#FEF08A', 2, 1);
      px(bx + 11, by + 6, '#78350F', 6, 2);
      break;
    }
    case 'brew_hen': {
      // Cozy wooden espresso bar counter in front of the cute barista borb + steaming mug!
      px(bx + 2, by - 2, '#78350F', 8, 3);
      px(bx + 4, by - 3, '#B45309', 4, 1);
      px(4, 17, OUTLINE, 22, 8);
      px(5, 18, '#92400E', 20, 6);
      px(5, 18, '#FBBF24', 20, 2);
      px(20, 13, OUTLINE, 5, 5);
      px(21, 14, '#F59E0B', 3, 3);
      px(22, 10, '#FFFFFF', 1, 2);
      break;
    }
    case 'phoenix': {
      // Sunny flame-tuft crown & warm glowing wing tips!
      px(bx + 4, by - 3, '#F97316', 2, 3);
      px(bx + 6, by - 6, '#FACC15', 2, 6);
      px(bx + 7, by - 5, '#FFFFFF', 1, 4);
      px(bx + 8, by - 3, '#FB923C', 2, 3);
      px(bx + 2, wingY + 1, '#F97316', 3, 2);
      break;
    }
    case 'mecha': {
      // Cute cyan headset + shoulder laser railgun mounted on the open-top walker!
      px(bx + 3, by - 3, '#06B6D4', 2, 3);
      px(bx + 8, by - 3, '#06B6D4', 2, 3);
      px(bx + 3, by, '#0891B2', 7, 2);
      px(bx + 4, by + 1, '#67E8F9', 5, 1);
      px(bx + 13, by + 6, OUTLINE, 8, 4);
      px(bx + 14, by + 7, '#334155', 4, 2);
      px(bx + 18, by + 7, '#22D3EE', 2, 2);
      break;
    }
    case 'iron_spurs': {
      // Spiked crimson champion headband + gold belt + gleaming brass-knuckle gauntlet!
      px(bx + 4, by - 3, '#FACC15', 2, 3);
      px(bx + 7, by - 4, '#FACC15', 2, 4);
      px(bx + 2, by + 1, '#DC2626', 9, 2);
      px(bx - 2, by + 1, '#EF4444', 3, 2);
      px(bx + 3, by + 8, '#CA8A04', 7, 2);
      px(bx + 13, by + 5, OUTLINE, 5, 5);
      px(bx + 14, by + 6, '#DC2626', 3, 3);
      px(bx + 15, by + 6, '#FACC15', 2, 2);
      break;
    }
    case 'ramen_chef': {
      // Cozy wooden ramen counter + chef hachimaki + steaming red bowl of golden noodles!
      px(bx + 2, by, '#FFFFFF', 9, 2);
      px(bx + 5, by, '#EF4444', 3, 2);
      px(4, 17, OUTLINE, 22, 8);
      px(5, 18, '#B45309', 20, 6);
      px(5, 18, '#FDE68A', 20, 2);
      px(19, 13, OUTLINE, 6, 5);
      px(20, 15, '#DC2626', 4, 2);
      px(20, 14, '#FDE047', 4, 1);
      px(21, 10, '#FFFFFF', 1, 3);
      break;
    }
    case 'bastion_shield': {
      // Cobalt-and-granite guardian crest + chunky rune-carved tower shield!
      px(bx + 3, by - 3, OUTLINE, 7, 4);
      px(bx + 4, by - 2, '#E2E8F0', 5, 2);
      px(bx + 5, by - 1, '#3B82F6', 3, 1);
      px(bx + 13, by + 3, OUTLINE, 7, 9);
      px(bx + 14, by + 4, '#CBD5E1', 5, 7);
      px(bx + 15, by + 5, '#2563EB', 3, 5);
      px(bx + 16, by + 6, '#67E8F9', 1, 3);
      break;
    }
    case 'tesla': {
      // Cute twin blue spark-bobbles on head + crackling yellow coil emitter!
      px(bx + 3, by - 3, '#6366F1', 2, 3);
      px(bx + 8, by - 3, '#6366F1', 2, 3);
      px(bx + 3, by - 5, '#38BDF8', 2, 2);
      px(bx + 8, by - 5, '#38BDF8', 2, 2);
      px(bx + 5, by - 4, '#FEF08A', 3, 1);
      px(bx + 14, by + 4, OUTLINE, 5, 7);
      px(bx + 15, by + 5, '#4F46E5', 3, 5);
      px(bx + 15, by + 2, '#FEF08A', 3, 2);
      break;
    }
    case 'cowboy_desperado': {
      // Wide-brim sheriff cowboy hat + gold star + red bandana + silver revolver!
      px(bx - 1, by, '#78350F', 15, 2);
      px(bx + 3, by - 3, '#92400E', 7, 3);
      px(bx + 6, by - 2, '#FACC15', 2, 2);
      px(bx + 3, by + 8, '#DC2626', 7, 2);
      px(bx + 13, by + 6, '#94A3B8', 5, 2);
      px(bx + 13, by + 8, '#78350F', 2, 2);
      break;
    }
    case 'surge_oracle': {
      // Twin cyan-tipped ritual horns + dark circlet + glowing turquoise surge staff!
      px(bx + 2, by - 4, '#0F172A', 2, 4);
      px(bx + 9, by - 4, '#0F172A', 2, 4);
      px(bx + 2, by - 6, '#22D3EE', 2, 2);
      px(bx + 9, by - 6, '#22D3EE', 2, 2);
      px(bx + 2, by, '#1E293B', 9, 2);
      px(bx + 15, by, '#1E293B', 2, 12);
      px(bx + 14, by - 3, '#06B6D4', 4, 4);
      px(bx + 15, by - 2, '#FFFFFF', 2, 2);
      break;
    }
    case 'viking_jarl': {
      // Horned iron Viking helm + frost-rune bearded axe!
      px(bx + 2, by - 3, '#64748B', 9, 4);
      px(bx + 4, by - 2, '#94A3B8', 5, 2);
      px(bx, by - 5, '#FEF3C7', 2, 3);
      px(bx + 11, by - 5, '#FEF3C7', 2, 3);
      px(bx + 13, by + 3, '#78350F', 2, 8);
      px(bx + 14, by + 3, '#38BDF8', 4, 4);
      px(bx + 15, by + 4, '#E0F2FE', 2, 2);
      break;
    }
    case 'chrono': {
      // Dapper pocket-watch top hat + floating teal hourglass!
      px(bx + 2, by + 1, '#78350F', 9, 1);
      px(bx + 4, by - 4, '#92400E', 5, 5);
      px(bx + 4, by, '#FACC15', 5, 1);
      px(bx + 5, by - 3, '#5EEAD4', 3, 2);
      px(bx + 14, by + 5, '#FACC15', 4, 1);
      px(bx + 15, by + 6, '#2DD4BF', 2, 3);
      px(bx + 14, by + 9, '#FACC15', 4, 1);
      break;
    }
    case 'overclock_engie': {
      // Yellow hard-hat + spinning blue dynamo coil beside the cute round chicken + wrench!
      px(bx + 1, by, '#CA8A04', 11, 1);
      px(bx + 2, by - 3, '#FACC15', 9, 3);
      px(bx + 5, by - 2, '#0284C7', 3, 2);
      px(3, 15, OUTLINE, 5, 8);
      px(4, 16, '#0284C7', 3, 6);
      px(4, 17, '#67E8F9', 3, 2);
      px(bx + 14, by + 4, '#94A3B8', 2, 7);
      px(bx + 13, by + 3, '#E2E8F0', 4, 2);
      break;
    }
    case 'cyber_sniper': {
      // Cute headset + forehead cyber-band + floating translucent green holo-terminal!
      px(bx + 2, by - 2, '#334155', 9, 2);
      px(bx + 1, by, '#10B981', 2, 3);
      px(bx + 3, by + 1, '#064E3B', 7, 1);
      px(bx + 5, by + 1, '#4ADE80', 4, 1);
      px(bx + 14, by + 3, OUTLINE, 6, 6);
      px(bx + 15, by + 4, '#065F46', 4, 4);
      px(bx + 16, by + 5, '#4ADE80', 2, 2);
      break;
    }
    case 'plague_doctor': {
      // Apothecary top-hat with emerald band + glowing emerald blight flask!
      px(bx + 1, by, '#0F172A', 11, 1);
      px(bx + 3, by - 4, '#1E293B', 7, 4);
      px(bx + 3, by - 1, '#10B981', 7, 1);
      px(bx + 13, by + 5, OUTLINE, 5, 5);
      px(bx + 14, by + 6, '#10B981', 3, 3);
      px(bx + 15, by + 4, '#6EE7B7', 2, 2);
      break;
    }
    case 'aegis_mech': {
      // Golden V-crest crown on the cute round pilot borb + heavy ion buster on open-top walker!
      px(bx + 3, by - 1, '#2563EB', 7, 2);
      px(bx + 1, by - 4, '#FACC15', 3, 2);
      px(bx + 4, by - 3, '#FEF08A', 5, 2);
      px(bx + 9, by - 4, '#FACC15', 3, 2);
      px(bx + 6, by - 2, '#EF4444', 2, 2);
      px(bx + 13, by + 6, OUTLINE, 8, 4);
      px(bx + 14, by + 7, '#334155', 4, 2);
      px(bx + 18, by + 7, '#FB7185', 2, 2);
      break;
    }
    case 'pharaoh_ra': {
      // Blue & gold Nemes headdress + golden Ankh solar scepter!
      px(bx + 1, by - 3, '#2563EB', 11, 4);
      px(bx + 2, by - 2, '#FACC15', 9, 1);
      px(bx + 1, by, '#FACC15', 2, 4);
      px(bx + 6, by - 5, '#EF4444', 2, 2);
      px(bx + 15, by + 4, '#FACC15', 2, 7);
      px(bx + 14, by + 1, '#FDE047', 4, 3);
      px(bx + 15, by + 2, '#2563EB', 2, 1);
      break;
    }
    case 'samurai_shogun': {
      // Crimson samurai kabuto + golden crescent-moon crest + gleaming silver katana!
      px(bx + 1, by, '#991B1B', 11, 2);
      px(bx + 3, by - 2, '#DC2626', 7, 2);
      px(bx + 4, by - 5, '#FACC15', 5, 3);
      px(bx + 5, by - 4, '#FEF9C3', 3, 1);
      px(bx + 13, by + 6, '#94A3B8', 6, 2);
      px(bx + 14, by + 6, '#FFFFFF', 4, 1);
      break;
    }
    case 'storm_dj': {
      // Neon cyan headphones + glowing turntable deck beside the cute round DJ borb!
      px(bx + 2, by - 3, '#22D3EE', 9, 2);
      px(bx + 1, by, '#EC4899', 3, 4);
      px(bx + 13, by + 6, OUTLINE, 8, 5);
      px(bx + 14, by + 7, '#1E1B4B', 6, 3);
      px(bx + 15, by + 7, '#38BDF8', 4, 2);
      px(bx + 16, by + 2, '#FDE047', 2, 2);
      break;
    }
    case 'stand_hen': {
      // Dark-indigo Crusader cap + gold emblem + floating purple/gold astral sparkles!
      px(bx + 2, by - 2, '#1E1B4B', 8, 4);
      px(bx + 3, by + 1, '#312E81', 9, 1);
      px(bx + 2, by - 2, '#FACC15', 8, 1);
      px(bx + 7, by - 1, '#FACC15', 2, 2);
      px(bx + 2, by + 7, '#4C1D95', 5, 2);
      px(3, 5, '#C084FC', 2, 2);
      px(4, 4, '#FEF08A', 1, 1);
      px(24, 4, '#A855F7', 2, 2);
      px(25, 3, '#22D3EE', 1, 1);
      break;
    }
    case 'paladin_crusader': {
      // Silver templar crest with gold cross + sanctified golden warhammer!
      px(bx + 2, by - 3, '#CBD5E1', 9, 4);
      px(bx + 5, by - 3, '#F59E0B', 3, 4);
      px(bx + 4, by - 2, '#FACC15', 5, 1);
      px(bx + 15, by + 4, '#92400E', 2, 7);
      px(bx + 13, by + 1, OUTLINE, 6, 4);
      px(bx + 14, by + 2, '#FACC15', 4, 2);
      break;
    }
    case 'necro_lich': {
      // Bone crown with emerald gems + floating emerald soul-lantern!
      px(bx + 2, by - 3, OUTLINE, 9, 4);
      px(bx + 3, by - 2, '#F8FAFC', 7, 3);
      px(bx + 4, by - 1, '#10B981', 2, 1);
      px(bx + 8, by - 1, '#10B981', 2, 1);
      px(bx + 14, by + 1, '#059669', 4, 5);
      px(bx + 15, by + 2, '#6EE7B7', 2, 3);
      px(bx + 15, by, '#FFFFFF', 1, 2);
      break;
    }
    case 'oni_warlord': {
      // Plump crimson King-Borb with fluffy white mane + twin golden Oni horns + spiked Kanabo!
      px(bx + 3, by - 2, '#F8FAFC', 11, 2);
      px(bx + 4, by - 6, '#FACC15', 3, 5);
      px(bx + 10, by - 6, '#FACC15', 3, 5);
      px(bx + 17, by + 1, OUTLINE, 5, 12);
      px(bx + 18, by + 2, '#475569', 3, 10);
      px(bx + 21, by + 3, '#FACC15', 1, 2);
      px(bx + 21, by + 7, '#FACC15', 1, 2);
      break;
    }
    case 'valkyrie': {
      // Winged golden Valkyrie circlet + sparkling star-spear!
      px(bx + 3, by, '#F59E0B', 7, 2);
      px(bx + 5, by - 1, '#38BDF8', 3, 2);
      px(bx + 1, by - 3, '#FFFFFF', 3, 3);
      px(bx + 9, by - 3, '#FFFFFF', 3, 3);
      px(bx + 15, by + 1, '#D97706', 2, 11);
      px(bx + 14, by - 2, '#7DD3FC', 4, 4);
      px(bx + 15, by - 1, '#FFFFFF', 2, 2);
      break;
    }
    case 'idol_diva': {
      // Twin pink idol ribbons + starlight tiara + golden mic + floating music notes!
      px(bx + 1, by - 3, '#EC4899', 3, 3);
      px(bx + 9, by - 3, '#EC4899', 3, 3);
      px(bx + 4, by - 4, '#FACC15', 5, 2);
      px(bx + 6, by - 4, '#FFFFFF', 1, 1);
      px(bx + 14, by + 6, '#CA8A04', 2, 4);
      px(bx + 13, by + 4, '#F472B6', 4, 2);
      px(23, 3, '#38BDF8', 2, 3);
      px(24, 2, '#FEF08A', 2, 1);
      break;
    }
    case 'tengu_shadow': {
      // Dark tengu war-crest + golden emblem + blazing crimson katana!
      px(bx + 2, by - 2, '#0F172A', 9, 3);
      px(bx + 4, by - 4, '#EF4444', 5, 2);
      px(bx + 5, by - 1, '#FACC15', 3, 1);
      px(bx + 13, by + 6, '#DC2626', 6, 2);
      px(bx + 14, by + 6, '#FCA5A5', 4, 1);
      break;
    }
    case 'astral_astrologer': {
      // Tall indigo stargazer wizard hat + floating golden star-comet orb!
      px(bx + 1, by, '#312E81', 11, 1);
      px(bx + 3, by - 4, '#4338CA', 7, 4);
      px(bx + 5, by - 7, '#6366F1', 4, 3);
      px(bx + 5, by - 3, '#FDE047', 2, 2);
      px(bx + 15, by + 3, '#FDE047', 4, 4);
      px(bx + 16, by + 4, '#FFFFFF', 2, 2);
      break;
    }
    case 'star_dread': {
      // Cute starfleet captain cap + twin tiny pet UFO drones hovering beside!
      px(bx + 2, by - 2, '#1E293B', 9, 3);
      px(bx + 2, by, '#FACC15', 10, 1);
      px(bx + 6, by - 2, '#FB7185', 2, 2);
      px(2, 6, '#94A3B8', 5, 2);
      px(3, 5, '#38BDF8', 3, 1);
      px(26, 5, '#94A3B8', 5, 2);
      px(27, 4, '#F43F5E', 3, 1);
      break;
    }
    case 'leviathan_kraken': {
      // Bioluminescent sea-king crown + gleaming three-pronged abyssal trident!
      px(bx + 2, by - 3, '#0F766E', 9, 3);
      px(bx + 3, by - 5, '#22D3EE', 2, 2);
      px(bx + 6, by - 6, '#67E8F9', 2, 3);
      px(bx + 9, by - 5, '#22D3EE', 2, 2);
      px(bx + 15, by + 2, '#0EA5E9', 2, 10);
      px(bx + 13, by - 1, '#22D3EE', 6, 4);
      px(bx + 14, by - 1, '#0F172A', 1, 2);
      px(bx + 17, by - 1, '#0F172A', 1, 2);
      break;
    }
    case 'abyss_wyrm': {
      // Swept cyan-tipped dragon horns + glowing cyan dragon orb!
      px(bx + 1, by - 4, '#0F172A', 3, 4);
      px(bx + 9, by - 4, '#0F172A', 3, 4);
      px(bx + 1, by - 6, '#22D3EE', 2, 2);
      px(bx + 10, by - 6, '#22D3EE', 2, 2);
      px(bx + 14, by + 4, '#22D3EE', 5, 5);
      px(bx + 15, by + 5, '#FFFFFF', 3, 3);
      break;
    }
    case 'quasar': {
      // Pastel pink-and-cyan starry halo + shooting star!
      px(bx + 3, by - 4, '#22D3EE', 7, 1);
      px(bx + 2, by - 3, '#F472B6', 9, 1);
      px(bx + 5, by - 6, '#FFFFFF', 3, 2);
      px(bx + 15, by + 2, '#F472B6', 4, 4);
      px(bx + 16, by + 3, '#FFFFFF', 2, 2);
      break;
    }
    case 'archangel_seraph': {
      // Floating golden halo ring + blazing celestial spear!
      px(bx + 3, by - 5, '#F59E0B', 7, 2);
      px(bx + 4, by - 5, '#FEF08A', 5, 1);
      px(bx + 15, by, '#FACC15', 2, 12);
      px(bx + 14, by - 3, '#FFFFFF', 4, 4);
      break;
    }
    case 'chronos_empress': {
      // Sapphire-and-gold diadem + golden time-spear!
      px(bx + 3, by - 3, '#FEF08A', 7, 3);
      px(bx + 5, by - 3, '#38BDF8', 3, 2);
      px(bx + 15, by, '#CA8A04', 2, 12);
      px(bx + 14, by - 3, '#FEF08A', 4, 4);
      break;
    }
    case 'omega_god': {
      // Radiant floating golden halo + hovering Sacred Golden Egg!
      px(bx + 2, by - 5, '#FEF08A', 9, 2);
      px(bx + 4, by - 5, '#FFFFFF', 5, 1);
      px(bx + 14, by + 2, OUTLINE, 6, 7);
      px(bx + 15, by + 3, '#FACC15', 4, 5);
      px(bx + 16, by + 4, '#FFFFFF', 2, 2);
      break;
    }
    case 'mech_zilla': {
      // Cute crystal kaiju crown tuft + glowing cyan atomic sphere!
      px(bx + 4, by - 3, '#0F172A', 9, 3);
      px(bx + 5, by - 5, '#22D3EE', 3, 3);
      px(bx + 9, by - 6, '#67E8F9', 3, 4);
      px(bx + 18, by + 4, OUTLINE, 6, 6);
      px(bx + 19, by + 5, '#0284C7', 4, 4);
      px(bx + 20, by + 6, '#FFFFFF', 2, 2);
      break;
    }
    case 'gaia_creator': {
      // Emerald crystal antlers + pink/gold flower crown + floating rainbow prism!
      px(bx + 2, by - 5, '#16A34A', 3, 5);
      px(bx + 12, by - 5, '#16A34A', 3, 5);
      px(bx + 5, by - 3, '#F472B6', 3, 3);
      px(bx + 9, by - 3, '#FACC15', 3, 3);
      px(bx + 18, by + 3, '#F43F5E', 6, 6);
      px(bx + 19, by + 4, '#38BDF8', 4, 4);
      px(bx + 20, by + 5, '#FEF08A', 2, 2);
      break;
    }
    case 'void_singularity': {
      // Front arc of tilted cosmic ring + dark-star crown + mini black hole!
      px(4, by + 9, '#F472B6', 29, 2);
      px(8, by + 10, '#22D3EE', 21, 1);
      px(bx + 4, by - 4, '#EC4899', 9, 3);
      px(bx + 6, by - 6, '#22D3EE', 5, 2);
      px(bx + 18, by + 4, '#F472B6', 6, 6);
      px(bx + 19, by + 5, '#090D16', 4, 4);
      break;
    }
    case 'malevolent_chicken': {
      // Spiky salmon-pink Sukuna hair (sharp jagged anime spikes + dark undercut!)
      px(bx + 2, by, OUTLINE, 13, 2);
      px(bx + 3, by + 1, '#1E1B4B', 11, 1);
      // 5 distinct sharp spiky pink tufts (left sweep, left-mid peak, tall center spike, right-mid peak, front bang spike)
      // Outlines for each pointed spike
      px(bx, by - 4, OUTLINE, 4, 4);
      px(bx - 1, by - 5, OUTLINE, 2, 2);
      px(bx + 3, by - 6, OUTLINE, 4, 6);
      px(bx + 4, by - 7, OUTLINE, 2, 2);
      px(bx + 7, by - 7, OUTLINE, 4, 7);
      px(bx + 8, by - 9, OUTLINE, 2, 3);
      px(bx + 11, by - 6, OUTLINE, 4, 6);
      px(bx + 12, by - 8, OUTLINE, 2, 3);
      px(bx + 14, by - 4, OUTLINE, 4, 4);
      px(bx + 16, by - 5, OUTLINE, 2, 2);
      // Vibrant Sukuna pink fill & bright rose-pink spike tips
      px(bx, by - 4, '#F43F5E', 2, 1);
      px(bx + 1, by - 3, '#FB7185', 3, 3);
      px(bx + 4, by - 6, '#FDA4AF', 1, 2);
      px(bx + 4, by - 4, '#FB7185', 3, 4);
      px(bx + 8, by - 8, '#FDA4AF', 1, 3);
      px(bx + 8, by - 5, '#FB7185', 2, 5);
      px(bx + 7, by - 3, '#F43F5E', 1, 3);
      px(bx + 12, by - 7, '#FDA4AF', 1, 2);
      px(bx + 11, by - 5, '#FB7185', 3, 5);
      px(bx + 15, by - 4, '#FDA4AF', 2, 1);
      px(bx + 14, by - 3, '#F43F5E', 3, 3);
      // Forehead, cheek & wing black Sukuna curse markings
      px(bx + 9, by + 2, OUTLINE, 5, 1);
      px(bx + 11, by + 3, OUTLINE, 1, 1);
      px(bx + 5, by + 4, OUTLINE, 4, 1);
      px(bx + 4, by + 6, OUTLINE, 4, 1);
      px(bx + 2, wingY + 1, OUTLINE, 4, 1);
      px(bx + 2, wingY + 3, OUTLINE, 4, 1);
      // Iconic lower slitted crimson Sukuna eye beneath main eye!
      px(bx + 11, by + 9, OUTLINE, 4, 1);
      px(bx + 12, by + 9, '#EF4444', 2, 1);
      // Dark-collared kimono overlap & crimson obi sash
      px(bx + 5, by + 10, '#1E293B', 8, 2);
      px(bx + 8, by + 10, '#FFF1F2', 2, 1);
      px(bx + 4, by + 12, '#991B1B', 10, 1);
      px(bx + 6, by + 12, '#E11D48', 6, 1);
      // Curved crescent Dismantle shockwave slash hovering out front!
      px(bx + 19, by, OUTLINE, 3, 3);
      px(bx + 21, by + 2, OUTLINE, 3, 3);
      px(bx + 22, by + 4, OUTLINE, 3, 4);
      px(bx + 21, by + 7, OUTLINE, 3, 3);
      px(bx + 19, by + 9, OUTLINE, 3, 3);
      px(bx + 20, by + 1, '#E11D48', 2, 2);
      px(bx + 22, by + 3, '#E11D48', 2, 5);
      px(bx + 20, by + 9, '#E11D48', 2, 2);
      px(bx + 20, by + 1, '#FFFFFF', 1, 1);
      px(bx + 23, by + 4, '#FFFFFF', 1, 4);
      px(bx + 20, by + 10, '#FFFFFF', 1, 1);
      if (attackFrame) {
        // Cross-Dismantle flash on attack!
        px(bx + 19, by + 5, OUTLINE, 7, 3);
        px(bx + 19, by + 6, '#E11D48', 7, 1);
        px(bx + 20, by + 5, '#FFFFFF', 5, 1);
      }
      break;
    }
    case 'limitless_chicken': {
      // Tall gravity-defying spiky snow-white Gojo hair sweeping straight up!
      px(bx, by - 5, OUTLINE, 4, 6);
      px(bx - 1, by - 6, OUTLINE, 2, 2);
      px(bx + 3, by - 8, OUTLINE, 4, 9);
      px(bx + 4, by - 9, OUTLINE, 2, 2);
      px(bx + 7, by - 9, OUTLINE, 4, 10);
      px(bx + 8, by - 11, OUTLINE, 2, 3);
      px(bx + 11, by - 8, OUTLINE, 4, 9);
      px(bx + 12, by - 9, OUTLINE, 2, 2);
      px(bx + 14, by - 5, OUTLINE, 4, 6);
      px(bx + 16, by - 6, OUTLINE, 2, 2);
      // Pure snow-white spikes with subtle icy Six-Eyes silver-blue shading
      px(bx, by - 5, '#FFFFFF', 2, 1);
      px(bx + 1, by - 4, '#F1F5F9', 3, 5);
      px(bx + 4, by - 8, '#FFFFFF', 2, 8);
      px(bx + 6, by - 5, '#BAE6FD', 1, 5);
      px(bx + 8, by - 10, '#FFFFFF', 2, 10);
      px(bx + 7, by - 6, '#E0F2FE', 1, 6);
      px(bx + 12, by - 8, '#FFFFFF', 2, 8);
      px(bx + 11, by - 5, '#BAE6FD', 1, 5);
      px(bx + 15, by - 5, '#FFFFFF', 2, 1);
      px(bx + 14, by - 4, '#E0F2FE', 3, 5);

      // Dark navy Jujutsu High high-collar uniform jacket + golden swirl button!
      px(bx + 1, wingY, OUTLINE, 6, 5);
      px(bx + 2, wingY + 1, '#1E293B', 4, 3);
      px(bx + 2, by + 9, '#0F172A', 13, 4);
      px(bx + 4, by + 13, '#0F172A', 9, 1);
      px(bx + 4, by + 9, '#1E293B', 10, 3);
      px(bx + 12, by + 10, '#FACC15', 2, 2);

      // Heavy Azure-Infused Limitless Cursed Fist out front (+ Black-Flash sparks on attack!)
      const fx = bx + (attackFrame ? 20 : 18);
      const fy = by + 2;
      px(fx, fy, OUTLINE, 7, 7);
      px(fx + 1, fy + 1, '#0284C7', 5, 5);
      px(fx + 2, fy + 1, '#38BDF8', 4, 4);
      px(fx + 4, fy + 2, '#FFFFFF', 2, 2);
      if (attackFrame) {
        px(fx - 2, fy - 1, '#E11D48', 3, 2);
        px(fx + 2, fy + 7, '#E11D48', 4, 2);
        px(fx + 6, fy + 2, '#FFFFFF', 2, 3);
      }
      break;
    }
    case 'golden_deity': {
      // Royal winged sun-crown + ruby jewel + divine golden scepter!
      px(bx + 3, by - 4, OUTLINE, 11, 4);
      px(bx + 4, by - 3, '#FACC15', 9, 3);
      px(bx + 7, by - 3, '#F43F5E', 3, 2);
      px(bx + 2, by - 6, '#FFFFFF', 13, 1);
      px(bx + 18, by + 1, OUTLINE, 5, 11);
      px(bx + 19, by + 2, '#EC4899', 3, 3);
      px(bx + 19, by + 5, '#FACC15', 3, 6);
      break;
    }
    case 'solar_emperor': {
      // 5-rayed golden Sol Invictus crown + captive miniature blazing sun!
      px(bx + 3, by - 3, '#EA580C', 11, 3);
      px(bx + 4, by - 6, '#FACC15', 2, 4);
      px(bx + 7, by - 7, '#FEF08A', 3, 5);
      px(bx + 11, by - 6, '#FACC15', 2, 4);
      px(bx + 18, by + 3, '#EA580C', 7, 7);
      px(bx + 19, by + 4, '#FDE047', 5, 5);
      px(bx + 20, by + 5, '#FFFFFF', 3, 3);
      break;
    }
    case 'eternity_weaver': {
      // Prismatic continuum horns + twin dimensional rift crescent blades!
      px(bx + 3, by - 5, '#22D3EE', 3, 5);
      px(bx + 11, by - 5, '#E879F9', 3, 5);
      px(bx + 7, by - 4, '#FFFFFF', 3, 2);
      px(bx + 18, by + 1, OUTLINE, 5, 11);
      px(bx + 19, by + 2, '#A855F7', 3, 9);
      px(bx + 20, by + 1, '#22D3EE', 3, 4);
      px(bx + 20, by + 8, '#F472B6', 3, 4);
      break;
    }
    case 'complete_cluck': {
      // Sovereign Twin-Gem Crown + Forged Prismatic Infinity Greatsword!
      px(bx + 3, by - 4, OUTLINE, 11, 4);
      px(bx + 4, by - 3, '#FACC15', 9, 3);
      px(bx + 5, by - 5, '#2DD4BF', 3, 2);
      px(bx + 9, by - 5, '#E879F9', 3, 2);
      px(bx + 8, by - 6, '#FFFFFF', 1, 2);
      // Forged Sovereign Infinity Greatsword held beside the chubby King-Borb!
      px(bx + 17, by + 10, '#FACC15', 7, 2);
      px(bx + 18, by, OUTLINE, 5, 11);
      px(bx + 19, by + 1, '#2DD4BF', 3, 3);
      px(bx + 19, by + 4, '#38BDF8', 3, 3);
      px(bx + 19, by + 7, '#E879F9', 3, 3);
      px(bx + 20, by + 1, '#FFFFFF', 1, 8);
      break;
    }
  }

  // ==================== 8. PROTECTED KAWAII FACE (SPARKLE EYE + ROSY BLUSH + CHIRP BEAK!) ====================
  // Drawn LAST so every single Chicken unit always keeps Brawler Bantam's round, cute kawaii expression!
  if (borb === 'petite') {
    px(bx + 7, by + 2, OUTLINE, 2, 3);
    px(bx + 7, by + 2, '#FFFFFF', 1, 1);
    px(bx + 8, by + 4, '#64748B', 1, 1);

    px(bx + 5, by + 5, '#FB7185', 2, 1);
    px(bx + 5, by + 5, '#FDA4AF', 1, 1);

    px(bx + 10, by + 3, OUTLINE, 3, 2);
    px(bx + 10, by + 3, '#FDE047', 2, 1);
    px(bx + 10, by + 4, '#F97316', 2, 1);
    if (attackFrame) {
      px(bx + 10, by + 5, '#FB7185', 2, 1);
    }
  } else if (borb === 'classic') {
    px(bx + 9, by + 3, OUTLINE, 2, 3);
    px(bx + 9, by + 3, '#FFFFFF', 1, 1);
    px(bx + 10, by + 5, '#64748B', 1, 1);

    px(bx + 7, by + 6, '#FB7185', 2, 1);
    px(bx + 7, by + 6, '#FDA4AF', 1, 1);

    px(bx + 12, by + 4, OUTLINE, 3, 2);
    px(bx + 12, by + 4, '#FDE047', 2, 1);
    px(bx + 12, by + 5, '#F97316', 2, 1);
    if (attackFrame) {
      px(bx + 12, by + 6, '#FB7185', 2, 1);
    }
  } else if (typeId === 'limitless_chicken') {
    // Gojo's iconic pitch-black blindfold + glowing radiant Six-Eyes cyan gleam!
    if (attackFrame) {
      // Blindfold pushed slightly up, revealing blazing Six-Eyes!
      px(bx + 2, by + 2, OUTLINE, 14, 2);
      px(bx + 3, by + 2, '#1E293B', 12, 1);
      px(bx + 11, by + 4, '#0284C7', 4, 4);
      px(bx + 12, by + 4, '#38BDF8', 2, 4);
      px(bx + 12, by + 4, '#FFFFFF', 1, 2);
      px(bx + 13, by + 6, '#BAE6FD', 1, 1);
    } else {
      // Sleek black blindfold band across face with subtle Six-Eyes azure glow underneath!
      px(bx + 2, by + 3, OUTLINE, 14, 4);
      px(bx + 3, by + 4, '#1E293B', 12, 2);
      px(bx + 11, by + 6, '#38BDF8', 3, 1);
      px(bx + 12, by + 6, '#FFFFFF', 1, 1);
    }
    px(bx + 9, by + 8, '#FB7185', 3, 1);
    px(bx + 9, by + 8, '#FDA4AF', 2, 1);
    px(bx + 16, by + 6, OUTLINE, 4, 2);
    px(bx + 16, by + 6, '#FDE047', 3, 1);
    px(bx + 16, by + 7, '#F97316', 3, 1);
    if (attackFrame) {
      px(bx + 16, by + 8, '#FB7185', 2, 1);
    }
  } else {
    px(bx + 12, by + 4, OUTLINE, 2, 4);
    px(bx + 12, by + 4, '#FFFFFF', 1, 2);
    px(bx + 13, by + 7, '#64748B', 1, 1);

    px(bx + 9, by + 8, '#FB7185', 3, 1);
    px(bx + 9, by + 8, '#FDA4AF', 2, 1);

    px(bx + 16, by + 6, OUTLINE, 4, 2);
    px(bx + 16, by + 6, '#FDE047', 3, 1);
    px(bx + 16, by + 7, '#F97316', 3, 1);
    if (attackFrame) {
      px(bx + 16, by + 8, '#FB7185', 2, 1);
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

// ==================== 4.8. GIANT MALEVOLENT SHRINE PIXEL SPRITE (48x44 = 96x88 LOGICAL PX!) ====================
function buildMalevolentShrineSprite(): HTMLCanvasElement {
  const c = makeCanvas(48, 44);
  const ctx = c.getContext('2d')!;
  const px = (x: number, y: number, col: string, w = 1, h = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };

  // 1. Golden Pagoda Spire / Finial
  px(22, 1, OUTLINE, 4, 5);
  px(23, 2, '#FACC15', 2, 3);
  px(23, 1, '#FEF08A', 2, 1);

  // 2. Upper Pagoda Tier (x=9..38, y=5..10)
  px(8, 5, OUTLINE, 32, 6);
  px(7, 4, OUTLINE, 3, 3);
  px(38, 4, OUTLINE, 3, 3);
  px(8, 5, '#E11D48', 2, 2);
  px(38, 5, '#E11D48', 2, 2);
  px(10, 6, '#1E293B', 28, 3);
  px(12, 6, '#334155', 24, 1);
  px(11, 9, '#991B1B', 26, 1);

  // 3. Grand Sweeping Horned Shrine Roof (x=1..46, y=10..18)
  px(3, 10, OUTLINE, 42, 8);
  px(1, 9, OUTLINE, 4, 5);
  px(43, 9, OUTLINE, 4, 5);
  // Upturned ivory/crimson roof-horn tips
  px(2, 9, '#F8FAFC', 2, 2);
  px(44, 9, '#F8FAFC', 2, 2);
  px(2, 11, '#E11D48', 3, 2);
  px(43, 11, '#E11D48', 3, 2);
  // Dark slate roof tiles + vertical ribs
  px(4, 11, '#0F172A', 40, 5);
  px(6, 11, '#1E293B', 36, 3);
  for (let rx = 8; rx <= 38; rx += 5) {
    px(rx, 11, '#475569', 2, 4);
  }
  // Crimson eaves & gold central crest
  px(5, 16, '#991B1B', 38, 2);
  px(7, 16, '#E11D48', 34, 1);
  px(21, 14, '#FACC15', 6, 3);
  px(22, 15, '#FEF08A', 4, 1);

  // 4. Shrine Pillars, Horned Bull Skulls & Gaping Demonic Mouth Sanctum (y=18..36)
  px(6, 18, OUTLINE, 36, 18);
  // Left & Right crimson torii columns
  px(7, 18, '#7F1D1D', 5, 18);
  px(8, 18, '#DC2626', 2, 18);
  px(36, 18, '#7F1D1D', 5, 18);
  px(38, 18, '#DC2626', 2, 18);

  // Bleached Horned Skulls flanking the Shrine!
  // Left horned skull
  px(3, 19, OUTLINE, 4, 5);
  px(4, 20, '#F8FAFC', 2, 3);
  px(6, 21, OUTLINE, 7, 8);
  px(7, 22, '#F8FAFC', 5, 5);
  px(7, 27, '#CBD5E1', 5, 1);
  px(8, 24, OUTLINE, 1, 2);
  px(10, 24, '#EF4444', 1, 2);
  px(7, 30, '#E2E8F0', 5, 1);
  px(7, 32, '#CBD5E1', 5, 1);
  // Right horned skull
  px(41, 19, OUTLINE, 4, 5);
  px(42, 20, '#F8FAFC', 2, 3);
  px(35, 21, OUTLINE, 7, 8);
  px(36, 22, '#F8FAFC', 5, 5);
  px(36, 27, '#CBD5E1', 5, 1);
  px(37, 24, '#EF4444', 1, 2);
  px(39, 24, OUTLINE, 1, 2);
  px(36, 30, '#E2E8F0', 5, 1);
  px(36, 32, '#CBD5E1', 5, 1);

  // Central Gaping Demonic Mouth / Cursed Shrine Maw (x=13..34, y=18..35)
  px(13, 18, '#450A0A', 22, 18);
  px(14, 19, '#991B1B', 20, 2);
  px(14, 33, '#991B1B', 20, 2);
  px(15, 21, '#090D16', 18, 12);
  // Sharp white upper & lower shrine fangs!
  for (let fx = 16; fx <= 31; fx += 3) {
    px(fx, 21, '#F8FAFC', 2, 2);
  }
  for (let fx = 17; fx <= 30; fx += 3) {
    px(fx, 31, '#F8FAFC', 2, 2);
  }
  // Glowing cursed crimson core & crossed slash altar inside the maw
  px(21, 24, '#E11D48', 6, 6);
  px(22, 25, '#FB7185', 4, 4);
  px(20, 26, '#FFFFFF', 8, 1);
  px(23, 23, '#FFFFFF', 2, 8);

  // 5. Heavy Stepped Stone & Bone Plinth Base (y=36..43)
  px(4, 36, OUTLINE, 40, 4);
  px(5, 37, '#334155', 38, 2);
  px(7, 37, '#64748B', 34, 1);
  px(2, 39, OUTLINE, 44, 4);
  px(3, 40, '#1E293B', 42, 2);
  px(5, 40, '#475569', 38, 1);
  // Crimson cursed altar steps in center
  px(18, 36, '#991B1B', 12, 6);
  px(20, 37, '#E11D48', 8, 4);
  px(21, 38, '#FDA4AF', 6, 1);

  return c;
}

// ==================== 5. SINGLETON PIXEL ATLAS ====================
export class PixelSpriteAtlas {
  private iconUrls = new Map<PixelIconId, string>();
  private chickenSprites = new Map<ChickenTypeId, ChickenSpritePair>();
  private enemySprites = new Map<EnemyTypeId, EnemySpriteSet>();
  public standSprites: StandSpriteSet | null = null;
  public malevolentShrineSprite: HTMLCanvasElement | null = null;
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
    this.malevolentShrineSprite = buildMalevolentShrineSprite();

    // Bake all 57 variable-sized Chicken Unit sprites (20x20 up to 42x40) + crisp 2x square portraits!
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
