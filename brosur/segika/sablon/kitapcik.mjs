/** El kitapçığı: A4 dikey, 11 sayfa. Okunacak belge. Koşullar, süreç ve hesap örnekleri eksiksizdir. */
import { tokenCss, marka, aySeridi, basamakGrafik, yilGrafik, ayCubuk, binTl, TOKENS, htmlDuzelt, KAPAK_DIKEY } from './ortak.mjs';
import { M, TARIH, CALISAN, PAKETLER, OLCEK, ORNEK, SEVIYE, AYLIK, BOLUSME, ELCI, basamaklar, tl, yuzde } from '../icerik.mjs';

const R = TOKENS.renk;
const TOPLAM = 11;

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
/* İş kazası kutusu kalkınca paketler alt alta dizilir. Her pakette ad ve açıklama solda, fiyat sağdadır. */
.fiyatlar.satir { grid-template-columns: 1fr; gap: 5mm; margin-top: 7mm; }
.fiyatlar.satir div { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; column-gap: 8mm; align-items: center; padding: 10mm 10mm; }
.fiyatlar.satir small { font-size: 15pt; grid-column: 1; grid-row: 1; }
.fiyatlar.satir span { font-size: 12.5pt; grid-column: 1; grid-row: 2; margin-top: 2mm; }
.fiyatlar.satir b { font-size: 40pt; grid-column: 2; grid-row: 1 / span 2; margin-top: 0; }

/* Süreç */
.akis { list-style: none; counter-reset: a; position: relative; }
.akis::before { content: ''; position: absolute; left: 4.9mm; top: 7mm; bottom: 7mm; width: 1.2mm; background: var(--r-sis); }
.akis li { counter-increment: a; position: relative; display: grid; grid-template-columns: 11mm 1fr 46mm; gap: 6mm; align-items: center; padding: 2.6mm 0; }
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
table.roller th, table.roller td { text-align: left; vertical-align: top; padding: 4.5mm 2.4mm; }
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

/* Kapak: tam sayfa fotoğraf, üstte marka, fotoğrafın üstünde düz renkli metin alanı. Kutunun köşesi düzdür. */
.kapak { padding: 0; background: var(--r-beyaz); }
.kapak .ust-bant { height: 30mm; padding: 0 var(--o-kenar); display: flex; justify-content: space-between; align-items: center; }
.kapak .ust-bant .marka { font-size: 26pt; color: var(--r-lacivert); }
.kapak .ust-bant .tur { font-size: 15pt; font-weight: var(--w-baslik); color: var(--r-lacivert); }
.kapak .foto { position: absolute; left: 0; right: 0; top: 30mm; bottom: 0; overflow: hidden; }
.kapak .foto img { width: 100%; height: 100%; object-fit: cover; object-position: 35% 20%; display: block; }
.kapak .kutu { position: absolute; right: 0; bottom: 24mm; width: 128mm; background: var(--r-lacivert); color: var(--r-beyaz); padding: 10mm 12mm 9mm 11mm; }
.kapak .kutu .ust { color: var(--r-yesil); }
.kapak .kutu h1 { font-size: 25pt; font-weight: var(--w-baslik); line-height: 1.12; letter-spacing: -0.01em; margin-top: 4mm; text-wrap: balance; }
.kapak .kutu p { font-size: 11pt; color: var(--r-griLacivertUstu); margin-top: 5mm; }

/* Açılış */
.acilis .kanca { font-size: 33pt; line-height: 1.04; margin-top: 3mm; max-width: 172mm; }
.acilis .kanca2 { font-size: 20pt; font-weight: var(--w-baslik); color: var(--r-yesil); margin-top: 3mm; }
.acilis .tanim { font-size: 12pt; margin-top: 4mm; color: var(--r-griLacivertUstu); max-width: 165mm; }
.acilis .isler4 { display: grid; grid-template-columns: 1fr 1fr; gap: 9mm 10mm; margin-top: 10mm; }
.acilis .isler4 b { display: block; font-size: 16pt; font-weight: var(--w-baslik); color: var(--r-yesil); margin-bottom: 1.5mm; }
.acilis .isler4 p { font-size: 13pt; line-height: 1.4; color: var(--r-beyaz); }
.acilis .serit { margin-top: auto; padding-top: 5mm; }
.acilis .serit .s1 { font-size: 12.5pt; color: var(--r-beyaz); font-weight: var(--w-kalin); }
.acilis .serit .s2 { font-size: 11pt; color: var(--r-griLacivertUstu); margin-top: 1mm; }
.acilis .serit .s2 b { color: var(--r-yesil); }
.acilis .serit .s3 { font-size: 11pt; color: var(--r-griLacivertUstu); margin-top: 1.5mm; }
.acilis .davet { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 5mm; padding-top: 3mm; border-top: 1px solid var(--r-cizgiLacivertUstu); }
.acilis .davet b { font-size: 14pt; font-weight: var(--w-baslik); line-height: 1.25; }
.acilis .davet p { font-size: 11pt; color: var(--r-griLacivertUstu); }

/* Yıllık sayfa: seviyeler */
.merdiven { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; align-items: end; margin-top: 3mm; }
.merdiven div { background: var(--r-sisAcik); padding: 3.5mm; display: flex; flex-direction: column; justify-content: flex-start; gap: 0.8mm; }
.merdiven div:nth-child(1) { height: 25mm; } .merdiven div:nth-child(2) { height: 28mm; }
.merdiven div:nth-child(3) { height: 31mm; } .merdiven div:nth-child(4) { height: 34mm; }
.merdiven div.burada { background: var(--r-lacivert); color: var(--r-beyaz); }
.merdiven small { font-size: 11pt; font-weight: var(--w-kalin); color: var(--r-gri); line-height: 1.2; }
.merdiven div.burada small { color: var(--r-yesil); }
.merdiven b { font-size: 22pt; font-weight: var(--w-dev); color: var(--r-lacivert); line-height: 1.05; }
.merdiven div.burada b { color: var(--r-beyaz); }
.merdiven span { font-size: 11pt; line-height: 1.25; }
.ilerleme { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 3mm; }
.ilerleme p { font-size: 11.5pt; }
.ilerleme .kalan { font-weight: var(--w-baslik); color: var(--r-yesilMetin); font-size: 13pt; line-height: 1.3; }
.dort-yil { display: grid; grid-template-columns: 1fr 1.3fr; gap: 6mm; align-items: center; margin-top: 4mm; }
.dort-yil .buyuk { font-size: 24pt; font-weight: var(--w-dev); color: var(--r-lacivert); line-height: 1.02; letter-spacing: -0.02em; }
.dort-yil .buyuk em { font-style: normal; color: var(--r-yesilMetin); }

/* Aylık sayfa */
.kumulatif-kutu { background: var(--r-yesilSoluk); padding: 3.5mm 5mm; margin-top: 3mm; font-size: 12.5pt; }
.kumulatif-kutu b { font-weight: var(--w-dev); color: var(--r-lacivert); }
table.aylik { width: 100%; border-collapse: collapse; font-size: 11pt; margin-top: 2mm; }
table.aylik th, table.aylik td { padding: 0.6mm 2mm; text-align: right; }
table.aylik th:first-child, table.aylik td:first-child { text-align: left; }
table.aylik thead th { font-weight: var(--w-kalin); color: var(--r-gri); border-bottom: 1.2px solid var(--r-cizgi); }
table.aylik tbody tr + tr td { border-top: 1px solid var(--r-sis); }
table.aylik td.b { font-weight: var(--w-baslik); color: var(--r-lacivert); }

.olcek6 { grid-template-columns: repeat(3, 1fr); }
.olcek6 div:nth-child(4) { border-left: 0; }
.olcek6 div:nth-child(n+4) { border-top: 1px solid var(--r-cizgiLacivertUstu); }
.olcek6 b { font-size: 22pt; }
.olcek6 div { padding: 5mm 5mm 4.5mm; }
.olcek6 span { margin-top: 2mm; }

/* Sözler */
.sozler ul.liste li { font-size: 12.5pt; margin-top: 2.2mm; }
.sozler .iki-sutun > div { padding: 7mm 8mm; }
`;

const bas = (no, ad) => `<div class="bas">${marka()}<span class="ust">${String(no).padStart(2, '0')}  ${ad}</span></div>`;
const alt = (no) => `<div class="alt"><span>Segika iş ortaklığı el kitapçığı</span><span class="rakam">${no} / ${TOPLAM}</span></div>`;
const li = (x) => `<li>${x}</li>`;

function kapak() {
  return `<section class="sayfa kapak">
  <div class="ust-bant">${marka()}<span class="tur">${M.kapak.kitapcik}</span></div>
  <div class="foto"><img src="${KAPAK_DIKEY}" alt="Takım elbiseli bir danışman ofiste kollarını kavuşturmuş duruyor."></div>
  <div class="kutu"><p class="ust" style="margin-top:0">${M.kapak.baslik}</p><h1>${M.kapak.alt}</h1><p>${M.kapak.kitapcik}. ${TARIH} hazırlandı.</p></div>
  </section>`;
}

function acilis() {
  const A = M.acilis;
  return `<section class="sayfa acilis koyu"><div class="ic">${bas(2, 'Segika ne yapar')}
  <h1 class="kanca">${A.kanca}</h1>
  <p class="kanca2">${A.kanca2}</p>
  <p class="tanim">${A.tanim}</p>
  <div class="isler4">${A.isler.map((x) => `<div><b>${x.b}</b><p>${x.m}</p></div>`).join('')}</div>
  <div class="serit">
    <p class="s1">${A.serit}</p>
    <p class="s2">${A.cubuk}</p>
    ${ayCubuk({ degerler: AYLIK.map((a) => a.birikim), genislik: 640, yukseklik: 165, boyut: 15 })}
    ${aySeridi({ genislik: 640, boyut: 15 })}
    <p class="s3">Çubuktaki tutarlar bin TL'dir. ${A.cubukNot}</p>
  </div>
  <div class="davet"><b>${A.davet}</b><p>${A.tesvik}</p></div>
  </div>${alt(2)}</section>`;
}

function neden() {
  const N = M.neden;
  return `<section class="sayfa"><div class="ic">${bas(3, 'Neden siz')}
  <h2 class="kanca">${N.kanca}</h2>
  <div class="sizsiniz">
    <div><p>${N.p.join(' ')}</p></div>
    <div><p>${N.siz.join(' ')}</p></div>
  </div>
  <div class="yuzey" style="margin-top:5mm">
    <p class="buyuk-alinti">${N.soru}</p>
    <p style="margin-top:2mm">${N.soruAlt}</p>
  </div>
  <div class="izgara3" style="margin-top:5mm">${N.sizinIcin.map((x) => `<div><h3>${x.b}</h3><p class="kucuk-govde">${x.m}</p></div>`).join('')}</div>
  <div class="kimler" style="padding-top:5mm"><h3>${N.kimlerBaslik}</h3><ul class="liste">${N.kimler.map(li).join('')}</ul><p class="not" style="margin-top:1.5mm">${N.mukellef}</p></div>
  <p class="giris" style="margin-top:auto;padding-top:5mm"><span class="vurgu">${N.olcekGiris}</span></p>
  <div class="olcek olcek6">${OLCEK.map((o) => `<div><b>${o.sayi}</b><span>${o.metin}</span></div>`).join('')}<div><span>${N.sicil}</span></div></div>
  <p class="kaynak" style="margin-top:2mm">${N.kaynak} ${N.beyan}</p>
  </div>${alt(3)}</section>`;
}

function plan() {
  const P = M.plan;
  return `<section class="sayfa"><div class="ic">${bas(4, 'Paketler ve fiyatlar')}
  <h2 class="kanca">${P.kanca}</h2>
  <p class="giris">${P.fiyatNot}</p>
  <div class="fiyatlar satir">${PAKETLER.map((p, i) => `<div class="${i === 2 ? 'one' : ''}"><small>${p.ad}</small><b class="rakam">${tl(p.fiyat)}</b><span>${p.kisa}. ${CALISAN} çalışan için aylık.</span></div>`).join('')}</div>
  <p style="margin-top:7mm">${P.paketAyrimi}</p>
  <p class="not" style="margin-top:auto">${P.kdv} ${P.teklif} ${P.ayni}</p>
  </div>${alt(4)}</section>`;
}

function surec() {
  const S = M.surec;
  return `<section class="sayfa"><div class="ic">${bas(5, 'Nasıl işler')}
  <h2 class="kanca">${S.kanca}</h2>
  <ol class="akis">${S.adimlar.map((a) => `<li><div><b>${a.b}</b><span>${a.m}</span></div><em><strong>Bu adımı yapan</strong>${a.kim}</em></li>`).join('')}</ol>
  <div style="margin-top:2mm"><h3>Kayıt kuralı</h3><ul class="liste">${S.kayit.map(li).join('')}</ul></div>
  </div>${alt(5)}</section>`;
}

function kazanc() {
  const K = M.kazanc;
  const kap = basamaklar('kapatir');
  const tan = basamaklar('tanistir');
  return `<section class="sayfa"><div class="ic">${bas(6, 'Ne kazanırsınız')}
  <h2 class="kanca">${K.kanca}</h2>
  <p class="giris">${K.ciro} ${K.tamami}</p>
  <div style="margin-top:4mm">
    <div class="grafik-baslik"><span><i style="background:${R.lacivert}"></i>Satışı kapatırsanız</span><span><i style="background:${R.tanistirma}"></i>Yalnız tanıştırırsanız</span></div>
    ${basamakGrafik({ seriler: [{ ad: 'Kapatır', renk: R.lacivert, basamaklar: kap }, { ad: 'Tanıştırır', renk: R.tanistirma, basamaklar: tan }], genislik: 640, yukseklik: 165, boyut: 15, esikYaz: false })}
  </div>
  <table class="esik"><thead><tr><th>Basamak</th><th>Satışı kapatırsanız</th><th class="sag">Oran</th><th>Yalnız tanıştırırsanız</th><th class="sag">Oran</th></tr></thead><tbody>
  ${kap.map((b, i) => `<tr><th>${b.ad}</th><td>${i === 0 ? '30.000 TL altı' : `${tl(b.esik)} ve üstü`}</td><td class="sag rakam"><b>${yuzde(b.oran)}</b></td><td>${i === 0 ? '30.000 TL altı' : `${tl(tan[i].esik)} ve üstü`}</td><td class="sag rakam"><b>${i === 0 ? 'Pay yok' : yuzde(tan[i].oran)}</b></td></tr>`).join('')}
  </tbody></table>
  <p style="margin-top:2mm">${K.tablo} <b>${K.esik}</b></p>
  <div class="kural">
    <div><h3>Kim ne yapar?</h3><p>${K.kapatir}</p></div>
    <div><h3>Sonraki yıllar</h3><p>${K.surer} ${K.yilKapatir} ${K.yilTanistir}</p></div>
  </div>
  <p class="vurgu-cizgi" style="margin-top:auto">${K.k1}</p>
  </div>${alt(6)}</section>`;
}

function yillik() {
  const Y = M.yillik;
  const z = [['Paketin aylık bedeli', tl(ORNEK.paket)], ['Yıllık bedel', tl(ORNEK.yillik)], ['2 işverenin cirosu', tl(ORNEK.ciro)], ['Ulaşılan oran', yuzde(ORNEK.oran)]];
  return `<section class="sayfa"><div class="ic">${bas(7, Y.ust)}
  <h2 class="kanca" style="margin-bottom:1.5mm">${Y.kanca}</h2>
  <p class="uyari-ust">${Y.uyari}</p>
  <p style="margin-top:2mm">${Y.durum}</p>
  <div class="zincir" style="margin-top:3mm">${z.map(([a, b]) => `<div><small>${a}</small><b class="rakam">${b}</b></div>`).join('')}<div class="son"><small>Bu ayki kazancınız</small><b class="rakam">${tl(ORNEK.kazanc)}</b></div></div>
  <p class="not" style="margin-top:1.5mm">${Y.hesap}</p>
  <h3 style="margin-top:4mm">${Y.seviyeBaslik}</h3>
  <div class="merdiven">${SEVIYE.liste.map((s) => `<div class="${s.no === SEVIYE.ornek ? 'burada' : ''}"><small>${s.no === SEVIYE.ornek ? Y.buradasiniz : s.ad}</small><b class="rakam">${yuzde(s.oran)}</b><span>${s.esik ? `${tl(s.esik)} ve üstü` : '30.000 TL altı'}</span></div>`).join('')}</div>
  <div class="ilerleme"><p class="kalan">${Y.yol}</p><p>${Y.birIsveren} ${Y.varsayim}</p></div>
  <div class="dort-yil">
    <p class="buyuk"><em>${Y.dortYil}</em></p><p>${Y.dortYilAlt} ${M.kazanc.yilKapatir}</p>
  </div>
  <div>${yilGrafik({ yillar: ORNEK.yillar, genislik: 640, yukseklik: 108, boyut: 15 })}</div>
  <p style="margin-top:2mm">${Y.toplam} ${Y.saglama} ${M.kazanc.hakDegil}</p>
  <p class="not" style="margin-top:auto"><b>${Y.esikNot}</b> ${M.kazanc.k1}</p>
  </div>${alt(7)}</section>`;
}

function aylik() {
  const A = M.aylik;
  const renk = (o) => (o === 0.3 ? R.yesil : o === 0.25 ? R.lacivert : o === 0.2 ? R.tanistirma : R.cizgi);
  return `<section class="sayfa"><div class="ic">${bas(8, A.ust)}
  <h2 class="kanca" style="margin-bottom:1.5mm">${A.kanca}</h2>
  <p class="kumulatif-kutu">${A.neden}</p>
  <p class="uyari-ust" style="margin-top:3mm">${A.uyari}</p>
  <p style="margin-top:1.5mm">${A.durum} ${A.oran}</p>
  <div style="margin-top:3mm">${ayCubuk({ degerler: AYLIK.map((a) => a.kazanc), genislik: 640, yukseklik: 128, boyut: 15, renkler: AYLIK.map((a) => renk(a.oran)), yazi: R.murekkep, altRenk: R.gri, alt: (i) => `${i + 1}. ay`, eksen: R.cizgi })}</div>
  <p class="not">Çubuk o ayın kazancını gösterir. Tutarlar bin TL'dir. Renk ulaşılan oranı gösterir: gri %15, açık mavi %20, lacivert %25, yeşil %30.</p>
  <table class="aylik"><thead><tr><th>Ay</th><th>İşveren</th><th>Aylık ciro</th><th>Oran</th><th>O ayın kazancı</th><th>Kümülatif kazanç</th></tr></thead><tbody>
  ${AYLIK.map((a) => `<tr><td>${a.ay}. ay</td><td class="rakam">${a.isveren}</td><td class="rakam">${tl(a.ciro)}</td><td class="rakam">${yuzde(a.oran)}</td><td class="rakam">${tl(a.kazanc)}</td><td class="rakam b">${tl(a.birikim)}</td></tr>`).join('')}
  </tbody></table>
  <p class="vurgu-cizgi" style="margin-top:3mm">${A.sonuc}</p>
  <p class="not" style="margin-top:auto">${A.varsayim}</p>
  </div>${alt(8)}</section>`;
}

function roller() {
  const Rl = M.roller;
  return `<section class="sayfa"><div class="ic">${bas(9, Rl.baslik)}
  <h2 class="kanca">${Rl.kanca}</h2>
  <table class="roller"><thead><tr><th>Yol</th><th>Kimdir</th><th>Ne yapar</th><th>Nasıl kazanır</th><th>Nasıl başlar</th></tr></thead><tbody>
  ${Rl.liste.map((r) => `<tr class="${r.id === 'cozum' ? 'birincil' : ''}"><th>${r.ad}</th><td>${r.kim}</td><td>${r.ne}</td><td>${r.kazanc}${r.kazancNot ? `. ${r.kazancNot}` : ''}</td><td>${r.ilk}</td></tr>`).join('')}
  </tbody></table>
  <div class="izgara2" style="margin-top:5mm">
    <div><h3>Çözüm ortağı</h3><p>${Rl.cozum}</p><p>${Rl.cozumEgitim}</p></div>
    <div><h3>Marka elçisi</h3><p>${Rl.elci}</p><p style="margin-top:2mm">${Rl.elciHesap} <span class="vurgu">Kazanç ${tl(ELCI.kazanc)} olur.</span></p></div>
  </div>
  <div class="yuzey" style="margin-top:5mm">
    <h3>Tanıştıran ve kapatan farklıysa</h3>
    <p>${M.kazanc.bolusme} Örnekte ciro ${tl(BOLUSME.ciro)} olur.</p>
    <div class="bolus">
      <div><small>Tanıştıran</small><b class="rakam">${tl(BOLUSME.tanistiran)}</b><span>${tl(BOLUSME.ciro)} × ${yuzde(BOLUSME.tOran)}</span></div>
      <div><small>Satışı kapatan</small><b class="rakam">${tl(BOLUSME.kapatan)}</b><span>${tl(BOLUSME.ciro)} × ${yuzde(BOLUSME.kapatanOran)}</span></div>
      <div class="top"><small>Segika'nın toplam ödemesi</small><b class="rakam">${tl(BOLUSME.toplam)}</b><span>${M.kazanc.bolusmeToplam}</span></div>
    </div>
  </div>
  <p class="not" style="margin-top:auto">${Rl.not}</p>
  </div>${alt(9)}</section>`;
}

function sozler() {
  const S = M.sozler;
  return `<section class="sayfa sozler"><div class="ic">${bas(10, 'Taahhütler')}
  <h2 class="kanca" style="margin-bottom:2mm">${S.kanca}</h2>
  <p class="giris" style="margin-bottom:4mm">${S.giris}</p>
  <div class="iki-sutun">
    <div class="biz koyu"><h3>Segika'nın taahhütleri</h3><ul class="liste">${S.segika.map(li).join('')}</ul></div>
    <div class="siz"><h3>Sizin taahhütleriniz</h3><ul class="liste">${S.siz.map(li).join('')}</ul></div>
  </div>
  <div style="margin-top:6mm"><h3>${S.ortakBaslik}</h3><ul class="liste">${S.ortak.map(li).join('')}<li>${M.kazanc.k1}</li></ul></div>
  </div>${alt(10)}</section>`;
}

function son() {
  return `<section class="sayfa son koyu"><div class="ic">
  <div class="bas">${marka()}<span class="ust">11  İlk adım</span></div>
  <h2 class="kanca">${M.ilk.kanca}</h2>
  <ol class="adim">${M.ilk.adimlar.map(li).join('')}</ol>
  <div class="adres">${marka()}<p class="web">segika.com</p><p class="uyari">Belge ${TARIH} hazırlandı.</p></div>
  </div>${alt(11)}</section>`;
}

export function kitapcikHtml() {
  return htmlDuzelt(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Segika iş ortaklığı el kitapçığı</title>
<style>${tokenCss('kitapcik')}${css}</style></head><body>
${[kapak(), acilis(), neden(), plan(), surec(), kazanc(), yillik(), aylik(), roller(), sozler(), son()].join('\n')}
</body></html>`);
}
