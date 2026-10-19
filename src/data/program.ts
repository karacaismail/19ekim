import type { FlowStep, RoleKey, Status } from './types';

export const meta = {
  planDate: '19 Ekim 2026',
  siteTitle: 'iStoc Saha ve Pazarlama Planı',
  shortTitle: 'Saha ve Pazarlama Planı',
  description:
    'iStoc için masa başı pazarlama, saha, organizasyon, asistan ve ekip lideri rollerinin iş akışları, günlük ve haftalık rutinleri ile 3 aylık eylem planı.',
};

export interface Milestone {
  date: string;
  title: string;
  detail: string;
  status: Status;
}

export const milestones: Milestone[] = [
  { date: '19 Ekim 2026, Pzt', title: 'Plan', detail: 'Tahtadaki kararlar ağaçlara, rutinlere ve haftalara bölündü (bu site).', status: 'karar' },
  { date: '20 Ekim', title: 'Meta reklamları başlar', detail: 'Personel bulma: haftalık 5.000 ₺, sürekli. Sorumlu İsmail Karaca (dijital pazarlama uzmanı gelene kadar).', status: 'karar' },
  { date: '20–30 Ekim', title: 'İşe alım: 1 Kasım grubu', detail: 'Asistan, masa başı (CRM), 2 saha, dijital pazarlama. 29 Ekim resmî tatil, 28 Ekim yarım gün.', status: 'karar' },
  { date: '1 Kasım (ilk iş günü 2 Kasım)', title: 'Beş kişi başlar', detail: 'Asistan (onay bekliyor), masa başı pazarlama (CRM), saha ekibi (2 kişi), dijital pazarlama.', status: 'karar' },
  { date: '16 Kasım', title: 'Meta temsilci reklamları başlar', detail: 'Çok katmanlı pazarlama ağı için sürekli aday akışı.', status: 'karar' },
  { date: '23 Kasım', title: 'İlk MLM bilgilendirme toplantısı', detail: 'Ofisteki toplantı salonunda; ilk temsilci grubu.', status: 'oneri' },
  { date: '1 Aralık, Sal', title: 'Organizatör ve ekip lideri başlar', detail: 'Organizatör (6. sıra) işe başlar; ekip lideri işe alınanlar arasından seçilir ve ağı devralır.', status: 'karar' },
  { date: '30 Aralık, Çar', title: '60. gün kontrol noktası', detail: 'Hedef yolu: ~47 aktif satıcı, %70 elde tutmayla ~1,2 milyon ₺. Kayıp, bütçe ve süre sınırına göre karar.', status: 'karar' },
  { date: '1 Ocak 2027', title: 'Asistansız senaryo: dijital pazarlama başlar', detail: 'Asistan alınmazsa dijital pazarlama 1 Kasım yerine 1 Ocak’ta başlar (resmî tatil; ilk iş günü 2 Ocak).', status: 'bekliyor' },
  { date: '30 Ocak 2027, Cmt', title: '90. gün değerlendirmesi', detail: '100 aktif / 500 üye satıcı, ≥ 3.000.000 ₺ ciro; 4. ay mesai modeli.', status: 'karar' },
  { date: 'Şubat–Mart 2027', title: '2. kuşak alt hat', detail: 'Temsilcilerin sponsorluğu; ayda ~2 yeni aktif temsilciyle ~10 temsilci.', status: 'oneri' },
];

/** 90 gün hedefi (1 Kasım 2026 – 30 Ocak 2027). Kararınız. */
export const targets = [
  { label: 'Aktif satıcı', value: '100', note: 'Aylık 399 € abonelik ödeyen satıcı' },
  { label: 'Üye satıcı', value: '500', note: 'Kayıtlı, ödeme yapmayan' },
  { label: 'Ciro', value: '≥\u00a03.000.000\u00a0₺', note: '90 gün' },
  { label: 'Gereken ödeme', value: '136 satıcı-ay', note: '3.000.000 ₺ ÷ 22.068 ₺ (399 €)' },
];

export const CIRO_TARGET = 3_000_000;
export const SUBSCRIPTION_EUR = 399;
/** Planlama panosundaki kur (51.896 € = 2.870.248 ₺). Güncel kurla değiştirilebilir. */
export const EUR_TRY = 2_870_248 / 51_896;
export const SUBSCRIPTION_TRY = SUBSCRIPTION_EUR * EUR_TRY;
/** Yıllık peşin: “yıllık 2 ay bedava” kuralıyla 10 aylık ücret. */
export const ANNUAL_TRY = SUBSCRIPTION_EUR * 10 * EUR_TRY;

export const MONTHS = ['Kasım', 'Aralık', 'Ocak'];

/** Hedefin kaynaklara ve aylara dağılımı: kayıt (üye + aktif) ve yeni aktif satıcı (ilk ödeme). */
export const targetPlan: { source: string; role: RoleKey; kayit: number[]; aktif: number[]; gap?: boolean }[] = [
  { source: 'Saha ekibi (2 kişi) ve ekip lideri', role: 'saha-uzmani', kayit: [80, 130, 165], aktif: [10, 20, 25] },
  { source: 'Çok katmanlı pazarlama ağı', role: 'ekip-lideri', kayit: [0, 15, 30], aktif: [0, 3, 6] },
  { source: 'Organizatör eğitimleri (Aralık’tan)', role: 'organizator', kayit: [0, 20, 40], aktif: [0, 4, 8] },
  { source: 'Masa başı ve dijital (uzaktan)', role: 'pazarlamaci', kayit: [15, 25, 35], aktif: [2, 6, 8] },
  { source: 'Kapasite açığı (karar gerekli)', role: 'yonetici', kayit: [0, 15, 30], aktif: [0, 2, 6], gap: true },
];

/** Aylık yeni aktif satıcı (ilk ödeme): Kasım 12, Aralık 35, Ocak 53 = 100. */
export const NEW_ACTIVE = [0, 1, 2].map((m) => targetPlan.reduce((sum, t) => sum + t.aktif[m], 0));

/** Haftalık yeni aktif satıcı (H1–H13); aylara toplamı NEW_ACTIVE ile aynıdır. */
export const weeklyActive = [2, 3, 3, 4, 7, 9, 9, 10, 9, 11, 11, 11, 11];

/** Aylık elde tutma r ile 90 günde ödeme sayısı: her ay yeni gelenler + önceki ayların yenilemeleri. */
export function payments(r: number) {
  const [a, b, c] = NEW_ACTIVE;
  const monthly = [a, b + a * r, c + b * r + a * r * r];
  return { monthly, renewals: [0, a * r, b * r + a * r * r], total: monthly[0] + monthly[1] + monthly[2] };
}

export const RETENTION_SCENARIOS = [0, 0.5, 0.66, 0.7, 1];

/** İstihdam takvimi: kararınızdaki sıra. Gün değerleri 19 Ekim 2026 = 0 kabul edilerek hesaplanır. */
export const hiringSchedule = [
  { no: 1, title: 'İsmail Karaca', role: 'yonetici' as const, date: 'Şimdi', day: 0, note: 'Tepe: strateji ve operasyon. Dijital pazarlama uzmanı gelene kadar Meta reklamlarının sorumlusu.', status: 'karar' as const },
  { no: 2, title: 'Asistan', role: 'asistan' as const, date: '1 Kasım 2026', day: 13, note: 'Onay bekliyor. Alınmazsa dijital pazarlama 1 Ocak’a kayar.', status: 'bekliyor' as const },
  { no: 3, title: 'Masa başı pazarlama (CRM)', role: 'pazarlamaci' as const, date: '1 Kasım 2026', day: 13, note: '1 kişi; soğuk arama, WhatsApp, e-posta, CRM, randevu.', status: 'karar' as const },
  { no: 4, title: 'Saha pazarlama ekibi', role: 'saha-uzmani' as const, date: '1 Kasım 2026', day: 13, note: 'Önce 2 kişi; sonra çok katmanlı pazarlama ağıyla büyür.', status: 'karar' as const },
  { no: 5, title: 'Dijital pazarlama', role: 'dijital-pazarlama' as const, date: '1 Kasım 2026', day: 13, note: 'Yapay zekâ ile video içerik, otomatik paylaşım, Meta reklamları.', status: 'karar' as const, altDate: '1 Ocak 2027', altDay: 74, altNote: 'Asistan yoksa: asistan olmadan dijital pazarlamayla ilgilenmeye zaman yetmez.' },
  { no: 6, title: 'Organizasyoncu (organizatör)', role: 'organizator' as const, date: '1 Aralık 2026', day: 43, note: 'Her iş günü 17:00–18:00 eğitim; haftada iki 15 kişilik organizasyon.', status: 'karar' as const },
];

/** Takvimin ek satırları: içeriden seçilen ekip lideri ve sürekli büyüyen temsilci ağı. */
export const hiringScheduleExtra = [
  { title: 'Ekip lideri (içeriden)', role: 'ekip-lideri' as const, date: '1 Aralık 2026', day: 43 },
  { title: 'Bağımsız satış temsilcileri', role: 'ekip-lideri' as const, date: '23 Kasım → sürekli', day: 35 },
];

/** 1 Kasım = 1. gün; 90 günlük pencere 29 Ocak’ta biter, değerlendirme 30 Ocak (gün 103). */
export const SCHEDULE_END_DAY = 103;
export const SCHEDULE_START = '2026-10-19';

export interface BoardRow {
  board: string;
  decision: string;
  where: { label: string; path: string };
}

export const boardMapping: BoardRow[] = [
  { board: '1 — Masa başı pazarlama, maaşlı ×1 kişi', decision: 'Pazarlamacı (masa başı), 1 kişi, 2 Kasım’da başlar.', where: { label: 'Pazarlamacı', path: '/roller/pazarlamaci/' } },
  { board: 'WhatsApp günlük = 20, gruplar, e-posta, soğuk arama, sosyal medya grupları, data oluşturmak', decision: 'Pazarlamacının günlük rutini ve KPI’ları. “Spam” geçen kanallar izinli ve ret seçenekli iletişim olarak kurgulandı.', where: { label: 'Çalışma düzeni', path: '/calisma-duzeni/#iletisim-kurallari' } },
  { board: 'CRM takibi → randevu oluştur; müşteri onboard edildi mi? → toplantı almak; müşteri istihbaratı', decision: 'Randevu devri ve onboarding kontrol akışları.', where: { label: 'İş akışları', path: '/is-akislari/' } },
  { board: '2 — Organizatör ×1: 15 kişilik toplantı, segmentasyon, kurumsal iş birliği, eğitim verecek', decision: 'Organizatör; her gün 17:00–18:00 eğitim, haftada iki 15 kişilik organizasyon.', where: { label: 'Organizatör', path: '/roller/organizator/' } },
  { board: 'SAHA — çat kapı rutin, randevulu git (satış hedefli)', decision: 'Saha pazarlama uzmanı; günde 3 randevu + 8 çat kapı.', where: { label: 'Saha uzmanı', path: '/roller/saha-uzmani/' } },
  { board: 'Kalifikasyonlar: pazarlama dili, Canva, sosyal medya / satış dili, kurumsal organizasyon deneyimi, hırslı', decision: 'Rol kartlarında ve mülakat ölçütlerinde.', where: { label: 'İstihdam', path: '/istihdam/' } },
  { board: '3 — Satışçı: masa başı + randevulu; GTM funnel → talep, lead, satış', decision: 'GTM hunisi ve CRM aşamaları.', where: { label: 'İş akışları', path: '/is-akislari/#gtm-hunisi' } },
  { board: 'Sıfır noktası → 101 otomasyon → 201 Like → 301 → 401 → 501 → hakkını vermek; content ← changelog', decision: 'Dijital pazarlama uzmanı (1 kişi): yapay zekâ otomasyonuyla video ağırlıklı içerik ve otomatik paylaşım. Basamaklar içerik hattının olgunluğu; kaynak ürün changelog’u.', where: { label: 'Dijital pazarlama', path: '/roller/dijital-pazarlama/' } },
  { board: 'Pazarlama çözümleri: 30K / 90K / 500K', decision: 'Paket içerikleri karar bekliyor; asistanın ilk karar dokümanı.', where: { label: 'Karar bekleyenler', path: '/#karar-bekleyenler' } },
  { board: 'Hafta ×2 organizasyon, her gün eğitim; odalar, dernekler, sektörel topluluklar', decision: 'Organizatörün haftalık takvimi ve kurumsal iş birliği hedefleri.', where: { label: 'Eğitim programı', path: '/egitim-programi/#haftalik-takvim' } },
  { board: 'Mekân bul, personel bul → onboard → gereksinimler, oryantasyon, dokümantasyon + eğitim, task’lar, hedefler = KPI’lar', decision: 'Mekân hazır (ofis toplantı salonu); personel Meta reklamlarıyla (haftalık 5.000 ₺, sürekli); personel onboarding’i müşteri onboarding’inden ayrı.', where: { label: 'Eylem planı', path: '/eylem-plani/#kurulum' } },
  { board: 'Bedava sosyal medya → tam makaleler', decision: 'Müşteri edinmede ücretli kampanya yok: organik video ve gruplarda tam makale. Meta reklamları yalnız personel ve temsilci bulmak içindir.', where: { label: 'Dijital pazarlama', path: '/roller/dijital-pazarlama/#icerik-kaynaklari' } },
];

/** Strateji ve operasyon katmanları (örnek şema yapısına göre). */
export const layers = [
  { layer: 'Strateji belirlenir', who: 'Yatırımcı', what: 'Ürün, bütçe ve kayıp tavanı; kanal seçimi (yalnız A veya B).' },
  { layer: 'Strateji geliştirilir ve yönetilir', who: 'Strateji ve Operasyon Yöneticisi (siz)', what: 'Maliyet, müşteri kanıtı ve kapasite; harcama yetki sınırı içinde karar.' },
  { layer: 'Kararlar hazırlanır', who: 'Asistan', what: 'Seçenekli karar dokümanları, araştırma, eğitim içerikleri, Scrum desteği.' },
  { layer: 'Operasyonlar yönetilir', who: 'Ekip lideri (1 Aralık’tan)', what: 'Günlük ritim, koçluk, pipeline, temsilci ağı.' },
  { layer: 'Operasyonlar yürütülür', who: 'Pazarlamacı, saha uzmanı, organizatör, dijital pazarlama; Aralık’tan bağımsız satış temsilcileri', what: 'İçerik, talep, randevu, ziyaret, eğitim, onboarding, tahsilat.' },
];

export interface OrgNode {
  title: string;
  role: RoleKey;
  desc: string;
  status?: Status;
  children?: OrgNode[];
}

export const orgTree: OrgNode = {
  title: 'Yatırımcı',
  role: 'yatirimci',
  desc: 'Ürün, bütçe ve kayıp tavanı; kanal seçimi.',
  children: [
    {
      title: 'Strateji ve Operasyon Yöneticisi (siz)',
      role: 'yonetici',
      desc: 'Stratejiyi geliştirir, operasyonu yönetir; harcama yetki sınırı içinde karar verir.',
      children: [
        { title: 'Asistan', role: 'asistan', desc: 'Karar dokümanları, araştırma, eğitim sunumları, Scrum desteği. 16 Kasım.' },
        { title: 'Yazılım ekibi (4 kişi, Scrum)', role: 'yazilim', desc: 'Ürün geliştirme; sürüm notları (changelog) video içeriğe dönüşür.' },
        { title: 'Dijital pazarlama uzmanı', role: 'dijital-pazarlama', desc: 'Yapay zekâ ile video içerik ve otomatik paylaşım. 7 Aralık (öneri).', status: 'oneri' },
        {
          title: 'Ekip lideri',
          role: 'ekip-lideri',
          desc: '1 Aralık’tan itibaren; ekip içinden seçilir.',
          children: [
            { title: 'Pazarlamacı (masa başı)', role: 'pazarlamaci', desc: '2 Kasım.' },
            { title: 'Saha pazarlama uzmanı', role: 'saha-uzmani', desc: '2 Kasım.' },
            { title: 'Organizatör', role: 'organizator', desc: '16 Kasım (öneri); kurumsal iş birliklerinde doğrudan yöneticiye.', status: 'oneri' },
            { title: 'Bağımsız temsilciler', role: 'ekip-lideri', desc: 'Ocak 2027 pilotu; yalnız gerçek satıştan komisyon.', status: 'oneri' },
          ],
        },
      ],
    },
  ],
};

export interface OpenDecision {
  topic: string;
  proposal: string;
  preparer: RoleKey;
  deadline: string;
}

export const openDecisions: OpenDecision[] = [
  { topic: 'Asistan alınacak mı?', proposal: 'Onay netleşmedi. Alınmazsa dijital pazarlama 1 Ocak’a kayar; çünkü asistan olmadan dijital pazarlamayla ilgilenmeye zaman yetmez.', preparer: 'yonetici', deadline: '26 Ekim (teklif öncesi)' },
  { topic: 'Ücret, prim ve kota tutarları', proposal: 'Tutarlar planlama panosunda; bu herkese açık sitede yayımlanmaz.', preparer: 'yonetici', deadline: '28 Ekim (teklif öncesi)' },
  { topic: 'CRM aracı ve aşama tanımları', proposal: 'İş akışları sayfasındaki 10 aşama ve SLA’lar.', preparer: 'yonetici', deadline: '31 Ekim' },
  { topic: 'Tahtadaki “istoç SGK” notunun kapsamı', proposal: 'Pazarlamacının SGK tarafını da çalışıp çalışmayacağı netleşmeli.', preparer: 'yonetici', deadline: '31 Ekim' },
  { topic: '30K / 90K / 500K pazarlama çözümleri paket içerikleri', proposal: 'Ciro açığını kapatan ana araç; içerik ve fiyat sayfası satış başlamadan netleşmeli. Yapay zekâ içerik hizmeti bir seçenek.', preparer: 'yonetici', deadline: '31 Ekim' },
  { topic: 'Ciro hesabında kur', proposal: 'Planlama panosundaki kur kullanıldı (1 € ≈ 55,31 ₺). Güncel kurla Hedefler sayfası yeniden hesaplanır.', preparer: 'asistan', deadline: 'Her ay başı' },
  { topic: 'Yapay zekâ ve otomasyon araç bütçesi', proposal: 'Metin, ses, video, planlayıcı ve otomasyon abonelikleri; harcama yetki sınırına göre.', preparer: 'asistan', deadline: '4 Aralık' },
  { topic: 'Sosyal medya kanalları ve dil', proposal: 'Instagram Reels, YouTube Shorts, TikTok, LinkedIn, Facebook; Türkçe ve İngilizce altyazı.', preparer: 'asistan', deadline: '4 Aralık' },
  { topic: 'Ekip lideri liderlik farkı ve ekip primi', proposal: 'Seçim dokümanıyla birlikte.', preparer: 'asistan', deadline: '27 Kasım' },
  { topic: 'Kazanç planı (compensation plan) oranları', proposal: 'Unilevel, en çok 2 seviye; yalnız gerçek satıştan; hukuk ve mali müşavir teyidiyle. Temsilci reklamlarından önce.', preparer: 'yonetici', deadline: '14 Kasım' },
  { topic: 'Kapasite açığı: 8 aktif satıcı ve 45 kayıt', proposal: 'Ağ ayda ~2 aktif temsilci getirir; kalan açık 3. saha kişisi veya uzaktan satışın güçlendirilmesiyle kapanır. Karar 60. günde.', preparer: 'asistan', deadline: '30 Aralık (60. gün)' },
  { topic: '4. aydan itibaren mesai modeli', proposal: 'Yıllık 270 saat fazla çalışma sınırı nedeniyle yeni model.', preparer: 'asistan', deadline: '30 Ocak (90. gün)' },
];

/** Yönetişim ve harcama yetkisi akışı (planlama panosundaki karar şeması). */
export const governanceFlow: FlowStep[] = [
  { title: 'Karar: yatırımcı', owners: ['yatirimci'], detail: 'Ürün, bütçe ve kayıp tavanını belirler.' },
  { title: 'Strateji: yönetici', owners: ['yonetici'], detail: 'Maliyet, müşteri kanıtı ve kapasiteyi yönetir.' },
  {
    title: 'Harcama yetki sınırı',
    kind: 'decision',
    owners: ['yonetici', 'yatirimci'],
    detail: 'Her yeni harcama sınırla karşılaştırılır.',
    branches: [
      { when: 'Sınır içinde', then: 'Yönetici karar verir.' },
      { when: 'Sınırı aşıyor', then: 'Planlama toplantısı; yatırımcı karar verir.' },
    ],
  },
  {
    title: 'Kanal seçimi: yalnız A veya B',
    kind: 'decision',
    owners: ['yatirimci'],
    detail: 'Aynı anda iki müşteri edinme kanalı açılmaz. Meta işe alım reklamları personel ve temsilci bulmak içindir; B yolu sayılmaz.',
    branches: [
      { when: 'A — İç satış ve saha (bu plan)', then: 'CRM, randevu, ziyaret ve teklif.' },
      { when: 'B — Dijital müşteri edinme', then: 'Kampanya ve uzaktan demo.' },
    ],
  },
  { title: 'Operasyon: seçilen kanalın sorumlusu', owners: ['ekip-lideri', 'saha-uzmani', 'pazarlamaci', 'organizator'], detail: 'Tahsilat, aktivasyon ve müşteri değeri.' },
  {
    title: 'Kontrol noktası (60. ve 90. gün)',
    kind: 'decision',
    owners: ['yonetici', 'yatirimci'],
    detail: 'Önce kayıp, bütçe ve süre sınırına bakılır.',
    branches: [
      { when: 'Sınır içinde, kanıt yeterli', then: 'Seçili yolu sürdür.' },
      { when: 'Sınır içinde, kanıt yetersiz', then: 'Kalan sınırlar içinde iyileştir.' },
      { when: 'Sınır doldu', then: 'Yeni harcamayı durdur → mevcut yükümlülükleri hesapla → yeni yol için yatırımcı kararı.' },
    ],
  },
];

export const checkpoints = [
  { day: 'Gün 30', date: '30 Kasım 2026, Pzt', measure: 'Rol KPI’ları, CRM doluluğu, randevu → başvuru dönüşümü', rule: 'Ekip lideri seçimi (27 Kasım); KPI kalibrasyonu' },
  { day: 'Gün 60', date: '30 Aralık 2026, Çar', measure: 'Hedef yolu: ~47 aktif satıcı, ~1,2 milyon ₺ ciro (%70 elde tutma); kayıt, maliyet, aktif temsilci', rule: 'Sürdür / iyileştir / durdur; 2. saha uzmanı ve temsilci modeli kararları' },
  { day: 'Gün 90', date: '30 Ocak 2027, Cmt', measure: '100 aktif / 500 üye satıcı, ≥ 3.000.000 ₺ ciro; aylık elde tutma', rule: 'Aynı karar kuralı; 2. çeyrek planı ve 4. ay mesai modeli' },
];

export interface MasterRow {
  week: string;
  dates: string;
  yonetici: string;
  pazarlamaci: string;
  saha: string;
  organizator: string;
  dijital: string;
  asistan: string;
  lider: string;
  tone?: 'milestone';
}

export const masterPlan: MasterRow[] = [
  { week: 'H0', dates: '19–31 Ekim', yonetici: 'Meta reklamları (5.000 ₺/hafta); mülakatlar, teklifler; CRM; paket içerikleri (31 Ekim)', pazarlamaci: 'İşe alım', saha: 'İşe alım (2 kişi)', organizator: '—', dijital: 'İşe alım', asistan: 'İşe alım (onay bekliyor)', lider: 'Kazanç planı ve sözleşme taslağı' },
  { week: 'H1', dates: '2–7 Kasım', yonetici: 'Personel onboarding’i, ürün eğitimi, KPI tanımları', pazarlamaci: 'Ürün, CRM, senaryo v1, 200 kayıt', saha: 'Demo eğitimi, İstoç haritası, ilk çat kapı', organizator: 'İlan açılır', dijital: 'Sıfır Noktası; Meta reklamlarını devralır', asistan: 'Şablonlar, Scrum ritmi, aday tablosu', lider: 'Meta iş reklamları sürüyor', tone: 'milestone' },
  { week: 'H2', dates: '9–14 Kasım', yonetici: 'Senaryo ve demo provaları; kazanç planı teyidi (14 Kasım)', pazarlamaci: 'Senaryo v2, WhatsApp ritmi, ilk bülten', saha: 'Demo ve kapanış ritmi, itiraz kütüphanesi', organizator: 'Ön eleme', dijital: '101 Otomasyon: yarı otomatik hat', asistan: 'Kazanç planı seçenekleri', lider: 'Hukuk ve mali müşavir teyidi' },
  { week: 'H3', dates: '16–21 Kasım', yonetici: 'Temsilci reklamlarının başlaması', pazarlamaci: 'Segment listeleri; KPI kalibrasyonu', saha: 'İlk 14. gün abonelik görüşmeleri', organizator: 'Mülakat ve vaka', dijital: 'Temsilci reklam kreatifleri', asistan: 'Ekip lideri seçim ölçütleri', lider: 'Meta temsilci reklamları başlar' },
  { week: 'H4', dates: '23–28 Kasım', yonetici: 'Ay 1 kapanışı; ekip lideri kararı (27 Kasım)', pazarlamaci: 'Ay 1 raporu, kayıp analizi', saha: 'Kasım: ~80 kayıt · ~10 aktif', organizator: 'Teklif ve sözleşme', dijital: '201 Like: kanca testleri', asistan: 'Ekip lideri seçim dokümanı; M1–M2 desteleri', lider: 'İlk bilgilendirme toplantısı (23 Kasım)', tone: 'milestone' },
  { week: 'H5', dates: '30 Kasım – 5 Aralık', yonetici: 'Organizatör ve ekip liderinin onboarding’i', pazarlamaci: 'Raporlama ekip liderine', saha: 'Tam ritim; ekip lideriyle ortak ziyaret', organizator: 'Başlar (1 Aralık): oryantasyon, salon, pilot oturum', dijital: '201: saha serisi', asistan: 'M3 ve M4 desteleri', lider: 'Ekip lideri ağı devralır (1 Aralık)', tone: 'milestone' },
  { week: 'H6', dates: '7–12 Aralık', yonetici: 'Elde tutma ve yıllık peşin kampanyası', pazarlamaci: 'Organizatörle eğitim davetleri', saha: 'Haftada 4–5 aktif satıcı', organizator: 'Günlük eğitim başlar; ilk 15 kişilik organizasyon', dijital: '201: günde 2 video', asistan: 'Rakip analizi', lider: 'İlk satış eşlikleri' },
  { week: 'H7', dates: '14–19 Aralık', yonetici: 'Kanal bazında ciro takibi', pazarlamaci: 'Pasif satıcı listesi', saha: '14. gün abonelik görüşmeleri', organizator: 'Tam ritim; kurumsal görüşmeler', dijital: '301 Talep: yorum → CRM', asistan: '60. gün dosyası', lider: 'Haftalık bilgilendirme toplantısı' },
  { week: 'H8', dates: '21–26 Aralık', yonetici: '60. gün hazırlığı', pazarlamaci: 'Yıl sonu iletişimi', saha: 'Kurumsal üyelere ziyaret', organizator: 'Kurumsal görüşmeler', dijital: '301: haftada 5 talep', asistan: 'M5 ve mentor desteleri', lider: '~3 aktif temsilci' },
  { week: 'H9', dates: '28 Aralık – 2 Ocak', yonetici: '60. gün kontrol noktası (30 Aralık); 1 Ocak resmî tatil', pazarlamaci: 'Aktivasyon aramaları', saha: 'Pasif satıcı ziyaretleri', organizator: 'İlk protokol; başarı hikâyeleri', dijital: '401 Ölçek (asistansız senaryoda başlangıç)', asistan: '60. gün raporu', lider: '60. gün ağ verisi', tone: 'milestone' },
  { week: 'H10', dates: '4–9 Ocak', yonetici: 'Ciro köprüsü güncellemesi', pazarlamaci: 'Yeni yıl segment planı', saha: 'Temsilcilerle ortak ziyaret', organizator: 'Aktivasyon kampanyası', dijital: '401: çok dilli altyazı', asistan: 'Temsilci el kitabı', lider: 'Haftada 2 bilgilendirme' },
  { week: 'H11', dates: '11–16 Ocak', yonetici: 'Ağın uyum kontrolü', pazarlamaci: 'Temsilcilere senaryo dersi', saha: 'Haftada 6 aktif satıcı', organizator: 'Mentor programı, temsilci modülü', dijital: '401: %80 otomatik paylaşım', asistan: 'Destelerin revizyonu', lider: '~4 aktif temsilci' },
  { week: 'H12', dates: '18–23 Ocak', yonetici: '4. ay mesai modeli seçenekleri', pazarlamaci: 'Kanal dönüşüm raporu', saha: 'Saha playbook’u', organizator: 'Temsilci onboarding modülü', dijital: '501 Hakkını vermek', asistan: '90. gün dosyası', lider: 'Temsilci kaynaklı aktif satıcı takibi' },
  { week: 'H13', dates: '25–30 Ocak', yonetici: '90. gün değerlendirmesi (30 Ocak) ve 2. çeyrek kararı', pazarlamaci: 'Arama playbook’u', saha: 'Ekip: ~55 aktif satıcı', organizator: 'Etkinlik raporu', dijital: 'Hat playbook’u; içerik raporu', asistan: 'Değerlendirme raporu', lider: '~5 aktif temsilci', tone: 'milestone' },
];

/** Tahtanın “SAHA” sütunundaki yönetici kurulum listesi. */
export const setupChecklist = [
  { item: 'Mekân', detail: 'Hazır: 300 m²+ ofisteki toplantı salonu. Eğitim düzeni (ekran, ses, 15–20 kişilik oturma) ve 17:00–18:00 sabit rezervasyon.', due: '13 Kasım', status: 'karar' as Status },
  { item: 'Personel bul', detail: 'Meta (Facebook/Instagram) reklamları, haftalık 5.000 ₺, sürekli; sorumlu İsmail Karaca, dijital pazarlama uzmanı gelince devralır. Önce 1 Kasım grubu, 16 Kasım’dan itibaren bağımsız satış temsilcileri.', due: '20 Ekim → sürekli', status: 'karar' as Status },
  { item: 'Personel onboarding’i: gereksinimler', detail: 'Telefon hattı, WhatsApp Business, CRM, demo hesabı, e-posta, tablet, tanıtım kartları; sözleşme ve SGK.', due: 'Başlangıçtan 1 gün önce', status: 'karar' as Status },
  { item: 'Personel onboarding’i: oryantasyon', detail: 'İlk hafta programı: ürün ve paketler, CRM, mevzuat, gölge çalışma, kademeli hedef.', due: 'Başlangıç haftası', status: 'karar' as Status },
  { item: 'Müşteri onboarding’i (ayrı süreç)', detail: 'Personelin kazandırdığı satıcıyı 48 saatte platforma alıştırması: ilk ürünler, M1 eğitimi, alıcı daveti.', due: 'Her kayıtta', status: 'karar' as Status },
  { item: 'Dokümantasyon + eğitim', detail: 'Bu site; ardından asistanın SOP ve şablon kütüphanesi.', due: 'Sürekli', status: 'karar' as Status },
  { item: 'Task’lar ve hedefler = KPI’lar', detail: 'Ağaç dallarındaki günlük, haftalık rutinler ve hedef kartları; 2. hafta sonunda kalibrasyon.', due: '14 Kasım', status: 'karar' as Status },
];
