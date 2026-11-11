import type { AkisAdimi, AkisSecenegi, AkisYaniti, IsAkisi } from './types';

export interface AkisGorunumu { gecmis: { adim: AkisAdimi; yanit: AkisSecenegi }[]; etkin: AkisAdimi; sonuc?: Exclude<AkisSecenegi, { tur: 'devam' }>; yanitlar: AkisYaniti[] }
/** Eski veya bozuk kayıtta ilk uyuşmazlıktan sonrası kullanılmaz. */
export function akisGorunumu(akis: IsAkisi, yanitlar: AkisYaniti[]): AkisGorunumu {
  const adimlar = new Map(akis.adimlar.map((a) => [a.id, a]));
  let etkin = adimlar.get(akis.ilk);
  if (!etkin) throw new Error('Akışın başlangıcı eksik.');
  const gecmis: AkisGorunumu['gecmis'] = [];
  const kabul: AkisYaniti[] = [];
  const visited = new Set<string>();
  for (const cevap of yanitlar.slice(0, akis.adimlar.length)) {
    if (cevap.adim !== etkin.id || visited.has(etkin.id)) break;
    const secenek = etkin.secenekler.find((s) => s.id === cevap.secenek);
    if (!secenek) break;
    if (secenek.tur !== 'devam') return { gecmis, etkin, sonuc: secenek, yanitlar: [...kabul, cevap] };
    const sonraki = adimlar.get(secenek.sonraki);
    if (!sonraki) break;
    visited.add(etkin.id);
    kabul.push(cevap);
    gecmis.push({ adim: etkin, yanit: secenek });
    etkin = sonraki;
  }
  return { gecmis, etkin, yanitlar: kabul };
}
