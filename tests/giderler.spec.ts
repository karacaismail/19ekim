import { expect, test, type Locator, type Page, type Request, type Route } from '@playwright/test';
import { OPEX_ENDPOINT, OPEX_MIN_GAP_MS, OPEX_MIN_WAIT_MS, OPEX_POLL_MS, OPEX_STORE_KEY, donemOf, planOfModel } from '../src/data/opex';
import { buildModel, exampleTohum, reply } from './opex-fixture';

/**
 * Giderler (OPEX): Google Apps Script web uygulaması sahte yanıtla (kurgusal örnek tohumdan motorun gerçek çıktısı).
 * Kullanıcı kararı 2026-10-20: Roboto, en küçük metin 15 CSS px.
 */
const PATH = 'giderler/';
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbTestDeploymentId_1234567890abcdef/exec';
const KEY = 'opex_test_anahtari_123';
const MODEL = buildModel();

/** SVG içindeki dolu metin kutularından 1 px'ten fazla kesişen çiftler (satır kutusu; Firefox'ta Chromium'dan 2 px yüksek). */
const cakisanEtiketler = (svg: Locator) =>
  svg.evaluate((el) => {
    const boxes = [...el.querySelectorAll('text')].filter((t) => (t.textContent ?? '').trim()).map((t) => ({ t: t.textContent, b: t.getBoundingClientRect() }));
    const out: string[] = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const p = boxes[i].b;
      const q = boxes[j].b;
      const w = Math.min(p.right, q.right) - Math.max(p.left, q.left);
      const h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
      if (w > 1 && h > 1) out.push(`${boxes[i].t} ↔ ${boxes[j].t}`);
    }
    return out;
  });
const MODEL_2 = buildModel({ params: { kira_artis_2027: 0.5 }, giderler: undefined });
const WIDTHS = [320, 360, 375, 390, 768, 1280];
/** 2026 sekmesinin dönem toplamı (Ekim–Aralık): sayfanın kahraman sayısı. */
const hero26 = (m: typeof MODEL) => lira(donemOf(m, 2026).toplam.toplam);
/** Yıl ayrımı olmayan plan (Ekim 2026 – Aralık 2027): birleşik kalemler tablosu ve aylık plan bu etiketi taşır. */
const planEtiket = (m: typeof MODEL) => planOfModel(m).etiket;
const KALEMLER = `Kalemler · ${planEtiket(MODEL)}`;
/** Kalemler tablosunun alt satırları (kullanıcı kararı 2026-10-21: aylık gider planı tablosu kalemlerle birleşti). */
const ALT_SATIRLAR = ['Teknoloji', 'Ofis ve işletme', 'Personel', /^Toplam · \d+ kalem$/, 'Önceki aya göre'];
const altSatir = (region: Locator, ad: string) => region.locator('tfoot tr').filter({ has: region.page().locator('th', { hasText: new RegExp(`^${ad}`) }) });
/** Tablo gövdesinde başlığı verilen sütunun td sırası (satır başlığı th sayılmaz). */
const sutun = (region: Locator, header: string | RegExp) =>
  region.locator('thead th').evaluateAll((ths, h) => {
    const re = typeof h === 'string' ? null : new RegExp(h[0], h[1]);
    return ths.findIndex((th) => (re ? re.test(th.textContent ?? '') : th.textContent === h)) - 1;
  }, typeof header === 'string' ? header : [header.source, header.flags]);
const lira = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

type Body = { anahtar?: string; ozet?: string; bekle?: boolean };
interface Server {
  requests: Request[];
  bodies: Body[];
  /** Doğru anahtarla gelen istek gövdeleri (sayfanın varsayılan anahtarsız isteği hariç). */
  keyed: () => Body[];
  set: (next: { ozet: string; model: typeof MODEL } | { error: string; message: string }) => void;
}

/**
 * Apps Script yanıtını taklit eder: özet aynıysa {degismedi}, değilse tüm model. CORS başlığı gerçek uçtaki gibi.
 * keyed (varsayılan): yalnız KEY ile veri döner, anahtarsız istek “yetki” alır (sayfa formu gösterir).
 * open: Sheets → Sayfa erişimi “Herkese açık”; anahtar gerekmez.
 * push: yeni sunucu gibi bekleyen isteği (bekle) özet değişene ya da `pushMs` dolana kadar bekletir (bekledi: true);
 * kapalıyken eski sunucu gibi hemen “değişmedi” döner.
 */
async function mockScript(
  page: Page,
  initial: { ozet: string; model: typeof MODEL } | { error: string; message: string } = { ozet: 'ozet-1', model: MODEL },
  mode: 'keyed' | 'open' = 'keyed',
  push: { pushMs: number } | null = null,
): Promise<Server> {
  let state = initial;
  const server: Server = { requests: [], bodies: [], keyed: () => server.bodies.filter((b) => b.anahtar === KEY), set: (next) => (state = next) };
  await page.route('https://script.google.com/**', async (route: Route) => {
    const request = route.request();
    server.requests.push(request);
    const body = JSON.parse(request.postData() ?? '{}') as Body;
    server.bodies.push(body);
    const bekle = !!push && body.bekle === true && !('error' in state) && body.ozet === state.ozet;
    if (bekle) {
      const bitis = Date.now() + push.pushMs;
      while (Date.now() < bitis && !('error' in state) && body.ozet === state.ozet) await new Promise((r) => setTimeout(r, 50));
    }
    const ek = bekle ? { bekledi: true } : {};
    const json =
      'error' in state
        ? { ok: false, hata: state.error, mesaj: state.message }
        : mode === 'keyed' && body.anahtar !== KEY
          ? { ok: false, hata: 'yetki', mesaj: 'Bu veri ucu erişim anahtarı istiyor ya da anahtar geçersiz.' }
          : body.ozet === state.ozet
          ? { ok: true, sema: 1, ozet: state.ozet, degismedi: true, denetlendi: new Date().toISOString(), degisti: new Date().toISOString(), ...ek }
          : reply(state.model, state.ozet, ek);
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(json) }).catch(() => undefined);
  });
  return server;
}

async function connect(page: Page, remember = true) {
  await page.getByLabel('Web uygulaması adresi').fill(ENDPOINT);
  await page.getByLabel('Erişim anahtarı').fill(KEY);
  const box = page.getByLabel(/Bu cihazda hatırla/);
  if ((await box.isChecked()) !== remember) await box.click();
  await page.getByRole('button', { name: 'Bağlan' }).click();
  await expect(page.locator('.opex-live')).toBeVisible();
}

/** Kaydırma bölgesi dışındaki öğelerin görünür alan dışına taşması (kapsayıcı gizlese de kırpılır). */
function clipped(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.app-main *')]
      .filter((el) => !el.closest('.table-scroll, .chart-scroll, .visually-hidden') && el.getClientRects().length)
      .filter((el) => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && (box.right > window.innerWidth + 1 || box.left < -1);
      })
      .map((el) => `${el.tagName.toLowerCase()}.${el.getAttribute('class') ?? ''}: ${Math.round(el.getBoundingClientRect().right)} > ${window.innerWidth}`)
      .slice(0, 10),
  );
}

async function drawAll(page: Page) {
  const canvases = page.locator('.chart-canvas');
  const count = await canvases.count();
  for (let i = 0; i < count; i++) {
    await canvases.nth(i).scrollIntoViewIfNeeded();
    await expect(canvases.nth(i).locator('svg'), `grafik ${i}`).toBeVisible({ timeout: 10_000 });
  }
  await page.waitForTimeout(500);
  return count;
}

test.describe('Giderler: bağlantı ve canlı veri', () => {
  test('herkese açık uç: sayfa anahtarsız, formsuz açılır; istek gövdesinde anahtar yok', async ({ page }) => {
    const server = await mockScript(page, { ozet: 'acik', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    await expect(page.getByRole('heading', { name: 'Google Sheets bağlantısı' })).toHaveCount(0);
    expect(server.requests[0].url()).toBe(OPEX_ENDPOINT);
    expect(server.bodies[0]).toEqual({});
  });

  test('anahtarlı uç: varsayılan istek “yetki” alır, form ve açıklama görünür; geçersiz adres uyarılır', async ({ page }) => {
    const server = await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await expect(page.getByRole('heading', { name: 'Google Sheets bağlantısı' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveText('Bu veri ucu erişim anahtarı istiyor; anahtarı girin.');
    expect(server.bodies).toEqual([{}]);
    // Varsayılan yalnız bu sekme (github.io kökü paylaşılır).
    await expect(page.getByLabel(/Bu cihazda hatırla/)).not.toBeChecked();
    await page.getByLabel('Web uygulaması adresi').fill('https://example.com/exec');
    await page.getByRole('button', { name: 'Bağlan' }).click();
    await expect(page.getByRole('alert')).toContainText('script.google.com');
    expect(server.requests.map((r) => r.url())).toEqual([OPEX_ENDPOINT]);
  });

  for (const width of [320, 360]) {
    test(`${width} px: kurulum formu ve hata metni görünür alanda; kırpılan öğe yok`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await mockScript(page);
      await page.goto(PATH);
      await hydrated(page);
      await page.getByRole('button', { name: 'Bağlan' }).click();
      await expect(page.getByRole('alert')).toBeVisible();
      expect(await clipped(page)).toEqual([]);
    });
  }

  test('bağlanır: anahtar adreste değil gövdede; özet, tablolar ve grafikler çizilir', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const server = await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const first = server.requests[server.bodies.findIndex((b) => b.anahtar === KEY)];
    expect(first.method()).toBe('POST');
    expect(first.url()).toBe(ENDPOINT);
    expect(first.headers()['content-type']).toMatch(/^text\/plain/);
    expect(server.keyed()[0]).toEqual({ anahtar: KEY });
    expect(server.requests.every((r) => !r.url().includes(KEY))).toBe(true);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    await expect(page.getByRole('tab', { name: /^2026/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: '2026 özeti' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Google Sheets’te aç' })).toHaveAttribute('href', /^https:\/\/docs\.google\.com\/spreadsheets\//);
    // Kalem tablosu: döviz + ₺ karşılığı, ödeme durumu metinle (renk tek başına değil).
    const table = page.getByRole('region', { name: KALEMLER });
    await expect(table).toContainText('Sunucu A');
    await expect(table).toContainText('€50,00');
    await expect(table).toContainText('Tutar girilmedi');
    await expect(table).toContainText('Ödendi');
    expect(await drawAll(page)).toBe(7);
    expect(errors).toEqual([]);
  });

  test('Sheets değişince sayfa kendiliğinden güncellenir; değişmezse yalnız özet sorulur', async ({ page }) => {
    await page.clock.install();
    const server = await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));

    await page.clock.runFor(OPEX_POLL_MS + 500);
    await expect.poll(() => server.keyed().length).toBeGreaterThanOrEqual(2);
    // Özet bilinince istek sunucudan değişikliği beklemesini ister (uzun yoklama).
    expect(server.keyed()[1]).toEqual({ anahtar: KEY, ozet: 'ozet-1', bekle: true });

    const changed = buildModel({ giderler: [['Yeni sunucu', '', 'Teknoloji', 'Sunucu & Bulut', 'TRY', 12345, 'Genel', false, true, '', '']] });
    server.set({ ozet: 'ozet-2', model: changed });
    // Önceki yanıt işlenip yeni zamanlayıcı kurulana kadar sahte saat adım adım ilerletilir (yarış yok).
    await expect
      .poll(
        async () => {
          await page.clock.runFor(OPEX_POLL_MS + 500);
          return page.locator('.opex-hero-value').textContent();
        },
        { timeout: 20_000 },
      )
      .toBe(hero26(changed));
    await expect(page.getByRole('status').filter({ hasText: 'Veriler güncellendi' })).toHaveCount(1);
    await expect(page.getByRole('region', { name: KALEMLER })).toContainText('Yeni sunucu');
  });

  test('bekleyen istek: Sheets değişince sayfa 15 sn beklemeden güncellenir; yalnız değişen değer vurgulanır, sayfa yeniden kurulmaz', async ({ page }) => {
    const server = await mockScript(page, { ozet: 'ozet-1', model: MODEL }, 'keyed', { pushMs: 20_000 });
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    await expect.poll(() => server.keyed().some((b) => b.bekle === true)).toBe(true);
    await expect(page.locator('.opex-live-meta')).toContainText('anlık');
    const tile = (ad: string) => page.locator('.opex-tile', { hasText: ad }).locator('.opex-tile-value');
    const personel = await tile('Personel').textContent();
    // Yalnız teknolojiye bir kalem eklenir.
    const changed = buildModel({ giderler: [...exampleTohum.giderler, ['Yeni sunucu', '', 'Teknoloji', 'Sunucu & Bulut', 'TRY', 12345, 'Genel', false, true, '', '']] });
    // Aynı DOM kalır: kahraman sayısının düğümü değişmez (sayfa yeniden kurulmaz).
    await page.locator('.opex-hero-value').evaluate((el) => ((window as unknown as { __hero: Element }).__hero = el));
    const basla = Date.now();
    server.set({ ozet: 'ozet-2', model: changed });
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(changed), { timeout: 5_000 });
    expect(Date.now() - basla, 'aralık beklenmedi').toBeLessThan(OPEX_POLL_MS);
    expect(await page.locator('.opex-hero-value').evaluate((el) => el === (window as unknown as { __hero: Element }).__hero)).toBe(true);
    await expect(tile('Teknoloji')).toHaveAttribute('data-changed', '');
    await expect(page.locator('.opex-hero-value')).toHaveAttribute('data-changed', '');
    await expect(tile('Personel')).toHaveText(personel!);
    await expect(tile('Personel')).not.toHaveAttribute('data-changed');
    await expect(tile('Ofis ve işletme')).not.toHaveAttribute('data-changed');
    await expect(tile('Teknoloji')).not.toHaveAttribute('data-changed', { timeout: 5_000 });
    // Yıl sekmesi değişince vurgu yok (veri değişmedi).
    await page.getByRole('tab', { name: /^2027/ }).click();
    await expect(page.locator('[data-changed]')).toHaveCount(0);
  });

  test('“Şimdi yenile” bekleyen istek kipini bozmaz: beklemeden sorar, sonra yine bekleyen istek gider', async ({ page }) => {
    const server = await mockScript(page, { ozet: 'ozet-1', model: MODEL }, 'keyed', { pushMs: 20_000 });
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    await expect.poll(() => server.keyed().filter((b) => b.bekle).length).toBe(1);
    await page.getByRole('button', { name: 'Şimdi yenile' }).click();
    await expect.poll(() => server.keyed().length).toBeGreaterThanOrEqual(3);
    expect(server.keyed()[2].bekle).toBeUndefined();
    await expect.poll(() => server.keyed().filter((b) => b.bekle).length, { timeout: 5_000 }).toBe(2);
    await expect(page.locator('.opex-live-meta')).toContainText('anlık');
  });

  test('“bekledi” deyip hemen dönen yanıt: art arda istek yok, aralığa döner', async ({ page }) => {
    await page.clock.install();
    const server = await mockScript(page, { ozet: 'ozet-1', model: MODEL }, 'keyed', { pushMs: 0 });
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    await page.clock.runFor(OPEX_MIN_GAP_MS + 500);
    await expect.poll(() => server.keyed().length).toBe(2);
    await page.clock.runFor(OPEX_MIN_WAIT_MS);
    expect(server.keyed().length, 'hemen dönen “bekledi” yanıtından sonra art arda istek yok').toBe(2);
    // Sahte saat ilerlerken gerçek yanıt gecikebilir; aralık dolunca yeni istek gider.
    await page.clock.runFor(OPEX_POLL_MS);
    await expect.poll(() => server.keyed().length).toBeGreaterThanOrEqual(3);
  });

  // Kullanıcı kararı 2026-10-20: yıl ayrımı olmayan plan ve kalemler üstte, yıl seçici onların altında (yıl bölümlerinin başında).
  // Gerçek tarayıcı görünür alanları: 1280×800 ekranda ≈ 1280×720, 1440×900 ekranda ≈ 1440×800 (sekme ve adres çubuğu).
  for (const size of [{ width: 1280, height: 720 }, { width: 1440, height: 800 }, { width: 1920, height: 960 }]) {
    test(`masaüstü ${size.width}×${size.height}: ilk ekranda 15 aylık plan; yıl seçici plan ve kalemlerin altında, yıl bölümlerinin başında`, async ({ page }) => {
      await page.setViewportSize(size);
      await mockScript(page, { ozet: 'acik', model: MODEL }, 'open');
      await page.goto(PATH);
      await hydrated(page);
      await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
      // Kullanıcı kararı 2026-10-21: canlı durum üst bantta (tema düğmesinin solunda), gezinme ortalı kalır; döviz
      // kurları kırıntı satırının sağında; Kalemler tablosunun üstünde başlık ve açıklama yok, yalnız ayırıcı.
      const canli = page.locator('.topbar .opex-live');
      await expect(canli).toBeVisible();
      await expect(page.locator('.crumbs-row .opex-live')).toHaveCount(0);
      const [bant, gez, durum, dugme] = [await page.locator('.topbar').boundingBox(), await page.locator('.mainnav-list').boundingBox(), await canli.boundingBox(), await page.locator('.theme-toggle').boundingBox()];
      expect(Math.abs(gez!.x + gez!.width / 2 - size.width / 2), 'gezinme ortalı').toBeLessThanOrEqual(4);
      expect(durum!.y + durum!.height, 'canlı durum üst bantta').toBeLessThanOrEqual(bant!.y + bant!.height);
      expect(durum!.x).toBeGreaterThanOrEqual(gez!.x + gez!.width);
      expect(durum!.x + durum!.width).toBeLessThanOrEqual(dugme!.x);
      expect(bant!.height, 'bant tek satır').toBeLessThan(70);
      const kur = page.locator('.crumbs-row .opex-kur');
      await expect(kur.locator('dt')).toHaveText(['USD/TRY', 'EUR/TRY']);
      const [kurKutu, baslik] = [await kur.boundingBox(), await page.locator('.crumbs-title').boundingBox()];
      expect(kurKutu!.y, 'kurlar başlık satırında').toBeLessThan(baslik!.y + baslik!.height);
      await expect(page.locator('.facts-row dt', { hasText: /USD\/TRY|EUR\/TRY/ })).toHaveCount(0);
      await expect(page.locator('.opex-veri hr.opex-ayrac')).toBeVisible();
      await expect(page.locator('.opex-veri .block-title, .opex-veri .table-note')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: KALEMLER })).toHaveCount(0);
      await expect(page.getByRole('region', { name: KALEMLER })).toBeVisible();
      // Başlıkta yıl seçimi yok.
      await expect(page.locator('.hero .opex-years')).toHaveCount(0);
      // Plan grafiği kaydırmadan başlar.
      const plan = page.locator('.chart', { hasText: 'Aylık plan' }).first();
      expect(await plan.evaluate((el) => el.getBoundingClientRect().top), 'plan grafiği ilk ekranda').toBeLessThan(size.height - 120);
      // Sıra: plan → kalemler → yıl seçici → yıl paneli; Parametreler bölümü yok.
      const ust = (sel: string) => page.locator(sel).first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      const [p, k, y, pan] = [await ust('#plan-bolum'), await ust('#kalemler-bolum'), await ust('.opex-year-bar'), await ust('#yil-paneli')];
      expect(p).toBeLessThan(k);
      expect(k).toBeLessThan(y);
      expect(y).toBeLessThan(pan);
      await expect(page.locator('.opex-year-bar .opex-years')).toBeVisible();
      await expect(page.locator('#parametreler-bolum')).toHaveCount(0);
      await expect(page.getByRole('region', { name: 'Parametreler (Google Sheets)' })).toHaveCount(0);
    });
  }

  test('320 px: canlı durum bantta gezinmenin altında; simge düğmeler tek satırda; kurlar kırıntı satırında; yatay taşma yok', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await mockScript(page, { ozet: 'acik', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const canli = page.locator('.topbar .opex-live');
    await expect(canli).toBeVisible();
    const ustler = await canli.locator('.opex-icon-btn').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(ustler).size, 'düğmeler tek satırda').toBe(1);
    // Dar ekranda gezinme çekmecede (2026-10-27): canlı durum marka satırının ve Menü düğmesinin altında kendi satırında.
    const [gez, durum, dugme, marka] = [await page.locator('.cekmece-tetik').boundingBox(), await canli.boundingBox(), await page.locator('.theme-toggle').boundingBox(), await page.locator('.brand').boundingBox()];
    expect(durum!.y).toBeGreaterThanOrEqual(gez!.y + gez!.height - 1);
    expect(dugme!.y, 'tema düğmesi marka satırında').toBeLessThan(marka!.y + marka!.height);
    await expect(page.locator('.crumbs-row .opex-kur')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });

  // Kullanıcı kararları 2026-10-21: hızlı filtreler araç satırında (anahtar ve onay kutusu, kısa ad); filtre tepsisi
  // tablonun eklentisi (bitişik, ayrı ton); tablo ile grafik arasında ayırıcı.
  test('hızlı filtreler araç satırında; süzer ve temizlenir; filtre tepsisi tabloya bitişik; tablo ile grafik arasında ayırıcı', async ({ page }) => {
    // Altı hızlı filtre (bu ay bekleyen dahil) 1440 px’te grup düğmeleriyle aynı satıra sığar; daha dar ekranda alt satıra sarar.
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockScript(page, { ozet: 'acik', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const hizli = page.getByRole('group', { name: 'Hızlı filtreler' });
    for (const ad of ['Dövizli', 'Teşvikli']) await expect(hizli.getByRole('switch', { name: ad })).toBeVisible();
    await expect(hizli.getByRole('checkbox')).toHaveCount(3);
    for (const ad of ['Boş ay', 'Özel tutar', 'Artışlı']) await expect(hizli.getByRole('checkbox', { name: ad })).toBeVisible();
    // Grup düğmeleri, hızlı filtreler ve Sütunlar aynı satırda.
    const orta = async (sel: string) => page.locator(sel).first().evaluate((el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; });
    const [g, h, sut] = [await orta('.opex-veri-arac .opex-toggles'), await orta('.opex-hizli'), await orta('.opex-sutunlar')];
    expect(Math.abs(g - h)).toBeLessThan(6);
    expect(Math.abs(g - sut)).toBeLessThan(6);
    const sayi = page.locator('.opex-veri-sayi');
    const toplam = MODEL.giderler.length + MODEL.kisiler.length;
    await expect(sayi).toHaveText(`${toplam} / ${toplam} kalem`);
    const dovizli = hizli.getByRole('switch', { name: 'Dövizli' });
    await expect(dovizli).toHaveAttribute('aria-checked', 'false');
    await dovizli.click();
    await expect(dovizli).toHaveAttribute('aria-checked', 'true');
    const dovizSay = MODEL.giderler.filter((x) => x.para !== 'TRY').length;
    expect(dovizSay).toBeGreaterThan(0);
    await expect(sayi).toHaveText(`${dovizSay} / ${toplam} kalem`);
    // Klavyeyle (Boşluk) kapanır; onay kutusu ve temizleme.
    await dovizli.focus();
    await page.keyboard.press('Space');
    await expect(dovizli).toHaveAttribute('aria-checked', 'false');
    await hizli.getByRole('checkbox', { name: 'Özel tutar' }).check();
    await expect(sayi).not.toHaveText(`${toplam} / ${toplam} kalem`);
    await page.getByRole('button', { name: 'Filtreleri temizle' }).click();
    await expect(sayi).toHaveText(`${toplam} / ${toplam} kalem`);
    await expect(hizli.getByRole('checkbox', { name: 'Özel tutar' })).not.toBeChecked();
    // Tepsi tablonun hemen üstünde, aynı genişlikte, ayrı tonda; birleşen köşeler düz.
    const tepsi = page.locator('.opex-tepsi');
    const cerceve = page.locator('.opex-veri .table-frame');
    const [t, c] = [await tepsi.boundingBox(), await cerceve.boundingBox()];
    expect(Math.abs(t!.y + t!.height - c!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(t!.x - c!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(t!.width - c!.width)).toBeLessThanOrEqual(1);
    const st = await tepsi.evaluate((el) => { const a = getComputedStyle(el); const b = getComputedStyle(el.nextElementSibling!.querySelector('.table-scroll')!); return { zemin: a.backgroundColor, tablo: b.backgroundColor, altSol: a.borderEndStartRadius, ustSol: b.borderStartStartRadius }; });
    expect(st.zemin).not.toBe(st.tablo);
    expect(st.altSol).toBe('0px');
    expect(st.ustSol).toBe('0px');
    // Tablo bittikten sonra grafikten önce ayırıcı.
    const ayrac = page.locator('#kalemler-bolum hr.opex-ayrac-arada');
    await expect(ayrac).toBeVisible();
    const [cAlt, aUst] = [c!.y + c!.height, (await ayrac.boundingBox())!.y];
    expect(aUst).toBeGreaterThan(cAlt);
    const grafik = await page.locator('#kalemler-bolum .chart').first().boundingBox();
    expect(grafik!.y).toBeGreaterThan(aUst);
  });

  // Kullanıcı kararı 2026-10-21: aşağı kaydırınca bant gizlenir, kırıntı satırı üstte yapışık; yukarı kaydırınca bant görünür.
  test('aşağı kaydırınca bant gizlenir, kırıntı satırı (kurlarla) üstte kalır; yukarı kaydırınca ve odak banda girince bant görünür', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 720 });
    await mockScript(page, { ozet: 'acik', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    await expect(page.locator('.crumbs-row .opex-kur')).toBeVisible();
    const html = page.locator('html');
    const ust = (sel: string) => page.locator(sel).evaluate((el) => Math.round(el.getBoundingClientRect().top));
    const alt = (sel: string) => page.locator(sel).evaluate((el) => Math.round(el.getBoundingClientRect().bottom));
    await page.mouse.move(640, 400);
    const asagi = async () => {
      for (let i = 0; i < 8; i++) {
        await page.mouse.wheel(0, 150);
        await page.waitForTimeout(30);
      }
      await expect(html).toHaveAttribute('data-bant-gizli', '');
    };
    await asagi();
    await expect.poll(() => alt('.topbar')).toBeLessThanOrEqual(0);
    await expect.poll(() => ust('.crumbs-row')).toBe(0);
    await expect(page.locator('.crumbs-row .opex-kur')).toBeInViewport();
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -80);
      await page.waitForTimeout(30);
    }
    await expect(html).not.toHaveAttribute('data-bant-gizli', '');
    await expect.poll(() => ust('.topbar')).toBe(0);
    const bantAlt = await alt('.topbar');
    await expect.poll(() => ust('.crumbs-row')).toBe(bantAlt);
    // Gizliyken odak banda girerse bant görünür.
    await asagi();
    await page.locator('.brand').focus();
    await expect(html).not.toHaveAttribute('data-bant-gizli', '');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
  });

  // Kullanıcı kararı 2026-10-21: yıl sekmeleri ve yıla göre değişen bölümler tek küme; seçili sekme panele bitişik ve
  // aynı zeminde, seçili olmayan sekme kenarlıklı ve farklı zeminde (açıkça seçilebilir).
  for (const width of [390, 1280]) {
    test(`${width} px yıl kümesi: seçili sekme panele bitişik ve aynı zeminde; diğer sekme açıkça seçilebilir`, async ({ page }) => {
      // Renkler geçiş ortasında ölçülmesin.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await mockScript(page, { ozet: 'acik', model: MODEL }, 'open');
      await page.goto(PATH);
      await hydrated(page);
      const kume = page.locator('.opex-yil-kume');
      await expect(kume.getByRole('tablist', { name: 'Yıl' })).toBeVisible();
      await expect(kume.getByRole('tabpanel')).toBeVisible();
      for (const yil of [2026, 2027]) {
        await kume.getByRole('tab', { name: new RegExp(String(yil)) }).click();
        await page.mouse.move(0, 0);
        const secili = kume.getByRole('tab', { selected: true });
        const diger = kume.locator('.opex-year[aria-selected="false"]');
        const panel = kume.getByRole('tabpanel');
        const [s, d, p] = [await secili.boundingBox(), await diger.boundingBox(), await panel.boundingBox()];
        expect(Math.abs(s!.y + s!.height - p!.y), 'seçili sekme panele bitişik').toBeLessThanOrEqual(1);
        expect(d!.y + d!.height, 'diğer sekme panele değmez').toBeLessThan(p!.y - 2);
        const st = await page.evaluate(() => {
          const cs = (el: Element) => getComputedStyle(el);
          const sec = document.querySelector('.opex-year[aria-selected="true"]')!;
          const dig = document.querySelector('.opex-year[aria-selected="false"]')!;
          const pan = document.querySelector('.opex-year-panel')!;
          return { sec: cs(sec).backgroundColor, dig: cs(dig).backgroundColor, digKenar: cs(dig).borderTopWidth, digStil: cs(dig).borderTopStyle, pan: cs(pan).backgroundColor, sayfa: cs(document.body).backgroundColor };
        });
        expect(st.sec).toBe(st.pan);
        expect(st.dig).not.toBe(st.pan);
        expect(st.pan).not.toBe(st.sayfa);
        expect(parseFloat(st.digKenar)).toBeGreaterThan(0);
        expect(st.digStil).toBe('solid');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }

  test('2026 ve 2027 sekmeleri aynı şablonda; seçim radyo noktasıyla', async ({ page }) => {
    // Geçişler anında (renk karşılaştırması geçiş ortasında yapılmasın); fare kartların dışında.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockScript(page, { ozet: 'acik', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const yillar = page.locator('.opex-year');
    await expect(yillar).toHaveCount(2);
    // Aynı şablon: seçili ve seçili olmayan görünüm iki sekmede birebir aynı; seçim değişince yer değiştirir
    // (kullanıcı kararı 2026-10-21: seçili sekme panelle birleşir, diğeri açıkça seçilebilir — ikisi bilerek farklı).
    const stil = (i: number) => yillar.nth(i).evaluate((el) => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, color: cs.color, kenar: cs.borderTopColor, h: Math.round(el.getBoundingClientRect().height + parseFloat(cs.marginBottom)) }; });
    const [seciliOnce, digerOnce] = [await stil(0), await stil(1)];
    expect(seciliOnce.bg).not.toBe(digerOnce.bg);
    expect(seciliOnce.h).toBe(digerOnce.h);
    const nokta = (i: number) => yillar.nth(i).locator('.opex-radio-dot').evaluate((el) => getComputedStyle(el).transform);
    expect(await nokta(0)).not.toBe(await nokta(1));
    await yillar.nth(1).click();
    await expect(yillar.nth(1)).toHaveAttribute('aria-selected', 'true');
    await page.mouse.move(0, 0);
    expect(await stil(1)).toEqual(seciliOnce);
    expect(await stil(0)).toEqual(digerOnce);
  });

  test('çok ve uzun adlı kategori: kutu satır sayısına göre uzar, etiketler binmez (320, 1024, 1280, 1440)', async ({ page }) => {
    test.setTimeout(90_000);
    const cok = buildModel({
      giderler: Array.from({ length: 16 }, (_, i) => [`Kalem ${i + 1}`, '', i % 2 ? 'Teknoloji' : 'Ofis ve işletme', `Uzun adlı kategori ${i + 1} (deneme)`, 'TRY', 1000 + i * 250, 'Genel', false, true, '', '']),
    });
    for (const width of [320, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await mockScript(page, { ozet: `cok-${width}`, model: cok }, 'open');
      await page.goto(PATH);
      await hydrated(page);
      // Grafik görünür alana gelince çizilir: önce kutu kaydırılır, sonra SVG beklenir.
      const kutu = page.locator('.chart', { hasText: 'Kategoriler' }).first();
      await kutu.scrollIntoViewIfNeeded();
      const svg = kutu.locator('svg');
      await expect.poll(() => svg.textContent(), { timeout: 10_000 }).toContain('Uzun adlı kategori 16');
      await page.waitForTimeout(400);
      expect(await cakisanEtiketler(svg), `${width} px`).toEqual([]);
    }
  });

  test('eski sunucu (bekletmez): istekler 15 sn aralığa döner; sık istek yok', async ({ page }) => {
    await page.clock.install();
    const server = await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    await page.clock.runFor(OPEX_MIN_GAP_MS + 500);
    await expect.poll(() => server.keyed().length).toBe(2);
    await page.clock.runFor(OPEX_POLL_MS - 2_000);
    expect(server.keyed().length, 'aralık dolmadan yeni istek yok').toBe(2);
    await expect(page.locator('.opex-live-meta')).toContainText(`${OPEX_POLL_MS / 1000} sn’de bir`);
    // Yanıt işlenip zamanlayıcı kurulana kadar sahte saat adım adım ilerletilir (yük altında yarış olmasın).
    await expect
      .poll(
        async () => {
          await page.clock.runFor(1_000);
          return server.keyed().length;
        },
        { timeout: 20_000 },
      )
      .toBeGreaterThanOrEqual(3);
  });

  test('görünürlük sık gidip gelse de süren istek iptal edilmez; yavaş yanıt (3 sn) gelir', async ({ page }) => {
    let count = 0;
    await page.route('https://script.google.com/**', async (route) => {
      count += 1;
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(MODEL, 'yavas')) }).catch(() => undefined);
    });
    await page.goto(PATH);
    await hydrated(page);
    // Bazı ortamlarda (gömülü tarayıcı, resim içinde resim) sekme saniyede birkaç kez gizli/görünür olur.
    await page.evaluate(() => {
      let hidden = false;
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
      window.setInterval(() => {
        hidden = !hidden;
        document.dispatchEvent(new Event('visibilitychange'));
      }, 250);
    });
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL), { timeout: 10_000 });
    expect(count).toBeLessThanOrEqual(2);
  });

  test('“Şimdi yenile” hemen sorar; sekme gizliyken sormaz', async ({ page }) => {
    await page.clock.install();
    const server = await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    server.set({ ozet: 'ozet-2', model: MODEL_2 });
    await page.getByRole('button', { name: 'Şimdi yenile' }).click();
    await expect.poll(() => server.keyed().length).toBe(2);
    expect(server.keyed()[1].bekle, '“Şimdi yenile” beklemeden sorar').toBeUndefined();
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const before = server.bodies.length;
    await page.clock.runFor(OPEX_POLL_MS * 3);
    expect(server.bodies.length).toBe(before);
  });

  test('yetki hatası: mesaj ve form görünür; yoklama durur', async ({ page }) => {
    await page.clock.install();
    const server = await mockScript(page, { error: 'yetki', message: 'Erişim anahtarı geçersiz.' });
    await page.goto(PATH);
    await hydrated(page);
    await page.getByLabel('Web uygulaması adresi').fill(ENDPOINT);
    await page.getByLabel('Erişim anahtarı').fill('yanlis');
    await page.getByRole('button', { name: 'Bağlan' }).click();
    await expect(page.getByRole('alert')).toHaveText('Erişim anahtarı geçersiz.');
    const count = server.bodies.length;
    await page.clock.runFor(OPEX_POLL_MS * 3);
    expect(server.bodies.length).toBe(count);
  });

  test('hatırla: yeniden yüklemede bağlanır; “Bağlantıyı unut” kaydı siler', async ({ page }) => {
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page, true);
    expect(await page.evaluate((k) => localStorage.getItem(k), OPEX_STORE_KEY)).toContain(ENDPOINT);
    await page.reload();
    await expect(page.locator('.opex-hero-value')).toBeVisible();
    await page.getByRole('button', { name: 'Bağlantı', exact: true }).click();
    await page.getByRole('button', { name: 'Bağlantıyı unut' }).click();
    await expect(page.getByRole('heading', { name: 'Google Sheets bağlantısı' })).toBeVisible();
    expect(await page.evaluate((k) => localStorage.getItem(k) ?? sessionStorage.getItem(k), OPEX_STORE_KEY)).toBeNull();
  });

  test('hatırlama kapalı: kayıt yalnız bu sekmede (sessionStorage)', async ({ page }) => {
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page, false);
    const stored = await page.evaluate((k) => ({ local: localStorage.getItem(k), session: sessionStorage.getItem(k) }), OPEX_STORE_KEY);
    expect(stored.local).toBeNull();
    expect(stored.session).toContain(ENDPOINT);
  });

  // Kullanıcı kararı 2026-10-20: süzgeç [Hepsi, Ofis, Teknoloji, Personel].
  test('kalemler süzgeci: Hepsi, Ofis, Teknoloji, Personel; Hepsi toplamı dönem OPEX’i', async ({ page }) => {
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const group = page.getByRole('group', { name: 'Grup süzgeci' });
    const n = { tech: MODEL.giderler.filter((g) => g.kume === 'teknoloji').length, office: MODEL.giderler.filter((g) => g.kume === 'ofis').length, people: MODEL.kisiler.length };
    await expect(group.getByRole('button')).toHaveText([`Hepsi (${n.tech + n.office + n.people})`, `Ofis (${n.office})`, `Teknoloji (${n.tech})`, `Personel (${n.people})`]);
    const table = page.getByRole('region', { name: KALEMLER });
    // Toplam satırı: “2026 ₺” sütunu ≈ 2026 dönemi grup toplamı, “Toplam ₺” ≈ 15 ay (kuruş yuvarlaması).
    const deger = async (header: string) => Number((await table.locator('tr[data-tone="total"] td').nth(await sutun(table, header)).innerText()).replace(/[^\d,]/g, '').replace(',', '.'));
    const total = () => deger('2026 ₺');
    const d = donemOf(MODEL, 2026);
    const p = planOfModel(MODEL);
    expect(Math.abs((await total()) - d.toplam.toplam)).toBeLessThan(0.05);
    expect(Math.abs((await deger('Toplam ₺')) - p.toplam.toplam)).toBeLessThan(0.05);
    await group.getByRole('button', { name: /^Personel/ }).click();
    await expect(group.getByRole('button', { name: /^Personel/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(table).toContainText('Örnek Uzman');
    await expect(table).not.toContainText('Sunucu A');
    expect(Math.abs((await total()) - d.toplam.insan)).toBeLessThan(0.05);
    await group.getByRole('button', { name: /^Teknoloji/ }).click();
    await expect(table).not.toContainText('Örnek Uzman');
    expect(Math.abs((await total()) - d.toplam.teknoloji)).toBeLessThan(0.05);
  });

  test('yıl sekmeleri: 2026 Ekim–Aralık, 2027 Ocak–Aralık (dönem toplamıyla); plan yıl ayrımsız 15 ay', async ({ page }) => {
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const tabs = page.getByRole('tablist', { name: 'Yıl' }).getByRole('tab');
    await expect(tabs).toHaveCount(2);
    await expect(tabs.nth(0)).toContainText('2026');
    await expect(tabs.nth(0)).toContainText(`Ekim – Aralık · ${hero26(MODEL)}`);
    await expect(tabs.nth(1)).toContainText(`Ocak – Aralık · ${lira(donemOf(MODEL, 2027).toplam.toplam)}`);
    // Ay sayısı özet kutusunda.
    await expect(page.locator('.opex-hero-note')).toContainText('· 3 ay');
    // Plan yıl ayrımı olmadan ve ayrı tablo değil: kalemler tablosunun 15 ay sütunu + alt satırlarda grup toplamları,
    // toplam ve önceki aya göre değişim.
    await expect(page.getByRole('region', { name: /^Aylık gider planı/ })).toHaveCount(0);
    const kalemler = page.getByRole('region', { name: KALEMLER });
    const altlar = async () => (await kalemler.locator('tfoot th').allTextContents()).slice(-5);
    const beklenen = (xs: string[]) => xs.forEach((x, i) => (typeof ALT_SATIRLAR[i] === 'string' ? expect(x).toBe(ALT_SATIRLAR[i]) : expect(x).toMatch(ALT_SATIRLAR[i])));
    beklenen(await altlar());
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'yil-2027');
    await expect(page.locator('.opex-hero-value')).toHaveText(lira(donemOf(MODEL, 2027).toplam.toplam));
    await expect(page.getByRole('heading', { name: '2027 varsayımları' })).toBeVisible();
    // Plan ve kalemler yıl seçiminden bağımsız: aynı 15 ay ve aynı alt satırlar.
    beklenen(await altlar());
    expect((await kalemler.locator('thead th').allTextContents()).filter((b) => / ’2[67]/.test(b))).toHaveLength(15);
  });

  test('yıl sekmeleri klavyeyle: ok tuşu sekmeyi değiştirir ve odağı taşır; tek sekme durağında', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'not_run: Playwright WebKit Tab ile düğmelere odak vermez');
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const t26 = page.getByRole('tab', { name: /^2026/ });
    const t27 = page.getByRole('tab', { name: /^2027/ });
    await expect(t26).toHaveAttribute('tabindex', '0');
    await expect(t27).toHaveAttribute('tabindex', '-1');
    await t26.focus();
    await page.keyboard.press('ArrowRight');
    await expect(t27).toBeFocused();
    await expect(t27).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Home');
    await expect(t26).toBeFocused();
    await expect(t26).toHaveAttribute('aria-selected', 'true');
  });

  for (const reduced of [false, true]) {
    test(`belirgin yükleyici${reduced ? ' (hareket azaltma: durağan)' : ''}: yanıt gelene kadar başlık, süre ve gidip gelen çubuk`, async ({ page }) => {
      if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
      let release: () => void = () => undefined;
      const gate = new Promise<void>((r) => (release = r));
      await page.route('https://script.google.com/**', async (route) => {
        await gate;
        await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(MODEL, 'yavas')) });
      });
      await page.goto(PATH);
      await hydrated(page);
      const loader = page.locator('.opex-loader');
      await expect(loader).toBeVisible();
      await expect(page.getByRole('status').filter({ hasText: 'Google Sheets’ten veriler alınıyor' })).toBeVisible();
      await expect(loader.locator('.opex-loader-meta')).toContainText(/\d+ sn/);
      const anim = await loader.locator('.opex-loader-bar > span').evaluate((el) => {
        const cs = getComputedStyle(el);
        return { name: cs.animationName, duration: cs.animationDuration, easing: cs.animationTimingFunction, count: cs.animationIterationCount, direction: cs.animationDirection };
      });
      if (reduced) expect(parseFloat(anim.duration)).toBe(0);
      else expect(anim).toEqual({ name: 'opex-yukleme', duration: '1.4s', easing: 'cubic-bezier(0.65, 0, 0.35, 1)', count: 'infinite', direction: 'alternate' });
      release();
      await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
      await expect(loader).toHaveCount(0);
    });
  }

  // Kullanıcı kararları: radyo işareti sağ üstte, seçili olan yeşil (2026-10-20); boyut 3rem’den ≈ %30 küçük, 2.125rem (2026-10-21).
  for (const scheme of ['light', 'dark'] as const) {
    test(`yıl sekmelerinde radyo işareti (${scheme}): sağ üstte, 34 px, seçili yeşil dolu nokta; rakamla çakışmaz; ≥ 3:1`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await mockScript(page);
      await page.goto(PATH);
      await hydrated(page);
      await connect(page);
      const dot = (yil: string) => page.locator(`#yil-${yil} .opex-radio-dot`).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
      const state = (yil: string) =>
        page.locator(`#yil-${yil}`).evaluate((tab) => {
          const svg = tab.querySelector<SVGSVGElement>('svg.opex-radio')!;
          const lum = (rgb: string) => {
            const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map((x) => Number(x) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          const stroke = getComputedStyle(svg.querySelector('.opex-radio-ring')!).stroke;
          const [a, b] = [lum(stroke), lum(getComputedStyle(tab).backgroundColor)].sort((x, y) => y - x);
          const t = tab.getBoundingClientRect();
          const r = svg.getBoundingClientRect();
          const n = tab.querySelector('.opex-year-num')!.getBoundingClientRect();
          const cs = getComputedStyle(tab);
          const overlap = Math.min(r.right, n.right) > Math.max(r.left, n.left) && Math.min(r.bottom, n.bottom) > Math.max(r.top, n.top);
          return {
            hidden: svg.getAttribute('aria-hidden'),
            ratio: (a + 0.05) / (b + 0.05),
            stroke,
            size: Math.round(r.width),
            right: Math.round(t.right - r.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth)),
            top: Math.round(r.top - t.top - parseFloat(cs.paddingTop) - parseFloat(cs.borderTopWidth)),
            overlap,
          };
        });
      const green = await page.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--radio-checked)';
        document.body.append(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return c;
      });
      expect(green).toMatch(/^rgb\(\d+, (1[0-9]{2}|[7-9]\d), \d+\)$/);
      for (const width of [320, 360, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const yil of ['2026', '2027']) {
          const st = await state(yil);
          expect(st.hidden, 'işaret ekran okuyucuya ayrıca okunmaz (seçim aria-selected ile)').toBe('true');
          expect(st.size, `${width} px ${yil}: 2.125rem (34 px)`).toBe(34);
          expect([st.right, st.top], `${width} px ${yil}: sağ üst köşe (iç boşlukta)`).toEqual([0, 0]);
          expect(st.overlap, `${width} px ${yil}: rakamla çakışma`).toBe(false);
          expect(st.ratio, `${width} px ${yil}: halka karşıtlığı`).toBeGreaterThanOrEqual(3);
        }
      }
      await expect.poll(() => dot('2026')).toBe(1);
      await expect.poll(() => dot('2027')).toBe(0);
      await expect.poll(async () => (await state('2026')).stroke).toBe(green);
      expect((await state('2027')).stroke).not.toBe(green);
      await page.getByRole('tab', { name: /^2027/ }).click();
      await expect.poll(() => dot('2027')).toBe(1);
      await expect.poll(() => dot('2026')).toBe(0);
      await expect.poll(async () => (await state('2027')).stroke).toBe(green);
      expect((await state('2027')).ratio).toBeGreaterThanOrEqual(3);
    });
  }

  test('Sheets aylık ızgarası: işaretsiz ay “—”, ayrı tutar “özel”; kalem ve ay ay tutarlar tek tabloda (15 ay)', async ({ page }) => {
    // Ofis kirası Kasım 2026’da işaretsiz; Örnek Serbest A Kasım 2026’da 70.000 ₺ ayrı fatura.
    const grid = buildModel({
      giderAylari: exampleTohum.giderler.map((r) => (r[0] === 'Ofis kirası' ? { aktif: { 'Kas 2026': false } } : {})),
      personelAylari: exampleTohum.personel.map((r) => (r[0] === 'Örnek Serbest A' ? { tutar: { 'Kas 2026': 70000 } } : {})),
    });
    await mockScript(page, { ozet: 'izgara', model: grid });
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const d = donemOf(grid, 2026);
    expect(d.toplam.toplam).not.toBe(donemOf(MODEL, 2026).toplam.toplam);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(grid));
    // Kalem bilgisi ve ay ay tutarlar tek tabloda (kullanıcı kararı 2026-10-20): 2026’nın 3 ayı ve 2027’nin 12 ayı.
    const items = page.getByRole('region', { name: `Kalemler · ${planEtiket(grid)}` });
    const basliklar = await items.locator('thead th').allTextContents();
    expect(basliklar.slice(0, 4)).toEqual(['Kalem', 'Kategori', 'Tutar', 'Bu ay']);
    expect(basliklar.slice(4, 7)).toEqual(['Eki ’26Ekim 2026', 'Kas ’26Kasım 2026', 'Ara ’26Aralık 2026']);
    expect(basliklar[7]).toBe('Oca ’27Ocak 2027');
    // Yıl toplamları, 2027 artışı ve personel ayrıntıları (eski personel tablosu; kullanıcı kararı 2026-10-21).
    expect(basliklar.slice(-9)).toEqual(['2026 ₺', '2027 ₺', 'Toplam ₺', '2027 artışı', 'Brüt', 'Kesintiler (işçi)', 'İşveren payı', 'Teşvik', 'Fatura KDV’si']);
    expect(basliklar).toHaveLength(4 + 15 + 9);
    const row = (t: ReturnType<Page['getByRole']>, name: string) => t.locator('tbody tr').filter({ has: page.locator('th', { hasText: new RegExp(`^${name}`) }) });
    const eki = await sutun(items, 'Eki ’26Ekim 2026');
    const kira = row(items, 'Ofis kirası').locator('td');
    await expect(kira.nth(eki)).toHaveText(lira(60000));
    await expect(kira.nth(eki + 1)).toContainText('—');
    await expect(kira.nth(await sutun(items, '2026 ₺'))).toHaveText('120.000,00 ₺');
    const serbest = row(items, 'Örnek Serbest A').locator('td');
    await expect(serbest.nth(eki + 1)).toContainText(lira(70000));
    await expect(serbest.nth(eki + 1)).toContainText('özel');
    await expect(serbest.nth(eki)).not.toContainText('özel');
    const kuruslu = (v: number) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} ₺`;
    // Toplam satırı kalemlerin toplamıdır; dönem toplamıyla kuruş yuvarlaması kadar fark olabilir.
    const toplam26 = Number((await items.locator('tr[data-tone="total"] td').nth(await sutun(items, '2026 ₺')).innerText()).replace(/[^\d,]/g, '').replace(',', '.'));
    expect(Math.abs(toplam26 - d.toplam.toplam)).toBeLessThan(0.05);
    expect(kuruslu(120000)).toBe('120.000,00 ₺');
    // “Etkin ay” sütunu yok: ay hücreleri gösterir.
    expect(basliklar).not.toContain('Etkin ay');
    // Plan: Kasım’da ofis kirası yok
    const ofisKasim = Number((await altSatir(items, 'Ofis ve işletme').locator('td').nth(eki + 1).innerText()).replace(/[^\d]/g, ''));
    expect(Math.abs(ofisKasim - d.seri[1].ofis)).toBeLessThanOrEqual(1);
  });

  test('tüm kalemleri işaretsiz ay: değişim “—”, sayfada ∞ veya NaN yok', async ({ page }) => {
    const kapali = { aktif: { 'Kas 2026': false } };
    const zero = buildModel({ giderAylari: exampleTohum.giderler.map(() => kapali), personelAylari: exampleTohum.personel.map(() => kapali) });
    expect(donemOf(zero, 2026).seri[1].toplam).toBe(0);
    await mockScript(page, { ozet: 'sifir', model: zero });
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    // Kasım toplamı 0: Aralık’ın önceki aya göre değişimi “—”.
    const items = page.getByRole('region', { name: `Kalemler · ${planEtiket(zero)}` });
    await expect(altSatir(items, 'Önceki aya göre').locator('td').nth(await sutun(items, 'Ara ’26Aralık 2026'))).toHaveText('—');
    expect(await page.locator('.app-main').innerText()).not.toMatch(/∞|NaN|Infinity/);
  });

  test('“Bu ay ödendi” sütunu kaldırılınca ödenen/bekleyen gösterilmez; durum “Bu ay var” / “Bu ay yok”', async ({ page }) => {
    const takipsiz = JSON.parse(JSON.stringify(MODEL)) as typeof MODEL;
    takipsiz.ozet.odeme = { ...takipsiz.ozet.odeme, takip: false };
    await mockScript(page, { ozet: 'takipsiz', model: takipsiz });
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    await expect(page.getByText('Bu ay ödenen (teknoloji, ofis)')).toHaveCount(0);
    const items = page.getByRole('region', { name: KALEMLER });
    await expect(items.locator('.opex-state').filter({ hasText: /^(Ödendi|Bekliyor)$/ })).toHaveCount(0);
    await expect(items.locator('.opex-state', { hasText: 'Bu ay var' }).first()).toBeVisible();
  });

  test('aylık ızgarasız eski Apps Script yanıtı: her ay etkin, varsayılan tutar; sayfa bozulmaz', async ({ page }) => {
    const old = JSON.parse(JSON.stringify(MODEL)) as typeof MODEL;
    for (const g of old.giderler) for (const f of ['aylikTl', 'aktif', 'ozel'] as const) delete (g as Partial<typeof g>)[f];
    for (const k of old.kisiler) for (const f of ['aktif', 'ozel'] as const) delete (k as Partial<typeof k>)[f];
    await mockScript(page, { ozet: 'eski', model: old });
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    const items = page.getByRole('region', { name: KALEMLER });
    // Her ay etkin: ilk kalemin hiçbir ay hücresinde “—” yok.
    const ilk = items.locator('tbody tr').first().locator('td');
    const eki = await sutun(items, 'Eki ’26Ekim 2026');
    for (let x = eki; x < eki + 15; x++) await expect(ilk.nth(x)).not.toContainText('—');
  });

  test('netten brüte: kişi seçimi aria-pressed ile, yıl sekmeyle değişir', async ({ page }) => {
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const group = page.getByRole('group', { name: 'Kişi' });
    const uzman = group.getByRole('button', { name: 'Örnek Uzman' });
    await uzman.click();
    await expect(uzman).toHaveAttribute('aria-pressed', 'true');
    const r26 = page.getByRole('region', { name: 'Örnek Uzman · Ekim – Aralık 2026 bordro' });
    await expect(r26.locator('tbody th')).toHaveText(['Ekim 2026', 'Kasım 2026', 'Aralık 2026', 'Dönem toplamı']);
    await page.getByRole('tab', { name: /^2027/ }).click();
    await page.getByRole('group', { name: 'Kişi' }).getByRole('button', { name: 'Örnek Uzman' }).click();
    await expect(page.getByRole('region', { name: 'Örnek Uzman · Ocak – Aralık 2027 bordro' }).locator('tbody th')).toHaveCount(13);
  });
});

test.describe('Giderler: yerleşim, yazı ve grafikler', () => {
  for (const width of WIDTHS) {
    test(`${width} px: taşma yok; tüm metin ≥ 15 px Roboto; grafik metni kesilmez, taşmaz, çakışmaz`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await mockScript(page);
      await page.goto(PATH);
      await hydrated(page);
      await connect(page);
      for (const yil of ['2026', '2027']) {
      await page.getByRole('tab', { name: new RegExp(`^${yil}`) }).click();
      await drawAll(page);
      const result = await page.evaluate(() => {
        const visible = (el: Element) => {
          const cs = getComputedStyle(el);
          return el.getClientRects().length > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
        };
        const texts = [...document.querySelectorAll('body *')]
          .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()))
          .filter((el) => visible(el) && !el.closest('.visually-hidden'));
        const small = texts.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 15).map((el) => `${el.tagName.toLowerCase()}.${el.getAttribute('class') ?? ''}: ${getComputedStyle(el).fontSize} "${el.textContent?.trim().slice(0, 30)}"`);
        const light = texts.filter((el) => Number(getComputedStyle(el).fontWeight) < 300).map((el) => el.tagName);
        // Kullanıcı kararı 2026-10-20: grafik ad etiketleri (SVG) Roboto Condensed; geri kalan her metin Roboto.
        const notRoboto = texts
          .filter((el) => !el.closest('code, pre, kbd'))
          .filter((el) => {
            const ff = getComputedStyle(el).fontFamily;
            return !(/^"?Roboto Variable"?/.test(ff) || (el.closest('svg') && /^"?Roboto Condensed Variable"?/.test(ff)));
          })
          .map((el) => `${el.tagName.toLowerCase()}.${el.getAttribute('class') ?? ''}: ${getComputedStyle(el).fontFamily}`);
        const headerOverflow = [...document.querySelectorAll('.data-table th')].filter((th) => th.scrollWidth > th.clientWidth + 1).map((th) => th.textContent?.trim());
        const chart: string[] = [];
        for (const svg of document.querySelectorAll<SVGSVGElement>('.chart-canvas svg')) {
          const kind = (svg.closest('.chart-canvas') as HTMLElement).dataset.kind;
          const frame = svg.getBoundingClientRect();
          const boxes = [...svg.querySelectorAll('text')]
            .filter((t) => (t.textContent ?? '').trim() && getComputedStyle(t).opacity !== '0')
            .map((t) => ({ text: t.textContent ?? '', box: t.getBoundingClientRect() }));
          for (const { text, box } of boxes) {
            if (/\.\.\.|…/.test(text)) chart.push(`${kind}: kesik "${text}"`);
            if (box.left < frame.left - 1 || box.right > frame.right + 1 || box.top < frame.top - 1 || box.bottom > frame.bottom + 1) chart.push(`${kind}: SVG dışında "${text}"`);
          }
          for (let a = 0; a < boxes.length; a++) {
            for (let b = a + 1; b < boxes.length; b++) {
              const p = boxes[a].box;
              const q = boxes[b].box;
              const w = Math.min(p.right, q.right) - Math.max(p.left, q.left);
              const h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
              const smaller = Math.min(p.width * p.height, q.width * q.height);
              if (w > 0 && h > 0 && smaller > 0 && (w * h) / smaller > 0.3) chart.push(`${kind}: "${boxes[a].text}" ↔ "${boxes[b].text}"`);
            }
          }
        }
        return { overflow: document.documentElement.scrollWidth - window.innerWidth, small, light, notRoboto, headerOverflow, chart };
      });
      expect(result.overflow, `${yil}: sayfa yatay taşıyor`).toBeLessThanOrEqual(0);
      expect(result.small, `${yil}: 15 px altı metin`).toEqual([]);
      expect(result.light).toEqual([]);
      expect(result.notRoboto, `${yil}: Roboto dışı metin`).toEqual([]);
      expect(result.headerOverflow).toEqual([]);
      expect(result.chart, `${yil}: grafik metni`).toEqual([]);
      expect(await clipped(page), `${yil}: kırpılan öğe`).toEqual([]);
      }
    });
  }

  // Kullanıcı kararı 2026-10-20: uzun kişi adları tipografik kurala göre sığar (Roboto Condensed, sözcük arasından sarılır).
  test('bordro bileşenleri: 14 uzun adlı kişi Roboto Condensed ile, etiketler binmez (320, 375, 1024, 1280)', async ({ page }) => {
    test.setTimeout(90_000);
    const adlar = ['Abdullah Furkan Yapıcı', 'Fatma Nur Yapıcı', 'Seyfullah Yapıcı', 'Dijital pazarlama uzmanı Jr.-Md.', 'Yönetici Asistanı (Veri analisti)', 'CRM Segika', 'CRM İstoç', 'Organizasyon', 'Saha', 'Pınar', 'Örnek Çalışan Bir', 'Örnek Çalışan İki', 'Örnek Çalışan Üç', 'Örnek Çalışan Dört'];
    const kalabalik = buildModel({ personel: adlar.map((ad, i) => [ad, 'Bordrolu', 'Net', 35000 + i * 1000, 'Evet', '', 'Otomatik', true, 'Kurgusal.']) });
    for (const width of [320, 375, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await mockScript(page, { ozet: `kisi-${width}`, model: kalabalik }, 'open');
      await page.goto(PATH);
      await hydrated(page);
      const kutu = page.locator('.chart', { hasText: 'Bordro bileşenleri' }).first();
      await kutu.scrollIntoViewIfNeeded();
      const svg = kutu.locator('svg');
      await expect.poll(() => svg.textContent(), { timeout: 10_000 }).toContain('Örnek Çalışan Dört');
      await page.waitForTimeout(400);
      expect(await cakisanEtiketler(svg), `${width} px`).toEqual([]);
      const yazi = await svg.locator('text', { hasText: 'Pınar' }).first().evaluate((t) => getComputedStyle(t).fontFamily);
      expect(yazi, `${width} px`).toMatch(/^"?Roboto Condensed Variable"?/);
    }
  });

  // Kullanıcı kararı 2026-10-21: köprü yerine tek yığılmış çubuk; parçaların tutarı ve payı açıklamada.
  test('netten işveren maliyetine: tek yığılmış çubuk, 5 parça; açıklamada tutar ve pay (toplam %100), toplam notta (320, 1280)', async ({ page }) => {
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await mockScript(page, { ozet: `bilesim-${width}`, model: MODEL }, 'open');
      await page.goto(PATH);
      await hydrated(page);
      const kutu = page.locator('.chart', { hasText: 'Netten işveren maliyetine' }).first();
      await expect(kutu.locator('.chart-canvas')).toHaveAttribute('data-kind', 'opex-bilesim');
      await expect(kutu).toContainText('işveren maliyeti');
      await kutu.scrollIntoViewIfNeeded();
      const svg = kutu.locator('svg');
      await expect(svg).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(400);
      const metin = (await svg.locator('text').allTextContents()).map((t) => t.trim()).filter(Boolean);
      // Dar grafikte açıklama satırları sözcük arasından sarılır (ayrı metin düğümleri): birleştirilip sayılır.
      const hepsi = metin.join(' ');
      expect(hepsi, `${width} px`).toMatch(/^Net ücret /);
      const paylar = [...hepsi.matchAll(/%([\d,]+)/g)].map((x) => Number(x[1].replace(',', '.')));
      // Sayılar satır sonunda bölünmez (“%56,” / “5)” gibi).
      expect(metin.filter((t) => /[,%]$/.test(t)), `${width} px`).toEqual([]);
      expect(paylar, `${width} px`).toHaveLength(5);
      expect(Math.abs(paylar.reduce((a, b) => a + b, 0) - 100), `${width} px payların toplamı`).toBeLessThan(0.6);
      // Değer ekseni yok (0, 1 Mn ₺ …).
      expect(metin.filter((t) => t === '0'), `${width} px`).toEqual([]);
      expect(await cakisanEtiketler(svg), `${width} px`).toEqual([]);
    }
  });

  test('rapor ayı Ocak 2027: plan ve kalemler yine Ekim 2026 – Aralık 2027 (15 ay); “Bu ay” Ocak 2027', async ({ page }) => {
    const ocak = buildModel({ params: { rapor_yili: 2027, rapor_ayi: 1 } });
    await mockScript(page, { ozet: 'ocak-2027', model: ocak }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    await expect(page.getByRole('region', { name: KALEMLER }).locator('thead th').nth(4)).toHaveText('Eki ’26Ekim 2026');
    const items = page.getByRole('region', { name: KALEMLER });
    const basliklar = await items.locator('thead th').allTextContents();
    expect(basliklar).toContain('Bu ay');
    expect(basliklar.filter((b) => / ’2[67]/.test(b))).toHaveLength(15);
    // Yıl sekmesi rapor yılını açar; 2026 sekmesi tüm yıl (önceki davranış).
    await expect(page.getByRole('tab', { name: /^2027/ })).toHaveAttribute('aria-selected', 'true');
  });

  // Kullanıcı bildirimi 2026-10-21: üzerine gelince gri vurgu bandı çubuğu örtüyordu.
  test('grafik üzerine gelince vurgu bandı çubuğu örtmez (bileşim ve kategoriler)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockScript(page, { ozet: 'hover', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    for (const ad of ['Netten işveren maliyetine', 'Kategoriler']) {
      const kutu = page.locator('.chart', { hasText: ad }).first();
      await kutu.scrollIntoViewIfNeeded();
      await expect(kutu.locator('svg')).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(400);
      // Renkli çubukların ortası ve oradaki en üstteki öğenin dolgusu (üzerine gelmeden önce).
      const cubuklar = await kutu.locator('svg').evaluate((svg) =>
        [...svg.querySelectorAll('path')]
          .map((p) => ({ fill: p.getAttribute('fill') ?? '', b: p.getBoundingClientRect() }))
          .filter((x) => x.b.width > 8 && x.b.height > 8 && x.b.height < 60 && x.fill && x.fill !== 'none' && x.fill !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(x.fill))
          .slice(0, 4)
          .map((x) => ({ x: x.b.left + x.b.width / 2, y: x.b.top + x.b.height / 2, fill: x.fill })),
      );
      expect(cubuklar.length, ad).toBeGreaterThan(0);
      for (const c of cubuklar) {
        await page.mouse.move(c.x, c.y);
        await page.waitForTimeout(150);
        // Üstteki öğe çubuğun kendisi (vurgu rengi biraz açılabilir), gri vurgu bandı değil.
        const fark = await page.evaluate(
          ([x, y, fill]) => {
            const rgb = (c: string) => {
              const ctx = document.createElement('canvas').getContext('2d')!;
              ctx.fillStyle = c;
              ctx.fillRect(0, 0, 1, 1);
              return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
            };
            const ust = document.elementFromPoint(x as number, y as number)?.getAttribute('fill') ?? '';
            const [a, b] = [rgb(ust || 'transparent'), rgb(fill as string)];
            return Math.max(...a.map((v, i) => Math.abs(v - b[i])));
          },
          [c.x, c.y, c.fill],
        );
        expect(fark, `${ad}: üzerine gelince çubuk görünür (renk farkı)`).toBeLessThan(40);
      }
    }
  });

  // Kullanıcı kararı 2026-10-21: durum etiketleri tam yuvarlak hap; her durum ayrı pastel zemin; yazı okunur.
  for (const scheme of ['light', 'dark'] as const) {
    test(`durum ve kategori hapları (${scheme}): tam yuvarlak, her biri ayrı zemin, yazı ≥ 4,5:1`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await mockScript(page, { ozet: `hap-${scheme}`, model: MODEL }, 'open');
      await page.goto(PATH);
      await hydrated(page);
      const haplar = await page.locator('.opex-state').evaluateAll((els) => {
        const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const lum = (c: string) => {
          const [r, g, b] = rgb(c).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const out: Record<string, { bg: string; oran: number; yuvarlak: boolean }> = {};
        for (const el of els) {
          const cs = getComputedStyle(el);
          const [a, b] = [lum(cs.color), lum(cs.backgroundColor)].sort((x, y) => y - x);
          out[el.getAttribute('data-state') ?? ''] = { bg: cs.backgroundColor, oran: (a + 0.05) / (b + 0.05), yuvarlak: parseFloat(cs.borderTopLeftRadius) >= el.getBoundingClientRect().height / 2 };
        }
        return out;
      });
      // Örnek veride: bu ay yok, ödendi, bekliyor, tutar girilmedi, bordro, fatura (en az beş durum).
      expect(Object.keys(haplar).length).toBeGreaterThanOrEqual(5);
      const zeminler = Object.values(haplar).map((h) => h.bg);
      expect(new Set(zeminler).size, 'her durum ayrı zemin').toBe(zeminler.length);
      for (const [ad, h] of Object.entries(haplar)) {
        expect(h.yuvarlak, `${ad} tam yuvarlak`).toBe(true);
        expect(h.oran, `${ad} karşıtlık`).toBeGreaterThanOrEqual(4.5);
      }
      // Kategori hapları: her kategori ayrı pastel zemin (8’e kadar), tam yuvarlak, okunur.
      const kategoriler = await page.locator('.opex-pill').evaluateAll((els) => {
        const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const lum = (c: string) => {
          const [r, g, b] = rgb(c).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const out: Record<string, { bg: string; oran: number; yuvarlak: boolean }> = {};
        for (const el of els) {
          const cs = getComputedStyle(el);
          const [a, b] = [lum(cs.color), lum(cs.backgroundColor)].sort((x, y) => y - x);
          out[el.textContent ?? ''] = { bg: cs.backgroundColor, oran: (a + 0.05) / (b + 0.05), yuvarlak: parseFloat(cs.borderTopLeftRadius) >= el.getBoundingClientRect().height / 2 };
        }
        return out;
      });
      expect(Object.keys(kategoriler).length).toBeGreaterThanOrEqual(3);
      const katZemin = Object.values(kategoriler).map((h) => h.bg);
      expect(new Set(katZemin).size, 'her kategori ayrı zemin').toBe(Math.min(8, katZemin.length));
      for (const [ad, h] of Object.entries(kategoriler)) {
        expect(h.yuvarlak, `${ad} tam yuvarlak`).toBe(true);
        expect(h.oran, `${ad} karşıtlık`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  // Kullanıcı kararı 2026-10-21: kalemler ve personel tek veri tablosu; sıralama, sütun araması, somut filtreler; %90 genişlik.
  test('kalemler veri tablosu: sıralama, sütun araması (metin ve sayı koşulu), filtreler, sütun grupları, toplamlar süzülmüş satırlardan', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockScript(page, { ozet: 'veri', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const tablo = page.getByRole('region', { name: KALEMLER });
    const sayac = page.locator('.opex-veri-sayi');
    const toplamKalem = MODEL.giderler.length + MODEL.kisiler.length;
    await expect(sayac).toHaveText(`${toplamKalem} / ${toplamKalem} kalem`);
    // Genişlik: sayfanın %90’ı, ortalı; sayfa yatay taşmaz.
    const kutu = await page.locator('.opex-veri').boundingBox();
    expect(Math.abs(kutu!.width - 1280 * 0.9)).toBeLessThan(20);
    expect(Math.abs(kutu!.x + kutu!.width / 2 - 640)).toBeLessThan(20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const toplamSutun = await sutun(tablo, 'Toplam ₺');
    const toplamlar = async () =>
      (await tablo.locator('tbody tr').evaluateAll((trs, i) => trs.map((tr) => tr.querySelectorAll('td')[i]?.textContent ?? ''), toplamSutun)).map((t) => Number(t.replace(/[^\d,]/g, '').replace(',', '.')));
    // Sıralama: Toplam ₺ başlığı → artan, tekrar → azalan; aria-sort güncellenir.
    const baslik = tablo.locator('thead th', { hasText: /^Toplam ₺$/ });
    await baslik.getByRole('button', { name: 'Toplam ₺', exact: true }).click();
    await expect(baslik).toHaveAttribute('aria-sort', 'ascending');
    let t = await toplamlar();
    expect(t).toEqual([...t].sort((a, b) => a - b));
    await baslik.getByRole('button', { name: 'Toplam ₺', exact: true }).click();
    await expect(baslik).toHaveAttribute('aria-sort', 'descending');
    t = await toplamlar();
    expect(t).toEqual([...t].sort((a, b) => b - a));
    // Sayı koşullu sütun araması.
    const esik = t[Math.floor(t.length / 2)];
    await page.getByRole('searchbox', { name: 'Toplam ₺ sütununda ara' }).fill(`>${Math.floor(esik)}`);
    t = await toplamlar();
    expect(t.length).toBeGreaterThan(0);
    expect(t.every((v) => v > Math.floor(esik))).toBe(true);
    await expect(sayac).toHaveText(`${t.length} / ${toplamKalem} kalem`);
    // Alt toplam süzülmüş satırların toplamı.
    const alt = Number((await altSatir(tablo, 'Toplam').locator('td').nth(toplamSutun).innerText()).replace(/[^\d,]/g, '').replace(',', '.'));
    expect(Math.abs(alt - t.reduce((a, b) => a + b, 0))).toBeLessThan(0.05 * t.length + 0.05);
    // Temizle: her şey geri.
    await page.getByRole('button', { name: 'Filtreleri temizle' }).click();
    await expect(sayac).toHaveText(`${toplamKalem} / ${toplamKalem} kalem`);
    // Sıralanmamış başlıkta aria-sort yok (yalnız sıralı sütunda).
    await expect(baslik).not.toHaveAttribute('aria-sort');
    // Metin araması (Kalem sütunu).
    await page.getByRole('searchbox', { name: 'Kalem sütununda ara' }).fill('örnek');
    const adlar = await tablo.locator('tbody th').allTextContents();
    expect(adlar.length).toBeGreaterThan(0);
    expect(adlar.every((a) => a.toLocaleLowerCase('tr-TR').includes('örnek'))).toBe(true);
    await page.getByRole('button', { name: 'Filtreleri temizle' }).click();
    // Tür filtresi (çoklu seçim): yalnız bordrolu; personel ayrıntıları dolu, gider satırı yok.
    await page.getByRole('button', { name: /^Tür:/ }).click();
    await page.getByRole('checkbox', { name: 'Bordrolu', exact: true }).check();
    await page.keyboard.press('Escape');
    // Kutuda hap/etiket yok: yalnız kısa özet (kullanıcı kararı 2026-10-21).
    await expect(page.getByRole('button', { name: 'Tür: Bordrolu' })).toBeVisible();
    await expect(page.locator('.opex-filtreler .mantine-Pill-root, .opex-filtreler [class*="Pill"]')).toHaveCount(0);
    const bordrolu = MODEL.kisiler.filter((k) => k.tur === 'Bordrolu').length;
    await expect(sayac).toHaveText(`${bordrolu} / ${toplamKalem} kalem`);
    const brut = await tablo.locator('tbody tr').first().locator('td').nth(await sutun(tablo, 'Brüt')).innerText();
    expect(brut).toMatch(/₺/);
    // Tek grup listelenince grup ara toplamı yok: yalnız toplam ve önceki aya göre.
    await expect(tablo.locator('tfoot th')).toHaveText([/^Toplam · \d+ kalem$/, 'Önceki aya göre']);
    await page.getByRole('button', { name: 'Filtreleri temizle' }).click();
    // Sütun grupları: ay sütunları gizlenir ve geri gelir.
    await page.getByRole('button', { name: 'Sütunlar' }).click();
    const ayKutusu = page.getByRole('checkbox', { name: /Ay sütunları/ });
    await expect(ayKutusu).toBeChecked();
    await ayKutusu.uncheck();
    await expect(tablo.locator('thead th', { hasText: 'Eki ’26' })).toHaveCount(0);
    await ayKutusu.check();
    await page.keyboard.press('Escape');
    await expect(ayKutusu).toBeHidden();
    await expect(tablo.locator('thead th', { hasText: 'Eki ’26' })).toHaveCount(1);
  });

  // Kullanıcı kararı 2026-10-21: her sütunda filtre (başlıktaki huni): liste veya aralık.
  test('kalemler veri tablosu: sütun bazlı filtre — liste (kategori), aralık (Toplam ₺), boş ay (—); Escape odağı düğmeye döndürür', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockScript(page, { ozet: 'kolon', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const tablo = page.getByRole('region', { name: KALEMLER });
    const sayac = page.locator('.opex-veri-sayi');
    const hepsi = MODEL.giderler.length + MODEL.kisiler.length;
    // Liste filtresi: Kategori → Hiçbiri → tek kategori.
    const katDugme = page.getByRole('button', { name: 'Kategori sütununu filtrele' });
    // Klavyeyle açılır (WebKit fareyle tıklanan düğmeye odak vermez; odağın düğmeye dönüşü klavye yolunda denetlenir).
    await katDugme.focus();
    await page.keyboard.press('Enter');
    const panel = page.getByRole('dialog', { name: 'Kategori sütununu filtrele' });
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: 'Hiçbiri' }).click();
    await expect(sayac).toHaveText(`0 / ${hepsi} kalem`);
    const kategori = MODEL.giderler[0].kategori;
    const beklenen = MODEL.giderler.filter((g) => g.kategori === kategori).length;
    await panel.getByRole('checkbox', { name: new RegExp(`^${kategori} · `) }).check();
    await expect(sayac).toHaveText(`${beklenen} / ${hepsi} kalem`);
    const katSutun = await sutun(tablo, 'Kategori');
    const katlar = await tablo.locator('tbody tr').evaluateAll((trs, i) => trs.map((tr) => tr.querySelectorAll('td')[i]?.textContent ?? ''), katSutun);
    expect(new Set(katlar)).toEqual(new Set([kategori]));
    await expect(katDugme).toHaveAttribute('data-active', '');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(katDugme).toBeFocused();
    await page.getByRole('button', { name: 'Filtreleri temizle' }).click();
    await expect(sayac).toHaveText(`${hepsi} / ${hepsi} kalem`);
    await expect(katDugme).not.toHaveAttribute('data-active', '');
    // Aralık filtresi: Toplam ₺ en az.
    const toplamSutun = await sutun(tablo, 'Toplam ₺');
    const sayilar = async (i: number) =>
      (await tablo.locator('tbody tr').evaluateAll((trs, k) => trs.map((tr) => tr.querySelectorAll('td')[k]?.textContent ?? ''), i)).map((t) => (t.trim() === '—' ? null : Number(t.replace(/[^\d,]/g, '').replace(',', '.'))));
    const once = (await sayilar(toplamSutun)) as number[];
    const esik = [...once].sort((a, b) => a - b)[Math.floor(once.length / 2)];
    await page.getByRole('button', { name: 'Toplam ₺ sütununu filtrele' }).click();
    await page.getByRole('dialog', { name: 'Toplam ₺ sütununu filtrele' }).getByRole('textbox', { name: 'En az (₺)' }).fill(String(Math.floor(esik)));
    const sonra = (await sayilar(toplamSutun)) as number[];
    expect(sonra.length).toBeLessThan(once.length);
    expect(sonra.every((v) => v >= Math.floor(esik))).toBe(true);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Filtreleri temizle' }).click();
    // Boş ay (—): Ekim ’26’da 1 ₺ ve üstü → boş ay dışarıda; “Boş (—) olanlar da” → geri gelir.
    const eki = await sutun(tablo, 'Eki ’26Ekim 2026');
    const bosVar = (await sayilar(eki)).some((v) => v === null);
    await page.getByRole('button', { name: 'Ekim 2026 sütununu filtrele' }).click();
    const ayPanel = page.getByRole('dialog', { name: 'Ekim 2026 sütununu filtrele' });
    await ayPanel.getByRole('textbox', { name: 'En az (₺)' }).fill('1');
    expect((await sayilar(eki)).some((v) => v === null)).toBe(false);
    await ayPanel.getByRole('checkbox', { name: 'Boş (—) olanlar da' }).check();
    expect((await sayilar(eki)).some((v) => v === null)).toBe(bosVar);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Filtreleri temizle' }).click();
    // Tablo filtresi (panel) ve sütun filtresi (huni) ayrı; ikisi birlikte uygulanır.
    await expect(page.getByRole('group', { name: 'Tablo filtreleri' })).toBeVisible();
    await page.getByRole('button', { name: /^Kategori:/ }).click();
    await page.getByRole('checkbox', { name: kategori, exact: true }).check();
    await page.keyboard.press('Escape');
    await expect(sayac).toHaveText(`${beklenen} / ${hepsi} kalem`);
    const katToplam = (await sayilar(toplamSutun)) as number[];
    const enBuyuk = Math.max(...katToplam);
    await page.getByRole('button', { name: 'Toplam ₺ sütununu filtrele' }).click();
    await page.getByRole('dialog', { name: 'Toplam ₺ sütununu filtrele' }).getByRole('textbox', { name: 'En az (₺)' }).fill(String(Math.floor(enBuyuk)));
    await page.keyboard.press('Escape');
    const ikisi = (await sayilar(toplamSutun)) as number[];
    expect(ikisi.length).toBe(katToplam.filter((v) => v >= Math.floor(enBuyuk)).length);
    const katlar2 = await tablo.locator('tbody tr').evaluateAll((trs, i) => trs.map((tr) => tr.querySelectorAll('td')[i]?.textContent ?? ''), katSutun);
    expect(new Set(katlar2)).toEqual(new Set([kategori]));
  });

  // İnceleme bulguları (2026-10-21): klavye odağı görünür, “50.000” yazılabilir, gizlenen sütunun filtresi kalkar, ı/i araması.
  test('kalemler veri tablosu: filtre kutularında klavye odağı görünür (etiket alt çizgisi), halka yok', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockScript(page, { ozet: 'odak', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const odakEtiketi = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const kok = el.closest('.opex-filter, .opex-check');
        const etiket = kok?.querySelector('.opex-field-label, .opex-check-label');
        const cs = etiket ? getComputedStyle(etiket) : null;
        return { etiket: etiket?.textContent ?? '', alt: cs?.textDecorationLine ?? '', kalinlik: parseFloat(cs?.textDecorationThickness ?? '0'), halka: getComputedStyle(el).outlineStyle };
      });
    // Tablo filtreleri: seçim kutusu (düğme) ve onay kutusu. WebKit Tab ile düğmeye odak vermez: orada not_run.
    let o = { etiket: '', alt: '', kalinlik: 0, halka: '' };
    if (browserName !== 'webkit') {
      await page.getByRole('button', { name: /^Kategori:/ }).focus();
      await page.keyboard.press('Tab');
      o = await odakEtiketi();
      expect(o.etiket).toBe('Bu ay');
      expect(o.alt).toContain('underline');
      expect(o.kalinlik).toBeGreaterThanOrEqual(3);
      expect(o.halka === 'none' || o.halka === '').toBe(true);
    }
    // Hızlı filtre onay kutusu (araç satırında). WebKit (Safari varsayılanı) Tab ile onay kutusuna odak vermez: not_run.
    if (browserName !== 'webkit') {
      await page.getByRole('switch').last().focus();
      await page.keyboard.press('Tab');
      o = await odakEtiketi();
      expect(o.etiket).toBe('Boş ay');
      expect(o.alt).toContain('underline');
    }
    // Sütun filtresi paneli: sayı kutusu.
    await page.getByRole('button', { name: 'Toplam ₺ sütununu filtrele' }).focus();
    await page.keyboard.press('Enter');
    const panel = page.getByRole('dialog', { name: 'Toplam ₺ sütununu filtrele' });
    await panel.getByRole('textbox', { name: 'En az (₺)' }).focus();
    await page.keyboard.press('Tab');
    o = await odakEtiketi();
    expect(o.etiket).toBe('En çok (₺)');
    expect(o.alt).toContain('underline');
  });

  test('kalemler veri tablosu: “50.000” yazılır (binlik nokta), gizlenen sütunun filtresi kalkar, “insta” Instagram’ı bulur', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const model = buildModel({ giderler: [...exampleTohum.giderler, ['Instagram reklam', '', 'Teknoloji', 'Pazarlama', 'TRY', 60000, 'Genel', false, true, '', '']] });
    await mockScript(page, { ozet: 'ham', model }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const tablo = page.getByRole('region', { name: `Kalemler · ${planEtiket(model)}` });
    const sayac = page.locator('.opex-veri-sayi');
    const hepsi = model.giderler.length + model.kisiler.length;
    // Binlik noktalı tutar yazılırken kutu boşalmaz; filtre uygulanır.
    const enAz = page.getByRole('textbox', { name: 'Toplam ₺ en az' });
    await enAz.pressSequentially('50.000');
    await expect(enAz).toHaveValue('50.000');
    const toplamSutun = await sutun(tablo, 'Toplam ₺');
    const toplamlar = (await tablo.locator('tbody tr').evaluateAll((trs, i) => trs.map((tr) => tr.querySelectorAll('td')[i]?.textContent ?? ''), toplamSutun)).map((t) => Number(t.replace(/[^\d,]/g, '').replace(',', '.')));
    expect(toplamlar.length).toBeGreaterThan(0);
    expect(toplamlar.every((v) => v >= 50000)).toBe(true);
    await page.getByRole('button', { name: 'Filtreleri temizle' }).click();
    // Ay sütunu filtresi gizlenince kalkar (görünmeyen filtre satırları azaltmaz).
    await page.getByRole('button', { name: 'Kasım 2026 sütununu filtrele' }).click();
    await page.getByRole('dialog', { name: 'Kasım 2026 sütununu filtrele' }).getByRole('textbox', { name: 'En az (₺)' }).fill('1000000');
    await page.keyboard.press('Escape');
    await expect(sayac).not.toHaveText(`${hepsi} / ${hepsi} kalem`);
    await page.getByRole('button', { name: 'Sütunlar' }).click();
    await page.getByRole('checkbox', { name: /Ay sütunları/ }).uncheck();
    await page.keyboard.press('Escape');
    await expect(sayac).toHaveText(`${hepsi} / ${hepsi} kalem`);
    // Ay sütunları gizliyken “Önceki aya göre” satırı yok.
    await expect(tablo.locator('tfoot th', { hasText: 'Önceki aya göre' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Sütunlar' }).click();
    await page.getByRole('checkbox', { name: /Ay sütunları/ }).check();
    await page.keyboard.press('Escape');
    // Türkçe büyük I: “insta” → “Instagram reklam”.
    await page.getByRole('searchbox', { name: 'Kalem sütununda ara' }).fill('insta');
    await expect(tablo.locator('tbody th')).toHaveText([/^Instagram reklam/]);
  });

  test('tablo filtresi seçimi yalnız onay kutusu: kutuda hap yok, özet “Hepsi” / değer / “N seçili”; Temizle', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockScript(page, { ozet: 'secim', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const sayac = page.locator('.opex-veri-sayi');
    const hepsi = MODEL.giderler.length + MODEL.kisiler.length;
    await expect(page.getByRole('button', { name: 'Kategori: Hepsi' })).toBeVisible();
    await page.getByRole('button', { name: 'Kategori: Hepsi' }).click();
    const [a, b] = [...new Set(MODEL.giderler.map((g) => g.kategori))];
    await page.getByRole('checkbox', { name: a, exact: true }).check();
    await expect(page.getByRole('button', { name: `Kategori: ${a}` })).toBeVisible();
    await page.getByRole('checkbox', { name: b, exact: true }).check();
    await expect(page.getByRole('button', { name: 'Kategori: 2 seçili' })).toBeVisible();
    const n = MODEL.giderler.filter((g) => g.kategori === a || g.kategori === b).length;
    await expect(sayac).toHaveText(`${n} / ${hepsi} kalem`);
    await expect(page.locator('.opex-filtreler [class*="Pill"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Temizle', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Kategori: Hepsi' })).toBeVisible();
    await expect(sayac).toHaveText(`${hepsi} / ${hepsi} kalem`);
  });

  // Kullanıcı kararları 2026-10-21: arama kutusunun üstünde ve altında eşit boşluk; sabit sütun kaydırılınca kenar gölgesi.
  test('kalemler veri tablosu: arama kutusu boşlukları eşit; yatay kaydırınca sabit Kalem sütununda kenar çizgisi ve gölge', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockScript(page, { ozet: 'sabit', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const tablo = page.getByRole('region', { name: KALEMLER });
    const kutu = tablo.getByRole('searchbox', { name: 'Kalem sütununda ara' });
    const [hucre, input] = [await kutu.locator('xpath=ancestor::td[1]').boundingBox(), await kutu.boundingBox()];
    const ust = input!.y - hucre!.y;
    const alt = hucre!.y + hucre!.height - (input!.y + input!.height);
    expect(Math.abs(ust - alt), `üst ${ust}, alt ${alt}`).toBeLessThanOrEqual(2);
    // Gölge, kaymayan çerçevedeki katman (birleşik kenarlıklı hücre box-shadow çizmez): görünürlüğü ve yeri ölçülür.
    const golge = () =>
      tablo.evaluate((el) => {
        const cs = getComputedStyle(el.parentElement!, '::after');
        const sabit = el.querySelector('thead th.cell-sticky')!.getBoundingClientRect().width;
        // Katman görünür ve sabit sütunun sağ kenarında.
        return cs.content !== 'none' && cs.opacity === '1' && Math.abs(parseFloat(cs.left) - sabit) < 2 ? 'var' : 'none';
      });
    expect(await golge()).toBe('none');
    await tablo.evaluate((el) => {
      el.scrollLeft = 400;
      el.dispatchEvent(new Event('scroll'));
    });
    await expect.poll(golge).toBe('var');
    await tablo.evaluate((el) => {
      el.scrollLeft = 0;
      el.dispatchEvent(new Event('scroll'));
    });
    await expect.poll(golge).toBe('none');
  });

  // Kullanıcı kararı 2026-10-21: alt toplamlar gövdeden belirgin ayrı (kalın ayırıcı, farklı zemin).
  test('kalemler veri tablosu: alt toplamlar gövdeden ayrı — kalın ayırıcı ve farklı zemin', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockScript(page, { ozet: 'alt', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const tablo = page.getByRole('region', { name: KALEMLER });
    const st = await tablo.evaluate((el) => {
      const ilkAlt = el.querySelector('tfoot tr')!;
      const govde = el.querySelector('tbody tr td')!;
      const alt = ilkAlt.querySelector('td')!;
      const sabit = ilkAlt.querySelector('th.cell-sticky')!;
      return {
        cizgi: getComputedStyle(alt).backgroundImage.includes('linear-gradient') ? parseFloat(getComputedStyle(alt).backgroundSize.split(' ')[1]) : 0,
        govde: getComputedStyle(govde).backgroundColor,
        alt: getComputedStyle(alt).backgroundColor,
        sabit: getComputedStyle(sabit).backgroundColor,
        sabitCizgi: getComputedStyle(sabit).backgroundImage,
      };
    });
    expect(st.cizgi).toBeGreaterThanOrEqual(2);
    expect(st.alt).not.toBe(st.govde);
    // Sabit Kalem hücresi de aynı zeminde ve üstünde çizgi (zemini çizgiyi örtmez).
    expect(st.sabit).toBe(st.alt);
    expect(st.sabitCizgi).toContain('linear-gradient');
  });

  test('kalemler veri tablosu 375 px: sayfa taşmaz, tablo kendi kutusunda kayar; filtreler tek sütun', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mockScript(page, { ozet: 'veri-375', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    await expect(page.locator('.opex-veri')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const scroll = page.getByRole('region', { name: KALEMLER });
    expect(await scroll.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    // Görünen filtre öğeleri (çoklu seçimin gizli form alanı sayılmaz) aynı sol hizada: tek sütun.
    const filtreler = await page.locator('.opex-filtreler > .opex-filter').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
    expect(filtreler.length).toBeGreaterThanOrEqual(7);
    expect(new Set(filtreler).size).toBe(1);
  });

  test('teşvik yoksa bileşim notunda teşvik yok; işveren payı tam', async ({ page }) => {
    const tesviksiz = JSON.parse(JSON.stringify(MODEL)) as typeof MODEL;
    for (const k of tesviksiz.kisiler) for (const s of [...k.y2026.aylar, ...k.y2027.aylar]) s.tesvik = 0;
    await mockScript(page, { ozet: 'tesviksiz', model: tesviksiz }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    const kutu = page.locator('.chart', { hasText: 'Netten işveren maliyetine' }).first();
    await expect(kutu.locator('figcaption, .chart-note').first()).not.toContainText('teşvik');
    await kutu.scrollIntoViewIfNeeded();
    await expect(kutu.locator('svg')).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => kutu.locator('svg').textContent()).toContain('İşveren payı (teşvik sonrası)');
  });

  test('genişlik değişince (1280 → 375 → 1280) grafikler yeniden ölçülür; sayfada hata yok', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __hatalar: string[] }).__hatalar = [];
      window.addEventListener('error', (e) => (window as unknown as { __hatalar: string[] }).__hatalar.push(String(e.message)));
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockScript(page, { ozet: 'boyut', model: MODEL }, 'open');
    await page.goto(PATH);
    await hydrated(page);
    await drawAll(page);
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(600);
    }
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __hatalar: string[] }).__hatalar)).toEqual([]);
    const plan = page.locator('.chart', { hasText: 'Aylık plan' }).first();
    await plan.scrollIntoViewIfNeeded();
    expect(await cakisanEtiketler(plan.locator('svg'))).toEqual([]);
  });

  // Kullanıcı kararı 2026-10-20: aylık plan masaüstünde dikey ve az yer kaplar, telefonda yatay; kişi bordrosu yatay.
  for (const [width, height, dikey] of [[1280, 800, true], [375, 812, false]] as const) {
    test(`aylık plan ${width} px: ${dikey ? 'dikey, alçak, 15 ayın hepsi yazılı' : 'yatay, ay başına tek satır'}; kişi bordrosu yatay`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await mockScript(page, { ozet: `plan-${width}`, model: MODEL }, 'open');
      await page.goto(PATH);
      await hydrated(page);
      const plan = page.locator('.chart', { hasText: 'Aylık plan' }).first().locator('.chart-canvas');
      await expect(plan).toHaveAttribute('data-kind', 'opex-stack');
      await plan.scrollIntoViewIfNeeded();
      await expect.poll(() => plan.locator('svg text').allTextContents(), { timeout: 10_000 }).toContain('Ara ’27');
      await page.waitForTimeout(400);
      const aylar = await plan.locator('svg text').evaluateAll((els) =>
        els.filter((t) => /’2[67]$/.test(t.textContent ?? '')).map((t) => ({ x: t.getBoundingClientRect().left, y: t.getBoundingClientRect().top })),
      );
      expect(aylar).toHaveLength(15);
      const [a, b] = aylar;
      const yukseklik = await plan.evaluate((el) => el.getBoundingClientRect().height);
      if (dikey) {
        // Ay etiketleri yan yana (dikey çubuk); kutu alçak (16rem).
        expect(Math.abs(b.y - a.y)).toBeLessThan(2);
        expect(b.x).toBeGreaterThan(a.x);
        expect(yukseklik).toBeLessThanOrEqual(260);
      } else {
        // Ay etiketleri alt alta (yatay çubuk); ay başına tek satır yüksekliği (üç satırlık 68 px değil).
        expect(b.y - a.y).toBeGreaterThan(20);
        expect(Math.abs(b.x - a.x)).toBeLessThan(10);
        expect(yukseklik).toBeLessThan(15 * 44);
      }
      expect(await cakisanEtiketler(plan.locator('svg'))).toEqual([]);
      await expect(page.locator('.chart', { hasText: ': aylık bordro' }).first().locator('.chart-canvas')).toHaveAttribute('data-kind', 'opex-stack-h');
    });
  }

  for (const width of [320, 768]) {
    test(`${width} px: grafik ipucu grafik kutusunda kalır (kırpılmaz, taşmaz)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await mockScript(page);
      await page.goto(PATH);
      await hydrated(page);
      await connect(page);
      await drawAll(page);
      const hosts = page.locator('.chart-host');
      let shown = 0;
      for (let i = 0; i < (await hosts.count()); i++) {
        const host = hosts.nth(i);
        await host.scrollIntoViewIfNeeded();
        const box = (await host.boundingBox())!;
        await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
        await page.waitForTimeout(400);
        const r = await host.evaluate((h) => {
          const tip = [...h.querySelectorAll<HTMLElement>(':scope > div')].find((d) => d.style.zIndex === '9999999');
          if (!tip || getComputedStyle(tip).display === 'none' || getComputedStyle(tip).visibility === 'hidden' || Number(getComputedStyle(tip).opacity) === 0) return null;
          const a = tip.getBoundingClientRect();
          const b = h.getBoundingClientRect();
          return { inside: a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1, a: [a.left, a.right, a.top, a.bottom].map(Math.round), b: [b.left, b.right, b.top, b.bottom].map(Math.round) };
        });
        if (!r) continue;
        shown++;
        expect(r.inside, `grafik ${i}: ipucu ${r.a} kutu ${r.b}`).toBe(true);
      }
      expect(shown, 'en az bir ipucu açıldı').toBeGreaterThan(2);
    });
  }

  test('yalnız Roboto indirilir (Outfit indirilmez); yazı tipi yüklü', async ({ page }) => {
    const fonts: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'font') fonts.push(r.url());
    });
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('15px "Roboto Variable"'))).toBe(true);
    expect(fonts.some((u) => /roboto/i.test(u))).toBe(true);
    expect(fonts.filter((u) => /outfit/i.test(u))).toEqual([]);
  });

  test('koyu tema: grafik paleti koyu yüzey adımlarına geçer', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const viz = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--viz-1').trim());
    expect(viz).toBe('#3987e5');
  });

  test('klavye: Tab görünür odak modunu açar; düğmelerde çevreleyen halka yok, alt çizgi var', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'not_run: Playwright WebKit Tab ile düğmelere odak vermez (macOS tam klavye erişimi kapalı)');
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const refresh = page.getByRole('button', { name: 'Şimdi yenile' });
    await refresh.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const state = await refresh.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { mode: document.documentElement.dataset.focusMode, focused: document.activeElement === el, outline: cs.outlineStyle, deco: cs.textDecorationLine, shadow: cs.boxShadow };
    });
    expect(state).toMatchObject({ mode: 'keyboard', focused: true, outline: 'none', deco: 'underline', shadow: 'none' });
  });
});

/** Çizilmiş ECharts örnekleri üzerinde sayfa içinde çalışır (aynı modül örneği; ek global yok). */
function onCharts<T>(page: Page, fn: string) {
  return page.evaluate(async (body) => {
    const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('echarts-setup'));
    if (!url) return [] as unknown as T;
    const { echarts } = await import(url);
    const charts = [...document.querySelectorAll<HTMLElement>('.chart-canvas .chart-host')].map((el) => ({ el, inst: echarts.getInstanceByDom(el), kind: (el.parentElement as HTMLElement).dataset.kind }));
    return new Function('charts', body)(charts) as T;
  }, fn);
}

test.describe('Giderler: güvenlik, kenar, etkileşim alanı ve hareket', () => {
  test('Sheets’ten gelen ad HTML olarak çalışmaz: ipucunda metin olarak görünür', async ({ page }) => {
    const evil = '<img src=x onerror="window.__xss=1">';
    const model = buildModel({
      giderler: [
        [evil, '', 'Teknoloji', 'Yapay Zekâ', 'USD', 10, 'Kur', false, true, 'javascript:alert(1)', ''],
        ['Normal', '', 'Ofis ve işletme', `${evil} kategori`, 'TRY', 100, 'Genel', false, true, '', ''],
      ],
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await mockScript(page, { ozet: 'xss', model });
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    await drawAll(page);
    const tips = await onCharts<{ kind: string; html: string; imgs: number }[]>(
      page,
      `const out = [];
       for (const c of charts) {
         if (c.kind !== 'opex-bar') continue;
         c.inst.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: 0 });
         const tip = [...c.el.querySelectorAll('div')].find((d) => d.style.position === 'absolute' && d.innerHTML.includes('br'));
         out.push({ kind: c.kind, html: tip ? tip.innerHTML : '', imgs: tip ? tip.querySelectorAll('img').length : -1 });
       }
       return out;`,
    );
    expect(tips.length).toBeGreaterThan(0);
    for (const t of tips) expect(t.imgs, t.html).toBe(0);
    expect(tips.some((t) => t.html.includes('&lt;img'))).toBe(true);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    // javascript: fatura bağlantısı çizilmez; tablo adı metin olarak gösterir.
    await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
    await expect(page.getByRole('region', { name: KALEMLER })).toContainText(evil);
    expect(errors).toEqual([]);
  });

  // Köşe sözleşmesi (kullanıcı kararı 2026-10-27, docs/ux.md §6.3): bütün köşeler 0; eski “karşı köşeler yuvarlak” kabulü kalktı.
  test('bağlı durumda kenar sistemi: düz çizgi var, değdiği köşeler radiussuz', async ({ page }) => {
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      const px = (v: string) => parseFloat(v) || 0;
      for (const el of document.querySelectorAll<HTMLElement>('[data-edge]')) {
        const cs = getComputedStyle(el);
        const touched = el.dataset.edge === 'start' ? [cs.borderStartStartRadius, cs.borderEndStartRadius] : [cs.borderStartStartRadius, cs.borderStartEndRadius];
        if (touched.some((c) => px(c) !== 0)) out.push(`${el.className}: çizgi köşesi ${touched.join(' ')}`);
        if (getComputedStyle(el, '::after').content === 'none') out.push(`${el.className}: çizgi yok`);
      }
      return out;
    });
    expect(await page.locator('.opex-hero[data-edge="top"]').count()).toBe(1);
    expect(bad).toEqual([]);
  });

  test('bağımsız kontroller ve bağlantılar en az 44 CSS px (onay kutusu satırı dahil)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    const formHeights = await page.locator('.opex-btn, .opex-check-body, .opex-input').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(Math.min(...formHeights)).toBeGreaterThanOrEqual(44);
    await connect(page);
    const heights = await page
      .locator('.opex-btn, .opex-toggle, .opex-year, .opex-icon-btn, a[data-standalone]')
      .evaluateAll((els) => els.filter((el) => el.getClientRects().length).map((el) => [el.textContent?.trim(), el.getBoundingClientRect().height] as const));
    expect(heights.length).toBeGreaterThan(8);
    expect(heights.filter(([, h]) => h < 44)).toEqual([]);
  });

  test('seçili düğme seçili olmayandan belirgin ayrılır (zemin karşıtlığı ≥ 3:1)', async ({ page }) => {
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const [on, off] = await Promise.all(
      ['true', 'false'].map((v) => page.locator(`.opex-toggle[aria-pressed="${v}"]`).first().evaluate((el) => getComputedStyle(el).backgroundColor)),
    );
    const lum = (rgb: string) => {
      const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map((x) => Number(x) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [a, b] = [lum(on), lum(off)].sort((x, y) => y - x);
    expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(3);
  });

  for (const reduced of [false, true]) {
    test(`grafik hareketi${reduced ? ': hareket azaltmada kapalı' : ': seri ve durum simetrik cubicInOut, 120–320 ms'}`, async ({ page }) => {
      if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
      await mockScript(page);
      await page.goto(PATH);
      await hydrated(page);
      await connect(page);
      await page.getByRole('tab', { name: /^2027/ }).click();
      expect(await drawAll(page)).toBe(8);
      const models = await onCharts<{ kind: string; series: [unknown, unknown, unknown][]; state: [unknown, unknown] }[]>(
        page,
        `return charts.map((c) => {
           const o = c.inst.getOption();
           const series = [];
           c.inst.getModel().eachSeries((s) => series.push([s.get('animation'), s.get('animationEasing'), s.get('animationDuration')]));
           return { kind: c.kind, series, state: [o.stateAnimation.easing, o.stateAnimation.duration] };
         });`,
      );
      expect(new Set(models.map((x) => x.kind))).toEqual(new Set(['opex-bar', 'opex-stack', 'opex-stack-h', 'opex-group', 'opex-bilesim']));
      for (const m of models) {
        for (const [animation, easing, duration] of m.series) {
          if (reduced) expect(animation, m.kind).toBe(false);
          else {
            expect([animation, easing], m.kind).toEqual([true, 'cubicInOut']);
            expect(Number(duration), m.kind).toBeGreaterThanOrEqual(120);
            expect(Number(duration), m.kind).toBeLessThanOrEqual(320);
          }
        }
        if (reduced) expect(m.state[1], m.kind).toBe(0);
        else expect(m.state[0], m.kind).toBe('cubicInOut');
      }
    });
  }
});
