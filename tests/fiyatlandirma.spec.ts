import { expect, test } from './fixtures/persona';
import { CANLI_PAKETLER } from '../src/data/canliPaketler';
import {
  DEGISIMLER,
  EK_MODULLER,
  ELESTIRILER,
  FIYAT_TABLOSU_NOTU,
  KAPSAM,
  KARARLAR,
  KOTA_NOTU,
  ONERI_PAKETLERI,
  SAYFA_NOTU,
  aciklamaCeliskileriBul,
  iyelik,
} from '../src/data/fiyatlandirma';
import { BASIC, ENTERPRISE, HAZIRLIK_ADI, MODELLER, PLATINIUM, UCRETSIZ_URUN, paketler } from '../src/data/gelirModelleri';
import { DEFAULT_PARAMS } from '../src/data/params';

/**
 * Fiyatlandırma önerisi (kullanıcı isteği 2026-11-12, adres `/pricing/`): bugünkü fiyat tablosu canlı veriden gelir,
 * eleştiri dokuz sorunu kaynağıyla yazar, önerilen dört paketin Basic ve Platinium fiyatı fiyat tablosuyla aynıdır, kapsam
 * altı başlıkta aynı hizadadır, ek modüllerin hazırlığı gelir modellerinden gelir. Sayfa öneridir: fiyat tablosu değişmez.
 * Paketler bölümünde fiyat tablosunda olmayan bir euro tutarı yazılmaz (indirim yasağı, 2026-11-10).
 */

const GENISLIKLER: [number, number][] = [
  [320, 900],
  [360, 900],
  [375, 900],
  [390, 900],
  [767, 900],
  [768, 1024],
  [1023, 900],
  [1024, 900],
  [1280, 900],
  [844, 390],
];

for (const [genislik, yukseklik] of GENISLIKLER) {
  test(`fiyatlandırma ${genislik}×${yukseklik}: eleştiri, paketler, kapsam, modüller, taşma yok, metin ≥ 14 px`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: yukseklik });
    await page.goto('pricing/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fiyatlandırma');

    await expect(page.locator('.pz-degisim')).toHaveCount(DEGISIMLER.length);
    await expect(page.locator('.pz-elestiri')).toHaveCount(ELESTIRILER.length);
    // Her eleştiride üç alan var: bugün, neden önemli ve öneri.
    await expect(page.locator('.pz-elestiri .pz-alan')).toHaveCount(ELESTIRILER.length * 3);

    const paketlerListesi = page.locator('#paketler .pz-paket');
    await expect(paketlerListesi).toHaveCount(ONERI_PAKETLERI.length);
    await expect(paketlerListesi.locator('.pz-paket-ad')).toHaveText(['Ücretsiz', BASIC, PLATINIUM, ENTERPRISE]);

    await expect(page.locator('.pz-kapsam .table-block')).toHaveCount(KAPSAM.length);
    await expect(page.locator('.pz-modul')).toHaveCount(EK_MODULLER.length);
    await expect(page.locator('#kararlar .pz-kural')).toHaveCount(KARARLAR.length);
    await expect(page.locator('#kapsam .pz-notlar')).toContainText(KOTA_NOTU);
    await expect(page.locator('.pz-giris')).toContainText(SAYFA_NOTU);
    // Dar ekranda bugünkü planlar kayıt listesidir. Kayıt başlıkları paket adlarıdır.
    if (genislik < 768) for (const p of CANLI_PAKETLER) await expect(page.locator('#bugun .table-block[data-kabuk="kayit"]')).toContainText(p.ad);

    const olcum = await page.evaluate(() => ({
      tasma: document.documentElement.scrollWidth - innerWidth,
      kucuk: [...document.querySelectorAll<HTMLElement>('.pz-sayfa *')]
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
        .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14 || Number(getComputedStyle(e).fontWeight) < 300)
        .map((e) => e.className || e.tagName),
      // Tablo 48em’den geniş kapsayıcıda kendi kutusunda kayar (ui.tsx useKabuk). Kutunun içi sayılmaz.
      disari: [...document.querySelectorAll<HTMLElement>('.pz-sayfa *')]
        .filter((e) => !e.parentElement?.closest('.table-scroll') && e.getBoundingClientRect().right > innerWidth + 1)
        .map((e) => e.className || e.tagName),
      metin: document.querySelector<HTMLElement>('.pz-sayfa')!.textContent ?? '',
    }));
    expect(olcum.tasma).toBeLessThanOrEqual(0);
    expect(olcum.disari).toEqual([]);
    expect(olcum.kucuk).toEqual([]);
    expect(olcum.metin).not.toMatch(/[;—]/);
    expect(olcum.metin).toContain('12 Kasım 2026');
    expect(olcum.metin).not.toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
  });
}

test('fiyatlandırma: bugünkü tablo canlı veriden, önerilen fiyat fiyat tablosundan gelir', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('pricing/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const bugun = page.locator('#bugun table');
  await expect(bugun.locator('tbody tr')).toHaveCount(CANLI_PAKETLER.length);
  for (const p of CANLI_PAKETLER) await expect(bugun).toContainText(p.ad);
  // Önerilen Basic ve Platinium fiyatı fiyat tablosundaki fiyattır (fiyat kuralı, 2026-11-10).
  const tablo = paketler(DEFAULT_PARAMS);
  const fiyat = (id: string) => `${tablo.find((p) => p.id === id)!.aylikEur!.toLocaleString('tr-TR')} €`;
  await expect(page.locator('#oneri-standart .pz-paket-tutar')).toHaveText(fiyat('standart'));
  await expect(page.locator('#oneri-pro .pz-paket-tutar')).toHaveText(fiyat('pro'));
  await expect(page.locator('#oneri-ucretsiz .pz-paket-tutar')).toHaveText('0 €');
  await expect(page.locator('#oneri-kurumsal .pz-paket-tutar')).toHaveText('Teklif');
  // Yıllık peşin fiyat da fiyat tablosundan gelir ve kaç aylık ücrete eşit olduğu yazılır.
  for (const id of ['standart', 'pro'] as const) {
    const p = tablo.find((x) => x.id === id)!;
    await expect(page.locator(`#oneri-${id} .pz-paket-yillik`)).toHaveText(`Yıllık peşin ${p.yillikEur!.toLocaleString('tr-TR')} €. Bu tutar ${DEFAULT_PARAMS.annualMonths} aylık ücrete eşittir.`);
  }
  // İndirim yasağı: paketler bölümündeki her euro tutarı fiyat tablosunda vardır ya da 0 €’dur.
  const izinli = new Set(['0', ...tablo.flatMap((p) => [p.aylikEur, p.yillikEur]).filter((n): n is number => n !== null).map((n) => n.toLocaleString('tr-TR'))]);
  const tutarlar = ((await page.locator('#paketler').textContent()) ?? '').match(/\d[\d.]*(?=\s?€)/g) ?? [];
  expect(tutarlar.length).toBeGreaterThan(3);
  for (const t of tutarlar) expect(izinli.has(t), `${t} €`).toBe(true);
  await expect(page.locator('#paketler')).toContainText(FIYAT_TABLOSU_NOTU);
  // Kapsam tablosunda bugünden farklı hücre etiketlidir: Basic ve Platinium’da teklif yanıtı yenidir.
  const yanit = page.locator('#kapsam table tbody tr', { hasText: 'Teklif isteğine yanıt (aylık)' });
  await expect(yanit.locator('.chip', { hasText: 'Yeni' })).toHaveCount(2);
});

/**
 * Kullanıcı kararları 13 Kasım 2026: sayfalar istoc.com’daki paket adlarını yazar (5.3). Ücretsiz paketin sınırları
 * kararlaştırıldı (`UCRETSIZ_SINIRLAR`): ürün sınırı aynıdır ve Ücretsiz paket teklif isteğine yanıt vermez.
 * Kararlaştırılan konu “Karar bekleyen sorular” listesinde yer almaz.
 */
test('fiyatlandırma: 13 Kasım 2026 kararlarına uyar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('pricing/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  // Sayfa başı da denetlenir: amaç cümlesi yeni ad önermez.
  const metin = (await page.locator('main').textContent()) ?? '';
  expect(metin).not.toMatch(/[Yy]eni paket adlar|Bugünkü adı/);
  // Başka platformların ürün adları (Maximiser Pro, Advertising Pro, Airtable’ın Pro paketi) bu kuralın dışındadır.
  expect(metin).not.toMatch(/\b(Standart|Kurumsal) paket|(?<!(Maximiser|Advertising|gün) )\bPro paket|Standart ve Pro|Standart, Pro|Ücretsiz, Standart/);
  expect(metin).not.toMatch(/Platinum|Platin\b/);
  const ucretsiz = ONERI_PAKETLERI.find((p) => p.id === 'ucretsiz')!;
  expect(ucretsiz.maddeler.join(' ')).toContain(`${UCRETSIZ_URUN} kayıtlı ürün`);
  expect(ucretsiz.maddeler.join(' ')).not.toMatch(/teklif isteğine yanıt/i);
  const satir = (id: string) => KAPSAM.flatMap((g) => g.satirlar).find((x) => x.id === id)!;
  // Karardaki sınır kayıtlı ürün sayısıdır, aynı anda yayındaki ürün sayısı değildir.
  expect(satir('kayitli').hucre.ucretsiz.deger).toBe(String(UCRETSIZ_URUN));
  expect(satir('urun').hucre.ucretsiz.deger).not.toBe(String(UCRETSIZ_URUN));
  expect(satir('yanit').hucre.ucretsiz.deger).toBe('Yok');
  expect(KARARLAR.map((k) => k.id)).not.toContain('adlar');
  expect(KARARLAR.map((k) => k.id)).not.toContain('ucretsiz');
  expect(DEGISIMLER.map((d) => d.id)).not.toContain('ad');
});

test('fiyatlandırma: ek modüllerin hazırlığı gelir modelleriyle aynı, kaynak bağlantıları dış adrese yeni sekmede', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('pricing/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  for (const m of EK_MODULLER) {
    // Hazırlık gelir modellerindeki kayıttan gelir: sayfanın kendi verisiyle değil, kaynak kayıtla karşılaştırılır.
    const kayit = MODELLER.find((x) => x.id === m.id);
    expect(kayit, m.id).toBeTruthy();
    const kart = page.locator(`#modul-${m.id}`);
    await expect(kart.locator('.pz-modul-ust .chip')).toHaveText(HAZIRLIK_ADI[kayit!.hazirlik]);
    await expect(kart.locator('.pz-modul-bag')).toHaveAttribute('href', `/19ekim/gelir-modelleri/#model-${kayit!.id}`);
  }
  const dis = await page.locator('.pz-sayfa a[href^="http"]').evaluateAll((els) => els.map((a) => ({ hedef: a.getAttribute('target'), rel: a.getAttribute('rel') ?? '' })));
  expect(dis.length).toBeGreaterThan(30);
  for (const b of dis) {
    expect(b.hedef).toBe('_blank');
    expect(b.rel).toContain('noopener');
  }
  // Eleştirinin her “Neden önemli” alanı ya kaynak gösterir ya da sitenin kendi kuralına dayanır.
  const kaynakli = await page.locator('.pz-elestiri').evaluateAll((els) => els.map((e) => e.querySelectorAll('a[href^="http"]').length));
  expect(kaynakli.filter((n) => n > 0).length).toBeGreaterThanOrEqual(ELESTIRILER.length - 1);
});

test('fiyatlandırma: menüde Pazarlama grubunda, hizmetlerden sonra ve yeni işaretli', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('pricing/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Pazarlama', exact: true }).click();
  const menu = page.getByRole('menu', { name: 'Pazarlama' });
  await expect(menu).toBeVisible();
  const ogeler = await menu.getByRole('menuitem').allInnerTexts();
  expect(ogeler.indexOf('Fiyatlandırma')).toBe(ogeler.indexOf('Hizmetler') + 1);
  const oge = menu.getByRole('menuitem', { name: /Fiyatlandırma/ });
  await expect(oge).toHaveAttribute('aria-current', 'page');
  await expect(oge).toHaveAttribute('href', '/19ekim/pricing/');
  await expect(oge.getByRole('img', { name: 'Yeni', exact: true })).toHaveCount(1);
});

test('fiyatlandırma: sayıdan sonraki ek ve açıklama çelişkisi örnek veriyle doğru çalışır', () => {
  // “%79’u”, “%80’i”, “%6’sı”, “%40’ı”, “%2’si”, “%100’ü”
  expect([79, 80, 6, 40, 2, 100, 30, 15].map((n) => `%${n}’${iyelik(n)}`)).toEqual(['%79’u', '%80’i', '%6’sı', '%40’ı', '%2’si', '%100’ü', '%30’u', '%15’i']);
  const girdi = {
    basic: { ad: 'Basic', aciklama: 'Ücretsiz başlangıç planı.', aylikEur: 399, kod: 'free' },
    orta: { ad: 'Platinium', aciklama: 'CRM, API, gelişmiş analitik.' },
    son: { ad: 'Enterprise', aciklama: 'Sınırsız çalışan.' },
    gelismisOrtada: false,
    gelismisYeri: 'yalnız Enterprise paketinde vardır',
    sonKullanici: '10' as const,
  };
  expect(aciklamaCeliskileriBul(girdi)).toHaveLength(3);
  // Açıklama tabloyla uyumlu olunca cümle yazılmaz.
  expect(aciklamaCeliskileriBul({ ...girdi, basic: { ...girdi.basic, aylikEur: 0 }, gelismisOrtada: true, sonKullanici: 'Sınırsız' })).toEqual([]);
  expect(aciklamaCeliskileriBul({ ...girdi, basic: { ...girdi.basic, aciklama: 'Tek kişilik satıcı için.' } })).toHaveLength(2);
});
