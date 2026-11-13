import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';

/**
 * Sayfa gezgini: site genelindeki denetimler (yalın Türkçe, boşluk) aynı sayfa ve durum kümesini gezer.
 *
 * Sayfalar derlenmiş `dist` klasöründen okunur. Böylece kayda girmemiş alt sayfalar da denetlenir. Örneğin
 * `/politikalar/cozum/` gibi rehber sayfaları kendi adresiyle derlenir. Sürümlü sayfaların ikinci sürümü ayrıca gezilir.
 *
 * Her sayfa varsayılan olarak iki genişlikte açılır: 1280 px ve 375 px. Dar ekranda tablo kayıt listesine, grafik
 * eşdeğer listeye ve Gantt ajandaya döner. Testler başka genişlikler de isteyebilir (boşluk testi 320 ve 768 px ekler).
 *
 * Her genişlikte şu durumlar tek tek açılır ve her durumda `topla` çağrılır:
 * - kapalı paneller, anahtarlar, `details` öğeleri ve sekmeler,
 * - açılır pencere düğmeleri (`aria-haspopup`): iletişim kutusu, seçim listesi, menü,
 * - Mantine seçim kutularının seçenek listesi.
 *
 * Site geneli öğeler ana sayfada gezilir: üst menülerin her biri ve dar ekrandaki menü çekmecesi.
 */

const DIST = new URL('../dist/', import.meta.url).pathname;

function rotalar(dizin = DIST, on = '/'): string[] {
  const sonuc: string[] = [];
  for (const ad of readdirSync(dizin)) {
    if (ad === '_astro') continue;
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) sonuc.push(...rotalar(yol, `${on}${ad}/`));
    else if (ad === 'index.html') sonuc.push(on);
  }
  return sonuc;
}

/** Derlenmiş bütün sayfalar ve sürümlü sayfaların ikinci sürümü. */
export const TUM_SAYFALAR = [...rotalar().sort(), '/istihdam/?surum=v2', '/satis-ortakligi/?surum=v2'];

// Gezilen ama açılmayan düğme (gezinme içindeki düğme) `data-gezildi` alır. Böylece sıradaki düğmeye geçilir.
const KAPALI = 'main button[aria-expanded="false"]:not([aria-haspopup]):not([data-gezildi]), main [role="switch"][aria-checked="false"]:not([data-gezildi])';
const ACILIR = 'main button[aria-haspopup]:not([aria-haspopup="false"]):not([data-acilir-gezildi])';
const SECIM = 'main input[aria-haspopup="listbox"]:not([data-acilir-gezildi])';

/** Kapalı panelleri, anahtarları ve `details` öğelerini tek tek açar. Her açılıştan sonra `topla` çağrılır. */
async function ac(page: Page, topla: () => Promise<void>) {
  await page.evaluate(() => {
    for (const d of document.querySelectorAll<HTMLDetailsElement>('main details:not([open])')) d.open = true;
  });
  for (let tur = 0; tur < 3; tur++) {
    const n = await page.locator(KAPALI).count();
    if (!n) break;
    for (let i = 0; i < Math.min(n, 80); i++) {
      const b = page.locator(KAPALI).first();
      if (!(await b.count())) break;
      const tiklandi = await b
        .evaluate((x) => {
          if (x.closest('nav')) {
            x.setAttribute('data-gezildi', '');
            return false;
          }
          (x as HTMLElement).click();
          return true;
        })
        .catch(() => null);
      if (tiklandi === null) break;
      if (!tiklandi) continue;
      await page.waitForTimeout(80);
      await topla();
    }
  }
}

/** Açılır pencereleri ve seçim listelerini tek tek açar, açıkken `topla` çağırır, sonra Escape ile kapatır. */
async function acilirlar(page: Page, topla: () => Promise<void>) {
  for (const secici of [ACILIR, SECIM]) {
    for (let i = 0; i < 40; i++) {
      // Yalnız görünen düğme açılır. Gizli sekmedeki düğme, sekme açılınca sıradaki turda gezilir.
      const b = page.locator(`${secici}:visible`).first();
      if (!(await b.count())) break;
      await b.evaluate((x) => x.setAttribute('data-acilir-gezildi', ''));
      await b.click({ timeout: 2000 }).catch(() => undefined);
      await page.waitForTimeout(150);
      await topla();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
    }
  }
}

/** Site geneli: üst menülerin her biri (geniş ekran) ya da menü çekmecesi (dar ekran). */
async function siteGeneli(page: Page, topla: () => Promise<void>) {
  const menuler = page.locator('.topbar button[aria-haspopup="menu"]:visible');
  for (let i = 0; i < (await menuler.count()); i++) {
    await menuler.nth(i).click();
    await page.waitForTimeout(150);
    await topla();
    await page.keyboard.press('Escape');
  }
  const cekmece = page.locator('.cekmece-tetik:visible');
  if (await cekmece.count()) {
    await cekmece.click();
    await page.waitForTimeout(250);
    await topla();
    await page.keyboard.press('Escape');
  }
}

/** Sayfanın bütün durumlarını gezer: açılış, açılan paneller, açılır pencereler ve her sekme. */
async function durumlar(page: Page, topla: () => Promise<void>) {
  await topla();
  await ac(page, topla);
  await acilirlar(page, topla);
  const sekmeler = page.locator('main [role="tab"]');
  const sekmeSayisi = await sekmeler.count();
  for (let i = 0; i < sekmeSayisi; i++) {
    if (!(await sekmeler.nth(i).isVisible().catch(() => false))) continue;
    await sekmeler.nth(i).click().catch(() => undefined);
    await page.waitForTimeout(150);
    await ac(page, topla);
    await acilirlar(page, topla);
    await topla();
  }
}

/**
 * Bir sayfayı iki genişlikte bütün durumlarıyla gezer. Applet sayfasında bir anda tek applet çizilir. Bu yüzden her
 * applet kendi adresinde ayrıca gezilir.
 */
export async function sayfayiGez(page: Page, yol: string, topla: () => Promise<void>, genislikler = [1280, 375]) {
  const yukle = async (adres: string) => {
    await page.goto(adres.slice(1));
    await page.waitForSelector('.app-footer', { state: 'attached' });
    await page.waitForLoadState('networkidle');
  };
  await page.setViewportSize({ width: genislikler[0], height: 900 });
  await yukle(yol);
  const adresler =
    yol === '/applet/' ? await page.evaluate(() => [...new Set([...document.querySelectorAll('main a[href^="#"], nav a[href^="#"]')].map((a) => a.getAttribute('href') ?? '').filter((h) => h.length > 1))]) : [''];
  if (yol === '/applet/') expect(adresler.length, 'applet adresleri').toBeGreaterThan(10);
  for (const [sira, genislik] of genislikler.entries()) {
    await page.setViewportSize({ width: genislik, height: genislik >= 1024 ? 900 : 812 });
    for (const h of adresler) {
      if (!(sira === 0 && h === '')) await yukle(`${yol}${h}`);
      await durumlar(page, topla);
    }
    if (yol === '/') await siteGeneli(page, topla);
  }
}
