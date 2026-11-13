import { expect, test, type Locator, type Page } from './fixtures/persona';
import {
  APPLETLER,
  BOLGELER,
  GS_BEKLEME,
  KARNE_SABLONLARI,
  SEVIYE_SETLERI,
  VARSAYILAN,
  bolge,
  derece,
  dereceOrtasi,
  hayKumeleri,
  hucreCarpani,
  ilerlemeIcin,
  isPuani,
  kademeAdimlari,
  kademeSerisi,
  karPaylasimi,
  karneSkoru,
  kbfOrani,
  meritDagit,
  meslekBul,
  ortusme,
  primHavuzu,
  seviyeBul,
  sonrakiSeviye,
  sprintSerisi,
  tabanZinciri,
  terfiKapisi,
  terfiYerlesimi,
  toplamOdul,
  uzmanlikBul,
  yapiDenetimi,
  yayilim,
  yillikZam,
  type AppletDurum,
  type Durum,
  type KademeGirdi,
  type Meslek,
  type Seviye,
} from '../src/data/applet';
import { DEFAULT_PARAMS } from '../src/data/params';
import { APPLET_KEY } from '../src/lib/appletStore';
import { int, num, pct, times } from '../src/lib/format';

/**
 * Hesap araçları sayfasının (/applet/) davranış testleri. Beklenen değerler sayfadan kopyalanmaz. Test bu değerleri
 * src/data/applet.ts içindeki işlevlerle hesaplar. Sayı biçimi sayfadakiyle aynıdır (AppletPage.tsx useBaz ve isaretli).
 * Şu dosyalardaki denetimler burada yinelenmez: tests/applet.spec.ts, tests/applet-model.spec.ts, tests/gorsel-algi.spec.ts.
 */

test.use({ viewport: { width: 1280, height: 800 } });

const V = VARSAYILAN;
/** Varsayılan baz birim, Parametreler sayfasındaki net asgari ücrettir. */
const BAZ = DEFAULT_PARAMS.minWage;
const KURUSLU = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Sayfa 100’ün altındaki tutarı kuruşlu yazar. Daha büyük tutarı tam sayı yazar (AppletPage.tsx useBaz). */
const tutar = (v: number, birim = '₺') => (Math.abs(v) < 100 && v !== 0 ? `${KURUSLU.format(v)} ${birim}` : `${int(v)} ${birim}`);
const para = (kat: number, baz = BAZ, birim = '₺') => tutar(kat * baz, birim);
const isaretli = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${pct(Math.abs(v))}`;
const bir = (v: number) => num(Math.round(v * 10) / 10);
const iki = (v: number) => num(Math.round(v * 100) / 100);
/** Durum hapının yazısı ve rengi appletKit.tsx DurumHapi bileşenindeki gibidir. */
const DURUM_ADI: Record<Durum, string> = { gecti: 'Geçti', uyari: 'Uyarı', kaldi: 'Kaldı' };
const DURUM_TONU: Record<Durum, string> = { gecti: 'karar', uyari: 'oneri', kaldi: 'bekliyor' };
const adOf = (id: string) => APPLETLER.find((a) => a.id === id)!.ad;

const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

async function ac(page: Page, applet = '') {
  await page.goto(`applet/${applet ? `#${applet}` : ''}`);
  await icerik(page);
  await hydrated(page);
  if (applet) await expect(page.locator(`section#${applet}`)).toBeVisible();
}

/** Yan menüden başka hesap aracına geçer. Sayfa yeniden yüklenmez. */
async function git(page: Page, id: string) {
  await page.getByRole('navigation', { name: 'Hesap araçları' }).getByRole('link', { name: adOf(id), exact: true }).click();
  await expect(page.locator(`section#${id}`)).toBeVisible();
}

/** Tablonun satırlarını okur. Her hücreden ana yazıyı alır. Alt satır, gizli yazı ve çizim alınmaz. Hücrede alan varsa alanın değerini alır. */
const tabloOku = (page: Page, id: string, alt = false) =>
  page
    .locator(`[role="region"][aria-labelledby="${id}-tablo"] tbody tr`)
    .evaluateAll(
      (trs, alt) =>
        trs.map((tr) =>
          [...tr.children].map((c) => {
            const girdi = c.querySelector<HTMLInputElement>('input:not([type="hidden"])');
            if (girdi) return girdi.type === 'checkbox' ? (girdi.checked ? 'işaretli' : 'boş') : girdi.value;
            if (alt) return [...c.querySelectorAll('.cell-sub')].map((s) => (s.textContent ?? '').trim()).join(' ');
            const kopya = c.cloneNode(true) as Element;
            kopya.querySelectorAll('.cell-sub, .visually-hidden, svg').forEach((e) => e.remove());
            return (kopya.textContent ?? '').replace(/\s+/g, ' ').trim();
          }),
        ),
      alt,
    );

/** İstenen sütunları seçer. Sütun sırası AppletPage.tsx içindeki tablo tanımıyla aynıdır. */
const sutunlar = (satirlar: string[][], idx: number[]) => satirlar.map((r) => idx.map((i) => r[i]));

/** Sonuç özetindeki kutuların değerlerini ve notlarını sırayla okur. */
const ozetOku = (page: Page, bolum: string) =>
  page.locator(`#${bolum} .stat`).evaluateAll((els) => ({
    deger: els.map((e) => (e.querySelector('.stat-value')?.textContent ?? '').trim()),
    not: els.map((e) => (e.querySelector('.stat-note')?.textContent ?? '').trim()),
  }));

const ozetDurum = (page: Page, bolum: string, sira: number, yer: 'stat-value' | 'stat-note') => page.locator(`#${bolum} .stat`).nth(sira).locator(`.${yer} .chip`);

/** Sayı alanını doldurur ve alandan çıkar. Böylece yazılan değer işlenir. */
async function yaz(alan: Locator, deger: string) {
  await alan.fill(deger);
  await alan.blur();
}

/** İki adımlı düğmeye iki kez basar. İlk basış onay ister. İkinci basış işi yapar. */
async function ikiAdim(kapsam: Page | Locator, ad: string, onay = `${ad} (onayla)`) {
  await kapsam.getByRole('button', { name: ad, exact: true }).click();
  await kapsam.getByRole('button', { name: onay, exact: true }).click();
}

const kayit = (page: Page) => page.evaluate((k) => localStorage.getItem(k), APPLET_KEY);

/** Ham JSON kaydını bu tarayıcıya yazar. Sonra sayfayı yeniden açar. */
async function kayitla(page: Page, ham: string, applet = '') {
  await ac(page);
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [APPLET_KEY, ham] as const);
  await page.goto('about:blank');
  await ac(page, applet);
}

/** Bütün hesap araçlarını sırayla açar. Hiçbir araçta çizim hatası, NaN, undefined ya da sonsuz değer olmamalı. */
async function hepsiniTara(page: Page) {
  for (const a of APPLETLER) {
    await page.goto(`applet/#${a.id}`);
    await expect(page.locator('.applet-panel aside[aria-label*="çizilemedi"]'), `${a.id} çizilemedi`).toHaveCount(0);
    await expect(page.locator(`section#${a.id}`)).toBeVisible();
    const metin = await page.locator('.applet-panel').evaluate((el) => `${(el as HTMLElement).innerText} ${[...el.querySelectorAll('input')].map((i) => i.value).join(' ')}`);
    expect(metin, `${a.id} bozuk değer gösteriyor`).not.toMatch(/NaN|undefined|Infinity|∞|null/);
  }
}

/* ---------- Beklenen değerler model işlevlerinden hesaplanır ---------- */

const kademeBekle = (k: KademeGirdi, baz = BAZ) => ({
  satir: kademeSerisi(k).map((r) => [`G${r.g}`, times(r.aritmetik), times(r.geometrik), `${r.geometrik >= r.aritmetik ? '+' : '−'}${para(Math.abs(r.geometrik - r.aritmetik), baz)}`, para(r.min, baz), para(r.max, baz), r.ortusme === null ? 'Üst bant yok' : pct(r.ortusme)]),
  alt: kademeSerisi(k).map((r) => [r.aritArtis === null ? 'İlk derece' : isaretli(r.aritArtis), para(r.geometrik, baz)]),
  ozet: (() => {
    const s = kademeSerisi(k);
    return [pct(yayilim(k.yariGenislik)), pct(ortusme(k.yariGenislik, k.oran)), pct(Math.max(0, ilerlemeIcin(k.yariGenislik, 0.5))), times(s[s.length - 1].geometrik)];
  })(),
});

const meritBekle = (mr: AppletDurum['merit']) => {
  const s = meritDagit(mr);
  return {
    ozet: [para(s.bordro), para(s.havuz), para(s.hamToplam), para(s.dagitilan)],
    satir: s.satirlar.map((r) => [r.kisi.ad, iki(r.compa), pct(r.oran), para(r.artis), para(r.yeni), r.tekSeferlik > 0 ? para(r.tekSeferlik) : '0 ₺', r.tekSeferlik > 0 ? 'Tavanda' : r.artis > 0 ? 'Kalıcı zam' : 'Zam yok']),
    alt: s.satirlar.map((r) => [s.olcek < 1 && r.oran > 0 ? `küçültülmüş ${pct(r.oran * s.olcek)}` : '', `tavan ${para(r.tavan)}`]),
  };
};

const zamBekle = (z: AppletDurum['zam'], matris: number[][]) => {
  const s = yillikZam(z, matris);
  const toplam = s.adimlar.reduce((n, a) => n + a.tutar, 0);
  return {
    ozet: [para(s.yeniUcret), isaretli(s.artis), s.tekSeferlik > 0 ? para(s.tekSeferlik) : '0 ₺'],
    compa: `Compa ${iki(s.compa)}`,
    satir: [
      ...s.adimlar.map((a) => [a.ad, `+${para(a.tutar)}`, pct(a.tutar / z.ucret), pct(toplam > 0 ? a.tutar / toplam : 0), a.aciklama]),
      // Toplam satırının gerekçesi sayfa metnidir. Bu satırda yalnız tutar ve oranlar karşılaştırılır.
      ['Toplam', `+${para(toplam)}`, pct(toplam / z.ucret), toplam > 0 ? '%100' : 'Artış yok'],
    ],
  };
};

const terfiBekle = (t: AppletDurum['terfi'], ortak: AppletDurum['ortak'], k: KademeGirdi) => {
  const meslek = meslekBul(ortak.meslekler, t.meslekId);
  const uzm = uzmanlikBul(meslek, t.uzmanlikId);
  const sev = seviyeBul(ortak.seviyeler, t.seviyeKod);
  const hedef = sonrakiSeviye(ortak.seviyeler, sev.kod);
  const ucret = hucreCarpani(meslek, uzm, sev) * t.compa;
  const y = hedef ? terfiYerlesimi({ ucret, yeniOrta: hucreCarpani(meslek, uzm, hedef), yariGenislik: k.yariGenislik, minArtis: t.minArtis, maxArtis: t.maxArtis, hedefCompa: t.hedefCompa }) : null;
  return {
    karar: terfiKapisi(t, sev.hat).karar,
    ozet: [hedef ? hedef.kod : 'Son seviye', y ? para(y.yeni) : 'Uygulanmıyor', y ? isaretli(y.artis) : 'Uygulanmıyor'],
    yerlesim: y && hedef ? [ucret, y.yeniMin, ucret * (1 + t.minArtis), hucreCarpani(meslek, uzm, hedef) * t.hedefCompa, y.tavan, y.yeni].map((v) => para(v)) : [],
  };
};

const pozisyonBekle = (d: AppletDurum['degerleme'], k: KademeGirdi, meslekler: Meslek[], baz = BAZ) => {
  const puanlar = d.pozisyonlar.map((p) => ({ id: p.id, puan: isPuani(d.faktorler, d.faktorler.map((_, i) => p.puan[i] ?? 1)) }));
  const ayni = hayKumeleri(puanlar.map((p) => ({ id: p.id, puan: p.puan * 100 })));
  return d.pozisyonlar.map((p, i) => {
    const g = derece(d.esikler, puanlar[i].puan);
    return [p.ad, iki(puanlar[i].puan), `G${g}`, para(dereceOrtasi(k, g), baz), ayni.has(p.id) ? 'Aynı büyüklük' : 'Ayrışıyor', meslekBul(meslekler, p.meslekId).ad];
  });
};

const kbfBekle = (b: AppletDurum['kbf'], ortak: AppletDurum['ortak']) => {
  const meslek = meslekBul(ortak.meslekler, b.meslekId);
  const sev = seviyeBul(ortak.seviyeler, b.seviyeKod);
  const orta = hucreCarpani(meslek, uzmanlikBul(meslek, b.uzmanlikId), sev);
  const min = orta * (1 - b.yariGenislik);
  const max = orta * (1 + b.yariGenislik);
  const hedef = (puan: number[]) => min + (max - min) * kbfOrani(b.kriterler, puan);
  return {
    ozet: [para(min), para(orta), para(max)],
    not: [times(min), `${meslek.ad}, ${sev.kod}`, times(max)],
    satir: b.kisiler.map((k) => {
      const f = hedef(k.puan) - k.mevcut * orta;
      return [k.ad, pct(kbfOrani(b.kriterler, k.puan)), para(hedef(k.puan)), `${f >= 0 ? '+' : '−'}${para(Math.abs(f))}`, BOLGELER[bolge(k.mevcut)].ad];
    }),
    alt: b.kisiler.map((k) => [`compa ${iki(hedef(k.puan) / orta)}`, `mevcut ${para(k.mevcut * orta)}`]),
  };
};

const karneBekle = (sablonId: string, kritik = false) => {
  const sablon = KARNE_SABLONLARI.find((s) => s.id === sablonId)!;
  const s = karneSkoru(sablon.boyutlar, V.karne.puanlar[sablonId], kritik);
  return {
    s,
    ozet: [bir(s.ham), bir(s.skor)],
    satir: sablon.boyutlar.map((b, i) => [b.ad, b.kapi === 'kalite' ? 'Kalite' : b.kapi === 'uyum' ? 'Uyum' : 'Yok', bir(s.katki[i])]),
  };
};

const ekipBekle = (ek: AppletDurum['ekip']) => {
  const s = primHavuzu(ek);
  return {
    ozet: [times(s.sirket), para(s.hedefToplam), para(s.odenen)],
    satir: s.satirlar.map((r) => [r.kisi.ad, para(r.hedef), `${num(r.sirket)} × ${num(r.takim)} × ${num(r.birey)}`, para(r.odeme)]),
  };
};

const karBekle = (kr: AppletDurum['kar']) => {
  const havuz = kr.kar * kr.havuzOrani;
  const s = karPaylasimi({ kisiler: kr.kisiler, havuz, kidemSarti: kr.kidemSarti, yontem: kr.yontem, tavan: kr.tavan });
  return {
    s,
    ozet: [para(havuz), para(s.dagitilan), para(s.kalan), para(kr.kisiler.length * kr.akranKota * 4 * kr.akranTutar)],
    satir: s.satirlar.map((r) => [r.kisi.ad, r.uygun ? 'Uygun' : 'Kıdem yetmiyor', r.uygun ? para(r.pay) : '0 ₺', r.uygun ? pct(r.tabanOrani) : 'Uygulanmıyor']),
    alt: s.satirlar.map((r) => (r.uygun && r.tavanda ? 'tavanda' : '')),
  };
};

const denetimBekle = (ortak: AppletDurum['ortak'], k: KademeGirdi) => {
  const kontroller = yapiDenetimi({ meslekler: ortak.meslekler, seviyeler: ortak.seviyeler, kademe: k, tabanCarpani: ortak.tabanCarpani });
  const say = (d: Durum) => int(kontroller.filter((x) => x.durum === d).length);
  return { ozet: [say('gecti'), say('uyari'), say('kaldi')], satir: kontroller.map((x) => [x.ad, x.deger, DURUM_ADI[x.durum]]) };
};

const odulBekle = (o: AppletDurum['odul'], ortak: AppletDurum['ortak']) => {
  const meslek = meslekBul(ortak.meslekler, o.meslekId);
  return toplamOdul({ meslek, uzmanlik: uzmanlikBul(meslek, o.uzmanlikId), seviyeler: ortak.seviyeler, karisim: o.karisim, egitim: o.egitim, ekipman: o.ekipman, saglik: o.saglik }).map((r) => [
    r.seviye.kod,
    para(r.aylik),
    para(r.yillik),
    para(r.prim),
    para(r.ttc),
    para(r.yanHak),
    para(r.toplam),
  ]);
};

const zincirBekle = (z: AppletDurum['zincir'], ortak: AppletDurum['ortak']) => {
  const meslek = meslekBul(ortak.meslekler, z.meslekId);
  const s = tabanZinciri({
    baz: BAZ,
    meslek,
    uzmanlik: uzmanlikBul(meslek, z.uzmanlikId),
    seviye: seviyeBul(ortak.seviyeler, z.seviyeKod),
    lokasyon: ortak.lokasyonlar.find((l) => l.id === z.lokasyonId)!,
    lokasyonTaban: ortak.lokasyonTaban,
    insanaOde: z.insanaOde,
    sozlesme: ortak.sozlesmeler.find((l) => l.id === z.sozlesmeId)!,
    bandKonumu: z.bandKonumu,
    tabanCarpani: ortak.tabanCarpani,
  });
  return { ozet: [tutar(s.sonuc), tutar(s.sonuc / z.saat), tutar(s.sonuc * 12)], satir: s.satirlar.map((r) => [r.ad, r.deger, times(r.carpan), tutar(r.tutar), times(r.tutar / BAZ)]) };
};

const rutbeBekle = (ortak: AppletDurum['ortak'], gorunum: 'carpan' | 'tutar', baz = BAZ, birim = '₺') => {
  const uzm = (m: Meslek) => uzmanlikBul(m, V.matris.uzmanlik[m.id] ?? '');
  const goster = (v: number) => (gorunum === 'carpan' ? times(v) : para(v, baz, birim));
  const hucreler = ortak.meslekler.flatMap((m) => ortak.seviyeler.map((s) => hucreCarpani(m, uzm(m), s)));
  const enAz = Math.min(...hucreler);
  const enCok = Math.max(...hucreler);
  return {
    ozet: [goster(enAz), goster(enCok), `${num(Math.round((enCok / enAz) * 10) / 10)} : 1`],
    not: [gorunum === 'carpan' ? para(enAz, baz, birim) : times(enAz), gorunum === 'carpan' ? para(enCok, baz, birim) : times(enCok)],
    satir: ortak.seviyeler.map((s) => [s.kod, times(s.carpan), ...ortak.meslekler.map((m) => goster(hucreCarpani(m, uzm(m), s)))]),
  };
};

const ortakIle = (patch: Partial<AppletDurum['ortak']>): AppletDurum['ortak'] => ({ ...V.ortak, ...patch });
const katsayiIle = (id: string, katsayi: number) => V.ortak.meslekler.map((m) => (m.id === id ? { ...m, katsayi } : m));

/* ---------- 1. Hesaplanan sonuçlar ---------- */

test.describe('Hesap araçlarının sonuçları', () => {
  test('Kademe serisi tablosu ve özeti modelle aynı. Girdi değişince ikisi de yenilenir.', async ({ page }) => {
    await ac(page, 'kademe-serisi');
    let b = kademeBekle(V.kademe);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'kademe'), [0, 1, 2, 3, 4, 5, 6])).toEqual(b.satir);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'kademe', true), [1, 2])).toEqual(b.alt);
    await expect.poll(async () => (await ozetOku(page, 'kademe-serisi')).deger).toEqual(b.ozet);

    await yaz(page.getByRole('textbox', { name: 'İlk derece (G1) orta noktası' }), '1,5');
    await yaz(page.getByRole('textbox', { name: 'Geometrik ilerleme' }), '15');
    await yaz(page.getByRole('textbox', { name: 'Derece sayısı' }), '6');
    await yaz(page.getByRole('textbox', { name: 'Band yarı genişliği (±)' }), '25');
    const k: KademeGirdi = { ...V.kademe, k1: 1.5, oran: 0.15, adet: 6, yariGenislik: 0.25 };
    b = kademeBekle(k);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'kademe'), [0, 1, 2, 3, 4, 5, 6])).toEqual(b.satir);
    await expect.poll(async () => (await ozetOku(page, 'kademe-serisi')).deger).toEqual(b.ozet);
  });

  test('Liyakat matrisinde ekip tablosu ve bütçe özeti modelle aynı. Küçültme kapanınca oran tam ödenir.', async ({ page }) => {
    await ac(page, 'liyakat-matrisi');
    let b = meritBekle(V.merit);
    // Varsayılan ekipte gereken zam bütçeyi aşar. Bu yüzden küçültme gerçekten çalışır.
    expect(meritDagit(V.merit).olcek).toBeLessThan(1);
    await expect.poll(async () => (await ozetOku(page, 'liyakat-matrisi')).deger).toEqual(b.ozet);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'merit-kisi'), [0, 4, 5, 6, 7, 8, 9])).toEqual(b.satir);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'merit-kisi', true), [5, 7])).toEqual(b.alt);

    await page.getByRole('switch', { name: 'Zamlar bütçeyi aşarsa aynı oranda küçültülsün' }).click();
    await yaz(page.getByRole('textbox', { name: 'Kişi E performans puanı' }), '3');
    b = meritBekle({ ...V.merit, olcekle: false, kisiler: V.merit.kisiler.map((k) => (k.id === 'e' ? { ...k, puan: 3 } : k)) });
    await expect.poll(async () => (await ozetOku(page, 'liyakat-matrisi')).deger).toEqual(b.ozet);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'merit-kisi'), [0, 4, 5, 6, 7, 8, 9])).toEqual(b.satir);
  });

  test('Yıllık zamda bileşenler ve özet modelle aynı. Terfi açılınca ücret yeni banda yerleşir.', async ({ page }) => {
    await ac(page, 'yillik-zam');
    let b = zamBekle(V.zam, V.merit.matris);
    await expect.poll(async () => (await ozetOku(page, 'yillik-zam')).deger).toEqual(b.ozet);
    await expect.poll(async () => (await ozetOku(page, 'yillik-zam')).not[1]).toBe(b.compa);
    await expect.poll(async () => (await tabloOku(page, 'zam-bilesen')).map((r, i) => (i < 6 ? r : r.slice(0, 4)))).toEqual(b.satir);

    await page.getByRole('switch', { name: 'Terfi var' }).click();
    b = zamBekle({ ...V.zam, terfi: true }, V.merit.matris);
    await expect.poll(async () => (await ozetOku(page, 'yillik-zam')).deger).toEqual(b.ozet);
    await expect.poll(async () => (await tabloOku(page, 'zam-bilesen')).map((r, i) => (i < 6 ? r : r.slice(0, 4)))).toEqual(b.satir);
  });

  test('İş değerlemede puan, derece, orta nokta ve Hay işareti modelle aynı. Puan değişince bunlar yenilenir.', async ({ page }) => {
    await ac(page, 'is-degerleme');
    const toplamAgirlik = V.degerleme.faktorler.reduce((n, f) => n + f.agirlik, 0);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'faktor'), [0, 3])).toEqual(V.degerleme.faktorler.map((f) => [f.ad, pct(f.agirlik / toplamAgirlik)]));
    await expect.poll(async () => sutunlar(await tabloOku(page, 'pozisyon'), [0, 6, 7, 8, 9, 10])).toEqual(pozisyonBekle(V.degerleme, V.kademe, V.ortak.meslekler));

    // Grafik tasarımcının bütün puanları 5 olunca en üst dereceye çıkar.
    for (const f of V.degerleme.faktorler) await yaz(page.getByRole('textbox', { name: `Grafik tasarımcı: ${f.ad}` }), '5');
    const d = { ...V.degerleme, pozisyonlar: V.degerleme.pozisyonlar.map((p) => (p.id === 'p3' ? { ...p, puan: [5, 5, 5, 5, 5] } : p)) };
    const beklenen = pozisyonBekle(d, V.kademe, V.ortak.meslekler);
    expect(beklenen[2][2]).toBe('G9');
    await expect.poll(async () => sutunlar(await tabloOku(page, 'pozisyon'), [0, 6, 7, 8, 9, 10])).toEqual(beklenen);
  });

  test('Band içi konumda sınırlar, hedef, fark ve bölge modelle aynı. Seviye değişince band kayar.', async ({ page }) => {
    await ac(page, 'band-konumu');
    let b = kbfBekle(V.kbf, V.ortak);
    await expect.poll(async () => ozetOku(page, 'band-konumu')).toEqual({ deger: b.ozet, not: b.not });
    await expect.poll(async () => sutunlar(await tabloOku(page, 'kbf'), [0, 4, 5, 7, 8])).toEqual(b.satir);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'kbf', true), [5, 7])).toEqual(b.alt);

    await page.getByRole('combobox', { name: 'Seviye', exact: true }).click();
    await page.getByRole('option', { name: /^P4:/ }).click();
    b = kbfBekle({ ...V.kbf, seviyeKod: 'P4' }, V.ortak);
    await expect.poll(async () => ozetOku(page, 'band-konumu')).toEqual({ deger: b.ozet, not: b.not });
    await expect.poll(async () => sutunlar(await tabloOku(page, 'kbf'), [0, 4, 5, 7, 8])).toEqual(b.satir);
  });

  test('Performans karnesinde skor, katkı ve kapılar modelle aynı.', async ({ page }) => {
    await ac(page, 'performans-karnesi');
    const sablonSec = (ad: string) => page.getByRole('group', { name: 'Meslek şablonu' }).getByRole('button', { name: ad, exact: true }).click();
    const kontrol = async (b: ReturnType<typeof karneBekle>) => {
      await expect.poll(async () => (await ozetOku(page, 'performans-karnesi')).deger.slice(0, 2)).toEqual(b.ozet);
      await expect.poll(async () => sutunlar(await tabloOku(page, 'karne'), [0, 2, 4])).toEqual(b.satir);
      await expect(ozetDurum(page, 'performans-karnesi', 1, 'stat-note')).toHaveText(b.s.bant.ad);
      await expect(ozetDurum(page, 'performans-karnesi', 1, 'stat-note')).toHaveAttribute('data-status', DURUM_TONU[b.s.bant.durum]);
      await expect(page.locator('#performans-karnesi .stat').nth(2).locator('.stat-note')).toHaveText(`Çarpan ${times(b.s.faktor)}`);
      const prim = ozetDurum(page, 'performans-karnesi', 2, 'stat-value');
      await expect(prim).toHaveAttribute('data-status', DURUM_TONU[b.s.prim === 'uygun' ? 'gecti' : b.s.prim === 'yok' ? 'kaldi' : 'uyari']);
      if (b.s.prim === 'uygun') await expect(prim).toHaveText('Uygun');
    };

    await kontrol(karneBekle('yazilim'));
    // Tasarım şablonunda kalite puanı 80’in altında. Bu yüzden skor en çok 100 olur.
    const tasarim = karneBekle('tasarim');
    expect(tasarim.s.kaliteKaldi && tasarim.s.ham > 100).toBe(true);
    await sablonSec(KARNE_SABLONLARI.find((s) => s.id === 'tasarim')!.ad);
    await kontrol(tasarim);
    // İnsan kaynakları şablonunda uyum puanı 80’in altında. Bu yüzden prim ödenmez.
    const ik = karneBekle('ik');
    expect(ik.s.prim).toBe('yok');
    await sablonSec(KARNE_SABLONLARI.find((s) => s.id === 'ik')!.ad);
    await kontrol(ik);
    // Kritik olay varsa prim inceleme bitene kadar bekler.
    await sablonSec(KARNE_SABLONLARI.find((s) => s.id === 'yazilim')!.ad);
    await page.getByRole('switch', { name: 'Kritik olay var' }).click();
    await kontrol(karneBekle('yazilim', true));
  });

  test('Prim havuzunda hedef prim, çarpanlar ve ödeme modelle aynı. Takım sonucu ve sabit havuz hesabı değiştirir.', async ({ page }) => {
    await ac(page, 'prim-havuzu');
    let ek: AppletDurum['ekip'] = V.ekip;
    const kontrol = async () => {
      const b = ekipBekle(ek);
      await expect.poll(async () => (await ozetOku(page, 'prim-havuzu')).deger).toEqual(b.ozet);
      await expect.poll(async () => sutunlar(await tabloOku(page, 'prim-kisi'), [0, 4, 5, 6])).toEqual(b.satir);
    };
    await kontrol();

    await yaz(page.getByRole('textbox', { name: 'Ürün takım sonucu' }), '120');
    ek = { ...ek, takimSonuc: { ...ek.takimSonuc, Ürün: 120 } };
    await kontrol();

    await page.getByRole('switch', { name: 'Sabit havuz' }).click();
    ek = { ...ek, sabitHavuz: true };
    await kontrol();
    // Sabit havuz açıksa ödenen toplam havuz tutarına eşittir.
    expect(primHavuzu(ek).odenen).toBeCloseTo(ek.havuz, 9);
  });

  test('Kâr paylaşımında pay, tavan ve devreden tutar modelle aynı. Yöntem ve tavan değişince pay yeniden dağıtılır.', async ({ page }) => {
    await ac(page, 'kar-paylasimi');
    let kr: AppletDurum['kar'] = V.kar;
    const kontrol = async () => {
      const b = karBekle(kr);
      await expect.poll(async () => (await ozetOku(page, 'kar-paylasimi')).deger).toEqual(b.ozet);
      await expect.poll(async () => sutunlar(await tabloOku(page, 'kar'), [0, 3, 4, 5])).toEqual(b.satir);
      await expect.poll(async () => (await tabloOku(page, 'kar', true)).map((r) => r[5])).toEqual(b.alt);
      return b;
    };
    await kontrol();

    await page.getByRole('group', { name: 'Dağıtım' }).getByRole('button', { name: 'Eşit', exact: true }).click();
    kr = { ...kr, yontem: 'esit' };
    await kontrol();

    // Tavan çok düşükse herkes tavanda kalır. Dağıtılamayan tutar sonraki döneme devreder.
    await yaz(page.getByRole('textbox', { name: 'Kişi başı tavan (yıllık tabanın yüzdesi)' }), '5');
    kr = { ...kr, tavan: 0.05 };
    const b = await kontrol();
    expect(b.s.kalan).toBeGreaterThan(0);
  });

  test('Yapı denetimi modelle aynı. İlk model ve kademeli set düğmeleri seviye setini değiştirir.', async ({ page }) => {
    await ac(page, 'yapi-denetimi');
    let b = denetimBekle(V.ortak, V.kademe);
    await expect.poll(async () => (await ozetOku(page, 'yapi-denetimi')).deger).toEqual(b.ozet);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'denetim'), [0, 1, 2])).toEqual(b.satir);

    await page.getByRole('button', { name: 'İlk modeli dene', exact: true }).click();
    const ilk = denetimBekle(ortakIle({ seviyeSeti: 'ilk', seviyeler: SEVIYE_SETLERI.ilk.seviyeler }), V.kademe);
    expect(ilk.satir).not.toEqual(b.satir);
    await expect.poll(async () => (await ozetOku(page, 'yapi-denetimi')).deger).toEqual(ilk.ozet);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'denetim'), [0, 1, 2])).toEqual(ilk.satir);
    // Katalogda da ilk set seçili olmalı. Katalogda üç seviye olmalı.
    await git(page, 'katalog');
    await expect(page.getByRole('group', { name: 'Seviye seti' }).getByRole('button', { name: SEVIYE_SETLERI.ilk.ad })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await tabloOku(page, 'katalog-seviye')).map((r) => r[0])).toEqual(['P1', 'P2', 'P3']);

    await git(page, 'yapi-denetimi');
    await page.getByRole('button', { name: 'Kademeli sete dön', exact: true }).click();
    b = denetimBekle(V.ortak, V.kademe);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'denetim'), [0, 1, 2])).toEqual(b.satir);
    // Değerler örnekle aynı olunca kayıt silinir. Sıfırlama düğmesi de kapanır.
    await expect.poll(() => kayit(page)).toBeNull();
    await expect(page.getByRole('button', { name: 'Örnek değerlere dön' })).toBeDisabled();
  });

  test('Toplam hedef nakit her seviyede modelle aynı. Değişken pay ve yan hak değişince tablo yenilenir.', async ({ page }) => {
    await ac(page, 'toplam-odul');
    await expect.poll(async () => sutunlar(await tabloOku(page, 'odul'), [0, 2, 3, 4, 5, 6, 7])).toEqual(odulBekle(V.odul, V.ortak));
    await yaz(page.getByRole('textbox', { name: 'P3 değişken payı' }), '30');
    await yaz(page.getByRole('textbox', { name: 'Sağlık bütçesi (yıllık)' }), '1,2');
    const o = { ...V.odul, karisim: { ...V.odul.karisim, P3: 30 }, saglik: 1.2 };
    await expect.poll(async () => sutunlar(await tabloOku(page, 'odul'), [0, 2, 3, 4, 5, 6, 7])).toEqual(odulBekle(o, V.ortak));
  });
});

/* ---------- 2. Hesap araçları arası okuma ---------- */

test.describe('Araçlar arası okuma', () => {
  test('Yıllık zam liyakat matrisindeki oranı kullanır.', async ({ page }) => {
    await ac(page, 'yillik-zam');
    const once = zamBekle(V.zam, V.merit.matris);
    await expect.poll(async () => (await tabloOku(page, 'zam-bilesen'))[3].slice(0, 3)).toEqual(once.satir[3].slice(0, 3));

    // Varsayılan kişi piyasa düzeltmesinden sonra puan 3 ve compa 0,90 hücresine düşer.
    await git(page, 'liyakat-matrisi');
    await yaz(page.getByRole('textbox', { name: 'Puan 3, compa 0,85 ile 0,95' }), '9');
    const matris = V.merit.matris.map((s, i) => (i === 2 ? s.map((x, j) => (j === 1 ? 9 : x)) : s));
    const sonra = zamBekle(V.zam, matris);
    expect(sonra.satir[3][1]).not.toBe(once.satir[3][1]);

    await git(page, 'yillik-zam');
    await expect.poll(async () => (await tabloOku(page, 'zam-bilesen'))[3]).toEqual(sonra.satir[3]);
    await expect.poll(async () => (await ozetOku(page, 'yillik-zam')).deger).toEqual(sonra.ozet);
  });

  test('Terfi kapısı band genişliğini kademe serisinden alır.', async ({ page }) => {
    await ac(page, 'terfi-kapisi');
    const once = terfiBekle(V.terfi, V.ortak, V.kademe);
    await expect.poll(async () => (await ozetOku(page, 'terfi-kapisi')).deger.slice(1)).toEqual(once.ozet);
    await expect.poll(async () => (await tabloOku(page, 'terfi-yerlesim')).map((r) => r[1])).toEqual(once.yerlesim);
    await expect(ozetDurum(page, 'terfi-kapisi', 0, 'stat-value')).toHaveAttribute('data-status', DURUM_TONU[once.karar]);

    await git(page, 'kademe-serisi');
    await yaz(page.getByRole('textbox', { name: 'Band yarı genişliği (±)' }), '3');
    const sonra = terfiBekle(V.terfi, V.ortak, { ...V.kademe, yariGenislik: 0.03 });
    // Bant dar olunca yeni bandın en azı, en az artışla bulunan ücreti geçer. Bu yüzden sonuç değişir.
    expect(sonra.ozet[1]).not.toBe(once.ozet[1]);

    await git(page, 'terfi-kapisi');
    await expect.poll(async () => (await ozetOku(page, 'terfi-kapisi')).deger.slice(1)).toEqual(sonra.ozet);
    await expect.poll(async () => (await tabloOku(page, 'terfi-yerlesim')).map((r) => r[1])).toEqual(sonra.yerlesim);
  });

  test('İş değerleme orta noktayı, meslek adını ve baz birimi başka araçlardan alır.', async ({ page }) => {
    await ac(page, 'kademe-serisi');
    await yaz(page.getByRole('textbox', { name: 'İlk derece (G1) orta noktası' }), '1,5');
    await git(page, 'katalog');
    await yaz(page.getByRole('textbox', { name: '2. meslek adı' }), 'Görsel tasarım');
    await page.getByRole('combobox', { name: 'Baz birim' }).click();
    await page.getByRole('option', { name: 'Asgari ücret (brüt)' }).click();

    await git(page, 'is-degerleme');
    const k = { ...V.kademe, k1: 1.5 };
    const meslekler = V.ortak.meslekler.map((m) => (m.id === 'tasarim' ? { ...m, ad: 'Görsel tasarım' } : m));
    const beklenen = pozisyonBekle(V.degerleme, k, meslekler, DEFAULT_PARAMS.minWageGross);
    expect(beklenen.filter((r) => r[5] === 'Görsel tasarım')).toHaveLength(3);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'pozisyon'), [0, 6, 7, 8, 9, 10])).toEqual(beklenen);
  });

  test('Toplam hedef nakit katalogdaki katsayıyı ve seviye setini kullanır.', async ({ page }) => {
    await ac(page, 'katalog');
    await yaz(page.getByRole('textbox', { name: 'Yazılım katsayısı' }), '2');
    await git(page, 'toplam-odul');
    let ortak = ortakIle({ meslekler: katsayiIle('yazilim', 2) });
    await expect.poll(async () => sutunlar(await tabloOku(page, 'odul'), [0, 2, 3, 4, 5, 6, 7])).toEqual(odulBekle(V.odul, ortak));

    await git(page, 'katalog');
    await page.getByRole('group', { name: 'Seviye seti' }).getByRole('button', { name: SEVIYE_SETLERI.gitlab.ad }).click();
    await git(page, 'toplam-odul');
    ortak = { ...ortak, seviyeSeti: 'gitlab', seviyeler: SEVIYE_SETLERI.gitlab.seviyeler };
    await expect.poll(async () => sutunlar(await tabloOku(page, 'odul'), [0, 2, 3, 4, 5, 6, 7])).toEqual(odulBekle(V.odul, ortak));
  });
});

/* ---------- 3. Satır ekleme, silme ve ön ayarlar ---------- */

test.describe('Satır ekleme ve silme', () => {
  test('Seviye eklenince ve silinince katalog ile rütbe matrisi birlikte değişir.', async ({ page }) => {
    await ac(page, 'katalog');
    await page.getByRole('button', { name: 'Uzman seviyesi ekle', exact: true }).click();
    await page.getByRole('button', { name: 'Yönetici seviyesi ekle', exact: true }).click();
    // Yeni seviyenin çarpanı, aynı hattın son seviyesinin 1,2 katıdır. Çarpan yuvarlanır.
    const p7: Seviye = { kod: 'P7', ad: 'Yeni uzman seviyesi', hat: 'IC', carpan: Math.round(2.18 * 1.2 * 100) / 100 };
    const m5: Seviye = { kod: 'M5', ad: 'Yeni yönetici seviyesi', hat: 'M', carpan: Math.round(2.64 * 1.2 * 100) / 100 };
    const ic = V.ortak.seviyeler.filter((s) => s.hat === 'IC');
    const m = V.ortak.seviyeler.filter((s) => s.hat === 'M');
    let seviyeler = [...ic, p7, ...m, m5];
    await expect.poll(async () => sutunlar(await tabloOku(page, 'katalog-seviye'), [0, 1, 3])).toEqual(seviyeler.map((s) => [s.kod, s.ad, num(s.carpan)]));
    await expect.poll(async () => (await ozetOku(page, 'katalog')).deger[2]).toBe(int(seviyeler.length));

    await git(page, 'rutbe-matrisi');
    await expect.poll(async () => tabloOku(page, 'rutbe')).toEqual(rutbeBekle(ortakIle({ seviyeler }), 'carpan').satir);

    await git(page, 'katalog');
    const sil = page.getByRole('button', { name: 'Son uzman seviyesini sil', exact: true });
    await sil.click();
    // İlk basış veriyi değiştirmez.
    await expect.poll(async () => (await tabloOku(page, 'katalog-seviye')).length).toBe(12);
    await page.getByRole('button', { name: 'Son uzman seviyesini sil (onayla)', exact: true }).click();
    seviyeler = [...ic, ...m, m5];
    await expect.poll(async () => (await tabloOku(page, 'katalog-seviye')).map((r) => r[0])).toEqual(seviyeler.map((s) => s.kod));
    await git(page, 'rutbe-matrisi');
    await expect.poll(async () => tabloOku(page, 'rutbe')).toEqual(rutbeBekle(ortakIle({ seviyeler }), 'carpan').satir);
  });

  test('Kullanılan meslek silinince araçlar ilk mesleğe döner. Hiçbir araç bozuk değer göstermez.', async ({ page }) => {
    await ac(page, 'katalog');
    await page.getByRole('button', { name: 'Meslek ekle', exact: true }).click();
    await expect.poll(async () => sutunlar(await tabloOku(page, 'katalog-meslek'), [0, 1, 2])).toEqual([...V.ortak.meslekler.map((ms) => [ms.ad, num(ms.katsayi), int(ms.uzmanliklar.length)]), ['Yeni meslek', num(1.2), '1']]);

    // Yazılım mesleğini taban ücret, terfi, toplam ödül ve iki pozisyon kullanır.
    await ikiAdim(page.locator('[aria-labelledby="katalog-meslek-tablo"]'), 'Sil Yazılım', 'Sil: Yazılım (onayla)');
    const meslekler = V.ortak.meslekler.filter((ms) => ms.id !== 'yazilim');
    await expect.poll(async () => (await tabloOku(page, 'katalog-meslek')).map((r) => r[0])).toEqual([...meslekler.map((ms) => ms.ad), 'Yeni meslek']);
    const ortak = ortakIle({ meslekler: [...meslekler, { id: 'yeni', ad: 'Yeni meslek', katsayi: 1.2, uzmanliklar: [{ id: 'genel', ad: 'Genel', carpan: 1 }] }] });

    await git(page, 'taban-ucret');
    const z = zincirBekle(V.zincir, ortak);
    await expect.poll(async () => (await ozetOku(page, 'taban-ucret')).deger).toEqual(z.ozet);
    await expect.poll(async () => tabloOku(page, 'zincir')).toEqual(z.satir);
    await expect(page.getByRole('combobox', { name: 'Meslek', exact: true })).toHaveValue(meslekler[0].ad);

    await git(page, 'toplam-odul');
    await expect.poll(async () => sutunlar(await tabloOku(page, 'odul'), [0, 2, 3, 4, 5, 6, 7])).toEqual(odulBekle(V.odul, ortak));

    await hepsiniTara(page);
  });

  test('Seviyeler en aza inince bütün araçlar çizilir. Denetim ve terfi eksik seviyeyi söyler.', async ({ page }) => {
    await ac(page, 'katalog');
    const yonetici = page.getByRole('button', { name: 'Son yönetici seviyesini sil', exact: true });
    for (let i = 0; i < 4; i++) await ikiAdim(page, 'Son yönetici seviyesini sil');
    await expect(yonetici).toBeDisabled();
    for (let i = 0; i < 5; i++) await ikiAdim(page, 'Son uzman seviyesini sil');
    await expect(page.getByRole('button', { name: 'Son uzman seviyesini sil', exact: true })).toBeDisabled();
    const seviyeler = V.ortak.seviyeler.slice(0, 1);
    await expect.poll(async () => (await tabloOku(page, 'katalog-seviye')).map((r) => r[0])).toEqual(['P1']);
    const ortak = ortakIle({ seviyeSeti: 'ozel', seviyeler });

    await git(page, 'yapi-denetimi');
    const d = denetimBekle(ortak, V.kademe);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'denetim'), [0, 1, 2])).toEqual(d.satir);

    // Terfi aracı P2 yerine P1 seviyesini kullanır. Üst seviye kalmadığı için hedef yoktur.
    await git(page, 'terfi-kapisi');
    const t = terfiBekle(V.terfi, ortak, V.kademe);
    expect(t.ozet).toEqual(['Son seviye', 'Uygulanmıyor', 'Uygulanmıyor']);
    await expect.poll(async () => (await ozetOku(page, 'terfi-kapisi')).deger.slice(1)).toEqual(t.ozet);
    await expect(page.locator('[aria-labelledby="terfi-yerlesim-tablo"]')).toHaveCount(0);

    await git(page, 'taban-ucret');
    const z = zincirBekle(V.zincir, ortak);
    await expect.poll(async () => (await ozetOku(page, 'taban-ucret')).deger).toEqual(z.ozet);

    await hepsiniTara(page);
  });

  test('Uzmanlık silinince taban ücret ilk uzmanlığı kullanır.', async ({ page }) => {
    await ac(page, 'katalog');
    const yazilim = meslekBul(V.ortak.meslekler, 'yazilim');
    await page.getByRole('button', { name: 'Uzmanlık ekle', exact: true }).click();
    const p2 = seviyeBul(V.ortak.seviyeler, 'P2');
    const yeni = { id: 'yeni', ad: 'Yeni uzmanlık', carpan: 1 };
    await expect
      .poll(async () => sutunlar(await tabloOku(page, 'katalog-uzmanlik'), [0, 1, 2]))
      .toEqual([...yazilim.uzmanliklar, yeni].map((u) => [u.ad, num(u.carpan), para(hucreCarpani(yazilim, u, p2))]));

    // Taban ücret zinciri varsayılanda full stack uzmanlığını kullanır.
    const fullstack = uzmanlikBul(yazilim, 'fullstack')!;
    await ikiAdim(page.locator('[aria-labelledby="katalog-uzmanlik-tablo"]'), `Sil ${fullstack.ad}`, `Sil: ${fullstack.ad} (onayla)`);
    const uzmanliklar = [...yazilim.uzmanliklar.filter((u) => u.id !== 'fullstack'), yeni];
    await expect.poll(async () => (await tabloOku(page, 'katalog-uzmanlik')).map((r) => r[0])).toEqual(uzmanliklar.map((u) => u.ad));

    await git(page, 'taban-ucret');
    const ortak = ortakIle({ meslekler: V.ortak.meslekler.map((ms) => (ms.id === 'yazilim' ? { ...ms, uzmanliklar } : ms)) });
    const z = zincirBekle(V.zincir, ortak);
    expect(z.satir[3]).toEqual(['Uzmanlık çarpanı', yazilim.uzmanliklar[0].ad, times(1), z.satir[3][3], z.satir[3][4]]);
    await expect.poll(async () => tabloOku(page, 'zincir')).toEqual(z.satir);
    await expect.poll(async () => (await ozetOku(page, 'taban-ucret')).deger).toEqual(z.ozet);
  });

  test('Yeni pozisyonun puanı, derecesi ve orta noktası hesaplanır. Silinince tablo eski haline döner.', async ({ page }) => {
    await ac(page, 'is-degerleme');
    await page.getByRole('button', { name: 'Pozisyon ekle', exact: true }).click();
    const d = { ...V.degerleme, pozisyonlar: [...V.degerleme.pozisyonlar, { id: 'yeni', ad: 'Yeni pozisyon', meslekId: V.ortak.meslekler[0].id, puan: V.degerleme.faktorler.map(() => 3) }] };
    const beklenen = pozisyonBekle(d, V.kademe, V.ortak.meslekler);
    expect(beklenen[8].slice(1, 3)).toEqual(['3', 'G5']);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'pozisyon'), [0, 6, 7, 8, 9, 10])).toEqual(beklenen);

    await ikiAdim(page, 'Son pozisyonu sil');
    await expect.poll(async () => sutunlar(await tabloOku(page, 'pozisyon'), [0, 6, 7, 8, 9, 10])).toEqual(pozisyonBekle(V.degerleme, V.kademe, V.ortak.meslekler));
  });

  test('Prim havuzuna kişi eklenince ve silinince toplamlar yenilenir.', async ({ page }) => {
    await ac(page, 'prim-havuzu');
    await page.getByRole('button', { name: 'Kişi ekle', exact: true }).click();
    const ek = { ...V.ekip, kisiler: [...V.ekip.kisiler, { id: 'yeni', ad: 'Kişi G', ucret: 2, takim: V.ekip.kisiler[0].takim, skor: 100 }] };
    let b = ekipBekle(ek);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'prim-kisi'), [0, 2, 4, 5, 6])).toEqual(b.satir.map((r, i) => [r[0], ek.kisiler[i].takim, ...r.slice(1)]));
    await expect.poll(async () => (await ozetOku(page, 'prim-havuzu')).deger).toEqual(b.ozet);

    await ikiAdim(page, 'Son kişiyi sil');
    b = ekipBekle(V.ekip);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'prim-kisi'), [0, 4, 5, 6])).toEqual(b.satir);
    await expect.poll(async () => (await ozetOku(page, 'prim-havuzu')).deger).toEqual(b.ozet);
  });

  test('Sprint eklenince ve silinince skor, ortalama ve şişme işareti yenilenir.', async ({ page }) => {
    await ac(page, 'sprint-skoru');
    const bekle = (sprintler: AppletDurum['sprint']['sprintler']) => {
      const seri = sprintSerisi(sprintler, V.sprint.ayar);
      const son = seri[seri.length - 1];
      return {
        ozet: [bir(son.skor), bir(son.kayan), int(seri.filter((r) => r.sisme).length)],
        satir: seri.map((r) => [r.sprint.ad, bir(r.skor), bir(r.kayan), r.spArtis === null || r.akisArtis === null ? 'Uygulanmıyor' : `${isaretli(r.spArtis)} / ${isaretli(r.akisArtis)}`, r.sisme ? 'İncele' : 'Yok']),
      };
    };
    let b = bekle(V.sprint.sprintler);
    // Varsayılan seride en az bir şişme işareti var. O sprintte SP arttı, kabul edilen iş artmadı.
    expect(b.ozet[2]).not.toBe('0');
    await expect.poll(async () => (await ozetOku(page, 'sprint-skoru')).deger).toEqual(b.ozet);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'sprint'), [0, 7, 8, 9, 10])).toEqual(b.satir);

    await page.getByRole('button', { name: 'Sprint ekle', exact: true }).click();
    const son = V.sprint.sprintler[V.sprint.sprintler.length - 1];
    b = bekle([...V.sprint.sprintler, { ...son, id: 'yeni', ad: `Sprint ${V.sprint.sprintler.length + 1}` }]);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'sprint'), [0, 7, 8, 9, 10])).toEqual(b.satir);
    await expect.poll(async () => (await ozetOku(page, 'sprint-skoru')).deger).toEqual(b.ozet);

    await ikiAdim(page, 'Son sprinti sil');
    b = bekle(V.sprint.sprintler);
    await expect.poll(async () => sutunlar(await tabloOku(page, 'sprint'), [0, 7, 8, 9, 10])).toEqual(b.satir);
  });

  test('GS bekleme düğmesi elle yapılan bekleme ve performans değişikliğini geri alır.', async ({ page }) => {
    await ac(page, 'kademe-adimlari');
    const ozetBekle = (bekleme: number[], hizli: boolean[]) => {
      const satirlar = kademeAdimlari({ ...V.adim, bekleme, hizli });
      const son = satirlar[satirlar.length - 1];
      return [`${num(Math.round((son.ay / 12) * 10) / 10)} yıl`, pct(son.carpan - 1), para(V.adim.baslangic * son.carpan)];
    };
    await expect.poll(async () => (await ozetOku(page, 'kademe-adimlari')).deger).toEqual(ozetBekle(GS_BEKLEME, GS_BEKLEME.map(() => false)));

    await yaz(page.getByRole('textbox', { name: '3. kademe bekleme süresi (ay)' }), '30');
    await page.getByRole('checkbox', { name: '5. kademe: bekleme yok' }).check();
    const bekleme = GS_BEKLEME.map((x, i) => (i === 1 ? 30 : x));
    const hizli = GS_BEKLEME.map((_, i) => i === 3);
    await expect.poll(async () => (await ozetOku(page, 'kademe-adimlari')).deger).toEqual(ozetBekle(bekleme, hizli));
    expect(await kayit(page)).not.toBeNull();

    await page.getByRole('button', { name: 'GS bekleme sürelerine dön', exact: true }).click();
    await expect.poll(async () => (await ozetOku(page, 'kademe-adimlari')).deger).toEqual(ozetBekle(GS_BEKLEME, GS_BEKLEME.map(() => false)));
    await expect(page.getByRole('textbox', { name: '3. kademe bekleme süresi (ay)' })).toHaveValue(`${GS_BEKLEME[1]} ay`);
    await expect(page.getByRole('checkbox', { name: '5. kademe: bekleme yok' })).not.toBeChecked();
    // Değerler örnekle aynı olunca kayıt silinir.
    await expect.poll(() => kayit(page)).toBeNull();
  });
});

/* ---------- 4. Kayıtlı değerler (turksab-applet anahtarı) ---------- */

test.describe('Kayıtlı değerler', () => {
  test('Başka sürümle yazılmış kayıt okunmaz. Sayfa örnek değerleri kullanır.', async ({ page }) => {
    const d = { ortak: { ...V.ortak, meslekler: katsayiIle('yazilim', 2) } };
    await kayitla(page, JSON.stringify({ v: 2, d }), 'katalog');
    await expect(page.getByRole('textbox', { name: 'Yazılım katsayısı' })).toHaveValue('1,8');
    await expect(page.getByRole('button', { name: 'Örnek değerlere dön' })).toBeDisabled();

    // Aynı içerik doğru sürümle yazılırsa okunur.
    await kayitla(page, JSON.stringify({ v: 1, d }), 'katalog');
    await expect(page.getByRole('textbox', { name: 'Yazılım katsayısı' })).toHaveValue('2');
    await expect(page.getByRole('button', { name: 'Örnek değerlere dön' })).toBeEnabled();
  });

  test('Bozuk alan yalnız kendi yerinde örnek değere döner. Geçerli değerler korunur.', async ({ page }) => {
    const ham = JSON.stringify({
      v: 1,
      d: {
        kademe: { k1: 'bozuk', oran: 0.15, adet: 6 },
        zam: { ucret: null, orta: 2.5 },
        merit: [1, 2, 3],
        karne: { sablonId: 'satis', kritikOlay: 'evet' },
        egri: { skor: 'SONSUZ', kaliteGecti: false },
        bilinmeyen: { x: 1 },
      },
    }).replace('"SONSUZ"', '1e999'); // JSON.parse, 1e999 değerini sonsuz sayı olarak okur.
    await kayitla(page, ham, 'kademe-serisi');

    // Kademe dilimi: k1 bozuk olduğu için 1,2 olur. Oran ve derece sayısı kayıttan gelir.
    const k = { ...V.kademe, oran: 0.15, adet: 6 };
    await expect.poll(async () => sutunlar(await tabloOku(page, 'kademe'), [0, 1, 2, 3, 4, 5, 6])).toEqual(kademeBekle(k).satir);
    await expect(page.getByRole('textbox', { name: 'İlk derece (G1) orta noktası' })).toHaveValue('1,2 × baz');

    // Zam dilimi: ücret bozuk olduğu için 2,05 olur. Orta nokta 2,5 kayıttan gelir.
    // Merit dilimi dizi olarak yazıldı. Bu yüzden merit dilimi bütünüyle örnek değerdedir.
    await git(page, 'yillik-zam');
    const z = zamBekle({ ...V.zam, orta: 2.5 }, V.merit.matris);
    await expect.poll(async () => (await ozetOku(page, 'yillik-zam')).deger).toEqual(z.ozet);
    await git(page, 'liyakat-matrisi');
    await expect.poll(async () => (await ozetOku(page, 'liyakat-matrisi')).deger).toEqual(meritBekle(V.merit).ozet);

    // Karne dilimi: şablon kayıttan gelir. Kritik olay bozuk olduğu için kapalı kalır.
    await git(page, 'performans-karnesi');
    await expect(page.getByRole('group', { name: 'Meslek şablonu' }).getByRole('button', { name: KARNE_SABLONLARI.find((s) => s.id === 'satis')!.ad })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('switch', { name: 'Kritik olay var' })).toHaveAttribute('aria-checked', 'false');
    await expect.poll(async () => (await ozetOku(page, 'performans-karnesi')).deger.slice(0, 2)).toEqual(karneBekle('satis').ozet);

    // Eğri dilimi: sonsuz skor yerine 112 gelir. Kalite kapısının kayıtlı değeri (false) korunur.
    await git(page, 'prim-egrisi');
    await expect(page.getByRole('textbox', { name: 'Bu dönemin skoru' })).toHaveValue(String(V.egri.skor));
    await expect(page.getByRole('switch', { name: 'Kalite kapısından geçti' })).toHaveAttribute('aria-checked', 'false');

    // Örnekten farklı dört dilim var: kademe, zam, karne ve eğri. Sıfırlama onayı bu sayıyı söyler.
    const don = page.locator('.param-toolbar').getByRole('button', { name: 'Örnek değerlere dön' });
    await don.click();
    await expect(page.locator('.param-toolbar').getByRole('button', { name: /^4 .*\(onayla\)$/ })).toBeVisible();
    await page.locator('.param-toolbar').getByRole('button', { name: 'Vazgeç' }).click();
  });

  test('Kayıt bir aracı bozarsa uyarı çıkar. Sıfırlama iki adımda kaydı siler.', async ({ page }) => {
    // Meslek listesi dizi olduğu için okunur. Ama meslekte uzmanlık listesi yok. Bu yüzden katalog çizilemez.
    await kayitla(page, JSON.stringify({ v: 1, d: { ortak: { meslekler: [{ id: 'x', ad: 'X' }] } } }), '');
    const uyari = page.locator('.applet-panel').getByRole('complementary', { name: /çizilemedi/ });
    await expect(uyari).toBeVisible();
    await expect(page.locator('section#katalog')).toHaveCount(0);
    // Sayfa boş kalmaz. Menü çalışır ve mesleği kullanmayan araç çizilir.
    await git(page, 'kademe-serisi');
    await expect(uyari).toHaveCount(0);
    await page.getByRole('navigation', { name: 'Hesap araçları' }).getByRole('link', { name: adOf('katalog'), exact: true }).click();
    await expect(uyari).toBeVisible();

    const sifirla = uyari.locator('.applet-eylem').first();
    await sifirla.click();
    await expect(uyari.getByRole('button', { name: /\(onayla\)$/ })).toBeVisible();
    await expect(uyari.getByRole('button', { name: 'Vazgeç' })).toBeVisible();
    // İlk basış kaydı silmez.
    expect(await kayit(page)).not.toBeNull();
    await uyari.getByRole('button', { name: /\(onayla\)$/ }).click();

    await expect(page.locator('section#katalog')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Yazılım katsayısı' })).toHaveValue('1,8');
    await expect.poll(() => kayit(page)).toBeNull();
    await page.reload();
    await hydrated(page);
    await expect(page.locator('section#katalog')).toBeVisible();
  });

  test('Depolama kapalıysa durum satırı bunu söyler. Değer yalnız sayfa açıkken kullanılır.', async ({ page }) => {
    await page.addInitScript((anahtar) => {
      const asil = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (k === anahtar) throw new DOMException('Depolama kapalı', 'QuotaExceededError');
        return asil.call(this, k, v);
      };
    }, APPLET_KEY);
    await ac(page, 'katalog');
    await yaz(page.getByRole('textbox', { name: 'Yazılım katsayısı' }), '2');
    await expect(page.locator('.param-toolbar').getByRole('status')).toContainText('depolaması kapalı');
    await git(page, 'rutbe-matrisi');
    const ortak = ortakIle({ meslekler: katsayiIle('yazilim', 2) });
    await expect.poll(async () => tabloOku(page, 'rutbe')).toEqual(rutbeBekle(ortak, 'carpan').satir);

    await page.reload();
    await hydrated(page);
    await expect.poll(async () => tabloOku(page, 'rutbe')).toEqual(rutbeBekle(V.ortak, 'carpan').satir);
  });

  test('Başka sekmedeki değişiklik ve sıfırlama bu sekmeye yansır.', async ({ page }) => {
    await ac(page, 'rutbe-matrisi');
    const ikinci = await page.context().newPage();
    await ac(ikinci, 'katalog');
    await yaz(ikinci.getByRole('textbox', { name: 'Yazılım katsayısı' }), '2');
    await expect.poll(async () => tabloOku(page, 'rutbe')).toEqual(rutbeBekle(ortakIle({ meslekler: katsayiIle('yazilim', 2) }), 'carpan').satir);

    const arac = page.locator('.param-toolbar');
    await arac.getByRole('button', { name: 'Örnek değerlere dön', exact: true }).click();
    await arac.getByRole('button', { name: /\(onayla\)$/ }).click();
    await expect(ikinci.getByRole('textbox', { name: 'Yazılım katsayısı' })).toHaveValue('1,8');
    await ikinci.close();
  });
});

/* ---------- 5. Görünüm, baz birim, boş ad ve geçersiz adres ---------- */

test.describe('Görünüm ve birim', () => {
  test('Rütbe matrisinde tutar görünümü baz birimi ve para birimini kullanır.', async ({ page }) => {
    await ac(page, 'rutbe-matrisi');
    let b = rutbeBekle(V.ortak, 'carpan');
    await expect.poll(async () => tabloOku(page, 'rutbe')).toEqual(b.satir);
    await expect.poll(async () => (await ozetOku(page, 'rutbe-matrisi')).deger).toEqual(b.ozet);
    await expect.poll(async () => (await ozetOku(page, 'rutbe-matrisi')).not.slice(0, 2)).toEqual(b.not);

    const tutarDugmesi = page.getByRole('group', { name: 'Görünüm' }).getByRole('button', { name: 'Aylık tutar' });
    await tutarDugmesi.click();
    await expect(tutarDugmesi).toHaveAttribute('aria-pressed', 'true');
    b = rutbeBekle(V.ortak, 'tutar');
    await expect.poll(async () => tabloOku(page, 'rutbe')).toEqual(b.satir);
    await expect.poll(async () => (await ozetOku(page, 'rutbe-matrisi')).deger).toEqual(b.ozet);
    await expect.poll(async () => (await ozetOku(page, 'rutbe-matrisi')).not.slice(0, 2)).toEqual(b.not);

    // Özel birimin varsayılan değeri 1.000 €’dur.
    await git(page, 'katalog');
    await page.getByRole('combobox', { name: 'Baz birim' }).click();
    await page.getByRole('option', { name: 'Özel birim' }).click();
    await expect.poll(async () => (await ozetOku(page, 'katalog')).deger[0]).toBe(`${int(V.ortak.ozelTutar)} ${V.ortak.paraBirimi}`);
    await git(page, 'rutbe-matrisi');
    await expect.poll(async () => tabloOku(page, 'rutbe')).toEqual(rutbeBekle(V.ortak, 'tutar', V.ortak.ozelTutar, V.ortak.paraBirimi).satir);

    // Birim küçükse (2,50 $) 100’ün altındaki tutarlar kuruşlu yazılır.
    await git(page, 'katalog');
    await yaz(page.getByRole('textbox', { name: 'Özel birim tutarı' }), '2,5');
    await page.getByRole('combobox', { name: 'Para birimi' }).click();
    await page.getByRole('option', { name: 'Dolar ($)' }).click();
    await expect.poll(async () => (await ozetOku(page, 'katalog')).deger[0]).toBe(`${KURUSLU.format(2.5)} $`);
    await git(page, 'rutbe-matrisi');
    b = rutbeBekle(V.ortak, 'tutar', 2.5, '$');
    expect(b.satir[0][2]).toMatch(/^\d+,\d\d \$$/);
    await expect.poll(async () => tabloOku(page, 'rutbe')).toEqual(b.satir);
    await expect.poll(async () => (await ozetOku(page, 'rutbe-matrisi')).deger).toEqual(b.ozet);

    // Baz katı görünümüne dönülünce birim tabloyu etkilemez.
    await page.getByRole('group', { name: 'Görünüm' }).getByRole('button', { name: 'Baz birim katı' }).click();
    await expect.poll(async () => tabloOku(page, 'rutbe')).toEqual(rutbeBekle(V.ortak, 'carpan').satir);
  });
});

test.describe('Boş ad ve geçersiz adres', () => {
  test('Ad boş bırakılırsa önceki ad geri gelir ve uyarı çıkar. Kayıt değişmez.', async ({ page }) => {
    await ac(page, 'katalog');
    const ad = page.getByRole('textbox', { name: '1. meslek adı' });
    for (const bos of ['', '   ']) {
      await ad.fill(bos);
      await ad.blur();
      await expect(ad).toHaveValue('Yazılım');
      await expect(page.locator('#katalog').getByRole('status').filter({ hasText: 'Ad boş bırakılamaz' })).toBeVisible();
    }
    expect(await kayit(page)).toBeNull();
    await expect(page.getByRole('button', { name: 'Örnek değerlere dön' })).toBeDisabled();

    // Takım adı da boş kalmaz. Takım sonucu alanı yerinde kalır.
    await git(page, 'prim-havuzu');
    const takim = page.getByRole('textbox', { name: 'Kişi A takımı' });
    await takim.fill('');
    await takim.blur();
    await expect(takim).toHaveValue('Ürün');
    await expect(page.getByRole('textbox', { name: 'Ürün takım sonucu' })).toBeVisible();
    await expect.poll(async () => sutunlar(await tabloOku(page, 'prim-kisi'), [0, 4, 5, 6])).toEqual(ekipBekle(V.ekip).satir);
  });

  test('Geçersiz adres kataloğu açar. Sonradan geçersiz adrese geçmek aracı değiştirmez.', async ({ page }) => {
    await page.goto('applet/#xyz');
    await icerik(page);
    await hydrated(page);
    await expect(page.locator('section.section')).toHaveCount(1);
    await expect(page.locator('section#katalog')).toBeVisible();
    const menu = page.getByRole('navigation', { name: 'Hesap araçları' });
    await expect(menu.getByRole('link', { name: adOf('katalog'), exact: true })).toHaveAttribute('aria-current', 'true');

    await page.evaluate(() => {
      window.location.hash = 'prim-egrisi';
    });
    await expect(page.locator('section#prim-egrisi')).toBeVisible();
    await page.evaluate(() => {
      window.location.hash = 'boyle-bir-arac-yok';
    });
    await expect(page).toHaveURL(/#boyle-bir-arac-yok$/);
    await expect(page.locator('section#prim-egrisi')).toBeVisible();
    await expect(page.locator('section.section')).toHaveCount(1);
    await expect(menu.getByRole('link', { name: adOf('prim-egrisi'), exact: true })).toHaveAttribute('aria-current', 'true');
  });
});
