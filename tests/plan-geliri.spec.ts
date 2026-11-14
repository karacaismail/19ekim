import { expect, test, type Page } from './fixtures/persona';
import { VARSAYILAN_AYAR, butce, toplam } from '../src/data/butce2027';
import { gelirBaglami, ongoru } from '../src/data/gelir2027';
import { SECENEKLER, SECENEK_OZETI, dikkatOf, gelirleOzet, type SecenekId } from '../src/data/istihdamV2';
import { DEFAULT_MODEL, buildModel } from '../src/data/model';
import { DEFAULT_PARAMS, PARAMS_KEY, type Params } from '../src/data/params';
import { plan2027, secenekGelirleri } from '../src/data/planGeliri';
import { milyon, num, tl } from '../src/lib/format';

/**
 * 2027 sayfaları gelir planıyla aynı ayarları kullanır. Ayarlar “Parametreler” sayfasında bu tarayıcıya kaydedilir.
 * Gelir öngörüsü, 2027 bütçesi ve İstihdam takvimi v2 bu ayarlarla hesaplanır. Önceden bu üç sayfa varsayılan ayarları
 * kullanıyordu. Bu yüzden ayar değişince sayfalar gelir planından farklı gelir gösteriyordu.
 */

/** Kur ve haftalık işe alım reklamı değişir. Kur bütün ₺ gelirini, reklam bütçenin Meta kalemini değiştirir. */
const DEGISEN: Partial<Params> = { eurTry: Math.round(DEFAULT_PARAMS.eurTry * 120) / 100, metaWeekly: DEFAULT_PARAMS.metaWeekly * 2 };
const MODEL = buildModel({ ...DEFAULT_PARAMS, ...DEGISEN });
const GELIR = secenekGelirleri(MODEL);

async function ac(page: Page, adres: string, degisen: Partial<Params> = DEGISEN) {
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [PARAMS_KEY, JSON.stringify(degisen)] as const);
  // Bütçenin tabanı Sheets’ten okunur. Testte Sheets yanıt vermez, sayfa yalnız eklemeleri gösterir.
  await page.route('https://script.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false, hata: 'yetki', mesaj: 'test' }) }),
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(adres);
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}

test.describe('2027 gelirinin kaynağı', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Veri denetimi bir kez çalışır.');

  test('varsayılan ayarlarla 2027 geliri veri dosyasındaki tutarla aynıdır', () => {
    const g = secenekGelirleri(DEFAULT_MODEL);
    for (const s of SECENEKLER) {
      expect.soft(Math.round(g[s].yil), s).toBe(SECENEK_OZETI[s].gelirHedefi2027);
      expect.soft(Math.round(g[s].aralik), s).toBe(SECENEK_OZETI[s].gelirAralik2027);
    }
  });

  test('ayar değişince 2027 geliri değişir', () => {
    const v = secenekGelirleri(DEFAULT_MODEL);
    for (const s of SECENEKLER) expect.soft(GELIR[s].yil, s).toBeGreaterThan(v[s].yil * 1.1);
    expect(gelirBaglami(MODEL).gelirPlani2027).toBe(GELIR.medyan.yil);
  });

  test('plan Aralık 2027’den önce biterse 2027 aynı kurallarla tamamlanır', () => {
    const kisa = buildModel({ ...DEFAULT_PARAMS, simEndDate: '2027-06-30' });
    expect(plan2027(kisa).durum).toBe('uzatildi');
    expect(plan2027(DEFAULT_MODEL).durum).toBe('ayni');
    expect(secenekGelirleri(kisa)).toEqual(secenekGelirleri(DEFAULT_MODEL));
  });

  test('senaryo 2027’de başlarsa gelir öngörüsü varsayılan ayarları kullanır', () => {
    const gec = buildModel({ ...DEFAULT_PARAMS, simStartDate: '2027-02-01', firstSaleDate: '2027-02-01' });
    expect(gelirBaglami(gec).durum).toBe('varsayilan');
    expect(gelirBaglami(MODEL).durum).toBe('ayni');
  });
});

test.describe('kaydedilen ayarların sınır durumları', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Veri denetimi bir kez çalışır.');
  const meta = (p: Partial<Params>) => butce(null, 'medyan', VARSAYILAN_AYAR, buildModel({ ...DEFAULT_PARAMS, ...p })).kalemler.find((k) => k.id === 'meta')!;

  test('Meta gideri kaydedilen başlangıç ayından başlar', () => {
    const aylik = (DEFAULT_PARAMS.metaWeekly * 52) / 12;
    expect(meta({}).aylik).toEqual(Array(12).fill(aylik));
    const temmuz = meta({ metaStartDate: '2027-07-01' });
    expect(temmuz.aylik).toEqual([...Array(6).fill(0), ...Array(6).fill(aylik)]);
    expect(temmuz.kural).toContain('Temmuz 2027');
    const sonra = meta({ metaStartDate: '2028-03-01' });
    expect(sonra.aylik).toEqual(Array(12).fill(0));
    expect(sonra.kural).toContain('2027’de bu kalem 0 ₺');
  });

  test('Meta haftalık tutarı ondalığı korur', () => {
    expect(meta({ metaWeekly: 5000.5 }).kural).toContain('haftalık reklam bütçesi 5.000,5 ₺’dır');
  });

  test('uyarı kutusu yatırımı, düşük oranı ve gelirsiz yılı doğru yazar', () => {
    const ozet = (p: Partial<Params>) => gelirleOzet(secenekGelirleri(buildModel({ ...DEFAULT_PARAMS, ...p })));
    const ilk = (p: Partial<Params>, yatirim = 0) => dikkatOf(ozet(p), yatirim)[0];
    expect(ilk({}).baslik).toBe('Kadro gideri gelirin büyük kısmını tüketir');
    expect(ilk({}).metin).toContain('zarar eder');
    expect(ilk({}).metin).toContain('yatırım 0 ₺’dır');
    expect(ilk({}, 5_000_000).metin).toContain(`yatırım ${tl(5_000_000)} olarak yazılıdır`);
    const yuksek = ilk({ eurTry: DEFAULT_PARAMS.eurTry * 3 });
    expect(yuksek.baslik).toBe('Kadro giderinin gelire oranı');
    expect(yuksek.metin).not.toContain('zarar eder');
    const gelirsiz = ilk({ firstSaleDate: '2028-01-01' });
    expect(gelirsiz.metin).toContain('abonelik geliri oluşmuyor');
    expect(gelirsiz.metin).not.toContain('—');
  });

  test('senaryo 2027’den sonra başlarsa 2027 geliri 0 ₺ sayılır', () => {
    const sonra = buildModel({ ...DEFAULT_PARAMS, simStartDate: '2028-02-01', firstSaleDate: '2028-02-01', simEndDate: '2028-12-31' });
    expect(plan2027(sonra).durum).toBe('sonra');
    for (const s of SECENEKLER) expect(secenekGelirleri(sonra)[s].yil).toBe(0);
  });
});

test('2027 bütçesi geliri ve Meta kalemini kaydedilen ayarlarla hesaplar', async ({ page }) => {
  await ac(page, 'butce-2027/');
  const b = butce(null, 'medyan', VARSAYILAN_AYAR, MODEL);
  expect(b.gelir2027).toBe(GELIR.medyan.yil);
  const stats = page.locator('#secenek .stats');
  await expect(stats).toContainText(`2027 abonelik geliri ${milyon(GELIR.medyan.yil)} olur`);
  const fark = b.gelir2027 - toplam(b.opex) - toplam(b.capex);
  await expect(stats).toContainText(`${milyon(Math.abs(fark))} ${fark < 0 ? 'açık' : 'fazla'}`);
  await expect(page.locator('#kalemler')).toContainText(`haftalık reklam bütçesi ${num(DEGISEN.metaWeekly!)} ₺’dır`);
  const karsilastirma = page.locator('#karsilastirma');
  for (const s of SECENEKLER) await expect(karsilastirma).toContainText(milyon(GELIR[s].yil));
});

test('İstihdam takvimi v2 gider oranını kaydedilen ayarların gelirine göre hesaplar', async ({ page }) => {
  await ac(page, 'istihdam/?surum=v2');
  const oran = (s: SecenekId) => Math.round((SECENEK_OZETI[s].toplamMaliyet2027 / GELIR[s].yil) * 1000) / 10;
  await expect(page.locator('#secenek .stats')).toContainText(`Bu gelir ${tl(GELIR.medyan.yil)} olur`);
  const tablo = page.locator('#karsilastirma');
  for (const s of SECENEKLER) {
    await expect(tablo).toContainText(tl(GELIR[s].yil));
    await expect(tablo).toContainText(`%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(oran(s))}`);
  }
});

test('Gelir öngörüsü kaydedilen ayarlarla hesaplanır; ChatGPT karşılaştırmasının varsayılan ayarla yapıldığını yazar', async ({ page }) => {
  await ac(page, 'gelir-ongorusu-2027/');
  const o = ongoru('medyan', 'ikisi', gelirBaglami(MODEL));
  const stats = page.locator('#ongoru .stats');
  for (const v of [o.gelir.kotumser, o.gelir.medyan, o.gelir.iyimser]) await expect(stats).toContainText(milyon(v));
  await expect(page.locator('#ongoru')).toContainText(`Plan senaryosu 2027 için ${milyon(GELIR.medyan.yil)} gelir öngörür`);
  await expect(page.locator('#chatgpt')).toContainText('varsayılan ayarlarla');
});

test('varsayılan ayarlarda ChatGPT notu çıkmaz; kısa planda sayfa 2027’yi tamamladığını yazar', async ({ page }) => {
  await ac(page, 'gelir-ongorusu-2027/', {});
  await expect(page.locator('#chatgpt')).not.toContainText('varsayılan ayarlarla');
  await ac(page, 'butce-2027/', { simEndDate: '2027-06-30' });
  await expect(page.getByText('Aralık 2027’den önce bitiyor')).toBeVisible();
  await expect(page.locator('#secenek .stats')).toContainText(`2027 abonelik geliri ${milyon(secenekGelirleri(DEFAULT_MODEL).medyan.yil)} olur`);
});

test('senaryo 2027’de başlarsa gelir öngörüsü bunu yazar; bütçe kaydedilen yatırımı yazar', async ({ page }) => {
  await ac(page, 'gelir-ongorusu-2027/', { simStartDate: '2027-02-01', firstSaleDate: '2027-02-01' });
  await expect(page.getByText('Bu yüzden bu sayfa varsayılan ayarları kullanır.')).toBeVisible();
  await expect(page.locator('#ongoru')).toContainText(`Varsayılan ayarlarla “Gelir planı” sayfasındaki Plan senaryosu 2027 için ${milyon(secenekGelirleri(DEFAULT_MODEL).medyan.yil)} gelir öngörür`);
  await ac(page, 'butce-2027/', { investmentAmount: 5_000_000 });
  await expect(page.locator('#kararlar')).toContainText(`yatırım girişi şu an ${tl(5_000_000)}’dır`);
});

test('2027’de gelir yoksa İstihdam takvimi v2 oran yerine açıklama yazar', async ({ page }) => {
  await ac(page, 'istihdam/?surum=v2', { firstSaleDate: '2028-01-01' });
  await expect(page.locator('#secenek .stats')).toContainText('oran hesaplanmaz');
  const dikkat = page.locator('#dikkat');
  await expect(dikkat).toContainText('abonelik geliri oluşmuyor');
  await expect(dikkat).not.toContainText('%—');
});
