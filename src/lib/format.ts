/** Sayı ve para biçimleri (tr-TR). */

// Mutlak değer biçimlenir, eksi işareti elle eklenir. Böylece:
// - Yarım değer iki yönde de sıfırdan uzağa gider (Intl yuvarlaması): 2,5 → 3, -2,5 → -3. `Math.round` eksi yarımı
//   sıfıra doğru yuvarladığı için kullanılmaz.
// - Sıfıra yuvarlanan eksi değer “-0” olmaz: işaret yalnız sonuçta sıfırdan farklı bir rakam varsa yazılır.
// `signDisplay: 'negative'` aynı sonucu verir ama eski tarayıcılarda (Safari 15.4 öncesi) kurucu hata atar.
// Sitenin bütün sayı biçimleri bu dosyadadır. Başka dosyada `Intl.NumberFormat` ya da sayının `toLocaleString` biçimi
// kullanılmaz (tests/bicim-ortak.spec.ts bunu denetler).
const bicimler = new Map<string, Intl.NumberFormat>();
const bicimi = (enCok: number, enAz = 0) => {
  const anahtar = `${enAz}:${enCok}`;
  let b = bicimler.get(anahtar);
  if (!b) {
    b = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: enAz, maximumFractionDigits: enCok });
    bicimler.set(anahtar, b);
  }
  return b;
};
const integer = bicimi(0);
const decimal = bicimi(2);
const kurus = bicimi(2, 2);

/** Hesap bozulursa ekranda “NaN” ya da “∞” görünmez. Tablolarda boş değerin işareti olan “—” yazılır. */
export const BILINMIYOR = '—';

const isaretli = (bicim: Intl.NumberFormat, value: number) => {
  const metin = bicim.format(Math.abs(value));
  return value < 0 && /[1-9]/.test(metin) ? `-${metin}` : metin;
};
const sayiMi = (value: number) => Number.isFinite(value);

/** “60.000 ₺” (kuruş yuvarlanır) */
export const tl = (value: number) => (sayiMi(value) ? `${isaretli(integer, value)} ₺` : BILINMIYOR);
/** “28.075,50 ₺” gibi kuruşlu tutar */
export const tlExact = (value: number) => (sayiMi(value) ? `${isaretli(kurus, value)} ₺` : BILINMIYOR);
export const num = (value: number) => (sayiMi(value) ? isaretli(decimal, value) : BILINMIYOR);
export const int = (value: number) => (sayiMi(value) ? isaretli(integer, value) : BILINMIYOR);
/**
 * Ondalık hanesi verilen sayı biçimi: `sayiBicimi(1)(2.25)` → “2,3”. Dönen işlev tek bağımsız değişken alır. Bu yüzden
 * `.map(sayiBicimi(1))` güvenlidir: dizinin sıra numarası haneyi değiştirmez.
 */
export const sayiBicimi = (ondalik: number) => {
  const b = bicimi(ondalik);
  return (value: number) => (sayiMi(value) ? isaretli(b, value) : BILINMIYOR);
};
/**
 * Ondalık hanesi verilen yüzde biçimi: `yuzdeBicimi(0)(0.875)` → “%88”. Türkçede eksi işareti yüzde işaretinden önce
 * gelir: -0,05 → “-%5”.
 */
export const yuzdeBicimi = (ondalik: number) => {
  const b = bicimi(ondalik);
  return (ratio: number) => {
    if (!sayiMi(ratio)) return BILINMIYOR;
    const metin = isaretli(b, ratio * 100);
    return metin.startsWith('-') ? `-%${metin.slice(1)}` : `%${metin}`;
  };
};
/** 0,7 → “%70”, 0,125 → “%12,5”. */
export const pct = yuzdeBicimi(1);
/** “60.000 ₺” ile aynı, ama sayı ile ₺ arasında bölünmeyen boşluk vardır. Dar hücrede “₺” alt satıra düşmez. */
export const tlBitisik = (value: number) => (sayiMi(value) ? `${isaretli(integer, value)}\u00a0₺` : BILINMIYOR);
const birOndalik = bicimi(1);
/** 68.205.762 → “68,2 milyon ₺” */
export const milyon = (value: number) => (sayiMi(value) ? `${isaretli(birOndalik, value / 1_000_000)} milyon ₺` : BILINMIYOR);
/** 3.990,5 → “3.990,5 €” (en çok 2 ondalık hane) */
export const avro = (value: number) => (sayiMi(value) ? `${isaretli(decimal, value)} €` : BILINMIYOR);
/** 1,25 → “1,25 ×” */
export const times = (value: number) => (sayiMi(value) ? `${isaretli(decimal, value)} ×` : BILINMIYOR);
/**
 * Ondalık hanesi sabit sayı biçimi: `sabitOndalikBicimi(1)(20)` → “20,0”. Sayı her zaman bu kadar ondalık haneyle
 * yazılır. Dönen işlev tek bağımsız değişken alır.
 */
export const sabitOndalikBicimi = (ondalik: number) => {
  const b = bicimi(ondalik, ondalik);
  return (value: number) => (sayiMi(value) ? isaretli(b, value) : BILINMIYOR);
};
const kisaBicim = new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 });
/** Grafik ekseni için kısa sayı: 1.200.000 → “1,2 Mn”, 45.000 → “45 B”. En çok 1 ondalık hane yazılır. */
export const kisaSayi = (value: number) => (sayiMi(value) ? isaretli(kisaBicim, value) : BILINMIYOR);
