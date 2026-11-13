/**
 * İstihdam takvimi, 3 Kasım 2026 planı (kullanıcı kararı 2026-11-03). Kaynak: “istoc ve Segika Kadro Kapasite Planı”
 * (tarihler, aşamalar, kapasite, roller) ve “İşe alım, kapasite, GAP ve eylem planı” (başlangıç koşulları).
 * Plan kimsenin 1 Kasım’da başlamadığını varsayar; birinci dalga 23 Kasım, ikinci dalga 1 Aralık. Bu dosya sitenin
 * ortak başlangıç tarihi parametresini (params.startDate) değiştirmez; diğer sayfalar o parametreyle hesaplanır.
 * Kişiye özel ücret burada yoktur (repo herkese açık).
 */
import type { RoleKey } from './types';

export type OlayTuru = 'karar' | 'ise-alim' | 'baslangic' | 'kontrol' | 'hukuk';

export const OLAY_TURU_ADI: Record<OlayTuru, string> = {
  karar: 'Karar',
  'ise-alim': 'İşe alım',
  baslangic: 'İşe başlama',
  kontrol: 'Değerlendirme',
  hukuk: 'Hukuk ve uyum',
};

export interface PlanOlayi {
  tarih: string;
  baslik: string;
  aciklama: string;
  tur: OlayTuru;
}

export interface Asama {
  id: string;
  ad: string;
  bas: string;
  son: string;
  aciklama: string;
}

export const PLAN_TARIHI = '2026-11-03';
export const TAKVIM_BAS = '2026-11-01';
export const TAKVIM_SON = '2027-02-28';

export const ASAMALAR: Asama[] = [
  { id: 'f0', ad: 'Faz 0: Kararlar', bas: '2026-11-03', son: '2026-11-07', aciklama: 'İşveren, hedef ve asistan kararları verilir.' },
  { id: 'f1', ad: 'Faz 1: Sistemi hazırla', bas: '2026-11-04', son: '2026-11-20', aciklama: 'CRM, hatlar, İYS kaydı ve satış kiti hazırlanır.' },
  { id: 'f2', ad: 'Faz 2: Bul ve seç', bas: '2026-11-04', son: '2026-11-20', aciklama: 'Her rol için en az 5 aday görüşülür.' },
  { id: 'f3', ad: 'Faz 3: Göreve başlat', bas: '2026-11-23', son: '2026-12-23', aciklama: 'Yeni personel eğitimle başlar, hedefe adım adım çıkar.' },
  { id: 'd1', ad: 'Dalga 1: ilk 90 gün', bas: '2026-11-23', son: '2027-02-21', aciklama: '30, 60 ve 90. günde devam, değiştir ya da durdur kararı verilir.' },
  { id: 'd2', ad: 'Dalga 2: ilk 90 gün', bas: '2026-12-01', son: '2027-02-28', aciklama: 'Organizatör ve koşullu 3. saha için aynı değerlendirme yapılır.' },
  { id: 'f4', ad: 'Faz 4: Takip ritmi', bas: '2026-11-23', son: '2027-02-28', aciklama: 'Günlük 15 dakikalık toplantı, haftalık ekip toplantısı ve birebir görüşmeler sürer.' },
];

export const OLAYLAR: PlanOlayi[] = [
  { tarih: '2026-11-03', baslik: 'Üç kritik karar netleşir', aciklama: 'İşveren tüzel kişi, etkinlik sıklığı ve asistan kararı konuşulur.', tur: 'karar' },
  { tarih: '2026-11-04', baslik: 'Mali müşavir ve avukat görüşmesi', aciklama: 'Sözleşme ve maliyet konuşulur. İş ilanları hazırlanır.', tur: 'hukuk' },
  { tarih: '2026-11-05', baslik: 'İlanlar yayınlanır', aciklama: 'Çarşı ve plaza izinleri de sorulur.', tur: 'ise-alim' },
  { tarih: '2026-11-06', baslik: 'İşveren, terim, prim ve bütçe kararı', aciklama: 'İşveren tüzel kişi ve İstoc ile Segika maliyet paylaşımı kesinleşir. Randevu, kayıt ve aktif satıcının ne sayılacağı da yazılı olarak tanımlanır.', tur: 'karar' },
  { tarih: '2026-11-07', baslik: 'CRM testi ve sorumlular', aciklama: 'Senaryo sahibi ve geliştirici sorumlusu atanır. Çarşı izni bu tarihe kadar netleşir.', tur: 'karar' },
  { tarih: '2026-11-09', baslik: 'İlk aday görüşmeleri', aciklama: 'Telefon ön görüşmesi, görev testi, yapılandırılmış mülakat ve referans kontrolü yapılır.', tur: 'ise-alim' },
  { tarih: '2026-11-10', baslik: 'Ödeme, fiyat ve marka engelleri', aciklama: 'Bu engeller aşılmazsa satış hedefi ertelenir.', tur: 'karar' },
  { tarih: '2026-11-13', baslik: 'İYS, satış vaatleri ve ölçüm', aciklama: 'Hukuk kontrolü biter. Ölçüm kurulumunu geliştirici ekip tamamlar.', tur: 'hukuk' },
  { tarih: '2026-11-20', baslik: 'Teklifler ve alıcı planı', aciklama: 'Birinci dalga adaylarına iş teklifi verilir. Etkinlik saati için yapılan 30 dükkânlık anket biter.', tur: 'ise-alim' },
  { tarih: '2026-11-23', baslik: 'Birinci dalga başlar: 6 kişi', aciklama: 'Asistan, İstoç masa başı, 2 saha, dijital pazarlama ve Segika masa başı başlar.', tur: 'baslangic' },
  { tarih: '2026-12-01', baslik: 'İkinci dalga başlar', aciklama: 'Organizatör başlar. 3. saha personeli yalnız koşullar sağlanırsa başlar.', tur: 'baslangic' },
  { tarih: '2026-12-15', baslik: 'Ramazan ve sezon teyidi', aciklama: 'Şubat ve Mart 2027 etkinlik saatleri teyit edilir.', tur: 'karar' },
  { tarih: '2026-12-23', baslik: 'Birinci dalga 30. gün', aciklama: 'Her kişi kendi verisini sunar. Devam, koçluk ya da rol değişikliği kararı verilir.', tur: 'kontrol' },
  { tarih: '2026-12-31', baslik: 'İkinci dalga 30. gün ve asgari ücret', aciklama: 'Organizatör değerlendirilir. Ocak 2027 maaş ve bütçe modeli güncellenir.', tur: 'kontrol' },
  { tarih: '2027-01-22', baslik: 'Birinci dalga 60. gün', aciklama: 'Deneme süresi bitmeden avukat ve mali müşavirle son karar verilir.', tur: 'kontrol' },
  { tarih: '2027-01-30', baslik: 'İkinci dalga 60. gün', aciklama: 'Organizatör ve 3. saha için son karar verilir.', tur: 'kontrol' },
  { tarih: '2027-02-21', baslik: 'Birinci dalga 90. gün', aciklama: 'Devam et, değiştir ya da durdur kararı verilir.', tur: 'kontrol' },
];

export interface PlanRolu {
  ad: string;
  role: RoleKey;
  kisi: number;
  dalga: 1 | 2;
  tarih: string;
  /** Aylık gereken saat; net kapasite 125 saattir. */
  saat: number;
  /** Önerilen düzenlemeyle saat (varsa). */
  oneriSaat?: number;
  hedef: string;
  baslangic: string;
  kosul?: string;
}

export const NET_SAAT = 125;

export const PLAN_ROLLERI: PlanRolu[] = [
  {
    ad: 'Yönetici ve operasyon asistanı',
    role: 'asistan',
    kisi: 1,
    dalga: 1,
    tarih: '2026-11-23',
    saat: 125,
    hedef: 'Görevlerin en az yüzde 90’ı zamanında biter.',
    baslangic: 'İşe alım dalgası bitince asistanın 20 saati veri ve rapor işlerine kayar.',
    kosul: 'Alınıp alınmayacağı 6 Kasım’a kadar karara bağlanır. Satış kotası yoktur.',
  },
  {
    ad: 'İstoç masa başı',
    role: 'pazarlamaci',
    kisi: 1,
    dalga: 1,
    tarih: '2026-11-23',
    saat: 158,
    oneriSaat: 126,
    hedef: 'Günde 60 arama ve 3 randevu (İsmail Karaca hedefi).',
    baslangic: 'Günlük arama sayısı adım adım artar. 2. haftada 20, 3. haftada 40 olur. 4. haftada 50, 8. haftada 60 olur. İlk 30 günde günde 1 ya da 2 randevu ölçülür.',
    kosul: 'Aktif satıcı uyumu ayrı bir sorumluya geçerse yük 126 saate iner.',
  },
  {
    ad: 'İstoç saha ekibi',
    role: 'saha-uzmani',
    kisi: 2,
    dalga: 1,
    tarih: '2026-11-23',
    saat: 100,
    hedef: 'Kişi başı günde 15 dükkân teması ve en az 4 karar verici görüşmesi.',
    baslangic: 'Ekibin aylık hedefi 45 kayıt ve 8 aktif satıcıdır. Aralık takviyesiyle ekip 3 kişi olunca bu hedef kişi başı ayda 15 kayıt eder.',
  },
  {
    ad: 'Dijital pazarlama uzmanı',
    role: 'dijital-pazarlama',
    kisi: 1,
    dalga: 1,
    tarih: '2026-11-23',
    saat: 147,
    hedef: 'Ocak’ta günde 3 video ve yüzde 80 otomatik paylaşım (İsmail Karaca hedefi).',
    baslangic: 'İlk ay günde 1 video üretilir. Kurulum eklenince ilk ay yükü 182 saattir.',
    kosul: 'Ölçüm kurulumu 13 Kasım’a kadar geliştirici ekiptedir.',
  },
  {
    ad: 'Segika masa başı',
    role: 'segika',
    kisi: 1,
    dalga: 1,
    tarih: '2026-11-23',
    saat: 154,
    oneriSaat: 129,
    hedef: 'Günde 40 arama, sonra kademeli olarak 60.',
    baslangic: 'İlk 60 gün günde 40 arama yapılırsa yük 129 saate iner ve destek kalitesi korunur.',
    kosul: 'Uzman danışma hattı hazır olunca başlar.',
  },
  {
    ad: 'Etkinlik organizatörü',
    role: 'organizator',
    kisi: 1,
    dalga: 2,
    tarih: '2026-12-01',
    saat: 160,
    hedef: 'Haftada 5 etkinlik ve etkinlik başına en az 50 kişi (İsmail Karaca hedefi).',
    baslangic: 'Önce 20 ile 25 kişilik 2 pilot yapılır, sonra haftada 3 etkinliğe çıkılır.',
    kosul: 'İki pilot etkinlikten sonra tam zamanlıya geçer.',
  },
  {
    ad: '3. saha personeli',
    role: 'saha-uzmani',
    kisi: 1,
    dalga: 2,
    tarih: '2026-12-01',
    saat: 100,
    hedef: 'Saha ekibiyle aynı hedef.',
    baslangic: 'Koşullar sağlanmadan kendiliğinden işe alınmaz.',
    kosul: '10 iş günlük veri ve ölçülmüş dönüşüm gerekir. Uyum kuyruğu ve rota kapasitesi uygun olmalıdır. Net katkı olumlu olmalıdır.',
  },
];

/** Yönetici yükü: Kasım ayında işe alım ve tekrarlayan yönetim işi. */
export const YONETICI_YUKU = { saat: 206, iseAlim: 96, yonetim: 110 };

export const ILK_60_GUN: { ne: string; personel: string; yonetici: string }[] = [
  { ne: 'İşe girişten önce', personel: 'Personel evrak ve hesap bilgilerini verir.', yonetici: 'Mali müşavir SGK işlemini hazırlar. Asistan erişimleri hazırlar.' },
  { ne: '1. hafta', personel: 'Personel ürün, müşteri, KVKK ve araç eğitimi alır. Personel ilk rol oyunlarını yapar.', yonetici: 'Yönetici hedefi, yetkiyi ve kırmızı çizgileri yazılı anlatır.' },
  { ne: '2. hafta', personel: 'Personel gözetim altında gerçek işe başlar.', yonetici: 'Yönetici her gün kısa koçluk yapar. Yönetici ilk çağrıları ve ziyaretleri izler.' },
  { ne: '3. ve 4. hafta', personel: 'Personel hedefin yüzde 50 ile 80’ine çıkar.', yonetici: 'Yönetici haftalık birebir görüşmede göstergeleri inceler ve engelleri çözer.' },
  { ne: '30. gün', personel: 'Personel kendi verisini sunar.', yonetici: 'Yönetici devam, koçluk ya da rol değişikliği kararı verir.' },
  { ne: '60. gün', personel: 'Personel tam hedefe yaklaşır.', yonetici: 'Yönetici deneme süresi bitmeden son kararı verir.' },
];

export type Seviye = 'Kritik' | 'Yüksek' | 'Orta';

export const KARARLAR: { konu: string; neden: string; seviye: Seviye; kim: string; tarih: string | null; tarihNotu?: string }[] = [
  { konu: 'İşveren tüzel kişi', neden: 'Sözleşme, SGK, fatura ve Segika maliyet paylaşımı buna bağlıdır.', seviye: 'Kritik', kim: 'İsmail Karaca ve mali müşavir', tarih: '2026-11-06' },
  { konu: 'İSTOÇ çarşı yönetimi izni', neden: 'Dükkân dükkân satış ve afiş için çarşı ya da plaza kuralı olabilir.', seviye: 'Kritik', kim: 'İsmail Karaca', tarih: '2026-11-07' },
  { konu: 'Ad benzerliği', neden: 'Esnaf istoc.com’u çarşının resmi sitesi sanabilir.', seviye: 'Kritik', kim: 'Avukat', tarih: '2026-11-10' },
  { konu: 'Ödeme sistemi hazır mı?', neden: 'Saha ekibi abonelik ücretini tahsil edemezse satış hedefi tutmaz.', seviye: 'Kritik', kim: 'Ürün ekibi', tarih: '2026-11-10' },
  { konu: 'Fiyat ve fatura', neden: 'Fiyat, para birimi, KDV ve iade kuralı netleşmelidir.', seviye: 'Kritik', kim: 'İsmail Karaca ve muhasebe', tarih: '2026-11-10' },
  { konu: 'İYS ve aydınlatma metni', neden: 'Arama ve e-posta bu kurallar sağlanmadan başlamaz.', seviye: 'Kritik', kim: 'Avukat ve dijital pazarlama uzmanı', tarih: '2026-11-13' },
  { konu: 'Alıcı tarafı', neden: 'Satıcıya alıcı gelmezse abonelik yenilenmez.', seviye: 'Kritik', kim: 'İsmail Karaca', tarih: '2026-11-20' },
  { konu: 'Satış vaatleri', neden: '“Teşvik” ya da “destek paketi” nakit gibi anlaşılırsa şikâyet doğar.', seviye: 'Yüksek', kim: 'Avukat ve İsmail Karaca', tarih: '2026-11-13' },
  { konu: 'Çağrı kaydı', neden: 'Kayıt alınacaksa KVKK aydınlatması ve saklama süresi gerekir.', seviye: 'Yüksek', kim: 'Avukat', tarih: '2026-11-13' },
  { konu: 'Etkinlik saati', neden: 'Çarşıda hayat 18.00 civarında bitebilir. 17.00 ile 18.00 arası esnaf için iş çıkışı olmayabilir.', seviye: 'Yüksek', kim: 'Saha ekibi, 30 dükkân anketi', tarih: '2026-11-20' },
  { konu: 'Şirket hattı ve WhatsApp', neden: 'Kişisel numara kullanılırsa personel ayrılınca müşteri ve veri kaybı olur.', seviye: 'Yüksek', kim: 'Asistan', tarih: null, tarihNotu: 'İlk iş günü' },
  { konu: 'Segika veri erişimi', neden: 'Personel verisi ve kurum şifreleri çok hassastır. Bu yüzden yetki sınırı gerekir.', seviye: 'Yüksek', kim: 'İsmail Karaca ve geliştirici', tarih: null, tarihNotu: 'İlk erişimden önce' },
  { konu: 'Etkinlik salonu', neden: '50 kişi için yangın, sigorta, plaza izni ve ikram sorumluluğu netleşmelidir.', seviye: 'Yüksek', kim: 'Organizatör', tarih: null, tarihNotu: 'İlk etkinlikten önce' },
  { konu: 'Ramazan ve sezon', neden: 'Şubat ve Mart 2027’de etkinlik saati ve esnaf yoğunluğu değişebilir.', seviye: 'Orta', kim: 'Organizatör', tarih: '2026-12-15' },
  { konu: 'Asgari ücret değişimi', neden: 'Ocak 2027 maaş ve bütçe modeli değişecek.', seviye: 'Orta', kim: 'Mali müşavir', tarih: '2026-12-31' },
];

export const ACIK_SORULAR = [
  '45 kayıt ve 8 aktif satıcı ekibin toplam hedefi mi, kişi başı hedef mi?',
  'Haftada 5 etkinlikteki 50 kişi etkinlik başına mı, toplam katılım mı?',
  'Öksüzoğlu Plaza’daki salon en çok kaç kişi alıyor ve akşam kullanımına izin var mı?',
  'Eğitmenlik görevini kim üstlenecek? Organizatör mü, İsmail Karaca mı, dış uzman mı?',
  'Segika’nın mevcut müşteri desteğini bugün kim veriyor?',
  'Güncel istoc.com fiyatı ve ödeme akışı satışa hazır mı?',
  'Dijital pazarlama uzmanının kapsamı yalnız istoc.com mu, Segika da dâhil mi?',
];

export const EK_ROLLER: { oncelik: Seviye; ad: string; neden: string; tetik: string; model: string }[] = [
  { oncelik: 'Kritik', ad: 'Eğitmen ve içerik sahibi', neden: 'Organizatör etkinliği yönetir ama uzman eğitimini tek başına hazırlayamaz.', tetik: 'Pilot etkinlikten önce', model: '3 ile 5 sözleşmeli eğitmen' },
  { oncelik: 'Kritik', ad: 'Satıcı uyum uzmanı', neden: 'Aktif satıcı yükünü masa başından alır.', tetik: 'Uyum işi ayda 30 saati geçince', model: 'Tam ya da yarı zamanlı' },
  { oncelik: 'Kritik', ad: 'Alıcı ve talep sorumlusu', neden: 'Satıcıya alıcı ve teklif talebi getirir.', tetik: 'İlk ödeme yapan satıcıdan önce', model: 'Önce İsmail Karaca ve dijital pazarlama uzmanı, sonra yeni kişi' },
  { oncelik: 'Kritik', ad: 'Mali müşavir ve bordro', neden: 'Sözleşme, SGK, prim ve maliyet doğru olmalıdır.', tetik: 'Hemen', model: 'Dış hizmet' },
  { oncelik: 'Kritik', ad: 'Avukat ve KVKK danışmanı', neden: 'İYS, marka, sözleşme ve veri riskini yönetir.', tetik: 'Hemen', model: 'Dış hizmet' },
  { oncelik: 'Yüksek', ad: 'Katalog operatörü', neden: 'Esnaf ürün yüklemezse satıcı aktif hâle gelmez.', tetik: '5 satıcı ürün yüklemede takılırsa', model: 'Yarı zamanlı' },
  { oncelik: 'Yüksek', ad: 'SGK danışmanı', neden: 'Segika desteğinde kesin hukuki yanıt gerekir.', tetik: 'Yeni personelden önce', model: 'Dış uzman' },
  { oncelik: 'Yüksek', ad: 'Satış ekip lideri', neden: 'Saha ve masa başı personelini günlük yönetir.', tetik: 'Satış personeli 5 kişiye ulaşınca ya da 60. günde', model: 'Mevcut en iyi personel ya da yeni kişi' },
  { oncelik: 'Yüksek', ad: 'Geliştirici bağlantı kişisi', neden: 'Ölçüm, CRM ve hata taleplerinin sahibidir.', tetik: 'Hemen', model: 'Mevcut ekipten atanır' },
  { oncelik: 'Yüksek', ad: 'İş sağlığı ve güvenliği hizmeti', neden: 'Ofis ve saha çalışmasının yasal kapsamını netleştirir.', tetik: 'İşe girişlerden önce', model: 'Dış hizmet' },
  { oncelik: 'Orta', ad: 'Video ve grafik serbest çalışan', neden: 'Günde 3 video ve etkinlik yükünü taşır.', tetik: 'Video hedefi günde 1’i geçince', model: 'Serbest çalışan' },
  { oncelik: 'Orta', ad: 'Karşılama desteği', neden: '30 kişi üstünde yoklamayı tek kişi yönetemez.', tetik: 'Salon 30 kişiyi geçince', model: 'Etkinlik başı yarı zamanlı' },
  { oncelik: 'Orta', ad: 'Tahsilat ve muhasebe takibi', neden: 'Fatura, gecikme ve yenileme takibi gerekir.', tetik: '20 aboneden sonra', model: 'Yarı zamanlı ya da dış hizmet' },
  { oncelik: 'Orta', ad: 'Liste araştırması', neden: 'Arama listesi temiz değilse masa başı verimi düşer.', tetik: 'Asistanın kapasitesi dolunca', model: 'Yarı zamanlı' },
];
