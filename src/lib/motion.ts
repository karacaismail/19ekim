import { useEffect, useState } from 'react';

/**
 * Hareket süresi tokenı (ms); hareket azaltma tercihinde token 0 ms olur. Sunucu çiziminde 0. Mantine bileşenlerine
 * (Menu, Accordion, Drawer) süre bu kancadan verilir; sabit sayı yazılmaz (UI kapısı).
 */
export function useMotionMs(name: string) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const read = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const value = raw.endsWith('ms') ? parseFloat(raw) : raw.endsWith('s') ? parseFloat(raw) * 1000 : parseFloat(raw);
      setMs(Number.isFinite(value) ? value : 0);
    };
    read();
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, [name]);
  return ms;
}
