/**
 * Affilate — Segika satış ortaklığı simülasyonu hesap motoru (docs/affilate.md §4–§9; kullanıcı kararı 2026-10-28).
 *
 * DOM, React, depolama ve ağdan bağımsız saf hesap. Para en küçük birimde tam sayıdır (kuruş / cent), oran baz puandır
 * (%15 = 1500), tarihler ISO gündür. Aynı girdi ve aynı olaylar aynı sonucu üretir (§8.2/1). Bütün oranlar, süreler,
 * fiyatlar ve taksit sayıları girdidir; hiçbir yüzde iş kuralı olarak gömülü değildir (kullanıcı kararı).
 *
 * Sözlük (§4): fatura tutarı ≠ tahsilat ≠ komisyona esas tutar ≠ planlanan toplam ≠ kazanılan hakediş ≠ ödeme planı ≠
 * ödeme hareketi. Oran, ödemenin geldiği aya değil ilgili hizmet dönemine bağlıdır (§7.2). Kuruş dağıtımı kümülatif
 * yuvarlamayla yapılır (§8.1); parçalı tahsilat toplamı değiştirmez (§7.1).
 */

export type Kurus = number;
export type Bp = number;
export type ParaBirimi = 'TRY' | 'EUR';
export type OrtakId = 'ayse' | 'satis' | 'cozum';
export type Politika = 'tahsilatta' | 'hizmet-ayi' | 'tahsilatta-taksit';
export type Kapsam = 'ilk-fatura' | 'sureli';
export type DestekDurumu = 'aktif' | 'saglanmadi' | 'belirsiz';

export interface Donem {
  /** Dönemin süresi (ay, pozitif tam sayı). */
  ay: number;
  /** Dönemin komisyon oranı (baz puan; %0 geçerli girdidir). */
  oranBp: Bp;
}

export interface OrtakKurali {
  id: OrtakId;
  ad: string;
  /** İlk fatura: yalnız ilk uygun faturanın tahsil edilen bazına bir kez; süreli: oran-dönem matrisi (§5.2). */
  kapsam: Kapsam;
  /** Ardışık dönemler (çakışmaz); ilk fatura kapsamında yalnız ilk dönemin oranı kullanılır. */
  donemler: Donem[];
  /** Son dönemden sonraki oran (açık girdi; son satır kendiliğinden tekrar etmez). */
  sonrakiOranBp: Bp;
  /** Kazanma ve ödeme politikası (§5.3). */
  politika: Politika;
  /** “Tahsilatta kazan, taksitlerle öde” için taksit sayısı (pozitif tam sayı). */
  taksit: number;
  /** Ortağa ödeme gecikmesi (ay; negatif olmayan tam sayı). */
  gecikmeAy: number;
  destekSorumlusu: 'segika' | 'ortak';
  /** Destek sağlanmayan ay hak kazandırmaz; belirsiz ay bekletilir (`beklet`) ya da kazandırmaz. */
  destekIhlali: 'kazandirmaz' | 'beklet';
  /** Ortağın müşteri başına aylık destek maliyeti; null = girilmedi (açıkça 0 ile ayrıdır). */
  destekMaliyeti: Kurus | null;
}

export interface Fiyat {
  /** Bir anda tek fiyat kaynağı etkindir (§5.1). */
  kaynak: 'paket' | 'kat' | 'indirim' | 'indirimsiz';
  /** Aylık fiyat `P`. */
  aylik: Kurus;
  /** Paket fiyatının karşılığı olan aylık ücret sayısı `K`. */
  kat: number;
  /** Paketin hizmet süresi `H` (ay). */
  hizmetAy: number;
  /** İndirim oranı `d` (baz puan). */
  indirimBp: Bp;
  /** Doğrudan girilen paket tutarı `A`. */
  paket: Kurus;
  paraBirimi: ParaBirimi;
}

export interface MusteriGrubu {
  id: string;
  ad: string;
  /** Aynı koşulları paylaşan müşteri adedi (toplam = kişi başına sonuç × adet). */
  adet: number;
  /** Abonelik başlangıcı (ISO gün); komisyon yaşı bu tarihten sayılır. */
  baslangic: string;
  odeme: 'aylik' | 'paket';
  ortak: OrtakId;
  /** Bu hizmet ayından itibaren hizmet yok (iptal); null = sürer. */
  iptalHizmetAyi: number | null;
  /** Ortak destek sorumlusuysa kayıtsız ayın durumu (görünür varsayım; seçilmeyen başarı varsayılmaz). */
  destekVarsayilan: DestekDurumu;
  paraBirimi?: ParaBirimi;
}

export interface Fatura {
  id: string;
  musteri: string;
  tarih: string;
  hizmetBaslangic: string;
  hizmetAy: number;
  tutar: Kurus;
  /** Komisyon dışında tutulan fatura kalemleri toplamı `X`. */
  haric: Kurus;
}

export interface Tahsilat {
  id: string;
  faturaId: string;
  tarih: string;
  tutar: Kurus;
}

export interface Iade {
  id: string;
  faturaId: string;
  tarih: string;
  tutar: Kurus;
}

export interface DestekKaydi {
  musteri: string;
  hizmetAyi: number;
  durum: DestekDurumu;
}

export interface Senaryo {
  /** Simülasyon ufku (ay). */
  ufukAy: number;
  fiyat: Fiyat;
  ortaklar: Record<OrtakId, OrtakKurali>;
  musteriler: MusteriGrubu[];
  /** Verilmezse müşteri grubu ve fiyattan üretilir. */
  faturalar?: Fatura[];
  /** Verilmezse her fatura, fatura tarihinde tamamıyla tahsil edilmiş sayılır. */
  tahsilatlar?: Tahsilat[];
  iadeler: Iade[];
  destek: DestekKaydi[];
}

export type HareketTuru = 'fatura' | 'tahsilat' | 'iade' | 'hakedis' | 'duzeltme' | 'bekleyen' | 'odeme';

export interface Hareket {
  id: string;
  tarih: string;
  /** Takvim ayı `YYYY-MM`. */
  ay: string;
  musteri: string;
  ortak: OrtakId;
  paraBirimi: ParaBirimi;
  faturaId?: string;
  /** Müşterinin başlangıcından sayılan hizmet ayı (0 tabanlı). */
  hizmetAyi?: number;
  tur: HareketTuru;
  tutar: Kurus;
  aciklama: string;
}

export interface OrtakOzet {
  ortak: OrtakId;
  paraBirimi: ParaBirimi;
  /** Bütün ödeme ve hizmet koşulları gerçekleşirse oluşacak toplam (ufuk içindeki faturalar). */
  planlanan: Kurus;
  kazanilan: Kurus;
  duzeltme: Kurus;
  /** Net hakediş = kazanılan + düzeltmeler (§8.2/5). */
  netHakedis: Kurus;
  /** Destek sonucu bekleyen tutar; kazanılmış borç değildir. */
  bekleyen: Kurus;
  odenen: Kurus;
  /** Ödenecek = max(net bakiye, 0); geri alınacak = max(−net bakiye, 0) (§8.2/7). */
  odenecek: Kurus;
  geriAlinacak: Kurus;
  /** Gelecek tahsilat / hizmet koşullarına bağlı tutar; ödenecek bakiyeye eklenmez (§8.2/8). */
  kosullu: Kurus;
  destekMaliyeti: Kurus | null;
  destekSonrasi: Kurus | null;
}

export interface MusteriOzet {
  musteri: string;
  ortak: OrtakId;
  paraBirimi: ParaBirimi;
  adet: number;
  fatura: Kurus;
  tahsilat: Kurus;
  iade: Kurus;
  /** Tahsil edilmiş komisyon bazı: Σ (F − X) × Q / F. */
  komisyonBazi: Kurus;
  planlanan: Kurus;
  /** Bugünkü net tahsilata bağlı toplam komisyon (koşulsuz; uygun olmayan aylar hariç). */
  tahsilataBagli: Kurus;
  netHakedis: Kurus;
  bekleyen: Kurus;
  odenen: Kurus;
  kosullu: Kurus;
}

export interface AyOzeti {
  ay: string;
  fatura: Kurus;
  tahsilat: Kurus;
  iade: Kurus;
  hakedis: Kurus;
  duzeltme: Kurus;
  bekleyen: Kurus;
  odeme: Kurus;
  /** Ay sonunda ortaklara net bakiye (net hakediş − ödenen; negatifse geri alınacak). */
  bakiye: Kurus;
}

export interface SegikaOzet {
  paraBirimi: ParaBirimi;
  tahsilat: Kurus;
  iade: Kurus;
  netTahsilat: Kurus;
  /** İade ve hariç kalemler sonrası komisyon bazı. */
  komisyonBazi: Kurus;
  netHakedis: Kurus;
  /** Komisyon sonrası tahsilat = net komisyon bazı − net hakediş (§8.2/9). */
  komisyonSonrasi: Kurus;
  odeme: Kurus;
  /** Komisyon ödemeleri sonrası nakit = net müşteri tahsilatı − ortak ödemeleri (§8.2/10). */
  nakit: Kurus;
  bekleyen: Kurus;
  kosullu: Kurus;
}

export interface Sonuc {
  hatalar: string[];
  aylar: AyOzeti[];
  hareketler: Hareket[];
  ortaklar: OrtakOzet[];
  musteriler: MusteriOzet[];
  segika: SegikaOzet[];
  /** Ufuktan sonra: ödenecek bakiye ve gelecek koşullara bağlı tutar (para birimine göre) (§8.2/12). */
  sonrasi: { paraBirimi: ParaBirimi; odenecek: Kurus; kosullu: Kurus }[];
}

/* ---------- Yardımcılar ---------- */

const utc = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const sonGun = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();

/** Ay ekleme: ilk tarihin gününe göre; ay kısa ise o ayın son günü (31 Ocak → 28 Şubat → 31 Mart; kalıcı kayma yok). */
export function ayEkle(tarih: string, ay: number): string {
  const y = Number(tarih.slice(0, 4));
  const m0 = Number(tarih.slice(5, 7)) - 1;
  const d = Number(tarih.slice(8, 10));
  const toplam = y * 12 + m0 + ay;
  const yy = Math.floor(toplam / 12);
  const mm = toplam - yy * 12;
  return iso(Date.UTC(yy, mm, Math.min(d, sonGun(yy, mm))));
}

export const ayAnahtari = (tarih: string) => tarih.slice(0, 7);
export const ayIndeksi = (ay: string) => Number(ay.slice(0, 4)) * 12 + Number(ay.slice(5, 7)) - 1;
/** Takvim ayının son günü (ISO). */
export const aySonu = (ay: string) => `${ay}-${String(sonGun(Number(ay.slice(0, 4)), Number(ay.slice(5, 7)) - 1)).padStart(2, '0')}`;
export const gecerliTarih = (t: unknown): t is string =>
  typeof t === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(utc(t)) && iso(utc(t)) === t;

/** Yarım yukarı yuvarlama (tam sayı bölme; negatifte simetrik). */
export function bolYuvarla(pay: bigint, payda: bigint): bigint {
  if (payda === 0n) return 0n;
  const neg = pay < 0n !== payda < 0n;
  const a = pay < 0n ? -pay : pay;
  const b = payda < 0n ? -payda : payda;
  const q = (2n * a + b) / (2n * b);
  return neg ? -q : q;
}

/** Yüzde (iki ondalığa kadar) → baz puan. `15,25` → 1525. */
export const yuzdeToBp = (yuzde: number): Bp => Math.round(yuzde * 100);
export const bpToYuzde = (bp: Bp) => bp / 100;
/** TL / € ondalık → kuruş. */
export const kurus = (tutar: number): Kurus => Math.round(tutar * 100);
export const kurusFormat = (k: Kurus, pb: ParaBirimi = 'TRY') =>
  `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(k / 100)} ${pb === 'TRY' ? '₺' : '€'}`;

/**
 * Taksit dağıtımı (§8.1): kümülatif(k) = roundHalfUp(C × k / N); taksit(k) = kümülatif(k) − kümülatif(k − 1). Toplam
 * değişmez; son taksit saklanmaz. 100 TL / 12 → 8 × 8,33 + 4 × 8,34.
 */
export function taksitDagit(toplam: Kurus, n: number): Kurus[] {
  if (!Number.isInteger(n) || n <= 0) return [];
  const C = BigInt(Math.trunc(toplam));
  const N = BigInt(n);
  const out: Kurus[] = [];
  let onceki = 0n;
  for (let k = 1n; k <= N; k++) {
    const kum = bolYuvarla(C * k, N);
    out.push(Number(kum - onceki));
    onceki = kum;
  }
  return out;
}

/** Paket fiyatı (§5.1): etkin kaynağa göre; diğer girdiler silinmez. */
export function paketFiyati(f: Fiyat): Kurus {
  switch (f.kaynak) {
    case 'paket':
      return f.paket;
    case 'kat':
      return Math.round(f.aylik * f.kat);
    case 'indirim':
      return Number(bolYuvarla(BigInt(f.aylik) * BigInt(f.hizmetAy) * BigInt(10_000 - f.indirimBp), 10_000n));
    case 'indirimsiz':
      return f.aylik * f.hizmetAy;
  }
}

/** Paket fiyatının liste toplamına (P × H) göre indirimi (baz puan; türetilen sonuç). */
export function paketIndirimiBp(f: Fiyat): Bp {
  const liste = f.aylik * f.hizmetAy;
  if (liste <= 0) return 0;
  return Number(bolYuvarla(BigInt(liste - paketFiyati(f)) * 10_000n, BigInt(liste)));
}

/** Paket fiyatının aylık eşdeğeri (kuruş; yalnız gösterim, komisyon değildir). */
export const aylikEsdeger = (f: Fiyat): Kurus => (f.hizmetAy > 0 ? Number(bolYuvarla(BigInt(paketFiyati(f)), BigInt(f.hizmetAy))) : 0);

/** Hizmet ayının komisyon dönemi ve oranı: ardışık dönemler, sonrası açık girdi. */
export function donemOrani(kural: OrtakKurali, hizmetAyi: number): { donem: number; oranBp: Bp } {
  let bas = 0;
  for (let i = 0; i < kural.donemler.length; i++) {
    const d = kural.donemler[i];
    if (hizmetAyi < bas + d.ay) return { donem: i, oranBp: d.oranBp };
    bas += d.ay;
  }
  return { donem: kural.donemler.length, oranBp: kural.sonrakiOranBp };
}

/* ---------- Doğrulama (§6, M37) ---------- */

export function dogrula(s: Senaryo): string[] {
  const h: string[] = [];
  const tam = (v: unknown) => typeof v === 'number' && Number.isInteger(v);
  const para = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0;
  const oran = (v: unknown) => tam(v) && (v as number) >= 0 && (v as number) <= 10_000;
  if (!tam(s.ufukAy) || s.ufukAy <= 0 || s.ufukAy > 120) h.push('Simülasyon ufku 1–120 ay olmalı.');
  const f = s.fiyat;
  if (!para(f.aylik)) h.push('Aylık fiyat negatif olamaz ve sayı olmalı.');
  if (!para(f.paket)) h.push('Paket fiyatı negatif olamaz ve sayı olmalı.');
  if (!(typeof f.kat === 'number' && Number.isFinite(f.kat) && f.kat >= 0)) h.push('Fiyat katsayısı negatif olamaz ve sayı olmalı.');
  if (!tam(f.hizmetAy) || f.hizmetAy <= 0) h.push('Paket hizmet süresi pozitif tam ay olmalı.');
  if (!oran(f.indirimBp)) h.push('İndirim %0–100 arası olmalı.');
  for (const k of Object.values(s.ortaklar)) {
    if (!k.donemler.length) h.push(`${k.ad}: en az bir dönem gerekli.`);
    for (const d of k.donemler) {
      if (!tam(d.ay) || d.ay <= 0) h.push(`${k.ad}: dönem süresi pozitif tam ay olmalı.`);
      if (!oran(d.oranBp)) h.push(`${k.ad}: komisyon oranı %0–100 arası olmalı.`);
    }
    if (!oran(k.sonrakiOranBp)) h.push(`${k.ad}: sonraki dönem oranı %0–100 arası olmalı.`);
    if (!tam(k.taksit) || k.taksit <= 0) h.push(`${k.ad}: taksit sayısı pozitif tam sayı olmalı.`);
    if (!tam(k.gecikmeAy) || k.gecikmeAy < 0) h.push(`${k.ad}: ödeme gecikmesi negatif olmayan tam ay olmalı.`);
    if (k.destekMaliyeti !== null && !para(k.destekMaliyeti)) h.push(`${k.ad}: destek maliyeti negatif olamaz.`);
  }
  if (!s.musteriler.length) h.push('En az bir müşteri grubu gerekli.');
  if (s.musteriler.length > 100) h.push('En çok 100 müşteri grubu (teknik sınır).');
  const idler = new Set<string>();
  for (const m of s.musteriler) {
    if (idler.has(m.id)) h.push(`Müşteri grubu kimliği yineleniyor: ${m.id}.`);
    idler.add(m.id);
    if (!tam(m.adet) || m.adet <= 0) h.push(`${m.ad}: adet pozitif tam sayı olmalı.`);
    if (!gecerliTarih(m.baslangic)) h.push(`${m.ad}: başlangıç tarihi geçersiz.`);
    if (m.iptalHizmetAyi !== null && (!tam(m.iptalHizmetAyi) || m.iptalHizmetAyi < 0)) h.push(`${m.ad}: iptal ayı negatif olamaz.`);
  }
  const faturaTutar = new Map<string, Kurus>();
  for (const fa of s.faturalar ?? []) {
    if (!para(fa.tutar) || !para(fa.haric) || fa.haric > fa.tutar) h.push(`Fatura ${fa.id}: 0 ≤ hariç kalem ≤ tutar olmalı.`);
    if (!gecerliTarih(fa.tarih) || !gecerliTarih(fa.hizmetBaslangic)) h.push(`Fatura ${fa.id}: tarih geçersiz.`);
    if (!tam(fa.hizmetAy) || fa.hizmetAy <= 0) h.push(`Fatura ${fa.id}: hizmet süresi pozitif tam ay olmalı.`);
    faturaTutar.set(fa.id, fa.tutar);
  }
  const tahsilToplam = new Map<string, Kurus>();
  const gorulen = new Set<string>();
  for (const t of s.tahsilatlar ?? []) {
    if (!para(t.tutar) || !gecerliTarih(t.tarih)) h.push(`Tahsilat ${t.id}: tutar ve tarih geçerli olmalı.`);
    if (gorulen.has(t.id)) continue; // aynı olay iki kez sayılmaz (§7.6)
    gorulen.add(t.id);
    tahsilToplam.set(t.faturaId, (tahsilToplam.get(t.faturaId) ?? 0) + t.tutar);
  }
  for (const [fid, toplam] of tahsilToplam) {
    const F = faturaTutar.get(fid);
    if (F !== undefined && toplam > F) h.push(`Fatura ${fid}: toplam tahsilat faturayı aşıyor (fazla tahsilat bu sürümde hata).`);
  }
  for (const i of s.iadeler) if (!para(i.tutar) || !gecerliTarih(i.tarih)) h.push(`İade ${i.id}: tutar ve tarih geçerli olmalı.`);
  return h;
}

/* ---------- Fatura üretimi ---------- */

/** Müşteri grubu için kişi başına faturalar (§7.1/2): aylık → her hizmet ayı; paket → her yenileme dönemi. */
export function faturaUret(grup: MusteriGrubu, fiyat: Fiyat, ufukSon: string): Fatura[] {
  const out: Fatura[] = [];
  const son = utc(ufukSon);
  if (grup.odeme === 'aylik') {
    for (let m = 0; ; m++) {
      const t = ayEkle(grup.baslangic, m);
      if (utc(t) >= son) break;
      if (grup.iptalHizmetAyi !== null && m >= grup.iptalHizmetAyi) break;
      out.push({ id: `${grup.id}-f${m + 1}`, musteri: grup.id, tarih: t, hizmetBaslangic: t, hizmetAy: 1, tutar: fiyat.aylik, haric: 0 });
    }
  } else {
    const H = Math.max(1, fiyat.hizmetAy);
    for (let k = 0; ; k++) {
      const t = ayEkle(grup.baslangic, k * H);
      if (utc(t) >= son) break;
      if (grup.iptalHizmetAyi !== null && k * H >= grup.iptalHizmetAyi) break;
      out.push({ id: `${grup.id}-f${k + 1}`, musteri: grup.id, tarih: t, hizmetBaslangic: t, hizmetAy: H, tutar: paketFiyati(fiyat), haric: 0 });
    }
  }
  return out;
}

/* ---------- Komisyon hesabı (§7.1 açık hesap, §8.1 kümülatif dağıtım) ---------- */

/**
 * Faturanın hizmet aylarına düşen komisyon payları (kuruş), kümülatif net tahsilat `Q` ile: her ayın kesin teorik
 * komisyonu (F − X) × Q / F × oran_m / H; toplam bir kez yuvarlanır ve kümülatif farklarla aylara dağıtılır.
 */
export function faturaPaylari(fatura: Fatura, oranlar: Bp[], Q: Kurus): Kurus[] {
  const F = BigInt(fatura.tutar);
  if (F <= 0n || Q <= 0) return oranlar.map(() => 0);
  const baz = BigInt(fatura.tutar - fatura.haric);
  const q = BigInt(Math.min(Q, fatura.tutar));
  const H = BigInt(oranlar.length);
  const payda = F * H * 10_000n;
  const out: Kurus[] = [];
  let kumOran = 0n;
  let onceki = 0n;
  for (const oran of oranlar) {
    kumOran += BigInt(oran);
    const kum = bolYuvarla(baz * q * kumOran, payda);
    out.push(Number(kum - onceki));
    onceki = kum;
  }
  return out;
}

/* ---------- Motor ---------- */

interface Olay {
  tarih: string;
  /** Aynı tarihte işleme sırası (§7.2): fatura → tahsilat/iade → ay sonu. */
  sira: number;
  tur: 'fatura' | 'tahsilat' | 'iade' | 'ayson';
  faturaId: string;
  hizmetAyi?: number;
  tutar?: Kurus;
  id?: string;
}

interface FaturaDurumu {
  fatura: Fatura;
  ilk: boolean;
  oranlar: Bp[];
  /** Kümülatif net tahsilat (tahsilat − iade). */
  Q: Kurus;
  iadeVar: boolean;
  kazanilan: Kurus[];
  bekleyen: Kurus[];
  bitti: boolean[];
  /** Ay destek / iptal nedeniyle kazandırmaz; payı kalan aylara dağıtılmaz (§7.5). */
  kayip: boolean[];
}

const SIRA: Record<HareketTuru, number> = { fatura: 0, tahsilat: 1, iade: 1, bekleyen: 2, hakedis: 3, duzeltme: 3, odeme: 4 };
const ORTAKLAR: OrtakId[] = ['ayse', 'satis', 'cozum'];
const tarihSira = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function destekDurumu(s: Senaryo, grup: MusteriGrubu, kural: OrtakKurali, musteriHizmetAyi: number): DestekDurumu | 'iptal' {
  if (grup.iptalHizmetAyi !== null && musteriHizmetAyi >= grup.iptalHizmetAyi) return 'iptal';
  if (kural.destekSorumlusu !== 'ortak') return 'aktif';
  const kayit = s.destek.find((d) => d.musteri === grup.id && d.hizmetAyi === musteriHizmetAyi);
  return kayit ? kayit.durum : grup.destekVarsayilan;
}

/** Müşterinin başlangıcından itibaren faturanın hizmet ayı indeksi (0 tabanlı). */
function musteriHizmetAyi(grup: MusteriGrubu, fatura: Fatura, ayIndeks: number): number {
  return ayIndeksi(ayAnahtari(fatura.hizmetBaslangic)) - ayIndeksi(ayAnahtari(grup.baslangic)) + ayIndeks;
}

/** Zaman çizelgesi: en erken başlangıcın (müşteri ya da açık fatura) ayından ufuk kadar ay; `son` hariçtir. */
export function zamanCizelgesi(ufukAy: number, baslangiclar: string[]) {
  const baslar = [...baslangiclar].sort(tarihSira);
  const ilkAy = `${(baslar[0] ?? '2027-01-01').slice(0, 7)}-01`;
  const aylar: string[] = [];
  for (let i = 0; i < ufukAy; i++) aylar.push(ayAnahtari(ayEkle(ilkAy, i)));
  return { aylar, son: ayEkle(ilkAy, ufukAy) };
}

/**
 * Senaryoyu hesaplar: her müşteri grubu kişi başına çözülür, sonuçlar adetle çarpılır (§8.1). Olaylar tarih ve §7.2
 * sırasıyla işlenir: fatura → tahsilat / iade → ay sonu (destek ve hakediş); her takvim ayı kapanırken vadesi gelen
 * ortak ödemeleri bakiyeyle sınırlı ödenir (kazanılmamış tutar avans olarak ödenmez).
 */
export function hesapla(s: Senaryo): Sonuc {
  const hatalar = dogrula(s);
  if (hatalar.length) return { hatalar, aylar: [], hareketler: [], ortaklar: [], musteriler: [], segika: [], sonrasi: [] };
  const { aylar, son } = zamanCizelgesi(s.ufukAy, [...s.musteriler.map((m) => m.baslangic), ...(s.faturalar ?? []).map((f) => f.tarih)]);
  const sonMs = utc(son);
  const ayIdx = new Map(aylar.map((a, i) => [a, i]));
  const hareketler: Hareket[] = [];
  const musteriler: MusteriOzet[] = [];
  const destekMaliyetAy = new Map<string, number>(); // grup → kişi başına fatura edilen hizmet ayı sayısı

  for (const grup of s.musteriler) {
    const kural = s.ortaklar[grup.ortak];
    const pb = grup.paraBirimi ?? s.fiyat.paraBirimi;
    const faturalar = (s.faturalar ? s.faturalar.filter((f) => f.musteri === grup.id) : faturaUret(grup, s.fiyat, son)).filter((f) => utc(f.tarih) < sonMs);
    const faturaIdleri = new Set(faturalar.map((f) => f.id));
    const tahsilatlar = s.tahsilatlar
      ? s.tahsilatlar.filter((t) => faturaIdleri.has(t.faturaId))
      : faturalar.map((f) => ({ id: `${f.id}-t`, faturaId: f.id, tarih: f.tarih, tutar: f.tutar }));
    const iadeler = s.iadeler.filter((i) => faturaIdleri.has(i.faturaId));
    destekMaliyetAy.set(grup.id, faturalar.reduce((t, f) => t + f.hizmetAy, 0));
    // İlk uygun fatura (§7.3): ilk pozitif tutarlı fatura; ödeme sırasından bağımsız; iade yeni ilk fatura doğurmaz.
    const ilkFatura = faturalar.filter((f) => f.tutar > 0).sort((a, b) => tarihSira(a.tarih, b.tarih) || tarihSira(a.id, b.id))[0];
    const durumlar = new Map<string, FaturaDurumu>();
    for (const f of faturalar) {
      const ilk = f === ilkFatura;
      const oranlar: Bp[] = [];
      for (let m = 0; m < f.hizmetAy; m++) {
        oranlar.push(kural.kapsam === 'ilk-fatura' ? (ilk ? (kural.donemler[0]?.oranBp ?? 0) : 0) : donemOrani(kural, musteriHizmetAyi(grup, f, m)).oranBp);
      }
      const bos = oranlar.map(() => 0);
      durumlar.set(f.id, { fatura: f, ilk, oranlar, Q: 0, iadeVar: false, kazanilan: [...bos], bekleyen: [...bos], bitti: oranlar.map(() => false), kayip: oranlar.map(() => false) });
    }
    const uygunMu = (d: FaturaDurumu, m: number) => kural.politika !== 'hizmet-ayi' || destekDurumu(s, grup, kural, musteriHizmetAyi(grup, d.fatura, m)) !== 'iptal';
    // Planlanan toplam: bütün ödeme ve hizmet koşulları gerçekleşirse (hizmet ayı politikasında iptal sonrası aylar hariç).
    let planlanan = 0;
    for (const d of durumlar.values()) faturaPaylari(d.fatura, d.oranlar, d.fatura.tutar).forEach((p, m) => uygunMu(d, m) && (planlanan += p));

    let netHakedis = 0;
    let odenen = 0;
    let bekleyenToplam = 0;
    let tahsilatToplam = 0;
    let iadeToplam = 0;
    let sayac = 0;
    const odemePlani: { tarih: string; tutar: Kurus }[] = [];
    const kayit = (h: { id?: string; tarih: string; tur: HareketTuru; tutar: Kurus; faturaId?: string; hizmetAyi?: number; aciklama: string }) => {
      sayac += 1;
      const { id, ...geri } = h;
      hareketler.push({ id: id ?? `${grup.id}-h${sayac}`, ay: ayAnahtari(h.tarih), musteri: grup.id, ortak: grup.ortak, paraBirimi: pb, ...geri, tutar: h.tutar * grup.adet });
    };
    const odemeyiPlanla = (tarih: string, tutar: Kurus) => {
      if (tutar <= 0) return;
      if (kural.politika === 'tahsilatta-taksit') taksitDagit(tutar, kural.taksit).forEach((t, k) => odemePlani.push({ tarih: ayEkle(tarih, kural.gecikmeAy + k), tutar: t }));
      else odemePlani.push({ tarih: ayEkle(tarih, kural.gecikmeAy), tutar });
    };
    const bazMetni = (d: FaturaDurumu) =>
      `${d.fatura.id}: baz ${kurusFormat(d.fatura.tutar - d.fatura.haric, pb)} × tahsilat ${kurusFormat(Math.min(d.Q, d.fatura.tutar), pb)} / ${kurusFormat(d.fatura.tutar, pb)}`;
    const hizmetAyiMetni = (d: FaturaDurumu, m: number) => `hizmet ayı ${musteriHizmetAyi(grup, d.fatura, m) + 1}`;
    /** Tahsilatta politikalar: faturanın toplam kazancını yeniden değerlendir; fark hakediş ya da düzeltmedir. */
    const tahsilattaDegerlendir = (d: FaturaDurumu, tarih: string) => {
      const paylar = faturaPaylari(d.fatura, d.oranlar, d.Q);
      let fark = 0;
      paylar.forEach((p, m) => {
        if (d.kayip[m]) return;
        fark += p - d.kazanilan[m];
        d.kazanilan[m] = p;
      });
      if (fark > 0) {
        netHakedis += fark;
        kayit({ tarih, tur: 'hakedis', tutar: fark, faturaId: d.fatura.id, aciklama: `${bazMetni(d)}; tahsilatta kazanıldı (oranlar hizmet dönemine göre)` });
        odemeyiPlanla(tarih, fark);
      } else if (fark < 0) {
        netHakedis += fark;
        kayit({ tarih, tur: 'duzeltme', tutar: fark, faturaId: d.fatura.id, aciklama: `${bazMetni(d)}; iade sonrası düzeltme` });
      }
    };
    /** Hizmet ayı politikası: bitmiş ve uygun ayların payını yeniden değerlendir (yalnız bir ay ya da hepsi). */
    const hizmetAyiDegerlendir = (d: FaturaDurumu, tarih: string, yalnizAy?: number) => {
      const paylar = faturaPaylari(d.fatura, d.oranlar, d.Q);
      let kazanc = 0;
      let duzeltme = 0;
      paylar.forEach((p, m) => {
        if (!d.bitti[m] || d.kayip[m]) return;
        if (yalnizAy !== undefined && m !== yalnizAy) return;
        if (d.bekleyen[m] > 0) {
          bekleyenToplam += p - d.bekleyen[m];
          d.bekleyen[m] = p;
          return;
        }
        const fark = p - d.kazanilan[m];
        if (fark > 0) kazanc += fark;
        else duzeltme += fark;
        d.kazanilan[m] = p;
      });
      if (kazanc > 0) {
        netHakedis += kazanc;
        const ne = yalnizAy !== undefined ? `${hizmetAyiMetni(d, yalnizAy)} sonunda kazanıldı` : 'tahsilat sonrası geçmiş uygun ayların farkı';
        kayit({ tarih, tur: 'hakedis', tutar: kazanc, faturaId: d.fatura.id, hizmetAyi: yalnizAy !== undefined ? musteriHizmetAyi(grup, d.fatura, yalnizAy) : undefined, aciklama: `${bazMetni(d)}; ${ne}` });
        odemeyiPlanla(tarih, kazanc);
      }
      if (duzeltme < 0) {
        netHakedis += duzeltme;
        kayit({ tarih, tur: 'duzeltme', tutar: duzeltme, faturaId: d.fatura.id, aciklama: `${bazMetni(d)}; iade sonrası düzeltme` });
      }
    };
    /**
     * Vadesi `oncesi` tarihinden önce gelen ödemeler (vade sırasıyla, aynı tarihliler birlikte): bakiyeyle sınırlı;
     * eksik kalan geri alınacak bakiyeden mahsup edilir. Aynı tarihte ödeme en son işlenir (§7.2).
     */
    const odemeleriIsle = (oncesi: string) => {
      odemePlani.sort((a, b) => tarihSira(a.tarih, b.tarih));
      while (odemePlani.length && odemePlani[0].tarih < oncesi) {
        const tarih = odemePlani[0].tarih;
        const vadesi: { tarih: string; tutar: Kurus }[] = [];
        while (odemePlani.length && odemePlani[0].tarih === tarih) vadesi.push(odemePlani.shift()!);
        const plan = vadesi.reduce((t, o) => t + o.tutar, 0);
        const odeme = Math.max(0, Math.min(plan, netHakedis - odenen));
        if (odeme <= 0) continue;
        odenen += odeme;
        kayit({ tarih, tur: 'odeme', tutar: odeme, aciklama: odeme < plan ? `Simüle edilen ortak ödemesi; planın ${kurusFormat(plan - odeme, pb)} bölümü geri alınacak bakiyeden mahsup edildi` : 'Simüle edilen ortak ödemesi' });
      }
    };

    const olaylar: Olay[] = [];
    for (const f of faturalar) {
      olaylar.push({ tarih: f.tarih, sira: 0, tur: 'fatura', faturaId: f.id });
      for (let m = 0; m < f.hizmetAy; m++) olaylar.push({ tarih: ayEkle(f.hizmetBaslangic, m + 1), sira: 2, tur: 'ayson', faturaId: f.id, hizmetAyi: m });
    }
    for (const t of tahsilatlar) olaylar.push({ tarih: t.tarih, sira: 1, tur: 'tahsilat', faturaId: t.faturaId, tutar: t.tutar, id: t.id });
    for (const i of iadeler) olaylar.push({ tarih: i.tarih, sira: 1, tur: 'iade', faturaId: i.faturaId, tutar: i.tutar, id: i.id });
    olaylar.sort((a, b) => tarihSira(a.tarih, b.tarih) || a.sira - b.sira || tarihSira(a.id ?? '', b.id ?? ''));
    const gorulen = new Set<string>();
    for (const o of olaylar) {
      if (utc(o.tarih) >= sonMs) continue;
      if (!ayIdx.has(ayAnahtari(o.tarih))) continue;
      odemeleriIsle(o.tarih);
      const d = durumlar.get(o.faturaId);
      if (!d) continue;
      if (o.tur === 'fatura') {
        kayit({ tarih: o.tarih, tur: 'fatura', tutar: d.fatura.tutar, faturaId: d.fatura.id, aciklama: `${d.ilk ? 'İlk uygun fatura' : 'Fatura'}: ${d.fatura.hizmetAy} ay hizmet${d.fatura.haric ? `; hariç kalem ${kurusFormat(d.fatura.haric, pb)}` : ''}` });
      } else if (o.tur === 'tahsilat' || o.tur === 'iade') {
        const anahtar = `${o.tur}:${o.id}`;
        if (gorulen.has(anahtar)) continue; // aynı olay iki kez içeri alınmaz (§7.6)
        gorulen.add(anahtar);
        const tutar = o.tutar ?? 0;
        if (o.tur === 'tahsilat') {
          if (d.Q + tutar > d.fatura.tutar) {
            hatalar.push(`Tahsilat ${o.id}: toplam ödeme faturayı aşıyor (fazla tahsilat bu sürümde hata).`);
            continue;
          }
          d.Q += tutar;
          tahsilatToplam += tutar;
          kayit({ tarih: o.tarih, tur: 'tahsilat', tutar, faturaId: d.fatura.id, id: `${grup.id}-${o.id}`, aciklama: `Müşteri tahsilatı (${d.fatura.id}); kümülatif ${kurusFormat(d.Q, pb)}` });
        } else {
          if (tutar > d.Q) {
            hatalar.push(`İade ${o.id}: net tahsilatı aşıyor.`);
            continue;
          }
          d.Q -= tutar;
          d.iadeVar = true;
          iadeToplam += tutar;
          kayit({ tarih: o.tarih, tur: 'iade', tutar: -tutar, faturaId: d.fatura.id, id: `${grup.id}-${o.id}`, aciklama: `İade (${d.fatura.id}); net tahsilat ${kurusFormat(d.Q, pb)}` });
        }
        if (kural.politika === 'hizmet-ayi') hizmetAyiDegerlendir(d, o.tarih);
        else tahsilattaDegerlendir(d, o.tarih);
      } else {
        const m = o.hizmetAyi ?? 0;
        d.bitti[m] = true;
        const durum = destekDurumu(s, grup, kural, musteriHizmetAyi(grup, d.fatura, m));
        const pay = faturaPaylari(d.fatura, d.oranlar, d.Q)[m];
        const ayAdi = hizmetAyiMetni(d, m);
        const hm = musteriHizmetAyi(grup, d.fatura, m);
        if (durum === 'iptal') {
          // İptal gelecek faturaları durdurur; tahsilatta kazanılmış komisyon sırf iptalle sıfırlanmaz (§7.6).
          if (kural.politika === 'hizmet-ayi') {
            d.kayip[m] = true;
            if (pay > 0) kayit({ tarih: o.tarih, tur: 'bekleyen', tutar: 0, faturaId: d.fatura.id, hizmetAyi: hm, aciklama: `${ayAdi}: abonelik iptal edildi; ${kurusFormat(pay, pb)} kazanılmadı, kalan aylara dağıtılmaz` });
          }
        } else if (durum === 'saglanmadi' || (durum === 'belirsiz' && kural.destekIhlali === 'kazandirmaz')) {
          const neden = durum === 'saglanmadi' ? 'destek sağlanmadı' : 'destek sonucu belirsiz';
          if (d.kazanilan[m] > 0) {
            netHakedis -= d.kazanilan[m];
            kayit({ tarih: o.tarih, tur: 'duzeltme', tutar: -d.kazanilan[m], faturaId: d.fatura.id, hizmetAyi: hm, aciklama: `${ayAdi}: ${neden}; tahsilatta kazanılan ${kurusFormat(d.kazanilan[m], pb)} geri alınır` });
            d.kazanilan[m] = 0;
          } else if (pay > 0) {
            kayit({ tarih: o.tarih, tur: 'bekleyen', tutar: 0, faturaId: d.fatura.id, hizmetAyi: hm, aciklama: `${ayAdi}: ${neden}; ${kurusFormat(pay, pb)} kazanılmadı, kalan aylara dağıtılmaz` });
          }
          d.kayip[m] = true;
        } else if (durum === 'belirsiz') {
          if (kural.politika === 'hizmet-ayi' && pay > 0) {
            d.bekleyen[m] = pay;
            bekleyenToplam += pay;
            kayit({ tarih: o.tarih, tur: 'bekleyen', tutar: pay, faturaId: d.fatura.id, hizmetAyi: hm, aciklama: `${ayAdi}: destek sonucu bekleniyor; ${kurusFormat(pay, pb)} koşullu, kazanılmış borç değil` });
          }
        } else if (kural.politika === 'hizmet-ayi') {
          hizmetAyiDegerlendir(d, o.tarih, m);
        }
      }
    }
    odemeleriIsle(son);

    // Koşullu (gelecek tahsilat / hizmet koşullarına bağlı): iade görmemiş faturada tam ödeme, görmüşte net tahsilat esas.
    let kosullu = 0;
    let tahsilataBagli = 0;
    let komisyonBazi = 0;
    for (const d of durumlar.values()) {
      const f = d.fatura;
      komisyonBazi += Number(bolYuvarla(BigInt(f.tutar - f.haric) * BigInt(Math.min(d.Q, f.tutar)), BigInt(Math.max(1, f.tutar))));
      const tam = faturaPaylari(f, d.oranlar, d.iadeVar ? d.Q : f.tutar);
      const bugun = faturaPaylari(f, d.oranlar, d.Q);
      tam.forEach((p, m) => {
        if (d.kayip[m] || !uygunMu(d, m)) return;
        kosullu += Math.max(p - d.kazanilan[m] - d.bekleyen[m], 0);
        tahsilataBagli += bugun[m];
      });
    }
    const n = grup.adet;
    musteriler.push({
      musteri: grup.id,
      ortak: grup.ortak,
      paraBirimi: pb,
      adet: n,
      fatura: faturalar.reduce((t, f) => t + f.tutar, 0) * n,
      tahsilat: tahsilatToplam * n,
      iade: iadeToplam * n,
      komisyonBazi: komisyonBazi * n,
      planlanan: planlanan * n,
      tahsilataBagli: tahsilataBagli * n,
      netHakedis: netHakedis * n,
      bekleyen: bekleyenToplam * n,
      odenen: odenen * n,
      kosullu: kosullu * n,
    });
  }

  hareketler.sort((a, b) => tarihSira(a.tarih, b.tarih) || SIRA[a.tur] - SIRA[b.tur] || tarihSira(a.id, b.id));

  // Ay özetleri (tek para birimli senaryoda doğrudan; çok para birimli senaryoda görünüm para birimine göre filtreler).
  const ayOzetleri: AyOzeti[] = aylar.map((ay) => ({ ay, fatura: 0, tahsilat: 0, iade: 0, hakedis: 0, duzeltme: 0, bekleyen: 0, odeme: 0, bakiye: 0 }));
  for (const h of hareketler) {
    const a = ayOzetleri[ayIdx.get(h.ay) ?? -1];
    if (!a) continue;
    if (h.tur === 'fatura') a.fatura += h.tutar;
    else if (h.tur === 'tahsilat') a.tahsilat += h.tutar;
    else if (h.tur === 'iade') a.iade += -h.tutar;
    else if (h.tur === 'hakedis') a.hakedis += h.tutar;
    else if (h.tur === 'duzeltme') a.duzeltme += h.tutar;
    else if (h.tur === 'bekleyen') a.bekleyen += h.tutar;
    else if (h.tur === 'odeme') a.odeme += h.tutar;
  }
  let bakiye = 0;
  for (const a of ayOzetleri) {
    bakiye += a.hakedis + a.duzeltme - a.odeme;
    a.bakiye = bakiye;
  }

  // Ortak ve Segika özetleri para birimine göre; farklı para birimleri toplanmaz (§8, M38).
  const ortaklar: OrtakOzet[] = [];
  const segika: SegikaOzet[] = [];
  const sonrasi: Sonuc['sonrasi'] = [];
  for (const pb of [...new Set(musteriler.map((m) => m.paraBirimi))]) {
    for (const id of ORTAKLAR) {
      const mler = musteriler.filter((m) => m.paraBirimi === pb && m.ortak === id);
      if (!mler.length) continue;
      const hl = hareketler.filter((h) => h.paraBirimi === pb && h.ortak === id);
      const topla = (tur: HareketTuru) => hl.filter((h) => h.tur === tur).reduce((t, h) => t + h.tutar, 0);
      const kazanilan = topla('hakedis');
      const duzeltme = topla('duzeltme');
      const odenen = topla('odeme');
      const netHakedis = kazanilan + duzeltme;
      const kural = s.ortaklar[id];
      const destekMaliyeti = kural.destekMaliyeti === null ? null : kural.destekMaliyeti * mler.reduce((t, m) => t + m.adet * (destekMaliyetAy.get(m.musteri) ?? 0), 0);
      ortaklar.push({
        ortak: id,
        paraBirimi: pb,
        planlanan: mler.reduce((t, m) => t + m.planlanan, 0),
        kazanilan,
        duzeltme,
        netHakedis,
        bekleyen: mler.reduce((t, m) => t + m.bekleyen, 0),
        odenen,
        odenecek: Math.max(netHakedis - odenen, 0),
        geriAlinacak: Math.max(odenen - netHakedis, 0),
        kosullu: mler.reduce((t, m) => t + m.kosullu, 0),
        destekMaliyeti,
        destekSonrasi: destekMaliyeti === null ? null : netHakedis - destekMaliyeti,
      });
    }
    const mler = musteriler.filter((m) => m.paraBirimi === pb);
    const oler = ortaklar.filter((o) => o.paraBirimi === pb);
    const tahsilat = mler.reduce((t, m) => t + m.tahsilat, 0);
    const iade = mler.reduce((t, m) => t + m.iade, 0);
    const komisyonBazi = mler.reduce((t, m) => t + m.komisyonBazi, 0);
    const netHakedis = oler.reduce((t, o) => t + o.netHakedis, 0);
    const odeme = oler.reduce((t, o) => t + o.odenen, 0);
    const bekleyen = oler.reduce((t, o) => t + o.bekleyen, 0);
    const kosullu = oler.reduce((t, o) => t + o.kosullu, 0);
    segika.push({ paraBirimi: pb, tahsilat, iade, netTahsilat: tahsilat - iade, komisyonBazi, netHakedis, komisyonSonrasi: komisyonBazi - netHakedis, odeme, nakit: tahsilat - iade - odeme, bekleyen, kosullu });
    sonrasi.push({ paraBirimi: pb, odenecek: oler.reduce((t, o) => t + o.odenecek, 0), kosullu: kosullu + bekleyen });
  }
  return { hatalar, aylar: ayOzetleri, hareketler, ortaklar, musteriler, segika, sonrasi };
}

/** Aynı satışın üç alternatif ortağı (§7.7, M33): her model ayrı hesaplanır; toplamları eklenmez. */
export function karsilastir(s: Senaryo, musteriId: string): Record<OrtakId, Sonuc> {
  const grup = s.musteriler.find((m) => m.id === musteriId);
  const out = {} as Record<OrtakId, Sonuc>;
  for (const id of ORTAKLAR) out[id] = hesapla({ ...s, musteriler: grup ? [{ ...grup, ortak: id }] : [] });
  return out;
}

/* ---------- Başlangıç değerleri (örnek; düzenlenebilir) ---------- */

export const ORTAK_ADLARI: Record<OrtakId, string> = { ayse: 'Ayşe', satis: 'Satış ortağı', cozum: 'Çözüm ortağı' };

/** Başlangıç kuralları (docs/affilate.md §2, §5.4): bütün değerler girdi; örnek başlangıç, onaylanmış sözleşme değil. */
export function baslangicOrtaklar(): Record<OrtakId, OrtakKurali> {
  return {
    ayse: { id: 'ayse', ad: ORTAK_ADLARI.ayse, kapsam: 'ilk-fatura', donemler: [{ ay: 12, oranBp: 1000 }], sonrakiOranBp: 0, politika: 'tahsilatta', taksit: 1, gecikmeAy: 0, destekSorumlusu: 'segika', destekIhlali: 'kazandirmaz', destekMaliyeti: null },
    satis: { id: 'satis', ad: ORTAK_ADLARI.satis, kapsam: 'sureli', donemler: [{ ay: 12, oranBp: 1500 }, { ay: 12, oranBp: 1000 }, { ay: 12, oranBp: 0 }], sonrakiOranBp: 0, politika: 'hizmet-ayi', taksit: 12, gecikmeAy: 0, destekSorumlusu: 'segika', destekIhlali: 'kazandirmaz', destekMaliyeti: null },
    cozum: { id: 'cozum', ad: ORTAK_ADLARI.cozum, kapsam: 'sureli', donemler: [{ ay: 12, oranBp: 2500 }, { ay: 12, oranBp: 1500 }, { ay: 12, oranBp: 0 }], sonrakiOranBp: 0, politika: 'hizmet-ayi', taksit: 12, gecikmeAy: 0, destekSorumlusu: 'ortak', destekIhlali: 'kazandirmaz', destekMaliyeti: null },
  };
}

/** Başlangıç fiyatı (§4.1): aylık 100 TL, yıllık paket 10 aylık ücret, 12 ay hizmet. */
export function baslangicFiyat(): Fiyat {
  return { kaynak: 'kat', aylik: 10_000, kat: 10, hizmetAy: 12, indirimBp: 1667, paket: 100_000, paraBirimi: 'TRY' };
}

export function baslangicSenaryo(): Senaryo {
  return {
    ufukAy: 36,
    fiyat: baslangicFiyat(),
    ortaklar: baslangicOrtaklar(),
    musteriler: [{ id: 'a', ad: 'Müşteri A', adet: 1, baslangic: '2027-01-01', odeme: 'paket', ortak: 'satis', iptalHizmetAyi: null, destekVarsayilan: 'aktif' }],
    iadeler: [],
    destek: [],
  };
}
