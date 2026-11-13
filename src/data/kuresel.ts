/**
 * Küresel B2B pazaryerleri (kullanıcı kararı 2026-11-12). Kaynak: titanlar.com araştırması “Küresel B2B Pazaryerleri:
 * Ekosistem, Gelir ve Freemium Mimarisi” (12 Kasım 2026). Kullanıcı bu belgeyi kesin karar olarak verdi.
 *
 * Üç bilgi türü sayfada ayrı etiketle görünür:
 * - Belgeden: rakamlar, oranlar ve kaynak bağlantıları belgeden aynen alındı. Cümleler yalın Türkçeyle yeniden yazıldı.
 *   Belgedeki 33 bağlantının hepsi sayfadadır (`BELGE_BAGLANTILARI`, `tests/kuresel-pazaryerleri.spec.ts`).
 * - Belgenin şeması: belgede iki şema var (“3 model, 7 platform” ve “3 faz, 2 kapı”). Şemaların kendisi metinde yok.
 *   Sayfadaki harita, ödeme duvarı şeması ve modül sırası belgenin metninden kuruldu. Bu not sayfada görünür.
 * - Sitenin karşılaştırması: istoc.com kutuları, “Bugün burada” işareti ve istoc.com sonucu belgede yoktur. Olgular canlı
 *   paket anlık görüntüsünden türetilir (`hizmetler.ts`, `canliPaketler.ts`). Metne elle sayı ya da paket adı yazılmaz.
 * “İkincil kaynak” etiketi, bilginin platformun kendi yayını olmadığını söyler. Belge beş kaynağı etiketledi. Sayfa,
 * platformun kendi yayını olmayan dört kaynağı daha etiketledi (`IKINCIL_NOTU`).
 * Noktalı virgül ve uzun çizgi yoktur. Sayı aralıkları “%5 ile %8 arası” biçiminde yazılır.
 */
import { CANLI_PAKETLER } from './canliPaketler';
import { HAZIRLIK_ADI, MODELLER } from './gelirModelleri';
import { KOMISYON_METNI, KOMISYON_YOK, OKUNDU, PAKET_SIRASI, bas, deger, fiyatMetni, ilkPaket, kota, paket } from './hizmetler';

export interface Kaynak {
  ad: string;
  url: string;
  /** Platformun kendi yayını değil. “belge”: belge böyle etiketledi. “sayfa”: etiketi bu sayfa ekledi. */
  ikincil?: 'belge' | 'sayfa';
}

export const RAPOR = {
  baslik: 'Küresel B2B Pazaryerleri: Ekosistem, Gelir ve Freemium Mimarisi',
  yazar: 'titanlar.com',
  tarih: '12 Kasım 2026',
};

/** Belgedeki bütün kaynaklar. Her bağlantı belgedeki adresle aynıdır. */
const K = {
  aeBulten: { ad: 'AliExpressDirect basın bülteni', url: 'https://www.prnewswire.com/news-releases/aliexpress-invites-us-retailers-to-sell-on-the-platform-302291208.html' },
  alibaba: { ad: 'Alibaba Group', url: 'https://www.alibabagroup.com/document-1696296090350911488' },
  amz123: { ad: 'DHgate platform kullanım ücreti SSS', url: 'https://www.amz123.com/t/rYj497Km' },
  channable: { ad: 'Channable: AliExpress', url: 'https://www.channable.com/blog/aliexpress-the-marketplace-you-cannot-ignore-in-your-multichannel-strategy', ikincil: 'sayfa' },
  cls: { ad: 'CLS: DHgate paketleri', url: 'https://www.cls.cn/detail/2011351', ikincil: 'sayfa' },
  dhgateBulten: { ad: 'PR Newswire: DHgate', url: 'https://prnewswire.com/news-releases/dhgatecoms-best-practices-for-importing-goods-from-digital-platforms-300457368.html' },
  ecomclips: { ad: 'eComclips', url: 'https://ecomclips.com/blog/?p=24436', ikincil: 'belge' },
  epProfil: { ad: 'Europages yardım: şirket profili', url: 'https://help.europages.com/en/supplier/company-overview' },
  epZiyaretci: { ad: 'Europages yardım: ziyaretçi kimliği', url: 'https://help.europages.com/en/supplier/how-you-benefit-from-identified-visitors' },
  faireButce: { ad: 'Faire Promoted Listings bütçesi', url: 'https://www.faire.com/support/articles/34731619825691' },
  faireDeneme: { ad: 'Faire No Commission Trial', url: 'https://www.faire.com/support/articles/53979477181851' },
  faireFiyat: { ad: 'Faire fiyatlandırma', url: 'https://www.faire.com/support/articles/360015893392' },
  faireInsider: { ad: 'Faire Insider', url: 'https://www.faire.com/support/articles/4406840862747' },
  faireTiklama: { ad: 'Faire Promoted Listings tıklama fiyatı', url: 'https://www.faire.com/support/articles/34730939021851' },
  fastlane: { ad: 'eCommerce Fastlane', url: 'https://ecommercefastlane.com/is-dhgate-legit', ikincil: 'belge' },
  feedvisor: { ad: 'Feedvisor', url: 'https://feedvisor.com/university/applying-to-sell-on-walmarts-marketplace/', ikincil: 'belge' },
  gsBrosur: { ad: 'Global Sources 2025 broşürü', url: 'https://s.globalsources.com/IMAGES/website/image/corporate/CorporateBrochure2025_EN.pdf' },
  gsKarsilastirma: { ad: 'Global Sources karşılaştırması', url: 'https://www.globalsources.com/knowledge/global-sources-vs-alibaba-vs-made-in-china/' },
  gsPaket: { ad: 'Global Sources paket duyurusu', url: 'https://www.supplier-globalsources.com/syp/en/news/details_97323/' },
  gsTeklif: { ad: 'Global Sources teklif yardım', url: 'https://www.globalsources.com/STM/HELP/PSCEHELP/FILES/RFQINDEX.HTM' },
  kompassBooster: { ad: 'Kompass Booster', url: 'https://us.kompass.com/contactus/booster/' },
  kompassFiyat: { ad: 'Kompass fiyat duyurusu', url: 'https://us.solutions.kompass.com/blog/end-of-year-offer-on-kompass-booster-and-easybusiness/' },
  pai: { ad: 'pai.com.cn: DHgate komisyonu', url: 'https://www.pai.com.cn/184697.html', ikincil: 'sayfa' },
  pymnts: { ad: 'PYMNTS: Parafin', url: 'https://www.pymnts.com/loans/2024/parafin-begins-offering-financing-to-walmart-marketplace-sellers/', ikincil: 'sayfa' },
  requestHub: { ad: 'Europages Request Hub yardım', url: 'https://help.europages.com/en/supplier/europages-request-hub' },
  saleslayer: { ad: 'Sales Layer', url: 'https://blog.saleslayer.com/how-to-sell-on-aliexpress-marketplace', ikincil: 'belge' },
  topRanking: { ad: 'Visable Top Ranking', url: 'https://www.visable.com/en_uk/b2b-marketplaces/top-ranking' },
  visableMakale: { ad: 'Visable: Europages', url: 'https://www.visable.com/en_nl/magazine/tips-strategies/europages-the-right-platform-for-international-b2b-business' },
  visableUrun: { ad: 'Visable ürün sayfası', url: 'https://www.visable.com/en_uk/b2b-marketplaces/europages' },
  walmartCapital: { ad: 'Walmart Marketplace Capital', url: 'https://marketplacelearn.walmart.com/guides/Growth%20opportunities/Financing%20options/Walmart-Marketplace-Capital:-Program-overview' },
  walmartReklam: { ad: 'Walmart Sponsored Search', url: 'https://marketplace.walmart.com/sponsored-search-ads/' },
  walmartYeni: { ad: 'Walmart yeni satıcı indirimleri', url: 'https://marketplace.walmart.com/new-seller-savings-2026/' },
  worldfirst: { ad: 'WorldFirst: AliExpress Business', url: 'https://www.worldfirst.com/uk/blog/e-commerce-online-sellers/aliexpress-business/', ikincil: 'belge' },
} satisfies Record<string, Kaynak>;

/** Belgedeki bütün bağlantılar. Sayfa her birini en az bir kez gösterir. */
export const BELGE_BAGLANTILARI: string[] = Object.values(K).map((k) => k.url);

/** Türkçe liste: “a, b ve c”. */
const liste = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ve ${xs[xs.length - 1]}`);
const site = (url: string) => new URL(url).hostname.replace(/^www\./, '');

/** İki küme: belgenin metnindeki soldaki üç platform ve sağdaki dört platform. */
export type KumeId = 'tanistiran' | 'odeme';
export interface Kume {
  id: KumeId;
  ad: string;
  /** Belgenin bu yola verdiği ad. */
  model: string;
  soru: string;
  ozet: string;
}
export const KUMELER: Kume[] = [
  {
    id: 'tanistiran',
    ad: 'Tanıştıran platformlar',
    model: 'Dizin modeli',
    soru: 'Ödeme platformdan geçmez',
    ozet: 'Bu platformlar alıcıyla satıcıyı tanıştırır ve aradan çekilir. Satıcı bu platformlarda öne çıkmak için ücret öder.',
  },
  {
    id: 'odeme',
    ad: 'Ödemeyi taşıyan platformlar',
    model: 'İşlem modeli',
    soru: 'Ödeme platformdan geçer',
    ozet: 'Bu platformlar ödemeyi kendi üzerinden geçirir. Bu yüzden aynı satıştan komisyon, reklam ve kargo geliri birlikte alınır.',
  },
];

export const HARITA_NOTU =
  'Belgede “3 model, 7 platform” adlı bir şema var. Ama belgenin metni yalnız 2 modeli anlatır. Bu harita o 2 modeli gösterir.';
export const MODEL_NOTU =
  'Belge tanıştıranların yoluna “dizin modeli” der. Belgenin bir cümlesinde aynı yolun adı “lead modeli”dir. Lead, satıcıya gelen alım isteği demektir. Ödemeyi taşıyanların yoluna belge “işlem modeli” der.';
export const SITE_NOTU = 'istoc.com kutusu sitenin karşılaştırmasıdır. Bu bilgi belgede yok.';

/** Gelir katmanı: platformun para kazandığı ya da satıcıyı bağladığı yer. */
export type Katman = 'komisyon' | 'abonelik' | 'reklam' | 'odeme' | 'lojistik' | 'guven' | 'veri';
export const KATMAN_ADI: Record<Katman, string> = {
  komisyon: 'Komisyon',
  abonelik: 'Abonelik',
  reklam: 'Reklam ve sıra',
  odeme: 'Ödeme ve vade',
  lojistik: 'Lojistik',
  guven: 'Güven rozeti',
  veri: 'Talep verisi',
};
export const KATMANLAR: Katman[] = ['komisyon', 'abonelik', 'reklam', 'odeme', 'lojistik', 'guven', 'veri'];

export interface Platform {
  id: string;
  ad: string;
  kume: KumeId;
  /** Belgede bu platform için adı geçen gelir ve elde tutma katmanları. */
  katmanlar: Katman[];
  komisyon: string;
  abonelik: string;
  reklam: string;
  ucretsiz: string;
  duvar: string;
  gelirKaynagi: Kaynak;
  ucretsizKaynagi: Kaynak;
}

export const PLATFORMLAR: Platform[] = [
  {
    id: 'global-sources',
    ad: 'Global Sources',
    kume: 'tanistiran',
    katmanlar: ['abonelik', 'reklam', 'guven', 'veri'],
    komisyon: 'Yok',
    abonelik: 'Yıllık ya da iki yıllık üyelik paketi. Fiyat listesi herkese açık değil.',
    reklam: 'Ana sayfa sıralaması paket puanıyla alınır.',
    ucretsiz: 'Alıcıya arama, tedarikçiyle yazışma ve teklif isteği. Satıcıya deneme paketi.',
    duvar: 'Doğrulanmış statü, daha yüksek teklif kotası ve fuar standı.',
    gelirKaynagi: K.gsPaket,
    ucretsizKaynagi: K.gsKarsilastirma,
  },
  {
    id: 'europages',
    ad: 'Europages',
    kume: 'tanistiran',
    katmanlar: ['abonelik', 'reklam', 'veri'],
    komisyon: 'Yok',
    abonelik: 'Ücretsiz profil ve iki ücretli kademe.',
    reklam: 'Top Ranking adlı üst sıra, kategori başına sabit fiyatla.',
    ucretsiz: 'Standart profil, alıcı araması ve Request Hub talep havuzu.',
    duvar: 'Ürün sınırı, üst sıra (Top Ranking) ve ziyaretçi kimliği.',
    gelirKaynagi: K.visableMakale,
    ucretsizKaynagi: K.visableUrun,
  },
  {
    id: 'kompass',
    ad: 'Kompass',
    kume: 'tanistiran',
    katmanlar: ['abonelik', 'reklam', 'guven', 'veri'],
    komisyon: 'Yok',
    abonelik: 'Booster Premium ve International. ABD’de International yılda 1.100 USD (2023 sonu).',
    reklam: 'Görsel reklam ve yönetilen tıklama başına reklam. Bu reklamları yalnız Booster abonesi alır.',
    ucretsiz: 'Dizinde şirket profili.',
    duvar: 'İkinci dil, ürün sınırı, rakip reklamı göstermeyen profil, yurt dışı talepleri ve veri tabanı erişimi.',
    gelirKaynagi: K.kompassFiyat,
    ucretsizKaynagi: K.kompassBooster,
  },
  {
    id: 'aliexpress',
    ad: 'AliExpress',
    kume: 'odeme',
    katmanlar: ['komisyon', 'reklam', 'odeme', 'lojistik'],
    komisyon: '%5 ile %8 arası, kategoriye göre',
    abonelik: 'Yok. Mağaza açılışı ücretsiz.',
    reklam: 'Tıklama başına ücretli arama reklamı ve satış başına ücretli ortaklık programı (affiliate).',
    ucretsiz: 'Mağaza açılışı ve listeleme. ABD yerel satıcısına tanıtım döneminde %0 komisyon.',
    duvar: 'İlk satış (komisyon). Görünürlük için reklam.',
    gelirKaynagi: K.channable,
    ucretsizKaynagi: K.aeBulten,
  },
  {
    id: 'walmart',
    ad: 'Walmart Marketplace',
    kume: 'odeme',
    katmanlar: ['komisyon', 'reklam', 'odeme', 'lojistik', 'guven'],
    komisyon: '%6 ile %15 arası, kategoriye ve fiyata göre',
    abonelik: 'Yok',
    reklam: 'Walmart Connect Sponsored Search, tıklama başına ücretli.',
    ucretsiz: 'Kurulum ve listeleme ücretsiz. Aylık ücret yok. Yeni satıcıya komisyon indirimi ve reklam kredisi.',
    duvar: 'İlk satış (komisyon). Hızlı teslimat etiketi için Walmart’ın depo ve kargo hizmeti (WFS).',
    gelirKaynagi: K.walmartYeni,
    ucretsizKaynagi: K.walmartYeni,
  },
  {
    id: 'faire',
    ad: 'Faire',
    kume: 'odeme',
    katmanlar: ['komisyon', 'abonelik', 'reklam', 'odeme', 'lojistik'],
    komisyon: '%15 ve yeni müşteride tek seferlik 10 USD',
    abonelik: 'Alıcı tarafında Insider, ayda 19,99 USD.',
    reklam: 'Promoted Listings, tıklama başına ücretli.',
    ucretsiz: 'Kayıt, vitrin, sipariş ve müşteri kayıt araçları (CRM). Kendi getirdiği müşteride %0 komisyon.',
    duvar: 'Pazaryerinden gelen sipariş (%15). Her siparişte ödeme ücreti.',
    gelirKaynagi: K.faireFiyat,
    ucretsizKaynagi: K.faireFiyat,
  },
  {
    id: 'dhgate',
    ad: 'DHgate',
    kume: 'odeme',
    katmanlar: ['komisyon', 'abonelik', 'reklam', 'odeme', 'lojistik'],
    komisyon: '300 USD altı siparişte %12,5 ile %21,5 arası. 300 ile 1.000 USD arasında %4 ile %8 arası. 1.000 USD üstünde %0,15 ile %3,5 arası.',
    abonelik: 'Platform kullanım ücreti, yılda yaklaşık 1.100 ile 1.400 Çin yuanı (CNY) arası.',
    reklam: 'Site içi reklam sistemi. Üst paketlerde ön ödemeli kredi.',
    ucretsiz: 'Ücretsiz kademe yok.',
    duvar: 'Kayıt anı. Şubat 2019’dan beri her yeni hesap platform kullanım ücreti öder.',
    gelirKaynagi: K.pai,
    ucretsizKaynagi: K.amz123,
  },
];

/** istoc.com bugün: tanıştıran kümede. Sitenin karşılaştırmasıdır. Değerler canlı paket anlık görüntüsünden türetilir. */
const [ILK, ORTA, SON] = PAKET_SIRASI;
const adi = (id: (typeof PAKET_SIRASI)[number]) => paket(id).ad;
/** istoc.com’da bugün bulunan katmanlar: canlı pakette karşılığı olan katman. */
const ISTOC_KATMAN_ADAYLARI: (Katman | null)[] = [
  KOMISYON_YOK ? null : 'komisyon',
  CANLI_PAKETLER.some((p) => p.aylikEur !== 0) ? 'abonelik' : null,
  ilkPaket('feature.marketing.keyword_ads') ? 'reklam' : null,
  ilkPaket('feature.storefront.manufacturer_badge_tier') ? 'guven' : null,
];
export const ISTOC = {
  ad: 'istoc.com',
  kume: 'tanistiran' as KumeId,
  katmanlar: ISTOC_KATMAN_ADAYLARI.filter((k): k is Katman => k !== null),
  ozet: 'iStoc ödemeyi tutmaz ve aracılık etmez. Alıcı ödemeyi satıcıya yapar. Tek ödeme seçeneği sunulursa alıcı bütün sepeti Thoptan.com’a öder.',
  komisyon: KOMISYON_METNI,
  abonelik: `${CANLI_PAKETLER.length} paket var. Aylık ${fiyatMetni(paket(ILK).aylikEur)} ile başlar.`,
  reklam: `Anahtar kelime reklamı ${bas('feature.marketing.keyword_ads')}. Öne çıkan ürün hakkı ${bas('quota.featured_listings_monthly')}.`,
};

export const DHGATE_NOTU = 'DHgate oranları platform duyurularını aktaran sektör basınından alındı. Belgenin yazarı resmî satıcı sayfasını açamadı.';

/** Büyüme ve elde tutma: satıcıyı içeride tutan altı katman. */
export type IstocDurum = 'var' | 'kismen' | 'planlandi' | 'yok';
export const ISTOC_DURUM_ADI: Record<IstocDurum, string> = {
  var: 'istoc.com’da var',
  kismen: 'Kısmen var',
  planlandi: 'Planlanıyor',
  yok: 'Henüz yok',
};
export interface Ornek {
  platform: string;
  metin: string;
  kaynaklar: Kaynak[];
  /** Belgede kaynağı gösterilmeyen cümle. Sayfada ayrı bir notla görünür. */
  kaynaksiz?: string;
}
const o = (platform: string, metin: string, kaynaklar: Kaynak[], kaynaksiz?: string): Ornek => ({ platform, metin, kaynaklar, ...(kaynaksiz ? { kaynaksiz } : {}) });

export interface TutmaKatmani {
  id: string;
  ad: string;
  neden: string;
  ornekler: Ornek[];
  istoc: { durum: IstocDurum; metin: string };
}

/** Gelir modelleri sayfasındaki planlanan hizmetin hazırlık adı (“Hazır”, “Yakında”, “Hazır değil”). */
const hazirlik = (id: string) => {
  const m = MODELLER.find((x) => x.id === id);
  if (!m) throw new Error(`Gelir modellerinde olmayan model: ${id}`);
  return HAZIRLIK_ADI[m.hazirlik];
};

export const TUTMA_GIRIS = 'Satıcıyı platformda tutan şey yönetim paneli değildir. Satıcıyı, başka yerde bulamadığı üç şey tutar. Alıcıların ne aradığını görür. Parasını güvenle alır. Parasını hızlı ya da önceden alabilir. Platformlar bunu altı katmanda kuruyor.';
export const ISTOC_KUTU_NOTU = `Her katmandaki istoc.com kutusu sitenin karşılaştırmasıdır. Bu bilgi belgede yok. Kutulardaki paket bilgisi istoc.com’dan ${OKUNDU} günü okundu.`;

export const TUTMA_KATMANLARI: TutmaKatmani[] = [
  {
    id: 'talep-verisi',
    ad: 'Talep verisi ve analitik',
    neden: '“Kim baktı, ne arıyor” verisi satıcıyı her gün yönetim paneline geri getirir.',
    ornekler: [
      o('Europages', 'Premium profildeki “Your visitors” ekranı, profili ziyaret eden şirketleri adıyla gösterir. “Business Insights” ayrı bir panodur.', [K.epZiyaretci]),
      o('Kompass', 'Booster paketleri ziyaret ve tıklama sayısını verir. Aylık performans raporu da verir. Şirket sitesine verilen bağlantıların raporu (backlink) da pakettedir.', [K.kompassBooster]),
      o('Global Sources', 'Supplier Center satış fırsatlarını ve alıcı sorularını yönetir. Fuar öncesinde ön kayıtlı alıcı listesi açılır.', [K.gsBrosur]),
    ],
    istoc: {
      durum: 'kismen',
      metin: `Temel analitik ${bas('feature.analytics.basic')}. Gelişmiş raporlar ${bas('feature.analytics.advanced')}. istoc.com satıcı paketlerinde ziyaretçi kimliği diye bir özellik yok.`,
    },
  },
  {
    id: 'teklif-istegi',
    ad: 'Teklif isteği ve talep eşleştirme',
    neden: 'Satıcı beklemez. Açık bir talebe kendisi teklif verir.',
    ornekler: [
      o('Europages Request Hub', 'Doğrulanmış talepler yapay zekâ ile satıcı profiline eşleştirilir. Almanya’daki B2B dizini wlw’nin ve Alibaba.com’un talepleri de aynı havuza akar.', [K.requestHub]),
      o('Global Sources', 'Satıcının günde verebileceği teklif sayısı üyeliğine göre değişir. Fuara katılan satıcı günde 5 teklif verir. 1 ile 5 yıldızlı üye günde 10 teklif verir. 6 yıldızlı üye günde 20 teklif verir.', [K.gsTeklif]),
      o('AliExpress Business', 'Küçük işletmelere ve stok tutmadan satan alıcılara (dropshipping) teklif isteği araçları sunar. Adede göre değişen toptan fiyat da sunar.', [K.worldfirst]),
      o('Kompass', 'Booster aboneleri özel ihalelere erişir. International pakette yurt dışı ihaleler sınırsızdır.', [K.kompassBooster]),
    ],
    istoc: {
      durum: 'kismen',
      metin: `Alıcı bir teklif isteğiyle birden fazla satıcıdan teklif alır. Satıcının yanıt hakkı ${adi(SON)} paketinde ${kota(deger('quota.rfq_quotes_monthly', SON))}. ${adi(ORTA)} paketinde bu hak ${kota(deger('quota.rfq_quotes_monthly', ORTA))}. ${adi(ILK)} paketinde bu hak ${kota(deger('quota.rfq_quotes_monthly', ILK))}.`,
    },
  },
  {
    id: 'odeme-guvencesi',
    ad: 'Emanet ödeme ve ödeme güvencesi',
    neden: 'Alıcıyı platform içinde ödemeye ikna eden şey güvendir.',
    ornekler: [
      o('DHgate', 'Ödeme platformda tutulur. Alıcı teslimatı onaylayınca para satıcıya geçer.', [K.fastlane]),
      o('AliExpress', 'Aynı düzen işler. Satıcı parayı alıcı teslimatı onayladıktan sonra alır.', [K.saleslayer]),
      o('Faire', 'Emanet yerine vade garantisi kurar. Perakendeci 60 gün vadeyle alır. Gecikme, dolandırıcılık ve ödememe (temerrüt) riskini Faire üstlenir.', [K.faireFiyat]),
    ],
    istoc: {
      durum: 'kismen',
      metin: `Ticaret Güvencesi ${bas('feature.commerce.trade_assurance')}. Güvence sipariş koşullarını kayıt altına alır. Sorun çıkarsa alıcı şikâyet kaydı açar. iStoc ödemeyi tutmaz. “Gelir modelleri” sayfasında emanet ödemenin durumu “${hazirlik('guvenli-odeme')}”.`,
    },
  },
  {
    id: 'finansman',
    ad: 'Finansman ve nakit hızı',
    neden: 'Satıcı ihtiyaç duyduğu parayı platformdan alır. Bu yüzden platformdan ayrılmak istemez.',
    ornekler: [
      o('Faire', 'Satıcı ödeme hızını kendisi seçer. Seçenekler ertesi gün, 30 gün ve 60 gündür.', [K.faireFiyat]),
      o('Walmart Marketplace Capital', 'Satış geçmişine göre nakit avans verir. Üç program vardır. En az altı aylık satış geçmişi gerekir.', [K.walmartCapital]),
      o('DHgate', 'DHgate kendini şöyle tanımlar: kargo, yurt dışı ödeme ve internetten finansman hizmetini birlikte sunan platform. Belgenin yazarı güncel kredi ürününün koşullarını doğrulayamadı.', [K.dhgateBulten]),
    ],
    istoc: {
      durum: 'yok',
      metin: `“Gelir modelleri” sayfasında vadeli satışın durumu “${hazirlik('vadeli-satis')}”. Bu hizmet için sipariş ve ödemenin platformdan geçmesi gerekir.`,
    },
  },
  {
    id: 'lojistik',
    ad: 'Lojistik ve depolama',
    neden: 'Satıcının malı platformun deposundaysa satıcının platformdan ayrılması zorlaşır.',
    ornekler: [
      o('Walmart WFS', 'Kayıt ve aylık ücret yoktur. Ücret birim başınadır. Karşılığında hızlı teslimat etiketi gelir.', [K.ecomclips]),
      o(
        'AliExpress Choice',
        'Mart 2023’te açıldı. Alibaba’nın lojistik şirketi Cainiao’nun ortak depolarıyla çalışır.',
        [K.alibaba],
        'Yarı yönetimli modelde fiyatı satıcı belirler. Lojistiği ve iadeyi platform üstlenir.',
      ),
      o('Faire Insider', 'Üye perakendeciye binlerce markada ücretsiz kargo verir. Maliyetin çoğunu Faire karşılar.', [K.faireInsider]),
    ],
    istoc: {
      durum: 'kismen',
      metin: `Kargo entegrasyonu ${bas('feature.functional.cargo_integration')}. Sevkiyat takibi ${bas('feature.logistics.insured_shipping')}. “Gelir modelleri” sayfasında toplu kargo anlaşmasının durumu “${hazirlik('lojistik')}”.`,
    },
  },
  {
    id: 'cevrim-disi',
    ad: 'Fuar ve yüz yüze buluşma',
    neden: 'Bu katman yalnız Global Sources’ta var.',
    ornekler: [o('Global Sources', 'Hong Kong fuarları, sanal fuarlar ve MATCH birebir eşleştirme hizmeti çevrim içi üyelikle birlikte satılır.', [K.gsBrosur])],
    istoc: {
      durum: 'kismen',
      metin: `Fuar ve etkinlik daveti ${bas('feature.support.event_invitations')}. “Gelir modelleri” sayfasında İstoç çarşısındaki eşleştirme günlerinin durumu “${hazirlik('eslestirme-etkinlikleri')}”.`,
    },
  },
];

export const KAYNAKSIZ_NOTU = 'Belgede bu cümlenin kaynağı gösterilmedi.';
export const TUTMA_CIKARIMI =
  'Emanet ödeme, vade ve avans ancak ödeme platformdan geçerse kurulabilir. Dizin modelinde satıcıyı tutmak için talep verisine dayanmak gerekir. Bu veri iki şeydir: alıcıların teklif istekleri ve profili ziyaret eden şirketlerin adları.';

/** Gelir kalıpları. */
export interface GelirKalibi {
  id: string;
  ad: string;
  ozet: string;
  ornekler: Ornek[];
  not?: string;
}

export const GELIR_GIRIS = 'İşlem komisyonu yedi platformun yalnız dördünde var. Abonelik, reklam ve ödeme ücreti her modelde komisyonun yanına ya da yerine konuyor.';

export const GELIR_KALIPLARI: GelirKalibi[] = [
  {
    id: 'katmanli-abonelik',
    ad: 'Katmanlı abonelik',
    ozet: 'Dizin modelinin ana geliridir. Paketler birbirinden üç şeyle ayrılır: dil sayısı, ürün sınırı ve talebin kapsamı.',
    ornekler: [
      o('Kompass', 'Booster Premium 2 dil ve yurt içinde öncelikli sıra verir. Booster International 26 dil, dil başına 200 ürün ve 25 katalog verir. International yurt dışı taleplerini de ekler.', [K.kompassBooster]),
      o('Global Sources', 'İki yıllık “Advanced” paket 1.200 ürün vitrini ve 150 video içerir. Paket 5 alt hesap ve günde 15 teklif hakkı da verir.', [K.gsPaket]),
      o('Europages', 'Ürün ve hizmet sayısı pakete göre sınırlanır. Üst paket sınırı büyütür.', [K.epProfil]),
    ],
  },
  {
    id: 'tiklama-basi',
    ad: 'Tıklama başına ücretli reklam',
    ozet: 'İşlem modelinde komisyondan sonraki ikinci gelir katmanıdır.',
    ornekler: [
      o(
        'Faire Promoted Listings',
        'Reklamın tıklama fiyatını satıcı değil Faire belirler. Faire bunu tıklamanın siparişe dönme olasılığına göre yapar. En düşük aylık bütçe 200 USD, 150 EUR ya da 125 İngiliz sterlinidir (GBP).',
        [K.faireTiklama, K.faireButce],
      ),
      o('Walmart Connect', 'Sponsored Search yalnız tıklamada ücretlenir.', [K.walmartReklam]),
      o(
        'DHgate',
        'Platform kullanım ücretiyle reklam kredisi hediye edilir. Kredi doğrudan reklam hesabına yüklenir. Üst paketlerde bedelin çoğu ön ödemeli reklamdır. Örneğin 29.800 CNY’lik paketin 24.000 CNY’si reklamdır.',
        [K.amz123, K.cls],
      ),
    ],
  },
  {
    id: 'sabit-gorunurluk',
    ad: 'Sabit fiyatlı görünürlük',
    ozet: 'Bazı dizin modeli platformları tıklama başına ücret almaz. Bunun yerine üst sıraları sabit fiyatla satar.',
    ornekler: [
      o('Europages Top Ranking', 'Reklam kategorisindeki ilk üç sıra sabit fiyatla satılır. Sırayı ilk başvuran alır.', [K.topRanking]),
      o('Global Sources', 'Paketle 324.000’e kadar sıralama puanı (SAB puanı) gelir. Bu puan ana sayfadaki sıralama alanına çevrilir. Tıklama ücreti yoktur.', [K.gsPaket]),
    ],
  },
  {
    id: 'odeme-ucreti',
    ad: 'Ödeme ve nakit hızı ücreti',
    ozet: 'Komisyondan bağımsızdır ve her işlemde alınır.',
    ornekler: [
      o('Faire', 'Satıcı parasını ertesi gün isterse %3,5 öder. 30 gün sonra isterse %2,4 öder. 60 gün sonra isterse %1,9 öder. Her ödemeye 0,30 USD eklenir. Faire Direct siparişinde komisyon sıfırdır. Ama bu ücret kalır.', [K.faireFiyat]),
      o('Walmart Marketplace Capital', 'Parafin programında tek bir sabit sermaye ücreti alınır. Geri ödeme satışın yüzdesiyle yapılır.', [K.pymnts]),
    ],
  },
  {
    id: 'alici-aboneligi',
    ad: 'Alıcı tarafında abonelik',
    ozet: 'Bu kalıp yalnız Faire’de var.',
    ornekler: [o('Faire Insider', 'Ayda 19,99 USD tutar ve 30 günlük ücretsiz denemeyle başlar.', [K.faireInsider])],
  },
  {
    id: 'guven-rozeti',
    ad: 'Doğrulama ve güven rozeti',
    ozet: 'Üç ayrı fiyat mantığı görülüyor.',
    ornekler: [
      o('Global Sources', 'Verified Supplier doğrulamasını SGS, Experian ve TÜV SÜD gibi bağımsız kuruluşlar yapar. Statü ücretli üyeliğin parçasıdır.', [K.gsBrosur]),
      o('Kompass', '“Trusted supplier” sertifikası Booster paketine dahildir.', [K.kompassBooster]),
      o('Walmart', 'Pro Seller rozeti satılmaz. Rozet satış performansıyla kazanılır. İkincil kaynaklara göre rozet %10 komisyon indirimi getirir.', [K.feedvisor]),
    ],
  },
  {
    id: 'veri-api',
    ad: 'Veri ve yazılım bağlantısı (API)',
    ozet: 'Veri satan platform var. Yazılım bağlantısı (API) satan platform yok.',
    ornekler: [
      o('Kompass', 'Şirket bilgilerini ayrı bir ürün olarak satar. EasyBusiness aboneliği 70 ülkede 60 milyondan fazla şirketi kapsar.', [K.kompassFiyat]),
      o('AliExpress', 'API’yi gelir kalemi olarak sunmaz. API, satıcının kendi sistemini platforma bağladığı bir araçtır.', [K.aeBulten]),
    ],
    not: 'Belgenin yazarı taradığı kaynaklarda yedi platformun hiçbirinde ayrı bir API erişim ücreti görmedi.',
  },
  {
    id: 'fiyata-gomme',
    ad: 'Komisyonu alıcı fiyatına ekleme',
    ozet: 'Satıcı eline geçecek tutarı girer. Komisyonu alıcının ödediği fiyat taşır.',
    ornekler: [o('DHgate', 'Satıcı eline geçecek fiyatı girer. Platform komisyonu alıcı fiyatına ekler. Oran sipariş büyüdükçe düşer. Bu düzen toptan sepeti teşvik eder.', [K.cls])],
  },
];

export const GELIR_CIKARIMI = 'Komisyon tek başına belli bir sınırın üstüne çıkamaz. Bu yüzden platformlar aynı satıştan reklam ücreti de alır. Ödeme hızı için de ücret alırlar. Böylece aynı satıştan ikinci ve üçüncü gelir elde edilir.';
export const GELIR_TABLO_NOTU = `${DHGATE_NOTU} istoc.com satırı sitenin karşılaştırmasıdır ve belgede yoktur.`;

/** Ücretsiz başlangıç (freemium) ve ödeme duvarı (paywall). */
export const DUVAR_TANIMI = 'Ödeme duvarı, ücretsiz kullanımın bitip ödemenin başladığı noktadır.';
export const DUVAR_GIRIS =
  'Beş platform satıcı kaydını ve temel vitrini kalıcı olarak ücretsiz veriyor. Global Sources deneme sunuyor. DHgate girişte ücret alıyor. Ödeme duvarı işlem modelinde ilk satışta başlıyor. Dizin modelinde ise satıcı daha çok alıcıya ulaşmak isteyince başlıyor.';

/** Ödeme duvarı şeması: belgede yok. Öğeler belgenin tablosundan seçildi. Bugünkü an ile belgenin önerdiği an ayrı yazılır. */
export interface DuvarSemasi {
  id: string;
  ad: string;
  ucretsiz: string[];
  bugun: string;
  oneri: string;
  ucretli: string[];
}
export const DUVAR_SEMA_NOTU = 'Bu şema belgede yok. Şemadaki öğeleri bu sayfa belgenin tablosundan seçti.';
export const DUVAR_SEMASI: DuvarSemasi[] = [
  {
    id: 'islem',
    ad: 'İşlem modeli',
    ucretsiz: ['Mağaza açılışı', 'Listeleme', 'Kurulum'],
    bugun: 'Ödeme duvarı bugün ilk satışta başlıyor.',
    oneri: 'Belge duvarın ilk satışta kalmasını önerir.',
    ucretli: ['Komisyon', 'Ödeme ücreti', 'Görünürlük reklamı'],
  },
  {
    id: 'dizin',
    ad: 'Dizin modeli',
    ucretsiz: ['Şirket profili', 'Alıcı araması', 'Teklif isteği'],
    bugun: 'Ödeme duvarı bugün satıcı daha çok alıcıya ulaşmak isteyince başlıyor.',
    oneri: 'Belge duvarı ilk nitelikli talebe taşımayı önerir.',
    ucretli: ['Teklif kotası', 'Ziyaretçi kimliği', 'Üst sıra'],
  },
];

export interface Ilke {
  id: string;
  ad: string;
  metin: string;
  kaynaklar?: Kaynak[];
  maddeler?: Ornek[];
}

export const DUVAR_ILKELERI: Ilke[] = [
  {
    id: 'alici-ucretsiz',
    ad: 'Alıcı her yerde ücretsizdir',
    metin:
      'Talebi alıcı getirir. Taranan kaynaklarda hiçbir platform alıcıdan para almıyor. Bu kural arama, mesaj ve teklif isteği için geçerlidir. Tek ücretli alıcı ürünü Faire Insider’dır. Bu ürün gönüllü bir sadakat aboneliğidir.',
  },
  {
    id: 'kendi-musterisi',
    ad: '“Kendi müşterinizi getirin” teşviki',
    metin:
      'Satıcı müşterisini kendi bağlantısıyla getirirse Faire Direct’te %0 komisyon öder. Platform böylece ücretsiz alıcı kazanır. Faire yeni gelen perakendeciye bir yıl ücretsiz kargo verir.',
    kaynaklar: [K.faireFiyat],
  },
  {
    id: 'kota',
    ad: 'Kotayla sınırlama',
    metin: 'Ücretsiz kullanan satıcı platformun işine yaradığını görür. İşi büyüyünce ücretsiz sınır yetmez.',
    maddeler: [
      o('Global Sources', 'Teklif kotası üyelik düzeyiyle günde 5’ten 20’ye çıkar.', [K.gsTeklif]),
      o('Kompass', 'Giriş kademesi 5 ürün gösterir. International pakette sınır dil başına 200 üründür.', [K.kompassBooster]),
      o('Europages', 'Ürün sınırı pakete bağlıdır.', [K.epProfil]),
    ],
  },
  {
    id: 'kimlik',
    ad: 'Alıcının kimliği sonradan açılır',
    metin: 'Europages Request Hub alıcının bilgisini satıcı yanıt verene kadar gizler. Profili kimin ziyaret ettiği ise yalnız Premium pakette görünür.',
    kaynaklar: [K.requestHub, K.epZiyaretci],
  },
  {
    id: 'yeni-satici',
    ad: 'Yeni satıcıya destek',
    metin: 'Ödeme duvarı kalkmaz. Yalnız ertelenir.',
    maddeler: [
      o(
        'Walmart',
        'Satıcının ilk 50.000 USD cirosunda komisyon %20 indirimlidir. 50.000 ile 500.000 USD arasında indirim %30’dur. Walmart 500 USD Walmart Connect kredisi ve 1.000 USD arama motoru reklam kredisi de verir.',
        [K.walmartYeni],
      ),
      o('AliExpressDirect', 'ABD yerel satıcılarına tanıtım döneminde %0 komisyon uygular. Ücretsiz müşteri hizmeti desteği de verir.', [K.aeBulten]),
      o('Faire', '“No Commission Trial” programı 1 Ağustos 2026 tarihlidir. Program deneme süresinde komisyonu ve yeni müşteri ücretini kaldırır. Ödeme ücreti kalır.', [K.faireDeneme]),
    ],
  },
  {
    id: 'giriste-duvar',
    ad: 'Girişte duvar (ters örnek)',
    metin: 'DHgate kayıt anında ücret alır. Süresi dolan hesabın ürünleri yayından kalkar. Ücret düşük kaliteli satıcıyı eler. Ama DHgate satıcıyı iki şeyle çeker. Bunlar çok sayıda alıcı ve sipariş büyüdükçe düşen komisyondur.',
    kaynaklar: [K.amz123],
  },
];

export const DUVAR_CIKARIMI = 'Satıcıdan ücret almaya, satıcı platformun işine yaradığını görünce başlayın. İşlem modelinde bu an ilk satıştır. Dizin modelinde ise ilk nitelikli taleptir.';
export const NITELIKLI_TALEP_NOTU = 'Belge “nitelikli talep” terimini tanımlamaz. Bu sayfa onu ürünü, adedi ve iletişim bilgisi doğrulanmış bir alım isteği olarak okur.';

/** Yeni platform için modül sırası: üç faz ve iki kapı. Şema belgede yok. Fazlar belgenin metninden kuruldu. */
export interface Faz {
  no: number;
  ad: string;
  metin: string;
  modul: string[];
}
export interface Kapi {
  no: number;
  ad: string;
  metin: string;
}
export const FAZLAR: Faz[] = [
  { no: 1, ad: 'Talebi topla', metin: 'Alıcı aramayı ve teklif isteğini ücretsiz kullanır. Müşterisini getiren satıcı komisyon ödemez.', modul: ['Ücretsiz arama', 'Ücretsiz teklif isteği', 'Kendi müşterisinde %0 komisyon'] },
  { no: 2, ad: 'İşlemi ölç', metin: 'Komisyon sipariş büyüklüğüne bağlanır. Satıcı teklif hakkını kotayla alır.', modul: ['Azalan oranlı komisyon', 'Kotalı teklif hakkı', 'Ödeme ücreti'] },
  { no: 3, ad: 'Ziyaretleri ve veriyi sat', metin: 'Önceki fazlarda gelen alıcı ziyaretleri ve işlem verisi satılır.', modul: ['Reklam', 'Abonelik'] },
];
export const KAPILAR: Kapi[] = [
  { no: 1, ad: 'İlk nitelikli talep ya da ilk satış', metin: 'Satıcı platformun işine yaradığını burada görür. Ücretli kullanım burada başlar.' },
  { no: 2, ad: 'Yeterli alıcı ziyareti ve işlem verisi', metin: 'Reklam ve abonelik ancak satılacak ziyaret ve veri olunca değer taşır.' },
];
export const SIRA_GIRIS = 'Reklam ve abonelik en sona kalır. İkisi de önceki fazlarda gelen alıcı ziyaretlerini ve işlem verisini satar.';
export const SIRA_NOTU =
  'Belgedeki “3 faz, 2 kapı” şeması metinde yok. Fazları ve kapıları bu sayfa belgenin metninden kurdu. Fazlar belgenin üç kuralından gelir. Birinci fazdaki ücretsiz arama “alıcı her yerde ücretsiz” ilkesinden gelir. Kapılar belgenin ödeme duvarı çıkarımından ve bu bölümün ilk cümlesinden gelir.';
export const SIRA_ISTOC = 'istoc.com bugün bu fazdan başlıyor. Bu bilgi sitenin karşılaştırmasıdır.';

export const SIRA_KURALLARI: { ad: string; metin: string }[] = [
  { ad: 'Komisyonu sipariş büyüklüğüne bağlayın.', metin: 'DHgate’in azalan oranlı yapısı toptan sepeti ödüllendirir. Faire’in düz %15’i küçük perakendeci siparişine göre kurulmuştur.' },
  { ad: 'Müşterisini getiren satıcıya %0 uygulayın.', metin: 'Faire Direct, ilk alıcıları bulma sorununu satıcının kendi müşteri listesiyle çözer. Platform yine de ödeme ücretini alır.' },
  { ad: 'Teklif isteğini alıcıya ücretsiz verin ve satıcıya kotayla açın.', metin: 'Global Sources ve Europages talebi ücretsiz toplar. Para teklif hakkından ve alıcı kimliğinden kazanılır.' },
];

/** istoc.com için sonuç: sitenin karşılaştırması. Belgede yoktur. Değerler canlı veriden türetilir. */
export const ISTOC_SONUC = {
  baslik: 'istoc.com bu haritada nerede?',
  etiket: 'Sitenin karşılaştırması. Belgede yok.',
  maddeler: [
    'istoc.com tanıştıran kümededir. Ödeme satıcıya ya da Thoptan.com’a gider. iStoc ödemeyi tutmaz.',
    'Bu yüzden satıcıyı tutacak katman talep verisidir. Bu veri iki şeydir: alıcıların teklif istekleri ve profili ziyaret eden şirketlerin adları.',
    `Belgeye göre abonelik en son kurulmalıdır. istoc.com ise bugün işe abonelikle başlıyor. ${KOMISYON_YOK ? 'Komisyon şu an alınmıyor.' : `Komisyon ${KOMISYON_METNI}.`}`,
    `Belge teklif isteğini satıcıya kotayla açmayı önerir. Bugün teklif isteğine yanıt hakkı istoc.com’da ${bas('quota.rfq_quotes_monthly')}.`,
    'Belgenin kuralına göre ödemenin başladığı an, satıcının platformdan fayda gördüğü ana yaklaşmalıdır. Dizin modelinde bu an ilk nitelikli taleptir.',
  ],
};

export const KAYNAK_NOTU =
  'Belgenin yazarı aşağıdaki sayfaları açıp okudu. Yazar bazı sayfaları açamadı. Bunlar Kompass paket sayfası, Global Sources teklif yardım sayfası, DHgate komisyon duyuruları ve Walmart sayfalarıdır. Bu sayfaların verileri arama sonucu özetlerinden alındı. “İkincil kaynak” etiketli veriler platformun kendi yayını değildir.';
const SAYFA_ETIKETLI = Object.values(K as Record<string, Kaynak>).filter((k) => k.ikincil === 'sayfa');
const BELGE_ETIKETLI = Object.values(K as Record<string, Kaynak>).filter((k) => k.ikincil === 'belge');
export const IKINCIL_NOTU = `Belge ${BELGE_ETIKETLI.length} kaynağı “ikincil kaynak” diye etiketledi. Bu sayfa platformun kendi yayını olmayan ${SAYFA_ETIKETLI.length} kaynağı daha etiketledi. Bunlar ${liste(SAYFA_ETIKETLI.map((k) => site(k.url)))} sayfalarıdır.`;

export const OKUNAN_KAYNAKLAR: { platform: string; kaynaklar: Kaynak[] }[] = [
  { platform: 'Europages', kaynaklar: [K.visableUrun, K.requestHub] },
  { platform: 'Kompass', kaynaklar: [{ ...K.kompassFiyat, ad: 'Kompass North America fiyat duyurusu' }] },
  { platform: 'Global Sources', kaynaklar: [K.gsBrosur, { ...K.gsPaket, ad: 'Global Sources iki yıllık paket duyurusu' }] },
  { platform: 'Faire', kaynaklar: [K.faireFiyat, K.faireInsider, K.faireButce] },
  { platform: 'DHgate', kaynaklar: [{ ...K.amz123, ad: 'Platform kullanım ücreti SSS (DHgate kaynaklı, AMZ123’te yayımlandı)' }] },
  { platform: 'AliExpress', kaynaklar: [K.aeBulten] },
];
