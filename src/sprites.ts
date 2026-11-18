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
    // Rapid Multi-Fist "ORA-ORA!" Pixel Barrage + Speed Lines!
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

function drawChickenUnitPixelArt(typeId: ChickenTypeId, attackFrame: boolean): HTMLCanvasElement {
  const def = CHICKEN_DEFS[typeId];
  const w = 22;
  const h = 22;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;

  const px = (x: number, y: number, col: string, pw = 1, ph = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, pw, ph);
  };

  const shiftX = attackFrame ? 1 : 0;
  const hopY = attackFrame ? -1 : 0;
  const bx = 4 + shiftX;
  const by = 7 + hopY;

  // 1. Soft Oval Ground Shadow
  px(5, 19, 'rgba(15,23,42,0.34)', 12, 2);

  // 2. Back-Layer Capes / Angel Wings / Dragon Wings (drawn behind the chubby borb body!)
  if (typeId === 'valkyrie') {
    px(bx - 2, by + 3, OUTLINE, 4, 7);
    px(bx - 1, by + 4, '#38BDF8', 2, 5);
  } else if (typeId === 'omega_god' || typeId === 'chronos_empress') {
    px(bx - 3, by + 1, OUTLINE, 5, 8);
    px(bx - 2, by + 2, '#FEF08A', 3, 6);
    px(bx - 1, by + 3, '#FFFFFF', 2, 4);
  } else if (typeId === 'phoenix') {
    px(bx - 3, by + 2, '#EA580C', 4, 6);
    px(bx - 2, by + 3, '#FACC15', 2, 4);
  } else if (typeId === 'yukimura_shadow') {
    px(bx - 3, by + 1, OUTLINE, 5, 8);
    px(bx - 2, by + 2, '#DC2626', 3, 6);
    px(bx - 1, by + 3, '#FCA5A5', 2, 3);
  } else if (typeId === 'bahamut_wyrm') {
    px(bx - 4, by, OUTLINE, 6, 9);
    px(bx - 3, by + 1, '#0F172A', 4, 7);
    px(bx - 2, by + 2, '#22D3EE', 2, 5);
  } else if (typeId === 'cat_god_supreme') {
    px(bx - 4, by, OUTLINE, 6, 10);
    px(bx - 3, by + 1, '#FACC15', 4, 8);
    px(bx - 2, by + 2, '#FFFFFF', 3, 5);
    px(bx - 3, by - 1, '#F43F5E', 2, 2);
  }

  // 3. Tiny Stubby Birdie Feet (hop up happily when attacking!)
  px(bx + 3, by + 11, '#FB923C', 2, 2);
  px(bx + 8, by + 11, '#FB923C', 2, 2);

  // 4. Fluffy Bouncy Tail-Poof on Left
  const tailY = by + (attackFrame ? 3 : 4);
  px(bx - 2, tailY, OUTLINE, 3, 4);
  px(bx - 1, tailY + 1, def.accentColor, 2, 2);
  px(bx - 1, tailY + 1, def.featherColor, 1, 1);

  // 5. Round, Plump, Squishy Mochi-Borb Silhouette (curved pixel corners!)
  px(bx + 3, by, OUTLINE, 7, 11);
  px(bx + 1, by + 1, OUTLINE, 11, 9);
  px(bx, by + 3, OUTLINE, 13, 5);

  // Soft Marshmallow Feather Fill + Top Glossy Highlight + Pastel Tummy Patch
  px(bx + 3, by + 1, def.featherColor, 7, 9);
  px(bx + 2, by + 2, def.featherColor, 9, 7);
  px(bx + 1, by + 3, def.featherColor, 11, 5);
  px(bx + 4, by + 1, '#FFFFFF', 4, 1); // glossy soft crown sheen!
  px(bx + 2, by + 7, def.bellyColor, 9, 2);
  px(bx + 3, by + 9, def.bellyColor, 7, 1);

  // 6. Cute Stubby Wing (flaps up cheerfully on attackFrame!)
  const wingY = by + (attackFrame ? 4 : 5);
  px(bx + 1, wingY, OUTLINE, 5, 4);
  px(bx + 2, wingY + 1, def.bellyColor, 3, 2);
  px(bx + 2, wingY + 1, '#FFFFFF', 2, 1);

  // ==================== 7. CUTE BESPOKE HATS & PROPS (PERCHED ABOVE EYES!) ====================
  switch (typeId) {
    case 'bantam': {
      // Cute bouncy red comb tuft + crimson dojo headband + tiny pom-pom boxing mitts!
      px(bx + 5, by - 3, '#EF4444', 3, 3);
      px(bx + 6, by - 4, '#FB7185', 2, 2);
      px(bx + 2, by + 1, '#DC2626', 9, 2);
      px(bx - 1, by, '#EF4444', 3, 2);
      px(bx + 5, wingY + 1, '#EF4444', 2, 2);
      break;
    }
    case 'pecker': {
      // Bouncy ruby heart-comb + cute little golden seed pouch!
      px(bx + 4, by - 3, OUTLINE, 5, 3);
      px(bx + 4, by - 3, '#EF4444', 2, 2);
      px(bx + 7, by - 3, '#EF4444', 2, 2);
      px(bx + 5, by - 2, '#FB7185', 3, 2);
      px(bx + 4, by + 8, '#CA8A04', 3, 2);
      px(bx + 5, by + 8, '#FEF08A', 1, 1);
      break;
    }
    case 'honey': {
      // Cozy straw sunbonnet with a pink daisy + cute dripping honey dipper!
      px(bx + 1, by + 1, OUTLINE, 11, 1);
      px(bx + 2, by, '#FACC15', 9, 2);
      px(bx + 4, by - 2, '#FDE047', 5, 2);
      px(bx + 4, by - 1, '#FB7185', 2, 2); // tiny pink flower on hat!
      px(bx + 5, by - 1, '#FFFFFF', 1, 1);
      px(bx + 13, by + 7, '#92400E', 2, 1);
      px(bx + 14, by + 6, '#F59E0B', 2, 3);
      break;
    }
    case 'boomerang': {
      // Cute tilted Aussie explorer hat + mini wooden boomerang!
      px(bx + 1, by + 1, '#78350F', 11, 1);
      px(bx + 3, by - 2, '#92400E', 7, 3);
      px(bx + 3, by, '#FACC15', 7, 1);
      px(bx + 13, by + 1, '#B45309', 2, 3);
      px(bx + 14, by + 3, '#FBBF24', 2, 2);
      break;
    }
    case 'chilly': {
      // Fluffy snow-pom tuft + sky earmuff band + cozy striped winter scarf!
      px(bx + 4, by - 3, '#FFFFFF', 5, 3);
      px(bx + 3, by - 1, '#38BDF8', 7, 2);
      px(bx + 2, by, '#0284C7', 2, 3); // fluffy blue earmuff!
      px(bx + 2, by + 8, '#0284C7', 9, 2);
      px(bx + 4, by + 8, '#BAE6FD', 2, 2);
      px(bx + 5, by + 10, '#38BDF8', 2, 2);
      break;
    }
    case 'alchemist': {
      // Cute emerald beret + shiny mint lab goggles pushed up on forehead + round potion!
      px(bx + 2, by - 2, '#065F46', 8, 3);
      px(bx + 4, by, '#10B981', 2, 2);
      px(bx + 7, by, '#10B981', 2, 2);
      px(bx + 4, by, '#A7F3D0', 1, 1);
      px(bx + 7, by, '#A7F3D0', 1, 1);
      px(bx + 13, by + 6, '#A7F3D0', 3, 4);
      px(bx + 13, by + 7, '#10B981', 3, 3);
      break;
    }
    case 'ranger': {
      // Cute forest-scout cap with gold acorn badge + mini pop-rifle under wing!
      px(bx + 2, by + 1, '#14532D', 10, 1);
      px(bx + 3, by - 2, '#15803D', 7, 3);
      px(bx + 6, by - 1, '#FACC15', 2, 2);
      px(bx + 8, by + 7, OUTLINE, 8, 2);
      px(bx + 10, by + 6, '#38BDF8', 2, 1);
      break;
    }
    case 'lobber': {
      // Adorable oversized round olive helmet + stubby egg-popper tube!
      px(bx + 2, by - 2, '#4D7C0F', 9, 3);
      px(bx + 1, by + 1, '#365314', 11, 1);
      px(bx + 4, by - 1, '#BEF264', 3, 1);
      px(bx + 12, by + 6, OUTLINE, 4, 4);
      px(bx + 13, by + 7, '#475569', 2, 2);
      break;
    }
    case 'wizard': {
      // Crooked starry pastel-purple witch/wizard hat + cute star wand!
      px(bx + 1, by + 1, '#581C87', 11, 1);
      px(bx + 3, by - 1, '#7E22CE', 7, 2);
      px(bx + 3, by, '#FACC15', 7, 1);
      px(bx + 4, by - 3, '#9333EA', 5, 2);
      px(bx + 3, by - 5, '#C084FC', 4, 2);
      px(bx + 14, by + 4, '#92400E', 1, 6);
      px(bx + 13, by + 2, '#FEF08A', 3, 3);
      px(bx + 14, by + 3, '#FFFFFF', 1, 1);
      break;
    }
    case 'ninja': {
      // Cute dark shinobi forehead headband + silver leaf plate + fluttering red ribbons!
      px(bx + 2, by + 1, '#1E293B', 9, 2);
      px(bx + 6, by + 1, '#E2E8F0', 3, 1);
      px(bx - 1, by + 1, '#DC2626', 3, 2);
      px(bx - 2, by + 2, '#EF4444', 2, 1);
      px(bx + 14, by + 6, '#94A3B8', 1, 3);
      px(bx + 13, by + 7, '#E2E8F0', 3, 1);
      break;
    }
    case 'pirate': {
      // Mini captain tricorn hat with golden trim & tiny heart-skull + toy cannon!
      px(bx + 1, by + 1, OUTLINE, 11, 1);
      px(bx + 2, by - 2, '#0F172A', 9, 3);
      px(bx + 2, by - 2, '#FACC15', 9, 1);
      px(bx + 6, by - 1, '#FDA4AF', 2, 2);
      px(bx + 12, by + 7, '#1E293B', 5, 3);
      px(bx + 13, by + 7, '#94A3B8', 3, 1);
      break;
    }
    case 'bard': {
      // Festive mini red-and-gold fiesta sombrero + cute tiny acoustic guitar!
      px(bx - 1, by + 1, '#E11D48', 15, 1);
      px(bx, by, '#FACC15', 13, 1);
      px(bx + 4, by - 3, '#BE123C', 5, 3);
      px(bx + 5, by - 2, '#FDE047', 3, 1);
      px(bx + 6, by + 7, '#D97706', 4, 3);
      px(bx + 7, by + 8, '#FEF08A', 2, 1);
      px(bx + 10, by + 6, '#78350F', 5, 2);
      break;
    }
    case 'phoenix': {
      // Cute sunny halo & warm flame-tuft crown!
      px(bx + 4, by - 3, '#F97316', 2, 3);
      px(bx + 6, by - 5, '#FACC15', 2, 5);
      px(bx + 7, by - 4, '#FFFFFF', 1, 3);
      px(bx + 8, by - 3, '#FB923C', 2, 3);
      px(bx + 2, wingY + 1, '#F97316', 3, 2);
      break;
    }
    case 'mecha': {
      // Cute cyber-neko ear headset + glowing cyan forehead visor + mini shoulder blasters!
      px(bx + 3, by - 3, '#06B6D4', 2, 3);
      px(bx + 8, by - 3, '#06B6D4', 2, 3);
      px(bx + 3, by, '#0891B2', 8, 2);
      px(bx + 4, by + 1, '#67E8F9', 6, 1);
      px(bx + 11, by + 1, '#334155', 5, 2);
      px(bx + 15, by + 1, '#22D3EE', 2, 2);
      break;
    }
    case 'tesla': {
      // Cute twin blue spark-bobbles on head + tiny yellow lightning zaps!
      px(bx + 3, by - 3, '#6366F1', 2, 3);
      px(bx + 8, by - 3, '#6366F1', 2, 3);
      px(bx + 3, by - 4, '#38BDF8', 2, 2);
      px(bx + 8, by - 4, '#38BDF8', 2, 2);
      px(bx + 5, by - (attackFrame ? 4 : 3), '#FEF08A', 3, 1);
      px(bx + 12, by + 7, '#4F46E5', 4, 2);
      px(bx + 15, by + 7, '#FEF08A', 2, 2);
      break;
    }
    case 'chrono': {
      // Dapper tiny pocket-watch top hat + cute mini teal hourglass!
      px(bx + 2, by + 1, '#78350F', 9, 1);
      px(bx + 4, by - 4, '#92400E', 5, 5);
      px(bx + 4, by, '#FACC15', 5, 1);
      px(bx + 5, by - 3, '#5EEAD4', 3, 2);
      px(bx + 13, by + 6, '#FACC15', 3, 1);
      px(bx + 14, by + 7, '#2DD4BF', 1, 2);
      px(bx + 13, by + 9, '#FACC15', 3, 1);
      break;
    }
    case 'gundam': {
      // Adorable chibi Gundam V-fin forehead crest + mini toy beam blaster!
      px(bx + 3, by - 1, '#2563EB', 7, 3);
      px(bx + 1, by - 4, '#FACC15', 3, 2);
      px(bx + 4, by - 3, '#FEF08A', 5, 2);
      px(bx + 9, by - 4, '#FACC15', 3, 2);
      px(bx + 6, by - 2, '#EF4444', 2, 2);
      px(bx + 11, by + 7, '#334155', 5, 2);
      px(bx + 15, by + 7, '#FB7185', 2, 2);
      break;
    }
    case 'stand_hen': {
      // JOJO CLUCKSTAR: Iconic dark-indigo Stand-User cap + gold badge + purple/gold Stand aura!
      px(bx + 2, by - 2, '#1E1B4B', 8, 4);
      px(bx + 3, by + 1, '#312E81', 10, 1); // cool peaked cap brim above eye!
      px(bx + 2, by - 2, '#FACC15', 8, 1); // gold cap band
      px(bx + 7, by - 1, '#FACC15', 2, 2); // gold Jotaro wing-emblem!
      // Cool purple Stand-User collar & gold chain pixel on chest
      px(bx + 2, by + 7, '#4C1D95', 5, 2);
      px(bx + 6, by + 7, '#FACC15', 2, 1);
      // Floating menacing Stand aura sparkles!
      px(1, 4, '#C084FC', 2, 2);
      px(2, 3, '#FEF08A', 1, 1);
      px(18, 2, '#A855F7', 2, 2);
      px(19, 1, '#22D3EE', 1, 1);
      break;
    }
    case 'valkyrie': {
      // Tiny white-winged golden Valkyrie circlet + sparkling star-spear!
      px(bx + 3, by, '#F59E0B', 7, 2);
      px(bx + 5, by - 1, '#38BDF8', 3, 2);
      px(bx + 1, by - 3, '#FFFFFF', 3, 3);
      px(bx + 9, by - 3, '#FFFFFF', 3, 3);
      px(bx + 9, by + 7, '#D97706', 5, 1);
      px(bx + 14, by + 6, '#7DD3FC', 3, 3);
      px(bx + 15, by + 7, '#FFFFFF', 2, 1);
      break;
    }
    case 'star_dread': {
      // Cute starfleet captain cap + adorable tiny pet UFO drone hovering above!
      px(bx + 2, by - 2, '#1E293B', 9, 3);
      px(bx + 2, by, '#FACC15', 10, 1);
      px(bx + 6, by - 2, '#FB7185', 2, 2);
      // Tiny cute pet UFO escort!
      px(1, 3, '#94A3B8', 4, 1);
      px(2, 2, '#38BDF8', 2, 1);
      px(13 + shiftX, by + 7, '#F43F5E', 3, 2);
      break;
    }
    case 'quasar': {
      // Pastel pink-and-cyan starry halo + cute galaxy tummy + mini shooting star!
      px(bx + 3, by - 3, '#22D3EE', 7, 1);
      px(bx + 2, by - 2, '#F472B6', 9, 1);
      px(bx + 5, by - 4, '#FFFFFF', 3, 2);
      px(bx + 13, by + 2, '#F472B6', 3, 3);
      px(bx + 14, by + 3, '#FFFFFF', 1, 1);
      break;
    }
    case 'omega_god': {
      // Radiant floating golden angel halo + mini crown + hovering cute Golden Egg!
      px(bx + 3, by - 5, '#FEF08A', 7, 1);
      px(bx + 2, by - 4, '#FACC15', 2, 1);
      px(bx + 9, by - 4, '#FACC15', 2, 1);
      px(bx + 4, by - 2, '#F59E0B', 5, 2);
      px(bx + 6, by - 3, '#38BDF8', 2, 2);
      // Cute miniature Sacred Golden Egg floating in front
      px(bx + 13, by + 1, OUTLINE, 4, 5);
      px(bx + 14, by + 2, '#FACC15', 2, 3);
      px(bx + 14, by + 2, '#FFFFFF', 1, 1);
      break;
    }
    case 'macho_cat': {
      // Battle Cats Macho Cat-Hen: pointy white cat ears + pink inner ears + macho crimson headband + paw mitt!
      px(bx + 2, by - 3, OUTLINE, 3, 3);
      px(bx + 8, by - 3, OUTLINE, 3, 3);
      px(bx + 3, by - 2, '#FFFFFF', 2, 2);
      px(bx + 8, by - 2, '#FFFFFF', 2, 2);
      px(bx + 3, by - 1, '#FDA4AF', 1, 1);
      px(bx + 9, by - 1, '#FDA4AF', 1, 1);
      px(bx + 2, by + 1, '#F43F5E', 9, 1);
      // Cute Battle-Cat paw glove in front!
      px(bx + 12, by + 6, OUTLINE, 4, 4);
      px(bx + 13, by + 7, '#FFFFFF', 2, 2);
      px(bx + 14, by + 7, '#FB7185', 1, 1);
      break;
    }
    case 'eraser_tank': {
      // Battle Cats Eraser Wall-Hen: tall rectangular white/blue eraser block crest + heavy tower shield!
      px(bx + 3, by - 4, OUTLINE, 7, 5);
      px(bx + 4, by - 3, '#FFFFFF', 5, 2);
      px(bx + 4, by - 1, '#3B82F6', 5, 2);
      // Sturdy Eraser Monolith Shield held out front
      px(bx + 12, by + 5, OUTLINE, 5, 6);
      px(bx + 13, by + 6, '#E2E8F0', 3, 2);
      px(bx + 13, by + 8, '#2563EB', 3, 2);
      break;
    }
    case 'kasli_oracle': {
      // Surge Priestess (Kasli homage): twin cyan-tipped ritual horns + dark cowl + cursed Surge staff!
      px(bx + 2, by - 4, '#0F172A', 2, 4);
      px(bx + 9, by - 4, '#0F172A', 2, 4);
      px(bx + 2, by - 5, '#22D3EE', 2, 2);
      px(bx + 9, by - 5, '#22D3EE', 2, 2);
      px(bx + 2, by, '#1E293B', 9, 2);
      // Ritual staff with glowing turquoise surge orb
      px(bx + 14, by + 2, '#1E293B', 1, 9);
      px(bx + 13, by + 1, '#06B6D4', 3, 3);
      px(bx + 14, by + 2, '#FFFFFF', 1, 1);
      break;
    }
    case 'cyber_sniper': {
      // Hacker Nerd-Hen (Cyberpunk Cat homage): neon green matrix visor + headset + floating holo-screen!
      px(bx + 2, by - 2, '#334155', 9, 2);
      px(bx + 1, by - 1, '#10B981', 2, 3);
      px(bx + 6, by + 2, '#064E3B', 6, 2);
      px(bx + 7, by + 2, '#4ADE80', 4, 1);
      // Floating translucent green Matrix terminal
      px(bx + 13, by + 5, '#065F46', 4, 4);
      px(bx + 14, by + 6, '#4ADE80', 2, 2);
      break;
    }
    case 'samurai_shogun': {
      // Musashi Blade-Hen: crimson samurai kabuto + golden crescent-moon crest + twin katanas!
      px(bx + 1, by, '#991B1B', 11, 2);
      px(bx + 3, by - 2, '#DC2626', 7, 2);
      px(bx + 4, by - 4, '#FACC15', 5, 2);
      px(bx + 5, by - 4, '#FEF9C3', 3, 1);
      // Gleaming silver katana blade forward
      px(bx + 12, by + 6, '#94A3B8', 5, 2);
      px(bx + 13, by + 6, '#FFFFFF', 4, 1);
      break;
    }
    case 'necro_lich': {
      // Necro-Cluck Lich: bone skull crown + emerald soul-flame eyes on crown + floating soul lantern!
      px(bx + 2, by - 3, OUTLINE, 9, 4);
      px(bx + 3, by - 2, '#F8FAFC', 7, 3);
      px(bx + 4, by - 1, '#10B981', 2, 1);
      px(bx + 8, by - 1, '#10B981', 2, 1);
      // Floating emerald wisp flame
      px(bx + 13, by + 1, '#059669', 4, 4);
      px(bx + 14, by + 2, '#6EE7B7', 2, 2);
      px(bx + 14, by, '#A7F3D0', 1, 2);
      break;
    }
    case 'yukimura_shadow': {
      // Shadow Yukimura: dark tengu war-crest + blazing scarlet sanada coins + crimson blade!
      px(bx + 2, by - 2, '#0F172A', 9, 3);
      px(bx + 4, by - 4, '#EF4444', 5, 2);
      px(bx + 5, by - 1, '#FACC15', 3, 1);
      px(bx + 12, by + 6, '#DC2626', 5, 2);
      px(bx + 13, by + 6, '#FCA5A5', 3, 1);
      break;
    }
    case 'bahamut_wyrm': {
      // Awakened Baha-Cluck: swept abyssal dragon horns + glowing cyan chest reactor + energy orb!
      px(bx + 1, by - 4, '#0F172A', 3, 4);
      px(bx + 9, by - 4, '#0F172A', 3, 4);
      px(bx + 1, by - 5, '#22D3EE', 2, 2);
      px(bx + 10, by - 5, '#22D3EE', 2, 2);
      px(bx + 5, by + 6, '#06B6D4', 3, 3);
      px(bx + 6, by + 7, '#FFFFFF', 1, 1);
      px(bx + 13, by + 5, '#22D3EE', 4, 4);
      px(bx + 14, by + 6, '#FFFFFF', 2, 2);
      break;
    }
    case 'chronos_empress': {
      // Empress Chronos: golden celestial clockwork halo + sapphire diadem + golden spear!
      px(bx + 2, by - 5, '#FACC15', 9, 1);
      px(bx + 4, by - 3, '#FEF08A', 5, 2);
      px(bx + 6, by - 3, '#38BDF8', 2, 2);
      px(bx + 14, by + 1, '#CA8A04', 2, 9);
      px(bx + 13, by, '#FEF08A', 4, 3);
      break;
    }
    case 'gaia_creator': {
      // Gaia Mother-Hen: emerald crystal antlers + pink/gold blossoms + floating rainbow prism!
      px(bx + 1, by - 4, '#16A34A', 2, 4);
      px(bx + 10, by - 4, '#16A34A', 2, 4);
      px(bx + 3, by - 2, '#F472B6', 2, 2);
      px(bx + 8, by - 2, '#FACC15', 2, 2);
      px(bx + 5, by - 3, '#38BDF8', 3, 2);
      // Floating rainbow nature prism
      px(bx + 13, by + 1, '#F43F5E', 4, 4);
      px(bx + 14, by + 2, '#38BDF8', 2, 2);
      px(bx + 14, by + 2, '#FEF08A', 1, 1);
      break;
    }
    case 'void_singularity': {
      // Singularity Hen: glowing magenta/cyan accretion ring + dark-star crown + mini black hole!
      px(bx + 1, by - 3, '#F472B6', 11, 1);
      px(bx + 3, by - 4, '#22D3EE', 7, 1);
      px(bx + 5, by - 2, '#0F172A', 3, 2);
      // Mini orbiting black hole in front
      px(bx + 13, by + 5, '#F472B6', 4, 4);
      px(bx + 14, by + 6, '#0F172A', 2, 2);
      break;
    }
    case 'cat_god_supreme': {
      // Golden Cluck-God (1,000,000 Corn): golden Battle-Cat ears crown + ruby jewel + divine sun-bolt!
      px(bx + 2, by - 5, '#FACC15', 3, 4);
      px(bx + 8, by - 5, '#FACC15', 3, 4);
      px(bx + 3, by - 3, '#FEF9C3', 7, 3);
      px(bx + 6, by - 3, '#F43F5E', 2, 2);
      px(bx + 1, by - 6, '#FFFFFF', 11, 1); // divine halo above crown!
      // Floating Golden Gem Egg Scepter
      px(bx + 13, by + 1, OUTLINE, 4, 6);
      px(bx + 14, by + 2, '#EC4899', 2, 2);
      px(bx + 14, by + 4, '#FACC15', 2, 2);
      break;
    }
    case 'roost_beacon': {
      // Roost Beacon (Bloons Village homage): thatched wooden watchtower roof + radar beacon + war-drum!
      px(bx + 1, by, '#78350F', 11, 2);
      px(bx + 3, by - 2, '#D97706', 7, 2);
      px(bx + 5, by - 5, '#94A3B8', 2, 3);
      px(bx + 5, by - 6, '#38BDF8', 2, 2); // spinning cyan radar beacon tip!
      // Cute red & gold Jungle Drum in front!
      px(bx + 12, by + 6, OUTLINE, 5, 5);
      px(bx + 13, by + 7, '#DC2626', 3, 3);
      px(bx + 13, by + 7, '#FEF08A', 3, 1);
      break;
    }
    case 'brew_hen': {
      // Espresso Brew-Hen (Bloons Alch-Buff homage): cozy brown barista beret + steaming golden buff mug!
      px(bx + 2, by - 2, '#78350F', 8, 3);
      px(bx + 4, by - 3, '#B45309', 4, 1);
      px(bx + 3, by + 8, '#FFFFFF', 6, 2); // crisp white barista apron!
      // Glowing Berserker Espresso Mug + rising steam!
      px(bx + 12, by + 6, OUTLINE, 5, 5);
      px(bx + 13, by + 7, '#F59E0B', 3, 3);
      px(bx + 13, by + 7, '#FEF08A', 2, 1);
      px(bx + 14, by + 3, '#FFFFFF', 1, 2);
      break;
    }
    case 'overclock_engie': {
      // Overclock Engie-Hen (Bloons Engineer homage): yellow hard-hat + blue overclock coil + silver wrench!
      px(bx + 1, by, '#CA8A04', 11, 1);
      px(bx + 2, by - 3, '#FACC15', 9, 3);
      px(bx + 5, by - 2, '#0284C7', 3, 2);
      px(bx + 6, by - 4, '#38BDF8', 2, 2); // glowing blue overclock spark!
      // Heavy silver mechanic wrench
      px(bx + 13, by + 4, '#94A3B8', 2, 6);
      px(bx + 12, by + 3, '#E2E8F0', 4, 2);
      break;
    }
    case 'idol_diva': {
      // Shrine Idol-Hen: twin pink idol ribbons + starlight tiara + golden bell microphone + floating notes!
      px(bx + 1, by - 3, '#EC4899', 3, 3);
      px(bx + 9, by - 3, '#EC4899', 3, 3);
      px(bx + 4, by - 4, '#FACC15', 5, 2);
      px(bx + 6, by - 4, '#FFFFFF', 1, 1);
      // Golden Idol Microphone + floating cyan musical note!
      px(bx + 13, by + 6, '#CA8A04', 2, 4);
      px(bx + 12, by + 4, '#F472B6', 4, 2);
      px(17, 2, '#38BDF8', 2, 3);
      px(18, 1, '#FEF08A', 2, 1);
      break;
    }
  }

  // ==================== 8. PROTECTED KAWAII FACE (SPARKLE EYE + ROSY BLUSH + CHIRP BEAK!) ====================
  // Big glossy 2x3 dark kawaii eye + crisp 1x1 white catchlight sparkle!
  px(bx + 9, by + 3, OUTLINE, 2, 3);
  px(bx + 9, by + 3, '#FFFFFF', 1, 1);
  px(bx + 10, by + 5, '#64748B', 1, 1);

  // Soft two-tone rosy pink cheek blush!
  px(bx + 7, by + 6, '#FB7185', 2, 1);
  px(bx + 7, by + 6, '#FDA4AF', 1, 1);

  // Tiny sweet golden-orange chirp beak (opens into a happy "peep!" on attackFrame!)
  px(bx + 12, by + 4, OUTLINE, 3, 2);
  px(bx + 12, by + 4, '#FDE047', 2, 1);
  px(bx + 12, by + 5, '#F97316', 2, 1);
  if (attackFrame) {
    px(bx + 12, by + 6, '#FB7185', 2, 1);
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

    // Bake all 34 Kawaii Chicken Unit sprites (22x22) + crisp 2x shop portraits (44x44) + locked silhouettes!
    for (const id of Object.keys(CHICKEN_DEFS) as ChickenTypeId[]) {
      const idle = drawChickenUnitPixelArt(id, false);
      const attack = drawChickenUnitPixelArt(id, true);
      const portraitCanvas = makeCanvas(44, 44);
      const pCtx = portraitCanvas.getContext('2d')!;
      if (id === 'stand_hen' && this.standSprites) {
        // Show JoJo Cluckstar's glowing Stand Spirit hovering behind it in the Shop portrait!
        pCtx.save();
        pCtx.globalAlpha = 0.85;
        pCtx.drawImage(this.standSprites.normalIdle, -2, 0, 36, 33);
        pCtx.restore();
        pCtx.drawImage(idle, 6, 4, 40, 40);
      } else {
        pCtx.drawImage(idle, 0, 0, 44, 44);
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
