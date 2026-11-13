import { expect, test, type Locator, type Page } from './fixtures/persona';

/**
 * Sayfa sürümü kaydı (src/lib/surum.ts). Seçilen sürüm sayfaya özgü anahtarda saklanır. Adres (?surum=) kayıttan önce
 * gelir. Geçersiz değer sayılmaz. İlk çizim 1. sürümdür. Depolama kapalıysa sayfa çökmez. İki sayfa denenir:
 * İstihdam takvimi ve Satış ortaklığı.
 */

interface Sayfa {
  ad: string;
  yol: string;
  anahtar: string;
  v1: (page: Page) => Locator;
  v2: (page: Page) => Locator;
}

const SAYFALAR: Sayfa[] = [
  { ad: 'İstihdam takvimi', yol: 'istihdam/', anahtar: 'turksab-istihdam-surum', v1: (p) => p.locator('#katki'), v2: (p) => p.locator('#secenek') },
  { ad: 'Satış ortaklığı', yol: 'satis-ortakligi/', anahtar: 'turksab-satis-ortakligi-surum', v1: (p) => p.getByRole('tablist', { name: 'Roller' }), v2: (p) => p.getByRole('tablist', { name: 'Personalar' }) },
];
const SURUM_ADI = { v1: '1. sürüm', v2: '2. sürüm' } as const;

async function ac(page: Page, yol: string) {
  await page.goto(yol);
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}
/** Açılıştaki etki (kayıt ve adres okuma) bitsin. İlk çizim 1. sürüm olduğu için “1. sürüm” beklentisi erken geçmesin. */
const sakin = (page: Page) => page.evaluate(() => new Promise<void>((bitti) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(bitti, 50)))));
const kayit = (page: Page, anahtar: string) => page.evaluate((k) => localStorage.getItem(k), anahtar);
const dugme = (page: Page, surum: 'v1' | 'v2') => page.getByRole('group', { name: 'Sürüm' }).getByRole('button', { name: SURUM_ADI[surum], exact: true });

async function surumBekle(page: Page, s: Sayfa, surum: 'v1' | 'v2') {
  await expect(dugme(page, surum)).toHaveAttribute('aria-pressed', 'true');
  await expect(s[surum](page)).toHaveCount(1);
  await expect(s[surum === 'v1' ? 'v2' : 'v1'](page)).toHaveCount(0);
}

/** Yalnız sürüm anahtarlarında depolamayı kapatır. Giriş kaydı çalışmaya devam eder. */
const depolamaKapali = (page: Page) =>
  page.addInitScript(() => {
    const oku = Storage.prototype.getItem;
    const yaz = Storage.prototype.setItem;
    const kapali = (k: unknown) => String(k).endsWith('-surum');
    Storage.prototype.getItem = function (k: string) {
      if (kapali(k)) throw new DOMException('Depolama kapalı', 'SecurityError');
      return oku.call(this, k);
    };
    Storage.prototype.setItem = function (k: string, v: string) {
      if (kapali(k)) throw new DOMException('Depolama kapalı', 'SecurityError');
      return yaz.call(this, k, v);
    };
  });

for (const s of SAYFALAR) {
  const diger = SAYFALAR.find((x) => x !== s)!;

  test(`${s.ad}: seçilen sürüm saklanır, adressiz açılışta kullanılır; adres kaydın önüne geçer`, async ({ page }) => {
    await ac(page, s.yol);
    await sakin(page);
    await surumBekle(page, s, 'v1');
    await dugme(page, 'v2').click();
    await surumBekle(page, s, 'v2');
    expect(await kayit(page, s.anahtar)).toBe('v2');
    // Kayıt sayfaya özgüdür: diğer sayfanın anahtarı yazılmaz.
    expect(await kayit(page, diger.anahtar)).toBeNull();
    // Adressiz açılış kayıttaki sürümü kullanır.
    await ac(page, s.yol);
    expect(new URL(page.url()).searchParams.get('surum')).toBeNull();
    await surumBekle(page, s, 'v2');
    // Adres kaydın önüne geçer.
    await ac(page, `${s.yol}?surum=v1`);
    await sakin(page);
    await surumBekle(page, s, 'v1');
    // 1. sürüm seçilince kayıt da değişir; adressiz açılış 1. sürümdür.
    await ac(page, s.yol);
    await surumBekle(page, s, 'v2');
    await dugme(page, 'v1').click();
    await surumBekle(page, s, 'v1');
    expect(await kayit(page, s.anahtar)).toBe('v1');
    await ac(page, s.yol);
    await sakin(page);
    await surumBekle(page, s, 'v1');
  });

  test(`${s.ad}: geçersiz ?surum=v3 sayılmaz; kayıt yoksa 1. sürüm, geçerli kayıt varsa kayıttaki sürüm açılır`, async ({ page }) => {
    await ac(page, `${s.yol}?surum=v3`);
    await sakin(page);
    await surumBekle(page, s, 'v1');
    expect(await kayit(page, s.anahtar)).toBeNull();
    await page.evaluate((k) => localStorage.setItem(k, 'v2'), s.anahtar);
    await ac(page, `${s.yol}?surum=v3`);
    await surumBekle(page, s, 'v2');
    // Kayıttaki geçersiz değer de sayılmaz.
    await page.evaluate((k) => localStorage.setItem(k, 'v9'), s.anahtar);
    await ac(page, s.yol);
    await sakin(page);
    await surumBekle(page, s, 'v1');
  });

  test(`${s.ad}: depolama kapalıyken sayfa çökmez ve sürüm seçici çalışır`, async ({ page }) => {
    const hatalar: string[] = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    await depolamaKapali(page);
    await ac(page, s.yol);
    await sakin(page);
    await surumBekle(page, s, 'v1');
    await dugme(page, 'v2').click();
    await surumBekle(page, s, 'v2');
    await dugme(page, 'v1').click();
    await surumBekle(page, s, 'v1');
    expect(hatalar).toEqual([]);
  });

  test(`${s.ad}: depolama kapalıyken de ?surum=v2 bağlantısı 2. sürümü açar`, async ({ page }) => {
    // surum.ts: “Adres kayıttan önce gelir.” Kayıt okunamaması adresteki seçimi bozmamalı.
    await depolamaKapali(page);
    await ac(page, `${s.yol}?surum=v2`);
    await surumBekle(page, s, 'v2');
  });
}
