import { expect, test, type Page } from '@playwright/test';
import { eur, paketler } from '../src/data/gelirModelleri';
import { ASAMALAR, BEKLEME_NOTU, HER_DURUMDA, KAPANIS_DURUMLARI, durumlar, sablonlar } from '../src/data/onboarding';
import { DEFAULT_PARAMS } from '../src/data/params';

/**
 * Yeni kayıt iş akışları (kullanıcı kararları 2026-11-10): sayfa CRM masası sorumlusu içindir. Ana akış dört aşamadır.
 * Her aşama “Başlar” başlığıyla açılır, numaralı durumları listeler, solda aşamanın sonuna inen çizgiyle sınırlanır ve
 * “Biter” başlığıyla kapanır. Biter bölümü sonraki aşamaya bağlanır. Aşamaya bağlı olmayan durumlar sonda numarasızdır.
 * Bir aşamanın ileri çıkışı, sonraki aşamanın başlama koşulu ve kayıt kartı durumuyla aynıdır (bağımsız inceleme, aynı gün).
 */
const TUM = durumlar(DEFAULT_PARAMS);
const HER_AN = TUM.filter((d) => d.yer === 'her-an');
const METINLER = sablonlar(DEFAULT_PARAMS);
const YASAK = /[;—·→]/;
/** Türkçe küçük harf: JavaScript’in `i` bayrağı “İ” ile “i” harfini eşlemez. */
const kucuk = (s: string) => s.toLocaleLowerCase('tr-TR');

async function ac(page: Page, genislik: number, yukseklik = 900, yol = 'onboarding/') {
  await page.setViewportSize({ width: genislik, height: yukseklik });
  await page.goto(yol);
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
}

test('veri: geçişler, hazır metinler, aşama sınırları ve kapanış durumları tutarlı, metinde yasak işaret yok', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'veri testi tarayıcıdan bağımsızdır, yalnız Chromium’da çalışır');
  const idler = new Set(TUM.map((d) => d.id));
  expect(idler.size, 'durum kimlikleri tekil').toBe(TUM.length);
  for (const d of TUM) {
    for (const a of d.adimlar) if (typeof a !== 'string') expect(idler.has(a.git), `${d.id} → ${a.git}`).toBe(true);
    if (d.sablon) expect(METINLER[d.sablon], `${d.id} hazır metni`).toBeTruthy();
    const metin = [d.ad, d.kart, ...d.adimlar.map((a) => (typeof a === 'string' ? a : a.metin))].join(' ');
    expect(metin, d.id).not.toMatch(YASAK);
  }
  for (const a of ASAMALAR) {
    expect(TUM.filter((d) => d.yer === a.no).length, `Aşama ${a.no} durumları`).toBeGreaterThan(0);
    for (const c of a.cikislar) {
      if (c.durum) expect(idler.has(c.durum), `Aşama ${a.no} çıkışı → ${c.durum}`).toBe(true);
      expect([c.kosul, c.sonuc, c.kart, c.sonra ?? ''].join(' ')).not.toMatch(YASAK);
      // Görünüm “{koşul} {sonuç}.” cümlesini kurar: koşul noktasız biter, sonuç küçük harfle başlar.
      expect(c.kosul, 'koşul cümlenin başıdır').not.toMatch(/[.:]$/);
      expect(c.sonuc, 'sonuç cümlenin sonudur').toMatch(/^[a-zçğıöşü]/);
      if (!c.git) continue;
      // Aşama sınırı tek anlamlıdır: ileri çıkışın koşulu sonraki aşamanın başlama koşulu, kartı sonraki aşamanın kartıdır.
      expect(c.git, `Aşama ${a.no} çıkışı bir sonraki aşamaya gider`).toBe(a.no + 1);
      const sonraki = ASAMALAR.find((x) => x.no === c.git)!;
      expect(sonraki.baslar, `Aşama ${c.git} başlangıcı`).toBe(c.kosul);
      expect(sonraki.kartDurumu, `Aşama ${c.git} kartı`).toBe(c.kart);
    }
    expect([a.ad, a.gun, a.baslar, a.kartDurumu].join(' ')).not.toMatch(YASAK);
  }
  // “Süreç biter” yalnız kaydı kapatan çıkışların kartlarını sayar. Bekleyen (Şimdi değil) kapanış değildir.
  const kapanan = new Set(ASAMALAR.flatMap((a) => a.cikislar.filter((c) => !c.git && !c.bekler).map((c) => c.kart)));
  expect([...kapanan].sort()).toEqual([...KAPANIS_DURUMLARI].sort());
  expect(HER_DURUMDA.join(' ')).not.toMatch(YASAK);
});

/**
 * Kullanıcı kararı 2026-11-10: metin CRM sorumlusunun ilk okuyuşta rahatça anlayacağı yalın Türkçe olmalı. “Biter:”,
 * “Kayıt kartı:”, “Durum: Yeni.” gibi etiket dizileri ve “Gün 3” gibi çeviri kokan kalıplar cümle yerine geçmez.
 */
test('dil: açıklamalar tam cümledir, etiket dizisi ve “Gün n” kalıbı yok', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'veri testi tarayıcıdan bağımsızdır, yalnız Chromium’da çalışır');
  const tum = [
    ...HER_DURUMDA,
    BEKLEME_NOTU,
    ...ASAMALAR.flatMap((a) => [a.gun, a.baslar, ...a.cikislar.flatMap((c) => [c.kosul, c.sonuc, c.sonra ?? ''])]),
    ...TUM.flatMap((d) => [d.ad, d.kart, ...d.adimlar.map((a) => (typeof a === 'string' ? a : a.metin))]),
    ...Object.values(METINLER).flatMap((s) => [s.ad, s.konu ?? '', s.metin]),
  ];
  for (const m of tum) expect(m, 'gün “3. gün” biçiminde yazılır').not.toMatch(/\bGün \d/);
  // “1. ile 3. gün” iki ayrı gün gibi okunur, aralık “1. günden 3. güne kadar” yazılır (bağımsız okuma bulgusu).
  for (const m of tum) expect(m, 'gün aralığı').not.toMatch(/\d\. ile \d+\. gün/);
  // “Sonraki adım” bir kart alanıdır: “Sonraki adım olarak … yazın” yerine “Sonraki adım” alanına … girin.”
  for (const m of tum) expect(m, '“Sonraki adım” alanı').not.toMatch(/Sonraki adım olarak/);
  // Kayıt kartı talimatı cümledir: “Durumu “Etkin” yapın.” Etiketle başlayan parça kabul edilmez.
  const ETIKET = /(^|[.!?] )(Durum|Sonraki adım|Ret nedeni|Not|Kayıt kartı|Biter|Başka sonuç|Sonra): /;
  for (const d of TUM) expect(d.kart, `${d.id} kayıt kartı`).not.toMatch(ETIKET);
  for (const a of ASAMALAR) for (const c of a.cikislar) expect(`${c.kosul} ${c.sonuc}. ${c.sonra ?? ''}`, `Aşama ${a.no}`).not.toMatch(ETIKET);
});

/**
 * Genel yazım politikası (Claude ve Codex ortak kural seti, 10 Kasım 2026): talimatta en çok 10, açıklamada en çok 15
 * kelime. Sayım boşluk temellidir: kesme işareti ve sayı içindeki nokta kelimeyi bölmez, ayrı yazılan birim (€) sayılır.
 * Adımlar ve kayıt kartı talimattır. Kurallar, aşama cümleleri ve hazır e-postalar açıklamadır.
 */
const kelimeSay = (cumle: string) =>
  cumle
    .split(/\s+/)
    .map((k) => k.replace(/^[“”"'‘’()[\]:,.!?…]+|[“”"'‘’()[\]:,.!?…]+$/gu, ''))
    .filter((k) => /[\p{L}\p{N}\p{Sc}]/u.test(k)).length;
const cumleler = (metin: string) =>
  metin
    .replace(/(\d)\.(\d)/g, '$1§$2')
    .replace(/(\d+)\.(\s+)(?=[a-zçğıöşü“"])/gu, '$1§$2')
    .split(/(?<=[.!?…]["”’']?)\s+(?=["“'‘(]?[\p{Lu}\d"“[])/u)
    .map((c) => c.replace(/§/g, '.').trim())
    .filter((c) => /\p{L}/u.test(c));

test('dil: talimat cümlesi en çok 10, açıklama cümlesi en çok 15 kelime', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'veri testi tarayıcıdan bağımsızdır, yalnız Chromium’da çalışır');
  const asan: string[] = [];
  const denetle = (metin: string, sinir: number, yer: string) => {
    for (const c of cumleler(metin)) if (kelimeSay(c) > sinir) asan.push(`${yer} (${kelimeSay(c)} > ${sinir}): ${c}`);
  };
  for (const d of TUM) {
    for (const a of d.adimlar) denetle(typeof a === 'string' ? a : a.metin, 10, `${d.id} adım`);
    denetle(d.kart, 10, `${d.id} kart`);
  }
  for (const k of HER_DURUMDA) denetle(k, 10, 'kural');
  denetle(BEKLEME_NOTU, 15, 'bekleme notu');
  for (const a of ASAMALAR) {
    denetle(`${a.baslar} başlar.`, 15, `Aşama ${a.no} başlar`);
    for (const c of a.cikislar) denetle(`${c.kosul} ${c.sonuc}. ${c.sonra ?? ''}`, 15, `Aşama ${a.no} çıkış`);
  }
  for (const s of Object.values(METINLER)) for (const satir of s.metin.split('\n')) denetle(satir.replace(/^- /, ''), 15, `${s.id} e-posta`);
  expect(asan, asan.join('\n')).toEqual([]);
});

/**
 * Kullanıcı kararı 2026-11-10: fiyat, fiyat tablosundaki fiyattır (`paketler(params)`). Pazarlıkla değişmez, indirim
 * verilmez. Fiyat sorusu “söz vermeyin” ya da “İsmail Karaca’ya sorun” diye ertelenmez. Fiyatı CRM sorumlusu tablodan söyler.
 */
test('fiyat: tablodaki fiyat söylenir, pazarlık ve indirim yok, fiyat sorusu kimseye yönlendirilmez', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'veri testi tarayıcıdan bağımsızdır, yalnız Chromium’da çalışır');
  const metniOf = (id: string) => {
    const d = TUM.find((x) => x.id === id)!;
    return kucuk([d.ad, d.kart, ...d.adimlar.map((a) => (typeof a === 'string' ? a : a.metin))].join(' '));
  };
  const FIYAT = /fiyat|ücret|indirim|pahal|pazarl/;
  for (const d of TUM) {
    const metin = metniOf(d.id);
    if (!FIYAT.test(metin)) continue;
    expect(metin, `${d.id}: fiyat konusu kimseye yönlendirilmez`).not.toMatch(/ismail karaca/);
    expect(metin, `${d.id}: fiyat sorusu ertelenmez`).not.toMatch(/söz vermeyin/);
  }
  const kurallar = kucuk(HER_DURUMDA.join(' '));
  expect(kurallar).toMatch(/fiyat tablosundaki fiyattır/);
  expect(kurallar).toMatch(/indirim yoktur/);
  expect(kurallar).toMatch(/pazarlık yapılmaz/);
  expect(kurallar).toMatch(/ücretsiz ay, ek süre, özel fiyat/);
  expect(kurallar).not.toMatch(/indirim sözü/);
  for (const k of HER_DURUMDA.filter((x) => x.includes('İsmail Karaca'))) expect(k, 'İsmail Karaca kuralı fiyatı kapsamaz').toMatch(/^Fiyat dışında/);

  // Fiyat ve indirim akışları tablodaki her fiyatı aylık ve yıllık peşin olarak söyler.
  const tablo = paketler(DEFAULT_PARAMS).filter((p) => p.aylikEur !== null);
  for (const id of ['fiyat', 'indirim']) {
    const metin = metniOf(id);
    for (const p of tablo) {
      expect(metin, `${id}: ${p.ad} aylık`).toContain(eur(p.aylikEur!));
      expect(metin, `${id}: ${p.ad} yıllık peşin`).toContain(eur(p.yillikEur!));
    }
  }
  expect(metniOf('indirim')).toMatch(/pazarlıkla değişmez/);
  expect(metniOf('indirim')).toMatch(/indirim yapmıyoruz/);
  // Ücret soran satıcı fiyat akışına gider.
  expect(TUM.find((d) => d.id === 'liste-gonderdi')!.adimlar.some((a) => typeof a !== 'string' && a.git === 'fiyat')).toBe(true);
});

/**
 * Kullanıcı kararı 2026-11-10: “indirim söz konusu değil”. Benzer fiyat durumlarının her biri kendi akışıyla karşılanır
 * ve hiçbir metin fiyatı değiştiren bir şey önermez. Bu test yeni eklenen her metni de kapsar.
 */
test('fiyat: benzer fiyat durumları akışla karşılanır, hiçbir metin indirim, ücretsiz süre ya da tablo dışı fiyat önermez', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'veri testi tarayıcıdan bağımsızdır, yalnız Chromium’da çalışır');
  const metniOf = (id: string) => {
    const d = TUM.find((x) => x.id === id);
    expect(d, `${id} akışı var`).toBeTruthy();
    return kucuk([d!.ad, d!.kart, ...d!.adimlar.map((a) => (typeof a === 'string' ? a : a.metin))].join(' '));
  };
  const tablo = paketler(DEFAULT_PARAMS).filter((p) => p.aylikEur !== null);

  // Benzer fiyat durumları: her biri var, aşamaya bağlı değildir ve tablodaki fiyatı ya da ödeme seçeneklerini söyler.
  for (const id of ['ucretsiz-sure', 'soz-verilmis']) {
    expect(TUM.find((d) => d.id === id)?.yer, id).toBe('her-an');
    for (const p of tablo) expect(metniOf(id), `${id}: ${p.ad} aylık`).toContain(eur(p.aylikEur!));
  }
  expect(metniOf('ucretsiz-sure')).toMatch(/ücretsiz ay ya da ek süre vermiyoruz/);
  expect(metniOf('soz-verilmis')).toMatch(/indirim yapmıyoruz/);
  expect(metniOf('rakip-ucuz')).toMatch(/herkes için aynıdır/);
  expect(metniOf('odeme-kosulu')).toMatch(/aylık ödeme ya da yıllık peşin ödeme/);
  for (const id of ['hayir', 'hatirlatma']) expect(metniOf(id), `${id}: geri kazanmak için fiyat değişmez`).toMatch(/indirim[^.]*önermeyin/);

  // Tüm metin: fiyatı değiştiren bir kavram geçen her cümle ya onu reddeder ya da satıcının isteğini anlatır.
  // Karşılaştırma Türkçe küçük harfle yapılır. Böylece “İndirim” ile başlayan cümle de denetlenir.
  const DEGISIKLIK = /indirim|özel fiyat|pazarlık|ücretsiz|bedava|kampanya|kupon|taksit|vade|ek süre|fiyatı düşür/;
  const RET_YA_DA_ISTEK = /yok|yapmıyoruz|vermiyoruz|değişmez|verilmez|yapılmaz|önermeyin|iletmeyin|istedi|isterse|istediğini|verilmişti/;
  const parcalar = [
    ...HER_DURUMDA,
    ...TUM.flatMap((d) => [d.ad, d.kart, ...d.adimlar.map((a) => (typeof a === 'string' ? a : `${a.metin} ${TUM.find((x) => x.id === a.git)!.ad}`))]),
    ...ASAMALAR.flatMap((a) => [a.baslar, a.kartDurumu, ...a.cikislar.flatMap((c) => [`${c.kosul} ${c.sonuc}.`, c.kart, c.sonra ?? ''])]),
  ];
  const cumleler = parcalar.flatMap((m) => kucuk(m).split(/(?<=[.!?”])\s+/));
  let denetlenen = 0;
  for (const c of cumleler) {
    if (!DEGISIKLIK.test(c)) continue;
    denetlenen++;
    expect(c, 'fiyatı değiştiren öneri').toMatch(RET_YA_DA_ISTEK);
  }
  expect(denetlenen, 'büyük harfle başlayan cümleler de denetlenir').toBeGreaterThan(5);

  // Satıcıya giden hazır metinlerde bu kavramlar hiç geçmez.
  for (const s of Object.values(METINLER)) expect(kucuk(`${s.konu ?? ''} ${s.metin}`), s.id).not.toMatch(DEGISIKLIK);

  // Metinde geçen her euro tutarı fiyat tablosundadır.
  const izinli = new Set(tablo.flatMap((p) => [eur(p.aylikEur!), eur(p.yillikEur!)]));
  const tum = [...parcalar, ...Object.values(METINLER).map((s) => s.metin)].join(' ');
  const tutarlar = tum.match(/\d{1,3}(?:\.\d{3})* €/g) ?? [];
  expect(tutarlar.length).toBeGreaterThan(0);
  for (const t of tutarlar) expect(izinli.has(t), `${t} fiyat tablosunda yok`).toBe(true);
});

test('Pazarlama menüsünde Oyunlaştırma’dan sonra “Onboarding” var ve etkin', async ({ page }) => {
  await ac(page, 1280);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Yeni kayıt gelince ne yapılır?');
  await expect(page).toHaveTitle(/^Yeni kayıt gelince ne yapılır\?/);
  await page.getByRole('button', { name: 'Pazarlama' }).click();
  const menu = page.getByRole('menu', { name: 'Pazarlama' });
  await expect(menu.getByRole('menuitem')).toHaveText(['Temsilci ağı', 'Satış ortaklığı', 'Değer önerisi', 'Gelir modelleri', 'Oyunlaştırma', 'Yeni kayıtlar', 'Öncü satış ortağı rehberi', 'Kadrolu satış uzmanı rehberi', 'Danışman ve hizmet firması rehberi', 'Mevcut müşteri rehberi', 'Marka elçisi rehberi']);
  await expect(menu.getByRole('menuitem', { name: 'Yeni kayıtlar' })).toHaveAttribute('aria-current', 'page');
});

for (const [genislik, yukseklik] of [
  [320, 900],
  [360, 900],
  [375, 900],
  [390, 900],
  [844, 390],
  [768, 900],
  [1280, 900],
]) {
  test(`${genislik} × ${yukseklik}: aşamalar Başlar ile açılıp Biter ile kapanır, çizgi aşamanın sonuna iner, taşma yok, metin ≥ 14 px`, async ({ page }) => {
    await ac(page, genislik, yukseklik);

    // Harita: dört aşama ve sürecin sonu, sırayla.
    const harita = page.locator('.ob-harita-oge');
    await expect(harita).toHaveCount(ASAMALAR.length + 1);
    for (const [i, a] of ASAMALAR.entries()) {
      const oge = harita.nth(i);
      await expect(oge.locator('.ob-harita-ad')).toHaveText(`Aşama ${a.no}: ${a.ad}`);
      // Harita kartı tam cümlelerle konuşur: ne zaman biter ve başka hangi sonuç olabilir.
      for (const c of a.cikislar) await expect(oge).toContainText(`${c.kosul} ${c.sonuc}.`);
      await expect(oge).not.toContainText(/Kayıt kartı:|Biter:|Başka sonuç:/);
    }
    await expect(harita.last().locator('.ob-harita-ad')).toHaveText('Süreç biter');

    // Her aşama: başlık “Aşama n: ad”, gövdenin ilk çocuğu Başlar, son çocuğu Biter, durum numaraları aşama numarasıyla başlar.
    await expect(page.locator('.ob-asama')).toHaveCount(ASAMALAR.length);
    for (const a of ASAMALAR) {
      const bolum = page.locator(`#asama-${a.no}`);
      await expect(bolum.getByRole('heading', { level: 2 })).toHaveText(`Aşama ${a.no}: ${a.ad}`);
      const sira = await bolum.locator('.ob-asama-govde').evaluate((g) => [...g.children].map((c) => (c as HTMLElement).dataset.tur ?? c.className));
      expect(sira[0], `Aşama ${a.no} Başlar ile açılır`).toBe('baslar');
      expect(sira.at(-1), `Aşama ${a.no} Biter ile kapanır`).toBe('biter');
      const say = TUM.filter((d) => d.yer === a.no).length;
      await expect(bolum.locator('.ob-durum-no')).toHaveText(Array.from({ length: say }, (_, i) => `${a.no}.${i + 1}`));
      await expect(bolum.locator('.ob-cikis')).toHaveCount(a.cikislar.length);
    }

    // Her an olabilecek durumlar numarasız ve aşamaların dışında. Numarasız başlık sola boşluk bırakmaz.
    await expect(page.locator('#her-an .ob-durum')).toHaveCount(HER_AN.length);
    await expect(page.locator('#her-an .ob-durum-no')).toHaveCount(0);
    const kayma = await page.locator('#her-an .ob-durum-ozet').first().evaluate((s) => {
      const ad = s.querySelector('.ob-durum-ad')!.getBoundingClientRect().left;
      return ad - s.getBoundingClientRect().left - parseFloat(getComputedStyle(s).paddingLeft);
    });
    expect(Math.abs(kayma), 'numarasız başlıkta ad sola yaslı').toBeLessThanOrEqual(1);

    // Bütün durumlar açıkken ölç: çizgi gövde boyunca iner ve numaranın ortasına hizalıdır.
    await page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>('.ob-durum').forEach((d) => (d.open = true)));
    const olcum = await page.evaluate(() => ({
      tasma: document.documentElement.scrollWidth - innerWidth,
      cizgi: [...document.querySelectorAll<HTMLElement>('.ob-asama')].map((b) => {
        const govde = b.querySelector<HTMLElement>('.ob-asama-govde')!;
        const no = b.querySelector<HTMLElement>('.ob-asama-no')!.getBoundingClientRect();
        const once = getComputedStyle(govde, '::before');
        const g = govde.getBoundingClientRect();
        const x = g.left + parseFloat(once.left) + parseFloat(once.width) / 2;
        return { yukseklikFarki: Math.abs(parseFloat(once.height) - g.height), hiza: Math.abs(x - (no.left + no.width / 2)) };
      }),
      kucuk: [...document.querySelectorAll<HTMLElement>('.ob-sayfa *')]
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getClientRects().length)
        .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 14 || Number(getComputedStyle(e).fontWeight) < 300)
        .map((e) => e.className || e.tagName),
      metin: document.querySelector<HTMLElement>('.ob-sayfa')!.innerText,
    }));
    expect(olcum.tasma).toBeLessThanOrEqual(0);
    for (const c of olcum.cizgi) {
      expect(c.yukseklikFarki, 'çizgi aşamanın sonuna kadar iner').toBeLessThanOrEqual(1);
      expect(c.hiza, 'çizgi numaranın ortasına hizalı').toBeLessThanOrEqual(2);
    }
    expect(olcum.kucuk).toEqual([]);
    expect(olcum.metin).not.toMatch(YASAK);
  });
}

test('başlık sırası: her aşamada h2 aşama adı, ardından Başlar, durumlar ve Biter h3', async ({ page }) => {
  await ac(page, 390);
  for (const a of ASAMALAR) {
    const basliklar = await page.locator(`#asama-${a.no}`).locator('h2, h3').allInnerTexts();
    expect(basliklar).toEqual([`Aşama ${a.no}: ${a.ad}`, 'Başlar', 'Bu aşamada karşılaşacağınız durumlar', 'Biter']);
    // Başlar ve Biter kutuları tam cümledir.
    await expect(page.locator(`#asama-${a.no} [data-tur="baslar"]`)).toContainText(`${a.baslar} başlar.`);
    for (const c of a.cikislar) {
      await expect(page.locator(`#asama-${a.no} [data-tur="biter"]`)).toContainText(`${c.kosul} ${c.sonuc}.`);
      await expect(page.locator(`#asama-${a.no} [data-tur="biter"]`)).toContainText(`Kayıt kartında durumu “${c.kart}” yapın.`);
    }
  }
  // Açıp kapama işareti erişilebilir ada girmez.
  await expect(page.locator('#durum-yeni-kayit summary')).toHaveAccessibleName('1.1 Yeni kayıt geldi');
});

test('Biter bölümü sonraki aşamaya ve gereken akışa bağlanır, bağlantı o aşamaya götürür', async ({ page }) => {
  await ac(page, 390);
  for (const a of ASAMALAR) {
    for (const c of a.cikislar.filter((x) => x.git)) {
      const ad = ASAMALAR.find((x) => x.no === c.git)!.ad;
      const bag = page.locator(`#asama-${a.no} .ob-cikis`).getByRole('link', { name: `Aşama ${c.git}: ${ad}` });
      await expect(bag).toHaveAttribute('href', `#asama-${c.git}`);
    }
    for (const c of a.cikislar.filter((x) => x.durum)) {
      await expect(page.locator(`#asama-${a.no} .ob-cikis`).locator(`a[href="#durum-${c.durum}"]`)).toHaveCount(1);
    }
  }
  await page.locator('#asama-1 .ob-cikis').getByRole('link', { name: 'Aşama 2: Kurulum' }).click();
  await expect(page).toHaveURL(/#asama-2$/);
  await expect(page.locator('#asama-2-baslik')).toBeInViewport();
});

test('1280 px: sonraki aşamaya gidince başlık yapışık kırıntı satırının altında kalmaz', async ({ page }) => {
  await ac(page, 1280, 900);
  await page.locator('#asama-1 .ob-cikis').getByRole('link', { name: 'Aşama 2: Kurulum' }).click();
  await expect(page).toHaveURL(/#asama-2$/);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const serit = document.querySelector('.crumbs-row')!.getBoundingClientRect().bottom;
        return document.querySelector('#asama-2-baslik')!.getBoundingClientRect().top - serit;
      }),
    )
    .toBeGreaterThanOrEqual(0);
});

test('durum açılınca adımlar ve kayıt kartı satırı görünür, geçiş bağlantısı hedef durumu açar ve odaklar', async ({ page }) => {
  await ac(page, 390);
  const ilkArama = page.locator('#durum-acti');
  await expect(ilkArama.locator('.ob-adimlar')).toBeHidden();
  await ilkArama.locator('summary').click();
  await expect(ilkArama.locator('.ob-adim').first()).toBeVisible();
  await expect(ilkArama.locator('.ob-kart')).toContainText('Kayıt kartında');
  await expect(ilkArama.locator('.ob-sablon')).toContainText('Bu durumda “Görüşme özeti” hazır metnini kullanın.');

  const hedef = page.locator('#durum-musait-degil');
  await expect(hedef).not.toHaveAttribute('open', '');
  await ilkArama.getByRole('link', { name: '“Şimdi müsait değilim” dedi' }).click();
  await expect(hedef).toHaveAttribute('open', '');
  await expect(hedef.locator('summary')).toBeFocused();
  await expect(hedef.locator('.ob-adim').first()).toBeInViewport();
});

test('klavye: geçiş bağlantısı Enter ile hedef durumu açar ve odağı başlığına taşır', async ({ page }) => {
  await ac(page, 390);
  const kaynak = page.locator('#durum-pahali');
  await kaynak.locator('summary').click();
  const bag = kaynak.getByRole('link', { name: 'İndirim ya da pazarlık istedi' });
  await bag.focus();
  await page.keyboard.press('Enter');
  const hedef = page.locator('#durum-indirim');
  await expect(hedef).toHaveAttribute('open', '');
  await expect(hedef.locator('summary')).toBeFocused();
});

test('doğrudan bağlantı ve adres değişimi durumu açar', async ({ page }) => {
  await ac(page, 390, 900, 'onboarding/#durum-pahali');
  await expect(page.locator('#durum-pahali')).toHaveAttribute('open', '');
  await expect(page.locator('#durum-pahali .ob-adim').first()).toBeInViewport();
  await page.evaluate(() => (location.hash = '#durum-siparis'));
  await expect(page.locator('#durum-siparis')).toHaveAttribute('open', '');
});

test('375 px: tutar ile para birimi ayrı satıra bölünmez', async ({ page }) => {
  await ac(page, 375);
  const metinler = await page.locator('.ob-adim, .ob-kart, .ob-sablon-metin, .ob-harita-satir, .ob-asama-gun, .ob-durum-ad').allTextContents();
  const tutarli = metinler.filter((m) => /\d\s[€₺]/.test(m));
  expect(tutarli.length, 'tutar içeren metin var').toBeGreaterThan(0);
  for (const m of tutarli) expect(m, m).not.toMatch(/\d [€₺]/);
  for (const m of metinler) expect(m, `gün sırası bölünmez: ${m}`).not.toMatch(/\d\. gün/);
});

test('karar görüşmesi paket ücretini Parametreler’den yazar', async ({ page }) => {
  await ac(page, 1280);
  const std = paketler(DEFAULT_PARAMS).find((p) => p.id === 'standart')!;
  const karar = page.locator('#durum-karar');
  await karar.locator('summary').click();
  await expect(karar).toContainText(`aylık ${eur(std.aylikEur!)}`);
  await expect(karar).toContainText(`Yıllık peşin seçeneğini söyleyin: ${eur(std.yillikEur!)}`);
});

test('klavye: Enter durumu açar, odakta çevre halkası yok, alt çizgi var', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not_run: Playwright WebKit Tab ile <summary> öğesine odaklanmıyor (Safari varsayılanı); gerçek Safari’de elle doğrulanmalı');
  await ac(page, 1280);
  const ozet = page.locator('#durum-yeni-kayit summary');
  await ozet.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(ozet).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#durum-yeni-kayit')).toHaveAttribute('open', '');
  const durum = await ozet.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { mod: document.documentElement.dataset.focusMode, halka: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, cizgi: cs.textDecorationLine };
  });
  expect(durum.mod).toBe('keyboard');
  expect(durum.halka).toBe(false);
  expect(durum.cizgi).toContain('underline');
});

test('hazır metin “Metni kopyala” ile konu satırıyla birlikte panoya yazılır', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'not_run: pano okuma izni yalnız Chromium’da verilebiliyor');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await ac(page, 1280);
  const yeni = page.locator('#durum-yeni-kayit');
  await yeni.locator('summary').click();
  await yeni.getByRole('button', { name: 'Metni kopyala' }).click();
  await expect(yeni.locator('.ob-kopya-durum')).toHaveText('Metin panoya kopyalandı.');
  const pano = await page.evaluate(() => navigator.clipboard.readText());
  expect(pano.startsWith(`Konu: ${METINLER.hosgeldin.konu}`)).toBe(true);
  expect(pano).toContain('[Ad Soyad]');
});

test('pano yazılamazsa elle kopyalama yolu söylenir', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('izin yok')) } });
  });
  await ac(page, 390);
  const yeni = page.locator('#durum-yeni-kayit');
  await yeni.locator('summary').click();
  await yeni.getByRole('button', { name: 'Metni kopyala' }).click();
  await expect(yeni.locator('.ob-kopya-durum')).toHaveText('Kopyalanamadı. Metni seçip elle kopyalayın.');
});
