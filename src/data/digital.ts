import type { Role } from './types';

/**
 * Dijital pazarlama uzmanı: yapay zekâ otomasyonlarıyla video ağırlıklı içerik ve otomatik paylaşım.
 * Tahtadaki “Sıfır noktası → 101 otomasyon → 201 Like → 301 → 401 → 501 → hakkını vermek;
 * content ← changelog” sütunu bu rolün içerik otomasyonu olgunluk basamaklarıdır.
 * Planlama panosu: “1–2 ay sonra dijital pazarlama personeli, 1 kişi, kota/prim”.
 */
export const dijitalPazarlama: Role = {
  slug: 'dijital-pazarlama',
  title: 'Dijital pazarlama uzmanı',
  shortTitle: 'Dijital pazarlama',
  icon: 'video',
  boardNote:
    'Tahtada: “Sıfır noktası → 101 otomasyon → 201 Like → 301 → 401 → 501 → hakkını vermek; content ← changelog”. Kararınız: 1 kişi; yapay zekâ otomasyonlarıyla video ağırlıklı içerik üretimi ve otomatik paylaşım.',
  count: '1 kişi',
  start: '1 Kasım 2026 (asistan yoksa 1 Ocak 2027)',
  startStatus: 'karar',
  step: 'İstihdam takvimi: 5. sıra',
  employment: 'Maaşlı, tam zamanlı; kota ve prim (panodaki not); fazla çalışma ücreti',
  reportsTo: 'Strateji ve Operasyon Yöneticisi',
  worksWith:
    'Yazılım ekibi ve asistan (changelog), Pazarlamacı (sosyal medyadan gelen talepler), Saha uzmanı ve organizatör (saha görüntüleri, eğitim kesitleri)',
  mission:
    'Yapay zekâ otomasyonlarıyla video ağırlıklı içerik üretir ve sosyal medyada otomatik paylaşır. İçerik kaynağı ürün changelog’u, saha vakaları ve satıcı hikâyeleridir. Amaç, iStoc’u İstoç satıcılarına ve küresel alıcılara görünür kılmak ve masa başı pazarlamaya nitelikli talep akıtmaktır.',
  summary: 'Yapay zekâ ile günde 3 kısa video ve otomatik paylaşım; içerik olgunluğu Sıfır Noktası’ndan 501’e.',
  responsibilities: [
    'İçerik hattı: kaynak → senaryo (yapay zekâ) → seslendirme ve görsel → şablon kurgu → altyazı → insan kontrolü → zamanlanmış otomatik paylaşım.',
    'Video ağırlıklı üretim: dikey kısa video (Reels, Shorts, TikTok) ana format; LinkedIn ve Facebook için uyarlama.',
    'Changelog → içerik: her sprint sonunda yeni özellikleri “ne değişti, satıcıya ne kazandırır” videolarına çevirir.',
    'Saha içerikleri: saha uzmanı ve organizatörün çektiği izinli görüntülerden başarı hikâyesi ve eğitim kesitleri.',
    'Otomasyon: paylaşım takvimi, çok dilli altyazı (küresel alıcılar), yorum ve mesajların CRM’e talep olarak düşmesi.',
    'Ölçüm: izlenme, izlenme süresi, etkileşim, profil ziyareti ve talep sayısı; haftalık rapor.',
    'Meta işe alım reklamları: personel ve bağımsız satış temsilcisi bulmak için video kreatifler ve kampanya yönetimi; haftalık 5.000 ₺ bütçe, sürekli. Dijital pazarlama uzmanı gelene kadar sorumlu İsmail Karaca’dır; uzman gelince devralır.',
    'Doğruluk ve marka: yapay zekâ çıktısı yayından önce insan kontrolünden geçer. Müşteri edinme için ücretli kampanya ayrı bir yatırımcı kararıdır.',
  ],
  qualifications: {
    source: 'Kararınızdan',
    fromSource: ['Yapay zekâ otomasyonları', 'Video ağırlıklı içerik', 'Otomatik sosyal medya paylaşımı'],
    required: [
      'Dikey kısa video kurgusu ve “ilk 3 saniye” (hook) bilgisi',
      'Üretken yapay zekâ araçlarıyla metin, ses ve görsel üretimi',
      'Otomasyon platformlarıyla akış kurabilme (ör. n8n, Make, Zapier)',
      'Platform kuralları ve algoritma bilgisi; ölçüm ve raporlama',
    ],
    plus: [
      'İngilizce ve çok dilli içerik',
      'B2B veya e-ticaret içerik deneyimi',
      'Telif ve kişisel veri kurallarına hâkimiyet',
    ],
  },
  tools: [
    'Yapay zekâ metin asistanı (senaryo, başlık, açıklama)',
    'Yapay zekâ seslendirme ve otomatik altyazı',
    'Şablon tabanlı video kurgu aracı',
    'Otomasyon platformu (ör. n8n, Make veya Zapier)',
    'Resmî paylaşım planlayıcısı (ör. Meta Business Suite) veya platform API’leri',
    'Saha çekimi: telefon, gimbal, yaka mikrofonu, ışık',
    'Changelog ve CRM erişimi',
  ],
  hours: {
    weekday: '08:00–20:00 · 60 dk ara dinlenme · 11 saat net',
    saturday: '08:00–13:30 · 30 dk ara dinlenme · 5 saat net',
    weeklyNet: '60 saat net (45 normal + 15 fazla çalışma)',
  },
  daily: [
    { time: '08:00–08:15', block: 'Ekip stand-up', work: 'Dünün performansı, bugünün yayınları.', output: 'Günün yayın listesi' },
    { time: '08:15–09:00', block: 'Performans okuması', work: 'Dünkü paylaşımlar: izlenme, izlenme süresi, etkileşim, talep.', output: '3 içgörü' },
    { time: '09:00–10:30', block: 'Senaryo üretimi', work: 'Yapay zekâ ile 3 kısa video senaryosu ve kanca varyasyonları; kaynak: changelog, saha vakası, satıcı hikâyesi.', output: '3 senaryo' },
    { time: '10:30–12:30', block: 'Video üretimi', work: 'Seslendirme, görsel veya ham çekim, şablon kurgu, altyazı.', output: '3 video taslağı' },
    { time: '12:30–13:30', block: 'Ara dinlenme', work: 'Çalışma süresinden sayılmaz.', output: '—', tone: 'break' },
    { time: '13:30–14:30', block: 'Kalite kontrolü', work: 'Ürün bilgisi ve fiyat doğruluğu, marka kiti, telif, kişi izni; gerekenler yönetici onayına.', output: 'Onaylı videolar' },
    { time: '14:30–15:30', block: 'Otomatik paylaşım kurgusu', work: 'Zamanlama, platform uyarlaması, çok dilli altyazı, açıklama ve etiketler.', output: '3 günlük yayın kuyruğu' },
    { time: '15:30–17:00', block: 'Otomasyon geliştirme', work: 'İçerik hattında bir adımı otomatikleştirme veya iyileştirme (olgunluk basamağına göre).', output: '1 iyileştirme' },
    { time: '17:00–18:00', block: 'Saha çekimi', work: 'Organizatörün oturumundan kesit, izinli satıcı röportajı.', output: 'Ham görüntü', tone: 'milestone' },
    { time: '18:00–19:00', block: 'Etkileşim ve talep devri', work: 'Yorum ve mesajlara dönüş; ilgilenenler CRM’e talep olarak pazarlamacıya.', output: 'Talepler CRM’de' },
    { time: '19:00–19:45', block: 'İçerik takvimi', work: 'Yarın ve haftanın takvimi; yeni changelog maddeleri.', output: 'Güncel takvim' },
    { time: '19:45–20:00', block: 'Gün sonu raporu', work: 'Yayınlar, performans, devredilen talepler.', output: 'Gün sonu raporu' },
  ],
  saturday: [
    { time: '08:00–08:30', block: 'Haftalık kapanış toplantısı', work: 'Haftanın içerik performansı ve talepleri.', output: 'Haftalık hedef' },
    { time: '08:30–10:30', block: 'Haftalık performans raporu', work: 'En iyi ve en zayıf 3 video; kanca ve format dersleri.', output: 'Haftalık rapor' },
    { time: '10:30–11:00', block: 'Ara dinlenme', work: 'Çalışma süresinden sayılmaz.', output: '—', tone: 'break' },
    { time: '11:00–12:30', block: 'Toplu üretim', work: 'Haftanın serisi (ör. “Bir dakikada iStoc”) için toplu senaryo ve video.', output: 'Seri bölümleri' },
    { time: '12:30–13:30', block: 'Gelecek hafta', work: 'İçerik takvimi ve otomatik paylaşım kuyruğu.', output: 'Dolu kuyruk' },
  ],
  weekly: [
    { day: 'Pazartesi', focus: 'Seri planı', work: 'Haftanın 3 serisi: ürün (changelog), saha, eğitim.', output: 'İçerik takvimi' },
    { day: 'Salı', focus: 'Saha günü', work: '17:00 15 kişilik organizasyondan kesitler; satıcı röportajı.', output: 'Ham görüntü' },
    { day: 'Çarşamba', focus: 'Otomasyon ve Meta günü', work: 'İçerik hattında bir adım daha otomatik; Meta reklam kreatiflerinin yenilenmesi ve bütçe kontrolü.', output: 'Hat iyileştirmesi, yeni kreatifler' },
    { day: 'Perşembe', focus: 'Saha çekimi ve talep', work: 'Organizasyon kaydı; haftanın taleplerinin pazarlamacıyla kontrolü.', output: 'Talep listesi' },
    { day: 'Cuma', focus: 'Changelog videoları', work: 'Sprint sonu haftalarında Review’dan sonra yeni özellik videoları.', output: '1–2 changelog videosu' },
    { day: 'Cumartesi', focus: 'Rapor ve toplu üretim', work: 'Haftalık rapor, seri bölümleri, kuyruk.', output: 'Haftalık rapor' },
  ],
  kpis: [
    { metric: 'Yayınlanan kısa video', daily: '3', weekly: '15–18', ramp: 'Ay 1: 1 / gün (hat kurulumu) · Ay 2: 2 / gün · Ay 3: 3 / gün' },
    { metric: 'Otomatik paylaşım oranı', daily: '—', weekly: '≥ %80', ramp: 'Ay 1 yarı otomatik · Ay 3’te kuyruğun %80’i otomatik' },
    { metric: 'İzlenme süresi ve etkileşim', daily: '—', weekly: 'Temel değerin üstünde', ramp: 'İlk hafta temel değer ölçülür; her ay iyileşme hedefi konur (tahtada 201 “Like”)' },
    { metric: 'Pazarlamacıya devredilen talep', daily: '1–2', weekly: '10', ramp: 'Ay 1: 3 / hafta · Ay 2: 5 / hafta · Ay 3: 10 / hafta' },
    { metric: 'Meta işe alım reklamı', daily: '—', weekly: '5.000 ₺ · en fazla ~50 başvuru', ramp: 'Başvuru başına maliyet ilk 2 haftada ölçülür; kreatifler haftalık yenilenir' },
    { metric: 'Changelog videosu', daily: '—', weekly: 'Her sprintte 1–2', ramp: 'Sprint sonundan itibaren 48 saat içinde' },
    { metric: 'Hatalı bilgiyle yayın', daily: '0', weekly: '0', ramp: 'Her yayında insan kontrolü' },
  ],
  workflow: {
    id: 'yapay-zeka-icerik-hatti',
    title: 'Yapay zekâ içerik hattı',
    desc: 'Kaynaktan otomatik paylaşıma ve talebe: her video aynı hattan geçer; otomasyon arttıkça elle yapılan adımlar azalır, insan kontrolü kalır.',
    steps: [
      { title: 'Kaynak', owners: ['dijital-pazarlama', 'yazilim', 'saha-uzmani', 'organizator'], detail: 'Changelog, saha vakası, satıcı hikâyesi, eğitim kesiti, aramalarda sık gelen itirazlar.' },
      { title: 'Senaryo', owners: ['dijital-pazarlama'], detail: 'Yapay zekâ ile senaryo ve 3 kanca (hook) varyasyonu; marka dili şablonu.' },
      { title: 'Üretim', owners: ['dijital-pazarlama'], detail: 'Seslendirme, görsel veya ham çekim, şablon kurgu, otomatik altyazı; gerekirse İngilizce.', output: 'Dikey kısa video' },
      {
        title: 'İnsan kontrolü',
        kind: 'decision',
        owners: ['dijital-pazarlama', 'yonetici'],
        detail: 'Doğruluk, telif ve kişi izni kontrol edilir.',
        branches: [
          { when: 'Uygun', then: 'Otomatik paylaşım kuyruğuna girer.' },
          { when: 'Düzeltme gerekli', then: 'Yeniden üretim; hata türü şablona not edilir.' },
          { when: 'Fiyat, kampanya veya kişi görüntüsü içeriyor', then: 'Yönetici onayı; kişi için yazılı izin.' },
        ],
      },
      { title: 'Otomatik paylaşım', owners: ['dijital-pazarlama'], detail: 'Resmî planlayıcı veya API ile zamanlı yayın; platforma göre uyarlama.', output: 'Yayın' },
      { title: 'Etkileşim → talep', owners: ['dijital-pazarlama', 'pazarlamaci'], detail: 'Yorum ve mesajdaki ilgili kişi CRM’e talep olarak düşer; pazarlamacı 24 saat içinde arar.', sla: '24 saat', output: 'CRM: Talep' },
      { title: 'Ölçüm ve öğrenme', owners: ['dijital-pazarlama'], detail: 'Haftalık rapor; iyi çalışan kanca ve formatlar şablona döner.', output: 'Güncel şablonlar' },
    ],
  },
  plan: {
    range: '2 Kasım 2026 – 30 Ocak 2027 (asistansız senaryoda 4 Ocak – 3 Nisan 2027)',
    rows: [
      { week: 'D1', dates: '2–7 Kasım', focus: 'Sıfır Noktası', actions: ['Kanal hesapları, marka kiti, içerik sütunları', 'Meta reklam hesabını İsmail Karaca’dan devralma', 'Ölçüm tablosu ve temel değerler'], target: 'Temel değerler kayıtlı', tone: 'milestone' },
      { week: 'D2–D3', dates: '9–21 Kasım', focus: '101 Otomasyon', actions: ['Yarı otomatik hat: senaryo → ses → kurgu → altyazı → zamanlı paylaşım', 'Temsilci reklamları için video kreatifler (16 Kasım)', 'Changelog serisi başlar'], target: 'Günde 1 video · 3 günlük kuyruk' },
      { week: 'D4–D6', dates: '23 Kasım – 12 Aralık', focus: '201 Like (etkileşim)', actions: ['Kanca testleri ve başlık varyasyonları', 'Saha serisi; Aralık’tan eğitim kesitleri', 'Yorum yanıt şablonları'], target: 'Günde 2 video · etkileşim temel değerin üstünde' },
      { week: 'D7–D8', dates: '14–26 Aralık', focus: '301 Talep', actions: ['Çağrı ifadesi ve WhatsApp/form yönlendirmesi', 'Yorum → CRM talep otomasyonu', '60. gün içerik raporu'], target: 'Haftada 5 talep', tone: 'milestone' },
      { week: 'D9–D11', dates: '28 Aralık – 16 Ocak', focus: '401 Ölçek', actions: ['Çok dilli altyazı (küresel alıcılar)', 'Satıcı ürünlerinden otomatik video', 'Seri formatların şablonlaşması'], target: 'Günde 3 video · %80 otomatik paylaşım' },
      { week: 'D12–D13', dates: '18–30 Ocak', focus: '501 Hakkını vermek', actions: ['Performansa göre kendini iyileştiren hat ve otomatik haftalık rapor', 'Satıcılara içerik hizmeti seçenekleri (30K / 90K / 500K ile ilişkisi)', '90. gün değerlendirmesi ve hat playbook’u'], target: 'Haftada 10 talep · playbook teslim', tone: 'milestone' },
    ],
  },
  firstWeek: [
    'Sözleşme, fazla çalışma için yazılı onay ve SGK işe giriş bildirimi',
    'iStoc’u satıcı gözüyle baştan sona deneme',
    'Marka kiti: logo, renk, yazı tipi, ses tonu, yasak ifadeler',
    'Yazılım ekibinin son 3 sprintinin changelog’unu okuma',
    'Saha uzmanı ve organizatörle birer gün geçirme (çekim planı)',
    'İlk videonun yöneticiye onaya sunulması',
  ],
  risks: [
    { risk: 'Yapay zekâ çıktısında yanlış ürün bilgisi', mitigation: 'Her yayında insan kontrolü; asistan ürün bilgisini changelog’la doğrular.' },
    { risk: 'Otomatik paylaşım nedeniyle hesap kısıtlaması', mitigation: 'Yalnız resmî planlayıcı veya API; toplu takip, toplu yorum gibi otomasyonlar yok.' },
    { risk: 'İzlenmenin talebe dönmemesi', mitigation: '301 basamağında çağrı ifadesi ve CRM devri; haftalık talep hedefi.' },
    { risk: 'Kişi görüntüsü ve telif', mitigation: 'Yazılı izin; lisanslı veya telifsiz müzik ve görsel.' },
  ],
};

/** Tahtadaki olgunluk basamakları: Sıfır noktası → 501 → hakkını vermek. */
export const contentLadder = [
  { code: 'Sıfır Noktası', name: 'Temel', build: 'Hesaplar, marka kiti, içerik sütunları, ölçüm tablosu; mevcut durumun temel değerleri.', exit: 'Tüm kanallar ve ölçüm hazır', when: 'D1' },
  { code: '101', name: 'Otomasyon', build: 'Senaryo → seslendirme → kurgu → altyazı → zamanlı paylaşım hattı (yarı otomatik).', exit: 'Günde 1 video, 3 günlük kuyruk', when: 'D2–D3' },
  { code: '201', name: 'Like (etkileşim)', build: 'Kanca testleri, başlık varyasyonları, yorum yanıt şablonları.', exit: 'Etkileşim temel değerin üstünde', when: 'D4–D6' },
  { code: '301', name: 'Talep', build: 'Çağrı ifadesi, WhatsApp/form yönlendirmesi, yorum → CRM talep otomasyonu.', exit: 'Haftada 5 nitelikli talep', when: 'D7–D8' },
  { code: '401', name: 'Ölçek', build: 'Çok dilli altyazı, seri formatlar, satıcı ürünlerinden otomatik video.', exit: 'Günde 3 video, %80 otomatik paylaşım', when: 'D9–D11' },
  { code: '501', name: 'Hakkını vermek', build: 'Performansa göre şablon seçen, haftalık raporu kendisi üreten hat; satıcılara içerik hizmeti seçenekleri.', exit: 'Hat insan kontrolüyle kesintisiz çalışır', when: 'D12–D13' },
];

export const contentSources = [
  { source: 'Changelog', from: 'Yazılım ekibi ve asistan', format: 'Yeni özellik videosu: ne değişti, ne kazandırır', cadence: 'Her sprint sonu' },
  { source: 'Saha vakaları', from: 'Saha uzmanı', format: 'Satıcı başarı hikâyesi, “ilk siparişim” röportajı (yazılı izinle)', cadence: 'Haftada 2' },
  { source: 'Eğitim kesitleri', from: 'Organizatör', format: '30–60 saniyelik “nasıl yapılır” kesiti', cadence: 'Haftada 2' },
  { source: 'Sık itirazlar', from: 'Pazarlamacı', format: 'Soru-cevap videosu', cadence: 'Haftada 1' },
  { source: 'Tam makaleler', from: 'Asistan ve dijital pazarlama', format: 'Gruplarda reklam yerine tam makale; videoya özet', cadence: 'Haftada 1' },
  { source: 'Meta işe alım kreatifleri', from: 'Dijital pazarlama', format: 'Temsilci ve personel ilanı videoları; ürün ve iş açık, kazanç vaadi yok', cadence: 'Haftada 2–3' },
];
