/** PDF şablonlarının ortak parçaları: token CSS'i, yazı tipi, marka yazısı ve vektör grafikler. */
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { tl, yuzde } from '../icerik.mjs';
export const KAPAK_DIKEY = pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)), '../gorsel/kapak-dikey.jpg')).href;
export const KAPAK_YATAY = pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)), '../gorsel/kapak-yatay.jpg')).href;

const burasi = dirname(fileURLToPath(import.meta.url));
export const TOKENS = JSON.parse(readFileSync(resolve(burasi, '../tokens.json'), 'utf8'));
const R = TOKENS.renk;

const fontDizini = resolve(burasi, '../yazi-tipi');
const font = (ad) => pathToFileURL(resolve(fontDizini, ad)).href;
const AGIRLIK = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold' };

/**
 * Outfit yazı tipi. Dosyalar `yazi-tipi/` klasöründeki resmî sabit ağırlıklı TTF'lerdir.
 * Kaynak: github.com/Outfitio/Outfit-Fonts, fonts/ttf klasörü. Lisans: yazi-tipi/OFL.txt.
 * Değişken yazı tipi Chromium'da PDF'e Type3 olarak giriyordu. O zaman metin kopyalanınca bozuk çıkıyordu.
 * Her ağırlık tek dosyadır. Böylece "ş" ve "İ" aynı yazı tipinden gelir ve metin araması bozulmaz.
 */
export function fontCss() {
  return Object.entries(AGIRLIK).map(([w, ad]) =>
    `@font-face { font-family: 'Outfit'; font-style: normal; font-weight: ${w}; font-display: block; src: url('${font(`Outfit-${ad}.ttf`)}') format('truetype'); }`).join('\n');
}

/** Token'lardan CSS değişkenleri. Bileşenler yalnız bu değişkenleri kullanır. */
export function tokenCss(olcek) {
  const o = TOKENS[olcek];
  const renk = Object.entries(R).filter(([k]) => !k.startsWith('$')).map(([k, v]) => `--r-${k}: ${v};`).join('\n  ');
  const boyut = Object.entries(o).filter(([k]) => !k.startsWith('$')).map(([k, v]) => `--o-${k}: ${v};`).join('\n  ');
  return `
${fontCss()}
:root {
  ${renk}
  ${boyut}
  --yazi: 'Outfit', '${TOKENS.yazi.yedek}', sans-serif;
  --w-govde: ${TOKENS.yazi.agirlik.govde};
  --w-orta: ${TOKENS.yazi.agirlik.orta};
  --w-kalin: ${TOKENS.yazi.agirlik.kalin};
  --w-baslik: ${TOKENS.yazi.agirlik.baslik};
  --w-dev: ${TOKENS.yazi.agirlik.dev};
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--r-beyaz); }
body { font-family: var(--yazi); color: var(--r-murekkep); font-size: var(--o-govde); line-height: var(--o-satir);
  font-kerning: normal; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-rendering: geometricPrecision; }
.sayfa { position: relative; overflow: hidden; break-after: page; page-break-after: always; }
.sayfa:last-child { break-after: auto; page-break-after: auto; }
.kanca { font-weight: var(--w-baslik); letter-spacing: -0.015em; line-height: 1.08; color: var(--r-lacivert); text-wrap: balance; }
.ust { font-size: var(--o-ust); font-weight: var(--w-kalin); letter-spacing: 0.12em; text-transform: uppercase; color: var(--r-yesilMetin); }
.koyu .ust { color: var(--r-yesil); }
.kaynak { font-size: var(--o-dipnot); color: var(--r-gri); line-height: 1.4; }
.koyu .kaynak { color: var(--r-griLacivertUstu); }
.koyu { background: var(--r-lacivert); color: var(--r-beyaz); }
.koyu .kanca { color: var(--r-beyaz); }
.rakam { font-variant-numeric: tabular-nums; }
.marka { font-weight: var(--w-dev); letter-spacing: -0.03em; line-height: 1; display: inline-flex; align-items: baseline; }
.marka i { display: inline-block; width: 0.26em; height: 0.26em; border-radius: 50%; background: var(--r-yesil); margin-left: 0.06em; }
`;
}

/**
 * Metin düzeltmesi: düz kesme işaretini tipografik kesmeye çevirir. Sayı ile TL arasına ve sıra sayısından sonra
 * bölünmeyen boşluk koyar. Böylece "93.600 TL" ve "4. yıl" satır sonunda bölünmez. Yalnız metne uygulanır.
 */
export function metinDuzelt(t) {
  return t
    .replace(/([A-Za-zÇĞİÖŞÜçğıöşü0-9%])'([a-zçğıöşü])/g, '$1’$2')
    .replace(/(\d) TL/g, '$1\u00A0TL')
    .replace(/(\d+)\. (?=[a-zçğıöşü])/g, '$1.\u00A0')
    .replace(/ × /g, '\u00A0× ');
}
/** HTML'de yalnız etiket dışındaki metne uygulanır. <style> bölümüne dokunmaz. */
export function htmlDuzelt(html) {
  const [bas, govde] = html.split('</style>');
  return `${bas}</style>${govde.replace(/>([^<]+)</g, (_, m) => `>${metinDuzelt(m)}<`)}`;
}

export const marka = (cls = '') => `<span class="marka ${cls}">Segika<i aria-hidden="true"></i></span>`;

/** 12 ay şeridi: her ay bir bordro ve bir teşvik kontrolü. */
export function aySeridi({ genislik = 600, renk = R.yesil, zemin = R.cizgiLacivertUstu, yazi = R.griLacivertUstu, boyut = 13 } = {}) {
  const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const adim = genislik / 12;
  const r = Math.min(adim * 0.34, 22);
  const h = r * 2 + boyut * 2.2;
  const daireler = aylar.map((a, i) => {
    const cx = adim * i + adim / 2;
    return `<circle cx="${cx}" cy="${r + 2}" r="${r}" fill="${renk}"/>
      <path d="M ${cx - r * 0.38} ${r + 2} l ${r * 0.26} ${r * 0.28} l ${r * 0.5} ${-r * 0.56}" fill="none" stroke="${R.lacivert}" stroke-width="${Math.max(2, r * 0.16)}" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${cx}" y="${r * 2 + boyut * 1.6}" text-anchor="middle" font-size="${boyut}" fill="${yazi}" font-family="Outfit, Arial" font-weight="500">${a}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${genislik} ${h + 4}" width="100%" role="img" aria-label="12 ay boyunca her ay bir kontrol">
    <line x1="${adim / 2}" y1="${r + 2}" x2="${genislik - adim / 2}" y2="${r + 2}" stroke="${zemin}" stroke-width="2"/>${daireler}</svg>`;
}

/**
 * Basamak grafiği. Her basamak bir çubuktur. Yükseklik orana göredir.
 * `seriler`: [{ ad, renk, yaziRenk, basamaklar: [{ ad, esik, oran }] }]
 */
export function basamakGrafik({ seriler, genislik = 640, yukseklik = 300, boyut = 14, enCok = 0.3, esikYaz = true, eksenRenk = R.cizgi, yaziRenk = R.murekkep, altYazi = R.gri }) {
  const ustBosluk = boyut * 2.4;
  const altBosluk = esikYaz ? boyut * 3.6 : boyut * 2;
  const alan = yukseklik - ustBosluk - altBosluk;
  const grup = genislik / 4;
  const n = seriler.length;
  const cubukG = Math.min(grup * (n === 1 ? 0.62 : 0.36), 120);
  const ara = n === 1 ? 0 : cubukG * 0.12;
  let svg = '';
  for (let i = 0; i < 4; i++) {
    const gx = grup * i + (grup - (cubukG * n + ara * (n - 1))) / 2;
    seriler.forEach((s, j) => {
      const b = s.basamaklar[i];
      const h = Math.max(b.oran / enCok * alan, 3);
      const x = gx + j * (cubukG + ara);
      const y = ustBosluk + alan - h;
      svg += `<rect x="${x}" y="${y}" width="${cubukG}" height="${h}" fill="${s.renkler?.[i] ?? s.renk}"/>`;
      svg += `<text x="${x + cubukG / 2}" y="${y - boyut * 0.55}" text-anchor="middle" font-size="${boyut * (n === 1 ? 1.5 : 1.15)}" font-weight="700" fill="${s.yaziRenk ?? yaziRenk}" font-family="Outfit, Arial">${yuzde(b.oran)}</text>`;
    });
    const b0 = seriler[0].basamaklar[i];
    svg += `<text x="${grup * i + grup / 2}" y="${ustBosluk + alan + boyut * 1.45}" text-anchor="middle" font-size="${boyut}" font-weight="700" fill="${yaziRenk}" font-family="Outfit, Arial">${b0.ad}</text>`;
    if (esikYaz) {
      const esikler = [...new Set(seriler.map((s) => s.basamaklar[i].esik))];
      const metin = i === 0 ? 'eşik yok' : esikler.map((e) => `${tl(e)}+`).join(' | ');
      svg += `<text x="${grup * i + grup / 2}" y="${ustBosluk + alan + boyut * 2.85}" text-anchor="middle" font-size="${boyut}" fill="${altYazi}" font-family="Outfit, Arial">${metin}</text>`;
    }
  }
  svg += `<line x1="0" y1="${ustBosluk + alan}" x2="${genislik}" y2="${ustBosluk + alan}" stroke="${eksenRenk}" stroke-width="1.5"/>`;
  return `<svg viewBox="0 0 ${genislik} ${yukseklik}" width="100%" role="img" aria-label="Ciro basamağına göre oranlar">${svg}</svg>`;
}

/** Yıllara göre azalan pay. `yillar`: [{ ad, oran, tutar }] */
export function yilGrafik({ yillar, genislik = 640, yukseklik = 260, boyut = 14, renkler = [R.yesil, R.lacivert, R.lacivert, R.lacivert], yaziRenk = R.murekkep, altYazi = R.gri, eksen = R.cizgi }) {
  const ust = boyut * 2.6, alt = boyut * 3.4;
  const alan = yukseklik - ust - alt;
  const enCok = Math.max(...yillar.map((y) => y.tutar));
  const grup = genislik / yillar.length;
  const g = Math.min(grup * 0.58, 130);
  let svg = '';
  yillar.forEach((y, i) => {
    const h = Math.max(y.tutar / enCok * alan, 3);
    const x = grup * i + (grup - g) / 2;
    const yy = ust + alan - h;
    svg += `<rect x="${x}" y="${yy}" width="${g}" height="${h}" fill="${renkler[i] ?? R.lacivert}"/>`;
    svg += `<text x="${x + g / 2}" y="${yy - boyut * 0.6}" text-anchor="middle" font-size="${boyut * 1.2}" font-weight="700" fill="${yaziRenk}" font-family="Outfit, Arial">${tl(y.tutar)}</text>`;
    svg += `<text x="${grup * i + grup / 2}" y="${ust + alan + boyut * 1.45}" text-anchor="middle" font-size="${boyut}" font-weight="700" fill="${yaziRenk}" font-family="Outfit, Arial">${y.ad}</text>`;
    svg += `<text x="${grup * i + grup / 2}" y="${ust + alan + boyut * 2.8}" text-anchor="middle" font-size="${boyut}" fill="${altYazi}" font-family="Outfit, Arial">oran ${yuzde(y.oran)}</text>`;
  });
  svg += `<line x1="0" y1="${ust + alan}" x2="${genislik}" y2="${ust + alan}" stroke="${eksen}" stroke-width="1.5"/>`;
  return `<svg viewBox="0 0 ${genislik} ${yukseklik}" width="100%" role="img" aria-label="Yıllara göre pay">${svg}</svg>`;
}

/** Bin TL olarak kısa tutar: 391600 -> "391,6". Çubuk etiketlerinde kullanılır. */
export const binTl = (n) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n / 1000);

/**
 * 12 sütunlu çubuk grafik. Sütunlar `aySeridi` ile aynı genişlikte ve aynı hizadadır.
 * Böylece grafik ay şeridinin hemen üstüne konunca her çubuk kendi ayının üstünde durur.
 * `degerler`: 12 sayı. `etiket`: çubuğun üstündeki yazı. `alt`: çubuğun altındaki yazı (isteğe bağlı).
 */
export function ayCubuk({ degerler, etiket = binTl, alt = null, genislik = 600, yukseklik = 160, boyut = 13, renkler = null, renk = R.yesil, yazi = R.beyaz, altRenk = R.griLacivertUstu, eksen = null }) {
  const adim = genislik / 12;
  const g = adim * 0.58;
  const ust = boyut * 1.6;
  const altB = alt ? boyut * 1.7 : 2;
  const alan = yukseklik - ust - altB;
  const enCok = Math.max(...degerler);
  let svg = '';
  degerler.forEach((v, i) => {
    const h = Math.max(v / enCok * alan, 2);
    const x = adim * i + (adim - g) / 2;
    const y = ust + alan - h;
    svg += `<rect x="${x}" y="${y}" width="${g}" height="${h}" fill="${renkler?.[i] ?? renk}"/>`;
    svg += `<text x="${adim * i + adim / 2}" y="${y - boyut * 0.4}" text-anchor="middle" font-size="${boyut}" font-weight="700" fill="${yazi}" font-family="Outfit, Arial">${etiket(v, i)}</text>`;
    if (alt) svg += `<text x="${adim * i + adim / 2}" y="${ust + alan + boyut * 1.25}" text-anchor="middle" font-size="${boyut}" fill="${altRenk}" font-family="Outfit, Arial">${alt(i)}</text>`;
  });
  if (eksen) svg += `<line x1="0" y1="${ust + alan}" x2="${genislik}" y2="${ust + alan}" stroke="${eksen}" stroke-width="1.2"/>`;
  return `<svg viewBox="0 0 ${genislik} ${yukseklik}" width="100%" role="img" aria-label="12 aylık çubuk grafik">${svg}</svg>`;
}
