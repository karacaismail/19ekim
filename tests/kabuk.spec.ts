import { expect, test, type Page } from './fixtures/persona';

/**
 * Sayfa kabuğu (src/components/AppFrame.tsx, scripts/serve-dist.mjs). “İçeriğe geç” bağlantısı klavye kullanıcısını
 * menüyü atlayıp ana içeriğe götürür. Bilinmeyen adres 404 sayfasını verir ve ana sayfaya dönüş bağlantısı çalışır.
 */

async function ac(page: Page, yol: string) {
  const yanit = await page.goto(yol);
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  return yanit;
}

test('“İçeriğe geç”: ilk Tab bağlantıya gider ve bağlantı görünür olur', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not_run: Playwright WebKit macOS üzerinde Tab ile bağlantıya odak taşımaz.');
  await ac(page, 'karar/');
  const atla = page.getByRole('link', { name: 'İçeriğe geç' });
  await expect(atla).toHaveAttribute('href', '#icerik');
  // Odak yokken bağlantı ekranın dışındadır.
  await expect(atla).not.toBeInViewport();
  await page.keyboard.press('Tab');
  await expect(atla).toBeFocused();
  await expect(atla).toBeInViewport();
  await expect(page.locator('html')).toHaveAttribute('data-focus-mode', 'keyboard');
});

test('“İçeriğe geç” etkinleşince odak ana içeriğe (#icerik) geçer', async ({ page }) => {
  await ac(page, 'karar/');
  const atla = page.getByRole('link', { name: 'İçeriğe geç' });
  // WebKit'te Tab bağlantıya gitmez. Odak doğrudan verilir, Enter tuşu iki motorda da denenir.
  await atla.focus();
  await expect(atla).toBeFocused();
  await page.keyboard.press('Enter');
  const ana = page.getByRole('main');
  await expect(ana).toHaveAttribute('id', 'icerik');
  await expect(ana).toBeFocused();
  await expect(page).toHaveURL(/#icerik$/);
});

test('bilinmeyen adres 404 durumuyla döner; tek ana başlık var; ana sayfa bağlantısı çalışır', async ({ page }) => {
  const yanit = await ac(page, 'olmayan-sayfa/');
  expect(yanit?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sayfa bulunamadı');
  const ana = page.getByRole('main').locator('a[href="/19ekim/"]');
  await expect(ana).toHaveCount(1);
  await ana.click();
  await expect(page).toHaveURL(/\/19ekim\/$/);
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Sayfa bulunamadı');
});
