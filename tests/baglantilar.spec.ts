import { expect, test } from './fixtures/persona';
import { TUM_SAYFALAR } from './sayfa-gezgini';
import { APPLETLER } from '../src/data/applet';

/**
 * İç bağlantı bütünlüğü (eksik test, 13 Kasım 2026). Sayfa iskeleti değişince bölüm adresleri (`#…`) ve sayfa sonu
 * bağlantıları değişti. Bu test her sayfadaki iç bağlantıyı denetler:
 *
 * 1. Başka sayfaya giden bağlantının hedef sayfası derlenmiş sitede vardır.
 * 2. Bağlantıdaki bölüm adresi (`#id`) hedef sayfada bir öğeye karşılık gelir. Aynı sayfadaki bağlantı da buna dahildir.
 * 3. Hiçbir sayfa kişisel e-posta sayfasına bağlantı vermez. Bu sayfa yalnız adresle açılır.
 *
 * Kişisel e-posta sayfası gezilmez. Dış bağlantılar (https://…) bu testin kapsamında değildir. Applet sayfasında `#…`
 * bir öğe değil, açılacak hesap aracıdır. Bu yüzden Applet adresindeki parça, araç listesindeki (`APPLETLER`) bir kimlik olmalıdır.
 */
const TABAN = '/19ekim';
const GEZILEN = TUM_SAYFALAR.filter((y) => !y.startsWith('/email/'));
const VAR_OLAN = new Set(TUM_SAYFALAR.map((y) => y.replace(/\?.*$/, '')));
const ARACLAR = new Set(APPLETLER.map((a) => a.id));

interface Baglanti {
  kaynak: string;
  href: string;
  yol: string;
  parca: string;
}

test.describe('iç bağlantılar', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'bağlantılar tarayıcıdan bağımsızdır, yalnız Chromium’da denetlenir');

  test('her iç bağlantının hedef sayfası ve bölümü vardır, e-posta sayfasına bağlantı yoktur', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    const baglantilar: Baglanti[] = [];
    const kimlikler = new Map<string, Set<string>>();
    for (const yol of GEZILEN) {
      await page.goto(yol.slice(1));
      await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
      const sonuc = await page.evaluate(() => ({
        adres: location.pathname,
        kimlik: [...document.querySelectorAll('[id]')].map((e) => e.id),
        bag: [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
          .map((a) => a.getAttribute('href')!)
          .filter((h) => h.startsWith('/') || h.startsWith('#'))
          .map((h) => {
            const u = new URL(h, location.href);
            return { href: h, yol: u.pathname, parca: decodeURIComponent(u.hash.slice(1)) };
          }),
      }));
      const sayfa = sonuc.adres.replace(TABAN, '') || '/';
      kimlikler.set(sayfa, new Set([...(kimlikler.get(sayfa) ?? []), ...sonuc.kimlik]));
      for (const b of sonuc.bag) baglantilar.push({ kaynak: yol, ...b, yol: b.yol.replace(TABAN, '') || '/' });
    }

    const eposta = baglantilar.filter((b) => b.yol.startsWith('/email'));
    expect(eposta, 'e-posta sayfasına bağlantı').toEqual([]);

    const kirik = baglantilar.filter((b) => !VAR_OLAN.has(b.yol)).map((b) => `${b.kaynak} → ${b.href}`);
    expect([...new Set(kirik)], 'hedef sayfası olmayan bağlantı').toEqual([]);

    // Bölüm adresi: hedef sayfa gezildiyse kimlikleri bilinir. Gezilmeyen hedef (ör. sürümsüz adres) bir kez açılır.
    const parcali = baglantilar.filter((b) => b.parca && VAR_OLAN.has(b.yol));
    for (const hedef of new Set(parcali.map((b) => b.yol))) {
      if (kimlikler.has(hedef)) continue;
      await page.goto(hedef.slice(1));
      await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
      kimlikler.set(hedef, new Set(await page.evaluate(() => [...document.querySelectorAll('[id]')].map((e) => e.id))));
    }
    const kayip = parcali
      .filter((b) => (b.yol === '/applet/' ? !ARACLAR.has(b.parca) && !kimlikler.get(b.yol)?.has(b.parca) : !kimlikler.get(b.yol)?.has(b.parca)))
      .map((b) => `${b.kaynak} → ${b.href}`);
    expect([...new Set(kayip)], 'bölümü olmayan bağlantı').toEqual([]);
  });
});
