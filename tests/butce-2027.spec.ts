import { expect, test, type Page } from './fixtures/persona';
import { BEKLENEN_SHEETS, butce, tabanOf, toplam } from '../src/data/butce2027';
import { buildModel, reply } from './opex-fixture';

/**
 * 2027 bütçesi sayfası (kullanıcı kararı 2026-11-05): Finans menüsünde. Taban Sheets'ten okunur (testte kurgusal örnek
 * veriyle sahte yanıt). Seçenek ve politika anahtarları toplamları değiştirir. Sheets okunamazsa sayfa bunu yazar ve
 * yalnız eklemeleri gösterir.
 */

const MODEL = buildModel();
const TABAN = tabanOf(MODEL);
const milyon = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v / 1_000_000)} milyon ₺`;

async function ac(page: Page, genislik = 1280, veri = true) {
  await page.route('https://script.google.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(veri ? reply(MODEL, 'ozet-1') : { ok: false, hata: 'yetki', mesaj: 'test' }),
    }),
  );
  await page.setViewportSize({ width: genislik, height: 900 });
  await page.goto('butce-2027/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}

test('Finans menüsünde; başlık ve sekme başlığı kayıtla aynı', async ({ page }) => {
  await ac(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2027 bütçesi: OPEX ve CAPEX');
  await page.getByRole('button', { name: 'Finans' }).click();
  await expect(page.getByRole('menu', { name: 'Finans' }).getByRole('menuitem', { name: '2027 bütçesi' })).toHaveAttribute('aria-current', 'page');
});

test('Sheets tabanıyla toplamlar modelle aynı; seçenek değişince değişir', async ({ page }) => {
  await ac(page);
  const stats = page.locator('#secenek .stats');
  const medyan = butce(TABAN, 'medyan');
  await expect(stats).toContainText(milyon(toplam(medyan.opex)));
  await expect(stats).toContainText(milyon(toplam(medyan.capex)));
  await expect(page.locator('#ozet')).toContainText('Mevcut plan (Sheets)');
  await page.getByRole('group', { name: 'Kadro seçeneği' }).getByRole('button', { name: 'Güçlü' }).click();
  await expect(stats).toContainText(milyon(toplam(butce(TABAN, 'guclu').opex)));
  const ciftSayim = TABAN.bordrolu !== BEKLENEN_SHEETS.bordrolu || TABAN.faturali !== BEKLENEN_SHEETS.faturali;
  await expect(page.getByText(/iki kez sayılıyor olabilir/)).toHaveCount(ciftSayim ? 1 : 0);
});

test('yemek kartı anahtarı kalemi ekler ve OPEX’i artırır; klavyeyle çalışır', async ({ page }) => {
  await ac(page);
  const anahtar = page.getByRole('switch', { name: 'Yemek kartı' });
  await expect(anahtar).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('#kalemler')).not.toContainText('Bütün bordrolu kadroya, günlük istisna');
  await anahtar.focus();
  await page.keyboard.press('Space');
  await expect(anahtar).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#kalemler')).toContainText('Bütün bordrolu kadroya, günlük istisna');
  await expect(page.locator('#secenek .stats')).toContainText(milyon(toplam(butce(TABAN, 'medyan', { yemek: true, saglik: false }).opex)));
});

test('Sheets okunamazsa uyarı yazılır, taban yoktur, eklemeler hesaplanır', async ({ page }) => {
  await ac(page, 1280, false);
  await expect(page.getByRole('alert')).toContainText('okunamadı');
  await expect(page.locator('#ozet')).not.toContainText('Mevcut plan (Sheets)');
  await expect(page.locator('#secenek .stats')).toContainText(milyon(toplam(butce(null, 'medyan').opex)));
});

for (const genislik of [320, 390, 768]) {
  test(`${genislik} px: veriyle yatay taşma yok, metin ≥ 14 px, dokunma hedefi ≥ 44 px`, async ({ page }) => {
    await ac(page, genislik);
    await expect(page.locator('#ozet')).toContainText('Mevcut plan (Sheets)');
    const sonuc = await page.evaluate(() => {
      const gorunur = (el: Element) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
      const metinli = [...document.querySelectorAll('body *')].filter((el) => gorunur(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()) && !el.closest('.visually-hidden'));
      const hedef = [...document.querySelectorAll<HTMLElement>('main button, main a[href], main [role="switch"]')]
        .filter(gorunur)
        .filter((el) => !(el.tagName === 'A' && getComputedStyle(el).display === 'inline'))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width < 43.5 || r.height < 43.5).length;
      return {
        tasma: document.documentElement.scrollWidth - window.innerWidth,
        kucuk: metinli.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14).length,
        hedef,
      };
    });
    expect(sonuc).toEqual({ tasma: 0, kucuk: 0, hedef: 0 });
  });
}
