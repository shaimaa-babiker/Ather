import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../src/theme';
import { useData, useTheme, useToast } from '../../src/store';
import { copyText, shareText } from '../../src/util';
import { DUAS } from '../../src/data';
import { Badge, Btn, Empty, Header, Reveal, Screen, Search, Segmented, Sheet, Soft } from '../../src/ui';

export default function Duas() {
  const { p, dark, qs } = useTheme(); const { isFav, fav } = useData(); const { show } = useToast();
  const [cat, setCat] = useState('m'); const [q, setQ] = useState(''); const [open, setOpen] = useState('');
  const list = useMemo(() => {
    let l = DUAS.filter((d) => d.cat === cat);
    const x = q.trim(); if (x) l = l.filter((d) => d.title.indexOf(x) >= 0 || d.sub.indexOf(x) >= 0 || d.text.indexOf(x) >= 0);
    return l;
  }, [cat, q]);
  const cur = DUAS.find((d) => d.id === open);
  return (
    <Screen pad={150}>
      <Header back={false} title="أدعية يومية" sub="من الكتاب والسنة · في كل وقت وحين" />
      <View style={{ gap: 10, marginBottom: 12 }}>
        <Segmented options={[{ key: 'm', label: 'أدعية مأثورة' }, { key: 'q', label: 'أدعية قرآنية' }]} value={cat} onChange={setCat} />
        <Search value={q} onChange={setQ} placeholder="ابحث في الأدعية…" />
      </View>
      {list.map((d, i) => (
        <Reveal key={d.id} delay={i * 45}>
          <Pressable onPress={() => setOpen(d.id)} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, backgroundColor: p.card, borderRadius: 14, borderWidth: 1, borderColor: isFav('D', d.id) ? p.gold + '77' : p.line, paddingHorizontal: 12, paddingVertical: 13, marginBottom: 8 }}>
            <Badge icon={d.icon} bg={dark ? p.goldBg : undefined} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.uiBold, fontSize: 15, color: p.ink, textAlign: 'right' }}>{d.title}</Text>
              <Text style={{ fontFamily: FONTS.ui, fontSize: 11.5, color: p.inkF, textAlign: 'right' }}>{d.sub} · {d.ref}</Text>
            </View>
            <Ionicons name={isFav('D', d.id) ? 'heart' : 'chevron-back'} size={15} color={isFav('D', d.id) ? p.gold : p.inkF} />
          </Pressable>
        </Reveal>))}
      {!list.length ? <Empty icon="search-outline" title="لا نتائج" desc="جرّب كلمة أخرى من نص الدعاء أو عنوانه." /> : null}

      <Sheet visible={!!cur} onClose={() => setOpen('')} title={cur ? cur.title : ''}>
        {cur ? <ScrollView>
          <View style={{ backgroundColor: p.paper, borderRadius: 12, borderWidth: 1, borderColor: p.frame + '66', padding: 16 }}>
            {/* الأدعية ليست نصاً قرآنياً — تُعرض بخط أميري لأن خط المصحف مقصور على رموز القرآن */}
            <Text style={{ fontFamily: FONTS.displayReg, fontSize: qs - 1, lineHeight: (qs - 1) * 2.1, color: p.paperInk, textAlign: 'center', writingDirection: 'rtl' }}>{cur.text}</Text>
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <View style={{ backgroundColor: p.goldBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ fontFamily: FONTS.uiBold, fontSize: 11, color: p.goldD }}>{cur.ref}</Text></View>
            </View>
          </View>
          <View style={{ flexDirection: 'row-reverse', gap: 8, backgroundColor: p.infoBg, borderRadius: 12, padding: 12, marginTop: 12 }}>
            <Ionicons name="information-circle-outline" size={16} color={p.info} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, fontFamily: FONTS.ui, fontSize: 12.5, color: p.inkS, textAlign: 'right', lineHeight: 21 }}>{cur.note}</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: 14 }}>
            <Btn small style={{ flex: 1.4 }} icon={isFav('D', cur.id) ? 'heart' : 'heart-outline'} label={isFav('D', cur.id) ? 'في المفضلة' : 'أضف للمفضلة'}
              onPress={() => { const r = fav('D', cur.id); show(r ? 'أُزيل من المفضلة' : 'حُفظ الدعاء ♥', r ? 'info' : 'success', { label: 'تراجع', onPress: () => fav('D', cur.id) }); }} />
            <Soft small icon="copy-outline" label="نسخ" onPress={async () => { const ok = await copyText(cur.text + '\n\n(' + cur.ref + ')'); show(ok ? 'نُسخ الدعاء' : 'تعذّر النسخ', ok ? 'success' : 'error'); }} />
            <Soft small icon="share-outline" label="مشاركة" onPress={async () => { const r = await shareText(cur.title + '\n\n' + cur.text + '\n\n(' + cur.ref + ')'); if (r === 'copied') show('نُسخ للمشاركة'); }} />
          </View>
        </ScrollView> : null}
      </Sheet>
    </Screen>
  );
}