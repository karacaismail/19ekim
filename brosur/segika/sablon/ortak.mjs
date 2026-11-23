/** PDF şablonlarının ortak parçaları: token CSS'i, yazı tipi, marka yazısı ve vektör grafikler. */
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { tl, yuzde } from '../icerik.mjs';

const burasi = dirname(fileURLToPath(import.meta.url));
export const TOKENS = JSON.parse(readFileSync(resolve(burasi, '../tokens.json'), 'utf8'));
const R = TOKENS.renk;

const fontDizini = resolve(burasi, '../../../node_modules/@fontsource-variable/outfit/files');
const font = (ad) => pathToFileURL(resolve(fontDizini, ad)).href;

/** Outfit yazı tipi. Dosya kök depodaki @fontsource-variable/outfit paketinden gelir ve PDF'e gömülür. */
export function fontCss() {
  return `@font-face { font-family: 'Outfit'; font-style: normal; font-weight: 100 900; font-display: block;
  src: url('${font('outfit-latin-wght-normal.woff2')}') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Outfit'; font-style: normal; font-weight: 100 900; font-display: block;
  src: url('${font('outfit-latin-ext-wght-normal.woff2')}') format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }`;
}

/** Token'lardan CSS değişkenleri. Bileşenler yalnız bu değişkenleri kullanır. */
export function tokenCss(olcek) {
  const o = TOKENS[olcek];
  const renk = Object.entries(R).map(([k, v]) => `--r-${k}: ${v};`).join('\n  ');
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
.koyu { background: var(--r-lacivert); color: var(--r-beyaz); }
.koyu .kanca { color: var(--r-beyaz); }
.rakam { font-variant-numeric: tabular-nums; }
.marka { font-weight: var(--w-dev); letter-spacing: -0.03em; line-height: 1; display: inline-flex; align-items: baseline; }
.marka i { display: inline-block; width: 0.26em; height: 0.26em; border-radius: 50%; background: var(--r-yesil); margin-left: 0.06em; }
`;
}

/**
 * Metin düzeltmesi: düz kesme işaretini tipografik kesmeye çevirir. Sayı ile ₺ arasına ve sıra sayısından sonra
 * bölünmeyen boşluk koyar. Böylece "93.600 ₺" ve "4. yıl" satır sonunda bölünmez. Yalnız metne uygulanır.
 */
export function metinDuzelt(t) {
  return t
    .replace(/([A-Za-zÇĞİÖŞÜçğıöşü0-9%])'([a-zçğıöşü])/g, '$1’$2')
    .replace(/(\d) ₺/g, '$1\u00A0₺')
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
      svg += `<rect x="${x}" y="${y}" width="${cubukG}" height="${h}" fill="${s.renk}"/>`;
      svg += `<text x="${x + cubukG / 2}" y="${y - boyut * 0.55}" text-anchor="middle" font-size="${boyut * (n === 1 ? 1.5 : 1.15)}" font-weight="700" fill="${s.yaziRenk ?? yaziRenk}" font-family="Outfit, Arial">${yuzde(b.oran)}</text>`;
    });
    const b0 = seriler[0].basamaklar[i];
    svg += `<text x="${grup * i + grup / 2}" y="${ustBosluk + alan + boyut * 1.45}" text-anchor="middle" font-size="${boyut}" font-weight="700" fill="${yaziRenk}" font-family="Outfit, Arial">${b0.ad}</text>`;
    if (esikYaz) {
      const esikler = [...new Set(seriler.map((s) => s.basamaklar[i].esik))];
      const metin = i === 0 ? 'eşik yok' : esikler.map((e) => `${tl(e)}+`).join(' | ');
      svg += `<text x="${grup * i + grup / 2}" y="${ustBosluk + alan + boyut * 2.85}" text-anchor="middle" font-size="${boyut * 0.92}" fill="${altYazi}" font-family="Outfit, Arial">${metin}</text>`;
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
    svg += `<text x="${grup * i + grup / 2}" y="${ust + alan + boyut * 2.8}" text-anchor="middle" font-size="${boyut * 0.92}" fill="${altYazi}" font-family="Outfit, Arial">oran ${yuzde(y.oran)}</text>`;
  });
  svg += `<line x1="0" y1="${ust + alan}" x2="${genislik}" y2="${ust + alan}" stroke="${eksen}" stroke-width="1.5"/>`;
  return `<svg viewBox="0 0 ${genislik} ${yukseklik}" width="100%" role="img" aria-label="Yıllara göre pay">${svg}</svg>`;
}
