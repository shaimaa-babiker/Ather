import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FONTS } from '../../src/theme';
import { useData, useTheme, useToast } from '../../src/store';
import { ar, dkey, shareText } from '../../src/util';
import { getSet } from '../../src/data';
import { Empty, Header, Reveal, Screen } from '../../src/ui';
import { BeadsIcon, Ornament, PatternBG } from '../../src/art';
import { MOSQUE_IMAGES } from '../../assets/images';

/* ─── Serene Design Tokens (Matching Home Screen) ────────────── */
const NAVY = '#0A1C38';
const GOLD = '#C9A96E';
const BG = '#F8F9FA';
const CARD = '#FFFFFF';
const BORDER = '#E8E2D8';
const MUTED = '#78716C';

const AC = Animated.createAnimatedComponent(Circle) as any;

const hap = (win: boolean) => {
  if (Platform.OS === 'web') return;
  try {
    win
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch { }
};

export default function Counter() {
  const { id, i } = useLocalSearchParams<any>();
  const set = getSet(String(id));
  const { qs } = useTheme();
  const { upd, fav, isFav } = useData();
  const { show } = useToast();
  const router = useRouter();
  const ins = useSafeAreaInsets();

  const [idx, setIdx] = useState(() =>
    Math.max(0, Math.min((set ? set.items.length : 1) - 1, parseInt(String(i || '0'), 10) || 0)),
  );
  const [counts, setCounts] = useState<any>({});
  const [fin, setFin] = useState(false);
  const start = useRef(Date.now());
  const timer = useRef<any>(null);
  const ir = useRef(idx);
  ir.current = idx;
  const cr = useRef(counts);
  cr.current = counts;
  const pulse = useRef(new Animated.Value(1)).current;
  const prog = useRef(new Animated.Value(0)).current;

  const item = set ? set.items[idx] : null;
  const c = counts[idx] || 0;
  const target = item ? item.count : 1;
  const remaining = Math.max(0, target - c);
  const done = c >= target;

  useEffect(() => {
    Animated.timing(prog, {
      toValue: Math.min(1, c / target),
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [c, target]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!set || !item) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <Header title="الأذكار" />
        <Empty
          title="الورد غير موجود"
          desc="عد إلى قائمة الأذكار."
          action="العودة"
          onAction={() => router.replace('/adhkar')}
        />
      </View>
    );
  }

  const total = set.items.reduce((s, x) => s + x.count, 0);

  const finish = () => {
    hap(true);
    const key = dkey(new Date());
    upd((d: any) =>
      Object.assign({}, d, {
        daily: Object.assign({}, d.daily, {
          [key]: Array.from(new Set((d.daily[key] || []).concat([set.id]))),
        }),
        total: { dhikr: d.total.dhikr + total, wards: d.total.wards + 1 },
      }),
    );
    setFin(true);
  };

  const go = (x: number) => {
    if (timer.current) clearTimeout(timer.current);
    if (x >= set.items.length) {
      finish();
      return;
    }
    setIdx(Math.max(0, x));
  };

  const after = (k: number, val: number) => {
    const all = set.items.every((x, j) => (j === k ? val : cr.current[j] || 0) >= x.count);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      all ? finish() : go(ir.current + 1);
    }, 550);
  };

  const tap = () => {
    if (done) return;
    hap(false);
    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
    ]).start();
    const v = c + 1;
    setCounts((s: any) => Object.assign({}, s, { [idx]: v }));
    if (v >= target) {
      hap(true);
      after(idx, v);
    }
  };

  const swipe = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -60) go(Math.min(set.items.length - 1, ir.current + 1));
        else if (g.dx > 60) go(Math.max(0, ir.current - 1));
      },
    }),
  ).current;

  const [scrollH, setScrollH] = useState(0);

  // ── Hero image changes based on the dhikr set ──
  const HERO_IMAGE = (() => {
    switch (set.id) {
      case 'morning': return MOSQUE_IMAGES.dawn;
      case 'waking': return MOSQUE_IMAGES.dawn;
      case 'evening': return MOSQUE_IMAGES.eveningAzkar;
      case 'sleep': return MOSQUE_IMAGES.night;
      case 'prayer': return MOSQUE_IMAGES.heroQuran;
      default: return MOSQUE_IMAGES.stitchCounterMosque;
    }
  })();

  // Circular dial progress metrics (74x74 luxury dial)
  const DIAL_R = 30;
  const DIAL_C = 2 * Math.PI * DIAL_R;
  const dash = prog.interpolate({ inputRange: [0, 1], outputRange: [DIAL_C, 0] });
  const fid = set.id + ':' + idx;
  const mins = Math.max(1, Math.round((Date.now() - start.current) / 60000));

  // ── Completion Celebration View (Matching Home Screen) ──
  if (fin) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, paddingTop: ins.top + 6, paddingHorizontal: 16 }}>
        {/* Symmetrical Header */}
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10,
            marginBottom: 12,
          }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: CARD,
              borderWidth: 1,
              borderColor: BORDER,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="chevron-forward" size={20} color={NAVY} />
          </Pressable>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.display, fontSize: 21, color: NAVY }}>
              {set.title}
            </Text>
            <Text style={{ fontFamily: FONTS.uiMed, fontSize: 12, color: MUTED, marginTop: 2 }}>
              تم بحمد الله
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Hero Mosque Card (Floating, exactly like Home) */}
        <View
          style={{
            height: 120,
            borderRadius: 22,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201,169,110,0.32)',
            backgroundColor: '#071224',
            marginBottom: 14,
          }}>
          <Image
            source={HERO_IMAGE}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(7,18,36,0.68)', 'rgba(7,18,36,0.22)', 'rgba(7,18,36,0.88)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <PatternBG color="#C9A96E" opacity={0.06} />

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 14, gap: 6 }}>
            <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: '#FFFFFF' }}>
              {set.title}
            </Text>
            <Text style={{ fontFamily: FONTS.uiMed, fontSize: 12, color: '#CBD5E1' }}>
              {ar(total)} ذكراً وتسبيحة · في قرابة {ar(mins)} دقيقة
            </Text>
          </View>
        </View>

        {/* Celebration Sanctuary Card */}
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: BORDER,
            paddingHorizontal: 20,
            paddingVertical: 24,
            alignItems: 'center',
          }}>
          <Ionicons name="checkmark-circle" size={52} color={GOLD} />
          <Text style={{ fontFamily: FONTS.display, fontSize: 25, color: NAVY, textAlign: 'center', marginTop: 10 }}>
            تقبّل الله طاعتكم
          </Text>
          <Text style={{ fontFamily: FONTS.uiMed, fontSize: 13, color: MUTED, textAlign: 'center', marginTop: 4 }}>
            أتممت {set.title} بحمد الله وفضله
          </Text>

          <View style={{ marginTop: 12, marginBottom: 16 }}>
            <Ornament width={160} color={GOLD} />
          </View>

          {/* Unified Stats Ribbon */}
          <View style={{ flexDirection: 'row-reverse', gap: 12, width: '100%' }}>
            <View
              style={{
                flex: 1,
                backgroundColor: '#FAF8F5',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: BORDER,
              }}>
              <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 20, color: NAVY }}>{ar(total)}</Text>
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11, color: MUTED, marginTop: 2 }}>ذكراً وتسبيحة</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: '#FAF8F5',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: BORDER,
              }}>
              <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 20, color: NAVY }}>{ar(mins)}</Text>
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11, color: MUTED, marginTop: 2 }}>دقيقة تقريباً</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
            <Pressable
              onPress={async () => {
                const r = await shareText(
                  'أتممت ' + set.title + ' (' + ar(total) + ' ذكراً) بحمد الله 🌙\nعبر تطبيق القرآن والأذكار',
                );
                if (r === 'copied') show('نُسخ الإنجاز للمشاركة');
              }}
              style={({ pressed }) => ({
                height: 48,
                borderRadius: 12,
                backgroundColor: pressed ? '#142745' : NAVY,
                borderWidth: 1,
                borderColor: 'rgba(201,169,110,0.35)',
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              })}>
              <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 14, color: '#FFFFFF' }}>
                شارك الإنجاز
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setCounts({});
                setIdx(0);
                setFin(false);
                start.current = Date.now();
              }}
              style={({ pressed }) => ({
                height: 48,
                borderRadius: 12,
                backgroundColor: pressed ? '#F4F1EB' : '#FAF8F5',
                borderWidth: 1,
                borderColor: BORDER,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              })}>
              <Ionicons name="refresh" size={18} color={NAVY} />
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 14, color: NAVY }}>
                إعادة الورد
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.navigate('/')}
              style={({ pressed }) => ({
                height: 48,
                borderRadius: 12,
                backgroundColor: pressed ? '#F4F1EB' : '#FAF8F5',
                borderWidth: 1,
                borderColor: BORDER,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              })}>
              <Ionicons name="home-outline" size={18} color={NAVY} />
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 14, color: NAVY }}>
                العودة للرئيسية
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Main Counter View: Serene Atmosphere Matching Home Screen ──
  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: ins.top + 6, paddingHorizontal: 16 }}>
      {/* ── 1. Serene Greeting Header (Matching Home Screen Header) ── */}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 6,
          marginBottom: 10,
        }}>
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: CARD,
            borderWidth: 1,
            borderColor: BORDER,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="chevron-forward" size={20} color={NAVY} />
        </Pressable>

        {/* Symmetrical Header Title */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 21,
              color: NAVY,
              letterSpacing: 0.3,
            }}>
            {set.title}
          </Text>

        </View>

        {/* Favorite button */}
        <Pressable
          onPress={() => {
            const r = fav('A', fid);
            show(r ? 'أُزيل من المفضلة' : 'حُفظ الذكر ♥', r ? 'info' : 'success', {
              label: 'تراجع',
              onPress: () => fav('A', fid),
            });
          }}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isFav('A', fid) ? '#FEF2F2' : CARD,
            borderWidth: 1,
            borderColor: isFav('A', fid) ? '#FECACA' : BORDER,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons
            name={isFav('A', fid) ? 'heart' : 'heart-outline'}
            size={19}
            color={isFav('A', fid) ? '#EF4444' : NAVY}
          />
        </Pressable>
      </View>

      {/* ── 2. The Mosque Sanctuary Hero Card (Signature Home Screen Component) ── */}
      <View
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(201,169,110,0.32)',
          backgroundColor: '#071224',
          marginBottom: 10,
        }}>
        <Image
          source={HERO_IMAGE}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />
        {/* Subtle Gradient */}
        <LinearGradient
          colors={['rgba(7,18,36,0.68)', 'rgba(7,18,36,0.20)', 'rgba(7,18,36,0.90)']}
          locations={[0, 0.42, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {/* Subtle Golden Islamic Pattern */}
        <PatternBG color="#C9A96E" opacity={0.06} />

        <View style={{ height: 104, justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 }}>
          {/* Card Top Row: Medallion + Title + Repetition Badge */}
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(201,169,110,0.40)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <BeadsIcon size={20} color="#FFFFFF" />
              </View>

              <View>
                <Text
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 18,
                    color: '#FFFFFF',
                    textAlign: 'right',
                  }}>
                  {set.title}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.uiMed,
                    fontSize: 11,
                    color: '#CBD5E1',
                    textAlign: 'right',
                  }}>
                  {set.desc || 'حصن المسلم وطمأنينة القلوب'}
                </Text>
              </View>
            </View>

            {/* Repetition target pill */}
            <View
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 5,
                backgroundColor: 'rgba(7,18,36,0.75)',
                borderWidth: 1,
                borderColor: 'rgba(201,169,110,0.35)',
                borderRadius: 999,
                paddingHorizontal: 11,
                paddingVertical: 5,
              }}>
              <Ionicons name="repeat-outline" size={13} color={GOLD} />
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: '#FFFFFF' }}>
                {item.count === 1 ? 'مرة واحدة' : `${ar(item.count)} مرات`}
              </Text>
            </View>
          </View>

          {/* Card Bottom: Progress ratio & progress bar */}
          <View style={{ gap: 5 }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>

              <Text style={{ fontFamily: FONTS.uiBold, fontSize: 10.5, color: GOLD }}>
                {ar(idx + 1)} / {ar(set.items.length)}
              </Text>
            </View>
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.18)',
                overflow: 'hidden',
                width: '100%',
              }}>
              <View
                style={{
                  height: '100%',
                  width: `${((idx + (done ? 1 : 0)) / set.items.length) * 100}%`,
                  backgroundColor: GOLD,
                  borderRadius: 2,
                }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* ── 3. Spiritual Dhikr Sanctuary Card (Matches Verse Card on Home Screen) ── */}
      <View
        {...swipe.panHandlers}
        style={{
          flex: 1,
          backgroundColor: CARD,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: BORDER,
          overflow: 'hidden',
        }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          onLayout={e => setScrollH(e.nativeEvent.layout.height)}
          contentContainerStyle={{
            minHeight: scrollH,
            paddingHorizontal: 18,
            paddingVertical: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Pressable onPress={tap} style={{ width: '100%', alignItems: 'center' }}>
            {/* Top Islamic Ornament */}
            <View style={{ marginBottom: 12 }}>
              <Ornament width={150} color={GOLD} />
            </View>

            {/* Dhikr text in majestic font */}
            <Text
              style={{
                fontFamily: FONTS.display,
                fontSize: Math.max(21, qs + 1),
                lineHeight: Math.max(21, qs + 1) * 2.2,
                color: NAVY,
                textAlign: 'center',
                writingDirection: 'rtl',
                paddingHorizontal: 4,
              }}>
              {item.text}
            </Text>

            {/* Bottom Islamic Ornament */}
            <View style={{ marginTop: 12 }}>
              <Ornament width={150} color={GOLD} />
            </View>

            {/* Reference */}
            {item.ref ? (
              <View
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'flex-start',
                  gap: 8,
                  width: '100%',
                  marginTop: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: '#FAF8F5',
                  borderWidth: 1,
                  borderColor: BORDER,
                }}>
                <Ionicons name="book-outline" size={14} color={GOLD} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.uiBold,
                      fontSize: 10.5,
                      color: GOLD,
                      textAlign: 'right',
                      marginBottom: 2,
                    }}>
                    المصدر
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.ui,
                      fontSize: 11,
                      lineHeight: 18,
                      color: MUTED,
                      textAlign: 'right',
                    }}>
                    {item.ref}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Virtue Note */}
            {item.virtue ? (
              <View
                style={{
                  flexDirection: 'row-reverse',
                  gap: 8,
                  backgroundColor: '#FAF8F5',
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 14,
                  borderWidth: 1,
                  borderColor: BORDER,
                  width: '100%',
                }}>
                <Ionicons name="sparkles" size={14} color={GOLD} style={{ marginTop: 2 }} />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: FONTS.ui,
                    fontSize: 12,
                    color: NAVY,
                    textAlign: 'right',
                    lineHeight: 19,
                  }}>
                  {item.virtue}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </ScrollView>
      </View>

      {/* ── 4. Unified Controls & Navigation Dock (Matches Home Ribbon) ── */}
      <View
        style={{
          backgroundColor: CARD,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: BORDER,
          marginTop: 10,
          marginBottom: Math.max(ins.bottom, 10),
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 10,
        }}>
        {/* Upper Row: Previous | Grand Counter Medallion Button | Next */}
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
          }}>
          {/* Previous (السابق) */}
          <Pressable
            onPress={() => go(idx - 1)}
            disabled={idx === 0}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 52,
              height: 48,
              borderRadius: 14,
              backgroundColor: pressed ? '#F4F1EB' : '#FAF8F5',
              borderWidth: 1,
              borderColor: BORDER,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              opacity: idx === 0 ? 0.35 : 1,
            })}>
            <Ionicons name="chevron-forward" size={18} color={NAVY} />
            <Text style={{ fontFamily: FONTS.uiMed, fontSize: 10, color: MUTED }}>السابق</Text>
          </Pressable>

          {/* Grand Tasbeeh Counter Button (Centerpiece Medallion) */}
          <Pressable
            onPress={tap}
            onLongPress={() => {
              if (c > 0 && !done) {
                setCounts((s: any) => Object.assign({}, s, { [idx]: c - 1 }));
                hap(false);
              }
            }}
            delayLongPress={300}
            hitSlop={6}
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: '#FAF8F5',
              borderWidth: 1.5,
              borderColor: done ? 'rgba(201,169,110,0.65)' : 'rgba(201,169,110,0.40)',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#0A1C38',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
            }}>
            <Animated.View
              style={{
                transform: [{ scale: pulse }],
                width: 74,
                height: 74,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Svg width={74} height={74} style={{ position: 'absolute' }}>
                {/* Decorative hairline outer ring */}
                <Circle
                  cx={37}
                  cy={37}
                  r={34}
                  stroke={done ? 'rgba(201,169,110,0.35)' : 'rgba(201,169,110,0.22)'}
                  strokeWidth={1}
                  fill="none"
                />
                {/* Background track circle */}
                <Circle
                  cx={37}
                  cy={37}
                  r={DIAL_R}
                  stroke="#EFECE6"
                  strokeWidth={4}
                  fill="none"
                />
                {/* Animated active progress ring */}
                <AC
                  cx={37}
                  cy={37}
                  r={DIAL_R}
                  stroke={done ? GOLD : NAVY}
                  strokeWidth={4}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${DIAL_C} ${DIAL_C}`}
                  strokeDashoffset={dash}
                  transform="rotate(-90 37 37)"
                />
              </Svg>

              {done ? (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark-circle" size={28} color={GOLD} />
                  <Text style={{ fontFamily: FONTS.uiBold, fontSize: 10, color: GOLD, marginTop: 1 }}>
                    تم ✓
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text
                    style={{
                      fontFamily: FONTS.uiBlack,
                      fontSize: remaining >= 100 ? 19 : 23,
                      color: NAVY,
                      textAlign: 'center',
                      includeFontPadding: false,
                      lineHeight: remaining >= 100 ? 21 : 25,
                    }}>
                    {ar(remaining)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.uiMed,
                      fontSize: 9.5,
                      color: MUTED,
                      textAlign: 'center',
                      marginTop: 1,
                    }}>
                    {ar(c)} / {ar(target)}
                  </Text>
                </View>
              )}
            </Animated.View>
          </Pressable>

          {/* Next (التالي) */}
          <Pressable
            onPress={() => go(idx + 1)}
            disabled={idx >= set.items.length - 1}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 52,
              height: 48,
              borderRadius: 14,
              backgroundColor: pressed ? '#F4F1EB' : '#FAF8F5',
              borderWidth: 1,
              borderColor: BORDER,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              opacity: idx >= set.items.length - 1 ? 0.35 : 1,
            })}>
            <Ionicons name="chevron-back" size={18} color={NAVY} />
            <Text style={{ fontFamily: FONTS.uiMed, fontSize: 10, color: MUTED }}>التالي</Text>
          </Pressable>
        </View>

        {/* Lower Row: Mark Done (إتمام الذكر) | Share (مشاركة) */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
          {/* Quick Complete / Mark Done */}
          <Pressable
            onPress={() => {
              setCounts((s: any) => Object.assign({}, s, { [idx]: item.count }));
              hap(true);
              after(idx, item.count);
            }}
            style={({ pressed }) => ({
              flex: 1,
              height: 42,
              borderRadius: 12,
              backgroundColor: done ? 'rgba(201,169,110,0.14)' : (pressed ? '#142745' : NAVY),
              borderWidth: 1,
              borderColor: done ? 'rgba(201,169,110,0.45)' : 'rgba(201,169,110,0.30)',
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            })}>
            <Ionicons name="checkmark-circle-outline" size={17} color={done ? GOLD : '#FFFFFF'} />
            <Text style={{ fontFamily: FONTS.uiMed, fontSize: 13, color: done ? '#8A6020' : '#FFFFFF' }}>
              {done ? 'أُتمّ الذكر ✓' : 'إتمام الذكر'}
            </Text>
          </Pressable>

          {/* Share */}
          <Pressable
            onPress={async () => {
              const r = await shareText(
                `${set.title}\n\n${item.text}\n(${item.count === 1 ? 'مرة واحدة' : `${ar(item.count)} مرات`})`
                  + (item.ref ? `\n\nالمصدر: ${item.ref}` : ''),
              );
              if (r === 'copied') show('نُسخ الذكر للمشاركة');
            }}
            hitSlop={6}
            style={({ pressed }) => ({
              flex: 1,
              height: 42,
              borderRadius: 12,
              backgroundColor: pressed ? '#F4F1EB' : '#FAF8F5',
              borderWidth: 1,
              borderColor: BORDER,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            })}>
            <Ionicons name="share-social-outline" size={16} color={NAVY} />
            <Text numberOfLines={1} style={{ fontFamily: FONTS.uiMed, fontSize: 13, color: NAVY }}>
              مشاركة الذكر
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
