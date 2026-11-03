import { expect, test } from '@playwright/test';

/** Kararlar (kullanıcı kararları 2026-11-03): tek sayfa; karar seçimleri tek soruya odaklı, seçim JSON’a yansır. */
test('karar seçimleri: seçim ilerlemeyi ve JSON’u günceller, Sonraki ile soru değişir', async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 945 });
  await page.goto('karar/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const panel = page.locator('.ks-soru-panel');
  await expect(panel.locator('.ks-soru')).toHaveText('Sitenin bütün hesaplarındaki başlangıç tarihi ne olsun?');
  await panel.getByRole('radio', { name: /1 Kasım kalsın/ }).click();
  await expect(panel.getByRole('radio', { name: /1 Kasım kalsın/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.ks-ilerleme-metin')).toContainText('1 / 16');
  await page.getByRole('button', { name: 'Sonraki' }).click();
  await expect(panel.locator('.ks-soru')).toHaveText('Temsilci ağı sayfası ne olsun?');
  await page.locator('#secimler').getByText('Karar verisi (JSON)').click();
  const veri = JSON.parse((await page.locator('#secimler .so2-json-icerik').textContent()) ?? '{}');
  expect(veri.sorular[0].secilen.id).toBe('1-kasim');
  expect(veri.ajanKararlari.every((k: { onaylandi: boolean }) => k.onaylandi)).toBe(true);
});

for (const genislik of [320, 390]) {
  test(`kararlar ${genislik} px: taşma yok, soru listesi gizli, gezinme düğmeleri var`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: 800 });
    await page.goto('karar/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await expect(page.locator('.ks-liste')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Sonraki' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}
