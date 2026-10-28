import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { buildModel, DEFAULT_MODEL, type Model } from '../data/model';
import { changedKeys, DEFAULT_PARAMS, loadParamsDetay, PARAMS_KEY, saveParams, type ParamKey, type Params } from '../data/params';

interface ModelState {
  model: Model;
  params: Params;
  /** Değiştirilen parametre sayısı (varsayılana göre). */
  changed: number;
  /** Son kayıt zamanı; tarayıcı depolaması kapalıysa false. */
  saved: Date | false | null;
  /** Kayıttan okunamayan (geçersiz) alanlar: varsayılan kullanıldı, kayıt ilk yazıma kadar dokunulmadı (MS-05). */
  gecersiz: ParamKey[];
  setParam: <K extends keyof Params>(key: K, value: Params[K]) => void;
  reset: () => void;
  /** Bütün parametreleri verilen kümeye getirir (ör. sıfırlamayı geri alma); tarayıcıya kaydeder. */
  restore: (next: Params) => void;
}

const Ctx = createContext<ModelState | null>(null);

/**
 * Sunucu ve ilk hidrasyon varsayılanlarla çizer (eşleşme bozulmasın); ardından tarayıcıdaki kayıtlı parametreler
 * okunur. Başka sekmede yapılan değişiklik `storage` olayıyla anında yansır.
 */
export function ModelProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [saved, setSaved] = useState<Date | false | null>(null);
  const [gecersiz, setGecersiz] = useState<ParamKey[]>([]);

  useEffect(() => {
    // Hidrasyon tamamlandı: etkileşim artık React’e ulaşır (testler ve kayıtlı parametreler için sinyal).
    document.documentElement.setAttribute('data-hydrated', '');
    const okunan = loadParamsDetay();
    if (okunan.params) setParams(okunan.params);
    setGecersiz(okunan.gecersiz);
    const onStorage = (event: StorageEvent) => {
      if (event.key === PARAMS_KEY || event.key === null) {
        const yeni = loadParamsDetay();
        setParams(yeni.params ?? DEFAULT_PARAMS);
        setGecersiz(yeni.gecersiz);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Kullanıcı kaydı başarılıysa geçersiz girdiler kayıttan düşmüştür (bilinçli yazım; MS-05).
  const update = useCallback((next: Params) => {
    setParams(next);
    const ok = saveParams(next);
    setSaved(ok ? new Date() : false);
    if (ok) setGecersiz([]);
  }, []);

  const setParam = useCallback(
    <K extends keyof Params>(key: K, value: Params[K]) => {
      setParams((current) => {
        const next = { ...current, [key]: value };
        const ok = saveParams(next);
        setSaved(ok ? new Date() : false);
        if (ok) setGecersiz([]);
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => update(DEFAULT_PARAMS), [update]);
  const restore = useCallback((next: Params) => update(next), [update]);

  const model = useMemo(() => (params === DEFAULT_PARAMS ? DEFAULT_MODEL : buildModel(params)), [params]);
  const value = useMemo(
    () => ({ model, params, changed: changedKeys(params).length, saved, gecersiz, setParam, reset, restore }),
    [model, params, saved, gecersiz, setParam, reset, restore],
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
