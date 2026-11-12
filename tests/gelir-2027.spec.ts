import { expect, test, type Page } from './fixtures/persona';
import { ongoru } from '../src/data/gelir2027';

/**
 * 2027 gelir öngörüsü sayfası (kullanıcı kararı 2026-11-05): Finans menüsünde. Dört öngörü modelle aynıdır, kadro
 * seçeneği ve regl politikası hesabı değiştirir. Risk haritası 320 px'te kaymadan sığar.
 */
const milyon = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v / 1_000_000)} milyon ₺`;

async function ac(page: Page, genislik = 1280) {
  await page.setViewportSize({ width: genislik, height: 900 });
  await page.goto('gelir-ongorusu-2027/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}

test('dört öngörü modelle aynı; seçenek ve politika değişince değişir', async ({ page }) => {
  await ac(page);
  const stats = page.locator('#ongoru .stats');
  const o = ongoru('medyan', 'ikisi');
  for (const v of [o.gelir.kotumser, o.gelir.medyan, o.gelir.ortanca, o.gelir.iyimser]) await expect(stats).toContainText(milyon(v));
  await page.getByRole('group', { name: 'Kadro seçeneği' }).getByRole('button', { name: 'Güçlü' }).click();
  await expect(stats).toContainText(milyon(ongoru('guclu', 'ikisi').gelir.medyan));
  const politika = page.getByRole('group', { name: 'Regl politikası' });
  await politika.getByRole('button', { name: 'Politika yok' }).click();
  await expect(stats).toContainText(milyon(ongoru('guclu', 'yok').gelir.medyan));
});

test('saat dökümü 249 iş günü ve çavuş payını yazar; risk haritası ve listesi var', async ({ page }) => {
  await ac(page);
  await expect(page.locator('#saat')).toContainText('249 iş günü × 9 saat');
  await expect(page.locator('#saat')).toContainText('Çavuş payı');
  await expect(page.locator('.go27-harita tbody tr')).toHaveCount(5);
  await expect(page.locator('#harita')).toContainText('İşten ayrılma');
});

for (const genislik of [320, 390]) {
  test(`${genislik} px: risk haritası sığar, sayfa taşmaz`, async ({ page }) => {
    await ac(page, genislik);
    const kutu = page.locator('.go27-harita-kap');
    await kutu.scrollIntoViewIfNeeded();
    expect(await kutu.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
}
