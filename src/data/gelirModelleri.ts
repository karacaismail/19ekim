/**
 * Gelir modelleri (kullanıcı kararı 2026-11-03): istoc.com’un bugünkü tek gelir modeli (abonelik, üç paket) ve bir B2B
 * toptan pazar yerine eklenebilecek aday gelir modelleri. Örnek hesaplar yöntemi gösteren varsayımlardır, söz ya da hedef
 * değildir. İhracat altyapısı (yazılım, gümrük, mikro ihracat operasyonu) hazır değildir: ihracatla ilgili hiçbir model
 * hazır gibi sunulmaz. Açıklamalar tam cümledir, noktalı virgül ve uzun çizgi kullanılmaz (`tests/gelir-modelleri.spec.ts`).
 */
import type { Params } from './params';

/** Hazırlık durumu: bugün satılabilir mi? */
export type Hazirlik = 'hazir' | 'yakinda' | 'hazir-degil';
/** Öncelik: 1 = ilk denenecek üç model, 3 = altyapı hazır olunca. */
export type Oncelik = 1 | 2 | 3;

export const HAZIRLIK_ADI: Record<Hazirlik, string> = {
  hazir: 'Hazır',
  yakinda: 'Yakında',
  'hazir-degil': 'Hazır değil',
};

export const HAZIRLIK_TANIMI: Record<Hazirlik, string> = {
  hazir: 'Bugünkü ekiple ve yazılım geliştirmeden başlatılabilir.',
  yakinda: 'Küçük bir yazılım geliştirmesi ya da bir ortakla anlaşma gerekir.',
  'hazir-degil': 'Yazılım, lisans, ortak ya da operasyon eksiktir. Bugün satılamaz ve esnafa söz verilmemelidir.',
};

export interface Paket {
  id: 'standart' | 'pro' | 'kurumsal';
  ad: string;
  /** Aylık ücret (€); Kurumsal için yok (teklif). */
  aylikEur: number | null;
  /** Yıllık peşin ücret (€): aylık ücret × yıllık pakette ücreti alınan ay. */
  yillikEur: number | null;
  not: string;
}

/** Pro paketin aylık ücreti (€). Henüz Parametreler’de değildir. */
export const PRO_AYLIK_EUR = 599;

export const eur = (n: number) => `${n.toLocaleString('tr-TR')} €`;

/** Bugünkü abonelik paketleri; Standart ücret ve yıllık pakette ücreti alınan ay Parametreler’den gelir. */
export function paketler(p: Pick<Params, 'subscriptionEur' | 'annualMonths'>): Paket[] {
  const yillik = (aylik: number) => aylik * p.annualMonths;
  return [
    {
      id: 'standart',
      ad: 'Standart',
      aylikEur: p.subscriptionEur,
      yillikEur: yillik(p.subscriptionEur),
      not: `Yıllık peşin ödemede ${eur(yillik(p.subscriptionEur))} ödenir. Bu tutar ${p.annualMonths} aylık ücrete eşittir.`,
    },
    {
      id: 'pro',
      ad: 'Pro',
      aylikEur: PRO_AYLIK_EUR,
      yillikEur: yillik(PRO_AYLIK_EUR),
      not: `Yıllık peşin ödemede ${eur(yillik(PRO_AYLIK_EUR))} ödenir. Bu tutar ${p.annualMonths} aylık ücrete eşittir.`,
    },
    {
      id: 'kurumsal',
      ad: 'Kurumsal',
      aylikEur: null,
      yillikEur: null,
      not: 'Fiyat, satıcının ihtiyacına göre teklifle belirlenir. Satıcı fiyat için teklif alır.',
    },
  ];
}

export interface GelirModeli {
  id: string;
  ad: string;
  /** Nasıl çalışır (1–2 cümle). */
  nasil: string;
  /** Örnek hesap: birimlidir, söz değildir. Kartta “Örnek hesap (varsayımdır, söz değildir)” başlığı altında görünür. */
  ornek: string;
  /** Kim öder? */
  kimOder: string;
  /** istoc.com’a uygunluk. */
  uygunluk: string;
  risk: string;
  /** Başlamak için ne gerekir? */
  gereken: string;
  hazirlik: Hazirlik;
  oncelik: Oncelik;
}

export const MODELLER: GelirModeli[] = [
  {
    id: 'islem-komisyonu',
    ad: 'İşlem komisyonu',
    nasil:
      'Platform üzerinden tamamlanan her siparişin tutarından küçük bir yüzde alınır. Oran, GMV (brüt sipariş hacmi, yani platformdan geçen siparişlerin toplam tutarı) üzerinden hesaplanır.',
    ornek: 'Bir satıcı platformdan ayda 200.000 ₺ sipariş alıyor. Komisyon oranı %1,5. Bu satıcıdan ayda 3.000 ₺ komisyon gelir.',
    kimOder: 'Satıcı öder. Komisyon her siparişin tutarından düşülür.',
    uygunluk: 'Sipariş ve ödeme platformdan geçmediği sürece uygulanamaz. Bugün esnaf alıcıyla çoğunlukla platform dışında anlaşır.',
    risk: 'Büyük ve seyrek verilen toptan siparişlerde yüzde ile alınan pay satıcıya adil gelmeyebilir. Satıcı bu yüzden anlaşmayı platform dışına taşıyabilir.',
    gereken: 'Sepet, sipariş ve ödeme akışının platformda çalışması gerekir.',
    hazirlik: 'hazir-degil',
    oncelik: 2,
  },
  {
    id: 'guvenli-odeme',
    ad: 'Güvenli ödeme ve emanet hesabı',
    nasil:
      'Alıcının ödemesi lisanslı bir ödeme kuruluşunda bekletilir. Mal teslim edilip alıcı onaylayınca para satıcıya geçer ve platform her işlemden hizmet bedeli alır.',
    ornek: 'Ayda 100 işlem yapılıyor. İşlem başına ortalama tutar 20.000 ₺, hizmet bedeli %0,5. Bu, ayda 10.000 ₺ gelir eder. Ödeme kuruluşunun kesintisi bu hesaba dahil değildir.',
    kimOder: 'Alıcı ya da satıcı öder. Bedeli kimin ödeyeceği sözleşmede belirlenir.',
    uygunluk: 'Yeni müşteriden parayı alamama riski esnafın en büyük sıkıntılarından biridir. Bu yüzden güçlü bir değer önerisidir.',
    risk: 'Platform parayı kendisi tutamaz. Lisanslı bir ödeme kuruluşuyla sözleşme, iade ve itiraz süreçleri gerekir.',
    gereken: 'Lisanslı bir ödeme kuruluşu ortağı, sözleşme ve platformda çalışan bir ödeme akışı gerekir.',
    hazirlik: 'hazir-degil',
    oncelik: 2,
  },
  {
    id: 'vadeli-satis',
    ad: 'Vadeli satış ve tedarik zinciri finansmanı',
    nasil:
      'Alıcı malı vadeli alır, satıcı ise parasını peşin alır. Aradaki finansmanı bir banka ya da finans şirketi sağlar. Platform, yönlendirdiği her işlem için ortaktan komisyon alır.',
    ornek: 'Ayda 500.000 ₺ tutarında vadeli işlem yönlendiriliyor. Ortak platforma %0,3 komisyon ödüyor. Bu, ayda 1.500 ₺ gelir eder.',
    kimOder: 'Komisyonu finans ortağı öder. Finansman maliyetini alıcı ya da satıcı üstlenir.',
    uygunluk: 'Toptan ticarette vadeli satış yaygındır. Bu yüzden esnaf için değeri yüksektir.',
    risk: 'Kredi riski ortakta kalmalıdır. Yanlış sunulursa platform borç tahsilatına karışmış gibi görünür.',
    gereken: 'Banka ya da finans şirketiyle ortaklık, alıcı ve satıcı doğrulaması ve platformda sipariş verisi gerekir.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
  {
    id: 'sponsorlu-urun',
    ad: 'Sponsorlu ürün ve öne çıkarma',
    nasil:
      'Satıcı, ürününün arama sonuçlarında ya da kategori sayfasında üstte görünmesi için ücret öder. Ücret belirli bir süre için sabit olabilir ya da tıklama başına alınabilir.',
    ornek: '40 satıcı ayda 50 € tutarında öne çıkarma paketi alıyor. Bu, ayda 2.000 € ek gelir eder.',
    kimOder: 'Satıcı öder.',
    uygunluk: 'Abonelik ödeyen satıcı tabanına eklenir. Satıcı karşılığını gösterim, tıklama ve mesaj sayısıyla görebilir.',
    risk: 'Alıcı trafiği az olursa satıcı karşılık göremez ve paketi yenilemez. Sponsorlu sonuçlar alıcıya açıkça etiketlenmelidir.',
    gereken: 'Öne çıkarma alanı, “sponsorlu” etiketi ve satıcıya gösterim ile tıklama raporu gerekir.',
    hazirlik: 'yakinda',
    oncelik: 1,
  },
  {
    id: 'kategori-vitrini',
    ad: 'Kategori vitrini sponsorluğu',
    nasil: 'Bir kategorinin vitrin alanı belirli bir süre için tek bir satıcıya ya da markaya kiralanır. Örneğin tekstil kategorisinin üst bölümü kiralanabilir.',
    ornek: '8 kategori vitrini var ve her biri ayda 150 €. Hepsi dolarsa ayda 1.200 € gelir eder.',
    kimOder: 'Satıcı, üretici ya da marka öder.',
    uygunluk: 'İstoç çarşısında kategorisinde güçlü toptancılar vardır. Vitrin onlara görünürlük sağlar.',
    risk: 'Vitrin sayısı sınırlı olduğu için gelirin tavanı düşüktür. Az satıcı alırsa vitrin boş kalır.',
    gereken: 'Kategori sayfalarında vitrin alanı ve süreli yayın yönetimi gerekir.',
    hazirlik: 'yakinda',
    oncelik: 2,
  },
  {
    id: 'dogrulanmis-tedarikci',
    ad: 'Doğrulanmış tedarikçi rozeti',
    nasil:
      'Satıcının vergi kaydı, adresi ve dükkânı ya da deposu ücretli bir denetimle kontrol edilir. Denetimi geçen satıcının profilinde rozet görünür.',
    ornek: '30 satıcı yılda bir kez 150 € denetim ücreti ödüyor. Bu, yılda 4.500 € gelir eder.',
    kimOder: 'Satıcı öder.',
    uygunluk: 'Yeni alıcı güven arar. Saha ekibi denetimi dükkân ziyaretinde yapabilir.',
    risk: 'Rozet verilen satıcı sorun çıkarırsa platformun güvenilirliği zarar görür. Denetim ölçütü yazılı ve herkes için aynı olmalıdır.',
    gereken: 'Yazılı denetim listesi, profilde rozet alanı ve yıllık yenileme kuralı gerekir.',
    hazirlik: 'yakinda',
    oncelik: 2,
  },
  {
    id: 'rfq',
    ad: 'Talep toplama ve teklif talebi ücreti',
    nasil:
      'Alıcıların satın alma talepleri toplanır. Bunlara RFQ (teklif talebi) denir. Talebe teklif vermek isteyen satıcı talep başına ücret öder. Bunun yerine satıcının aboneliğine belirli sayıda talep hakkı da eklenebilir.',
    ornek: 'Ayda 200 talep geliyor. Her talebi ortalama 3 satıcı açıyor. Talep açma ücreti 5 €. Bu, ayda 3.000 € gelir eder.',
    kimOder: 'Satıcı öder. Alıcı talebini ücretsiz bırakır.',
    uygunluk: 'Değer önerisindeki “gerçek alıcılardan sipariş fırsatı” sözüyle aynı yöndedir.',
    risk: 'Talepler zayıfsa satıcı para öder ama satış yapamaz. Bu durum aboneliği de kaybettirebilir.',
    gereken: 'Alıcı tarafında trafik, talep formu ve talepleri doğrulayan bir CRM (müşteri ilişkileri yönetimi) süreci gerekir.',
    hazirlik: 'yakinda',
    oncelik: 2,
  },
  {
    id: 'eklentiler',
    ad: 'Eklentiler (ek kullanıcı, ek ürün limiti ve entegrasyon)',
    nasil:
      'Paketin üzerine küçük ücretli ekler satılır. Ek kullanıcı hesabı ve daha yüksek ürün limiti bunlara örnektir. Stok ve fiyat eşitlemesi de bir ektir. Eşitleme ERP (kurumsal kaynak planlama) ya da muhasebe yazılımıyla yapılır.',
    ornek: '100 abone satıcının 25’i ayda 30 € tutarında ek alıyor. Bu, ayda 750 € ek gelir eder.',
    kimOder: 'Satıcı öder.',
    uygunluk: 'Abonelik modelinin doğal uzantısıdır. Büyüyen satıcı daha çok öder.',
    risk: 'Ekler temel pakette olması beklenen bir şeyi kısarsa satıcı kendini cezalandırılmış hisseder. Entegrasyonun bakımı sürekli emek ister.',
    gereken: 'Paket limitleri yazılı olmalıdır. Ek satın alma ekranı gerekir. En az bir muhasebe yazılımıyla entegrasyon da gerekir.',
    hazirlik: 'yakinda',
    oncelik: 1,
  },
  {
    id: 'kurulum-egitim',
    ad: 'Kurulum ve eğitim hizmeti',
    nasil:
      'Satıcının ürünleri, fotoğrafları, açıklamaları ve toptan fiyatları ekip tarafından platforma girilir. Satıcıya ve çalışanına kısa bir kullanım eğitimi verilir ve bu iş tek seferlik ücretle satılır.',
    ornek: 'Ayda 20 yeni satıcının yarısı 150 € tutarında kurulum paketi alıyor. Bu, ayda 1.500 € gelir eder.',
    kimOder: 'Satıcı öder.',
    uygunluk: 'Değer önerisindeki “ürünlerinizi biz dijital satışa hazırlayalım” sözüyle aynıdır. Kurulumu yapılmış satıcının aboneliği bırakma olasılığı düşebilir.',
    risk: 'Emek isteyen bir iştir. Fiyat düşük kalırsa ekibin zamanı zararına harcanır.',
    gereken: 'Yazılım gerekmez. Ekip saati, fiyat listesi ve kurulum kontrol listesi yeterlidir.',
    hazirlik: 'hazir',
    oncelik: 1,
  },
  {
    id: 'lojistik',
    ad: 'Lojistik ve kargo anlaşma marjı',
    nasil:
      'Platform kargo firmalarıyla toplu fiyat anlaşması yapar ve satıcı bu indirimli fiyatla gönderir. Platform, anlaşma fiyatı ile satıcıya yansıyan fiyat arasındaki farkı ya da firmadan aracılık payı alır.',
    ornek: 'Ayda 1.000 gönderi yapılıyor ve gönderi başına marj 10 ₺. Bu, ayda 10.000 ₺ gelir eder.',
    kimOder: 'Satıcı öder. Pay, kargo ücretinin içindedir.',
    uygunluk: 'Toptan gönderim esnafın günlük işidir. Daha ucuz kargo kolay anlaşılan bir faydadır.',
    risk: 'Marj küçüktür ve kargo firması koşulları değiştirebilir. Gecikme ve hasar şikâyetleri platforma döner.',
    gereken: 'En az bir kargo firmasıyla sözleşme ve gönderi oluşturma ekranı ya da indirim kodu gerekir.',
    hazirlik: 'yakinda',
    oncelik: 3,
  },
  {
    id: 'veri-raporlari',
    ad: 'Veri ve pazar raporları',
    nasil:
      'Platformdaki arama, talep ve fiyat verisinden kişisel veri içermeyen raporlar hazırlanır. Örneğin hangi ürünün hangi ilde arandığı raporlanır. Rapor abonelikle ya da tek tek satılır.',
    ornek: '20 satıcı ayda 25 € tutarında rapor aboneliği alıyor. Bu, ayda 500 € gelir eder.',
    kimOder: 'Satıcı, üretici ya da marka öder.',
    uygunluk: 'Esnaf neyin satacağını bilmek ister. Ancak raporun değeri platformdaki veri miktarıyla artar.',
    risk: 'Veri azken rapor yanıltıcı olur. KVKK (Kişisel Verilerin Korunması Kanunu) kurallarına uyulmalı ve kişisel veri satılmamalıdır.',
    gereken: 'Yeterli arama ve talep verisi, anonimleştirme ve rapor şablonu gerekir.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
  {
    id: 'eslestirme-etkinlikleri',
    ad: 'B2B eşleştirme etkinlikleri ve sponsorluk',
    nasil:
      'Alıcılar ve satıcılar belirli bir sektör için aynı gün, çarşıda ya da çevrim içi buluşturulur. Satıcı katılım ücreti öder ve etkinliğe sponsor da alınabilir.',
    ornek: 'Üç ayda bir etkinlik yapılıyor. 30 satıcı kişi başı 100 € katılım ücreti ödüyor. Etkinliğe 1.000 € sponsorluk geliyor. Etkinlik başına 4.000 € gelir eder. Salon ve ikram gibi giderler düşülmemiştir.',
    kimOder: 'Satıcı ve sponsor öder.',
    uygunluk: 'İstoç çarşısı fiziksel bir buluşma yeridir. Organizatör rolü bu işi üstlenebilir.',
    risk: 'Alıcı gelmezse satıcı memnun kalmaz ve sonraki etkinliğe katılmaz. Giderler önden ödenir.',
    gereken: 'Organizatör, davet edilecek alıcı listesi ve etkinlik takvimi gerekir.',
    hazirlik: 'yakinda',
    oncelik: 2,
  },
  {
    id: 'beyaz-etiket',
    ad: 'Beyaz etiketli kurumsal mağaza',
    nasil:
      'Büyük bir toptancıya ya da üreticiye bir B2B sipariş mağazası kurulur. Mağaza müşterinin kendi adı ve alan adıyla çalışır. Altyapı istoc.com’dur. Kurulum ücreti ve aylık lisans alınır.',
    ornek: '3 kurumsal müşteri var. Her biri 2.000 € kurulum ücreti ve ayda 300 € lisans ödüyor. Bu, ilk yıl 16.800 € gelir eder.',
    kimOder: 'Kurumsal müşteri öder.',
    uygunluk: 'Kurumsal paketin doğal devamıdır. Fiyatı teklifle belirlenir.',
    risk: 'Her müşteri özel istek getirir. Ürün ekibinin yükü artar ve ana platformdaki işler gecikebilir.',
    gereken: 'Her müşteriye ayrı alan açan bir altyapı gerekir. Alan adı ve marka ayarları da gerekir. Bir destek sözleşmesi yapılmalıdır.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
  {
    id: 'alacak-sigortasi',
    ad: 'Ticari alacak sigortası komisyonu',
    nasil:
      'Satıcının vadeli satışta alıcıdan alacağı para bir sigorta şirketi tarafından güvenceye alınır. Platform, lisanslı bir acente ortağı üzerinden yönlendirdiği poliçelerden komisyon alır.',
    ornek: '15 satıcı yılda 1.000 € prim ödüyor ve platformun payı %10. Bu, yılda 1.500 € gelir eder.',
    kimOder: 'Primi satıcı öder. Komisyonu sigorta şirketi ya da acente öder.',
    uygunluk: 'Vadeli satış yapan toptancı için alacak riski gerçektir.',
    risk: 'Sigorta aracılığı lisans ister ve lisanssız aracılık yapılamaz. Bu yüzden lisanslı bir acente ortağı şarttır.',
    gereken: 'Lisanslı acente ya da sigorta şirketiyle ortaklık ve satıcı için başvuru akışı gerekir.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
  {
    id: 'ihracat',
    ad: 'İhracat hizmetleri',
    nasil: 'Yurt dışındaki alıcılara satış için gümrük işlemleri, mikro ihracat ve uluslararası kargo ücret karşılığı sunulur.',
    ornek: 'Varsayım kurulmadı. Hizmet hazır olmadığı için gelir hesabı yapılmadı.',
    kimOder: 'Henüz belirlenmedi.',
    uygunluk: 'Esnafın ilgisi olabilir. Ancak bugün bu hizmet sunulamaz ve esnafa söz verilmemelidir.',
    risk: 'Hazır olmayan bir hizmeti satmak güven kaybına ve yasal soruna yol açar.',
    gereken: 'İhracat yazılımı, gümrük müşavirliği ortağı, mikro ihracat operasyonu ve uluslararası kargo anlaşması gerekir. Bunların hiçbiri bugün hazır değildir.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
];

/** İlk denenecek üç model ve gerekçesi (öncelik 1 olanlar, bu sırayla). */
export const ONCELIK_ONERISI: { id: string; neden: string }[] = [
  {
    id: 'kurulum-egitim',
    neden: 'Yazılım gerektirmez ve bugün başlatılabilir. Satıcı ilk günden dolu bir mağazayla başlar. Bu da aboneliği sürdürme olasılığını artırabilir.',
  },
  {
    id: 'eklentiler',
    neden: 'Bugünkü abonelik ödemesine eklenir ve yeni bir satış konuşması gerektirmez. Büyüyen satıcı daha çok öder.',
  },
  {
    id: 'sponsorlu-urun',
    neden: 'Zaten ödeme yapan satıcılardan ek gelir sağlar. Sonuç gösterim ve tıklamayla ölçülür ve alıcı trafiği arttıkça değeri büyür.',
  },
];

export const ONCELIK_NOTU =
  'İşlem komisyonu ve güvenli ödeme daha büyük gelir getirebilir. Ancak sipariş ve ödeme akışı platformda çalışmadan bu iki model denenemez.';

/** Araştırma notu: temkinli dil, “kaynaklara göre”. Doğrulanmış pazar verisi değildir. */
export const ARASTIRMA_NOTU: string[] = [
  'Kaynaklara göre B2B pazar yerleri gelirini çoğunlukla birkaç modelin birleşiminden elde eder. Tek bir modele dayanmaz. Bunlar abonelik, işlem komisyonu, reklam ve gömülü finanstır. Gömülü finans, ödeme, vade ve sigorta gibi finans hizmetlerinin platformun içinde sunulması demektir.',
  'Bain Capital Ventures bir değerlendirme yaptı. Buna göre büyük ve seyrek B2B siparişlerinde yüzdeyle alınan komisyon satıcıya adil gelmeyebilir. Bu durumda satıcı anlaşmayı platform dışına taşımaya yönelebilir.',
  'Kaynaklara göre Hindistan’ın büyük B2B pazar yeri IndiaMART, gelirinin büyük kısmını satıcı aboneliklerinden elde eder. Bu, istoc.com’un bugünkü abonelik modelinin sektörde karşılığı olduğunu düşündürür.',
  'Bu bilgiler genel kaynaklara dayanır. Doğrulanmış pazar verisi değildir.',
];

export const KISALTMALAR: { kisa: string; acik: string }[] = [
  { kisa: 'B2B', acik: 'İşletmeden işletmeye satış. Alıcı da satıcı da işletmedir.' },
  { kisa: 'GMV', acik: 'Brüt sipariş hacmi. Platformdan geçen siparişlerin toplam tutarıdır.' },
  { kisa: 'RFQ', acik: 'Teklif talebi. Alıcının satın almak istediği ürün için satıcılardan fiyat istemesidir.' },
  { kisa: 'ERP', acik: 'Kurumsal kaynak planlama. Stok, satış ve muhasebeyi tek yerde yöneten yazılımdır.' },
  { kisa: 'CRM', acik: 'Müşteri ilişkileri yönetimi. Müşteri ve görüşme kayıtlarının tutulduğu sistemdir.' },
  { kisa: 'KVKK', acik: 'Kişisel Verilerin Korunması Kanunu.' },
];
