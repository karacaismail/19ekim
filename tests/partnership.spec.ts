import { expect, test, type Page } from '@playwright/test';

/**
 * İş ortaklığı programı (/partnership/): iki program sekmesi, sekiz bölüm sekmesi; bir anda tek bölüm çizilir.
 * Her programın her bölümü 320, 390 ve 1280 px’te ayrı ayrı denetlenir (ui.spec.ts yalnız açılış bölümünü görür).
 */

const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });
const PROGRAMS = ['segika', 'istoc'] as const;
const SECTIONS = ['ozet', 'teshis', 'kime', 'program', 'kanal', 'olcum', 'takvim', 'risk'] as const;
const LABELS = ['Özet', 'Teşhis', 'Kime', 'Program', 'Kanal', 'Ölçüm', 'Takvim', 'Risk'];
/** Bölüm başlığı (ilk section-title) — bölüm değişimini doğrulamak için. */
const FIRST_TITLE: Record<(typeof SECTIONS)[number], string> = {
  ozet: 'Yönetici özeti',
  teshis: 'Doğrulanmış durum',
  kime: 'Müşteri segmentleri',
  program: 'Katmanlar ve ortak ekonomisi',
  kanal: 'Kanal seçimi: iç halka üç kanal',
  olcum: 'Yönetim tablosu',
  takvim: 'İlk 90 gün: beş aşama',
  risk: 'Riskler ve karşılıklar',
};

test.beforeEach(async ({ page }) => {
  await page.route('https://script.google.com/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
});

/** Bölüme git (adresle); panel başlığı gelene kadar bekle. */
async function bolum(page: Page, program: (typeof PROGRAMS)[number], section: (typeof SECTIONS)[number]) {
  await page.goto(`partnership/#${program}-${section}`);
  await icerik(page);
  await hydrated(page);
  await expect(page.locator('#ortak-bolum .section-title').first()).toHaveText(FIRST_TITLE[section]);
  await expect(page.getByRole('tablist', { name: 'Program' }).getByRole('tab', { name: new RegExp(`^${program === 'segika' ? 'Segika' : 'iStoc'}`) })).toHaveAttribute('aria-selected', 'true');
}

/** Grafikleri görünür alana getirip çizdirir; SVG metinlerinde kesilme, taşma ve çakışma arar (ui.spec.ts ile aynı ölçüt). */
async function grafikler(page: Page) {
  const canvases = page.locator('.chart-canvas');
  const count = await canvases.count();
  for (let i = 0; i < count; i++) {
    await canvases.nth(i).scrollIntoViewIfNeeded();
    await expect(canvases.nth(i).locator('svg')).toBeVisible({ timeout: 10_000 });
  }
  if (count) await page.waitForTimeout(500);
  const problems = await page.evaluate(() => {
    const out: string[] = [];
    for (const svg of document.querySelectorAll<SVGSVGElement>('.chart-canvas svg')) {
      const kind = (svg.closest('.chart-canvas') as HTMLElement).dataset.kind;
      const frame = svg.getBoundingClientRect();
      const boxes = [...svg.querySelectorAll('text')]
        .filter((t) => (t.textContent ?? '').trim() && getComputedStyle(t).opacity !== '0')
        .map((t) => ({ text: t.textContent ?? '', box: t.getBoundingClientRect(), size: parseFloat(getComputedStyle(t).fontSize) }));
      for (const { text, box, size } of boxes) {
        if (/\.\.\.|…/.test(text)) out.push(`${kind}: kesik "${text}"`);
        if (size < 14) out.push(`${kind}: küçük metin "${text}" ${size}px`);
        if (box.left < frame.left - 1 || box.right > frame.right + 1 || box.top < frame.top - 1 || box.bottom > frame.bottom + 1) out.push(`${kind}: SVG dışında "${text}"`);
      }
      for (let a = 0; a < boxes.length; a++) {
        for (let b = a + 1; b < boxes.length; b++) {
          const p = boxes[a].box;
          const q = boxes[b].box;
          const w = Math.min(p.right, q.right) - Math.max(p.left, q.left);
          const h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
          const smaller = Math.min(p.width * p.height, q.width * q.height);
          if (w > 0 && h > 0 && smaller > 0 && (w * h) / smaller > 0.3) out.push(`${kind}: "${boxes[a].text}" ↔ "${boxes[b].text}"`);
        }
      }
    }
    return out;
  });
  return { count, problems };
}

/** Yatay taşma, 14 px altı metin, 300 altı ağırlık, tablo başlığı taşması. */
async function duzen(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const cs = getComputedStyle(el);
      return el.getClientRects().length > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const textEls = [...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())).filter(visible);
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      small: textEls.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14).map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
      light: textEls.filter((el) => Number(getComputedStyle(el).fontWeight) < 300).map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
      headerOverflow: [...document.querySelectorAll('.data-table th')].filter((th) => th.scrollWidth > th.clientWidth + 1).map((th) => th.textContent?.trim()),
      hits: [...document.querySelectorAll<HTMLElement>('.ortak-sekme, .ortak-alt-sekme, .ortak-sira-dugme')].map((el) => el.getBoundingClientRect().height),
    };
  });
}

test.describe('iş ortaklığı programı', () => {
  test('menüde ve sunum sırasında; iki program, sekiz bölüm; sekmeler adresi değiştirir; geri tuşu çalışır', async ({ page }) => {
    await page.goto('partnership/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('İş ortaklığı programı');
    const programTabs = page.getByRole('tablist', { name: 'Program' }).getByRole('tab');
    await expect(programTabs).toHaveText([/^Segika/, /^iStoc/]);
    await expect(programTabs.first()).toHaveAttribute('aria-selected', 'true');
    const altTabs = page.getByRole('tablist', { name: 'Segika bölümleri' }).getByRole('tab');
    await expect(altTabs).toHaveText(LABELS.map((l, i) => `${i + 1}${l}`));
    await expect(page.locator('#ortak-bolum .section-title').first()).toHaveText(FIRST_TITLE.ozet);

    await altTabs.nth(5).click();
    await expect(page).toHaveURL(/#segika-olcum$/);
    await expect(page.locator('#ortak-bolum .section-title').first()).toHaveText(FIRST_TITLE.olcum);
    await expect(altTabs.nth(5)).toHaveAttribute('aria-selected', 'true');

    await programTabs.nth(1).click();
    await expect(page).toHaveURL(/#istoc-olcum$/);
    await expect(page.getByRole('tablist', { name: 'iStoc bölümleri' }).getByRole('tab').nth(5)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#ortak-bolum .section-title').first()).toHaveText(FIRST_TITLE.olcum);

    await page.goBack();
    await expect(page).toHaveURL(/#segika-olcum$/);
    await expect(programTabs.first()).toHaveAttribute('aria-selected', 'true');

    // Sıra: Risk’ten sonra diğer programın Özet’i.
    await page.goto('partnership/#segika-risk');
    await expect(page.locator('#ortak-bolum .section-title').first()).toHaveText(FIRST_TITLE.risk);
    await page.getByRole('navigation', { name: 'Bölüm sırası' }).getByRole('button', { name: /Sonraki/ }).click();
    await expect(page).toHaveURL(/#istoc-ozet$/);
    await expect(page.locator('#ortak-bolum')).toBeFocused();

    // Pazarlama menüsünde etkin.
    await page.getByRole('button', { name: 'Pazarlama' }).click();
    await expect(page.getByRole('menu', { name: 'Pazarlama' }).getByRole('menuitem', { name: 'İş ortaklığı' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    // Sunum sırası: Eylem planı → İş ortaklığı → Karar yetkisi.
    await expect(page.locator('.pager-link[rel="prev"] .pager-label')).toHaveText('Eylem planı');
    await expect(page.locator('.pager-link[rel="next"] .pager-label')).toHaveText('Karar yetkisi ve kontrol noktaları');
  });

  test('klavye: oklar program ve bölüm sekmelerini değiştirir; odakta çevreleyen halka yok', async ({ page, browserName }) => {
    await page.goto('partnership/');
    await icerik(page);
    await hydrated(page);
    const segika = page.getByRole('tab', { name: /^Segika/ });
    await segika.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: /^iStoc/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: /^iStoc/ })).toBeFocused();
    await expect(page).toHaveURL(/#istoc-ozet$/);
    const ozet = page.getByRole('tablist', { name: 'iStoc bölümleri' }).getByRole('tab').first();
    await ozet.focus();
    await page.keyboard.press('End');
    await expect(page).toHaveURL(/#istoc-risk$/);
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/#istoc-ozet$/);
    // Klavye modunda görünür odak tek kenar; halka yok.
    test.skip(browserName === 'webkit', 'not_run: WebKit’te Tab odak modu Alt+Tab ile; ui.spec.ts genel odak testini kapsar');
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { mode: document.documentElement.dataset.focusMode, outline: cs.outlineStyle, shadow: cs.boxShadow };
    });
    expect(state.mode).toBe('keyboard');
    expect(state.outline).toBe('none');
    expect(state.shadow === 'none' || /inset/.test(state.shadow)).toBe(true);
  });

  for (const width of [320, 390, 1280]) {
    test(`${width} px: her programın her bölümünde taşma yok, metin ≥ 14 px, hedefler ≥ 44 px, grafikler kesilmez`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 400 ? 480 : 800 });
      let charts = 0;
      for (const program of PROGRAMS) {
        for (const section of SECTIONS) {
          await bolum(page, program, section);
          const d = await duzen(page);
          expect(d.overflow, `${program}/${section} yatay taşma`).toBeLessThanOrEqual(0);
          expect(d.small, `${program}/${section} küçük metin`).toEqual([]);
          expect(d.light, `${program}/${section} ince yazı`).toEqual([]);
          expect(d.headerOverflow, `${program}/${section} başlık hücresi`).toEqual([]);
          expect(Math.min(...d.hits), `${program}/${section} dokunma hedefi`).toBeGreaterThanOrEqual(44);
          const g = await grafikler(page);
          charts += g.count;
          expect(g.problems, `${width}px ${program}/${section}`).toEqual([]);
        }
      }
      // Kime, Program, Ölçüm, Takvim ve Risk bölümlerinde grafik var: 2 program × (1 + 2 + 2 + 1 + 1).
      expect(charts).toBe(14);
    });
  }

  test('içerikte bağlantı, atıf ve kaynakça yok', async ({ page }) => {
    for (const program of PROGRAMS) {
      for (const section of SECTIONS) {
        await bolum(page, program, section);
        const text = await page.locator('#ortak-bolum').innerText();
        expect(text, `${program}/${section}`).not.toMatch(/https?:\/\/|www\.|Kaynakça|Kaynaklar/);
        expect(await page.locator('#ortak-bolum a').count(), `${program}/${section} bağlantı`).toBe(0);
      }
    }
  });
});
