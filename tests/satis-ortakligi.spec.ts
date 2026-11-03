import { expect, test } from '@playwright/test';

/** Satış ortaklığı programı: masaüstü Chrome (kullanıcı kararı 2026-11-03: dar ekran uyarlaması sonra). */
test('masaüstü: beş rol sekmesi, ürün ve rol değişir, ayar sonucu günceller', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await page.setViewportSize({ width: 1512, height: 945 });
  await page.goto('satis-ortakligi/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.getByRole('tab')).toHaveCount(5);
  await expect(page.locator('.so2-fiyat strong')).toHaveText('223.440 ₺');
  await page.getByRole('button', { name: 'Segika' }).click();
  await expect(page.locator('.so2-fiyat strong')).toHaveText('31.200 ₺');
  await page.getByRole('tab', { name: /Kadrolu/ }).click();
  await expect(page.locator('.so2-baslik')).toHaveText('Kadrolu satış uzmanı');
  const maas = page.getByRole('textbox', { name: 'Aylık maaş' });
  await maas.fill('60000');
  await expect(page.locator('.so2-sonuc-deger')).toHaveText('60.000 ₺');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
