// Görsel PDF sunumu: A4 yatay, 9 sayfa. Az metin, büyük sayılar ve şemalar.
// Kullanıcı kararı 25 Kasım 2026 Çarşamba: tutarlar euro olur. Örnek, büyüyen müşteri senaryosudur. Kadrolu uzman bilgisi yoktur.
import { plan, fiyat, hesap, kademeler, anlar, kur12, sayi, tl, yuzde, avro, avroTam, liraHap, kurDipnotu } from './veri.mjs';
import { sayfaIskeleti, logo, imza, altImza, merdiven, sonrakiOranlarTablosu, seviyeYolu, kilometreTaslari, kurKutusuHtml } from './sablon.mjs';
import { SORULAR, ADIMLAR, PERSONALAR, BIZ, SIZ, ILK_ADIMLAR, euroHucre } from './kitapcik.mjs';

const TOPLAM = 9;
const K = hesap.kapat, T = hesap.tanis;
const KA = anlar(K), TA = anlar(T);
const kap = kademeler('kapatir');
const ay12 = KA.find((a) => a.n === 12), ay48 = KA.at(-1);
/** 1. yıl K3 oranı, sonraki yıllar 13. aydan sonraki oranlardır. */
const KAPAK_ORANLARI = [kap.at(-1).oran, ...plan.kapatir.gecmis.slice(0, 3)];
const donemAdi = (i) => `${12 * (i + 1) + 1}. ile ${12 * (i + 2)}. ay`;
const css = `
.sayfa { width: 297mm; height: 210mm; padding: 14mm 16mm 12mm; position: relative; overflow: hidden; break-after: page; page-break-after: always; display: flex; flex-direction: column; background: var(--kagit); }
.sayfa:last-child { break-after: auto; page-break-after: auto; }
.koyu { background: var(--murekkep); color: var(--kagit); }
.ust, .alt { display: flex; justify-content: space-between; align-items: baseline; font-size: 10pt; color: var(--soluk); }
.koyu .ust, .koyu .alt { color: var(--solukKoyu); }
.alt { margin-top: auto; padding-top: 4mm; }
.alt-imza { font-weight: 600; letter-spacing: 0.02em; }
.logo { display: block; }
.ust { align-items: center; }
.imza { display: block; margin-top: 1.5mm; font-size: 10pt; font-weight: 600; letter-spacing: 0.02em; color: var(--solukKoyu); }
.kapak-imza { display: flex; flex-direction: column; align-items: flex-start; }
.kapak-imza .ceviri { margin-top: 1mm; }
.belge-adi { font-size: 16pt; font-weight: 700; color: var(--sari); letter-spacing: -0.01em; margin-bottom: 5mm; }
h1 { font-size: 34pt; line-height: 1.06; font-weight: 700; letter-spacing: -0.025em; margin-top: 8mm; max-width: 265mm; }
p, li { font-size: 12pt; line-height: 1.38; }
.not { font-size: 12pt; line-height: 1.35; color: var(--soluk); }
.kosul { font-size: 13pt; line-height: 1.35; font-weight: 600; color: var(--murekkep); }
.dipnot { font-size: 10pt; line-height: 1.35; color: var(--soluk); }
.koyu .dipnot { color: var(--solukKoyu); }
.koyu .not { color: var(--solukKoyu); }
.dev { font-weight: 800; letter-spacing: -0.02em; line-height: 0.82; }

/* Kapak */
.kapak-izgara { flex: 1; display: grid; grid-template-columns: 1.05fr 1fr; gap: 12mm; align-items: center; }
.koyu .ust { align-items: flex-start; }
.kapak-48 { font-size: 220pt; color: var(--sari); }
.kapak-48 span { display: block; white-space: nowrap; font-size: 40pt; letter-spacing: -0.01em; margin: 4mm 0 0 2mm; }
.kapak-sag h2 { font-size: 30pt; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; }
.kapak-sag p { margin-top: 6mm; font-size: 15pt; line-height: 1.35; color: var(--kagit); }
.kapak-sag .not { font-size: 12pt; margin-top: 4mm; }
.kapak-sag .belge-adi { margin-top: 0; font-size: 16pt; color: var(--sari); }
.ay-serit { display: grid; grid-template-columns: repeat(48, 1fr); gap: 1.2mm; margin-top: 4mm; }
.ay-serit i { height: 9mm; background: var(--sari); }
.ay-etiket { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 2mm; font-size: 12pt; color: var(--solukKoyu); }
.ay-etiket b { color: var(--sari); font-weight: 700; }

/* Sorular */
.dort { margin: auto 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 7mm; }
.dort .kim { font-size: 12pt; font-weight: 600; color: var(--soluk); min-height: 9mm; }
.dort q { display: block; quotes: '“' '”'; font-size: 20pt; line-height: 1.16; font-weight: 600; letter-spacing: -0.01em; margin-top: 2mm; min-height: 36mm; }
.dort .yanit { font-size: 13pt; }
.dort .yanit { margin-top: 4mm; padding-top: 3mm; border-top: 1.2mm solid var(--sari); }
.serit { margin: 0 -16mm -12mm; padding: 7mm 16mm 4mm; background: var(--murekkep); color: var(--kagit); display: grid; grid-template-columns: repeat(3, 1fr); gap: 7mm; }
.serit b { display: block; font-size: 30pt; font-weight: 800; letter-spacing: -0.03em; color: var(--sari); line-height: 1; }
.serit span { display: block; font-size: 12pt; margin-top: 2mm; }
.serit .alt { grid-column: 1 / -1; color: var(--solukKoyu); padding-top: 3mm; }

/* Süreç */
.yatay-akis { margin: auto 0; display: grid; grid-template-columns: repeat(6, 1fr); gap: 5mm; position: relative; }
.yatay-akis::before { content: ''; position: absolute; left: 9mm; right: 30mm; top: 11mm; height: 0.8mm; background: var(--kumKoyu); }
.yatay-akis .no { position: relative; width: 22mm; height: 22mm; border-radius: 50%; background: var(--sari); color: var(--murekkep); font-weight: 800; font-size: 24pt; display: flex; align-items: center; justify-content: center; }
.yatay-akis h2 { font-size: 17pt; line-height: 1.18; margin-top: 6mm; font-weight: 700; }
.yatay-akis p { font-size: 12.5pt; margin-top: 2mm; color: var(--soluk); line-height: 1.35; }
.catal { margin-top: 3mm; display: grid; gap: 2mm; }
.catal div { padding: 2.5mm 3mm; background: var(--kum); font-size: 12pt; line-height: 1.3; }
.catal div:first-child { background: var(--kumKoyu); }
.catal b { display: block; font-size: 11pt; color: var(--murekkep); }

/* Oran ve örnek */
.grafik-izgara { flex: 1; display: grid; grid-template-columns: 1.7fr 1fr; gap: 12mm; align-items: center; margin: 2mm 0 4mm; }
.lejant { display: flex; gap: 8mm; font-size: 12pt; color: var(--soluk); margin-bottom: 2mm; }
.lejant i { display: inline-block; width: 9mm; height: 2mm; vertical-align: middle; margin-right: 2mm; background: var(--murekkep); }
.lejant i.t { background: var(--sari); height: 3mm; box-shadow: inset 0 0 0 0.3mm var(--murekkep); }
.buyuk-sayi { display: grid; gap: 8mm; }
.buyuk-sayi div b { display: block; font-size: 64pt; }
.buyuk-sayi div span { display: block; font-size: 13pt; margin-top: 2mm; line-height: 1.3; }
.buyuk-sayi .t b { color: var(--lacivert); }

/* Persona */
.persona4 { margin-top: 9mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; flex: 1; }
.persona4 > div { padding: 6mm 6mm; display: flex; flex-direction: column; gap: 3mm; }
.persona4 > div.ana { background: var(--sari); }
.persona4 > div:nth-child(2) { background: var(--kum); }
.persona4 .buyuk { font-size: 28pt; font-weight: 800; letter-spacing: -0.03em; line-height: 1; min-height: 2em; display: flex; align-items: flex-end; }
.persona4 h2 { font-size: 19pt; }
.persona4 p { font-size: 12pt; line-height: 1.3; }
.persona4 p b { display: block; font-size: 11pt; font-weight: 700; color: var(--soluk); margin-bottom: 0.5mm; }
.persona4 .ana p b { color: var(--murekkep); }

/* 13. aydan sonraki oranlar */
.sag-blok h2 { font-size: 18pt; margin-bottom: 2mm; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-weight: 700; padding: 2mm 3mm; font-size: 12pt; border-bottom: 0.6mm solid var(--murekkep); }
td { padding: 2mm 3mm; border-top: 0.3mm solid var(--cizgi); font-size: 12pt; white-space: nowrap; }
td.vurgu, th.vurgu { background: var(--kum); }
td.vurgu b { color: var(--lacivert); }
tr.ana td { background: var(--kum); font-weight: 700; }

/* Senaryo */
.senaryo-ust { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; align-items: end; margin-top: 4mm; }
.seviye-yolu { list-style: none; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; }
.seviye-yolu li { background: var(--kum); padding: 2.5mm 3mm; display: grid; gap: 0.5mm; }
.seviye-yolu li.zirve { background: var(--sari); }
.seviye-yolu .ad { font-size: 18pt; font-weight: 800; color: var(--lacivert); }
.seviye-yolu .zirve .ad { color: var(--murekkep); }
.seviye-yolu .oran { font-size: 13pt; font-weight: 700; }
.seviye-yolu .ay { font-size: 12pt; color: var(--murekkep); }
.kilometre { list-style: none; margin-top: 6mm; display: grid; grid-template-columns: repeat(6, 1fr); gap: 2.5mm; }
.kilometre li { display: grid; gap: 0.5mm; padding: 3mm 3.5mm 4mm; border-top: 1.2mm solid var(--murekkep); background: var(--kum); }
.kilometre li:nth-child(n+4) { background: var(--kumKoyu); }
.kilometre li:last-child { background: var(--sari); }
.kilometre .an { font-size: 15pt; font-weight: 800; }
.kilometre .musteri { font-size: 12pt; color: var(--murekkep); margin-bottom: 2mm; }
.kilometre .etiket { font-size: 12pt; color: var(--murekkep); }
.kilometre .ay-kazanc { font-size: 16pt; }
.kilometre .toplam { font-size: 21pt; font-weight: 800; letter-spacing: -0.02em; color: var(--lacivert); }
.kilometre li:last-child .toplam { color: var(--murekkep); }
/* ₺ hapı: euro tutarın altında, yumuşak pastel zeminde, italik. Sarı kartta zemin açık kâğıt olur. */
.kilometre .hap-yer { display: none; }
.kilometre .tl-hap { justify-self: start; font-style: italic; font-size: 10pt; line-height: 1.2; padding: 0.4mm 2.4mm; border-radius: 999px; background: var(--pastel); color: var(--murekkep); white-space: nowrap; margin: 0.6mm 0 1.6mm; }
.kilometre li:last-child .tl-hap { background: var(--kagit); }
.kur-dipnot { font-style: italic; color: var(--murekkep); }
table .tl-hap { display: table; margin-top: 0.5mm; font-style: italic; font-weight: 400; font-size: 10pt; line-height: 1.15; padding: 0.2mm 2.2mm; border-radius: 999px; background: var(--pastel); color: var(--murekkep); white-space: nowrap; }
.garanti { font-size: 13pt; font-weight: 600; color: var(--murekkep); }
.karsi { flex: 1; display: grid; grid-template-columns: 1.25fr 1fr; gap: 10mm; margin-top: 6mm; align-items: start; }
.karsi h2 { font-size: 16pt; margin-bottom: 2mm; }
.kur-kutusu { margin-top: 5mm; padding: 3mm 4mm; background: var(--kumKoyu); }
.kur-kutusu b { display: block; font-size: 12pt; margin-bottom: 0.5mm; }
.kur-kutusu .dipnot { color: var(--murekkep); }

/* Biz siz */
.biz-siz { margin-top: 8mm; display: grid; grid-template-columns: 1fr 1fr; flex: 1; }
.biz-siz > div { padding: 8mm 9mm; display: flex; flex-direction: column; justify-content: center; }
.biz-siz > div:first-child { background: var(--murekkep); color: var(--kagit); }
.biz-siz > div:last-child { background: var(--kumKoyu); }
.biz-siz h2 { font-size: 22pt; margin-bottom: 6mm; }
.biz-siz > div:first-child h2 { color: var(--sari); }
.biz-siz ul { list-style: none; display: grid; gap: 4.5mm; }
.biz-siz li { padding-left: 7mm; position: relative; font-size: 15pt; line-height: 1.3; }
.biz-siz li::before { content: ''; position: absolute; left: 0; top: 2.4mm; width: 2.8mm; height: 2.8mm; background: var(--sari); }
.biz-siz > div:last-child li::before { background: var(--murekkep); }
.alt-not { margin-top: 4mm; display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }

/* Son */
.son-izgara { flex: 1; display: grid; grid-template-columns: 1.1fr 1fr; gap: 14mm; align-items: center; }
.son-izgara h1 { font-size: 40pt; margin-top: 0; }
.son-izgara ol { list-style: none; counter-reset: s; display: grid; gap: 4mm; margin-top: 8mm; }
.son-izgara li { counter-increment: s; display: grid; grid-template-columns: 12mm 1fr; font-size: 16pt; align-items: baseline; }
.son-izgara li::before { content: counter(s); font-weight: 800; font-size: 20pt; color: var(--sari); }
.adres b { display: block; font-size: 60pt; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
.adres .imza { margin: 2mm 0 5mm; font-size: 12pt; }
`;

const ust = (ad) => `<header class="ust">${logo({ mm: 26 })}<span>${ad}</span></header>`;
const alt = (n, sol = 'Thoptan iş ortaklığı tanıtım sunumu') => `<footer class="alt"><span>${sol}</span>${altImza()}<span>${n} / ${TOPLAM}</span></footer>`;

function kapak() {
  const op = KAPAK_ORANLARI.map((o, i) => (i ? 0.25 + (o / KAPAK_ORANLARI[0]) * 0.75 : 1));
  const kareler = op.flatMap((o) => Array(12).fill(`<i style="opacity:${o.toFixed(2)};background:var(--${o === 1 ? 'sari' : 'solukKoyu'})"></i>`)).join('');
  return `<section class="sayfa koyu">
  <header class="ust"><div class="kapak-imza">${logo({ koyu: true, mm: 42 })}${imza()}<span class="dipnot ceviri">Thoptan ile istoc.com ağına bağlanırsınız.</span></div><span>İş ortaklığı programı</span></header>
  <div class="kapak-izgara">
    <div class="kapak-48 dev">48<span>aya kadar</span></div>
    <div class="kapak-sag">
      <p class="belge-adi">Thoptan iş ortaklığı tanıtım sunumu</p>
      <h2>Satışını kapattığınız müşteri size 48 aya kadar pay getirir.</h2>
      <p>Thoptan iş ortaklığı programına sizi davet ediyoruz.</p>
      <p class="not">Pay en çok 48 ay sürer. Bunun için müşteriler ilk 12 ayın her ayında en az ${avro(plan.kapatir.esik[0])} ödemelidir.</p>
      <p class="not">Bu belge satıcı firmalara hizmet veren danışmanlar ve hizmet firmaları için hazırlandı.</p>
    </div>
  </div>
  <div class="ay-serit" aria-label="48 ay">${kareler}</div>
  <div class="ay-etiket">${KAPAK_ORANLARI.map((o, i) => `<span>${i + 1}. yıl <b>${yuzde(o)}</b></span>`).join('')}</div>
  <footer class="alt"><span>Oranlar K3 seviyesinde satışı kapatma oranlarıdır. Kesin değerler yazılı anlaşmada belirlenir.</span><span>thoptan.com</span></footer>
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
    <div><b>%0</b><span>Thoptan satıcının satışından komisyon almaz.</span></div>
    ${alt(2)}
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
  <p class="not">Kurulum, işletmenin hesabını açmak ve ürünlerini yüklemektir. Kurulumdan sonraki desteği her durumda şirket verir.</p>
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
      ${merdiven({ g: 600, y: 340, kapat: kap, tanis: kademeler('tanistir'), yaziBoyu: 16 })}
    </div>
    <div class="sag-blok">
      <h2>13. aydan sonraki oranlar</h2>
      ${sonrakiOranlarTablosu({ plan, yuzde, donemAdi })}
      <p class="not" style="margin-top:2mm">Müşteri ödemeye devam ederse satıcı bu aylarda bu oranı alır. Oran %0 olunca pay biter.</p>
    </div>
  </div>
  <p class="not">Ciro, getirdiğiniz müşterilerin ödediği tutardır. Ulaştığınız kotanın oranı cironun tamamına uygulanır.</p>
  <p class="kosul">Eşikler ve oranlar bugünkü plandır. Kesin değerler yazılı anlaşmada belirlenir.</p>
  ${alt(4)}
</section>`;
}

function senaryo() {
  return `<section class="sayfa">
  ${ust('Büyüyen müşteri senaryosu')}
  <h1>12. ayda her ay ${avroTam(ay12.kazanc)} kazanırsınız.</h1>
  <div class="senaryo-ust">
    <p class="not">Bu gerçekçi senaryoda her ay ${K.yeni} yeni müşteri getirirsiniz. Her müşteri Basic paket için ayda ${avro(fiyat.basicAyEur)} öder. Müşteriler ${plan.musteriAy} ay kalır. Satışı siz kapatırsınız.</p>
    <div>${seviyeYolu({ kademeler: kap, seviyeAyi: K.seviyeAyi, yuzde })}</div>
  </div>
  ${kilometreTaslari({ anlar: KA, avro, liraHap })}
  <p class="dipnot" style="margin-top:2mm">“O ay” o ayın kazancıdır. “Toplam” o güne kadarki toplam kazançtır.</p>
  <p class="dipnot kur-dipnot">${kurDipnotu()}</p>
  <p class="kosul" style="margin-top:4mm">${K.seviyeAyi[2]}. ayda K3 seviyesine çıkarsınız. 4 yılın toplamı ${avroTam(ay48.toplam)} olur.</p>
  <p class="garanti" style="margin-top:2mm">Bu bir örnek senaryodur. Kazanç garantisi değildir.</p>
  ${alt(5)}
</section>`;
}

function karsilastirma() {
  const S = hesap.senaryolar;
  return `<section class="sayfa">
  ${ust('Senaryoları karşılaştırın')}
  <h1>Her yeni müşteri kazancınızı büyütür.</h1>
  <div class="karsi">
    <div>
      <h2>İki yol, gerçekçi senaryo</h2>
      <table><thead><tr><th>Zaman</th><th class="vurgu">Kapatma: o ay</th><th class="vurgu">Kapatma: toplam</th><th>Tanıştırma: toplam</th></tr></thead><tbody>
        ${KA.map((a, i) => `<tr><td>${a.ad}</td><td class="vurgu">${euroHucre(a.kazancEur, true)}</td><td class="vurgu">${euroHucre(a.toplamEur, true)}</td><td>${euroHucre(TA[i].toplamEur)}</td></tr>`).join('')}
      </tbody></table>
      <p class="not" style="margin-top:2mm">Satışı kapatırsanız kazancınız yaklaşık 2 kat olur.</p>
    </div>
    <div>
      <h2>Üç senaryo, satışı kapatırsanız</h2>
      <table><thead><tr><th>Senaryo</th><th>Ayda yeni müşteri</th><th>4 yılın toplamı</th></tr></thead><tbody>
        ${S.map((s) => `<tr class="${s.ana ? 'ana' : ''}"><td>${s.ad}</td><td>${s.yeniMusteri}</td><td>${euroHucre(Math.round(s.kapat.aylar.at(-1).toplam))}</td></tr>`).join('')}
      </tbody></table>
      <p class="not" style="margin-top:2mm">İlk ay en az ${K.yeni} müşteri getirin. Böylece K1 kotası her ay tutar.</p>
      <p class="dipnot kur-dipnot" style="margin-top:3mm">${kurDipnotu()}</p>
    </div>
  </div>
  <p class="garanti">Bu bir örnek senaryodur. Kazanç garantisi değildir.</p>
  ${alt(6)}
</section>`;
}

function persona() {
  return `<section class="sayfa">
  ${ust('Üç ortaklık yolu')}
  <h1>Hangisi sizsiniz?</h1>
  <div class="persona4">
    ${PERSONALAR.map((p) => `<div class="${p.ana ? 'ana' : ''}"><span class="buyuk">${p.buyuk}</span><h2>${p.ad}</h2>
      <p><b>Kim?</b>${p.kim}</p><p><b>Ne yapar?</b>${p.ne}</p><p><b>Nasıl kazanır?</b>${p.kazanc}</p><p><b>Nasıl başlar?</b>${p.basla}</p></div>`).join('')}
  </div>
  <p class="not" style="margin-top:3mm">Her yolun kendi kazancı ve kendi ilk adımı var.</p>
  ${alt(7)}
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
    <p class="kosul">İlk 12 ayın her birinde aylık ciro en az K1 kotası kadar olmalıdır. Ciro tek bir ay K1 kotasının altında kalırsa 13. aydan sonra pay alınmaz.</p>
    <p class="kosul">Bu belge sözleşme değildir. Kesin değerler yazılı anlaşmada belirlenir. Ayrıntılar el kitapçığındadır.</p>
  </div>
  ${alt(8)}
</section>`;
}

function son() {
  return `<section class="sayfa koyu">
  <header class="ust">${logo({ koyu: true, mm: 26 })}<span>İlk adım</span></header>
  <div class="son-izgara">
    <div>
      <h1>Hangi müşterinizle başlarsınız?</h1>
      <ol>${ILK_ADIMLAR.map((x) => `<li>${x}</li>`).join('')}</ol>
    </div>
    <div class="adres">${logo({ koyu: true, mm: 42 })}${imza()}<b>thoptan.com</b></div>
  </div>
  <footer class="alt"><span>Bu belge 23 Kasım 2026 Pazartesi günkü plana göre hazırlandı.</span>${altImza()}<span>${TOPLAM} / ${TOPLAM}</span></footer>
</section>`;
}

export function gorselHtml() {
  return sayfaIskeleti({ baslik: 'Thoptan iş ortaklığı tanıtım sunumu', boyut: 'A4 landscape', css, govde: [kapak(), sorular(), surec(), oranlar(), senaryo(), karsilastirma(), persona(), bizSiz(), son()].join('\n') });
}
export const GORSEL_SAYFA = TOPLAM;
