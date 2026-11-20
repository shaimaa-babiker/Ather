import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FONTS } from '../src/theme';
import { useData, useToast } from '../src/store';
import { ar, copyText, shareText, stripT } from '../src/util';
import { NAMES } from '../src/data';
import { Ornament, PatternBG, StarMedallion } from '../src/art';
import { Empty, Sheet } from '../src/ui';
import { MOSQUE_IMAGES } from '../assets/images';

/* ─── Design tokens ─────────────────────────────────────────── */
const NAV = '#0E1E38';   // deep navy
const GOLD = '#C9A96E';   // warm antique gold — replaces all yellow
const BG = '#F7F5F0';   // warm parchment
const PAPER = '#FFFFFF';
const BORDER = '#E8E2D8';   // warm border
const MUTED = '#78716C';   // warm muted text
const ACCENT = 'rgba(201,169,110,0.18)'; // gold tint

export default function Names() {
  const { data, fav, isFav } = useData();
  const { show } = useToast();
  const router = useRouter();
  const ins = useSafeAreaInsets();

  const [q, setQ] = useState('');
  const [fo, setFo] = useState(false);
  const [open, setOpen] = useState(0);

  const list = useMemo(() => {
    let l = fo ? NAMES.filter((x) => data.favN.indexOf(x.id) >= 0) : NAMES;
    const s = stripT(q.trim().toLowerCase());
    if (s) {
      l = l.filter(
        (x) =>
          stripT(x.ar).indexOf(s) >= 0 ||
          x.tr.toLowerCase().indexOf(s) >= 0 ||
          x.mean.indexOf(q.trim()) >= 0,
      );
    }
    return l;
  }, [q, fo, data.favN]);

  const cur = open ? NAMES[open - 1] : null;

  const toggle = (id: number) => {
    const r = fav('N', id);
    show(r ? 'أُزيل من المفضلة' : 'حُفظ الاسم في المفضلة ♥', r ? 'info' : 'success', {
      label: 'تراجع',
      onPress: () => fav('N', id),
    });
  };

  return (
      <View style={{ flex: 1, backgroundColor: BG }}>

        {/* ── Status bar spacer ── */}
        <View style={{ height: ins.top + 6 }} />

        {/* ── Navigation Header ── */}
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingBottom: 10,
          }}>
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: PAPER,
              borderWidth: 1,
              borderColor: BORDER,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="chevron-forward" size={18} color={NAV} />
          </Pressable>

          {/* Title */}
            <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: NAV, letterSpacing: 0.3 }}>
              أسماء الله الحسنى
            </Text>

            {/* Random Shuffle */}
            <Pressable
              onPress={() => setOpen(1 + Math.floor(Math.random() * 99))}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: PAPER,
                borderWidth: 1,
                borderColor: BORDER,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="shuffle" size={17} color={NAV} />
            </Pressable>
        </View>

        {/* ── Main List ── */}
        <FlatList
          data={list}
          keyExtractor={(x) => String(x.id)}
          initialNumToRender={14}
          windowSize={9}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 140 }}
          ListHeaderComponent={
              <View style={{ gap: 12, marginBottom: 12 }}>

                {/* ── Segmented Filter Toggle ── */}
                <View
                  style={{
                    backgroundColor: '#EDE8E0',
                    borderRadius: 14,
                    padding: 4,
                    flexDirection: 'row-reverse',
                  }}>
                  <Pressable
                    onPress={() => setFo(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderRadius: 11,
                      flexDirection: 'row-reverse',
                      justifyContent: 'center',
                      gap: 7,
                      backgroundColor: !fo ? NAV : 'transparent',
                    }}>
                      <Ionicons name="grid" size={13} color={!fo ? PAPER : MUTED} />
                      <Text style={{ fontFamily: FONTS.uiMed, fontSize: 12.5, color: !fo ? PAPER : MUTED }}>
                        كل الأسماء
                      </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setFo(true)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderRadius: 11,
                      flexDirection: 'row-reverse',
                      justifyContent: 'center',
                      gap: 7,
                      backgroundColor: fo ? NAV : 'transparent',
                    }}>
                      <Ionicons name={fo ? 'heart' : 'heart-outline'} size={13} color={fo ? '#EF4444' : MUTED} />
                      <Text style={{ fontFamily: FONTS.uiMed, fontSize: 12.5, color: fo ? PAPER : MUTED }}>
                        المفضلة ({ar(data.favN.length)})
                      </Text>
                  </Pressable>
                </View>

                {/* ── Hero Card ── */}
                {!q && (
                  <View
                    style={{
                      borderRadius: 20,
                      overflow: 'hidden',
                      height: 190,
                      borderWidth: 1,
                      borderColor: 'rgba(201,169,110,0.30)',
                      backgroundColor: '#070F1E',
                    }}>
                    {/* Mosque photo */}
                    <Image
                      source={MOSQUE_IMAGES.night}
                      blurRadius={3}
                      style={{ position: 'absolute', width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />

                    {/* Deep gradient overlay */}
                    <LinearGradient
                      colors={['rgba(0,0,0,0.05)', 'rgba(5,12,30,0.55)', 'rgba(5,12,30,0.92)']}
                      locations={[0, 0.4, 1]}
                      style={{ position: 'absolute', width: '100%', height: '100%' }}
                    />

                      {/* Geometric SVG pattern overlay */}
                      <PatternBG color="#C9A96E" opacity={0.06} />

                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 10 }}>
                        {/* Gold ornament above */}
                        <Ornament width={200} color={GOLD} />

                        {/* Quranic verse */}
                        <Text
                          style={{
                            fontFamily: FONTS.display,
                            fontSize: 20,
                            color: '#FFFFFF',
                            textAlign: 'center',
                            lineHeight: 34,
                          }}>
                          وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا
                        </Text>

                        {/* Gold ornament below */}
                        <Ornament width={200} color={GOLD} />

                        {/* Surah reference */}
                        <Text style={{ fontFamily: FONTS.ui, fontSize: 11, color: GOLD, letterSpacing: 0.5 }}>
                          الأعراف · ١٨٠
                        </Text>
                      </View>
                    </View>
            )}

                    {/* ── Section divider ── */}
                    <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                      <Ornament width={220} color={GOLD} />
                    </View>

                    {/* ── Search Bar ── */}
                    <View
                      style={{
                        backgroundColor: PAPER,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: BORDER,
                        height: 46,
                        paddingHorizontal: 14,
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                      <Ionicons name="search-outline" size={18} color="#A8A29E" />
                      <TextInput
                        value={q}
                        onChangeText={setQ}
                        placeholder="ابحث عن اسم أو معناه..."
                        placeholderTextColor="#A8A29E"
                        style={{
                          flex: 1,
                          fontFamily: FONTS.ui,
                          fontSize: 13,
                          color: '#1C1917',
                          textAlign: 'right',
                          paddingVertical: 0,
                        }}
                      />
                      {q ? (
                        <Pressable onPress={() => setQ('')} hitSlop={8}>
                          <Ionicons name="close-circle" size={18} color="#A8A29E" />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
        }
                renderItem={({ item }) => {
                  const favorited = isFav('N', item.id);
                  return (
                    <Pressable
                      onPress={() => setOpen(item.id)}
                      style={({ pressed }) => ({
                        backgroundColor: pressed
                            ? '#F0EDE6'
                            : favorited
                    ? '#FEFBF3'
                        : PAPER,
                        borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 11,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderLeftWidth: 3,
                borderColor: favorited ? 'rgba(201,169,110,0.35)' : BORDER,
                borderLeftColor: favorited ? GOLD : NAV,
                marginBottom: 8,
              })}>

                {/* Right: Star Medallion number badge + Name info */}
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 }}>
                  {/* Islamic geometric number badge */}
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: favorited ? ACCENT : '#F4F1EB',
                    }}>
                    <StarMedallion
                      n={item.id}
                      size={42}
                      color={favorited ? GOLD : NAV}
                      textColor={favorited ? GOLD : NAV}
                    />
                  </View>

                  {/* Name + transliteration + meaning */}
                  <View style={{ alignItems: 'flex-end', flex: 1 }}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: '#1C1917', lineHeight: 32 }}>
                            {item.ar}
                          </Text>
                          <View
                            style={{
                              backgroundColor: '#F4F1EB',
                              borderRadius: 5,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderWidth: 1,
                              borderColor: '#E8E2D8',
                            }}>
                              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 9.5, color: '#78716C' }}>
                                {item.tr}
                              </Text>
                          </View>
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: FONTS.ui,
                            fontSize: 11.5,
                            color: MUTED,
                            textAlign: 'right',
                            marginTop: 1,
                          }}>
                          {item.mean}
                        </Text>
                    </View>
                  </View>

                    {/* Left: heart + chevron */}
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginRight: 8 }}>
                      <Pressable
                        onPress={() => toggle(item.id)}
                        hitSlop={8}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: favorited ? '#FEF3C7' : '#F4F1EB',
                          borderWidth: 1,
                          borderColor: favorited ? '#FDE68A' : BORDER,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Ionicons
                          name={favorited ? 'heart' : 'heart-outline'}
                          size={14}
                          color={favorited ? '#EF4444' : '#A8A29E'}
                        />
                      </Pressable>
                      <Ionicons name="chevron-back" size={13} color="#C4BAB0" />
                    </View>
                  </Pressable>
                  );
        }}
                  ListEmptyComponent={
                    <Empty
                      icon="heart-outline"
                      title="لا توجد نتائج"
                      desc="جرّب البحث بالاسم العربي أو المعنى أو النطق اللاتيني."
                    />
                  }
                  ListFooterComponent={
                    <View
                      style={{
                        backgroundColor: NAV,
                        borderRadius: 16,
                        paddingHorizontal: 22,
                        paddingVertical: 22,
                        alignItems: 'center',
                        marginTop: 8,
                        gap: 12,
                        borderWidth: 1,
                        borderColor: '#1E3558',
                        overflow: 'hidden',
                      }}>
                      {/* Subtle geometric pattern in footer */}
                      <PatternBG color="#C9A96E" opacity={0.07} />
                      <Ornament width={180} color={GOLD} />
                      <Text
                        style={{
                          fontFamily: FONTS.display,
                          fontSize: 17,
                          color: '#F5F0E8',
                          textAlign: 'center',
                          lineHeight: 30,
                        }}>
                        « إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ »
                      </Text>
                        <Ornament width={180} color={GOLD} />
                        <Text style={{ fontFamily: FONTS.ui, fontSize: 11, color: GOLD, textAlign: 'center' }}>
                          متفق عليه
                        </Text>
                    </View>
                  }
      />

                  {/* ── Name Detail Sheet ── */}
                  <Sheet visible={!!cur} onClose={() => setOpen(0)} title={cur ? `الاسم ${ar(cur.id)} من ٩٩` : ''}>
                    {cur ? (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

                          {/* ── Detail Hero Card ── */}
                          <View
                            style={{
                              borderRadius: 20,
                              overflow: 'hidden',
                              borderWidth: 1,
                              borderColor: 'rgba(201,169,110,0.35)',
                              backgroundColor: NAV,
                            }}>
                            <PatternBG color="#C9A96E" opacity={0.08} />
                            <View
                              style={{
                                alignItems: 'center',
                                paddingTop: 28,
                                paddingBottom: 24,
                                paddingHorizontal: 20,
                                gap: 10,
                              }}>
                              {/* Star medallion with number */}
                              <StarMedallion n={cur.id} size={52} color={GOLD} textColor={GOLD} />

                              {/* Gold ornament divider */}
                              <Ornament width={160} color={GOLD} />

                              {/* Arabic name */}
                              <Text
                                style={{
                                  fontFamily: FONTS.display,
                                  fontSize: 44,
                                  color: '#FFFFFF',
                                  textAlign: 'center',
                                  lineHeight: 60,
                                  letterSpacing: 1,
                                }}>
                                {cur.ar}
                              </Text>

                              {/* Transliteration */}
                              <Text
                                style={{
                                  fontFamily: FONTS.uiMed,
                                  fontSize: 13,
                                  color: GOLD,
                                  letterSpacing: 1.5,
                                  textAlign: 'center',
                                }}>
                                {cur.tr}
                              </Text>
                            </View>
                          </View>

                          {/* ── Meaning ── */}
                          <View
                            style={{
                              backgroundColor: PAPER,
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: BORDER,
                              paddingHorizontal: 20,
                              paddingVertical: 18,
                              marginTop: 14,
                              alignItems: 'center',
                              gap: 10,
                            }}>
                            <Ornament width={140} color={GOLD} />
                            <Text
                              style={{
                                fontFamily: FONTS.ui,
                                fontSize: 15.5,
                                lineHeight: 28,
                                color: '#292524',
                                textAlign: 'center',
                              }}>
                              {cur.mean}
                            </Text>
                          </View>

                          {/* ── Add to Favorites ── */}
                          <Pressable
                            onPress={() => toggle(cur.id)}
                            style={{
                              backgroundColor: isFav('N', cur.id) ? '#FEFBF3' : NAV,
                              borderWidth: 1,
                              borderColor: isFav('N', cur.id) ? GOLD : NAV,
                              borderRadius: 12,
                              height: 46,
                              paddingHorizontal: 16,
                              flexDirection: 'row-reverse',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              marginTop: 14,
                            }}>
                            <Ionicons
                              name={isFav('N', cur.id) ? 'heart' : 'heart-outline'}
                              size={17}
                              color={isFav('N', cur.id) ? '#EF4444' : PAPER}
                            />
                            <Text
                              numberOfLines={1}
                              style={{
                                fontFamily: FONTS.uiMed,
                                fontSize: 13.5,
                                color: isFav('N', cur.id) ? '#92400E' : PAPER,
                                textAlign: 'center',
                              }}>
                              {isFav('N', cur.id) ? 'في المفضلة' : 'أضف إلى المفضلة'}
                            </Text>
                          </Pressable>

                          {/* ── Copy & Share ── */}
                          <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 10 }}>
                            <Pressable
                              onPress={async () => {
                                const ok = await copyText(cur.ar + ' — ' + cur.mean);
                                show(ok ? 'نُسخ الاسم' : 'تعذّر النسخ', ok ? 'success' : 'error');
                              }}
                              style={{
                                flex: 1,
                                height: 42,
                                borderRadius: 12,
                                backgroundColor: '#F4F1EB',
                                borderWidth: 1,
                                borderColor: BORDER,
                                flexDirection: 'row-reverse',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                              }}>
                                <Ionicons name="copy-outline" size={15} color={NAV} />
                                <Text numberOfLines={1} style={{ fontFamily: FONTS.uiMed, fontSize: 13, color: NAV }}>
                                  نسخ
                                </Text>
                            </Pressable>

                            <Pressable
                              onPress={async () => {
                                const r = await shareText(
                                  cur.ar + ' — ' + cur.mean + '\n\nمن أسماء الله الحسنى · تطبيق القرآن والأذكار',
                                );
                                if (r === 'copied') show('نُسخ للمشاركة');
                              }}
                              style={{
                                flex: 1,
                                height: 42,
                                borderRadius: 12,
                                backgroundColor: '#F4F1EB',
                                borderWidth: 1,
                                borderColor: BORDER,
                                flexDirection: 'row-reverse',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                              }}>
                                <Ionicons name="share-outline" size={15} color={NAV} />
                                <Text numberOfLines={1} style={{ fontFamily: FONTS.uiMed, fontSize: 13, color: NAV }}>
                                  مشاركة
                                </Text>
                            </Pressable>
                          </View>

                          {/* ── Prev / Next navigation ── */}
                          <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 10 }}>
                            <Pressable
                              onPress={() => setOpen(((cur.id - 2 + 99) % 99) + 1)}
                              style={{
                                flex: 1,
                                height: 42,
                                borderRadius: 12,
                                backgroundColor: PAPER,
                                borderWidth: 1,
                                borderColor: BORDER,
                                flexDirection: 'row-reverse',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                              }}>
                                <Ionicons name="chevron-forward" size={15} color="#78716C" />
                                <Text numberOfLines={1} style={{ fontFamily: FONTS.uiMed, fontSize: 13, color: '#78716C' }}>
                                  السابق
                                </Text>
                            </Pressable>

                            <Pressable
                              onPress={() => setOpen((cur.id % 99) + 1)}
                              style={{
                                flex: 1,
                                height: 42,
                                borderRadius: 12,
                                backgroundColor: PAPER,
                                borderWidth: 1,
                                borderColor: BORDER,
                                flexDirection: 'row-reverse',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                              }}>
                                <Ionicons name="chevron-back" size={15} color="#78716C" />
                                <Text numberOfLines={1} style={{ fontFamily: FONTS.uiMed, fontSize: 13, color: '#78716C' }}>
                                  التالي
                                </Text>
                            </Pressable>
                          </View>

                        </ScrollView>
        ) : null}
                      </Sheet>

    </View>
                );
}
