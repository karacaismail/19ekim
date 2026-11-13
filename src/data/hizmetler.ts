/**
 * Hizmetler (kullanıcı kararı 2026-11-12): istoc.com’un ücretsiz ve ücretli hizmetleri. Sayfanın adresi kullanıcının
 * istediği gibi `/services/`, başlığı yalın Türkçeyle “Hizmetler”dir.
 *
 * Üç bilgi türü ayrı tutulur ve sayfada ayrı etiketle görünür:
 * - Bugün var: istoc.com’dan okunan olgu. Paket değerleri `canliPaketler.ts` anlık görüntüsünden üretilir. Metne elle
 *   sayı, paket adı ya da okunma tarihi yazılmaz (`deger()`, `bas()`, `CANLI_KAYNAK`). Öteki olgular istoc-anasayfa
 *   kanıt defterindeki canlı sayfa alıntılarıdır ya da `ACILDI` günü açılan sayfadır.
 * - Araştırmanın ilkesi: ücretsiz ve ücretli ayrımının kuralı. Kaynak küresel pazaryeri araştırmasıdır (`kuresel.ts`).
 * - Planlanan: `gelirModelleri.ts` içindeki hazırlık durumu. Planlanan hizmet bugün satılmaz ve esnafa söz verilmez.
 * Fiyat planları bir paketin içeriğini listeler. Bir özelliğin bugün çalıştığını tek başına göstermez.
 * - Yazılımdaki durum (`YAZILIM_DURUMU`): kod incelemesi canlı tablodaki bazı satırların yazılımda karşılığını bulamadı.
 *   Kullanıcı kararı 13 Kasım 2026: bu satırlar silinmez, işaretle gösterilir. Bu bilgi istoc.com’un tablosunda yoktur.
 * Açıklamalar tam cümledir. Noktalı virgül ve uzun çizgi yoktur (`tests/hizmetler.spec.ts`).
 */
import { CANLI_DENEME_GUN, CANLI_GRUPLAR, CANLI_KAYNAK, CANLI_PAKETLER, type CanliOzellik, type OzellikDegeri, type PaketId } from './canliPaketler';
import { CRM_EKI_AYLIK_EUR, MODELLER, UCRETSIZ_URUN, type GelirModeli } from './gelirModelleri';

export const PAKET_SIRASI: PaketId[] = ['basic', 'platinium', 'enterprise'];

const OZELLIKLER: CanliOzellik[] = CANLI_GRUPLAR.flatMap((g) => g.ozellikler);

/** Canlı paketteki bir özelliğin değeri. Anahtar canlı uçtaki özellik anahtarıdır. */
export function deger(anahtar: string, paketId: PaketId): OzellikDegeri {
  const o = OZELLIKLER.find((x) => x.anahtar === anahtar);
  if (!o) throw new Error(`Canlı pakette olmayan özellik: ${anahtar}`);
  return o.deger[paketId];
}

/** Değerin okunur metni. “Yok” ve “Var” açık yazılır, tire kullanılmaz (gorsel_algi.md F17). */
export const degerMetni = (v: OzellikDegeri) => (v === true ? 'Var' : v === false ? 'Yok' : v);

/** Pakette sayılır mı? Yok değeri ve “0” kotası sayılmaz. */
export const pakette = (v: OzellikDegeri) => v !== false && v !== '0';

/** Özelliğin hangi paketten başladığı. */
export function ilkPaket(anahtar: string): PaketId | null {
  return PAKET_SIRASI.find((p) => pakette(deger(anahtar, p))) ?? null;
}

export const paket = (id: PaketId) => CANLI_PAKETLER.find((p) => p.id === id)!;
export const eur = (n: number) => `${n.toLocaleString('tr-TR')} €`;
export const tarih = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(new Date(`${iso}T00:00:00`));
/** Paket fiyatı: tutar, ücretsiz ya da teklif. */
export const fiyatMetni = (aylik: number | null) => (aylik === null ? 'Teklif' : aylik === 0 ? 'Ücretsiz' : eur(aylik));

/** “Platinium paketinden başlar”, “bütün paketlerde vardır” ya da “yalnız Enterprise paketinde vardır”. */
export function bas(anahtar: string): string {
  const p = ilkPaket(anahtar);
  if (p === null) return 'hiçbir pakette yoktur';
  if (p === PAKET_SIRASI[0]) return 'bütün paketlerde vardır';
  if (p === PAKET_SIRASI[PAKET_SIRASI.length - 1]) return `yalnız ${paket(p).ad} paketinde vardır`;
  return `${paket(p).ad} paketinden başlar`;
}
/**
 * Yazılımdaki durum. Kaynak istoc.com yazılımının 13 Kasım 2026 tarihli kod incelemesidir. Kod incelemesi 22 madde buldu.
 * Bu maddeler canlı tabloda 25 satırdır.
 * - `yakinda`: özellik bugün çalışmaz. Küçük bir geliştirme ya da bir anlaşma gerekir.
 * - `hazir-degil`: özellik bugün çalışmaz. Yazılım, ortak ya da sipariş ve ödeme akışı eksiktir. İhracat da buradadır.
 * - `hepsinde`: özellik çalışır ama pakete bağlı değildir. Her pakette açıktır.
 * - `alici`: alıcıya ait bir özelliktir. Satıcı paketine bağlı değildir.
 */
export type YazilimDurumu = 'yakinda' | 'hazir-degil' | 'hepsinde' | 'alici';
export const YAZILIM_KAYNAGI = 'istoc.com yazılımının 13 Kasım 2026 Cuma tarihli kod incelemesi';
const ALICI_NOTU = 'Bu bir alıcı özelliğidir. Satıcı paketine bağlı değildir.';
export const YAZILIM_DURUMU: Record<string, { durum: YazilimDurumu; not: string }> = {
  'quota.max_active_listings': { durum: 'yakinda', not: 'Yazılımda bu sayı için sınır denetimi yok. Kayıtlı ürün sınırı çalışır.' },
  'feature.ai.translate': { durum: 'yakinda', not: 'Çeviri altyapısı var. Pakete bağlı değil.' },
  'quota.featured_listings_monthly': { durum: 'yakinda', not: 'Aylık sınır yok. Bugün her satıcı ürününü kendisi öne çıkarabiliyor.' },
  'feature.storefront.languages': { durum: 'hepsinde', not: 'Vitrin bugün her pakette 4 dilde açılır.' },
  'feature.storefront.rich_media': { durum: 'hepsinde', not: 'Video bugün her pakette eklenebilir. 360 derece görsel yazılımda yok.' },
  'feature.storefront.custom_subdomain': { durum: 'hazir-degil', not: 'Yazılımda bu özellik yok.' },
  'feature.store.custom_theme': { durum: 'hepsinde', not: 'Vitrin düzenleyici bugün her pakette açık.' },
  'feature.store.custom_domain': { durum: 'hazir-degil', not: 'Yazılımda bu özellik yok.' },
  'feature.store.multi_language': { durum: 'hepsinde', not: 'Ürün bilgisi bugün her pakette birkaç dilde girilebilir.' },
  'feature.sales.sample_sales': { durum: 'hazir-degil', not: 'İlanda numune fiyatı girilebilir. Sipariş akışı çalışmıyor.' },
  'feature.commerce.custom_payment_terms': { durum: 'hazir-degil', not: 'Ödeme akışı çalışmıyor.' },
  'feature.functional.approval_chain': { durum: 'alici', not: ALICI_NOTU },
  'feature.functional.cargo_integration': { durum: 'yakinda', not: 'Yalnız deneme kargo bağlantısı var. Gerçek kargo firması bağlı değil.' },
  'feature.b2b.approved_vendor_list': { durum: 'alici', not: ALICI_NOTU },
  'feature.b2b.cost_center': { durum: 'alici', not: ALICI_NOTU },
  'feature.b2b.organization_hierarchy': { durum: 'alici', not: ALICI_NOTU },
  'feature.marketing.search_boost': { durum: 'yakinda', not: 'Arama sonuçları sipariş sayısına göre sıralanır. Paketin etkisi yok.' },
  'feature.marketing.keyword_ads': { durum: 'hazir-degil', not: 'Yazılımda reklam sistemi yok.' },
  'quota.ad_credit_monthly': { durum: 'hazir-degil', not: 'Yazılımda reklam sistemi yok.' },
  'feature.support.event_invitations': { durum: 'yakinda', not: 'Bu bir ekip işidir. Etkinlik takvimi henüz yok.' },
  'feature.support.vat_refund_advisory': { durum: 'hazir-degil', not: 'İhracat hizmetleri hazır değil. Esnafa söz vermeyin.' },
  'feature.logistics.insured_shipping': { durum: 'yakinda', not: 'Takip altyapısı var. Gerçek kargo firması bağlı değil.' },
  'feature.api.erp_integration': { durum: 'yakinda', not: 'Hazır muhasebe bağlantısı yok. Ürün bağlantısı ve stok bildirimi var.' },
  'feature.analytics.advanced': { durum: 'yakinda', not: 'Pakete bağlı bir rapor ekranı bulunamadı.' },
  'feature.analytics.export': { durum: 'yakinda', not: 'Pakete bağlı bir dışa aktarma ekranı bulunamadı.' },
};
export const yazilimDurumu = (anahtar: string): YazilimDurumu | null => YAZILIM_DURUMU[anahtar]?.durum ?? null;
/** Tablodaki işaret: canlı tablonun “Yakında” işareti ya da kod incelemesinin bulduğu çalışmayan özellik. */
export function isaret(o: CanliOzellik): 'yakinda' | 'hazir-degil' | null {
  if (o.yakinda) return 'yakinda';
  const d = yazilimDurumu(o.anahtar);
  return d === 'yakinda' || d === 'hazir-degil' ? d : null;
}
/** Özellik bugün yazılımda çalışır mı? */
export const calisir = (anahtar: string) => {
  const d = yazilimDurumu(anahtar);
  return d !== 'yakinda' && d !== 'hazir-degil';
};
const DURUM_CUMLESI: Record<YazilimDurumu, string> = {
  yakinda: 'Bu özellik bugün çalışmıyor. Tabloda “Yakında” işareti taşır.',
  'hazir-degil': 'Bu özellik bugün çalışmıyor. Tabloda “Hazır değil” işareti taşır.',
  hepsinde: 'Yazılımda bu özellik bütün paketlerde açıktır.',
  alici: ALICI_NOTU,
};
/** Yazılımdaki durumu söyleyen cümle. Listede olmayan özellik için boş metin döner. */
export const durumCumlesi = (anahtar: string) => {
  const d = yazilimDurumu(anahtar);
  return d ? ` ${DURUM_CUMLESI[d]}` : '';
};
/** Paket tablosundaki özelliğin cümlesi ve yazılımdaki durumu. `ad` cümle ortasındaki yazımdır. */
export function ozellikCumlesi(ad: string, anahtar: string): string {
  if (!yazilimDurumu(anahtar)) return `${buyukHarf(ad)} ${bas(anahtar)}.`;
  return `Paket tablosuna göre ${ad} ${bas(anahtar)}.${durumCumlesi(anahtar)}`;
}
export const YAZILIM_NOTU = `Satır adının altındaki not, yazılımdaki durumu söyler. Bu notları ve işaretleri bu site ekledi. Notların kaynağı ${YAZILIM_KAYNAGI}dir.`;

/** Düzey değeri (Standart, Yüksek, Özel) cümle içinde küçük harfle yazılır. */
export const kucuk = (v: OzellikDegeri) => String(v).toLocaleLowerCase('tr');
/** Kota cümlesinin yüklemi: “sınırsızdır”, “sıfırdır”, “yoktur” ya da “ayda 20 kadardır”. */
export const kota = (v: OzellikDegeri) => (v === 'Sınırsız' ? 'sınırsızdır' : v === '0' || v === false ? 'yoktur' : `ayda en çok ${v} tanedir`);

/** Canlı destek düzeyinin yalın açıklaması. Listede olmayan düzey olduğu gibi yazılır. */
const DESTEK: Record<string, string> = {
  'E-posta': 'e-posta ile destek',
  'Hesap yöneticisi': 'size atanmış bir hesap yöneticisi',
  '7×24 tahsisli': 'haftanın her günü ve her saatinde size ayrılmış destek',
};
export const destekMetni = (id: PaketId) => {
  const v = String(deger('feature.support.tier', id));
  return DESTEK[v] ?? kucuk(v);
};

/** Satış komisyonu bugün. Canlı değer “Şu an yok” ise oran %0’dır. */
const KOMISYON_DEGERI = deger('quota.commission_rate', PAKET_SIRASI[0]);
/** Canlı sitedeki komisyon yazısı (“Şu an yok” gibi). */
export const KOMISYON_METNI = String(degerMetni(KOMISYON_DEGERI));
export const KOMISYON_YOK = KOMISYON_DEGERI === 'Şu an yok' || KOMISYON_DEGERI === false;
export const KOMISYON = KOMISYON_YOK ? '%0' : String(KOMISYON_DEGERI);
export const KOMISYON_CUMLESI = KOMISYON_YOK ? 'Satıştan şu an komisyon alınmaz.' : `Satış komisyonu ${KOMISYON}.`;

/** Paket fiyatlarının okunduğu gün (canlı anlık görüntü). */
export const OKUNDU = tarih(CANLI_KAYNAK.okundu);
/** Paket dışındaki canlı sayfaların elle açılıp denetlendiği gün. */
export const ACILDI = tarih('2026-11-12');

export interface Kaynak {
  ad: string;
  url: string;
}
export const K = {
  plan: { ad: 'istoc.com satıcı paketleri', url: CANLI_KAYNAK.sayfa },
  saticiOl: { ad: 'istoc.com/satici-ol', url: 'https://istoc.com/satici-ol' },
  ureticiler: { ad: 'istoc.com/ureticiler', url: 'https://istoc.com/ureticiler' },
  urunler: { ad: `istoc.com/urunler, ${ACILDI} günü açıldı`, url: 'https://istoc.com/urunler' },
  guvence: { ad: 'istoc.com/ticaret-guvencesi', url: 'https://istoc.com/ticaret-guvencesi' },
} satisfies Record<string, Kaynak>;

/** Araştırmanın ilkesi: kim ne zaman öder? Bu bugünkü uygulama değildir. Kaynak küresel pazaryeri araştırması. */
export const ILKE = {
  etiket: 'Araştırmanın ilkesi',
  baslik: 'Alıcı ücretsiz kullanır. Satıcı ücretsiz başlar ve platformdan fayda görünce öder.',
  metin: 'Talebi alıcı getirir. Bu yüzden alıcı arama, mesaj ve teklif isteği için ödeme yapmaz. Satıcının ödemeye başladığı ana ödeme duvarı denir. Bu an, satıcının platformdan fayda gördüğü andır.',
  kaynak: 'İşletmeden işletmeye satış (B2B) yapan küresel pazar yerleri araştırması, 12 Kasım 2026 Perşembe',
};

/** Bugün istoc.com’da: sayfa başındaki rakamlar. Hepsi canlı veriden türetilir. */
export const BUGUN_RAKAMLAR = [
  { deger: '0 €', metin: 'Alıcının ödediği ücret' },
  { deger: String(CANLI_DENEME_GUN), metin: 'Her paketin ücretsiz deneme günü' },
  { deger: fiyatMetni(paket(PAKET_SIRASI[0]).aylikEur), metin: `${paket(PAKET_SIRASI[0]).ad} paketinin aylık ücreti` },
  { deger: KOMISYON, metin: 'Satış komisyonu' },
];

export interface Fayda {
  id: string;
  metin: string;
  kaynak: Kaynak;
}

export const ALICI_UCRETSIZ: Fayda[] = [
  { id: 'hesap', metin: 'Hesap açmak ücretsizdir.', kaynak: K.ureticiler },
  { id: 'arama', metin: 'Ürün ve üretici araması herkese açıktır. Arama için giriş gerekmez.', kaynak: K.urunler },
  { id: 'teklif', metin: 'Alıcı bir teklif isteğiyle birden fazla satıcıdan teklif alır.', kaynak: K.ureticiler },
  { id: 'guvence', metin: 'Ticaret Güvencesi sipariş koşullarını kayıt altına alır. Sorun çıkarsa alıcı şikâyet kaydı açar.', kaynak: K.guvence },
  { id: 'paket-yok', metin: 'istoc.com satıcı paketleri sayfasında yalnız satıcılar için paket var.', kaynak: K.plan },
];

export const SATICI_UCRETSIZ: Fayda[] = [
  { id: 'basvuru', metin: 'Satıcı başvurusu ücretsizdir.', kaynak: K.saticiOl },
  { id: 'deneme', metin: `Her paket ${CANLI_DENEME_GUN} gün ücretsiz denenir.`, kaynak: K.plan },
  { id: 'komisyon', metin: KOMISYON_CUMLESI, kaynak: K.plan },
];

export const ODEME_NOTU = {
  metin: 'Alıcı ödemeyi satıcıya yapar. Tek ödeme seçeneği sunulursa alıcı bütün sepeti Thoptan.com’a öder. iStoc ödemeyi tutmaz ve aracılık etmez.',
  kaynak: K.guvence,
};

/** Paket kartları: canlı fiyat ve canlı özellik değerlerinden kurulan kısa tanım. */
export interface PaketKarti {
  id: PaketId;
  ad: string;
  fiyat: string;
  birim: string | null;
  yillik: string | null;
  one: boolean;
  kimin: string;
  maddeler: string[];
}

/** Özellik pakette varsa ve yazılımda çalışıyorsa maddeyi yazar, yoksa atlar. */
const varsa = (id: PaketId, anahtarlar: string[], metin: string) => (anahtarlar.every((a) => calisir(a) && pakette(deger(a, id))) ? metin : null);
const yanitMaddesi = (id: PaketId) => {
  const v = deger('quota.rfq_quotes_monthly', id);
  return v === 'Sınırsız' ? 'Teklif isteğine sınırsız yanıt' : pakette(v) ? `Ayda ${v} teklif isteğine yanıt` : 'Teklif isteğine yanıt hakkı yok';
};
const buyukHarf = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);

export function paketKartlari(): PaketKarti[] {
  const kart = (id: PaketId, kimin: string, maddeler: (string | null)[]): PaketKarti => {
    const p = paket(id);
    return {
      id,
      ad: p.ad,
      fiyat: fiyatMetni(p.aylikEur),
      birim: p.aylikEur ? 'aylık' : null,
      yillik: p.yillikEur ? `Yıllık peşin ${eur(p.yillikEur)}` : null,
      one: p.one,
      kimin,
      maddeler: maddeler.filter((m): m is string => m !== null),
    };
  };
  // Kartta yalnız yazılımda çalışan özellik sayılır (kod incelemesi, 13 Kasım 2026). “Aynı anda yayında ürün” sayısının
  // yazılımda denetimi yoktur. Bu yüzden kart çalışan kayıtlı ürün sınırını yazar.
  const urun = (id: PaketId) => {
    const v = deger('quota.max_products', id);
    return v === 'Sınırsız' ? 'Sınırsız kayıtlı ürün' : `${v} kayıtlı ürün`;
  };
  return [
    kart('basic', 'Yeni ve tek kişilik satıcı için', [
      urun('basic'),
      varsa('basic', ['feature.analytics.basic', 'feature.functional.commission_report'], 'Temel analitik ve satış raporu'),
      buyukHarf(destekMetni('basic')),
      yanitMaddesi('basic'),
    ]),
    kart('platinium', 'Büyüyen KOBİ için', [
      urun('platinium'),
      varsa('platinium', ['feature.crm.module'], 'Müşteri kayıt modülü (CRM)'),
      varsa('platinium', ['feature.pim.multi_variant'], 'Beden ve renk gibi ürün seçenekleri'),
      buyukHarf(destekMetni('platinium')),
      yanitMaddesi('platinium'),
    ]),
    kart('enterprise', 'Kurumsal ve holding ölçeği için', [urun('enterprise'), yanitMaddesi('enterprise'), buyukHarf(destekMetni('enterprise'))]),
  ];
}

/** Hizmet haritası: her satırda ücretsiz kısım, paketteki kısım ve planlanan ek hizmetler. */
export interface Planlanan {
  model: GelirModeli;
  not: string;
}
export interface HizmetSatiri {
  id: string;
  ad: string;
  soru: string;
  icin: 'Alıcı ve satıcı' | 'Satıcı';
  ucretsiz: string | null;
  pakette: string | null;
  planlanan: Planlanan[];
  /** Paketteki özellik ile planlanan ek hizmet aynı işi anlatıyor gibi görünürse ikisinin farkı. */
  fark?: string;
  /** Küresel araştırmadaki elde tutma katmanı (bağlantı). */
  katman?: string;
  /** Bu hizmetle ilgili karar (kullanıcı kararı 13 Kasım 2026). istoc.com’da henüz uygulanmadı. */
  karar?: string;
}

const model = (id: string, not: string): Planlanan => {
  const m = MODELLER.find((x) => x.id === id);
  if (!m) throw new Error(`Gelir modellerinde olmayan model: ${id}`);
  return { model: m, not };
};

export function hizmetHaritasi(): HizmetSatiri[] {
  const [ilk, orta, son] = PAKET_SIRASI;
  const ad = (id: PaketId) => paket(id).ad;
  return [
    {
      id: 'vitrin',
      ad: 'Mağaza ve vitrin',
      soru: 'Satıcı ürünlerini nasıl sergiler?',
      icin: 'Satıcı',
      ucretsiz: 'Satıcı başvurusu ücretsizdir.',
      pakette: [
        ozellikCumlesi('temel vitrin', 'feature.store.basic_storefront'),
        ozellikCumlesi('özel tema', 'feature.store.custom_theme'),
        ozellikCumlesi('özel alan adı', 'feature.store.custom_domain'),
      ].join(' '),
      planlanan: [model('kurulum-egitim', 'Ekip satıcının ürünlerini platforma girer. Satıcıya kısa bir kullanım eğitimi verilir.')],
      karar: `Ücretsiz paket gelecek. Satıcı ${UCRETSIZ_URUN} ürünle ücretsiz başlayacak. Bugün bu paket istoc.com’da yok.`,
    },
    {
      id: 'talep',
      ad: 'Teklif isteği ve talep',
      soru: 'Alıcının isteği satıcıya nasıl ulaşır?',
      icin: 'Alıcı ve satıcı',
      ucretsiz: 'Alıcı bir teklif isteğiyle birden fazla satıcıdan teklif alır.',
      pakette: `${ad(son)} paketinde teklif isteğine yanıt hakkı ${kota(deger('quota.rfq_quotes_monthly', son))}. ${ad(orta)} paketinde bu hak ${kota(deger('quota.rfq_quotes_monthly', orta))}. ${ad(ilk)} paketinde bu hak ${kota(deger('quota.rfq_quotes_monthly', ilk))}.`,
      planlanan: [model('rfq', 'Satıcı her talep için ayrı ücret öder. Bunun yerine aboneliğe belirli sayıda talep hakkı da eklenebilir.')],
      fark: 'Paketteki hak, gelen teklif isteğine yanıt verme hakkıdır. Planlanan hizmet ise doğrulanmış talepleri toplayıp satıcıya satar.',
      katman: 'teklif-istegi',
      karar: `${ad(orta)} paketi de teklif isteğine yanıt verecek. Bu ayarı istoc.com yöneticisi yapar.`,
    },
    {
      id: 'gorunurluk',
      ad: 'Görünürlük ve reklam',
      soru: 'Satıcı aramada nasıl öne çıkar?',
      icin: 'Satıcı',
      ucretsiz: null,
      pakette: [
        `Paket tablosuna göre arama önceliği ${ad(ilk)} paketinde ${kucuk(deger('feature.marketing.search_boost', ilk))} düzeydedir.`,
        `${ad(orta)} paketinde ${kucuk(deger('feature.marketing.search_boost', orta))} düzeydedir.${durumCumlesi('feature.marketing.search_boost')}`,
        `Paket tablosuna göre öne çıkan ürün hakkı ${ad(orta)} paketinde ${kota(deger('quota.featured_listings_monthly', orta))}.${durumCumlesi('quota.featured_listings_monthly')}`,
        ozellikCumlesi('anahtar kelime reklamı', 'feature.marketing.keyword_ads'),
      ].join(' '),
      planlanan: [
        model('sponsorlu-urun', 'Satıcı ürününü belirli bir süre ya da tıklama başına ücretle öne çıkarır. Alıcı bu sonucu “Sponsorlu” etiketiyle görür.'),
        model('kategori-vitrini', 'Bir kategorinin vitrini belirli bir süre için tek bir satıcıya kiralanır.'),
        model('marka-sahibi', 'Ürünü markanın sahibi de satıyorsa ürün sayfasında ilk sırada görünür. Alıcı bunu “Marka sahibi” yazısıyla görür.'),
        model('marka-vitrini', 'Onaylı marka kendi vitrin sayfasında öne çıkacak ürünleri seçer ve sıralar.'),
      ],
      fark: 'Paket tablosundaki reklam hakları bugün çalışmıyor. Planlanan öne çıkarma paketten ayrı satılır. Satıcı gösterim raporu alır.',
      karar: '“Öne çıkan” kutusunu yalnız İstoç çalışanı işaretleyecek. Satıcı önce ücreti öder.',
    },
    {
      id: 'veri',
      ad: 'Talep verisi ve analitik',
      soru: 'Satıcı kimin ne aradığını nasıl görür?',
      icin: 'Satıcı',
      ucretsiz: null,
      pakette: [
        ozellikCumlesi('temel analitik', 'feature.analytics.basic'),
        ozellikCumlesi('verileri dosya olarak indirme hakkı', 'feature.analytics.export'),
        ozellikCumlesi('gelişmiş raporlar', 'feature.analytics.advanced'),
      ].join(' '),
      planlanan: [model('veri-raporlari', 'Platformdaki arama ve talep verisinden raporlar hazırlanır. Raporlarda kişisel veri bulunmaz.')],
      katman: 'talep-verisi',
    },
    {
      id: 'guven',
      ad: 'Güven ve doğrulama',
      soru: 'Alıcı satıcıya neden güvenir?',
      icin: 'Alıcı ve satıcı',
      ucretsiz: 'Ticaret Güvencesi sipariş koşullarını kayıt altına alır. Sorun çıkarsa alıcı şikâyet kaydı açar.',
      pakette: `Şirket doğrulaması ${bas('feature.storefront.manufacturer_badge_tier')}. Doğrulanan mağaza rozet taşır.`,
      planlanan: [model('dogrulanmis-tedarikci', 'Dükkân ya da depo yerinde denetlenir. Denetimi geçen satıcı ücretli bir rozet alır.')],
      fark: 'Paketteki doğrulama şirketin kaydını denetler. Planlanan rozet buna dükkânın ya da deponun yerinde denetimini ekler.',
    },
    {
      id: 'odeme',
      ad: 'Ödeme ve finansman',
      soru: 'Para kime, ne zaman geçer?',
      icin: 'Alıcı ve satıcı',
      ucretsiz: KOMISYON_CUMLESI,
      pakette: ozellikCumlesi('özel ödeme koşulları', 'feature.commerce.custom_payment_terms'),
      planlanan: [
        model('guvenli-odeme', 'Alıcının ödemesi teslimata kadar lisanslı bir ödeme kuruluşunda bekler.'),
        model('vadeli-satis', 'Alıcı malı vadeli alır. Satıcı parasını bir finans ortağı aracılığıyla peşin alır.'),
        model('alacak-sigortasi', 'Vadeli satışta satıcının alıcıdan alacağı para bir sigorta şirketiyle güvenceye alınır.'),
      ],
      katman: 'finansman',
      karar: 'Satıştan komisyon alınmayacak. Emanet ödeme ileride ayrı bir özellik olarak gelecek.',
    },
    {
      id: 'lojistik',
      ad: 'Kargo ve sevkiyat',
      soru: 'Mal alıcıya nasıl gider?',
      icin: 'Satıcı',
      ucretsiz: null,
      pakette: [ozellikCumlesi('kargo entegrasyonu', 'feature.functional.cargo_integration'), ozellikCumlesi('sevkiyat takibi', 'feature.logistics.insured_shipping')].join(' '),
      planlanan: [model('lojistik', 'Platform kargo firmalarıyla toplu fiyat anlaşması yapar. Satıcı bu anlaşmalı fiyatla gönderir.')],
      fark: 'Paketteki kargo bağlantısı bugün çalışmıyor. Bağlantı çalışınca satıcıyı kargo firmasına bağlar. Planlanan hizmet toplu anlaşmayla daha ucuz gönderi sağlar.',
      katman: 'lojistik',
    },
    {
      id: 'bulusma',
      ad: 'Buluşma ve etkinlik',
      soru: 'Alıcı ve satıcı yüz yüze nerede buluşur?',
      icin: 'Alıcı ve satıcı',
      ucretsiz: null,
      pakette: ozellikCumlesi('fuar ve etkinlik daveti', 'feature.support.event_invitations'),
      planlanan: [model('eslestirme-etkinlikleri', 'Alıcılar ve satıcılar İstoç çarşısında ya da çevrim içi bir günde buluşturulur.')],
      katman: 'cevrim-disi',
    },
    {
      id: 'ekip',
      ad: 'Ekip ve yazılım bağlantısı',
      soru: 'Satıcının ekibi ve yazılımı nasıl bağlanır?',
      icin: 'Satıcı',
      ucretsiz: null,
      pakette: `Ek kullanıcı hesabı sayısı ${ad(ilk)} paketinde ${deger('quota.max_sub_users', ilk)}, ${ad(orta)} paketinde ${deger('quota.max_sub_users', orta)}, ${ad(son)} paketinde ${deger('quota.max_sub_users', son)} kişidir. ${ozellikCumlesi('kurumsal kaynak planlama (ERP) ya da muhasebe yazılımı bağlantısı', 'feature.api.erp_integration')}`,
      planlanan: [
        model('crm-eki', `${ad(ilk)} paketini kullanan satıcı CRM’i ayda ${eur(CRM_EKI_AYLIK_EUR)} ek ücretle alır.`),
        model('eklentiler', 'Paketin üstüne ek kullanıcı, ek ürün sınırı ve muhasebe yazılımı bağlantısı satılır.'),
        model('beyaz-etiket', 'Büyük bir toptancıya kendi adıyla çalışan bir sipariş mağazası kurulur.'),
      ],
      fark: 'Paketteki bağlantı ve kullanıcı sayısı paketin sınırları içindedir. Planlanan ekler bu sınırı paketi değiştirmeden büyütür.',
    },
    {
      id: 'destek',
      ad: 'Destek',
      soru: 'Satıcı sorun yaşayınca kime ulaşır?',
      icin: 'Satıcı',
      ucretsiz: null,
      pakette: `${ad(ilk)} paketinde ${destekMetni(ilk)} var. ${ad(orta)} paketinde ${destekMetni(orta)} var. ${ad(son)} paketinde ${destekMetni(son)} var.`,
      planlanan: [],
    },
  ];
}

/** Ödeme ne zaman başlar? Bugünkü yol (olgu) ve araştırmanın kuralı. */
export interface Adim {
  ad: string;
  metin: string;
  ucret: 'ucretsiz' | 'ucretli';
}
export const BUGUNKU_YOL: Adim[] = [
  { ad: 'Hesap açar', metin: 'Hesap açmak ücretsizdir.', ucret: 'ucretsiz' },
  { ad: 'Satıcı başvurusu yapar', metin: 'Başvuru ücretsizdir.', ucret: 'ucretsiz' },
  { ad: `${CANLI_DENEME_GUN} gün dener`, metin: 'Her paket deneme süresiyle başlar.', ucret: 'ucretsiz' },
  {
    ad: 'Paket seçer',
    metin: `Deneme bitince paket ücreti başlar. ${paket(PAKET_SIRASI[0]).ad} paketi aylık ${fiyatMetni(paket(PAKET_SIRASI[0]).aylikEur)} tutar.`,
    ucret: 'ucretli',
  },
];
export const KURALIN_YOLU: Adim[] = [
  { ad: 'Talebi görür', metin: 'Satıcı vitrinini ücretsiz açar ve gelen talebi görür.', ucret: 'ucretsiz' },
  { ad: 'İlk nitelikli talep gelir', metin: 'Satıcı platformun işine yaradığını burada görür. Ücretli kullanım burada başlar.', ucret: 'ucretli' },
  { ad: 'Kota ve görünürlük alır', metin: 'Satıcı teklif hakkını, öne çıkarmayı ve profilini ziyaret edenlerin adlarını paketle alır.', ucret: 'ucretli' },
];
export const NITELIKLI_TALEP = 'Araştırma “nitelikli talep” terimini tanımlamaz. Bu sayfa onu ürünü, adedi ve iletişim bilgisi doğrulanmış bir alım isteği olarak okur.';
export const YOL_NOTU = 'Bugün ödeme deneme süresinin sonunda başlıyor. Araştırmanın kuralına göre ödeme duvarı ilk nitelikli talebe yaklaşmalıdır. Bu geçiş için önce gelen talepler sayılmalı.';

/** Kararlar (kullanıcı kararı 13 Kasım 2026). istoc.com’da henüz uygulanmadı. */
export const PAKET_KARARI = 'Ücretsiz paket gelecek. Bu paket bugün istoc.com’da yok.';
export const YOL_KARARI =
  'Ücretsiz paket gelecek. Satıcı ücretsiz başlar. Satıcı teklif isteklerini görür. Teklif vermek için satıcı ücretli paket alır. Bu yol araştırmanın kuralına yakındır. Paket bugün açık değildir.';

export const SAYFA_KAYNAGI = `Paket fiyatları ve özellikleri istoc.com satıcı paketlerinden ${OKUNDU} günü okundu.`;
/** Alıcı paketi kararı (kullanıcı kararı 13 Kasım 2026, 9.4). Paket ileri tarihli bir gelir modelidir. */
export const ALICI_KARARI = 'Alıcı paketi ileride gelecek. Paket ek özellikler içerecek. Alıcının bugünkü ücretsiz kullanımı sürecek.';
export const OZELLIK_NOTU = 'Satıcı paketleri sayfası bir paketin içeriğini listeler. Bu liste, bir özelliğin bugün çalıştığını tek başına göstermez.';

/** Yıllık peşin ödemenin kaç aylık ücrete eşit olduğu. Tam sayı değilse null döner. */
export function yillikAy(id: PaketId): number | null {
  const p = paket(id);
  if (!p.aylikEur || !p.yillikEur) return null;
  const ay = p.yillikEur / p.aylikEur;
  return Number.isInteger(ay) ? ay : null;
}

/** Karşılaştırma tablosunda gösterilen özellik grupları (canlı uçtaki sırayla). */
export const KARSILASTIRMA = CANLI_GRUPLAR;
