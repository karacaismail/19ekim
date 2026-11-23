import { existsSync, statSync } from 'node:fs';
import { expect, test, type Page } from './fixtures/persona';
import { INDIRILECEKLER, baglantiMetni } from '../src/data/politikalar/indirilecekler';

/* İş ortaklığı tanıtım dosyaları rehber sayfasında tek tıkla indirilir (AGENTS.md "İş ortaklığı tanıtım dosyaları"). */
const PROJELER = ['istoc', 'segika'] as const;
const BEKLENEN = {
  istoc: ['indir/istoc/istoc-is-ortakligi-sunum.pptx', 'indir/istoc/istoc-is-ortakligi-el-kitapcigi.pdf', 'indir/istoc/istoc-is-ortakligi-gorsel-sunum.pdf'],
  segika: ['indir/segika/segika-is-ortakligi-sunum.pptx', 'indir/segika/segika-is-ortakligi-el-kitapcigi.pdf', 'indir/segika/segika-is-ortakligi-gorsel-sunum.pdf'],
};
const bolum = (page: Page) => page.getByRole('region', { name: 'Tanıtım dosyaları' });

test('liste her projede üç dosyayı doğru adla tutar', () => {
  for (const proje of PROJELER) expect(INDIRILECEKLER[proje].map((d) => d.dosya)).toEqual(BEKLENEN[proje]);
});

// Bu test dosyalar gelene kadar düşer. Dosyalar başka çalışma ağacında üretilir ve birleştirmede gelir.
test('listedeki her dosya public klasöründe vardır', () => {
  const eksik = PROJELER.flatMap((p) => INDIRILECEKLER[p]).map((d) => `public/${d.dosya}`)
    .filter((yol) => !existsSync(yol) || statSync(yol).size === 0);
  expect(eksik, 'public/ altında bulunmayan tanıtım dosyaları').toEqual([]);
});

for (const proje of PROJELER) {
  test(`${proje}: üç bağlantı doğru adres ve download taşır, başka projenin dosyası görünmez`, async ({ page }) => {
    await page.goto(`politikalar/?proje=${proje}&rol=cozum`);
    const linkler = bolum(page).getByRole('link');
    await expect(linkler).toHaveCount(3);
    await expect(linkler).toHaveText(INDIRILECEKLER[proje].map(baglantiMetni));
    for (const [i, yol] of BEKLENEN[proje].entries()) {
      await expect(linkler.nth(i)).toHaveAttribute('href', `/19ekim/${yol}`);
      await expect(linkler.nth(i)).toHaveAttribute('download', yol.split('/').at(-1)!);
    }
    const baska = proje === 'istoc' ? 'segika' : 'istoc';
    await expect(bolum(page).locator(`a[href*="/${baska}/"]`)).toHaveCount(0);
  });
}

test('bölüm bütün rol sekmelerinde rol sekmelerinin altında ve rehberin üstünde durur', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  for (const rol of ['Çözüm ortağı', 'Kadrolu uzman', 'Mevcut müşteri', 'Marka elçisi']) {
    await page.getByRole('tab', { name: rol, exact: true }).click();
    await expect(page.locator('.pol-yol')).toBeVisible();
    await expect(bolum(page).getByRole('link')).toHaveCount(3);
    const sira = await page.evaluate(() => {
      const roller = document.querySelector('[aria-label="Çalışma rolü"]')!;
      const indir = document.querySelector('.pol-indir')!;
      const yol = document.querySelector('.pol-yol')!;
      const once = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      return once(roller, indir) && once(indir, yol);
    });
    expect(sira).toBe(true);
  }
  await expect(page.locator('h1')).toHaveCount(1);
});

test('proje değişince bağlantılar o projenin dosyalarına geçer', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await expect(bolum(page).getByRole('link').first()).toHaveAttribute('href', `/19ekim/${BEKLENEN.istoc[0]}`);
  await page.getByRole('tab', { name: 'Segika', exact: true }).click();
  await expect(page).toHaveURL(/proje=segika/);
  const linkler = bolum(page).getByRole('link');
  await expect(linkler).toHaveCount(3);
  for (const [i, yol] of BEKLENEN.segika.entries()) await expect(linkler.nth(i)).toHaveAttribute('href', `/19ekim/${yol}`);
});

test('bağlantılara klavyeyle ulaşılır ve odak çevreleyen halka çizmez', async ({ page, browserName }) => {
  // macOS WebKit bağlantıya Tab ile değil, Alt+Tab ile gider (Safari varsayılanı). Komşu testler de böyle yapar.
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.goto('politikalar/?proje=segika&rol=cozum');
  const linkler = bolum(page).getByRole('link');
  await page.getByRole('tablist', { name: 'Çalışma rolü' }).getByRole('tab', { selected: true }).focus();
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press(tab);
    if (await linkler.first().evaluate((el) => el === document.activeElement)) break;
  }
  await expect(linkler.first()).toBeFocused();
  await page.keyboard.press(tab);
  await expect(linkler.nth(1)).toBeFocused();
  const stil = await linkler.nth(1).evaluate((el) => {
    const s = getComputedStyle(el);
    return { outline: s.outlineStyle, shadow: s.boxShadow };
  });
  expect(stil).toEqual({ outline: 'none', shadow: 'none' });
});

for (const genislik of [320, 390]) {
  test(`${genislik} px: bölüm ilk ekranda görünür, yazı 14 px altına inmez, sayfa yatay taşmaz`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: 720 });
    await page.goto('politikalar/?proje=istoc&rol=cozum');
    const linkler = bolum(page).getByRole('link');
    await expect(linkler).toHaveCount(3);
    const ilk = await bolum(page).getByRole('heading').boundingBox();
    expect(ilk && ilk.y + ilk.height).toBeLessThanOrEqual(720);
    const boyutlar = await bolum(page).locator('h2, p, a').evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
    expect(Math.min(...boyutlar)).toBeGreaterThanOrEqual(14);
    for (const h of await linkler.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) expect(h).toBeGreaterThanOrEqual(44);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
