import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { VARSAYILAN, type AppletDurum } from '../data/applet';

/**
 * Applet durumu: her applet kendi dilimini okur ve yazar; yalnız o dilimi kullanan bileşen yeniden çizilir.
 * Sunucu ve ilk hidrasyon varsayılanlarla çizer; ardından bu tarayıcıdaki kayıt (yalnız varsayılandan farklı
 * dilimler) okunur. Başka sekmedeki değişiklik `storage` olayıyla yansır. Depolama kapalıysa değerler yalnız sayfa
 * açıkken geçerlidir.
 */
export const APPLET_KEY = 'turksab-applet';
const SURUM = 1;

type Anahtar = keyof AppletDurum;

let durum: AppletDurum = VARSAYILAN;
let surum = 0;
let kayit: Date | false | null = null;
const dilimDinleyici = new Map<Anahtar, Set<() => void>>();
const genelDinleyici = new Set<() => void>();
const anahtarlar = Object.keys(VARSAYILAN) as Anahtar[];
const varsayilanJson = Object.fromEntries(anahtarlar.map((k) => [k, JSON.stringify(VARSAYILAN[k])])) as Record<Anahtar, string>;
/** Değer olarak farklı mı (aynı değerlere geri dönülen dilim “değişti” sayılmaz). */
const farkli = (k: Anahtar) => durum[k] !== VARSAYILAN[k] && JSON.stringify(durum[k]) !== varsayilanJson[k];

function bildir(k: Anahtar) {
  surum += 1;
  dilimDinleyici.get(k)?.forEach((f) => f());
  genelDinleyici.forEach((f) => f());
}

/** Kayıtlı dilim varsayılanla aynı biçimde değilse (eski sürüm, bozuk veri) varsayılan kullanılır. */
function dilimBirlestir<K extends Anahtar>(k: K, kayitli: unknown): AppletDurum[K] {
  const varsayilan = VARSAYILAN[k] as Record<string, unknown>;
  if (!kayitli || typeof kayitli !== 'object' || Array.isArray(kayitli)) return VARSAYILAN[k];
  const sonuc: Record<string, unknown> = { ...varsayilan };
  for (const [alan, deger] of Object.entries(kayitli as Record<string, unknown>)) {
    if (!(alan in varsayilan)) continue;
    const ornek = varsayilan[alan];
    const ayniTur = Array.isArray(ornek) ? Array.isArray(deger) : typeof deger === typeof ornek && deger !== null;
    if (ayniTur && !(typeof deger === 'number' && !Number.isFinite(deger))) sonuc[alan] = deger;
  }
  return sonuc as AppletDurum[K];
}

function oku(): AppletDurum {
  try {
    const raw = localStorage.getItem(APPLET_KEY);
    if (!raw) return VARSAYILAN;
    const veri = JSON.parse(raw) as { v?: number; d?: Record<string, unknown> };
    if (veri.v !== SURUM || !veri.d) return VARSAYILAN;
    const sonuc = { ...VARSAYILAN };
    for (const k of anahtarlar) if (k in veri.d) (sonuc as Record<Anahtar, unknown>)[k] = dilimBirlestir(k, veri.d[k]);
    return sonuc;
  } catch {
    return VARSAYILAN;
  }
}

function yaz() {
  try {
    const d: Partial<Record<Anahtar, unknown>> = {};
    for (const k of anahtarlar) if (farkli(k)) d[k] = durum[k];
    if (Object.keys(d).length) localStorage.setItem(APPLET_KEY, JSON.stringify({ v: SURUM, d }));
    else localStorage.removeItem(APPLET_KEY);
    kayit = new Date();
  } catch {
    kayit = false;
  }
}

function yukle(sonraki: AppletDurum) {
  const onceki = durum;
  durum = sonraki;
  for (const k of anahtarlar) if (onceki[k] !== sonraki[k]) bildir(k);
}

let baglandi = false;

/** Sayfa bir kez çağırır: kaydı okur ve başka sekmeyi dinler. */
export function useAppletKaydi() {
  useEffect(() => {
    if (baglandi) return undefined;
    baglandi = true;
    yukle(oku());
    const dinle = (e: StorageEvent) => {
      if (e.key === APPLET_KEY || e.key === null) yukle(oku());
    };
    window.addEventListener('storage', dinle);
    return () => {
      baglandi = false;
      window.removeEventListener('storage', dinle);
    };
  }, []);
}

type Guncelle<T> = T | ((onceki: T) => T);

export function useDilim<K extends Anahtar>(k: K): [AppletDurum[K], (sonraki: Guncelle<AppletDurum[K]>) => void] {
  const abone = useCallback(
    (f: () => void) => {
      const set = dilimDinleyici.get(k) ?? new Set();
      set.add(f);
      dilimDinleyici.set(k, set);
      return () => set.delete(f);
    },
    [k],
  );
  const deger = useSyncExternalStore(
    abone,
    () => durum[k],
    () => VARSAYILAN[k],
  );
  const ayarla = useCallback(
    (sonraki: Guncelle<AppletDurum[K]>) => {
      const v = typeof sonraki === 'function' ? (sonraki as (o: AppletDurum[K]) => AppletDurum[K])(durum[k]) : sonraki;
      if (v === durum[k]) return;
      durum = { ...durum, [k]: v };
      yaz();
      bildir(k);
    },
    [k],
  );
  return [deger, ayarla];
}

/** Tüm applet’leri örnek değerlere döndürür ve kaydı siler. */
export function ornekDegerlereDon() {
  const onceki = durum;
  durum = VARSAYILAN;
  yaz();
  for (const k of anahtarlar) if (onceki[k] !== VARSAYILAN[k]) bildir(k);
}

/** Değişen applet sayısı, son kayıt ve tümünü sıfırlama (başlık araç çubuğu). */
export function useAppletOzeti() {
  const abone = useCallback((f: () => void) => {
    genelDinleyici.add(f);
    return () => genelDinleyici.delete(f);
  }, []);
  useSyncExternalStore(
    abone,
    () => surum,
    () => 0,
  );
  const degisen = anahtarlar.filter(farkli).length;
  return { degisen, kayit, sifirla: ornekDegerlereDon };
}
