import type { RoleKey, Workflow } from './types';

export const gtmFunnel: Workflow = {
  id: 'gtm-hunisi',
  title: 'GTM hunisi: talep → lead → satış',
  desc: 'Tahtadaki “GTM funnel” akışının uçtan uca hâli. Her adımın sahibi, çıktısı ve süresi bellidir; CRM aşamaları bu adımları izler.',
  steps: [
    { title: 'Data oluşturma', owners: ['pazarlamaci'], detail: 'İstoç blok/ada, sektör, karar verici ve iletişim; kaynak notu zorunlu.', output: 'CRM: Aday' },
    { title: 'İlk temas', owners: ['pazarlamaci', 'organizator', 'dijital-pazarlama'], detail: 'Soğuk arama, kişiye özel WhatsApp (günde 20), e-posta, sosyal medya grupları, organizatörün yüz yüze davetleri ve video içeriklerden gelen mesajlar.', output: 'CRM: Talep' },
    { title: 'Nitelendirme', owners: ['pazarlamaci'], detail: 'Karar verici, ürün kategorisi, üretici veya toptancı, ihracat ilgisi.', output: 'CRM: Lead', sla: 'Talepten itibaren 24 saat' },
    { title: 'Randevu', owners: ['pazarlamaci', 'saha-uzmani'], detail: 'Saha takvimine 30 dakikalık randevu; 1 gün önce teyit.', output: 'CRM: Randevu' },
    { title: 'Ziyaret ve demo', owners: ['saha-uzmani'], detail: '20 dakikalık demo; abonelik seçenekleri; 14 gün ücretsiz deneme.', output: 'CRM: Teklif / Demo' },
    { title: 'Başvuru', owners: ['saha-uzmani'], detail: 'Yerinde başvuru: vergi numarası, üretim kategorisi, iletişim (yaklaşık 4 dakika).', output: 'CRM: Başvuru' },
    { title: 'Müşteri onboarding’i', owners: ['saha-uzmani', 'organizator'], detail: 'İlk ürünler, M1 eğitim kaydı, 3 alıcı daveti.', output: 'CRM: Onboard edildi', sla: '48 saat' },
    { title: 'Eğitim ve aktivasyon', owners: ['organizator'], detail: 'M1 → M5 modülleri; Cumartesi kliniği.', output: 'CRM: Aktif satıcı', sla: '30 gün' },
    { title: 'Abonelik ve yenileme', owners: ['saha-uzmani', 'ekip-lideri'], detail: '14. günde aylık abonelik (399 €) veya yıllık peşin; her ay yenileme; uygun satıcıya pazarlama çözümü paketi (30K / 90K / 500K).', output: 'CRM: Ücretli müşteri (edinme)' },
    { title: 'Değer ve tavsiye', owners: ['ekip-lideri', 'organizator'], detail: '30. gün değer toplantısı; tavsiye istemi; mentor programı mezunu → temsilci adayı.', output: 'Tavsiye, temsilci adayı' },
  ],
};

export const crmStages = [
  { stage: 'Aday', entry: 'İletişim + sektör + kaynak notu', owner: 'Pazarlamacı', sla: 'İlk temas 5 iş günü içinde', next: 'Talep veya kayıp' },
  { stage: 'Talep', entry: 'İlgi beyanı (telefon, mesaj, etkinlik, sosyal medya)', owner: 'Pazarlamacı', sla: '24 saatte nitelendirme', next: 'Lead' },
  { stage: 'Lead', entry: 'Karar verici + kategori + ilgi doğrulandı', owner: 'Pazarlamacı', sla: '24 saatte randevu teklifi', next: 'Randevu' },
  { stage: 'Randevu', entry: 'Tarih, saat, adres teyitli', owner: 'Pazarlamacı → Saha uzmanı', sla: '1 gün önce teyit', next: 'Teklif / Demo' },
  { stage: 'Teklif / Demo', entry: 'Ziyaret yapıldı', owner: 'Saha uzmanı', sla: 'Aynı gün kayıt', next: 'Kayıt (üye satıcı)' },
  { stage: 'Kayıt (üye satıcı)', entry: 'Satıcı başvurusu tamamlandı; ödeme yok', owner: 'Saha uzmanı', sla: '48 saatte müşteri onboarding’i', next: 'Onboard edildi' },
  { stage: 'Onboard edildi', entry: 'İlk ürünler + M1 eğitim kaydı + alıcı daveti', owner: 'Saha uzmanı, Organizatör', sla: '7 gün içinde eğitime katılım', next: 'Kullanımda' },
  { stage: 'Kullanımda', entry: 'Ürün güncelliyor veya teklif yanıtlıyor (eğitimli üye satıcı)', owner: 'Organizatör', sla: '14 günlük deneme içinde', next: 'Aktif satıcı (ilk ödeme)' },
  { stage: 'Aktif satıcı (ilk ödeme)', entry: 'Aylık abonelik (399 €) veya yıllık peşin tahsil edildi', owner: 'Saha ekibi, Ekip lideri', sla: '14. gün görüşmesi', next: 'Yenileme' },
  { stage: 'Yenileme', entry: '2. veya 3. ay ödemesi alındı', owner: 'Saha ekibi, Organizatör', sla: 'Ödemeden 5 gün önce kontrol', next: 'Değer toplantısı; pazarlama çözümü teklifi' },
  { stage: 'Kayıp', entry: 'Kayıp nedeni kodu zorunlu', owner: 'Kaydı açan kişi', sla: 'Aynı gün', next: '60 gün sonra yeniden temas' },
];

export const handoffRules = [
  { from: 'Pazarlamacı', to: 'Saha uzmanı', what: 'Randevu', rule: 'Randevu notu: blok/ada/no, karar verici, ürün grubu, itirazlar.', sla: 'Randevu oluşturulduğu anda CRM’de' },
  { from: 'Saha uzmanı', to: 'Pazarlamacı', what: 'Çat kapı ilgisi', rule: 'Yerinde kapanmayan ilgili satıcı için randevu notu.', sla: 'Aynı gün' },
  { from: 'Saha uzmanı', to: 'Organizatör', what: 'Yeni satıcı', rule: 'M1 tanışma oturumuna kayıt.', sla: '48 saat' },
  { from: 'Organizatör', to: 'Saha uzmanı', what: 'Kayıtsız katılımcı', rule: 'Eğitimde ilgi gösteren kayıtsız satıcı için randevu.', sla: '48 saat' },
  { from: 'Organizatör', to: 'Asistan', what: 'Ürün sorunu', rule: 'Eğitimde görülen hata veya ihtiyaç; asistan backlog’a taşır.', sla: '24 saat' },
  { from: 'Asistan', to: 'Dijital pazarlama', what: 'Changelog taslağı', rule: 'Sprint sonunda sürüm notları; video içerik hattının kaynağı.', sla: 'Review’dan sonra 24 saat' },
  { from: 'Saha uzmanı ve organizatör', to: 'Dijital pazarlama', what: 'Ham görüntü', rule: 'Yazılı izinli satıcı röportajı ve eğitim kesiti.', sla: 'Aynı gün' },
  { from: 'Dijital pazarlama', to: 'Pazarlamacı', what: 'Sosyal medya talebi', rule: 'Yorum ve mesajdan gelen ilgili kişi CRM’e talep olarak düşer.', sla: '24 saatte arama' },
  { from: 'Ekip', to: 'Ekip lideri / Yönetici', what: 'Eskalasyon', rule: 'Müşteri şikâyeti, tahsilat sorunu, yetki dışı talep.', sla: 'Aynı gün' },
];

export interface RaciRow {
  process: string;
  cells: Partial<Record<RoleKey, 'S' | 'O' | 'D' | 'B'>>;
}

/** S: sorumlu (işi yapan) · O: onaylayan · D: danışılan · B: bilgilendirilen */
export const raciColumns: RoleKey[] = ['yonetici', 'asistan', 'ekip-lideri', 'pazarlamaci', 'saha-uzmani', 'organizator', 'dijital-pazarlama', 'yazilim'];

export const raci: RaciRow[] = [
  { process: 'Data oluşturma', cells: { yonetici: 'O', 'ekip-lideri': 'B', pazarlamaci: 'S', organizator: 'D', 'saha-uzmani': 'B' } },
  { process: 'Soğuk arama ve randevu', cells: { yonetici: 'B', 'ekip-lideri': 'O', pazarlamaci: 'S', 'saha-uzmani': 'B' } },
  { process: 'Saha ziyareti ve kapanış', cells: { yonetici: 'B', 'ekip-lideri': 'O', pazarlamaci: 'D', 'saha-uzmani': 'S' } },
  { process: 'Müşteri onboarding’i (48 saat)', cells: { 'ekip-lideri': 'O', pazarlamaci: 'B', 'saha-uzmani': 'S', organizator: 'D' } },
  { process: 'Eğitim ve organizasyon', cells: { yonetici: 'O', asistan: 'D', 'ekip-lideri': 'B', pazarlamaci: 'D', organizator: 'S' } },
  { process: 'Kurumsal iş birliği', cells: { yonetici: 'O', asistan: 'D', organizator: 'S' } },
  { process: 'Karar dokümanları', cells: { yonetici: 'O', asistan: 'S', 'ekip-lideri': 'D' } },
  { process: 'Scrum ritimleri', cells: { yonetici: 'O', asistan: 'S', yazilim: 'S' } },
  { process: 'Changelog → video içerik', cells: { yonetici: 'B', asistan: 'D', organizator: 'B', pazarlamaci: 'B', 'dijital-pazarlama': 'S', yazilim: 'D' } },
  { process: 'Yapay zekâ video üretimi ve otomatik paylaşım', cells: { yonetici: 'O', asistan: 'D', 'saha-uzmani': 'D', organizator: 'D', 'dijital-pazarlama': 'S' } },
  { process: 'Sosyal medya talebinin devri', cells: { 'ekip-lideri': 'B', pazarlamaci: 'S', 'dijital-pazarlama': 'S' } },
  { process: 'KPI raporu', cells: { yonetici: 'O', asistan: 'S', 'ekip-lideri': 'S', pazarlamaci: 'D', 'saha-uzmani': 'D', organizator: 'D' } },
  { process: 'Temsilci ağı', cells: { yonetici: 'O', asistan: 'D', 'ekip-lideri': 'S', organizator: 'D' } },
];

export const onboardingCheck: Workflow = {
  id: 'onboarding-kontrolu',
  title: 'Müşteri onboarding’i: “Müşteri onboard edildi mi?”',
  desc: 'Personelin kazandırdığı satıcıyı platforma alıştırma süreci. Personelin kendi işe alışmasından (personel onboarding’i) ayrıdır.',
  steps: [
    { title: 'Kayıt tamamlandı', owners: ['saha-uzmani'], detail: 'Satıcı CRM’de “Kayıt (pasif satıcı)” aşamasına geçer; müşteri onboarding listesine düşer.' },
    {
      title: '48. saat kontrolü',
      kind: 'decision',
      owners: ['saha-uzmani', 'pazarlamaci'],
      detail: 'İlk ürünler yüklendi mi, M1 eğitim kaydı var mı?',
      branches: [
        { when: 'Evet', then: '“Onboard edildi”; 30. gün değer toplantısı takvime alınır (toplantı almak).' },
        { when: 'Hayır', then: '24 saat içinde arama + kurulum desteği ziyareti.' },
      ],
    },
    {
      title: '7. gün kontrolü',
      kind: 'decision',
      owners: ['organizator'],
      detail: 'Eğitime katıldı mı, alıcı daveti yapıldı mı?',
      branches: [
        { when: 'Evet', then: 'Modül ilerlemesi izlenir (M3 → M4).' },
        { when: 'Hayır', then: 'Cumartesi kliniğine davet; sorun ürünle ilgiliyse asistan aracılığıyla backlog.' },
      ],
    },
    { title: 'Müşteri istihbaratı', owners: ['pazarlamaci'], detail: 'Ürün grubu, ihracat durumu, kullandığı platformlar, büyüme planı CRM’e işlenir.', output: 'Derinleştirilmiş profil' },
    { title: '14. gün: abonelik', owners: ['saha-uzmani'], detail: 'Aylık abonelik (399 €) veya yıllık peşin görüşmesi ve tahsilat.', output: 'Aktif satıcı' },
  ],
};

export const employeeOnboarding: Workflow = {
  id: 'personel-onboardingi',
  title: 'Personel onboarding’i: işe başlama',
  desc: 'İşe alınan kişinin ilk iki haftası ve deneme süresi. Personelin müşteriyi platforma alıştırması (müşteri onboarding’i) ayrı bir süreçtir.',
  steps: [
    { title: 'Teklif ve kabul', owners: ['yonetici'], detail: 'Ücret, prim, kota ve fazla çalışma koşulları yazılı teklifle.' },
    { title: 'Sözleşme ve SGK', owners: ['yonetici'], detail: 'İş sözleşmesi, fazla çalışma için yazılı onay, SGK işe giriş bildirimi.', sla: 'İşe başlamadan önce' },
    { title: 'Gereksinimler', owners: ['yonetici', 'asistan'], detail: 'Telefon hattı, WhatsApp Business, CRM, e-posta, demo hesabı, tablet; ofiste masa ve erişim.', output: 'Hesaplar ve ekipman hazır', sla: 'Başlangıçtan 1 gün önce' },
    { title: 'Oryantasyon (1–2. gün)', owners: ['yonetici'], detail: 'iStoc ürünü, abonelik ve pazarlama çözümü paketleri, ofis ve ekip, CRM aşamaları, ticari ileti ve KVKK kuralları.' },
    { title: 'Gölge çalışma (3. gün)', owners: ['saha-uzmani', 'pazarlamaci'], detail: 'Deneyimli bir ekip üyesinin gününe eşlik.' },
    { title: 'Kademeli hedef', owners: ['yonetici', 'ekip-lideri'], detail: '1. hafta hedeflerin %50’si, 2. hafta %75’i, 3. haftadan itibaren %100’ü.' },
    {
      title: 'Değerlendirme',
      kind: 'decision',
      owners: ['yonetici', 'ekip-lideri'],
      detail: '2. hafta sonunda ve 2 aylık deneme süresi bitmeden.',
      branches: [
        { when: 'Uygun', then: 'Kalıcı; 90 günlük plan devam eder.' },
        { when: 'Gelişiyor', then: 'Yazılı gelişim planı ve haftalık koçluk.' },
        { when: 'Uygun değil', then: 'Deneme süresi içinde yasal sürece uygun sonlandırma.' },
      ],
    },
  ],
};

export const changelogFlow: Workflow = {
  id: 'changelog-icerik',
  title: 'Changelog → video içerik',
  desc: 'Tahtadaki “content ← changelog”: yazılım ekibinin sürüm notları, dijital pazarlama uzmanının yapay zekâ hattında kısa videolara dönüşür ve otomatik paylaşılır.',
  steps: [
    { title: 'Sürüm notu', owners: ['yazilim', 'asistan'], detail: 'Sprint Review’da gösterilen işler; asistan changelog taslağını yazar.', sla: 'Review’dan sonra 24 saat' },
    { title: 'Senaryo', owners: ['dijital-pazarlama'], detail: 'Yapay zekâ ile “ne değişti, satıcıya ne kazandırır” senaryosu ve 3 kanca.' },
    { title: 'Video üretimi', owners: ['dijital-pazarlama'], detail: 'Ekran kaydı, seslendirme, şablon kurgu, altyazı; gerekirse İngilizce.', output: 'Dikey kısa video' },
    { title: 'Doğruluk kontrolü', owners: ['dijital-pazarlama', 'asistan'], detail: 'Özellik adı, kapsam ve fiyat changelog ile karşılaştırılır; yanlış bilgi yayına çıkmaz.' },
    { title: 'Otomatik paylaşım', owners: ['dijital-pazarlama'], detail: 'Resmî planlayıcı ile kanallara zamanlı yayın; organizatöre eğitimde kullanması için kesit.', output: 'Yayın', sla: 'Sprint sonundan 48 saat' },
    { title: 'Geri bildirim', owners: ['dijital-pazarlama', 'pazarlamaci', 'yazilim'], detail: 'İlgilenenler CRM’e talep; ürün soruları ve hatalar backlog’a.', output: 'Talep, backlog maddesi' },
  ],
};

export const escalation: Workflow = {
  id: 'eskalasyon',
  title: 'Sorun ve eskalasyon',
  desc: 'Sahada çözülemeyen konu aynı gün doğru kişiye ulaşır.',
  steps: [
    { title: 'Sorunu kaydet', owners: ['pazarlamaci', 'saha-uzmani', 'organizator'], detail: 'CRM notu: müşteri, sorun, aciliyet.' },
    {
      title: 'Türüne göre yönlendir',
      kind: 'decision',
      owners: ['ekip-lideri'],
      detail: '1 Aralık’a kadar bu adımı yönetici yürütür.',
      branches: [
        { when: 'Satış veya müşteri ilişkisi', then: 'Ekip lideri aynı gün çözer.' },
        { when: 'Ürün hatası veya ihtiyaç', then: 'Asistan backlog’a ekler; yazılım ekibi sprintte ele alır.' },
        { when: 'Fiyat, indirim veya yetki dışı harcama', then: 'Yöneticiye; sınır aşılırsa yatırımcıya.' },
      ],
    },
    { title: 'Kapat ve bilgilendir', owners: ['ekip-lideri'], detail: 'Müşteriye dönüş ve CRM’de kapanış notu.', sla: 'En geç 2 iş günü' },
  ],
};
