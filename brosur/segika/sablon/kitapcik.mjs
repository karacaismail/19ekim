/** El kitapçığı: A4 dikey, 9 sayfa. Okunacak belge. Koşullar, süreç ve hesap örnekleri eksiksizdir. */
import { tokenCss, marka, aySeridi, basamakGrafik, yilGrafik, TOKENS, htmlDuzelt } from './ortak.mjs';
import { M, TARIH, PAKETLER, OLCEK, ORNEK, ISVEREN_SAYISI, BOLUSME, ELCI, KADROLU_ORNEK, TAVSIYE_ORNEK, basamaklar, tl, yuzde } from '../icerik.mjs';

const R = TOKENS.renk;
const TOPLAM = 9;

const css = `
@page { size: 210mm 297mm; margin: 0; }
.sayfa { width: 210mm; height: 297mm; padding: var(--o-kenar); display: flex; flex-direction: column; }
.ic { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.ic > * { flex-shrink: 0; }
.bas { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 7mm; }
.bas .marka { font-size: 15pt; color: var(--r-lacivert); }
.koyu .bas .marka { color: var(--r-beyaz); }
.alt { display: flex; justify-content: space-between; font-size: var(--o-dipnot); color: var(--r-gri); margin-top: auto; padding-top: 4mm; }
.koyu .alt { color: var(--r-griLacivertUstu); }
h2.kanca { font-size: var(--o-h2); margin: 2.5mm 0 5mm; max-width: 165mm; }
h3 { font-size: var(--o-h3); font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.2; margin-bottom: 2mm; }
p + p { margin-top: 2mm; }
.giris { font-size: 13pt; line-height: 1.45; max-width: 160mm; }
.not { font-size: var(--o-kucuk); color: var(--r-gri); line-height: 1.4; }
.kucuk { font-size: var(--o-kucuk); }
.yuzey { background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 5.5mm 7mm; }
.izgara2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm 8mm; }
.izgara3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }
ul.liste { list-style: none; }
ul.liste li { position: relative; padding-left: 5mm; margin-top: 1.6mm; }
ul.liste li::before { content: ''; position: absolute; left: 0; top: 0.62em; width: 2mm; height: 2mm; border-radius: 50%; background: var(--r-yesil); }
.koyu ul.liste li::before { background: var(--r-yesil); }
.bosluk { flex: 1; }

/* Kapak */
.kapak { background: var(--r-lacivert); color: var(--r-beyaz); }
.kapak .bas .marka { font-size: 22pt; }
.kapak .kanca { font-size: 44pt; line-height: 1.03; margin-top: 26mm; max-width: 172mm; }
.kapak .kanca2 { font-size: 44pt; line-height: 1.04; font-weight: var(--w-baslik); color: var(--r-yesil); letter-spacing: -0.015em; margin-top: 4mm; max-width: 170mm; text-wrap: balance; }
.kapak .serit { margin-top: auto; }
.kapak .serit p { font-size: 13pt; color: var(--r-griLacivertUstu); margin-bottom: 5mm; }
.kapak .serit p b { color: var(--r-beyaz); font-weight: var(--w-kalin); }
.kapak .davet { margin-top: 16mm; display: grid; grid-template-columns: 1.2fr 1fr; gap: 10mm; align-items: end; }
.kapak .davet b { display: block; font-size: 17pt; font-weight: var(--w-baslik); line-height: 1.2; margin-bottom: 2.5mm; }
.kapak .davet p { font-size: 12pt; color: var(--r-griLacivertUstu); }
.kapak .tanim { font-size: 11pt; color: var(--r-griLacivertUstu); border-top: 1px solid var(--r-cizgiLacivertUstu); padding-top: 3mm; }

/* Neden siz */
.kimler { margin-top: auto; padding-top: 8mm; }
.kimler ul { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8mm; }
.kucuk-govde { font-size: 11pt; line-height: 1.42; }
.izgara3 h3 { padding-top: 3mm; border-top: 1.2mm solid var(--r-yesil); }
.olcek { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 4mm; background: var(--r-lacivert); color: var(--r-beyaz); border-radius: var(--o-kose); }
.olcek div { padding: 7mm 6mm 6mm; }
.olcek div + div { border-left: 1px solid var(--r-cizgiLacivertUstu); }
.olcek b { display: block; font-size: 27pt; font-weight: var(--w-dev); color: var(--r-yesil); letter-spacing: -0.02em; line-height: 1; }
.olcek span { display: block; font-size: 11pt; margin-top: 3mm; line-height: 1.35; color: var(--r-beyaz); }
.sizsiniz { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
.sizsiniz p { font-size: 12.5pt; }
.vurgu { font-weight: var(--w-baslik); color: var(--r-lacivert); }
.buyuk-alinti { font-size: 21pt; font-weight: var(--w-baslik); line-height: 1.15; color: var(--r-lacivert); letter-spacing: -0.01em; }
.buyuk-alinti em { font-style: normal; color: var(--r-yesilMetin); }

/* Ürün */
.isler { display: grid; grid-template-columns: 1fr 1fr; gap: 11mm 10mm; margin-top: 4mm; }
.isler p { font-size: 12pt; }
.entegre { display: flex; align-items: center; gap: 8mm; background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 6mm 7mm; margin-top: 9mm; }
.entegre p { font-size: 11.5pt; max-width: 80mm; }
.entegre ul { list-style: none; display: flex; flex: 1; justify-content: flex-end; gap: 9mm; }
.entegre li { font-size: 25pt; font-weight: var(--w-dev); color: var(--r-lacivert); letter-spacing: -0.01em; }
.isler div b { display: block; font-size: 14pt; font-weight: var(--w-baslik); color: var(--r-lacivert); margin-bottom: 1mm; }
.isler div b::before { content: ''; display: inline-block; width: 2.4mm; height: 2.4mm; border-radius: 50%; background: var(--r-yesil); margin-right: 2.2mm; vertical-align: 0.12em; }
.fiyatlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 5mm; }
.fiyatlar div { background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 6.5mm 6mm; }
.fiyatlar div.one { background: var(--r-lacivert); color: var(--r-beyaz); }
.fiyatlar small { display: block; font-size: 11pt; font-weight: var(--w-kalin); color: var(--r-gri); }
.fiyatlar .one small { color: var(--r-griLacivertUstu); }
.fiyatlar b { display: block; font-size: 32pt; font-weight: var(--w-dev); letter-spacing: -0.02em; color: var(--r-lacivert); line-height: 1.1; margin-top: 2mm; }
.fiyatlar .one b { color: var(--r-yesil); }
.fiyatlar span { display: block; font-size: 11pt; margin-top: 1mm; line-height: 1.3; }

/* Süreç */
.akis { list-style: none; counter-reset: a; position: relative; }
.akis::before { content: ''; position: absolute; left: 4.9mm; top: 7mm; bottom: 7mm; width: 1.2mm; background: var(--r-sis); }
.akis li { counter-increment: a; position: relative; display: grid; grid-template-columns: 11mm 1fr 46mm; gap: 6mm; align-items: center; padding: 1.6mm 0; }
.akis li::before { content: counter(a); width: 11mm; height: 11mm; border-radius: 50%; background: var(--r-lacivert); color: var(--r-beyaz); display: grid; place-items: center; font-size: 13pt; font-weight: var(--w-dev); position: relative; }
.akis li:last-child::before { background: var(--r-yesil); color: var(--r-lacivertDerin); }
.akis b { display: block; font-size: 13.5pt; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.2; }
.akis span { display: block; margin-top: 0.3mm; }
.akis em { font-style: normal; font-size: var(--o-kucuk); color: var(--r-gri); line-height: 1.3; }
.akis em strong { display: block; font-size: 11pt; letter-spacing: 0.06em; text-transform: uppercase; font-weight: var(--w-kalin); color: var(--r-yesilMetin); }

/* Kazanç */
.grafik-baslik { display: flex; gap: 7mm; font-size: 11pt; font-weight: var(--w-kalin); margin-bottom: 1mm; }
.grafik-baslik i { display: inline-block; width: 3.5mm; height: 3.5mm; margin-right: 1.8mm; vertical-align: -0.3mm; }
table.esik { width: 100%; border-collapse: collapse; font-size: 11pt; margin-top: 3mm; }
table.esik th, table.esik td { text-align: left; padding: 2mm 2.5mm; }
table.esik thead th { font-size: 11pt; letter-spacing: 0.02em; text-transform: uppercase; color: var(--r-gri); font-weight: var(--w-kalin); border-bottom: 1.2px solid var(--r-cizgi); }
table.esik tbody tr + tr td, table.esik tbody tr + tr th { border-top: 1px solid var(--r-sis); }
table.esik tbody th { font-weight: var(--w-baslik); color: var(--r-lacivert); }
table.esik .sag { text-align: right; }
.vurgu-cizgi { font-size: 12.5pt; font-weight: var(--w-kalin); color: var(--r-lacivert); padding-top: 3mm; border-top: 1.2mm solid var(--r-yesil); }
.kural { display: grid; grid-template-columns: 1fr 1.25fr; gap: 6mm; margin-top: 5mm; }

/* Örnek */
.zincir { display: flex; align-items: stretch; gap: 0; background: var(--r-lacivert); color: var(--r-beyaz); border-radius: var(--o-kose); overflow: hidden; }
.zincir div { flex: 1; padding: 5mm 3mm 4.5mm 4mm; }
.zincir div + div { border-left: 1px solid var(--r-cizgiLacivertUstu); }
.zincir small { display: block; font-size: 11pt; color: var(--r-griLacivertUstu); line-height: 1.25; min-height: 2.5em; }
.zincir b { display: block; font-size: 17pt; font-weight: var(--w-dev); letter-spacing: -0.01em; margin-top: 1.5mm; white-space: nowrap; }
.zincir div.son { background: var(--r-yesil); color: var(--r-lacivertDerin); flex: 1.25; }
.zincir div.son small { color: var(--r-lacivertDerin); }
.zincir div.son b { font-size: 21pt; }
.grafik-blok { margin-top: 6mm; }
.uyari-ust { font-size: 11.5pt; font-weight: var(--w-kalin); color: var(--r-yesilMetin); }
.grafik-blok h3 { margin-bottom: 0; }
.bolus { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 3mm; }
.bolus div { background: var(--r-beyaz); border-radius: var(--o-kose); padding: 4mm 4.5mm; }
.bolus div.top { background: var(--r-yesilSoluk); }
.bolus small { display: block; font-size: 11pt; color: var(--r-gri); font-weight: var(--w-kalin); }
.bolus b { display: block; font-size: 17pt; font-weight: var(--w-dev); color: var(--r-lacivert); margin-top: 1mm; }
.bolus span { display: block; font-size: 11pt; color: var(--r-gri); }

/* Roller */
table.roller { width: 100%; border-collapse: collapse; font-size: 11pt; line-height: 1.38; }
table.roller th, table.roller td { text-align: left; vertical-align: top; padding: 2.7mm 2.4mm; }
table.roller thead th { font-size: 11pt; letter-spacing: 0.02em; text-transform: uppercase; color: var(--r-gri); font-weight: var(--w-kalin); border-bottom: 1.2px solid var(--r-cizgi); }
table.roller tbody th { font-size: 12pt; font-weight: var(--w-baslik); color: var(--r-lacivert); width: 28mm; }
table.roller tbody tr + tr > * { border-top: 1px solid var(--r-sis); }
table.roller tbody tr.birincil > * { background: var(--r-sisAcik); }
.rol-detay { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; margin-top: 7mm; }
.rol-detay h3 { font-size: 13pt; }
.rol-detay p { font-size: 11pt; line-height: 1.42; }
.rol-detay .hesap { margin-top: 3mm; background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 3.5mm 4mm; font-size: 11pt; line-height: 1.4; }
.rol-detay .hesap b { display: block; font-size: 16pt; font-weight: var(--w-dev); color: var(--r-lacivert); }

/* Koşullar */
.iki-sutun { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-radius: var(--o-kose); overflow: hidden; }
.iki-sutun > div { padding: 4.8mm 7mm; }
.iki-sutun .biz { background: var(--r-lacivert); color: var(--r-beyaz); }
.iki-sutun .siz { background: var(--r-sisAcik); }
.iki-sutun h3 { font-size: 15pt; }
.iki-sutun .biz h3 { color: var(--r-yesil); }
.iki-sutun ul.liste li { font-size: 11pt; margin-top: 1.2mm; }
.iki-kolon { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8mm; }
.seviye { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 2.5mm; }
.seviye div { padding: 2.5mm 0 0; border-top: 1.2mm solid var(--r-yesil); }
.seviye div:nth-child(2) { border-top-color: var(--r-griLacivertUstu); }
.seviye div:nth-child(3) { border-top-color: var(--r-lacivert); }
.seviye b { display: block; font-size: 12.5pt; font-weight: var(--w-baslik); color: var(--r-lacivert); padding-top: 1.5mm; }
.seviye small { display: block; font-size: 11pt; font-weight: var(--w-kalin); color: var(--r-yesilMetin); }
.seviye span { display: block; font-size: 11pt; line-height: 1.35; margin-top: 1mm; }

/* Son sayfa */
.son .kanca { font-size: 38pt; margin-top: 18mm; }
.son ol.adim { list-style: none; counter-reset: s; margin-top: 12mm; display: grid; gap: 0; }
.son ol.adim li { counter-increment: s; display: grid; grid-template-columns: 16mm 1fr; align-items: center; font-size: 16pt; font-weight: var(--w-kalin); padding: 4.5mm 0; border-bottom: 1px solid var(--r-cizgiLacivertUstu); }
.son ol.adim li::before { content: counter(s); font-size: 24pt; font-weight: var(--w-dev); color: var(--r-yesil); }
.son .adres { margin-top: auto; }
.son .adres .marka { font-size: 44pt; }
.son .adres p.web { font-size: 20pt; font-weight: var(--w-kalin); color: var(--r-yesil); margin-top: 3mm; }
.son .uyari { font-size: 11pt; color: var(--r-griLacivertUstu); margin-top: 8mm; max-width: 150mm; }
`;

const bas = (no, ad) => `<div class="bas">${marka()}<span class="ust">${String(no).padStart(2, '0')}  ${ad}</span></div>`;
const alt = (no) => `<div class="alt"><span>Segika iş ortaklığı programı</span><span class="rakam">${no} / ${TOPLAM}</span></div>`;
const li = (x) => `<li>${x}</li>`;

function kapak() {
  return `<section class="sayfa kapak koyu"><div class="ic">
  <div class="bas">${marka()}<span class="ust">İş ortaklığı programı</span></div>
  <h1 class="kanca">${M.kapak.kanca}</h1>
  <p class="kanca2">${M.kapak.kanca2}</p>
  <div class="serit"><p><b>12 ay, 12 bordro.</b> Her bordroda bir teşvik kontrolü vardır.</p>${aySeridi({ genislik: 640, boyut: 15 })}</div>
  <div class="davet">
    <div><b>${M.kapak.davet}</b><p>${M.kapak.kitle}</p></div>
    <p class="tanim">${M.kapak.tesvik}</p>
  </div>
  </div><div class="alt"><span>El kitapçığı</span><span>${TARIH}</span></div></section>`;
}

function neden() {
  return `<section class="sayfa"><div class="ic">${bas(2, 'Neden siz')}
  <h2 class="kanca">${M.neden.kanca}</h2>
  <div class="sizsiniz">
    <div><p>${M.neden.p.join(' ')}</p></div>
    <div><p>${M.neden.siz.join(' ')}</p></div>
  </div>
  <div class="yuzey" style="margin-top:8mm">
    <p class="buyuk-alinti">${M.neden.soru}</p>
    <p style="margin-top:3mm">${M.neden.soruAlt}</p>
  </div>
  <div class="izgara3" style="margin-top:auto;padding-top:8mm">${M.neden.sizinIcin.map((x) => `<div><h3>${x.b}</h3><p class="kucuk-govde">${x.m}</p></div>`).join('')}</div>
  <div class="kimler"><h3>${M.neden.kimlerBaslik}</h3><ul class="liste">${M.neden.kimler.map(li).join('')}</ul><p class="not" style="margin-top:2mm">${M.neden.mukellef}</p></div>
  <p class="giris" style="margin-top:auto;padding-top:8mm"><span class="vurgu">${M.neden.olcekGiris}</span></p>
  <div class="olcek">${OLCEK.map((o) => `<div><b>${o.sayi}</b><span>${o.metin}</span></div>`).join('')}</div>
  <p class="kaynak" style="margin-top:3mm">${M.neden.kaynak}</p>
  </div>${alt(2)}</section>`;
}

function urun() {
  return `<section class="sayfa"><div class="ic">${bas(3, 'Müşteriniz ne kazanır')}
  <h2 class="kanca">${M.urun.kanca}</h2>
  <p class="giris">${M.urun.tanim}</p>
  <p style="margin-top:2mm">${M.urun.paketAyrimi}</p>
  <div class="isler" style="margin-top:8mm">${M.urun.isler.map((x) => `<div><b>${x.b}</b><p>${x.m}</p></div>`).join('')}</div>
  <div class="entegre"><p>${M.urun.entegrasyon} ${M.urun.entegrasyonPaket}</p><ul><li>Luca</li><li>Mikro</li><li>ETA</li></ul></div>
  <h3 style="margin-top:auto">Liste fiyatları</h3>
  <p>${M.urun.fiyatNot}</p>
  <div class="fiyatlar">${PAKETLER.map((p, i) => `<div class="${i === 2 ? 'one' : ''}"><small>${p.ad}</small><b class="rakam">${tl(p.fiyat)}</b><span>${p.kisa}. 25 çalışan için aylık.</span></div>`).join('')}</div>
  <p class="not" style="margin-top:4mm">${M.urun.kdv} ${M.urun.teklif} ${M.urun.ayni}</p>
  <p class="kaynak" style="margin-top:2mm">Fiyatlar segika.com fiyat sayfasından alındı. Site 23 Kasım 2026 Pazartesi günü okundu.</p>
  </div>${alt(3)}</section>`;
}

function surec() {
  const K = M.kosullar;
  return `<section class="sayfa"><div class="ic">${bas(4, 'Nasıl işler')}
  <h2 class="kanca">${M.surec.kanca}</h2>
  <ol class="akis">${M.surec.adimlar.map((a) => `<li><div><b>${a.b}</b><span>${a.m}</span></div><em><strong>Bu adımı yapan</strong>${a.kim}</em></li>`).join('')}</ol>
  <div style="margin-top:2mm"><h3>Kayıt kuralı</h3><ul class="liste">${M.surec.kayit.map(li).join('')}<li>Kurulumdan önce çalışan verisine erişimin yasal dayanağı yazılır.</li></ul></div>
  <div class="yuzey" style="margin-top:auto">
    <h3>Mali müşavirler için iki yol</h3>
    <p>${K.musavir}</p>
    <p>${K.nakitsiz} ${K.bekliyor}</p>
    <div class="seviye">${K.seviyeler.map((s) => `<div><small>${s.kosul}</small><b>${s.ad}</b><span>${s.m}</span></div>`).join('')}</div>
    <p style="margin-top:2.5mm">${K.sartlar} ${K.panel} ${K.ikiYol}</p>
  </div>
  </div>${alt(4)}</section>`;
}

function kazanc() {
  const kap = basamaklar('kapatir');
  const tan = basamaklar('tanistir');
  return `<section class="sayfa"><div class="ic">${bas(5, 'Ne kazanırsınız')}
  <h2 class="kanca">${M.kazanc.kanca}</h2>
  <p class="giris">${M.kazanc.ciro} ${M.kazanc.tamami}</p>
  <div style="margin-top:7mm">
    <div class="grafik-baslik"><span><i style="background:${R.lacivert}"></i>Satışı kapatırsanız</span><span><i style="background:${R.tanistirma}"></i>Yalnız tanıştırırsanız</span></div>
    ${basamakGrafik({ seriler: [{ ad: 'Kapatır', renk: R.lacivert, basamaklar: kap }, { ad: 'Tanıştırır', renk: R.tanistirma, basamaklar: tan }], genislik: 640, yukseklik: 205, boyut: 15, esikYaz: false })}
  </div>
  <table class="esik"><thead><tr><th>Basamak</th><th>Satışı kapatırsanız</th><th class="sag">Oran</th><th>Yalnız tanıştırırsanız</th><th class="sag">Oran</th></tr></thead><tbody>
  ${kap.map((b, i) => `<tr><th>${b.ad}</th><td>${i === 0 ? '30.000 TL altı' : `${tl(b.esik)} ve üstü`}</td><td class="sag rakam"><b>${yuzde(b.oran)}</b></td><td>${i === 0 ? '30.000 TL altı' : `${tl(tan[i].esik)} ve üstü`}</td><td class="sag rakam"><b>${i === 0 ? 'Pay yok' : yuzde(tan[i].oran)}</b></td></tr>`).join('')}
  </tbody></table>
  <p style="margin-top:2mm">Tablodaki tutarlar aylık cirodur. <b>${M.kazanc.esik}</b></p>
  <div class="kural">
    <div><h3>Kim ne yapar?</h3><p>${M.kazanc.kapatir}</p></div>
    <div><h3>Sonraki yıllar</h3><p>${M.kazanc.surer} ${M.kazanc.yilKapatir} ${M.kazanc.yilTanistir} ${M.kazanc.hakDegil}</p></div>
  </div>
  <p class="vurgu-cizgi" style="margin-top:auto">${M.kazanc.k1}</p>
  </div>${alt(5)}</section>`;
}

function ornek() {
  const z = [
    ['Paketin aylık bedeli', tl(ORNEK.paket)],
    ['Yıllık bedel', tl(ORNEK.yillik)],
    ['2 işverenin cirosu', tl(ORNEK.ciro)],
    ['Ulaşılan oran', yuzde(ORNEK.oran)],
  ];
  return `<section class="sayfa"><div class="ic">${bas(6, 'Örnek hesap')}
  <h2 class="kanca" style="margin-bottom:2mm">${M.ornek.kanca}</h2>
  <p class="uyari-ust">${M.ornek.uyari}</p>
  <p class="giris" style="margin-top:4mm">${M.ornek.durum}</p>
  <div class="zincir" style="margin-top:5mm">${z.map(([a, b]) => `<div><small>${a}</small><b class="rakam">${b}</b></div>`).join('')}<div class="son"><small>Bu ayki kazancınız</small><b class="rakam">${tl(ORNEK.kazanc)}</b></div></div>
  <p class="not" style="margin-top:2mm">Hesap: 2.600 TL × 12 = 31.200 TL. Sonra 31.200 TL × 2 = 62.400 TL. Sonra 62.400 TL × %20 = 12.480 TL.</p>
  <div class="grafik-blok"><h3>${M.ornek.yenile}</h3>${yilGrafik({ yillar: ORNEK.yillar, genislik: 640, yukseklik: 175, boyut: 15, renkler: [R.yesil, R.lacivert, R.lacivert, R.lacivert] })}<p>Dört yılın toplamı <b>${tl(ORNEK.toplam)}</b> olur. ${M.ornek.saglama} ${M.kazanc.hakDegil}</p></div>
  <div class="grafik-blok"><h3>Aynı ayda daha çok işveren</h3>${yilGrafik({ yillar: ISVEREN_SAYISI.map((x) => ({ ad: `${x.n} işveren`, oran: x.oran, tutar: x.kazanc })), genislik: 640, yukseklik: 175, boyut: 15, renkler: [R.lacivert, R.yesil, R.lacivert, R.lacivert] })}<p>${M.ornek.daha} 3 işverende ciro 93.600 TL olur ve oran %25'e çıkar. <b>${M.ornek.esikNot}</b></p></div>
  </div>${alt(6)}</section>`;
}

function roller() {
  const L = M.roller.liste;
  const detay = {
    kadrolu: `<p>Siz Segika'nın maaşlı ve sigortalı satış çalışanısınız. Kota, net maaşınızın 2 katı kadar cirodur. Kotayı aşan cironun %10'u priminiz olur.</p>
      <div class="hesap">Örnek: net maaş ${tl(KADROLU_ORNEK.maas)}. Kota ${tl(KADROLU_ORNEK.kota)}. Bir ayda 5 yıllık paket satılır. Ciro ${tl(KADROLU_ORNEK.ciro)} olur. Kotayı aşan tutar ${tl(KADROLU_ORNEK.asan)} olur.<b class="rakam">Prim ${tl(KADROLU_ORNEK.prim)}</b></div>`,
    tavsiye: `<p>Siz yalnız tanıştırırsınız. Satışı, kurulumu ve desteği Segika yürütür. Ödülünüz nakit değildir. Ödülünüz ücretsiz kullanımdır. Yeni müşteri de 1 ay ücretsiz kullanım alır.</p>
      <div class="hesap">Yeni müşteri yıllık paket alır ve 60 gün kullanır. Paketiniz aylık 2.600 TL ise 2 ay ${tl(TAVSIYE_ORNEK.kredi)} eder. Yılda en çok 3 tavsiye sayılır.<b class="rakam">Yılda ${tl(TAVSIYE_ORNEK.yillik)}</b></div>`,
    elci: `<p>Siz Segika'yı kitlenize anlatırsınız. Her ticari paylaşımın başına “reklam” yazarsınız. İlgilenen işveren size özel bağlantıyla başvurur.</p>
      <div class="hesap">Bağlantınızdan 2 işveren bir ayda yıllık paket alır. Ciro ${tl(ELCI.ciro)} olur. Oran ${yuzde(ELCI.oran)} olur.<b class="rakam">Kazanç ${tl(ELCI.kazanc)}</b></div>`,
  };
  return `<section class="sayfa"><div class="ic">${bas(7, 'Dört ortaklık yolu')}
  <h2 class="kanca">${M.roller.kanca}</h2>
  <table class="roller"><thead><tr><th>Yol</th><th>Kimdir</th><th>Ne yapar</th><th>Nasıl kazanır</th><th>Nasıl başlar</th></tr></thead><tbody>
  ${L.map((r) => `<tr class="${r.id === 'cozum' ? 'birincil' : ''}"><th>${r.ad}</th><td>${r.kim}</td><td>${r.ne}</td><td>${r.kazanc}</td><td>${r.ilk}</td></tr>`).join('')}
  </tbody></table>
  <div class="rol-detay">${L.filter((r) => r.id !== 'cozum').map((r) => `<div><h3>${r.ad}</h3>${detay[r.id]}</div>`).join('')}</div>
  <p class="not" style="margin-top:auto">Bu sayfadaki tutarlar örnektir. Oranlar ve süreler bugünkü plandır. Kesin değerler yazılı anlaşmada belirlenir. Mevcut müşterinin geçerli koşulunu müşteri sorumlusu tavsiyeden önce yazılı bildirir. Kadrolu uzmanın prim koşulları iş sözleşmesinin ekine yazılır.</p>
  </div>${alt(7)}</section>`;
}

function kosullar() {
  const K = M.kosullar;
  return `<section class="sayfa"><div class="ic">${bas(8, 'Koşullar')}
  <h2 class="kanca">${K.kanca}</h2>
  <div class="iki-sutun">
    <div class="biz koyu"><h3>Segika ne yapar</h3><ul class="liste">${K.biz.map(li).join('')}</ul></div>
    <div class="siz"><h3>Siz ne yaparsınız</h3><ul class="liste">${K.siz.map(li).join('')}</ul></div>
  </div>
  <div style="margin-top:auto;padding-top:6mm"><h3>Herkes için sınırlar</h3><ul class="liste iki-kolon">${K.sinirlar.map(li).join('')}</ul></div>
  <div style="margin-top:auto;padding-top:6mm"><h3>Ödeme ve eğitim</h3><p>${K.odeme} ${K.egitim}</p></div>
  <div class="yuzey" style="margin-top:auto">
    <h3>Tanıştıran ve kapatan farklıysa</h3>
    <p>${M.ornek.bolusme} Örnekte ciro ${tl(BOLUSME.ciro)} olur.</p>
    <div class="bolus">
      <div><small>Tanıştıran</small><b class="rakam">${tl(BOLUSME.tanistiran)}</b><span>${tl(BOLUSME.ciro)} × ${yuzde(BOLUSME.tOran)}</span></div>
      <div><small>Satışı kapatan</small><b class="rakam">${tl(BOLUSME.kapatan)}</b><span>${tl(BOLUSME.ciro)} × ${yuzde(BOLUSME.kapatanOran)}</span></div>
      <div class="top"><small>Segika'nın toplam ödemesi</small><b class="rakam">${tl(BOLUSME.toplam)}</b><span>Toplam oran %20 kalır.</span></div>
    </div>
  </div>
  </div>${alt(8)}</section>`;
}

function son() {
  return `<section class="sayfa son koyu"><div class="ic">
  <div class="bas">${marka()}<span class="ust">09  İlk adım</span></div>
  <h2 class="kanca">${M.ilk.kanca}</h2>
  <ol class="adim">${M.ilk.adimlar.map(li).join('')}</ol>
  <div class="adres">${marka()}<p class="web">segika.com</p><p class="uyari">${M.ilk.not} Belge ${TARIH} hazırlandı.</p></div>
  </div>${alt(9)}</section>`;
}

export function kitapcikHtml() {
  return htmlDuzelt(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Segika iş ortaklığı el kitapçığı</title>
<style>${tokenCss('kitapcik')}${css}</style></head><body>
${[kapak(), neden(), urun(), surec(), kazanc(), ornek(), roller(), kosullar(), son()].join('\n')}
</body></html>`);
}
