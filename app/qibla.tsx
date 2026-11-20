import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path, Rect, Text as ST } from 'react-native-svg';
import { Magnetometer } from 'expo-sensors';
import { useFocusEffect } from 'expo-router';
import { FONTS } from '../src/theme';
import { useSettings, useTheme, useToast } from '../src/store';
import { ar, addDays, clamp, delta, fClock, fGreg, fHijri, hijri, METHODS, norm, pad2, prayers, qibla, type PK } from '../src/util';
import { CITIES, getCity } from '../src/data';
import { useLocation, usePrayerLocation } from '../src/location';
import { Kaaba, PatternBG } from '../src/art';
import { Badge, Card, Header, Reveal, Row, Screen, Section, Segmented, SelectRow, Slider, ToggleRow } from '../src/ui';

const D = 280;
const Dial = memo(function Dial({ q, gold, goldS, faint, soft, n0 }: any) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const cards = [{ a: 0, t: 'ش' }, { a: 90, t: 'ق' }, { a: 180, t: 'ج' }, { a: 270, t: 'غ' }];
  return (
    <Svg width={D} height={D} viewBox="-140 -140 280 280">
      <Circle cx={0} cy={0} r={132} stroke={gold} strokeWidth={3} fill="none" />
      <Circle cx={0} cy={0} r={118} stroke={faint} strokeWidth={1} fill="none" opacity={0.5} />
      {ticks.map((a) => { const maj = a % 30 === 0; return <G key={a} transform={'rotate(' + a + ')'}><Rect x={maj ? -1 : -0.5} y={-127} width={maj ? 2 : 1} height={maj ? 13 : 6} fill={maj ? goldS : faint} opacity={maj ? 0.95 : 0.6} /></G>; })}
      {ticks.filter((a) => a % 30 === 0).map((a) => { const r = 103, x = r * Math.sin(a * Math.PI / 180), y = -r * Math.cos(a * Math.PI / 180); return <ST key={a} x={x} y={y + 3.5} textAnchor="middle" fontSize={10} fontFamily={FONTS.uiMed} fill={soft}>{ar(a)}</ST>; })}
      {cards.map((c) => { const r = 84, x = r * Math.sin(c.a * Math.PI / 180), y = -r * Math.cos(c.a * Math.PI / 180); return <ST key={c.a} x={x} y={y + 6} textAnchor="middle" fontSize={17} fontFamily={FONTS.uiBlack} fill={goldS}>{c.t}</ST>; })}
      <G transform={'rotate(' + q + ')'}><G transform="translate(0,-132)">
        <Circle cx={0} cy={0} r={14} fill={gold} stroke={n0} strokeWidth={2} />
        <Rect x={-6} y={-6} width={12} height={12} rx={1} fill="#10131C" />
        <Rect x={-6} y={-2.4} width={12} height={2.4} fill={goldS} />
      </G></G>
    </Svg>
  );
});

export default function Qibla() {
  const { p } = useTheme(); const { settings, setSettings } = useSettings(); const { show } = useToast();
  const city = getCity(settings.city);
  const geo = useLocation();
  const [mode, setMode] = useState('auto'); const [head, setHead] = useState(0);
  const [dd, setDd] = useState(0); const [tick, setTick] = useState(Date.now());

  const now = new Date(tick); const vd = addDays(now, dd);
  const loc = usePrayerLocation(vd);
  const q = useMemo(() => qibla(loc.lat, loc.lng), [loc.lat, loc.lng]);
  const mk = loc.methodKey;
  const method = loc.method;

  useFocusEffect(React.useCallback(() => {
    if (mode !== 'auto') return;
    let got = false; let sub: any = null;
    const h = (e: any) => { const w = e && e.webkitCompassHeading; const v = w != null ? w : (e && e.absolute && e.alpha != null ? 360 - e.alpha : null); if (v != null && !isNaN(v)) { got = true; setHead(norm(v)); } };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') { window.addEventListener('deviceorientationabsolute', h, true); window.addEventListener('deviceorientation', h, true); }
    } else {
      try { Magnetometer.setUpdateInterval(120); sub = Magnetometer.addListener((d: any) => { got = true; setHead(norm(Math.atan2(d.y, d.x) * 180 / Math.PI)); }); } catch {}
    }
    const to = setTimeout(() => { if (!got) { setMode('manual'); show('البوصلة غير متاحة هنا — فعّلنا الوضع اليدوي', 'info'); } }, 2600);
    return () => { clearTimeout(to); if (sub && sub.remove) sub.remove(); if (Platform.OS === 'web' && typeof window !== 'undefined') { window.removeEventListener('deviceorientationabsolute', h, true); window.removeEventListener('deviceorientation', h, true); } };
  }, [mode]));

  const anim = useRef(new Animated.Value(0)).current;
  const raw = useRef(0); const unw = useRef(0);
  useEffect(() => {
    unw.current += delta(raw.current, head); raw.current = head;
    Animated.timing(anim, { toValue: unw.current, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [head]);
  const spin = anim.interpolate({ inputRange: [-1e6, 1e6], outputRange: ['1000000deg', '-1000000deg'] });
  const hr = useRef(head); hr.current = head; const drag = useRef({ a: 0, h: 0 });
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      drag.current = { a: Math.atan2(e.nativeEvent.locationY - D / 2, e.nativeEvent.locationX - D / 2) * 180 / Math.PI, h: hr.current };
      if (mode === 'auto') { setMode('manual'); show('وضع المعايرة اليدوية — أدر القرص نحو علامة الكعبة', 'info'); }
    },
    onPanResponderMove: (e) => { const a = Math.atan2(e.nativeEvent.locationY - D / 2, e.nativeEvent.locationX - D / 2) * 180 / Math.PI; setHead(norm(drag.current.h + (a - drag.current.a))); },
  })).current;

  const dl = delta(head, q); const aligned = Math.abs(dl) <= 5;
  useFocusEffect(React.useCallback(() => { const iv = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(iv); }, []));

  const tz = loc.tz;
  const ram = hijri(vd).month === 9;
  const ds = vd.getFullYear() + '-' + vd.getMonth() + '-' + vd.getDate();
  const times = useMemo(() => prayers(vd, loc.lat, loc.lng, tz, method, settings.asr === 'hanafi' ? 2 : 1, ram), [ds, loc.lat, loc.lng, mk, settings.asr, tz, ram]);
  const rows: { k: PK; l: string; i: string }[] = [
    { k: 'fajr', l: 'الفجر', i: 'cloudy-night-outline' }, { k: 'sunrise', l: 'الشروق', i: 'partly-sunny-outline' },
    { k: 'dhuhr', l: 'الظهر', i: 'sunny-outline' }, { k: 'asr', l: 'العصر', i: 'partly-sunny' },
    { k: 'maghrib', l: 'المغرب', i: 'moon-outline' }, { k: 'isha', l: 'العشاء', i: 'cloudy-night' }];
  const cityNow = ((tick / 3600000 + tz) % 24 + 24) % 24;
  const next = dd === 0 ? rows.find((r) => times[r.k] != null && (times[r.k] as number) > cityNow) : undefined;
  const passed = rows.filter((r) => times[r.k] != null && (times[r.k] as number) <= cityNow);
  const prevT = passed.length ? (times[passed[passed.length - 1].k] as number) : (times.isha != null ? (times.isha as number) - 24 : 0);
  const nextT = next ? (times[next.k] as number) : null;
  const rem = nextT != null ? Math.max(0, nextT - cityNow) : null;
  const remS = rem != null ? pad2(Math.floor(rem)) + ':' + pad2(Math.floor((rem % 1) * 60)) + ':' + pad2(Math.floor(((rem * 60) % 1) * 60)) : null;
  const prog = nextT != null && nextT > prevT ? clamp((cityNow - prevT) / (nextT - prevT), 0, 1) : 0;

  const geoSub = !settings.geo
    ? 'غير مفعّل — تُستخدم المدينة المختارة'
    : loc.isGeo
      ? (loc.accuracy != null ? 'مفعّل · دقة ±' + ar(Math.round(loc.accuracy)) + ' م' : 'مفعّل · تم تحديد موقعك')
      : geo.status === 'denied'
        ? 'الإذن مرفوض — اختر مدينة يدوياً'
        : geo.status === 'unavailable'
          ? 'تعذّر تحديد الموقع — اختر مدينة'
          : 'جارٍ تحديد موقعك…';

  const enableGeo = async (v: boolean) => {
    setSettings({ geo: v, geoAsked: true });
    if (!v) return;
    const c = await geo.refresh();
    if (c) show('تم تحديد موقعك ✓');
  };

  const refreshGeo = async () => {
    const c = await geo.refresh();
    if (c) show('تم تحديث الموقع ✓');
  };

  return (
    <Screen pad={60}>
      <Header title="القبلة ومواقيت الصلاة" />
      <Reveal>
        <LinearGradient colors={[p.n0, p.n2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, overflow: 'hidden', padding: 16, borderWidth: 1, borderColor: p.dLine }}>
          <PatternBG color="#C0C0C0" opacity={0.04} />
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
            <Ionicons name="location-outline" size={17} color={p.goldS} />
            <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 15, color: p.onDark }}>{loc.label}</Text>
            <View style={{ flex: 1 }} />
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: p.dLine, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ fontFamily: FONTS.uiBold, fontSize: 10, color: p.goldS }}>{mode === 'auto' ? 'بوصلة الجهاز' : 'وضع يدوي'}</Text></View>
          </View>
          <Text style={{ fontFamily: FONTS.ui, fontSize: 11.5, color: p.onDarkF, textAlign: 'right', marginTop: 2 }}>{fHijri(now, settings.hijriOff)} · {fGreg(now)}</Text>
          {loc.isGeo ? <Text style={{ fontFamily: FONTS.ui, fontSize: 10.5, color: p.goldS, textAlign: 'right', marginTop: 2 }}>{loc.sub}{loc.accuracy != null ? ' · ±' + ar(Math.round(loc.accuracy)) + ' م' : ''}</Text> : null}
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <View {...pan.panHandlers} style={{ width: D, height: D, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={20} height={14} viewBox="0 0 20 14" style={{ position: 'absolute', top: -4, zIndex: 3 }}><Path d="M10 14 L2 0 L18 0 Z" fill={p.gold} /></Svg>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Dial q={q} gold={p.gold} goldS={p.goldS} faint={p.onDarkF} soft={p.onDarkS} n0={p.n0} />
              </Animated.View>
              <View style={{ position: 'absolute', width: 112, height: 112, borderRadius: 56, backgroundColor: p.n1, borderWidth: 1, borderColor: p.dLine, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Kaaba size={20} />
                <Text style={{ fontFamily: FONTS.display, fontSize: 27, color: p.goldS }}>{ar(Math.round(q))}°</Text>
                <Text style={{ fontFamily: FONTS.ui, fontSize: 9.5, color: p.onDarkF }}>اتجاه القبلة</Text>
              </View>
            </View>
            <View style={{ marginTop: 14, backgroundColor: aligned ? 'rgba(67,168,115,0.2)' : 'rgba(93,155,216,0.16)', borderWidth: 1, borderColor: aligned ? '#43A87388' : '#5D9BD866', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
              <Ionicons name={aligned ? 'checkmark-circle' : 'compass-outline'} size={17} color={aligned ? '#7FD4A8' : '#9CC4E8'} />
              <Text style={{ fontFamily: FONTS.uiBold, fontSize: 13, color: aligned ? '#BFE8D2' : '#CFE2F4' }}>
                {aligned ? 'أنت الآن باتجاه القبلة ✓' : 'أدر ' + ar(Math.abs(Math.round(dl))) + '° ' + (dl > 0 ? 'يميناً' : 'يساراً') + ' نحو علامة الكعبة'}</Text>
            </View>
            <Text style={{ fontFamily: FONTS.ui, fontSize: 10, color: p.onDarkF, marginTop: 8 }}>أمسك الهاتف أفقياً · اسحب القرص للمعايرة</Text>
          </View>
        </LinearGradient>
      </Reveal>

      <Section title="مواقيت الصلاة" action={dd !== 0 ? 'اليوم' : undefined} onAction={() => setDd(0)} />
      <Reveal delay={100}>
        <Card style={{ paddingVertical: 6 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: p.line }}>
            <Pressable onPress={() => setDd((x) => x - 1)} hitSlop={8} style={{ padding: 4 }}><Ionicons name="chevron-forward" size={18} color={p.goldD} /></Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS.uiBold, fontSize: 13, color: p.ink }}>{dd === 0 ? 'اليوم' : fGreg(vd)}</Text>
              <Text style={{ fontFamily: FONTS.ui, fontSize: 10, color: p.inkF }}>{fHijri(vd, settings.hijriOff)}</Text>
            </View>
            <Pressable onPress={() => setDd((x) => x + 1)} hitSlop={8} style={{ padding: 4 }}><Ionicons name="chevron-back" size={18} color={p.goldD} /></Pressable>
          </View>
          {rows.map((r, i) => {
            const isNext = dd === 0 && next && next.k === r.k;
            return (
              <View key={r.k} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: p.line, backgroundColor: isNext ? p.goldBg : 'transparent', borderRadius: 10 }}>
                <Badge size={34} icon={r.i} bg={isNext ? p.gold + '33' : p.bgSoft} color={isNext ? p.goldD : p.inkS} />
                <Text style={{ flex: 1, fontFamily: FONTS.uiBold, fontSize: 14.5, color: p.ink, textAlign: 'right' }}>{r.l}</Text>
                {isNext && remS ? <Text style={{ fontFamily: FONTS.uiBold, fontSize: 10, color: p.goldD }}>القادم · بعد {ar(remS)}</Text> : null}
                <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 15, color: isNext ? p.goldD : p.ink }}>{fClock(times[r.k], settings.f24)}</Text>
              </View>);
          })}
          {dd === 0 ? <View style={{ paddingVertical: 10 }}>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: p.bgSoft, overflow: 'hidden' }}>
              <View style={{ width: (prog * 100) + '%', height: '100%', backgroundColor: p.gold }} /></View>
          </View> : null}
          <Text style={{ fontFamily: FONTS.ui, fontSize: 10, color: p.inkF, textAlign: 'center', paddingBottom: 8 }}>
            الحساب: {method.label} · العصر: {settings.asr === 'hanafi' ? 'الحنفي' : 'الجمهور'} · بتوقيت {loc.isGeo ? 'موقعك الحالي' : city.ar}</Text>
        </Card>
      </Reveal>

      <Section title="إعدادات القبلة والحساب" />
      <Reveal delay={150}>
        <Card>
          <ToggleRow icon="navigate-outline" title="استخدام موقعي الحالي"
            sub={geoSub}
            value={settings.geo} onChange={enableGeo} />
          {settings.geo ? (
            <Row icon="refresh-outline" title="تحديث الموقع" sub="إعادة قراءة إحداثيات جهازك" onPress={refreshGeo} />
          ) : null}
          <SelectRow icon="location-outline" label="المدينة (احتياطي)" valueLabel={loc.isGeo ? 'يُستخدم موقعك الحالي — اختر مدينة للتغيير' : city.ar + ' · ' + city.country} value={settings.city}
            options={CITIES.map((c) => ({ key: c.id, label: c.ar, sub: c.country }))} onSelect={(k: string) => setSettings({ city: k, geo: false })} />
          <SelectRow icon="calculator-outline" label="طريقة الحساب" valueLabel={settings.method === 'auto' ? 'تلقائي (' + (METHODS[mk] || METHODS.umm).label + ')' : method.label}
            value={settings.method} options={[{ key: 'auto', label: 'تلقائي حسب الموقع' }].concat(Object.keys(METHODS).map((k) => ({ key: k, label: METHODS[k].label })))}
            onSelect={(k: string) => setSettings({ method: k })} />
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: p.line, gap: 12 }}>
            <Text style={{ fontFamily: FONTS.uiBold, fontSize: 14, color: p.ink }}>مذهب العصر</Text>
            <View style={{ width: 190 }}><Segmented small options={[{ key: 'std', label: 'الجمهور' }, { key: 'hanafi', label: 'الحنفي' }]} value={settings.asr} onChange={(k: string) => setSettings({ asr: k })} /></View>
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: p.line, gap: 12 }}>
            <Text style={{ fontFamily: FONTS.uiBold, fontSize: 14, color: p.ink }}>صيغة الوقت</Text>
            <View style={{ width: 190 }}><Segmented small options={[{ key: '12', label: '١٢ ساعة' }, { key: '24', label: '٢٤ ساعة' }]} value={settings.f24 ? '24' : '12'} onChange={(k: string) => setSettings({ f24: k === '24' })} /></View>
          </View>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: 12 }}>
            <Text style={{ fontFamily: FONTS.uiBold, fontSize: 14, color: p.ink }}>وضع البوصلة</Text>
            <View style={{ width: 190 }}><Segmented small options={[{ key: 'auto', label: 'تلقائي' }, { key: 'manual', label: 'يدوي' }]} value={mode} onChange={setMode} /></View>
          </View>
          {mode === 'manual' ? <View style={{ paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 12, color: p.inkS }}>اتجاه الجهاز الحالي</Text>
              <Text style={{ fontFamily: FONTS.uiBold, fontSize: 12, color: p.goldD }}>{ar(Math.round(head))}°</Text>
            </View>
            <Slider value={head} max={359} onChange={setHead} />
          </View> : null}
        </Card>
      </Reveal>
      <Text style={{ fontFamily: FONTS.ui, fontSize: 10.5, color: p.inkF, textAlign: 'center', marginTop: 14, lineHeight: 18 }}>
        المواقيت محسوبة فلكياً من موقعك وبتوقيت جهازك، وقد تختلف دقائق عن التقويم المحلي.
      </Text>
    </Screen>
  );
}