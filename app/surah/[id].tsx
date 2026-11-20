import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLABELS, FONTS } from '../../src/theme';
import { useData, useSettings, useTheme, useToast } from '../../src/store';
import { usePlayer, FullPlayer, RECITER } from '../../src/player';
import { ar, ayahWord, copyText, shareText, stripT } from '../../src/util';
import { BASMALA, surah, surahJuz, surahHizb, SURAHS, type Surah } from '../../src/data';
import { Ornament, PatternBG } from '../../src/art';
import { Empty, Reveal, Stepper, ToggleRow } from '../../src/ui';

/* ─── Serene Design Tokens (Matching Sanctuary Aesthetic) ────── */
const NAVY = '#0A1C38';
const GOLD = '#C9A96E';

/* ─── Ayah Audio Base CDN (Sheikh Mishary Alafasy) ────────────── */
const INIT_AYAH = { uri: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3' };

export default function Reader() {
  const par = useLocalSearchParams<any>();
  const n = Math.max(1, Math.min(114, parseInt(String(par.id), 10) || 1));
  const m = surah(n);
  const nextSurah = n < 114 ? surah(n + 1) : null;

  const { p, qs, qlh } = useTheme();
  const { settings, setSettings } = useSettings();
  const { data, upd, fav, isFav } = useData();
  const { show } = useToast();
  const pl = usePlayer();
  const router = useRouter();
  const ins = useSafeAreaInsets();

  const isDark = settings.mode === 'dark';
  const BG_COLOR = isDark ? '#051020' : '#F8F9FA';
  const CARD_BG = isDark ? '#0A1C38' : '#FFFFFF';
  const TEXT_COLOR = isDark ? '#F1F5F9' : '#0B1E38';
  const BORDER_COLOR = isDark ? 'rgba(201,169,110,0.22)' : '#E8E2D8';
  const MUTED_COLOR = isDark ? '#94A3B8' : '#78716C';

  const juz = surahJuz(n);
  const hizb = surahHizb(n);

  const readerMode = settings.readerMode || 'swipe';
  const setReaderMode = (mode: 'swipe' | 'vertical') => {
    setSettings({ readerMode: mode });
    show(
      mode === 'swipe'
        ? 'نمط القراءة: سحب أفقي (صفحات)'
        : 'نمط القراءة: تمرير رأسي (مستمر)',
      'info',
    );
  };

  const [page, setPage] = useState(() => {
    const x = par.p != null ? parseInt(String(par.p), 10) : NaN;
    return !isNaN(x) ? x : data.last && data.last.s === n ? data.last.page : 0;
  });
  const [sel, setSel] = useState<number | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [ayahLoading, setAyahLoading] = useState(false);
  const [panel, setPanel] = useState(false);
  const [indexModal, setIndexModal] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const toasted = useRef(false);

  // ── Ayah Audio Player (Individual Ayah Recitation) ──
  const ayahPlayer = useAudioPlayer(INIT_AYAH, { updateInterval: 250 });
  const ayahStatus = useAudioPlayerStatus(ayahPlayer);
  const isAyahPlaying =
    sel != null && playingAyah === sel + 1 && !!(ayahStatus && ayahStatus.playing);

  useEffect(() => {
    if (ayahStatus && ayahStatus.isLoaded && ayahLoading) {
      setAyahLoading(false);
    }
    if (ayahStatus && ayahStatus.didJustFinish) {
      setPlayingAyah(null);
      setAyahLoading(false);
    }
  }, [ayahStatus?.didJustFinish, ayahStatus?.isLoaded]);

  // Pause ayah recitation whenever ayah selection is cleared
  useEffect(() => {
    if (sel === null && playingAyah !== null) {
      try {
        ayahPlayer.pause();
      } catch { }
      setPlayingAyah(null);
      setAyahLoading(false);
    }
  }, [sel]);

  // Pause on unmount or surah change
  useEffect(() => {
    return () => {
      try {
        ayahPlayer.pause();
      } catch { }
    };
  }, [n]);

  const toggleAyahAudio = (ayahIdx: number) => {
    const ayahNum = ayahIdx + 1;
    // Pause full surah player if running to avoid sound overlap
    if (pl.status && pl.status.playing) {
      try {
        pl.toggle();
      } catch { }
    }

    if (playingAyah === ayahNum && ayahStatus && ayahStatus.playing) {
      try {
        ayahPlayer.pause();
      } catch { }
      setPlayingAyah(null);
      setAyahLoading(false);
      return;
    }

    const sPad = String(n).padStart(3, '0');
    const aPad = String(ayahNum).padStart(3, '0');
    const audioUri = `https://everyayah.com/data/Alafasy_128kbps/${sPad}${aPad}.mp3`;

    try {
      setAyahLoading(true);
      setPlayingAyah(ayahNum);
      ayahPlayer.replace({ uri: audioUri });
      ayahPlayer.play();
    } catch {
      setAyahLoading(false);
      show('تعذّر تشغيل تلاوة الآية', 'error');
    }
  };

  useEffect(() => {
    const x = par.p != null ? parseInt(String(par.p), 10) : NaN;
    setPage(!isNaN(x) ? x : 0);
  }, [n, par.p]);

  // ── Surah search filter for Quick Index Modal ──
  const filteredSurahs = useMemo(() => {
    if (!searchQ.trim()) return SURAHS;
    const q = stripT(searchQ.trim().toLowerCase());
    return SURAHS.filter(
      (s) =>
        stripT(s.ar).includes(q) ||
        s.en.toLowerCase().includes(q) ||
        String(s.n) === q,
    );
  }, [searchQ]);

  // ── Dynamic page pagination based on font size (for swipe mode) ──
  const pages = useMemo(() => {
    if (!m) return [];
    const limit = Math.max(240, Math.round(720 * (21 / qs)));
    const out: number[][] = [];
    let cur: number[] = [];
    let len = 0;
    m.text.forEach((t, i) => {
      const l = (settings.tashkeel ? t : stripT(t)).length;
      if (len + l > limit && cur.length) {
        out.push(cur);
        cur = [];
        len = 0;
      }
      cur.push(i);
      len += l;
    });
    if (cur.length) out.push(cur);
    return out;
  }, [m, qs, settings.tashkeel]);

  const count = Math.max(1, pages.length);
  const safe = Math.min(page, count - 1);
  const pr = useRef(safe);
  pr.current = safe;
  const cr = useRef(count);
  cr.current = count;
  const nr = useRef(n);
  nr.current = n;

  useEffect(() => {
    setPage((x: number) => Math.min(x, count - 1));
  }, [count]);

  useEffect(() => {
    if (!m) return;
    upd((d: any) => Object.assign({}, d, { last: { s: n, page: safe } }));
    if (safe === count - 1 && count > 1 && !toasted.current) {
      toasted.current = true;
      show('أتممت قراءة سورة ' + m.ar + ' — تقبّل الله 🌙');
    }
  }, [safe, m]);

  // ── Responsive horizontal swipe gesture for page turns ──
  const swipe = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        readerMode === 'swipe' && Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15,
      onMoveShouldSetPanResponder: (_, g) =>
        readerMode === 'swipe' && Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15,
      onPanResponderRelease: (_, g) => {
        if (readerMode !== 'swipe') return;
        if (g.dx < -25) {
          if (pr.current < cr.current - 1) {
            setSel(null);
            setPage(pr.current + 1);
          } else if (pr.current === cr.current - 1 && nr.current < 114 && g.dx < -55) {
            setSel(null);
            router.replace('/surah/' + (nr.current + 1));
          }
        } else if (g.dx > 25 && pr.current > 0) {
          setSel(null);
          setPage(pr.current - 1);
        }
      },
    }),
  ).current;

  if (!m) return <ScreenEmpty />;

  const go = (d: number) => {
    setSel(null);
    setPage((x: number) => Math.max(0, Math.min(count - 1, x + d)));
  };

  const selText = sel != null ? m.text[sel] : null;

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLOR }}>
      {/* ── 1. Symmetrical Serene Header ── */}
      <View
        style={{
          paddingTop: ins.top + 6,
          paddingHorizontal: 16,
          paddingBottom: 10,
          backgroundColor: BG_COLOR,
          borderBottomWidth: 1,
          borderBottomColor: BORDER_COLOR,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        {/* Navigation Controls: Back & Direct Surah Index Button */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
          {/* Back button */}
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.navigate('/quran');
              }
            }}
            hitSlop={8}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: CARD_BG,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="chevron-forward" size={19} color={isDark ? '#FFFFFF' : NAVY} />
          </Pressable>

          {/* Surah Index (فهرس السور) Direct Button */}
          <Pressable
            onPress={() => router.navigate('/quran')}
            onLongPress={() => setIndexModal(true)}
            hitSlop={6}
            style={({ pressed }) => ({
              height: 38,
              paddingHorizontal: 10,
              borderRadius: 19,
              backgroundColor: pressed
                ? '#F4F1EB'
                : isDark
                  ? 'rgba(201,169,110,0.14)'
                  : '#FAF5EB',
              borderWidth: 1,
              borderColor: 'rgba(201,169,110,0.40)',
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 5,
            })}>
            <Ionicons name="book-outline" size={15} color={GOLD} />
            <Text
              style={{
                fontFamily: FONTS.uiBold,
                fontSize: 11.5,
                color: isDark ? '#FFFFFF' : NAVY,
              }}>
              الفهرس
            </Text>
          </Pressable>
        </View>

        {/* Center Surah Info (Clickable: Opens In-Reader Surah Picker) */}
        <Pressable
          onPress={() => setIndexModal(true)}
          hitSlop={8}
          style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
            <Text
              style={{
                fontFamily: FONTS.display,
                fontSize: 21,
                color: isDark ? '#FFFFFF' : NAVY,
                letterSpacing: 0.3,
              }}>
              سورة {m.ar}
            </Text>
            <Ionicons name="chevron-down" size={14} color={GOLD} style={{ marginTop: 2 }} />
          </View>
          <Text
            style={{
              fontFamily: FONTS.uiMed,
              fontSize: 11,
              color: MUTED_COLOR,
              marginTop: 1,
            }}>
            {m.place} · {ar(m.ayat)} {ayahWord(m.ayat)} · الجزء {ar(juz)}
          </Text>
        </Pressable>

        {/* Action icons: Quick Reading Mode Toggle, Bookmark & Display Settings */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
          {/* Quick Reading Mode Switcher */}
          <Pressable
            hitSlop={8}
            onPress={() => setReaderMode(readerMode === 'swipe' ? 'vertical' : 'swipe')}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: isDark ? 'rgba(201,169,110,0.14)' : '#FAF5EB',
              borderWidth: 1,
              borderColor: 'rgba(201,169,110,0.40)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons
              name={readerMode === 'swipe' ? 'swap-horizontal' : 'swap-vertical'}
              size={18}
              color={GOLD}
            />
          </Pressable>

          {/* Bookmark */}
          <Pressable
            hitSlop={8}
            onPress={() => {
              const r = fav('S', n);
              show(
                r ? 'أُزيلت من المفضلة' : 'حُفظت السورة في المفضلة ⭐',
                r ? 'info' : 'success',
                { label: 'تراجع', onPress: () => fav('S', n) },
              );
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: isFav('S', n)
                ? isDark
                  ? 'rgba(201,169,110,0.18)'
                  : '#FAF5EB'
                : CARD_BG,
              borderWidth: 1,
              borderColor: isFav('S', n) ? GOLD : BORDER_COLOR,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons
              name={isFav('S', n) ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isFav('S', n) ? GOLD : isDark ? '#CBD5E1' : NAVY}
            />
          </Pressable>

          {/* Text & Reader Settings */}
          <Pressable
            hitSlop={8}
            onPress={() => setPanel(!panel)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: panel
                ? isDark
                  ? 'rgba(201,169,110,0.18)'
                  : '#FAF5EB'
                : CARD_BG,
              borderWidth: 1,
              borderColor: panel ? GOLD : BORDER_COLOR,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons
              name="options-outline"
              size={18}
              color={panel ? GOLD : isDark ? '#CBD5E1' : NAVY}
            />
          </Pressable>
        </View>
      </View>

      {/* ── 2. Display & Reading Mode Settings Slide Panel ── */}
      {panel ? (
        <Reveal>
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 10,
              marginBottom: 4,
              backgroundColor: CARD_BG,
              borderWidth: 1,
              borderColor: BORDER_COLOR,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 4,
              shadowColor: '#0A1C38',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}>
            {/* Reading Mode Selector */}
            <View
              style={{
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: BORDER_COLOR,
              }}>
              <Text
                style={{
                  fontFamily: FONTS.uiBold,
                  fontSize: 13,
                  color: isDark ? '#FFFFFF' : NAVY,
                  textAlign: 'right',
                  marginBottom: 8,
                }}>
                نمط القراءة
              </Text>
              <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                <Pressable
                  onPress={() => setReaderMode('swipe')}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor:
                      readerMode === 'swipe'
                        ? isDark
                          ? GOLD
                          : NAVY
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#FAF8F5',
                    borderWidth: 1,
                    borderColor: readerMode === 'swipe' ? GOLD : BORDER_COLOR,
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={17}
                    color={readerMode === 'swipe' ? (isDark ? '#071224' : '#FFFFFF') : MUTED_COLOR}
                  />
                  <Text
                    style={{
                      fontFamily: FONTS.uiBold,
                      fontSize: 11.5,
                      color:
                        readerMode === 'swipe' ? (isDark ? '#071224' : '#FFFFFF') : MUTED_COLOR,
                    }}>
                    سحب أفقي (صفحات)
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setReaderMode('vertical')}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor:
                      readerMode === 'vertical'
                        ? isDark
                          ? GOLD
                          : NAVY
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#FAF8F5',
                    borderWidth: 1,
                    borderColor: readerMode === 'vertical' ? GOLD : BORDER_COLOR,
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}>
                  <Ionicons
                    name="swap-vertical-outline"
                    size={17}
                    color={
                      readerMode === 'vertical' ? (isDark ? '#071224' : '#FFFFFF') : MUTED_COLOR
                    }
                  />
                  <Text
                    style={{
                      fontFamily: FONTS.uiBold,
                      fontSize: 11.5,
                      color:
                        readerMode === 'vertical' ? (isDark ? '#071224' : '#FFFFFF') : MUTED_COLOR,
                    }}>
                    تمرير رأسي (مستمر)
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Font Size Stepper */}
            <View
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: BORDER_COLOR,
              }}>
              <Text style={{ fontFamily: FONTS.uiBold, fontSize: 13, color: isDark ? '#FFFFFF' : NAVY }}>
                حجم الخط
              </Text>
              <Stepper
                value={settings.fontIdx}
                min={0}
                max={3}
                onChange={(v: number) => setSettings({ fontIdx: v })}
                display={FLABELS[settings.fontIdx]}
              />
            </View>

            {/* Tashkeel Toggle */}
            <ToggleRow
              icon="options-outline"
              title="إظهار التشكيل"
              value={settings.tashkeel}
              onChange={(v: boolean) => setSettings({ tashkeel: v })}
            />

            {/* Dark Mode Toggle */}
            <ToggleRow
              icon="moon-outline"
              title="الوضع الليلي"
              value={settings.mode === 'dark'}
              onChange={(v: boolean) => setSettings({ mode: v ? 'dark' : 'light' })}
            />

            {/* Direct Surah Index Link Row */}
            <Pressable
              onPress={() => {
                setPanel(false);
                router.navigate('/quran');
              }}
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 11,
                borderTopWidth: 1,
                borderTopColor: BORDER_COLOR,
              }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                <Ionicons name="book-outline" size={17} color={GOLD} />
                <Text
                  style={{
                    fontFamily: FONTS.uiBold,
                    fontSize: 12.5,
                    color: isDark ? '#FFFFFF' : NAVY,
                  }}>
                  الانتقال إلى فهرس السور الكامل
                </Text>
              </View>
              <Ionicons name="chevron-back" size={15} color={MUTED_COLOR} />
            </Pressable>
          </View>
        </Reveal>
      ) : null}

      {/* ── 3. Main Reading Canvas ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(ins.bottom, 20) + 70,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Swipe gesture container: active in horizontal swipe mode */}
        <View {...(readerMode === 'swipe' ? swipe.panHandlers : {})}>
          <Reveal key={`${n}-${readerMode}-${safe}-${qs}-${settings.tashkeel}`} dy={6}>
            {/* ── Medina Mushaf Sanctuary Page Card ── */}
            <View
              style={{
                backgroundColor: CARD_BG,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(201,169,110,0.30)' : 'rgba(201,169,110,0.35)',
                paddingHorizontal: 18,
                paddingVertical: 22,
                shadowColor: '#0A1C38',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.05,
                shadowRadius: 10,
                elevation: 2,
              }}>
              <PatternBG color={GOLD} opacity={0.03} />

              {/* ── Mode A: SWIPE MODE (Paginated Mushaf Page) ── */}
              {readerMode === 'swipe' ? (
                <>
                  {/* Top Header on Page 0: Gilded Surah Banner */}
                  {safe === 0 ? (
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                      {/* Surah Cartouche Frame */}
                      <View
                        style={{
                          width: '100%',
                          backgroundColor: isDark
                            ? 'rgba(201,169,110,0.12)'
                            : 'rgba(201,169,110,0.08)',
                          borderWidth: 1,
                          borderColor: 'rgba(201,169,110,0.40)',
                          borderRadius: 16,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          alignItems: 'center',
                          gap: 4,
                        }}>
                        <Ornament width={130} color={GOLD} />
                        <Text
                          style={{
                            fontFamily: FONTS.display,
                            fontSize: 26,
                            color: isDark ? '#FFFFFF' : NAVY,
                            textAlign: 'center',
                            letterSpacing: 0.5,
                          }}>
                          سورة {m.ar}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 2,
                          }}>
                          <View
                            style={{
                              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                              borderWidth: 1,
                              borderColor: 'rgba(201,169,110,0.30)',
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                            }}>
                            <Text style={{ fontFamily: FONTS.uiMed, fontSize: 10.5, color: GOLD }}>
                              {m.place}
                            </Text>
                          </View>
                          <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11, color: MUTED_COLOR }}>
                            {ar(m.ayat)} {ayahWord(m.ayat)} · الجزء {ar(juz)} · الحزب {ar(hizb)}
                          </Text>
                        </View>
                      </View>

                      {/* Basmala Calligraphy */}
                      {n !== 1 && n !== 9 ? (
                        <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 4 }}>
                          <Text
                            style={{
                              fontFamily: FONTS.quran,
                              fontSize: qs + 4,
                              color: isDark ? '#F1F5F9' : NAVY,
                              textAlign: 'center',
                              letterSpacing: 0.5,
                            }}>
                            {BASMALA}
                          </Text>
                          <View style={{ marginTop: 8 }}>
                            <Ornament width={150} color={GOLD} />
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    /* Header on Page > 0 */
                    <View
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: 12,
                        marginBottom: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: isDark
                          ? 'rgba(201,169,110,0.20)'
                          : 'rgba(201,169,110,0.20)',
                      }}>
                      <Text style={{ fontFamily: FONTS.display, fontSize: 17, color: GOLD }}>
                        سورة {m.ar}
                      </Text>
                      <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11, color: MUTED_COLOR }}>
                        الجزء {ar(juz)} · الحزب {ar(hizb)}
                      </Text>
                      <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: GOLD }}>
                        صفحة {ar(safe + 1)}
                      </Text>
                    </View>
                  )}

                  {/* Quranic Verses for Current Page */}
                  <Text
                    style={{
                      fontFamily: FONTS.quran,
                      fontSize: qs + 2,
                      lineHeight: Math.round((qs + 2) * 2.3),
                      color: isDark ? '#F8FAFC' : '#0B1E38',
                      textAlign: 'center',
                      writingDirection: 'rtl',
                      letterSpacing: 0.2,
                    }}>
                    {(pages[safe] || []).map((i) => {
                      const isSelected = sel === i;
                      const ayahNum = i + 1;
                      const isThisAyahPlaying =
                        playingAyah === ayahNum && !!(ayahStatus && ayahStatus.playing);
                      return (
                        <Text
                          key={i}
                          onPress={() => setSel(isSelected ? null : i)}
                          style={{
                            backgroundColor: isThisAyahPlaying
                              ? isDark
                                ? 'rgba(201,169,110,0.36)'
                                : 'rgba(201,169,110,0.40)'
                              : isSelected
                                ? isDark
                                  ? 'rgba(201,169,110,0.22)'
                                  : 'rgba(201,169,110,0.25)'
                                : 'transparent',
                          }}>
                          {settings.tashkeel ? m.text[i] : stripT(m.text[i])}
                          {/* Ayah End Gilded Marker */}
                          <Text
                            style={{
                              color: isThisAyahPlaying ? '#D4A03C' : GOLD,
                              fontFamily: FONTS.quran,
                            }}>
                            {' \u06DD' + ar(ayahNum) + ' '}
                          </Text>
                        </Text>
                      );
                    })}
                  </Text>
                </>
              ) : (
                /* ── Mode B: VERTICAL MODE (Continuous Quranic Scroll) ── */
                <>
                  {/* Surah Banner */}
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View
                      style={{
                        width: '100%',
                        backgroundColor: isDark
                          ? 'rgba(201,169,110,0.12)'
                          : 'rgba(201,169,110,0.08)',
                        borderWidth: 1,
                        borderColor: 'rgba(201,169,110,0.40)',
                        borderRadius: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        alignItems: 'center',
                        gap: 4,
                      }}>
                      <Ornament width={130} color={GOLD} />
                      <Text
                        style={{
                          fontFamily: FONTS.display,
                          fontSize: 26,
                          color: isDark ? '#FFFFFF' : NAVY,
                          textAlign: 'center',
                          letterSpacing: 0.5,
                        }}>
                        سورة {m.ar}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 2,
                        }}>
                        <View
                          style={{
                            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: 'rgba(201,169,110,0.30)',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}>
                          <Text style={{ fontFamily: FONTS.uiMed, fontSize: 10.5, color: GOLD }}>
                            {m.place}
                          </Text>
                        </View>
                        <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11, color: MUTED_COLOR }}>
                          {ar(m.ayat)} {ayahWord(m.ayat)} · الجزء {ar(juz)} · الحزب {ar(hizb)}
                        </Text>
                      </View>
                    </View>

                    {/* Basmala Calligraphy */}
                    {n !== 1 && n !== 9 ? (
                      <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 4 }}>
                        <Text
                          style={{
                            fontFamily: FONTS.quran,
                            fontSize: qs + 4,
                            color: isDark ? '#F1F5F9' : NAVY,
                            textAlign: 'center',
                            letterSpacing: 0.5,
                          }}>
                          {BASMALA}
                        </Text>
                        <View style={{ marginTop: 8 }}>
                          <Ornament width={150} color={GOLD} />
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* All Ayahs in Continuous Flow */}
                  <Text
                    style={{
                      fontFamily: FONTS.quran,
                      fontSize: qs + 2,
                      lineHeight: Math.round((qs + 2) * 2.3),
                      color: isDark ? '#F8FAFC' : '#0B1E38',
                      textAlign: 'center',
                      writingDirection: 'rtl',
                      letterSpacing: 0.2,
                    }}>
                    {m.text.map((t, i) => {
                      const isSelected = sel === i;
                      const ayahNum = i + 1;
                      const isThisAyahPlaying =
                        playingAyah === ayahNum && !!(ayahStatus && ayahStatus.playing);
                      return (
                        <Text
                          key={i}
                          onPress={() => setSel(isSelected ? null : i)}
                          style={{
                            backgroundColor: isThisAyahPlaying
                              ? isDark
                                ? 'rgba(201,169,110,0.36)'
                                : 'rgba(201,169,110,0.40)'
                              : isSelected
                                ? isDark
                                  ? 'rgba(201,169,110,0.22)'
                                  : 'rgba(201,169,110,0.25)'
                                : 'transparent',
                          }}>
                          {settings.tashkeel ? t : stripT(t)}
                          {/* Ayah End Gilded Marker */}
                          <Text
                            style={{
                              color: isThisAyahPlaying ? '#D4A03C' : GOLD,
                              fontFamily: FONTS.quran,
                            }}>
                            {' \u06DD' + ar(ayahNum) + ' '}
                          </Text>
                        </Text>
                      );
                    })}
                  </Text>
                </>
              )}
            </View>
          </Reveal>
        </View>

        {/* ── 4. Page Navigation Controls (for Swipe Mode) ── */}
        {readerMode === 'swipe' ? (
          <View
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 14,
              paddingHorizontal: 4,
            }}>
            {/* Previous Page */}
            <Pressable
              onPress={() => go(-1)}
              disabled={safe === 0}
              style={({ pressed }) => ({
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                height: 38,
                borderRadius: 11,
                backgroundColor: pressed ? '#F4F1EB' : CARD_BG,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                opacity: safe === 0 ? 0.35 : 1,
              })}>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#CBD5E1' : NAVY} />
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: isDark ? '#CBD5E1' : NAVY }}>
                الصفحة السابقة
              </Text>
            </Pressable>

            {/* Page Pill */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(201,169,110,0.15)' : '#FAF5EB',
                borderWidth: 1,
                borderColor: 'rgba(201,169,110,0.40)',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 5,
              }}>
              <Text style={{ fontFamily: FONTS.uiBold, fontSize: 11, color: isDark ? '#FFFFFF' : '#8A6020' }}>
                صفحة {ar(safe + 1)} من {ar(count)}
              </Text>
            </View>

            {/* Next Page */}
            <Pressable
              onPress={() => go(1)}
              disabled={safe >= count - 1}
              style={({ pressed }) => ({
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                height: 38,
                borderRadius: 11,
                backgroundColor: pressed ? '#F4F1EB' : CARD_BG,
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                opacity: safe >= count - 1 ? 0.35 : 1,
              })}>
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: isDark ? '#CBD5E1' : NAVY }}>
                الصفحة التالية
              </Text>
              <Ionicons name="chevron-back" size={16} color={isDark ? '#CBD5E1' : NAVY} />
            </Pressable>
          </View>
        ) : null}

        {/* ── 5. Continuous Reading Invitation & Return to Surahs Index ── */}
        {(readerMode === 'vertical' || safe === count - 1) ? (
          <Reveal delay={120}>
            <View
              style={{
                marginTop: 20,
                backgroundColor: isDark ? '#071224' : '#0A1C38',
                borderRadius: 20,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(201,169,110,0.35)',
                padding: 18,
                shadowColor: '#0A1C38',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3,
              }}>
              <PatternBG color={GOLD} opacity={0.06} />

              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: 'rgba(201,169,110,0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(201,169,110,0.40)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="sparkles" size={20} color={GOLD} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: 19,
                      color: '#FFFFFF',
                      textAlign: 'right',
                    }}>
                    {n === 114
                      ? 'مبارك! ختمت القرآن الكريم كاملاً 🌙'
                      : `أتممت قراءة سورة ${m.ar} بحمد الله`}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.uiMed,
                      fontSize: 11.5,
                      color: '#CBD5E1',
                      textAlign: 'right',
                      marginTop: 2,
                    }}>
                    {n === 114
                      ? 'تقبّل الله طاعتكم وجعله نوراً وشفيعاً'
                      : 'واصل تلاوتك اليومية وثبّت وردك القرآني'}
                  </Text>
                </View>
              </View>

              {/* Next Surah Action Button */}
              {nextSurah ? (
                <Pressable
                  onPress={() => {
                    setSel(null);
                    router.replace('/surah/' + (n + 1));
                  }}
                  style={({ pressed }) => ({
                    marginTop: 16,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: pressed ? '#E2C792' : GOLD,
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  })}>
                  <Text style={{ fontFamily: FONTS.uiBold, fontSize: 14, color: '#071224' }}>
                    الانتقال إلى سورة {nextSurah.ar} ({nextSurah.place} · {ar(nextSurah.ayat)} آية)
                  </Text>
                  <Ionicons name="arrow-back" size={17} color="#071224" />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    setSel(null);
                    router.replace('/surah/1');
                  }}
                  style={({ pressed }) => ({
                    marginTop: 16,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: pressed ? '#E2C792' : GOLD,
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  })}>
                  <Text style={{ fontFamily: FONTS.uiBold, fontSize: 14, color: '#071224' }}>
                    البدء من سورة الفاتحة
                  </Text>
                  <Ionicons name="refresh" size={17} color="#071224" />
                </Pressable>
              )}

              {/* Return to Surah Index Button */}
              <Pressable
                onPress={() => router.navigate('/quran')}
                style={({ pressed }) => ({
                  marginTop: 10,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: pressed ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.20)',
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                })}>
                <Ionicons name="book-outline" size={16} color="#FFFFFF" />
                <Text style={{ fontFamily: FONTS.uiMed, fontSize: 13, color: '#FFFFFF' }}>
                  العودة إلى فهرس السور
                </Text>
              </Pressable>
            </View>
          </Reveal>
        ) : null}
      </ScrollView>

      {/* ── 6. Floating Ayah Action Toolbar (When Ayah is Tapped) ── */}
      {selText ? (
        <Reveal>
          <View
            style={{
              position: 'absolute',
              bottom: (pl.n === n ? 100 : 66) + ins.bottom,
              left: 16,
              right: 16,
              backgroundColor: CARD_BG,
              borderWidth: 1,
              borderColor: 'rgba(201,169,110,0.50)',
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 10,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 12,
              shadowColor: '#0A1C38',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 5,
            }}>
            {/* Ayah number pill */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(201,169,110,0.18)' : '#FAF5EB',
                borderWidth: 1,
                borderColor: 'rgba(201,169,110,0.40)',
                borderRadius: 8,
                paddingHorizontal: 9,
                paddingVertical: 4,
              }}>
              <Text style={{ fontFamily: FONTS.uiBold, fontSize: 11, color: GOLD }}>
                الآية {ar((sel || 0) + 1)}
              </Text>
            </View>

            <View style={{ flex: 1 }} />

            {/* Play/Stop Ayah Audio Button */}
            <Pressable
              hitSlop={8}
              onPress={() => sel != null && toggleAyahAudio(sel)}
              style={({ pressed }) => ({
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 5,
                backgroundColor: isAyahPlaying
                  ? GOLD
                  : pressed
                    ? isDark
                      ? 'rgba(201,169,110,0.25)'
                      : '#F2EDE2'
                    : isDark
                      ? 'rgba(201,169,110,0.14)'
                      : '#FAF5EB',
                borderWidth: 1,
                borderColor: isAyahPlaying ? GOLD : 'rgba(201,169,110,0.45)',
                borderRadius: 9,
                paddingHorizontal: 11,
                paddingVertical: 6,
              })}>
              {ayahLoading && playingAyah === (sel != null ? sel + 1 : -1) ? (
                <ActivityIndicator size={14} color={isAyahPlaying ? '#071224' : GOLD} />
              ) : (
                <Ionicons
                  name={isAyahPlaying ? 'pause' : 'volume-high-outline'}
                  size={15}
                  color={isAyahPlaying ? '#071224' : GOLD}
                />
              )}
              <Text
                style={{
                  fontFamily: FONTS.uiMed,
                  fontSize: 11.5,
                  color: isAyahPlaying ? '#071224' : isDark ? '#FFFFFF' : NAVY,
                }}>
                {isAyahPlaying ? 'إيقاف' : 'استماع'}
              </Text>
            </Pressable>

            {/* Copy */}
            <Pressable
              hitSlop={8}
              onPress={async () => {
                const ok = await copyText(
                  selText + ' ﴿' + ar((sel || 0) + 1) + '﴾ [' + m.ar + ']',
                );
                show(ok ? 'نُسخت الآية الكريمة' : 'تعذّر النسخ', ok ? 'success' : 'error');
              }}
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 5,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F8FAFC',
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                borderRadius: 9,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}>
              <Ionicons name="copy-outline" size={15} color={isDark ? '#CBD5E1' : NAVY} />
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: isDark ? '#CBD5E1' : NAVY }}>
                نسخ
              </Text>
            </Pressable>

            {/* Share */}
            <Pressable
              hitSlop={8}
              onPress={async () => {
                const r = await shareText(
                  selText + ' ﴿' + ar((sel || 0) + 1) + '﴾ [سورة ' + m.ar + ']',
                );
                if (r === 'copied') show('نُسخت الآية للمشاركة');
              }}
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 5,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F8FAFC',
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                borderRadius: 9,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}>
              <Ionicons name="share-social-outline" size={15} color={isDark ? '#CBD5E1' : NAVY} />
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: isDark ? '#CBD5E1' : NAVY }}>
                مشاركة
              </Text>
            </Pressable>

            {/* Close */}
            <Pressable
              hitSlop={8}
              onPress={() => setSel(null)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F8FAFC',
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="close" size={16} color={MUTED_COLOR} />
            </Pressable>
          </View>
        </Reveal>
      ) : null}

      {/* ── 7. Luxury Audio Player Dock (Bottom) ── */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: Math.max(ins.bottom, 12),
          borderTopWidth: 1,
          borderTopColor: BORDER_COLOR,
          backgroundColor: CARD_BG,
        }}>
        {pl.n === n ? (
          <FullPlayer onNav={(x: number) => router.replace('/surah/' + x)} />
        ) : (
          <Pressable
            onPress={() => pl.load(n)}
            style={({ pressed }) => ({
              height: 48,
              borderRadius: 14,
              backgroundColor: pressed ? '#142745' : isDark ? '#071224' : NAVY,
              borderWidth: 1,
              borderColor: 'rgba(201,169,110,0.35)',
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            })}>
            <Ionicons name="headset-outline" size={18} color={GOLD} />
            <Text style={{ fontFamily: FONTS.uiMed, fontSize: 13.5, color: '#FFFFFF' }}>
              استمع للسورة بصوت الشيخ {RECITER}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── 8. In-Reader Quick Surah Index Modal ── */}
      <Modal
        visible={indexModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIndexModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(7,18,36,0.65)',
            justifyContent: 'flex-end',
          }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setIndexModal(false)}
          />

          <View
            style={{
              backgroundColor: CARD_BG,
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              borderTopWidth: 1,
              borderTopColor: 'rgba(201,169,110,0.35)',
              maxHeight: '82%',
              paddingBottom: Math.max(ins.bottom, 16),
            }}>
            {/* Modal Header */}
            <View
              style={{
                paddingHorizontal: 18,
                paddingTop: 16,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: BORDER_COLOR,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View>
                <Text
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: 20,
                    color: isDark ? '#FFFFFF' : NAVY,
                    textAlign: 'right',
                  }}>
                  فهرس سور القرآن الكريم
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.uiMed,
                    fontSize: 11,
                    color: MUTED_COLOR,
                    textAlign: 'right',
                    marginTop: 1,
                  }}>
                  ١١٤ سورة · اضغط للانتقال المباشر
                </Text>
              </View>

              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                {/* Full Quran Screen button */}
                <Pressable
                  onPress={() => {
                    setIndexModal(false);
                    router.navigate('/quran');
                  }}
                  style={{
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: isDark ? 'rgba(201,169,110,0.18)' : '#FAF5EB',
                    borderWidth: 1,
                    borderColor: 'rgba(201,169,110,0.40)',
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}>
                  <Ionicons name="open-outline" size={14} color={GOLD} />
                  <Text style={{ fontFamily: FONTS.uiBold, fontSize: 11, color: GOLD }}>
                    الفهرس الكامل
                  </Text>
                </Pressable>

                {/* Close */}
                <Pressable
                  onPress={() => setIndexModal(false)}
                  hitSlop={8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F8FAFC',
                    borderWidth: 1,
                    borderColor: BORDER_COLOR,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="close" size={18} color={isDark ? '#CBD5E1' : NAVY} />
                </Pressable>
              </View>
            </View>

            {/* Search Input */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FAF8F5',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: BORDER_COLOR,
                  height: 42,
                  paddingHorizontal: 12,
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <Ionicons name="search-outline" size={17} color={MUTED_COLOR} />
                <TextInput
                  value={searchQ}
                  onChangeText={setSearchQ}
                  placeholder="ابحث باسم السورة أو رقمها…"
                  placeholderTextColor="#94A3B8"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    fontFamily: FONTS.uiMed,
                    fontSize: 13,
                    color: isDark ? '#FFFFFF' : NAVY,
                    textAlign: 'right',
                    paddingVertical: 0,
                  }}
                />
                {searchQ ? (
                  <Pressable onPress={() => setSearchQ('')} hitSlop={6}>
                    <Ionicons name="close-circle" size={16} color={MUTED_COLOR} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* List of 114 Surahs */}
            <FlatList
              data={filteredSurahs}
              keyExtractor={(s) => String(s.n)}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
              renderItem={({ item: s }) => {
                const isActive = s.n === n;
                const juzN = surahJuz(s.n);
                return (
                  <Pressable
                    onPress={() => {
                      setIndexModal(false);
                      setSel(null);
                      if (s.n !== n) {
                        router.replace('/surah/' + s.n);
                      }
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: isActive
                        ? isDark
                          ? 'rgba(201,169,110,0.18)'
                          : '#FAF5EB'
                        : pressed
                          ? isDark
                            ? 'rgba(255,255,255,0.04)'
                            : '#FAF8F5'
                          : 'transparent',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isActive ? 'rgba(201,169,110,0.45)' : 'transparent',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 4,
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    })}>
                    {/* Right side: Number Badge + Name */}
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: isActive ? GOLD : isDark ? 'rgba(255,255,255,0.08)' : '#F4F1EB',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Text
                          style={{
                            fontFamily: FONTS.uiBold,
                            fontSize: s.n >= 100 ? 10 : 11.5,
                            color: isActive ? '#071224' : isDark ? '#FFFFFF' : NAVY,
                          }}>
                          {ar(s.n)}
                        </Text>
                      </View>

                      <View>
                        <Text
                          style={{
                            fontFamily: FONTS.display,
                            fontSize: 16,
                            color: isActive ? GOLD : isDark ? '#FFFFFF' : NAVY,
                            textAlign: 'right',
                          }}>
                          سورة {s.ar}
                        </Text>
                        <Text
                          style={{
                            fontFamily: FONTS.uiMed,
                            fontSize: 10.5,
                            color: MUTED_COLOR,
                            textAlign: 'right',
                          }}>
                          {s.place} · {ar(s.ayat)} آية · الجزء {ar(juzN)}
                        </Text>
                      </View>
                    </View>

                    {/* Left: Active Indicator or Chevron */}
                    {isActive ? (
                      <View
                        style={{
                          backgroundColor: GOLD,
                          borderRadius: 999,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}>
                        <Text style={{ fontFamily: FONTS.uiBold, fontSize: 10, color: '#071224' }}>
                          الحالية
                        </Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-back" size={14} color="#CBD5E1" />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ScreenEmpty() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={{ padding: 16 }}>
        <Empty
          icon="cloud-offline-outline"
          title="النص غير متاح"
          desc="شغّل: npm run fetch:quran داخل مجلد المشروع لتحميل النص القرآني."
          action="العودة للسور"
          onAction={() => router.replace('/quran')}
        />
      </View>
    </View>
  );
}
