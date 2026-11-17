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
  expect(p.tanistir.taban).toBe(0.07);
  // Kullanıcı kararı 17 Kasım 2026 Salı: tanıştırmanın varsayılanları. Satış ayı 1. aydır. Liste 13. aydan başlar.
  expect(p.tanistir.kotaEsik).toEqual([30_000, 60_000, 100_000]);
  expect(p.tanistir.kotaArtis).toEqual([0.1, 0.07, 0.05]);
  expect(p.tanistir.gecmis).toEqual([0.05, 0.025, 0, 0]);
  // Kâğıttaki satışı kapatan: cari ay %15, K1 ile %10 eklenir, sonra %10, %7 ve %5. 48. aydan sonra pay yoktur.
  expect(p.kapatir.taban).toBe(0.15);
  expect(p.kapatir.kotaArtis).toEqual([0.1, 0.07, 0.05]);
  expect(p.kapatir.gecmis).toEqual([0.1, 0.07, 0.05, 0]);
  expect(p.kapatir.kotaEsik).toEqual([null, null, null]);
  expect(p.ornekCiro).toBe(40_000);
  expect(p.paylasim.sureAy).toBe(6);
  expect(p.kadrolu.maas).toBe(50_000);
  // 50.000 ₺ maaşta kota 125.000 ₺ ciro olur.
  expect(k.kadroluKota(p)).toBe(125_000);
  expect(p.kadrolu.primOrani).toBeNull();
});

test('kota eşiği yoksa taban oran, eşik aşılınca artışlar sırayla eklenir', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  expect(k.katkiOrani(p, 'kapatir', 1_000_000)).toEqual({ oran: 0.15, kota: 0 });
  const esikli = { ...p, kapatir: { ...p.kapatir, kotaEsik: [100_000, 250_000, 500_000] as [number, number, number] } };
  expect(k.katkiOrani(esikli, 'kapatir', 99_999)).toEqual({ oran: 0.15, kota: 0 });
  expect(k.katkiOrani(esikli, 'kapatir', 100_000).kota).toBe(1);
  expect(k.katkiOrani(esikli, 'kapatir', 100_000).oran).toBeCloseTo(0.25);
  expect(k.katkiOrani(esikli, 'kapatir', 300_000).oran).toBeCloseTo(0.32);
  expect(k.katkiOrani(esikli, 'kapatir', 600_000)).toMatchObject({ kota: 3 });
  expect(k.katkiOrani(esikli, 'kapatir', 600_000).oran).toBeCloseTo(0.37);
  // Eşikler sırayla aranır. K1 boşsa K2 de uygulanmaz.
  expect(k.katkiOrani({ ...p, kapatir: { ...p.kapatir, kotaEsik: [null, 1, 1] } }, 'kapatir', 10).kota).toBe(0);
});

test('13. aydan sonraki pay 12 aylık dönemlerle azalır', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  for (const tur of ['tanistir', 'kapatir'] as const) {
    const satirlar = k.yillaraKazanc(p, tur, 100_000);
    expect(satirlar.map((s) => s.donem)).toEqual(['13. ay ile 24. ay arası', '25. ay ile 36. ay arası', '37. ay ile 48. ay arası', '49. ay ile 60. ay arası']);
    for (let i = 1; i < 4; i++) expect(satirlar[i].oran).toBeLessThanOrEqual(satirlar[i - 1].oran);
  }
  expect(k.yillaraKazanc(p, 'kapatir', 100_000).map((s) => s.tutar)).toEqual([10_000, 7_000, 5_000, 0]);
  expect(k.yillaraKazanc(p, 'tanistir', 100_000).map((s) => s.tutar)).toEqual([5_000, 2_500, 0, 0]);
});

// Kullanıcı kararı 17 Kasım 2026 Salı: kişi ilk 12 ayda K1 kotasını tamamlamazsa 13. aydan sonra pay almaz.
test('kota kuralı: K1 tamamlanmazsa 13. aydan sonra pay yoktur', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  expect(k.kotaTamam(p, 'tanistir', 29_999)).toBe(false);
  expect(k.kotaTamam(p, 'tanistir', 30_000)).toBe(true);
  expect(k.yillaraKazanc(p, 'tanistir', 20_000).map((s) => s.tutar)).toEqual([0, 0, 0, 0]);
  // K1 eşiği boşsa kural ölçülemez. Örnek kotayı tamamlanmış sayar.
  expect(k.kotaTamam(p, 'kapatir', 1)).toBe(true);
  // Kâğıttaki örnek: aylık ciro 40.000 ₺, toplam 121.600 ₺.
  const h = k.ornekHesap(p, 'kapatir');
  expect(h.satirlar.map((r) => r.tutar)).toEqual([6_000, 4_000, 6_000, 48_000, 33_600, 24_000]);
  expect(h.toplam).toBe(121_600);
  const dusuk = { ...structuredClone(p), ornekCiro: 20_000 };
  dusuk.kapatir.kotaEsik = [30_000, null, null];
  expect(k.ornekHesap(dusuk, 'kapatir').toplam).toBe(6_000);
});

test('Segika başlangıç planı yöneticinin JSON çıktısındaki kalıcı kurallarla açılır', async () => {
  const k = await import('../src/data/kazancPlani');
  const s = k.projeVarsayilani('segika');
  expect(s.kalici).toHaveLength(19);
  expect(s.kalici).toEqual(expect.arrayContaining(['tanistir.taban', 'kapatir.taban', 'paylasim.sureAy', 'paylasim.ilkSatis']));
  expect([s.tanistir.kotaEsik, s.kapatir.kotaEsik]).toEqual([[30_000, 70_000, 100_000], [30_000, 70_000, 100_000]]);
  expect(k.projeVarsayilani('istoc').kalici).toEqual([]);
  // Tarayıcıdaki kayıt kalıcı listesini taşır. Yönetici bir kuralı kalıcıdan çıkarabilir.
  expect(k.planOku({ kalici: ['tanistir.taban'] }, 'segika').kalici).toEqual(['tanistir.taban']);
});

test('plan rehberin hesap ayarına yansır ve orta seçenek kalkar', async () => {
  const k = await import('../src/data/kazancPlani');
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  const a = k.planliAyar({ ...VARSAYILAN_AYAR, oncuSeviye: 'B', elciSeviye: 'B', cozumSeviye: 'B' }, k.KAZANC_VARSAYILAN);
  expect(a.oran).toEqual({ A: 0.07, B: 0.15, C: 0.15 });
  expect([a.oncuSeviye, a.elciSeviye, a.cozumSeviye]).toEqual(['C', 'C', 'C']);
  expect(a.maas).toBe(50_000);
  expect(a.maas * a.kotaCarpan * (1 + a.kotaEk)).toBe(125_000);
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
  expect(p.kapatir.kotaEsik).toEqual([null, null, null]);
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
  expect(p.paylasim).toEqual({ sureAy: 6, ilkSatis: 'dus', yillar: 'dus', kota: 'dus' });
  // Hesap kutulardaki oranlarla yapılır. Bu denemede eşikler boştur ve eski yıllık oranlar girilir.
  p.tanistir.kotaEsik = [null, null, null];
  p.tanistir.kotaArtis = [0, 0, 0];
  p.tanistir.gecmis = [0.05, 0.02, 0.02, 0.01];
  p.kapatir.gecmis = [0.1, 0.07, 0.05, 0.02];
  expect(k.SURE_SECENEKLERI).toEqual([1, 2, 3, 4, 5, 6, 8, 10, 12]);
  expect(k.paylasim(p, 100_000)).toMatchObject({ tanistiranOran: 0.07, kapatanOran: 0.08, tanistiran: 7_000, kapatan: 8_000, toplam: 15_000 });
  expect(k.paylasim(p, 100_000).yillar.map((y) => [y.tanistiran, y.kapatan])).toEqual([[0.05, 0.05], [0.02, 0.05], [0.02, 0.03], [0.01, 0.01]]);
  p.paylasim.ilkSatis = 'tam';
  expect(k.paylasim(p, 100_000)).toMatchObject({ tanistiran: 7_000, kapatan: 15_000, toplam: 22_000 });
  p.paylasim.yillar = 'tam';
  expect(k.paylasim(p, 100_000).yillar.map((y) => [y.tanistiran, y.kapatan])).toEqual([[0.05, 0.1], [0.02, 0.07], [0.02, 0.05], [0.01, 0.02]]);
  // Kota artışı: iki katkı türü de K1'e ulaşır. Düşmede tanıştıranın artışı kapatanın artışından düşülür.
  const q = structuredClone(k.KAZANC_VARSAYILAN);
  q.tanistir.kotaEsik = [50_000, null, null];
  q.tanistir.taban = 0.07;
  q.tanistir.kotaArtis = [0.01, 0, 0];
  q.kapatir.kotaEsik = [50_000, null, null];
  expect(k.paylasim(q, 100_000)).toMatchObject({ tanistiranOran: 0.08, kapatanOran: 0.17 });
  q.paylasim.kota = 'tam';
  expect(k.paylasim(q, 100_000)).toMatchObject({ tanistiranOran: 0.08, kapatanOran: 0.18 });
  expect(k.planOku({ paylasim: { sureAy: 7, ilkSatis: 'x' } }).paylasim).toEqual({ sureAy: 6, ilkSatis: 'dus', yillar: 'dus', kota: 'dus' });
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
    { id: 'paylasim.sureAy', ad: 'Tanıştırmanın geçerlilik süresi', deger: 6, gosterim: '6 ay', gorunum: 'Segika', tarih: '2026-11-17' },
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
  await expect(kutu(page, 'Tanıştırma taban oranı')).toHaveValue('%7');
  await expect(kutu(page, 'Tanıştırma K1 ciro eşiği')).toHaveValue('30.000');
  await expect(kutu(page, 'Tanıştırma 13. ay ile 24. ay arası komisyonu')).toHaveValue('%5');
  // Grup içindeki görünür ad kısadır. Tam ad ekran okuyucuya gider.
  await expect(oranlar.locator('[data-etkin] label', { hasText: /^K1 eşiği/ })).toBeVisible();
  await expect(kutu(page, 'Satışı kapatma taban oranı')).toHaveCount(0);
  await anahtar.click();
  await expect(anahtar).toHaveAttribute('aria-checked', 'true');
  await expect(kutu(page, 'Tanıştırma taban oranı')).toHaveCount(0);
  await expect(kutu(page, 'Satışı kapatma taban oranı')).toHaveValue('%15');
  for (const k of ['K1', 'K2', 'K3']) await expect(kutu(page, `Satışı kapatma ${k} ciro eşiği`)).toHaveValue('');
  await expect(kutu(page, 'Satışı kapatma 37. ay ile 48. ay arası komisyonu')).toHaveValue('%5');
  await kutu(page, 'Satışı kapatma taban oranı').fill('%20');
  await expect(plani(page).locator('[data-kazanc="kapatir-bu-yil"]')).toHaveText('40.000 ₺ × %20 = 8.000 ₺');
  await page.reload();
  await bolum(page, 'Oranlar').getByRole('switch').click();
  await expect(kutu(page, 'Satışı kapatma taban oranı')).toHaveValue('%20');
  expect(await tasmaYok(page)).toBe(true);
});

test('Segika: kalıcı kurallar ana ekranda görünmez, öteki değerler görünür', async ({ page }) => {
  await page.goto('politikalar/?proje=segika&rol=cozum');
  await expect(kutu(page, 'Tanıştırma taban oranı')).toHaveCount(0);
  await expect(kutu(page, 'Tanıştırma K1 ciro eşiği')).toHaveValue('30.000');
  await expect(bolum(page, 'Kararlar')).toContainText('Bütün kararlar kalıcı kuraldır.');
  await expect(plani(page).getByRole('group', { name: 'İlk satışta pay' })).toHaveCount(0);
});

test('iki projenin planı ayrı saklanır', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await kutu(page, 'Tanıştırma K1 ciro eşiği').fill('50.000');
  await page.goto('politikalar/?proje=segika&rol=cozum');
  await expect(kutu(page, 'Tanıştırma K1 ciro eşiği')).toHaveValue('30.000');
});

test('kota eşiği girilince oran sırayla artar', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=elci');
  await kutu(page, 'Örnek aylık ciro').fill('300.000');
  await bolum(page, 'Oranlar').getByRole('switch').click();
  await kutu(page, 'Satışı kapatma K1 ciro eşiği').fill('100.000');
  await kutu(page, 'Satışı kapatma K2 ciro eşiği').fill('250.000');
  await expect(plani(page).locator('[data-kazanc="kapatir-oran"]')).toHaveText('%32');
  await expect(plani(page).locator('[data-kazanc="kapatir-bu-yil"]')).toContainText('96.000 ₺');
});

test('kadrolu uzman sekmesi maaşı, kotayı ve SGK kaydını söyler', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=kadrolu');
  await expect(plani(page)).toContainText('SGK');
  await expect(plani(page)).not.toContainText('Herkes iş ortağıdır.');
  await expect(plani(page)).toContainText('50.000 ₺ ile 60.000 ₺');
  await expect(kutu(page, 'Aylık maaş')).toHaveValue('50.000');
  await expect(kutu(page, 'Kota oranı')).toHaveValue('%250');
  await expect(kutu(page, 'Kota üstü prim oranı')).toHaveValue('');
  await expect(plani(page).locator('[data-kazanc="kadrolu-kota"]')).toContainText('125.000 ₺');
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
  await expect(kutu(page, 'Satışı kapatma K1 ciro eşiği')).toHaveValue('');
  await kutu(page, 'Satışı kapatma K1 ciro eşiği').fill('250.000');
  await anahtar.click();
  await expect(kutu(page, 'Tanıştırma K1 ciro eşiği')).toHaveValue('100.000');
  await page.reload();
  await expect(kutu(page, 'Tanıştırma K1 ciro eşiği')).toHaveValue('100.000');
  await bolum(page, 'Oranlar').getByRole('switch').click();
  await expect(kutu(page, 'Satışı kapatma K1 ciro eşiği')).toHaveValue('250.000');
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
  await expect(oyun.locator('[data-sim="toplam"]')).toHaveText('225.600 ₺');
  await expect(oyun.locator('[data-sim="hedef"]')).toContainText('K2 kotasına 30.000 ₺ kaldı.');
  await expect(oyun.locator('[data-sim="hedef"]')).toContainText('K2 eşiğinde aylık kazancınız 22.400 ₺ olur.');
  await expect(oyun.getByRole('progressbar', { name: 'K2 hedefine ilerleme' })).toHaveAttribute('aria-valuenow', '57');
  await expect(oyun.getByRole('list', { name: 'Kota seviyeleri' }).locator('[aria-current="step"]')).toContainText('K1');
  await expect(oyun.locator('tr[aria-current="true"] th')).toContainText('K1');
  await panel.getByRole('button', { name: /K2 eşiği:/ }).click();
  await expect(oyun.locator('[data-sim="bu-ay"]')).toHaveText('22.400 ₺');
  await expect(oyun.locator('tr[aria-current="true"] th')).toContainText('K2');
  // Kota kuralı: K1 tamamlanmazsa 13. aydan sonra pay yoktur.
  await kutu(page, 'Örnek aylık ciro').fill('20.000');
  await expect(oyun.locator('[data-sim="devam"]')).not.toHaveAttribute('data-acik', '');
  await expect(oyun.locator('[data-sim="devam"]')).toContainText('K1 kotası tamamlanınca açılır.');
  await expect(oyun.locator('[data-sim="toplam"]')).toHaveText('36.000 ₺');
  // Kaydırıcı ciroyu değiştirir.
  await panel.getByRole('slider', { name: 'Aylık ciroyu kaydırarak seçin' }).fill('70000');
  await expect(oyun.locator('[data-sim="bu-ay"]')).toHaveText('22.400 ₺');
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
  await expect(pencere.getByRole('button', { name: /kalıcı kuraldan çıkarın$/ })).toHaveCount(19);
  // Pencere tam ekran değildir: genişlik en çok %80, yükseklik en çok %90.
  const boyut = await page.locator('.pol-kz-pencere').evaluate((el) => { const r = el.getBoundingClientRect(); return [r.width / innerWidth, r.height / innerHeight, el.scrollHeight > el.clientHeight]; });
  expect(boyut[0]).toBeLessThanOrEqual(0.81);
  expect(boyut[1]).toBeLessThanOrEqual(0.91);
  expect(boyut[2]).toBe(true);
  const json = JSON.parse(await pencere.getByRole('textbox', { name: 'Kazanç planı JSON' }).inputValue());
  expect(json).toMatchObject({ proje: 'segika', gorunum: 'Segika', surum: 2 });
  expect(json.kurallar).toHaveLength(19);
  expect(json.degerler.find((d: { id: string }) => d.id === 'kapatir.gecmis.3')).toMatchObject({ kalici: false });
  // Kalıcı değer pencerede değiştirilir. Sonuç hemen değişir.
  await pencere.getByRole('group', { name: 'İlk satışta pay' }).getByRole('button', { name: 'Şirket ikisine de tam öder', exact: true }).click();
  // Kalıcı kuraldan çıkan değer ana ekrana döner.
  await pencere.getByRole('button', { name: 'İlk satışta pay: kalıcı kuraldan çıkarın', exact: true }).click();
  await expect(pencere.getByRole('button', { name: /kalıcı kuraldan çıkarın$/ })).toHaveCount(18);
  await page.keyboard.press('Escape');
  await expect(dugme).toBeFocused();
  await expect(plani(page).getByRole('group', { name: 'İlk satışta pay' }).getByRole('button', { name: 'Şirket ikisine de tam öder', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(plani(page).locator('[data-paylasim="toplam"]')).toHaveText('12.800 ₺');
  // Ana ekranda işaretlenen değer pencereye taşınır.
  // Kutu işaretlenince alan ana ekrandan kalkar. Bu yüzden check() yerine tıklanır.
  await plani(page).getByRole('checkbox', { name: 'İlk satışta pay kalıcı kural', exact: true }).click();
  await expect(plani(page).getByRole('group', { name: 'İlk satışta pay' })).toHaveCount(0);
  await page.reload();
  await expect(plani(page).getByRole('group', { name: 'İlk satışta pay' })).toHaveCount(0);
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
