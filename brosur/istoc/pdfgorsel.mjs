// Gerçek PDF dosyasını okur. Metni pdfjs ile Node içinde çıkarır. Sayfaları pdfjs ile tarayıcıda PNG'ye çizer.
// Böylece önizleme HTML'in değil, yazılmış PDF'in görüntüsüdür.
import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const PDFJS = path.join(import.meta.dirname, 'node_modules/pdfjs-dist');

/** PDF'in her sayfasının metni. Kopyalama ve arama bu metni kullanır. */
export async function pdfMetni(dosya) {
  const belge = await getDocument({ data: new Uint8Array(fs.readFileSync(dosya)), useSystemFonts: false, standardFontDataUrl: `${PDFJS}/standard_fonts/` }).promise;
  const sayfalar = [];
  for (let i = 1; i <= belge.numPages; i++) {
    const icerik = await (await belge.getPage(i)).getTextContent();
    sayfalar.push(icerik.items.map((o) => o.str + (o.hasEOL ? '\n' : '')).join(''));
  }
  await belge.destroy();
  return sayfalar;
}

/** PDF'teki yazı tipi türleri. Type3 türü metin kopyalamayı bozar. */
export function yaziTipiTurleri(dosya) {
  const ham = fs.readFileSync(dosya, 'latin1');
  return [...new Set([...ham.matchAll(/\/Subtype\s*\/(Type3|Type1|TrueType|Type0|CIDFontType2|CIDFontType0)/g)].map((m) => m[1]))];
}

/** Gerçek PDF'i tarayıcıdaki pdfjs ile sayfa sayfa PNG'ye çizer. */
export async function pdfPng(tarayici, dosya, hedefKlasor, onEk, olcek = 2) {
  const sayfa = await tarayici.newPage();
  await sayfa.route('http://yerel/**', (yol) => {
    const ad = new URL(yol.request().url()).pathname;
    const disk = ad === '/belge.pdf' ? dosya : path.join(PDFJS, ad.replace(/^\/pdfjs\//, ''));
    const tur = disk.endsWith('.mjs') ? 'text/javascript' : disk.endsWith('.pdf') ? 'application/pdf' : disk.endsWith('.html') ? 'text/html' : 'application/octet-stream';
    if (ad === '/') return yol.fulfill({ contentType: 'text/html', body: '<!doctype html><title>pdf</title>' });
    return fs.existsSync(disk) ? yol.fulfill({ path: disk, contentType: tur }) : yol.fulfill({ status: 404, body: '' });
  });
  await sayfa.goto('http://yerel/');
  const adet = await sayfa.evaluate(async () => {
    const pdfjs = await import('http://yerel/pdfjs/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'http://yerel/pdfjs/build/pdf.worker.mjs';
    window.belge = await pdfjs.getDocument({ url: 'http://yerel/belge.pdf', cMapUrl: 'http://yerel/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: 'http://yerel/pdfjs/standard_fonts/' }).promise;
    return window.belge.numPages;
  });
  for (let i = 1; i <= adet; i++) {
    const veri = await sayfa.evaluate(async ([n, olcek]) => {
      const s = await window.belge.getPage(n);
      const gorunum = s.getViewport({ scale: olcek });
      const tuval = document.createElement('canvas');
      tuval.width = Math.round(gorunum.width);
      tuval.height = Math.round(gorunum.height);
      await s.render({ canvasContext: tuval.getContext('2d'), viewport: gorunum }).promise;
      return tuval.toDataURL('image/png').split(',')[1];
    }, [i, olcek]);
    fs.writeFileSync(path.join(hedefKlasor, `${onEk}-${String(i).padStart(2, '0')}.png`), Buffer.from(veri, 'base64'));
  }
  await sayfa.close();
  return adet;
}
