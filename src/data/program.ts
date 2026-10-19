import type { PlanRow, RoleKey, Status } from './types';

export const meta = {
  planDate: '19 Ekim 2026',
  siteTitle: 'iStoc Satış ve Pazarlama Planı',
  shortTitle: 'Satış ve Pazarlama Planı',
  description: 'iStoc 90 günlük satış ve pazarlama planı: kim, ne zaman, ne yapacak; hedefler ve eylem planı.',
};

/* ---------- 90 gün hedefi (1 Kasım 2026 – 30 Ocak 2027) ---------- */

export const CIRO_TARGET = 3_000_000;
export const SUBSCRIPTION_EUR = 399;
/** Planlama panosundaki kur (≈ 55,31 ₺/€). Güncel kurla değiştirilebilir. */
export const EUR_TRY = 719 / 13;
export const SUBSCRIPTION_TRY = SUBSCRIPTION_EUR * EUR_TRY;
/** Yıllık peşin: “yıllık 2 ay bedava” kuralıyla 10 aylık ücret. */
export const ANNUAL_TRY = SUBSCRIPTION_EUR * 10 * EUR_TRY;

export const targets = [
  { label: 'Aktif satıcı', value: '100', note: '399 € / ay ödeyen · 30 Ocak' },
  { label: 'Üye satıcı', value: '500', note: 'Kayıtlı, ödemesiz · 30 Ocak' },
  { label: 'Ciro', value: '≥ 3.000.000 ₺', note: '1 Kasım – 30 Ocak' },
  { label: 'Aylık elde tutma', value: '≥ %66', note: 'Altında ciro açığı oluşur' },
];

export const MONTHS = ['Kasım', 'Aralık', 'Ocak'];

/** Kaynak × ay: kayıt (üye + aktif) ve yeni aktif satıcı (ilk ödeme). */
/** `short`: grafik açıklamasındaki kısa ad. */
export const targetPlan: { source: string; short: string; role: RoleKey; kayit: number[]; aktif: number[]; gap?: boolean }[] = [
  { source: 'Saha ekibi (2 kişi) ve ekip lideri', short: 'Saha ekibi', role: 'saha-uzmani', kayit: [80, 130, 165], aktif: [10, 20, 25] },
  { source: 'Çok katmanlı pazarlama ağı', short: 'MLM ağı', role: 'ekip-lideri', kayit: [0, 15, 30], aktif: [0, 3, 6] },
  { source: 'Organizatör eğitimleri (Aralık’tan)', short: 'Organizatör', role: 'organizator', kayit: [0, 20, 40], aktif: [0, 4, 8] },
  { source: 'Masa başı ve dijital (uzaktan)', short: 'Masa başı + dijital', role: 'pazarlamaci', kayit: [15, 25, 35], aktif: [2, 6, 8] },
  { source: 'Kapasite açığı (karar 30 Aralık)', short: 'Kapasite açığı', role: 'yonetici', kayit: [0, 15, 30], aktif: [0, 2, 6], gap: true },
];

/** Aylık yeni aktif satıcı: Kasım 12, Aralık 35, Ocak 53 = 100. */
export const NEW_ACTIVE = [0, 1, 2].map((m) => targetPlan.reduce((sum, t) => sum + t.aktif[m], 0));

/** Aylık elde tutma r ile 90 günde ödeme (satıcı-ay): her ay yeni gelenler + önceki ayların yenilemeleri. */
export function payments(r: number) {
  const [a, b, c] = NEW_ACTIVE;
  const monthly = [a, b + a * r, c + b * r + a * r * r];
  return { monthly, renewals: [0, a * r, b * r + a * r * r], total: monthly[0] + monthly[1] + monthly[2] };
}

export const RETENTION_SCENARIOS = [0, 0.5, 0.66, 0.7, 1];

/* ---------- Takvim olayları (İstihdam takvimi) ---------- */

export interface CalendarEvent {
  date: string;
  title: string;
  role: RoleKey;
  detail: string;
  status: Status;
}

export const calendarEvents: CalendarEvent[] = [
  { date: '2026-10-20', title: 'Meta reklamları başlar', role: 'yonetici', detail: '5.000 ₺ / hafta, sürekli · sorumlu İsmail Karaca', status: 'karar' },
  { date: '2026-10-28', title: 'Teklifler', role: 'yonetici', detail: '5 kişi: asistan, masa başı, 2 saha, dijital', status: 'karar' },
  { date: '2026-10-30', title: 'Sözleşme ve SGK', role: 'yonetici', detail: 'Fazla çalışma için yazılı onay dahil', status: 'karar' },
  { date: '2026-11-01', title: '5 kişi başlar', role: 'saha-uzmani', detail: 'Asistan, masa başı (CRM), saha ekibi (2), dijital pazarlama · ilk iş günü 2 Kasım', status: 'karar' },
  { date: '2026-11-16', title: 'Temsilci reklamları başlar', role: 'dijital-pazarlama', detail: 'Haftada en fazla ~50 başvuru', status: 'karar' },
  { date: '2026-11-23', title: 'İlk MLM bilgilendirme', role: 'ekip-lideri', detail: 'Ofis toplantı salonu', status: 'oneri' },
  { date: '2026-11-27', title: 'Ekip lideri kararı', role: 'ekip-lideri', detail: 'Puan tablosuyla, içeriden', status: 'karar' },
  { date: '2026-12-01', title: 'Organizatör ve ekip lideri başlar', role: 'organizator', detail: 'Eğitimler 7 Aralık’tan itibaren her iş günü 17:00', status: 'karar' },
  { date: '2026-12-30', title: '60. gün kontrolü', role: 'yatirimci', detail: '≥ 47 aktif satıcı · ≥ 1,2 milyon ₺', status: 'karar' },
  { date: '2027-01-01', title: 'Asistan yoksa: dijital başlar', role: 'dijital-pazarlama', detail: 'Resmî tatil; ilk iş günü 2 Ocak', status: 'bekliyor' },
  { date: '2027-01-30', title: '90. gün değerlendirmesi', role: 'yatirimci', detail: '100 aktif · 500 üye · ≥ 3.000.000 ₺', status: 'karar' },
];

/** İstihdam sırası (kararınız). */
export const hiringOrder: { no: number; title: string; role: RoleKey; date: string; count: string; note: string; status: Status }[] = [
  { no: 1, title: 'İsmail Karaca', role: 'yonetici', date: 'Şimdi', count: '—', note: 'Strateji ve operasyon; dijital pazarlama gelene kadar Meta reklamları', status: 'karar' },
  { no: 2, title: 'Asistan', role: 'asistan', date: '1 Kasım 2026', count: '1', note: 'Onay bekliyor; yoksa dijital pazarlama 1 Ocak’a kayar', status: 'bekliyor' },
  { no: 3, title: 'Masa başı pazarlama (CRM)', role: 'pazarlamaci', date: '1 Kasım 2026', count: '1', note: 'Günde 60 arama · 3 randevu', status: 'karar' },
  { no: 4, title: 'Saha pazarlama ekibi', role: 'saha-uzmani', date: '1 Kasım 2026', count: '2', note: '90 günde 375 kayıt · 55 aktif satıcı; sonra ağla büyür', status: 'karar' },
  { no: 5, title: 'Dijital pazarlama', role: 'dijital-pazarlama', date: '1 Kasım 2026 (asistan yoksa 1 Ocak 2027)', count: '1', note: 'Ölçüm (GA4, Yandex Metrica, GTM) 13 Kasım · Ocak’ta günde 3 video, %80 otomatik paylaşım', status: 'karar' },
  { no: 6, title: 'Organizatör', role: 'organizator', date: '1 Aralık 2026', count: '1', note: 'Haftada 5 eğitim · ≥ 50 katılımcı', status: 'karar' },
];

/* ---------- İsmail Karaca’nın eylem planı (Gantt) ---------- */

export const managerPlan: PlanRow[] = [
  { from: '2026-10-19', to: '2026-10-31', action: 'Meta reklamları (20 Ekim), 5 kişinin işe alımı, paket içerikleri', target: 'Sözleşmeler 30 Ekim · paketler 31 Ekim', milestone: true },
  { from: '2026-11-02', to: '2026-11-27', action: 'Kazanç planı ve hukuk teyidi; organizatör işe alımı; ekip lideri kararı', target: 'Kazanç planı 14 Kasım · lider 27 Kasım' },
  { from: '2026-11-30', to: '2026-12-30', action: 'Kapasite açığı kararı; 60. gün kontrolü', target: 'Karar 30 Aralık', milestone: true },
  { from: '2027-01-04', to: '2027-01-30', action: '90. gün değerlendirmesi; 4. ay mesai modeli; 2. çeyrek planı', target: 'Karar 30 Ocak', milestone: true },
];

/* ---------- Karar yetkisi ve kontrol noktaları ---------- */

export interface GovNode {
  name: string;
  role?: RoleKey;
  children?: GovNode[];
}

/** Planlama panosundaki karar şeması (ağaç). */
export const governanceTree: GovNode = {
  name: 'Yatırımcı: ürün, bütçe, kayıp tavanı',
  role: 'yatirimci',
  children: [
    {
      name: 'İsmail Karaca: maliyet, kanıt, kapasite',
      role: 'yonetici',
      children: [
        {
          name: 'Harcama yetki sınırı',
          role: 'yonetici',
          children: [
            { name: 'Sınır içinde: İsmail Karaca karar verir', role: 'yonetici' },
            { name: 'Sınırı aşarsa: planlama toplantısı, yatırımcı karar verir', role: 'yatirimci' },
          ],
        },
        {
          name: 'Kanal: yalnız A veya B',
          role: 'yatirimci',
          children: [
            { name: 'A: İç satış ve saha (seçili)', role: 'saha-uzmani' },
            { name: 'B: Dijital müşteri edinme', role: 'dijital-pazarlama' },
          ],
        },
        {
          name: 'Kontrol: 30 Aralık ve 30 Ocak',
          role: 'yatirimci',
          children: [
            { name: 'Sınır içinde, kanıt yeterli: sürdür', role: 'saha-uzmani' },
            { name: 'Sınır içinde, kanıt yetersiz: iyileştir', role: 'organizator' },
            { name: 'Sınır doldu: durdur, yükümlülük, yatırımcı kararı', role: 'yonetici' },
          ],
        },
      ],
    },
  ],
};

/** Kontrol noktaları: tarih, ölçülebilir eşik, karar. Ciro %70 elde tutma senaryosuyla. */
export const checkpoints = [
  { day: 'Gün 30', date: '2026-11-30', aktif: 12, kayit: 95, ciro: 264_813, rule: 'Ekip lideri seçildi mi (27 Kasım)? KPI kalibrasyonu.' },
  { day: 'Gün 60', date: '2026-12-30', aktif: 47, kayit: 300, ciro: 1_222_554, rule: 'Sürdür / iyileştir / durdur; kapasite açığı kararı.' },
  { day: 'Gün 90', date: '2027-01-30', aktif: 100, kayit: 600, ciro: 3_062_565, rule: '2. çeyrek planı; 4. ay mesai modeli.' },
];

/* ---------- Karar bekleyenler ---------- */

/** owner: karar veren (yalnız İsmail Karaca veya yatırımcı); preparer: seçenekleri hazırlayan. */
export interface OpenDecision {
  topic: string;
  proposal: string;
  owner: RoleKey;
  preparer?: RoleKey;
  deadline: string;
}

export const openDecisions: OpenDecision[] = [
  { topic: 'Asistan alınacak mı?', proposal: 'Alınmazsa dijital pazarlama 1 Ocak’a kayar.', owner: 'yatirimci', deadline: '2026-10-26' },
  { topic: 'Ücret, prim ve kota tutarları', proposal: 'Teklif öncesi yazılı (sitede yayımlanmaz).', owner: 'yonetici', deadline: '2026-10-28' },
  { topic: '30K / 90K / 500K paket içerikleri', proposal: 'Ciro açığını kapatan ana araç; satıştan önce netleşir.', owner: 'yonetici', deadline: '2026-10-31' },
  { topic: 'CRM aracı ve aşamaları', proposal: 'Kayıt → onboarding → aktif → yenileme aşamaları.', owner: 'yonetici', deadline: '2026-10-31' },
  { topic: '“istoç SGK” notunun kapsamı', proposal: 'Masa başı SGK’yı da çalışacak mı?', owner: 'yonetici', deadline: '2026-10-31' },
  { topic: 'Kazanç planı (MLM) oranları', proposal: 'Unilevel, en çok 2 seviye; yalnız gerçek satıştan; hukuk teyidi.', owner: 'yonetici', deadline: '2026-11-14' },
  { topic: 'Ekip lideri primi', proposal: 'Liderlik farkı + ekip hedef primi.', owner: 'yonetici', preparer: 'asistan', deadline: '2026-11-27' },
  { topic: 'Yapay zekâ ve otomasyon araç bütçesi', proposal: 'Metin, ses, video, planlayıcı abonelikleri.', owner: 'yonetici', preparer: 'asistan', deadline: '2026-11-06' },
  { topic: 'Kapasite açığı: 8 aktif, 45 kayıt', proposal: '3. saha kişisi veya uzaktan satışın güçlenmesi.', owner: 'yatirimci', deadline: '2026-12-30' },
  { topic: '4. aydan itibaren mesai modeli', proposal: 'Yıllık 270 saat fazla çalışma sınırı nedeniyle.', owner: 'yonetici', deadline: '2027-01-30' },
];
