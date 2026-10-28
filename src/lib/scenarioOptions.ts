/**
 * Senaryo seçenekleri (kullanıcı kararı 2026-10-27: “seçenekleri en başta seçeyim, kalan tüm veri tek seferde değişsin;
 * hazır seçilmiş seçenek kümeleri örnek senaryolar olarak en başta seçilebilsin”). Tek durum: temel senaryo (kötümser ·
 * medyan · iyimser; nakit akış tablosu ve istihdam takvimiyle ortak `istoc-plan-senaryo`) + üstüne seçenekler. Hazır
 * kümeler (`PRESETS`) seçenekleri tek dokunuşla kurar; seçenek değişince senaryo “özel” olur (temel + n değişiklik).
 * Durum bu tarayıcıda saklanır (`istoc-plan-senaryo-secenekler`) ve adres çubuğuna yazılır (paylaşılabilir bağlantı;
 * adresteki seçenekler açılışta öne geçer).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultFilters, type BreakevenFilters, type GiderKaynak } from '../data/breakeven';
import type { Params } from '../data/params';
import type { RoleKey } from '../data/types';
import { SCENARIO_IDS, SCENARIO_KEY, useScenario, type ScenarioId } from './scenario';

export type ScenarioOptions = BreakevenFilters;
export const OPTIONS_KEY = 'istoc-plan-senaryo-secenekler';

export interface Preset {
  id: string;
  name: string;
  role: RoleKey;
  desc: string;
  base: ScenarioId;
  /** Varsayılan filtrelere göre değişiklikler */
  options: Partial<ScenarioOptions>;
}

/** Hazır senaryolar: üç temel küme ve dört örnek bileşim (kullanıcı kararı 2026-10-27). */
export function presetsOf(p: Params): Preset[] {
  return [
    { id: 'kotumser', name: 'Kötümser', role: 'dijital-pazarlama', base: 'kotumser', desc: `Kapasitenin yüzde ${p.pessimisticFactor} kadarı; aylık abonelerin yüzde ${p.pessimisticRetention} kadarının sonraki ay yenilediği varsayılır; saha kadrosu büyümez; diğer değerler genel plan ayarlarından alınır.`, options: {} },
    { id: 'medyan', name: 'Medyan', role: 'saha-uzmani', base: 'medyan', desc: `Plan senaryosu (adı Medyan; bir varsayım kümesidir, ölçülmüş istatistiksel medyan değildir): satış kanallarının tanımlı tam kapasitesi; aylık abonelerin yüzde ${p.planRetention} kadarının sonraki ay yenilediği varsayılır; ikinci saha çalışanından sonra her 6 ayda bir saha çalışanı eklenir; diğer değerler genel plan ayarlarından alınır.`, options: {} },
    { id: 'iyimser', name: 'İyimser', role: 'pazarlamaci', base: 'iyimser', desc: `Kapasitenin yüzde 130 kadarı; aylık yenileme oranı plan senaryosuna göre 10 yüzde puan daha yüksek varsayılır (%${p.planRetention} yerine %${Math.min(90, p.planRetention + 10)}); ikinci saha çalışanından sonra her 4 ayda bir saha çalışanı eklenir; diğer değerler genel plan ayarlarından alınır.`, options: {} },
    { id: 'saha', name: 'Saha ağırlıklı', role: 'ekip-lideri', base: 'medyan', desc: 'Medyan + ikinci saha Aralık’ta, +2 ek saha, her 4 ayda +1 saha; satıcı kazanım reklamı yok.', options: { secondSahaIso: '2026-12-01', extraSaha: 2, sahaGrowthEvery: 4, dijitalBudgetFactor: 0 } },
    { id: 'dijital', name: 'Dijital ağırlıklı', role: 'organizator', base: 'medyan', desc: 'Medyan + reklam bütçesi 4×, LTV ÷ CAC kuralıyla ölçek; saha büyümesi yok, ikinci saha Mart 2027.', options: { dijitalBudgetFactor: 4, sahaGrowthEvery: 0, secondSahaIso: '2027-03-01' } },
    { id: 'tutumlu', name: 'Tutumlu', role: 'asistan', base: 'medyan', desc: 'Medyan + kur sabit, reklam bütçesi sabit (ölçek yok), saha büyümesi yok, ikinci saha Mart 2027; yıllık peşin payı %40.', options: { fxGrowth: 0, dijitalScale: false, sahaGrowthEvery: 0, secondSahaIso: '2027-03-01', annualShare: 0.4 } },
    { id: 'yatirimli', name: 'Yatırımlı büyüme', role: 'yatirimci', base: 'iyimser', desc: 'İyimser + +1 ek saha, her 3 ayda +1 saha, reklam bütçesi 2×; 250 bin ₺ / ay ek sabit gider (ofis ve ekip).', options: { extraSaha: 1, sahaGrowthEvery: 3, dijitalBudgetFactor: 2, ekSabit: 250_000 } },
  ];
}

/** Seçenek anahtarları (adres çubuğu ve saklama); sıra URL’deki sıradır. */
const KEYS: (keyof ScenarioOptions)[] = ['factor', 'retention', 'annualShare', 'priceEur', 'secondSahaIso', 'extraSaha', 'dijitalBudgetFactor', 'dijitalScale', 'fxGrowth', 'sahaGrowthEvery', 'kaynak', 'ekSabit', 'primDahil'];
const URL_KEYS: Record<keyof ScenarioOptions, string> = {
  factor: 'kapasite',
  retention: 'eldetutma',
  annualShare: 'yillikpay',
  priceEur: 'ucret',
  secondSahaIso: 'saha2',
  extraSaha: 'eksaha',
  dijitalBudgetFactor: 'reklam',
  dijitalScale: 'olcek',
  fxGrowth: 'kur',
  sahaGrowthEvery: 'buyume',
  kaynak: 'gider',
  ekSabit: 'eksabit',
  primDahil: 'prim',
};

const enc = (v: unknown) => (v === null ? 'param' : typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
function dec(key: keyof ScenarioOptions, raw: string, d: ScenarioOptions): ScenarioOptions[keyof ScenarioOptions] | undefined {
  if (raw === 'param') return key === 'factor' || key === 'retention' || key === 'fxGrowth' || key === 'sahaGrowthEvery' ? null : undefined;
  const ref = d[key];
  if (typeof ref === 'boolean') return raw === '1';
  if (key === 'kaynak') return raw === 'plan' || raw === 'sheets' ? (raw as GiderKaynak) : undefined;
  if (key === 'secondSahaIso') return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function optionsEqual(a: ScenarioOptions, b: ScenarioOptions) {
  return KEYS.every((k) => a[k] === b[k]);
}

/** Hazır kümenin tam seçenekleri. */
export function presetOptions(p: Params, preset: Preset): ScenarioOptions {
  return { ...defaultFilters(p), ...preset.options };
}

/** Seçeneklerin hangi hazır kümeye (temel senaryo dahil) denk geldiği; yoksa null. */
export function matchPreset(p: Params, presets: Preset[], base: ScenarioId, opts: ScenarioOptions): Preset | null {
  return presets.find((x) => x.base === base && optionsEqual(presetOptions(p, x), opts)) ?? null;
}

/** Varsayılan filtrelerden farklı seçenek sayısı. */
export function diffCount(p: Params, opts: ScenarioOptions) {
  const d = defaultFilters(p);
  return KEYS.filter((k) => opts[k] !== d[k]).length;
}

/**
 * Seçili senaryonun görünen adı ve rolü: hazır kümenin adı ya da “Özel: Temel + n değişiklik”. Gelir planı ve nakit akışı
 * aynı adı gösterir (B2, ct-F04: aynı durum, aynı ad).
 */
export function scenarioLabel(s: { presets: Preset[]; base: ScenarioId; preset: Preset | null; changes: number }): { ad: string; role: RoleKey } {
  const temel = s.presets.find((x) => x.id === s.base)!;
  return s.preset ? { ad: s.preset.name, role: s.preset.role } : { ad: `Özel: ${temel.name} + ${s.changes} değişiklik`, role: temel.role };
}

export function toQuery(base: ScenarioId, opts: ScenarioOptions, d: ScenarioOptions): string {
  const q = new URLSearchParams();
  q.set('senaryo', base);
  for (const k of KEYS) if (opts[k] !== d[k]) q.set(URL_KEYS[k], enc(opts[k]));
  return q.toString();
}

export function fromQuery(search: string, d: ScenarioOptions): { base: ScenarioId | null; opts: Partial<ScenarioOptions>; present: boolean } {
  const q = new URLSearchParams(search);
  const baseRaw = q.get('senaryo');
  const base = baseRaw && (SCENARIO_IDS as string[]).includes(baseRaw) ? (baseRaw as ScenarioId) : null;
  const opts: Partial<ScenarioOptions> = {};
  let present = base !== null;
  for (const k of KEYS) {
    const raw = q.get(URL_KEYS[k]);
    if (raw === null) continue;
    const v = dec(k, raw, d);
    if (v !== undefined) {
      (opts as Record<string, unknown>)[k] = v;
      present = true;
    }
  }
  return { base, opts, present };
}

/**
 * Tek durum: temel senaryo + seçenekler. Açılışta adres çubuğu > saklanan seçenekler > varsayılan; her değişiklik
 * saklanır ve adrese yazılır (`history.replaceState`). Sunucu çiziminde varsayılan (hidrasyon eşleşmesi bozulmaz).
 */
export function useScenarioOptions(p: Params) {
  const [base, setBase] = useScenario();
  const d = useMemo(() => defaultFilters(p), [p]);
  const presets = useMemo(() => presetsOf(p), [p]);
  const [opts, setOptsState] = useState<ScenarioOptions>(d);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let next: ScenarioOptions = d;
    try {
      const raw = localStorage.getItem(OPTIONS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<ScenarioOptions>;
        next = { ...d };
        // Saklanan değer türü varsayılanla uyuşmalı; varsayılanı `null` (kaynağı izle) olan alanlarda sabitlenmiş sayı da geçerlidir
        // (gorsel_algi.md F02 / V03, 2026-10-28: sabit değer yeniden açılışta ve başka sayfadan senaryo değişince korunur).
        for (const k of KEYS) {
          if (!(k in saved)) continue;
          const v = saved[k];
          if (v === null || typeof v === typeof d[k] || (d[k] === null && typeof v === 'number')) (next as unknown as Record<string, unknown>)[k] = v;
        }
      }
    } catch {
      /* depolama kapalı */
    }
    const url = fromQuery(window.location.search, d);
    if (url.present) {
      next = { ...next, ...url.opts };
      if (url.base) {
        setBase(url.base);
        try {
          localStorage.setItem(SCENARIO_KEY, url.base);
        } catch {
          /* depolama kapalı */
        }
      }
    }
    setOptsState(next);
    setReady(true);
  }, [d, setBase]);

  const persist = useCallback(
    (nextBase: ScenarioId, nextOpts: ScenarioOptions) => {
      try {
        localStorage.setItem(OPTIONS_KEY, JSON.stringify(nextOpts));
      } catch {
        /* depolama kapalı */
      }
      try {
        const q = toQuery(nextBase, nextOpts, d);
        const url = `${window.location.pathname}?${q}${window.location.hash}`;
        window.history.replaceState(window.history.state, '', url);
      } catch {
        /* adres yazılamadı */
      }
    },
    [d],
  );

  useEffect(() => {
    if (ready) persist(base, opts);
  }, [ready, base, opts, persist]);

  const set = useCallback(<K extends keyof ScenarioOptions>(k: K, v: ScenarioOptions[K]) => setOptsState((o) => ({ ...o, [k]: v })), []);
  const applyPreset = useCallback(
    (id: string) => {
      const preset = presets.find((x) => x.id === id);
      if (!preset) return;
      setBase(preset.base);
      setOptsState(presetOptions(p, preset));
    },
    [presets, p, setBase],
  );
  const reset = useCallback(() => setOptsState(d), [d]);
  const preset = useMemo(() => matchPreset(p, presets, base, opts), [p, presets, base, opts]);
  const changes = useMemo(() => diffCount(p, opts), [p, opts]);
  const shareUrl = useCallback(() => (typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}?${toQuery(base, opts, d)}`), [base, opts, d]);
  return { base, setBase, opts, set, applyPreset, reset, presets, preset, changes, ready, shareUrl };
}
