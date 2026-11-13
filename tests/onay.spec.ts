import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures/persona';

/**
 * İki adımlı onay (iskelet sözleşmesi, 13 Kasım 2026). Veri silen ya da sıfırlayan her düğme ortak `OnayDugmesi`
 * bileşenini kullanır:
 * - İlk basış veriyi değiştirmez. Düğmenin yazısı onay cümlesine döner, yanında “Vazgeç” çıkar.
 * - Onay süreye bağlı değildir. İkinci basış işi yapar. “Vazgeç” onayı kapatır.
 * - Onay bekleyen düğme her sayfada aynı uyarı tonundadır.
 * - Tarayıcının onay penceresi (`window.confirm`) hiçbir yerde açılmaz.
 */

const SRC = join(process.cwd(), 'src');
const dosyalar = (k: string): string[] => readdirSync(k, { withFileTypes: true }).flatMap((g) => (g.isDirectory() ? dosyalar(join(k, g.name)) : [join(k, g.name)]));

test('kaynakta tarayıcı onay penceresi yok', ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'kaynak denetimi tarayıcıdan bağımsızdır');
  const bulunan = dosyalar(SRC)
    .filter((f) => /\.(tsx?|astro|m?js)$/.test(f))
    .filter((f) => /\b(window|globalThis|self)\.confirm\s*\(|(^|[^.\w])confirm\s*\(/m.test(readFileSync(f, 'utf8')))
    .map((f) => f.replace(SRC, 'src'));
  expect(bulunan).toEqual([]);
});

/** Onay bekleyen düğmenin zemini uyarı tokenıyla aynı mı? Token sayfada ölçülür. */
async function uyariTonunda(page: Page, dugme: ReturnType<Page['locator']>) {
  const [zemin, token] = await Promise.all([
    dugme.evaluate((e) => getComputedStyle(e).backgroundColor),
    page.evaluate(() => {
      const o = document.createElement('div');
      o.style.backgroundColor = 'var(--status-bekliyor-bg)';
      document.body.append(o);
      const v = getComputedStyle(o).backgroundColor;
      o.remove();
      return v;
    }),
  ]);
  return zemin === token;
}

async function ikiAdim(page: Page, ad: string | RegExp, onay: string | RegExp) {
  let pencere = false;
  page.on('dialog', async (d) => {
    pencere = true;
    await d.dismiss();
  });
  const dugme = page.getByRole('button', { name: ad }).first();
  await dugme.click();
  const onayDugmesi = page.getByRole('button', { name: onay });
  await expect(onayDugmesi, 'ilk basış onay ister').toBeVisible();
  // Zemin hareket tokenıyla geçer. Geçiş bitince uyarı tonundadır.
  await expect.poll(() => uyariTonunda(page, onayDugmesi), { message: 'onay bekleyen düğme uyarı tonunda' }).toBe(true);
  // Uzun onay cümlesi satır sarabilir. Yazı uyarı zemininin kenarına değmez (iç boşluk kuralı: yatay 8, dikey 3 px).
  const pay = await onayDugmesi.evaluate((b) => {
    const r = b.getBoundingClientRect();
    const aralik = document.createRange();
    aralik.selectNodeContents(b);
    const satirlar = [...aralik.getClientRects()].filter((x) => x.width > 0 && x.height > 0);
    return {
      ust: Math.min(...satirlar.map((x) => x.top)) - r.top,
      alt: r.bottom - Math.max(...satirlar.map((x) => x.bottom)),
      sol: Math.min(...satirlar.map((x) => x.left)) - r.left,
      sag: r.right - Math.max(...satirlar.map((x) => x.right)),
    };
  });
  expect(pay.ust, 'üstte boşluk').toBeGreaterThanOrEqual(3);
  expect(pay.alt, 'altta boşluk').toBeGreaterThanOrEqual(3);
  expect(Math.min(pay.sol, pay.sag), 'yanlarda boşluk').toBeGreaterThanOrEqual(8);
  await page.getByRole('button', { name: 'Vazgeç' }).click();
  await expect(page.getByRole('button', { name: onay }), 'Vazgeç onayı kapatır').toHaveCount(0);
  await expect(page.getByRole('button', { name: ad }).first(), 'odak ana düğmeye döner').toBeFocused();
  await expect(page.getByRole('button', { name: 'Vazgeç' })).toHaveCount(0);
  await page.getByRole('button', { name: ad }).first().click();
  await page.getByRole('button', { name: onay }).click();
  await expect(page.getByRole('button', { name: onay }), 'ikinci basış işi yapar ve onayı kapatır').toHaveCount(0);
  expect(pencere, 'tarayıcı onay penceresi açılmaz').toBe(false);
}

for (const genislik of [320, 1280]) test(`kararlar ${genislik} px: “Bütün seçimleri ve notları sil” iki adımlıdır`, async ({ page }) => {
  await page.setViewportSize({ width: genislik, height: 900 });
  await page.goto('karar/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const panel = page.locator('.ks-soru-panel');
  await panel.getByRole('radio', { name: /1 Kasım Pazar kalsın/ }).click();
  await expect(page.locator('.ks-ilerleme-metin')).toContainText('sorudan 1 tanesi cevaplandı');
  await page.getByRole('button', { name: 'Bütün seçimleri ve notları sil' }).click();
  await expect(page.locator('.ks-ilerleme-metin'), 'ilk basış silmez').toContainText('sorudan 1 tanesi cevaplandı');
  await page.getByRole('button', { name: 'Vazgeç' }).click();
  await ikiAdim(page, 'Bütün seçimleri ve notları sil', /bütün seçimleri ve notları sil \(onayla\)/i);
  await expect(page.locator('.ks-ilerleme-metin'), 'onaydan sonra silinir').toContainText('sorudan 0 tanesi cevaplandı');
});

for (const genislik of [1024, 1512]) test(`satış ortaklığı 1. sürüm ${genislik} px: “Başa dön” sayfa içinde onay ister, onaydan önce veri değişmez`, async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'sayfa şimdilik yalnız masaüstü Chrome için (2026-11-03)');
  await page.setViewportSize({ width: genislik, height: 945 });
  await page.goto('satis-ortakligi/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('tab', { name: /Kadrolu/ }).click();
  const maas = page.getByRole('textbox', { name: 'Aylık maaş' });
  const sonuc = page.locator('.so2-sonuc-deger');
  const once = await sonuc.textContent();
  await maas.fill('61000');
  await expect(sonuc).not.toHaveText(once ?? '');
  const degisik = (await sonuc.textContent()) ?? '';
  await page.getByRole('button', { name: 'Başa dön' }).click();
  await expect(sonuc, 'ilk basış veriyi değiştirmez').toHaveText(degisik);
  await page.getByRole('button', { name: 'Vazgeç' }).click();
  await ikiAdim(page, 'Başa dön', /ortak ayarlarını varsayılana döndür \(onayla\)/);
  await expect(sonuc, 'onaydan sonra ayarlar varsayılana döner').toHaveText(once ?? '');
});

test('satış ortaklığı 2. sürüm: “Başa dön” onay ister, onaydan önce veri değişmez', async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 945 });
  await page.goto('satis-ortakligi/?surum=v2');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const basic = page.getByRole('textbox', { name: /Basic paket/ }).first();
  await basic.fill('7');
  await basic.blur();
  await page.getByRole('button', { name: 'Başa dön' }).click();
  await expect(basic, 'ilk basış veriyi değiştirmez').toHaveValue('7');
  await page.getByRole('button', { name: 'Vazgeç' }).click();
  await ikiAdim(page, 'Başa dön', /bu sürümün ayarlarını varsayılana döndür \(onayla\)/i);
  await expect(basic, 'onaydan sonra ayarlar varsayılana döner').not.toHaveValue('7');
});

test('notlar: silme ve varsayılana dönme aynı onay tonunu kullanır', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('notlar/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await ikiAdim(page, 'Varsayılan notlara dön', 'Varsayılan notlara dön (onayla)');
});
