/**
 * Sunum: 16:9, 10 slayt. Metinler düzenlenebilir gerçek metindir. Grafikler PowerPoint şekilleridir.
 * Bütün metnin yazı tipi Arial'dir. Outfit PPTX'e gömülemiyor. Outfit'i olmayan görüntüleyici Times'a düşüyordu.
 * Yerleşim tek bir veri modelinde tutulur. Aynı model hem PPTX dosyasını hem önizleme HTML'ini üretir.
 * Ölçüler inçtir. Yazı boyutları pt'dir. 1920 px genişlikte 1 inç 144 px, 1 pt 2 px eder.
 */
import { createRequire } from 'node:module';
import { TOKENS, metinDuzelt } from './ortak.mjs';
import { M, TARIH, PAKETLER, OLCEK, ORNEK, ISVEREN_SAYISI, basamaklar, tl, yuzde } from '../icerik.mjs';

const require = createRequire(import.meta.url);
const PptxGenJS = require('pptxgenjs');

const R = TOKENS.renk;
const S = TOKENS.sunum;
const W = S.genislik, H = S.yukseklik, K = S.kenar;
const FONT = S.yazi;

/* ---------- Yerleşim yardımcıları ---------- */
const metin = (x, y, w, h, yazi, o = {}) => ({ tur: 'metin', x, y, w, h, yazi, boyut: o.boyut ?? S.govde, kalin: o.kalin ?? false, renk: o.renk ?? R.murekkep, hiza: o.hiza ?? 'left', dikey: o.dikey ?? 'top', satir: o.satir ?? 1.15, paraAra: o.paraAra ?? 0, harf: o.harf ?? 0, buyuk: o.buyuk ?? false });
const kutu = (x, y, w, h, renk, o = {}) => ({ tur: 'kutu', x, y, w, h, renk, kose: o.kose ?? 0 });
const daire = (x, y, d, renk) => ({ tur: 'daire', x, y, w: d, h: d, renk });
const cizgi = (x, y, w, h, renk, kalinlik = 1.5) => ({ tur: 'cizgi', x, y, w, h, renk, kalinlik });

function markaYazisi(x, y, boyut, renk) {
  // Marka adı tipografiyle yazılır. Sondaki nokta yeşildir. Logo dosyası kullanılmaz.
  // Nokta metnin parçasıdır. Böylece yedek yazı tipinde de adın hemen yanında kalır.
  return [{ ...metin(x, y, boyut / 72 * 4.6, boyut / 72 * 1.5, 'Segika', { boyut, kalin: true, renk, satir: 1 }), nokta: R.yesil }];
}
function ust(yazi, koyu = false) {
  return [...markaYazisi(K, 0.42, 20, koyu ? R.beyaz : R.lacivert),
    metin(W - K - 6, 0.5, 6, 0.3, yazi.toLocaleUpperCase('tr-TR'), { boyut: S.ust, kalin: true, renk: koyu ? R.yesil : R.yesilMetin, hiza: 'right', harf: 1.5 })];
}
function alt(no, koyu = false, sol = 'Segika iş ortaklığı programı') {
  const renk = koyu ? R.griLacivertUstu : R.gri;
  return [metin(K, H - 0.55, 7, 0.3, sol, { boyut: S.kucuk, renk }), metin(W - K - 2, H - 0.55, 2, 0.3, `${no} / 10`, { boyut: S.kucuk, renk, hiza: 'right' })];
}
const kanca = (yazi, y = 1.15, w = 11.5, h = 1.1, renk = R.lacivert, boyut = S.h2) => metin(K, y, w, h, yazi, { boyut, kalin: true, renk, satir: 1.05 });

/* ---------- Slaytlar ---------- */
function s1() {
  const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const seritW = W - 2 * K, adim = seritW / 12, d = 0.42;
  const serit = [cizgi(K + adim / 2, 4.86 + d / 2, seritW - adim, 0, R.cizgiLacivertUstu, 2)];
  aylar.forEach((a, i) => {
    const cx = K + adim * i + adim / 2;
    serit.push(daire(cx - d / 2, 4.86, d, R.yesil));
    serit.push(metin(cx - adim / 2, 4.86 + d + 0.08, adim, 0.3, a, { boyut: S.kucuk, renk: R.griLacivertUstu, hiza: 'center' }));
  });
  return { zemin: R.lacivert, koyu: true, ogeler: [
    ...ust('İş ortaklığı programı', true),
    metin(K, 1.25, 10.6, 2.2, 'Müşteriniz size her ay aynı soruyu soruyor mu?', { boyut: 50, kalin: true, renk: R.beyaz, satir: 1.0 }),
    metin(K, 3.35, 11, 0.6, '“Bu yeni çalışan için teşvik alabilir miyiz?”', { boyut: 26, kalin: true, renk: R.yesil }),
    ...serit,
    metin(K, 6.2, 8.2, 0.45, M.kapak.davet, { boyut: 21, kalin: true, renk: R.beyaz }),
    metin(K, 6.62, 8.2, 0.4, M.kapak.kitle, { boyut: S.govde, renk: R.griLacivertUstu }),
    metin(W - K - 3.6, 6.62, 3.6, 0.4, TARIH, { boyut: S.kucuk, renk: R.griLacivertUstu, hiza: 'right' }),
  ] };
}

function s2() {
  const o = [];
  OLCEK.forEach((x, i) => {
    const y = 1.35 + i * 1.6;
    if (i) o.push(cizgi(6.55, y - 0.2, W - K - 6.55, 0, R.cizgi, 1));
    o.push(metin(6.55, y, 3.3, 1.0, x.sayi, { boyut: 40, kalin: true, renk: i === 0 ? R.yesilMetin : R.lacivert, dikey: 'middle' }));
    o.push(metin(9.9, y, W - K - 9.9, 1.0, x.metin, { boyut: S.govde, dikey: 'middle', satir: 1.1 }));
  });
  return { ogeler: [
    ...ust('02  Neden siz'),
    kanca('Müşterinizi siz tanıyorsunuz.', 1.3, 5.3, 1.3),
    metin(K, 2.85, 5.1, 2.4, [...M.neden.p, ...M.neden.siz.slice(1)].join('\n'), { boyut: 17, satir: 1.15, paraAra: 6 }),
    ...o,
    metin(6.55, 6.15, W - K - 6.55, 0.35, 'Sayılar segika.com sitesinde yazıyor.', { boyut: S.kucuk, renk: R.gri }),
    ...alt(2),
  ] };
}

function s3() {
  const o = [];
  const gw = (W - 2 * K - 3 * 0.4) / 4;
  M.urun.isler.forEach((x, i) => {
    const gx = K + i * (gw + 0.4);
    o.push(daire(gx, 2.88, 0.26, R.yesil));
    o.push(metin(gx, 3.22, gw, 0.42, x.b, { boyut: 19, kalin: true, renk: R.lacivert }));
    o.push(metin(gx, 3.66, gw, 1.22, x.m, { boyut: S.govde, satir: 1.08 }));
  });
  const by = 5.0, bh = 1.25;
  o.push(kutu(K, by, W - 2 * K, bh, R.lacivert, { kose: 0.08 }));
  const pw = 2.45;
  PAKETLER.forEach((p, i) => {
    const px = K + 0.35 + i * pw;
    if (i) o.push(cizgi(px - 0.18, by + 0.25, 0, bh - 0.5, R.cizgiLacivertUstu, 1));
    o.push(metin(px, by + 0.18, pw - 0.3, 0.32, p.ad, { boyut: S.kucuk, renk: R.griLacivertUstu }));
    o.push(metin(px, by + 0.52, pw - 0.3, 0.6, tl(p.fiyat), { boyut: 30, kalin: true, renk: R.yesil }));
  });
  o.push(metin(K + 0.35 + 3 * pw, by + 0.25, W - 2 * K - 0.7 - 3 * pw, bh - 0.5, 'Fiyatlar 25 çalışan için aylıktır. Bu belgede KDV hariç sayılır. Fiyat herkes için aynıdır.', { boyut: S.kucuk, renk: R.beyaz, dikey: 'middle', satir: 1.12 }));
  return { ogeler: [
    ...ust('03  Müşteriniz ne kazanır'),
    kanca(M.urun.kanca2, 1.15, 11.5, 0.7),
    metin(K, 1.82, 11.8, 0.92, `${M.urun.tanim} ${M.urun.paketAyrimi}`, { boyut: S.govde, renk: R.gri, satir: 1.08 }),
    ...o,
    metin(K, 6.35, 11.8, 0.35, `${M.urun.entegrasyon} ${M.urun.entegrasyonPaket}`, { boyut: S.kucuk, renk: R.gri }),
    ...alt(3, false, 'Kaynak: segika.com fiyat sayfası'),
  ] };
}

function s4() {
  const o = [];
  const n = 6, gw = (W - 2 * K) / n, d = 0.95, cy = 2.2;
  o.push(cizgi(K + gw / 2, cy + d / 2, gw * (n - 1), 0, R.sis, 5));
  M.surec.adimlar.forEach((a, i) => {
    const cx = K + gw * i + gw / 2;
    const son = i === n - 1;
    o.push(daire(cx - d / 2, cy, d, son ? R.yesil : R.lacivert));
    o.push(metin(cx - d / 2, cy, d, d, String(i + 1), { boyut: 30, kalin: true, renk: son ? R.lacivertDerin : R.beyaz, hiza: 'center', dikey: 'middle' }));
    o.push(metin(cx - gw / 2 + 0.08, cy + d + 0.22, gw - 0.16, 0.9, a.b, { boyut: 17, kalin: true, renk: R.lacivert, hiza: 'center', satir: 1.05 }));
    o.push(metin(cx - gw / 2 + 0.08, cy + d + 1.15, gw - 0.16, 1.1, a.m, { boyut: S.kucuk, hiza: 'center', satir: 1.12 }));
    o.push(metin(cx - gw / 2 + 0.08, cy + d + 2.3, gw - 0.16, 0.55, a.kim, { boyut: S.kucuk, kalin: true, renk: R.yesilMetin, hiza: 'center', satir: 1.05 }));
  });
  return { ogeler: [...ust('04  Nasıl işler'), kanca(M.surec.kanca, 1.15, 11.5, 0.7), ...o,
    metin(K, 6.3, W - 2 * K, 0.4, M.surec.kayit[1], { boyut: S.kucuk, renk: R.gri }), ...alt(4)] };
}

function cubuklar({ x, y, w, h, veriler, renkler, ustYazi, altYazi, altYazi2, enCok, boyut = 20 }) {
  const o = [];
  const gw = w / veriler.length, cw = Math.min(gw * 0.6, 1.5);
  const ustB = 0.55, altB = 0.85, alan = h - ustB - altB;
  veriler.forEach((v, i) => {
    const ch = Math.max(v / enCok * alan, 0.04);
    const cx = x + gw * i + (gw - cw) / 2;
    const cy = y + ustB + alan - ch;
    o.push(kutu(cx, cy, cw, ch, renkler[i]));
    o.push(metin(x + gw * i, cy - 0.06 - boyut / 72 * 1.45, gw, boyut / 72 * 1.45, ustYazi[i], { boyut, kalin: true, renk: R.murekkep, hiza: 'center', dikey: 'bottom', satir: 1 }));
    o.push(metin(x + gw * i, y + ustB + alan + 0.08, gw, 0.38, altYazi[i], { boyut: S.govde, kalin: true, renk: R.lacivert, hiza: 'center' }));
    if (altYazi2) o.push(metin(x + gw * i, y + ustB + alan + 0.45, gw, 0.35, altYazi2[i], { boyut: S.kucuk, renk: R.gri, hiza: 'center' }));
  });
  o.push(cizgi(x, y + ustB + alan, w, 0, R.cizgi, 1.5));
  return o;
}

function s5() {
  const kap = basamaklar('kapatir'), tan = basamaklar('tanistir');
  const px = 8.75, pw = W - K - px;
  const tablo = [];
  tan.forEach((b, i) => {
    const y = 2.6 + i * 0.62;
    if (i) tablo.push(cizgi(px + 0.35, y - 0.06, pw - 0.7, 0, R.cizgi, 1));
    tablo.push(metin(px + 0.35, y, 2.6, 0.5, i === 0 ? '30.000 TL altı' : `${tl(b.esik)} ve üstü`, { boyut: S.govde, dikey: 'middle' }));
    tablo.push(metin(px + pw - 1.8, y, 1.45, 0.5, i === 0 ? 'Pay yok' : yuzde(b.oran), { boyut: 19, kalin: true, renk: R.yesilMetin, hiza: 'right', dikey: 'middle' }));
  });
  return { ogeler: [
    ...ust('05  Ne kazanırsınız'),
    kanca('%15\'ten %30\'a. Oranı aylık cironuz belirler.', 1.15, 11.6, 0.7),
    metin(K, 1.9, 7.6, 0.4, 'Grafik satışı kapatanın oranını gösterir. Yeşil çubuk örnekteki durumdur.', { boyut: S.govde, renk: R.gri }),
    ...cubuklar({ x: K, y: 2.2, w: 7.6, h: 3.95, veriler: kap.map((b) => b.oran), enCok: 0.3, renkler: [R.lacivert, R.yesil, R.lacivert, R.lacivert], ustYazi: kap.map((b) => yuzde(b.oran)), altYazi: kap.map((b) => b.ad), altYazi2: kap.map((b, i) => (i === 0 ? '30.000 TL altı' : `${tl(b.esik)}+`)), boyut: 26 }),
    kutu(px, 1.95, pw, 4.2, R.sisAcik, { kose: 0.08 }),
    metin(px + 0.35, 2.12, pw - 0.7, 0.45, 'Yalnız tanıştırırsanız', { boyut: 19, kalin: true, renk: R.lacivert }),
    ...tablo,
    metin(px + 0.35, 5.15, pw - 0.7, 0.9, 'Ciro, getirdiğiniz müşterilerin ödediği paket bedelidir. KDV hariç sayılır.', { boyut: S.kucuk, satir: 1.12 }),
    metin(K, 6.3, W - 2 * K, 0.4, M.kazanc.esik, { boyut: S.govde, kalin: true, renk: R.lacivert }),
    ...alt(5),
  ] };
}

function s6() {
  const v = ISVEREN_SAYISI;
  return { ogeler: [
    ...ust('06  Örnek hesap'),
    kanca('Bugünkü planda 3. işveren oranı %25\'e çıkarır.', 1.15, 11.6, 0.7),
    metin(K, 2.05, 3.7, 3.6, 'Her işveren 25 çalışanlı. Her işveren Teşvik ve Otomasyon paketini yıllık alıyor.\nBir yıllık paket 31.200 TL eder.\nUlaştığınız oran cironun tamamına uygulanır.', { boyut: 17, satir: 1.15, paraAra: 8 }),
    ...cubuklar({ x: 4.85, y: 1.95, w: W - K - 4.85, h: 4.15, veriler: v.map((x) => x.kazanc), enCok: 37440, renkler: [R.lacivert, R.yesil, R.lacivert, R.lacivert], ustYazi: v.map((x) => tl(x.kazanc)), altYazi: v.map((x) => `${x.n} işveren`), altYazi2: v.map((x) => `${tl(x.ciro)} × ${yuzde(x.oran)}`), boyut: 20 }),
    metin(K, 6.2, W - 2 * K, 0.65, `${M.ornek.uyari} ${M.ornek.esikNot}`, { boyut: S.govde, kalin: true, renk: R.lacivert, satir: 1.1 }),
    ...alt(6),
  ] };
}

function s7() {
  const y = ORNEK.yillar;
  return { ogeler: [
    ...ust('07  Örnek hesap'),
    kanca('Destek sürdükçe payınız 4. yıla kadar sürer.', 1.15, 11.6, 0.7),
    metin(K, 1.9, 8, 0.4, 'Örnekte 2 işveren var. İki işveren paketini her yıl yeniler.', { boyut: S.govde, renk: R.gri }),
    ...cubuklar({ x: K, y: 2.3, w: 7.9, h: 3.95, veriler: y.map((x) => x.tutar), enCok: ORNEK.kazanc, renkler: [R.yesil, R.lacivert, R.lacivert, R.lacivert], ustYazi: y.map((x) => tl(x.tutar)), altYazi: y.map((x) => x.ad), altYazi2: y.map((x) => `oran ${yuzde(x.oran)}`), boyut: 20 }),
    kutu(9.05, 2.3, W - K - 9.05, 3.9, R.sisAcik, { kose: 0.08 }),
    metin(9.4, 2.55, W - K - 9.75, 0.4, 'Dört yılın toplamı', { boyut: S.govde, renk: R.gri }),
    metin(9.4, 2.95, W - K - 9.75, 0.8, tl(ORNEK.toplam), { boyut: 40, kalin: true, renk: R.lacivert }),
    metin(9.4, 3.8, W - K - 9.75, 2.4, `${M.ornek.saglama}\nDestek vermediğiniz ay için pay oluşmaz.\n${M.kazanc.hakDegil}`, { boyut: S.kucuk, satir: 1.1, paraAra: 5 }),
    metin(K, 6.4, W - 2 * K, 0.4, M.kazanc.k1, { boyut: S.govde, kalin: true, renk: R.lacivert }),
    ...alt(7),
  ] };
}

function s8() {
  const o = [];
  const gw = (W - 2 * K) / 4;
  M.roller.liste.forEach((r, i) => {
    const gx = K + i * gw;
    const bir = r.id === 'cozum';
    if (bir) o.push(kutu(gx, 1.85, gw - 0.15, 4.85, R.lacivert, { kose: 0.08 }));
    else if (i > 1) o.push(cizgi(gx - 0.05, 1.95, 0, 4.65, R.cizgi, 1));
    const ix = gx + (bir ? 0.25 : 0.2), iw = gw - (bir ? 0.65 : 0.4);
    const etiket = bir ? R.yesil : R.yesilMetin, yazi = bir ? R.beyaz : R.murekkep;
    o.push(metin(ix, 2.02, iw, 0.5, r.ad, { boyut: 22, kalin: true, renk: bir ? R.yesil : R.lacivert }));
    // Dört satır: kim, ne yapar, nasıl kazanır, nasıl başlar. Gövde 14 pt (1920 px genişlikte 28 px).
    const satirlar = [['Kim', r.kim, 0.78], ['Ne yapar', r.ne, 0.58], ['Nasıl kazanır', r.kazanc, 0.58], ['Nasıl başlar', r.ilk, 0.78]];
    let y = 2.62;
    satirlar.forEach(([e, m, h], j) => {
      o.push(metin(ix, y, iw, 0.26, e.toLocaleUpperCase('tr-TR'), { boyut: S.ust, kalin: true, renk: etiket, harf: 1 }));
      o.push(metin(ix, y + 0.28, iw, h, m, { boyut: 14, kalin: j === 2, renk: j === 2 && !bir ? R.lacivert : yazi, satir: 1.05 }));
      y += 0.28 + h + 0.12;
    });
  });
  return { ogeler: [...ust('08  Dört ortaklık yolu'), kanca(M.roller.kanca, 1.15, 11.6, 0.7), ...o, ...alt(8)] };
}

function s9() {
  // Öteki üç yol: her sütunda bir kanca, bir büyük sayı ve ilk adım.
  const o = [];
  const ara = 0.3, cw = (W - 2 * K - 2 * ara) / 3, y0 = 1.95, ch = 4.2;
  M.ucYol.liste.forEach((r, i) => {
    const x = K + i * (cw + ara), ix = x + 0.3, iw = cw - 0.6;
    o.push(kutu(x, y0, cw, ch, R.sisAcik, { kose: 0.08 }));
    o.push(metin(ix, y0 + 0.25, iw, 0.28, r.ad.toLocaleUpperCase('tr-TR'), { boyut: S.ust, kalin: true, renk: R.yesilMetin, harf: 1 }));
    o.push(metin(ix, y0 + 0.58, iw, 0.9, r.kanca, { boyut: 17, kalin: true, renk: R.lacivert, satir: 1.02 }));
    o.push(metin(ix, y0 + 1.5, iw, 0.72, r.sayi, { boyut: 38, kalin: true, renk: R.yesilMetin, satir: 1 }));
    o.push(metin(ix, y0 + 2.25, iw, 1.05, r.sayiAlt, { boyut: S.kucuk, satir: 1.08 }));
    o.push(metin(ix, y0 + 3.35, iw, 0.26, 'İLK ADIM', { boyut: S.ust, kalin: true, renk: R.yesilMetin, harf: 1 }));
    o.push(metin(ix, y0 + 3.62, iw, 0.52, r.ilk, { boyut: 14, kalin: true, renk: R.lacivert, satir: 1.05 }));
  });
  return { ogeler: [...ust('09  Öteki üç yol'), kanca(M.ucYol.kanca, 1.15, 11.6, 0.7), ...o,
    metin(K, 6.25, W - 2 * K, 0.6, M.ucYol.not, { boyut: S.govde, kalin: true, renk: R.lacivert, satir: 1.08 }), ...alt(9)] };
}

function s10() {
  // Koşullar ve ilk adım tek slayttadır.
  const o = [];
  const sol = 7.75, cw = sol / 2, y0 = 1.95, bh = 4.35;
  o.push(kutu(K, y0, cw, bh, R.lacivert, { kose: 0.08 }));
  o.push(kutu(K + cw, y0, cw, bh, R.sisAcik, { kose: 0.08 }));
  [[M.kosullar.biz, 'Segika ne yapar', true], [M.kosullar.siz, 'Siz ne yaparsınız', false]].forEach(([liste, baslik, koyu], k) => {
    const x = K + k * cw + 0.3;
    o.push(metin(x, y0 + 0.18, cw - 0.6, 0.42, baslik, { boyut: 19, kalin: true, renk: koyu ? R.yesil : R.lacivert }));
    liste.forEach((m, i) => {
      const y = y0 + 0.72 + i * 0.6;
      o.push(metin(x, y, 0.32, 0.5, String(i + 1), { boyut: 14, kalin: true, renk: koyu ? R.yesil : R.yesilMetin }));
      o.push(metin(x + 0.34, y, cw - 0.95, 0.54, m, { boyut: 14, renk: koyu ? R.beyaz : R.murekkep, satir: 1.05 }));
    });
  });
  const px = K + sol + 0.25, pw = W - K - px;
  o.push(kutu(px, y0, pw, bh, R.lacivertDerin, { kose: 0.08 }));
  o.push(...markaYazisi(px + 0.3, y0 + 0.2, 28, R.beyaz));
  o.push(metin(px + 0.3, y0 + 0.78, pw - 0.6, 0.42, 'segika.com', { boyut: 20, kalin: true, renk: R.yesil }));
  M.ilk.adimlar.forEach((m, i) => {
    const y = y0 + 1.45 + i * 0.7;
    o.push(metin(px + 0.3, y, 0.35, 0.55, String(i + 1), { boyut: 15, kalin: true, renk: R.yesil }));
    o.push(metin(px + 0.68, y, pw - 1.0, 0.58, m, { boyut: 14, kalin: true, renk: R.beyaz, satir: 1.05 }));
  });
  return { ogeler: [...ust('10  Koşullar ve ilk adım'), kanca(M.kosullar.kanca, 1.15, 11.6, 0.7), ...o,
    metin(K, 6.42, W - 2 * K, 0.35, 'Fiyatı değiştirmeyin. Teşvik tutarı için söz vermeyin. Bu belge bir sözleşme değildir.', { boyut: S.kucuk, renk: R.gri }),
    ...alt(10, false, TARIH)] };
}

export const SLAYTLAR = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10].map((f) => f());

/* ---------- PPTX ---------- */
const hex = (r) => r.replace('#', '');
export async function sunumUret(yol) {
  const p = new PptxGenJS();
  p.defineLayout({ name: 'SEGIKA', width: W, height: H });
  p.layout = 'SEGIKA';
  p.author = 'Segika';
  p.company = 'Segika';
  p.title = 'Segika iş ortaklığı programı';
  p.subject = 'Mali müşavirler ve insan kaynakları danışmanları için iş ortaklığı daveti';
  p.theme = { headFontFace: FONT, bodyFontFace: FONT };
  for (const sl of SLAYTLAR) {
    const s = p.addSlide();
    s.background = { color: hex(sl.zemin ?? R.beyaz) };
    for (const o of sl.ogeler) {
      if (o.tur === 'kutu') {
        s.addShape(o.kose ? p.ShapeType.roundRect : p.ShapeType.rect, { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: hex(o.renk) }, line: { type: 'none' }, ...(o.kose ? { rectRadius: o.kose } : {}) });
      } else if (o.tur === 'daire') {
        s.addShape(p.ShapeType.ellipse, { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: hex(o.renk) }, line: { type: 'none' } });
      } else if (o.tur === 'cizgi') {
        s.addShape(p.ShapeType.line, { x: o.x, y: o.y, w: o.w, h: o.h, line: { color: hex(o.renk), width: o.kalinlik } });
      } else {
        const paralar = metinDuzelt(o.yazi).split('\n');
        const parcalar = paralar.map((t, i) => ({ text: t, options: { breakLine: i < paralar.length - 1, paraSpaceAfter: i < paralar.length - 1 ? o.paraAra : 0 } }));
        if (o.nokta) parcalar.push({ text: '.', options: { color: hex(o.nokta) } });
        s.addText(parcalar, {
          x: o.x, y: o.y, w: o.w, h: o.h, fontFace: FONT, fontSize: o.boyut, bold: o.kalin, color: hex(o.renk),
          align: o.hiza, valign: o.dikey, margin: 0, lineSpacingMultiple: o.satir, charSpacing: o.harf || undefined,
          fit: 'none', wrap: true, isTextBox: true,
        });
      }
    }
  }
  await p.writeFile({ fileName: yol, compression: true });
  return SLAYTLAR.length;
}

/* ---------- Önizleme HTML'i ---------- */
const px = (inc) => `${(inc * 144).toFixed(2)}px`;
export function sunumOnizlemeHtml() {
  const slayt = (sl, i) => `<div class="slayt" style="background:${sl.zemin ?? R.beyaz}">${sl.ogeler.map((o) => {
    const k = `left:${px(o.x)};top:${px(o.y)};width:${px(o.w)};height:${px(o.h)};`;
    if (o.tur === 'kutu') return `<div style="position:absolute;${k}background:${o.renk};border-radius:${px(o.kose)}"></div>`;
    if (o.tur === 'daire') return `<div style="position:absolute;${k}background:${o.renk};border-radius:50%"></div>`;
    if (o.tur === 'cizgi') return `<div style="position:absolute;left:${px(o.x)};top:${px(o.y)};width:${o.w ? px(o.w) : `${o.kalinlik * 2}px`};height:${o.h ? px(o.h) : `${o.kalinlik * 2}px`};background:${o.renk}"></div>`;
    const dikey = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[o.dikey];
    const paralar = metinDuzelt(o.yazi).split('\n').map((t, j, d) => `<p style="margin:0 0 ${o.paraAra * 2}px">${t}${o.nokta && j === d.length - 1 ? `<span style="color:${o.nokta}">.</span>` : ''}</p>`).join('');
    return `<div class="metin" data-slayt="${i + 1}" style="position:absolute;${k}display:flex;flex-direction:column;justify-content:${dikey};overflow:hidden;font-size:${o.boyut * 2}px;font-weight:${o.kalin ? 700 : 400};color:${o.renk};text-align:${o.hiza};line-height:${(o.satir * 1.17).toFixed(3)};letter-spacing:${o.harf ? `${o.harf * 2}px` : 'normal'}">${paralar}</div>`;
  }).join('')}</div>`;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Sunum önizlemesi</title><style>
  body { margin: 0; background: #888; }
  .slayt { position: relative; width: 1920px; height: 1080px; overflow: hidden; margin-bottom: 20px; }
  .slayt p { overflow-wrap: normal; word-break: normal; hyphens: none; }
  body { font-family: '${FONT}', sans-serif; }
  </style></head><body>${SLAYTLAR.map(slayt).join('')}</body></html>`;
}
