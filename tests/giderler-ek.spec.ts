import { expect, test, type Locator, type Page, type Route } from './fixtures/persona';
import { donemOf, giderDonem, kisiDonem, planOfModel, type OpexModel } from '../src/data/opex';
import { tl, tlExact } from '../src/lib/format';
import { buildInput, buildModel, exampleTohum, motor, NOW, reply } from './opex-fixture';

/**
 * Giderler (OPEX) ek denetimleri: tablo filtreleri, sütun aramasındaki sayı koşulları, SGK teşvik tablosu, bayat veri
 * bandı, hata durumu, canlı güncellemede korunan süzgeç ve Sheets uyarıları. Apps Script ucu sahte yanıt verir. Yanıt,
 * kurgusal örnek tohumdan motorun gerçek çıktısıdır. Beklenen değerler modelden hesaplanır.
 */
const PATH = 'giderler/';
const MODEL = buildModel();
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });
const r2 = (v: number) => Math.round(v * 100) / 100;
const topla = (xs: number[]) => xs.reduce((t, v) => t + v, 0);
const sayi2 = (v: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const sayi0 = (v: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v);
/** Sayfanın kahraman sayısı: 2026 döneminin toplamı. */
const hero26 = (m: OpexModel) => tl(donemOf(m, 2026).toplam.toplam);
const tabloAdi = (m: OpexModel) => `Kalemler (${planOfModel(m).etiket})`;

type Durum = { ozet: string; model: OpexModel } | { hata: string; mesaj: string };

/** Herkese açık uç: anahtar istemez. Özet aynıysa “değişmedi”, değilse bütün model döner. */
async function sahteUc(page: Page, ilk: Durum) {
  let durum = ilk;
  await page.route('https://script.google.com/**', async (route: Route) => {
    const govde = JSON.parse(route.request().postData() ?? '{}') as { ozet?: string };
    const json =
      'hata' in durum
        ? { ok: false, hata: durum.hata, mesaj: durum.mesaj }
        : govde.ozet === durum.ozet
          ? { ok: true, sema: 1, ozet: durum.ozet, degismedi: true, denetlendi: new Date().toISOString(), degisti: new Date().toISOString() }
          : reply(durum.model, durum.ozet);
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(json) }).catch(() => undefined);
  });
  return { set: (x: Durum) => (durum = x) };
}

async function ac(page: Page, ilk: Durum = { ozet: 'ek-1', model: MODEL }) {
  await page.setViewportSize({ width: 1280, height: 900 });
  const uc = await sahteUc(page, ilk);
  await page.goto(PATH);
  await hydrated(page);
  return uc;
}

/** Tablonun bir satırı: modelden, sayfadaki sütun anlamlarıyla (Tutar ₺ karşılığı, Toplam ₺ 15 ay, Bu ay durumu). */
interface Satir {
  ad: string;
  para: string;
  tutar: number | null;
  donem: number;
  durum: string;
  artis: string;
}
const ARTIS_ADI: Record<string, string> = { Kur: 'Kur artışı', Kira: 'Kira artışı', Genel: 'Enflasyon kadar artış', Yok: 'Artış yok' };
function satirlar(m: OpexModel): Satir[] {
  const p = planOfModel(m);
  const key = m.donem.yil === 2027 ? 'y2027' : 'y2026';
  const ay = m.donem.ay - 1;
  const takip = m.ozet.odeme.takip !== false;
  const giderler = m.giderler.map((g) => ({
    ad: g.kalem,
    para: g.para,
    tutar: g.eksik ? null : g.tl,
    donem: r2(topla(p.donemler.map((d) => giderDonem(g, d).toplam))),
    // “Bu ay”: işaretsiz ay “Bu ay yok”, tutarı boş kalem “Tutar girilmedi”, ödeme sütunu varsa ödendi ya da bekliyor.
    durum: !g.aktif[key][ay] ? 'Bu ay yok' : g.eksik && !g.ozel[key][ay] ? 'Tutar girilmedi' : takip ? (g.odendi ? 'Ödendi' : 'Bekliyor') : 'Bu ay var',
    artis: ARTIS_ADI[g.artis],
  }));
  const kisiler = m.kisiler.map((k) => ({
    ad: k.ad,
    para: 'TRY',
    tutar: k.tutar,
    donem: r2(topla(p.donemler.map((d) => kisiDonem(k, d).toplam.maliyet))),
    durum: !k.aktif[key][ay] ? 'Bu ay yok' : k.tur === 'Bordrolu' ? 'Bordro' : 'Fatura',
    artis: k.zamOrani > 0 ? 'Maaş zammı' : 'Maaş zammı yok',
  }));
  return [...giderler, ...kisiler];
}
const SATIRLAR = satirlar(MODEL);
const HEPSI = SATIRLAR.length;

/** Gösterilen kalem adları (sıra korunur). Hesap etiketi ve fatura bağlantısı adın dışında kalır. */
const adlar = (tablo: Locator) =>
  tablo.locator('tbody tr th').evaluateAll((ths) => ths.map((th) => th.querySelector('.opex-item > span:not(.opex-dot)')?.childNodes[0]?.textContent ?? ''));
const sayac = (page: Page) => page.locator('.opex-veri-sayi');
async function gosterilen(page: Page, beklenen: Satir[]) {
  await expect(sayac(page)).toHaveText(`${HEPSI} kalemin ${beklenen.length} tanesi gösteriliyor`);
  expect(await adlar(page.getByRole('region', { name: tabloAdi(MODEL) }))).toEqual(beklenen.map((s) => s.ad));
}

/** Tablo filtresi (seçim kutusu): açar, değerleri işaretler, kapatır. */
async function sec(page: Page, etiket: string, degerler: string[]) {
  await page.getByRole('button', { name: new RegExp(`^${etiket}: `) }).click();
  for (const d of degerler) await page.getByRole('checkbox', { name: d, exact: true }).check();
  await page.keyboard.press('Escape');
}

test.describe('Giderler: tablo filtreleri', () => {
  test('Para birimi: seçenekte ₺ görünür ve TRY kalemlerini süzer. USD ve EUR kendi kalemlerini getirir.', async ({ page }) => {
    await ac(page);
    await page.getByRole('button', { name: 'Para birimi: Hepsi' }).click();
    // Seçenekler modeldeki para birimleridir. Okur “TRY” değil “₺” görür.
    const kodlar = [...new Set(SATIRLAR.map((s) => s.para))];
    expect(kodlar).toContain('TRY');
    const grup = page.getByRole('group', { name: 'Para birimi', exact: true });
    await expect(grup.getByRole('checkbox')).toHaveCount(kodlar.length);
    await expect(grup.getByRole('checkbox', { name: 'TRY', exact: true })).toHaveCount(0);
    await grup.getByRole('checkbox', { name: '₺', exact: true }).check();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Para birimi: ₺' })).toBeVisible();
    await gosterilen(page, SATIRLAR.filter((s) => s.para === 'TRY'));
    await page.getByRole('button', { name: 'Filtreleri temizle' }).click();
    for (const kod of kodlar.filter((k) => k !== 'TRY')) {
      await sec(page, 'Para birimi', [kod]);
      await expect(page.getByRole('button', { name: `Para birimi: ${kod}` })).toBeVisible();
      await gosterilen(page, SATIRLAR.filter((s) => s.para === kod));
      await page.getByRole('button', { name: 'Filtreleri temizle' }).click();
    }
    // İki seçim birlikte: ₺ ve USD.
    await sec(page, 'Para birimi', ['₺', 'USD']);
    await expect(page.getByRole('button', { name: 'Para birimi: 2 seçili' })).toBeVisible();
    await gosterilen(page, SATIRLAR.filter((s) => s.para === 'TRY' || s.para === 'USD'));
  });

  test('2027 artışı: kur ve kira artışı seçilince yalnız o artış türündeki kalemler kalır', async ({ page }) => {
    await ac(page);
    const kur = SATIRLAR.filter((s) => s.artis === 'Kur artışı');
    const kira = SATIRLAR.filter((s) => s.artis === 'Kira artışı');
    expect(kur.length).toBeGreaterThan(0);
    expect(kira.length).toBeGreaterThan(0);
    await sec(page, '2027 artışı', ['Kur artışı']);
    await gosterilen(page, kur);
    await sec(page, '2027 artışı', ['Kira artışı']);
    await expect(page.getByRole('button', { name: '2027 artışı: 2 seçili' })).toBeVisible();
    await gosterilen(page, SATIRLAR.filter((s) => s.artis === 'Kur artışı' || s.artis === 'Kira artışı'));
  });

  // “Maaş zammı” ve “Maaş zammı yok” listede iki ayrı seçenektir. Biri seçilince öteki gelmemeli.
  test('2027 artışı: “Maaş zammı” seçimi yalnız zamlı kişileri gösterir, “Maaş zammı yok” kişisini göstermez', async ({ page }) => {
    await ac(page);
    const zamli = SATIRLAR.filter((s) => s.artis === 'Maaş zammı');
    expect(SATIRLAR.some((s) => s.artis === 'Maaş zammı yok')).toBe(true);
    await sec(page, '2027 artışı', ['Maaş zammı']);
    await expect(page.getByRole('button', { name: '2027 artışı: Maaş zammı' })).toBeVisible();
    await gosterilen(page, zamli);
  });

  test('Bu ay: bekleyen ve tutarı girilmemiş kalemler durumlarına göre süzülür', async ({ page }) => {
    await ac(page);
    const bekliyor = SATIRLAR.filter((s) => s.durum === 'Bekliyor');
    expect(bekliyor.length).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Bu ay: Hepsi' }).click();
    // Seçenekler modeldeki durumlardır. Boş durum seçenek olmaz.
    const durumlar = [...new Set(SATIRLAR.map((s) => s.durum))].sort((a, b) => a.localeCompare(b, 'tr'));
    const grup = page.getByRole('group', { name: 'Bu ay', exact: true });
    await expect(grup.getByRole('checkbox')).toHaveCount(durumlar.length);
    for (const d of durumlar) await expect(grup.getByRole('checkbox', { name: d, exact: true })).toHaveCount(1);
    await page.getByRole('checkbox', { name: 'Bekliyor', exact: true }).check();
    await page.keyboard.press('Escape');
    await gosterilen(page, bekliyor);
    await sec(page, 'Bu ay', ['Tutar girilmedi']);
    await gosterilen(page, SATIRLAR.filter((s) => s.durum === 'Bekliyor' || s.durum === 'Tutar girilmedi'));
  });

  test('“Toplam ₺ en çok”: sınırdaki kalem dahil, kuruş altındaki sınırda dışarıda kalır (Türkçe ondalık virgül)', async ({ page }) => {
    await ac(page);
    // Sınır: tam sayı olmayan, ortadaki bir kalemin 15 aylık toplamı.
    const sirali = SATIRLAR.filter((s) => s.donem > 0 && !Number.isInteger(s.donem)).sort((a, b) => a.donem - b.donem);
    const sinir = sirali[Math.floor(sirali.length / 2)];
    const kutu = page.getByRole('textbox', { name: 'Toplam ₺ en çok' });
    await kutu.pressSequentially(sayi2(sinir.donem));
    await expect(kutu).toHaveValue(sayi2(sinir.donem));
    await gosterilen(page, SATIRLAR.filter((s) => s.donem <= sinir.donem));
    await expect(page.getByRole('region', { name: tabloAdi(MODEL) })).toContainText(sinir.ad);
    // Bir kuruş aşağısı: sınırdaki kalem çıkar.
    await kutu.fill('');
    await kutu.pressSequentially(sayi2(r2(sinir.donem - 0.01)));
    await gosterilen(page, SATIRLAR.filter((s) => s.donem <= r2(sinir.donem - 0.01)));
    await expect(page.getByRole('region', { name: tabloAdi(MODEL) })).not.toContainText(sinir.ad);
  });
});

test.describe('Giderler: sütun aramasında sayı koşulu', () => {
  test('Tutar sütunu: “1.000” bin demektir. <, <=, > ve >= sınırı doğru uygular. Ondalık virgülle yazılır.', async ({ page }) => {
    await ac(page);
    const ara = page.getByRole('searchbox', { name: 'Tutar sütununda ara' });
    const tutarli = (f: (v: number) => boolean) => SATIRLAR.filter((s) => s.tutar !== null && f(s.tutar));
    // “1.000” = bin. Bir sayılsaydı bin liranın altındaki kalemler de gelirdi.
    expect(tutarli((v) => v >= 1 && v < 1000).length).toBeGreaterThan(0);
    await ara.fill('>=1.000');
    await gosterilen(page, tutarli((v) => v >= 1000));
    // Ondalık: “999,9” = 999,9.
    const tam = SATIRLAR.find((s) => s.tutar === 999.9);
    expect(tam, 'örnek tohumda 999,90 ₺ tutarlı kalem var').toBeTruthy();
    await ara.fill('<999,9');
    await gosterilen(page, tutarli((v) => v < 999.9));
    await ara.fill('<=999,9');
    await gosterilen(page, tutarli((v) => v <= 999.9));
    // “1.000,5” = bin virgül beş: binlik nokta ve ondalık virgül birlikte.
    const kesirli = SATIRLAR.find((s) => s.tutar !== null && s.tutar > 1000 && !Number.isInteger(s.tutar) && Number.isInteger(s.tutar * 10))!;
    expect(kesirli, 'örnek tohumda tek ondalıklı (ör. 28.075,5) tutar var').toBeTruthy();
    const yazi = sayi2(kesirli.tutar!).replace(/0$/, '');
    expect(yazi).toMatch(/^\d{1,3}(\.\d{3})+,\d$/);
    // Ondalık atılsaydı (tam lira) kalem “>” koşulunda kalırdı.
    await ara.fill(`>${sayi0(Math.floor(kesirli.tutar!))}`);
    await gosterilen(page, tutarli((v) => v > Math.floor(kesirli.tutar!)));
    await ara.fill(`>${yazi}`);
    await gosterilen(page, tutarli((v) => v > kesirli.tutar!));
    await ara.fill(`>=${yazi}`);
    await gosterilen(page, tutarli((v) => v >= kesirli.tutar!));
    await expect(page.getByRole('region', { name: tabloAdi(MODEL) })).toContainText(kesirli.ad);
    // Tutarı girilmemiş kalem (“—”) sayı koşuluna uymaz.
    const bos = SATIRLAR.find((s) => s.tutar === null);
    if (bos) await expect(page.getByRole('region', { name: tabloAdi(MODEL) }).locator('tbody th', { hasText: bos.ad })).toHaveCount(0);
  });

  test('Toplam ₺ sütunu: “=” yuvarlanmış tutarı bulur. “1.000.000” bir milyondur. Kuruşlu sınırda < ile <= ayrılır.', async ({ page }) => {
    await ac(page);
    const ara = page.getByRole('searchbox', { name: 'Toplam ₺ sütununda ara' });
    const kesirli = SATIRLAR.filter((s) => !Number.isInteger(s.donem) && s.donem > 1000).sort((a, b) => a.donem - b.donem)[0];
    await ara.fill(`<${sayi2(kesirli.donem)}`);
    await gosterilen(page, SATIRLAR.filter((s) => s.donem < kesirli.donem));
    await ara.fill(`<=${sayi2(kesirli.donem)}`);
    await gosterilen(page, SATIRLAR.filter((s) => s.donem <= kesirli.donem));
    // “=”: tam liraya yuvarlanmış eşitlik.
    await ara.fill(`=${sayi0(Math.round(kesirli.donem))}`);
    await gosterilen(page, SATIRLAR.filter((s) => Math.round(s.donem) === Math.round(kesirli.donem)));
    // Birden çok binlik nokta: bir milyon.
    const milyonluk = SATIRLAR.filter((s) => s.donem >= 1_000_000);
    expect(milyonluk.length).toBeGreaterThan(0);
    expect(milyonluk.length).toBeLessThan(HEPSI);
    await ara.fill('>=1.000.000');
    await gosterilen(page, milyonluk);
    // Boşluklu yazım da sayı koşuludur.
    await ara.fill('<= 1.000.000');
    await gosterilen(page, SATIRLAR.filter((s) => s.donem <= 1_000_000));
  });
});

test.describe('Giderler: SGK teşvik tablosu', () => {
  // Kapalı teşvik: Sheets’teki “Etkin” kutusu boş. Motor bu girdiyle hesaplar.
  const kapaliModel = () => {
    const girdi = buildInput();
    for (const satir of girdi.tesvikler!.slice(3)) if (satir[0] === 'ARGE-5746') satir[7] = false;
    return motor.hesapla(girdi, { simdi: NOW });
  };
  const deger = (tur: string, v: number) =>
    tur === 'Aylık tutar' ? tlExact(v) : tur === 'Puan indirimi' ? `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v * 100)} puan` : `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v * 100)}`;
  const hucreler = (bolge: Locator) =>
    bolge.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())));

  test('değer türe göre yazılır (tutar, puan, oran). Kapalı teşvik işaretlenir. 2026 “Bu ay”, 2027 “aylık ort.” sütunu gösterir.', async ({ page }) => {
    const m = kapaliModel();
    const kapali = m.tesvikler.find((t) => t.kod === 'ARGE-5746')!;
    expect(kapali.etkin).toBe(false);
    // Üç tür de örnekte bulunmalı.
    for (const tur of ['Aylık tutar', 'Puan indirimi']) expect(m.tesvikler.some((t) => t.tur === tur)).toBe(true);
    expect(m.tesvikler.some((t) => t.tur !== 'Aylık tutar' && t.tur !== 'Puan indirimi')).toBe(true);
    await ac(page, { ozet: 'tesvik', model: m });
    const b26 = page.getByRole('region', { name: 'SGK teşvik ve destekleri (2026)' });
    await expect(b26.locator('thead th')).toHaveText(['Teşvik / destek', 'Tür ve değer', 'Uygulanan', `Bu ay (${m.donem.ayAdi})`, '2026 yıllık', 'Koşul ve dayanak']);
    const s26 = await hucreler(b26);
    expect(s26.length).toBe(m.tesvikler.length);
    m.tesvikler.forEach((t, i) => {
      const [ad, tur, kim, bu, yil] = s26[i];
      expect(ad).toBe(`${t.ad}${t.kod} (${t.kapsam}${t.etkin ? ')' : ', kapalı)'}`);
      expect(tur).toBe(`${t.tur}: ${deger(t.tur, t.deger2026)}`);
      expect(kim).toBe(t.uygulananlar.length ? t.uygulananlar.join(', ') : '—');
      expect(bu).toBe(tlExact(t.buAy));
      expect(yil).toBe(tl(t.yil2026));
    });
    expect(s26.filter((r) => r[0].endsWith(', kapalı)'))).toHaveLength(1);
    // 2027: değer 2027 sütunundan, “Bu ay” yerine 12 ayın ortalaması.
    await page.getByRole('tab', { name: /^2027/ }).click();
    const b27 = page.getByRole('region', { name: 'SGK teşvik ve destekleri (2027)' });
    await expect(b27.locator('thead th')).toHaveText(['Teşvik / destek', 'Tür ve değer', 'Uygulanan', '2027 aylık ort.', '2027 yıllık', 'Koşul ve dayanak']);
    const s27 = await hucreler(b27);
    m.tesvikler.forEach((t, i) => {
      expect(s27[i][1]).toBe(`${t.tur}: ${deger(t.tur, t.deger2027)}`);
      expect(s27[i][3]).toBe(tl(t.yil2027 / 12));
      expect(s27[i][4]).toBe(tl(t.yil2027));
    });
    await expect(page.getByRole('region', { name: 'SGK teşvik ve destekleri (2026)' })).toHaveCount(0);
  });
});

test.describe('Giderler: hata, bayat veri ve canlı güncelleme', () => {
  test('veri geldikten sonra hata: eski veri kalır ve “Son alınan veri gösteriliyor” bandı çıkar. Sunucu düzelince bant kalkar.', async ({ page }) => {
    const uc = await ac(page);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    uc.set({ hata: 'sunucu', mesaj: 'Deneme: sunucu geçici hata verdi.' });
    await page.getByRole('button', { name: 'Şimdi yenile' }).click();
    const bant = page.locator('.opex-live-stale');
    await expect(bant).toContainText('Deneme: sunucu geçici hata verdi.');
    await expect(bant).toContainText('Son alınan veri gösteriliyor');
    await expect(bant).toHaveAttribute('role', 'status');
    // Eski veri yerinde: kahraman sayısı ve kalem tablosu.
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    await expect(page.getByRole('region', { name: tabloAdi(MODEL) })).toBeVisible();
    await expect(page.locator('.opex-failed')).toHaveCount(0);
    // Sunucu düzelir ve yeni veri gelir.
    const yeni = buildModel({ params: { kira_artis_2027: 0.5 } });
    uc.set({ ozet: 'ek-2', model: yeni });
    await page.getByRole('button', { name: 'Şimdi yenile' }).click();
    await expect(bant).toHaveCount(0);
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(yeni));
  });

  test('ilk istekte hata: veri yoktur, uyarı ve “Yeniden dene” görünür. Yeniden deneyince veri gelir.', async ({ page }) => {
    const uc = await ac(page, { hata: 'sunucu', mesaj: 'Deneme: ilk istekte sunucu hatası.' });
    await expect(page.getByRole('alert').filter({ hasText: 'Deneme: ilk istekte sunucu hatası.' })).toBeVisible();
    await expect(page.locator('.opex-hero-value')).toHaveCount(0);
    await expect(page.locator('.opex-live-stale')).toHaveCount(0);
    const dene = page.getByRole('button', { name: 'Yeniden dene' });
    await expect(dene).toBeVisible();
    uc.set({ ozet: 'ek-1', model: MODEL });
    await dene.click();
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    await expect(dene).toHaveCount(0);
    await expect(page.getByRole('alert').filter({ hasText: 'Deneme: ilk istekte sunucu hatası.' })).toHaveCount(0);
  });

  test('canlı güncelleme: süzgeç, sıralama ve arama korunur. Yeni değerler aynı süzgeçle gelir.', async ({ page }) => {
    const uc = await ac(page);
    const tablo = page.getByRole('region', { name: tabloAdi(MODEL) });
    await sec(page, 'Para birimi', ['USD']);
    await page.getByRole('searchbox', { name: 'Kalem sütununda ara' }).fill('yapay');
    const baslik = tablo.locator('thead th', { hasText: /^Toplam ₺$/ });
    await baslik.getByRole('button', { name: 'Toplam ₺', exact: true }).click();
    await baslik.getByRole('button', { name: 'Toplam ₺', exact: true }).click();
    await expect(baslik).toHaveAttribute('aria-sort', 'descending');
    const suz = (xs: Satir[]) => xs.filter((s) => s.para === 'USD' && s.ad.toLocaleLowerCase('tr-TR').includes('yapay')).sort((a, b) => b.donem - a.donem);
    const once = suz(SATIRLAR);
    expect(once.length).toBeGreaterThanOrEqual(2);
    expect(await adlar(tablo)).toEqual(once.map((s) => s.ad));
    // Sheets’te en küçük kalemin tutarı büyür: sıra değişmeli.
    const kucuk = once[once.length - 1].ad;
    const giderler = exampleTohum.giderler.map((r) => (r[0] === kucuk ? r.map((h, i) => (i === 5 ? Number(h) * 20 : h)) : r));
    const yeni = buildModel({ giderler });
    const sonra = suz(satirlar(yeni));
    expect(sonra[0].ad).toBe(kucuk);
    uc.set({ ozet: 'ek-yeni', model: yeni });
    await page.getByRole('button', { name: 'Şimdi yenile' }).click();
    await expect.poll(() => adlar(tablo)).toEqual(sonra.map((s) => s.ad));
    await expect(page.getByRole('button', { name: 'Para birimi: USD' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Kalem sütununda ara' })).toHaveValue('yapay');
    await expect(baslik).toHaveAttribute('aria-sort', 'descending');
    await expect(sayac(page)).toHaveText(`${HEPSI} kalemin ${sonra.length} tanesi gösteriliyor`);
    // Yeni tutar tabloda: büyüyen kalemin Toplam ₺ hücresi.
    const satir = tablo.locator('tbody tr').filter({ has: page.locator('th', { hasText: kucuk }) });
    await expect(satir).toContainText(tlExact(sonra[0].donem));
  });

  test('Sheets uyarıları: yanıtta uyarı varsa başlık sayıyı, liste her uyarıyı gösterir. Uyarı yoksa not çıkmaz.', async ({ page }) => {
    const giderler = [...exampleTohum.giderler, ['Deneme GBP', '', 'Teknoloji', 'Yapay Zekâ', 'GBP', 10, 'Kur', false, true, '', ''], ['Deneme CHF', '', 'Teknoloji', 'Yapay Zekâ', 'CHF', 10, 'Kur', false, true, '', '']];
    const m = buildModel({ giderler });
    expect(m.uyarilar.length).toBeGreaterThanOrEqual(2);
    const uc = await ac(page, { ozet: 'uyari', model: m });
    const not = page.getByRole('complementary', { name: `Sheets uyarıları (${m.uyarilar.length})` });
    await expect(not).toBeVisible();
    await expect(not.getByRole('listitem')).toHaveText(m.uyarilar);
    // Uyarısız yeni veri: not kalkar.
    expect(MODEL.uyarilar).toEqual([]);
    uc.set({ ozet: 'uyarisiz', model: MODEL });
    await page.getByRole('button', { name: 'Şimdi yenile' }).click();
    await expect(page.locator('.opex-hero-value')).toHaveText(hero26(MODEL));
    await expect(page.getByRole('complementary', { name: /^Sheets uyarıları/ })).toHaveCount(0);
  });
});
