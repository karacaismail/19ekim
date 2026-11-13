import fiyatVerisi from './butce2027.json' with { type: 'json' };
import { DEFAULT_PARAMS } from './params';
import { AYLAR_2027, POZISYONLAR, SECENEK_OZETI, aylikGider, type Pozisyon, type SecenekId } from './istihdamV2';
import type { OpexModel } from './opex';

/**
 * 2027 bütçesi: OPEX ve CAPEX (kullanıcı kararı 2026-11-05). Taban, Google Sheets gider tablosundaki 2027 planıdır ve
 * sayfa açılırken okunur (tutarlar repoya yazılmaz). Üstüne İstihdam takvimi v2'nin seçili seçeneğindeki yeni kadro,
 * kişi başı işletme giderleri, pazarlama ve etkinlik giderleri, ofis büyümesi ve yatırım harcamaları eklenir.
 * Birim fiyatlar `butce2027.json` içindedir (kaynaklı, 2027 = 2026 × 1,2973). Yatırım kalemleri KDV hariç yazılır:
 * KDV'nin indirilebildiği varsayılır. Dolar fiyatlı lisans Sheets'teki gibi sabit kurla çevrilir (kur artışı 0).
 */

export interface FiyatKaynagi {
  ad: string;
  url: string;
  tarih: string;
}
export interface Fiyat {
  id: string;
  tur: 'capex' | 'opex';
  ad: string;
  birim: string;
  fiyat2026: number;
  fiyat2027: number;
  kdv: 'dahil' | 'hariç' | 'bilinmiyor';
  dayanak: string;
  kaynaklar: FiyatKaynagi[];
  tahmin: boolean;
}
interface FiyatDosyasi {
  tarih: string;
  parametreler: { id: string; deger: number }[];
  kalemler: Fiyat[];
}

const D = fiyatVerisi as unknown as FiyatDosyasi;
export const FIYATLAR: Fiyat[] = D.kalemler;
const parametre = (id: string, yedek: number) => D.parametreler.find((p) => p.id === id)?.deger ?? yedek;
export const KISI_BASI_M2 = parametre('ofis-alani-kisi', 10);
const MEVCUT_KIRA_2026 = parametre('mevcut-ofis-kira', 200_000);
const KDV = 0.2;
/** Dolar fiyatlı kalemler: Sheets'teki gibi kur artışı yok, 2027 tutarı 2026 tutarıdır. */
const DOLAR_FIYATLI = new Set(['microsoft-365-business-standard']);

/** 2027 birim fiyatı. Yatırımda KDV dahil fiyat KDV hariçe çevrilir. */
export function fiyat(id: string): number {
  const f = FIYATLAR.find((x) => x.id === id);
  if (!f) throw new Error(`Fiyat yok: ${id}`);
  const tutar = DOLAR_FIYATLI.has(id) ? f.fiyat2026 : f.fiyat2027;
  return f.tur === 'capex' && f.kdv === 'dahil' ? tutar / (1 + KDV) : tutar;
}

/* ---------- Taban: Sheets 2027 planı ---------- */

export interface Taban {
  /** Ay ay küme toplamları (Ocak ile Aralık 2027). */
  aylar: { teknoloji: number; insan: number; ofis: number }[];
  kategoriler: { kume: 'teknoloji' | 'insan' | 'ofis'; kategori: string; yillik: number }[];
  bordrolu: number;
  faturali: number;
  /** Sheets'teki ofis kirası, 2026 aylık (kapasite tahmini için). */
  kira2026: number | null;
}

export function tabanOf(m: OpexModel): Taban {
  const aylar = Array.from({ length: 12 }, (_, i) => {
    const a = m.aylik.find((x) => x.ay === i + 1)?.y2027;
    return { teknoloji: a?.teknoloji ?? 0, insan: a?.insan ?? 0, ofis: a?.ofis ?? 0 };
  });
  const aktif27 = (k: OpexModel['kisiler'][number]) => (k.aktif?.y2027 ?? []).some(Boolean);
  const kira = m.giderler.find((g) => g.kategori === 'Kira');
  return {
    aylar,
    kategoriler: m.kategoriler.map((k) => ({ kume: k.kume as Taban['kategoriler'][number]['kume'], kategori: k.kategori, yillik: k.aylik2027 * 12 })),
    bordrolu: m.kisiler.filter((k) => aktif27(k) && k.tur === 'Bordrolu').length,
    faturali: m.kisiler.filter((k) => aktif27(k) && k.tur !== 'Bordrolu').length,
    kira2026: kira ? kira.tl : null,
  };
}

/* ---------- Yeni kadro ---------- */

/**
 * Sheets'te zaten bulunan roller (5 Kasım 2026 incelemesi): kurucu, 4 kişilik yazılım ekibi (faturalı) ve Kasım 2026
 * dalgası (masa başı, 2 saha, Segika masa başı, asistan, dijital pazarlama). Aralık dalgası (etkinlik organizatörü,
 * 3. saha personeli) Sheets'te yoktur ve bütçeye eklenir. Sheets'teki kişi sayısı bundan farklıysa sayfa uyarır.
 */
export const SHEETSTE_OLAN = new Set(['kurucu-genel-mudur', 'yazilim-ekibi-mevcut', 'istoc-masa-basi', 'istoc-saha-ekibi', 'segika-masa-basi', 'yonetici-operasyon-asistani', 'dijital-pazarlama-uzmani']);
export const BEKLENEN_SHEETS = { bordrolu: 11, faturali: 4 };

const SAHA = new Set(['istoc-saha-ekibi', 'ucuncu-saha-personeli', 'ek-saha-personeli']);
const CAGRI_KUME = new Set(['satis', 'satici-basarisi', 'alici-talep']);
type Rol = 'saha' | 'gelistirici' | 'cagri' | 'ofis';
export function rolOf(p: Pozisyon): Rol {
  if (SAHA.has(p.id)) return 'saha';
  if (p.kume === 'urun-teknoloji' || p.id === 'teknoloji-direktoru') return 'gelistirici';
  if (CAGRI_KUME.has(p.kume) || p.id === 'musteri-hizmetleri-temsilcisi') return 'cagri';
  return 'ofis';
}
const hizmet = (b: string) => b === 'Dış hizmet' || b === 'Serbest çalışan';

/** Bütçeye eklenen kadrolu kişi: pozisyon, başlangıç ayı (0 = Ocak 2027 ya da önce), 2027 öncesi mi, yarı zamanlı mı. */
export interface YeniKisi {
  pozisyon: Pozisyon;
  ay: number;
  oncedenBasladi: boolean;
  yari: boolean;
}

export const eklenenPozisyonlar = (s: SecenekId) => POZISYONLAR.filter((p) => p.secenekler[s].kisi > 0 && !SHEETSTE_OLAN.has(p.id));

export function yeniKisiler(s: SecenekId): YeniKisi[] {
  const out: YeniKisi[] = [];
  for (const p of eklenenPozisyonlar(s)) {
    const o = p.secenekler[s];
    if (hizmet(o.bicim)) continue;
    for (const iso of o.iseAlim) out.push({ pozisyon: p, ay: iso < '2027-01' ? 0 : Number(iso.slice(5)) - 1, oncedenBasladi: iso < '2027-01', yari: o.bicim === 'Yarı zamanlı' });
  }
  return out;
}

/* ---------- Kalemler ---------- */

export type Grup = 'mevcut' | 'kadro' | 'kisi' | 'pazarlama' | 'ofis' | 'diger';
export const GRUP_ADI: Record<Grup, string> = {
  mevcut: 'Mevcut plan (Sheets)',
  kadro: 'Yeni kadro ve hizmetler',
  kisi: 'Kişi başı giderler',
  pazarlama: 'Pazarlama ve etkinlik',
  ofis: 'Ofis büyümesi',
  diger: 'Diğer',
};

export interface Kalem {
  id: string;
  grup: Grup;
  tur: 'opex' | 'capex';
  ad: string;
  /** Hesabın düz anlatımı: neyin kaç tane, hangi aydan itibaren sayıldığı. */
  kural: string;
  fiyatId?: string;
  aylik: number[];
}

export interface Ayarlar {
  /** Yemek kartı (istisna sınırında): bütün bordrolu kadro. Şirket politikası kararıdır. */
  yemek: boolean;
  /** Tamamlayıcı sağlık sigortası: bütün bordrolu kadro. Şirket politikası kararıdır. */
  saglik: boolean;
}
export const VARSAYILAN_AYAR: Ayarlar = { yemek: false, saglik: false };

/** Etkinlik sayısı (ayda): ofiste ya da İSTOÇ'ta yapılan ve dış salonda yapılan. Organizatör planı: haftada 2 ile 5. */
export const ETKINLIK: Record<SecenekId, { ic: number; dis: number }> = {
  ekonomik: { ic: 8, dis: 0 },
  medyan: { ic: 11, dis: 1 },
  guclu: { ic: 18, dis: 2 },
};
/** Öngörülemeyen gider payı: eklemelerin (taban hariç) yüzde 5'i. */
export const ONGORULEMEYEN = 0.05;

const sifir = () => AYLAR_2027.map(() => 0);
const ayAdi = (i: number) => new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(new Date(2027, i, 1));

/** Ofis kapasitesi (masa): Sheets'teki kira ÷ bölge m² kirası ÷ kişi başı m². Tahmindir, doğrulanmalıdır. */
export function ofisKapasitesi(taban: Taban | null) {
  const kira = taban?.kira2026 ?? MEVCUT_KIRA_2026;
  const m2 = kira / FIYATLAR.find((f) => f.id === 'ofis-kira-m2-mahmutbey')!.fiyat2026;
  return { m2: Math.round(m2), masa: Math.floor(m2 / KISI_BASI_M2) };
}

export interface Butce {
  kalemler: Kalem[];
  opex: number[];
  capex: number[];
  tabanVar: boolean;
  kadroAylik: number[];
  kapasite: { m2: number; masa: number };
  ekM2: number[];
  gelir2027: number;
}

export function butce(taban: Taban | null, s: SecenekId, ayar: Ayarlar = VARSAYILAN_AYAR): Butce {
  const k: Kalem[] = [];
  const ekle = (x: Omit<Kalem, 'aylik'> & { aylik?: number[] }) => {
    const kalem = { ...x, aylik: x.aylik ?? sifir() };
    k.push(kalem);
    return kalem.aylik;
  };

  // 1. Mevcut plan (Sheets): küme toplamları.
  if (taban) {
    ekle({ id: 'taban-insan', grup: 'mevcut', tur: 'opex', ad: 'Personel (Sheets)', kural: `Sheets'teki ${taban.bordrolu} bordrolu ve ${taban.faturali} faturalı kişinin 2027 maliyeti. Bordro hesabı Sheets'tedir.`, aylik: taban.aylar.map((a) => a.insan) });
    ekle({ id: 'taban-teknoloji', grup: 'mevcut', tur: 'opex', ad: 'Teknoloji (Sheets)', kural: 'Yapay zekâ araçları, sunucu ve bulut, lisanslar.', aylik: taban.aylar.map((a) => a.teknoloji) });
    ekle({ id: 'taban-ofis', grup: 'mevcut', tur: 'opex', ad: 'Ofis ve işletme (Sheets)', kural: 'Kira ve aidat, faturalar, ofis ihtiyaçları. Kira 2027 artışı Sheets parametresindedir.', aylik: taban.aylar.map((a) => a.ofis) });
  }

  // 2. Yeni kadro ve hizmetler (İstihdam v2).
  const kisiler = yeniKisiler(s);
  const kadro = sifir();
  const hizmetler = sifir();
  for (const p of eklenenPozisyonlar(s)) {
    const a = aylikGider(p, s);
    const hedef = hizmet(p.secenekler[s].bicim) ? hizmetler : kadro;
    a.forEach((v, i) => (hedef[i] += v));
  }
  ekle({ id: 'kadro-maas', grup: 'kadro', tur: 'opex', ad: 'Yeni kadro maaş maliyeti', kural: `${kisiler.length} kişi. İstihdam takvimi v2'nin seçili seçeneğindeki yeni pozisyonlar ile Sheets'te olmayan Aralık dalgası. Maliyet net maaşın 2 katı, işe alım ayından itibaren.`, aylik: kadro });
  ekle({ id: 'kadro-hizmet', grup: 'kadro', tur: 'opex', ad: 'Dış hizmet ve serbest çalışanlar', kural: 'Mali müşavir, avukat, KVKK ve SGK danışmanı, iş sağlığı ve güvenliği, eğitmen, video ve benzeri. Aylık fatura bedeli.', aylik: hizmetler });

  // 3. Kişi başı giderler (yeni kadro, işe alım ayından itibaren).
  const aktif = (filtre: (y: YeniKisi) => boolean, agirlik = (y: YeniKisi) => (y.yari ? 0.5 : 1)) =>
    AYLAR_2027.map((_, i) => kisiler.filter((y) => filtre(y) && y.ay <= i).reduce((t, y) => t + agirlik(y), 0));
  const tumu = aktif(() => true, () => 1);
  const hatli = aktif((y) => ['saha', 'cagri'].includes(rolOf(y.pozisyon)) || ['Yönetici', 'Yönetim'].includes(y.pozisyon.seviye), () => 1);
  const saha = aktif((y) => rolOf(y.pozisyon) === 'saha', () => 1);
  ekle({ id: 'lisans', grup: 'kisi', tur: 'opex', ad: 'Microsoft 365 lisansı', kural: 'Her yeni kişiye 1 lisans. Dolar fiyatı sabit kurla.', fiyatId: 'microsoft-365-business-standard', aylik: tumu.map((n) => n * fiyat('microsoft-365-business-standard')) });
  ekle({ id: 'hat', grup: 'kisi', tur: 'opex', ad: 'Kurumsal mobil hat', kural: 'Saha, çağrı ve satış ekibi ile yöneticilere 1 hat.', fiyatId: 'mobil-hat-kurumsal-20gb', aylik: hatli.map((n) => n * fiyat('mobil-hat-kurumsal-20gb')) });
  ekle({ id: 'ulasim', grup: 'kisi', tur: 'opex', ad: 'Saha ulaşımı (İstanbulkart)', kural: 'Yeni saha personeline aylık abonman. Saha işi İSTOÇ içinde yürüdüğü için araç kiralanmaz.', fiyatId: 'istanbulkart-abonman', aylik: saha.map((n) => n * fiyat('istanbulkart-abonman')) });
  ekle({ id: 'egitim', grup: 'kisi', tur: 'opex', ad: 'Eğitim bütçesi', kural: 'Yeni kişi başına yıllık bütçenin aylık payı.', fiyatId: 'egitim-butcesi-kisi-yil', aylik: tumu.map((n) => (n * fiyat('egitim-butcesi-kisi-yil')) / 12) });
  const ilan = sifir();
  for (const y of kisiler) if (!y.oncedenBasladi) ilan[y.ay] += fiyat('kariyer-net-ilan');
  ekle({ id: 'ilan', grup: 'kisi', tur: 'opex', ad: 'İşe alım ilanı', kural: '2027’de işe alınan her kişi için 1 ilan, işe alım ayında.', fiyatId: 'kariyer-net-ilan', aylik: ilan });
  const yeniBordrolu = aktif(() => true);
  const bordroluSayisi = AYLAR_2027.map((_, i) => (taban?.bordrolu ?? 0) + yeniBordrolu[i]);
  if (ayar.yemek) ekle({ id: 'yemek', grup: 'kisi', tur: 'opex', ad: 'Yemek kartı', kural: 'Bütün bordrolu kadroya, günlük istisna tutarı × 22 iş günü. Yarı zamanlı yarım.', fiyatId: 'yemek-karti-aylik', aylik: bordroluSayisi.map((n) => n * fiyat('yemek-karti-aylik')) });
  if (ayar.saglik) ekle({ id: 'saglik', grup: 'kisi', tur: 'opex', ad: 'Tamamlayıcı sağlık sigortası', kural: 'Bütün bordrolu kadroya, yıllık primin aylık payı.', fiyatId: 'tamamlayici-saglik-sigortasi', aylik: bordroluSayisi.map((n) => (n * fiyat('tamamlayici-saglik-sigortasi')) / 12) });

  // 4. Pazarlama ve etkinlik.
  const meta = (DEFAULT_PARAMS.metaWeekly * 52) / 12;
  ekle({ id: 'meta', grup: 'pazarlama', tur: 'opex', ad: 'Meta reklam bütçesi', kural: `Parametrelerdeki haftalık ${new Intl.NumberFormat('tr-TR').format(DEFAULT_PARAMS.metaWeekly)} ₺, yılda 52 hafta. Sheets planında yoktur.`, aylik: sifir().map(() => meta) });
  const e = ETKINLIK[s];
  const ikram = fiyat('etkinlik-coffee-break-50');
  ekle({ id: 'etkinlik-ikram', grup: 'pazarlama', tur: 'opex', ad: 'Etkinlik ikramı', kural: `Ayda ${e.ic + e.dis} satıcı eğitimi, her birinde 50 kişilik coffee break paketi.`, fiyatId: 'etkinlik-coffee-break-50', aylik: sifir().map(() => (e.ic + e.dis) * ikram) });
  if (e.dis) ekle({ id: 'etkinlik-salon', grup: 'pazarlama', tur: 'opex', ad: 'Dış salon kirası', kural: `Ayda ${e.dis} etkinlik dış salonda, yarım gün. Diğerleri ofiste ya da İSTOÇ'ta.`, fiyatId: 'etkinlik-salon-yarim-gun', aylik: sifir().map(() => e.dis * fiyat('etkinlik-salon-yarim-gun')) });
  const ekipman = sifir();
  ekipman[0] = fiyat('etkinlik-tv-65') + fiyat('etkinlik-ses-sistemi') + fiyat('etkinlik-katlanir-sandalye-50') + 2 * fiyat('roll-up-banner');
  ekle({ id: 'etkinlik-ekipman', grup: 'pazarlama', tur: 'capex', ad: 'Etkinlik ekipmanı', kural: 'Ocak’ta bir kez alınır. 65 inç ekran, ses sistemi ve 2 mikrofon alınır. 50 katlanır sandalye ve 2 roll-up alınır.', aylik: ekipman });
  const video = sifir();
  video[0] = fiyat('video-gimbal') + fiyat('video-isik-seti') + fiyat('video-yaka-mikrofonu') + (s === 'ekonomik' ? 0 : fiyat('video-kamera'));
  ekle({ id: 'video-ekipman', grup: 'pazarlama', tur: 'capex', ad: 'Video çekim ekipmanı', kural: s === 'ekonomik' ? 'Ocak’ta bir kez alınır: telefon gimbalı, ışık seti ve yaka mikrofonu. Çekim telefonla yapılır.' : 'Ocak’ta bir kez alınır: aynasız fotoğraf makinesi, telefon gimbalı, ışık seti, yaka mikrofonu.', aylik: video });

  // 5. Ekipman: yeni kişiye işe alım ayında (2027 öncesi başlayanlar 2026 bütçesindedir).
  const pc = sifir();
  const masa = sifir();
  const tel = sifir();
  for (const y of kisiler) {
    if (y.oncedenBasladi) continue;
    const rol = rolOf(y.pozisyon);
    if (rol !== 'saha') {
      pc[y.ay] += fiyat(rol === 'gelistirici' ? 'laptop-gelistirici-air' : 'laptop-ofis') + fiyat('monitor-27-ekonomik') + fiyat('klavye-mouse-seti') + (rol === 'cagri' ? fiyat('kulaklik-cagri') : 0);
      masa[y.ay] += fiyat('calisma-masasi') + fiyat('ofis-koltugu-ergonomik');
    }
    if (rol === 'saha' || rol === 'cagri' || ['Yönetici', 'Yönetim'].includes(y.pozisyon.seviye)) tel[y.ay] += fiyat('telefon-android-orta');
  }
  ekle({ id: 'bilgisayar', grup: 'kisi', tur: 'capex', ad: 'Bilgisayar, monitör ve aksesuar', kural: 'Masa başı yeni kişiye iş dizüstü bilgisayarı, geliştirici ve tasarımcıya MacBook Air. Monitör, klavye ve fare, çağrı ekibine kulaklık. Saha personeline bilgisayar alınmaz.', aylik: pc });
  ekle({ id: 'mobilya', grup: 'kisi', tur: 'capex', ad: 'Masa ve koltuk', kural: 'Masa başı yeni kişiye çalışma masası ve ergonomik koltuk.', aylik: masa });
  ekle({ id: 'telefon', grup: 'kisi', tur: 'capex', ad: 'Cep telefonu', kural: 'Saha, çağrı ve satış ekibi ile yöneticilere orta seviye Android telefon.', fiyatId: 'telefon-android-orta', aylik: tel });

  // 6. Ofis büyümesi: kişi sayısı kapasiteyi aşarsa ek alan kiralanır ve hazırlanır. Kiralanan alan yıl içinde küçülmez.
  const kapasite = ofisKapasitesi(taban);
  const kisiSayisi = AYLAR_2027.map((_, i) => (taban ? taban.bordrolu + taban.faturali : BEKLENEN_SHEETS.bordrolu + BEKLENEN_SHEETS.faturali) + tumu[i]);
  const ekM2 = sifir();
  let enCok = 0;
  kisiSayisi.forEach((n, i) => {
    const gerek = Math.max(0, n - kapasite.masa);
    enCok = Math.max(enCok, Math.ceil((gerek * KISI_BASI_M2) / 50) * 50);
    ekM2[i] = enCok;
  });
  const kira = ekM2.map((m2) => m2 * fiyat('ofis-kira-m2-mahmutbey'));
  const hazirlik = sifir();
  ekM2.forEach((m2, i) => {
    const onceki = i ? ekM2[i - 1] : 0;
    const artis = m2 - onceki;
    if (artis <= 0) return;
    hazirlik[i] += artis * fiyat('ofis-tadilat-m2') + Math.ceil(artis / 100) * fiyat('wifi-erisim-noktasi');
    if (!onceki) hazirlik[i] += fiyat('switch-24-port-poe') + fiyat('toplanti-odasi-seti');
  });
  const ilkAy = ekM2.findIndex((m2) => m2 > 0);
  const ofisNotu = ilkAy < 0 ? `Kişi sayısı tahmini kapasiteyi (${kapasite.masa} masa) aşmıyor.` : `${ayAdi(ilkAy)} ayında kişi sayısı tahmini kapasiteyi (${kapasite.masa} masa) aşar. Kişi başı ${KISI_BASI_M2} m², 50 m²'lik bloklarla.`;
  ekle({ id: 'ofis-kira', grup: 'ofis', tur: 'opex', ad: 'Ek ofis alanı kirası', kural: `${ofisNotu} Yıl sonunda ${ekM2[11]} m² ek alan.`, fiyatId: 'ofis-kira-m2-mahmutbey', aylik: kira });
  ekle({ id: 'ofis-hazirlik', grup: 'ofis', tur: 'capex', ad: 'Ek alan tadilatı ve ağ', kural: 'Ek m² başına temel tadilat, her 100 m² için 1 Wi-Fi erişim noktası. İlk genişlemede 1 switch ve 1 toplantı odası takımı.', fiyatId: 'ofis-tadilat-m2', aylik: hazirlik });

  // 7. Diğer.
  const sigorta = sifir();
  sigorta[0] = fiyat('isyeri-paket-sigortasi');
  ekle({ id: 'isyeri-sigorta', grup: 'diger', tur: 'opex', ad: 'İşyeri paket sigortası', kural: 'Ocak’ta yıllık prim. Sheets planında yoktur.', fiyatId: 'isyeri-paket-sigortasi', aylik: sigorta });
  const marka = sifir();
  marka[1] = fiyat('marka-tescil-3-sinif');
  ekle({ id: 'marka', grup: 'diger', tur: 'capex', ad: 'Marka tescili', kural: 'Şubat’ta 1 marka, 3 sınıf. Tescil zaten yapıldıysa çıkarılır.', fiyatId: 'marka-tescil-3-sinif', aylik: marka });
  const ekler = k.filter((x) => x.grup !== 'mevcut');
  const pay = AYLAR_2027.map((_, i) => ekler.reduce((t, x) => t + x.aylik[i], 0) * ONGORULEMEYEN);
  ekle({ id: 'ongorulemeyen', grup: 'diger', tur: 'opex', ad: 'Öngörülemeyen giderler', kural: `Taban dışındaki eklemelerin yüzde ${ONGORULEMEYEN * 100}'i.`, aylik: pay });

  const topla = (tur: Kalem['tur']) => AYLAR_2027.map((_, i) => k.filter((x) => x.tur === tur).reduce((t, x) => t + x.aylik[i], 0));
  return { kalemler: k, opex: topla('opex'), capex: topla('capex'), tabanVar: !!taban, kadroAylik: kisiSayisi, kapasite, ekM2, gelir2027: SECENEK_OZETI[s].gelirHedefi2027 };
}

export const toplam = (a: number[]) => a.reduce((t, v) => t + v, 0);
