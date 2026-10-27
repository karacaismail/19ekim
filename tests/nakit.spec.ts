import { expect, test, type Page } from '@playwright/test';
import { buildModel, reply } from './opex-fixture';

/**
 * Nakit akış tablosu (/nakit-akisi/): Sheets sahte yanıtla (kurgusal örnek tohum), girişler plan parametrelerinden.
 * Basit/ayrıntılı anahtar, Giderler menüsü, grafik ve dar ekran.
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
    await expect(nav.locator('.mainnav-link')).toHaveText([/^İstihdam/, /^Pazarlama/, /^Giderler/, 'Notlar']);
    const tetik = page.getByRole('button', { name: 'Giderler' });
    await expect(tetik).toHaveAttribute('data-section', 'true');
    await tetik.click();
    const menu = page.getByRole('menu', { name: 'Giderler' });
    await expect(menu.getByRole('menuitem')).toHaveText(['Giderler (OPEX)', 'Nakit akış tablosu']);
    await expect(menu.getByRole('menuitem', { name: 'Nakit akış tablosu' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');

    const tablo = page.locator('.data-table');
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
      const hit = await page.getByRole('switch', { name: 'Ayrıntılı görünüm' }).evaluate((el) => el.getBoundingClientRect().height);
      expect(hit).toBeGreaterThanOrEqual(44);
    });
  }

  test('Sheets okunamazsa tablo plan kalemleriyle kalır ve Giderler sayfasına yönlendirir', async ({ page }) => {
    await page.route('https://script.google.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false, hata: 'yetki', mesaj: 'test' }) }),
    );
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.nakit-kaynak')).toContainText('erişim anahtarı', { timeout: 10_000 });
    await expect(page.locator('.nakit-kaynak').getByRole('link', { name: 'Giderler sayfası' })).toHaveAttribute('href', /\/giderler\/$/);
    await page.getByRole('switch', { name: 'Ayrıntılı görünüm' }).click();
    await expect(page.locator('.data-table tbody th', { hasText: 'Bordrolu personel' })).toHaveCount(0);
    await expect(page.locator('.data-table tbody th', { hasText: 'Meta reklamları' })).toHaveCount(1);
  });
});
