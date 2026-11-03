import { expect, test } from '@playwright/test';

/** Değer önerisi (kullanıcı kararı 2026-11-03): sözler alıntı olarak alt alta; 9 güçlü söz, 5 adım, 35 öneri, 2 eski söz. */
for (const genislik of [320, 390, 1512]) {
  test(`değer önerisi ${genislik} px: bütün sözler alıntı, taşma yok, metin ≥ 14 px`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: 900 });
    await page.goto('deger-onerisi/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Değer önerisi');
    await expect(page.locator('.dg-guclu')).toHaveCount(9);
    await expect(page.locator('.dg-adim')).toHaveCount(5);
    await expect(page.locator('.dg-oneri')).toHaveCount(35);
    await expect(page.locator('.dg-eski')).toHaveCount(2);
    // 9 + 1 ortak nokta + 5 + 35 + 2 = 52 alıntı; her söz blockquote içinde.
    await expect(page.locator('figure.alinti blockquote')).toHaveCount(52);
    const olcum = await page.evaluate(() => ({
      tasma: document.documentElement.scrollWidth - innerWidth,
      kucuk: [...document.querySelectorAll<HTMLElement>('.dg *')]
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
        .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14 || Number(getComputedStyle(e).fontWeight) < 300)
        .map((e) => e.className || e.tagName),
    }));
    expect(olcum.tasma).toBeLessThanOrEqual(0);
    expect(olcum.kucuk).toEqual([]);
  });
}

test('değer önerisi: ilk 30 saniye bağlantısı ilgili öneriye gider', async ({ page }) => {
  await page.goto('deger-onerisi/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.locator('.dg-adim').first().getByRole('link', { name: 'Öneri 6' }).click();
  await expect(page).toHaveURL(/#oneri-6$/);
  await expect(page.locator('#oneri-6')).toBeInViewport();
  await expect(page.locator('#oneri-6 blockquote')).toContainText('Kendi müşterinizi getirirseniz');
});
