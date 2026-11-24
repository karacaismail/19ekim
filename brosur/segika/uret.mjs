/**
 * Segika iş ortaklığı setini üretir. Tek komut: `npm run uret` (brosur/segika klasöründe).
 * Çıktılar:
 *   public/indir/segika/segika-is-ortakligi-sunum.pptx
 *   public/indir/segika/segika-is-ortakligi-el-kitapcigi.pdf
 *   public/indir/segika/segika-is-ortakligi-gorsel-sunum.pdf
 *   brosur/segika/onizleme/*.png (her PDF sayfası ve her slayt düzeni)
 * PDF için kök depodaki @playwright/test Chromium'u kullanılır. Önce kökte `npm ci` çalışmış olmalıdır.
 */
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { kitapcikHtml } from './sablon/kitapcik.mjs';
import { gorselHtml } from './sablon/gorsel.mjs';
import { sunumUret, sunumOnizlemeHtml } from './sablon/sunum.mjs';
import { denetle } from './denetim.mjs';

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
  // A4 belgelerde gövde, koşul, açıklama ve grafik yazısı en az 11 pt (14,67 CSS px) olur.
  // Yalnız kaynak notu (.kaynak) ve sayfa alt bilgisi (.alt) 9 pt (12 CSS px) olabilir.
  const kucuk = await sayfa.evaluate(() => [...document.querySelectorAll('.sayfa *')].flatMap((e) => {
    if (!e.childNodes.length || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return [];
    const svg = e.closest('svg');
    const olcek = svg ? svg.getBoundingClientRect().width / svg.viewBox.baseVal.width : 1;
    const px = parseFloat(getComputedStyle(e).fontSize) * olcek;
    const dipnot = Boolean(e.closest('.kaynak, .alt'));
    const sinir = dipnot ? 11.95 : 14.6;
    return px < sinir ? [`${(px * 0.75).toFixed(1)} pt (${dipnot ? 'dipnot, en az 9' : 'gövde, en az 11'}): ${e.textContent.trim().slice(0, 40)}`] : [];
  }));
  if (kucuk.length) throw new Error(`Sınırın altında yazı var:\n${kucuk.join('\n')}`);
  const pdfYolu = resolve(hedef, `segika-is-ortakligi-${ad}.pdf`);
  await sayfa.pdf({ path: pdfYolu, width: genislik, height: yukseklik, printBackground: true, preferCSSPageSize: true, tagged: true, outline: false });
  await sayfa.close();
  const n = await pdfOnizle(tarayici, pdfYolu, onek);
  console.log(`${pdfYolu} (${n} sayfa)`);
}

/**
 * Önizleme PDF'in kendisinden çizilir. pdf.js (pdfjs-dist) Chromium içinde her sayfayı tuvale çizer.
 * Dosyalar küçük bir yerel sunucudan verilir, çünkü tarayıcı file:// adresinden modül yüklemez.
 */
async function pdfOnizle(baglam, pdfYolu, onek) {
  const pdfjs = resolve(burasi, 'node_modules/pdfjs-dist/build');
  const sunucu = createServer((istek, yanit) => {
    const ad = new URL(istek.url, 'http://x').pathname;
    if (ad === '/') { yanit.setHeader('content-type', 'text/html'); return yanit.end('<!doctype html><body></body>'); }
    const dosya = ad === '/belge.pdf' ? pdfYolu : resolve(pdfjs, ad.slice(1));
    if (dosya !== pdfYolu && !dosya.startsWith(pdfjs)) { yanit.statusCode = 404; return yanit.end(); }
    yanit.setHeader('content-type', dosya.endsWith('.pdf') ? 'application/pdf' : 'text/javascript');
    return yanit.end(readFileSync(dosya));
  });
  await new Promise((tamam) => sunucu.listen(0, '127.0.0.1', tamam));
  const adres = `http://127.0.0.1:${sunucu.address().port}`;
  const sayfa = await baglam.newPage();
  try {
    await sayfa.goto(`${adres}/`);
    const resimler = await sayfa.evaluate(async (a) => {
      const pdfjsLib = await import(`${a}/pdf.mjs`);
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${a}/pdf.worker.mjs`;
      const belge = await pdfjsLib.getDocument(`${a}/belge.pdf`).promise;
      const sonuc = [];
      for (let i = 1; i <= belge.numPages; i++) {
        const s = await belge.getPage(i);
        const v = s.getViewport({ scale: 1400 / s.getViewport({ scale: 1 }).width });
        const tuval = document.createElement('canvas');
        tuval.width = Math.round(v.width);
        tuval.height = Math.round(v.height);
        await s.render({ canvasContext: tuval.getContext('2d'), viewport: v }).promise;
        sonuc.push(tuval.toDataURL('image/png'));
      }
      return sonuc;
    }, adres);
    onizlemeTemizle(onek);
    resimler.forEach((r, i) => writeFileSync(resolve(onizleme, `${onek}-${String(i + 1).padStart(2, '0')}.png`), Buffer.from(r.split(',')[1], 'base64')));
    return resimler.length;
  } finally {
    await sayfa.close();
    sunucu.close();
  }
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
    // PPTX'in bütün metni Arial'dir. Taşma ve binme Arial ölçüsüyle denetlenir.
    // Ölçüm, PPTX ile aynı yerleşim verisinden çizilen HTML'de yapılır.
    const htmlYolu = resolve(ara, 'sunum-onizleme.html');
    writeFileSync(htmlYolu, sunumOnizlemeHtml());
    const ctx = await tarayici.newContext({ deviceScaleFactor: 1, viewport: { width: 1920, height: 1080 } });
    const sayfa = await ctx.newPage();
    await sayfa.goto(pathToFileURL(htmlYolu).href);
    await sayfa.evaluate(() => document.fonts.ready);
    const arial = await sayfa.evaluate(() => document.fonts.check('16px Arial'));
    if (!arial) throw new Error('Arial bulunamadı. Slayt ölçümü yapılamaz.');
    const tasma = await sayfa.evaluate(() => [...document.querySelectorAll('.metin')].filter((e) => {
      const p = [...e.children];
      const icerik = p.reduce((t, c) => t + c.getBoundingClientRect().height, 0);
      return icerik > e.clientHeight + 1 || p.some((c) => c.scrollWidth > e.clientWidth + 1);
    }).map((e) => `slayt ${e.dataset.slayt}: ${e.textContent.slice(0, 50)}`));
    if (tasma.length) throw new Error(`Slaytta taşan metin var (Arial ile):\n${tasma.join('\n')}`);
    // Metinlerin dolu alanı birbirine binmemelidir. Yalnız yazının kendisi ölçülür.
    const binen = await sayfa.evaluate(() => [...document.querySelectorAll('.slayt')].flatMap((sl, i) => {
      const kutular = [...sl.querySelectorAll('.metin')].map((e) => {
        const yurur = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
        const d = [];
        for (let n = yurur.nextNode(); n; n = yurur.nextNode()) {
          const aralik = document.createRange();
          aralik.selectNodeContents(n);
          d.push(...aralik.getClientRects());
        }
        return { e, r: { l: Math.min(...d.map((x) => x.left)), t: Math.min(...d.map((x) => x.top)), b: Math.max(...d.map((x) => x.bottom)), rr: Math.max(...d.map((x) => x.right)) } };
      });
      const sonuc = [];
      kutular.forEach((a, j) => kutular.slice(j + 1).forEach((b) => {
        if (a.r.l < b.r.rr - 1 && b.r.l < a.r.rr - 1 && a.r.t < b.r.b - 1 && b.r.t < a.r.b - 1) sonuc.push(`slayt ${i + 1}: "${a.e.textContent.slice(0, 30)}" ile "${b.e.textContent.slice(0, 30)}"`);
      }));
      return sonuc;
    }));
    if (binen.length) throw new Error(`Slaytta üst üste binen metin var (Arial ile):\n${binen.join('\n')}`);
    onizlemeTemizle('sunum');
    const slaytlar = await sayfa.$$('.slayt');
    for (const [i, sl] of slaytlar.entries()) await sl.screenshot({ path: resolve(onizleme, `sunum-yerlesim-${String(i + 1).padStart(2, '0')}.png`) });
    await ctx.close();
    // Gerçek PPTX'in görüntüsü: macOS Quick Look yalnız ilk slaytın küçük resmini verir.
    try {
      execFileSync('qlmanage', ['-t', '-s', '1600', '-o', ara, pptxYolu], { stdio: 'ignore' });
      writeFileSync(resolve(onizleme, 'sunum-01-quicklook.png'), readFileSync(resolve(ara, 'segika-is-ortakligi-sunum.pptx.png')));
    } catch {
      console.log('Quick Look küçük resmi alınamadı. Bu adım yalnız macOS üzerinde çalışır.');
    }
  }
} finally {
  await tarayici.close();
}

// İçerik denetimi gerçek çıktıyı okur. Yalnız bütün set üretildiğinde çalışır.
if (!sadece) await denetle();
