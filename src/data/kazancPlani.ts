/**
 * Kâğıttaki kazanç planı (kullanıcı kararı 16 Kasım 2026 Pazartesi).
 *
 * - Persona fark etmez. Herkes iş ortağıdır ve aynı koşullarla kazanır.
 * - Yalnız kadrolu uzman SGK'lı çalışandır. Maaş ve prim alır.
 * - İki katkı türü vardır: tanıştırır ve satışı kapatır. Satışı kapatan ürünü gösterir ve onboarding de yapar.
 *   Onboarding, yeni müşterinin kurulumu ve ilk eğitimidir. Ayrı bir katkı türü değildir (kullanıcı kararı 17 Kasım 2026 Salı).
 *   Eski ortadaki “Ürünü de gösterir” seçeneği kalktı.
 * - Oranlar ciro üzerinden yüzdedir. K1, K2 ve K3 aylık ciro kotalarıdır. Kotalar oranı sırayla artırır. Artış orana puan olarak eklenir.
 * - Ödeme süreleri (kullanıcı kararları 20 Kasım 2026 Cuma): aylık pakette pay en çok 12 ay sürer. Yıllık pakette
 *   bedelin tamamı satış ayının cirosudur ve pay bir kerede ödenir. Yıllık yenilemede 13. ile 24. ay arası düşük oran
 *   uygulanır. 25. aydan sonra pay yoktur. Tanıştıran yalnız satıştan sonraki ilk 3 aydaki ödemelerden pay alır.
 *
 * Bütün değerler okur tarafından değiştirilebilir. Değerler yalnız okurun tarayıcısında saklanır (ortak kayda gitmez).
 */
import type { Ayar, Marka, Seviye } from './satisOrtakligi';
import { num } from '../lib/format';

export type KatkiTuru = 'tanistir' | 'kapatir';
/** Yıllık yenilemenin ay aralığı. 25. aydan sonra pay yoktur (kullanıcı kararı 20 Kasım 2026 Cuma). */
export const YENILEME_DONEMI = '13. ile 24. ay arası';
export const KATKI_TURLERI = ['tanistir', 'kapatir'] as const;
export type Esik = number | null;
export interface KatkiPlani {
  /** Aylık ciro eşikleri. Her katkı türünün eşiği ayrıdır. Boş eşikten sonraki kota uygulanmaz. */
  kotaEsik: [Esik, Esik, Esik];
  /** Ciro üzerinden taban oran. */
  taban: number;
  /** K1, K2 ve K3 kotasına ulaşınca eklenen yüzde puan. */
  kotaArtis: [number, number, number];
  /**
   * Yıllık yenileme oranı: müşteri yıllık paketi yenilerse 13. ile 24. ay arasında alınan oran.
   * Yalnız satışı kapatan için kullanılır. Tanıştıran ilk 3 aydan sonra pay almaz (kullanıcı kararı 20 Kasım 2026 Cuma).
   */
  gecmis: [number];
}
export interface KazancPlani {
  tanistir: KatkiPlani;
  kapatir: KatkiPlani;
  /** Örnek hesapta kullanılan aylık ciro. Gerçek satış değildir. */
  ornekCiro: number;
  /**
   * Kadrolu uzmanın maaşı ve kotası. Maaş kotası net maaşın katıdır.
   * iStoc'ta prim, aylık satılan yıllık paket sayısının kademesine göredir (kullanıcı kararı 20 Kasım 2026 Cuma).
   */
  kadrolu: {
    maas: number; kotaOrani: number; primOrani: Esik;
    paketEsik: [number, number, number]; paketOran: [number, number, number]; ornekPaket: number;
  };
  /** Tanıştıran ile satışı kapatan farklı kişiyse pay bölüşmesi. Yönetici seçer (kullanıcı kararı 17 Kasım 2026). */
  paylasim: { sureAy: SureAy; ilkSatis: Bolusme; kota: Bolusme };
  /** Yöneticinin kalıcı kural adayı olarak işaretlediği değerlerin kimlikleri (`kuralListesi`). */
  kalici: string[];
}

/** “dus”: tanıştıranın payı kapatanın payından düşülür. Şirketi zarardan korur. “tam”: şirket ikisine de tam öder. */
export type Bolusme = 'dus' | 'tam';
export const BOLUSME_ADI: Record<Bolusme, string> = {
  dus: "Ahmet'in payı Mehmet'in payından düşülür",
  tam: 'Şirket ikisine de tam öder',
};
// Kullanıcı kararı 20 Kasım 2026 Cuma: tanıştıran ilk 3 aydan sonra pay almaz. Bu yüzden sonraki yılların bölüşme sorusu kalktı.
export const BOLUSME_SORUSU = { ilkSatis: 'İlk satışta pay', kota: 'Kota artışında pay' } as const;

/** Tanıştırmanın geçerlilik süresi için seçenekler (ay). Varsayılan 3 ay, yani 90 gündür (kullanıcı kararı 20 Kasım 2026 Cuma). */
export const SURE_SECENEKLERI = [1, 2, 3, 4, 5, 6, 8, 10, 12] as const;
export type SureAy = (typeof SURE_SECENEKLERI)[number];

export const KATKI_ADI: Record<KatkiTuru, string> = { tanistir: 'Tanıştırma', kapatir: 'Satışı kapatma' };
/** Kadrolu uzmanın aylık maaş aralığı (kullanıcı kararı). */
export const MAAS_ARALIGI = [50_000, 60_000] as const;

export const KAZANC_VARSAYILAN: KazancPlani = {
  // Kullanıcı kararı 17 Kasım 2026 Salı: tanıştırmanın varsayılanları. Bunlar kalıcı kural değildir.
  // Kullanıcı kararı 17 Kasım 2026 Salı: yalnız tanıştıranın oranı K0'da %0, K1'de %7, K2'de %10, K3'te %15'tir.
  // Kullanıcı kararı 20 Kasım 2026 Cuma: tanıştıran yalnız ilk 3 aydaki ödemelerden pay alır. Yenileme oranı yoktur.
  tanistir: { kotaEsik: [30_000, 60_000, 100_000], taban: 0, kotaArtis: [0.07, 0.03, 0.05], gecmis: [0] },
  // Kullanıcı kararı 20 Kasım 2026 Cuma: yıllık yenilemede 13. ile 24. ay arası %10 uygulanır. 25. aydan sonra pay yoktur.
  // Kullanıcı kararı 17 Kasım 2026 Salı: satışı kapatanın eşikleri 0, 30.000, 70.000 ve 120.000 ₺'dir.
  // Oran K0'da %15, K1'de %20, K2'de %25, K3'te %30'dur. Her kota oranı 5 puan artırır.
  kapatir: { kotaEsik: [30_000, 70_000, 120_000], taban: 0.15, kotaArtis: [0.05, 0.05, 0.05], gecmis: [0.1] },
  // Kullanıcı kararı 17 Kasım 2026 Salı: örnek aylık ciro 50.000 ₺ ile açılır.
  ornekCiro: 50_000,
  // Kullanıcı kararı 20 Kasım 2026 Cuma: maaş kotası net maaşın 2 katıdır. 50.000 ₺ maaşta kota 100.000 ₺ olur.
  // iStoc'ta 4 paket ve altı prim yoktur. 5 paket ve üstü %5, 8 paket ve üstü %7, 12 paket ve üstü %10 olur.
  kadrolu: { maas: MAAS_ARALIGI[0], kotaOrani: 2, primOrani: null, paketEsik: [5, 8, 12], paketOran: [0.05, 0.07, 0.1], ornekPaket: 8 },
  // Her soruda varsayılan, şirketi zarardan koruyan düşme seçeneğidir.
  // Kullanıcı kararı 20 Kasım 2026 Cuma: tanıştırılan müşteri 90 gün, yani 3 ay ortak adına korunur.
  paylasim: { sureAy: 3, ilkSatis: 'dus', kota: 'dus' },
  kalici: [],
};

/**
 * Yöneticinin kalıcı kuralları (kullanıcı kararı 17 Kasım 2026 Salı, Segika JSON çıktısı).
 * Bu değerler başlangıçta kalıcı kural olarak işaretlidir. Ana ekranda görünmezler.
 * Yönetici bu değerleri “KALICI KURALLAR” penceresinden değiştirir ya da kalıcı kuraldan çıkarır.
 */
export const SABIT_KURALLAR: Record<Marka, Record<string, number | string>> = {
  istoc: {},
  segika: {
    'tanistir.taban': 0,
    // Kullanıcı kararı 17 Kasım 2026 Salı: satışı kapatma taban oranı da kalıcı kuraldır.
    'kapatir.taban': 0.15,
    'tanistir.kotaArtis.0': 0.07, 'tanistir.kotaArtis.1': 0.03, 'tanistir.kotaArtis.2': 0.05,
    'kapatir.kotaArtis.0': 0.05, 'kapatir.kotaArtis.1': 0.05, 'kapatir.kotaArtis.2': 0.05,
    'kapatir.gecmis.0': 0.1,
    // Kullanıcı kararı 20 Kasım 2026 Cuma: koruma 90 gündür. Sonraki yılların bölüşme sorusu kalktı.
    'paylasim.sureAy': 3, 'paylasim.ilkSatis': 'dus', 'paylasim.kota': 'dus',
  },
};

/** Kalıcı olmayan ama yöneticinin JSON'da verdiği başlangıç değerleri (kullanıcı kararı 17 Kasım 2026 Salı). */
const PROJE_VARSAYILANI: Record<Marka, Record<string, number | string | null>> = {
  istoc: {},
  segika: {
    'tanistir.kotaEsik.0': 30_000, 'tanistir.kotaEsik.1': 70_000, 'tanistir.kotaEsik.2': 100_000,
    'kapatir.kotaEsik.0': 30_000, 'kapatir.kotaEsik.1': 70_000, 'kapatir.kotaEsik.2': 120_000,
    // Kullanıcı kararı 20 Kasım 2026 Cuma: Segika kadrolu uzman, kotayı aşan cironun %10'unu prim alır.
    'kadrolu.primOrani': 0.1,
  },
};

/** Kimliği `a.b.0` biçimindeki değeri plana yazar. */
function degerYaz(plan: KazancPlani, id: string, deger: number | string | null) {
  const yol = id.split('.');
  let hedef: Record<string, unknown> = plan as unknown as Record<string, unknown>;
  for (const parca of yol.slice(0, -1)) hedef = hedef[parca] as Record<string, unknown>;
  hedef[yol[yol.length - 1]] = deger;
}

/** Projenin başlangıç planı. Sabit kurallar ve proje varsayılanları uygulanmıştır. */
export function projeVarsayilani(proje: Marka): KazancPlani {
  const v = structuredClone(KAZANC_VARSAYILAN);
  for (const [id, d] of Object.entries(PROJE_VARSAYILANI[proje])) degerYaz(v, id, d);
  for (const [id, d] of Object.entries(SABIT_KURALLAR[proje])) degerYaz(v, id, d);
  v.kalici = Object.keys(SABIT_KURALLAR[proje]);
  return v;
}

/**
 * Koşullu kümülatif hesap (kullanıcı kararı 17 Kasım 2026 Salı): ulaşılan seviyenin oranı cironun tamamına uygulanır.
 * Örnek: satışı kapatan 1.000.000 ₺ ciroda K3'e ulaşır. Oran %30'dur. Kazanç 300.000 ₺ olur.
 */
export const KUMULATIF_KURALI = 'Ulaştığınız seviyenin oranı cironun tamamına uygulanır. Örneğin satışı kapatan 1.000.000 ₺ ciroda K3 seviyesindedir. Oranı %30 olur ve 300.000 ₺ alır.';

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

/**
 * Kota kuralı (kullanıcı kararı 17 Kasım 2026 Salı): kişi ilk 12 ayda K1 kotasını tamamlamazsa
 * 13. aydan sonraki pay devam etmez. 20 Kasım 2026 Cuma kararıyla 13. aydan sonra yalnız yıllık yenileme payı kaldı.
 * K1 eşiği boşsa kural ölçülemez. Bu durumda örnek kotayı tamamlanmış sayar.
 */
export const KOTA_KURALI = 'Satışı kapatan ilk 12 ayda K1 kotasını tamamlamazsa yıllık yenilemede pay almaz.';

/** Ödeme süreleri, ay olarak (kullanıcı kararları 20 Kasım 2026 Cuma). */
export const ODEME_SURESI = { tanistir: 3, aylik: 12, yillik: 24 } as const;

/**
 * Ödeme kuralları (kullanıcı kararları 20 Kasım 2026 Cuma). Kazanç planı ve bütün rol rehberleri bu cümleleri kullanır.
 * Böylece rehber ile plan aynı kuralı söyler.
 */
export const ODEME_KURALLARI = [
  'Ciro, getirdiğiniz müşterilerin o ay ödediği paket bedellerinin toplamıdır. KDV hariç tutulur.',
  'Kurulum ücreti ciroya girmez. Bu ücretten pay almazsınız.',
  'Aylık pakette satışı kapatan her ay pay alır. Pay en çok 12 ay sürer.',
  'Yıllık pakette bedelin tamamı satış ayının cirosuna yazılır. Pay satış ayında bir kerede ödenir.',
  'Müşteri yıllık paketi yenilerse satışı kapatan 13. ile 24. ay arasında yenileme oranını alır. 25. aydan sonra pay yoktur.',
  'Tanıştıran yalnız satıştan sonraki ilk 3 aydaki ödemelerden pay alır.',
  'Müşteri ayrılırsa pay durur. Ödenmiş pay geri istenmez.',
] as const;
export const AYRILMA_KURALI = ODEME_KURALLARI[6];
export function kotaTamam(plan: KazancPlani, tur: KatkiTuru, ciro: number) {
  const k1 = plan[tur].kotaEsik[0];
  return k1 === null || ciro >= k1;
}

/** Yıllık yenilemede satışı kapatanın oranı ve payı. K1 tamamlanmazsa yenileme payı yoktur. */
export function yenilemeKazanci(plan: KazancPlani, ciro: number) {
  const oran = kotaTamam(plan, 'kapatir', ciro) ? plan.kapatir.gecmis[0] : 0;
  return { oran, tutar: Math.round(ciro * oran) };
}

/**
 * Örnek hesap (kullanıcı kararları 17 ve 20 Kasım 2026). Aylık ciro sabit kabul edilir.
 * Ulaşılan seviyenin oranı bütün ciroya uygulanır. Satışı kapatan en çok 12 ay, tanıştıran en çok 3 ay pay alır.
 * Satışı kapatanın tablosunda yıllık yenileme satırı da durur. K1 tamamlanmazsa bu satırın tutarı 0 ₺ olur.
 * K1 eşiği boşsa örnek, K1'in geçildiğini kabul eder.
 */
export function ornekHesap(plan: KazancPlani, tur: KatkiTuru) {
  const ciro = plan.ornekCiro;
  const k1 = plan[tur].kotaEsik[0];
  const k1Gecti = k1 === null || ciro >= k1;
  const { oran } = katkiOrani(plan, tur, ciro);
  const ay = tur === 'tanistir' ? ODEME_SURESI.tanistir : ODEME_SURESI.aylik;
  const aylik = Math.round(ciro * oran);
  const satirlar = [{ ad: tur === 'tanistir' ? `1. ile ${ay}. ay arası, her ay` : `Aylık pakette, 1. ile ${ay}. ay arası, her ay`, oran, ciro, tutar: aylik }];
  if (tur === 'kapatir') {
    // Yenileme bedeli örnekte bu ciroya eşit kabul edilir. Pay yenileme ayında bir kerede ödenir.
    satirlar.push({ ad: `Yıllık paket yenilenirse, bir kerede`, oran: plan.kapatir.gecmis[0], ciro, tutar: yenilemeKazanci(plan, ciro).tutar });
  }
  return { satirlar, ay, k1Gecti, k1Bos: k1 === null, toplam: aylik * ay };
}

const yuvarla = (n: number) => Math.max(0, Math.round(n * 10_000) / 10_000);

/**
 * Tanıştıran ile satışı kapatan farklı kişiyse pay bölüşmesi. Örnekte Ahmet tanıştırır, Mehmet satışı kapatır.
 * İki soru ayrı seçilir: ilk satışta taban oran ve kota artışı.
 * “dus” seçilirse Ahmet'in oranı Mehmet'in oranından düşülür. “tam” seçilirse şirket ikisine de tam öder.
 * Her kişi kendi katkı türünün kota eşiğini kullanır. Bölüşme yalnız ilk 3 aydadır. Sonra yalnız Mehmet pay alır.
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
    // Kullanıcı kararı 20 Kasım 2026 Cuma: 4. aydan sonra Ahmet pay almaz. Mehmet kendi oranının tamamını alır.
    sonrakiOran: yuvarla(k),
    yenilemeOran: yenilemeKazanci(plan, ciro).oran,
  };
}

/** Yenileme oranı kutusunun tam adı. Ekran okuyucu ve JSON bu adı kullanır. */
export const YENILEME_ADI = 'Satışı kapatma yıllık yenileme oranı';

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
    if (tur === 'kapatir') liste.push(oran('kapatir.gecmis.0', YENILEME_ADI, p.gecmis[0]));
  }
  liste.push({ id: 'paylasim.sureAy', ad: 'Tanıştırmanın geçerlilik süresi', deger: plan.paylasim.sureAy, gosterim: `${plan.paylasim.sureAy} ay` });
  for (const soru of ['ilkSatis', 'kota'] as const) {
    const v = plan.paylasim[soru];
    liste.push({ id: `paylasim.${soru}`, ad: BOLUSME_SORUSU[soru], deger: v, gosterim: BOLUSME_ADI[v] });
  }
  liste.push(para('kadrolu.maas', 'Aylık net maaş', plan.kadrolu.maas));
  liste.push(oran('kadrolu.kotaOrani', 'Maaş kotası oranı', plan.kadrolu.kotaOrani));
  liste.push(oran('kadrolu.primOrani', 'Kota üstü prim oranı', plan.kadrolu.primOrani));
  plan.kadrolu.paketEsik.forEach((e, i) => liste.push({ id: `kadrolu.paketEsik.${i}`, ad: `K${i + 1} paket eşiği`, deger: e, gosterim: `${e} paket` }));
  plan.kadrolu.paketOran.forEach((o, i) => liste.push(oran(`kadrolu.paketOran.${i}`, `K${i + 1} prim oranı`, o)));
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

/**
 * Paket kademesi primi (kullanıcı kararı 20 Kasım 2026 Cuma). Kademe, ayda satılan yıllık paket sayısıyla bulunur.
 * Ulaşılan kademenin oranı satılan bütün paketlerin tutarına uygulanır. Kademeye ulaşılmazsa prim yoktur.
 * Örnek: 8 paket ve 100.000 ₺ paket bedeli. Kademe K2, oran %7, prim 56.000 ₺ olur.
 */
export function paketPrimi(kademe: { esik: readonly number[]; oran: readonly number[] }, adet: number, paketBedeli: number) {
  let seviye = 0;
  let oran = 0;
  kademe.esik.forEach((e, i) => { if (adet >= e) { seviye = i + 1; oran = kademe.oran[i]; } });
  const ciro = Math.round(adet * paketBedeli);
  return { seviye: seviye as 0 | 1 | 2 | 3, oran, ciro, prim: Math.round(ciro * oran) };
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
    // Kullanıcı kararı 20 Kasım 2026 Cuma: rehberdeki Segika primi plandaki oranı kullanır. Oran boşsa eski değer kalır.
    kadroluPrim: { ...ayar.kadroluPrim, segika: plan.kadrolu.primOrani ?? ayar.kadroluPrim.segika },
    // Paket kademeleri yalnız iStoc kadrolu uzmanı içindir. Segika'nın hesabı değişmez.
    ...(ayar.marka === 'istoc' ? {
      kadroluSatis: plan.kadrolu.ornekPaket,
      kadroluPaket: { esik: [...plan.kadrolu.paketEsik], oran: [...plan.kadrolu.paketOran] },
    } : {}),
  };
}

const ORAN = (v: unknown, enCok = 1) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= enCok;
const ESIK = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0);

/** Tarayıcıdaki kaydı doğrular. Geçersiz alan varsayılanı alır. */
export function planOku(ham: unknown, proje?: Marka): KazancPlani {
  const v = proje ? projeVarsayilani(proje) : structuredClone(KAZANC_VARSAYILAN);
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
    // Eski kayıtta dört dönem vardı. Yalnız ilk dönem, yani 13. ile 24. ay arası, yenileme oranı olarak kalır.
    if (tur === 'kapatir' && Array.isArray(k.gecmis) && k.gecmis.length >= 1 && ORAN(k.gecmis[0])) v.kapatir.gecmis = [k.gecmis[0] as number];
  }
  if (ESIK(h.ornekCiro) && h.ornekCiro !== null) v.ornekCiro = h.ornekCiro as number;
  const kd = h.kadrolu as Partial<KazancPlani['kadrolu']> | undefined;
  if (kd && typeof kd === 'object') {
    if (ESIK(kd.maas) && kd.maas !== null) v.kadrolu.maas = kd.maas!;
    if (ORAN(kd.kotaOrani, 100)) v.kadrolu.kotaOrani = kd.kotaOrani!;
    if (kd.primOrani === null || ORAN(kd.primOrani)) v.kadrolu.primOrani = kd.primOrani ?? null;
    const adetMi = (x: unknown) => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 1000;
    if (Array.isArray(kd.paketEsik) && kd.paketEsik.length === 3 && kd.paketEsik.every(adetMi)) v.kadrolu.paketEsik = [...kd.paketEsik] as KazancPlani['kadrolu']['paketEsik'];
    if (Array.isArray(kd.paketOran) && kd.paketOran.length === 3 && kd.paketOran.every((x) => ORAN(x))) v.kadrolu.paketOran = [...kd.paketOran] as KazancPlani['kadrolu']['paketOran'];
    if (adetMi(kd.ornekPaket)) v.kadrolu.ornekPaket = kd.ornekPaket!;
  }
  const pay = h.paylasim as Record<string, unknown> | undefined;
  if (pay && typeof pay === 'object') {
    if ((SURE_SECENEKLERI as readonly unknown[]).includes(pay.sureAy)) v.paylasim.sureAy = pay.sureAy as SureAy;
    for (const soru of ['ilkSatis', 'kota'] as const) if (pay[soru] === 'dus' || pay[soru] === 'tam') v.paylasim[soru] = pay[soru] as Bolusme;
  }
  if (Array.isArray(h.kalici)) {
    const gecerli = new Set(kuralListesi(v).map((k) => k.id));
    v.kalici = [...new Set(h.kalici.filter((x): x is string => typeof x === 'string' && gecerli.has(x)))];
  }
  return v;
}
