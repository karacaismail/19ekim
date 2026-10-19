/**
 * Organizatörün satıcı eğitimleri (her iş günü 17:00–18:00).
 * Modül içerikleri iStoc’un herkese açık satıcı sayfasındaki özelliklerden (19 Ekim 2026) derlendi.
 * Not: Tahtadaki “Sıfır noktası → 501” basamakları satıcı eğitimi değil, dijital pazarlamanın
 * içerik otomasyonu olgunluğudur (bkz. digital.ts).
 */
export const modules = [
  {
    code: 'M1',
    title: 'Tanışma ve başvuru',
    goal: 'Satıcı başvurusunu tamamlar.',
    content: ['Küresel B2B alıcıya aracısız ulaşım', '%0 satış komisyonu, 14 gün ücretsiz deneme', 'Başvuru: vergi numarası, üretim kategorisi, iletişim (yaklaşık 4 dakika)', 'Paket karşılaştırması: Basic, Platinium, Enterprise'],
    homework: 'Başvuru tamamlandı; ilk 5 ürünün listesi hazır.',
  },
  {
    code: 'M2',
    title: 'Toplu ürün yükleme',
    goal: 'Ürünlerini hızlı ve toplu yükler.',
    content: ['Toplu ürün yükleme (CSV)', 'AI çeviri ve çoklu dil', 'Varyant ve özellik setleri', 'Stok ve fiyat güncelleme'],
    homework: 'İlk 20 ürün yüklendi.',
  },
  {
    code: 'M3',
    title: 'Vitrin ve görünürlük',
    goal: 'Vitrini ve ürün görselleriyle güven verir.',
    content: ['Vitrin düzeni', 'Telefonla ürün fotoğrafı', 'Ürün açıklaması yazımı', 'Video ve 360° medya'],
    homework: 'Vitrin düzenlendi; 10 ürünün görseli yenilendi.',
  },
  {
    code: 'M4',
    title: 'Teklif ve satış',
    goal: 'Alıcı talebini siparişe çevirir.',
    content: ['Fiyat teklifi talebi (RFQ) yanıtlama', 'Numune satışı', 'Güvenli ödeme ve sipariş korumaları', 'Mesajlaşma, sipariş ve kargo'],
    homework: 'İlk teklif yanıtı verildi.',
  },
  {
    code: 'M5',
    title: 'Büyüme',
    goal: 'Görünürlüğünü ve satışını ölçerek büyütür.',
    content: ['Arama önceliği ve öne çıkan listeleme', 'Anahtar kelime reklamı', 'Analitik, raporlar ve CRM modülü', 'Pazarlama çözümleri paketleri (30K / 90K / 500K; içerik karar bekliyor)'],
    homework: '90 günlük büyüme planı.',
  },
  {
    code: 'Mentor',
    title: 'Mentor programı',
    goal: 'Başka satıcılara örnek olur; temsilci adayı olur.',
    content: ['API ve ERP/muhasebe entegrasyonu', 'Alt alan adı ve özel tema', 'Ekip kullanıcıları ve rol yönetimi', 'Bir satıcıya eşlik etme'],
    homework: 'Bir satıcıya mentorluk yapıldı.',
  },
];

export const weeklySchedule = [
  { day: 'Pazartesi', session: 'M1 Tanışma ve başvuru', format: 'Açık eğitim', capacity: '8–12' },
  { day: 'Salı', session: 'M2 Toplu ürün yükleme', format: '15 kişilik organizasyon (A segmenti, davetli) + saha vakası', capacity: '15' },
  { day: 'Çarşamba', session: 'M3 Vitrin ve görünürlük', format: 'Açık eğitim', capacity: '8–12' },
  { day: 'Perşembe', session: 'M4 Teklif ve satış', format: '15 kişilik organizasyon (B segmenti, kurumsal ortaklı) + saha vakası', capacity: '15' },
  { day: 'Cuma', session: 'M5 Büyüme / Mentor programı', format: 'Açık eğitim; tek haftalar M5, çift haftalar mentor', capacity: '8–12' },
  { day: 'Cumartesi', session: 'Açık klinik (11:30–13:30)', format: 'Birebir mağaza kurulum desteği', capacity: 'Randevulu ve randevusuz' },
];

export const sessionFlow = [
  { time: '16:30–17:00', part: 'Karşılama', detail: 'QR ile kayıt; iki soruluk ön bilgi tespiti.' },
  { time: '17:00–17:05', part: 'Açılış', detail: 'Bugünün hedefi ve oturum sonunda elde edilecek çıktı.' },
  { time: '17:05–17:25', part: 'Anlatım', detail: 'Modülün 3–4 ana konusu; gerçek satıcı örneği.' },
  { time: '17:25–17:50', part: 'Canlı uygulama', detail: 'Herkes kendi telefonunda veya bilgisayarında uygular.' },
  { time: '17:50–18:00', part: 'Ödev ve davet', detail: 'Modül ödevi; bir sonraki modüle davet; memnuniyet sorusu.' },
  { time: '18:00–18:45', part: 'Birebir destek', detail: 'Kurulum desteği; kayıtsız katılımcılar için saha randevusu.' },
];

/** Organizatör ilk hafta İstoç’un gerçek blok ve sektör haritasıyla doğrular. */
export const segments = [
  'Tekstil ve konfeksiyon',
  'Ayakkabı ve çanta',
  'Hırdavat ve yapı malzemeleri',
  'Elektrik ve aydınlatma',
  'Otomotiv yedek parça',
  'Ev tekstili ve mobilya',
  'Mutfak ve züccaciye',
  'Kırtasiye ve oyuncak',
];

export const partnerTypes = [
  { type: 'Odalar', example: 'Ticaret ve sanayi odaları, meslek odaları', offer: 'Üyelere ortak “dijital ihracat” eğitimi', ask: 'Üye duyurusu ve salon desteği' },
  { type: 'Dernekler', example: 'İstoç esnaf ve sektör dernekleri', offer: 'Derneğe özel 15 kişilik oturum', ask: 'Üye listesine duyuru, toplantı günü' },
  { type: 'Sektörel topluluklar', example: 'Facebook ve WhatsApp toptancı grupları, sektör forumları', offer: 'Tam makale, kısa eğitim videosu, ücretsiz oturum', ask: 'Yönetici izniyle paylaşım' },
];
