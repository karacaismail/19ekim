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

/** Okur önündeki yolu görür. Her adımda ilk "devam" yanıtı izlenir. Başka bir yanıt bu sırayı değiştirebilir. */
export function olasiSonrakiler(akis: IsAkisi, etkin: AkisAdimi, gecilen: string[] = []): AkisAdimi[] {
  const adimlar = new Map(akis.adimlar.map((a) => [a.id, a]));
  const gorulen = new Set([...gecilen, etkin.id]);
  const sonuc: AkisAdimi[] = [];
  let simdiki: AkisAdimi | undefined = etkin;
  while (simdiki) {
    const devam: Extract<AkisSecenegi, { tur: 'devam' }> | undefined = simdiki.secenekler.find((s): s is Extract<AkisSecenegi, { tur: 'devam' }> => s.tur === 'devam');
    const sonraki: AkisAdimi | undefined = devam ? adimlar.get(devam.sonraki) : undefined;
    if (!sonraki || gorulen.has(sonraki.id)) break;
    gorulen.add(sonraki.id);
    sonuc.push(sonraki);
    simdiki = sonraki;
  }
  return sonuc;
}

/** Sorumlu bilgisini etiket dizisi yerine tam cümle yapar. Atanmamış görev ayrıca söylenir. */
export function sorumluCumlesi(sorumlu: string): string {
  const atanmamis = /\s*\(önerilen( görev)?\)\s*$/.test(sorumlu);
  const ad = sorumlu.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const kucuk = (metin: string) => metin.charAt(0).toLocaleLowerCase('tr-TR') + metin.slice(1);
  const ek = atanmamis ? ' Şirket bu görevi henüz kimseye atamadı.' : '';
  if (/^siz$/i.test(ad)) return `Bu adımı siz yürütürsünüz.${ek}`;
  const birlikte = /^siz ve (.+)$/i.exec(ad);
  if (birlikte) return `Bu adımı ${kucuk(birlikte[1])} ile birlikte siz yürütürsünüz.${ek}`;
  return `Bu adımı ${kucuk(ad)} yürütür.${ek}`;
}

/**
 * Belge adımlarını çıkarır (kullanıcı kararı 16 Kasım 2026 Pazartesi: “yalnız belge adımları”). Kullanıcı yalnız kazanç
 * planını, herkesin iş ortağı olmasını ve kadrolu uzmanın maaşını ve primini belirtti. Bu yüzden yazılı anlaşma, görev
 * tanımı ve prim eki ile yazılı ödül koşulu adımları rehberde sorulmaz. Akışın ilk adımı olan anlaşma ve görev adımı ile
 * tavsiyedeki yazılı koşul adımı çıkar. Bu adıma giden yanıt, adımın “devam” yanıtının gittiği adıma bağlanır.
 */
export function belgeAdimlariniCikar(akis: IsAkisi): IsAkisi {
  const cikan = new Map<string, string>();
  for (const adim of akis.adimlar) {
    const belge = adim.id === 'kosul' || (adim.id === akis.ilk && (adim.id === 'anlasma' || adim.id === 'gorev'));
    const devam = adim.secenekler.find((s) => s.tur === 'devam');
    if (belge && devam?.tur === 'devam') cikan.set(adim.id, devam.sonraki);
  }
  if (!cikan.size) return akis;
  const hedef = (id: string) => { const gorulen = new Set<string>(); while (cikan.has(id) && !gorulen.has(id)) { gorulen.add(id); id = cikan.get(id)!; } return id; };
  return {
    ...akis,
    ilk: hedef(akis.ilk),
    adimlar: akis.adimlar.filter((a) => !cikan.has(a.id)).map((a) => ({
      ...a,
      secenekler: a.secenekler.map((s) => (s.tur === 'devam' ? { ...s, sonraki: hedef(s.sonraki) } : s)),
    })),
  };
}
