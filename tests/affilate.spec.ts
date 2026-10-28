import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { baslangicKurgu } from '../src/data/affilateKurgu';

/**
 * Affilate sayfası (docs/affilate.md §12.2 U01–U19, §10.4; kullanıcı kararı 28 Ekim): gezinme, girdi sözleşmesi, 320 px
 * taban, karşılaştırma, aylık döküm, kayıt / dışa aktarım ve anlam testleri. Sayısal beklentiler belgedeki bağımsız
 * örneklerdir (§9); motor testleri tests/affilate-model.spec.ts’tedir.
 */

const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

async function ac(page: Page, hash = '') {
  await page.goto(`affilate/${hash ? `#${hash}` : ''}`);
  await icerik(page);
  await hydrated(page);
}

/** Markalı seçim kutusundan (Mantine Select) seçenek seçer. */
async function sec(page: Page, ad: string, secenek: string) {
  await page.getByRole('combobox', { name: ad }).click();
  await page.getByRole('option', { name: secenek, exact: true }).click();
}

/** Uyarlanır Choice: segment / kısa liste (düğme) ya da markalı seçim kutusu — sunuma göre seçer. */
async function choiceSec(page: Page, ad: string, secenek: string) {
  const grup = page.getByRole('group', { name: ad });
  const dugme = grup.getByRole('button', { name: secenek, exact: true });
  if (await dugme.count()) await dugme.click();
  else {
    await grup.getByRole('combobox').click();
    await page.getByRole('option', { name: secenek, exact: true }).click();
  }
}

const anaDeger = (page: Page) => page.locator('#af-sonuc .sonuc-deger');
const ortakPaneli = (page: Page, ad: string) => page.getByRole('region', { name: new RegExp(`^${ad}`) });

async function ortakPaneliniAc(page: Page, ad: string) {
  const dugme = page.locator('.af-ortaklar').getByRole('button', { name: new RegExp(`^${ad}`) });
  if ((await dugme.getAttribute('aria-expanded')) !== 'true') await dugme.click();
  await expect(ortakPaneli(page, ad)).toBeVisible();
}

test.describe('Affilate — gezinme ve ilk ekran', () => {
  test('U01: Pazarlama menüsünden Affilate açılır; aktif menü, başlık ve sayfa sırası', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('partnership/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('button', { name: 'Pazarlama' }).click();
    await page.getByRole('menu', { name: 'Pazarlama' }).getByRole('menuitem', { name: 'Affilate' }).click();
    await expect(page).toHaveURL(/\/affilate\/$/);
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Affilate');
    await page.getByRole('button', { name: 'Pazarlama' }).click();
    await expect(page.getByRole('menu', { name: 'Pazarlama' }).getByRole('menuitem', { name: 'Affilate' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(page.locator('.pager-link[rel="prev"] .pager-label')).toHaveText('İş ortaklığı programı');
    await expect(page.locator('.pager-link[rel="next"] .pager-label')).toHaveText('Karar yetkisi ve kontrol noktaları');
    // U19: simülasyon, dönem ve para birimi görünür; gerçek ödeme ya da net kâr iddiası yok.
    await expect(page.locator('.page-intro, .sonuc').first()).toContainText(/simülasyon/i);
    await expect(page.locator('#af-sonuc')).toContainText('36 ay');
    await expect(page.locator('#af-sonuc')).toContainText('₺');
    await expect(page.locator('#af-sonuc')).not.toContainText(/net kâr/i);
  });

  test('ilk ekran 320×480: ana sonuç kaydırmadan görünür; yatay taşma yok; başlangıç 250 ₺ (satış ortağı, yıllık, 36 ay)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await ac(page);
    await expect(anaDeger(page)).toHaveText('250,00 ₺');
    const kutu = await anaDeger(page).boundingBox();
    expect(kutu).not.toBeNull();
    expect(kutu!.y + kutu!.height).toBeLessThanOrEqual(480);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    // Dar ekranda bölüm gezgini seçim kutusu: konum ve ad.
    await expect(page.getByRole('group', { name: 'Bölüm' })).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
  });

  test('U08/U09: bölüm sekmeleri adresle izlenir; geri tuşu; klavye okları; girdiler ve seçili ay korunur', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ac(page);
    const sekmeler = page.getByRole('tablist', { name: 'Bölümler' });
    await expect(sekmeler.getByRole('tab')).toHaveText([/Model/, /Karşılaştırma/, /Aylık döküm/, /Varsayımlar/]);
    await page.getByLabel('Simülasyon ufku').fill('24');
    await page.getByLabel('Simülasyon ufku').press('Tab');
    await expect(page.locator('#af-sonuc')).toContainText('24 ay');
    await sekmeler.getByRole('tab', { name: /Aylık döküm/ }).click();
    await expect(page).toHaveURL(/#aylik$/);
    await expect(page.locator('section#af-aylik')).toBeVisible();
    await expect(page.locator('section.section')).toHaveCount(1);
    await sec(page, 'Ay', 'Nis 2027');
    await expect(page.locator('#af-aylik')).toContainText('Nisan 2027');
    await sekmeler.getByRole('tab', { name: /Model/ }).click();
    await expect(page).toHaveURL(/#model$/);
    await expect(page.getByLabel('Simülasyon ufku')).toHaveValue('24 ay');
    await page.goBack();
    await expect(page.locator('section#af-aylik')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Ay' })).toHaveValue('Nis 2027');
    // Klavye: ok tuşları sekmeyi değiştirir ve odağı taşır.
    await sekmeler.getByRole('tab', { name: /Aylık döküm/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(sekmeler.getByRole('tab', { name: /Varsayımlar/ })).toHaveAttribute('aria-selected', 'true');
    await expect(sekmeler.getByRole('tab', { name: /Varsayımlar/ })).toBeFocused();
    await expect(page.locator('section#af-varsayimlar')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(page.locator('section#af-model')).toBeVisible();
    // Derin bağlantı doğrudan açılır.
    await ac(page, 'karsilastirma');
    await expect(page.locator('section#af-karsilastirma')).toBeVisible();
  });
});

test.describe('Affilate — girdiler ve hesap', () => {
  test('U02/U03/§9.2: üç ortağın oranları gerçek input; çözüm ortağı 2. oran %15 → %10 → 400 → 350 ₺; yeniden yüklemede korunur; %0 geçerli', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ac(page);
    await page.getByRole('group', { name: 'Ortak modeli' }).getByRole('button', { name: 'Çözüm ortağı' }).click();
    await expect(anaDeger(page)).toHaveText('400,00 ₺');
    for (const ad of ['Ayşe', 'Satış ortağı', 'Çözüm ortağı']) {
      await ortakPaneliniAc(page, ad);
      await expect(ortakPaneli(page, ad).getByRole('textbox').first()).toBeEditable();
    }
    const cozum = ortakPaneli(page, 'Çözüm ortağı');
    await cozum.getByLabel('2. dönem oranı').fill('10');
    await cozum.getByLabel('2. dönem oranı').press('Tab');
    await expect(anaDeger(page)).toHaveText('350,00 ₺');
    // Karşılaştırma satırı da aynı kaynaktan.
    await expect(page.locator('#af-sonuc .sonuc-kiyas div[data-secili] dd')).toHaveText('350,00 ₺');
    await page.reload();
    await icerik(page);
    await hydrated(page);
    await expect(anaDeger(page)).toHaveText('350,00 ₺');
    await ortakPaneliniAc(page, 'Çözüm ortağı');
    await expect(ortakPaneli(page, 'Çözüm ortağı').getByLabel('2. dönem oranı')).toHaveValue('%10');
    // %0 geçerli girdidir ve düzenlenebilir.
    await ortakPaneli(page, 'Çözüm ortağı').getByLabel('1. dönem oranı').fill('0');
    await ortakPaneli(page, 'Çözüm ortağı').getByLabel('1. dönem oranı').press('Tab');
    await expect(anaDeger(page)).toHaveText('100,00 ₺');
    await expect(page.locator('.param-duzeltme')).toHaveCount(0);
  });

  test('U04: fiyat katsayısı, hizmet süresi ve taksit sayısı ayrı etiketli ve bağımsız; türetilen tutarın kaynağı görünür', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ac(page);
    await expect(page.getByLabel('Paket fiyatının aylık ücret sayısı')).toHaveValue('10');
    await expect(page.getByLabel('Paket hizmet süresi')).toHaveValue('12 ay');
    const turetilen = page.locator('.af-turetilen');
    await expect(turetilen).toContainText('Yıllık paket');
    await expect(turetilen).toContainText('1.000,00 ₺');
    await expect(turetilen).toContainText('83,33 ₺');
    await expect(turetilen).toContainText('%16,67');
    await page.getByLabel('Paket hizmet süresi').fill('10');
    await page.getByLabel('Paket hizmet süresi').press('Tab');
    await expect(turetilen).toContainText('10 aylık paket');
    await expect(turetilen).toContainText('100,00 ₺'); // aylık eşdeğer; paket 1.000 ₺ katsayıdan gelir, değişmez
    await expect(page.getByLabel('Paket fiyatının aylık ücret sayısı')).toHaveValue('10');
    await ortakPaneliniAc(page, 'Satış ortağı');
    const satis = ortakPaneli(page, 'Satış ortağı');
    await satis.getByRole('button', { name: 'Tahsilatta, taksitle' }).click();
    await satis.getByLabel('Taksit sayısı').fill('6');
    await satis.getByLabel('Taksit sayısı').press('Tab');
    await expect(satis.getByLabel('Taksit sayısı')).toHaveValue('6');
    await expect(page.getByLabel('Paket hizmet süresi')).toHaveValue('10 ay');
    // Aylık fiyat alanı hesapta kullanıldığını söyler; paket tutarı alanı bu kaynakta kullanılmadığını.
    await expect(page.getByText('Bu fiyat kaynağında kullanılmıyor; değer saklanır.').first()).toBeVisible();
  });

  test('U05: oran, ay ve model seçeneklerinde yalnız değer; “parametre” / “Senaryonun” / “Varsayılan” eki yok', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ac(page);
    await ortakPaneliniAc(page, 'Satış ortağı');
    const metinler = await page.locator('.secim-dugme').allTextContents();
    expect(metinler.length).toBeGreaterThan(5);
    for (const m of metinler) expect(m).not.toMatch(/parametre|Senaryonun|Varsayılan/i);
  });

  test('U11: “1,” yazımı ve boş alan sessiz düzeltilmez; %101 açıklanarak sınıra çekilir; son geçerli sonuç korunur', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ac(page);
    await ortakPaneliniAc(page, 'Satış ortağı');
    const alan = ortakPaneli(page, 'Satış ortağı').getByLabel('1. dönem oranı');
    // Sınır dışı: yazarken motora gitmez; odaktan çıkınca sınıra çekilir ve nedeni yazılır (sessiz değil).
    await alan.fill('101');
    await expect(anaDeger(page)).toHaveText('250,00 ₺');
    await alan.press('Tab');
    await expect(page.locator('.param-duzeltme')).toContainText('%101 yerine üst sınır %100 uygulandı.');
    await expect(alan).toHaveValue('%100');
    await expect(anaDeger(page)).toHaveText('1.100,00 ₺'); // %100 × 1.000 ₺ + %10 × 1.000 ₺
    // Tamamlanmamış yazım: son geçerli değer korunur, durum satırı açıklar.
    await alan.fill('1,');
    await expect(anaDeger(page)).toHaveText('1.100,00 ₺'); // bozuk değer motora gitmedi
    await alan.press('Tab');
    await expect(alan).toHaveValue('%100');
    await expect(page.locator('.param-duzeltme')).toContainText('Geçersiz yazım; son geçerli değer %100 korundu.');
    // Boş alan sıfıra çevrilmez.
    await alan.fill('');
    await alan.press('Tab');
    await expect(alan).toHaveValue('%100');
    await expect(anaDeger(page)).toHaveText('1.100,00 ₺');
  });

  test('U12/U16: “Neden bu tutar?” baz, oran-dönem, politika, destek ve yuvarlamayı açıklar; destek durumu hesapta görünür', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ac(page);
    await sec(page, 'Hazır senaryo', 'Destek kesintisi');
    await expect(anaDeger(page)).toHaveText('250,00 ₺');
    await expect(page.locator('#af-sonuc')).toContainText('229,17 ₺'); // kazanılan: ilk ay destek sağlanmadı
    const dugme = page.getByRole('button', { name: 'Neden bu tutar?' });
    await expect(dugme).toHaveAttribute('aria-expanded', 'false');
    await dugme.click();
    const neden = page.getByRole('region', { name: 'Hesap açıklaması' });
    await expect(neden).toBeVisible();
    for (const t of ['Komisyon bazı', 'Kapsam ve oran', 'Kazanma ve ödeme', 'Destek koşulu', 'Yuvarlama', '12 ay %25', 'Her hizmet ayı sonunda kazan ve öde', 'kümülatif']) await expect(neden).toContainText(t);
    await expect(neden).toContainText('1 ay kaydı var');
    // Aylık dökümde ilgili ay: destek sağlanmadı notu ve 0 hakediş; ikinci ay 20,83 ₺.
    await page.getByRole('tablist', { name: 'Bölümler' }).getByRole('tab', { name: /Aylık döküm/ }).click();
    await sec(page, 'Ay', 'Şub 2027');
    await expect(page.locator('#af-hareketler-tablo, .table-block:has(#af-hareketler-tablo), section#af-aylik').first()).toContainText('destek sağlanmadı');
    await expect(page.locator('section#af-aylik .applet-ozet').first()).toContainText('Hakediş');
    await sec(page, 'Ay', 'Mar 2027');
    await expect(page.locator('section#af-aylik .applet-ozet').first().locator('.stat', { hasText: 'Hakediş' })).toContainText('20,84 ₺'); // kümülatif dağıtım: 2., 5., 8., 11. pay 20,84
  });

  test('U17: görüntülenen ay toplamı ile bütün dönem toplamı ayrıdır; ufuk sonrası yükümlülük kaybolmaz', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ac(page, 'aylik');
    await sec(page, 'Ay', 'Şub 2027');
    const ay = page.locator('section#af-aylik .applet-ozet').first();
    await expect(ay.locator('.stat', { hasText: 'Hakediş' })).toContainText('12,50 ₺');
    const donem = page.locator('section#af-aylik .applet-ozet').last();
    await expect(donem.locator('.stat', { hasText: 'Hakediş' })).toContainText('250,00 ₺');
    await expect(donem).toContainText('Bu dönemden sonra');
    // Ufuk 1 ay + taksitli politika: kalan taksitler “bu dönemden sonra” özetinde.
    await page.getByRole('tablist', { name: 'Bölümler' }).getByRole('tab', { name: /Model/ }).click();
    await page.getByLabel('Simülasyon ufku').fill('1');
    await page.getByLabel('Simülasyon ufku').press('Tab');
    await ortakPaneliniAc(page, 'Satış ortağı');
    await ortakPaneli(page, 'Satış ortağı').getByRole('button', { name: 'Tahsilatta, taksitle' }).click();
    await page.getByRole('tablist', { name: 'Bölümler' }).getByRole('tab', { name: /Aylık döküm/ }).click();
    await expect(page.locator('section#af-aylik .applet-ozet').last().locator('.stat', { hasText: 'Ödenecek bakiye' })).toContainText('137,50 ₺');
  });
});

test.describe('Affilate — dar ekran ve karşılaştırma', () => {
  test('U06/U07: 320 px’te model, karşılaştırma ve aylık döküm yatay kaydırmasız; üç ortağın değeri aynı anda görünür', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await ac(page);
    const tasma = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(await tasma()).toBeLessThanOrEqual(1);
    await ortakPaneliniAc(page, 'Satış ortağı');
    expect(await tasma()).toBeLessThanOrEqual(1);
    await choiceSec(page, 'Bölüm', '2 / 4 · Karşılaştırma');
    await expect(page).toHaveURL(/#karsilastirma$/);
    const matris = page.locator('#af-kiyas .matris-kiyas, .table-block:has(#af-kiyas-baslik) .matris-kiyas, section#af-karsilastirma .matris-kiyas').first();
    await expect(matris).toBeVisible();
    await expect(page.getByRole('group', { name: 'Ölçüt' })).toBeVisible();
    await expect(matris.locator('dl.matris-alanlar dt')).toHaveText(['Ayşe', 'Satış ortağı', 'Çözüm ortağı']);
    // Seçili ölçüt: planlanan toplam → 100 / 150 / 250 ₺ (ilk yıl; 36 ayda satış 250, çözüm 400).
    await choiceSec(page, 'Ölçüt', 'Planlanan toplam komisyon');
    await expect(matris.locator('dl.matris-alanlar dd')).toHaveText(['100,00 ₺', '250,00 ₺', '400,00 ₺']);
    expect(await tasma()).toBeLessThanOrEqual(1);
    await choiceSec(page, 'Bölüm', '3 / 4 · Aylık döküm');
    await expect(page.locator('section#af-aylik')).toBeVisible();
    expect(await tasma()).toBeLessThanOrEqual(1);
    // Hareket tablosu dar ekranda kayıt listesi; kritik toplam (tutar) kapalı kayıt özetinde.
    await expect(page.locator('section#af-aylik .kayitlar .kayit-ozet-deger').first()).toContainText('₺');
  });

  test('U10: dar yükseklikte (yatay telefon) sonuç ve bölüm gezgini okunur; yatay taşma yok', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 320 });
    await ac(page);
    await expect(anaDeger(page)).toHaveText('250,00 ₺');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  });
});

test.describe('Affilate — kayıt, dışa aktarım, sıfırlama', () => {
  test('U13: JSON dışa aktar / içe al aynı sonucu verir; bozuk JSON mevcut senaryoyu bozmaz', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ac(page);
    await page.getByRole('group', { name: 'Ortak modeli' }).getByRole('button', { name: 'Çözüm ortağı' }).click();
    await expect(anaDeger(page)).toHaveText('400,00 ₺');
    await page.getByRole('tablist', { name: 'Bölümler' }).getByRole('tab', { name: /Varsayımlar/ }).click();
    const [indirme] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON dışa aktar' }).click()]);
    expect(indirme.suggestedFilename()).toBe('affilate-senaryo.json');
    const yol = await indirme.path();
    const veri = JSON.parse(readFileSync(yol!, 'utf-8')) as { v: number; kurgu: { musteriler: { ortak: string }[] } };
    expect(veri.v).toBe(1);
    expect(veri.kurgu.musteriler[0].ortak).toBe('cozum');
    // Bozuk dosya: durum satırı açıklar, sonuç değişmez.
    await page.locator('input[type="file"]').setInputFiles({ name: 'bozuk.json', mimeType: 'application/json', buffer: Buffer.from('{"v":1,"kurgu":{"ufukAy":-5}}') });
    await expect(page.locator('.af-durum')).toContainText('doğrulamadan geçmedi');
    await expect(anaDeger(page)).toHaveText('400,00 ₺');
    // Geçerli dosya (satış ortağına dönen kurgu) içe alınır.
    const yeni = JSON.parse(JSON.stringify(veri)) as typeof veri;
    yeni.kurgu.musteriler[0].ortak = 'satis';
    await page.locator('input[type="file"]').setInputFiles({ name: 'senaryo.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(yeni)) });
    await expect(page.locator('.af-durum')).toContainText('JSON içe alındı');
    await expect(anaDeger(page)).toHaveText('250,00 ₺');
    // CSV: hareketler indirilir.
    const [csv] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Hareketleri CSV indir' }).click()]);
    expect(csv.suggestedFilename()).toBe('affilate-hareketler.csv');
    const satirlar = readFileSync((await csv.path())!, 'utf-8').split(/\r?\n/);
    expect(satirlar[0]).toContain('Para birimi;Tutar');
    expect(satirlar.length).toBeGreaterThan(10);
  });

  test('U15: sıfırlama kapsamı açıklanır, Vazgeç geri çeker, onay uygular, Geri al döner; senaryo kaydı karşılaştırmada', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ac(page);
    await page.getByLabel('Simülasyon ufku').fill('13');
    await page.getByLabel('Simülasyon ufku').press('Tab');
    await page.getByRole('tablist', { name: 'Bölümler' }).getByRole('tab', { name: /Varsayımlar/ }).click();
    await expect(page.locator('#af-kayit-durum')).toContainText('kaydedildi');
    await expect(page.locator('section#af-varsayimlar')).toContainText('Simülasyon ufku');
    const sifirla = page.getByRole('button', { name: 'Başlangıç değerlerine döndür' });
    await sifirla.click();
    await expect(page.getByRole('button', { name: 'Bütün Affilate girdilerini başlangıç değerlerine döndür (onayla)' })).toBeVisible();
    await page.getByRole('button', { name: 'Vazgeç' }).click();
    await expect(page.locator('#af-sonuc')).toContainText('13 ay');
    await sifirla.click();
    await page.getByRole('button', { name: 'Bütün Affilate girdilerini başlangıç değerlerine döndür (onayla)' }).click();
    await expect(page.locator('#af-sonuc')).toContainText('36 ay');
    await page.getByRole('button', { name: 'Geri al' }).click();
    await expect(page.locator('#af-sonuc')).toContainText('13 ay');
    // Senaryo kaydı ve karşılaştırma.
    await page.getByLabel('Senaryo adı').fill('On üç ay');
    await page.getByRole('button', { name: 'Senaryoyu kaydet' }).click();
    await expect(page.locator('.af-durum')).toContainText('“On üç ay” senaryosu kaydedildi.');
    await expect(page.locator('.af-kayitli')).toContainText('On üç ay');
    await page.getByRole('tablist', { name: 'Bölümler' }).getByRole('tab', { name: /Karşılaştırma/ }).click();
    await expect(page.locator('section#af-karsilastirma')).toContainText('Kayıtlı senaryolarla karşılaştırma');
    await expect(page.locator('section#af-karsilastirma')).toContainText('On üç ay');
    // Diğer sayfaların verisi değişmedi: yalnız Affilate anahtarı yazıldı.
    const anahtarlar = await page.evaluate(() => Object.keys(localStorage));
    expect(anahtarlar).toContain('segika-affilate-v1');
    expect(anahtarlar.filter((k) => k !== 'segika-affilate-v1' && k !== 'turksab-giris')).toEqual([]);
  });

  test('U14: depolama kapalıyken değişiklik çalışır; “kaydedildi” iddiası yok; dışa aktarma yolu var', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript(() => {
      const orijinal = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (k === 'segika-affilate-v1') throw new Error('depolama kapalı');
        return orijinal.call(this, k, v);
      };
    });
    await ac(page);
    await page.getByLabel('Simülasyon ufku').fill('13');
    await page.getByLabel('Simülasyon ufku').press('Tab');
    await expect(page.locator('#af-sonuc')).toContainText('13 ay');
    await page.getByRole('tablist', { name: 'Bölümler' }).getByRole('tab', { name: /Varsayımlar/ }).click();
    await expect(page.locator('#af-kayit-durum')).toContainText('Kaydedilemedi');
    await expect(page.locator('#af-kayit-durum')).toContainText('JSON dışa aktar');
    await expect(page.locator('#af-kayit-durum')).not.toContainText('Bu tarayıcıda kaydedildi');
    await expect(page.getByRole('button', { name: 'JSON dışa aktar' })).toBeVisible();
  });
  /*
   * B6-öncü dar koruma (docs/missings.md MS-04, T06; kullanıcı yönergesi 2026-10-28): bozuk, uyumsuz sürümde ya da kısmen
   * geçersiz kayıt açılışta korunur — hiçbir alan değiştirilmeden byte düzeyinde aynı kalır, değişiklik yapılsa da üzerine
   * yazılmaz; ham kayıt dışa aktarılabilir; üzerine yazma yalnız “Başlangıçla devam et” kararıyla.
   */
  for (const [ad, ham, beklenen] of [
    ['uyumsuz sürüm (v=99)', '{"v":99,"kurgu":{"x":1}}', /başka bir sürüm/],
    ['bozuk JSON', '{bozuk', /okunamadı/],
  ] as const) {
    test(`MS-04 / T06: ${ad} kayıt korunur; değişiklik çalışır ama yazılmaz; üzerine yazma yalnız açık kararla`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript(({ key, ham }) => localStorage.setItem(key, ham), { key: 'segika-affilate-v1', ham });
      await ac(page);
      await page.getByLabel('Simülasyon ufku').fill('13');
      await page.getByLabel('Simülasyon ufku').press('Tab');
      await expect(page.locator('#af-sonuc')).toContainText('13 ay');
      expect(await page.evaluate(() => localStorage.getItem('segika-affilate-v1')), 'ham kayıt değişmedi').toBe(ham);
      await page.getByRole('tablist', { name: 'Bölümler' }).getByRole('tab', { name: /Varsayımlar/ }).click();
      const sorun = page.locator('#af-kayit-sorun');
      await expect(sorun).toContainText(beklenen);
      await expect(sorun).toContainText('üzerine yazılmıyor');
      await expect(page.locator('#af-kayit-durum')).toContainText('korunuyor');
      await expect(page.locator('#af-kayit-durum')).not.toContainText(/kaydedildi/);
      await expect(sorun.getByRole('button', { name: /dışa aktar/ })).toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem('segika-affilate-v1')), 'ham kayıt hâlâ aynı').toBe(ham);
      await sorun.getByRole('button', { name: /Başlangıçla devam et/ }).click();
      await expect(page.locator('#af-kayit-sorun')).toHaveCount(0);
      await expect(page.locator('#af-kayit-durum')).toContainText(/kaydedildi/);
      const yeni = await page.evaluate(() => localStorage.getItem('segika-affilate-v1'));
      expect(yeni).not.toBe(ham);
      expect(JSON.parse(yeni!).v).toBe(1);
      expect(JSON.parse(yeni!).kurgu.ufukAy).toBe(13);
    });
  }

  test('MS-04 / T06: kısmen geçersiz kayıt — okunabilen senaryolar yüklenir, ham kayıt korunur, uyarı sayıyı söyler', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const kurgu = baslangicKurgu();
    kurgu.ufukAy = 18;
    const ham = JSON.stringify({ v: 1, kurgu, kayitli: [{ ad: 'İyi senaryo', kurgu }, { ad: 'Bozuk', kurgu: 'x' }] });
    await page.addInitScript(({ key, ham }) => localStorage.setItem(key, ham), { key: 'segika-affilate-v1', ham });
    await ac(page);
    await expect(page.locator('#af-sonuc')).toContainText('18 ay');
    await page.getByRole('tablist', { name: 'Bölümler' }).getByRole('tab', { name: /Varsayımlar/ }).click();
    const sorun = page.locator('#af-kayit-sorun');
    await expect(sorun).toContainText('1 kayıtlı senaryo okunamadı');
    await expect(sorun).toContainText('üzerine yazılmıyor');
    await expect(page.locator('.af-kayitli')).toContainText('İyi senaryo');
    await expect(page.locator('.af-kayitli')).not.toContainText('Bozuk');
    expect(await page.evaluate(() => localStorage.getItem('segika-affilate-v1')), 'ham kayıt korunur').toBe(ham);
  });
});
