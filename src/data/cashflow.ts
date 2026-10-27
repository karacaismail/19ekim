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
import type { Revenue, Scenario } from './revenue';

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
  /** Gelir planı ayına eşle: ufuk dışı (program öncesi Ekim) sıfır. */
  const pick = (xs: number[]) =>
    aylar.map((m) => {
      const k = monthNo(m.iso) - t0;
      return k >= 0 && k < xs.length ? r2(xs[k]) : 0;
    });
  const seri = Object.fromEntries(
    rev.series.map((x) => [
      x.scenario.id,
      {
        yeniAktif: pick(x.yeniAktif),
        odeyen: pick(x.odeyen),
        ilkOdeme: pick(x.ilkOdeme),
        yenilemeTl: pick(x.yenileme),
        prim: pick(x.yeniAktif).map((n) => r2(n * p.commission)),
      } satisfies CashSeries,
    ]),
  ) as Record<ScenarioId, CashSeries>;
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
      `Abonelik geliri: aktif satıcı başına ayda ${prog.SUBSCRIPTION_EUR} € × ${p.eurTry.toLocaleString('tr-TR')} ₺/€ (${Math.round(prog.SUBSCRIPTION_TRY).toLocaleString('tr-TR')} ₺); yeni satıcıların %${p.annualShare}’i yıllık peşin öder (${Math.round(prog.ANNUAL_TRY).toLocaleString('tr-TR')} ₺, ${p.annualMonths} ay ücreti). Ödeme aynı ay tahsil edilir, KDV ayrıca modellenmez.`,
      `Yeni aktif satıcı ve yenilemeler gelir planı sayfasının senaryo simülasyonundan gelir (kadro kapasitesi × senaryo çarpanı; elde tutma senaryonun oranı): kötümser ${kotumser.desc.toLocaleLowerCase('tr-TR')}; medyan ${medyan.desc.toLocaleLowerCase('tr-TR')}; iyimser ${iyimser.desc.toLocaleLowerCase('tr-TR')}. Seçili senaryo iki sayfada ortaktır ve bu tarayıcıda saklanır.`,
      `Program ${monthName(rev.months[0].iso)} ${rev.months[0].iso.slice(0, 4)}’te başlar: Ekim 2026’da giriş yoktur; gelir planı ufku (${rev.months.length} ay) tablonun 15 ayını kapsar.`,
      `Meta reklamları: haftada ${p.metaWeekly.toLocaleString('tr-TR')} ₺ (ayda ≈ ${metaAylik.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺), ${monthName(monthStart(p.metaStartDate))} ${p.metaStartDate.slice(0, 4)} ayından itibaren tam ay; Sheets’te bu kalem yoktur.`,
      `Satış primi: her yeni aktif satıcı için ${p.commission.toLocaleString('tr-TR')} ₺ üst sınır, seçili senaryonun yeni aktif satıcısıyla (kota üstü satış ve temsilci satışları prim doğurur; sponsor ve ekip lideri payı dahil değil).`,
      yatirimIcerde
        ? `Yatırım girişi: ${p.investmentAmount.toLocaleString('tr-TR')} ₺, ${monthName(monthStart(p.investmentDate))} ${p.investmentDate.slice(0, 4)} (parametre); başlangıç nakdi ${p.openingCash.toLocaleString('tr-TR')} ₺.`
        : `Yatırım girişi ayı (${p.investmentDate}) tablo dönemi dışında; tabloya girmez. Başlangıç nakdi ${p.openingCash.toLocaleString('tr-TR')} ₺.`,
      'Çıkışlar: Google Sheets’teki 15 aylık gider planı (kategori bazında; bordrolu personel işveren maliyeti teşvik düşülmüş; freelancer faturaları KDV dahil) — Giderler sayfasıyla aynı canlı veri. Ödeme ayı = gider ayı (SGK ve vergi gecikmesi modellenmez).',
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
  /** Dönem sonu nakdin kalıcı olarak sıfırın üstüne çıktığı ay (negatife düşmüşse); hiç düşmediyse ilk ay, çıkmıyorsa null */
  toparlanma: CashMonth | null;
  /** Sheets verisi tabloya girdi mi */
  sheets: boolean;
}

const sum = (xs: number[]) => r2(xs.reduce((a, b) => a + b, 0));
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

/** Seçili senaryonun girişleri, plan çıkışları ve (varsa) Sheets çıkışlarından tam tablo. */
export function buildCashflow(plan: CashPlan, opex: OpexModel | null, senaryo: ScenarioId = 'medyan'): Cashflow {
  const { aylar } = plan;
  const s = plan.seri[senaryo];
  const girisler: CashLine[] = [
    line('Abonelik: ilk ödemeler', 'plan', s.ilkOdeme),
    line('Abonelik: yenilemeler', 'plan', s.yenilemeTl),
    line('Yatırım girişi', 'plan', plan.yatirim),
  ];
  const cikislar: CashLine[] = [
    ...(opex ? sheetsLines(opex, aylar) : []),
    line('Meta reklamları (plan)', 'plan', plan.meta),
    line('Satış primi (plan, en çok)', 'plan', s.prim),
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
  // Toparlanma: en düşük noktadan sonra dönem sonu nakdin sıfırın üstüne çıktığı ilk ay.
  const t = enDusuk.deger >= 0 ? 0 : donemSonu.findIndex((v, i) => i > minIndex && v >= 0);
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
    toparlanma: t < 0 ? null : aylar[t],
    sheets: !!opex,
  };
}

export type CashflowPlan = ReturnType<typeof makeCashflow>;
