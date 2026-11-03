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
  // Nokta binlik ayırıcıdır (QA 2026-11-03: “45.000” yazınca 45 oluyordu); ondalık ayırıcı yalnız virgül.
  await maas.fill('45.000');
  await expect(page.locator('.so2-sonuc-deger')).toHaveText('45.000 ₺');
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
  // Klavyeyle odaklanan JSON kutusu görünür, çevrelemeyen bir gösterge alır (Mac Chrome QA 2026-11-03).
  await page.locator('.so2-json-ac summary').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.so2-json-icerik')).toBeFocused();
  const odak = await page.locator('.so2-json-icerik').evaluate((e) => ({ golge: getComputedStyle(e).boxShadow, cizgi: getComputedStyle(e).outlineStyle }));
  expect(odak.golge).toContain('inset');
  expect(odak.cizgi).toBe('none');
  const veri = JSON.parse((await page.locator('.so2-json-icerik').textContent()) ?? '{}');
  expect(veri.secim).toEqual({ urun: 'segika', odemeModeli: 'oran', seciliRol: 'kadrolu' });
  expect(veri.ayarlar.maas).toBe(60000);
  const [indirme] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON dosyasını indir' }).click()]);
  expect(indirme.suggestedFilename()).toMatch(/^satis-ortakligi-\d{4}-\d{2}-\d{2}\.json$/);
});

/**
 * Dar ekran (kullanıcı kararı 2026-11-03): tek sütun; önce rol sekmeleri ve sonuç, sonra ayarlar. Ayarlar başlığı seçili
 * rolün canlı sonucunu gösterir. Sayfa yatay taşmaz, sekme adları kesilmez, metin 14 px altına inmez.
 */
for (const [sayfa, yol] of [
  ['satış ortaklığı', 'satis-ortakligi/'],
  ['affilate', 'affilate/'],
] as const) {
  for (const genislik of [320, 390, 768]) {
    test(`${sayfa} ${genislik} px: tek sütun, önce sonuç, taşma yok`, async ({ page }) => {
      await page.setViewportSize({ width: genislik, height: 740 });
      await page.goto(yol);
      await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
      await expect(page.locator('.so2-panel')).toBeVisible();
      const olcum = await page.evaluate(() => {
        const kutu = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const kucuk = [...document.querySelectorAll<HTMLElement>('.so2 *, .so2-json *')]
          .filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
          .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14)
          .map((e) => e.className || e.tagName);
        const kesik = [...document.querySelectorAll<HTMLElement>('.so2-rol-ad')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent);
        return { tasma: document.documentElement.scrollWidth - innerWidth, sag: kutu('.so2-sag'), sol: kutu('.so2-ayarlar'), kucuk, kesik };
      });
      expect(olcum.tasma).toBeLessThanOrEqual(0);
      expect(olcum.sag.top).toBeLessThan(olcum.sol.top);
      expect(Math.abs(olcum.sag.width - olcum.sol.width)).toBeLessThanOrEqual(1);
      expect(olcum.kesik).toEqual([]);
      expect(olcum.kucuk).toEqual([]);
      await expect(page.locator('.so2-ayarlar-ozet')).toBeVisible();
      await expect(page.locator('.so2-ayarlar-ozet')).toContainText('₺');
      // Karar verisi açılınca sayfa yana taşmasın (iPhone QA 2026-11-03).
      await page.getByText('Karar verisi (JSON)').click();
      await expect(page.locator('.so2-json-ac')).toHaveAttribute('open', '');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    });
  }
}
