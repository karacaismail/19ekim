import { expect, test, type Page, type PersonaTestServer, type Route } from './fixtures/persona';
import { alanlardanAyar } from '../src/data/personaFields';
import { SEVIYE_ADI, VARSAYILAN_AYAR, aylikFiyat, satisKazanci, yillikFiyat, type Ayar } from '../src/data/satisOrtakligi';
import type { Request as PersonaIstegi } from '../src/lib/personaSync';

/**
 * Ortak kayıt durumu (PersonaSyncStatus, personaStore, personaSync). Birinci sürümdeki hesap ve rehberler aynı ortak
 * kaydı okur. Testler gerçek tabloya gitmez: fixtures/persona.ts sunucuyu taklit eder. Gecikme, hata, çakışma ve
 * anahtar yanıtı için sayfa düzeyinde ek yönlendirme kurulur. Sayfa yönlendirmesi önce çalışır. `fallback` isteği
 * fixture sunucusuna bırakır.
 */

const ADRES = 'https://script.google.com/macros/s/**/exec*';
const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;
const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
const ayar = (p: Partial<Ayar> = {}): Ayar => ({ ...structuredClone(VARSAYILAN_AYAR), ...p });
const istek = (route: Route) => JSON.parse(route.request().postData() ?? '{}') as PersonaIstegi;
const kayit = (page: Page) => page.getByRole('region', { name: 'Ortak kayıt', exact: true });
const kurAlani = (page: Page) => page.getByRole('textbox', { name: '1 euro kaç ₺?', exact: true });
const yillikPaket = (page: Page) => page.locator('.so2-fiyat strong');

async function birinciSurum(page: Page) {
  await page.goto('satis-ortakligi/?surum=v1');
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
}

/**
 * Sayfadan çıkış uyarısı kurulmuş mu? BeforeUnloadEvent tarayıcıda elle kurulamaz. Bu yüzden aynı adlı, iptal
 * edilebilir bir olay gönderilir. Dinleyici preventDefault çağırırsa çıkış uyarısı açılır.
 */
const cikisEngelli = (page: Page) => page.evaluate(() => {
  const olay = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(olay);
  return olay.defaultPrevented;
});

test('birinci sürümde bir alan değişince ortak kayda tek yazı gider ve sayfa güncel görünür', async ({ page, personaServer }) => {
  await birinciSurum(page);
  await kurAlani(page).fill('60');
  await expect.poll(() => personaServer.writes.length).toBe(1);
  expect(personaServer.writes[0]).toMatchObject({ service: 'persona', action: 'patch', project: 'istoc', changes: [{ field: 'kur', before: 56, value: 60 }] });
  expect(personaServer.snapshot('istoc').fields.kur).toBe(60);
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  await expect(kayit(page).getByRole('status')).toHaveText('Ortak kayıt güncel.');
  await expect(yillikPaket(page)).toHaveText(tl(yillikFiyat(ayar({ kur: 60 }))));
  // Aynı kaydı açan başka sekme yeni değeri görür.
  const ikinci = await page.context().newPage();
  await birinciSurum(ikinci);
  await expect(kurAlani(ikinci)).toHaveValue('60');
  expect(personaServer.writes).toHaveLength(1);
});

test('kayıt onayı gecikince bekleyen alan sayısı görünür ve sayfadan çıkış uyarısı kurulur', async ({ page, personaServer }) => {
  let birak!: () => void;
  const kapi = new Promise<void>((r) => { birak = r; });
  let yazi = 0;
  await page.route(ADRES, async (route) => {
    // Yalnız ilk yazının yanıtı bekletilir.
    if (istek(route).action === 'patch' && ++yazi === 1) await kapi;
    await route.fallback();
  });
  await birinciSurum(page);
  expect(await cikisEngelli(page)).toBe(false);
  await kurAlani(page).fill('60');
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'pending');
  await expect(kayit(page).getByText(/^1 alan/)).toBeVisible();
  // İlk yazı beklerken değişen ikinci alan kaybolmaz ve sıraya girer.
  await page.getByRole('textbox', { name: /^Aylık fiyat/ }).fill('400');
  await expect(kayit(page).getByText(/^2 alan/)).toBeVisible();
  expect(await cikisEngelli(page)).toBe(true);
  expect(personaServer.writes).toHaveLength(0);
  birak();
  await expect.poll(() => personaServer.writes.length).toBe(2);
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  expect(personaServer.writes.map((w) => w.changes)).toEqual([[{ field: 'kur', before: 56, value: 60 }], [{ field: 'istocAyEur', before: 399, value: 400 }]]);
  await expect(kayit(page).getByText(/^\d+ alan/)).toHaveCount(0);
  await expect(yillikPaket(page)).toHaveText(tl(yillikFiyat(ayar({ kur: 60, istocAyEur: 400 }))));
  // Bütün yazılar onaylanınca çıkış uyarısı kalkar.
  expect(await cikisEngelli(page)).toBe(false);
});

test('yazı başarısız olunca “Yeniden dene” aynı yazıyı gönderir ve kayıt tamamlanır', async ({ page, personaServer }) => {
  let bozuk = true;
  const kimlikler: string[] = [];
  await page.route(ADRES, async (route) => {
    const r = istek(route);
    if (r.action === 'patch') {
      kimlikler.push(r.operationId ?? '');
      if (bozuk) { await route.abort(); return; }
    }
    await route.fallback();
  });
  await birinciSurum(page);
  await kurAlani(page).fill('60');
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'error');
  const dugme = kayit(page).getByRole('button', { name: 'Yeniden dene', exact: true });
  await expect(dugme).toBeVisible();
  // Yazılan değer sayfada korunur. Ortak kayıt değişmez.
  await expect(kurAlani(page)).toHaveValue('60');
  await expect(kayit(page).getByText(/^1 alan/)).toBeVisible();
  expect(personaServer.writes).toHaveLength(0);
  expect(await cikisEngelli(page)).toBe(true);
  bozuk = false;
  await dugme.click();
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  await expect(dugme).toHaveCount(0);
  expect(personaServer.writes.map((w) => w.changes)).toEqual([[{ field: 'kur', before: 56, value: 60 }]]);
  // Yeniden deneme aynı işlem kimliğini kullanır. Böylece sunucu aynı yazıyı iki kez uygulamaz.
  expect(kimlikler).toHaveLength(2);
  expect(kimlikler[1]).toBe(kimlikler[0]);
});

test('bağlantı geri gelince (online olayı) bekleyen yazı kendiliğinden yeniden gönderilir', async ({ page, personaServer }) => {
  let bozuk = true;
  let deneme = 0;
  await page.route(ADRES, async (route) => {
    if (istek(route).action === 'patch') {
      deneme++;
      if (bozuk) { await route.abort(); return; }
    }
    await route.fallback();
  });
  await birinciSurum(page);
  await kurAlani(page).fill('60');
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'error');
  await page.waitForTimeout(300);
  // Hata durumunda yazı kendiliğinden tekrarlanmaz.
  expect(deneme).toBe(1);
  bozuk = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  expect(deneme).toBe(2);
  expect(personaServer.writes.map((w) => w.changes)).toEqual([[{ field: 'kur', before: 56, value: 60 }]]);
});

/** Kullanıcı kaydederken başka biri aynı alanı 75 yapar. Sunucu çakışma yanıtı verir. */
async function cakismaKur(page: Page, personaServer: PersonaTestServer) {
  await page.route(ADRES, async (route) => {
    if (istek(route).action === 'patch' && personaServer.snapshot('istoc').fields.kur === 56) personaServer.seed('istoc', { kur: 75 });
    await route.fallback();
  });
  await birinciSurum(page);
  await kurAlani(page).fill('60');
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'conflict');
  const cakisma = kayit(page).locator('.persona-cakisma');
  await expect(cakisma).toHaveCount(1);
  await expect(cakisma.getByRole('heading', { name: 'Avronun ₺ karşılığı', exact: true })).toBeVisible();
  await expect(cakisma.getByText('Sizdeki değer: 60', { exact: true })).toBeVisible();
  await expect(cakisma.getByText('Ortak kayıttaki değer: 75', { exact: true })).toBeVisible();
  // Çakışma çözülene kadar kullanıcının değeri silinmez.
  await expect(kurAlani(page)).toHaveValue('60');
  return cakisma;
}

test('çakışmada “Ortak değeri kullan” ortak değeri alana getirir ve yazı göndermez', async ({ page, personaServer }) => {
  const cakisma = await cakismaKur(page, personaServer);
  await cakisma.getByRole('button', { name: 'Ortak değeri kullan', exact: true }).click();
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  await expect(kurAlani(page)).toHaveValue('75');
  await expect(yillikPaket(page)).toHaveText(tl(yillikFiyat(ayar({ kur: 75 }))));
  await expect(kayit(page).locator('.persona-cakisma')).toHaveCount(0);
  expect(personaServer.writes).toHaveLength(0);
  expect(personaServer.snapshot('istoc').fields.kur).toBe(75);
});

test('çakışmada “Benim değerimi gönder” kullanıcının değerini yeni tabana göre yazar', async ({ page, personaServer }) => {
  const cakisma = await cakismaKur(page, personaServer);
  await cakisma.getByRole('button', { name: 'Benim değerimi gönder', exact: true }).click();
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  await expect(kurAlani(page)).toHaveValue('60');
  await expect(yillikPaket(page)).toHaveText(tl(yillikFiyat(ayar({ kur: 60 }))));
  await expect(kayit(page).locator('.persona-cakisma')).toHaveCount(0);
  expect(personaServer.writes.map((w) => w.changes)).toEqual([[{ field: 'kur', before: 75, value: 60 }]]);
  expect(personaServer.snapshot('istoc').fields.kur).toBe(60);
});

test('ortak kayıt anahtar isterse erişim formu açılır ve anahtarla bağlanılır', async ({ page, personaServer }) => {
  const ANAHTAR = 'deneme-anahtari';
  const anahtarlar: string[] = [];
  await page.route(ADRES, async (route) => {
    const r = istek(route);
    anahtarlar.push(r.key);
    if (r.key !== ANAHTAR) { await route.fulfill({ json: { ok: false, code: 'auth', message: 'Anahtar gerekli.' } }); return; }
    await route.fallback();
  });
  await page.goto('satis-ortakligi/?surum=v1');
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'error');
  const ac = kayit(page).getByRole('button', { name: 'Ortak kayda bağlan', exact: true });
  await expect(ac).toHaveAttribute('aria-expanded', 'false');
  await ac.click();
  await expect(ac).toHaveAttribute('aria-expanded', 'true');
  const alan = kayit(page).getByLabel('Ortak kayıt erişim anahtarı', { exact: true });
  const baglan = kayit(page).getByRole('button', { name: 'Bağlan', exact: true });
  await expect(alan).toBeVisible();
  await expect(alan).toHaveAttribute('type', 'password');
  await expect(baglan).toBeDisabled();
  await alan.fill('   ');
  await expect(baglan).toBeDisabled();
  await alan.fill(ANAHTAR);
  await expect(baglan).toBeEnabled();
  await baglan.click();
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  await expect(ac).toHaveCount(0);
  // Anahtar yanıtından sonra anahtarsız yeniden istek gönderilmez. Bağlanınca istekler anahtarı taşır.
  expect(anahtarlar[0]).toBe('');
  expect(anahtarlar.filter((k) => k === '')).toHaveLength(1);
  expect(anahtarlar.at(-1)).toBe(ANAHTAR);
  expect(await page.evaluate(() => sessionStorage.getItem('turksab-persona-erisim-v1'))).toBe(ANAHTAR);
  expect(await page.evaluate(() => localStorage.getItem('turksab-persona-erisim-v1'))).toBeNull();
  expect(personaServer.writes).toHaveLength(0);
});

test('bu cihazdaki bozuk kayıt ortak kaydı değiştirmez', async ({ page, personaServer }) => {
  personaServer.seed('istoc', { kur: 60 });
  await page.addInitScript(() => {
    // JSON geçerli ama alan değeri geçersiz: %500 oran olamaz. Aynı kayıttaki geçerli kur değeri de kullanılmamalı.
    sessionStorage.setItem('turksab-persona-bekleyen-v1-istoc', JSON.stringify({ snapshot: null, draft: { kur: 70, 'oran.B': 5 }, before: {}, flight: null }));
    // Segika için ortak önbellek hiç okunamıyor.
    localStorage.setItem('turksab-persona-ortak-v1-segika', '{bozuk');
  });
  await birinciSurum(page);
  await expect(kurAlani(page)).toHaveValue('60');
  await expect(yillikPaket(page)).toHaveText(tl(yillikFiyat(ayar({ kur: 60 }))));
  await page.waitForTimeout(300);
  expect(personaServer.writes).toHaveLength(0);
  expect(personaServer.snapshot('istoc').fields.kur).toBe(60);
  // Sayfa bozuk yerel kaydın yerine ortak kayıttan gelen geçerli kopyayı yazar.
  const yerel = await page.evaluate(() => JSON.parse(sessionStorage.getItem('turksab-persona-bekleyen-v1-istoc') ?? 'null'));
  expect(yerel.draft).toEqual({});
  expect(yerel.snapshot.fields.kur).toBe(60);

  await page.getByRole('group', { name: 'Ürün', exact: true }).getByRole('button', { name: 'Segika', exact: true }).click();
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  await expect(yillikPaket(page)).toHaveText(tl(yillikFiyat(ayar({ marka: 'segika' }))));
  expect(personaServer.writes).toHaveLength(0);
});

test('bu cihazdaki geçerli bekleyen yazı sayfa yeniden açılınca ortak kayda gönderilir', async ({ page, personaServer }) => {
  // Karşılaştırma testi: önbellek okunur. Bozuk değilse bekleyen yazı kaybolmaz.
  await page.addInitScript(() => {
    if (sessionStorage.getItem('test-hazir')) return;
    sessionStorage.setItem('test-hazir', '1');
    sessionStorage.setItem('turksab-persona-bekleyen-v1-istoc', JSON.stringify({ snapshot: null, draft: { kur: 70 }, before: { kur: 56 }, flight: null }));
  });
  await page.goto('satis-ortakligi/?surum=v1');
  await expect.poll(() => personaServer.writes.length).toBe(1);
  expect(personaServer.writes[0].changes).toEqual([{ field: 'kur', before: 56, value: 70 }]);
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  await expect(kurAlani(page)).toHaveValue('70');
});

test('rehberin “Kazanç” bölümü ortak kayıttaki değerlerle hesaplanır', async ({ page, personaServer }) => {
  personaServer.seed('istoc', { kur: 60, oncuSeviye: 'C', 'oran.C': 0.2 });
  const a = alanlardanAyar('istoc', personaServer.snapshot('istoc').fields);
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  await page.getByRole('button', { name: 'Bütün çalışma koşullarını açın', exact: true }).click();
  const kazanc = page.locator('#kazanc');
  await expect(kazanc).toBeVisible();
  const deger = (ad: string) => kazanc.locator('dl > div').filter({ has: page.locator('dt').getByText(ad, { exact: true }) }).locator('dd');
  const ornek = (x: Ayar) => {
    const yillik = yillikFiyat(x);
    return {
      aylik: `${sayi(aylikFiyat(x))} ₺ (KDV hariç)`,
      yillik: `${sayi(yillik)} ₺ (KDV hariç)`,
      komisyon: `${sayi(yillik)} ₺ × %${sayi(x.oran[x.oncuSeviye] * 100)} = ${sayi(satisKazanci(x, x.oncuSeviye))} ₺`,
    };
  };
  let beklenen = ornek(a);
  // 399 € × 60 ₺ = 23.940 ₺. 10 ay = 239.400 ₺. Satışı kapatan %20 alır: 47.880 ₺.
  expect(beklenen.komisyon).toBe('239.400 ₺ × %20 = 47.880 ₺');
  await expect(deger('Aylık liste fiyatı')).toHaveText(beklenen.aylik);
  await expect(deger('Yıllık paket bedeli')).toHaveText(beklenen.yillik);
  await expect(deger('Satıştaki katkınız')).toHaveText(SEVIYE_ADI.C);
  await expect(deger('Bir yıllık paket için komisyon')).toHaveText(beklenen.komisyon);
  await expect(kazanc).not.toContainText('223.440');

  // Rehber açıkken ortak değer değişirse tutarlar da değişir.
  personaServer.seed('istoc', { kur: 61 });
  beklenen = ornek(alanlardanAyar('istoc', personaServer.snapshot('istoc').fields));
  await expect(deger('Bir yıllık paket için komisyon')).toHaveText(beklenen.komisyon, { timeout: 10_000 });
  await expect(deger('Aylık liste fiyatı')).toHaveText(beklenen.aylik);
  expect(personaServer.writes).toHaveLength(0);
});
