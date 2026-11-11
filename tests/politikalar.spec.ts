import { expect, test } from '@playwright/test';
import { ICERIK } from '../src/data/icerik';

const roller = ['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci'];

test('beş ayrı çalışma rehberi içerik kaydında bulunur', () => {
  expect(ICERIK.filter((k) => k.path.startsWith('/politikalar/')).map((k) => k.path).sort())
    .toEqual(roller.map((id) => `/politikalar/${id}/`).sort());
});

for (const rol of roller) {
  test(`${rol}: görev, koşul, kazanç ve anlaşma okunabilir`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`politikalar/${rol}/`);
    const belge = page.locator('.pol-belge');
    await expect(belge).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(belge).not.toContainText(/Ayşe|GAP|unknown/i);
    for (const id of ['gorev', 'is-akisi', 'hedef-kitle', 'kazanc', 'sorunlar', 'anlasma']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    await expect(page.getByRole('navigation', { name: 'Çalışma rehberleri' }).getByRole('link')).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

// Son kullanıcı kararı: v2 hakediş koşulu tahsilat süresidir.
test('ikinci sürümün tavsiye açıklaması tahsilat koşuluyla tutarlı', async () => {
  const { rolMetinleri, musteriKazanc, VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligiV2');
  for (const marka of ['istoc', 'segika'] as const) {
    const metin = rolMetinleri(marka).find((r) => r.id === 'tavsiye')!.kurallar.join(' ');
    expect(metin).toContain('belirlenen tahsilat süresi');
    expect(metin).not.toMatch(/3 ay|90 gün/);
    expect(musteriKazanc({ ...VARSAYILAN_AYAR, marka, tavsiyeSure: 6 }).sureGun).toBe(180);
    expect(metin).toContain('tahsil');
    expect(metin).not.toContain('60 gün');
  }
});

test('rehber hesapları kaynağın varsayılanını kullanır ve bütün özel programları kapsar', async () => {
  const { rehberHesabi, tl } = await import('../src/data/politikalar/hesap');
  const v1 = await import('../src/data/satisOrtakligi');
  const { KOSULLAR } = await import('../src/data/kosullar');
  const belgeler = await Promise.all([
    import('../src/data/politikalar/oncu'), import('../src/data/politikalar/kadrolu'),
    import('../src/data/politikalar/cozum'), import('../src/data/politikalar/tavsiye'), import('../src/data/politikalar/elci'),
  ]);
  for (const { politika } of belgeler) {
    const h = rehberHesabi(politika.id);
    expect(h.ornekler).toHaveLength(2);
    expect(Object.keys(politika.programlar).sort()).toEqual(KOSULLAR[politika.id].map((k) => k.id).sort());
    expect(h.programlar.map((k) => k.id).sort()).toEqual(KOSULLAR[politika.id].filter((k) => k.id !== 'ana').map((k) => k.id).sort());
    for (const marka of ['istoc', 'segika'] as const) {
      const a = { ...v1.VARSAYILAN_AYAR, marka };
      const h = rehberHesabi('kadrolu').ornekler.find((k) => k.urun === (marka === 'istoc' ? 'iStoc' : 'Segika'))!;
      expect(h.satirlar.find((k) => k.ad === 'Maaş ve prim toplamı')?.deger).toBe(tl(v1.kadrolu(a).toplam));
    }
  }
});

test('kişisel hesap ayarı rehberi veya anlaşmayı değiştirmez', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('turksab-satis-ortakligi-v1', '{bozuk');
    localStorage.setItem('turksab-satis-ortakligi-v2-segment', JSON.stringify({ maas: 999999 }));
  });
  await page.goto('politikalar/kadrolu/');
  await expect(page.locator('.pol-belge')).toBeVisible();
  await expect(page.locator('#kazanc')).toContainText('50.000 TL');
  await expect(page.locator('#kazanc')).not.toContainText('999.999');
  expect(await page.evaluate(() => localStorage.getItem('turksab-satis-ortakligi-v1'))).toBe('{bozuk');
});

test('rehber bağlantıları hesaplayıcının iki sürümünde de açılır', async ({ page }) => {
  for (const surum of ['v1', 'v2']) {
    await page.goto(`satis-ortakligi/?surum=${surum}`);
    const nav = page.getByRole('navigation', { name: 'Çalışma rehberleri' });
    await expect(nav.getByRole('link')).toHaveCount(5);
    await nav.getByRole('link', { name: 'Mevcut müşteri', exact: true }).click();
    await expect(page).toHaveURL(/politikalar\/tavsiye\//);
    await expect(page.locator('.pol-belge')).toBeVisible();
  }
});

test('açılan bölümler klavyeyle çalışır ve yön değişince korunur', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('politikalar/cozum/');
  const buttons = page.locator('#hedef-kitle .pol-ac');
  await buttons.first().focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(buttons.first()).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-focus-mode', 'keyboard');
  const focus = await buttons.first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { outline: s.outlineStyle, shadow: s.boxShadow, line: s.textDecorationLine };
  });
  expect(focus.outline).toBe('none');
  expect(focus.shadow).toBe('none');
  expect(focus.line).toContain('underline');
  await page.keyboard.press('Enter');
  await expect(buttons.first()).toHaveAttribute('aria-expanded', 'true');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(buttons.first()).toBeFocused();
  await expect(buttons.first()).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press('Space');
  await expect(buttons.nth(1)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Space');
  await expect(buttons.nth(1)).toHaveAttribute('aria-expanded', 'false');
  await buttons.first().click();
  await expect(buttons.first()).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('html')).not.toHaveAttribute('data-focus-mode', 'keyboard');
  const current = page.locator('.pol-roller a[aria-current="page"]');
  await current.focus();
  const before = await current.evaluate((el) => getComputedStyle(el).textDecorationThickness);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(current).toBeFocused();
  const after = await current.evaluate((el) => ({ thickness: getComputedStyle(el).textDecorationThickness, outline: getComputedStyle(el).outlineStyle }));
  expect(after.outline).toBe('none');
  expect(after.thickness).not.toBe(before);
  expect(parseFloat(after.thickness)).toBeGreaterThanOrEqual(2);
});

test('dar ekran ve açık ayrıntılarda metin okunur, gereksiz grafik indirilmez', async ({ page }) => {
  const assets: string[] = [];
  page.on('request', (r) => assets.push(r.url()));
  await page.goto('politikalar/cozum/');
  await expect(page.locator('.pol-belge')).toBeVisible();
  await page.getByRole('button', { name: 'Başlamadan netleştireceğimiz konular', exact: true }).click();
  await page.getByRole('button', { name: 'İkinci hesap sürümü seçilirse', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 360, 375, 390, 767, 768, 769, 1280]) {
    await page.setViewportSize({ width, height: 720 });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const result = await page.locator('.pol-belge').evaluate((root) => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      small: [...root.querySelectorAll('*')].filter((el) => el.getClientRects().length && getComputedStyle(el).display !== 'none'
        && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()) && parseFloat(getComputedStyle(el).fontSize) < 14).map((el) => el.tagName),
    }));
    expect(result, `${width}px`).toEqual({ overflow: false, small: [] });
  }
  expect(assets.filter((url) => /echarts|charts\./i.test(url))).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Haftalık kontrol', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Haftalık kontrol', exact: true })).toHaveAttribute('aria-expanded', 'true');
});


test('özel programın sonuç dönemi ve varsayımları kaybolmaz', async () => {
  const { rehberHesabi } = await import('../src/data/politikalar/hesap');
  const yillara = rehberHesabi('oncu').programlar.find((p) => p.id === 'yillara')!;
  expect(yillara.donem).toBe('3 yıl');
  expect(yillara.aciklama).toContain('ayda');
  expect(yillara.kurallar.join(' ')).toContain('her yıl yenilediğini varsayar');
  const saha = rehberHesabi('kadrolu').programlar.find((p) => p.id === 'saha')!;
  expect(saha.donem).toBe('ay');
  expect(saha.aciklama).toContain('satış');
});

test('rehber hareketleri iki yönde ortak eğriyi ve azaltma tercihini kullanır', async ({ page }) => {
  await page.goto('politikalar/oncu/');
  const button = page.locator('#hedef-kitle .pol-ac').first();
  const chevron = button.locator('.mantine-Accordion-chevron');
  const styles = async () => Promise.all([button, chevron].map((el) => el.evaluate((node) => {
    const s = getComputedStyle(node);
    return { duration: parseFloat(s.transitionDuration), curve: s.transitionTimingFunction, delay: s.transitionDelay };
  })));
  await expect(button).toBeVisible();
  for (const open of [true, false]) {
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', String(open));
    for (const s of await styles()) {
      expect(s.duration).toBeGreaterThan(0);
      expect(s.curve).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
      expect(s.delay).toBe('0s');
    }
  }
  await button.hover();
  const hovered = await styles();
  await page.mouse.move(0, 0);
  expect(await styles()).toEqual(hovered);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await styles()).map((s) => s.duration)).toEqual([0, 0]);
});


test('çözüm ortağının eğitim gideri ve müşavir seçeneği ayrı gösterilir', async () => {
  const { rehberHesabi, tl } = await import('../src/data/politikalar/hesap');
  const v1 = await import('../src/data/satisOrtakligi');
  const a = { ...v1.VARSAYILAN_AYAR, marka: 'segika' as const };
  const h = rehberHesabi('cozum').ornekler.find((h) => h.urun === 'Segika')!;
  expect(h.satirlar.find((s) => s.ad.endsWith('ek eğitim düşülünce'))?.deger)
    .toBe(tl(v1.donemKazanci(a, 'cozum').find((s) => s.ad === 'Ek eğitim düşülünce')!.yillik));
  expect(h.aciklama.join(' ')).toContain(`${a.egitimSaat} saat ücretsiz`);
  expect(h.aciklama.join(' ')).toContain('Müşavir komisyon yerine panel alır.');
  expect(h.aciklama.join(' ')).toContain('kendiliğinden birleşmez');
});
