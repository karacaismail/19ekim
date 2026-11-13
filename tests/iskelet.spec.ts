import { expect, test } from './fixtures/persona';
import { buildModel, reply } from './opex-fixture';
import { TUM_SAYFALAR } from './sayfa-gezgini';
import { SEQUENCE } from '../src/data/tree';

/**
 * Sayfa iskeleti sözleşmesi (kullanıcı isteği 13 Kasım 2026: “bütün sayfaların iskeleti, düzeni ve UX anlayışı
 * bütünleşsin, standartlaşsın”). Her sayfa aynı sırayla kurulur:
 *
 * 1. Sayfa başı: kırıntı satırında tek h1 ve altında tek cümlelik amaç.
 * 2. Gövde: bölümler. Her bölümün başlığı (h2) ve kısa açıklaması vardır. Bölüm dışında h2 yoktur. Bölüm başlıklarının
 *    yazı boyu her sayfada aynıdır. Numara yalnız sırası anlamlı sayfada kullanılır. Bir sayfada ya bütün bölümler
 *    numaralıdır (01, 02 …) ya da hiçbiri numaralı değildir.
 * 3. Sayfa sonu: sunum sırasındaki sayfada “Önceki / Sonraki”, öteki sayfalarda “İlgili sayfalar” gezinmesi.
 *
 * İki düzen vardır. Metin düzeni varsayılandır. Uygulama düzeni (geniş) yalnız etkileşimli araç sayfalarındadır:
 * organizasyon şeması, hesap araçları, satış ortaklığı, çalışma rehberleri ve notlar. Bu sayfaların gövdesi kendi aracıdır,
 * bölüm aranmaz. Sayfa başı ve sayfa sonu her sayfada aynıdır. Sayfanın en üstündeki sonuç ve kurucu kutusu
 * (`data-ust-kutu`) sayfa başının parçasıdır. Bu kutunun başlığı bölüm dışında h2 olabilir.
 */
const UYGULAMA = new Set(['/', '/applet/', '/satis-ortakligi/', '/satis-ortakligi/?surum=v2', '/politikalar/', '/politikalar/cozum/', '/politikalar/elci/', '/politikalar/kadrolu/', '/politikalar/oncu/', '/politikalar/tavsiye/', '/notlar/']);
/** Geniş düzen kullanan sayfalar. */
const GENIS = new Set(['/', '/applet/', '/satis-ortakligi/', '/satis-ortakligi/?surum=v2']);
/** Kullanıcı kararıyla amaç satırı olmayan sayfa (Giderler, 2026-10-21: ilk ekran yoğunluğu). */
const AMACSIZ = new Set(['/giderler/']);
/** Gizli ve kişisel sayfalar iskelete dahil değildir (e-posta sayfası yalnız adresle açılır). */
const SAYFALAR = TUM_SAYFALAR.filter((y) => !y.startsWith('/email/') && !y.startsWith('/404'));
/** Sunum sırasındaki sayfa “Önceki / Sonraki” ile biter. Öteki sayfalar “İlgili sayfalar” ile biter. */
const SIRADA = new Set(SEQUENCE.map((s) => s.path));

const ENDPOINT = 'https://script.google.com/macros/s/AKfycbTestDeploymentId_1234567890abcdef/exec';
const KEY = 'opex_test_anahtari_123';
const MODEL = buildModel();

test.describe('sayfa iskeleti: bütün sayfalar aynı düzeni izler', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'iskelet tarayıcıdan bağımsızdır, yalnız Chromium’da denetlenir');

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(([endpoint, key]) => localStorage.setItem('istoc-opex-baglanti', JSON.stringify({ endpoint, key })), [ENDPOINT, KEY]);
    await page.route('https://script.google.com/**', (route) =>
      (route.request().postData() ?? '').includes('"service":"persona"')
        ? route.fallback()
        : route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(MODEL, 'ozet-1')) }).catch(() => undefined),
    );
  });

  for (const yol of SAYFALAR) {
    test(`${yol}: sayfa başı, numaralı bölümler, sayfa sonu`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(yol.slice(1));
      await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
      const olcu = await page.evaluate(() => {
        const bolumler = [...document.querySelectorAll<HTMLElement>('main section.section')];
        const h2 = [...document.querySelectorAll<HTMLElement>('main h2')];
        return {
          h1: document.querySelectorAll('h1').length,
          h1Kirintida: document.querySelectorAll('.crumbs-row h1').length,
          amac: document.querySelectorAll('.page-intro .page-purpose').length,
          genis: document.querySelector('main > .wrap')?.hasAttribute('data-wide') ?? false,
          numaralar: bolumler.map((b) => b.querySelector(':scope > .section-head[data-index] .section-index')?.textContent?.trim() ?? ''),
          aciklamasiz: bolumler.filter((b) => !b.querySelector(':scope > .section-head .section-desc')).map((b) => b.id),
          bolumDisiH2: h2.filter((h) => !h.closest('section.section') && !h.closest('[data-ust-kutu]')).map((h) => h.textContent?.trim().slice(0, 40)),
          baslikBoyu: [...new Set(bolumler.map((b) => getComputedStyle(b.querySelector('.section-title')!).fontSize))],
          sayfaSonu: [...document.querySelectorAll('main > .wrap > nav.pager')].map((n) => ({
            ad: n.getAttribute('aria-label') ?? document.getElementById(n.getAttribute('aria-labelledby') ?? '')?.textContent?.trim(),
            baglanti: n.querySelectorAll('a').length,
          })),
        };
      });
      expect.soft(olcu.h1, 'tek h1').toBe(1);
      expect.soft(olcu.h1Kirintida, 'h1 kırıntı satırında').toBe(1);
      if (!AMACSIZ.has(yol)) expect.soft(olcu.amac, 'tek cümlelik amaç').toBe(1);
      expect.soft(olcu.genis, 'düzen genişliği').toBe(GENIS.has(yol));
      // Sayfa sonu: sunum sırası ya da ilgili sayfalar. En az bir bağlantı vardır.
      expect.soft(olcu.sayfaSonu, 'sayfa sonu gezinmesi').toHaveLength(1);
      expect.soft(olcu.sayfaSonu[0]?.ad, 'sayfa sonu türü').toBe(SIRADA.has(yol.replace(/\?.*$/, '')) ? 'Sunum sırası' : 'İlgili sayfalar');
      expect.soft(olcu.sayfaSonu[0]?.baglanti ?? 0).toBeGreaterThan(0);
      if (UYGULAMA.has(yol)) return;
      // Metin düzeni: gövde bölümlerden oluşur.
      expect.soft(olcu.numaralar.length, 'en az bir bölüm').toBeGreaterThan(0);
      // Numara yalnız sırası anlamlı sayfada kullanılır (ux.md §3, P6.1). Bir sayfada ya bütün bölümler numaralıdır ya da
      // hiçbiri. Numaralı sayfada sıra 01’den başlar ve atlamaz.
      const numarasiz = olcu.numaralar.every((n) => n === '');
      if (!numarasiz) expect.soft(olcu.numaralar, 'bölüm numaraları 01’den sırayla').toEqual(olcu.numaralar.map((_, i) => String(i + 1).padStart(2, '0')));
      expect.soft(olcu.aciklamasiz, 'her bölümün kısa açıklaması var').toEqual([]);
      expect.soft(olcu.bolumDisiH2, 'bölüm dışında h2 yok').toEqual([]);
      expect.soft(olcu.baslikBoyu, 'bölüm başlıkları aynı boyda').toEqual(['32px']);
    });
  }

  test('375 px: bütün sayfalarda sol kenar aynı, sayfa yana taşmaz', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 375, height: 812 });
    const sapan: string[] = [];
    for (const yol of SAYFALAR) {
      await page.goto(yol.slice(1));
      await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
      const o = await page.evaluate(() => ({
        // Sekme panelinin (Giderler yıl sekmeleri) içindeki bölüm panelin yüzeyine göre içeride durur. Panelin kendisi ölçülür.
        sol: [
          ...new Set(
            [...document.querySelectorAll('main section.section, main [data-page-header], main > .wrap > nav.pager, main [role="tabpanel"]')]
              .filter((e) => e.getClientRects().length && !e.parentElement?.closest('[role="tabpanel"], section.section'))
              .map((e) => Math.round(e.getBoundingClientRect().left)),
          ),
        ],
        tasma: document.documentElement.scrollWidth - innerWidth,
      }));
      if (o.tasma > 0 || o.sol.some((x) => x !== 16)) sapan.push(`${yol} sol ${o.sol.join(',')} taşma ${o.tasma}`);
    }
    expect(sapan).toEqual([]);
  });
});
