import { expect, test, type Page } from '@playwright/test';
import { PARAM_GROUPS } from '../src/data/params';

const PAGES = [
  '',
  'istihdam/',
  'hedefler/',
  'gelir-plani/',
  'eylem-plani/',
  'karar-yetkisi/',
  'karar-bekleyenler/',
  'buyume-modeli/',
  'partnership/',
  'roller/dijital-pazarlama/',
  'roller/pazarlamaci/',
  'roller/saha-uzmani/',
  'roller/ekip-lideri/',
  'roller/organizator/',
  'roller/asistan/',
  'roller/segika/',
  'bcg/',
  'applet/',
  'parametreler/',
  'notlar/',
  'giderler/',
  'nakit-akisi/',
  'arsiv/',
  'email/',
];

/** Grafikli sayfalar (ECharts yalnız bunlarda yüklenir). */
// Giderler grafikleri yalnız Sheets bağlantısıyla çizilir; ayrı testte (giderler.spec.ts) sahte yanıtla denetlenir.
// İş ortaklığı sayfasının grafikleri sekmelerde (bir anda tek bölüm çizilir); her sekme ayrı testte (partnership.spec.ts) denetlenir.
const CHART_PAGES = PAGES.filter((p) => !['istihdam/', 'arsiv/', 'parametreler/', 'notlar/', 'giderler/', 'nakit-akisi/', 'email/', 'applet/', 'partnership/'].includes(p));

/** Giderler sayfası varsayılan Apps Script ucunu sorar; testler gerçek Google’a gitmez (anahtar istenir → form). */
test.beforeEach(async ({ page }) => {
  await page.route('https://script.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false, hata: 'yetki', mesaj: 'test' }) }),
  );
});

/** Astro adası hidrasyonu bitince etkileşim React’e ulaşır. */
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });
/** Giriş kapısı: içerik hidrasyondan sonra çizilir (statik HTML'de yalnız form); alt bilgi içerikle birlikte gelir. */
const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });

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
    // ux.md §8 (UX-01): dar ekranda olağan iş tablosu yatay kaydırmaz; kayıt listesine (RecordAccordion) dönüşür.
    // Giderler kalemler tablosu P4 ile kayıt listesi oldu; dışlanmaz (veri bağlıyken giderler.spec.ts ayrıca denetler).
    // Geniş grafikler (.chart-scroll) yalnız ≥ 48em’de kendi kutusunda kayabilir (tablet); dar ekranda P5 ile
    // (ux.md §8.1, M20/M21) eşdeğer liste çizilir, bu yüzden .chart-scroll sayısı ayrıca döndürülür.
    const tableOverflow = [...document.querySelectorAll<HTMLElement>('.table-scroll:not(.chart-scroll)')]
      .filter((r) => r.scrollWidth > r.clientWidth + 1)
      .map((r) => document.getElementById(r.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() ?? r.getAttribute('aria-label') ?? '?');
    const chartScroll = document.querySelectorAll('.chart-scroll').length;
    // ux_v2.md §3.2 / §5.2 (MUST): kayıt başlığı (h4 > button) içinde girdi, seçim, onay, düğme ya da bağlantı bulunmaz;
    // düzenleyici alanlar yalnız açılan paneldedir (başlıkta düzenleyici = özet ile editörün karışması).
    const basliktaGirdi = document.querySelectorAll('.kayit h4 button :is(input, select, textarea, button, a[href], [role="switch"], [role="checkbox"], [role="combobox"])').length;
    // Kayıt görünümü sözleşmesi (ux.md §8.2, M09): başlık h4 içinde düğme (aria-expanded, aria-controls → panel),
    // alanlar dl/dt/dd ile etiketli, hedef alanı en az 44 CSS px.
    const records = [...document.querySelectorAll<HTMLElement>('.kayit')].map((k) => {
      const btn = k.querySelector<HTMLButtonElement>('h4 button');
      const controls = btn?.getAttribute('aria-controls') ?? '';
      return {
        button: !!btn,
        expanded: btn?.getAttribute('aria-expanded') ?? null,
        panel: !!(controls && document.getElementById(controls)),
        dt: k.querySelectorAll('dl.kayit-alanlar dt').length,
        dd: k.querySelectorAll('dl.kayit-alanlar dd').length,
        hit: btn ? btn.getBoundingClientRect().height : 0,
      };
    });
    return { overflow: doc.scrollWidth - window.innerWidth, small, light, headerOverflow, breaking, regions, tableOverflow, chartScroll, records, basliktaGirdi };
  });
}

test.describe('yerleşim ve okunabilirlik', () => {
  for (const width of WIDTHS) {
    test(`${width} px: yatay taşma yok, metin ≥ 14 px ve ağırlık ≥ 300, tablo başlıkları bölünmez`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await page.goto(path);
        await icerik(page);
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
        // Dar ekranda (< 48em) olağan tablo yatay kaydırmaz (ux.md §8, UX-01); kayıt görünümü sözleşmeye uyar.
        if (width < 768) expect(result.tableOverflow, `${path} dar ekranda tablo yatay kayıyor`).toEqual([]);
        // P5 (ux.md §8.1, UX-29/30): dar ekranda geniş grafik de kaymaz; yerinde ajanda / hiyerarşi / değer listesi vardır.
        if (width < 768) expect(result.chartScroll, `${path} dar ekranda grafik kaydırma bölgesi (.chart-scroll)`).toBe(0);
        expect(result.basliktaGirdi, `${path} kayıt başlığında düzenleyici (ux_v2 §3.2)`).toBe(0);
        for (const record of result.records) {
          expect(record, `${path} kayıt başlığı`).toMatchObject({ button: true, panel: true });
          expect(['true', 'false'], `${path} kayıt aria-expanded`).toContain(record.expanded);
          expect(record.dt, `${path} kayıt alanları`).toBeGreaterThan(0);
          expect(record.dd, `${path} kayıt alan değerleri`).toBe(record.dt);
          expect(record.hit, `${path} kayıt başlığı hedef alanı`).toBeGreaterThanOrEqual(44);
        }
      }
    });
  }

  // Kullanıcı kararı 2026-10-27 (docs/ux.md §1.3, §8.1): eski “tablo dar ekranda kendi içinde kayar” kabulü kalktı.
  // P5 (ux.md §8.1 “Gantt → tarihli ajanda”, §8.7) ile geniş Gantt’ın Y-01 istisnası da dar ekranda kapandı: 320 px’te
  // sayfada hiçbir yatay kaydırma bölgesi yoktur. Eski “geniş Gantt tek kayıtlı istisna olarak klavyeyle kayar” kabulü bu
  // gerekçeyle yeniden yazıldı; ECharts Gantt’ının kendi kutusunda klavyeyle kayması ≥ 48em’de (768 px testi) denetlenir.
  test('320 px: tablo kayıt listesine, Gantt tarihli ajandaya dönüşür; sayfada yatay kaydırma bölgesi yok', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('eylem-plani/');
    await icerik(page);
    await expect(page.locator('.table-scroll')).toHaveCount(0);
    await expect(page.locator('.chart-scroll')).toHaveCount(0);
    await expect(page.locator('.ajanda .ajanda-madde').first()).toBeVisible();
    await expect(page.locator('.table-block .kayitlar').first().locator('.kayit').first()).toBeVisible();
    const sonuc = await audit(page);
    expect(sonuc.tableOverflow).toEqual([]);
    expect(sonuc.chartScroll).toBe(0);
    expect(sonuc.overflow).toBeLessThanOrEqual(0);
  });
});

/** Tablo gövdesini kayıt/alan listesine çevirir: satır başlığı kayıt adı, diğer sütunlar [başlık, değer] çiftleri. */
async function tabloKayitlari(blok: ReturnType<Page['locator']>) {
  return blok.evaluate((el) => {
    const t = (n: Element | null | undefined) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const headers = [...el.querySelectorAll('thead th')].map(t);
    return [...el.querySelectorAll('tbody tr')].map((tr) => {
      const cells = [...tr.children];
      const rhi = Math.max(0, cells.findIndex((c) => c.tagName === 'TH'));
      return { title: t(cells[rhi]), fields: headers.map((h, i) => [h, t(cells[i])] as [string, string]).filter((_, i) => i !== rhi) };
    });
  });
}

/** Kayıt listesini okur: başlıktaki özet alanı ilk alan, ardından açık/kapalı panelin dl çiftleri. */
async function kayitListesi(blok: ReturnType<Page['locator']>) {
  return blok.evaluate((el) => {
    const t = (n: Element | null | undefined) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
    return [...el.querySelectorAll('.kayit')].map((k) => {
      const ozet = k.querySelector('.kayit-ozet');
      const fields: [string, string][] = ozet ? [[t(ozet.querySelector('.kayit-ozet-etiket')), t(ozet.querySelector('.kayit-ozet-deger'))]] : [];
      for (const div of k.querySelectorAll('dl.kayit-alanlar > div')) fields.push([t(div.querySelector('dt')), t(div.querySelector('dd'))]);
      return { title: t(k.querySelector('.kayit-ad')), fields };
    });
  });
}

test.describe('uyarlanır veri görünümü (ux.md §8, M08/M09)', () => {
  test('320 px eylem planı: kayıt başlığı h4 içinde düğme; Enter/Space açar kapatır; kapalı panele Tab gitmez; alanlar dl ile etiketli (UX-01, UX-07)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('eylem-plani/');
    await icerik(page);
    await hydrated(page);
    const kayit = page.locator('.table-block').first().locator('.kayit').first();
    const dugme = kayit.locator('h4 button');
    await expect(dugme).toHaveAttribute('aria-expanded', 'false');
    const panelId = await dugme.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    const panel = page.locator(`#${panelId}`);
    await expect(panel).toBeHidden();
    await dugme.focus();
    await page.keyboard.press('Enter');
    await expect(dugme).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('role', 'region');
    const dts = panel.locator('dl.kayit-alanlar dt');
    expect(await dts.count()).toBeGreaterThan(0);
    for (const etiket of await dts.allTextContents()) expect(etiket.trim().length).toBeGreaterThan(0);
    expect(await panel.locator('dl.kayit-alanlar dd').count()).toBe(await dts.count());
    await page.keyboard.press('Space');
    await expect(dugme).toHaveAttribute('aria-expanded', 'false');
    await expect(dugme).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate((id) => !!document.activeElement?.closest(`#${id}`), panelId)).toBe(false);
    expect((await dugme.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    // Klavye modunda görünür, çevrelemeyen odak göstergesi; halka yok.
    await dugme.focus();
    const odak = await dugme.evaluate((el) => ({ outline: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth, deco: getComputedStyle(el).textDecorationLine }));
    expect(odak.outline === 'none' || parseFloat(odak.width) === 0).toBe(true);
  });

  test('bilgi eşdeğerliği: 1280 px tablo ile 320 px kayıt listesi aynı alan adlarını, değerleri ve sırayı taşır (UX-02)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('eylem-plani/');
    await icerik(page);
    await hydrated(page);
    const blok = page.locator('.table-block').first();
    await expect(blok.locator('table')).toBeVisible();
    const tablo = await tabloKayitlari(blok);
    expect(tablo.length).toBeGreaterThan(1);
    await page.setViewportSize({ width: 320, height: 700 });
    await expect(blok.locator('.kayit')).toHaveCount(tablo.length);
    expect(await kayitListesi(blok)).toEqual(tablo);
    // Geniş ekrana dönüşte tablo geri gelir; aynı veri.
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(blok.locator('table')).toBeVisible();
    expect(await tabloKayitlari(blok)).toEqual(tablo);
  });
});

/**
 * Çizilen grafiğin ECharts seçeneğini tarayıcıda okur ve `sec` ile düz veriye indirger (seçenek işlev içerir, olduğu gibi
 * dönmez). Aynı modül örneği kullanılır (chartMotion gibi); `sec` kapanım kullanmaz, metin olarak taşınır.
 */
async function grafikSecenegi<T>(page: Page, index: number, sec: (option: Record<string, any>) => T): Promise<T | null> {
  return page.evaluate(
    async ({ i, kod }) => {
      const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('echarts-setup'));
      if (!url) return null;
      const { echarts } = await import(url);
      const host = document.querySelectorAll<HTMLElement>('.chart-canvas .chart-host')[i];
      const inst = host ? echarts.getInstanceByDom(host) : null;
      if (!inst) return null;
      const indirge = new Function(`return (${kod});`)() as (o: unknown) => T;
      return indirge(inst.getOption());
    },
    { i: index, kod: sec.toString() },
  );
}

/** Gantt seçeneği: görevler (ad, tarih aralığı etiketi, açıklama) ve işaret çizgisi etiketleri (kontrol noktaları). */
const ganttVerisi = (page: Page, index = 0) =>
  grafikSecenegi(page, index, (o) => ({
    rows: (o.series[1].data as { name: string; range: string; text: string }[]).map((d) => ({ name: d.name, range: d.range, text: d.text })),
    marks: (o.series[1].markLine.data as { label: { formatter: string } }[]).map((m) => m.label.formatter),
  }));

/** Ağaç seçeneği: düğümler derinlik öncelikli sırayla (ad, alt satır, bağlantı, derinlik). */
const agacVerisi = (page: Page, index = 0) =>
  grafikSecenegi(page, index, (o) => {
    const out: { name: string; sub: string; href: string; depth: number }[] = [];
    type D = { name: string; sub?: string; value?: string; children?: D[] };
    const gez = (n: D, depth: number) => {
      out.push({ name: n.name, sub: n.sub ?? '', href: n.value ?? '', depth });
      for (const c of n.children ?? []) gez(c, depth + 1);
    };
    gez(o.series[0].data[0] as D, 0);
    return out;
  });

/** Son tarih (deadlines) seçeneği: ad ve tarih etiketi. */
const sonTarihVerisi = (page: Page, index = 0) =>
  grafikSecenegi(page, index, (o) => (o.series[0].data as { name: string; label: { formatter: string } }[]).map((d) => ({ name: d.name, date: d.label.formatter })));

/** BCG seçeneği: ürün ve kutusu. */
const bcgVerisi = (page: Page, index = 0) =>
  grafikSecenegi(page, index, (o) => ({
    items: (o.series[0].data as { name: string; quadrant: string }[]).map((d) => ({ name: d.name, quadrant: d.quadrant })),
    quadrants: (o.series[0].markArea.data as { name: string }[][]).map((a) => a[0].name),
  }));

/** Ajandayı okur: maddeler (ad, tarih metni, ilk ISO tarih, rol, açıklama), ay başlıkları, işaretler ve belge sırası. */
async function ajandaOku(ajanda: ReturnType<Page['locator']>) {
  return ajanda.evaluate((el) => {
    const t = (n: Element | null | undefined) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
    return {
      maddeler: [...el.querySelectorAll('.ajanda-madde')].map((m) => ({
        name: t(m.querySelector('.kayit-ad')),
        range: t(m.querySelector('.ajanda-tarih')),
        from: m.querySelector('time')?.getAttribute('datetime') ?? '',
        role: m.querySelector('.chip[data-role]')?.getAttribute('data-role') ?? '',
        text: t([...m.querySelectorAll('dl.kayit-alanlar > div')].find((d) => t(d.querySelector('dt')) === 'Açıklama')?.querySelector('dd')),
      })),
      aylar: [...el.querySelectorAll('.ajanda-ay')].map(t),
      isaretler: [...el.querySelectorAll('.ajanda-isaret')].map(t),
      sira: [...el.querySelectorAll('.ajanda-ay, .ajanda-isaret, .ajanda-madde')].map((n) => (n.classList.contains('ajanda-ay') ? 'ay' : n.classList.contains('ajanda-isaret') ? 'isaret' : 'madde')),
    };
  });
}

const adaGore = <T extends { name: string; range?: string }>(xs: T[]) => [...xs].sort((a, b) => `${a.name}|${a.range ?? ''}`.localeCompare(`${b.name}|${b.range ?? ''}`, 'tr'));

/*
 * P5 (ux.md §8.1, M19 ChartPanel / M20 HierarchyExplorer / M21 TimelineExplorer; UX-29, UX-30): geniş grafikler dar
 * ekranda (< 48em) kaymaz; `Chart` kapsayıcıyı ölçer ve aynı spec’ten eşdeğer listeyi çizer — Gantt ve son tarih
 * grafikleri tarihli ajanda, organizasyon ve karar yetkisi şemaları dikey hiyerarşi, BCG örnek matrisi kutuya göre
 * değer listesi. İki kabuk aynı anda mount edilmez; ≥ 48em’de ECharts aynen (sığmazsa yalnız kendi kutusunda kayar).
 */
test.describe('grafiklerin dar ekran eşdeğeri (ux.md §8.1, M20/M21, UX-29/UX-30; P5)', () => {
  /** Geniş grafikli sayfalar ve dar ekranda beklenen eşdeğer kabuk sayısı. */
  const GENIS: { path: string; esdeger: string; n: number }[] = [
    { path: '', esdeger: '.hiyerarsi', n: 1 },
    { path: 'karar-yetkisi/', esdeger: '.hiyerarsi', n: 1 },
    { path: 'eylem-plani/', esdeger: '.ajanda', n: 1 },
    { path: 'roller/organizator/', esdeger: '.ajanda', n: 1 },
    // Entegrasyon tarihleri (deadlines) + 90 günlük plan (gantt)
    { path: 'roller/dijital-pazarlama/', esdeger: '.ajanda', n: 2 },
    { path: 'karar-bekleyenler/', esdeger: '.ajanda', n: 1 },
    { path: 'bcg/', esdeger: '.degerler', n: 1 },
    { path: 'partnership/#segika-takvim', esdeger: '.ajanda', n: 1 },
  ];

  for (const width of [320, 390]) {
    test(`${width} px: hiçbir sayfada .chart-scroll yok; geniş grafiğin yerinde eşdeğer liste, grafik kutusu onunla birlikte mount edilmez`, async ({ page }) => {
      await page.setViewportSize({ width, height: 480 });
      for (const path of PAGES) {
        await page.goto(path);
        await icerik(page);
        await expect(page.locator('.chart-scroll'), `${path}`).toHaveCount(0);
      }
      for (const g of GENIS) {
        await page.goto(g.path);
        await icerik(page);
        await hydrated(page);
        await expect(page.locator(g.esdeger), g.path).toHaveCount(g.n);
        await expect(page.locator('.chart[data-kabuk="esdeger"]'), g.path).toHaveCount(g.n);
        await expect(page.locator('.chart[data-kabuk="esdeger"] .chart-canvas'), g.path).toHaveCount(0);
        await expect(page.locator('.chart[data-kabuk="esdeger"] .table-hint'), g.path).toHaveCount(0);
        expect((await audit(page)).overflow, `${g.path} yatay taşma`).toBeLessThanOrEqual(0);
      }
    });
  }

  test('organizasyon ve karar yetkisi: 320 px dikey hiyerarşi 1280 px ECharts ağacıyla aynı düğümleri aynı derinlikte taşır; geniş ekrana dönüşte ağaç yeniden çizilir', async ({ page }) => {
    for (const path of ['', 'karar-yetkisi/']) {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path);
      await icerik(page);
      await hydrated(page);
      const kutu = page.locator('.chart-canvas').first();
      await kutu.scrollIntoViewIfNeeded();
      await expect(kutu.locator('svg')).toBeVisible({ timeout: 10_000 });
      const agac = await agacVerisi(page, 0);
      expect(agac, `${path} ECharts ağacı`).not.toBeNull();
      expect(agac!.length, path).toBeGreaterThan(5);

      await page.setViewportSize({ width: 320, height: 480 });
      const liste = page.locator('.hiyerarsi');
      await expect(liste, path).toHaveCount(1);
      // Eşdeğer çizilen figürde grafik kutusu yok (sayfadaki öbür, dar olmayan grafikler ECharts kalır).
      await expect(page.locator('.chart:has(.hiyerarsi) .chart-canvas'), `${path}: iki kabuk aynı anda`).toHaveCount(0);
      const dugumler = await liste.evaluate((ul) => {
        const t = (n: Element | null | undefined) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
        return [...ul.querySelectorAll('.hiyerarsi-dugum')].map((li) => {
          let depth = 0;
          for (let p = li.parentElement; p && p !== ul; p = p.parentElement) if (p.classList.contains('hiyerarsi-dallar')) depth += 1;
          return { name: t(li.querySelector(':scope > .hiyerarsi-kutu .hiyerarsi-ad')), sub: t(li.querySelector(':scope > .hiyerarsi-kutu .hiyerarsi-alt')), href: li.querySelector(':scope > a.hiyerarsi-kutu')?.getAttribute('href') ?? '', depth };
        });
      });
      expect(dugumler, `${path}: hiyerarşi ↔ ağaç`).toEqual(agac);
      // Üst/alt ilişki belge yapısında: alt düğümler üst düğümün li’si içindeki iç listede.
      const icice = await liste.evaluate((ul) => [...ul.querySelectorAll('.hiyerarsi-dallar')].every((d) => d.parentElement?.classList.contains('hiyerarsi-dugum')));
      expect(icice, path).toBe(true);
      // Her düğüm rol tonlu kutu, en az 44 px.
      const yukseklikler = await liste.locator('.hiyerarsi-kutu').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
      expect(Math.min(...yukseklikler), `${path} kutu yüksekliği`).toBeGreaterThanOrEqual(44);
      expect(await liste.locator('.hiyerarsi-dugum:not([data-role])').count(), `${path} rolsüz düğüm`).toBe(0);

      // Geniş ekrana dönüş: liste kalkar, ECharts ağacı yeniden çizilir (söküm/kurulum döngüsü sızdırmaz).
      await page.setViewportSize({ width: 1280, height: 800 });
      await expect(liste).toHaveCount(0);
      await expect(page.locator(`.chart-canvas[data-kind="${path ? 'gov' : 'org'}"] svg`)).toBeVisible({ timeout: 10_000 });
    }
  });

  test('320 px organizasyon: her kutu rol sayfasına bağlanır (UX-29); ekip liderinin altında bağımsız temsilciler; Enter ile rol sayfası açılır', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('');
    await icerik(page);
    await hydrated(page);
    const liste = page.locator('.hiyerarsi');
    const baglantilar = liste.locator('a.hiyerarsi-kutu');
    expect(await baglantilar.count()).toBeGreaterThanOrEqual(7);
    for (const h of await baglantilar.evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''))) expect(h).toMatch(/\/(roller\/[a-z-]+|buyume-modeli)\/$/);
    const lider = await liste.evaluate((ul) => {
      const t = (n: Element | null | undefined) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
      const li = [...ul.querySelectorAll('.hiyerarsi-dugum')].find((d) => t(d.querySelector(':scope > .hiyerarsi-kutu .hiyerarsi-ad')) === 'Ekip lideri');
      return li ? [...li.querySelectorAll(':scope > .hiyerarsi-dallar .hiyerarsi-ad')].map(t) : null;
    });
    expect(lider).toEqual(['Bağımsız temsilciler']);
    const asistan = liste.locator('a.hiyerarsi-kutu', { hasText: 'Asistan' }).first();
    await asistan.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/roller\/asistan\/$/);
  });

  test('eylem planı: 320 px ajanda 1280 px Gantt spec’iyle aynı görevleri ve kontrol noktalarını taşır; tarih sırası, ay başlıkları, sorumlu çipi; kayıt Enter ile açılır, hedef ≥ 44 px (UX-30)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('eylem-plani/');
    await icerik(page);
    await hydrated(page);
    const kutu = page.locator('.chart-canvas').first();
    await kutu.scrollIntoViewIfNeeded();
    await expect(kutu.locator('svg')).toBeVisible({ timeout: 10_000 });
    const gantt = await ganttVerisi(page, 0);
    expect(gantt).not.toBeNull();
    expect(gantt!.rows.length).toBeGreaterThan(10);
    expect(gantt!.marks).toEqual(['Başlangıç', '60. gün', '90. gün']);

    await page.setViewportSize({ width: 320, height: 480 });
    const ajanda = page.locator('.ajanda');
    await expect(ajanda).toHaveCount(1);
    await expect(page.locator('.chart-canvas')).toHaveCount(0);
    const okunan = await ajandaOku(ajanda);
    expect(adaGore(okunan.maddeler.map(({ name, range, text }) => ({ name, range, text })))).toEqual(adaGore(gantt!.rows));
    // Tarih sırası (başlangıca göre), kontrol noktaları tarihlerine göre araya girer, ay başlıkları yıl taşır.
    expect(okunan.maddeler.map((m) => m.from)).toEqual([...okunan.maddeler.map((m) => m.from)].sort());
    expect(okunan.isaretler.map((i) => i.split(' · ')[0])).toEqual(gantt!.marks);
    expect(okunan.aylar.length).toBeGreaterThanOrEqual(3);
    for (const ay of okunan.aylar) expect(ay).toMatch(/^[A-ZÇĞİÖŞÜ][a-zçğıöşü]+ 20\d\d$/);
    expect(okunan.sira[0]).toBe('ay');
    // Her maddede sorumlu çipi (rol) ve tarih aralığı.
    for (const m of okunan.maddeler) {
      expect(m.role, m.name).not.toBe('');
      expect(m.range, m.name).toMatch(/ – /);
    }
    // Kayıt sözleşmesi: h4 içinde düğme, Enter açar (Açıklama + Tarih + Sorumlu), Space kapatır, hedef ≥ 44 px.
    const madde = ajanda.locator('.ajanda-madde').first();
    const dugme = madde.locator('h4 button');
    await expect(dugme).toHaveAttribute('aria-expanded', 'false');
    expect((await dugme.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await dugme.focus();
    await page.keyboard.press('Enter');
    await expect(dugme).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator(`#${await dugme.getAttribute('aria-controls')}`);
    await expect(panel).toBeVisible();
    await expect(panel.locator('dl.kayit-alanlar dt')).toHaveText(['Tarih', 'Sorumlu', 'Açıklama']);
    await page.keyboard.press('Space');
    await expect(dugme).toHaveAttribute('aria-expanded', 'false');
    expect((await audit(page)).overflow).toBeLessThanOrEqual(0);
  });

  test('rol sayfaları: 320 px’te rol Gantt’ı ve dijital pazarlamanın entegrasyon tarihleri ajandadır; son tarih ajandası düz liste (düğmesiz), ECharts verisiyle aynı', async ({ page }) => {
    // Organizatör: rol Gantt’ı (adımlar) → açılır ajanda.
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('roller/organizator/');
    await icerik(page);
    await hydrated(page);
    const rolAjanda = page.locator('.ajanda');
    await expect(rolAjanda).toHaveCount(1);
    const adimlar = await ajandaOku(rolAjanda);
    expect(adimlar.maddeler.length).toBeGreaterThan(1);
    expect(adimlar.maddeler.map((m) => m.name)).toEqual(adimlar.maddeler.map((_, i) => `${i + 1}. adım`));
    expect(await rolAjanda.locator('h4 button').count()).toBe(adimlar.maddeler.length);

    // Dijital pazarlama: 1280’de son tarih grafiği (deadlines) ECharts; 320’de düz ajanda — aynı ad ve tarihler.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('roller/dijital-pazarlama/');
    await icerik(page);
    await hydrated(page);
    const kutu = page.locator('.chart-canvas[data-kind="deadlines"]');
    await kutu.scrollIntoViewIfNeeded();
    await expect(kutu.locator('svg')).toBeVisible({ timeout: 10_000 });
    const sonTarih = await sonTarihVerisi(page, 0);
    expect(sonTarih).not.toBeNull();
    await page.setViewportSize({ width: 320, height: 480 });
    const ajandalar = page.locator('.ajanda');
    await expect(ajandalar).toHaveCount(2);
    const duz = ajandalar.first();
    await expect(duz).toHaveAttribute('data-tur', 'tarih');
    expect(await duz.locator('button').count()).toBe(0);
    const okunan = await ajandaOku(duz);
    expect(okunan.maddeler.map((m) => ({ name: m.name, date: m.range }))).toEqual(sonTarih!);
    expect(okunan.maddeler.map((m) => m.from)).toEqual([...okunan.maddeler.map((m) => m.from)].sort());
    // 90 günlük plan Gantt’ı: açılır ajanda, 60. ve 90. gün işaretleri.
    const plan = ajandalar.nth(1);
    await expect(plan).toHaveAttribute('data-tur', 'gorev');
    expect((await ajandaOku(plan)).isaretler.map((i) => i.split(' · ')[0])).toEqual(['60. gün', '90. gün']);
  });

  test('karar bekleyenler ve BCG: 320 px’te son tarih ajandası ve kutuya göre değer listesi ECharts verisiyle aynı', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('karar-bekleyenler/');
    await icerik(page);
    await hydrated(page);
    const kutu = page.locator('.chart-canvas[data-kind="deadlines"]');
    await kutu.scrollIntoViewIfNeeded();
    await expect(kutu.locator('svg')).toBeVisible({ timeout: 10_000 });
    const sonTarih = await sonTarihVerisi(page, 0);
    expect(sonTarih!.length).toBeGreaterThan(0);
    await page.setViewportSize({ width: 320, height: 480 });
    const ajanda = page.locator('.ajanda');
    await expect(ajanda).toHaveCount(1);
    const okunan = await ajandaOku(ajanda);
    expect(okunan.maddeler.map((m) => ({ name: m.name, date: m.range }))).toEqual(sonTarih!);
    for (const m of okunan.maddeler) expect(m.role, m.name).not.toBe('');

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('bcg/');
    await icerik(page);
    await hydrated(page);
    const matris = page.locator('.chart-canvas[data-kind="bcg-num"]');
    await matris.scrollIntoViewIfNeeded();
    await expect(matris.locator('svg')).toBeVisible({ timeout: 10_000 });
    const sira = await page.locator('.chart-canvas').evaluateAll((els) => els.findIndex((el) => (el as HTMLElement).dataset.kind === 'bcg-num'));
    const bcg = await bcgVerisi(page, sira);
    expect(bcg!.items.length).toBeGreaterThan(3);
    await page.setViewportSize({ width: 320, height: 480 });
    const degerler = page.locator('.degerler');
    await expect(degerler).toHaveCount(1);
    const kutular = await degerler.evaluate((ul) => {
      const t = (n: Element | null | undefined) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
      return [...ul.querySelectorAll('.degerler-kutu')].map((k) => ({ name: t(k.querySelector('.degerler-kutu-ad')), items: [...k.querySelectorAll('.degerler-madde .kayit-ad')].map(t) }));
    });
    expect(kutular.map((k) => k.name).sort()).toEqual([...bcg!.quadrants].sort());
    expect(kutular.flatMap((k) => k.items).sort()).toEqual(bcg!.items.map((i) => i.name).sort());
    // Her ürün kendi kutusunda; sayılar madde içinde (büyüme, göreli pay, ciro).
    const kutuAdi = (key: string) => bcg!.quadrants[['yildiz', 'soru', 'inek', 'kopek'].indexOf(key)];
    for (const i of bcg!.items) expect(kutular.find((k) => k.items.includes(i.name))?.name, i.name).toBe(kutuAdi(i.quadrant));
    for (const s of await degerler.locator('.degerler-sayilar').allTextContents()) expect(s).toMatch(/Pazar büyümesi .* Göreli pay .* Ciro .* milyon ₺/);
  });

  test('kabuk kapsayıcıya göre: 768 px’te (kapsayıcı 48em’den dar) ajanda; 900 px’te ECharts Gantt kendi kutusunda, klavyeyle kayar (ux.md §8.7, Y-01 daraltıldı)', async ({ page, browserName }) => {
    // Dikey tablet: sayfa kenar boşlukları düşülünce kapsayıcı 48em’den dardır → DataTable gibi dar kabuk.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('eylem-plani/');
    await icerik(page);
    await expect(page.locator('.ajanda')).toHaveCount(1);
    await expect(page.locator('.chart-scroll')).toHaveCount(0);
    expect((await audit(page)).overflow).toBeLessThanOrEqual(0);
    // Yatay tablet / dar masaüstü: kapsayıcı ≥ 48em → ECharts; Gantt asgari genişliğinden darsa yalnız kendi kutusunda kayar.
    await page.setViewportSize({ width: 900, height: 700 });
    await expect(page.locator('.ajanda')).toHaveCount(0);
    const region = page.locator('.chart-scroll').first();
    await region.scrollIntoViewIfNeeded();
    await expect(region.locator('.chart-canvas svg')).toBeVisible({ timeout: 10_000 });
    const widths = await region.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    expect(widths.scroll, 'Gantt kendi kutusunda kayar').toBeGreaterThan(widths.client);
    expect((await audit(page)).overflow).toBeLessThanOrEqual(0);
    if (browserName !== 'webkit') {
      // not_run WebKit: Playwright WebKit ok tuşlarıyla varsayılan kaydırmayı uygulamıyor; gerçek Safari’de elle doğrulanmalı.
      await region.focus();
      for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
      await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    }
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
    await icerik(page);
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
    await icerik(page);
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
    await icerik(page);
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

test.describe('başlık ve İstihdam menüsü', () => {
  test('İstihdam menüsü: organizasyon, roller ve istihdam takvimi; etkin sayfa işaretli; Escape kapatır', async ({ page }) => {
    await page.goto('roller/segika/');
    await icerik(page);
    await hydrated(page);
    const tetik = page.getByRole('button', { name: 'İstihdam' });
    await expect(tetik).toHaveAttribute('data-section', 'true');
    await tetik.click();
    const menu = page.getByRole('menu', { name: 'İstihdam' });
    await expect(menu).toBeVisible();
    const ogeler = menu.getByRole('menuitem');
    // Kullanıcı kararı 2026-10-21: 1–7 sıralı numara, roller pozisyon adıyla; numarasız öğede aynı sade nokta.
    await expect(ogeler).toHaveText(['1Organizasyon şeması', '2Dijital pazarlama uzmanı', '3İstoç Pazarlama CRM uzmanı', '4Saha satış uzmanı', '5Organizatör', '6Segika CRM', '7Asistan', 'İstihdam takvimi', 'Applet']);
    await expect(menu.getByRole('menuitem', { name: 'Segika CRM' })).toHaveAttribute('aria-current', 'page');
    await expect(menu.locator('.tree-no')).toHaveCount(7);
    await expect(menu.getByRole('menuitem', { name: 'İstihdam takvimi' }).locator('.navmenu-bullet')).toHaveCount(1);
    // Numara ile yazı arasında güvenli boşluk (≥ 12 px); numaralı ve noktalı öğelerde yazılar hizalı.
    // Numara rozeti (veya nokta) ile ardındaki yazı arasındaki boşluk.
    const bosluk = await menu.getByRole('menuitem', { name: 'Segika CRM' }).evaluate((el) => {
      const isaret = el.querySelector('.tree-no')!;
      const r = document.createRange();
      r.selectNodeContents(isaret.nextSibling!);
      return r.getBoundingClientRect().left - isaret.getBoundingClientRect().right;
    });
    expect(bosluk).toBeGreaterThanOrEqual(11.5);
    const yaziSol = async (ad: string) => menu.getByRole('menuitem', { name: ad }).evaluate((el) => { const isaret = el.querySelector('.tree-no, .navmenu-bullet')!; const r = document.createRange(); r.selectNodeContents(isaret.nextSibling!); return Math.round(r.getBoundingClientRect().left); });
    expect(await yaziSol('İstihdam takvimi')).toBe(await yaziSol('Asistan'));
    // Panel markalı yüzeyde; ögede çevreleyen halka yok.
    const panel = await menu.evaluate((el) => getComputedStyle(el).backgroundColor);
    const yuzey = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--surface-raised').trim());
    expect(panel).not.toBe('rgba(0, 0, 0, 0)');
    expect(yuzey).not.toBe('');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });

  test('Applet bağlantısı açılır; applet alt bölümündeyken İstihdam ve Applet etkin kalır', async ({ page }) => {
    await page.goto('istihdam/');
    await icerik(page);
    await page.getByRole('button', { name: 'İstihdam' }).click();
    await page.getByRole('menuitem', { name: 'Applet', exact: true }).click();
    await expect(page).toHaveURL(/\/applet\/$/);
    await expect(page.locator('section#katalog')).toBeVisible();
    await page.goto('applet/#is-degerleme');
    await icerik(page);
    const tetik = page.getByRole('button', { name: 'İstihdam' });
    await expect(tetik).toHaveAttribute('data-section', 'true');
    await tetik.click();
    await expect(page.getByRole('menuitem', { name: 'Applet', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('klavye: Tab ile tetikleyici, Enter açar, oklar ögeler arasında gezer; odak alt çizgiyle (halka yok)', async ({ page }) => {
    await page.goto('istihdam/');
    await icerik(page);
    await hydrated(page);
    const tetik = page.getByRole('button', { name: 'İstihdam' });
    await page.keyboard.press('Tab');
    await tetik.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'İstihdam' });
    await expect(menu).toBeVisible();
    // Menü odağı açıldıktan sonraki karede içeri alır; oklar ondan sonra.
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="menu"]'))).toBe(true);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    const odak = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { role: el.getAttribute('role'), text: el.textContent, outline: cs.outlineStyle, outlineWidth: cs.outlineWidth, shadow: cs.boxShadow, deco: cs.textDecorationLine };
    });
    expect(odak.role).toBe('menuitem');
    expect(odak.outline === 'none' || parseFloat(odak.outlineWidth) === 0).toBe(true);
    expect(odak.shadow).toBe('none');
    expect(odak.deco).toContain('underline');
    await expect(menu.getByRole('menuitem', { name: 'İstihdam takvimi' })).toHaveAttribute('aria-current', 'page');
    // Escape kapatır, odak tetikleyiciye döner (Safari fareyle tıklanan düğmeye odak vermediği için klavyeyle açılır).
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(tetik).toBeFocused();
  });

  /**
   * Önceki başlık yükseklikleri (canlı site, 2026-10-20, 1280 px; yalnız hero kutusu, üstündeki kırıntı satırı hariç):
   * kullanıcı kararı rol ≥ %75, diğerleri ≥ %50 az. Tek PageHeader (kullanıcı kararı 2026-10-27, ux.md M03, P6.1) başlığı
   * kırıntı satırına taşıdı; ölçülen kutu artık kırıntı satırı + amaç/dönem satırıdır. Aynı ölçekte kıyas için eski
   * değere o günkü kırıntı satırı eklenir (`.crumbs a` 44 px dokunma yüksekliği, commit 7b408ae).
   */
  const KIRINTI_SATIRI = 44;
  const ONCEKI: Record<string, number> = {
    '': 175, 'arsiv/': 203, 'bcg/': 259, 'buyume-modeli/': 293, 'eylem-plani/': 231, 'giderler/': 233, 'hedefler/': 366,
    'istihdam/': 203, 'karar-bekleyenler/': 203, 'karar-yetkisi/': 265, 'notlar/': 203, 'parametreler/': 299,
    'roller/asistan/': 468, 'roller/dijital-pazarlama/': 496, 'roller/ekip-lideri/': 553, 'roller/organizator/': 468,
    'roller/pazarlamaci/': 468, 'roller/saha-uzmani/': 525, 'roller/segika/': 557,
  };
  for (const [path, once] of Object.entries(ONCEKI)) {
    const rol = path.startsWith('roller/');
    const sinir = Math.floor((once + KIRINTI_SATIRI) * (rol ? 0.25 : 0.5));
    test(`başlık sıkışık (1280): /${path} ≤ ${sinir} px (önce ${once} + kırıntı ${KIRINTI_SATIRI}, ${rol ? '−%75' : '−%50'})`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path);
      await icerik(page);
      // Tek PageHeader (kullanıcı kararı 2026-10-27, ux.md M03): kırıntı satırı (h1) ve altındaki amaç/dönem satırı
      // birlikte ölçülür — eski hero ölçüsünden daha geniş kapsam, aynı sınır. Giderler’de yalnız kırıntı satırı.
      const olcu = await page.locator('[data-page-header]').evaluateAll((els) => {
        const kutular = els.map((el) => el.getBoundingClientRect());
        return { n: kutular.length, h: Math.max(...kutular.map((b) => b.bottom)) - Math.min(...kutular.map((b) => b.top)) };
      });
      expect(olcu.n).toBeGreaterThanOrEqual(1);
      expect(olcu.h).toBeLessThanOrEqual(sinir);
    });
  }

  // Kullanıcı kararı 2026-10-28 (docs/contents.md §5.2): göreve göre beş menü — İstihdam, Pazarlama, Finans, Yönetim, Yardımcı.
  // Kullanıcı kararı 2026-10-21: tema ani değişmez (“şimşek çakar gibi değil”): sayfa görünüm geçişiyle (destek varsa)
  // yumuşak geçer, anahtar topu kayar; hareket azaltmada anında.
  test('tema değişimi yumuşak: görünüm geçişi ve kayan anahtar; hareket azaltmada anında', async ({ page }) => {
    await page.goto('hedefler/');
    await icerik(page);
    await hydrated(page);
    const sure = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--motion-duration-theme').trim());
    expect(sure.endsWith('ms') ? parseFloat(sure) : parseFloat(sure) * 1000).toBe(320);
    const izle = () =>
      page.evaluate(() => {
        const w = window as unknown as { __gecis: boolean };
        w.__gecis = false;
        new MutationObserver(() => {
          if (document.documentElement.hasAttribute('data-tema-gecis')) w.__gecis = true;
        }).observe(document.documentElement, { attributes: true });
      });
    await izle();
    const vt = await page.evaluate(() => 'startViewTransition' in document);
    const sema = () => page.locator('html').getAttribute('data-mantine-color-scheme');
    const once = await sema();
    await page.getByRole('button', { name: 'Koyu tema' }).click();
    // Mantine şema değişiminde geçişleri kapatmaz: anahtar topu süreyle kayar.
    expect(parseFloat(await page.locator('.theme-thumb').evaluate((el) => getComputedStyle(el).transitionDuration))).toBeGreaterThan(0);
    await expect.poll(sema).not.toBe(once);
    if (vt) expect(await page.evaluate(() => (window as unknown as { __gecis: boolean }).__gecis)).toBe(true);
    await expect(page.locator('html')).not.toHaveAttribute('data-tema-gecis', '');
    // Hareket azaltmada görünüm geçişi yok, değişim anında.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await izle();
    const sonra = await sema();
    await page.getByRole('button', { name: 'Koyu tema' }).click();
    await expect.poll(sema).not.toBe(sonra);
    expect(await page.evaluate(() => (window as unknown as { __gecis: boolean }).__gecis)).toBe(false);
  });

  // Kullanıcı kararı 2026-10-21: üst gezinme öğeleri ayırt edilsin, menü olduğu anlaşılsın — simge ve ince ayırıcı.
  test('üst gezinme: her öğede simge, öğeler arasında ince dikey ayırıcı', async ({ page }) => {
    await page.goto('hedefler/');
    await icerik(page);
    const nav = page.getByRole('navigation', { name: 'Ana gezinme' });
    await expect(nav.locator('.mainnav-link .mainnav-icon')).toHaveCount(5);
    const ayiricilar = await nav.locator('.mainnav-list > li').evaluateAll((lis) => lis.map((li) => { const b = getComputedStyle(li, '::before'); return b.content !== 'none' && parseFloat(b.width) > 0 && parseFloat(b.height) > 0; }));
    expect(ayiricilar).toEqual([false, true, true, true, true]);
  });

  test('menüler: İstihdam, Pazarlama, Finans, Yönetim, Yardımcı; Yönetim dört sayfa; etkin sayfa işaretli; grup kapsamları', async ({ page }) => {
    await page.goto('karar-yetkisi/');
    await icerik(page);
    await hydrated(page);
    const nav = page.getByRole('navigation', { name: 'Ana gezinme' });
    await expect(nav.locator('.mainnav-link')).toHaveText([/^İstihdam/, /^Pazarlama/, /^Finans/, /^Yönetim/, /^Yardımcı/]);
    const tetik = page.getByRole('button', { name: 'Yönetim' });
    await expect(tetik).toHaveAttribute('data-section', 'true');
    await expect(page.getByRole('button', { name: 'Pazarlama' })).not.toHaveAttribute('data-section', 'true');
    await tetik.click();
    const menu = page.getByRole('menu', { name: 'Yönetim' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem')).toHaveText(['Hedefler', 'Eylem planı', 'Kararlar', 'Karar yetkisi']);
    await expect(menu.getByRole('menuitem', { name: 'Karar yetkisi' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Pazarlama' }).click();
    await expect(page.getByRole('menu', { name: 'Pazarlama' }).getByRole('menuitem')).toHaveText(['Temsilci ağı', 'İş ortaklığı', 'Affilate']);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Finans' }).click();
    await expect(page.getByRole('menu', { name: 'Finans' }).getByRole('menuitem')).toHaveText(['Gelir planı', 'Giderler', 'Nakit akışı']);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Yardımcı' }).click();
    const yardimci = page.getByRole('menu', { name: 'Yardımcı' });
    await expect(yardimci.getByRole('menuitem')).toHaveText(['Varsayımlar ve ayarlar', 'Notlar', 'Arşiv']);
    await yardimci.getByRole('menuitem', { name: 'Varsayımlar ve ayarlar' }).click();
    await expect(page).toHaveURL(/\/parametreler\/$/);
    await page.getByRole('button', { name: 'Yönetim' }).click();
    await page.getByRole('menu', { name: 'Yönetim' }).getByRole('menuitem', { name: 'Kararlar' }).click();
    await expect(page).toHaveURL(/\/karar-bekleyenler\/$/);
  });

  test('Temsilci ağı yalnız Pazarlama menüsünde etkin (İstihdam menüsü bölüm saymaz)', async ({ page }) => {
    await page.goto('buyume-modeli/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByRole('button', { name: 'Pazarlama' })).toHaveAttribute('data-section', 'true');
    await expect(page.getByRole('button', { name: 'İstihdam' })).not.toHaveAttribute('data-section', 'true');
  });

  // Giderler’de alt başlık 15 px Roboto (daha geniş): 320 px’te de üst bant tek satır.
  for (const coarse of [false, true]) {
    test(`320 px Giderler${coarse ? ' (dokunmatik)' : ''}: üst bant tek satır, tema düğmesi ≥ ${coarse ? 48 : 44} px`, async ({ browser, browserName }) => {
      test.skip(coarse && browserName === 'firefox', 'Firefox mobil emülasyonu desteklemez');
      const context = await browser.newContext({ viewport: { width: 320, height: 700 }, ...(coarse ? { hasTouch: true, isMobile: true } : {}) });
      const page = await context.newPage();
      await page.goto('giderler/');
      await icerik(page);
      const [marka, dugme] = [await page.locator('.brand').boundingBox(), await page.locator('.theme-toggle').boundingBox()];
      expect(Math.abs(marka!.y - dugme!.y)).toBeLessThan(8);
      expect(Math.min(dugme!.width, dugme!.height)).toBeGreaterThanOrEqual(coarse ? 48 : 44);
      await context.close();
    });
  }

  // Kullanıcı kararı 2026-10-20: logonun yanındaki yazı yok; altında “Pazarlama & Finansal Planlama”; plan tarihi başlıkta yok.
  for (const width of [320, 1280]) {
    test(`${width} px: logo altında alt başlık, plan tarihi yok`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('');
      await icerik(page);
      const marka = page.locator('.topbar .brand');
      // Logo (kullanıcı kararı 2026-10-21): Türksab “TURKS/AB” orijinaline göre çizilmiş SVG; ekran okuyucuya “Türksab”.
      await expect(marka).toHaveText('Pazarlama & Finansal Planlama');
      await expect(page.getByRole('link', { name: 'Türksab · Pazarlama & Finansal Planlama' })).toBeVisible();
      const logo = marka.locator('svg.brand-mark');
      await expect(logo).toHaveAttribute('aria-hidden', 'true');
      const [harf, cizgi] = await logo.evaluate((el) => [getComputedStyle(el.querySelector('.brand-mark-letters')!).fill, getComputedStyle(el.querySelector('.brand-mark-slash')!).fill]);
      expect(cizgi).not.toBe(harf);
      // Orijinal gibi kalın paralelkenar: yatay kalınlık büyük harf yüksekliğinin ≈ %24'ü, eğim ≈ %35'i
      // (kutu genişliği / yükseklik ≈ 0,60); logo oranı viewBox'tan (≈ 7,31), harf yüksekliği ≥ 16 px.
      const [kutu, egik] = [await logo.boundingBox(), await logo.locator('.brand-mark-slash').boundingBox()];
      expect(egik!.width / egik!.height).toBeCloseTo(0.6, 1);
      expect(kutu!.width / kutu!.height).toBeCloseTo(2662 / 364, 1);
      expect(kutu!.height).toBeGreaterThanOrEqual(16);
      await expect(page.locator('.topbar')).not.toContainText('Plan tarihi');
      await expect(page.locator('.topbar')).not.toContainText('Satış ve Pazarlama Planı');
      const alt = await marka.locator('.brand-tagline').boundingBox();
      expect(alt!.y).toBeGreaterThanOrEqual(kutu!.y + kutu!.height - 1);
      expect(parseFloat(await marka.locator('.brand-tagline').evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    });
  }

  test('işaretçiyle açılan menüde oklar odak göstergesi açmaz (görünür odak yalnız Tab ile)', async ({ page }) => {
    await page.goto('istihdam/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('button', { name: 'İstihdam' }).click();
    await expect(page.getByRole('menu', { name: 'İstihdam' })).toBeVisible();
    await page.mouse.move(0, 0);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    // İşaretçi modunda hiçbir ögede alt çizgi yok; zemin yalnız etkin sayfada (seçili ≠ odak).
    const ogeler = await page.getByRole('menuitem').evaluateAll((els) =>
      els.map((el) => ({ deco: getComputedStyle(el).textDecorationLine, bg: getComputedStyle(el).backgroundColor, current: el.getAttribute('aria-current') })),
    );
    expect(ogeler.length).toBe(9);
    expect(ogeler.filter((o) => o.deco.includes('underline'))).toEqual([]);
    expect(ogeler.filter((o) => !o.current && o.bg !== 'rgba(0, 0, 0, 0)')).toEqual([]);
  });

  // Kullanıcı kararı 2026-10-27 (docs/ux.md §3, M01/M02): dar ekranda (< 48em) yatay kayan gezinme şeridi yok; marka ve
  // tema düğmesi ilk satırda, altında “Menü” düğmesi, tam gezinme sağdan açılan çekmecede (Mantine Drawer): etkin sayfa
  // işaretli, Escape kapatır, odak düğmeye döner. 48em’den itibaren şerit (kullanıcı kararı 2026-10-21: geniş ekranda üst
  // satırda, ortalı).
  for (const width of [320, 360, 375, 390]) {
    test(`${width} px: gezinme çekmecede — şerit yok, 22 bağlantı, etkin sayfa işaretli, Escape kapatır, odak düğmeye döner`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('roller/asistan/');
      await icerik(page);
      await hydrated(page);
      await expect(page.locator('.mainnav')).toHaveCount(0);
      const tetik = page.getByRole('button', { name: 'Menü', exact: true });
      const [marka, dugme, t] = [await page.locator('.brand').boundingBox(), await page.locator('.theme-toggle').boundingBox(), await tetik.boundingBox()];
      expect(Math.abs(marka!.y - dugme!.y)).toBeLessThan(8);
      expect(t!.y).toBeGreaterThanOrEqual(marka!.y + marka!.height - 1);
      expect(Math.min(t!.width, t!.height)).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      // Klavyeyle açılır (Safari fareyle tıklanan düğmeye odak vermez; odak dönüşü ancak odaklı düğmeye olur).
      await tetik.focus();
      await page.keyboard.press('Enter');
      const cekmece = page.getByRole('dialog', { name: 'Menü' });
      await expect(cekmece).toBeVisible();
      const nav = cekmece.getByRole('navigation', { name: 'Ana gezinme' });
      await expect(nav.getByRole('link')).toHaveCount(22);
      await expect(nav.getByRole('link', { name: 'Asistan' })).toHaveAttribute('aria-current', 'page');
      await expect(nav.locator('.cekmece-grup-ad')).toHaveText(['İstihdam', 'Pazarlama', 'Finans', 'Yönetim', 'Yardımcı']);
      await expect(nav.locator('.tree-no')).toHaveCount(7);
      const yukseklikler = await nav.getByRole('link').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
      expect(Math.min(...yukseklikler)).toBeGreaterThanOrEqual(44);
      expect((await cekmece.boundingBox())!.width).toBeLessThanOrEqual(width + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      await page.keyboard.press('Escape');
      await expect(cekmece).toBeHidden();
      await expect(tetik).toBeFocused();
    });
  }

  test('768 px: marka ve tema düğmesi tek satır, gezinme şeridi altında tek satır ve ortalı; çekmece düğmesi yok', async ({ page }) => {
    const width = 768;
    await page.setViewportSize({ width, height: 700 });
    await page.goto('roller/asistan/');
    await icerik(page);
    await expect(page.locator('.cekmece-tetik')).toHaveCount(0);
    const [marka, dugme, nav] = [await page.locator('.brand').boundingBox(), await page.locator('.theme-toggle').boundingBox(), await page.locator('.mainnav').boundingBox()];
    expect(Math.abs(marka!.y - dugme!.y)).toBeLessThan(8);
    expect(nav!.y).toBeGreaterThanOrEqual(marka!.y + marka!.height - 1);
    expect(nav!.height).toBeLessThanOrEqual(60);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const ilk = await page.locator('.mainnav-list > li').first().boundingBox();
    expect(ilk!.x).toBeGreaterThanOrEqual(nav!.x - 1);
    const liste = await page.locator('.mainnav-list').evaluate((el) => {
      const lis = [...el.children].filter((c) => (c as HTMLElement).offsetParent !== null).map((c) => c.getBoundingClientRect());
      return { sol: Math.min(...lis.map((b) => b.left)), sag: Math.max(...lis.map((b) => b.right)) };
    });
    expect(Math.abs((liste.sol + liste.sag) / 2 - width / 2)).toBeLessThan(8);
  });

  for (const path of ['', 'giderler/']) {
    test(`1280 px /${path}: logo, gezinme ve tema düğmesi tek satırda; bant alçak`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path);
      await icerik(page);
      const [marka, nav, dugme] = [await page.locator('.brand').boundingBox(), await page.locator('.mainnav').boundingBox(), await page.locator('.theme-toggle').boundingBox()];
      expect(nav!.x).toBeGreaterThan(marka!.x + marka!.width);
      expect(dugme!.x).toBeGreaterThan(nav!.x);
      expect(Math.abs(nav!.y + nav!.height / 2 - (marka!.y + marka!.height / 2))).toBeLessThan(8);
      expect(await page.locator('.topbar').evaluate((el) => el.getBoundingClientRect().height)).toBeLessThanOrEqual(64);
      // Gezinme başlığın tam ortasında (kullanıcı kararı 2026-10-21).
      const liste = await page.locator('.mainnav-list').boundingBox();
      expect(Math.abs(liste!.x + liste!.width / 2 - 640)).toBeLessThan(8);
    });
  }

  // Kullanıcı kararı 2026-10-21: “Koyu tema” yazısı görünmez (düğmenin adı kalır); anahtar büyük; simge izin boş
  // tarafında — açık temada beyaz izde ay (topuz solda), koyu temada turuncu izde güneş (topuz sağda).
  test('tema anahtarı: görünür yazı yok; açıkta beyaz izde ay, koyuda turuncu izde güneş, simge topuzun karşısında', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto('');
    await icerik(page);
    await hydrated(page);
    const dugme = page.getByRole('button', { name: 'Koyu tema' });
    await expect(dugme).toHaveAttribute('aria-pressed', 'false');
    expect(await page.locator('.theme-label').evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    const iz = await page.locator('.theme-track').boundingBox();
    expect(iz!.width).toBeGreaterThanOrEqual(56);
    expect(iz!.height).toBeGreaterThanOrEqual(32);
    const durum = () =>
      page.evaluate(() => {
        const q = (s: string) => document.querySelector(s)!;
        const x = (s: string) => q(s).getBoundingClientRect().left + q(s).getBoundingClientRect().width / 2;
        return {
          gunes: getComputedStyle(q('.theme-icon-sun')).opacity,
          ay: getComputedStyle(q('.theme-icon-moon')).opacity,
          iz: getComputedStyle(q('.theme-track')).backgroundColor,
          simgeSagda: x(getComputedStyle(q('.theme-icon-sun')).opacity === '1' ? '.theme-icon-sun' : '.theme-icon-moon') > x('.theme-thumb'),
        };
      });
    await expect.poll(durum).toEqual({ gunes: '0', ay: '1', iz: 'rgb(255, 255, 255)', simgeSagda: true });
    await dugme.click();
    await expect(dugme).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(durum).toEqual({ gunes: '1', ay: '0', iz: 'rgb(255, 134, 0)', simgeSagda: false });
  });

  // Kullanıcı kararı 2026-10-21: bölüm başlığı ve açıklaması geniş ekranda tek satırda; dar ekranda açıklama altta.
  for (const [width, tekSatir] of [[1280, true], [375, false]] as const) {
    test(`${width} px: bölüm başlığı ve açıklaması ${tekSatir ? 'tek satırda' : 'alt alta'}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('roller/segika/');
      await icerik(page);
      const bas = page.locator('.section-head').filter({ has: page.locator('.section-desc') }).first();
      const [t, d] = [await bas.locator('.section-title').boundingBox(), await bas.locator('.section-desc').boundingBox()];
      if (tekSatir) {
        expect(Math.abs(d!.y - t!.y)).toBeLessThan(16);
        expect(d!.x).toBeGreaterThan(t!.x + t!.width);
      } else expect(d!.y).toBeGreaterThanOrEqual(t!.y + t!.height - 1);
    });
  }

  // İnceleme bulgusu 2026-10-21: görünür yazısı olmayan tema anahtarında klavye odağı anahtarın altında düz çubuk.
  test('tema anahtarı klavyeyle odaklanınca altında düz odak çubuğu görünür; halka yok', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'not_run: Playwright WebKit Tab ile düğmelere odak vermez');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('');
    await icerik(page);
    await hydrated(page);
    // Gezinmenin son öğesi “Yardımcı” menü düğmesi (CA-1, 2026-10-28; önce ayrık Notlar bağlantısıydı); sonraki odak tema anahtarı.
    await page.getByRole('button', { name: 'Yardımcı' }).focus();
    await page.keyboard.press('Tab');
    const st = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return { tema: el.classList.contains('theme-toggle'), bg: cs.backgroundImage, boy: cs.backgroundSize, halka: cs.outlineStyle };
    });
    expect(st.tema).toBe(true);
    expect(st.bg).toContain('linear-gradient');
    expect(st.boy).toMatch(/^56px 3px$/);
    expect(st.halka).toBe('none');
  });

  // Kullanıcı kararı 2026-10-21: kırıntı “19 Ekim” ile başlar; Giderler’de son kırıntı sayfa başlığıdır (h1, büyük).
  test('kırıntı: 19 Ekim ile başlar; Giderler’de başlık kırıntıda (tek h1, diğer kırıntılardan büyük)', async ({ page }) => {
    await page.goto('roller/segika/');
    await icerik(page);
    await expect(page.locator('.crumbs li').first()).toHaveText('19 Ekim');
    await expect(page.locator('.crumbs')).not.toContainText('İsmail Karaca');
    await page.goto('giderler/');
    await icerik(page);
    await expect(page.locator('.crumbs li')).toHaveText(['19 Ekim', /Finans/, /OpEx/, /Operasyonel Giderler/]);
    await expect(page.locator('h1')).toHaveCount(1);
    const h1 = page.locator('.crumbs li[aria-current="page"] h1');
    await expect(h1).toHaveText('Operasyonel Giderler');
    const [baslik, kirinti] = [await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), await page.locator('.crumbs a').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))];
    expect(baslik).toBeGreaterThan(kirinti * 1.4);
    // Kullanıcı kararları 2026-10-21: kırıntılar %10–20 büyük (Giderler 15 → 17 px), başlık %10–20 küçük (32 → ≈ 27 px).
    expect(kirinti).toBeGreaterThanOrEqual(15 * 1.1);
    expect(kirinti).toBeLessThanOrEqual(15 * 1.2);
    expect(baslik).toBeGreaterThanOrEqual(32 * 0.8);
    expect(baslik).toBeLessThanOrEqual(32 * 0.9);
    // Kırıntılar ve başlık aynı satırda.
    const ilk = await page.locator('.crumbs li').first().boundingBox();
    const son = await page.locator('.crumbs li').last().boundingBox();
    expect(son!.y).toBeLessThan(ilk!.y + ilk!.height);
    await expect(page.locator('.hero')).toHaveCount(0);
  });
});

/*
 * ux.md P6.1 (kullanıcı kararı 2026-10-27, §3 ve §5.4; M03 PageHeader): sayfa başlığı tek kalıp. Her sayfada tek h1,
 * kırıntı satırının son öğesidir (Giderler kararı 2026-10-21 sayfa geneline yayıldı); altında bir cümlelik amaç ve
 * dönem/kaynak satırı. Eski hero (turuncu üst etiket + büyük başlık + uzun açıklama) ve kırıntı-başlık ikiliği yok.
 * Bölüm başlığı: tek ana başlık + açıklama; kalın üst çizgi ve turuncu numara yok; numara yalnız sıralama anlamlıysa.
 */
/*
 * Kırıntı derinliği (K5, docs/birlesik_plan.md §4.1; kullanıcı kararı 2026-10-28 “test et, karar ver”): 320×480’de rol
 * sayfasının kırıntısı üç satır tutuyordu (19 Ekim › İstihdam › Organizasyon şeması › başlık). Karar: dar ekranda (< 48em)
 * bağlantısız grup adı gizlenir, bağlantılı ebeveyn ve başlık kalır; geniş ekranda tam yol. Giderler’in belgeli yolu
 * (Finans › OpEx) grup adı değil, her genişlikte kalır.
 */
test.describe('kırıntı derinliği (K5, 2026-10-28)', () => {
  // Son kırıntı h1 + durum hapı taşır; metin olarak yalnız h1 okunur.
  const gorunen = (page: Page) =>
    page.locator('.crumbs li').evaluateAll((lis) => lis.filter((li) => getComputedStyle(li).display !== 'none').map((li) => ((li.querySelector('h1') ?? li).textContent ?? '').replace(/\s+/g, ' ').trim()));
  test('320×480: grup adı gizli, bağlantılı ebeveyn ve başlık kalır; başlık ilk ekranda; 1280: tam yol; Giderler yolu her genişlikte', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('roller/ekip-lideri/');
    await icerik(page);
    expect(await gorunen(page)).toEqual(['19 Ekim', 'Organizasyon şeması', 'Satış-pazarlama ekip lideri']);
    await expect(page.locator('.crumbs li[data-grup]')).toHaveCount(1);
    await expect(page.locator('.crumbs li[data-grup]')).toBeHidden();
    const h1 = await page.locator('h1').boundingBox();
    expect(h1!.y + h1!.height, 'başlık ilk ekranda').toBeLessThanOrEqual(480);
    await page.goto('gelir-plani/');
    await icerik(page);
    expect(await gorunen(page)).toEqual(['19 Ekim', 'Gelir planı']);
    await page.goto('giderler/');
    await icerik(page);
    expect(await gorunen(page)).toEqual(['19 Ekim', 'Finans', 'OpEx', 'Operasyonel Giderler']);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('roller/ekip-lideri/');
    await icerik(page);
    expect(await gorunen(page)).toEqual(['19 Ekim', 'İstihdam', 'Organizasyon şeması', 'Satış-pazarlama ekip lideri']);
    await expect(page.locator('.crumbs li[data-grup]')).toBeVisible();
    await expect(page.locator('.crumbs li[data-grup] a')).toHaveCount(0);
  });
});

test.describe('sayfa başlığı ve bölüm başlığı (ux.md §3/§5.4, M03 PageHeader; P6.1)', () => {
  const ORNEK = ['', 'gelir-plani/', 'nakit-akisi/', 'giderler/', 'parametreler/', 'roller/saha-uzmani/', 'buyume-modeli/', 'bcg/', 'notlar/', 'partnership/', 'applet/'];
  for (const path of ORNEK) {
    test(`/${path}: tek h1 kırıntı satırında; hero ve üst etiket yok; amaç bir cümle; sıra kırıntı → amaç → içerik`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 480 });
      await page.goto(path);
      await icerik(page);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('.crumbs-row h1.crumbs-title')).toHaveCount(1);
      await expect(page.locator('.hero, .eyebrow, .display, .lead')).toHaveCount(0);
      // Kırıntılı sayfada h1 son kırıntıdır (aria-current="page"); kırıntısız sayfada (ana sayfa, doğrudan erişilen BCG) tek başına.
      // Applet İstihdam grubunda: kırıntı “İstihdam › Ücret ve performans applet’leri” (docs/contents.md F15, 2026-10-28).
      const kirintili = !['', 'bcg/'].includes(path);
      await expect(page.locator('.crumbs li[aria-current="page"] h1')).toHaveCount(kirintili ? 1 : 0);
      await expect(page.locator('.crumbs')).toHaveCount(kirintili ? 1 : 0);
      // Amaç: tek paragraf, en çok bir cümle (rol görevi veridir — src/data değişmez — muaf).
      const amac = page.locator('.page-purpose');
      await expect(page.locator('[data-page-header]')).toHaveCount((await amac.count()) || (await page.locator('.page-intro').count()) ? 2 : 1);
      expect(await amac.count()).toBeLessThanOrEqual(1);
      if ((await amac.count()) && !path.startsWith('roller/')) {
        const text = ((await amac.textContent()) ?? '').trim();
        expect(text.length, 'amaç boş değil').toBeGreaterThan(10);
        // Cümle sonu: nokta/ünlem/soru işaretinden sonra büyük harfle yeni cümle ya da metin sonu (“14. günde” sıra sayısı değil).
        expect((text.match(/[.!?](?=\s+[A-ZÇĞİÖŞÜ“]|\s*$)/g) ?? []).length, `bir cümle: "${text}"`).toBeLessThanOrEqual(1);
      }
      // Sıra: kırıntı satırı → amaç/dönem satırı → ilk içerik; başlık kutusu 320 px’te taşmaz.
      const sira = await page.evaluate(() => {
        const kutular = [...document.querySelectorAll<HTMLElement>('[data-page-header]')].map((el) => el.getBoundingClientRect());
        const kirinti = document.querySelector('.crumbs-row')!.getBoundingClientRect();
        const intro = document.querySelector('.page-intro')?.getBoundingClientRect() ?? null;
        const son = [...document.querySelectorAll<HTMLElement>('[data-page-header]')].pop()!;
        let sonraki = son.nextElementSibling;
        while (sonraki && !(sonraki.getClientRects().length && sonraki.getBoundingClientRect().height > 0)) sonraki = sonraki.nextElementSibling;
        return {
          kutu: kutular.length,
          introAltta: intro ? intro.top >= kirinti.bottom - 1 : true,
          icerikAltta: sonraki ? sonraki.getBoundingClientRect().top >= (intro ?? kirinti).bottom - 1 : true,
          tasma: Math.max(...kutular.map((b) => b.right)) <= window.innerWidth,
        };
      });
      expect(sira.kutu).toBeGreaterThanOrEqual(1);
      expect(sira.introAltta).toBe(true);
      expect(sira.icerikAltta).toBe(true);
      expect(sira.tasma).toBe(true);
    });
  }

  test('dönem/kaynak satırı: gelir planı (dönem, ilk satış, paket) ve nakit akışı (dönem, kaynak) etiketli; h1 kırıntıdan büyük', async ({ page }) => {
    await page.goto('gelir-plani/');
    await icerik(page);
    await expect(page.locator('.crumbs li[aria-current="page"] h1')).toHaveText('Gelir planı');
    const meta = page.locator('.page-meta');
    // Paket fiyatı başlıkta değil (P6.2: ana sonuç 320×480 ilk ekranda kalsın; fiyat “Fiyat” bölümünde).
    await expect(meta.locator('dt')).toHaveText(['Dönem', 'İlk satış']);
    await expect(meta).toContainText('19 Ekim 2026 – Aralık 2027');
    await expect(meta).toContainText('6 Kasım 2026');
    const [baslik, kirinti] = [
      await page.locator('h1').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      await page.locator('.crumbs a').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ];
    expect(baslik).toBeGreaterThan(kirinti * 1.4);
    await page.goto('nakit-akisi/');
    await icerik(page);
    await expect(page.locator('.crumbs li[aria-current="page"] h1')).toHaveText('Nakit akış tablosu');
    await expect(page.locator('.page-meta dt')).toHaveText(['Dönem', 'Kaynak']);
    await expect(page.locator('.page-meta')).toContainText('Ekim 2026 – Aralık 2027');
    // Rol sayfası: simge, ad ve durum aynı kırıntı öğesinde; görev amaç satırında; bilgiler dönem satırında.
    await page.goto('roller/saha-uzmani/');
    await icerik(page);
    const son = page.locator('.crumbs li[aria-current="page"]');
    await expect(son.locator('.avatar')).toHaveCount(1);
    await expect(son.locator('.chip')).toHaveCount(1);
    await expect(page.locator('.page-purpose')).toContainText('İstoç’ta');
    await expect(page.locator('.page-meta dt')).toHaveText(['Kişi', 'Başlangıç', 'Bağlı', 'Ücret', 'Aranan']);
  });

  test('bölüm başlığı: hairline üst çizgi, numara ikincil renkte ve yalnız sıralı sayfalarda (parametreler ve nakit akışında yok)', async ({ page }) => {
    await page.goto('roller/dijital-pazarlama/');
    await icerik(page);
    const heads = page.locator('.section-head');
    expect(await heads.count()).toBeGreaterThanOrEqual(5);
    const st = await heads.first().evaluate((el) => {
      const cs = getComputedStyle(el);
      const idx = el.querySelector<HTMLElement>('.section-index');
      const probe = document.createElement('span');
      probe.style.color = 'var(--text-secondary)';
      el.appendChild(probe);
      const ikincil = getComputedStyle(probe).color;
      probe.remove();
      return { cizgi: parseFloat(cs.borderTopWidth), numara: idx ? getComputedStyle(idx).color : null, ikincil, boyut: idx ? parseFloat(getComputedStyle(idx).fontSize) : 0 };
    });
    expect(st.cizgi, 'kalın üst çizgi yok (en çok hairline)').toBeLessThanOrEqual(1);
    expect(st.numara, 'numara turuncu değil, ikincil metin rengi').toBe(st.ikincil);
    expect(st.boyut).toBeGreaterThanOrEqual(14);
    const numaralar = await page.locator('.section-index').allTextContents();
    expect(numaralar).toEqual(numaralar.map((_, i) => String(i + 1).padStart(2, '0')));
    for (const path of ['parametreler/', 'nakit-akisi/']) {
      await page.goto(path);
      await icerik(page);
      expect(await page.locator('.section-head').count()).toBeGreaterThan(0);
      await expect(page.locator('.section-index')).toHaveCount(0);
      await expect(page.locator('.section-title').first()).toBeVisible();
    }
  });
});

test.describe('hareket', () => {
  test('tüm geçişler onaylı Cubic eğri ve pozitif süreyle; giriş ve çıkış temel öğede', async ({ page }) => {
    for (const path of ['', 'roller/organizator/', 'istihdam/', 'applet/', 'applet/#terfi-kapisi']) {
      await page.goto(path);
      await icerik(page);
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
    await icerik(page);
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
    await icerik(page);
    await hydrated(page);
    const heights = await page
      .locator('.cekmece-tetik, .pager-link, .brand')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    // Menü düğmesi, sunum sırası bağlantıları ve marka; çekmecedeki bağlantılar açılınca.
    expect(heights.length).toBeGreaterThanOrEqual(4);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    await page.getByRole('button', { name: 'Menü', exact: true }).click();
    const cekmece = page.getByRole('dialog', { name: 'Menü' });
    await expect(cekmece).toBeVisible();
    await expect(cekmece.getByRole('link')).toHaveCount(22);
    const linkler = await cekmece.getByRole('link').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(linkler.length).toBe(22);
    expect(Math.min(...linkler)).toBeGreaterThanOrEqual(44);
  });

  test('koyu tema işletim sistemi tercihini izler', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('');
    await icerik(page);
    const scheme = await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'));
    expect(scheme).toBe('dark');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(18, 20, 22)');
  });
});

test.describe('yatay telefon (alçak ekran)', () => {
  test('844×390: İstihdam menüsünün son ögesi (Applet) görünür alanda ve tıklanır', async ({ page }) => {
    const viewport = { width: 844, height: 390 };
    await page.setViewportSize(viewport);
    await page.goto('roller/asistan/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('button', { name: 'İstihdam' }).click();
    const son = page.getByRole('menuitem', { name: 'Applet', exact: true });
    await son.scrollIntoViewIfNeeded();
    const box = await son.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    await expect(page.getByRole('button', { name: 'İstihdam' })).toBeInViewport();
    await son.click();
    await expect(page).toHaveURL(/\/applet\/$/);
  });

  // < 48em: çekmece; alçak ekranda gövde kendi içinde kayar, son bağlantı erişilir ve tıklanır (ux.md §8.6).
  test('667×375: çekmecenin son bağlantısı kaydırılarak görünür alana gelir ve tıklanır', async ({ page }) => {
    const viewport = { width: 667, height: 375 };
    await page.setViewportSize(viewport);
    await page.goto('roller/asistan/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('button', { name: 'Menü', exact: true }).click();
    const cekmece = page.getByRole('dialog', { name: 'Menü' });
    const son = cekmece.getByRole('link', { name: 'Notlar' });
    await son.scrollIntoViewIfNeeded();
    const box = await son.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    const takvim = cekmece.getByRole('link', { name: 'İstihdam takvimi' });
    await takvim.scrollIntoViewIfNeeded();
    await takvim.click();
    await expect(page).toHaveURL(/\/istihdam\/$/);
  });
});

test.describe('dokunmatik cihaz', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } });
  test('kaba işaretçide kontroller en az 48 CSS px', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox mobil emülasyonu desteklemez');
    await page.goto('roller/organizator/');
    await icerik(page);
    const coarse = await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches);
    test.skip(!coarse, 'Bu motor kaba işaretçi emüle etmiyor');
    await hydrated(page);
    const heights = await page
      .locator('.cekmece-tetik, .pager-link')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(48);
    await page.getByRole('button', { name: 'Menü', exact: true }).tap();
    const cekmece = page.getByRole('dialog', { name: 'Menü' });
    await expect(cekmece).toBeVisible();
    const ogeler = await cekmece.getByRole('link').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(ogeler.length).toBe(22);
    expect(Math.min(...ogeler)).toBeGreaterThanOrEqual(48);
    expect((await cekmece.getByRole('button', { name: 'Menüyü kapat' }).boundingBox())!.height).toBeGreaterThanOrEqual(48);
  });
});

test.describe('kenar sistemi (kavisli vurgu kenarı yasak)', () => {
  test('tüm sayfalarda çizgi yalnız düz; değdiği köşeler radiussuz, diğer radiuslar korunur', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await icerik(page);
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
              : el.dataset.edge === 'bottom'
                ? [cs.borderEndStartRadius, cs.borderEndEndRadius]
                : [cs.borderStartStartRadius, cs.borderStartEndRadius];
          if (corners.some((c) => px(c) !== 0)) bad.push(`${name(el)}: köşe ${corners.join(' ')}`);
          if (getComputedStyle(el, '::after').content === 'none') bad.push(`${name(el)}: çizgi yok`);
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
        return { bad };
      });
      expect(result.bad, path).toEqual([]);
    }
  });
});

/**
 * Köşe sözleşmesi (kullanıcı kararı 2026-10-27, docs/ux.md §6.3, UX-26): yüzey, kontrol ve kaplama radiusu 0. Yalnız hap
 * (kısa durum etiketi), anahtar (ikili durum: iz ve topuz) ve yazısız nokta işareti yuvarlaktır; SVG iç geometrisi
 * (grafik noktası, logo) yüzey değildir. Eski “diğer radiuslar korunur” kabulünün yerini alır (§1.3).
 */
test.describe('köşe sözleşmesi (ux.md §6.3)', () => {
  for (const width of [320, 1280]) {
    test(`${width} px: yüzeylerde radius 0; yalnız hap, anahtar ve nokta işareti yuvarlak`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await page.goto(path);
        await icerik(page);
        const bad = await page.evaluate(() => {
          const PILL = '.chip, .opex-state, .opex-pill, .yapiskan-ad, .bcg-flow-chip, .ortak-bolum-program';
          const SWITCH = '.theme-track, .theme-thumb, [role="switch"] *';
          const out: string[] = [];
          for (const el of document.querySelectorAll<HTMLElement>('body *')) {
            if (!el.getClientRects().length || el.closest('svg')) continue;
            const cs = getComputedStyle(el);
            const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map((r) => parseFloat(r) || 0);
            if (!radii.some((r) => r > 0)) continue;
            if (el.matches(PILL) || el.matches(SWITCH)) continue;
            const box = el.getBoundingClientRect();
            const nokta = !el.textContent?.trim() && el.children.length === 0 && Math.abs(box.width - box.height) < 1 && box.width <= 16;
            if (nokta) continue;
            out.push(`${el.tagName.toLowerCase()}.${el.className}: ${radii.join(' ')}`);
          }
          return [...new Set(out)].slice(0, 12);
        });
        expect(bad, `${path}: yüzeyde radius`).toEqual([]);
      }
    });
  }
});

test.describe('tema düğmesi', () => {
  test('açık/koyu geçişi anında, kalıcı ve aria-pressed ile', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('');
    await icerik(page);
    await hydrated(page);
    const toggle = page.locator('[data-theme-toggle]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    // Renk şeması görünüm geçişinin ilk karesinde uygulanır (anlamsal durum, aria-pressed, anında).
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'))).toBe('dark');
    await page.reload();
    await hydrated(page);
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'))).toBe('dark');
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-theme-toggle]').click();
    await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'))).toBe('light');
    const box = await page.locator('[data-theme-toggle]').boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

test.describe('bağımsız bağlantılar ve grafikler', () => {
  test('cümle dışındaki bağlantılar en az 44 CSS px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    for (const path of ['', 'roller/ekip-lideri/', 'istihdam/', 'buyume-modeli/']) {
      await page.goto(path);
      await icerik(page);
      const heights = await page
        .locator('.text-link[data-standalone], .crumbs a, .pager-link')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
      expect(heights.length, path).toBeGreaterThan(0);
      expect(Math.min(...heights), path).toBeGreaterThanOrEqual(44);
    }
  });

  test('takvim ve zaman çizelgesi: Mantine bileşenleri, metin en az 14 px', async ({ page }) => {
    await page.goto('istihdam/');
    await icerik(page);
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
      await icerik(page);
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
      // Bütün grafik sayfalarını tek testte gezer; CI’daki Firefox 320 px’te 30 sn sınırını aşıyordu (zaman aşımı, iddia hatası değil).
      test.slow();
      await page.setViewportSize({ width, height: 800 });
      for (const path of CHART_PAGES) {
        await page.goto(path);
        await icerik(page);
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
      await icerik(page);
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
    await icerik(page);
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
    await icerik(page);
    await hydrated(page);
    // P6.3: gruplar kapalı gelir; alan grubunu açarak erişilir.
    await page.locator('.pgrup h2 button', { hasText: 'Ücret' }).click();
    const salary = page.getByLabel('Saha satış maaşı');
    await salary.fill('70000');
    await expect(salary).toHaveValue(/70\.000/);
    await salary.blur();
    await expect(page.locator('.param-status')).toContainText('1 değer varsayılandan farklı');
    await expect(page.locator('.params-notice')).toBeVisible();

    await page.goto('karar-bekleyenler/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByText('70.000 ₺ maaş / ay').first()).toBeVisible();
    await expect(page.getByText('Kota: ay içinde 140.000 ₺ satış', { exact: false }).first()).toBeVisible();
    await expect(page.locator('.params-notice')).toBeVisible();

    await page.goto('roller/saha-uzmani/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.facts-row')).toContainText('70.000 ₺ maaş');

    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    const reset = page.locator('.param-reset');
    await reset.click();
    await expect(reset).toHaveText('Genel ayarları sıfırla (onayla)');
    await reset.click();
    await expect(page.locator('.param-status')).toContainText('Tüm değerler varsayılan');
    await page.goto('karar-bekleyenler/');
    await icerik(page);
    await hydrated(page);
    await expect(page.getByText('50.000 ₺ maaş / ay').first()).toBeVisible();
    await expect(page.locator('.params-notice')).toHaveCount(0);
  });

  test('tarih parametresi takvimi ve kontrol tarihlerini kaydırır', async ({ page }) => {
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.evaluate(() => localStorage.setItem('istoc-plan-parametreler', JSON.stringify({ startDate: '2026-11-15' })));
    await page.goto('karar-yetkisi/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.data-table').first()).toContainText('13 Ocak');
    await page.evaluate(() => localStorage.removeItem('istoc-plan-parametreler'));
  });

  test('klavye odağı: alan etiketi altı çizili; çevreleyen halka yok', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.locator('.pgrup h2 button', { hasText: 'Takvim' }).click();
    // Panel açılış geçişi bitmeden odak verilemez: alan görünür olunca.
    await expect(page.getByLabel('Program başlangıcı')).toBeVisible();
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

/*
 * ux.md P6.3 (kullanıcı kararı 2026-10-27, §3 “parametre grupları çok alan”, §9 /parametreler/, M13 ParameterGroup, M23
 * ReviewAndReset, UX-14/15): göreve göre aranabilir ve daraltılabilir gruplar; değişiklik özeti (alan, grup, varsayılan →
 * yeni, alana git, tek alanı geri al); “bu tarayıcıda kaydedildi / kaydedilemedi” açık yazım; “varsayılana dön” kapsamı
 * görünür ve geri alınabilir. 320 px’te belge yüksekliği ve görünür girdi sayısı ölçülür (önce 12.683 px, 61 girdi).
 */
test.describe('parametreler: görev grupları, değişiklik özeti, kayıt ve sıfırlama kapsamı (ux.md M13/M23, UX-14/15; P6.3)', () => {
  const alanSayisi = PARAM_GROUPS.reduce((t, g) => t + g.fields.length, 0);
  const gorunurGirdi = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.param-field .param-input')].filter((el) => el.getClientRects().length).length);

  test('320×480: gruplar kapalı gelir, belge kısa; grup açılır; arama alanları ve grupları süzer, sonuç sayısı duyurulur', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    // Gruplar: her PARAM_GROUP bir açılır grup (h2 içinde düğme, aria-expanded, panel region); hepsi kapalı.
    const gruplar = page.locator('.pgrup');
    await expect(gruplar).toHaveCount(PARAM_GROUPS.length);
    for (const g of PARAM_GROUPS) await expect(page.locator('.pgrup').filter({ has: page.locator('h2 button', { hasText: g.title }) })).toHaveCount(1);
    const dugmeler = page.locator('.pgrup h2 button');
    await expect(dugmeler).toHaveCount(PARAM_GROUPS.length);
    for (const b of await dugmeler.all()) await expect(b).toHaveAttribute('aria-expanded', 'false');
    expect(await gorunurGirdi(page), 'kapalı gruplarda görünür girdi yok').toBe(0);
    const yukseklik = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(yukseklik, 'belge yüksekliği 320 px (önce 12.683)').toBeLessThan(4_000);
    // Grup başlığında alan sayısı; dokunma hedefi ≥ 44 px; açılınca yalnız o grubun alanları görünür, panel region.
    const ucret = PARAM_GROUPS.find((g) => g.id === 'ucret')!;
    const ucretDugme = page.locator('.pgrup h2 button', { hasText: ucret.title });
    await expect(ucretDugme).toContainText(`${ucret.fields.length} alan`);
    expect((await ucretDugme.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await ucretDugme.click();
    await expect(ucretDugme).toHaveAttribute('aria-expanded', 'true');
    const panelId = await ucretDugme.getAttribute('aria-controls');
    await expect(page.locator(`#${panelId}`)).toHaveAttribute('role', 'region');
    await expect(page.locator(`#${panelId}`)).toContainText(ucret.desc);
    // Panel açılış geçişi bitince alanlar görünür olur; yük altında tek seferlik sayım erken olabilir (birleştirme QA’sı).
    await expect.poll(() => gorunurGirdi(page), { message: 'açık gruptaki görünür girdi sayısı' }).toBe(ucret.fields.length);
    await expect(page.getByLabel('Saha satış maaşı')).toBeVisible();
    // Arama: etiket, yardım ya da grup adıyla eşleşen alanlar; eşleşmeyen grup ve alanlar gizli; sayı aria-live ile.
    const ara = page.getByRole('searchbox', { name: 'Parametre ara' });
    await ara.fill('maaş');
    const eslesen = PARAM_GROUPS.map((g) => ({ g, f: g.fields.filter((d) => `${d.label} ${d.help ?? ''} ${d.unit ?? ''} ${g.title}`.toLocaleLowerCase('tr-TR').includes('maaş')) })).filter((x) => x.f.length);
    const beklenen = eslesen.reduce((t, x) => t + x.f.length, 0);
    expect(beklenen).toBeGreaterThan(3);
    await expect(page.locator('.param-ara-sonuc')).toContainText(`${beklenen} alan`);
    await expect(page.locator('.param-ara-sonuc')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('.pgrup:visible')).toHaveCount(eslesen.length);
    expect(await gorunurGirdi(page)).toBe(beklenen);
    for (const b of await page.locator('.pgrup:visible h2 button').all()) await expect(b).toHaveAttribute('aria-expanded', 'true');
    await ara.fill('xyzqq');
    await expect(page.locator('.param-ara-sonuc')).toContainText('0 alan');
    await expect(page.locator('.pgrup:visible')).toHaveCount(0);
    await page.getByRole('button', { name: 'Aramayı temizle' }).click();
    await expect(ara).toHaveValue('');
    await expect(page.locator('.pgrup')).toHaveCount(PARAM_GROUPS.length);
    expect(alanSayisi).toBeGreaterThan(50);
  });

  test('değişiklik özeti: alan, grup, varsayılan → yeni; alana git; tek alanı geri al; “bu tarayıcıda kaydedildi” saat ile', async ({ page }) => {
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('.param-status')).toContainText('Tüm değerler varsayılan');
    await expect(page.locator('.param-degisiklikler')).toHaveCount(0);
    await page.locator('.pgrup h2 button', { hasText: 'Ücret' }).click();
    const salary = page.getByLabel('Saha satış maaşı');
    await salary.fill('70000');
    await salary.blur();
    const ozet = page.locator('.param-degisiklikler');
    await expect(ozet).toBeVisible();
    const satir = ozet.locator('li');
    await expect(satir).toHaveCount(1);
    await expect(satir.first()).toContainText('Saha satış maaşı');
    await expect(satir.first()).toContainText('Ücret');
    await expect(satir.first()).toContainText('50.000 ₺');
    await expect(satir.first()).toContainText('70.000 ₺');
    await expect(satir.first()).toContainText('→');
    // Kayıt yazımı: nereye, ne zaman; “Kaydedildi” yalnız gerçekten yapılan tarayıcı kaydı için.
    const durum = page.locator('.param-status');
    await expect(durum).toContainText('1 değer varsayılandan farklı');
    await expect(durum).toContainText(/bu tarayıcıya son kayıt \d{2}:\d{2}:\d{2}/);
    await expect(durum).toContainText('yerel depolama');
    // Grup kapatılıp özetten “alana git”: grup açılır, alan odaklanır.
    await page.locator('.pgrup h2 button', { hasText: 'Ücret' }).click();
    await expect(salary).toBeHidden();
    await satir.first().getByRole('button', { name: /Alana git/ }).click();
    await expect(salary).toBeVisible();
    await expect(salary).toBeFocused();
    // Tek alanı geri al: yalnız o alan varsayılana döner.
    await page.locator('.pgrup h2 button', { hasText: 'Prim ve kota' }).click();
    const prim = page.getByLabel('Satış başına prim');
    await prim.fill('3000');
    await prim.blur();
    await expect(satir).toHaveCount(2);
    await expect(page.locator('.pgrup h2 button', { hasText: 'Prim ve kota' })).toContainText('1 değişiklik');
    await satir.filter({ hasText: 'Saha satış maaşı' }).getByRole('button', { name: /Bu alanı geri al/ }).click();
    await expect(satir).toHaveCount(1);
    await expect(satir.first()).toContainText('Satış başına prim');
    await expect(salary).toHaveValue(/50\.000/);
    await page.evaluate(() => localStorage.removeItem('istoc-plan-parametreler'));
  });

  test('varsayılana dön (UX-14): kapsam onaydan önce yazılı (kaç alan, yalnız bu tarayıcı, neler değişmez); geri al; iki adım', async ({ page }) => {
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.locator('.pgrup h2 button', { hasText: 'Ücret' }).click();
    const salary = page.getByLabel('Saha satış maaşı');
    await salary.fill('70000');
    await salary.blur();
    const reset = page.locator('.param-reset');
    await expect(page.locator('.param-reset-kapsam')).toHaveCount(0);
    await reset.click();
    await expect(reset).toHaveText('Genel ayarları sıfırla (onayla)');
    const kapsam = page.locator('.param-reset-kapsam');
    await expect(kapsam).toBeVisible();
    await expect(kapsam).toContainText('1 alan');
    await expect(kapsam).toContainText('yalnız bu tarayıcı');
    await expect(kapsam).toContainText(/senaryo seçenekleri|notlar|tema/);
    await reset.click();
    await expect(page.locator('.param-status')).toContainText('Tüm değerler varsayılan');
    await expect(salary).toHaveValue(/50\.000/);
    // Geri al: önceki değerler geri gelir (bu tarayıcıda yeniden kaydedilir).
    const geriAl = page.getByRole('button', { name: 'Geri al' });
    await expect(geriAl).toBeVisible();
    await geriAl.click();
    await expect(salary).toHaveValue(/70\.000/);
    await expect(page.locator('.param-status')).toContainText('1 değer varsayılandan farklı');
    await reset.click();
    await reset.click();
    await expect(page.locator('.param-status')).toContainText('Tüm değerler varsayılan');
    await page.evaluate(() => localStorage.removeItem('istoc-plan-parametreler'));
  });

  test('tarayıcı depolaması kapalı (UX-15): “kaydedilemedi”, oturum içi geçerlilik; “kaydedildi” yalanı yok', async ({ page }) => {
    await page.addInitScript(() => {
      const asil = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (k === 'istoc-plan-parametreler') throw new Error('depolama kapalı');
        return asil.call(this, k, v);
      };
    });
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.locator('.pgrup h2 button', { hasText: 'Ücret' }).click();
    const salary = page.getByLabel('Saha satış maaşı');
    await salary.fill('70000');
    await salary.blur();
    const durum = page.locator('.param-status');
    await expect(durum).toContainText('kaydedilemedi');
    await expect(durum).toContainText(/yalnız bu sekme|bu sayfa açıkken/);
    await expect(durum).not.toContainText(/(^|[^e])kaydedildi/);
    await expect(durum).toContainText('1 değer varsayılandan farklı');
    // Değişiklik yine uygulanır (oturum içi geçerli): özet ve not görünür.
    await expect(page.locator('.param-degisiklikler li')).toHaveCount(1);
    await expect(page.locator('.params-notice')).toBeVisible();
  });
});

test.describe('BCG eğitimi', () => {
  test('dört kutu matrisi, nakit döngüsü ve örnek balon matrisi Türkçe; matris yerleşimi klasik', async ({ page }) => {
    await page.goto('bcg/');
    await icerik(page);
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
    await icerik(page);
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
    await icerik(page);
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
    // gorsel_algi.md F12 (2026-10-28): düzenleyici çok satırlı; Enter satır ekler, Kaydet düğmesi (ya da Ctrl/Cmd+Enter) kaydeder.
    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.locator('.note-row', { hasText: 'Prim sistemi: kurallar' })).toHaveCount(1);

    // Sil (iki adım)
    const target = page.locator('.note-row', { hasText: 'Prim sistemi: kurallar' });
    await target.getByRole('button', { name: 'Sil' }).click();
    await target.getByRole('button', { name: /^Notu sil \(onayla\)/ }).click();
    await expect(page.locator('.note-row', { hasText: 'Prim sistemi: kurallar' })).toHaveCount(0);

    // Varsayılana dön
    const reset = page.getByRole('button', { name: 'Varsayılan notlara dön' });
    await reset.click();
    await page.getByRole('button', { name: 'Varsayılan notlara dön (onayla)' }).click();
    await expect(page.locator('.note-row', { hasText: 'Prim sistemi eklemeli' })).toHaveCount(1);
    expect(await page.evaluate(() => localStorage.getItem('istoc-plan-notlar'))).toBeNull();
  });

  test('klavye: not kutusu odakta metnin altı çizili; çevreleyen halka yok', async ({ page, browserName }) => {
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.goto('notlar/');
    await icerik(page);
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

/*
 * ux_v2.md §3.4 / §5.2 (kullanıcı kararı 2026-10-28, V2-D): sayı alanında ara yazım (`0,`) engellenmez, geçersiz taslak
 * hesap değeriyle karışmaz, odaktan çıkınca sınıra çekilir (M14 Field); “varsayılana dön” onayı süreye bağlı değildir
 * (WCAG 2.2.1): ikinci basış uygular, “Vazgeç” iptal eder, bekleyen kullanıcı dışlanmaz.
 */
test.describe('parametreler: ara yazım ve süreye bağlı olmayan sıfırlama onayı (ux_v2 §3.4)', () => {
  test('`0,` yazılabilir; odaktan çıkınca alt sınıra çekilir; onay 5 sn sonra da durur; Vazgeç iptal eder; ikinci basış uygular', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    await page.getByRole('searchbox', { name: 'Parametre ara' }).fill('İşveren maliyeti çarpanı');
    const alan = page.getByLabel('İşveren maliyeti çarpanı');
    await expect(alan).toBeVisible();
    const varsayilan = await alan.inputValue();
    // Önce alan boşaltılır (yük altında tümünü seç ile yazım yarışıyordu: “20,”), sonra ara yazım harf harf.
    await alan.click();
    await alan.fill('');
    await alan.pressSequentially('0,');
    // Ara yazım taslakta kalır; alt sınır (1) henüz dayatılmaz.
    expect(await alan.inputValue()).toMatch(/^0,/);
    await alan.press('Tab');
    expect(parseFloat((await alan.inputValue()).replace(/[^\d,]/g, '').replace(',', '.'))).toBeGreaterThanOrEqual(1);
    // Geçerli değişiklik: 3 → “Varsayılanlara dön” etkin.
    await alan.click();
    await alan.fill('');
    await alan.pressSequentially('3');
    await alan.press('Tab');
    expect(await alan.inputValue()).not.toBe(varsayilan);
    const sifirla = page.getByRole('button', { name: /Varsayılanlara dön|Genel ayarları sıfırla/ });
    await sifirla.click();
    await expect(sifirla).toHaveText('Genel ayarları sıfırla (onayla)');
    await page.waitForTimeout(5000);
    await expect(sifirla, 'onay süreye bağlı değil').toHaveText('Genel ayarları sıfırla (onayla)');
    await page.getByRole('button', { name: 'Vazgeç' }).click();
    await expect(sifirla).toHaveText('Varsayılanlara dön');
    expect(await alan.inputValue()).not.toBe(varsayilan);
    await sifirla.click();
    await sifirla.click();
    await expect(sifirla).toHaveText('Varsayılanlara dön');
    expect(await alan.inputValue()).toBe(varsayilan);
    await page.evaluate(() => localStorage.removeItem('istoc-plan-parametreler'));
  });
});

/* ---------- Parametre kaydı doğrulaması sayfada (docs/missings.md MS-05 / T05; B6-öncü, 2026-10-28) ---------- */

test.describe('parametre kaydı doğrulaması — sayfada (MS-05)', () => {
  test('kayıtlı geçersiz parametreler varsayılana döner ve Parametreler sayfasında alan adıyla bildirilir; ham kayıt ilk yazıma kadar korunur', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('istoc-plan-parametreler', JSON.stringify({ subscriptionEur: -1, startDate: 'not-a-date', sahaSalary: 55000 })));
    await page.goto('parametreler/');
    await icerik(page);
    await hydrated(page);
    const not = page.locator('.param-gecersiz');
    await expect(not).toHaveCount(1);
    await expect(not).toContainText(/2 kayıtlı değer geçersiz/);
    await expect(not).toContainText('Aktif satıcı aboneliği');
    await expect(not).toContainText('Program başlangıcı');
    await expect(not).toContainText('varsayılan');
    // Model geçerli olanı kullanır: yalnız saha maaşı varsayılandan farklı.
    await expect(page.locator('.param-status')).toContainText('1 değer varsayılandan farklı');
    expect(await page.evaluate(() => localStorage.getItem('istoc-plan-parametreler'))).toContain('not-a-date');
    await page.evaluate(() => localStorage.removeItem('istoc-plan-parametreler'));
  });
});
