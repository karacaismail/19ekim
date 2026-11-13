import { expect, test } from './fixtures/persona';

test.beforeEach(async ({ page }) => {
  // Görsel ve etkileşim denemeleri canlı ortak parametreleri kullanmaz.
  await page.route('https://script.google.com/**', (route) => route.abort());
});

// Okur önce adımda ne yapacağını okur, sonra sonucu yanıtlar (yalın Türkçe kural 15: gereken bilgi önce gelir).
test('320 px: adımın işi kaydırmadan görünür ve soru işin hemen ardından gelir', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  const karar = page.locator('[data-akis-etkin] .pol-karar');
  await expect(karar).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const is = await page.locator('[data-akis-etkin] .pol-is-aciklamasi h4').boundingBox();
  const ilkIs = await page.locator('[data-akis-etkin] .pol-yap li').first().boundingBox();
  const soru = await karar.locator('legend').boundingBox();
  expect(is!.y + is!.height).toBeLessThanOrEqual(720);
  expect(ilkIs!.y).toBeLessThanOrEqual(720);
  expect(soru!.y).toBeGreaterThan(ilkIs!.y);
  // Soru, işin bitiminden en çok bir ekran aşağıdadır.
  expect(soru!.y - ilkIs!.y).toBeLessThanOrEqual(720);
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
  await expect(page.locator('[data-akis-etkin] .pol-sorumlu')).toContainText('Şirket bu görevi henüz kimseye atamadı.');
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
