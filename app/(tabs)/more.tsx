import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FONTS, palette } from '../../src/theme';
import { useData, useSettings, useTheme, useToast } from '../../src/store';
import { ar, shareText, streak } from '../../src/util';
import { Ornament, PatternBG } from '../../src/art';
import { Btn, Reveal, Screen, Sheet } from '../../src/ui';

const FAQ = [
  { q: 'ما مصادر النصوص والتلاوة؟', a: 'نص القرآن بالرسم العثماني (رواية حفص عن عاصم) من مجمع الملك فهد لطباعة المصحف الشريف — منصة مطوري برمجيات القرآن الكريم، الإصدار 13.0، المنشور رسمياً للمطورين. الرسم على مصحف المدينة النبوية. التلاوة بصوت الشيخ مشاري العفاسي من Islamic Network. الأذكار من الموقع الرسمي لكتاب «حصن المسلم».' },
  { q: 'هل يعمل دون اتصال؟', a: 'نعم: نص القرآن كامل والأذكار والأدعية والأسماء محفوظة داخل التطبيق. التلاوة فقط تحتاج إنترنت.' },
  { q: 'كيف تعمل القبلة والمواقيت؟', a: 'القبلة اتجاه الدائرة العظمى نحو الكعبة مع بوصلة الجهاز أو وضع يدوي. المواقيت محسوبة فلكياً بست طرق وقد تختلف دقائق عن تقويم بلدك.' },
  { q: 'أين تُحفظ بياناتي؟', a: 'كل شيء محفوظ محلياً على جهازك: لا حسابات ولا خوادم ولا تتبع.' },
];

export default function More() {
  const { settings, setSettings } = useSettings();
  const dp = useMemo(() => palette('dark', settings.accent), [settings.accent]);
  const { data, upd } = useData(); const { show } = useToast(); const { p } = useTheme();
  const router = useRouter();
  const [nameOpen, setNameOpen] = useState(false); const [about, setAbout] = useState(false);
  const [nm, setNm] = useState(data.name); const [faq, setFaq] = useState(-1);
  const st = streak(data.daily);
  const favs = data.favS.length + data.favN.length + data.favA.length + data.favD.length;
  const items = [
    { i: 'home-outline', l: 'الصفحة الرئيسية', g: () => router.navigate('/') },
    { i: 'book-outline', l: 'القرآن الكريم', g: () => router.navigate('/quran') },
    { i: 'sparkles', l: 'أسماء الله الحسنى', g: () => router.push('/names') },
    { i: 'leaf-outline', l: 'الأذكار', g: () => router.navigate('/adhkar') },
    { i: 'hand-left-outline', l: 'الأدعية', g: () => router.navigate('/duas') },
    { i: 'compass-outline', l: 'القبلة ومواقيت الصلاة', g: () => router.push('/qibla') },
    { i: 'bookmark-outline', l: 'المفضلة', g: () => router.push('/favorites') },
    { i: 'settings-outline', l: 'الإعدادات', g: () => router.push('/settings') },
    { i: 'help-circle-outline', l: 'المساعدة والدعم', g: () => setAbout(true) },
  ];
  return (
    <Screen bg={dp.bg} pad={150} under={<PatternBG color="#C0C0C0" opacity={0.04} />}>
      <Reveal>
        <LinearGradient colors={[dp.n1, dp.n0]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 22, borderWidth: 1, borderColor: dp.dLine, padding: 18, alignItems: 'center', marginTop: 6 }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: dp.n2, borderWidth: 1.5, borderColor: '#C0C0C0', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={34} color="#FFFFFF" /></View>
          <Pressable onPress={() => { setNm(data.name); setNameOpen(true); }} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <Text style={{ fontFamily: FONTS.display, fontSize: 24, color: dp.onDark }}>{data.name}</Text>
            <Ionicons name="create-outline" size={16} color="#C0C0C0" />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayReg, fontSize: 15, color: '#C0C0C0', marginTop: 2 }}>اللهم بارك لنا في وقتنا</Text>
          <Ornament width={190} color="#C0C0C0" />
          <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
            {[{ v: ar(st), l: 'يوم مواظبة' }, { v: ar(favs), l: 'محفوظة' }, { v: ar(data.total.wards), l: 'ورد مكتمل' }].map((s, i) => (
              <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: dp.dLine, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 16, color: '#FFFFFF' }}>{s.v}</Text>
                <Text style={{ fontFamily: FONTS.ui, fontSize: 9.5, color: dp.onDarkF }}>{s.l}</Text>
              </View>))}
          </View>
        </LinearGradient>
      </Reveal>
      <View style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, borderWidth: 1, borderColor: dp.dLine, paddingHorizontal: 14 }}>
        {items.map((it, i) => (
          <Reveal key={it.l} delay={70 + i * 40}>
            <Pressable onPress={it.g} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: i === items.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={it.i as any} size={17} color="#FFFFFF" /></View>
              <Text style={{ flex: 1, fontFamily: FONTS.uiBold, fontSize: 14.5, color: dp.onDark, textAlign: 'right' }}>{it.l}</Text>
              <Ionicons name="chevron-back" size={15} color={dp.onDarkF} />
            </Pressable>
          </Reveal>))}
      </View>
      <Text style={{ fontFamily: FONTS.displayReg, fontSize: 17, color: '#FFFFFF', textAlign: 'center', marginTop: 20 }}>«وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ»</Text>
      <Text style={{ fontFamily: FONTS.ui, fontSize: 10, color: dp.onDarkF, textAlign: 'center', marginTop: 4 }}>القرآن والأذكار · الإصدار ١.٠.٠</Text>

      <Sheet visible={nameOpen} onClose={() => setNameOpen(false)} title="اسمك في التطبيق">
        <TextInput value={nm} onChangeText={setNm} maxLength={30} placeholder="اكتب اسمك…" placeholderTextColor={p.inkF}
          style={{ backgroundColor: p.bgSoft, borderWidth: 1, borderColor: p.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONTS.uiMed, fontSize: 15, color: p.ink, textAlign: 'right', marginBottom: 14 }} />
        <Btn label="حفظ الاسم" icon="checkmark" onPress={() => { upd((d: any) => Object.assign({}, d, { name: nm.trim() || 'مستخدم التطبيق' })); setNameOpen(false); show('حُفظ الاسم ✓'); }} />
      </Sheet>

      <Sheet visible={about} onClose={() => setAbout(false)} title="المساعدة والدعم">
        <ScrollView style={{ maxHeight: 420 }}>
          {FAQ.map((f, i) => (
            <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: p.line }}>
              <Pressable onPress={() => setFaq(faq === i ? -1 : i)} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
                <Text style={{ flex: 1, fontFamily: FONTS.uiBold, fontSize: 13.5, color: p.ink, textAlign: 'right' }}>{f.q}</Text>
                <Ionicons name={faq === i ? 'chevron-up' : 'chevron-down'} size={16} color={p.goldD} />
              </Pressable>
              {faq === i ? <Text style={{ fontFamily: FONTS.ui, fontSize: 12.5, color: p.inkS, textAlign: 'right', lineHeight: 22, paddingBottom: 12 }}>{f.a}</Text> : null}
            </View>))}
          <View style={{ gap: 8, marginTop: 14 }}>
            <Btn small icon="book-outline" label="مجمع الملك فهد — مصدر النص" onPress={() => Linking.openURL('https://qurancomplex.gov.sa')} />
            <Btn small icon="musical-notes-outline" label="Islamic Network — التلاوات" onPress={() => Linking.openURL('https://islamic.network')} />
            <Btn small icon="mail-outline" label="راسلنا" onPress={() => Linking.openURL('mailto:salam@quranadhkar.app?subject=القرآن والأذكار')} />
            <Btn small icon="share-outline" label="شارك التطبيق" onPress={async () => { const r = await shareText('تطبيق «القرآن والأذكار» — مصحف مرتّل، أذكار بعدّاد تفاعلي، وقبلة ومواقيت الصلاة 🌙'); if (r === 'copied') show('نُسخ نص المشاركة'); }} />
          </View>
        </ScrollView>
      </Sheet>
    </Screen>
  );
}