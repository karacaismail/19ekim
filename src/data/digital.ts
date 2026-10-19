import type { RoleKey } from './types';

/**
 * Dijital pazarlama uzmanının üç iş akışı ve içerik planı.
 * 1 Ölçüm ve entegrasyonlar → 2 AI-first paylaşım otomasyonu → 3 Üretim ve paylaşım otomasyonu;
 * ne üretileceğini 4 İçerik planı belirler. Asistan alınmazsa uzman 1 Ocak 2027’de başlar ve tarihler 2 ay kayar.
 */

/* ---------- 1. Ölçüm ve entegrasyonlar ---------- */

export interface Integration {
  name: string;
  measures: string;
  done: string;
  date: string;
}

export const integrations: Integration[] = [
  { name: 'Google Tag Manager', measures: 'Tüm etiketler tek kapsayıcıda: istoc.com ve alt alan adları', done: 'Önizlemede tüm etiketler tetikleniyor; sürüm notlu yayın', date: '2026-11-06' },
  { name: 'Çerez onayı (KVKK) + Consent Mode', measures: 'Ziyaretçi izni; izin yoksa ölçüm etiketi çalışmaz', done: 'Onaysız oturumda ölçüm isteği 0', date: '2026-11-06' },
  { name: 'Google Analytics 4', measures: 'Kayıt → onboarding → abonelik (399 €) → yenileme olayları', done: 'Huni raporu CRM sayılarıyla ± %5 içinde', date: '2026-11-13' },
  { name: 'Yandex Metrica', measures: 'Hedefler, ısı haritası, oturum kaydı (Webvisor)', done: 'Kayıt formu ve paket sayfası hedefleri ölçülüyor', date: '2026-11-13' },
  { name: 'Search Console + Yandex Webmaster', measures: 'Site haritası, dizine ekleme, arama sorguları', done: 'Site haritası onaylı; dizine ekleme hatası 0', date: '2026-11-13' },
  { name: 'Meta Pixel + Conversions API', measures: 'Temsilci başvurusu ve kayıt; reklam hesabı İsmail Karaca’dan devralınır', done: 'Başvuru olayı tarayıcı + sunucu kaynaklı, tekilleştirilmiş', date: '2026-11-16' },
  { name: 'UTM standardı + CRM kaynak alanı', measures: 'Her paylaşım ve reklam bağlantısının kaynağı Frappe CRM’de', done: 'UTM’li paylaşım %100; kaynağı boş CRM kaydı %0', date: '2026-11-20' },
  { name: 'Haftalık ölçüm panosu', measures: 'GA4 + Metrica + CRM: kaynak → kayıt → aktif satıcı', done: 'Her Pazartesi 09:00 yönetici brifinginde', date: '2026-11-23' },
];

/* ---------- 2. AI-first paylaşım otomasyonu (hat) ---------- */

export type StepMode = 'otomatik' | 'secim' | 'onay';

export const STEP_MODE_LABELS: Record<StepMode, string> = {
  otomatik: 'Otomatik',
  secim: 'AI önerir, uzman seçer',
  onay: 'İnsan onayı',
};

export interface PipelineStep {
  step: string;
  what: string;
  mode: StepMode;
  measure: string;
}

export const pipeline: PipelineStep[] = [
  { step: 'Kaynak toplama', what: 'Changelog, CRM’de sık sorulan sorular, eğitim kayıtları ve saha notları haftalık kuyruğa düşer', mode: 'otomatik', measure: 'Haftada ≥ 30 içerik fikri' },
  { step: 'Senaryo', what: 'Her fikir için AI 3 kanca ve 30–60 sn senaryo yazar; uzman birini seçer', mode: 'secim', measure: 'Senaryo başına ≤ 10 dk' },
  { step: 'Üretim', what: 'AI seslendirme, altyazı ve marka şablonuyla kurgu; Ocak’ta çok dilli altyazı', mode: 'otomatik', measure: 'Video başına 90 dk → 20 dk (Ocak)' },
  { step: 'Onay', what: 'Bilgi, fiyat ve uyum kontrol listesi; gelir vaadi yok', mode: 'onay', measure: 'Hatalı bilgiyle yayın 0' },
  { step: 'Zamanlama ve paylaşım', what: 'Tek kuyruktan tüm kanallara zamanlanmış paylaşım', mode: 'otomatik', measure: 'Paylaşımların %80’i otomatik (Ocak)' },
  { step: 'Ölçüm ve geri besleme', what: 'UTM → GA4 ve Metrica; yorum ve mesajdaki talep CRM’e', mode: 'otomatik', measure: 'Talep 24 saatte masa başına' },
];

/** Araç kararı (19 Ekim 2026): otomasyon açık kaynak ve kendi sunucumuzda; üretim ve paylaşım ücretli araçlarla. */
export const AI_TOOL_BUDGET = 7_500;

export interface AiTool {
  tool: string;
  use: string;
  license: string;
}

export const aiTools: AiTool[] = [
  { tool: 'n8n', use: 'Hat otomasyonu: kaynak toplama, kuyruk, yorum ve mesajdan CRM’e talep', license: 'Açık kaynak, kendi sunucumuzda (lisans 0 ₺)' },
  { tool: 'Claude', use: 'Senaryo, kanca, altyazı metni, makale taslağı', license: 'Ücretli abonelik' },
  { tool: 'ElevenLabs', use: 'Türkçe seslendirme', license: 'Ücretli abonelik' },
  { tool: 'CapCut Pro', use: 'Kurgu, otomatik altyazı, marka şablonları', license: 'Ücretli abonelik' },
  { tool: 'Canva Pro', use: 'Kapak, carousel, görsel şablonlar', license: 'Ücretli abonelik' },
  { tool: 'Metricool', use: 'Zamanlanmış paylaşım: Instagram, TikTok, YouTube, LinkedIn, Facebook', license: 'Ücretli abonelik' },
];

/* ---------- 3. Üretim ve paylaşım otomasyonu ---------- */

export const productionRamp = {
  months: ['Kasım', 'Aralık', 'Ocak'],
  video: { metric: 'Kısa video / gün', values: [1, 2, 3] },
  auto: { metric: 'Otomatik paylaşım (%)', values: [30, 60, 80] },
};

export interface Channel {
  channel: string;
  content: string;
  frequency: string;
}

export const channels: Channel[] = [
  { channel: 'Instagram Reels', content: 'Tüm içerik sütunları (dikey video)', frequency: 'Ocak’ta günde 3' },
  { channel: 'YouTube Shorts', content: 'Ürün yenilikleri, nasıl yapılır', frequency: 'Günde 1–2' },
  { channel: 'TikTok', content: 'Dikey videoların aynısı', frequency: 'Günde 1–2' },
  { channel: 'LinkedIn', content: 'Ürün yenilikleri, pazar içgörüsü (kurumsal)', frequency: 'Haftada 3' },
  { channel: 'Facebook sayfası ve satıcı grupları', content: 'Nasıl yapılır, eğitim davetleri', frequency: 'Haftada 5' },
  { channel: 'istoc.com blog', content: 'Tam makale: nasıl yapılır ve pazar içgörüsü', frequency: 'Haftada 3 (Ocak)' },
];

/* ---------- 4. İçerik planı: ne üreteceğiz ---------- */

export interface ContentPillar {
  pillar: string;
  what: string;
  /** İçeriğin kaynağını sağlayan ekip. */
  source: RoleKey;
  sourceNote: string;
  format: string;
  perWeek: number;
  measure: string;
  example: string;
}

/** Ocak 2027 haftalık hedefi: 18 video = günde 3 × 6 gün. Kasım’da günde 1, Aralık’ta günde 2 ile aynı oranlar. */
export const contentPlan: ContentPillar[] = [
  { pillar: 'Ürün yenilikleri', what: 'Her sprintteki yeni özellik 60 saniyede', source: 'yazilim', sourceNote: 'Sprint changelog’u (asistan taslağı)', format: '30–45 sn ekran videosu', perWeek: 4, measure: 'Videodan siteye geçiş (UTM)', example: '“Toplu ürün yükleme artık 3 adımda”' },
  { pillar: 'Nasıl yapılır', what: 'Satıcının istoc.com’u kullanması için adım adım anlatım', source: 'pazarlamaci', sourceNote: 'CRM’de en sık 10 soru; eğitim modülleri M1–M5', format: '60–90 sn ekran kaydı + tam makale', perWeek: 4, measure: 'İçerikten kayıt', example: '“Telefonla ürün fotoğrafı: 3 kural”' },
  { pillar: 'Satıcı hikâyeleri', what: 'Gerçek satıcının istoc.com deneyimi (yazılı izinle)', source: 'saha-uzmani', sourceNote: 'Saha ziyaretleri, aktif satıcılar', format: '45–60 sn röportaj', perWeek: 2, measure: 'CRM’e talep', example: '“Bir İstoç satıcısının istoc.com’daki ilk 30 günü”' },
  { pillar: 'Pazar içgörüsü', what: 'Toptan talep ve ürün eğilimleri, veriyle', source: 'asistan', sourceNote: 'istoc.com arama ve talep verisi; asistan derler', format: 'Carousel + tam makale', perWeek: 2, measure: 'Kaydetme ve paylaşım', example: '“Bu hafta en çok aranan 5 ürün grubu”' },
  { pillar: 'Eğitim ve etkinlik', what: 'Her iş günü 17:00 eğitiminin daveti ve kesiti', source: 'organizator', sourceNote: 'Organizatör eğitimleri (7 Aralık’tan)', format: 'Davet hikâyesi + 30 sn kesit', perWeek: 5, measure: 'Eğitime kayıt', example: '“Yarın 17:00: katalog eğitimi, ofis toplantı salonu”' },
  { pillar: 'Temsilci programı', what: 'Bağımsız temsilcinin ne yaptığı; gelir vaadi yok', source: 'ekip-lideri', sourceNote: 'Hukuk teyitli kazanç planı (14 Kasım)', format: 'Bilgilendirme videosu', perWeek: 1, measure: 'Başvuru (en fazla ~50 / hafta)', example: '“Bağımsız satış temsilcisi ne yapar?”' },
];

/* ---------- 90 günlük plan (iş akışı × zaman) ---------- */

export type Stream = 'olcum' | 'otomasyon' | 'uretim' | 'plan';

export const STREAM_LABELS: Record<Stream, string> = {
  olcum: '1 Ölçüm',
  otomasyon: '2 Otomasyon',
  uretim: '3 Üretim',
  plan: '4 İçerik planı',
};

export interface DigitalPlanRow {
  stream: Stream;
  from: string;
  to: string;
  action: string;
  target: string;
  milestone?: boolean;
}

export const digitalPlan: DigitalPlanRow[] = [
  { stream: 'olcum', from: '2026-11-02', to: '2026-11-13', action: 'GTM, çerez onayı, GA4, Yandex Metrica, Search Console + Yandex Webmaster', target: 'Hepsi 13 Kasım’da yayında', milestone: true },
  { stream: 'olcum', from: '2026-11-16', to: '2026-11-20', action: 'Meta Pixel + Conversions API; UTM standardı ve CRM kaynak alanı', target: 'UTM’li paylaşım %100' },
  { stream: 'olcum', from: '2026-11-23', to: '2027-01-30', action: 'Haftalık ölçüm panosu', target: 'Her Pazartesi 09:00' },
  { stream: 'otomasyon', from: '2026-11-02', to: '2026-11-27', action: 'Araçlar kurulur (n8n, Claude, ElevenLabs, CapCut, Canva, Metricool); hat v1: kaynak → senaryo → üretim yarı otomatik', target: '%30 otomatik paylaşım · araç gideri ≤ 7.500 ₺ / ay' },
  { stream: 'otomasyon', from: '2026-11-30', to: '2026-12-26', action: 'Hat v2: zamanlayıcı ve yorum → CRM otomasyonu', target: '%60 otomatik · talep 24 saatte' },
  { stream: 'otomasyon', from: '2026-12-28', to: '2027-01-30', action: 'Hat v3: çok dilli altyazı, tam otomatik zamanlama', target: '%80 otomatik', milestone: true },
  { stream: 'uretim', from: '2026-11-09', to: '2026-11-28', action: 'İlk yayınlar: ürün yenilikleri ve nasıl yapılır', target: 'Günde 1 video' },
  { stream: 'uretim', from: '2026-11-30', to: '2026-12-26', action: 'Satıcı hikâyeleri ve eğitim davetleri eklenir', target: 'Günde 2 video · haftada 5 talep' },
  { stream: 'uretim', from: '2026-12-28', to: '2027-01-30', action: 'Altı sütunun tamamı', target: 'Günde 3 video · haftada 10 talep', milestone: true },
  { stream: 'plan', from: '2026-11-02', to: '2026-11-06', action: 'İçerik planı v1: 6 sütun, kanallar, haftalık takvim', target: 'İsmail Karaca onayı 6 Kasım', milestone: true },
  { stream: 'plan', from: '2026-11-30', to: '2026-12-04', action: 'İçerik planı v2: ilk ayın verisiyle sütun oranları', target: 'Ölçüte göre en zayıf 2 sütun yeniden dengelenir' },
  { stream: 'plan', from: '2026-12-28', to: '2026-12-31', action: 'İçerik planı v3: Ocak takvimi', target: 'Haftada 18 video planlı' },
];
