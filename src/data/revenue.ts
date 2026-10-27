/**
 * Gelir planı (/gelir-plani/; kullanıcı kararı 2026-10-27). Hedefler sayfası 90 günde 100 aktif satıcıyı hedef koyar;
 * bu sayfa aynı hedefe kadro kapasitesinden bakar: 1 saha personeli (sistem oturunca ikincisi), 1 CRM masa başı,
 * 1 organizatör (Aralık’tan), dijital pazarlama (satıcı kazanım reklamı + organik içerik; kullanıcı kararı 2026-10-27:
 * gider → gelir paradigması) ve bağımsız temsilciler ayda kaç yeni aktif satıcı getirir; 100 aktif, 500 üye, 1 M₺ ve
 * ciro hedefi hangi tarihte gelir; üç senaryo (kötümser, medyan, iyimser) ve başabaş için serbest girdili simülasyon
 * (ek saha personeli, reklam bütçesi ve kaynak ayıklama — kadro katkısı — dahil).
 *
 * Tek veri kaynağı parametreler: fiyat (€ / ay, yıllık = annualMonths ay ücreti), kur, elde tutma, kişi başına kapasite,
 * ikinci saha başlangıcı, yıllık peşin payı, kötümser çarpanlar. Kapasite rampası: kişinin ilk ayı %50, ikinci ayı %75.
 * Aktif satıcı = ilk ödemesini yapmış satıcı (hedefler sayfasıyla aynı tanım); “ödemeye devam eden” ayrıca gösterilir.
 */
import { addDays, daysBetween, longDate, monthName, monthStart, nextMonth, shortDate } from '../lib/dates';
import type { ScenarioId } from '../lib/scenario';
import type { Params } from './params';
import type { Program as ProgramModel } from './program';
import type { RoleKey } from './types';

export type { ScenarioId };

export interface Scenario {
  id: ScenarioId;
  name: string;
  role: RoleKey;
  /** Kapasite çarpanı */
  factor: number;
  /** Aylık elde tutma */
  retention: number;
  desc: string;
}

export interface RevMonth {
  iso: string;
  /** “Kasım 2026” */
  ad: string;
  /** “Kas 2026” */
  kisa: string;
  /** Program başından ay sırası (0 = ilk ay) */
  t: number;
}

export interface Source {
  id: string;
  name: string;
  short: string;
  role: RoleKey;
  start: string;
  /** Tam kapasitede aylık yeni aktif satıcı (temsilcilerde ay ay büyüyen kapasite) */
  capacity: number;
  /** Günlük/haftalık düzen (metin) */
  routine: string;
  /** Çarpansız (medyan) ay ay yeni aktif satıcı */
  values: number[];
}

export type MilestoneKind = 'aktif' | 'uye' | 'gelir';

export interface Milestone {
  id: string;
  name: string;
  kind: MilestoneKind;
  threshold: number;
  role: RoleKey;
  /** Eşiğin aşıldığı gün (ay içinde doğrusal); ufuk içinde değilse null */
  date: string | null;
  /** Program başından gün */
  days: number | null;
  /** Önceki hedeften gün */
  sinceDays: number | null;
  aylikGelir: number;
  kumulatif: number;
  kumAktif: number;
  kumKayit: number;
  odeyen: number;
}

/** Simülasyon girdileri: senaryo ya da başabaş filtreleri. */
export interface SimInputs {
  factor: number;
  retention: number;
  /** 0–1 */
  annualShare: number;
  priceEur: number;
  /** İkinci saha personelinin ayı (ISO ayın ilk günü); ufuk dışıysa gelmez */
  secondSahaIso: string;
  /** İkinciyle aynı ay başlayan ek saha personeli sayısı (başabaş filtresi) */
  extraSaha: number;
  /** Satıcı kazanım reklam bütçesi ₺ / ay (0 = reklam yok) */
  dijitalBudget: number;
  /** Ayıklanan kaynaklar (kadro katkısı: kaynak olmasaydı gelir ne olurdu) */
  exclude?: string[];
}

export interface Sim {
  inputs: SimInputs;
  abonelikTl: number;
  yillikTl: number;
  yeniAktif: number[];
  kayit: number[];
  /** Aylık ödeyen satıcı-ay (aylık abonelik) */
  aylikOdeyen: number[];
  /** O ay yıllık peşin ödeyen yeni satıcı */
  yillik: number[];
  /** Ödemeye devam eden satıcı: aylık ödeyenler + son 12 ayda yıllık ödeyenler */
  odeyen: number[];
  /** İlk ödemeler (aylık ve yıllık) ve yenilemeler, ₺ */
  ilkOdeme: number[];
  yenileme: number[];
  gelir: number[];
  kumulatif: number[];
  kumAktif: number[];
  kumKayit: number[];
  milestones: Milestone[];
}

export interface ScenarioSeries extends Sim {
  scenario: Scenario;
}

const KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
/** Ufuk: program başından itibaren ay */
export const HORIZON = 18;
/** Kişinin ilk ve ikinci ayında kapasite payı; sonra tam */
const RAMP = [0.5, 0.75];
/** Bağımsız temsilciler (MLM ağı): her ay eklenen temsilci, üst sınır ve temsilci başına aylık yeni aktif satıcı */
const REP_PER_MONTH = 2;
const REP_CAP = 10;
const REP_SALES = 1;

const r2 = (v: number) => Math.round(v * 100) / 100;
const monthNo = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
const daysInMonth = (iso: string) => daysBetween(monthStart(iso), nextMonth(iso));
const ramp = (k: number) => (k < 0 ? 0 : k < RAMP.length ? RAMP[k] : 1);

/** Süreyi gün, hafta ve ay olarak yazar: “137 gün (≈ 20 hafta, 4,5 ay)”. */
export function sure(days: number) {
  const hafta = Math.round(days / 7);
  const ay = Math.round((days / 30.4) * 10) / 10;
  return `${days} gün (≈ ${hafta} hafta, ${ay.toLocaleString('tr-TR')} ay)`;
}

export function revMonths(prog: ProgramModel): RevMonth[] {
  const start = monthStart(prog.dates.start);
  const months: RevMonth[] = [];
  for (let t = 0, iso = start; t < HORIZON; t++, iso = nextMonth(iso)) {
    months.push({ iso, ad: `${monthName(iso)} ${iso.slice(0, 4)}`, kisa: `${KISA[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`, t });
  }
  return months;
}

/** Reklam kapasitesi (tam): bütçe ÷ kayıt maliyeti × dönüşüm = aylık yeni aktif satıcı. */
export const adCapacity = (p: Params, budget: number) => (p.dijitalCostPerLead > 0 ? (budget / p.dijitalCostPerLead) * (p.dijitalLeadToActive / 100) : 0);

/** Dijital kanalın iki kolu ay ay (çarpansız): reklam (bütçeden) ve organik içerik; kayıt = reklam kayıtları. */
export function digitalSplit(p: Params, months: RevMonth[], budget: number) {
  const t0 = monthNo(months[0].iso);
  const adT = monthNo(monthStart(p.dijitalAdStartDate)) - t0;
  const orgT = monthNo(monthStart(p.dijitalOrganicStartDate)) - t0;
  const cap = adCapacity(p, budget);
  return {
    reklam: months.map((m) => r2(ramp(m.t - adT) * cap)),
    organik: months.map((m) => r2(ramp(m.t - orgT) * p.dijitalOrganicActivesMonthly)),
    kayit: months.map((m) => (p.dijitalCostPerLead > 0 ? r2((ramp(m.t - adT) * budget) / p.dijitalCostPerLead) : 0)),
    butce: months.map((m) => (m.t >= adT ? budget : 0)),
  };
}

/** Kaynaklar (çarpansız): kişi başına kapasite × ramp; ikinci saha, ek saha, organizatör ve dijital başlangıçlarına göre. */
export function buildSources(p: Params, prog: ProgramModel, months: RevMonth[], secondSahaIso: string, extraSaha = 0, dijitalBudget = p.dijitalAdBudgetMonthly): Source[] {
  const t0 = monthNo(months[0].iso);
  const ratio = p.activeTarget ? p.memberTarget / p.activeTarget : 5;
  const secondSaha = monthNo(monthStart(secondSahaIso)) - t0;
  const orgStart = monthNo(monthStart(p.decStartDate)) - t0;
  const dij = digitalSplit(p, months, dijitalBudget);
  const ek: Source[] =
    extraSaha > 0
      ? [
          {
            id: 'sahaEk',
            name: `Ek saha personeli (${extraSaha})`,
            short: `Ek saha ×${extraSaha}`,
            role: 'yonetici',
            start: monthStart(secondSahaIso),
            capacity: p.sahaActivesMonthly * extraSaha,
            routine: 'Başabaş filtresi: ikinci saha personeliyle aynı ay başlayan ek kişiler; her biri saha personeli kapasitesi ve rampasıyla.',
            values: months.map((m) => ramp(m.t - secondSaha) * p.sahaActivesMonthly * extraSaha),
          },
        ]
      : [];
  return [
    {
      id: 'saha1',
      name: 'Saha personeli 1',
      short: 'Saha 1',
      role: 'saha-uzmani',
      start: prog.dates.start,
      capacity: p.sahaActivesMonthly,
      routine: `Günde ≈ 8 ziyaret (İstoç çarşısı), haftada ≈ ${Math.round((p.sahaActivesMonthly * ratio) / 4.3)} kayıt, ayda ${p.sahaActivesMonthly} ilk ödeme; sistemi kurar: ziyaret rotası, kayıt kontrol listesi, CRM aşamaları.`,
      values: months.map((m) => ramp(m.t) * p.sahaActivesMonthly),
    },
    {
      id: 'saha2',
      name: 'Saha personeli 2 (sistem oturunca)',
      short: 'Saha 2',
      role: 'ekip-lideri',
      start: monthStart(secondSahaIso),
      capacity: p.sahaActivesMonthly,
      routine: 'Birinci saha personelinin rotasını ve kontrol listesini devralır; ikinci bölge. Başlangıç: sistem oturunca (parametre).',
      values: months.map((m) => ramp(m.t - secondSaha) * p.sahaActivesMonthly),
    },
    ...ek,
    {
      id: 'crm',
      name: 'CRM masa başı pazarlama',
      short: 'CRM',
      role: 'pazarlamaci',
      start: prog.dates.start,
      capacity: p.crmActivesMonthly,
      routine: `Günde ≈ 40 soğuk arama + 100 e-posta, haftada ≈ ${Math.round((p.crmActivesMonthly * ratio) / 4.3)} kayıt, ayda ${p.crmActivesMonthly} ilk ödeme; CRM kayıt sahibi; etkinlik haftalarında organizatöre destek (davet aramaları, kayıt masası).`,
      values: months.map((m) => ramp(m.t) * p.crmActivesMonthly),
    },
    {
      id: 'org',
      name: 'Organizatör',
      short: 'Organizatör',
      role: 'organizator',
      start: p.decStartDate,
      capacity: p.organizatorActivesMonthly,
      routine: `Ayda 2 etkinlik × ≈ 25 katılımcı (İstoç çarşısından), ≈ ${Math.round(p.organizatorActivesMonthly * ratio)} kayıt, ayda ${p.organizatorActivesMonthly} ilk ödeme; şirket içi eğitimler ve toptancı buluşmaları; CRM destekler.`,
      values: months.map((m) => ramp(m.t - orgStart) * p.organizatorActivesMonthly),
    },
    {
      id: 'dijital',
      name: 'Dijital pazarlama (reklam + içerik)',
      short: 'Dijital',
      role: 'dijital-pazarlama',
      start: monthStart(p.dijitalAdStartDate < p.dijitalOrganicStartDate ? p.dijitalAdStartDate : p.dijitalOrganicStartDate),
      capacity: r2(adCapacity(p, dijitalBudget) + p.dijitalOrganicActivesMonthly),
      routine: `Satıcı kazanım reklamı ${longDate(monthStart(p.dijitalAdStartDate))}’den: ayda ${dijitalBudget.toLocaleString('tr-TR')} ₺ ÷ ${p.dijitalCostPerLead.toLocaleString('tr-TR')} ₺/kayıt = ≈ ${Math.round(p.dijitalCostPerLead > 0 ? dijitalBudget / p.dijitalCostPerLead : 0)} kayıt, %${p.dijitalLeadToActive} dönüşümle ≈ ${adCapacity(p, dijitalBudget).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ilk ödeme; organik içerik (günde 3 video, haftada 10 CRM talebi) ${longDate(monthStart(p.dijitalOrganicStartDate))}’den ayda ${p.dijitalOrganicActivesMonthly}. Kayıtları CRM masa başı arar.`,
      values: months.map((m) => r2(dij.reklam[m.t] + dij.organik[m.t])),
    },
    {
      id: 'rep',
      name: 'Bağımsız temsilciler (MLM ağı)',
      short: 'Temsilciler',
      role: 'yazilim',
      start: p.decStartDate,
      capacity: REP_CAP * REP_SALES,
      routine: `${longDate(p.decStartDate)} itibarıyla her ay ${REP_PER_MONTH} yeni temsilci (en çok ${REP_CAP}); temsilci başına ayda ${REP_SALES} ilk ödeme; büyüme modeli sayfasındaki kazanç kuralı.`,
      values: months.map((m) => Math.min(REP_CAP, Math.max(0, m.t - orgStart) * REP_PER_MONTH) * REP_SALES),
    },
  ];
}

function milestoneDefs(p: Params): { id: string; name: string; kind: MilestoneKind; threshold: number; role: RoleKey }[] {
  return [
    { id: 'kurulum', name: 'Sistem kuruldu: ilk 10 aktif satıcı', kind: 'aktif', threshold: 10, role: 'yonetici' },
    { id: 'aktif50', name: '50 aktif satıcı', kind: 'aktif', threshold: 50, role: 'saha-uzmani' },
    { id: 'aktif100', name: `${p.activeTarget} aktif satıcı`, kind: 'aktif', threshold: p.activeTarget, role: 'ekip-lideri' },
    { id: 'uye', name: `${p.memberTarget} üye satıcı`, kind: 'uye', threshold: p.memberTarget, role: 'pazarlamaci' },
    { id: 'gelir1m', name: '1 M₺ kümülatif gelir', kind: 'gelir', threshold: 1_000_000, role: 'organizator' },
    { id: 'gelir3m', name: `${(p.ciroTarget / 1_000_000).toLocaleString('tr-TR')} M₺ kümülatif gelir`, kind: 'gelir', threshold: p.ciroTarget, role: 'yatirimci' },
    { id: 'aktif200', name: `${p.activeTarget * 2} aktif satıcı`, kind: 'aktif', threshold: p.activeTarget * 2, role: 'segika' },
  ];
}

/** Bir girdi kümesi için 18 aylık simülasyon: kaynaklar × çarpan, aylık/yıllık ödeme zinciri, gelir ve hedefler. */
export function simulate(p: Params, prog: ProgramModel, months: RevMonth[], inp: SimInputs): Sim {
  const sources = buildSources(p, prog, months, inp.secondSahaIso, inp.extraSaha, inp.dijitalBudget).filter((x) => !inp.exclude?.includes(x.id));
  const ratio = p.activeTarget ? p.memberTarget / p.activeTarget : 5;
  const abonelikTl = inp.priceEur * p.eurTry;
  const yillikTl = abonelikTl * p.annualMonths;
  const s = inp.annualShare;
  const yeniAktif = months.map((m) => r2(sources.reduce((t, x) => t + x.values[m.t], 0) * inp.factor));
  const kayit = yeniAktif.map((v) => r2(v * ratio));
  const yillik = yeniAktif.map((v) => r2(v * s));
  const aylikOdeyen: number[] = [];
  const yenileme: number[] = [];
  let onceki = 0;
  for (let t = 0; t < months.length; t++) {
    const y = r2(onceki * inp.retention);
    const m = r2(yeniAktif[t] * (1 - s) + y);
    yenileme.push(r2(y * abonelikTl));
    aylikOdeyen.push(m);
    onceki = m;
  }
  const odeyen = months.map((_, t) => r2(aylikOdeyen[t] + yillik.slice(Math.max(0, t - 11), t + 1).reduce((a, b) => a + b, 0)));
  const ilkOdeme = months.map((_, t) => r2(yillik[t] * yillikTl + yeniAktif[t] * (1 - s) * abonelikTl));
  const gelir = months.map((_, t) => r2(ilkOdeme[t] + yenileme[t]));
  const cum = (xs: number[]) => {
    let acc = 0;
    return xs.map((v) => (acc = r2(acc + v)));
  };
  const kumulatif = cum(gelir);
  const kumAktif = cum(yeniAktif);
  const kumKayit = cum(kayit);
  /** Eşiğin aşıldığı tarih: ay içinde doğrusal. */
  const when = (xs: number[], threshold: number) => {
    const t = xs.findIndex((v) => v >= threshold);
    if (t < 0) return null;
    const prev = t ? xs[t - 1] : 0;
    const frac = xs[t] === prev ? 1 : (threshold - prev) / (xs[t] - prev);
    const iso = months[t].iso;
    return { t, date: addDays(iso, Math.min(daysInMonth(iso) - 1, Math.max(0, Math.round(frac * daysInMonth(iso))))) };
  };
  // Hedefler takvim sırasında (ufuk dışındakiler sonda, tanım sırasıyla); “önceki hedeften” bu sıraya göre.
  const hits = milestoneDefs(p).map((d, i) => ({ d, i, hit: when(d.kind === 'aktif' ? kumAktif : d.kind === 'uye' ? kumKayit : kumulatif, d.threshold) }));
  hits.sort((a, b) => (a.hit?.date ?? '9999').localeCompare(b.hit?.date ?? '9999') || a.i - b.i);
  let last = prog.dates.start;
  const milestones: Milestone[] = hits.map(({ d, hit }) => {
    const days = hit ? daysBetween(prog.dates.start, hit.date) : null;
    const sinceDays = hit ? daysBetween(last, hit.date) : null;
    if (hit) last = hit.date;
    const t = hit?.t ?? months.length - 1;
    return { ...d, date: hit?.date ?? null, days, sinceDays, aylikGelir: gelir[t], kumulatif: kumulatif[t], kumAktif: kumAktif[t], kumKayit: kumKayit[t], odeyen: odeyen[t] };
  });
  return { inputs: inp, abonelikTl, yillikTl, yeniAktif, kayit, aylikOdeyen, yillik, odeyen, ilkOdeme, yenileme, gelir, kumulatif, kumAktif, kumKayit, milestones };
}

export function makeRevenue(p: Params, prog: ProgramModel) {
  const months = revMonths(prog);
  const sources = buildSources(p, prog, months, p.secondSahaDate);
  const ratio = p.activeTarget ? p.memberTarget / p.activeTarget : 5;
  const optRetention = Math.min(0.9, prog.planRetention + 0.1);
  const scenarios: Scenario[] = [
    { id: 'kotumser', name: 'Kötümser', role: 'dijital-pazarlama', factor: p.pessimisticFactor / 100, retention: p.pessimisticRetention / 100, desc: `Kapasitenin %${p.pessimisticFactor}’i, aylık elde tutma %${p.pessimisticRetention}` },
    { id: 'medyan', name: 'Medyan', role: 'saha-uzmani', factor: 1, retention: prog.planRetention, desc: `Tam kapasite, aylık elde tutma %${Math.round(prog.planRetention * 100)} (plan senaryosu)` },
    { id: 'iyimser', name: 'İyimser', role: 'pazarlamaci', factor: 1.3, retention: optRetention, desc: `Kapasitenin %130’u, aylık elde tutma %${Math.round(optRetention * 100)}` },
  ];
  const inputsFor = (sc: Scenario, override: Partial<SimInputs> = {}): SimInputs => ({
    factor: sc.factor,
    retention: sc.retention,
    annualShare: p.annualShare / 100,
    priceEur: p.subscriptionEur,
    secondSahaIso: p.secondSahaDate,
    extraSaha: 0,
    dijitalBudget: p.dijitalAdBudgetMonthly,
    ...override,
  });
  const series: ScenarioSeries[] = scenarios.map((sc) => ({ scenario: sc, ...simulate(p, prog, months, inputsFor(sc)) }));
  const byId = Object.fromEntries(series.map((x) => [x.scenario.id, x])) as Record<ScenarioId, ScenarioSeries>;
  const rec = <T>(f: (x: ScenarioSeries) => T) => Object.fromEntries(series.map((x) => [x.scenario.id, f(x)])) as Record<ScenarioId, T>;

  /** 90 günde hedef için gereken aylık yeni aktif (plan) ile kadronun ilk üç ayı. */
  const need90 = Math.ceil(p.activeTarget / 3);
  const first3 = rec((x) => r2(x.yeniAktif.slice(0, 3).reduce((a, b) => a + b, 0)));

  /** Üye → aktif → devam eden hunisi: senaryonun elde tutma oranıyla 3., 6., 12. ayda hâlâ ödeyen. */
  const funnels = rec((x) => [
    { name: 'Üye satıcı (kayıt)', value: p.memberTarget },
    { name: 'Aktif satıcı (ilk ödeme)', value: p.activeTarget },
    { name: '3. ayda hâlâ ödeyen', value: Math.round(p.activeTarget * x.scenario.retention ** 2) },
    { name: '6. ayda hâlâ ödeyen', value: Math.round(p.activeTarget * x.scenario.retention ** 5) },
    { name: '12. ayda hâlâ ödeyen', value: Math.round(p.activeTarget * x.scenario.retention ** 11) },
  ]);

  /** Yıllık peşin payının etkisi: aynı senaryo, yıllık payı 0 (herkes aylık öder). */
  const monthlyOnly = rec((x) => {
    const m = simulate(p, prog, months, inputsFor(x.scenario, { annualShare: 0 }));
    return { gelir3m: m.milestones.find((k) => k.id === 'gelir3m')!, kum90: m.kumulatif[2], kum12: m.kumulatif[11] };
  });

  const pricing = [
    { paket: 'Aylık abonelik', fiyat: `${p.subscriptionEur} € / ay`, tl: prog.SUBSCRIPTION_TRY, note: 'Her ay yenilenir; elde tutma oranına tabi' },
    { paket: 'Yıllık peşin', fiyat: `${p.subscriptionEur * p.annualMonths} € / yıl`, tl: prog.ANNUAL_TRY, note: `${p.annualMonths} ay ücreti (${12 - p.annualMonths} ay bedava); nakit önden gelir, yıl boyunca kayıp yok` },
  ];

  const assumptions = [
    `Aktif satıcı = ilk ödemesini yapan satıcı (hedefler sayfasıyla aynı tanım); üye satıcı = kayıt (aktif başına ${ratio.toLocaleString('tr-TR')} kayıt: ${p.memberTarget} üye / ${p.activeTarget} aktif).`,
    `Fiyat: ${p.subscriptionEur} € / ay = ${Math.round(prog.SUBSCRIPTION_TRY).toLocaleString('tr-TR')} ₺ (kur ${p.eurTry.toLocaleString('tr-TR')} ₺/€); yıllık ${p.subscriptionEur * p.annualMonths} € = ${Math.round(prog.ANNUAL_TRY).toLocaleString('tr-TR')} ₺. Yeni satıcıların %${p.annualShare}’i yıllık peşin öder (parametre).`,
    `Kapasite (tam): saha personeli ${p.sahaActivesMonthly}, CRM masa başı ${p.crmActivesMonthly}, organizatör ${p.organizatorActivesMonthly} yeni aktif satıcı / ay; her kişinin ilk ayı %50, ikinci ayı %75. İkinci saha personeli ${longDate(monthStart(p.secondSahaDate))}; organizatör ve temsilciler ${longDate(p.decStartDate)}.`,
    `Dijital pazarlama (gider → gelir): satıcı kazanım reklamı ${longDate(monthStart(p.dijitalAdStartDate))}’den ayda ${p.dijitalAdBudgetMonthly.toLocaleString('tr-TR')} ₺; kayıt başına ${p.dijitalCostPerLead.toLocaleString('tr-TR')} ₺, kayıttan ilk ödemeye %${p.dijitalLeadToActive} → tam hızda ayda ${adCapacity(p, p.dijitalAdBudgetMonthly).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} yeni aktif; organik içerik ${longDate(monthStart(p.dijitalOrganicStartDate))}’den ayda ${p.dijitalOrganicActivesMonthly}. Reklam bütçesi nakit akışında ve başabaşta giderdir.`,
    `Bağımsız temsilciler: her ay ${REP_PER_MONTH} yeni temsilci, en çok ${REP_CAP}; temsilci başına ayda ${REP_SALES} ilk ödeme.`,
    `Senaryolar: kötümser kapasitenin %${p.pessimisticFactor}’i ve elde tutma %${p.pessimisticRetention}; medyan tam kapasite ve %${Math.round(prog.planRetention * 100)} (plan senaryosu); iyimser %130 ve %${Math.round(optRetention * 100)}. Seçim gelir planı ile nakit akış tablosunda ortaktır ve bu tarayıcıda saklanır.`,
    'Gelir = o ay yıllık peşin ödeyenler × yıllık ücret + aylık ödeyen satıcı-ay × aylık ücret; KDV ve tahsilat gecikmesi modellenmez. Hedef tarihleri ay içinde doğrusal hesaplanır.',
  ];

  return {
    months,
    sources,
    scenarios,
    series,
    byId,
    ratio,
    need90,
    first3,
    funnels,
    pricing,
    monthlyOnly,
    assumptions,
    planDay90: prog.dates.day90,
    labels: { start: longDate(prog.dates.start), startShort: shortDate(prog.dates.start) },
    inputsFor,
  };
}

export type Revenue = ReturnType<typeof makeRevenue>;
