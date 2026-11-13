/**
 * Satış ortaklığı v2 (kullanıcı kararları 2026-11-03). v1 (satisOrtakligi.ts) korunur, v2 yalnız *V2 dosyalarında gelişir.
 *
 * v2’nin ana fikri: persona ayrı, segment ayrı, kampanya ayrı.
 * - Persona, ortağın kim olduğudur: öncü satış ortağı, kadrolu satış uzmanı, danışman ve hizmet firması, marka elçisi,
 *   mevcut müşteri. Persona sözleşme türünü belirler: bağımsız ortak, kadrolu çalışan ya da müşteri.
 * - Fiyatlandırma robotu herkes için aynıdır. Hangi paketten ayda kaç tane satıldığı ciroyu verir.
 * - Segment, satış sonucuna ve koşullara göre kazanılan kademedir: Başlangıç, Gümüş, Altın ve Profesyonel çözüm ortağı
 *   rozeti. Komisyon oranını persona değil segment ve satıştaki katkı belirler. Aynı satışı yapan bağımsız ortaklar aynı
 *   tutarı alır. Kadrolu çalışan aynı eşiklerle kariyer basamağı kazanır.
 * - Ağ en çok 2 kademe derinliktedir: ortak, getirdiği ortakların ve onların getirdiklerinin satışından pay alır.
 *   Pay yalnız gerçek satıştan doğar ve satış yapanın komisyonundan düşülmez.
 * - Kampanya, belirli personalara ve sürelere açık ek ödüldür. “Arkadaşını getir” bir kampanyadır.
 * Bütün sayılar değiştirilebilir başlangıç değeridir (`VARSAYILAN_AYAR`). Tutarlar ₺, oranlar 0–1 arasıdır.
 */

export type Marka = 'istoc' | 'segika';
export type Model = 'oran' | 'sabit';
export type Seviye = 'A' | 'B' | 'C';
export type SegikaPaket = 'ikisi' | 'tesvik' | 'otomasyon';
export type IstocPaket = 'standart' | 'pro' | 'kurumsal';
export type Faturalama = 'yillik' | 'aylik';
export type Egitim = 'temel' | 'sertifika';
export type Sozlesme = 'bagimsiz' | 'kadrolu' | 'musteri';
export type KadroluAlan = 'saha' | 'ic' | 'kurumsal';
/** Persona kimlikleri (v1 ile aynı anahtarlar; özel programlar bu anahtarlarla bağlıdır). */
export type RolId = 'oncu' | 'kadrolu' | 'cozum' | 'tavsiye' | 'elci';

type Dortlu = [number, number, number, number];

export interface Ayar {
  marka: Marka;
  /** v1’den kalan alan; v2’de komisyon her zaman oranla hesaplanır. */
  model: Model;
  /* ---------- Fiyatlandırma robotu: herkes için aynı ---------- */
  /** iStoc paketlerinin aylık fiyatı (€). Kurumsal paket teklifle satılır; değer örnek teklif ortalamasıdır. */
  istocPaketEur: Record<IstocPaket, number>;
  /** iStoc: ayda kaç yeni müşteri, paket başına. */
  istocSatis: Record<IstocPaket, number>;
  /** Segika: ayda kaç yeni müşteri, paket başına. */
  segikaSatis: Record<SegikaPaket, number>;
  /** Müşteri nasıl öder: yıllık paket ya da aylık abonelik. Komisyon her iki durumda ilk yıl bedelinden hesaplanır. */
  faturalama: Faturalama;
  kur: number;
  /** iStoc yıllık paket kaç aylık bedeldir. */
  istocYilAy: number;
  /** Segika fiyatı: 25 çalışanlık blok başına aylık (₺), kademeli büyük firma indirimi. */
  segikaFiyat: Record<SegikaPaket, number>;
  calisan: number;
  blok: number;
  kademeler: { ust: number; indirim: number }[];
  /* ---------- Satıştaki katkı: herkes için aynı ---------- */
  katki: Seviye;
  /** Segment oranının katkıya göre ne kadarı ödenir (tanıştırır, demo yapar, satışı kapatır). */
  katkiCarpan: Record<Seviye, number>;
  /* ---------- Segment koşulları (simülasyon) ---------- */
  /** Müşterilerin aboneliği yenileme oranı. */
  yenileme: number;
  egitim: Egitim;
  /** Ortak kurulumu, eğitimi ve ilk seviye desteği kendisi verir mi? */
  destek: boolean;
  /** Net tavsiye puanı (NPS, müşterinin bizi tavsiye etme isteği; ölçek −100 ile 100, burada 0–100 girilir). */
  memnuniyet: number;
  /* ---------- Segment kuralları ---------- */
  /** Segment başına komisyon oranı (satışı kapatan ortak için): Başlangıç, Gümüş, Altın, Profesyonel. */
  segmentOran: Dortlu;
  /** Gümüş, Altın ve Profesyonel için yıllık müşteri ve ciro eşiği (ürün başına). */
  segmentEsik: Record<Marka, { musteri: number; ciro: number }[]>;
  /** Altın ve Profesyonel için en düşük yenileme oranı. */
  segmentYenileme: [number, number];
  /** Profesyonel için en düşük memnuniyet puanı. */
  proMemnuniyet: number;
  /** Profesyonel çözüm ortağı müşteri yenilediğinde yenilenen bedelden bu oranı alır. */
  proYenilemePay: number;
  /* ---------- Ağ: en çok 2 kademe ---------- */
  /** Getirilen ortakların satışından pay: [1. kademe, 2. kademe] (cironun oranı). */
  agPay: [number, number];
  /** Her ortağın doğrudan getirdiği ortak sayısı. */
  agAltTemsilci: number;
  /** Ağdaki her ortağın aylık satışı (Standart paket eşdeğeri). */
  agAltSatis: number;
  /* ---------- Kampanyalar ---------- */
  /** İlk 90 gün hızlı başlangıç: yeni ortağın ilk 3 aydaki satışlarına ek oran. */
  hizliBaslangic: number;
  /** Kurumsal paket hızlandırıcı (iStoc): Kurumsal paket satışına ek oran. */
  kurumsalEk: number;
  /**
   * Arkadaşını getir (kullanıcı kararı 2026-11-04): yeni müşterinin ödemesi tavsiyeden sonraki `tavsiyeSure` ay içinde
   * tahsil edilirse hakediş oluşur. Süre hesabında her ay 30 gün sayılır. Hakedişte tavsiye eden `krediAy`, yeni müşteri
   * `yeniKrediAy` ay bedava kullanır. Yılda en çok `tavsiyeSinir` tavsiye krediye çevrilir.
   */
  tavsiyeSure: number;
  krediAy: number;
  yeniKrediAy: number;
  tavsiyeSinir: number;
  /* ---------- Hakediş ödemesi ---------- */
  ilkOdeme: number;
  ilkGun: number;
  kalanGun: number;
  /* ---------- Kadrolu satış uzmanına özel ---------- */
  kadroluAlan: KadroluAlan;
  /** Kariyer basamağına göre aylık maaş ve kota üstü prim oranı. */
  kadroluMaas: Dortlu;
  kadroluPrimOran: Dortlu;
  kotaCarpan: number;
  kotaEk: number;
  /** Takım lideri olmak için yönetilen ekip (kişi). */
  kadroluEkip: number;
  /** Takım liderinin ekibinin aylık satışı ve satış başı payı. */
  liderEkipSatis: number;
  liderPay: number;
  /* ---------- Danışman ve hizmet firmasına özel ---------- */
  musavirModel: 'komisyon' | 'indirim';
  musavirOran: number;
  musavirIndirim: number;
  /* ---------- Özel programlar (kosullarV2.ts) ---------- */
  /** Persona başına seçili özel program; boşsa standart program. */
  kosul: Partial<Record<RolId, string>>;
  oncuAsama: [number, number, number, number];
  cozumMusteri: number;
  yillaraOncu: [number, number, number];
  yillaraCozum: [number, number, number];
  yonlendirmeOran: number;
  yonlendirmeAy: number;
  smmmMukellef: number;
  gelistirmeOran: number;
  gelistirmeAy: number;
  tekSeferOran: number;
  affOdeme: 'paket' | 'aylik';
  affUfukAy: number;
  affPolitika: Record<'ayse' | 'satis' | 'cozum', 'tahsilatta' | 'hizmet-ayi' | 'tahsilatta-taksit'>;
  affSonraki: Record<'satis' | 'cozum', number>;
}

export const VARSAYILAN_AYAR: Ayar = {
  marka: 'istoc',
  model: 'oran',
  istocPaketEur: { standart: 399, pro: 599, kurumsal: 1_200 },
  istocSatis: { standart: 1, pro: 0, kurumsal: 0 },
  segikaSatis: { ikisi: 1, tesvik: 0, otomasyon: 0 },
  faturalama: 'yillik',
  kur: 56,
  istocYilAy: 10,
  segikaFiyat: { ikisi: 2_600, tesvik: 1_850, otomasyon: 1_600 },
  calisan: 25,
  blok: 25,
  kademeler: [
    { ust: 500, indirim: 0 },
    { ust: 2_000, indirim: 0.2 },
    { ust: 10_000, indirim: 0.35 },
    { ust: 0, indirim: 0.5 },
  ],
  katki: 'C',
  katkiCarpan: { A: 0.5, B: 0.75, C: 1 },
  yenileme: 0.75,
  egitim: 'temel',
  destek: false,
  memnuniyet: 45,
  segmentOran: [0.12, 0.15, 0.18, 0.22],
  segmentEsik: {
    istoc: [
      { musteri: 6, ciro: 1_300_000 },
      { musteri: 18, ciro: 4_000_000 },
      { musteri: 36, ciro: 8_000_000 },
    ],
    segika: [
      { musteri: 6, ciro: 180_000 },
      { musteri: 18, ciro: 560_000 },
      { musteri: 36, ciro: 1_120_000 },
    ],
  },
  segmentYenileme: [0.7, 0.8],
  proMemnuniyet: 40,
  proYenilemePay: 0.08,
  agPay: [0.03, 0.015],
  agAltTemsilci: 2,
  agAltSatis: 1,
  hizliBaslangic: 0.03,
  kurumsalEk: 0.02,
  tavsiyeSure: 3,
  krediAy: 2,
  yeniKrediAy: 1,
  tavsiyeSinir: 3,
  ilkOdeme: 0.7,
  ilkGun: 14,
  kalanGun: 60,
  kadroluAlan: 'saha',
  kadroluMaas: [42_000, 50_000, 62_000, 75_000],
  kadroluPrimOran: [0.03, 0.05, 0.06, 0.07],
  kotaCarpan: 2,
  kotaEk: 0.2,
  kadroluEkip: 0,
  liderEkipSatis: 6,
  liderPay: 1_500,
  musavirModel: 'indirim',
  musavirOran: 0.08,
  musavirIndirim: 0.2,
  kosul: {},
  oncuAsama: [0, 1, 2, 4],
  cozumMusteri: 10,
  yillaraOncu: [0.15, 0.1, 0],
  yillaraCozum: [0.25, 0.15, 0],
  yonlendirmeOran: 0.15,
  yonlendirmeAy: 6,
  smmmMukellef: 10,
  gelistirmeOran: 0.1,
  gelistirmeAy: 6,
  tekSeferOran: 0.1,
  affOdeme: 'paket',
  affUfukAy: 36,
  affPolitika: { ayse: 'tahsilatta', satis: 'hizmet-ayi', cozum: 'hizmet-ayi' },
  affSonraki: { satis: 0, cozum: 0 },
};

export const SEVIYE_ADI: Record<Seviye, string> = { A: 'Yalnız tanıştırır', B: 'Ürünü de gösterir', C: 'Satışı kendisi kapatır' };
export const PAKET_ADI: Record<SegikaPaket, string> = { ikisi: 'Teşvik ve Otomasyon', tesvik: 'SGK Teşvik', otomasyon: 'SGK Otomasyon' };
export const ISTOC_PAKET_ADI: Record<IstocPaket, string> = { standart: 'Standart', pro: 'Pro', kurumsal: 'Kurumsal' };
export const SEGMENT_ADI = ['Başlangıç ortağı', 'Gümüş ortak', 'Altın ortak', 'Profesyonel çözüm ortağı'];
export const KARIYER_ADI = ['Satış uzmanı yardımcısı', 'Satış uzmanı', 'Kıdemli satış uzmanı', 'Takım lideri'];
export const ALAN_ADI: Record<KadroluAlan, string> = { saha: 'Saha satışı', ic: 'Telefon ve çevrim içi satış', kurumsal: 'Kurumsal müşteri' };
export const SOZLESME_ADI: Record<Sozlesme, string> = { bagimsiz: 'Bağımsız ortak', kadrolu: 'Kadrolu çalışan', musteri: 'Müşteri' };

const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;
/** Süre hesabında her ay 30 gün sayılır (kullanıcı kararı 2026-11-04). 3 ay = 90 gün. */
export const AY_GUN = 30;
export const ayGun = (ay: number) => Math.round(ay * AY_GUN);
/** “3 ay (90 gün)” biçiminde süre. */
export const sureMetni = (ay: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(ay)} ay (${ayGun(ay)} gün)`;

const yuzde = (v: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v * 100)}`;
const sayi = (v: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v);

/* ---------- Fiyatlandırma robotu ---------- */

/**
 * Segika aylık fiyatı: çalışan sayısı blok katına yuvarlanır; her kademedeki çalışanlar o kademenin indirimiyle
 * fiyatlanır (kademeli, sıçramasız). 1–500 sitedeki liste fiyatı; üst kademe indirimleri teklif varsayımıdır.
 */
export function segikaAylik(a: Ayar, paket: SegikaPaket = 'ikisi') {
  const blok = Math.max(1, a.blok);
  const kisi = Math.max(blok, Math.ceil(Math.max(1, a.calisan) / blok) * blok);
  const kisiBasi = a.segikaFiyat[paket] / blok;
  let alt = 0;
  let toplam = 0;
  const dilimler: { alt: number; ust: number; kisi: number; indirim: number; tutar: number }[] = [];
  for (const k of a.kademeler) {
    const ust = k.ust > 0 ? k.ust : Infinity;
    const bu = Math.max(0, Math.min(kisi, ust) - alt);
    if (bu > 0) {
      const tutar = bu * kisiBasi * (1 - k.indirim);
      dilimler.push({ alt: alt + 1, ust: Math.min(kisi, ust), kisi: bu, indirim: k.indirim, tutar });
      toplam += tutar;
    }
    alt = ust;
    if (alt >= kisi) break;
  }
  return { kisi, toplam, dilimler, listeFiyati: kisi * kisiBasi };
}

export interface PaketSatiri {
  id: string;
  ad: string;
  /** Aylık liste fiyatı (₺). */
  aylik: number;
  /** Müşterinin ilk yıl ödediği tutar (₺): yıllık pakette paket bedeli, aylık abonelikte 12 ay. */
  ilkYil: number;
  /** Ayda kaç yeni müşteri. */
  adet: number;
  /** Bu paketin aylık satış cirosu: adet × ilk yıl bedeli. */
  ciro: number;
  fiyatNotu?: string;
}

/** Ödeme biçimine göre ilk yılın kaç aylık bedel olduğu. iStoc yıllık paketi indirimlidir; Segika 12 aydır. */
export const ilkYilAy = (a: Ayar) => (a.faturalama === 'aylik' ? 12 : a.marka === 'istoc' ? a.istocYilAy : 12);

export function paketler(a: Ayar): PaketSatiri[] {
  const ay = ilkYilAy(a);
  if (a.marka === 'istoc')
    return (Object.keys(ISTOC_PAKET_ADI) as IstocPaket[]).map((id) => {
      const aylik = a.istocPaketEur[id] * a.kur;
      const adet = Math.max(0, a.istocSatis[id]);
      return { id, ad: ISTOC_PAKET_ADI[id], aylik, ilkYil: aylik * ay, adet, ciro: adet * aylik * ay, fiyatNotu: id === 'kurumsal' ? 'Teklifle satılır, örnek tutar' : undefined };
    });
  return (Object.keys(PAKET_ADI) as SegikaPaket[]).map((id) => {
    const aylik = segikaAylik(a, id).toplam;
    const adet = Math.max(0, a.segikaSatis[id]);
    return { id, ad: PAKET_ADI[id], aylik, ilkYil: aylik * ay, adet, ciro: adet * aylik * ay };
  });
}

/** Robotun sonucu: ayda kaç müşteri ve aylık satış cirosu (yeni müşterilerin ilk yıl bedeli). */
export function satisOzeti(a: Ayar) {
  const p = paketler(a);
  const adet = p.reduce((s, x) => s + x.adet, 0);
  const ciro = p.reduce((s, x) => s + x.ciro, 0);
  const ortalamaIlkYil = adet > 0 ? ciro / adet : p[0].ilkYil;
  const ortalamaAylik = adet > 0 ? p.reduce((s, x) => s + x.adet * x.aylik, 0) / adet : p[0].aylik;
  return { paketler: p, adet, ciro, ortalamaIlkYil, ortalamaAylik, referans: p[0] };
}

/** Bir müşterinin ortalama aylık fiyatı ve ilk yıl bedeli (özel programlar bu tutarlarla hesaplanır). */
export const aylikFiyat = (a: Ayar) => satisOzeti(a).ortalamaAylik;
export const yillikFiyat = (a: Ayar) => satisOzeti(a).ortalamaIlkYil;

/* ---------- Segment ve kariyer basamağı ---------- */

export interface Kosul {
  ad: string;
  mevcut: string;
  tamam: boolean;
  /** Hedefe ilerleme, 0–1. */
  ilerleme: number;
  /** Eksikse ne yapılmalı (tam cümle parçası). */
  eksik?: string;
}

export interface Basamak {
  ad: string;
  /** Bağımsız ortakta komisyon oranı, kadroluda prim oranı. */
  oran: number;
  maas?: number;
  kosullar: Kosul[];
  tamam: boolean;
}

export interface SegmentSonucu {
  seviye: number;
  basamaklar: Basamak[];
  yillikMusteri: number;
  yillikCiro: number;
  /** Bir üst basamağa geçmek için eksikler; en üst basamakta boş. */
  eksikler: string[];
}

/**
 * Segment hesabı. Satış adetleri her ay aynı kabul edilir: yıllık müşteri = aylık × 12, yıllık ciro = aylık × 12.
 * Basamaklar sırayla kazanılır; bir basamağın bütün koşulları ve önceki basamaklar sağlanmalıdır.
 * Bağımsız ortak Profesyonel çözüm ortağı rozeti için kurulum ve desteği kendisi verir. Kadrolu çalışan takım lideri
 * olmak için en az 2 kişilik ekip yönetir.
 */
export function segmentHesabi(a: Ayar, tur: 'bagimsiz' | 'kadrolu'): SegmentSonucu {
  const s = satisOzeti(a);
  const yillikMusteri = s.adet * 12;
  const yillikCiro = s.ciro * 12;
  const esik = a.segmentEsik[a.marka];
  const oranlar = tur === 'bagimsiz' ? a.segmentOran : a.kadroluPrimOran;
  const adlar = tur === 'bagimsiz' ? SEGMENT_ADI : KARIYER_ADI;
  const musteriK = (e: { musteri: number }): Kosul => ({
    ad: `Yılda en az ${sayi(e.musteri)} yeni müşteri`,
    mevcut: `${sayi(yillikMusteri)} müşteri`,
    tamam: yillikMusteri >= e.musteri,
    ilerleme: e.musteri > 0 ? Math.min(1, yillikMusteri / e.musteri) : 1,
    eksik: `yılda ${sayi(Math.max(0, e.musteri - yillikMusteri))} müşteri daha kazanmak`,
  });
  const ciroK = (e: { ciro: number }): Kosul => ({
    ad: `Yılda en az ${tl(e.ciro)} ciro`,
    mevcut: tl(yillikCiro),
    tamam: yillikCiro >= e.ciro,
    ilerleme: e.ciro > 0 ? Math.min(1, yillikCiro / e.ciro) : 1,
    eksik: `yıllık ciroyu ${tl(Math.max(0, e.ciro - yillikCiro))} artırmak`,
  });
  const yenilemeK = (alt: number): Kosul => ({
    ad: `Müşterilerin en az ${yuzde(alt)} kadarı aboneliği yeniler`,
    mevcut: yuzde(a.yenileme),
    tamam: a.yenileme >= alt,
    ilerleme: alt > 0 ? Math.min(1, a.yenileme / alt) : 1,
    eksik: `yenileme oranını ${yuzde(alt)} düzeyine çıkarmak`,
  });
  const sertifikaK: Kosul = { ad: 'Ürün sertifikası alınmış', mevcut: a.egitim === 'sertifika' ? 'Alındı' : 'Yalnız temel eğitim', tamam: a.egitim === 'sertifika', ilerleme: a.egitim === 'sertifika' ? 1 : 0.5, eksik: 'ürün sertifikasını almak' };
  const memnuniyetK: Kosul = {
    ad: `Müşterilerin bizi tavsiye etme puanı (NPS) en az ${sayi(a.proMemnuniyet)}`,
    mevcut: sayi(a.memnuniyet),
    tamam: a.memnuniyet >= a.proMemnuniyet,
    ilerleme: a.proMemnuniyet > 0 ? Math.min(1, a.memnuniyet / a.proMemnuniyet) : 1,
    eksik: `tavsiye etme puanını ${sayi(a.proMemnuniyet)} düzeyine çıkarmak`,
  };
  const ustK: Kosul =
    tur === 'bagimsiz'
      ? { ad: 'Kurulumu, eğitimi ve ilk seviye desteği kendisi verir', mevcut: a.destek ? 'Veriyor' : 'Vermiyor', tamam: a.destek, ilerleme: a.destek ? 1 : 0, eksik: 'kurulum ve desteği üstlenmek' }
      : { ad: 'En az 2 kişilik ekip yönetir', mevcut: `${sayi(a.kadroluEkip)} kişi`, tamam: a.kadroluEkip >= 2, ilerleme: Math.min(1, a.kadroluEkip / 2), eksik: 'en az 2 kişilik ekibi yönetmek' };
  const kosullar: Kosul[][] = [
    [{ ad: tur === 'bagimsiz' ? 'Ortaklık sözleşmesi ve temel eğitim' : 'İşe giriş ve temel eğitim', mevcut: 'Tamam', tamam: true, ilerleme: 1 }],
    [musteriK(esik[0]), ciroK(esik[0])],
    [musteriK(esik[1]), ciroK(esik[1]), yenilemeK(a.segmentYenileme[0]), sertifikaK],
    [musteriK(esik[2]), ciroK(esik[2]), yenilemeK(a.segmentYenileme[1]), sertifikaK, ustK, memnuniyetK],
  ];
  let seviye = 0;
  for (let i = 1; i < 4 && kosullar[i].every((k) => k.tamam); i++) seviye = i;
  const basamaklar = kosullar.map((k, i) => ({ ad: adlar[i], oran: oranlar[i], maas: tur === 'kadrolu' ? a.kadroluMaas[i] : undefined, kosullar: k, tamam: i <= seviye }));
  const eksikler = seviye < 3 ? kosullar[seviye + 1].filter((k) => !k.tamam).map((k) => k.eksik ?? k.ad) : [];
  return { seviye, basamaklar, yillikMusteri, yillikCiro, eksikler };
}

/* ---------- Kazanç ---------- */

/** Ağ kademe payları: satış başına ₺ (Standart paket). Satış yapanın komisyonu, 1. ve 2. kademe payı. */
export function agBirimPaylari(a: Ayar) {
  const ref = satisOzeti(a).referans.ilkYil;
  const sg = segmentHesabi(a, 'bagimsiz');
  return { ref, satici: ref * a.segmentOran[sg.seviye] * a.katkiCarpan[a.katki], k1: ref * a.agPay[0], k2: ref * a.agPay[1] };
}

/**
 * Bağımsız ortağın aylık kazancı. Aynı satış, aynı segment ve aynı katkı aynı tutarı verir; persona tutarı değiştirmez.
 * Ağ payı için ortak o ay en az bir satış yapmış olmalıdır. 1. kademe payı Gümüş, 2. kademe payı Altın segmentinden
 * itibaren ödenir. Profesyonel çözüm ortağı yenilenen müşterilerden yenileme payı da alır (2. yıldan itibaren).
 */
export function bagimsizKazanc(a: Ayar) {
  const s = satisOzeti(a);
  const sg = segmentHesabi(a, 'bagimsiz');
  const oran = a.segmentOran[sg.seviye] * a.katkiCarpan[a.katki];
  const komisyon = s.ciro * oran;
  const kurumsal = a.marka === 'istoc' ? (s.paketler.find((p) => p.id === 'kurumsal')?.ciro ?? 0) * a.kurumsalEk : 0;
  const hizli = s.ciro * a.hizliBaslangic;
  const aktif = s.adet >= 1;
  const birim = agBirimPaylari(a);
  const dal = Math.max(0, Math.round(a.agAltTemsilci));
  const k1Acik = aktif && sg.seviye >= 1;
  const k2Acik = aktif && sg.seviye >= 2;
  const k1 = k1Acik ? dal * a.agAltSatis * birim.k1 : 0;
  const k2 = k2Acik ? dal * dal * a.agAltSatis * birim.k2 : 0;
  const yenilemePay = sg.seviye === 3 ? s.ciro * a.yenileme * a.proYenilemePay : 0;
  const aylik = komisyon + kurumsal + k1 + k2;
  /** Bize kalan: komisyon, kampanya ve satışın üstündeki 2 kademeye en çok ödenecek ağ payı düşülünce. */
  const agUst = s.ciro * (a.agPay[0] + a.agPay[1]);
  return { s, sg, oran, komisyon, kurumsal, hizli, aktif, dal, k1, k2, k1Acik, k2Acik, birim, yenilemePay, aylik, satisKazanci: komisyon + kurumsal, agUst, bize: s.ciro - komisyon - kurumsal - agUst };
}

/** Kadrolu satış uzmanı: basamağın maaşı, kota üstü ciro primi, takım liderinde ekip payı. */
export function kadroluKazanc(a: Ayar) {
  const s = satisOzeti(a);
  const sg = segmentHesabi(a, 'kadrolu');
  const b = sg.seviye;
  const maas = a.kadroluMaas[b];
  const kota = maas * a.kotaCarpan * (1 + a.kotaEk);
  const primOran = a.kadroluPrimOran[b];
  const prim = Math.max(0, s.ciro - kota) * primOran;
  const ekip = b === 3 ? a.liderEkipSatis * a.liderPay : 0;
  return { s, sg, maas, kota, primOran, prim, ekip, toplam: maas + prim + ekip, doluluk: kota > 0 ? s.ciro / kota : 0 };
}

/**
 * Mevcut müşteri: “Arkadaşını getir” kampanyasıyla hizmet kredisi kazanır. Robotun satışı, müşterinin tavsiyesiyle gelen
 * yeni müşteri sayısıdır. Yılda en çok `tavsiyeSinir` tavsiye krediye çevrilir; daha fazlası ortaklık hacmidir.
 * Hakediş, yeni müşterinin ödemesi `tavsiyeSure` ay içinde tahsil edilince oluşur. Hesap, ödemenin bu sürede alındığını
 * varsayar; süre tutarı değil hakediş koşulunu belirler.
 */
export function musteriKazanc(a: Ayar) {
  const s = satisOzeti(a);
  const kendiAylik = s.referans.aylik;
  const yillikTavsiye = s.adet * 12;
  const sayilan = Math.min(yillikTavsiye, a.tavsiyeSinir);
  const tavsiyeBasi = kendiAylik * a.krediAy;
  return { s, kendiAylik, yillikTavsiye, sayilan, tavsiyeBasi, yillikKredi: sayilan * tavsiyeBasi, sureGun: ayGun(a.tavsiyeSure), fazla: Math.max(0, yillikTavsiye - a.tavsiyeSinir), ortakOlursa: bagimsizKazanc(a) };
}

export interface DonemSatiri {
  ad: string;
  yillik: number;
  /** Yıllık tutarın nasıl hesaplandığı (kısa formül). */
  formul: string;
}

/** Dönemsel kazanç: günlük = yıllık ÷ 365, haftalık = yıllık ÷ 52, aylık = yıllık ÷ 12. */
export function donemKazanci(a: Ayar, sozlesme: Sozlesme): DonemSatiri[] {
  if (sozlesme === 'kadrolu') {
    const k = kadroluKazanc(a);
    return [
      { ad: 'Maaş', yillik: k.maas * 12, formul: `${tl(k.maas)} × 12 ay` },
      { ad: 'Kota üstü prim', yillik: k.prim * 12, formul: `${tl(k.prim)} × 12 ay` },
      ...(k.ekip > 0 ? [{ ad: 'Ekip payı', yillik: k.ekip * 12, formul: `${tl(k.ekip)} × 12 ay` }] : []),
      { ad: 'Toplam', yillik: k.toplam * 12, formul: `${tl(k.toplam)} × 12 ay` },
    ];
  }
  if (sozlesme === 'musteri') {
    const m = musteriKazanc(a);
    return [{ ad: 'Ücretsiz kullanımın değeri', yillik: m.yillikKredi, formul: `${sayi(m.sayilan)} tavsiye × ${tl(m.tavsiyeBasi)}` }];
  }
  const b = bagimsizKazanc(a);
  const satirlar: DonemSatiri[] = [{ ad: 'Satış komisyonu', yillik: b.komisyon * 12, formul: `${tl(b.komisyon)} × 12 ay` }];
  if (b.kurumsal > 0) satirlar.push({ ad: 'Kurumsal paket kampanyası', yillik: b.kurumsal * 12, formul: `${tl(b.kurumsal)} × 12 ay, kampanya sürerse` });
  if (b.k1 > 0) satirlar.push({ ad: 'Ağ, 1. kademe', yillik: b.k1 * 12, formul: `${tl(b.k1)} × 12 ay` });
  if (b.k2 > 0) satirlar.push({ ad: 'Ağ, 2. kademe', yillik: b.k2 * 12, formul: `${tl(b.k2)} × 12 ay` });
  satirlar.push({ ad: 'Toplam', yillik: b.aylik * 12, formul: `${tl(b.aylik)} × 12 ay` });
  if (b.yenilemePay > 0) satirlar.push({ ad: '2. yıldan sonra ek: yenileme payı', yillik: b.yenilemePay * 12, formul: `${tl(b.yenilemePay)} × 12 ay` });
  return satirlar;
}

/* ---------- Persona metinleri ---------- */

export interface RolMetni {
  id: RolId;
  ad: string;
  kisa: string;
  sozlesme: Sozlesme;
  kim: string;
  kurallar: string[];
  /** Kimlerle çalışırız: personanın gerçek hayattaki karşılıkları. */
  kimler: string[];
}

/** Kısa, tam cümleli metinler (yalın Türkçe talimatı). */
export function rolMetinleri(marka: Marka): RolMetni[] {
  const urun = marka === 'istoc' ? 'iStoc' : 'Segika';
  const ist = marka === 'istoc';
  return [
    {
      id: 'oncu',
      ad: 'Öncü satış ortağı',
      kisa: 'Satışa yeni başlayan gençler',
      sozlesme: 'bagimsiz',
      kim: ist
        ? 'Deniz 22 yaşında, son sınıf öğrencisi. Gerçek işletmelerle görüşerek satış öğrenmek istiyor. Başlangıç ortağı olarak başlar. Satış yaptıkça üst basamaklara çıkar.'
        : 'Ece 23 yaşında, İK ya da muhasebe öğrencisi. Doğru işletmeyi bulur ve ürün gösterimi ayarlar. Teşvik sonucu hakkında söz vermez.',
      kurallar: ['Ortağa kazanç garantisi vermeyiz.', 'Ortak müşteriden ödeme almaz. Ortak indirim de veremez.', 'Başarılı öncü ortağı kadro görüşmesine çağırırız.'],
      kimler: ist
        ? ['Üniversite öğrencisi', 'Yeni mezun', 'İşletme ve pazarlama öğrencisi', 'Yarı zamanlı çalışmak isteyen', 'Ticarete ilgi duyan genç', 'Esnaf ailesinden gelen genç', 'Kampüs girişimcilik kulübü üyesi', 'Staj arayan öğrenci']
        : ['İK öğrencisi', 'Muhasebe öğrencisi', 'Çalışma ekonomisi mezunu', 'İşletme öğrencisi', 'Yeni mezun', 'Yarı zamanlı çalışmak isteyen'],
    },
    {
      id: 'kadrolu',
      ad: 'Kadrolu satış uzmanı',
      kisa: 'SGK’lı çalışanımız',
      sozlesme: 'kadrolu',
      kim: ist
        ? 'Bizim SGK’lı çalışanımızdır. Müşteri listesini yönetir ve satışı kapatır. Maaş alır, kotayı aşınca prim kazanır. Aynı satış eşikleriyle kariyer basamağı yükselir.'
        : 'Bizim SGK’lı çalışanımızdır. Satışı yapar ve müşteri listesini yönetir. Maaş alır, kotayı aşınca prim kazanır. Aynı satış eşikleriyle kariyer basamağı yükselir.',
      kurallar: ['Müşteri desteğini biz veririz.', 'İlk iki ay kota uygulanmaz. Uzman bu sürede işi öğrenir. Hesap, üçüncü aydan sonraki bir ayı gösterir.', 'Prim, müşteri ödeyince ve iade süresi geçince ödenir.', 'Kadrolu çalışan ağ payı ve kampanya ödülü almaz. Bunun yerine maaş, SGK ve prim alır.'],
      kimler: ist
        ? ['Deneyimli saha satışçısı', 'İşletmelere satış yapan temsilci', 'Toptan sektöründen satışçı', 'Bayi satış sorumlusu', 'Telefonla satış uzmanı', 'Kurumsal müşteri yöneticisi', 'Öncü ortaklardan yükselen']
        : ['Yazılım satış temsilcisi', 'Bordro yazılımı satışçısı', 'Muhasebe yazılımı satışçısı', 'SGK bilgili satış uzmanı', 'Telefonla satış uzmanı', 'Öncü ortaklardan yükselen'],
    },
    {
      id: 'cozum',
      ad: 'Danışman ve hizmet firması',
      kisa: 'İşletmenin güvendiği uzman',
      sozlesme: 'bagimsiz',
      kim: ist
        ? 'İşletme sahibinin zaten güvendiği danışman ya da firmadır. iStoc’u müşterisine önerir. Kurulumu ve desteği kendisi verirse Profesyonel çözüm ortağı rozetine aday olur.'
        : 'İşverene bordro, İK ya da iş güvenliği hizmeti veren profesyoneldir. Segika’yı müşterisine önerir. Desteği kendisi verirse Profesyonel çözüm ortağı rozetine aday olur.',
      kurallar: ['Ortak sözleşmeyle çalışır. Kazancını bize fatura keserek alır.', 'Her müşteri firma yalnız bir ortağın hesabına yazılır.', 'Başka bir ortağı programa getirene para ödemeyiz. Ağ payı yalnız gerçek satıştan doğar.'],
      kimler: ist
        ? ['E-ihracat danışmanı', 'Katalog ve fotoğraf stüdyosu', 'E-ticaret ajansı', 'Muhasebe yazılımı (ERP) ve kartlı ödeme cihazı (POS) bayisi', 'Muhasebe bürosu', 'Lojistik firması', 'Kargo acentesi', 'Gümrük müşaviri', 'Marka ve ambalaj ajansı', 'Çarşı derneği', 'Fuar organizatörü', 'Üretici birlikleri']
        : ['Mali müşavir', 'Bordro bürosu', 'OSGB', 'Bağımsız İK danışmanı', 'İK dernekleri', 'OSB yönetimi', 'Sanayi ve ticaret odası', 'Muhasebe yazılımı bayisi (Luca, Mikro, ETA)', 'Özel istihdam bürosu', 'İş hukuku avukatı'],
    },
    {
      id: 'tavsiye',
      ad: 'Mevcut müşteri',
      kisa: 'Arkadaşını getir kampanyası',
      sozlesme: 'musteri',
      kim: ist
        ? 'İstoç çarşısındaki müşterimiz, komşu dükkâna iStoc’u önerir. “Arkadaşını getir” kampanyasıyla para değil ücretsiz kullanım kazanır. Daha fazla tavsiye getirirse ortak olabilir.'
        : 'Segika müşterisi, başka firmadaki İK ya da muhasebe yöneticisine Segika’yı önerir. “Arkadaşını getir” kampanyasıyla ücretsiz kullanım kazanır. Daha fazla tavsiye getirirse ortak olabilir.',
      kurallar: ['Ödül nakit değil, ücretsiz kullanımdır.', 'Yeni müşterinin ödemesi belirlenen tahsilat süresi içinde alınırsa ücretsiz kullanım hakkı oluşur.', 'Müşteriden tavsiyeyi, hizmetten doğrulanmış bir sonuç aldıktan sonra isteriz.'],
      kimler: ist
        ? ['Mevcut iStoc satıcısı', 'Çarşıdaki komşu dükkân', 'Aynı bloktaki toptancı', 'Tedarikçi esnaf', 'Müşteri esnaf', 'Esnaf derneği üyesi']
        : ['Mevcut Segika müşterisi', 'İK yöneticisi', 'Muhasebe yöneticisi', 'Aynı organize sanayi bölgesindeki firma', 'Grup şirketleri'],
    },
    {
      id: 'elci',
      ad: 'Marka elçisi',
      kisa: 'İçerik üreticileri ve eğitmenler',
      sozlesme: 'bagimsiz',
      kim: `Kendi kitlesine ${urun}’u kendi bağlantısıyla tanıtır. Çoğu zaman yalnız tanıştırır. Bağlantıdan gelen müşteri ödeme yaparsa segmentine ve katkısına göre komisyon alır.`,
      kurallar: ['Elçi, paylaşımlarına “reklam” sözünü yazar.', 'Sahte yorum ve toplu mesaj yasaktır.', 'Kazanç vaadiyle ortak toplamaz.'],
      kimler: ist
        ? ['Toptan ticaret eğitmeni', 'E-ihracat içerik üreticisi', 'LinkedIn yazarı', 'Sektör YouTube kanalı', 'Girişimcilik topluluğu', 'Esnafa yönelik Instagram hesabı', 'Ticaret podcast’i yapan', 'Sektör bülteni yazarı', 'Çevrim içi seminer düzenleyen eğitmen', 'Ticaret odası eğitmeni', 'Üniversitede girişimcilik dersi veren']
        : ['İK içerik üreticisi', 'Bordro eğitmeni', 'SGK mevzuat yazarı', 'LinkedIn İK topluluğu', 'Muhasebe YouTube kanalı', 'İK podcast’i yapan', 'Çevrim içi seminer düzenleyen eğitmen'],
    },
  ];
}

/* ---------- Kampanyalar ---------- */

export interface Kampanya {
  id: string;
  ad: string;
  /** Hangi personalar katılabilir. */
  kimler: RolId[];
  marka: Marka[];
  ozet: (a: Ayar) => string;
}

export const KAMPANYALAR: Kampanya[] = [
  {
    id: 'hizli-baslangic',
    ad: 'İlk 90 gün hızlı başlangıç',
    kimler: ['oncu', 'cozum', 'elci'],
    marka: ['istoc', 'segika'],
    ozet: (a) => `Yeni bağımsız ortak, ilk 90 gününde yaptığı satışlardan ${yuzde(a.hizliBaslangic)} ek pay alır. Bu pay, ortak seviyesinin komisyon oranına eklenir.`,
  },
  {
    id: 'kurumsal',
    ad: 'Kurumsal paket ek primi',
    kimler: ['oncu', 'cozum', 'elci'],
    marka: ['istoc'],
    ozet: (a) => `Kurumsal paket satışında segment oranına ek olarak ${yuzde(a.kurumsalEk)} ödenir. Kampanya, duyurulan dönemin sonunda biter.`,
  },
  {
    id: 'arkadasini-getir',
    ad: 'Arkadaşını getir',
    kimler: ['tavsiye'],
    marka: ['istoc', 'segika'],
    ozet: (a) =>
      `Yeni müşterinin ödemesi tavsiyeden sonraki ${sureMetni(a.tavsiyeSure)} içinde tahsil edilirse hakediş oluşur. Bu durumda tavsiye eden müşteri ${a.krediAy} ay, yeni müşteri ${a.yeniKrediAy} ay bedava kullanır. Ödeme bu sürede tahsil edilmezse hakediş oluşmaz. Süre hesabında her ay 30 gün sayılır. Yılda en çok ${a.tavsiyeSinir} tavsiye ödül kazandırır.`,
  },
];

export const kampanyalar = (a: Ayar, rol: RolId) => KAMPANYALAR.filter((k) => k.kimler.includes(rol) && k.marka.includes(a.marka));

/** Profesyonel çözüm ortağının neden daha çok kazandığı (kullanıcı kararı 2026-11-03: gerekçe vurgulanmalı). */
export const PRO_GEREKCE = [
  'Kurulumu, eğitimi ve ilk seviye desteği ortak verir. Bu işleri biz yapmadığımız için tasarruf ettiğimiz maliyetin bir kısmını ortağa öderiz.',
  'Müşteriyi elde tutmaktan sorumludur. Bu yüzden müşteri yenilediğinde yenileme payı alır.',
  'Rozet herkese açıktır. Koşulları sağlayan öğrenci, danışman ya da marka elçisi aynı oranı alır.',
];
