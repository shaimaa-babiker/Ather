# Project Scope — أثر (Ather)

> Quran, adhkar, duas, the 99 Names, qibla, and prayer times — a fully offline-first
> Arabic/RTL app for iOS, Android, and the web, built with Expo + React Native.

Last updated: 2026-11-20

---

## 1. Vision

A calm, ad-free, account-free companion for daily worship. The app should feel like a
quiet reading room: beautiful Arabic typography, accurate religious text, no tracking,
and nothing between the user and the content. Everything except recitation audio works
offline.

**Product name:** أثر (Ather) — "a lasting trace."
**Tagline:** أثرٌ باقٍ ونورٌ للقلوب
**Package / slug:** `com.athar.app` · `athar-app` · scheme `atharapp`

> The repository and some copy still use the older working title «القرآن والأذكار»
> ("Quran and Adhkar"). Ather is the current brand.

---

## 2. Target users

| Segment | Need |
|---|---|
| Arabic-speaking Muslims, daily practice | Fast access to Quran, morning/evening adhkar, duas |
| Commuters / low-connectivity users | Full offline text, cached content, audio on demand |
| New learners | Clear Arabic (Tajawal/Amiri), tashkeel toggle, prayer-time guidance |
| Tablet / desktop readers | Responsive web build with a centered phone-width reading frame |

Primary language is Arabic (RTL). No localization framework is in scope yet.

---

## 3. In scope — shipped features

### 3.1 Quran
- Complete 6,236 ayahs, 114 surahs, Uthmanic Hafs script (King Fahd Complex v13.0).
- Surah list with search (Arabic name, English name, number, juz, hizb), Makki/Madani
  filter, favorites filter, last-read position, and juz/hizb/page metadata.
- Surah reader:
  - Swipe (page) and vertical (continuous) reading modes.
  - Dynamic pagination based on font size; four Quran font sizes.
  - Tashkeel display toggle, dark/light mode, fullscreen reader controls.
  - Per-ayah selection with copy/share and per-ayah audio (everyayah.com, Alafasy).
  - Full-surah audio player with play/pause, seek, next/prev, speed, loop, mute,
    auto-advance, and a persistent mini-player.
  - Quick index modal with surah search.
- Source attribution (King Fahd Complex, riwaya, rasm, version) shown in-app.

### 3.2 Adhkar (Hisn al-Muslim)
- Morning and evening hero sets with completion state, daily tracking, and streaks.
- 128 chapters / 267 adhkar loaded from `src/azkar.json` (generated).
- Interactive counter per dhikr with target count, progress, completion celebration.
- Search across adhkar titles and text; per-dhikr favorites; morning/evening tashkeel.
- Takhrīj (hadith grading) for morning/evening adhkar from the Seen-Arabic database
  where available.

### 3.3 Duas
- Curated daily duas (Quranic and ma'thur), categories, search, favorites.
- Detail sheet with text, reference, note, copy, and share.

### 3.4 Names of Allah
- 99 names with Arabic, transliteration, and a short meaning.
- Search (Arabic stripped of diacritics, transliteration, meaning) and favorites.

### 3.5 Qibla & prayer times
- Great-circle qibla bearing to the Kaaba (21.4225°N, 39.8262°E).
- Compass mode using `expo-sensors` Magnetometer (native) or device orientation (web),
  with animated needle and automatic fallback to manual calibration.
- Manual dial mode with drag calibration.
- Prayer times for a city presets list using six calculation methods (Umm al-Qura,
  MWL, Egyptian, Karachi, ISNA, Diyanet), Hanafi/Standard Asr, 12/24-hour clock,
  Ramadan Isha adjustment, and next-prayer highlight.

### 3.6 Home, favorites, settings
- Home: greeting, Hijri/Gregorian date, next prayer, last read, quick hubs, daily
  adhkar card, streak.
- Favorites: unified list of surahs, names, adhkar, and duas with filters and undo.
- Settings: dark mode, accent theme, Quran font size, tashkeel, reminders card,
  Hijri offset (±2 days), city, calculation method, time format, auto-next, reader mode,
  clear favorites, full reset (with undo).
- Onboarding splash (skippable) with cinematic mosque photography and a Quranic verse.

### 3.7 Platform behavior
- Offline-first: all text ships in the bundle; only audio streams.
- Local-only persistence via AsyncStorage (`noor:v2`). No accounts, servers, analytics,
  ads, or tracking.
- RTL everywhere; Arabic-Indic numerals; Arabic date formatting.
- Web: single-page static export, centered 430 px app frame on desktop, custom
  scrollbars, favicon, document title/lang/dir, keyboard focus styles.
- Light/dark palettes and three accent presets (royal, emerald, dusk).

---

## 4. Out of scope (for now)

- User accounts, cloud sync, or cross-device backup.
- Push notifications for prayer times (the settings toggle is a UI hook, not a scheduler).
- Tafsir, translations, transliteration of the Quran, word-by-word study tools.
- Audio downloads / offline audio caching.
- Additional languages or an i18n framework.
- Hifz/memorization plans, quizzes, or gamification beyond streaks.
- Social features, sharing feeds, or community content.
- In-app purchases, subscriptions, ads.
- Native app-store submission assets (screenshots, store listings) and CI/CD.
- Automated test suite, linting, and CI (not yet configured).

---

## 5. Data & content requirements

| Content | Source | Rule |
|---|---|---|
| Quran text, juz, page, surah names | King Fahd Complex (Quran Dev platform), v13.0, SHA-256 verified | Never edit the text; regenerate via `npm run fetch:quran` |
| Makki/Madani, hizb | Tanzil `quran-data.xml` (CC BY 3.0), metadata only | Regenerated by fetch script |
| Quran font | `uthmanic_hafs_v20.ttf` from the official bundle | Ship unmodified |
| Recitation | Islamic Network CDN, Sheikh Mishary Alafasy | Attribute source; needs network |
| Per-ayah audio | everyayah.com (Alafasy 128 kbps) | Needs network |
| Hisn al-Muslim adhkar | hisnmuslim.com official API | Attribute book and author |
| Morning/evening takhrīj | Seen-Arabic DB (MIT) | Keep license notice |
| Names & meanings | Editorial compilation | Meanings are editorial, not a verbatim source |
| Prayer times / Hijri / qibla | Astronomical + arithmetic calculation | Approximate; defer to local authority |

Religious-content changes must follow `REFERENCES.md`. Do not add hadith numbers or
gradings that have not been checked against a primary/trusted source.

---

## 6. Non-functional requirements

- **Accuracy over features:** Quran text is immutable; provenance and attribution stay
  visible. Ambiguous religious content is flagged for scholarly review.
- **Privacy:** zero network requests except recitation audio; no PII leaves the device.
- **Offline:** cold start and all reading features must work with no connection.
- **Performance:** 1.3 MB Quran JSON is bundled; lists use `FlatList`; memoized derived
  data; no synchronous network work on render.
- **Accessibility:** readable contrast, min ~44 px touch targets, screen-reader labels
  where present, respect for system text sizing where practical.
- **RTL correctness:** logical layout, `writingDirection: 'rtl'`, Arabic-Indic digits.
- **Visual consistency:** navy/silver/white brand palette; calm motion; no aggressive
  animation. Note: several screens still use a legacy per-screen gold design system —
  see `CLAUDE.md`.

---

## 7. Success criteria

- Text parity: 114 surahs, 6,236 ayahs, zero diffs against the verified source.
- Offline pass: all reading, adhkar, duas, names, qibla (manual), and settings work in
  airplane mode.
- Zero PII/network calls beyond audio; storage stays local.
- Store-quality Arabic typography with no clipped diacritics or broken RTL layout.
- Qibla/prayer-time behavior is clearly labeled as approximate where it is.

---

## 8. Constraints & risks

| Risk | Mitigation |
|---|---|
| Source URLs move/404 (King Fahd site relaunch) | Script tries official URL, then a byte-identical mirror, and verifies SHA-256 |
| Compass sensors unavailable (web/desktop, no magnetometer) | Timeout auto-switches to manual mode with a toast |
| Web audio autoplay restrictions | Playback starts from a user gesture; errors surface as toasts |
| Prayer-time method differences | Six methods + city presets + disclaimer; user can change method |
| Hijri date ±1 day | Kuwaiti algorithm is civil, not Umm al-Qura; offset setting ±2 days |
| Legacy/new design systems coexist | Documented in `CLAUDE.md`; new work follows the Serene tokens until unified |
| CDN outage for recitation | Text remains offline; a clear "check connection" error is shown |

---

## 9. Roadmap (candidate, uncommitted)

1. Unify the design system (single token source; remove per-screen palette duplication).
2. Real local notifications for adhkar and prayer times.
3. Offline audio downloads with storage management.
4. Full takhrīj for all Hisn al-Muslim chapters.
5. Quran translation/tafsir layer (opt-in, licensed content).
6. Accessibility pass (labels, dynamic type, reduced motion).
7. Automated tests (data integrity + core flows) and CI.
8. App-store packaging and submission assets.
