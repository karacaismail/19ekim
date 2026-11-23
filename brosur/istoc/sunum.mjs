// Sunum: 16:9, 10 slayt. Her slayt tek bir öğe listesidir (inç cinsinden konum).
// Aynı liste hem PPTX dosyasını hem tarayıcı önizlemesini üretir. Önizleme taşma denetimi için kullanılır.
import pptxgen from 'pptxgenjs';
import { renk, slayt as S, yazi } from './tokenlar.mjs';
import { plan, fiyat, hesap, kademeler, sayi, tl, yuzde, avro } from './veri.mjs';
import { esc, tokenCss } from './sablon.mjs';
import { SORULAR, ADIMLAR, PERSONALAR, BIZ, SIZ, ILK_ADIMLAR } from './kitapcik.mjs';

const W = S.genislik, H = S.yukseklik, M = S.kenar;
const K = hesap.kapat, T = hesap.tanis;
const SATIR = 1.0; // PowerPoint satır aralığı çarpanı

// Öğe yapıcıları
const kutu = (x, y, w, h, renkAdi, ek = {}) => ({ t: 'rect', x, y, w, h, fill: renk[renkAdi], ...ek });
const daire = (x, y, d, renkAdi) => ({ t: 'ellipse', x, y, w: d, h: d, fill: renk[renkAdi] });
const yaz = (x, y, w, h, metin, o = {}) => ({ t: 'text', x, y, w, h, metin, boy: o.boy ?? S.govde, renk: renk[o.renk ?? 'murekkep'], kalin: o.kalin ?? false, hiza: o.hiza ?? 'left', dikey: o.dikey ?? 'top', satir: o.satir ?? SATIR });
const parca = (metin, renkAdi, kalin = true) => ({ metin, renk: renk[renkAdi], kalin });

const markaYazisi = (x, y, boy, koyu) => yaz(x, y, 3, boy / 50, [parca('i', 'turuncu'), parca('Stoc', koyu ? 'kagit' : 'murekkep')], { boy, kalin: true });
const ust = (koyu, sag) => [markaYazisi(M, 0.42, 18, koyu), yaz(W - M - 6, 0.46, 6, 0.32, sag, { boy: S.kucuk, renk: koyu ? 'solukKoyu' : 'soluk', hiza: 'right' })];
const alt = (n, koyu, sol = 'iStoc iş ortaklığı programı') => [
  yaz(M, H - 0.55, 8, 0.3, sol, { boy: S.kucuk, renk: koyu ? 'solukKoyu' : 'soluk' }),
  yaz(W - M - 2, H - 0.55, 2, 0.3, `${n} / 10`, { boy: S.kucuk, renk: koyu ? 'solukKoyu' : 'soluk', hiza: 'right' }),
];
const baslik = (metin, koyu = false, w = 11.4, h = 1.25) => yaz(M, 1.05, w, h, metin, { boy: S.baslik, kalin: true, renk: koyu ? 'kagit' : 'murekkep', satir: 0.95 });

function s1() {
  const op = [1, ...K.yillar.map((y) => 0.25 + (y.oran / K.oran) * 0.75)];
  const kare = [];
  const gx = (W - 2 * M - 47 * 0.04) / 48;
  op.forEach((o, yi) => { for (let a = 0; a < 12; a++) kare.push(kutu(M + (yi * 12 + a) * (gx + 0.04), 6.05, gx, 0.32, 'turuncu', { saydam: Math.round((1 - o) * 100) })); });
  return { zemin: 'murekkep', ogeler: [
    ...ust(true, 'İş ortaklığı programı'),
    yaz(M - 0.12, 0.8, 5.3, 5.05, '48', { boy: 300, kalin: true, renk: 'turuncu', satir: 0.9 }),
    yaz(5.2, 4.2, 1.3, 1.05, 'ay', { boy: 54, kalin: true, renk: 'turuncu' }),
    yaz(6.6, 1.75, 6.05, 2.2, 'Satışını kapattığınız müşteri size 48 ay pay getirir.', { boy: 38, kalin: true, renk: 'kagit', satir: 0.95 }),
    yaz(6.6, 4.1, 6.05, 0.8, 'iStoc iş ortaklığı programına sizi davet ediyoruz.', { boy: 20, renk: 'kagit' }),
    yaz(6.6, 4.95, 6.05, 0.75, 'Bu belge satıcı firmalara hizmet veren danışmanlar ve hizmet firmaları için hazırlandı.', { boy: S.kucuk + 1, renk: 'solukKoyu' }),
    ...kare,
    ...['1. yıl', ...K.yillar.map((y) => `${y.yil}. yıl`)].map((ad, i) => yaz(M + i * 12 * (gx + 0.04), 6.45, 2.8, 0.3, [parca(`${ad}  `, 'solukKoyu', false), parca(yuzde(op.length && i === 0 ? K.oran : K.yillar[i - 1].oran), 'turuncu')], { boy: S.kucuk })),
    yaz(M, H - 0.5, 9, 0.3, `Pay, müşteri ödemeye devam ettikçe sürer. Oranlar ${tl(plan.ornekCiro)} aylık cirolu örnektendir.`, { boy: S.kucuk - 1, renk: 'solukKoyu' }),
    yaz(W - M - 2, H - 0.5, 2, 0.3, 'istoc.com', { boy: S.kucuk - 1, renk: 'solukKoyu', hiza: 'right' }),
  ] };
}

function s2() {
  const sw = (W - 2 * M - 3 * 0.35) / 4;
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Neden siz'),
    baslik('Müşteriniz size her ay aynı soruyu soruyor mu?'),
    ...SORULAR.flatMap(([kim, soru, yanit], i) => {
      const x = M + i * (sw + 0.35);
      return [
        yaz(x, 2.55, sw, 0.6, kim, { boy: S.kucuk, renk: 'soluk', kalin: true }),
        yaz(x, 3.3, sw, 1.65, `“${soru}”`, { boy: 24, kalin: true, satir: 0.95 }),
        kutu(x, 5.05, sw, 0.07, 'turuncu'),
        yaz(x, 5.25, sw, 1.4, yanit, { boy: S.kucuk + 1 }),
      ];
    }),
    ...alt(2, false),
  ] };
}

function s3() {
  const sw = (W - 2 * M - 3 * 0.35) / 4;
  const sayilar = [[`${fiyat.denemeGun} gün`, 'Satıcı paketi ücretsiz dener.'], [avro(fiyat.basicAyEur), 'Basic paket ayda bu kadar tutar.'], [avro(fiyat.basicYilEur), 'Yıllık pakette 12 ay için 10 aylık bedel ödenir.'], [avro(fiyat.kurulumEur), 'Mağaza kurulumu bir kez bu kadar tutar.']];
  return { zemin: 'murekkep', ogeler: [
    ...ust(true, 'Müşterinizin ödediği bedel'),
    baslik('iStoc satıcının satışından komisyon almaz.', true),
    ...sayilar.flatMap(([b, a], i) => {
      const x = M + i * (sw + 0.35);
      return [kutu(x, 2.55, sw - 0.2, 0.06, 'turuncu'), yaz(x, 2.8, sw, 1.05, b, { boy: 56, kalin: true, renk: 'turuncu', satir: 0.95 }), yaz(x, 3.95, sw - 0.1, 1.2, a, { boy: S.govde + 2, renk: 'kagit' })];
    }),
    kutu(M, 5.75, W - 2 * M, 0.02, 'cizgiKoyu'),
    yaz(M, 5.95, W - 2 * M, 0.45, 'Fiyat herkes için aynıdır. Fiyatlara KDV dahil değildir. KDV, katma değer vergisidir.', { boy: S.kucuk + 1, renk: 'solukKoyu' }),
    ...alt(3, true),
  ] };
}

function s4() {
  const sw = (W - 2 * M - 5 * 0.25) / 6;
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Nasıl işler'),
    baslik('Altı adım var. İlk adım tek bir görüşmedir.'),
    kutu(M + 0.35, 3.0, W - 2 * M - sw, 0.05, 'kumKoyu'),
    ...ADIMLAR.flatMap(([b, m], i) => {
      const x = M + i * (sw + 0.25);
      const oge = [daire(x, 2.68, 0.68, 'turuncu'), yaz(x, 2.68, 0.68, 0.68, String(i + 1), { boy: 24, kalin: true, hiza: 'center', dikey: 'middle' }), yaz(x, 3.6, sw, 1.0, b, { boy: S.govde + 1, kalin: true })];
      if (m) oge.push(yaz(x, 4.65, sw, 1.7, m.split('. ')[0].replace(/\.$/, '') + '.', { boy: S.kucuk, renk: 'soluk' }));
      else oge.push(kutu(x, 4.65, sw, 0.95, 'kumKoyu'), yaz(x + 0.1, 4.72, sw - 0.2, 0.85, [parca('Satışı siz kapattıysanız\n', 'turuncuMetin'), parca('Siz kurarsınız.', 'murekkep', false)], { boy: S.kucuk }),
        kutu(x, 5.7, sw, 0.95, 'kum'), yaz(x + 0.1, 5.77, sw - 0.2, 0.85, [parca('Yalnız tanıştırdıysanız\n', 'turuncuMetin'), parca('Şirket kurar.', 'murekkep', false)], { boy: S.kucuk }));
      return oge;
    }),
    ...alt(4, false, 'Kurulumdan sonraki desteği her durumda şirket verir.'),
  ] };
}

/** Kota merdiveni: basamaklar ince dikdörtgenlerdir. Böylece PowerPoint'te düzenlenebilir kalır. */
function merdivenOgeleri(x0, y0, w, h) {
  const enCok = 150_000, ust0 = 0.32;
  const X = (c) => x0 + (c / enCok) * w;
  const Y = (o) => y0 + (1 - o / ust0) * h;
  const og = [];
  [0, 0.1, 0.2, 0.3].forEach((o) => { og.push(kutu(x0, Y(o), w, 0.012, 'cizgi'), yaz(x0 - 0.75, Y(o) - 0.14, 0.62, 0.3, `%${o * 100}`, { boy: S.kucuk, renk: 'soluk', hiza: 'right' })); });
  [0, 30_000, 60_000, 90_000, 120_000, 150_000].forEach((c) => og.push(yaz(X(c) - 0.6, y0 + h + 0.1, 1.2, 0.3, c ? `${sayi(c / 1000)} bin ₺` : '0 ₺', { boy: S.kucuk, renk: 'soluk', hiza: 'center' })));
  const cizgi = (k, renkAdi, kal, etiketRenk, yukari) => k.forEach((s, i) => {
    const son = i === k.length - 1 ? enCok : k[i + 1].esik;
    og.push(kutu(X(s.esik), Y(s.oran) - kal / 2, X(son) - X(s.esik), kal, renkAdi));
    if (i < k.length - 1) { const a = Y(k[i + 1].oran), b = Y(s.oran); og.push(kutu(X(son) - kal / 2, Math.min(a, b) - kal / 2, kal, Math.abs(b - a) + kal, renkAdi)); }
    og.push(yaz((X(s.esik) + X(son)) / 2 - 0.6, Y(s.oran) + (yukari ? -0.42 : 0.1), 1.2, 0.32, yuzde(s.oran), { boy: S.kucuk + 1, kalin: true, renk: etiketRenk, hiza: 'center' }));
  });
  cizgi(kademeler('tanistir'), 'murekkep', 0.035, 'murekkep', true);
  cizgi(kademeler('kapatir'), 'turuncu', 0.06, 'turuncuMetin', true);
  const ox = X(plan.ornekCiro);
  og.push(kutu(ox, y0, 0.012, h, 'soluk'), yaz(ox + 0.08, y0 - 0.02, 2.2, 0.3, `Örnek: ${tl(plan.ornekCiro)}`, { boy: S.kucuk, renk: 'soluk' }));
  return og;
}

function s5() {
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Kazanç planı'),
    baslik('Satışı kapatırsanız payınız %30’a kadar çıkar.', false, 11.6, 0.75),
    kutu(M, 2.05, 0.4, 0.07, 'turuncu'), yaz(M + 0.5, 1.93, 2.6, 0.32, 'Satışı kapatırsanız', { boy: S.kucuk, renk: 'soluk' }),
    kutu(M + 3.2, 2.06, 0.4, 0.04, 'murekkep'), yaz(M + 3.7, 1.93, 3, 0.32, 'Yalnız tanıştırırsanız', { boy: S.kucuk, renk: 'soluk' }),
    ...merdivenOgeleri(M + 0.85, 2.65, 7.3, 3.4),
    yaz(9.55, 2.5, 3.1, 1.2, yuzde(K.oran), { boy: 72, kalin: true, renk: 'turuncuMetin', satir: 0.9 }),
    yaz(9.55, 3.6, 3.1, 0.65, `${tl(plan.ornekCiro)} aylık ciroda satışı kapatırsanız`, { boy: S.kucuk }),
    yaz(9.55, 4.45, 3.1, 1.2, yuzde(T.oran), { boy: 72, kalin: true, satir: 0.9 }),
    yaz(9.55, 5.55, 3.1, 0.65, 'Aynı ciroda yalnız tanıştırırsanız', { boy: S.kucuk }),
    ...alt(5, false, 'Ulaştığınız kotanın oranı cironun tamamına uygulanır. Kesin oranlar yazılı anlaşmada belirlenir.'),
  ] };
}

function s6() {
  const donem = ['1. ile 12. ay', '13. ile 24. ay', '25. ile 36. ay', '37. ile 48. ay'];
  const k = [K.oran, ...plan.kapatir.gecmis.slice(0, 3)];
  const t = [T.oran, ...plan.tanistir.gecmis.slice(0, 3)];
  const x0 = M, taban = 6.15, yuk = 3.3, gw = (W - 2 * M) / 4, cw = 0.95;
  const Hh = (o) => (o / 0.2) * yuk;
  const og = [kutu(x0, taban, W - 2 * M, 0.015, 'soluk')];
  donem.forEach((d, i) => {
    const xa = x0 + i * gw + 0.55, xb = xa + cw + 0.12;
    og.push(kutu(xa, taban - Hh(k[i]), cw, Hh(k[i]), 'turuncu'), yaz(xa - 0.3, taban - Hh(k[i]) - 0.48, cw + 0.6, 0.42, yuzde(k[i]), { boy: 20, kalin: true, renk: 'turuncuMetin', hiza: 'center' }));
    if (t[i]) og.push(kutu(xb, taban - Hh(t[i]), cw, Hh(t[i]), 'murekkep'), yaz(xb - 0.3, taban - Hh(t[i]) - 0.48, cw + 0.6, 0.42, yuzde(t[i]), { boy: 20, kalin: true, hiza: 'center' }));
    else og.push(yaz(xb - 0.3, taban - 0.45, cw + 0.6, 0.4, 'Pay yok', { boy: S.kucuk, renk: 'soluk', hiza: 'center' }));
    og.push(yaz(x0 + i * gw, taban + 0.12, gw, 0.32, d, { boy: S.kucuk, renk: 'soluk', hiza: 'center' }));
  });
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Pay yıllara yayılır'),
    baslik('Pay 48 ay boyunca azalarak sürer.', false, 11.6, 0.75),
    kutu(M, 2.05, 0.4, 0.07, 'turuncu'), yaz(M + 0.5, 1.93, 2.6, 0.32, 'Satışı kapatırsanız', { boy: S.kucuk, renk: 'soluk' }),
    kutu(M + 3.2, 2.03, 0.4, 0.1, 'murekkep'), yaz(M + 3.7, 1.93, 3, 0.32, 'Yalnız tanıştırırsanız', { boy: S.kucuk, renk: 'soluk' }),
    ...og,
    ...alt(6, false, `İlk yıl ${tl(plan.ornekCiro)} aylık cirolu örnektir. Sonraki yıllarda oran o yılki ciroya uygulanır.`),
  ] };
}

function s7() {
  const kutuSayi = (x, w, ust1, alt1, renkAdi, yaziRenk) => [kutu(x, 2.55, w, 1.55, renkAdi), yaz(x + 0.25, 2.7, w - 0.5, 0.8, ust1, { boy: 36, kalin: true, renk: yaziRenk }), yaz(x + 0.25, 3.5, w - 0.5, 0.5, alt1, { boy: S.kucuk, renk: yaziRenk })];
  const isaret = (x, s) => yaz(x, 2.95, 0.6, 0.8, s, { boy: 40, kalin: true, hiza: 'center', renk: 'soluk' });
  const yil = [['İlk 12 ay', K.ilkYil], ...K.yillar.map((y) => [`${12 * (y.yil - 1) + 1}. ile ${12 * y.yil}. ay`, y.tutar])];
  const yw = 1.95;
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Örnek hesap'),
    baslik(`Ayda ${tl(plan.ornekCiro)} ciro, 4 yılda ${tl(K.toplam)} pay.`, false, 11.6, 0.75),
    yaz(M, 1.88, 11.6, 0.4, 'Bu bir örnektir. Müşteriler her ay toplam 50.000 ₺ öder. Müşteriler 48 ay kalır.', { boy: S.kucuk, renk: 'soluk' }),
    ...kutuSayi(M, 3.3, tl(K.ciro), 'Aylık ciro', 'kum', 'murekkep'),
    isaret(M + 3.35, '×'),
    ...kutuSayi(M + 4.0, 2.4, yuzde(K.oran), 'K1 kotasında oran', 'kum', 'murekkep'),
    isaret(M + 6.45, '='),
    ...kutuSayi(M + 7.1, 4.83, `ayda ${tl(K.aylik)}`, 'Satışı kapattığınızda payınız', 'turuncu', 'murekkep'),
    ...yil.flatMap(([ad, v], i) => {
      const x = M + i * (yw + 0.12);
      return [kutu(x, 4.55, yw, 0.05, 'murekkep'), yaz(x, 4.7, yw, 0.35, ad, { boy: S.kucuk, renk: 'soluk' }), yaz(x, 5.05, yw, 0.6, tl(v), { boy: 24, kalin: true })];
    }),
    kutu(M + 4 * (yw + 0.12), 4.55, W - 2 * M - 4 * (yw + 0.12), 1.55, 'murekkep'),
    yaz(M + 4 * (yw + 0.12) + 0.25, 4.7, 3.2, 0.35, 'Dört yılın toplamı', { boy: S.kucuk, renk: 'solukKoyu' }),
    yaz(M + 4 * (yw + 0.12) + 0.25, 5.05, 3.4, 0.75, tl(K.toplam), { boy: 36, kalin: true, renk: 'turuncu' }),
    yaz(M, 6.3, 11.6, 0.4, `Yalnız tanıştırırsanız oran ${yuzde(T.oran)} olur. Üç yılın toplamı ${tl(T.toplam)} eder. Vergi ve stopaj dahil değildir.`, { boy: S.kucuk, renk: 'soluk' }),
    ...alt(7, false),
  ] };
}

function s8() {
  const sw = (W - 2 * M) / 4;
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Dört persona'),
    baslik('Hangisi sizsiniz?', false, 11.6, 0.75),
    ...PERSONALAR.flatMap((p, i) => {
      const x = M + i * sw;
      const zemin = p.ana ? 'turuncu' : i % 2 ? 'kum' : 'kagit';
      return [
        kutu(x, 2.0, sw, 4.75, zemin),
        yaz(x + 0.25, 2.2, sw - 0.5, 0.65, p.buyuk, { boy: 28, kalin: true }),
        yaz(x + 0.25, 2.9, sw - 0.5, 0.45, p.ad, { boy: 20, kalin: true }),
        yaz(x + 0.25, 3.5, sw - 0.5, 1.0, p.kim, { boy: S.kucuk }),
        yaz(x + 0.25, 4.5, sw - 0.5, 0.3, 'Nasıl kazanır?', { boy: S.kucuk, kalin: true, renk: p.ana ? 'murekkep' : 'soluk' }),
        yaz(x + 0.25, 4.82, sw - 0.5, 0.85, p.kazanc, { boy: S.kucuk }),
        yaz(x + 0.25, 5.7, sw - 0.5, 0.3, 'Nasıl başlar?', { boy: S.kucuk, kalin: true, renk: p.ana ? 'murekkep' : 'soluk' }),
        yaz(x + 0.25, 6.0, sw - 0.5, 0.7, p.basla, { boy: S.kucuk }),
      ];
    }),
    ...alt(8, false, 'SGK, sosyal güvenlik kaydıdır.'),
  ] };
}

/** Alt alta metin listesi. Her madde iki satırlık eşit yer alır. Böylece aralık düzenli kalır. */
function yigin(x, y0, w, dizi, boy, ara, isaretRengi, yaziRengi) {
  const satirInc = (boy * 1.24) / 72;
  const h = 2 * satirInc + 0.02;
  return dizi.flatMap((m, i) => {
    const y = y0 + i * (h + ara);
    return [kutu(x, y + satirInc / 2 - 0.06, 0.12, 0.12, isaretRengi), yaz(x + 0.25, y, w - 0.25, h, m, { boy, renk: yaziRengi })];
  });
}

function s9() {
  const cw = (W - 2 * M) / 2;
  const liste = (x, dizi, koyu) => yigin(x + 0.35, 2.72, cw - 0.7, dizi, 14, 0.1, koyu ? 'turuncu' : 'murekkep', koyu ? 'kagit' : 'murekkep');
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Koşullar'),
    baslik('Kim ne yapar? Baştan yazılıdır.', false, 11.6, 0.75),
    kutu(M, 1.95, cw, 4.35, 'murekkep'), yaz(M + 0.35, 2.15, cw - 0.7, 0.5, 'Biz ne yaparız', { boy: 22, kalin: true, renk: 'turuncu' }), ...liste(M, BIZ, true),
    kutu(M + cw, 1.95, cw, 4.35, 'kumKoyu'), yaz(M + cw + 0.35, 2.15, cw - 0.7, 0.5, 'Siz ne yaparsınız', { boy: 22, kalin: true }), ...liste(M + cw, SIZ, false),
    yaz(M, 6.4, W - 2 * M, 0.45, 'İlk 12 ayın her birinde aylık ciro en az K1 kotası kadar olmalıdır. Bu belge sözleşme değildir.', { boy: S.kucuk, renk: 'soluk' }),
    ...alt(9, false, 'Kesin oranlar yazılı anlaşmada belirlenir.'),
  ] };
}

function s10() {
  return { zemin: 'murekkep', ogeler: [
    ...ust(true, 'İlk adım'),
    yaz(M, 1.4, 6.6, 1.9, 'Hangi müşterinizle başlarsınız?', { boy: 44, kalin: true, renk: 'kagit', satir: 0.95 }),
    ...ILK_ADIMLAR.flatMap((m, i) => [yaz(M, 3.55 + i * 0.62, 0.6, 0.5, String(i + 1), { boy: 24, kalin: true, renk: 'turuncu' }), yaz(M + 0.6, 3.6 + i * 0.62, 6.2, 0.5, m, { boy: 20, renk: 'kagit' })]),
    markaYazisi(8.1, 3.0, 28, true),
    yaz(8.1, 3.65, 4.6, 1.0, 'istoc.com', { boy: 54, kalin: true, renk: 'kagit' }),
    yaz(M, H - 0.55, 9, 0.3, 'Bu belge 23 Kasım 2026 Pazartesi günkü plana göre hazırlandı.', { boy: S.kucuk, renk: 'solukKoyu' }),
    yaz(W - M - 2, H - 0.55, 2, 0.3, '10 / 10', { boy: S.kucuk, renk: 'solukKoyu', hiza: 'right' }),
  ] };
}

export const SLAYTLAR = () => [s1(), s2(), s3(), s4(), s5(), s6(), s7(), s8(), s9(), s10()];
export const SLAYT_SAYISI = 10;

const hex = (h) => h.replace('#', '').toUpperCase();

export async function sunumPptx(hedef) {
  const p = new pptxgen();
  p.layout = 'LAYOUT_WIDE';
  p.title = 'iStoc iş ortaklığı programı';
  p.company = 'iStoc';
  p.theme = { headFontFace: yazi.aile, bodyFontFace: yazi.aile };
  for (const s of SLAYTLAR()) {
    const sl = p.addSlide();
    sl.background = { color: hex(renk[s.zemin]) };
    for (const o of s.ogeler) {
      if (o.t === 'rect' || o.t === 'ellipse') {
        sl.addShape(o.t === 'rect' ? p.ShapeType.rect : p.ShapeType.ellipse, { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: hex(o.fill), transparency: o.saydam ?? 0 }, line: { type: 'none' } });
      } else {
        const ortak = { fontFace: yazi.aile, fontSize: o.boy, color: hex(o.renk), bold: o.kalin };
        const metin = Array.isArray(o.metin)
          ? o.metin.map((r) => ({ text: r.metin, options: { ...ortak, color: hex(r.renk), bold: r.kalin, breakLine: false } }))
          : o.metin;
        sl.addText(metin, { x: o.x, y: o.y, w: o.w, h: o.h, ...ortak, align: o.hiza, valign: o.dikey, margin: 0, lineSpacingMultiple: o.satir, fit: 'none', wrap: true, autoFit: false });
      }
    }
  }
  await p.writeFile({ fileName: hedef, compression: true });
}

/** Tarayıcı önizlemesi. 1 inç 144 px, 1 pt 2 px olur. `font` Arial verilirse yedek yazı tipi denenir. */
export function sunumOnizlemeHtml(font = 'Outfit') {
  const px = (v) => `${(v * 144).toFixed(2)}px`;
  // PowerPoint tek satır aralığı yazı boyunun yaklaşık 1,2 katıdır. Önizleme bunu biraz geniş alır.
  const sat = (m) => (1.24 * m).toFixed(3);
  const slaytlar = SLAYTLAR().map((s) => `<div class="slayt" style="background:${renk[s.zemin]}">${s.ogeler.map((o) => {
    const yer = `left:${px(o.x)};top:${px(o.y)};width:${px(o.w)};height:${px(o.h)}`;
    if (o.t === 'rect') return `<div style="position:absolute;${yer};background:${o.fill};opacity:${1 - (o.saydam ?? 0) / 100}"></div>`;
    if (o.t === 'ellipse') return `<div style="position:absolute;${yer};background:${o.fill};border-radius:50%"></div>`;
    const ic = Array.isArray(o.metin) ? o.metin.map((r) => `<span style="color:${r.renk};font-weight:${r.kalin ? 700 : 400}">${esc(r.metin).replace(/\n/g, '<br>')}</span>`).join('') : esc(o.metin).replace(/\n/g, '<br>');
    const dikey = o.dikey === 'middle' ? 'center' : o.dikey === 'bottom' ? 'flex-end' : 'flex-start';
    return `<div class="kutu" style="position:absolute;${yer};font-size:${o.boy * 2}px;line-height:${sat(o.satir)};color:${o.renk};font-weight:${o.kalin ? 700 : 400};text-align:${o.hiza};display:flex;flex-direction:column;justify-content:${dikey}"><div>${ic}</div></div>`;
  }).join('')}</div>`).join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>iStoc sunum önizlemesi</title><style>
${tokenCss()}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #777; font-family: ${font === 'Outfit' ? "'Outfit'" : 'Arial'}, sans-serif; }
.slayt { width: 1920px; height: 1080px; position: relative; overflow: hidden; margin-bottom: 20px; }
.kutu { overflow: hidden; overflow-wrap: normal; word-break: normal; }
</style></head><body>${slaytlar}</body></html>`;
}
