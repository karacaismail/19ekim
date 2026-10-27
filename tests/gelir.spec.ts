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
  test('menüde ve sunum sırasında; yedi hedef kartı, zaman çizelgesi, beş kaynak, üç senaryo, sekiz grafik, sekiz bölüm', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gelir planı');
    await expect(page.locator('.hero .stat')).toHaveCount(4);
    await expect(page.locator('.section')).toHaveCount(8);
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
    await expect(page.locator('.data-table').first().locator('tbody tr')).toHaveCount(5);
    await expect(page.locator('#senaryolar-tablo')).toBeVisible();
    await expect(page.locator('.chart-canvas')).toHaveCount(8);
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
    for (const id of ['hedefler', 'kadro', 'gelir', 'senaryo', 'fiyat', 'huni', 'basabas']) {
      expect(await page.locator(`#${id}`).getByRole('group', { name: 'Senaryo' }).count(), id).toBeGreaterThanOrEqual(2);
    }
    expect(await page.locator('.chart').evaluateAll((els) => els.filter((el) => !el.querySelector('.blok-araclar [role="group"]')).length)).toBe(0);
    // Varsayılan medyan, hepsinde aynı.
    for (const g of await seciciler.all()) await expect(g.getByRole('button', { name: 'Medyan' })).toHaveAttribute('aria-pressed', 'true');
    const stat = page.locator('.hero .stat').first().locator('.stat-value');
    const medyanTarih = await stat.textContent();
    // Kötümser: 100 aktif daha geç; tüm seçiciler değişir; kartta diğer senaryolar Medyan ve İyimser olur.
    await seciciler.nth(3).getByRole('button', { name: 'Kötümser' }).click();
    for (const g of await seciciler.all()) await expect(g.getByRole('button', { name: 'Kötümser' })).toHaveAttribute('aria-pressed', 'true');
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
    const canvas = (id: string) => page.locator(`#${id} .chart-canvas`);
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
    await expect(filtreler.getByRole('group')).toHaveText([/^Senaryo/, /^Kapasite çarpanı/, /^Aylık elde tutma/, /^Yıllık peşin payı/, /^Aylık ücret/, /^İkinci saha personeli/, /^Gider kaynağı/, /^Ek sabit gider/, /^Satış primi/, /^Filtreler/]);
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
