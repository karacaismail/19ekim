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

  // Dönemsel kazanç: maaş 60.000 ₺ → yıllık 720.000 ₺, günlük 720.000 ÷ 365.
  const maasSatiri = page.locator('.so2-donem-tablo tbody tr').first();
  await expect(maasSatiri.locator('td')).toHaveText(['1.973 ₺', '13.846 ₺', '60.000 ₺', '720.000 ₺']);

  // Sütunlarda iç kaydırma yok; sayfa kayar.
  const ic = await page.evaluate(() => ['.so2-ayarlar', '.so2-sag'].map((s) => { const e = document.querySelector(s)!; return e.scrollHeight - e.clientHeight; }));
  expect(ic).toEqual([0, 0]);

  // Karar verisi: varsayılan kapalı, canlı ve indirilebilir.
  const ac = page.locator('.so2-json-ac');
  await expect(ac).not.toHaveAttribute('open', '');
  await page.getByText('Karar verisi (JSON)').click();
  await expect(ac).toHaveAttribute('open', '');
  const veri = JSON.parse((await page.locator('.so2-json-icerik').textContent()) ?? '{}');
  expect(veri.secim).toEqual({ urun: 'segika', odemeModeli: 'oran', seciliRol: 'kadrolu' });
  expect(veri.ayarlar.maas).toBe(60000);
  const [indirme] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON dosyasını indir' }).click()]);
  expect(indirme.suggestedFilename()).toMatch(/^satis-ortakligi-\d{4}-\d{2}-\d{2}\.json$/);
});
