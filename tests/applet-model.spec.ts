import { expect, test } from '@playwright/test';
import {
  APPLETLER,
  EGRI_ONAYARLARI,
  SEVIYE_SETLERI,
  VARSAYILAN,
  hayKumeleri,
  hucreCarpani,
  ilerlemeIcin,
  isPuani,
  derece,
  kademeAdimlari,
  kademeSerisi,
  karPaylasimi,
  karneSkoru,
  kbfOrani,
  bolge,
  meritDagit,
  meslekBul,
  ortusme,
  primHavuzu,
  primOrani,
  seviyeBul,
  sprintSerisi,
  tabanZinciri,
  terfiKapisi,
  terfiYerlesimi,
  toplamOdul,
  uzmanlikBul,
  yapiDenetimi,
  yayilim,
  yillikZam,
  type KarneBoyut,
} from '../src/data/applet';

const V = VARSAYILAN;
const yazilim = meslekBul(V.ortak.meslekler, 'yazilim');
const p = (kod: string) => seviyeBul(V.ortak.seviyeler, kod);

test.describe('applet modelleri (saf hesap)', () => {
  test('dizin: 17 applet, kimlikler tekil', () => {
    expect(APPLETLER).toHaveLength(17);
    expect(new Set(APPLETLER.map((a) => a.id)).size).toBe(17);
  });

  test('rütbe hücresi = meslek × seviye × uzmanlık', () => {
    expect(hucreCarpani(yazilim, uzmanlikBul(yazilim, 'backend'), p('P3'))).toBeCloseTo(1.8 * 1.22, 10);
    expect(hucreCarpani(yazilim, uzmanlikBul(yazilim, 'fullstack'), p('P2'))).toBeCloseTo(1.8 * 1.12, 10);
  });

  test('kademe serisi: geometrik orta nokta, band genişliği ve örtüşme formülü tutarlı', () => {
    const satirlar = kademeSerisi({ k1: 1.2, artim: 0.25, oran: 0.2, adet: 9, yariGenislik: 0.2 });
    expect(satirlar).toHaveLength(9);
    expect(satirlar[1].geometrik).toBeCloseTo(1.44, 10);
    expect(satirlar[1].aritArtis).toBeCloseTo(0.25 / 1.2, 10);
    expect(yayilim(0.2)).toBeCloseTo(0.5, 10);
    expect(satirlar[0].ortusme).toBeCloseTo(ortusme(0.2, 0.2), 10);
    expect(ortusme(0.2, 0.25)).toBeCloseTo(0.5, 10);
    expect(ilerlemeIcin(0.2, 0.5)).toBeCloseTo(0.25, 10);
    expect(satirlar[8].ortusme).toBeNull();
  });

  test('iş değerleme: ağırlıklı puan, derece ve Hay %15 kuralı', () => {
    const [kidemli, lider] = V.degerleme.pozisyonlar;
    expect(isPuani(V.degerleme.faktorler, kidemli.puan)).toBeCloseTo(3.4, 10);
    expect(derece(V.degerleme.esikler, 3.4)).toBe(6);
    expect(derece(V.degerleme.esikler, isPuani(V.degerleme.faktorler, lider.puan))).toBe(7);
    expect(derece(V.degerleme.esikler, 1)).toBe(1);
    expect([...hayKumeleri([{ id: 'a', puan: 340 }, { id: 'b', puan: 300 }, { id: 'c', puan: 200 }])]).toEqual(['a', 'b']);
  });

  test('taban ücret zinciri: lokasyon alt sınırı, insana öde ve taban sınırı', () => {
    const g = { baz: 1000, meslek: yazilim, uzmanlik: uzmanlikBul(yazilim, 'backend'), seviye: p('P2'), lokasyon: { id: 'x', ad: 'X', carpan: 0.5 }, lokasyonTaban: 0.7, insanaOde: false, sozlesme: V.ortak.sozlesmeler[1], bandKonumu: 1, tabanCarpani: 1 };
    expect(tabanZinciri(g).sonuc).toBeCloseTo(1000 * 1.8 * 0.7 * 1.15, 6);
    expect(tabanZinciri({ ...g, insanaOde: true }).sonuc).toBeCloseTo(1000 * 1.8 * 1.15, 6);
    const dusuk = tabanZinciri({ ...g, tabanCarpani: 5 });
    expect(dusuk.tabanUygulandi).toBe(true);
    expect(dusuk.sonuc).toBe(5000);
  });

  test('band içi konum: puan oranı ve compa bölgeleri', () => {
    expect(kbfOrani(V.kbf.kriterler, [80, 60, 70])).toBeCloseTo(0.7, 10);
    expect(kbfOrani(V.kbf.kriterler, [200, 200, 200])).toBe(1);
    expect([0.79, 0.8, 0.9, 1.1, 1.2, 1.21].map(bolge)).toEqual(['yesil', 'ogrenme', 'yetkin', 'yetkin', 'ileri', 'kirmizi']);
  });

  test('liyakat matrisi: bütçeye ölçeklenir; band tavanını aşan zam tek seferlik', () => {
    const s = meritDagit(V.merit);
    expect(s.hamToplam).toBeGreaterThan(s.havuz);
    expect(s.dagitilan).toBeCloseTo(s.havuz, 8);
    const e = s.satirlar.find((r) => r.kisi.ad === 'Kişi E')!;
    expect(e.kalici).toBe(0);
    expect(e.tekSeferlik).toBeCloseTo(e.artis * 12, 8);
    for (const r of s.satirlar) expect(r.yeni).toBeLessThanOrEqual(Math.max(r.tavan, r.kisi.ucret) + 1e-9);
    // Ölçeklenmeyince matris oranı aynen uygulanır.
    const ham = meritDagit({ ...V.merit, olcekle: false });
    expect(ham.olcek).toBe(1);
    expect(ham.dagitilan).toBeCloseTo(ham.hamToplam, 8);
  });

  test('yıllık zam: bileşenler toplamı kalıcı artışa eşit; piyasa düzeltmesi eşiğe kadar', () => {
    const s = yillikZam(V.zam, V.merit.matris);
    const toplam = s.adimlar.reduce((n, a) => n + a.tutar, 0);
    expect(s.yeniUcret).toBeCloseTo(V.zam.ucret + toplam, 10);
    const piyasa = s.adimlar.find((a) => a.id === 'piyasa')!;
    expect(V.zam.ucret + piyasa.tutar).toBeCloseTo(V.zam.orta * 1.05 * V.zam.piyasaEsik, 10);
    expect(s.tekSeferlik).toBe(0);
    const terfi = yillikZam({ ...V.zam, terfi: true }, V.merit.matris);
    expect(terfi.adimlar.find((a) => a.id === 'terfi')!.tutar).toBeGreaterThan(0);
  });

  test('performans karnesi: kalite kapısı skoru 100’de keser, uyum kapısı primi kapatır', () => {
    const boyutlar: KarneBoyut[] = [
      { id: 'a', ad: 'A', agirlik: 50 },
      { id: 'k', ad: 'Kalite', agirlik: 25, kapi: 'kalite' },
      { id: 'u', ad: 'Uyum', agirlik: 25, kapi: 'uyum' },
    ];
    const kalite = karneSkoru(boyutlar, [150, 70, 100], false);
    expect(kalite.ham).toBeCloseTo(117.5, 10);
    expect(kalite.skor).toBe(100);
    expect(kalite.prim).toBe('uygun');
    expect(karneSkoru(boyutlar, [120, 100, 70], false).prim).toBe('yok');
    expect(karneSkoru(boyutlar, [120, 100, 100], true).prim).toBe('inceleme');
    expect(karneSkoru(boyutlar, [120, 120, 120], false).faktor).toBe(1.3);
  });

  test('sprint skoru: story point skora girmez; yalnız 5. sprint şişme olarak işaretlenir', () => {
    const seri = sprintSerisi(V.sprint.sprintler, V.sprint.ayar);
    expect(seri.map((r) => r.sisme)).toEqual([false, false, false, false, true, false]);
    const spsiz = sprintSerisi(V.sprint.sprintler.map((s) => ({ ...s, sp: 1 })), V.sprint.ayar);
    expect(spsiz.map((r) => r.skor)).toEqual(seri.map((r) => r.skor));
    expect(seri[5].skor).toBe(100);
  });

  test('prim eğrisi: eşik, hedef, tavan, kademe ve kalite kapısı', () => {
    const e = EGRI_ONAYARLARI.onerilen.egri;
    expect(primOrani(e, 89.9)).toBe(0);
    expect(primOrani(e, 90)).toBeCloseTo(0.5, 10);
    expect(primOrani(e, 100)).toBeCloseTo(1, 10);
    expect(primOrani(e, 130)).toBeCloseTo(2, 10);
    expect(primOrani(e, 200)).toBe(2);
    expect(e.hedefPrim * e.tavanOdeme).toBeCloseTo(0.3, 10);
    expect(primOrani(e, 120, false)).toBe(0.5);
    const ilk = EGRI_ONAYARLARI.ilk.egri;
    expect(primOrani(ilk, 109)).toBe(0);
    expect(primOrani(ilk, 140) * ilk.hedefPrim).toBeCloseTo(0.3, 10);
    const kademeli = EGRI_ONAYARLARI.kademeli.egri;
    expect(primOrani(kademeli, 119)).toBeCloseTo(primOrani(kademeli, 110), 10);
  });

  test('şirket × takım × birey: birey tavanı ve sabit havuz', () => {
    const s = primHavuzu(V.ekip);
    expect(s.sirket).toBe(1);
    for (const r of s.satirlar) expect(r.birey).toBeLessThanOrEqual(V.ekip.bireyTavan);
    const sabit = primHavuzu({ ...V.ekip, sabitHavuz: true, havuz: 30 });
    expect(sabit.odenen).toBeCloseTo(30, 8);
    expect(primHavuzu({ ...V.ekip, sirketSonuc: 79 }).odenen).toBe(0);
  });

  test('terfi kapısı ve yerleşim', () => {
    const kapi = terfiKapisi(V.terfi, 'IC');
    expect(kapi.karar).toBe('uyari');
    expect(kapi.kosullar.filter((k) => !k.gecti).map((k) => k.ad)).toEqual(['Seviyede en az süre']);
    expect(terfiKapisi({ ...V.terfi, seviyedeAy: 24 }, 'IC').karar).toBe('gecti');
    expect(terfiKapisi({ ...V.terfi, seviyedeAy: 24 }, 'M').karar).toBe('uyari');
    const y = terfiYerlesimi({ ucret: 1, yeniOrta: 2, yariGenislik: 0.2, minArtis: 0.08, maxArtis: 0.2, hedefCompa: 0.9 });
    expect(y.yeni).toBeCloseTo(1.6, 10);
    expect(y.not).toContain('band en azı');
  });

  test('kademe adımları: GS bekleme süreleri 18 yıl, toplam ≈ %30', () => {
    const s = kademeAdimlari(V.adim);
    expect(s[s.length - 1].ay).toBe(216);
    expect(s[s.length - 1].carpan).toBeCloseTo(1 + 0.0333 * 9, 10);
    const hizli = kademeAdimlari({ ...V.adim, hizli: V.adim.hizli.map((_, i) => i === 8) });
    expect(hizli[hizli.length - 1].ay).toBe(180);
  });

  test('kâr paylaşımı: kıdem şartı, tavan ve yeniden dağıtım', () => {
    const havuz = V.kar.kar * V.kar.havuzOrani;
    const s = karPaylasimi({ ...V.kar, havuz });
    expect(s.satirlar.filter((r) => r.uygun).map((r) => r.kisi.ad)).toEqual(['Kişi A', 'Kişi C', 'Kişi D', 'Kişi F']);
    expect(s.dagitilan).toBeCloseTo(havuz, 8);
    const dar = karPaylasimi({ ...V.kar, havuz, tavan: 0.05 });
    for (const r of dar.satirlar.filter((x) => x.uygun)) expect(r.pay).toBeCloseTo(r.kisi.ucret * 12 * 0.05, 8);
    expect(dar.kalan).toBeCloseTo(havuz - dar.dagitilan, 8);
    // Eşit dağıtımda en düşük tabanlı kişi tavana takılır; fazlası diğerlerine gider.
    const tek = karPaylasimi({ ...V.kar, havuz, tavan: 0.12, yontem: 'esit' });
    expect(tek.dagitilan).toBeCloseTo(havuz, 8);
    expect(tek.satirlar.filter((r) => r.tavanda).map((r) => r.kisi.ad)).toEqual(['Kişi C']);
  });

  test('yapı denetimi: varsayılan model kalmaz; ilk model seviye sıçramasında kalır', () => {
    const varsayilan = yapiDenetimi({ meslekler: V.ortak.meslekler, seviyeler: V.ortak.seviyeler, kademe: V.kademe, tabanCarpani: V.ortak.tabanCarpani });
    expect(varsayilan.filter((k) => k.durum === 'kaldi')).toEqual([]);
    const ilk = yapiDenetimi({ meslekler: V.ortak.meslekler, seviyeler: SEVIYE_SETLERI.ilk.seviyeler, kademe: V.kademe, tabanCarpani: V.ortak.tabanCarpani });
    const durum = (ad: string) => ilk.find((k) => k.ad.startsWith(ad))?.durum;
    expect(durum('Uzman hattında en büyük seviye sıçraması')).toBe('kaldi');
    expect(durum('Girişten kıdemliye')).toBe('kaldi');
  });

  test('sıfır girdiler NaN veya sonsuz üretmez', () => {
    const sonlu = (v: number) => expect(Number.isFinite(v), String(v)).toBe(true);
    const z = tabanZinciri({ baz: 0, meslek: yazilim, uzmanlik: undefined, seviye: p('P2'), lokasyon: V.ortak.lokasyonlar[0], lokasyonTaban: 0.7, insanaOde: false, sozlesme: V.ortak.sozlesmeler[0], bandKonumu: 1, tabanCarpani: 1 });
    sonlu(z.carpan);
    const zam = yillikZam({ ...V.zam, orta: 0, ucret: 0 }, V.merit.matris);
    for (const a of zam.adimlar) sonlu(a.tutar);
    sonlu(zam.compa);
    sonlu(zam.artis);
    const y = terfiYerlesimi({ ucret: 0, yeniOrta: 0, yariGenislik: 0.2, minArtis: 0.08, maxArtis: 0.2, hedefCompa: 0.9 });
    sonlu(y.compa);
    sonlu(y.artis);
    const kar = karPaylasimi({ kisiler: [{ id: 'a', ad: 'A', ucret: 0, kidem: 5 }], havuz: 10, kidemSarti: 0, yontem: 'esit', tavan: 0.5 });
    for (const r of kar.satirlar) sonlu(r.tabanOrani);
    for (const r of kademeSerisi({ k1: 0, artim: 0, oran: 0.2, adet: 3, yariGenislik: 0.2 })) expect(r.aritArtis).toBeNull();
  });

  test('toplam hedef nakit: taban ÷ (1 − değişken payı)', () => {
    const s = toplamOdul({ meslek: yazilim, uzmanlik: uzmanlikBul(yazilim, 'backend'), seviyeler: V.ortak.seviyeler, karisim: { P2: 15 }, egitim: 0, ekipman: 0, saglik: 0 });
    const p2 = s.find((r) => r.seviye.kod === 'P2')!;
    expect(p2.ttc).toBeCloseTo((1.8 * 12) / 0.85, 10);
    expect(p2.yillik / p2.ttc).toBeCloseTo(0.85, 10);
  });
});
