/**
 * Gelir planı (/gelir-plani/; kullanıcı kararı 2026-10-27). Hedefler sayfası 90 günde 100 aktif satıcıyı hedef koyar;
 * bu sayfa aynı hedefe kadro kapasitesinden bakar: 1 saha personeli (sistem oturunca ikincisi), 1 CRM masa başı,
 * 1 organizatör (Aralık’tan), dijital pazarlama (satıcı kazanım reklamı + organik içerik; gider → gelir paradigması) ve
 * bağımsız temsilciler ayda kaç yeni aktif satıcı getirir; 100 aktif, 500 üye, 1 M₺ ve ciro hedefi hangi tarihte gelir;
 * üç senaryo (kötümser, medyan, iyimser) ve başabaş için serbest girdili simülasyon.
 *
 * Büyüme (kullanıcı kararı 2026-10-27: “ya ileri ya geri”; gelir düz çizgi olamaz): ₺ fiyat kurla her ay bileşik büyür,
 * temsilci ağı her ay genişler (üst sınıra kadar), reklam bütçesi LTV ÷ CAC ≥ 3 ise her 3 ayda ×1,5 ölçeklenir (tavana
 * kadar), kârlı senaryolarda ikinci sahadan sonra periyodik ek saha personeli gelir (kötümser: büyüme yok). Ufuk 24 ay.
 *
 * Tek veri kaynağı parametreler. Kapasite rampası: kişinin ilk ayı %50, ikinci ayı %75. Aktif satıcı = ilk ödemesini
 * yapmış satıcı (hedefler sayfasıyla aynı tanım); “ödemeye devam eden” ayrıca gösterilir. Model kaynaklarda doğrusaldır:
 * bir kaynağı ayıklayınca (`exclude`) kaybedilen gelir o kaynağın katkısıdır (kadro tablosu).
 */
import { addDays, daysBetween, longDate, monthName, monthStart, nextMonth, shortDate } from '../lib/dates';
import type { ScenarioId } from '../lib/scenario';
import { DEFAULT_PARAMS, type Params } from './params';
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
  /** Büyüme kuralı: ikinci sahadan sonra her N ayda +1 saha personeli (0 = yok) */
  sahaGrowthEvery: number;
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
  /** Tam kapasitede aylık yeni aktif satıcı (büyüyen kaynaklarda ufuk sonundaki kapasite) */
  capacity: number;
  /** Günlük/haftalık düzen (metin) */
  routine: string;
  /** Çarpansız ay ay yeni aktif satıcı */
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
  /** Satıcı kazanım reklamı başlangıç bütçesi ₺ / ay (0 = reklam yok) */
  dijitalBudget: number;
  /** Reklam ölçeklenmesi: LTV ÷ CAC ≥ 3 ise her 3 ayda ×1,5 (tavan `dijitalScaleMax`) */
  dijitalScale: boolean;
  /** Yıllık kur artışı 0–1: ₺ fiyat her ay bileşik büyür */
  fxGrowth: number;
  /** Büyüme kuralı: ikinci sahadan sonra her N ayda +1 saha personeli (0 = yok), `sahaMaxCount`’a kadar */
  sahaGrowthEvery: number;
  /** Ayıklanan kaynaklar (kadro katkısı: kaynak olmasaydı gelir ne olurdu) */
  exclude?: string[];
}

export interface Sim {
  inputs: SimInputs;
  /** İlk ayın fiyatları (₺) */
  abonelikTl: number;
  yillikTl: number;
  /** Ay ay ₺ fiyat (kur artışıyla) */
  fiyat: { abonelik: number[]; yillik: number[] };
  /** Ay ay reklam bütçesi (ölçeklenmiş) */
  butce: number[];
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
const monthNoOf = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
/** Ufuk (ay): senaryo başlangıcının ayından ufuk sonunun ayına kadar (varsayılan parametrelerle Ekim 2026 – Aralık 2027 = 15). */
export const horizonOf = (p: Pick<Params, 'simStartDate' | 'simEndDate'>) => monthNoOf(p.simEndDate) - monthNoOf(p.simStartDate) + 1;
/** Varsayılan parametrelerin ufku (testler ve metinler için). */
export const HORIZON = horizonOf(DEFAULT_PARAMS);
/** Kişinin ilk ve ikinci ayında kapasite payı; sonra tam */
const RAMP = [0.5, 0.75];
/** Temsilci başına aylık ilk ödeme */
const REP_SALES = 1;
/** Reklam ölçek kuralı: eşik ve adım */
export const SCALE_RULE = { threshold: 3, step: 1.5, everyMonths: 3 };

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

export function revMonths(p: Params): RevMonth[] {
  const start = monthStart(p.simStartDate);
  const n = Math.max(1, horizonOf(p));
  const months: RevMonth[] = [];
  for (let t = 0, iso = start; t < n; t++, iso = nextMonth(iso)) {
    months.push({ iso, ad: `${monthName(iso)} ${iso.slice(0, 4)}`, kisa: `${KISA[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`, t });
  }
  return months;
}

/** Satış çarpanı: ilk satış tarihinden önce 0, ilk satış ayında kalan gün oranı, sonra 1. */
export function saleFactor(p: Params, months: RevMonth[]): number[] {
  const ilk = monthNoOf(p.firstSaleDate);
  return months.map((m) => {
    const t = monthNoOf(m.iso);
    if (t < ilk) return 0;
    if (t > ilk) return 1;
    const gun = daysInMonth(m.iso);
    return r2((gun - (Number(p.firstSaleDate.slice(8, 10)) - 1)) / gun);
  });
}

/** Reklam kapasitesi (tam, ölçeksiz): bütçe ÷ kayıt maliyeti × dönüşüm = aylık yeni aktif satıcı. */
export const adCapacity = (p: Params, budget: number) => (p.dijitalCostPerLead > 0 ? (budget / p.dijitalCostPerLead) * (p.dijitalLeadToActive / 100) : 0);

/** Yeni satıcı başına beklenen gelir (ilk ay fiyatıyla): aylık ödeyen ömrü ve yıllık peşin payıyla. */
export function ltvOf(p: Params, inp: Pick<SimInputs, 'retention' | 'annualShare' | 'priceEur'>) {
  const abonelik = inp.priceEur * p.eurTry;
  return r2((1 - inp.annualShare) * (abonelik / Math.max(0.05, 1 - inp.retention)) + inp.annualShare * abonelik * p.annualMonths);
}

/** Ay ay ₺ fiyat: € sabit, kur yıllık `fxGrowth` ile bileşik büyür. */
export function priceSeries(p: Params, months: RevMonth[], inp: Pick<SimInputs, 'priceEur' | 'fxGrowth'>) {
  const g = Math.pow(1 + inp.fxGrowth, 1 / 12);
  const abonelik = months.map((m) => r2(inp.priceEur * p.eurTry * Math.pow(g, m.t)));
  return { abonelik, yillik: abonelik.map((v) => r2(v * p.annualMonths)) };
}

/** Reklam takvimi: ölçek çarpanı (LTV ÷ CAC kuralı), bütçe, kayıt, reklam ve organik yeni aktif (çarpansız). */
export function adSchedule(p: Params, months: RevMonth[], inp: SimInputs) {
  const t0 = monthNo(months[0].iso);
  const adT = monthNo(monthStart(p.dijitalAdStartDate)) - t0;
  const orgT = monthNo(monthStart(p.dijitalOrganicStartDate)) - t0;
  const cap = adCapacity(p, inp.dijitalBudget);
  const cac = cap * inp.factor > 0 ? inp.dijitalBudget / (cap * inp.factor) : null;
  const ltv = ltvOf(p, inp);
  const scales = inp.dijitalScale && inp.dijitalBudget > 0 && cac !== null && ltv / cac >= SCALE_RULE.threshold;
  const carpan = months.map((m) => (m.t < adT ? 0 : scales ? Math.min(p.dijitalScaleMax, Math.pow(SCALE_RULE.step, Math.floor((m.t - adT) / SCALE_RULE.everyMonths))) : 1));
  return {
    scales,
    ltv,
    cac,
    carpan,
    butce: months.map((m) => r2(inp.dijitalBudget * carpan[m.t])),
    kayit: months.map((m) => (p.dijitalCostPerLead > 0 ? r2((ramp(m.t - adT) * inp.dijitalBudget * carpan[m.t]) / p.dijitalCostPerLead) : 0)),
    reklam: months.map((m) => r2(ramp(m.t - adT) * cap * carpan[m.t])),
    organik: months.map((m) => r2(ramp(m.t - orgT) * p.dijitalOrganicActivesMonthly)),
  };
}

/** Büyüme kuralıyla gelen saha personeli başlangıç ayları (t): ikinci sahadan sonra her N ayda bir, üst sınıra kadar. */
export function growthHires(p: Params, months: RevMonth[], inp: Pick<SimInputs, 'secondSahaIso' | 'extraSaha' | 'sahaGrowthEvery'>): number[] {
  if (inp.sahaGrowthEvery <= 0) return [];
  const t0 = monthNo(months[0].iso);
  const secondT = monthNo(monthStart(inp.secondSahaIso)) - t0;
  const slots = Math.max(0, p.sahaMaxCount - 2 - inp.extraSaha);
  const out: number[] = [];
  for (let k = 1; k <= slots; k++) {
    const t = secondT + k * inp.sahaGrowthEvery;
    if (t >= months.length) break;
    out.push(t);
  }
  return out;
}

/** Kaynaklar (çarpansız): kişi başına kapasite × ramp; ikinci saha, ek saha, büyüme, organizatör, dijital ve temsilciler. */
export function buildSources(p: Params, prog: ProgramModel, months: RevMonth[], inp: SimInputs): Source[] {
  const t0 = monthNo(months[0].iso);
  const ratio = p.activeTarget ? p.memberTarget / p.activeTarget : 5;
  /** Program başlangıcı (işe alımlar; Kasım) senaryo başlangıcından (Ekim) sonra olabilir: rampa kişinin kendi ayından sayılır. */
  const startT = monthNo(monthStart(prog.dates.start)) - t0;
  const secondSaha = monthNo(monthStart(inp.secondSahaIso)) - t0;
  const orgStart = monthNo(monthStart(p.decStartDate)) - t0;
  const dij = adSchedule(p, months, inp);
  const hires = growthHires(p, months, inp);
  const ek: Source[] =
    inp.extraSaha > 0
      ? [
          {
            id: 'sahaEk',
            name: `Ek saha personeli (${inp.extraSaha})`,
            short: `Ek saha ×${inp.extraSaha}`,
            role: 'yonetici',
            start: monthStart(inp.secondSahaIso),
            capacity: p.sahaActivesMonthly * inp.extraSaha,
            routine: '“Ek saha personeli” seçeneğiyle eklenen kişiler ikinci saha personeliyle aynı ay başlar. Her birinin kapasitesi ve ilk aylardaki kademeli artışı saha personeliyle aynıdır.',
            values: months.map((m) => ramp(m.t - secondSaha) * p.sahaActivesMonthly * inp.extraSaha),
          },
        ]
      : [];
  const buyume: Source[] = hires.length
    ? [
        {
          id: 'sahaBuyume',
          name: `Büyüme: saha personeli (+${hires.length}, her ${inp.sahaGrowthEvery} ayda)`,
          short: `Büyüme saha +${hires.length}`,
          role: 'yatirimci',
          start: months[hires[0]].iso,
          capacity: p.sahaActivesMonthly * hires.length,
          routine: `İkinci saha personelinden sonra her ${inp.sahaGrowthEvery} ayda 1 saha personeli eklenir (${hires.map((t) => months[t].kisa).join(', ')}). Bu, büyüme kuralıdır. Saha personeli sayısı en çok ${p.sahaMaxCount} olur. Kötümser senaryoda büyüme yoktur.`,
          values: months.map((m) => r2(hires.reduce((t, h) => t + ramp(m.t - h), 0) * p.sahaActivesMonthly)),
        },
      ]
    : [];
  const repAt = (t: number) => Math.min(p.repCap, Math.max(0, t - orgStart) * p.repPerMonth);
  return [
    {
      id: 'saha1',
      name: 'Saha personeli 1',
      short: 'Saha 1',
      role: 'saha-uzmani',
      start: prog.dates.start,
      capacity: p.sahaActivesMonthly,
      routine: `İstoç çarşısında günde yaklaşık 8 ziyaret yapar. Haftada yaklaşık ${Math.round((p.sahaActivesMonthly * ratio) / 4.3)} kayıt ve ayda ${p.sahaActivesMonthly} ilk ödeme beklenir. Satış sistemini kurar: ziyaret rotası, kayıt kontrol listesi ve CRM aşamaları.`,
      values: months.map((m) => ramp(m.t - startT) * p.sahaActivesMonthly),
    },
    {
      id: 'saha2',
      name: 'Saha personeli 2 (sistem oturunca)',
      short: 'Saha 2',
      role: 'ekip-lideri',
      start: monthStart(inp.secondSahaIso),
      capacity: p.sahaActivesMonthly,
      routine: 'Birinci saha personelinin rotasını ve kontrol listesini devralır ve ikinci bölgede çalışır. Sistem oturunca başlar, başlangıç tarihi bir parametredir.',
      values: months.map((m) => ramp(m.t - secondSaha) * p.sahaActivesMonthly),
    },
    ...ek,
    ...buyume,
    {
      id: 'crm',
      name: 'CRM masa başı pazarlama',
      short: 'CRM',
      role: 'pazarlamaci',
      start: prog.dates.start,
      capacity: p.crmActivesMonthly,
      routine: `Günde yaklaşık 40 soğuk arama yapar ve 100 e-posta gönderir. Haftada yaklaşık ${Math.round((p.crmActivesMonthly * ratio) / 4.3)} kayıt ve ayda ${p.crmActivesMonthly} ilk ödeme beklenir. CRM kayıtlarından sorumludur ve dijital kanaldan gelen kayıtları arar. Etkinlik haftalarında davet aramaları ve kayıt masasıyla organizatöre destek verir.`,
      values: months.map((m) => ramp(m.t - startT) * p.crmActivesMonthly),
    },
    {
      id: 'org',
      name: 'Organizatör',
      short: 'Organizatör',
      role: 'organizator',
      start: p.decStartDate,
      capacity: p.organizatorActivesMonthly,
      routine: `Ayda 2 etkinlik düzenler, her birine İstoç çarşısından yaklaşık 25 kişi katılır. Bu etkinliklerden yaklaşık ${Math.round(p.organizatorActivesMonthly * ratio)} kayıt ve ayda ${p.organizatorActivesMonthly} ilk ödeme beklenir. Şirket içi eğitimler ve toptancı buluşmaları yapar, CRM masa başı personeli destek verir.`,
      values: months.map((m) => ramp(m.t - orgStart) * p.organizatorActivesMonthly),
    },
    {
      id: 'dijital',
      name: 'Dijital pazarlama (reklam + içerik)',
      short: 'Dijital',
      role: 'dijital-pazarlama',
      start: monthStart(p.dijitalAdStartDate < p.dijitalOrganicStartDate ? p.dijitalAdStartDate : p.dijitalOrganicStartDate),
      capacity: r2(adCapacity(p, inp.dijitalBudget) * carpanSon(dij.carpan) + p.dijitalOrganicActivesMonthly),
      routine: `Satıcı kazanım reklamı ${longDate(monthStart(p.dijitalAdStartDate))} tarihinde başlar. Ayda ${inp.dijitalBudget.toLocaleString('tr-TR')} ₺ ÷ ${p.dijitalCostPerLead.toLocaleString('tr-TR')} ₺/kayıt = yaklaşık ${Math.round(p.dijitalCostPerLead > 0 ? inp.dijitalBudget / p.dijitalCostPerLead : 0)} kayıt gelir. Dönüşüm %${p.dijitalLeadToActive} olunca yaklaşık ${adCapacity(p, inp.dijitalBudget).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ilk ödeme beklenir. ${dij.scales ? `LTV ÷ CAC oranı ${dij.cac ? (dij.ltv / dij.cac).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) : 'hesaplanamıyor'}. Oran en az ${SCALE_RULE.threshold} olduğu için bütçe her ${SCALE_RULE.everyMonths} ayda ${SCALE_RULE.step.toLocaleString('tr-TR')} katına çıkar. Bütçe en çok ${p.dijitalScaleMax} katına ulaşır.` : 'Ölçek kuralı sağlanmadığı için bütçe sabit kalır.'} Organik içerik günde 3 video ve haftada 10 CRM talebi demektir. Organik içerik ${longDate(monthStart(p.dijitalOrganicStartDate))} tarihinden itibaren ayda ${p.dijitalOrganicActivesMonthly} yeni aktif satıcı getirir. Kayıtları CRM masa başı personeli arar.`,
      values: months.map((m) => r2(dij.reklam[m.t] + dij.organik[m.t])),
    },
    {
      id: 'rep',
      name: 'Bağımsız temsilciler (MLM ağı)',
      short: 'Temsilciler',
      role: 'yazilim',
      start: p.decStartDate,
      capacity: p.repCap * REP_SALES,
      routine: `${longDate(p.decStartDate)} tarihinden itibaren ağa her ay ${p.repPerMonth} yeni temsilci katılır. Ağ en çok ${p.repCap} temsilciye ulaşır. Temsilci başına ayda ${REP_SALES} ilk ödeme beklenir. Kazanç kuralı büyüme modeli sayfasındadır.`,
      values: months.map((m) => repAt(m.t) * REP_SALES),
    },
  ];
}

const carpanSon = (carpan: number[]) => (carpan.length ? Math.max(1, carpan[carpan.length - 1]) : 1);

function milestoneDefs(p: Params): { id: string; name: string; kind: MilestoneKind; threshold: number; role: RoleKey }[] {
  return [
    { id: 'kurulum', name: 'İlk 10 satıcının ödeme yapması', kind: 'aktif', threshold: 10, role: 'yonetici' },
    { id: 'aktif50', name: '50 aktif satıcı', kind: 'aktif', threshold: 50, role: 'saha-uzmani' },
    { id: 'aktif100', name: `${p.activeTarget} aktif satıcı`, kind: 'aktif', threshold: p.activeTarget, role: 'ekip-lideri' },
    { id: 'uye', name: `${p.memberTarget} üye satıcı`, kind: 'uye', threshold: p.memberTarget, role: 'pazarlamaci' },
    { id: 'gelir1m', name: '1 M₺ kümülatif gelir', kind: 'gelir', threshold: 1_000_000, role: 'organizator' },
    { id: 'gelir3m', name: `${(p.ciroTarget / 1_000_000).toLocaleString('tr-TR')} M₺ kümülatif gelir`, kind: 'gelir', threshold: p.ciroTarget, role: 'yatirimci' },
    { id: 'aktif200', name: `${p.activeTarget * 2} aktif satıcı`, kind: 'aktif', threshold: p.activeTarget * 2, role: 'segika' },
  ];
}

/** Bir girdi kümesi için ufuk boyunca simülasyon: kaynaklar × çarpan, aylık/yıllık ödeme zinciri, kurla büyüyen fiyat, gelir ve hedefler. */
export function simulate(p: Params, prog: ProgramModel, months: RevMonth[], inp: SimInputs): Sim {
  const sources = buildSources(p, prog, months, inp).filter((x) => !inp.exclude?.includes(x.id));
  const ratio = p.activeTarget ? p.memberTarget / p.activeTarget : 5;
  const fiyat = priceSeries(p, months, inp);
  const abonelikTl = fiyat.abonelik[0];
  const yillikTl = fiyat.yillik[0];
  const s = inp.annualShare;
  const satis = saleFactor(p, months);
  const yeniAktif = months.map((m) => r2(sources.reduce((t, x) => t + x.values[m.t], 0) * inp.factor * satis[m.t]));
  const kayit = yeniAktif.map((v) => r2(v * ratio));
  const yillik = yeniAktif.map((v) => r2(v * s));
  const aylikOdeyen: number[] = [];
  const yenileme: number[] = [];
  let onceki = 0;
  for (let t = 0; t < months.length; t++) {
    const y = r2(onceki * inp.retention);
    const m = r2(yeniAktif[t] * (1 - s) + y);
    yenileme.push(r2(y * fiyat.abonelik[t]));
    aylikOdeyen.push(m);
    onceki = m;
  }
  const odeyen = months.map((_, t) => r2(aylikOdeyen[t] + yillik.slice(Math.max(0, t - 11), t + 1).reduce((a, b) => a + b, 0)));
  const ilkOdeme = months.map((_, t) => r2(yillik[t] * fiyat.yillik[t] + yeniAktif[t] * (1 - s) * fiyat.abonelik[t]));
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
  let last = p.simStartDate;
  const milestones: Milestone[] = hits.map(({ d, hit }) => {
    const days = hit ? daysBetween(p.simStartDate, hit.date) : null;
    const sinceDays = hit ? daysBetween(last, hit.date) : null;
    if (hit) last = hit.date;
    const t = hit?.t ?? months.length - 1;
    return { ...d, date: hit?.date ?? null, days, sinceDays, aylikGelir: gelir[t], kumulatif: kumulatif[t], kumAktif: kumAktif[t], kumKayit: kumKayit[t], odeyen: odeyen[t] };
  });
  const butce = inp.exclude?.includes('dijital') ? months.map(() => 0) : adSchedule(p, months, inp).butce;
  return { inputs: inp, abonelikTl, yillikTl, fiyat, butce, yeniAktif, kayit, aylikOdeyen, yillik, odeyen, ilkOdeme, yenileme, gelir, kumulatif, kumAktif, kumKayit, milestones };
}

export function makeRevenue(p: Params, prog: ProgramModel) {
  const months = revMonths(p);
  const ratio = p.activeTarget ? p.memberTarget / p.activeTarget : 5;
  const optRetention = Math.min(0.9, prog.planRetention + 0.1);
  const scenarios: Scenario[] = [
    { id: 'kotumser', name: 'Kötümser', role: 'dijital-pazarlama', factor: p.pessimisticFactor / 100, retention: p.pessimisticRetention / 100, sahaGrowthEvery: 0, desc: `Kapasitenin yüzde ${p.pessimisticFactor} kadarı kullanılır. Aylık yenileme %${p.pessimisticRetention} olur. Saha kadrosu büyümez.` },
    { id: 'medyan', name: 'Medyan', role: 'saha-uzmani', factor: 1, retention: prog.planRetention, sahaGrowthEvery: 6, desc: `Tam kapasite kullanılır ve aylık yenileme %${Math.round(prog.planRetention * 100)} olur. İkinci saha çalışanından sonra her 6 ayda bir saha çalışanı eklenir. Bu, plan senaryosudur.` },
    { id: 'iyimser', name: 'İyimser', role: 'pazarlamaci', factor: 1.3, retention: optRetention, sahaGrowthEvery: 4, desc: `Kapasitenin yüzde 130 kadarı kullanılır. Aylık yenileme %${Math.round(optRetention * 100)} olur. Bu oran plan senaryosundan 10 yüzde puan yüksektir. İkinci saha çalışanından sonra her 4 ayda bir saha çalışanı eklenir.` },
  ];
  const inputsFor = (sc: Scenario, override: Partial<SimInputs> = {}): SimInputs => ({
    factor: sc.factor,
    retention: sc.retention,
    annualShare: p.annualShare / 100,
    priceEur: p.subscriptionEur,
    secondSahaIso: p.secondSahaDate,
    extraSaha: 0,
    dijitalBudget: p.dijitalAdBudgetMonthly,
    dijitalScale: true,
    fxGrowth: p.eurTryGrowth / 100,
    sahaGrowthEvery: sc.sahaGrowthEvery,
    ...override,
  });
  const series: ScenarioSeries[] = scenarios.map((sc) => ({ scenario: sc, ...simulate(p, prog, months, inputsFor(sc)) }));
  const byId = Object.fromEntries(series.map((x) => [x.scenario.id, x])) as Record<ScenarioId, ScenarioSeries>;
  const rec = <T>(f: (x: ScenarioSeries) => T) => Object.fromEntries(series.map((x) => [x.scenario.id, f(x)])) as Record<ScenarioId, T>;
  /** Kaynak tablosu için seçili senaryonun kaynakları (büyüme kuralı senaryoya göre). */
  const sourcesFor = (sc: Scenario) => buildSources(p, prog, months, inputsFor(sc));
  const sources = sourcesFor(scenarios[1]);

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
    { paket: 'Aylık abonelik', fiyat: `${p.subscriptionEur} € / ay`, tl: prog.SUBSCRIPTION_TRY, note: `Her ay yenilenir ve elde tutma oranına bağlıdır. ₺ karşılığı kurla birlikte yılda %${p.eurTryGrowth} artar.` },
    { paket: 'Yıllık peşin', fiyat: `${p.subscriptionEur * p.annualMonths} € / yıl`, tl: prog.ANNUAL_TRY, note: `${p.annualMonths} aylık ücret ödenir, ${12 - p.annualMonths} ay ücretsizdir. Nakit önden gelir ve yıl içinde abonelik kaybı olmaz.` },
  ];

  const assumptions = [
    `Tüm senaryolar ${longDate(p.simStartDate)} tarihinde başlar. Senaryolar ${longDate(p.simEndDate)} tarihinde biter (${months.length} ay). İlk satış ${longDate(p.firstSaleDate)} tarihindedir. Bu tarihten önce satışa bağlı gelir 0 ₺ sayılır. İlk satış ayında ayın kalan günlerinin oranı kullanılır. Aktif satıcı, ilk ödemesini yapan satıcıdır (hedefler sayfasıyla aynı tanım). Üye satıcı kayıt olan satıcıdır. Her aktif satıcıya ${ratio.toLocaleString('tr-TR')} kayıt düşer (${p.memberTarget} üye ve ${p.activeTarget} aktif).`,
    `Aylık abonelik ${p.subscriptionEur} €, yani ${Math.round(prog.SUBSCRIPTION_TRY).toLocaleString('tr-TR')} ₺ olur (kur ${p.eurTry.toLocaleString('tr-TR')} ₺/€). Yıllık ödeme ${p.subscriptionEur * p.annualMonths} €, yani ${Math.round(prog.ANNUAL_TRY).toLocaleString('tr-TR')} ₺ olur. Yeni satıcıların yüzde ${p.annualShare} kadarı yıllık peşin öder. Bu oran bir parametredir. Peşin tutar ödendiği ayda bütünüyle sayılır. Kur yılda %${p.eurTryGrowth} artar. € fiyat sabit kalır. Fiyatın ₺ karşılığı her ay bileşik olarak büyür.`,
    `Tam kapasitede saha personeli ayda ${p.sahaActivesMonthly} yeni aktif satıcı getirir. CRM masa başı personeli ayda ${p.crmActivesMonthly}, organizatör ayda ${p.organizatorActivesMonthly} yeni aktif satıcı getirir. Her kişi ilk ay kapasitesinin yüzde 50’si, ikinci ay yüzde 75’i ile çalışır. İkinci saha personeli ${longDate(monthStart(p.secondSahaDate))} tarihinde, organizatör ve temsilciler ${longDate(p.decStartDate)} tarihinde başlar. Medyan senaryoda her 6 ayda 1 saha personeli eklenir. İyimser senaryoda her 4 ayda 1 saha personeli eklenir. Saha personeli en çok ${p.sahaMaxCount} kişi olur. Kötümser senaryoda kadro büyümez.`,
    `Satıcı kazanım reklamı ${longDate(monthStart(p.dijitalAdStartDate))} tarihinde başlar. Aylık bütçe ${p.dijitalAdBudgetMonthly.toLocaleString('tr-TR')} ₺ olur. Kayıt başına maliyet ${p.dijitalCostPerLead.toLocaleString('tr-TR')} ₺, kayıttan ilk ödemeye dönüşüm %${p.dijitalLeadToActive} olur. Bu durumda tam hızda ayda ${adCapacity(p, p.dijitalAdBudgetMonthly).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} yeni aktif satıcı gelir. LTV ÷ CAC en az ${SCALE_RULE.threshold} ise bütçe her ${SCALE_RULE.everyMonths} ayda ${SCALE_RULE.step.toLocaleString('tr-TR')} katına çıkar. Bütçe en çok ${p.dijitalScaleMax} katına ulaşır. Organik içerik ${longDate(monthStart(p.dijitalOrganicStartDate))} tarihinden itibaren ayda ${p.dijitalOrganicActivesMonthly} yeni aktif satıcı getirir. Reklam bütçesi nakit akışında ve başabaş hesabında gider olarak sayılır.`,
    `Bağımsız temsilci ağına her ay ${p.repPerMonth} yeni temsilci katılır. Ağ en çok ${p.repCap} temsilciye ulaşır. Temsilci başına ayda ${REP_SALES} ilk ödeme beklenir.`,
    `Kötümser senaryoda kapasitenin yüzde ${p.pessimisticFactor} kadarı kullanılır. Bu senaryoda elde tutma %${p.pessimisticRetention} olur ve kadro büyümez. Medyan senaryo plan senaryosudur. Medyan senaryoda kapasite tam, elde tutma %${Math.round(prog.planRetention * 100)} olur. Her 6 ayda 1 ek saha personeli gelir. İyimser senaryoda kapasite yüzde 130, elde tutma %${Math.round(optRetention * 100)} olur. Her 4 ayda 1 saha personeli eklenir. Seçilen senaryo gelir planı, nakit akış tablosu ve istihdam takviminde ortaktır. Seçim bu tarayıcıda saklanır.`,
    'Gelir iki parçadan oluşur. Birinci parça, o ay yıllık peşin ödeyenler × yıllık ücrettir. İkinci parça, aylık ödeyen satıcı-ay × aylık ücrettir. Hesap o ayın ₺ fiyatını kullanır. KDV (katma değer vergisi) ve tahsilat gecikmesi modele dahil değildir. Hedef tarihleri ay içinde doğrusal olarak hesaplanır.',
  ];

  return {
    months,
    sources,
    sourcesFor,
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
    labels: { start: longDate(p.simStartDate), startShort: shortDate(p.simStartDate), firstSale: longDate(p.firstSaleDate), end: `${monthName(months[months.length - 1].iso)} ${months[months.length - 1].iso.slice(0, 4)}` },
    horizon: months.length,
    satis: saleFactor(p, months),
    inputsFor,
  };
}

export type Revenue = ReturnType<typeof makeRevenue>;
