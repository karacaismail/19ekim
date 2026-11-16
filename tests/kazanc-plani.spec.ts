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
  expect(p.kotaEsik).toEqual([null, null, null]);
  expect(p.kadrolu.maas).toBe(50_000);
  // 50.000 ₺ maaşta kota 125.000 ₺ ciro olur.
  expect(k.kadroluKota(p)).toBe(125_000);
  expect(p.kadrolu.primOrani).toBeNull();
});

test('kota eşiği yoksa taban oran, eşik aşılınca artışlar sırayla eklenir', async () => {
  const k = await import('../src/data/kazancPlani');
  const p = k.KAZANC_VARSAYILAN;
  expect(k.katkiOrani(p, 'kapatir', 1_000_000)).toEqual({ oran: 0.15, kota: 0 });
  const esikli = { ...p, kotaEsik: [100_000, 250_000, 500_000] as [number, number, number] };
  expect(k.katkiOrani(esikli, 'kapatir', 99_999)).toEqual({ oran: 0.15, kota: 0 });
  expect(k.katkiOrani(esikli, 'kapatir', 100_000).kota).toBe(1);
  expect(k.katkiOrani(esikli, 'kapatir', 100_000).oran).toBeCloseTo(0.25);
  expect(k.katkiOrani(esikli, 'kapatir', 300_000).oran).toBeCloseTo(0.32);
  expect(k.katkiOrani(esikli, 'kapatir', 600_000)).toMatchObject({ kota: 3 });
  expect(k.katkiOrani(esikli, 'kapatir', 600_000).oran).toBeCloseTo(0.37);
  // Eşikler sırayla aranır. K1 boşsa K2 de uygulanmaz.
  expect(k.katkiOrani({ ...p, kotaEsik: [null, 1, 1] }, 'kapatir', 10).kota).toBe(0);
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
    await page.goto(`politikalar/?proje=${proje}&rol=oncu`);
    const plan = page.getByRole('region', { name: 'Kazanç planı' });
    await expect(plan).toBeVisible();
    await expect(plan).toContainText('Herkes iş ortağıdır.');
    const kutu = (ad: string) => plan.getByRole('textbox', { name: ad, exact: true });
    await expect(kutu('Tanıştırma taban oranı')).toHaveValue('%7');
    await expect(kutu('Satışı kapatma taban oranı')).toHaveValue('%15');
    await expect(kutu('Satışı kapatma K1 artışı')).toHaveValue('%10');
    await expect(kutu('Satışı kapatma K2 artışı')).toHaveValue('%7');
    await expect(kutu('Satışı kapatma K3 artışı')).toHaveValue('%5');
    const tanistirGecmis = ['%5', '%2', '%2', '%1'];
    const kapatirGecmis = ['%10', '%7', '%5', '%2'];
    for (let yil = 1; yil <= 4; yil++) {
      await expect(kutu(`Tanıştırma ${yil}. yıl komisyonu`)).toHaveValue(tanistirGecmis[yil - 1]);
      await expect(kutu(`Satışı kapatma ${yil}. yıl komisyonu`)).toHaveValue(kapatirGecmis[yil - 1]);
    }
    for (const k of ['K1', 'K2', 'K3']) await expect(kutu(`${k} ciro eşiği`)).toHaveValue('');
    await expect(plan).toContainText(/henüz belirlenmedi/i);
    // Okur oranı değiştirir. Örnek hesap hemen değişir. Değer yenilemeden sonra kalır.
    await kutu('Satışı kapatma taban oranı').fill('%20');
    await expect(plan.locator('[data-kazanc="kapatir-bu-yil"]')).toContainText('20.000 ₺');
    await page.reload();
    await expect(page.getByRole('region', { name: 'Kazanç planı' }).getByRole('textbox', { name: 'Satışı kapatma taban oranı', exact: true })).toHaveValue('%20');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('iki projenin planı ayrı saklanır', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await page.getByRole('region', { name: 'Kazanç planı' }).getByRole('textbox', { name: 'Tanıştırma taban oranı', exact: true }).fill('%9');
  await page.goto('politikalar/?proje=segika&rol=oncu');
  await expect(page.getByRole('region', { name: 'Kazanç planı' }).getByRole('textbox', { name: 'Tanıştırma taban oranı', exact: true })).toHaveValue('%7');
});

test('kota eşiği girilince oran sırayla artar', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=elci');
  const plan = page.getByRole('region', { name: 'Kazanç planı' });
  await plan.getByRole('textbox', { name: 'Örnek yıllık ciro', exact: true }).fill('300.000');
  await plan.getByRole('textbox', { name: 'K1 ciro eşiği', exact: true }).fill('100.000');
  await plan.getByRole('textbox', { name: 'K2 ciro eşiği', exact: true }).fill('250.000');
  await expect(plan.locator('[data-kazanc="kapatir-oran"]')).toHaveText('%32');
  await expect(plan.locator('[data-kazanc="kapatir-bu-yil"]')).toContainText('96.000 ₺');
});

test('kadrolu uzman sekmesi maaşı, kotayı ve SGK kaydını söyler', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=kadrolu');
  const plan = page.getByRole('region', { name: 'Kazanç planı' });
  await expect(plan).toContainText('SGK');
  await expect(plan).toContainText('50.000 ₺ ile 60.000 ₺');
  await expect(plan.getByRole('textbox', { name: 'Aylık maaş', exact: true })).toHaveValue('50.000');
  await expect(plan.getByRole('textbox', { name: 'Kota oranı', exact: true })).toHaveValue('%250');
  await expect(plan.locator('[data-kazanc="kadrolu-kota"]')).toContainText('125.000 ₺');
  await expect(plan.getByRole('textbox', { name: 'Kota üstü prim oranı', exact: true })).toHaveValue('');
});

test('satışta katkı seçiminde orta seçenek yoktur', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await page.getByRole('button', { name: 'Görevi ve çalışma koşullarını görün', exact: true }).click();
  const grup = page.getByRole('group', { name: 'Satışta katkınız' });
  await expect(grup.getByRole('button')).toHaveCount(2);
  await expect(grup).not.toContainText('Ürün');
});
