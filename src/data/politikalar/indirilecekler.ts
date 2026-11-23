import type { Marka } from './types';

/**
 * İş ortaklığı tanıtım dosyalarının tek listesi.
 * Dosyalar `public/indir/<proje>/` altında durur. Kaynakları `brosur/<proje>/` klasöründedir.
 * `tests/politika-indirme.spec.ts` bağlantıları ve dosyaların varlığını denetler.
 */
export type IndirilecekDosya = { dosya: string; ad: string; tur: string };

const tanitimDosyalari = (proje: Marka): IndirilecekDosya[] => [
  { dosya: `indir/${proje}/${proje}-is-ortakligi-sunum.pptx`, ad: 'Görsel sunum', tur: 'PowerPoint' },
  { dosya: `indir/${proje}/${proje}-is-ortakligi-el-kitapcigi.pdf`, ad: 'El kitapçığı', tur: 'PDF, A4 dikey' },
  { dosya: `indir/${proje}/${proje}-is-ortakligi-gorsel-sunum.pdf`, ad: 'Görsel sunum', tur: 'PDF, A4 yatay' },
];

export const INDIRILECEKLER: Record<Marka, IndirilecekDosya[]> = {
  istoc: tanitimDosyalari('istoc'),
  segika: tanitimDosyalari('segika'),
};

/** Bağlantı metni dosyanın ne olduğunu ve türünü söyler. Örnek: "El kitapçığı (PDF, A4 dikey)". */
export const baglantiMetni = (d: IndirilecekDosya) => `${d.ad} (${d.tur})`;
