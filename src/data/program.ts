import { addDays, daysBetween, longDate, monthName, nextMonth, shiftText, shortDate } from '../lib/dates';
import { int, num, pct, times, tl, tlExact } from '../lib/format';
import { DEFAULT_PARAMS, type Params } from './params';
import type { PlanRow, RoleKey, Status } from './types';

export const meta = {
  planDate: '19 Ekim 2026',
  siteTitle: 'iStoc Satış ve Pazarlama Planı',
  shortTitle: 'Satış ve Pazarlama Planı',
  description: 'iStoc 90 günlük satış ve pazarlama planı: kim, ne zaman, ne yapacak; hedefler ve eylem planı.',
};

/* ---------- Tipler ---------- */

export interface TargetRow {
  source: string;
  short: string;
  role: RoleKey;
  kayit: number[];
  aktif: number[];
}

export interface CalendarEvent {
  date: string;
  title: string;
  role: RoleKey;
  detail: string;
  status: Status;
}

export interface HiringStep {
  no: number;
  title: string;
  role: RoleKey;
  date: string;
  count: string;
  note: string;
  status: Status;
}

export interface GovNode {
  name: string;
  role?: RoleKey;
  children?: GovNode[];
}

export interface Checkpoint {
  day: string;
  date: string;
  aktif: number;
  kayit: number;
  ciro: number;
  rule: string;
}

export interface PayRule {
  who: string;
  role: RoleKey;
  status: string;
  fixed: string;
  cost: string;
  commission: string;
}

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

export interface Decision {
  topic: string;
  decision: string;
}

/** owner: karar veren (yalnız İsmail Karaca veya yatırımcı); preparer: seçenekleri hazırlayan. */
export interface OpenDecision {
  topic: string;
  proposal: string;
  owner: RoleKey;
  preparer?: RoleKey;
  deadline: string;
}

/* ---------- Sabit içerik ---------- */

/**
 * Kaynak × ay: kayıt (üye + aktif) ve yeni aktif satıcı, varsayılan hedeflerle (600 kayıt, 100 aktif).
 * Saha satırı Aralık’ta eklenen saha personelini içerir: kapasite açığı (Aralık 15 kayıt · 2 aktif, Ocak 30 · 6) onun hedefidir.
 */
const BASE_TARGET_PLAN: TargetRow[] = [
  { source: 'Saha ekibi ve ekip lideri', short: 'Saha ekibi', role: 'saha-uzmani', kayit: [80, 145, 195], aktif: [10, 22, 31] },
  { source: 'Çok katmanlı pazarlama ağı', short: 'MLM ağı', role: 'ekip-lideri', kayit: [0, 15, 30], aktif: [0, 3, 6] },
  { source: 'Organizatör eğitimleri (Aralık’tan)', short: 'Organizatör', role: 'organizator', kayit: [0, 20, 40], aktif: [0, 4, 8] },
  { source: 'Masa başı ve dijital (uzaktan)', short: 'Masa başı + dijital', role: 'pazarlamaci', kayit: [15, 25, 35], aktif: [2, 6, 8] },
];

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

/* ---------- Yardımcılar ---------- */

/** Tam sayıları toplamı `total` olacak biçimde orantılı ölçekler (en büyük kalan yöntemi). */
export function scaleInts(values: number[], total: number) {
  const sum = values.reduce((a, b) => a + b, 0);
  if (!sum) return values.map(() => 0);
  const raw = values.map((v) => (v * total) / sum);
  const out = raw.map(Math.floor);
  let rest = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest <= 0) break;
    out[i] += 1;
    rest -= 1;
  }
  return out;
}

function scalePlan(rows: TargetRow[], aktif: number, kayit: number): TargetRow[] {
  const a = scaleInts(rows.flatMap((r) => r.aktif), aktif);
  const k = scaleInts(rows.flatMap((r) => r.kayit), kayit);
  return rows.map((r, i) => ({ ...r, aktif: a.slice(i * 3, i * 3 + 3), kayit: k.slice(i * 3, i * 3 + 3) }));
}

/** Pazar günü ve 1 Ocak iş günü değildir (Cumartesi çalışılır). */
function firstWorkday(iso: string) {
  let day = iso;
  for (let i = 0; i < 3; i++) {
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    if (weekday === 0 || day.endsWith('-01-01')) day = addDays(day, 1);
    else break;
  }
  return day;
}

const millions = (value: number) => `${num(Math.round(value / 100_000) / 10)} milyon ₺`;

/* ---------- Fabrika ---------- */

export function makeProgram(p: Params) {
  const d1 = daysBetween(DEFAULT_PARAMS.startDate, p.startDate);
  const d2 = daysBetween(DEFAULT_PARAMS.decStartDate, p.decStartDate);
  const s1 = (iso: string) => addDays(iso, d1);
  const t1 = (text: string) => shiftText(text, d1);
  const t2 = (text: string) => shiftText(text, d2);

  const start = p.startDate;
  const dec = p.decStartDate;
  const day30 = addDays(start, 29);
  const day60 = addDays(start, 59);
  const day90 = addDays(start, 90);
  const period2Start = addDays(day90, 2);
  const firstDay = firstWorkday(start);
  const MONTHS = [monthName(start), monthName(nextMonth(start)), monthName(nextMonth(nextMonth(start)))];

  /* Hedefler ve ciro */
  const CIRO_TARGET = p.ciroTarget;
  const SUBSCRIPTION_EUR = p.subscriptionEur;
  const EUR_TRY = p.eurTry;
  const SUBSCRIPTION_TRY = p.subscriptionEur * p.eurTry;
  const ANNUAL_TRY = SUBSCRIPTION_TRY * p.annualMonths;
  const planRetention = p.planRetention / 100;
  const targetPlan = scalePlan(BASE_TARGET_PLAN, p.activeTarget, p.activeTarget + p.memberTarget).map((r) =>
    r.role === 'saha-uzmani' ? { ...r, source: `Saha ekibi (${p.sahaCount + p.sahaDecCount} kişi) ve ekip lideri` } : r,
  );
  const NEW_ACTIVE = [0, 1, 2].map((m) => targetPlan.reduce((sum, t) => sum + t.aktif[m], 0));
  const NEW_KAYIT = [0, 1, 2].map((m) => targetPlan.reduce((sum, t) => sum + t.kayit[m], 0));

  /** Aylık elde tutma r ile 90 günde ödeme (satıcı-ay): her ay yeni gelenler + önceki ayların yenilemeleri. */
  const payments = (r: number) => {
    const [a, b, c] = NEW_ACTIVE;
    const monthly = [a, b + a * r, c + b * r + a * r * r];
    return { monthly, renewals: [0, a * r, b * r + a * r * r], total: monthly[0] + monthly[1] + monthly[2] };
  };
  const reaches = (r: number) => payments(r).total * SUBSCRIPTION_TRY >= CIRO_TARGET;
  /** Hedef için gereken en düşük aylık elde tutma (tam yüzde); %100 de yetmezse null. */
  const retentionThreshold = (() => {
    if (!reaches(1)) return null;
    for (let r = 0; r <= 100; r++) if (reaches(r / 100)) return r / 100;
    return 1;
  })();
  const RETENTION_SCENARIOS = [...new Set([0, 0.5, retentionThreshold ?? 1, planRetention, 1])].sort((a, b) => a - b);
  const worstCiro = payments(0).total * SUBSCRIPTION_TRY;
  const gap = Math.max(0, CIRO_TARGET - worstCiro);

  const targets = [
    { label: 'Aktif satıcı', value: int(p.activeTarget), note: `${p.subscriptionEur} € / ay ödeyen · ${shortDate(day90)}` },
    { label: 'Üye satıcı', value: int(p.memberTarget), note: `Kayıtlı, ödemesiz · ${shortDate(day90)}` },
    { label: 'Ciro', value: `≥ ${tl(CIRO_TARGET)}`, note: `${shortDate(start)} – ${shortDate(day90)}` },
    {
      label: 'Aylık elde tutma',
      value: retentionThreshold === null ? 'Yetmez' : `≥ ${pct(retentionThreshold)}`,
      note: retentionThreshold === null ? 'Hedef yalnız abonelikle tutmaz' : 'Altında ciro açığı oluşur',
    },
  ];

  /* Kontrol noktaları (plan senaryosu) */
  const plan = payments(planRetention);
  let cumAktif = 0;
  let cumKayit = 0;
  let cumPaid = 0;
  const cumulative = [0, 1, 2].map((m) => {
    cumAktif += NEW_ACTIVE[m];
    cumKayit += NEW_KAYIT[m];
    cumPaid += plan.monthly[m];
    return { aktif: cumAktif, kayit: cumKayit, ciro: Math.round(cumPaid * SUBSCRIPTION_TRY) };
  });
  const checkpoints: Checkpoint[] = [
    { day: 'Gün 30', date: day30, ...cumulative[0], rule: t1('Ekip lideri seçildi mi (27 Kasım)? KPI kalibrasyonu.') },
    { day: 'Gün 60', date: day60, ...cumulative[1], rule: 'Sürdür / iyileştir / durdur.' },
    { day: 'Gün 90', date: day90, ...cumulative[2], rule: `2. çeyrek planı; Dönem 2 mesai düzeni ${longDate(period2Start)} itibarıyla.` },
  ];

  /* Kadro */
  const sahaDecLabel =
    p.sahaDecCount === 0
      ? ''
      : p.sahaDecCount === 1
        ? `${p.sahaCount + 1}. saha personeli`
        : `${p.sahaCount + 1}.–${p.sahaCount + p.sahaDecCount}. saha personeli`;
  const initialCount = p.asistanCount + p.masaCount + p.segikaCount + p.sahaCount + p.dijitalCount;
  const decStarters = [p.organizatorCount ? 'organizatör' : '', 'ekip lideri', sahaDecLabel].filter(Boolean);
  const decTitle = `${decStarters.join(', ').replace(/^./, (c) => c.toUpperCase())} başlar`;

  /* Ücret, prim ve kota */
  const salaries = {
    saha: p.sahaSalary,
    lead: p.sahaSalary + p.leadUplift,
    masa: p.masaSalary,
    segika: p.segikaSalary,
    dijital: p.minWage * p.dijitalMultiplier,
    asistan: p.minWage * p.asistanMultiplier,
    organizator: p.organizatorSalary,
  };
  const cost = (salary: number) => salary * p.costFactor;
  /** Saha kotası: ay içinde kendi işveren maliyeti kadar satış; sonrasında her satış prim doğurur. */
  const quota = cost(p.sahaSalary);
  const decMonths = Math.max(0, Math.round(daysBetween(dec, day90) / 30));
  const dijitalStart = p.asistanCount ? start : p.dijitalAltDate;
  const dijitalMonths = Math.max(0, Math.round(daysBetween(dijitalStart, day90) / 30));
  /** 90 günde işveren maliyeti (kişi-ay × aylık maliyet). Ekip lideri saha kadrosundan çıkar; farkı Aralık’tan. */
  const staffCost90 = [
    [p.sahaCount * 3 + p.sahaDecCount * decMonths, salaries.saha],
    [decMonths, p.leadUplift],
    [p.masaCount * 3, salaries.masa],
    [p.segikaCount * 3, salaries.segika],
    [p.dijitalCount * dijitalMonths, salaries.dijital],
    [p.asistanCount * 3, salaries.asistan],
    [p.organizatorCount * decMonths, salaries.organizator],
  ].reduce((sum, [months, salary]) => sum + cost(months * salary), 0);
  const sahaCost90 = cost((p.sahaCount * 3 + p.sahaDecCount * decMonths) * p.sahaSalary);
  const maxPayout = p.commission + p.sponsorShare + p.leadTeamShare;

  /** Çarpan verilirse asgari ücret çarpanı yazılır; verilmezse net ₺ karar (kullanıcı kararı 2026-10-27). */
  const sgk = (who: string, role: RoleKey, salary: number, multiplier?: number): PayRule => ({
    who,
    role,
    status: 'SGK’lı çalışan',
    fixed: multiplier ? `${tl(salary)} maaş / ay (${times(multiplier)} asgari ücret)` : `${tl(salary)} maaş / ay (net)`,
    cost: `${tl(cost(salary))} / ay`,
    commission: 'Yok (yalnız maaş)',
  });

  const payRules: PayRule[] = [
    {
      who: 'Saha satış personeli',
      role: 'saha-uzmani',
      status: 'SGK’lı çalışan',
      fixed: `${tl(p.sahaSalary)} maaş / ay`,
      cost: `${tl(cost(p.sahaSalary))} / ay (maaş × ${num(p.costFactor)})`,
      commission: `Kota: ay içinde ${tl(quota)} satış; sonrasında satış başına ${tl(p.commission)}`,
    },
    {
      who: `Ekip lideri (saha ekibinden, ${shortDate(dec)})`,
      role: 'ekip-lideri',
      status: 'SGK’lı çalışan',
      fixed: `${tl(salaries.lead)} maaş / ay (saha + ${tl(p.leadUplift)} liderlik farkı)`,
      cost: `${tl(cost(salaries.lead))} / ay`,
      commission: `Kendi satışı saha kuralıyla (kota ${tl(cost(salaries.lead))}); ekibin her satışından ${tl(p.leadTeamShare)}`,
    },
    {
      who: 'MLM saha temsilcisi',
      role: 'ekip-lideri',
      status: 'Çalışan değil: kendi şirketi, hizmet faturası keser',
      fixed: 'Yok',
      cost: '0 ₺ sabit',
      commission: `İlk satıştan itibaren satış başına ${tl(p.commission)}; getirdiği temsilcinin her satışından ${tl(p.sponsorShare)} sponsor payı (tek seviye)`,
    },
    sgk('Masa başı (CRM)', 'pazarlamaci', salaries.masa),
    sgk('Segika masa başı (CRM)', 'segika', salaries.segika),
    sgk('Dijital pazarlama', 'dijital-pazarlama', salaries.dijital, p.dijitalMultiplier),
    sgk('Asistan', 'asistan', salaries.asistan, p.asistanMultiplier),
    sgk('Organizatör', 'organizator', salaries.organizator),
  ];

  /* Takvim */
  const calendarEvents: CalendarEvent[] = [
    { date: p.metaStartDate, title: 'Meta reklamları başlar', role: 'yonetici', detail: `${tl(p.metaWeekly)} / hafta, sürekli · sorumlu İsmail Karaca`, status: 'karar' },
    { date: s1('2026-10-28'), title: 'Teklifler', role: 'yonetici', detail: `${initialCount} kişi: asistan, masa başı, Segika, ${p.sahaCount} saha, dijital`, status: 'karar' },
    { date: s1('2026-10-30'), title: 'Sözleşme ve SGK', role: 'yonetici', detail: 'Fazla çalışma için yazılı onay dahil', status: 'karar' },
    {
      date: start,
      title: `${initialCount} kişi başlar`,
      role: 'saha-uzmani',
      detail: `Asistan, masa başı (CRM), Segika (CRM), saha ekibi (${p.sahaCount}), dijital pazarlama · ilk iş günü ${shortDate(firstDay)}`,
      status: 'karar',
    },
    { date: s1('2026-11-16'), title: 'Temsilci reklamları başlar', role: 'dijital-pazarlama', detail: `Haftada en fazla ~${int(p.applicationsWeekly)} başvuru`, status: 'karar' },
    { date: s1('2026-11-23'), title: 'İlk MLM bilgilendirme', role: 'ekip-lideri', detail: 'Ofis toplantı salonu', status: 'oneri' },
    { date: s1('2026-11-27'), title: 'Ekip lideri kararı', role: 'ekip-lideri', detail: 'Puan tablosuyla, içeriden', status: 'karar' },
    { date: dec, title: decTitle, role: 'organizator', detail: t2('Eğitimler 7 Aralık’tan itibaren her iş günü 17:00'), status: 'karar' },
    { date: day60, title: '60. gün kontrolü', role: 'yatirimci', detail: `≥ ${cumulative[1].aktif} aktif satıcı · ≥ ${millions(cumulative[1].ciro)}`, status: 'karar' },
    { date: p.dijitalAltDate, title: 'Asistan yoksa: dijital başlar', role: 'dijital-pazarlama', detail: `İlk iş günü ${shortDate(firstWorkday(p.dijitalAltDate))}`, status: 'bekliyor' },
    { date: day90, title: '90. gün değerlendirmesi', role: 'yatirimci', detail: `${int(p.activeTarget)} aktif · ${int(p.memberTarget)} üye · ≥ ${tl(CIRO_TARGET)}`, status: 'karar' },
  ].sort((a, b) => a.date.localeCompare(b.date)) as CalendarEvent[];

  /** İstihdam sırası (kararınız); Segika sonradan eklendi. */
  const hiringOrder: HiringStep[] = [
    { no: 1, title: 'İsmail Karaca', role: 'yonetici', date: 'Şimdi', count: '—', note: 'Strateji ve operasyon; dijital pazarlama gelene kadar Meta reklamları', status: 'karar' },
    { no: 2, title: 'Asistan', role: 'asistan', date: longDate(start), count: String(p.asistanCount), note: `Onay bekliyor; yoksa dijital pazarlama ${longDate(p.dijitalAltDate)} başlar`, status: 'bekliyor' },
    { no: 3, title: 'Masa başı pazarlama (CRM)', role: 'pazarlamaci', date: longDate(start), count: String(p.masaCount), note: 'Günde 60 arama · 3 randevu', status: 'karar' },
    { no: 4, title: 'Saha pazarlama ekibi', role: 'saha-uzmani', date: longDate(start), count: String(p.sahaCount), note: 'Kayıt, onboarding, abonelik; sonra ağla büyür', status: 'karar' },
    { no: 5, title: 'Dijital pazarlama', role: 'dijital-pazarlama', date: `${longDate(start)} (asistan yoksa ${longDate(p.dijitalAltDate)})`, count: String(p.dijitalCount), note: t1('Ölçüm (GA4, Yandex Metrica, GTM) 13 Kasım · Ocak’ta günde 3 video, %80 otomatik paylaşım'), status: 'karar' },
    { no: 6, title: 'Organizatör', role: 'organizator', date: longDate(dec), count: String(p.organizatorCount), note: 'Haftada 5 eğitim · ≥ 50 katılımcı', status: 'karar' },
    { no: 7, title: 'Saha pazarlama ekibi: Aralık takviyesi', role: 'saha-uzmani', date: longDate(dec), count: String(p.sahaDecCount), note: 'Kapasite açığını kapatır: 45 kayıt · 8 aktif satıcı', status: 'karar' },
    { no: 8, title: 'Segika masa başı (CRM)', role: 'segika', date: longDate(start), count: String(p.segikaCount), note: 'SGK teşvik yazılımı; masa başı rolünün kopyası', status: 'karar' },
  ];

  /* İsmail Karaca’nın eylem planı */
  const managerPlan: PlanRow[] = [
    { from: s1('2026-10-19'), to: s1('2026-10-31'), action: `Meta reklamları (${shortDate(p.metaStartDate)}), ${initialCount} kişinin işe alımı, CRM kurulumu`, target: t1('Sözleşmeler 30 Ekim · CRM 31 Ekim'), milestone: true },
    { from: s1('2026-11-02'), to: s1('2026-11-27'), action: `Kazanç planı hukuk teyidi; organizatör ve ${sahaDecLabel || 'saha'} işe alımı; ekip lideri kararı`, target: t1('Hukuk teyidi 14 Kasım · lider 27 Kasım') },
    { from: s1('2026-11-30'), to: day60, action: `${decTitle} (${shortDate(dec)}); 60. gün kontrolü`, target: `≥ ${cumulative[1].aktif} aktif satıcı (${shortDate(day60)})`, milestone: true },
    { from: s1('2027-01-04'), to: day90, action: `90. gün değerlendirmesi; Dönem 2 (45 saatlik düzen) ${longDate(period2Start)} itibarıyla; 2. çeyrek planı`, target: `Karar ${shortDate(day90)}`, milestone: true },
  ];

  /** Planlama panosundaki karar şeması (ağaç). */
  const governanceTree: GovNode = {
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
            name: `Kontrol: ${shortDate(day60)} ve ${shortDate(day90)}`,
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

  /* Mesai modeli (4857 sayılı İş Kanunu tavanları) */
  const OVERTIME_CAP = p.overtimeCap;
  const LEGAL_LIMITS = [
    { rule: 'Haftalık normal çalışma', limit: 'En çok 45 saat', source: '4857/63' },
    { rule: 'Günlük çalışma (fazla çalışma dahil)', limit: 'En çok 11 saat', source: '4857/63; Fazla Çalışma Yönetmeliği' },
    { rule: 'Yıllık fazla çalışma', limit: `En çok ${int(OVERTIME_CAP)} saat`, source: '4857/41' },
    { rule: 'Fazla çalışma ücreti', limit: 'Saat ücretinin %50 fazlası', source: '4857/41' },
    { rule: 'Fazla çalışma onayı', limit: `İşçinin yazılı onayı (sözleşmeyle, ${shortDate(s1('2026-10-30'))})`, source: 'Fazla Çalışma Yönetmeliği' },
    { rule: 'Ara dinlenme', limit: '7,5 saatten uzun günde 1 saat; 4–7,5 saatte 30 dk', source: '4857/68' },
    { rule: 'Hafta tatili', limit: '7 günde kesintisiz en az 24 saat (Pazar)', source: '4857/46' },
  ];
  const period1Weeks = Math.round((daysBetween(firstDay, day90) + 1) / 7);
  const decWeeks = Math.max(0, Math.round((daysBetween(dec, day90) + 1) / 7));
  /** Sayım işe girişten itibaren 12 ay (en temkinli yorum). */
  const workPeriods: WorkPeriod[] = [
    {
      name: 'Dönem 1: açılış (90 gün)',
      from: firstDay,
      to: day90,
      weeks: period1Weeks,
      weekday: 'Pzt–Cum 08:00–20:00 · 60 dk ara · 11 sa net',
      saturday: 'Cmt 08:00–13:30 · 30 dk ara · 5 sa net',
      weekly: 60,
      overtimePerWeek: 15,
      organizer: 'Cmt 08:00–15:30 (7 sa net): haftada 62 sa',
      organizerOvertimePerWeek: 17,
    },
    {
      name: 'Dönem 2: kalıcı düzen',
      from: period2Start,
      to: addDays(firstDay, 363),
      weeks: 52 - period1Weeks,
      weekday: 'Pzt–Cum 08:30–17:30 · 60 dk ara · 8 sa net',
      saturday: 'Cmt 08:00–13:30 · 30 dk ara · 5 sa net',
      weekly: 45,
      overtimePerWeek: 0,
      organizer: 'Pzt–Cum 10:30–19:30 (17:00 eğitimi dahil), Cmt 10:00–15:30: haftada 45 sa',
      organizerOvertimePerWeek: 0,
    },
  ];
  /** Dönem 1’de kişi başı kullanılan fazla çalışma; kalan hak yalnız kampanya haftalarında, yazılı onayla. */
  const overtimeUsed = {
    kasim: period1Weeks * workPeriods[0].overtimePerWeek,
    aralik: decWeeks * workPeriods[0].overtimePerWeek,
    organizator: decWeeks * workPeriods[0].organizerOvertimePerWeek,
  };
  /** Fazla çalışma saat ücreti: maaş / 225 saat, %50 zamlı (saha maaşı üzerinden). */
  const overtimeHourly = (p.sahaSalary / 225) * 1.5;

  /* Kesinleşen kararlar (19 Ekim 2026) */
  const decisions: Decision[] = [
    {
      topic: 'Ücret, prim ve kota',
      decision: `İşveren maliyeti = maaş × ${num(p.costFactor)}. Saha satış ${tl(p.sahaSalary)} maaş; kota ay içinde ${tl(quota)} satış, sonrasında satış başına ${tl(p.commission)} prim. MLM temsilcisi maaşsız; satış başına ${tl(p.commission)}, hizmet faturasıyla.`,
    },
    {
      topic: 'Diğer rollerin maaşları',
      decision: `Net maaş (kullanıcı kararı 27 Ekim 2026): masa başı ${tl(salaries.masa)}, Segika ${tl(salaries.segika)}, organizatör ${tl(salaries.organizator)}. Asgari ücret (net ${tlExact(p.minWage)}) çarpanıyla: dijital ${times(p.dijitalMultiplier)} = ${tl(salaries.dijital)}, asistan ${times(p.asistanMultiplier)} = ${tl(salaries.asistan)}.`,
    },
    {
      topic: 'CRM aracı ve aşamaları',
      decision: t1('Frappe CRM: açık kaynak, kendi sunucumuzda, kullanıcı başına lisans yok (temsilciler ek maliyetsiz). Aşamalar prim kriterleriyle aynı; Segika için ayrı satış hattı. 31 Ekim’de kurulu; 1 Kasım’da tüm ekip CRM’de.'),
    },
    {
      topic: 'Yapay zekâ ve otomasyon araç bütçesi',
      decision: `Aylık en çok ${tl(p.aiToolsMonthly)}. Otomasyon n8n (açık kaynak, kendi sunucumuzda); ücretli: Claude, ElevenLabs, CapCut Pro, Canva Pro, Metricool. Tavan aşımı İsmail Karaca onayıyla; ${shortDate(day60)} kontrolünde ölçümle yeniden bakılır.`,
    },
    {
      topic: 'Kazanç planı (MLM)',
      decision: `Temsilci satış başına ${tl(p.commission)}; sponsor payı yalnız doğrudan getirdiği temsilcinin satışından ${tl(p.sponsorShare)} (tek seviye). Giriş ücreti, zorunlu alım, kayıt veya getirme primi yok. Bir satışta toplam pay en çok ${tl(maxPayout)}. ${t1('Sözleşme ve hukuk teyidi 14 Kasım.')}`,
    },
    {
      topic: 'Ekip lideri primi',
      decision: `Saha maaşı + ${tl(p.leadUplift)} liderlik farkı (${tl(salaries.lead)}); ekibin (saha + temsilci) her satışından ${tl(p.leadTeamShare)}; kendi satışı saha kuralıyla.`,
    },
    {
      topic: 'Kapasite açığı: 8 aktif, 45 kayıt',
      decision: `${sahaDecLabel ? `${sahaDecLabel.replace(/^./, (c) => c.toUpperCase())} ${longDate(dec)} itibarıyla başlar` : 'Aralık takviyesi yok'} (aynı ücret ve prim kuralı). Hedefi açığın kendisi: Aralık 15 kayıt · 2 aktif, Ocak 30 kayıt · 6 aktif. Ek sabit maliyet ${tl(cost(p.sahaDecCount * decMonths * p.sahaSalary))} (${decMonths} ay).`,
    },
    {
      topic: '4. aydan itibaren mesai modeli',
      decision: `Dönem 1 (${shortDate(firstDay)}–${shortDate(day90)}): günde 11 sa + Cmt 5 sa = haftada 60 sa (15 sa fazla çalışma); program başında başlayanlar ${overtimeUsed.kasim} sa, Aralık’ta başlayanlar ${overtimeUsed.aralik} sa (organizatör ${overtimeUsed.organizator}) kullanır. Dönem 2 (${longDate(period2Start)} itibarıyla): Pzt–Cum 8 sa + Cmt 5 sa = 45 sa, planlı fazla çalışma yok; kalan hak (${int(Math.max(0, OVERTIME_CAP - overtimeUsed.kasim))} sa ve üzeri) yalnız kampanya haftalarında yazılı onayla.`,
    },
    {
      topic: '“istoç SGK” notu ve Segika planı',
      decision: `Segika markalı SGK teşvik yazılımının satışı için pazarlama planı: masa başı pazarlama (CRM) rolünün kopyası; aynı görev, KPI, günlük düzen ve ücret yaklaşımı. ${p.segikaCount} kişi, ${longDate(start)}.`,
    },
  ];

  const openDecisions: OpenDecision[] = [
    { topic: 'Asistan alınacak mı?', proposal: `Alınmazsa dijital pazarlama ${longDate(p.dijitalAltDate)} itibarıyla başlar.`, owner: 'yatirimci', deadline: s1('2026-10-26') },
    {
      topic: 'İlk pazarlama: RFQ reklamları (alıcı + satıcı)',
      proposal:
        'Alıcıya yönelik RFQ (alış talebi toplama) reklamı; paralelinde satıcıya yönelik “talebe teklif ver” reklamı. Tavuk-yumurta sorununu çözer ve saha ekibinin söylemini güçlendirir (“istoc.com’da şu an gerçek alıcı talebi var”). Müşteri edinmede ilk ücretli reklam olur (bugün ücretli reklam yalnız işe alım için); kanal B kararıdır.',
      owner: 'yatirimci',
      deadline: s1('2026-10-26'),
    },
  ];

  return {
    MONTHS,
    CIRO_TARGET,
    SUBSCRIPTION_EUR,
    EUR_TRY,
    SUBSCRIPTION_TRY,
    ANNUAL_TRY,
    planRetention,
    targets,
    targetPlan,
    NEW_ACTIVE,
    NEW_KAYIT,
    payments,
    retentionThreshold,
    RETENTION_SCENARIOS,
    worstCiro,
    gap,
    checkpoints,
    calendarEvents,
    hiringOrder,
    managerPlan,
    governanceTree,
    salaries,
    quota,
    staffCost90,
    sahaCost90,
    maxPayout,
    decMonths,
    payRules,
    crmStages,
    OVERTIME_CAP,
    LEGAL_LIMITS,
    workPeriods,
    overtimeUsed,
    overtimeHourly,
    decisions,
    openDecisions,
    dates: { start, dec, day30, day60, day90, period2Start, firstDay },
    labels: { sahaDecLabel, decTitle, initialCount },
  };
}

export type Program = ReturnType<typeof makeProgram>;
