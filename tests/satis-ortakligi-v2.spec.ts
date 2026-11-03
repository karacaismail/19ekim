import { expect, test, type Page } from '@playwright/test';

/**
 * Satış ortaklığı v2 (kullanıcı kararı 2026-11-03): persona ayrı, segment ayrı. Aynı satışı yapan bağımsız ortaklar aynı
 * tutarı alır; segment satış ve koşullarla yükselir; ağ en çok 2 kademedir; sol paneldeki standart bölüm her personada
 * aynıdır, personaya özel koşullar en alttadır.
 */
const tutar = (s: string) => Number(s.replace(/[^\d]/g, ''));

async function ac(page: Page, genislik = 1512) {
  await page.setViewportSize({ width: genislik, height: 945 });
  await page.goto('satis-ortakligi/?surum=v2');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('.v2-so2')).toBeVisible();
}
const robot = (page: Page) => page.getByRole('group', { name: 'Satış: ayda kaç yeni müşteri?' });
const sekme = (page: Page, id: string) => page.locator(`#v2-so2-sekme-${id}`);
const sekmeTutari = async (page: Page, id: string) => tutar((await sekme(page, id).locator('.v2-so2-rol-tutar').innerText()).split('/')[0]);

test('aynı satış, aynı kazanç: bağımsız personalar eşit, kadrolu ve müşteri farklı sözleşme', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  const oncu = await sekmeTutari(page, 'oncu');
  expect(oncu).toBeGreaterThan(0);
  expect(await sekmeTutari(page, 'cozum')).toBe(oncu);
  expect(await sekmeTutari(page, 'elci')).toBe(oncu);
  await expect(sekme(page, 'kadrolu').locator('.v2-so2-rol-kisa')).toHaveText('Kadrolu çalışan');
  await expect(sekme(page, 'tavsiye').locator('.v2-so2-rol-kisa')).toHaveText('Müşteri');
  await expect(sekme(page, 'tavsiye').locator('.v2-so2-rol-ad')).toHaveText('Mevcut müşteri');
  await expect(page.locator('.v2-adalet-baslik').first()).toHaveText('Aynı satış, aynı kazanç');
});

test('fiyatlandırma robotu: üç iStoc paketi ciroyu verir, Kurumsal teklifle satılır', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  await expect(page.locator('.v2-so2-fiyat strong')).toHaveText('223.440 ₺');
  await robot(page).getByRole('textbox', { name: /Kurumsal paket/ }).fill('1');
  // 1.200 € × 56 ₺ × 10 ay = 672.000 ₺ eklenir.
  await expect(page.locator('.v2-so2-fiyat strong')).toHaveText('895.440 ₺');
  await page.getByRole('button', { name: 'Aylık abonelik' }).click();
  // Aylık abonelikte ilk yıl 12 aydır: (399 + 1.200) × 56 × 12.
  await expect(page.locator('.v2-so2-fiyat strong')).toHaveText('1.074.528 ₺');
});

test('segment merdiveni: satış ve koşullar yükseltir, rozet desteği verene açılır', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  await expect(page.locator('.v2-sg-basamak[data-durum="simdi"] .v2-sg-ad')).toContainText('Gümüş ortak');
  await expect(page.locator('.v2-sg-durum')).toContainText('Altın ortak olmak için');
  const gumus = await sekmeTutari(page, 'oncu');

  await robot(page).getByRole('textbox', { name: /Standart paket/ }).fill('3');
  await page.getByRole('button', { name: 'Ürün sertifikası' }).click();
  await page.getByRole('textbox', { name: 'Yenileme oranı' }).fill('80');
  await expect(page.locator('.v2-sg-basamak[data-durum="simdi"] .v2-sg-ad')).toContainText('Altın ortak');
  await expect(page.locator('.v2-sg-durum')).toContainText('kurulum ve desteği üstlenmek');
  const altin = await sekmeTutari(page, 'oncu');
  expect(altin).toBeGreaterThan(gumus);

  await page.getByRole('button', { name: 'Ortak verir' }).click();
  await expect(page.locator('.v2-so2-sonuc-etiket')).toContainText('Profesyonel çözüm ortağı');
  const pro = await sekmeTutari(page, 'oncu');
  expect(pro).toBeGreaterThan(altin);
  // Rozet persona değil segmenttir: öğrenci de aynı tutarı alır.
  expect(await sekmeTutari(page, 'cozum')).toBe(pro);
  await expect(page.locator('.v2-sg-neden')).toContainText('Rozet herkese açıktır');
});

test('ağ en çok 2 kademe; kademe payları segmentle açılır', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  const basliklar = await page.locator('.v2-ag .v2-so2-donem-tablo thead th').allInnerTexts();
  expect(basliklar).toEqual(expect.arrayContaining(['1. kademe', '2. kademe']));
  expect(basliklar).not.toContain('3. kademe');
  // Gümüş: 1. kademe açık, 2. kademe kapalı.
  await expect(page.locator('.v2-kr-satir', { hasText: 'Ağ, 1. kademe' })).not.toHaveAttribute('data-kapali', '');
  await expect(page.locator('.v2-kr-satir', { hasText: 'Ağ, 2. kademe' })).toHaveAttribute('data-kapali', '');
  await expect(page.locator('.v2-ag-bolum')).toContainText('saadet zinciri');
  // Kadrolu çalışan ağ payı almaz.
  await sekme(page, 'kadrolu').click();
  await expect(page.locator('.v2-ag')).toHaveCount(0);
});

test('sol panel: standart bölüm her personada aynı, özel koşullar en altta', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  const standart = () => page.locator('.v2-so2-ayarlar > .v2-so2-grup > .v2-so2-grup-baslik').allInnerTexts();
  const ilk = await standart();
  expect(ilk.length).toBeGreaterThanOrEqual(5);
  for (const id of ['kadrolu', 'cozum', 'tavsiye', 'elci']) {
    await sekme(page, id).click();
    expect(await standart()).toEqual(ilk);
    // Özel koşullar bölümü sol panelin son öğesidir.
    const son = await page.locator('.v2-so2-ayarlar > :last-child').evaluate((e) => !!e.querySelector('.v2-so2-ozel'));
    expect(son).toBe(true);
  }
  await sekme(page, 'kadrolu').click();
  await expect(page.locator('.v2-so2-ozel')).toContainText('Basamağa göre maaş ve prim');
  await expect(page.locator('.v2-sg-durum strong')).toHaveText('Satış uzmanı');
});

test('marka elçisi: kimlerle çalışırız etiketleri gerçek karşılıklar, kampanyalar personaya göre', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  await sekme(page, 'elci').click();
  const etiketler = await page.locator('.v2-so2-etiketler li').allInnerTexts();
  expect(etiketler).toEqual(expect.arrayContaining(['Toptan ticaret eğitmeni', 'E-ihracat içerik üreticisi', 'LinkedIn yazarı', 'Sektör YouTube kanalı', 'Girişimcilik topluluğu']));
  expect(etiketler.length).toBeGreaterThan(5);
  expect(etiketler).not.toContain('Marka elçisi');
  await expect(page.locator('.v2-kp-liste')).not.toContainText('Arkadaşını getir');
  await sekme(page, 'tavsiye').click();
  await expect(page.locator('.v2-kp-liste')).toContainText('Arkadaşını getir');
  await expect(page.locator('.v2-adalet-baslik')).toHaveText('Ortak olursa ne kazanır?');
});

test('kadrolu ve müşteri hesabı; bize kalan ağ payı düşülerek', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  // Kadrolu: Satış uzmanı basamağı, maaş 50.000; kota 50.000 × 2 × 1,2 = 120.000; prim (223.440 − 120.000) × %5 = 5.172.
  expect(await sekmeTutari(page, 'kadrolu')).toBe(55172);
  // Müşteri: 3 tavsiye × (399 € × 56 ₺ × 2 ay) = 134.064 ₺ kredi.
  expect(await sekmeTutari(page, 'tavsiye')).toBe(134064);
  // Bize kalan: 223.440 − 33.516 komisyon − 223.440 × %4,5 ağ payı = 179.869.
  await expect(page.locator('.v2-so2-bize')).toContainText('179.869 ₺');
  // Karşılaştırmalar ağ payını değil satış komisyonunu kullanır.
  await sekme(page, 'tavsiye').click();
  await expect(page.locator('.v2-adalet')).toContainText('33.516 ₺ satış komisyonu');
});

test('özel program seçilince klavye odağı seçilen düğmede kalır', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  await sekme(page, 'cozum').click();
  const dugme = page.locator('.v2-so2-ozel').getByRole('button', { name: /Satıcı geliştirme ortağı/ });
  await dugme.focus();
  await page.keyboard.press('Enter');
  await expect(dugme).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.activeElement?.textContent ?? '')).toContain('Satıcı geliştirme ortağı');
  await expect(page.locator('.v2-so2-kaynak')).toContainText('Özel program: Satıcı geliştirme ortağı');
});

for (const genislik of [320, 360, 375, 390]) {
  test(`v2 ${genislik} px: her personada yatay taşma yok`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'şimdilik yalnız Chrome');
    await ac(page, genislik);
    for (const id of ['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci']) {
      await sekme(page, id).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), id).toBeLessThanOrEqual(0);
    }
  });
}
