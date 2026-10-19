/** Sayı ve para biçimleri (tr-TR). */

const integer = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });

/** “60.000 ₺” (kuruş yuvarlanır) */
export const tl = (value: number) => `${integer.format(Math.round(value))} ₺`;
/** “28.075,50 ₺” gibi kuruşlu tutar */
export const tlExact = (value: number) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ₺`;
export const num = (value: number) => decimal.format(value);
export const int = (value: number) => integer.format(Math.round(value));
/** 0,7 → “%70” */
export const pct = (ratio: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(ratio * 100)}`;
/** 1,25 → “1,25 ×” */
export const times = (value: number) => `${decimal.format(value)} ×`;
