import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { buildEmailHtml, buildEmailText, EMAIL_ROWS, EMAIL_SUBJECT } from '../src/data/email';

/** Gizli sayfa: yalnız adresle açılır. Kopyalanan HTML e-posta istemcilerine uygun kalmalıdır. */
const PATH = 'email/';
const DONE_EMAIL = 'E-posta kopyalandı';
const FAILED = 'Kopyalanamadı';
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });
const primary = (page: Page) => page.locator('.email-btn[data-primary]');
const subjectButton = (page: Page) => page.locator('.email-btn:not([data-primary])');
const emailStatus = (page: Page) => page.locator('.email-status').nth(1);

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? htmlFiles(path) : path.endsWith('.html') ? [path] : [];
  });
}

/** WCAG kontrast oranı; "rgb(r, g, b)" biçimindeki iki renk için. */
function contrast(a: string, b: string) {
  const lum = (c: string) => {
    const [r, g, bl] = c
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map((v) => {
        const s = Number(v) / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test.describe('e-posta sayfası', () => {
  test('gizli: başka hiçbir sayfa /email/ adresine bağlanmaz; arama motoruna kapalı', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Derleme çıktısı tarayıcıdan bağımsızdır; bir kez denetlenir.');
    const dist = new URL('../dist/', import.meta.url).pathname;
    const linking = htmlFiles(dist)
      .filter((file) => !file.endsWith(join('email', 'index.html')))
      .filter((file) => /href=["'][^"']*\bemail\/?["'?#]/i.test(readFileSync(file, 'utf8')));
    expect(linking).toEqual([]);
    await page.goto(PATH);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('a[href*="email"]')).toHaveCount(0);
  });

  test('e-posta HTML: yalnız satır içi stil, renk yok, her metin öğesinde yazı tipi, metin ≥ 14 px ve ağırlık ≥ 300', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Üretilen HTML tarayıcıdan bağımsızdır; bir kez denetlenir.');
    const html = buildEmailHtml();
    expect(html).not.toMatch(/<style|class=|<script|<img|<a\s|width=|var\(--|@font-face/i);
    expect(html).not.toMatch(/(^|[;"\s])(color|background(-color)?)\s*:/i);
    // Tutar ve tarih Outlook'ta da bölünmez.
    for (const row of EMAIL_ROWS) expect(html).toContain(row.value.replace(/ /g, '&nbsp;'));
    await page.setContent(`<body>${html}</body>`);
    const report = await page.evaluate(() => {
      // Metin taşıyan her öğe yazı tipini kendisi söyler (tablo hücreleri bazı istemcilerde miras almaz).
      const els = [...document.body.querySelectorAll('*')].filter((el) =>
        [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()),
      );
      return {
        noFont: els.filter((el) => !(el.getAttribute('style') ?? '').includes('font-family:Outfit,')).map((el) => el.tagName),
        sizes: els.map((el) => parseFloat(getComputedStyle(el).fontSize)),
        weights: els.map((el) => Number(getComputedStyle(el).fontWeight)),
        rows: document.querySelectorAll('tr').length,
      };
    });
    expect(report.noFont).toEqual([]);
    expect(Math.min(...report.sizes)).toBeGreaterThanOrEqual(14);
    expect(Math.min(...report.weights)).toBeGreaterThanOrEqual(300);
    expect(report.rows).toBe(EMAIL_ROWS.length);

    const text = buildEmailText();
    expect(text).toContain('Aylık net maaş: 5.000 USD (beş bin dolar; ABD doları olarak ödenir)');
    expect(text).toContain('Başarı primi: 1.000.000 TL');
    expect(text).toContain('Uygulama başlangıcı: 1 Kasım 2026');
    expect(text).toContain('1 Kasım 2026’dan itibaren');
    expect(text).not.toMatch(/<[a-z]|&nbsp;/i);
  });

  const SIZES = [
    { width: 320, height: 800 },
    { width: 360, height: 800 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 568, height: 320 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
  ];
  for (const size of SIZES) {
    test(`${size.width}×${size.height}: taşma yok, tablo sığar, metin ≥ 14 px ve ağırlık ≥ 300, düğmeler ≥ 44 px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto(PATH);
      await hydrated(page);
      const result = await audit(page);
      expect(result.overflow).toBeLessThanOrEqual(0);
      expect(result.tableFits).toBe(true);
      expect(result.small).toEqual([]);
      expect(result.light).toEqual([]);
      expect(result.buttons).toHaveLength(2);
      for (const h of result.buttons) expect(h).toBeGreaterThanOrEqual(44);
    });
  }

  test('320 px, büyük kök yazı boyutu (125 %): düğme etiketi sarılır, sayfa taşmaz', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(PATH);
    await hydrated(page);
    await page.addStyleTag({ content: 'html { font-size: 125%; }' });
    const result = await audit(page);
    expect(result.overflow).toBeLessThanOrEqual(0);
    expect(result.buttonsFit).toBe(true);
  });

  test('erişilebilir adlar ve başlık yapısı', async ({ page }) => {
    await page.goto(PATH);
    await hydrated(page);
    await expect(subjectButton(page)).toHaveAccessibleName('Konuyu kopyala');
    await expect(primary(page)).toHaveAccessibleName('E-postayı kopyala');
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.locator('main h2').allTextContents()).toEqual(['1Konu', '2İleti', 'Önizleme']);
  });

  test('koyu tema: önizleme metni temayı izler (e-postada sabit renk yok)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(PATH);
    await hydrated(page);
    await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'dark');
    const colors = await page.evaluate(() => {
      const paper = getComputedStyle(document.querySelector('.email-preview') as Element).color;
      const cells = [...document.querySelectorAll('.email-preview p, .email-preview td, .email-preview div')].map((el) => getComputedStyle(el).color);
      return { paper, cells };
    });
    for (const c of colors.cells) expect(c).toBe(colors.paper);
    const [r, g, b] = colors.paper.match(/\d+/g)!.map(Number);
    expect((r + g + b) / 3).toBeGreaterThan(180);
  });

  test('önizlemeden elle kopyalama: koyu temada bile panoya renk yazılmaz', async ({ page, browserName }) => {
    test.skip(
      browserName === 'firefox',
      'not_run: Firefox yapay copy olayında clipboardData’ya yazdırmıyor; gerçek Firefox’ta ⌘C ile elle doğrulanmalı',
    );
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(PATH);
    await hydrated(page);
    const copied = await page.evaluate(() => {
      const article = document.querySelector('.email-preview') as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(article);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      const data = new DataTransfer();
      const event = new ClipboardEvent('copy', { clipboardData: data, bubbles: true, cancelable: true });
      article.querySelector('td')!.dispatchEvent(event);
      return { prevented: event.defaultPrevented, html: data.getData('text/html'), text: data.getData('text/plain') };
    });
    expect(copied.prevented).toBe(true);
    expect(copied.html).toContain('<table');
    expect(copied.html).toContain('font-family:Outfit, Helvetica, Arial, sans-serif');
    expect(copied.html).not.toMatch(/(^|[;"\s])(color|background(-color)?)\s*:/i);
    expect(copied.text).toContain('Murat abi, selamlar.');
  });

  test('kopyala: HTML ve düz metin birlikte panoya yazılır; ad, genişlik ve yerleşim sabit', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'not_run: Playwright yalnız Chromium’da pano okuma izni verir; Firefox ve WebKit’te gerçek tarayıcıda elle doğrulanmalı');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PATH);
    await hydrated(page);

    const button = primary(page);
    const before = (await button.boundingBox())!;
    await button.click();
    await expect(emailStatus(page)).toHaveText(new RegExp(`^${DONE_EMAIL}`));
    await expect(button).toHaveAttribute('data-done', '');
    await expect(button).toHaveAccessibleName(DONE_EMAIL);
    expect((await button.boundingBox())!.width).toBeCloseTo(before.width, 0);

    const clip = await page.evaluate(async () => {
      const [item] = await navigator.clipboard.read();
      const read = async (type: string) => (item.types.includes(type) ? (await item.getType(type)).text() : '');
      return { types: item.types, html: await read('text/html'), text: await read('text/plain') };
    });
    expect(clip.types).toEqual(expect.arrayContaining(['text/html', 'text/plain']));
    expect(clip.html).toContain('<table');
    expect(clip.html).toContain('font-family:Outfit, Helvetica, Arial, sans-serif');
    expect(clip.html).toContain('Murat abi, selamlar.');
    expect(clip.text).toBe(buildEmailText());

    // Konu kopyalanınca birincil düğme yerinden oynamaz (başarı mesajı yerleşimi itmez).
    await subjectButton(page).click();
    await expect(page.locator('.email-status').first()).toContainText('Konu kopyalandı');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL_SUBJECT);
    expect((await button.boundingBox())!.y).toBeCloseTo(before.y, 0);
  });

  test('Clipboard API yoksa copy olayıyla kopyalanır', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'not_run: pano içeriği yalnız Chromium’da okunabiliyor');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      // @ts-expect-error eski tarayıcı benzetimi
      delete window.ClipboardItem;
    });
    await page.goto(PATH);
    await hydrated(page);
    await primary(page).click();
    await expect(emailStatus(page)).toHaveText(new RegExp(`^${DONE_EMAIL}`));
    const clip = await page.evaluate(async () => {
      const [item] = await navigator.clipboard.read();
      return { html: await (await item.getType('text/html')).text(), text: await (await item.getType('text/plain')).text() };
    });
    expect(clip.html).toContain('<table');
    expect(clip.text).toBe(buildEmailText());
  });

  test('iki yol da başarısızsa hata görünür ve elle kopyalamayı anlatır', async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-expect-error eski tarayıcı benzetimi
      delete window.ClipboardItem;
      document.execCommand = () => false;
    });
    await page.goto(PATH);
    await hydrated(page);
    await primary(page).click();
    const status = emailStatus(page);
    await expect(status).toHaveAttribute('data-failed', '');
    await expect(status).toContainText(FAILED);
    await expect(status).toBeVisible();
    await expect(primary(page)).not.toHaveAttribute('data-done', '');
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`klavye (${scheme}): Tab ile birincil düğme; halka yok, alt çizgi zeminle ≥ 3:1; Enter kopyalar`, async ({ page, context, browserName }) => {
      if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(PATH);
      await hydrated(page);
      await subjectButton(page).focus();
      await page.keyboard.press(tab);
      const state = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const cs = getComputedStyle(el);
        return {
          primary: el.matches('.email-btn[data-primary]'),
          mode: document.documentElement.dataset.focusMode,
          ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
          underline: cs.textDecorationLine,
          line: cs.textDecorationColor,
          background: cs.backgroundColor,
        };
      });
      expect(state).toMatchObject({ primary: true, mode: 'keyboard', ring: false });
      expect(state.underline).toContain('underline');
      expect(contrast(state.line, state.background)).toBeGreaterThanOrEqual(3);

      await page.keyboard.press('Enter');
      if (browserName === 'chromium') await expect(emailStatus(page)).toHaveText(new RegExp(`^${DONE_EMAIL}`));
      // Firefox ve WebKit'te başsız pano izni yok: sonuç başarı ya da görünür hata olmalı, sessiz kalmamalı.
      else await expect(emailStatus(page)).toHaveText(new RegExp(`^(${DONE_EMAIL}|${FAILED})`));
    });
  }
});

/** Yerleşim ölçümleri: taşma, tablo sığması, en küçük metin boyutu ve ağırlığı, düğmeler. */
function audit(page: Page) {
  return page.evaluate(() => {
    const preview = document.querySelector('.email-preview') as HTMLElement;
    const table = preview.querySelector('table') as HTMLTableElement;
    const text = [...document.querySelectorAll('body *')]
      .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()))
      .filter((el) => el.getClientRects().length > 0 && !el.closest('.visually-hidden'))
      .filter((el) => getComputedStyle(el).visibility !== 'hidden');
    const buttons = [...document.querySelectorAll('.email-btn')];
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      tableFits: table.getBoundingClientRect().width <= preview.clientWidth + 0.5,
      small: text.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14).map((el) => el.tagName),
      light: text.filter((el) => Number(getComputedStyle(el).fontWeight) < 300).map((el) => el.tagName),
      buttons: buttons.map((b) => b.getBoundingClientRect().height),
      buttonsFit: buttons.every((b) => b.scrollWidth <= b.clientWidth + 1 && b.getBoundingClientRect().right <= window.innerWidth),
    };
  });
}
