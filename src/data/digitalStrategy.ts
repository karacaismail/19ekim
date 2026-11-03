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
import { adCapacity, adSchedule, ltvOf, SCALE_RULE, simulate, type Revenue, type Scenario, type SimInputs } from './revenue';
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
    { kanal: 'Meta lead formu (Instagram + Facebook)', amac: 'İstoç ve çevresindeki toptancı ve üreticilerden kayıt toplar. Reklam konuma ve ilgi alanına göre hedeflenir, siteyi ziyaret edenlere yeniden gösterilir.', role: 'dijital-pazarlama', olcum: 'Kayıt başına maliyet (CPL) ve kayıttan ilk ödemeye dönüşüm. Kaynak UTM etiketi ve CRM kaynak alanıyla izlenir.', baslangic: longDate(monthStart(p.dijitalAdStartDate)) },
    { kanal: 'Google Arama (niyetli trafik)', amac: '“toptan …”, “istoç toptancı” ve “b2b pazar yeri” gibi aramalardan gelenleri kayıt sayfasına yönlendirir.', role: 'dijital-pazarlama', olcum: 'Tıklama maliyeti, kayıt sayfası dönüşümü ve Search Console sorguları', baslangic: longDate(monthStart(p.dijitalAdStartDate)) },
    { kanal: 'Organik içerik (YouTube, TikTok, Instagram)', amac: 'Altı içerik sütununda günde 3 kısa video yayınlanır. Satıcı hikâyeleri ve ürün vitrinleri CRM’e haftada 10 talep getirir.', role: 'dijital-pazarlama', olcum: 'İzlenmeden profile ve kayda geçiş, haftalık talep sayısı', baslangic: longDate(monthStart(p.dijitalOrganicStartDate)) },
    { kanal: 'CRM yaşam döngüsü (WhatsApp + e-posta)', amac: 'Kayıttan ilk ödemeye kadar 7 günlük mesaj dizisi gönderilir. Aylık değer raporu ve yenileme çağrısı satıcıyı elde tutar.', role: 'pazarlamaci', olcum: 'Kayıttan ödemeye geçiş oranı, 30 günlük elde tutma ve yenileme oranı', baslangic: longDate(prog.dates.start) },
    { kanal: 'Alıcı tarafı: pazar yeri SEO ve listeler', amac: 'Perakendeci ziyaretçiler satıcıya sipariş getirir. Satıcı değeri görünce aboneliğini sürdürür.', role: 'yazilim', olcum: 'Organik oturum, ürün sayfası görüntüleme ve satıcı başına sipariş', baslangic: longDate(monthStart(p.dijitalOrganicStartDate)) },
    { kanal: 'Meta işe alım reklamı (temsilci)', amac: 'Bağımsız temsilci başvurusu toplar. Bütçesi ayrıdır ve Bütçe grubunda yer alır. Satıcı kazanımına dolaylı katkı verir.', role: 'yonetici', olcum: 'Haftalık başvuru ve aktif kalan temsilci sayısı', baslangic: longDate(p.metaStartDate) },
  ];

  const kpis = [
    { metrik: 'Kayıt maliyeti (CPL)', hedef: `≤ ${p.dijitalCostPerLead.toLocaleString('tr-TR')} ₺`, sik: 'Haftalık', kaynak: 'Reklam hesabı + CRM kaynak alanı' },
    { metrik: 'Kayıt → ilk ödeme', hedef: `≥ %${p.dijitalLeadToActive}`, sik: 'Haftalık', kaynak: 'CRM aşamaları' },
    { metrik: 'Kazanım maliyeti (CAC)', hedef: 'LTV ÷ CAC ≥ 3 (LTV: satıcı başına beklenen toplam gelir)', sik: 'Aylık', kaynak: 'Bütçe ÷ yeni aktif satıcı' },
    { metrik: '30 gün elde tutma', hedef: `≥ %${Math.round(prog.planRetention * 100)}`, sik: 'Aylık', kaynak: 'Abonelik olayları (GA4) + CRM' },
    { metrik: 'Organik talep', hedef: '10 / hafta (Ocak)', sik: 'Haftalık', kaynak: 'CRM (kaynak: içerik)' },
    { metrik: 'Video üretimi', hedef: '3 / gün (Ocak)', sik: 'Günlük', kaynak: 'Paylaşım hattı' },
  ];

  const takvim = [
    { ay: longDate(prog.dates.start), adim: 'Kurulum', is: 'GTM, GA4, Metrica, Meta Pixel ve Conversions API, UTM standardı ve CRM kaynak alanı kurulur. Kayıt sayfası, lead formu ve WhatsApp mesaj dizisi hazırlanır.', olcut: '8 ölçüm aracının 8’i yayında. Kaynağı boş kayıt yok.' },
    { ay: longDate(monthStart(p.dijitalAdStartDate)), adim: 'Test bütçesi', is: `Meta ve Google’da ayda ${p.dijitalAdBudgetMonthly.toLocaleString('tr-TR')} ₺ ile 3 reklam seti çalışır. İlk ay öğrenme ayıdır ve kapasitenin yarısıyla (%50) çalışılır.`, olcut: `CPL ≤ ${p.dijitalCostPerLead.toLocaleString('tr-TR')} ₺, dönüşüm ≥ %${p.dijitalLeadToActive}` },
    { ay: longDate(monthStart(p.dijitalOrganicStartDate)), adim: 'İçerik makinesi', is: 'Altı içerik sütununda günde 3 video yayınlanır, paylaşımların %80’i otomatiktir. Organik kayıtlar CRM’de izlenir.', olcut: 'Haftada 10 organik talep. Organik yoldan ayda ' + p.dijitalOrganicActivesMonthly + ' aktif satıcı.' },
    { ay: longDate(prog.dates.day90), adim: 'Ölçek kararı', is: `Bütçe LTV ÷ CAC oranına göre belirlenir. Oran ${SCALE_RULE.threshold} veya üstündeyse bütçe ${SCALE_RULE.step.toLocaleString('tr-TR')} ile çarpılır (en çok ${p.dijitalScaleMax} katına kadar). Oran 1,5–3 arasındaysa bütçe korunur. 1,5’in altındaysa reklam durdurulur ve dönüşüm düzeltilir.`, olcut: '90. gün değerlendirmesi' },
  ];

  const kurallar = [
    'Her reklam ve paylaşım UTM kaynak etiketi taşır. CRM’de kaynağı boş kayıt kabul edilmez, çünkü ölçülmeyen kanal bütçe almaz.',
    'Bütçe aylık ve kademeli artar: önce test edilir, sonra büyütülür. Yeni kademe ancak önceki ay CPL ve dönüşüm hedefi tuttuysa açılır.',
    `LTV ÷ CAC oranı ${SCALE_RULE.threshold} veya üstündeyse bütçe her ${SCALE_RULE.everyMonths} ayda ${SCALE_RULE.step.toLocaleString('tr-TR')} ile çarpılır. Bütçe başlangıcın en çok ${p.dijitalScaleMax} katına çıkar ve simülasyon bu kuralı uygular. Oran 1,5–3 arasındaysa bütçe korunur ve dönüşüm iyileştirilir. 1,5’in altındaysa reklam durdurulur, kayıt sayfası ve CRM mesaj dizisi düzeltilir.`,
    'Organik içerik reklamın yerine geçmez, onu tamamlar. Reklam hızlı ama pahalıdır, içerik yavaş ama ucuzdur. İkisinden gelen kayıtlar da CRM’de aynı aşamalardan geçer.',
    'Elde tutma dijital işin yarısıdır. Aylık değer raporu ve yenileme çağrısı yapılmazsa kazanılan satıcı zamanla ayrılır.',
  ];

  const tierBudgets = [...new Set([0, 15_000, 30_000, 60_000, 120_000, p.dijitalAdBudgetMonthly])].sort((a, b) => a - b);
  /** Verilen girdilerle (senaryo ya da seçenekler) bütçe kademeleri. */
  const tiersFor = (sc: Scenario, base: SimInputs): TierScenario => {
    const ltv = ltvOf(p, base);
    const sifir = sum(simulate(p, prog, months, { ...base, dijitalBudget: 0 }).gelir.slice(adT, adT + WINDOW));
    const tiers = tierBudgets.map((butce): TierResult => {
      const girdi = { ...base, dijitalBudget: butce };
      const sim = simulate(p, prog, months, girdi);
      const d = adSchedule(p, months, girdi);
      const kayit = win(d.kayit);
      const aktif = r2(win(d.reklam) * base.factor);
      const gider = win(d.butce);
      const katki = r2(sum(sim.gelir.slice(adT, adT + WINDOW)) - sifir);
      const cac = aktif > 0 ? r2(gider / aktif) : null;
      return { butce, kayit, aktif, gider, katki, net: r2(katki - gider), cac, ltvCac: cac ? r2(ltv / cac) : null };
    });
    return { scenario: sc, ltv, tiers };
  };
  const byScenario: TierScenario[] = rev.scenarios.map((sc) => tiersFor(sc, rev.inputsFor(sc)));
  const byId = Object.fromEntries(byScenario.map((x) => [x.scenario.id, x])) as Record<ScenarioId, TierScenario>;

  /** Zincir (paradigma) verilen girdilerle: aylık tam hız değerleri (ölçek öncesi) ve ölçek kuralının sonucu. */
  const zincir = (sc: Scenario, base: SimInputs = rev.inputsFor(sc)) => {
    const butce = base.dijitalBudget;
    const kayit = p.dijitalCostPerLead > 0 ? butce / p.dijitalCostPerLead : 0;
    const aktif = adCapacity(p, butce) * base.factor;
    const cac = aktif > 0 ? butce / aktif : null;
    const d = adSchedule(p, months, base);
    const ltv = ltvOf(p, base);
    const sonCarpan = d.carpan[d.carpan.length - 1] || 1;
    return { butce, kayit: r2(kayit), aktif: r2(aktif), cac: cac === null ? null : r2(cac), ltv, ltvCac: cac ? r2(ltv / cac) : null, olcek: d.scales, sonCarpan, sonButce: d.butce[d.butce.length - 1] };
  };

  return { kanallar, kpis, takvim, kurallar, tierBudgets, byScenario, byId, tiersFor, zincir, window: WINDOW, adStart: longDate(monthStart(p.dijitalAdStartDate)), rule: SCALE_RULE };
}

export type DigitalStrategy = ReturnType<typeof makeDigitalStrategy>;
