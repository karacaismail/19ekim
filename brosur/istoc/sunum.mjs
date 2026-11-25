// Sunum: 16:9, 10 slayt. Her slayt tek bir öğe listesidir (inç cinsinden konum).
// Kullanıcı kararı 25 Kasım 2026 Çarşamba: tutarlar euro olur. Örnek, büyüyen müşteri senaryosudur. Kadrolu uzman bilgisi yoktur.
// Aynı liste hem PPTX dosyasını hem tarayıcı önizlemesini üretir. Önizleme taşma denetimi için kullanılır.
import pptxgen from 'pptxgenjs';
import { renk, slayt as S } from './tokenlar.mjs';
import { plan, fiyat, hesap, kademeler, anlar, kur12, sayi, tl, yuzde, avro, avroTam } from './veri.mjs';
import { pathToFileURL } from 'node:url';
import { esc, tokenCss, LOGO } from './sablon.mjs';
import { SORULAR, ADIMLAR, PERSONALAR, BIZ, SIZ, ILK_ADIMLAR } from './kitapcik.mjs';

const W = S.genislik, H = S.yukseklik, M = S.kenar;
const K = hesap.kapat, T = hesap.tanis;
const KA = anlar(K), TA = anlar(T);
const kap = kademeler('kapatir'), tan = kademeler('tanistir');
const ay12 = KA.find((a) => a.n === 12), ay48 = KA.at(-1);
/** 1. yıl K3 oranı, sonraki yıllar 13. aydan sonraki oranlardır. */
const KAPAK_ORANLARI = [kap.at(-1).oran, ...plan.kapatir.gecmis.slice(0, 3)];
const SATIR = 1.0; // PowerPoint satır aralığı çarpanı

// Öğe yapıcıları
// `kenar` verilirse dikdörtgenin ince bir kenar çizgisi olur. Açık zeminde sarı şekil böyle zeminden ayrılır.
const kutu = (x, y, w, h, renkAdi, ek = {}) => ({ t: 'rect', x, y, w, h, fill: renk[renkAdi], ...ek, kenar: ek.kenar ? renk[ek.kenar] : undefined });
const daire = (x, y, d, renkAdi) => ({ t: 'ellipse', x, y, w: d, h: d, fill: renk[renkAdi] });
const yaz = (x, y, w, h, metin, o = {}) => ({ t: 'text', x, y, w, h, metin, boy: o.boy ?? S.govde, renk: renk[o.renk ?? 'murekkep'], kalin: o.kalin ?? false, hiza: o.hiza ?? 'left', dikey: o.dikey ?? 'top', satir: o.satir ?? SATIR });
const parca = (metin, renkAdi, kalin = true) => ({ metin, renk: renk[renkAdi], kalin });

// Thoptan logosu. Yalnız genişlik verilir, yükseklik oranla gelir. Logo en çok 2,2 inç genişlikte olur.
const LOGO_EN_GENIS = 2.2;
const logo = (x, y, w, koyu) => {
  if (w > LOGO_EN_GENIS) throw new Error(`Logo ${w} inç olamaz. En çok ${LOGO_EN_GENIS} inç olur.`);
  return { t: 'image', x, y, w, h: w / LOGO.oran, yol: koyu ? LOGO.koyu : LOGO.acik };
};
const ust = (koyu, sag) => [logo(M, 0.38, 1.4, koyu), yaz(W - M - 6, 0.46, 6, 0.32, sag, { boy: S.kucuk, renk: koyu ? 'solukKoyu' : 'soluk', hiza: 'right' })];
const alt = (n, koyu, sol = 'Thoptan iş ortaklığı tanıtım sunumu') => [
  yaz(M, H - 0.55, 6, 0.3, sol, { boy: S.kucuk, renk: koyu ? 'solukKoyu' : 'soluk' }),
  yaz(W - M - 5.6, H - 0.55, 3.4, 0.3, 'Connect to iStoc.com', { boy: S.kucuk, kalin: true, renk: koyu ? 'solukKoyu' : 'soluk', hiza: 'right' }),
  yaz(W - M - 2, H - 0.55, 2, 0.3, `${n} / 10`, { boy: S.kucuk, renk: koyu ? 'solukKoyu' : 'soluk', hiza: 'right' }),
];
const baslik = (metin, koyu = false, w = 11.4, h = 1.25, boy = S.baslik) => yaz(M, 1.05, w, h, metin, { boy, kalin: true, renk: koyu ? 'kagit' : 'murekkep', satir: 0.95 });

function s1() {
  const op = KAPAK_ORANLARI.map((o, i) => (i ? 0.25 + (o / KAPAK_ORANLARI[0]) * 0.75 : 1));
  const kare = [];
  const gx = (W - 2 * M - 47 * 0.04) / 48;
  op.forEach((o, yi) => { for (let a = 0; a < 12; a++) kare.push(kutu(M + (yi * 12 + a) * (gx + 0.04), 5.95, gx, 0.32, o === 1 ? 'sari' : 'solukKoyu', { saydam: Math.round((1 - o) * 100) })); });
  return { zemin: 'murekkep', ogeler: [
    yaz(W - M - 6, 0.46, 6, 0.32, 'İş ortaklığı programı', { boy: S.kucuk, renk: 'solukKoyu', hiza: 'right' }),
    logo(6.3, 0.4, 2.2, true),
    yaz(6.3, 1.05, 3, 0.3, 'Connect to iStoc.com', { boy: S.kucuk, kalin: true, renk: 'solukKoyu' }),
    yaz(6.3, 1.35, 6.35, 0.3, 'Thoptan ile istoc.com ağına bağlanırsınız.', { boy: S.kucuk, renk: 'solukKoyu' }),
    yaz(6.3, 1.8, 6.35, 0.4, 'Thoptan iş ortaklığı tanıtım sunumu', { boy: 18, kalin: true, renk: 'sari' }),
    yaz(M - 0.1, 0.75, 5.0, 4.6, '48', { boy: 280, kalin: true, renk: 'sari', satir: 0.9 }),
    yaz(M + 0.1, 4.55, 2.2, 0.95, 'aya kadar', { boy: 32, kalin: true, renk: 'sari' }),
    yaz(6.3, 2.25, 6.35, 1.75, 'Satışını kapattığınız müşteri size 48 aya kadar pay getirir.', { boy: 32, kalin: true, renk: 'kagit', satir: 0.95 }),
    yaz(6.3, 4.05, 6.35, 0.75, 'Thoptan iş ortaklığı programına sizi davet ediyoruz.', { boy: 20, renk: 'kagit' }),
    yaz(6.3, 4.85, 6.35, 0.95, `Pay en çok 48 ay sürer. Bunun için müşteriler ilk 12 ayın her ayında en az ${avro(plan.kapatir.esik[0])} ödemelidir.`, { boy: S.kucuk + 1, renk: 'solukKoyu' }),
    ...kare,
    ...KAPAK_ORANLARI.map((o, i) => yaz(M + i * 12 * (gx + 0.04), 6.35, 2.8, 0.3, [parca(`${i + 1}. yıl  `, 'solukKoyu', false), parca(yuzde(o), 'sari')], { boy: S.kucuk })),
    yaz(M, H - 0.55, 9, 0.3, 'Oranlar K3 seviyesinde satışı kapatma oranlarıdır. Kesin değerler yazılı anlaşmada belirlenir.', { boy: S.kucuk - 1, renk: 'solukKoyu' }),
    yaz(W - M - 2, H - 0.55, 2, 0.3, 'thoptan.com', { boy: S.kucuk - 1, renk: 'solukKoyu', hiza: 'right' }),
  ] };
}

function s2() {
  const sw = (W - 2 * M - 2 * 0.35) / 3;
  const sayilar = [[`${fiyat.denemeGun} gün`, 'Satıcı paketi ücretsiz dener.'], [avro(fiyat.basicAyEur), 'Basic paket ayda bu kadar tutar.'], ['%0', 'Thoptan satıcının satışından komisyon almaz.']];
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Neden siz'),
    baslik('Müşteriniz size her ay aynı soruyu soruyor mu?', false, 11.9, 0.75),
    ...SORULAR.flatMap(([kim, soru, yanit], i) => {
      const x = M + i * (sw + 0.35);
      return [
        yaz(x, 1.95, sw, 0.5, kim, { boy: S.kucuk, renk: 'soluk', kalin: true }),
        yaz(x, 2.5, sw, 1.2, `“${soru}”`, { boy: 19, kalin: true, satir: 0.95 }),
        kutu(x, 3.75, sw, 0.06, 'sari'),
        yaz(x, 3.9, sw, 1.0, yanit, { boy: S.kucuk }),
      ];
    }),
    kutu(0, 5.05, W, H - 5.05, 'murekkep'),
    ...sayilar.flatMap(([b, a], i) => {
      const x = M + i * (sw + 0.35);
      return [yaz(x, 5.25, sw, 0.6, b, { boy: 34, kalin: true, renk: 'sari' }), yaz(x, 5.9, sw, 0.6, a, { boy: S.kucuk, renk: 'kagit' })];
    }),
    ...alt(2, true),
  ] };
}

function s3() {
  const sw = (W - 2 * M - 5 * 0.25) / 6;
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Nasıl işler'),
    baslik('Altı adım var. İlk adım tek bir görüşmedir.', false, 11.9, 0.75),
    kutu(M + 0.35, 2.65, W - 2 * M - sw, 0.05, 'kumKoyu'),
    ...ADIMLAR.flatMap(([b, m], i) => {
      const x = M + i * (sw + 0.25);
      const oge = [daire(x, 2.33, 0.68, 'sari'), yaz(x, 2.33, 0.68, 0.68, String(i + 1), { boy: 24, kalin: true, hiza: 'center', dikey: 'middle' }), yaz(x, 3.25, sw, 1.0, b, { boy: S.govde, kalin: true })];
      if (m) oge.push(yaz(x, 4.3, sw, 1.9, m.split('. ')[0].replace(/\.$/, '') + '.', { boy: S.kucuk, renk: 'soluk' }));
      else oge.push(kutu(x, 4.3, sw, 1.0, 'kumKoyu'), yaz(x + 0.1, 4.37, sw - 0.2, 0.9, [parca('Satışı siz kapattıysanız\n', 'murekkep'), parca('Siz kurarsınız.', 'murekkep', false)], { boy: S.kucuk }),
        kutu(x, 5.4, sw, 1.0, 'kum'), yaz(x + 0.1, 5.47, sw - 0.2, 0.9, [parca('Yalnız tanıştırdıysanız\n', 'murekkep'), parca('Şirket kurar.', 'murekkep', false)], { boy: S.kucuk }));
      return oge;
    }),
    yaz(M, 6.5, 8.3, 0.35, 'Kurulumdan sonraki desteği her durumda şirket verir.', { boy: S.kucuk, renk: 'soluk' }),
    ...alt(3, false),
  ] };
}
/** Kota merdiveni: basamaklar ince dikdörtgenlerdir. Böylece PowerPoint'te düzenlenebilir kalır. */
function merdivenOgeleri(x0, y0, w, h) {
  const enCok = Math.ceil((kap.at(-1).esik * 1.25) / 1000) * 1000, ust0 = 0.32;
  const X = (c) => x0 + (c / enCok) * w;
  const Y = (o) => y0 + (1 - o / ust0) * h;
  const og = [];
  [0, 0.1, 0.2, 0.3].forEach((o) => { og.push(kutu(x0, Y(o), w, 0.012, 'cizgi'), yaz(x0 - 0.75, Y(o) - 0.14, 0.62, 0.3, `%${o * 100}`, { boy: S.kucuk, renk: 'soluk', hiza: 'right' })); });
  [0, 1, 2, 3, 4].map((i) => (enCok / 4) * i).forEach((c) => og.push(yaz(X(c) - 0.6, y0 + h + 0.1, 1.2, 0.3, `${sayi(c)} €`, { boy: S.kucuk, renk: 'soluk', hiza: 'center' })));
  // etiketRenk boşsa yalnız çizgi çizilir. Açık zeminde sarı çizginin altına lacivert bir kenar çizilir.
  const cizgi = (k, renkAdi, kal, etiketRenk, yukari) => k.forEach((s, i) => {
    const son = i === k.length - 1 ? enCok : k[i + 1].esik;
    og.push(kutu(X(s.esik), Y(s.oran) - kal / 2, X(son) - X(s.esik), kal, renkAdi));
    if (i < k.length - 1) { const a = Y(k[i + 1].oran), b = Y(s.oran); og.push(kutu(X(son) - kal / 2, Math.min(a, b) - kal / 2, kal, Math.abs(b - a) + kal, renkAdi)); }
    if (etiketRenk) og.push(yaz((X(s.esik) + X(son)) / 2 - 0.6, Y(s.oran) + (yukari ? -0.42 : 0.1), 1.2, 0.32, yuzde(s.oran), { boy: S.kucuk + 1, kalin: true, renk: etiketRenk, hiza: 'center' }));
  });
  cizgi(kademeler('tanistir'), 'murekkep', 0.035, 'murekkep', true);
  cizgi(kademeler('kapatir'), 'murekkep', 0.1, null, true);
  cizgi(kademeler('kapatir'), 'sari', 0.06, 'lacivert', true);
  return og;
}

function s4() {
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Kazanç planı'),
    baslik('Satışı kapatırsanız payınız %30’a kadar çıkar.', false, 11.9, 0.75),
    kutu(M, 2.03, 0.4, 0.1, 'sari', { kenar: 'murekkep' }), yaz(M + 0.5, 1.93, 2.6, 0.32, 'Satışı kapatırsanız', { boy: S.kucuk, renk: 'soluk' }),
    kutu(M + 3.2, 2.06, 0.4, 0.04, 'murekkep'), yaz(M + 3.7, 1.93, 3, 0.32, 'Yalnız tanıştırırsanız', { boy: S.kucuk, renk: 'soluk' }),
    ...merdivenOgeleri(M + 0.85, 2.65, 7.3, 3.3),
    yaz(9.45, 2.4, 3.2, 1.05, yuzde(kap.at(-1).oran), { boy: 60, kalin: true, renk: 'lacivert', satir: 0.9 }),
    yaz(9.45, 3.4, 3.2, 0.65, `${avro(kap.at(-1).esik)} ve üstü aylık ciroda satışı kapatırsanız`, { boy: S.kucuk }),
    yaz(9.45, 4.15, 3.2, 1.05, yuzde(tan.at(-1).oran), { boy: 60, kalin: true, satir: 0.9 }),
    yaz(9.45, 5.15, 3.2, 0.65, 'Aynı ciroda yalnız tanıştırırsanız', { boy: S.kucuk }),
    yaz(M, 6.4, 11.9, 0.4, 'Eşikler ve oranlar bugünkü plandır. Kesin değerler yazılı anlaşmada belirlenir.', { boy: S.govde - 1, kalin: true }),
    ...alt(4, false),
  ] };
}

/** Tablo: satırlar ince çizgiyle ayrılır. Vurgulu sütunun zemini kum rengidir. */
function tablo(x, y0, sutunlar, satirlar, { satirH = 0.42, boy = S.kucuk, vurgu = [], vurguSatir = -1 } = {}) {
  const og = [];
  const w = sutunlar.reduce((t, s) => t + s.w, 0);
  let cx = x;
  sutunlar.forEach((s, i) => {
    if (vurgu.includes(i)) og.push(kutu(cx, y0, s.w, satirH * (satirlar.length + 1), 'kum'));
    og.push(yaz(cx + 0.1, y0 + 0.07, s.w - 0.2, satirH - 0.07, s.ad, { boy, kalin: true }));
    cx += s.w;
  });
  if (vurguSatir >= 0) og.push(kutu(x, y0 + satirH * (vurguSatir + 1), w, satirH, 'kumKoyu'));
  og.push(kutu(x, y0 + satirH - 0.02, w, 0.035, 'murekkep'));
  satirlar.forEach((satir, r) => {
    const y = y0 + satirH * (r + 1);
    if (r) og.push(kutu(x, y, w, 0.012, 'cizgi'));
    let sx = x;
    satir.forEach((hucre, i) => {
      og.push(yaz(sx + 0.1, y + 0.07, sutunlar[i].w - 0.2, satirH - 0.07, hucre, { boy, kalin: i > 0 && vurgu.includes(i), renk: i > 0 && vurgu.includes(i) ? 'lacivert' : 'murekkep' }));
      sx += sutunlar[i].w;
    });
  });
  return og;
}

function s5() {
  const donem = (i) => `${12 * (i + 1) + 1}. ile ${12 * (i + 2)}. ay`;
  return { zemin: 'kagit', ogeler: [
    ...ust(false, '13. aydan sonraki oranlar'),
    baslik('Pay 48 aya kadar azalarak sürer.', false, 11.9, 0.75),
    yaz(M, 1.85, 11.9, 0.4, 'Müşteri ödemeye devam ederse satıcı bu aylarda bu oranı alır.', { boy: S.govde, renk: 'soluk' }),
    yaz(M, 2.45, 8, 0.45, '13. aydan sonraki oranlar', { boy: 20, kalin: true }),
    ...tablo(M, 3.0, [{ ad: 'Dönem', w: 3.6 }, { ad: 'Yalnız tanıştırırsanız', w: 3.6 }, { ad: 'Satışı kapatırsanız', w: 3.6 }],
      plan.kapatir.gecmis.map((g, i) => [donem(i), yuzde(plan.tanistir.gecmis[i]), yuzde(g)]), { satirH: 0.55, boy: S.govde, vurgu: [2] }),
    yaz(M, 5.95, 11.9, 0.35, 'İlk 12 ayda kotanızın oranını alırsınız. Oran %0 olunca pay biter.', { boy: S.kucuk, renk: 'soluk' }),
    yaz(M, 6.4, 11.9, 0.4, 'Ciro tek bir ay K1 kotasının altında kalırsa 13. aydan sonra pay alınmaz.', { boy: S.govde - 1, kalin: true }),
    ...alt(5, false),
  ] };
}

function s6() {
  const sw = (W - 2 * M - 3 * 0.12) / 4;
  const kw = (W - 2 * M - 5 * 0.1) / 6;
  const seviye = kap.map((k, i) => {
    const x = M + 5.0 + i * ((W - 2 * M - 5.0 - 3 * 0.08) / 4 + 0.08);
    const w = (W - 2 * M - 5.0 - 3 * 0.08) / 4;
    return [kutu(x, 1.95, w, 1.05, i === 3 ? 'sari' : 'kum'),
      yaz(x + 0.1, 1.98, w - 0.2, 0.4, i ? `K${i}` : 'K0', { boy: 20, kalin: true, renk: i === 3 ? 'murekkep' : 'lacivert' }),
      yaz(x + 0.1, 2.36, w - 0.2, 0.3, yuzde(k.oran), { boy: S.kucuk, kalin: true }),
      yaz(x + 0.1, 2.64, w - 0.2, 0.3, i ? `${K.seviyeAyi[i - 1]}. ay` : 'Başlangıç', { boy: S.kucuk })];
  }).flat();
  const tas = KA.flatMap((a, i) => {
    const x = M + i * (kw + 0.1);
    const zemin = i === KA.length - 1 ? 'sari' : i >= 3 ? 'kumKoyu' : 'kum';
    return [kutu(x, 3.3, kw, 2.75, zemin), kutu(x, 3.3, kw, 0.06, 'murekkep'),
      yaz(x + 0.12, 3.45, kw - 0.24, 0.4, a.ad, { boy: 18, kalin: true }),
      yaz(x + 0.12, 3.85, kw - 0.24, 0.3, `${a.musteri} müşteri`, { boy: S.kucuk }),
      yaz(x + 0.12, 4.3, kw - 0.24, 0.3, 'O ay', { boy: S.kucuk }),
      yaz(x + 0.12, 4.58, kw - 0.24, 0.4, avro(a.kazancEur), { boy: 18, kalin: true }),
      yaz(x + 0.12, 5.05, kw - 0.24, 0.3, 'Toplam', { boy: S.kucuk }),
      yaz(x + 0.12, 5.33, kw - 0.24, 0.5, avro(a.toplamEur), { boy: 22, kalin: true, renk: i === KA.length - 1 ? 'murekkep' : 'lacivert' })];
  });
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Büyüyen müşteri senaryosu'),
    baslik(`12. ayda her ay ${avroTam(ay12.kazanc)} kazanırsınız.`, false, 11.9, 0.75),
    yaz(M, 1.95, 4.7, 1.25, `Bu gerçekçi senaryoda her ay ${K.yeni} yeni müşteri getirirsiniz. Her müşteri Basic paket için ayda ${avro(fiyat.basicAyEur)} öder. Müşteriler ${plan.musteriAy} ay kalır. Satışı siz kapatırsınız.`, { boy: S.kucuk, renk: 'soluk' }),
    ...seviye,
    ...tas,
    yaz(M, 6.15, 11.9, 0.35, `${K.seviyeAyi[2]}. ayda K3 seviyesine çıkarsınız. 4 yılın toplamı ${avroTam(ay48.toplam)} olur.`, { boy: S.kucuk, kalin: true }),
    yaz(M, 6.5, 11.9, 0.35, 'Bu bir örnek senaryodur. Kazanç garantisi değildir.', { boy: S.kucuk, kalin: true }),
    ...alt(6, false),
  ] };
}

function s7() {
  const Sn = hesap.senaryolar;
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Senaryoları karşılaştırın'),
    baslik('Her yeni müşteri kazancınızı büyütür.', false, 11.9, 0.75),
    yaz(M, 1.9, 6.9, 0.4, 'İki yol, gerçekçi senaryo', { boy: 18, kalin: true }),
    ...tablo(M, 2.35, [{ ad: 'Zaman', w: 1.75 }, { ad: 'Kapatma: o ay', w: 1.75 }, { ad: 'Kapatma: toplam', w: 1.85 }, { ad: 'Tanıştırma: toplam', w: 1.95 }],
      KA.map((a, i) => [a.ad, avro(a.kazancEur), avro(a.toplamEur), avro(TA[i].toplamEur)]), { vurgu: [1, 2] }),
    yaz(M, 5.4, 6.9, 0.35, 'Satışı kapatırsanız kazancınız yaklaşık 2 kat olur.', { boy: S.kucuk, renk: 'soluk' }),
    yaz(M + 7.6, 1.9, 4.3, 0.4, 'Üç senaryo, satışı kapatırsanız', { boy: 18, kalin: true }),
    ...tablo(M + 7.6, 2.35, [{ ad: 'Senaryo', w: 1.35 }, { ad: 'Ayda yeni', w: 1.15 }, { ad: '4 yıl toplamı', w: 1.8 }],
      Sn.map((x) => [x.ad, String(x.yeniMusteri), avroTam(x.kapat.aylar.at(-1).toplam)]), { vurguSatir: Sn.findIndex((x) => x.ana) }),
    kutu(M + 7.6, 4.25, 4.3, 1.5, 'kumKoyu'),
    yaz(M + 7.75, 4.3, 4.0, 0.3, 'Kur bilgisi', { boy: S.kucuk, kalin: true }),
    yaz(M + 7.75, 4.6, 4.0, 0.6, `1 € = ${sayi(kur12.kur)} TL. 12. ay kazancı ${avro(kur12.eur)} yaklaşık ${tl(kur12.tl)} eder.`, { boy: S.kucuk }),
    yaz(M + 7.75, 5.15, 4.0, 0.6, `Kur ${kur12.tarih} günkü değerdir. Kur değişince TL tutarı da değişir.`, { boy: S.kucuk }),
    yaz(M, 6.0, 11.9, 0.35, `İlk ay en az ${K.yeni} müşteri getirin. Böylece K1 kotası her ay tutar.`, { boy: S.kucuk, kalin: true }),
    yaz(M, 6.4, 11.9, 0.35, 'Bu bir örnek senaryodur. Kazanç garantisi değildir.', { boy: S.kucuk, kalin: true }),
    ...alt(7, false),
  ] };
}

function s8() {
  const sw = (W - 2 * M) / 3;
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Üç ortaklık yolu'),
    baslik('Hangisi sizsiniz?', false, 11.9, 0.75),
    ...PERSONALAR.flatMap((p, i) => {
      const x = M + i * sw;
      const zemin = p.ana ? 'sari' : i % 2 ? 'kum' : 'kagit';
      return [
        kutu(x, 1.9, sw, 4.45, zemin),
        yaz(x + 0.2, 2.05, sw - 0.4, 0.5, p.buyuk, { boy: 24, kalin: true }),
        yaz(x + 0.2, 2.6, sw - 0.4, 0.45, p.ad, { boy: 18, kalin: true }),
        yaz(x + 0.2, 3.1, sw - 0.4, 0.95, p.kim, { boy: S.kucuk }),
        yaz(x + 0.2, 4.05, sw - 0.4, 0.3, 'Nasıl kazanır?', { boy: S.kucuk, kalin: true, renk: p.ana ? 'murekkep' : 'soluk' }),
        yaz(x + 0.2, 4.35, sw - 0.4, 1.0, p.kazanc, { boy: S.kucuk }),
        yaz(x + 0.2, 5.35, sw - 0.4, 0.3, 'Nasıl başlar?', { boy: S.kucuk, kalin: true, renk: p.ana ? 'murekkep' : 'soluk' }),
        yaz(x + 0.2, 5.65, sw - 0.4, 0.68, p.basla, { boy: S.kucuk }),
      ];
    }),
    yaz(M, 6.45, 11.9, 0.35, 'Her yolun kendi kazancı ve kendi ilk adımı var.', { boy: S.kucuk, renk: 'soluk' }),
    ...alt(8, false),
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
  const liste = (x, dizi, koyu) => yigin(x + 0.35, 2.45, cw - 0.7, dizi, 13, 0.13, koyu ? 'sari' : 'murekkep', koyu ? 'kagit' : 'murekkep');
  return { zemin: 'kagit', ogeler: [
    ...ust(false, 'Koşullar'),
    baslik('Kim ne yapar? Baştan yazılıdır.', false, 11.9, 0.75),
    kutu(M, 1.8, cw, 4.3, 'murekkep'), yaz(M + 0.35, 1.95, cw - 0.7, 0.45, 'Biz ne yaparız', { boy: 20, kalin: true, renk: 'sari' }), ...liste(M, BIZ, true),
    kutu(M + cw, 1.8, cw, 4.3, 'kumKoyu'), yaz(M + cw + 0.35, 1.95, cw - 0.7, 0.45, 'Siz ne yaparsınız', { boy: 20, kalin: true }), ...liste(M + cw, SIZ, false),
    yaz(M, 6.2, 11.9, 0.7, 'İlk 12 ayın her birinde aylık ciro en az K1 kotası kadar olmalıdır. Ciro tek bir ay K1 kotasının altında kalırsa 13. aydan sonra pay alınmaz. Bu belge sözleşme değildir.', { boy: S.kucuk, kalin: true }),
    ...alt(9, false),
  ] };
}

function s10() {
  return { zemin: 'murekkep', ogeler: [
    ...ust(true, 'İlk adım'),
    yaz(M, 1.4, 6.6, 1.9, 'Hangi müşterinizle başlarsınız?', { boy: 40, kalin: true, renk: 'kagit', satir: 0.95 }),
    ...ILK_ADIMLAR.flatMap((m, i) => [yaz(M, 3.55 + i * 0.62, 0.6, 0.5, String(i + 1), { boy: 24, kalin: true, renk: 'sari' }), yaz(M + 0.6, 3.6 + i * 0.62, 6.4, 0.5, m, { boy: 19, renk: 'kagit' })]),
    logo(8.1, 2.55, 2.2, true),
    yaz(8.1, 3.2, 4.6, 0.35, 'Connect to iStoc.com', { boy: 16, kalin: true, renk: 'solukKoyu' }),
    yaz(8.1, 3.65, 4.6, 1.0, 'thoptan.com', { boy: 50, kalin: true, renk: 'kagit' }),
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
  p.title = 'Thoptan iş ortaklığı tanıtım sunumu';
  p.company = 'Thoptan';
  p.theme = { headFontFace: S.yazi, bodyFontFace: S.yazi };
  for (const s of SLAYTLAR()) {
    const sl = p.addSlide();
    sl.background = { color: hex(renk[s.zemin]) };
    for (const o of s.ogeler) {
      if (o.t === 'image') {
        sl.addImage({ path: o.yol, x: o.x, y: o.y, w: o.w, h: o.h, altText: 'Thoptan' });
      } else if (o.t === 'rect' || o.t === 'ellipse') {
        const line = o.kenar ? { color: hex(o.kenar), width: 1 } : { type: 'none' };
        sl.addShape(o.t === 'rect' ? p.ShapeType.rect : p.ShapeType.ellipse, { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: hex(o.fill), transparency: o.saydam ?? 0 }, line });
      } else {
        const ortak = { fontFace: S.yazi, fontSize: o.boy, color: hex(o.renk), bold: o.kalin };
        const metin = Array.isArray(o.metin)
          ? o.metin.map((r) => ({ text: r.metin, options: { ...ortak, color: hex(r.renk), bold: r.kalin, breakLine: false } }))
          : o.metin;
        sl.addText(metin, { x: o.x, y: o.y, w: o.w, h: o.h, ...ortak, align: o.hiza, valign: o.dikey, margin: 0, lineSpacingMultiple: o.satir, fit: 'none', wrap: true, autoFit: false });
      }
    }
  }
  await p.writeFile({ fileName: hedef, compression: true });
}

/** Tarayıcı önizlemesi. 1 inç 144 px, 1 pt 2 px olur. PPTX gibi Arial kullanır. */
export function sunumOnizlemeHtml() {
  const px = (v) => `${(v * 144).toFixed(2)}px`;
  // PowerPoint tek satır aralığı yazı boyunun yaklaşık 1,2 katıdır. Önizleme bunu biraz geniş alır.
  const sat = (m) => (1.24 * m).toFixed(3);
  const slaytlar = SLAYTLAR().map((s) => `<div class="slayt" style="background:${renk[s.zemin]}">${s.ogeler.map((o) => {
    const yer = `left:${px(o.x)};top:${px(o.y)};width:${px(o.w)};height:${px(o.h)}`;
    if (o.t === 'image') return `<img alt="Thoptan" src="${pathToFileURL(o.yol).href}" style="position:absolute;${yer}">`;
    if (o.t === 'rect') return `<div style="position:absolute;${yer};background:${o.fill};opacity:${1 - (o.saydam ?? 0) / 100}${o.kenar ? `;box-shadow:inset 0 0 0 2px ${o.kenar}` : ''}"></div>`;
    if (o.t === 'ellipse') return `<div style="position:absolute;${yer};background:${o.fill};border-radius:50%"></div>`;
    const ic = Array.isArray(o.metin) ? o.metin.map((r) => `<span style="color:${r.renk};font-weight:${r.kalin ? 700 : 400}">${esc(r.metin).replace(/\n/g, '<br>')}</span>`).join('') : esc(o.metin).replace(/\n/g, '<br>');
    const dikey = o.dikey === 'middle' ? 'center' : o.dikey === 'bottom' ? 'flex-end' : 'flex-start';
    return `<div class="kutu" style="position:absolute;${yer};font-size:${o.boy * 2}px;line-height:${sat(o.satir)};color:${o.renk};font-weight:${o.kalin ? 700 : 400};text-align:${o.hiza};display:flex;flex-direction:column;justify-content:${dikey}"><div>${ic}</div></div>`;
  }).join('')}</div>`).join('');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Thoptan sunum önizlemesi</title><style>
${tokenCss()}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #777; font-family: ${S.yazi}, sans-serif; }
.slayt { width: 1920px; height: 1080px; position: relative; overflow: hidden; margin-bottom: 20px; }
.kutu { overflow: hidden; overflow-wrap: normal; word-break: normal; }
</style></head><body>${slaytlar}</body></html>`;
}
