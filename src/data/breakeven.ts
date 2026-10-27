/**
 * Başabaş (kullanıcı kararı 2026-10-27: “çok ayrıntılı, çok koşullu başabaş grafiği; üstünde filtreler”).
 * Gelir planı simülasyonunun (src/data/revenue.ts) aylık gelirini aylık giderle karşılaştırır:
 * - Aylık başabaş: gelirin gideri ilk geçtiği ay (ay içinde doğrusal).
 * - Geri ödeme: kümülatif net (gelir − gider) sıfırın üstüne çıktığı ay; en düşük kümülatif net = en çok fon ihtiyacı.
 * - Klasik başabaş noktası (adet): sabit gider / (ödeyen satıcı başına aylık gelir − değişken gider); değişken gider,
 *   elde tutma kaybını yerine koymak için gereken yeni satış primi: (1 − elde tutma) × prim.
 * - Duyarlılık: kapasite çarpanı × elde tutma ızgarasında başabaş ayı.
 * Gider kaynağı: Google Sheets (Giderler sayfasıyla aynı canlı veri; 2028 ayları 2027 ortalaması) ya da plan kadrosu
 * (gelir planı kadrosunun işveren maliyeti, Meta ve YZ araçları). Filtreler sayfa durumudur, parametre değildir.
 */
import { addDays, daysBetween, monthStart, nextMonth } from '../lib/dates';
import type { ScenarioId } from '../lib/scenario';
import type { OpexModel } from './opex';
import type { Params } from './params';
import type { Program as ProgramModel } from './program';
import { adSchedule, simulate, type RevMonth, type Revenue, type Sim, type SimInputs } from './revenue';
import { addedSahaCosts, staffCosts } from './staffing';

export type GiderKaynak = 'sheets' | 'plan';

/** Sayfa filtreleri (senaryo ayrı: iki sayfada ortak seçim). `null` = senaryonun değeri. */
export interface BreakevenFilters {
  factor: number | null;
  retention: number | null;
  /** 0–1 */
  annualShare: number;
  priceEur: number;
  /** Ayın ilk günü; ufuk dışı = ikinci saha gelmez */
  secondSahaIso: string;
  /** İkinciyle aynı ay başlayan ek saha personeli */
  extraSaha: number;
  /** Satıcı kazanım reklam bütçesi: parametrenin katı (0 = reklam yok) */
  dijitalBudgetFactor: number;
  /** Reklam ölçeklenmesi (LTV ÷ CAC kuralı) açık mı */
  dijitalScale: boolean;
  /** Yıllık kur artışı 0–1; null = parametre */
  fxGrowth: number | null;
  /** Saha büyüme kuralı (her N ayda +1); null = senaryonun */
  sahaGrowthEvery: number | null;
  kaynak: GiderKaynak;
  /** Ek sabit gider, ₺ / ay */
  ekSabit: number;
  primDahil: boolean;
}

export const NO_SECOND_SAHA = '2099-01-01';

export const defaultFilters = (p: Params): BreakevenFilters => ({
  factor: null,
  retention: null,
  annualShare: p.annualShare / 100,
  priceEur: p.subscriptionEur,
  secondSahaIso: p.secondSahaDate,
  extraSaha: 0,
  dijitalBudgetFactor: 1,
  dijitalScale: true,
  fxGrowth: null,
  sahaGrowthEvery: null,
  kaynak: 'sheets',
  ekSabit: 0,
  primDahil: true,
});

export interface Kesisim {
  /** Kesirli ay sırası */
  t: number;
  date: string;
}

export interface Breakeven {
  scenario: ScenarioId;
  inputs: SimInputs;
  sim: Sim;
  months: RevMonth[];
  /** Kullanılan gider kaynağı (Sheets istendi ama okunamadıysa plan) */
  kaynak: GiderKaynak;
  fallback: boolean;
  kaynakNotu: string;
  /** Sabit giderler (prim hariç, ek sabit dahil), prim, toplam gider, gelir, net, kümülatif net */
  sabit: number[];
  prim: number[];
  gider: number[];
  gelir: number[];
  net: number[];
  kumNet: number[];
  nokta: Kesisim | null;
  geriOdeme: Kesisim | null;
  /** Ufuk içinde kesişim yoksa son 6 ayın eğilimiyle öngörü (kullanıcı kararı 2026-10-27: “ufukta yok” yetmez; ya ileri ya geri) */
  ongoru: {
    /** Son ayın net sonucu (gelir − gider) */
    sonNet: number;
    /** Aylık net sonucun son 6 aydaki eğimi (₺ / ay) */
    egim: number;
    /** Eğilimle aylık başabaş tarihi; eğilim kapanmıyorsa null */
    nokta: Kesisim | null;
    /** Son ayın net sonucuyla kümülatif açığın kapanacağı tarih; null = kapanmıyor */
    geriOdeme: Kesisim | null;
    /** 'ileri' (açık daralıyor), 'geri' (açık büyüyor), 'sabit' */
    yon: 'ileri' | 'geri' | 'sabit';
  };
  enDusuk: { deger: number; t: number };
  /** Ufuk toplamları */
  toplam: { gelir: number; gider: number; net: number };
  adet: {
    /** Ödeyen satıcı başına aylık gelir (yıllık peşin payıyla karışık) */
    gelirBirim: number;
    degisken: number;
    /** Kararlı dönem aylık sabit gider (son 12 ayın ortalaması) */
    sabit: number;
    nokta: number | null;
    n: number[];
    gelir: number[];
    gider: number[];
    /** Seçili girdilerle ödeyen satıcının başabaş adedine ulaştığı ay */
    ulasir: Kesisim | null;
  };
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const monthNo = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
const daysInMonth = (iso: string) => daysBetween(monthStart(iso), nextMonth(iso));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** `d` (gider − gelir ya da −kümülatif net) ilk kez ≤ 0 olduğu kesirli ay ve tarihi. */
export function crossing(months: RevMonth[], d: number[]): Kesisim | null {
  const t = d.findIndex((v) => v <= 0);
  if (t < 0) return null;
  if (t === 0) return { t: 0, date: months[0].iso };
  const prev = d[t - 1];
  const frac = prev === d[t] ? 1 : prev / (prev - d[t]);
  const iso = months[t - 1].iso;
  const days = Math.min(daysInMonth(iso) - 1, Math.max(0, Math.round(frac * daysInMonth(iso))));
  return { t: t - 1 + frac, date: addDays(iso, days) };
}

/** Filtrelerden simülasyon girdileri (senaryo değerleri yerine filtre değerleri). */
export function inputsOf(p: Params, rev: Revenue, scenario: ScenarioId, f: BreakevenFilters): SimInputs {
  const sc = rev.byId[scenario].scenario;
  return rev.inputsFor(sc, {
    factor: f.factor ?? sc.factor,
    retention: f.retention ?? sc.retention,
    annualShare: f.annualShare,
    priceEur: f.priceEur,
    secondSahaIso: f.secondSahaIso,
    extraSaha: f.extraSaha,
    dijitalBudget: r2(p.dijitalAdBudgetMonthly * f.dijitalBudgetFactor),
    dijitalScale: f.dijitalScale,
    fxGrowth: f.fxGrowth ?? p.eurTryGrowth / 100,
    sahaGrowthEvery: f.sahaGrowthEvery ?? sc.sahaGrowthEvery,
  });
}

/** Sabit giderler (prim hariç) ay ay: Sheets ya da plan kadrosu. Sheets istendi ama yoksa plan (fallback). */
export function fixedCosts(p: Params, prog: ProgramModel, months: RevMonth[], f: BreakevenFilters, inputs: SimInputs, opex: OpexModel | null): { values: number[]; kaynak: GiderKaynak; fallback: boolean; note: string } {
  const metaAylik = r2((p.metaWeekly * 52) / 12);
  const metaStart = monthNo(monthStart(p.metaStartDate));
  const meta = (m: RevMonth) => (monthNo(m.iso) >= metaStart ? metaAylik : 0);
  const reklam = adSchedule(p, months, inputs).butce;
  const budget = inputs.dijitalBudget;
  if (f.kaynak === 'sheets' && opex) {
    const buAy = (iso: string) => {
      const ay = Number(iso.slice(5, 7));
      const row = opex.aylik.find((x) => x.ay === ay);
      const yil = iso.slice(0, 4);
      if (yil === '2026' && row) return row.y2026.toplam;
      if (yil === '2027' && row) return row.y2027.toplam;
      return opex.ozet.aylikOrt2027.toplam;
    };
    // Sheets’te tek saha personeli vardır; ikinci saha, ek saha, büyüme kadrosu ve satıcı kazanım reklamı plan kadrosundan eklenir.
    const sahaEk = addedSahaCosts(p, prog, months, inputs);
    return {
      values: months.map((m) => r2(buAy(m.iso) + meta(m) + reklam[m.t] + sahaEk[m.t] + f.ekSabit)),
      kaynak: 'sheets',
      fallback: false,
      note: `Sabit giderler Google Sheets’ten (Giderler sayfasıyla aynı canlı veri; bordrolu personel teşvik düşülmüş işveren maliyeti, teknoloji ve ofis kalemleri); 2028 ayları 2027 ortalamasıyla. Sheets’te olmayanlar eklenir: Meta işe alım reklamı, satıcı kazanım reklam bütçesi (${budget.toLocaleString('tr-TR')} ₺ / ay başlangıç; kural tutuyorsa ölçeklenir) ve ikinci, ek ve büyüme saha personelinin işveren maliyeti (maaş × ${p.costFactor.toLocaleString('tr-TR')}) başladıkları aydan itibaren.`,
    };
  }
  const kadro = staffCosts(p, prog, months, inputs);
  return {
    values: months.map((m) => r2(kadro[m.t] + p.aiToolsMonthly + meta(m) + reklam[m.t] + f.ekSabit)),
    kaynak: 'plan',
    fallback: f.kaynak === 'sheets',
    note: `Sabit giderler plan kadrosundan: kadro tablosundaki maaşlı rollerin işveren maliyeti (maaş × ${p.costFactor.toLocaleString('tr-TR')}; ikinci, ek ve büyüme saha personeli başladıkları aydan, organizatör ve ekip lideri Aralık’tan), YZ araçları tavanı, Meta işe alım reklamı ve satıcı kazanım reklam bütçesi (${budget.toLocaleString('tr-TR')} ₺ / ay başlangıç; kural tutuyorsa ölçeklenir). Ofis ve yazılım ekibi bu kaynakta yoktur; tam resim Sheets kaynağıdır.`,
  };
}

/** Son `n` ayın en küçük kareler eğimi (₺ / ay). */
function slope(xs: number[], n = 6): number {
  const ys = xs.slice(-n);
  const k = ys.length;
  if (k < 2) return 0;
  const mx = (k - 1) / 2;
  const my = ys.reduce((a, b) => a + b, 0) / k;
  let num = 0;
  let den = 0;
  ys.forEach((y, i) => {
    num += (i - mx) * (y - my);
    den += (i - mx) ** 2;
  });
  return den ? num / den : 0;
}

/** Ufuk sonundan `k` ay sonrası (kesirli) için tarih ve kesirli ay sırası. */
function sonra(months: RevMonth[], k: number): Kesisim {
  const last = months.length - 1;
  const iso = months[last].iso;
  let cursor = iso;
  const whole = Math.floor(k);
  for (let i = 0; i < whole; i++) cursor = nextMonth(cursor);
  const frac = k - whole;
  const days = Math.min(daysInMonth(cursor) - 1, Math.max(0, Math.round(frac * daysInMonth(cursor))));
  return { t: last + k, date: addDays(cursor, days) };
}

/** Seçili senaryo ve filtrelerle başabaş hesabı. */
export function computeBreakeven(p: Params, prog: ProgramModel, rev: Revenue, scenario: ScenarioId, f: BreakevenFilters, opex: OpexModel | null): Breakeven {
  const months = rev.months;
  const inputs = inputsOf(p, rev, scenario, f);
  const sim = simulate(p, prog, months, inputs);
  const fixed = fixedCosts(p, prog, months, f, inputs, opex);
  const prim = sim.yeniAktif.map((n) => (f.primDahil ? r2(n * p.commission) : 0));
  const gider = months.map((_, t) => r2(fixed.values[t] + prim[t]));
  const gelir = sim.gelir;
  const net = months.map((_, t) => r2(gelir[t] - gider[t]));
  let acc = 0;
  const kumNet = net.map((v) => (acc = r2(acc + v)));
  const nokta = crossing(months, months.map((_, t) => gider[t] - gelir[t]));
  const geriOdeme = crossing(months, kumNet.map((v) => -v));
  const minT = kumNet.reduce((best, v, i) => (v < kumNet[best] ? i : best), 0);
  // Öngörü: ufuk içinde kesişim yoksa son 6 ayın eğilimi (ya ileri ya geri).
  const sonNet = net[net.length - 1];
  const egim = r2(slope(net));
  const yon: 'ileri' | 'geri' | 'sabit' = Math.abs(egim) < 1 ? 'sabit' : egim > 0 ? 'ileri' : 'geri';
  const ongoruNokta = nokta ? nokta : sonNet < 0 && egim > 0 ? sonra(months, -sonNet / egim) : null;
  const sonKum = kumNet[kumNet.length - 1];
  const ongoruGeri = geriOdeme ? geriOdeme : sonKum < 0 && sonNet > 0 ? sonra(months, -sonKum / sonNet) : sonKum < 0 && egim > 0 && sonNet <= 0 ? null : null;
  const ongoru = { sonNet, egim, nokta: ongoruNokta, geriOdeme: ongoruGeri, yon };
  // Klasik başabaş noktası: kararlı dönem sabit gideri ve fiyatı (son 12 ay ortalaması), satıcı başına karışık aylık gelir.
  const sonFiyat = (xs: number[]) => avg(xs.slice(Math.max(0, months.length - 12)));
  const gelirBirim = r2((1 - inputs.annualShare) * sonFiyat(sim.fiyat.abonelik) + (inputs.annualShare * sonFiyat(sim.fiyat.yillik)) / 12);
  const degisken = f.primDahil ? r2((1 - inputs.retention) * p.commission) : 0;
  const sabit = r2(avg(fixed.values.slice(Math.max(0, months.length - 12))));
  const birimKar = gelirBirim - degisken;
  const nStar = birimKar > 0 ? sabit / birimKar : null;
  const nMax = nStar ? Math.max(50, Math.ceil((nStar * 2) / 50) * 50) : 600;
  const steps = 24;
  const n = Array.from({ length: steps + 1 }, (_, i) => Math.round((nMax * i) / steps));
  const ulasir = nStar === null ? null : crossing(months, sim.odeyen.map((v) => nStar - v));
  const sum = (xs: number[]) => r2(xs.reduce((a, b) => a + b, 0));
  return {
    scenario,
    inputs,
    sim,
    months,
    kaynak: fixed.kaynak,
    fallback: fixed.fallback,
    kaynakNotu: fixed.note,
    sabit: fixed.values,
    prim,
    gider,
    gelir,
    net,
    kumNet,
    nokta,
    geriOdeme,
    ongoru,
    enDusuk: { deger: kumNet[minT], t: minT },
    toplam: { gelir: sum(gelir), gider: sum(gider), net: sum(net) },
    adet: {
      gelirBirim,
      degisken,
      sabit,
      nokta: nStar === null ? null : Math.round(nStar * 10) / 10,
      n,
      gelir: n.map((k) => r2(k * gelirBirim)),
      gider: n.map((k) => r2(sabit + k * degisken)),
      ulasir,
    },
  };
}

export const SENS_FACTORS = [0.6, 0.8, 1, 1.3];
export const SENS_RETENTIONS = [0.5, 0.6, 0.7, 0.8, 0.9];

/** Duyarlılık ızgarası: kapasite çarpanı × elde tutma → aylık başabaş tarihi (diğer filtreler sabit). */
export function sensitivity(p: Params, prog: ProgramModel, rev: Revenue, scenario: ScenarioId, f: BreakevenFilters, opex: OpexModel | null) {
  return SENS_FACTORS.map((factor) => SENS_RETENTIONS.map((retention) => computeBreakeven(p, prog, rev, scenario, { ...f, factor, retention }, opex).nokta?.date ?? null));
}
