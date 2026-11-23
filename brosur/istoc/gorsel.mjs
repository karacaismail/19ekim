// Görsel PDF sunumu: A4 yatay, 8 sayfa. Az metin, büyük sayılar ve şemalar.
import { plan, fiyat, hesap, kademeler, tl, yuzde, avro } from './veri.mjs';
import { sayfaIskeleti, marka, merdiven, donemCubuklari } from './sablon.mjs';
import { SORULAR, ADIMLAR, PERSONALAR, BIZ, SIZ, ILK_ADIMLAR } from './kitapcik.mjs';

const TOPLAM = 8;
const K = hesap.kapat, T = hesap.tanis;
const css = `
.sayfa { width: 297mm; height: 210mm; padding: 14mm 16mm 12mm; position: relative; overflow: hidden; break-after: page; page-break-after: always; display: flex; flex-direction: column; background: var(--kagit); }
.sayfa:last-child { break-after: auto; page-break-after: auto; }
.koyu { background: var(--murekkep); color: var(--kagit); }
.ust, .alt { display: flex; justify-content: space-between; align-items: baseline; font-size: 10pt; color: var(--soluk); }
.koyu .ust, .koyu .alt { color: var(--solukKoyu); }
.alt { margin-top: auto; padding-top: 4mm; }
.marka { font-weight: 700; letter-spacing: -0.02em; }
.marka-i { color: var(--turuncuMetin); }
.koyu .marka-i { color: var(--turuncu); }
.ust .marka { font-size: 13pt; color: var(--murekkep); }
.koyu .ust .marka { color: var(--kagit); }
h1 { font-size: 34pt; line-height: 1.06; font-weight: 750; letter-spacing: -0.025em; margin-top: 8mm; max-width: 265mm; }
p, li { font-size: 12pt; line-height: 1.38; }
.not { font-size: 10pt; line-height: 1.35; color: var(--soluk); }
.koyu .not { color: var(--solukKoyu); }
.dev { font-weight: 800; letter-spacing: -0.05em; line-height: 0.82; }

/* Kapak */
.kapak-izgara { flex: 1; display: grid; grid-template-columns: 1.05fr 1fr; gap: 12mm; align-items: center; }
.kapak-48 { font-size: 300pt; color: var(--turuncu); }
.kapak-48 span { font-size: 54pt; letter-spacing: -0.02em; margin-left: 4mm; }
.kapak-sag h2 { font-size: 30pt; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; }
.kapak-sag p { margin-top: 6mm; font-size: 15pt; line-height: 1.35; color: var(--kagit); }
.kapak-sag .not { font-size: 11pt; margin-top: 4mm; }
.ay-serit { display: grid; grid-template-columns: repeat(48, 1fr); gap: 1.2mm; margin-top: 4mm; }
.ay-serit i { height: 9mm; background: var(--turuncu); }
.ay-etiket { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 2mm; font-size: 10pt; color: var(--solukKoyu); }
.ay-etiket b { color: var(--turuncu); font-weight: 700; }

/* Sorular */
.dort { margin-top: 10mm; display: grid; grid-template-columns: repeat(4, 1fr); gap: 7mm; }
.dort .kim { font-size: 10.5pt; font-weight: 600; color: var(--soluk); min-height: 9mm; }
.dort q { display: block; quotes: '“' '”'; font-size: 18pt; line-height: 1.16; font-weight: 650; letter-spacing: -0.01em; margin-top: 2mm; min-height: 34mm; }
.dort .yanit { margin-top: 4mm; padding-top: 3mm; border-top: 1.2mm solid var(--turuncu); }
.serit { margin: auto -16mm -12mm; padding: 7mm 16mm 8mm; background: var(--murekkep); color: var(--kagit); display: grid; grid-template-columns: repeat(4, 1fr); gap: 7mm; }
.serit b { display: block; font-size: 30pt; font-weight: 800; letter-spacing: -0.03em; color: var(--turuncu); line-height: 1; }
.serit span { display: block; font-size: 12pt; margin-top: 2mm; }

/* Süreç */
.yatay-akis { margin: auto 0; display: grid; grid-template-columns: repeat(6, 1fr); gap: 5mm; position: relative; }
.yatay-akis::before { content: ''; position: absolute; left: 9mm; right: 30mm; top: 11mm; height: 0.8mm; background: var(--kumKoyu); }
.yatay-akis .no { position: relative; width: 22mm; height: 22mm; border-radius: 50%; background: var(--turuncu); color: var(--murekkep); font-weight: 800; font-size: 24pt; display: flex; align-items: center; justify-content: center; }
.yatay-akis h2 { font-size: 17pt; line-height: 1.18; margin-top: 6mm; font-weight: 700; }
.yatay-akis p { font-size: 12.5pt; margin-top: 2mm; color: var(--soluk); line-height: 1.35; }
.catal { margin-top: 3mm; display: grid; gap: 2mm; }
.catal div { padding: 2.5mm 3mm; background: var(--kum); font-size: 12pt; line-height: 1.3; }
.catal div:first-child { background: var(--kumKoyu); }
.catal b { display: block; font-size: 11pt; color: var(--turuncuMetin); }

/* Oran ve örnek */
.grafik-izgara { flex: 1; display: grid; grid-template-columns: 1.7fr 1fr; gap: 12mm; align-items: center; margin: 2mm 0 4mm; }
.lejant { display: flex; gap: 8mm; font-size: 12pt; color: var(--soluk); margin-bottom: 2mm; }
.lejant i { display: inline-block; width: 9mm; height: 2mm; vertical-align: middle; margin-right: 2mm; background: var(--murekkep); }
.lejant i.t { background: var(--turuncu); height: 3mm; }
.buyuk-sayi { display: grid; gap: 8mm; }
.buyuk-sayi div b { display: block; font-size: 64pt; }
.buyuk-sayi div span { display: block; font-size: 13pt; margin-top: 2mm; line-height: 1.3; }
.buyuk-sayi .t b { color: var(--turuncuMetin); }

/* Persona */
.persona4 { margin-top: 9mm; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; flex: 1; }
.persona4 > div { padding: 7mm 6mm; display: flex; flex-direction: column; gap: 4.5mm; }
.persona4 > div.ana { background: var(--turuncu); }
.persona4 > div:nth-child(2) { background: var(--kum); }
.persona4 > div:nth-child(4) { background: var(--kum); }
.persona4 .buyuk { font-size: 32pt; font-weight: 800; letter-spacing: -0.03em; line-height: 1; min-height: 2em; display: flex; align-items: flex-end; }
.persona4 h2 { font-size: 19pt; }
.persona4 p { font-size: 13pt; line-height: 1.32; }
.persona4 p b { display: block; font-size: 11pt; font-weight: 700; color: var(--soluk); margin-bottom: 0.5mm; }
.persona4 .ana p b { color: var(--murekkep); }

/* Biz siz */
.biz-siz { margin-top: 8mm; display: grid; grid-template-columns: 1fr 1fr; flex: 1; }
.biz-siz > div { padding: 8mm 9mm; display: flex; flex-direction: column; justify-content: center; }
.biz-siz > div:first-child { background: var(--murekkep); color: var(--kagit); }
.biz-siz > div:last-child { background: var(--kumKoyu); }
.biz-siz h2 { font-size: 22pt; margin-bottom: 6mm; }
.biz-siz > div:first-child h2 { color: var(--turuncu); }
.biz-siz ul { list-style: none; display: grid; gap: 4.5mm; }
.biz-siz li { padding-left: 7mm; position: relative; font-size: 15pt; line-height: 1.3; }
.biz-siz li::before { content: ''; position: absolute; left: 0; top: 2.4mm; width: 2.8mm; height: 2.8mm; background: var(--turuncu); }
.biz-siz > div:last-child li::before { background: var(--murekkep); }
.alt-not { margin-top: 4mm; display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }

/* Son */
.son-izgara { flex: 1; display: grid; grid-template-columns: 1.1fr 1fr; gap: 14mm; align-items: center; }
.son-izgara h1 { font-size: 40pt; margin-top: 0; }
.son-izgara ol { list-style: none; counter-reset: s; display: grid; gap: 4mm; margin-top: 8mm; }
.son-izgara li { counter-increment: s; display: grid; grid-template-columns: 12mm 1fr; font-size: 16pt; align-items: baseline; }
.son-izgara li::before { content: counter(s); font-weight: 800; font-size: 20pt; color: var(--turuncu); }
.adres b { display: block; font-size: 60pt; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
.adres .marka { font-size: 22pt; }
`;

const ust = (ad) => `<header class="ust">${marka()}<span>${ad}</span></header>`;
const alt = (n, sol = 'iStoc iş ortaklığı programı') => `<footer class="alt"><span>${sol}</span><span>${n} / ${TOPLAM}</span></footer>`;

function kapak() {
  const op = [1, ...K.yillar.map((y) => 0.25 + (y.oran / K.oran) * 0.75)];
  const kareler = op.flatMap((o) => Array(12).fill(`<i style="opacity:${o.toFixed(2)}"></i>`)).join('');
  return `<section class="sayfa koyu">
  <header class="ust">${marka()}<span>İş ortaklığı programı</span></header>
  <div class="kapak-izgara">
    <div class="kapak-48 dev">48<span>ay</span></div>
    <div class="kapak-sag">
      <h2>Satışını kapattığınız müşteri size 48 ay pay getirir.</h2>
      <p>iStoc iş ortaklığı programına sizi davet ediyoruz.</p>
      <p class="not">Bu belge satıcı firmalara hizmet veren danışmanlar ve hizmet firmaları için hazırlandı.</p>
    </div>
  </div>
  <div class="ay-serit" aria-label="48 ay">${kareler}</div>
  <div class="ay-etiket"><span>1. yıl <b>${yuzde(K.oran)}</b></span>${K.yillar.map((y) => `<span>${y.yil}. yıl <b>${yuzde(y.oran)}</b></span>`).join('')}</div>
  <footer class="alt"><span>Pay, müşteri ödemeye devam ettikçe sürer. Oranlar ${tl(plan.ornekCiro)} aylık cirolu örnektendir.</span><span>istoc.com</span></footer>
</section>`;
}

function sorular() {
  return `<section class="sayfa">
  ${ust('Neden siz')}
  <h1>Müşteriniz size her ay aynı soruyu soruyor mu?</h1>
  <div class="dort">
    ${SORULAR.map(([kim, soru, yanit]) => `<div><div class="kim">${kim}</div><q>${soru}</q><p class="yanit">${yanit}</p></div>`).join('')}
  </div>
  <div class="serit">
    <div><b>${fiyat.denemeGun} gün</b><span>Satıcı paketi ücretsiz dener.</span></div>
    <div><b>${avro(fiyat.basicAyEur)}</b><span>Basic paket ayda bu kadar tutar.</span></div>
    <div><b>${avro(fiyat.kurulumEur)}</b><span>Mağaza kurulumu bir kez bu kadar tutar.</span></div>
    <div><b>%0</b><span>iStoc satıcının satışından komisyon almaz.</span></div>
  </div>
</section>`;
}

function surec() {
  return `<section class="sayfa">
  ${ust('Nasıl işler')}
  <h1>Altı adım var. İlk adım tek bir görüşmedir.</h1>
  <div class="yatay-akis">
    ${ADIMLAR.map(([b, m], i) => `<div><div class="no">${i + 1}</div><h2>${b}</h2>${m ? `<p>${m.split('. ')[0].replace(/\.$/, '')}.</p>` : `<div class="catal"><div><b>Satışı siz kapattıysanız</b>Kurulumu ve ilk eğitimi siz yaparsınız.</div><div><b>Yalnız tanıştırdıysanız</b>Kurulumu şirket yapar.</div></div>`}</div>`).join('')}
  </div>
  <p class="not" style="font-size:12pt">Kurulum, işletmenin hesabını açmak ve ürünlerini yüklemektir. Kurulumdan sonraki desteği her durumda şirket verir.</p>
  ${alt(3)}
</section>`;
}

function oranlar() {
  return `<section class="sayfa">
  ${ust('Kazanç planı')}
  <h1>Satışı kapatırsanız payınız %30’a kadar çıkar.</h1>
  <div class="grafik-izgara">
    <div>
      <div class="lejant"><span><i class="t"></i>Satışı kapatırsanız</span><span><i></i>Yalnız tanıştırırsanız</span></div>
      ${merdiven({ g: 600, y: 340, kapat: kademeler('kapatir'), tanis: kademeler('tanistir'), ornekCiro: plan.ornekCiro, yaziBoyu: 16 })}
    </div>
    <div class="buyuk-sayi">
      <div class="t"><b class="dev">${yuzde(K.oran)}</b><span>${tl(plan.ornekCiro)} aylık ciroda satışı kapatırsanız</span></div>
      <div><b class="dev">${yuzde(T.oran)}</b><span>Aynı ciroda yalnız tanıştırırsanız</span></div>
    </div>
  </div>
  <p class="not">Ciro, getirdiğiniz müşterilerin ödediği tutardır. Ulaştığınız kotanın oranı cironun tamamına uygulanır. Bu oranlar bugünkü plandır. Kesin oranlar yazılı anlaşmada belirlenir.</p>
  ${alt(4)}
</section>`;
}

function ornek() {
  return `<section class="sayfa">
  ${ust('Örnek hesap')}
  <h1>Ayda ${tl(plan.ornekCiro)} ciro, 4 yılda ${tl(K.toplam)} pay.</h1>
  <div class="grafik-izgara">
    <div>
      <div class="lejant"><span><i class="t"></i>Satışı kapatırsanız</span><span><i></i>Yalnız tanıştırırsanız</span></div>
      ${donemCubuklari({ g: 600, y: 360, kapat: K, tanis: T, yaziBoyu: 16 })}
    </div>
    <div class="buyuk-sayi">
      <div class="t"><b class="dev">${tl(K.toplam)}</b><span>Satışı kapatırsanız bu tutarı 48 ayda alırsınız.</span></div>
      <div><b class="dev">${tl(T.toplam)}</b><span>Yalnız tanıştırırsanız bu tutarı 36 ayda alırsınız.</span></div>
    </div>
  </div>
  <p class="not">Bu bir örnektir. Getirdiğiniz müşteriler her ay toplam ${tl(plan.ornekCiro)} öder. Kota koşulu her ay sağlanır. Çubuklardaki tutarlar bin ₺ cinsindendir. Vergi ve stopaj dahil değildir.</p>
  ${alt(5)}
</section>`;
}

function persona() {
  return `<section class="sayfa">
  ${ust('Dört persona')}
  <h1>Hangisi sizsiniz?</h1>
  <div class="persona4">
    ${PERSONALAR.map((p) => `<div class="${p.ana ? 'ana' : ''}"><span class="buyuk">${p.buyuk}</span><h2>${p.ad}</h2>
      <p><b>Kim?</b>${p.kim}</p><p><b>Ne yapar?</b>${p.ne}</p><p><b>Nasıl kazanır?</b>${p.kazanc}</p><p><b>Nasıl başlar?</b>${p.basla}</p></div>`).join('')}
  </div>
  ${alt(6, 'SGK, sosyal güvenlik kaydıdır.')}
</section>`;
}

function bizSiz() {
  return `<section class="sayfa">
  ${ust('Koşullar')}
  <h1>Kim ne yapar? Baştan yazılıdır.</h1>
  <div class="biz-siz">
    <div><h2>Biz ne yaparız</h2><ul>${BIZ.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    <div><h2>Siz ne yaparsınız</h2><ul>${SIZ.map((x) => `<li>${x}</li>`).join('')}</ul></div>
  </div>
  <div class="alt-not">
    <p class="not">İlk 12 ayın her birinde aylık ciro en az K1 kotası kadar olmalıdır. Ciro tek bir ay K1 kotasının altında kalırsa 13. aydan sonra pay alınmaz.</p>
    <p class="not">Bu belge sözleşme değildir. Kesin oranlar yazılı anlaşmada belirlenir. Ayrıntılar el kitapçığındadır.</p>
  </div>
  ${alt(7)}
</section>`;
}

function son() {
  return `<section class="sayfa koyu">
  <header class="ust">${marka()}<span>İlk adım</span></header>
  <div class="son-izgara">
    <div>
      <h1>Hangi müşterinizle başlarsınız?</h1>
      <ol>${ILK_ADIMLAR.map((x) => `<li>${x}</li>`).join('')}</ol>
    </div>
    <div class="adres">${marka()}<b>istoc.com</b></div>
  </div>
  <footer class="alt"><span>Bu belge 23 Kasım 2026 Pazartesi günkü plana göre hazırlandı.</span><span>${TOPLAM} / ${TOPLAM}</span></footer>
</section>`;
}

export function gorselHtml() {
  return sayfaIskeleti({ baslik: 'iStoc iş ortaklığı görsel sunum', boyut: 'A4 landscape', css, govde: [kapak(), sorular(), surec(), oranlar(), ornek(), persona(), bizSiz(), son()].join('\n') });
}
export const GORSEL_SAYFA = TOPLAM;
