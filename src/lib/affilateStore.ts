import { useCallback, useEffect, useRef, useState } from 'react';
import { baslangicKurgu, kurguOku, type Kurgu } from '../data/affilateKurgu';

/**
 * Affilate sayfa durumu (docs/affilate.md §11): sayfaya özel ad alanı `segika-affilate-v1`; genel parametreleri, gelir
 * planı senaryosunu, notları ve temayı değiştirmez. Sunucu ve ilk hidrasyon başlangıç kurgusuyla çizer; ardından bu
 * tarayıcıdaki kayıt okunur (şema doğrulamasından geçmeyen kayıt yok sayılır). Saklama başarısızsa “kaydedildi”
 * denmez (`kayit === false`). Geri alma yığını bellektedir (sıfırlama dahil her değişiklik geri alınabilir).
 */
export const AFFILATE_KEY = 'segika-affilate-v1';
const SURUM = 1;
const GECMIS_SINIRI = 40;

export interface KayitliSenaryo {
  ad: string;
  kurgu: Kurgu;
}

interface Kayit {
  v: number;
  kurgu: unknown;
  kayitli?: unknown;
}

function oku(): { kurgu: Kurgu | null; kayitli: KayitliSenaryo[] } {
  try {
    const raw = localStorage.getItem(AFFILATE_KEY);
    if (!raw) return { kurgu: null, kayitli: [] };
    const veri = JSON.parse(raw) as Kayit;
    if (veri.v !== SURUM) return { kurgu: null, kayitli: [] };
    const kurgu = kurguOku(veri.kurgu);
    const kayitli: KayitliSenaryo[] = Array.isArray(veri.kayitli)
      ? (veri.kayitli as unknown[])
          .map((k) => {
            if (!k || typeof k !== 'object') return null;
            const { ad, kurgu: kk } = k as { ad?: unknown; kurgu?: unknown };
            const okunan = kurguOku(kk);
            return typeof ad === 'string' && ad.trim() && okunan ? { ad: ad.slice(0, 60), kurgu: okunan } : null;
          })
          .filter((k): k is KayitliSenaryo => k !== null)
      : [];
    return { kurgu, kayitli };
  } catch {
    return { kurgu: null, kayitli: [] };
  }
}

export function useAffilate() {
  const [kurgu, setKurguDurum] = useState<Kurgu>(baslangicKurgu);
  const [kayitli, setKayitli] = useState<KayitliSenaryo[]>([]);
  /** null: henüz yazılmadı · Date: son başarılı yazım · false: depolama kapalı ya da yazım başarısız. */
  const [kayit, setKayit] = useState<Date | false | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  const gecmis = useRef<Kurgu[]>([]);
  const [geriSayisi, setGeriSayisi] = useState(0);
  const sonYazilan = useRef<string | null>(null);

  useEffect(() => {
    const k = oku();
    if (k.kurgu) setKurguDurum(k.kurgu);
    setKayitli(k.kayitli);
    setYuklendi(true);
    const dinle = (e: StorageEvent) => {
      if (e.key !== AFFILATE_KEY && e.key !== null) return;
      const yeni = oku();
      if (yeni.kurgu) setKurguDurum(yeni.kurgu);
      setKayitli(yeni.kayitli);
    };
    window.addEventListener('storage', dinle);
    return () => window.removeEventListener('storage', dinle);
  }, []);

  useEffect(() => {
    if (!yuklendi) return;
    const metin = JSON.stringify({ v: SURUM, kurgu, kayitli });
    if (metin === sonYazilan.current) return;
    try {
      localStorage.setItem(AFFILATE_KEY, metin);
      if (localStorage.getItem(AFFILATE_KEY) !== metin) throw new Error('yazılamadı');
      sonYazilan.current = metin;
      setKayit(new Date());
    } catch {
      setKayit(false);
    }
  }, [kurgu, kayitli, yuklendi]);

  const setKurgu = useCallback((guncelle: (k: Kurgu) => Kurgu) => {
    setKurguDurum((onceki) => {
      const sonraki = guncelle(onceki);
      if (sonraki === onceki) return onceki;
      gecmis.current = [...gecmis.current.slice(-(GECMIS_SINIRI - 1)), onceki];
      setGeriSayisi(gecmis.current.length);
      return sonraki;
    });
  }, []);

  const geriAl = useCallback(() => {
    const onceki = gecmis.current.pop();
    setGeriSayisi(gecmis.current.length);
    if (onceki) setKurguDurum(onceki);
  }, []);

  const sifirla = useCallback(() => setKurgu(() => baslangicKurgu()), [setKurgu]);

  const kaydet = useCallback(
    (ad: string) => {
      const temiz = ad.trim().slice(0, 60);
      if (!temiz) return false;
      setKayitli((liste) => [...liste.filter((k) => k.ad !== temiz), { ad: temiz, kurgu }]);
      return true;
    },
    [kurgu],
  );
  const sil = useCallback((ad: string) => setKayitli((liste) => liste.filter((k) => k.ad !== ad)), []);

  return { kurgu, setKurgu, geriAl, geriSayisi, sifirla, kayit, yuklendi, kayitli, kaydet, sil };
}
