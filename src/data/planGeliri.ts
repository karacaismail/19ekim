import type { ScenarioId } from '../lib/scenario';
import { SECENEKLER, type SecenekId } from './istihdamV2';
import { buildModel, type Model } from './model';

/**
 * 2027 sayfalarının gelir kaynağı (kullanıcı kararı 14 Kasım 2026). Gelir öngörüsü, 2027 bütçesi ve İstihdam takvimi
 * v2 geliri gelir planından alır. Gelir planı “Parametreler” sayfasında kaydedilen ayarlarla hesaplanır. Bu yüzden ayar
 * değişince dört sayfa aynı geliri gösterir. Önceden üç sayfa varsayılan ayarları kullanıyordu.
 */

/** Her kadro seçeneği gelir planının bir senaryosuna dayanır. */
export const SECENEK_SENARYOSU: Record<SecenekId, ScenarioId> = { ekonomik: 'kotumser', medyan: 'medyan', guclu: 'iyimser' };

const YIL_SONU = '2027-12-31';

/**
 * Hesabın dayandığı model:
 * - `ayni`: kaydedilen ayarlar 2027’nin bütün aylarını kapsar.
 * - `uzatildi`: plan Aralık 2027’den önce biter. Bu durumda yalnız bitiş tarihi Aralık 2027 yapılır. Öteki ayarlar
 *   aynı kalır. Önceki ayların hesabı değişmez.
 * - `sonra`: senaryo 2027’den sonra başlar. 2027 geliri 0 ₺ sayılır.
 * - `varsayilan`: senaryo Aralık 2026’dan sonra başlar. Gelir öngörüsü Aralık 2026 verisine dayandığı için varsayılan
 *   ayarları kullanır.
 */
export type PlanDurumu = 'ayni' | 'uzatildi' | 'sonra' | 'varsayilan';

// Aynı model için sonuç bir kez hesaplanır. Bütçe sayfası hesabı bir çizimde birkaç kez ister. Model yeniden kurulmaz.
const planOnbellegi = new WeakMap<Model, { model: Model; durum: Exclude<PlanDurumu, 'varsayilan'> }>();
const gelirOnbellegi = new WeakMap<Model, Record<SecenekId, SecenekGeliri>>();

export function plan2027(model: Model): { model: Model; durum: Exclude<PlanDurumu, 'varsayilan'> } {
  const kayitli = planOnbellegi.get(model);
  if (kayitli) return kayitli;
  const aylar = model.revenue.months;
  const sonuc = aylar.some((m) => m.iso === '2027-12-01')
    ? { model, durum: 'ayni' as const }
    : (aylar[0]?.iso ?? '') > '2027-12-01'
      ? { model, durum: 'sonra' as const }
      : { model: buildModel({ ...model.params, simEndDate: YIL_SONU }), durum: 'uzatildi' as const };
  planOnbellegi.set(model, sonuc);
  return sonuc;
}

export interface SecenekGeliri {
  /** 2027 abonelik geliri (Ocak ile Aralık toplamı). */
  yil: number;
  /** Aralık 2027 aylık geliri. */
  aralik: number;
}

/** Üç kadro seçeneğinin 2027 geliri. Senaryo 2027’de başlıyorsa önceki aylar 0 ₺ sayılır. */
export function secenekGelirleri(model: Model): Record<SecenekId, SecenekGeliri> {
  const kayitli = gelirOnbellegi.get(model);
  if (kayitli) return kayitli;
  const r = plan2027(model).model.revenue;
  const aylar = r.months.map((m, i) => ({ iso: m.iso, i })).filter((m) => m.iso.startsWith('2027-'));
  const aralik = aylar.find((m) => m.iso === '2027-12-01');
  const sonuc = {} as Record<SecenekId, SecenekGeliri>;
  for (const s of SECENEKLER) {
    const g = r.byId[SECENEK_SENARYOSU[s]].gelir;
    sonuc[s] = { yil: aylar.reduce((t, m) => t + g[m.i], 0), aralik: aralik ? g[aralik.i] : 0 };
  }
  gelirOnbellegi.set(model, sonuc);
  return sonuc;
}
