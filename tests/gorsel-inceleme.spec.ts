import { expect, test, type Page } from './fixtures/persona';

/**
 * Görsel inceleme kararları (13 Kasım 2026). Kullanıcı bütün sayfa görsellerinin incelenmesini istedi. Bu dosya
 * incelemeden doğan kalıcı davranışları denetler:
 *
 * - Kutuya sığmayan tabloda yazılı ipucu ve kenar gölgesi vardır. Sığan tabloda ipucu yoktur.
 * - Son tarih grafiğinde ve dar ekrandaki listesinde “Bugün” işareti vardır.
 * - Kararlar sayfasında telefondaki kart başlığı sorudur. Tarih özettedir. Gecikmiş karar uyarı rengindedir.
 * - Gelir modeli kartının alt şeridi kartın dışına taşmaz. Geniş kartta örnek hesap sağ sütundadır.
 * - Hesap araçları yan menüsü kayınca yapışık kırıntı satırının altında kalır.
 */

/** Bugün sabittir: son tarihler (26 Ekim 2026) geçmiştir. */
const BUGUN = new Date('2026-11-13T10:00:00+03:00');

async function ac(page: Page, yol: string, genislik: number) {
  // Panel açılma geçişi ölçümü bozmasın (hareket sözleşmesi reduced-motion istisnasını tanır).
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(BUGUN);
  await page.setViewportSize({ width: genislik, height: 900 });
  await page.goto(yol);
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}

/** Bir CSS değişkeninin hesaplanmış rengi. */
const tokenRengi = (page: Page, token: string) =>
  page.evaluate((t) => {
    const olcu = document.createElement('span');
    olcu.style.color = `var(${t})`;
    document.body.append(olcu);
    const renk = getComputedStyle(olcu).color;
    olcu.remove();
    return renk;
  }, token);

test('kutuya sığmayan tabloda yazılı ipucu ve gölge var, sığan tabloda yok (Kararlar, 1280 px)', async ({ page }) => {
  await ac(page, 'karar/', 1280);
  const bloklar = page.locator('.table-block[data-kabuk="tablo"]');
  await expect(bloklar.first()).toBeVisible();
  const durum = await bloklar.evaluateAll((els) =>
    els.map((b) => {
      const k = b.querySelector<HTMLElement>('.table-scroll')!;
      return { tasar: k.scrollWidth > k.clientWidth + 1, ipucu: !!b.querySelector('.table-kaydir-ipucu') };
    }),
  );
  // Her tabloda ipucu ancak tablo taşıyorsa vardır.
  for (const d of durum) expect(d.ipucu).toBe(d.tasar);
  // Verilen kararlar tablosu 1280 px’te taşar: ipucu ve sağ gölge görünür.
  const verilen = page.locator('.table-block:has(#verilen-tablo)');
  await expect(verilen.locator('.table-kaydir-ipucu')).toHaveText('Tablo ekrana sığmıyor. Diğer sütunları görmek için tabloyu yana kaydırın.');
  const sag = verilen.locator('.tablo-golge[data-yan="sag"]');
  const sol = verilen.locator('.tablo-golge[data-yan="sol"]');
  await expect(sag).toHaveAttribute('data-gorunur', '');
  await expect(sol).not.toHaveAttribute('data-gorunur', '');
  // Tablo sona kaydırılınca sağ gölge kaybolur, sol gölge görünür.
  await verilen.locator('.table-scroll').evaluate((k) => (k.scrollLeft = k.scrollWidth));
  await expect(sag).not.toHaveAttribute('data-gorunur', '');
  await expect(sol).toHaveAttribute('data-gorunur', '');
  // Gölge tıklamayı engellemez ve ekran okuyucudan gizlidir.
  expect(await sag.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe('none');
  await expect(sag).toHaveAttribute('aria-hidden', 'true');
});

test('son tarih grafiğinde “Bugün” çizgisi var, dar ekrandaki listede de “Bugün” işareti var', async ({ page }) => {
  await ac(page, 'karar/', 1280);
  const grafik = page.locator('.chart', { has: page.locator('#son-tarih-grafik') });
  await grafik.scrollIntoViewIfNeeded();
  await expect(grafik.locator('svg text', { hasText: /^Bugün$/ })).toHaveCount(1);
  await expect(grafik.locator('.chart-canvas')).toHaveAttribute('aria-label', /Bugün 13 Kas/);
  await ac(page, 'karar/', 375);
  const dar = page.locator('.chart', { has: page.locator('#son-tarih-grafik') });
  await expect(dar.locator('.ajanda-isaret', { hasText: 'Bugün' })).toHaveCount(1);
});

test('Kararlar 375 px: kart başlığı soru, tarih özette; gecikmiş karar uyarı rengiyle yazılır', async ({ page }) => {
  await ac(page, 'karar/', 375);
  const bekleyen = page.locator('.table-block:has(#karar-tablo)');
  const adlar = await bekleyen.locator('.kayit-ad').allInnerTexts();
  expect(adlar.length).toBeGreaterThan(0);
  for (const ad of adlar) expect(ad.trim()).toMatch(/\?$/);
  await expect(bekleyen.locator('.kayit-ozet-etiket').first()).toHaveText('Son tarih');
  const gecikti = bekleyen.locator('.cell-sub[data-durum="gecikti"]').first();
  await expect(gecikti).toContainText('Gecikti.');
  expect(await gecikti.evaluate((e) => getComputedStyle(e).color)).toBe(await tokenRengi(page, '--pill-missing-fg'));
  const verilen = page.locator('.table-block:has(#verilen-tablo)');
  await expect(verilen.locator('.kayit-ozet-etiket').first()).toHaveText('Karar tarihi');
  for (const ad of (await verilen.locator('.kayit-ad').allInnerTexts()).slice(0, 5)) expect(ad).not.toMatch(/^\d+ \p{L}+ \d{4}$/u);
});

for (const genislik of [320, 390]) {
  test(`gelir modeli kartı ${genislik} px: alt şerit kartın içinde kalır, panel tek sütun`, async ({ page }) => {
    await ac(page, 'gelir-modelleri/', genislik);
    const kart = page.locator('#model-sponsorlu-urun');
    await kart.scrollIntoViewIfNeeded();
    await kart.getByRole('button', { name: /^Kimin ödediğini ve riskleri görün/ }).click();
    await expect(kart.locator('.gm-bilgi')).toBeVisible();
    const k = (await kart.boundingBox())!;
    for (const sec of ['.gm-ayrinti', '.gm-ac', '.gm-bilgi']) {
      const b = (await kart.locator(sec).boundingBox())!;
      expect(b.x, sec).toBeGreaterThanOrEqual(k.x - 0.5);
      expect(b.x + b.width, sec).toBeLessThanOrEqual(k.x + k.width + 0.5);
      expect(b.y + b.height, sec).toBeLessThanOrEqual(k.y + k.height + 0.5);
    }
    const ustler = await kart.locator('.gm-bilgi-oge').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(ustler).size).toBe(4);
  });
}

test('gelir modeli kartı 1280 px: örnek hesap sağda, bilgi kutuları ikişerli, hazırlık ölçeği durumu gösterir', async ({ page }) => {
  await ac(page, 'gelir-modelleri/', 1280);
  const kart = page.locator('#model-sponsorlu-urun');
  await kart.scrollIntoViewIfNeeded();
  const nasil = (await kart.locator('.gm-nasil').boundingBox())!;
  const ornek = (await kart.locator('.gm-ornek').boundingBox())!;
  expect(ornek.x).toBeGreaterThan(nasil.x + nasil.width);
  await kart.getByRole('button', { name: /^Kimin ödediğini ve riskleri görün/ }).click();
  await expect(kart.locator('.gm-bilgi')).toBeVisible();
  const ustler = await kart.locator('.gm-bilgi-oge').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(ustler).size).toBe(2);
  // Ölçek: Yakında 2, Hazır 3, Hazır değil 1 dolu çizgi. Durum yazıyla da söylenir.
  await expect(kart.locator('.gm-olcek [data-dolu]')).toHaveCount(2);
  await expect(page.locator('#model-crm-eki .gm-olcek [data-dolu]')).toHaveCount(3);
  await expect(page.locator('#model-ihracat .gm-olcek [data-dolu]')).toHaveCount(1);
  await expect(page.locator('.gm-olcek').first()).toHaveAttribute('aria-hidden', 'true');
  // Örnek hesaptaki tutarlar kalın yazılır.
  await expect(kart.locator('.gm-ornek-metin .gm-sayi')).toHaveText(['50 €', '2.000 €']);
});

test('hesap araçları 1280 px: yan menü kayınca yapışık kırıntı satırının altında kalır', async ({ page }) => {
  await ac(page, 'applet/', 1280);
  await page.mouse.move(640, 500);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(40);
  }
  await expect(page.locator('html')).toHaveAttribute('data-kaydirildi', '');
  const menu = page.locator('.applet-gezgin');
  await expect
    .poll(async () => {
      const m = (await menu.boundingBox())!;
      const k = (await page.locator('.crumbs-row').boundingBox())!;
      return m.y - (k.y + k.height);
    })
    .toBeGreaterThanOrEqual(0);
  await expect(menu.locator('.applet-gezgin-baslik').first()).toBeInViewport({ ratio: 1 });
});
