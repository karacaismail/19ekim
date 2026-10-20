import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  '',
  'istihdam/',
  'hedefler/',
  'eylem-plani/',
  'karar-yetkisi/',
  'karar-bekleyenler/',
  'buyume-modeli/',
  'roller/dijital-pazarlama/',
  'roller/pazarlamaci/',
  'roller/saha-uzmani/',
  'roller/ekip-lideri/',
  'roller/organizator/',
  'roller/asistan/',
  'roller/segika/',
  'bcg/',
  'parametreler/',
  'notlar/',
  'giderler/',
  'arsiv/',
  'email/',
];

/** Grafikli sayfalar (ECharts yalnız bunlarda yüklenir). */
// Giderler grafikleri yalnız Sheets bağlantısıyla çizilir; ayrı testte (giderler.spec.ts) sahte yanıtla denetlenir.
const CHART_PAGES = PAGES.filter((p) => !['istihdam/', 'arsiv/', 'parametreler/', 'notlar/', 'giderler/', 'email/'].includes(p));

/** Giderler sayfası varsayılan Apps Script ucunu sorar; testler gerçek Google’a gitmez (anahtar istenir → form). */
test.beforeEach(async ({ page }) => {
  await page.route('https://script.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false, hata: 'yetki', mesaj: 'test' }) }),
  );
});

/** Astro adası hidrasyonu bitince etkileşim React’e ulaşır. */
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

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
    const light = [...document.querySelectorAll('body *')]
      .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()))
      .filter((el) => visible(el) && !el.closest('.visually-hidden'))
      .filter((el) => Number(getComputedStyle(el).fontWeight) < 300)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}: ${getComputedStyle(el).fontWeight}`);
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
      // Kaydırılan bölge ya bir tablo ya da geniş bir grafik taşır.
      hasContent: !!r.querySelector(r.classList.contains('chart-scroll') ? '.chart-canvas' : 'table'),
    }));
    return { overflow: doc.scrollWidth - window.innerWidth, small, light, headerOverflow, breaking, regions };
  });
}

test.describe('yerleşim ve okunabilirlik', () => {
  for (const width of WIDTHS) {
    test(`${width} px: yatay taşma yok, metin ≥ 14 px ve ağırlık ≥ 300, tablo başlıkları bölünmez`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await page.goto(path);
        const result = await audit(page);
        expect(result.overflow, `${path} sayfası yatay taşıyor`).toBeLessThanOrEqual(0);
        expect(result.small, `${path} 14 px altı metin`).toEqual([]);
        expect(result.light, `${path} 300 altı yazı ağırlığı`).toEqual([]);
        expect(result.headerOverflow, `${path} başlık hücresi taşıyor`).toEqual([]);
        expect(result.breaking, `${path} zorlayıcı kelime bölme`).toEqual([]);
        for (const region of result.regions) {
          expect(region, `${path} kaydırma bölgesi`).toMatchObject({ role: 'region', tabindex: '0', hasContent: true });
          expect(region.label.length, `${path} tablo bölgesi etiketi`).toBeGreaterThan(0);
        }
      }
    });
  }

  test('320 px: geniş tablo ve Gantt kendi kapsayıcısında klavyeyle kayar', async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'not_run: Playwright WebKit ok tuşlarıyla varsayılan kaydırmayı uygulamıyor (sayfa kaydırmada da aynı); gerçek Safari’de elle doğrulanmalı',
    );
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('eylem-plani/');
    for (const selector of ['.table-scroll:not(.chart-scroll)', '.chart-scroll']) {
      const region = page.locator(selector).first();
      const widths = await region.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
      expect(widths.scroll, selector).toBeGreaterThan(widths.client);
      await region.focus();
      for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
      await expect.poll(() => region.evaluate((el) => el.scrollLeft), { message: selector }).toBeGreaterThan(0);
    }
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

  test('fareyle tıklanan bölgede gösterge veya halka görünmez', async ({ page }) => {
    await page.goto('roller/pazarlamaci/');
    const region = page.locator('.table-scroll').first();
    await region.click();
    const state = await focusState(page);
    expect(state?.mode).toBe('pointer');
    expect(state?.outlineStyle === 'none' || parseFloat(state?.outlineWidth ?? '0') === 0).toBe(true);
    const bar = await region.evaluate((el) => getComputedStyle(el.parentElement as HTMLElement, '::before').content);
    expect(bar, 'işaretçi modunda odak çubuğu yok').toBe('none');
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
      [...document.querySelectorAll('.mainnav-link, .pager-link, .text-link')].map(
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
      .locator('.mainnav-link, .pager-link, .brand')
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
      .locator('.mainnav-link, .pager-link')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(48);
  });
});

test.describe('kenar sistemi (kavisli vurgu kenarı yasak)', () => {
  test('tüm sayfalarda çizgi yalnız düz; değdiği köşeler radiussuz, diğer radiuslar korunur', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      const result = await page.evaluate(() => {
        const bad: string[] = [];
        const name = (el: Element) => `${el.tagName.toLowerCase()}.${el.className}`;
        const px = (v: string) => parseFloat(v) || 0;
        const visibleColor = (c: string) => c !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(c);
        for (const el of document.querySelectorAll<HTMLElement>('[data-edge]')) {
          const cs = getComputedStyle(el);
          const corners =
            el.dataset.edge === 'start'
              ? [cs.borderStartStartRadius, cs.borderEndStartRadius]
              : [cs.borderStartStartRadius, cs.borderStartEndRadius];
          if (corners.some((c) => px(c) !== 0)) bad.push(`${name(el)}: köşe ${corners.join(' ')}`);
          if (getComputedStyle(el, '::after').content === 'none') bad.push(`${name(el)}: çizgi yok`);
          // Koşulluluk: kartta çizginin değmediği karşı köşe yuvarlak kalır.
          if (el.matches('.kpi') && px(cs.borderEndEndRadius) === 0) bad.push(`${name(el)}: karşı köşe de radiussuz`);
        }
        for (const el of document.querySelectorAll<HTMLElement>('body *')) {
          const cs = getComputedStyle(el);
          // Normal durumda iç gölge çubuğu yok (odak dışı).
          if (/inset/.test(cs.boxShadow)) bad.push(`${name(el)}: iç gölge`);
          const radii = {
            top: [cs.borderTopLeftRadius, cs.borderTopRightRadius],
            right: [cs.borderTopRightRadius, cs.borderBottomRightRadius],
            bottom: [cs.borderBottomLeftRadius, cs.borderBottomRightRadius],
            left: [cs.borderTopLeftRadius, cs.borderBottomLeftRadius],
          };
          const sides = (['top', 'right', 'bottom', 'left'] as const).filter((side) => {
            const w = px(cs.getPropertyValue(`border-${side}-width`));
            return w > 0 && cs.getPropertyValue(`border-${side}-style`) !== 'none' && visibleColor(cs.getPropertyValue(`border-${side}-color`));
          });
          // Tek veya birkaç kenarda görünür kenarlık varsa (tam çerçeve değilse) o kenarın köşeleri radiussuz olmalı.
          if (sides.length > 0 && sides.length < 4) {
            for (const side of sides) {
              if (radii[side].some((r) => px(r) > 0)) bad.push(`${name(el)}: yuvarlak köşede ${side} kenarlığı`);
            }
          }
          // Dört kenar çizili ama bir kenarın rengi/kalınlığı farklıysa (vurgu kenarı) o kenarın köşeleri de radiussuz olmalı.
          if (sides.length === 4) {
            const sig = (side: string) => `${cs.getPropertyValue(`border-${side}-width`)} ${cs.getPropertyValue(`border-${side}-color`)}`;
            const counts = new Map<string, number>();
            for (const side of sides) counts.set(sig(side), (counts.get(sig(side)) ?? 0) + 1);
            const common = [...counts].sort((a, b) => b[1] - a[1])[0][0];
            for (const side of sides) {
              if (sig(side) !== common && radii[side].some((r) => px(r) > 0)) bad.push(`${name(el)}: yuvarlak köşede farklı ${side} kenarı`);
            }
          }
          // Yuvarlak bir öğenin kenarı boyunca uzanan sözde öğe çubuğu (kenar sistemi dışında) yasak.
          const rounded = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].some((r) => px(r) > 0);
          if (rounded && !el.hasAttribute('data-edge')) {
            const box = el.getBoundingClientRect();
            for (const pseudo of ['::before', '::after']) {
              const ps = getComputedStyle(el, pseudo);
              if (ps.content === 'none' || ps.position !== 'absolute') continue;
              const w = px(ps.width);
              const h = px(ps.height);
              const bar = (w <= 6 && h >= box.height / 2) || (h <= 6 && w >= box.width / 2);
              if (bar && (visibleColor(ps.backgroundColor) || /gradient/.test(ps.backgroundImage))) bad.push(`${name(el)}${pseudo}: kenar çubuğu`);
            }
          }
        }
        const rounded = [...document.querySelectorAll<HTMLElement>('.chip, .kpi, .cal, .chart-canvas, .table-scroll, .note, .pager-link, .email-compose, .email-btn')]
          .filter((el) => parseFloat(getComputedStyle(el).borderEndEndRadius) > 0).length;
        return { bad, rounded };
      });
      expect(result.bad, path).toEqual([]);
      expect(result.rounded, `${path}: diğer radiuslar korunmalı`).toBeGreaterThan(0);
    }
  });
});

test.describe('tema düğmesi', () => {
  test('açık/koyu geçişi anında, kalıcı ve aria-pressed ile', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('');
    await hydrated(page);
    const toggle = page.locator('[data-theme-toggle]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'))).toBe('dark');
    await page.reload();
    await hydrated(page);
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
    for (const path of ['', 'roller/ekip-lideri/', 'istihdam/', 'buyume-modeli/']) {
      await page.goto(path);
      const heights = await page
        .locator('.text-link[data-standalone], .crumbs a, .pager-link')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
      expect(heights.length, path).toBeGreaterThan(0);
      expect(Math.min(...heights), path).toBeGreaterThanOrEqual(44);
    }
  });

  test('takvim ve zaman çizelgesi: Mantine bileşenleri, metin en az 14 px', async ({ page }) => {
    await page.goto('istihdam/');
    await expect(page.locator('.hire-timeline .hire-item')).toHaveCount(8);
    await expect(page.locator('.cal')).toHaveCount(4);
    expect(await page.locator('.cal-day[data-event]').count()).toBe(11);
    const sizes = await page
      .locator('.cal-day, .cal-weekday, .hire-title, .hire-body')
      .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
    // Grafik sayfası değil: ECharts indirilmez.
    const echarts = await page.evaluate(() => performance.getEntriesByType('resource').some((e) => /echarts|charts\./.test(e.name)));
    expect(echarts).toBe(false);
  });

  test('grafikler çizilir, metinleri en az 14 px, Türkçe özet korunur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const path of CHART_PAGES) {
      await page.goto(path);
      const canvases = page.locator('.chart-canvas');
      const count = await canvases.count();
      expect(count, path).toBeGreaterThan(0);
      const summaries = await canvases.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
      for (let i = 0; i < count; i++) {
        await canvases.nth(i).scrollIntoViewIfNeeded();
        await expect(canvases.nth(i).locator('svg')).toBeVisible({ timeout: 10_000 });
      }
      const after = await canvases.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
      expect(after, `${path}: ekran okuyucu özeti değişmemeli`).toEqual(summaries);
      const sizes = await page.evaluate(() =>
        [...document.querySelectorAll('.chart-canvas svg text')].map((t) => parseFloat(getComputedStyle(t).fontSize)),
      );
      expect(sizes.length, path).toBeGreaterThan(0);
      expect(Math.min(...sizes), `${path} grafik metni`).toBeGreaterThanOrEqual(14);
    }
    expect(errors).toEqual([]);
  });

  for (const width of [320, 390]) {
    test(`${width} px: grafik metinleri kesilmez, SVG dışına taşmaz, birbirine binmez`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of CHART_PAGES) {
        await page.goto(path);
        const canvases = page.locator('.chart-canvas');
        for (let i = 0; i < (await canvases.count()); i++) {
          await canvases.nth(i).scrollIntoViewIfNeeded();
          await expect(canvases.nth(i).locator('svg'), `${path} grafik ${i}`).toBeVisible({ timeout: 10_000 });
        }
        // Giriş hareketi bitsin (token süresi 240 ms).
        await page.waitForTimeout(500);
        const problems = await page.evaluate(() => {
          const out: string[] = [];
          for (const svg of document.querySelectorAll<SVGSVGElement>('.chart-canvas svg')) {
            const kind = (svg.closest('.chart-canvas') as HTMLElement).dataset.kind;
            const frame = svg.getBoundingClientRect();
            const boxes = [...svg.querySelectorAll('text')]
              .filter((t) => (t.textContent ?? '').trim() && getComputedStyle(t).opacity !== '0')
              .map((t) => ({ text: t.textContent ?? '', box: t.getBoundingClientRect() }));
            for (const { text, box } of boxes) {
              if (/\.\.\.|…/.test(text)) out.push(`${kind}: kesik "${text}"`);
              if (box.left < frame.left - 1 || box.right > frame.right + 1 || box.top < frame.top - 1 || box.bottom > frame.bottom + 1) {
                out.push(`${kind}: SVG dışında "${text}"`);
              }
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
        expect(problems, `${width}px ${path}`).toEqual([]);
      }
    });
  }

  /** Çizilen grafiklerin ECharts modelini okur (aynı modül örneği, ek global yok). */
  async function chartMotion(page: Page) {
    return page.evaluate(async () => {
      const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('echarts-setup'));
      if (!url) return [];
      const { echarts } = await import(url);
      const out: { kind: string; values: (string | number | boolean)[][] }[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('.chart-canvas .chart-host')) {
        const inst = echarts.getInstanceByDom(el);
        if (!inst) continue;
        const option = inst.getOption();
        const model = inst.getModel();
        const values: (string | number | boolean)[][] = [];
        model.eachSeries((s: { get: (k: string) => string | number | boolean }) =>
          values.push(['seri', s.get('animation'), s.get('animationEasing'), s.get('animationDuration'), s.get('animationEasingUpdate'), s.get('animationDurationUpdate')]),
        );
        for (const s of option.series) {
          if (s.markLine) values.push(['işaret', s.markLine.animation, s.markLine.animationEasing, s.markLine.animationDuration, s.markLine.animationEasingUpdate, s.markLine.animationDurationUpdate]);
        }
        const state = option.stateAnimation;
        values.push(['durum', !!state.duration, state.easing, state.duration, state.easing, state.duration]);
        const pointer = option.tooltip?.[0]?.axisPointer;
        if (pointer) values.push(['işaretçi', pointer.animation, pointer.animationEasingUpdate, pointer.animationDurationUpdate, pointer.animationEasingUpdate, pointer.animationDurationUpdate]);
        out.push({ kind: (el.parentElement as HTMLElement).dataset.kind ?? '', values });
      }
      return out;
    });
  }

  test('grafik hareketi: seri, işaret çizgisi, durum ve işaretçi simetrik cubicInOut, 120–320 ms', async ({ page }) => {
    for (const path of ['hedefler/', 'karar-yetkisi/', 'roller/organizator/', 'buyume-modeli/']) {
      await page.goto(path);
      const canvases = page.locator('.chart-canvas');
      for (let i = 0; i < (await canvases.count()); i++) {
        await canvases.nth(i).scrollIntoViewIfNeeded();
        await expect(canvases.nth(i).locator('svg')).toBeVisible({ timeout: 10_000 });
      }
      const charts = await chartMotion(page);
      expect(charts.length, path).toBeGreaterThan(0);
      for (const chart of charts) {
        for (const [part, on, easing, duration, easingUpdate, durationUpdate] of chart.values) {
          const label = `${path} ${chart.kind} ${part}`;
          expect(on, label).toBe(true);
          expect([easing, easingUpdate], label).toEqual(['cubicInOut', 'cubicInOut']);
          for (const d of [duration, durationUpdate]) {
            expect(d as number, label).toBeGreaterThanOrEqual(120);
            expect(d as number, label).toBeLessThanOrEqual(320);
          }
        }
      }
    }
  });

  test('grafik hareketi: hareket azaltma tercihinde kapalı', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('hedefler/');
    await page.locator('.chart-canvas').first().scrollIntoViewIfNeeded();
    await expect(page.locator('.chart-canvas svg').first()).toBeVisible({ timeout: 10_000 });
    const charts = await chartMotion(page);
    expect(charts.length).toBeGreaterThan(0);
    for (const chart of charts) {
      for (const [part, on, , duration] of chart.values) expect([on, duration], `${chart.kind} ${part}`).toEqual([false, 0]);
    }
  });
});

test.describe('parametreler', () => {
  test('değişiklik tarayıcıya kaydedilir, tüm sayfalara yansır ve varsayılana dönülür', async ({ page }) => {
    await page.goto('parametreler/');
    await hydrated(page);
    const salary = page.getByLabel('Saha satış maaşı');
    await salary.fill('70000');
    await expect(salary).toHaveValue(/70\.000/);
    await salary.blur();
    await expect(page.locator('.param-status')).toContainText('1 değer varsayılandan farklı');
    await expect(page.locator('.params-notice')).toBeVisible();

    await page.goto('karar-bekleyenler/');
    await hydrated(page);
    await expect(page.getByText('70.000 ₺ maaş / ay').first()).toBeVisible();
    await expect(page.getByText('Kota: ay içinde 140.000 ₺ satış', { exact: false }).first()).toBeVisible();
    await expect(page.locator('.params-notice')).toBeVisible();

    await page.goto('roller/saha-uzmani/');
    await hydrated(page);
    await expect(page.locator('.facts-row')).toContainText('70.000 ₺ maaş');

    await page.goto('parametreler/');
    await hydrated(page);
    const reset = page.locator('.param-reset');
    await reset.click();
    await expect(reset).toHaveText('Emin misiniz? Tekrar basın');
    await reset.click();
    await expect(page.locator('.param-status')).toContainText('Tüm değerler varsayılan');
    await page.goto('karar-bekleyenler/');
    await hydrated(page);
    await expect(page.getByText('60.000 ₺ maaş / ay').first()).toBeVisible();
    await expect(page.locator('.params-notice')).toHaveCount(0);
  });

  test('tarih parametresi takvimi ve kontrol tarihlerini kaydırır', async ({ page }) => {
    await page.goto('parametreler/');
    await hydrated(page);
    await page.evaluate(() => localStorage.setItem('istoc-plan-parametreler', JSON.stringify({ startDate: '2026-11-15' })));
    await page.goto('karar-yetkisi/');
    await hydrated(page);
    await expect(page.locator('.data-table').first()).toContainText('13 Ocak');
    await page.evaluate(() => localStorage.removeItem('istoc-plan-parametreler'));
  });

  test('klavye odağı: alan etiketi altı çizili; çevreleyen halka yok', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.goto('parametreler/');
    await hydrated(page);
    await page.getByLabel('Program başlangıcı').focus();
    await page.keyboard.press(tab);
    const state = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const label = el.closest('.param-field')?.querySelector('.param-label') as HTMLElement | null;
      const cs = getComputedStyle(el);
      return {
        mode: document.documentElement.dataset.focusMode,
        outline: cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0,
        shadow: cs.boxShadow,
        border: [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor],
        underline: label ? getComputedStyle(label).textDecorationLine : '',
        thickness: label ? parseFloat(getComputedStyle(label).textDecorationThickness) : 0,
      };
    });
    expect(state.mode).toBe('keyboard');
    expect(state.outline).toBe(true);
    expect(state.shadow).toBe('none');
    expect(new Set(state.border).size, 'odakta kenarlık rengi değişmez, tek renk').toBe(1);
    expect(state.underline).toContain('underline');
    expect(state.thickness).toBeGreaterThanOrEqual(3);
  });
});

test.describe('BCG eğitimi', () => {
  test('dört kutu matrisi, nakit döngüsü ve örnek balon matrisi Türkçe; matris yerleşimi klasik', async ({ page }) => {
    await page.goto('bcg/');
    const cells = page.locator('.bcg-cell');
    await expect(cells).toHaveCount(4);
    expect(await cells.locator('.bcg-name').allTextContents()).toEqual(['Yıldız', 'Soru işareti', 'Nakit ineği', 'Köpek']);
    // Klasik yerleşim: Yıldız sol üst, Köpek sağ alt.
    const box = async (i: number) => (await cells.nth(i).boundingBox())!;
    const [star, question, cow, dog] = [await box(0), await box(1), await box(2), await box(3)];
    expect(star.x).toBeLessThan(question.x);
    expect(star.y).toBeLessThan(cow.y);
    expect(dog.x).toBeGreaterThan(cow.x);
    await expect(page.locator('.bcg-flow')).toHaveCount(4);

    const example = page.locator('.chart-canvas[data-kind="bcg-num"]');
    await example.scrollIntoViewIfNeeded();
    await expect(example.locator('svg')).toBeVisible({ timeout: 10_000 });
    const texts = (await example.locator('svg text').allTextContents()).join(' | ');
    for (const label of ['Akıllı saat', 'Kahve makinesi', 'Elektrikli scooter', 'Akıllı termostat', 'DVD oynatıcı', 'Pazar büyümesi', 'Göreli pazar payı', '1×']) {
      expect(texts, label).toContain(label);
    }
    expect(texts).not.toContain('0,05');
  });

  test('alıştırma cevabı açılır; klavye odağında halka yok, alt çizgi var', async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'not_run: Playwright WebKit Tab/Alt+Tab ile <summary> öğesine odaklanmıyor (Safari varsayılanı); gerçek Safari’de elle doğrulanmalı',
    );
    const tab = 'Tab';
    await page.goto('bcg/');
    const first = page.locator('.quiz-item').first();
    await first.locator('summary').click();
    await expect(first.locator('.quiz-answer')).toBeVisible();
    // WebKit tıklamada özete odak vermez; odak doğrudan verilir, sonra klavyeyle ileri-geri gidilir.
    await first.locator('summary').focus();
    await page.keyboard.press(tab);
    await page.keyboard.press(`Shift+${tab}`);
    const state = await first.locator('summary').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        focused: document.activeElement === el,
        mode: document.documentElement.dataset.focusMode,
        ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
        underline: cs.textDecorationLine,
      };
    });
    expect(state.focused).toBe(true);
    expect(state.mode).toBe('keyboard');
    expect(state.ring).toBe(false);
    expect(state.underline).toContain('underline');
  });
});

test.describe('notlar', () => {
  test('not eklenir, işaretlenir, düzenlenir, silinir ve tarayıcıda saklanır', async ({ page }) => {
    await page.goto('notlar/');
    await hydrated(page);
    await page.evaluate(() => localStorage.removeItem('istoc-plan-notlar'));
    await page.reload();
    await hydrated(page);
    await expect(page.locator('.note-row')).toHaveCount(10);

    // Liste seç ve not ekle (Enter ile)
    await page.getByRole('button', { name: /^Partner ağı/ }).click();
    await expect(page.locator('.note-row')).toHaveCount(5);
    const input = page.getByLabel(/Yeni not/);
    await input.fill('Sertifika ölçütlerini yaz');
    await input.press('Enter');
    await expect(page.locator('.note-row').first()).toContainText('Sertifika ölçütlerini yaz');

    // İşaretle: tamamlananlara geçer
    // İşaretlenen not tamamlananlara taşınır (kapalı bölüm); bu yüzden tıklanır, sonuç sayıdan okunur.
    await page.getByRole('checkbox', { name: 'Sertifika ölçütlerini yaz' }).click();
    await expect(page.locator('.note-done summary')).toContainText('Tamamlanan (1)');

    // Kalıcı
    await page.reload();
    await hydrated(page);
    await page.locator('.note-done summary').click();
    await expect(page.getByRole('checkbox', { name: 'Sertifika ölçütlerini yaz' })).toBeChecked();

    // Düzenle
    const row = page.locator('.note-row', { hasText: 'Prim sistemi eklemeli' });
    await row.getByRole('button', { name: /Düzenle/ }).click();
    const edit = page.getByLabel('Notu düzenle');
    await edit.fill('Prim sistemi: kurallar');
    await edit.press('Enter');
    await expect(page.locator('.note-row', { hasText: 'Prim sistemi: kurallar' })).toHaveCount(1);

    // Sil (iki adım)
    const target = page.locator('.note-row', { hasText: 'Prim sistemi: kurallar' });
    await target.getByRole('button', { name: 'Sil' }).click();
    await target.getByRole('button', { name: 'Silinsin mi?' }).click();
    await expect(page.locator('.note-row', { hasText: 'Prim sistemi: kurallar' })).toHaveCount(0);

    // Varsayılana dön
    const reset = page.getByRole('button', { name: 'Varsayılan notlara dön' });
    await reset.click();
    await page.getByRole('button', { name: 'Emin misiniz? Tekrar basın' }).click();
    await expect(page.locator('.note-row', { hasText: 'Prim sistemi eklemeli' })).toHaveCount(1);
    expect(await page.evaluate(() => localStorage.getItem('istoc-plan-notlar'))).toBeNull();
  });

  test('klavye: not kutusu odakta metnin altı çizili; çevreleyen halka yok', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.goto('notlar/');
    await hydrated(page);
    await page.locator('.note-check-input').first().focus();
    await page.keyboard.press(tab);
    await page.keyboard.press(`Shift+${tab}`);
    const state = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const row = el.closest('.note-row');
      const text = row?.querySelector('.note-text') as HTMLElement | null;
      const cs = getComputedStyle(el);
      return {
        isCheck: el.classList.contains('note-check-input'),
        ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
        underline: text ? getComputedStyle(text).textDecorationLine : '',
      };
    });
    expect(state.isCheck).toBe(true);
    expect(state.ring).toBe(false);
    expect(state.underline).toContain('underline');
  });
});
