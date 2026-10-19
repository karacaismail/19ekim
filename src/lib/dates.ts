/** Tarih yardımcıları: ISO (YYYY-MM-DD) gün aritmetiği ve Türkçe biçim. Saat dilimi etkisi olmasın diye UTC. */

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAY = 86_400_000;

const toUtc = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);

export const addDays = (iso: string, days: number) => (days ? toIso(toUtc(iso) + days * DAY) : iso);
export const daysBetween = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / DAY);

/** “1 Kasım 2026” */
export function longDate(iso: string) {
  const d = new Date(toUtc(iso));
  return `${d.getUTCDate()} ${MONTHS_TR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** “1 Kasım” */
export function shortDate(iso: string) {
  const d = new Date(toUtc(iso));
  return `${d.getUTCDate()} ${MONTHS_TR[d.getUTCMonth()]}`;
}

export const monthName = (iso: string) => MONTHS_TR[new Date(toUtc(iso)).getUTCMonth()];

/** Ayın ilk günü (ISO) */
export const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;

/** Bir sonraki ayın ilk günü */
export function nextMonth(iso: string) {
  const d = new Date(toUtc(iso));
  return toIso(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

const MONTH_PATTERN = new RegExp(`(\\d{1,2}) (${MONTHS_TR.join('|')})( (\\d{4}))?`, 'g');

/**
 * Metindeki “13 Kasım”, “1 Aralık 2026” gibi tarihleri `days` gün kaydırır (takvim parametresi değişince
 * metinler de tutarlı kalsın). Yılı yazılmamış tarihlerde plan penceresi esas alınır: Eylül–Aralık 2026, Ocak–Ağustos 2027.
 */
export function shiftText(text: string, days: number) {
  if (!days) return text;
  return text.replace(MONTH_PATTERN, (_all, day: string, month: string, withYear: string | undefined, year: string | undefined) => {
    const m = MONTHS_TR.indexOf(month);
    const y = year ? Number(year) : m >= 8 ? 2026 : 2027;
    const iso = toIso(Date.UTC(y, m, Number(day)));
    const shifted = addDays(iso, days);
    return withYear ? longDate(shifted) : shortDate(shifted);
  });
}
