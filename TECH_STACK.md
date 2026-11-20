# Tech Stack — أثر (Ather)

Expo SDK 58 · React Native 0.88 · React 19 · TypeScript 6 · expo-router

This document describes what the app is built with, why, and how the pieces fit.
Product scope lives in `PROJECT_SCOPE.md`; agent conventions live in `CLAUDE.md`.

---

## 1. At a glance

| Layer | Technology | Version |
|---|---|---|
| Runtime | Expo SDK | `~58.0.26` |
| Native runtime | React Native | `0.88.1` |
| UI runtime | React / React DOM | `19.3.0` |
| Language | TypeScript (strict) | `~6.0.3` |
| Routing | expo-router (file-based) | `~58.0.32` |
| Bundler | Metro (`babel-preset-expo`) | via Expo |
| Web | react-native-web | `^0.21.0` |
| Web output | Expo static export, single-page (`output: "single"`) | — |
| Persistence | AsyncStorage | `2.2.0` |
| Audio | expo-audio | `~58.0.12` |
| Location | expo-location | `~58.0.22` |
| Sensors | expo-sensors (Magnetometer) | `~58.0.5` |
| Graphics | react-native-svg | `15.16.0` |
| Gradients | expo-linear-gradient | `~58.0.4` |
| Haptics / clipboard | expo-haptics, expo-clipboard | `~58.0.8`, `~58.0.4` |
| Icons | @expo/vector-icons (Ionicons) | `^15.0.0` |
| Fonts | expo-font + @expo-google-fonts (Amiri, Tajawal) + King Fahd Hafs TTF | `~58.0.12` etc. |
| Safe areas / screens | react-native-safe-area-context, react-native-screens | `~5.11.1`, `~4.30.1` |
| Data generation | Node.js ESM scripts (`node:fs`, `node:crypto`, `node:zlib`) | — |
| Backend | **None** | — |
| Tests / lint / CI | **None configured** | — |

Package manifests: `package.json`; lockfile: `pnpm-lock.yaml` (npm also works; the
lockfile will not be used by npm).

---

## 2. Application architecture

```
app/                        expo-router routes
  _layout.tsx               providers, splash, web chrome, desktop frame, Stack
  (tabs)/_layout.tsx        custom tab bar (5 tabs)
  (tabs)/index.tsx          home
  (tabs)/quran.tsx          surah list
  (tabs)/adhkar.tsx         adhkar hub
  (tabs)/duas.tsx           duas
  (tabs)/more.tsx           profile / menu / FAQ
  surah/[id].tsx            Quran reader + per-ayah audio
  adhkar/[id].tsx           dhikr counter
  names.tsx  qibla.tsx  settings.tsx  favorites.tsx
src/
  store.tsx                 Context state + AsyncStorage persistence
  location.tsx              GPS permission, coordinates, prayer-location resolver
  player.tsx                full-surah audio provider + mini/full player
  data.ts                   typed content loaders and selectors
  theme.ts                  palettes, fonts, sizes, accents
  ui.tsx                    shared UI primitives
  art.tsx                   SVG ornaments and illustrations
  util.ts                   Arabic numerals, Hijri, prayer times, qibla, sharing
  quran.json                generated Quran dataset (~1.3 MB)
  azkar.json                generated Hisn al-Muslim dataset (~141 KB)
assets/
  fonts/                    Tajawal/Amiri are loaded from npm; Uthmanic Hafs TTF here
  images/                   mosque photography + index.ts
scripts/
  fetch-quran.mjs           downloads, verifies, transforms Quran data
  fetch-azkar.mjs           downloads and transforms Hisn al-Muslim adhkar
```

**State model.** A single React Context (`StoreProvider`) holds `settings` and `data`
(favorites, last read, daily adhkar log, totals). Hydration merges persisted JSON with
defaults; writes are debounced. `useTheme()` derives the active palette, Quran font
size, and line height from settings.

**Audio model.** One `expo-audio` player lives in `PlayerProvider` for full-surah
playback and is controlled from a mini-player and full player. The Quran reader owns a
second player for individual ayahs. Audio mode is configured for silent-mode playback
and ducking; playback state is throttled (`updateInterval: 250`).

**Location model.** `LocationProvider` requests foreground location permission once
(`geoAsked`), keeps the last fix in memory and in Settings (`geoLat`/`geoLng`/`geoAt`),
and refreshes it when the app returns to the foreground after 10 minutes.
`usePrayerLocation()` resolves coordinates, the device time-zone offset, and the
calculation method: GPS plus the nearest preset city's method when "auto", otherwise
the selected city preset. Denial or GPS failure falls back to the city.

**Rendering model.** Screens use RN primitives plus `react-native-svg` art. Long lists
use `FlatList`; the reader computes pages dynamically from the selected font size and
supports horizontal swipe or vertical scroll.

---

## 3. Data pipeline

```
fetch-quran.mjs
  ├─ King Fahd Complex UthmanicHafs_v2-0.zip (official URL, then byte-identical mirror)
  ├─ SHA-256 verification (a7b0e559…d72c)
  ├─ validate 6,236 ayahs + per-surah numbering + metadata parity
  └─ write src/quran.json  (text, names, juz/page per ayah)
     Tanzil quran-data.xml → Makki/Madani + hizb metadata (CC BY 3.0)

fetch-azkar.mjs
  ├─ hisnmuslim.com official JSON (chapters, text, counts, audio refs)
  ├─ Seen-Arabic morning/evening DB (MIT) → takhrīj for morning/evening
  └─ write src/azkar.json
```

The generated files are bundled at build time. There is no runtime API for text, so
reading works offline. Provenance and licensing are documented in `REFERENCES.md`; the
app surfaces source attribution in the Quran screens and the FAQ.

---

## 4. Platform targets

| Target | How |
|---|---|
| iOS | Expo Go / dev build; bundle id `com.athar.app`; motion + when-in-use location permission strings |
| Android | Expo Go / dev build; package `com.athar.app`; edge-to-edge enabled; fine/coarse location permissions |
| Web | `expo export -p web` → `dist/`; Metro bundler; single-page RTL site |

The web build is not just a fallback: it styles the document (`lang="ar"`, `dir="rtl"`,
title, favicon, scrollbars, focus rings) and centers the app in a 430 px frame on wide
screens. Qibla uses `deviceorientation` where available, otherwise manual mode.

---

## 5. Tooling & environment

- **Node.js:** 20 LTS or newer is recommended for Expo SDK 58 tooling.
- **Package manager:** pnpm lockfile is committed; `npm install` is documented in the
  README. Do not mix package managers in one install.
- **Type checking:** `npx tsc --noEmit` (strict mode, `expo/tsconfig.base`).
- **Dev:** `npx expo start` (`w` web, `a` Android, `i` iOS).
- **Build:** `npm run build:web`.
- **Data refresh:** `npm run fetch:quran`, `npm run fetch:azkar` (network required).
- **No** ESLint, Prettier, Jest, CI workflow, or EAS config is checked in.

---

## 6. Key libraries and why

| Library | Role |
|---|---|
| expo-router | File-based navigation with typed-ish routes and Stack/Tabs |
| @react-native-async-storage/async-storage | Simple local persistence; no DB needed |
| expo-audio | Modern audio API replacing expo-av; background-safe playback config |
| expo-sensors | Magnetometer for the qibla compass |
| react-native-svg | Resolution-independent Islamic ornament and dial rendering |
| expo-linear-gradient | Hero cards and gradients |
| expo-clipboard / React Native `Share` | Copy and share ayahs, duas, adhkar |
| expo-haptics | Subtle feedback on counters and interactions |
| @expo-google-fonts/amiri, tajawal | Display and UI Arabic type |
| King Fahd Hafs TTF | Quran text rendering with full diacritic coverage |

---

## 7. Deliberate constraints

- **No backend / no accounts.** Keeps privacy absolute and the app offline-capable.
- **Bundled text.** Trades bundle size (~1.5 MB of JSON) for guaranteed offline reading.
- **Streaming audio only.** Keeps the binary small; requires connectivity for recitation.
- **Arithmetic astronomy.** Prayer times and Hijri dates are computed on-device with
  documented approximations, not fetched from a service.
- **Single codebase, three targets.** One React Native codebase ships to mobile and web.

---

## 8. Upgrade notes

- Keep all `expo-*` packages on the SDK 58 line; run `npx expo install --check` after
  changing any Expo dependency.
- React 19 + RN 0.88 may surface peer-dependency warnings; prefer versions aligned by
  `npx expo install`.
- TypeScript 6 is stricter than 5; new code must type-check under `strict`.
- If Expo changes `expo-audio` APIs, update both `src/player.tsx` and the per-ayah player
  in `app/surah/[id].tsx`.
