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
  if (r.sozlesme === 'musteri') return { deger: tl(musteriKazanc(a).yillikKredi), birim: 'ücretsiz kullanım / yıl' };
  return { deger: tl(bagimsizKazanc(a).aylik), birim: '/ ay' };
}

/** Bir üst basamak için eksikler (tam cümle). */
export type Tur = 'bagimsiz' | 'kadrolu';
export const basamakDurumu = (sg: SegmentSonucu, i: number) => (i < sg.seviye ? 'gecildi' : i === sg.seviye ? 'simdi' : i === sg.seviye + 1 ? 'sonraki' : 'kilitli');

export function segmentDurumu(sg: SegmentSonucu, tur: Tur) {
  const sonraki = sg.basamaklar[sg.seviye + 1];
  if (!sonraki) return tur === 'bagimsiz' ? 'Ortak en üst segmenttedir. Rozet her yıl yeniden değerlendirilir.' : 'Çalışan en üst basamaktadır.';
  const e = sg.eksikler;
  if (e.length <= 1) return e.length ? `${sonraki.ad} olmak için ${e[0]} gerekir.` : `${sonraki.ad} için koşullar sağlanıyor.`;
  // Birden çok koşul tek uzun cümleye dizilmez. Her koşul ayrı cümledir (yalın Türkçe, 11 Kasım 2026).
  const sira = ['Birincisi', 'İkincisi', 'Üçüncüsü', 'Dördüncüsü', 'Beşincisi'];
  const ad = (x: string) => x.replace(/(mak|mek)$/u, (m) => `${m}${m === 'mak' ? 'tır' : 'tir'}`);
  return `${sonraki.ad} olmak için ${e.length} koşul gerekir. ${e.map((x, i) => `${sira[i] ?? `${i + 1}. koşul`} ${ad(x)}.`).join(' ')}`;
}
