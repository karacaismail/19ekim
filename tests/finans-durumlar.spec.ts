import { expect, test, type Page, type Route } from './fixtures/persona';
import { defaultFilters, inputsOf } from '../src/data/breakeven';
import { buildCashflow, cashSeriesOf, toparlanmaOf } from '../src/data/cashflow';
import { buildModel as siteModel } from '../src/data/model';
import { OPEX_TIMEOUT_MS } from '../src/data/opex';
import { DEFAULT_PARAMS, PARAMS_KEY, type Params } from '../src/data/params';
import { tl } from '../src/lib/format';
import { SCENARIO_KEY, type ScenarioId } from '../src/lib/scenario';
import { diffCount, OPTIONS_KEY, type ScenarioOptions } from '../src/lib/scenarioOptions';
import { buildModel, reply } from './opex-fixture';

/**
 * Sheets gider verisini sayfa açılınca bir kez okuyan sayfalar (useOpexOnce): nakit akışı, gelir planı ve 2027 bütçesi.
 * Yükleniyor, hata ve zaman aşımı durumları ile nakit akışının seçenek notu ve toparlanma durumu. Apps Script ucu sahte
 * yanıt verir. Beklenen değerler sitenin gerçek modelinden hesaplanır.
 */
const MODEL = buildModel();
const UC = 'https://script.google.com/**';
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });
const yanit = (body: unknown) => ({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });

/** İstek gelir ama yanıt `birak()` çağrılana kadar bekler (yükleniyor durumu). */
async function bekleyenUc(page: Page) {
  let birak!: () => void;
  const kapi = new Promise<void>((r) => (birak = r));
  let gelen = 0;
  await page.route(UC, async (route: Route) => {
    gelen += 1;
    await kapi;
    await route.fulfill(yanit(reply(MODEL, 'ozet-1'))).catch(() => undefined);
  });
  return { birak: () => birak(), gelen: () => gelen };
}

async function ac(page: Page, yol: string) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(yol);
  await hydrated(page);
}

test.describe('Sheets bir kez okunurken: yükleniyor', () => {
  test('nakit akışı: kaynak notu “okunuyor” der. Veri gelince Sheets kaynağını yazar.', async ({ page }) => {
    const uc = await bekleyenUc(page);
    await ac(page, 'nakit-akisi/');
    await expect.poll(uc.gelen).toBeGreaterThan(0);
    const not = page.locator('.nakit-kaynak');
    await expect(not).toContainText('okunuyor');
    await expect(not).not.toContainText('okunamadı');
    uc.birak();
    await expect(not).toContainText('Google Sheets');
    await expect(not).not.toContainText('okunuyor');
  });

  // Yüklenirken veri henüz okunmadı. Sonuç kutusu “okunamadı” dememeli. Bu söz ancak hata gelince doğrudur.
  test('nakit akışı: yüklenirken sonuç kutusu “Sheets gider verisi okunamadı” demez', async ({ page }) => {
    const uc = await bekleyenUc(page);
    await ac(page, 'nakit-akisi/');
    await expect.poll(uc.gelen).toBeGreaterThan(0);
    await expect(page.locator('.nakit-kaynak')).toContainText('okunuyor');
    try {
      await expect(page.locator('.sonuc-aciklama')).not.toContainText('okunamadı');
      await expect(page.locator('.sonuc-kaynak')).not.toContainText('okunamadı');
    } finally {
      uc.birak();
    }
  });

  test('gelir planı: başabaş kaynak notu “okunuyor” der. Veri gelince “okundu” olur.', async ({ page }) => {
    const uc = await bekleyenUc(page);
    await ac(page, 'gelir-plani/');
    await expect.poll(uc.gelen).toBeGreaterThan(0);
    const not = page.locator('#basabas .kaynak-notu[role="status"]');
    await expect(not).toContainText('okunuyor');
    uc.birak();
    await expect(not).toContainText('okundu');
    await expect(not).not.toContainText('okunuyor');
  });

  test('2027 bütçesi: plan okunurken durum notu görünür, uyarı görünmez. Veri gelince “Mevcut plan” tabloya girer.', async ({ page }) => {
    const uc = await bekleyenUc(page);
    await ac(page, 'butce-2027/');
    await expect.poll(uc.gelen).toBeGreaterThan(0);
    await expect(page.locator('.b27-durum', { hasText: 'okunuyor' })).toHaveCount(1);
    await expect(page.getByRole('alert').filter({ hasText: 'okunamadı' })).toHaveCount(0);
    await expect(page.locator('#ozet')).not.toContainText('Mevcut plan (Sheets)');
    uc.birak();
    await expect(page.locator('#ozet')).toContainText('Mevcut plan (Sheets)');
    await expect(page.locator('.b27-durum', { hasText: 'okunuyor' })).toHaveCount(0);
  });
});

test.describe('Sheets bir kez okunurken: hata ve zaman aşımı', () => {
  test('sunucu hatası (yetki dışı): üç sayfa da sunucunun mesajını yazar', async ({ page }) => {
    const mesaj = 'Deneme: Sheets geçici hata verdi.';
    await page.route(UC, (route) => route.fulfill(yanit({ ok: false, hata: 'sunucu', mesaj })));
    await ac(page, 'nakit-akisi/');
    await expect(page.locator('.nakit-kaynak')).toContainText(mesaj);
    await expect(page.locator('.nakit-kaynak')).toContainText('okunamadı');
    // Yetki sorunu değil: anahtar isteyen yönlendirme yok.
    await expect(page.locator('.nakit-kaynak').getByRole('link')).toHaveCount(0);
    await expect(page.locator('.sonuc-aciklama')).toContainText('okunamadı');
    await ac(page, 'gelir-plani/');
    await expect(page.locator('#basabas .kaynak-notu[role="status"]')).toContainText(mesaj);
    await ac(page, 'butce-2027/');
    await expect(page.getByRole('alert').filter({ hasText: mesaj })).toHaveCount(1);
    await expect(page.locator('#ozet')).not.toContainText('Mevcut plan (Sheets)');
  });

  test('HTTP hatası, ağ hatası ve “değişmedi” yanıtı: her biri kendi açıklamasıyla hata durumuna geçer', async ({ page }) => {
    let tur: 'http' | 'ag' | 'degismedi' = 'http';
    await page.route(UC, (route) =>
      tur === 'http'
        ? route.fulfill({ status: 503, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' }, body: 'yok' })
        : tur === 'ag'
          ? route.abort('failed')
          : route.fulfill(yanit({ ok: true, sema: 1, ozet: 'x', degismedi: true, denetlendi: new Date().toISOString() })),
    );
    await ac(page, 'gelir-plani/');
    await expect(page.locator('#basabas .kaynak-notu[role="status"]')).toContainText('503');
    tur = 'ag';
    await ac(page, 'butce-2027/');
    await expect(page.getByRole('alert').filter({ hasText: 'ulaşılamadı' })).toHaveCount(1);
    tur = 'degismedi';
    await ac(page, 'nakit-akisi/');
    await expect(page.locator('.nakit-kaynak')).toContainText('değişmedi');
    await expect(page.locator('.nakit-kaynak')).not.toContainText('okunuyor');
  });

  test(`zaman aşımı: ${OPEX_TIMEOUT_MS / 1000} saniyede yanıt gelmezse nakit akışı bekleme süresini yazar`, async ({ page }) => {
    await page.clock.install();
    const uc = await bekleyenUc(page);
    await ac(page, 'nakit-akisi/');
    await expect.poll(uc.gelen).toBeGreaterThan(0);
    const not = page.locator('.nakit-kaynak');
    await expect(not).toContainText('okunuyor');
    await page.clock.runFor(OPEX_TIMEOUT_MS - 1000);
    await expect(not).toContainText('okunuyor');
    await page.clock.runFor(2000);
    await expect(not).toContainText(`${OPEX_TIMEOUT_MS / 1000} saniye`);
    await expect(not).toContainText('okunamadı');
    uc.birak();
  });
});

test.describe('Nakit akışı: seçenek notu ve toparlanma durumu', () => {
  const acikUc = (page: Page) => page.route(UC, (route) => route.fulfill(yanit(reply(MODEL, 'ozet-1'))));
  /** Sayfanın hesabı: aynı parametre, temel senaryo ve seçeneklerle, Sheets giderleriyle. */
  const nakit = (p: Params, base: ScenarioId, opts: ScenarioOptions) => {
    const m = siteModel(p);
    const seri = cashSeriesOf(m.params, m, m.revenue, inputsOf(m.params, m.revenue, base, opts));
    return buildCashflow(m.cashflow, MODEL, base, { seri, ekSabit: opts.ekSabit, primDahil: opts.primDahil });
  };
  const deger = (page: Page, etiket: string) => page.locator('.sonuc-ikincil > div').filter({ has: page.getByText(etiket, { exact: true }) }).locator('dd');
  const metin = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim();

  test('seçenek değişmediyse not bunu söyler. Gider kaynağı “plan” seçilse de çıkışlar Sheets ile hesaplanır.', async ({ page }) => {
    await acikUc(page);
    await ac(page, 'nakit-akisi/');
    await expect(page.locator('.nakit-kaynak')).toContainText('Google Sheets');
    const not = page.locator('.nakit-secenekler');
    await expect(not).toContainText('değiştirilmedi');
    await expect(not).not.toContainText('plan kadrosu');
    // Gelir planında gider kaynağı “plan kadrosu” seçili.
    const opts = { ...defaultFilters(DEFAULT_PARAMS), kaynak: 'plan' as const };
    const degisiklik = diffCount(DEFAULT_PARAMS, opts);
    expect(degisiklik).toBe(1);
    await page.evaluate(({ k, v }) => localStorage.setItem(k, JSON.stringify(v)), { k: OPTIONS_KEY, v: opts });
    await page.reload();
    await hydrated(page);
    await expect(page.locator('.nakit-kaynak')).toContainText('Google Sheets');
    await expect(not).toContainText(`${degisiklik} değişiklik`);
    await expect(not).toContainText('plan kadrosu');
    await expect(not).not.toContainText('değiştirilmedi');
    // Çıkış toplamı varsayılan seçeneklerle (Sheets + plan kalemleri) aynı: kaynak seçeneği burada uygulanmaz.
    const cf = nakit(DEFAULT_PARAMS, 'medyan', defaultFilters(DEFAULT_PARAMS));
    await expect(page.locator('.stat', { hasText: 'Nakit çıkışı' }).locator('.stat-value')).toHaveText(tl(cf.toplam.cikis));
    await page.evaluate((k) => localStorage.removeItem(k), OPTIONS_KEY);
  });

  test('senaryo seçimi durumu değiştirir: kötümserde “ilk toparlanma, sonra yine açık”, planda “geçici toparlanma, sonra kalıcı”', async ({ page }) => {
    // Kasım 2026’da 2 milyon ₺ yatırım ve %20 kapasite: nakit önce artıya geçer, sonra yeniden eksiye iner.
    const p: Params = { ...DEFAULT_PARAMS, investmentAmount: 2_000_000 };
    const opts: ScenarioOptions = { ...defaultFilters(p), factor: 0.2 };
    const kot = nakit(p, 'kotumser', opts);
    const plan = nakit(p, 'medyan', opts);
    const tk = toparlanmaOf(kot.donemSonu);
    const tp = toparlanmaOf(plan.donemSonu);
    // Ön koşul: kötümserde ilk toparlanma var, kalıcı toparlanma yok. Planda ilk ve kalıcı toparlanma ayrı aylardadır.
    expect(tk.ilk).not.toBeNull();
    expect(tk.kalici).toBeNull();
    expect(tp.ilk).not.toBeNull();
    expect(tp.kalici).not.toBeNull();
    expect(tp.ilk).not.toBe(tp.kalici);
    expect(kot.toparlanma.ilk?.iso).toBe(kot.aylar[tk.ilk!].iso);
    await acikUc(page);
    await page.addInitScript(
      ({ pk, pv, ok, ov, sk }) => {
        localStorage.setItem(pk, JSON.stringify(pv));
        localStorage.setItem(ok, JSON.stringify(ov));
        localStorage.setItem(sk, 'kotumser');
      },
      { pk: PARAMS_KEY, pv: { investmentAmount: p.investmentAmount }, ok: OPTIONS_KEY, ov: opts, sk: SCENARIO_KEY },
    );
    await ac(page, 'nakit-akisi/');
    await expect(page.locator('.nakit-kaynak')).toContainText('Google Sheets');
    const durum = page.locator('.sonuc-durum');
    const son = kot.aylar[kot.aylar.length - 1];
    // Kötümser senaryo risk tonundadır. Metin ilk toparlanma ayını ve dönem sonundaki açığı yazar.
    await expect(page.locator('.sonuc-deger')).toHaveText(tl(kot.acik));
    await expect(durum).toHaveAttribute('data-ton', 'risk');
    await expect(durum).toContainText(kot.aylar[tk.ilk!].ad);
    await expect(durum).toContainText(son.ad);
    await expect(deger(page, 'Kalıcı toparlanma')).toHaveText(`Dönem içinde yok (ilk ${kot.aylar[tk.ilk!].kisa}, sonra yine açık)`);
    // Üç senaryo tablosunda aynı ölçüt, aynı seçeneklerle.
    const tablo = page.getByRole('region', { name: 'Üç senaryo: 15 ayın özeti' });
    const satirlar = await tablo.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())));
    expect(satirlar[0][3]).toBe(`Dönem içinde yok (ilk ${kot.aylar[tk.ilk!].kisa}, sonra yine açık)`);
    expect(satirlar[1][3]).toBe(`${plan.aylar[tp.kalici!].kisa} (ilk ${plan.aylar[tp.ilk!].kisa})`);
    // Plan senaryosu uyarı tonundadır. Metin ilk toparlanmayı, yeniden açığı ve kalıcı toparlanma ayını yazar.
    await page.locator('.sonuc').getByRole('group', { name: 'Senaryo' }).getByRole('button', { name: 'Plan', exact: true }).click();
    await expect(durum).toHaveAttribute('data-ton', 'uyari');
    await expect(page.locator('.sonuc-deger')).toHaveText(tl(plan.acik));
    await expect(durum).toContainText(plan.aylar[tp.ilk!].ad);
    await expect(durum).toContainText(plan.aylar[tp.kalici!].ad);
    await expect(durum).toContainText('yeniden açık');
    await expect(deger(page, 'Kalıcı toparlanma')).toHaveText(`${plan.aylar[tp.kalici!].kisa} (ilk ${plan.aylar[tp.ilk!].kisa})`);
    expect(metin(await deger(page, 'En düşük nakit').textContent())).toBe(`${tl(plan.enDusuk.deger)} (${plan.enDusuk.ay.kisa})`);
  });
});
