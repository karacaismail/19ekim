/**
 * İstihdam planı × senaryo (kullanıcı kararı 2026-10-27): her rolün görevi, işveren maliyeti ve gelire katkısı
 * kötümser · medyan · iyimser senaryolara yedirilir. Katkı = gelir planı simülasyonunda o kaynak olmasaydı 18 ayda
 * kaybedilecek gelir (ayıklama; model kaynaklarda doğrusaldır, katkılar toplama eşittir). Doğrudan kaynağı olmayan roller
 * (asistan, Segika CRM, ekip lideri) “dolaylı” ya da “katkı yok” diye yazılır; maliyetleri yine kadro gideridir.
 * Aynı rol maliyetleri başabaşın “plan kadrosu” gider kaynağını besler (src/data/breakeven.ts).
 */
import { longDate, monthStart } from '../lib/dates';
import type { ScenarioId } from '../lib/scenario';
import type { Params } from './params';
import type { Program as ProgramModel } from './program';
import { adCapacity, buildSources, digitalSplit, simulate, type RevMonth, type Revenue, type Scenario } from './revenue';
import type { RoleKey } from './types';

export interface StaffRole {
  id: string;
  name: string;
  /** Grafik ekseni için kısa ad (dar ekranda sığar) */
  short: string;
  role: RoleKey;
  count: number;
  /** Görev (kısa) */
  gorev: string;
  /** Gelire katkı yolu */
  katkiYolu: string;
  /** Aylık net maaş (₺); maaşsız satırlarda null */
  maas: number | null;
  /** Aylık sabit maliyet (₺): işveren maliyeti ya da reklam bütçesi */
  maliyet: number;
  startIso: string;
  /** Katkı ölçümü: ayıklanacak kaynak, reklam bütçesi, organik içerik, temsilci primi ya da yok */
  katki: { kind: 'source'; id: string } | { kind: 'reklam' } | { kind: 'organik' } | { kind: 'rep' } | { kind: 'yok' };
}

export interface StaffInputs {
  secondSahaIso: string;
  extraSaha: number;
  dijitalBudget: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const monthNo = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;

/** Kadro satırları: görev, maliyet, başlangıç, katkı yolu (gelir planı kadrosu). */
export function staffRoles(p: Params, prog: ProgramModel, inp: StaffInputs): StaffRole[] {
  const s = prog.salaries;
  const cost = (salary: number) => r2(salary * p.costFactor);
  const dijitalStart = p.asistanCount ? p.startDate : p.dijitalAltDate;
  const kap = adCapacity(p, inp.dijitalBudget);
  const kayit = p.dijitalCostPerLead > 0 ? inp.dijitalBudget / p.dijitalCostPerLead : 0;
  const rows: StaffRole[] = [
    {
      id: 'saha1',
      name: 'Saha satış uzmanı (1.)',
      short: 'Saha 1',
      role: 'saha-uzmani',
      count: 1,
      gorev: 'İstoç’ta randevulu ve çat kapı ziyaret; kayıt, 48 saatte onboarding, abonelik ve yenileme; rota ve kontrol listesiyle sistemi kurar.',
      katkiYolu: `Ayda ${p.sahaActivesMonthly} yeni aktif satıcı (tam kapasite; ilk ay %50, ikinci ay %75).`,
      maas: p.sahaSalary,
      maliyet: cost(s.saha),
      startIso: monthStart(p.startDate),
      katki: { kind: 'source', id: 'saha1' },
    },
    {
      id: 'saha2',
      name: 'Saha satış uzmanı (2., sistem oturunca)',
      short: 'Saha 2',
      role: 'ekip-lideri',
      count: 1,
      gorev: 'Birinci saha personelinin rotasını ve kontrol listesini devralır; ikinci bölge.',
      katkiYolu: `Ayda ${p.sahaActivesMonthly} yeni aktif satıcı; başlangıç ${longDate(monthStart(inp.secondSahaIso))}.`,
      maas: p.sahaSalary,
      maliyet: cost(s.saha),
      startIso: monthStart(inp.secondSahaIso),
      katki: { kind: 'source', id: 'saha2' },
    },
    ...(inp.extraSaha > 0
      ? [
          {
            id: 'sahaEk',
            name: `Ek saha personeli (${inp.extraSaha})`,
            short: `Ek saha ×${inp.extraSaha}`,
            role: 'yonetici' as RoleKey,
            count: inp.extraSaha,
            gorev: 'Başabaş filtresi: ikinci saha personeliyle aynı ay başlayan ek saha kişileri.',
            katkiYolu: `Kişi başına ayda ${p.sahaActivesMonthly} yeni aktif satıcı.`,
            maas: p.sahaSalary,
            maliyet: r2(cost(s.saha) * inp.extraSaha),
            startIso: monthStart(inp.secondSahaIso),
            katki: { kind: 'source' as const, id: 'sahaEk' },
          },
        ]
      : []),
    {
      id: 'crm',
      name: 'İstoç Pazarlama CRM uzmanı',
      short: 'CRM',
      role: 'pazarlamaci',
      count: p.masaCount,
      gorev: 'Günde ≈ 40 soğuk arama + 100 e-posta; CRM kayıt sahibi; dijital kayıtları arar; etkinlik haftalarında organizatöre destek.',
      katkiYolu: `Ayda ${p.crmActivesMonthly} yeni aktif satıcı; dijital kayıtların ödemeye dönüşümü.`,
      maas: p.masaSalary,
      maliyet: r2(cost(s.masa) * p.masaCount),
      startIso: monthStart(p.startDate),
      katki: { kind: 'source', id: 'crm' },
    },
    {
      id: 'org',
      name: 'Organizatör',
      short: 'Organizatör',
      role: 'organizator',
      count: p.organizatorCount,
      gorev: 'Her iş günü 17:00–18:00 eğitim; İstoç çarşısından toptancı buluşmaları (ayda 2 × ≈ 25 katılımcı); kurumsal iş birlikleri.',
      katkiYolu: `Ayda ${p.organizatorActivesMonthly} yeni aktif satıcı; temsilci ağını besler.`,
      maas: p.organizatorSalary,
      maliyet: r2(cost(s.organizator) * p.organizatorCount),
      startIso: monthStart(p.decStartDate),
      katki: { kind: 'source', id: 'org' },
    },
    {
      id: 'dijital',
      name: 'Dijital pazarlama uzmanı',
      short: 'Dijital uzman',
      role: 'dijital-pazarlama',
      count: p.dijitalCount,
      gorev: 'Ölçüm (GTM, GA4, Metrica, Pixel, UTM); satıcı kazanım reklamlarını yönetir; AI-first içerik hattı (günde 3 video); WhatsApp/e-posta yaşam döngüsü.',
      katkiYolu: `Organik içerik: ${longDate(monthStart(p.dijitalOrganicStartDate))}’den ayda ${p.dijitalOrganicActivesMonthly} yeni aktif; reklam katkısı ayrı satırda.`,
      maas: r2(s.dijital),
      maliyet: r2(cost(s.dijital) * p.dijitalCount),
      startIso: monthStart(dijitalStart),
      katki: { kind: 'organik' },
    },
    {
      id: 'reklam',
      name: 'Satıcı kazanım reklamı (Meta + Google)',
      short: 'Reklam',
      role: 'dijital-pazarlama',
      count: 0,
      gorev: 'Lead formu ve arama reklamları; yeniden pazarlama; kayıtlar CRM’e düşer.',
      katkiYolu: `Ayda ${inp.dijitalBudget.toLocaleString('tr-TR')} ₺ → ≈ ${Math.round(kayit)} kayıt → ≈ ${kap.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ilk ödeme (tam hızda).`,
      maas: null,
      maliyet: inp.dijitalBudget,
      startIso: monthStart(p.dijitalAdStartDate),
      katki: { kind: 'reklam' },
    },
    {
      id: 'asistan',
      name: 'Yönetici asistanı',
      short: 'Asistan',
      role: 'asistan',
      count: p.asistanCount,
      gorev: 'Karar seçenekleri, raporlar, 4 kişilik yazılım ekibinin Scrum düzeni.',
      katkiYolu: 'Doğrudan gelir yok (dolaylı: karar hızı, raporlama); alınmazsa dijital pazarlama 1 Ocak’a kayar.',
      maas: r2(s.asistan),
      maliyet: r2(cost(s.asistan) * p.asistanCount),
      startIso: monthStart(p.startDate),
      katki: { kind: 'yok' },
    },
    {
      id: 'segika',
      name: 'Segika masa başı (CRM)',
      short: 'Segika CRM',
      role: 'segika',
      count: p.segikaCount,
      gorev: 'SGK teşvik yazılımının pazarlaması; masa başı rolünün kopyası.',
      katkiYolu: 'iStoc gelirine doğrudan katkı yok (Segika programı; iş ortaklığı sayfası).',
      maas: p.segikaSalary,
      maliyet: r2(cost(s.segika) * p.segikaCount),
      startIso: monthStart(p.startDate),
      katki: { kind: 'yok' },
    },
    {
      id: 'lider',
      name: 'Satış-pazarlama ekip lideri (saha ekibinden)',
      short: 'Ekip lideri',
      role: 'ekip-lideri',
      count: 1,
      gorev: 'Ekibi koçlar; çok katmanlı pazarlama ağını yönetir; haftalık değer raporu.',
      katkiYolu: 'Dolaylı: ekip kapasitesi ve elde tutma (modelde ayrı katkı yok); maliyet yalnız liderlik farkı.',
      maas: p.leadUplift,
      maliyet: cost(p.leadUplift),
      startIso: monthStart(p.decStartDate),
      katki: { kind: 'yok' },
    },
    {
      id: 'rep',
      name: 'Bağımsız temsilciler (MLM ağı, maaşsız)',
      short: 'Temsilciler',
      role: 'yazilim',
      count: 0,
      gorev: 'Kendi çevresinden satıcı getirir; sponsor zinciri; hizmet faturasıyla prim.',
      katkiYolu: `Satış başına ${p.commission.toLocaleString('tr-TR')} ₺ prim (değişken gider); ayda 2 yeni temsilci, en çok 10.`,
      maas: null,
      maliyet: 0,
      startIso: monthStart(p.decStartDate),
      katki: { kind: 'rep' },
    },
  ];
  return rows;
}

/** Rolün ay ay sabit maliyeti (başlangıçtan itibaren). */
export function roleMonthly(role: StaffRole, months: RevMonth[]): number[] {
  const t0 = monthNo(months[0].iso);
  const startT = monthNo(role.startIso) - t0;
  return months.map((m) => (m.t >= startT ? role.maliyet : 0));
}

/** Plan kadrosu: maaşlı rollerin ay ay işveren maliyeti toplamı (reklam ve temsilci hariç). */
export function staffCosts(p: Params, prog: ProgramModel, months: RevMonth[], inp: StaffInputs): number[] {
  const rows = staffRoles(p, prog, inp).filter((r) => r.maas !== null);
  return months.map((m) => r2(rows.reduce((t, r) => t + roleMonthly(r, months)[m.t], 0)));
}

export interface StaffResult {
  role: StaffRole;
  /** 18 ay sabit gider (reklam: bütçe; temsilciler: prim) */
  gider: number;
  /** 18 ayda yeni aktif satıcı (senaryo çarpanıyla) */
  aktif: number;
  /** 18 ay gelire katkı (ayıklama) */
  katki: number;
  net: number;
  /** Katkı ÷ gider; gider 0 ise null */
  oran: number | null;
  dogrudan: boolean;
}

export interface StaffScenario {
  scenario: Scenario;
  rows: StaffResult[];
  toplam: { gider: number; katki: number; net: number; gelir: number };
}

/** Senaryo için kadro × katkı tablosu. */
export function staffScenario(p: Params, prog: ProgramModel, rev: Revenue, sc: Scenario, inp: StaffInputs): StaffScenario {
  const months = rev.months;
  const base = rev.inputsFor(sc, { secondSahaIso: inp.secondSahaIso, extraSaha: inp.extraSaha, dijitalBudget: inp.dijitalBudget });
  const sum = (xs: number[]) => r2(xs.reduce((a, b) => a + b, 0));
  const sim = simulate(p, prog, months, base);
  const gelir = sum(sim.gelir);
  const without = (override: Partial<typeof base>) => gelir - sum(simulate(p, prog, months, { ...base, ...override }).gelir);
  const reklamKatki = r2(without({ dijitalBudget: 0 }));
  const dijitalKatki = r2(without({ exclude: ['dijital'] }));
  const sources = buildSources(p, prog, months, inp.secondSahaIso, inp.extraSaha, inp.dijitalBudget);
  const src = (id: string) => sources.find((x) => x.id === id);
  const parts = digitalSplit(p, months, inp.dijitalBudget);
  const rows: StaffResult[] = staffRoles(p, prog, inp).map((role) => {
    const months18 = roleMonthly(role, months);
    let gider = sum(months18);
    let katki = 0;
    let aktif = 0;
    let dogrudan = true;
    if (role.katki.kind === 'source') {
      katki = r2(without({ exclude: [role.katki.id] }));
      const x = src(role.katki.id);
      aktif = x ? r2(x.values.reduce((a, b) => a + b, 0) * base.factor) : 0;
    } else if (role.katki.kind === 'reklam') {
      katki = reklamKatki;
      aktif = r2(parts.reklam.reduce((a, b) => a + b, 0) * base.factor);
    } else if (role.katki.kind === 'organik') {
      katki = r2(dijitalKatki - reklamKatki);
      aktif = r2(parts.organik.reduce((a, b) => a + b, 0) * base.factor);
    } else if (role.katki.kind === 'rep') {
      katki = r2(without({ exclude: ['rep'] }));
      const x = src('rep');
      aktif = x ? r2(x.values.reduce((a, b) => a + b, 0) * base.factor) : 0;
      gider = r2(aktif * p.commission);
    } else {
      dogrudan = false;
    }
    const net = r2(katki - gider);
    return { role, gider, aktif, katki, net, oran: gider > 0 ? r2(katki / gider) : null, dogrudan };
  });
  const toplam = { gider: sum(rows.map((r) => r.gider)), katki: sum(rows.map((r) => r.katki)), net: 0, gelir };
  toplam.net = r2(toplam.katki - toplam.gider);
  return { scenario: sc, rows, toplam };
}

/** Üç senaryo birden. */
export function makeStaffing(p: Params, prog: ProgramModel, rev: Revenue, inp?: Partial<StaffInputs>) {
  const girdi: StaffInputs = { secondSahaIso: p.secondSahaDate, extraSaha: 0, dijitalBudget: p.dijitalAdBudgetMonthly, ...inp };
  const senaryolar = rev.scenarios.map((sc) => staffScenario(p, prog, rev, sc, girdi));
  const byId = Object.fromEntries(senaryolar.map((x) => [x.scenario.id, x])) as Record<ScenarioId, StaffScenario>;
  return { girdi, senaryolar, byId, roles: staffRoles(p, prog, girdi) };
}

export type Staffing = ReturnType<typeof makeStaffing>;

/** Google Sheets için düz tablo: rol, görev, başlangıç, maaş, maliyet, 18 ay gider, katkı yolu ve üç senaryonun katkısı/neti. */
export function staffingSheet(st: Staffing, horizonMonths: number): (string | number)[][] {
  const head = ['Rol', 'Kişi', 'Görev', 'Gelire katkı yolu', 'Başlangıç', 'Aylık net maaş (₺)', 'Aylık sabit maliyet (₺)', `${horizonMonths} ay gider (₺)`];
  for (const s of st.senaryolar) head.push(`${s.scenario.name}: yeni aktif`, `${s.scenario.name}: gelire katkı (₺)`, `${s.scenario.name}: net (₺)`, `${s.scenario.name}: katkı ÷ gider`);
  const rows = st.roles.map((role, i) => {
    const row: (string | number)[] = [role.name, role.count, role.gorev, role.katkiYolu, role.startIso, role.maas ?? '', role.maliyet, st.senaryolar[1].rows[i].gider];
    for (const s of st.senaryolar) {
      const r = s.rows[i];
      row.push(Math.round(r.aktif * 10) / 10, Math.round(r.katki), Math.round(r.net), r.oran === null ? '' : r.oran);
    }
    return row;
  });
  const toplam: (string | number)[] = ['Toplam', '', '', '', '', '', '', st.senaryolar[1].toplam.gider];
  for (const s of st.senaryolar) toplam.push('', Math.round(s.toplam.katki), Math.round(s.toplam.net), s.toplam.gider ? Math.round((s.toplam.katki / s.toplam.gider) * 100) / 100 : '');
  return [head, ...rows, toplam];
}
