import { expect, test } from './fixtures/persona';
import { ASAMALAR, OLAYLAR } from '../src/data/istihdamPlani';

/** İstihdam takvimi ve Kadro kapasitesi (kullanıcı kararı 2026-11-03): dar ve geniş ekranda taşma yok, metin ≥ 14 px. */
for (const [yol, ad] of [
  ['istihdam/', 'İstihdam takvimi'],
  ['kadro-kapasitesi/', 'Kadro kapasitesi'],
] as const) {
  for (const genislik of [320, 390, 768, 1512]) {
    test(`${ad} ${genislik} px: taşma yok, metin en az 14 px`, async ({ page }) => {
      await page.setViewportSize({ width: genislik, height: 900 });
      await page.goto(yol);
      await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(ad);
      if (yol === 'istihdam/') await page.getByRole('button', { name: 'Takvim', exact: true }).click();
      const olcum = await page.evaluate(() => ({
        tasma: document.documentElement.scrollWidth - innerWidth,
        kucuk: [...document.querySelectorAll<HTMLElement>('main *')]
          .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
          .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14 || Number(getComputedStyle(e).fontWeight) < 300)
          .map((e) => (typeof e.className === 'string' ? e.className : e.tagName)),
      }));
      expect(olcum.tasma).toBeLessThanOrEqual(0);
      expect(olcum.kucuk).toEqual([]);
    });
  }
}

test('Kadro kapasitesi: 7 rol ve yönetici, kapasite aşımı, 15 karar, 14 ek rol', async ({ page }) => {
  await page.goto('kadro-kapasitesi/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('.tk-rol')).toHaveCount(8);
  await expect(page.locator('.tk-rol').filter({ hasText: 'İstoç Pazarlama CRM uzmanı' })).toContainText('Kapasiteyi %26 aşar.');
  await expect(page.locator('.tk-karar')).toHaveCount(15);
  await expect(page.locator('.tk-ek-rol')).toHaveCount(14);
});

/**
 * Sorumlu (kullanıcı kararı 16 Kasım 2026, karar listesi 4. konu): güncel planın her aşaması ve her olayı sorumlusunu
 * gösterir. Eylem planı listesi, zaman çizelgesi, aşama çubuklarının ipucu ve takvimin ay listesi aynı veriyi okur.
 * 375 px genişlikte sayfa yana taşmaz.
 */
test('Sorumlu: güncel plan, zaman çizelgesi, aşama ipucu ve takvim listesi her adımın sorumlusunu gösterir', async ({ page }) => {
  const sorumlusu = (sec: string, ad: string) =>
    page.locator(sec).evaluateAll(
      (els, ad) =>
        els.map((e) => [
          (e.querySelector(ad)?.firstChild?.textContent ?? '').trim(),
          [...e.querySelectorAll('.tk-karar-kim > div')].filter((d) => d.querySelector('dt')?.textContent?.trim() === 'Sorumlu').map((d) => d.querySelector('dd')?.textContent?.trim() ?? '').join(' | '),
        ]),
      ad,
    );
  const tasma = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.clock.setFixedTime(new Date('2026-11-20T10:00:00+03:00'));
  await page.setViewportSize({ width: 375, height: 800 });

  await page.goto('eylem-plani/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const guncel = [...ASAMALAR.filter((a) => a.id.startsWith('f')).map((a) => [a.ad, a.sorumlu]), ...OLAYLAR.map((o) => [o.baslik, o.sorumlu])];
  expect(Object.fromEntries(await sorumlusu('#guncel .tk-karar', '.tk-karar-konu'))).toEqual(Object.fromEntries(guncel));
  expect(await tasma()).toBeLessThanOrEqual(0);

  await page.goto('istihdam/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  expect(await sorumlusu('.tk-olay', '.tk-olay-baslik')).toEqual(OLAYLAR.map((o) => [o.baslik, o.sorumlu]));
  const ipuclari = await page.locator('.tk-gantt-satir title').allTextContents();
  expect(ipuclari).toHaveLength(ASAMALAR.length);
  ASAMALAR.forEach((a, i) => expect(ipuclari[i], a.ad).toContain(`Bu işten ${a.sorumlu} sorumludur.`));
  expect(await tasma()).toBeLessThanOrEqual(0);

  // Takvim, bugünün ayında (Kasım 2026) açılır. Dar ekranda ayın olayları liste olarak da görünür.
  await page.getByRole('button', { name: 'Takvim', exact: true }).click();
  const kasim = OLAYLAR.filter((o) => o.tarih.startsWith('2026-11'));
  await expect(page.locator('.tk-ajanda li')).toHaveCount(kasim.length);
  expect(await sorumlusu('.tk-ajanda li', '.tk-ajanda-baslik')).toEqual(kasim.map((o) => [o.baslik, o.sorumlu]));
  expect(await tasma()).toBeLessThanOrEqual(0);
});
