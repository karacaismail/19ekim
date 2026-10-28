import { expect, test, type Page } from '@playwright/test';
import { buildModel, reply } from './opex-fixture';

/**
 * Nakit akış tablosu (/nakit-akisi/): Sheets sahte yanıtla (kurgusal örnek tohum), girişler gelir planının seçili
 * senaryosundan (kötümser · medyan · iyimser; gelir planıyla ortak). Basit/ayrıntılı anahtar, senaryo seçici, üç senaryo
 * karşılaştırması, “üçü üst üste” grafik görünümü, Giderler menüsü ve dar ekran.
 */
const MODEL = buildModel();
const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

async function acikUc(page: Page) {
  await page.route('https://script.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(MODEL, 'ozet-1')) }),
  );
}

async function duzen(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const cs = getComputedStyle(el);
      return el.getClientRects().length > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const textEls = [...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())).filter(visible);
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      small: textEls.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14).map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
      headerOverflow: [...document.querySelectorAll('.data-table th')].filter((th) => th.scrollWidth > th.clientWidth + 1).map((th) => th.textContent?.trim()),
    };
  });
}

async function grafik(page: Page) {
  const canvas = page.locator('.chart-canvas');
  await expect(canvas).toHaveCount(1);
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas.locator('svg')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    const out: string[] = [];
    const svg = document.querySelector<SVGSVGElement>('.chart-canvas svg')!;
    const frame = svg.getBoundingClientRect();
    const boxes = [...svg.querySelectorAll('text')]
      .filter((t) => (t.textContent ?? '').trim() && getComputedStyle(t).opacity !== '0')
      .map((t) => ({ text: t.textContent ?? '', box: t.getBoundingClientRect(), size: parseFloat(getComputedStyle(t).fontSize) }));
    for (const { text, box, size } of boxes) {
      if (/\.\.\.|…/.test(text)) out.push(`kesik "${text}"`);
      if (size < 14) out.push(`küçük "${text}"`);
      if (box.left < frame.left - 1 || box.right > frame.right + 1 || box.top < frame.top - 1 || box.bottom > frame.bottom + 1) out.push(`SVG dışında "${text}"`);
    }
    for (let a = 0; a < boxes.length; a++) {
      for (let b = a + 1; b < boxes.length; b++) {
        const p = boxes[a].box;
        const q = boxes[b].box;
        const w = Math.min(p.right, q.right) - Math.max(p.left, q.left);
        const h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
        const smaller = Math.min(p.width * p.height, q.width * q.height);
        if (w > 0 && h > 0 && smaller > 0 && (w * h) / smaller > 0.3) out.push(`"${boxes[a].text}" ↔ "${boxes[b].text}"`);
      }
    }
    return out;
  });
}

test.describe('nakit akış tablosu', () => {
  test('Giderler menüsünde; basit görünüm dört satır, anahtar ayrıntıyı açar; toplamlar tutar', async ({ page }) => {
    await acikUc(page);
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nakit akış tablosu');
    await expect(page.locator('.nakit-kaynak')).toContainText('Google Sheets', { timeout: 10_000 });

    const nav = page.getByRole('navigation', { name: 'Ana gezinme' });
    await expect(nav.locator('.mainnav-link')).toHaveText([/^İstihdam/, /^Pazarlama/, /^Finans/, /^Yönetim/, /^Yardımcı/]);
    const tetik = page.getByRole('button', { name: 'Finans' });
    await expect(tetik).toHaveAttribute('data-section', 'true');
    await tetik.click();
    const menu = page.getByRole('menu', { name: 'Finans' });
    await expect(menu.getByRole('menuitem')).toHaveText(['Gelir planı', 'Giderler', 'Nakit akışı']);
    await expect(menu.getByRole('menuitem', { name: 'Nakit akışı' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');

    const tablo = page.locator('.table-block:has(#nakit-tablo) .data-table');
    const satirlar = tablo.locator('tbody tr');
    await expect(satirlar).toHaveCount(4);
    await expect(satirlar.locator('th')).toHaveText(['Nakit girişleri', 'Nakit çıkışları', 'Net nakit akışı', 'Dönem sonu nakit']);
    // 15 ay + Kalem + Toplam sütunu.
    await expect(tablo.locator('thead th')).toHaveCount(17);

    const anahtar = page.getByRole('switch', { name: 'Ayrıntılı görünüm' });
    await expect(anahtar).toHaveAttribute('aria-checked', 'false');
    await anahtar.click();
    await expect(anahtar).toHaveAttribute('aria-checked', 'true');
    const n = await satirlar.count();
    expect(n).toBeGreaterThan(8);
    await expect(satirlar.first().locator('th')).toContainText('Abonelik: ilk ödemeler');
    await expect(satirlar.locator('th', { hasText: 'Bordrolu personel' })).toHaveCount(1);
    await expect(satirlar.locator('th', { hasText: 'Meta reklamları' })).toHaveCount(1);
    await expect(satirlar.locator('th', { hasText: 'Satıcı kazanım reklamı' })).toHaveCount(1);
    // Ayrıntılı satırların toplam sütunu: kalem toplamları ara toplamı verir (ilk ay sütunu).
    const sayi = (s: string) => (s.trim() === '—' ? 0 : Number(s.replace(/[^\d-]/g, '')));
    const hucreler = async (ad: string) => satirlar.filter({ has: page.locator('th', { hasText: new RegExp(`^${ad}`) }) }).locator('td').allTextContents();
    const giris = await hucreler('Nakit girişleri');
    const ilk = await hucreler('Abonelik: ilk ödemeler');
    const yenile = await hucreler('Abonelik: yenilemeler');
    const yatirim = await hucreler('Yatırım girişi');
    // Hücreler kuruşsuz yazılır: yuvarlanmış kalemlerin toplamı ara toplamdan en çok 1 ₺ sapar.
    for (let i = 0; i < 16; i++) expect(Math.abs(sayi(giris[i]) - (sayi(ilk[i]) + sayi(yenile[i]) + sayi(yatirim[i]))), `ay ${i}`).toBeLessThanOrEqual(1);
    const net = await hucreler('Net nakit akışı');
    const cikis = await hucreler('Nakit çıkışları');
    for (let i = 0; i < 16; i++) expect(Math.abs(sayi(net[i]) - (sayi(giris[i]) - sayi(cikis[i]))), `net ${i}`).toBeLessThanOrEqual(1);
    await anahtar.click();
    await expect(satirlar).toHaveCount(4);
  });

  test('senaryo seçici özet, tablo ve grafik başında; kötümserde giriş azalır; karşılaştırma tablosu seçiliyi vurgular; “üçü üst üste” grafiği değiştirir', async ({ page }) => {
    await acikUc(page);
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.nakit-kaynak')).toContainText('Google Sheets', { timeout: 10_000 });
    const seciciler = page.getByRole('group', { name: 'Senaryo' });
    expect(await seciciler.count()).toBeGreaterThanOrEqual(5);
    for (const g of await seciciler.all()) await expect(g.getByRole('button', { name: 'Medyan' })).toHaveAttribute('aria-pressed', 'true');
    const sayi = (s: string) => Number(s.replace(/[^\d-]/g, ''));
    const giris = page.locator('.stat').first().locator('.stat-value');
    const medyan = sayi((await giris.textContent()) ?? '0');
    const karsilastirma = page.locator('.table-block:has(#senaryo-karsilastirma-tablo) tbody tr');
    await expect(karsilastirma).toHaveCount(3);
    await expect(karsilastirma.locator('th')).toHaveText(['Kötümser', 'Medyan', 'İyimser']);
    await expect(karsilastirma.nth(1)).toHaveAttribute('data-tone', 'secili');
    await seciciler.last().getByRole('button', { name: 'Kötümser' }).click();
    for (const g of await seciciler.all()) await expect(g.getByRole('button', { name: 'Kötümser' })).toHaveAttribute('aria-pressed', 'true');
    const kotumser = sayi((await giris.textContent()) ?? '0');
    expect(kotumser).toBeLessThan(medyan);
    await expect(karsilastirma.nth(0)).toHaveAttribute('data-tone', 'secili');
    await expect(page.locator('#nakit-tablo')).toContainText('kötümser');
    expect(await page.evaluate(() => localStorage.getItem('istoc-plan-senaryo'))).toBe('kotumser');
    // Karşılaştırma satırındaki giriş toplamı özetle aynı (sütun başlıkla bulunur: ölçüt sırası riske göre).
    const girisSutunu = (await page.locator('.table-block:has(#senaryo-karsilastirma-tablo) thead th').allTextContents()).findIndex((t) => t.trim() === 'Nakit girişi') - 1;
    const satirGiris = sayi((await karsilastirma.nth(0).locator('td').nth(girisSutunu).textContent()) ?? '0');
    expect(satirGiris).toBe(kotumser);
    // Üçü üst üste: tek grafik kutusu, türü değişir.
    const canvas = page.locator('.chart-canvas');
    await expect(canvas).toHaveAttribute('data-kind', 'nakit-ay');
    await page.getByRole('group', { name: 'Görünüm' }).getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(canvas).toHaveAttribute('data-kind', 'kumulatif-tl');
    await expect(canvas.locator('svg')).toBeVisible({ timeout: 10_000 });
    await expect(canvas).toHaveCount(1);
  });

  for (const width of [320, 390, 1280]) {
    test(`${width} px: taşma yok, metin ≥ 14 px, grafik kesilmez (basit ve ayrıntılı)`, async ({ page }) => {
      await acikUc(page);
      await page.setViewportSize({ width, height: width < 400 ? 480 : 800 });
      await page.goto('nakit-akisi/');
      await icerik(page);
      await hydrated(page);
      await expect(page.locator('.nakit-kaynak')).toContainText('Google Sheets', { timeout: 10_000 });
      for (const ayrintili of [false, true]) {
        if (ayrintili) await page.getByRole('switch', { name: 'Ayrıntılı görünüm' }).click();
        const d = await duzen(page);
        expect(d.overflow, `${width} ${ayrintili ? 'ayrıntılı' : 'basit'} taşma`).toBeLessThanOrEqual(0);
        expect(d.small).toEqual([]);
        expect(d.headerOverflow).toEqual([]);
      }
      expect(await grafik(page), `${width}px grafik`).toEqual([]);
      await page.getByRole('group', { name: 'Görünüm' }).getByRole('button', { name: 'Üçü üst üste' }).click();
      await expect(page.locator('.chart-canvas')).toHaveAttribute('data-kind', 'kumulatif-tl');
      expect(await grafik(page), `${width}px üst üste grafik`).toEqual([]);
      const hit = await page.getByRole('switch', { name: 'Ayrıntılı görünüm' }).evaluate((el) => el.getBoundingClientRect().height);
      expect(hit).toBeGreaterThanOrEqual(44);
      const dugme = await page.locator('.secim-dugme').evaluateAll((els) => Math.min(...els.map((el) => el.getBoundingClientRect().height)));
      expect(dugme).toBeGreaterThanOrEqual(44);
    });
  }

  // ux.md §8.5 (PeriodExplorer, UX-03): 320 px’te 15 ay yatay uzatılmaz; her ay bir kayıttır (kayıt ekseni sütun).
  // Başlıkta ayın adı ve dönem sonu nakit; açılan panelde kalemler etiketli; Toplam sütunu da bir kayıt. Değerler 1280
  // px tablosuyla aynı (bilgi eşdeğerliği, UX-02).
  test('320 px: aylık tablo ay başına kayıt; 15 ay + Toplam; özet dönem sonu nakit; alanlar 1280 px tablosuyla aynı', async ({ page }) => {
    await acikUc(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.nakit-kaynak')).toContainText('Google Sheets', { timeout: 10_000 });
    const blok = page.locator('.table-block:has(#nakit-tablo)');
    const t = (s: string) => s.replace(/\s+/g, ' ').trim();
    const tablo = await blok.evaluate((el) => {
      const txt = (n: Element | null | undefined) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
      return {
        headers: [...el.querySelectorAll('thead th')].map(txt),
        rows: [...el.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map(txt)),
      };
    });
    expect(tablo.headers.length).toBe(17); // Kalem + 15 ay + Toplam
    await page.setViewportSize({ width: 320, height: 480 });
    await expect(blok.locator('.table-scroll')).toHaveCount(0);
    const kayitlar = blok.locator('.kayit');
    await expect(kayitlar).toHaveCount(16);
    await expect(kayitlar.first().locator('.kayit-ad')).toHaveText(tablo.headers[1]);
    await expect(kayitlar.last().locator('.kayit-ad')).toHaveText('Toplam');
    // Özet: son satır (dönem sonu nakit); alanlar: diğer satırlar aynı sırayla.
    const son = tablo.rows[tablo.rows.length - 1];
    await expect(kayitlar.first().locator('.kayit-ozet-etiket')).toHaveText(t(son[0]));
    await expect(kayitlar.first().locator('.kayit-ozet-deger')).toHaveText(t(son[1]));
    const beklenen = tablo.headers.slice(1).map((ay, c) => ({ title: ay, fields: [[son[0], son[c + 1]], ...tablo.rows.slice(0, -1).map((r) => [r[0], r[c + 1]])] }));
    const okunan = await kayitlar.evaluateAll((els) =>
      els.map((k) => {
        const txt = (n: Element | null | undefined) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
        const fields = [[txt(k.querySelector('.kayit-ozet-etiket')), txt(k.querySelector('.kayit-ozet-deger'))]];
        for (const div of k.querySelectorAll('dl.kayit-alanlar > div')) fields.push([txt(div.querySelector('dt')), txt(div.querySelector('dd'))]);
        return { title: txt(k.querySelector('.kayit-ad')), fields };
      }),
    );
    expect(okunan).toEqual(beklenen);
    // ux_v2.md §3.1: bakiye toplanmaz ama Toplam kaydının özeti boş kalmaz — açıklamalı metin.
    await expect(kayitlar.last().locator('.kayit-ozet-deger')).toContainText(/toplanmaz/i);
    // Bir ay açılır: panel region, alanlar görünür; ayrıntılı görünüm kayıt sayısını değil alan sayısını artırır.
    const ilk = kayitlar.first().locator('h4 button');
    await ilk.click();
    await expect(ilk).toHaveAttribute('aria-expanded', 'true');
    await expect(kayitlar.first().locator('dl.kayit-alanlar')).toBeVisible();
    const basit = await kayitlar.first().locator('dl.kayit-alanlar dt').count();
    await page.getByRole('switch', { name: 'Ayrıntılı görünüm' }).click();
    await expect(kayitlar).toHaveCount(16);
    expect(await kayitlar.first().locator('dl.kayit-alanlar dt').count()).toBeGreaterThan(basit);
    await expect(ilk).toHaveAttribute('aria-expanded', 'true');
  });

  /*
   * ux.md M05 ResultSummary (P6.2, kullanıcı kararı 2026-10-27): nakit açığı tavanı — dönem, birim ve üç senaryo kıyasıyla —
   * Özet bölümünden önce, 320×480’de ilk ekranda; durum (nakit ne zaman sıfırın altına iner, toparlanır mı) gizlenmez;
   * seçici değişince güncellenir; değer özet kutusu ve karşılaştırma tablosuyla aynı (tek kaynak).
   */
  test('ana sonuç (M05): nakit açığı tavanı özet bölümünden önce; dönem, birim, üç senaryo kıyası; seçiciyle değişir; 320×480 ilk ekranda', async ({ page }) => {
    await acikUc(page);
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.nakit-kaynak')).toContainText('Google Sheets', { timeout: 10_000 });
    const sonuc = page.locator('.sonuc');
    await expect(sonuc).toHaveCount(1);
    expect(await page.evaluate(() => document.querySelector('.sonuc')!.getBoundingClientRect().top < document.querySelector('#ozet')!.getBoundingClientRect().top)).toBe(true);
    const deger = sonuc.locator('.sonuc-deger');
    await expect(deger).toContainText('₺');
    const kutu = await deger.evaluate((el) => el.getBoundingClientRect());
    expect(kutu.bottom, 'ana sonuç kaydırmadan tam görünür').toBeLessThanOrEqual(480);
    await expect(sonuc.locator('.sonuc-etiket')).toContainText('Nakit açığı tavanı');
    await expect(sonuc.locator('.sonuc-donem')).toContainText('Ekim 2026 – Aralık 2027');
    await expect(sonuc.locator('.sonuc-durum')).toBeVisible();
    // Ton değerle tutarlı: açık 0 ₺ ise iyi, değilse uyarı (toparlanıyor) ya da risk (dönem içinde toparlanmıyor).
    const ton = await sonuc.locator('.sonuc-durum').getAttribute('data-ton');
    expect(ton).toBe((await deger.textContent())?.trim() === '0 ₺' ? 'iyi' : ton === 'risk' ? 'risk' : 'uyari');
    if (ton !== 'iyi') await expect(sonuc.locator('.sonuc-durum')).toContainText(/en düşük noktasına iner|sıfırın altına iner/);
    await expect(sonuc.locator('.sonuc-kaynak')).toContainText('Sheets');
    const kiyas = sonuc.locator('.sonuc-kiyas dl > div');
    await expect(kiyas).toHaveCount(3);
    await expect(kiyas.locator('dt')).toContainText([/Kötümser/, /Medyan/, /İyimser/]);
    await expect(sonuc.locator('.sonuc-kiyas dl > div[data-secili] dt')).toContainText('Medyan');
    // Tek kaynak: özet kutusu ve karşılaştırma tablosundaki seçili satır aynı değer.
    const t = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim();
    const kutuDeger = t(await page.locator('.stat', { hasText: 'Nakit açığı tavanı' }).locator('.stat-value').textContent());
    expect(t(await deger.textContent())).toBe(kutuDeger);
    expect(t(await kiyas.nth(1).locator('dd').textContent())).toBe(kutuDeger);
    // Sonuç bloğundaki seçici senaryoyu değiştirir: işaret ve değer kötümsere döner.
    await sonuc.getByRole('group', { name: 'Senaryo' }).getByRole('button', { name: 'Kötümser' }).click();
    await expect(sonuc.locator('.sonuc-kiyas dl > div[data-secili] dt')).toContainText('Kötümser');
    await expect(deger).toHaveText(t(await kiyas.nth(0).locator('dd').textContent()));
    await expect(page.locator('.stat', { hasText: 'Nakit açığı tavanı' }).locator('.stat-value')).toHaveText(t(await deger.textContent()));
    await page.evaluate(() => localStorage.removeItem('istoc-plan-senaryo'));
  });

  // ux_v2.md §3.1 (seçilen C): dar ekranda senaryo kıyası ölçüt bazlıdır — her ölçüt bir kayıt, başlıkta seçili senaryonun
  // değeri, açılan panelde üç senaryo art arda; ilk ölçüt likidite riski (en düşük nakit), gelir değil.
  test('320 px: senaryo kıyası ölçüt başına kayıt; ilk kayıt en düşük nakit; özet seçili senaryo; panelde üç senaryo', async ({ page }) => {
    await acikUc(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.nakit-kaynak')).toContainText('Google Sheets', { timeout: 10_000 });
    const blok = page.locator('.table-block:has(#senaryo-karsilastirma-tablo)');
    const tablo = await blok.evaluate((el) => {
      const txt = (n: Element | null | undefined) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
      return { headers: [...el.querySelectorAll('thead th')].map(txt), rows: [...el.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map(txt)) };
    });
    expect(tablo.headers[1]).toBe('En düşük nakit');
    expect(tablo.headers[2]).toBe('Nakit açığı tavanı');
    expect(tablo.rows.map((r) => r[0])).toEqual(['Kötümser', 'Medyan', 'İyimser']);
    await page.setViewportSize({ width: 320, height: 480 });
    const kayitlar = blok.locator('.kayit');
    await expect(kayitlar).toHaveCount(tablo.headers.length - 1);
    await expect(kayitlar.first().locator('.kayit-ad')).toHaveText('En düşük nakit');
    await expect(kayitlar.first().locator('.kayit-ozet-etiket')).toHaveText('Medyan');
    await expect(kayitlar.first().locator('.kayit-ozet-deger')).toHaveText(tablo.rows[1][1]);
    const alanlar = await kayitlar.first().locator('dl.kayit-alanlar > div').evaluateAll((divs) => divs.map((d) => [d.querySelector('dt')?.textContent?.trim(), d.querySelector('dd')?.textContent?.replace(/\s+/g, ' ').trim()]));
    expect(alanlar).toEqual(tablo.rows.map((r) => [r[0], r[1]]));
  });

  test('Sheets okunamazsa tablo plan kalemleriyle kalır ve Giderler sayfasına yönlendirir', async ({ page }) => {
    await page.route('https://script.google.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false, hata: 'yetki', mesaj: 'test' }) }),
    );
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.nakit-kaynak')).toContainText('erişim anahtarı', { timeout: 10_000 });
    await expect(page.locator('.nakit-kaynak').getByRole('link', { name: 'Giderler sayfası' })).toHaveAttribute('href', /\/giderler\/$/);
    // Ana sonuç eksik Sheets verisini tam plan gibi göstermez (ux.md §9).
    await expect(page.locator('.sonuc-kaynak')).toContainText('okunamadı');
    await page.getByRole('switch', { name: 'Ayrıntılı görünüm' }).click();
    await expect(page.locator('.data-table tbody th', { hasText: 'Bordrolu personel' })).toHaveCount(0);
    await expect(page.locator('.data-table tbody th', { hasText: 'Meta reklamları' })).toHaveCount(1);
    await expect(page.locator('.table-block:has(#senaryo-karsilastirma-tablo) tbody tr')).toHaveCount(3);
  });
});
