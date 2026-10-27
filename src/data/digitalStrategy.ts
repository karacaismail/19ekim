/**
 * Dijital pazarlama stratejisi: gider → gelir paradigması (kullanıcı kararı 2026-10-27). Satıcı kazanımı için ücretli
 * reklam (Meta lead formu + Google Arama), dijital pazarlama uzmanının organik içerik hattı, CRM yaşam döngüsü ve
 * alıcı tarafı trafiği tek zincire bağlanır: bütçe → kayıt (kayıt maliyeti) → ilk ödeme (dönüşüm) → yenileme
 * (elde tutma) → 12 ay gelir. Karar kuralı LTV ÷ CAC: ≥ 3 bütçeyi artır; 1,5–3 koru; < 1,5 durdur ve dönüşümü düzelt.
 * Sayılar gelir planı simülasyonundan (bütçe ayıklamasıyla) gelir; içerik üretim planı /dijital/ sayfasındadır.
 */
import { longDate, monthStart } from '../lib/dates';
import type { ScenarioId } from '../lib/scenario';
import type { Params } from './params';
import type { Program as ProgramModel } from './program';
import { adCapacity, adSchedule, ltvOf, SCALE_RULE, simulate, type Revenue, type Scenario } from './revenue';
import type { RoleKey } from './types';

export interface Channel {
  kanal: string;
  amac: string;
  role: RoleKey;
  olcum: string;
  baslangic: string;
}

export interface TierResult {
  butce: number;
  /** 12 ayda kayıt, yeni aktif, reklam gideri, gelire katkı, net */
  kayit: number;
  aktif: number;
  gider: number;
  katki: number;
  net: number;
  /** Aktif başına kazanım maliyeti (₺); aktif 0 ise null */
  cac: number | null;
  ltvCac: number | null;
}

export interface TierScenario {
  scenario: Scenario;
  /** Yeni satıcı başına beklenen gelir (aylık ödeyen ömrü ve yıllık peşin payıyla) */
  ltv: number;
  tiers: TierResult[];
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const sum = (xs: number[]) => r2(xs.reduce((a, b) => a + b, 0));

/** 12 ay ufku: reklam başlangıcından itibaren 12 ay (ufuk dışı aylar sayılmaz). */
const WINDOW = 12;

export function makeDigitalStrategy(p: Params, prog: ProgramModel, rev: Revenue) {
  const months = rev.months;
  const t0 = Number(months[0].iso.slice(0, 4)) * 12 + Number(months[0].iso.slice(5, 7)) - 1;
  const adT = Math.max(0, Number(p.dijitalAdStartDate.slice(0, 4)) * 12 + Number(p.dijitalAdStartDate.slice(5, 7)) - 1 - t0);
  const win = (xs: number[]) => sum(xs.slice(adT, adT + WINDOW));

  const kanallar: Channel[] = [
    { kanal: 'Meta lead formu (Instagram + Facebook)', amac: 'İstoç ve çevresindeki toptancı/üreticiden kayıt; konum ve ilgi hedefleme; yeniden pazarlama', role: 'dijital-pazarlama', olcum: 'Kayıt maliyeti (CPL), kayıt → ilk ödeme dönüşümü; UTM + CRM kaynak alanı', baslangic: longDate(monthStart(p.dijitalAdStartDate)) },
    { kanal: 'Google Arama (niyetli trafik)', amac: '“toptan …”, “istoç toptancı”, “b2b pazar yeri” aramalarından kayıt sayfasına', role: 'dijital-pazarlama', olcum: 'Tıklama maliyeti, kayıt sayfası dönüşümü, Search Console sorguları', baslangic: longDate(monthStart(p.dijitalAdStartDate)) },
    { kanal: 'Organik içerik (YouTube, TikTok, Instagram)', amac: 'Günde 3 kısa video, altı içerik sütunu; satıcı hikâyeleri ve ürün vitrinleri; CRM’e haftada 10 talep', role: 'dijital-pazarlama', olcum: 'İzlenme → profil → kayıt; talep / hafta', baslangic: longDate(monthStart(p.dijitalOrganicStartDate)) },
    { kanal: 'CRM yaşam döngüsü (WhatsApp + e-posta)', amac: 'Kayıttan ilk ödemeye 7 günlük dizi; aylık değer raporu ve yenileme çağrısı (elde tutma)', role: 'pazarlamaci', olcum: 'Kayıt → ödeme %, 30 gün elde tutma, yenileme oranı', baslangic: longDate(prog.dates.start) },
    { kanal: 'Alıcı tarafı: pazar yeri SEO ve listeler', amac: 'Perakendeci trafiği satıcıya sipariş getirir; satıcı değer görür, aboneliği sürer', role: 'yazilim', olcum: 'Organik oturum, ürün sayfası görüntüleme, satıcı başına sipariş', baslangic: longDate(monthStart(p.dijitalOrganicStartDate)) },
    { kanal: 'Meta işe alım reklamı (temsilci)', amac: 'Bağımsız temsilci başvurusu (ayrı bütçe: Bütçe grubu); satıcı kazanımına dolaylı', role: 'yonetici', olcum: 'Başvuru / hafta, aktif kalan temsilci', baslangic: longDate(p.metaStartDate) },
  ];

  const kpis = [
    { metrik: 'Kayıt maliyeti (CPL)', hedef: `≤ ${p.dijitalCostPerLead.toLocaleString('tr-TR')} ₺`, sik: 'Haftalık', kaynak: 'Reklam hesabı + CRM kaynak alanı' },
    { metrik: 'Kayıt → ilk ödeme', hedef: `≥ %${p.dijitalLeadToActive}`, sik: 'Haftalık', kaynak: 'CRM aşamaları' },
    { metrik: 'Kazanım maliyeti (CAC)', hedef: 'LTV ÷ CAC ≥ 3', sik: 'Aylık', kaynak: 'Bütçe ÷ yeni aktif' },
    { metrik: '30 gün elde tutma', hedef: `≥ %${Math.round(prog.planRetention * 100)}`, sik: 'Aylık', kaynak: 'Abonelik olayları (GA4) + CRM' },
    { metrik: 'Organik talep', hedef: '10 / hafta (Ocak)', sik: 'Haftalık', kaynak: 'CRM (kaynak: içerik)' },
    { metrik: 'Video üretimi', hedef: '3 / gün (Ocak)', sik: 'Günlük', kaynak: 'Paylaşım hattı' },
  ];

  const takvim = [
    { ay: longDate(prog.dates.start), adim: 'Kurulum', is: 'GTM, GA4, Metrica, Meta Pixel + Conversions API, UTM standardı, CRM kaynak alanı; kayıt sayfası ve lead formu; WhatsApp dizisi', olcut: 'Ölçüm 8/8 yayında; kaynağı boş kayıt %0' },
    { ay: longDate(monthStart(p.dijitalAdStartDate)), adim: 'Test bütçesi', is: `Ayda ${p.dijitalAdBudgetMonthly.toLocaleString('tr-TR')} ₺ ile Meta + Google; 3 reklam seti; öğrenme ayı (kapasite %50)`, olcut: `CPL ≤ ${p.dijitalCostPerLead.toLocaleString('tr-TR')} ₺, dönüşüm ≥ %${p.dijitalLeadToActive}` },
    { ay: longDate(monthStart(p.dijitalOrganicStartDate)), adim: 'İçerik makinesi', is: 'Günde 3 video, %80 otomatik paylaşım, altı içerik sütunu; organik kayıt hattı CRM’de', olcut: 'Haftada 10 organik talep; organik aktif ayda ' + p.dijitalOrganicActivesMonthly },
    { ay: longDate(prog.dates.day90), adim: 'Ölçek kararı', is: `LTV ÷ CAC ile bütçe kararı: ≥ ${SCALE_RULE.threshold} ise bütçe ×${SCALE_RULE.step.toLocaleString('tr-TR')} (en çok ${p.dijitalScaleMax}×); 1,5–3 koru; < 1,5 durdur, dönüşümü düzelt`, olcut: '90. gün değerlendirmesi' },
  ];

  const kurallar = [
    'Her reklam ve paylaşım UTM taşır; CRM’de kaynağı boş kayıt kabul edilmez (ölçülmeyen kanal bütçe almaz).',
    'Bütçe aylık, kademeli: test → ölçek; bir kademe ancak önceki ayın CPL ve dönüşüm hedefi tutmuşsa açılır.',
    `LTV ÷ CAC ≥ ${SCALE_RULE.threshold} → bütçe her ${SCALE_RULE.everyMonths} ayda ×${SCALE_RULE.step.toLocaleString('tr-TR')} (başlangıcın en çok ${p.dijitalScaleMax} katı; simülasyon bu kuralı uygular); 1,5–3 → koru ve dönüşümü iyileştir; < 1,5 → durdur, kayıt sayfasını ve CRM dizisini düzelt.`,
    'Organik içerik reklamın yerine değil yanına: reklam hızlı ve pahalı, içerik yavaş ve ucuz; ikisi de CRM’e aynı aşamalarla girer.',
    'Elde tutma dijital işin yarısıdır: aylık değer raporu ve yenileme çağrısı olmadan kazanılan satıcı erir.',
  ];

  const tierBudgets = [...new Set([0, 15_000, 30_000, 60_000, 120_000, p.dijitalAdBudgetMonthly])].sort((a, b) => a - b);
  const byScenario: TierScenario[] = rev.scenarios.map((sc) => {
    const base = rev.inputsFor(sc);
    const ltv = ltvOf(p, base);
    const sifir = sum(simulate(p, prog, months, { ...base, dijitalBudget: 0 }).gelir.slice(adT, adT + WINDOW));
    const tiers = tierBudgets.map((butce): TierResult => {
      const girdi = { ...base, dijitalBudget: butce };
      const sim = simulate(p, prog, months, girdi);
      const d = adSchedule(p, months, girdi);
      const kayit = win(d.kayit);
      const aktif = r2(win(d.reklam) * sc.factor);
      const gider = win(d.butce);
      const katki = r2(sum(sim.gelir.slice(adT, adT + WINDOW)) - sifir);
      const cac = aktif > 0 ? r2(gider / aktif) : null;
      return { butce, kayit, aktif, gider, katki, net: r2(katki - gider), cac, ltvCac: cac ? r2(ltv / cac) : null };
    });
    return { scenario: sc, ltv, tiers };
  });
  const byId = Object.fromEntries(byScenario.map((x) => [x.scenario.id, x])) as Record<ScenarioId, TierScenario>;

  /** Zincir (paradigma) seçili bütçe için: aylık tam hız değerleri (ölçek öncesi) ve ölçek kuralının sonucu. */
  const zincir = (sc: Scenario) => {
    const kayit = p.dijitalCostPerLead > 0 ? p.dijitalAdBudgetMonthly / p.dijitalCostPerLead : 0;
    const aktif = adCapacity(p, p.dijitalAdBudgetMonthly) * sc.factor;
    const cac = aktif > 0 ? p.dijitalAdBudgetMonthly / aktif : null;
    const d = adSchedule(p, months, rev.inputsFor(sc));
    const sonCarpan = d.carpan[d.carpan.length - 1] || 1;
    return { butce: p.dijitalAdBudgetMonthly, kayit: r2(kayit), aktif: r2(aktif), cac: cac === null ? null : r2(cac), ltv: byId[sc.id].ltv, ltvCac: cac ? r2(byId[sc.id].ltv / cac) : null, olcek: d.scales, sonCarpan, sonButce: d.butce[d.butce.length - 1] };
  };

  return { kanallar, kpis, takvim, kurallar, tierBudgets, byScenario, byId, zincir, window: WINDOW, adStart: longDate(monthStart(p.dijitalAdStartDate)), rule: SCALE_RULE };
}

export type DigitalStrategy = ReturnType<typeof makeDigitalStrategy>;
