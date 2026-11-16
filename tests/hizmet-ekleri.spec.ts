import { expect, test, type Locator } from './fixtures/persona';
import { CANLI_GRUPLAR } from '../src/data/canliPaketler';
import { KATEGORILER } from '../src/data/degerOnerisi';
import { EKLENDI_HAPI, hizmetHaritasi } from '../src/data/hizmetler';

/**
 * Değer önerisinden eklenen hizmetler (kullanıcı isteği 16 Kasım 2026 Pazartesi). Değer önerisi sayfasındaki bazı sözler
 * Hizmetler sayfasında yoktu. Bu sözler hizmet haritasına yeni satır olarak eklendi. Canlı paket verisi bu hizmetleri
 * sunmuyor. Bu yüzden hepsi planlanan hizmettir. Her eklenen satır “16 Kasım’da eklendi” hapını taşır. Hapın büyük
 * noktası yanıp söner. Nokta süsleme amaçlıdır ve ekran okuyucuya okunmaz.
 */

const harita = hizmetHaritasi();
const eklenen = harita.filter((h) => h.eklendi)!;
const oneriNolari = new Set(KATEGORILER.flatMap((k) => k.oneriler.map((o) => o.no)));
const canliAdlar = CANLI_GRUPLAR.flatMap((g) => g.ozellikler.map((o) => o.ad.toLocaleLowerCase('tr')));

type NoktaStili = { content: string; name: string; duration: string; iteration: string; direction: string; easing: string; width: number };

const noktaStili = (hap: Locator): Promise<NoktaStili> =>
  hap.evaluate((el) => {
    const s = getComputedStyle(el, '::before');
    return {
      content: s.content,
      name: s.animationName,
      duration: s.animationDuration,
      iteration: s.animationIterationCount,
      direction: s.animationDirection,
      easing: s.animationTimingFunction,
      width: parseFloat(s.width),
    };
  });

/** Noktanın rengi ile hapın zemini arasındaki karşıtlık (WCAG göreli parlaklık). */
const karsitlik = (hap: Locator): Promise<number> =>
  hap.evaluate((el) => {
    const rgb = (v: string) => (v.match(/[\d.]+/g) ?? []).map(Number);
    const parlaklik = ([r, g, b]: number[]) => {
      const kanal = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
    };
    const a = parlaklik(rgb(getComputedStyle(el, '::before').backgroundColor));
    const b = parlaklik(rgb(getComputedStyle(el).backgroundColor));
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });

test('hizmet ekleri: veri değer önerisindeki gerçek sözlere bağlanır ve planlanan olarak kalır', () => {
  expect(EKLENDI_HAPI).toBe('16 Kasım’da eklendi');
  expect(eklenen.length).toBeGreaterThanOrEqual(7);
  const kullanilan: number[] = [];
  for (const h of eklenen) {
    // Canlı paket bu hizmetleri bugün sunmaz. Ücretsiz kısım yoktur ve hizmet bugün satılmaz.
    expect(h.ucretsiz, h.id).toBeNull();
    expect(h.sozden?.length, h.id).toBeGreaterThan(0);
    for (const s of h.sozden!) {
      if (s.oneri !== null) {
        expect(oneriNolari.has(s.oneri), `${h.id}: öneri ${s.oneri}`).toBe(true);
        kullanilan.push(s.oneri);
      }
      // Planlanan hizmetin adı canlı paket tablosundaki bir özellik adı olamaz.
      expect(canliAdlar).not.toContain(s.ad.toLocaleLowerCase('tr'));
      expect(`${s.ad} ${s.not}`).not.toMatch(/[;—]/);
    }
  }
  // Bir söz yalnız bir kez eklenir.
  expect(new Set(kullanilan).size).toBe(kullanilan.length);
  // Değer önerisinden eklenen sözler: liste kullanıcıya 16 Kasım 2026 Pazartesi günü gösterildi.
  for (const no of [3, 4, 5, 6, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38]) {
    expect(kullanilan, `öneri ${no}`).toContain(no);
  }
  // Eski satırlar hap taşımaz.
  expect(harita.filter((h) => !h.eklendi).every((h) => !h.sozden)).toBe(true);
});

for (const tema of ['light', 'dark'] as const) {
  test(`hizmet ekleri ${tema}: eklenen satır hap taşır, nokta büyük ve yanıp söner, sözler planlanan olarak görünür`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: tema });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('services/');
    await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
    await page.evaluate((t) => document.documentElement.setAttribute('data-mantine-color-scheme', t), tema);

    const haplar = page.locator('.pz-hizmet .yeni-hap');
    await expect(haplar).toHaveCount(eklenen.length);
    for (const h of eklenen) {
      const satir = page.locator(`#hizmet-${h.id}`);
      await expect(satir.locator('.yeni-hap')).toHaveText(EKLENDI_HAPI);
      // Sözler planlanan alanında durur. Her söz değer önerisindeki kartına bağlanır ve nötr “Planlanan” hapı taşır.
      const sozler = satir.locator('.pz-planlanan[data-kaynak="deger-onerisi"] li');
      await expect(sozler).toHaveCount(h.sozden!.length);
      await expect(sozler.locator('.chip.pz-cip')).toHaveText(h.sozden!.map(() => 'Planlanan'));
      const bag = await sozler.locator('a').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
      expect(bag).toEqual(h.sozden!.map((s) => (s.oneri === null ? '/19ekim/deger-onerisi/#en-guclu' : `/19ekim/deger-onerisi/#oneri-${s.oneri}`)));
      await expect(satir.locator('.pz-alan[data-ton="ucretsiz"]')).toHaveCount(0);
    }

    const hap = haplar.first();
    const stil = await hap.evaluate((el) => {
      const s = getComputedStyle(el);
      return { boyut: parseFloat(s.fontSize), kenar: s.borderTopWidth, radius: s.borderTopLeftRadius };
    });
    expect(stil.boyut).toBeGreaterThanOrEqual(14);
    // Hap kenarlıksızdır. Yuvarlak kutuda renkli vurgu kenarı yoktur.
    expect(stil.kenar).toBe('0px');

    const nokta = await noktaStili(hap);
    // Nokta boş içerikli sözde öğedir. Ekran okuyucu onu okumaz, yalnız hapın metnini okur.
    expect(nokta.content).toBe('""');
    // Nokta büyüktür. Menüdeki yeni öğe noktası 8 px’tir.
    expect(nokta.width).toBeGreaterThanOrEqual(10);
    expect(nokta.name).not.toBe('none');
    expect(nokta.iteration).toBe('infinite');
    expect(nokta.direction).toBe('alternate');
    expect(nokta.duration).toBe('1.4s');
    expect(nokta.easing).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
    expect(await karsitlik(hap)).toBeGreaterThanOrEqual(3);
    await expect(page.getByRole('img', { name: /eklendi/ })).toHaveCount(0);
  });
}

test('hizmet ekleri: hareket azaltma tercihinde nokta yanıp sönmez', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('services/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  const nokta = await noktaStili(page.locator('.pz-hizmet .yeni-hap').first());
  expect(nokta.name).toBe('none');
  expect(nokta.width).toBeGreaterThanOrEqual(10);
});

test('hizmet ekleri: sayfa eklenen hizmetlerin bugün olmadığını tarihle yazar', async ({ page }) => {
  await page.goto('services/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(page.locator('#hizmet-haritasi')).toContainText('16 Kasım 2026 Pazartesi');
  await expect(page.locator('#hizmet-haritasi')).toContainText('Bu hizmetler bugün yok.');
});
