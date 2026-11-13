import { expect, test, type Locator, type Page } from './fixtures/persona';
import { buildModel, DEFAULT_MODEL } from '../src/data/model';
import { DEFAULT_PARAMS, PARAMS_KEY, type Params } from '../src/data/params';
import { SCENARIO_IDS, SCENARIO_KEY, type ScenarioId } from '../src/lib/scenario';
import { int, pct, tl } from '../src/lib/format';
import { longDate } from '../src/lib/dates';
import { ASAMALAR, KARARLAR, NET_SAAT, OLAYLAR, PLAN_ROLLERI, TAKVIM_BAS, TAKVIM_SON, YONETICI_YUKU } from '../src/data/istihdamPlani';
import { KUMELER, POZISYONLAR, SECENEKLER, SECENEK_ADI, SECENEK_OZETI, takvim2027, type SecenekId } from '../src/data/istihdamV2';

/** Parametre grubunu açan düğme. Başlık düzeyine bağlı değildir (grup başlığı h2 ya da h3 olabilir). */
const grupDugmesi = (page: Page, ad: string) => page.getByRole('heading', { name: new RegExp(`^${ad}`) }).getByRole('button');

/**
 * Planlama sayfalarında görünümün kendisinin hesapladığı sayılar. Beklenen değerler modelden ve veriden hesaplanır.
 * Sayfadaki bugünkü çıktı kopyalanmaz. Sayfalar: İstihdam takvimi (1. ve 2. sürüm), 90 gün hedefleri, Parametreler,
 * Kadro kapasitesi, Eylem planı ve rol sayfaları. Tarihe bağlı durumlar sabit saatle denenir.
 */

test.beforeEach(async ({ page }) => {
  // Sheets isteği boş yanıtla kapanır. Ortak kayıt (persona) isteği fixture'daki sahte sunucuya gider.
  await page.route('https://script.google.com/**', async (route) => {
    let servis = '';
    try {
      servis = (JSON.parse(route.request().postData() ?? '{}') as { service?: string }).service ?? '';
    } catch {
      servis = '';
    }
    if (servis === 'persona') {
      await route.fallback();
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' });
  });
});

async function ac(page: Page, yol: string) {
  await page.goto(yol);
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}
/** Parametre kaydı sayfa açılmadan önce yazılır (Parametreler sayfasının kullandığı anahtar). */
const parametre = (page: Page, deger: Partial<Params>) => page.addInitScript(([k, v]) => localStorage.setItem(k, v), [PARAMS_KEY, JSON.stringify(deger)] as const);
const tablo = (kap: Page | Locator, id: string) => kap.locator(`.table-block:has(#${id}-tablo)`);
const stat = (kap: Locator, etiket: string) => kap.locator('.stat').filter({ has: kap.page().locator('dt').filter({ hasText: etiket }) });

/** Başlığı verilen sütunun bütün hücreleri, satır sırasıyla. Satır başlığı da bir sütun sayılır. */
async function sutun(t: Locator, baslik: RegExp) {
  await expect(t.locator('thead th').first()).toBeVisible();
  const basliklar = (await t.locator('thead th').allTextContents()).map((s) => s.trim());
  const i = basliklar.findIndex((b) => baslik.test(b));
  expect(i, `${baslik} sütunu yok: ${basliklar.join(' | ')}`).toBeGreaterThanOrEqual(0);
  return t.locator('tbody tr').locator(`xpath=./*[${i + 1}]`);
}
const sayiOnu = (n: number, birim: string) => new RegExp(`(^|[^\\d.])${int(n).replace('.', '\\.')} ${birim}`);

/* ---------- İstihdam takvimi 1. sürüm: kadro katkısı ve ortak senaryo ---------- */

test.describe('İstihdam takvimi 1. sürüm: kadro katkısı', () => {
  const H = DEFAULT_MODEL.staffing.horizon;
  const st = DEFAULT_MODEL.staffing.byId;

  async function katkiDenetle(page: Page, id: ScenarioId) {
    const katki = page.locator('#katki');
    const s = st[id];
    await expect(katki.getByRole('group', { name: 'Senaryo' }).getByRole('button', { name: s.scenario.name, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(stat(katki, `Kadro gideri, ${H} ay`).locator('.stat-value')).toHaveText(tl(s.toplam.gider));
    await expect(stat(katki, `Gelire katkı, ${H} ay`).locator('.stat-value')).toHaveText(tl(s.toplam.katki));
    await expect(stat(katki, 'Net katkı').locator('.stat-value')).toHaveText(tl(s.toplam.net));
    const t = tablo(katki, 'istihdam-katki');
    await expect(t.locator('tbody tr')).toHaveCount(s.rows.length);
    await expect(t.locator('tbody th')).toHaveText(s.rows.map((r) => r.role.name));
    await expect(await sutun(t, new RegExp(`^${H} ay gider$`))).toHaveText(s.rows.map((r) => tl(r.gider)));
    await expect(await sutun(t, /^Gelire katkı$/)).toHaveText(s.rows.map((r) => (r.dogrudan ? tl(r.katki) : 'Dolaylı')));
    await expect(await sutun(t, /^Net$/)).toHaveText(s.rows.map((r) => (r.dogrudan ? tl(r.net) : `${tl(r.net)} (yalnız gider)`)));
  }

  test('senaryo değişince özet ve tablo değişir; seçim saklanır, gelir planı ve nakit akışı aynı senaryoyu açar', async ({ page }) => {
    // Ön koşul: üç senaryo farklı sonuç verir. Yoksa test değişimi göremez.
    expect(new Set(SCENARIO_IDS.map((id) => tl(st[id].toplam.katki))).size).toBe(3);
    await ac(page, 'istihdam/');
    await katkiDenetle(page, 'medyan');
    await page.locator('#katki').getByRole('group', { name: 'Senaryo' }).getByRole('button', { name: st.kotumser.scenario.name, exact: true }).click();
    await katkiDenetle(page, 'kotumser');
    expect(await page.evaluate((k) => localStorage.getItem(k), SCENARIO_KEY)).toBe('kotumser');
    await ac(page, 'gelir-plani/');
    await expect(page.locator('.kurucu').getByRole('group', { name: 'Hazır senaryolar' }).getByRole('button', { name: 'Kötümser', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await ac(page, 'nakit-akisi/');
    await expect(page.getByRole('group', { name: 'Senaryo' }).first().getByRole('button', { name: 'Kötümser', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('gelir planında seçilen senaryo İstihdam takviminde açılır ve hesaplar ona göre yapılır', async ({ page }) => {
    await ac(page, 'gelir-plani/');
    const hazir = page.locator('.kurucu').getByRole('group', { name: 'Hazır senaryolar' });
    await hazir.getByRole('button', { name: 'İyimser', exact: true }).click();
    await expect(hazir.getByRole('button', { name: 'İyimser', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await ac(page, 'istihdam/');
    await katkiDenetle(page, 'iyimser');
  });
});

/* ---------- İstihdam takvimi 2. sürüm: seçenek hesapları ---------- */

test.describe('İstihdam takvimi 2. sürüm: seçenek hesapları', () => {
  const yuzde1 = (v: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(Math.round(v * 10) / 10)}`;
  const kadrolu = (b: string) => b === 'Tam zamanlı' || b === 'Yarı zamanlı';
  /** Beklenen değerler pozisyon listesinden hesaplanır. Gelir, gelir planından gelen girdidir. */
  function beklenen(s: SecenekId) {
    const secili = POZISYONLAR.filter((p) => p.secenekler[s].kisi > 0);
    const kisi = (bicim: string) => secili.filter((p) => p.secenekler[s].bicim === bicim).reduce((t, p) => t + p.secenekler[s].kisi, 0);
    const gider = POZISYONLAR.reduce((t, p) => t + p.secenekler[s].yillikMaliyet2027, 0);
    const takvim = takvim2027(s);
    const oz = SECENEK_OZETI[s];
    return {
      kadro: takvim[11].kadro,
      yeni: secili.filter((p) => !p.eski && !p.mevcut && kadrolu(p.secenekler[s].bicim)).reduce((t, p) => t + p.secenekler[s].kisi, 0),
      disHizmet: kisi('Dış hizmet'),
      serbest: kisi('Serbest çalışan'),
      gider,
      gelir: oz.gelirHedefi2027,
      oran: yuzde1((gider / oz.gelirHedefi2027) * 100),
      aralikGider: takvim[11].gider,
      aralikOran: yuzde1((takvim[11].gider / oz.gelirAralik2027) * 100),
    };
  }
  const sec = (page: Page, s: SecenekId) => page.locator('#secenek').getByRole('group', { name: 'Seçenek' }).getByRole('button', { name: SECENEK_ADI[s], exact: true }).click();

  test('her seçenekte kadro, yeni kadro, hizmet sayısı, gider, gelir ve gider oranı veriden hesaplanır', async ({ page }) => {
    await ac(page, 'istihdam/?surum=v2');
    const secenek = page.locator('#secenek');
    for (const s of SECENEKLER) {
      await sec(page, s);
      const b = beklenen(s);
      await expect(stat(secenek, 'Aralık 2027 kadro').locator('.stat-value'), s).toHaveText(`${int(b.kadro)} kişi`);
      await expect(stat(secenek, 'Aralık 2027 kadro').locator('.stat-note'), s).toContainText(sayiOnu(b.yeni, 'kişi'));
      await expect(stat(secenek, 'Dış hizmet ve serbest').locator('.stat-value'), s).toHaveText(`${int(b.disHizmet + b.serbest)} hizmet`);
      await expect(stat(secenek, 'Dış hizmet ve serbest').locator('.stat-note'), s).toContainText(sayiOnu(b.disHizmet, 'dış hizmet'));
      await expect(stat(secenek, 'Dış hizmet ve serbest').locator('.stat-note'), s).toContainText(sayiOnu(b.serbest, 'serbest çalışan'));
      await expect(stat(secenek, '2027 kadro ve hizmet gideri').locator('.stat-value'), s).toHaveText(tl(b.gider));
      await expect(stat(secenek, 'Giderin gelire oranı').locator('.stat-value'), s).toHaveText(b.oran);
      await expect(stat(secenek, 'Giderin gelire oranı').locator('.stat-note'), s).toContainText(tl(b.gelir));
    }
  });

  test('karşılaştırma tablosu sayıları veriden; seçili satır (data-tone="secili") seçeneği izler', async ({ page }) => {
    await ac(page, 'istihdam/?surum=v2');
    const t = tablo(page, 'secenekler');
    const satirlar = t.locator('tbody tr');
    await expect(satirlar).toHaveCount(SECENEKLER.length);
    await expect(t.locator('tbody th')).toHaveText(SECENEKLER.map((s) => SECENEK_ADI[s]));
    const hepsi = SECENEKLER.map(beklenen);
    await expect(await sutun(t, /^Aralık 2027 kadro$/)).toHaveText(hepsi.map((b) => `${int(b.kadro)} kişi`));
    await expect(await sutun(t, /^Yeni kadro$/)).toHaveText(hepsi.map((b) => `${int(b.yeni)} kişi`));
    await expect(await sutun(t, /^2027 gideri$/)).toHaveText(hepsi.map((b) => tl(b.gider)));
    await expect(await sutun(t, /^2027 geliri$/)).toHaveText(hepsi.map((b) => tl(b.gelir)));
    await expect(await sutun(t, /^Gider oranı$/)).toHaveText(hepsi.map((b) => b.oran));
    const tonlar = () => satirlar.evaluateAll((els) => els.map((e) => e.getAttribute('data-tone')));
    // Varsayılan seçenek Medyan'dır.
    await expect.poll(tonlar).toEqual(SECENEKLER.map((s) => (s === 'medyan' ? 'secili' : null)));
    for (const s of ['ekonomik', 'guclu', 'medyan'] as SecenekId[]) {
      await sec(page, s);
      await expect.poll(tonlar, s).toEqual(SECENEKLER.map((x) => (x === s ? 'secili' : null)));
    }
  });

  test('Ekonomik seçenekte küme tablosu yalnız seçenekteki pozisyonları, altındaki liste dışarıda kalanları gösterir', async ({ page }) => {
    const s: SecenekId = 'ekonomik';
    // Ön koşul: Ekonomik seçenekte dışarıda kalan pozisyon var.
    expect(POZISYONLAR.some((p) => p.secenekler[s].kisi === 0)).toBe(true);
    await ac(page, 'istihdam/?surum=v2');
    await sec(page, s);
    const bos = KUMELER.filter((k) => !POZISYONLAR.some((p) => p.kume === k.id && p.secenekler[s].kisi > 0));
    await expect(page.locator('#pozisyonlar .iv2-kume-bos')).toHaveCount(bos.length);
    for (const k of KUMELER) {
      const tum = POZISYONLAR.filter((p) => p.kume === k.id);
      const iceride = tum.filter((p) => p.secenekler[s].kisi > 0);
      const disarida = tum.filter((p) => p.secenekler[s].kisi === 0).map((p) => p.unvan);
      if (!iceride.length) {
        // Boş küme: tablo yok, yalnız küme adı, boş küme yazısı ve dışarıda kalanlar.
        const kutu = page.locator('#pozisyonlar .iv2-kume-bos').filter({ hasText: k.ad });
        await expect(kutu.locator('li'), k.ad).toHaveText(disarida);
        continue;
      }
      await expect(tablo(page, `kume-${k.id}`).locator('tbody tr'), k.ad).toHaveCount(iceride.length);
      await expect(page.locator(`.table-block:has(#kume-${k.id}-tablo) + .iv2-disarida li`), k.ad).toHaveText(disarida);
    }
  });

  test('Aralık 2027 aylık gideri her yerde takvimle aynı; bir kerelik hizmet yalnız başladığı aya yazılır', async ({ page }) => {
    // istihdamV2.ts aylikGider(): aylık bedeli olmayan hizmet bir kerelik giderdir ve başlangıç ayına yazılır.
    await ac(page, 'istihdam/?surum=v2');
    const hepsi = SECENEKLER.map(beklenen);
    await expect.soft(await sutun(tablo(page, 'secenekler'), /Aralık 2027.*gider oranı/)).toHaveText(hepsi.map((b) => b.aralikOran));
    for (const [i, s] of SECENEKLER.entries()) {
      await sec(page, s);
      const aralik = (await sutun(tablo(page, 'takvim-2027'), /^Aylık gider$/)).last();
      await expect(aralik, `${s} takvim`).toHaveText(tl(hepsi[i].aralikGider));
      await expect.soft(stat(page.locator('#secenek'), '2027 kadro ve hizmet gideri').locator('.stat-note'), `${s} özet notu`).toContainText(tl(hepsi[i].aralikGider));
    }
  });
});

/* ---------- 90 gün hedefleri ---------- */

test.describe('90 gün hedefleri: görünümde hesaplanan sayılar', () => {
  const toplam = (v: number[]) => v.reduce((a, b) => a + b, 0);
  const ondalik1 = (v: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v);

  function hedef(p: Params) {
    const m = buildModel(p);
    const ilk = toplam(m.NEW_ACTIVE);
    // En kötü durumda hiçbir satıcı yenilemez: ciro yalnız ilk ödemelerdir.
    const acik = m.CIRO_TARGET - ilk * m.SUBSCRIPTION_TRY;
    const acikAy = Math.ceil(m.CIRO_TARGET / m.SUBSCRIPTION_TRY - ilk);
    return { m, acik, acikAy, yillikAdet: Math.ceil(acik / (m.ANNUAL_TRY - m.SUBSCRIPTION_TRY)) };
  }

  async function hedefDenetle(page: Page, p: Params) {
    const { m, acikAy, yillikAdet } = hedef(p);
    // Senaryo tablosu: elde tutma oranına göre satıcı-ay, ciro ve hedefe göre fark.
    const senaryo = tablo(page, 'senaryo');
    const satirlar = m.RETENTION_SCENARIOS.map((r) => {
      const o = m.payments(r);
      const ciro = o.total * m.SUBSCRIPTION_TRY;
      return { r, ay: o.total, ciro };
    });
    await expect(senaryo.locator('tbody th')).toHaveText(satirlar.map((s) => pct(s.r)));
    await expect(await sutun(senaryo, /^Satıcı-ay$/)).toHaveText(satirlar.map((s) => ondalik1(s.ay)));
    await expect(await sutun(senaryo, /^Ciro$/)).toHaveText(satirlar.map((s) => tl(s.ciro)));
    await expect(await sutun(senaryo, /^Hedefe göre$/)).toHaveText(satirlar.map((s) => (s.ciro >= m.CIRO_TARGET ? `+${tl(s.ciro - m.CIRO_TARGET)}` : `−${tl(m.CIRO_TARGET - s.ciro)}`)));
    // Açığı tek başına kapatan adet.
    const acikTablo = tablo(page, 'acik');
    await expect(acikTablo.locator('tbody tr')).toHaveCount(2);
    await expect(await sutun(acikTablo, /^Gereken adet$/)).toHaveText([String(yillikAdet), String(acikAy)]);
    await expect((await sutun(acikTablo, /^Tutar$/)).first()).toHaveText(tl(m.ANNUAL_TRY));
    // Kaynak tablosu: kanal satırları ve Toplam satırı.
    const kaynak = tablo(page, 'kaynak');
    const hucre = (kayit: number, aktif: number) => `${kayit} kayıt, ${aktif} yeni aktif`;
    await expect(kaynak.locator('tbody th')).toHaveText([...m.targetPlan.map((t) => t.source), 'Toplam']);
    for (const [i, ay] of m.MONTHS.entries()) {
      await expect(await sutun(kaynak, new RegExp(`^${ay}$`)), ay).toHaveText([
        ...m.targetPlan.map((t) => hucre(t.kayit[i], t.aktif[i])),
        hucre(toplam(m.targetPlan.map((t) => t.kayit[i])), toplam(m.targetPlan.map((t) => t.aktif[i]))),
      ]);
    }
    await expect(await sutun(kaynak, /^Toplam$/)).toHaveText([
      ...m.targetPlan.map((t) => hucre(toplam(t.kayit), toplam(t.aktif))),
      hucre(toplam(m.targetPlan.flatMap((t) => t.kayit)), toplam(m.targetPlan.flatMap((t) => t.aktif))),
    ]);
    await expect(kaynak.locator('tbody tr').last()).toHaveAttribute('data-tone', 'total');
  }

  async function uyeNotu(page: Page, p: Params) {
    const { acikAy } = hedef(p);
    await expect((await sutun(tablo(page, 'acik'), /^Not$/)).nth(1)).toContainText(`${p.memberTarget} üyenin ${pct(acikAy / p.memberTarget)}`);
  }

  test('varsayılan parametrelerle senaryo tablosu, açığı kapatan adet ve kaynak toplamı modelden', async ({ page }) => {
    await ac(page, 'hedefler/');
    await hedefDenetle(page, DEFAULT_PARAMS);
    await uyeNotu(page, DEFAULT_PARAMS);
  });

  test('parametre değişince aynı hesaplar yeni değerlerle yapılır', async ({ page }) => {
    const degisen = { subscriptionEur: 299, activeTarget: 80 };
    const p = { ...DEFAULT_PARAMS, ...degisen };
    // Ön koşul: değişiklik iki adedi ve senaryo satırlarını gerçekten değiştirir.
    expect([hedef(p).yillikAdet, hedef(p).acikAy]).not.toEqual([hedef(DEFAULT_PARAMS).yillikAdet, hedef(DEFAULT_PARAMS).acikAy]);
    expect(hedef(p).m.RETENTION_SCENARIOS).not.toEqual(DEFAULT_MODEL.RETENTION_SCENARIOS);
    await parametre(page, degisen);
    await ac(page, 'hedefler/');
    await hedefDenetle(page, p);
    await uyeNotu(page, p);
  });

  test('“üyenin yüzde kaçı” notu üye satıcı hedefini izler', async ({ page }) => {
    // AGENTS.md: sayı içeren metin parametreden üretilir, sabit yazılmaz.
    const p = { ...DEFAULT_PARAMS, memberTarget: 600 };
    await parametre(page, { memberTarget: 600 });
    await ac(page, 'hedefler/');
    await expect(stat(page.locator('main'), 'Üye satıcı').locator('.stat-value')).toHaveText(int(600));
    await uyeNotu(page, p);
  });
});

/* ---------- Parametreler: türetilen değerler ve tarih seçici ---------- */

test.describe('Parametreler: türetilen değerler', () => {
  const satir = (page: Page, etiket: string) =>
    tablo(page, 'turetilen')
      .locator('tbody tr')
      .filter({ has: page.getByRole('rowheader', { name: etiket }) })
      .locator('td');

  async function turetilenDenetle(page: Page, p: Params) {
    const m = buildModel(p);
    // Kota, saha personelinin işveren maliyetidir. İşveren maliyeti maaş × çarpandır.
    await expect(satir(page, 'Saha kotası')).toContainText(tl(p.sahaSalary * p.costFactor));
    const maaslar: [string, number][] = [
      ['Saha satış: maaş', p.sahaSalary],
      ['Ekip lideri: maaş', p.sahaSalary + p.leadUplift],
      ['İstoç Pazarlama CRM uzmanı: maaş', p.masaSalary],
      ['Segika CRM: maaş', p.segikaSalary],
      ['Dijital pazarlama: maaş', p.minWage * p.dijitalMultiplier],
      ['Asistan: maaş', p.minWage * p.asistanMultiplier],
      ['Organizatör: maaş', p.organizatorSalary],
    ];
    for (const [etiket, maas] of maaslar) {
      await expect(satir(page, etiket), etiket).toContainText(tl(maas));
      await expect(satir(page, etiket), etiket).toContainText(tl(maas * p.costFactor));
    }
    await expect(satir(page, '90 günlük personel maliyeti')).toHaveText(tl(m.staffCost90));
    await expect(satir(page, 'Aylık abonelik')).toHaveText(tl(p.subscriptionEur * p.eurTry));
    await expect(satir(page, 'Yıllık peşin abonelik')).toHaveText(tl(p.subscriptionEur * p.eurTry * p.annualMonths));
    await expect(satir(page, 'gereken aylık ödeme sayısı')).toHaveText(int(Math.ceil(p.ciroTarget / (p.subscriptionEur * p.eurTry))));
    // Elde tutma eşiği: hedefe ulaştıran en düşük tam yüzde; %100 de yetmezse eşik yoktur.
    const ulasir = (r: number) => m.payments(r).total * m.SUBSCRIPTION_TRY >= p.ciroTarget;
    const esik = ulasir(1) ? Array.from({ length: 101 }, (_, i) => i / 100).find(ulasir)! : null;
    if (esik === null) await expect(satir(page, 'gereken aylık elde tutma')).not.toContainText('%');
    else await expect(satir(page, 'gereken aylık elde tutma')).toContainText(pct(esik));
    await expect(satir(page, '60. ve 90. gün kontrolleri')).toHaveText(`${longDate(m.dates.day60)} ve ${longDate(m.dates.day90)}`);
    await expect(satir(page, 'Dönem 2')).toContainText(longDate(m.dates.period2Start));
  }

  test('türetilen değerler modelden; çarpan ve abonelik değişince tablo hemen güncellenir', async ({ page }) => {
    await ac(page, 'parametreler/');
    await turetilenDenetle(page, DEFAULT_PARAMS);
    await grupDugmesi(page, 'Ücret').click();
    const carpan = page.getByLabel('İşveren maliyeti çarpanı', { exact: true });
    await carpan.fill('2,5');
    await carpan.blur();
    await grupDugmesi(page, '90 gün hedefleri').click();
    const abonelik = page.getByLabel('Aktif satıcı aboneliği', { exact: true });
    await abonelik.fill('299');
    await abonelik.blur();
    const p = { ...DEFAULT_PARAMS, costFactor: 2.5, subscriptionEur: 299 };
    // Ön koşul: yeni abonelikle hedef abonelikle tutmaz; eşik satırı “yok” durumuna geçer.
    expect(buildModel(p).retentionThreshold).toBeNull();
    await turetilenDenetle(page, p);
    const kayit = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), PARAMS_KEY);
    expect(kayit).toMatchObject({ costFactor: 2.5, subscriptionEur: 299 });
  });

  test('“Program başlangıcı” takvimden seçilir; kontrol günleri ve başka sayfadaki dönem kayar', async ({ page }) => {
    const once = buildModel(DEFAULT_PARAMS);
    const p = { ...DEFAULT_PARAMS, startDate: '2026-11-15' };
    const sonra = buildModel(p);
    await ac(page, 'hedefler/');
    await expect(page.locator('.page-meta')).toContainText(`${longDate(once.dates.start)} ile ${longDate(once.dates.day90)} arası`);
    await ac(page, 'parametreler/');
    await grupDugmesi(page, 'Takvim').click();
    const alan = page.getByLabel('Program başlangıcı');
    await expect(alan).toBeVisible();
    await expect(alan).toHaveValue('1 Kasım 2026');
    await alan.click();
    await page.getByRole('button', { name: '15 Kasım 2026', exact: true }).click();
    await expect(alan).toHaveValue('15 Kasım 2026');
    await turetilenDenetle(page, p);
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').startDate, PARAMS_KEY)).toBe('2026-11-15');
    await ac(page, 'hedefler/');
    await expect(page.locator('.page-meta')).toContainText(`${longDate(sonra.dates.start)} ile ${longDate(sonra.dates.day90)} arası`);
  });
});

/* ---------- Kadro kapasitesi ---------- */

test('Kadro kapasitesi: her rolün kapasite yazısı ve yöneticinin yük dökümü veriden', async ({ page }) => {
  await ac(page, 'kadro-kapasitesi/');
  const roller = page.locator('.tk-rol');
  await expect(roller).toHaveCount(PLAN_ROLLERI.length + 1);
  for (const [i, r] of PLAN_ROLLERI.entries()) {
    const kart = roller.nth(i);
    const kapasite = kart.locator('.tk-rol-kapasite');
    await expect(kart, r.ad).toContainText(r.ad);
    await expect(kapasite, r.ad).toContainText(`${r.saat} saat`);
    if (r.saat > NET_SAAT) {
      await expect(kapasite, r.ad).toContainText(`%${Math.round(((r.saat - NET_SAAT) / NET_SAAT) * 100)} aşar`);
      await expect(kart, r.ad).toHaveAttribute('data-edge', 'top');
    } else {
      await expect(kapasite, r.ad).toContainText('Kapasiteye sığar');
      await expect(kart, r.ad).not.toHaveAttribute('data-edge');
    }
    if (r.oneriSaat) await expect(kapasite, r.ad).toContainText(`${r.oneriSaat} saate iner`);
    else await expect(kapasite, r.ad).not.toContainText('saate iner');
  }
  // Yönetici: toplam yük, işe alım ve yönetim parçalarından oluşur.
  expect(YONETICI_YUKU.iseAlim + YONETICI_YUKU.yonetim).toBe(YONETICI_YUKU.saat);
  const yonetici = roller.last().locator('.tk-rol-kapasite');
  await expect(yonetici).toContainText(`${YONETICI_YUKU.saat} saat`);
  await expect(yonetici).toContainText(`${YONETICI_YUKU.iseAlim} saati işe alım`);
  await expect(yonetici).toContainText(`${YONETICI_YUKU.yonetim} saati`);
});

/* ---------- Bugüne bağlı durumlar ---------- */

const DURUM_ADI = { gecti: 'Tarihi geçti', bugun: 'Bugün', yakin: '7 gün içinde', plan: 'Planlandı' } as const;
type Durum = keyof typeof DURUM_ADI;
const utc = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
/** Kural: geçmiş gün “geçti”, bugün “bugün”, 1 ile 7 gün sonrası “7 gün içinde”, daha sonrası “planlandı”. */
function durum(tarih: string, bugun: string): Durum {
  const f = Math.round((utc(tarih) - utc(bugun)) / 86_400_000);
  return f < 0 ? 'gecti' : f === 0 ? 'bugun' : f <= 7 ? 'yakin' : 'plan';
}
/** Birden çok günlük aşama: bittiyse “geçti”, sürüyorsa “bugün”, başlamadıysa başlangıç gününe göre. */
const araligin = (bas: string, son: string, bugun: string): Durum => (bugun > son ? 'gecti' : bugun >= bas ? 'bugun' : durum(bas, bugun));
const ayAdi = (ay: string) => new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(utc(`${ay}-01`)));

const GUNLER = [
  { saat: '2026-10-30T10:00:00+03:00', bugun: '2026-10-30' },
  { saat: '2026-11-20T10:00:00+03:00', bugun: '2026-11-20' },
  { saat: '2027-01-15T10:00:00+03:00', bugun: '2027-01-15' },
  { saat: '2027-03-10T10:00:00+03:00', bugun: '2027-03-10' },
];

for (const g of GUNLER) {
  test(`İstihdam takvimi, bugün ${g.bugun}: aşama, sıradaki adım, durum etiketleri ve takvimin açıldığı ay`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(g.saat));
    await ac(page, 'istihdam/');
    const main = page.locator('main');
    const etkin = ASAMALAR.filter((a) => a.id.startsWith('f') && a.bas <= g.bugun && g.bugun <= a.son);
    const asama = etkin.length ? etkin.map((a) => a.ad.split(':')[0]).join(' ve ') : g.bugun < ASAMALAR[0].bas ? 'Başlamadı' : 'Takip';
    await expect(stat(main, 'Şu anki aşama').locator('.stat-value')).toHaveText(asama);
    const siradaki = OLAYLAR.find((o) => o.tarih >= g.bugun);
    await expect(stat(main, 'Sıradaki adım').locator('.stat-value')).toHaveText(siradaki ? longDate(siradaki.tarih) : 'Yok');
    if (siradaki) await expect(stat(main, 'Sıradaki adım').locator('.stat-note')).toHaveText(siradaki.baslik);
    // Zaman çizelgesi: olaylar ay ay; her olayın durumu bugüne göre.
    const aylar = [...new Set(OLAYLAR.map((o) => o.tarih.slice(0, 7)))];
    const sira = aylar.flatMap((ay) => OLAYLAR.filter((o) => o.tarih.startsWith(ay)));
    const olaylar = page.locator('.tk-olay');
    await expect(olaylar).toHaveCount(sira.length);
    await expect(olaylar.locator('.tk-durum')).toHaveText(sira.map((o) => DURUM_ADI[durum(o.tarih, g.bugun)]));
    await expect.poll(() => olaylar.evaluateAll((els) => els.map((e) => e.getAttribute('data-durum')))).toEqual(sira.map((o) => durum(o.tarih, g.bugun)));
    const aralikta = g.bugun >= TAKVIM_BAS && g.bugun <= TAKVIM_SON;
    await expect(page.locator('.tk-gantt-bugun')).toHaveCount(aralikta ? 1 : 0);
    // Takvim bugünün ayında açılır; bugün takvim dışındaysa ilk ayda.
    await page.locator('#plan').getByRole('group', { name: 'Görünüm' }).getByRole('button', { name: 'Takvim', exact: true }).click();
    const acilan = aralikta ? g.bugun.slice(0, 7) : TAKVIM_BAS.slice(0, 7);
    await expect(page.getByRole('grid', { name: `${ayAdi(acilan)} takvimi` })).toBeVisible();
    if (aralikta) {
      const bugunHucresi = page.locator('.tk-gun[data-bugun]');
      await expect(bugunHucresi).toHaveCount(1);
      await expect(bugunHucresi).toHaveAttribute('aria-label', new RegExp(`^${longDate(g.bugun)}`));
    }
  });
}

for (const g of [GUNLER[1], GUNLER[2]]) {
  test(`Eylem planı, bugün ${g.bugun}: güncel plandaki her satırın durumu bugüne göre`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(g.saat));
    await ac(page, 'eylem-plani/');
    const beklenenler = [
      ...ASAMALAR.filter((a) => a.id.startsWith('f')).map((a) => [a.ad, DURUM_ADI[araligin(a.bas, a.son, g.bugun)]]),
      ...OLAYLAR.map((o) => [o.baslik, DURUM_ADI[araligin(o.tarih, o.tarih, g.bugun)]]),
    ];
    const satirlar = page.locator('#guncel .tk-karar');
    await expect(satirlar).toHaveCount(beklenenler.length);
    await expect(satirlar.locator('.tk-durum')).toHaveCount(beklenenler.length);
    const okunan = await satirlar.evaluateAll((els) => els.map((e) => [e.querySelector('.tk-karar-konu')?.firstChild?.textContent?.trim() ?? '', e.querySelector('.tk-durum')?.textContent?.trim() ?? '']));
    expect(Object.fromEntries(okunan)).toEqual(Object.fromEntries(beklenenler));
  });

  test(`Kadro kapasitesi, bugün ${g.bugun}: kararların durum etiketi bugüne göre; tarihsiz kararda etiket yok`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(g.saat));
    await ac(page, 'kadro-kapasitesi/');
    const kararlar = page.locator('#kararlar .tk-karar');
    await expect(kararlar).toHaveCount(KARARLAR.length);
    await expect(kararlar.locator('.tk-durum')).toHaveCount(KARARLAR.filter((k) => k.tarih).length);
    const okunan = await kararlar.evaluateAll((els) => els.map((e) => [e.querySelector('.tk-karar-konu')?.firstChild?.textContent?.trim() ?? '', e.querySelector('.tk-durum')?.textContent?.trim() ?? '']));
    expect(Object.fromEntries(okunan)).toEqual(Object.fromEntries(KARARLAR.map((k) => [k.konu, k.tarih ? DURUM_ADI[durum(k.tarih, g.bugun)] : ''])));
  });
}

/* ---------- Rol sayfaları ---------- */

const dakika = (aralik: string) => {
  const [a, b] = aralik.split('–').map((t) => {
    const [s, d] = t.split(':').map(Number);
    return s * 60 + d;
  });
  return b - a;
};
const sure = (dk: number) => [Math.floor(dk / 60) ? `${Math.floor(dk / 60)} saat` : '', dk % 60 ? `${dk % 60} dakika` : ''].filter(Boolean).join(' ');

for (const rol of DEFAULT_MODEL.roles) {
  test(`Rol sayfası ${rol.slug}: zaman payı notu gün süresini ve en uzun üç işi veriden gösterir`, async ({ page }) => {
    // Aynı adlı bloklar toplanır. Mola çalışma süresine katılmaz.
    const toplamlar = new Map<string, number>();
    for (const r of rol.daily) if (r.tone !== 'break') toplamlar.set(r.block, (toplamlar.get(r.block) ?? 0) + dakika(r.time));
    const pay = [...toplamlar].sort((a, b) => b[1] - a[1]);
    const gun = pay.reduce((t, [, v]) => t + v, 0);
    await ac(page, `roller/${rol.slug}/`);
    const not = page.getByRole('figure', { name: 'Hafta içi zaman payı' }).locator('.chart-note');
    await expect(not).toContainText(sure(gun));
    const metin = (await not.textContent()) ?? '';
    const yerler = pay.slice(0, 3).map(([ad]) => metin.indexOf(`“${ad}”`));
    for (const [i, [ad, dk]] of pay.slice(0, 3).entries()) {
      expect(yerler[i], `${ad} notta yok`).toBeGreaterThanOrEqual(0);
      if (i) expect(yerler[i], `${ad} sırası`).toBeGreaterThan(yerler[i - 1]);
      expect(metin.slice(yerler[i], yerler[i + 1] ?? undefined), ad).toContain(sure(dk));
    }
    if (pay.length > 3 && pay[3][1] < pay[2][1]) expect(metin).not.toContain(`“${pay[3][0]}”`);
  });
}

test('Dijital pazarlama: “Asistan alınmazsa” notundaki tarih parametreyi izler', async ({ page }) => {
  await ac(page, 'roller/dijital-pazarlama/');
  const not = page.getByRole('complementary', { name: 'Asistan alınmazsa' });
  await expect(not).toContainText(longDate(DEFAULT_PARAMS.dijitalAltDate));
  await parametre(page, { dijitalAltDate: '2027-02-01' });
  await ac(page, 'roller/dijital-pazarlama/');
  await expect(not).toContainText(longDate('2027-02-01'));
  await expect(not).not.toContainText(longDate(DEFAULT_PARAMS.dijitalAltDate));
});
