import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings, useTheme, useToast } from './store';
import { FONTS, shadow } from './theme';
import { ar, clock } from './util';
import { surah } from './data';
import { StarMedallion } from './art';
import { Reveal, Slider } from './ui';

export const RECITER = 'مشاري راشد العفاسي';
const url = (n: number) => 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/' + n + '.mp3';
const INIT = { uri: url(1) };
const Ctx = createContext<any>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { settings, setSettings } = useSettings();
  const { show } = useToast();
  const player = useAudioPlayer(INIT, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [n, setN] = useState<number | null>(null);
  const nRef = useRef(n); nRef.current = n;
  const sRef = useRef(settings); sRef.current = settings;
  const atRef = useRef(0); const warnRef = useRef(false); const finRef = useRef(0);
  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {}); }, []);
  useEffect(() => { try { player.loop = settings.loop; } catch {} }, [settings.loop, player]);
  useEffect(() => { try { player.muted = settings.muted; } catch {} }, [settings.muted, player]);
  useEffect(() => { try { player.playbackRate = settings.rate; } catch {} }, [settings.rate, player]);
  const load = (x: number, auto = true) => {
    const nn = ((x - 1 + 114) % 114) + 1;
    warnRef.current = false; atRef.current = Date.now(); setN(nn);
    try { player.replace({ uri: url(nn) }); if (auto) player.play(); } catch {}
  };
  useEffect(() => {
    if (status && status.didJustFinish && nRef.current && !sRef.current.loop && sRef.current.autoNext) {
      const now = Date.now(); if (now - finRef.current > 1500) { finRef.current = now; load(nRef.current + 1); }
    }
  }, [status && status.didJustFinish]);
  useEffect(() => {
    const iv = setInterval(() => {
      if (nRef.current && !warnRef.current && atRef.current && Date.now() - atRef.current > 9000 && !(status && status.isLoaded)) {
        warnRef.current = true; show('تعذّر تحميل التلاوة — تحقق من الاتصال بالإنترنت', 'error');
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [status && status.isLoaded]);
  const api = useMemo(() => ({
    n, status, loading: !!n && !(status && status.isLoaded),
    load,
    toggle: () => { try { status && status.playing ? player.pause() : player.play(); } catch {} },
    stop: () => { try { player.pause(); } catch {} setN(null); },
    seek: (s: number) => { try { player.seekTo(Math.max(0, s)); } catch {} },
    next: () => { const x = (((nRef.current || 1)) % 114) + 1; load(x); return x; },
    prev: () => { const x = (((nRef.current || 1) - 2 + 114) % 114) + 1; load(x); return x; },
    rate: settings.rate, cycleRate: () => { const seq = [1, 1.25, 1.5, 0.75]; setSettings({ rate: seq[(seq.indexOf(settings.rate) + 1) % seq.length] }); },
    loop: settings.loop, setLoop: (v: boolean) => setSettings({ loop: v }),
    muted: settings.muted, setMuted: (v: boolean) => setSettings({ muted: v }),
  }), [n, status, settings.rate, settings.loop, settings.muted]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export const usePlayer = () => { const c = useContext(Ctx); if (!c) throw new Error('PlayerProvider missing'); return c; };

export function FullPlayer({ onNav }: { onNav?: (n: number) => void }) {
  const { p } = useTheme(); const pl = usePlayer();
  const [prev, setPrev] = useState<number | null>(null);
  if (!pl.n) return null;
  const m = surah(pl.n); const dur = (pl.status && pl.status.duration) || 0;
  const cur = prev != null ? prev : (pl.status && pl.status.currentTime) || 0;
  const C = ({ icon, size, onPress, gold }: any) => (
    <Pressable onPress={onPress} hitSlop={8} style={{ padding: 4 }}>
      <Ionicons name={icon} size={size || 20} color={gold ? p.goldS : p.onDarkS} />
    </Pressable>
  );
  return (
    <View style={{ borderRadius: 18, padding: 14, backgroundColor: p.n0, borderWidth: 1, borderColor: p.dLine }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
        <StarMedallion n={pl.n} size={36} color={p.gold} textColor={p.goldS} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONTS.uiBold, fontSize: 15, color: p.onDark, textAlign: 'right' }}>سورة {m ? m.ar : ''}</Text>
          <Text style={{ fontFamily: FONTS.ui, fontSize: 11, color: p.onDarkF, textAlign: 'right' }}>{RECITER}</Text>
        </View>
        <C icon={pl.muted ? 'volume-mute' : 'volume-high'} size={18} gold={pl.muted} onPress={() => pl.setMuted(!pl.muted)} />
        <C icon="repeat" size={18} gold={pl.loop} onPress={() => pl.setLoop(!pl.loop)} />
        <Pressable onPress={pl.cycleRate} hitSlop={6} style={{ borderWidth: 1, borderColor: p.dLine, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
          <Text style={{ fontFamily: FONTS.uiBold, fontSize: 11, color: p.goldS }}>{pl.rate}×</Text>
        </Pressable>
      </View>
      <View style={{ marginTop: 8 }}>
        <Slider dark value={cur} max={dur} disabled={dur <= 0} onChange={(v: number) => setPrev(v)} onCommit={(v: number) => { pl.seek(v); setPrev(null); }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11, color: p.onDarkF }}>{clock(cur)}</Text>
          <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11, color: p.onDarkF }}>{dur > 0 ? clock(dur) : '--:--'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 26, marginTop: 6 }}>
        <C icon="play-skip-back" onPress={() => { const x = pl.prev(); if (onNav) onNav(x); }} />
        <Pressable onPress={pl.toggle} style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: p.gold, alignItems: 'center', justifyContent: 'center' }}>
          {pl.loading && !(pl.status && pl.status.playing)
            ? <ActivityIndicator size="small" color={p.n0} />
            : <Ionicons name={pl.status && pl.status.playing ? 'pause' : 'play'} size={26} color={p.n0} style={pl.status && pl.status.playing ? {} : { marginLeft: 3 }} />}
        </Pressable>
        <C icon="play-skip-forward" onPress={() => { const x = pl.next(); if (onNav) onNav(x); }} />
      </View>
    </View>
  );
}

export function MiniPlayer() {
  const { p } = useTheme(); const pl = usePlayer();
  const router = useRouter(); const path = usePathname(); const seg = useSegments(); const ins = useSafeAreaInsets();
  if (!pl.n || path.indexOf('/surah') === 0) return null;
  const m = surah(pl.n); const dur = (pl.status && pl.status.duration) || 0;
  const prog = dur > 0 ? ((pl.status && pl.status.currentTime) || 0) / dur : 0;
  const bottom = seg[0] === '(tabs)' ? 64 + ins.bottom + 10 : ins.bottom + 12;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 12, right: 12, bottom, alignItems: 'center', zIndex: 40 }}>
      <Reveal style={{ width: '100%', maxWidth: 440 }}>
        <Pressable onPress={() => router.push('/surah/' + pl.n)} style={{ backgroundColor: p.n0, borderRadius: 14, borderWidth: 1, borderColor: p.dLine, overflow: 'hidden', ...shadow('#000', 3) }}>
          <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <View style={{ width: (prog * 100) + '%', height: '100%', backgroundColor: p.gold }} />
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 56 }}>
            <StarMedallion n={pl.n} size={32} color={p.gold} textColor={p.goldS} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: FONTS.uiBold, fontSize: 13, color: p.onDark, textAlign: 'right' }}>سورة {m ? m.ar : ''}</Text>
              <Text numberOfLines={1} style={{ fontFamily: FONTS.ui, fontSize: 10, color: p.onDarkF, textAlign: 'right' }}>{RECITER}{pl.loading ? ' · جارٍ التحميل…' : ''}</Text>
            </View>
            <Pressable onPress={pl.toggle} hitSlop={6} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.gold, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={pl.status && pl.status.playing ? 'pause' : 'play'} size={17} color={p.n0} />
            </Pressable>
            <Pressable onPress={pl.stop} hitSlop={8} style={{ padding: 4 }}><Ionicons name="close" size={17} color={p.onDarkF} /></Pressable>
          </View>
        </Pressable>
      </Reveal>
    </View>
  );
}