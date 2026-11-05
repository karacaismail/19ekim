import { useEffect, useState } from 'react';

/**
 * Sayfa sürümü seçimi (Satış ortaklığı 2026-11-03, İstihdam takvimi 2026-11-05): v1 korunur, v2 ayrı gelişir. Seçili
 * sürüm adreste (`?surum=v2`) ve tarayıcıda sayfaya özgü anahtarda saklanır. Adres kayıttan önce gelir. İlk çizim v1'dir.
 * Depolama kapalıysa seçim yalnız bu oturumda kalır.
 */
export type Surum = 'v1' | 'v2';
const gecerli = (v: string | null): v is Surum => v === 'v1' || v === 'v2';

export function useSurum(anahtar: string) {
  const [surum, setSurum] = useState<Surum>('v1');
  useEffect(() => {
    try {
      const adres = new URLSearchParams(window.location.search).get('surum');
      const kayit = localStorage.getItem(anahtar);
      if (gecerli(adres)) setSurum(adres);
      else if (gecerli(kayit)) setSurum(kayit);
    } catch {
      /* okunamazsa v1 */
    }
  }, [anahtar]);
  const sec = (v: Surum) => {
    setSurum(v);
    try {
      localStorage.setItem(anahtar, v);
      const url = new URL(window.location.href);
      url.searchParams.set('surum', v);
      window.history.replaceState(null, '', url);
    } catch {
      /* depolama kapalı: seçim bu oturumda kalır */
    }
  };
  return [surum, sec] as const;
}

export const SURUM_SECENEKLERI: { id: Surum; name: string }[] = [
  { id: 'v1', name: 'v1' },
  { id: 'v2', name: 'v2' },
];
