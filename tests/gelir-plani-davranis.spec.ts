import { expect, test, type Page } from './fixtures/persona';
import { readFileSync } from 'node:fs';
import { computeBreakeven, defaultFilters, inputsOf, type Breakeven, type BreakevenFilters } from '../src/data/breakeven';
import { buildModel } from '../src/data/model';
import { parseReply, type OpexModel } from '../src/data/opex';
import { DEFAULT_PARAMS as P } from '../src/data/params';
import { simulate } from '../src/data/revenue';
import { staffScenario } from '../src/data/staffing';
import { longDate, shortDate } from '../src/lib/dates';
import { SCENARIO_KEY, type ScenarioId } from '../src/lib/scenario';
import { OPTIONS_KEY, presetOptions, presetsOf } from '../src/lib/scenarioOptions';
import { buildModel as opexOrnegi, reply } from './opex-fixture';

/**
 * Gelir planı (/gelir-plani/) davranış testleri. Beklenen değerler sayfanın kullandığı model işlevlerinden hesaplanır
 * (computeBreakeven, simulate, staffScenario). Sayfadan okunan sayı bu değerlerle karşılaştırılır.
 * Kapsam: CSV dosyalarının içeriği, “Seçeneklerin etkisi” tablosunun Fark sütunu, 90 gün kararı, yıllık peşin tablosu,
 * başabaş noktası, adres çubuğundaki seçenekler, bozuk kayıt, iki sekme ve Sheets verisiyle başabaş.
 * gelir.spec.ts sayfanın yapısını denetler. Bu dosya o testleri tekrarlamaz.
 */

const M = buildModel(P);
const R = M.revenue;
const H = R.months.length;
const SON = R.months[H - 1].iso.slice(0, 4);
const D = defaultFilters(P);
const PRESETS = presetsOf(P);

/** Sheets yanıtı sayfanın gördüğü biçimde: JSON’a çevrilir, sonra sayfanın ayrıştırıcısıyla okunur. */
const OPEX_YANITI = reply(opexOrnegi(), 'ozet-1');
const OPEX = (() => {
  const x = parseReply(JSON.parse(JSON.stringify(OPEX_YANITI)));
  if (x.kind !== 'data') throw new Error('örnek Sheets yanıtı okunamadı');
  return x.data.model;
})();

/** Sayfanın hesabı: seçili temel senaryo ve seçenekler; Fark sütununun temeli aynı gider kaynağıyla hazır senaryodur. */
function hesap(base: ScenarioId, degisen: Partial<BreakevenFilters> = {}, opex: OpexModel | null = null) {
  const opts: BreakevenFilters = { ...D, ...degisen };
  const be = computeBreakeven(P, M, R, base, opts, opex);
  const be0 = computeBreakeven(P, M, R, base, { ...D, kaynak: opts.kaynak }, opex);
  const inputs = inputsOf(P, R, base, opts);
  return { opts, be, be0, inputs, sim: be.sim };
}

/** Yuvarlama kuralı: yarım değer sıfırdan uzağa gider (eksi ve artı aynı). */
const yuvarla = (v: number) => Math.sign(v) * Math.round(Math.abs(v));
const TAM = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
/** Tutar: “1.234 ₺”; sıfıra yuvarlanan değer “0 ₺” olur, “-0 ₺” olmaz. */
const para = (v: number) => {
  const r = yuvarla(v);
  return `${r === 0 ? '0' : TAM.format(r)} ₺`;
};
/** Fark sütunu: işaret + tutar; yuvarlanınca sıfır kalan fark “0 ₺” olur (“+0 ₺” olmaz). Eksi işareti “−” (U+2212). */
const farkPara = (a: number, b: number) => {
  const r = yuvarla(b - a);
  return r === 0 ? '0 ₺' : `${r > 0 ? '+' : '−'}${TAM.format(Math.abs(r))} ₺`;
};
const farkAdet = (a: number, b: number) => {
  const r = yuvarla(b - a);
  return r === 0 ? '0' : `${r > 0 ? '+' : '−'}${TAM.format(Math.abs(r))}`;
};
const farkGun = (a: { date: string } | null, b: { date: string } | null) =>
  a && b && a.date === b.date ? 'Aynı' : `${a ? shortDate(a.date) : 'yok'} → ${b ? shortDate(b.date) : 'yok'}`;
const hedefGunu = (d: string | null) => (d ? longDate(d) : `${SON} sonuna kadar ulaşılmıyor`);

/* ---------- Sayfa yardımcıları ---------- */

/** Sheets isteği boş yanıtla kapanır: gider kaynağı plan kadrosuna düşer (gelir.spec.ts ile aynı). */
async function sheetsYok(page: Page) {
  await page.route('https://script.google.com/**', (route) => {
    if (route.request().postData()?.includes('"service":"persona"')) return route.fallback();
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' });
  });
}

/** Sheets isteği kurgusal örnek veriyle yanıtlanır (tests/opex-fixture.ts). */
async function sheetsHazir(page: Page) {
  await page.route('https://script.google.com/**', (route) => {
    if (route.request().postData()?.includes('"service":"persona"')) return route.fallback();
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(OPEX_YANITI) });
  });
}

const kayitliSecenekler = (page: Page) => page.evaluate((k) => localStorage.getItem(k), OPTIONS_KEY);

/** Sayfayı açar; hidrasyonu ve senaryo seçeneklerinin ilk yazımını bekler. */
async function ac(page: Page, sorgu = '') {
  await page.goto(`gelir-plani/${sorgu}`);
  await page.waitForSelector('.app-footer', { state: 'attached' });
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect
    .poll(async () => {
      const raw = await kayitliSecenekler(page);
      try {
        return raw !== null && typeof JSON.parse(raw) === 'object';
      } catch {
        return false;
      }
    })
    .toBe(true);
}

const tabloBlok = (page: Page, id: string) => page.locator(`.table-block:has(#${id}-tablo)`);

/** Tablonun satırları: [satır başlığı, hücre 1, hücre 2, …]; boşluklar tek boşluğa indirilir. */
async function satirlar(page: Page, id: string): Promise<string[][]> {
  const blok = tabloBlok(page, id);
  await expect(blok).toHaveAttribute('data-kabuk', 'tablo');
  return blok.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll('th, td')].map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())));
}

async function csvIndir(page: Page, id: string) {
  const dugme = tabloBlok(page, id).getByRole('button', { name: 'Tabloyu indir (CSV dosyası)' });
  await dugme.scrollIntoViewIfNeeded();
  const [indirme] = await Promise.all([page.waitForEvent('download'), dugme.click()]);
  return { ad: indirme.suggestedFilename(), bayt: readFileSync((await indirme.path())!) };
}

/** Excel’in okuduğu gibi: “;” ayırıcı, CRLF satır sonu, çift tırnak kaçışı. Tırnak dışında tek başına LF ya da CR hata sayılır. */
function csvOku(metin: string): string[][] {
  const satirlar: string[][] = [];
  let satir: string[] = [];
  let hucre = '';
  let tirnak = false;
  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    if (tirnak) {
      if (c === '"' && metin[i + 1] === '"') {
        hucre += '"';
        i++;
      } else if (c === '"') tirnak = false;
      else hucre += c;
    } else if (c === '"') tirnak = true;
    else if (c === ';') {
      satir.push(hucre);
      hucre = '';
    } else if (c === '\r' && metin[i + 1] === '\n') {
      satir.push(hucre);
      satirlar.push(satir);
      satir = [];
      hucre = '';
      i++;
    } else if (c === '\r' || c === '\n') throw new Error(`tırnak dışında CRLF olmayan satır sonu (konum ${i})`);
    else hucre += c;
  }
  satir.push(hucre);
  satirlar.push(satir);
  return satirlar;
}

/** CSV dosyasını denetler: UTF-8 BOM, CRLF, “;”; BOM’suz metni satırlara ayırır. */
function csvDenetle(bayt: Buffer) {
  expect([...bayt.subarray(0, 3)], 'UTF-8 BOM').toEqual([0xef, 0xbb, 0xbf]);
  const metin = bayt.toString('utf8').slice(1);
  expect(metin).not.toContain('﻿');
  return csvOku(metin);
}

/** CSV hücresindeki sayı: Türkçe virgül ya da nokta ondalığı kabul edilir (değer denetimi ayırıcıdan bağımsızdır). */
const sayiOku = (hucre: string) => Number(hucre.replace(',', '.'));
/** Hücre modeldeki sayıya yazılan duyarlıkla eşit mi: ±yarım birim. */
function yakin(hucre: string, beklenen: number, birim: number, ad: string) {
  const v = sayiOku(hucre);
  expect(Number.isFinite(v), `${ad}: “${hucre}” sayı değil`).toBe(true);
  expect(Math.abs(v - beklenen), `${ad}: CSV ${hucre}, model ${beklenen}`).toBeLessThanOrEqual(birim / 2 + 1e-9);
}

/** Aylık CSV satırlarını modelle karşılaştırır (gelir planı ve başabaş tablosunun dışa aktarımı aynı dosyadır). */
function aylikCsvModelle(satirlar: string[][], be: Breakeven) {
  expect(satirlar).toHaveLength(H + 1);
  expect(satirlar[0][0]).toBe('Ay');
  expect(satirlar[0]).toHaveLength(9);
  R.months.forEach((ay, t) => {
    const s = satirlar[t + 1];
    expect(s, `${ay.ad} satırı`).toHaveLength(9);
    expect(s[0]).toBe(ay.ad);
    yakin(s[1], be.sim.yeniAktif[t], 0.1, `${ay.ad} yeni aktif`);
    yakin(s[2], be.sim.kayit[t], 1, `${ay.ad} kayıt`);
    yakin(s[3], be.sim.odeyen[t], 1, `${ay.ad} ödeyen`);
    yakin(s[4], be.sim.gelir[t], 1, `${ay.ad} aylık gelir`);
    yakin(s[5], be.sim.kumulatif[t], 1, `${ay.ad} kümülatif gelir`);
    yakin(s[6], be.gider[t], 1, `${ay.ad} aylık gider`);
    yakin(s[7], be.net[t], 1, `${ay.ad} net`);
    yakin(s[8], be.kumNet[t], 1, `${ay.ad} kümülatif net`);
  });
}

test.describe('gelir planı davranışı', () => {
  test('aylık CSV: BOM, ";" ve CRLF; değerler modelle aynı; başabaş tablosu aynı dosyayı verir', async ({ page }) => {
    await sheetsYok(page);
    await ac(page);
    const { be } = hesap('medyan');
    const aylik = await csvIndir(page, 'aylik');
    expect(aylik.ad).toBe('gelir-plani-aylik-medyan.csv');
    aylikCsvModelle(csvDenetle(aylik.bayt), be);
    // Başabaş bölümündeki “Ay ay” tablosunun düğmesi aynı aylık dosyayı indirir.
    const basabas = await csvIndir(page, 'basabas-aylar');
    expect(basabas.ad).toBe('gelir-plani-aylik-medyan.csv');
    expect(basabas.bayt.equals(aylik.bayt)).toBe(true);
  });

  test('kadro CSV (seçili senaryo görünümü): roller ve değerler modelle aynı', async ({ page }) => {
    await sheetsYok(page);
    await ac(page, '?senaryo=kotumser');
    const { inputs } = hesap('kotumser');
    const st = staffScenario(P, M, R, R.byId.kotumser.scenario, inputs);
    const dosya = await csvIndir(page, 'katki');
    expect(dosya.ad).toBe('gelir-plani-kadro-kotumser.csv');
    const satirlar = csvDenetle(dosya.bayt);
    expect(satirlar).toHaveLength(st.rows.length + 1);
    expect(satirlar[0][0]).toBe('Rol');
    expect(satirlar[0]).toHaveLength(10);
    st.rows.forEach((x, i) => {
      const s = satirlar[i + 1];
      const ad = x.role.name;
      expect(s, ad).toHaveLength(10);
      // Metin hücreleri (görev ve katkı yolu “;”, tırnak ya da satır sonu içerebilir) çözülünce aynen geri gelir.
      expect(s.slice(0, 4)).toEqual([x.role.name, x.role.gorev, x.role.katkiYolu, x.role.startIso]);
      yakin(s[4], x.role.maliyet, 0, `${ad} aylık maliyet`);
      yakin(s[5], x.gider, 1, `${ad} gider`);
      yakin(s[6], x.aktif, 0.1, `${ad} yeni aktif`);
      if (x.dogrudan) yakin(s[7], x.katki, 1, `${ad} katkı`);
      else expect(s[7], `${ad} dolaylı katkı boş`).toBe('');
      yakin(s[8], x.net, 1, `${ad} net`);
      if (x.oran === null) expect(s[9], `${ad} oran yok`).toBe('');
      else yakin(s[9], x.oran, 0, `${ad} katkı ÷ gider`);
    });
  });

  test('CSV ondalık sayıları Türkçe Excel için virgülle yazar', async ({ page }) => {
    // Dosya “;” ile ayrılır (Türkçe Excel varsayılanı). Türkçe Excel “26.5” değerini sayı olarak okumaz; ondalık “26,5” olmalı.
    await sheetsYok(page);
    await ac(page);
    const hucreler = [...csvDenetle((await csvIndir(page, 'aylik')).bayt), ...csvDenetle((await csvIndir(page, 'katki')).bayt)].flat();
    const ondalik = hucreler.filter((h) => /^-?\d+[.,]\d+$/.test(h));
    // Model ondalıklı değer üretir (ör. yeni aktif 26,5; katkı ÷ gider 8,16). Denetim boş geçmesin.
    expect(ondalik.length).toBeGreaterThan(0);
    expect(ondalik.filter((h) => h.includes('.')), 'noktalı ondalık hücreler').toEqual([]);
  });

  const etkiDurumlari: { ad: string; sorgu: string; base: ScenarioId; degisen: Partial<BreakevenFilters> }[] = [
    { ad: 'değişiklik yok', sorgu: '', base: 'medyan', degisen: {} },
    { ad: '1 ek saha personeli', sorgu: '?senaryo=medyan&eksaha=1', base: 'medyan', degisen: { extraSaha: 1 } },
    { ad: 'ayda 100.000 ₺ ek sabit gider', sorgu: '?senaryo=medyan&eksabit=100000', base: 'medyan', degisen: { ekSabit: 100_000 } },
    { ad: 'kötümser, %80 kapasite, reklamsız', sorgu: '?senaryo=kotumser&kapasite=0.8&reklam=0', base: 'kotumser', degisen: { factor: 0.8, dijitalBudgetFactor: 0 } },
  ];
  for (const durum of etkiDurumlari) {
    test(`“Seçeneklerin etkisi” Fark sütunu modelle aynı: ${durum.ad}`, async ({ page }) => {
      await sheetsYok(page);
      await ac(page, durum.sorgu);
      const { be, be0 } = hesap(durum.base, durum.degisen);
      const enYuksek = (x: Breakeven) => Math.min(0, x.enDusuk.deger);
      const aktif = (x: Breakeven) => x.sim.kumAktif[H - 1];
      const beklenen = [
        [para(be0.toplam.gelir), para(be.toplam.gelir), farkPara(be0.toplam.gelir, be.toplam.gelir)],
        [para(be0.toplam.gider), para(be.toplam.gider), farkPara(be0.toplam.gider, be.toplam.gider)],
        [para(be0.toplam.net), para(be.toplam.net), farkPara(be0.toplam.net, be.toplam.net)],
        [TAM.format(yuvarla(aktif(be0))), TAM.format(yuvarla(aktif(be))), farkAdet(aktif(be0), aktif(be))],
        [null, null, farkGun(be0.ongoru.nokta, be.ongoru.nokta)],
        [null, null, farkGun(be0.ongoru.geriOdeme, be.ongoru.geriOdeme)],
        [para(enYuksek(be0)), para(enYuksek(be)), farkPara(enYuksek(be0), enYuksek(be))],
      ];
      const tablo = await satirlar(page, 'filtre-etkisi');
      expect(tablo).toHaveLength(beklenen.length);
      tablo.forEach((satir, i) => {
        const [, temel, secili, fark] = satir;
        const [bTemel, bSecili, bFark] = beklenen[i];
        if (bTemel !== null) expect(temel, `${satir[0]}: hazır senaryo`).toBe(bTemel);
        if (bSecili !== null) expect(secili, `${satir[0]}: seçili senaryo`).toBe(bSecili);
        expect(fark, `${satir[0]}: Fark`).toBe(bFark);
        // Yuvarlanınca sıfır kalan fark işaret almaz.
        expect(fark, `${satir[0]}: işaretli sıfır`).not.toMatch(/^[+−-]0( ₺)?$/);
      });
      if (durum.degisen.ekSabit) {
        // Elle çıkan sonuç: ek sabit gider her aya eklenir. Gelir ve satıcı sayısı değişmez.
        const ek = durum.degisen.ekSabit * H;
        expect(tablo[0][3]).toBe('0 ₺');
        expect(tablo[1][3]).toBe(`+${TAM.format(ek)} ₺`);
        expect(tablo[2][3]).toBe(`−${TAM.format(ek)} ₺`);
        expect(tablo[3][3]).toBe('0');
      }
      if (!durum.sorgu) {
        expect(tablo.map((s) => s[3])).toEqual(['0 ₺', '0 ₺', '0 ₺', '0', 'Aynı', 'Aynı', '0 ₺']);
      }
    });
  }

  test('90 gün kararı (Evet / Hayır) ve hedef günü modelle aynı', async ({ page }) => {
    await sheetsYok(page);
    const durumlar = [
      { sorgu: '', base: 'medyan' as ScenarioId, degisen: {} },
      { sorgu: '?senaryo=iyimser&eksaha=3&saha2=2026-12-01', base: 'iyimser' as ScenarioId, degisen: { extraSaha: 3, secondSahaIso: '2026-12-01' } },
    ].map((d) => {
      const hedef = hesap(d.base, d.degisen).sim.milestones.find((x) => x.id === 'aktif100')!;
      return { ...d, hedef, evet: !!hedef.date && hedef.date <= R.planDay90 };
    });
    // İki durum farklı karar vermeli; yoksa test kararı ayırt etmez.
    expect(durumlar.map((d) => d.evet)).toEqual([false, true]);
    for (const d of durumlar) {
      await ac(page, d.sorgu);
      const not = page.locator('#hedefler').getByRole('complementary').filter({ has: page.locator('strong') });
      await expect(not).toHaveCount(1);
      await expect(not.locator('strong').first()).toHaveText(d.evet ? /^Evet(?!\p{L})/u : /^Hayır(?!\p{L})/u);
      await expect(not).toContainText(longDate(d.hedef.date!));
      await expect(not).toContainText(longDate(R.planDay90));
    }
  });

  test('“Yıllık peşin payının etkisi” tablosu modelle aynı; pay %0 iken iki satır eşit', async ({ page }) => {
    await sheetsYok(page);
    for (const [sorgu, pay] of [['', null], ['?yillikpay=0.4', 0.4], ['?yillikpay=0', 0]] as const) {
      await ac(page, sorgu);
      const { sim, inputs } = hesap('medyan', pay === null ? {} : { annualShare: pay });
      const aylik = simulate(P, M, R.months, { ...inputs, annualShare: 0 });
      const gelir3m = (ms: typeof sim.milestones) => ms.find((x) => x.id === 'gelir3m')!.date;
      const tablo = await satirlar(page, 'yillik-etki');
      expect(tablo.map((s) => s.slice(1))).toEqual([
        [hedefGunu(gelir3m(sim.milestones)), para(sim.kumulatif[2]), para(sim.kumulatif[11])],
        [hedefGunu(gelir3m(aylik.milestones)), para(aylik.kumulatif[2]), para(aylik.kumulatif[11])],
      ]);
      if (pay === 0) expect(tablo[0].slice(1)).toEqual(tablo[1].slice(1));
      if (pay === 0.4) expect(tablo[0].slice(1), 'yıllık peşin pay sonucu değiştirir').not.toEqual(tablo[1].slice(1));
    }
  });

  test('“Başabaş noktası” adedi, ulaşılan gün ve aylık başabaş modelle aynı', async ({ page }) => {
    await sheetsYok(page);
    for (const base of ['medyan', 'kotumser'] as ScenarioId[]) {
      await ac(page, `?senaryo=${base}`);
      const { be } = hesap(base);
      expect(be.adet.nokta, 'model başabaş adedi verir').not.toBeNull();
      const stat = (etiket: string) => page.locator('#basabas .stat').filter({ has: page.locator('dt', { hasText: new RegExp(`^${etiket}$`) }) });
      await expect(stat('Başabaş noktası').locator('.stat-value')).toHaveText(`${Math.ceil(be.adet.nokta!)} ödeyen satıcı`);
      if (be.adet.ulasir) await expect(stat('Başabaş noktası').locator('.stat-note')).toContainText(shortDate(be.adet.ulasir.date));
      expect(be.nokta, 'model dönem içinde aylık başabaş verir').not.toBeNull();
      await expect(stat('Aylık başabaş').locator('.stat-value')).toHaveText(shortDate(be.nokta!.date));
      await expect(stat('En yüksek birikmiş açık').locator('.stat-value')).toHaveText(para(Math.min(0, be.enDusuk.deger)));
    }
  });

  // Seçeneklerin geçerli aralığı: kapasite çarpanı eksi olamaz; elde tutma ve yıllık peşin payı 0 ile 1 arasıdır
  // (src/data/breakeven.ts BreakevenFilters: annualShare “0–1”). Boş değer “verilmedi” sayılır.
  const gecersizler: { sorgu: string; alan: 'factor' | 'retention' | 'annualShare'; gecerli: (v: unknown) => boolean; kural: string }[] = [
    { sorgu: 'kapasite=-5', alan: 'factor', gecerli: (v) => v === null || (typeof v === 'number' && v >= 0), kural: 'kapasite eksi olamaz' },
    { sorgu: 'eldetutma=2', alan: 'retention', gecerli: (v) => v === null || (typeof v === 'number' && v >= 0 && v <= 1), kural: 'elde tutma %100’ü geçemez' },
    { sorgu: 'kapasite=', alan: 'factor', gecerli: (v) => v === null, kural: 'boş değer 0 sayılmaz, yok sayılır' },
    { sorgu: 'yillikpay=5', alan: 'annualShare', gecerli: (v) => typeof v === 'number' && v >= 0 && v <= 1, kural: 'yıllık peşin payı %100’ü geçemez' },
  ];
  for (const g of gecersizler) {
    test(`adres çubuğu: “?${g.sorgu}” olduğu gibi kabul edilmez ve saklanmaz (${g.kural})`, async ({ page }) => {
      await sheetsYok(page);
      await ac(page, `?senaryo=medyan&${g.sorgu}`);
      const kayit = JSON.parse((await kayitliSecenekler(page))!) as Record<string, unknown>;
      expect(g.gecerli(kayit[g.alan]), `saklanan ${g.alan}: ${JSON.stringify(kayit[g.alan])}`).toBe(true);
      // Sayfa adresi yeniden yazılır; geçersiz değer adreste kalmaz.
      expect(new URL(page.url()).search).not.toContain(g.sorgu.endsWith('=') ? `${g.sorgu}0` : g.sorgu);
    });
  }

  test('bozuk seçenek kaydı “kayıtlı” göstermez; geçerli kayıt gösterir', async ({ page, context }) => {
    // Karşı deneme önce: geçerli bir kayıt “kayıtlı” gösterir. Böylece test iki durumu ayırt eder.
    const ikinci = await context.newPage();
    await sheetsYok(ikinci);
    const saha = presetOptions(P, PRESETS.find((x) => x.id === 'saha')!);
    await ikinci.addInitScript(([k, v]) => localStorage.setItem(k, v), [OPTIONS_KEY, JSON.stringify(saha)] as const);
    await ac(ikinci);
    await expect(ikinci.locator('.yapiskan .yapiskan-ad')).toHaveText('Saha ağırlıklı');
    await expect(ikinci.locator('.kurucu .kayit-durumu')).toHaveAttribute('data-durum', 'kayitli');
    await ikinci.close();
    // Bozuk kayıt: JSON okunamaz, sayfa varsayılan seçenekleri kullanır. “Kayıt önceki oturumdan kaldı” denmemeli.
    await sheetsYok(page);
    await page.addInitScript((k) => localStorage.setItem(k, '{bozuk'), OPTIONS_KEY);
    await ac(page);
    await expect(page.locator('.yapiskan .yapiskan-ad')).toHaveText('Plan');
    await expect(page.locator('.kurucu .kayit-durumu')).not.toHaveAttribute('data-durum', 'kayitli');
  });

  const hazirDugme = (page: Page, ad: string) => page.locator('.kurucu').getByRole('group', { name: 'Hazır senaryolar' }).getByRole('button', { name: ad, exact: true });

  test('iki sekme: temel senaryo değişince öteki sekme storage olayıyla aynı senaryoya geçer', async ({ page, context }) => {
    await sheetsYok(page);
    await ac(page);
    const b = await context.newPage();
    await sheetsYok(b);
    await ac(b);
    await expect(page.locator('.yapiskan .yapiskan-ad')).toHaveText('Plan');
    await hazirDugme(b, 'Kötümser').click();
    await expect(b.locator('.yapiskan .yapiskan-ad')).toHaveText('Kötümser');
    await expect(page.locator('.yapiskan .yapiskan-ad')).toHaveText('Kötümser');
    // Öteki sekmenin sayıları da yeni senaryoyla hesaplanır.
    const { be } = hesap('kotumser');
    await expect(page.locator('#basabas .stat').filter({ has: page.locator('dt', { hasText: /^Başabaş noktası$/ }) }).locator('.stat-value')).toHaveText(`${Math.ceil(be.adet.nokta!)} ödeyen satıcı`);
    expect(await page.evaluate((k) => localStorage.getItem(k), SCENARIO_KEY)).toBe('kotumser');
  });

  test('iki sekme: bir sekmede seçilen hazır senaryo öteki sekme yüzünden kaybolmaz', async ({ page, context }) => {
    await sheetsYok(page);
    await ac(page);
    const b = await context.newPage();
    await sheetsYok(b);
    await ac(b);
    // B sekmesi “Yatırımlı büyüme” seçer: temel senaryo iyimser olur, seçenekler değişir.
    const yatirimli = PRESETS.find((x) => x.id === 'yatirimli')!;
    await hazirDugme(b, yatirimli.name).click();
    await expect(b.locator('.yapiskan .yapiskan-ad')).toHaveText(yatirimli.name);
    // A sekmesi temel senaryo değişikliğini storage olayıyla alır.
    await expect(page.locator('.yapiskan .yapiskan-ad')).not.toHaveText('Plan');
    // İki sekme aynı senaryoyu göstermeli. A sekmesi temel senaryoyu B’den, seçenekleri kendinden alırsa
    // kimsenin seçmediği karışık bir senaryo gösterir. Bu denetim yumuşaktır; kayıt denetimi aşağıda yine çalışır.
    await expect.soft(page.locator('.yapiskan .yapiskan-ad')).toHaveText(yatirimli.name);
    // Son seçim B sekmesinindir. Yeni açılan sekme (ve Nakit akışı) tarayıcı kaydını okur; kayıt bu seçimi korumalı.
    // A sekmesi storage olayından sonra kendi eski seçeneklerini yazarsa B’nin seçimi kaybolur.
    const c = await context.newPage();
    await sheetsYok(c);
    await ac(c);
    await expect(c.locator('.yapiskan .yapiskan-ad')).toHaveText(yatirimli.name);
    expect(JSON.parse((await kayitliSecenekler(c))!)).toEqual(presetOptions(P, yatirimli));
    expect(await c.evaluate((k) => localStorage.getItem(k), SCENARIO_KEY)).toBe(yatirimli.base);
  });

  test('Sheets verisi gelince başabaş Sheets giderleriyle hesaplanır; kaynak notu Google Sheets der', async ({ page }) => {
    await sheetsHazir(page);
    const { be } = hesap('medyan', {}, OPEX);
    const plan = hesap('medyan', {}, null).be;
    // Örnek Sheets giderleri plan kadrosundan farklı olmalı; yoksa test kaynağı ayırt etmez.
    expect(be.kaynak).toBe('sheets');
    expect(be.sabit).not.toEqual(plan.sabit);
    await ac(page);
    const tablo = () => satirlar(page, 'basabas-aylar');
    // Veri gelince tablo yeniden hesaplanır: “Sabit gider” sütunu Sheets giderlerini gösterir.
    await expect.poll(async () => (await tablo()).map((s) => s[3])).toEqual(be.sabit.map(para));
    expect((await tablo()).map((s) => s[7])).toEqual(be.kumNet.map(para));
    await expect(page.locator('#basabas').getByRole('status')).toContainText('Sheets');
    await expect(page.locator('#basabas').getByRole('status')).not.toContainText('plan kadrosu');
    await expect(page.locator('.sonuc')).toContainText('Google Sheets');
    const stat = (etiket: string) => page.locator('#basabas .stat').filter({ has: page.locator('dt', { hasText: new RegExp(`^${etiket}$`) }) }).locator('.stat-value');
    expect(be.adet.nokta).not.toBeNull();
    await expect(stat('Başabaş noktası')).toHaveText(`${Math.ceil(be.adet.nokta!)} ödeyen satıcı`);
    await expect(stat('En yüksek birikmiş açık')).toHaveText(para(Math.min(0, be.enDusuk.deger)));
  });
});
