/**
 * Kâğıttaki kazanç planı (kullanıcı kararı 16 Kasım 2026 Pazartesi).
 *
 * - Persona fark etmez. Herkes iş ortağıdır ve aynı koşullarla kazanır.
 * - Yalnız kadrolu uzman SGK'lı çalışandır. Maaş ve prim alır.
 * - Üç katkı türü vardır: tanıştırır, satışı kapatır ve onboarding yapar. Satışı kapatan ürünü de gösterir.
 *   Onboarding, yeni müşterinin kurulumu ve ilk eğitimidir. Onboarding yapanın oranları ayrıdır (kullanıcı kararı 17 Kasım 2026 Salı).
 *   Eski ortadaki “Ürünü de gösterir” seçeneği kalktı.
 * - Oranlar ciro üzerinden yüzdedir. K1, K2 ve K3 aylık ciro kotalarıdır. Kotalar oranı sırayla artırır. Artış orana puan olarak eklenir.
 * - Yıllara yayılan komisyon 4 yıl sürer ve her yıl azalır.
 *
 * Bütün değerler okur tarafından değiştirilebilir. Değerler yalnız okurun tarayıcısında saklanır (ortak kayda gitmez).
 */
import type { Ayar, Marka, Seviye } from './satisOrtakligi';
import { num } from '../lib/format';

export type KatkiTuru = 'tanistir' | 'kapatir' | 'onboard';
/** Kâğıttaki ay aralıkları. Satış ayından sonraki 12 aylık dönemler: 13–24, 25–36, 37–48 ve 49–60. ay. */
export const donemAdi = (i: number) => `${12 * (i + 1) + 1}. ay ile ${12 * (i + 2)}. ay arası`;
export const KATKI_TURLERI = ['tanistir', 'kapatir', 'onboard'] as const;
export type Esik = number | null;
export interface KatkiPlani {
  /** Aylık ciro eşikleri. Her katkı türünün eşiği ayrıdır. Kâğıtta yazmıyor, bu yüzden varsayılanı boştur. */
  kotaEsik: [Esik, Esik, Esik];
  /** Ciro üzerinden taban oran. */
  taban: number;
  /** K1, K2 ve K3 kotasına ulaşınca eklenen yüzde puan. */
  kotaArtis: [number, number, number];
  /** Satış yılı 1. yıldır ve taban oranı kullanır. Bu liste müşterinin 2., 3., 4. ve 5. yıl cirosundan alınan orandır. */
  gecmis: [number, number, number, number];
}
export interface KazancPlani {
  tanistir: KatkiPlani;
  kapatir: KatkiPlani;
  onboard: KatkiPlani;
  /** Örnek hesapta kullanılan aylık ciro. Gerçek satış değildir. */
  ornekCiro: number;
  kadrolu: { maas: number; kotaOrani: number; primOrani: Esik };
  /** Tanıştıran ile satışı kapatan farklı kişiyse pay bölüşmesi. Yönetici seçer (kullanıcı kararı 17 Kasım 2026). */
  paylasim: { sureAy: SureAy; ilkSatis: Bolusme; yillar: Bolusme; kota: Bolusme };
  /** Yöneticinin kalıcı kural adayı olarak işaretlediği değerlerin kimlikleri (`kuralListesi`). */
  kalici: string[];
}

/** “dus”: tanıştıranın payı kapatanın payından düşülür. Şirketi zarardan korur. “tam”: şirket ikisine de tam öder. */
export type Bolusme = 'dus' | 'tam';
export const BOLUSME_ADI: Record<Bolusme, string> = {
  dus: "Ahmet'in payı Mehmet'in payından düşülür",
  tam: 'Şirket ikisine de tam öder',
};
export const BOLUSME_SORUSU = { ilkSatis: 'İlk satışta pay', yillar: 'Sonraki 4 yılın payı', kota: 'Kota artışında pay' } as const;

/** Tanıştırmanın geçerlilik süresi için seçenekler (ay). */
export const SURE_SECENEKLERI = [1, 2, 3, 4, 5, 6, 8, 10, 12] as const;
export type SureAy = (typeof SURE_SECENEKLERI)[number];

export const KATKI_ADI: Record<KatkiTuru, string> = { tanistir: 'Tanıştırma', kapatir: 'Satışı kapatma', onboard: 'Onboarding' };
/** Kadrolu uzmanın aylık maaş aralığı (kullanıcı kararı). */
export const MAAS_ARALIGI = [50_000, 60_000] as const;

export const KAZANC_VARSAYILAN: KazancPlani = {
  // Kullanıcı kararı 17 Kasım 2026 Salı: tanıştırmanın varsayılanları. Bunlar kalıcı kural değildir.
  tanistir: { kotaEsik: [30_000, 60_000, 100_000], taban: 0.07, kotaArtis: [0.1, 0.07, 0.05], gecmis: [0.05, 0.025, 0, 0] },
  // Kullanıcı kararı 17 Kasım 2026 Salı: satış yılı 1. yıldır ve %15'tir. 2. yıl %10, 3. yıl %7, 4. yıl %5 olur. Eski %2 kalktı.
  kapatir: { kotaEsik: [null, null, null], taban: 0.15, kotaArtis: [0.1, 0.07, 0.05], gecmis: [0.1, 0.07, 0.05, 0] },
  // Onboarding oranları kâğıtta yok. Uydurulmaz. Yönetici değerleri girer.
  onboard: { kotaEsik: [null, null, null], taban: 0, kotaArtis: [0, 0, 0], gecmis: [0, 0, 0, 0] },
  // Kâğıttaki örnek: aylık ciro 40.000 ₺ (kullanıcı kararı 17 Kasım 2026 Salı).
  ornekCiro: 40_000,
  // Kullanıcının örneği: 50.000 ₺ maaşta kota 125.000 ₺ ciro olur.
  kadrolu: { maas: MAAS_ARALIGI[0], kotaOrani: 2.5, primOrani: null },
  // Her soruda varsayılan, şirketi zarardan koruyan düşme seçeneğidir.
  paylasim: { sureAy: 6, ilkSatis: 'dus', yillar: 'dus', kota: 'dus' },
  kalici: [],
};

/** Ulaşılan kota sayısı ve geçerli oran. Eşikler sırayla aranır. Boş eşikten sonra kota sayılmaz. */
export function katkiOrani(plan: KazancPlani, tur: KatkiTuru, ciro: number): { oran: number; kota: 0 | 1 | 2 | 3 } {
  const p = plan[tur];
  let kota = 0;
  let oran = p.taban;
  for (const [i, esik] of p.kotaEsik.entries()) {
    if (esik === null || ciro < esik) break;
    kota = i + 1;
    oran += p.kotaArtis[i];
  }
  return { oran: Math.round(oran * 10_000) / 10_000, kota: kota as 0 | 1 | 2 | 3 };
}

export function yillaraKazanc(plan: KazancPlani, tur: KatkiTuru, ciro: number) {
  return plan[tur].gecmis.map((oran, i) => ({ yil: i + 2, donem: donemAdi(i), oran, tutar: Math.round(ciro * oran) }));
}

/**
 * Kâğıttaki örnek hesap (kullanıcı kararı 17 Kasım 2026 Salı). Aylık ciro sabit kabul edilir.
 * Cari ay ve 1. ay ile 12. ay arası satırları bir aylık ciroyla yazılır. Sonraki dönemler 12 aylık ciroyla yazılır.
 * K1 eşiği boşsa örnek, kâğıttaki gibi K1'in geçildiğini kabul eder. Eşik doluysa ciro eşikle karşılaştırılır.
 */
export function ornekHesap(plan: KazancPlani, tur: KatkiTuru) {
  const p = plan[tur];
  const ciro = plan.ornekCiro;
  const k1 = p.kotaEsik[0];
  const k1Gecti = k1 === null || ciro >= k1;
  const satirlar = [
    { ad: 'Cari ay', oran: p.taban, ciro, tutar: Math.round(ciro * p.taban) },
    { ad: 'Cari ay kota (K1)', oran: p.kotaArtis[0], ciro, tutar: k1Gecti ? Math.round(ciro * p.kotaArtis[0]) : 0 },
    { ad: '1. ay ile 12. ay arası', oran: p.taban, ciro, tutar: Math.round(ciro * p.taban) },
    ...p.gecmis.map((g, i) => ({ ad: donemAdi(i), oran: g, ciro: ciro * 12, tutar: Math.round(ciro * 12 * g) })),
  ].filter((s) => s.oran > 0);
  return { satirlar, k1Gecti, k1Bos: k1 === null, toplam: satirlar.reduce((t, s) => t + s.tutar, 0) };
}

const yuvarla = (n: number) => Math.max(0, Math.round(n * 10_000) / 10_000);

/**
 * Tanıştıran ile satışı kapatan farklı kişiyse pay bölüşmesi. Örnekte Ahmet tanıştırır, Mehmet satışı kapatır.
 * Üç soru ayrı seçilir. İlk satışta taban oran, kota artışı ve sonraki 4 yılın oranı.
 * “dus” seçilirse Ahmet'in oranı Mehmet'in oranından düşülür. “tam” seçilirse şirket ikisine de tam öder.
 * Her kişi kendi katkı türünün kota eşiğini kullanır.
 */
export function paylasim(plan: KazancPlani, ciro: number) {
  const b = plan.paylasim;
  const t = katkiOrani(plan, 'tanistir', ciro).oran;
  const k = katkiOrani(plan, 'kapatir', ciro).oran;
  const tArtis = t - plan.tanistir.taban;
  const kArtis = k - plan.kapatir.taban;
  const tanistiranOran = yuvarla(t);
  const kapatanOran = yuvarla(
    plan.kapatir.taban - (b.ilkSatis === 'dus' ? plan.tanistir.taban : 0) + kArtis - (b.kota === 'dus' ? tArtis : 0),
  );
  const tanistiran = Math.round(ciro * tanistiranOran);
  const kapatan = Math.round(ciro * kapatanOran);
  return {
    tanistiranOran, kapatanOran, tanistiran, kapatan, toplam: tanistiran + kapatan,
    yillar: plan.tanistir.gecmis.map((g, i) => ({
      yil: i + 2, donem: donemAdi(i), tanistiran: g, kapatan: yuvarla(plan.kapatir.gecmis[i] - (b.yillar === 'dus' ? g : 0)),
    })),
  };
}

const yuzdeMetni = (n: number) => `%${num(Math.round(n * 1000) / 10)}`;
const tlMetni = (n: number) => `${num(n)} ₺`;

/** Kalıcı kural adayı olabilecek bütün değerler. Ad, ekrandaki kutu adıyla aynıdır. */
export function kuralListesi(plan: KazancPlani) {
  type Kural = { id: string; ad: string; deger: number | string | null; gosterim: string };
  const oran = (id: string, ad: string, v: number | null): Kural => ({ id, ad, deger: v, gosterim: v === null ? 'Belirlenmedi' : yuzdeMetni(v) });
  const para = (id: string, ad: string, v: number | null): Kural => ({ id, ad, deger: v, gosterim: v === null ? 'Belirlenmedi' : tlMetni(v) });
  const liste: Kural[] = [];
  for (const tur of KATKI_TURLERI) {
    const ad = KATKI_ADI[tur];
    const p = plan[tur];
    liste.push(oran(`${tur}.taban`, `${ad} taban oranı`, p.taban));
    p.kotaEsik.forEach((e, i) => liste.push(para(`${tur}.kotaEsik.${i}`, `${ad} K${i + 1} ciro eşiği`, e)));
    p.kotaArtis.forEach((a, i) => liste.push(oran(`${tur}.kotaArtis.${i}`, `${ad} K${i + 1} artışı`, a)));
    p.gecmis.forEach((g, i) => liste.push(oran(`${tur}.gecmis.${i}`, `${ad} ${donemAdi(i)} komisyonu`, g)));
  }
  liste.push({ id: 'paylasim.sureAy', ad: 'Tanıştırmanın geçerlilik süresi', deger: plan.paylasim.sureAy, gosterim: `${plan.paylasim.sureAy} ay` });
  for (const soru of ['ilkSatis', 'yillar', 'kota'] as const) {
    const v = plan.paylasim[soru];
    liste.push({ id: `paylasim.${soru}`, ad: BOLUSME_SORUSU[soru], deger: v, gosterim: BOLUSME_ADI[v] });
  }
  liste.push(para('kadrolu.maas', 'Aylık maaş', plan.kadrolu.maas));
  liste.push(oran('kadrolu.kotaOrani', 'Kota oranı', plan.kadrolu.kotaOrani));
  liste.push(oran('kadrolu.primOrani', 'Kota üstü prim oranı', plan.kadrolu.primOrani));
  return liste;
}

const GORUNUM_ADI: Record<Marka, string> = { istoc: 'iStoc', segika: 'Segika' };
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/**
 * Yöneticinin işaretlediği kalıcı kuralların JSON biçimi. Yalnız okurun tarayıcısında oluşur, sunucuya gitmez.
 * Kullanıcı bu JSON'u ajana verir. Ajan her `id` için seçenek kutusunu kaldırır ve değeri sabit metin olarak yazar.
 */
export function kaliciJson(plan: KazancPlani, proje: Marka, simdi: Date) {
  const iki = (n: number) => String(n).padStart(2, '0');
  const tarih = `${simdi.getFullYear()}-${iki(simdi.getMonth() + 1)}-${iki(simdi.getDate())}`;
  const gorunum = GORUNUM_ADI[proje];
  const secili = new Set(plan.kalici);
  return {
    tur: 'kazanc-plani-kalici-kurallar',
    surum: 2,
    proje,
    gorunum,
    tarih,
    tarihMetni: `${simdi.getDate()} ${AYLAR[simdi.getMonth()]} ${simdi.getFullYear()} ${GUNLER[simdi.getDay()]}`,
    kurallar: kuralListesi(plan).filter((k) => secili.has(k.id)).map((k) => ({ ...k, gorunum, tarih })),
    // Kullanıcı kararı 17 Kasım 2026 Salı: JSON, işaretli olmasa da bütün güncel değerleri içerir.
    degerler: kuralListesi(plan).map((k) => ({ ...k, kalici: secili.has(k.id) })),
  };
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
  const esikMi = (e: unknown): e is KatkiPlani['kotaEsik'] => Array.isArray(e) && e.length === 3 && e.every(ESIK);
  // Eski kayıtta tek eşik listesi vardı. Bu liste iki katkı türüne de geçer.
  const eskiEsik = (ham as { kotaEsik?: unknown }).kotaEsik;
  for (const tur of KATKI_TURLERI) {
    if (esikMi(eskiEsik)) v[tur].kotaEsik = [...eskiEsik];
    const k = h[tur] as Partial<KatkiPlani> | undefined;
    if (k && typeof k === 'object' && esikMi(k.kotaEsik)) v[tur].kotaEsik = [...k.kotaEsik];
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
  const pay = h.paylasim as Record<string, unknown> | undefined;
  if (pay && typeof pay === 'object') {
    if ((SURE_SECENEKLERI as readonly unknown[]).includes(pay.sureAy)) v.paylasim.sureAy = pay.sureAy as SureAy;
    for (const soru of ['ilkSatis', 'yillar', 'kota'] as const) if (pay[soru] === 'dus' || pay[soru] === 'tam') v.paylasim[soru] = pay[soru] as Bolusme;
  }
  if (Array.isArray(h.kalici)) {
    const gecerli = new Set(kuralListesi(v).map((k) => k.id));
    v.kalici = [...new Set(h.kalici.filter((x): x is string => typeof x === 'string' && gecerli.has(x)))];
  }
  return v;
}
