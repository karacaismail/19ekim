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
  costFactor: 2,
  sahaSalary: 60_000,
  masaMultiplier: 1.25,
  segikaMultiplier: 1.25,
  dijitalMultiplier: 1.25,
  asistanMultiplier: 1.5,
  organizatorMultiplier: 2,
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
    desc: 'Program başlangıcı tüm planı, Aralık başlangıcı organizatör, ekip lideri ve 3. saha kişisinin planını kaydırır.',
    fields: [
      { key: 'startDate', label: 'Program başlangıcı (5 kişi + Segika)', kind: 'date', help: '60. ve 90. gün kontrolleri buna göre' },
      { key: 'decStartDate', label: 'Aralık başlangıcı (organizatör, ekip lideri, 3. saha)', kind: 'date' },
      { key: 'metaStartDate', label: 'Meta işe alım reklamları başlangıcı', kind: 'date' },
      { key: 'dijitalAltDate', label: 'Asistan yoksa dijital pazarlama başlangıcı', kind: 'date' },
    ],
  },
  {
    id: 'hedef',
    title: '90 gün hedefleri',
    desc: 'Kaynak dağılımı yeni toplamlara orantılı ölçeklenir.',
    fields: [
      { key: 'ciroTarget', label: 'Ciro hedefi', kind: 'money', unit: '₺', min: 0, step: 50_000 },
      { key: 'activeTarget', label: 'Aktif satıcı hedefi', kind: 'count', unit: 'satıcı', min: 1 },
      { key: 'memberTarget', label: 'Üye satıcı hedefi', kind: 'count', unit: 'satıcı', min: 0 },
      { key: 'subscriptionEur', label: 'Aktif satıcı aboneliği', kind: 'number', unit: '€ / ay', min: 0 },
      { key: 'eurTry', label: 'Kur', kind: 'rate', unit: '₺ / €', min: 0, step: 0.01 },
      { key: 'annualMonths', label: 'Yıllık peşinde ödenen ay', kind: 'count', unit: 'ay', min: 1, max: 12, help: '“2 ay bedava” = 10' },
      { key: 'planRetention', label: 'Plan senaryosu: aylık elde tutma', kind: 'percent', unit: '%', min: 0, max: 100 },
    ],
  },
  {
    id: 'kadro',
    title: 'Kadro (kişi sayısı)',
    desc: 'İşe alım sırası, organizasyon şeması ve maliyet hesapları buna göre.',
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
      { key: 'minWage', label: 'Asgari ücret (net, aylık)', kind: 'money', unit: '₺', min: 0, step: 0.5, help: '2026: net 28.075,50 ₺ (brüt 33.030 ₺); Ocak 2027 artışı açıklanınca güncellenir' },
      { key: 'costFactor', label: 'İşveren maliyeti çarpanı', kind: 'multiplier', unit: '× maaş', min: 1, step: 0.05 },
      { key: 'sahaSalary', label: 'Saha satış maaşı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000 },
      { key: 'masaMultiplier', label: 'Masa başı (CRM)', kind: 'multiplier', unit: '× asgari ücret', min: 0, step: 0.05 },
      { key: 'segikaMultiplier', label: 'Segika masa başı (CRM)', kind: 'multiplier', unit: '× asgari ücret', min: 0, step: 0.05 },
      { key: 'dijitalMultiplier', label: 'Dijital pazarlama', kind: 'multiplier', unit: '× asgari ücret', min: 0, step: 0.05 },
      { key: 'asistanMultiplier', label: 'Asistan', kind: 'multiplier', unit: '× asgari ücret', min: 0, step: 0.05 },
      { key: 'organizatorMultiplier', label: 'Organizatör', kind: 'multiplier', unit: '× asgari ücret', min: 0, step: 0.05 },
      { key: 'leadUplift', label: 'Ekip lideri liderlik farkı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000 },
    ],
  },
  {
    id: 'prim',
    title: 'Prim ve kota',
    desc: 'Saha kotası (prim eşiği) kendi işveren maliyetidir: maaş × maliyet çarpanı.',
    fields: [
      { key: 'commission', label: 'Satış başına prim', kind: 'money', unit: '₺', min: 0, step: 100 },
      { key: 'sponsorShare', label: 'MLM sponsor payı (tek seviye)', kind: 'money', unit: '₺ / satış', min: 0, step: 50 },
      { key: 'leadTeamShare', label: 'Ekip lideri ekip payı', kind: 'money', unit: '₺ / satış', min: 0, step: 50 },
    ],
  },
  {
    id: 'butce',
    title: 'Bütçe ve Meta hunisi',
    desc: 'Meta reklamları işe alım içindir; huni ara aşamaları başvuruya orantılı ölçeklenir.',
    fields: [
      { key: 'metaWeekly', label: 'Meta reklam bütçesi', kind: 'money', unit: '₺ / hafta', min: 0, step: 500 },
      { key: 'aiToolsMonthly', label: 'Yapay zekâ ve otomasyon araçları (tavan)', kind: 'money', unit: '₺ / ay', min: 0, step: 500 },
      { key: 'applicationsWeekly', label: 'Başvuru (en fazla)', kind: 'count', unit: '/ hafta', min: 0 },
      { key: 'activeRepsWeekly', label: 'Aktif kalan temsilci', kind: 'number', unit: '/ hafta', min: 0, step: 0.1 },
    ],
  },
  {
    id: 'mesai',
    title: 'Mesai (yasal tavan)',
    desc: '4857 sayılı İş Kanunu: haftada 45 saat normal, günde en çok 11 saat.',
    fields: [{ key: 'overtimeCap', label: 'Yıllık fazla çalışma tavanı', kind: 'count', unit: 'saat', min: 0, help: '4857/41: 270 saat' }],
  },
];

export const PARAMS_KEY = 'istoc-plan-parametreler';

/** Kayıtlı değerleri okur; bilinmeyen anahtar ve tür uyuşmazlığı varsayılanla değişir. */
export function loadParams(): Params | null {
  try {
    const raw = localStorage.getItem(PARAMS_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<Record<string, unknown>>;
    const merged = { ...DEFAULT_PARAMS } as Record<string, unknown>;
    for (const key of Object.keys(DEFAULT_PARAMS) as ParamKey[]) {
      const value = stored[key];
      if (typeof value === typeof DEFAULT_PARAMS[key]) merged[key] = value;
    }
    return merged as Params;
  } catch {
    return null;
  }
}

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
