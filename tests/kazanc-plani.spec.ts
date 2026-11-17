import { expect, test } from './fixtures/persona';

// Kullanıcı kararı 16 Kasım 2026 Pazartesi: kâğıttaki kazanç planı. Persona fark etmez, herkes iş ortağıdır.
// Yalnız kadrolu uzman SGK'lı çalışandır ve maaş alır.

test('kazanç planının varsayılanları kâğıttaki planla aynıdır', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  expect(p.tanistir.taban).toBe(0.07);
  expect(p.tanistir.gecmis).toEqual([0.05, 0.02, 0.02, 0.01]);
  expect(p.kapatir.taban).toBe(0.15);
  expect(p.kapatir.kotaArtis).toEqual([0.1, 0.07, 0.05]);
  expect(p.kapatir.gecmis).toEqual([0.1, 0.07, 0.05, 0.02]);
  // Eşikler kâğıtta yazmıyor. Uydurulmaz.
  expect(p.tanistir.kotaEsik).toEqual([null, null, null]);
  expect(p.kapatir.kotaEsik).toEqual([null, null, null]);
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

test('yıllara yayılan komisyon 4 yıl sürer ve her yıl azalır', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  for (const tur of ['tanistir', 'kapatir'] as const) {
    const satirlar = k.yillaraKazanc(p, tur, 100_000);
    expect(satirlar).toHaveLength(4);
    expect(satirlar.map((s) => s.yil)).toEqual([1, 2, 3, 4]);
    for (let i = 1; i < 4; i++) expect(satirlar[i].oran).toBeLessThanOrEqual(satirlar[i - 1].oran);
  }
  expect(k.yillaraKazanc(p, 'kapatir', 100_000).map((s) => s.tutar)).toEqual([10_000, 7_000, 5_000, 2_000]);
  expect(k.yillaraKazanc(p, 'tanistir', 100_000).map((s) => s.tutar)).toEqual([5_000, 2_000, 2_000, 1_000]);
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

for (const proje of ['istoc', 'segika'] as const) {
  test(`${proje}: kazanç planı her oran için değiştirilebilir sayı kutusu gösterir`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`politikalar/?proje=${proje}&rol=cozum`);
    const plan = page.getByRole('region', { name: 'Kazanç planı' });
    await expect(plan).toBeVisible();
    await expect(plan).toContainText('Herkes iş ortağıdır.');
    const kutu = (ad: string) => plan.getByRole('textbox', { name: ad, exact: true });
    await expect(kutu('Tanıştırma taban oranı')).toHaveValue('%7');
    const tanistirGecmis = ['%5', '%2', '%2', '%1'];
    const kapatirGecmis = ['%10', '%7', '%5', '%2'];
    for (let yil = 1; yil <= 4; yil++) await expect(kutu(`Tanıştırma ${yil}. yıl komisyonu`)).toHaveValue(tanistirGecmis[yil - 1]);
    for (const k of ['K1', 'K2', 'K3']) await expect(kutu(`Tanıştırma ${k} ciro eşiği`)).toHaveValue('');
    // Satışı kapatma oranları kendi sekmesindedir.
    await plan.getByRole('tab', { name: 'Satışı kapatırsanız', exact: true }).click();
    for (let yil = 1; yil <= 4; yil++) await expect(kutu(`Satışı kapatma ${yil}. yıl komisyonu`)).toHaveValue(kapatirGecmis[yil - 1]);
    await expect(kutu('Satışı kapatma taban oranı')).toHaveValue('%15');
    await expect(kutu('Satışı kapatma K1 artışı')).toHaveValue('%10');
    await expect(kutu('Satışı kapatma K2 artışı')).toHaveValue('%7');
    await expect(kutu('Satışı kapatma K3 artışı')).toHaveValue('%5');
    await expect(plan).toContainText(/henüz belirlenmedi/i);
    // Okur oranı değiştirir. Örnek hesap hemen değişir. Değer yenilemeden sonra kalır.
    await kutu('Satışı kapatma taban oranı').fill('%20');
    await expect(plan.locator('[data-kazanc="kapatir-bu-yil"]')).toContainText('20.000 ₺');
    await page.reload();
    await page.getByRole('tab', { name: 'Satışı kapatırsanız', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Kazanç planı' }).getByRole('textbox', { name: 'Satışı kapatma taban oranı', exact: true })).toHaveValue('%20');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('iki projenin planı ayrı saklanır', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await page.getByRole('region', { name: 'Kazanç planı' }).getByRole('textbox', { name: 'Tanıştırma taban oranı', exact: true }).fill('%9');
  await page.goto('politikalar/?proje=segika&rol=cozum');
  await expect(page.getByRole('region', { name: 'Kazanç planı' }).getByRole('textbox', { name: 'Tanıştırma taban oranı', exact: true })).toHaveValue('%7');
});

test('kota eşiği girilince oran sırayla artar', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=elci');
  const plan = page.getByRole('region', { name: 'Kazanç planı' });
  await plan.getByRole('textbox', { name: 'Örnek yıllık ciro', exact: true }).fill('300.000');
  await plan.getByRole('tab', { name: 'Satışı kapatırsanız', exact: true }).click();
  await plan.getByRole('textbox', { name: 'Satışı kapatma K1 ciro eşiği', exact: true }).fill('100.000');
  await plan.getByRole('textbox', { name: 'Satışı kapatma K2 ciro eşiği', exact: true }).fill('250.000');
  await expect(plan.locator('[data-kazanc="kapatir-oran"]')).toHaveText('%32');
  await expect(plan.locator('[data-kazanc="kapatir-bu-yil"]')).toContainText('96.000 ₺');
});

test('kadrolu uzman sekmesi maaşı, kotayı ve SGK kaydını söyler', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=kadrolu');
  const plan = page.getByRole('region', { name: 'Kazanç planı' });
  await expect(plan).toContainText('SGK');
  await expect(plan).not.toContainText('Herkes iş ortağıdır.');
  await expect(plan).toContainText('50.000 ₺ ile 60.000 ₺');
  await expect(plan.getByRole('textbox', { name: 'Aylık maaş', exact: true })).toHaveValue('50.000');
  await expect(plan.getByRole('textbox', { name: 'Kota oranı', exact: true })).toHaveValue('%250');
  await expect(plan.locator('[data-kazanc="kadrolu-kota"]')).toContainText('125.000 ₺');
  await expect(plan.getByRole('textbox', { name: 'Kota üstü prim oranı', exact: true })).toHaveValue('');
});

test('satışta katkı seçiminde orta seçenek yoktur', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await page.getByRole('button', { name: 'Görevi ve çalışma koşullarını görün', exact: true }).click();
  const grup = page.getByRole('group', { name: 'Satışta katkınız' });
  await expect(grup.getByRole('button')).toHaveCount(2);
  await expect(grup).not.toContainText('Ürün');
});

// Kullanıcı kararı 17 Kasım 2026 Salı: iki katkı türü sekme olur. Bir sekme açıkken diğerinin içeriği görünmez.
for (const proje of ['istoc', 'segika'] as const) test(`${proje}: katkı türleri sekmedir ve klavyeyle değişir`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`politikalar/?proje=${proje}&rol=elci`);
  const plan = page.getByRole('region', { name: 'Kazanç planı' });
  const liste = plan.getByRole('tablist', { name: 'Satıştaki katkınız' });
  const tanistir = liste.getByRole('tab', { name: 'Yalnız tanıştırırsanız', exact: true });
  const kapatir = liste.getByRole('tab', { name: 'Satışı kapatırsanız', exact: true });
  await expect(tanistir).toHaveAttribute('aria-selected', 'true');
  await expect(kapatir).toHaveAttribute('aria-selected', 'false');
  const kutu = (ad: string) => plan.getByRole('textbox', { name: ad, exact: true });
  await expect(kutu('Tanıştırma taban oranı')).toBeVisible();
  await expect(kutu('Satışı kapatma taban oranı')).toHaveCount(0);
  await expect(plan.getByRole('tabpanel')).toHaveCount(1);
  await tanistir.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(tanistir).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(kapatir).toBeFocused();
  await expect(kapatir).toHaveAttribute('aria-selected', 'true');
  await expect(kutu('Satışı kapatma taban oranı')).toBeVisible();
  await expect(kutu('Tanıştırma taban oranı')).toHaveCount(0);
  // Sitedeki öteki sekmeler gibi Home ve End odağı taşır. Enter sekmeyi açar.
  await page.keyboard.press('Home');
  await expect(tanistir).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(tanistir).toHaveAttribute('aria-selected', 'true');
  await expect(kutu('Tanıştırma taban oranı')).toBeVisible();
  await page.keyboard.press('End');
  await expect(kapatir).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(kapatir).toHaveAttribute('aria-selected', 'true');
  const odak = await kapatir.evaluate((el) => {
    const s = getComputedStyle(el);
    return { outline: s.outlineStyle, shadow: s.boxShadow };
  });
  expect(odak).toEqual({ outline: 'none', shadow: 'none' });
  await tanistir.click();
  await expect(kutu('Tanıştırma taban oranı')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

// Kullanıcı kararı 17 Kasım 2026 Salı: her katkı sekmesinin K1, K2 ve K3 eşiği ayrıdır. Başlangıç değeri varsayılandır.
for (const proje of ['istoc', 'segika'] as const) test(`${proje}: iki katkı sekmesinin kota eşikleri birbirinden ayrıdır`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`politikalar/?proje=${proje}&rol=elci`);
  const plan = page.getByRole('region', { name: 'Kazanç planı' });
  const sekme = (ad: string) => plan.getByRole('tab', { name: ad, exact: true });
  const kutu = (ad: string) => plan.getByRole('tabpanel').getByRole('textbox', { name: ad, exact: true });
  for (const k of ['K1', 'K2', 'K3']) await expect(kutu(`Tanıştırma ${k} ciro eşiği`)).toHaveValue('');
  await kutu('Tanıştırma K1 ciro eşiği').fill('100.000');
  await sekme('Satışı kapatırsanız').click();
  for (const k of ['K1', 'K2', 'K3']) await expect(kutu(`Satışı kapatma ${k} ciro eşiği`)).toHaveValue('');
  await kutu('Satışı kapatma K1 ciro eşiği').fill('250.000');
  await sekme('Yalnız tanıştırırsanız').click();
  await expect(kutu('Tanıştırma K1 ciro eşiği')).toHaveValue('100.000');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Kazanç planı' }).getByRole('textbox', { name: 'Tanıştırma K1 ciro eşiği', exact: true })).toHaveValue('100.000');
  await page.getByRole('tab', { name: 'Satışı kapatırsanız', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Satışı kapatma K1 ciro eşiği', exact: true })).toHaveValue('250.000');
});

test('kota eşiği her katkı türünde ayrı hesaplanır', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = structuredClone(k.KAZANC_VARSAYILAN);
  expect(p.tanistir.kotaEsik).toEqual([null, null, null]);
  expect(p.kapatir.kotaEsik).toEqual([null, null, null]);
  p.kapatir.kotaEsik = [100_000, null, null];
  expect(k.katkiOrani(p, 'kapatir', 100_000)).toMatchObject({ kota: 1 });
  expect(k.katkiOrani(p, 'tanistir', 100_000)).toMatchObject({ kota: 0 });
  // Eski kayıtta tek eşik listesi vardı. Bu liste iki katkı türüne de geçer.
  const eski = k.planOku({ kotaEsik: [1, 2, 3] });
  expect([eski.tanistir.kotaEsik, eski.kapatir.kotaEsik]).toEqual([[1, 2, 3], [1, 2, 3]]);
});

// Kullanıcı kararı 17 Kasım 2026 Salı: tanıştıran ile satışı kapatan farklı kişiyse pay bölüşmesi seçenektir.
// Yönetici seçer. Her soruda varsayılan “Ahmet'in payı Mehmet'in payından düşülür” seçeneğidir. Bu seçenek şirketi zarardan korur.
test('pay bölüşme hesabı seçime ve kutulardaki oranlara göre yapılır', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = structuredClone(k.KAZANC_VARSAYILAN);
  expect(p.paylasim).toEqual({ sureAy: 2, ilkSatis: 'dus', yillar: 'dus', kota: 'dus' });
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
  q.tanistir.kotaArtis = [0.01, 0, 0];
  q.kapatir.kotaEsik = [50_000, null, null];
  expect(k.paylasim(q, 100_000)).toMatchObject({ tanistiranOran: 0.08, kapatanOran: 0.17 });
  q.paylasim.kota = 'tam';
  expect(k.paylasim(q, 100_000)).toMatchObject({ tanistiranOran: 0.08, kapatanOran: 0.18 });
  expect(k.planOku({ paylasim: { sureAy: 7, ilkSatis: 'x' } }).paylasim).toEqual({ sureAy: 2, ilkSatis: 'dus', yillar: 'dus', kota: 'dus' });
  expect(k.planOku({ paylasim: { sureAy: 12, kota: 'tam' } }).paylasim).toMatchObject({ sureAy: 12, kota: 'tam' });
});

test('kalıcı kural JSON yalnız işaretli değerleri içerir', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = structuredClone(k.KAZANC_VARSAYILAN);
  expect(k.kaliciJson(p, 'istoc', new Date(2026, 10, 17)).kurallar).toEqual([]);
  p.kalici = ['kapatir.taban', 'paylasim.ilkSatis', 'paylasim.sureAy', 'olmayan'];
  p.paylasim.ilkSatis = 'tam';
  const j = k.kaliciJson(p, 'segika', new Date(2026, 10, 17));
  expect(j).toMatchObject({ tur: 'kazanc-plani-kalici-kurallar', surum: 1, proje: 'segika', gorunum: 'Segika', tarih: '2026-11-17', tarihMetni: '17 Kasım 2026 Salı' });
  expect(j.kurallar).toEqual([
    { id: 'kapatir.taban', ad: 'Satışı kapatma taban oranı', deger: 0.15, gosterim: '%15', gorunum: 'Segika', tarih: '2026-11-17' },
    { id: 'paylasim.sureAy', ad: 'Tanıştırmanın geçerlilik süresi', deger: 2, gosterim: '2 ay', gorunum: 'Segika', tarih: '2026-11-17' },
    { id: 'paylasim.ilkSatis', ad: 'İlk satışta pay', deger: 'tam', gosterim: 'Şirket ikisine de tam öder', gorunum: 'Segika', tarih: '2026-11-17' },
  ]);
});

for (const proje of ['istoc', 'segika'] as const) test(`${proje}: pay bölüşmesi seçilir ve kalıcı kurallar JSON olarak alınır`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  let disaGiden = 0;
  page.on('request', (r) => { if (/kalici|kazanc-plani/.test(`${r.url()} ${r.postData() ?? ''}`)) disaGiden++; });
  await page.goto(`politikalar/?proje=${proje}&rol=cozum`);
  const bolum = page.getByRole('region', { name: 'Tanıştıran ve satışı kapatan farklı kişiyse' });
  await expect(bolum).toContainText("Tanıştırma CRM'e kaydedilir.");
  await expect(bolum).not.toContainText('henüz karar verilmedi');
  const sure = bolum.getByRole('radiogroup', { name: 'Tanıştırmanın geçerlilik süresi' });
  await expect(sure.getByRole('radio')).toHaveText(['1 ay', '2 ay', '3 ay', '4 ay', '5 ay', '6 ay', '8 ay', '10 ay', '12 ay']);
  await expect(bolum).toContainText('Tanıştırma 2 ay geçerlidir.');
  // Varsayılan şirketi zarardan korur.
  for (const soru of ['İlk satışta pay', 'Sonraki 4 yılın payı', 'Kota artışında pay']) {
    await expect(bolum.getByRole('group', { name: soru }).getByRole('button', { name: "Ahmet'in payı Mehmet'in payından düşülür", exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(bolum.locator('[data-paylasim="tanistiran"]')).toHaveText('100.000 ₺ × %7 = 7.000 ₺');
  await expect(bolum.locator('[data-paylasim="kapatan"]')).toHaveText('100.000 ₺ × %8 = 8.000 ₺');
  await expect(bolum.locator('[data-paylasim="toplam"]')).toHaveText('15.000 ₺');
  await expect(bolum.locator('[data-paylasim="yillar"] li').first()).toHaveText('1. yılda Ahmet %5, Mehmet %5 alır.');
  // İkisine de tam ödeme seçilince toplam artar.
  const ilk = bolum.getByRole('group', { name: 'İlk satışta pay' });
  await ilk.getByRole('button', { name: 'Şirket ikisine de tam öder', exact: true }).click();
  await expect(bolum.locator('[data-paylasim="kapatan"]')).toHaveText('100.000 ₺ × %15 = 15.000 ₺');
  await expect(bolum.locator('[data-paylasim="toplam"]')).toHaveText('22.000 ₺');
  // Klavye ile seçim.
  const yillar = bolum.getByRole('group', { name: 'Sonraki 4 yılın payı' });
  await yillar.getByRole('button', { name: 'Şirket ikisine de tam öder', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(bolum.locator('[data-paylasim="yillar"] li').first()).toHaveText('1. yılda Ahmet %5, Mehmet %10 alır.');
  await sure.getByRole('radio', { name: '2 ay', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(bolum).toContainText('Tanıştırma 3 ay geçerlidir.');
  await page.keyboard.press('End');
  await expect(bolum).toContainText('Tanıştırma 12 ay geçerlidir.');
  await page.keyboard.press('Home');
  await expect(bolum).toContainText('Tanıştırma 1 ay geçerlidir.');
  await page.keyboard.press('ArrowLeft');
  await expect(bolum).toContainText('Tanıştırma 12 ay geçerlidir.');
  // Kalıcı kural kutuları.
  const plan = page.getByRole('region', { name: 'Kazanç planı' });
  await plan.getByRole('checkbox', { name: 'İlk satışta pay kalıcı kural', exact: true }).check();
  await plan.getByRole('checkbox', { name: 'Tanıştırmanın geçerlilik süresi kalıcı kural', exact: true }).check();
  await plan.getByRole('checkbox', { name: 'Tanıştırma taban oranı kalıcı kural', exact: true }).check();
  await plan.getByRole('tab', { name: 'Satışı kapatırsanız', exact: true }).click();
  await plan.getByRole('checkbox', { name: 'Satışı kapatma K1 ciro eşiği kalıcı kural', exact: true }).check();
  await plan.getByRole('button', { name: 'Kalıcı kuralları JSON olarak al', exact: true }).click();
  const metin = plan.getByRole('textbox', { name: 'Kalıcı kurallar JSON', exact: true });
  const json = JSON.parse(await metin.inputValue());
  expect(json).toMatchObject({ proje, gorunum: proje === 'istoc' ? 'iStoc' : 'Segika' });
  expect(json.kurallar.map((k: { id: string; deger: unknown }) => [k.id, k.deger])).toEqual([
    ['tanistir.taban', 0.07], ['kapatir.kotaEsik.0', null], ['paylasim.sureAy', 12], ['paylasim.ilkSatis', 'tam'],
  ]);
  await expect(plan.getByRole('button', { name: "JSON'u kopyalayın", exact: true })).toBeVisible();
  await expect(plan.getByRole('button', { name: 'JSON dosyasını indirin', exact: true })).toBeVisible();
  // İşaret yenilemeden sonra kalır. JSON hiçbir sunucuya gönderilmez.
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'İlk satışta pay kalıcı kural', exact: true })).toBeChecked();
  expect(disaGiden).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
