import { expect, test, type Page } from '@playwright/test';

/**
 * İfade sözleşmesi (docs/ifade.md, kullanıcı kararı 2026-10-28): arayüz metinleri bilgiyle birlikte okurun o bilgiyle ne
 * yapacağını ve anlam sınırını taşır. Kabul senaryoları (ifade §8.2) T04/T05/T06/T07/T08/T09/T11/T12/T13/T14/T17/T19/T22
 * ve §5 C kayıtları. Bağımsız oracle: model tanımları (`revenue.ts`, `breakeven.ts` — data.spec.ts) ve sayfa durumu;
 * burada yalnız yanlış yorumu engelleyen ilişkinin görünür olduğu denetlenir. Sheets isteği sahte yanıtla kapatılır
 * (gider kaynağı plana düşer); insanla anlama testi NOT_RUN.
 */
const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

test.beforeEach(async ({ page }) => {
  await page.route('https://script.google.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
});

async function gelir(page: Page, query = '') {
  await page.goto(`gelir-plani/${query}`);
  await icerik(page);
  await hydrated(page);
}

test.describe('ifade: finans ve kayıt anlamı (ifade.md §10.2 birinci grup)', () => {
  test('C11 / T04: en yüksek birikmiş açık negatif, gereken finansman pozitif ve kapsamıyla; C10 / T05: açığın kapanışı kredi ya da yatırımcı ödemesi değil', async ({ page }) => {
    await gelir(page);
    const sonuc = page.locator('.sonuc');
    await expect(sonuc.locator('.sonuc-etiket')).toContainText('En yüksek birikmiş');
    const deger = (await sonuc.locator('.sonuc-deger').first().textContent())?.trim() ?? '';
    expect(deger).toMatch(/^-|^0 ₺/);
    const aciklama = (await sonuc.locator('.sonuc-aciklama').first().textContent()) ?? '';
    expect(aciklama).toMatch(/gereken (finansman|tutar)/i);
    expect(aciklama).toMatch(/gider kaynağı/);
    // Yapışkan özet ve ana sonuç aynı anlam adıyla; “Fon ihtiyacı” ve “Geri ödeme” tek başına kullanılmaz.
    await expect(page.locator('.yapiskan-cip', { hasText: 'Birikmiş açık' })).toHaveCount(1);
    await expect(page.locator('.yapiskan-cip', { hasText: 'Fon ihtiyacı' })).toHaveCount(0);
    await expect(page.locator('.yapiskan-cip', { hasText: 'Açığın kapanışı' })).toHaveCount(1);
    await expect(page.locator('.yapiskan-cip', { hasText: /^Geri ödeme/ })).toHaveCount(0);
    const basabas = page.locator('#basabas');
    await expect(basabas.locator('.stat', { hasText: 'Birikmiş açığın kapanışı' })).toHaveCount(1);
    await expect(basabas.locator('.stat', { hasText: 'Birikmiş açığın kapanışı' })).toContainText(/kredi|yatırımcı/);
  });

  test('C08 / T06, C09 / T03, C12: hedef kartında ayın tamamı ve birikmiş ödeme tanımı; C31 / T23: ilk 10 ödeme “sistem kuruldu” değil', async ({ page }) => {
    await gelir(page);
    const kart = page.locator('.gelir-hedef').first();
    await expect(kart.locator('dt', { hasText: 'Hedef ayının toplam' })).toHaveCount(1);
    await expect(kart.locator('dt', { hasText: 'O ayın geliri' })).toHaveCount(0);
    await expect(kart.locator('dt', { hasText: /Başlangıçtan ay sonuna kadar/ })).toHaveCount(1);
    await expect(kart.locator('.gelir-hedef-ad')).not.toContainText('Sistem kuruldu');
    await expect(kart.locator('.gelir-hedef-ad')).toContainText('ödeme');
    const desc = page.locator('#hedefler .section-desc');
    await expect(desc).toContainText('ayın tamamını');
    await expect(desc).toContainText('ilk abonelik ödemesini');
    // Yıllık peşin ödeme ilk ayda bütünüyle sayılır: tanım görünür.
    await expect(page.locator('#hedefler')).toContainText('ödendiği ayda bütünüyle');
  });

  test('C16 / C17 / C27 / T07 / T08: gider kaynağı etiketi “canlı” demez; yedek kaynak ve kapsamı açık', async ({ page }) => {
    await gelir(page);
    const kurucu = page.locator('.kurucu');
    await expect(kurucu.getByRole('button', { name: 'Sheets (canlı)' })).toHaveCount(0);
    await expect(kurucu.getByRole('button', { name: /Sheets gider verisi/ })).toHaveCount(1);
    const not = page.locator('#basabas .kaynak-notu');
    await expect(not).toContainText(/plan kadrosu(nun)? giderleri/);
    await expect(not).toContainText(/ofis|yazılım ekibi/);
    await expect(not).not.toContainText('o ana kadar');
  });

  test('C18 / T09, C19 / T11, C20 / T12: sıfırlama ve bağlantı kapsamı görünür; kopyalama durumu düğmede değil durum satırında', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined);
    await gelir(page, '?senaryo=medyan&eksaha=1');
    const kurucu = page.locator('.kurucu');
    const sifirla = kurucu.getByRole('button', { name: 'Sayfa seçeneklerini sıfırla' });
    await expect(sifirla).toBeVisible();
    await expect(kurucu.locator('.kurucu-kapsam')).toContainText('Parametreler sayfası');
    await expect(kurucu.locator('.kurucu-kapsam')).toContainText('temel senaryo');
    const kopyala = kurucu.getByRole('button', { name: 'Senaryo bağlantısını kopyala' });
    await expect(kopyala).toBeVisible();
    await expect(kurucu.locator('.kurucu-kapsam')).toContainText(/genel (plan )?parametre/i);
    await kopyala.click();
    const durum = kurucu.getByRole('status');
    await expect(durum).toContainText(/kopyalandı|kopyalanamadı/);
    await expect(kopyala).toHaveText('Senaryo bağlantısını kopyala');
    // Sıfırlama: temel senaryo korunur, sayfa seçenekleri plan değerine döner.
    await sifirla.click();
    await expect(kurucu.getByRole('group', { name: 'Hazır senaryolar' }).getByRole('button', { name: 'Medyan' })).toHaveAttribute('aria-pressed', 'true');
    await page.evaluate(() => {
      localStorage.removeItem('istoc-plan-senaryo');
      localStorage.removeItem('istoc-plan-senaryo-secenekler');
    });
  });

  test('C28 / T19: dönem içinde kapanmama ile hesaplanamama ayrılır; “Kapanmıyor” tek başına yazılmaz', async ({ page }) => {
    await gelir(page, '?senaryo=kotumser');
    const metin = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    expect(metin).not.toMatch(/(^|[^a-zçğıöşü])Kapanmıyor(?![: ]*\S*sonuna)/);
    const kapanis = page.locator('#basabas .stat', { hasText: 'Birikmiş açığın kapanışı' });
    await expect(kapanis.locator('.stat-value')).toContainText(/sonuna kadar kapanmıyor|≈|\d/);
  });

  test('C21 / T10: parametre kayıt durumu yeri, cihaz ve Sheets sınırını söyler', async ({ page }) => {
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    const durum = page.locator('.param-status');
    await expect(durum).toContainText(/bu tarayıcı/i);
    await expect(durum).toContainText(/Sheets dosyasını değiştirmez/);
    await expect(durum).toContainText(/başka cihaz|Başka tarayıcı/);
  });
});

test.describe('ifade: görev ve terim haritası (ikinci grup) ve biçim (üçüncü grup)', () => {
  test('C01: sayfa amacı koşullu tahmin ve ilk adım; C13: aylık abonelik fiyatı maaş değil; C04: yıllık peşin payı kimlerin oranı; C02/C07/C24 yardım metinleri', async ({ page }) => {
    await gelir(page);
    const amac = page.locator('.sayfa-amac, .page-purpose, .pbaslik-amac').first();
    await expect(amac).toContainText(/tahmin/);
    await expect(amac).toContainText(/senaryo/);
    const kurucu = page.locator('.kurucu');
    const acici = kurucu.getByRole('button', { name: /Ayrıntılı seçenekler/ });
    if ((await acici.getAttribute('aria-expanded')) === 'false') await acici.click();
    await expect(kurucu.getByRole('group', { name: 'Aylık abonelik fiyatı' })).toHaveCount(1);
    await expect(kurucu.getByRole('group', { name: 'Aylık ücret' })).toHaveCount(0);
    await expect(kurucu.getByRole('group', { name: 'Aylık abonelik fiyatı' }).locator('.secim-not')).toContainText(/maaş/);
    await expect(kurucu.getByRole('group', { name: 'Yıllık peşin payı' }).locator('.secim-not')).toContainText(/yeni satıcıların oranı/);
    await expect(kurucu.getByRole('group', { name: 'Kapasite çarpanı' }).locator('.secim-not')).toContainText(/satış kanalından/);
    await expect(kurucu.getByRole('group', { name: 'İkinci saha personeli' }).locator('.secim-not')).toContainText(/Sheets dosyasını değiştirmez/);
    await expect(kurucu.getByRole('group', { name: 'Reklam ölçeklenmesi' }).locator('.secim-not')).toContainText(/satıcı değeri/);
  });

  test('C03 / C14 / C25 / T14: senaryo notu plan senaryosunu açıklar; +10 puan “yüzde puan” ve gerçek değerle; Medyan istatistik değil', async ({ page }) => {
    await gelir(page, '?senaryo=iyimser');
    const not = page.locator('.kurucu .secim-not').first();
    await expect(not).toContainText(/yüzde puan/);
    await expect(not).toContainText(/%\d+ yerine %\d+|%\d+ → %\d+/);
    await expect(not).not.toContainText('+10 puan');
    await gelir(page, '?senaryo=medyan');
    await expect(page.locator('.kurucu .secim-not').first()).toContainText(/Plan senaryosu/);
    await expect(page.locator('.kurucu .secim-not').first()).toContainText(/yenile/);
    await expect(page.locator('.kurucu .secim-not').first()).toContainText(/saha çalışanı|saha personeli/);
    await page.evaluate(() => localStorage.removeItem('istoc-plan-senaryo'));
  });

  test('C15 / T16, C29 / T17: katkı karşıolgusal model farkıdır; dolaylı roller “değer katmıyor” değil', async ({ page }) => {
    await gelir(page);
    const kadro = page.locator('#kadro');
    await expect(kadro.locator('.section-desc')).toContainText(/kayna(k|ğı) çıkarılınca|çıkarıldığında/);
    await expect(kadro.locator('.section-desc')).toContainText(/performans ölçümü değil/);
    await expect(kadro.locator('.stat', { hasText: 'Dolaylı roller' })).toContainText(/ayrı (bir )?(doğrudan )?satış katkısı hesapla/);
    await expect(kadro.locator('.stat', { hasText: 'Dolaylı roller' })).not.toContainText('doğrudan gelir yok');
  });

  test('C26 / T24 ve C30: grafik ve tablo başlıkları ölçüt, dönem ve birimi söyler', async ({ page }) => {
    await gelir(page);
    const kadro = page.locator('#kadro');
    await kadro.getByRole('group', { name: 'Görünüm' }).first().getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(kadro.locator('.chart').first().locator('.chart-title')).toContainText(/senaryolara göre aylık yeni satıcı/i);
    await expect(page.locator('#kaynak-tablo')).toContainText('Satış kanalları');
    await expect(page.locator('#kaynak-tablo')).toContainText(/yeni satıcı/);
  });

  test('C23 / T13: yüzde eki sabit apostrofla üretilmez (0, 20, 40, 100 varyantları)', async ({ page }) => {
    for (const pay of ['0', '0.2', '0.4', '1']) {
      await gelir(page, `?senaryo=medyan&yillikpay=${pay}`);
      const metin = await page.locator('main').innerText();
      expect(metin, `yillikpay=${pay}`).not.toMatch(/%\d+’[a-zçğıöşü]/);
      expect(metin, `yillikpay=${pay}`).toMatch(/yüzde \d+/);
    }
    await page.evaluate(() => {
      localStorage.removeItem('istoc-plan-senaryo');
      localStorage.removeItem('istoc-plan-senaryo-secenekler');
    });
  });

  test('C32 / T22: genel sıfırlama onayı nesne ve kapsamla; Vazgeç yolu', async ({ page }) => {
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('searchbox', { name: 'Parametre ara' }).fill('İşveren maliyeti çarpanı');
    const alan = page.getByLabel('İşveren maliyeti çarpanı');
    await alan.click();
    await alan.press('ControlOrMeta+a');
    await alan.pressSequentially('3');
    await alan.press('Tab');
    const sifirla = page.locator('.param-reset');
    await expect(sifirla).toHaveText('Varsayılanlara dön');
    await sifirla.click();
    await expect(sifirla).toHaveText(/Genel ayarları sıfırla/);
    await expect(page.locator('.param-reset-kapsam')).toContainText(/alan/);
    await expect(page.locator('.param-reset-kapsam')).toContainText(/bu tarayıcı/);
    await expect(page.getByRole('button', { name: 'Vazgeç' })).toBeVisible();
    await page.getByRole('button', { name: 'Vazgeç' }).click();
    await expect(sifirla).toHaveText('Varsayılanlara dön');
    await page.evaluate(() => localStorage.removeItem('istoc-plan-parametreler'));
  });

  test('C22: ilk satış yardımı tarihten önce sıfır ve ilk ayın oranını açıklar', async ({ page }) => {
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('searchbox', { name: 'Parametre ara' }).fill('İlk satış');
    const alan = page.getByLabel('İlk satış', { exact: true });
    await expect(alan).toBeVisible();
    const yardim = page.locator('.param-field', { has: alan }).locator('.param-help');
    await expect(yardim).toContainText(/sıfır kabul/);
    await expect(yardim).toContainText(/kalan gün/);
  });
});
