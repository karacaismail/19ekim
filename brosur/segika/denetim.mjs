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
/** 25 Kasım 2026 Çarşamba günkü toplantıdan sonra üç belgede de 11 sayfa vardır. */
const SAYFA = 11;

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
const YASAK = ['Kadrolu', 'insan kaynakları danışman', 'Bu davet mali müşavir', 'Dört ortaklık yolu', '25 çalışan', 'Fırsat',
  "Fiyatlar Segika'nın 24 Kasım 2026 Salı günkü fiyatlarıdır.",
  'ETA programlarıyla birlikte çalışır', 'Bu bağlantı Teşvik ve Otomasyon paketindedir.', 'Luca Mikro ETA',
  // 25 Kasım 2026 Çarşamba günkü toplantı kararıyla kaldırılan cümleler. Bu cümleler geri gelemez.
  'İş kazası bildirimi',
  "İş kazası SGK'ya 3 iş günü içinde bildirilmelidir. Segika bu süreyi takip eder ve e-postayla hatırlatır.",
  'Üç ortaklık yolu', 'Mevcut müşteri', 'Yılda 3 tavsiye, 6 ay ücretsiz Segika.',
  'Yılda 3 uygun tavsiye ile 6 ay ücretsiz kullanım', 'Geçerli koşulu müşteri sorumlusundan yazılı isteyin.',
  "Segika'yı zaten kullanan firma", 'Tanıdığı bir firmayı Segika ile tanıştırır.',
  'Uygun her tavsiye için 2 ay ücretsiz kullanım alırsınız.', 'Tavsiye ettiğiniz firma da 1 ay ücretsiz kullanır.',
  'Ödülünüz nakit değildir. Ödülünüz ücretsiz kullanımdır.',
  'Meslek kuralınızı doğrulatın', 'Hukuk danışmanı ortaklığın uygunluğunu inceler.',
  'Mali müşavirler meslek kurallarına bağlıdır.', 'Hukuk danışmanı komisyonun uygunluğunu inceler.',
  'Uygunluk yazılmadan müşteriye ortaklıktan söz etmeyin.', 'Mali müşavir, uygunluk yazılmadan müşteriye ortaklıktan söz etmez.',
  'Bu yol hukuk görüşünü bekliyor.', 'Toptan fiyat bantları yazılı anlaşmada belirlenir.',
  'Bu kabul edilmeden müşteriye teklif vermeyin.',
  'Kesin değerler yazılı anlaşmada belirlenir.', 'Kesin kural yazılı anlaşmada belirlenir.',
  'Kesin eşikler yazılı anlaşmada belirlenir.', 'Ödeme günleri yazılı anlaşmada yer alır.',
  'Bu taahhütler yazılı anlaşmanın özüdür.', 'Taahhütler, imzalanan anlaşmayla bağlayıcı olur.',
  'Bu belge tek başına sözleşme değildir.', 'Yazılı anlaşmayı inceleyin.', 'Bu belge bir sözleşme değildir.',
  'Koşullar yazılı anlaşmada kesinleşir.', 'her yıl 8 saat ücretsiz eğitim', 'yılda 8 saat ücretsiz eğitim',
  'Siz müşterinin SGK ya da bordro şifresini istemezsiniz.'];
/**
 * Toplantı kararıyla bu konular belgelerde hiç geçmez: hukuk, meslek kuralı, yazılı anlaşma, imza, sözleşme,
 * bağlayıcılık, şifre ve mevcut müşteri ödülü. Kelime başı aranır. Böylece kelimenin bütün ekli biçimleri yakalanır.
 */
const YASAK_KELIME = [/üst üste eklenen/, /hukuk/, /meslek kural/, /yazılı anlaşma/, /imza/, /sözleşme/, /bağlayıcı/, /şifre/, /tavsiye/,
  /ücretsiz kullanım/, /müşteri sorumlusu/]
  .map((r) => new RegExp(`(^|[^\\p{L}])${r.source}`, 'u'));
const kelimeBul = (metin) => YASAK_KELIME.filter((r) => r.test(sade(metin).toLocaleLowerCase('tr-TR'))).map((r) => r.source.replace(/^.*\)/, ''));
/** Basamağın eski kısa adları okura görünmez. Basamaklar "1. seviye" ile "4. seviye" arasında adlandırılır. */
const ESKI_BASAMAK = /(^|[^0-9A-Za-zÇĞİÖŞÜçğıöşü])K[1-3](?![0-9])/;
const ZORUNLU = [
  'kümülatif', '100 çalışan',
  'Şirketinize uygun planı seçin.', '6.250 TL', '5.400 TL', '8.900 TL',
  'İki ortaklık yolu', "Segika'nın taahhütleri", 'Sizin taahhütleriniz',
  'otomatik', '4 yıla kadar', '%15', '%20', '%25', '%30',
  'Temmuz 2025',
  '1. seviye', '2. seviye', '3. seviye', '4. seviye',
  'Fiyatlar 100 çalışan için aylıktır ve KDV hariçtir. Güncel fiyatı Segika\'dan yazılı isteyin.',
  'Segika bugünkü planda yılda 2 saat ücretsiz eğitim verir.',
  'Ücretsiz eğitimin fazlası ücretlidir. Bugünkü planda ek eğitimin bir saati 1.500 TL tutar.',
  'İlk görüşmeden ilk ödemeye kadar 5 adım vardır.',
  '30.000 TL cironun altında pay oluşmaz',
  'Yıllara yayılan tutar örnektir. Kazanılmış hak sayılmaz.',
  'Yıllık paketin bütün bedeli satışın yapıldığı ayın cirosuna yazılır.',
  '1. işveren sizi 3. seviyeye taşır. 2. işveren sizi 4. seviyeye taşır.',
];
/** Çözüm ortağının eğitim cümlesi yalnız el kitapçığında yazar. Süre 25 Kasım 2026 Çarşamba günü 2 saat oldu. */
const EGITIM_CUMLESI = 'Bugünkü planda Segika size ve destek personelinize her yıl 2 saat ücretsiz eğitim verir.';
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
    if (n !== SAYFA) hatalar.push(`${ad}: ${n} sayfa var, ${SAYFA} sayfa olmalı.`);
    for (const y of YASAK) if (geciyor(tum, y)) hatalar.push(`${ad}: "${y}" metinde geçmemeli.`);
    for (const k of kelimeBul(tum)) hatalar.push(`${ad}: "${k}" ile başlayan kelime metinde geçmemeli.`);
    for (const z of ZORUNLU) if (!geciyor(tum, z)) hatalar.push(`${ad}: "${z}" metinde geçmeli.`);
    if (ad === 'kitapcik') for (const z of [EGITIM_CUMLESI]) if (!geciyor(tum, z)) hatalar.push(`kitapcik: "${z}" metinde geçmeli.`);
    b.sayfalar.forEach((s, i) => { const m = s.metin.match(ESKI_BASAMAK); if (m) hatalar.push(`${ad}: ${i + 1}. sayfada eski basamak adı "${m[0].trim()}" geçiyor. "1. seviye" gibi yazın.`); });
    const yil = b.sayfalar.find((s) => geciyor(s.metin, 'Siz buradasınız'));
    if (yil && geciyor(yil.metin, '%25 olur')) hatalar.push(`${ad}: yıllık sayfada iki farklı oran var. Örnek yalnız %30 oranını göstermeli.`);
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
  for (const y of ['Kadrolu', 'kadrolu', 'İnsan kaynakları danışman', 'insan kaynakları danışman', 'ETA programlarıyla birlikte çalışır']) if (metin.includes(y)) hatalar.push(`metin.md: "${y}" geçmemeli.`);
  for (const k of kelimeBul(metin)) hatalar.push(`metin.md: "${k}" ile başlayan kelime geçmemeli.`);
  for (const y of YASAK.slice(YASAK.indexOf('İş kazası bildirimi'))) if (geciyor(metin, y)) hatalar.push(`metin.md: "${y}" geçmemeli.`);
  if (ESKI_BASAMAK.test(metin)) hatalar.push('metin.md: eski basamak adı (K1, K2, K3) geçmemeli.');
  if (hatalar.length) throw new Error(`İçerik denetimi düştü (${hatalar.length} kural):\n- ${hatalar.join('\n- ')}`);
  console.log(`İçerik denetimi geçti. ${ozet.join(', ')}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  denetle().catch((e) => { console.error(e.message); process.exit(1); });
}
