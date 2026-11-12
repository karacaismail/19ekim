import { expect, test, type Page } from './fixtures/persona';
import { PLAN_ROLLERI } from '../src/data/istihdamPlani';
import { SECENEK_OZETI } from '../src/data/istihdamV2';

/**
 * İstihdam takvimi v2 (kullanıcı kararı 2026-11-05): /istihdam/ sayfasında sürüm seçici. v1 bugünkü takvimdir ve
 * varsayılandır. v2 2027 kadro planını üç seçenekle gösterir, mevcut rolleri “Eski” hapıyla etiketler. Ortak sayfa
 * denetimleri (ui.spec.ts) yalnız v1'i gezer. Bu yüzden v2 için taşma, yazı boyutu ve dokunma hedefi burada denetlenir.
 */

async function ac(page: Page, genislik: number, adres = 'istihdam/?surum=v2') {
  await page.setViewportSize({ width: genislik, height: 900 });
  await page.goto(adres);
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}
const tl = (v: number) => `${new Intl.NumberFormat('tr-TR').format(Math.round(v))} ₺`;

test('varsayılan v1; sürüm seçici v2’ye geçer, adres ?surum=v2 olur, geri dönünce v1 korunur', async ({ page }) => {
  await ac(page, 1280, 'istihdam/');
  const surum = page.getByRole('group', { name: 'Sürüm' });
  await expect(surum.getByRole('button', { name: 'v1' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#katki')).toHaveCount(1);
  await surum.getByRole('button', { name: 'v2' }).click();
  await expect(page).toHaveURL(/surum=v2/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('İstihdam takvimi');
  await expect(page.locator('#secenek')).toHaveCount(1);
  await expect(page.locator('#katki')).toHaveCount(0);
  await surum.getByRole('button', { name: 'v1' }).click();
  await expect(page.locator('#katki')).toHaveCount(1);
});

test('seçenek değişince özet, takvim ve tablolar değişir; varsayılan medyan', async ({ page }) => {
  await ac(page, 1280);
  const secim = page.getByRole('group', { name: 'Seçenek' });
  await expect(secim.getByRole('button', { name: 'Medyan' })).toHaveAttribute('aria-pressed', 'true');
  const stats = page.locator('#secenek .stats');
  await expect(stats).toContainText(`${SECENEK_OZETI.medyan.toplamKisi} kişi`);
  await expect(stats).toContainText(tl(SECENEK_OZETI.medyan.toplamMaliyet2027));
  await secim.getByRole('button', { name: 'Güçlü' }).click();
  await expect(stats).toContainText(`${SECENEK_OZETI.guclu.toplamKisi} kişi`);
  await expect(page.locator('#takvim')).toContainText('Güçlü seçeneği, ay ay');
  await expect(page.locator('#secenekler-tablo, #karsilastirma table tr[data-tone="secili"]').first()).toBeVisible();
});

test('mevcut takvimdeki her rol “Eski” hapıyla görünür; ayrıntı penceresi gerekçe ve nitelikleri açar, odak döner', async ({ page }) => {
  await ac(page, 1280);
  const pozisyonlar = page.locator('#pozisyonlar');
  await expect(pozisyonlar.locator('.chip.iv2-eski')).toHaveCount(PLAN_ROLLERI.length);
  for (const r of PLAN_ROLLERI) await expect(pozisyonlar.getByRole('rowheader', { name: new RegExp(r.ad.replace('.', '\\.')) })).toContainText('Eski');
  const dugme = pozisyonlar.getByRole('button', { name: 'Satıcı uyum (onboarding) uzmanı: gerekçe ve nitelikler' });
  await dugme.focus();
  await page.keyboard.press('Enter');
  const pencere = page.getByRole('dialog');
  await expect(pencere).toBeVisible();
  await expect(pencere.getByRole('heading', { name: 'Neden gerekli' })).toBeVisible();
  await expect(pencere.getByRole('heading', { name: 'Aranan nitelikler' })).toBeVisible();
  await expect(pencere.locator('.iv2-secenek-listesi li')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(pencere).toBeHidden();
  await expect(dugme).toBeFocused();
});

test('küme süzgeci tek kümeyi gösterir', async ({ page }) => {
  await ac(page, 1280);
  const tablolar = page.locator('#pozisyonlar .table-block, #pozisyonlar .iv2-kume-bos');
  await expect(tablolar).toHaveCount(11);
  await page.getByRole('group', { name: 'Küme' }).getByRole('combobox').click();
  await page.getByRole('option', { name: 'Finans ve muhasebe' }).click();
  await expect(tablolar).toHaveCount(1);
  await expect(tablolar.first()).toContainText('Finans ve muhasebe');
});

for (const genislik of [320, 390, 768]) {
  test(`${genislik} px: v2’de yatay taşma yok, metin ≥ 14 px, ağırlık ≥ 300, dokunma hedefi ≥ 44 px, başlık sırası atlamaz`, async ({ page }) => {
    await ac(page, genislik);
    const sonuc = await page.evaluate(() => {
      const gorunur = (el: Element) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
      const metinli = [...document.querySelectorAll('body *')].filter((el) => gorunur(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()) && !el.closest('.visually-hidden'));
      const kucuk = metinli.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14).map((el) => el.className);
      const ince = metinli.filter((el) => Number(getComputedStyle(el).fontWeight) < 300).map((el) => el.className);
      const hedef = [...document.querySelectorAll<HTMLElement>('#secenek button, #pozisyonlar button, #varsayimlar a')]
        .filter(gorunur)
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width < 43.5 || r.height < 43.5).length;
      const duzeyler = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(gorunur).map((h) => Number(h.tagName[1]));
      const atlama = duzeyler.some((d, i) => i > 0 && d > duzeyler[i - 1] + 1);
      return { tasma: document.documentElement.scrollWidth - window.innerWidth, kucuk, ince, hedef, atlama };
    });
    expect(sonuc.tasma).toBeLessThanOrEqual(0);
    expect(sonuc.kucuk).toEqual([]);
    expect(sonuc.ince).toEqual([]);
    expect(sonuc.hedef).toBe(0);
    expect(sonuc.atlama).toBe(false);
  });
}

test('320 px: ayrıntı penceresi tam ekran, taşma yok', async ({ page }) => {
  await ac(page, 320);
  const pozisyonlar = page.locator('#pozisyonlar');
  // Dar ekranda tablo kayıt listesidir: kayıt açılır, ayrıntı düğmesi paneldedir.
  const kayit = pozisyonlar.locator('.kayit').first();
  await kayit.locator('.kayit-h button').click();
  await kayit.getByRole('button', { name: /gerekçe ve nitelikler/ }).click();
  const pencere = page.getByRole('dialog');
  await expect(pencere).toBeVisible();
  await expect.poll(() => pencere.evaluate((el) => Math.round(el.getBoundingClientRect().width))).toBe(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});
