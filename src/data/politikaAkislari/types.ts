import type { Ayar } from '../satisOrtakligi';

export interface AkisSonucu {
  baslik: string;
  metin: string[];
}
export type AkisSecenegi = { id: string; metin: string } & (
  | { tur: 'devam'; sonraki: string }
  | { tur: 'bekle' | 'bitir' | 'tamamla'; sonuc: AkisSonucu }
);
export interface AkisAdimi {
  id: string;
  ad: string;
  /** İşi yapan kişi. Atanmış kişi bilinmiyorsa önerilen görev adı kullanılır. */
  sorumlu: string;
  yap: string[];
  soru: string;
  dikkat?: string;
  /** Ayrıntı, yalnız bu adımda ve kullanıcı açınca gösterilir. */
  ek?: 'kitle' | 'kazanc' | 'anlasma' | 'sinir' | 'plan';
  secenekler: AkisSecenegi[];
}
export interface IsAkisi {
  baslik: string;
  ozet: string;
  hedef: string;
  ilk: string;
  adimlar: AkisAdimi[];
}
export type AkisOlustur = (ayar: Ayar) => IsAkisi;
export interface AkisYaniti { adim: string; secenek: string }
