/**
 * Üretilen üç dosyanın içerik denetimi. `npm run uret` sonunda çalışır. Tek başına da çalışır: `npm run denetle`.
 * Denetim gerçek çıktıyı okur: PDF metnini pdf.js ile, PPTX metnini slayt XML'inden alır.
 * Bir kural tutmazsa betik hata verir ve bütün düşen kuralları listeler.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const burasi = dirname(fileURLToPath(import.meta.url));
const hedef = resolve(burasi, '../../public/indir/segika');
const DOSYA = {
  kitapcik: resolve(hedef, 'segika-is-ortakligi-el-kitapcigi.pdf'),
  gorsel: resolve(hedef, 'segika-is-ortakligi-gorsel-sunum.pdf'),
  sunum: resolve(hedef, 'segika-is-ortakligi-sunum.pptx'),
};
const EN_COK_SAYFA = 12;

/** Karşılaştırma için metni sadeleştirir: tipografik kesme düz olur, boşluklar teke iner. */
const sade = (t) => t.replace(/[’‘]/g, "'").replace(/[ \s]+/g, ' ').trim();
const bosluksuz = (t) => sade(t).replace(/ /g, '').toLocaleLowerCase('tr-TR');
const geciyor = (metin, ifade) => bosluksuz(metin).includes(bosluksuz(ifade));

async function pdfOku(yol) {
  const pdfjs = await import(pathToFileURL(resolve(burasi, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
  const belge = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(yol)), useSystemFonts: false, verbosity: 0 }).promise;
  const sayfalar = [];
  for (let i = 1; i <= belge.numPages; i++) {
    const s = await belge.getPage(i);
    const icerik = await s.getTextContent();
    const ops = await s.getOperatorList();
    const resim = ops.fnArray.some((f) => f === pdfjs.OPS.paintImageXObject || f === pdfjs.OPS.paintInlineImageXObject);
    sayfalar.push({ metin: sade(icerik.items.map((x) => x.str).join(' ')), resim });
  }
  const ham = readFileSync(yol, 'latin1');
  const fontlar = [...new Set([...ham.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+_-]+)/g)].map((m) => m[1].replace(/^[A-Z]{6}\+/, '')))];
  const type3 = /\/Subtype\s*\/Type3/.test(ham);
  return { sayfalar, fontlar, type3 };
}

function pptxOku(yol) {
  const liste = execFileSync('unzip', ['-Z1', yol], { encoding: 'utf8' }).split('\n');
  const slaytAdlari = liste.filter((a) => /^ppt\/slides\/slide\d+\.xml$/.test(a))
    .sort((a, b) => Number(a.match(/(\d+)\.xml/)[1]) - Number(b.match(/(\d+)\.xml/)[1]));
  const sayfalar = slaytAdlari.map((a) => {
    const xml = execFileSync('unzip', ['-p', yol, a], { encoding: 'utf8', maxBuffer: 1 << 26 });
    const metin = sade([...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join(' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'"));
    const fontlar = [...new Set([...xml.matchAll(/typeface="([^"]+)"/g)].map((m) => m[1]))];
    return { metin, resim: /<p:pic>/.test(xml), fontlar };
  });
  return { sayfalar, fontlar: [...new Set(sayfalar.flatMap((s) => s.fontlar))] };
}

/** Üç dosyada da geçmesi ve geçmemesi gereken ifadeler. */
const YASAK = ['Kadrolu', 'insan kaynakları danışman', 'Bu davet mali müşavir', 'Dört ortaklık yolu', '25 çalışan', 'Fırsat'];
const ZORUNLU = [
  'kümülatif', 'Kümülatif, üst üste eklenen demektir.', '100 çalışan',
  'Şirketinize uygun planı seçin.', '6.250 TL', '5.400 TL', '8.900 TL',
  'Üç ortaklık yolu', 'Mevcut müşteri', "Segika'nın taahhütleri", 'Sizin taahhütleriniz',
  'otomatik', '4 yıla kadar', '%15', '%20', '%25', '%30',
  'Temmuz 2025',
];
const KAPAK = { kitapcik: 'İş ortaklığı el kitapçığı', gorsel: 'İş ortaklığı tanıtım sunumu', sunum: 'İş ortaklığı tanıtım sunumu' };

export async function denetle() {
  const hatalar = [];
  const ozet = [];
  const belgeler = {
    kitapcik: await pdfOku(DOSYA.kitapcik),
    gorsel: await pdfOku(DOSYA.gorsel),
    sunum: pptxOku(DOSYA.sunum),
  };
  for (const [ad, b] of Object.entries(belgeler)) {
    const tum = b.sayfalar.map((s) => s.metin).join(' ');
    const n = b.sayfalar.length;
    ozet.push(`${ad}: ${n} sayfa`);
    if (n > EN_COK_SAYFA) hatalar.push(`${ad}: ${n} sayfa var, en çok ${EN_COK_SAYFA} olabilir.`);
    for (const y of YASAK) if (geciyor(tum, y)) hatalar.push(`${ad}: "${y}" metinde geçmemeli.`);
    for (const z of ZORUNLU) if (!geciyor(tum, z)) hatalar.push(`${ad}: "${z}" metinde geçmeli.`);
    const ilk = b.sayfalar[0];
    if (!ilk || !geciyor(ilk.metin, KAPAK[ad])) hatalar.push(`${ad}: kapak sayfası yok. İlk sayfada "${KAPAK[ad]}" yazmalı.`);
    if (!ilk?.resim) hatalar.push(`${ad}: kapak sayfası yok. İlk sayfada kapak fotoğrafı olmalı.`);
    if (ad === 'sunum') {
      const yabanci = b.fontlar.filter((f) => f !== 'Arial');
      if (yabanci.length) hatalar.push(`sunum: yazı tipi yalnız Arial olmalı. Bulunan: ${yabanci.join(', ')}.`);
    } else {
      if (b.type3) hatalar.push(`${ad}: PDF içinde Type3 yazı tipi var.`);
      const yabanci = b.fontlar.filter((f) => !f.startsWith('Outfit-'));
      if (yabanci.length || !b.fontlar.length) hatalar.push(`${ad}: yazı tipi yalnız Outfit olmalı. Bulunan: ${b.fontlar.join(', ') || 'yok'}.`);
    }
  }
  const metin = readFileSync(resolve(burasi, 'metin.md'), 'utf8');
  for (const y of ['Kadrolu', 'kadrolu', 'İnsan kaynakları danışman', 'insan kaynakları danışman']) if (metin.includes(y)) hatalar.push(`metin.md: "${y}" geçmemeli.`);
  if (hatalar.length) throw new Error(`İçerik denetimi düştü (${hatalar.length} kural):\n- ${hatalar.join('\n- ')}`);
  console.log(`İçerik denetimi geçti. ${ozet.join(', ')}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  denetle().catch((e) => { console.error(e.message); process.exit(1); });
}
