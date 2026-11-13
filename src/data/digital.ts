import { addDays, daysBetween, shiftText } from '../lib/dates';
import { tl } from '../lib/format';
import { DEFAULT_PARAMS, type Params } from './params';
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

const BASE_INTEGRATIONS: Integration[] = [
  { name: 'Google Tag Manager', measures: 'istoc.com ve alt alan adlarındaki bütün ölçüm etiketleri tek kapsayıcıda toplanır.', done: 'Önizlemede bütün etiketler çalışıyor. Her yayın sürüm notuyla yapılıyor.', date: '2026-11-06' },
  { name: 'Çerez onayı (KVKK) + Consent Mode', measures: 'Ziyaretçinin iznini kaydeder. İzin yoksa ölçüm etiketi çalışmaz.', done: 'Onay verilmeyen oturumda hiç ölçüm isteği gitmiyor.', date: '2026-11-06' },
  { name: 'Google Analytics 4', measures: 'Kayıt, ilk kurulum, abonelik (399 €) ve yenileme adımlarını ölçer.', done: 'Huni raporu CRM sayılarından en çok %5 sapıyor.', date: '2026-11-13' },
  { name: 'Yandex Metrica', measures: 'Hedefleri, ısı haritasını ve oturum kaydını (Webvisor) ölçer.', done: 'Kayıt formu ve abonelik sayfası hedefleri ölçülüyor.', date: '2026-11-13' },
  { name: 'Search Console + Yandex Webmaster', measures: 'Site haritasını, sayfaların dizine eklenmesini ve arama sorgularını izler.', done: 'Site haritası onaylandı. Dizine ekleme hatası yok.', date: '2026-11-13' },
  { name: 'Meta Pixel + Conversions API', measures: 'Temsilci başvurusunu ve kaydı ölçer. Reklam hesabı İsmail Karaca’dan devralınır.', done: 'Başvuru hem tarayıcıdan hem sunucudan gelir ve bir kez sayılır.', date: '2026-11-16' },
  { name: 'UTM standardı + CRM kaynak alanı', measures: 'Her paylaşım ve reklam bağlantısı kaynak etiketi (UTM) taşır. Kaynak, Frappe CRM kaydına yazılır.', done: 'Bütün paylaşımlarda UTM var. Kaynağı boş CRM kaydı yok.', date: '2026-11-20' },
  { name: 'Haftalık ölçüm panosu', measures: 'GA4, Metrica ve CRM verisini birleştirir. Kaynaktan kayda ve aktif satıcıya kadar olan yolu gösterir.', done: 'Pano her pazartesi 09:00’daki yönetici toplantısında sunuluyor.', date: '2026-11-23' },
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
  { step: 'Kaynak toplama', what: 'Sürüm notları, CRM’deki sık sorular, eğitim kayıtları ve saha notları her hafta kuyruğa eklenir.', mode: 'otomatik', measure: 'Haftada ≥ 30 içerik fikri' },
  { step: 'Senaryo', what: 'AI her fikir için 3 açılış cümlesi ve 30–60 saniyelik senaryo yazar. Uzman bunlardan birini seçer.', mode: 'secim', measure: 'Senaryo başına ≤ 10 dk' },
  { step: 'Üretim', what: 'AI seslendirme, altyazı ve marka şablonuyla video kurgulanır. Ocak’ta altyazılar çok dilli olur.', mode: 'otomatik', measure: 'Video başına 90 dk → 20 dk (Ocak)' },
  { step: 'Onay', what: 'Uzman bilgiyi, fiyatı ve uyumu kontrol listesiyle denetler. İçerikte gelir vaadi bulunmaz.', mode: 'onay', measure: 'Hatalı bilgiyle yayın 0' },
  { step: 'Zamanlama ve paylaşım', what: 'İçerik tek kuyruktan bütün kanallara zamanlanarak paylaşılır.', mode: 'otomatik', measure: 'Paylaşımların %80’i otomatik (Ocak)' },
  { step: 'Ölçüm ve geri besleme', what: 'UTM verisi GA4 ve Metrica’ya gider. Yorum ve mesajlardaki talepler CRM’e aktarılır.', mode: 'otomatik', measure: 'Talep 24 saat içinde masa başı ekibine ulaşır' },
];

/** Araç kararı (19 Ekim 2026): otomasyon açık kaynak ve kendi sunucumuzda; üretim ve paylaşım ücretli araçlarla. Tavan: parametre. */

export interface AiTool {
  tool: string;
  use: string;
  license: string;
}

export const aiTools: AiTool[] = [
  { tool: 'n8n', use: 'Hattı otomatik çalıştırır: kaynak toplar, kuyruğu yönetir, yorum ve mesajlardaki talebi CRM’e taşır.', license: 'Açık kaynak, kendi sunucumuzda (lisans 0 ₺)' },
  { tool: 'Claude', use: 'Senaryo, açılış cümlesi, altyazı metni ve makale taslağı', license: 'Ücretli abonelik' },
  { tool: 'ElevenLabs', use: 'Türkçe seslendirme', license: 'Ücretli abonelik' },
  { tool: 'CapCut Pro', use: 'Kurgu, otomatik altyazı ve marka şablonları', license: 'Ücretli abonelik' },
  { tool: 'Canva Pro', use: 'Kapak, kaydırmalı görsel seti (carousel) ve görsel şablonlar', license: 'Ücretli abonelik' },
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
  { channel: 'YouTube Shorts', content: 'Ürün yenilikleri ve nasıl yapılır videoları', frequency: 'Günde 1–2' },
  { channel: 'TikTok', content: 'Dikey videoların aynısı', frequency: 'Günde 1–2' },
  { channel: 'LinkedIn', content: 'Ürün yenilikleri ve pazar içgörüsü (kurumsal dil)', frequency: 'Haftada 3' },
  { channel: 'Facebook sayfası ve satıcı grupları', content: 'Nasıl yapılır videoları ve eğitim davetleri', frequency: 'Haftada 5' },
  { channel: 'istoc.com blog', content: 'Tam makale (nasıl yapılır ve pazar içgörüsü)', frequency: 'Haftada 3 (Ocak)' },
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
  { pillar: 'Ürün yenilikleri', what: 'Her geliştirme döneminde (sprint) çıkan yeni özellik 60 saniyede anlatılır', source: 'yazilim', sourceNote: 'Sprint sürüm notları (taslağı asistan hazırlar)', format: '30–45 sn ekran videosu', perWeek: 4, measure: 'Videodan siteye geçiş (UTM)', example: '“Toplu ürün yükleme artık 3 adımda”' },
  { pillar: 'Nasıl yapılır', what: 'Satıcının istoc.com’u kullanması için adım adım anlatım', source: 'pazarlamaci', sourceNote: 'CRM’de en sık sorulan 10 soru ve M1–M5 eğitim modülleri', format: '60–90 sn ekran kaydı + tam makale', perWeek: 4, measure: 'İçerikten kayıt', example: '“Telefonla ürün fotoğrafı: 3 kural”' },
  { pillar: 'Satıcı hikâyeleri', what: 'Gerçek bir satıcının istoc.com deneyimi, yazılı izniyle anlatılır', source: 'saha-uzmani', sourceNote: 'Saha ziyaretleri ve aktif satıcılar', format: '45–60 sn röportaj', perWeek: 2, measure: 'CRM’e talep', example: '“Bir İstoç satıcısının istoc.com’daki ilk 30 günü”' },
  { pillar: 'Pazar içgörüsü', what: 'Toptan talep ve ürün eğilimleri veriyle anlatılır', source: 'asistan', sourceNote: 'istoc.com arama ve talep verisi. Veriyi asistan derler.', format: 'Carousel + tam makale', perWeek: 2, measure: 'Kaydetme ve paylaşım', example: '“Bu hafta en çok aranan 5 ürün grubu”' },
  { pillar: 'Eğitim ve etkinlik', what: 'Her iş günü saat 17:00’deki eğitimin daveti ve kısa kesiti', source: 'organizator', sourceNote: 'Organizatör eğitimleri (7 Aralık’tan)', format: 'Davet hikâyesi + 30 sn kesit', perWeek: 5, measure: 'Eğitime kayıt', example: '“Yarın 17:00: katalog eğitimi, ofis toplantı salonu”' },
  { pillar: 'Temsilci programı', what: 'Bağımsız temsilcinin ne yaptığı anlatılır. Gelir vaadi verilmez.', source: 'ekip-lideri', sourceNote: 'Hukuk teyitli kazanç planı (14 Kasım)', format: 'Bilgilendirme videosu', perWeek: 1, measure: 'Başvuru (en fazla ~50 / hafta)', example: '“Bağımsız satış temsilcisi ne yapar?”' },
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

const BASE_DIGITAL_PLAN: DigitalPlanRow[] = [
  { stream: 'olcum', from: '2026-11-02', to: '2026-11-13', action: 'GTM, çerez onayı, GA4, Yandex Metrica, Search Console + Yandex Webmaster', target: 'Hepsi 13 Kasım tarihinde yayında', milestone: true },
  { stream: 'olcum', from: '2026-11-16', to: '2026-11-20', action: 'Meta Pixel ve Conversions API kurulur. UTM standardı ve CRM kaynak alanı eklenir.', target: 'Bütün paylaşımlarda UTM var' },
  { stream: 'olcum', from: '2026-11-23', to: '2027-01-30', action: 'Haftalık ölçüm panosu', target: 'Her pazartesi 09:00' },
  { stream: 'otomasyon', from: '2026-11-02', to: '2026-11-27', action: 'Araçlar kurulur (n8n, Claude, ElevenLabs, CapCut, Canva, Metricool). Hat v1 kaynaktan senaryoya ve üretime kadar yarı otomatik çalışır.', target: 'Paylaşımların %30’u otomatik, araç gideri tavanın içinde' },
  { stream: 'otomasyon', from: '2026-11-30', to: '2026-12-26', action: 'Hat v2: zamanlayıcı eklenir, yorumlar otomatik olarak CRM’e aktarılır.', target: 'Paylaşımların %60’ı otomatik, talep 24 saatte iletilir' },
  { stream: 'otomasyon', from: '2026-12-28', to: '2027-01-30', action: 'Hat v3: çok dilli altyazı ve tam otomatik zamanlama', target: 'Paylaşımların %80’i otomatik', milestone: true },
  { stream: 'uretim', from: '2026-11-09', to: '2026-11-28', action: 'İlk yayınlar (ürün yenilikleri ve nasıl yapılır videoları)', target: 'Günde 1 video' },
  { stream: 'uretim', from: '2026-11-30', to: '2026-12-26', action: 'Satıcı hikâyeleri ve eğitim davetleri eklenir', target: 'Günde 2 video, haftada 5 talep' },
  { stream: 'uretim', from: '2026-12-28', to: '2027-01-30', action: 'Altı içerik sütununun tamamı yayında', target: 'Günde 3 video, haftada 10 talep', milestone: true },
  { stream: 'plan', from: '2026-11-02', to: '2026-11-06', action: 'İçerik planı v1: 6 sütun, kanallar ve haftalık takvim', target: 'İsmail Karaca onayı: 6 Kasım', milestone: true },
  { stream: 'plan', from: '2026-11-30', to: '2026-12-04', action: 'İçerik planı v2: sütun oranları ilk ayın verisiyle güncellenir', target: 'Ölçüte göre en zayıf 2 sütun yeniden dengelenir' },
  { stream: 'plan', from: '2026-12-28', to: '2026-12-31', action: 'İçerik planı v3: Ocak takvimi', target: 'Haftada 18 video planlı' },
];

/** Tarihli dijital veriler: takvim parametresine göre kayar; araç tavanı parametreden. */
export function makeDigital(p: Params) {
  const d = daysBetween(DEFAULT_PARAMS.startDate, p.startDate);
  return {
    aiToolBudget: p.aiToolsMonthly,
    integrations: BASE_INTEGRATIONS.map((i) => ({ ...i, date: addDays(i.date, d), done: shiftText(i.done, d) })),
    digitalPlan: BASE_DIGITAL_PLAN.map((r) => ({
      ...r,
      from: addDays(r.from, d),
      to: addDays(r.to, d),
      action: shiftText(r.action, d),
      target: shiftText(r.target, d).replace('tavanın içinde', `≤ ${tl(p.aiToolsMonthly)} / ay`),
    })),
    planStart: addDays('2026-11-02', d),
    planEnd: addDays('2027-01-30', d),
    marks: [
      { date: addDays('2026-12-30', d), label: '60. gün' },
      { date: addDays('2027-01-30', d), label: '90. gün' },
    ],
  };
}
