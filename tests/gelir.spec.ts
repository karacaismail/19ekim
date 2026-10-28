import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * Gelir planı (/gelir-plani/), UX-first yeniden kurulum (kullanıcı kararı 2026-10-27): sayfanın başında senaryo kurucu
 * (hazır senaryolar + ayrıntılı seçenekler; tek durum, adres çubuğunda), kaydırırken üstte kalan yapışkan özet; bütün
 * bölümler, tablolar ve grafikler aynı anda değişir. Takvim 19 Ekim 2026 → Aralık 2027, ilk satış 6 Kasım. Sheets
 * isteği sahte yanıtla kapatılır (gider kaynağı plana düşer).
 */
const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });
/** Hazır senaryo seçimi: geniş ekranda segment düğmesi; dar ekranda (gorsel_algi.md §5.2) markalı seçim kutusu. */
async function hazirSec(page: Page, ad: string) {
  const grup = page.locator('.kurucu').getByRole('group', { name: 'Hazır senaryolar' });
  const dugme = grup.getByRole('button', { name: ad, exact: true });
  if (await dugme.count()) await dugme.click();
  else {
    await grup.getByRole('combobox').click();
    await page.getByRole('option', { name: ad, exact: true }).click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('https://script.google.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
});

test.describe('gelir planı', () => {
  test('menüde ve sunum sırasında; kurucu, yapışkan özet, yedi hedef kartı, zaman çizelgesi, kaynaklar, on grafik, dokuz bölüm', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gelir planı');
    // Dönem ve ilk satış tek PageHeader’ın dönem satırında (ux.md M03, P6.1).
    await expect(page.locator('.page-meta')).toContainText('19 Ekim 2026 – Aralık 2027');
    await expect(page.locator('.page-meta')).toContainText('6 Kasım 2026');
    // ux.md §5.4 sırası (P6.2, M05): amaç → bağlam/senaryo ve ana sonuç (yapışkan özet + sonuç bloğu) → eylem (kurucu) →
    // destekleyici veri (bölümler). Kurucu ilk bölümden önce kalır (kullanıcı kararı 2026-10-27).
    const sira = await page.evaluate(() => {
      const ust = (sel: string) => document.querySelector(sel)!.getBoundingClientRect().top;
      return ust('.yapiskan') <= ust('.sonuc') && ust('.sonuc') < ust('.kurucu') && ust('.kurucu') < ust('.section');
    });
    expect(sira).toBe(true);
    await expect(page.locator('.section')).toHaveCount(9);
    await expect(page.locator('.gelir-hedef')).toHaveCount(7);
    await expect(page.locator('.gelir-hedef').first().locator('.gelir-hedef-sayi')).toHaveText('10 aktif');
    // Takvim sırası: kartların tarihleri artan; başlangıç 19 Ekim (ilk hedef en az 18 gün sonra).
    const gunler = await page.locator('.gelir-hedef-bilgi dd').evaluateAll((dds) => dds.filter((_, i) => i % 6 === 0).map((dd) => parseInt(dd.textContent ?? '', 10)));
    const sayisal = gunler.filter((g) => !Number.isNaN(g));
    expect(sayisal).toEqual([...sayisal].sort((a, b) => a - b));
    expect(sayisal[0]).toBeGreaterThanOrEqual(18);
    await expect(page.locator('.gelir-zaman .hire-item')).toHaveCount(7);
    await expect(page.locator('#kaynak-tablo')).toHaveText('Satış kanalları: başlangıç, düzen ve ayda beklenen yeni satıcı');
    await expect(page.locator('.table-block:has(#kaynak-tablo) tbody tr')).toHaveCount(7);
    await expect(page.locator('.chart-canvas')).toHaveCount(10);
    // Aylık tablo Ekim 2026 – Aralık 2027: 15 satır; ilk satış öncesi ay vurgulu ve geliri 0.
    const aylik = page.locator('.table-block:has(#aylik-tablo) tbody tr');
    await expect(aylik).toHaveCount(15);
    await expect(aylik.first().locator('th')).toHaveText('Eki 2026');
    await expect(aylik.first()).toHaveAttribute('data-tone', 'total');
    await expect(aylik.first().locator('td').nth(3)).toHaveText('0 ₺');
    await expect(aylik.last().locator('th')).toHaveText('Ara 2027');
    await expect(page.locator('.table-block:has(#basabas-aylar-tablo) tbody tr')).toHaveCount(15);
    // “Ufukta yok” yazılmaz.
    await expect(page.locator('main')).not.toContainText('Ufukta yok');
    // Finans menüsü (docs/contents.md §5.2, 2026-10-28) ve sunum sırası
    await page.getByRole('button', { name: 'Finans' }).click();
    const menu = page.getByRole('menu', { name: 'Finans' });
    await expect(menu.getByRole('menuitem', { name: 'Gelir planı' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(page.locator('.pager-link[rel="prev"] .pager-label')).toHaveText('90 gün hedefleri');
    await expect(page.locator('.pager-link[rel="next"] .pager-label')).toHaveText('Eylem planı');
  });

  test('senaryo kurucu: hazır senaryo tüm sayfayı tek seferde değiştirir; seçenek “özel” yapar; adres çubuğu ve saklama; nakit akışı temel senaryoyu okur', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const kurucu = page.locator('.kurucu');
    const hazir = kurucu.getByRole('group', { name: 'Hazır senaryolar' });
    await expect(hazir.getByRole('button')).toHaveText(['Kötümser', 'Medyan', 'İyimser', 'Saha ağırlıklı', 'Dijital ağırlıklı', 'Tutumlu', 'Yatırımlı büyüme']);
    await expect(hazir.getByRole('button', { name: 'Medyan' })).toHaveAttribute('aria-pressed', 'true');
    const ozet = page.locator('.yapiskan');
    await expect(ozet.locator('.yapiskan-ad')).toHaveText('Medyan');
    await expect(ozet.locator('.yapiskan-cip')).toHaveCount(6);
    const aktifMedyan = await ozet.locator('.yapiskan-cip').first().locator('.yapiskan-deger').textContent();
    const kartMedyan = await page.locator('.gelir-hedef', { hasText: '100 aktif satıcı' }).locator('.gelir-hedef-tarih').textContent();
    // Hazır senaryo: özet, kartlar, araç çubuğu etiketi ve tablo aynı anda değişir; adres çubuğu yazılır.
    await hazir.getByRole('button', { name: 'Kötümser' }).click();
    await expect(ozet.locator('.yapiskan-ad')).toHaveText('Kötümser');
    await expect(ozet.locator('.yapiskan-cip').first().locator('.yapiskan-deger')).not.toHaveText(aktifMedyan ?? '');
    await expect(page.locator('.gelir-hedef', { hasText: '100 aktif satıcı' }).locator('.gelir-hedef-tarih')).not.toHaveText(kartMedyan ?? '');
    await expect(page.locator('.araclar-etiket').first()).toHaveText('Senaryo: Kötümser');
    await expect(page.locator('.table-block:has(#senaryolar-tablo) tbody tr[data-tone="secili"] th')).toContainText('Kötümser');
    await expect(page).toHaveURL(/senaryo=kotumser/);
    expect(await page.evaluate(() => localStorage.getItem('istoc-plan-senaryo'))).toBe('kotumser');
    // Örnek bileşim: temel medyan + seçenekler; ayrıntılı seçeneklerde değerler görünür.
    await hazir.getByRole('button', { name: 'Saha ağırlıklı' }).click();
    await expect(ozet.locator('.yapiskan-ad')).toHaveText('Saha ağırlıklı');
    const acici = kurucu.getByRole('button', { name: /Ayrıntılı seçenekler/ });
    if ((await acici.getAttribute('aria-expanded')) === 'false') await acici.click();
    const secenekler = kurucu.getByRole('group', { name: 'Ayrıntılı seçenekler' });
    await expect(secenekler.getByRole('group', { name: 'Ek saha personeli' }).getByRole('button', { name: '+2 kişi' })).toHaveAttribute('aria-pressed', 'true');
    await expect(secenekler.getByRole('group', { name: 'Aylık reklam bütçesi' }).getByRole('button', { name: 'Yok' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/eksaha=2/);
    // Bir seçenek değişince senaryo “özel” olur; sıfırla hazır senaryoya döner.
    await secenekler.getByRole('group', { name: 'Yıllık kur artışı' }).getByRole('button', { name: '%0', exact: true }).click();
    await expect(hazir.getByRole('button', { name: /^Özel/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(ozet.locator('.yapiskan-ad')).toContainText('Özel: Medyan');
    await expect(page).toHaveURL(/kur=0/);
    await kurucu.getByRole('button', { name: 'Sayfa seçeneklerini sıfırla' }).click();
    await expect(hazir.getByRole('button', { name: 'Medyan' })).toHaveAttribute('aria-pressed', 'true');
    // Adres çubuğundan açılış: aynı seçenekler.
    await page.goto('gelir-plani/?senaryo=iyimser&eksaha=1&reklam=2');
    await icerik(page);
    await hydrated(page);
    // gorsel_algi.md F01 (2026-10-28): seçenek yalnız “Özel”; temel ve değişiklik sayısı grubun yardım satırında.
    await expect(hazir.getByRole('button', { name: 'Özel', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(hazir.locator('.secim-not')).toContainText(/İyimser temelinde 2 seçenek değiştirildi/);
    // Yenilenince saklanan seçim kalır; nakit akış tablosu temel senaryoyu (iyimser) okur.
    await page.goto('nakit-akisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByRole('group', { name: 'Senaryo' }).first().getByRole('button', { name: 'İyimser' })).toHaveAttribute('aria-pressed', 'true');
    // B2 (ct-F04): seçenekler de taşınır — nakit akışı aynı özel senaryo adını ve değişiklik sayısını gösterir.
    await expect(page.locator('.sonuc-baslik')).toContainText('Özel: İyimser + 2 değişiklik');
    await expect(page.locator('.nakit-secenekler')).toContainText(/2 değişiklik/);
    await page.evaluate(() => {
      localStorage.removeItem('istoc-plan-senaryo');
      localStorage.removeItem('istoc-plan-senaryo-secenekler');
    });
  });

  /*
   * ux.md M05 ResultSummary (P6.2, kullanıcı kararı 2026-10-27): seçili senaryonun ana sonucu (en çok fon ihtiyacı) dönem,
   * birim ve kıyas temeliyle ilk ekranda (320×480); başabaş durumu (kritik risk) accordion’a gizlenmez; yapışkan özetle aynı
   * kaynaktan (aynı değer), tek yapışkan özet.
   */
  test('ana sonuç (M05): fon ihtiyacı 320×480 ilk ekranda; dönem, birim, kıyas; risk gizli değil; yapışkan özetle tek kaynak', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const sonuc = page.locator('.sonuc');
    await expect(sonuc).toHaveCount(1);
    await expect(page.locator('.yapiskan')).toHaveCount(1);
    const deger = sonuc.locator('.sonuc-deger');
    await expect(deger).toContainText('₺');
    const kutu = await deger.evaluate((el) => el.getBoundingClientRect());
    expect(kutu.top, 'ana sonuç ilk ekranda').toBeGreaterThanOrEqual(0);
    expect(kutu.bottom, 'ana sonuç kaydırmadan tam görünür').toBeLessThanOrEqual(480);
    await expect(sonuc.locator('.sonuc-etiket')).toContainText('En yüksek birikmiş açık');
    await expect(sonuc.locator('.sonuc-donem')).toContainText('19 Ekim 2026 – Aralık 2027');
    // Kıyas temeli: hazır senaryolar aynı ölçüyle; seçili olan işaretli.
    const kiyas = sonuc.locator('.sonuc-kiyas dl > div');
    await expect(kiyas.locator('dt')).toContainText([/Kötümser/, /Medyan/, /İyimser/]);
    await expect(sonuc.locator('.sonuc-kiyas dl > div[data-secili] dt')).toContainText('Medyan');
    // Durum görünür (accordion/gizli kapsayıcı içinde değil) ve veriyle tutarlı: başabaş varsa tarih, yoksa eğilim/kapanmıyor.
    const durum = sonuc.locator('.sonuc-durum');
    await expect(durum).toBeVisible();
    expect(await durum.evaluate((el) => !!el.closest('[hidden], .kayit-panel, details'))).toBe(false);
    // Ton ile metin tutarlı: iyi = başabaş tarihi; uyarı = eğilimle ≈ tarih; risk = kapanmıyor (sürdürülebilir değil).
    const tutarli = async () => {
      const ton = await durum.getAttribute('data-ton');
      const metin = (await durum.textContent()) ?? '';
      expect(ton).toMatch(/^(iyi|uyari|risk)$/);
      expect(metin).toMatch(ton === 'iyi' ? /Aylık başabaş \d/ : ton === 'uyari' ? /≈/ : /kapanmıyor.*sürdürülebilir değil/);
    };
    await tutarli();
    // Tek kaynak: yapışkan özetin “Birikmiş açık” çipi ile ana sonuç aynı değer (ifade.md C11).
    const cip = page.locator('.yapiskan-cip', { hasText: 'Birikmiş açık' }).locator('.yapiskan-deger');
    expect((await cip.textContent())?.trim()).toBe((await deger.textContent())?.trim());
    // Senaryo değişince sonuç ve kıyas işareti değişir; riskli seçeneklerde durum riske döner ve yine gizlenmez.
    const kurucu = page.locator('.kurucu');
    await hazirSec(page, 'Kötümser');
    await expect(sonuc.locator('.sonuc-kiyas dl > div[data-secili] dt')).toContainText('Kötümser');
    const acici = kurucu.getByRole('button', { name: /Ayrıntılı seçenekler/ });
    if ((await acici.getAttribute('aria-expanded')) === 'false') await acici.click();
    const secenekler = kurucu.getByRole('group', { name: 'Ayrıntılı seçenekler' });
    // Riskli seçenekler (ek sabit gider, düşük elde tutma, reklamsız): sonuç ve durum anında değişir, durum yine görünür
    // ve tonuyla tutarlı; özel senaryo kıyasa dördüncü satır olarak girer; şerit ile blok aynı değeri taşır.
    const onceki = (await deger.textContent())?.trim();
    await secenekler.getByRole('group', { name: 'Aylık ek sabit gider' }).getByRole('button', { name: '+500 bin ₺' }).click();
    await secenekler.getByRole('group', { name: 'Aylık elde tutma' }).getByRole('button', { name: '%60', exact: true }).click();
    await secenekler.getByRole('group', { name: 'Aylık reklam bütçesi' }).getByRole('button', { name: 'Yok' }).click();
    await expect(deger).not.toHaveText(onceki ?? '');
    await expect(durum).toBeVisible();
    await tutarli();
    await expect(kiyas).toHaveCount(4);
    await expect(sonuc.locator('.sonuc-kiyas dl > div[data-secili] dt')).toContainText(/^Özel/);
    expect((await page.locator('.yapiskan-cip', { hasText: 'Birikmiş açık' }).locator('.yapiskan-deger').textContent())?.trim()).toBe((await deger.textContent())?.trim());
    await page.evaluate(() => {
      localStorage.removeItem('istoc-plan-senaryo');
      localStorage.removeItem('istoc-plan-senaryo-secenekler');
    });
  });

  test('yapışkan özet kaydırınca üstte kalır; kopyalama bağlantısı; CSV indirme', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined);
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    await page.locator('#basabas').scrollIntoViewIfNeeded();
    const konum = await page.locator('.yapiskan').evaluate((el) => ({ top: el.getBoundingClientRect().top, sticky: getComputedStyle(el).position }));
    expect(konum.sticky).toBe('sticky');
    expect(konum.top).toBeLessThan(120);
    expect(konum.top).toBeGreaterThanOrEqual(0);
    await page.locator('.kurucu').scrollIntoViewIfNeeded();
    await page.locator('.kurucu').getByRole('button', { name: 'Senaryo bağlantısını kopyala' }).click();
    await expect(page.locator('.kurucu').getByRole('status')).toContainText(/kopyalandı|kopyalanamadı/);
    const [indirme] = await Promise.all([page.waitForEvent('download'), page.locator('.table-block:has(#aylik-tablo)').getByRole('button', { name: 'CSV indir' }).click()]);
    expect(indirme.suggestedFilename()).toMatch(/^gelir-plani-aylik-.*\.csv$/);
  });

  test('“Üçü üst üste” görünümü grafiği değiştirir; eksen anahtarı sağda; başabaş grafikleri çizilir', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const canvas = (id: string) => page.locator(`#${id} .chart-canvas`).first();
    await expect(canvas('kadro')).toHaveAttribute('data-kind', 'kaynak-ay');
    await page.locator('#kadro').getByRole('group', { name: 'Görünüm' }).first().getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(canvas('kadro')).toHaveAttribute('data-kind', 'seri-cizgi');
    await expect(canvas('kadro').locator('svg')).toBeVisible({ timeout: 10_000 });
    await expect(canvas('gelir')).toHaveAttribute('data-kind', 'gelir-ay');
    await page.locator('#gelir').getByRole('group', { name: 'Görünüm' }).first().getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(canvas('gelir')).toHaveAttribute('data-kind', 'grup-ay');
    // gorsel_algi.md F05/F15 (2026-10-28): tablo başlığı varyantla değişmez; senaryo adı araç çubuğu etiketinde, başlıkta tekrar etmez.
    await expect(page.locator('#aylik-tablo')).toHaveText(/^Ay ay: bütün aylar, 2027 sonuna kadar$/);
    await page.locator('#huni').getByRole('group', { name: 'Görünüm' }).first().getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(canvas('huni')).toHaveAttribute('data-kind', 'hedef-adim');
    const bolum = page.locator('#basabas');
    await expect(bolum.locator('.chart-canvas')).toHaveCount(3);
    const eksen = bolum.locator('.chart').first().getByRole('group', { name: 'Eksen' });
    const konum = await eksen.evaluate((el) => {
      const bar = el.closest('.araclar')!.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { right: bar.right - r.right, left: r.left - bar.left };
    });
    expect(konum.right).toBeLessThan(konum.left);
    await eksen.getByRole('button', { name: 'Kümülatif' }).click();
    // gorsel_algi.md F15 (2026-10-28): grafik başlığı eksenle değişmez; ölçü farkı grafiğin altındaki notta.
    await expect(bolum.locator('.chart').first().locator('.chart-title')).toContainText('Gelir ve gider');
    await expect(bolum.locator('.chart').first().locator('.chart-altnot')).toContainText('Kümülatif gelir ve kümülatif gider');
    for (let i = 0; i < 3; i++) {
      const c = bolum.locator('.chart-canvas').nth(i);
      await c.scrollIntoViewIfNeeded();
      await expect(c.locator('svg')).toBeVisible({ timeout: 10_000 });
    }
    await expect(bolum.locator('#filtre-etkisi-tablo')).toBeVisible();
    await expect(bolum.locator('.table-block:has(#duyarlilik-tablo) tbody tr')).toHaveCount(4);
  });

  test('dijital strateji ve kadro katkısı: zincir, kanallar, kademeler, takvim; rol tablosu dolaylı rolleri işaretler; istihdam takvimi aynı tabloyu okur', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const dij = page.locator('#dijital');
    await expect(dij.locator('.stat')).toHaveCount(6);
    await expect(dij.locator('.table-block:has(#kanallar-tablo) tbody tr')).toHaveCount(6);
    await expect(dij.locator('.table-block:has(#kademeler-tablo) tbody tr')).toHaveCount(5);
    await expect(dij.locator('.table-block:has(#kademeler-tablo) tbody tr[data-tone="secili"] th')).toContainText('30 bin');
    await expect(dij.locator('.table-block:has(#dijital-takvim-tablo) tbody tr')).toHaveCount(4);
    const kadro = page.locator('#kadro');
    const katki = kadro.locator('.table-block:has(#katki-tablo) tbody tr');
    await expect(katki).toHaveCount(11);
    await expect(katki.filter({ hasText: 'Büyüme: saha personeli' })).toHaveCount(1);
    await expect(katki.filter({ hasText: 'Yönetici asistanı' })).toHaveAttribute('data-tone', 'total');
    await expect(katki.filter({ hasText: 'Yönetici asistanı' }).locator('td', { hasText: /^Dolaylı$/ })).toHaveCount(1);
    await kadro.locator('.table-block:has(#katki-tablo)').getByRole('group', { name: 'Görünüm' }).getByRole('button', { name: 'Üçü üst üste' }).click();
    await expect(kadro.locator('.table-block:has(#katki-tablo) thead th')).toHaveCount(8);
    await page.goto('istihdam/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('#katki .table-block:has(#istihdam-katki-tablo) tbody tr')).toHaveCount(11);
  });

  test('320 px: taşma yok, kurucu ve yapışkan özet sığar, hedef kartları tek sütun, seçim düğmeleri ≥ 44 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('gelir-plani/');
    await icerik(page);
    await hydrated(page);
    const d = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      cols: new Set([...document.querySelectorAll<HTMLElement>('.gelir-hedef')].map((el) => Math.round(el.getBoundingClientRect().left))).size,
      link: document.querySelector<HTMLElement>('.text-link[data-standalone]')?.getBoundingClientRect().height ?? 0,
      small: [...document.querySelectorAll<HTMLElement>('.gelir-hedef *, .secim *, .yapiskan *, .kurucu *')].filter((el) => el.textContent?.trim() && parseFloat(getComputedStyle(el).fontSize) < 14).length,
      hit: Math.min(...[...document.querySelectorAll<HTMLElement>('.secim-dugme')].filter((el) => el.getClientRects().length).map((el) => el.getBoundingClientRect().height)),
      kurucu: document.querySelector<HTMLElement>('.kurucu')!.getBoundingClientRect().width <= window.innerWidth,
      yapiskan: document.querySelector<HTMLElement>('.yapiskan')!.getBoundingClientRect().width <= window.innerWidth,
      secenekGizli: document.querySelector<HTMLElement>('#kurucu-secenekler')!.hidden,
    }));
    expect(d.overflow).toBeLessThanOrEqual(0);
    expect(d.cols).toBe(1);
    expect(d.link).toBeGreaterThanOrEqual(44);
    expect(d.small).toBe(0);
    expect(d.hit).toBeGreaterThanOrEqual(44);
    expect(d.kurucu).toBe(true);
    expect(d.yapiskan).toBe(true);
    // Dar ekranda ayrıntılı seçenekler kapalı gelir (ilk ekran hazır senaryolara kalır); düğme açar.
    expect(d.secenekGizli).toBe(true);
    await page.locator('.kurucu').getByRole('button', { name: /Ayrıntılı seçenekler/ }).click();
    await expect(page.locator('#kurucu-secenekler')).toBeVisible();
    // ux.md §8 (UX-01): çok sütunlu tablolar 320 px’te kayıt listesi; yatay kayan tablo bölgesi yok.
    await expect(page.locator('.table-scroll:not(.chart-scroll)')).toHaveCount(0);
    expect(await page.locator('.kayitlar').count()).toBeGreaterThan(5);
    // Kadro katkı tablosu: her rol bir kayıt (on bir rol); başlıkta rol adı.
    const kadro = page.locator('.table-block:has(#katki-tablo) .kayit');
    await expect(kadro).toHaveCount(11);
    await expect(page.locator('.table-block:has(#katki-tablo) .kayit-ad')).toHaveCount(11);
    // ux_v2.md §4.1: tanısal özet — kadro kaydının başlığında görev metni değil gelire katkı; senaryolar tablosu ölçüt
    // başına kayıt (özet seçili senaryo, panelde üç senaryo art arda).
    await expect(kadro.first().locator('.kayit-ozet-etiket')).toContainText(/katkı/i);
    const senaryolar = page.locator('.table-block:has(#senaryolar-tablo) .kayit');
    await expect(senaryolar.first().locator('.kayit-ad')).toHaveText('Varsayım');
    await expect(senaryolar.first().locator('.kayit-ozet-etiket')).toHaveText('Medyan');
    await expect(senaryolar.last().locator('.kayit-ad')).toHaveText('En yüksek birikmiş açık');
    await expect(senaryolar.last().locator('dl.kayit-alanlar dt')).toHaveText(['Kötümser', 'Medyan', 'İyimser']);
  });

  // gorsel_algi.md (kullanıcı kararı 2026-10-28) F15 / süreklilik ilkesi ve kullanıcının ekran görüntüsü: görünüm varyantı
  // değişince araç çubuğundaki bileşenler yer değiştirmez — iki varyantta aynı araçlar (Dışa aktar + Görünüm), başlık sabit;
  // “Üçü üst üste” görünümünde de CSV indirilir (hazır senaryo sütunlarıyla).
  for (const genislik of [1280, 320]) {
    test(`${genislik} px: görünüm değişince araç çubuğu bileşenleri yerinde kalır; üst üste görünümde CSV indirilir`, async ({ page }) => {
      await page.setViewportSize({ width: genislik, height: genislik === 320 ? 480 : 800 });
      await page.goto('gelir-plani/');
      await icerik(page);
      await hydrated(page);
      await page.evaluate(() => document.fonts.ready);
      // Grafik blokları da: başlık sabit, görünüm anahtarı figür içinde yerinde (varyanta bağlı açıklama grafiğin altında).
      for (const [bolum, secenek] of [['#kadro', 'Üçü üst üste'], ['#gelir', 'Üçü üst üste'], ['#huni', 'Üçü üst üste'], ['#basabas', 'Kümülatif']] as const) {
        const figur = page.locator(`${bolum} figure.chart`).filter({ has: page.getByRole('button', { name: secenek }) }).first();
        const grup = figur.locator('.araclar .secim').last();
        await figur.scrollIntoViewIfNeeded();
        const konum = async () => {
          const f = (await figur.boundingBox())!;
          const q = (await grup.boundingBox())!;
          return { x: q.x - f.x, y: q.y - f.y, baslik: await figur.locator('.chart-title').innerText() };
        };
        const once = await konum();
        await grup.getByRole('button', { name: secenek }).click();
        await expect(grup.getByRole('button', { name: secenek })).toHaveAttribute('aria-pressed', 'true');
        const sonra = await konum();
        expect(sonra.baslik, `${bolum} grafik başlığı sabit`).toBe(once.baslik);
        expect(Math.abs(sonra.x - once.x), `${bolum} grafik anahtarı x`).toBeLessThanOrEqual(1);
        expect(Math.abs(sonra.y - once.y), `${bolum} grafik anahtarı y`).toBeLessThanOrEqual(1);
      }
      const tablolar: [string, RegExp, RegExp][] = [
        ['#katki-tablo', /^gelir-plani-kadro-senaryolar-.*\.csv$/, /Kötümser: katkı/],
        ['#aylik-tablo', /^gelir-plani-aylik-senaryolar-.*\.csv$/, /Kötümser: aylık/],
      ];
      for (const [baslik, dosya, sutun] of tablolar) {
        const blok = page.locator(`.table-block:has(${baslik})`);
        const gorunum = blok.getByRole('group', { name: /görünüm/i });
        const csv = blok.getByRole('button', { name: 'CSV indir' });
        await blok.scrollIntoViewIfNeeded();
        const konum = async () => {
          const b = (await blok.boundingBox())!;
          const g = (await gorunum.boundingBox())!;
          const c = (await csv.boundingBox())!;
          return { gx: g.x - b.x, gy: g.y - b.y, cx: c.x - b.x, cy: c.y - b.y };
        };
        const ilkBaslik = await blok.locator(baslik).innerText();
        const once = await konum();
        await gorunum.getByRole('button', { name: 'Üçü üst üste' }).click();
        await expect(gorunum.getByRole('button', { name: 'Üçü üst üste' })).toHaveAttribute('aria-pressed', 'true');
        expect(await blok.locator(baslik).innerText(), `${baslik} başlık sabit`).toBe(ilkBaslik);
        const sonra = await konum();
        for (const k of ['gx', 'gy', 'cx', 'cy'] as const) expect(Math.abs(sonra[k] - once[k]), `${baslik} ${k}`).toBeLessThanOrEqual(1);
        const [indirme] = await Promise.all([page.waitForEvent('download'), csv.click()]);
        expect(indirme.suggestedFilename()).toMatch(dosya);
        expect(readFileSync((await indirme.path())!, 'utf8')).toMatch(sutun);
        await gorunum.getByRole('button', { name: 'Seçili senaryo' }).click();
      }
    });
  }
});
