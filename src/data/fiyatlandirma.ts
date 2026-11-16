/**
 * Fiyatlandırma önerisi (kullanıcı isteği 2026-11-12, adres `/pricing/`): istoc.com fiyat planlarının eleştirisi,
 * paket fiyatları ve kapsamları, deneme süresi ve paket dışı ek modüller. Paket adları istoc.com’daki adlardır
 * (kullanıcı kararı 13 Kasım 2026, 5.3). Ücretsiz paketin sınırları `UCRETSIZ_SINIRLAR` kararına uyar.
 *
 * İki ayrı ad kullanılır:
 * - “istoc.com fiyat planları”: canlı sitedeki paketler (`canliPaketler.ts` anlık görüntüsü).
 * - “Fiyat tablosu”: sitenin kararlaştırılmış fiyatı, `paketler(params)` (gelir modelleri sayfası). Yayında herkes
 *   varsayılan parametreleri gördüğü için sayfa `DEFAULT_PARAMS` kullanır.
 *
 * Kurallar:
 * - Sayfa öneridir. Fiyat tablosu, istoc.com fiyat planları ve gelir planı parametreleri değişmez. Fiyat kuralı ve
 *   “indirim söz konusu değildir” kararı (2026-11-10) korunur. Öneri indirim, pazarlık ya da kişiye özel süre içermez.
 *   Ücretsiz paket herkes için aynı kuraldır. Önerilen Basic ve Platinium fiyatı fiyat tablosundan gelir.
 * - Bugünkü değerler canlı anlık görüntüden türetilir. Metne elle bugünkü fiyat, kota ya da paket adı yazılmaz.
 *   Her eleştiri yalnız koşulu canlı veride hâlâ geçerliyse görünür. Pakette olmayan özellik maddesi yazılmaz.
 * - Önerinin yeni sayıları (`ONERI_SAYILARI`) başlangıç değeridir. Basic ve Platinium teklif yanıt kotası Alibaba.com
 *   Starter ve Growth paketlerine dayanır. Sayfa bunu yazar.
 * - Ek modüllerin hazırlığı ve örnek hesabı gelir modellerinden gelir (`gelirModelleri.ts`). Hazır olmayan modül satılmaz.
 * - Küresel fiyatlar 12 Kasım 2026 Perşembe günü okundu. Kur TCMB’nin 12 Kasım 2026 döviz satış kurudur.
 * Açıklamalar tam cümledir. Noktalı virgül ve uzun çizgi yoktur (`tests/fiyatlandirma.spec.ts`).
 */
import { CANLI_DENEME_GUN, CANLI_DENEME_PAKETI, CANLI_GRUPLAR, CANLI_KAYNAK, CANLI_PAKETLER, type CanliPaket, type OzellikDegeri, type PaketId } from './canliPaketler';
import { KATEGORILER } from './degerOnerisi';
import { HAZIRLIK_ADI, MODELLER, UCRETSIZ_URUN, paketler, type GelirModeli } from './gelirModelleri';
import { int, sayiBicimi, tl } from '../lib/format';
import { PAKET_SIRASI, bas, deger, degerMetni, destekMetni, eur, fiyatMetni, ilkPaket, kota, paket, pakette } from './hizmetler';
import { KURESEL_KAYNAK } from './kuresel';
import { DEFAULT_PARAMS } from './params';

export interface Kaynak {
  ad: string;
  url: string;
  ikincil?: 'belge' | 'sayfa' | true;
}

/** Türkçe liste: “a, b ve c”. */
const liste = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ve ${xs[xs.length - 1]}`);
/** Sayı biçimi ortak işlevden gelir (`src/lib/format.ts`). */
const sayi = (n: number, basamak = 0) => sayiBicimi(basamak)(n);
const buyukHarf = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
/** Sayıdan sonra gelen üçüncü tekil iyelik eki: “%79’u”, “%80’i”, “%6’sı”. Sayının okunuşundaki son ünlüye göre seçilir. */
export function iyelik(n: number): string {
  const birler = ['', 'i', 'si', 'ü', 'ü', 'i', 'sı', 'si', 'i', 'u'];
  const onlar = ['ı', 'u', 'si', 'u', 'ı', 'si', 'ı', 'i', 'i', 'ı'];
  const t = Math.abs(Math.round(n));
  if (t === 100) return 'ü';
  return t % 10 ? birler[t % 10] : onlar[Math.floor(t / 10) % 10];
}

/* ---------- Kaynaklar (12 Kasım 2026 Perşembe günü okundu) ---------- */

export const R = {
  saticiOl: { ad: 'istoc.com/satici-ol, 12 Kasım 2026 Perşembe günü açıldı', url: 'https://istoc.com/satici-ol' },
  planlar: { ad: 'istoc.com satıcı paketleri', url: CANLI_KAYNAK.sayfa },
  tcmb: { ad: 'TCMB gösterge kurları, 12 Kasım 2026 Perşembe', url: 'https://www.tcmb.gov.tr/kurlar/202611/12112026.xml' },
  asgariBloomberg: { ad: 'Bloomberg HT: 2026 asgari ücret', url: 'https://www.bloomberght.com/2026-asgari-ucret-resmi-gazete-de-yayimlandi-3764782', ikincil: true },
  asgariKpmg: { ad: 'KPMG Vergi: 2026 asgari ücret', url: 'https://kpmgvergi.com/yayinlar/mali-bultenler/sosyal-guvenlik/2026-yili-asgari-ucreti-aciklandi/3342', ikincil: true },
  alibabaAbd: { ad: 'Alibaba.com satıcı paketleri (ABD)', url: 'https://seller.alibaba.com/us' },
  alibabaFiyat: { ad: 'Alibaba.com üyelik karşılaştırması', url: 'https://seller.alibaba.com/pricing' },
  alibabaBlog: { ad: 'Alibaba.com Gold Supplier yazısı', url: 'https://seller.alibaba.com/blogs/2026/southeast-asia/food-beverage/gold-supplier-membership-guide-alibaba-b2b' },
  alibabaCin: { ad: 'Alibaba.com Çin üyelik ücretleri (2022)', url: 'https://supplier.alibaba.com/article/CTGQY294SPV.htm' },
  alibabaGuvence: { ad: 'Alibaba.com Trade Assurance', url: 'https://tradeassurance.alibaba.com/' },
  indiamartPaket: { ad: 'IndiaMART ücretli hizmetler', url: 'https://help.indiamart.com/knowledge-base/paid-services-of-indiamart' },
  indiamartMdc: { ad: 'IndiaMART Mini Dynamic Catalog', url: 'https://help.indiamart.com/knowledge-base/mdc' },
  indiamartTrust: { ad: 'IndiaMART TrustSEAL Pro', url: 'https://help.indiamart.com/knowledge-base/trustseal-pro/' },
  indiamartYatirimci: { ad: 'IndiaMART yatırımcı sunumu, Temmuz 2026', url: 'https://investor.indiamart.com/public/announcements/InvestorPresentation.pdf' },
  tradeindiaGold: { ad: 'TradeIndia VIP Gold', url: 'https://www.tradeindia.com/special-offers/vip-gold-international.html' },
  tradeindiaDogrulama: { ad: 'TradeIndia Verified Seller', url: 'https://www.tradeindia.com/special-offers/tradeindia-verified-seller.html' },
  turkishexporter: { ad: 'TurkishExporter üyelik paketleri', url: 'https://www.turkishexporter.com.tr/tr/home/membershippackage/' },
  endustrideAra: { ad: 'Endüstride Ara tedarikçi üyeliği', url: 'https://tekliftopla.endustrideara.com/uye-tedarikci-ol/' },
  europagesYardim: { ad: 'Europages ücretli hizmetler', url: 'https://help.europages.com/en/supplier/how-do-i-get-premium-services-on-europages' },
  ticimax: { ad: 'Ticimax fiyatları', url: 'https://www.ticimax.com/fiyatlar' },
  kompassVeri: { ad: 'Salesdorado: Kompass', url: 'https://salesdorado.com/en/sdr-tools/opinion-kompass/', ikincil: true },
  chartmogul: { ad: 'ChartMogul abonelik yazılımı (SaaS) dönüşüm raporu, Şubat 2026', url: 'https://chartmogul.com/reports/saas-conversion-report/' },
  chartmogul2: { ad: 'ChartMogul abonelik yazılımı (SaaS) dönüşüm raporu, 2. bölüm', url: 'https://chartmogul.com/reports/saas-conversion-report-2/' },
  growthUnhinged: { ad: 'Growth Unhinged: ters deneme rehberi', url: 'https://www.growthunhinged.com/p/your-guide-to-reverse-trials' },
} satisfies Record<string, Kaynak>;

/* ---------- Kur, asgari ücret ve fiyat tablosu ---------- */

/** TCMB döviz satış kuru, 12 Kasım 2026. */
export const KUR = { eur: 55.7353, usd: 50.2595 };
/** 2026 net asgari ücret (aylık, TL). Resmî Gazete 26 Aralık 2025. Kaynak ikincildir. */
const ASGARI_NET = 28075.5;
/** Alibaba.com ABD Starter paketi, yıllık (seller.alibaba.com/us, 12 Kasım 2026). */
const ALIBABA_STARTER_USD = 2799;

/** Fiyat tablosu (yayın varsayılanı): Basic ve Platinium ücreti buradan gelir (kullanıcı kararları 2026-11-03 ve 2026-11-10). */
const TABLO = paketler(DEFAULT_PARAMS);
const tabloPaketi = (id: 'standart' | 'pro' | 'kurumsal') => TABLO.find((p) => p.id === id)!;
const STANDART = tabloPaketi('standart');
const PRO = tabloPaketi('pro');
const KURUMSAL = tabloPaketi('kurumsal');
const [ILK, ORTA, SON] = PAKET_SIRASI;

/** Önerinin yeni sayıları: başlangıç değeridir, talep hacmi ölçüldükçe ayarlanır. */
export const ONERI_SAYILARI = {
  /** Ücretsiz paketin kayıtlı ürün sınırı kararlaştırıldı (13 Kasım 2026, `UCRETSIZ_SINIRLAR`). */
  ucretsizUrun: UCRETSIZ_URUN,
  ucretsizDil: 1,
  /** Alibaba.com Starter paketi ayda 20 teklif yanıtı içerir. */
  standartYanit: 20,
  /** Alibaba.com Growth paketi ayda 40 teklif yanıtı içerir. */
  proYanit: 40,
};
const S = ONERI_SAYILARI;

/* ---------- Canlı veri yardımcıları ---------- */

const adi = (id: PaketId) => paket(id).ad;
const varMi = (anahtar: string, id: PaketId) => pakette(deger(anahtar, id));
/** Özelliğin bulunduğu paketler, ad öbeği olarak: “Bütün paketlerde”, “Yalnız Enterprise paketinde”. */
function paketYeri(anahtar: string): string {
  const p = ilkPaket(anahtar);
  if (p === null) return 'Hiçbir pakette';
  if (p === ILK) return 'Bütün paketlerde';
  if (p === SON) return `Yalnız ${adi(SON)} paketinde`;
  return `${adi(p)} paketinden başlayarak`;
}
const OZELLIKLER = CANLI_GRUPLAR.flatMap((g) => g.ozellikler);
const ozellik = (anahtar: string) => {
  const o = OZELLIKLER.find((x) => x.anahtar === anahtar);
  if (!o) throw new Error(`Canlı pakette olmayan özellik: ${anahtar}`);
  return o;
};
const basic = paket(ILK);
const ucretsizPaketVar = CANLI_PAKETLER.some((p) => p.aylikEur === 0);
const yanitIlk = ilkPaket('quota.rfq_quotes_monthly');
const yillikAylik = basic.aylikEur && basic.yillikEur ? basic.yillikEur / 12 : null;

/** Önerilen paketin adı: bugünkü paketin karşılığı. */
const ONERI_ADI: Record<PaketId, string> = { [ILK]: STANDART.ad, [ORTA]: PRO.ad, [SON]: KURUMSAL.ad } as Record<PaketId, string>;
/** Bugünkü deneme ayarının bağlı olduğu paket (canlı). Öneri aynı paketi korur. */
const DENEME_PAKETI = CANLI_DENEME_PAKETI;
const DENEME_ONERI_ADI = DENEME_PAKETI ? ONERI_ADI[DENEME_PAKETI] : PRO.ad;

/* ---------- Bugünkü fiyat planları (canlı) ---------- */

export interface BugunkuSatir {
  id: PaketId;
  ad: string;
  aylik: string;
  yillik: string;
  tl: string;
  urun: string;
  yanit: string;
}
const yanitMetni = (v: OzellikDegeri) => (v === false ? 'Yok' : v === '0' ? '0 (yanıt hakkı yok)' : v === 'Sınırsız' ? 'Sınırsız' : `Ayda ${v}`);
export const BUGUNKU_SATIRLAR: BugunkuSatir[] = PAKET_SIRASI.map((id) => {
  const p = paket(id);
  return {
    id,
    ad: p.ad,
    aylik: fiyatMetni(p.aylikEur),
    yillik: p.yillikEur ? eur(p.yillikEur) : 'Teklif',
    tl: p.aylikEur ? tl(p.aylikEur * KUR.eur) : 'Teklif',
    urun: String(deger('quota.max_active_listings', id)),
    yanit: yanitMetni(deger('quota.rfq_quotes_monthly', id)),
  };
});
export const TL_NOTU = `₺ karşılığı Türkiye Cumhuriyet Merkez Bankası (TCMB) kuruyla hesaplandı. Kur 12 Kasım 2026 Perşembe gününün döviz satış kurudur. Bu kurda 1 € ${sayi(KUR.eur, 4)} ₺’dır. Parametreler sayfasındaki kur ${sayi(DEFAULT_PARAMS.eurTry, 2)} ₺’dır. istoc.com fiyatları vergi hariçtir.`;

/* ---------- Önerinin özü ---------- */

export const ONERI = {
  etiket: 'Önerinin özü',
  baslik: 'Satıcı ücretsiz başlasın. Ödeme, talep gelmeye başlayınca başlasın.',
  metin: `Bugün en ucuz paket ayda ${fiyatMetni(basic.aylikEur)}. Deneme ${CANLI_DENEME_GUN} gün sonra biter. Deneme bitince satıcının ücretsiz kalabileceği bir paket yok. Kalıcı bir Ücretsiz paket 13 Kasım 2026 Cuma günü kararlaştırıldı. Satıcı bu pakette teklif isteklerini görür. Öneri teklif isteğine yanıtı bütün ücretli paketlere açar. ${STANDART.ad} ve ${PRO.ad} fiyatları fiyat tablosuyla aynı kalır.`,
};

/* ---------- Önerilen paketler ---------- */

export type OneriPaketId = 'ucretsiz' | 'standart' | 'pro' | 'kurumsal';
export interface OneriPaketi {
  id: OneriPaketId;
  ad: string;
  /** Bugünkü canlı paketin adı. Yeni paket için null. */
  bugunku: string | null;
  fiyat: string;
  birim: string | null;
  yillik: string;
  /** istoc.com bugün bu paketi öne çıkarıyor. */
  one: boolean;
  kimin: string;
  vaat: string;
  maddeler: string[];
  gecis: string;
}
/** Madde yalnız pakette karşılığı varsa yazılır. */
const varsa = (kosul: boolean, metin: string) => (kosul ? metin : null);
const maddeler = (xs: (string | null)[]) => xs.filter((x): x is string => x !== null);
const urunMaddesi = (id: PaketId) => `${deger('quota.max_active_listings', id)} ürün aynı anda yayında`;
const yanitMaddesi = (id: PaketId) => {
  const v = deger('quota.rfq_quotes_monthly', id);
  return v === 'Sınırsız' ? 'Teklif isteğine sınırsız yanıt' : pakette(v) ? `Ayda ${v} teklif isteğine yanıt` : null;
};
const yillikMetni = (p: { yillikEur: number | null }) =>
  p.yillikEur ? `Yıllık peşin ${eur(p.yillikEur)}. Bu tutar ${int(DEFAULT_PARAMS.annualMonths)} aylık ücrete eşittir.` : 'Fiyat ihtiyaca göre teklifle belirlenir.';
/** Bugün yalnız en üst pakette olan ihtiyaçlar: Pro’dan Kurumsal’a geçişin nedeni. */
const yalnizSonda = maddeler([
  varsa(deger('quota.rfq_quotes_monthly', SON) === 'Sınırsız', 'sınırsız teklif yanıtı'),
  varsa(ilkPaket('feature.commerce.custom_payment_terms') === SON, 'alıcıya özel ödeme koşulu'),
  varsa(ilkPaket('feature.store.custom_domain') === SON, 'özel alan adı'),
]);
const beyazEtiket = MODELLER.find((m) => m.id === 'beyaz-etiket');

export const ONERI_PAKETLERI: OneriPaketi[] = [
  {
    id: 'ucretsiz',
    ad: 'Ücretsiz',
    bugunku: null,
    fiyat: '0 €',
    birim: null,
    yillik: 'Süre sınırı yoktur.',
    one: false,
    kimin: 'Platformu yeni deneyen satıcı için',
    vaat: 'Vitrin açılır ve talepler görünür. Satıcı teklif vermek için ücretli paket alır.',
    maddeler: [`${S.ucretsizUrun} kayıtlı ürün`, 'Teklif isteklerini görür', 'Şirket doğrulama rozeti ve temel analitik'],
    gecis: `Teklif vermek isteyince ya da ${S.ucretsizUrun} kayıtlı ürünlük sınır dolunca ${STANDART.ad} paket gerekir.`,
  },
  {
    id: 'standart',
    ad: STANDART.ad,
    bugunku: adi(ILK),
    fiyat: fiyatMetni(STANDART.aylikEur),
    birim: 'aylık',
    yillik: yillikMetni(STANDART),
    one: basic.one,
    kimin: 'Düzenli satış yapan tek kişilik satıcı için',
    vaat: 'Satıcı talebe düzenli yanıt verir. Aramada Ücretsiz paketlerin önünde görünür.',
    maddeler: maddeler([
      urunMaddesi(ILK),
      `Ayda ${S.standartYanit} teklif isteğine yanıt`,
      varsa(varMi('feature.storefront.languages', ILK), `Vitrin ${deger('feature.storefront.languages', ILK)}de açılır`),
      buyukHarf(destekMetni(ILK)),
    ]),
    gecis: `Ekip büyüyünce ya da muhasebe yazılımı bağlantısı gerekince ${PRO.ad} paket gerekir.`,
  },
  {
    id: 'pro',
    ad: PRO.ad,
    bugunku: adi(ORTA),
    fiyat: fiyatMetni(PRO.aylikEur),
    birim: 'aylık',
    yillik: yillikMetni(PRO),
    one: paket(ORTA).one,
    kimin: 'Büyüyen KOBİ için',
    vaat: 'Satıcı ekip, entegrasyon ve görünürlükle daha çok talep alır.',
    maddeler: maddeler([
      urunMaddesi(ORTA),
      `Ayda ${S.proYanit} teklif isteğine yanıt`,
      varsa(varMi('quota.featured_listings_monthly', ORTA), `Ayda ${deger('quota.featured_listings_monthly', ORTA)} öne çıkan ürün`),
      varsa(varMi('feature.crm.module', ORTA) && varMi('feature.api.erp_integration', ORTA), 'Müşteri kayıtları (CRM) ve muhasebe yazılımı bağlantısı (ERP)'),
      buyukHarf(destekMetni(ORTA)),
    ]),
    gecis: yalnizSonda.length ? `${buyukHarf(liste(yalnizSonda))} gerekince ${KURUMSAL.ad} paket gerekir.` : `Daha büyük ölçek gerekince ${KURUMSAL.ad} paket gerekir.`,
  },
  {
    id: 'kurumsal',
    ad: KURUMSAL.ad,
    bugunku: adi(SON),
    fiyat: fiyatMetni(KURUMSAL.aylikEur),
    birim: null,
    yillik: yillikMetni(KURUMSAL),
    one: paket(SON).one,
    kimin: 'Kurumsal ve holding ölçeği için',
    vaat: 'Satıcı en geniş sınırları ve kendisine ayrılmış desteği alır.',
    maddeler: maddeler([
      urunMaddesi(SON),
      yanitMaddesi(SON),
      varsa(varMi('feature.commerce.custom_payment_terms', SON) && varMi('feature.support.event_invitations', SON), 'Alıcıya özel ödeme koşulu ve fuar daveti'),
      buyukHarf(destekMetni(SON)),
    ]),
    gecis:
      beyazEtiket && beyazEtiket.hazirlik !== 'hazir'
        ? 'Beyaz etiketli mağaza planlanıyor. Hazır olunca bu pakete ek modül olarak eklenebilir.'
        : 'Beyaz etiketli mağaza bu pakete ek modül olarak eklenebilir.',
  },
];

/* ---------- Paket kapsamı: altı sonuç başlığı ---------- */

export type HucreDurumu = 'ayni' | 'degisti' | 'yeni' | 'planlanan' | 'vizyon';
export const DURUM_ADI: Record<HucreDurumu, string> = { ayni: 'Bugünküyle aynı', degisti: 'Değişir', yeni: 'Yeni', planlanan: 'Planlanan', vizyon: 'Vizyon' };
export interface KapsamHucresi {
  deger: string;
  durum: HucreDurumu;
}
export interface KapsamSatiri {
  id: string;
  ad: string;
  hucre: Record<OneriPaketId, KapsamHucresi>;
}
export interface KapsamGrubu {
  id: string;
  ad: string;
  satirlar: KapsamSatiri[];
}

/** Ücretli paketin bugünkü değeri. “Yakında” işaretli özellik pakette olsa da “Yakında” yazar. */
const canli = (anahtar: string, id: PaketId): KapsamHucresi => {
  const o = ozellik(anahtar);
  const v = o.deger[id];
  return { deger: o.yakinda && pakette(v) ? 'Yakında' : String(degerMetni(v)), durum: 'ayni' };
};
/** Ücretsiz pakette hücrenin durumu yazılmaz: paketin tamamı yenidir. */
const ucretsiz = (d: string): KapsamHucresi => ({ deger: d, durum: 'ayni' });
const satir = (id: string, ad: string, u: KapsamHucresi, s: KapsamHucresi, p: KapsamHucresi, k: KapsamHucresi): KapsamSatiri => ({ id, ad, hucre: { ucretsiz: u, standart: s, pro: p, kurumsal: k } });
/** Bugünkü değerle karşılaştırır: bugün hiç yoksa “Yeni”, değer farklıysa “Değişir” yazar. */
const oneri = (anahtar: string, id: PaketId, d: string): KapsamHucresi => {
  const bugun = deger(anahtar, id);
  return { deger: d, durum: !pakette(bugun) ? 'yeni' : String(degerMetni(bugun)) === d ? 'ayni' : 'degisti' };
};
const ucPaket = (f: (id: PaketId) => KapsamHucresi) => [f(ILK), f(ORTA), f(SON)] as const;
const rozetModeli = MODELLER.find((m) => m.id === 'dogrulanmis-tedarikci');
const rozetDurumu: HucreDurumu = rozetModeli?.hazirlik === 'hazir' ? 'yeni' : 'planlanan';

export const KAPSAM: KapsamGrubu[] = [
  {
    id: 'vitrin',
    ad: 'Vitrin ve ürün',
    satirlar: [
      satir('kayitli', 'Kayıtlı ürün', ucretsiz(String(S.ucretsizUrun)), ...ucPaket((id) => canli('quota.max_products', id))),
      satir('urun', 'Aynı anda yayında ürün', ucretsiz('Kayıtlı ürün kadar'), ...ucPaket((id) => canli('quota.max_active_listings', id))),
      satir('dil', 'Vitrin dili', ucretsiz(`${S.ucretsizDil} dil`), ...ucPaket((id) => canli('feature.storefront.languages', id))),
      satir('tema', 'Özel tema', ucretsiz('Yok'), ...ucPaket((id) => canli('feature.store.custom_theme', id))),
      satir('alan-adi', 'Özel alan adı', ucretsiz('Yok'), ...ucPaket((id) => canli('feature.store.custom_domain', id))),
    ],
  },
  {
    id: 'talep',
    ad: 'Talep',
    satirlar: [
      satir('gorme', 'Teklif isteklerini görme', ucretsiz('Var'), ...ucPaket((id) => oneri('feature.functional.rfq', id, 'Var'))),
      satir(
        'yanit',
        'Teklif isteğine yanıt (aylık)',
        ucretsiz('Yok'),
        oneri('quota.rfq_quotes_monthly', ILK, String(S.standartYanit)),
        oneri('quota.rfq_quotes_monthly', ORTA, String(S.proYanit)),
        canli('quota.rfq_quotes_monthly', SON),
      ),
      satir('ziyaretci', 'Profili ziyaret eden şirketleri görme', ucretsiz('Yok'), { deger: 'Yok', durum: 'ayni' }, { deger: 'Var', durum: 'vizyon' }, { deger: 'Var', durum: 'vizyon' }),
    ],
  },
  {
    id: 'gorunurluk',
    ad: 'Görünürlük',
    satirlar: [
      satir('arama', 'Arama önceliği', ucretsiz('Ücretli paketlerden sonra'), ...ucPaket((id) => canli('feature.marketing.search_boost', id))),
      satir('one-cikan', 'Öne çıkan ürün (aylık)', ucretsiz('Yok'), ...ucPaket((id) => canli('quota.featured_listings_monthly', id))),
      satir('reklam', 'Anahtar kelime reklamı', ucretsiz('Yok'), ...ucPaket((id) => canli('feature.marketing.keyword_ads', id))),
    ],
  },
  {
    id: 'guven',
    ad: 'Güven',
    satirlar: [
      satir('dogrulama', 'Şirket doğrulaması', ucretsiz('Var'), ...ucPaket((id) => canli('feature.storefront.manufacturer_badge_tier', id))),
      satir('rozet', 'Yerinde denetim rozeti', ucretsiz('Ek modülle'), ...ucPaket(() => ({ deger: 'Ek modülle', durum: rozetDurumu }))),
    ],
  },
  {
    id: 'veri',
    ad: 'Veri',
    satirlar: [
      satir('analitik', 'Temel analitik', ucretsiz('Var'), ...ucPaket((id) => canli('feature.analytics.basic', id))),
      satir('disa-aktarim', 'Veri dışa aktarımı', ucretsiz('Yok'), ...ucPaket((id) => canli('feature.analytics.export', id))),
      satir('gelismis', 'Gelişmiş raporlar', ucretsiz('Yok'), ...ucPaket((id) => canli('feature.analytics.advanced', id))),
    ],
  },
  {
    id: 'ekip',
    ad: 'Ekip, entegrasyon ve destek',
    satirlar: [
      satir('kullanici', 'Alt kullanıcı sayısı', ucretsiz('1'), ...ucPaket((id) => canli('quota.max_sub_users', id))),
      satir('erp', 'Muhasebe yazılımı bağlantısı (ERP)', ucretsiz('Yok'), ...ucPaket((id) => canli('feature.api.erp_integration', id))),
      satir('destek', 'Destek düzeyi', ucretsiz('E-posta ile destek'), ...ucPaket((id) => ({ deger: buyukHarf(destekMetni(id)), durum: 'ayni' }))),
    ],
  },
];
export const KOTA_NOTU = `${STANDART.ad} ve ${PRO.ad} paketlerinin yanıt kotası Alibaba.com’un Starter ve Growth paketlerine göre seçildi. Bu iki Alibaba.com paketi ayda ${S.standartYanit} ve ${S.proYanit} teklif yanıtı içerir. Ücretsiz paketin ürün sınırı ve yanıt kuralı 13 Kasım 2026 Cuma günü kararlaştırıldı.`;
export const KAPSAM_NOTU =
  'Tablo özellikleri satıcının aldığı sonuca göre altı başlıkta toplar. Ücretli paketlerdeki değerler bugünkü paketlerden gelir. Bugünkünden farklı olan hücre etiketlidir. Ücretsiz paketin bütün değerleri yenidir. Kota sayıları başlangıç değeridir ve talep hacmi ölçüldükçe ayarlanır. Ücretsiz paketin kayıtlı ürün, alt kullanıcı ve doğrulama rozeti değerleri kararlaştırıldı. Teklif isteğini görme ve yanıt değerleri de kararlaştırıldı. Kararın tarihi 13 Kasım 2026 Cuma günüdür. Ücretsiz paketin öteki değerleri bu sayfanın önerisidir. Kararın bütün sınırları gelir modelleri sayfasında yazar.';

/* ---------- Eleştiri ---------- */

export interface Elestiri {
  id: string;
  baslik: string;
  gozlem: string;
  /** “Bugün” alanındaki olgunun kaynağı. */
  gozlemKaynaklari: Kaynak[];
  neden: string;
  /** “Neden önemli” alanındaki karşılaştırmanın kaynağı. */
  kaynaklar: Kaynak[];
  oneri: string;
}

/** Canlı açıklama ile tablonun çelişkisi. Saf işlevdir: testte örnek veriyle de çalışır. */
export interface CeliskiGirdisi {
  basic: Pick<CanliPaket, 'ad' | 'aciklama' | 'aylikEur' | 'kod'>;
  orta: Pick<CanliPaket, 'ad' | 'aciklama'>;
  son: Pick<CanliPaket, 'ad' | 'aciklama'>;
  /** Gelişmiş raporlar orta pakette var mı? */
  gelismisOrtada: boolean;
  /** Gelişmiş raporların yeri, cümle sonu olarak (“yalnız Enterprise paketinde vardır”). */
  gelismisYeri: string;
  /** En üst paketteki alt kullanıcı sayısı. */
  sonKullanici: OzellikDegeri;
}
export function aciklamaCeliskileriBul(g: CeliskiGirdisi): string[] {
  const out: string[] = [];
  if (/ücretsiz/i.test(g.basic.aciklama) && (g.basic.aylikEur ?? 0) > 0)
    out.push(`${g.basic.ad} paketinin açıklaması paketi ücretsiz diye anlatır. Oysa paket ayda ${fiyatMetni(g.basic.aylikEur)} tutar. Paketin sistemdeki kodu ise “${g.basic.kod}” olarak geçer.`);
  if (/gelişmiş analitik/i.test(g.orta.aciklama) && !g.gelismisOrtada) out.push(`${g.orta.ad} paketinin açıklaması gelişmiş analitik sözü verir. Oysa gelişmiş raporlar ${g.gelismisYeri}.`);
  if (/sınırsız çalışan/i.test(g.son.aciklama) && g.sonKullanici !== 'Sınırsız') out.push(`${g.son.ad} paketinin açıklaması sınırsız çalışan sözü verir. Oysa alt kullanıcı sayısı ${g.sonKullanici} kişidir.`);
  return out;
}
const aciklamaCeliskileri = aciklamaCeliskileriBul({
  basic,
  orta: paket(ORTA),
  son: paket(SON),
  gelismisOrtada: varMi('feature.analytics.advanced', ORTA),
  gelismisYeri: bas('feature.analytics.advanced'),
  sonKullanici: deger('quota.max_sub_users', SON),
});

const sifirSatirlar = OZELLIKLER.filter((o) => PAKET_SIRASI.some((p) => o.deger[p] === '0'));
const yakindaSatirlar = OZELLIKLER.filter((o) => o.yakinda);
const TEKNIK_ADLAR = ['feature.pim.attribute_set', 'feature.pim.product_family', 'feature.b2b.cost_center'].map((a) => ozellik(a).canliAd).filter((ad) => /^[A-Za-z ]+$/.test(ad));
const soz = (no: number) => {
  const o = KATEGORILER.flatMap((k) => k.oneriler).find((x) => x.no === no);
  if (!o) throw new Error(`Değer önerisinde olmayan söz: ${no}`);
  return o.soz;
};
const GUVENCE_ADI = ozellik('feature.commerce.trade_assurance').canliAd;

/** Paket dışı ek modüller: gelir modelleri kimliği. Hazır olanlar ilk satılacak modüldür. */
const EK_MODUL_IDLERI = ['kurulum-egitim', 'rfq', 'sponsorlu-urun', 'kategori-vitrini', 'dogrulanmis-tedarikci', 'eklentiler', 'veri-raporlari', 'eslestirme-etkinlikleri', 'lojistik', 'beyaz-etiket'];
const hazirModeller = MODELLER.filter((m) => EK_MODUL_IDLERI.includes(m.id) && m.hazirlik === 'hazir');
const HAZIR = HAZIRLIK_ADI.hazir;

/** Bugün teklif isteğine kimlerin yanıt verebildiği. */
const yanitlayanlar =
  yanitIlk === null ? 'hiçbir satıcı' : yanitIlk === SON ? `yalnız ${adi(SON)} paketindeki satıcılar` : yanitIlk === ILK ? 'bütün satıcılar' : `${adi(yanitIlk)} ve üstündeki paketlerdeki satıcılar`;
const basicTl = (basic.aylikEur ?? 0) * KUR.eur;
const asgariOrani = Math.round((basicTl / ASGARI_NET) * 100);
const alibabaKati = ((basic.yillikEur ?? 0) * KUR.eur) / (ALIBABA_STARTER_USD * KUR.usd);

const elestiriler: (Elestiri | false)[] = [
  yanitIlk !== ILK && {
    id: 'teklif-yaniti',
    baslik: yanitIlk === SON ? 'Teklif isteğine yanıt yalnız en pahalı pakette var.' : 'Teklif isteğine yanıt en ucuz pakette yok.',
    gozlem: `${adi(ILK)} paketinde yanıt hakkı ${kota(deger('quota.rfq_quotes_monthly', ILK))}. ${adi(ORTA)} paketinde bu hak ${kota(deger('quota.rfq_quotes_monthly', ORTA))}. ${adi(SON)} paketinde bu hak ${kota(deger('quota.rfq_quotes_monthly', SON))}.`,
    gozlemKaynaklari: [R.planlar],
    neden: `Teklif isteği bir B2B (işletmeden işletmeye) pazaryerinin ana değeridir. Alibaba.com’un en ucuz ücretli paketi (Starter) ayda 20 teklif yanıtı içerir. IndiaMART’ın giriş paketi haftada 10 alım talebi verir. Bugün alıcının teklif isteğine istoc.com’da ${yanitlayanlar} yanıt verebilir.`,
    kaynaklar: [R.alibabaAbd, R.indiamartMdc],
    oneri: `Yanıt hakkını bütün ücretli paketlere açın. ${PRO.ad} pakete açılması 13 Kasım 2026 Cuma günü kararlaştırıldı. ${STANDART.ad} pakette ayda ${S.standartYanit}, ${PRO.ad} pakette ayda ${S.proYanit} yanıt olsun. ${KURUMSAL.ad} pakette yanıt sınırsız kalsın. Ücretsiz paket teklif isteklerini görür ama yanıt vermez.`,
  },
  (basic.aylikEur ?? 0) > 0 &&
    !ucretsizPaketVar && {
      id: 'giris',
      baslik: 'Ücretsiz başlangıç yok ve giriş fiyatı yüksek.',
      gozlem: `En ucuz paket ayda ${fiyatMetni(basic.aylikEur)}. Bu tutar yaklaşık ${tl(basicTl)} eder. Bu, 2026 net asgari ücretinin yaklaşık %${int(asgariOrani)}’${iyelik(asgariOrani)} kadardır. Yıllık peşin ödeme, Alibaba.com’un ABD’deki en ucuz ücretli paketinin (Starter) yaklaşık ${sayi(alibabaKati, 1)} katıdır.`,
      gozlemKaynaklari: [R.tcmb, R.asgariKpmg, R.alibabaAbd],
      neden:
        'Araştırılan B2B tedarikçi platformlarının çoğunda kalıcı ücretsiz paket var. IndiaMART, TurkishExporter, Europages ve Alibaba.com buna örnektir. Türkiye’deki Endüstride Ara’da ücretsiz paket yok. Orada yıllık üyelik KDV dahil 1.200 ₺ ile 3.500 ₺ arasıdır.',
      kaynaklar: [R.indiamartPaket, R.turkishexporter, R.europagesYardim, R.alibabaBlog, R.endustrideAra],
      oneri: `Kalıcı Ücretsiz paket 13 Kasım 2026 Cuma günü kararlaştırıldı. Yazılım hazır olunca paket açılır. ${STANDART.ad} ve ${PRO.ad} fiyatları aynı kalsın. Ücretsizden ücretliye geçiş oranı ölçülünce fiyatı yeniden değerlendirin.`,
    },
  CANLI_DENEME_GUN > 0 &&
    !ucretsizPaketVar && {
      id: 'deneme',
      baslik: 'Deneme süresi değerle değil takvimle bitiyor.',
      gozlem: `Deneme ${CANLI_DENEME_GUN} gün sürer ve takvimle biter.${DENEME_PAKETI ? ` Fiyat planlarındaki deneme ayarı ${adi(DENEME_PAKETI)} paketine bağlıdır.` : ''} Satıcı bu sürede hiç talep görmemiş olabilir. Deneme bitince satıcının ücretsiz kalabileceği bir paket yok.`,
      gozlemKaynaklari: [R.planlar],
      neden:
        'Ödeme duvarı, ücretsiz kullanımın bitip ödemenin başladığı noktadır. Küresel araştırmaya göre bu duvar değerin kanıtlandığı ana konur. Alıcıyla satıcıyı tanıştıran platformda bu an ilk nitelikli taleptir. Araştırmada okunan B2B platform sayfalarının hiçbirinde satıcıya süreli deneme yok.',
      kaynaklar: [R.indiamartPaket, R.turkishexporter],
      oneri: `Denemeyi ters denemeye çevirin. Satıcı ${CANLI_DENEME_GUN} gün ${DENEME_ONERI_ADI} paketini kullanır. Deneme bitince hesap kapanmaz. Hesap Ücretsiz pakete iner.`,
    },
  aciklamaCeliskileri.length > 0 && {
    id: 'aciklamalar',
    baslik: 'Paket açıklamaları fiyatla ve tabloyla çelişiyor.',
    gozlem: aciklamaCeliskileri.join(' '),
    gozlemKaynaklari: [R.planlar],
    neden: 'Satıcı paketi açıklamayı okuyarak seçer. Açıklama tabloyla çelişirse satıcı yanlış paketi seçebilir. B2B platformları paket açıklamasını paketin haklarından yazar.',
    kaynaklar: [R.alibabaFiyat, R.indiamartPaket],
    oneri: 'Açıklamaları tablodaki değerlerden yazın. Paket adları istoc.com’daki gibi kalır (karar 13 Kasım 2026 Cuma).',
  },
  yillikAylik !== null && {
    id: 'gosterim',
    baslik: 'Satıcı sayfasında ilk görünen tutar, fiyat tablosundaki tutar değil.',
    gozlem: `istoc.com/satici-ol sayfası yıllık seçenek seçili açılır. ${basic.ad} için ayda “€${sayi(yillikAylik, 2)}” yazar. Bu tutar yıllık peşin ödemenin on ikide biridir. Seçenek düğmesinde “Yıllık 2 ay bedava” yazar. Türkçe seçilmeden önce sayfa İngilizce açılır.`,
    gozlemKaynaklari: [R.saticiOl],
    neden: `Satıcıyla görüşen CRM sorumlusu fiyat tablosundaki aylık ${fiyatMetni(STANDART.aylikEur)} tutarını söyler. Sayfa ise başka bir tutar gösterir. “2 ay bedava” sözü bir indirim gibi okunur. CRM sorumlusu ise indirim olmadığını söyler.`,
    kaynaklar: [],
    oneri: `Sayfa önce aylık fiyatı göstersin. Yıllık seçeneğin yazısı şöyle olsun: “Yıllık peşin ${STANDART.yillikEur ? eur(STANDART.yillikEur) : ''}. Bu tutar ${int(DEFAULT_PARAMS.annualMonths)} aylık ücrete eşittir.” Tutarlar Türkçe biçimde yazılsın, örneğin “${fiyatMetni(STANDART.aylikEur)}”.`,
  },
  (basic.aylikEur ?? 0) > 0 && {
    id: 'deger-onerisi',
    baslik: 'Değer önerisi bugünkü fiyat planlarıyla çelişiyor.',
    gozlem: `Değer önerisi 7 “${soz(7)}” der. Değer önerisi 20 “${soz(20)}” der. Oysa en ucuz paket ayda ${fiyatMetni(basic.aylikEur)} tutar. Kurulum hizmeti gelir modellerinde ücretli bir hizmet olarak planlanıyor.`,
    gozlemKaynaklari: [],
    neden: 'Saha ekibi esnafa iki ayrı şey söyleyebilir. Söz ile fatura farklı olursa satıcının güveni kaybolur.',
    kaynaklar: [],
    oneri: 'Söz 7’yi Ücretsiz paketle uyumlu hale getirin. Söz 20 için kurulumun ücretli olup olmayacağına karar verin.',
  },
  (sifirSatirlar.length > 0 || yakindaSatirlar.length > 0 || TEKNIK_ADLAR.length > 0) && {
    id: 'teknik',
    baslik: 'Fiyat planları sonucu değil teknik özelliği satıyor.',
    gozlem: [
      `istoc.com fiyat planlarında ${OZELLIKLER.length} özellik var.`,
      TEKNIK_ADLAR.length ? `Bazılarının adı İngilizce teknik bir terimdir. ${liste(TEKNIK_ADLAR.map((a) => `“${a}”`))} buna örnektir.` : '',
      sifirSatirlar.length ? `${sifirSatirlar.length} satırda bir paketin değeri “0” olarak yazılmış.` : '',
      yakindaSatirlar.length ? `${yakindaSatirlar.length} özellik “Yakında” işaretlidir ve bugün çalışmaz.` : '',
    ]
      .filter(Boolean)
      .join(' '),
    gozlemKaynaklari: [R.planlar],
    neden: 'Satıcı özellik değil sonuç satın alır. Bu sonuç talep, görünürlük ve güvendir. “0” yazan satır, pakette olmayan bir hakkı var gibi gösterir.',
    kaynaklar: [],
    oneri: 'Tabloyu altı sonuç başlığıyla kurun. Bunlar vitrin, talep, görünürlük, güven, veri ve destektir. Çalışmayan özelliği ayrı satırda “Yakında” etiketiyle gösterin.',
  },
  {
    id: 'ek-modul',
    baslik: 'Paket dışında satılan bir ek modül yok.',
    gozlem: `istoc.com fiyat planlarında yalnız ${CANLI_PAKETLER.length} paket var. Büyüyen satıcı tek bir ihtiyaç için bir üst pakete geçmek zorundadır. Gelir modelleri sayfasındaki ekler bugün satılmıyor.`,
    gozlemKaynaklari: [R.planlar],
    neden: 'Küresel platformlar doğrulamayı, reklamı ve teklif hakkını paketten ayrı da satıyor. IndiaMART doğrulama hizmetini (TrustSEAL Pro) yılda 60.000 rupiye satar. TurkishExporter onaylı üyeliği 365 $’dır.',
    kaynaklar: [R.indiamartTrust, R.turkishexporter],
    oneri: hazirModeller.length
      ? `Paket dışı ek modül kataloğu kurun. Önce gelir modellerinde “${HAZIR}” olan ${liste(hazirModeller.map((m) => m.ad.toLocaleLowerCase('tr')))} satılsın.`
      : 'Paket dışı ek modül kataloğu kurun. Önce bir modülü hazır hale getirin.',
  },
  /Trade Assurance|Ticaret Güvencesi/.test(GUVENCE_ADI) && {
    id: 'guvence',
    baslik: '“Ticaret Güvencesi” adı, verilmeyen bir ödeme korumasını çağrıştırıyor.',
    gozlem: `Fiyat planları bu özelliğe “${GUVENCE_ADI}” der. Özellik ${bas('feature.commerce.trade_assurance')}. iStoc ödemeyi tutmaz. Güvence sipariş koşullarını kayıt altına alır.`,
    gozlemKaynaklari: [R.planlar],
    neden: 'Alibaba.com’daki Trade Assurance hizmetinde alıcı ödemeyi Alibaba.com üzerinden yapar. Hizmet ödemeden teslimata kadar koruma sözü verir. Alıcı aynı adı görünce aynı korumayı bekleyebilir.',
    kaynaklar: [R.alibabaGuvence],
    oneri: 'Adı, hizmetin yaptığı işi söyleyecek biçimde değiştirin. Örneğin “Sipariş kaydı güvencesi” denebilir. Emanet ödemede para teslimata kadar bir kuruluşta bekler. Bu hizmet hazır olunca adı yeniden değerlendirin.',
  },
];
export const ELESTIRILER: Elestiri[] = elestiriler.filter((e): e is Elestiri => e !== false);

/* ---------- Deneme ve ödeme duvarı ---------- */

export interface Adim {
  ad: string;
  metin: string;
  ucret: 'ucretsiz' | 'ucretli';
}
export const DENEME_BUGUN: Adim[] = [
  { ad: 'Başvurur', metin: 'Satıcı başvurusu ücretsizdir.', ucret: 'ucretsiz' },
  { ad: `${CANLI_DENEME_GUN} gün dener`, metin: 'Deneme süresince ücret alınmaz.', ucret: 'ucretsiz' },
  { ad: 'Paket seçer', metin: 'Devam etmek için ücretli bir paket gerekir. Ücretsiz kalınacak bir paket yoktur.', ucret: 'ucretli' },
];
export const DENEME_ONERI = {
  giris: 'Bugün deneme takvimle bitiyor. Öneride deneme süresi ve paketi aynı kalır. Deneme bitince satıcı Ücretsiz pakete iner. Ödeme, satıcı değeri görünce başlar.',
  adimlar: [
    { ad: 'Başvurur', metin: 'Satıcı başvurusu ücretsizdir.', ucret: 'ucretsiz' },
    { ad: `${CANLI_DENEME_GUN} gün ${DENEME_ONERI_ADI} paketini dener`, metin: 'Paketin bütün özellikleri açıktır.', ucret: 'ucretsiz' },
    { ad: 'Ücretsiz pakete iner', metin: 'Satıcı ödeme yapmazsa hesap kapanmaz. Vitrin ve talepler açık kalır.', ucret: 'ucretsiz' },
    { ad: 'Değeri görünce öder', metin: `Teklif vermek isteyince ya da ürün sınırı dolunca satıcı ${STANDART.ad} pakete geçer.`, ucret: 'ucretli' },
  ] satisfies Adim[],
  kural: 'Ödeme duvarı takvime değil kullanıma bağlanır. Kural herkes için aynıdır. İndirim ve pazarlık yoktur.',
};

export interface Kanit {
  id: string;
  ad: string;
  metin: string;
  kaynaklar: Kaynak[];
}
export const DENEME_KANITLARI: Kanit[] = [
  {
    id: 'yaygin',
    ad: 'Deneme ve ücretsiz paket ne kadar yaygın?',
    metin: 'ChartMogul Ocak 2026’da 200 yazılım ürününü inceledi. Rapor Şubat 2026’da yayımlandı. Ürünlerin %57’si süreli denemeyle başlıyor. Ürünlerin %26’sı ücretsiz paketle, %7’si ters denemeyle başlıyor. Denemelerin %62’si 14 gün sürüyor.',
    kaynaklar: [R.chartmogul],
  },
  {
    id: 'donusum',
    ad: 'Hangisi daha çok ödeyen kullanıcı getiriyor?',
    metin: 'Aynı rapora göre 1.000 ziyaretçiden ücretsiz pakette yaklaşık 5, denemede 3,6 ödeyen kullanıcı çıkıyor. Kayıt olanlar arasında denemede ödemeye geçen oran biraz daha yüksektir. Ama ücretsiz pakete daha çok kişi kayıt olur. Bu yüzden ziyaretçi başına fark kaybolur.',
    kaynaklar: [R.chartmogul, R.chartmogul2],
  },
  {
    id: 'sure',
    ad: 'Karar ne kadar sürüyor?',
    metin: 'Growth Unhinged’e göre denemede satın alanların yarısı ilk 14 günde satın alır. Ücretsiz pakette bu süre 60 ile 90 gündür. Airtable ters deneme kullanır. Kullanıcı 14 gün Pro paketini dener. Sonra ücretsiz pakete iner.',
    kaynaklar: [R.growthUnhinged],
  },
  {
    id: 'oran',
    ad: 'Ücretsiz paket herkesi ödemeye geçirmez',
    metin: 'IndiaMART’ta 8,8 milyon mağazanın yaklaşık 218 bininde ödeme var. Bu oran yaklaşık %2,5’tir. Ücretsiz paket açarsanız ödeyen satıcı oranını ölçün.',
    kaynaklar: [R.indiamartYatirimci],
  },
];

/* ---------- Paket dışı ek modüller ---------- */

export interface ModulOrnegi {
  platform: string;
  metin: string;
  kaynaklar: Kaynak[];
}
export interface EkModul {
  id: string;
  ad: string;
  verir: string;
  birim: string;
  paketler: string;
  ornekler: ModulOrnegi[];
  model: GelirModeli;
}
const modelBul = (id: string) => {
  const m = MODELLER.find((x) => x.id === id);
  if (!m) throw new Error(`Gelir modellerinde olmayan model: ${id}`);
  return m;
};
const modul = (id: string, ad: string, verir: string, birim: string, paketlerMetni: string, ornekler: ModulOrnegi[]): EkModul => ({
  id,
  ad,
  verir,
  birim,
  paketler: paketlerMetni,
  ornekler,
  model: modelBul(id),
});

export const EK_MODULLER: EkModul[] = [
  modul('kurulum-egitim', 'Kurulum ve eğitim', 'Ekip ürünleri, fotoğrafları ve fiyatları platforma girer. Satıcıya kısa bir kullanım eğitimi verir.', 'Tek seferlik ücret', 'Bütün paketler', [
    { platform: 'Ticimax', metin: 'Advance Plus paketinde tasarım hizmeti ve 500 ürüne kadar yapay zekâ ile kurulum vardır.', kaynaklar: [R.ticimax] },
    { platform: 'IndiaMART', metin: 'Maximiser Pro paketi kendi alan adını ve şablonları içerir. Fiyatı bir yıl için 85.000 rupidir.', kaynaklar: [R.indiamartPaket] },
  ]),
  modul('rfq', 'Ek teklif yanıt hakkı', 'Aylık kota bitince satıcı ek teklif isteğine yanıt verir.', 'Yanıt başına ya da yanıt paketiyle', `${STANDART.ad} ve ${PRO.ad}`, [
    { platform: 'Alibaba.com', metin: 'Paketler ayda 20 ile 60 arası teklif yanıtı içerir. Ayrıca ayda 5 öncelikli teklif hakkı verir.', kaynaklar: [R.alibabaAbd, R.alibabaFiyat] },
    { platform: 'IndiaMART', metin: 'Alım talebi hakkı giriş paketinde haftada 10’dur. Üst paketlerde haftada 40’a çıkar.', kaynaklar: [R.indiamartPaket] },
    { platform: 'TurkishExporter', metin: 'Alıcı ilanını görmek 10 T-Coin tutar.', kaynaklar: [R.turkishexporter] },
  ]),
  modul('sponsorlu-urun', 'Sponsorlu ürün', 'Ürün aramada “Sponsorlu” etiketiyle üstte görünür.', 'Tıklama başına ya da süreli sabit ücret', 'Bütün paketler', [
    { platform: 'Alibaba.com', metin: 'Starter paketi 500, Advertising Pro paketi 5.000 anahtar kelime reklam kredisi içerir.', kaynaklar: [R.alibabaAbd] },
    { platform: 'Faire', metin: 'Promoted Listings için en düşük aylık bütçe 150 EUR’dur.', kaynaklar: [KURESEL_KAYNAK.faireButce] },
  ]),
  modul('kategori-vitrini', 'Kategori vitrini', 'Bir kategorinin vitrin alanı belirli bir süre tek satıcıya ayrılır.', 'Aylık, kategori başına', `${STANDART.ad}, ${PRO.ad} ve ${KURUMSAL.ad}`, [
    { platform: 'TradeIndia', metin: 'VIP Gold paketi bir anahtar kelimede kategori liderliği ve iki anahtar kelimede reklam alanı verir.', kaynaklar: [R.tradeindiaGold] },
    { platform: 'Europages', metin: 'Reklam kategorisindeki ilk üç sıra sabit fiyatla satılır.', kaynaklar: [KURESEL_KAYNAK.topRanking] },
  ]),
  modul('dogrulanmis-tedarikci', 'Yerinde denetim rozeti', 'Dükkân ya da depo yerinde denetlenir. Denetimi geçen satıcının vitrininde rozet görünür.', 'Yıllık ücret', 'Bütün paketler', [
    { platform: 'IndiaMART', metin: 'TrustSEAL Pro yılda 60.000 rupidir. Vergi kaydı, banka hesabı ve görüntülü kimlik denetlenir.', kaynaklar: [R.indiamartTrust] },
    { platform: 'TradeIndia', metin: 'Verified Seller rozeti 1.500 rupidir.', kaynaklar: [R.tradeindiaDogrulama] },
    { platform: 'TurkishExporter', metin: 'Onaylı üyelik 365 $’dır.', kaynaklar: [R.turkishexporter] },
  ]),
  modul('eklentiler', 'Ek kullanıcı, ek ürün sınırı ve entegrasyon', 'Satıcı paketini değiştirmeden sınırını büyütür.', 'Aylık, ek başına', `${STANDART.ad}, ${PRO.ad} ve ${KURUMSAL.ad}`, [
    { platform: 'Alibaba.com', metin: 'Paketler 5 ya da 10 alt hesap içerir. Araştırmada ek kullanıcıyı ayrı satan bir platform görülmedi.', kaynaklar: [R.alibabaFiyat] },
  ]),
  modul('veri-raporlari', 'Pazar ve talep raporları', 'Hangi ürünün nerede arandığını gösterir. Rapor kişisel veri içermez.', 'Aylık abonelik ya da rapor başına', `${STANDART.ad}, ${PRO.ad} ve ${KURUMSAL.ad}`, [
    { platform: 'Kompass', metin: 'EasyBusiness veri tabanı 70 ülkede 60 milyondan fazla şirketi kapsar. Yıllık fiyatı 1.490 €’dan başlar.', kaynaklar: [KURESEL_KAYNAK.kompassFiyat, R.kompassVeri] },
  ]),
  modul('eslestirme-etkinlikleri', 'Eşleştirme etkinliği', 'Satıcı, sektör buluşmasında alıcılarla yüz yüze görüşür.', 'Etkinlik başına katılım ücreti', 'Bütün paketler', [
    { platform: 'Global Sources', metin: 'Fuarlar ve birebir eşleştirme hizmeti üyelikle birlikte satılır.', kaynaklar: [KURESEL_KAYNAK.gsBrosur] },
  ]),
  modul('lojistik', 'Anlaşmalı kargo', 'Satıcı platformun toplu anlaşmasıyla daha ucuz gönderir.', 'Gönderi başına', 'Bütün paketler', [
    { platform: 'Alibaba.com', metin: 'Çin’deki satıcıya lojistik hizmetini yılda 3.500 Çin yuanına satar. Bilgi 2022 tarihlidir.', kaynaklar: [R.alibabaCin] },
  ]),
  modul('beyaz-etiket', 'Beyaz etiketli mağaza', 'Satıcının kendi adıyla ve alan adıyla çalışan bir sipariş mağazası kurulur.', 'Kurulum ücreti ve aylık lisans', `Yalnız ${KURUMSAL.ad}`, [
    { platform: 'TradeIndia', metin: 'VIP Gold paketi alan adı, güvenli bağlantı sertifikası ve 10 dilde katalog içerir.', kaynaklar: [R.tradeindiaGold] },
  ]),
];
if (EK_MODULLER.map((m) => m.id).join() !== EK_MODUL_IDLERI.join()) throw new Error('Ek modül listesi ile kimlik listesi aynı sırada olmalı.');
export const MODUL_KURALI = 'Ek modülü paketten ayrı satın. Hazır olmayan modülü satmayın ve esnafa söz vermeyin. Örnek hesaplar gelir modellerindeki varsayımlardır.';

/* ---------- Bugün ve öneri (giriş) ---------- */

export interface Degisim {
  id: string;
  ad: string;
  bugun: string;
  oneri: string;
}
export const DEGISIMLER: Degisim[] = [
  { id: 'deneme', ad: 'Deneme bitince', bugun: ucretsizPaketVar ? 'Ücretsiz pakete iner' : 'Ücretli paket gerekir', oneri: 'Satıcı Ücretsiz pakete iner' },
  { id: 'yanit', ad: 'Teklif isteğine yanıt', bugun: paketYeri('quota.rfq_quotes_monthly'), oneri: 'Bütün ücretli paketlerde, kotayla' },
  {
    id: 'gosterim',
    ad: 'Satıcı sayfasında ilk görünen aylık tutar',
    bugun: yillikAylik ? `${sayi(yillikAylik, 2)} € (yıllık ödemenin aylık karşılığı)` : fiyatMetni(basic.aylikEur),
    oneri: `${fiyatMetni(STANDART.aylikEur)} (aylık fiyat)`,
  },
  { id: 'fiyat', ad: `${STANDART.ad} ve ${PRO.ad} aylık ücreti`, bugun: `${fiyatMetni(basic.aylikEur)} ve ${fiyatMetni(paket(ORTA).aylikEur)}`, oneri: `${fiyatMetni(STANDART.aylikEur)} ve ${fiyatMetni(PRO.aylikEur)}, değişmez` },
  { id: 'modul', ad: 'Paket dışı ek modül', bugun: 'Yok', oneri: `${EK_MODULLER.length} modül, ${hazirModeller.length} tanesi hazır` },
];

/* ---------- Karar bekleyen sorular ---------- */

export interface Karar {
  id: string;
  soru: string;
  oneri: string;
}
export const KARARLAR: Karar[] = [
  {
    id: 'yanit',
    soru: `Teklif isteğine yanıt ${STANDART.ad} paketine de açılsın mı?`,
    oneri: `Bu sayfa evet önerir. ${STANDART.ad} pakette ayda ${S.standartYanit} yanıt hakkı olur. ${PRO.ad} pakete yanıt 13 Kasım 2026 Cuma günü kararlaştırıldı. Bu sayfa ${PRO.ad} paket için ayda ${S.proYanit} yanıt önerir.`,
  },
  {
    id: 'deneme',
    soru: 'Deneme bitince satıcı Ücretsiz pakete insin mi?',
    oneri: `Bu sayfa evet önerir. Deneme ${CANLI_DENEME_GUN} gün ve ${DENEME_ONERI_ADI} paketinde kalır. Satıcı ödeme yapmazsa hesabı kapanmaz.`,
  },
  {
    id: 'fiyat',
    soru: `${STANDART.ad} paketin ${fiyatMetni(STANDART.aylikEur)} fiyatı korunsun mu?`,
    oneri: 'Bu sayfa şimdilik korunmasını önerir. Önce ödemeyi değere bağlayan düzeni deneyin. Ücretsizden ücretliye geçiş oranı ölçülünce fiyatı yeniden değerlendirin.',
  },
  { id: 'deger-onerisi', soru: 'Değer önerisi 7 ve 20 nasıl düzelsin?', oneri: 'Söz 7’yi Ücretsiz paketle uyumlu hale getirin. Söz 20 için kurulumun ücretli olup olmayacağına karar verin.' },
  ...(/Trade Assurance|Ticaret Güvencesi/.test(GUVENCE_ADI)
    ? [{ id: 'guvence', soru: '“Ticaret Güvencesi” adı değişsin mi?', oneri: 'Bu sayfa değişmesini önerir. Emanet ödeme hazır olana kadar ad, hizmetin yaptığı işi söylesin.' }]
    : []),
  {
    id: 'ilk-modul',
    soru: 'İlk hangi ek modül satılsın?',
    oneri:
      hazirModeller.length === 0
        ? `Bugün gelir modellerinde “${HAZIR}” olan bir modül yok.`
        : hazirModeller.length === 1
          ? `Bu sayfa ${hazirModeller[0].ad.toLocaleLowerCase('tr')} modülünü önerir. Gelir modellerinde “${HAZIR}” olan tek modül budur.`
          : `Bu sayfa önce ${liste(hazirModeller.map((m) => m.ad.toLocaleLowerCase('tr')))} modüllerini önerir. Gelir modellerinde “${HAZIR}” olan modüller bunlardır.`,
  },
];

export const SAYFA_NOTU = 'Bu sayfa bir öneridir. Sitenin fiyat tablosu, istoc.com fiyat planları ve gelir planı değişmedi. 13 Kasım 2026 Cuma günü alınan kararlar sayfaya işlendi. Küresel fiyatlar 12 Kasım 2026 Perşembe günü okundu.';
export const FIYAT_TABLOSU_NOTU = 'Fiyat tablosu, gelir modelleri sayfasındaki paket fiyatlarıdır. CRM sorumlusu satıcıya bu fiyatları söyler.';

/* ---------- Kaynak grupları ---------- */

export const KAYNAK_GRUPLARI: { ad: string; kaynaklar: Kaynak[] }[] = [
  { ad: 'istoc.com', kaynaklar: [R.saticiOl, R.planlar] },
  { ad: 'Alibaba.com', kaynaklar: [R.alibabaAbd, R.alibabaFiyat, R.alibabaBlog, R.alibabaCin, R.alibabaGuvence] },
  { ad: 'IndiaMART', kaynaklar: [R.indiamartPaket, R.indiamartMdc, R.indiamartTrust, R.indiamartYatirimci] },
  { ad: 'TradeIndia', kaynaklar: [R.tradeindiaGold, R.tradeindiaDogrulama] },
  { ad: 'TurkishExporter ve Endüstride Ara', kaynaklar: [R.turkishexporter, R.endustrideAra] },
  { ad: 'Europages, Kompass, Faire ve Global Sources', kaynaklar: [R.europagesYardim, KURESEL_KAYNAK.topRanking, KURESEL_KAYNAK.kompassFiyat, R.kompassVeri, KURESEL_KAYNAK.faireButce, KURESEL_KAYNAK.gsBrosur] },
  { ad: 'Ticimax', kaynaklar: [R.ticimax] },
  { ad: 'Deneme ve ücretsiz paket araştırmaları', kaynaklar: [R.chartmogul, R.chartmogul2, R.growthUnhinged] },
  { ad: 'Kur ve asgari ücret', kaynaklar: [R.tcmb, R.asgariBloomberg, R.asgariKpmg] },
];
