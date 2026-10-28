import { expect, test, type Page } from '@playwright/test';
import { buildModel, reply } from './opex-fixture';

/**
 * gorsel_algi.md (kullanıcı kararı 2026-10-28) kabul senaryoları (§6 V01–V30), paket paket. GA-1: seçenek etiketinde tek
 * bilgi türü (F01), otomatik/sabit değer ayrımı (F02), kontrol görevi ve yardım bağı (F03/F12), seçenek grubu tek satır
 * ya da kontrollü sunum değişimi (§5.2), seçim hedefin konumunu oynatmaz (V08/F06). Sheets isteği sahte yanıtla kapatılır.
 */
const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

test.beforeEach(async ({ page }) => {
  await page.route('https://script.google.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
});

async function kurucuAc(page: Page, yol = 'gelir-plani/') {
  await page.goto(yol);
  await icerik(page);
  await hydrated(page);
  await page.evaluate(() => document.fonts.ready);
  const kurucu = page.locator('.kurucu');
  const acici = kurucu.getByRole('button', { name: /Ayrıntılı seçenekler/ });
  if ((await acici.getAttribute('aria-expanded')) === 'false') await acici.click();
  return { kurucu, secenekler: kurucu.getByRole('group', { name: 'Ayrıntılı seçenekler' }) };
}

test.describe('gorsel_algi GA-1: seçenek etiketi, bağlanma modu, sunum', () => {
  test('V01: seçeneklerde yalnız değer — kaynak, parametre ve parantezli açıklama seçenekte yok; grup etiketi ölçülen şeyi taşır', async ({ page }) => {
    const { kurucu, secenekler } = await kurucuAc(page);
    const metinler = await kurucu.locator('.secim-dugme').allInnerTexts();
    expect(metinler.length).toBeGreaterThan(20);
    for (const m of metinler) expect(m, `seçenek: ${m}`).not.toMatch(/Senaryonun|parametre|\(|\)|\/ ay|\/ yıl/);
    // Medyan: kapasite seçenekleri yalnız değerler, her değer bir kez (otomatik kopya yok).
    await expect(secenekler.getByRole('group', { name: 'Kapasite çarpanı' }).getByRole('button')).toHaveText(['%60', '%80', '%100', '%130']);
    const eldeTutma = await secenekler.getByRole('group', { name: 'Aylık elde tutma' }).getByRole('button').allInnerTexts();
    expect(new Set(eldeTutma).size).toBe(eldeTutma.length);
    // Ölçülen şey grup etiketinde: para grubunda tutarlar, yüzde grubunda yüzdeler, tarih grubunda ay + yıl.
    await expect(secenekler.getByRole('group', { name: 'Aylık reklam bütçesi' }).getByRole('button')).toHaveText(['Yok', '15.000 ₺', '30.000 ₺', '60.000 ₺', '120.000 ₺']);
    await expect(secenekler.getByRole('group', { name: 'Yıllık kur artışı' }).getByRole('button')).toHaveText(['%0', '%10', '%25', '%40']);
    await expect(secenekler.getByRole('group', { name: 'Aylık abonelik fiyatı' }).getByRole('button')).toHaveText(['299 €', '399 €', '499 €']);
    await expect(secenekler.getByRole('group', { name: 'İkinci saha personeli' }).getByRole('button')).toHaveText(['Aralık 2026', 'Ocak 2027', 'Mart 2027', 'Gelmez']);
    // Kaynak bilgisi yardım alanında, Parametreler bağlantısıyla (F01: “değerin geldiği parametreye ayrı bağlantı”).
    const fiyatKaynak = secenekler.getByRole('group', { name: 'Aylık abonelik fiyatı' }).locator('.secim-kaynak');
    await expect(fiyatKaynak).toContainText(/Başlangıç değeri genel parametre: 399 €/);
    await expect(fiyatKaynak.getByRole('link', { name: /Parametreler/ })).toHaveAttribute('href', /parametreler\/$/);
  });

  test('V02/V03: aynı etkili değer bir kez görünür; bağlanma modu ayrı anahtar; değer seçmek sabitler, anahtar senaryoya bağlar; adres ve saklama sözleşmesi aynı', async ({ page }) => {
    const { kurucu, secenekler } = await kurucuAc(page);
    const kapasite = secenekler.getByRole('group', { name: 'Kapasite çarpanı' });
    const anahtar = kapasite.getByRole('switch', { name: /Senaryoyla birlikte güncellenir/ });
    await expect(kapasite.getByRole('button', { name: '%100', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(anahtar).toHaveAttribute('aria-checked', 'true');
    await expect(kapasite.locator('.anahtar-aciklama')).toContainText(/seçili senaryodan \(Medyan\): %100/);
    expect(await anahtar.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    // Temel senaryo değişince otomatik değer senaryoyu izler.
    await kurucu.getByRole('group', { name: 'Hazır senaryolar' }).getByRole('button', { name: 'Kötümser' }).click();
    await expect(kapasite.getByRole('button', { name: '%60', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(anahtar).toHaveAttribute('aria-checked', 'true');
    // Değer seçmek sabit moda geçirir: anahtar kapanır, adres sabit değeri taşır (kapasite=1), senaryo “Özel” olur.
    await kapasite.getByRole('button', { name: '%100', exact: true }).click();
    await expect(anahtar).toHaveAttribute('aria-checked', 'false');
    await expect(kapasite.locator('.anahtar-aciklama')).toContainText(/Sabit: %100/);
    await expect(page).toHaveURL(/kapasite=1(&|$)/);
    await expect(kurucu.getByRole('group', { name: 'Hazır senaryolar' }).getByRole('button', { name: 'Özel', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse((await page.evaluate(() => localStorage.getItem('istoc-plan-senaryo-secenekler'))) ?? '{}').factor).toBe(1);
    // Temel senaryo başka sayfadan değişse de sabit değer korunur (V03: kaynak güncellemesi sabit değeri bozmaz).
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('group', { name: 'Senaryo' }).first().getByRole('button', { name: 'İyimser' }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('istoc-plan-senaryo'))).toBe('iyimser');
    const geri = await kurucuAc(page);
    const kapasite2 = geri.secenekler.getByRole('group', { name: 'Kapasite çarpanı' });
    await expect(kapasite2.getByRole('button', { name: '%100', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(kapasite2.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    // Anahtar: otomatiğe dönüş ayrı, açık eylem; değer senaryonun (İyimser %130) olur, adres anahtarı taşımaz, saklama null.
    await kapasite2.getByRole('switch').click();
    await expect(kapasite2.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await expect(kapasite2.getByRole('button', { name: '%130', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page).not.toHaveURL(/kapasite=/);
    expect(JSON.parse((await page.evaluate(() => localStorage.getItem('istoc-plan-senaryo-secenekler'))) ?? '{}').factor).toBeNull();
    // Parametre kaynaklı bağ (kur artışı): anahtar adı kaynağı söyler.
    await expect(geri.secenekler.getByRole('group', { name: 'Yıllık kur artışı' }).getByRole('switch', { name: /parametreyle birlikte güncellenir/i })).toHaveAttribute('aria-checked', 'true');
  });

  test('V04: hazır senaryo seçenekleri yeniden kurar (mevcut sözleşme): bağlar otomatiğe döner, “Özel” kalkar; sıfırla aynı', async ({ page }) => {
    const { kurucu, secenekler } = await kurucuAc(page);
    const kapasite = secenekler.getByRole('group', { name: 'Kapasite çarpanı' });
    await kapasite.getByRole('button', { name: '%80', exact: true }).click();
    await expect(kapasite.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    await kurucu.getByRole('group', { name: 'Hazır senaryolar' }).getByRole('button', { name: 'Saha ağırlıklı' }).click();
    await expect(kapasite.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await expect(kurucu.getByRole('group', { name: 'Hazır senaryolar' }).getByRole('button', { name: 'Özel', exact: true })).toHaveCount(0);
    await expect(secenekler.getByRole('group', { name: 'Ek saha personeli' }).getByRole('button', { name: '+2 kişi' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('V05: liste dışı parametre değeri (449 €) tek ve gerçek seçenek olarak görünür; tekrar eden etiket yok', async ({ page }) => {
    const { secenekler } = await kurucuAc(page, 'gelir-plani/?senaryo=medyan&ucret=449');
    const fiyat = secenekler.getByRole('group', { name: 'Aylık abonelik fiyatı' });
    await expect(fiyat.getByRole('button')).toHaveText(['299 €', '399 €', '449 €', '499 €']);
    await expect(fiyat.getByRole('button', { name: '449 €' })).toHaveAttribute('aria-pressed', 'true');
  });

  for (const genislik of [320, 1280]) {
    test(`V06/V08 ${genislik} px: segment grubu tek satır ya da kontrollü sunum (liste / seçim kutusu); seçim hedefin konumunu oynatmaz; taşma yok`, async ({ page }) => {
      await page.setViewportSize({ width: genislik, height: genislik === 320 ? 480 : 800 });
      const { kurucu } = await kurucuAc(page);
      const gruplar = kurucu.locator('.secim');
      const n = await gruplar.count();
      expect(n).toBeGreaterThan(10);
      for (let i = 0; i < n; i++) {
        const g = gruplar.nth(i);
        const ad = (await g.getAttribute('aria-label')) ?? String(i);
        const sunum = await g.locator('.secim-iz').getAttribute('data-sunum');
        if (sunum === 'segment') {
          const ustler = await g.locator('.secim-dugme').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
          expect(new Set(ustler).size, `${ad}: segment tek satır`).toBe(1);
        } else if (sunum === 'liste') {
          const sollar = await g.locator('.secim-dugme').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
          expect(new Set(sollar).size, `${ad}: liste alt alta`).toBe(1);
        } else {
          expect(sunum, `${ad}: sunum`).toBe('secim');
          await expect(g.getByRole('combobox')).toHaveCount(1);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      // V08: seçim değişince grubun ve komşu hedeflerin geometrisi oynamaz (ağırlık değişimi yok).
      const kapasite = kurucu.getByRole('group', { name: 'Kapasite çarpanı' });
      await kapasite.scrollIntoViewIfNeeded();
      const iz = kapasite.locator('.secim-iz');
      const once = (await iz.boundingBox())!;
      const hedef = (await kapasite.getByRole('button', { name: '%80', exact: true }).boundingBox())!;
      await kapasite.getByRole('button', { name: '%80', exact: true }).click();
      await expect(kapasite.getByRole('button', { name: '%80', exact: true })).toHaveAttribute('aria-pressed', 'true');
      const sonra = (await iz.boundingBox())!;
      const hedefSonra = (await kapasite.getByRole('button', { name: '%80', exact: true }).boundingBox())!;
      expect(Math.abs(sonra.width - once.width)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(sonra.height - once.height)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(hedefSonra.x - hedef.x)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(hedefSonra.width - hedef.width)).toBeLessThanOrEqual(0.5);
    });
  }

  test('V11: yardım metni gruba aria-describedby ile bağlı; görünüm anahtarı neyi etkilediğini söyler', async ({ page }) => {
    const { kurucu } = await kurucuAc(page);
    const grup = kurucu.getByRole('group', { name: 'Kapasite çarpanı' });
    const notId = await grup.locator('.secim-not').getAttribute('id');
    expect(notId).toBeTruthy();
    expect((await grup.getAttribute('aria-describedby')) ?? '').toContain(notId!);
    // F03 / C014: görünüm grubu adı sunumu (grafik, tablo) belirtir; değer filtresi değildir.
    await expect(page.locator('#kadro').getByRole('group', { name: 'Grafik görünümü' }).first()).toBeVisible();
    await expect(page.locator('.table-block:has(#katki-tablo)').getByRole('group', { name: 'Tablo görünümü' })).toBeVisible();
    await expect(page.locator('#gelir').getByRole('group', { name: 'Grafik ve tablo görünümü' }).first()).toBeVisible();
  });
});

/** Giderler sayfası: Apps Script yanıtı sahte modelle (anahtarsız uç), veri hemen gelir. */
async function giderlerAc(page: Page) {
  const model = buildModel();
  await page.route('https://script.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(model, 'ozet-1')) }),
  );
  await page.goto('giderler/');
  await hydrated(page);
  await expect(page.getByRole('region', { name: /^Kalemler · / })).toBeVisible({ timeout: 15_000 });
}

test.describe('gorsel_algi GA-2: işaret ve birim sözlüğü, “—” sözlüğü, kaynak tonu', () => {
  test('V24: aynı ölçüt gelir ve nakit sayfalarında aynı ad, işaret ve birimle; ek fon ile negatif bakiye ayrı kavram', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const ana = page.locator('.sonuc');
    await expect(ana.locator('.sonuc-etiket').first()).toHaveText('En yüksek birikmiş açık');
    expect((await ana.locator('.sonuc-deger').first().innerText()).trim()).toMatch(/^[−-]\d|^0 ₺$/);
    await expect(ana).toContainText(/gereken finansman \d/);
    const metin = await page.locator('main').innerText();
    // Eski ad (“fon ihtiyacı”) hiçbir yerde yok; yapışkan özet, senaryo tablosu ve filtre etkisi aynı adı taşır.
    expect(metin).not.toMatch(/fon ihtiyacı/i);
    await expect(page.locator('.yapiskan-cip', { hasText: 'En yüksek birikmiş açık' })).toHaveCount(1);
    await expect(page.locator('.table-block:has(#senaryolar-tablo) thead')).toContainText('En yüksek birikmiş açık');
    // Nakit sayfasındaki ölçütle ilişki açık: nakit açığı tavanı başka ölçüttür (başlangıç nakdi ve yatırım girişi).
    expect(metin).toMatch(/nakit açığı tavanı/i);
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    const nakit = await page.locator('main').innerText();
    expect(nakit).toMatch(/birikmiş açık/i);
    expect(nakit).not.toMatch(/fon ihtiyacı/i);
    expect((await page.locator('.sonuc .sonuc-deger').first().innerText()).trim()).not.toMatch(/^[−-]/);
  });

  test('V25: sıfır, veri yok, uygulanmıyor ve senaryoda yok ayrı okunur; tablolarda çıplak “—” hücresi yok; Giderler’de kısa sembol görünür efsaneyle', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const kadro = page.locator('.table-block:has(#katki-tablo)');
    await expect(kadro.locator('tbody tr[data-tone="total"]').first()).toContainText('Uygulanmıyor');
    expect(await kadro.locator('td', { hasText: /^—$/ }).count()).toBe(0);
    await kadro.getByRole('group', { name: /görünüm/i }).getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(kadro.locator('.table-note-alt')).toContainText('Senaryoda yok');
    expect(await kadro.locator('td', { hasText: /^—$/ }).count()).toBe(0);
    expect(await page.locator('main td', { hasText: /^—$/ }).count()).toBe(0);
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    const nakitTablo = page.locator('.table-block:has(#nakit-tablo)');
    expect(await nakitTablo.locator('td', { hasText: /^—$/ }).count()).toBe(0);
    expect(await nakitTablo.locator('td', { hasText: /^0 ₺$/ }).count()).toBeGreaterThan(0);
    expect(await page.locator('main').innerText()).not.toMatch(/“—” sıfır/);
    await giderlerAc(page);
    await expect(page.locator('.opex-sembol-efsanesi')).toContainText(/— : o ay bu kalemde gider yok \(0 ₺\)/);
    await expect(page.locator('.opex-sembol-efsanesi')).toContainText(/uygulanmıyor/i);
  });

  test('F18: alt bilgi sayfa türüne göre kaynak ve statü söyler; Giderler kaynak araması doğrulanmış kaynak değildir; şerit “Canlı” demez', async ({ page }) => {
    const sayfalar: [string, RegExp, RegExp][] = [
      ['eylem-plani/', /kesinleşen karar/i, /örnek veri|koşullu tahmin/i],
      ['gelir-plani/', /koşullu tahmin/i, /kesinleşen/i],
      ['nakit-akisi/', /koşullu tahmin/i, /kesinleşen/i],
      ['applet/', /örnek veri/i, /kesinleşen/i],
    ];
    for (const [yol, bekle, olmasin] of sayfalar) {
      await page.goto(yol);
      await icerik(page);
      await hydrated(page);
      const alt = await page.locator('.app-footer').innerText();
      expect(alt, yol).toMatch(bekle);
      expect(alt, yol).not.toMatch(olmasin);
    }
    await giderlerAc(page);
    const alt = await page.locator('.app-footer').innerText();
    expect(alt).toMatch(/Sheets/);
    expect(alt).not.toMatch(/kesinleşen/i);
    // Varsayımlar seçili yıl panelinde (2027): sekmeyi seç.
    await page.getByRole('tablist', { name: 'Yıl' }).getByRole('tab', { name: /2027/ }).click();
    const kaynak = page.locator('.opex-source').first();
    await expect(kaynak.getByRole('link', { name: /Kaynak arama bağlantısı/ })).toHaveCount(1);
    await expect(kaynak).toContainText(/doğrulanmış kaynak değildir/i);
    await expect(page.locator('.opex-live-label')).not.toHaveText('Canlı');
    await expect(page.locator('.opex-live-label')).toHaveText('Sheets');
  });
});
