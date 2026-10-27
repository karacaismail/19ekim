import { expect, test, type Page } from '@playwright/test';

/**
 * Gelir planı (/gelir-plani/): hedef kartları, zaman çizelgesi, kaynak tablosu, senaryolar, başabaş; Pazarlama menüsünde.
 * Senaryo seçici (kötümser · medyan · iyimser) her bölümün, tablonun ve grafiğin başında; seçim tarayıcıda saklanır ve
 * nakit akış tablosuyla ortaktır. “Üçü üst üste” görünümü grafiği değiştirir. Sheets isteği sahte yanıtla kapatılır.
 */
const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

test.beforeEach(async ({ page }) => {
  await page.route('https://script.google.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
});

test.describe('gelir planı', () => {
  test('menüde ve sunum sırasında; yedi hedef kartı, zaman çizelgesi, altı kaynak, üç senaryo, on grafik, dokuz bölüm', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gelir planı');
    await expect(page.locator('.hero .stat')).toHaveCount(4);
    await expect(page.locator('.section')).toHaveCount(9);
    await expect(page.locator('.gelir-hedef')).toHaveCount(7);
    await expect(page.locator('.gelir-hedef').first().locator('.gelir-hedef-sayi')).toHaveText('10 aktif');
    await expect(page.locator('.gelir-hedef .gelir-hedef-sayi', { hasText: '3 M₺' })).toHaveCount(1);
    // Takvim sırası: kartların tarihleri artan (ilk dd “Başlangıçtan”: gün sayısı; kartta 6 satır).
    const gunler = await page.locator('.gelir-hedef-bilgi dd').evaluateAll((dds) => dds.filter((_, i) => i % 6 === 0).map((dd) => parseInt(dd.textContent ?? '', 10)));
    expect(gunler.filter((g) => !Number.isNaN(g))).toEqual([...gunler.filter((g) => !Number.isNaN(g))].sort((a, b) => a - b));
    // Kartta diğer iki senaryonun tarihi: medyan seçiliyken Kötümser ve İyimser satırları.
    await expect(page.locator('.gelir-hedef').first().locator('.gelir-hedef-bilgi dt')).toHaveText(['Başlangıçtan', 'Önceki hedeften', 'O ayın geliri', 'Kümülatif gelir', 'Kötümser', 'İyimser']);
    await expect(page.locator('.gelir-zaman .hire-item')).toHaveCount(7);
    await expect(page.locator('#kaynak-tablo')).toHaveText('Kaynak, başlangıç, düzen, kapasite');
    await expect(page.locator('.data-table').first().locator('tbody tr')).toHaveCount(6);
    await expect(page.locator('#senaryolar-tablo')).toBeVisible();
    await expect(page.locator('.chart-canvas')).toHaveCount(10);
    // Hedef zinciri: 100 aktif, plan tarihinden (30 Ocak 2027) sonra.
    const kart = page.locator('.gelir-hedef', { hasText: '100 aktif satıcı' });
    await expect(kart.locator('.gelir-hedef-sayi')).toHaveText('100 aktif');
    await expect(kart.locator('.gelir-hedef-tarih')).toContainText('2027');
    await expect(page.locator('#yillik-etki-tablo')).toBeVisible();
    // Kenar sistemi: renkli üst çizginin değdiği köşeler düz, alt köşeler yuvarlak.
    const koseler = await page.locator('.gelir-hedef').evaluateAll((els) => els.map((el) => { const cs = getComputedStyle(el); return [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius]; }));
    for (const [tl, tr, bl] of koseler) {
      expect([tl, tr]).toEqual(['0px', '0px']);
      expect(parseFloat(bl)).toBeGreaterThan(0);
    }
    // Pazarlama menüsü
    await page.getByRole('button', { name: 'Pazarlama' }).click();
    const menu = page.getByRole('menu', { name: 'Pazarlama' });
    await expect(menu.getByRole('menuitem', { name: 'Gelir planı' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(page.locator('.pager-link[rel="prev"] .pager-label')).toHaveText('90 gün hedefleri');
    await expect(page.locator('.pager-link[rel="next"] .pager-label')).toHaveText('Eylem planı');
  });

  test('senaryo seçici her bölümün, tablonun ve grafiğin başında; seçim tüm sayfayı değiştirir, saklanır ve nakit akışına yansır', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const seciciler = page.getByRole('group', { name: 'Senaryo' });
    const n = await seciciler.count();
    expect(n).toBeGreaterThanOrEqual(20);
    // Her bölümde (varsayımlar hariç) ve her tablo/grafik bloğunda en az bir seçici.
    for (const id of ['hedefler', 'kadro', 'dijital', 'gelir', 'senaryo', 'fiyat', 'huni', 'basabas']) {
      expect(await page.locator(`#${id}`).getByRole('group', { name: 'Senaryo' }).count(), id).toBeGreaterThanOrEqual(2);
    }
    expect(await page.locator('.chart').evaluateAll((els) => els.filter((el) => !el.querySelector('.araclar [role="group"]')).length)).toBe(0);
    // Segmentli anahtar: tek iz, seçili düğmenin altında topuz; araç çubuğu alt kenar çizgili ve altındaki içeriğe bitişik.
    const iz = seciciler.first().locator('.secim-iz');
    await expect(iz.locator('.secim-top')).toHaveCount(1);
    const topuz = await iz.evaluate((el) => {
      const t = el.querySelector<HTMLElement>('.secim-top')!.getBoundingClientRect();
      const b = el.querySelector<HTMLElement>('[aria-pressed="true"]')!.getBoundingClientRect();
      const cs = getComputedStyle(el.querySelector<HTMLElement>('.secim-top')!);
      return { dx: Math.abs(t.left - b.left), dw: Math.abs(t.width - b.width), easing: cs.transitionTimingFunction, duration: cs.transitionDuration, bg: cs.backgroundColor };
    });
    expect(topuz.dx).toBeLessThan(1.5);
    expect(topuz.dw).toBeLessThan(1.5);
    expect(topuz.easing).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
    expect(parseFloat(topuz.duration)).toBeGreaterThan(0);
    const cubuk = page.locator('.araclar').first();
    await expect(cubuk).toHaveAttribute('data-edge', 'bottom');
    const cubukKose = await cubuk.evaluate((el) => {
      const cs = getComputedStyle(el);
      const line = getComputedStyle(el, '::after');
      return { alt: [cs.borderEndStartRadius, cs.borderEndEndRadius], ust: parseFloat(cs.borderStartStartRadius), cizgi: line.content !== 'none' && parseFloat(line.height) > 0 };
    });
    expect(cubukKose.alt).toEqual(['0px', '0px']);
    expect(cubukKose.ust).toBeGreaterThan(0);
    expect(cubukKose.cizgi).toBe(true);
    // Varsayılan medyan, hepsinde aynı.
    for (const g of await seciciler.all()) await expect(g.getByRole('button', { name: 'Medyan' })).toHaveAttribute('aria-pressed', 'true');
    const stat = page.locator('.hero .stat').first().locator('.stat-value');
    const medyanTarih = await stat.textContent();
    // Kötümser: 100 aktif daha geç; tüm seçiciler değişir; kartta diğer senaryolar Medyan ve İyimser olur.
    const medyanX = await iz.locator('.secim-top').evaluate((el) => el.getBoundingClientRect().left);
    await seciciler.nth(3).getByRole('button', { name: 'Kötümser' }).click();
    for (const g of await seciciler.all()) await expect(g.getByRole('button', { name: 'Kötümser' })).toHaveAttribute('aria-pressed', 'true');
    // Topuz sola kayar (aynı izde), senaryonun tonunu alır ve araç çubuğunun rolü değişir.
    await expect.poll(async () => iz.locator('.secim-top').evaluate((el) => el.getBoundingClientRect().left)).toBeLessThan(medyanX);
    await expect(iz.locator('.secim-top')).toHaveAttribute('data-role', 'dijital-pazarlama');
    await expect(cubuk).toHaveAttribute('data-role', 'dijital-pazarlama');
    await expect(stat).not.toHaveText(medyanTarih ?? '');
    await expect(page.locator('.hero .stat').first().locator('.stat-note')).toContainText('Kötümser');
    await expect(page.locator('.gelir-hedef').first().locator('.gelir-hedef-bilgi dt')).toHaveText(['Başlangıçtan', 'Önceki hedeften', 'O ayın geliri', 'Kümülatif gelir', 'Medyan', 'İyimser']);
    await expect(page.locator('#senaryolar-tablo ~ .table-frame tbody tr[data-tone="secili"] th')).toContainText('Kötümser');
    expect(await page.evaluate(() => localStorage.getItem('istoc-plan-senaryo'))).toBe('kotumser');
    // Yenilenince seçim kalır; nakit akış tablosu aynı seçimi okur.
    await page.reload();
    await icerik(page);
    await hydrated(page);
    await expect(seciciler.first().getByRole('button', { name: 'Kötümser' })).toHaveAttribute('aria-pressed', 'true');
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByRole('group', { name: 'Senaryo' }).first().getByRole('button', { name: 'Kötümser' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.nakit-kaynak').first()).toBeVisible();
  });

  test('“Üçü üst üste” görünümü grafiği değiştirir: kaynak × ay → üç çizgi; aylık gelir → gruplanmış çubuk; huni → adım çubukları', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const canvas = (id: string) => page.locator(`#${id} .chart-canvas`).first();
    await expect(canvas('kadro')).toHaveAttribute('data-kind', 'kaynak-ay');
    await page.locator('#kadro').getByRole('group', { name: 'Görünüm' }).first().getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(canvas('kadro')).toHaveAttribute('data-kind', 'seri-cizgi');
    await expect(canvas('kadro').locator('svg')).toBeVisible({ timeout: 10_000 });
    await expect(canvas('gelir')).toHaveAttribute('data-kind', 'gelir-ay');
    await page.locator('#gelir').getByRole('group', { name: 'Görünüm' }).first().getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(canvas('gelir')).toHaveAttribute('data-kind', 'grup-ay');
    await expect(page.locator('#aylik-tablo')).toHaveText('Ay ay: üç senaryonun aylık ve kümülatif geliri');
    await expect(page.locator('#gelir .data-table thead th')).toHaveCount(7);
    await page.locator('#huni').getByRole('group', { name: 'Görünüm' }).first().getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(canvas('huni')).toHaveAttribute('data-kind', 'hedef-adim');
    // Senaryo bölümü ve başabaş kümülatifi zaten üst üste: kesikli çizgiler seçili olmayan senaryolar.
    await expect(page.locator('#senaryo .chart-canvas').first()).toHaveAttribute('data-kind', 'kumulatif-tl');
    await expect(page.locator('#senaryo .chart-canvas').nth(1)).toHaveAttribute('data-kind', 'seri-cizgi');
  });

  test('başabaş: filtreler bölümün üstünde; sonuçlar filtreye göre değişir; üç grafik ve iki tablo', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const bolum = page.locator('#basabas');
    await bolum.scrollIntoViewIfNeeded();
    const filtreler = bolum.getByRole('group', { name: 'Başabaş filtreleri' });
    await expect(filtreler.getByRole('group')).toHaveText([/^Senaryo/, /^Kapasite çarpanı/, /^Aylık elde tutma/, /^Yıllık peşin payı/, /^Aylık ücret/, /^İkinci saha personeli/, /^Ek saha personeli/, /^Satıcı kazanım reklamı/, /^Gider kaynağı/, /^Ek sabit gider/, /^Satış primi/, /^Filtreler/]);
    // Filtreler bölümün başında: ilk grafikten önce.
    const sira = await bolum.evaluate((el) => {
      const f = el.querySelector('.filtreler')!.getBoundingClientRect().top;
      const c = el.querySelector('.chart-canvas')!.getBoundingClientRect().top;
      return f < c;
    });
    expect(sira).toBe(true);
    await expect(bolum.locator('.chart-canvas')).toHaveCount(3);
    await expect(bolum.locator('.chart-canvas').nth(0)).toHaveAttribute('data-kind', 'basabas');
    await expect(bolum.locator('.chart-canvas').nth(1)).toHaveAttribute('data-kind', 'kumulatif-tl');
    await expect(bolum.locator('.chart-canvas').nth(2)).toHaveAttribute('data-kind', 'basabas-adet');
    await expect(bolum.locator('#basabas-aylar-tablo')).toBeVisible();
    await expect(bolum.locator('#duyarlilik-tablo')).toBeVisible();
    await expect(bolum.locator('#filtre-etkisi-tablo')).toBeVisible();
    // Filtre etkisi: ek saha personeli hem gideri hem yeni aktif satıcıyı artırır (fark sütunu + ile başlar).
    const etki = bolum.locator('.table-block:has(#filtre-etkisi-tablo) tbody tr');
    await expect(etki).toHaveCount(7);
    await filtreler.getByRole('group', { name: 'Ek saha personeli' }).getByRole('button', { name: '+2 kişi' }).click();
    await expect(etki.filter({ hasText: '18 ay gider' }).locator('td').nth(2)).toHaveText(/^\+/);
    await expect(etki.filter({ hasText: 'yeni aktif satıcı' }).locator('td').nth(2)).toHaveText(/^\+/);
    await expect(etki.filter({ hasText: '18 ay gelir' }).locator('td').nth(2)).toHaveText(/^\+/);
    // Reklam bütçesi “Yok”: gelir ve gider birlikte düşer.
    await filtreler.getByRole('group', { name: 'Satıcı kazanım reklamı' }).getByRole('button', { name: 'Yok' }).click();
    await filtreler.getByRole('group', { name: 'Ek saha personeli' }).getByRole('button', { name: 'Yok' }).click();
    await expect(etki.filter({ hasText: '18 ay gider' }).locator('td').nth(2)).toHaveText(/^−/);
    await expect(etki.filter({ hasText: '18 ay gelir' }).locator('td').nth(2)).toHaveText(/^−/);
    await filtreler.getByRole('button', { name: 'Varsayılana dön' }).click();
    await expect(etki.filter({ hasText: '18 ay gider' }).locator('td').nth(2)).toHaveText('—');
    await expect(bolum.locator('.table-block:has(#basabas-aylar-tablo) tbody tr')).toHaveCount(18);
    await expect(bolum.locator('.table-block:has(#duyarlilik-tablo) tbody tr')).toHaveCount(4);
    // Sheets sahte yanıt boş: gider kaynağı plana düşer ve not bunu söyler.
    await expect(bolum.locator('.kaynak-notu')).toContainText('plan kadrosu', { timeout: 10_000 });
    const stat = bolum.locator('.stat').first().locator('.stat-value');
    const once = await stat.textContent();
    // Ek sabit gider +500 bin: başabaş gecikir ya da ufuktan çıkar; sonuç metni değişir.
    await filtreler.getByRole('group', { name: 'Ek sabit gider' }).getByRole('button', { name: '+500 bin ₺ / ay' }).click();
    await expect(stat).not.toHaveText(once ?? '');
    await filtreler.getByRole('button', { name: 'Varsayılana dön' }).click();
    await expect(stat).toHaveText(once ?? '');
    // Kapasite çarpanı filtre: senaryo seçimi değişmez, seçili düğme değişir.
    await filtreler.getByRole('group', { name: 'Kapasite çarpanı' }).getByRole('button', { name: '%130' }).click();
    await expect(filtreler.getByRole('group', { name: 'Kapasite çarpanı' }).getByRole('button', { name: '%130' })).toHaveAttribute('aria-pressed', 'true');
    await expect(filtreler.getByRole('group', { name: 'Senaryo' }).getByRole('button', { name: 'Medyan' })).toHaveAttribute('aria-pressed', 'true');
    // Grafikler görünür alana girince çizilir: üç başabaş grafiği de SVG verir.
    for (let i = 0; i < 3; i++) {
      const canvas = bolum.locator('.chart-canvas').nth(i);
      await canvas.scrollIntoViewIfNeeded();
      await expect(canvas.locator('svg')).toBeVisible({ timeout: 10_000 });
    }
  });

  test('dijital strateji ve kadro katkısı: zincir, kanallar, kademeler, takvim; rol tablosu dolaylı rolleri işaretler; istihdam takvimi aynı tabloyu okur', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const dij = page.locator('#dijital');
    await expect(dij.locator('.stat')).toHaveCount(6);
    await expect(dij.locator('.stat').nth(5).locator('.stat-value')).toContainText('×');
    await expect(dij.locator('.table-block:has(#kanallar-tablo) tbody tr')).toHaveCount(6);
    await expect(dij.locator('.table-block:has(#kademeler-tablo) tbody tr')).toHaveCount(5);
    await expect(dij.locator('.table-block:has(#kademeler-tablo) tbody tr[data-tone="secili"] th')).toContainText('30 bin');
    await expect(dij.locator('.table-block:has(#dijital-takvim-tablo) tbody tr')).toHaveCount(4);
    await expect(dij.locator('.chart-canvas')).toHaveAttribute('data-kind', 'hedef-adim');
    const kadro = page.locator('#kadro');
    const katki = kadro.locator('.table-block:has(#katki-tablo) tbody tr');
    await expect(katki).toHaveCount(10);
    await expect(katki.filter({ hasText: 'Yönetici asistanı' })).toHaveAttribute('data-tone', 'total');
    await expect(katki.filter({ hasText: 'Yönetici asistanı' }).locator('td', { hasText: /^Dolaylı$/ })).toHaveCount(1);
    await expect(katki.first().locator('th')).toContainText('Saha satış uzmanı');
    // Üçü üst üste: senaryo sütunları.
    await kadro.locator('.table-block:has(#katki-tablo)').getByRole('group', { name: 'Görünüm' }).getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(kadro.locator('.table-block:has(#katki-tablo) thead th')).toHaveCount(8);
    // İstihdam takvimi sayfasında aynı tablo ve ortak seçim.
    await page.getByRole('group', { name: 'Senaryo' }).first().getByRole('button', { name: 'İyimser' }).click();
    await page.goto('istihdam/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('#katki .table-block:has(#istihdam-katki-tablo) tbody tr')).toHaveCount(10);
    await expect(page.locator('#katki').getByRole('group', { name: 'Senaryo' }).first().getByRole('button', { name: 'İyimser' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#istihdam-katki-tablo')).toContainText('iyimser');
    await page.evaluate(() => localStorage.removeItem('istoc-plan-senaryo'));
  });

  test('320 px: taşma yok, hedef kartları tek sütun, seçim düğmeleri ≥ 44 px, bağımsız bağlantı ≥ 44 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const d = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      cols: new Set([...document.querySelectorAll<HTMLElement>('.gelir-hedef')].map((el) => Math.round(el.getBoundingClientRect().left))).size,
      link: document.querySelector<HTMLElement>('.text-link[data-standalone]')?.getBoundingClientRect().height ?? 0,
      small: [...document.querySelectorAll<HTMLElement>('.gelir-hedef *, .secim *')].filter((el) => el.textContent?.trim() && parseFloat(getComputedStyle(el).fontSize) < 14).length,
      hit: Math.min(...[...document.querySelectorAll<HTMLElement>('.secim-dugme')].map((el) => el.getBoundingClientRect().height)),
      filtre: document.querySelector<HTMLElement>('.filtreler')!.getBoundingClientRect().width <= window.innerWidth,
    }));
    expect(d.overflow).toBeLessThanOrEqual(0);
    expect(d.cols).toBe(1);
    expect(d.link).toBeGreaterThanOrEqual(44);
    expect(d.small).toBe(0);
    expect(d.hit).toBeGreaterThanOrEqual(44);
    expect(d.filtre).toBe(true);
  });
});
