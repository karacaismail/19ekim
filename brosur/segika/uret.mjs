/**
 * Segika iş ortaklığı setini üretir. Tek komut: `npm run uret` (brosur/segika klasöründe).
 * Çıktılar:
 *   public/indir/segika/segika-is-ortakligi-sunum.pptx
 *   public/indir/segika/segika-is-ortakligi-el-kitapcigi.pdf
 *   public/indir/segika/segika-is-ortakligi-gorsel-sunum.pdf
 *   brosur/segika/onizleme/*.png (her PDF sayfası ve her slayt düzeni)
 * PDF için kök depodaki @playwright/test Chromium'u kullanılır. Önce kökte `npm ci` çalışmış olmalıdır.
 */
import { mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { kitapcikHtml } from './sablon/kitapcik.mjs';
import { gorselHtml } from './sablon/gorsel.mjs';
import { sunumUret, sunumOnizlemeHtml } from './sablon/sunum.mjs';

const burasi = dirname(fileURLToPath(import.meta.url));
const kok = resolve(burasi, '../..');
const hedef = resolve(kok, 'public/indir/segika');
const ara = resolve(burasi, '.uretim');
const onizleme = resolve(burasi, 'onizleme');
const sadece = process.argv[2];

const require = createRequire(resolve(kok, 'package.json'));
const { chromium } = require('@playwright/test');

mkdirSync(hedef, { recursive: true });
mkdirSync(ara, { recursive: true });
mkdirSync(onizleme, { recursive: true });

function onizlemeTemizle(onek) {
  for (const f of readdirSync(onizleme)) if (f.startsWith(onek)) rmSync(resolve(onizleme, f));
}

async function pdfUret(tarayici, { ad, html, genislik, yukseklik, onek }) {
  const htmlYolu = resolve(ara, `${ad}.html`);
  writeFileSync(htmlYolu, html);
  const sayfa = await tarayici.newPage();
  await sayfa.goto(pathToFileURL(htmlYolu).href, { waitUntil: 'load' });
  await sayfa.evaluate(() => document.fonts.ready);
  const outfit = await sayfa.evaluate(() => document.fonts.check('700 20px Outfit'));
  if (!outfit) throw new Error('Outfit yazı tipi yüklenmedi.');
  const tasma = await sayfa.evaluate(() => [...document.querySelectorAll('.sayfa')].flatMap((s, i) => {
    const kutu = s.getBoundingClientRect();
    return [...s.querySelectorAll('*')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && (r.bottom > kutu.bottom + 0.5 || r.right > kutu.right + 0.5);
    }).map((e) => `sayfa ${i + 1}: ${e.tagName.toLowerCase()}.${e.className} taşıyor`);
  }));
  const binen = await sayfa.evaluate(() => [...document.querySelectorAll('.sayfa')].flatMap((s, i) => {
    const alt = s.querySelector(':scope > .alt, :scope .alt');
    if (!alt) return [];
    const ust = alt.getBoundingClientRect().top;
    return [...s.querySelectorAll('*')].filter((e) => !alt.contains(e) && e !== alt && !e.contains(alt) && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().bottom > ust + 0.5)
      .map((e) => `sayfa ${i + 1}: ${e.tagName.toLowerCase()}.${e.className} alt bilgiye biniyor`);
  }));
  tasma.push(...binen);
  if (tasma.length) throw new Error(`Taşan öğe var:\n${tasma.join('\n')}`);
  const kucuk = await sayfa.evaluate(() => [...document.querySelectorAll('.sayfa *')].filter((e) => {
    if (!e.childNodes.length || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false;
    // SVG içindeki yazı, SVG'nin ekrandaki ölçeğiyle büyür ya da küçülür.
    const svg = e.closest('svg');
    const olcek = svg ? svg.getBoundingClientRect().width / svg.viewBox.baseVal.width : 1;
    return parseFloat(getComputedStyle(e).fontSize) * olcek < 11.95; // 9 pt = 12 CSS px
  }).map((e) => e.textContent.trim().slice(0, 40)));
  if (kucuk.length) throw new Error(`9 pt altında metin var:\n${kucuk.join('\n')}`);
  const pdfYolu = resolve(hedef, `segika-is-ortakligi-${ad}.pdf`);
  await sayfa.pdf({ path: pdfYolu, width: genislik, height: yukseklik, printBackground: true, preferCSSPageSize: true, tagged: true, outline: false });
  onizlemeTemizle(onek);
  const sayfalar = await sayfa.$$('.sayfa');
  for (const [i, s] of sayfalar.entries()) {
    await s.screenshot({ path: resolve(onizleme, `${onek}-${String(i + 1).padStart(2, '0')}.png`) });
  }
  await sayfa.close();
  console.log(`${pdfYolu} (${sayfalar.length} sayfa)`);
}

const tarayici = await chromium.launch();
try {
  if (!sadece || sadece === 'kitapcik') {
    const sayfa = await tarayici.newContext({ deviceScaleFactor: 1.4 });
    await pdfUret(sayfa, { ad: 'el-kitapcigi', html: kitapcikHtml(), genislik: '210mm', yukseklik: '297mm', onek: 'el-kitapcigi' });
  }
  if (!sadece || sadece === 'gorsel') {
    const sayfa = await tarayici.newContext({ deviceScaleFactor: 1.2 });
    await pdfUret(sayfa, { ad: 'gorsel-sunum', html: gorselHtml(), genislik: '297mm', yukseklik: '210mm', onek: 'gorsel-sunum' });
  }
  if (!sadece || sadece === 'sunum') {
    const pptxYolu = resolve(hedef, 'segika-is-ortakligi-sunum.pptx');
    const n = await sunumUret(pptxYolu);
    console.log(`${pptxYolu} (${n} slayt)`);
    // Slayt düzeninin önizlemesi: aynı yerleşim verisi HTML olarak, yedek yazı tipi Arial ile çizilir.
    const htmlYolu = resolve(ara, 'sunum-onizleme.html');
    writeFileSync(htmlYolu, sunumOnizlemeHtml());
    const ctx = await tarayici.newContext({ deviceScaleFactor: 1, viewport: { width: 1920, height: 1080 } });
    const sayfa = await ctx.newPage();
    await sayfa.goto(pathToFileURL(htmlYolu).href);
    await sayfa.evaluate(() => document.fonts.ready);
    // Taşma iki yazı tipiyle ölçülür: Outfit ve yedek Arial. Outfit kurulu değilse PowerPoint Arial kullanır.
    for (const yedek of [true, false]) {
      const tasma = await sayfa.evaluate(async (y) => {
        document.body.classList.toggle('yedek', y);
        await document.fonts.ready;
        return [...document.querySelectorAll('.metin')].filter((e) => {
          const p = [...e.children];
          const icerik = p.reduce((t, c) => t + c.getBoundingClientRect().height, 0);
          return icerik > e.clientHeight + 1 || p.some((c) => c.scrollWidth > e.clientWidth + 1);
        }).map((e) => `slayt ${e.dataset.slayt}: ${e.textContent.slice(0, 50)}`);
      }, yedek);
      if (tasma.length) throw new Error(`Slaytta taşan metin var (${yedek ? 'Arial' : 'Outfit'} ile):\n${tasma.join('\n')}`);
      // Metinlerin dolu alanı birbirine binmemelidir. Dolu alan, paragrafların gerçek yüksekliğidir.
      const binen = await sayfa.evaluate(() => [...document.querySelectorAll('.slayt')].flatMap((sl, i) => {
        const kutular = [...sl.querySelectorAll('.metin')].map((e) => {
          // Yalnız yazının kendisi ölçülür. Paragraf kutusu sağa yaslı yazıda bütün genişliği kaplar.
          const yurur = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
          const dikdortgenler = [];
          for (let n = yurur.nextNode(); n; n = yurur.nextNode()) {
            const aralik = document.createRange();
            aralik.selectNodeContents(n);
            dikdortgenler.push(...aralik.getClientRects());
          }
          return { e, r: { l: Math.min(...dikdortgenler.map((x) => x.left)), t: Math.min(...dikdortgenler.map((x) => x.top)), b: Math.max(...dikdortgenler.map((x) => x.bottom)), rr: Math.max(...dikdortgenler.map((x) => x.right)) } };
        });
        const sonuc = [];
        kutular.forEach((a, j) => kutular.slice(j + 1).forEach((b) => {
          if (a.r.l < b.r.rr - 1 && b.r.l < a.r.rr - 1 && a.r.t < b.r.b - 1 && b.r.t < a.r.b - 1) sonuc.push(`slayt ${i + 1}: "${a.e.textContent.slice(0, 30)}" ile "${b.e.textContent.slice(0, 30)}"`);
        }));
        return sonuc;
      }));
      if (binen.length) throw new Error(`Slaytta üst üste binen metin var (${yedek ? 'Arial' : 'Outfit'} ile):\n${binen.join('\n')}`);
    }
    onizlemeTemizle('sunum');
    const slaytlar = await sayfa.$$('.slayt');
    for (const [i, s] of slaytlar.entries()) await s.screenshot({ path: resolve(onizleme, `sunum-${String(i + 1).padStart(2, '0')}.png`) });
    await ctx.close();
  }
} finally {
  await tarayici.close();
}
