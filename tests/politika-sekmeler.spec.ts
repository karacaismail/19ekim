import { expect, test } from '@playwright/test';

test('rehber menüsü tek bağlantıdır ve iki projede beş rol sekmesi vardır', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('politikalar/?proje=segika&rol=cozum');
  await expect(page.getByRole('tablist', { name: 'Proje' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Segika', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tablist', { name: 'Çalışma rolü' }).getByRole('tab')).toHaveCount(5);
  const belge = page.locator('.pol-yol');
  await expect(belge).toHaveAttribute('data-proje', 'segika');
  await expect(belge).toHaveAttribute('data-rol', 'cozum');
  await expect(belge).not.toContainText(/iStoc|İstoç/i);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Pazarlama', exact: true }).click();
  const menu = page.getByRole('menu', { name: 'Pazarlama' });
  await expect(menu.getByRole('menuitem')).toHaveText(['Temsilci ağı', 'Satış ortaklığı', 'Değer önerisi', 'Gelir modelleri', 'Oyunlaştırma', 'Yeni kayıtlar', 'Çalışma rehberleri']);
});

test('sekmeler adresle eşleşir ve geri dönüş aynı proje ile rolü açar', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-proje', 'istoc');
  await page.getByRole('tab', { name: 'Marka elçisi', exact: true }).click();
  await expect(page).toHaveURL(/proje=istoc&rol=elci/);
  await page.getByRole('tab', { name: 'Segika', exact: true }).click();
  await expect(page).toHaveURL(/proje=segika&rol=elci/);
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-proje', 'segika');
  await page.goBack();
  await expect(page.getByRole('tab', { name: 'iStoc', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-proje', 'istoc');
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-rol', 'elci');
  await page.reload();
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-rol', 'elci');
});

for (const rol of ['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci']) {
  test(`eski ${rol} adresi aynı rolü merkezde açar`, async ({ page }) => {
    await page.goto(`politikalar/${rol}/`);
    await expect(page).toHaveURL(new RegExp(`politikalar/\\?proje=istoc&rol=${rol}$`));
    await expect(page.locator('.pol-yol')).toHaveAttribute('data-rol', rol);
  });
}

test('geçersiz seçim varsayılana döner ve klavye sekmeleri çalışır', async ({ page }) => {
  await page.goto('politikalar/?proje=olmayan&rol=olmayan');
  await expect(page).toHaveURL(/proje=istoc&rol=oncu$/);
  const tabs = page.getByRole('tablist', { name: 'Çalışma rolü' }).getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(tabs.first()).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/rol=kadrolu$/);
  await page.keyboard.press('End');
  await expect(tabs.last()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/rol=elci$/);
  await page.keyboard.press('Home');
  await expect(tabs.first()).toBeFocused();
  const focus = await tabs.first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { outline: s.outlineStyle, shadow: s.boxShadow, line: s.textDecorationLine };
  });
  expect(focus).toEqual({ outline: 'none', shadow: 'none', line: 'underline' });
  await page.keyboard.press('Space');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(tabs.first()).toBeFocused();
  await page.getByRole('tab', { name: 'Segika', exact: true }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-focus-mode', 'keyboard');
});

// Gerçek üretim yanıtları ölçülür. Dosya adları derlemenin hash değerine bağlanmaz.
const belgeDosyasi = /\/(?:oncu|kadrolu|cozum|tavsiye|elci)\.[\w-]+\.js$/;

test('yalnız seçilen belge indirilir ve geç yanıt yeni seçimi değiştirmez', async ({ page }) => {
  const istekler: string[] = [];
  page.on('request', (r) => { if (belgeDosyasi.test(r.url())) istekler.push(r.url()); });
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-proje', 'istoc');
  expect(istekler).toHaveLength(1);
  let serbestBirak!: () => void;
  const bekle = new Promise<void>((resolve) => { serbestBirak = resolve; });
  let geciken = false;
  await page.route(belgeDosyasi, async (route) => {
    if (!geciken) { geciken = true; await bekle; }
    await route.continue();
  });
  await page.getByRole('tab', { name: 'Segika', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Segika rehberi yükleniyor.');
  await expect(page.locator('.pol-yol')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Marka elçisi', exact: true }).click();
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-rol', 'elci');
  serbestBirak();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-rol', 'elci');
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-proje', 'segika');
  expect(istekler).toHaveLength(3);
});

test('belge yüklenemezse hata görünür ve yeniden yükleme çalışır', async ({ page }) => {
  await page.route(belgeDosyasi, (route) => route.abort());
  await page.goto('politikalar/?proje=segika&rol=tavsiye');
  await expect(page.getByRole('alert')).toContainText('Rehber yüklenemedi.');
  await expect(page.locator('.pol-yol')).toHaveCount(0);
  await page.unroute(belgeDosyasi);
  await page.getByRole('button', { name: 'Sayfayı yeniden yükle' }).click();
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-proje', 'segika');
  await expect(page.locator('.pol-yol')).toHaveAttribute('data-rol', 'tavsiye');
});

test('sekme hareketi iki yönde korunur ve büyütülen yazı taşmaz', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('politikalar/');
  const tab = page.getByRole('tab', { name: 'Segika', exact: true });
  await expect(tab).toBeVisible();
  const style = () => tab.evaluate((el) => {
    const s = getComputedStyle(el);
    return { duration: parseFloat(s.transitionDuration), curve: s.transitionTimingFunction, selected: el.getAttribute('aria-selected') };
  });
  await tab.click();
  expect(await style()).toEqual({ duration: 0.16, curve: 'cubic-bezier(0.65, 0, 0.35, 1)', selected: 'true' });
  await page.getByRole('tab', { name: 'iStoc', exact: true }).click();
  expect(await style()).toEqual({ duration: 0.16, curve: 'cubic-bezier(0.65, 0, 0.35, 1)', selected: 'false' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await style()).duration).toBe(0);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await expect(page.locator('.pol-yol')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});


test('bölüm bağlantısı paylaşılabilir ve yenilemede hedef bölüm açılır', async ({ page }) => {
  await page.goto('politikalar/?proje=segika&rol=oncu');
  await page.getByRole('button', { name: 'Bütün çalışma koşullarını açın', exact: true }).click();
  await page.getByRole('navigation', { name: 'Rehber bölümleri' }).getByRole('link', { name: 'Kazanç', exact: true }).click();
  await expect(page).toHaveURL(/proje=segika&rol=oncu#kazanc$/);
  await page.reload();
  await expect(page.locator('#kazanc')).toBeInViewport();
  await page.getByRole('tab', { name: 'Marka elçisi', exact: true }).click();
  await expect(page).toHaveURL(/proje=segika&rol=elci$/);
});
