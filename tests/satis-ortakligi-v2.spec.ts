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
const pencere = (page: Page) => page.getByRole('dialog', { name: 'Koşullar' });
async function kosullariAc(page: Page, bolum?: string) {
  await page.getByRole('button', { name: 'Koşullar', exact: true }).click();
  await expect(pencere(page)).toBeVisible();
  if (bolum) await pencere(page).getByRole('button', { name: bolum }).click();
}
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
  await kosullariAc(page);
  await expect(pencere(page).locator('.v2-adalet-baslik').first()).toHaveText('Aynı satış, aynı kazanç');
});

test('Koşullar penceresi: sabit koşullar burada, panelde kısa segment durumu', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  // Sağ panelde merdivenin tamamı ve ağ kuralları yok; kısa durum ve kampanyalar var.
  await expect(page.locator('.v2-so2-panel .v2-sg-liste')).toHaveCount(0);
  await expect(page.locator('.v2-so2-panel .v2-ag')).toHaveCount(0);
  await expect(page.locator('.v2-so2-panel .v2-sg-durum')).toContainText('Altın ortak olmak için');
  const dugme = page.getByRole('button', { name: 'Koşullar', exact: true });
  await dugme.click();
  await expect(pencere(page)).toBeVisible();
  await expect(pencere(page).locator('.v2-sg-basamak')).toHaveCount(4);
  await expect(pencere(page)).toContainText('bütün personalarda aynıdır');
  for (const [bolum, metin] of [
    ['Kadrolu kariyer', 'Takım lideri'],
    ['Ağ', 'saadet zinciri'],
    ['Kampanyalar', 'Arkadaşını getir'],
  ]) {
    await pencere(page).getByRole('button', { name: bolum }).click();
    await expect(pencere(page)).toContainText(metin);
  }
  // Escape kapatır, odak düğmeye döner.
  await page.keyboard.press('Escape');
  await expect(pencere(page)).toHaveCount(0);
  await expect(dugme).toBeFocused();
  // Paneldeki kısa durumdan da açılır.
  await page.locator('.v2-so2-panel').getByRole('button', { name: 'Bütün koşulları gör' }).click();
  await expect(pencere(page).locator('.v2-sg-basamak')).toHaveCount(4);
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
  await expect(page.locator('.v2-sg-adimlar [data-durum="simdi"]')).toContainText('Gümüş ortak');
  await expect(page.locator('.v2-sg-durum')).toContainText('Altın ortak olmak için');
  const gumus = await sekmeTutari(page, 'oncu');

  await robot(page).getByRole('textbox', { name: /Standart paket/ }).fill('3');
  await page.getByRole('button', { name: 'Ürün sertifikası' }).click();
  await page.getByRole('textbox', { name: 'Yenileme oranı' }).fill('80');
  await expect(page.locator('.v2-sg-adimlar [data-durum="simdi"]')).toContainText('Altın ortak');
  await expect(page.locator('.v2-sg-durum')).toContainText('kurulum ve desteği üstlenmek');
  const altin = await sekmeTutari(page, 'oncu');
  expect(altin).toBeGreaterThan(gumus);

  await page.getByRole('button', { name: 'Ortak verir' }).click();
  await expect(page.locator('.v2-so2-sonuc-etiket')).toContainText('Profesyonel çözüm ortağı');
  const pro = await sekmeTutari(page, 'oncu');
  expect(pro).toBeGreaterThan(altin);
  // Rozet persona değil segmenttir: öğrenci de aynı tutarı alır.
  expect(await sekmeTutari(page, 'cozum')).toBe(pro);
  await kosullariAc(page);
  await expect(pencere(page).locator('.v2-sg-neden')).toContainText('Rozet herkese açıktır');
});

test('ağ en çok 2 kademe; kademe payları segmentle açılır', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  await kosullariAc(page, 'Ağ');
  const basliklar = await pencere(page).locator('.v2-ag .v2-so2-donem-tablo thead th').allInnerTexts();
  expect(basliklar).toEqual(expect.arrayContaining(['1. kademe', '2. kademe']));
  expect(basliklar).not.toContain('3. kademe');
  // Gümüş: 1. kademe açık, 2. kademe kapalı.
  await expect(page.locator('.v2-kr-satir', { hasText: 'Ağ, 1. kademe' })).not.toHaveAttribute('data-kapali', '');
  await expect(page.locator('.v2-kr-satir', { hasText: 'Ağ, 2. kademe' })).toHaveAttribute('data-kapali', '');
  await expect(pencere(page)).toContainText('saadet zinciri');
  await page.keyboard.press('Escape');
  // Kadrolu çalışanın kırılımında ağ payı yoktur.
  await sekme(page, 'kadrolu').click();
  await expect(page.locator('.v2-kr-satir', { hasText: 'Ağ, 1. kademe' })).toHaveCount(0);
});

test('standart ayarlar üstte ve her personada aynı; solda özel koşullar ve açık program kuralları', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  const standart = () => page.locator('.v2-so2-standart-gruplar > .v2-so2-grup > .v2-so2-grup-baslik').allTextContents();
  const ilk = await standart();
  expect(ilk).toEqual(expect.arrayContaining(['Satış: ayda kaç yeni müşteri?', 'Satıştaki katkı', 'Segment koşulları', 'Ağ: en çok 2 kademe', 'Kampanyalar', 'Fiyat']));
  // Sol panelde standart grup yok; program kuralları açık (akordeon değil).
  await expect(page.locator('.v2-so2-ayarlar .v2-so2-grup-baslik', { hasText: 'Satış: ayda kaç yeni müşteri?' })).toHaveCount(0);
  await expect(page.locator('.v2-so2-ayarlar details')).toHaveCount(0);
  await expect(page.locator('.v2-so2-ayarlar .v2-so2-kurallar-bolum')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Gümüş ortak' })).toBeVisible();
  for (const id of ['kadrolu', 'cozum', 'tavsiye', 'elci']) {
    await sekme(page, id).click();
    expect(await standart()).toEqual(ilk);
    await expect(page.locator('.v2-so2-ayarlar .v2-so2-ozel')).toBeVisible();
  }
  await sekme(page, 'kadrolu').click();
  await expect(page.locator('.v2-so2-ozel')).toContainText('Basamağa göre maaş ve prim');
  await expect(page.locator('.v2-so2-panel .v2-sg-durum strong')).toHaveText('Satış uzmanı');
});

test('1440 px: üç sütun, yapışık özet ve sürüm aynı satırda ayrı kutuda', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await page.setViewportSize({ width: 1600, height: 960 });
  await page.goto('satis-ortakligi/?surum=v2');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const kutu = (s: string) => page.locator(s).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { sol: r.left, sag: r.right, ust: r.top, alt: r.bottom, gen: r.width }; });
  const iskelet = await kutu('.v2-so2-iskelet');
  expect(iskelet.gen).toBeLessThanOrEqual(1440.5);
  expect(iskelet.gen).toBeGreaterThan(1400);
  const sol = await kutu('.v2-so2-ayarlar');
  const orta = await kutu('.v2-so2-sag');
  const ozet = await kutu('.v2-so2-ozet-kap');
  expect(sol.gen).toBeGreaterThanOrEqual(290);
  expect(sol.gen).toBeLessThanOrEqual(340.5);
  expect(orta.gen).toBeLessThanOrEqual(600.5);
  expect(orta.gen).toBeGreaterThan(560);
  expect(ozet.sol).toBeGreaterThan(orta.sag);
  // Özet sayfa başlığının altından başlar ve aşağı kayınca görünür kalır.
  const baslik = await kutu('.crumbs-row');
  expect(ozet.ust).toBeLessThan((await kutu('.v2-so2-arac')).alt);
  expect(ozet.ust).toBeGreaterThan(baslik.ust);
  await page.mouse.move(1300, 600);
  await page.mouse.wheel(0, 1800);
  await page.waitForTimeout(400);
  await expect(page.locator('.v2-oz')).toBeInViewport();
  // Sürüm, ürün ve ödeme ile aynı satırda; ayrı kutuda.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const surum = await kutu('.v2-so2-surum-kap');
  const urun = await kutu('.v2-so2-arac > .secim');
  expect(Math.abs(surum.alt - urun.alt)).toBeLessThan(24);
  expect(urun.sol).toBeGreaterThan(surum.sag);
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

test('arkadaşını getir: tahsilat süresi ve bedava ay adedi kenarlıklı tek kutuda, kural 90 gün', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  const kutu = page.getByRole('group', { name: 'Arkadaşını getir', exact: true });
  await expect(kutu).toBeVisible();
  // Kullanıcı kararı 2026-11-04: kutu kenarlıkla ayrılır, köşesi yuvarlatılmaz.
  const stil = await kutu.evaluate((el) => {
    const c = getComputedStyle(el);
    return { kenar: c.borderTopStyle, kalinlik: parseFloat(c.borderTopWidth), radius: c.borderTopLeftRadius };
  });
  expect(stil.kenar).toBe('solid');
  expect(stil.kalinlik).toBeGreaterThan(0);
  expect(stil.radius).toBe('0px');
  const sure = kutu.getByRole('textbox', { name: /Tahsilat süresi/ });
  await expect(sure).toHaveValue('3');
  await expect(kutu.locator('label', { hasText: 'Tahsilat süresi' })).toContainText('90 gün');
  await expect(kutu.getByRole('textbox', { name: /Tavsiye edene/ })).toHaveValue('2');
  await expect(kutu.getByRole('textbox', { name: /Yeni müşteriye/ })).toHaveValue('1');
  await expect(kutu.locator('label', { hasText: 'Tavsiye edene' })).toContainText('ay bedava');
  // Süre değişince kural ve sonuç metni aynı hesaptan güncellenir: her ay 30 gün sayılır.
  await sure.fill('2');
  await expect(kutu.locator('label', { hasText: 'Tahsilat süresi' })).toContainText('60 gün');
  await sekme(page, 'tavsiye').click();
  await expect(page.locator('.v2-kp-liste')).toContainText('2 ay (60 gün) içinde tahsil edilirse');
  await expect(page.locator('.v2-kp-liste')).toContainText('her ay 30 gün sayılır');
  await expect(page.locator('.v2-so2-sonuc')).toContainText('60 gün içinde tahsil edilirse');
  // Süre koşulu tutarı değiştirmez: 3 tavsiye × 2 ay kredi.
  expect(await sekmeTutari(page, 'tavsiye')).toBe(134064);
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

test('ürün satırı ve persona sekmeleri aşağı kayınca başlığa yapışık kalır', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız masaüstü Chrome');
  await ac(page);
  const kutu = (s: string) => page.locator(s).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { ust: r.top, alt: r.bottom }; });
  const ilk = await kutu('.v2-so2-arac');
  await page.mouse.wheel(0, 2200);
  await page.waitForTimeout(400);
  const kirinti = await kutu('.crumbs-row');
  const arac = await kutu('.v2-so2-arac');
  const roller = await kutu('.v2-so2-roller');
  // Başlığın hemen altında, üst üste binmeden ve ekranın üst bölümünde durur.
  expect(Math.abs(arac.ust - kirinti.alt)).toBeLessThanOrEqual(2);
  expect(Math.abs(roller.ust - arac.alt)).toBeLessThanOrEqual(2);
  expect(roller.alt).toBeLessThan(945 * 0.45);
  await expect(page.locator('.v2-so2-rol').first()).toBeInViewport();
  // Altından kayan sütunlar yapışık bölümün üstüne çizilmez.
  const ustte = await page.evaluate(() => {
    const ortasi = (s: string) => { const r = document.querySelector(s)!.getBoundingClientRect(); return [r.left + r.width / 2, r.top + 8] as const; };
    const a = document.elementFromPoint(...ortasi('.v2-so2-arac'))?.closest('.v2-so2-arac');
    const r = document.elementFromPoint(...ortasi('.v2-so2-roller'))?.closest('.v2-so2-roller');
    return !!a && !!r;
  });
  expect(ustte).toBe(true);
  // Yukarı çıkınca yerine döner.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  expect(Math.abs((await kutu('.v2-so2-arac')).ust - ilk.ust)).toBeLessThanOrEqual(2);
});

test('320 px önce: sayfada sonuç, ayarlar alttaki çubuktan açılan çekmecede', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız Chrome');
  await ac(page, 320);
  // Ayarlar sayfada çizilmez; sayfa kısa kalır.
  await expect(page.locator('.v2-so2-standart')).toHaveCount(0);
  await expect(page.locator('.v2-so2-ayarlar')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(8000);
  const cubuk = page.locator('.v2-so2-alt-cubuk');
  await expect(cubuk).toBeInViewport();
  await expect(cubuk).toContainText('Öncü satış ortağı');
  await expect(cubuk.locator('strong')).toContainText('46.922 ₺');
  const dugme = cubuk.getByRole('button', { name: 'Ayarlar' });
  await dugme.click();
  const cekmece = page.getByRole('dialog', { name: 'Ayarlar' });
  await expect(cekmece).toBeVisible();
  await cekmece.getByRole('group', { name: 'Satış: ayda kaç yeni müşteri?' }).getByRole('textbox', { name: /Standart paket/ }).fill('2');
  // Sonuç çekmece kapanmadan güncellenir: 2 × 223.440 × %15 + ağ 13.406 = 80.438.
  await expect(cekmece.locator('.v2-cekmece-sonuc strong')).toContainText('80.438 ₺');
  await cekmece.getByRole('button', { name: 'Persona' }).click();
  await expect(cekmece).toContainText('Özel koşullar: Öncü satış ortağı');
  await cekmece.getByRole('button', { name: 'Kurallar' }).click();
  await expect(cekmece.getByRole('textbox', { name: 'Gümüş ortak' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.keyboard.press('Escape');
  await expect(cekmece).toHaveCount(0);
  await expect(dugme).toBeFocused();
  await expect(cubuk.locator('strong')).toContainText('80.438 ₺');
});

test('uyarlanmış teslim: Koşullar penceresi ilk yüklemede indirilmez, açılınca yüklenir', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız Chrome');
  const istekler: string[] = [];
  page.on('request', (r) => istekler.push(r.url()));
  await ac(page);
  await page.waitForLoadState('networkidle');
  expect(istekler.filter((u) => /KosullarV2/.test(u))).toEqual([]);
  await kosullariAc(page);
  expect(istekler.filter((u) => /KosullarV2/.test(u)).length).toBeGreaterThan(0);
});

test('64em geçişinde odak korunur, çekmece kendiliğinden açılmaz', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız Chrome');
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto('satis-ortakligi/?surum=v2');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.locator('.v2-so2-alt-cubuk').getByRole('button', { name: 'Ayarlar' }).click();
  const cekmece = page.getByRole('dialog', { name: 'Ayarlar' });
  await cekmece.getByRole('textbox', { name: 'Yenileme oranı' }).focus();
  // Geniş ekrana geçince çekmece kapanır, odak sayfadaki aynı alana geçer.
  await page.setViewportSize({ width: 1100, height: 800 });
  await expect(cekmece).toHaveCount(0);
  await expect(page.locator('.v2-so2-standart').getByRole('textbox', { name: 'Yenileme oranı' })).toBeFocused();
  // Geri daralınca çekmece kendiliğinden açılmaz; odak ayar düğmesine düşer.
  await page.setViewportSize({ width: 900, height: 800 });
  await expect(page.getByRole('dialog', { name: 'Ayarlar' })).toHaveCount(0);
  await expect(page.locator('.v2-so2-alt-cubuk').getByRole('button', { name: 'Ayarlar' })).toBeFocused();
  // Geniş ekranda yan sütunun yüksekliği yeniden ölçülür.
  await page.setViewportSize({ width: 1100, height: 800 });
  await expect.poll(() => page.locator('.v2-so2-ayarlar').evaluate((e) => getComputedStyle(e).getPropertyValue('--v2-so2-boy'))).not.toBe('');
});

test('320 px: alttaki çubuk sayfanın sonunu ve odaklanan öğeyi örtmez', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız Chrome');
  await ac(page, 320);
  const son = page.locator('.app-footer a, .app-footer button').last();
  await son.focus();
  await page.waitForTimeout(300);
  const [oge, cubuk] = await Promise.all([son.boundingBox(), page.locator('.v2-so2-alt-cubuk').boundingBox()]);
  expect(oge!.y + oge!.height).toBeLessThanOrEqual(cubuk!.y + 1);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(200);
  const [oge2, cubuk2] = await Promise.all([son.boundingBox(), page.locator('.v2-so2-alt-cubuk').boundingBox()]);
  expect(oge2!.y + oge2!.height).toBeLessThanOrEqual(cubuk2!.y + 1);
});

test('1024 × 768: seçimler önce, özet sonda, canlı sonuç alttaki çubukta', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'şimdilik yalnız Chrome');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('satis-ortakligi/?surum=v2');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('.v2-so2-arac')).toBeInViewport();
  const ozetUst = await page.locator('.v2-so2-ozet-kap').evaluate((e) => e.getBoundingClientRect().top);
  const panelUst = await page.locator('.v2-so2-panel').evaluate((e) => e.getBoundingClientRect().top);
  expect(ozetUst).toBeGreaterThan(panelUst);
  const cubuk = page.locator('.v2-so2-alt-cubuk');
  await expect(cubuk).toBeInViewport();
  await expect(cubuk.locator('strong')).toContainText('46.922 ₺');
  await page.mouse.move(500, 500);
  await page.mouse.wheel(0, 2400);
  await page.waitForTimeout(400);
  const alt = await page.locator('.v2-so2-roller').evaluate((e) => e.getBoundingClientRect().bottom);
  expect(alt).toBeLessThan(768 * 0.45);
  await cubuk.getByRole('button', { name: 'Özet' }).click();
  await expect(page.locator('.v2-oz')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('Koşullar kapanınca odak açan düğmeye döner (Chrome ve Safari motoru)', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox testleri kullanıcı kararıyla çalıştırılmaz');
  await ac(page);
  const dugme = page.getByRole('button', { name: 'Koşullar', exact: true });
  await dugme.click();
  await expect(pencere(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(pencere(page)).toHaveCount(0);
  await expect(dugme).toBeFocused();
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
