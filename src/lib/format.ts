/** Sayı ve para biçimleri (tr-TR). */

// `signDisplay: 'negative'` eksi işaretini yalnız sıfırdan küçük sonuçta yazar. Sıfıra yuvarlanan eksi değer “-0” olmaz.
// Intl varsayılan yuvarlaması (halfExpand) yarım değeri sıfırdan uzağa götürür: 2,5 → 3, -2,5 → -3. `Math.round` eksi
// yarımı sıfıra doğru yuvarladığı için kullanılmaz.
const integer = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0, signDisplay: 'negative' });
const decimal = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2, signDisplay: 'negative' });
const kurus = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'negative' });
const yuzde = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1, signDisplay: 'never' });

/** Hesap bozulursa ekranda “NaN” ya da “∞” görünmez. Tablolarda boş değerin işareti olan “—” yazılır. */
export const BILINMIYOR = '—';
const sayiMi = (value: number) => Number.isFinite(value);

/** “60.000 ₺” (kuruş yuvarlanır) */
export const tl = (value: number) => (sayiMi(value) ? `${integer.format(value)} ₺` : BILINMIYOR);
/** “28.075,50 ₺” gibi kuruşlu tutar */
export const tlExact = (value: number) => (sayiMi(value) ? `${kurus.format(value)} ₺` : BILINMIYOR);
export const num = (value: number) => (sayiMi(value) ? decimal.format(value) : BILINMIYOR);
export const int = (value: number) => (sayiMi(value) ? integer.format(value) : BILINMIYOR);
/** 0,7 → “%70”. Türkçede eksi işareti yüzde işaretinden önce gelir: -0,05 → “-%5”. */
export const pct = (ratio: number) => {
  if (!sayiMi(ratio)) return BILINMIYOR;
  const metin = yuzde.format(ratio * 100);
  return `${ratio < 0 && metin !== '0' ? '-' : ''}%${metin}`;
};
/** 1,25 → “1,25 ×” */
export const times = (value: number) => (sayiMi(value) ? `${decimal.format(value)} ×` : BILINMIYOR);
