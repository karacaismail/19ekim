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
  { id: 'f0', ad: 'Aşama 0: Kararlar', bas: '2026-11-03', son: '2026-11-07', aciklama: 'İşveren, hedef ve asistan kararları verilir.' },
  { id: 'f1', ad: 'Aşama 1: Sistemi hazırla', bas: '2026-11-04', son: '2026-11-20', aciklama: 'CRM, telefon hatları ve İleti Yönetim Sistemi (İYS) kaydı hazırlanır. İYS, ticari mesaj izinlerinin kaydedildiği resmî sistemdir. Satış için gereken belge ve malzemeler de hazırlanır.' },
  { id: 'f2', ad: 'Aşama 2: Bul ve seç', bas: '2026-11-04', son: '2026-11-20', aciklama: 'Her rol için en az 5 aday görüşülür.' },
  { id: 'f3', ad: 'Aşama 3: Göreve başlat', bas: '2026-11-23', son: '2026-12-23', aciklama: 'Yeni personel önce eğitim alır. Personelin hedefi zamanla artar.' },
  { id: 'd1', ad: 'Birinci dalga: ilk 90 gün', bas: '2026-11-23', son: '2027-02-21', aciklama: 'Yönetici, işe başladıktan sonraki 30., 60. ve 90. günde karar verir. Karar devam, değiştir ya da durdur olabilir.' },
  { id: 'd2', ad: 'İkinci dalga: ilk 90 gün', bas: '2026-12-01', son: '2027-02-28', aciklama: 'Organizatör ve 3. saha personeli için aynı değerlendirme yapılır. 3. saha personeli yalnız koşullar sağlanırsa başlar.' },
  { id: 'f4', ad: 'Aşama 4: Düzenli takip toplantıları', bas: '2026-11-23', son: '2027-02-28', aciklama: 'Günlük 15 dakikalık toplantı, haftalık ekip toplantısı ve birebir görüşmeler sürer.' },
];

export const OLAYLAR: PlanOlayi[] = [
  { tarih: '2026-11-03', baslik: 'Üç kritik karar netleşir', aciklama: 'Üç karar konuşulur. Personelin hangi şirketin çalışanı olacağı belirlenir. Etkinliklerin ne sıklıkla yapılacağı belirlenir. Asistan alınıp alınmayacağı belirlenir.', tur: 'karar' },
  { tarih: '2026-11-04', baslik: 'Mali müşavir ve avukat görüşmesi', aciklama: 'Sözleşme ve maliyet konuşulur. İş ilanları hazırlanır.', tur: 'hukuk' },
  { tarih: '2026-11-05', baslik: 'İlanlar yayımlanır', aciklama: 'Dükkân dükkân satış ve afiş için çarşı ve plaza yönetimine izin sorulur.', tur: 'ise-alim' },
  { tarih: '2026-11-06', baslik: 'İşveren, tanımlar, prim ve bütçe kararı', aciklama: 'Personelin hangi şirketin çalışanı olacağı kesinleşir. iStoc ile Segika’nın maliyeti nasıl paylaşacağı da kesinleşir. Randevu, kayıt ve aktif satıcının ne sayılacağı yazılı olarak tanımlanır. İşveren kararından İsmail Karaca ve mali müşavir sorumludur.', tur: 'karar' },
  { tarih: '2026-11-07', baslik: 'CRM testi ve sorumlular', aciklama: 'Senaryo sahibi ve geliştirici sorumlusu atanır. Dükkân dükkân satış ve afiş için çarşı izni bu tarihe kadar netleşir. Bu izinden İsmail Karaca sorumludur.', tur: 'karar' },
  { tarih: '2026-11-09', baslik: 'İlk aday görüşmeleri', aciklama: 'Önce telefonla ön görüşme yapılır. Sonra görev testi verilir. Sonra her adaya aynı soruların sorulduğu görüşme yapılır. En son referanslar kontrol edilir.', tur: 'ise-alim' },
  { tarih: '2026-11-10', baslik: 'Ödeme, fiyat ve marka engelleri', aciklama: 'Ödeme sistemi satışa hazır olmalıdır. Fiyat, para birimi, KDV ve iade kuralı netleşmelidir. Esnaf istoc.com’u çarşının resmî sitesi sanabilir. Avukat bu marka riskini inceler. Bu engeller aşılmazsa satış hedefi ertelenir.', tur: 'karar' },
  { tarih: '2026-11-13', baslik: 'İleti Yönetim Sistemi (İYS), satış vaatleri ve ölçüm', aciklama: 'Hukuk kontrolü biter. Ölçüm kurulumunu geliştirici ekip tamamlar.', tur: 'hukuk' },
  { tarih: '2026-11-20', baslik: 'Teklifler ve alıcı planı', aciklama: 'İlk işe başlayacak 6 kişilik gruba (birinci dalga) iş teklifi verilir. Etkinlik saatini seçmek için 30 dükkânla yapılan anket biter. İsmail Karaca satıcıya alıcı getirme planını hazırlar.', tur: 'ise-alim' },
  { tarih: '2026-11-23', baslik: 'Birinci dalga başlar: 6 kişi', aciklama: 'Birinci dalgada 6 kişi işe başlar. Asistan, İstoç Pazarlama CRM uzmanı ve dijital pazarlama uzmanı başlar. 2 saha personeli ile Segika CRM de başlar.', tur: 'baslangic' },
  { tarih: '2026-12-01', baslik: 'İkinci dalga başlar', aciklama: 'Organizatör başlar. Koşullar sağlanırsa 3. saha personeli de başlar. Bunun için 10 iş günlük veri ve ölçülmüş dönüşüm gerekir. Uyum kuyruğu, rota kapasitesi ve net katkı da uygun olmalıdır.', tur: 'baslangic' },
  { tarih: '2026-12-15', baslik: 'Ramazan ve sezon kontrolü', aciklama: 'Şubat ve Mart 2027 etkinlik saatleri kesinleştirilir. Bu işten organizatör sorumludur.', tur: 'karar' },
  { tarih: '2026-12-23', baslik: 'Birinci dalganın 30. günü', aciklama: 'Her çalışan kendi iş sonuçlarını sunar. Yönetici devam, koçluk ya da rol değişikliği kararı verir.', tur: 'kontrol' },
  { tarih: '2026-12-31', baslik: 'İkinci dalganın 30. günü ve asgari ücret', aciklama: 'Organizatör değerlendirilir. Yeni asgari ücrete göre Ocak 2027 maaşları ve bütçe modeli güncellenir. Bu güncellemeden mali müşavir sorumludur.', tur: 'kontrol' },
  { tarih: '2027-01-22', baslik: 'Birinci dalganın 60. günü', aciklama: 'Birinci dalgadaki çalışanların deneme süresi yakında biter. Yönetici bu süre bitmeden her çalışan için son kararı verir. Karar avukat ve mali müşavirle birlikte verilir.', tur: 'kontrol' },
  { tarih: '2027-01-30', baslik: 'İkinci dalganın 60. günü', aciklama: 'Organizatör ve 3. saha personeli için son karar verilir.', tur: 'kontrol' },
  { tarih: '2027-02-21', baslik: 'Birinci dalganın 90. günü', aciklama: 'Devam et, değiştir ya da durdur kararı verilir.', tur: 'kontrol' },
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
    hedef: 'Görevlerin en az %90’ı zamanında biter.',
    baslangic: 'İşe alımlar bitince asistan ayda 20 saatini veri ve rapor işlerine ayırır.',
    kosul: 'Asistanın alınıp alınmayacağına 6 Kasım 2026 Cuma gününe kadar karar verilir. Asistanın satış kotası yoktur.',
  },
  {
    ad: 'İstoç Pazarlama CRM uzmanı',
    role: 'pazarlamaci',
    kisi: 1,
    dalga: 1,
    tarih: '2026-11-23',
    saat: 158,
    oneriSaat: 126,
    hedef: 'İsmail Karaca’nın hedefi günde 60 arama ve 3 randevudur.',
    baslangic: 'İşe başladıktan sonra günlük arama sayısı adım adım artar. 2. haftada 20, 3. haftada 40 olur. 4. haftada 50, 8. haftada 60 olur. İlk 30 günde günde 1 ya da 2 randevu beklenir.',
    kosul: 'Satıcıların sisteme alışma işini başka biri üstlenebilir. O zaman İstoç Pazarlama CRM uzmanının işi 126 saate iner.',
  },
  {
    ad: 'İstoç saha ekibi',
    role: 'saha-uzmani',
    kisi: 2,
    dalga: 1,
    tarih: '2026-11-23',
    saat: 100,
    hedef: 'Her saha personeli günde 15 dükkânla konuşur. En az 4 dükkânda karar veren kişiyle görüşür.',
    baslangic: 'Ekibin aylık hedefi 45 kayıt ve 8 aktif satıcıdır. 3. kişi Aralık 2026’da gelince ekip 3 kişi olur. O zaman bu hedef kişi başı ayda 15 kayıt eder.',
  },
  {
    ad: 'Dijital pazarlama uzmanı',
    role: 'dijital-pazarlama',
    kisi: 1,
    dalga: 1,
    tarih: '2026-11-23',
    saat: 147,
    hedef: 'İsmail Karaca’nın Ocak 2027 hedefi günde 3 video ve %80 otomatik paylaşımdır.',
    baslangic: 'İlk ay günde 1 video üretilir. Kurulum eklenince ilk ay yükü 182 saattir.',
    kosul: 'Ölçüm araçlarını 13 Kasım 2026 Cuma gününe kadar geliştirici ekip kurar.',
  },
  {
    ad: 'Segika CRM',
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
    hedef: 'İsmail Karaca’nın hedefi haftada 5 etkinlik ve etkinlik başına en az 50 kişidir.',
    baslangic: 'Önce 20 ile 25 kişilik 2 deneme etkinliği yapılır. Sonra haftada 3 etkinlik yapılır.',
    kosul: 'İki deneme etkinliğinden sonra tam zamanlı çalışmaya geçer.',
  },
  {
    ad: '3. saha personeli',
    role: 'saha-uzmani',
    kisi: 1,
    dalga: 2,
    tarih: '2026-12-01',
    saat: 100,
    hedef: 'Saha ekibiyle aynı hedef.',
    baslangic: 'Bu kişi yalnız aşağıdaki koşulların hepsi sağlanırsa işe alınır.',
    kosul: 'Saha ekibinin en az 10 iş günlük verisi olmalıdır. Dönüşüm oranı ölçülmüş olmalıdır. Uyum kuyruğu ve rota kapasitesi uygun olmalıdır. Yeni kişinin getireceği gelir, maliyetinden fazla olmalıdır.',
  },
];

/** Yönetici yükü: Kasım ayında işe alım ve tekrarlayan yönetim işi. */
export const YONETICI_YUKU = { saat: 206, iseAlim: 96, yonetim: 110 };

export const ILK_60_GUN: { ne: string; personel: string; yonetici: string }[] = [
  { ne: 'İşe girişten önce', personel: 'Personel evrak ve hesap bilgilerini verir.', yonetici: 'Mali müşavir SGK işlemini hazırlar. Asistan, personelin kullanacağı sistemlere giriş hesaplarını açar.' },
  { ne: '1. hafta', personel: 'Personel ürün, müşteri ve araç eğitimi alır. Kişisel verileri koruma (KVKK) eğitimi de alır. Personel, müşteri görüşmesini bir arkadaşıyla deneme olarak canlandırır.', yonetici: 'Yönetici hedefi, yetkiyi ve kesin yasakları yazılı anlatır.' },
  { ne: '2. hafta', personel: 'Personel gözetim altında gerçek işe başlar.', yonetici: 'Yönetici her gün kısa koçluk yapar. Yönetici ilk çağrıları ve ziyaretleri izler.' },
  { ne: '3. ve 4. hafta', personel: 'Personel hedefin %50 ile %80’ine çıkar.', yonetici: 'Yönetici haftalık birebir görüşmede göstergeleri inceler ve engelleri çözer.' },
  { ne: 'İşe başladıktan sonraki 30. gün', personel: 'Personel kendi verisini sunar.', yonetici: 'Yönetici devam, koçluk ya da rol değişikliği kararı verir.' },
  { ne: 'İşe başladıktan sonraki 60. gün', personel: 'Personel tam hedefe yaklaşır.', yonetici: 'Yönetici deneme süresi bitmeden son kararı verir.' },
];

export type Seviye = 'Kritik' | 'Yüksek' | 'Orta';

export const KARARLAR: { konu: string; neden: string; seviye: Seviye; kim: string; tarih: string | null; tarihNotu?: string }[] = [
  { konu: 'Hangi şirket işveren olacak?', neden: 'Sözleşme, SGK, fatura ve Segika maliyet paylaşımı buna bağlıdır.', seviye: 'Kritik', kim: 'İsmail Karaca ve mali müşavir', tarih: '2026-11-06' },
  { konu: 'İstoç çarşı yönetimi izni', neden: 'Dükkân dükkân satış ve afiş için çarşı ya da plaza kuralı olabilir.', seviye: 'Kritik', kim: 'İsmail Karaca', tarih: '2026-11-07' },
  { konu: 'Ad benzerliği', neden: 'Esnaf istoc.com’u çarşının resmi sitesi sanabilir.', seviye: 'Kritik', kim: 'Avukat', tarih: '2026-11-10' },
  { konu: 'Ödeme sistemi hazır mı?', neden: 'Saha ekibi abonelik ücretini tahsil edemezse satış hedefi tutmaz.', seviye: 'Kritik', kim: 'Ürün ekibi', tarih: '2026-11-10' },
  { konu: 'Fiyat ve fatura', neden: 'Fiyat, para birimi, KDV ve iade kuralı netleşmelidir.', seviye: 'Kritik', kim: 'İsmail Karaca ve muhasebe', tarih: '2026-11-10' },
  { konu: 'İleti Yönetim Sistemi (İYS) ve kişisel veri bilgilendirmesi (aydınlatma metni)', neden: 'Bu kurallar sağlanmadan satıcıları aramayın ve e-posta göndermeyin.', seviye: 'Kritik', kim: 'Avukat ve dijital pazarlama uzmanı', tarih: '2026-11-13' },
  { konu: 'Alıcı tarafı', neden: 'Satıcıya alıcı gelmezse abonelik yenilenmez.', seviye: 'Kritik', kim: 'İsmail Karaca', tarih: '2026-11-20' },
  { konu: 'Satış vaatleri', neden: '“Teşvik” ya da “destek paketi” nakit gibi anlaşılırsa şikâyet doğar.', seviye: 'Yüksek', kim: 'Avukat ve İsmail Karaca', tarih: '2026-11-13' },
  { konu: 'Çağrı kaydı', neden: 'Telefon görüşmeleri kaydedilecekse önce kişiye KVKK’ya göre bilgi verilmelidir. Kayıtların ne kadar saklanacağı da belli olmalıdır.', seviye: 'Yüksek', kim: 'Avukat', tarih: '2026-11-13' },
  { konu: 'Etkinlik saati', neden: 'Çarşıdaki dükkânlar 18:00 civarında kapanabilir. Esnaf 17:00 ile 18:00 arasında hâlâ çalışıyor olabilir.', seviye: 'Yüksek', kim: 'Saha ekibi, 30 dükkân anketi', tarih: '2026-11-20' },
  { konu: 'Şirket hattı ve WhatsApp', neden: 'Kişisel numara kullanılırsa personel ayrılınca müşteri ve veri kaybı olur.', seviye: 'Yüksek', kim: 'Asistan', tarih: null, tarihNotu: 'İlk iş günü' },
  { konu: 'Segika veri erişimi', neden: 'Personel verisi ve kurum şifreleri çok hassastır. Bu yüzden her personel yalnız işi için gereken verileri görmelidir.', seviye: 'Yüksek', kim: 'İsmail Karaca ve geliştirici', tarih: null, tarihNotu: 'İlk erişimden önce' },
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
  { oncelik: 'Kritik', ad: 'Sözleşmeli eğitmen', neden: 'Organizatör etkinliği yönetir ama uzman eğitimini tek başına hazırlayamaz.', tetik: 'Deneme etkinliğinden önce', model: '3 ile 5 sözleşmeli eğitmen' },
  { oncelik: 'Kritik', ad: 'Satıcı uyum uzmanı', neden: 'Aktif satıcı yükünü İstoç Pazarlama CRM uzmanından alır.', tetik: 'Uyum işi ayda 30 saati geçince', model: 'Tam ya da yarı zamanlı' },
  { oncelik: 'Kritik', ad: 'Alıcı ve talep sorumlusu', neden: 'Satıcıya alıcı ve teklif talebi getirir.', tetik: 'İlk ödeme yapan satıcıdan önce', model: 'Önce İsmail Karaca ve dijital pazarlama uzmanı, sonra yeni kişi' },
  { oncelik: 'Kritik', ad: 'Mali müşavir ve bordro', neden: 'Sözleşme, SGK, prim ve maliyet doğru olmalıdır.', tetik: 'Hemen', model: 'Dış hizmet' },
  { oncelik: 'Kritik', ad: 'Avukat ve kişisel veri (KVKK) danışmanı', neden: 'İYS, marka, sözleşme ve veri riskini yönetir.', tetik: 'Hemen', model: 'Dış hizmet' },
  { oncelik: 'Yüksek', ad: 'Katalog operatörü', neden: 'Esnaf ürün yüklemezse satıcı aktif hâle gelmez.', tetik: '5 satıcı ürün yüklemede takılırsa', model: 'Yarı zamanlı' },
  { oncelik: 'Yüksek', ad: 'SGK danışmanı', neden: 'Segika desteğinde kesin hukuki yanıt gerekir.', tetik: 'Yeni personelden önce', model: 'Dış uzman' },
  { oncelik: 'Yüksek', ad: 'Satış ekip lideri', neden: 'Saha satış uzmanlarını ve İstoç Pazarlama CRM uzmanını günlük yönetir.', tetik: 'Satış personeli 5 kişiye ulaşınca ya da 60. günde', model: 'Mevcut en iyi personel ya da yeni kişi' },
  { oncelik: 'Yüksek', ad: 'Geliştirici bağlantı kişisi', neden: 'Ölçüm, CRM ve hata taleplerini geliştirici ekibe iletir ve takip eder.', tetik: 'Hemen', model: 'Mevcut ekipten atanır' },
  { oncelik: 'Yüksek', ad: 'İş sağlığı ve güvenliği hizmeti', neden: 'Ofis ve saha çalışmasının yasal kapsamını netleştirir.', tetik: 'İşe girişlerden önce', model: 'Dış hizmet' },
  { oncelik: 'Orta', ad: 'Video ve grafik üretici', neden: 'Günde 3 video ve etkinlik yükünü taşır.', tetik: 'Video hedefi günde 1’i geçince', model: 'Serbest çalışan' },
  { oncelik: 'Orta', ad: 'Etkinlik karşılama desteği', neden: '30 kişi üstünde yoklamayı tek kişi yönetemez.', tetik: 'Salon 30 kişiyi geçince', model: 'Etkinlik başı yarı zamanlı' },
  { oncelik: 'Orta', ad: 'Muhasebe ve tahsilat uzmanı', neden: 'Fatura, gecikme ve yenileme takibi gerekir.', tetik: '20 aboneden sonra', model: 'Yarı zamanlı ya da dış hizmet' },
  { oncelik: 'Orta', ad: 'Liste araştırması', neden: 'Arama listesinde yanlış ya da eski numaralar olabilir. O zaman İstoç Pazarlama CRM uzmanı daha az satıcıya ulaşır.', tetik: 'Asistanın kapasitesi dolunca', model: 'Yarı zamanlı' },
];
