import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
const AR = '٠١٢٣٤٥٦٧٨٩';
export const ar = (n: any) => String(n).replace(/[0-9]/g, (d) => AR[+d]);
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const norm = (d: number) => ((d % 360) + 360) % 360;
export const delta = (from: number, to: number) => ((to - from + 540) % 360) - 180;
export const fixH = (h: number) => ((h % 24) + 24) % 24;
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const dkey = (d: Date) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
export const clock = (s: number) => { if (!isFinite(s) || s < 0) s = 0; return Math.floor(s / 60) + ':' + pad2(Math.floor(s % 60)); };
export const ayahWord = (n: number) => (n <= 10 ? 'آيات' : 'آية');
export const HM = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
export const WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const GM = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export function hijri(date: Date) {
  let d = date.getDate(), m = date.getMonth() + 1, y = date.getFullYear();
  const jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) + Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) - Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) + d - 32075;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631); l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  m = Math.floor((24 * l) / 709); d = l - Math.floor((709 * m) / 24); y = 30 * n + j - 30;
  return { day: d, month: m, year: y };
}
export const fHijri = (d: Date, off = 0) => { const h = hijri(addDays(d, off)); return ar(h.day) + ' ' + HM[h.month - 1] + ' ' + ar(h.year) + ' هـ'; };
export const fGreg = (d: Date) => WD[d.getDay()] + '، ' + ar(d.getDate()) + ' ' + GM[d.getMonth()] + ' ' + ar(d.getFullYear());
export function streak(daily: Record<string, string[]>) {
  let s = 0, d = new Date();
  if (!(daily[dkey(d)] || []).length) d = addDays(d, -1);
  while ((daily[dkey(d)] || []).length) { s++; d = addDays(d, -1); }
  return s;
}
const DIACG = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
export const stripT = (s: string) => s.replace(/\u0671/g, 'ا').replace(DIACG, '');
const R = Math.PI / 180;
const sin = (d: number) => Math.sin(d * R), cos = (d: number) => Math.cos(d * R), tan = (d: number) => Math.tan(d * R);
const asin = (x: number) => Math.asin(x) / R, acos = (x: number) => Math.acos(x) / R, atan2 = (y: number, x: number) => Math.atan2(y, x) / R, acot = (x: number) => Math.atan(1 / x) / R;
export const qibla = (lat: number, lng: number) => norm(atan2(sin(39.8262 - lng), cos(lat) * tan(21.4225) - sin(lat) * cos(39.8262 - lng)));
function julian(y: number, m: number, d: number) { if (m <= 2) { y -= 1; m += 12; } const a = Math.floor(y / 100), b = 2 - a + Math.floor(a / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5; }
function sun(jd: number) {
  const D = jd - 2451545, g = norm(357.529 + 0.98560028 * D), q = norm(280.459 + 0.98564736 * D);
  const L = norm(q + 1.915 * sin(g) + 0.02 * sin(2 * g)), e = 23.439 - 0.00000036 * D;
  return { dec: asin(sin(e) * sin(L)), eqt: q / 15 - fixH(atan2(cos(e) * sin(L), cos(L)) / 15) };
}
export interface Method { label: string; fajr: number; isha?: number; ishaMin?: number }
export const METHODS: Record<string, Method> = {
  umm: { label: 'أم القرى', fajr: 18.5, ishaMin: 90 }, mwl: { label: 'رابطة العالم الإسلامي', fajr: 18, isha: 17 },
  egypt: { label: 'الهيئة المصرية', fajr: 19.5, isha: 17.5 }, karachi: { label: 'جامعة كراتشي', fajr: 18, isha: 18 },
  isna: { label: 'ISNA', fajr: 15, isha: 15 }, turkey: { label: 'ديانت تركيا', fajr: 18, isha: 17 },
};
export type PK = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export function prayers(date: Date, lat: number, lng: number, tz: number, m: Method, asrF: number, ramadan: boolean): Record<PK, number | null> {
  const jd = julian(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / 360;
  const noon = (t: number) => fixH(12 - sun(jd + t).eqt);
  const at = (ang: number, t: number, ccw: boolean) => {
    const dec = sun(jd + t).dec, c = (-sin(ang) - sin(dec) * sin(lat)) / (cos(dec) * cos(lat));
    if (c < -1 || c > 1) return NaN;
    return noon(t) + (ccw ? -1 : 1) * (acos(c) / 15);
  };
  const asrT = (f: number, t: number) => {
    const dec = sun(jd + t).dec, alt = acot(f + tan(Math.abs(lat - dec)));
    const c = (sin(alt) - sin(dec) * sin(lat)) / (cos(dec) * cos(lat));
    return c < -1 || c > 1 ? NaN : noon(t) + acos(c) / 15;
  };
  let fajr = 5, sr = 6, dh = 12, asr = 13, ss = 18, is = 18;
  for (let i = 0; i < 3; i++) {
    fajr = at(m.fajr, fajr / 24, true); sr = at(0.833, sr / 24, true); dh = noon(dh / 24);
    asr = asrT(asrF, asr / 24); ss = at(0.833, ss / 24, false);
    is = m.ishaMin != null ? ss + m.ishaMin / 60 : at(m.isha!, is / 24, false);
  }
  if (isNaN(fajr) || isNaN(is)) { const night = 24 - (ss - sr); if (isNaN(fajr)) fajr = sr - night * (m.fajr / 60); if (isNaN(is)) is = ss + night * ((m.isha || 18) / 60); }
  const adj = tz - lng / 15;
  const o: any = { fajr, sunrise: sr, dhuhr: dh, asr, maghrib: ss, isha: is };
  (Object.keys(o) as PK[]).forEach((k) => { o[k] = isNaN(o[k]) ? null : o[k] + adj; });
  if (ramadan && m.ishaMin != null && o.maghrib != null) o.isha = o.maghrib + 2;
  return o;
}
export function fClock(h: number | null, f24: boolean) {
  if (h == null || isNaN(h)) return '—';
  const x = fixH(h); let H = Math.floor(x), M = Math.round((x - H) * 60);
  if (M === 60) { H = (H + 1) % 24; M = 0; }
  return f24 ? pad2(H) + ':' + pad2(M) : pad2(H % 12 || 12) + ':' + pad2(M) + ' ' + (H < 12 ? 'ص' : 'م');
}
export function tzOffset(tz: string, date: Date): number | null {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const p: any = {}; f.formatToParts(date).forEach((x: any) => { p[x.type] = x.value; });
    return (Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second) - Math.floor(date.getTime() / 1000) * 1000) / 3600000;
  } catch { return null; }
}
export async function copyText(t: string) { try { await Clipboard.setStringAsync(t); return true; } catch { return false; } }
export async function shareText(t: string): Promise<string> {
  try {
    if (Platform.OS === 'web') { const n: any = typeof navigator !== 'undefined' ? navigator : null; if (n && n.share) { await n.share({ text: t }); return 'shared'; } return (await copyText(t)) ? 'copied' : 'fail'; }
    const r = await Share.share({ message: t });
    if (r.action === Share.sharedAction) return 'shared';
    return (await copyText(t)) ? 'copied' : 'fail';
  } catch { return (await copyText(t)) ? 'copied' : 'fail'; }
}
let uid = 0; export const gid = () => 'g' + ++uid;