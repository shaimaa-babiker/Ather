import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../../src/theme';
import { useData, useTheme } from '../../src/store';
import { BeadsIcon, BookIcon, HandsIcon } from '../../src/art';
import { dkey } from '../../src/util';

function Bar({ state, navigation }: any) {
  const { p, dark } = useTheme();
  const { data } = useData();
  const ins = useSafeAreaInsets();
  const router = useRouter();

  const today = data.daily[dkey(new Date())] || [];
  const pending = today.indexOf('morning') < 0 && today.indexOf('evening') < 0;

  const tabConfig: Record<string, { label: string; ic: (c: string, a: boolean) => React.ReactNode; dot?: boolean }> = {
    index: {
      label: 'الرئيسية',
      ic: (c: string, a: boolean) => <Ionicons name={a ? 'home' : 'home-outline'} size={21} color={c} />,
    },
    quran: {
      label: 'القرآن',
      ic: (c: string) => <BookIcon size={22} color={c} />,
    },
    adhkar: {
      label: 'الأذكار',
      ic: (c: string) => <BeadsIcon size={22} color={c} />,
      dot: pending,
    },
    duas: {
      label: 'الأدعية',
      ic: (c: string) => <HandsIcon size={22} color={c} />,
    },
    more: {
      label: 'المزيد',
      ic: (c: string) => <Ionicons name="ellipsis-horizontal" size={21} color={c} />,
    },
  };

  return (
    <View style={{ flexDirection: 'row-reverse', backgroundColor: p.tab, borderTopWidth: 1, borderTopColor: p.line, paddingBottom: ins.bottom, height: 62 + ins.bottom }}>
      {state.routes.map((r: any, i: number) => {
        const on = state.index === i;
        const it = tabConfig[r.name] || { label: r.name, ic: () => null };
        const c = on ? (dark ? '#FFFFFF' : '#1C3863') : '#94A3B8';

        const handlePress = () => {
          let defaultPrevented = false;
          try {
            if (navigation?.emit) {
              const e = navigation.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
              defaultPrevented = !!e?.defaultPrevented;
            }
          } catch {
            // Safe fallback if navigation event bus is interrupted
          }

          if (!on && !defaultPrevented) {
            try {
              navigation.navigate(r.name);
            } catch {
              router.navigate(r.name === 'index' ? '/' : `/${r.name}`);
            }
          }
        };

        return (
          <Pressable
            key={r.key}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
            onPress={handlePress}>
            <View style={{ width: 38, height: 32, borderRadius: 12, backgroundColor: on ? (dark ? 'rgba(255,255,255,0.12)' : '#EFF4FB') : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {it.ic(c, on)}
              {it.dot && !on ? <View style={{ position: 'absolute', top: 3, right: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: '#1C3863' }} /> : null}
            </View>
            <Text style={{ fontFamily: on ? FONTS.uiBold : FONTS.uiMed, fontSize: 10.5, color: on ? (dark ? '#FFFFFF' : '#1C3863') : '#94A3B8' }}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { p } = useTheme();
  return (
    <Tabs tabBar={(props) => <Bar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: p.bg } }}>
      <Tabs.Screen name="index" /><Tabs.Screen name="quran" /><Tabs.Screen name="adhkar" /><Tabs.Screen name="duas" /><Tabs.Screen name="more" />
    </Tabs>
  );
}
