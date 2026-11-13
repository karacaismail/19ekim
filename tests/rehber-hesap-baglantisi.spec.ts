import { expect, test, type Page } from './fixtures/persona';

// Çalışma rehberleri hesap sayfasına adresle bağlanır. Rehber hangi projeyi anlatıyorsa açılan hesap da o projeyi gösterir.
// 1. sürüm: `?surum=v1&proje=X&rol=Y`. 2. sürüm: `?surum=v2&urun=X`. 2. sürüm `proje` okumaz, çünkü 1. sürüm onu adrese
// yazar ve iki sürümün ayarları ayrı kalmalıdır (satis-ortakligi.spec.ts → “v2 kendi ayarıyla başlar”).

const urun = (page: Page, ad: 'iStoc' | 'Segika') => page.getByRole('group', { name: 'Ürün' }).getByRole('button', { name: ad, exact: true });

async function rehberBaglantisi(page: Page, ad: string, secici: string) {
  await page.goto('politikalar/?proje=segika&rol=cozum');
  await page.getByRole('button', { name: 'Bütün çalışma koşullarını açın', exact: true }).click();
  const adres = await page.locator(secici).filter({ hasText: ad }).first().getAttribute('href');
  expect(adres, ad).toBeTruthy();
  return adres!.replace(/^\/19ekim\//, '');
}

test('Segika rehberinin birinci sürüm bağlantısı Segika hesabını ve rehberin rolünü açar', async ({ page }) => {
  await page.goto(await rehberBaglantisi(page, 'Birinci sürümdeki hesabı açın', 'a[href*="surum=v1"]'));
  await expect(urun(page, 'Segika')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('tablist', { name: 'Roller' }).getByRole('tab', { selected: true })).toHaveAttribute('id', 'so2-sekme-cozum');
});

test('Segika rehberinin ikinci sürüm bağlantısı Segika hesabını açar ve seçimi saklar', async ({ page }) => {
  await page.goto(await rehberBaglantisi(page, 'İkinci sürümdeki hesabı açın', 'a[href*="surum=v2"]'));
  await expect(urun(page, 'Segika')).toHaveAttribute('aria-pressed', 'true');
  // Bağlantı ürünü bir kez seçer. Adres temizlenir, seçim 2. sürümün kaydında kalır.
  await expect(page).not.toHaveURL(/[?&]urun=/);
  await page.reload();
  await expect(urun(page, 'Segika')).toHaveAttribute('aria-pressed', 'true');
});

test('ikinci sürümde adresteki ürün kayıtlı seçimden önce gelir', async ({ page }) => {
  await page.goto('satis-ortakligi/?surum=v2');
  await urun(page, 'Segika').click();
  await expect(urun(page, 'Segika')).toHaveAttribute('aria-pressed', 'true');
  await page.goto('satis-ortakligi/?surum=v2&urun=istoc');
  await expect(urun(page, 'iStoc')).toHaveAttribute('aria-pressed', 'true');
});

test('ikinci sürüm geçersiz ürün adını yok sayar', async ({ page }) => {
  await page.goto('satis-ortakligi/?surum=v2&urun=baska');
  await expect(urun(page, 'iStoc')).toHaveAttribute('aria-pressed', 'true');
});

test('birinci sürümün adresindeki proje ikinci sürümün ürününü değiştirmez', async ({ page }) => {
  await page.goto('satis-ortakligi/?surum=v2&proje=segika');
  await expect(urun(page, 'iStoc')).toHaveAttribute('aria-pressed', 'true');
});
