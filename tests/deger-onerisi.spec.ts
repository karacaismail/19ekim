import { expect, test } from './fixtures/persona';

/** Değer önerisi (kullanıcı kararı 2026-11-03): sözler alıntı olarak alt alta; 9 güçlü söz, 5 adım, 40 öneri, 2 eski söz. */
for (const genislik of [320, 390, 1512]) {
  test(`değer önerisi ${genislik} px: bütün sözler alıntı, taşma yok, metin ≥ 14 px`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: 900 });
    await page.goto('deger-onerisi/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Değer önerisi');
    await expect(page.locator('.dg-guclu')).toHaveCount(9);
    await expect(page.locator('.dg-adim')).toHaveCount(5);
    await expect(page.locator('.dg-oneri')).toHaveCount(40);
    await expect(page.locator('.dg-eski')).toHaveCount(2);
    // 9 + 1 ortak nokta + 5 + 40 + 2 = 57 alıntı; her söz blockquote içinde.
    await expect(page.locator('figure.alinti blockquote')).toHaveCount(57);
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
  await expect(page.locator('#oneri-6 blockquote')).toContainText('Satışlarınızdan komisyon almayız');
});

/**
 * Kullanıcı kararları 13 Kasım 2026: satıcı Basic paket için aylık ücret öder (5.1). Kurulum ücretlidir, bir kez 150 €
 * (5.2). Satıştan komisyon alınmaz (9.7). Değer önerisi bu üç olguyla çelişen söz taşımaz.
 */
test('değer önerisi: aylık ücret, kurulum ücreti ve komisyon kararlarıyla çelişen söz yok', async ({ page }) => {
  await page.goto('deger-onerisi/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const metin = (await page.locator('.dg').innerText()).replace(/\s+/g, ' ');
  expect(metin).not.toMatch(/aylık ücret yok/i);
  expect(metin).not.toMatch(/satış (yoksa|olmazsa) (ödeme yok|bize hiçbir şey)/i);
  expect(metin).not.toMatch(/ücretsiz kurulum|dükkânınızda ücretsiz/i);
  expect(metin).not.toMatch(/komisyonu (sadece|yalnız) bizim getirdiğimiz/i);
  expect(metin).not.toMatch(/o satıştan pay alırız/i);
  expect(metin).toContain('399 €');
  expect(metin).toContain('150 €');
});
