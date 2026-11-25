// Ortak HTML iskeleti, token CSS'i ve vektör şemalar. İki PDF belgesi bu dosyayı kullanır.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { renk, yazi } from './tokenlar.mjs';
import { KOK, sayi } from './veri.mjs';

// Sabit ağırlıklı Outfit dosyaları kullanılır. Değişken dosya PDF'e Type3 olarak girer ve metin kopyalanamaz.
const fontDosyasi = (ad) => pathToFileURL(path.join(import.meta.dirname, 'node_modules/@fontsource/outfit/files', ad)).href;
const AGIRLIKLAR = [300, 400, 500, 600, 700, 800];
const EXT = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const fontYuzleri = () => AGIRLIKLAR.flatMap((w) => [['latin-ext', EXT], ['latin', LATIN]].map(([alt, aralik]) =>
  `@font-face { font-family: 'Outfit'; font-style: normal; font-display: block; font-weight: ${w}; src: url('${fontDosyasi(`outfit-${alt}-${w}-normal.woff2`)}') format('woff2'); unicode-range: ${aralik}; }`)).join('\n');

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Token CSS'i. Bütün renkler ve yazı tipi buradan gelir. */
export function tokenCss() {
  const r = Object.entries(renk).map(([k, v]) => `--${k}: ${v};`).join('\n  ');
  return `
${fontYuzleri()}
:root {
  ${r}
  --yazi: ${yazi.yigin};
}`;
}

export function sayfaIskeleti({ baslik, css, govde, boyut }) {
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>${esc(baslik)}</title>
<style>
${tokenCss()}
@page { size: ${boyut}; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--kagit); color: var(--murekkep); font-family: var(--yazi); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-feature-settings: 'tnum' 1, 'lnum' 1; }
${css}
</style></head><body>${govde}</body></html>`;
}

/**
 * Thoptan logosu. Logo dosyaları thoptan.com sitesinden alındı (kaynak README.md içinde).
 * Lacivert logo açık zeminde, sarı logo koyu lacivert zeminde kullanılır.
 * Logo esnetilmez: yalnız genişlik verilir, yükseklik oranla gelir. Genişlik en çok 42 mm olur.
 */
export const LOGO = {
  acik: path.join(import.meta.dirname, 'gorsel/thoptan-logo.png'),
  koyu: path.join(import.meta.dirname, 'gorsel/thoptan-logo-beyaz.png'),
  oran: 250 / 64,
  enGenisMm: 42,
};
const logoVeri = (koyu) => `data:image/png;base64,${fs.readFileSync(koyu ? LOGO.koyu : LOGO.acik).toString('base64')}`;
export function logo({ koyu = false, mm = 26 } = {}) {
  if (mm > LOGO.enGenisMm) throw new Error(`Logo ${mm} mm olamaz. En çok ${LOGO.enGenisMm} mm olur.`);
  return `<img class="logo" src="${logoVeri(koyu)}" alt="Thoptan" style="width:${mm}mm;height:${(mm / LOGO.oran).toFixed(2)}mm">`;
}

/** Kapakta ve son sayfada logonun altındaki küçük imza. Her sayfaya konmaz. */
export const imza = () => '<span class="imza dipnot" lang="en">Connect to iStoc</span>';

/**
 * Kota merdiveni. Yatay eksen aylık ciro, dikey eksen orandır. İki katkı türü iki basamaklı çizgidir.
 * Örnek ciro dikey kesikli çizgiyle gösterilir.
 */
export function merdiven({ g = 760, y = 380, kapat, tanis, ornekCiro, koyu = false, yaziBoyu = 15 }) {
  const sol = 64, sag = 120, ust = 24, alt = 56;
  const enCok = 150_000;
  const X = (c) => sol + (c / enCok) * (g - sol - sag);
  const Y = (o) => ust + (1 - o / 0.32) * (y - ust - alt);
  const yol = (k) => {
    let d = `M ${X(0)} ${Y(k[0].oran)}`;
    k.forEach((s, i) => {
      const son = i === k.length - 1 ? enCok : k[i + 1].esik;
      d += ` H ${X(son)}`;
      if (i < k.length - 1) d += ` V ${Y(k[i + 1].oran)}`;
    });
    return d;
  };
  const metin = koyu ? 'var(--kagit)' : 'var(--murekkep)';
  const soluk = koyu ? 'var(--solukKoyu)' : 'var(--soluk)';
  const izgara = koyu ? 'var(--cizgiKoyu)' : 'var(--cizgi)';
  const ikinci = koyu ? 'var(--solukKoyu)' : 'var(--murekkep)';
  const yEks = [0, 0.1, 0.2, 0.3].map((o) => `<line x1="${sol}" x2="${g - sag}" y1="${Y(o)}" y2="${Y(o)}" stroke="${izgara}" stroke-width="1"/>
    <text x="${sol - 12}" y="${Y(o) + 5}" text-anchor="end" font-size="${yaziBoyu - 2}" fill="${soluk}">%${o * 100}</text>`).join('');
  const xEks = [0, 30_000, 60_000, 90_000, 120_000, 150_000].map((c) => `<text x="${X(c)}" y="${y - alt + 26}" text-anchor="middle" font-size="${yaziBoyu - 2}" fill="${soluk}">${c ? `${sayi(c / 1000)} bin TL` : '0 TL'}</text>`).join('');
  const zemin = koyu ? 'var(--murekkep)' : 'var(--kagit)';
  // Etiketin arkasına zemin renginde dikdörtgen konur. Çizgili metin (stroke) PDF'e Type3 olarak girdiği için kullanılmaz.
  const zeminKutu = (x, y, metin, boy, orta = true) => {
    const g = metin.length * boy * 0.62 + 8;
    return `<rect x="${orta ? x - g / 2 : x - 4}" y="${y - boy * 0.9}" width="${g}" height="${boy * 1.15}" fill="${zemin}"/>`;
  };
  const etiket = (k, renkDeger, yukari) => k.map((s, i) => {
    const son = i === k.length - 1 ? enCok : k[i + 1].esik;
    const orta = (X(s.esik) + X(son)) / 2;
    const ty = Y(s.oran) + (yukari ? -10 : 22);
    const m = `%${sayi(s.oran * 100)}`;
    return `${zeminKutu(orta, ty, m, yaziBoyu)}<text x="${orta}" y="${ty}" text-anchor="middle" font-size="${yaziBoyu}" font-weight="700" fill="${renkDeger}">${m}</text>`;
  }).join('');
  const oX = X(ornekCiro);
  return `<svg viewBox="0 0 ${g} ${y}" width="100%" role="img" aria-label="Aylık ciroya göre pay oranı" font-family="Outfit, Arial, sans-serif">
  ${yEks}${xEks}
  <text x="${sol - 12}" y="${ust - 8}" text-anchor="end" font-size="${yaziBoyu - 2}" fill="${soluk}">Oran</text>
  <text x="${g - sag}" y="${y - 4}" text-anchor="end" font-size="${yaziBoyu - 2}" fill="${soluk}">Bir aydaki ciro</text>
  <line x1="${oX}" x2="${oX}" y1="${ust}" y2="${y - alt}" stroke="${soluk}" stroke-width="1.5" stroke-dasharray="4 5"/>
  ${zeminKutu(oX + 8, ust + 10, `Örnek: ${sayi(ornekCiro)} TL`, yaziBoyu - 2, false)}<text x="${oX + 8}" y="${ust + 10}" font-size="${yaziBoyu - 2}" fill="${soluk}">Örnek: ${sayi(ornekCiro)} TL</text>
  <path d="${yol(tanis)}" fill="none" stroke="${ikinci}" stroke-width="4" stroke-linejoin="miter"/>
  ${koyu ? '' : `<path d="${yol(kapat)}" fill="none" stroke="var(--murekkep)" stroke-width="10" stroke-linejoin="miter"/>`}
  <path d="${yol(kapat)}" fill="none" stroke="var(--sari)" stroke-width="7" stroke-linejoin="miter"/>
  ${etiket(kapat, koyu ? 'var(--sari)' : 'var(--lacivert)', true)}
  ${etiket(tanis, metin, true)}
  <text x="${X(enCok) + 12}" y="${Y(kapat.at(-1).oran) + 6}" font-size="${yaziBoyu}" font-weight="700" fill="${koyu ? 'var(--sari)' : 'var(--lacivert)'}">Satışı</text>
  <text x="${X(enCok) + 12}" y="${Y(kapat.at(-1).oran) + 6 + yaziBoyu * 1.2}" font-size="${yaziBoyu}" font-weight="700" fill="${koyu ? 'var(--sari)' : 'var(--lacivert)'}">kapatırsanız</text>
  <text x="${X(enCok) + 12}" y="${Y(tanis.at(-1).oran) + 6}" font-size="${yaziBoyu}" font-weight="700" fill="${metin}">Yalnız</text>
  <text x="${X(enCok) + 12}" y="${Y(tanis.at(-1).oran) + 6 + yaziBoyu * 1.2}" font-size="${yaziBoyu}" font-weight="700" fill="${metin}">tanıştırırsanız</text>
</svg>`;
}

/** Dönemlere göre pay. Her dönemde iki çubuk vardır. Değer çubuğun üstünde yazar. */
export function donemCubuklari({ g = 760, y = 340, kapat, tanis, koyu = false, yaziBoyu = 15 }) {
  const donemler = ['1. ile 12. ay', '13. ile 24. ay', '25. ile 36. ay', '37. ile 48. ay'];
  const k = [kapat.ilkYil, ...kapat.yillar.map((v) => v.tutar)];
  const t = [tanis.ilkYil, ...tanis.yillar.map((v) => v.tutar)];
  while (t.length < 4) t.push(0);
  const sol = 8, alt = 52, ust = 34;
  const enCok = Math.max(...k);
  const grup = (g - sol * 2) / 4;
  const cub = grup * 0.3;
  const H = (v) => (v / enCok) * (y - alt - ust);
  const metin = koyu ? 'var(--kagit)' : 'var(--murekkep)';
  const soluk = koyu ? 'var(--solukKoyu)' : 'var(--soluk)';
  const ikinci = koyu ? 'var(--solukKoyu)' : 'var(--murekkep)';
  const taban = y - alt;
  const parca = donemler.map((ad, i) => {
    const x0 = sol + grup * i + grup * 0.14;
    const x1 = x0 + cub + 6;
    const deger = (v, x, renkD) => v
      ? `<text x="${x + cub / 2}" y="${taban - H(v) - 9}" text-anchor="middle" font-size="${yaziBoyu}" font-weight="700" fill="${renkD}">${sayi(v / 1000)} bin</text>`
      : `<text x="${x + cub / 2}" y="${taban - 9}" text-anchor="middle" font-size="${yaziBoyu - 1}" fill="${soluk}">yok</text>`;
    // Açık zeminde sarı çubuğun lacivert kenarı vardır. Böylece çubuk zeminden ayrılır.
    return `<rect x="${x0}" y="${taban - H(k[i])}" width="${cub}" height="${H(k[i])}" fill="var(--sari)"${koyu ? '' : ' stroke="var(--murekkep)" stroke-width="1.5"'}/>
      <rect x="${x1}" y="${taban - H(t[i])}" width="${cub}" height="${H(t[i])}" fill="${ikinci}"/>
      ${deger(k[i], x0, koyu ? 'var(--sari)' : 'var(--lacivert)')}${deger(t[i], x1, metin)}
      <text x="${x0 + cub + 3}" y="${taban + 26}" text-anchor="middle" font-size="${yaziBoyu - 1}" fill="${soluk}">${ad}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${g} ${y}" width="100%" role="img" aria-label="Dönemlere göre örnek pay" font-family="Outfit, Arial, sans-serif">
  <line x1="0" x2="${g}" y1="${taban}" y2="${taban}" stroke="${soluk}" stroke-width="1.5"/>
  ${parca}
</svg>`;
}

/** Paket kademesi: dört basamaklı çubuk. */
export function paketMerdiveni({ g = 520, y = 260, kademeler, secili, yaziBoyu = 15 }) {
  const n = kademeler.length;
  const ara = 10, alt = 54, ust = 30;
  const w = (g - ara * (n - 1)) / n;
  const enCok = Math.max(...kademeler.map((k) => k.oran));
  const H = (o) => 6 + (o / enCok) * (y - alt - ust - 6);
  return `<svg viewBox="0 0 ${g} ${y}" width="100%" role="img" aria-label="Paket sayısına göre prim oranı" font-family="Outfit, Arial, sans-serif">
  ${kademeler.map((k, i) => {
    const x = i * (w + ara);
    const vurgu = i === secili;
    return `<rect x="${x}" y="${y - alt - H(k.oran)}" width="${w}" height="${H(k.oran)}" fill="${vurgu ? 'var(--sari)' : 'var(--kumKoyu)'}"${vurgu ? ' stroke="var(--murekkep)" stroke-width="1.5"' : ''}/>
      <text x="${x + w / 2}" y="${y - alt - H(k.oran) - 9}" text-anchor="middle" font-size="${yaziBoyu + 2}" font-weight="700" fill="${vurgu ? 'var(--lacivert)' : 'var(--murekkep)'}">${k.oran ? `%${sayi(k.oran * 100)}` : 'yok'}</text>
      <text x="${x + w / 2}" y="${y - alt + 24}" text-anchor="middle" font-size="${yaziBoyu - 1}" fill="var(--soluk)">${esc(k.ad)}</text>`;
  }).join('')}
</svg>`;
}
