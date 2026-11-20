import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONTS } from '../src/theme';
import { useData, useTheme, useToast } from '../src/store';
import { ar } from '../src/util';
import { getDua, getSet, NAMES, surah } from '../src/data';
import { StarMedallion } from '../src/art';
import { Badge, Chip, Empty, Header, Reveal, Screen } from '../src/ui';

export default function Favorites() {
  const { p } = useTheme(); const { data, fav } = useData(); const { show } = useToast();
  const router = useRouter(); const [f, setF] = useState('all');
  const items = useMemo(() => {
    const l: any[] = [];
    data.favS.forEach((n: number) => { const s = surah(n); if (s) l.push({ k: 'S', id: n, t: 'سورة ' + s.ar, sub: 'القرآن · ' + ar(s.ayat) + ' آية', r: '/surah/' + n, medal: n }); });
    data.favN.forEach((n: number) => l.push({ k: 'N', id: n, t: NAMES[n - 1].ar, sub: 'أسماء الله الحسنى · ' + NAMES[n - 1].tr, r: '/names', medal: n }));
    data.favA.forEach((x: string) => { const parts = x.split(':'); const s = getSet(parts[0]); const i = parseInt(parts[1], 10); if (s && s.items[i]) l.push({ k: 'A', id: x, t: s.items[i].text.slice(0, 32) + '…', sub: s.title + ' · الذكر ' + ar(i + 1), r: '/adhkar/' + parts[0] + '?i=' + i, ic: 'leaf-outline' }); });
    data.favD.forEach((x: string) => { const d = getDua(x); if (d) l.push({ k: 'D', id: x, t: d.title, sub: 'الأدعية · ' + d.ref, r: '/duas', ic: 'hand-left-outline' }); });
    return f === 'all' ? l : l.filter((x) => x.k === f);
  }, [data, f]);
  return (
    <Screen pad={60}>
      <Header title="المفضلة" sub={ar(items.length) + ' عنصراً محفوظاً'} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row-reverse', gap: 8, paddingBottom: 12 }}>
        <Chip label="الكل" active={f === 'all'} onPress={() => setF('all')} />
        <Chip label="السور" active={f === 'S'} onPress={() => setF('S')} />
        <Chip label="الأسماء" active={f === 'N'} onPress={() => setF('N')} />
        <Chip label="الأذكار" active={f === 'A'} onPress={() => setF('A')} />
        <Chip label="الأدعية" active={f === 'D'} onPress={() => setF('D')} />
      </ScrollView>
      {items.map((x, i) => (
        <Reveal key={x.k + x.id} delay={i * 35}>
          <Pressable onPress={() => router.push(x.r)} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, backgroundColor: p.card, borderRadius: 14, borderWidth: 1, borderColor: p.line, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8 }}>
            {x.medal != null ? <StarMedallion n={x.medal} size={38} color={p.gold} textColor={p.ink} /> : <Badge icon={x.ic} size={38} />}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: FONTS.uiBold, fontSize: 14, color: p.ink, textAlign: 'right' }}>{x.t}</Text>
              <Text style={{ fontFamily: FONTS.ui, fontSize: 11, color: p.inkF, textAlign: 'right' }}>{x.sub}</Text>
            </View>
            <Pressable hitSlop={8} onPress={() => { fav(x.k, x.id); show('أُزيل من المفضلة', 'info', { label: 'تراجع', onPress: () => fav(x.k, x.id) }); }}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: p.badBg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="trash-outline" size={15} color={p.bad} /></Pressable>
          </Pressable>
        </Reveal>))}
      {!items.length ? <Empty title="لا محفوظات هنا بعد" desc="احفظ السور بالضغط المطول، والأسماء والأذكار والأدعية بزر ♥." action="تصفح القرآن" onAction={() => router.navigate('/quran')} /> : null}
    </Screen>
  );
}