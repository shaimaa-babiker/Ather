/**
 * يجلب نص القرآن الكريم من مجمع الملك فهد لطباعة المصحف الشريف.
 *
 * المصدر الرسمي:
 *  • منصة مطوري برمجيات القرآن الكريم — مجمع الملك فهد لطباعة المصحف الشريف
 *    https://qurancomplex.gov.sa/quran-dev/
 *  • الملف: UthmanicHafs_v2-0.zip  (الإصدار 13.0 — خط الرسم العثماني، رواية حفص)
 *    داخله: hafsData_v2-0.json  (6236 آية، مع الجزء والصفحة وبداية السطر ونهايته)
 *  • النص يونيكود (Unicode) مطابق لمصحف المدينة النبوية، والملف موقّع ببصمة
 *    SHA-256 منشورة: a7b0e5591945712ec5e4d6142938ae4d1e9b49bdc89dff06222789bfebdfd72c
 *
 * ملاحظة حول الرابط:
 *  بعد إعادة إطلاق موقع المجمع (2026) صار رابط التنزيل القديم يعيد 404، فيُجرَّب أولاً
 *  ثم يُستخدم أرشيف مطابق للملف بايت ببايت (quran-ws/kfgqpc-resources) — مع التحقق
 *  من البصمة نفسها قبل القراءة. الملف الأصلي لم يُعدَّل.
 *
 * البيانات المساندة (مكية/مدنية، الحزب):
 *  من quran-data.xml لمشروع تنزيل (CC BY 3.0) — بيانات وصفية فقط، لا نص قرآني.
 *
 * المخرجات: src/quran.json
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';

// ── عناوين الملف الرسمي والمرآة المطابقة ────────────────────────────
const OFFICIAL_ZIP = 'https://download.qurancomplex.gov.sa/resources_dev/UthmanicHafs_v2-0.zip';
const MIRROR_ZIP   = 'https://cdn.quran.ws/KFGQPC/resources/quran-dev/uthmanic-hafs/UthmanicHafs_v2-0.zip';
const EXPECTED_SHA = 'a7b0e5591945712ec5e4d6142938ae4d1e9b49bdc89dff06222789bfebdfd72c';
const META_URL     = 'https://tanzil.net/res/text/metadata/quran-data.xml';

// ── احتياطي: الحزب ومكية/مدنية لكل سورة (مأخوذة مرة واحدة من quran-data.xml)
// [الحزب عند أول آية] — 114 سورة
const FALLBACK_HIZB = [
  1,1,5,8,11,13,16,18,19,21,22,24,25,26,27,27,29,30,31,
  32,33,34,35,35,36,37,38,39,40,41,41,42,42,43,44,44,45,46,
  46,47,48,49,49,50,50,51,51,51,52,52,52,53,53,53,54,54,54,
  55,55,55,55,56,56,56,56,56,57,57,57,57,57,58,58,58,58,58,
  58,59,59,59,59,59,59,59,59,59,60,60,60,60,60,60,60,60,60,
  60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60,
];
// 'M' مكية · 'D' مدنية — 114 سورة
const FALLBACK_PLACE =
  'MDDDDMMDDMMMDMMMMMMMMDMDMMMMMMMMDMMMMMMMMMMMMMDDDMMMMMDMDDDDDDDDDD' +
  'MMMMMMMMMDMMMMMMMMMMMMMMMMMMMMMDDMMMMMMMMMMDMMMM';

// ── أدوات مساعدة ────────────────────────────────────────────────────
// أسماء تُعرض باصطلاح الإملاء الحديث (الرسم في ملف المجمع واحد، وهذا للعرض فقط)
const DISPLAY_NAMES = { 'الشوري': 'الشورى' };

const stripDiacritics = (s) =>
  s
    .replace(/\u0671/g, 'ا')
    .replace(/[\u064B-\u065F\u0670\u0653\u06D6-\u06ED\u0640]/g, '')
    .trim();

async function fetchBuffer(url, timeout = 180_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'quran-and-adhkar/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

// ── قارئ ZIP مصغّر (بدون تبعيات): يقرأ أول مدخل يطابق اسمه ──────────
function findEocd(buf) {
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66_000); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error('ملف ZIP غير صالح (EOCD)');
}

function extractZipEntry(buf, match) {
  const eocd = findEocd(buf);
  const count = buf.readUInt16LE(eocd + 10);
  const cdOff = buf.readUInt32LE(eocd + 16);
  let p = cdOff;

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('فهرس ZIP تالف');
    const method     = buf.readUInt16LE(p + 10);
    const compSize   = buf.readUInt32LE(p + 20);
    const nameLen    = buf.readUInt16LE(p + 28);
    const extraLen   = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff   = buf.readUInt32LE(p + 42);
    const name       = buf.toString('utf8', p + 46, p + 46 + nameLen);

    if (match(name)) {
      if (buf.readUInt32LE(localOff) !== 0x04034b50) throw new Error('ترويسة ZIP تالفة');
      const lNameLen  = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const start     = localOff + 30 + lNameLen + lExtraLen;
      const data      = buf.subarray(start, start + compSize);
      return method === 0 ? data : inflateRawSync(data);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error('لم يُعثر على الملف داخل ZIP: ' + match.toString());
}

// ── قراءة quran-data.xml (أسماء السور، مكية/مدنية، أرباع الأحزاب) ───
const attrMap = (s) =>
  Object.fromEntries([...s.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

function parseTanzilMeta(xml) {
  const collect = (re) => [...xml.matchAll(re)].map((m) => attrMap(m[1]));
  const suras = collect(/<sura\s+([^>]*?)\/>/g).map((a) => ({
    index: +a.index,
    ayas: +a.ayas,
    name: a.name,
    type: a.type,
  }));
  const quarters = collect(/<quarter\s+([^>]*?)\/>/g).map((a) => ({
    index: +a.index,
    sura: +a.sura,
    aya: +a.aya,
  }));

  if (suras.length !== 114) throw new Error('عدد السور في البيانات الوصفية غير مكتمل');
  if (quarters.length !== 240) throw new Error('عدد أرباع الأحزاب غير مكتمل');

  let offset = 0;
  const start = {};
  for (const s of suras.sort((a, b) => a.index - b.index)) {
    start[s.index] = offset;
    offset += s.ayas;
  }
  if (offset !== 6236) throw new Error(`عدد الآيات في البيانات الوصفية ${offset} ≠ 6236`);

  const quartersByPos = quarters
    .map((q) => ({ ...q, pos: start[q.sura] + q.aya - 1 }))
    .sort((a, b) => a.pos - b.pos);

  return { suras, quarters: quartersByPos, start };
}

function pick(list, pos) {
  let found = list[0];
  for (const x of list) {
    if (x.pos <= pos) found = x;
    else break;
  }
  return found;
}

// ── التنزيل والتحقق ─────────────────────────────────────────────────
console.log('⬇  جلب ملف مجمع الملك فهد (خط الرسم العثماني — حفص)…');

let zip = null;
let usedUrl = '';
for (const url of [OFFICIAL_ZIP, MIRROR_ZIP]) {
  try {
    zip = await fetchBuffer(url);
    usedUrl = url;
    break;
  } catch (e) {
    console.warn(`  تعذّر ${url} — ${e.message}`);
  }
}
if (!zip) {
  console.error('✗ تعذّر جلب ملف المجمع. تحقق من الاتصال ثم أعد المحاولة.');
  process.exit(1);
}

const sha = createHash('sha256').update(zip).digest('hex');
if (sha !== EXPECTED_SHA) {
  console.error(`✗ بصمة الملف غير مطابقة!\n  المتوقع: ${EXPECTED_SHA}\n  المحسوب: ${sha}`);
  process.exit(1);
}
console.log(`✓ البصمة مطابقة (SHA-256) — ${usedUrl.includes('qurancomplex.gov.sa') ? 'الرابط الرسمي' : 'مرآة مطابقة'}`);

// ── استخراج JSON الرسمي ─────────────────────────────────────────────
const jsonBuf = extractZipEntry(zip, (n) => n.endsWith('hafsData_v2-0.json'));
let rows;
try {
  rows = JSON.parse(jsonBuf.toString('utf8'));
} catch (e) {
  console.error('✗ تعذّر قراءة JSON الرسمي: ' + e.message);
  process.exit(1);
}

if (!Array.isArray(rows) || rows.length !== 6236) {
  console.error(`✗ عدد الآيات غير متوقع: ${Array.isArray(rows) ? rows.length : '—'} (المتوقع 6236)`);
  process.exit(1);
}

// ── إزالة علامة رقم الآية من نهاية النص (التطبيق يرسم علامة ﴿﴾ بنفسه)
// كل صف ينتهي بمسافة ثم رمز من Arabic Presentation Forms-A (U+FB50–U+FDFF)
const cleanText = (s) => s.replace(/[\s\u00A0]+[\uFB50-\uFDFF]$/u, '').trim();

const bySura = new Map();
for (const row of rows) {
  const n = +row.sura_no;
  if (!bySura.has(n)) bySura.set(n, []);
  bySura.get(n).push(row);
}

// ── البيانات الوصفية (أسماء/مكية/حزب) مع احتياطي محلي ────────────────
let meta = null;
try {
  const xml = (await fetchBuffer(META_URL, 90_000)).toString('utf8');
  meta = parseTanzilMeta(xml);
  console.log('✓ البيانات الوصفية: quran-data.xml (تنزيل)');
} catch (e) {
  console.warn(`⚠ تعذّر جلب البيانات الوصفية (${e.message}) — استخدام الجدول الاحتياطي`);
}

// ── بناء السور ──────────────────────────────────────────────────────
const surahs = [];
let globalPos = 0;

for (let n = 1; n <= 114; n++) {
  const arr = (bySura.get(n) || []).sort((a, b) => a.aya_no - b.aya_no);
  if (!arr.length) throw new Error(`السورة ${n} بلا آيات`);

  arr.forEach((r, i) => {
    if (+r.aya_no !== i + 1) throw new Error(`ترقيم آيات السورة ${n} غير متصل`);
  });

  const text = arr.map((r) => {
    const t = cleanText(r.aya_text || '');
    if (!t) throw new Error(`آية فارغة في السورة ${n}`);
    if (/<[^>]+>/.test(t)) throw new Error(`وسم HTML في السورة ${n}`);
    return t;
  });

  const m = meta?.suras[n - 1];
  if (m && m.ayas !== arr.length) {
    throw new Error(`عدد آيات السورة ${n} غير مطابق (${arr.length} ≠ ${m.ayas})`);
  }

  const first = arr[0];
  const hizb = meta
    ? Math.ceil(pick(meta.quarters, globalPos).index / 4)
    : FALLBACK_HIZB[n - 1] ?? 1;

  const rawName = stripDiacritics(String(first.sura_name_ar || '')) || m?.name || '';

  surahs.push({
    n,
    // اسم السورة من ملف المجمع نفسه (بدون تشكيل للعرض في القوائم)
    ar: DISPLAY_NAMES[rawName] || rawName,
    en: String(first.sura_name_en || '').trim(),
    ayat: arr.length,
    place: meta
      ? (m.type === 'Meccan' ? 'مكية' : 'مدنية')
      : (FALLBACK_PLACE[n - 1] === 'M' ? 'مكية' : 'مدنية'),
    juz: +first.jozz,
    hizb,
    page: +first.page,
    text,
  });

  globalPos += arr.length;
}

if (globalPos !== 6236) throw new Error(`مجموع الآيات ${globalPos} ≠ 6236`);

// ── كتابة الملف ─────────────────────────────────────────────────────
const totalAyat = surahs.reduce((sum, s) => sum + s.ayat, 0);

await mkdir('src', { recursive: true });
await writeFile(
  'src/quran.json',
  JSON.stringify(
    {
      source:          'https://qurancomplex.gov.sa/quran-dev/',
      publisher:       'مجمع الملك فهد لطباعة المصحف الشريف — المدينة المنورة',
      textSource:      'مجمع الملك فهد لطباعة المصحف الشريف — خط الرسم العثماني (رواية حفص)',
      textSourceUrl:   'https://qurancomplex.gov.sa/quran-dev/',
      edition:         'KFGQPC Uthmanic Script HAFS — hafsData v13.0',
      version:         '13.0',
      archive:         'UthmanicHafs_v2-0.zip',
      officialUrl:     OFFICIAL_ZIP,
      downloadUrl:     usedUrl,
      mirrorUrl:       MIRROR_ZIP,
      sha256:          EXPECTED_SHA,
      license:
        'منصة مطوري برمجيات القرآن الكريم — المجمع: «يمكن استخدامه في تطوير التطبيقات والبرمجيات». النص لا يُعدَّل.',
      metadataSource:  META_URL,
      rasm:            'مصحف المدينة النبوية',
      riwaya:          'حفص عن عاصم',
      fetchedAt:       new Date().toISOString(),
      surahs,
    },
    null,
    0,
  ),
  'utf8',
);

console.log('✓ تم الحفظ: src/quran.json');
console.log(`  ${surahs.length} سورة · ${totalAyat} آية · رسم عثماني (حفص)`);
console.log(`  النص: مجمع الملك فهد — الإصدار 13.0 (SHA-256 موثّق)`);
console.log(`  الهيكل: jozz/page وأسماء السور من ملف المجمع · الحزب ومكية/مدنية من ${meta ? 'quran-data.xml' : 'الجدول الاحتياطي'}`);
