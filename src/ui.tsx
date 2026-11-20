import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, PanResponder, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FONTS } from './theme';
import { useTheme, useToast } from './store';
import { ar, clamp } from './util';

export const RTL: any = { textAlign: 'right', writingDirection: 'rtl' };
export function useBack() { const r = useRouter(); return () => { if (r.canGoBack()) r.back(); else r.replace('/'); }; }

export function Screen({ children, scroll = true, pad = 120, top = true, bg, under }: any) {
  const { p } = useTheme(); const ins = useSafeAreaInsets();
  const pt = top ? ins.top + 8 : 0;
  return (
    <View style={{ flex: 1, backgroundColor: bg || p.bg }}>
      {under}
      {scroll ? <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: pt, paddingBottom: pad }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        : <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: pt, paddingBottom: 8 }}>{children}</View>}
    </View>
  );
}

export function Header({ title, sub, back = true, left, dark = false }: any) {
  const { p } = useTheme(); const ins = useSafeAreaInsets(); const go = useBack();
  const fg = dark ? p.onDark : p.ink;
  return (
    <View style={{ paddingTop: ins.top + 6, paddingBottom: 10, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
        {back ? <Pressable onPress={go} style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: dark ? 'rgba(255,255,255,0.07)' : p.surface, borderWidth: 1, borderColor: dark ? p.dLine : p.line, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-forward" size={20} color={fg} /></Pressable> : <View style={{ width: 40 }} />}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: FONTS.display, fontSize: 22, color: fg, textAlign: 'center' }}>{title}</Text>
          {sub ? <Text style={{ fontFamily: FONTS.ui, fontSize: 11.5, color: dark ? p.onDarkF : p.inkF, textAlign: 'center', marginTop: 1 }}>{sub}</Text> : null}
        </View>
        <View style={{ width: 40, alignItems: 'center' }}>{left || null}</View>
      </View>
    </View>
  );
}

export function Reveal({ children, style }: any) {
  return <View style={style}>{children}</View>;
}

export function Segmented({ options, value, onChange, small }: any) {
  const { p } = useTheme(); const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const n = options.length; const idx = Math.max(0, options.findIndex((o: any) => o.key === value));
  const sw = w > 0 ? (w - 6) / n : 0;
  useEffect(() => { if (sw > 0) Animated.spring(x, { toValue: (n - 1 - idx) * sw, useNativeDriver: true, speed: 20, bounciness: 4 }).start(); }, [idx, sw]);
  return (
    <View onLayout={(e) => { const nw = e.nativeEvent.layout.width; setW(nw); if (sw === 0) x.setValue((n - 1 - idx) * ((nw - 6) / n)); }}
      style={{ flexDirection: 'row-reverse', backgroundColor: p.bgSoft, borderRadius: 6, padding: 3, borderWidth: 1, borderColor: p.line, height: small ? 36 : 42 }}>
      {sw > 0 ? <Animated.View style={{ position: 'absolute', top: 3, bottom: 3, left: 3, width: sw, borderRadius: 4, backgroundColor: p.gold, transform: [{ translateX: x }] }} /> : null}
      {options.map((o: any) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <Text style={{ fontFamily: FONTS.uiBold, fontSize: small ? 12 : 13, color: on ? '#FFFFFF' : p.inkS }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Search({ value, onChange, placeholder }: any) {
  const { p } = useTheme();
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, borderRadius: 6, height: 44, paddingHorizontal: 12 }}>
      <Ionicons name="search" size={17} color={p.inkF} />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={p.inkF} autoCorrect={false}
        style={[{ flex: 1, fontFamily: FONTS.uiMed, fontSize: 14, color: p.ink, paddingVertical: 0 }, RTL, Platform.select({ web: { direction: 'rtl', outlineStyle: 'none' }, default: {} })]} />
      {value ? <Pressable onPress={() => onChange('')} hitSlop={8}><Ionicons name="close-circle" size={17} color={p.inkF} /></Pressable> : null}
    </View>
  );
}

export function Chip({ label, active, onPress }: any) {
  const { p } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 12, height: 30, borderRadius: 999, borderWidth: 1, borderColor: active ? p.gold : p.line, backgroundColor: active ? p.gold : p.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: FONTS.uiBold, fontSize: 12, color: active ? '#FFFFFF' : p.inkS }}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ icon, bg, color, size = 40 }: any) {
  const { p } = useTheme();
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg || p.goldBg, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={icon || 'star-outline'} size={size * 0.48} color={color || p.gold} /></View>;
}

export function Card({ children, style }: any) {
  const { p } = useTheme();
  return <View style={[{ backgroundColor: p.card, borderRadius: 6, borderWidth: 1, borderColor: p.line, paddingHorizontal: 14 }, style]}>{children}</View>;
}

export function Row({ icon, title, sub, onPress, right, danger, last }: any) {
  const { p } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: p.line }}>
      <Badge icon={icon} bg={danger ? p.badBg : undefined} color={danger ? p.bad : undefined} />
      <View style={{ flex: 1 }}>
        <Text style={[{ fontFamily: FONTS.uiBold, fontSize: 15, color: danger ? p.bad : p.ink }, RTL]}>{title}</Text>
        {sub ? <Text numberOfLines={1} style={[{ fontFamily: FONTS.ui, fontSize: 12, color: p.inkF, marginTop: 1 }, RTL]}>{sub}</Text> : null}
      </View>
      {right || (onPress ? <Ionicons name="chevron-back" size={16} color={p.inkF} /> : null)}
    </Pressable>
  );
}

export function Section({ title, action, onAction }: any) {
  const { p } = useTheme();
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 7, height: 7, backgroundColor: p.gold, transform: [{ rotate: '45deg' }] }} />
        <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 16, color: p.ink }}>{title}</Text>
      </View>
      {action ? <Pressable onPress={onAction} hitSlop={8}><Text style={{ fontFamily: FONTS.uiBold, fontSize: 12, color: p.goldD }}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function Btn({ label, icon, onPress, tone = 'gold', small, disabled, loading, style }: any) {
  const { p } = useTheme();
  const bg = tone === 'gold' ? p.gold : tone === 'bad' ? p.bad : p.n0;
  const fg = '#FFFFFF';
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={[{ height: small ? 40 : 48, borderRadius: 10, backgroundColor: bg, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: small ? 12 : 16, opacity: disabled ? 0.45 : 1 }, style]}>
      {loading ? <ActivityIndicator size="small" color={fg} /> : <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, flexShrink: 1 }}>
        {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
        <Text numberOfLines={1} style={{ fontFamily: FONTS.uiMed, fontSize: small ? 13 : 15, color: fg, textAlign: 'center' }}>{label}</Text>
      </View>}
    </Pressable>
  );
}

export function Soft({ label, icon, onPress, small, active, style }: any) {
  const { p } = useTheme();
  return (
    <Pressable onPress={onPress} style={[{ height: small ? 40 : 46, borderRadius: 10, backgroundColor: active ? p.goldBg : p.surface, borderWidth: 1, borderColor: active ? p.gold : p.line, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: small ? 10 : 14 }, style]}>
      {icon ? <Ionicons name={icon} size={small ? 15 : 17} color={active ? p.gold : p.ink} /> : null}
      <Text numberOfLines={1} style={{ fontFamily: FONTS.uiMed, fontSize: small ? 12.5 : 14, color: active ? p.gold : p.ink, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({ value, onChange }: any) {
  const { p } = useTheme(); const x = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => { Animated.spring(x, { toValue: value ? 1 : 0, useNativeDriver: true, speed: 24, bounciness: 5 }).start(); }, [value]);
  const tx = x.interpolate({ inputRange: [0, 1], outputRange: [3, 25] });
  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={6}>
      <View style={{ width: 52, height: 30, borderRadius: 999, backgroundColor: value ? p.gold : p.line, justifyContent: 'center' }}>
        <Animated.View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', transform: [{ translateX: tx }] }} />
      </View>
    </Pressable>
  );
}

export function Stepper({ value, min, max, onChange, display }: any) {
  const { p } = useTheme();
  const B = ({ icon, on, dis }: any) => (
    <Pressable onPress={on} disabled={dis} style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center', opacity: dis ? 0.3 : 1 }}>
      <Ionicons name={icon} size={16} color={p.goldD} /></Pressable>
  );
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
      <B icon="remove" on={() => onChange(value - 1)} dis={value <= min} />
      <Text style={{ fontFamily: FONTS.uiBold, fontSize: 14, color: p.ink, minWidth: 64, textAlign: 'center' }}>{display != null ? display : ar(value)}</Text>
      <B icon="add" on={() => onChange(value + 1)} dis={value >= max} />
    </View>
  );
}

export function Sheet({ visible, onClose, title, children }: any) {
  const { p } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: p.scrim, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Pressable onPress={() => { }} style={{ width: '100%', maxWidth: 440, maxHeight: '84%', backgroundColor: p.surface, borderRadius: 20, borderWidth: 1, borderColor: p.gold + '55', padding: 16 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontFamily: FONTS.uiMed, fontSize: 15, color: p.ink }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: p.bgSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={16} color={p.inkS} /></Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function Confirm({ visible, title, desc, label = 'تأكيد', onConfirm, onClose }: any) {
  const { p } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <Text style={[{ fontFamily: FONTS.ui, fontSize: 14, color: p.inkS, lineHeight: 22, marginBottom: 16 }, RTL]}>{desc}</Text>
      <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
        <Btn label={label} tone="bad" style={{ flex: 1 }} onPress={() => { onConfirm(); onClose(); }} />
        <Soft label="إلغاء" style={{ flex: 1 }} onPress={onClose} />
      </View>
    </Sheet>
  );
}

export function SelectRow({ icon, label, valueLabel, options, value, onSelect, last }: any) {
  const { p } = useTheme(); const [open, setOpen] = useState(false);
  return (
    <View>
      <Row icon={icon} title={label} sub={valueLabel} onPress={() => setOpen(true)} last={last} />
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <ScrollView style={{ maxHeight: 380 }}>
          {options.map((o: any) => (
            <Pressable key={o.key} onPress={() => { onSelect(o.key); setOpen(false); }}
              style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.line }}>
              <Ionicons name={o.key === value ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={o.key === value ? p.gold : p.inkF} />
              <View style={{ flex: 1 }}>
                <Text style={[{ fontFamily: o.key === value ? FONTS.uiBold : FONTS.uiMed, fontSize: 14, color: p.ink }, RTL]}>{o.label}</Text>
                {o.sub ? <Text style={[{ fontFamily: FONTS.ui, fontSize: 11, color: p.inkF }, RTL]}>{o.sub}</Text> : null}
              </View>
            </Pressable>))}
        </ScrollView>
      </Sheet>
    </View>
  );
}

export function ToggleRow({ icon, title, sub, value, onChange, last }: any) {
  return <Row icon={icon} title={title} sub={sub} last={last} right={<Toggle value={value} onChange={onChange} />} />;
}

export function Progress({ v, color, h = 6 }: any) {
  const { p } = useTheme();
  return <View style={{ height: h, borderRadius: h / 2, backgroundColor: p.bgSoft, overflow: 'hidden' }}>
    <View style={{ width: (clamp(v, 0, 1) * 100) + '%', height: '100%', backgroundColor: color || p.gold }} /></View>;
}

export function Dots({ n, i, onPress }: any) {
  const { p } = useTheme(); const c = Math.min(n, 12);
  return (
    <View style={{ flexDirection: 'row-reverse', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: c }, (_, k) => (
        <Pressable key={k} onPress={() => onPress && onPress(k)} hitSlop={5}>
          <View style={{ width: k === i ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? p.gold : p.line }} />
        </Pressable>))}
    </View>
  );
}

export function Empty({ icon = 'bookmark-outline', title, desc, action, onAction }: any) {
  const { p } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, gap: 10 }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: p.bgSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: p.gold + '44' }}>
        <Ionicons name={icon} size={34} color={p.goldD} /></View>
      <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 16, color: p.ink }}>{title}</Text>
      <Text style={{ fontFamily: FONTS.ui, fontSize: 13, color: p.inkS, textAlign: 'center', lineHeight: 21, maxWidth: 280 }}>{desc}</Text>
      {action ? <Soft label={action} onPress={onAction} small style={{ marginTop: 6 }} /> : null}
    </View>
  );
}

export function Slider({ value, max, onChange, onCommit, disabled, dark }: any) {
  const { p } = useTheme(); const [w, setW] = useState(0);
  const wr = useRef(0), mr = useRef(max), last = useRef(0);
  const cb = useRef({ onChange, onCommit }); cb.current = { onChange, onCommit }; mr.current = max;
  const ratio = max > 0 ? clamp(value / max, 0, 1) : 0;
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled && wr.current > 0 && mr.current > 0,
    onMoveShouldSetPanResponder: () => !disabled && wr.current > 0 && mr.current > 0,
    onPanResponderGrant: (e) => { const v = clamp(e.nativeEvent.locationX / wr.current, 0, 1) * mr.current; last.current = v; cb.current.onChange(v); },
    onPanResponderMove: (e) => { const v = clamp(e.nativeEvent.locationX / wr.current, 0, 1) * mr.current; last.current = v; cb.current.onChange(v); },
    onPanResponderRelease: () => cb.current.onCommit && cb.current.onCommit(last.current),
    onPanResponderTerminate: () => cb.current.onCommit && cb.current.onCommit(last.current),
  })).current;
  return (
    <View {...pan.panHandlers} onLayout={(e) => { wr.current = e.nativeEvent.layout.width; setW(wr.current); }}
      style={[{ height: 28, justifyContent: 'center', opacity: disabled ? 0.45 : 1 }, Platform.select({ web: { direction: 'ltr' }, default: {} })]}>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: dark ? 'rgba(255,255,255,0.16)' : p.line }}>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: ratio * w, borderRadius: 3, backgroundColor: p.gold }} />
        <View style={{ position: 'absolute', left: ratio * w - 9, top: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: p.gold, borderWidth: 3, borderColor: dark ? p.n0 : p.surface }} />
      </View>
    </View>
  );
}

function ToastView({ t, done }: any) {
  const { p } = useTheme();
  const o = useRef(new Animated.Value(0)).current; const y = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([Animated.timing(o, { toValue: 1, duration: 220, useNativeDriver: true }),
    Animated.spring(y, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 5 })]).start();
    const to = setTimeout(done, t.action ? 5200 : 3600); return () => clearTimeout(to);
  }, [t.id]);
  const icon = t.type === 'success' ? 'checkmark-circle' : t.type === 'error' ? 'alert-circle' : 'information-circle';
  const ic = t.type === 'success' ? '#43A873' : t.type === 'error' ? '#D2685C' : '#5D9BD8';
  return (
    <Animated.View style={{ opacity: o, transform: [{ translateY: y }], backgroundColor: p.n0, borderRadius: 14, borderWidth: 1, borderColor: p.dLine, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
      <Ionicons name={icon} size={20} color={ic} />
      <Text style={[{ flex: 1, fontFamily: FONTS.uiMed, fontSize: 13, color: p.onDark }, RTL]}>{t.msg}</Text>
      {t.action ? <Pressable onPress={() => { t.action.onPress(); done(); }} hitSlop={6} style={{ backgroundColor: 'rgba(233,211,160,0.14)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Text style={{ fontFamily: FONTS.uiBlack, fontSize: 12, color: p.goldS }}>{t.action.label}</Text></Pressable> : null}
    </Animated.View>
  );
}
export function ToastHost() {
  const { toast, hide } = useToast(); const ins = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: ins.bottom + 96, alignItems: 'center', zIndex: 95 }}>
      <View style={{ width: '100%', maxWidth: 440 }}><ToastView key={toast.id} t={toast} done={hide} /></View>
    </View>
  );
}