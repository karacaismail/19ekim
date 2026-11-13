import { expect, test, type Locator, type Page } from './fixtures/persona';
import { GRUP_ADI, ONGORULEMEYEN, butce, tabanOf, toplam, type Ayarlar, type Butce, type Grup } from '../src/data/butce2027';
import {
  ASAMA_ADI,
  GELIR_PLANI_2027,
  KATKI,
  MEDYAN_SAAT,
  MEVSIM,
  REGL_POLITIKA_ADI,
  RISKLER,
  aySaatleri,
  ongoru,
  reglKaybi,
  tekHesap,
  yillikDokum,
  yuzdelik,
  type Asama,
  type ReglPolitikasi,
} from '../src/data/gelir2027';
import { AYLAR_2027, POZISYONLAR, SECENEKLER, SECENEK_ADI, SECENEK_OZETI, type SecenekId } from '../src/data/istihdamV2';
import { buildModel as siteModel } from '../src/data/model';
import { DEFAULT_PARAMS } from '../src/data/params';
import { int, tl } from '../src/lib/format';
import { buildModel, reply } from './opex-fixture';

/**
 * 2027 bütçesi ve 2027 gelir öngörüsü: dört özet dışındaki tablolar ve hücreler. Bütçenin tabanı Sheets’ten okunur
 * (kurgusal örnek veriyle sahte yanıt). Beklenen değerler `data/butce2027.ts` ve `data/gelir2027.ts` modelinden ya da
 * sayfanın yazdığı kuraldan (risk düzeyi eşikleri) hesaplanır.
 */
const MODEL = buildModel();
const TABAN = tabanOf(MODEL);
const milyon = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v / 1_000_000)} milyon ₺`;
const yuzde1 = (v: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v * 100)}`;
const saat = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v)} saat`;
const ondalik = (v: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(v);
const metin = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/** Tablo satırlarının hücre metinleri (satır başlığı dahil). */
const hucreler = (bolge: Locator) => bolge.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())));
const tablo = (page: Page, ad: string) => page.getByRole('region', { name: ad, exact: true });

async function butceAc(page: Page) {
  await page.route('https://script.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(MODEL, 'ozet-1')) }),
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('butce-2027/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  // Sheets tabanı geldi.
  await expect(page.locator('#ozet')).toContainText('Mevcut plan (Sheets)');
}
async function gelirAc(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('gelir-ongorusu-2027/');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}

/* ---------- 2027 bütçesi ---------- */

const fark = (b: Butce) => b.gelir2027 - toplam(b.opex) - toplam(b.capex);
/** Sayfanın kuralı: kalan eksiyse “açık”, değilse “fazla” yazılır. Tutar eksi işaretsiz yazılır. */
const farkYazisi = (v: number) => `${milyon(Math.abs(v))} ${v < 0 ? 'açık' : 'fazla'}`;
/** Toplamdaki pay: çok küçük ama sıfırdan büyük pay “%0,1’den az” yazılır. */
const pay = (v: number) => (v > 0 && v < 0.0005 ? '%0,1’den az' : yuzde1(v));
const statDegeri = (page: Page, etiket: string) => page.locator('#secenek .stat').filter({ has: page.getByText(etiket, { exact: true }) }).locator('.stat-value');

test.describe('2027 bütçesi', () => {
  test('“Gelirden harcama düşülünce kalan” açık ya da fazla yazar. Üç seçeneğin fark sütunu modelle aynıdır.', async ({ page }) => {
    const hepsi = SECENEKLER.map((s) => ({ s, b: butce(TABAN, s) }));
    // Ön koşul: örnekte hem fazla veren hem açık veren seçenek var.
    expect(hepsi.some((x) => fark(x.b) > 0)).toBe(true);
    expect(hepsi.some((x) => fark(x.b) < 0)).toBe(true);
    await butceAc(page);
    const satirlar = await hucreler(tablo(page, 'Seçenekler yan yana'));
    expect(satirlar).toEqual(hepsi.map(({ s, b }) => [SECENEK_ADI[s], `${b.kadroAylik[11]} kişi`, milyon(toplam(b.opex)), milyon(toplam(b.capex)), milyon(b.gelir2027), farkYazisi(fark(b))]));
    for (const { s, b } of hepsi) {
      await page.getByRole('group', { name: 'Kadro seçeneği' }).getByRole('button', { name: SECENEK_ADI[s], exact: true }).click();
      await expect(statDegeri(page, 'Gelirden harcama düşülünce kalan')).toHaveText(farkYazisi(fark(b)));
      const not = page.locator('#secenek .stat').filter({ has: page.getByText('Gelirden harcama düşülünce kalan', { exact: true }) });
      await expect(not).toContainText(SECENEK_OZETI[s].dayandigiSenaryo);
      await expect(not).toContainText(milyon(b.gelir2027));
      // Açık varsa ayrıca uyarı paragrafı çıkar, fazla varsa çıkmaz.
      await expect(page.locator('#secenek .b27-not')).toHaveCount(fark(b) < 0 ? 1 : 0);
      if (fark(b) < 0) await expect(page.locator('#secenek .b27-not')).toContainText(milyon(-fark(b)));
    }
  });

  test('sağlık sigortası anahtarı tutarını ekler (%5 pay dahil). Toplamdaki pay, yıl başından beri ve ek ofis sütunları modelle aynıdır.', async ({ page }) => {
    const kapali: Ayarlar = { yemek: false, saglik: false };
    const acik: Ayarlar = { yemek: false, saglik: true };
    const b0 = butce(TABAN, 'medyan', kapali);
    const b1 = butce(TABAN, 'medyan', acik);
    const etki = toplam(b1.opex) - toplam(b0.opex);
    const kalem = b1.kalemler.find((k) => k.id === 'saglik')!;
    // Anahtarın yazdığı tutar kalemin kendisi ve %5 öngörülemeyen pay.
    expect(Math.abs(etki - toplam(kalem.aylik) * (1 + ONGORULEMEYEN))).toBeLessThan(1);
    await butceAc(page);
    const anahtar = page.getByRole('switch', { name: 'Sağlık sigortası' });
    await expect(anahtar).toHaveAttribute('aria-checked', 'false');
    await expect(anahtar).toHaveAccessibleDescription(new RegExp(tl(etki).replace(/\./g, '\\.')));
    await expect(tablo(page, 'Bütün kalemler')).not.toContainText(kalem.ad);
    await expect(statDegeri(page, '2027 işletme gideri')).toHaveText(milyon(toplam(b0.opex)));
    await anahtar.click();
    await expect(anahtar).toHaveAttribute('aria-checked', 'true');
    await expect(statDegeri(page, '2027 işletme gideri')).toHaveText(milyon(toplam(b1.opex)));
    const satir = tablo(page, 'Bütün kalemler').locator('tbody tr').filter({ has: page.locator('th', { hasText: kalem.ad }) });
    await expect(satir.locator('td').last()).toHaveText(tl(toplam(kalem.aylik)));
    // Pay, toplam harcamaya göre hesaplanır. Çok küçük pay “%0,1’den az” yazılır.
    const tum = toplam(b1.opex) + toplam(b1.capex);
    const GRUPLAR: Grup[] = ['mevcut', 'kadro', 'kisi', 'pazarlama', 'ofis', 'diger'];
    const TUR = { opex: 'İşletme gideri', capex: 'Yatırım harcaması' } as const;
    const gruplar = GRUPLAR.flatMap((g) =>
      (['opex', 'capex'] as const).map((tur) => ({ g, tur, tutar: toplam(b1.kalemler.filter((k) => k.grup === g && k.tur === tur).flatMap((k) => k.aylik)) })).filter((x) => x.tutar > 0),
    );
    const beklenen = gruplar.map((x) => [GRUP_ADI[x.g], TUR[x.tur], tl(x.tutar), tl(x.tutar / 12), pay(x.tutar / tum)]);
    expect(beklenen.some((r) => r[4] === '%0,1’den az'), 'örnekte çok küçük paylı grup var').toBe(true);
    expect(await hucreler(tablo(page, `${SECENEK_ADI.medyan} seçeneği`))).toEqual(beklenen);
    // Aylık planda birikimli toplam yıl başından başlar. Ek ofis m² ya da “Yok” yazılır.
    const ay = (iso: string) => new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(`${iso}-01T00:00:00`));
    let birikim = 0;
    const aylar = AYLAR_2027.map((iso, i) => {
      birikim += b1.opex[i] + b1.capex[i];
      return [ay(iso), tl(b1.opex[i]), tl(b1.capex[i]), tl(b1.opex[i] + b1.capex[i]), tl(birikim), `${b1.kadroAylik[i]} kişi`, b1.ekM2[i] ? `${b1.ekM2[i]} m²` : 'Yok'];
    });
    expect(aylar.some((r) => r[6] === 'Yok')).toBe(true);
    expect(aylar.some((r) => r[6] !== 'Yok')).toBe(true);
    expect(await hucreler(tablo(page, 'Ocak ile Aralık 2027'))).toEqual(aylar);
    // Yıl sonundaki birikim, iki özet tutarının toplamıdır.
    expect(Math.abs(birikim - tum)).toBeLessThan(1);
  });
});

test.describe('2027 gelir verisi tutarlılığı', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Veri denetimi bir kez çalışır.');
  // Bütçe ve istihdam sayfaları geliri sabit JSON’dan okur. Bu değer gelir planının varsayılan parametrelerle hesabıyla aynı olmalı.
  test('seçeneklerin 2027 gelir hedefi, gelir planının varsayılan parametrelerle 2027 geliriyle aynı', () => {
    const rev = siteModel(DEFAULT_PARAMS).revenue;
    const ocak = rev.months.findIndex((m) => m.iso === '2027-01-01');
    const yil = (id: 'kotumser' | 'medyan' | 'iyimser') => toplam(rev.byId[id].gelir.slice(ocak, ocak + 12));
    const adla = Object.fromEntries((['kotumser', 'medyan', 'iyimser'] as const).map((id) => [rev.byId[id].scenario.name, yil(id)]));
    for (const s of SECENEKLER) {
      const oz = SECENEK_OZETI[s];
      expect(adla[oz.dayandigiSenaryo], `${s}: ${oz.dayandigiSenaryo}`).toBeDefined();
      expect(Math.abs(oz.gelirHedefi2027 - adla[oz.dayandigiSenaryo]), s).toBeLessThan(1);
    }
    expect(Math.abs(GELIR_PLANI_2027 - yil('medyan'))).toBeLessThan(1);
  });
});

/* ---------- 2027 gelir öngörüsü ---------- */

const ASAMALAR: Asama[] = ['risksiz', 'saat', 'gecikme', 'devir', 'mevsim'];
const POLITIKALAR: ReglPolitikasi[] = ['ikisi', 'evden', 'izin', 'yok'];
const ayAdi = (iso: string) => new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(new Date(`${iso}-01T00:00:00`));

test.describe('2027 gelir öngörüsü', () => {
  test('ciro ve kazanılmış gelir, ay ay ciro (yüzdelikler) ve risk payı tabloları modelle aynı', async ({ page }) => {
    const o = ongoru('medyan', 'ikisi');
    await gelirAc(page);
    expect(await hucreler(tablo(page, 'Ciro ve kazanılmış gelir'))).toEqual([
      ['Kötümser (%10)', milyon(o.gelir.kotumser), milyon(o.kazanilan.kotumser), int(o.yeniAktif.kotumser)],
      ['Plan', milyon(o.gelir.medyan), milyon(o.kazanilan.medyan), int(o.yeniAktif.medyan)],
      ['Ortanca (%50)', milyon(o.gelir.ortanca), milyon(o.kazanilan.ortanca), int(o.yeniAktif.ortanca)],
      ['İyimser (%90)', milyon(o.gelir.iyimser), milyon(o.kazanilan.iyimser), int(o.yeniAktif.iyimser)],
      ['Risksiz plan', milyon(o.gelir.risksiz), milyon(o.kazanilan.risksiz), int(o.yeniAktif.risksiz)],
    ]);
    // Ay ay: her ayın kötümser, ortanca ve iyimser değeri o ayın olası yıllarından yüzde 10, 50 ve 90 noktasıdır.
    const aylik = AYLAR_2027.map((iso, i) => {
      const xs = o.dagilim.aylikGelir.map((r) => r[i]);
      return [ayAdi(iso), tl(yuzdelik(xs, 0.1)), tl(o.medyan.gelir[i]), tl(yuzdelik(xs, 0.5)), tl(yuzdelik(xs, 0.9))];
    });
    expect(await hucreler(tablo(page, `${SECENEK_ADI.medyan} seçeneği, 2027`))).toEqual(aylik);
    // Riskler sırayla eklenir. İlk aşama risksiz plandır. Son aşama Plan cirosudur.
    const asamalar = ASAMALAR.map((a) => ({ a, gelir: toplam(tekHesap('medyan', a, { ...MEDYAN_SAAT, regl: 'ikisi' }).gelir) }));
    expect(Math.abs(asamalar[0].gelir - o.gelir.risksiz)).toBeLessThan(1);
    expect(Math.abs(asamalar[asamalar.length - 1].gelir - o.gelir.medyan)).toBeLessThan(1);
    expect(await hucreler(tablo(page, 'Risksiz plandan Plan öngörüsüne'))).toEqual(
      asamalar.map((x, i) => [ASAMA_ADI[x.a], milyon(x.gelir), i ? milyon(asamalar[i - 1].gelir - x.gelir) : 'Başlangıç', yuzde1(x.gelir / asamalar[0].gelir)]),
    );
    // Son aşamanın oranı, risk payının tümleyenidir.
    expect(yuzde1(asamalar[asamalar.length - 1].gelir / asamalar[0].gelir)).toBe(yuzde1(1 - o.riskPayi));
  });

  test('seçenek, regl politikası, katkı ve zaman tüneli tabloları modelle aynıdır. Politika değişince seçili satır ve tutarlar değişir.', async ({ page }) => {
    const satir = (regl: ReglPolitikasi) => SECENEKLER.map((s: SecenekId) => {
      const x = ongoru(s, regl);
      return [SECENEK_ADI[s], milyon(x.gelir.kotumser), milyon(x.gelir.medyan), milyon(x.gelir.ortanca), milyon(x.gelir.iyimser), yuzde1(x.riskPayi)];
    });
    await gelirAc(page);
    const secenekler = tablo(page, '2027 cirosu');
    expect(await hucreler(secenekler)).toEqual(satir('ikisi'));
    await expect(secenekler.locator('tbody tr[data-tone="secili"] th')).toHaveText(SECENEK_ADI.medyan);
    // Regl politikası: kadın başı kayıp ve ortalama kapasite.
    const regl = tablo(page, 'Politikaya göre kayıp');
    const reglSatirlari = (await hucreler(regl)).map((r) => r.slice(0, 3));
    expect(reglSatirlari).toEqual(POLITIKALAR.map((p) => [REGL_POLITIKA_ADI[p], `${ondalik(reglKaybi(p))} gün eşdeğeri`, yuzde1(yillikDokum({ ...MEDYAN_SAAT, regl: p }).carpan)]));
    await expect(regl.locator('tbody tr[data-tone="secili"] th')).toHaveText(REGL_POLITIKA_ADI.ikisi);
    // Katkı: seçili seçenekteki katkılı roller ve 2027 beklenen yeni aktif satıcı.
    const o = ongoru('medyan', 'ikisi');
    const TUR = { dogrudan: 'Doğrudan satış', dijital: 'Dijital kanal', lider: 'Ekip verimi', 'elde-tutma': 'Elde tutma (dolaylı)', yok: 'Yok' } as const;
    const katkilar = POZISYONLAR.filter((p) => KATKI[p.id] && p.secenekler.medyan.kisi > 0).map((p) => {
      const k = KATKI[p.id];
      const b = o.medyan.dogrudan[p.id];
      return [`${p.unvan} (${p.secenekler.medyan.kisi} kişi)`, TUR[k.tur], b ? `${int(b)} yeni aktif` : k.tur === 'elde-tutma' ? 'Elde tutmayı artırır' : 'Satışı kanal toplamında sayılır'];
    });
    expect(katkilar.length).toBeGreaterThan(0);
    expect((await hucreler(tablo(page, `${SECENEK_ADI.medyan} seçeneğindeki roller`))).map((r) => r.slice(0, 3))).toEqual(katkilar);
    // Zaman tüneli: yıl boyu sürmeyen riskler, kayıp saat ve mevsimin satış etkisi.
    const aylar = aySaatleri({ ...MEDYAN_SAAT, regl: 'ikisi' });
    const tunel = AYLAR_2027.map((iso, i) => [
      ayAdi(iso),
      RISKLER.filter((r) => r.aylar.includes(i) && r.aylar.length < 12).map((r) => r.ad).join(', ') || 'Mevsime bağlı risk yok',
      saat(aylar[i].hastalik + aylar[i].grip + aylar[i].regl + aylar[i].mazeret),
      MEVSIM[i] < 1 ? `eksi ${yuzde1(1 - MEVSIM[i])}` : 'Yok',
    ]);
    expect(tunel.some((r) => r[1] === 'Mevsime bağlı risk yok')).toBe(true);
    expect(tunel.some((r) => r[3] !== 'Yok')).toBe(true);
    expect(await hucreler(tablo(page, '2027, ay ay'))).toEqual(tunel);
    // Politika yok: seçili satır taşınır, karşılaştırma tutarları yeniden hesaplanır.
    await page.getByRole('group', { name: 'Regl politikası' }).getByRole('button', { name: REGL_POLITIKA_ADI.yok, exact: true }).click();
    await expect(regl.locator('tbody tr[data-tone="secili"] th')).toHaveText(REGL_POLITIKA_ADI.yok);
    await expect.poll(() => hucreler(secenekler)).toEqual(satir('yok'));
  });

  test('risk haritası: 15 ve üstü yüksek, 8 ile 14 arası orta, 8 altı düşüktür. Hücreler doğru riskleri taşır. Liste puana göre azalır.', async ({ page }) => {
    await gelirAc(page);
    // Sayfanın yazdığı kural: puan = olasılık × etki.
    const duzey = (p: number) => (p >= 15 ? 'Yüksek' : p >= 8 ? 'Orta' : 'Düşük');
    const harita = page.getByRole('table', { name: 'Risk haritası: etki ve olasılık' });
    const hucre = await harita.locator('tbody tr').evaluateAll((trs) =>
      trs.map((tr) => ({ etki: (tr.querySelector('th')?.textContent ?? '').replace(/\D/g, ''), td: [...tr.querySelectorAll('td')].map((td) => ({ duzey: td.getAttribute('data-duzey'), metin: (td.textContent ?? '').trim() })) })),
    );
    expect(hucre.map((r) => r.etki)).toEqual(['5', '4', '3', '2', '1']);
    for (const r of hucre) {
      const etki = Number(r.etki);
      expect(r.td).toEqual(
        [1, 2, 3, 4, 5].map((olasilik) => ({
          duzey: duzey(olasilik * etki),
          metin: RISKLER.filter((x) => x.etki === etki && x.olasilik === olasilik).map((x) => x.id).join(', '),
        })),
      );
    }
    // Eşik sınırları: 15 yüksek, 8 orta, 5 düşük.
    const duzeyOf = (etki: number, olasilik: number) => hucre[5 - etki].td[olasilik - 1].duzey;
    expect([duzeyOf(5, 3), duzeyOf(3, 5), duzeyOf(4, 2), duzeyOf(2, 4), duzeyOf(5, 1), duzeyOf(1, 5)]).toEqual(['Yüksek', 'Yüksek', 'Orta', 'Orta', 'Düşük', 'Düşük']);
    // Risk listesi: her risk bir kez, puan ve düzey doğru, puana göre azalan.
    const liste = await hucreler(tablo(page, 'Riskler'));
    expect(liste.map((r) => r[0].split(':')[0]).sort()).toEqual(RISKLER.map((r) => r.id).sort());
    const puanlar = liste.map((r) => {
      const risk = RISKLER.find((x) => x.id === r[0].split(':')[0])!;
      const p = risk.olasilik * risk.etki;
      expect(r[1]).toBe(`${p} (${duzey(p)})`);
      return p;
    });
    expect(puanlar).toEqual([...puanlar].sort((a, b) => b - a));
    expect(metin(liste[0][1])).toMatch(/Yüksek\)$/);
  });
});
