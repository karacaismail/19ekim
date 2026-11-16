/**
 * Kâğıttaki kazanç planı (kullanıcı kararı 16 Kasım 2026 Pazartesi).
 *
 * - Persona fark etmez. Herkes iş ortağıdır ve aynı koşullarla kazanır.
 * - Yalnız kadrolu uzman SGK'lı çalışandır. Maaş ve prim alır.
 * - İki katkı türü vardır: yalnız tanıştırır ve satışı kapatır. Satışı kapatan ürünü de gösterir ve kurulumu da yapar.
 *   Eski ortadaki “Ürünü de gösterir” seçeneği kalktı.
 * - Oranlar ciro üzerinden yüzdedir. K1, K2 ve K3 kotaları oranı sırayla artırır. Artış orana puan olarak eklenir.
 * - Yıllara yayılan komisyon 4 yıl sürer ve her yıl azalır.
 *
 * Bütün değerler okur tarafından değiştirilebilir. Değerler yalnız okurun tarayıcısında saklanır (ortak kayda gitmez).
 */
import type { Ayar, Seviye } from './satisOrtakligi';

export type KatkiTuru = 'tanistir' | 'kapatir';
export type Esik = number | null;
export interface KatkiPlani {
  /** Ciro üzerinden taban oran. */
  taban: number;
  /** K1, K2 ve K3 kotasına ulaşınca eklenen yüzde puan. */
  kotaArtis: [number, number, number];
  /** Getirilen müşterinin sonraki 1., 2., 3. ve 4. yıl cirosundan alınan oran. */
  gecmis: [number, number, number, number];
}
export interface KazancPlani {
  /** Yıllık ciro eşikleri. Kâğıtta yazmıyor, bu yüzden varsayılanı boştur. */
  kotaEsik: [Esik, Esik, Esik];
  tanistir: KatkiPlani;
  kapatir: KatkiPlani;
  /** Örnek hesapta kullanılan yıllık ciro. Gerçek satış değildir. */
  ornekCiro: number;
  kadrolu: { maas: number; kotaOrani: number; primOrani: Esik };
}

export const KATKI_ADI: Record<KatkiTuru, string> = { tanistir: 'Tanıştırma', kapatir: 'Satışı kapatma' };
/** Kadrolu uzmanın aylık maaş aralığı (kullanıcı kararı). */
export const MAAS_ARALIGI = [50_000, 60_000] as const;

export const KAZANC_VARSAYILAN: KazancPlani = {
  kotaEsik: [null, null, null],
  // Kâğıtta tanıştırma için kota artışı yazmıyor. Okur değeri kendisi girer.
  tanistir: { taban: 0.07, kotaArtis: [0, 0, 0], gecmis: [0.05, 0.02, 0.02, 0.01] },
  kapatir: { taban: 0.15, kotaArtis: [0.1, 0.07, 0.05], gecmis: [0.1, 0.07, 0.05, 0.02] },
  ornekCiro: 100_000,
  // Kullanıcının örneği: 50.000 ₺ maaşta kota 125.000 ₺ ciro olur.
  kadrolu: { maas: MAAS_ARALIGI[0], kotaOrani: 2.5, primOrani: null },
};

/** Ulaşılan kota sayısı ve geçerli oran. Eşikler sırayla aranır. Boş eşikten sonra kota sayılmaz. */
export function katkiOrani(plan: KazancPlani, tur: KatkiTuru, ciro: number): { oran: number; kota: 0 | 1 | 2 | 3 } {
  const p = plan[tur];
  let kota = 0;
  let oran = p.taban;
  for (const [i, esik] of plan.kotaEsik.entries()) {
    if (esik === null || ciro < esik) break;
    kota = i + 1;
    oran += p.kotaArtis[i];
  }
  return { oran: Math.round(oran * 10_000) / 10_000, kota: kota as 0 | 1 | 2 | 3 };
}

export function yillaraKazanc(plan: KazancPlani, tur: KatkiTuru, ciro: number) {
  return plan[tur].gecmis.map((oran, i) => ({ yil: i + 1, oran, tutar: Math.round(ciro * oran) }));
}

export const kadroluKota = (plan: KazancPlani) => Math.round(plan.kadrolu.maas * plan.kadrolu.kotaOrani);

/** Plan, rehberin eski hesap ayarına uygulanır. Böylece rehber metni de planın oranlarını kullanır. */
export function planliAyar(ayar: Ayar, plan: KazancPlani): Ayar {
  const tekle = (s: Seviye): Seviye => (s === 'B' ? 'C' : s);
  return {
    ...ayar,
    oran: { A: plan.tanistir.taban, B: plan.kapatir.taban, C: plan.kapatir.taban },
    oncuSeviye: tekle(ayar.oncuSeviye),
    cozumSeviye: tekle(ayar.cozumSeviye),
    elciSeviye: tekle(ayar.elciSeviye),
    maas: plan.kadrolu.maas,
    kotaCarpan: plan.kadrolu.kotaOrani,
    kotaEk: 0,
  };
}

const ORAN = (v: unknown, enCok = 1) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= enCok;
const ESIK = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0);

/** Tarayıcıdaki kaydı doğrular. Geçersiz alan varsayılanı alır. */
export function planOku(ham: unknown): KazancPlani {
  const v = structuredClone(KAZANC_VARSAYILAN);
  if (!ham || typeof ham !== 'object') return v;
  const h = ham as Partial<Record<keyof KazancPlani, unknown>>;
  if (Array.isArray(h.kotaEsik) && h.kotaEsik.length === 3 && h.kotaEsik.every(ESIK)) v.kotaEsik = h.kotaEsik as KazancPlani['kotaEsik'];
  for (const tur of ['tanistir', 'kapatir'] as const) {
    const k = h[tur] as Partial<KatkiPlani> | undefined;
    if (!k || typeof k !== 'object') continue;
    if (ORAN(k.taban)) v[tur].taban = k.taban!;
    if (Array.isArray(k.kotaArtis) && k.kotaArtis.length === 3 && k.kotaArtis.every((x) => ORAN(x))) v[tur].kotaArtis = k.kotaArtis as KatkiPlani['kotaArtis'];
    if (Array.isArray(k.gecmis) && k.gecmis.length === 4 && k.gecmis.every((x) => ORAN(x))) v[tur].gecmis = k.gecmis as KatkiPlani['gecmis'];
  }
  if (ESIK(h.ornekCiro) && h.ornekCiro !== null) v.ornekCiro = h.ornekCiro as number;
  const kd = h.kadrolu as Partial<KazancPlani['kadrolu']> | undefined;
  if (kd && typeof kd === 'object') {
    if (ESIK(kd.maas) && kd.maas !== null) v.kadrolu.maas = kd.maas!;
    if (ORAN(kd.kotaOrani, 100)) v.kadrolu.kotaOrani = kd.kotaOrani!;
    if (kd.primOrani === null || ORAN(kd.primOrani)) v.kadrolu.primOrani = kd.primOrani ?? null;
  }
  return v;
}
