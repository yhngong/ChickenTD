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
    pal: { O: OUTLINE, R: '#EF4444', W: '#FFF7ED', S: '#FDE68A', Y: '#F59E0B', E: '#1E293B' },
    rows: [
      '....OO.OO.....',
      '...ORRORRO....',
      '...ORRRRR.....',
      '...OOWWWWO....',
      '..OWWWWWWWOO..',
      '..OWWWEWWWWYYO',
      '..OWWWWWWWWYYO',
      '..OWWWSSWWWOO.',
      '..OOWWSSWWRO..',
      '...OOWWWWOO...',
      '....OO..OO....',
      '...OYY..YYO...',
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
};

// ==================== 2. PIXEL CHICKEN GENERATOR (14 DISTINCT UNITS!) ====================
export interface ChickenSpritePair {
  idle: HTMLCanvasElement;
  attack: HTMLCanvasElement;
  portraitUrl: string;
}

function drawChickenUnitPixelArt(typeId: ChickenTypeId, attackFrame: boolean): HTMLCanvasElement {
  const def = CHICKEN_DEFS[typeId];
  const w = 20;
  const h = 20;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d')!;

  const px = (x: number, y: number, col: string, pw = 1, ph = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, pw, ph);
  };

  const shiftX = attackFrame ? 1 : 0;

  // Ground pixel shadow
  px(5, 17, 'rgba(15,23,42,0.45)', 10, 2);

  // Feet
  px(7, 16, '#F59E0B', 2, 2);
  px(11, 16, '#F59E0B', 2, 2);

  // Plump Chicken Body + 1px Pixel Outline
  px(5 + shiftX, 7, OUTLINE, 9, 9);
  px(4 + shiftX, 8, OUTLINE, 11, 7);
  // Tail feathers on left
  px(2 + shiftX, 7, OUTLINE, 3, 5);
  px(3 + shiftX, 8, def.accentColor, 2, 3);

  // Fill Feather Body & Belly Shade
  px(5 + shiftX, 8, def.featherColor, 9, 7);
  px(6 + shiftX, 7, def.featherColor, 7, 1);
  px(6 + shiftX, 12, def.bellyColor, 7, 3);

  // Wing (flaps up on attackFrame!)
  const wingY = attackFrame ? 9 : 10;
  px(6 + shiftX, wingY, OUTLINE, 5, 4);
  px(7 + shiftX, wingY + 1, def.bellyColor, 3, 2);

  // Eye & Wattle & Beak (facing right)
  px(12 + shiftX, 9, OUTLINE, 1, 2);
  px(12 + shiftX, 9, '#FFFFFF', 1, 1);
  px(12 + shiftX, 10, OUTLINE, 1, 1);

  // Beak (opens on attackFrame!)
  px(15 + shiftX, 9, OUTLINE, 3, 3);
  px(15 + shiftX, 10, '#FACC15', 2, 1);
  if (attackFrame) {
    px(15 + shiftX, 11, '#F59E0B', 2, 1);
  }
  // Red wattle under beak
  px(14 + shiftX, 12, '#EF4444', 1, 2);

  // ==================== BESPOKE HEADGEAR & WEAPONS PER UNIT (14 TOTAL) ====================
  switch (typeId) {
    case 'bantam': {
      // Crimson martial-arts headband + knot tails + red fist wraps
      px(5 + shiftX, 6, '#DC2626', 9, 2);
      px(3 + shiftX, 5, '#EF4444', 2, 2);
      px(2 + shiftX, 6, '#DC2626', 2, 1);
      px(9 + shiftX, 4, '#EF4444', 3, 2); // comb peeking above headband
      px(10 + shiftX, wingY + 1, '#DC2626', 2, 2); // karate glove
      break;
    }
    case 'pecker': {
      // Tall 3-point classic red rooster comb + golden seed satchel
      px(7 + shiftX, 4, OUTLINE, 6, 3);
      px(8 + shiftX, 4, '#EF4444', 1, 3);
      px(10 + shiftX, 3, '#EF4444', 1, 4);
      px(12 + shiftX, 5, '#EF4444', 1, 2);
      px(7 + shiftX, 13, '#CA8A04', 3, 2);
      break;
    }
    case 'honey': {
      // Wide golden beekeeper sunhat + dripping honey dipper
      px(3 + shiftX, 6, OUTLINE, 13, 2);
      px(4 + shiftX, 6, '#FACC15', 11, 1);
      px(6 + shiftX, 4, '#FDE047', 7, 2);
      px(6 + shiftX, 5, '#92400E', 7, 1);
      // Honey wand in front
      px(15 + shiftX, 12, '#92400E', 3, 1);
      px(17 + shiftX, 11, '#F59E0B', 2, 3);
      break;
    }
    case 'boomerang': {
      // Aussie slouch bush hat + curved wooden pixel boomerang
      px(3 + shiftX, 6, '#78350F', 12, 1);
      px(6 + shiftX, 4, '#92400E', 7, 2);
      px(6 + shiftX, 5, '#FACC15', 7, 1);
      // Curved boomerang held ready
      px(15 + shiftX, 6, '#B45309', 2, 3);
      px(16 + shiftX, 8, '#F59E0B', 2, 2);
      break;
    }
    case 'chilly': {
      // 3-spike icy crystal crown + cozy blue frost scarf
      px(7 + shiftX, 3, '#38BDF8', 2, 4);
      px(9 + shiftX, 2, '#E0F2FE', 2, 5);
      px(11 + shiftX, 4, '#0284C7', 2, 3);
      px(5 + shiftX, 12, '#0284C7', 9, 2);
      px(6 + shiftX, 14, '#38BDF8', 2, 2);
      break;
    }
    case 'alchemist': {
      // Dark plague hood + glowing emerald acid flask
      px(5 + shiftX, 4, '#064E3B', 8, 4);
      px(4 + shiftX, 6, '#065F46', 4, 5);
      px(11 + shiftX, 9, '#34D399', 2, 2); // glowing alchemist goggles!
      // Bubbling green potion flask
      px(15 + shiftX, 12, '#A7F3D0', 3, 4);
      px(15 + shiftX, 13, '#10B981', 3, 3);
      break;
    }
    case 'ranger': {
      // Forest green campaign hat + long sniper rifle barrel + scope
      px(4 + shiftX, 6, '#14532D', 11, 1);
      px(6 + shiftX, 3, '#15803D', 7, 3);
      px(6 + shiftX, 5, '#CA8A04', 7, 1);
      // Rifle barrel + scope
      px(10 + shiftX, 11, OUTLINE, 9, 2);
      px(12 + shiftX, 10, '#475569', 3, 1);
      break;
    }
    case 'lobber': {
      // Olive military Brodie helmet + chunky dark mortar tube
      px(4 + shiftX, 6, '#365314', 11, 1);
      px(5 + shiftX, 4, '#4D7C0F', 9, 2);
      px(7 + shiftX, 4, '#84CC16', 3, 1);
      // Mortar cannon angled up-right
      px(14 + shiftX, 10, OUTLINE, 5, 4);
      px(15 + shiftX, 11, '#334155', 3, 2);
      break;
    }
    case 'wizard': {
      // Tall pointed purple arcane wizard hat + gold band + glowing staff
      px(3 + shiftX, 6, '#581C87', 13, 1);
      px(5 + shiftX, 4, '#7E22CE', 9, 2);
      px(6 + shiftX, 5, '#FACC15', 7, 1);
      px(7 + shiftX, 2, '#9333EA', 5, 2);
      px(8 + shiftX, 0, '#A855F7', 3, 2);
      // Arcane lightning orb staff
      px(16 + shiftX, 8, '#78350F', 1, 8);
      px(15 + shiftX, 6, '#E879F9', 3, 3);
      px(16 + shiftX, 7, '#FEF08A', 1, 1);
      break;
    }
    case 'ninja': {
      // Slate-black ninja hood/mask + red headband + bright steel shuriken
      px(5 + shiftX, 5, '#1E293B', 9, 4);
      px(5 + shiftX, 11, '#1E293B', 9, 3);
      px(5 + shiftX, 7, '#DC2626', 9, 1);
      px(2 + shiftX, 6, '#DC2626', 3, 2);
      // Pixel shuriken star
      px(16 + shiftX, 11, '#E2E8F0', 1, 3);
      px(15 + shiftX, 12, '#E2E8F0', 3, 1);
      break;
    }
    case 'pirate': {
      // Black tricorn pirate hat + gold skull pixel + eyepatch + broadside cannon
      px(3 + shiftX, 5, OUTLINE, 13, 2);
      px(4 + shiftX, 3, '#0F172A', 11, 3);
      px(4 + shiftX, 3, '#FACC15', 11, 1);
      px(9 + shiftX, 4, '#F8FAFC', 2, 2);
      px(11 + shiftX, 9, OUTLINE, 3, 2); // Eyepatch
      // Iron cannon barrel
      px(14 + shiftX, 12, '#0F172A', 5, 3);
      px(15 + shiftX, 12, '#475569', 3, 1);
      break;
    }
    case 'bard': {
      // Wide festive red-and-gold Mexican sombrero + acoustic pixel guitar!
      px(1 + shiftX, 6, '#E11D48', 17, 2);
      px(2 + shiftX, 6, '#FACC15', 15, 1);
      px(6 + shiftX, 3, '#BE123C', 7, 3);
      px(7 + shiftX, 4, '#FACC15', 5, 1);
      // Pixel guitar across belly
      px(8 + shiftX, 11, '#B45309', 5, 4);
      px(9 + shiftX, 12, '#FDE68A', 2, 2);
      px(13 + shiftX, 10, '#78350F', 5, 2);
      break;
    }
    case 'phoenix': {
      // Blazing 5-point solar crown + fiery orange/gold wing tips!
      px(6 + shiftX, 2, '#EA580C', 1, 5);
      px(8 + shiftX, 1, '#FACC15', 1, 6);
      px(10 + shiftX, 0, '#FEF9C3', 2, 7);
      px(13 + shiftX, 2, '#F97316', 1, 5);
      px(2 + shiftX, 7, '#EA580C', 3, 5);
      px(6 + shiftX, wingY + 1, '#F97316', 4, 2);
      break;
    }
    case 'mecha': {
      // Chrome cyber-crest + glowing neon cyan visor + twin shoulder plasma rails!
      px(7 + shiftX, 3, '#06B6D4', 5, 4);
      px(8 + shiftX, 4, '#CFFAFE', 3, 2);
      // Glowing cyan Robo-Visor
      px(10 + shiftX, 8, '#0891B2', 5, 3);
      px(11 + shiftX, 9, '#67E8F9', 4, 1);
      // Twin laser rail barrels
      px(12 + shiftX, 6, '#334155', 7, 2);
      px(17 + shiftX, 6, '#22D3EE', 2, 2);
      px(12 + shiftX, 12, '#334155', 7, 2);
      px(17 + shiftX, 12, '#22D3EE', 2, 2);
      break;
    }
  }

  return c;
}

// ==================== 3. ENEMY PIXEL SPRITES (7 BUGS + 4 GIANT FOXES) ====================
export interface EnemySpriteSet {
  frames: [HTMLCanvasElement, HTMLCanvasElement];
  flashFrames: [HTMLCanvasElement, HTMLCanvasElement];
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
  } else if (typeId === 'fox_kitsune') {
    pal.F = '#7E22CE';
    pal.L = '#A855F7';
    pal.W = '#F5D0FE';
    pal.E = '#38BDF8';
  } else if (typeId === 'fox_alpha') {
    pal.F = '#B91C1C';
    pal.L = '#EF4444';
    pal.W = '#FEF08A';
    pal.E = '#38BDF8';
  }

  const crownRow =
    typeId === 'fox_alpha'
      ? '.................OC.OC.OCO..'
      : '..................OO...OO...';
  const earRow =
    typeId === 'fox_alpha'
      ? '.................OCCCCCCC0..'.replace('0', 'O')
      : '.................OFFO.OFFO..';
  pal.M = typeId === 'fox_timber' || typeId === 'fox_alpha' ? '#94A3B8' : pal.L;

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

// ==================== 4. HENHOUSE CLICKER PIXEL SCENE (36x22, 2 FRAMES) ====================
function buildHenhouseScene(pecking: boolean): HTMLCanvasElement {
  const c = makeCanvas(40, 22);
  const ctx = c.getContext('2d')!;
  const px = (x: number, y: number, col: string, w = 1, h = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };

  // Straw nest cushion under hen
  px(3, 16, OUTLINE, 18, 4);
  px(4, 17, '#D97706', 16, 2);
  px(6, 16, '#FACC15', 12, 1);

  // Plump Mother Hen (leans right & down when pecking!)
  const hx = pecking ? 7 : 5;
  const hy = pecking ? 6 : 5;
  px(hx, hy + 2, OUTLINE, 11, 9);
  px(hx + 1, hy + 3, '#FFF7ED', 9, 7);
  px(hx + 2, hy + 7, '#FDE68A', 7, 3);
  // Red comb
  px(hx + 3, hy, '#EF4444', 5, 3);
  // Eye & Beak
  px(hx + 8, hy + 4, OUTLINE, 1, 2);
  px(hx + 11, hy + 5, '#F59E0B', 3, 2);
  px(hx + 10, hy + 7, '#EF4444', 1, 2);

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

// ==================== 5. SINGLETON PIXEL ATLAS ====================
export class PixelSpriteAtlas {
  private iconUrls = new Map<PixelIconId, string>();
  private chickenSprites = new Map<ChickenTypeId, ChickenSpritePair>();
  private enemySprites = new Map<EnemyTypeId, EnemySpriteSet>();
  public henhouseIdleUrl = '';
  public henhousePeckUrl = '';

  constructor() {
    if (typeof document === 'undefined') return;

    // Bake UI Icons at 2x crisp pixel scale (28x24)
    for (const id of Object.keys(UI_ICON_GRIDS) as PixelIconId[]) {
      const spec = UI_ICON_GRIDS[id];
      const canvas = compileGridSprite(spec.rows, spec.pal, 2);
      this.iconUrls.set(id, canvas.toDataURL());
    }

    // Bake all 14 Chicken Unit sprites + 2x shop portraits
    for (const id of Object.keys(CHICKEN_DEFS) as ChickenTypeId[]) {
      const idle = drawChickenUnitPixelArt(id, false);
      const attack = drawChickenUnitPixelArt(id, true);
      const portraitCanvas = makeCanvas(40, 40);
      const pCtx = portraitCanvas.getContext('2d')!;
      pCtx.drawImage(idle, 0, 0, 40, 40);
      this.chickenSprites.set(id, {
        idle,
        attack,
        portraitUrl: portraitCanvas.toDataURL(),
      });
    }

    // Bake all 11 Enemy sprites (7 Bugs + 4 Giant Foxes) + hit-flash silhouettes
    const bugIds: EnemyTypeId[] = [
      'ant',
      'aphid',
      'ladybug',
      'hornet',
      'camo_moth',
      'beetle',
      'mantis',
    ];
    for (const id of bugIds) {
      const f0 = buildBugSprite(id, 0);
      const f1 = buildBugSprite(id, 1);
      this.enemySprites.set(id, {
        frames: [f0, f1],
        flashFrames: [makeFlashSprite(f0), makeFlashSprite(f1)],
      });
    }

    const foxIds: EnemyTypeId[] = ['fox_scout', 'fox_timber', 'fox_kitsune', 'fox_alpha'];
    for (const id of foxIds) {
      const f0 = buildFoxBossSprite(id, 0);
      const f1 = buildFoxBossSprite(id, 1);
      this.enemySprites.set(id, {
        frames: [f0, f1],
        flashFrames: [makeFlashSprite(f0), makeFlashSprite(f1)],
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
