import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { buildModel, DEFAULT_MODEL, type Model } from '../data/model';
import { changedKeys, DEFAULT_PARAMS, loadParams, PARAMS_KEY, saveParams, type Params } from '../data/params';

interface ModelState {
  model: Model;
  params: Params;
  /** Değiştirilen parametre sayısı (varsayılana göre). */
  changed: number;
  /** Son kayıt zamanı; tarayıcı depolaması kapalıysa false. */
  saved: Date | false | null;
  setParam: <K extends keyof Params>(key: K, value: Params[K]) => void;
  reset: () => void;
}

const Ctx = createContext<ModelState | null>(null);

/**
 * Sunucu ve ilk hidrasyon varsayılanlarla çizer (eşleşme bozulmasın); ardından tarayıcıdaki kayıtlı parametreler
 * okunur. Başka sekmede yapılan değişiklik `storage` olayıyla anında yansır.
 */
export function ModelProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [saved, setSaved] = useState<Date | false | null>(null);

  useEffect(() => {
    const stored = loadParams();
    if (stored) setParams(stored);
    const onStorage = (event: StorageEvent) => {
      if (event.key === PARAMS_KEY || event.key === null) setParams(loadParams() ?? DEFAULT_PARAMS);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((next: Params) => {
    setParams(next);
    setSaved(saveParams(next) ? new Date() : false);
  }, []);

  const setParam = useCallback(
    <K extends keyof Params>(key: K, value: Params[K]) => {
      setParams((current) => {
        const next = { ...current, [key]: value };
        setSaved(saveParams(next) ? new Date() : false);
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => update(DEFAULT_PARAMS), [update]);

  const model = useMemo(() => (params === DEFAULT_PARAMS ? DEFAULT_MODEL : buildModel(params)), [params]);
  const value = useMemo(
    () => ({ model, params, changed: changedKeys(params).length, saved, setParam, reset }),
    [model, params, saved, setParam, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useModelState() {
  const state = useContext(Ctx);
  if (!state) throw new Error('ModelProvider eksik');
  return state;
}

export const useModel = () => useModelState().model;
export const useParams = () => useModelState();
