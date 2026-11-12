import { expect, test } from './fixtures/persona';

/**
 * Gelir modelleri (kullanıcı kararı 2026-11-03): bugünkü abonelik modeli (üç paket, Kurumsal teklifle) ve 15 aday ek gelir
 * modeli. Her modelin hazırlık etiketi vardır, ihracat hizmetleri “Hazır değil”dir, örnek hesap varsayım olarak etiketlidir.
 */
const MODEL_SAYISI = 15;
const HAZIRLIK = ['Hazır', 'Yakında', 'Hazır değil'];

for (const genislik of [320, 390, 1280]) {
  test(`gelir modelleri ${genislik} px: paketler, modeller, hazırlık etiketleri, taşma yok, metin ≥ 14 px`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: 900 });
    await page.goto('gelir-modelleri/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gelir modelleri');

    const paketler = page.locator('.gm-paket');
    await expect(paketler).toHaveCount(3);
    await expect(paketler.locator('.gm-paket-ad')).toHaveText(['Standart', 'Pro', 'Kurumsal']);
    await expect(paketler.nth(0)).toContainText('399 €');
    await expect(paketler.nth(0)).toContainText('3.990 €');
    await expect(paketler.nth(1)).toContainText('599 €');
    await expect(paketler.nth(1)).toContainText('5.990 €');
    await expect(paketler.nth(2).locator('.gm-paket-fiyat')).toHaveText('Teklif');

    const modeller = page.locator('.gm-model');
    await expect(modeller).toHaveCount(MODEL_SAYISI);
    const etiketler = await modeller.locator('.gm-hazirlik').allInnerTexts();
    expect(etiketler).toHaveLength(MODEL_SAYISI);
    for (const e of etiketler) expect(HAZIRLIK).toContain(e.trim());
    await expect(page.locator('#model-ihracat .gm-hazirlik')).toHaveText('Hazır değil');
    // Örnek hesap her modelde var ve varsayım olduğu yazılı (söz değil).
    await expect(modeller.locator('.gm-ornek')).toHaveCount(MODEL_SAYISI);
    for (const t of await modeller.locator('.gm-ornek').allInnerTexts()) expect(t).toMatch(/varsayım/i);
    // Öncelik önerisi: üç model, ilgili kartlara bağlı.
    await expect(page.locator('.gm-oncelik-oge')).toHaveCount(3);

    const olcum = await page.evaluate(() => ({
      tasma: document.documentElement.scrollWidth - innerWidth,
      kucuk: [...document.querySelectorAll<HTMLElement>('.gm *')]
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
        .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14 || Number(getComputedStyle(e).fontWeight) < 300)
        .map((e) => e.className || e.tagName),
      metin: document.querySelector<HTMLElement>('.gm')!.innerText,
    }));
    expect(olcum.tasma).toBeLessThanOrEqual(0);
    expect(olcum.kucuk).toEqual([]);
    // Yazım kuralı: açıklamalarda noktalı virgül ve uzun çizgi yok.
    expect(olcum.metin).not.toMatch(/[;—]/);
  });
}

test('gelir modelleri: hazırlık süzgeci yalnız seçilen durumdaki modelleri gösterir', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('gelir-modelleri/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const grup = page.getByRole('group', { name: 'Hazırlık durumu' });
  await grup.getByRole('button', { name: /^Hazır değil/ }).click();
  const gorunen = page.locator('.gm-model');
  const sayi = await gorunen.count();
  expect(sayi).toBeGreaterThan(0);
  expect(sayi).toBeLessThan(MODEL_SAYISI);
  for (const t of await gorunen.locator('.gm-hazirlik').allInnerTexts()) expect(t.trim()).toBe('Hazır değil');
  await expect(page.locator('#model-ihracat')).toBeVisible();
  await expect(page.locator('.gm-sayac')).toContainText(`${sayi} model`);
  await grup.getByRole('button', { name: /^Hepsi/ }).click();
  await expect(gorunen).toHaveCount(MODEL_SAYISI);
});

test('gelir modelleri: öncelik bağlantısı süzgeç kartı gizlese de ilgili modele gider', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('gelir-modelleri/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('group', { name: 'Hazırlık durumu' }).getByRole('button', { name: /^Hazır değil/ }).click();
  await expect(page.locator('#model-kurulum-egitim')).toHaveCount(0);
  await page.locator('.gm-oncelik-oge').first().getByRole('link', { name: 'Kurulum ve eğitim hizmeti' }).click();
  await expect(page).toHaveURL(/#model-kurulum-egitim$/);
  await expect(page.locator('#model-kurulum-egitim')).toBeInViewport();
  await expect(page.locator('.gm-model')).toHaveCount(MODEL_SAYISI);
});

test('gelir modelleri: Pazarlama menüsünde Değer önerisinden sonra', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('gelir-modelleri/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Pazarlama' }).click();
  const menu = page.getByRole('menu', { name: 'Pazarlama' });
  // Oyunlaştırma (2026-11-04) Gelir modellerinden sonra gelir.
  await expect(menu.getByRole('menuitem').nth(3)).toHaveText('Gelir modelleri');
  await expect(menu.getByRole('menuitem', { name: 'Gelir modelleri' })).toHaveAttribute('aria-current', 'page');
});
