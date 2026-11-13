import { expect, test } from './fixtures/persona';

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
  expect(veri.secim).toEqual({ urun: 'segika', odemeModeli: 'oran', seciliRol: 'kadrolu', seciliKosul: 'ana' });
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

/**
 * Dört Pazarlama sayfası tek sayfada (kullanıcı kararı 2026-11-03): rol başına koşul seti. Ana program değişmez;
 * Temsilci ağı seti kademeli ağdır ve diyagramda kimin ne kazandığı görünür.
 */
test('koşul setleri: ana program korunur, kademeli ağ ve diyagram, İş ortaklığı seti', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await page.setViewportSize({ width: 1512, height: 945 });
  await page.goto('satis-ortakligi/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('.so2-fiyat strong')).toHaveText('223.440 ₺');

  // Temsilci ağı: herkes ayda 2 satış, 2 temsilci getirir; Ahmet = 2 × 2.500 + 2 × 2 × 500 + 4 × 2 × 250 = 9.000 ₺.
  await page.getByRole('button', { name: /Bağımsız temsilci, kademeli ağ/ }).click();
  await expect(page.locator('.so2-sonuc-deger')).toHaveText('9.000 ₺');
  await expect(page.getByRole('tab', { name: /Öncü/ })).toContainText('9.000');
  const aciklama = page.locator('.ag-aciklama');
  await expect(aciklama).toHaveText('Ayşe bir satış yaptığında Ayşe 2.500 ₺, Mehmet 500 ₺ ve Ahmet 250 ₺ kazanır. Ömer ve Haydar bu satıştan pay almaz.');
  await page.getByRole('button', { name: 'Fatma: satış yapan olarak seç' }).click();
  await expect(aciklama).toHaveText('Fatma bir satış yaptığında Fatma 2.500 ₺, Ayşe 500 ₺ ve Mehmet 250 ₺ kazanır. Ahmet, Ömer ve Haydar bu satıştan pay almaz.');

  // Pay en çok 2 kademe yukarı gider (kullanıcı kararı 13 Kasım 2026, karar listesi 5.9): 3 yazılsa da 2 kademe kalır.
  await page.getByRole('textbox', { name: 'Kaç kademe yukarı pay gider?' }).fill('3');
  await expect(page.getByRole('textbox', { name: '3. kademe payı' })).toHaveCount(0);
  await expect(aciklama).toContainText('Ahmet, Ömer ve Haydar bu satıştan pay almaz');

  // Klavye: düğüm Enter ile seçilir.
  await page.getByRole('button', { name: 'Haydar: satış yapan olarak seç' }).focus();
  await page.keyboard.press('Enter');
  await expect(aciklama).toHaveText('Haydar bir satış yaptığında Haydar 2.500 ₺ kazanır.');

  // İş ortaklığı (Segika P2): 2.600 ₺ × 6 ay × %15 = 2.340 ₺; yılda 10 müşteri → 23.400 ₺.
  await page.getByRole('button', { name: 'Segika' }).click();
  await page.getByRole('tab', { name: /Profesyonel/ }).click();
  await page.getByRole('button', { name: /Ticari yönlendirme ortağı/ }).click();
  await expect(page.locator('.so2-sonuc-deger')).toHaveText('23.400 ₺');
  await expect(page.locator('.so2-kaynak')).toHaveText('Koşulların kaynağı: İş ortaklığı sayfası');
  // Ana programa dönünce ana hesap: 31.200 ₺ × %25 × 10 müşteri = 78.000 ₺.
  await page.getByRole('button', { name: /Ana program/ }).click();
  await expect(page.locator('.so2-sonuc-deger')).toHaveText('78.000 ₺');
  const veri = JSON.parse((await page.locator('.so2-json-icerik').textContent()) ?? '{}');
  // Projelerin parametreleri ayrıdır. Segika ana programla açılır.
  expect(veri.kosulSetleri.oncu.kosul).toBe('ana');
  expect(veri.ayarlar.kosul.oncu).toBe('ana');
  expect(veri.secim.seciliKosul).toBe('ana');
  await page.getByRole('button', { name: 'iStoc', exact: true }).click();
  await expect(page.locator('.so2-json-ac pre')).toContainText('\"kosul\": \"ag\"');
});

/** Affilate sayfası satış ortaklığına taşındı (kullanıcı kararı 2026-11-03): Affilate setlerinde ödeme takvimi. */
test('Affilate setleri: ödeme takvimi, ödeme biçimi ve ödeme zamanı canlı değişir', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await page.setViewportSize({ width: 1512, height: 945 });
  await page.goto('satis-ortakligi/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Segika' }).click();
  await page.getByRole('button', { name: /Yıllara yayılan komisyon/ }).click();
  const takvim = page.locator('.am');
  await expect(takvim).toBeVisible();
  // 2.600 ₺ × 12 = 31.200 ₺; 1. yıl %15 = 4.680 ₺, 2. yıl %10 = 3.120 ₺, 3. yıl %0.
  await expect(takvim.locator('.am-yillar li')).toHaveText(['1. hizmet yılı4.680 ₺', '2. hizmet yılı3.120 ₺', '3. hizmet yılı0 ₺']);
  await expect(takvim.locator('.am-ozet')).toContainText('7.800 ₺');
  await page.getByRole('button', { name: 'Aylık abonelik' }).click();
  await expect(takvim.locator('.am-ozet')).toContainText('aylık abonelik');
  await page.getByRole('button', { name: '1 yıl', exact: true }).click();
  await expect(takvim.locator('.am-yillar li')).toHaveCount(1);
  await page.getByText('Karar verisi (JSON)').click();
  const veri = JSON.parse((await page.locator('.so2-json-icerik').textContent()) ?? '{}');
  expect(veri.odemeTakvimi.musteriOder).toBe('aylik');
  expect(veri.odemeTakvimi.sureAy).toBe(12);
});

// Sürümler (kullanıcı kararı 2026-11-03): v1 korunur, v2 kopyadır; ayarlar ayrı saklanır, seçim adreste durur.
test('sürüm seçici: v1 ve v2 ayrı ayarlarla çalışır, v2 adresten açılır', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await page.setViewportSize({ width: 1512, height: 945 });
  await page.goto('satis-ortakligi/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.getByRole('button', { name: '1. sürüm', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Sürüm seçici ürün ve ödeme satırının üstünde, ayrı bir satırdadır.
  const surumAlt = await page.locator('.so-surum').evaluate((e) => e.getBoundingClientRect().bottom);
  const aracUst = await page.locator('.so2-arac').evaluate((e) => e.getBoundingClientRect().top);
  expect(surumAlt).toBeLessThanOrEqual(aracUst);
  await expect(page.locator('.so2-arac').getByRole('button', { name: '1. sürüm', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Segika' }).click();
  await expect(page.locator('.so2-fiyat strong')).toHaveText('31.200 ₺');

  await page.getByRole('button', { name: '2. sürüm', exact: true }).click();
  await expect(page).toHaveURL(/[?&]surum=v2/);
  await expect(page.getByRole('tab')).toHaveCount(5);
  // v2 kendi ayarıyla başlar: v1'deki Segika seçimi v2'ye geçmez.
  await expect(page.locator('.v2-so2-fiyat strong')).toHaveText('223.440 ₺');
  // v2 kendi stil dosyasıyla biçimlenir.
  expect(await page.locator('.v2-so2-roller').evaluate((e) => getComputedStyle(e).display)).toBe('grid');
  await page.getByText('Karar verisi (JSON)').click();
  await expect(page.locator('.v2-so2-json-ac pre')).toContainText('"program": "v2"');

  await page.getByRole('button', { name: '1. sürüm', exact: true }).click();
  await expect(page.locator('.so2-fiyat strong')).toHaveText('31.200 ₺');

  await page.goto('satis-ortakligi/?surum=v2');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.getByRole('button', { name: '2. sürüm', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
