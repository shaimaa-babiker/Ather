import React, { useId, useState, type ReactNode } from 'react';
import { Image, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Mask, Path, Pattern, RadialGradient, Rect, Stop, Text as ST } from 'react-native-svg';
import { FONTS, shadow } from './theme';
import { useTheme } from './store';
import { ar, gid } from './util';
import { MOSQUE_IMAGES } from '../assets/images';
const cid = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '') + gid();

export function Crescent({ size = 48, color = '#FFFFFF', glow = false }: any) {
  const id = cid(useId());
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <Mask id={'m' + id}><Rect x="0" y="0" width="48" height="48" fill="#fff" /><Circle cx="31" cy="20" r="17" fill="#000" /></Mask>
        {glow ? <RadialGradient id={'g' + id}><Stop offset="0" stopColor={color} stopOpacity="0.5" /><Stop offset="1" stopColor={color} stopOpacity="0" /></RadialGradient> : null}
      </Defs>
      {glow ? <Circle cx="24" cy="24" r="24" fill={'url(#g' + id + ')'} /> : null}
      <Circle cx="24" cy="26" r="18" fill={color} mask={'url(#m' + id + ')'} />
    </Svg>
  );
}

export function StarMedallion({ n, size = 44, color, fill = 'none', textColor }: any) {
  const s = size, c = s / 2, side = s * 0.6;
  return (
    <Svg width={s} height={s} viewBox={'0 0 ' + s + ' ' + s}>
      <Rect x={c - side / 2} y={c - side / 2} width={side} height={side} stroke={color} strokeWidth={1.4} fill={fill} />
      <G transform={'rotate(45 ' + c + ' ' + c + ')'}><Rect x={c - side / 2} y={c - side / 2} width={side} height={side} stroke={color} strokeWidth={1.4} fill={fill} /></G>
      <Circle cx={c} cy={c} r={s * 0.29} stroke={color} strokeWidth={1} fill={fill} />
      {n != null ? <ST x={c} y={c + s * 0.115} textAnchor="middle" fontSize={s * 0.32} fontFamily={FONTS.uiBold} fill={textColor || color}>{ar(n)}</ST> : null}
    </Svg>
  );
}

export function MosqueScene({ height = 220, night = true, sun = false, src, overlay = true, style }: any) {
  const imageSrc = src || (sun ? MOSQUE_IMAGES.dawn : night ? MOSQUE_IMAGES.night : MOSQUE_IMAGES.dusk);
  return (
    <View style={[{ height, width: '100%', overflow: 'hidden' }, style]} pointerEvents="none">
      <Image source={imageSrc} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
      {overlay ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: typeof overlay === 'string' ? overlay : 'rgba(10,28,56,0.50)' }} />
      ) : null}
    </View>
  );
}

export function FrameCard({ children, style }: { children: ReactNode; style?: any }) {
  const { p } = useTheme();
  const [d, setD] = useState({ w: 0, h: 0 });
  const fr = p.frame;
  const corner = (tx: number, ty: number, sx: number, sy: number, k: string) => (
    <G key={k} transform={'translate(' + tx + ',' + ty + ') scale(' + sx + ',' + sy + ')'}>
      <Path d="M4 30 C4 14 14 4 30 4" stroke={fr} strokeWidth={1.4} fill="none" />
      <Path d="M4 22 C4 11 11 4 22 4" stroke={fr} strokeWidth={0.8} fill="none" opacity={0.6} />
      <Path d="M30 4 c7 0 9 5 5 8 c-3 2 -7 0 -6 -4" stroke={fr} strokeWidth={1} fill="none" />
      <Circle cx={10} cy={10} r={1.6} fill={fr} />
    </G>
  );
  return (
    <View onLayout={(e) => setD({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[{ backgroundColor: p.paper, borderRadius: 8, padding: 24, overflow: 'hidden' }, shadow(p.n0, 1), style]}>
      {d.w > 40 ? (
        <Svg width={d.w} height={d.h} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
          <Rect x={3.5} y={3.5} width={d.w - 7} height={d.h - 7} stroke={fr} strokeWidth={1.4} fill="none" />
          <Rect x={9} y={9} width={d.w - 18} height={d.h - 18} stroke={fr} strokeWidth={0.7} fill="none" opacity={0.6} />
          {corner(0, 0, 1, 1, 'a')}{corner(d.w, 0, -1, 1, 'b')}{corner(0, d.h, 1, -1, 'c')}{corner(d.w, d.h, -1, -1, 'd')}
          <G transform={'translate(' + d.w / 2 + ',4)'}><Path d="M0 -5 L5 0 L0 5 L-5 0 Z" fill={fr} /><Path d="M-18 0 h11 M7 0 h11" stroke={fr} strokeWidth={1} /></G>
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

export function Ornament({ width = 190, color }: any) {
  const c = width / 2;
  return (
    <Svg width={width} height={20} viewBox={'0 0 ' + width + ' 20'}>
      <Rect x={0} y={9.5} width={c - 20} height={1} fill={color} opacity={0.5} />
      <Rect x={c + 20} y={9.5} width={c - 20} height={1} fill={color} opacity={0.5} />
      <Rect x={c - 5} y={5} width={10} height={10} stroke={color} strokeWidth={1.1} fill="none" />
      <G transform={'rotate(45 ' + c + ' 10)'}><Rect x={c - 5} y={5} width={10} height={10} stroke={color} strokeWidth={1.1} fill="none" /></G>
      <Circle cx={c - 14} cy={10} r={1.5} fill={color} /><Circle cx={c + 14} cy={10} r={1.5} fill={color} />
    </Svg>
  );
}

export function Mihrab({ size = 110 }: any) {
  const { p } = useTheme(); const id = cid(useId());
  return (
    <Svg width={size} height={size * 1.17} viewBox="0 0 120 140">
      <Defs><LinearGradient id={'h' + id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={p.n1} /><Stop offset="1" stopColor={p.n0} /></LinearGradient></Defs>
      <Path d="M60,8 C40,26 24,38 24,64 L24,112 C24,126 38,132 60,132 C82,132 96,126 96,112 L96,64 C96,38 80,26 60,8 Z" fill={'url(#h' + id + ')'} stroke={p.gold} strokeWidth={2} />
      <Path d="M60,16 C44,30 31,41 31,64 L31,109 C31,120 43,125 60,125 C77,125 89,120 89,109 L89,64 C89,41 76,30 60,16 Z" fill="none" stroke={p.gold} strokeWidth={0.8} opacity={0.6} />
      <ST x="60" y="94" textAnchor="middle" fontSize="42" fontFamily={FONTS.display} fill={p.goldS}>اللَّه</ST>
    </Svg>
  );
}

export function PatternBG({ color = '#C0C0C0', opacity = 0.05 }: any) {
  const id = cid(useId());
  return (
    <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
      <Defs><Pattern id={'p' + id} patternUnits="userSpaceOnUse" width="48" height="48">
        <Rect x="16" y="16" width="16" height="16" stroke={color} strokeWidth="0.8" fill="none" />
        <G transform="rotate(45 24 24)"><Rect x="16" y="16" width="16" height="16" stroke={color} strokeWidth="0.8" fill="none" /></G>
        <Circle cx="24" cy="24" r="1.4" fill={color} />
      </Pattern></Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={'url(#p' + id + ')'} opacity={opacity} />
    </Svg>
  );
}

export function BookIcon({ size = 22, color }: any) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6 C9 4 5 4 3 5 L3 15 C5 14 9 14 12 16 Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M12 6 C15 4 19 4 21 5 L21 15 C19 14 15 14 12 16 Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M12 6 L12 16" stroke={color} strokeWidth={1.2} />
      <Path d="M7 21 L12 16.6 L17 21 M4.6 19 L12 15.4 L19.4 19" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}
export function BeadsIcon({ size = 22, color }: any) {
  const b = Array.from({ length: 9 }, (_, i) => { const a = (120 + i * 33.5) * Math.PI / 180; return { x: 12 + 7 * Math.cos(a), y: 10 + 7 * Math.sin(a) }; });
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {b.map((x, i) => <Circle key={i} cx={x.x} cy={x.y} r={1.7} fill={color} />)}
      <Circle cx={12} cy={18.4} r={1.9} fill={color} /><Rect x={11.4} y={20} width={1.2} height={2.2} fill={color} />
      <Path d="M12 22.2 L13.4 23.4 L12 24 L10.6 23.4 Z" fill={color} />
    </Svg>
  );
}
export function HandsIcon({ size = 22, color }: any) {
  const h = 'M11 21 C7 19 4.5 15.5 4.5 11.5 L4.5 7 C4.5 5.8 6.3 5.8 6.3 7 L6.3 10 L6.9 5.6 C7 4.4 8.8 4.5 8.8 5.7 L8.8 9.6 L9.4 5 C9.5 3.9 11.2 4 11.2 5.2 L11.2 12';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={h} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <G transform="translate(24,0) scale(-1,1)"><Path d={h} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></G>
      <Path d="M12 1.2 L12 3 M8.6 2 L9.4 3.4 M15.4 2 L14.6 3.4" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}
export function Kaaba({ size = 22 }: any) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="4" y="6" width="16" height="14" rx="1" fill="#0A1C38" />
      <Rect x="4" y="10" width="16" height="2.6" fill="#C0C0C0" />
      <Rect x="13.4" y="14" width="3" height="6" rx="0.6" fill="#FFFFFF" />
    </Svg>
  );
}