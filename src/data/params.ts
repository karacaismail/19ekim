/**
 * Kararlaştırılan parametreler: tüm sayfaların verisi bunlardan türetilir (src/data/model.ts).
 * Parametreler sayfasında değiştirilen değerler yalnız o tarayıcıda saklanır (localStorage); yayındaki site
 * herkes için varsayılanları gösterir.
 */

export const DEFAULT_PARAMS = {
  /* Takvim */
  startDate: '2026-11-01',
  decStartDate: '2026-12-01',
  metaStartDate: '2026-10-20',
  dijitalAltDate: '2027-01-01',
  /* 90 gün hedefleri */
  ciroTarget: 3_000_000,
  activeTarget: 100,
  memberTarget: 500,
  subscriptionEur: 399,
  eurTry: 55.31,
  annualMonths: 10,
  planRetention: 70,
  /* Kadro */
  sahaCount: 2,
  sahaDecCount: 1,
  masaCount: 1,
  segikaCount: 1,
  dijitalCount: 1,
  organizatorCount: 1,
  asistanCount: 1,
  softwareCount: 4,
  /* Ücret */
  minWage: 28_075.5,
  minWageGross: 33_030,
  costFactor: 2,
  /* Kullanıcı kararı 2026-10-27: saha, organizatör, masa başı ve Segika net ₺ (19 Ekim: 60.000 ve asgari ücret çarpanları) */
  sahaSalary: 50_000,
  masaSalary: 35_000,
  segikaSalary: 35_000,
  organizatorSalary: 50_000,
  dijitalMultiplier: 1.25,
  asistanMultiplier: 1.5,
  leadUplift: 10_000,
  /* Prim */
  commission: 2_500,
  sponsorShare: 500,
  leadTeamShare: 250,
  /* Bütçe */
  metaWeekly: 5_000,
  aiToolsMonthly: 7_500,
  /* Meta hunisi (haftalık) */
  applicationsWeekly: 50,
  activeRepsWeekly: 0.5,
  /* Mesai */
  overtimeCap: 270,
  /* Simülasyon takvimi (kullanıcı kararı 2026-10-27): senaryolar 19 Ekim 2026’da başlar, ilk satış 6 Kasım, ufuk 2027 sonu */
  simStartDate: '2026-10-19',
  firstSaleDate: '2026-11-06',
  simEndDate: '2027-12-31',
  /* Gelir planı (kullanıcı kararı 2026-10-27): kadro kapasitesi, ikinci saha, yıllık peşin payı, kötümser senaryo */
  sahaActivesMonthly: 8,
  crmActivesMonthly: 4,
  organizatorActivesMonthly: 6,
  secondSahaDate: '2027-01-01',
  annualShare: 20,
  pessimisticFactor: 60,
  pessimisticRetention: 50,
  /* Dijital pazarlama stratejisi (kullanıcı kararı 2026-10-27: gider → gelir paradigması): satıcı kazanım reklamı ve organik içerik */
  dijitalAdBudgetMonthly: 30_000,
  dijitalCostPerLead: 600,
  dijitalLeadToActive: 8,
  dijitalAdStartDate: '2026-12-01',
  dijitalOrganicActivesMonthly: 2,
  dijitalOrganicStartDate: '2027-01-01',
  /* Büyüme (kullanıcı kararı 2026-10-27: “ya ileri ya geri”; gelir düz çizgi olamaz): kur, temsilci ağı, reklam ölçeği, saha büyümesi */
  eurTryGrowth: 25,
  repPerMonth: 2,
  repCap: 24,
  sahaMaxCount: 5,
  dijitalScaleMax: 4,
  /* Nakit akışı (kullanıcı kararı 2026-10-27: nakit akış tablosu) */
  openingCash: 0,
  investmentAmount: 0,
  investmentDate: '2026-11-01',
};

export type Params = typeof DEFAULT_PARAMS;
export type ParamKey = keyof Params;

export type ParamKind = 'date' | 'money' | 'count' | 'number' | 'multiplier' | 'percent' | 'rate';

export interface ParamDef {
  key: ParamKey;
  label: string;
  kind: ParamKind;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
}

export interface ParamGroup {
  id: string;
  title: string;
  desc: string;
  fields: ParamDef[];
}

export const PARAM_GROUPS: ParamGroup[] = [
  {
    id: 'takvim',
    title: 'Takvim',
    desc: 'Program başlangıcı değişirse tüm plan kayar. Aralık başlangıcı değişirse organizatör, ekip lideri ve 3. saha personelinin planı kayar.',
    fields: [
      { key: 'startDate', label: 'Program başlangıcı (5 kişi + Segika)', kind: 'date', help: '60. ve 90. gün kontrolleri bu tarihe göre yapılır.' },
      { key: 'decStartDate', label: 'Aralık başlangıcı (organizatör, ekip lideri, 3. saha)', kind: 'date' },
      { key: 'metaStartDate', label: 'Meta işe alım reklamları başlangıcı', kind: 'date' },
      { key: 'dijitalAltDate', label: 'Asistan yoksa dijital pazarlama başlangıcı', kind: 'date' },
    ],
  },
  {
    id: 'hedef',
    title: '90 gün hedefleri',
    desc: 'Hedefler değişirse kaynak dağılımı yeni toplamlara orantılı olarak yeniden hesaplanır.',
    fields: [
      { key: 'ciroTarget', label: 'Ciro hedefi', kind: 'money', unit: '₺', min: 0, step: 50_000 },
      { key: 'activeTarget', label: 'Aktif satıcı hedefi', kind: 'count', unit: 'satıcı', min: 1 },
      { key: 'memberTarget', label: 'Üye satıcı hedefi', kind: 'count', unit: 'satıcı', min: 0 },
      { key: 'subscriptionEur', label: 'Aktif satıcı aboneliği', kind: 'number', unit: '€ / ay', min: 0 },
      { key: 'eurTry', label: 'Kur', kind: 'rate', unit: '₺ / €', min: 0, step: 0.01 },
      { key: 'annualMonths', label: 'Yıllık peşin ödemede ücreti alınan ay', kind: 'count', unit: 'ay', min: 1, max: 12, help: '“2 ay bedava” kampanyasında bu değer 10 olur.' },
      { key: 'planRetention', label: 'Plan senaryosu: aylık elde tutma', kind: 'percent', unit: '%', min: 0, max: 100 },
    ],
  },
  {
    id: 'kadro',
    title: 'Kadro (kişi sayısı)',
    desc: 'İşe alım sırası, organizasyon şeması ve maliyet hesapları bu sayılara göre hazırlanır.',
    fields: [
      { key: 'sahaCount', label: 'Saha satış: program başında', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'sahaDecCount', label: 'Saha satış: Aralık’ta eklenen', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'masaCount', label: 'Masa başı (CRM)', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'segikaCount', label: 'Segika masa başı (CRM)', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'dijitalCount', label: 'Dijital pazarlama', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'organizatorCount', label: 'Organizatör', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'asistanCount', label: 'Asistan', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'softwareCount', label: 'Yazılım ekibi (Scrum)', kind: 'count', unit: 'kişi', min: 0 },
    ],
  },
  {
    id: 'ucret',
    title: 'Ücret',
    desc: 'İşveren maliyeti = maaş × maliyet çarpanı (SGK, yemek, bilgisayar, vergi ve diğerleri).',
    fields: [
      { key: 'minWage', label: 'Asgari ücret (net, aylık)', kind: 'money', unit: '₺', min: 0, step: 0.5, help: '2026 değeri net 28.075,50 ₺, brüt 33.030 ₺. Ocak 2027 artışı açıklanınca güncellenir.' },
      { key: 'minWageGross', label: 'Asgari ücret (brüt, aylık)', kind: 'money', unit: '₺', min: 0, step: 0.5, help: '2026 değeri brüt 33.030 ₺. Ücret applet’lerinde temel birim olarak seçilebilir.' },
      { key: 'costFactor', label: 'İşveren maliyeti çarpanı', kind: 'multiplier', unit: '× maaş', min: 1, step: 0.05 },
      { key: 'sahaSalary', label: 'Saha satış maaşı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000 },
      { key: 'masaSalary', label: 'Masa başı (CRM) maaşı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000, help: 'Net tutardır (kullanıcı kararı 2026-10-27).' },
      { key: 'segikaSalary', label: 'Segika masa başı (CRM) maaşı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000, help: 'Net tutardır (kullanıcı kararı 2026-10-27).' },
      { key: 'dijitalMultiplier', label: 'Dijital pazarlama', kind: 'multiplier', unit: '× asgari ücret', min: 0, step: 0.05 },
      { key: 'asistanMultiplier', label: 'Asistan', kind: 'multiplier', unit: '× asgari ücret', min: 0, step: 0.05 },
      { key: 'organizatorSalary', label: 'Organizatör maaşı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000, help: 'Net tutardır (kullanıcı kararı 2026-10-27).' },
      { key: 'leadUplift', label: 'Ekip lideri liderlik farkı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000 },
    ],
  },
  {
    id: 'prim',
    title: 'Prim ve kota',
    desc: 'Saha kotası, yani prim eşiği, saha personelinin kendi işveren maliyetine eşittir: maaş × maliyet çarpanı.',
    fields: [
      { key: 'commission', label: 'Satış başına prim', kind: 'money', unit: '₺', min: 0, step: 100 },
      { key: 'sponsorShare', label: 'MLM sponsor payı (tek seviye)', kind: 'money', unit: '₺ / satış', min: 0, step: 50, help: 'MLM, çok katlı pazarlama demektir. Pay yalnız bir üst seviyedeki sponsora ödenir.' },
      { key: 'leadTeamShare', label: 'Ekip lideri ekip payı', kind: 'money', unit: '₺ / satış', min: 0, step: 50 },
    ],
  },
  {
    id: 'butce',
    title: 'Bütçe ve Meta hunisi',
    desc: 'Meta reklamları işe alım içindir. Huninin ara aşamaları başvuru sayısına orantılı olarak değişir.',
    fields: [
      { key: 'metaWeekly', label: 'Meta reklam bütçesi', kind: 'money', unit: '₺ / hafta', min: 0, step: 500 },
      { key: 'aiToolsMonthly', label: 'Yapay zekâ ve otomasyon araçları (tavan)', kind: 'money', unit: '₺ / ay', min: 0, step: 500 },
      { key: 'applicationsWeekly', label: 'Başvuru (en fazla)', kind: 'count', unit: '/ hafta', min: 0 },
      { key: 'activeRepsWeekly', label: 'Aktif kalan temsilci', kind: 'number', unit: '/ hafta', min: 0, step: 0.1 },
    ],
  },
  {
    id: 'gelir',
    title: 'Gelir planı',
    desc: 'Bu grup kadro kapasitesini, ikinci saha personelinin başlangıcını, yıllık peşin ödeyenlerin payını ve kötümser senaryoyu belirler. Kadro kapasitesi, tam kapasitede kişi başına ayda kazanılan yeni aktif satıcı sayısıdır. İlk ay bu kapasitenin yüzde 50’si, ikinci ay yüzde 75’i kullanılır.',
    fields: [
      { key: 'simStartDate', label: 'Senaryo başlangıcı', kind: 'date', help: 'Tüm senaryolar, tablolar ve grafikler bu tarihten başlar (kullanıcı kararı: 19 Ekim 2026)' },
      { key: 'firstSaleDate', label: 'İlk satış', kind: 'date', help: 'İlk satışın varsayılan tarihidir. Satışa bağlı ödemeler bu tarihten önce sıfır kabul edilir. İlk ayın satış kapasitesi, ayda kalan günlerin oranıyla hesaplanır.' },
      { key: 'simEndDate', label: 'Ufuk sonu', kind: 'date', help: 'Senaryolar bu ayın sonuna kadar sürer (kullanıcı kararı: 2027 sonu)' },
      { key: 'sahaActivesMonthly', label: 'Saha personeli: aylık yeni aktif satıcı', kind: 'count', unit: 'satıcı / ay / kişi', min: 0, help: 'Günde yaklaşık 8 ziyaretle haftada yaklaşık 10 kayıt ve ayda 8 ilk ödeme varsayılır.' },
      { key: 'crmActivesMonthly', label: 'CRM masa başı: aylık yeni aktif satıcı', kind: 'count', unit: 'satıcı / ay', min: 0, help: 'Günde yaklaşık 40 arama ve 100 e-postayla haftada yaklaşık 5 kayıt varsayılır.' },
      { key: 'organizatorActivesMonthly', label: 'Organizatör: aylık yeni aktif satıcı', kind: 'count', unit: 'satıcı / ay', min: 0, help: 'Ayda 2 etkinlik ve etkinlik başına yaklaşık 25 katılımcıyla yaklaşık 30 kayıt varsayılır.' },
      { key: 'secondSahaDate', label: 'İkinci saha personelinin başlangıcı (sistem oturunca)', kind: 'date', help: 'Ayın ilk günü yazılır' },
      { key: 'annualShare', label: 'Yıllık peşin ödeyen yeni satıcı payı', kind: 'percent', unit: '%', min: 0, max: 100, help: 'Yıllık peşin ödeme 3.990 €’dur, bu tutar 10 aylık ücrete eşittir. Diğer yeni satıcılar ayda 399 € öder.' },
      { key: 'pessimisticFactor', label: 'Kötümser senaryo: kapasite çarpanı', kind: 'percent', unit: '%', min: 10, max: 100 },
      { key: 'pessimisticRetention', label: 'Kötümser senaryo: aylık elde tutma', kind: 'percent', unit: '%', min: 0, max: 100 },
    ],
  },
  {
    id: 'dijital',
    title: 'Dijital pazarlama: giderden gelire',
    desc: 'Satıcı kazanım reklamı aylık yeni aktif satıcı getirir: bütçe ÷ kayıt maliyeti × dönüşüm. İlk ay bu sayının yüzde 50’si, ikinci ay yüzde 75’i gerçekleşir. Organik içerik, dijital pazarlama uzmanının video hattından gelir. Meta işe alım reklamı ayrı bir kalemdir ve Bütçe grubundadır.',
    fields: [
      { key: 'dijitalAdBudgetMonthly', label: 'Satıcı kazanım reklam bütçesi', kind: 'money', unit: '₺ / ay', min: 0, step: 5_000, help: 'Meta ve Google Arama reklamlarını kapsar. 0 yazılırsa reklam verilmez.' },
      { key: 'dijitalCostPerLead', label: 'Kayıt başına reklam maliyeti', kind: 'money', unit: '₺ / kayıt', min: 1, step: 50, help: 'Kayıt, reklamdaki formu dolduran toptancıdır. Bu kişi işletmeler arası satışta (B2B) potansiyel müşteridir.' },
      { key: 'dijitalLeadToActive', label: 'Kayıttan ilk ödemeye dönüşüm', kind: 'percent', unit: '%', min: 0, max: 100, help: 'Kayıtlar CRM üzerinden arama ve WhatsApp ile takip edilir. Bu dönüşüm saha ziyaretindekinden düşüktür.' },
      { key: 'dijitalAdStartDate', label: 'Reklam başlangıcı', kind: 'date', help: 'Reklam, ölçüm araçları (pixel, UTM, CRM kaynak alanı) kurulduktan sonra başlar. Ayın ilk günü yazılır.' },
      { key: 'dijitalOrganicActivesMonthly', label: 'Organik içerik: aylık yeni aktif satıcı', kind: 'count', unit: 'satıcı / ay', min: 0, help: 'Günde 3 video ve haftada 10 CRM talebi düzeyinde bir içerik hattı varsayılır.' },
      { key: 'dijitalOrganicStartDate', label: 'Organik içerik başlangıcı', kind: 'date', help: 'İçerik hattı bu tarihte tam hıza ulaşır, Ocak’ta günde 3 video üretilir. Ayın ilk günü yazılır.' },
    ],
  },
  {
    id: 'buyume',
    title: 'Büyüme',
    desc: 'Gelir planı zamanla büyür veya küçülür, düz çizgi olarak kalmaz (kullanıcı kararı 2026-10-27). ₺ fiyat kurla birlikte artar ve temsilci ağı her ay genişler. Reklam bütçesi LTV ÷ CAC kuralına göre ölçeklenir. LTV bir satıcıdan beklenen toplam gelir, CAC ise bir satıcıyı kazanma maliyetidir. Kârlı senaryolarda saha kadrosu belirli aralıklarla büyür, kötümser senaryoda büyüme olmaz.',
    fields: [
      { key: 'eurTryGrowth', label: 'Kur artışı (₺/€, yıllık)', kind: 'percent', unit: '% / yıl', min: 0, max: 200, help: '€ fiyat sabit kalır, ₺ karşılığı her ay bileşik olarak artar. 2026 TÜFE (tüketici fiyat endeksi) yaklaşık %30’dur.' },
      { key: 'repPerMonth', label: 'Temsilci ağı: her ay eklenen temsilci', kind: 'count', unit: 'kişi / ay', min: 0 },
      { key: 'repCap', label: 'Temsilci ağı: üst sınır', kind: 'count', unit: 'temsilci', min: 0 },
      { key: 'sahaMaxCount', label: 'Saha personeli üst sınırı (büyüme kuralıyla)', kind: 'count', unit: 'kişi', min: 1, help: 'İlk iki saha personeli bu sayıya dahildir. Medyan senaryoda her 6 ayda, iyimser senaryoda her 4 ayda 1 kişi eklenir.' },
      { key: 'dijitalScaleMax', label: 'Reklam bütçesi ölçek tavanı', kind: 'multiplier', unit: '× başlangıç', min: 1, step: 0.5, help: 'LTV ÷ CAC en az 3 ise bütçe her 3 ayda 1,5 katına çıkar.' },
    ],
  },
  {
    id: 'nakit',
    title: 'Nakit akışı',
    desc: 'Bu grup nakit akış tablosunun başlangıç nakdini ve yatırım girişini belirler. Tablodaki girişler gelir planı senaryosundan, giderler ise Sheets’ten gelir.',
    fields: [
      { key: 'openingCash', label: 'Başlangıç nakdi (Ekim 2026)', kind: 'money', unit: '₺', min: 0, step: 100_000 },
      { key: 'investmentAmount', label: 'Yatırım girişi', kind: 'money', unit: '₺', min: 0, step: 500_000, help: '0 yazılırsa yatırım girişi olmaz ve tablo nakit açığını gösterir.' },
      { key: 'investmentDate', label: 'Yatırım girişi ayı', kind: 'date', help: 'Ayın ilk günü yazılır. Tarih Ekim 2026 ile Aralık 2027 arasında değilse tabloya girmez.' },
    ],
  },
  {
    id: 'mesai',
    title: 'Mesai (yasal tavan)',
    desc: '4857 sayılı İş Kanunu’na göre normal çalışma haftada 45 saattir. Günlük çalışma en çok 11 saat olabilir.',
    fields: [{ key: 'overtimeCap', label: 'Yıllık fazla çalışma tavanı', kind: 'count', unit: 'saat', min: 0, help: '4857 sayılı kanunun 41. maddesine göre yılda en çok 270 saat.' }],
  },
];

export const PARAMS_KEY = 'istoc-plan-parametreler';

/** Kayıtlı değerleri okur; bilinmeyen anahtar ve tür uyuşmazlığı varsayılanla değişir. */
/** Alan tanımları anahtara göre (doğrulama için). */
const DEFS: Partial<Record<ParamKey, ParamDef>> = Object.fromEntries(PARAM_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f])));
const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Saklanan değerin alanın anlamına uygunluğu (docs/missings.md MS-05 / T05): tür eşleşmesi yetmez — tarih alanı geçerli bir
 * ISO gün olmalı; sayı sonlu ve alan tanımındaki min–max içinde olmalı. Geçersiz değer domain’e geçmez (varsayılan kalır).
 */
export function gecerliParametre(key: ParamKey, value: unknown): boolean {
  const d = DEFAULT_PARAMS[key];
  if (typeof value !== typeof d) return false;
  const def = DEFS[key];
  if (typeof value === 'string') {
    if (def?.kind === 'date' || ISO_GUN.test(d as string)) {
      if (!ISO_GUN.test(value)) return false;
      const t = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === value;
    }
    return true;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return false;
    if (def?.min !== undefined && value < def.min) return false;
    if (def?.max !== undefined && value > def.max) return false;
  }
  return true;
}

/**
 * Tarayıcı kaydını doğrulayarak yükler (MS-05): geçersiz alanlar varsayılana döner ve `gecersiz` listesinde bildirilir; ham
 * metin korunur (kayıt sessizce yeniden yazılmaz — ilk kullanıcı kaydında geçersizler düşer). Kayıt yoksa `params: null`.
 */
export function loadParamsDetay(): { params: Params | null; gecersiz: ParamKey[]; ham: string | null } {
  let ham: string | null = null;
  try {
    ham = localStorage.getItem(PARAMS_KEY);
    if (!ham) return { params: null, gecersiz: [], ham: null };
    const stored = JSON.parse(ham) as Partial<Record<string, unknown>> | null;
    if (!stored || typeof stored !== 'object') return { params: null, gecersiz: [], ham };
    const merged = { ...DEFAULT_PARAMS } as Record<string, unknown>;
    const gecersiz: ParamKey[] = [];
    for (const key of Object.keys(DEFAULT_PARAMS) as ParamKey[]) {
      if (!(key in stored)) continue;
      const value = stored[key];
      if (gecerliParametre(key, value)) merged[key] = value;
      else gecersiz.push(key);
    }
    return { params: merged as Params, gecersiz, ham };
  } catch {
    return { params: null, gecersiz: [], ham };
  }
}

export function loadParams(): Params | null {
  return loadParamsDetay().params;
}

/** Alanın görünen adı (bildirimler için); tanımı yoksa anahtar. */
export const paramEtiketi = (key: ParamKey) => DEFS[key]?.label ?? key;

export function saveParams(params: Params) {
  try {
    const changed = Object.fromEntries(
      (Object.keys(DEFAULT_PARAMS) as ParamKey[]).filter((k) => params[k] !== DEFAULT_PARAMS[k]).map((k) => [k, params[k]]),
    );
    if (Object.keys(changed).length) localStorage.setItem(PARAMS_KEY, JSON.stringify(changed));
    else localStorage.removeItem(PARAMS_KEY);
    return true;
  } catch {
    return false;
  }
}

export const changedKeys = (params: Params) => (Object.keys(DEFAULT_PARAMS) as ParamKey[]).filter((k) => params[k] !== DEFAULT_PARAMS[k]);
