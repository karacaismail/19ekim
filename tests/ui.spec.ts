import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  '',
  'hedefler/',
  'roller/pazarlamaci/',
  'roller/saha-uzmani/',
  'roller/organizator/',
  'roller/dijital-pazarlama/',
  'roller/asistan/',
  'roller/ekip-lideri/',
  'eylem-plani/',
  'is-akislari/',
  'egitim-programi/',
  'istihdam/',
  'buyume-modeli/',
  'calisma-duzeni/',
];

const WIDTHS = [320, 360, 375, 390, 768, 1280];
const APPROVED_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';

/** Yerleşim, okunabilirlik ve tablo kuralları; sayfa içinde değerlendirilir. */
async function audit(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const visible = (el: Element) => {
      const cs = getComputedStyle(el);
      return el.getClientRects().length > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const small = [...document.querySelectorAll('body *')]
      .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()))
      .filter((el) => visible(el) && !el.closest('.visually-hidden'))
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}: ${getComputedStyle(el).fontSize}`);
    const headerOverflow = [...document.querySelectorAll('.data-table th')]
      .filter((th) => th.scrollWidth > th.clientWidth + 1)
      .map((th) => th.textContent?.trim());
    const breaking = [...document.querySelectorAll('.data-table th, .data-table td')]
      .filter((c) => {
        const cs = getComputedStyle(c);
        return cs.wordBreak === 'break-all' || cs.overflowWrap === 'anywhere';
      })
      .map((c) => c.textContent?.trim());
    const regions = [...document.querySelectorAll('.table-scroll')].map((r) => ({
      role: r.getAttribute('role'),
      tabindex: r.getAttribute('tabindex'),
      label: document.getElementById(r.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() ?? '',
      hasTable: !!r.querySelector('table'),
    }));
    return { overflow: doc.scrollWidth - window.innerWidth, small, headerOverflow, breaking, regions };
  });
}

test.describe('yerleşim ve okunabilirlik', () => {
  for (const width of WIDTHS) {
    test(`${width} px: yatay taşma yok, metin ≥ 14 px, tablo başlıkları bölünmez`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await page.goto(path);
        const result = await audit(page);
        expect(result.overflow, `${path} sayfası yatay taşıyor`).toBeLessThanOrEqual(0);
        expect(result.small, `${path} 14 px altı metin`).toEqual([]);
        expect(result.headerOverflow, `${path} başlık hücresi taşıyor`).toEqual([]);
        expect(result.breaking, `${path} zorlayıcı kelime bölme`).toEqual([]);
        for (const region of result.regions) {
          expect(region, `${path} tablo bölgesi`).toMatchObject({ role: 'region', tabindex: '0', hasTable: true });
          expect(region.label.length, `${path} tablo bölgesi etiketi`).toBeGreaterThan(0);
        }
      }
    });
  }

  test('320 px: geniş tablo kendi kapsayıcısında klavyeyle kayar', async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'not_run: Playwright WebKit ok tuşlarıyla varsayılan kaydırmayı uygulamıyor (sayfa kaydırmada da aynı); gerçek Safari’de elle doğrulanmalı',
    );
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('eylem-plani/');
    const region = page.locator('.table-scroll').first();
    const widths = await region.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    expect(widths.scroll).toBeGreaterThan(widths.client);
    await region.focus();
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    expect((await audit(page)).overflow).toBeLessThanOrEqual(0);
  });
});

/** Odaklanmış öğenin göstergesini okur. */
async function focusState(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    return {
      label: `${el.tagName.toLowerCase()}.${el.className}`,
      mode: document.documentElement.dataset.focusMode,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      boxShadow: cs.boxShadow,
      decoLine: cs.textDecorationLine,
      decoThickness: cs.textDecorationThickness,
    };
  });
}

function isSingleEdgeShadow(shadow: string) {
  if (shadow === 'none') return true;
  // Yalnız iç (inset) tek kenar çubuğu: x ≠ 0, y = 0, bulanıklık = 0, yayılma = 0
  return shadow.split(/,(?![^(]*\))/).every((part) => {
    if (!/inset/.test(part)) return false;
    const nums = part.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
    const [x = 0, y = 0, blur = 0, spread = 0] = nums;
    return x !== 0 && y === 0 && blur === 0 && spread === 0;
  });
}

test.describe('odak', () => {
  test('işaretçi modunda başlar; yalnız Tab açar; çevre halkası yok; tek kenar gösterge var', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.goto('eylem-plani/');
    const mode = () => page.evaluate(() => document.documentElement.dataset.focusMode);
    expect(await mode()).toBe('pointer');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await page.keyboard.type('a');
    expect(await mode(), 'ok, Escape veya yazma modu açmamalı').toBe('pointer');

    await page.keyboard.press(tab);
    expect(await mode()).toBe('keyboard');
    for (let i = 0; i < 40; i++) {
      const state = await focusState(page);
      if (state?.label.includes('table-scroll')) {
        const frame = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const before = getComputedStyle(el.parentElement as HTMLElement, '::before');
          return { content: before.content, width: before.width, outline: getComputedStyle(el).outlineStyle };
        });
        expect(frame.outline, 'tablo bölgesinde halka').toBe('none');
        expect(frame.content, 'tablo bölgesinde düz odak çubuğu').not.toBe('none');
        expect(frame.width).toBe('3px');
      } else if (state) {
        const noRing = state.outlineStyle === 'none' || parseFloat(state.outlineWidth) === 0;
        expect(noRing, `${state.label}: çevre halkası`).toBe(true);
        expect(isSingleEdgeShadow(state.boxShadow), `${state.label}: çevresel gölge ${state.boxShadow}`).toBe(true);
        const underline = state.decoLine.includes('underline') && parseFloat(state.decoThickness) >= 3;
        const bar = state.boxShadow !== 'none';
        expect(underline || bar, `${state.label}: görünür odak göstergesi yok`).toBe(true);
      }
      await page.keyboard.press(tab);
    }

    await page.mouse.click(5, 400);
    expect(await mode(), 'pointerdown görsel modu kapatmalı').toBe('pointer');
  });

  test('fareyle tıklanan bağlantıda gösterge veya halka görünmez', async ({ page }) => {
    await page.goto('roller/pazarlamaci/');
    await page.locator('.toc-link').first().click();
    const state = await focusState(page);
    if (state) {
      expect(state.mode).toBe('pointer');
      expect(state.outlineStyle === 'none' || parseFloat(state.outlineWidth) === 0).toBe(true);
      expect(parseFloat(state.decoThickness) >= 3 && state.decoLine.includes('underline')).toBe(false);
    }
  });

  test('zorlanmış renk modunda halka yalnız klavye modunda', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced-colors emülasyonu yalnız Chromium’da');
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const keyboard = await focusState(page);
    expect(keyboard?.outlineStyle).toBe('solid');
    expect(keyboard?.outlineWidth).toBe('2px');
    await page.locator('.mainnav-link').nth(1).hover();
    await page.mouse.down();
    const pointer = await focusState(page);
    expect(pointer?.mode).toBe('pointer');
    expect(pointer?.outlineStyle === 'none' || parseFloat(pointer?.outlineWidth ?? '0') === 0).toBe(true);
    await page.mouse.up();
  });
});

test.describe('hareket', () => {
  test('tüm geçişler onaylı Cubic eğri ve pozitif süreyle; giriş ve çıkış temel öğede', async ({ page }) => {
    for (const path of ['', 'roller/organizator/', 'istihdam/']) {
      await page.goto(path);
      const offenders = await page.evaluate((approved) => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('*')) {
          const cs = getComputedStyle(el);
          const durations = cs.transitionDuration.split(',').map((d) => parseFloat(d));
          if (!durations.some((d) => d > 0)) continue;
          if (cs.transitionProperty.split(',').some((p) => p.trim() === 'all')) out.push(`${el.className}: all`);
          const easings = cs.transitionTimingFunction.split(/,(?![^(]*\))/).map((e) => e.trim());
          if (easings.some((e) => e !== approved)) out.push(`${el.className}: ${cs.transitionTimingFunction}`);
          if (durations.some((d) => d <= 0)) out.push(`${el.className}: süre ${cs.transitionDuration}`);
        }
        return out;
      }, APPROVED_EASING);
      expect(offenders, path).toEqual([]);
    }
    // Geçiş, üzerine gelinmeden önce de tanımlı olmalı (giriş + çıkış)
    const link = page.locator('.mainnav-link').nth(2);
    const before = await link.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(before)).toBeGreaterThan(0);
  });

  test('hareket azaltma tercihinde süreler sıfırlanır', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('');
    const durations = await page.evaluate(() =>
      [...document.querySelectorAll('.mainnav-link, .toc-link, .role-card, .text-link')].map(
        (el) => getComputedStyle(el).transitionDuration,
      ),
    );
    expect(durations.length).toBeGreaterThan(0);
    expect(durations.every((d) => d.split(',').every((x) => parseFloat(x) === 0))).toBe(true);
  });
});

test.describe('etkileşim alanı ve tema', () => {
  test('bağımsız kontroller en az 44 CSS px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('roller/asistan/');
    const heights = await page
      .locator('.mainnav-link, .toc-link, .role-switch-link, .brand')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(heights.length).toBeGreaterThan(10);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  });

  test('koyu tema işletim sistemi tercihini izler', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('');
    const scheme = await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'));
    expect(scheme).toBe('dark');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(18, 20, 22)');
  });
});

test.describe('dokunmatik cihaz', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } });
  test('kaba işaretçide kontroller en az 48 CSS px', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox mobil emülasyonu desteklemez');
    await page.goto('roller/organizator/');
    const coarse = await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches);
    test.skip(!coarse, 'Bu motor kaba işaretçi emüle etmiyor');
    const heights = await page
      .locator('.mainnav-link, .toc-link, .role-switch-link')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(48);
  });
});

test.describe('kenar sistemi (kavisli vurgu kenarı yasak)', () => {
  test('çizgi yalnız düz; yalnız çizginin değdiği köşeler radiussuz, diğer radiuslar korunur', async ({ page }) => {
    for (const path of ['', 'roller/saha-uzmani/', 'egitim-programi/', 'hedefler/', 'eylem-plani/']) {
      await page.goto(path);
      const result = await page.evaluate(() => {
        const bad: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>('[data-edge]')) {
          const cs = getComputedStyle(el);
          const edge = el.dataset.edge;
          const corners =
            edge === 'start'
              ? [cs.borderStartStartRadius, cs.borderEndStartRadius]
              : [cs.borderStartStartRadius, cs.borderStartEndRadius];
          if (corners.some((c) => parseFloat(c) !== 0)) bad.push(`${el.className}: köşe ${corners.join(' ')}`);
          if (getComputedStyle(el, '::after').content === 'none') bad.push(`${el.className}: çizgi yok`);
        }
        // Normal durumda hiçbir öğede iç gölge çubuğu yok (odak dışı)
        for (const el of document.querySelectorAll<HTMLElement>('body *')) {
          if (/inset/.test(getComputedStyle(el).boxShadow)) bad.push(`${el.className}: iç gölge`);
        }
        // Koşulluluk: çizgili kart öğelerinin karşı köşeleri yuvarlak kalır.
        for (const el of document.querySelectorAll<HTMLElement>('.week-day[data-edge], .slot-body[data-edge], .tree[data-edge]')) {
          if (!(parseFloat(getComputedStyle(el).borderEndEndRadius) > 0)) bad.push(`${el.className}: karşı köşe de radiussuz`);
        }
        const rounded = [...document.querySelectorAll<HTMLElement>('.chip, .role-card, .tree, .slot-body, .panel, .hire-item, .rung, .week-day, .table-scroll')]
          .filter((el) => parseFloat(getComputedStyle(el).borderEndEndRadius) > 0).length;
        return { bad, rounded, edges: document.querySelectorAll('[data-edge]').length };
      });
      expect(result.bad, path).toEqual([]);
      if (result.edges) expect(result.rounded, `${path}: diğer radiuslar korunmalı`).toBeGreaterThan(0);
    }
  });
});

test.describe('tema düğmesi', () => {
  test('açık/koyu geçişi anında, kalıcı ve aria-pressed ile', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('');
    const toggle = page.locator('[data-theme-toggle]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'))).toBe('dark');
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'))).toBe('dark');
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-theme-toggle]').click();
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'))).toBe('light');
    const box = await page.locator('[data-theme-toggle]').boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

test.describe('bağımsız bağlantılar ve grafikler', () => {
  test('cümle dışındaki bağlantılar en az 44 CSS px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    for (const path of ['', 'roller/organizator/', 'istihdam/']) {
      await page.goto(path);
      const heights = await page
        .locator('.text-link[data-standalone], .crumbs a, .pager-link, .branch-link, .tree-title')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
      expect(heights.length, path).toBeGreaterThan(0);
      expect(Math.min(...heights), path).toBeGreaterThanOrEqual(44);
    }
  });

  test('grafikler çizilir, metinleri en az 14 px ve hareket onaylı', async ({ page }) => {
    for (const path of ['hedefler/', 'istihdam/', 'buyume-modeli/']) {
      await page.goto(path);
      const canvases = page.locator('.chart-canvas');
      const count = await canvases.count();
      expect(count, path).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await canvases.nth(i).scrollIntoViewIfNeeded();
        await expect(canvases.nth(i).locator('svg')).toBeVisible({ timeout: 10_000 });
      }
      const sizes = await page.evaluate(() =>
        [...document.querySelectorAll('.chart-canvas svg text')].map((t) => parseFloat(getComputedStyle(t).fontSize)),
      );
      expect(sizes.length, path).toBeGreaterThan(0);
      expect(Math.min(...sizes), `${path} grafik metni`).toBeGreaterThanOrEqual(14);
    }
  });
});
