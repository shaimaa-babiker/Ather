import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../../src/theme';
import { useData, useToast } from '../../src/store';
import { ar, ayahWord, stripT } from '../../src/util';
import { SURAHS, QSOURCE, QRASM, QVERSION, type Surah, surah, surahJuz, surahHizb } from '../../src/data';
import { BookIcon, Ornament, PatternBG } from '../../src/art';
import { MOSQUE_IMAGES } from '../../assets/images';

/* ─── Serene Design Tokens (Matching Home Screen) ────────────── */
const NAVY = '#0A1C38';
const GOLD = '#C9A96E';
const BG = '#F8F9FA';
const CARD = '#FFFFFF';
const BORDER = '#E8E2D8';
const MUTED = '#78716C';

export default function Quran() {
  const { data, fav, isFav } = useData();
  const { show } = useToast();
  const router = useRouter();
  const ins = useSafeAreaInsets();

  const [tab, setTab] = useState<'all' | 'fav'>('all');
  const [q, setQ] = useState('');
  const [pl, setPl] = useState<'all' | 'm' | 'd'>('all');

  const last = data.last && surah(data.last.s);

  // Filtered surah list
  const list = useMemo(() => {
    let l = tab === 'fav' ? SURAHS.filter((s) => data.favS.indexOf(s.n) >= 0) : SURAHS;
    if (pl !== 'all') l = l.filter((s) => s.place === (pl === 'm' ? 'مكية' : 'مدنية'));
    const x = stripT(q.trim().toLowerCase());
    if (x) {
      l = l.filter((s) => {
        const j = surahJuz(s.n);
        const h = surahHizb(s.n);
        return (
          stripT(s.ar).indexOf(x) >= 0 ||
          s.en.toLowerCase().indexOf(x) >= 0 ||
          String(s.n) === x ||
          `جزء ${j}`.indexOf(x) >= 0 ||
          `الجزء ${j}`.indexOf(x) >= 0 ||
          `حزب ${h}`.indexOf(x) >= 0 ||
          `الحزب ${h}`.indexOf(x) >= 0
        );
      });
    }
    return l;
  }, [tab, q, pl, data.favS]);

  const toggle = (s: Surah) => {
    const r = fav('S', s.n);
    show(
      r ? 'أُزيلت سورة ' + s.ar + ' من المفضلة' : 'حُفظت سورة ' + s.ar + ' في المفضلة ⭐',
      r ? 'info' : 'success',
      { label: 'تراجع', onPress: () => fav('S', s.n) },
    );
  };

  /* ── 1. Surah Row Card Component ── */
  const renderSurah = ({ item: s }: { item: Surah }) => {
    const isSaved = isFav('S', s.n);
    const isMakki = s.place === 'مكية';
    const juz = surahJuz(s.n);
    const hizb = surahHizb(s.n);
    const ayatCount = s.ayat || (s.text ? s.text.length : 0);

    return (
      <Pressable
        onPress={() => router.push('/surah/' + s.n)}
        onLongPress={() => toggle(s)}
        delayLongPress={350}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#FAF8F5' : CARD,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: isSaved ? 'rgba(201,169,110,0.45)' : BORDER,
          paddingHorizontal: 14,
          paddingVertical: 13,
          marginBottom: 8,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          gap: 12,
        })}>

        {/* ── Elegant Surah Number Badge ── */}
        <View style={{ width: 42, alignItems: 'center', justifyContent: 'center' }}>
          {/* Thin gold diamond frame */}
          <View
            style={{
              width: 36,
              height: 36,
              transform: [{ rotate: '45deg' }],
              borderWidth: 1,
              borderColor: 'rgba(201,169,110,0.60)',
              backgroundColor: isSaved ? 'rgba(201,169,110,0.08)' : 'rgba(201,169,110,0.05)',
              borderRadius: 7,
            }}
          />
          {/* Number centered over diamond */}
          <Text
            style={{
              position: 'absolute',
              fontFamily: FONTS.uiBold,
              fontSize: s.n >= 100 ? 11 : 13,
              color: GOLD,
              textAlign: 'center',
            }}>
            {ar(s.n)}
          </Text>
        </View>

        {/* ── Surah Name + Meta ── */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 18,
              color: NAVY,
              textAlign: 'right',
              letterSpacing: 0.2,
            }}>
            سورة {s.ar}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.uiMed,
              fontSize: 11.5,
              color: MUTED,
              textAlign: 'right',
              marginTop: 3,
            }}>
            {ar(ayatCount)} {ayahWord(ayatCount)} · الجزء {ar(juz)} · الحزب {ar(hizb)}
          </Text>
        </View>

        {/* ── Right side: Revelation badge + Bookmark + Chevron ── */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              backgroundColor: isMakki ? 'rgba(201,169,110,0.08)' : 'rgba(10,28,56,0.06)',
              borderWidth: 1,
              borderColor: isMakki ? 'rgba(201,169,110,0.30)' : 'rgba(10,28,56,0.14)',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}>
            <Text
              style={{
                fontFamily: FONTS.uiMed,
                fontSize: 10.5,
                color: isMakki ? '#8A6020' : NAVY,
              }}>
              {s.place}
            </Text>
          </View>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              toggle(s);
            }}
            hitSlop={8}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: isSaved ? 'rgba(201,169,110,0.10)' : 'transparent',
              borderWidth: 1,
              borderColor: isSaved ? 'rgba(201,169,110,0.40)' : 'rgba(0,0,0,0)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={15}
              color={isSaved ? GOLD : MUTED}
            />
          </Pressable>

          <Ionicons name="chevron-back" size={14} color="#C8D0DC" />
        </View>
      </Pressable>
    );
  };

  /* ── 2. Header and Controls in ListHeaderComponent ── */
  const renderListHeader = () => (
    <View style={{ gap: 14, marginBottom: 14 }}>
      {/* ── Serene Symmetrical Top Header (Matching Home Screen) ── */}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 6,
        }}>
        {/* Navigation / Drawer button */}
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
              fontSize: 22,
              color: NAVY,
              letterSpacing: 0.3,
            }}>
            القرآن الكريم
          </Text>
          <Text
            style={{
              fontFamily: FONTS.uiMed,
              fontSize: 12,
              color: MUTED,
              marginTop: 2,
            }}>
            ١١٤ سورة · رسم عثماني
          </Text>
        </View>

        {/* Favorites shortcut toggle */}
        <Pressable
          onPress={() => setTab(tab === 'fav' ? 'all' : 'fav')}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: tab === 'fav' ? '#FAF5EB' : CARD,
            borderWidth: 1,
            borderColor: tab === 'fav' ? GOLD : BORDER,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons
            name={tab === 'fav' ? 'bookmark' : 'bookmark-outline'}
            size={19}
            color={tab === 'fav' ? GOLD : NAVY}
          />
          {data.favS.length > 0 && tab !== 'fav' ? (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: GOLD,
              }}
            />
          ) : null}
        </Pressable>
      </View>

      {/* ── The Quran Sanctuary Hero Card (Signature Home Component) ── */}
      <Pressable
        onPress={() =>
          router.push(data.last ? `/surah/${data.last.s}?p=${data.last.page}` : '/surah/18')
        }
        style={{
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(201,169,110,0.32)',
          backgroundColor: '#071224',
        }}>
        <Image
          source={MOSQUE_IMAGES.heroQuran}
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
        {/* Gradient overlay */}
        <LinearGradient
          colors={['rgba(7,18,36,0.68)', 'rgba(7,18,36,0.18)', 'rgba(7,18,36,0.88)']}
          locations={[0, 0.42, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {/* Subtle Golden Islamic Pattern */}
        <PatternBG color="#C9A96E" opacity={0.06} />

        <View style={{ height: 180, justifyContent: 'space-between', padding: 18 }}>
          {/* Card Top Row: Medallion + Title + Total Pill */}
          <View
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
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
                    fontSize: 22,
                    color: '#FFFFFF',
                    textAlign: 'right',
                  }}>
                  كتاب الله الكريم
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.uiMed,
                    fontSize: 11.5,
                    color: '#CBD5E1',
                    textAlign: 'right',
                    marginTop: 2,
                  }}>
                  هدى ونور وبيان للعالمين
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(7,18,36,0.75)',
                borderWidth: 1,
                borderColor: 'rgba(201,169,110,0.35)',
                borderRadius: 999,
                paddingHorizontal: 11,
                paddingVertical: 5,
              }}>
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11, color: '#FFFFFF' }}>
                ١١٤ سورة
              </Text>
            </View>
          </View>

          {/* Card Bottom Row: Continue Reading Pill */}
          <View
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 7,
                backgroundColor: 'rgba(7,18,36,0.78)',
                borderWidth: 1,
                borderColor: 'rgba(201,169,110,0.30)',
                borderRadius: 999,
                paddingHorizontal: 13,
                paddingVertical: 6,
              }}>
              <Ionicons name="play-circle" size={16} color={GOLD} />
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: '#FFFFFF' }}>
                {last ? `${last.ar} · ص ${ar(data.last.page + 1)}` : 'سورة الكهف · ص ٢٩٣'}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
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

      {/* ── Segmented Tabs: All Surahs / Favorites ── */}
      <View
        style={{
          backgroundColor: CARD,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: BORDER,
          padding: 4,
          flexDirection: 'row-reverse',
        }}>
        <Pressable
          onPress={() => setTab('all')}
          style={{
            flex: 1,
            paddingVertical: 9,
            alignItems: 'center',
            borderRadius: 11,
            backgroundColor: tab === 'all' ? NAVY : 'transparent',
          }}>
          <Text
            style={{
              fontFamily: FONTS.uiMed,
              fontSize: 13,
              color: tab === 'all' ? '#FFFFFF' : MUTED,
            }}>
            جميع السور ({ar(114)})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab('fav')}
          style={{
            flex: 1,
            paddingVertical: 9,
            alignItems: 'center',
            borderRadius: 11,
            backgroundColor: tab === 'fav' ? NAVY : 'transparent',
          }}>
          <Text
            style={{
              fontFamily: FONTS.uiMed,
              fontSize: 13,
              color: tab === 'fav' ? '#FFFFFF' : MUTED,
            }}>
            المفضلة ({ar(data.favS.length)})
          </Text>
        </Pressable>
      </View>

      {/* ── Serene Search Bar ── */}
      <View
        style={{
          backgroundColor: CARD,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: BORDER,
          height: 46,
          paddingHorizontal: 14,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          gap: 10,
        }}>
        <Ionicons name="search-outline" size={18} color={MUTED} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="ابحث باسم السورة أو رقمها…"
          placeholderTextColor="#94A3B8"
          autoCorrect={false}
          style={{
            flex: 1,
            fontFamily: FONTS.uiMed,
            fontSize: 13.5,
            color: NAVY,
            textAlign: 'right',
            paddingVertical: 0,
          }}
        />
        {q ? (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={MUTED} />
          </Pressable>
        ) : null}
      </View>

      {/* ── Revelation Filter Chips (Makkiyah / Madaniyah) ── */}
      {tab === 'all' ? (
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View style={{ flexDirection: 'row-reverse', gap: 8, alignItems: 'center' }}>
            {[
              { key: 'all', label: 'الكل' },
              { key: 'm', label: 'مكية (٨٦)' },
              { key: 'd', label: 'مدنية (٢٨)' },
            ].map((chip) => {
              const active = pl === chip.key;
              return (
                <Pressable
                  key={chip.key}
                  onPress={() => setPl(chip.key as any)}
                  style={{
                    paddingHorizontal: 13,
                    height: 32,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: active ? NAVY : BORDER,
                    backgroundColor: active ? NAVY : CARD,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontFamily: FONTS.uiMed,
                      fontSize: 11.5,
                      color: active ? '#FFFFFF' : MUTED,
                    }}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11, color: MUTED }}>
            {ar(list.length)} سورة
          </Text>
        </View>
      ) : null}
    </View>
  );

  /* ── 3. Empty State ── */
  const renderEmpty = () => (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 20,
        paddingVertical: 28,
        alignItems: 'center',
        gap: 12,
        marginTop: 10,
      }}>
      <Ornament width={140} color={GOLD} />
      <Text
        style={{
          fontFamily: FONTS.display,
          fontSize: 19,
          color: NAVY,
          textAlign: 'center',
        }}>
        {tab === 'fav' ? 'لا توجد سور في المفضلة' : 'لم نجد سورة مطابقة للبحث'}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.uiMed,
          fontSize: 12,
          color: MUTED,
          textAlign: 'center',
          lineHeight: 18,
          maxWidth: 240,
        }}>
        {tab === 'fav'
          ? 'اضغط على رمز الإشارة المرجعية أو اضغط مطولاً على أي سورة لإضافتها هنا.'
          : 'تأكد من كتابة الاسم بصورة صحيحة أو ابحث برقم السورة.'}
      </Text>
      {tab === 'fav' ? (
        <Pressable
          onPress={() => setTab('all')}
          style={{
            backgroundColor: NAVY,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginTop: 4,
          }}>
          <Text style={{ fontFamily: FONTS.uiMed, fontSize: 12.5, color: '#FFFFFF' }}>
            تصفح جميع السور
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  const renderFooter = () => (
    <Pressable
      onPress={() => Linking.openURL('https://qurancomplex.gov.sa').catch(() => {})}
      style={{
        marginTop: 14,
        padding: 14,
        borderRadius: 16,
        backgroundColor: CARD,
        borderWidth: 1,
        borderColor: BORDER,
        gap: 5,
      }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 7 }}>
        <Ionicons name="shield-checkmark-outline" size={14} color={GOLD} />
        <Text style={{ flex: 1, fontFamily: FONTS.uiBold, fontSize: 11.5, color: NAVY }}>
          النص والمصدر
        </Text>
        <Ionicons name="open-outline" size={12} color={MUTED} />
      </View>
      <Text
        style={{
          fontFamily: FONTS.ui,
          fontSize: 10.5,
          lineHeight: 18,
          color: MUTED,
          textAlign: 'right',
        }}>
        {QSOURCE || 'مجمع الملك فهد لطباعة المصحف الشريف'}
        {QVERSION ? ` — الإصدار ${QVERSION}` : ''}
        {'\n'}مرجع الرسم: {QRASM} — المدينة المنورة.
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: ins.top + 6, paddingHorizontal: 16 }}>
      <FlatList
        data={list}
        keyExtractor={(s) => String(s.n)}
        renderItem={renderSurah}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        initialNumToRender={14}
        maxToRenderPerBatch={16}
        windowSize={11}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(ins.bottom, 24) + 80,
        }}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}
