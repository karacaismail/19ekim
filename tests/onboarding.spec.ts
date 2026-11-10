import { expect, test, type Page } from '@playwright/test';
import { eur, paketler } from '../src/data/gelirModelleri';
import { ASAMALAR, HER_DURUMDA, KAPANIS_DURUMLARI, durumlar, sablonlar } from '../src/data/onboarding';
import { DEFAULT_PARAMS } from '../src/data/params';

/**
 * Yeni kayıt iş akışları (kullanıcı kararları 2026-11-10): sayfa CRM masası sorumlusu içindir. Ana akış dört aşamadır.
 * Her aşama “Başlar” başlığıyla açılır, numaralı durumları listeler, solda aşamanın sonuna inen çizgiyle sınırlanır ve
 * “Biter” başlığıyla kapanır. Biter bölümü sonraki aşamaya bağlanır. Aşamaya bağlı olmayan durumlar sonda numarasızdır.
 * Bir aşamanın ileri çıkışı, sonraki aşamanın başlama koşulu ve kayıt kartı durumuyla aynıdır (bağımsız inceleme, aynı gün).
 */
const TUM = durumlar(DEFAULT_PARAMS);
const HER_AN = TUM.filter((d) => d.yer === 'her-an');
const METINLER = sablonlar(DEFAULT_PARAMS);
const YASAK = /[;—·→]/;

async function ac(page: Page, genislik: number, yukseklik = 900, yol = 'onboarding/') {
  await page.setViewportSize({ width: genislik, height: yukseklik });
  await page.goto(yol);
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}

test('veri: geçişler, hazır metinler, aşama sınırları ve kapanış durumları tutarlı, metinde yasak işaret yok', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'veri testi tarayıcıdan bağımsızdır, yalnız Chromium’da çalışır');
  const idler = new Set(TUM.map((d) => d.id));
  expect(idler.size, 'durum kimlikleri tekil').toBe(TUM.length);
  for (const d of TUM) {
    for (const a of d.adimlar) if (typeof a !== 'string') expect(idler.has(a.git), `${d.id} → ${a.git}`).toBe(true);
    if (d.sablon) expect(METINLER[d.sablon], `${d.id} hazır metni`).toBeTruthy();
    const metin = [d.ad, d.kart, ...d.adimlar.map((a) => (typeof a === 'string' ? a : a.metin))].join(' ');
    expect(metin, d.id).not.toMatch(YASAK);
  }
  for (const a of ASAMALAR) {
    expect(TUM.filter((d) => d.yer === a.no).length, `Aşama ${a.no} durumları`).toBeGreaterThan(0);
    for (const c of a.cikislar) {
      if (c.durum) expect(idler.has(c.durum), `Aşama ${a.no} çıkışı → ${c.durum}`).toBe(true);
      expect([c.kosul, c.kart, c.sonra].join(' ')).not.toMatch(YASAK);
      if (!c.git) continue;
      // Aşama sınırı tek anlamlıdır: ileri çıkışın koşulu sonraki aşamanın başlama koşulu, kartı sonraki aşamanın kartıdır.
      expect(c.git, `Aşama ${a.no} çıkışı bir sonraki aşamaya gider`).toBe(a.no + 1);
      const sonraki = ASAMALAR.find((x) => x.no === c.git)!;
      expect(sonraki.baslar.startsWith(c.kosul.replace(/\.$/, '')), `Aşama ${c.git} başlangıcı “${sonraki.baslar}” ≠ çıkış “${c.kosul}”`).toBe(true);
      expect(sonraki.kartDurumu.startsWith(c.kart), `Aşama ${c.git} kartı “${sonraki.kartDurumu}” ≠ çıkış kartı “${c.kart}”`).toBe(true);
    }
    expect([a.ad, a.gun, a.baslar, a.kartDurumu].join(' ')).not.toMatch(YASAK);
  }
  // “Süreç biter” yalnız kaydı kapatan çıkışların kartlarını sayar. Bekleyen (Şimdi değil) kapanış değildir.
  const kapanan = new Set(ASAMALAR.flatMap((a) => a.cikislar.filter((c) => !c.git && !c.bekler).map((c) => c.kart)));
  expect([...kapanan].sort()).toEqual([...KAPANIS_DURUMLARI].sort());
  expect(HER_DURUMDA.join(' ')).not.toMatch(YASAK);
});

test('Pazarlama menüsünde Oyunlaştırma’dan sonra “Onboarding” var ve etkin', async ({ page }) => {
  await ac(page, 1280);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Yeni kayıt iş akışları');
  await expect(page).toHaveTitle(/^Yeni kayıt iş akışları/);
  await page.getByRole('button', { name: 'Pazarlama' }).click();
  const menu = page.getByRole('menu', { name: 'Pazarlama' });
  await expect(menu.getByRole('menuitem')).toHaveText(['Temsilci ağı', 'Satış ortaklığı', 'Değer önerisi', 'Gelir modelleri', 'Oyunlaştırma', 'Onboarding']);
  await expect(menu.getByRole('menuitem', { name: 'Onboarding' })).toHaveAttribute('aria-current', 'page');
});

for (const [genislik, yukseklik] of [
  [320, 900],
  [360, 900],
  [375, 900],
  [390, 900],
  [844, 390],
  [768, 900],
  [1280, 900],
]) {
  test(`${genislik} × ${yukseklik}: aşamalar Başlar ile açılıp Biter ile kapanır, çizgi aşamanın sonuna iner, taşma yok, metin ≥ 14 px`, async ({ page }) => {
    await ac(page, genislik, yukseklik);

    // Harita: dört aşama ve sürecin sonu, sırayla.
    const harita = page.locator('.ob-harita-oge');
    await expect(harita).toHaveCount(ASAMALAR.length + 1);
    for (const [i, a] of ASAMALAR.entries()) await expect(harita.nth(i).locator('.ob-harita-ad')).toHaveText(`Aşama ${a.no}: ${a.ad}`);
    await expect(harita.last().locator('.ob-harita-ad')).toHaveText('Süreç biter');

    // Her aşama: başlık “Aşama n: ad”, gövdenin ilk çocuğu Başlar, son çocuğu Biter, durum numaraları aşama numarasıyla başlar.
    await expect(page.locator('.ob-asama')).toHaveCount(ASAMALAR.length);
    for (const a of ASAMALAR) {
      const bolum = page.locator(`#asama-${a.no}`);
      await expect(bolum.getByRole('heading', { level: 2 })).toHaveText(`Aşama ${a.no}: ${a.ad}`);
      const sira = await bolum.locator('.ob-asama-govde').evaluate((g) => [...g.children].map((c) => (c as HTMLElement).dataset.tur ?? c.className));
      expect(sira[0], `Aşama ${a.no} Başlar ile açılır`).toBe('baslar');
      expect(sira.at(-1), `Aşama ${a.no} Biter ile kapanır`).toBe('biter');
      const say = TUM.filter((d) => d.yer === a.no).length;
      await expect(bolum.locator('.ob-durum-no')).toHaveText(Array.from({ length: say }, (_, i) => `${a.no}.${i + 1}`));
      await expect(bolum.locator('.ob-cikis')).toHaveCount(a.cikislar.length);
    }

    // Her an olabilecek durumlar numarasız ve aşamaların dışında. Numarasız başlık sola boşluk bırakmaz.
    await expect(page.locator('#her-an .ob-durum')).toHaveCount(HER_AN.length);
    await expect(page.locator('#her-an .ob-durum-no')).toHaveCount(0);
    const kayma = await page.locator('#her-an .ob-durum-ozet').first().evaluate((s) => {
      const ad = s.querySelector('.ob-durum-ad')!.getBoundingClientRect().left;
      return ad - s.getBoundingClientRect().left - parseFloat(getComputedStyle(s).paddingLeft);
    });
    expect(Math.abs(kayma), 'numarasız başlıkta ad sola yaslı').toBeLessThanOrEqual(1);

    // Bütün durumlar açıkken ölç: çizgi gövde boyunca iner ve numaranın ortasına hizalıdır.
    await page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>('.ob-durum').forEach((d) => (d.open = true)));
    const olcum = await page.evaluate(() => ({
      tasma: document.documentElement.scrollWidth - innerWidth,
      cizgi: [...document.querySelectorAll<HTMLElement>('.ob-asama')].map((b) => {
        const govde = b.querySelector<HTMLElement>('.ob-asama-govde')!;
        const no = b.querySelector<HTMLElement>('.ob-asama-no')!.getBoundingClientRect();
        const once = getComputedStyle(govde, '::before');
        const g = govde.getBoundingClientRect();
        const x = g.left + parseFloat(once.left) + parseFloat(once.width) / 2;
        return { yukseklikFarki: Math.abs(parseFloat(once.height) - g.height), hiza: Math.abs(x - (no.left + no.width / 2)) };
      }),
      kucuk: [...document.querySelectorAll<HTMLElement>('.ob-sayfa *')]
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
        .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14 || Number(getComputedStyle(e).fontWeight) < 300)
        .map((e) => e.className || e.tagName),
      metin: document.querySelector<HTMLElement>('.ob-sayfa')!.innerText,
    }));
    expect(olcum.tasma).toBeLessThanOrEqual(0);
    for (const c of olcum.cizgi) {
      expect(c.yukseklikFarki, 'çizgi aşamanın sonuna kadar iner').toBeLessThanOrEqual(1);
      expect(c.hiza, 'çizgi numaranın ortasına hizalı').toBeLessThanOrEqual(2);
    }
    expect(olcum.kucuk).toEqual([]);
    expect(olcum.metin).not.toMatch(YASAK);
  });
}

test('başlık sırası: her aşamada h2 aşama adı, ardından Başlar, durumlar ve Biter h3', async ({ page }) => {
  await ac(page, 390);
  for (const a of ASAMALAR) {
    const basliklar = await page.locator(`#asama-${a.no}`).locator('h2, h3').allInnerTexts();
    expect(basliklar).toEqual([`Aşama ${a.no}: ${a.ad}`, 'Başlar', 'Bu aşamadaki durumlar', 'Biter']);
  }
  // Açıp kapama işareti erişilebilir ada girmez.
  await expect(page.locator('#durum-yeni-kayit summary')).toHaveAccessibleName('1.1 Yeni kayıt geldi');
});

test('Biter bölümü sonraki aşamaya ve gereken akışa bağlanır, bağlantı o aşamaya götürür', async ({ page }) => {
  await ac(page, 390);
  for (const a of ASAMALAR) {
    for (const c of a.cikislar.filter((x) => x.git)) {
      const ad = ASAMALAR.find((x) => x.no === c.git)!.ad;
      const bag = page.locator(`#asama-${a.no} .ob-cikis`).getByRole('link', { name: `Sonra: Aşama ${c.git}, ${ad}` });
      await expect(bag).toHaveAttribute('href', `#asama-${c.git}`);
    }
    for (const c of a.cikislar.filter((x) => x.durum)) {
      await expect(page.locator(`#asama-${a.no} .ob-cikis`).locator(`a[href="#durum-${c.durum}"]`)).toHaveCount(1);
    }
  }
  await page.locator('#asama-1 .ob-cikis').getByRole('link', { name: 'Sonra: Aşama 2, Kurulum' }).click();
  await expect(page).toHaveURL(/#asama-2$/);
  await expect(page.locator('#asama-2-baslik')).toBeInViewport();
});

test('1280 px: sonraki aşamaya gidince başlık yapışık kırıntı satırının altında kalmaz', async ({ page }) => {
  await ac(page, 1280, 900);
  await page.locator('#asama-1 .ob-cikis').getByRole('link', { name: 'Sonra: Aşama 2, Kurulum' }).click();
  await expect(page).toHaveURL(/#asama-2$/);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const serit = document.querySelector('.crumbs-row')!.getBoundingClientRect().bottom;
        return document.querySelector('#asama-2-baslik')!.getBoundingClientRect().top - serit;
      }),
    )
    .toBeGreaterThanOrEqual(0);
});

test('durum açılınca adımlar ve kayıt kartı satırı görünür, geçiş bağlantısı hedef durumu açar ve odaklar', async ({ page }) => {
  await ac(page, 390);
  const ilkArama = page.locator('#durum-acti');
  await expect(ilkArama.locator('.ob-adimlar')).toBeHidden();
  await ilkArama.locator('summary').click();
  await expect(ilkArama.locator('.ob-adim').first()).toBeVisible();
  await expect(ilkArama.locator('.ob-kart')).toContainText('Kayıt kartına yazın');
  await expect(ilkArama.locator('.ob-sablon')).toContainText('Hazır metin: Görüşme özeti');

  const hedef = page.locator('#durum-musait-degil');
  await expect(hedef).not.toHaveAttribute('open', '');
  await ilkArama.getByRole('link', { name: '“Şimdi müsait değilim” dedi' }).click();
  await expect(hedef).toHaveAttribute('open', '');
  await expect(hedef.locator('summary')).toBeFocused();
  await expect(hedef.locator('.ob-adim').first()).toBeInViewport();
});

test('klavye: geçiş bağlantısı Enter ile hedef durumu açar ve odağı başlığına taşır', async ({ page }) => {
  await ac(page, 390);
  const kaynak = page.locator('#durum-pahali');
  await kaynak.locator('summary').click();
  const bag = kaynak.getByRole('link', { name: 'İndirim istedi' });
  await bag.focus();
  await page.keyboard.press('Enter');
  const hedef = page.locator('#durum-indirim');
  await expect(hedef).toHaveAttribute('open', '');
  await expect(hedef.locator('summary')).toBeFocused();
});

test('doğrudan bağlantı ve adres değişimi durumu açar', async ({ page }) => {
  await ac(page, 390, 900, 'onboarding/#durum-pahali');
  await expect(page.locator('#durum-pahali')).toHaveAttribute('open', '');
  await expect(page.locator('#durum-pahali .ob-adim').first()).toBeInViewport();
  await page.evaluate(() => (location.hash = '#durum-siparis'));
  await expect(page.locator('#durum-siparis')).toHaveAttribute('open', '');
});

test('karar görüşmesi paket ücretini Parametreler’den yazar', async ({ page }) => {
  await ac(page, 1280);
  const std = paketler(DEFAULT_PARAMS).find((p) => p.id === 'standart')!;
  const karar = page.locator('#durum-karar');
  await karar.locator('summary').click();
  await expect(karar).toContainText(`aylık ${eur(std.aylikEur!)}`);
  await expect(karar).toContainText(`Yıllık peşin seçeneğini söyleyin: ${eur(std.yillikEur!)}`);
});

test('klavye: Enter durumu açar, odakta çevre halkası yok, alt çizgi var', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not_run: Playwright WebKit Tab ile <summary> öğesine odaklanmıyor (Safari varsayılanı); gerçek Safari’de elle doğrulanmalı');
  await ac(page, 1280);
  const ozet = page.locator('#durum-yeni-kayit summary');
  await ozet.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(ozet).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#durum-yeni-kayit')).toHaveAttribute('open', '');
  const durum = await ozet.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { mod: document.documentElement.dataset.focusMode, halka: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, cizgi: cs.textDecorationLine };
  });
  expect(durum.mod).toBe('keyboard');
  expect(durum.halka).toBe(false);
  expect(durum.cizgi).toContain('underline');
});

test('hazır metin “Metni kopyala” ile konu satırıyla birlikte panoya yazılır', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'not_run: pano okuma izni yalnız Chromium’da verilebiliyor');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await ac(page, 1280);
  const yeni = page.locator('#durum-yeni-kayit');
  await yeni.locator('summary').click();
  await yeni.getByRole('button', { name: 'Metni kopyala' }).click();
  await expect(yeni.locator('.ob-kopya-durum')).toHaveText('Metin panoya kopyalandı.');
  const pano = await page.evaluate(() => navigator.clipboard.readText());
  expect(pano.startsWith(`Konu: ${METINLER.hosgeldin.konu}`)).toBe(true);
  expect(pano).toContain('[Ad Soyad]');
});

test('pano yazılamazsa elle kopyalama yolu söylenir', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('izin yok')) } });
  });
  await ac(page, 390);
  const yeni = page.locator('#durum-yeni-kayit');
  await yeni.locator('summary').click();
  await yeni.getByRole('button', { name: 'Metni kopyala' }).click();
  await expect(yeni.locator('.ob-kopya-durum')).toHaveText('Kopyalanamadı. Metni seçip elle kopyalayın.');
});
