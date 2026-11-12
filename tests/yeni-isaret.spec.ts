import { expect, test, type Locator, type Page } from './fixtures/persona';

// Yeni menü öğesi (kullanıcı isteği 2026-11-12): “Çalışma rehberleri” öğesinin noktası yeşil olur ve yanıp söner.
// Kullanıcı öğenin yeni olduğunu anlar. Ekran okuyucu noktayı “Yeni” diye okur. Diğer noktalar sade ve durgun kalır.

type NoktaStili = { name: string; duration: string; iteration: string; direction: string; easing: string; color: string; opacity: string };

const noktaStili = (nokta: Locator): Promise<NoktaStili> =>
  nokta.evaluate((el) => {
    const s = getComputedStyle(el, '::before');
    return {
      name: s.animationName,
      duration: s.animationDuration,
      iteration: s.animationIterationCount,
      direction: s.animationDirection,
      easing: s.animationTimingFunction,
      color: s.backgroundColor,
      opacity: s.opacity,
    };
  });

/** Noktanın rengi ile öğenin görünen zemini arasındaki karşıtlık (WCAG göreli parlaklık). */
const karsitlik = (nokta: Locator): Promise<number> =>
  nokta.evaluate((el) => {
    const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
    const parlaklik = ([r, g, b]: number[]) => {
      const kanal = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
    };
    let zemin: Element | null = el;
    let renk = 'rgba(0, 0, 0, 0)';
    while (zemin) {
      const bg = getComputedStyle(zemin).backgroundColor;
      const parca = rgb(bg);
      if (parca.length === 3 || (parca.length === 4 && parca[3] === 1)) {
        renk = bg;
        break;
      }
      zemin = zemin.parentElement;
    }
    const a = parlaklik(rgb(getComputedStyle(el, '::before').backgroundColor));
    const b = parlaklik(rgb(renk));
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });

const pazarlamaMenusu = async (page: Page) => {
  await page.getByRole('button', { name: 'Pazarlama', exact: true }).click();
  const menu = page.getByRole('menu', { name: 'Pazarlama' });
  await expect(menu).toBeVisible();
  return menu;
};

const yanipSoner = async (nokta: Locator) => {
  const stil = await noktaStili(nokta);
  expect(stil.name).not.toBe('none');
  expect(stil.iteration).toBe('infinite');
  expect(stil.direction).toBe('alternate');
  expect(stil.duration).toBe('1.4s');
  expect(stil.easing).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
  // Nokta gerçekten söner: saydamlık bir süre sonra belirgin biçimde azalır.
  await expect.poll(async () => Number((await noktaStili(nokta)).opacity), { timeout: 5_000 }).toBeLessThan(0.7);
};

test('yeni rehber öğesinin noktası yeşil yanıp söner ve ekran okuyucu “Yeni” der', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('');
  const menu = await pazarlamaMenusu(page);
  // Menü öğelerinin metni değişmez. “Yeni” bilgisi noktanın erişilebilir adıdır.
  await expect(menu.getByRole('menuitem')).toHaveText(['Temsilci ağı', 'Satış ortaklığı', 'Değer önerisi', 'Gelir modelleri', 'Oyunlaştırma', 'Yeni kayıtlar', 'Çalışma rehberleri']);
  await expect(menu.getByRole('img', { name: 'Yeni', exact: true })).toHaveCount(1);
  const yeni = menu.getByRole('menuitem', { name: /Çalışma rehberleri/ });
  await expect(yeni.getByRole('img', { name: 'Yeni', exact: true })).toHaveCount(1);
  const nokta = yeni.locator('.navmenu-bullet');
  await yanipSoner(nokta);
  expect(await karsitlik(nokta)).toBeGreaterThanOrEqual(3);

  const sade = menu.getByRole('menuitem', { name: 'Oyunlaştırma' }).locator('.navmenu-bullet');
  const sadeStil = await noktaStili(sade);
  expect(sadeStil.name).toBe('none');
  expect(sadeStil.color).not.toBe((await noktaStili(nokta)).color);
});

test('yeni nokta seçili öğede ve koyu temada da yeterli karşıtlıktadır', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('politikalar/');
    const menu = await pazarlamaMenusu(page);
    const yeni = menu.getByRole('menuitem', { name: /Çalışma rehberleri/ });
    await expect(yeni).toHaveAttribute('aria-current', 'page');
    expect(await karsitlik(yeni.locator('.navmenu-bullet')), `${colorScheme} tema`).toBeGreaterThanOrEqual(3);
    await page.keyboard.press('Escape');
  }
});

test('hareket azaltma tercihinde yeni nokta yanıp sönmez, yeşil ve “Yeni” kalır', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('');
  const menu = await pazarlamaMenusu(page);
  const yeni = menu.getByRole('menuitem', { name: /Çalışma rehberleri/ });
  await expect(yeni.getByRole('img', { name: 'Yeni', exact: true })).toHaveCount(1);
  const nokta = yeni.locator('.navmenu-bullet');
  const stil = await noktaStili(nokta);
  expect(stil.name).toBe('none');
  expect(Number(stil.opacity)).toBe(1);
  expect(await karsitlik(nokta)).toBeGreaterThanOrEqual(3);
});

test('dar ekran menüsünde de yeni nokta yanıp söner', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('');
  await page.getByRole('button', { name: 'Menü', exact: true }).click();
  const cekmece = page.getByRole('dialog', { name: 'Menü' });
  await expect(cekmece).toBeVisible();
  await expect(cekmece.getByRole('img', { name: 'Yeni', exact: true })).toHaveCount(1);
  const yeni = cekmece.getByRole('link', { name: /Çalışma rehberleri/ });
  await expect(yeni.getByRole('img', { name: 'Yeni', exact: true })).toHaveCount(1);
  const nokta = yeni.locator('.navmenu-bullet');
  await yanipSoner(nokta);
  expect(await karsitlik(nokta)).toBeGreaterThanOrEqual(3);
});
