/**
 * Senaryo seçimi (kullanıcı kararı 2026-10-27): kötümser · medyan · iyimser. Gelir planı ve nakit akış tablosu aynı
 * seçimi paylaşır; seçim yalnız bu tarayıcıda saklanır (`istoc-plan-senaryo`), başka sekmeye `storage` olayıyla yansır.
 * Sunucu ve ilk çizim medyan; kayıtlı seçim hidrasyondan sonra okunur (eşleşme bozulmaz).
 */
import { useCallback, useEffect, useState } from 'react';

export type ScenarioId = 'kotumser' | 'medyan' | 'iyimser';
export const SCENARIO_IDS: ScenarioId[] = ['kotumser', 'medyan', 'iyimser'];
export const SCENARIO_KEY = 'istoc-plan-senaryo';

const valid = (v: unknown): v is ScenarioId => typeof v === 'string' && (SCENARIO_IDS as string[]).includes(v);

export function useScenario(): [ScenarioId, (id: ScenarioId) => void] {
  const [id, setId] = useState<ScenarioId>('medyan');
  useEffect(() => {
    const read = () => {
      try {
        const v = localStorage.getItem(SCENARIO_KEY);
        setId(valid(v) ? v : 'medyan');
      } catch {
        /* depolama kapalı: seçim yalnız bu sayfada geçerli */
      }
    };
    read();
    const on = (e: StorageEvent) => {
      if (e.key === SCENARIO_KEY || e.key === null) read();
    };
    window.addEventListener('storage', on);
    return () => window.removeEventListener('storage', on);
  }, []);
  const set = useCallback((next: ScenarioId) => {
    setId(next);
    try {
      localStorage.setItem(SCENARIO_KEY, next);
    } catch {
      /* depolama kapalı */
    }
  }, []);
  return [id, set];
}
