import { expect, test, type Page } from './fixtures/persona';
import { alanGecerli, alanTanimlari } from '../src/data/personaFields';
import { VARSAYILAN_AYAR, aylikFiyat, cozumKazanci, kadrolu, satisKazanci, segikaAylik, yillikFiyat, type Ayar } from '../src/data/satisOrtakligi';
import * as v2 from '../src/data/satisOrtakligiV2';
import { affilateHesabi, affilateYillari, kosulSonucu } from '../src/data/kosullarV2';
import { personaOzeti } from '../src/data/ozetV2';

/**
 * Satış ortaklığı hesabının eksik kalan davranışları: “Başa dön”, girdi denetimi, Segika fiyatı, sonuç panelleri,
 * ikinci sürümün yerel kaydı ve özeti, özel programlar, sekme klavyesi, − ve + düğmeleri. Beklenen değerler sayfanın
 * kullandığı model işlevlerinden hesaplanır (src/data/satisOrtakligi.ts, satisOrtakligiV2.ts, kosullarV2.ts, ozetV2.ts).
 */

const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;
const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
const binlik = (n: number) => new Intl.NumberFormat('tr-TR').format(n);
const ayar = (p: Partial<Ayar> = {}): Ayar => ({ ...structuredClone(VARSAYILAN_AYAR), ...p });
const ayar2 = (p: Partial<v2.Ayar> = {}): v2.Ayar => ({ ...structuredClone(v2.VARSAYILAN_AYAR), ...p });

/* ---------- Birinci sürüm yardımcıları ---------- */

const kayit = (page: Page) => page.getByRole('region', { name: 'Ortak kayıt', exact: true });
const panel = (page: Page) => page.locator('#so2-panel');
const sonuc = (page: Page) => panel(page).locator('.so2-sonuc-deger');
const bize = (page: Page) => panel(page).locator('.so2-bize');
const sekme = (page: Page, id: string) => page.locator(`#so2-sekme-${id}`);
const kutu = (page: Page, ad: string | RegExp) => page.getByRole('textbox', { name: ad, exact: typeof ad === 'string' });
const yillikPaket = (page: Page) => page.locator('.so2-fiyat strong');
const hesapSatiri = (page: Page, ad: string) => panel(page).locator('.so2-hesap-satir').filter({ has: page.locator('dt').getByText(ad, { exact: true }) });
const hesap = (page: Page, ad: string) => hesapSatiri(page, ad).locator('.so2-hesap-sonuc');
const odemeSatirlari = (page: Page) => panel(page).locator('.so2-hesap-satir dt').filter({ hasText: /\. gün ödenir$/ });

async function birinciSurum(page: Page) {
  await page.goto('satis-ortakligi/?surum=v1');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
}

/* ---------- İkinci sürüm yardımcıları ---------- */

const panel2 = (page: Page) => page.locator('#v2-so2-panel');
const sonuc2 = (page: Page) => panel2(page).locator('.v2-so2-sonuc-deger');
const sekme2 = (page: Page, id: string) => page.locator(`#v2-so2-sekme-${id}`);
const fiyat2 = (page: Page) => page.locator('.v2-so2-fiyat strong');
const robot = (page: Page) => page.getByRole('group', { name: 'Satış: ayda kaç yeni müşteri?', exact: true });
const hesap2 = (page: Page, ad: string) => panel2(page).locator('.v2-so2-hesap-satir').filter({ has: page.locator('dt').getByText(ad, { exact: true }) }).locator('.v2-so2-hesap-sonuc');
const urun = (page: Page, ad: 'iStoc' | 'Segika') => page.getByRole('group', { name: 'Ürün', exact: true }).getByRole('button', { name: ad, exact: true });

async function ikinciSurum(page: Page) {
  await page.goto('satis-ortakligi/?surum=v2');
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
  await expect(sekme2(page, 'oncu')).toBeVisible();
}

/* ---------- Birinci sürüm: Başa dön ---------- */

test('birinci sürüm “Başa dön”: vazgeçince hiçbir şey değişmez, onaylayınca varsayılanlar ortak kayda yazılır', async ({ page, personaServer }) => {
  await birinciSurum(page);
  await kutu(page, '1 euro kaç ₺?').fill('60');
  await kutu(page, '90. günden sonra: ayda kaç satış?').fill('6');
  await expect.poll(() => personaServer.snapshot('istoc').fields['oncuAsama.3']).toBe(6);
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  expect(personaServer.snapshot('istoc').fields.kur).toBe(60);
  const degismis = ayar({ kur: 60, oncuAsama: [0, 1, 2, 6] });
  await expect(sonuc(page)).toHaveText(tl(6 * satisKazanci(degismis, 'B')));
  const yaziSayisi = personaServer.writes.length;

  // Vazgeç: alanlar ve ortak kayıt aynı kalır.
  let tur = '';
  page.once('dialog', (d) => { tur = d.type(); void d.dismiss(); });
  await page.getByRole('button', { name: 'Başa dön', exact: true }).click();
  await expect.poll(() => tur).toBe('confirm');
  await page.waitForTimeout(300);
  await expect(kutu(page, '1 euro kaç ₺?')).toHaveValue('60');
  await expect(kutu(page, '90. günden sonra: ayda kaç satış?')).toHaveValue('6');
  await expect(sonuc(page)).toHaveText(tl(6 * satisKazanci(degismis, 'B')));
  expect(personaServer.writes).toHaveLength(yaziSayisi);

  // Onayla: alanlar varsayılana döner. Bu projenin ortak kaydına tek yazı gider.
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Başa dön', exact: true }).click();
  await expect(kutu(page, '1 euro kaç ₺?')).toHaveValue('56');
  await expect(kutu(page, '90. günden sonra: ayda kaç satış?')).toHaveValue('4');
  await expect(yillikPaket(page)).toHaveText(tl(yillikFiyat(ayar())));
  await expect(sonuc(page)).toHaveText(tl(4 * satisKazanci(ayar(), 'B')));
  await expect.poll(() => personaServer.writes.length).toBe(yaziSayisi + 1);
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  const son = personaServer.writes.at(-1)!;
  expect(son.project).toBe('istoc');
  expect(son.changes).toHaveLength(2);
  expect(son.changes).toEqual(expect.arrayContaining([{ field: 'kur', before: 60, value: 56 }, { field: 'oncuAsama.3', before: 6, value: 4 }]));
  const varsayilan = Object.fromEntries(alanTanimlari('istoc').map((d) => [d.field, d.value]));
  expect(personaServer.snapshot('istoc').fields).toEqual(varsayilan);
  expect(personaServer.writes.every((w) => w.project === 'istoc')).toBe(true);
});

/* ---------- Birinci sürüm: girdi denetimi ---------- */

test('birinci sürüm %100 üstü oranı ve sıfır ayı kabul etmez, hesap son geçerli değerde kalır', async ({ page, personaServer }) => {
  await birinciSurum(page);
  const uyari = kayit(page).getByRole('alert');
  await sekme(page, 'kadrolu').click();
  const prim = kutu(page, 'Kota üstü prim');
  await prim.fill('10');
  const gecerli = ayar({ kadroluPrim: { istoc: 0.1, segika: VARSAYILAN_AYAR.kadroluPrim.segika } });
  await expect(sonuc(page)).toHaveText(tl(kadrolu(gecerli).toplam));
  await expect.poll(() => personaServer.snapshot('istoc').fields['kadroluPrim.istoc']).toBe(0.1);
  await expect(uyari).toHaveCount(0);

  // %150 prim olamaz: uyarı çıkar, sonuç %10 ile kalır.
  await prim.fill('150');
  await expect(uyari).toContainText('Geçerli bir değer girin.');
  await expect(sonuc(page)).toHaveText(tl(kadrolu(gecerli).toplam));
  await expect(sekme(page, 'kadrolu')).toContainText(tl(kadrolu(gecerli).toplam));

  // Yıllık pakette en az 1 ayın ücreti ödenir. 0 yazılırsa fiyat değişmez.
  const ay = kutu(page, 'Yıllık pakette kaç ayın ücreti ödenir?');
  await ay.fill('0');
  await expect(uyari).toContainText('Geçerli bir değer girin.');
  await expect(yillikPaket(page)).toHaveText(tl(yillikFiyat(gecerli)));
  await expect(sonuc(page)).toHaveText(tl(kadrolu(gecerli).toplam));

  // Geçerli değer yalnız kendi alanının uyarısını kaldırır ve hesaba girer. Prim kutusunda %150 durdukça onun uyarısı kalır.
  await ay.fill('12');
  await expect(uyari).not.toContainText('Yıllık paketin ücretli ay sayısı');
  await expect(uyari).toContainText('Kota üstü prim oranı');
  await prim.fill('10');
  await expect(uyari).toHaveCount(0);
  const yeni = { ...gecerli, istocYilAy: 12 };
  await expect(yillikPaket(page)).toHaveText(tl(yillikFiyat(yeni)));
  await expect(sonuc(page)).toHaveText(tl(kadrolu(yeni).toplam));
  await expect.poll(() => personaServer.snapshot('istoc').fields.istocYilAy).toBe(12);
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');

  // Ortak kayda hiçbir geçersiz değer gitmedi.
  const tanimlar = alanTanimlari('istoc');
  const degisiklikler = personaServer.writes.flatMap((w) => w.changes ?? []);
  expect(degisiklikler.length).toBeGreaterThan(0);
  for (const c of degisiklikler) expect(alanGecerli(tanimlar.find((d) => d.field === c.field)!, c.value), `${c.field} = ${c.value}`).toBe(true);
  expect(personaServer.snapshot('istoc').fields['kadroluPrim.istoc']).toBe(0.1);
});

// Sessiz düzeltme olmamalı (AGENTS.md GA-3 F13, docs/gorsel_algi.md V20): kutuda hesaba girmeyen bir değer
// duruyorsa uyarı da görünmelidir. Başka alandaki geçerli değişiklik bu uyarıyı silmemelidir.
test('birinci sürüm reddedilen oran kutuda kaldıkça uyarı da görünür kalır', async ({ page }) => {
  await birinciSurum(page);
  await sekme(page, 'kadrolu').click();
  const prim = kutu(page, 'Kota üstü prim');
  const uyari = kayit(page).getByRole('alert');
  await prim.fill('150');
  await expect(uyari).toBeVisible();
  // Aynı paneldeki başka bir alan geçerli bir değerle değişir.
  await kutu(page, 'Bu ay satılan paket').fill('3');
  await kutu(page, 'Bu ay satılan paket').blur();
  // Hesap %5 primi kullanır. %150 hiçbir yere geçmez.
  await expect(sonuc(page)).toHaveText(tl(kadrolu(ayar({ kadroluSatis: 3 })).toplam));
  const uygulanan = `%${sayi(VARSAYILAN_AYAR.kadroluPrim.istoc * 100)}`;
  // Kutu ya hesapta kullanılan %5’i gösterir ya da uyarı görünür kalır.
  const durum = async () => ({ kutu: await prim.inputValue(), uyari: await uyari.isVisible() });
  await expect.poll(async () => { const d = await durum(); return d.kutu === uygulanan || d.uyari ? 'tutarlı' : `kutu ${d.kutu}, uyarı yok`; }).toBe('tutarlı');
});

// Kardeş oran kutuları aynı nesneyi gönderir (`oran.A`, `oran.B`, `oran.C`). Uyarı yaprak alana bağlıdır:
// B kutusundaki geçerli değişiklik A kutusunun uyarısını silmez.
test('birinci sürüm kardeş oran kutusundaki geçerli değer reddedilen kutunun uyarısını silmez', async ({ page, personaServer }) => {
  await birinciSurum(page);
  const uyari = kayit(page).getByRole('alert');
  const a = kutu(page, 'Yalnız tanıştırırsa');
  const b = kutu(page, 'Ürünü de gösterirse');
  const eskiA = personaServer.snapshot('istoc').fields['oran.A'];
  await a.fill('150');
  await expect(uyari).toBeVisible();
  await b.fill('30');
  await b.blur();
  await expect.poll(() => personaServer.snapshot('istoc').fields['oran.B']).toBe(0.3);
  // A kutusunda %150 duruyor. Uyarı da duruyor ve ortak kayıtta A değişmedi.
  await expect(a).toHaveValue('%150');
  await expect(uyari).toBeVisible();
  expect(personaServer.snapshot('istoc').fields['oran.A']).toBe(eskiA);
  // A kutusu geçerli değere dönünce uyarı kalkar.
  await a.fill('10');
  await expect(uyari).toHaveCount(0);
  await expect.poll(() => personaServer.snapshot('istoc').fields['oran.A']).toBe(0.1);
});

/* ---------- Segika fiyatı ---------- */

test('birinci sürüm Segika fiyatı: hazır çalışan sayıları, indirim kademeleri ve kademe satırları', async ({ page, personaServer }) => {
  await birinciSurum(page);
  await urun(page, 'Segika').click();
  await expect(page).toHaveURL(/[?&]proje=segika/);
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  const hazir = page.getByRole('group', { name: 'Örnek firma büyüklüğü', exact: true });
  let a = ayar({ marka: 'segika' });

  const fiyatKontrol = async () => {
    const s = segikaAylik(a);
    await expect(yillikPaket(page)).toHaveText(tl(s.toplam * 12));
    await expect(page.locator('.so2-fiyat span')).toContainText(`${binlik(s.kisi)} çalışan`);
    await expect(page.locator('.so2-fiyat span')).toContainText(tl(s.toplam));
    // Hesap dökümünde her indirim kademesi ayrı satırdır.
    const kademeSatirlari = panel(page).locator('.so2-hesap-satir dt').filter({ hasText: /^[\d.]+–[\d.]+ çalışan$/ });
    await expect(kademeSatirlari).toHaveCount(s.dilimler.length);
    for (const d of s.dilimler) await expect(hesap(page, `${sayi(d.alt)}–${sayi(d.ust)} çalışan`)).toHaveText(tl(d.tutar));
    await expect(hesap(page, 'Aylık toplam')).toHaveText(tl(s.toplam));
    await expect(hesap(page, 'Yıllık paket')).toHaveText(tl(s.toplam * 12));
    // Öncü ortağın sonucu aynı yıllık fiyattan hesaplanır.
    await expect(sonuc(page)).toHaveText(tl(a.oncuAsama[3] * satisKazanci(a, a.oncuSeviye)));
  };

  for (const n of [25, 250, 1_000, 20_000]) {
    await hazir.getByRole('button', { name: binlik(n), exact: true }).click();
    a = { ...a, calisan: n };
    await expect(hazir.getByRole('button', { pressed: true })).toHaveText(binlik(n));
    await expect(kutu(page, /^Müşterinin çalışan sayısı/)).toHaveValue(binlik(n));
    await fiyatKontrol();
  }
  // 20.000 çalışan dört kademeye yayılır. Son kademe %50 indirimlidir.
  expect(segikaAylik(a).dilimler.map((d) => d.indirim)).toEqual([0, 0.2, 0.35, 0.5]);

  // İkinci kademenin indirimi %30 olur.
  const indirim = page.getByRole('group', { name: 'Büyük firma indirimi', exact: true });
  await indirim.getByRole('textbox', { name: 'İndirim', exact: true }).nth(1).fill('30');
  a = { ...a, kademeler: a.kademeler.map((k, i) => (i === 1 ? { ...k, indirim: 0.3 } : k)) };
  await fiyatKontrol();
  // İlk kademe 1.000 çalışana kadar uzar. Sonraki kademenin adı da değişir.
  await indirim.getByRole('textbox', { name: /^Kademe sonu/ }).first().fill('1000');
  a = { ...a, kademeler: a.kademeler.map((k, i) => (i === 0 ? { ...k, ust: 1_000 } : k)) };
  await fiyatKontrol();
  await expect(indirim.locator('.so2-kademe-ad')).toHaveText(['1–1.000 çalışan', '1.001–2.000 çalışan', '2.001–10.000 çalışan', '10.001 çalışan ve üstü']);
  await expect.poll(() => personaServer.snapshot('segika').fields['kademeler.0.ust']).toBe(1_000);
  expect(personaServer.snapshot('segika').fields['kademeler.1.indirim']).toBe(0.3);
  expect(personaServer.snapshot('segika').fields.calisan).toBe(20_000);
  // iStoc kaydı değişmez.
  expect(personaServer.writes.every((w) => w.project === 'segika')).toBe(true);
});

test('ikinci sürüm Segika fiyatı: hazır çalışan sayıları ve indirim kademeleri satış tutarını değiştirir', async ({ page, personaServer }) => {
  await ikinciSurum(page);
  await urun(page, 'Segika').click();
  const hazir = page.getByRole('group', { name: 'Örnek firma büyüklüğü', exact: true });
  let a = ayar2({ marka: 'segika' });
  const kontrol = async () => {
    const s = v2.satisOzeti(a);
    await expect(fiyat2(page)).toHaveText(tl(s.ciro));
    for (const id of ['ikisi', 'tesvik', 'otomasyon'] as const) {
      await expect(robot(page).locator('label', { hasText: v2.PAKET_ADI[id] })).toContainText(`${tl(v2.segikaAylik(a, id).toplam)} / ay`);
    }
    const ikisi = s.paketler.find((p) => p.id === 'ikisi')!;
    await expect(hesap2(page, `${ikisi.ad}: ilk yıl bedeli`)).toHaveText(tl(ikisi.ilkYil));
  };
  await kontrol();
  for (const n of [25, 250, 1_000, 20_000]) {
    await hazir.getByRole('button', { name: binlik(n), exact: true }).click();
    a = { ...a, calisan: n };
    await expect(hazir.getByRole('button', { pressed: true })).toHaveText(binlik(n));
    await kontrol();
  }
  const indirim = page.getByRole('group', { name: 'Büyük firma indirimi', exact: true });
  await expect(indirim.locator('.v2-so2-kademe-ad')).toHaveText(['1–500 çalışan', '501–2.000 çalışan', '2.001–10.000 çalışan', '10.001 çalışan ve üstü']);
  await indirim.getByRole('textbox', { name: 'İndirim', exact: true }).nth(3).fill('60');
  a = { ...a, kademeler: a.kademeler.map((k, i) => (i === 3 ? { ...k, indirim: 0.6 } : k)) };
  await kontrol();
  // İkinci sürüm ortak kayda yazmaz.
  expect(personaServer.writes).toHaveLength(0);
});

/* ---------- Birinci sürüm: sonuç panelleri ---------- */

test('birinci sürüm sonuç panelleri: beş rolün kazancı, bize kalan, kota ve ödeme günleri', async ({ page }) => {
  await birinciSurum(page);
  const a = ayar();
  const yillik = yillikFiyat(a);

  // Sekmelerdeki özet tutarlar.
  const k = kadrolu(a);
  const oncu = satisKazanci(a, a.oncuSeviye);
  const cozum = cozumKazanci(a);
  const elci = satisKazanci(a, a.elciSeviye);
  const ozet = { oncu: a.oncuAsama[3] * oncu, kadrolu: k.toplam, cozum: cozum * a.cozumMusteri, tavsiye: aylikFiyat(a) * a.krediAy, elci: elci * a.elciSatis };
  for (const [id, tutar] of Object.entries(ozet)) await expect(sekme(page, id).locator('.so2-rol-tutar')).toContainText(tl(tutar));

  // Öncü: 90. günden sonra ayda 4 satış. Ödemenin %70’i 14. gün, kalanı 60. gün.
  await expect(sonuc(page)).toHaveText(tl(ozet.oncu));
  await expect(bize(page)).toContainText(tl(a.oncuAsama[3] * (yillik - oncu)));
  await expect(hesap(page, 'Bir satıştan ortağa')).toHaveText(tl(oncu));
  await expect(odemeSatirlari(page)).toHaveText([`${a.ilkGun}. gün ödenir`, `${a.kalanGun}. gün ödenir`]);
  await expect(hesap(page, `${a.ilkGun}. gün ödenir`)).toHaveText(tl(oncu * a.ilkOdeme));
  await expect(hesap(page, `${a.kalanGun}. gün ödenir`)).toHaveText(tl(oncu * (1 - a.ilkOdeme)));

  // Kadrolu: ciro kotayı aşar, kotayı aşan cironun %5’i prim olur.
  await sekme(page, 'kadrolu').click();
  expect(k.prim).toBeGreaterThan(0);
  await expect(sonuc(page)).toHaveText(tl(k.toplam));
  await expect(bize(page)).toContainText(tl(k.ciro));
  await expect(bize(page)).toContainText(tl(k.ciro - k.prim));
  await expect(page.locator('.so2-kota-ust')).toContainText(tl(k.ciro));
  await expect(page.locator('.so2-kota-ust')).toContainText(tl(k.kota));
  await expect(page.locator('.so2-kota-dolgu')).toHaveAttribute('data-asti', '');
  await expect(page.locator('.so2-kota-not')).toContainText(`${k.kotaIcinSatis} satış`);
  await expect(hesap(page, 'Prim')).toHaveText(tl(k.prim));
  await expect(hesap(page, `${a.ilkGun}. gün ödenir`)).toHaveText(tl(k.prim * a.ilkOdeme));
  await expect(hesap(page, `${a.kalanGun}. gün ödenir`)).toHaveText(tl(k.prim * (1 - a.ilkOdeme)));
  // Satış yoksa kota dolmaz, prim ve ödeme satırı olmaz.
  await kutu(page, 'Bu ay satılan paket').fill('0');
  const bos = kadrolu(ayar({ kadroluSatis: 0 }));
  await expect(sonuc(page)).toHaveText(tl(bos.toplam));
  await expect(page.locator('.so2-kota-dolgu')).not.toHaveAttribute('data-asti', '');
  await expect(page.locator('.so2-kota-not')).toContainText(`${bos.kotaIcinSatis} satış`);
  await expect(hesap(page, 'Prim')).toHaveText(tl(0));
  await expect(odemeSatirlari(page)).toHaveCount(0);
  await kutu(page, 'Bu ay satılan paket').fill(String(a.kadroluSatis));
  await expect(sonuc(page)).toHaveText(tl(k.toplam));

  // Çözüm ortağı: yılda 10 müşteri, satışı kendisi kapatır (%18).
  await sekme(page, 'cozum').click();
  await expect(sonuc(page)).toHaveText(tl(ozet.cozum));
  await expect(bize(page)).toContainText(tl(a.cozumMusteri * (yillik - cozum)));
  await expect(hesap(page, 'Bir satıştan ortağa')).toHaveText(tl(cozum));
  await expect(hesap(page, `${a.ilkGun}. gün ödenir`)).toHaveText(tl(cozum * a.ilkOdeme));
  await expect(panel(page).locator('.so2-musavir')).toContainText(`%${sayi(a.musavirIndirim * 100)}`);

  // Tavsiye: para değil, ücretsiz kullanım. Ödeme günü satırı yoktur.
  await sekme(page, 'tavsiye').click();
  await expect(sonuc(page)).toHaveText(tl(ozet.tavsiye));
  await expect(bize(page)).toContainText(tl(yillik - aylikFiyat(a) * (a.krediAy + a.yeniKrediAy)));
  await expect(panel(page).locator('.so2-ikili-deger')).toHaveText([tl(aylikFiyat(a) * a.yeniKrediAy), `${a.tavsiyeSinir} tavsiye`]);
  await expect(hesap(page, 'Ücretsiz kullanımın değeri')).toHaveText(tl(ozet.tavsiye));
  await expect(odemeSatirlari(page)).toHaveCount(0);

  // Elçi: ayda 2 satış, yalnız tanıştırır (%8).
  await sekme(page, 'elci').click();
  await expect(sonuc(page)).toHaveText(tl(ozet.elci));
  await expect(bize(page)).toContainText(tl(a.elciSatis * (yillik - elci)));
  await expect(hesap(page, `${a.ilkGun}. gün ödenir`)).toHaveText(tl(elci * a.ilkOdeme));
  await expect(hesap(page, `${a.kalanGun}. gün ödenir`)).toHaveText(tl(elci * (1 - a.ilkOdeme)));
});

test('birinci sürüm “Her satışa sabit tutar” modeli ve ödeme günleri değişince hesap güncellenir', async ({ page, personaServer }) => {
  await birinciSurum(page);
  await page.getByRole('group', { name: 'Ödeme', exact: true }).getByRole('button', { name: 'Her satışa sabit tutar', exact: true }).click();
  let a = ayar({ model: 'sabit' });
  await expect(sonuc(page)).toHaveText(tl(a.oncuAsama[3] * a.sabit));
  await expect(hesap(page, 'Bir satıştan ortağa')).toHaveText(tl(a.sabit));
  await expect(hesapSatiri(page, 'Bir satıştan ortağa').locator('.so2-hesap-formul')).toHaveText('Her satışa sabit tutar');
  // Oran alanları gizlenir, satış başı tutar alanı açılır.
  await expect(kutu(page, 'Ürünü de gösterirse')).toHaveCount(0);
  await kutu(page, /^Yıllık paket başına/).fill('3000');
  a = { ...a, sabit: 3_000 };
  await expect(sonuc(page)).toHaveText(tl(a.oncuAsama[3] * 3_000));

  // Ödeme: %50 ilk ödeme 20. gün, kalanı 45. gün.
  await kutu(page, 'İlk ödeme').fill('50');
  await kutu(page, 'İlk ödeme kaçıncı günde?').fill('20');
  await kutu(page, 'Kalan ödeme kaçıncı günde?').fill('45');
  a = { ...a, ilkOdeme: 0.5, ilkGun: 20, kalanGun: 45 };
  await expect(odemeSatirlari(page)).toHaveText(['20. gün ödenir', '45. gün ödenir']);
  await expect(hesap(page, '20. gün ödenir')).toHaveText(tl(3_000 * 0.5));
  await expect(hesap(page, '45. gün ödenir')).toHaveText(tl(3_000 * 0.5));

  // Kadrolu: kotaya kadar olan satış prim getirmez. Sonraki her satış 3.000 ₺ prim getirir.
  await sekme(page, 'kadrolu').click();
  const k = kadrolu(a);
  expect(k.prim).toBe(Math.max(0, a.kadroluSatis - k.kotaIcinSatis) * 3_000);
  await expect(sonuc(page)).toHaveText(tl(k.toplam));
  await expect(hesap(page, 'Prim')).toHaveText(tl(k.prim));
  await expect(hesap(page, '20. gün ödenir')).toHaveText(tl(k.prim * 0.5));
  // Çözüm ortağı ve elçi de satış başına aynı tutarı alır.
  await sekme(page, 'cozum').click();
  await expect(sonuc(page)).toHaveText(tl(cozumKazanci(a) * a.cozumMusteri));
  expect(cozumKazanci(a)).toBe(3_000);
  await sekme(page, 'elci').click();
  await expect(sonuc(page)).toHaveText(tl(satisKazanci(a, a.elciSeviye) * a.elciSatis));
  await expect.poll(() => personaServer.snapshot('istoc').fields.kalanGun).toBe(45);
  const f = personaServer.snapshot('istoc').fields;
  expect([f.model, f.sabit, f.ilkOdeme, f.ilkGun]).toEqual(['sabit', 3_000, 0.5, 20]);
});

/* ---------- İkinci sürüm: yerel kayıt ve “Başa dön” ---------- */

test('ikinci sürüm ayarları bu tarayıcıda kalır, yenilemede korunur ve “Başa dön” ile silinir', async ({ page, personaServer }) => {
  await ikinciSurum(page);
  const ANAHTAR = 'turksab-satis-ortakligi-v2-segment';
  const kayitli = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), ANAHTAR);
  const basic = robot(page).getByRole('textbox', { name: /^Basic paket/ });
  const aylik = page.getByRole('group', { name: 'Müşteri öder', exact: true }).getByRole('button', { name: 'Aylık abonelik', exact: true });
  await basic.fill('2');
  await aylik.click();
  const a = ayar2({ istocSatis: { ...v2.VARSAYILAN_AYAR.istocSatis, standart: 2 }, faturalama: 'aylik' });
  await expect(fiyat2(page)).toHaveText(tl(v2.satisOzeti(a).ciro));
  await expect.poll(kayitli).toMatchObject({ istocSatis: { standart: 2 }, faturalama: 'aylik' });

  await page.reload();
  await expect(fiyat2(page)).toHaveText(tl(v2.satisOzeti(a).ciro));
  await expect(basic).toHaveValue('2');
  await expect(aylik).toHaveAttribute('aria-pressed', 'true');
  await expect(sekme2(page, 'oncu').locator('.v2-so2-rol-tutar')).toContainText(tl(v2.bagimsizKazanc(a).aylik));

  await page.getByRole('button', { name: 'Başa dön', exact: true }).click();
  await expect(fiyat2(page)).toHaveText(tl(v2.satisOzeti(ayar2()).ciro));
  await expect(basic).toHaveValue('1');
  await expect(aylik).toHaveAttribute('aria-pressed', 'false');
  expect(await kayitli()).toBeNull();
  await page.reload();
  await expect(fiyat2(page)).toHaveText(tl(v2.satisOzeti(ayar2()).ciro));
  expect(personaServer.writes).toHaveLength(0);
});

/* ---------- İkinci sürüm: özet sütunu ---------- */

test('ikinci sürüm özet sütunu: yıllık karşılık, paket dağılımı ve bütün personaların tutarı modelle aynı', async ({ page }) => {
  await ikinciSurum(page);
  const ozet = page.getByRole('complementary', { name: 'Özet', exact: true });
  const bolum = (ad: string | RegExp) => ozet.getByRole('region', { name: ad, exact: typeof ad === 'string' });
  const kontrol = async (a: v2.Ayar, rol: v2.RolId) => {
    const roller = v2.rolMetinleri(a.marka);
    const secili = roller.find((r) => r.id === rol)!;
    const s = v2.satisOzeti(a);
    await expect(bolum('Satış').locator('.v2-oz-sayi')).toHaveText([sayi(s.adet), tl(s.ciro)]);
    await expect(bolum('Satış').locator('.v2-oz-not')).toHaveText(s.paketler.map((p) => `${sayi(p.adet)} ${p.ad}`).join(', '));
    const sonucBolumu = bolum(`Sonuç: ${secili.ad}`);
    await expect(sonucBolumu.locator('.v2-oz-deger')).toContainText(personaOzeti(a, secili).deger);
    if (secili.sozlesme === 'bagimsiz') {
      const b = v2.bagimsizKazanc(a);
      await expect(sonucBolumu.locator('.v2-oz-not')).toContainText(tl(b.aylik * 12));
      const satir = (ad: string) => sonucBolumu.locator('.v2-oz-satir').filter({ has: page.locator('dt').getByText(ad, { exact: true }) });
      await expect(satir('Satış komisyonu').locator('dd')).toHaveText(tl(b.komisyon));
      await expect(satir('Ağ, 1. kademe').locator('dd')).toHaveText(tl(b.k1));
      await expect(satir('Ağ, 2. kademe').locator('dd')).toHaveText(tl(b.k2));
      await expect(satir('Ağ, 2. kademe')).toHaveAttribute('data-kapali', '');
      await expect(satir('Bize kalan, en az').locator('dd')).toHaveText(tl(b.bize));
    } else if (secili.sozlesme === 'kadrolu') {
      await expect(sonucBolumu.locator('.v2-oz-not')).toContainText(tl(v2.kadroluKazanc(a).toplam * 12));
    } else {
      await expect(sonucBolumu.locator('.v2-oz-not')).toContainText(tl(v2.musteriKazanc(a).yillikKredi / 12));
    }
    const kisiler = bolum('Bütün personalar').locator('.v2-oz-persona');
    await expect(kisiler.locator('.v2-oz-persona-ad')).toHaveText(roller.map((r) => r.ad));
    await expect(kisiler.locator('.v2-oz-persona-tutar')).toHaveText(roller.map((r) => { const o = personaOzeti(a, r); return `${o.deger}${o.birim}`; }));
    await expect(kisiler.filter({ hasText: secili.ad })).toHaveAttribute('aria-current', 'true');
  };
  let a = ayar2();
  await kontrol(a, 'oncu');
  // Satış artınca özet aynı hesapla güncellenir.
  await robot(page).getByRole('textbox', { name: /^Basic paket/ }).fill('3');
  await robot(page).getByRole('textbox', { name: /^Platinium paket/ }).fill('1');
  a = ayar2({ istocSatis: { standart: 3, pro: 1, kurumsal: 0 } });
  await kontrol(a, 'oncu');
  await sekme2(page, 'kadrolu').click();
  await kontrol(a, 'kadrolu');
  await sekme2(page, 'tavsiye').click();
  await kontrol(a, 'tavsiye');
});

/* ---------- İkinci sürüm: özel programlar ---------- */

test('ikinci sürüm özel programları: yıllara yayılan, tek seferlik, yönlendirme ve mali müşavir sonuçları', async ({ page }) => {
  await ikinciSurum(page);
  await urun(page, 'Segika').click();
  const program = page.getByRole('group', { name: 'Özel program', exact: true });
  const seg = ayar2({ marka: 'segika' });
  const tlKurus = (k: number) => tl(Math.round(k / 100));

  // Öncü: yıllara yayılan komisyon. Ödeme takvimi Affilate motorundan gelir.
  await program.getByRole('button', { name: /^Yıllara yayılan komisyon/ }).click();
  let a: v2.Ayar = { ...seg, kosul: { oncu: 'yillara' } };
  let ks = kosulSonucu(a, 'oncu')!;
  await expect(sonuc2(page)).toHaveText(ks.deger);
  await expect(sekme2(page, 'oncu').locator('.v2-so2-rol-tutar')).toContainText(ks.ozet);
  const yillar = affilateYillari(affilateHesabi(a, 'satis'), a.affUfukAy);
  await expect(panel2(page).locator('.v2-am-yillar li strong')).toHaveText(yillar.map(tlKurus));

  // Çözüm ortağı: ticari yönlendirme. 2.600 ₺ × 6 ay × %15 × 10 müşteri.
  await sekme2(page, 'cozum').click();
  await program.getByRole('button', { name: /^Ticari yönlendirme ortağı/ }).click();
  a = { ...seg, kosul: { oncu: 'yillara', cozum: 'yonlendirme' } };
  ks = kosulSonucu(a, 'cozum')!;
  expect(ks.deger).toBe(tl(2_600 * 6 * 0.15 * 10));
  await expect(sonuc2(page)).toHaveText(ks.deger);
  await expect(sekme2(page, 'cozum').locator('.v2-so2-rol-tutar')).toContainText(ks.ozet);

  // Çözüm ortağı: yıllara yayılan, destek veren.
  await program.getByRole('button', { name: /^Destek veren çözüm ortağı, yıllara yayılan/ }).click();
  a = { ...a, kosul: { ...a.kosul, cozum: 'yillara' } };
  ks = kosulSonucu(a, 'cozum')!;
  await expect(sonuc2(page)).toHaveText(ks.deger);
  await expect(panel2(page).locator('.v2-am-yillar li strong')).toHaveText(affilateYillari(affilateHesabi(a, 'cozum'), a.affUfukAy).map(tlKurus));

  // Mali müşavir ofisi: seviye mükellef sayısıyla değişir (10 Gümüş, 50 Altın, 9 Kayıtlı Ortak).
  await program.getByRole('button', { name: /^Mali müşavir ofisi, seviyeli/ }).click();
  a = { ...a, kosul: { ...a.kosul, cozum: 'smmm' } };
  await expect(sonuc2(page)).toHaveText(kosulSonucu(a, 'cozum')!.deger);
  for (const m of [50, 9]) {
    await kutu(page, /^Aktif mükellef/).fill(String(m));
    a = { ...a, smmmMukellef: m };
    await expect(sonuc2(page)).toHaveText(kosulSonucu(a, 'cozum')!.deger);
  }
  expect([10, 50, 9].map((m) => kosulSonucu({ ...a, smmmMukellef: m }, 'cozum')!.deger)).toEqual(['Gümüş', 'Altın', 'Kayıtlı Ortak']);

  // Mevcut müşteri: tek seferlik tavsiye komisyonu, ilk faturanın %10’u.
  await sekme2(page, 'tavsiye').click();
  await program.getByRole('button', { name: /^Tek seferlik tavsiye komisyonu/ }).click();
  a = { ...a, kosul: { ...a.kosul, tavsiye: 'tek-sefer' } };
  ks = kosulSonucu(a, 'tavsiye')!;
  expect(ks.deger).toBe(tl(v2.yillikFiyat(a) * 0.1));
  await expect(sonuc2(page)).toHaveText(ks.deger);
  await expect(panel2(page).locator('.v2-am-yillar li strong')).toHaveText(affilateYillari(affilateHesabi(a, 'ayse'), a.affUfukAy).map(tlKurus));
});

/* ---------- Sekme klavyesi ---------- */

for (const [surum, onek] of [['v1', 'so2'], ['v2', 'v2-so2']] as const) {
  test(`${surum}: rol sekmelerinde sağ ve sol ok tuşları başa sarar, yalnız seçili sekme sekme sırasındadır`, async ({ page }) => {
    if (surum === 'v1') await birinciSurum(page);
    else await ikinciSurum(page);
    const sira = ['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci'];
    const sek = (id: string) => page.locator(`#${onek}-sekme-${id}`);
    const durum = async (secili: string) => {
      for (const id of sira) {
        await expect(sek(id)).toHaveAttribute('aria-selected', String(id === secili));
        await expect(sek(id)).toHaveAttribute('tabindex', id === secili ? '0' : '-1');
      }
      await expect(sek(secili)).toBeFocused();
      await expect(page.locator(`#${onek}-panel`)).toHaveAttribute('aria-labelledby', `${onek}-sekme-${secili}`);
    };
    await sek('oncu').focus();
    await page.keyboard.press('ArrowLeft');
    await durum('elci');
    await page.keyboard.press('ArrowRight');
    await durum('oncu');
    for (const id of sira.slice(1)) {
      await page.keyboard.press('ArrowRight');
      await durum(id);
    }
    await page.keyboard.press('ArrowRight');
    await durum('oncu');
    // Başka tuşlar sekmeyi değiştirmez.
    await page.keyboard.press('ArrowDown');
    await durum('oncu');
  });
}

/* ---------- − ve + düğmeleri ---------- */

test('birinci sürüm sayı alanlarında − ve + düğmeleri alanın adımıyla değiştirir, en küçük değerde azaltma kapanır', async ({ page, personaServer }) => {
  await birinciSurum(page);
  const dugme = (ad: string, yon: 'azalt' | 'artır') => page.getByRole('button', { name: `${ad}: ${yon}`, exact: true });
  const ilk = kutu(page, 'İlk 14 gün: ayda kaç satış?');
  await expect(ilk).toHaveValue('0');
  await expect(dugme('İlk 14 gün: ayda kaç satış?', 'azalt')).toBeDisabled();
  await dugme('İlk 14 gün: ayda kaç satış?', 'artır').click();
  await expect(ilk).toHaveValue('1');
  await expect(dugme('İlk 14 gün: ayda kaç satış?', 'azalt')).toBeEnabled();
  await dugme('İlk 14 gün: ayda kaç satış?', 'azalt').click();
  await expect(ilk).toHaveValue('0');
  await expect(dugme('İlk 14 gün: ayda kaç satış?', 'azalt')).toBeDisabled();

  // Yüzde alanında adım bir yüzde puanıdır: %12 → %13.
  await dugme('Ürünü de gösterirse', 'artır').click();
  await expect(kutu(page, 'Ürünü de gösterirse')).toHaveValue('%13');
  const oran = ayar({ oran: { ...VARSAYILAN_AYAR.oran, B: 0.13 } });
  await expect(sonuc(page)).toHaveText(tl(oran.oncuAsama[3] * satisKazanci(oran, 'B')));
  await expect.poll(() => personaServer.snapshot('istoc').fields['oran.B']).toBe(0.13);

  // Maaş 1.000 ₺, kota çarpanı 0,5 adımla değişir.
  await sekme(page, 'kadrolu').click();
  await dugme('Aylık maaş', 'artır').click();
  await expect(kutu(page, /^Aylık maaş/)).toHaveValue('51.000');
  await dugme('Kota, maaşın kaç katı?', 'azalt').click();
  await expect(kutu(page, 'Kota, maaşın kaç katı?')).toHaveValue('1,5');
  const k = kadrolu({ ...oran, maas: 51_000, kotaCarpan: 1.5 });
  await expect(sonuc(page)).toHaveText(tl(k.toplam));
  // Satılan paket 2’den 0’a iner. 0’da azaltma kapanır.
  const paket = 'Bu ay satılan paket';
  await dugme(paket, 'azalt').click();
  await dugme(paket, 'azalt').click();
  await expect(kutu(page, paket)).toHaveValue('0');
  await expect(dugme(paket, 'azalt')).toBeDisabled();
  await expect(dugme(paket, 'artır')).toBeEnabled();

  // Segika çalışan sayısı en az 1’dir. 25’ten 25 adım azaltılamaz.
  await urun(page, 'Segika').click();
  await expect(kayit(page)).toHaveAttribute('data-sync-state', 'synced');
  await expect(kutu(page, /^Müşterinin çalışan sayısı/)).toHaveValue('25');
  await expect(dugme('Müşterinin çalışan sayısı', 'azalt')).toBeDisabled();
  await dugme('Müşterinin çalışan sayısı', 'artır').click();
  await expect(kutu(page, /^Müşterinin çalışan sayısı/)).toHaveValue('50');
  await expect(yillikPaket(page)).toHaveText(tl(segikaAylik(ayar({ marka: 'segika', calisan: 50 })).toplam * 12));
  await expect.poll(() => personaServer.snapshot('istoc').fields.kadroluSatis).toBe(0);
  const f = personaServer.snapshot('istoc').fields;
  expect([f.maas, f.kotaCarpan]).toEqual([51_000, 1.5]);
});
