# CLAUDE.md — Working in this repository

Guidance for AI coding agents (Claude Code, OpenCode, Cursor, etc.) working on
**أثر (Ather)** — an Expo + React Native app for Quran, adhkar, duas, the 99 Names,
qibla, and prayer times.

Read `PROJECT_SCOPE.md` for product boundaries, `TECH_STACK.md` for the stack, and
`REFERENCES.md` before touching religious content or data provenance.

---

## Golden rules

1. **Never edit religious text by hand.** `src/quran.json` and `src/azkar.json` are
   generated artifacts. Change data only through `scripts/fetch-quran.mjs` /
   `scripts/fetch-azkar.mjs`, then re-verify. Never invent, paraphrase, or "fix" an
   ayah, dhikr, hadith number, or grading.
2. **Do not alter the Quran text or font.** The only allowed transformation is the one
   already in the fetch script (stripping the trailing ayah number). Keep attribution
   to the King Fahd Complex intact.
3. **Local-only, offline-first.** No accounts, analytics, tracking, ads, or new network
   calls. The only permitted network use is recitation audio.
4. **Arabic and RTL are the default.** UI strings are Arabic; use Arabic-Indic numerals
   via `ar()` from `src/util.ts`; use `textAlign: 'right'` / row-reverse layouts.
5. **No new dependencies without a clear need.** Prefer Expo SDK modules and what is
   already installed. Pin/add versions compatible with the current Expo SDK.
6. **Preserve user work.** This repo is not under git; do not delete files, assets, or
   screens you did not create without understanding them.

---

## Commands

```bash
npm install                 # or: pnpm install (pnpm-lock.yaml is present)
npx expo start              # dev server; press w / a / i
npx expo start --web
npm run build:web           # static web export to dist/
npm run fetch:quran         # regenerate src/quran.json (network, verifies SHA-256)
npm run fetch:azkar         # regenerate src/azkar.json (network)

npx tsc --noEmit            # type check (TypeScript strict)
```

There is **no test suite, linter, formatter config, or CI**. Use `npx tsc --noEmit`
and a web export as the minimum verification.

---

## Architecture at a glance

- **Routing:** `expo-router` file-based routes in `app/`.
  - `app/_layout.tsx` — root providers (SafeArea → Store → fonts → Player), splash,
    web chrome, desktop frame, Stack screens.
  - `app/(tabs)/_layout.tsx` — custom bottom tab bar; five tabs:
    `index` (home), `quran`, `adhkar`, `duas`, `more`.
  - `app/surah/[id].tsx` — Quran reader (large file, ~1.5k lines).
  - `app/adhkar/[id].tsx` — dhikr counter flow.
  - `app/names.tsx`, `app/qibla.tsx`, `app/settings.tsx`, `app/favorites.tsx`.
- **State:** `src/store.tsx` — React Context + `AsyncStorage` under key `noor:v2`.
  Exposes `useStore`, `useSettings`, `useData`, `useToast`, `useTheme`.
  Settings and user data are merged with defaults on hydration; writes are debounced
  ~250 ms. `fav(kind, id)`, `snap()` / `restore()` power undo.
- **Audio:** `src/player.tsx` — `PlayerProvider` wraps a single `expo-audio` player for
  full-surah recitation, plus `MiniPlayer` / `FullPlayer`. Per-ayah audio is local to
  `app/surah/[id].tsx` using a second `useAudioPlayer`.
- **Content:** `src/data.ts` — loads generated JSON, exports `SURAHS`, `NAMES`,
  `ADHKAR`, `ALL_ADHKAR`, `DUAS`, `CITIES`, `BASMALA`, and helpers.
- **Location:** `src/location.tsx` — `LocationProvider` (expo-location permission,
  GPS fix, cached coords) and `usePrayerLocation()` (coordinates, device time-zone
  offset, calculation method, labels). `LocationProvider` wraps the app inside
  `StoreProvider`.
- **Theme:** `src/theme.ts` — palette function (`light`/`dark`), fonts (`FONTS`),
  Quran sizes (`QSIZES`), accents. `useTheme()` returns `{ p, dark, qs, qlh }`.
- **UI kit:** `src/ui.tsx` — `Screen`, `Header`, `Card`, `Sheet`, `Btn`, `Soft`,
  `Segmented`, `Search`, `ToggleRow`, `Stepper`, `ToastHost`, `Reveal`, etc.
- **Art:** `src/art.tsx` — SVG ornaments, beads, book, hands, crescent, Kaaba,
  `StarMedallion`, `PatternBG`.
- **Utilities:** `src/util.ts` — Arabic digits, Hijri conversion, prayer-time astronomy,
  qibla bearing, copy/share, text stripping, streak calculation.
- **Assets:** `assets/fonts/*.ttf`, `assets/images/*` indexed by
  `assets/images/index.ts` (`MOSQUE_IMAGES`).

### Data flow

`scripts/fetch-*.mjs` → `src/quran.json` / `src/azkar.json` → `src/data.ts` →
screens. Screens read user state from the store; nothing is persisted server-side.

---

## Conventions

- **TypeScript strict.** Type new props and exported helpers. `any` is tolerated in
  legacy code but avoid adding more.
- **Imports:** relative paths (`../src/...`), no path aliases. Keep import ordering
  consistent with surrounding files.
- **Components:** function components with hooks. Screens are default exports.
  Reusable primitives go in `src/ui.tsx`, decorative SVG in `src/art.tsx`.
- **Style:** inline `StyleSheet`-less style objects are the dominant pattern; match the
  file you are editing rather than introducing a new styling system.
- **Arabic copy:** use correct hamza/diacritics; keep existing religious phrasing intact.
- **Numbers:** render user-facing numbers with `ar()`; keep internal math as numbers.
- **Platform:** guard web-only APIs (`window`, `document`) with
  `Platform.OS === 'web'` and `typeof` checks. Never assume a magnetometer exists.
- **Toasts:** use `show(message, type?, action?)`; offer undo for destructive actions.

### Two design systems coexist — know which one you are in

- `src/theme.ts` + `src/ui.tsx`: navy `#0A1C38`, silver `#C0C0C0`, white; the brand
  palette. Settings and shared primitives use this.
- Several tab screens and `surah/[id]` define **local "Serene" tokens** at the top of
  the file (e.g. `GOLD = '#C9A96E'`, `BG = '#F8F9FA'`, warm borders `#E8E2D8`).
  When editing those screens, use their local tokens. Do not mix the two palettes in
  one screen, and do not "globalize" tokens as a drive-by change.

---

## Common tasks

**Add a screen**
1. Create `app/<name>.tsx` (default export).
2. Register it in the root `Stack` in `app/_layout.tsx` (`<Stack.Screen name="..." />`).
3. Navigate with `router.push('/<name>')`.

**Add a tab**
1. Create `app/(tabs)/<name>.tsx`.
2. Add `<Tabs.Screen name="<name>" />` in `app/(tabs)/_layout.tsx`.
3. Add a label/icon entry to `tabConfig` in the custom `Bar`.

**Add persisted state**
Extend `Settings` or `Data` in `src/store.tsx`, add the field to `DEF`, and access it
through `useSettings` / `useData`. Bump the storage key only for a breaking migration.

**Location / prayer times**
Use `usePrayerLocation()` for coordinates, `tz`, and method; do not read
`settings.city` directly for calculations. GPS is used when `settings.geo` is true and a
fix exists; otherwise the city preset is the fallback. `settings.geoAsked` makes the
automatic permission prompt happen only once — explicit user actions may prompt again.
Never request background location.

**Add an adhkar set / dua / city**
Adhkar sets come from `src/azkar.json` plus `CORE_META` in `src/data.ts`; duas and
cities are static arrays in `src/data.ts`. Follow existing interfaces (`ASet`, `Dua`,
`City`) and keep references accurate.

**Change Quran data**
Edit `scripts/fetch-quran.mjs`, run `npm run fetch:quran`, and confirm the script's
integrity checks (SHA-256, 6,236 ayahs, per-surah numbering) pass. Never patch the JSON
directly.

---

## Known pitfalls

- `expo-audio` API differs from the legacy `expo-av`: it uses `useAudioPlayer`,
  `useAudioPlayerStatus`, `player.replace(...)`, `seekTo`, and `setAudioModeAsync`.
- Full-surah audio uses `cdn.islamic.network`; per-ayah audio uses `everyayah.com`.
  They are separate players — avoid leaking listeners or timers when both are active.
- The reader computes dynamic pages from font size; changing `fontIdx` or reader mode
  can invalidate the current page index. Clamp page state after such changes.
- Web has no reliable compass on most desktops; qibla falls back to manual after ~2.6 s.
- AsyncStorage hydration is asynchronous — gate UI that depends on persisted data on
  `hydrated` / `ready` to avoid flicker.
- `noor:v2` is the storage key even though the brand is Ather; changing it silently
  wipes user data.
- Location permission is foreground-only. If it is denied, the app sets `geo: false`
  and falls back to the selected city; do not loop permission requests on launch.
- GPS gives coordinates, not a time zone. `usePrayerLocation()` uses the device time
  zone; if the phone's clock/time zone is wrong, prayer times will be shifted.
- Coordinates are persisted locally (`geoLat`/`geoLng`/`geoAt`) for offline starts.
- `app.json` sets the brand to Ather (`athar-app`, `com.athar.app`), while `README.md`
  and some copy still say «القرآن والأذكار» and “Expo SDK 54.” The installed SDK is 58.
- No `.git` directory: avoid commands that assume version control; create backups of
  large files before risky rewrites.

---

## Verification checklist

- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build:web` succeeds and the app loads at phone width and desktop width.
- [ ] RTL layout and Arabic numerals look correct; no clipped diacritics.
- [ ] Light and dark modes both render; no hard-coded light-only text colors.
- [ ] Offline behavior still works for reading flows.
- [ ] Location permission prompt appears once; denial still yields prayer times from
  the selected city.
- [ ] No new network calls, tracking, or storage keys introduced.
- [ ] Religious text/provenance untouched unless the task explicitly requires it.
