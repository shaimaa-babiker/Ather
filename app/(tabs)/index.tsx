import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FONTS } from '../../src/theme';
import { useData, useSettings, useTheme, useToast } from '../../src/store';
import { addDays, ar, fClock, fHijri, hijri, prayers, streak, type PK } from '../../src/util';
import { surah } from '../../src/data';
import { usePrayerLocation } from '../../src/location';
import { BeadsIcon, BookIcon, HandsIcon, Ornament, PatternBG } from '../../src/art';
import { Reveal, Screen } from '../../src/ui';
import { MOSQUE_IMAGES } from '../../assets/images';

/* ─── Serene Design Tokens ───────────────────────────────────── */
const NAVY = '#0A1C38';
const GOLD = '#C9A96E';
const BG = '#F8F9FA';
const CARD = '#FFFFFF';
const BORDER = '#E8E2D8';
const MUTED = '#78716C';

export default function Home() {
  const { p } = useTheme();
  const { data } = useData();
  const { settings } = useSettings();
  const { show } = useToast();
  const router = useRouter();

  const [favVerse, setFavVerse] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setClock(Date.now()), 30_000);
    return () => clearInterval(iv);
  }, []);
  const now = new Date(clock);
  const st = streak(data.daily);
  const last = data.last && surah(data.last.s);

  // ── Next Prayer Calculation for the current location ──
  const loc = usePrayerLocation(now);
  const ram = hijri(now).month === 9;
  const times = useMemo(
    () => prayers(now, loc.lat, loc.lng, loc.tz, loc.method, settings.asr === 'hanafi' ? 2 : 1, ram),
    [loc.lat, loc.lng, loc.tz, loc.methodKey, settings.asr, ram, now.getFullYear(), now.getMonth(), now.getDate()]
  );

  const nextPrayer = useMemo(() => {
    const rows: { k: PK; l: string }[] = [
      { k: 'fajr', l: 'الفجر' },
      { k: 'sunrise', l: 'الشروق' },
      { k: 'dhuhr', l: 'الظهر' },
      { k: 'asr', l: 'العصر' },
      { k: 'maghrib', l: 'المغرب' },
      { k: 'isha', l: 'العشاء' },
    ];
    const cityNow = ((now.getTime() / 3600000 + loc.tz) % 24 + 24) % 24;
    const found = rows.find((r) => times[r.k] != null && (times[r.k] as number) > cityNow);
    if (found) {
      return { l: found.l, time: fClock(times[found.k], settings.f24) };
    }
    // After Isha, the next prayer is tomorrow's Fajr.
    const tomorrow = addDays(now, 1);
    const t2 = prayers(tomorrow, loc.lat, loc.lng, loc.tz, loc.method, settings.asr === 'hanafi' ? 2 : 1, hijri(tomorrow).month === 9);
    return { l: 'الفجر', time: fClock(t2.fajr, settings.f24) };
  }, [times, loc.tz, loc.lat, loc.lng, loc.methodKey, settings.asr, settings.f24, now.getTime()]);

  /* ── 4 Essential Quick Hubs ── */
  const hubs = [
    {
      label: 'الأذكار',
      route: '/adhkar',
      icon: <BeadsIcon size={24} color={NAVY} />,
    },
    {
      label: 'أسماء الله الحسنى',
      route: '/names',
      icon: <Ionicons name="sparkles-outline" size={22} color={NAVY} />,
    },
    {
      label: 'الأدعية',
      route: '/duas',
      icon: <HandsIcon size={24} color={NAVY} />,
    },
    {
      label: 'القبلة والمواقيت',
      route: '/qibla',
      icon: <Ionicons name="compass-outline" size={23} color={NAVY} />,
    },
  ];

  return (
    <Screen pad={120} bg={BG}>

      {/* ── 1. Serene Greeting Header ── */}
      <Reveal>
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10,
            marginBottom: 16,
          }}>
          {/* Menu Drawer button */}
          <Pressable
            onPress={() => router.navigate('/more')}
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
            <Ionicons name="menu-outline" size={20} color={NAVY} />
          </Pressable>

          {/* Symmetrical Greeting & Hijri Date */}
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: FONTS.display,
                fontSize: 21,
                color: NAVY,
                letterSpacing: 0.3,
              }}>
              السلام عليكم ورحمة الله
            </Text>
            <Text
              style={{
                fontFamily: FONTS.uiMed,
                fontSize: 12,
                color: MUTED,
                marginTop: 2,
              }}>
              {fHijri(now)}
            </Text>
          </View>

          {/* Notifications / Settings button */}
          <Pressable
            onPress={() => router.push('/settings')}
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
            <Ionicons name="notifications-outline" size={19} color={NAVY} />
            <View
              style={{
                position: 'absolute',
                top: 9,
                right: 9,
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: NAVY,
                borderWidth: 1.5,
                borderColor: CARD,
              }}
            />
          </Pressable>
        </View>
      </Reveal>

      {/* ── 2. The Quran Sanctuary Card (Luxury & Eye Comfort) ── */}
      <Reveal delay={80}>
        <Pressable
          onPress={() => router.navigate('/quran')}
          style={{
            borderRadius: 22,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(201,169,110,0.32)',
            backgroundColor: '#071224',
          }}>
          <Image
            source={MOSQUE_IMAGES.heroQuran}
            style={{ position: 'absolute', top: 0, filter: 'blur(.3px)', left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View style={{ height: 204, justifyContent: 'space-between', padding: 18 }}>
            {/* Holy Quran Sanctuary Photography (Fills the entire card) */}

            {/* Subtle Gradient to showcase the reflection while maintaining high contrast for text */}
            <LinearGradient
              colors={['rgba(7,18,36,0.68)', 'rgba(7,18,36,0.18)', 'rgba(7,18,36,0.88)']}
              locations={[0, 0.42, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Subtle Golden Islamic Pattern */}
            <PatternBG color="#C9A96E" opacity={0.06} />

            {/* Card Header: Title & Chevron */}
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(201,169,110,0.40)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <BookIcon size={24} color="#FFFFFF" />
                </View>

                <View>
                  <Text
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: 23,
                      color: '#FFFFFF',
                      textAlign: 'right',
                    }}>
                    القرآن الكريم
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.uiMed,
                      fontSize: 11.5,
                      color: '#CBD5E1',
                      textAlign: 'right',
                      marginTop: 2,
                    }}>
                    تلاوة · تفسير · تدبر
                  </Text>
                </View>
              </View>

              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.20)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="chevron-back" size={17} color="#FFFFFF" />
              </View>
            </View>

            {/* Card Footer: Continue Reading pill */}
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 7,
                  backgroundColor: 'rgba(7,18,36,0.75)',
                  borderWidth: 1,
                  borderColor: 'rgba(201,169,110,0.30)',
                  borderRadius: 999,
                  paddingHorizontal: 13,
                  paddingVertical: 6,
                }}>
                <Ionicons name="play-circle" size={16} color={GOLD} />
                <Text style={{ fontFamily: FONTS.uiBold, fontSize: 11.5, color: '#FFFFFF' }}>
                  {last ? last.ar + ' · ص ' + ar(data.last.page + 1) : 'سورة الكهف · ص ٢٩٣'}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}>
                <Text style={{ fontFamily: FONTS.uiMed, fontSize: 10.5, color: '#E2E8F0' }}>
                  متابعة الورد
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Reveal>

      {/* ── 3. Quick Sanctuary Hubs (Spacious, Uncluttered Row) ── */}
      <Reveal delay={150}>
        <View
          style={{
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 22,
            marginBottom: 20,
            paddingHorizontal: 6,
          }}>
          {hubs.map((h, i) => (
            <Pressable
              key={i}
              onPress={() => router.navigate(h.route as any)}
              style={({ pressed }) => ({
                alignItems: 'center',
                gap: 8,
                opacity: pressed ? 0.75 : 1,
                flex: 1,
              })}>
              {/* Circular Medallion */}
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: CARD,
                  borderWidth: 1,
                  borderColor: BORDER,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {h.icon}
              </View>

              {/* Title */}
              <View style={{ minHeight: 32, justifyContent: 'flex-start', alignItems: 'center', width: '100%', paddingHorizontal: 2 }}>
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: FONTS.uiBold,
                    fontSize: 11.5,
                    lineHeight: 16,
                    color: NAVY,
                    textAlign: 'center',
                  }}>
                  {h.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Reveal>

      {/* ── 4. Spiritual Verse of the Day (Calm, Parchment Sanctuary) ── */}
      <Reveal delay={220}>
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: BORDER,
            paddingHorizontal: 18,
            paddingVertical: 18,
            alignItems: 'center',
            gap: 10,
          }}>
          {/* Subtle Decorative Ornament */}
          <Ornament width={160} color={GOLD} />

          {/* Centered Verse */}
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 20,
              color: NAVY,
              textAlign: 'center',
              lineHeight: 34,
              paddingHorizontal: 8,
            }}>
            « وَقُل رَّبِّ زِدْنِي عِلْمًا »
          </Text>

          {/* Bottom Reference & Action */}
          <View
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: 6,
              borderTopWidth: 1,
              borderTopColor: '#F4F1EB',
            }}>
            <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: MUTED }}>
              سورة طه · آية ١١٤
            </Text>

            <Pressable
              onPress={() => {
                setFavVerse(!favVerse);
                show(favVerse ? 'أُزيلت من المفضلة' : 'حُفظت الآية في المفضلة ♥');
              }}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: favVerse ? '#FEF2F2' : '#F8FAFC',
                borderWidth: 1,
                borderColor: favVerse ? '#FECACA' : BORDER,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons
                name={favVerse ? 'heart' : 'heart-outline'}
                size={16}
                color={favVerse ? '#EF4444' : '#94A3B8'}
              />
            </Pressable>
          </View>
        </View>
      </Reveal>

      {/* ── 5. Unified Daily Tracker Ribbon (Clean & Seamless) ── */}
      <Reveal delay={280}>
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: BORDER,
            marginTop: 14,
            paddingVertical: 14,
            flexDirection: 'row-reverse',
            alignItems: 'center',
          }}>
          {/* 1. المواظبة */}
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}>
              <Ionicons name="flame-outline" size={16} color={NAVY} />
              <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 16, color: NAVY }}>
                {ar(st)}
              </Text>
            </View>
            <Text style={{ fontFamily: FONTS.ui, fontSize: 10.5, color: MUTED }}>
              يوم مواظبة
            </Text>
          </View>

          {/* Divider */}
          <View style={{ width: 1, height: 26, backgroundColor: '#E8E2D8' }} />

          {/* 2. التسبيحات */}
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}>
              <Ionicons name="repeat-outline" size={16} color={NAVY} />
              <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 16, color: NAVY }}>
                {ar(data.total.dhikr)}
              </Text>
            </View>
            <Text style={{ fontFamily: FONTS.ui, fontSize: 10.5, color: MUTED }}>
              تسبيحة
            </Text>
          </View>

          {/* Divider */}
          <View style={{ width: 1, height: 26, backgroundColor: '#E8E2D8' }} />

          {/* 3. القبلة ومواقيت الصلاة */}
          <Pressable
            onPress={() => router.navigate('/qibla' as any)}
            style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}>
              <Ionicons name="compass-outline" size={16} color={NAVY} />
              <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 13.5, color: NAVY }}>
                {nextPrayer ? `${nextPrayer.l} ${nextPrayer.time}` : 'القبلة'}
              </Text>
            </View>
            <Text style={{ fontFamily: FONTS.ui, fontSize: 10.5, color: MUTED }}>
              {loc.isGeo ? 'مواقيت موقعك الحالي' : 'مواقيت ' + loc.city.ar}
            </Text>
          </Pressable>
        </View>
      </Reveal>

    </Screen>
  );
}
