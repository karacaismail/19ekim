import { expect, test, type Page } from '@playwright/test';

/** Ücret ve performans applet’leri (/applet/): katalog yayılımı, kalıcılık, markalı seçim, anahtar ve klavye odağı. */

const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

async function ac(page: Page, applet = '') {
  await page.goto(`applet/${applet ? `#${applet}` : ''}`);
  await icerik(page);
  await hydrated(page);
}

/** Rütbe matrisinde bir seviye satırının Yazılım hücresi (Seviye başlığından sonra: Çarpan, Yazılım). */
const yazilimHucresi = (page: Page, kod: string) =>
  page.getByRole('region', { name: 'Meslek × seviye' }).locator('tbody tr', { has: page.locator('th', { hasText: new RegExp(`^${kod}`) }) }).locator('td').nth(1);

test.describe('applet sayfası', () => {
  test('bir anda tek applet: yan menü, adres (#), geri tuşu ve sıradaki applet', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ac(page);
    await expect(page.locator('section.section')).toHaveCount(1);
    await expect(page.locator('section#katalog')).toBeVisible();
    const menu = page.getByRole('navigation', { name: 'Applet’ler' });
    await expect(menu.getByRole('link')).toHaveCount(17);
    await expect(menu.getByRole('link', { name: 'Meslek ve seviye kataloğu' })).toHaveAttribute('aria-current', 'true');

    await menu.getByRole('link', { name: 'Kademe serisi ve bantlar' }).click();
    await expect(page).toHaveURL(/\/applet\/#kademe-serisi$/);
    await expect(page.locator('section.section')).toHaveCount(1);
    await expect(page.locator('section#kademe-serisi')).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Kademe serisi ve bantlar' })).toHaveAttribute('aria-current', 'true');
    await expect(menu.locator('[aria-current]')).toHaveCount(1);
    // Odak yeni içeriğe (panele) taşınır.
    expect(await page.evaluate(() => document.activeElement?.classList.contains('applet-panel'))).toBe(true);

    await page.goBack();
    await expect(page.locator('section#katalog')).toBeVisible();

    await page.getByRole('navigation', { name: 'Applet sırası' }).getByRole('link', { name: /Sonraki/ }).click();
    await expect(page.locator('section#rutbe-matrisi')).toBeVisible();

    // Derin bağlantı doğrudan açılır.
    await ac(page, 'prim-egrisi');
    await expect(page.locator('section#prim-egrisi')).toBeVisible();
    await expect(page.locator('section.section')).toHaveCount(1);
    // Açılır seçimler markalı (Mantine liste kutusu); işletim sistemi listesi kullanılmaz.
    await expect(page.locator('select')).toHaveCount(0);
  });

  test('dar ekran: yan menü yerine gruplu seçim ve önceki/sonraki', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ac(page);
    await expect(page.getByRole('navigation', { name: 'Applet’ler' })).toBeHidden();
    const secim = page.getByRole('combobox', { name: 'Applet' });
    await expect(secim).toHaveValue('1 · Meslek ve seviye kataloğu');
    await secim.click();
    await page.getByRole('option', { name: '13 · Prim ödeme eğrisi' }).click();
    await expect(page.locator('section#prim-egrisi')).toBeVisible();
    await expect(page).toHaveURL(/#prim-egrisi$/);
    const sonraki = page.getByRole('button', { name: 'Sonraki' });
    await sonraki.click();
    await expect(page.locator('section#prim-havuzu')).toBeVisible();
    await expect(secim).toHaveValue('14 · Şirket × takım × birey');
    await page.getByRole('button', { name: 'Önceki' }).click();
    await expect(page.locator('section#prim-egrisi')).toBeVisible();
  });

  for (const width of [320, 1280]) {
    test(`${width} px: her applet yatay taşmasız, metin ≥ 14 px, kelime bölünmez`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await ac(page);
      const idler = await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('.applet-gezgin-oge')].map((a) => a.hash.slice(1)));
      expect(idler).toHaveLength(17);
      for (const id of idler) {
        await page.goto(`applet/#${id}`);
        await expect(page.locator(`section#${id}`)).toBeVisible();
        const r = await page.evaluate(() => {
          const gorunur = (el: Element) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
          const metin = [...document.querySelectorAll('.applet-sayfa *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()) && gorunur(el) && !el.closest('.visually-hidden'));
          return {
            tasma: document.documentElement.scrollWidth - window.innerWidth,
            kucuk: metin.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14).map((el) => el.className),
            bolme: [...document.querySelectorAll('.data-table th, .data-table td')].filter((c) => getComputedStyle(c).wordBreak === 'break-all' || getComputedStyle(c).overflowWrap === 'anywhere').length,
          };
        });
        expect(r.tasma, `${id} yatay taşıyor`).toBeLessThanOrEqual(0);
        expect(r.kucuk, `${id} 14 px altı metin`).toEqual([]);
        expect(r.bolme, `${id} zorlayıcı kelime bölme`).toBe(0);
      }
    });
  }

  test('katalog değişikliği rütbe matrisine yansır, kaydedilir ve iki adımda sıfırlanır', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ac(page);
    const katsayi = page.getByRole('textbox', { name: 'Yazılım katsayısı' });
    await katsayi.fill('2');
    await page.getByRole('navigation', { name: 'Applet’ler' }).getByRole('link', { name: 'Rütbe matrisi' }).click();
    await expect(yazilimHucresi(page, 'P2')).toContainText('2 ×');
    await expect(page.getByRole('status').filter({ hasText: 'applet örnek değerlerden farklı' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('turksab-applet'))).toContain('"katsayi":2');

    await page.reload();
    await icerik(page);
    await hydrated(page);
    await expect(yazilimHucresi(page, 'P2')).toContainText('2 ×');

    await page.getByRole('button', { name: 'Örnek değerlere dön' }).click();
    await page.getByRole('button', { name: 'Emin misiniz? Tekrar basın' }).click();
    await expect(yazilimHucresi(page, 'P2')).toContainText('1,8 ×');
    await page.getByRole('navigation', { name: 'Applet’ler' }).getByRole('link', { name: 'Meslek ve seviye kataloğu' }).click();
    await expect(page.getByRole('textbox', { name: 'Yazılım katsayısı' })).toHaveValue('1,8');
    expect(await page.evaluate(() => localStorage.getItem('turksab-applet'))).toBeNull();
  });

  test('markalı seçim: fare ve klavyeyle açılır, seçilen değer koşullu alanı açar', async ({ page }) => {
    await ac(page);
    const baz = page.getByRole('combobox', { name: 'Baz birim' });
    await baz.click();
    const liste = page.getByRole('listbox');
    await expect(liste).toBeVisible();
    await expect(liste.getByRole('option')).toHaveText([/Asgari ücret \(net\)/, /Asgari ücret \(brüt\)/, /Özel birim/]);
    // Panel markalı yüzeyde (tokenlı zemin), çevreleyen halka yok.
    expect(await liste.evaluate((el) => getComputedStyle(el.closest('.navmenu')!).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    await liste.getByRole('option', { name: 'Özel birim' }).click();
    await expect(page.getByRole('textbox', { name: 'Özel birim tutarı' })).toBeVisible();

    // Klavye: ok listeyi açar, etkin seçenek işaretlenir (aria-activedescendant), Enter seçer, Escape kapatır.
    await baz.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    const etkin = await baz.getAttribute('aria-activedescendant');
    expect(etkin).toBeTruthy();
    const secilecek = (await page.locator(`[id="${etkin}"]`).textContent())?.trim();
    await page.keyboard.press('Enter');
    await expect(baz).toHaveValue(secilecek!);
    await expect(page.getByRole('textbox', { name: 'Özel birim tutarı' })).toHaveCount(secilecek === 'Özel birim' ? 1 : 0);
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
  });

  test('anahtar ve ön ayar: durum anında, hesap güncellenir', async ({ page }) => {
    await ac(page, 'taban-ucret');
    const anahtar = page.getByRole('switch', { name: 'Adrese değil insana öde' });
    await expect(anahtar).toHaveAttribute('aria-checked', 'false');
    const lokasyon = page.getByRole('region', { name: 'Çarpan zinciri' }).locator('tbody tr', { hasText: 'Lokasyon faktörü' });
    await expect(lokasyon).toContainText('0,85 ×');
    await anahtar.click();
    await expect(anahtar).toHaveAttribute('aria-checked', 'true');
    await expect(lokasyon).toContainText('1 ×');

    await ac(page, 'prim-egrisi');
    const egri = page.locator('#prim-egrisi');
    const ilk = egri.getByRole('button', { name: /İlk model/ });
    await ilk.click();
    await expect(ilk).toHaveAttribute('aria-pressed', 'true');
    // İlk modelde skor 112: (112 − 110) ÷ (140 − 110) × %30 = %2 taban.
    await expect(egri.locator('.stat', { hasText: 'Tabanın' }).locator('.stat-value')).toHaveText('%2');
  });

  test('klavye odağı: etiketsiz hücre alanında ve onay kutusunda çevrelemeyen tek gösterge', async ({ page, browserName }) => {
    await ac(page);
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    expect(await page.evaluate(() => document.documentElement.dataset.focusMode)).toBe('keyboard');

    const hucre = page.getByRole('textbox', { name: 'Yazılım katsayısı' });
    await hucre.focus();
    const alan = await hucre.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { outline: cs.outlineStyle, outlineWidth: cs.outlineWidth, shadow: cs.boxShadow, sol: cs.borderTopLeftRadius, sag: cs.borderTopRightRadius };
    });
    expect(alan.outline === 'none' || parseFloat(alan.outlineWidth) === 0).toBe(true);
    expect(alan.shadow).toMatch(/inset/);
    expect(alan.shadow).toMatch(/3px 0px 0px 0px/);
    expect(parseFloat(alan.sol)).toBe(0);
    // Köşe sözleşmesi (ux.md §6.3, 2026-10-27): alanın bütün köşeleri 0; eski “karşı köşe yuvarlak kalır” kabulü kalktı.
    expect(parseFloat(alan.sag)).toBe(0);

    await page.goto('applet/#terfi-kapisi');
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const kutu = page.getByRole('checkbox', { name: 'Bilgi: son dönem' });
    await kutu.focus();
    const gosterge = await kutu.evaluate((el) => {
      const kok = el.closest('.applet-onay')!;
      const after = getComputedStyle(kok, '::after');
      return { content: after.content, h: after.height, outline: getComputedStyle(el).outlineStyle };
    });
    expect(gosterge.outline).toBe('none');
    expect(gosterge.content).not.toBe('none');
    expect(gosterge.h).toBe('3px');

    // İşaretçi modunda gösterge yok.
    await page.mouse.click(5, 300);
    await kutu.focus();
    expect(await kutu.evaluate((el) => getComputedStyle(el.closest('.applet-onay')!, '::after').content)).toBe('none');
  });

  test('sayı alanı: ara değerler yazılabilir, aralık dışı odaktan çıkınca sınıra çekilir, boş alan geri döner', async ({ page }) => {
    await ac(page, 'taban-ucret');
    const konum = page.getByRole('textbox', { name: 'Band içi konum (compa-ratio)' });
    await konum.fill('');
    await konum.pressSequentially('0,85');
    await expect(konum).toHaveValue('0,85');
    const kademe = page.getByRole('region', { name: 'Çarpan zinciri' }).locator('tbody tr', { hasText: 'Band içi konum' });
    await expect(kademe).toContainText('0,85 ×');
    await konum.fill('');
    await konum.blur();
    await expect(konum).toHaveValue('0,85');

    await ac(page, 'kademe-adimlari');
    const adet = page.getByRole('textbox', { name: 'Kademe sayısı' });
    await adet.fill('');
    await adet.pressSequentially('12');
    await adet.blur();
    await expect(page.getByRole('region', { name: 'Kademeler' }).locator('tbody tr')).toHaveCount(12);
    // 11. ve 12. kademede tabloda görünen bekleme (36 ay) hesaba girer: 18 + 3 + 3 yıl.
    await expect(page.getByRole('textbox', { name: '12. kademe bekleme süresi (ay)' })).toHaveValue('36 ay');
    await expect(page.locator('#kademe-adimlari .stat', { hasText: 'Son kademeye süre' }).locator('.stat-value')).toHaveText('24 yıl');

    await ac(page, 'sprint-skoru');
    const tavan = page.getByRole('textbox', { name: 'Teslim puanı tavanı' });
    await tavan.fill('');
    await tavan.pressSequentially('150');
    await expect(tavan).toHaveValue('150');
    await tavan.fill('');
    await tavan.pressSequentially('999');
    await tavan.blur();
    await expect(tavan).toHaveValue('200');
  });

  test('dokunmatik: bağımsız kontroller ve hücre onay kutuları en az 48 CSS px', async ({ browser, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox mobil emülasyonu desteklemez');
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    for (const id of ['terfi-kapisi', 'prim-egrisi', 'katalog']) {
      await page.goto(`applet/#${id}`);
      await icerik(page);
      await expect(page.locator(`section#${id}`)).toBeVisible();
      const olcu = await page
        .locator('.applet-dugme, .applet-eylem, .applet-anahtar, .applet-onay-alan, .applet-sayfa .param-input')
        .evaluateAll((els) => els.filter((el) => el.getClientRects().length).map((el) => { const r = el.getBoundingClientRect(); return { h: r.height, w: r.width, c: el.className }; }));
      expect(olcu.length, id).toBeGreaterThan(0);
      for (const o of olcu) {
        expect(o.h, `${id}: ${o.c}`).toBeGreaterThanOrEqual(48);
        expect(o.w, `${id}: ${o.c}`).toBeGreaterThanOrEqual(48);
      }
    }
    // Onay kutusunun çevresine dokunmak da işaretler.
    await page.goto('applet/#terfi-kapisi');
    await icerik(page);
    const kutu = page.getByRole('checkbox', { name: 'Bilgi: önceki dönem' });
    await expect(kutu).not.toBeChecked();
    await kutu.scrollIntoViewIfNeeded();
    const alan = await kutu.evaluate((el) => { const r = el.closest('.applet-onay-alan')!.getBoundingClientRect(); return { x: r.left + 3, y: r.top + 3 }; });
    await page.touchscreen.tap(alan.x, alan.y);
    await expect(kutu).toBeChecked();
    await context.close();
  });

  test('terfi kapısı: kriter işareti kararı değiştirir', async ({ page }) => {
    await ac(page, 'terfi-kapisi');
    const terfi = page.locator('#terfi-kapisi');
    const karar = terfi.locator('.stat', { hasText: 'Karar' });
    await expect(karar).toContainText('Koşullu: 1 koşul eksik');
    await page.getByRole('checkbox', { name: 'Otonomi: son dönem' }).uncheck();
    await page.getByRole('checkbox', { name: 'Etki: son dönem' }).uncheck();
    await expect(karar).toContainText('Hazır değil: 2 koşul eksik');
  });
});
