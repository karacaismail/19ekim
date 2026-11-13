import { expect, test } from './fixtures/persona';
import {
  BELGE_BAGLANTILARI,
  DUVAR_ILKELERI,
  DUVAR_SEMA_NOTU,
  FAZLAR,
  GELIR_KALIPLARI,
  HARITA_NOTU,
  ISTOC_KUTU_NOTU,
  ISTOC_SONUC,
  KAPILAR,
  KAYNAKSIZ_NOTU,
  NITELIKLI_TALEP_NOTU,
  PLATFORMLAR,
  SIRA_NOTU,
  SITE_NOTU,
  TUTMA_KATMANLARI,
} from '../src/data/kuresel';

/**
 * Küresel B2B pazaryerleri (kullanıcı kararı 2026-11-12): titanlar.com araştırması kesin karar olarak sayfada. Yedi
 * platform iki kümede, istoc.com tanıştıran kümede ve “Bugün burada” işaretli. Altı elde tutma katmanı, sekiz gelir
 * kalıbı, altı ücretsiz başlangıç ilkesi, üç faz ve iki kapı. Belgede olmayan şemalar ve sitenin karşılaştırmaları
 * görünür notla etiketlidir. Belgedeki 33 bağlantının hepsi sayfadadır. Dar ekranda tablolar kayıt listesidir.
 */

const GENISLIKLER: [number, number][] = [
  [320, 900],
  [360, 900],
  [375, 900],
  [390, 900],
  [768, 1024],
  [1024, 900],
  [1280, 900],
  [844, 390],
];

for (const [genislik, yukseklik] of GENISLIKLER) {
  test(`küresel pazaryerleri ${genislik}×${yukseklik}: harita, katmanlar, kalıplar, sıra, taşma yok, metin ≥ 14 px`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: yukseklik });
    await page.goto('kuresel-pazaryerleri/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Küresel B2B pazaryerleri');
    // Ana fikir belgenin üç unsurunu söyler.
    await expect(page.locator('.pz-iddia')).toHaveText('Satıcı bir platformda üç sebeple kalır. Alıcıların ne aradığını görür. Parasını güvenle alır. Parasını hızlı ya da önceden alabilir.');

    // Harita: iki küme, yedi platform ve istoc.com tanıştıran kümede.
    await expect(page.locator('.pz-kume')).toHaveCount(2);
    await expect(page.locator('.pz-kume[data-kume="tanistiran"] .pz-platform')).toHaveCount(4);
    await expect(page.locator('.pz-kume[data-kume="odeme"] .pz-platform')).toHaveCount(4);
    const istoc = page.locator('.pz-platform[data-istoc]');
    await expect(istoc).toHaveCount(1);
    await expect(istoc).toContainText('Bugün burada');
    await expect(istoc).toContainText('iStoc ödemeyi tutmaz');
    await expect(istoc).toContainText(SITE_NOTU);
    await expect(page.locator('.pz-kume[data-kume="tanistiran"] .pz-platform').first()).toHaveAttribute('data-istoc', '');

    await expect(page.locator('.pz-katman')).toHaveCount(TUTMA_KATMANLARI.length);
    await expect(page.locator('.pz-katman .pz-istoc')).toHaveCount(TUTMA_KATMANLARI.length);
    await expect(page.locator('#gelir .pz-kart')).toHaveCount(GELIR_KALIPLARI.length);
    await expect(page.locator('#ucretsiz-baslangic .pz-kart')).toHaveCount(DUVAR_ILKELERI.length);
    await expect(page.locator('.pz-duvar-satir')).toHaveCount(2);
    await expect(page.locator('.pz-faz')).toHaveCount(FAZLAR.length);
    await expect(page.locator('.pz-kapi')).toHaveCount(KAPILAR.length);
    // Sıra: faz, kapı, faz, kapı, faz. Son faz istoc.com’un bugün başladığı fazdır.
    const sira = await page.locator('.pz-sira > li').evaluateAll((els) => els.map((e) => e.className));
    expect(sira).toEqual(['pz-faz', 'pz-kapi', 'pz-faz', 'pz-kapi', 'pz-faz']);
    await expect(page.locator('.pz-faz').last()).toContainText('istoc.com bugün bu fazdan başlıyor');
    await expect(page.locator('.pz-cikarim')).toHaveCount(3);

    // Tablolar: geniş ekranda tablo, dar ekranda kayıt listesi. İkisinde de yedi platform ve istoc.com satırı.
    const kabuk = await page.locator('#gelir .table-block').first().getAttribute('data-kabuk');
    if (genislik < 768) expect(kabuk).toBe('kayit');
    if (genislik >= 1280) expect(kabuk).toBe('tablo');
    await expect(page.locator('#gelir')).toContainText('istoc.com');
    for (const p of PLATFORMLAR) await expect(page.locator('#gelir')).toContainText(p.ad);

    const olcum = await page.evaluate(() => ({
      tasma: document.documentElement.scrollWidth - innerWidth,
      kucuk: [...document.querySelectorAll<HTMLElement>('.pz-sayfa *')]
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
        .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14 || Number(getComputedStyle(e).fontWeight) < 300)
        .map((e) => e.className || e.tagName),
      // Tablo 48em’den geniş kapsayıcıda kendi kutusunda kayar (ui.tsx useKabuk). Kutunun içi sayılmaz, kutunun kendisi sayılır.
      disari: [...document.querySelectorAll<HTMLElement>('.pz-sayfa *')]
        .filter((e) => !e.parentElement?.closest('.table-scroll') && e.getBoundingClientRect().right > innerWidth + 1)
        .map((e) => e.className || e.tagName),
      metin: document.querySelector<HTMLElement>('.pz-sayfa')!.textContent ?? '',
    }));
    expect(olcum.tasma).toBeLessThanOrEqual(0);
    expect(olcum.disari).toEqual([]);
    expect(olcum.kucuk).toEqual([]);
    // Yazım kuralı: noktalı virgül ve uzun çizgi yok. Gizli kabuktaki metin de denetlenir (textContent).
    expect(olcum.metin).not.toMatch(/[;—]/);
  });
}

test('küresel pazaryerleri: belgede olmayan şemalar ve sitenin karşılaştırmaları görünür notla etiketlidir', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('kuresel-pazaryerleri/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  // Harita notu haritadan, sıra notu sıradan önce gelir.
  const sira = await page.evaluate(() => {
    const y = (s: string) => document.querySelector(s)!.getBoundingClientRect().top;
    const not = (metin: string) => [...document.querySelectorAll('.pz-notlar')].find((n) => n.textContent!.includes(metin))!.getBoundingClientRect().top;
    return { harita: [not('3 model, 7 platform'), y('.pz-harita')], sira: [not('3 faz, 2 kapı'), y('.pz-sira')], duvar: [not('Bu şema belgede yok'), y('.pz-duvar')] };
  });
  expect(sira.harita[0]).toBeLessThan(sira.harita[1]);
  expect(sira.sira[0]).toBeLessThan(sira.sira[1]);
  expect(sira.duvar[0]).toBeLessThan(sira.duvar[1]);
  for (const n of [HARITA_NOTU, SIRA_NOTU, DUVAR_SEMA_NOTU, ISTOC_KUTU_NOTU, NITELIKLI_TALEP_NOTU]) await expect(page.locator('.pz-notlar', { hasText: n })).toHaveCount(1);
  await expect(page.locator('.pz-sonuc')).toContainText(ISTOC_SONUC.etiket);
  // Belgede kaynağı olmayan cümle ayrı bir notla görünür.
  await expect(page.locator('.pz-ornek-kaynaksiz', { hasText: KAYNAKSIZ_NOTU })).toHaveCount(1);
  // Ödeme duvarı şeması bugünkü anı ve belgenin önerisini ayrı yazar.
  await expect(page.locator('.pz-duvar-satir').nth(1)).toContainText('daha çok alıcıya ulaşmak isteyince');
  await expect(page.locator('.pz-duvar-satir').nth(1)).toContainText('ilk nitelikli talebe');
});

test('küresel pazaryerleri: belgedeki bütün bağlantılar sayfada, dış bağlantılar yeni sekmede, ikincil kaynak etiketli', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('kuresel-pazaryerleri/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const baglantilar = await page.locator('.pz-sayfa a[href^="http"]').evaluateAll((els) => els.map((a) => ({ href: a.getAttribute('href') ?? '', hedef: a.getAttribute('target'), rel: a.getAttribute('rel') ?? '' })));
  expect(BELGE_BAGLANTILARI).toHaveLength(33);
  const adresler = new Set(baglantilar.map((b) => b.href));
  for (const url of BELGE_BAGLANTILARI) expect(adresler.has(url), url).toBe(true);
  for (const b of baglantilar) {
    expect(b.href).toMatch(/^https:\/\//);
    expect(b.hedef).toBe('_blank');
    expect(b.rel).toContain('noopener');
  }
  await expect(page.locator('.pz-kaynak .chip', { hasText: 'İkincil kaynak' }).first()).toBeVisible();
  await expect(page.locator('.pz-ornek-metin', { hasText: '(ikincil kaynak)' }).first()).toBeVisible();
  // İlgili sayfalar sayfanın sonundadır (ortak sayfa sonu gezinmesi): hizmetler, gelir modelleri ve değer önerisi.
  const ilgili = await page.getByRole('navigation', { name: 'İlgili sayfalar' }).locator('a').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
  expect(ilgili).toEqual(['/19ekim/services/', '/19ekim/gelir-modelleri/', '/19ekim/deger-onerisi/']);
});

test('küresel pazaryerleri: menüde Pazarlama grubunda, gelir modellerinden sonra ve yeni işaretli', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('kuresel-pazaryerleri/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await page.getByRole('button', { name: 'Pazarlama', exact: true }).click();
  const menu = page.getByRole('menu', { name: 'Pazarlama' });
  await expect(menu).toBeVisible();
  const ogeler = await menu.getByRole('menuitem').allInnerTexts();
  expect(ogeler.indexOf('Küresel pazaryerleri')).toBe(ogeler.indexOf('Gelir modelleri') + 1);
  const oge = menu.getByRole('menuitem', { name: /Küresel pazaryerleri/ });
  await expect(oge).toHaveAttribute('aria-current', 'page');
  await expect(oge.getByRole('img', { name: 'Yeni', exact: true })).toHaveCount(1);
});
