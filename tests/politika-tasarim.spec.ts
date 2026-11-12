import { expect, test } from './fixtures/persona';

test.beforeEach(async ({ page }) => {
  // Görsel ve etkileşim denemeleri canlı ortak parametreleri kullanmaz.
  await page.route('https://script.google.com/**', (route) => route.abort());
});

test('320 px: ilk soru ve ilk yanıt kaydırmadan görünür', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  const karar = page.locator('[data-akis-etkin] .pol-karar');
  await expect(karar).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const soru = await karar.locator('legend').boundingBox();
  const yanit = await karar.getByRole('button').first().boundingBox();
  expect(soru!.y + soru!.height).toBeLessThanOrEqual(568);
  expect(yanit!.y + yanit!.height).toBeLessThanOrEqual(640);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('klavye ile ilerleyince yeni kararın başlığı görünür odak taşır', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  const yanit = page.getByRole('button', { name: 'Yazılı anlaşmam var', exact: true });
  await yanit.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  const baslik = page.locator('[data-akis-etkin] h3');
  await expect(baslik).toHaveText('Dükkânı kaydedin');
  await expect(baslik).toBeFocused();
  expect(await baslik.evaluate((el) => {
    const s = getComputedStyle(el);
    return { outline: s.outlineStyle, shadow: s.boxShadow, line: s.textDecorationLine };
  })).toEqual({ outline: 'none', shadow: 'none', line: 'underline' });
});

test('önerilen sorumlu atanmış kişi gibi gösterilmez', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await expect(page.locator('[data-akis-etkin] .pol-sorumlu')).toContainText('önerilen görev');
});

test('dar ekranda doğrudan açılan rolün sekmesi görünür', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('politikalar/?proje=segika&rol=elci');
  await expect(page.locator('[data-akis-etkin]')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Marka elçisi', exact: true })).toBeInViewport({ ratio: 1 });
});

test('bekleme yanıtı sonucu görünür odağa getirir', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await page.getByRole('button', { name: 'Anlaşma henüz taslak', exact: true }).click();
  const sonuc = page.locator('[data-akis-sonuc="bekle"] h4');
  await expect(sonuc).toBeFocused();
  await expect(sonuc).toBeInViewport();
  await expect(page.locator('[data-akis-etkin]')).toHaveCount(1);
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(0);
});
