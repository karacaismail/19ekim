import { expect, test } from './fixtures/persona';
import { CANLI_GRUPLAR, CANLI_PAKETLER } from '../src/data/canliPaketler';
import { ALICI_UCRETSIZ, OKUNDU, PAKET_ADI_NOTU, SATICI_UCRETSIZ, YAZILIM_DURUMU, YAZILIM_KAYNAGI, hizmetHaritasi, paketKartlari } from '../src/data/hizmetler';
import { HAZIRLIK_ADI, MODELLER } from '../src/data/gelirModelleri';

/**
 * Hizmetler (kullanıcı kararı 2026-11-12, adres `/services/`): araştırmanın ilkesi ve bugünkü rakamlar ayrı etiketli,
 * alıcı ve satıcı şeridi, üç canlı paket, özellik grubu seçilen karşılaştırma tablosu, hizmet haritası (ücretsiz, pakette,
 * planlanan) ve ödemenin başladığı yer. Paket değerleri canlı paket anlık görüntüsünden gelir, metne elle sayı yazılmaz.
 * Hizmet satırı tablette ad üstte ve üç alan yan yana, geniş ekranda ad solda durur.
 */

const GENISLIKLER: [number, number][] = [
  [320, 900],
  [360, 900],
  [375, 900],
  [390, 900],
  [768, 1024],
  [1024, 900],
  [1280, 900],
  [844, 390],
];

for (const [genislik, yukseklik] of GENISLIKLER) {
  test(`hizmetler ${genislik}×${yukseklik}: şeritler, paketler, harita, yollar, taşma yok, metin ≥ 14 px`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: yukseklik });
    await page.goto('services/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hizmetler');
    // Araştırmanın ilkesi ile bugünkü olgu ayrı etiketlidir.
    await expect(page.locator('.pz-giris .pz-etiket')).toHaveText(['Araştırmanın ilkesi', 'Bugün istoc.com’da']);

    await expect(page.locator('.pz-serit')).toHaveCount(2);
    await expect(page.locator('#serit-alici').locator('xpath=ancestor::section[1]').locator('.pz-fayda')).toHaveCount(ALICI_UCRETSIZ.length);
    await expect(page.locator('#serit-satici').locator('xpath=ancestor::section[1]').locator('.pz-fayda')).toHaveCount(SATICI_UCRETSIZ.length);

    // Paketler canlı uçtaki sırayla ve fiyatla.
    const paketler = page.locator('.pz-paket');
    await expect(paketler).toHaveCount(CANLI_PAKETLER.length);
    await expect(paketler.locator('.pz-paket-ad')).toHaveText(CANLI_PAKETLER.map((p) => p.ad));
    await expect(paketler.nth(0)).toContainText('399 €');
    await expect(paketler.nth(0)).toContainText('3.990 €');
    await expect(paketler.nth(1)).toContainText('599 €');
    await expect(paketler.nth(2).locator('.pz-paket-tutar')).toHaveText('Teklif');
    await expect(page.locator('.pz-paket[data-one]')).toHaveCount(1);
    await expect(page.locator('#paketler')).toContainText(PAKET_ADI_NOTU);

    const harita = hizmetHaritasi();
    await expect(page.locator('.pz-hizmet')).toHaveCount(harita.length);
    // Ücretsiz kısmı olan hizmetin kutusu yeşildir. Ücretsiz kısmı olmayanın kutusu boştur ve geri çekilir.
    const tonlar = await page.locator('.pz-hizmet .pz-alan').evaluateAll((els) => ({
      yesil: els.filter((e) => e.getAttribute('data-ton') === 'ucretsiz').length,
    }));
    expect(tonlar.yesil).toBe(harita.filter((h) => h.ucretsiz).length);
    // Paketteki ile planlanan aynı işi anlatıyor gibi görünürse farkı yazılır.
    await expect(page.locator('.pz-planlanan-fark')).toHaveCount(harita.filter((h) => h.fark).length);

    // Hizmet satırı: 768 px’ten itibaren üç alan yan yana. Ad 1024 px’ten itibaren solda, daha darda üstte.
    const yerlesim = await page.locator('.pz-hizmet').first().evaluate((li) => {
      const bas = li.querySelector('.pz-hizmet-bas')!.getBoundingClientRect();
      const alanlar = li.querySelector('.pz-hizmet-alanlar')!.getBoundingClientRect();
      const sol = new Set([...li.querySelectorAll('.pz-alan')].map((a) => Math.round(a.getBoundingClientRect().left)));
      return { adSolda: bas.right <= alanlar.left + 1, adUstte: bas.bottom <= alanlar.top + 1, sutun: sol.size };
    });
    if (genislik >= 768) expect(yerlesim.sutun).toBe(3);
    if (genislik >= 1024) expect(yerlesim.adSolda).toBe(true);
    else expect(yerlesim.adUstte).toBe(true);

    await expect(page.locator('.pz-yol')).toHaveCount(2);
    await expect(page.locator('.pz-adim[data-ucret="ucretli"]').first()).toBeVisible();

    const olcum = await page.evaluate(() => ({
      tasma: document.documentElement.scrollWidth - innerWidth,
      kucuk: [...document.querySelectorAll<HTMLElement>('.pz-sayfa *')]
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
        .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14 || Number(getComputedStyle(e).fontWeight) < 300)
        .map((e) => e.className || e.tagName),
      // Tablo 48em’den geniş kapsayıcıda kendi kutusunda kayar (ui.tsx useKabuk). Kutunun içi sayılmaz, kutunun kendisi sayılır.
      disari: [...document.querySelectorAll<HTMLElement>('.pz-sayfa *')]
        .filter((e) => !e.parentElement?.closest('.table-scroll') && e.getBoundingClientRect().right > innerWidth + 1)
        .map((e) => e.className || e.tagName),
      metin: document.querySelector<HTMLElement>('.pz-sayfa')!.textContent ?? '',
      aciklama: document.querySelector<HTMLElement>('#paketler')!.textContent ?? '',
    }));
    expect(olcum.tasma).toBeLessThanOrEqual(0);
    expect(olcum.disari).toEqual([]);
    expect(olcum.kucuk).toEqual([]);
    expect(olcum.metin).not.toMatch(/[;—]/);
    // Tarih gün, ay adı ve yılla yazılır.
    expect(olcum.metin).toContain(OKUNDU);
    expect(olcum.metin).not.toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
    // Yıllık ödeme cümlesi varsa ay sayısı tam sayıdır.
    const yillik = olcum.aciklama.match(/Yıllık peşin ödemede (\S+) aylık/);
    if (yillik) expect(Number.isInteger(Number(yillik[1]))).toBe(true);
  });
}

test('hizmetler: karşılaştırma seçilen özellik grubunu ve bütün değerleri canlı veriyle aynı gösterir', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('services/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const tablo = page.locator('#karsilastirma table');
  await expect(tablo.locator('tbody tr')).toHaveCount(CANLI_GRUPLAR[0].ozellikler.length);
  // Ortak sahip sayısı Basic paketinde yoktur: “Yok” açık yazılır.
  await expect(tablo.locator('tbody tr', { hasText: 'Ortak sahip sayısı' })).toContainText('Yok');
  // Hepsi seçilince 51 özellik görünür.
  const toplam = CANLI_GRUPLAR.reduce((n, g) => n + g.ozellikler.length, 0);
  // Yedi seçenek tek satıra sığmaz. Seçim markalı bir açılır listedir (yerel seçim menüsü değildir).
  await page.getByRole('combobox', { name: 'Özellik grubu' }).click();
  await page.getByRole('option', { name: `Hepsi (${toplam})` }).click();
  await expect(tablo.locator('tbody tr')).toHaveCount(toplam);
  // “Yakında” işaretli özellik pakette görünse de bugün çalışmaz: hücrede “Var” değil “Yakında” yazar.
  const yakinda = CANLI_GRUPLAR.flatMap((g) => g.ozellikler).filter((o) => o.yakinda);
  for (const o of yakinda) {
    const satir = tablo.locator('tbody tr', { hasText: o.ad });
    await expect(satir).toContainText('Yakında');
    const hucreler = await satir.locator('td').allInnerTexts();
    expect(hucreler.map((t) => t.trim())).not.toContain('Var');
  }
});

test('hizmetler: planlanan hizmetler gelir modellerindeki kartlara bağlanır, hazırlık etiketi aynı ve nötrdür', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('services/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const planlanan = await page.locator('.pz-planlanan li').evaluateAll((els) =>
    els.map((li) => {
      const cip = li.querySelector('.chip')!;
      return { href: li.querySelector('a')!.getAttribute('href') ?? '', etiket: cip.textContent!.trim(), ton: cip.getAttribute('data-ton') };
    }),
  );
  expect(planlanan.length).toBeGreaterThan(8);
  for (const p of planlanan) {
    const id = p.href.split('#model-')[1];
    const m = MODELLER.find((x) => x.id === id);
    expect(m, p.href).toBeTruthy();
    expect(p.etiket).toBe(HAZIRLIK_ADI[m!.hazirlik]);
    // Yeşil yalnız bugün ücretsiz olanı gösterir. Planlanan hizmetin hapı tonsuzdur.
    expect(p.ton).toBeNull();
  }
  // Planlanan bir hizmetin bağlantısı gelir modelleri sayfasındaki kartı açar.
  const ilk = page.locator('.pz-planlanan a').first();
  const hedef = (await ilk.getAttribute('href'))!.split('#')[1];
  await ilk.click();
  await page.waitForURL(/gelir-modelleri/);
  await expect(page.locator(`#${hedef}`)).toBeVisible();
});

test('hizmetler: küresel örnek bağlantılarının metni benzersizdir ve katmanı açar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('services/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const metinler = await page.locator('.pz-hizmet-bas > a').allInnerTexts();
  expect(metinler.length).toBe(hizmetHaritasi().filter((h) => h.katman).length);
  expect(new Set(metinler).size).toBe(metinler.length);
  await page.locator('.pz-hizmet-bas > a').first().click();
  await page.waitForURL(/kuresel-pazaryerleri\/#katman-/);
  const id = new URL(page.url()).hash.slice(1);
  await expect(page.locator(`#${id}`)).toBeVisible();
});

test('hizmetler: menüde Pazarlama grubunda, değer önerisinden sonra ve yeni işaretli', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('services/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Pazarlama', exact: true }).click();
  const menu = page.getByRole('menu', { name: 'Pazarlama' });
  await expect(menu).toBeVisible();
  const ogeler = await menu.getByRole('menuitem').allInnerTexts();
  expect(ogeler.indexOf('Hizmetler')).toBe(ogeler.indexOf('Değer önerisi') + 1);
  const oge = menu.getByRole('menuitem', { name: /Hizmetler/ });
  await expect(oge).toHaveAttribute('aria-current', 'page');
  await expect(oge).toHaveAttribute('href', '/19ekim/services/');
  await expect(oge.getByRole('img', { name: 'Yeni', exact: true })).toHaveCount(1);
});

/**
 * Kullanıcı kararı 13 Kasım 2026: canlı paket tablosunda yazılımda karşılığı olmayan satırlar silinmez. Satır işaretle
 * gösterilir. Kod incelemesi 22 maddeyi buldu. Bu maddeler canlı tabloda 25 satırdır. Çalışmayan satırın paketteki
 * hücresinde “Yakında” ya da “Hazır değil” yazar. Pakete bağlı olmayan ve alıcıya ait satırda yalnız not durur.
 */
test('hizmetler: yazılım durumu listesindeki her anahtar canlı tabloda vardır', () => {
  const anahtarlar = new Set(CANLI_GRUPLAR.flatMap((g) => g.ozellikler.map((o) => o.anahtar)));
  expect(Object.keys(YAZILIM_DURUMU)).toHaveLength(25);
  for (const a of Object.keys(YAZILIM_DURUMU)) expect(anahtarlar.has(a), a).toBe(true);
});

test('hizmetler: yazılımda çalışmayan satır işaret ve not taşır, işaretin kaynağı yazılıdır', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('services/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const toplam = CANLI_GRUPLAR.reduce((n, g) => n + g.ozellikler.length, 0);
  await page.getByRole('combobox', { name: 'Özellik grubu' }).click();
  await page.getByRole('option', { name: `Hepsi (${toplam})` }).click();
  const tablo = page.locator('#karsilastirma table');
  for (const o of CANLI_GRUPLAR.flatMap((g) => g.ozellikler)) {
    const d = YAZILIM_DURUMU[o.anahtar];
    if (!d) continue;
    const satir = tablo.locator('tbody tr').filter({ has: page.locator('th', { hasText: o.ad }) });
    await expect(satir.locator('.pz-ozellik-not'), o.anahtar).toHaveText(d.not);
    if (d.durum === 'yakinda' || d.durum === 'hazir-degil') {
      const isaret = HAZIRLIK_ADI[d.durum];
      await expect(satir.locator(`.pz-deger[data-deger="${d.durum}"]`).first(), o.anahtar).toHaveText(isaret);
      const hucreler = (await satir.locator('td').allInnerTexts()).map((t) => t.trim());
      expect(hucreler, o.anahtar).not.toContain('Var');
    } else {
      await expect(satir.locator('.pz-deger[data-deger="yakinda"], .pz-deger[data-deger="hazir-degil"]'), o.anahtar).toHaveCount(0);
    }
  }
  await expect(page.locator('#karsilastirma')).toContainText(YAZILIM_KAYNAGI);
  await expect(page.locator('.page-meta')).toContainText(YAZILIM_KAYNAGI);
});

test('hizmetler: paket kartları yalnız yazılımda çalışan özelliği sayar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('services/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const kartlar = paketKartlari();
  for (const k of kartlar) {
    const metin = await page.locator(`#paket-${k.id} ul`).innerText();
    expect(metin).toContain('kayıtlı ürün');
    expect(metin).not.toMatch(/aynı anda yayında|öne çıkan ürün|ERP|ödeme koşulları|fuar|dilde açılır/i);
  }
});

test('hizmetler: 13 Kasım 2026 kararları ve yeni ek hizmetler görünür', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('services/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const harita = hizmetHaritasi();
  await expect(page.locator('.pz-hizmet .pz-karar')).toHaveCount(harita.filter((h) => h.karar).length);
  await expect(page.locator('#hizmet-talep .pz-karar')).toContainText('teklif isteğine yanıt verecek');
  await expect(page.locator('#hizmet-gorunurluk .pz-karar')).toContainText('yalnız İstoç çalışanı');
  await expect(page.locator('#hizmet-vitrin .pz-karar')).toContainText('Ücretsiz paket');
  await expect(page.locator('#odeme-ne-zaman .pz-karar')).toContainText('Ücretsiz paket');
  await expect(page.locator('#paketler .pz-karar')).toContainText('Ücretsiz paket');
  await expect(page.locator('.pz-karar .chip').first()).toHaveText('Karar');
  await expect(page.locator('#hizmet-ekip .pz-planlanan a[href$="#model-crm-eki"]')).toHaveCount(1);
  await expect(page.locator('#hizmet-gorunurluk .pz-planlanan a[href$="#model-yetkili-satici"]')).toHaveCount(1);
});
