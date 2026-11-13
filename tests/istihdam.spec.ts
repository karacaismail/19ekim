import { expect, test } from './fixtures/persona';

/** İstihdam takvimi ve Kadro kapasitesi (kullanıcı kararı 2026-11-03): dar ve geniş ekranda taşma yok, metin ≥ 14 px. */
for (const [yol, ad] of [
  ['istihdam/', 'İstihdam takvimi'],
  ['kadro-kapasitesi/', 'Kadro kapasitesi'],
] as const) {
  for (const genislik of [320, 390, 768, 1512]) {
    test(`${ad} ${genislik} px: taşma yok, metin en az 14 px`, async ({ page }) => {
      await page.setViewportSize({ width: genislik, height: 900 });
      await page.goto(yol);
      await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(ad);
      if (yol === 'istihdam/') await page.getByRole('button', { name: 'Takvim', exact: true }).click();
      const olcum = await page.evaluate(() => ({
        tasma: document.documentElement.scrollWidth - innerWidth,
        kucuk: [...document.querySelectorAll<HTMLElement>('main *')]
          .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
          .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14 || Number(getComputedStyle(e).fontWeight) < 300)
          .map((e) => (typeof e.className === 'string' ? e.className : e.tagName)),
      }));
      expect(olcum.tasma).toBeLessThanOrEqual(0);
      expect(olcum.kucuk).toEqual([]);
    });
  }
}

test('Kadro kapasitesi: 7 rol ve yönetici, kapasite aşımı, 15 karar, 14 ek rol', async ({ page }) => {
  await page.goto('kadro-kapasitesi/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('.tk-rol')).toHaveCount(8);
  await expect(page.locator('.tk-rol').filter({ hasText: 'İstoç masa başı' })).toContainText('Kapasiteyi yüzde 26 aşar.');
  await expect(page.locator('.tk-karar')).toHaveCount(15);
  await expect(page.locator('.tk-ek-rol')).toHaveCount(14);
});
