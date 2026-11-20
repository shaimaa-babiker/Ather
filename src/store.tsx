import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette, QSIZES, type Accent, type Mode } from './theme';

export interface Settings { mode: Mode; accent: Accent; fontIdx: number; tashkeel: boolean; reminders: boolean; hijriOff: number; city: string; method: string; asr: string; f24: boolean; autoNext: boolean; rate: number; loop: boolean; muted: boolean; readerMode?: 'swipe' | 'vertical'; geo: boolean; geoAsked?: boolean; geoLat?: number; geoLng?: number; geoAt?: number }
export interface Data { name: string; favS: number[]; favN: number[]; favA: string[]; favD: string[]; last: { s: number; page: number } | null; daily: Record<string, string[]>; total: { dhikr: number; wards: number } }
interface Persist { settings: Settings; data: Data }
export type Kind = 'S' | 'N' | 'A' | 'D';
export interface Toast { id: number; msg: string; type: string; action?: { label: string; onPress: () => void } }
const DEF: Persist = {
  settings: { mode: 'light', accent: 'royal', fontIdx: 1, tashkeel: true, reminders: true, hijriOff: 0, city: 'dubai', method: 'auto', asr: 'std', f24: false, autoNext: false, rate: 1, loop: false, muted: false, readerMode: 'swipe', geo: true, geoAsked: false },
  data: { name: 'مستخدم التطبيق', favS: [1, 36, 67], favN: [1, 2], favA: [], favD: ['q1'], last: null, daily: {}, total: { dhikr: 0, wards: 0 } },
};
const KEY = 'noor:v2';
const field = (k: Kind) => ({ S: 'favS', N: 'favN', A: 'favA', D: 'favD' } as const)[k];
const Ctx = createContext<any>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Persist>(DEF);
  const [hyd, setHyd] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const ref = useRef(st); ref.current = st;
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) { try { const p = JSON.parse(raw); setSt({ settings: Object.assign({}, DEF.settings, p.settings || {}), data: Object.assign({}, DEF.data, p.data || {}, { total: Object.assign({}, DEF.data.total, (p.data || {}).total || {}) }) }); } catch {} }
    }).catch(() => {}).finally(() => setHyd(true));
  }, []);
  useEffect(() => { if (!hyd) return; const t = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(st)).catch(() => {}); }, 250); return () => clearTimeout(t); }, [st, hyd]);
  const api = useMemo(() => ({
    settings: st.settings, data: st.data, hydrated: hyd, toast,
    setSettings: (p: Partial<Settings>) => setSt((s) => ({ ...s, settings: { ...s.settings, ...p } })),
    upd: (fn: (d: Data) => Data) => setSt((s) => ({ ...s, data: fn(s.data) })),
    fav: (k: Kind, id: any) => {
      const f = field(k); const arr: any[] = (ref.current.data as any)[f]; const removed = arr.indexOf(id) >= 0;
      setSt((s) => ({ ...s, data: { ...s.data, [f]: removed ? (s.data as any)[f].filter((x: any) => x !== id) : (s.data as any)[f].concat([id]) } }));
      return removed;
    },
    isFav: (k: Kind, id: any) => ((ref.current.data as any)[field(k)] as any[]).indexOf(id) >= 0,
    clearFavs: () => setSt((s) => ({ ...s, data: { ...s.data, favS: [], favN: [], favA: [], favD: [] } })),
    reset: () => setSt(DEF),
    snap: (): Persist => JSON.parse(JSON.stringify(ref.current)),
    restore: (p: Persist) => setSt(p),
    show: (msg: string, type = 'success', action?: any) => setToast({ id: Date.now(), msg, type, action }),
    hide: () => setToast(null),
  }), [st, hyd, toast]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export function useStore() { const c = useContext(Ctx); if (!c) throw new Error('StoreProvider missing'); return c; }
export const useSettings = () => { const { settings, setSettings } = useStore(); return { settings, setSettings }; };
export const useData = () => { const { data, upd, fav, isFav, clearFavs, reset, snap, restore, hydrated } = useStore(); return { data, upd, fav, isFav, clearFavs, reset, snap, restore, hydrated }; };
export const useToast = () => { const { toast, show, hide } = useStore(); return { toast, show, hide }; };
export function useTheme() {
  const { settings } = useSettings();
  return useMemo(() => { const p = palette(settings.mode, settings.accent); const qs = QSIZES[settings.fontIdx] || 21; return { p, dark: settings.mode === 'dark', qs, qlh: Math.round(qs * 2.05) }; }, [settings.mode, settings.accent, settings.fontIdx]);
}