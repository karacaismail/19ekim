/** Görsel sunum: A4 yatay, 9 sayfa. Az metin, büyük sayılar, şemalar. Ekranda ve baskıda tam sayfa. */
import { tokenCss, marka, aySeridi, basamakGrafik, yilGrafik, TOKENS, htmlDuzelt } from './ortak.mjs';
import { M, TARIH, PAKETLER, OLCEK, ORNEK, basamaklar, tl, yuzde } from '../icerik.mjs';

const R = TOKENS.renk;
const TOPLAM = 9;

const css = `
@page { size: 297mm 210mm; margin: 0; }
.sayfa { width: 297mm; height: 210mm; padding: var(--o-kenar) 18mm; display: flex; flex-direction: column; }
.bas { display: flex; justify-content: space-between; align-items: baseline; }
.bas .marka { font-size: 17pt; color: var(--r-lacivert); }
.koyu .bas .marka { color: var(--r-beyaz); }
.alt { display: flex; justify-content: space-between; font-size: var(--o-kucuk); color: var(--r-gri); margin-top: auto; padding-top: 4mm; }
.koyu .alt { color: var(--r-griLacivertUstu); }
h2.kanca { font-size: var(--o-h2); margin-top: 8mm; max-width: 230mm; }
.alt-baslik { font-size: 15pt; margin-top: 3mm; max-width: 200mm; color: var(--r-gri); line-height: 1.35; }
.koyu .alt-baslik { color: var(--r-griLacivertUstu); }
.not { font-size: var(--o-kucuk); color: var(--r-gri); }
.koyu .not { color: var(--r-griLacivertUstu); }
.sayfa > * { flex-shrink: 0; }
.kayit { margin-top: auto; background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 6mm 8mm; font-size: 14pt; color: var(--r-murekkep); }
.orta { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; }

/* 1 Kapak */
.kapak .kanca { font-size: 52pt; line-height: 1.02; margin-top: 14mm; max-width: 230mm; }
.kapak .soru { font-size: 22pt; font-weight: var(--w-kalin); color: var(--r-yesil); margin-top: 7mm; }
.kapak .serit { margin-top: auto; width: 100%; }
.kapak .davet { display: flex; justify-content: space-between; align-items: end; margin-top: 14mm; padding-top: 6mm; border-top: 1px solid var(--r-cizgiLacivertUstu); }
.kapak .davet b { display: block; font-size: 19pt; font-weight: var(--w-baslik); }
.kapak .davet span { display: block; font-size: 13.5pt; color: var(--r-griLacivertUstu); margin-top: 1.5mm; }

/* 2 Neden siz */
.neden { display: grid; grid-template-columns: 1fr 1.15fr; gap: 16mm; flex: 1; align-items: center; }
.neden .sol .kanca { font-size: 34pt; }
.neden .sol p { font-size: 15pt; margin-top: 5mm; line-height: 1.4; max-width: 105mm; }
.sayilar { display: grid; gap: 0; }
.sayilar div { display: grid; grid-template-columns: 82mm 1fr; align-items: center; gap: 6mm; padding: 6mm 0; }
.sayilar div + div { border-top: 1px solid var(--r-cizgi); }
.sayilar b { font-size: 42pt; font-weight: var(--w-dev); color: var(--r-lacivert); letter-spacing: -0.03em; line-height: 1; white-space: nowrap; }
.sayilar div:first-child b { color: var(--r-yesilMetin); }
.sayilar span { font-size: 13.5pt; line-height: 1.3; }

/* 3 Ürün */
.isler { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9mm; margin-top: 10mm; }
.isler b { display: block; font-size: 17pt; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.15; }
.isler b::before { content: ''; display: block; width: 6mm; height: 6mm; border-radius: 50%; background: var(--r-yesil); margin-bottom: 4mm; }
.isler span { display: block; font-size: 13.5pt; margin-top: 2mm; line-height: 1.35; }
.entegre-satir { font-size: 13.5pt; margin-top: 4mm; color: var(--r-gri); }
.fiyat-serit { display: grid; grid-template-columns: repeat(3, 1fr) 1.3fr; margin-top: auto; background: var(--r-lacivert); color: var(--r-beyaz); border-radius: var(--o-kose); overflow: hidden; }
.fiyat-serit div { padding: 6mm 7mm; }
.fiyat-serit div + div { border-left: 1px solid var(--r-cizgiLacivertUstu); }
.fiyat-serit small { display: block; font-size: 12pt; color: var(--r-griLacivertUstu); min-height: 2.7em; line-height: 1.3; }
.fiyat-serit b { display: block; font-size: 30pt; font-weight: var(--w-dev); color: var(--r-yesil); letter-spacing: -0.02em; line-height: 1.1; margin-top: 1mm; }
.fiyat-serit p { font-size: 12.5pt; line-height: 1.35; }

/* 4 Süreç */
.akis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0; margin-top: 18mm; position: relative; list-style: none; counter-reset: a; }
.akis::before { content: ''; position: absolute; left: 8%; right: 8%; top: 13mm; height: 1.6mm; background: var(--r-sis); }
.akis li { counter-increment: a; position: relative; padding: 0 2.5mm; text-align: center; }
.akis li::before { content: counter(a); display: grid; place-items: center; width: 26mm; height: 26mm; margin: 0 auto 7mm; border-radius: 50%; background: var(--r-lacivert); color: var(--r-beyaz); font-size: 26pt; font-weight: var(--w-dev); position: relative; }
.akis li:last-child::before { background: var(--r-yesil); color: var(--r-lacivertDerin); }
.akis b { display: block; font-size: 15pt; min-height: 2.3em; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.15; }
.akis span { display: block; font-size: 13.5pt; margin-top: 3mm; line-height: 1.38; }
.akis em { display: block; font-style: normal; font-size: 12pt; font-weight: var(--w-kalin); color: var(--r-yesilMetin); margin-top: 3mm; letter-spacing: 0.04em; }

/* 5 Kazanç */
.kazanc { display: grid; grid-template-columns: 1.55fr 1fr; gap: 14mm; flex: 1; align-items: end; margin-top: 4mm; }
.yan { background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 7mm 8mm; align-self: stretch; display: flex; flex-direction: column; }
.yan h3 { font-size: 16pt; font-weight: var(--w-baslik); color: var(--r-lacivert); }
.yan table { width: 100%; border-collapse: collapse; margin-top: 4mm; font-size: 13pt; }
.yan td { padding: 2.2mm 0; }
.yan tr + tr td { border-top: 1px solid var(--r-cizgi); }
.yan table { border-collapse: collapse; }
.yan td:last-child { text-align: right; font-weight: var(--w-dev); color: var(--r-yesilMetin); font-size: 15pt; }
.yan p { font-size: 13pt; margin-top: 5mm; line-height: 1.38; }
.grafik-not { font-size: 12.5pt; color: var(--r-gri); margin-top: 2mm; line-height: 1.35; }
.esik-not { font-size: 13.5pt; font-weight: var(--w-kalin); color: var(--r-lacivert); margin-top: 3mm; }

/* 6 Örnek */
.uyari-ust { font-size: 13.5pt; font-weight: var(--w-kalin); color: var(--r-yesilMetin); margin-top: 2mm; }
.zincir { display: flex; align-items: center; margin-top: 9mm; }
.zincir .k { flex: none; }
.zincir .k small { display: block; font-size: 12pt; color: var(--r-gri); }
.zincir .k b { display: block; font-size: 25pt; font-weight: var(--w-dev); color: var(--r-lacivert); letter-spacing: -0.02em; white-space: nowrap; line-height: 1.1; }
.zincir .op { flex: 1; white-space: nowrap; text-align: center; font-size: 22pt; font-weight: var(--w-kalin); color: var(--r-yesilMetin); padding: 0 2mm; padding-top: 5mm; }
.zincir .sonuc { background: var(--r-yesil); color: var(--r-lacivertDerin); padding: 5mm 7mm; border-radius: var(--o-kose); }
.zincir .sonuc small { color: var(--r-lacivertDerin); }
.zincir .sonuc b { color: var(--r-lacivertDerin); font-size: 36pt; }
.ornek-alt { display: grid; grid-template-columns: 1.6fr 1fr; gap: 14mm; margin-top: auto; align-items: end; }
.toplam b { display: block; font-size: 44pt; font-weight: var(--w-dev); color: var(--r-lacivert); letter-spacing: -0.02em; line-height: 1; }
.toplam small { display: block; font-size: 13pt; color: var(--r-gri); margin-bottom: 2mm; }
.toplam p { font-size: 12pt; margin-top: 2.5mm; line-height: 1.35; }

/* 7 Roller */
.roller { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 9mm; flex: 1; }
.roller > div { padding: 0 6mm; display: grid; grid-template-rows: auto auto auto auto 1fr; }
.roller > div + div { border-left: 1px solid var(--r-cizgi); }
.roller > div.bir { background: var(--r-lacivert); color: var(--r-beyaz); border-radius: var(--o-kose); padding: 6mm; }
.roller > div.bir + div { border-left: 0; }
.roller h3 { font-size: 20pt; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.1; }
.roller .bir h3 { color: var(--r-yesil); }
.roller dl { margin-top: 4mm; }
.roller dt { font-size: 11pt; font-weight: var(--w-kalin); letter-spacing: 0.08em; text-transform: uppercase; color: var(--r-yesilMetin); margin-top: 4mm; }
.roller .bir dt { color: var(--r-yesil); }
.roller dd { font-size: 13pt; line-height: 1.3; margin-top: 1mm; }
.roller dd.oran { font-size: 17pt; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.15; }
.roller .bir dd.oran { color: var(--r-beyaz); }

/* 8 Koşullar */
.iki-sutun { display: grid; grid-template-columns: 1fr 1fr; margin-top: 9mm; border-radius: var(--o-kose); overflow: hidden; flex: 1; }
.iki-sutun > div { padding: 8mm 10mm; }
.iki-sutun .biz { background: var(--r-lacivert); color: var(--r-beyaz); }
.iki-sutun .siz { background: var(--r-sisAcik); }
.iki-sutun h3 { font-size: 22pt; font-weight: var(--w-baslik); color: var(--r-lacivert); }
.iki-sutun .biz h3 { color: var(--r-yesil); }
.iki-sutun ol { list-style: none; counter-reset: k; margin-top: 4mm; }
.iki-sutun li { counter-increment: k; display: grid; grid-template-columns: 10mm 1fr; font-size: 16pt; padding: 3.2mm 0; line-height: 1.3; }
.iki-sutun li::before { content: counter(k); font-weight: var(--w-dev); color: var(--r-yesilMetin); }
.iki-sutun .biz li::before { color: var(--r-yesil); }
.sinir { font-size: 12.5pt; margin-top: 4mm; color: var(--r-gri); }

/* 8 Üç yol */
.uc-yol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; margin-top: 9mm; flex: 1; }
.uc-yol > div { background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 7mm; display: flex; flex-direction: column; }
.uc-yol h3 { font-size: 18pt; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.15; margin-top: 3mm; min-height: 3.45em; }
.uc-yol b { font-size: 40pt; font-weight: var(--w-dev); color: var(--r-yesilMetin); letter-spacing: -0.02em; line-height: 1; padding-top: 5mm; }
.uc-yol p { font-size: 13pt; line-height: 1.35; margin-top: 2.5mm; }
.uc-yol em { font-style: normal; font-size: 11pt; font-weight: var(--w-kalin); letter-spacing: 0.08em; text-transform: uppercase; color: var(--r-yesilMetin); margin-top: auto; padding-top: 6mm; }
.uc-yol p.ilk { font-weight: var(--w-kalin); color: var(--r-lacivert); margin-top: 1mm; }

/* 9 Koşullar ve ilk adım */
.kosul-son { display: grid; grid-template-columns: 2fr 1fr; gap: 6mm; margin-top: 7mm; flex: 1; }
.kosul-son .iki-sutun { margin-top: 0; }
.kosul-son .iki-sutun li { font-size: 14pt; padding: 2.4mm 0; }
.kosul-son .iki-sutun > div { padding: 7mm 8mm; }
.kosul-son .iki-sutun h3 { font-size: 19pt; }
.ilk-panel { border-radius: var(--o-kose); padding: 7mm 8mm; background: var(--r-lacivertDerin); }
.ilk-panel .marka { font-size: 30pt; color: var(--r-beyaz); }
.ilk-panel p.web { font-size: 19pt; font-weight: var(--w-kalin); color: var(--r-yesil); margin-top: 2mm; }
.ilk-panel ol { list-style: none; counter-reset: s; margin-top: 6mm; }
.ilk-panel li { counter-increment: s; display: grid; grid-template-columns: 9mm 1fr; font-size: 13.5pt; font-weight: var(--w-kalin); padding: 2.6mm 0; border-bottom: 1px solid var(--r-cizgiLacivertUstu); line-height: 1.3; }
.ilk-panel li::before { content: counter(s); font-weight: var(--w-dev); color: var(--r-yesil); }

/* Eski son sayfa */
.son-izgara { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16mm; flex: 1; align-items: center; }
.son .kanca { font-size: 44pt; }
.son ol { list-style: none; counter-reset: s; }
.son li { counter-increment: s; display: grid; grid-template-columns: 14mm 1fr; align-items: baseline; font-size: 17pt; font-weight: var(--w-kalin); padding: 4mm 0; border-bottom: 1px solid var(--r-cizgiLacivertUstu); }
.son li::before { content: counter(s); font-size: 24pt; font-weight: var(--w-dev); color: var(--r-yesil); }
.son .adres .marka { font-size: 46pt; }
.son .adres p.web { font-size: 24pt; font-weight: var(--w-kalin); color: var(--r-yesil); margin-top: 3mm; }
`;

const bas = (no, ad) => `<div class="bas">${marka()}<span class="ust">${String(no).padStart(2, '0')}  ${ad}</span></div>`;
const alt = (no, sol = 'Segika iş ortaklığı programı') => `<div class="alt"><span>${sol}</span><span class="rakam">${no} / ${TOPLAM}</span></div>`;

const sayfalar = [
  () => `<section class="sayfa kapak koyu">
    <div class="bas">${marka()}<span class="ust">İş ortaklığı programı</span></div>
    <h1 class="kanca">Müşteriniz size her ay aynı soruyu soruyor mu?</h1>
    <p class="soru">“Bu yeni çalışan için teşvik alabilir miyiz?”</p>
    <div class="serit">${aySeridi({ genislik: 880, boyut: 15 })}</div>
    <div class="davet"><div><b>${M.kapak.davet}</b><span>${M.kapak.kitle}</span></div><span class="not">${TARIH}</span></div>
  </section>`,
  () => `<section class="sayfa">${bas(2, 'Neden siz')}
    <div class="neden">
      <div class="sol"><h2 class="kanca">Müşterinizi siz tanıyorsunuz.</h2><p>${M.neden.siz.slice(1).join(' ')}</p><p>${M.kapak.tesvik}</p></div>
      <div class="sayilar">${OLCEK.map((o) => `<div><b>${o.sayi}</b><span>${o.metin}</span></div>`).join('')}<p class="kaynak">${M.neden.kaynak}</p></div>
    </div>${alt(2)}</section>`,
  () => `<section class="sayfa">${bas(3, 'Müşteriniz ne kazanır')}
    <h2 class="kanca">${M.urun.kanca2}</h2>
    <p class="alt-baslik">${M.urun.tanim} ${M.urun.paketAyrimi}</p>
    <div class="isler">${M.urun.isler.map((x) => `<div><b>${x.b}</b><span>${x.m}</span></div>`).join('')}</div>
    <div class="fiyat-serit">${PAKETLER.map((p) => `<div><small>${p.ad}</small><b class="rakam">${tl(p.fiyat)}</b></div>`).join('')}<div><p>Fiyatlar 25 çalışan için aylıktır. Bu belgede KDV hariç sayılır. Fiyat herkes için aynıdır.</p></div></div>
    <p class="entegre-satir">${M.urun.entegrasyon} ${M.urun.entegrasyonPaket}</p>
    ${alt(3, 'Kaynak: segika.com fiyat sayfası')}</section>`,
  () => `<section class="sayfa">${bas(4, 'Nasıl işler')}
    <h2 class="kanca">${M.surec.kanca}</h2>
    <ol class="akis">${M.surec.adimlar.map((a) => `<li><b>${a.b}</b><span>${a.m}</span><em>${a.kim}</em></li>`).join('')}</ol>
    <p class="kayit">${M.surec.kayit.join(' ')}</p>
    ${alt(4)}</section>`,
  () => `<section class="sayfa">${bas(5, 'Ne kazanırsınız')}
    <h2 class="kanca">%15'ten %30'a. Oranı aylık cironuz belirler.</h2>
    <div class="kazanc">
      <div>${basamakGrafik({ seriler: [{ ad: 'Kapatır', renk: R.lacivert, renkler: [R.lacivert, R.yesil, R.lacivert, R.lacivert], basamaklar: basamaklar('kapatir') }], genislik: 620, yukseklik: 360, boyut: 18 })}
        <p class="grafik-not">Grafik satışı kapatanın oranını gösterir. Tutarlar aylık cirodur. Oran cironun tamamına uygulanır. Yeşil çubuk, örnek hesaptaki durumdur.</p>
        <p class="esik-not">${M.kazanc.esik}</p></div>
      <div class="yan"><h3>Yalnız tanıştırırsanız</h3>
        <table>${basamaklar('tanistir').map((b, i) => `<tr><td>${i === 0 ? '30.000 TL altı' : `${tl(b.esik)} ve üstü`}</td><td>${i === 0 ? 'Pay yok' : yuzde(b.oran)}</td></tr>`).join('')}</table>
        <p>${M.kazanc.ciro}</p><p>${M.kazanc.k1}</p></div>
    </div>${alt(5)}</section>`,
  () => `<section class="sayfa">${bas(6, 'Örnek hesap')}
    <h2 class="kanca">${M.ornek.kanca}</h2>
    <p class="uyari-ust">${M.ornek.uyari}</p>
    <p class="alt-baslik">${M.ornek.durum}</p>
    <div class="zincir">
      <div class="k"><small>Aylık bedel</small><b class="rakam">${tl(ORNEK.paket)}</b></div><div class="op">× 12</div>
      <div class="k"><small>Yıllık bedel</small><b class="rakam">${tl(ORNEK.yillik)}</b></div><div class="op">× 2</div>
      <div class="k"><small>Aylık ciro</small><b class="rakam">${tl(ORNEK.ciro)}</b></div><div class="op">× %20</div>
      <div class="k sonuc"><small>Bu ayki kazanç</small><b class="rakam">${tl(ORNEK.kazanc)}</b></div>
    </div>
    <div class="ornek-alt">
      <div>${yilGrafik({ yillar: ORNEK.yillar, genislik: 600, yukseklik: 230, boyut: 16, renkler: [R.yesil, R.lacivert, R.lacivert, R.lacivert] })}</div>
      <div class="toplam"><small>Paket yenilenir ve destek sürerse 4 yılda</small><b class="rakam">${tl(ORNEK.toplam)}</b><p>${M.ornek.saglama} ${M.kazanc.hakDegil}</p><p>Destek vermediğiniz ay için pay oluşmaz. ${M.ornek.esikNot}</p></div>
    </div>${alt(6)}</section>`,
  () => `<section class="sayfa">${bas(7, 'Dört ortaklık yolu')}
    <h2 class="kanca">${M.roller.kanca}</h2>
    <div class="roller">${M.roller.liste.map((r) => `<div class="${r.id === 'cozum' ? 'bir koyu' : ''}"><h3>${r.ad}</h3><dl>
      <dt>Kim</dt><dd>${r.kim}</dd><dt>Ne yapar</dt><dd>${r.ne}</dd><dt>Nasıl kazanır</dt><dd class="oran">${r.kazanc}</dd><dt>Nasıl başlar</dt><dd>${r.ilk}</dd></dl></div>`).join('')}</div>
    ${alt(7)}</section>`,
  () => `<section class="sayfa">${bas(8, 'Öteki üç yol')}
    <h2 class="kanca">${M.ucYol.kanca}</h2>
    <div class="uc-yol">${M.ucYol.liste.map((r) => `<div><small class="ust">${r.ad}</small><h3>${r.kanca}</h3><b class="rakam">${r.sayi}</b><p>${r.sayiAlt}</p><em>İlk adım</em><p class="ilk">${r.ilk}</p></div>`).join('')}</div>
    <p class="esik-not" style="margin-top:5mm">${M.ucYol.not}</p>
    ${alt(8)}</section>`,
  () => `<section class="sayfa">${bas(9, 'Koşullar ve ilk adım')}
    <h2 class="kanca">${M.kosullar.kanca}</h2>
    <div class="kosul-son">
      <div class="iki-sutun">
        <div class="biz koyu"><h3>Segika ne yapar</h3><ol>${M.kosullar.biz.map((x) => `<li>${x}</li>`).join('')}</ol></div>
        <div class="siz"><h3>Siz ne yaparsınız</h3><ol>${M.kosullar.siz.map((x) => `<li>${x}</li>`).join('')}</ol></div>
      </div>
      <div class="ilk-panel koyu">${marka()}<p class="web">segika.com</p><ol>${M.ilk.adimlar.map((x) => `<li>${x}</li>`).join('')}</ol></div>
    </div>
    <p class="sinir">Fiyatı değiştirmeyin. Teşvik tutarı için söz vermeyin. ${M.kosullar.odeme} ${M.ilk.not}</p>
    ${alt(9, TARIH)}</section>`,
];

export function gorselHtml() {
  return htmlDuzelt(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Segika iş ortaklığı görsel sunum</title>
<style>${tokenCss('gorsel')}${css}</style></head><body>${sayfalar.map((f) => f()).join('\n')}</body></html>`);
}
