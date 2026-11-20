import { readFileSync } from 'node:fs';
import { expect, test, type Page } from './fixtures/persona';

// Kullanıcı kararı 17 Kasım 2026 Salı: kazanç planı bölümleri alt alta durur. Adım çubuğu yoktur.
// Kalıcı kurallar ana ekranda görünmez. Yönetici onları “Parametreler” penceresinden yönetir.
const plani = (page: Page) => page.getByRole('region', { name: 'Kazanç planı' });
const bolum = (page: Page, ad: string) => plani(page).getByRole('region', { name: ad, exact: true });
const kutu = (page: Page, ad: string) => plani(page).getByRole('textbox', { name: ad, exact: true });
const tasmaYok = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

// Kullanıcı kararı 16 Kasım 2026 Pazartesi: kâğıttaki kazanç planı. Persona fark etmez, herkes iş ortağıdır.
// Yalnız kadrolu uzman SGK'lı çalışandır ve maaş alır.

test('kazanç planının varsayılanları kâğıttaki planla aynıdır', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  // Kullanıcı kararı 17 Kasım 2026 Salı: yalnız tanıştıranın oranı K0'da %0, K1'de %7, K2'de %10, K3'te %15'tir.
  expect(p.tanistir.taban).toBe(0);
  expect(p.tanistir.kotaEsik).toEqual([30_000, 60_000, 100_000]);
  expect(p.tanistir.kotaArtis).toEqual([0.07, 0.03, 0.05]);
  expect([0, 30_000, 60_000, 100_000].map((c) => k.katkiOrani(p, 'tanistir', c).oran)).toEqual([0, 0.07, 0.1, 0.15]);
  // Koşullu kümülatif: ulaşılan seviyenin oranı cironun tamamına uygulanır. 1.000.000 ₺ ciroda satışı kapatan 300.000 ₺ alır.
  expect(1_000_000 * k.katkiOrani(p, 'kapatir', 1_000_000).oran).toBe(300_000);
  // Kullanıcı kararı 20 Kasım 2026 Cuma: tanıştıranın yenileme oranı yoktur. Tanıştıran yalnız ilk 3 ayda pay alır.
  expect(p.tanistir.gecmis).toEqual([0]);
  // Kullanıcı kararı 17 Kasım 2026 Salı: satışı kapatanın oranı K0'da %15, K1'de %20, K2'de %25, K3'te %30'dur.
  // Eşikler 0, 30.000, 70.000 ve 120.000 ₺'dir. Yıllık yenilemede 13. ile 24. ay arası %10. 25. aydan sonra pay yoktur.
  expect(p.kapatir.taban).toBe(0.15);
  expect(p.kapatir.kotaArtis).toEqual([0.05, 0.05, 0.05]);
  expect(p.kapatir.gecmis).toEqual([0.1]);
  expect(p.kapatir.kotaEsik).toEqual([30_000, 70_000, 120_000]);
  expect([0, 29_999, 30_000, 70_000, 120_000].map((c) => k.katkiOrani(p, 'kapatir', c).oran)).toEqual([0.15, 0.15, 0.2, 0.25, 0.3]);
  expect(p.ornekCiro).toBe(50_000);
  expect(p.paylasim.sureAy).toBe(3);
  expect(p.kadrolu.maas).toBe(50_000);
  // Kullanıcı kararı 20 Kasım 2026 Cuma: maaş kotası net maaşın 2 katıdır. 50.000 ₺ maaşta kota 100.000 ₺ olur.
  expect(k.kadroluKota(p)).toBe(100_000);
  expect(p.kadrolu.primOrani).toBeNull();
});

test('kota eşiği yoksa taban oran, eşik aşılınca artışlar sırayla eklenir', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  const esikli = { ...p, kapatir: { ...p.kapatir, kotaEsik: [100_000, 250_000, 500_000] as [number, number, number] } };
  expect(k.katkiOrani(esikli, 'kapatir', 99_999)).toEqual({ oran: 0.15, kota: 0 });
  expect(k.katkiOrani(esikli, 'kapatir', 100_000).kota).toBe(1);
  expect(k.katkiOrani(esikli, 'kapatir', 100_000).oran).toBeCloseTo(0.2);
  expect(k.katkiOrani(esikli, 'kapatir', 300_000).oran).toBeCloseTo(0.25);
  expect(k.katkiOrani(esikli, 'kapatir', 600_000)).toMatchObject({ kota: 3 });
  expect(k.katkiOrani(esikli, 'kapatir', 600_000).oran).toBeCloseTo(0.3);
  // Eşikler sırayla aranır. K1 boşsa K2 de uygulanmaz.
  expect(k.katkiOrani({ ...p, kapatir: { ...p.kapatir, kotaEsik: [null, 1, 1] } }, 'kapatir', 10).kota).toBe(0);
});

// Kullanıcı kararı 20 Kasım 2026 Cuma: 13. aydan sonra yalnız yıllık yenileme payı vardır. 25. aydan sonra pay yoktur.
test('yıllık yenilemede satışı kapatan 13. ile 24. ay arasında düşük oranı alır', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  expect(k.YENILEME_DONEMI).toBe('13. ile 24. ay arası');
  expect(k.yenilemeKazanci(p, 100_000)).toEqual({ oran: 0.1, tutar: 10_000 });
});

// Kullanıcı kararı 17 Kasım 2026 Salı: kişi ilk 12 ayda K1 kotasını tamamlamazsa 13. aydan sonra pay almaz.
// 20 Kasım 2026 Cuma kararıyla 13. aydan sonra yalnız yıllık yenileme payı kaldı.
test('kota kuralı: K1 tamamlanmazsa yıllık yenilemede pay yoktur', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  expect(k.kotaTamam(p, 'tanistir', 29_999)).toBe(false);
  expect(k.kotaTamam(p, 'tanistir', 30_000)).toBe(true);
  expect(k.yenilemeKazanci(p, 20_000)).toEqual({ oran: 0, tutar: 0 });
  // K1 eşiği boşsa kural ölçülemez. Örnek kotayı tamamlanmış sayar.
  expect(k.kotaTamam({ ...p, kapatir: { ...p.kapatir, kotaEsik: [null, null, null] } }, 'kapatir', 1)).toBe(true);
  // Örnek hesap: aylık ciro 40.000 ₺. K1 oranı %20'dir. Yıllık yenilemede %10 uygulanır.
  const h = k.ornekHesap({ ...p, ornekCiro: 40_000 }, 'kapatir');
  expect(h.satirlar.map((r) => r.tutar)).toEqual([8_000, 4_000]);
  expect(h.toplam).toBe(96_000);
  const dusuk = { ...structuredClone(p), ornekCiro: 20_000 };
  dusuk.kapatir.kotaEsik = [30_000, null, null];
  expect(k.ornekHesap(dusuk, 'kapatir').satirlar.map((r) => r.tutar)).toEqual([3_000, 0]);
  expect(k.ornekHesap(dusuk, 'kapatir').toplam).toBe(36_000);
});

test('Segika başlangıç planı yöneticinin JSON çıktısındaki kalıcı kurallarla açılır', async () => {
  const k = await import('../src/data/kazancPlani');
  const s = k.projeVarsayilani('segika');
  // Kullanıcı kararı 20 Kasım 2026 Cuma: dönem oranları ve sonraki yılların bölüşme sorusu kalktı. 12 kalıcı kural kaldı.
  expect(s.kalici).toHaveLength(12);
  expect(s.kalici).toEqual(expect.arrayContaining(['tanistir.taban', 'kapatir.taban', 'paylasim.sureAy', 'paylasim.ilkSatis']));
  expect([s.tanistir.kotaEsik, s.kapatir.kotaEsik]).toEqual([[30_000, 70_000, 100_000], [30_000, 70_000, 120_000]]);
  expect(s.kapatir.kotaArtis).toEqual([0.05, 0.05, 0.05]);
  expect(k.projeVarsayilani('istoc').kalici).toEqual([]);
  // Tarayıcıdaki kayıt kalıcı listesini taşır. Yönetici bir kuralı kalıcıdan çıkarabilir.
  expect(k.planOku({ kalici: ['tanistir.taban'] }, 'segika').kalici).toEqual(['tanistir.taban']);
});

test('plan rehberin hesap ayarına yansır ve orta seçenek kalkar', async () => {
  const k = await import('../src/data/kazancPlani');
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  const a = k.planliAyar({ ...VARSAYILAN_AYAR, oncuSeviye: 'B', elciSeviye: 'B', cozumSeviye: 'B' }, k.KAZANC_VARSAYILAN);
  expect(a.oran).toEqual({ A: 0, B: 0.15, C: 0.15 });
  expect([a.oncuSeviye, a.elciSeviye, a.cozumSeviye]).toEqual(['C', 'C', 'C']);
  expect(a.maas).toBe(50_000);
  expect(a.maas * a.kotaCarpan * (1 + a.kotaEk)).toBe(100_000);
});

test('satışta katkı seçiminde orta seçenek yoktur', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await page.getByRole('button', { name: 'Görevi ve çalışma koşullarını görün', exact: true }).click();
  const grup = page.getByRole('group', { name: 'Satışta katkınız' });
  await expect(grup.getByRole('button')).toHaveCount(2);
  await expect(grup).not.toContainText('Ürün');
});

test('kota eşiği her katkı türünde ayrı hesaplanır', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = structuredClone(k.KAZANC_VARSAYILAN);
  p.kapatir.kotaEsik = [100_000, null, null];
  expect(k.katkiOrani(p, 'kapatir', 100_000)).toMatchObject({ kota: 1 });
  expect(k.katkiOrani(p, 'tanistir', 20_000)).toMatchObject({ kota: 0 });
  expect(k.katkiOrani(p, 'tanistir', 100_000)).toMatchObject({ kota: 3 });
  // Eski kayıtta tek eşik listesi vardı. Bu liste iki katkı türüne de geçer.
  const eski = k.planOku({ kotaEsik: [1, 2, 3] });
  expect([eski.tanistir.kotaEsik, eski.kapatir.kotaEsik]).toEqual([[1, 2, 3], [1, 2, 3]]);
});

// Kullanıcı kararı 17 Kasım 2026 Salı: tanıştıran ile satışı kapatan farklı kişiyse pay bölüşmesi seçenektir.
// Yönetici seçer. Her soruda varsayılan “Ahmet'in payı Mehmet'in payından düşülür” seçeneğidir. Bu seçenek şirketi zarardan korur.
test('pay bölüşme hesabı seçime ve kutulardaki oranlara göre yapılır', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = structuredClone(k.KAZANC_VARSAYILAN);
  expect(p.paylasim).toEqual({ sureAy: 3, ilkSatis: 'dus', kota: 'dus' });
  // Hesap kutulardaki oranlarla yapılır. Bu denemede eşikler boştur.
  p.tanistir.taban = 0.07;
  p.tanistir.kotaEsik = [null, null, null];
  p.tanistir.kotaArtis = [0, 0, 0];
  p.kapatir.kotaEsik = [null, null, null];
  expect(k.SURE_SECENEKLERI).toEqual([1, 2, 3, 4, 5, 6, 8, 10, 12]);
  // Bölüşme ilk 3 aydadır. Sonra Ahmet pay almaz, Mehmet kendi oranının tamamını alır.
  expect(k.paylasim(p, 100_000)).toMatchObject({ tanistiranOran: 0.07, kapatanOran: 0.08, tanistiran: 7_000, kapatan: 8_000, toplam: 15_000, sonrakiOran: 0.15, yenilemeOran: 0.1 });
  p.paylasim.ilkSatis = 'tam';
  expect(k.paylasim(p, 100_000)).toMatchObject({ tanistiran: 7_000, kapatan: 15_000, toplam: 22_000 });
  // Kota artışı: iki katkı türü de K1'e ulaşır. Düşmede tanıştıranın artışı kapatanın artışından düşülür.
  const q = structuredClone(k.KAZANC_VARSAYILAN);
  q.tanistir.kotaEsik = [50_000, null, null];
  q.tanistir.taban = 0.07;
  q.tanistir.kotaArtis = [0.01, 0, 0];
  q.kapatir.kotaEsik = [50_000, null, null];
  expect(k.paylasim(q, 100_000)).toMatchObject({ tanistiranOran: 0.08, kapatanOran: 0.12 });
  q.paylasim.kota = 'tam';
  expect(k.paylasim(q, 100_000)).toMatchObject({ tanistiranOran: 0.08, kapatanOran: 0.13 });
  expect(k.planOku({ paylasim: { sureAy: 7, ilkSatis: 'x' } }).paylasim).toEqual({ sureAy: 3, ilkSatis: 'dus', kota: 'dus' });
  expect(k.planOku({ paylasim: { sureAy: 12, kota: 'tam' } }).paylasim).toMatchObject({ sureAy: 12, kota: 'tam' });
});

test('JSON kalıcı kuralları ve bütün güncel değerleri içerir', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = structuredClone(k.KAZANC_VARSAYILAN);
  expect(k.kaliciJson(p, 'istoc', new Date(2026, 10, 17)).kurallar).toEqual([]);
  p.kalici = ['kapatir.taban', 'paylasim.ilkSatis', 'paylasim.sureAy', 'olmayan'];
  p.paylasim.ilkSatis = 'tam';
  const j = k.kaliciJson(p, 'segika', new Date(2026, 10, 17));
  expect(j).toMatchObject({ tur: 'kazanc-plani-kalici-kurallar', surum: 2, proje: 'segika', gorunum: 'Segika', tarih: '2026-11-17', tarihMetni: '17 Kasım 2026 Salı' });
  expect(j.kurallar).toEqual([
    { id: 'kapatir.taban', ad: 'Satışı kapatma taban oranı', deger: 0.15, gosterim: '%15', gorunum: 'Segika', tarih: '2026-11-17' },
    { id: 'paylasim.sureAy', ad: 'Tanıştırmanın geçerlilik süresi', deger: 3, gosterim: '3 ay', gorunum: 'Segika', tarih: '2026-11-17' },
    { id: 'paylasim.ilkSatis', ad: 'İlk satışta pay', deger: 'tam', gosterim: 'Şirket ikisine de tam öder', gorunum: 'Segika', tarih: '2026-11-17' },
  ]);
  // Kullanıcı kararı 17 Kasım 2026 Salı: işaretli olmayan değerler de JSON'da durur.
  expect(j.degerler).toHaveLength(k.kuralListesi(p).length);
  expect(j.degerler.find((d) => d.id === 'kapatir.taban')).toMatchObject({ deger: 0.15, kalici: true });
  expect(j.degerler.find((d) => d.id === 'tanistir.kotaEsik.0')).toMatchObject({ deger: 30_000, kalici: false });
});


test('iStoc: bölümler alt alta durur, oranlar anahtarla seçilir ve değer yenilemeden sonra kalır', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await expect(plani(page)).toContainText('Herkes iş ortağıdır.');
  await expect(plani(page).getByRole('navigation', { name: 'Kazanç planı adımları' })).toHaveCount(0);
  for (const ad of ['Kararlar', 'Oranlar', 'Sonuç']) await expect(bolum(page, ad)).toBeVisible();
  // JSON herkese görünmez. JSON yalnız Parametreler penceresindedir.
  await expect(plani(page).getByRole('textbox', { name: 'Kazanç planı JSON' })).toHaveCount(0);
  const oranlar = bolum(page, 'Oranlar');
  const anahtar = oranlar.getByRole('switch');
  await expect(anahtar).toHaveAttribute('aria-checked', 'false');
  await expect(kutu(page, 'Tanıştırma taban oranı')).toHaveValue('%0');
  await expect(kutu(page, 'Tanıştırma K1 ciro eşiği')).toHaveValue('30.000 ₺');
  // Tanıştıranın yenileme oranı yoktur (kullanıcı kararı 20 Kasım 2026 Cuma).
  await expect(plani(page).getByRole('textbox', { name: /Tanıştırma.*yenileme/ })).toHaveCount(0);
  // Grup içindeki görünür ad kısadır. Tam ad ekran okuyucuya gider.
  await expect(oranlar.locator('[data-etkin] label', { hasText: /^K1 için aylık ciro/ })).toBeVisible();
  // Kutunun ne olduğu ve nasıl değiştirileceği yazılıdır.
  await expect(oranlar.locator('[data-etkin] .pol-kz-nasil')).toContainText('beyaz kutuya tıklayın');
  await expect(kutu(page, 'Satışı kapatma taban oranı')).toHaveCount(0);
  await anahtar.click();
  await expect(anahtar).toHaveAttribute('aria-checked', 'true');
  await expect(kutu(page, 'Tanıştırma taban oranı')).toHaveCount(0);
  await expect(kutu(page, 'Satışı kapatma taban oranı')).toHaveValue('%15');
  for (const [k, d] of [['K1', '30.000 ₺'], ['K2', '70.000 ₺'], ['K3', '120.000 ₺']]) await expect(kutu(page, `Satışı kapatma ${k} ciro eşiği`)).toHaveValue(d);
  await expect(kutu(page, 'Satışı kapatma yıllık yenileme oranı')).toHaveValue('%10');
  await kutu(page, 'Satışı kapatma taban oranı').fill('%20');
  // 50.000 ₺ ciro K1 eşiğini geçer. Oran %20 taban ile %5 puandır.
  await expect(plani(page).locator('[data-kazanc="kapatir-bu-yil"]')).toHaveText('50.000 ₺ × %25 = 12.500 ₺');
  await page.reload();
  await bolum(page, 'Oranlar').getByRole('switch').click();
  await expect(kutu(page, 'Satışı kapatma taban oranı')).toHaveValue('%20');
  expect(await tasmaYok(page)).toBe(true);
});

test('Segika: kalıcı kurallar ana ekranda görünmez, öteki değerler görünür', async ({ page }) => {
  await page.goto('politikalar/?proje=segika&rol=cozum');
  await expect(kutu(page, 'Tanıştırma taban oranı')).toHaveCount(0);
  await expect(kutu(page, 'Tanıştırma K1 ciro eşiği')).toHaveValue('30.000 ₺');
  await expect(bolum(page, 'Kararlar')).toContainText('Bütün kararlar kalıcı kuraldır.');
  await expect(plani(page).getByRole('group', { name: 'İlk satışta pay' })).toHaveCount(0);
});

test('iki projenin planı ayrı saklanır', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await kutu(page, 'Tanıştırma K1 ciro eşiği').fill('50.000');
  await page.goto('politikalar/?proje=segika&rol=cozum');
  await expect(kutu(page, 'Tanıştırma K1 ciro eşiği')).toHaveValue('30.000 ₺');
});

test('kota eşiği girilince oran sırayla artar', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=elci');
  await kutu(page, 'Örnek aylık ciro').fill('300.000');
  await bolum(page, 'Oranlar').getByRole('switch').click();
  await kutu(page, 'Satışı kapatma K1 ciro eşiği').fill('100.000');
  await kutu(page, 'Satışı kapatma K2 ciro eşiği').fill('250.000');
  await kutu(page, 'Satışı kapatma K3 ciro eşiği').fill('400.000');
  await expect(plani(page).locator('[data-kazanc="kapatir-oran"]')).toHaveText('%25');
  await expect(plani(page).locator('[data-kazanc="kapatir-bu-yil"]')).toContainText('75.000 ₺');
});

test('kadrolu uzman sekmesi maaşı, kotayı ve SGK kaydını söyler', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=kadrolu');
  await expect(plani(page)).toContainText('SGK');
  await expect(plani(page)).not.toContainText('Herkes iş ortağıdır.');
  await expect(plani(page)).toContainText('50.000 ₺ ile 60.000 ₺');
  await expect(kutu(page, 'Aylık net maaş')).toHaveValue('50.000');
  await expect(kutu(page, 'Maaş kotası oranı')).toHaveValue('%200');
  await expect(plani(page).locator('[data-kazanc="kadrolu-kota"]')).toContainText('100.000 ₺');
});

// Kullanıcı kararı 17 Kasım 2026 Salı: katkı seçimi büyük anahtardır. Bütün katkı seçimleri aynı bileşeni kullanır.
test('katkı anahtarı klavyeyle ve yazıya tıklayarak değişir, odak halkası yoktur', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('politikalar/?proje=istoc&rol=elci');
  await expect(plani(page).getByRole('switch')).toHaveCount(3);
  const oranlar = bolum(page, 'Oranlar');
  const anahtar = oranlar.getByRole('switch');
  await anahtar.focus();
  await page.keyboard.press('Space');
  await expect(anahtar).toHaveAttribute('aria-checked', 'true');
  await expect(kutu(page, 'Satışı kapatma taban oranı')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(anahtar).toHaveAttribute('aria-checked', 'false');
  await oranlar.locator('.pol-kz-anahtar-ad').last().click();
  await expect(anahtar).toHaveAttribute('aria-checked', 'true');
  // Klavye modunda da anahtarın çevresinde halka yoktur.
  await page.keyboard.press('Shift+Tab');
  await anahtar.focus();
  await expect(anahtar).toBeFocused();
  const odak = await anahtar.evaluate((el) => { const s = getComputedStyle(el); return s.outlineStyle; });
  expect(odak).toBe('none');
  expect(await tasmaYok(page)).toBe(true);
});

// Kullanıcı kararı 17 Kasım 2026 Salı: her katkının K1, K2 ve K3 eşiği ayrıdır.
test('iki katkının kota eşikleri birbirinden ayrıdır', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('politikalar/?proje=istoc&rol=elci');
  const anahtar = bolum(page, 'Oranlar').getByRole('switch');
  await kutu(page, 'Tanıştırma K1 ciro eşiği').fill('100.000');
  await anahtar.click();
  await expect(kutu(page, 'Satışı kapatma K1 ciro eşiği')).toHaveValue('30.000 ₺');
  await kutu(page, 'Satışı kapatma K1 ciro eşiği').fill('250.000');
  await anahtar.click();
  await expect(kutu(page, 'Tanıştırma K1 ciro eşiği')).toHaveValue('100.000 ₺');
  await page.reload();
  await expect(kutu(page, 'Tanıştırma K1 ciro eşiği')).toHaveValue('100.000 ₺');
  await bolum(page, 'Oranlar').getByRole('switch').click();
  await expect(kutu(page, 'Satışı kapatma K1 ciro eşiği')).toHaveValue('250.000 ₺');
});

// Kullanıcı kararı 17 Kasım 2026 Salı: Sonuç bölümü satıcı adayını motive eden bir oyun panelidir.
test('kazanç oyunu: seviye, hedef, rozetler ve tablo ciroya göre değişir', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('politikalar/?proje=segika&rol=cozum');
  const panel = plani(page).locator('.pol-kz-oyun');
  await expect(panel.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  // İki katkının paneli üst üste durur. Yalnız etkin panel görünür.
  const oyun = panel.locator('[data-etkin] > .pol-kz-oyun-govde');
  await expect(oyun).toHaveAttribute('data-sim-tur', 'kapatir');
  await expect(oyun.locator('[data-sim="bu-ay"]')).toHaveText('10.000 ₺');
  // Kullanıcı kararı 20 Kasım 2026 Cuma: aylık pakette pay en çok 12 ay sürer. Yenilemede %10 uygulanır.
  await expect(oyun.locator('[data-sim="sure"]')).toHaveText('120.000 ₺');
  await expect(oyun.locator('[data-sim="yenileme"]')).toHaveText('%10');
  await expect(oyun.locator('[data-sim="hedef"]')).toContainText('K2 kotasına 20.000 ₺ kaldı.');
  await expect(oyun.locator('[data-sim="hedef"]')).toContainText('K2 eşiğinde aylık kazancınız 17.500 ₺ olur.');
  await expect(oyun.getByRole('progressbar', { name: 'K2 hedefine ilerleme' })).toHaveAttribute('aria-valuenow', '71');
  // Seviye kutuları kaydırıcının altında kümelenir. Bulunulan seviye basılı görünür.
  const seviyeler = panel.getByRole('group', { name: /Kota seviyeleri/ });
  await expect(seviyeler.getByRole('button', { name: /^K1:/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(oyun.locator('tr[aria-current="true"] th')).toContainText('K1');
  // Seviye kutusuna basınca ciro o seviyenin eşiğine gelir.
  await seviyeler.getByRole('button', { name: /^K2:/ }).click();
  await expect(panel.getByRole('slider')).toHaveValue('70000');
  await expect(oyun.locator('[data-sim="bu-ay"]')).toHaveText('17.500 ₺');
  await expect(oyun.locator('tr[aria-current="true"] th')).toContainText('K2');
  // Kota kuralı: K1 tamamlanmazsa yıllık yenilemede pay yoktur.
  await kutu(page, 'Örnek aylık ciro').fill('20.000');
  await expect(oyun.locator('[data-sim="devam"]')).not.toHaveAttribute('data-acik', '');
  await expect(oyun.locator('[data-sim="devam"]')).toContainText('K1 kotası tamamlanınca açılır.');
  await expect(oyun.locator('[data-sim="sure"]')).toHaveText('36.000 ₺');
  await expect(oyun.locator('[data-sim="yenileme"]')).toHaveText('Pay yok');
  // Kaydırıcı ciroyu değiştirir.
  await panel.getByRole('slider', { name: 'Aylık ciroyu kaydırarak seçin' }).fill('70000');
  await expect(oyun.locator('[data-sim="bu-ay"]')).toHaveText('17.500 ₺');
  // Dar ekranda tablo yana kaymaz. Satırlar kart olur.
  await expect(oyun.locator('.pol-kz-tablo thead')).toBeHidden();
  expect(await oyun.locator('.table-scroll').evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  // Anahtar tanıştırmaya geçince etkin panel değişir.
  await panel.getByRole('switch').click();
  await expect(panel.locator('[data-etkin] > .pol-kz-oyun-govde')).toHaveAttribute('data-sim-tur', 'tanistir');
  expect(await tasmaYok(page)).toBe(true);
});

test('Segika: Parametreler penceresi kalıcı kuralları ve JSON çıktısını yönetir', async ({ page }) => {
  let disaGiden = 0;
  page.on('request', (r) => { if (/kalici|kazanc-plani/.test(`${r.url()} ${r.postData() ?? ''}`)) disaGiden++; });
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('politikalar/?proje=segika&rol=cozum');
  await expect(plani(page).locator('[data-paylasim="toplam"]')).toHaveText('10.000 ₺');
  const dugme = page.getByRole('button', { name: 'Parametreler', exact: true });
  const kutuDugme = await dugme.boundingBox();
  // Düğme sağ kenara yapışıktır ve dikeyde ortadadır.
  expect(Math.round(kutuDugme!.x + kutuDugme!.width)).toBe(375);
  expect(Math.abs(kutuDugme!.y + kutuDugme!.height / 2 - 350)).toBeLessThanOrEqual(2);
  await dugme.click();
  const pencere = page.getByRole('dialog', { name: 'Parametreler' });
  await expect(pencere.getByRole('heading', { name: 'Kalıcı kurallar' })).toBeVisible();
  await expect(pencere.getByRole('button', { name: /kalıcı kuraldan çıkarın$/ })).toHaveCount(12);
  // Pencere tam ekran değildir: genişlik en çok %80, yükseklik en çok %90.
  await expect.poll(() => page.locator('.pol-kz-pencere').evaluate((el) => getComputedStyle(el).transform)).toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/);
  const boyut = await page.locator('.pol-kz-pencere').evaluate((el) => { const r = el.getBoundingClientRect(); return [r.width / innerWidth, r.height / innerHeight, el.scrollHeight > el.clientHeight]; });
  expect(boyut[0]).toBeLessThanOrEqual(0.81);
  expect(boyut[1]).toBeLessThanOrEqual(0.91);
  expect(boyut[2]).toBe(true);
  // Pencere ekranın tam ortasındadır. Sol ve sağ, üst ve alt boşluklar eşittir.
  // Açılış hareketi bitene kadar beklenir.
  await expect.poll(() => page.locator('.pol-kz-pencere').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return Math.abs(r.left - (innerWidth - r.right)) <= 1 && Math.abs(r.top - (innerHeight - r.bottom)) <= 1 && r.left > 0;
  })).toBe(true);
  const json = JSON.parse(await pencere.getByRole('textbox', { name: 'Kazanç planı JSON' }).inputValue());
  expect(json).toMatchObject({ proje: 'segika', gorunum: 'Segika', surum: 2 });
  expect(json.kurallar).toHaveLength(12);
  expect(json.degerler.find((d: { id: string }) => d.id === 'tanistir.kotaEsik.0')).toMatchObject({ kalici: false });
  // Kalıcı değer pencerede değiştirilir. Sonuç hemen değişir.
  await pencere.getByRole('group', { name: 'Kota artışında pay' }).getByRole('button', { name: 'Şirket ikisine de tam öder', exact: true }).click();
  // Kalıcı kuraldan çıkan değer ana ekrana döner.
  await pencere.getByRole('button', { name: 'Kota artışında pay: kalıcı kuraldan çıkarın', exact: true }).click();
  await expect(pencere.getByRole('button', { name: /kalıcı kuraldan çıkarın$/ })).toHaveCount(11);
  await page.keyboard.press('Escape');
  await expect(dugme).toBeFocused();
  await expect(plani(page).getByRole('group', { name: 'Kota artışında pay' }).getByRole('button', { name: 'Şirket ikisine de tam öder', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Tanıştıran %7 alır. Kota artışı düşülmez, kapatan %20 alır. 50.000 ₺ ciroda toplam 13.500 ₺ olur.
  await expect(plani(page).locator('[data-paylasim="toplam"]')).toHaveText('13.500 ₺');
  // Ana ekranda işaretlenen değer pencereye taşınır.
  // Kutu işaretlenince alan ana ekrandan kalkar. Bu yüzden check() yerine tıklanır.
  await plani(page).getByRole('checkbox', { name: 'Kota artışında pay kalıcı kural', exact: true }).click();
  await expect(plani(page).getByRole('group', { name: 'Kota artışında pay' })).toHaveCount(0);
  await page.reload();
  await expect(plani(page).getByRole('group', { name: 'Kota artışında pay' })).toHaveCount(0);
  expect(disaGiden).toBe(0);
});

test.describe('girişsiz okur', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('rehber girişsiz açılır, Parametreler giriş ister, öteki sayfa giriş ister', async ({ page }) => {
    await page.goto('politikalar/?proje=segika&rol=cozum');
    await expect(plani(page)).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Ana gezinme' }).or(page.getByRole('button', { name: /Menü/ }))).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Giriş', level: 1 })).toHaveCount(0);
    await page.getByRole('button', { name: 'Parametreler', exact: true }).click();
    const pencere = page.getByRole('dialog', { name: 'Parametreler' });
    await expect(pencere.getByRole('heading', { name: 'Giriş', level: 2 })).toBeVisible();
    await expect(pencere.getByRole('textbox', { name: 'Kazanç planı JSON' })).toHaveCount(0);
    await expect(pencere.getByRole('heading', { name: 'Kalıcı kurallar' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.goto('giderler/');
    await expect(page.getByRole('heading', { name: 'Giriş', level: 1 })).toBeVisible();
  });
});

// Kullanıcı kararı 17 Kasım 2026 Salı: bir şey değişince ekran zıplamaz. Değişen alan en büyük hâli kadar yer ayırır.
for (const genislik of [320, 1280]) test(`${genislik} px: anahtar, ciro ve kalıcı kural değişince alttaki içerik kaymaz`, async ({ page }) => {
  await page.setViewportSize({ width: genislik, height: 800 });
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  const ust = (sec: string) => page.locator(sec).first().evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY));
  const sonuc = '#pol-kz-bolum-3';
  const odeme = '.pol-kz-kartlar';
  // Oranlar bölümündeki anahtar.
  const once = await ust(sonuc);
  await bolum(page, 'Oranlar').getByRole('switch').click();
  expect(await ust(sonuc)).toBe(once);
  await bolum(page, 'Oranlar').getByRole('switch').click();
  // Oyun panelinde katkı ve ciro değişimi.
  const oyun = plani(page).locator('.pol-kz-oyun');
  const kpiOnce = await ust('[data-etkin] > .pol-kz-oyun-govde .pol-kz-kpi');
  const kartOnce = await ust(odeme);
  await oyun.getByRole('switch').click();
  expect(await ust('[data-etkin] > .pol-kz-oyun-govde .pol-kz-kpi')).toBe(kpiOnce);
  for (const ciro of ['20.000', '75.000', '150.000', '1.250.000', '5.000']) {
    await kutu(page, 'Örnek aylık ciro').fill(ciro);
    expect(await ust('[data-etkin] > .pol-kz-oyun-govde .pol-kz-kpi'), ciro).toBe(kpiOnce);
    expect(await ust(odeme), ciro).toBe(kartOnce);
  }
  // Örnek hesap kartındaki anahtar.
  const payOnce = await ust('.pol-kz-ornek-hesap + *');
  await plani(page).locator('.pol-kz-ornek-hesap').getByRole('switch').click();
  expect(await ust('.pol-kz-ornek-hesap + *')).toBe(payOnce);
  // Kalıcı kutusu işaretlenince alanın yeri korunur.
  const sonucOnce = await ust(sonuc);
  await plani(page).getByRole('checkbox', { name: 'Tanıştırma K2 ciro eşiği kalıcı kural', exact: true }).click();
  await expect(plani(page).locator('[data-yer-tutucu="tanistir.kotaEsik.1"]')).toBeVisible();
  expect(await ust(sonuc)).toBe(sonucOnce);
  await plani(page).getByRole('checkbox', { name: 'İlk satışta pay kalıcı kural', exact: true }).click();
  await expect(plani(page).locator('[data-yer-tutucu="paylasim.ilkSatis"]')).toBeVisible();
  expect(await ust(sonuc)).toBe(sonucOnce);
  expect(await tasmaYok(page)).toBe(true);
});

// Kullanıcı kararı 20 Kasım 2026 Cuma: iStoc kadrolu uzmanın kotaları aylık paket sayısıdır.
// 4 paket ve altı prim yoktur. 5 paket ve üstü K1 %5, 8 paket ve üstü K2 %7, 12 paket ve üstü K3 %10 olur.
// Ulaşılan kademenin oranı, satılan bütün yıllık paketlerin tutarına uygulanır.
test('iStoc kadrolu prim kademesi paket sayısına göre bütün satışa uygulanır', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = structuredClone(k.KAZANC_VARSAYILAN);
  expect(p.kadrolu.paketEsik).toEqual([5, 8, 12]);
  expect(p.kadrolu.paketOran).toEqual([0.05, 0.07, 0.1]);
  expect(p.kadrolu.ornekPaket).toBe(8);
  const kademe = { esik: p.kadrolu.paketEsik, oran: p.kadrolu.paketOran };
  expect(k.paketPrimi(kademe, 4, 100_000)).toEqual({ seviye: 0, oran: 0, ciro: 400_000, prim: 0 });
  expect(k.paketPrimi(kademe, 5, 100_000)).toEqual({ seviye: 1, oran: 0.05, ciro: 500_000, prim: 25_000 });
  expect(k.paketPrimi(kademe, 8, 100_000)).toEqual({ seviye: 2, oran: 0.07, ciro: 800_000, prim: 56_000 });
  expect(k.paketPrimi(kademe, 11, 100_000)).toMatchObject({ seviye: 2, prim: 77_000 });
  expect(k.paketPrimi(kademe, 12, 100_000)).toEqual({ seviye: 3, oran: 0.1, ciro: 1_200_000, prim: 120_000 });
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  const a = k.planliAyar({ ...VARSAYILAN_AYAR, marka: 'istoc' }, p);
  expect(a.kadroluPaket).toEqual(kademe);
  expect(a.kadroluSatis).toBe(8);
  const { rehberHesabi } = await import('../src/data/politikalar/hesap');
  const satir = (ad: string) => rehberHesabi('kadrolu', 'istoc', a).ornekler[0].satirlar.find((x) => x.ad === ad)?.deger;
  expect(satir('Ulaşılan kademe')).toBe('K2 (%7)');
  expect(satir('Örnek prim')).toContain('× %7 =');
  // Segika kadrolu uzmanın eski hesabı değişmez.
  const sg = k.planliAyar({ ...VARSAYILAN_AYAR, marka: 'segika' }, p);
  expect(rehberHesabi('kadrolu', 'segika', sg).ornekler[0].satirlar.some((x) => x.ad === 'Ulaşılan kademe')).toBe(false);
});

test('iStoc kadrolu sekmesi paket kademelerini gösterir ve örnek paket sayısıyla hesaplar', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('politikalar/?proje=istoc&rol=kadrolu');
  for (const [ad, deger] of [['K1 paket eşiği', '5'], ['K2 paket eşiği', '8'], ['K3 paket eşiği', '12'], ['K1 prim oranı', '%5'], ['K2 prim oranı', '%7'], ['K3 prim oranı', '%10'], ['Örnek aylık paket sayısı', '8']]) {
    await expect(kutu(page, ad)).toHaveValue(deger);
  }
  await expect(kutu(page, 'Kota üstü prim oranı')).toHaveCount(0);
  const seviye = plani(page).locator('[data-kazanc="kadrolu-paket-seviye"]');
  const prim = plani(page).locator('[data-kazanc="kadrolu-paket-prim"]');
  await expect(seviye).toHaveText('K2 (%7)');
  await expect(prim).toContainText('8 paket ×');
  await expect(prim).toContainText('× %7 =');
  await kutu(page, 'Örnek aylık paket sayısı').fill('4');
  await expect(seviye).toHaveText('Prim yok');
  await kutu(page, 'Örnek aylık paket sayısı').fill('12');
  await expect(seviye).toHaveText('K3 (%10)');
  await kutu(page, 'K3 prim oranı').fill('%12');
  await expect(seviye).toHaveText('K3 (%12)');
  // Rehberin iş sırası da yeni kuralı söyler.
  await page.getByRole('button', { name: 'Bütün çalışma koşullarını açın', exact: true }).click();
  await expect(page.locator('.pol-belge')).toContainText('Ulaşılan kademe');
  expect(await tasmaYok(page)).toBe(true);
});

test('Segika kadrolu sekmesinde paket kademesi yoktur', async ({ page }) => {
  await page.goto('politikalar/?proje=segika&rol=kadrolu');
  await expect(kutu(page, 'Maaş kotası oranı')).toHaveValue('%200');
  await expect(kutu(page, 'K1 paket eşiği')).toHaveCount(0);
});

// Kullanıcı kararları 20 Kasım 2026 Cuma: ciro, paket bedellerinin KDV hariç toplamıdır. Kurulum ücreti ciroya girmez.
// Aylık pakette pay en çok 12 ay sürer. Yıllık pakette bedelin tamamı satış ayının cirosudur ve pay bir kerede ödenir.
// Yıllık yenilemede 13. ile 24. ay arası düşük oran (%10) uygulanır. 25. aydan sonra pay yoktur.
// Tanıştıran en çok 3 ay pay alır. Koruma 90 gündür. Müşteri ayrılırsa pay durur, ödenmiş pay geri istenmez.
// Mevcut müşteri ücretsiz kullanım kazanır. Segika kadrolu primi kotayı aşan cironun %10'udur. Ağ hesabı kalkar.
test('20 Kasım kararları: ciro, ödeme süreleri, örnek hesap ve pay bölüşmesi', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  expect(k.ODEME_SURESI).toEqual({ tanistir: 3, aylik: 12, yillik: 24 });
  expect(p.kapatir.gecmis).toEqual([0.1]);
  expect(p.paylasim).toEqual({ sureAy: 3, ilkSatis: 'dus', kota: 'dus' });
  const kurallar = k.ODEME_KURALLARI.join(' ');
  for (const metin of ['KDV hariç', 'Kurulum ücreti ciroya girmez.', 'Pay en çok 12 ay sürer.', 'Pay satış ayında bir kerede ödenir.', '25. aydan sonra pay yoktur.', 'ilk 3 ay', 'Ödenmiş pay geri istenmez.']) {
    expect(kurallar).toContain(metin);
  }
  // Örnek hesap ulaşılan seviyenin oranını bütün ciroya uygular. 150.000 ₺ ciroda satışı kapatan %30 alır.
  const h = k.ornekHesap({ ...p, ornekCiro: 150_000 }, 'kapatir');
  expect(h.satirlar.map((r) => [r.oran, r.tutar])).toEqual([[0.3, 45_000], [0.1, 15_000]]);
  expect(h.toplam).toBe(540_000);
  const t = k.ornekHesap(p, 'tanistir');
  expect(t.satirlar.map((r) => [r.oran, r.tutar])).toEqual([[0.07, 3_500]]);
  expect(t.toplam).toBe(10_500);
  // K1 tamamlanmazsa yıllık yenilemede pay yoktur.
  expect(k.ornekHesap({ ...p, ornekCiro: 20_000 }, 'kapatir').satirlar[1].tutar).toBe(0);
  // Pay bölüşmesi yalnız ilk 3 aydadır. Sonra yalnız satışı kapatan pay alır.
  expect(k.paylasim(p, 50_000)).toMatchObject({ tanistiranOran: 0.07, kapatanOran: 0.13, sonrakiOran: 0.2, yenilemeOran: 0.1 });
  // Segika kadrolu uzman kotayı aşan cironun %10'unu alır. Plan ve rehber aynı oranı kullanır.
  const s = k.projeVarsayilani('segika');
  expect(s.kadrolu.primOrani).toBe(0.1);
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  expect(k.planliAyar({ ...VARSAYILAN_AYAR, marka: 'segika' }, { ...s, kadrolu: { ...s.kadrolu, primOrani: 0.12 } }).kadroluPrim.segika).toBe(0.12);
});

test('20 Kasım kararları: rehberlerde eski ödeme kuralı, ağ hesabı ve 12 aylık koruma yoktur', async () => {
  const k = await import('../src/data/kazancPlani');
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  const { rehberHesabi } = await import('../src/data/politikalar/hesap');
  const akislar = {
    istoc: { cozum: await import('../src/data/politikaAkislari/istoc/cozum'), elci: await import('../src/data/politikaAkislari/istoc/elci') },
    segika: { cozum: await import('../src/data/politikaAkislari/segika/cozum'), elci: await import('../src/data/politikaAkislari/segika/elci') },
  };
  for (const proje of ['istoc', 'segika'] as const) {
    const a = k.planliAyar({ ...VARSAYILAN_AYAR, marka: proje }, k.projeVarsayilani(proje));
    for (const rol of ['cozum', 'elci'] as const) {
      const metin = JSON.stringify([akislar[proje][rol].akisOlustur(a), rehberHesabi(rol, proje, a)]);
      expect(metin, `${proje}/${rol}`).toContain('Pay en çok 12 ay sürer.');
      for (const eski of ['yıllık paket bedelinin', '60. gün', 'ağ kademesi', 'imzalı anlaşma söyler']) expect(metin, `${proje}/${rol}: ${eski}`).not.toContain(eski);
      expect(rehberHesabi(rol, proje, a).digerSurum).toEqual([]);
    }
  }
  const kosullar = readFileSync('src/data/kosullar.ts', 'utf8');
  expect(kosullar).not.toContain('12 ay boyunca ortak adına korunur');
  expect(kosullar).not.toContain('İade olursa komisyon geri alınır');
  expect(readFileSync('src/data/politikalar/hesap.ts', 'utf8')).not.toContain('İade olursa komisyon geri alınır');
});

test('20 Kasım kararları: plan ödeme kurallarını söyler, mevcut müşteri sekmesinde plan yoktur', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await expect(plani(page)).toContainText('Pay en çok 12 ay sürer.');
  await expect(plani(page)).toContainText('Kurulum ücreti ciroya girmez.');
  await expect(plani(page)).not.toContainText('48 ay');
  await expect(plani(page).locator('[data-sim="toplam"]')).toHaveCount(0);
  await expect(plani(page).getByRole('group', { name: 'Sonraki 4 yılın payı' })).toHaveCount(0);
  expect(await tasmaYok(page)).toBe(true);
  for (const proje of ['istoc', 'segika']) {
    await page.goto(`politikalar/?proje=${proje}&rol=tavsiye`);
    await expect(page.getByRole('button', { name: 'Bütün çalışma koşullarını açın', exact: true })).toBeVisible();
    await expect(plani(page)).toHaveCount(0);
  }
});

// Büyütülmüş yazıda anahtar yazıları ve seviye kutuları alt alta geçer. Normal yazıda 320 px genişlikte düzen değişmez.
test('anahtar ve seviye kutuları yalnız büyütülmüş yazıda alt alta geçer', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  const anahtar = bolum(page, 'Oranlar').locator('.pol-kz-anahtar-ad');
  const ust = (l: ReturnType<Page['locator']>) => l.evaluate((el) => Math.round(el.getBoundingClientRect().top));
  const sol = (l: ReturnType<Page['locator']>) => l.evaluate((el) => Math.round(el.getBoundingClientRect().left));
  const seviye = plani(page).locator('.pol-kz-merdiven-dugme');
  expect(await ust(anahtar.first())).toBe(await ust(anahtar.last()));
  expect(await sol(seviye.nth(1))).toBeGreaterThan(await sol(seviye.nth(0)));
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await expect.poll(() => ust(anahtar.last())).toBeGreaterThan(await ust(anahtar.first()));
  await expect.poll(() => sol(seviye.nth(1))).toBe(await sol(seviye.nth(0)));
  expect(await tasmaYok(page)).toBe(true);
});

// iStoc paket kademesi kalıcı kural olunca Parametreler penceresi aynı değeri düzenler.
test('paket eşiği kalıcı kural olunca pencerede doğru kutu açılır', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=kadrolu');
  await plani(page).getByRole('checkbox', { name: 'K1 paket eşiği kalıcı kural', exact: true }).click();
  await page.getByRole('button', { name: 'Parametreler', exact: true }).click();
  const pencere = page.getByRole('dialog', { name: 'Parametreler' });
  await expect(pencere.getByRole('textbox', { name: 'K1 paket eşiği', exact: true })).toHaveValue('5');
  await expect(pencere.getByRole('textbox', { name: 'Kota üstü prim oranı', exact: true })).toHaveCount(0);
});
