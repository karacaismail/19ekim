import { expect, test, type Page, type Request, type Route } from '@playwright/test';
import { OPEX_ENDPOINT, OPEX_POLL_MS, OPEX_STORE_KEY } from '../src/data/opex';
import { buildModel, reply } from './opex-fixture';

/**
 * Giderler (OPEX): Google Apps Script web uygulaması sahte yanıtla (kurgusal örnek tohumdan motorun gerçek çıktısı).
 * Kullanıcı kararı 2026-10-20: Roboto, en küçük metin 15 CSS px.
 */
const PATH = 'giderler/';
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbTestDeploymentId_1234567890abcdef/exec';
const KEY = 'opex_test_anahtari_123';
const MODEL = buildModel();
const MODEL_2 = buildModel({ params: { kira_artis_2027: 0.5 }, giderler: undefined });
const WIDTHS = [320, 360, 375, 390, 768, 1280];
const lira = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

interface Server {
  requests: Request[];
  bodies: { anahtar?: string; ozet?: string }[];
  /** Doğru anahtarla gelen istek gövdeleri (sayfanın varsayılan anahtarsız isteği hariç). */
  keyed: () => { anahtar?: string; ozet?: string }[];
  set: (next: { ozet: string; model: typeof MODEL } | { error: string; message: string }) => void;
}

/**
 * Apps Script yanıtını taklit eder: özet aynıysa {degismedi}, değilse tüm model. CORS başlığı gerçek uçtaki gibi.
 * keyed (varsayılan): yalnız KEY ile veri döner, anahtarsız istek “yetki” alır (sayfa formu gösterir).
 * open: Sheets → Sayfa erişimi “Herkese açık”; anahtar gerekmez.
 */
async function mockScript(
  page: Page,
  initial: { ozet: string; model: typeof MODEL } | { error: string; message: string } = { ozet: 'ozet-1', model: MODEL },
  mode: 'keyed' | 'open' = 'keyed',
): Promise<Server> {
  let state = initial;
  const server: Server = { requests: [], bodies: [], keyed: () => server.bodies.filter((b) => b.anahtar === KEY), set: (next) => (state = next) };
  await page.route('https://script.google.com/**', async (route: Route) => {
    const request = route.request();
    server.requests.push(request);
    const body = JSON.parse(request.postData() ?? '{}') as { anahtar?: string; ozet?: string };
    server.bodies.push(body);
    const json =
      'error' in state
        ? { ok: false, hata: state.error, mesaj: state.message }
        : mode === 'keyed' && body.anahtar !== KEY
          ? { ok: false, hata: 'yetki', mesaj: 'Bu veri ucu erişim anahtarı istiyor ya da anahtar geçersiz.' }
          : body.ozet === state.ozet
          ? { ok: true, sema: 1, ozet: state.ozet, degismedi: true, denetlendi: new Date().toISOString(), degisti: new Date().toISOString() }
          : reply(state.model, state.ozet);
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(json) });
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
    await expect(page.locator('.opex-hero-value')).toHaveText(lira(MODEL.ozet.buAy.toplam));
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
    await expect(page.locator('.opex-hero-value')).toHaveText(lira(MODEL.ozet.buAy.toplam));
    await expect(page.getByRole('heading', { name: 'Ekim 2026 özeti' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Google Sheets’te aç' })).toHaveAttribute('href', /^https:\/\/docs\.google\.com\/spreadsheets\//);
    // Kalem tablosu: döviz + ₺ karşılığı, ödeme durumu metinle (renk tek başına değil).
    const table = page.getByRole('region', { name: 'Ekim 2026 kalemleri' });
    await expect(table).toContainText('Sunucu A');
    await expect(table).toContainText('€50,00');
    await expect(table).toContainText('Tutar girilmedi');
    await expect(table).toContainText('Ödendi');
    expect(await drawAll(page)).toBe(9);
    expect(errors).toEqual([]);
  });

  test('Sheets değişince sayfa kendiliğinden güncellenir; değişmezse yalnız özet sorulur', async ({ page }) => {
    await page.clock.install();
    const server = await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    await expect(page.locator('.opex-hero-value')).toHaveText(lira(MODEL.ozet.buAy.toplam));

    await page.clock.runFor(OPEX_POLL_MS + 500);
    await expect.poll(() => server.keyed().length).toBeGreaterThanOrEqual(2);
    expect(server.keyed()[1]).toEqual({ anahtar: KEY, ozet: 'ozet-1' });

    const changed = buildModel({ giderler: [['Yeni sunucu', '', 'Teknoloji', 'Sunucu & Bulut', 'TRY', 12345, 'Genel', false, true, '', '']] });
    server.set({ ozet: 'ozet-2', model: changed });
    await page.clock.runFor(OPEX_POLL_MS + 500);
    await expect(page.locator('.opex-hero-value')).toHaveText(lira(changed.ozet.buAy.toplam));
    await expect(page.getByRole('status').filter({ hasText: 'Veriler güncellendi' })).toHaveCount(1);
    await expect(page.getByRole('region', { name: 'Ekim 2026 kalemleri' })).toContainText('Yeni sunucu');
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

  test('kalemler üç grup: Teknoloji, Ofis ve işletme, Personel; Tümü toplamı toplam OPEX', async ({ page }) => {
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const group = page.getByRole('group', { name: 'Grup süzgeci' });
    const n = { tech: MODEL.giderler.filter((g) => g.kume === 'teknoloji').length, office: MODEL.giderler.filter((g) => g.kume === 'ofis').length, people: MODEL.kisiler.length };
    await expect(group.getByRole('button')).toHaveText([`Tümü (${n.tech + n.office + n.people})`, `Teknoloji (${n.tech})`, `Ofis ve işletme (${n.office})`, `Personel (${n.people})`]);
    const table = page.getByRole('region', { name: 'Ekim 2026 kalemleri' });
    const total = () => table.locator('tr[data-tone="total"] td').nth(2);
    const exact = (v: number) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} ₺`;
    await expect(total()).toHaveText(exact(MODEL.ozet.buAy.toplam));
    await group.getByRole('button', { name: /^Personel/ }).click();
    await expect(group.getByRole('button', { name: /^Personel/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(table).toContainText('Örnek Uzman');
    await expect(table).not.toContainText('Sunucu A');
    await expect(total()).toHaveText(exact(MODEL.ozet.buAy.insan));
    await group.getByRole('button', { name: /^Teknoloji/ }).click();
    await expect(total()).toHaveText(exact(MODEL.ozet.buAy.teknoloji));
  });

  test('12 aylık plan: Ekim 2026’dan Eylül 2027’ye her ay ayrı; toplam satırı', async ({ page }) => {
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const table = page.getByRole('region', { name: 'Aylık gider planı · Ekim 2026 – Eylül 2027' });
    const heads = table.locator('tbody th');
    await expect(heads).toHaveCount(13);
    await expect(heads.nth(0)).toHaveText('Ekim 2026');
    await expect(heads.nth(3)).toHaveText('Ocak 2027');
    await expect(heads.nth(12)).toHaveText('12 ay toplamı');
    await expect(page.locator('.chart-canvas[data-kind="opex-stack"]').first()).toBeVisible();
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
      await expect(page.locator('.opex-hero-value')).toHaveText(lira(MODEL.ozet.buAy.toplam));
      await expect(loader).toHaveCount(0);
    });
  }

  test('netten brüte: kişi ve yıl seçimi aria-pressed ile anında değişir', async ({ page }) => {
    await mockScript(page);
    await page.goto(PATH);
    await hydrated(page);
    await connect(page);
    const group = page.getByRole('group', { name: 'Kişi' });
    const uzman = group.getByRole('button', { name: 'Örnek Uzman' });
    await uzman.click();
    await expect(uzman).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('region', { name: 'Örnek Uzman · 2026 aylık bordro' })).toContainText('Yıl toplamı');
    await page.getByRole('group', { name: 'Yıl' }).getByRole('button', { name: '2027 (zamlı)' }).click();
    await expect(page.getByRole('region', { name: 'Örnek Uzman · 2027 aylık bordro' })).toBeVisible();
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
        const notRoboto = texts
          .filter((el) => !el.closest('code, pre, kbd'))
          .filter((el) => !/^"?Roboto Variable"?/.test(getComputedStyle(el).fontFamily))
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
      expect(result.overflow, 'sayfa yatay taşıyor').toBeLessThanOrEqual(0);
      expect(result.small, '15 px altı metin').toEqual([]);
      expect(result.light).toEqual([]);
      expect(result.notRoboto, 'Roboto dışı metin').toEqual([]);
      expect(result.headerOverflow).toEqual([]);
      expect(result.chart, 'grafik metni').toEqual([]);
      expect(await clipped(page), 'kırpılan öğe').toEqual([]);
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
    await expect(page.getByRole('region', { name: 'Ekim 2026 kalemleri' })).toContainText(evil);
    expect(errors).toEqual([]);
  });

  test('bağlı durumda kenar sistemi: düz çizginin değdiği köşeler radiussuz, karşı köşeler yuvarlak', async ({ page }) => {
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
        if (el.matches('.opex-hero') && px(cs.borderEndEndRadius) === 0) out.push(`${el.className}: karşı köşe radiussuz`);
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
      .locator('.opex-btn, .opex-toggle, .opex-live a, a[data-standalone]')
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
      expect(await drawAll(page)).toBe(9);
      const models = await onCharts<{ kind: string; series: [unknown, unknown, unknown][]; state: [unknown, unknown] }[]>(
        page,
        `return charts.map((c) => {
           const o = c.inst.getOption();
           const series = [];
           c.inst.getModel().eachSeries((s) => series.push([s.get('animation'), s.get('animationEasing'), s.get('animationDuration')]));
           return { kind: c.kind, series, state: [o.stateAnimation.easing, o.stateAnimation.duration] };
         });`,
      );
      expect(new Set(models.map((x) => x.kind))).toEqual(new Set(['opex-bar', 'opex-stack', 'opex-stack-h', 'opex-group', 'opex-kopru']));
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
