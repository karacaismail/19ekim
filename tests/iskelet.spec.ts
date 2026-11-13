import { expect, test, type Page } from './fixtures/persona';
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

/**
 * Ortak parçalar (aynı kullanıcı isteği, ikinci bölüm). Yukarıdaki düzen kuralları sayfanın sırasını denetler. Aşağıdaki
 * kurallar ortak parçaların her sayfada aynı kalmasını denetler:
 *
 *   main > .wrap > PageHeader (iki kutu) > sayfa önü > Section … > sayfa sonu
 *
 * K1 Kabuk: sayfada tek `main` ve onun içinde tek `.wrap` vardır. Sayfa başlığının iki kutusu (`[data-page-header]`)
 *    `.wrap` öğesinin doğrudan çocuğudur. Böylece kırıntı satırı her sayfada aynı yerde ve yapışık durur.
 * K2 Bölüm: içerik `Section` bileşeniyle bölünür. Görünen her h2 ya bölüm başlığıdır (`.section-head > h2.section-title`)
 *    ya da panel başlığıdır (`h2.panel-baslik`). Panel başlığı araç sayfasında yan yana duran panellerde ve sayfanın
 *    üstündeki kutularda (`data-ust-kutu`: sonuç kartı, senaryo kurucu, Parametreler değişiklik kutusu) kullanılır. Panel
 *    başlığı `--text-lg` boyutundadır.
 * K3 Başlık ölçeği: bölüm başlığı (h2) `--text-2xl` boyutundadır. h3 ve h4 ya `--text-lg` (blok başlığı) ya da
 *    `--text-xl` (kart başlığı) boyutundadır. Böylece alt düzey başlık bölüm başlığından hep küçüktür. Bütün başlıklar
 *    `--weight-semibold` kalınlığındadır. Alt düzey başlık kendinden önceki üst düzey başlıktan büyük olmaz.
 *    Kayıt listesinin başlığı (`.kayit-h`) ortak bileşendir. Kendi biçimi vardır, ölçeğe katılmaz.
 * K4 Ritim: ardışık iki üst düzey bölüm arasında tam `--section-gap` boşluk vardır.
 * K5 Sayfa notu: sayfa başındaki uyarı ve bilgi kutusu ortak `SayfaNotu` bileşenidir (`.sayfa-notu`). Sayfaya özel uyarı
 *    sınıfı (`*-uyari`) kullanılmaz.
 * K6 Bölüm dizini: sayfa düzeyindeki içindekiler listesi ortak `BolumDizini` bileşenidir (`nav.bolum-dizini`). Bölümün
 *    içindeki bağlantı listesi o bölümün aracıdır (ör. hazırlık grupları, aşama haritası) ve sayılmaz. Başka gezinme öğesi
 *    yalnız kendi işini yapar (kırıntı, sayfa sonu, hesap araçları gezgini, rehber sekmeleri).
 * K8 Sıra: `main > .wrap` içindeki parçalar şu sırayla gelir. Sayfaya özel sarmalayıcı (`.dg`, `.gm` gibi) açılır ve
 *    içindekiler aynı sırayla denetlenir.
 *    1. Sayfa başı: `[data-page-header]` kutuları.
 *    2. Sayfa önü: üst kutu (`[data-ust-kutu]`), yapışık özet (`.yapiskan`), sürüm seçici (`.so-surum`), bölüm dizini
 *       (`.bolum-dizini`), sayfa notu (`.sayfa-notu`) ve giriş paragrafı (`.sayfa-giris`).
 *    3. Gövde: yalnız bölümler (`section.section`). Uygulama sayfasında gövde aracın kendisidir.
 *    4. Sayfa sonu: sayfa kaynağı (`.sayfa-kaynagi`) ve `nav.pager`.
 *    Sayfaya özel giriş paragrafı, kart ya da araç bölümlerin dışında durmaz. Bütün bölümlere uygulanan araç (süzgeç,
 *    özet sayıları) sayfa başının içindedir (`PageHeader` çocukları). Sekmeli bölüm kümesi (sekme paneli içinde bölümler,
 *    Giderler’in yıl kümesi gibi) gövdenin parçasıdır. Uygulama sayfasının sarmalayıcısı açılmaz, araç bir bütündür.
 * K7 Kart iç boşluğu: zemini ya da gölgesi olan başlıklı kart (içinde h3 ya da h4 olan yüzey) dört kenarında iç boşluk
 *    ölçeğinin bir kademesini kullanır: `--inset-sm`, `--inset-md`, `--inset-lg` ya da `--inset-xl`. Kayıt listesi, tablo ve form
 *    denetimi bu kurala girmez, çünkü kendi bileşen ölçüleri vardır.
 *
 * Test derlenmiş bütün sayfaları üç genişlikte açar: 375, 768 ve 1280 px. Token değerleri sayfada ölçülür, elle yazılmaz.
 */

/** Sayfa içi (#) bağlantı taşıyabilen gezinme öğeleri (K6). */
const GEZINME_IZINLI = '.crumbs, .pager, .bolum-dizini, .applet-gezgin, .pol-roller, [role="tablist"]';

function iskeletOlc(gezinmeIzinli: string) {
  const gorunur = (e: Element) => {
    const r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden';
  };
  const ad = (e: Element) => `${e.tagName.toLowerCase()}${typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).filter((c) => !/^m_|^mantine-/.test(c)).join('.') : ''} “${(e.textContent ?? '').trim().slice(0, 40)}”`;
  const hata: string[] = [];
  const main = document.querySelectorAll('main');
  if (main.length !== 1) hata.push(`K1: ${main.length} main`);
  const wrap = document.querySelectorAll('main .wrap');
  if (wrap.length !== 1) hata.push(`K1: main içinde ${wrap.length} .wrap`);
  const kutular = [...document.querySelectorAll('[data-page-header]')];
  if (!kutular.length) hata.push('K1: sayfa başlığı yok');
  for (const k of kutular) if (!k.parentElement?.matches('main > .wrap')) hata.push(`K1: başlık kutusu .wrap altında değil, ebeveyni ${ad(k.parentElement!)}`);

  // Token değerleri: ölçüm kutusu sayfanın kendi stiliyle çözülür.
  const olcu = document.createElement('div');
  olcu.style.cssText = 'position:absolute;visibility:hidden;';
  document.querySelector('main .wrap')!.append(olcu);
  const tok = (ozellik: string, deger: string) => {
    olcu.style.setProperty(ozellik, deger);
    const v = getComputedStyle(olcu).getPropertyValue(ozellik);
    olcu.style.removeProperty(ozellik);
    return v;
  };
  const t2xl = parseFloat(tok('font-size', 'var(--text-2xl)'));
  const txl = parseFloat(tok('font-size', 'var(--text-xl)'));
  const tlg = parseFloat(tok('font-size', 'var(--text-lg)'));
  const yari = tok('font-weight', 'var(--weight-semibold)');
  const aralik = parseFloat(tok('margin-top', 'var(--section-gap)'));
  const olcek = ['sm', 'md', 'lg', 'xl'].map((k) => {
    olcu.style.setProperty('padding', `var(--inset-${k})`);
    const c = getComputedStyle(olcu);
    const v = `${c.paddingTop} ${c.paddingRight} ${c.paddingBottom} ${c.paddingLeft}`;
    olcu.style.removeProperty('padding');
    return v;
  });
  olcu.remove();

  // K2 ve K3
  for (const h of document.querySelectorAll<HTMLElement>('main h2, main h3, main h4')) {
    if (!gorunur(h)) continue;
    const cs = getComputedStyle(h);
    const boy = parseFloat(cs.fontSize);
    const duzey = +h.tagName[1];
    const panel = h.matches('h2.panel-baslik');
    if (duzey === 2 && !panel && !h.matches('.section-head > h2.section-title')) hata.push(`K2: bölüm ya da panel başlığı olmayan h2 ${ad(h)}`);
    if (h.matches('.kayit-h')) continue;
    if (cs.fontWeight !== yari) hata.push(`K3: ${ad(h)} kalınlığı ${cs.fontWeight}, beklenen ${yari}`);
    if (duzey === 2 && panel && Math.abs(boy - tlg) > 0.5) hata.push(`K3: panel başlığı ${ad(h)} ${boy}px, beklenen ${tlg}px`);
    if (duzey === 2 && !panel && Math.abs(boy - t2xl) > 0.5) hata.push(`K3: h2 ${ad(h)} ${boy}px, beklenen ${t2xl}px`);
    if (duzey > 2 && Math.abs(boy - tlg) > 0.5 && Math.abs(boy - txl) > 0.5) hata.push(`K3: h${duzey} ${ad(h)} ${boy}px, beklenen ${tlg} ya da ${txl}px`);
  }

  // K3: alt düzey başlık, kendinden önceki üst düzey başlıktan büyük olmaz (kayıt başlığı hariç).
  const sira = [...document.querySelectorAll<HTMLElement>('main h2, main h3, main h4')].filter((h) => gorunur(h) && !h.matches('.kayit-h'));
  for (const [i, h] of sira.entries()) {
    const duzey = +h.tagName[1];
    const ust = sira.slice(0, i).reverse().find((x) => +x.tagName[1] < duzey);
    if (ust && parseFloat(getComputedStyle(h).fontSize) > parseFloat(getComputedStyle(ust).fontSize) + 0.5) hata.push(`K3: ${ad(h)} kendinden önceki üst başlıktan büyük: ${ad(ust)}`);
  }

  // K4: ardışık üst düzey bölümler
  const bolumler = [...document.querySelectorAll<HTMLElement>('main section.section')].filter((s) => !s.parentElement!.closest('section.section') && gorunur(s));
  for (let i = 1; i < bolumler.length; i++) {
    const once = bolumler[i - 1];
    if (once.nextElementSibling !== bolumler[i]) continue;
    const bosluk = bolumler[i].getBoundingClientRect().top - once.getBoundingClientRect().bottom;
    if (Math.abs(bosluk - aralik) > 1) hata.push(`K4: “${bolumler[i - 1].id}” ile “${bolumler[i].id}” arası ${Math.round(bosluk)}px, beklenen ${aralik}px`);
  }

  // K7: başlıklı kart. Zemin ya da gölge kendisinden gelir, ebeveyninden değil.
  const zeminli = (e: Element) => {
    const c = getComputedStyle(e);
    const bg = c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent';
    // Kendi renginde geniş gölgeyle sayfa kenarına uzanan bant (tam genişlik hilesi) kart sayılmaz.
    const golge = c.boxShadow !== 'none' && !/ 0px 0px 0px \d{3,}px/.test(c.boxShadow);
    return bg || golge;
  };
  for (const e of document.querySelectorAll<HTMLElement>('main div, main li, main section, main article, main aside')) {
    if (!gorunur(e) || e.matches('.section, .table-block, .table-frame, .kayit, .kayit-liste, .chart, .chart-canvas, [role="tabpanel"], [role="dialog"]') || e.closest('table, form, fieldset, .kayit-liste, .mantine-Accordion-panel, details')) continue;
    if (!zeminli(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 160 || r.height < 64) continue;
    const baslik = [...e.querySelectorAll('h3, h4')].find((h) => gorunur(h) && (h.closest('div, li, section, article, aside') === e || h.parentElement?.parentElement === e));
    if (!baslik) continue;
    const c = getComputedStyle(e);
    const deger = `${c.paddingTop} ${c.paddingRight} ${c.paddingBottom} ${c.paddingLeft}`;
    if (!olcek.includes(deger)) hata.push(`K7: kart ${ad(e)} iç boşluğu ${deger}, ölçek ${olcek.join(' | ')}`);
  }

  // K5
  for (const e of document.querySelectorAll('main [class*="-uyari"]')) {
    if (!gorunur(e)) continue;
    const sinif = [...e.classList].find((c) => /-uyari$/.test(c));
    if (sinif) hata.push(`K5: sayfaya özel uyarı kutusu .${sinif}`);
  }

  // K6
  for (const n of document.querySelectorAll('main nav')) {
    if (!gorunur(n) || n.matches(gezinmeIzinli) || n.closest(gezinmeIzinli) || n.closest('section.section')) continue;
    const baglantilar = [...n.querySelectorAll('a[href]')];
    if (baglantilar.length > 1 && baglantilar.every((a) => (a.getAttribute('href') ?? '').startsWith('#'))) hata.push(`K6: sayfa içi bağlantı listesi BolumDizini değil: ${ad(n)}`);
  }
  return hata;
}

/** K8: sayfa parçalarının sırası. */
function siraOlc(uygulama: boolean) {
  const hata: string[] = [];
  const ad = (e: Element) => `${e.tagName.toLowerCase()}${typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).filter((c) => !/^m_|^mantine-/.test(c)).join('.') : ''} “${(e.textContent ?? '').trim().slice(0, 40)}”`;
  const ONU = '[data-ust-kutu], .yapiskan, .so-surum, .bolum-dizini, .sayfa-notu, .sayfa-giris';
  const gorunur = (e: Element) => e.getClientRects().length > 0 && !e.matches('.visually-hidden, script, style, template');
  const sira: Element[] = [];
  const gez = (k: Element) => {
    for (const c of k.children) {
      if (!gorunur(c)) continue;
      // Sayfaya özel sarmalayıcı: kendisi bilinen bir parça değil ama içinde bölüm ya da sayfa önü parçası var.
      const kume = c.querySelector(':scope > [role="tabpanel"]');
      if (!uygulama && !kume && c.tagName === 'DIV' && !c.matches(`${ONU}, [data-page-header]`) && c.querySelector(`:scope > section.section, :scope > div section.section, ${ONU}`)) gez(c);
      else sira.push(c);
    }
  };
  gez(document.querySelector('main > .wrap')!);
  const asama = (e: Element) =>
    e.matches('[data-page-header]') ? 1 : e.matches(ONU) ? 2 : e.matches('section.section') || e.querySelector(':scope > [role="tabpanel"] section.section') ? 3 : e.matches('nav.pager, .sayfa-kaynagi') ? 4 : uygulama ? 3 : 0;
  // Metin sayfasında bölüm başlığının çizgisi içerik alanının tamamı kadardır (okuma sütunu yalnız içeriği daraltır).
  if (!uygulama) {
    const wrap = document.querySelector('main > .wrap')!;
    const cs = getComputedStyle(wrap);
    const icGenislik = wrap.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    for (const s of sira.filter((e) => e.matches('section.section'))) {
      const bas = s.querySelector(':scope > .section-head')!.getBoundingClientRect().width;
      if (Math.abs(bas - icGenislik) > 1) hata.push(`K8: “${s.id}” bölüm başlığı ${Math.round(bas)}px, içerik alanı ${Math.round(icGenislik)}px`);
    }
  }
  let son = 1;
  for (const e of sira) {
    const a = asama(e);
    if (a === 0) hata.push(`K8: bölüm dışında sayfaya özel parça: ${ad(e)}`);
    else if (a < son) hata.push(`K8: sıra bozuk, ${ad(e)} ${['', 'sayfa başı', 'sayfa önü', 'gövde', 'sayfa sonu'][a]} ama ${['', 'sayfa başı', 'sayfa önü', 'gövde', 'sayfa sonu'][son]} sonrasında`);
    else son = a;
  }
  return hata;
}

async function yukle(page: Page, yol: string) {
  await page.goto(yol.slice(1));
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.waitForSelector('.app-footer', { state: 'attached' });
  // Sürüm seçici v2'ye etkiden sonra geçer. Giderler bölümleri veri gelince çizilir. Ölçüm çizimden sonra yapılır.
  if (yol === '/satis-ortakligi/?surum=v2') await page.waitForSelector('main .v2-so2', { state: 'attached' });
  if (yol === '/istihdam/?surum=v2') await page.waitForSelector('main [class*="iv2-"]', { state: 'attached' });
  if (yol === '/giderler/') await page.waitForSelector('#plan-bolum');
  await page.waitForLoadState('networkidle');
}

test.describe('sayfa iskeleti: ortak parçalar her sayfada aynı', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(([endpoint, key]) => localStorage.setItem('istoc-opex-baglanti', JSON.stringify({ endpoint, key })), [ENDPOINT, KEY]);
    await page.route('https://script.google.com/**', (route) =>
      (route.request().postData() ?? '').includes('"service":"persona"')
        ? route.fallback()
        : route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(MODEL, 'ozet-1')) }).catch(() => undefined),
    );
  });

  for (const yol of SAYFALAR) {
    test(`${yol}: kabuk, bölüm, başlık ölçeği, ritim, sayfa notu, bölüm dizini ve kart boşluğu ortak kalıpta`, async ({ page }) => {
      test.setTimeout(90_000);
      const hatalar: string[] = [];
      for (const genislik of [1280, 768, 375]) {
        await page.setViewportSize({ width: genislik, height: 900 });
        await yukle(page, yol);
        for (const h of await page.evaluate(iskeletOlc, GEZINME_IZINLI)) hatalar.push(`${genislik} px ${h}`);
        for (const h of await page.evaluate(siraOlc, UYGULAMA.has(yol))) hatalar.push(`${genislik} px ${h}`);
      }
      expect([...new Set(hatalar)], 'iskelet sözleşmesi').toEqual([]);
    });
  }
});
