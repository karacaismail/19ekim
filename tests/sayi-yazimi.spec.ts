import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from './fixtures/persona';
import { DEFAULT_PARAMS, PARAM_GROUPS, PARAMS_KEY } from '../src/data/params';

/**
 * Metindeki her sayı Türkçe yazılır: ondalık ayırıcı virgül, binlik ayırıcı noktadır. Örneğin “3,5 €” ve “1.000 dakika”.
 * Ayar değeri metne biçimsiz yazılırsa ondalıklı ayar “399.25 €” ya da “%8.5” görünür. Bu dosyada iki denetim vardır:
 * 1. Kaynak denetimi: sayı türündeki ayar ve birimli sayı `src/lib/format.ts` işlevinden geçmeden metne yazılmaz.
 * 2. Sayfa denetimi: ayarlar ondalıklı değerlerle kaydedilir. Sonra sayfaların görünen metninde noktalı ondalık ve
 *    binlik ayırıcısız sayı aranır.
 * Bilinçli istisna satırın sonuna `// sayi-yazimi: atla` yazılarak işaretlenir.
 */

const KOK = join(process.cwd(), 'src');
const dosyalar = (dir: string): string[] =>
  readdirSync(dir).flatMap((ad) => {
    const yol = join(dir, ad);
    if (statSync(yol).isDirectory()) return dosyalar(yol);
    return /\.(ts|tsx|astro)$/.test(ad) ? [yol] : [];
  });

const SAYI_AYARLARI = Object.entries(DEFAULT_PARAMS)
  .filter(([, v]) => typeof v === 'number')
  .map(([k]) => k);
/** Ayar nesnesinin adları: `p.subscriptionEur`, `params.planRetention`, `m.params.memberTarget` ve benzeri. */
const AYAR_ERISIMI = new RegExp(String.raw`(?:\b(?:p|params|P|prm|DEFAULT_PARAMS|genel)|\bm\.params|\bmodel\.params)\.(?:${SAYI_AYARLARI.join('|')})\b`);
/** Birime bitişik ya da yüzde işaretinden sonra gelen yer tutucu: `${x} €`, `${x} ₺`, `%${x}`, `yüzde ${x}`. */
const BIRIMLI = /(?:%|yüzde )\$\{([^{}]+)\}|\$\{([^{}]+)\}\s?(?:₺|€|%|\\u00a0₺)/g;
const YER_TUTUCU = /\$\{([^{}]+)\}/g;

/** Yer tutucunun içi biçim işlevi çağırmadan sayı veriyorsa `true`. */
function bicimsiz(ic: string) {
  const t = ic.trim();
  // Koşullu metin, dizi birleştirme ya da tarih ve ad işlevi sayı yazmaz.
  if (/[?]|\.join\(|\.map\(|longDate|shortDate|monthName|Date\(|\bad\b|\bname\b|etiket|baslik/.test(t)) return false;
  if (/^Math\./.test(t)) return true;
  // İşlev çağrısı varsa biçim işlevi kabul edilir. Örneğin num(x), tl(x), yuzde(x).
  return !/[A-Za-zÇĞİÖŞÜçğıöşü_$][\wÇĞİÖŞÜçğıöşü$]*\(/.test(t);
}

test.describe('kaynak denetimi', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Kaynak denetimi bir kez çalışır.');

  test('sayı türündeki ayar ve birimli sayı biçim işlevinden geçer', () => {
    const bulunan: string[] = [];
    for (const yol of dosyalar(KOK)) {
      const ad = relative(KOK, yol);
      if (ad === 'lib/format.ts') continue;
      readFileSync(yol, 'utf8')
        .split('\n')
        .forEach((satir, i) => {
          if (satir.includes('sayi-yazimi: atla')) return;
          for (const m of satir.matchAll(YER_TUTUCU)) if (AYAR_ERISIMI.test(m[1]) && bicimsiz(m[1])) bulunan.push(`${ad}:${i + 1} \${${m[1]}}`);
          for (const m of satir.matchAll(BIRIMLI)) {
            const ic = m[1] ?? m[2];
            if (bicimsiz(ic)) bulunan.push(`${ad}:${i + 1} \${${ic}}`);
          }
        });
    }
    expect([...new Set(bulunan)], 'Sayıyı src/lib/format.ts işleviyle yazın. Örneğin `${num(p.subscriptionEur)} €`.').toEqual([]);
  });
});

/** Ondalık alabilen her sayı ayarına küsurlu değer verilir. Kişi sayısı gibi tam sayı ayarları aynı kalır. */
const ONDALIKLI: Record<string, number> = {};
for (const g of PARAM_GROUPS)
  for (const f of g.fields) {
    const v = DEFAULT_PARAMS[f.key];
    if (typeof v !== 'number' || f.kind === 'count') continue;
    const yeni = v + (f.kind === 'multiplier' || f.kind === 'rate' || f.kind === 'number' ? 0.25 : 0.5);
    if (f.max === undefined || yeni <= f.max) ONDALIKLI[f.key] = yeni;
  }

const SAYFALAR = ['', 'kadro-kapasitesi/', 'butce-2027/', 'buyume-modeli/', 'gelir-ongorusu-2027/', 'giderler/', 'gelir-modelleri/', 'onboarding/', 'karar/', 'politikalar/', 'satis-ortakligi/', 'satis-ortakligi/?surum=v2', 'hedefler/', 'bcg/', 'deger-onerisi/', 'nakit-akisi/', 'eylem-plani/', 'parametreler/', 'gelir-plani/', 'applet/', 'istihdam/', 'istihdam/?surum=v2', 'roller/saha-uzmani/', 'roller/pazarlamaci/', 'roller/ekip-lideri/', 'roller/segika/', 'roller/organizator/', 'roller/asistan/', 'roller/dijital-pazarlama/'];

/** Noktalı ondalık: “399.25”, “8.5”. Bölüm numarası (“1.1 Yeni kayıt”, “4.2 “Evet” dedi”) ve saat (“10.00”) sayılmaz. */
const NOKTALI = /(?<![\w.,])\d+\.\d{1,2}(?![\w.,])(?! [A-ZÇĞİÖŞÜ“])/g;
const SAAT = /^([01]?\d|2[0-3])\.00$/;
/** Binlik ayırıcısız sayı: “1000 dakika”. Yıl, kanun ve Resmî Gazete numarası, ürün kodu sayılmaz. */
const AYRACSIZ = /(?<![\w.,/-])\d{4,}(?![\w.,/-])(?! sayılı)/g;
const YIL = /^(19|20)\d\d$/;

test('ondalıklı ayarlarla sayfalarda sayı Türkçe yazılır', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Metin denetimi bir kez çalışır.');
  test.setTimeout(180_000);
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [PARAMS_KEY, JSON.stringify(ONDALIKLI)] as const);
  const bulunan: string[] = [];
  for (const adres of SAYFALAR) {
    await page.goto(adres);
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    // Kayıtlı ayarlar hidrasyondan sonra okunur. Ayar uyarısı görününce sayfa yeni değerlerle çizilmiştir.
    await page.locator('.params-notice').first().waitFor({ state: 'attached' }).catch(() => undefined);
    const metin = await page.evaluate(() => {
      const kopya = document.body.cloneNode(true) as HTMLElement;
      kopya.querySelectorAll('script, style, template, svg, pre, code, textarea').forEach((e) => e.remove());
      kopya.querySelectorAll('*').forEach((e) => e.append(' '));
      return (kopya.textContent ?? '').replace(/\s+/g, ' ');
    });
    const yakala = (re: RegExp, atla: (s: string, i: number) => boolean) => {
      for (const m of metin.matchAll(re)) if (!atla(m[0], m.index!)) bulunan.push(`${adres || '/'}: “${metin.slice(Math.max(0, m.index! - 40), m.index! + m[0].length + 20)}”`);
    };
    yakala(NOKTALI, (s, i) => SAAT.test(s) || metin.slice(i - 10, i).includes('Magnitude'));
    yakala(AYRACSIZ, (s, i) => YIL.test(s) || metin.slice(i - 5, i).endsWith('sayı '));
  }
  expect(bulunan).toEqual([]);
});
