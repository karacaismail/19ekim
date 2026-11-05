import veri from './istihdamV2.json' with { type: 'json' };

/**
 * İstihdam takvimi v2 (kullanıcı kararı 2026-11-05): istoc.com için 2027 kadro planı. Üç seçenek (ekonomik, medyan,
 * güçlü), 11 küme ve pozisyon başına gerekçe, nitelik, 2027 işe alım ayı ve maliyet. Mevcut istihdam takvimindeki
 * 7 rol (`eski`) değiştirilmeden üç seçenekte de yer alır. Kurucu ve yazılım ekibi `mevcut` kadrodur.
 * Veri `istihdamV2.json` içindedir ve araştırma betiğinden üretilmiştir (kaynaklar dosyada). Maaşlar 2027 tahminidir:
 * 2027 asgari ücreti açıklanmadı. Plan, Google Sheets gider tablosundaki 2027 artışını (yıllık TÜFE, yüzde 29,73) kullanır
 * (kullanıcı kararı 2026-11-05). İşveren maliyeti net maaşın 2 katıdır (costFactor).
 * Dış hizmet ve serbest çalışan bedeli fatura tutarıdır ve 2 ile çarpılmaz. Yarı zamanlı çalışan yarım maliyettir.
 */

export type SecenekId = 'ekonomik' | 'medyan' | 'guclu';
export const SECENEKLER: SecenekId[] = ['ekonomik', 'medyan', 'guclu'];
export const SECENEK_ADI: Record<SecenekId, string> = { ekonomik: 'Ekonomik', medyan: 'Medyan', guclu: 'Güçlü' };

export type CalismaBicimi = 'Tam zamanlı' | 'Yarı zamanlı' | 'Dış hizmet' | 'Serbest çalışan';

export interface PozisyonSecenegi {
  kisi: number;
  /** Kişi başına işe alım ayı (YYYY-AA). 2027'den önceki ay yıl boyu çalışır. */
  iseAlim: string[];
  bicim: CalismaBicimi;
  /** Dış hizmet ve serbest çalışanda aylık toplam fatura bedeli. */
  aylikHizmetBedeli?: number | null;
  yillikMaliyet2027: number;
  maliyetNotu?: string;
}

export interface Pozisyon {
  id: string;
  kume: string;
  departman: string;
  unvan: string;
  seviye: string;
  calismaBicimi: CalismaBicimi;
  eski: boolean;
  mevcut?: boolean;
  gerekce: string;
  nitelikler: string[];
  netMaas2027: number | null;
  maasDayanagi: string;
  aylikMaliyet: number | null;
  planTarihi?: string;
  secenekler: Record<SecenekId, PozisyonSecenegi>;
}

export interface Kume {
  id: string;
  ad: string;
  aciklama: string;
}

export interface SecenekOzeti {
  aciklama: string;
  dayandigiSenaryo: string;
  toplamKisi: number;
  yariZamanli: number;
  yeniKadroKisi: number;
  disHizmetSayisi: number;
  serbestCalisanSayisi: number;
  toplamMaliyet2027: number;
  kadroMaliyeti2027: number;
  disHizmetVeSerbestMaliyeti2027: number;
  aylikMaliyetAralik2027: number;
  gelirHedefi2027: number;
  gelirPayi: number;
  gelirAralik2027: number;
  aralikGelirPayi: number;
  hedefler: { yeniAktifSatici2027: number; odeyenSaticiAralik2027: number };
}

export interface Kaynak {
  id: string;
  ad: string;
  url: string | null;
  tarih?: string;
}

interface Veri {
  olusturma: string;
  varsayimlar: {
    asgariUcret2027: { net: number; brut: number; varsayilanArtis: string; durum: string; gerekce: string; aralik: { dusuk: { artis: string; net: number }; yuksek: { artis: string; net: number } } };
    enflasyon: { tcmb2026III: { yilSonu2027: string }; ovp2027_2029: { hedef2027: string }; sonVeri: string };
    maasArtisi: { yontem: string; sinir: string };
  };
  kumeler: Kume[];
  pozisyonlar: Pozisyon[];
  secenekler: Record<SecenekId, SecenekOzeti>;
  kaynaklar: Kaynak[];
}

const V = veri as unknown as Veri;
export const KUMELER: Kume[] = V.kumeler;
export const POZISYONLAR: Pozisyon[] = V.pozisyonlar;
export const SECENEK_OZETI: Record<SecenekId, SecenekOzeti> = V.secenekler;
export const VARSAYIMLAR = V.varsayimlar;
export const KAYNAKLAR: Kaynak[] = V.kaynaklar;
export const HESAP_TARIHI = '2026-11-05';

export const AYLAR_2027 = Array.from({ length: 12 }, (_, i) => `2027-${String(i + 1).padStart(2, '0')}`);

const hizmet = (b: CalismaBicimi) => b === 'Dış hizmet' || b === 'Serbest çalışan';

/**
 * Pozisyonun seçenekteki 2027 aylık gideri (12 değer). Kadrolu kişi işe alım ayından itibaren sayılır. Dış hizmet ve
 * serbest çalışan aylık bedeli ilk başlangıç ayından itibaren sayılır. Aylık bedeli olmayan hizmet bir kerelik giderdir
 * ve başlangıç ayına yazılır. Bedeli bilinmeyen hizmet 0 sayılır (veride `maliyetNotu`).
 */
export function aylikGider(p: Pozisyon, s: SecenekId): number[] {
  const o = p.secenekler[s];
  const ay = AYLAR_2027.map(() => 0);
  if (!o.kisi) return ay;
  const baslangic = (iso: string) => (iso < '2027-01' ? 0 : Number(iso.slice(5)) - 1);
  if (hizmet(o.bicim)) {
    const ilk = baslangic([...o.iseAlim].sort()[0]);
    if (o.aylikHizmetBedeli) for (let i = ilk; i < 12; i++) ay[i] += o.aylikHizmetBedeli;
    else if (o.yillikMaliyet2027) ay[ilk] += o.yillikMaliyet2027;
    return ay;
  }
  const aylik = (p.aylikMaliyet ?? 0) * (o.bicim === 'Yarı zamanlı' ? 0.5 : 1);
  for (const iso of o.iseAlim) for (let i = baslangic(iso); i < 12; i++) ay[i] += aylik;
  return ay;
}

export interface TakvimAyi {
  ay: string;
  /** Bu ay başlayan kadrolu kişiler ve hizmetler (pozisyon adı ve adet). */
  baslayanlar: { pozisyon: Pozisyon; adet: number }[];
  yeniKisi: number;
  /** Ay sonunda bordrodaki kişi (kadrolu: tam ve yarı zamanlı). */
  kadro: number;
  gider: number;
}

/** Seçeneğin 2027 işe alım takvimi: ay ay başlayanlar, kadro ve toplam gider. */
export function takvim2027(s: SecenekId): TakvimAyi[] {
  return AYLAR_2027.map((ay, i) => {
    const baslayanlar: TakvimAyi['baslayanlar'] = [];
    let kadro = 0;
    let gider = 0;
    for (const p of POZISYONLAR) {
      const o = p.secenekler[s];
      gider += aylikGider(p, s)[i];
      if (!o.kisi) continue;
      const bu = o.iseAlim.filter((a) => a === ay).length;
      if (bu) baslayanlar.push({ pozisyon: p, adet: bu });
      if (!hizmet(o.bicim)) kadro += o.iseAlim.filter((a) => a <= ay).length;
    }
    const yeniKisi = baslayanlar.filter((b) => !hizmet(b.pozisyon.secenekler[s].bicim)).reduce((t, b) => t + b.adet, 0);
    return { ay, baslayanlar, yeniKisi, kadro, gider };
  });
}

export const seceneginPozisyonlari = (s: SecenekId) => POZISYONLAR.filter((p) => p.secenekler[s].kisi > 0);

const yuzdeTam = (v: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v);
/** Seçeneklerin gider ÷ gelir aralığı: “yüzde 87 ile 94’ü” biçiminde (veriden). */
function payAraligi() {
  const paylar = SECENEKLER.map((s) => SECENEK_OZETI[s].gelirPayi);
  return `yüzde ${yuzdeTam(Math.min(...paylar))} ile ${yuzdeTam(Math.max(...paylar))}’ü`;
}

/** Projenin bugünkü kararlarıyla çelişen ya da karar bekleyen noktalar (araştırma notlarından, 2026-11-05). */
export const DIKKAT: { baslik: string; metin: string }[] = [
  {
    baslik: 'Kadro gideri gelirin büyük kısmını tüketir',
    metin: `Üç seçenekte de 2027 kadro ve hizmet gideri, dayandığı senaryonun 2027 abonelik gelirinin ${payAraligi()} arasındadır. Reklam, prim, ofis ve yazılım araçları eklenince 2027 zarar yılıdır. Parametrelerde yatırım girişi 0 TL’dir. Bu açığı kapatacak kaynak henüz tanımlı değildir.`,
  },
  {
    baslik: 'Saha personeli sayısı iki planda farklı',
    metin: 'Gelir planı 2027’de ikinci ve üçüncü saha personelini daha geç varsayar. İstihdam takvimi ise Aralık 2026’da 3 saha personeli öngörür. Bu yüzden takvimdeki saha kapasitesi 2027’nin ilk yarısında gelir planına tam yansımaz.',
  },
  {
    baslik: 'Güçlü seçenek 50 çalışan eşiğini aşar',
    metin: 'Bu eşikte VERBİS (Veri Sorumluları Sicil Bilgi Sistemi) kaydı, yüzde 3 engelli çalışan yükümlülüğü ve iş sağlığı ve güvenliği kurulu gündeme gelir. Hukuk ve uyum uzmanı bu yüzden yalnız güçlü seçenektedir.',
  },
  {
    baslik: 'İhracat ve bağımsız temsilciler kadroda yok',
    metin: 'İhracat altyapısı hazır olmadığı için dış ticaret rolü eklenmedi. Bağımsız satış temsilcileri maaş almaz ve hizmet faturası keser. Bu yüzden kişi sayısına ve maliyete dahil edilmediler.',
  },
  {
    baslik: 'Segika gideri ayrılmalı',
    metin: 'Segika masa başı ve SGK danışmanı Segika’ya aittir. İki şirket ayrı tüzel kişilerdir. Bu planda gider istoc.com toplamına yazıldı. Maliyet paylaşımı işveren kararına bağlıdır.',
  },
];

/** Seçenek kararından önce yanıtlanması gereken sorular. */
export const ACIK_SORULAR: string[] = [
  '2027 için resmi gelir ve aktif satıcı hedefi hangi senaryodur?',
  'Yatırım girişinin tutarı ve tarihi nedir?',
  'Sepet, sipariş ve ödeme akışı 2027’de açılacak mı? Ek geliştirici, test uzmanı ve güvenlik testi bu karara bağlıdır.',
  'Mevcut yazılım ekibinin gerçek ücretleri nedir? Plan bu ekip için tahmini piyasa ücreti kullanır.',
  'Bugünkü DevOps ve altyapı hizmetinin bedeli nedir? Ekonomik ve medyan seçenekte bu bedel bilinmediği için toplama eklenmedi.',
  'Satış ekip lideri mevcut saha personelinden mi seçilecek? Seçilirse yeni kişi yerine liderlik farkı ödenir.',
  '2027 asgari ücreti Aralık 2026’da açıklanınca bütün maaşlar yeniden hesaplanmalıdır.',
];
