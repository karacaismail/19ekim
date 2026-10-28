/**
 * Affilate kurgu katmanı (docs/affilate.md §6, §11; kullanıcı kararı 2026-10-28): sayfanın düzenlediği girdiler
 * (müşteri grubu, tahsilat düzeni, iade, destek kayıtları) ile hesap motorunun olay listesi (`Senaryo`) arasındaki saf
 * çeviri; adlandırılmış hazır senaryolar; JSON içe aktarmada şema ve değer doğrulaması; başlangıca göre değişiklik
 * özeti. DOM ve depolamadan bağımsızdır; sayfa ve CSV aynı motoru kullanır (ikinci hesap sistemi yok).
 */
import {
  ayEkle,
  baslangicFiyat,
  baslangicOrtaklar,
  bolYuvarla,
  bpToYuzde,
  dogrula,
  faturaUret,
  gecerliTarih,
  kurusFormat,
  zamanCizelgesi,
  type Bp,
  type DestekDurumu,
  type Fatura,
  type Fiyat,
  type Iade,
  type Kurus,
  type MusteriGrubu,
  type OrtakId,
  type OrtakKurali,
  type ParaBirimi,
  type Politika,
  type Senaryo,
  type Tahsilat,
} from './affilate';

export const KURGU_SURUM = 1;

/** Her faturanın tahsilat planı: faturanın yüzdesi (baz puan) ve fatura tarihinden gecikme (ay). Boş = ödeme yok. */
export interface TahsilatPlani {
  oranBp: Bp;
  gecikmeAy: number;
}

/** İade: kaçıncı fatura (1 tabanlı), fatura tarihinden gecikme (ay), faturanın yüzdesi (baz puan). */
export interface KurguIade {
  fatura: number;
  gecikmeAy: number;
  oranBp: Bp;
}

export interface KurguMusteri {
  id: string;
  ad: string;
  adet: number;
  baslangic: string;
  odeme: 'aylik' | 'paket';
  ortak: OrtakId;
  /** null = fiyatın para birimi. */
  paraBirimi: ParaBirimi | null;
  iptalHizmetAyi: number | null;
  destekVarsayilan: DestekDurumu;
  destek: { hizmetAyi: number; durum: DestekDurumu }[];
  tahsilat: TahsilatPlani[];
  iadeler: KurguIade[];
  /** Komisyon dışı fatura kalemleri (faturanın yüzdesi, baz puan). */
  haricBp: Bp;
}

export interface Kurgu {
  ufukAy: number;
  fiyat: Fiyat;
  ortaklar: Record<OrtakId, OrtakKurali>;
  musteriler: KurguMusteri[];
  /** Ana sonuç ve karşılaştırmanın müşteri grubu. */
  secili: string;
}

export const TAM_TAHSILAT: TahsilatPlani[] = [{ oranBp: 10_000, gecikmeAy: 0 }];

export function baslangicMusteri(over: Partial<KurguMusteri> = {}): KurguMusteri {
  return {
    id: 'a',
    ad: 'Müşteri A',
    adet: 1,
    baslangic: '2027-01-01',
    odeme: 'paket',
    ortak: 'satis',
    paraBirimi: null,
    iptalHizmetAyi: null,
    destekVarsayilan: 'aktif',
    destek: [],
    tahsilat: TAM_TAHSILAT.map((t) => ({ ...t })),
    iadeler: [],
    haricBp: 0,
    ...over,
  };
}

/** Başlangıç kurgusu (§4.1 örneği): aylık 100 ₺, yıllık paket 10 aylık ücret, 12 ay hizmet, satış ortağı, 36 ay ufuk. */
export function baslangicKurgu(): Kurgu {
  return { ufukAy: 36, fiyat: baslangicFiyat(), ortaklar: baslangicOrtaklar(), musteriler: [baslangicMusteri()], secili: 'a' };
}

const oranliTutar = (tutar: Kurus, bp: Bp) => Number(bolYuvarla(BigInt(tutar) * BigInt(bp), 10_000n));
const tamTahsilatMi = (plan: TahsilatPlani[]) => plan.length === 1 && plan[0].oranBp === 10_000 && plan[0].gecikmeAy === 0;

/** Kurguyu hesap motorunun senaryosuna çevirir; olaylar (fatura, tahsilat, iade) kurgudan türetilir. */
export function senaryoKur(k: Kurgu): Senaryo {
  const musteriler: MusteriGrubu[] = k.musteriler.map((m) => ({
    id: m.id,
    ad: m.ad,
    adet: m.adet,
    baslangic: m.baslangic,
    odeme: m.odeme,
    ortak: m.ortak,
    iptalHizmetAyi: m.iptalHizmetAyi,
    destekVarsayilan: m.destekVarsayilan,
    ...(m.paraBirimi ? { paraBirimi: m.paraBirimi } : {}),
  }));
  const destek = k.musteriler.flatMap((m) => m.destek.map((d) => ({ musteri: m.id, hizmetAyi: d.hizmetAyi, durum: d.durum })));
  const acik = k.musteriler.some((m) => !tamTahsilatMi(m.tahsilat) || m.iadeler.length > 0 || m.haricBp > 0);
  if (!acik) return { ufukAy: k.ufukAy, fiyat: k.fiyat, ortaklar: k.ortaklar, musteriler, iadeler: [], destek };
  // Açık olay listesi: bütün gruplar için faturalar, tahsilatlar (kümülatif yuvarlama: toplam ≤ fatura) ve iadeler.
  const { son } = zamanCizelgesi(k.ufukAy, k.musteriler.map((m) => m.baslangic));
  const faturalar: Fatura[] = [];
  const tahsilatlar: Tahsilat[] = [];
  const iadeler: Iade[] = [];
  for (const [i, m] of k.musteriler.entries()) {
    const grup = musteriler[i];
    const fl = faturaUret(grup, k.fiyat, son).map((f) => ({ ...f, haric: oranliTutar(f.tutar, m.haricBp) }));
    faturalar.push(...fl);
    for (const f of fl) {
      let kum = 0;
      let kumOran = 0;
      m.tahsilat.forEach((t, j) => {
        kumOran += t.oranBp;
        const yeniKum = oranliTutar(f.tutar, Math.min(kumOran, 10_000));
        const tutar = yeniKum - kum;
        kum = yeniKum;
        if (tutar > 0) tahsilatlar.push({ id: `${f.id}-t${j + 1}`, faturaId: f.id, tarih: ayEkle(f.tarih, t.gecikmeAy), tutar });
      });
    }
    m.iadeler.forEach((iade, j) => {
      const f = fl[iade.fatura - 1];
      if (!f) return;
      const tutar = oranliTutar(f.tutar, iade.oranBp);
      if (tutar > 0) iadeler.push({ id: `${f.id}-i${j + 1}`, faturaId: f.id, tarih: ayEkle(f.tarih, iade.gecikmeAy), tutar });
    });
  }
  return { ufukAy: k.ufukAy, fiyat: k.fiyat, ortaklar: k.ortaklar, musteriler, faturalar, tahsilatlar, iadeler, destek };
}

/* ---------- Hazır senaryolar (§11) ---------- */

export interface HazirSenaryo {
  id: string;
  ad: string;
  aciklama: string;
  kurgu: () => Kurgu;
}

const satisAylik = (over: Partial<KurguMusteri> = {}) => baslangicMusteri({ odeme: 'aylik', ortak: 'satis', ...over });

export const HAZIR_SENARYOLAR: HazirSenaryo[] = [
  {
    id: 'ilk-satis',
    ad: 'İlk satış',
    aciklama: 'Ayşe: aylık 100 ₺ ödeyen bir müşterinin ilk faturası tahsil edilir; komisyon yalnız ilk faturaya uygulanır.',
    kurgu: () => ({ ...baslangicKurgu(), ufukAy: 12, musteriler: [baslangicMusteri({ odeme: 'aylik', ortak: 'ayse' })] }),
  },
  {
    id: 'aylik-musteri',
    ad: 'Aylık müşteri',
    aciklama: 'Satış ortağı: müşteri 36 ay boyunca her ay 100 ₺ öder; oran dönemlere göre %15 → %10 → %0.',
    kurgu: () => ({ ...baslangicKurgu(), musteriler: [satisAylik()] }),
  },
  {
    id: 'yillik-pesin',
    ad: 'Yıllık peşin',
    aciklama: 'Satış ortağı: müşteri yıllık paketi (1.000 ₺) peşin öder; komisyon hizmet aylarına dağılır.',
    kurgu: () => baslangicKurgu(),
  },
  {
    id: 'on-aylik-fiyat',
    ad: '10 aylık fiyat / 12 aylık hizmet',
    aciklama: 'Çözüm ortağı, tek yıllık paket (yenileme yok): paket 10 aylık ücrete (1.000 ₺) eşit, hizmet 12 ay; aylık eşdeğer 83,33 ₺ komisyon değildir.',
    kurgu: () => ({ ...baslangicKurgu(), ufukAy: 13, musteriler: [baslangicMusteri({ ortak: 'cozum', iptalHizmetAyi: 12 })] }),
  },
  {
    id: 'ikinci-donem',
    ad: 'İkinci döneme geçiş',
    aciklama: 'Satış ortağı, aylık müşteri: 13. hizmet ayından itibaren ikinci dönem oranı uygulanır; eski aylar yeniden hesaplanmaz.',
    kurgu: () => ({ ...baslangicKurgu(), ufukAy: 24, musteriler: [satisAylik()] }),
  },
  {
    id: 'kismi-odeme',
    ad: 'Kısmi ödeme',
    aciklama: 'Satış ortağı, tek yıllık paket (yenileme yok): %40 fatura tarihinde, %60 üç ay sonra tahsil edilir; hakediş tahsil edilen bazla sınırlıdır.',
    kurgu: () => ({ ...baslangicKurgu(), ufukAy: 13, musteriler: [baslangicMusteri({ iptalHizmetAyi: 12, tahsilat: [{ oranBp: 4000, gecikmeAy: 0 }, { oranBp: 6000, gecikmeAy: 3 }] })] }),
  },
  {
    id: 'destek-kesintisi',
    ad: 'Destek kesintisi',
    aciklama: 'Çözüm ortağı, tek yıllık paket (yenileme yok): ilk hizmet ayında destek sağlanmadı; o ayın payı kazanılmaz ve kalan aylara dağıtılmaz.',
    kurgu: () => ({ ...baslangicKurgu(), ufukAy: 13, musteriler: [baslangicMusteri({ ortak: 'cozum', iptalHizmetAyi: 12, destek: [{ hizmetAyi: 0, durum: 'saglanmadi' }] })] }),
  },
  {
    id: 'iade',
    ad: 'İade',
    aciklama: 'Satış ortağı, tek yıllık paket (yenileme yok): dördüncü ayda %20 iade; net baz düşer, geçmiş ayların farkı düzeltme ve geri alınacak bakiye olur.',
    kurgu: () => ({ ...baslangicKurgu(), ufukAy: 13, musteriler: [baslangicMusteri({ iptalHizmetAyi: 12, iadeler: [{ fatura: 1, gecikmeAy: 3, oranBp: 2000 }] })] }),
  },
  {
    id: 'portfoy',
    ad: 'Üç ortaklı portföy',
    aciklama: 'Üç ayrı yıllık müşteri, üç farklı ortağa atanmış; portföy toplamı alt kayıtların toplamıdır (alternatifler toplanmaz).',
    kurgu: () => ({
      ...baslangicKurgu(),
      musteriler: [baslangicMusteri({ id: 'a', ad: 'Müşteri A', ortak: 'ayse' }), baslangicMusteri({ id: 'b', ad: 'Müşteri B', ortak: 'satis' }), baslangicMusteri({ id: 'c', ad: 'Müşteri C', ortak: 'cozum' })],
      secili: 'b',
    }),
  },
];

const anahtar = (k: Kurgu) => JSON.stringify(k);
/** Kurgu bir hazır senaryoyla birebir aynıysa onun kimliği; değilse null (“Özel”). */
export function hazirEslesen(k: Kurgu): string | null {
  const a = anahtar(k);
  return HAZIR_SENARYOLAR.find((h) => anahtar(h.kurgu()) === a)?.id ?? null;
}

/* ---------- JSON içe aktarma (§11): şema, oran, tarih, tutar ve kimlik doğrulaması ---------- */

const ORTAKLAR: OrtakId[] = ['ayse', 'satis', 'cozum'];
const POLITIKALAR: Politika[] = ['tahsilatta', 'hizmet-ayi', 'tahsilatta-taksit'];
const DESTEK: DestekDurumu[] = ['aktif', 'saglanmadi', 'belirsiz'];
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const say = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const tam = (v: unknown): v is number => say(v) && Number.isInteger(v);
const metin = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 80;
const biri = <T extends string>(v: unknown, liste: readonly T[]): v is T => typeof v === 'string' && (liste as readonly string[]).includes(v);

function fiyatOku(v: unknown): Fiyat | null {
  if (!obj(v)) return null;
  if (!biri(v.kaynak, ['paket', 'kat', 'indirim', 'indirimsiz'] as const) || !biri(v.paraBirimi, ['TRY', 'EUR'] as const)) return null;
  if (!tam(v.aylik) || !say(v.kat) || !tam(v.hizmetAy) || !tam(v.indirimBp) || !tam(v.paket)) return null;
  return { kaynak: v.kaynak, aylik: v.aylik, kat: v.kat, hizmetAy: v.hizmetAy, indirimBp: v.indirimBp, paket: v.paket, paraBirimi: v.paraBirimi };
}

function ortakOku(v: unknown, id: OrtakId): OrtakKurali | null {
  if (!obj(v) || v.id !== id || !metin(v.ad)) return null;
  if (!biri(v.kapsam, ['ilk-fatura', 'sureli'] as const) || !biri(v.politika, POLITIKALAR) || !biri(v.destekSorumlusu, ['segika', 'ortak'] as const) || !biri(v.destekIhlali, ['kazandirmaz', 'beklet'] as const)) return null;
  if (!Array.isArray(v.donemler) || v.donemler.length < 1 || v.donemler.length > 12) return null;
  const donemler = v.donemler.map((d) => (obj(d) && tam(d.ay) && tam(d.oranBp) ? { ay: d.ay, oranBp: d.oranBp } : null));
  if (donemler.some((d) => d === null)) return null;
  if (!tam(v.sonrakiOranBp) || !tam(v.taksit) || !tam(v.gecikmeAy) || !(v.destekMaliyeti === null || tam(v.destekMaliyeti))) return null;
  return {
    id,
    ad: v.ad,
    kapsam: v.kapsam,
    donemler: donemler as { ay: number; oranBp: number }[],
    sonrakiOranBp: v.sonrakiOranBp,
    politika: v.politika,
    taksit: v.taksit,
    gecikmeAy: v.gecikmeAy,
    destekSorumlusu: v.destekSorumlusu,
    destekIhlali: v.destekIhlali,
    destekMaliyeti: v.destekMaliyeti as number | null,
  };
}

function musteriOku(v: unknown): KurguMusteri | null {
  if (!obj(v) || !metin(v.id) || !/^[a-z0-9_-]+$/i.test(v.id) || !metin(v.ad) || !tam(v.adet) || !gecerliTarih(v.baslangic)) return null;
  if (!biri(v.odeme, ['aylik', 'paket'] as const) || !biri(v.ortak, ORTAKLAR) || !(v.paraBirimi === null || biri(v.paraBirimi, ['TRY', 'EUR'] as const))) return null;
  if (!(v.iptalHizmetAyi === null || tam(v.iptalHizmetAyi)) || !biri(v.destekVarsayilan, DESTEK) || !tam(v.haricBp) || v.haricBp < 0 || v.haricBp > 10_000) return null;
  if (!Array.isArray(v.destek) || !Array.isArray(v.tahsilat) || !Array.isArray(v.iadeler)) return null;
  const destek = v.destek.map((d) => (obj(d) && tam(d.hizmetAyi) && d.hizmetAyi >= 0 && biri(d.durum, DESTEK) ? { hizmetAyi: d.hizmetAyi, durum: d.durum } : null));
  const tahsilat = v.tahsilat.map((t) => (obj(t) && tam(t.oranBp) && t.oranBp >= 0 && t.oranBp <= 10_000 && tam(t.gecikmeAy) && t.gecikmeAy >= 0 ? { oranBp: t.oranBp, gecikmeAy: t.gecikmeAy } : null));
  const iadeler = v.iadeler.map((i) => (obj(i) && tam(i.fatura) && i.fatura >= 1 && tam(i.gecikmeAy) && i.gecikmeAy >= 0 && tam(i.oranBp) && i.oranBp >= 0 && i.oranBp <= 10_000 ? { fatura: i.fatura, gecikmeAy: i.gecikmeAy, oranBp: i.oranBp } : null));
  if (destek.some((d) => !d) || tahsilat.some((t) => !t) || iadeler.some((i) => !i)) return null;
  if ((tahsilat as TahsilatPlani[]).reduce((t, x) => t + x.oranBp, 0) > 10_000) return null;
  return {
    id: v.id,
    ad: v.ad,
    adet: v.adet,
    baslangic: v.baslangic,
    odeme: v.odeme,
    ortak: v.ortak,
    paraBirimi: v.paraBirimi as ParaBirimi | null,
    iptalHizmetAyi: v.iptalHizmetAyi as number | null,
    destekVarsayilan: v.destekVarsayilan,
    destek: destek as KurguMusteri['destek'],
    tahsilat: tahsilat as TahsilatPlani[],
    iadeler: iadeler as KurguIade[],
    haricBp: v.haricBp,
  };
}

/** Dışa aktarılan JSON’u (ya da depodaki kaydı) okur; şema, oran, tarih, tutar ve kimlik doğrulamasından geçmeyen girdi null döner. */
export function kurguOku(veri: unknown): Kurgu | null {
  if (!obj(veri)) return null;
  const k = veri.v === KURGU_SURUM && obj(veri.kurgu) ? veri.kurgu : veri;
  if (!obj(k) || !tam(k.ufukAy) || !metin(k.secili)) return null;
  const fiyat = fiyatOku(k.fiyat);
  if (!fiyat || !obj(k.ortaklar)) return null;
  const ortaklar = {} as Record<OrtakId, OrtakKurali>;
  for (const id of ORTAKLAR) {
    const o = ortakOku(k.ortaklar[id], id);
    if (!o) return null;
    ortaklar[id] = o;
  }
  if (!Array.isArray(k.musteriler) || k.musteriler.length === 0 || k.musteriler.length > 100) return null;
  const musteriler = k.musteriler.map(musteriOku);
  if (musteriler.some((m) => !m)) return null;
  const kurgu: Kurgu = { ufukAy: k.ufukAy, fiyat, ortaklar, musteriler: musteriler as KurguMusteri[], secili: k.secili };
  if (!kurgu.musteriler.some((m) => m.id === kurgu.secili)) kurgu.secili = kurgu.musteriler[0].id;
  if (dogrula(senaryoKur(kurgu)).length) return null;
  return kurgu;
}

/** Dışa aktarım biçimi (sürümlü). */
export const kurguJson = (k: Kurgu) => JSON.stringify({ v: KURGU_SURUM, kurgu: k }, null, 2);

/* ---------- Değişiklik özeti (§10.2 “Varsayım ve değişiklik özeti”) ---------- */

export interface Degisiklik {
  alan: string;
  once: string;
  simdi: string;
}

export const yuzde = (bp: Bp) => `%${bpToYuzde(bp).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
const ay = (n: number) => `${n} ay`;
export const POLITIKA_ADI: Record<Politika, string> = { tahsilatta: 'Tahsilatta kazan, aynı ay öde', 'hizmet-ayi': 'Her hizmet ayı sonunda kazan ve öde', 'tahsilatta-taksit': 'Tahsilatta kazan, taksitlerle öde' };
export const KAYNAK_ADI: Record<Fiyat['kaynak'], string> = { paket: 'Paket fiyatını gir', kat: 'Aylık fiyatın katı', indirim: 'İndirim oranıyla hesapla', indirimsiz: 'İndirimsiz hesapla' };
export const DESTEK_ADI: Record<DestekDurumu, string> = { aktif: 'Aktif', saglanmadi: 'Sağlanmadı', belirsiz: 'Belirsiz' };

/** Kurgunun tabandan (başlangıç ya da seçilen hazır senaryo) farkları, insan okunur. */
export function degisiklikler(k: Kurgu, taban: Kurgu): Degisiklik[] {
  const out: Degisiklik[] = [];
  const f = (alan: string, a: string, b: string) => {
    if (a !== b) out.push({ alan, once: a, simdi: b });
  };
  f('Simülasyon ufku', ay(taban.ufukAy), ay(k.ufukAy));
  const pb = k.fiyat.paraBirimi;
  f('Para birimi', taban.fiyat.paraBirimi, k.fiyat.paraBirimi);
  f('Fiyat kaynağı', KAYNAK_ADI[taban.fiyat.kaynak], KAYNAK_ADI[k.fiyat.kaynak]);
  f('Aylık fiyat', kurusFormat(taban.fiyat.aylik, taban.fiyat.paraBirimi), kurusFormat(k.fiyat.aylik, pb));
  f('Paket fiyatının aylık ücret sayısı', `${taban.fiyat.kat}`, `${k.fiyat.kat}`);
  f('Paket hizmet süresi', ay(taban.fiyat.hizmetAy), ay(k.fiyat.hizmetAy));
  f('İndirim oranı', yuzde(taban.fiyat.indirimBp), yuzde(k.fiyat.indirimBp));
  f('Paket tutarı', kurusFormat(taban.fiyat.paket, taban.fiyat.paraBirimi), kurusFormat(k.fiyat.paket, pb));
  for (const id of ORTAKLAR) {
    const a = taban.ortaklar[id];
    const b = k.ortaklar[id];
    const ad = b.ad;
    f(`${ad} · kapsam`, a.kapsam === 'ilk-fatura' ? 'İlk fatura' : 'Süreli', b.kapsam === 'ilk-fatura' ? 'İlk fatura' : 'Süreli');
    const n = Math.max(a.donemler.length, b.donemler.length);
    for (let i = 0; i < n; i++) {
      const da = a.donemler[i];
      const db = b.donemler[i];
      f(`${ad} · ${i + 1}. dönem oranı`, da ? yuzde(da.oranBp) : 'Yok', db ? yuzde(db.oranBp) : 'Yok');
      f(`${ad} · ${i + 1}. dönem süresi`, da ? ay(da.ay) : 'Yok', db ? ay(db.ay) : 'Yok');
    }
    f(`${ad} · sonraki dönemlerin oranı`, yuzde(a.sonrakiOranBp), yuzde(b.sonrakiOranBp));
    f(`${ad} · kazanma ve ödeme`, POLITIKA_ADI[a.politika], POLITIKA_ADI[b.politika]);
    f(`${ad} · taksit sayısı`, `${a.taksit}`, `${b.taksit}`);
    f(`${ad} · ödeme gecikmesi`, ay(a.gecikmeAy), ay(b.gecikmeAy));
    f(`${ad} · destek sorumlusu`, a.destekSorumlusu === 'ortak' ? 'Ortak' : 'Segika', b.destekSorumlusu === 'ortak' ? 'Ortak' : 'Segika');
    f(`${ad} · destek ihlali`, a.destekIhlali === 'beklet' ? 'Beklet' : 'Kazandırmaz', b.destekIhlali === 'beklet' ? 'Beklet' : 'Kazandırmaz');
    f(`${ad} · destek maliyeti`, a.destekMaliyeti === null ? 'Girilmedi' : kurusFormat(a.destekMaliyeti, pb), b.destekMaliyeti === null ? 'Girilmedi' : kurusFormat(b.destekMaliyeti, pb));
  }
  const mA = taban.musteriler;
  const mB = k.musteriler;
  f('Müşteri grubu sayısı', `${mA.length}`, `${mB.length}`);
  for (const m of mB) {
    const o = mA.find((x) => x.id === m.id);
    if (!o) {
      out.push({ alan: `${m.ad}`, once: 'Yok', simdi: `${m.adet} × ${m.odeme === 'aylik' ? 'aylık' : 'paket'} · ${k.ortaklar[m.ortak].ad}` });
      continue;
    }
    f(`${m.ad} · adet`, `${o.adet}`, `${m.adet}`);
    f(`${m.ad} · başlangıç`, o.baslangic, m.baslangic);
    f(`${m.ad} · ödeme düzeni`, o.odeme === 'aylik' ? 'Aylık' : 'Paket', m.odeme === 'aylik' ? 'Aylık' : 'Paket');
    f(`${m.ad} · ortak`, k.ortaklar[o.ortak].ad, k.ortaklar[m.ortak].ad);
    f(`${m.ad} · iptal`, o.iptalHizmetAyi === null ? 'Yok' : `${o.iptalHizmetAyi + 1}. hizmet ayından itibaren`, m.iptalHizmetAyi === null ? 'Yok' : `${m.iptalHizmetAyi + 1}. hizmet ayından itibaren`);
    f(`${m.ad} · tahsilat düzeni`, tahsilatMetni(o.tahsilat), tahsilatMetni(m.tahsilat));
    f(`${m.ad} · iadeler`, `${o.iadeler.length}`, `${m.iadeler.length}`);
    f(`${m.ad} · destek kayıtları`, `${o.destek.length}`, `${m.destek.length}`);
    f(`${m.ad} · hariç kalem`, yuzde(o.haricBp), yuzde(m.haricBp));
  }
  return out;
}

export function tahsilatMetni(plan: TahsilatPlani[]): string {
  if (!plan.length) return 'Ödeme yok';
  if (tamTahsilatMi(plan)) return 'Fatura tarihinde tam';
  return plan.map((t) => `${yuzde(t.oranBp)} ${t.gecikmeAy === 0 ? 'fatura tarihinde' : `${t.gecikmeAy} ay sonra`}`).join(' + ');
}
