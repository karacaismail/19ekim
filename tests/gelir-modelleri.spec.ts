import { expect, test } from './fixtures/persona';

/**
 * Gelir modelleri (kullanıcı kararı 3 Kasım 2026, yeniden düzen 13 Kasım 2026): sayfa okurun sorularını sırayla cevaplar.
 *
 * 1. Kısa özet: istoc.com bugün nasıl gelir elde ediyor, bugün ne satılabilir, ne satılamaz?
 * 2. Bugünkü model: abonelik (üç paket, Kurumsal teklifle).
 * 3. Önce denenecek üç model.
 * 4. Bütün modeller hazırlık durumuna göre üç grupta: “Hazır”, “Yakında”, “Hazır değil”.
 * 5. Araştırma notu ve kısaltmalar en sonda.
 *
 * Kart kısa başlar: ad, hazırlık etiketi, nasıl çalıştığı ve örnek hesap. Kim öder, risk ve gerekenler açılan panelde
 * durur. Kart tıklanmaz, bu yüzden üzerine gelince zemini değişmez.
 */
const MODEL_SAYISI = 15;
const HAZIRLIK = ['Hazır', 'Yakında', 'Hazır değil'];
const BOLUMLER = ['kisa-ozet', 'bugunku-model', 'oncelik-onerisi', 'aday-modeller', 'arastirma-notu', 'kisaltmalar'];

async function ac(page: import('@playwright/test').Page, genislik = 1280) {
  await page.setViewportSize({ width: genislik, height: 900 });
  await page.goto('gelir-modelleri/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}

for (const genislik of [320, 390, 1280]) {
  test(`gelir modelleri ${genislik} px: paketler, modeller, hazırlık etiketleri, taşma yok, metin ≥ 14 px`, async ({ page }) => {
    await ac(page, genislik);
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

test('gelir modelleri: bölümler okurun soru sırasıyla dizilir', async ({ page }) => {
  await ac(page);
  const sira = await page.locator('.gm > section[id]').evaluateAll((s) => s.map((x) => x.id));
  expect(sira).toEqual(BOLUMLER);
});

test('gelir modelleri: kısa özet bugün satılanı, bugün eklenebileni ve satılamayanı sayıyla söyler', async ({ page }) => {
  await ac(page);
  const ozet = page.locator('#kisa-ozet .gm-ozet-oge');
  await expect(ozet).toHaveCount(3);
  await expect(ozet.nth(0)).toHaveAttribute('data-durum', 'hazir');
  await expect(ozet.nth(0)).toContainText('abonelik');
  await expect(ozet.nth(1)).toContainText('Kurulum ve eğitim hizmeti');
  // 15 modelden 1’i hazır. Kalan 14 model bugün satılamaz. Bunların 7’si yakında, 7’si hazır değil.
  await expect(ozet.nth(2)).toContainText('14');
  await expect(ozet.nth(2)).toContainText('söz vermeyin');
  // Her özet maddesi ilgili bölüme götürür. Üçüncü madde iki gruba da bağlanır.
  await expect(ozet.nth(2).getByRole('link')).toHaveText(['Yakında gelecek modelleri görün', 'Hazır olmayan modelleri görün']);
  await ozet.nth(2).getByRole('link', { name: 'Yakında gelecek modelleri görün' }).click();
  await expect(page).toHaveURL(/#grup-yakinda$/);
  await expect(page.locator('#grup-yakinda')).toBeInViewport();
});

test('gelir modelleri: modeller hazırlık durumuna göre üç grupta ve her grup ne yapılacağını söyler', async ({ page }) => {
  await ac(page);
  const gruplar = page.locator('.gm-grup');
  await expect(gruplar).toHaveCount(3);
  expect(await gruplar.evaluateAll((g) => g.map((x) => x.getAttribute('data-durum')))).toEqual(['hazir', 'yakinda', 'hazir-degil']);
  const sayilar: number[] = [];
  for (const [i, ad] of HAZIRLIK.entries()) {
    const grup = gruplar.nth(i);
    await expect(grup.getByRole('heading', { level: 3 })).toContainText(ad);
    const etiketler = await grup.locator('.gm-model .gm-hazirlik').allInnerTexts();
    expect(etiketler.length).toBeGreaterThan(0);
    for (const e of etiketler) expect(e.trim()).toBe(ad);
    sayilar.push(etiketler.length);
  }
  expect(sayilar.reduce((a, b) => a + b, 0)).toBe(MODEL_SAYISI);
  await expect(gruplar.nth(2).locator('.gm-grup-eylem')).toContainText('söz vermeyin');
  await expect(page.locator('#grup-hazir-degil #model-ihracat')).toHaveCount(1);
  // Grup bağlantıları sayıyı gösterir.
  const gecis = page.getByRole('navigation', { name: 'Hazırlık grupları' });
  await expect(gecis.getByRole('link')).toHaveText(sayilar.map((n, i) => `${HAZIRLIK[i]} (${n})`));
});

test('gelir modelleri: kart kısa başlar, ayrıntılar düğmeyle açılır ve kapanır', async ({ page }) => {
  await ac(page, 390);
  const kart = page.locator('#model-islem-komisyonu');
  const dugme = kart.getByRole('button', { name: 'Kimin ödediğini ve riskleri görün' });
  await expect(dugme).toHaveAttribute('aria-expanded', 'false');
  await expect(kart.locator('.gm-bilgi')).toBeHidden();
  await dugme.click();
  await expect(dugme).toHaveAttribute('aria-expanded', 'true');
  const bilgi = kart.locator('.gm-bilgi');
  await expect(bilgi).toBeVisible();
  await expect(bilgi.locator('dt')).toHaveText(['Kim öder?', 'istoc.com’a uyar mı?', 'Risk', 'Başlamak için ne gerekir?']);
  await dugme.click();
  await expect(dugme).toHaveAttribute('aria-expanded', 'false');
  await expect(bilgi).toBeHidden();
});

test('gelir modelleri: kart adı h4 başlıktır, ayrıntı düğmesi modelin adını söyler ve klavyeyle çalışır', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not_run: Playwright WebKit Tab ile düğmelere odak vermez');
  await ac(page);
  await expect(page.locator('.gm-model h4.gm-model-ad')).toHaveCount(MODEL_SAYISI);
  const kart = page.locator('#model-rfq');
  const dugme = kart.getByRole('button', { name: /^Kimin ödediğini ve riskleri görün/ });
  await expect(dugme).toHaveAccessibleName('Kimin ödediğini ve riskleri görün: Talep toplama ve teklif talebi ücreti');
  // Görünür odak yalnız Tab ile açılır: önceki öğeden Tab ile gelinir.
  await dugme.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(dugme).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-focus-mode', 'keyboard');
  const stil = await dugme.evaluate((e) => ({ odak: e.matches(':focus-visible'), cizgi: getComputedStyle(e).textDecorationLine, halka: getComputedStyle(e).outlineStyle }));
  expect(stil).toEqual({ odak: true, cizgi: 'underline', halka: 'none' });
  await page.keyboard.press('Enter');
  await expect(dugme).toHaveAttribute('aria-expanded', 'true');
  await expect(kart.locator('.gm-bilgi')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(dugme).toHaveAttribute('aria-expanded', 'false');
});

test('gelir modelleri: tıklanmayan kartın zemini fareyle değişmez', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ac(page);
  const kart = page.locator('#model-sponsorlu-urun');
  await kart.scrollIntoViewIfNeeded();
  const zemin = () => kart.evaluate((e) => getComputedStyle(e).backgroundColor);
  const once = await zemin();
  await kart.locator('.gm-nasil').hover();
  expect(await zemin()).toBe(once);
});

test('gelir modelleri: öncelik bağlantısı ilgili modele gider', async ({ page }) => {
  await ac(page);
  await page.locator('.gm-oncelik-oge').first().getByRole('link', { name: 'Kurulum ve eğitim hizmeti' }).click();
  await expect(page).toHaveURL(/#model-kurulum-egitim$/);
  await expect(page.locator('#model-kurulum-egitim')).toBeInViewport();
});

test('gelir modelleri: Pazarlama menüsünde Değer önerisinden sonra', async ({ page }) => {
  await ac(page);
  await page.getByRole('button', { name: 'Pazarlama' }).click();
  const menu = page.getByRole('menu', { name: 'Pazarlama' });
  // Oyunlaştırma (2026-11-04) Gelir modellerinden sonra gelir.
  await expect(menu.getByRole('menuitem').nth(4)).toHaveText('Gelir modelleri');
  await expect(menu.getByRole('menuitem', { name: 'Gelir modelleri' })).toHaveAttribute('aria-current', 'page');
});
