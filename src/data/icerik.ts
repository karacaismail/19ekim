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
export const GRUP_ADI: Record<IcerikGrubu, string> = { pazarlama: 'Pazarlama', istihdam: 'İstihdam', finans: 'Finans', yonetim: 'Yönetim', yardimci: 'Yardımcı erişim', dogrudan: 'Doğrudan erişim', sistem: 'Sistem' };

const T = '2026-10-28';
const BELIRLENMEDI = 'belirlenmedi';
const PARAM_NOTU = 'Parametreler sayfasında değiştirilen değerler yalnız o tarayıcıda saklanır.';

const rol = (slug: string, baslik: string, soru: string, kapsam: string, marka: Marka[] = ['istoc']): IcerikKaydi => ({
  id: `rol-${slug}`,
  path: `/roller/${slug}/`,
  sinif: ['operasyon'],
  baslik,
  kullaniciSorusu: soru,
  grup: 'istihdam',
  ebeveyn: 'organizasyon',
  marka,
  sahip: BELIRLENMEDI,
  durum: 'inceleniyor',
  kanit: 'varsayilmis',
  kaynak: 'src/data/roles.ts (19 Ekim tahta kararları ve planlama panosu)',
  asOf: T,
  gozdenGecirme: 'Kadro, görev ya da başlangıç koşulu değişince',
  duzenleme: 'yok',
  kapsam: `${kapsam} Ücret özeti örnek politikadır; gerçekleşmiş performans ya da bordro kaydı değildir. ${PARAM_NOTU}`,
  iliskili: ['organizasyon', 'istihdam', 'eylem-plani', 'applet'],
});

export const ICERIK: IcerikKaydi[] = [
  {
    id: 'organizasyon',
    path: '/',
    sinif: ['operasyon'],
    baslik: 'Organizasyon şeması',
    kullaniciSorusu: 'Kim kime bağlı; hangi rol ne zaman, kaç kişiyle planlanıyor?',
    grup: 'istihdam',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'inceleniyor',
    kanit: 'varsayilmis',
    kaynak: 'src/data/tree.ts; kişi sayısı ve tarihler Parametreler',
    asOf: T,
    gozdenGecirme: 'Kadro kararı ya da başlangıç tarihi değişince',
    duzenleme: 'yok',
    kapsam: `Şema planlanan kadroyu gösterir; kişi sayıları ve başlangıç tarihleri plandır, işe başlamanın kanıtı değildir. ${PARAM_NOTU}`,
    iliskili: ['istihdam', 'eylem-plani'],
    menu: 'Organizasyon şeması',
  },
  rol('dijital-pazarlama', 'Dijital pazarlama uzmanı', 'Dijital pazarlama rolü hangi çıktılardan sorumlu; günlük düzeni ne?', 'Rol profili planlanan sorumlulukları anlatır; kanal ve içerik planının ana adresi Pazarlama operasyonudur.'),
  rol('pazarlamaci', 'Masa başı pazarlama (CRM)', 'iStoc CRM rolü hangi aşamaları yürütür; aday ne zaman müşteri sayılır?', 'Rol profili planlanan sorumlulukları anlatır; müşteri aşamalarının tanımı Müşteri yolculuğu kaydındadır.'),
  rol('saha-uzmani', 'Saha pazarlama ekibi', 'Saha ekibi hangi teslimi üretir; kayıt CRM’e nasıl devredilir?', 'Rol profili planlanan sorumlulukları anlatır; temsilci ağı modeli kendi sayfasındadır.'),
  rol('ekip-lideri', 'Satış-pazarlama ekip lideri', 'Ekip lideri hangi kararı alır, hangisini üst role taşır?', 'Rol profili planlanan sorumlulukları anlatır; ağ modeli kendi sayfasındadır.'),
  rol('organizator', 'Organizatör', 'Organizatör hangi etkinlik çıktısından sorumlu; katılım ile aktivasyon nasıl ayrılır?', 'Rol profili planlanan sorumlulukları anlatır; toplantı programı Eylem planında ortak olaydır.'),
  rol('segika', 'Segika masa başı pazarlama (CRM)', 'Segika satış/CRM rolü neyi üstlenir; demo, ilk değer ve destek devri nasıl?', 'Rol profili planlanan sorumlulukları anlatır; Segika’ya özgü müşteri, demo ve destek devri netleştirilecek alanlardır (iStoc olayları kopyalanmaz).', ['segika']),
  rol('asistan', 'Yönetici asistanı', 'Asistan hangi operasyonel desteği verir; talebi kim verir, kanıt ne?', 'Rol profili planlanan sorumlulukları anlatır (onay bekliyor); şirketin karar listesi Kararlar sayfasındadır.', ['istoc', 'segika']),
  {
    id: 'istihdam',
    path: '/istihdam/',
    sinif: ['operasyon'],
    baslik: 'İstihdam takvimi',
    kullaniciSorusu: 'Hangi rol ne zaman, hangi koşulla işe alınacak; maliyet etkisi ne?',
    grup: 'istihdam',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'inceleniyor',
    kanit: 'varsayilmis',
    kaynak: 'src/data/program.ts, src/data/staffing.ts; Parametreler',
    asOf: T,
    gozdenGecirme: 'İşe alım sırası, başlangıç tarihi ya da bütçe değişince',
    duzenleme: 'yok',
    kapsam: `İşe alım sırası ve takvim plandır; onaylanan işe alım, kişinin işe başladığına kanıt değildir. Kadro katkısı modelin karşı-olgusal sonucudur, gerçek kişi performansı değildir. ${PARAM_NOTU}`,
    iliskili: ['organizasyon', 'eylem-plani', 'gelir-plani', 'giderler'],
    menu: 'İstihdam takvimi',
  },
  {
    id: 'applet',
    path: '/applet/',
    sinif: ['yontem'],
    baslik: 'Ücret ve performans applet’leri',
    kullaniciSorusu: 'Bir ücret, prim ya da performans modelini nasıl kurarım; örnek değerlerle sonuç ne olur?',
    grup: 'istihdam',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'yururlukte',
    kanit: 'ornek',
    kaynak: 'src/data/applet.ts (örnek veriler)',
    asOf: T,
    gozdenGecirme: 'Ücret politikası taslağı değişince',
    duzenleme: 'bu-tarayici',
    kapsam: 'Applet tutarları örnek verilerdir; şirket kararı değildir ve yapılan değişiklikler yalnız bu tarayıcıda saklanır. Örnekten politika önerisine geçiş Kararlar üzerinden yapılır.',
    iliskili: ['ucret-politikasi', 'karar-bekleyenler'],
    menu: 'Applet',
  },
  {
    id: 'hedefler',
    path: '/hedefler/',
    sinif: ['strateji', 'finans-model'],
    baslik: '90 gün hedefleri',
    kullaniciSorusu: 'Hangi hedefe, hangi dönemde, hangi kaynakla ulaşılacak; tahmin hedefe ne kadar yakın?',
    grup: 'yonetim',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'onaylandi',
    kanit: 'varsayilmis',
    kaynak: 'src/data/program.ts (19 Ekim tahta hedefleri); tahmin src/data/revenue.ts',
    asOf: T,
    gozdenGecirme: '2. haftanın sonunda gerçek veriyle kalibrasyon',
    duzenleme: 'bu-senaryo',
    kapsam: `Hedefler 19 Ekim tahtasındaki başlangıç değerleridir; tahminler seçili senaryoya göre koşuldur; gerçekleşen ölçüm henüz yoktur (ölçülmedi, sıfır değil). ${PARAM_NOTU}`,
    iliskili: ['gelir-plani', 'eylem-plani', 'karar-yetkisi', 'olcum'],
    menu: 'Hedefler',
  },
  {
    id: 'gelir-plani',
    path: '/gelir-plani/',
    sinif: ['finans-model'],
    baslik: 'Gelir planı',
    kullaniciSorusu: 'Bu kadro, fiyat ve kanal varsayımlarıyla gelir ne olabilir; başabaş ne zaman?',
    grup: 'finans',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'inceleniyor',
    kanit: 'hesaplanmis',
    kaynak: 'src/data/revenue.ts, src/data/model.ts; Parametreler ve senaryo kurucu',
    asOf: T,
    gozdenGecirme: 'Fiyat, kadro, kanal bütçesi ya da dönüşüm varsayımı değişince',
    duzenleme: 'bu-senaryo',
    kapsam: `Bu sayfadaki tutarlar seçili senaryoya göre koşullu tahmindir; kesinleşmiş karar değildir. İş modeli iStoc aboneliğidir; işlem gelirine dayalı likidite pilotunun hesap modeli yoktur (Kararlar). ${PARAM_NOTU}`,
    iliskili: ['hedefler', 'nakit-akisi', 'giderler', 'parametreler', 'karar-bekleyenler'],
    menu: 'Gelir planı',
  },
  {
    id: 'eylem-plani',
    path: '/eylem-plani/',
    sinif: ['operasyon'],
    baslik: 'Eylem planı',
    kullaniciSorusu: 'Kim, hangi teslimi, ne zaman yapacak; neye bağlı?',
    grup: 'yonetim',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'onaylandi',
    kanit: 'varsayilmis',
    kaynak: 'src/data/program.ts (yönetici planı ve rol planları)',
    asOf: T,
    gozdenGecirme: 'Teslim tarihi, sorumlu ya da bağımlılık değişince',
    duzenleme: 'yok',
    kapsam: `Eylemler 19 Ekim kararlarına dayanan planlanmış teslimlerdir; tarih ve sorumlular plandır, tamamlanma kanıtı henüz yoktur. Rol ve ortaklık görünümleri aynı kayıtların filtresidir. ${PARAM_NOTU}`,
    iliskili: ['hedefler', 'istihdam', 'partnership', 'karar-yetkisi'],
    menu: 'Eylem planı',
  },
  {
    id: 'buyume-modeli',
    path: '/buyume-modeli/',
    sinif: ['strateji', 'finans-model'],
    baslik: 'Çok katmanlı pazarlama ağı',
    kullaniciSorusu: 'iStoc temsilci ağı nasıl büyür; katmanlar, huni ve hedefler ne?',
    grup: 'pazarlama',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'inceleniyor',
    kanit: 'hesaplanmis',
    kaynak: 'src/data/growth.ts; Parametreler',
    asOf: T,
    gozdenGecirme: 'Temsilci kazanım varsayımı ya da katman kuralı değişince',
    duzenleme: 'bu-senaryo',
    kapsam: `Temsilci ağı modeli seçili senaryoya göre koşullu tahmindir; temsilci edinme hunisi müşteri edinme hunisiyle toplanmaz; Segika ortaklık kuralları burada değildir. ${PARAM_NOTU}`,
    iliskili: ['rol-saha-uzmani', 'rol-ekip-lideri', 'gelir-plani', 'partnership'],
    menu: 'Temsilci ağı',
  },
  {
    id: 'partnership',
    path: '/partnership/',
    sinif: ['strateji', 'politika'],
    baslik: 'İş ortaklığı programı',
    kullaniciSorusu: 'Hangi ortak tipi, hangi koşulla, hangi destekle katkı verir; başarı olayı ne?',
    grup: 'pazarlama',
    marka: ['segika', 'istoc'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'varsayilmis',
    kaynak: 'src/data/partnership.ts (başlangıç tasarımı)',
    asOf: T,
    gozdenGecirme: '14. günde gerçek veriyle yeniden yazım',
    duzenleme: 'yok',
    kapsam: 'Program bir öneri ve başlangıç tasarımıdır: ortak türleri, puan kartları, oranlar ve takvim taslaktır, onaylanmış sözleşme değildir; 14. günde gerçek veriyle yeniden yazılır. Komisyon denemesi Affilate simülasyonundadır.',
    iliskili: ['affilate', 'strateji', 'musteri-yolculugu', 'eylem-plani', 'karar-bekleyenler'],
    menu: 'İş ortaklığı',
  },
  {
    id: 'affilate',
    path: '/affilate/',
    sinif: ['finans-model', 'yontem'],
    baslik: 'Affilate',
    kullaniciSorusu: 'Aynı satış koşullarında farklı ortaklık modelleri ne kazandırır, hangi ayda ödenir?',
    grup: 'pazarlama',
    marka: ['segika'],
    sahip: BELIRLENMEDI,
    durum: 'yururlukte',
    kanit: 'ornek',
    kaynak: 'src/data/affilate.ts (saf motor), docs/affilate.md; başlangıç değerleri örnek',
    asOf: T,
    gozdenGecirme: 'Ortaklık politikası sürümü ya da fiyat değişince',
    duzenleme: 'bu-tarayici',
    kapsam: 'Affilate bir simülasyondur: oranlar, süreler ve fiyatlar örnek başlangıç değerleridir, onaylanmış sözleşme değildir; hareketler gerçek fatura ya da ödeme değildir. Değişiklikler yalnız bu tarayıcıda saklanır.',
    iliskili: ['partnership', 'rol-segika'],
    menu: 'Affilate',
  },
  {
    id: 'karar-yetkisi',
    path: '/karar-yetkisi/',
    sinif: ['politika'],
    baslik: 'Karar yetkisi ve kontrol noktaları',
    kullaniciSorusu: 'Hangi kararı kim verir; hangi eşikte hangi kontrol yapılır?',
    grup: 'yonetim',
    marka: ['istoc', 'segika'],
    sahip: 'İsmail Karaca (karar veren)',
    durum: 'onaylandi',
    kanit: 'kaynakli',
    kaynak: 'src/data/program.ts (19 Ekim tahta kararları)',
    asOf: T,
    gozdenGecirme: 'Yetki ya da kontrol eşiği değişince',
    duzenleme: 'yok',
    kapsam: `Yetki ve kontrol noktaları 19 Ekim tahta kararlarına dayanır; eşik değerler hedef kaydından gelir. ${PARAM_NOTU}`,
    iliskili: ['karar-bekleyenler', 'hedefler', 'olcum'],
    menu: 'Karar yetkisi',
  },
  {
    id: 'karar-bekleyenler',
    path: '/karar-bekleyenler/',
    sinif: ['politika'],
    baslik: 'Karar bekleyenler',
    kullaniciSorusu: 'Hangi karar bekliyor; seçenekler, etkisi ve karar sahibi ne; hangi kararlar kesinleşti?',
    grup: 'yonetim',
    marka: ['istoc', 'segika'],
    sahip: 'İsmail Karaca (karar veren)',
    durum: 'inceleniyor',
    kanit: 'kaynakli',
    kaynak: 'src/data/program.ts (karar kayıtları)',
    asOf: T,
    gozdenGecirme: 'Karar alınınca ya da yeni çelişki kaydı açılınca',
    duzenleme: 'yok',
    kapsam: `Bekleyen kararlar seçenek ve etkileriyle listelenir; kesinleşen kararlar tarihli kayıttır. Ücret, CRM ve mesai politika metinleri karar kuyruğunun parçası değil, kendi ana adreslerindedir. ${PARAM_NOTU}`,
    iliskili: ['karar-yetkisi', 'ucret-politikasi', 'musteri-yolculugu', 'gelir-plani'],
    menu: 'Kararlar',
  },
  {
    id: 'parametreler',
    path: '/parametreler/',
    sinif: ['kaynak-veri'],
    baslik: 'Parametreler',
    kullaniciSorusu: 'Hangi varsayım hangi sonucu değiştiriyor; yayın değeri ne, ben ne değiştirdim?',
    grup: 'yardimci',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'yururlukte',
    kanit: 'varsayilmis',
    kaynak: 'src/data/params.ts (yayın varsayılanları)',
    asOf: T,
    gozdenGecirme: 'Yasal değer (asgari ücret, dilim), fiyat ya da kadro kararı değişince',
    duzenleme: 'bu-tarayici',
    kapsam: 'Varsayılanlar yayın değeridir; değişiklikler yalnız bu tarayıcıda saklanır ve bütün hesap sayfalarını etkiler, şirket kararı ya da onaylı politika değildir. 2027 yasal değerleri varsayımdır.',
    iliskili: ['gelir-plani', 'nakit-akisi', 'istihdam', 'giderler'],
    menu: 'Varsayımlar ve ayarlar',
  },
  {
    id: 'giderler',
    path: '/giderler/',
    sinif: ['kaynak-veri', 'finans-model'],
    baslik: 'Giderler (OPEX)',
    kullaniciSorusu: 'Hangi gider kalemi, hangi dönemde, hangi kaynaktan planlandı; personel maliyeti ne?',
    grup: 'finans',
    marka: ['turksab', 'istoc'],
    sahip: BELIRLENMEDI,
    durum: 'yururlukte',
    kanit: 'kaynakli',
    kaynak: 'Giderler Sheets dosyası (açılışta okunur); src/data/opex.ts',
    asOf: T,
    gozdenGecirme: 'Sheets dosyası değişince (her açılışta)',
    duzenleme: 'dis-kaynak',
    kapsam: 'Gider tutarları Giderler Sheets dosyasından açılışta okunur; dosya değişince burası da değişir. Kaynak bir plandır, ödeme takibi değildir; kaynak kurum Türksab’dır ve giderin markaya dağıtımı belirlenmemiştir (Kararlar). Varsayım kaynakları arama bağlantısıdır, doğrulanmış belge değildir.',
    iliskili: ['nakit-akisi', 'gelir-plani', 'parametreler', 'karar-bekleyenler'],
    menu: 'Giderler',
  },
  {
    id: 'nakit-akisi',
    path: '/nakit-akisi/',
    sinif: ['finans-model'],
    baslik: 'Nakit akış tablosu',
    kullaniciSorusu: 'Tahsilat ve gider çıkışıyla ay ay nakit ne olur; açık ne zaman başlar, ne kadar finansman gerekir?',
    grup: 'finans',
    marka: ['istoc', 'turksab'],
    sahip: BELIRLENMEDI,
    durum: 'inceleniyor',
    kanit: 'hesaplanmis',
    kaynak: 'src/data/cashflow.ts; gelir temel senaryosu, Giderler Sheets planı',
    asOf: T,
    gozdenGecirme: 'Senaryo, gider planı ya da tahsilat varsayımı değişince',
    duzenleme: 'bu-senaryo',
    kapsam: `Bu sayfadaki tutarlar seçili senaryoya göre koşullu tahmindir; kesinleşmiş karar değildir. Nakit kâr ya da ciro değildir; gelir temel senaryosunu ve Sheets gider planını okur, gelir planındaki özel değişikliklerin hangileri taşındı ayrıca gösterilir. ${PARAM_NOTU}`,
    iliskili: ['gelir-plani', 'giderler', 'karar-bekleyenler'],
    menu: 'Nakit akışı',
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
    asOf: T,
    gozdenGecirme: 'Kullanıcı düzenleyince',
    duzenleme: 'bu-tarayici',
    kapsam: 'Kişisel çalışma notlarıdır; yalnız bu tarayıcıda saklanır. Tamamlandı işareti şirketin resmi eylem ya da karar durumunu değiştirmez.',
    iliskili: ['eylem-plani', 'karar-bekleyenler'],
    menu: 'Notlar',
  },
  {
    id: 'bcg',
    path: '/bcg/',
    sinif: ['yontem'],
    baslik: 'BCG matrisi eğitimi',
    kullaniciSorusu: 'BCG matrisi nedir, nasıl okunur; hangi hatalardan kaçınılır?',
    grup: 'dogrudan',
    marka: ['istoc'],
    sahip: BELIRLENMEDI,
    durum: 'yururlukte',
    kanit: 'ornek',
    kaynak: 'src/data/bcg.ts (kurgusal örnek)',
    asOf: T,
    gozdenGecirme: 'Gerçek pazar verisiyle uygulama kararı alınırsa',
    duzenleme: 'yok',
    kapsam: 'Genel eğitim sayfasıdır; örnek veriler kurgusaldır, iStoc’a uygulanmış analiz ya da şirket değerlendirmesi değildir. Ana menüde ve sunum sırasında yer almaz (kullanıcı kararı).',
    iliskili: ['strateji'],
  },
  {
    id: 'arsiv',
    path: '/arsiv/',
    sinif: ['kaynak-veri'],
    baslik: 'Arşiv: tahtadan karara',
    kullaniciSorusu: '19 Ekim tahtasındaki hangi not hangi karara dönüştü?',
    grup: 'dogrudan',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'arsiv',
    kanit: 'kaynakli',
    kaynak: 'src/data/program.ts (tahta notları ve karar eşlemesi)',
    asOf: T,
    gozdenGecirme: 'Yeni karar eski notun yerine geçince',
    duzenleme: 'yok',
    kapsam: 'Tarihsel kaynak ve karar izidir; güncel politika değildir. Her kaydın güncel karşılığı ilgili sayfadadır.',
    iliskili: ['karar-bekleyenler', 'karar-yetkisi'],
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
    asOf: T,
    gozdenGecirme: 'Paylaşılan içerikten ayrıştırma kararı (kullanıcı)',
    duzenleme: 'yok',
    kapsam: 'Kişisel görüşme taslağıdır; paylaşılan operasyon planının parçası değildir, menüde ve aramada yer almaz. Ayrıştırma (koruma yeri ve paylaşılacak kapsam) kullanıcı kararı bekliyor.',
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
    asOf: T,
    gozdenGecirme: 'Adres taşınınca',
    duzenleme: 'yok',
    kapsam: 'Sistem sayfası; eski adresler ana sayfaya gerekçesiz yönlendirilmez, geçerli bağlantılar listelenir.',
    iliskili: [],
  },
  // Planlanan ana adresler (§5.2, §8): içerik taşınana kadar dosya açılmaz; durum taslak.
  {
    id: 'genel-bakis',
    path: '/genel-bakis/',
    sinif: ['strateji'],
    baslik: 'Genel bakış',
    kullaniciSorusu: 'Bu çalışma neyi planlıyor; şu an hangi kararı vermeliyim?',
    grup: 'yardimci',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'bilinmiyor',
    kaynak: 'Kanonik kayıtlardan türetilecek (hedef, teslim, karar, nakit)',
    asOf: T,
    gozdenGecirme: 'Kanonik kayıtlar değişince',
    duzenleme: 'yok',
    kapsam: 'Genel bakış kanonik kayıtlardan türetilir; ikinci bir hedef/karar listesi değildir.',
    iliskili: ['hedefler', 'eylem-plani', 'karar-bekleyenler', 'nakit-akisi'],
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
    kaynak: 'src/data/partnership.ts (marka ve teklif açıklamaları), src/data/revenue.ts (iş modeli)',
    asOf: T,
    gozdenGecirme: 'Segment, teklif ya da iş modeli kararı değişince',
    duzenleme: 'yok',
    kapsam: 'Strateji kayıtları öneri, seçilmiş yaklaşım ya da sınanacak hipotezdir; iStoc abonelik ve likidite pilotu açık alternatiflerdir (Kararlar).',
    iliskili: ['partnership', 'gelir-plani', 'karar-bekleyenler', 'musteri-yolculugu'],
    menu: 'Strateji ve teklif',
    planlandi: true,
  },
  {
    id: 'musteri-yolculugu',
    path: '/musteri-yolculugu/',
    sinif: ['operasyon'],
    baslik: 'Müşteri yolculuğu',
    kullaniciSorusu: 'Bir kişi nasıl müşteriye dönüşür; her aşamada kimin ne yapması gerekir?',
    grup: 'pazarlama',
    marka: ['istoc', 'segika'],
    sahip: BELIRLENMEDI,
    durum: 'taslak',
    kanit: 'varsayilmis',
    kaynak: 'CRM karar içeriği (src/data/program.ts), src/data/partnership.ts akışları',
    asOf: T,
    gozdenGecirme: 'Aşama tanımı ya da devir koşulu değişince',
    duzenleme: 'yok',
    kapsam: 'Aşamalar planlanan süreçtir; gerçek müşteri verisi yoktur. Prim uygunluğu ücret politikasına referansla.',
    iliskili: ['rol-pazarlamaci', 'rol-segika', 'partnership', 'ucret-politikasi'],
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
    asOf: T,
    gozdenGecirme: 'Kanal deneyi ya da üretim planı değişince',
    duzenleme: 'yok',
    kapsam: 'Kanal ve içerik planı planlanmış operasyondur; araç listesi destekleyici ayrıntıdır, sonuç sayılmaz. Hesap girdileri Gelir planındadır.',
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
    asOf: T,
    gozdenGecirme: 'Ücret, prim ya da çalışma düzeni kararı değişince',
    duzenleme: 'yok',
    kapsam: 'Politika sürümü, durumu ve uygulandığı kapsam görünür; Applet örnekleri otomatik politika olmaz; hukuki ifadeler doğrulama bekler.',
    iliskili: ['karar-bekleyenler', 'applet', 'giderler'],
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
    asOf: T,
    gozdenGecirme: 'Ölçüm kaynağı bağlanınca',
    duzenleme: 'yok',
    kapsam: 'Önce metrik sözlüğü ve veri hazırlığı; gerçekleşen veri yokken dashboard dekoru yoktur, eksik veri 0 olarak çizilmez.',
    iliskili: ['hedefler', 'karar-yetkisi', 'gelir-plani'],
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
    asOf: T,
    gozdenGecirme: 'Kaynak eklenince ya da çelişki kaydı açılınca',
    duzenleme: 'yok',
    kapsam: 'Kaynak türü, tarihi, kapsamı ve doğrulama sınırı kaydedilir; kişisel içerik ve erişim bilgileri listelenmez.',
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
  return icerikOf(path)?.kapsam ?? `Tutarlar 19 Ekim tahta kararlarından türetilen planlardır; kesinleşmiş sonuç değildir. ${PARAM_NOTU}`;
}

/** Ana ebeveyn kırıntısı (F15): sunum sırasından bağımsız; grup adı → (ebeveyn) → sayfa. */
export function kirinti(path: string): string[] {
  const k = icerikOf(path);
  if (!k) return [];
  const parca: string[] = [];
  if (k.grup !== 'sistem' && k.grup !== 'dogrudan') parca.push(GRUP_ADI[k.grup]);
  if (k.ebeveyn) {
    const e = ICERIK.find((x) => x.id === k.ebeveyn);
    if (e) parca.push(e.baslik);
  }
  parca.push(k.baslik);
  return parca;
}
