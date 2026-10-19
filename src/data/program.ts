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

/**
 * Kaynak × ay: kayıt (üye + aktif) ve yeni aktif satıcı (ilk ödeme).
 * Saha satırı 3. saha personelini içerir (1 Aralık): kapasite açığı (Aralık 15 kayıt · 2 aktif, Ocak 30 · 6) onun hedefidir.
 */
/** `short`: grafik açıklamasındaki kısa ad. */
export const targetPlan: { source: string; short: string; role: RoleKey; kayit: number[]; aktif: number[] }[] = [
  { source: 'Saha ekibi (3 kişi) ve ekip lideri', short: 'Saha ekibi', role: 'saha-uzmani', kayit: [80, 145, 195], aktif: [10, 22, 31] },
  { source: 'Çok katmanlı pazarlama ağı', short: 'MLM ağı', role: 'ekip-lideri', kayit: [0, 15, 30], aktif: [0, 3, 6] },
  { source: 'Organizatör eğitimleri (Aralık’tan)', short: 'Organizatör', role: 'organizator', kayit: [0, 20, 40], aktif: [0, 4, 8] },
  { source: 'Masa başı ve dijital (uzaktan)', short: 'Masa başı + dijital', role: 'pazarlamaci', kayit: [15, 25, 35], aktif: [2, 6, 8] },
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
  { date: '2026-12-01', title: 'Organizatör, ekip lideri ve 3. saha personeli başlar', role: 'organizator', detail: 'Eğitimler 7 Aralık’tan itibaren her iş günü 17:00', status: 'karar' },
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
  { no: 7, title: 'Saha pazarlama ekibi: 3. kişi', role: 'saha-uzmani', date: '1 Aralık 2026', count: '1', note: 'Kapasite açığını kapatır: Aralık–Ocak 45 kayıt · 8 aktif satıcı', status: 'karar' },
];

/* ---------- İsmail Karaca’nın eylem planı (Gantt) ---------- */

export const managerPlan: PlanRow[] = [
  { from: '2026-10-19', to: '2026-10-31', action: 'Meta reklamları (20 Ekim), 5 kişinin işe alımı, paket içerikleri', target: 'Sözleşmeler 30 Ekim · paketler 31 Ekim', milestone: true },
  { from: '2026-11-02', to: '2026-11-27', action: 'Kazanç planı hukuk teyidi; organizatör ve 3. saha personeli işe alımı; ekip lideri kararı', target: 'Hukuk teyidi 14 Kasım · lider 27 Kasım' },
  { from: '2026-11-30', to: '2026-12-30', action: 'Organizatör, ekip lideri ve 3. saha personeli başlar (1 Aralık); 60. gün kontrolü', target: '≥ 47 aktif satıcı 30 Aralık', milestone: true },
  { from: '2027-01-04', to: '2027-01-30', action: '90. gün değerlendirmesi; 1 Şubat’ta 45 saatlik düzene geçiş (Dönem 2); 2. çeyrek planı', target: 'Karar 30 Ocak', milestone: true },
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
  { day: 'Gün 60', date: '2026-12-30', aktif: 47, kayit: 300, ciro: 1_222_554, rule: 'Sürdür / iyileştir / durdur.' },
  { day: 'Gün 90', date: '2027-01-30', aktif: 100, kayit: 600, ciro: 3_062_565, rule: '2. çeyrek planı; 1 Şubat’ta Dönem 2 mesai düzeni.' },
];

/* ---------- Ücret ve prim (kesin karar, 19 Ekim 2026) ---------- */

/** SGK’lı çalışanın işverene maliyeti = maaş × 2 (SGK, yemek, bilgisayar, vergi ve diğerleri). */
export const EMPLOYER_COST_FACTOR = 2;
export const SAHA_SALARY = 60_000;
export const COMMISSION_PER_SALE = 2_500;
/** Saha satış personeli, ay içinde kendi maliyeti kadar satış yaptıktan sonra prim kazanır. */
export const SAHA_COMMISSION_THRESHOLD = SAHA_SALARY * EMPLOYER_COST_FACTOR;
/** Ekip lideri: saha maaşı + liderlik farkı; ekibin (saha + temsilci) her satışından pay. */
export const LEAD_UPLIFT = 10_000;
export const LEAD_TEAM_SHARE = 250;
/** MLM sponsor payı: yalnız doğrudan getirdiği temsilcinin satışından, tek seviye. */
export const SPONSOR_SHARE = 500;

const tl = (value: number) => `${new Intl.NumberFormat('tr-TR').format(value)} ₺`;

export interface PayRule {
  who: string;
  role: RoleKey;
  status: string;
  fixed: string;
  cost: string;
  commission: string;
}

export const payRules: PayRule[] = [
  {
    who: 'Saha satış personeli',
    role: 'saha-uzmani',
    status: 'SGK’lı çalışan',
    fixed: `${tl(SAHA_SALARY)} maaş / ay`,
    cost: `${tl(SAHA_SALARY * EMPLOYER_COST_FACTOR)} / ay (maaş × ${EMPLOYER_COST_FACTOR})`,
    commission: `Ay içinde ${tl(SAHA_COMMISSION_THRESHOLD)} satıştan sonra satış başına ${tl(COMMISSION_PER_SALE)}`,
  },
  {
    who: 'Ekip lideri (saha ekibinden, 1 Aralık)',
    role: 'ekip-lideri',
    status: 'SGK’lı çalışan',
    fixed: `${tl(SAHA_SALARY + LEAD_UPLIFT)} maaş / ay (saha + ${tl(LEAD_UPLIFT)} liderlik farkı)`,
    cost: `${tl((SAHA_SALARY + LEAD_UPLIFT) * EMPLOYER_COST_FACTOR)} / ay`,
    commission: `Kendi satışı saha kuralıyla (eşik ${tl((SAHA_SALARY + LEAD_UPLIFT) * EMPLOYER_COST_FACTOR)}); ekibin her satışından ${tl(LEAD_TEAM_SHARE)}`,
  },
  {
    who: 'MLM saha temsilcisi',
    role: 'ekip-lideri',
    status: 'Çalışan değil: kendi şirketi, hizmet faturası keser',
    fixed: 'Yok',
    cost: '0 ₺ sabit',
    commission: `İlk satıştan itibaren satış başına ${tl(COMMISSION_PER_SALE)}; getirdiği temsilcinin her satışından ${tl(SPONSOR_SHARE)} sponsor payı (tek seviye)`,
  },
  {
    who: 'Diğer SGK’lı roller (masa başı, dijital, organizatör, asistan)',
    role: 'yonetici',
    status: 'SGK’lı çalışan',
    fixed: 'Karar bekliyor (28 Ekim)',
    cost: `Maaş × ${EMPLOYER_COST_FACTOR}`,
    commission: 'Karar bekliyor',
  },
];

/**
 * CRM aşamaları (Frappe CRM). Prim kazanım kabul kriterleri aşamalarla aynıdır: satış ancak Onboarding, Mağaza,
 * İlk ürünler ve Ödeme aşamalarının hepsi tamamlanınca prim doğurur. Her aşamadan “Kayıp”a geçiş neden alanıyla.
 */
export interface CrmStage {
  stage: string;
  rule: string;
  owner: string;
  commission: boolean;
}

export const crmStages: CrmStage[] = [
  { stage: 'Aday', rule: 'İletişim bilgisi ve kaynak (UTM / kanal) kayıtlı', owner: 'Masa başı, dijital, temsilci', commission: false },
  { stage: 'Randevu', rule: 'Saha veya temsilci ziyareti tarihli', owner: 'Masa başı', commission: false },
  { stage: 'Kayıt', rule: 'Üye satıcı: istoc.com hesabı açıldı', owner: 'Saha ekibi veya temsilci', commission: false },
  { stage: 'Onboarding', rule: 'Müşteri onboarding kontrol listesi tamam (48 saat içinde)', owner: 'Saha ekibi veya temsilci', commission: true },
  { stage: 'Mağaza açıldı', rule: 'istoc.com mağazası yayında', owner: 'Saha ekibi veya temsilci', commission: true },
  { stage: 'İlk ürünler', rule: 'İlk ürünler mağazaya yüklendi', owner: 'Saha ekibi veya temsilci', commission: true },
  { stage: 'Ödeme', rule: 'İlk ödeme tahsil edildi → aktif satıcı; prim hak edilir', owner: 'Saha ekibi veya temsilci', commission: true },
  { stage: 'Yenileme', rule: 'Aylık ödeme sürüyor; durursa Kayıp + neden', owner: 'Saha ekibi', commission: false },
];

/* ---------- Mesai modeli (4857 sayılı İş Kanunu tavanları) ---------- */

export const LEGAL_LIMITS = [
  { rule: 'Haftalık normal çalışma', limit: 'En çok 45 saat', source: '4857/63' },
  { rule: 'Günlük çalışma (fazla çalışma dahil)', limit: 'En çok 11 saat', source: '4857/63; Fazla Çalışma Yönetmeliği' },
  { rule: 'Yıllık fazla çalışma', limit: 'En çok 270 saat', source: '4857/41' },
  { rule: 'Fazla çalışma ücreti', limit: 'Saat ücretinin %50 fazlası', source: '4857/41' },
  { rule: 'Fazla çalışma onayı', limit: 'İşçinin yazılı onayı (sözleşmeyle, 30 Ekim)', source: 'Fazla Çalışma Yönetmeliği' },
  { rule: 'Ara dinlenme', limit: '7,5 saatten uzun günde 1 saat; 4–7,5 saatte 30 dk', source: '4857/68' },
  { rule: 'Hafta tatili', limit: '7 günde kesintisiz en az 24 saat (Pazar)', source: '4857/46' },
];

export const OVERTIME_CAP = 270;
/** Sayım işe girişten itibaren 12 ay (en temkinli yorum). */
export interface WorkPeriod {
  name: string;
  from: string;
  to: string;
  weeks: number;
  weekday: string;
  saturday: string;
  weekly: number;
  overtimePerWeek: number;
  organizer: string;
  organizerOvertimePerWeek: number;
}

export const workPeriods: WorkPeriod[] = [
  {
    name: 'Dönem 1: açılış (90 gün)',
    from: '2026-11-02',
    to: '2027-01-30',
    weeks: 13,
    weekday: 'Pzt–Cum 08:00–20:00 · 60 dk ara · 11 sa net',
    saturday: 'Cmt 08:00–13:30 · 30 dk ara · 5 sa net',
    weekly: 60,
    overtimePerWeek: 15,
    organizer: 'Cmt 08:00–15:30 (7 sa net): haftada 62 sa',
    organizerOvertimePerWeek: 17,
  },
  {
    name: 'Dönem 2: kalıcı düzen',
    from: '2027-02-01',
    to: '2027-10-30',
    weeks: 39,
    weekday: 'Pzt–Cum 08:30–17:30 · 60 dk ara · 8 sa net',
    saturday: 'Cmt 08:00–13:30 · 30 dk ara · 5 sa net',
    weekly: 45,
    overtimePerWeek: 0,
    organizer: 'Pzt–Cum 10:30–19:30 (17:00 eğitimi dahil), Cmt 10:00–15:30: haftada 45 sa',
    organizerOvertimePerWeek: 0,
  },
];

/**
 * Dönem 1’de kullanılan fazla çalışma (kişi başı). Kasım’da başlayanlar 13 hafta, 1 Aralık’ta başlayanlar
 * (organizatör, 3. saha) 9 hafta çalışır. Kalan hak yalnız kampanya haftalarında, yazılı onayla.
 */
export const overtimeUsed = {
  kasim: workPeriods[0].weeks * workPeriods[0].overtimePerWeek,
  aralik: 9 * workPeriods[0].overtimePerWeek,
  organizator: 9 * workPeriods[0].organizerOvertimePerWeek,
};

/** Fazla çalışma saat ücreti (aylık 225 saat esası, %50 zamlı). Saha maaşı brüt kabul edilir. */
export const overtimeHourly = (SAHA_SALARY / 225) * 1.5;

/* ---------- Kesinleşen kararlar ---------- */

export const decisions: { topic: string; decision: string; date: string }[] = [
  {
    topic: 'Ücret, prim ve kota',
    decision: `İşveren maliyeti = maaş × ${EMPLOYER_COST_FACTOR}. Saha satış ${tl(SAHA_SALARY)} maaş; ay içinde ${tl(SAHA_COMMISSION_THRESHOLD)} satıştan sonra satış başına ${tl(COMMISSION_PER_SALE)} prim. MLM temsilcisi maaşsız; satış başına ${tl(COMMISSION_PER_SALE)}, hizmet faturasıyla.`,
    date: '2026-10-19',
  },
  {
    topic: 'CRM aracı ve aşamaları',
    decision: 'Frappe CRM: açık kaynak, kendi sunucumuzda, kullanıcı başına lisans yok (temsilciler ek maliyetsiz). Aşamalar prim kriterleriyle aynı. 31 Ekim’de kurulu; 1 Kasım’da tüm ekip CRM’de.',
    date: '2026-10-19',
  },
  {
    topic: 'Yapay zekâ ve otomasyon araç bütçesi',
    decision: 'Aylık en çok 7.500 ₺ (Kasım–Ocak). Otomasyon n8n (açık kaynak, kendi sunucumuzda); ücretli: Claude, ElevenLabs, CapCut Pro, Canva Pro, Metricool. Tavan aşımı İsmail Karaca onayıyla; 30 Aralık’ta ölçümle yeniden bakılır.',
    date: '2026-10-19',
  },
  {
    topic: 'Kazanç planı (MLM)',
    decision: `Temsilci satış başına ${tl(COMMISSION_PER_SALE)}; sponsor payı yalnız doğrudan getirdiği temsilcinin satışından ${tl(SPONSOR_SHARE)} (tek seviye). Giriş ücreti, zorunlu alım, kayıt veya getirme primi yok. Bir satışta toplam pay en çok ${tl(COMMISSION_PER_SALE + SPONSOR_SHARE + LEAD_TEAM_SHARE)}. Sözleşme ve hukuk teyidi 14 Kasım.`,
    date: '2026-10-19',
  },
  {
    topic: 'Ekip lideri primi',
    decision: `Saha maaşı + ${tl(LEAD_UPLIFT)} liderlik farkı (${tl(SAHA_SALARY + LEAD_UPLIFT)}); ekibin (saha + temsilci) her satışından ${tl(LEAD_TEAM_SHARE)}; kendi satışı saha kuralıyla.`,
    date: '2026-10-19',
  },
  {
    topic: 'Kapasite açığı: 8 aktif, 45 kayıt',
    decision: `3. saha satış personeli 1 Aralık 2026’da başlar (aynı ücret ve prim kuralı). Hedefi açığın kendisi: Aralık 15 kayıt · 2 aktif, Ocak 30 kayıt · 6 aktif. Ek sabit maliyet ${tl(2 * SAHA_SALARY * EMPLOYER_COST_FACTOR)} (2 ay).`,
    date: '2026-10-19',
  },
  {
    topic: '4. aydan itibaren mesai modeli',
    decision: `Dönem 1 (2 Kasım–30 Ocak): günde 11 sa + Cmt 5 sa = haftada 60 sa (15 sa fazla çalışma); Kasım’da başlayanlar ${overtimeUsed.kasim} sa, 1 Aralık’ta başlayanlar ${overtimeUsed.aralik} sa (organizatör ${overtimeUsed.organizator}) kullanır. Dönem 2 (1 Şubat’tan): Pzt–Cum 8 sa + Cmt 5 sa = 45 sa, planlı fazla çalışma yok; kalan hak (${OVERTIME_CAP - overtimeUsed.kasim} sa ve üzeri) yalnız kampanya haftalarında yazılı onayla.`,
    date: '2026-10-19',
  },
  {
    topic: '“istoç SGK” notu',
    decision: 'Segika markasıyla sunulan SGK teşvik yazılımının satışı için de pazarlama planı kurulur.',
    date: '2026-10-19',
  },
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
  {
    topic: 'İlk pazarlama: RFQ reklamları (alıcı + satıcı)',
    proposal: 'Alıcıya yönelik RFQ (alış talebi toplama) reklamı; paralelinde satıcıya yönelik “talebe teklif ver” reklamı. Tavuk-yumurta sorununu çözer ve saha ekibinin söylemini güçlendirir (“istoc.com’da şu an gerçek alıcı talebi var”). Müşteri edinmede ilk ücretli reklam olur (bugün ücretli reklam yalnız işe alım için); kanal B kararıdır.',
    owner: 'yatirimci',
    deadline: '2026-10-26',
  },
  { topic: 'Diğer rollerin maaş tutarları', proposal: 'Masa başı, dijital pazarlama, organizatör, asistan. Kural kesin: işveren maliyeti = maaş × 2.', owner: 'yonetici', deadline: '2026-10-28' },
  { topic: 'Pazarlama çözümü paketleri: 30K, 90K, 500K ₺', proposal: 'Satıcıya abonelik dışında satılacak üç paket (tahtadaki bantlar). Ciro açığının en hızlı kapanış yolu, ör. 27 × 30K. Her paketin içeriği ve teslim kapsamı satıştan önce yazılmalı.', owner: 'yonetici', deadline: '2026-10-31' },
  { topic: 'Segika pazarlama planının kapsamı', proposal: 'SGK teşvik yazılımı için hedef müşteri, satan ekip, 90 günlük hedef ve sorumlu.', owner: 'yonetici', deadline: '2026-11-06' },
];
