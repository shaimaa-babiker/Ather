import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Image, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, Tajawal_800ExtraBold } from '@expo-google-fonts/tajawal';
import { StoreProvider, useData, useTheme } from '../src/store';
import { LocationProvider } from '../src/location';
import { PlayerProvider, MiniPlayer } from '../src/player';
import { FONTS } from '../src/theme';
import { Crescent, MosqueScene, Ornament, PatternBG, StarMedallion } from '../src/art';
import { Reveal, ToastHost } from '../src/ui';
import { MOSQUE_IMAGES } from '../assets/images';

SplashScreen.preventAutoHideAsync().catch(() => { });

function WebChrome() {
  const { p, dark } = useTheme();
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl';
    document.title = 'أثر — أثرٌ باقٍ ونورٌ للقلوب';
    if (!document.getElementById('noor-css')) {
      const s = document.createElement('style'); s.id = 'noor-css';
      s.textContent = 'html,body,#root{height:100%;}'
        + 'body{margin:0;background:var(--app-bg,#051020);overscroll-behavior-y:none;-webkit-font-smoothing:antialiased;}'
        + '*{scrollbar-width:thin;scrollbar-color:var(--sb,#0A1C38) var(--sbt,#F1F4F9);}'
        + '*::-webkit-scrollbar{width:8px;height:8px}'
        + '*::-webkit-scrollbar-track{background:var(--sbt,#F1F4F9)}'
        + '*::-webkit-scrollbar-thumb{background:#0A1C38;border-radius:8px;border:2px solid var(--sbt,#F1F4F9)}'
        + '*::-webkit-scrollbar-thumb:hover{background:#153466}'
        + '::selection{background:#0A1C38;color:#FFFFFF}'
        + ':focus-visible{outline:2px solid #0A1C38;outline-offset:2px}';
      document.head.appendChild(s);
    }
    if (!document.getElementById('noor-ico')) {
      const l = document.createElement('link'); l.id = 'noor-ico'; l.rel = 'icon'; l.type = 'image/svg+xml';
      l.href = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0A1C38"/><path d="M40 12a20 20 0 1 0 0 40 16 16 0 1 1 0-40z" fill="#FFFFFF"/></svg>');
      document.head.appendChild(l);
    }
    const r = document.documentElement.style;
    r.setProperty('--app-bg', p.bg); r.setProperty('--sbt', dark ? p.bgSoft : '#F1F4F9'); r.setProperty('--sb', dark ? '#FFFFFF' : '#0A1C38');
  }, [p, dark]);
  return null;
}

function Frame({ children }: { children: ReactNode }) {
  const { p } = useTheme(); const { width } = useWindowDimensions();
  if (Platform.OS !== 'web' || width < 920) return <View style={{ flex: 1, backgroundColor: p.bg }}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: '#051020', flexDirection: 'row-reverse', justifyContent: 'center' }}>
      <PatternBG color="#C0C0C0" opacity={0.03} />
      {width >= 1150 ? (
        <View style={{ width: 300, justifyContent: 'center', paddingHorizontal: 24, gap: 12 }}>
          <Crescent size={54} color="#FFFFFF" glow />
          <Text style={{ fontFamily: FONTS.display, fontSize: 44, color: '#FFFFFF', textAlign: 'right' }}>أَثَـر</Text>
          <Text style={{ fontFamily: FONTS.uiMed, fontSize: 13, color: '#E0B86C', letterSpacing: 4, textAlign: 'right' }}>A T H A R</Text>
          <Text style={{ fontFamily: FONTS.uiMed, fontSize: 14, color: '#C0C0C0', textAlign: 'right' }}>أثرٌ باقٍ ونورٌ للقلوب</Text>
          <Ornament width={220} color="#C0C0C0" />
          <Text style={{ fontFamily: FONTS.ui, fontSize: 13, color: '#A0B0C4', textAlign: 'right', lineHeight: 24 }}>
            ١١٤ سورة بصوت العفاسي{'\n'}٩٩ اسماً من أسماء الله الحسنى{'\n'}أذكار بعدّاد تفاعلي{'\n'}القبلة ومواقيت الصلاة
          </Text>
        </View>) : null}
      <View style={[{ width: 430, backgroundColor: p.bg, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(192,192,192,0.22)', overflow: 'hidden' }, Platform.select({ web: { boxShadow: '0 0 80px rgba(0,0,0,0.5)' }, default: {} })]}>{children}</View>
      {width >= 1150 ? <View style={{ width: 300 }} /> : null}
    </View>
  );
}

function Splash({ onDone }: any) {
  const o = useRef(new Animated.Value(1)).current;
  const [hint, setHint] = useState(false);
  const started = useRef(Date.now()); const exiting = useRef(false);
  const exit = () => {
    if (exiting.current) return; exiting.current = true;
    onDone();
  };
  useEffect(() => { const a = setTimeout(() => setHint(true), 1100); const b = setTimeout(exit, 3000); return () => { clearTimeout(a); clearTimeout(b); }; }, []);
  return (
    <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, opacity: o, backgroundColor: '#091525' }}>
      <Pressable style={{ flex: 1 }} onPress={() => { if (Date.now() - started.current > 500) exit(); }}>
        {/* Full-bleed background grand mosque photography from Stitch */}
        <Image source={MOSQUE_IMAGES.splash} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} resizeMode="cover" />
        {/* Navy-blue cinematic scrim — same blue as home hero card (#0B1E38) */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 27, 56, 0.55)' }} />

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 90, paddingBottom: 50 }}>
          <View style={{ flex: 1, minHeight: 20 }} />

          {/* Brand Identity: أَثَـر / ATHAR / أثرٌ باقٍ ونورٌ للقلوب */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Reveal delay={100}>
              <Text style={{ fontFamily: FONTS.display, fontSize: 68, color: '#FFFFFF', textAlign: 'center', lineHeight: 80, textShadowColor: 'rgba(0,0,0,0.95)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 28 }}>
                أَثَـر
              </Text>
            </Reveal>
            <Reveal delay={250}>
              <Text style={{ fontFamily: FONTS.uiBold, fontSize: 13, color: '#E0B86C', letterSpacing: 5.5, textAlign: 'center', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }}>
                A T H A R
              </Text>
            </Reveal>
            <Reveal delay={380}>
              <Text style={{ fontFamily: FONTS.displayReg, fontSize: 15, color: 'rgba(255,255,255,0.88)', textAlign: 'center', marginTop: 10, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}>
                أثرٌ باقٍ ونورٌ للقلوب
              </Text>
            </Reveal>
          </View>

          {/* Feature Frosted Pill Badge */}
          <Reveal delay={500}>
            <View style={{ backgroundColor: 'rgba(11, 27, 56, 0.55)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 24 } as any}>
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: 'rgba(255,255,255,0.92)', textAlign: 'center' }}>
                القرآن الكريم  <Text style={{ color: '#E0B86C', fontSize: 10 }}>✦</Text>  الأذكار  <Text style={{ color: '#E0B86C', fontSize: 10 }}>✦</Text>  أسماء الله الحسنى  <Text style={{ color: '#E0B86C', fontSize: 10 }}>✦</Text>  الأدعية
              </Text>
            </View>
          </Reveal>

          {/* Quranic Verse Box with Islamic 8-Point Star */}
          <Reveal delay={650} style={{ width: '100%', maxWidth: 330, marginBottom: 24 }}>
            <View style={{ backgroundColor: 'rgba(11, 27, 56, 0.50)', borderWidth: 1, borderColor: 'rgba(224, 184, 108, 0.28)', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 32 } as any}>
              <StarMedallion size={24} color="#E0B86C" />
              <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: '#E0B86C', textAlign: 'center', marginTop: 8, textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}>
                « وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ »
              </Text>

            </View>
          </Reveal>

          <View style={{ flex: 1, minHeight: 10 }} />
        </View>

      </Pressable>
    </Animated.View>
  );
}

function Inner() {
  const { hydrated } = useData();
  const [fonts] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    // خط مجمع الملك فهد لطباعة المصحف الشريف — الرسم العثماني (حفص)، نسخة 2.0
    UthmanicHafs: require('../assets/fonts/uthmanic_hafs_v20.ttf'),
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
  });
  const ready = hydrated && fonts;
  const [intro, setIntro] = useState(true);
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => { }); }, [ready]);
  const { p, dark } = useTheme();
  if (!ready) return <View style={{ flex: 1, backgroundColor: p.bg }} />;
  return (
    <PlayerProvider>
      <StatusBar style={intro || dark ? 'light' : 'dark'} />
      <WebChrome />
      <Frame>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg }, animation: 'none' }}>
          <Stack.Screen name="(tabs)" /><Stack.Screen name="surah/[id]" /><Stack.Screen name="adhkar/[id]" />
          <Stack.Screen name="names" /><Stack.Screen name="qibla" /><Stack.Screen name="settings" /><Stack.Screen name="favorites" />
        </Stack>
        <MiniPlayer /><ToastHost />
      </Frame>
      {intro ? <Splash onDone={() => setIntro(false)} /> : null}
    </PlayerProvider>
  );
}

export default function Root() {
  return <SafeAreaProvider><StoreProvider><LocationProvider><Inner /></LocationProvider></StoreProvider></SafeAreaProvider>;
}