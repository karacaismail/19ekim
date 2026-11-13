/** Tarih yardımcıları: ISO (YYYY-MM-DD) gün aritmetiği ve Türkçe biçim. Saat dilimi etkisi olmasın diye UTC. */

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAY = 86_400_000;

const toUtc = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);

export const addDays = (iso: string, days: number) => (days ? toIso(toUtc(iso) + days * DAY) : iso);
export const daysBetween = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / DAY);

/** Gün adları. `getUTCDay()` pazarı 0 verir, bu yüzden dizi pazarla başlar. */
const GUNLER_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/**
 * “1 Kasım 2026 Pazar”. Her tarihte gün adı yazar (kullanıcı kararı 13 Kasım 2026: “Her yerde eklensin”, tablo ve
 * grafik dahil). Cümlede tarihten sonra “günü” gelir: “1 Kasım 2026 Pazar günü başlar”. Ek tarihe değil “gün” sözüne
 * eklenir.
 */
export function longDate(iso: string) {
  const d = new Date(toUtc(iso));
  return `${d.getUTCDate()} ${MONTHS_TR[d.getUTCMonth()]} ${d.getUTCFullYear()} ${GUNLER_TR[d.getUTCDay()]}`;
}

/** “1 Kasım Pazar” */
export function shortDate(iso: string) {
  const d = new Date(toUtc(iso));
  return `${d.getUTCDate()} ${MONTHS_TR[d.getUTCMonth()]} ${GUNLER_TR[d.getUTCDay()]}`;
}

export const monthName = (iso: string) => MONTHS_TR[new Date(toUtc(iso)).getUTCMonth()];

/** Ayın ilk günü (ISO) */
export const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;

/** Bir sonraki ayın ilk günü */
export function nextMonth(iso: string) {
  const d = new Date(toUtc(iso));
  return toIso(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

const MONTH_PATTERN = new RegExp(`(\\d{1,2}) (${MONTHS_TR.join('|')})( (\\d{4}))?( (${GUNLER_TR.join('|')}))?(?![\\p{L}])`, 'gu');

/**
 * Metindeki “13 Kasım Cuma”, “1 Aralık 2026 Salı” gibi tarihleri `days` gün kaydırır (takvim parametresi değişince
 * metinler de tutarlı kalsın). Yılı yazılmamış tarihlerde plan penceresi esas alınır: Eylül–Aralık 2026, Ocak–Ağustos 2027.
 * Biçim korunur: gün adı yazılı tarihin gün adı da yeniden hesaplanır. Gün adı yazılmamış tarihe gün adı eklenmez,
 * çünkü tarihin ardındaki ek (“13 Kasım’da”) gün adına uymaz.
 */
export function shiftText(text: string, days: number) {
  if (!days) return text;
  return text.replace(MONTH_PATTERN, (_all, day: string, month: string, withYear: string | undefined, year: string | undefined, withDay: string | undefined) => {
    const m = MONTHS_TR.indexOf(month);
    const y = year ? Number(year) : m >= 8 ? 2026 : 2027;
    const iso = toIso(Date.UTC(y, m, Number(day)));
    const shifted = addDays(iso, days);
    const d = new Date(toUtc(shifted));
    const temel = `${d.getUTCDate()} ${MONTHS_TR[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ''}`;
    return withDay ? `${temel} ${GUNLER_TR[d.getUTCDay()]}` : temel;
  });
}
