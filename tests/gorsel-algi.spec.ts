import { expect, test, type Page } from '@playwright/test';
import { buildModel, reply } from './opex-fixture';
import { APPLET_NAV, SEQUENCE } from '../src/data/tree';

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
  // Kalemler bloğu iki kabukta da (.opex-veri[data-kabuk]); kayan tablo bölgesi yalnız geniş ekranda var.
  await expect(page.locator('.opex-veri[data-kabuk]')).toBeVisible({ timeout: 15_000 });
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
    // contents.md F10 (2026-10-28): kapsam cümlesi içerik envanterinden; eylem planı “planlanmış teslim”, öneri/eğitim/örnek
    // içerik “kesinleşen” demez.
    const sayfalar: [string, RegExp, RegExp][] = [
      ['eylem-plani/', /planlanmış teslim/i, /kesinleşen|örnek veri|koşullu tahmin/i],
      ['gelir-plani/', /koşullu tahmin/i, /kesinleşen karar/i],
      ['nakit-akisi/', /koşullu tahmin/i, /kesinleşen karar/i],
      ['applet/', /örnek veri/i, /kesinleşen/i],
      ['partnership/', /öneri ve başlangıç tasarımı/i, /kesinleşen/i],
      ['bcg/', /eğitim/i, /kesinleşen/i],
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

test.describe('gorsel_algi GA-3: sessiz düzeltme geri bildirimi, süresiz onay, durum mesajı, uzun içerik', () => {
  test('V20 (applet): üst sınırı aşan taslak odaktan çıkınca sınıra çekilir ve nedeni görünür; sınır önceden yazılı; yeni yazımda mesaj kalkar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('applet/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('navigation', { name: 'Applet’ler' }).getByRole('link', { name: /Kademe serisi/ }).click();
    const alan = page.getByRole('textbox', { name: 'Derece sayısı' });
    await expect(alan).toBeVisible();
    await expect(page.locator('.param-field', { has: alan }).locator('.param-help')).toContainText(/en az 2, en çok 15/i);
    await alan.click();
    await alan.press('ControlOrMeta+a');
    await alan.pressSequentially('40');
    await alan.press('Tab');
    await expect(alan).toHaveValue('15');
    await expect(page.locator('.param-duzeltme')).toContainText(/40 yerine üst sınır 15 uygulandı/);
    await alan.click();
    await alan.press('ControlOrMeta+a');
    await alan.pressSequentially('7');
    await expect(page.locator('.param-duzeltme')).toHaveCount(0);
  });

  test('V20 (Parametreler): sınır dışı taslak odaktan çıkınca sınıra çekilir; uygulanan değer ve nedeni görünür', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('searchbox', { name: 'Parametre ara' }).fill('Plan senaryosu: aylık elde tutma');
    const alan = page.getByLabel('Plan senaryosu: aylık elde tutma');
    await expect(alan).toBeVisible();
    await alan.click();
    await alan.press('ControlOrMeta+a');
    await alan.pressSequentially('150');
    await alan.press('Tab');
    expect((await alan.inputValue()).replace(/[^\d]/g, '')).toBe('100');
    await expect(page.locator('.param-duzeltme')).toContainText(/150 ?%? yerine üst sınır 100 ?%? uygulandı/);
  });

  test('V21 (Notlar): silme ve varsayılana dönüş onayı süreye bağlı değil (6 sn), kapsamı söyler, Vazgeç kapatır, ilk tıklama veri değiştirmez', async ({ page }) => {
    await page.goto('notlar/');
    await icerik(page);
    await hydrated(page);
    const satir = page.locator('.note-row', { hasText: 'Prim sistemi eklemeli' });
    await satir.getByRole('button', { name: /^Sil/ }).click();
    const onay = satir.getByRole('button', { name: /^Notu sil \(onayla\)/ });
    await expect(onay).toBeVisible();
    await page.waitForTimeout(6000);
    await expect(onay, 'onay süreye bağlı değil').toBeVisible();
    await expect(satir).toHaveCount(1);
    await satir.getByRole('button', { name: 'Vazgeç' }).click();
    await expect(onay).toHaveCount(0);
    await expect(satir.getByRole('button', { name: /^Sil/ })).toBeVisible();
    const sifirla = page.getByRole('button', { name: /^Varsayılan notlara dön/ });
    await sifirla.click();
    await expect(sifirla).toHaveText('Varsayılan notlara dön (onayla)');
    await page.waitForTimeout(6000);
    await expect(sifirla).toHaveText('Varsayılan notlara dön (onayla)');
    await page.getByRole('button', { name: 'Vazgeç' }).click();
    await expect(sifirla).toHaveText('Varsayılan notlara dön');
  });

  test('V21 (applet): örnek değerlere dönüş onayı kapsamı (kaç applet) ve süresiz; Vazgeç değeri korur', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('applet/');
    await icerik(page);
    await hydrated(page);
    const katsayi = page.getByRole('textbox', { name: 'Yazılım katsayısı' });
    await katsayi.fill('2');
    const don = page.locator('.param-toolbar .applet-eylem').first();
    await expect(don).toHaveText('Örnek değerlere dön');
    await don.click();
    await expect(don).toHaveText(/1 applet’i örnek değerlere döndür \(onayla\)/);
    await page.waitForTimeout(6000);
    await expect(don).toHaveText(/örnek değerlere döndür \(onayla\)/);
    await page.getByRole('button', { name: 'Vazgeç' }).click();
    await expect(don).toHaveText('Örnek değerlere dön');
    await expect(katsayi).toHaveValue('2');
  });

  test('V23: senaryo bağlantısı kopyalanamayınca hata durum satırında kalır (2,5 sn sonra da); düğmeler yer değiştirmez', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('reddedildi')) }, configurable: true });
    });
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const kurucu = page.locator('.kurucu');
    const dugme = kurucu.getByRole('button', { name: 'Senaryo bağlantısını kopyala' });
    const sifirla = kurucu.getByRole('button', { name: 'Sayfa seçeneklerini sıfırla' });
    const belge = async (l: typeof dugme) => {
      const b = (await l.boundingBox())!;
      const y = await page.evaluate(() => window.scrollY);
      return { x: b.x, y: b.y + y };
    };
    await dugme.scrollIntoViewIfNeeded();
    const once = [await belge(dugme), await belge(sifirla)];
    await dugme.click();
    const durum = kurucu.getByRole('status');
    await expect(durum).toContainText(/kopyalanamadı/);
    await page.waitForTimeout(3500);
    await expect(durum, 'hata kalıcı').toContainText(/kopyalanamadı/);
    await expect(dugme).toHaveText('Senaryo bağlantısını kopyala');
    const sonra = [await belge(dugme), await belge(sifirla)];
    for (let i = 0; i < 2; i++) {
      expect(Math.abs(sonra[i].x - once[i].x)).toBeLessThanOrEqual(1);
      expect(Math.abs(sonra[i].y - once[i].y)).toBeLessThanOrEqual(1);
    }
  });

  test('F12: not düzenleyici çok satırlı; Kaydet düğmesiyle kaydeder; sil düğmesinin erişilebilir adı notu söyler', async ({ page }) => {
    await page.goto('notlar/');
    await icerik(page);
    await hydrated(page);
    const satir = page.locator('.note-row', { hasText: 'Prim sistemi eklemeli' });
    await expect(satir.getByRole('button', { name: /Sil.*Prim sistemi eklemeli/ })).toHaveCount(1);
    await satir.getByRole('button', { name: /Düzenle/ }).click();
    const alan = page.getByLabel('Notu düzenle');
    expect(await alan.evaluate((el) => el.tagName)).toBe('TEXTAREA');
    await alan.fill('Prim sistemi eklemeli\nİkinci satır: kurallar');
    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.locator('.note-row', { hasText: 'İkinci satır: kurallar' })).toHaveCount(1);
  });

  test('F23: Giderler yüklenirken geçen süre ilerleme oranı değildir; veri gelince tablo', async ({ page }) => {
    const model = buildModel();
    await page.route('https://script.google.com/**', async (route) => {
      await new Promise((r) => setTimeout(r, 2500));
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(model, 'ozet-1')) });
    });
    await page.goto('giderler/');
    await hydrated(page);
    await expect(page.locator('.opex-loader-meta')).toContainText(/sn geçti · ilerleme oranı değil/);
    await expect(page.getByRole('region', { name: /^Kalemler · / })).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('gorsel_algi GA-4a: açık özet sözleşmesi ve matris kıyas profili', () => {
  test('V12/F07: kapalı kaydın özeti açık sözleşmeden gelir (istihdam katkı: gelire katkı; liyakat kişi: aylık artış; nakit: dönem sonu)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('istihdam/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.table-block:has(#istihdam-katki-tablo) .kayit-ozet-etiket').first()).toHaveText('Gelire katkı');
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.table-block:has(#nakit-tablo) .kayit-ozet-etiket').first()).toHaveText('Dönem sonu nakit');
    await page.goto('applet/#liyakat-matrisi');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.table-block:has(#merit-kisi-tablo) .kayit-ozet-etiket').first()).toHaveText('Aylık artış');
  });

  test('V13/F08: liyakat matrisi 320 px’te kapalı kayıt değil — performans seçilir, bütün compa sütunları açık listede, düzenleyici bağlamında', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('applet/#liyakat-matrisi');
    await icerik(page);
    await hydrated(page);
    const blok = page.locator('.table-block:has(#merit-matris-tablo)');
    await expect(blok.locator('.kayit')).toHaveCount(0);
    const eksen = blok.getByRole('group', { name: 'Performans' });
    await expect(eksen).toBeVisible();
    const alanlar = blok.locator('.matris-alanlar dt');
    await expect(alanlar).toHaveCount(5);
    await expect(alanlar.first()).toContainText('Compa');
    // Eksen değişince aynı sütunlar başka satırın değerleriyle; düzenleyiciler listede (textbox).
    const ilk = await blok.locator('.matris-alanlar input').first().inputValue();
    const secenekler = eksen.locator('.secim-dugme, [role="combobox"]');
    if ((await eksen.locator('.secim-dugme').count()) > 1) await eksen.locator('.secim-dugme').nth(4).click();
    else {
      await eksen.getByRole('combobox').click();
      await page.getByRole('option', { name: /Olağanüstü/ }).click();
    }
    await expect(alanlar).toHaveCount(5);
    expect(await blok.locator('.matris-alanlar input').first().inputValue()).not.toBe(ilk);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    void secenekler;
  });

  test('V13/F08: gelir planı duyarlılık matrisi 320 px’te kapasite seçilir, elde tutma sütunları açık listede', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const blok = page.locator('.table-block:has(#duyarlilik-tablo)');
    await blok.scrollIntoViewIfNeeded();
    await expect(blok.locator('.kayit')).toHaveCount(0);
    await expect(blok.getByRole('group', { name: 'Kapasite çarpanı', exact: true })).toBeVisible();
    const dt = await blok.locator('.matris-alanlar dt').allInnerTexts();
    expect(dt.length).toBeGreaterThan(2);
    for (const d of dt) expect(d).toMatch(/^%\d+$/);
  });
});

test.describe('gorsel_algi GA-4b: dar ekranda karar araçları — Giderler sıralama/filtre, yapışkan özet, bölüm gezgini', () => {
  test('V15: Giderler 320 px — toplam tutara göre sıralanır, yön değişir, etkin filtre görünür ve kaldırılır; masaüstüne geçmeden', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await giderlerAc(page);
    const blok = page.locator('.opex-veri');
    const kayitlar = blok.locator('.kayit');
    const ilkDeger = async () => (await kayitlar.first().locator('.kayit-ozet-deger').innerText()).replace(/[^\d]/g, '');
    const sira = blok.getByRole('group', { name: 'Sırala', exact: true });
    await expect(sira).toBeVisible();
    await sira.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Toplam ₺' }).click();
    await expect(blok.getByRole('group', { name: 'Yön', exact: true })).toBeVisible();
    const artan = Number(await ilkDeger());
    await blok.getByRole('group', { name: 'Yön', exact: true }).getByRole('button', { name: 'Azalan' }).click();
    await expect.poll(async () => Number(await ilkDeger())).toBeGreaterThan(artan);
    // Etkin filtre: panelden alt sınır; liste gösterir, Kaldır temizler.
    const once = await blok.locator('.opex-veri-sayi').innerText();
    await page.getByLabel('Toplam ₺ en az').fill('999999999');
    await expect(blok.locator('.opex-etkin-filtre')).toHaveCount(1);
    await expect(blok.locator('.opex-etkin-filtre')).toContainText('Toplam ₺ en az');
    await expect(blok.locator('.opex-veri-sayi')).not.toHaveText(once);
    await blok.getByRole('button', { name: /^Kaldır: Toplam ₺ en az/ }).click();
    await expect(blok.locator('.opex-etkin-filtre')).toHaveCount(0);
    await expect(blok.locator('.opex-veri-sayi')).toHaveText(once);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  });

  test('V16/F10: yapışkan özet 320 px’te öncelikli sonucu açık gösterir, diğerleri adlandırılmış listede; 1280’de hepsi; yatay kaydırma yok', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const ozet = page.locator('.yapiskan');
    await expect(ozet.locator('.yapiskan-cip')).toHaveCount(1);
    await expect(ozet.locator('.yapiskan-cip .yapiskan-etiket')).toHaveText('En yüksek birikmiş açık');
    const dugme = ozet.getByRole('button', { name: 'Diğer 5 sonuç' });
    await expect(dugme).toHaveAttribute('aria-expanded', 'false');
    expect(await ozet.locator('.yapiskan-cipler').evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await dugme.click();
    await expect(ozet.locator('.yapiskan-digerleri .yapiskan-cip')).toHaveCount(5);
    await expect(ozet.locator('.yapiskan-digerleri')).toContainText('Açığın kapanışı');
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(ozet.locator('.yapiskan-cip')).toHaveCount(6);
    await expect(ozet.getByRole('button', { name: /Diğer/ })).toHaveCount(0);
  });

  test('V17: iş ortaklığı 320 px — bölüm gezgini seçili bölümü ve konumunu söyler (6 / 8 · Ölçüm), bütün bölümlere erişim; adres ve bölüm değişir', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('partnership/#segika-olcum');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.ortak-alt')).toHaveCount(0);
    const gezgin = page.getByRole('group', { name: 'Segika bölümü' });
    await expect(gezgin.getByRole('combobox')).toHaveValue('6 / 8 · Ölçüm');
    await gezgin.getByRole('combobox').click();
    await page.getByRole('option', { name: '8 / 8 · Risk' }).click();
    await expect(page).toHaveURL(/#segika-risk$/);
    await expect(page.locator('#ortak-bolum .section-title').first()).toHaveText('Riskler ve karşılıklar');
    await expect(gezgin.getByRole('combobox')).toHaveValue('8 / 8 · Risk');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('tablist', { name: 'Segika bölümleri' })).toBeVisible();
  });
});

test.describe('gorsel_algi GA-5a: gezinti sözlüğü, bölüm dizini, oran çubuğu, kısa durum, uzun etiket', () => {
  test('V18/V29 (F19): her menü adı ile sayfa başlığı aynı yere işaret eder — kısa ad, tam ad ya da kırıntı sonu', async ({ page }) => {
    const duraklar = [...SEQUENCE, { ...APPLET_NAV, crumb: [] as string[] }];
    for (const d of duraklar) {
      await page.goto(d.path.replace(/^\//, ''));
      await icerik(page);
      const h1 = (await page.getByRole('heading', { level: 1 }).innerText()).trim();
      const kabul = new Set([d.label, d.tam ?? '', d.crumb[d.crumb.length - 1] ?? ''].filter(Boolean));
      expect(kabul.has(h1), `${d.path}: menü “${d.label}”${d.tam ? ` / tam ad “${d.tam}”` : ''} ↔ başlık “${h1}”`).toBe(true);
    }
  });

  test('V29 (F24): gelir planı bölüm dizini — kalıcı bölüm adresleri, dizinden bölüme ve bölümden dizine dönüş', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const dizin = page.getByRole('navigation', { name: 'Bölümler' });
    const baglantilar = dizin.getByRole('link');
    await expect(baglantilar).toHaveCount(9);
    const hrefler = await baglantilar.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')));
    expect(hrefler).toEqual(['#hedefler', '#kadro', '#dijital', '#gelir', '#senaryo', '#fiyat', '#huni', '#basabas', '#varsayim']);
    await dizin.getByRole('link', { name: /Başabaş/ }).click();
    await expect(page).toHaveURL(/#basabas$/);
    const ust = await page.locator('#basabas').evaluate((el) => el.getBoundingClientRect().top);
    // Yapışkan üst bant + özet (~124 px) altında, ama ilk ekranda.
    expect(ust).toBeGreaterThanOrEqual(120);
    expect(ust).toBeLessThan(280);
    await expect(page.locator('.section-geri a')).toHaveCount(9);
    await page.locator('#basabas .section-geri a').click();
    await expect(page).toHaveURL(/#bolum-dizini$/);
  });

  test('F08 (C054): kademe serisi tablosunda geometrik − aritmetik fark sütunu; F21 (C026): oran çubuğu tavan aşımını işaretler', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('applet/#kademe-serisi');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.table-block:has(#kademe-tablo) thead')).toContainText('Fark (geometrik − aritmetik)');
    // Oran çubuğu: 1’in üstü kırpılmaz gibi gösterilmez — aşım işareti ve erişilebilir metin.
    await page.goto('applet/#prim-egrisi');
    await icerik(page);
    await hydrated(page);
    const cubuklar = page.locator('.applet-cubuk');
    expect(await cubuklar.count()).toBeGreaterThan(0);
    const asim = await page.evaluate(() => [...document.querySelectorAll('.applet-cubuk')].map((c) => ({ asim: c.hasAttribute('data-asim'), isaret: !!c.querySelector('.applet-cubuk-asim') })));
    for (const c of asim) expect(c.asim).toBe(c.isaret);
  });

  test('F05 (C002): parametre uyarısı kısa durum + bağlantı; F12 (C098): Giderler bağlantı formunda kısa etiket + ayrı açıklama', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('searchbox', { name: 'Parametre ara' }).fill('Plan senaryosu: aylık elde tutma');
    const alan = page.getByLabel('Plan senaryosu: aylık elde tutma');
    await alan.click();
    await alan.fill('');
    await alan.pressSequentially('66');
    await alan.press('Tab');
    const uyari = page.locator('.params-notice');
    await expect(uyari).toContainText(/^1 parametre bu tarayıcıda değiştirildi/);
    expect((await uyari.innerText()).length).toBeLessThan(110);
    await expect(uyari.getByRole('link', { name: 'Parametreler' })).toHaveCount(1);
    // Bağlantı formu (anahtar isteyen uç): onay kutusu kısa adla, risk açıklaması ayrı ve görünür.
    await page.route('https://script.google.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false, hata: 'yetki', mesaj: 'Bu veri ucu erişim anahtarı istiyor ya da anahtar geçersiz.' }) }));
    await page.goto('giderler/');
    await hydrated(page);
    const kutu = page.getByRole('checkbox', { name: 'Bu cihazda hatırla', exact: true });
    await expect(kutu).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.opex-check-desc')).toContainText(/Önerilmez/);
  });
});
