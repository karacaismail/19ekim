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
 * Açıklamalar tam cümledir. Noktalı virgül ve uzun çizgi yoktur (`tests/hizmetler.spec.ts`).
 */
import { CANLI_DENEME_GUN, CANLI_GRUPLAR, CANLI_KAYNAK, CANLI_PAKETLER, type CanliOzellik, type OzellikDegeri, type PaketId } from './canliPaketler';
import { MODELLER, type GelirModeli } from './gelirModelleri';

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
export const tarih = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00`));
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
/** Düzey değeri (Standart, Yüksek, Özel) cümle içinde küçük harfle yazılır. */
export const kucuk = (v: OzellikDegeri) => String(v).toLocaleLowerCase('tr');
/** Kota cümlesinin yüklemi: “sınırsızdır”, “sıfırdır”, “yoktur” ya da “ayda 20 kadardır”. */
export const kota = (v: OzellikDegeri) => (v === 'Sınırsız' ? 'sınırsızdır' : v === '0' ? 'sıfırdır' : v === false ? 'yoktur' : `ayda ${v} kadardır`);

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
  baslik: 'Alıcı ücretsiz kullanır. Satıcı ücretsiz başlar ve değeri görünce öder.',
  metin: 'Talebi alıcı getirir. Bu yüzden alıcı arama, mesaj ve teklif isteği için ödeme yapmaz. Satıcı için ödeme duvarı, değerin kanıtlandığı anda başlar.',
  kaynak: 'Küresel B2B pazaryerleri araştırması, 12 Kasım 2026',
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
  { id: 'guvence', metin: 'Ticaret Güvencesi sipariş koşullarını kayıt altına alır. Sorun çıkarsa alıcı talep açar.', kaynak: K.guvence },
  { id: 'paket-yok', metin: 'Fiyat planlarında yalnız satıcı paketi var.', kaynak: K.plan },
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

/** Özellik pakette varsa maddeyi yazar, yoksa atlar. */
const varsa = (id: PaketId, anahtarlar: string[], metin: string) => (anahtarlar.every((a) => pakette(deger(a, id))) ? metin : null);
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
  const urun = (id: PaketId) => `${deger('quota.max_active_listings', id)} ürün aynı anda yayında`;
  return [
    kart('basic', 'Yeni ve tek kişilik satıcı için', [
      urun('basic'),
      `Vitrin ${deger('feature.storefront.languages', 'basic')}de açılır`,
      varsa('basic', ['feature.analytics.basic', 'feature.functional.commission_report'], 'Temel analitik ve satış raporu'),
      buyukHarf(destekMetni('basic')),
      yanitMaddesi('basic'),
    ]),
    kart('platinium', 'Büyüyen KOBİ için', [
      urun('platinium'),
      pakette(deger('quota.featured_listings_monthly', 'platinium')) ? `Ayda ${deger('quota.featured_listings_monthly', 'platinium')} öne çıkan ürün` : null,
      varsa('platinium', ['feature.crm.module', 'feature.api.erp_integration'], 'Müşteri kayıtları (CRM) ve muhasebe yazılımı bağlantısı (ERP)'),
      buyukHarf(destekMetni('platinium')),
      yanitMaddesi('platinium'),
    ]),
    kart('enterprise', 'Kurumsal ve holding ölçeği için', [
      urun('enterprise'),
      yanitMaddesi('enterprise'),
      varsa('enterprise', ['feature.commerce.custom_payment_terms', 'feature.support.event_invitations'], 'Özel ödeme koşulları ve fuar daveti'),
      buyukHarf(destekMetni('enterprise')),
    ]),
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
      pakette: `Temel vitrin ${bas('feature.store.basic_storefront')}. Özel tema ${bas('feature.store.custom_theme')}. Özel alan adı ${bas('feature.store.custom_domain')}.`,
      planlanan: [model('kurulum-egitim', 'Ekip satıcının ürünlerini platforma girer. Satıcıya kısa bir kullanım eğitimi verilir.')],
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
    },
    {
      id: 'gorunurluk',
      ad: 'Görünürlük ve reklam',
      soru: 'Satıcı aramada nasıl öne çıkar?',
      icin: 'Satıcı',
      ucretsiz: null,
      pakette: `Arama önceliği ${ad(ilk)} paketinde ${kucuk(deger('feature.marketing.search_boost', ilk))} düzeydedir. ${ad(orta)} paketinde ${kucuk(deger('feature.marketing.search_boost', orta))} düzeydedir. Öne çıkan ürün hakkı ${ad(orta)} paketinde ${kota(deger('quota.featured_listings_monthly', orta))}. Anahtar kelime reklamı ${bas('feature.marketing.keyword_ads')}.`,
      planlanan: [
        model('sponsorlu-urun', 'Satıcı ürününü belirli bir süre ya da tıklama başına ücretle öne çıkarır. Alıcı bu sonucu “Sponsorlu” etiketiyle görür.'),
        model('kategori-vitrini', 'Bir kategorinin vitrini belirli bir süre için tek bir satıcıya kiralanır.'),
      ],
      fark: 'Paketteki reklam hakkı paketin içinde gelir. Planlanan öne çıkarma paketten ayrı satılır ve gösterim raporu verir.',
    },
    {
      id: 'veri',
      ad: 'Talep verisi ve analitik',
      soru: 'Satıcı kimin ne aradığını nasıl görür?',
      icin: 'Satıcı',
      ucretsiz: null,
      pakette: `Temel analitik ${bas('feature.analytics.basic')}. Veri dışa aktarımı ${bas('feature.analytics.export')}. Gelişmiş raporlar ${bas('feature.analytics.advanced')}.`,
      planlanan: [model('veri-raporlari', 'Platformdaki arama ve talep verisinden raporlar hazırlanır. Raporlarda kişisel veri bulunmaz.')],
      katman: 'talep-verisi',
    },
    {
      id: 'guven',
      ad: 'Güven ve doğrulama',
      soru: 'Alıcı satıcıya neden güvenir?',
      icin: 'Alıcı ve satıcı',
      ucretsiz: 'Ticaret Güvencesi sipariş koşullarını kayıt altına alır. Sorun çıkarsa alıcı talep açar.',
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
      pakette: `Özel ödeme koşulları ${bas('feature.commerce.custom_payment_terms')}.`,
      planlanan: [
        model('guvenli-odeme', 'Alıcının ödemesi teslimata kadar lisanslı bir ödeme kuruluşunda bekler.'),
        model('vadeli-satis', 'Alıcı malı vadeli alır. Satıcı parasını bir finans ortağı aracılığıyla peşin alır.'),
        model('alacak-sigortasi', 'Vadeli satışta satıcının alacağı bir sigorta şirketiyle güvenceye alınır.'),
      ],
      katman: 'finansman',
    },
    {
      id: 'lojistik',
      ad: 'Kargo ve sevkiyat',
      soru: 'Mal alıcıya nasıl gider?',
      icin: 'Satıcı',
      ucretsiz: null,
      pakette: `Kargo entegrasyonu ${bas('feature.functional.cargo_integration')}. Sevkiyat takibi ${bas('feature.logistics.insured_shipping')}.`,
      planlanan: [model('lojistik', 'Platform kargo firmalarıyla toplu fiyat anlaşması yapar. Satıcı bu anlaşmalı fiyatla gönderir.')],
      fark: 'Paketteki entegrasyon satıcıyı kargo firmasına bağlar. Planlanan hizmet toplu anlaşmayla daha ucuz gönderi sağlar.',
      katman: 'lojistik',
    },
    {
      id: 'bulusma',
      ad: 'Buluşma ve etkinlik',
      soru: 'Alıcı ve satıcı yüz yüze nerede buluşur?',
      icin: 'Alıcı ve satıcı',
      ucretsiz: null,
      pakette: `Fuar ve etkinlik daveti ${bas('feature.support.event_invitations')}.`,
      planlanan: [model('eslestirme-etkinlikleri', 'Alıcılar ve satıcılar İstoç çarşısında ya da çevrim içi bir günde buluşturulur.')],
      katman: 'cevrim-disi',
    },
    {
      id: 'ekip',
      ad: 'Ekip ve entegrasyon',
      soru: 'Satıcının ekibi ve yazılımı nasıl bağlanır?',
      icin: 'Satıcı',
      ucretsiz: null,
      pakette: `Alt kullanıcı sayısı ${ad(ilk)} paketinde ${deger('quota.max_sub_users', ilk)}, ${ad(orta)} paketinde ${deger('quota.max_sub_users', orta)}, ${ad(son)} paketinde ${deger('quota.max_sub_users', son)} kişidir. Muhasebe yazılımı bağlantısı (ERP) ${bas('feature.api.erp_integration')}.`,
      planlanan: [
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
  { ad: 'İlk nitelikli talep gelir', metin: 'Değer burada kanıtlanır. Ödeme duvarı buraya konur.', ucret: 'ucretli' },
  { ad: 'Kota ve görünürlük alır', metin: 'Satıcı teklif hakkını, öne çıkarmayı ve ziyaretçi kimliğini paketle alır.', ucret: 'ucretli' },
];
export const NITELIKLI_TALEP = 'Araştırma “nitelikli talep” terimini tanımlamaz. Bu sayfa onu ürünü, adedi ve iletişim bilgisi doğrulanmış bir alım isteği olarak okur.';
export const YOL_NOTU = 'Bugün ödeme deneme süresinin sonunda başlıyor. Araştırmanın kuralına göre ödeme duvarı ilk nitelikli talebe yaklaşmalıdır. Bu geçiş için talep verisinin ölçülmesi gerekir.';

export const SAYFA_KAYNAGI = `Paket fiyatları ve özellikleri istoc.com satıcı paketlerinden ${OKUNDU} günü okundu.`;
export const PAKET_ADI_NOTU = 'Gelir modelleri sayfası aynı paketlere Standart, Pro ve Kurumsal der. Bu sayfa istoc.com’daki adları kullanır.';
export const OZELLIK_NOTU = 'Fiyat planları bir paketin içeriğini listeler. Bir özelliğin bugün çalıştığını tek başına göstermez.';

/** Yıllık peşin ödemenin kaç aylık ücrete eşit olduğu. Tam sayı değilse null döner. */
export function yillikAy(id: PaketId): number | null {
  const p = paket(id);
  if (!p.aylikEur || !p.yillikEur) return null;
  const ay = p.yillikEur / p.aylikEur;
  return Number.isInteger(ay) ? ay : null;
}

/** Karşılaştırma tablosunda gösterilen özellik grupları (canlı uçtaki sırayla). */
export const KARSILASTIRMA = CANLI_GRUPLAR;
