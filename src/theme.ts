import { Platform } from 'react-native';
export const FONTS = { ui: 'Tajawal_400Regular', uiMed: 'Tajawal_500Medium', uiBold: 'Tajawal_700Bold', uiBlack: 'Tajawal_800ExtraBold', display: 'Amiri_700Bold', displayReg: 'Amiri_400Regular', quran: 'UthmanicHafs' };
export const QSIZES = [18, 21, 25, 30];
export const FLABELS = ['صغير', 'متوسط', 'كبير', 'أكبر'];
export type Mode = 'light' | 'dark';
export type Accent = 'royal' | 'emerald' | 'dusk';
export const ACCENTS: { key: Accent; label: string }[] = [{ key: 'royal', label: 'الملكي' }, { key: 'emerald', label: 'الزمردي' }, { key: 'dusk', label: 'الشفق' }];

// ── Siraj palette: Navy Blue (#0A1C38 / #000080) · Silver (#C0C0C0) · Clean White (#FFFFFF) ──
const NAVY        = '#0A1C38';
const NAVY_DARK   = '#051020';
const NAVY_SURF   = '#0B1E38';
const NAVY_CARD   = '#0E2342';
const NAVY_LINE   = '#1E3558';

const SILVER       = '#C0C0C0';
const SILVER_LIGHT = '#E2E8F0';
const SILVER_SOFT  = '#F1F4F9';
const SILVER_MUTED = '#5C6F89';
const SILVER_DIM   = '#94A3B8';
const WHITE        = '#FFFFFF';

const A: any = {
  royal:   { d: [NAVY, NAVY_DARK, '#12294E', '#1B3B66'], k: [NAVY_DARK, NAVY_SURF, NAVY_CARD], bg: WHITE, soft: SILVER_SOFT, ink: NAVY, inkS: SILVER_MUTED, inkF: SILVER_DIM, paper: WHITE, line: SILVER_LIGHT },
  emerald: { d: [NAVY, NAVY_DARK, '#12294E', '#1B3B66'], k: [NAVY_DARK, NAVY_SURF, NAVY_CARD], bg: WHITE, soft: SILVER_SOFT, ink: NAVY, inkS: SILVER_MUTED, inkF: SILVER_DIM, paper: WHITE, line: SILVER_LIGHT },
  dusk:    { d: [NAVY, NAVY_DARK, '#12294E', '#1B3B66'], k: [NAVY_DARK, NAVY_SURF, NAVY_CARD], bg: WHITE, soft: SILVER_SOFT, ink: NAVY, inkS: SILVER_MUTED, inkF: SILVER_DIM, paper: WHITE, line: SILVER_LIGHT },
};

export function palette(mode: Mode, acc: Accent): any {
  const a = A[acc] || A.royal;
  const base = { n0: NAVY, n1: NAVY_DARK, n2: '#12294E', n3: '#1B3B66', onDark: WHITE, onDarkS: SILVER, onDarkF: SILVER_DIM, dLine: 'rgba(192,192,192,0.25)' };
  if (mode === 'light') return Object.assign(base, {
    mode, bg: WHITE, bgSoft: SILVER_SOFT, surface: WHITE, card: WHITE,
    line: SILVER_LIGHT, ink: NAVY, inkS: SILVER_MUTED, inkF: SILVER_DIM,
    gold: NAVY, goldS: SILVER, goldD: NAVY, goldBg: SILVER_SOFT,
    paper: WHITE, paperInk: NAVY, frame: SILVER, marker: SILVER_MUTED,
    ok: '#1E7A4C', okBg: '#E3F1E9', warn: '#A8721B', bad: '#B23A32', badBg: '#F9E9E7',
    info: NAVY, infoBg: SILVER_SOFT, scrim: 'rgba(10,28,56,0.60)', tab: WHITE,
  });
  // dark mode
  return Object.assign(base, {
    mode, bg: NAVY_DARK, bgSoft: NAVY_SURF, surface: NAVY_SURF, card: NAVY_CARD,
    line: NAVY_LINE, ink: WHITE, inkS: SILVER, inkF: '#768BA7',
    gold: WHITE, goldS: SILVER, goldD: SILVER_LIGHT, goldBg: 'rgba(192,192,192,0.14)',
    paper: NAVY_SURF, paperInk: WHITE, frame: '#768BA7', marker: SILVER,
    ok: '#43A873', okBg: '#43A87322', warn: '#D19A3D', bad: '#D2685C', badBg: '#D2685C22',
    info: SILVER, infoBg: 'rgba(192,192,192,0.14)', scrim: 'rgba(5,16,32,0.75)', tab: NAVY_SURF,
  });
}

export const shadow = (c: string, l = 1): any => Platform.select({
  ios: { shadowColor: c, shadowOpacity: 0.08 + l * 0.03, shadowRadius: 4 + l * 3, shadowOffset: { width: 0, height: 1 + l * 2 } },
  android: { elevation: l + 1 },
  web: { boxShadow: '0 ' + (1 + l * 2) + 'px ' + (6 + l * 4) + 'px rgba(10,28,56,' + (0.06 + l * 0.04) + ')' },
  default: {},
});