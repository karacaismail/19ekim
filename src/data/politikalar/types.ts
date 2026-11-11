import type { Marka, RolId } from '../satisOrtakligi';

export type { Marka, RolId };
export interface Adim { baslik: string; metin: string[] }
export interface HedefKitle {
  urun: 'iStoc' | 'Segika';
  ad: string;
  ihtiyac: string;
  ulasim: string;
  mesaj: string;
  uygunluk: string;
  sonrasi: string;
}
export interface Sorun { kosul: string; islem: string; sonuc: string }
export interface AcikKonu {
  baslik: string;
  mevcut: string;
  eksik: string;
  islem: string;
  kanit: string;
  firsat: string;
  durdur: string;
}
export interface Kesif { baslik: string; sinyal: string; kontrol: string; tepki: string; kayit: string }
export interface Politika {
  id: RolId;
  ad: string;
  amac: string;
  iliski: string;
  gorev: string[];
  sinir: string[];
  adimlar: Adim[];
  kitleler: HedefKitle[];
  ortakBulma?: string[];
  sorunlar: Sorun[];
  anlasma: Adim[];
  acikKonular: AcikKonu[];
  kesifler: Kesif[];
  haftalik: string[];
  programlar: Record<string, string[]>;
}

export const PERSONALAR = [
  { id: 'oncu', ad: 'Öncü satış ortağı' },
  { id: 'kadrolu', ad: 'Kadrolu satış uzmanı' },
  { id: 'cozum', ad: 'Danışman ve hizmet firması' },
  { id: 'tavsiye', ad: 'Mevcut müşteri' },
  { id: 'elci', ad: 'Marka elçisi' },
] as const;

/** Aynı rolün iki projede farklı çalışma belgesi bulunur. */
export interface ProjePolitika extends Politika { proje: Marka }
