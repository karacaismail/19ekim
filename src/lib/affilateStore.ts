import { useCallback, useEffect, useRef, useState } from 'react';
import { baslangicKurgu, kurguOku, type Kurgu } from '../data/affilateKurgu';

/**
 * Affilate sayfa durumu (docs/affilate.md §11): sayfaya özel ad alanı `segika-affilate-v1`; genel parametreleri, gelir
 * planı senaryosunu, notları ve temayı değiştirmez. Sunucu ve ilk hidrasyon başlangıç kurgusuyla çizer; ardından bu
 * tarayıcıdaki kayıt okunur. Saklama başarısızsa “kaydedildi” denmez (`kayit === false`). Geri alma yığını bellektedir
 * (sıfırlama dahil her değişiklik geri alınabilir).
 *
 * Kayıt koruması (docs/missings.md MS-04 / T06; B6-öncü, 2026-10-28): okunan kayıt beş durumdan biridir — `bos`, `gecerli`,
 * `kismi` (kurgu okunuyor, bazı kayıtlı senaryolar okunamıyor), `bozuk` (JSON ya da kurgu okunamıyor), `uyumsuz` (başka
 * sürüm). Yalnız `bos` ve `gecerli` durumda otomatik yazım açılır; `kismi` / `bozuk` / `uyumsuz` kayıt **ham hâliyle
 * korunur**: sayfa açılıp kapanınca byte düzeyinde aynı kalır, değişiklik yapılsa da üzerine yazılmaz. Kullanıcı ham kaydı
 * dışa aktarabilir ya da “Başlangıçla devam et” diyerek üzerine yazmayı açıkça seçer (`ustuneYaz`).
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

export type KayitDurumu = 'bos' | 'gecerli' | 'kismi' | 'bozuk' | 'uyumsuz';

/** Korunan kayıt sorunu: tür, (uyumsuzsa) sürüm, (kısmiyse) okunamayan senaryo sayısı ve ham metin. */
export interface KayitSorunu {
  tur: 'bozuk' | 'uyumsuz' | 'kismi';
  surum?: number;
  okunamayan?: number;
  ham: string;
}

interface Okunan {
  durum: KayitDurumu;
  kurgu: Kurgu | null;
  kayitli: KayitliSenaryo[];
  ham: string | null;
  surum?: number;
  okunamayan: number;
}

function oku(): Okunan {
  let ham: string | null = null;
  try {
    ham = localStorage.getItem(AFFILATE_KEY);
    if (!ham) return { durum: 'bos', kurgu: null, kayitli: [], ham: null, okunamayan: 0 };
    const veri = JSON.parse(ham) as Kayit | null;
    if (!veri || typeof veri !== 'object') return { durum: 'bozuk', kurgu: null, kayitli: [], ham, okunamayan: 0 };
    if (veri.v !== SURUM) return { durum: 'uyumsuz', kurgu: null, kayitli: [], ham, surum: typeof veri.v === 'number' ? veri.v : undefined, okunamayan: 0 };
    const kurgu = kurguOku(veri.kurgu);
    if (!kurgu) return { durum: 'bozuk', kurgu: null, kayitli: [], ham, okunamayan: 0 };
    const hamListe = Array.isArray(veri.kayitli) ? (veri.kayitli as unknown[]) : [];
    const kayitli: KayitliSenaryo[] = hamListe
      .map((k) => {
        if (!k || typeof k !== 'object') return null;
        const { ad, kurgu: kk } = k as { ad?: unknown; kurgu?: unknown };
        const okunan = kurguOku(kk);
        return typeof ad === 'string' && ad.trim() && okunan ? { ad: ad.slice(0, 60), kurgu: okunan } : null;
      })
      .filter((k): k is KayitliSenaryo => k !== null);
    const okunamayan = hamListe.length - kayitli.length;
    return { durum: okunamayan > 0 ? 'kismi' : 'gecerli', kurgu, kayitli, ham, okunamayan };
  } catch {
    // Depolama okunamıyor (erişim kapalı) ya da JSON bozuk: ham varsa korunur.
    return ham === null ? { durum: 'bos', kurgu: null, kayitli: [], ham: null, okunamayan: 0 } : { durum: 'bozuk', kurgu: null, kayitli: [], ham, okunamayan: 0 };
  }
}

const sorunOf = (k: Okunan): KayitSorunu | null =>
  k.durum === 'bozuk' || k.durum === 'uyumsuz' || k.durum === 'kismi' ? { tur: k.durum, surum: k.surum, okunamayan: k.okunamayan, ham: k.ham ?? '' } : null;

export function useAffilate() {
  const [kurgu, setKurguDurum] = useState<Kurgu>(baslangicKurgu);
  const [kayitli, setKayitli] = useState<KayitliSenaryo[]>([]);
  /** null: henüz yazılmadı · Date: son başarılı yazım · false: depolama kapalı ya da yazım başarısız. */
  const [kayit, setKayit] = useState<Date | false | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  /** Korunan kayıt sorunu; varken otomatik yazım kapalı (`yazmaIzni`). */
  const [kayitSorunu, setKayitSorunu] = useState<KayitSorunu | null>(null);
  const [yazmaIzni, setYazmaIzni] = useState(false);
  const gecmis = useRef<Kurgu[]>([]);
  const [geriSayisi, setGeriSayisi] = useState(0);
  const sonYazilan = useRef<string | null>(null);

  useEffect(() => {
    const k = oku();
    if (k.kurgu) setKurguDurum(k.kurgu);
    setKayitli(k.kayitli);
    const sorun = sorunOf(k);
    setKayitSorunu(sorun);
    setYazmaIzni(sorun === null);
    setYuklendi(true);
    const dinle = (e: StorageEvent) => {
      if (e.key !== AFFILATE_KEY && e.key !== null) return;
      const yeni = oku();
      // Başka sekmenin yazdığı geçerli kayıt yansır; sorunlu kayıt buradaki durumu ezmez.
      if (yeni.durum !== 'gecerli' && yeni.durum !== 'kismi') return;
      if (yeni.kurgu) setKurguDurum(yeni.kurgu);
      setKayitli(yeni.kayitli);
    };
    window.addEventListener('storage', dinle);
    return () => window.removeEventListener('storage', dinle);
  }, []);

  useEffect(() => {
    if (!yuklendi || !yazmaIzni) return;
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
  }, [kurgu, kayitli, yuklendi, yazmaIzni]);

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

  /** Korunan sorunlu kaydın üzerine bu sayfadaki durumu yazmayı açıkça seçer (MS-04): sorun kapanır, yazım açılır. */
  const ustuneYaz = useCallback(() => {
    setKayitSorunu(null);
    setYazmaIzni(true);
  }, []);

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

  return { kurgu, setKurgu, geriAl, geriSayisi, sifirla, kayit, yuklendi, kayitli, kaydet, sil, kayitSorunu, ustuneYaz };
}
