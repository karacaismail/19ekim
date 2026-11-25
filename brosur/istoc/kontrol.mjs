// Kontrast ve metin denetimleri. Üretim betiği bu denetimleri her çalışmada yapar.
import { renk, kontrastCiftleri, yasakCiftler, yasakRenkler } from './tokenlar.mjs';

const parlaklik = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const kontrast = (a, b) => {
  const [x, y] = [parlaklik(a), parlaklik(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

export function kontrastDenetimi() {
  const dusuk = kontrastCiftleri.filter(([o, z]) => kontrast(renk[o], renk[z]) < 4.5);
  if (dusuk.length) throw new Error(`Düşük kontrast: ${dusuk.map(([o, z]) => `${o}/${z} ${kontrast(renk[o], renk[z]).toFixed(2)}`).join(', ')}`);
  const sari = kontrastCiftleri.filter(([o, z]) => yasakCiftler.some(([a, b]) => a === o && b === z));
  if (sari.length) throw new Error(`Sarı açık zeminde metin olamaz: ${sari.map((c) => c.join('/')).join(', ')}`);
  return kontrastCiftleri.length;
}

/** iStoc turuncusu hiçbir tokende ve hiçbir üretilen belgede bulunmaz. */
export function renkDenetimi(...metinler) {
  const tokende = Object.entries(renk).filter(([, v]) => yasakRenkler.includes(v.toLowerCase())).map(([k, v]) => `${k} ${v}`);
  const belgede = yasakRenkler.filter((r) => metinler.some((m) => m.toLowerCase().includes(r)));
  return [...tokende.map((t) => `turuncu token: ${t}`), ...belgede.map((r) => `belgede turuncu renk: ${r}`)];
}

// Pazarlama dili ve öteki markanın izi bu belgelere girmez. İSTOÇ bir ticaret merkezidir, bu markayla ilgisi yoktur.
// Belgelerin asıl markası Thoptan'dır. iStoc hiçbir cümlenin başında ana özne olmaz.
// Tek izinli kullanım “Kazanç garantisi değildir.” notudur (kullanıcı kararı 25 Kasım 2026 Çarşamba). Söz veren her öteki kullanım yasaktır.
const YASAK = [
  [/fırsat/i, '“fırsat” kelimesi'], [/kaçırma/i, '“kaçırmayın” kalıbı'], [/eşsiz/i, '“eşsiz” kelimesi'], [/\bhemen\b/i, '“hemen” kelimesi'],
  [/inanılmaz/i, '“inanılmaz” kelimesi'], [/garanti(?!si değildir\.)/i, '“garanti” kelimesi'], [/!/, 'ünlem'], [/segika/i, 'öteki marka adı'],
  [/;/, 'noktalı virgül'], [/—|–/, 'uzun çizgi'], [/→|←|⇒/, 'ok işareti'], [/·/, 'orta nokta'],
  [/İSTOÇ|İstoç|ISTOÇ|istoç/, '“İSTOÇ” adı'], [/(^|[.?]\s+)iStoc(?=[\s’'])/m, 'iStoc cümle öznesi'],
  [/m[ae]kt[ae]d[ıi]r/i, '“-mektedir” kalıbı'], [/\d{1,2}[./]\d{1,2}[./]\d{2,4}/, 'sayıyla yazılmış tarih'],
];

export function metinDenetimi(metin) {
  return YASAK.filter(([re]) => re.test(metin)).map(([re, ad]) => `${ad} bulundu: "${metin.match(re)[0]}" (${metin.slice(Math.max(0, metin.search(re) - 30), metin.search(re) + 30).replace(/\s+/g, ' ')})`);
}

/**
 * Belgedeki her tam cümle `metin.md` içinde de bulunmalıdır. Böylece denetlenen düz metin ile belge ayrışmaz.
 * Tam cümle nokta ya da soru işaretiyle biten, en az üç kelimelik parçadır.
 */
export function metinEslesmesi(belgeMetni, kaynakMetni) {
  const n = (s) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  const kaynak = n(kaynakMetni.replace(/[*#|]/g, ' '));
  const eksik = new Set();
  for (const satir of belgeMetni.split('\n')) {
    for (const parca of satir.split(/(?<=[.?])\s+/)) {
      const t = n(parca);
      if (/[.?]$/.test(t) && t.split(' ').length > 2 && !kaynak.includes(t)) eksik.add(t);
    }
  }
  return [...eksik];
}
