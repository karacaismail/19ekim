import { addDays, daysBetween, longDate, monthName, nextMonth, shiftText, shortDate } from '../lib/dates';
import { int, num, tl } from '../lib/format';
import { DEFAULT_PARAMS, type Params } from './params';
import type { Program } from './program';
import type { Role, RoleKey, ScheduleRow } from './types';

export const ROLE_LABELS: Record<RoleKey, string> = {
  yonetici: 'İsmail Karaca',
  asistan: 'Asistan',
  'ekip-lideri': 'Ekip lideri',
  pazarlamaci: 'Masa başı (CRM)',
  'saha-uzmani': 'Saha ekibi',
  organizator: 'Organizatör',
  'dijital-pazarlama': 'Dijital pazarlama',
  yazilim: 'Yazılım ekibi',
  yatirimci: 'Yatırımcı',
  segika: 'Segika (CRM)',
};

const WEEKDAY = 'Hafta içi her gün işe 08:00’de başlarsınız. İşiniz 20:00’de biter. Gün içinde 60 dakika ara vardır. Böylece günde 11 saat çalışırsınız.';
const SATURDAY = 'Cumartesi 08:00’den 13:30’a kadar çalışırsınız. Cumartesi günü 30 dakika ara vardır. Böylece cumartesi 5 saat çalışırsınız.';
const WEEKLY = 'Haftada toplam 60 saat çalışırsınız. Bunun 45 saati normal çalışma, 15 saati fazla çalışmadır.';
/** 1 Şubat 2027’den Dönem 2: yıllık 270 saat fazla çalışma tavanı nedeniyle haftada 45 saat. */
const FROM_FEB = 'Pazartesiden cumaya kadar işe 08:30’da başlarsınız. İşiniz 17:30’da biter. Gün içinde 60 dakika ara vardır. Bu günlerde 8 saat çalışırsınız. Cumartesi 08:00’den 13:30’a kadar 5 saat çalışırsınız. Haftada toplam 45 saat çalışırsınız. Bu dönemde planlı fazla çalışma yoktur.';

/** Günlük blok listesi: [saat aralığı, blok]. Ara dinlenme çalışma süresinden sayılmaz. */
const day = (rows: [string, string][]): ScheduleRow[] =>
  rows.map(([time, block]) => (block === 'Ara dinlenme' ? { time, block: 'Mola', tone: 'break' } : { time, block }));

const dijital: Role = {
  slug: 'dijital-pazarlama',
  tree: 'Ağaç 1',
  title: 'Dijital pazarlama uzmanı',
  shortTitle: 'Dijital pazarlama',
  icon: 'video',
  count: '1 kişi',
  start: '1 Kasım 2026 (asistan yoksa 1 Ocak 2027)',
  startStatus: 'karar',
  pay: 'Maaş + kota ve prim',
  reportsTo: 'İsmail Karaca',
  seeks: ['GA4, GTM ve Yandex Metrica bilgisi', 'yapay zekâ otomasyonu', 'video içerik üretimi'],
  mission: 'Ölçüm araçlarını kurarsınız: Google Analytics 4 (GA4), Yandex Metrica ve Google Tag Manager (GTM). Videoları yapay zekâyla üreten ve paylaşan sistemi kurarsınız. Ne üretileceğini içerik planı belirler. İçerik planını siz hazırlarsınız.',
  tasks: [
    { task: 'Ölçüm ve entegrasyonlar: GTM, GA4, Yandex Metrica, Meta Pixel, Search Console', measure: '13 Kasım’da yayında, UTM’li paylaşım %100 (20 Kasım)' },
    { task: 'AI-first paylaşım otomasyonu kurmak', measure: 'Otomatik paylaşım %30 → %60 → %80 (Kasım → Ocak), her yayında insan onayı' },
    { task: 'İçerik üretimini ve paylaşımını otomatikleştirmek', measure: 'Günde 1 → 2 → 3 video, video başına 90 dk → 20 dk' },
    { task: 'İçerik planını yürütmek (6 sütun)', measure: 'Ocak’ta haftada 18 video ve CRM’e haftada 10 talep' },
  ],
  kpis: [
    { metric: 'Ölçüm altyapısı', value: '8', unit: 'ölçüm bağlantısı', when: '23 Kasım’a kadar hepsi kurulur' },
    { metric: 'Kısa video', value: '3', unit: 'video', when: 'Her gün, Ocak 2027’de' },
    { metric: 'Otomatik paylaşım oranı', value: '%80', unit: '', when: 'Ocak 2027’de' },
    { metric: 'CRM’e gelen talep', value: '10', unit: 'talep', when: 'Her hafta, Ocak 2027’de' },
  ],
  ramp: { metric: 'Kısa video / gün', values: [1, 2, 3], second: { metric: 'Talep / hafta', values: [3, 5, 10] } },
  plan: [
    { from: '2026-11-02', to: '2026-11-28', action: 'Sıfır Noktası ve 101 Otomasyon. Ölçüm araçları 13 Kasım’da kurulur. Bunlar Google Analytics 4 (GA4), Yandex Metrica ve Google Tag Manager (GTM) araçlarıdır. İçerik planının ilk sürümünü hazırlar. Videoyu üreten ve paylaşan yarı otomatik araç zincirini kurar. Meta reklamlarını İsmail Karaca’dan devralır', target: 'Ölçüm araçları çalışır. Günde 1 video paylaşılır' },
    { from: '2026-11-30', to: '2026-12-26', action: '201 Like ve 301 Talep. Paylaşım zamanlayıcısını kurar. Yorumları CRM’e aktaran otomasyonu kurar. İçerik planının 2. sürümünü hazırlar', target: 'Günde 2 video paylaşılır. Paylaşımların %60’ı otomatik yapılır. Haftada 5 talep gelir' },
    { from: '2026-12-28', to: '2027-01-30', action: '401 Ölçek ve 501 Hakkını vermek. İçeriği altı ana konu üzerinden üretir. Videolara birkaç dilde altyazı ekler', target: 'Günde 3 video paylaşılır. Paylaşımların %80’i otomatik yapılır. Haftada 10 talep gelir', milestone: true },
  ],
  hours: { weekday: WEEKDAY, saturday: SATURDAY, weeklyNet: WEEKLY, fromFeb: FROM_FEB },
  daily: day([
    ['08:00–08:15', 'Sabah ekip toplantısı'],
    ['08:15–09:00', 'Ölçüm panosu (GA4, Metrica, CRM)'],
    ['09:00–10:30', 'İçerik planı ve yapay zekâ senaryosu seçimi'],
    ['10:30–12:30', 'Yapay zekâyla video üretimi'],
    ['12:30–13:30', 'Ara dinlenme'],
    ['13:30–14:30', 'Yayın onayı ve kalite kontrolü'],
    ['14:30–15:30', 'Paylaşım listesini düzenleme'],
    ['15:30–17:00', 'Otomatik sistemi ve ölçüm bağlantılarını geliştirme'],
    ['17:00–18:00', 'Eğitim ve saha çekimi'],
    ['18:00–19:00', 'Talepleri CRM’e aktarma'],
    ['19:00–19:45', 'Ertesi günün paylaşım listesi'],
    ['19:45–20:00', 'Gün sonu raporu'],
  ]),
  saturday: day([
    ['08:00–08:30', 'Haftalık kapanış'],
    ['08:30–10:30', 'Haftalık ölçüm raporu'],
    ['10:30–11:00', 'Ara dinlenme'],
    ['11:00–12:30', 'Gelecek haftanın içerik planı'],
    ['12:30–13:30', 'Otomasyon bakımı'],
  ]),
};

const pazarlamaci: Role = {
  slug: 'pazarlamaci',
  tree: 'Ağaç 2',
  title: 'Masa başı pazarlama (CRM)',
  shortTitle: 'Masa başı (CRM)',
  icon: 'phone',
  count: '1 kişi',
  start: '1 Kasım 2026',
  startStatus: 'karar',
  pay: 'Maaş + satış primi',
  reportsTo: '1 Aralık’a kadar İsmail Karaca. 1 Aralık’tan başlayarak ekip lideri.',
  seeks: ['Pazarlama dili', 'Canva', 'sosyal medya kullanımı'],
  mission: 'Telefon, WhatsApp ve e-postayla iStoc’la ilgilenen müşteri adaylarını bulursunuz. Saha ekibi için bu adaylarla randevu ayarlarsınız. CRM kayıtlarını her gün güncellersiniz.',
  tasks: [
    { task: 'Tanımadığınız kişileri arama (soğuk arama)', measure: 'Günde 60 kişiyi arayın. Bunların 20’siyle nitelikli görüşme yapın.' },
    { task: 'Saha ekibi için randevu', measure: 'Günde 3 randevu ayarlayın. Alınan randevuların en az %70’i yapılmalı.' },
    { task: 'İzin veren kişilere WhatsApp ve e-posta', measure: 'Günde 20 kişiye özel mesaj gönderin. Bu kişiler mesaj almaya izin vermiş olmalı. Haftada 1 bülten gönderin.' },
    { task: 'Veri ve CRM', measure: 'Her gün CRM’e 40 yeni müşteri adayı ekleyin. Her görüşmeyi aynı gün CRM’e yazın.' },
  ],
  kpis: [
    { metric: 'Arama', value: '60', unit: 'arama', when: 'Her gün, 16 Kasım’dan başlayarak' },
    { metric: 'Randevu', value: '18', unit: 'randevu', when: 'Her hafta, Ocak 2027’de' },
    { metric: 'Gerçekleşen randevu oranı', value: 'En az %70', unit: '', when: 'Aralık’tan başlayarak' },
    { metric: 'Uzaktan kazanılan aktif satıcı', value: '16', unit: 'satıcı', when: '30 Ocak’a kadar toplam. Masa başı ve dijital pazarlamanın ortak hedefidir.' },
  ],
  ramp: { metric: 'Haftalık randevu', values: [12, 15, 18] },
  plan: [
    { from: '2026-11-02', to: '2026-11-28', action: 'Telefon konuşma metninin ilk iki sürümünü yazar. CRM’i kurar. 200 olası satıcıyı CRM’e kaydeder', target: 'Haftada 12 randevu' },
    { from: '2026-11-30', to: '2026-12-26', action: 'Oda ve dernek listelerindeki firmalarla iletişime geçer. Tavsiye ister', target: 'Haftada 15 randevu alınır. Randevuların en az %70’i gerçekleşir' },
    { from: '2026-12-28', to: '2027-01-30', action: 'Üye olan ama henüz aktif olmayan satıcıları arar. Arama rehberini yazar', target: 'Haftada 18 randevu', milestone: true },
  ],
  hours: { weekday: WEEKDAY, saturday: SATURDAY, weeklyNet: WEEKLY, fromFeb: FROM_FEB },
  daily: day([
    ['08:00–08:15', 'Sabah ekip toplantısı'],
    ['08:15–09:00', 'Günün arama listesini hazırlama'],
    ['09:00–10:00', 'Müşteri adayı listesi oluşturma'],
    ['10:00–12:30', 'Soğuk arama'],
    ['12:30–13:30', 'Ara dinlenme'],
    ['13:30–14:30', 'WhatsApp ve e-posta'],
    ['14:30–17:00', 'Soğuk arama'],
    ['17:00–18:00', 'Sosyal medya grupları'],
    ['18:00–19:00', 'Müşterinin ilk kurulumunu kontrol etme'],
    ['19:00–19:30', 'Müşteri hakkında bilgi toplama'],
    ['19:30–19:45', 'Akşam ekip toplantısı'],
    ['19:45–20:00', 'Günün CRM kayıtlarını tamamlama'],
  ]),
  saturday: day([
    ['08:00–08:30', 'Haftalık kapanış'],
    ['08:30–10:30', 'Geri arama ve teyit'],
    ['10:30–11:00', 'Ara dinlenme'],
    ['11:00–12:30', 'Bülten ve veri temizliği'],
    ['12:30–13:30', 'Haftalık rapor'],
  ]),
};

const saha: Role = {
  slug: 'saha-uzmani',
  tree: 'Ağaç 3',
  title: 'Saha pazarlama ekibi',
  shortTitle: 'Saha ekibi',
  icon: 'map',
  count: '3 kişi (2’si 1 Kasım, 1’i 1 Aralık, sonra ağla büyür)',
  start: '1 Kasım 2026 (3. kişi 1 Aralık)',
  startStatus: 'karar',
  pay: 'Maaş ve kota üstü satış başına prim',
  reportsTo: '1 Aralık’a kadar İsmail Karaca. 1 Aralık’tan başlayarak ekip lideri.',
  seeks: ['Satış dili', 'hırslı olmak'],
  mission: 'İstoç’taki satıcıları randevulu ya da randevusuz ziyaret edersiniz. Satıcıyı istoc.com’a kaydedersiniz. Kayıttan sonraki 48 saat içinde satıcının sistemi kullanmaya başlamasını sağlarsınız. Sonra satıcıyı aboneliğe geçirirsiniz. Aboneliğin her ay yenilenmesini sağlarsınız.',
  tasks: [
    { task: 'Randevulu ve randevusuz ziyaret (kişi başı)', measure: 'Günde 1 ya da 2 randevulu ziyaret yapın. Ayrıca günde 10 randevusuz ziyaret yapın.' },
    { task: 'Yerinde kayıt ve 48 saatte ilk kurulum', measure: 'Kişi başı günde 2 satıcıyı kaydedin. Kaydettiğiniz her satıcının ilk kurulumu 48 saat içinde bitsin.' },
    { task: '14. günde aboneliğe geçiş (ayda 399 €) ve aylık yenileme', measure: 'Her ay abone satıcıların en az %70’i aboneliğini yeniler.' },
    { task: 'Yıllık peşin ödeme ve pazarlama çözümü teklifi', measure: 'Her aktif satıcıya iki teklifi ilk 30 günde yapın.' },
  ],
  kpis: [
    { metric: 'Kayıt (ekip)', value: '420', unit: 'kayıt', when: '30 Ocak’a kadar ekibin toplamı' },
    { metric: 'Yeni aktif satıcı (ekip)', value: '63', unit: 'satıcı', when: '30 Ocak’a kadar ekibin toplamı' },
    { metric: 'Aboneliğini yenileyen satıcı', value: 'En az %70', unit: '', when: 'Her ay sonunda ölçülür' },
    { metric: 'İlk kurulum süresi', value: 'En geç 48', unit: 'saat', when: 'Her kayıttan sonra' },
  ],
  ramp: { metric: 'Aylık kayıt', values: [80, 145, 195], second: { metric: 'Aylık yeni aktif satıcı', values: [10, 22, 31] } },
  plan: [
    { from: '2026-11-02', to: '2026-11-28', action: 'İstoç blok haritasını çıkarır. 20 dakikalık tanıtım (demo) yapar. İlk abonelikleri satar', target: '80 kayıt, 10 aktif satıcı' },
    { from: '2026-11-30', to: '2026-12-26', action: '1 Aralık 2026’da ekip lideri ve 3. saha personeli katılır. Ekip tam çalışma düzenine geçer. Yenilemeleri takip eder', target: '145 kayıt, 22 aktif satıcı, elde tutma ≥ %70' },
    { from: '2026-12-28', to: '2027-01-30', action: 'Üye satıcıları ziyaret eder. Temsilcilerle birlikte ziyarete gider. Temsilci, satıcı getiren bağımsız iş ortağıdır', target: '195 kayıt, 31 aktif satıcı', milestone: true },
  ],
  hours: { weekday: WEEKDAY, saturday: SATURDAY, weeklyNet: WEEKLY, fromFeb: FROM_FEB },
  daily: day([
    ['08:00–08:15', 'Sabah ekip toplantısı'],
    ['08:15–09:00', 'Rota planı'],
    ['09:00–09:30', 'Ürün tanıtımı hazırlığı'],
    ['09:30–12:30', 'Saha ziyareti'],
    ['12:30–13:30', 'Ara dinlenme'],
    ['13:30–16:30', 'Saha ziyareti'],
    ['16:30–17:00', 'İlk kurulum'],
    ['17:00–18:00', 'Eğitim vakası veya takip'],
    ['18:00–19:00', 'İlk kurulum'],
    ['19:00–19:30', 'Teklif ve CRM'],
    ['19:30–19:45', 'Akşam ekip toplantısı'],
    ['19:45–20:00', 'Gün sonu raporu'],
  ]),
  saturday: day([
    ['08:00–08:30', 'Haftalık kapanış'],
    ['08:30–10:30', 'Saha ziyareti'],
    ['10:30–11:00', 'Ara dinlenme'],
    ['11:00–12:30', 'Abonelik ve yenileme'],
    ['12:30–13:30', 'Haftalık rapor'],
  ]),
};

const ekipLideri: Role = {
  slug: 'ekip-lideri',
  tree: 'Ağaç 3',
  title: 'Satış-pazarlama ekip lideri',
  shortTitle: 'Ekip lideri',
  icon: 'flag',
  count: '1 kişi (mevcut ekipten)',
  start: '1 Aralık 2026',
  startStatus: 'karar',
  pay: 'Saha maaşı + liderlik farkı ve ekibin her satışından pay',
  reportsTo: 'İsmail Karaca',
  seeks: ['Çevik', 'Kasım satış sonuçlarında üst sırada'],
  mission: 'Bu role, 1 Kasım’da işe başlayanlar arasından biri seçilir. Ekibe koçluk yaparsınız. Çok katmanlı pazarlama ağını yönetirsiniz.',
  tasks: [
    { task: 'Günlük ekip toplantılarını yönetmek', measure: 'Sabah 08:00’deki ve akşam 19:30’daki ekip toplantılarını yönetin. Ekip, haftalık hedeflerinin en az %90’ını gerçekleştirir.' },
    { task: 'Koçluk', measure: 'Haftada en az 5 saat koçluk yapın. Kişi başı 2 koçluk görüşmesi yapın.' },
    { task: 'Çok katmanlı pazarlama ağını yönetmek', measure: 'Her ay yaklaşık 2 aktif temsilci eklenir. 30 Ocak’ta toplam yaklaşık 5 aktif temsilci olur.' },
    { task: 'Kendi satışınız', measure: 'Siz de satış yaparsınız. Hedefiniz, önceki rolünüzdeki hedefin %50’sidir.' },
  ],
  kpis: [
    { metric: 'Ekibin hedefe ulaşma oranı', value: 'En az %90', unit: '', when: 'Her hafta ölçülür' },
    { metric: 'Koçluk', value: 'En az 5', unit: 'saat', when: 'Her hafta, Aralık’tan başlayarak' },
    { metric: 'Aktif temsilci', value: 'Yaklaşık 5', unit: 'temsilci', when: '30 Ocak’taki toplam' },
    { metric: 'Ağdan aktif satıcı', value: 'Yaklaşık 9', unit: 'satıcı', when: '30 Ocak’a kadar toplam' },
  ],
  ramp: { metric: 'Aktif temsilci', values: [0, 3, 5] },
  plan: [
    { from: '2026-11-23', to: '2026-11-27', action: 'Ekip lideri puan tablosu ve birebir görüşmelerle seçilir', target: 'Karar 27 Kasım 2026’da verilir', milestone: true },
    { from: '2026-12-01', to: '2026-12-26', action: 'Ekibin günlük düzenini devralır. Koçluk yapar. Temsilcilere ilk ziyaretlerinde eşlik eder', target: 'Yaklaşık 3 aktif temsilci olur. Haftada en az 5 saat koçluk yapar' },
    { from: '2026-12-28', to: '2027-01-30', action: 'Haftada 2 bilgilendirme toplantısı yapar. Temsilcilerin getirdiği satışı takip eder', target: 'Yaklaşık 5 aktif temsilci olur. Temsilciler yaklaşık 9 aktif satıcı getirir', milestone: true },
  ],
  hours: { weekday: WEEKDAY, saturday: SATURDAY, weeklyNet: WEEKLY, fromFeb: FROM_FEB },
  daily: day([
    ['08:00–08:15', 'Sabah ekip toplantısını yönetme'],
    ['08:15–09:00', 'Satış aşamalarındaki adayları kontrol etme ve işleri dağıtma'],
    ['09:00–12:30', 'Sahada satış ve koçluk'],
    ['12:30–13:30', 'Ara dinlenme'],
    ['13:30–15:00', 'Koçluk'],
    ['15:00–16:30', 'Temsilci ağı'],
    ['16:30–17:00', 'Organizatörle görüşme'],
    ['17:00–18:00', 'Eğitim vakası veya saha'],
    ['18:00–19:15', 'Kişisel hedefler'],
    ['19:15–19:30', 'Ekip hedeflerini kontrol etme'],
    ['19:30–19:45', 'Akşam ekip toplantısı'],
    ['19:45–20:00', 'Gün sonu raporu'],
  ]),
  saturday: day([
    ['08:00–08:30', 'Haftalık kapanış'],
    ['08:30–10:30', 'Koçluk'],
    ['10:30–11:00', 'Ara dinlenme'],
    ['11:00–12:30', 'Temsilci ağı'],
    ['12:30–13:30', 'Haftalık rapor'],
  ]),
};

const organizator: Role = {
  slug: 'organizator',
  tree: 'Ağaç 4',
  title: 'Organizatör',
  shortTitle: 'Organizatör',
  icon: 'presentation',
  count: '1 kişi',
  start: '1 Aralık 2026',
  startStatus: 'karar',
  pay: 'Maaş + aktivasyon ve etkinlik primi',
  reportsTo: 'İsmail Karaca',
  seeks: ['Satış dili', 'kurumsal organizasyon deneyimi', 'hırslı olmak'],
  mission: 'İstoç satıcılarına her iş günü eğitim verirsiniz. Eğitim 17:00’de başlar ve 18:00’de biter. Eğitim ofisteki toplantı salonunda yapılır. Segment organizasyonları ve kurumsal iş birlikleri de kurarsınız.',
  tasks: [
    { task: 'Her iş günü satıcı eğitimi (5 modül, M1–M5)', measure: 'Eğitim 17:00’de başlar ve 18:00’de biter. Haftada 5 eğitim oturumu yapın. Bir haftada toplam en az 50 kişi katılsın.' },
    { task: '15 kişilik segment organizasyonu', measure: 'Haftada 2 (Salı ve Perşembe)' },
    { task: 'Oda, dernek ve sektör topluluklarıyla iş birliği', measure: '30 Ocak’a kadar 1 iş birliği protokolü yapın. 27 Şubat’a kadar toplam 3 protokol yapın.' },
    { task: 'Eğitimden kayıt ve aktif satıcı', measure: '90 günlük plan süresince eğitimden yaklaşık 60 kayıt gelir. Aynı sürede yaklaşık 12 aktif satıcı kazanılır.' },
  ],
  kpis: [
    { metric: 'Eğitim oturumu', value: '5', unit: 'oturum', when: 'Her hafta, 7 Aralık’tan başlayarak' },
    { metric: 'Katılımcı', value: 'En az 50', unit: 'kişi', when: 'Her hafta toplam, 14 Aralık’tan başlayarak' },
    { metric: 'Eğitimden kayıt', value: 'Aralık’ta 5, Ocak’ta 10', unit: 'kayıt', when: 'Haftalık hedef' },
    { metric: 'Kurumsal iş birliği protokolü', value: '3', unit: 'protokol', when: '27 Şubat’a kadar toplam' },
  ],
  ramp: { metric: 'Haftalık katılımcı', values: [30, 50, 60], months: ['Aralık', 'Ocak', 'Şubat'] },
  plan: [
    { from: '2026-12-01', to: '2026-12-12', action: 'İşe uyum eğitimi alır. Salonu düzenler. Bir deneme oturumu yapar. Sonra her gün eğitim verir', target: 'Haftada 5 oturum yapılır. Katılımcı hedefi 30 kişidir' },
    { from: '2026-12-14', to: '2027-01-16', action: 'Tam çalışma düzenine geçer. Haftada 5 eğitim ve 2 organizasyon yapar. Kurumlarla görüşür', target: 'Haftada 50 katılımcı gelir. Bir oda ya da dernekle 1 iş birliği protokolü imzalanır' },
    { from: '2027-01-18', to: '2027-02-27', action: 'Satıcıları aktif hâle getirmek için kampanya yapar. Rehberlik (mentor) programını başlatır. 2. ve 3. protokolü imzalar', target: 'Haftada 60 katılımcı gelir. Toplam 3 protokol imzalanmış olur', milestone: true },
  ],
  hours: {
    weekday: WEEKDAY,
    saturday: 'Cumartesi 08:00’den 15:30’a kadar çalışırsınız. Cumartesi günü 30 dakika ara vardır. Böylece cumartesi 7 saat çalışırsınız.',
    weeklyNet: 'Haftada toplam 62 saat çalışırsınız. Bunun 45 saati normal çalışma, 17 saati fazla çalışmadır.',
    fromFeb: 'Pazartesiden cumaya kadar işe 10:30’da başlarsınız. İşiniz 19:30’da biter. Bu günlerde 8 saat çalışırsınız. Saat 17:00’deki eğitim bu sürenin içindedir. Cumartesi 10:00’dan 15:30’a kadar 5 saat çalışırsınız. Haftada toplam 45 saat çalışırsınız.',
  },
  daily: day([
    ['08:00–08:15', 'Sabah ekip toplantısı'],
    ['08:15–09:30', 'Segment ve davet planı'],
    ['09:30–12:30', 'Sahada satıcıları eğitime davet etme'],
    ['12:30–13:30', 'Ara dinlenme'],
    ['13:30–15:00', 'Kurumsal iş birliği'],
    ['15:00–16:30', 'Eğitim hazırlığı'],
    ['16:30–17:00', 'Eğitime gelenleri karşılama'],
    ['17:00–18:00', 'Eğitim oturumu'],
    ['18:00–18:45', 'Birebir destek'],
    ['18:45–19:30', 'Takip ve CRM'],
    ['19:30–19:45', 'Akşam ekip toplantısı'],
    ['19:45–20:00', 'Ertesi günün planı'],
  ]),
  saturday: day([
    ['08:00–08:30', 'Haftalık kapanış'],
    ['08:30–11:00', 'Gelecek haftanın planı'],
    ['11:00–11:30', 'Ara dinlenme'],
    ['11:30–13:30', 'Açık klinik'],
    ['13:30–15:00', 'Kurumsal iş birliği'],
    ['15:00–15:30', 'Haftalık rapor'],
  ]),
};

const asistan: Role = {
  slug: 'asistan',
  tree: 'Kurmay',
  title: 'Yönetici asistanı',
  shortTitle: 'Asistan',
  icon: 'notebook',
  count: '1 kişi',
  start: '1 Kasım 2026 (onay bekliyor)',
  startStatus: 'bekliyor',
  pay: 'Maaş',
  reportsTo: 'İsmail Karaca',
  seeks: ['Araştırma ve yazım', 'sunum ve tablo hazırlama', 'Scrum bilgisi'],
  mission: 'Seçenekli karar dokümanları hazırlarsınız. Raporları yazarsınız. 4 kişilik yazılım ekibinin çalışma yöntemine (Scrum) destek olursunuz. Bu role kimse alınmazsa dijital pazarlama uzmanı 1 Ocak 2027’de başlar.',
  tasks: [
    { task: 'Seçenekli karar dokümanı', measure: 'Her dokümanda 2, 3 ya da 4 seçenek olsun. Haftada en az 2 doküman hazırlayın. Dokümanlar perşembe 18:00 toplantısına hazır olsun.' },
    { task: 'Yazılım ekibine Scrum desteği', measure: 'Yazılım ekibinin günlük toplantısında (Daily Scrum) not tutun. Geliştirme dönemi (sprint) bitince 24 saat içinde dönem raporunu yazın.' },
    { task: 'Haftalık performans raporu', measure: 'Raporu her cumartesi 13:30’a kadar teslim edin.' },
    { task: 'Sürüm notları taslağı', measure: 'Her geliştirme dönemi sonunda sürüm notlarının taslağını yazın. Bu taslak dijital pazarlama uzmanının kaynağıdır.' },
  ],
  kpis: [
    { metric: 'Karar dokümanı', value: 'En az 2', unit: 'doküman', when: 'Her hafta, 9 Kasım’dan başlayarak' },
    { metric: 'Zamanında teslim edilen iş', value: 'En az %90', unit: '', when: 'Her ay ölçülür' },
    { metric: 'Geliştirme dönemi raporu', value: 'En geç 24', unit: 'saat içinde', when: 'Her geliştirme dönemi (sprint) bitince' },
    { metric: 'Haftalık performans raporu', value: '1', unit: 'rapor', when: 'Her cumartesi 13:30’a kadar' },
  ],
  ramp: { metric: 'Aylık teslim (doküman ve rapor)', values: [10, 12, 12] },
  plan: [
    { from: '2026-11-02', to: '2026-11-27', action: 'Şablonları hazırlar. Kazanç planı seçeneklerini ve ekip lideri seçim belgesini hazırlar', target: 'Teslim tarihleri 14 Kasım 2026 ve 27 Kasım 2026’dır', milestone: true },
    { from: '2026-11-30', to: '2026-12-30', action: '5 eğitim sunumunu (M1’den M5’e kadar) hazırlar. 60. gün raporunu hazırlar', target: '5 sunum 26 Aralık 2026’ya kadar biter. Rapor 30 Aralık 2026’ya kadar biter' },
    { from: '2027-01-04', to: '2027-01-30', action: 'Temsilci el kitabını yazar. 90. gün raporunu hazırlar. 1 Şubat 2027’de başlayan yeni çalışma düzeninin vardiya listesini hazırlar', target: 'Rapor 30 Ocak 2027’ye kadar biter', milestone: true },
  ],
  hours: { weekday: WEEKDAY, saturday: SATURDAY, weeklyNet: WEEKLY, fromFeb: FROM_FEB },
  daily: day([
    ['08:00–08:15', 'Sabah ekip toplantısı notları'],
    ['08:15–08:45', 'Yöneticiyle sabah görüşmesi'],
    ['08:45–09:30', 'Scrum toplantısına hazırlık'],
    ['09:30–09:45', 'Yazılım ekibinin günlük toplantısı (Daily Scrum)'],
    ['09:45–12:30', 'Araştırma'],
    ['12:30–13:30', 'Ara dinlenme'],
    ['13:30–15:30', 'Doküman ve sunum'],
    ['15:30–16:30', 'Yazılım ekibi desteği'],
    ['16:30–17:00', 'Organizatöre teslim'],
    ['17:00–18:30', 'Karar dokümanı'],
    ['18:30–19:30', 'Arşiv ve doğrulama'],
    ['19:30–20:00', 'Gün sonu özeti'],
  ]),
  saturday: day([
    ['08:00–08:30', 'Haftalık kapanış'],
    ['08:30–10:30', 'Performans raporu'],
    ['10:30–11:00', 'Ara dinlenme'],
    ['11:00–12:30', 'Karar günlüğü'],
    ['12:30–13:30', 'Gelecek haftanın planı'],
  ]),
};

/** Segika: masa başı pazarlama (CRM) rolünün kopyası, aynı yaklaşım; ürün SGK teşvik yazılımı. */
const segika: Role = {
  ...pazarlamaci,
  slug: 'segika',
  tree: 'Segika',
  title: 'Segika masa başı pazarlama (CRM)',
  shortTitle: 'Segika (CRM)',
  icon: 'shield',
  reportsTo: 'İsmail Karaca',
  mission:
    'Segika markalı SGK teşvik yazılımını telefon, WhatsApp ve e-postayla tanıtırsınız. İlgilenen kişilerle ürün tanıtımı (demo) randevusu ayarlarsınız. CRM’deki Segika hattını her gün güncellersiniz. Bu rol, masa başı pazarlama rolüyle aynı yöntemle çalışır.',
  tasks: [
    { task: 'Tanımadığınız işverenleri, mali müşavirleri ve insan kaynakları sorumlularını arama (soğuk arama)', measure: 'Günde 60 kişiyi arayın. Bunların 20’siyle nitelikli görüşme yapın.' },
    { task: 'Ürün tanıtımı (demo) randevusu', measure: 'Günde 3 randevu ayarlayın. Alınan randevuların en az %70’i yapılmalı.' },
    { task: 'İzin veren kişilere WhatsApp ve e-posta', measure: 'Günde 20 kişiye özel mesaj gönderin. Bu kişiler mesaj almaya izin vermiş olmalı. Haftada 1 bülten gönderin.' },
    { task: 'Veri ve CRM (Segika hattı)', measure: 'Her gün CRM’e 40 yeni müşteri adayı ekleyin. Her görüşmeyi aynı gün CRM’e yazın.' },
  ],
  kpis: [
    { metric: 'Arama', value: '60', unit: 'arama', when: 'Her gün, 16 Kasım’dan başlayarak' },
    { metric: 'Randevu', value: '18', unit: 'randevu', when: 'Her hafta, Ocak 2027’de' },
    { metric: 'Gerçekleşen randevu oranı', value: 'En az %70', unit: '', when: 'Aralık’tan başlayarak' },
    { metric: 'Yeni müşteri adayı (CRM)', value: '40', unit: 'aday', when: 'Her gün, 16 Kasım’dan başlayarak' },
  ],
  plan: [
    { from: '2026-11-02', to: '2026-11-28', action: 'Segika için telefon konuşma metninin ilk iki sürümünü yazar. İşverenlerden ve mali müşavirlerden hedef liste çıkarır. CRM’de Segika hattını hazırlar', target: 'Haftada 12 randevu' },
    { from: '2026-11-30', to: '2026-12-26', action: 'Mali müşavir ve insan kaynakları topluluklarıyla iletişime geçer. Tavsiye ister', target: 'Haftada 15 randevu alınır. Randevuların en az %70’i gerçekleşir' },
    { from: '2026-12-28', to: '2027-01-30', action: 'Tanıtımdan (demo) sonra müşteriyi takip eder. Arama rehberini yazar', target: 'Haftada 18 randevu', milestone: true },
  ],
};

/** Varsayılan parametrelerle rol listesi (Astro sayfa yolları ve sayfa başlıkları için). */
export const BASE_ROLES: Role[] = [dijital, pazarlamaci, saha, ekipLideri, organizator, asistan, segika];

/**
 * Rolleri parametrelerle kurar: kişi sayısı, başlangıç, ücret ve hedefler parametrelerden; plan tarihleri ve
 * metindeki tarihler takvim parametresine göre kayar (organizatör ve ekip lideri Aralık başlangıcına bağlı).
 */
export function makeRoles(p: Params, prog: Program): Role[] {
  const d1 = daysBetween(DEFAULT_PARAMS.startDate, p.startDate);
  const d2 = daysBetween(DEFAULT_PARAMS.decStartDate, p.decStartDate);
  const { salaries } = prog;
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const row = (role: RoleKey) => prog.targetPlan.find((t) => t.role === role)!;
  const person = (n: number) => `${n} kişi`;
  const start = longDate(p.startDate);
  const dec = longDate(p.decStartDate);
  const salaryText = (salary: number, multiplier?: number) => (multiplier ? `Aylık ${tl(salary)} net maaş alırsınız. Bu tutar net asgari ücretin ${num(multiplier)} katıdır.` : `Aylık ${tl(salary)} net maaş alırsınız.`);

  const shift = (r: Role, delta: number): Role => ({
    ...r,
    mission: shiftText(r.mission, delta),
    reportsTo: shiftText(r.reportsTo, d2),
    tasks: r.tasks.map((t) => ({ task: shiftText(t.task, delta), measure: shiftText(t.measure, delta) })),
    kpis: r.kpis.map((k) => ({ ...k, when: shiftText(k.when, delta) })),
    plan: r.plan.map((x) => ({ ...x, from: addDays(x.from, delta), to: addDays(x.to, delta), action: shiftText(x.action, delta), target: shiftText(x.target, delta) })),
  });
  const setKpi = (r: Role, metric: string, value: string): Role => ({ ...r, kpis: r.kpis.map((k) => (k.metric === metric ? { ...k, value } : k)) });

  const sahaRow = row('saha-uzmani');
  const mlmRow = row('ekip-lideri');
  const orgRow = row('organizator');
  const masaRow = row('pazarlamaci');

  let sahaRole: Role = {
    ...shift(saha, d1),
    count: `${person(p.sahaCount + p.sahaDecCount)}. ${p.sahaCount} kişi ${shortDate(p.startDate)}, ${p.sahaDecCount} kişi ${shortDate(p.decStartDate)} tarihinde başlar. Ekip sonra temsilci ağıyla büyür.`,
    start: `${start}. Ek saha personeli ${dec} tarihinde başlar.`,
    pay: `Aylık ${tl(p.sahaSalary)} maaş alırsınız. Aylık satış kotanız ${tl(prog.quota)}. Kotayı doldurduktan sonra her satış için ${tl(p.commission)} prim alırsınız.`,
    ramp: { ...saha.ramp, values: sahaRow.kayit, second: { metric: saha.ramp.second!.metric, values: sahaRow.aktif } },
  };
  sahaRole = setKpi(setKpi(sahaRole, 'Kayıt (ekip)', int(sum(sahaRow.kayit))), 'Yeni aktif satıcı (ekip)', int(sum(sahaRow.aktif)));
  sahaRole.plan = sahaRole.plan.map((x, i) => ({
    ...x,
    target: [`${sahaRow.kayit[i]} kayıt ve ${sahaRow.aktif[i]} aktif satıcı`, i === 1 ? '. Aylık elde tutma en az %70 olur' : ''].join(''),
  }));

  let leadRole: Role = {
    ...shift(ekipLideri, d2),
    start: dec,
    pay: `Aylık ${tl(salaries.lead)} maaş alırsınız. Saha maaşına ${tl(p.leadUplift)} liderlik farkı eklenir. Ekibin her satışından ayrıca ${tl(p.leadTeamShare)} alırsınız. Kendi satışlarınızda saha ekibinin prim kuralı geçerlidir. Aylık satış kotanız ${tl(salaries.lead * p.costFactor)}. Kotayı doldurduktan sonra her satış için ${tl(p.commission)} prim alırsınız.`,
  };
  leadRole = setKpi(leadRole, 'Ağdan aktif satıcı', `Yaklaşık ${int(sum(mlmRow.aktif))}`);

  const orgMonths = [p.decStartDate, nextMonth(p.decStartDate), nextMonth(nextMonth(p.decStartDate))].map(monthName);
  let orgRole: Role = {
    ...shift(organizator, d2),
    count: person(p.organizatorCount),
    start: dec,
    pay: salaryText(salaries.organizator),
    ramp: { ...organizator.ramp, months: orgMonths },
  };
  orgRole = setKpi(orgRole, 'Eğitimden kayıt', `Aralık’ta ${Math.round(orgRow.kayit[1] / 4)}, Ocak’ta ${Math.round(orgRow.kayit[2] / 4)}`);
  orgRole.tasks = orgRole.tasks.map((t) =>
    t.task.startsWith('Eğitimden kayıt') ? { ...t, measure: `90 günlük plan süresince eğitimden yaklaşık ${int(sum(orgRow.kayit))} kayıt gelir. Aynı sürede yaklaşık ${int(sum(orgRow.aktif))} aktif satıcı kazanılır.` } : t,
  );

  return [
    {
      ...shift(dijital, d1),
      count: person(p.dijitalCount),
      start: `${start}. Asistan işe alınmazsa ${longDate(p.dijitalAltDate)}.`,
      pay: salaryText(salaries.dijital, p.dijitalMultiplier),
    },
    setKpi({ ...shift(pazarlamaci, d1), count: person(p.masaCount), start, pay: salaryText(salaries.masa) }, 'Uzaktan kazanılan aktif satıcı', int(sum(masaRow.aktif))),
    sahaRole,
    leadRole,
    orgRole,
    { ...shift(asistan, d1), count: person(p.asistanCount), start: `${start}. Bu tarih henüz onay bekliyor.`, pay: salaryText(salaries.asistan, p.asistanMultiplier) },
    { ...shift(segika, d1), count: person(p.segikaCount), start, pay: salaryText(salaries.segika) },
  ];
}

export function getRole(roles: Role[], slug: string): Role {
  const role = roles.find((r) => r.slug === slug);
  if (!role) throw new Error(`Bilinmeyen rol: ${slug}`);
  return role;
}
