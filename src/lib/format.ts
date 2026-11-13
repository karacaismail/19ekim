/** Sayı ve para biçimleri (tr-TR). */

// Mutlak değer biçimlenir, eksi işareti elle eklenir. Böylece:
// - Yarım değer iki yönde de sıfırdan uzağa gider (Intl yuvarlaması): 2,5 → 3, -2,5 → -3. `Math.round` eksi yarımı
//   sıfıra doğru yuvarladığı için kullanılmaz.
// - Sıfıra yuvarlanan eksi değer “-0” olmaz: işaret yalnız sonuçta sıfırdan farklı bir rakam varsa yazılır.
// `signDisplay: 'negative'` aynı sonucu verir ama eski tarayıcılarda (Safari 15.4 öncesi) kurucu hata atar.
const integer = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
const kurus = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const yuzde = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });

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
/** 0,7 → “%70”. Türkçede eksi işareti yüzde işaretinden önce gelir: -0,05 → “-%5”. */
export const pct = (ratio: number) => {
  if (!sayiMi(ratio)) return BILINMIYOR;
  const metin = isaretli(yuzde, ratio * 100);
  return metin.startsWith('-') ? `-%${metin.slice(1)}` : `%${metin}`;
};
/** 1,25 → “1,25 ×” */
export const times = (value: number) => (sayiMi(value) ? `${isaretli(decimal, value)} ×` : BILINMIYOR);
