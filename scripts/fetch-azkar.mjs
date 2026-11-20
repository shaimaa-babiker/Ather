/**
 * fetch-azkar.mjs — يجلب أذكار «حصن المسلم» من مصادر موثّقة:
 *
 * 1) النص والعدد (المصدر الرسمي للكتاب):
 *    https://www.hisnmuslim.com/api/ar/ — الموقع الرسمي لكتاب «حصن المسلم»
 *    132 باباً · 267 ذكراً · النص مشكول + ملفات صوتية لكل ذكر.
 *    الكتاب: «حصن المسلم من أذكار الكتاب والسنة»
 *    المؤلف: سعيد بن علي بن وهف القحطاني — موقعه الرسمي: https://binwahaf.com
 *
 * 2) تخريج أذكار الصباح والمساء (رخصة MIT):
 *    https://github.com/Seen-Arabic/Morning-And-Evening-Adhkar-DB
 *    كل ذكر معه `source` (رقم الحديث + حكم المحدّث) و`fadl` (الفضل).
 *
 * المخرجات: src/azkar.json
 *
 * تنبيه شرعي: النصوص والأعداد تُنقل حرفياً من المصدر الرسمي ولا نضيف إليها
 * أرقام أحاديث من عندنا. أذكار الاستيقاظ/النوم/بعد الصلاة تبقى في src/data.ts
 * (مشكولة ومخرّجة) وتُراجع قبل النشر. راجع REFERENCES.md.
 */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'src', 'azkar.json');

const OFFICIAL_INDEX = 'https://www.hisnmuslim.com/api/ar/husn_ar.json';
const OFFICIAL_CAT   = 'https://www.hisnmuslim.com/api/ar';
const SEEN_AR        = 'https://raw.githubusercontent.com/Seen-Arabic/Morning-And-Evening-Adhkar-DB/main/ar.json';

// أبواب الكتاب الرسمية التي تغطيها مجموعات التطبيق الأساسية (لتفادي التكرار)
// 27 = أذكار الصباح والمساء (مدمجة) · 1 = الاستيقاظ · 25 = بعد السلام من الصلاة · 28 = النوم
const CORE_CHAPTERS = new Set([27, 1, 25, 28]);

function clean(t) {
  if (!t) return '';
  return String(t)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** سطر واحد بلا أسطر جديدة (للتخريج والفضل) */
const oneLine = (t) => clean(t).replace(/\s+/g, ' ');

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'quran-and-adhkar/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  return res.json();
}

/** يستخرج مصفوفة الأذكار من ملف الباب الرسمي: { "اسم الباب": [ ... ] } */
function chapterItems(json) {
  if (Array.isArray(json)) return json;
  const first = Object.values(json)[0];
  return Array.isArray(first) ? first : [];
}

async function main() {
  console.log('⬇  تحميل فهرس الأبواب من الموقع الرسمي…');
  console.log('   ', OFFICIAL_INDEX);

  const index = await getJSON(OFFICIAL_INDEX);
  const chapters = index['العربية'] || [];
  if (!chapters.length) throw new Error('لم يُعثر على قائمة الأبواب في الفهرس');
  console.log(`✓ ${chapters.length} باباً\n`);

  /* ── 1) النصوص الرسمية لكل باب ─────────────────────────────── */
  const categories = [];
  let total = 0;
  let failed = 0;

  for (const ch of chapters) {
    const id = Number(ch.ID);
    const title = clean(ch.TITLE);
    if (!id || !title) continue;
    if (CORE_CHAPTERS.has(id)) {
      console.log(`  ↷ تخطّي «${title}» (تغطيه مجموعة أساسية)`);
      continue;
    }

    try {
      const json = await getJSON(`${OFFICIAL_CAT}/${id}.json`);
      const items = chapterItems(json)
        .map((x) => ({
          text:  clean(x.ARABIC_TEXT),
          count: Math.max(1, Number(x.REPEAT) || 1),
          ref:   'حصن المسلم',
        }))
        .filter((x) => x.text.length > 3);

      if (!items.length) continue;
      categories.push({ id: String(id), title, items });
      total += items.length;
      console.log(`  · ${title} — ${items.length} ذكر`);
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${title}: ${err.message}`);
    }
  }

  /* ── 2) أذكار الصباح والمساء مع التخريج (MIT) ──────────────── */
  const sets = {};
  try {
    console.log('\n⬇  تحميل تخريج أذكار الصباح والمساء…');
    const seen = await getJSON(SEEN_AR);
    const toSet = (arr) =>
      arr
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((x) => {
          const out = {
            text:  clean(x.content),
            count: Math.max(1, Number(x.count) || 1),
            ref:   oneLine(x.source) || 'حصن المسلم',
          };
          const fadl = oneLine(x.fadl);
          if (fadl) out.virtue = fadl;
          return out;
        })
        .filter((x) => x.text.length > 3);

    // type: 0 = مشترك بين الصباح والمساء · 1 = الصباح فقط · 2 = المساء فقط
    sets.morning = toSet(seen.filter((x) => x.type === 0 || x.type === 1));
    sets.evening = toSet(seen.filter((x) => x.type === 0 || x.type === 2));
    console.log(`  ★ أذكار الصباح — ${sets.morning.length} ذكر`);
    console.log(`  ★ أذكار المساء — ${sets.evening.length} ذكر`);
  } catch (err) {
    console.warn(`  ✗ تعذّر تحميل التخريج (ستبقى المجموعة الثابتة): ${err.message}`);
  }

  const output = {
    source: 'حصن المسلم من أذكار الكتاب والسنة — سعيد بن علي بن وهف القحطاني',
    sourceUrl: 'https://binwahaf.com',
    textApi: OFFICIAL_INDEX,
    takhrijSource: 'https://github.com/Seen-Arabic/Morning-And-Evening-Adhkar-DB (MIT)',
    fetchedAt: new Date().toISOString(),
    sets,
    categories,
  };

  await writeFile(OUT, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\n✅ تم الحفظ في src/azkar.json`);
  console.log(`   الأبواب: ${categories.length} · الأذكار: ${total}`);
  if (failed) console.warn(`   أبواب فشل تحميلها: ${failed}`);
}

main().catch((err) => {
  console.error('✗ فشل التوليد:', err.message);
  process.exit(1);
});
