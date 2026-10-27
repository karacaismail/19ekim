import { expect, test, type Page } from '@playwright/test';

/** Gelir planı (/gelir-plani/): hedef kartları, zaman çizelgesi, kaynak tablosu, senaryolar; Pazarlama menüsünde. */
const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

test.beforeEach(async ({ page }) => {
  await page.route('https://script.google.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
});

test.describe('gelir planı', () => {
  test('menüde ve sunum sırasında; yedi hedef kartı, zaman çizelgesi, beş kaynak, üç senaryo, dört grafik', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gelir planı');
    await expect(page.locator('.hero .stat')).toHaveCount(4);
    await expect(page.locator('.gelir-hedef')).toHaveCount(7);
    await expect(page.locator('.gelir-hedef').first().locator('.gelir-hedef-sayi')).toHaveText('10 aktif');
    await expect(page.locator('.gelir-hedef .gelir-hedef-sayi', { hasText: '3 M₺' })).toHaveCount(1);
    // Takvim sırası: kartların tarihleri artan.
    const gunler = await page.locator('.gelir-hedef-bilgi dd').evaluateAll((dds) => dds.filter((_, i) => i % 5 === 0).map((dd) => parseInt(dd.textContent ?? '', 10)));
    expect(gunler.filter((g) => !Number.isNaN(g))).toEqual([...gunler.filter((g) => !Number.isNaN(g))].sort((a, b) => a - b));
    await expect(page.locator('.gelir-zaman .hire-item')).toHaveCount(7);
    await expect(page.locator('#kaynak-tablo')).toHaveText('Kaynak, başlangıç, düzen, kapasite');
    await expect(page.locator('.data-table').first().locator('tbody tr')).toHaveCount(5);
    await expect(page.locator('#senaryolar-tablo')).toBeVisible();
    await expect(page.locator('.chart-canvas')).toHaveCount(4);
    // Hedef zinciri: 100 aktif, plan tarihinden (30 Ocak 2027) sonra; kötümser daha geç.
    const kart = page.locator('.gelir-hedef', { hasText: '100 aktif satıcı' });
    await expect(kart.locator('.gelir-hedef-sayi')).toHaveText('100 aktif');
    await expect(kart.locator('.gelir-hedef-tarih')).toContainText('2027');
    await expect(page.locator('#yillik-etki-tablo')).toBeVisible();
    // Kenar sistemi: renkli üst çizginin değdiği köşeler düz, alt köşeler yuvarlak.
    const koseler = await page.locator('.gelir-hedef').evaluateAll((els) => els.map((el) => { const cs = getComputedStyle(el); return [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius]; }));
    for (const [tl, tr, bl] of koseler) {
      expect([tl, tr]).toEqual(['0px', '0px']);
      expect(parseFloat(bl)).toBeGreaterThan(0);
    }
    // Pazarlama menüsü
    await page.getByRole('button', { name: 'Pazarlama' }).click();
    const menu = page.getByRole('menu', { name: 'Pazarlama' });
    await expect(menu.getByRole('menuitem', { name: 'Gelir planı' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(page.locator('.pager-link[rel="prev"] .pager-label')).toHaveText('90 gün hedefleri');
    await expect(page.locator('.pager-link[rel="next"] .pager-label')).toHaveText('Eylem planı');
  });

  test('320 px: taşma yok, hedef kartları tek sütun, bağımsız bağlantı ≥ 44 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const d = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      cols: new Set([...document.querySelectorAll<HTMLElement>('.gelir-hedef')].map((el) => Math.round(el.getBoundingClientRect().left))).size,
      link: document.querySelector<HTMLElement>('.text-link[data-standalone]')?.getBoundingClientRect().height ?? 0,
      small: [...document.querySelectorAll<HTMLElement>('.gelir-hedef *')].filter((el) => el.textContent?.trim() && parseFloat(getComputedStyle(el).fontSize) < 14).length,
    }));
    expect(d.overflow).toBeLessThanOrEqual(0);
    expect(d.cols).toBe(1);
    expect(d.link).toBeGreaterThanOrEqual(44);
    expect(d.small).toBe(0);
  });
});
