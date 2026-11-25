// El kitapçığı: A4 dikey, 9 sayfa. Okunacak belgedir. Koşullar, süreç ve hesap örnekleri eksiksiz yazılır.
// Kullanıcı kararı 25 Kasım 2026 Çarşamba: tutarlar euro olur. Örnek, büyüyen müşteri senaryosudur. Kadrolu uzman bilgisi yoktur.
import { a4 } from './tokenlar.mjs';
import { plan, fiyat, tavsiye, hesap, kademeler, anlar, kur12, sayi, tl, yuzde, avro, avroTam, liraHap, kurDipnotu } from './veri.mjs';
import { sayfaIskeleti, logo, imza, altImza, merdiven, sonrakiOranlarTablosu, seviyeYolu, kilometreTaslari, kurKutusuHtml } from './sablon.mjs';

const TOPLAM = 9;
const css = `
.sayfa { width: 210mm; height: 297mm; padding: ${a4.kenar}mm; position: relative; overflow: hidden; page-break-after: always; break-after: page; display: flex; flex-direction: column; background: var(--kagit); }
.sayfa:last-child { page-break-after: auto; break-after: auto; }
.koyu { background: var(--murekkep); color: var(--kagit); }
.ust, .alt { display: flex; justify-content: space-between; align-items: baseline; font-size: ${a4.dipnot}pt; color: var(--soluk); }
.koyu .ust, .koyu .alt { color: var(--solukKoyu); }
.alt { margin-top: auto; padding-top: 5mm; }
.alt-imza { font-weight: 600; letter-spacing: 0.02em; }
.logo { display: block; }
.ust { align-items: center; }
.imza { display: block; margin-top: 1.5mm; font-size: ${a4.dipnot}pt; font-weight: 600; letter-spacing: 0.02em; color: var(--solukKoyu); }
.kapak-imza { display: flex; flex-direction: column; align-items: flex-start; }
.kapak-imza .ceviri { margin-top: 1mm; }
.belge-adi { font-size: ${a4.ara}pt; font-weight: 700; color: var(--sari); letter-spacing: -0.01em; }
.bolum { display: flex; gap: 3mm; align-items: baseline; margin: 9mm 0 3mm; font-size: ${a4.govde}pt; font-weight: 600; color: var(--lacivert); }
.bolum b { font-weight: 800; }
h1.kanca { font-size: ${a4.baslik}pt; line-height: 1.08; font-weight: 700; letter-spacing: -0.025em; max-width: 160mm; }
h2 { font-size: ${a4.ara}pt; line-height: 1.2; font-weight: 700; letter-spacing: -0.01em; }
h3 { font-size: ${a4.govdeBuyuk}pt; line-height: 1.25; font-weight: 700; }
p, li, td, th { font-size: ${a4.govde}pt; line-height: ${a4.satir}; }
.giris { font-size: ${a4.govdeBuyuk}pt; line-height: 1.4; margin-top: 4mm; max-width: 150mm; color: var(--murekkep); }
.not { font-size: ${a4.govde}pt; line-height: 1.4; color: var(--soluk); }
.dipnot { font-size: ${a4.dipnot}pt; line-height: 1.4; color: var(--soluk); }
.koyu .dipnot { color: var(--solukKoyu); }
.koyu .not { color: var(--solukKoyu); }
.vurgu-yazi { color: var(--lacivert); }
.yuzey { background: var(--kum); }
.sayi-dev { font-weight: 800; letter-spacing: -0.02em; line-height: 0.85; }

/* Kapak */
.kapak .ust { align-items: flex-start; }
.kapak-orta { margin-top: 6mm; }
.kapak-48 { font-size: 250pt; color: var(--sari); margin-left: -3mm; }
.kapak-48 small { font-size: 40pt; letter-spacing: -0.02em; font-weight: 800; margin-left: 3mm; }
.kapak h1 { font-size: 34pt; line-height: 1.06; font-weight: 700; letter-spacing: -0.025em; margin-top: 10mm; max-width: 165mm; }
.aylar { margin-top: 12mm; display: grid; grid-template-columns: 22mm 1fr 14mm; row-gap: 2.2mm; align-items: center; }
.aylar .yil { font-size: ${a4.govde}pt; color: var(--solukKoyu); }
.aylar .oran { font-size: ${a4.govde}pt; font-weight: 700; color: var(--sari); text-align: right; }
.aylar .kare { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.6mm; }
.aylar .kare i { display: block; height: 7mm; background: var(--sari); }
.davet { margin-top: auto; display: grid; grid-template-columns: 1fr; gap: 3mm; padding-top: 10mm; }
.davet p.buyuk { color: var(--kagit); font-size: 19pt; line-height: 1.25; font-weight: 600; max-width: 150mm; }
.davet p { font-size: ${a4.govdeBuyuk}pt; color: var(--solukKoyu); max-width: 150mm; }

/* Neden siz */
.soru-liste { margin-top: 6mm; display: grid; gap: 0; }
.soru { display: grid; grid-template-columns: 1fr 72mm; gap: 8mm; padding: 2.5mm 0; border-top: 0.3mm solid var(--cizgi); }
.soru:last-child { border-bottom: 0.3mm solid var(--cizgi); }
.soru .kim { font-size: ${a4.govde}pt; color: var(--soluk); font-weight: 600; }
.soru q { display: block; quotes: '“' '”'; font-size: 15pt; line-height: 1.18; font-weight: 600; margin-top: 1mm; letter-spacing: -0.01em; }
.soru .yanit { background: var(--kum); padding: 3mm 4mm; align-self: stretch; display: flex; flex-direction: column; justify-content: center; }
.soru .yanit b { display: block; font-size: ${a4.govde}pt; color: var(--lacivert); font-weight: 700; margin-bottom: 1mm; }
.bedel { margin-top: auto; background: var(--murekkep); color: var(--kagit); margin: auto -${a4.kenar}mm -${a4.kenar}mm; padding: 7mm ${a4.kenar}mm 6mm; }
.bedel .alt { color: var(--solukKoyu); padding-top: 5mm; }
.bedel h2 { font-size: 14pt; margin-bottom: 4mm; }
.bedel-sayi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }
.bedel-sayi div b { display: block; font-size: 21pt; font-weight: 800; letter-spacing: -0.03em; color: var(--sari); line-height: 1; }
.bedel-sayi div span { display: block; font-size: ${a4.govde}pt; line-height: 1.3; margin-top: 2mm; }
.bedel .not { margin-top: 4mm; font-size: ${a4.govde}pt; color: var(--kagit); }
.bedel + .alt { display: none; }
.sayfa-son-koyu .alt { position: absolute; left: ${a4.kenar}mm; right: ${a4.kenar}mm; bottom: 6mm; color: var(--solukKoyu); }

/* Süreç */
.akis { margin-top: 9mm; display: grid; gap: 0; position: relative; }
.adim { display: grid; grid-template-columns: 16mm 1fr; gap: 5mm; padding-bottom: 6mm; position: relative; }
.adim::before { content: ''; position: absolute; left: 6.5mm; top: 13mm; bottom: 0; width: 0.6mm; background: var(--kumKoyu); }
.adim:last-child::before { display: none; }
.adim .no { width: 13.5mm; height: 13.5mm; border-radius: 50%; background: var(--sari); color: var(--murekkep); font-weight: 800; font-size: 15pt; display: flex; align-items: center; justify-content: center; }
.adim h2 { font-size: 15pt; margin-top: 2.6mm; }
.adim p { margin-top: 1.5mm; max-width: 140mm; }
.catal { margin-top: 3mm; display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; max-width: 150mm; }
.catal div { padding: 3.5mm 4mm; background: var(--kum); }
.catal div:first-child { background: var(--kumKoyu); }
.catal b { display: block; font-size: ${a4.govde}pt; color: var(--murekkep); margin-bottom: 1mm; }
.terim { margin-top: 2mm; display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; padding-top: 5mm; border-top: 0.3mm solid var(--cizgi); }

/* Kazanç */
.tanimlar { margin-top: 5mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 7mm; }
.tanimlar p b { display: block; font-size: ${a4.govdeBuyuk}pt; margin-bottom: 1mm; }
.grafik { margin-top: 6mm; }
.yillar { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 0; margin-top: 2mm; }
.yillar > div { padding: 3mm 4mm 3mm 0; border-top: 0.6mm solid var(--murekkep); }
.yillar > div + div { padding-left: 4mm; }
.yillar b { display: block; font-size: ${a4.govdeBuyuk}pt; }
.yillar span { display: block; font-size: ${a4.govde}pt; color: var(--soluk); }
.yillar .k { color: var(--lacivert); font-weight: 700; }
.lejant { display: flex; gap: 8mm; font-size: ${a4.govde}pt; color: var(--soluk); margin-bottom: 2mm; }
.lejant i { display: inline-block; width: 8mm; height: 2mm; vertical-align: middle; margin-right: 2mm; background: var(--murekkep); }
.lejant i.t { background: var(--sari); height: 3mm; box-shadow: inset 0 0 0 0.3mm var(--murekkep); }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-weight: 700; padding: 2.4mm 3mm; font-size: ${a4.govde}pt; }
table.kota td, table.kota th { padding-top: 1.8mm; padding-bottom: 1.8mm; white-space: nowrap; }
td { padding: 2.4mm 3mm; border-top: 0.3mm solid var(--cizgi); vertical-align: top; }
thead th { border-bottom: 0.6mm solid var(--murekkep); }
td.vurgu, th.vurgu { background: var(--kum); }
td.vurgu b { color: var(--lacivert); }
.tablo-baslik { margin-top: 7mm; margin-bottom: 1.5mm; }
.iki-tablo { display: grid; grid-template-columns: 1.25fr 1fr; gap: 8mm; }

/* 13. aydan sonraki oranlar */
table.sonraki td, table.sonraki th { padding-top: 1.2mm; padding-bottom: 1.2mm; }
.sikisik-plan .tanimlar { margin-top: 3mm; }
.sikisik-plan .grafik { margin-top: 3mm; }
.sikisik-plan .tablo-baslik { margin-top: 4mm; }
.sikisik-plan table.kota td, .sikisik-plan table.kota th { padding-top: 1.3mm; padding-bottom: 1.3mm; }
.iki-tablo { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 8mm; align-items: start; }
table.sonraki td:first-child { white-space: nowrap; }

/* Senaryo */
.varsayim { margin-top: 5mm; padding: 4mm 5mm; background: var(--kum); }
.varsayim p + p { margin-top: 1.5mm; }
.seviye-yolu { list-style: none; margin-top: 6mm; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; }
.seviye-yolu li { background: var(--kum); padding: 3mm 4mm; display: grid; gap: 0.5mm; }
.seviye-yolu li.zirve { background: var(--sari); }
.seviye-yolu .ad { font-size: 18pt; font-weight: 800; color: var(--lacivert); }
.seviye-yolu .zirve .ad { color: var(--murekkep); }
.seviye-yolu .oran { font-size: ${a4.govdeBuyuk}pt; font-weight: 700; }
.seviye-yolu .ay { font-size: ${a4.govde}pt; color: var(--murekkep); }
.kilometre { list-style: none; margin-top: 2mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5mm; }
.kilometre li { display: grid; grid-template-columns: auto 1fr; column-gap: 3mm; row-gap: 0; align-items: baseline; padding: 2mm 4mm; border-top: 0.8mm solid var(--murekkep); background: var(--kum); }
.kilometre li:nth-child(n+4) { background: var(--kumKoyu); }
.kilometre li:last-child { background: var(--sari); }
.kilometre .an { font-size: ${a4.govdeBuyuk}pt; font-weight: 800; }
.kilometre .musteri { font-size: ${a4.govde}pt; color: var(--murekkep); text-align: right; }
.kilometre .etiket { font-size: ${a4.govde}pt; color: var(--murekkep); }
.kilometre .ay-kazanc { font-size: ${a4.govdeBuyuk}pt; text-align: right; }
.kilometre .toplam { font-size: 17pt; font-weight: 800; letter-spacing: -0.02em; text-align: right; color: var(--lacivert); }
.kilometre li:last-child .toplam { color: var(--murekkep); }
/* ₺ hapı: euro tutarın altında, yumuşak pastel zeminde, italik. Sarı kartta zemin açık kâğıt olur. */
.kilometre .tl-hap { justify-self: end; font-style: italic; font-size: 10pt; line-height: 1.15; padding: 0.3mm 2.4mm; border-radius: 999px; background: var(--pastel); color: var(--murekkep); white-space: nowrap; margin: 0.4mm 0 0.6mm; }
.kilometre li:last-child .tl-hap { background: var(--kagit); }
.kur-dipnot { font-style: italic; color: var(--murekkep); }
table.senaryo .tl-hap { display: table; margin-top: 0.5mm; font-style: italic; font-weight: 400; font-size: 10pt; line-height: 1.15; padding: 0.2mm 2.2mm; border-radius: 999px; background: var(--pastel); color: var(--murekkep); white-space: nowrap; }
.garanti { margin-top: 3mm; font-weight: 600; color: var(--murekkep); }
table.senaryo td, table.senaryo th { padding-top: 1mm; padding-bottom: 1mm; white-space: nowrap; }
tr.ana td { background: var(--kum); font-weight: 700; }
.kur-kutusu { margin-top: 5mm; padding: 3mm 4mm; background: var(--kumKoyu); max-width: 120mm; }
.kur-kutusu b { display: block; font-size: ${a4.govde}pt; margin-bottom: 0.5mm; }
.kur-kutusu .dipnot { color: var(--murekkep); }
.ipucu { margin-top: 4mm; padding: 3mm 4mm; background: var(--murekkep); color: var(--kagit); display: grid; grid-template-columns: 26mm 1fr; gap: 4mm; align-items: baseline; }
.ipucu b { color: var(--sari); font-size: ${a4.govde}pt; }

/* Persona tablosu */
.persona { margin-top: 8mm; table-layout: fixed; }
.persona th.satir { width: 25mm; font-size: ${a4.govde}pt; color: var(--soluk); font-weight: 700; padding-left: 0; }
.persona thead th { vertical-align: bottom; border-bottom: 0; padding-bottom: 3mm; }
.persona thead th .rol { display: block; font-size: 13pt; line-height: 1.15; white-space: nowrap; }
.persona thead th.ust-sayi { padding-bottom: 1mm; vertical-align: bottom; }
.persona thead th.rol-adi { padding-top: 0; vertical-align: top; }
.persona thead th .buyuk { display: block; font-size: 20pt; font-weight: 800; letter-spacing: -0.03em; line-height: 1; margin-bottom: 2mm; color: var(--murekkep); }
.persona thead th.ana { background: var(--sari); color: var(--murekkep); }
.persona thead th.ana.ust-sayi { padding-top: 4mm; }
.persona thead th.ana .buyuk { color: var(--murekkep); }
.persona tbody th.satir { vertical-align: top; padding-top: 3mm; }
.persona td { font-size: ${a4.govde}pt; line-height: 1.38; padding: 3mm; }
.persona td.ana { background: var(--kum); }
.persona tbody tr:first-child td { border-top: 0.6mm solid var(--murekkep); }

/* Persona sayfaları */
.rol-ust { display: grid; grid-template-columns: 1fr 52mm; gap: 8mm; align-items: end; }
.rol-sayi { text-align: right; }
h1.kanca.kucuk { font-size: 23pt; }
h1.kanca.orta { font-size: 25pt; }
.sikisik .giris { margin-top: 3mm; }
.sikisik .iki { margin-top: 3mm !important; }
.sikisik .ilk-adim { margin-top: 4mm; }
.sikisik .bolum { margin-top: 7mm; }
.sikisik .rol-sayi b { font-size: 44pt; }
.rol-sayi b { display: block; font-size: 54pt; color: var(--lacivert); }
.rol-sayi span { display: block; font-size: ${a4.govde}pt; color: var(--soluk); margin-top: 2mm; }
.duz { margin-top: 5mm; display: grid; gap: 2mm; max-width: 165mm; }
.iki { display: grid; grid-template-columns: 1fr 1fr; gap: 9mm; margin-top: 7mm; }
.ilk-adim { margin-top: 6mm; padding: 4mm 5mm; background: var(--murekkep); color: var(--kagit); display: grid; grid-template-columns: 26mm 1fr; gap: 4mm; align-items: baseline; }
.ilk-adim b { color: var(--sari); font-size: ${a4.govde}pt; }
.kural-liste { list-style: none; display: grid; gap: 0; }
.kural-liste li { padding: 2.2mm 0; border-top: 0.3mm solid var(--cizgi); }
.kural-liste.iki-sutun { grid-template-columns: 1fr 1fr; column-gap: 8mm; }
.ayrac { height: 0; border-top: 0.6mm solid var(--murekkep); margin: 9mm 0 0; }

/* Koşullar */
.biz-siz { margin-top: 7mm; display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.biz-siz > div { padding: 5mm 5mm 4mm; }
.biz-siz > div:first-child { background: var(--murekkep); color: var(--kagit); }
.biz-siz > div:last-child { background: var(--kumKoyu); }
.biz-siz h2 { font-size: 15pt; margin-bottom: 3mm; }
.biz-siz > div:first-child h2 { color: var(--sari); }
.biz-siz ul { list-style: none; display: grid; gap: 2.2mm; }
.biz-siz li { padding-left: 5mm; position: relative; }
.biz-siz li::before { content: ''; position: absolute; left: 0; top: 2.1mm; width: 2mm; height: 2mm; background: var(--sari); }
.biz-siz > div:last-child li::before { background: var(--murekkep); }
.kurallar { margin-top: 6mm; display: grid; grid-template-columns: 1fr 1fr; column-gap: 9mm; }
.kurallar h2 { grid-column: 1 / -1; font-size: 14pt; margin-bottom: 1mm; }
.kurallar p { padding: 2.2mm 0; border-top: 0.3mm solid var(--cizgi); }
.son { margin-top: auto; margin-left: -${a4.kenar}mm; margin-right: -${a4.kenar}mm; margin-bottom: -${a4.kenar}mm; background: var(--murekkep); color: var(--kagit); padding: 8mm ${a4.kenar}mm 9mm; display: grid; grid-template-columns: 1fr 62mm; gap: 8mm; }
.son h2 { font-size: 22pt; letter-spacing: -0.02em; margin-bottom: 4mm; }
.son ol { list-style: none; counter-reset: s; display: grid; gap: 2mm; }
.son li { counter-increment: s; display: grid; grid-template-columns: 8mm 1fr; font-size: ${a4.govdeBuyuk}pt; }
.son li::before { content: counter(s); font-weight: 800; color: var(--sari); }
.son .adres { align-self: end; display: flex; flex-direction: column; align-items: flex-end; text-align: right; }
.son .adres .imza { margin-bottom: 3mm; }
.son .adres b { display: block; font-size: 26pt; font-weight: 800; letter-spacing: -0.02em; }
.son .adres .dipnot { margin-top: 3mm; color: var(--solukKoyu); }
`;

const ust = (bolumAdi) => `<header class="ust">${logo({ mm: 20 })}<span>${bolumAdi}</span></header>`;
const alt = (n) => `<footer class="alt"><span>Thoptan iş ortaklığı kılavuzu</span>${altImza()}<span>${n} / ${TOPLAM}</span></footer>`;
const bolum = (no, ad) => `<div class="bolum"><b>${String(no).padStart(2, '0')}</b><span>${ad}</span></div>`;

const kap = kademeler('kapatir');
const tan = kademeler('tanistir');
const K = hesap.kapat, T = hesap.tanis;
const KA = anlar(K), TA = anlar(T);
const ay12 = KA.find((a) => a.n === 12), ay48 = KA.at(-1);
/** 1. ile 13. ay arası K3 oranı, sonraki dönemler 13. aydan sonraki oranlardır. */
const KAPAK_ORANLARI = [kap.at(-1).oran, ...plan.kapatir.gecmis.slice(0, 3)];
/** Dönem adı: 13. ile 24. ay arası. */
const donemAdi = (i) => `${12 * (i + 1) + 1}. ile ${12 * (i + 2)}. ay arası`;

function kapak() {
  const satirlar = KAPAK_ORANLARI.map((o, i) => ({ yil: `${i + 1}. yıl`, oran: o, op: i ? 0.25 + (o / KAPAK_ORANLARI[0]) * 0.75 : 1 }));
  return `<section class="sayfa koyu kapak">
  <header class="ust"><div class="kapak-imza">${logo({ koyu: true, mm: 42 })}${imza()}<span class="dipnot ceviri">Thoptan ile istoc.com ağına bağlanırsınız.</span></div><span>İş ortaklığı programı</span></header>
  <div class="kapak-orta">
    <p class="belge-adi">Thoptan iş ortaklığı kılavuzu</p>
    <div class="kapak-48 sayi-dev">48<small>aya kadar</small></div>
    <h1>Satışını kapattığınız müşteri size 48 aya kadar pay getirir.</h1>
  </div>
  <div class="aylar" aria-label="48 ayın payı">
    ${satirlar.map((s) => `<span class="yil">${s.yil}</span><span class="kare">${'<i></i>'.repeat(12).replaceAll('<i>', `<i style="opacity:${s.op.toFixed(2)};background:var(--${s.op === 1 ? 'sari' : 'solukKoyu'})">`)}</span><span class="oran">${yuzde(s.oran)}</span>`).join('')}
  </div>
  <p class="dipnot" style="margin-top:3mm">Kareler ayları gösterir. Oranlar K3 seviyesinde satışı kapatma oranlarıdır.</p>
  <div class="davet">
    <p class="buyuk">Thoptan iş ortaklığı programına sizi davet ediyoruz.</p>
    <p>Bu belge satıcı firmalara hizmet veren danışmanlar ve hizmet firmaları için hazırlandı.</p>
    <p class="not">Pay en çok 48 ay sürer. Bunun için müşteriler ilk 12 ayın her ayında en az ${avro(plan.kapatir.esik[0])} ödemelidir.</p>
  </div>
  <footer class="alt"><span>thoptan.com</span>${altImza()}<span>23 Kasım 2026 Pazartesi günkü plan</span></footer>
</section>`;
}

const SORULAR = [
  ['Katalog stüdyosunun müşterisi sorar.', 'Hazırlanan kataloğu alıcılarla nasıl paylaşırım?', 'Thoptan kataloğu bir bağlantıyla paylaşır. Alıcı sepetini kendisi doldurur.'],
  ['İhracat danışmanının müşterisi sorar.', 'Alıcının istediği ürün bilgisi bende hazır mı?', 'Ürün bilgisi bugünden eksiksiz tutulur. Ölçü, ağırlık, malzeme ve üretildiği ülke yazılır.'],
  ['Lojistik firmasının müşterisi sorar.', 'Yeni alıcılarla görüşmeleri nasıl takip ederim?', 'WhatsApp’tan gelen siparişler tek ekranda toplanır. Fiyat teklifi 2 dakikada hazırlanır.'],
];
export { SORULAR };

function nedenSiz() {
  return `<section class="sayfa">
  ${ust('Neden siz')}
  ${bolum(1, 'Neden siz')}
  <h1 class="kanca">Müşteriniz size her ay aynı soruyu soruyor mu?</h1>
  <p class="giris">Siz satıcı firmalara zaten hizmet veriyorsunuz. İşletme size güvenir. Thoptan bu güvene somut bir yanıt ekler.</p>
  <div class="soru-liste">
    ${SORULAR.map(([kim, soru, yanit]) => `<div class="soru"><div><span class="kim">${kim}</span><q>${soru}</q></div><div class="yanit"><b>Thoptan’ın yanıtı</b><p>${yanit}</p></div></div>`).join('')}
  </div>
  <div class="bedel">
    <h2>Müşterinizin ödediği bedel</h2>
    <div class="bedel-sayi">
      <div><b>${fiyat.denemeGun} gün</b><span>Satıcı paketi ücretsiz dener.</span></div>
      <div><b>${avro(fiyat.basicAyEur)}</b><span>Basic paket ayda bu kadar tutar.</span></div>
      <div><b>${avro(fiyat.basicYilEur)}</b><span>Yıllık pakette 12 ay için 10 aylık bedel ödenir.</span></div>
    </div>
    <p class="not">Thoptan satıcının satışından komisyon almaz. Fiyat herkes için aynıdır. Fiyatlara KDV dahil değildir. KDV, katma değer vergisidir.</p>
    ${alt(2)}
  </div>
</section>`;
}

const ADIMLAR = [
  ['Katkı düzeyinizi yazılı belirleyin.', 'Ortaklık sorumlusu yapacağınız işi sizinle yazar. Yalnız tanıştırma ve satışı kapatma iki ayrı katkıdır.'],
  ['İşletmenin ihtiyacını konuşun.', 'Ürün bilgisinin hazır olup olmadığını öğrenin. Ulaşmak istediği alıcıyı not edin.'],
  ['Müşteri kaydını açtırın.', 'Şirket her firmayı yalnız bir ortağın kaydına yazar. Kayıt kabul edilince müşteri sizin kaydınızdadır.'],
  ['Ürünü gösterin.', 'Gösterimi işletmenin kendi ürünleriyle yapın. Teklifi yetkili satış sorumlusu fiyat tablosundaki fiyatla hazırlar.'],
  ['Kurulumu yapın ya da devredin.', null],
  ['Ödemenizi alın.', 'Finans ekibi müşterinin ödemesini doğrular ve payınızı hesaplar. Siz şirkete fatura kesersiniz.'],
];
export { ADIMLAR };

function nasilIsler() {
  return `<section class="sayfa">
  ${ust('Nasıl işler')}
  ${bolum(2, 'Nasıl işler')}
  <h1 class="kanca">Altı adım var. İlk adım tek bir görüşmedir.</h1>
  <div class="akis">
    ${ADIMLAR.map(([b, m], i) => `<div class="adim"><div class="no">${i + 1}</div><div><h2>${b}</h2>${m ? `<p>${m}</p>` : `<div class="catal">
      <div><b>Satışı siz kapattıysanız</b><p>Kurulumu ve ilk eğitimi siz yaparsınız.</p></div>
      <div><b>Yalnız tanıştırdıysanız</b><p>Kurulumu şirket yapar.</p></div></div>`}</div></div>`).join('')}
  </div>
  <div class="terim">
    <p><b>Kurulum nedir?</b><br>Kurulum, işletmenin hesabını açmak ve ürünlerini yüklemektir.</p>
    <p><b>Sonraki destek</b><br>Kurulumdan sonraki desteği her durumda şirket verir.</p>
  </div>
  ${alt(3)}
</section>`;
}

function kazancPlani() {
  return `<section class="sayfa sikisik-plan">
  ${ust('Kazanç planı')}
  ${bolum(3, 'Kazanç planı')}
  <h1 class="kanca">Satışı kapatırsanız payınız %30’a kadar çıkar.</h1>
  <div class="tanimlar">
    <p><b>Ciro</b>Ciro, getirdiğiniz müşterilerin ödediği tutardır.</p>
    <p><b>Kota</b>Kota, bir aydaki ciro eşiğidir. Planda üç kota vardır: K1, K2 ve K3.</p>
    <p><b>Oran</b>Ulaştığınız kotanın oranı cironun tamamına uygulanır.</p>
  </div>
  <div class="grafik">
    <div class="lejant"><span><i class="t"></i>Satışı kapatırsanız</span><span><i></i>Yalnız tanıştırırsanız</span></div>
    ${merdiven({ g: 640, y: 160, kapat: kap, tanis: tan, yaziBoyu: 14 })}
  </div>
  <h3 class="tablo-baslik">Bir aydaki ciroya göre oran</h3>
  <table class="kota"><thead><tr><th>Kota</th><th>Tanıştırmada eşik</th><th>Oran</th><th class="vurgu">Kapatmada eşik</th><th class="vurgu">Oran</th></tr></thead><tbody>
    ${['Kota yok', 'K1', 'K2', 'K3'].map((ad, i) => `<tr><td>${ad}</td><td>${i ? `${avro(tan[i].esik)} ve üstü` : `${avro(tan[1].esik)} altı`}</td><td><b>${yuzde(tan[i].oran)}</b></td><td class="vurgu">${i ? `${avro(kap[i].esik)} ve üstü` : `${avro(kap[1].esik)} altı`}</td><td class="vurgu"><b>${yuzde(kap[i].oran)}</b></td></tr>`).join('')}
  </tbody></table>
  <div class="iki-tablo" style="margin-top:4mm">
    <div>
      <h3>13. aydan sonraki oranlar</h3>
      <p class="not" style="margin-top:1mm">Müşteri ödemeye devam ederse satıcı bu aylarda bu oranı alır.</p>
      <p class="not" style="margin-top:1mm">Oran müşterinin o yılki cirosuna uygulanır.</p>
    </div>
    ${sonrakiOranlarTablosu({ plan, yuzde, donemAdi: (i) => donemAdi(i).replace(' arası', '') })}
  </div>
  <p class="not" style="margin-top:2mm">İlk 12 ayda kotanızın oranını alırsınız. Oran %0 olunca pay biter. <b style="color:var(--murekkep)">Eşikler ve oranlar bugünkü plandır. Kesin değerler yazılı anlaşmada belirlenir.</b></p>
  ${alt(4)}
</section>`;
}

function senaryo() {
  return `<section class="sayfa">
  ${ust('Büyüyen müşteri senaryosu')}
  ${bolum(4, 'Büyüyen müşteri senaryosu')}
  <h1 class="kanca">12. ayda her ay ${avroTam(ay12.kazanc)} kazanırsınız.</h1>
  <p class="giris">Her ay yeni müşteri gelir. Eski müşteriler ödemeye devam eder. Bu yüzden kazancınız her ay büyür.</p>
  <div class="varsayim">
    <p>Bu gerçekçi senaryoda her ay ${K.yeni} yeni müşteri getirirsiniz. Her müşteri Basic paket için ayda ${avro(fiyat.basicAyEur)} öder. Müşteriler ${plan.musteriAy} ay kalır. Satışı siz kapatırsınız.</p>
  </div>
  <h3 class="tablo-baslik">Seviye yolu</h3>
  ${seviyeYolu({ kademeler: kap, seviyeAyi: K.seviyeAyi, yuzde })}
  <p style="margin-top:2mm">${K.seviyeAyi[2]}. ayda K3 seviyesine çıkarsınız. Oranınız ${yuzde(kap[3].oran)} olur.</p>
  <h3 class="tablo-baslik">Kilometre taşları</h3>
  ${kilometreTaslari({ anlar: KA, avro, liraHap })}
  <p class="dipnot" style="margin-top:1.5mm">“O ay” o ayın kazancıdır. “Toplam” o güne kadarki toplam kazançtır. <span class="kur-dipnot">${kurDipnotu()}</span></p>
  <p class="not" style="margin-top:2mm">${plan.musteriAy}. ayda ${ay48.musteri} müşteriniz olur. 4 yılın toplamı ${avroTam(ay48.toplam)} olur.</p>
  <p class="garanti">Bu bir örnek senaryodur. Kazanç garantisi değildir.</p>
  ${alt(5)}
</section>`;
}

/** Tablo hücresi: euro tutar ve altında ₺ hapı. */
const euroHucre = (eur, kalin = false) => `${kalin ? `<b>${avro(eur)}</b>` : avro(eur)}<i class="tl-hap dipnot">${liraHap(eur)}</i>`;
export { euroHucre };

function karsilastirma() {
  const S = hesap.senaryolar;
  return `<section class="sayfa">
  ${ust('Senaryoları karşılaştırın')}
  ${bolum(5, 'Senaryoları karşılaştırın')}
  <h1 class="kanca">Her yeni müşteri kazancınızı büyütür.</h1>
  <h3 class="tablo-baslik">İki yol, gerçekçi senaryo</h3>
  <table class="senaryo"><thead><tr><th>Zaman</th><th class="vurgu">Kapatma: o ay</th><th class="vurgu">Kapatma: toplam</th><th>Tanıştırma: o ay</th><th>Tanıştırma: toplam</th></tr></thead><tbody>
    ${KA.map((a, i) => `<tr><td>${a.ad}</td><td class="vurgu">${euroHucre(a.kazancEur, true)}</td><td class="vurgu">${euroHucre(a.toplamEur, true)}</td><td>${euroHucre(TA[i].kazancEur)}</td><td>${euroHucre(TA[i].toplamEur)}</td></tr>`).join('')}
  </tbody></table>
  <p class="not" style="margin-top:2mm">Satışı kapatırsanız kazancınız yaklaşık 2 kat olur.</p>
  <h3 class="tablo-baslik">Üç senaryo, satışı kapatırsanız</h3>
  <table class="senaryo"><thead><tr><th>Senaryo</th><th>Ayda yeni müşteri</th><th>K3 ayı</th><th>12. ayın kazancı</th><th>4 yılın toplamı</th></tr></thead><tbody>
    ${S.map((s) => `<tr class="${s.ana ? 'ana' : ''}"><td>${s.ad}</td><td>${s.yeniMusteri}</td><td>${s.kapat.seviyeAyi[2]}. ay</td><td>${euroHucre(Math.round(s.kapat.aylar[11].kazanc))}</td><td>${euroHucre(Math.round(s.kapat.aylar.at(-1).toplam))}</td></tr>`).join('')}
  </tbody></table>
  <p class="not" style="margin-top:2mm">Temkinli senaryoda 1. ayın cirosu ${avro(S[0].yeniMusteri * fiyat.basicAyEur)} olur. Bu ciro K1 kotasının altındadır. Bu yüzden temkinli senaryoda 13. aydan sonra pay yoktur.</p>
  <div class="ipucu"><b>İpucu</b><span>İlk ay en az ${K.yeni} müşteri getirin. Böylece K1 kotası her ay tutar.</span></div>
  <p class="dipnot kur-dipnot" style="margin-top:3mm">${kurDipnotu()}</p>
  <p class="garanti">Bu bir örnek senaryodur. Kazanç garantisi değildir.</p>
  <p class="not" style="margin-top:2mm">Vergi ve stopaj bu hesaba dahil değildir. Stopaj, ödemeden yapılan vergi kesintisidir.</p>
  ${alt(6)}
</section>`;
}

export const PERSONALAR = [
  { ad: 'Çözüm ortağı', buyuk: '%30’a kadar', ana: true,
    kim: 'Satıcı firmalara hizmet veren danışman ya da hizmet firması.', ne: 'Müşterisini Thoptan ile tanıştırır ya da satışı kapatır.',
    kazanc: 'Ciro üzerinden pay alır. Oran %30’a kadar çıkar.', basla: 'Katkı düzeyini yazılı belirler.' },
  { ad: 'Mevcut müşteri', buyuk: '2 ay',
    kim: 'Thoptan kullanan satıcı işletme.', ne: 'Çevresindeki bir işletmeye Thoptan’ı önerir.',
    kazanc: 'Uygun tavsiye başına 2 ay ücretsiz kullanım alır.', basla: 'Geçerli koşulu müşteri sorumlusundan öğrenir.' },
  { ad: 'Marka elçisi', buyuk: '%15’e kadar',
    kim: 'Ticaret yapan bir kitleye ulaşan kişi.', ne: 'Thoptan’ı tanıtır ve ilgilenen satıcıyı yönlendirir.',
    kazanc: 'Çözüm ortağıyla aynı plandan pay alır. Tanıtırsa oran %15’e kadar çıkar.', basla: 'Anlatımını şirkete doğrulatır.' },
];

function dortPersona() {
  const satir = (ad, alan) => `<tr><th class="satir" scope="row">${ad}</th>${PERSONALAR.map((p) => `<td class="${p.ana ? 'ana' : ''}">${p[alan]}</td>`).join('')}</tr>`;
  return `<section class="sayfa">
  ${ust('Üç ortaklık yolu')}
  ${bolum(6, 'Üç ortaklık yolu')}
  <h1 class="kanca">Hangisi sizsiniz?</h1>
  <p class="giris">Aynı ürünü üç farklı yoldan anlatabilirsiniz. Her yolun işi ve kazancı ayrıdır.</p>
  <table class="persona">
    <thead><tr><th class="satir"></th>${PERSONALAR.map((p) => `<th class="${p.ana ? 'ana' : ''} ust-sayi"><span class="buyuk">${p.buyuk}</span></th>`).join('')}</tr>
      <tr><th class="satir"></th>${PERSONALAR.map((p) => `<th class="${p.ana ? 'ana' : ''} rol-adi" scope="col"><span class="rol">${p.ad}</span></th>`).join('')}</tr></thead>
    <tbody>${satir('Kim?', 'kim')}${satir('Ne yapar?', 'ne')}${satir('Nasıl kazanır?', 'kazanc')}${satir('Nasıl başlar?', 'basla')}</tbody>
  </table>
  <p class="not" style="margin-top:4mm">Bu belgenin ana okuru çözüm ortağıdır. Öteki iki yol sonraki sayfadadır.</p>
  <div class="ayrac"></div>
  <div class="iki">
    <div><h3>Çözüm ortağı ile marka elçisi aynı plandan kazanır.</h3><p style="margin-top:2mm">İkisi de ciro üzerinden pay alır. Yapılan iş ve bir aydaki ciro oranı belirler.</p></div>
    <div><h3>Mevcut müşteri ücretsiz kullanım kazanır.</h3><p style="margin-top:2mm">Uygun tavsiye başına 2 ay ücretsiz kullanım alır. Ödül nakit değildir.</p></div>
  </div>
  ${alt(7)}
</section>`;
}

function musteriElci() {
  const E = hesap.elci;
  return `<section class="sayfa sikisik">
  ${ust('Mevcut müşteri ve marka elçisi')}
  ${bolum(7, 'Mevcut müşteri')}
  <div class="rol-ust">
    <h1 class="kanca kucuk">Uygun her tavsiye size 2 ay ücretsiz Thoptan kazandırır.</h1>
    <div class="rol-sayi"><b class="sayi-dev">${tavsiye.krediAy} ay</b><span>Uygun tavsiye başına</span></div>
  </div>
  <p class="giris">Siz Thoptan kullanan bir satıcısınız. Yalnız tanıştırma yaparsınız. Satışı, sözleşmeyi ve desteği şirket yürütür.</p>
  <div class="iki" style="margin-top:5mm">
    <ul class="kural-liste">
      <li>Uygun tavsiye başına size ${tavsiye.krediAy} ay ücretsiz kullanım verilir. Bu süre Basic paket fiyatıyla ${avro(hesap.tavsiyeEur)} değerindedir.</li>
      <li>Yeni müşteriye ${tavsiye.yeniKrediAy} ay ücretsiz kullanım verilir.</li>
      <li>Yılda en çok ${tavsiye.sinir} uygun tavsiye sayılır. Bu, yılda en çok ${hesap.tavsiyeYilAy} ay ücretsiz kullanım eder.</li>
    </ul>
    <ul class="kural-liste">
      <li>Tavsiyenin uygun sayılması için yeni müşteri yıllık paket alır.</li>
      <li>Yeni müşteri Thoptan’ı 60 gün kullanmaya devam etmelidir.</li>
      <li>Ödül nakit değildir. Ödül ücretsiz Thoptan kullanımıdır.</li>
      <li>Ödül alabileceğinizi işletmeye açıkça söyleyin.</li>
    </ul>
  </div>
  <div class="ilk-adim"><b>İlk adım</b><span>Geçerli koşulu müşteri sorumlusundan öğrenin.</span></div>
  ${bolum(8, 'Marka elçisi')}
  <div class="rol-ust">
    <h1 class="kanca kucuk">Kitleniz ticaret yapıyor mu? Yönlendirdiğiniz başvuru kaydınıza yazılır.</h1>
    <div class="rol-sayi"><b class="sayi-dev">${yuzde(E.oran)}</b><span>${avro(E.ciro)} aylık ciroda</span></div>
  </div>
  <p class="giris">Thoptan’ı sosyal medyada, eğitimde ya da etkinlikte tanıtırsınız.</p>
  <div class="iki" style="margin-top:5mm">
    <ul class="kural-liste">
      <li>Size bir bağlantı ya da bir kod verilir. Başvurular bu yolla sizin kaydınıza ulaşır.</li>
      <li>Her ticari paylaşımda “reklam” sözcüğünü en başa yazın.</li>
      <li>Yalnız tanıtırsanız satışı ve kurulumu şirket yapar.</li>
      <li>Satışı siz kapatırsanız kurulumu ve ilk eğitimi de siz yaparsınız.</li>
    </ul>
    <div class="zincir tanis">
      <h2 style="font-size:13pt">Örnek pay</h2>
      <ol>
        <li><span>Tanıttığınız satıcıların aylık ödemesi</span><b>${avro(E.ciro)}</b></li>
        <li><span>Bu ciro K3 kotasıdır. Tanıştırma payınız</span><b>${yuzde(E.oran)}</b></li>
        <li><span>${avro(E.ciro)} × ${yuzde(E.oran)}</span><b>ayda ${avro(E.aylik)}</b></li>
      </ol>
      <p class="not" style="margin-top:2mm">Çözüm ortağıyla aynı plandan pay alırsınız. Bu ilişki maaşlı iş değildir.</p>
    </div>
  </div>
  <div class="ilk-adim"><b>İlk adım</b><span>İçeriğinizin amacını belirleyin. Anlatımınızı şirkete doğrulatın.</span></div>
  ${alt(8)}
</section>`;
}

export const BIZ = [
  'Fiyatı fiyat tablosu belirler. Fiyat herkes için aynıdır.',
  'Yetkili satış sorumlusu teklifi hazırlar.',
  'Yalnız tanıştırdığınız müşterinin satışını ve kurulumunu biz yaparız.',
  'Kurulumdan sonraki desteği her durumda biz veririz.',
  'Her firmayı yalnız bir ortağın kaydına yazarız.',
  'Finans ekibi ödemeyi doğrular ve payınızı hesaplar.',
];
export const SIZ = [
  'Katkı düzeyinizi yazılı belirlersiniz.',
  'Satışı kapatırsanız kurulumu ve ilk eğitimi siz yaparsınız.',
  'Fiyat ya da indirim sözü vermezsiniz.',
  'Alıcı, sipariş ya da satış sözü vermezsiniz.',
  'Müşterinin izni olmadan kataloğunu paylaşmazsınız.',
  'Kazancınız için şirkete fatura kesersiniz.',
];
export const ILK_ADIMLAR = ['thoptan.com adresinden Thoptan’ı inceleyin.', 'Ortaklık sorumlusuyla görüşün.', 'Katkı düzeyinizi yazılı belirleyin.', 'İlk müşteri kaydınızı açtırın.'];

function kosullar() {
  return `<section class="sayfa">
  ${ust('Koşullar ve ilk adım')}
  ${bolum(9, 'Koşullar')}
  <h1 class="kanca">Kim ne yapar? Baştan yazılıdır.</h1>
  <div class="biz-siz">
    <div><h2>Biz ne yaparız</h2><ul>${BIZ.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    <div><h2>Siz ne yaparsınız</h2><ul>${SIZ.map((x) => `<li>${x}</li>`).join('')}</ul></div>
  </div>
  <div class="kurallar">
    <h2>Ödeme kuralları</h2>
    <p>İlk 12 ayın her birinde aylık ciro en az K1 kotası kadar olmalıdır. Ciro tek bir ay K1 kotasının altında kalırsa 13. aydan sonra pay alınmaz.</p>
    <p>Tanıştırma CRM’e kaydedilir. CRM, şirketin müşteri kayıt sistemidir. Planda tanıştırma ${plan.tanistirmaSureAy} ay geçerlidir.</p>
    <p>Tanıştıran ile satışı kapatan farklı kişi olabilir. Bu durumda pay ikisi arasında bölüşülür. Planda tanıştıranın payı satışı kapatanın payından düşülür. Bölüşme yazılı anlaşmada belirlenir.</p>
    <p>Ödeme günü sözleşmeye yazılır. Ödeme günleri müşterinin ödeme gününden sayılır. Ayrıntıyı yazılı anlaşma belirler.</p>
    <p>Fatura, vergi ve stopajı mali müşaviriniz doğrulasın. Şirket ortak getirmeye para ödemez.</p>
    <p><b>Bu belge sözleşme değildir. Kesin değerler yazılı anlaşmada belirlenir.</b></p>
  </div>
  <div class="son">
    <div>
      <h2>Hangi müşterinizle başlarsınız?</h2>
      <ol>${ILK_ADIMLAR.map((x) => `<li>${x}</li>`).join('')}</ol>
    </div>
    <div class="adres">${logo({ koyu: true, mm: 42 })}${imza()}<b>thoptan.com</b><p class="dipnot">Bu belge 23 Kasım 2026 Pazartesi günkü plana göre hazırlandı. Sayfa ${TOPLAM} / ${TOPLAM}</p></div>
  </div>
</section>`;
}

export function kitapcikHtml() {
  const govde = [kapak(), nedenSiz(), nasilIsler(), kazancPlani(), senaryo(), karsilastirma(), dortPersona(), musteriElci(), kosullar()].join('\n');
  return sayfaIskeleti({ baslik: 'Thoptan iş ortaklığı kılavuzu', boyut: 'A4 portrait', css, govde });
}
export const KITAPCIK_SAYFA = TOPLAM;
