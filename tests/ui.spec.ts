import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  '',
  'istihdam/',
  'hedefler/',
  'gelir-plani/',
  'eylem-plani/',
  'karar-yetkisi/',
  'karar-bekleyenler/',
  'buyume-modeli/',
  'partnership/',
  'roller/dijital-pazarlama/',
  'roller/pazarlamaci/',
  'roller/saha-uzmani/',
  'roller/ekip-lideri/',
  'roller/organizator/',
  'roller/asistan/',
  'roller/segika/',
  'bcg/',
  'applet/',
  'parametreler/',
  'notlar/',
  'giderler/',
  'nakit-akisi/',
  'arsiv/',
  'email/',
];

/** Grafikli sayfalar (ECharts yalnız bunlarda yüklenir). */
// Giderler grafikleri yalnız Sheets bağlantısıyla çizilir; ayrı testte (giderler.spec.ts) sahte yanıtla denetlenir.
// İş ortaklığı sayfasının grafikleri sekmelerde (bir anda tek bölüm çizilir); her sekme ayrı testte (partnership.spec.ts) denetlenir.
const CHART_PAGES = PAGES.filter((p) => !['istihdam/', 'arsiv/', 'parametreler/', 'notlar/', 'giderler/', 'nakit-akisi/', 'email/', 'applet/', 'partnership/'].includes(p));

/** Giderler sayfası varsayılan Apps Script ucunu sorar; testler gerçek Google’a gitmez (anahtar istenir → form). */
test.beforeEach(async ({ page }) => {
  await page.route('https://script.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false, hata: 'yetki', mesaj: 'test' }) }),
  );
});

/** Astro adası hidrasyonu bitince etkileşim React’e ulaşır. */
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });
/** Giriş kapısı: içerik hidrasyondan sonra çizilir (statik HTML'de yalnız form); alt bilgi içerikle birlikte gelir. */
const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });

const WIDTHS = [320, 360, 375, 390, 768, 1280];
const APPROVED_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';

/** Yerleşim, okunabilirlik ve tablo kuralları; sayfa içinde değerlendirilir. */
async function audit(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const visible = (el: Element) => {
      const cs = getComputedStyle(el);
      return el.getClientRects().length > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const small = [...document.querySelectorAll('body *')]
      .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()))
      .filter((el) => visible(el) && !el.closest('.visually-hidden'))
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}: ${getComputedStyle(el).fontSize}`);
    const light = [...document.querySelectorAll('body *')]
      .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()))
      .filter((el) => visible(el) && !el.closest('.visually-hidden'))
      .filter((el) => Number(getComputedStyle(el).fontWeight) < 300)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}: ${getComputedStyle(el).fontWeight}`);
    const headerOverflow = [...document.querySelectorAll('.data-table th')]
      .filter((th) => th.scrollWidth > th.clientWidth + 1)
      .map((th) => th.textContent?.trim());
    const breaking = [...document.querySelectorAll('.data-table th, .data-table td')]
      .filter((c) => {
        const cs = getComputedStyle(c);
        return cs.wordBreak === 'break-all' || cs.overflowWrap === 'anywhere';
      })
      .map((c) => c.textContent?.trim());
    const regions = [...document.querySelectorAll('.table-scroll')].map((r) => ({
      role: r.getAttribute('role'),
      tabindex: r.getAttribute('tabindex'),
      label: document.getElementById(r.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() ?? '',
      // Kaydırılan bölge ya bir tablo ya da geniş bir grafik taşır.
      hasContent: !!r.querySelector(r.classList.contains('chart-scroll') ? '.chart-canvas' : 'table'),
    }));
    return { overflow: doc.scrollWidth - window.innerWidth, small, light, headerOverflow, breaking, regions };
  });
}

test.describe('yerleşim ve okunabilirlik', () => {
  for (const width of WIDTHS) {
    test(`${width} px: yatay taşma yok, metin ≥ 14 px ve ağırlık ≥ 300, tablo başlıkları bölünmez`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await page.goto(path);
        await icerik(page);
        const result = await audit(page);
        expect(result.overflow, `${path} sayfası yatay taşıyor`).toBeLessThanOrEqual(0);
        expect(result.small, `${path} 14 px altı metin`).toEqual([]);
        expect(result.light, `${path} 300 altı yazı ağırlığı`).toEqual([]);
        expect(result.headerOverflow, `${path} başlık hücresi taşıyor`).toEqual([]);
        expect(result.breaking, `${path} zorlayıcı kelime bölme`).toEqual([]);
        for (const region of result.regions) {
          expect(region, `${path} kaydırma bölgesi`).toMatchObject({ role: 'region', tabindex: '0', hasContent: true });
          expect(region.label.length, `${path} tablo bölgesi etiketi`).toBeGreaterThan(0);
        }
      }
    });
  }

  test('320 px: geniş tablo ve Gantt kendi kapsayıcısında klavyeyle kayar', async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'not_run: Playwright WebKit ok tuşlarıyla varsayılan kaydırmayı uygulamıyor (sayfa kaydırmada da aynı); gerçek Safari’de elle doğrulanmalı',
    );
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('eylem-plani/');
    await icerik(page);
    for (const selector of ['.table-scroll:not(.chart-scroll)', '.chart-scroll']) {
      const region = page.locator(selector).first();
      const widths = await region.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
      expect(widths.scroll, selector).toBeGreaterThan(widths.client);
      await region.focus();
      for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
      await expect.poll(() => region.evaluate((el) => el.scrollLeft), { message: selector }).toBeGreaterThan(0);
    }
    expect((await audit(page)).overflow).toBeLessThanOrEqual(0);
  });
});

/** Odaklanmış öğenin göstergesini okur. */
async function focusState(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    return {
      label: `${el.tagName.toLowerCase()}.${el.className}`,
      mode: document.documentElement.dataset.focusMode,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      boxShadow: cs.boxShadow,
      decoLine: cs.textDecorationLine,
      decoThickness: cs.textDecorationThickness,
    };
  });
}

function isSingleEdgeShadow(shadow: string) {
  if (shadow === 'none') return true;
  // Yalnız iç (inset) tek kenar çubuğu: x ≠ 0, y = 0, bulanıklık = 0, yayılma = 0
  return shadow.split(/,(?![^(]*\))/).every((part) => {
    if (!/inset/.test(part)) return false;
    const nums = part.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
    const [x = 0, y = 0, blur = 0, spread = 0] = nums;
    return x !== 0 && y === 0 && blur === 0 && spread === 0;
  });
}

test.describe('odak', () => {
  test('işaretçi modunda başlar; yalnız Tab açar; çevre halkası yok; tek kenar gösterge var', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.goto('eylem-plani/');
    await icerik(page);
    const mode = () => page.evaluate(() => document.documentElement.dataset.focusMode);
    expect(await mode()).toBe('pointer');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await page.keyboard.type('a');
    expect(await mode(), 'ok, Escape veya yazma modu açmamalı').toBe('pointer');

    await page.keyboard.press(tab);
    expect(await mode()).toBe('keyboard');
    for (let i = 0; i < 40; i++) {
      const state = await focusState(page);
      if (state?.label.includes('table-scroll')) {
        const frame = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const before = getComputedStyle(el.parentElement as HTMLElement, '::before');
          return { content: before.content, width: before.width, outline: getComputedStyle(el).outlineStyle };
        });
        expect(frame.outline, 'tablo bölgesinde halka').toBe('none');
        expect(frame.content, 'tablo bölgesinde düz odak çubuğu').not.toBe('none');
        expect(frame.width).toBe('3px');
      } else if (state) {
        const noRing = state.outlineStyle === 'none' || parseFloat(state.outlineWidth) === 0;
        expect(noRing, `${state.label}: çevre halkası`).toBe(true);
        expect(isSingleEdgeShadow(state.boxShadow), `${state.label}: çevresel gölge ${state.boxShadow}`).toBe(true);
        const underline = state.decoLine.includes('underline') && parseFloat(state.decoThickness) >= 3;
        const bar = state.boxShadow !== 'none';
        expect(underline || bar, `${state.label}: görünür odak göstergesi yok`).toBe(true);
      }
      await page.keyboard.press(tab);
    }

    await page.mouse.click(5, 400);
    expect(await mode(), 'pointerdown görsel modu kapatmalı').toBe('pointer');
  });

  test('fareyle tıklanan bölgede gösterge veya halka görünmez', async ({ page }) => {
    await page.goto('roller/pazarlamaci/');
    await icerik(page);
    const region = page.locator('.table-scroll').first();
    await region.click();
    const state = await focusState(page);
    expect(state?.mode).toBe('pointer');
    expect(state?.outlineStyle === 'none' || parseFloat(state?.outlineWidth ?? '0') === 0).toBe(true);
    const bar = await region.evaluate((el) => getComputedStyle(el.parentElement as HTMLElement, '::before').content);
    expect(bar, 'işaretçi modunda odak çubuğu yok').toBe('none');
  });

  test('zorlanmış renk modunda halka yalnız klavye modunda', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced-colors emülasyonu yalnız Chromium’da');
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('');
    await icerik(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const keyboard = await focusState(page);
    expect(keyboard?.outlineStyle).toBe('solid');
    expect(keyboard?.outlineWidth).toBe('2px');
    await page.locator('.mainnav-link').nth(1).hover();
    await page.mouse.down();
    const pointer = await focusState(page);
    expect(pointer?.mode).toBe('pointer');
    expect(pointer?.outlineStyle === 'none' || parseFloat(pointer?.outlineWidth ?? '0') === 0).toBe(true);
    await page.mouse.up();
  });
});

test.describe('başlık ve İstihdam menüsü', () => {
  test('İstihdam menüsü: organizasyon, roller ve istihdam takvimi; etkin sayfa işaretli; Escape kapatır', async ({ page }) => {
    await page.goto('roller/segika/');
    await icerik(page);
    await hydrated(page);
    const tetik = page.getByRole('button', { name: 'İstihdam' });
    await expect(tetik).toHaveAttribute('data-section', 'true');
    await tetik.click();
    const menu = page.getByRole('menu', { name: 'İstihdam' });
    await expect(menu).toBeVisible();
    const ogeler = menu.getByRole('menuitem');
    // Kullanıcı kararı 2026-10-21: 1–7 sıralı numara, roller pozisyon adıyla; numarasız öğede aynı sade nokta.
    await expect(ogeler).toHaveText(['1Organizasyon şeması', '2Dijital pazarlama uzmanı', '3İstoç Pazarlama CRM uzmanı', '4Saha satış uzmanı', '5Organizatör', '6Segika CRM', '7Asistan', 'İstihdam takvimi']);
    await expect(menu.getByRole('menuitem', { name: 'Segika CRM' })).toHaveAttribute('aria-current', 'page');
    await expect(menu.locator('.tree-no')).toHaveCount(7);
    await expect(menu.getByRole('menuitem', { name: 'İstihdam takvimi' }).locator('.navmenu-bullet')).toHaveCount(1);
    // Numara ile yazı arasında güvenli boşluk (≥ 12 px); numaralı ve noktalı öğelerde yazılar hizalı.
    // Numara rozeti (veya nokta) ile ardındaki yazı arasındaki boşluk.
    const bosluk = await menu.getByRole('menuitem', { name: 'Segika CRM' }).evaluate((el) => {
      const isaret = el.querySelector('.tree-no')!;
      const r = document.createRange();
      r.selectNodeContents(isaret.nextSibling!);
      return r.getBoundingClientRect().left - isaret.getBoundingClientRect().right;
    });
    expect(bosluk).toBeGreaterThanOrEqual(11.5);
    const yaziSol = async (ad: string) => menu.getByRole('menuitem', { name: ad }).evaluate((el) => { const isaret = el.querySelector('.tree-no, .navmenu-bullet')!; const r = document.createRange(); r.selectNodeContents(isaret.nextSibling!); return Math.round(r.getBoundingClientRect().left); });
    expect(await yaziSol('İstihdam takvimi')).toBe(await yaziSol('Asistan'));
    // Panel markalı yüzeyde; ögede çevreleyen halka yok.
    const panel = await menu.evaluate((el) => getComputedStyle(el).backgroundColor);
    const yuzey = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--surface-raised').trim());
    expect(panel).not.toBe('rgba(0, 0, 0, 0)');
    expect(yuzey).not.toBe('');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });

  test('klavye: Tab ile tetikleyici, Enter açar, oklar ögeler arasında gezer; odak alt çizgiyle (halka yok)', async ({ page }) => {
    await page.goto('istihdam/');
    await icerik(page);
    await hydrated(page);
    const tetik = page.getByRole('button', { name: 'İstihdam' });
    await page.keyboard.press('Tab');
    await tetik.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'İstihdam' });
    await expect(menu).toBeVisible();
    // Menü odağı açıldıktan sonraki karede içeri alır; oklar ondan sonra.
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="menu"]'))).toBe(true);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    const odak = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { role: el.getAttribute('role'), text: el.textContent, outline: cs.outlineStyle, outlineWidth: cs.outlineWidth, shadow: cs.boxShadow, deco: cs.textDecorationLine };
    });
    expect(odak.role).toBe('menuitem');
    expect(odak.outline === 'none' || parseFloat(odak.outlineWidth) === 0).toBe(true);
    expect(odak.shadow).toBe('none');
    expect(odak.deco).toContain('underline');
    await expect(menu.getByRole('menuitem', { name: 'İstihdam takvimi' })).toHaveAttribute('aria-current', 'page');
    // Escape kapatır, odak tetikleyiciye döner (Safari fareyle tıklanan düğmeye odak vermediği için klavyeyle açılır).
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(tetik).toBeFocused();
  });

  /** Önceki başlık yükseklikleri (canlı site, 2026-10-20, 1280 px): kullanıcı kararı rol ≥ %75, diğerleri ≥ %50 az. */
  const ONCEKI: Record<string, number> = {
    '': 175, 'arsiv/': 203, 'bcg/': 259, 'buyume-modeli/': 293, 'eylem-plani/': 231, 'giderler/': 233, 'hedefler/': 366,
    'istihdam/': 203, 'karar-bekleyenler/': 203, 'karar-yetkisi/': 265, 'notlar/': 203, 'parametreler/': 299,
    'roller/asistan/': 468, 'roller/dijital-pazarlama/': 496, 'roller/ekip-lideri/': 553, 'roller/organizator/': 468,
    'roller/pazarlamaci/': 468, 'roller/saha-uzmani/': 525, 'roller/segika/': 557,
  };
  for (const [path, once] of Object.entries(ONCEKI)) {
    const rol = path.startsWith('roller/');
    const sinir = Math.floor(once * (rol ? 0.25 : 0.5));
    test(`başlık sıkışık (1280): /${path} ≤ ${sinir} px (önce ${once}, ${rol ? '−%75' : '−%50'})`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path);
      await icerik(page);
      // Giderler’de ayrı başlık alanı yok: başlık kırıntı satırında (kullanıcı kararı 2026-10-21).
      const kutu = (await page.locator('.hero').count()) ? '.hero' : '.crumbs-row';
      const h = await page.locator(kutu).first().evaluate((el) => el.getBoundingClientRect().height);
      expect(h).toBeLessThanOrEqual(sinir);
    });
  }

  // Kullanıcı kararı 2026-10-20: hedefler, eylem planı, MLM ağı, karar sayfaları ve parametreler “Pazarlama” menüsünde.
  // Kullanıcı kararı 2026-10-21: tema ani değişmez (“şimşek çakar gibi değil”): sayfa görünüm geçişiyle (destek varsa)
  // yumuşak geçer, anahtar topu kayar; hareket azaltmada anında.
  test('tema değişimi yumuşak: görünüm geçişi ve kayan anahtar; hareket azaltmada anında', async ({ page }) => {
    await page.goto('hedefler/');
    await icerik(page);
    await hydrated(page);
    const sure = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--motion-duration-theme').trim());
    expect(sure.endsWith('ms') ? parseFloat(sure) : parseFloat(sure) * 1000).toBe(320);
    const izle = () =>
      page.evaluate(() => {
        const w = window as unknown as { __gecis: boolean };
        w.__gecis = false;
        new MutationObserver(() => {
          if (document.documentElement.hasAttribute('data-tema-gecis')) w.__gecis = true;
        }).observe(document.documentElement, { attributes: true });
      });
    await izle();
    const vt = await page.evaluate(() => 'startViewTransition' in document);
    const sema = () => page.locator('html').getAttribute('data-mantine-color-scheme');
    const once = await sema();
    await page.getByRole('button', { name: 'Koyu tema' }).click();
    // Mantine şema değişiminde geçişleri kapatmaz: anahtar topu süreyle kayar.
    expect(parseFloat(await page.locator('.theme-thumb').evaluate((el) => getComputedStyle(el).transitionDuration))).toBeGreaterThan(0);
    await expect.poll(sema).not.toBe(once);
    if (vt) expect(await page.evaluate(() => (window as unknown as { __gecis: boolean }).__gecis)).toBe(true);
    await expect(page.locator('html')).not.toHaveAttribute('data-tema-gecis', '');
    // Hareket azaltmada görünüm geçişi yok, değişim anında.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await izle();
    const sonra = await sema();
    await page.getByRole('button', { name: 'Koyu tema' }).click();
    await expect.poll(sema).not.toBe(sonra);
    expect(await page.evaluate(() => (window as unknown as { __gecis: boolean }).__gecis)).toBe(false);
  });

  // Kullanıcı kararı 2026-10-21: üst gezinme öğeleri ayırt edilsin, menü olduğu anlaşılsın — simge ve ince ayırıcı.
  test('üst gezinme: her öğede simge, öğeler arasında ince dikey ayırıcı', async ({ page }) => {
    await page.goto('hedefler/');
    await icerik(page);
    const nav = page.getByRole('navigation', { name: 'Ana gezinme' });
    await expect(nav.locator('.mainnav-link .mainnav-icon')).toHaveCount(4);
    const ayiricilar = await nav.locator('.mainnav-list > li').evaluateAll((lis) => lis.map((li) => { const b = getComputedStyle(li, '::before'); return b.content !== 'none' && parseFloat(b.width) > 0 && parseFloat(b.height) > 0; }));
    expect(ayiricilar).toEqual([false, true, true, true]);
  });

  test('Pazarlama menüsü: sekiz sayfa; etkin sayfa işaretli; başlıkta yalnız İstihdam, Pazarlama, Giderler, Notlar', async ({ page }) => {
    await page.goto('karar-yetkisi/');
    await icerik(page);
    await hydrated(page);
    const nav = page.getByRole('navigation', { name: 'Ana gezinme' });
    await expect(nav.locator('.mainnav-link')).toHaveText([/^İstihdam/, /^Pazarlama/, /^Giderler/, 'Notlar']);
    const tetik = page.getByRole('button', { name: 'Pazarlama' });
    await expect(tetik).toHaveAttribute('data-section', 'true');
    await expect(page.getByRole('button', { name: 'İstihdam' })).not.toHaveAttribute('data-section', 'true');
    await tetik.click();
    const menu = page.getByRole('menu', { name: 'Pazarlama' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem')).toHaveText(['90 gün hedefleri', 'Gelir planı', 'Eylem planı', 'MLM ağı', 'İş ortaklığı', 'Karar yetkisi', 'Karar bekleyenler', 'Parametreler']);
    await expect(menu.getByRole('menuitem', { name: 'Karar yetkisi' })).toHaveAttribute('aria-current', 'page');
    await menu.getByRole('menuitem', { name: 'MLM ağı' }).click();
    await expect(page).toHaveURL(/\/buyume-modeli\/$/);
  });

  test('MLM ağı yalnız Pazarlama menüsünde etkin (İstihdam menüsü bölüm saymaz)', async ({ page }) => {
    await page.goto('buyume-modeli/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByRole('button', { name: 'Pazarlama' })).toHaveAttribute('data-section', 'true');
    await expect(page.getByRole('button', { name: 'İstihdam' })).not.toHaveAttribute('data-section', 'true');
  });

  // Giderler’de alt başlık 15 px Roboto (daha geniş): 320 px’te de üst bant tek satır.
  for (const coarse of [false, true]) {
    test(`320 px Giderler${coarse ? ' (dokunmatik)' : ''}: üst bant tek satır, tema düğmesi ≥ ${coarse ? 48 : 44} px`, async ({ browser, browserName }) => {
      test.skip(coarse && browserName === 'firefox', 'Firefox mobil emülasyonu desteklemez');
      const context = await browser.newContext({ viewport: { width: 320, height: 700 }, ...(coarse ? { hasTouch: true, isMobile: true } : {}) });
      const page = await context.newPage();
      await page.goto('giderler/');
      await icerik(page);
      const [marka, dugme] = [await page.locator('.brand').boundingBox(), await page.locator('.theme-toggle').boundingBox()];
      expect(Math.abs(marka!.y - dugme!.y)).toBeLessThan(8);
      expect(Math.min(dugme!.width, dugme!.height)).toBeGreaterThanOrEqual(coarse ? 48 : 44);
      await context.close();
    });
  }

  // Kullanıcı kararı 2026-10-20: logonun yanındaki yazı yok; altında “Pazarlama & Finansal Planlama”; plan tarihi başlıkta yok.
  for (const width of [320, 1280]) {
    test(`${width} px: logo altında alt başlık, plan tarihi yok`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('');
      await icerik(page);
      const marka = page.locator('.topbar .brand');
      // Logo (kullanıcı kararı 2026-10-21): Türksab “TURKS/AB” orijinaline göre çizilmiş SVG; ekran okuyucuya “Türksab”.
      await expect(marka).toHaveText('Pazarlama & Finansal Planlama');
      await expect(page.getByRole('link', { name: 'Türksab · Pazarlama & Finansal Planlama' })).toBeVisible();
      const logo = marka.locator('svg.brand-mark');
      await expect(logo).toHaveAttribute('aria-hidden', 'true');
      const [harf, cizgi] = await logo.evaluate((el) => [getComputedStyle(el.querySelector('.brand-mark-letters')!).fill, getComputedStyle(el.querySelector('.brand-mark-slash')!).fill]);
      expect(cizgi).not.toBe(harf);
      // Orijinal gibi kalın paralelkenar: yatay kalınlık büyük harf yüksekliğinin ≈ %24'ü, eğim ≈ %35'i
      // (kutu genişliği / yükseklik ≈ 0,60); logo oranı viewBox'tan (≈ 7,31), harf yüksekliği ≥ 16 px.
      const [kutu, egik] = [await logo.boundingBox(), await logo.locator('.brand-mark-slash').boundingBox()];
      expect(egik!.width / egik!.height).toBeCloseTo(0.6, 1);
      expect(kutu!.width / kutu!.height).toBeCloseTo(2662 / 364, 1);
      expect(kutu!.height).toBeGreaterThanOrEqual(16);
      await expect(page.locator('.topbar')).not.toContainText('Plan tarihi');
      await expect(page.locator('.topbar')).not.toContainText('Satış ve Pazarlama Planı');
      const alt = await marka.locator('.brand-tagline').boundingBox();
      expect(alt!.y).toBeGreaterThanOrEqual(kutu!.y + kutu!.height - 1);
      expect(parseFloat(await marka.locator('.brand-tagline').evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    });
  }

  test('işaretçiyle açılan menüde oklar odak göstergesi açmaz (görünür odak yalnız Tab ile)', async ({ page }) => {
    await page.goto('istihdam/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('button', { name: 'İstihdam' }).click();
    await expect(page.getByRole('menu', { name: 'İstihdam' })).toBeVisible();
    await page.mouse.move(0, 0);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    // İşaretçi modunda hiçbir ögede alt çizgi yok; zemin yalnız etkin sayfada (seçili ≠ odak).
    const ogeler = await page.getByRole('menuitem').evaluateAll((els) =>
      els.map((el) => ({ deco: getComputedStyle(el).textDecorationLine, bg: getComputedStyle(el).backgroundColor, current: el.getAttribute('aria-current') })),
    );
    expect(ogeler.length).toBe(8);
    expect(ogeler.filter((o) => o.deco.includes('underline'))).toEqual([]);
    expect(ogeler.filter((o) => !o.current && o.bg !== 'rgba(0, 0, 0, 0)')).toEqual([]);
  });

  // Kullanıcı kararı 2026-10-21: geniş ekranda gezinme üst satırda (logo ile tema düğmesi arasında); dar ekranda
  // logonun altında kendi satırında.
  for (const width of [320, 360, 375, 390, 768]) {
    test(`${width} px: marka ve tema düğmesi tek satır, gezinme altında tek satır`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('roller/asistan/');
      await icerik(page);
      const [marka, dugme, nav] = [await page.locator('.brand').boundingBox(), await page.locator('.theme-toggle').boundingBox(), await page.locator('.mainnav').boundingBox()];
      expect(Math.abs(marka!.y - dugme!.y)).toBeLessThan(8);
      expect(nav!.y).toBeGreaterThanOrEqual(marka!.y + marka!.height - 1);
      expect(nav!.height).toBeLessThanOrEqual(60);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      // Sığıyorsa ortalı; sığmıyorsa ilk öğe kesilmez (güvenli ortalama).
      const ilk = await page.locator('.mainnav-list > li').first().boundingBox();
      expect(ilk!.x).toBeGreaterThanOrEqual(nav!.x - 1);
      if (width >= 768) {
        const liste = await page.locator('.mainnav-list').evaluate((el) => {
          const lis = [...el.children].filter((c) => (c as HTMLElement).offsetParent !== null).map((c) => c.getBoundingClientRect());
          return { sol: Math.min(...lis.map((b) => b.left)), sag: Math.max(...lis.map((b) => b.right)) };
        });
        expect(Math.abs((liste.sol + liste.sag) / 2 - width / 2)).toBeLessThan(8);
      }
    });
  }

  for (const path of ['', 'giderler/']) {
    test(`1280 px /${path}: logo, gezinme ve tema düğmesi tek satırda; bant alçak`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path);
      await icerik(page);
      const [marka, nav, dugme] = [await page.locator('.brand').boundingBox(), await page.locator('.mainnav').boundingBox(), await page.locator('.theme-toggle').boundingBox()];
      expect(nav!.x).toBeGreaterThan(marka!.x + marka!.width);
      expect(dugme!.x).toBeGreaterThan(nav!.x);
      expect(Math.abs(nav!.y + nav!.height / 2 - (marka!.y + marka!.height / 2))).toBeLessThan(8);
      expect(await page.locator('.topbar').evaluate((el) => el.getBoundingClientRect().height)).toBeLessThanOrEqual(64);
      // Gezinme başlığın tam ortasında (kullanıcı kararı 2026-10-21).
      const liste = await page.locator('.mainnav-list').boundingBox();
      expect(Math.abs(liste!.x + liste!.width / 2 - 640)).toBeLessThan(8);
    });
  }

  // Kullanıcı kararı 2026-10-21: “Koyu tema” yazısı görünmez (düğmenin adı kalır); anahtar büyük; simge izin boş
  // tarafında — açık temada beyaz izde ay (topuz solda), koyu temada turuncu izde güneş (topuz sağda).
  test('tema anahtarı: görünür yazı yok; açıkta beyaz izde ay, koyuda turuncu izde güneş, simge topuzun karşısında', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto('');
    await icerik(page);
    await hydrated(page);
    const dugme = page.getByRole('button', { name: 'Koyu tema' });
    await expect(dugme).toHaveAttribute('aria-pressed', 'false');
    expect(await page.locator('.theme-label').evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    const iz = await page.locator('.theme-track').boundingBox();
    expect(iz!.width).toBeGreaterThanOrEqual(56);
    expect(iz!.height).toBeGreaterThanOrEqual(32);
    const durum = () =>
      page.evaluate(() => {
        const q = (s: string) => document.querySelector(s)!;
        const x = (s: string) => q(s).getBoundingClientRect().left + q(s).getBoundingClientRect().width / 2;
        return {
          gunes: getComputedStyle(q('.theme-icon-sun')).opacity,
          ay: getComputedStyle(q('.theme-icon-moon')).opacity,
          iz: getComputedStyle(q('.theme-track')).backgroundColor,
          simgeSagda: x(getComputedStyle(q('.theme-icon-sun')).opacity === '1' ? '.theme-icon-sun' : '.theme-icon-moon') > x('.theme-thumb'),
        };
      });
    await expect.poll(durum).toEqual({ gunes: '0', ay: '1', iz: 'rgb(255, 255, 255)', simgeSagda: true });
    await dugme.click();
    await expect(dugme).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(durum).toEqual({ gunes: '1', ay: '0', iz: 'rgb(255, 134, 0)', simgeSagda: false });
  });

  // Kullanıcı kararı 2026-10-21: bölüm başlığı ve açıklaması geniş ekranda tek satırda; dar ekranda açıklama altta.
  for (const [width, tekSatir] of [[1280, true], [375, false]] as const) {
    test(`${width} px: bölüm başlığı ve açıklaması ${tekSatir ? 'tek satırda' : 'alt alta'}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('roller/segika/');
      await icerik(page);
      const bas = page.locator('.section-head').filter({ has: page.locator('.section-desc') }).first();
      const [t, d] = [await bas.locator('.section-title').boundingBox(), await bas.locator('.section-desc').boundingBox()];
      if (tekSatir) {
        expect(Math.abs(d!.y - t!.y)).toBeLessThan(16);
        expect(d!.x).toBeGreaterThan(t!.x + t!.width);
      } else expect(d!.y).toBeGreaterThanOrEqual(t!.y + t!.height - 1);
    });
  }

  // İnceleme bulgusu 2026-10-21: görünür yazısı olmayan tema anahtarında klavye odağı anahtarın altında düz çubuk.
  test('tema anahtarı klavyeyle odaklanınca altında düz odak çubuğu görünür; halka yok', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'not_run: Playwright WebKit Tab ile düğmelere odak vermez');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('link', { name: 'Notlar', exact: true }).focus();
    await page.keyboard.press('Tab');
    const st = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { tema: el.classList.contains('theme-toggle'), bg: cs.backgroundImage, boy: cs.backgroundSize, halka: cs.outlineStyle };
    });
    expect(st.tema).toBe(true);
    expect(st.bg).toContain('linear-gradient');
    expect(st.boy).toMatch(/^56px 3px$/);
    expect(st.halka).toBe('none');
  });

  // Kullanıcı kararı 2026-10-21: kırıntı “19 Ekim” ile başlar; Giderler’de son kırıntı sayfa başlığıdır (h1, büyük).
  test('kırıntı: 19 Ekim ile başlar; Giderler’de başlık kırıntıda (tek h1, diğer kırıntılardan büyük)', async ({ page }) => {
    await page.goto('roller/segika/');
    await icerik(page);
    await expect(page.locator('.crumbs li').first()).toHaveText('19 Ekim');
    await expect(page.locator('.crumbs')).not.toContainText('İsmail Karaca');
    await page.goto('giderler/');
    await icerik(page);
    await expect(page.locator('.crumbs li')).toHaveText(['19 Ekim', /Finans/, /OpEx/, /Operasyonel Giderler/]);
    await expect(page.locator('h1')).toHaveCount(1);
    const h1 = page.locator('.crumbs li[aria-current="page"] h1');
    await expect(h1).toHaveText('Operasyonel Giderler');
    const [baslik, kirinti] = [await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), await page.locator('.crumbs a').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))];
    expect(baslik).toBeGreaterThan(kirinti * 1.4);
    // Kullanıcı kararları 2026-10-21: kırıntılar %10–20 büyük (Giderler 15 → 17 px), başlık %10–20 küçük (32 → ≈ 27 px).
    expect(kirinti).toBeGreaterThanOrEqual(15 * 1.1);
    expect(kirinti).toBeLessThanOrEqual(15 * 1.2);
    expect(baslik).toBeGreaterThanOrEqual(32 * 0.8);
    expect(baslik).toBeLessThanOrEqual(32 * 0.9);
    // Kırıntılar ve başlık aynı satırda.
    const ilk = await page.locator('.crumbs li').first().boundingBox();
    const son = await page.locator('.crumbs li').last().boundingBox();
    expect(son!.y).toBeLessThan(ilk!.y + ilk!.height);
    await expect(page.locator('.hero')).toHaveCount(0);
  });
});

test.describe('hareket', () => {
  test('tüm geçişler onaylı Cubic eğri ve pozitif süreyle; giriş ve çıkış temel öğede', async ({ page }) => {
    for (const path of ['', 'roller/organizator/', 'istihdam/', 'applet/', 'applet/#terfi-kapisi']) {
      await page.goto(path);
      await icerik(page);
      const offenders = await page.evaluate((approved) => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('*')) {
          const cs = getComputedStyle(el);
          const durations = cs.transitionDuration.split(',').map((d) => parseFloat(d));
          if (!durations.some((d) => d > 0)) continue;
          if (cs.transitionProperty.split(',').some((p) => p.trim() === 'all')) out.push(`${el.className}: all`);
          const easings = cs.transitionTimingFunction.split(/,(?![^(]*\))/).map((e) => e.trim());
          if (easings.some((e) => e !== approved)) out.push(`${el.className}: ${cs.transitionTimingFunction}`);
          if (durations.some((d) => d <= 0)) out.push(`${el.className}: süre ${cs.transitionDuration}`);
        }
        return out;
      }, APPROVED_EASING);
      expect(offenders, path).toEqual([]);
    }
    // Geçiş, üzerine gelinmeden önce de tanımlı olmalı (giriş + çıkış)
    const link = page.locator('.mainnav-link').nth(2);
    const before = await link.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(before)).toBeGreaterThan(0);
  });

  test('hareket azaltma tercihinde süreler sıfırlanır', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('');
    await icerik(page);
    const durations = await page.evaluate(() =>
      [...document.querySelectorAll('.mainnav-link, .pager-link, .text-link')].map(
        (el) => getComputedStyle(el).transitionDuration,
      ),
    );
    expect(durations.length).toBeGreaterThan(0);
    expect(durations.every((d) => d.split(',').every((x) => parseFloat(x) === 0))).toBe(true);
  });
});

test.describe('etkileşim alanı ve tema', () => {
  test('bağımsız kontroller en az 44 CSS px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('roller/asistan/');
    await icerik(page);
    const heights = await page
      .locator('.mainnav-link, .pager-link, .brand')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    // İstihdam ve Pazarlama tetikleyicileri, Giderler, Notlar, sunum sırası bağlantıları ve marka.
    expect(heights.length).toBeGreaterThanOrEqual(7);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  });

  test('koyu tema işletim sistemi tercihini izler', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('');
    await icerik(page);
    const scheme = await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'));
    expect(scheme).toBe('dark');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(18, 20, 22)');
  });
});

test.describe('yatay telefon (alçak ekran)', () => {
  for (const viewport of [{ width: 844, height: 390 }, { width: 667, height: 375 }]) {
    test(`${viewport.width}×${viewport.height}: İstihdam menüsünün son ögesi görünür alanda ve tıklanır`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('roller/asistan/');
      await icerik(page);
      await hydrated(page);
      await page.getByRole('button', { name: 'İstihdam' }).click();
      const son = page.getByRole('menuitem', { name: 'İstihdam takvimi' });
      await son.scrollIntoViewIfNeeded();
      const box = await son.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
      await expect(page.getByRole('button', { name: 'İstihdam' })).toBeInViewport();
      await son.click();
      await expect(page).toHaveURL(/\/istihdam\/$/);
    });
  }
});

test.describe('dokunmatik cihaz', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } });
  test('kaba işaretçide kontroller en az 48 CSS px', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox mobil emülasyonu desteklemez');
    await page.goto('roller/organizator/');
    await icerik(page);
    const coarse = await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches);
    test.skip(!coarse, 'Bu motor kaba işaretçi emüle etmiyor');
    const heights = await page
      .locator('.mainnav-link, .pager-link')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(48);
    await page.getByRole('button', { name: 'İstihdam' }).tap();
    await expect(page.getByRole('menu', { name: 'İstihdam' })).toBeVisible();
    const ogeler = await page.getByRole('menuitem').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(ogeler.length).toBe(8);
    expect(Math.min(...ogeler)).toBeGreaterThanOrEqual(48);
  });
});

test.describe('kenar sistemi (kavisli vurgu kenarı yasak)', () => {
  test('tüm sayfalarda çizgi yalnız düz; değdiği köşeler radiussuz, diğer radiuslar korunur', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await icerik(page);
      const result = await page.evaluate(() => {
        const bad: string[] = [];
        const name = (el: Element) => `${el.tagName.toLowerCase()}.${el.className}`;
        const px = (v: string) => parseFloat(v) || 0;
        const visibleColor = (c: string) => c !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(c);
        for (const el of document.querySelectorAll<HTMLElement>('[data-edge]')) {
          const cs = getComputedStyle(el);
          const corners =
            el.dataset.edge === 'start'
              ? [cs.borderStartStartRadius, cs.borderEndStartRadius]
              : el.dataset.edge === 'bottom'
                ? [cs.borderEndStartRadius, cs.borderEndEndRadius]
                : [cs.borderStartStartRadius, cs.borderStartEndRadius];
          if (corners.some((c) => px(c) !== 0)) bad.push(`${name(el)}: köşe ${corners.join(' ')}`);
          if (getComputedStyle(el, '::after').content === 'none') bad.push(`${name(el)}: çizgi yok`);
          // Koşulluluk: kartta çizginin değmediği karşı köşe yuvarlak kalır.
          if (el.matches('.kpi') && px(cs.borderEndEndRadius) === 0) bad.push(`${name(el)}: karşı köşe de radiussuz`);
        }
        for (const el of document.querySelectorAll<HTMLElement>('body *')) {
          const cs = getComputedStyle(el);
          // Normal durumda iç gölge çubuğu yok (odak dışı).
          if (/inset/.test(cs.boxShadow)) bad.push(`${name(el)}: iç gölge`);
          const radii = {
            top: [cs.borderTopLeftRadius, cs.borderTopRightRadius],
            right: [cs.borderTopRightRadius, cs.borderBottomRightRadius],
            bottom: [cs.borderBottomLeftRadius, cs.borderBottomRightRadius],
            left: [cs.borderTopLeftRadius, cs.borderBottomLeftRadius],
          };
          const sides = (['top', 'right', 'bottom', 'left'] as const).filter((side) => {
            const w = px(cs.getPropertyValue(`border-${side}-width`));
            return w > 0 && cs.getPropertyValue(`border-${side}-style`) !== 'none' && visibleColor(cs.getPropertyValue(`border-${side}-color`));
          });
          // Tek veya birkaç kenarda görünür kenarlık varsa (tam çerçeve değilse) o kenarın köşeleri radiussuz olmalı.
          if (sides.length > 0 && sides.length < 4) {
            for (const side of sides) {
              if (radii[side].some((r) => px(r) > 0)) bad.push(`${name(el)}: yuvarlak köşede ${side} kenarlığı`);
            }
          }
          // Dört kenar çizili ama bir kenarın rengi/kalınlığı farklıysa (vurgu kenarı) o kenarın köşeleri de radiussuz olmalı.
          if (sides.length === 4) {
            const sig = (side: string) => `${cs.getPropertyValue(`border-${side}-width`)} ${cs.getPropertyValue(`border-${side}-color`)}`;
            const counts = new Map<string, number>();
            for (const side of sides) counts.set(sig(side), (counts.get(sig(side)) ?? 0) + 1);
            const common = [...counts].sort((a, b) => b[1] - a[1])[0][0];
            for (const side of sides) {
              if (sig(side) !== common && radii[side].some((r) => px(r) > 0)) bad.push(`${name(el)}: yuvarlak köşede farklı ${side} kenarı`);
            }
          }
          // Yuvarlak bir öğenin kenarı boyunca uzanan sözde öğe çubuğu (kenar sistemi dışında) yasak.
          const rounded = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].some((r) => px(r) > 0);
          if (rounded && !el.hasAttribute('data-edge')) {
            const box = el.getBoundingClientRect();
            for (const pseudo of ['::before', '::after']) {
              const ps = getComputedStyle(el, pseudo);
              if (ps.content === 'none' || ps.position !== 'absolute') continue;
              const w = px(ps.width);
              const h = px(ps.height);
              const bar = (w <= 6 && h >= box.height / 2) || (h <= 6 && w >= box.width / 2);
              if (bar && (visibleColor(ps.backgroundColor) || /gradient/.test(ps.backgroundImage))) bad.push(`${name(el)}${pseudo}: kenar çubuğu`);
            }
          }
        }
        const rounded = [...document.querySelectorAll<HTMLElement>('.chip, .kpi, .cal, .chart-canvas, .table-scroll, .note, .pager-link, .email-compose, .email-btn')]
          .filter((el) => parseFloat(getComputedStyle(el).borderEndEndRadius) > 0).length;
        return { bad, rounded };
      });
      expect(result.bad, path).toEqual([]);
      expect(result.rounded, `${path}: diğer radiuslar korunmalı`).toBeGreaterThan(0);
    }
  });
});

test.describe('tema düğmesi', () => {
  test('açık/koyu geçişi anında, kalıcı ve aria-pressed ile', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('');
    await icerik(page);
    await hydrated(page);
    const toggle = page.locator('[data-theme-toggle]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    // Renk şeması görünüm geçişinin ilk karesinde uygulanır (anlamsal durum, aria-pressed, anında).
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'))).toBe('dark');
    await page.reload();
    await hydrated(page);
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'))).toBe('dark');
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-theme-toggle]').click();
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'))).toBe('light');
    const box = await page.locator('[data-theme-toggle]').boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

test.describe('bağımsız bağlantılar ve grafikler', () => {
  test('cümle dışındaki bağlantılar en az 44 CSS px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    for (const path of ['', 'roller/ekip-lideri/', 'istihdam/', 'buyume-modeli/']) {
      await page.goto(path);
      await icerik(page);
      const heights = await page
        .locator('.text-link[data-standalone], .crumbs a, .pager-link')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
      expect(heights.length, path).toBeGreaterThan(0);
      expect(Math.min(...heights), path).toBeGreaterThanOrEqual(44);
    }
  });

  test('takvim ve zaman çizelgesi: Mantine bileşenleri, metin en az 14 px', async ({ page }) => {
    await page.goto('istihdam/');
    await icerik(page);
    await expect(page.locator('.hire-timeline .hire-item')).toHaveCount(8);
    await expect(page.locator('.cal')).toHaveCount(4);
    expect(await page.locator('.cal-day[data-event]').count()).toBe(11);
    const sizes = await page
      .locator('.cal-day, .cal-weekday, .hire-title, .hire-body')
      .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
    // Grafik sayfası değil: ECharts indirilmez.
    const echarts = await page.evaluate(() => performance.getEntriesByType('resource').some((e) => /echarts|charts\./.test(e.name)));
    expect(echarts).toBe(false);
  });

  test('grafikler çizilir, metinleri en az 14 px, Türkçe özet korunur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const path of CHART_PAGES) {
      await page.goto(path);
      await icerik(page);
      const canvases = page.locator('.chart-canvas');
      const count = await canvases.count();
      expect(count, path).toBeGreaterThan(0);
      const summaries = await canvases.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
      for (let i = 0; i < count; i++) {
        await canvases.nth(i).scrollIntoViewIfNeeded();
        await expect(canvases.nth(i).locator('svg')).toBeVisible({ timeout: 10_000 });
      }
      const after = await canvases.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
      expect(after, `${path}: ekran okuyucu özeti değişmemeli`).toEqual(summaries);
      const sizes = await page.evaluate(() =>
        [...document.querySelectorAll('.chart-canvas svg text')].map((t) => parseFloat(getComputedStyle(t).fontSize)),
      );
      expect(sizes.length, path).toBeGreaterThan(0);
      expect(Math.min(...sizes), `${path} grafik metni`).toBeGreaterThanOrEqual(14);
    }
    expect(errors).toEqual([]);
  });

  for (const width of [320, 390]) {
    test(`${width} px: grafik metinleri kesilmez, SVG dışına taşmaz, birbirine binmez`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of CHART_PAGES) {
        await page.goto(path);
        await icerik(page);
        const canvases = page.locator('.chart-canvas');
        for (let i = 0; i < (await canvases.count()); i++) {
          await canvases.nth(i).scrollIntoViewIfNeeded();
          await expect(canvases.nth(i).locator('svg'), `${path} grafik ${i}`).toBeVisible({ timeout: 10_000 });
        }
        // Giriş hareketi bitsin (token süresi 240 ms).
        await page.waitForTimeout(500);
        const problems = await page.evaluate(() => {
          const out: string[] = [];
          for (const svg of document.querySelectorAll<SVGSVGElement>('.chart-canvas svg')) {
            const kind = (svg.closest('.chart-canvas') as HTMLElement).dataset.kind;
            const frame = svg.getBoundingClientRect();
            const boxes = [...svg.querySelectorAll('text')]
              .filter((t) => (t.textContent ?? '').trim() && getComputedStyle(t).opacity !== '0')
              .map((t) => ({ text: t.textContent ?? '', box: t.getBoundingClientRect() }));
            for (const { text, box } of boxes) {
              if (/\.\.\.|…/.test(text)) out.push(`${kind}: kesik "${text}"`);
              if (box.left < frame.left - 1 || box.right > frame.right + 1 || box.top < frame.top - 1 || box.bottom > frame.bottom + 1) {
                out.push(`${kind}: SVG dışında "${text}"`);
              }
            }
            for (let a = 0; a < boxes.length; a++) {
              for (let b = a + 1; b < boxes.length; b++) {
                const p = boxes[a].box;
                const q = boxes[b].box;
                const w = Math.min(p.right, q.right) - Math.max(p.left, q.left);
                const h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
                const smaller = Math.min(p.width * p.height, q.width * q.height);
                if (w > 0 && h > 0 && smaller > 0 && (w * h) / smaller > 0.3) out.push(`${kind}: "${boxes[a].text}" ↔ "${boxes[b].text}"`);
              }
            }
          }
          return out;
        });
        expect(problems, `${width}px ${path}`).toEqual([]);
      }
    });
  }

  /** Çizilen grafiklerin ECharts modelini okur (aynı modül örneği, ek global yok). */
  async function chartMotion(page: Page) {
    return page.evaluate(async () => {
      const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('echarts-setup'));
      if (!url) return [];
      const { echarts } = await import(url);
      const out: { kind: string; values: (string | number | boolean)[][] }[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('.chart-canvas .chart-host')) {
        const inst = echarts.getInstanceByDom(el);
        if (!inst) continue;
        const option = inst.getOption();
        const model = inst.getModel();
        const values: (string | number | boolean)[][] = [];
        model.eachSeries((s: { get: (k: string) => string | number | boolean }) =>
          values.push(['seri', s.get('animation'), s.get('animationEasing'), s.get('animationDuration'), s.get('animationEasingUpdate'), s.get('animationDurationUpdate')]),
        );
        for (const s of option.series) {
          if (s.markLine) values.push(['işaret', s.markLine.animation, s.markLine.animationEasing, s.markLine.animationDuration, s.markLine.animationEasingUpdate, s.markLine.animationDurationUpdate]);
        }
        const state = option.stateAnimation;
        values.push(['durum', !!state.duration, state.easing, state.duration, state.easing, state.duration]);
        const pointer = option.tooltip?.[0]?.axisPointer;
        if (pointer) values.push(['işaretçi', pointer.animation, pointer.animationEasingUpdate, pointer.animationDurationUpdate, pointer.animationEasingUpdate, pointer.animationDurationUpdate]);
        out.push({ kind: (el.parentElement as HTMLElement).dataset.kind ?? '', values });
      }
      return out;
    });
  }

  test('grafik hareketi: seri, işaret çizgisi, durum ve işaretçi simetrik cubicInOut, 120–320 ms', async ({ page }) => {
    for (const path of ['hedefler/', 'karar-yetkisi/', 'roller/organizator/', 'buyume-modeli/']) {
      await page.goto(path);
      await icerik(page);
      const canvases = page.locator('.chart-canvas');
      for (let i = 0; i < (await canvases.count()); i++) {
        await canvases.nth(i).scrollIntoViewIfNeeded();
        await expect(canvases.nth(i).locator('svg')).toBeVisible({ timeout: 10_000 });
      }
      const charts = await chartMotion(page);
      expect(charts.length, path).toBeGreaterThan(0);
      for (const chart of charts) {
        for (const [part, on, easing, duration, easingUpdate, durationUpdate] of chart.values) {
          const label = `${path} ${chart.kind} ${part}`;
          expect(on, label).toBe(true);
          expect([easing, easingUpdate], label).toEqual(['cubicInOut', 'cubicInOut']);
          for (const d of [duration, durationUpdate]) {
            expect(d as number, label).toBeGreaterThanOrEqual(120);
            expect(d as number, label).toBeLessThanOrEqual(320);
          }
        }
      }
    }
  });

  test('grafik hareketi: hareket azaltma tercihinde kapalı', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('hedefler/');
    await icerik(page);
    await page.locator('.chart-canvas').first().scrollIntoViewIfNeeded();
    await expect(page.locator('.chart-canvas svg').first()).toBeVisible({ timeout: 10_000 });
    const charts = await chartMotion(page);
    expect(charts.length).toBeGreaterThan(0);
    for (const chart of charts) {
      for (const [part, on, , duration] of chart.values) expect([on, duration], `${chart.kind} ${part}`).toEqual([false, 0]);
    }
  });
});

test.describe('parametreler', () => {
  test('değişiklik tarayıcıya kaydedilir, tüm sayfalara yansır ve varsayılana dönülür', async ({ page }) => {
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    const salary = page.getByLabel('Saha satış maaşı');
    await salary.fill('70000');
    await expect(salary).toHaveValue(/70\.000/);
    await salary.blur();
    await expect(page.locator('.param-status')).toContainText('1 değer varsayılandan farklı');
    await expect(page.locator('.params-notice')).toBeVisible();

    await page.goto('karar-bekleyenler/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByText('70.000 ₺ maaş / ay').first()).toBeVisible();
    await expect(page.getByText('Kota: ay içinde 140.000 ₺ satış', { exact: false }).first()).toBeVisible();
    await expect(page.locator('.params-notice')).toBeVisible();

    await page.goto('roller/saha-uzmani/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.facts-row')).toContainText('70.000 ₺ maaş');

    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    const reset = page.locator('.param-reset');
    await reset.click();
    await expect(reset).toHaveText('Emin misiniz? Tekrar basın');
    await reset.click();
    await expect(page.locator('.param-status')).toContainText('Tüm değerler varsayılan');
    await page.goto('karar-bekleyenler/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByText('50.000 ₺ maaş / ay').first()).toBeVisible();
    await expect(page.locator('.params-notice')).toHaveCount(0);
  });

  test('tarih parametresi takvimi ve kontrol tarihlerini kaydırır', async ({ page }) => {
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.evaluate(() => localStorage.setItem('istoc-plan-parametreler', JSON.stringify({ startDate: '2026-11-15' })));
    await page.goto('karar-yetkisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.data-table').first()).toContainText('13 Ocak');
    await page.evaluate(() => localStorage.removeItem('istoc-plan-parametreler'));
  });

  test('klavye odağı: alan etiketi altı çizili; çevreleyen halka yok', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.getByLabel('Program başlangıcı').focus();
    await page.keyboard.press(tab);
    const state = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const label = el.closest('.param-field')?.querySelector('.param-label') as HTMLElement | null;
      const cs = getComputedStyle(el);
      return {
        mode: document.documentElement.dataset.focusMode,
        outline: cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0,
        shadow: cs.boxShadow,
        border: [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor],
        underline: label ? getComputedStyle(label).textDecorationLine : '',
        thickness: label ? parseFloat(getComputedStyle(label).textDecorationThickness) : 0,
      };
    });
    expect(state.mode).toBe('keyboard');
    expect(state.outline).toBe(true);
    expect(state.shadow).toBe('none');
    expect(new Set(state.border).size, 'odakta kenarlık rengi değişmez, tek renk').toBe(1);
    expect(state.underline).toContain('underline');
    expect(state.thickness).toBeGreaterThanOrEqual(3);
  });
});

test.describe('BCG eğitimi', () => {
  test('dört kutu matrisi, nakit döngüsü ve örnek balon matrisi Türkçe; matris yerleşimi klasik', async ({ page }) => {
    await page.goto('bcg/');
    await icerik(page);
    const cells = page.locator('.bcg-cell');
    await expect(cells).toHaveCount(4);
    expect(await cells.locator('.bcg-name').allTextContents()).toEqual(['Yıldız', 'Soru işareti', 'Nakit ineği', 'Köpek']);
    // Klasik yerleşim: Yıldız sol üst, Köpek sağ alt.
    const box = async (i: number) => (await cells.nth(i).boundingBox())!;
    const [star, question, cow, dog] = [await box(0), await box(1), await box(2), await box(3)];
    expect(star.x).toBeLessThan(question.x);
    expect(star.y).toBeLessThan(cow.y);
    expect(dog.x).toBeGreaterThan(cow.x);
    await expect(page.locator('.bcg-flow')).toHaveCount(4);

    const example = page.locator('.chart-canvas[data-kind="bcg-num"]');
    await example.scrollIntoViewIfNeeded();
    await expect(example.locator('svg')).toBeVisible({ timeout: 10_000 });
    const texts = (await example.locator('svg text').allTextContents()).join(' | ');
    for (const label of ['Akıllı saat', 'Kahve makinesi', 'Elektrikli scooter', 'Akıllı termostat', 'DVD oynatıcı', 'Pazar büyümesi', 'Göreli pazar payı', '1×']) {
      expect(texts, label).toContain(label);
    }
    expect(texts).not.toContain('0,05');
  });

  test('alıştırma cevabı açılır; klavye odağında halka yok, alt çizgi var', async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'not_run: Playwright WebKit Tab/Alt+Tab ile <summary> öğesine odaklanmıyor (Safari varsayılanı); gerçek Safari’de elle doğrulanmalı',
    );
    const tab = 'Tab';
    await page.goto('bcg/');
    await icerik(page);
    const first = page.locator('.quiz-item').first();
    await first.locator('summary').click();
    await expect(first.locator('.quiz-answer')).toBeVisible();
    // WebKit tıklamada özete odak vermez; odak doğrudan verilir, sonra klavyeyle ileri-geri gidilir.
    await first.locator('summary').focus();
    await page.keyboard.press(tab);
    await page.keyboard.press(`Shift+${tab}`);
    const state = await first.locator('summary').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        focused: document.activeElement === el,
        mode: document.documentElement.dataset.focusMode,
        ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
        underline: cs.textDecorationLine,
      };
    });
    expect(state.focused).toBe(true);
    expect(state.mode).toBe('keyboard');
    expect(state.ring).toBe(false);
    expect(state.underline).toContain('underline');
  });
});

test.describe('notlar', () => {
  test('not eklenir, işaretlenir, düzenlenir, silinir ve tarayıcıda saklanır', async ({ page }) => {
    await page.goto('notlar/');
    await icerik(page);
    await hydrated(page);
    await page.evaluate(() => localStorage.removeItem('istoc-plan-notlar'));
    await page.reload();
    await hydrated(page);
    await expect(page.locator('.note-row')).toHaveCount(10);

    // Liste seç ve not ekle (Enter ile)
    await page.getByRole('button', { name: /^Partner ağı/ }).click();
    await expect(page.locator('.note-row')).toHaveCount(5);
    const input = page.getByLabel(/Yeni not/);
    await input.fill('Sertifika ölçütlerini yaz');
    await input.press('Enter');
    await expect(page.locator('.note-row').first()).toContainText('Sertifika ölçütlerini yaz');

    // İşaretle: tamamlananlara geçer
    // İşaretlenen not tamamlananlara taşınır (kapalı bölüm); bu yüzden tıklanır, sonuç sayıdan okunur.
    await page.getByRole('checkbox', { name: 'Sertifika ölçütlerini yaz' }).click();
    await expect(page.locator('.note-done summary')).toContainText('Tamamlanan (1)');

    // Kalıcı
    await page.reload();
    await hydrated(page);
    await page.locator('.note-done summary').click();
    await expect(page.getByRole('checkbox', { name: 'Sertifika ölçütlerini yaz' })).toBeChecked();

    // Düzenle
    const row = page.locator('.note-row', { hasText: 'Prim sistemi eklemeli' });
    await row.getByRole('button', { name: /Düzenle/ }).click();
    const edit = page.getByLabel('Notu düzenle');
    await edit.fill('Prim sistemi: kurallar');
    await edit.press('Enter');
    await expect(page.locator('.note-row', { hasText: 'Prim sistemi: kurallar' })).toHaveCount(1);

    // Sil (iki adım)
    const target = page.locator('.note-row', { hasText: 'Prim sistemi: kurallar' });
    await target.getByRole('button', { name: 'Sil' }).click();
    await target.getByRole('button', { name: 'Silinsin mi?' }).click();
    await expect(page.locator('.note-row', { hasText: 'Prim sistemi: kurallar' })).toHaveCount(0);

    // Varsayılana dön
    const reset = page.getByRole('button', { name: 'Varsayılan notlara dön' });
    await reset.click();
    await page.getByRole('button', { name: 'Emin misiniz? Tekrar basın' }).click();
    await expect(page.locator('.note-row', { hasText: 'Prim sistemi eklemeli' })).toHaveCount(1);
    expect(await page.evaluate(() => localStorage.getItem('istoc-plan-notlar'))).toBeNull();
  });

  test('klavye: not kutusu odakta metnin altı çizili; çevreleyen halka yok', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.goto('notlar/');
    await icerik(page);
    await hydrated(page);
    await page.locator('.note-check-input').first().focus();
    await page.keyboard.press(tab);
    await page.keyboard.press(`Shift+${tab}`);
    const state = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const row = el.closest('.note-row');
      const text = row?.querySelector('.note-text') as HTMLElement | null;
      const cs = getComputedStyle(el);
      return {
        isCheck: el.classList.contains('note-check-input'),
        ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
        underline: text ? getComputedStyle(text).textDecorationLine : '',
      };
    });
    expect(state.isCheck).toBe(true);
    expect(state.ring).toBe(false);
    expect(state.underline).toContain('underline');
  });
});
