/**
 * Satış ortaklığı v2 ortak özet yardımcıları (2026-11-03): sekmeler, persona paneli ve sağdaki özet aynı tutarı ve
 * aynı cümleyi buradan alır; iki yerde ayrı hesap yazılmaz. v1 bu dosyayı kullanmaz.
 */
import { kosulSonucu } from './kosullarV2';
import { bagimsizKazanc, kadroluKazanc, musteriKazanc, type Ayar, type RolMetni, type SegmentSonucu } from './satisOrtakligiV2';

const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;

/** Sekmelerdeki tutar: özel program varsa onun özeti, yoksa sözleşmeye göre standart sonuç. */
export function personaOzeti(a: Ayar, r: RolMetni) {
  const k = kosulSonucu(a, r.id);
  if (k) return { deger: k.ozet, birim: k.ozetBirim };
  if (r.sozlesme === 'kadrolu') return { deger: tl(kadroluKazanc(a).toplam), birim: '/ ay' };
  if (r.sozlesme === 'musteri') return { deger: tl(musteriKazanc(a).yillikKredi), birim: 'kredi / yıl' };
  return { deger: tl(bagimsizKazanc(a).aylik), birim: '/ ay' };
}

/** Bir üst basamak için eksikler (tam cümle). */
export type Tur = 'bagimsiz' | 'kadrolu';
export const basamakDurumu = (sg: SegmentSonucu, i: number) => (i < sg.seviye ? 'gecildi' : i === sg.seviye ? 'simdi' : i === sg.seviye + 1 ? 'sonraki' : 'kilitli');

export function segmentDurumu(sg: SegmentSonucu, tur: Tur) {
  const sonraki = sg.basamaklar[sg.seviye + 1];
  const birlestir = (l: string[]) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} ve ${l[l.length - 1]}`);
  return sonraki ? `${sonraki.ad} olmak için ${birlestir(sg.eksikler)} gerekir.` : tur === 'bagimsiz' ? 'Ortak en üst segmenttedir. Rozet her yıl yeniden değerlendirilir.' : 'Çalışan en üst basamaktadır.';
}
