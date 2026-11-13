import { expect, test, type Page } from '@playwright/test';
import { YAYIMLANAN } from '../src/data/icerik';
import { buildModel, reply } from './opex-fixture';

/**
 * Yalın Türkçe kuralları (Claude ve Codex ortak kural seti, 10 Kasım 2026). Kullanıcı kararı 11 Kasım 2026: sitenin
 * bütün sayfaları bu kurallara uyar. Onboarding'in kendi dil testleri vardır (onboarding.spec.ts).
 *
 * Test her sayfayı açar. Kapalı panelleri, anahtarları ve sekmeleri tek tek açar. Görünen metni bloklara ayırır.
 * Grafiklerin ekran okuyucu özetinde yalnız işaretler denetlenir. Özet bir veri listesidir. Kod blokları (JSON çıktısı)
 * denetlenmez.
 *
 * Kurallar:
 * - Noktalı virgül, uzun çizgi ve orta nokta kullanılmaz. Boş hücredeki tek `—` bir veri işaretidir, serbesttir.
 * - Gün sırası “Gün 30” biçiminde yazılmaz. Gün aralığı “1. ile 3. gün” biçiminde yazılmaz.
 * - Tam cümlede okla fikir bağlanmaz.
 * - Açıklama cümlesi en çok 15, talimat cümlesi en çok 10 kelimedir.
 * - Açıklama “Etiket: açıklama.” biçiminde kurulmaz. Kısa değer alanı (“Kayıt: Yalnız bu tarayıcı”) serbesttir.
 *
 * İstisnalar (kullanıcı kararı 11 Kasım 2026): Arşiv sayfası tahtadaki notların aynen kopyasıdır. Aynen korunan
 * alıntı değiştirilmez. Kaynak künyesi (`data-yalin="kunye"`) yayın adı ve başlıktır, etiket dizisi sayılmaz. Google
 * Sheets’ten gelen metin (`data-kaynak="sheets"`) site metni değildir, Sheets’te düzeltilir.
 */

const ATLA = new Set(['/onboarding/', '/arsiv/']);
const SAYFALAR = [
  ...YAYIMLANAN.map((k) => k.path).filter((p) => !ATLA.has(p)),
  '/istihdam/?surum=v2',
  '/satis-ortakligi/?surum=v2',
];

const ENDPOINT = 'https://script.google.com/macros/s/AKfycbTestDeploymentId_1234567890abcdef/exec';
const KEY = 'opex_test_anahtari_123';
const MODEL = buildModel();

/** Sayfanın görünen metnini bloklara ayırır. Satır içi öğeler birleşir, blok öğeler ayrı blok olur. */
function bloklar() {
  const INLINE = new Set(['A', 'SPAN', 'STRONG', 'EM', 'B', 'I', 'CODE', 'SMALL', 'ABBR', 'TIME', 'SUB', 'SUP', 'MARK', 'Q', 'KBD', 'S', 'U', 'DATA', 'VAR', 'BDI', 'DFN', 'CITE']);
  const ATLANAN = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'svg', 'CANVAS', 'PRE', 'IFRAME', 'INPUT', 'TEXTAREA', 'SELECT']);
  const out: { metin: string; tur: 'blok' | 'hucre' | 'baslik' | 'kunye' | 'ozet' }[] = [];
  let tampon = '';
  let tur: 'blok' | 'hucre' | 'baslik' | 'kunye' = 'blok';
  const bosalt = () => {
    const t = tampon.replace(/\s+/g, ' ').trim();
    if (t) out.push({ metin: t, tur });
    tampon = '';
  };
  const gez = (n: Node) => {
    if (n.nodeType === 3) {
      tampon += n.nodeValue ?? '';
      return;
    }
    if (n.nodeType !== 1) return;
    const el = n as HTMLElement;
    if (ATLANAN.has(el.tagName) || el.dataset.kaynak === 'sheets' || el.classList.contains('chart-fallback') || el.classList.contains('visually-hidden') || el.getAttribute('aria-hidden') === 'true') return;
    const cs = getComputedStyle(el);
    const satirIci = cs.display === 'none' ? INLINE.has(el.tagName) : cs.display === 'inline' || cs.display === 'contents';
    if (satirIci && el.tagName !== 'BR') {
      for (const c of el.childNodes) gez(c);
      return;
    }
    bosalt();
    const eski = tur;
    if (/^H[1-6]$/.test(el.tagName) || el.matches('.chart-title, .block-title, .note-title, caption, legend')) tur = 'baslik';
    // Dar ekrandaki kayıt başlığı, geniş ekrandaki satır başlığı hücresinin karşılığıdır.
    else if (el.tagName === 'TD' || el.tagName === 'TH' || el.classList.contains('kayit-ad')) tur = 'hucre';
    else if (el.dataset.yalin === 'kunye') tur = 'kunye';
    for (const c of el.childNodes) gez(c);
    bosalt();
    tur = eski;
  };
  // Sayfa içeriği ve alt bilgi denetlenir. Alt bilgi her sayfada kapsam cümlesini taşır.
  for (const kok of [document.querySelector('main'), document.querySelector('.app-footer')]) if (kok) gez(kok);
  bosalt();
  for (const c of document.querySelectorAll('main .chart-canvas[aria-label]')) out.push({ metin: c.getAttribute('aria-label') ?? '', tur: 'ozet' });
  return out;
}

/** Kapalı panelleri ve anahtarları tek tek açar. Her açılıştan sonra blokları toplar. */
async function hepsiniTopla(page: Page) {
  const toplanan = new Map<string, string>();
  const ekle = async () => {
    for (const b of await page.evaluate(bloklar)) toplanan.set(`${b.tur}\u0000${b.metin}`, b.tur);
  };
  const SEC = 'main button[aria-expanded="false"]:not([aria-haspopup]), main [role="switch"][aria-checked="false"]';
  const ac = async () => {
    for (let tur = 0; tur < 3; tur++) {
      const n = await page.locator(SEC).count();
      if (!n) break;
      for (let i = 0; i < Math.min(n, 80); i++) {
        const b = page.locator(SEC).first();
        if (!(await b.count())) break;
        const tiklandi = await b.evaluate((x) => (x.closest('nav') ? false : ((x as HTMLElement).click(), true))).catch(() => false);
        if (!tiklandi) break;
        await page.waitForTimeout(80);
        await ekle();
      }
    }
  };
  await ekle();
  await ac();
  const sekmeler = page.locator('main [role="tab"]');
  const sekmeSayisi = await sekmeler.count();
  for (let i = 0; i < sekmeSayisi; i++) {
    if (!(await sekmeler.nth(i).isVisible().catch(() => false))) continue;
    await sekmeler.nth(i).click().catch(() => undefined);
    await page.waitForTimeout(150);
    await ac();
    await ekle();
  }
  return [...toplanan].map(([k, tur]) => ({ metin: k.split('\u0000')[1], tur }));
}

/** Kelime sayımı: boşlukla ayrılan kelime, sayı ve ayrı yazılan birim (€, ₺) birer kelimedir. */
const kelimeler = (cumle: string) =>
  cumle
    .split(/\s+/)
    .map((k) => k.replace(/^[“”"'‘’()[\]:,.!?…]+|[“”"'‘’()[\]:,.!?…]+$/gu, ''))
    .filter((k) => /[\p{L}\p{N}\p{Sc}]/u.test(k));
/** Cümlelere böler. Ondalık ayırıcı ve sıra sayısı (“3. gün”) cümleyi bitirmez. */
const cumleler = (metin: string) =>
  metin
    .replace(/(\d)\.(\d)/g, '$1§$2')
    .replace(/(\d+)\.(\s+)(?=[a-zçğıöşü“"])/gu, '$1§$2')
    .split(/(?<=[.!?…]["”’']?)\s+(?=["“'‘(]?[\p{Lu}\d"“[])/u)
    .map((c) => c.replace(/§/g, '.').trim())
    .filter((c) => /\p{L}/u.test(c));
const TALIMAT_DEGIL = new Set(['için', 'bugün', 'gün', 'dün', 'bütün', 'yalın', 'yakın', 'kalın', 'altın', 'uzun', 'onun', 'bunun', 'şunun', 'kimin', 'uygun', 'yorgun', 'düzgün', 'üzgün', 'olgun', 'sürgün', 'yazın', 'kadın', 'sonun', 'ürün', 'çözün', 'kalkın', 'hızın', 'içerin', 'tahmin', 'tahmini', 'izin']);
/** Emir kipiyle biten cümle talimattır: “arayın.”, “seçin.” Bu bir tahmindir. */
const talimatMi = (cumle: string) => {
  const son = kelimeler(cumle).at(-1)?.toLocaleLowerCase('tr-TR') ?? '';
  if (son === 'yazın') return /yazın[.!]?["”]?$/u.test(cumle.trim());
  return son.length >= 4 && !TALIMAT_DEGIL.has(son) && /(y?[ıiuü]n|y?[ıiuü]n[ıiuü]z)$/u.test(son);
};

/** Bir bloğun ihlalleri. Boş dizi: blok kurallara uyar. */
function ihlaller(metin: string, tur: string) {
  const sonuc: string[] = [];
  if (metin.includes(';')) sonuc.push('noktalı virgül');
  // Boş hücredeki tek “—” veri işaretidir. İşareti tırnak içinde anlatan açıklama da serbesttir.
  if (metin.replace(/“—”/g, '').includes('—') && metin.trim() !== '—') sonuc.push('uzun çizgi');
  if (metin.includes('·')) sonuc.push('orta nokta');
  if (/(?:^|[\s(“"'])(?:gün|Gün|GÜN)\s+\d+/u.test(metin)) sonuc.push('“Gün 30” biçimi');
  if (/\d+\. ile \d+\. gün/u.test(metin)) sonuc.push('“1. ile 3. gün” biçimi');
  // Başlık, künye ve grafik özeti cümle değil, ad ya da veri listesidir. Bunlarda yalnız işaretler denetlenir.
  if (tur === 'baslik' || tur === 'kunye' || tur === 'ozet') return sonuc;
  const tamCumle = /[.!?…]["”]?$/.test(metin) || /[.!?…]["”]?\s/.test(metin);
  if (tamCumle && /[→⇒]/.test(metin) && kelimeler(metin).length >= 7) sonuc.push('okla fikir bağlama');
  // Kısa değer alanı (en çok 3 kelime, noktasız) cümle sayılmaz.
  if (kelimeler(metin).length <= 3 && !/[.!?…]$/.test(metin)) return sonuc;
  if (tur !== 'hucre' && tur !== 'ozet') {
    const etiket = metin.match(/^([\p{Lu}][\p{L} ]{0,24}):\s+(.+)$/u);
    if (etiket) {
      const deger = etiket[2].trim();
      const veriAlani = kelimeler(deger).length <= 3 && !/[.!?…]$/.test(deger);
      // Yüklemli giriş liste başlatır ve serbesttir: “En büyük bloklar şunlardır:”, “Şu belgeyi ekleyin:”.
      const giris = etiket[1].trim();
      const yuklemli = giris.split(/\s+/).length >= 2 && /(d|t)[ıiuü]r$|şöyle$|\p{L}+(ılır|ilir|ulur|ülür|nır|nir|nur|nür)$|\p{L}+(y?[ıiuü]n|y?[ıiuü]n[ıiuü]z)$/u.test(giris);
      if (!veriAlani && !yuklemli) sonuc.push('etiket dizisi');
    }
  }
  for (const c of cumleler(metin)) {
    const n = kelimeler(c).length;
    const talimat = talimatMi(c);
    const sinir = talimat ? 10 : 15;
    if (n > sinir) sonuc.push(`${talimat ? 'talimat' : 'açıklama'} ${n} kelime (en çok ${sinir}): ${c}`);
  }
  return sonuc;
}

test.describe('yalın Türkçe: sitenin bütün sayfaları', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'metin tarayıcıdan bağımsızdır, yalnız Chromium’da denetlenir');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(([endpoint, key]) => localStorage.setItem('istoc-opex-baglanti', JSON.stringify({ endpoint, key })), [ENDPOINT, KEY]);
    await page.route('https://script.google.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(MODEL, 'ozet-1')) }).catch(() => undefined),
    );
  });

  for (const yol of SAYFALAR) {
    test(`${yol}: noktalama, gün yazımı, etiket dizisi ve cümle uzunluğu`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.goto(yol.slice(1));
      await page.waitForSelector('.app-footer', { state: 'attached' });
      await page.waitForLoadState('networkidle');
      let toplanan = await hepsiniTopla(page);
      // Applet sayfasında bir anda tek applet çizilir. Her applet kendi adresinde ayrı denetlenir.
      const adresler =
        yol === '/applet/' ? await page.evaluate(() => [...new Set([...document.querySelectorAll('main a[href^="#"], nav a[href^="#"]')].map((a) => a.getAttribute('href') ?? '').filter((h) => h.length > 1))]) : [''];
      if (yol === '/applet/') expect(adresler.length, 'applet adresleri').toBeGreaterThan(10);
      // Geniş ekranda (1280 px) ve dar ekranda (375 px) denetlenir. Dar ekranda tablo kayıt listesine, grafik eşdeğer
      // listeye ve Gantt ajandaya dönüşür. Bu kabukların metni de kurala uyar.
      for (const genislik of [1280, 375]) {
        await page.setViewportSize({ width: genislik, height: genislik === 1280 ? 900 : 812 });
        for (const h of adresler) {
          if (genislik === 1280 && h === '') continue;
          await page.goto(`${yol.slice(1)}${h}`);
          await page.waitForSelector('.app-footer', { state: 'attached' });
          toplanan = toplanan.concat(await hepsiniTopla(page));
        }
      }
      const bulgular = new Set<string>();
      for (const { metin, tur } of toplanan) for (const i of ihlaller(metin, tur)) bulgular.add(`[${i}] ${metin.slice(0, 220)}`);
      expect([...bulgular], [...bulgular].join('\n')).toEqual([]);
    });
  }
});
