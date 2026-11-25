import type { Marka } from './types';

/**
 * İş ortaklığı tanıtım dosyalarının tek listesi.
 * Dosyalar `public/indir/<proje>/` altında durur. Kaynakları `brosur/<proje>/` klasöründedir.
 * `tests/politika-indirme.spec.ts` bağlantıları ve dosyaların varlığını denetler.
 */
export type IndirilecekDosya = { dosya: string; ad: string; tur: string };

/** Bağlantıda görünen adlar. Dosya yolu bu adlardan bağımsızdır. */
type Adlar = { sunum: string; kitapcik: string };
const VARSAYILAN_AD: Adlar = { sunum: 'Görsel sunum', kitapcik: 'El kitapçığı' };

const tanitimDosyalari = (proje: Marka, ad: Adlar = VARSAYILAN_AD): IndirilecekDosya[] => [
  { dosya: `indir/${proje}/${proje}-is-ortakligi-sunum.pptx`, ad: ad.sunum, tur: 'PowerPoint' },
  { dosya: `indir/${proje}/${proje}-is-ortakligi-el-kitapcigi.pdf`, ad: ad.kitapcik, tur: 'PDF, A4 dikey' },
  { dosya: `indir/${proje}/${proje}-is-ortakligi-gorsel-sunum.pdf`, ad: ad.sunum, tur: 'PDF, A4 yatay' },
];

export const INDIRILECEKLER: Record<Marka, IndirilecekDosya[]> = {
  // iStoc dosyalarının asıl markası Thoptan'dır (kullanıcı kararı, 25 Kasım 2026). Dosya yolları aynı kalır.
  istoc: tanitimDosyalari('istoc', { sunum: 'Thoptan iş ortaklığı tanıtım sunumu', kitapcik: 'Thoptan iş ortaklığı kılavuzu' }),
  segika: tanitimDosyalari('segika'),
};

/** Bağlantı metni dosyanın ne olduğunu ve türünü söyler. Örnek: "El kitapçığı (PDF, A4 dikey)". */
export const baglantiMetni = (d: IndirilecekDosya) => `${d.ad} (${d.tur})`;
