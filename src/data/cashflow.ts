/**
 * Nakit akış tablosu (/nakit-akisi/; kullanıcı kararı 2026-10-27). Klasik düzen: nakit girişleri, nakit çıkışları, net
 * nakit akışı, dönem başı ve dönem sonu nakit; Sheets ızgarasının 15 ayı (Ekim 2026 – Aralık 2027).
 *
 * İki kaynak, tek tablo:
 * - Çıkışlar Google Sheets’ten (Giderler sayfasıyla aynı canlı veri): kalemlerin ay ay ₺ tutarı kategori bazında,
 *   bordrolu personel işveren maliyeti (teşvik düşülmüş) ve freelancer faturaları; artı plan parametrelerinden Meta reklam
 *   bütçesi ve satış primi (üst sınır; seçili senaryonun yeni aktif satıcısına göre).
 * - Girişler gelir planının senaryo serilerinden (kullanıcı kararı 2026-10-27: kötümser · medyan · iyimser her yerde):
 *   ilk ödemeler (aylık ve yıllık peşin) ve yenilemeler aynı simülasyondan; yatırım girişi ve başlangıç nakdi parametre.
 * Repoda tutar yoktur; Sheets verisi çalışma anında okunur.
 */
import { monthName, monthStart } from '../lib/dates';
import type { ScenarioId } from '../lib/scenario';
import type { OpexModel, YilKey } from './opex';
import type { Params } from './params';
import type { Program as ProgramModel } from './program';
import { simulate, type Revenue, type Scenario, type Sim, type SimInputs } from './revenue';
import { addedSahaCosts } from './staffing';

export interface CashMonth {
  /** Ayın ilk günü (ISO) */
  iso: string;
  yil: 2026 | 2027;
  key: YilKey;
  /** 0–11 */
  index: number;
  /** “Ekim 2026” */
  ad: string;
  /** “Eki 2026” */
  kisa: string;
}

const KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/** Sheets ızgarasının 15 ayı: Ekim–Aralık 2026 ve 2027’nin 12 ayı (opex.ts → PLAN_ILK_AY). */
export const CASH_MONTHS: CashMonth[] = [
  ...[9, 10, 11].map((index) => month(2026, index)),
  ...Array.from({ length: 12 }, (_, index) => month(2027, index)),
];

function month(yil: 2026 | 2027, index: number): CashMonth {
  const iso = `${yil}-${String(index + 1).padStart(2, '0')}-01`;
  return { iso, yil, key: yil === 2026 ? 'y2026' : 'y2027', index, ad: `${monthName(iso)} ${yil}`, kisa: `${KISA[index]} ${yil}` };
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const monthNo = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;

/** Bir senaryonun nakit ızgarasına oturtulmuş girişleri ve primi (gelir planı simülasyonundan). */
export interface CashSeries {
  yeniAktif: number[];
  /** Ödemeye devam eden satıcı (aylık + son 12 ayın yıllık ödeyenleri) */
  odeyen: number[];
  ilkOdeme: number[];
  yenilemeTl: number[];
  prim: number[];
  /** Satıcı kazanım reklam bütçesi (senaryoya göre ölçeklenir; Sheets’te yok) */
  reklam: number[];
  /**
   * Gelir planının eklediği saha personelinin (ikinci, ek, büyüme kuralı) işveren maliyeti — Sheets’te tek saha personeli
   * vardır; gelir planının başabaş hesabıyla aynı kural (B2, docs/birlesik_plan.md §3.3-C: önceden çıkışlarda yoktu).
   */
  sahaEk: number[];
}

/** Gelir planı ayını nakit ızgarasına eşler: ufuk dışı (program öncesi Ekim) sıfır. */
function pickTo(aylar: CashMonth[], t0: number, xs: number[]) {
  return aylar.map((m) => {
    const k = monthNo(m.iso) - t0;
    return k >= 0 && k < xs.length ? r2(xs[k]) : 0;
  });
}

/** Bir simülasyonun (temel senaryo ya da gelir planı seçenekleri) nakit ızgarasına oturtulmuş serileri. */
function seriOf(p: Params, aylar: CashMonth[], t0: number, sim: Sim, sahaEk: number[]): CashSeries {
  const yeniAktif = pickTo(aylar, t0, sim.yeniAktif);
  return {
    yeniAktif,
    odeyen: pickTo(aylar, t0, sim.odeyen),
    ilkOdeme: pickTo(aylar, t0, sim.ilkOdeme),
    yenilemeTl: pickTo(aylar, t0, sim.yenileme),
    prim: yeniAktif.map((n) => r2(n * p.commission)),
    reklam: pickTo(aylar, t0, sim.butce),
    sahaEk: pickTo(aylar, t0, sahaEk),
  };
}

/**
 * Gelir planı sayfasının etkin girdileriyle (temel senaryo + seçenekler; `breakeven.ts → inputsOf`) nakit serileri — B2
 * (ct-F04, ar-13): iki sayfa aynı simülasyonu ve aynı eklenen kadro maliyetini kullanır.
 */
export function cashSeriesOf(p: Params, prog: ProgramModel, rev: Revenue, inputs: SimInputs): CashSeries {
  const t0 = monthNo(rev.months[0].iso);
  return seriOf(p, CASH_MONTHS, t0, simulate(p, prog, rev.months, inputs), addedSahaCosts(p, prog, rev.months, inputs));
}

export interface CashPlan {
  aylar: CashMonth[];
  /** Aylık abonelik ve yıllık peşin (₺): € × kur */
  abonelikTl: number;
  yillikTl: number;
  senaryolar: Scenario[];
  seri: Record<ScenarioId, CashSeries>;
  meta: number[];
  yatirim: number[];
  baslangicNakit: number;
  /** Plan girdileri (kalem tanımı ve kaynak), tabloda varsayımlar olarak listelenir. */
  varsayimlar: string[];
}

/** Sitenin parametrelerinden ve gelir planı senaryolarından nakit planı (Sheets’ten bağımsız kısım). */
export function makeCashflow(p: Params, prog: ProgramModel, rev: Revenue): CashPlan {
  const aylar = CASH_MONTHS;
  const t0 = monthNo(rev.months[0].iso);
  // Temel senaryoların serileri; eklenen saha personelinin işveren maliyeti senaryonun kendi girdileriyle (B2).
  const seri = Object.fromEntries(rev.series.map((x) => [x.scenario.id, seriOf(p, aylar, t0, x, addedSahaCosts(p, prog, rev.months, rev.inputsFor(x.scenario)))])) as Record<ScenarioId, CashSeries>;
  const metaStart = monthNo(monthStart(p.metaStartDate));
  const metaAylik = r2((p.metaWeekly * 52) / 12);
  const yatirimAy = monthNo(monthStart(p.investmentDate));
  const yatirimIcerde = aylar.some((m) => monthNo(m.iso) === yatirimAy);
  const medyan = rev.byId.medyan.scenario;
  const kotumser = rev.byId.kotumser.scenario;
  const iyimser = rev.byId.iyimser.scenario;
  return {
    aylar,
    abonelikTl: prog.SUBSCRIPTION_TRY,
    yillikTl: prog.ANNUAL_TRY,
    senaryolar: rev.scenarios,
    seri,
    meta: aylar.map((m) => (monthNo(m.iso) >= metaStart ? metaAylik : 0)),
    yatirim: aylar.map((m) => (monthNo(m.iso) === yatirimAy ? p.investmentAmount : 0)),
    baslangicNakit: p.openingCash,
    varsayimlar: [
      `Abonelik geliri: aktif satıcı başına ayda ${prog.SUBSCRIPTION_EUR} € × ${p.eurTry.toLocaleString('tr-TR')} ₺/€ (${Math.round(prog.SUBSCRIPTION_TRY).toLocaleString('tr-TR')} ₺); yeni satıcıların yüzde ${p.annualShare} kadarının yıllık peşin ödediği varsayılır (${Math.round(prog.ANNUAL_TRY).toLocaleString('tr-TR')} ₺, ${p.annualMonths} ay ücreti). Ödeme aynı ay tahsil edilir, KDV ayrıca modellenmez.`,
      `Yeni aktif satıcı ve yenilemeler gelir planı sayfasının senaryo simülasyonundan gelir (kadro kapasitesi × senaryo çarpanı; elde tutma senaryonun oranı): kötümser ${kotumser.desc.toLocaleLowerCase('tr-TR')}; medyan ${medyan.desc.toLocaleLowerCase('tr-TR')}; iyimser ${iyimser.desc.toLocaleLowerCase('tr-TR')}. Seçili senaryo iki sayfada ortaktır ve bu tarayıcıda saklanır.`,
      `Program ${monthName(rev.months[0].iso)} ${rev.months[0].iso.slice(0, 4)}’te başlar: Ekim 2026’da giriş yoktur; gelir planı ufku (${rev.months.length} ay) tablonun 15 ayını kapsar. ₺ fiyat kurla büyür (yılda %${p.eurTryGrowth}).`,
      `Meta reklamları: haftada ${p.metaWeekly.toLocaleString('tr-TR')} ₺ (ayda ≈ ${metaAylik.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺), ${monthName(monthStart(p.metaStartDate))} ${p.metaStartDate.slice(0, 4)} ayından itibaren tam ay; Sheets’te bu kalem yoktur.`,
      `Satıcı kazanım reklamı (dijital pazarlama stratejisi): ayda ${p.dijitalAdBudgetMonthly.toLocaleString('tr-TR')} ₺ başlangıç, ${monthName(monthStart(p.dijitalAdStartDate))} ${p.dijitalAdStartDate.slice(0, 4)} ayından itibaren; LTV ÷ CAC kuralı tutarsa her 3 ayda ×1,5 (en çok ${p.dijitalScaleMax}×), senaryoya göre; getirdiği satıcılar girişlerin içindedir. Sheets’te bu kalem de yoktur.`,
      `Satış primi: her yeni aktif satıcı için ${p.commission.toLocaleString('tr-TR')} ₺ üst sınır, seçili senaryonun yeni aktif satıcısıyla (kota üstü satış ve temsilci satışları prim doğurur; sponsor ve ekip lideri payı dahil değil).`,
      yatirimIcerde
        ? `Yatırım girişi: ${p.investmentAmount.toLocaleString('tr-TR')} ₺, ${monthName(monthStart(p.investmentDate))} ${p.investmentDate.slice(0, 4)} (parametre); başlangıç nakdi ${p.openingCash.toLocaleString('tr-TR')} ₺.`
        : `Yatırım girişi ayı (${p.investmentDate}) tablo dönemi dışında; tabloya girmez. Başlangıç nakdi ${p.openingCash.toLocaleString('tr-TR')} ₺.`,
      'Çıkışlar: Google Sheets’teki 15 aylık gider planı (kategori bazında; bordrolu personel işveren maliyeti teşvik düşülmüş; freelancer faturaları KDV dahil) — Giderler sayfasıyla aynı canlı veri. Ödeme ayı = gider ayı (SGK ve vergi gecikmesi modellenmez).',
      `Eklenen saha personeli (plan kalemi): ikinci saha personeli (parametre ${monthName(monthStart(p.secondSahaDate))} ${p.secondSahaDate.slice(0, 4)}; gelir planı seçeneğiyle değişir), ek saha ve büyüme kuralıyla gelen saha personeli başladıkları aydan itibaren işveren maliyetiyle (maaş × ${p.costFactor.toLocaleString('tr-TR')}). Sheets’te tek saha personeli vardır; gelir planının başabaş hesabıyla aynı kural.`,
      'Gelir planı sayfasındaki hesap seçenekleri (fiyat, ikinci saha ayı, ek saha, reklam bütçesi ve ölçek, kur artışı, büyüme kuralı, yıllık peşin payı, ek sabit gider, prim) bu tabloda da kullanılır. Gider kaynağı seçeneği burada uygulanmaz: çıkışlar her zaman Sheets gider planı + plan kalemleridir; Sheets okunamazsa yalnız plan kalemleri kalır ve tablo eksiktir.',
    ],
  };
}

export interface CashLine {
  ad: string;
  kaynak: 'sheets' | 'plan';
  aylar: number[];
  toplam: number;
}

export interface Cashflow {
  senaryo: ScenarioId;
  aylar: CashMonth[];
  girisler: CashLine[];
  cikislar: CashLine[];
  giris: number[];
  cikis: number[];
  net: number[];
  donemBasi: number[];
  donemSonu: number[];
  toplam: { giris: number; cikis: number; net: number };
  /** En düşük dönem sonu nakit ve ayı */
  enDusuk: { deger: number; ay: CashMonth };
  /** Nakit açığı tavanı: dönem sonu nakit negatife düşüyorsa kapatmak için gereken en küçük ek nakit */
  acik: number;
  /**
   * Toparlanma (B2c, docs/missings.md MS-03): `ilk` — ilk negatif aydan sonra dönem sonu nakdin ilk kez sıfırın altında
   * olmadığı ay; `kalici` — incelenen dönemin kalanında bir daha sıfırın altına inmediği ilk ay. Hiç negatife düşmüyorsa
   * ikisi de null (açık yok). Dönem sonrası için güvence değildir.
   */
  toparlanma: { ilk: CashMonth | null; kalici: CashMonth | null };
  /** Sheets verisi tabloya girdi mi */
  sheets: boolean;
}

const sum = (xs: number[]) => r2(xs.reduce((a, b) => a + b, 0));

/**
 * Toparlanma ölçütleri (B2c, docs/missings.md MS-03 / T03). Eski hesap küresel en düşük aydan sonraki ilk `>= 0` ayı
 * “kalıcı” sayıyordu: `[-100, 50, -30, 50]` için Kasım dönüyor, sonraki ay yine açık veriyordu. İki ayrı ölçüt: `ilk` —
 * ilk negatif aydan sonra ilk `>= 0` ay; `kalici` — son negatif aydan sonraki ay (dönemin kalanında hep `>= 0`). Hiç
 * negatife düşmeyen dizide ikisi de null. Sınır: sıfır “altında” değildir (`>= 0`). Ufuk sonrasına garanti vermez.
 */
export function toparlanmaOf(donemSonu: number[]): { ilk: number | null; kalici: number | null } {
  const ilkNegatif = donemSonu.findIndex((v) => v < 0);
  if (ilkNegatif < 0) return { ilk: null, kalici: null };
  const ilk = donemSonu.findIndex((v, i) => i > ilkNegatif && v >= 0);
  let sonNegatif = ilkNegatif;
  donemSonu.forEach((v, i) => {
    if (v < 0) sonNegatif = i;
  });
  const kalici = sonNegatif + 1;
  return { ilk: ilk < 0 ? null : ilk, kalici: kalici < donemSonu.length ? kalici : null };
}
const line = (ad: string, kaynak: CashLine['kaynak'], aylar: number[]): CashLine => ({ ad, kaynak, aylar: aylar.map(r2), toplam: sum(aylar) });

/** Sheets kalemlerini kategori bazında 15 aya dağıtır (Giderler sayfasının kategorileriyle aynı sıra). */
function sheetsLines(m: OpexModel, aylar: CashMonth[]): CashLine[] {
  const out: CashLine[] = [];
  for (const kat of m.kategoriler) {
    if (kat.kume === 'insan') continue;
    const items = m.giderler.filter((g) => g.kume === kat.kume && g.kategori === kat.kategori);
    if (!items.length) continue;
    out.push(line(kat.kategori, 'sheets', aylar.map((ay) => items.reduce((t, g) => t + (g.aylikTl[ay.key][ay.index] ?? 0), 0))));
  }
  // İnsan kümesi en üstte: Giderler sayfasındaki kategori adlarıyla.
  const insan: CashLine[] = [];
  const bordrolu = m.kisiler.filter((k) => k.tur === 'Bordrolu');
  if (bordrolu.length) insan.push(line('Bordrolu personel', 'sheets', aylar.map((ay) => bordrolu.reduce((t, k) => t + (k[ay.key].aylar[ay.index]?.maliyet ?? 0), 0))));
  const freelancer = m.kisiler.filter((k) => k.tur === 'Freelancer');
  if (freelancer.length) insan.push(line('Freelancer (fatura)', 'sheets', aylar.map((ay) => freelancer.reduce((t, k) => t + (k[ay.key].aylar[ay.index]?.maliyet ?? 0), 0))));
  return [...insan, ...out];
}

/** Gelir planı seçeneklerinin nakit tablosuna taşınan kısmı (B2): seriler etkin girdilerden, ek sabit gider ve prim seçeneği. */
export interface CashSecenek {
  /** `cashSeriesOf` ile etkin girdilerden; yoksa temel senaryonun serisi */
  seri?: CashSeries;
  /** Ek sabit gider, ₺ / ay (gelir planı seçeneği; 0 = satır yok) */
  ekSabit?: number;
  /** Satış primi gider olarak sayılsın mı (gelir planı seçeneği) */
  primDahil?: boolean;
}

/** Seçili senaryonun girişleri, plan çıkışları ve (varsa) Sheets çıkışlarından tam tablo. */
export function buildCashflow(plan: CashPlan, opex: OpexModel | null, senaryo: ScenarioId = 'medyan', secenek: CashSecenek = {}): Cashflow {
  const { aylar } = plan;
  const s = secenek.seri ?? plan.seri[senaryo];
  const ekSabit = secenek.ekSabit ?? 0;
  const primDahil = secenek.primDahil ?? true;
  const girisler: CashLine[] = [
    line('Abonelik: ilk ödemeler', 'plan', s.ilkOdeme),
    line('Abonelik: yenilemeler', 'plan', s.yenilemeTl),
    line('Yatırım girişi', 'plan', plan.yatirim),
  ];
  const cikislar: CashLine[] = [
    ...(opex ? sheetsLines(opex, aylar) : []),
    // Sheets’te tek saha personeli vardır; gelir planının eklediği saha kadrosu plan kalemidir (B2 — önceden eksikti).
    line('Eklenen saha personeli (plan)', 'plan', s.sahaEk),
    line('Meta reklamları (plan)', 'plan', plan.meta),
    line('Satıcı kazanım reklamı (plan)', 'plan', s.reklam),
    ...(primDahil ? [line('Satış primi (plan, en çok)', 'plan', s.prim)] : []),
    ...(ekSabit > 0 ? [line('Ek sabit gider (seçenek)', 'plan', aylar.map(() => ekSabit))] : []),
  ];
  const giris = aylar.map((_, i) => sum(girisler.map((l) => l.aylar[i])));
  const cikis = aylar.map((_, i) => sum(cikislar.map((l) => l.aylar[i])));
  const net = aylar.map((_, i) => r2(giris[i] - cikis[i]));
  const donemBasi: number[] = [];
  const donemSonu: number[] = [];
  let nakit = plan.baslangicNakit;
  for (let i = 0; i < aylar.length; i++) {
    donemBasi.push(r2(nakit));
    nakit = r2(nakit + net[i]);
    donemSonu.push(nakit);
  }
  const minIndex = donemSonu.reduce((best, v, i) => (v < donemSonu[best] ? i : best), 0);
  const enDusuk = { deger: donemSonu[minIndex], ay: aylar[minIndex] };
  const top = toparlanmaOf(donemSonu);
  return {
    senaryo,
    aylar,
    girisler,
    cikislar,
    giris,
    cikis,
    net,
    donemBasi,
    donemSonu,
    toplam: { giris: sum(giris), cikis: sum(cikis), net: sum(net) },
    enDusuk,
    acik: Math.max(0, -enDusuk.deger),
    toparlanma: { ilk: top.ilk === null ? null : aylar[top.ilk], kalici: top.kalici === null ? null : aylar[top.kalici] },
    sheets: !!opex,
  };
}

export type CashflowPlan = ReturnType<typeof makeCashflow>;
