/**
 * İçerik envanteri (docs/contents.md §2.1, §4.2–§4.4, §6; kullanıcı kararı 2026-10-28): her yayımlanan sayfanın tek ana
 * kaydı — içerik sınıfı, kullanıcının sorusu, ana ebeveyn (menü grubu), marka kapsamı, sahip, yaşam döngüsü, kanıt
 * niteliği, kaynak, güncellik, düzenleme kapsamı ve alt bilgi kapsam cümlesi. Menü, kırıntı ve alt bilgi buradan
 * türetilir (F10, F15); sunum sırası (`tree.ts` SEQUENCE) ayrı bir rotadır, içerik hiyerarşisi değildir.
 *
 * Sahip ya da kaynak bilinmiyorsa “belirlenmedi” yazılır; hayali kişi/kaynak üretilmez (§4.3). Planlanan sayfalar
 * (`planlandi`) içerik taşınana kadar dosya olarak açılmaz (boş kabuk yok, §8).
 */

/** İçerik sınıfı (§2.1): aynı sayfa birden çok sınıf taşıyabilir; ilk sınıf baskındır. */
export type IcerikSinifi = 'strateji' | 'operasyon' | 'politika' | 'finans-model' | 'kaynak-veri' | 'yontem' | 'kisisel' | 'sistem';
/** Kanıt niteliği (§4.4). */
export type KanitNiteligi = 'olculmus' | 'kaynakli' | 'hesaplanmis' | 'varsayilmis' | 'ornek' | 'bilinmiyor';
/** İçerik yaşam döngüsü (§4.4). */
export type YasamDongusu = 'taslak' | 'inceleniyor' | 'onaylandi' | 'yururlukte' | 'arsiv';
/** Düzenleme kapsamı (§4.4). */
export type DuzenlemeKapsami = 'yok' | 'yayin-varsayilani' | 'bu-tarayici' | 'bu-senaryo' | 'dis-kaynak';
/** İçeriğin türetildiği kaynak türü (B2c, docs/missings.md MS-11): alt bilgi ön cümlesi yalnız `tahta` için. */
export type Turetim = 'tahta' | 'sheets' | 'oneri' | 'ornek' | 'egitim' | 'kisisel' | 'sistem';

/** Ana ebeveyn (menü grubu, §5.2). `dogrudan`: menüde ve sunum sırasında olmayan sayfa. */
export type IcerikGrubu = 'pazarlama' | 'istihdam' | 'finans' | 'yonetim' | 'yardimci' | 'dogrudan' | 'sistem';
export type Marka = 'istoc' | 'segika' | 'turksab';

export interface IcerikKaydi {
  id: string;
  path: string;
  sinif: IcerikSinifi[];
  /** Sayfa başlığı (h1). */
  baslik: string;
  /** Kullanıcının bu sayfada yanıt aradığı soru. */
  kullaniciSorusu: string;
  grup: IcerikGrubu;
  /** Grup içinde ana ebeveyn sayfa (rol sayfaları → organizasyon şeması). */
  ebeveyn?: string;
  /** Türetim kaynağı: tahta (19 Ekim kararları ve pano) / sheets / öneri / örnek / eğitim / kişisel / sistem. */
  turetim: Turetim;
  marka: Marka[];
  sahip: string;
  durum: YasamDongusu;
  kanit: KanitNiteligi;
  kaynak: string;
  asOf: string;
  gozdenGecirme: string;
  duzenleme: DuzenlemeKapsami;
  /** Alt bilgi kapsam cümlesi (F10): sayfa genelinde yalnız kapsamı doğru özetler; blok düzeyi durum ayrıca. */
  kapsam: string;
  iliskili: string[];
  /** Menü etiketi (grup menüsünde); yoksa doğrudan erişim. */
  menu?: string;
  /** Henüz içerik taşınmamış, planlanan sayfa (dosyası yok). */
  planlandi?: boolean;
  /** Ara kırıntılar (grup/ebeveyn yerine; son kırıntı başlıktır) — belgeli kullanıcı kararı (Giderler: Finans › OpEx). */
  kirintiYolu?: string[];
}

export const SINIF_ADI: Record<IcerikSinifi, string> = {
  strateji: 'Strateji',
  operasyon: 'Operasyon planı',
  politika: 'Politika',
  'finans-model': 'Finansal model',
  'kaynak-veri': 'Kaynak veri',
  yontem: 'Yöntem ve örnek',
  kisisel: 'Kişisel çalışma',
  sistem: 'Sistem',
};
export const KANIT_ADI: Record<KanitNiteligi, string> = { olculmus: 'Ölçülmüş', kaynakli: 'Kaynaklı', hesaplanmis: 'Hesaplanmış', varsayilmis: 'Varsayılmış', ornek: 'Örnek', bilinmiyor: 'Bilinmiyor' };
export const DURUM_ADI: Record<YasamDongusu, string> = { taslak: 'Taslak', inceleniyor: 'İnceleniyor', onaylandi: 'Onaylandı', yururlukte: 'Yürürlükte', arsiv: 'Arşiv' };
export const DUZENLEME_ADI: Record<DuzenlemeKapsami, string> = { yok: 'Düzenlenmez', 'yayin-varsayilani': 'Yayın varsayılanı', 'bu-tarayici': 'Bu tarayıcı', 'bu-senaryo': 'Bu senaryo', 'dis-kaynak': 'Dış kaynak' };
/** Grup adları: menü düğmesi, çekmece başlığı ve kırıntının ilk parçası aynı sözcük (F19 sözlüğü; “Yardımcı” §5.2’deki “Yardımcı erişim”in kısa adı). */
export const GRUP_ADI: Record<IcerikGrubu, string> = { pazarlama: 'Pazarlama', istihdam: 'İstihdam', finans: 'Finans', yonetim: 'Yönetim', yardimci: 'Yardımcı', dogrudan: 'Doğrudan erişim', sistem: 'Sistem' };

const T = '2026-10-28';
const BELIRLENMEDI = 'belirlenmedi';
const PARAM_NOTU = 'Parametreler sayfasında değiştirilen değerler yalnız değiştirildikleri tarayıcıda saklanır.';

const rol = (slug: string, baslik: string, soru: string, kapsam: string, marka: Marka[] = ['istoc']): IcerikKaydi => ({
  id: `rol-${slug}`,
  path: `/roller/${slug}/`,
  sinif: ['operasyon'],
  baslik,
  kullaniciSorusu: soru,
  grup: 'istihdam',
  ebeveyn: 'organizasyon',
  turetim: 'tahta',
  marka,
  sahip: BELIRLENMEDI,
  durum: 'inceleniyor',
  kanit: 'varsayilmis',
  kaynak: 'src/data/roles.ts (19 Ekim tahta kararları ve planlama panosu)',
  asOf: T,
  gozdenGecirme: 'Kadro, görev ya da başlangıç koşulu değişince',
  duzenleme: 'yok',
  kapsam: `${kapsam} Ücret özeti örnek bir politikadır. Gerçekleşmiş performansı veya bordro kaydını göstermez. ${PARAM_NOTU}`,
  iliskili: ['organizasyon', 'istihdam', 'eylem-plani', 'applet'],
});

export const ICERIK: IcerikKaydi[] = [
  {
    id: 'organizasyon',
    path: '/',
    sinif: ['operasyon'],
    baslik: 'Organizasyon şeması',
    kullaniciSorusu: 'Kim kime bağlı, hangi rol ne zaman ve kaç kişiyle planlanıyor?',
    grup: 'istihdam',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'inceleniyor',
    kanit: 'varsayilmis',
    kaynak: 'src/data/tree.ts; kişi sayısı ve tarihler Parametreler',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Kadro kararı ya da başlangıç tarihi değişince',
    duzenleme: 'yok',
    kapsam: `Şema planlanan kadroyu gösterir. Kişi sayıları ve başlangıç tarihleri plandır, kimsenin işe başladığını kanıtlamaz. ${PARAM_NOTU}`,
    iliskili: ['istihdam', 'eylem-plani'],
    menu: 'Organizasyon şeması',
  },
  rol('dijital-pazarlama', 'Dijital pazarlama uzmanı', 'Dijital pazarlama uzmanı hangi çıktılardan sorumludur ve günü nasıl düzenlenir?', 'Rol profili planlanan sorumlulukları anlatır. Kanal ve içerik planının asıl yeri Pazarlama operasyonu sayfasıdır.'),
  rol('pazarlamaci', 'Masa başı pazarlama (CRM)', 'iStoc CRM rolü hangi aşamaları yürütür ve aday ne zaman müşteri sayılır?', 'Rol profili planlanan sorumlulukları anlatır. Müşteri aşamaları Müşteri yolculuğu kaydında tanımlanır.'),
  rol('saha-uzmani', 'Saha pazarlama ekibi', 'Saha ekibi ne teslim eder ve kaydı CRM’e nasıl aktarır?', 'Rol profili planlanan sorumlulukları anlatır. Temsilci ağı modeli ayrı bir sayfada anlatılır.'),
  rol('ekip-lideri', 'Satış-pazarlama ekip lideri', 'Ekip lideri hangi kararları kendisi verir, hangilerini bir üst role iletir?', 'Rol profili planlanan sorumlulukları anlatır. Ağ modeli ayrı bir sayfada anlatılır.'),
  rol('organizator', 'Organizatör', 'Organizatör hangi etkinlik sonuçlarından sorumludur ve katılım ile aktivasyon nasıl ayrılır?', 'Rol profili planlanan sorumlulukları anlatır. Toplantı programı Eylem planında ortak bir etkinlik olarak yer alır.'),
  rol('segika', 'Segika masa başı pazarlama (CRM)', 'Segika satış ve CRM rolü neyi üstlenir? Demo, ilk değer ve destek devri nasıl işler?', 'Rol profili planlanan sorumlulukları anlatır. Segika’ya özgü müşteri, demo ve destek devri kuralları henüz netleşmedi. Bu yüzden iStoc için tanımlanan olaylar Segika’ya kopyalanmaz.', ['segika']),
  rol('asistan', 'Yönetici asistanı', 'Asistan hangi işlerde destek verir, talebi kim iletir ve işin yapıldığı nasıl kanıtlanır?', 'Rol profili planlanan sorumlulukları anlatır ve henüz onay bekler. Şirketin karar listesi Kararlar sayfasındadır.', ['istoc', 'segika']),
  {
    id: 'istihdam',
    path: '/istihdam/',
    sinif: ['operasyon'],
    baslik: 'İstihdam takvimi',
    kullaniciSorusu: 'Hangi rol ne zaman ve hangi koşulla işe alınacak, bunun maliyeti ne olacak?',
    grup: 'istihdam',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'inceleniyor',
    kanit: 'varsayilmis',
    kaynak: 'src/data/istihdamPlani.ts (Kadro Kapasite Planı ve GAP eylem planı, 3 Kasım 2026); katkı tablosu src/data/staffing.ts; Parametreler',
    turetim: 'tahta',
    asOf: '2026-11-03',
    gozdenGecirme: 'İşe alım sırası, başlangıç tarihi ya da bütçe değişince',
    duzenleme: 'yok',
    kapsam: `İşe alım sırası ve takvim plandır. Bir işe alımın onaylanması, kişinin işe başladığını kanıtlamaz. Kadro katkısı, modelde kişinin alındığı ve alınmadığı durumlar arasındaki farktır. Gerçek kişi performansını göstermez. ${PARAM_NOTU}`,
    iliskili: ['organizasyon', 'eylem-plani', 'gelir-plani', 'giderler'],
    menu: 'İstihdam takvimi',
  },
  {
    id: 'kadro-kapasitesi',
    path: '/kadro-kapasitesi/',
    sinif: ['operasyon'],
    baslik: 'Kadro kapasitesi',
    kullaniciSorusu: 'Her rol hangi iş yükü ve hedefle başlar, hangi karar ne zamana kadar verilmeli?',
    grup: 'istihdam',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'varsayilmis',
    kaynak: 'src/data/istihdamPlani.ts (Kadro Kapasite Planı ve GAP eylem planı, 3 Kasım 2026)',
    turetim: 'oneri',
    asOf: '2026-11-03',
    gozdenGecirme: 'İlk 30 günün gerçek ölçümü gelince',
    duzenleme: 'yok',
    kapsam: 'Saat değerleri karar vermek için kurulmuş varsayımlardır, ölçülmüş süre değildir. Hukuki maddeler genel bilgidir ve avukat ile mali müşavir görüşünün yerine geçmez.',
    iliskili: ['istihdam', 'organizasyon'],
    menu: 'Kadro kapasitesi',
  },
  {
    id: 'applet',
    path: '/applet/',
    sinif: ['yontem'],
    baslik: 'Ücret ve performans applet’leri',
    kullaniciSorusu: 'Bir ücret, prim veya performans modelini nasıl kurarım ve örnek değerlerle hangi sonuç çıkar?',
    grup: 'istihdam',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'yururlukte',
    kanit: 'ornek',
    kaynak: 'src/data/applet.ts (örnek veriler)',
    turetim: 'ornek',
    asOf: T,
    gozdenGecirme: 'Ücret politikası taslağı değişince',
    duzenleme: 'bu-tarayici',
    kapsam: 'Applet tutarları örnek verilerdir ve şirket kararı değildir. Yapılan değişiklikler yalnız bu tarayıcıda saklanır. Bir örnek, ancak Kararlar sayfası üzerinden politika önerisine dönüşür.',
    iliskili: ['ucret-politikasi', 'karar'],
    menu: 'Applet',
  },
  {
    id: 'hedefler',
    path: '/hedefler/',
    sinif: ['strateji', 'finans-model'],
    baslik: '90 gün hedefleri',
    kullaniciSorusu: 'Hangi hedefe, hangi dönemde ve hangi kaynakla ulaşılacak, tahmin hedefe ne kadar yakın?',
    grup: 'yonetim',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'onaylandi',
    kanit: 'varsayilmis',
    kaynak: 'src/data/program.ts (19 Ekim tahta hedefleri); tahmin src/data/revenue.ts',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: '2. haftanın sonunda gerçek veriyle kalibrasyon',
    duzenleme: 'bu-senaryo',
    kapsam: `Hedefler 19 Ekim tahtasındaki başlangıç değerleridir. Tahminler seçili senaryoya bağlıdır. Henüz gerçekleşen ölçüm yoktur, bu yüzden boş bir değer sıfır değil, ölçülmemiş demektir. ${PARAM_NOTU}`,
    iliskili: ['gelir-plani', 'eylem-plani', 'karar', 'olcum'],
    menu: 'Hedefler',
  },
  {
    id: 'gelir-plani',
    path: '/gelir-plani/',
    sinif: ['finans-model'],
    baslik: 'Gelir planı',
    kullaniciSorusu: 'Bu kadro, fiyat ve kanal varsayımlarıyla gelir ne olabilir ve başabaş noktasına ne zaman ulaşılır?',
    grup: 'finans',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'inceleniyor',
    kanit: 'hesaplanmis',
    kaynak: 'src/data/revenue.ts, src/data/model.ts; Parametreler ve senaryo kurucu',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Fiyat, kadro, kanal bütçesi ya da dönüşüm varsayımı değişince',
    duzenleme: 'bu-senaryo',
    kapsam: `Bu sayfadaki tutarlar seçili senaryoya göre koşullu tahmindir, kesinleşmiş karar değildir. Hesap, koşullu abonelik modeliyle yapılır. İş modelinin abonelik mi, işlem gelirine dayalı likidite pilotu mu olacağına henüz karar verilmedi. Likidite pilotu için ayrıca bir hesap modeli yoktur. ${PARAM_NOTU}`,
    iliskili: ['hedefler', 'nakit-akisi', 'giderler', 'parametreler', 'karar'],
    menu: 'Gelir planı',
  },
  {
    id: 'eylem-plani',
    path: '/eylem-plani/',
    sinif: ['operasyon'],
    baslik: 'Eylem planı',
    kullaniciSorusu: 'Kim neyi ne zaman teslim edecek ve bu iş neye bağlı?',
    grup: 'yonetim',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'onaylandi',
    kanit: 'varsayilmis',
    kaynak: 'src/data/program.ts (yönetici planı ve rol planları)',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Teslim tarihi, sorumlu ya da bağımlılık değişince',
    duzenleme: 'yok',
    kapsam: `Eylemler, 19 Ekim kararlarına dayanan planlanmış teslimlerdir. Tarihler ve sorumlular plandır, işlerin tamamlandığına dair kanıt henüz yoktur. Rol ve ortaklık görünümleri aynı kayıtları süzerek gösterir. ${PARAM_NOTU}`,
    iliskili: ['hedefler', 'istihdam', 'satis-ortakligi', 'karar'],
    menu: 'Eylem planı',
  },
  {
    id: 'buyume-modeli',
    path: '/buyume-modeli/',
    sinif: ['strateji', 'finans-model'],
    baslik: 'Çok katmanlı pazarlama ağı (MLM)',
    kullaniciSorusu: 'iStoc temsilci ağı nasıl büyür? Katmanlar, huni ve hedefler nelerdir?',
    grup: 'pazarlama',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'inceleniyor',
    kanit: 'hesaplanmis',
    kaynak: 'src/data/growth.ts; Parametreler',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Temsilci kazanım varsayımı ya da katman kuralı değişince',
    duzenleme: 'bu-senaryo',
    kapsam: `Temsilci ağı modeli seçili senaryoya göre koşullu tahmindir. Temsilci kazanma hunisi, müşteri kazanma hunisiyle toplanmaz. Segika ortaklık kuralları bu sayfada yer almaz. ${PARAM_NOTU}`,
    iliskili: ['rol-saha-uzmani', 'rol-ekip-lideri', 'gelir-plani', 'satis-ortakligi'],
    menu: 'Temsilci ağı',
  },


  {
    id: 'satis-ortakligi',
    path: '/satis-ortakligi/',
    turetim: 'oneri',
    sinif: ['strateji', 'politika'],
    baslik: 'Satış ortaklığı programı',
    kullaniciSorusu: 'iStoc ve Segika’da hangi ortaklık rolü kime, hangi hedef ve kazançla sunulur?',
    grup: 'pazarlama',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'varsayilmis',
    kaynak: 'src/data/satisOrtakligi.ts (kullanıcı kararı 3 Kasım 2026; Segika fiyatları segika.com)',
    asOf: '2026-11-03',
    gozdenGecirme: 'Fiyat, kur ya da komisyon oranı değişince',
    duzenleme: 'yok',
    kapsam: 'Bu program bir öneridir. Oranlar, kotalar ve hedefler başlangıç değeridir, imzalı sözleşme değildir. Döviz kuru 3 Kasım 2026 tarihli değerdir.',
    iliskili: ['deger-onerisi', 'buyume-modeli'],
    menu: 'Satış ortaklığı',
  },
  {
    id: 'deger-onerisi',
    path: '/deger-onerisi/',
    turetim: 'oneri',
    sinif: ['strateji'],
    baslik: 'Değer önerisi',
    kullaniciSorusu: 'Saha ekibi esnafa hangi sözü verir, platform bu sözü tutmak için ne yapmalı?',
    grup: 'pazarlama',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'kaynakli',
    kaynak: 'src/data/degerOnerisi.ts (kullanıcının paylaştığı araştırma raporu, 3 Kasım 2026)',
    asOf: '2026-11-03',
    gozdenGecirme: 'Bir hizmet hazır olunca ya da kaldırılınca',
    duzenleme: 'yok',
    kapsam: 'Sözlerin çoğu henüz çalışan bir hizmet değil, öneridir. Esnafa söz vermeden önce hizmetin hazır olduğu doğrulanmalıdır.',
    iliskili: ['satis-ortakligi'],
    menu: 'Değer önerisi',
  },
  {
    id: 'gelir-modelleri',
    path: '/gelir-modelleri/',
    turetim: 'oneri',
    sinif: ['strateji', 'finans-model'],
    baslik: 'Gelir modelleri',
    kullaniciSorusu: 'istoc.com abonelik dışında hangi yollarla gelir elde edebilir ve bunların hangisi bugün hazır?',
    grup: 'pazarlama',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'varsayilmis',
    kaynak: 'src/data/gelirModelleri.ts (kullanıcı kararı 3 Kasım 2026; Standart paket ücreti Parametreler)',
    asOf: '2026-11-03',
    gozdenGecirme: 'Bir gelir modeli hazır olunca ya da paket fiyatı değişince',
    duzenleme: 'yok',
    kapsam: `Bugünkü gelir modeli yalnız aboneliktir. Aday modellerin çoğu hazır değildir ve örnek hesaplar varsayımdır, gelir sözü değildir. İhracat hizmetleri hazır değildir. ${PARAM_NOTU}`,
    iliskili: ['satis-ortakligi', 'deger-onerisi'],
    menu: 'Gelir modelleri',
  },
  {
    id: 'oyunlastirma',
    path: '/oyunlastirma/',
    turetim: 'oneri',
    sinif: ['strateji'],
    baslik: 'Oyunlaştırma',
    kullaniciSorusu: 'istoc.com alıcı ile satıcının birbirini beklediği başlangıç sorununu hangi yalın oyun mekanikleriyle çözer ve her biri nasıl uygulanır?',
    grup: 'pazarlama',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'kaynakli',
    kaynak: 'src/data/oyunlastirma.ts (kullanıcı kararı 4 Kasım 2026; uzun metin ve kaynaklar docs/oyunlastirma-yalin/)',
    asOf: '2026-11-04',
    gozdenGecirme: 'Sipariş ve ödeme platforma gelince ya da gelir modeli kararı verilince',
    duzenleme: 'yok',
    kapsam: 'Stratejiler öneridir. Rakamlar pilotta ayarlanacak örnek değerlerdir. Ödüller bugün kaydedilebilen olaylara bağlıdır, çünkü sipariş ve ödeme henüz platformda değildir.',
    iliskili: ['deger-onerisi', 'gelir-modelleri', 'satis-ortakligi'],
    menu: 'Oyunlaştırma',
  },
  {
    id: 'onboarding',
    path: '/onboarding/',
    turetim: 'oneri',
    sinif: ['operasyon'],
    baslik: 'Yeni kayıt gelince ne yapılır?',
    kullaniciSorusu: 'CRM masası sorumlusu yeni bir kayıtla karşılaştığı her durumda hangi adımları izler, kayıt hangi aşamada ve aşama ne zaman biter?',
    grup: 'pazarlama',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'varsayilmis',
    kaynak: 'src/data/onboarding.ts (kullanıcı kararları 10 Kasım 2026; paket ücretleri Parametreler ve gelir modelleri)',
    asOf: '2026-11-10',
    gozdenGecirme: 'İlk kayıtlarla pilot bitince ya da sipariş ve ödeme platforma gelince',
    duzenleme: 'yok',
    kapsam: `Akış öneridir. Gün sayıları ve 10 ürün hedefi pilotta ayarlanacak başlangıç değerleridir. ${PARAM_NOTU}`,
    iliskili: ['deger-onerisi', 'gelir-modelleri', 'hedefler'],
    menu: 'Yeni kayıtlar',
  },

  {
    id: 'karar',
    path: '/karar/',
    sinif: ['politika'],
    baslik: 'Kararlar',
    kullaniciSorusu: 'Hangi kararlar bekliyor, hangileri verildi, kim neye karar verir ve hangi tarihte hangi eşik ölçülür?',
    grup: 'yonetim',
    marka: ['istoc', 'segika'],
    sahip: 'İsmail Karaca (karar veren)',
    durum: 'inceleniyor',
    kanit: 'kaynakli',
    kaynak: 'src/data/program.ts (karar kayıtları)',
    turetim: 'tahta',
    asOf: '2026-11-03',
    gozdenGecirme: 'Karar alınınca ya da yeni çelişki kaydı açılınca',
    duzenleme: 'yok',
    kapsam: `Bekleyen kararlar seçenekleri ve etkileriyle listelenir. Karar yetkisi ve kontrol noktaları 19 Ekim tahta kararlarına dayanır. Kesinleşen kararlar tarihleriyle kaydedilir. Ücret, CRM ve mesai politikalarının metinleri bu listede değil, kendi sayfalarında yer alır. ${PARAM_NOTU}`,
    iliskili: ['ucret-politikasi', 'musteri-yolculugu', 'gelir-plani'],
    menu: 'Kararlar',
  },
  {
    id: 'parametreler',
    path: '/parametreler/',
    sinif: ['kaynak-veri'],
    baslik: 'Parametreler',
    kullaniciSorusu: 'Hangi varsayım hangi sonucu değiştiriyor, yayındaki değer ne ve ben neyi değiştirdim?',
    grup: 'yardimci',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'yururlukte',
    kanit: 'varsayilmis',
    kaynak: 'src/data/params.ts (yayın varsayılanları)',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Yasal değer (asgari ücret, dilim), fiyat ya da kadro kararı değişince',
    duzenleme: 'bu-tarayici',
    kapsam: 'Varsayılan değerler sitede yayımlanan değerlerdir. Değişiklikler yalnız bu tarayıcıda saklanır ve bütün hesap sayfalarını etkiler. Bu değişiklikler şirket kararı veya onaylı politika değildir. 2027 yılının yasal değerleri varsayımdır.',
    iliskili: ['gelir-plani', 'nakit-akisi', 'istihdam', 'giderler'],
    menu: 'Varsayımlar ve ayarlar',
  },
  {
    id: 'giderler',
    path: '/giderler/',
    sinif: ['kaynak-veri', 'finans-model'],
    baslik: 'Operasyonel Giderler',
    kirintiYolu: ['Finans', 'OpEx'],
    kullaniciSorusu: 'Hangi gider kalemi hangi dönemde ve hangi kaynaktan planlandı, personel maliyeti ne kadar?',
    grup: 'finans',
    marka: ['turksab', 'istoc'],
    sahip: BELIRLENMEDI,
    durum: 'yururlukte',
    kanit: 'kaynakli',
    kaynak: 'Giderler Sheets dosyası (açılışta okunur); src/data/opex.ts',
    turetim: 'sheets',
    asOf: T,
    gozdenGecirme: 'Sheets dosyası değişince (her açılışta)',
    duzenleme: 'dis-kaynak',
    kapsam: 'Gider tutarları, sayfa açılırken Giderler Sheets dosyasından okunur. Dosya değişince bu sayfa da değişir. Kaynak bir plandır, ödeme takibi değildir. Kaynak kurum Türksab’dır. Giderlerin markalara nasıl dağıtılacağı henüz belirlenmedi ve karar bekliyor. Varsayım kaynakları yalnız arama bağlantısıdır, doğrulanmış belge değildir.',
    iliskili: ['nakit-akisi', 'gelir-plani', 'parametreler', 'karar'],
    menu: 'Giderler',
  },
  {
    id: 'nakit-akisi',
    path: '/nakit-akisi/',
    sinif: ['finans-model'],
    baslik: 'Nakit akış tablosu',
    kullaniciSorusu: 'Tahsilat ve gider ödemeleriyle nakit ay ay nasıl değişir? Açık ne zaman başlar ve ne kadar finansman gerekir?',
    grup: 'finans',
    marka: ['istoc', 'turksab'],
    sahip: BELIRLENMEDI,
    durum: 'inceleniyor',
    kanit: 'hesaplanmis',
    kaynak: 'src/data/cashflow.ts; gelir temel senaryosu, Giderler Sheets planı',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Senaryo, gider planı ya da tahsilat varsayımı değişince',
    duzenleme: 'bu-senaryo',
    kapsam: `Bu sayfadaki tutarlar seçili senaryoya göre koşullu tahmindir, kesinleşmiş karar değildir. Nakit, kâr veya ciro ile aynı şey değildir. Sayfa, gelir planındaki seçili senaryoyu ve hesap seçeneklerini kullanır. Gider kaynağı seçeneği bunun dışındadır. Hangi seçeneklerin uygulandığı sayfada yazılır. Nakit çıkışları, Sheets gider planından ve plan kalemlerinden alınır. ${PARAM_NOTU}`,
    iliskili: ['gelir-plani', 'giderler', 'karar'],
    menu: 'Nakit akışı',
  },
  {
    id: 'butce-2027',
    path: '/butce-2027/',
    sinif: ['finans-model'],
    baslik: '2027 bütçesi: OPEX ve CAPEX',
    kullaniciSorusu: '2027’de işletme giderleri ve yatırım harcamaları ay ay ne kadar olur? Seçilen kadro seçeneği bütçeyi nasıl değiştirir?',
    grup: 'finans',
    marka: ['istoc', 'turksab'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'hesaplanmis',
    kaynak: 'Giderler Sheets planı (2027, canlı); src/data/istihdamV2.json; src/data/butce2027.json (birim fiyatlar)',
    turetim: 'oneri',
    asOf: '2026-11-05',
    gozdenGecirme: 'Sheets gider planı, kadro seçeneği ya da birim fiyatlar değişince',
    duzenleme: 'dis-kaynak',
    kapsam: `Bu sayfadaki tutarlar 2027 için plan ve tahmindir, kesinleşmiş harcama değildir. Taban, Google Sheets gider tablosundaki 2027 planıdır ve sayfa açılırken okunur. Yeni kadro, kişi başı giderler ve yatırım harcamaları birim fiyat tahminleriyle hesaplanır. ${PARAM_NOTU}`,
    iliskili: ['giderler', 'istihdam', 'nakit-akisi'],
    menu: '2027 bütçesi',
  },
  {
    id: 'gelir-ongorusu-2027',
    path: '/gelir-ongorusu-2027/',
    sinif: ['finans-model'],
    baslik: '2027 gelir öngörüsü',
    kullaniciSorusu: 'Kadro 2027’de kaç saat ve ne verimle çalışır, riskler hesaba katılınca ne kadar satış ve ne kadar gelir elde edilir?',
    grup: 'finans',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'hesaplanmis',
    kaynak: 'src/data/gelir2027.ts (gelir planı kuralları, İstihdam takvimi v2); src/data/gelir2027Kaynak.json (kaynaklı veriler); docs/gelir-ongorusu-2027/',
    turetim: 'oneri',
    asOf: '2026-11-05',
    gozdenGecirme: 'Kadro seçeneği, gelir parametreleri ya da ilk 90 günün ölçümleri değişince',
    duzenleme: 'yok',
    kapsam: 'Bu sayfadaki tutarlar 2027 için olasılıklı öngörüdür, kesinleşmiş gelir değildir. Saat ve risk değerleri kaynaklıdır ya da varsayım olarak işaretlidir. Satış katkısının bir kısmı varsayımdır ve ilk 90 günün ölçümüyle güncellenmelidir.',
    iliskili: ['gelir-plani', 'istihdam', 'butce-2027'],
    menu: '2027 gelir öngörüsü',
  },
  {
    id: 'notlar',
    path: '/notlar/',
    sinif: ['kisisel'],
    baslik: 'Notlar',
    kullaniciSorusu: 'Kendi çalışma notlarım ve taslaklarım nerede?',
    grup: 'yardimci',
    marka: ['istoc', 'segika'],
    sahip: 'Kullanıcı (kişisel)',
    durum: 'taslak',
    kanit: 'bilinmiyor',
    kaynak: 'src/data/notes.ts varsayılan notlar; düzenlemeler bu tarayıcıda',
    turetim: 'kisisel',
    asOf: T,
    gozdenGecirme: 'Kullanıcı düzenleyince',
    duzenleme: 'bu-tarayici',
    kapsam: 'Bu sayfa kişisel çalışma notlarını içerir ve notlar yalnız bu tarayıcıda saklanır. Bir notu tamamlandı diye işaretlemek, şirketteki resmî eylem veya karar durumunu değiştirmez.',
    iliskili: ['eylem-plani', 'karar'],
    menu: 'Notlar',
  },
  {
    id: 'bcg',
    path: '/bcg/',
    sinif: ['yontem'],
    baslik: 'BCG matrisi eğitimi',
    kullaniciSorusu: 'BCG matrisi nedir, nasıl okunur ve hangi hatalardan kaçınılmalı?',
    grup: 'dogrudan',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'yururlukte',
    kanit: 'ornek',
    kaynak: 'src/data/bcg.ts (kurgusal örnek)',
    turetim: 'egitim',
    asOf: T,
    gozdenGecirme: 'Gerçek pazar verisiyle uygulama kararı alınırsa',
    duzenleme: 'yok',
    kapsam: 'Bu sayfa genel bir eğitim sayfasıdır. Örnek veriler kurgusaldır, iStoc’a uygulanmış bir analiz veya şirket değerlendirmesi değildir. Kullanıcı kararıyla ana menüde ve sunum sırasında yer almaz.',
    iliskili: ['strateji'],
  },
  {
    id: 'arsiv',
    path: '/arsiv/',
    sinif: ['kaynak-veri'],
    baslik: 'Arşiv: tahtadan karara',
    kullaniciSorusu: '19 Ekim tahtasındaki hangi not hangi karara dönüştü?',
    grup: 'yardimci',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'arsiv',
    kanit: 'kaynakli',
    kaynak: 'src/data/program.ts (tahta notları ve karar eşlemesi)',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Yeni karar eski notun yerine geçince',
    duzenleme: 'yok',
    kapsam: 'Bu sayfa tarihsel kaynakları ve kararların izini gösterir, güncel politika değildir. Her kaydın güncel karşılığı ilgili sayfadadır.',
    iliskili: ['karar'],
    menu: 'Arşiv',
  },
  {
    id: 'email',
    path: '/email/',
    sinif: ['kisisel'],
    baslik: 'E-posta',
    kullaniciSorusu: 'Kişisel görüşme ve e-posta taslağım nerede?',
    grup: 'dogrudan',
    marka: ['istoc'],
    sahip: 'Kullanıcı (kişisel)',
    durum: 'taslak',
    kanit: 'bilinmiyor',
    kaynak: 'src/data/email.ts (kişisel taslak)',
    turetim: 'kisisel',
    asOf: T,
    gozdenGecirme: 'Paylaşılan içerikten ayrıştırma kararı (kullanıcı)',
    duzenleme: 'yok',
    kapsam: 'Bu sayfa kişisel bir görüşme taslağıdır ve paylaşılan operasyon planının parçası değildir. Menüde ve aramada yer almaz. Taslağın nerede korunacağı ve hangi bölümünün paylaşılacağı kullanıcının kararını bekliyor.',
    iliskili: ['notlar'],
  },
  {
    id: 'sayfa-bulunamadi',
    path: '/404/',
    sinif: ['sistem'],
    baslik: 'Sayfa bulunamadı',
    kullaniciSorusu: 'Aradığım adres nerede?',
    grup: 'sistem',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'yururlukte',
    kanit: 'bilinmiyor',
    kaynak: 'src/pages/404.astro',
    turetim: 'sistem',
    asOf: T,
    gozdenGecirme: 'Adres taşınınca',
    duzenleme: 'yok',
    kapsam: 'Bu bir sistem sayfasıdır. Eski adresler gerekçesiz olarak ana sayfaya yönlendirilmez, bunun yerine geçerli bağlantılar listelenir.',
    iliskili: [],
  },
  // Planlanan ana adresler (§5.2, §8): içerik taşınana kadar dosya açılmaz; durum taslak.
  {
    id: 'genel-bakis',
    path: '/genel-bakis/',
    sinif: ['strateji'],
    baslik: 'Genel bakış',
    kullaniciSorusu: 'Bu çalışma neyi planlıyor ve şu an hangi kararı vermeliyim?',
    grup: 'yardimci',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'bilinmiyor',
    kaynak: 'Kanonik kayıtlardan türetilecek (hedef, teslim, karar, nakit)',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Kanonik kayıtlar değişince',
    duzenleme: 'yok',
    kapsam: 'Genel bakış, ana kayıtlardan türetilir. Ayrı bir hedef veya karar listesi değildir.',
    iliskili: ['hedefler', 'eylem-plani', 'karar', 'nakit-akisi'],
    planlandi: true,
  },
  {
    id: 'strateji',
    path: '/strateji/',
    sinif: ['strateji'],
    baslik: 'Strateji ve teklif',
    kullaniciSorusu: 'Hangi müşterinin hangi problemini, hangi teklifle, hangi iş modeliyle çözüyoruz?',
    grup: 'pazarlama',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'varsayilmis',
    kaynak: 'src/data/kosullar.ts (ortaklık koşulları), src/data/revenue.ts (iş modeli)',
    turetim: 'oneri',
    asOf: T,
    gozdenGecirme: 'Segment, teklif ya da iş modeli kararı değişince',
    duzenleme: 'yok',
    kapsam: 'Strateji kayıtları bir öneri, seçilmiş bir yaklaşım veya sınanacak bir varsayımdır. iStoc için abonelik ve likidite pilotu hâlâ açık seçeneklerdir ve karar bekler.',
    iliskili: ['satis-ortakligi', 'gelir-plani', 'karar', 'musteri-yolculugu'],
    menu: 'Strateji ve teklif',
    planlandi: true,
  },
  {
    id: 'musteri-yolculugu',
    path: '/musteri-yolculugu/',
    sinif: ['operasyon'],
    baslik: 'Müşteri yolculuğu',
    kullaniciSorusu: 'Bir kişi nasıl müşteriye dönüşür ve her aşamada kimin ne yapması gerekir?',
    grup: 'pazarlama',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'varsayilmis',
    kaynak: 'CRM karar içeriği (src/data/program.ts), src/data/kosullar.ts ortaklık kuralları',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Aşama tanımı ya da devir koşulu değişince',
    duzenleme: 'yok',
    kapsam: 'Aşamalar planlanan süreci gösterir ve henüz gerçek müşteri verisi yoktur. Prim hakkı ücret politikasına göre belirlenir.',
    iliskili: ['rol-pazarlamaci', 'rol-segika', 'satis-ortakligi', 'ucret-politikasi'],
    menu: 'Müşteri yolculuğu',
    planlandi: true,
  },
  {
    id: 'pazarlama-operasyonu',
    path: '/pazarlama-operasyonu/',
    sinif: ['operasyon'],
    baslik: 'Pazarlama operasyonu',
    kullaniciSorusu: 'Hangi kanalda ne üreteceğiz, kim yürütecek, neyi sınayacağız?',
    grup: 'pazarlama',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'varsayilmis',
    kaynak: 'src/data/digital.ts, src/data/digitalStrategy.ts (dijital rol ve gelir planı kanal içeriği)',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Kanal deneyi ya da üretim planı değişince',
    duzenleme: 'yok',
    kapsam: 'Kanal ve içerik planı, planlanmış bir operasyondur. Araç listesi yalnız destekleyici ayrıntıdır ve sonuç sayılmaz. Hesap girdileri Gelir planı sayfasındadır.',
    iliskili: ['rol-dijital-pazarlama', 'gelir-plani', 'eylem-plani'],
    menu: 'Pazarlama operasyonu',
    planlandi: true,
  },
  {
    id: 'ucret-politikasi',
    path: '/ucret-politikasi/',
    sinif: ['politika'],
    baslik: 'Ücret ve çalışma modeli',
    kullaniciSorusu: 'Bu rol ya da çalışma biçimi için hangi ücret ve prim koşulu geçerli?',
    grup: 'istihdam',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'kaynakli',
    kaynak: 'Ücret ve mesai karar içeriği (src/data/program.ts), rol ücret özetleri (src/data/roles.ts)',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Ücret, prim ya da çalışma düzeni kararı değişince',
    duzenleme: 'yok',
    kapsam: 'Sayfada politikanın sürümü, durumu ve uygulandığı kapsam görünür. Applet örnekleri kendiliğinden politika olmaz. Hukuki ifadeler henüz doğrulanmadı.',
    iliskili: ['karar', 'applet', 'giderler'],
    menu: 'Ücret ve çalışma modeli',
    planlandi: true,
  },
  {
    id: 'olcum',
    path: '/olcum/',
    sinif: ['kaynak-veri', 'operasyon'],
    baslik: 'Ölçüm ve sonuçlar',
    kullaniciSorusu: 'Başarıyı nasıl tanımlıyoruz, elimizde hangi veri var, hedefe göre neredeyiz?',
    grup: 'yonetim',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'bilinmiyor',
    kaynak: 'Metrik sözlüğü (planlanıyor); gerçekleşen veri yok',
    turetim: 'tahta',
    asOf: T,
    gozdenGecirme: 'Ölçüm kaynağı bağlanınca',
    duzenleme: 'yok',
    kapsam: 'Önce metrik sözlüğü ve veri hazırlığı yapılır. Gerçekleşen veri yokken süs amaçlı gösterge paneli çizilmez ve eksik veri 0 olarak gösterilmez.',
    iliskili: ['hedefler', 'karar', 'gelir-plani'],
    menu: 'Ölçüm ve sonuçlar',
    planlandi: true,
  },
  {
    id: 'kaynaklar',
    path: '/kaynaklar/',
    sinif: ['kaynak-veri'],
    baslik: 'Kaynaklar ve tanımlar',
    kullaniciSorusu: 'Bu bilgi hangi kaynaktan geliyor ve hangi kararı etkiliyor?',
    grup: 'yardimci',
    marka: ['istoc', 'segika', 'turksab'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'bilinmiyor',
    kaynak: 'Bu envanter ve sayfa varsayım kaynakları',
    turetim: 'sistem',
    asOf: T,
    gozdenGecirme: 'Kaynak eklenince ya da çelişki kaydı açılınca',
    duzenleme: 'yok',
    kapsam: 'Kaynak türü, tarihi, kapsamı ve doğrulama sınırı kaydedilir. Kişisel içerik ve erişim bilgileri listelenmez.',
    iliskili: ['parametreler', 'giderler', 'arsiv'],
    menu: 'Kaynaklar ve tanımlar',
    planlandi: true,
  },
];

/** Site tabanı (`/19ekim/`): yayında `import.meta.env.BASE_URL`, test ortamında sabit. */
const TABAN = ((typeof import.meta !== 'undefined' && (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL) || '/19ekim/').replace(/\/$/, '');
const temizle = (path: string) => {
  let p = path.replace(/[?#].*$/, '');
  if (TABAN && (p === TABAN || p.startsWith(`${TABAN}/`))) p = p.slice(TABAN.length);
  return `/${p.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
};

/** Yayımlanan (dosyası olan) kayıtlar. */
export const YAYIMLANAN = ICERIK.filter((k) => !k.planlandi);

/** Yola göre kayıt (taban yolu `/19ekim` düşülmüş, sondaki eğik çizgi normalleştirilmiş). */
export function icerikOf(path: string): IcerikKaydi | undefined {
  const p = temizle(path);
  return ICERIK.find((k) => k.path === p);
}

/** Alt bilgi kapsam cümlesi (F10): kaydı olmayan sayfa için genel, kapsamı doğru özetleyen cümle. */
export function altBilgiKapsami(path: string): string {
  return icerikOf(path)?.kapsam ?? `Tutarlar 19 Ekim tahta kararlarından türetilen planlardır, kesinleşmiş sonuç değildir. ${PARAM_NOTU}`;
}

/**
 * Alt bilgi ön cümlesi (B2c, MS-11): yalnız 19 Ekim tahta kararlarından türetilen içerikte; Sheets, öneri, örnek, eğitim,
 * kişisel ve sistem sayfalarında boş (kapsam cümlesi yeter). Sondaki boşluk kapsam cümlesine birleşir.
 */
export function altBilgiOnCumle(path: string): string {
  return icerikOf(path)?.turetim === 'tahta'
    ? 'Bu içerik 19 Ekim 2026 tarihli tahta kararlarından ve planlama panosundan türetildi. Hedefler başlangıç değeridir ve 2. haftanın sonunda gerçek veriyle kalibre edilir. '
    : '';
}

/** Kimliğe göre kayıt (menü ve kırıntı tüketicileri için). */
export function icerikKaydi(id: string): IcerikKaydi {
  const k = ICERIK.find((x) => x.id === id);
  if (!k) throw new Error(`İçerik kaydı yok: ${id}`);
  return k;
}

/** Ana ebeveyn kırıntısı (F15): sunum sırasından bağımsız; grup adı → (ebeveyn) → sayfa; ana sayfada kırıntı yok. */
export function kirinti(path: string): string[] {
  const k = icerikOf(path);
  if (!k || k.path === '/') return [];
  if (k.kirintiYolu) return [...k.kirintiYolu, k.baslik];
  const parca: string[] = [];
  if (k.grup !== 'sistem' && k.grup !== 'dogrudan') parca.push(GRUP_ADI[k.grup]);
  if (k.ebeveyn) {
    const e = ICERIK.find((x) => x.id === k.ebeveyn);
    if (e) parca.push(e.baslik);
  }
  parca.push(k.baslik);
  return parca;
}

/**
 * Dar ekranda gizlenebilen grup kırıntısı (K5, kullanıcı kararı 2026-10-28 “test et, karar ver”; 320×480 ölçümü): otomatik
 * yolun ilk parçası. Belgeli yolda (`kirintiYolu`, Giderler), doğrudan erişimde, sistem sayfasında ve ana sayfada yok.
 */
export function kirintiGrubu(path: string): string | null {
  const k = icerikOf(path);
  if (!k || k.path === '/' || k.kirintiYolu || k.grup === 'sistem' || k.grup === 'dogrudan') return null;
  return GRUP_ADI[k.grup];
}
