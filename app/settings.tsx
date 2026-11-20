import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ACCENTS, FLABELS, FONTS } from '../src/theme';
import { useData, useSettings, useTheme, useToast } from '../src/store';
import { ar, METHODS } from '../src/util';
import { CITIES } from '../src/data';
import { useLocation } from '../src/location';
import { Badge, Card, Confirm, Header, Reveal, Row, Screen, Section, Segmented, SelectRow, Stepper, ToggleRow } from '../src/ui';

export default function Settings() {
  const { p } = useTheme(); const { settings, setSettings } = useSettings();
  const { data, clearFavs, reset, snap, restore } = useData(); const { show } = useToast();
  const geo = useLocation();
  const [c1, setC1] = useState(false); const [c2, setC2] = useState(false);
  const city = CITIES.find((c) => c.id === settings.city) || CITIES[0];
  const geoSub = !settings.geo
    ? 'غير مفعّل — تُستخدم المدينة المختارة'
    : geo.coords
      ? (geo.coords.accuracy != null ? 'مفعّل · دقة ±' + ar(Math.round(geo.coords.accuracy)) + ' م' : 'مفعّل · تم تحديد موقعك')
      : geo.status === 'denied'
        ? 'الإذن مرفوض — اختر مدينة يدوياً'
        : geo.status === 'unavailable'
          ? 'تعذّر تحديد الموقع — اختر مدينة'
          : 'جارٍ تحديد موقعك…';
  const enableGeo = async (v: boolean) => {
    setSettings({ geo: v, geoAsked: true });
    if (!v) return;
    const c = await geo.refresh();
    if (c) show('تم تحديد موقعك ✓');
  };
  return (
    <Screen pad={60}>
      <Header title="الإعدادات" />
      <Section title="المظهر والقراءة" />
      <Reveal>
        <Card>
          <ToggleRow icon="moon-outline" title="وضع الليل" sub={settings.mode === 'dark' ? 'مفعّل — مصحف ليلي' : 'غير مفعّل'} value={settings.mode === 'dark'} onChange={(v: boolean) => setSettings({ mode: v ? 'dark' : 'light' })} />
          <SelectRow icon="color-palette-outline" label="الطابع اللوني" valueLabel={(ACCENTS.find((a) => a.key === settings.accent) || ACCENTS[0]).label}
            value={settings.accent} options={ACCENTS.map((a) => ({ key: a.key, label: a.label }))} onSelect={(k: any) => setSettings({ accent: k })} />
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.line }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
              <Badge icon="text" /><Text style={{ fontFamily: FONTS.uiBold, fontSize: 15, color: p.ink }}>حجم خط المصحف</Text>
            </View>
            <Stepper value={settings.fontIdx} min={0} max={3} onChange={(v: number) => setSettings({ fontIdx: v })} display={FLABELS[settings.fontIdx]} />
          </View>
          <ToggleRow icon="options-outline" title="إظهار التشكيل" sub="حركات النص القرآني" value={settings.tashkeel} onChange={(v: boolean) => setSettings({ tashkeel: v })} last />
        </Card>
      </Reveal>
      <Section title="التذكير والتقويم" />
      <Reveal delay={80}>
        <Card>
          <ToggleRow icon="notifications-outline" title="تذكير الأذكار" sub="بطاقة الورد في الرئيسية" value={settings.reminders} onChange={(v: boolean) => setSettings({ reminders: v })} />
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.line }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
              <Badge icon="calendar-outline" />
              <View>
                <Text style={{ fontFamily: FONTS.uiBold, fontSize: 15, color: p.ink, textAlign: 'right' }}>تصحيح التاريخ الهجري</Text>
                <Text style={{ fontFamily: FONTS.ui, fontSize: 11, color: p.inkF, textAlign: 'right' }}>لموافقة رؤية الهلال المحلية</Text>
              </View>
            </View>
            <Stepper value={settings.hijriOff} min={-2} max={2} onChange={(v: number) => setSettings({ hijriOff: v })}
              display={settings.hijriOff === 0 ? '٠ يوم' : (settings.hijriOff > 0 ? '+' : '−') + ar(Math.abs(settings.hijriOff)) + ' يوم'} />
          </View>
          <Row icon="globe-outline" title="لغة التطبيق" sub="العربية" last right={<Ionicons name="checkmark-circle" size={19} color={p.ok} />} />
        </Card>
      </Reveal>
      <Section title="الصلاة والتلاوة" />
      <Reveal delay={140}>
        <Card>
          <ToggleRow icon="navigate-outline" title="استخدام موقعي الحالي" sub={geoSub} value={settings.geo} onChange={enableGeo} />
          {settings.geo ? (
            <Row icon="refresh-outline" title="تحديث الموقع" sub="إعادة قراءة إحداثيات جهازك" onPress={async () => { const c = await geo.refresh(); if (c) show('تم تحديث الموقع ✓'); }} />
          ) : null}
          <SelectRow icon="location-outline" label="المدينة (احتياطي)" valueLabel={settings.geo && geo.coords ? 'يُستخدم موقعك الحالي — اختر مدينة للتغيير' : city.ar + ' · ' + city.country} value={settings.city}
            options={CITIES.map((c) => ({ key: c.id, label: c.ar, sub: c.country }))} onSelect={(k: string) => setSettings({ city: k, geo: false })} />
          <SelectRow icon="calculator-outline" label="طريقة حساب المواقيت" valueLabel={settings.method === 'auto' ? 'تلقائي حسب الموقع' : (METHODS[settings.method] || METHODS.umm).label}
            value={settings.method} options={[{ key: 'auto', label: 'تلقائي حسب الموقع' }].concat(Object.keys(METHODS).map((k) => ({ key: k, label: METHODS[k].label })))}
            onSelect={(k: string) => setSettings({ method: k })} />
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: p.line, gap: 12 }}>
            <Text style={{ fontFamily: FONTS.uiBold, fontSize: 14, color: p.ink }}>صيغة الوقت</Text>
            <View style={{ width: 190 }}><Segmented small options={[{ key: '12', label: '١٢ ساعة' }, { key: '24', label: '٢٤ ساعة' }]} value={settings.f24 ? '24' : '12'} onChange={(k: string) => setSettings({ f24: k === '24' })} /></View>
          </View>
          <ToggleRow icon="repeat" title="الانتقال للسورة التالية تلقائياً" sub="عند انتهاء التلاوة" value={settings.autoNext} onChange={(v: boolean) => setSettings({ autoNext: v })} last />
        </Card>
      </Reveal>
      <Section title="البيانات" />
      <Reveal delay={200}>
        <Card>
          <Row icon="person-circle-outline" title="الاسم" sub={data.name} />
          <Row icon="bookmark-outline" title="مسح المفضلة" sub="السور والأسماء والأذكار والأدعية" danger onPress={() => setC1(true)} />
          <Row icon="trash-outline" title="إعادة تعيين التطبيق" sub="كل الإعدادات والتقدم والمفضلة" danger onPress={() => setC2(true)} last />
        </Card>
      </Reveal>
      <Text style={{ fontFamily: FONTS.ui, fontSize: 10.5, color: p.inkF, textAlign: 'center', marginTop: 20 }}>كل بياناتك محفوظة على جهازك فقط 🔒 · الإصدار ١.٠.٠</Text>

      <Confirm visible={c1} onClose={() => setC1(false)} title="مسح المفضلة؟" desc="ستُحذف كل المحفوظات. يمكنك التراجع فوراً من التنبيه." label="مسح الكل"
        onConfirm={() => { const s = snap(); clearFavs(); show('مُسحت المفضلة', 'info', { label: 'تراجع', onPress: () => restore(s) }); }} />
      <Confirm visible={c2} onClose={() => setC2(false)} title="إعادة تعيين التطبيق؟" desc="سيعود كل شيء إلى الحالة الأولى. يمكنك التراجع فوراً من التنبيه." label="إعادة التعيين"
        onConfirm={() => { const s = snap(); reset(); show('أُعيد تعيين التطبيق', 'info', { label: 'تراجع', onPress: () => restore(s) }); }} />
    </Screen>
  );
}