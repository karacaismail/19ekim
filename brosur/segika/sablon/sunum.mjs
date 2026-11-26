/**
 * Sunum: 16:9, 11 slayt. Metinler düzenlenebilir gerçek metindir. Grafikler PowerPoint şekilleridir.
 * Bütün metnin yazı tipi Arial'dir. Outfit PPTX'e gömülemiyor. Outfit'i olmayan görüntüleyici Times'a düşüyordu.
 * Yerleşim tek bir veri modelinde tutulur. Aynı model hem PPTX dosyasını hem önizleme HTML'ini üretir.
 * Ölçüler inçtir. Yazı boyutları pt'dir. 1920 px genişlikte 1 inç 144 px, 1 pt 2 px eder.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { TOKENS, metinDuzelt, binTl } from './ortak.mjs';
import { M, TARIH, CALISAN, PAKETLER, OLCEK, ORNEK, SEVIYE, AYLIK, ELCI, basamaklar, tl, yuzde } from '../icerik.mjs';

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
/** Kapak fotoğrafı. Dosya kutuyla aynı en-boy oranında önceden kırpıldı. Bu yüzden PPTX'te bozulmaz. */
const KAPAK = resolve(dirname(fileURLToPath(import.meta.url)), '../gorsel/kapak-sunum.jpg');
const resim = (x, y, w, h, yol) => ({ tur: 'resim', x, y, w, h, yol });

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
  return [metin(K, H - 0.55, 7, 0.3, sol, { boyut: S.kucuk, renk }), metin(W - K - 2, H - 0.55, 2, 0.3, `${no} / ${SLAYT_SAYISI}`, { boyut: S.kucuk, renk, hiza: 'right' })];
}
const kanca = (yazi, y = 1.15, w = 11.5, h = 1.1, renk = R.lacivert, boyut = S.h2) => metin(K, y, w, h, yazi, { boyut, kalin: true, renk, satir: 1.05 });

/* ---------- Slaytlar ---------- */
function s1() {
  // Kapak: üstte beyaz marka bandı, altında tam genişlikte fotoğraf, fotoğrafın üstünde düz renkli metin kutusu.
  const bant = 0.95, kx = W - 6.2, ky = 2.2;
  return { ogeler: [
    resim(0, bant, W, H - bant, KAPAK),
    ...markaYazisi(K, 0.28, 26, R.lacivert),
    metin(W - K - 6, 0.3, 6, 0.4, M.kapak.sunum, { boyut: 20, kalin: true, renk: R.lacivert, hiza: 'right' }),
    kutu(kx, ky, W - kx, 4.55, R.lacivert),
    metin(kx + 0.4, ky + 0.35, W - kx - 0.8, 0.3, M.kapak.baslik.toLocaleUpperCase('tr-TR'), { boyut: S.ust, kalin: true, renk: R.yesil, harf: 1.5 }),
    metin(kx + 0.4, ky + 0.75, 0.95, 0.9, M.kapak.ay, { boyut: 54, kalin: true, renk: R.yesil, satir: 1 }),
    metin(kx + 1.4, ky + 1.1, W - kx - 1.8, 0.45, M.kapak.ayYazi, { boyut: 20, kalin: true, renk: R.yesil }),
    metin(kx + 0.4, ky + 1.85, W - kx - 0.8, 1.45, M.kapak.alt, { boyut: 28, kalin: true, renk: R.beyaz, satir: 1.05 }),
    metin(kx + 0.4, ky + 3.45, W - kx - 0.8, 0.6, M.kapak.ayCumle, { boyut: 14, renk: R.beyaz }),
    metin(kx + 0.4, ky + 4.1, W - kx - 0.8, 0.35, `${M.kapak.sunum}. ${TARIH} hazırlandı.`, { boyut: S.kucuk, renk: R.griLacivertUstu }),
  ] };
}

/** 12 aylık çubuklar ve ay noktaları. Çubuklar noktaların hemen üstündedir. Tutarlar `icerik.mjs` hesabından gelir. */
function aySeridi12({ x, y, w, cubukH, degerler, renk = R.yesil, yazi = R.beyaz, noktalar = true, renkler = null, altYazi = null, altRenk = R.griLacivertUstu }) {
  const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const adim = w / 12, d = 0.36, cw = adim * 0.56, enCok = Math.max(...degerler);
  const o = [];
  const taban = y + cubukH;
  degerler.forEach((v, i) => {
    const cx = x + adim * i + adim / 2;
    const h = Math.max(v / enCok * (cubukH - 0.32), 0.04);
    o.push(kutu(cx - cw / 2, taban - h, cw, h, renkler?.[i] ?? renk));
    o.push(metin(cx - adim / 2, taban - h - 0.3, adim, 0.28, binTl(v), { boyut: S.kucuk, kalin: true, renk: yazi, hiza: 'center', dikey: 'bottom', satir: 1 }));
  });
  if (noktalar) {
    const ny = taban + 0.1;
    o.push(cizgi(x + adim / 2, ny + d / 2, w - adim, 0, R.cizgiLacivertUstu, 2));
    aylar.forEach((a, i) => {
      const cx = x + adim * i + adim / 2;
      o.push(daire(cx - d / 2, ny, d, R.yesil));
      o.push(metin(cx - adim / 2, ny + d + 0.05, adim, 0.28, a, { boyut: S.kucuk, renk: R.griLacivertUstu, hiza: 'center' }));
    });
  } else {
    o.push(cizgi(x, taban, w, 0, R.cizgi, 1.2));
    aylar.forEach((_, i) => o.push(metin(x + adim * i, taban + 0.06, adim, 0.3, altYazi ? altYazi(i) : `${i + 1}. ay`, { boyut: S.kucuk, renk: altRenk, hiza: 'center' })));
  }
  return o;
}

function s2() {
  const A = M.acilis;
  const o = [];
  const gx = 7.15, gw = (W - K - gx - 0.3) / 2;
  A.isler.forEach((x, i) => {
    const cx = gx + (i % 2) * (gw + 0.3), cy = 1.3 + Math.floor(i / 2) * 1.1;
    o.push(metin(cx, cy, gw, 0.32, x.b, { boyut: 15, kalin: true, renk: R.yesil }));
    o.push(metin(cx, cy + 0.33, gw, 0.7, x.m, { boyut: S.kucuk, renk: R.beyaz, satir: 1.05 }));
  });
  return { zemin: R.lacivert, koyu: true, ogeler: [
    ...ust('02  Segika ne yapar', true),
    metin(K, 1.2, 6.1, 1.45, A.kanca, { boyut: 32, kalin: true, renk: R.beyaz, satir: 1.0 }),
    metin(K, 2.7, 6.1, 0.4, A.kanca2, { boyut: 19, kalin: true, renk: R.yesil }),
    ...o,
    metin(K, 3.5, W - 2 * K, 0.34, A.serit, { boyut: 15, kalin: true, renk: R.beyaz }),
    metin(K, 3.85, W - 2 * K, 0.3, A.cubuk, { boyut: S.kucuk, kalin: true, renk: R.yesil }),
    ...aySeridi12({ x: K, y: 4.15, w: W - 2 * K, cubukH: 1.25, degerler: AYLIK.map((a) => a.birikim) }),
    metin(K, 6.25, W - 2 * K, 0.32, `Tutarlar bin TL'dir. ${A.cubukNot}`, { boyut: S.kucuk, renk: R.griLacivertUstu }),
    ...alt(2, true),
  ] };
}

function s3() {
  const o = [];
  OLCEK.forEach((x, i) => {
    const y = 1.25 + i * 0.95;
    if (i) o.push(cizgi(6.55, y - 0.06, W - K - 6.55, 0, R.cizgi, 1));
    o.push(metin(6.55, y, 2.9, 0.82, x.sayi, { boyut: 30, kalin: true, renk: i === 0 ? R.yesilMetin : R.lacivert, dikey: 'middle' }));
    o.push(metin(9.5, y, W - K - 9.5, 0.82, x.metin, { boyut: 14, dikey: 'middle', satir: 1.05 }));
  });
  return { ogeler: [
    ...ust('03  Neden siz'),
    kanca('Müşterinizi siz tanıyorsunuz.', 1.25, 5.3, 1.25),
    metin(K, 2.65, 5.3, 2.1, [...M.neden.p, ...M.neden.siz.slice(1)].join('\n'), { boyut: 15, satir: 1.1, paraAra: 4 }),
    metin(K, 4.85, 5.3, 0.3, M.neden.sicil, { boyut: S.kucuk, renk: R.gri }),
    metin(K, 5.25, 5.3, 1.4, `${M.neden.kaynak} ${M.neden.beyan}`, { boyut: S.kucuk, renk: R.gri, satir: 1.05 }),
    ...o,
    ...alt(3),
  ] };
}

function s4() {
  const P = M.plan;
  const o = [];
  const ara = 0.3, cw = (W - 2 * K - 2 * ara) / 3, y0 = 2.3, ch = 2.6;
  PAKETLER.forEach((p, i) => {
    const x = K + i * (cw + ara), bir = i === 2;
    o.push(kutu(x, y0, cw, ch, bir ? R.lacivert : R.sisAcik, { kose: 0.08 }));
    o.push(metin(x + 0.3, y0 + 0.35, cw - 0.6, 0.32, p.ad, { boyut: 15, kalin: true, renk: bir ? R.griLacivertUstu : R.gri }));
    o.push(metin(x + 0.3, y0 + 0.8, cw - 0.6, 0.8, tl(p.fiyat), { boyut: 44, kalin: true, renk: bir ? R.yesil : R.lacivert, satir: 1 }));
    o.push(metin(x + 0.3, y0 + 1.75, cw - 0.6, 0.5, `${p.kisa}. ${CALISAN} çalışan için aylık.`, { boyut: S.kucuk, renk: bir ? R.beyaz : R.murekkep, satir: 1.05 }));
  });
  return { ogeler: [
    ...ust('04  Paketler ve fiyatlar'),
    kanca(P.kanca, 1.15, 11.6, 0.7),
    metin(K, 1.75, W - 2 * K, 0.35, P.fiyatNot, { boyut: S.govde, renk: R.gri }),
    ...o,
    metin(K, 5.2, W - 2 * K, 0.6, P.paketAyrimi, { boyut: 16, satir: 1.05 }),
    metin(K, 5.9, W - 2 * K, 0.6, `${P.kdv} ${P.teklif} ${P.ayni}`, { boyut: S.kucuk, renk: R.gri, satir: 1.05 }),
    ...alt(4),
  ] };
}

function s5() {
  const o = [];
  const n = M.surec.adimlar.length, gw = (W - 2 * K) / n, d = 0.95, cy = 2.2;
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
  return { ogeler: [...ust('05  Nasıl işler'), kanca(M.surec.kanca, 1.15, 11.6, 0.7), ...o,
    metin(K, 6.2, W - 2 * K, 0.6, `${M.surec.kayit[0]} ${M.surec.kayit[1]}`, { boyut: S.kucuk, renk: R.gri, satir: 1.05 }), ...alt(5)] };
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

function s6() {
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
    ...ust('06  Ne kazanırsınız'),
    kanca(M.kazanc.kanca, 1.15, 11.6, 0.7),
    metin(K, 1.9, 7.6, 0.4, `Grafik satışı kapatanın oranını gösterir. ${M.kazanc.tamami}`, { boyut: S.kucuk, renk: R.gri }),
    ...cubuklar({ x: K, y: 2.2, w: 7.6, h: 3.95, veriler: kap.map((b) => b.oran), enCok: 0.3, renkler: [R.lacivert, R.lacivert, R.lacivert, R.yesil], ustYazi: kap.map((b) => yuzde(b.oran)), altYazi: kap.map((b) => b.ad), altYazi2: kap.map((b, i) => (i === 0 ? '30.000 TL altı' : `${tl(b.esik)}+`)), boyut: 26 }),
    kutu(px, 1.95, pw, 4.2, R.sisAcik, { kose: 0.08 }),
    metin(px + 0.35, 2.12, pw - 0.7, 0.45, 'Yalnız tanıştırırsanız', { boyut: 19, kalin: true, renk: R.lacivert }),
    ...tablo,
    metin(px + 0.35, 5.15, pw - 0.7, 0.9, M.kazanc.ciro, { boyut: S.kucuk, satir: 1.12 }),
    metin(K, 6.3, W - 2 * K, 0.4, M.kazanc.esik, { boyut: S.govde, kalin: true, renk: R.lacivert }),
    ...alt(6),
  ] };
}

function s7() {
  const Y = M.yillik;
  const o = [];
  // Hesap zinciri
  const zin = [['Aylık bedel', tl(ORNEK.paket)], ['× 12', null], ['Yıllık bedel', tl(ORNEK.yillik)], ['× 2', null], ['Aylık ciro', tl(ORNEK.ciro)], [`× ${yuzde(ORNEK.oran)}`, null]];
  let zx = K;
  zin.forEach(([a, b]) => {
    if (b) { o.push(metin(zx, 2.45, 2.05, 0.28, a, { boyut: S.kucuk, renk: R.gri })); o.push(metin(zx, 2.72, 2.05, 0.5, b, { boyut: 24, kalin: true, renk: R.lacivert })); zx += 2.05; } else { o.push(metin(zx, 2.74, 0.8, 0.5, a, { boyut: 19, kalin: true, renk: R.yesilMetin })); zx += 0.8; }
  });
  o.push(kutu(zx + 0.05, 2.32, W - K - zx - 0.05, 1.0, R.yesil, { kose: 0.08 }));
  o.push(metin(zx + 0.3, 2.4, W - K - zx - 0.5, 0.28, 'Bu ayki kazanç', { boyut: S.kucuk, renk: R.lacivertDerin }));
  o.push(metin(zx + 0.3, 2.66, W - K - zx - 0.5, 0.6, tl(ORNEK.kazanc), { boyut: 30, kalin: true, renk: R.lacivertDerin }));
  // Seviyeler
  const sw = 1.38, sara = 0.1, taban = 5.4;
  o.push(metin(K, 3.45, 5.8, 0.36, Y.seviyeBaslik, { boyut: 17, kalin: true, renk: R.lacivert }));
  SEVIYE.liste.forEach((s, i) => {
    const h = 1.2 + i * 0.15, x = K + i * (sw + sara), y = taban - h, bur = s.no === SEVIYE.ornek;
    o.push(kutu(x, y, sw, h, bur ? R.lacivert : R.sisAcik));
    o.push(metin(x + 0.1, y + 0.08, sw - 0.2, 0.5, bur ? Y.buradasiniz : s.ad, { boyut: S.kucuk, kalin: true, renk: bur ? R.yesil : R.gri, satir: 1.0 }));
    o.push(metin(x + 0.1, taban - 0.78, sw - 0.2, 0.45, yuzde(s.oran), { boyut: 24, kalin: true, renk: bur ? R.beyaz : R.lacivert, satir: 1 }));
    o.push(metin(x + 0.1, taban - 0.33, sw - 0.2, 0.28, s.esik ? `${binTl(s.esik).replace(',0', '')} bin TL+` : '30 bin TL altı', { boyut: S.kucuk, renk: bur ? R.beyaz : R.murekkep }));
  });
  o.push(metin(K, 5.48, 5.8, 0.5, Y.yol, { boyut: 14, kalin: true, renk: R.yesilMetin, satir: 1.0 }));
  o.push(metin(K, 6.0, 5.8, 0.8, `${Y.birIsveren} ${Y.varsayim}`, { boyut: S.kucuk, satir: 1.0 }));
  // 4 yıl
  const yx = 7.2, yw = W - K - yx;
  o.push(metin(yx, 3.4, yw, 0.5, Y.dortYil, { boyut: 26, kalin: true, renk: R.yesilMetin }));
  o.push(...cubuklar({ x: yx, y: 3.75, w: yw, h: 1.95, veriler: ORNEK.yillar.map((x) => x.tutar), enCok: ORNEK.kazanc, renkler: [R.yesil, R.lacivert, R.lacivert, R.lacivert], ustYazi: ORNEK.yillar.map((x) => tl(x.tutar)), altYazi: ORNEK.yillar.map((x) => x.ad), altYazi2: null, boyut: 15 }));
  o.push(metin(yx, 5.8, yw, 0.95, `${Y.toplam} ${Y.dortYilAlt} ${M.kazanc.hakDegil}`, { boyut: S.kucuk, satir: 1.0 }));
  return { ogeler: [
    ...ust('07  Yıllık satış'),
    kanca(Y.kanca, 1.05, 11.6, 0.65),
    metin(K, 1.7, W - 2 * K, 0.3, Y.uyari, { boyut: S.kucuk, kalin: true, renk: R.yesilMetin }),
    metin(K, 1.98, W - 2 * K, 0.3, `Her işverenin ${CALISAN} çalışanı var. İkisi de Teşvik ve Otomasyon paketini yıllık alıyor.`, { boyut: S.kucuk }),
    ...o,
    ...alt(7),
  ] };
}

function s8() {
  const A = M.aylik;
  const renk = (o) => (o === 0.3 ? R.yesil : o === 0.25 ? R.lacivert : o === 0.2 ? R.tanistirma : R.cizgi);
  return { ogeler: [
    ...ust('08  Aylık satış'),
    kanca(A.kanca, 1.1, 11.6, 0.7),
    kutu(K, 1.95, W - 2 * K, 0.7, R.yesilSoluk, { kose: 0.06 }),
    metin(K + 0.25, 2.07, W - 2 * K - 0.5, 0.46, A.neden, { boyut: 14, renk: R.murekkep, satir: 1.05 }),
    metin(K, 2.95, W - 2 * K, 0.55, A.durum, { boyut: 14, satir: 1.05 }),
    ...aySeridi12({ x: K, y: 3.5, w: W - 2 * K, cubukH: 1.8, degerler: AYLIK.map((a) => a.kazanc), renkler: AYLIK.map((a) => renk(a.oran)), yazi: R.murekkep, noktalar: false, altRenk: R.gri }),
    metin(K, 5.72, 6.2, 0.6, A.sonuc, { boyut: 14, kalin: true, renk: R.lacivert, satir: 1.05 }),
    metin(7.2, 5.72, W - K - 7.2, 1.15, `Tutarlar bin TL'dir. Renk oranı gösterir: gri %15, açık mavi %20, lacivert %25, yeşil %30. ${A.varsayim}`, { boyut: S.kucuk, renk: R.gri, satir: 1.0 }),
    ...alt(8),
  ] };
}

function s9() {
  const o = [];
  const gw = (W - 2 * K) / M.roller.liste.length;
  M.roller.liste.forEach((r, i) => {
    const gx = K + i * gw;
    const bir = r.id === 'cozum';
    if (bir) o.push(kutu(gx, 1.85, gw - 0.15, 4.3, R.lacivert, { kose: 0.08 }));
    else if (i > 1) o.push(cizgi(gx - 0.05, 1.95, 0, 4.1, R.cizgi, 1));
    const ix = gx + (bir ? 0.3 : 0.25), iw = gw - (bir ? 0.75 : 0.45);
    const etiket = bir ? R.yesil : R.yesilMetin, yazi = bir ? R.beyaz : R.murekkep;
    o.push(metin(ix, 2.02, iw, 0.5, r.ad, { boyut: 22, kalin: true, renk: bir ? R.yesil : R.lacivert }));
    const satirlar = [['Kim', r.kim, 0.5], ['Ne yapar', r.ne, 0.5], ['Nasıl kazanır', r.kazancNot ? `${r.kazanc}. ${r.kazancNot}` : r.kazanc, r.kazancNot ? 0.75 : 0.5], ['Nasıl başlar', r.ilk, 0.5]];
    let y = 2.62;
    satirlar.forEach(([e, m, h], j) => {
      o.push(metin(ix, y, iw, 0.26, e.toLocaleUpperCase('tr-TR'), { boyut: S.ust, kalin: true, renk: etiket, harf: 1 }));
      o.push(metin(ix, y + 0.28, iw, h, m, { boyut: 14, kalin: j === 2, renk: j === 2 && !bir ? R.lacivert : yazi, satir: 1.05 }));
      y += 0.28 + h + 0.04;
    });
  });
  return { ogeler: [...ust(`09  ${M.roller.baslik}`), kanca(M.roller.kanca, 1.15, 11.6, 0.7), ...o,
    metin(K, 6.33, W - 2 * K, 0.55, `${M.roller.elciHesap} Kazanç ${tl(ELCI.kazanc)} olur. ${M.roller.not}`, { boyut: S.kucuk, renk: R.gri, satir: 1.0 }), ...alt(9)] };
}

function s10() {
  const S2 = M.sozler;
  const o = [];
  const c1 = 5.2, c2 = W - 2 * K - c1, y0 = 1.75, bh = 3.85;
  o.push(kutu(K, y0, c1, bh, R.lacivert, { kose: 0.08 }));
  o.push(kutu(K + c1, y0, c2, bh, R.sisAcik, { kose: 0.08 }));
  [[S2.segika, "Segika'nın taahhütleri", true, 0.5], [S2.siz, 'Sizin taahhütleriniz', false, 0.345]].forEach(([liste, baslik, koyu, ara], k) => {
    const x = K + (k ? c1 : 0) + 0.3, cw = k ? c2 : c1;
    o.push(metin(x, y0 + 0.15, cw - 0.6, 0.4, baslik, { boyut: 18, kalin: true, renk: koyu ? R.yesil : R.lacivert }));
    liste.forEach((m, i) => {
      const y = y0 + 0.62 + i * ara;
      o.push(metin(x, y, 0.3, 0.3, String(i + 1), { boyut: S.kucuk, kalin: true, renk: koyu ? R.yesil : R.yesilMetin }));
      o.push(metin(x + 0.32, y, cw - 0.75, koyu ? 0.45 : 0.3, m, { boyut: S.kucuk, renk: koyu ? R.beyaz : R.murekkep, satir: 1.0 }));
    });
  });
  return { ogeler: [...ust('10  Taahhütler'), kanca(S2.kanca, 1.1, 11.6, 0.65), ...o,
    metin(K, 5.7, W - 2 * K, 0.88, [...S2.ortak, M.kazanc.k1].join(' '), { boyut: S.kucuk, renk: R.gri, satir: 1.0 }),
    ...alt(10)] };
}

function s11() {
  const o = [];
  M.ilk.adimlar.forEach((m, i) => {
    const y = 3.0 + i * 0.7;
    o.push(metin(K, y, 0.45, 0.5, String(i + 1), { boyut: 22, kalin: true, renk: R.yesil }));
    o.push(metin(K + 0.55, y + 0.04, 5.8, 0.45, m, { boyut: 18, kalin: true, renk: R.beyaz }));
    o.push(cizgi(K, y + 0.6, 6.4, 0, R.cizgiLacivertUstu, 1));
  });
  const nx = 7.75, nw = W - K - nx;
  return { zemin: R.lacivert, koyu: true, ogeler: [...ust('11  İlk adım', true),
    metin(K, 1.3, 7, 1.4, M.ilk.kanca, { boyut: 40, kalin: true, renk: R.beyaz, satir: 1.0 }),
    ...o,
    ...markaYazisi(nx, 1.3, 32, R.beyaz),
    metin(nx, 1.95, nw, 0.42, 'segika.com', { boyut: 20, kalin: true, renk: R.yesil }),
    ...alt(11, true, TARIH)] };
}

const SLAYT_FONKSIYONLARI = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11];
const SLAYT_SAYISI = SLAYT_FONKSIYONLARI.length;
export const SLAYTLAR = SLAYT_FONKSIYONLARI.map((f) => f());

/* ---------- PPTX ---------- */
const hex = (r) => r.replace('#', '');
export async function sunumUret(yol) {
  const p = new PptxGenJS();
  p.defineLayout({ name: 'SEGIKA', width: W, height: H });
  p.layout = 'SEGIKA';
  p.author = 'Segika';
  p.company = 'Segika';
  p.title = 'Segika iş ortaklığı programı';
  p.subject = 'Segika iş ortaklığı tanıtım sunumu';
  p.theme = { headFontFace: FONT, bodyFontFace: FONT };
  for (const sl of SLAYTLAR) {
    const s = p.addSlide();
    s.background = { color: hex(sl.zemin ?? R.beyaz) };
    for (const o of sl.ogeler) {
      if (o.tur === 'resim') {
        s.addImage({ path: o.yol, x: o.x, y: o.y, w: o.w, h: o.h, altText: 'Takım elbiseli bir danışman ofiste kollarını kavuşturmuş duruyor.' });
      } else if (o.tur === 'kutu') {
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
    if (o.tur === 'resim') return `<img src="file://${o.yol}" alt="" style="position:absolute;${k}object-fit:cover">`;
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
