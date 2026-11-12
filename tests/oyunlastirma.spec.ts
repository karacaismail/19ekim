import { expect, test, type Page } from './fixtures/persona';

/**
 * Oyunlaştırma (kullanıcı kararı 2026-11-04): istoc.com'un tavuk yumurta sorununu çözen ve platformu sürdürülebilir
 * kılan 8 strateji Pazarlama menüsünde. Her strateji kartta başlık ve özetle görünür. Karta basınca açılan pencere
 * stratejinin adım adım uygulama yol haritasını verir. Kaynak metin docs/oyunlastirma-yalin/ içindedir.
 * Aynı gün ikinci karar: ChatGPT'nin 8 stratejisi (docs/oyunlastirma/) da aynı biçimde eklenir. Kartlar öneri sahibini
 * “Claude” ya da “ChatGPT” etiketiyle gösterir ve sayfa bu etikete göre süzülebilir. Üçüncü karar: Gemini'nin 5 stratejisi
 * “Gemini” etiketiyle aynı biçimde eklenir.
 */
const STRATEJI_SAYISI = 21;

async function ac(page: Page, genislik: number, yukseklik = 900) {
  await page.setViewportSize({ width: genislik, height: yukseklik });
  await page.goto('oyunlastirma/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}
const kart = (page: Page, ad: string) => page.getByRole('button', { name: new RegExp(ad) });

test('oyunlaştırma Pazarlama menüsünde, Gelir modellerinden sonra', async ({ page }) => {
  await ac(page, 1280);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Oyunlaştırma');
  const tetik = page.getByRole('button', { name: 'Pazarlama' });
  await expect(tetik).toHaveAttribute('data-section', 'true');
  await tetik.click();
  const menu = page.getByRole('menu', { name: 'Pazarlama' });
  await expect(menu.getByRole('menuitem')).toHaveText(['Temsilci ağı', 'Satış ortaklığı', 'Değer önerisi', 'Gelir modelleri', 'Oyunlaştırma', 'Yeni kayıtlar', 'Çalışma rehberleri']);
  await expect(menu.getByRole('menuitem', { name: 'Oyunlaştırma' })).toHaveAttribute('aria-current', 'page');
});

for (const genislik of [320, 390, 1280]) {
  test(`oyunlaştırma ${genislik} px: Claude ve ChatGPT'nin 8'er kartı etiketli, taşma yok, metin ≥ 14 px`, async ({ page }) => {
    await ac(page, genislik);
    const kartlar = page.locator('.oy-kart');
    await expect(kartlar).toHaveCount(STRATEJI_SAYISI);
    await expect(page.locator('#tavuk-yumurta .oy-kart')).toHaveCount(4);
    await expect(page.locator('#surdurulebilirlik .oy-kart')).toHaveCount(4);
    await expect(page.locator('#chatgpt .oy-kart')).toHaveCount(8);
    // Öneri sahibinin etiketi kartın üzerinde yazıyla okunur.
    await expect(page.locator('#tavuk-yumurta .oy-kart-kaynak, #surdurulebilirlik .oy-kart-kaynak')).toHaveText(Array(8).fill('Claude'));
    await expect(page.locator('#chatgpt .oy-kart-kaynak')).toHaveText(Array(8).fill('ChatGPT'));
    await expect(page.locator('#gemini .oy-kart-kaynak')).toHaveText(Array(5).fill('Gemini'));
    for (const k of await kartlar.all()) {
      await expect(k.locator('.oy-kart-ad')).not.toBeEmpty();
      await expect(k.locator('.oy-kart-ozet')).not.toBeEmpty();
      await expect(k).toHaveAttribute('aria-haspopup', 'dialog');
    }
    const olcum = await page.evaluate(() => ({
      tasma: document.documentElement.scrollWidth - innerWidth,
      kucuk: [...document.querySelectorAll<HTMLElement>('.oy *')]
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
        .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14 || Number(getComputedStyle(e).fontWeight) < 300)
        .map((e) => e.className || e.tagName),
      metin: document.querySelector<HTMLElement>('.oy')!.innerText,
    }));
    expect(olcum.tasma).toBeLessThanOrEqual(0);
    expect(olcum.kucuk).toEqual([]);
    expect(olcum.metin).not.toMatch(/[;—·→]/);
  });
}

test('karta basınca adım adım yol haritası pencerede açılır, Escape kapatır, odak karta döner', async ({ page }) => {
  await ac(page, 1280);
  const k = kart(page, 'Kendi müşterini getir');
  await k.click();
  const pencere = page.getByRole('dialog', { name: /Kendi müşterini getir/ });
  await expect(pencere).toBeVisible();
  await expect(pencere.locator('.oy-amac')).not.toBeEmpty();
  await expect(pencere.locator('.oy-odul')).not.toBeEmpty();
  const adimlar = pencere.locator('.oy-adim');
  expect(await adimlar.count()).toBeGreaterThanOrEqual(5);
  // Her adımda sıra, ne zaman, kim, ne yapılır ve ne zaman bitmiş sayılır yazılı.
  for (const a of await adimlar.all()) {
    await expect(a.locator('.oy-adim-no')).not.toBeEmpty();
    await expect(a.locator('.oy-adim-ad')).not.toBeEmpty();
    await expect(a.locator('.oy-adim-zaman')).not.toBeEmpty();
    await expect(a.locator('.oy-adim-kim')).not.toBeEmpty();
    await expect(a.locator('.oy-adim-bitti')).toContainText('Bitti sayılır');
  }
  const n = await adimlar.count();
  await expect(adimlar.locator('.oy-adim-no')).toHaveText(Array.from({ length: n }, (_, i) => String(i + 1)));
  await expect(pencere.locator('.oy-olcut')).not.toBeEmpty();
  await expect(pencere).not.toContainText(/[;—]/);
  await page.keyboard.press('Escape');
  await expect(pencere).toBeHidden();
  await expect(k).toBeFocused();
});

test('klavyeyle: kart Enter ile açılır, pencere kapanınca odak aynı karta döner', async ({ page }) => {
  await ac(page, 1280);
  const k = kart(page, 'Geri gelen müşteri');
  await k.focus();
  await page.keyboard.press('Enter');
  const pencere = page.getByRole('dialog', { name: /Geri gelen müşteri/ });
  await expect(pencere).toBeVisible();
  await pencere.getByRole('button', { name: 'Pencereyi kapat' }).click();
  await expect(pencere).toBeHidden();
  await expect(k).toBeFocused();
});

test('320 px: pencere tam ekran, yatay taşma yok, metin ≥ 14 px', async ({ page }) => {
  await ac(page, 320, 700);
  await kart(page, 'Teklif talebi').click();
  const pencere = page.getByRole('dialog', { name: /Teklif talebi/ });
  await expect(pencere).toBeVisible();
  // Açılış hareketi ölçeklendirerek başlar; ölçüm hareket bitince yapılır.
  await expect.poll(async () => (await pencere.boundingBox())!.width).toBeGreaterThanOrEqual(319);
  const olcum = await pencere.evaluate((el) => ({
    tasma: el.scrollWidth - el.clientWidth,
    kucuk: [...el.querySelectorAll<HTMLElement>('*')]
      .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
      .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14)
      .map((e) => e.className || e.tagName),
  }));
  expect(olcum.tasma).toBeLessThanOrEqual(0);
  expect(olcum.kucuk).toEqual([]);
});

test('öneri sahibi süzgeci: ChatGPT seçilince yalnız ChatGPT kartları kalır, Hepsi geri getirir', async ({ page }) => {
  await ac(page, 1280);
  const suzgec = page.getByRole('group', { name: 'Öneri sahibi' });
  await suzgec.getByRole('button', { name: /^ChatGPT/ }).click();
  await expect(page.locator('.oy-kart')).toHaveCount(8);
  await expect(page.locator('.oy-kart-kaynak')).toHaveText(Array(8).fill('ChatGPT'));
  await suzgec.getByRole('button', { name: /^Claude/ }).click();
  await expect(page.locator('.oy-kart-kaynak')).toHaveText(Array(8).fill('Claude'));
  await suzgec.getByRole('button', { name: /^Gemini/ }).click();
  await expect(page.locator('.oy-kart-kaynak')).toHaveText(Array(5).fill('Gemini'));
  await expect(page.locator('#ilkeler')).toHaveCount(0);
  await suzgec.getByRole('button', { name: /^Hepsi/ }).click();
  await expect(page.locator('.oy-kart')).toHaveCount(STRATEJI_SAYISI);
});

test('ChatGPT kartı da adım adım yol haritasını açar, kaynağı pencerede yazar', async ({ page }) => {
  await ac(page, 1280);
  await kart(page, 'Gerçek talebi birlikte sonuçlandır').click();
  const pencere = page.getByRole('dialog', { name: /Gerçek talebi birlikte sonuçlandır/ });
  await expect(pencere).toBeVisible();
  await expect(pencere.locator('.oy-pencere-kaynak')).toContainText('ChatGPT');
  expect(await pencere.locator('.oy-adim').count()).toBeGreaterThanOrEqual(4);
  for (const a of await pencere.locator('.oy-adim').all()) await expect(a.locator('.oy-adim-bitti')).toContainText('Bitti sayılır');
  await expect(pencere).not.toContainText(/[;—]/);
});

/** Odak göstergesi tek kenardadır: sol iç çubuk. Çevreleyen halka ya da ikinci gösterge yoktur (AGENT.md odak kuralı). */
async function gosterge(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const c = getComputedStyle(el);
    const ac = el.querySelector<HTMLElement>('.oy-kart-ac');
    return {
      sinif: el.className,
      mod: document.documentElement.dataset.focusMode,
      halka: c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0,
      golge: c.boxShadow,
      acAltCizgi: ac ? getComputedStyle(ac).textDecorationLine.includes('underline') : false,
    };
  });
}
const tekKenar = (golge: string) => golge !== 'none' && golge.split(/,(?![^(]*\))/).every((p) => {
  const [x = 0, y = 0, blur = 0, yay = 0] = (p.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g) ?? []).map(parseFloat);
  return x !== 0 && y === 0 && blur === 0 && yay === 0;
});

test('klavye: Tab ile karta gelinir, tek kenar gösterge görünür, Enter açar, Escape sonrası gösterge karta döner', async ({ page, browserName }) => {
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await ac(page, 1280);
  let durum = await gosterge(page);
  for (let i = 0; i < 80 && !String(durum.sinif).includes('oy-kart'); i++) {
    await page.keyboard.press(tab);
    durum = await gosterge(page);
  }
  expect(durum.sinif).toContain('oy-kart');
  expect(durum.mod).toBe('keyboard');
  expect(durum.halka, 'çevreleyen halka').toBe(false);
  expect(tekKenar(durum.golge), `tek kenar gösterge yok: ${durum.golge}`).toBe(true);
  expect(durum.acAltCizgi, 'ikinci gösterge').toBe(false);
  const ad = await page.evaluate(() => (document.activeElement as HTMLElement).querySelector('.oy-kart-ad')!.textContent);

  await page.keyboard.press('Enter');
  const pencere = page.getByRole('dialog');
  await expect(pencere).toBeVisible();
  const kapat = pencere.getByRole('button', { name: 'Pencereyi kapat' });
  for (let i = 0; i < 10 && !(await kapat.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press(tab);
  await expect(kapat).toBeFocused();
  const k = await gosterge(page);
  expect(k.halka, 'kapat düğmesinde halka').toBe(false);
  expect(tekKenar(k.golge), `kapat düğmesinde tek kenar gösterge yok: ${k.golge}`).toBe(true);

  await page.keyboard.press('Escape');
  await expect(pencere).toBeHidden();
  await expect(page.getByRole('button', { name: ad! })).toBeFocused();
  const son = await gosterge(page);
  expect(son.mod).toBe('keyboard');
  expect(tekKenar(son.golge), 'pencere kapanınca gösterge kayboldu').toBe(true);
});

test('ChatGPT süzgecinde yalnız Claude’a ait ilkeler bölümü görünmez', async ({ page }) => {
  await ac(page, 1280);
  await expect(page.locator('#ilkeler')).toBeVisible();
  await page.getByRole('group', { name: 'Öneri sahibi' }).getByRole('button', { name: /^ChatGPT/ }).click();
  await expect(page.locator('#ilkeler')).toHaveCount(0);
});

test('yatay telefon (844 × 390): pencere tam ekran, taşma yok', async ({ page }) => {
  await ac(page, 844, 390);
  await kart(page, 'Randevulu tedarik rotası').click();
  const pencere = page.getByRole('dialog', { name: /Randevulu tedarik rotası/ });
  await expect(pencere).toBeVisible();
  await expect.poll(async () => (await pencere.boundingBox())!.width).toBeGreaterThanOrEqual(843);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('Gemini kartı yol haritasını açar, kaynağı ve projeyle çelişen noktaları pencerede yazar', async ({ page }) => {
  await ac(page, 1280);
  await kart(page, 'Kendi bayini getir').click();
  const pencere = page.getByRole('dialog', { name: /Kendi bayini getir/ });
  await expect(pencere).toBeVisible();
  await expect(pencere.locator('.oy-pencere-kaynak')).toContainText('Gemini');
  expect(await pencere.locator('.oy-adim').count()).toBeGreaterThanOrEqual(4);
  // Gemini'nin işlem payı, vade ve ihracat varsayımları projenin bugünkü kararlarıyla karşılaştırılır.
  await expect(pencere.locator('.oy-dikkat')).toContainText('abonelik');
  await expect(pencere).not.toContainText(/[;—]/);
});

test('uyarı metni üç kaynağı ve “üç ayrı analiz” ifadesini doğru sayar', async ({ page }) => {
  await ac(page, 1280);
  const uyari = page.locator('.oy-uyari');
  await expect(uyari).toContainText('üç ayrı analizin');
  for (const ad of ['Claude', 'ChatGPT', 'Gemini']) await expect(uyari).toContainText(ad);
});

for (const genislik of [320, 390]) {
  test(`${genislik} px: “Öneri sahibi” etiketi seçeneklerin üstünde, seçenekler tam genişlikte alt alta`, async ({ page }) => {
    await ac(page, genislik);
    const grup = page.getByRole('group', { name: 'Öneri sahibi' });
    await expect(grup.locator('.secim-iz')).toHaveAttribute('data-sunum', 'liste');
    const etiket = (await grup.locator('.secim-etiket').boundingBox())!;
    const iz = (await grup.locator('.secim-iz').boundingBox())!;
    const kutu = (await grup.boundingBox())!;
    // Etiket kendi satırında, listenin üstünde durur. Liste grubun tüm genişliğini kullanır.
    expect(etiket.y + etiket.height).toBeLessThanOrEqual(iz.y + 0.5);
    expect(Math.abs(iz.width - kutu.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(etiket.x - iz.x)).toBeLessThanOrEqual(1);
  });
}
