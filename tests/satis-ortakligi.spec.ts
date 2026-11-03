import { devices, expect, test, type Page } from '@playwright/test';

/** Satış ortaklığı programı: masaüstü Chrome (Chromium) ve iPhone Safari (WebKit, iPhone 15 emülasyonu). */

async function kontrol(page: Page) {
  await page.goto('satis-ortakligi/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.getByRole('heading', { level: 1, name: 'Satış ortaklığı programı' })).toBeVisible();
  const roller = ['Genç satış temsilcisi', 'Maaşlı satış temsilcisi', 'Profesyonel danışman (çözüm ortağı)', 'Arkadaşını getir, komşuna söyle', 'Marka elçisi ve referans bağlantısı'];
  await expect(page.locator('section.section h2')).toHaveText(roller);
  await expect(page.locator('#arkadasini-getir')).toContainText('798 €');
  await page.getByRole('button', { name: 'Segika' }).click();
  await expect(page.locator('#arkadasini-getir')).toContainText('5.200 ₺');
  await expect(page.locator('#cozum-ortagi')).toContainText('OSGB');
  const r = await page.evaluate(() => {
    const metin = [...document.querySelectorAll('main *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()) && el.getClientRects().length && !el.closest('.visually-hidden'));
    return { tasma: document.documentElement.scrollWidth - innerWidth, kucuk: metin.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14).length };
  });
  expect(r.tasma, 'yatay taşma').toBeLessThanOrEqual(0);
  expect(r.kucuk, '14 px altı metin').toBe(0);
}

test.describe('masaüstü Chrome', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('sayfa açılır, beş rol, marka değişir, taşma yok', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'yalnız Chromium');
    await kontrol(page);
  });
});

test.describe('iPhone Safari', () => {
  const { defaultBrowserType: _d, ...iphone } = devices['iPhone 15'];
  test.use(iphone);
  test('sayfa açılır, beş rol, marka değişir, taşma yok', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'yalnız WebKit');
    await kontrol(page);
  });
});
