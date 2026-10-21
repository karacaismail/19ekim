import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from '@playwright/test';
import { GIRIS_ANAHTARI, kullaniciAdiNormal } from '../src/lib/giris';

/*
 * Giriş kapısı (kullanıcı kararı 2026-10-21): girişsiz yalnız giriş formu; statik HTML'de içerik yok. Parola repoya
 * yazılmaz: doğru parolayla giriş testi `GIRIS_PAROLA` ortam değişkeniyle çalışır, yoksa atlanır.
 */
const PAROLA = process.env.GIRIS_PAROLA;
const YOLLAR = ['', 'giderler/', 'istihdam/', 'hedefler/', 'notlar/', 'roller/segika/'];
/** Derlenen tüm sayfalar (dist): statik HTML denetimi hepsinde. */
const DIST = join(import.meta.dirname, '..', 'dist');
const TUM_SAYFALAR = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('index.html'))
  .map((f) => relative(DIST, join(DIST, f)).replace(/index\.html$/, ''));

test.describe('giriş kapısı', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('kullanıcı adı büyük/küçük harf ve Türkçe karakterden bağımsız', () => {
    for (const ad of ['turksab', 'TURKSAB', 'Turksab', 'Türksab', 'TürksAB', 'TÜRKSAB', 'türksab', 'tÜrksab', ' Türksab ']) {
      expect(kullaniciAdiNormal(ad), ad).toBe('turksab');
    }
    for (const ad of ['turksa', 'turk sab', 'türksab1', 'istoc']) expect(kullaniciAdiNormal(ad), ad).not.toBe('turksab');
  });

  test('statik HTML’de içerik yok: yalnız giriş formu (gezinme, kırıntı, alt bilgi, tutar yok)', async ({ request }) => {
    expect(TUM_SAYFALAR.length).toBeGreaterThan(15);
    for (const yol of TUM_SAYFALAR) {
      const html = await (await request.get(yol)).text();
      expect(html, yol).toContain('giris-form');
      for (const yok of ['mainnav-list', 'class="crumbs', 'app-footer', 'pager-link', '₺', 'Bordro', 'İsmail Karaca', '3.000.000']) expect(html, `${yol}: ${yok}`).not.toContain(yok);
      // Sayfa açıklaması da veri taşımaz (tüm sayfalarda genel); arama motorları dizinlemez.
      expect(html, yol).toContain('content="Türksab pazarlama ve finansal planlama. Görmek için giriş gerekir."');
      expect(html, yol).toContain('noindex, nofollow');
    }
  });

  for (const yol of YOLLAR) {
    test(`/${yol}: girişsiz yalnız giriş formu görünür`, async ({ page }) => {
      await page.goto(yol);
      await expect(page.getByRole('heading', { name: 'Giriş', level: 1 })).toBeVisible();
      await expect(page.getByLabel('Kullanıcı adı')).toBeVisible();
      await expect(page.getByLabel('Parola', { exact: true })).toHaveAttribute('type', 'password');
      await expect(page.getByRole('button', { name: 'Giriş yap' })).toBeEnabled();
      await expect(page.getByRole('navigation', { name: 'Ana gezinme' })).toHaveCount(0);
      await expect(page.locator('.crumbs, .app-footer, .pager, .opex-live')).toHaveCount(0);
      await expect(page.locator('html')).not.toHaveAttribute('data-giris', '');
    });
  }

  test('yanlış parola: hata duyurulur, parola temizlenir ve odaklanır; adres çubuğunda veri yok, içerik açılmaz', async ({ page }) => {
    await page.goto('hedefler/');
    await page.getByLabel('Kullanıcı adı').fill('Türksab');
    const parola = page.getByLabel('Parola', { exact: true });
    await parola.fill('yanlis-parola');
    await page.getByRole('button', { name: 'Giriş yap' }).click();
    const uyari = page.getByRole('alert');
    await expect(uyari).toHaveText('Kullanıcı adı veya parola hatalı.');
    // İleti parola alanına bağlı (ekran okuyucu alanla birlikte okur).
    expect(await parola.getAttribute('aria-describedby')).toContain((await uyari.getAttribute('id'))!);
    await expect(parola).toHaveAttribute('aria-invalid', 'true');
    await expect(parola).toHaveValue('');
    await expect(parola).toBeFocused();
    await expect(page.getByLabel('Kullanıcı adı')).toHaveAttribute('aria-invalid', 'true');
    expect(new URL(page.url()).search).toBe('');
    await expect(page.locator('.app-footer')).toHaveCount(0);
    expect(await page.evaluate((k) => localStorage.getItem(k), GIRIS_ANAHTARI)).toBeNull();
    // Yazmaya başlayınca hata kalkar.
    await parola.fill('x');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('yanlış kullanıcı adı: doğru biçimdeki parolayla da açılmaz', async ({ page }) => {
    await page.goto('');
    await page.getByLabel('Kullanıcı adı').fill('istoc');
    await page.getByLabel('Parola', { exact: true }).fill(PAROLA ?? '0000');
    await page.getByLabel('Parola', { exact: true }).press('Enter');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Ana gezinme' })).toHaveCount(0);
  });

  test('doğru giriş (yazım farkı önemsiz, Enter ile de): içerik açılır, odak içerikte, sayfalar arası kalır', async ({ page }) => {
    test.skip(!PAROLA, 'GIRIS_PAROLA ortam değişkeni yok (parola repoya yazılmaz)');
    await page.goto('hedefler/');
    await page.getByLabel('Kullanıcı adı').fill('TürksAB');
    await page.getByLabel('Parola', { exact: true }).fill(PAROLA!);
    await page.getByRole('button', { name: 'Giriş yap' }).click();
    await expect(page.getByRole('navigation', { name: 'Ana gezinme' })).toBeVisible();
    await expect(page.locator('.giris')).toHaveCount(0);
    await expect(page.locator('#icerik')).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute('data-giris', '');
    expect(new URL(page.url()).search).toBe('');
    // Başka sayfada da girişli; içerik çizilir.
    await page.goto('istihdam/');
    await expect(page.getByRole('navigation', { name: 'Ana gezinme' })).toBeVisible();
    await expect(page.locator('.app-footer')).toBeVisible();
    await page.getByRole('button', { name: 'Çıkış yap' }).click();
    await expect(page.getByRole('heading', { name: 'Giriş', level: 1 })).toBeVisible();
    // Başka yazımla, Enter tuşuyla.
    await page.getByLabel('Kullanıcı adı').fill('TURKSAB');
    await page.getByLabel('Parola', { exact: true }).fill(PAROLA!);
    await page.getByLabel('Parola', { exact: true }).press('Enter');
    await expect(page.getByRole('navigation', { name: 'Ana gezinme' })).toBeVisible();
  });

  test('JavaScript kapalı: form yerine not; gezinme ve içerik yok', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto('istihdam/');
    await expect(page.getByText('Giriş için tarayıcıda JavaScript açık olmalı.')).toBeVisible();
    await expect(page.locator('.giris-form')).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Ana gezinme' })).toHaveCount(0);
    await context.close();
  });

  test('hidrasyondan önce: düğme kapalı, Enter formu göndermez (adres çubuğunda veri yok)', async ({ page }) => {
    await page.route('**/_astro/*.js', (route) => route.abort());
    await page.goto('hedefler/');
    const dugme = page.getByRole('button', { name: 'Giriş yap' });
    await expect(dugme).toBeDisabled();
    await page.getByLabel('Kullanıcı adı').fill('turksab');
    await page.getByLabel('Parola', { exact: true }).fill('1234');
    await page.getByLabel('Parola', { exact: true }).press('Enter');
    await page.waitForTimeout(300);
    expect(new URL(page.url()).search).toBe('');
    await expect(page.getByLabel('Kullanıcı adı')).toHaveValue('turksab');
  });

  for (const width of [768, 1280]) {
    test(`${width} px girişsiz üst bant: marka solda, tema düğmesi sağda; tek satır`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('');
      await expect(page.getByRole('button', { name: 'Giriş yap' })).toBeEnabled();
      const [bant, marka, dugme] = [await page.locator('.topbar .wrap').boundingBox(), await page.locator('.brand').boundingBox(), await page.locator('.theme-toggle').boundingBox()];
      expect(marka!.x).toBeLessThan(bant!.x + bant!.width / 3);
      expect(dugme!.x + dugme!.width).toBeGreaterThan(bant!.x + bant!.width - 48);
      expect(Math.abs(marka!.y + marka!.height / 2 - (dugme!.y + dugme!.height / 2))).toBeLessThan(8);
    });
  }

  test('320 px: giriş formu sığar, yatay taşma yok; yazılar ≥ 14 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('');
    await expect(page.getByRole('button', { name: 'Giriş yap' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    const boyutlar = await page.locator('.giris :is(h1, p, label, input, button)').evaluateAll((els) => els.filter((el) => (el as HTMLElement).offsetParent).map((el) => parseFloat(getComputedStyle(el).fontSize)));
    expect(Math.min(...boyutlar)).toBeGreaterThanOrEqual(14);
  });
});

test.describe('girişli', () => {
  test('kayıtlı girişle içerik doğrudan açılır; ilk boyamada form gizli (işaret)', async ({ page }) => {
    await page.goto('hedefler/');
    await expect(page.locator('html')).toHaveAttribute('data-giris', '');
    await expect(page.getByRole('navigation', { name: 'Ana gezinme' })).toBeVisible();
    await expect(page.locator('.giris')).toHaveCount(0);
  });

  test('hidrasyondan önce girişliyken giriş formu görünmez', async ({ page }) => {
    await page.route('**/_astro/*.js', (route) => route.abort());
    await page.goto('hedefler/');
    await expect(page.locator('html')).toHaveAttribute('data-giris', '');
    await expect(page.locator('.giris')).toHaveCount(1);
    await expect(page.locator('.giris')).toBeHidden();
  });

  test('çıkış: giriş ekranı, odak kullanıcı adında, işaret kalkar; yeniden yüklemede de girişsiz', async ({ page }) => {
    await page.goto('istihdam/');
    await page.getByRole('button', { name: 'Çıkış yap' }).click();
    await expect(page.getByRole('heading', { name: 'Giriş', level: 1 })).toBeVisible();
    await expect(page.getByLabel('Kullanıcı adı')).toBeFocused();
    await expect(page.locator('html')).not.toHaveAttribute('data-giris', '');
    await expect(page.getByRole('navigation', { name: 'Ana gezinme' })).toHaveCount(0);
    expect(await page.evaluate((k) => localStorage.getItem(k), GIRIS_ANAHTARI)).toBeNull();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Giriş', level: 1 })).toBeVisible();
  });

  test('başka sekmede çıkış bu sekmeye yansır', async ({ page, context }) => {
    await page.goto('hedefler/');
    await expect(page.getByRole('navigation', { name: 'Ana gezinme' })).toBeVisible();
    const diger = await context.newPage();
    await diger.goto('istihdam/');
    await diger.getByRole('button', { name: 'Çıkış yap' }).click();
    await expect(page.getByRole('heading', { name: 'Giriş', level: 1 })).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-giris', '');
    await expect(page.getByRole('navigation', { name: 'Ana gezinme' })).toHaveCount(0);
  });
});
