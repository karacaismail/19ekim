import { expect, test } from './fixtures/persona';
import { buildModel, reply } from './opex-fixture';
import { sayfayiGez, TUM_SAYFALAR } from './sayfa-gezgini';

/**
 * Yalın Türkçe kuralları (Claude ve Codex ortak kural seti, 10 Kasım 2026). Kullanıcı kararı 11 Kasım 2026: sitenin
 * bütün sayfaları bu kurallara uyar. Onboarding'in kendi dil testleri vardır (onboarding.spec.ts).
 *
 * Test her sayfayı açar. Kapalı panelleri, anahtarları, sekmeleri, açılır pencereleri ve seçim listelerini tek tek açar.
 * Ana sayfada üst menüler ve menü çekmecesi de açılır. Görünen metni bloklara ayırır. Sekme adı, sayfa açıklaması,
 * ipuçları (`title`) ve grafik yazıları (eksen, gösterge) da denetlenir. Grafiklerin ekran okuyucu özetinde yalnız
 * işaretler denetlenir. Özet bir veri listesidir. Kod blokları (JSON çıktısı) denetlenmez. Giriş ekranı ve bulunamayan
 * sayfa ayrı testte denetlenir.
 *
 * Kurallar:
 * - Noktalı virgül, uzun çizgi ve orta nokta kullanılmaz. Boş hücredeki tek `—` bir veri işaretidir, serbesttir.
 * - Gün sırası “Gün 30” biçiminde yazılmaz. Gün aralığı “1. ile 3. gün” biçiminde yazılmaz.
 * - Tam cümlede okla fikir bağlanmaz.
 * - Açıklama cümlesi en çok 15, talimat cümlesi en çok 10 kelimedir.
 * - Açıklama “Etiket: açıklama.” biçiminde kurulmaz. Kısa değer alanı (“Kayıt: Yalnız bu tarayıcı”) serbesttir.
 * - Okunur yazım (kullanıcı kararı 13 Kasım 2026): tarih “1 Mayıs 2027, Cumartesi” biçimindedir, ISO tarih yazılmaz.
 *   Ondalık sayı virgülle yazılır (“8,9”). Yüzde işareti sayıdan önce gelir (“%36”). Birim zinciri (“gün/kadın/yıl”)
 *   yerine söz kullanılır (“kadın başına yılda”).
 *
 * İstisnalar (kullanıcı kararı 11 Kasım 2026): Arşiv sayfası tahtadaki notların aynen kopyasıdır. Aynen korunan
 * alıntı değiştirilmez. Kaynak künyesi (`data-yalin="kunye"`) yayın adı ve başlıktır, etiket dizisi sayılmaz. Google
 * Sheets’ten gelen metin (`data-kaynak="sheets"`) site metni değildir, Sheets’te düzeltilir.
 */

const ATLA = new Set(['/onboarding/', '/arsiv/']);
const SAYFALAR = TUM_SAYFALAR.filter((p) => !ATLA.has(p));

const ENDPOINT = 'https://script.google.com/macros/s/AKfycbTestDeploymentId_1234567890abcdef/exec';
const KEY = 'opex_test_anahtari_123';
const MODEL = buildModel();

type Tur = 'blok' | 'hucre' | 'baslik' | 'kunye' | 'ozet' | 'terim';

/**
 * Sayfanın görünen metnini bloklara ayırır. Satır içi öğeler birleşir, blok öğeler ayrı blok olur. Kökler ana içerik,
 * alt bilgi ve ana içeriğin dışında açılan pencerelerdir (menü, seçim listesi, iletişim kutusu, ipucu).
 */
function bloklar(kokSecici = 'main, .app-footer') {
  const INLINE = new Set(['A', 'SPAN', 'STRONG', 'EM', 'B', 'I', 'SMALL', 'ABBR', 'TIME', 'SUB', 'SUP', 'MARK', 'Q', 'KBD', 'S', 'U', 'DATA', 'VAR', 'BDI', 'DFN', 'CITE']);
  // Kod (`code`, `pre`) doğal dil değildir: sürüm numarası ve kimlik kodu denetlenmez.
  const ATLANAN = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'svg', 'CANVAS', 'PRE', 'CODE', 'IFRAME', 'INPUT', 'TEXTAREA', 'SELECT']);
  const out: { metin: string; tur: Tur }[] = [];
  let tampon = '';
  let tur: Tur = 'blok';
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
    // Satır içi kaynak bağlantısı yayın adıdır. Cümlede yer tutucu olarak kalır, adı ayrıca künye olarak kaydedilir.
    if (satirIci && el.dataset.yalin === 'kunye') {
      tampon += ' «kaynak» ';
      out.push({ metin: (el.textContent ?? '').replace(/\s+/g, ' ').trim(), tur: 'kunye' });
      return;
    }
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
    // Sözlük satırı: terim (`dt`) ve hemen ardından tanımı (`dd`). Terim kısaltmanın açılışı sayılır.
    else if (el.tagName === 'DT' && el.nextElementSibling?.tagName === 'DD') tur = 'terim';
    for (const c of el.childNodes) gez(c);
    bosalt();
    tur = eski;
  };
  // Sayfa içeriği ve alt bilgi denetlenir. Alt bilgi her sayfada kapsam cümlesini taşır. Ana içeriğin dışında açılan
  // pencereler (menü, seçim listesi, iletişim kutusu, ipucu) ayrıca gezilir.
  const ACILIR = '[role="dialog"], [role="menu"], [role="listbox"], .mantine-Popover-dropdown, .mantine-Tooltip-tooltip';
  const kokler = [...document.querySelectorAll(`${kokSecici}, ${ACILIR}`)].filter((k, i, hepsi) => !hepsi.some((d, j) => j !== i && d !== k && d.contains(k)));
  for (const kok of kokler) gez(kok);
  bosalt();
  for (const kok of kokler) {
    for (const c of kok.querySelectorAll('.chart-canvas[aria-label]')) out.push({ metin: c.getAttribute('aria-label') ?? '', tur: 'ozet' });
    // Grafik yazıları: eksen adı, eksen değeri, gösterge. Kısa değerdir, hücre gibi denetlenir.
    for (const t of kok.querySelectorAll('svg text')) {
      const y = (t.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (y) out.push({ metin: y, tur: 'hucre' });
    }
    // İpucu metni fareyle görünür. Okur onu da okur.
    for (const e of kok.querySelectorAll('[title]')) {
      const y = (e.getAttribute('title') ?? '').trim();
      if (y && y !== (e.textContent ?? '').trim()) out.push({ metin: y, tur: 'blok' });
    }
  }
  if (kokSecici.includes('main')) {
    out.push({ metin: document.title, tur: 'baslik' });
    const aciklama = document.querySelector('meta[name="description"]')?.getAttribute('content');
    if (aciklama) out.push({ metin: aciklama, tur: 'blok' });
  }
  return out;
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
  // Okunur yazım (kullanıcı kararı 13 Kasım 2026): tarih, ondalık sayı, yüzde ve birim okurun diliyle yazılır.
  // Kaynak künyesi yayının kendi adıdır. Künyede bu kurallar uygulanmaz.
  if (tur !== 'kunye') {
    if (/\b\d{4}-\d{2}-\d{2}\b/.test(metin)) sonuc.push('ISO tarih: “1 Mayıs 2027, Cumartesi” biçiminde yazın');
    if (/\b\d{1,2}[./]\d{1,2}[./]\d{4}\b/.test(metin)) sonuc.push('sayılı tarih: “1 Mayıs 2027” biçiminde yazın');
    if (/(?<![\p{L}\d.,])\d{1,3}\.\d{1,2}(?![\d.])/u.test(metin)) sonuc.push('ondalık nokta: “8,9” biçiminde virgülle yazın');
    if (/\d\s?%(?!\d)/.test(metin)) sonuc.push('yüzde: işaret sayıdan önce gelir, “%36” yazın');
    if (/\p{L}+\s*\/\s*\p{L}+\s*\/\s*\p{L}+/u.test(metin)) sonuc.push('birim: “kadın başına yılda” gibi sözle yazın');
  }
  // Başlık, künye ve grafik özeti cümle değil, ad ya da veri listesidir. Bunlarda yalnız işaretler denetlenir.
  if (tur === 'baslik' || tur === 'kunye' || tur === 'ozet') return sonuc;
  const tamCumle = /[.!?…]["”]?$/.test(metin) || /[.!?…]["”]?\s/.test(metin);
  if (tamCumle && /[→⇒]/.test(metin) && kelimeler(metin).length >= 7) sonuc.push('okla fikir bağlama');
  // Kısa değer alanı (en çok 3 kelime, noktasız) cümle sayılmaz.
  if (kelimeler(metin).length <= 3 && !/[.!?…]$/.test(metin)) return sonuc;
  if (tur !== 'hucre' && tur !== 'ozet' && tur !== 'terim') {
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

/**
 * Kısaltma kuralı (kullanıcı kararı 13 Kasım 2026): sayfadaki her kısaltma o sayfada en az bir kez açılır.
 *
 * Kısaltma en az iki büyük harf taşıyan, 2 ile 6 karakterlik kelimedir. Örneğin KVKK, B2B, GA4 ve OpEx kısaltmadır.
 * Açılış biçimleri şunlardır:
 * - Türkçe ad önce, kısaltma parantezde: “ortak sağlık ve güvenlik birimi (OSGB)”. Tercih edilen biçim budur.
 * - Kısaltma önce, açılış hemen ardından parantezde ve bir kelimeyle başlar: “LTV (satıcıdan beklenen gelir)”.
 * - “API, yani yazılım bağlantısı” biçimi.
 * - Sözlükte terim satırı (`dt`) ve hemen ardından tanımı (`dd`).
 *
 * Virgülle sıralanan liste açılış sayılmaz: “(GA4, Yandex Metrica, GTM)”. Okurun her gün bildiği kısaltmalar ve ürün ya
 * da kurum adları serbesttir. Örnek: TL, KDV, SGK, CRM. Kod biçimindeki kimlikler (P1, R12, S01) kısaltma sayılmaz.
 * Kaynak künyesi denetlenmez.
 */
// Okurun her gün gördüğü kısaltmalar.
const BILINEN = new Set(['TL', 'KDV', 'SGK', 'CRM', 'ABD', 'AB', 'USD', 'EUR', 'KOBİ', 'TÜFE', 'GPS', 'GB', 'TB', 'USB', 'LED', 'QR', 'PDF', 'TV', 'DVD', 'HD', 'JSON', 'CSV', 'URL', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII']);
// Marka, ürün ve kurum adları ile satıştaki ürün özelliği adları. Bunlar açılmaz, çünkü adın kendisidir. Örnek: Garanti
// BBVA, TÜV SÜD, Mercer IPE, IPS monitör.
const ADLAR = new Set(['İSTOÇ', 'İBB', 'MEB', 'TÜİK', 'AVM', 'DJI', 'JBL', 'HP', 'ASUS', 'IKEA', 'BMJ', 'DHL', 'UPS', 'PTT', 'MNG', 'BOE', 'NHS', 'PwC', 'EY', 'KPMG', 'OECD', 'IMF', 'TBMM', 'GE', 'BBVA', 'GDX', 'GO', 'RB', 'SGS', 'TÜV', 'SÜD', 'PYMNTS', 'CLS', 'PR', 'MATCH', 'IPE', 'GGS', 'ETA', 'IPS', 'UHF', 'DHgate', 'TikTok', 'CapCut', 'GitLab', 'WTW', 'YouTube']);
// Kullanıcı kararıyla kırıntıda duran ad: “Finans › OpEx › Operasyonel Giderler”. Kırıntıdaki sonraki ad açılımdır.
const KARARLI = new Set(['OpEx']);
// Anlamı kaynakta yazmayan kısaltmalar. Bunlar uydurularak açılmaz, kullanıcıya sorulur. ECA, notlardaki kullanıcı notudur.
const SORULACAK = new Set(['ECA']);
function aciklanmayanKisaltmalar(bloklar: { metin: string; tur: string }[]) {
  const metinler = bloklar.filter((b) => b.tur !== 'kunye').map((b) => b.metin);
  const tum = metinler.join('\n');
  const bulunan = new Set<string>();
  for (const m of tum.matchAll(/(?<![\p{L}\d-])((?=[\p{L}\d]*\p{Lu}[\p{L}\d]*\p{Lu})\p{Lu}[\p{L}\d]{1,5})(?![\p{L}\d-])/gu)) bulunan.add(m[1]);
  const terimler = new Set(bloklar.filter((b) => b.tur === 'terim').map((b) => b.metin.trim()));
  const sonuc: string[] = [];
  for (const k of bulunan) {
    // Ürün model kodu (EAP673, MK295) ve tek harfli kod (P1, R12) kısaltma değildir.
    if (BILINEN.has(k) || ADLAR.has(k) || KARARLI.has(k) || SORULACAK.has(k) || /^\p{Lu}\d+$/u.test(k) || /^\p{Lu}{1,4}\d{2,}$/u.test(k)) continue;
    const kac = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const acik =
      // Kısaltma önce: açılış parantezde bir kelimeyle başlar (yıl ya da birim açılış sayılmaz).
      new RegExp(`(?<![\\p{L}])${kac}(’[\\p{L}]+)?(\\s\\d+)?\\s*\\(\\p{L}\\p{Ll}`, 'u').test(tum) ||
      // Parantez içinde kısaltma ve virgülden sonra açılımı: “(CEO, şirketin en üst yöneticisi)”.
      new RegExp(`\\(${kac},\\s*\\p{Ll}`, 'u').test(tum) ||
      // Türkçe ad önce: kelimeden sonra parantezde yalnız kısaltma. Ürün adının sonu da olabilir: “(Conversions API)”, “(UI/UX)”.
      new RegExp(`[\\p{L}\\d]’?\\p{L}*\\s\\((\\p{L}+[ /])?${kac}(\\s\\p{Ll}+)?[)/]`, 'u').test(tum) ||
      new RegExp(`(?<![\\p{L}])${kac}(’[\\p{L}]+)?,\\s*yani`, 'u').test(tum) ||
      terimler.has(k);
    if (!acik) {
      const i = tum.search(new RegExp(`(?<![\\p{L}\\d-])${kac}(?![\\p{L}\\d-])`, 'u'));
      sonuc.push(`${k} «${tum.slice(Math.max(0, i - 60), i + 40).replace(/\s+/g, ' ')}»`);
    }
  }
  return sonuc.sort();
}

test.describe('yalın Türkçe: sitenin bütün sayfaları', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'metin tarayıcıdan bağımsızdır, yalnız Chromium’da denetlenir');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(([endpoint, key]) => localStorage.setItem('istoc-opex-baglanti', JSON.stringify({ endpoint, key })), [ENDPOINT, KEY]);
    // Giderler isteği örnek modelle karşılanır. Ortak kayıt (persona) isteği test kaydına bırakılır (fixtures/persona).
    await page.route('https://script.google.com/**', (route) =>
      (route.request().postData() ?? '').includes('"service":"persona"')
        ? route.fallback()
        : route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(MODEL, 'ozet-1')) }).catch(() => undefined),
    );
  });

  for (const yol of SAYFALAR) {
    test(`${yol}: noktalama, gün yazımı, etiket dizisi ve cümle uzunluğu`, async ({ page }) => {
      test.setTimeout(300_000);
      const toplanan = new Map<string, string>();
      await sayfayiGez(page, yol, async () => {
        for (const b of await page.evaluate(bloklar, "main, .app-footer")) toplanan.set(`${b.tur}\u0000${b.metin}`, b.tur);
      });
      const bulgular = new Set<string>();
      for (const k of aciklanmayanKisaltmalar([...toplanan].map(([k, tur]) => ({ metin: k.split('\u0000')[1], tur })))) bulgular.add(`[kısaltma açıklanmadı] ${k}`);
      for (const [k, tur] of toplanan) {
        const metin = k.split('\u0000')[1];
        for (const i of ihlaller(metin, tur)) bulgular.add(`[${i}] ${metin.slice(0, 220)}`);
      }
      expect([...bulgular], [...bulgular].join('\n')).toEqual([]);
    });
  }
});

test.describe('yalın Türkçe: giriş ekranı ve bulunamayan sayfa', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'metin tarayıcıdan bağımsızdır, yalnız Chromium’da denetlenir');
  // Giriş ekranı yalnız girişsiz tarayıcıda görünür.
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const [ad, yol] of [['giriş ekranı', ''], ['bulunamayan sayfa', 'yok-boyle-bir-sayfa/']] as const) {
    test(`${ad}: noktalama, kısaltma ve cümle uzunluğu`, async ({ page }) => {
      for (const genislik of [1280, 375]) {
        await page.setViewportSize({ width: genislik, height: 812 });
        await page.goto(yol);
        await page.waitForLoadState('networkidle');
        const toplanan = await page.evaluate(bloklar, 'body');
        expect(toplanan.length, 'metin bulundu').toBeGreaterThan(0);
        const bulgular = new Set<string>();
        for (const k of aciklanmayanKisaltmalar(toplanan)) bulgular.add(`[kısaltma açıklanmadı] ${k}`);
        for (const b of toplanan) for (const i of ihlaller(b.metin, b.tur)) bulgular.add(`[${i}] ${b.metin.slice(0, 220)}`);
        expect([...bulgular], [...bulgular].join('\n')).toEqual([]);
      }
    });
  }
});
