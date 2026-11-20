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
import { ar, dkey } from '../../src/util';
import { ALL_ADHKAR, ADHKAR, getSet } from '../../src/data';
import { BeadsIcon, Ornament, PatternBG } from '../../src/art';
import { MOSQUE_IMAGES } from '../../assets/images';

/* ─── Design Tokens ───────────────────────────────────────────── */
const NAVY   = '#0A1C38';
const GOLD   = '#C9A96E';
const BG     = '#F8F9FA';
const CARD   = '#FFFFFF';
const BORDER = '#E8E2D8';
const MUTED  = '#78716C';

const CORE_IDS = ['morning', 'evening', 'waking', 'prayer', 'sleep'];
const HERO_IMAGES: Record<string, any> = {
  morning: MOSQUE_IMAGES.dawn,
  evening: MOSQUE_IMAGES.eveningAzkar,
};

export default function Adhkar() {
  const { data } = useData();
  const { show } = useToast();
  const router   = useRouter();
  const ins      = useSafeAreaInsets();

  const [tab, setTab] = useState<'morning' | 'evening'>(
    new Date().getHours() >= 14 ? 'evening' : 'morning',
  );
  const [q, setQ] = useState('');

  const today    = data.daily[dkey(new Date())] || [];
  const heroSet  = getSet(tab);
  const heroDone = today.indexOf(tab) >= 0;

  // ── إحصاءات مشتقة من بيانات حصن المسلم المحمّلة (بعد fetch:azkar)
  const stats = useMemo(() => ({
    chapters: ALL_ADHKAR.length,
    adhkar:   ALL_ADHKAR.reduce((s, x) => s + x.items.length, 0),
  }), []);

  // ── All sets except the two hero ones, optionally filtered by search
  const otherSets = useMemo(() => {
    const base = ALL_ADHKAR.filter(s => s.id !== 'morning' && s.id !== 'evening');
    if (!q.trim()) return base;
    const qn = q.trim().toLowerCase();
    return base.filter(s =>
      s.title.includes(qn) ||
      s.tag.includes(qn) ||
      s.items.some(i => i.text.includes(qn)),
    );
  }, [q]);

  /* ── Section header ── */
  const SectionHeader = ({ label }: { label: string }) => (
    <View
      style={{
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 2,
      }}>
      <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
      <Text style={{ fontFamily: FONTS.uiBold, fontSize: 11.5, color: MUTED }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
    </View>
  );

  /* ── Azkar row card ── */
  const renderSet = ({ item: s, index }: { item: any; index: number }) => {
    const done   = today.indexOf(s.id) >= 0;
    const isCore = CORE_IDS.includes(s.id);
    return (
      <Pressable
        onPress={() => router.push('/adhkar/' + s.id)}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#FAF8F5' : CARD,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: done
            ? 'rgba(201,169,110,0.45)'
            : isCore
            ? 'rgba(10,28,56,0.12)'
            : BORDER,
          paddingHorizontal: 14,
          paddingVertical: 13,
          marginBottom: 8,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          gap: 12,
        })}>
        {/* Icon badge */}
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: done
              ? 'rgba(201,169,110,0.10)'
              : isCore
              ? 'rgba(10,28,56,0.05)'
              : '#F8FAFC',
            borderWidth: 1,
            borderColor: done
              ? 'rgba(201,169,110,0.30)'
              : isCore
              ? 'rgba(10,28,56,0.12)'
              : BORDER,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons
            name={(done ? 'checkmark-circle' : (s.icon || 'book-outline')) as any}
            size={20}
            color={done ? GOLD : NAVY}
          />
        </View>

        {/* Title + meta */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: FONTS.uiBold,
              fontSize: 15,
              color: NAVY,
              textAlign: 'right',
            }}>
            {s.title}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.ui,
              fontSize: 11,
              color: MUTED,
              textAlign: 'right',
              marginTop: 2,
            }}>
            {ar(s.items.length)} ذكر
            {s.id === 'morning' || s.id === 'evening' ? ' · مُخرَّج' : ''}
          </Text>
        </View>

        {/* Done badge or chevron */}
        {done ? (
          <View
            style={{
              backgroundColor: 'rgba(201,169,110,0.10)',
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderWidth: 1,
              borderColor: 'rgba(201,169,110,0.30)',
            }}>
            <Text style={{ fontFamily: FONTS.uiMed, fontSize: 10, color: '#8A6020' }}>
              أُتمّ ✓
            </Text>
          </View>
        ) : (
          <Ionicons name="chevron-back" size={14} color="#C8D0DC" />
        )}
      </Pressable>
    );
  };

  /* ── List structure: header + flat list ── */
  const renderHeader = () => (
    <View>
      {/* ── Top Header ── */}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 10,
          marginBottom: 16,
        }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
            alignItems: 'center', justifyContent: 'center',
          }}>
          <Ionicons name="chevron-forward" size={20} color={NAVY} />
        </Pressable>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: NAVY, letterSpacing: 0.3 }}>
            أذكار المسلم
          </Text>
          <Text style={{ fontFamily: FONTS.uiMed, fontSize: 12, color: MUTED, marginTop: 2 }}>
            {ar(stats.chapters)} باباً · {ar(stats.adhkar)} ذكراً
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/adhkar/' + (Math.random() > 0.5 ? 'morning' : 'evening'))}
          hitSlop={8}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
            alignItems: 'center', justifyContent: 'center',
          }}>
          <Ionicons name="sparkles-outline" size={19} color={NAVY} />
        </Pressable>
      </View>

      {/* ── Morning / Evening Tab ── */}
      <View
        style={{
          backgroundColor: CARD, borderRadius: 14,
          borderWidth: 1, borderColor: BORDER,
          padding: 4, flexDirection: 'row-reverse', marginBottom: 14,
        }}>
        {(['morning', 'evening'] as const).map(key => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={{
                flex: 1, paddingVertical: 9, alignItems: 'center',
                borderRadius: 11, flexDirection: 'row-reverse',
                justifyContent: 'center', gap: 7,
                backgroundColor: active ? NAVY : 'transparent',
              }}>
              <Ionicons
                name={(key === 'morning' ? 'sunny' : 'moon') as any}
                size={14}
                color={active ? '#FFFFFF' : MUTED}
              />
              <Text style={{
                fontFamily: FONTS.uiBold, fontSize: 13,
                color: active ? '#FFFFFF' : MUTED,
              }}>
                {key === 'morning' ? 'أذكار الصباح' : 'أذكار المساء'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Hero Card ── */}
      <Pressable
        onPress={() => router.push('/adhkar/' + tab)}
        style={{
          borderRadius: 22, overflow: 'hidden',
          borderWidth: 1, borderColor: 'rgba(201,169,110,0.32)',
          backgroundColor: '#071224', marginBottom: 16,
        }}>
        <Image
          source={HERO_IMAGES[tab]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(7,18,36,0.70)', 'rgba(7,18,36,0.20)', 'rgba(7,18,36,0.90)']}
          locations={[0, 0.42, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <PatternBG color="#C9A96E" opacity={0.06} />

        <View style={{ height: 190, justifyContent: 'space-between', padding: 18 }}>
          {/* Top */}
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1, borderColor: 'rgba(201,169,110,0.40)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <BeadsIcon size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={{ fontFamily: FONTS.display, fontSize: 23, color: '#FFFFFF', textAlign: 'right' }}>
                  {heroSet?.title ?? (tab === 'morning' ? 'أذكار الصباح' : 'أذكار المساء')}
                </Text>
                <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: '#CBD5E1', textAlign: 'right', marginTop: 2 }}>
                  {heroSet?.desc || (tab === 'morning' ? 'حصِّن يومك بعد الفجر' : 'حصِّن ليلتك بعد العصر')}
                </Text>
              </View>
            </View>

            <View style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: 'rgba(255,255,255,0.14)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="chevron-back" size={17} color="#FFFFFF" />
            </View>
          </View>

          {/* Bottom */}
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{
              flexDirection: 'row-reverse', alignItems: 'center', gap: 7,
              backgroundColor: heroDone ? 'rgba(201,169,110,0.22)' : 'rgba(7,18,36,0.75)',
              borderWidth: 1,
              borderColor: heroDone ? 'rgba(201,169,110,0.55)' : 'rgba(201,169,110,0.30)',
              borderRadius: 999, paddingHorizontal: 13, paddingVertical: 6,
            }}>
              <Ionicons name={heroDone ? 'checkmark-circle' : 'play-circle'} size={16} color={GOLD} />
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 11.5, color: '#FFFFFF' }}>
                {heroDone ? 'أُتمّ اليوم بحمد الله ✓' : (tab === 'morning' ? 'ابدأ أذكار الصباح' : 'ابدأ أذكار المساء')}
              </Text>
            </View>

            <View style={{
              backgroundColor: 'rgba(255,255,255,0.10)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
              borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
            }}>
              <Text style={{ fontFamily: FONTS.uiMed, fontSize: 10.5, color: '#E2E8F0' }}>
                {ar(heroSet?.items?.length ?? 0)} ذكراً · نحو {ar(heroSet?.min ?? 6)} دقائق
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      {/* ── Search ── */}
      <View
        style={{
          backgroundColor: CARD, borderRadius: 14,
          borderWidth: 1, borderColor: BORDER,
          height: 46, paddingHorizontal: 14,
          flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
        }}>
        <Ionicons name="search-outline" size={18} color={MUTED} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="ابحث في الأذكار…"
          placeholderTextColor="#94A3B8"
          autoCorrect={false}
          style={{
            flex: 1, fontFamily: FONTS.uiMed, fontSize: 13.5,
            color: NAVY, textAlign: 'right', paddingVertical: 0,
          }}
        />
        {q ? (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={MUTED} />
          </Pressable>
        ) : null}
      </View>

      {/* ── Source ── */}
      <Pressable
        onPress={() => Linking.openURL('https://www.hisnmuslim.com').catch(() => {})}
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          gap: 6,
          marginTop: 10,
          paddingHorizontal: 2,
        }}>
        <Ionicons name="shield-checkmark-outline" size={13} color={GOLD} />
        <Text
          style={{
            flex: 1,
            fontFamily: FONTS.ui,
            fontSize: 11,
            lineHeight: 17,
            color: MUTED,
            textAlign: 'right',
          }}>
          النصوص من الموقع الرسمي لكتاب «حصن المسلم» — سعيد بن علي بن وهف القحطاني
        </Text>
        <Ionicons name="open-outline" size={12} color={MUTED} />
      </Pressable>

      {/* ── Other sets section label ── */}
      <SectionHeader
        label={q ? `نتائج البحث (${ar(otherSets.length)})` : `أبواب الكتاب (${ar(otherSets.length)})`}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={{
      backgroundColor: CARD, borderRadius: 18,
      borderWidth: 1, borderColor: BORDER,
      paddingVertical: 32, paddingHorizontal: 24,
      alignItems: 'center', gap: 10, marginTop: 8,
    }}>
      <Ornament width={140} color={GOLD} />
      <Text style={{ fontFamily: FONTS.display, fontSize: 18, color: NAVY, textAlign: 'center' }}>
        لا توجد نتائج
      </Text>
      <Text style={{ fontFamily: FONTS.uiMed, fontSize: 12, color: MUTED, textAlign: 'center' }}>
        جرّب كلمة بحث مختلفة
      </Text>
    </View>
  );

  const renderFooter = () => (
    <View
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 16,
        backgroundColor: '#FAF8F5',
        borderWidth: 1,
        borderColor: BORDER,
        gap: 6,
      }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 7 }}>
        <Ionicons name="library-outline" size={15} color={GOLD} />
        <Text style={{ fontFamily: FONTS.uiBold, fontSize: 12, color: NAVY }}>
          مصدر البيانات
        </Text>
      </View>
      <Text
        style={{
          fontFamily: FONTS.ui,
          fontSize: 11,
          lineHeight: 18,
          color: MUTED,
          textAlign: 'right',
        }}>
        نصوص الأذكار وأعدادها من الموقع الرسمي لكتاب «حصن المسلم من أذكار الكتاب والسنة».
        وتخريج أذكار الصباح والمساء — أرقام الأحاديث ودرجاتها — من قاعدة بيانات
        Seen-Arabic برخصة MIT. تخريج بقية الأبواب في حواشي الكتاب المطبوع.
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: ins.top + 6, paddingHorizontal: 16 }}>
      <FlatList
        data={otherSets}
        keyExtractor={s => s.id}
        renderItem={renderSet}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={9}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(ins.bottom, 24) + 80 }}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}
