/**
 * Ücret ve performans applet'leri (kullanıcı kararı 2026-10-21, /applet/): meslekten bağımsız örnek modeller.
 * İki motor: rütbe (sabit ücret: meslek × seviye × uzmanlık → band) ve efor (performans → zam ve prim).
 * Tutarlar baz birimin katıdır (varsayılan: Parametreler’deki net asgari ücret); kişiler kurgusaldır (Kişi A…).
 * Bu dosya yalnız saf hesap ve varsayılan veridir; arayüz src/views/AppletPage.tsx.
 */

export type ParaBirimi = '₺' | '€' | '$';
export type BazKaynak = 'net' | 'brut' | 'ozel';
export type Hat = 'IC' | 'M';

export interface Uzmanlik {
  id: string;
  ad: string;
  carpan: number;
}

export interface Meslek {
  id: string;
  ad: string;
  /** Rol baz katsayısı: mesleğin piyasa fiyatı / baz birim (seviye 2 = gelişen). */
  katsayi: number;
  uzmanliklar: Uzmanlik[];
}

export interface Seviye {
  kod: string;
  ad: string;
  hat: Hat;
  carpan: number;
}

export interface Secenek {
  id: string;
  ad: string;
  carpan: number;
}

export type SeviyeSeti = 'kademeli' | 'gitlab' | 'codacy' | 'ilk';

export const SEVIYE_SETLERI: Record<SeviyeSeti, { ad: string; dayanak: string; seviyeler: Seviye[] }> = {
  kademeli: {
    ad: 'Kademeli P1–P6 · M1–M4',
    dayanak: 'Radford/WTW uzman (P) ve yönetici (M) hatları; adım ≈ %20–25 (GitLab, 37signals aralığı)',
    seviyeler: [
      { kod: 'P1', ad: 'Giriş (junior)', hat: 'IC', carpan: 0.8 },
      { kod: 'P2', ad: 'Gelişen (mid)', hat: 'IC', carpan: 1 },
      { kod: 'P3', ad: 'Kıdemli (senior)', hat: 'IC', carpan: 1.22 },
      { kod: 'P4', ad: 'Uzman (staff / lead)', hat: 'IC', carpan: 1.48 },
      { kod: 'P5', ad: 'Baş uzman (principal)', hat: 'IC', carpan: 1.8 },
      { kod: 'P6', ad: 'Seçkin uzman', hat: 'IC', carpan: 2.18 },
      { kod: 'M1', ad: 'Takım lideri', hat: 'M', carpan: 1.48 },
      { kod: 'M2', ad: 'Yönetici', hat: 'M', carpan: 1.8 },
      { kod: 'M3', ad: 'Bölüm başı', hat: 'M', carpan: 2.18 },
      { kod: 'M4', ad: 'Direktör', hat: 'M', carpan: 2.64 },
    ],
  },
  gitlab: {
    ad: 'GitLab seviye faktörü',
    dayanak: 'GitLab el kitabı: junior 0,8 · intermediate 1,0 · senior 1,2 · staff 1,4 · manager 1,4',
    seviyeler: [
      { kod: 'P1', ad: 'Junior', hat: 'IC', carpan: 0.8 },
      { kod: 'P2', ad: 'Intermediate', hat: 'IC', carpan: 1 },
      { kod: 'P3', ad: 'Senior', hat: 'IC', carpan: 1.2 },
      { kod: 'P4', ad: 'Staff', hat: 'IC', carpan: 1.4 },
      { kod: 'M1', ad: 'Manager', hat: 'M', carpan: 1.4 },
    ],
  },
  codacy: {
    ad: 'Codacy kıdem çarpanı',
    dayanak: 'Codacy açık hesaplayıcı: junior 0,7 · intermediate 1,0 · senior 1,3 · lead 1,6 · director 1,9',
    seviyeler: [
      { kod: 'P1', ad: 'Junior', hat: 'IC', carpan: 0.7 },
      { kod: 'P2', ad: 'Intermediate', hat: 'IC', carpan: 1 },
      { kod: 'P3', ad: 'Senior', hat: 'IC', carpan: 1.3 },
      { kod: 'P4', ad: 'Lead', hat: 'IC', carpan: 1.6 },
      { kod: 'M1', ad: 'Director', hat: 'M', carpan: 1.9 },
    ],
  },
  ilk: {
    ad: 'İlk model (yazılım oranları)',
    dayanak: 'Şirketin ilk taslağı: junior 1,5 × · mid 2,25 × · senior 3,75 × asgari ücret (oranlar 1 : 1,5 : 2,5)',
    seviyeler: [
      { kod: 'P1', ad: 'Junior', hat: 'IC', carpan: 1 },
      { kod: 'P2', ad: 'Mid', hat: 'IC', carpan: 1.5 },
      { kod: 'P3', ad: 'Senior', hat: 'IC', carpan: 2.5 },
    ],
  },
};

/** Örnek meslek kataloğu: katsayılar piyasa verisiyle kalibre edilir; yeni meslek eklenebilir. */
export const VARSAYILAN_MESLEKLER: Meslek[] = [
  {
    id: 'yazilim',
    ad: 'Yazılım',
    katsayi: 1.8,
    uzmanliklar: [
      { id: 'backend', ad: 'Backend', carpan: 1 },
      { id: 'frontend', ad: 'Frontend', carpan: 1 },
      { id: 'fullstack', ad: 'Full stack', carpan: 1.12 },
      { id: 'devops', ad: 'DevOps', carpan: 1.1 },
    ],
  },
  {
    id: 'tasarim',
    ad: 'Tasarım',
    katsayi: 1.4,
    uzmanliklar: [
      { id: 'grafik', ad: 'Grafik tasarım', carpan: 1 },
      { id: 'uiux', ad: 'UI/UX', carpan: 1.05 },
      { id: 'video', ad: 'Video ve motion', carpan: 1.08 },
      { id: 'art', ad: 'Sanat yönetimi', carpan: 1.1 },
    ],
  },
  {
    id: 'ik',
    ad: 'İnsan kaynakları',
    katsayi: 1.3,
    uzmanliklar: [
      { id: 'operasyon', ad: 'İK operasyon', carpan: 1 },
      { id: 'bordro', ad: 'Bordro', carpan: 1 },
      { id: 'isealim', ad: 'İşe alım', carpan: 1 },
      { id: 'odul', ad: 'Ücret ve yan haklar', carpan: 1.1 },
      { id: 'hrbp', ad: 'İK iş ortağı (HRBP)', carpan: 1.1 },
    ],
  },
  {
    id: 'satis',
    ad: 'Satış',
    katsayi: 1.3,
    uzmanliklar: [
      { id: 'saha', ad: 'Saha satış', carpan: 1 },
      { id: 'kurumsal', ad: 'Kurumsal satış', carpan: 1.1 },
    ],
  },
  {
    id: 'pazarlama',
    ad: 'Pazarlama',
    katsayi: 1.4,
    uzmanliklar: [
      { id: 'icerik', ad: 'İçerik', carpan: 1 },
      { id: 'performans', ad: 'Performans pazarlama', carpan: 1.08 },
      { id: 'crm', ad: 'CRM', carpan: 1 },
    ],
  },
];

/** Buffer yaşam maliyeti bantları (1,00 / 0,90 / 0,85 / 0,75); GitLab global alt sınırı 0,70. */
export const VARSAYILAN_LOKASYONLAR: Secenek[] = [
  { id: 'a', ad: 'A · Referans pazar', carpan: 1 },
  { id: 'b', ad: 'B · Orta-üst maliyet', carpan: 0.9 },
  { id: 'c', ad: 'C · Ortalama maliyet', carpan: 0.85 },
  { id: 'd', ad: 'D · Düşük maliyet', carpan: 0.75 },
];

/** GitLab “contract factor”: serbest çalışan kendi vergi, sigorta ve izin maliyetini taşır (örnek değer). */
export const VARSAYILAN_SOZLESMELER: Secenek[] = [
  { id: 'calisan', ad: 'Çalışan eşdeğeri', carpan: 1 },
  { id: 'freelancer', ad: 'Fatura kesen serbest çalışan', carpan: 1.15 },
];

/** Band içi kademe (L1–L3): öğrenen, yetkin, bir üst seviyeye hazır. */
export const BAND_KADEMELERI: { id: string; ad: string; carpan: number }[] = [
  { id: 'L1', ad: 'L1 · Öğrenen', carpan: 0.9 },
  { id: 'L2', ad: 'L2 · Yetkin', carpan: 1 },
  { id: 'L3', ad: 'L3 · Üst seviyeye hazır', carpan: 1.1 },
];

/* ---------- Ortak yardımcılar ---------- */

export const yuvarla = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
/** Bölen sıfır veya negatifse 0 (kullanıcı çarpanı 0 yaptığında NaN/∞ yayılmasın). */
export const bol = (a: number, b: number) => (b > 0 && Number.isFinite(a) ? a / b : 0);
/** Türkçe ondalık yazımı (0,85). */
export const ondalik = (v: number, d = 2) => yuvarla(v, d).toLocaleString('tr-TR');
const toplam = (a: number[]) => a.reduce((x, y) => x + y, 0);
const ortalama = (a: number[]) => (a.length ? toplam(a) / a.length : 0);
const sinirla = (v: number, alt: number, ust: number) => Math.min(ust, Math.max(alt, v));

export function bazTutari(kaynak: BazKaynak, asgariNet: number, asgariBrut: number, ozel: number) {
  return kaynak === 'net' ? asgariNet : kaynak === 'brut' ? asgariBrut : ozel;
}

export const meslekBul = (meslekler: Meslek[], id: string) => meslekler.find((m) => m.id === id) ?? meslekler[0];
export const uzmanlikBul = (m: Meslek | undefined, id: string) => m?.uzmanliklar.find((u) => u.id === id) ?? m?.uzmanliklar[0];
export const seviyeBul = (seviyeler: Seviye[], kod: string) => seviyeler.find((s) => s.kod === kod) ?? seviyeler[0];

/** Rütbe hücresi: meslek katsayısı × seviye çarpanı × uzmanlık çarpanı (baz birimin katı). */
export const hucreCarpani = (m: Meslek, u: Uzmanlik | undefined, s: Seviye) => m.katsayi * s.carpan * (u?.carpan ?? 1);

/** Aynı hattaki bir sonraki seviye (terfi hedefi). */
export function sonrakiSeviye(seviyeler: Seviye[], kod: string): Seviye | undefined {
  const s = seviyeBul(seviyeler, kod);
  const hat = seviyeler.filter((x) => x.hat === s.hat);
  return hat[hat.indexOf(s) + 1];
}

/* ---------- Kademe serisi ve band matematiği ---------- */

export interface KademeGirdi {
  /** İlk derecenin orta noktası (baz birimin katı). */
  k1: number;
  /** Aritmetik seri adımı (ör. +0,25 ×). */
  artim: number;
  /** Geometrik seri: dereceler arası orta nokta ilerlemesi (0,17 = %17). */
  oran: number;
  adet: number;
  /** Band yarı genişliği: en az = orta × (1 − h), en çok = orta × (1 + h). */
  yariGenislik: number;
}

export interface KademeSatir {
  g: number;
  aritmetik: number;
  aritArtis: number | null;
  geometrik: number;
  min: number;
  max: number;
  ortusme: number | null;
}

/** Band genişliği (en çok − en az) ÷ en az. */
export const yayilim = (h: number) => (1 + h) / (1 - h) - 1;
/** Komşu iki bandın örtüşmesi: (alt bandın en çoğu − üst bandın en azı) ÷ alt bandın genişliği. */
export const ortusme = (h: number, p: number) => (h <= 0 ? 0 : Math.max(0, 1 + h - (1 - h) * (1 + p)) / (2 * h));
/** Örtüşmeyi hedefe indirmek için gereken orta nokta ilerlemesi. */
export const ilerlemeIcin = (h: number, hedef: number) => (1 + h - 2 * h * hedef) / (1 - h) - 1;

export function kademeSerisi(g: KademeGirdi): KademeSatir[] {
  const adet = Math.max(1, Math.round(g.adet));
  const satirlar: KademeSatir[] = Array.from({ length: adet }, (_, i) => {
    const aritmetik = g.k1 + g.artim * i;
    const onceki = g.k1 + g.artim * (i - 1);
    const geometrik = g.k1 * (1 + g.oran) ** i;
    return {
      g: i + 1,
      aritmetik,
      aritArtis: i && onceki > 0 ? aritmetik / onceki - 1 : null,
      geometrik,
      min: geometrik * (1 - g.yariGenislik),
      max: geometrik * (1 + g.yariGenislik),
      ortusme: null,
    };
  });
  for (let i = 0; i < satirlar.length - 1; i++) {
    const a = satirlar[i];
    const b = satirlar[i + 1];
    a.ortusme = a.max > a.min ? Math.max(0, a.max - b.min) / (a.max - a.min) : 0;
  }
  return satirlar;
}

/** Derece (G1…) → orta nokta çarpanı; seri dışındaki derece son dereceye eşitlenir. */
export const dereceOrtasi = (g: KademeGirdi, derece: number) => g.k1 * (1 + g.oran) ** (sinirla(derece, 1, Math.max(1, Math.round(g.adet))) - 1);

/* ---------- İş değerleme (puan-faktör) ---------- */

export interface Faktor {
  id: string;
  ad: string;
  agirlik: number;
  olcer: string;
}

export interface Pozisyon {
  id: string;
  ad: string;
  meslekId: string;
  /** Faktör sırasıyla 1–5 puan. */
  puan: number[];
}

export const VARSAYILAN_FAKTORLER: Faktor[] = [
  { id: 'bilgi', ad: 'Bilgi ve uzmanlık', agirlik: 30, olcer: 'Teknik ve mesleki bilgi derinliği' },
  { id: 'karmasiklik', ad: 'Karmaşıklık', agirlik: 20, olcer: 'Problemin belirsizliği ve karar zorluğu' },
  { id: 'etki', ad: 'Hesap verebilirlik', agirlik: 25, olcer: 'Kararın ve hatanın şirkete etkisi' },
  { id: 'iletisim', ad: 'İletişim ve liderlik', agirlik: 15, olcer: 'Koordinasyon, müşteri, ekip yönlendirme' },
  { id: 'kosul', ad: 'Çalışma koşulları', agirlik: 10, olcer: 'Zaman baskısı, operasyonel yük' },
];

export const VARSAYILAN_POZISYONLAR: Pozisyon[] = [
  { id: 'p1', ad: 'Kıdemli yazılım geliştirici', meslekId: 'yazilim', puan: [4, 4, 3, 3, 2] },
  { id: 'p2', ad: 'Yazılım takım lideri', meslekId: 'yazilim', puan: [4, 4, 4, 4, 3] },
  { id: 'p3', ad: 'Grafik tasarımcı', meslekId: 'tasarim', puan: [3, 3, 2, 2, 2] },
  { id: 'p4', ad: 'Video editör', meslekId: 'tasarim', puan: [3, 3, 2, 2, 3] },
  { id: 'p5', ad: 'Sanat yönetmeni', meslekId: 'tasarim', puan: [4, 4, 4, 3, 3] },
  { id: 'p6', ad: 'Bordro uzmanı', meslekId: 'ik', puan: [3, 3, 4, 2, 3] },
  { id: 'p7', ad: 'İşe alım uzmanı', meslekId: 'ik', puan: [3, 2, 3, 3, 2] },
  { id: 'p8', ad: 'Saha satış uzmanı', meslekId: 'satis', puan: [2, 2, 3, 3, 4] },
];

/** Puan (1–5) → derece eşikleri: G1 < 1,6 ≤ G2 < 2,0 … ≤ G9. */
export const VARSAYILAN_ESIKLER = [1.6, 2, 2.4, 2.8, 3.2, 3.6, 4, 4.4];

export function isPuani(faktorler: Faktor[], puan: number[]) {
  const agirlik = toplam(faktorler.map((f) => Math.max(0, f.agirlik)));
  if (!agirlik) return 0;
  return toplam(faktorler.map((f, i) => (Math.max(0, f.agirlik) / agirlik) * (puan[i] ?? 0)));
}

export const derece = (esikler: number[], puan: number) => 1 + esikler.filter((e) => puan >= e - 1e-9).length;

/**
 * Hay kuralı: puanları %15’ten az farklı iki iş aynı büyüklüktedir. Puana göre sıralı listede bir öncekiyle aynı
 * büyüklükte olan pozisyonları işaretler.
 */
export function hayKumeleri(puanlar: { id: string; puan: number }[]) {
  const sirali = [...puanlar].sort((a, b) => b.puan - a.puan);
  const ayni = new Set<string>();
  for (let i = 1; i < sirali.length; i++) {
    const ust = sirali[i - 1].puan;
    const alt = sirali[i].puan;
    if (alt > 0 && ust / alt - 1 < 0.15) {
      ayni.add(sirali[i - 1].id);
      ayni.add(sirali[i].id);
    }
  }
  return ayni;
}

/* ---------- Taban ücret zinciri ---------- */

export interface ZincirAdim {
  ad: string;
  deger: string;
  carpan: number;
  /** Bu adımdan sonraki tutar (baz birim cinsinden değil, para birimiyle). */
  tutar: number;
}

export interface ZincirGirdi {
  baz: number;
  meslek: Meslek;
  uzmanlik: Uzmanlik | undefined;
  seviye: Seviye;
  lokasyon: Secenek;
  lokasyonTaban: number;
  insanaOde: boolean;
  sozlesme: Secenek;
  bandKonumu: number;
  tabanCarpani: number;
}

export function tabanZinciri(g: ZincirGirdi) {
  const lok = g.insanaOde ? 1 : Math.max(g.lokasyon.carpan, g.lokasyonTaban);
  const lokNot = g.insanaOde ? 'Adrese değil insana öde: 1,00' : g.lokasyon.carpan < g.lokasyonTaban ? `${g.lokasyon.ad} (alt sınır uygulandı)` : g.lokasyon.ad;
  const adimlar: [string, string, number][] = [
    ['Baz birim', 'Başlangıç', 1],
    ['Meslek katsayısı', g.meslek.ad, g.meslek.katsayi],
    ['Seviye çarpanı', `${g.seviye.kod} · ${g.seviye.ad}`, g.seviye.carpan],
    ['Uzmanlık çarpanı', g.uzmanlik?.ad ?? '—', g.uzmanlik?.carpan ?? 1],
    ['Lokasyon faktörü', lokNot, lok],
    ['Sözleşme faktörü', g.sozlesme.ad, g.sozlesme.carpan],
    ['Band içi konum', 'Compa-ratio', g.bandKonumu],
  ];
  let tutar = g.baz;
  const satirlar: ZincirAdim[] = adimlar.map(([ad, deger, carpan], i) => {
    tutar = i === 0 ? g.baz : tutar * carpan;
    return { ad, deger, carpan, tutar };
  });
  const taban = g.baz * g.tabanCarpani;
  const tabanUygulandi = tutar < taban;
  return { satirlar, hesap: tutar, sonuc: Math.max(tutar, taban), taban, tabanUygulandi, carpan: bol(Math.max(tutar, taban), g.baz) };
}

/* ---------- Band içi konum (kritik başarı faktörleri) ---------- */

export interface KbfKriter {
  id: string;
  ad: string;
  agirlik: number;
}

export interface KbfKisi {
  id: string;
  ad: string;
  /** Kriter sırasıyla 0–100 puan. */
  puan: number[];
  /** Mevcut ücret: band orta noktasının katı (compa-ratio). */
  mevcut: number;
}

export const VARSAYILAN_KBF_KRITER: KbfKriter[] = [
  { id: 'teknik', ad: 'Teknik derinlik', agirlik: 30 },
  { id: 'deneyim', ad: 'Proje ve sektör deneyimi', agirlik: 30 },
  { id: 'performans', ad: 'Kalibre edilmiş performans', agirlik: 40 },
];

export const VARSAYILAN_KBF_KISI: KbfKisi[] = [
  { id: 'a', ad: 'Kişi A', puan: [80, 60, 70], mevcut: 0.92 },
  { id: 'b', ad: 'Kişi B', puan: [50, 40, 60], mevcut: 0.76 },
  { id: 'c', ad: 'Kişi C', puan: [90, 85, 95], mevcut: 1.24 },
  { id: 'd', ad: 'Kişi D', puan: [30, 20, 40], mevcut: 0.86 },
  { id: 'e', ad: 'Kişi E', puan: [70, 75, 55], mevcut: 1.05 },
];

export function kbfOrani(kriterler: KbfKriter[], puan: number[]) {
  const agirlik = toplam(kriterler.map((k) => Math.max(0, k.agirlik)));
  if (!agirlik) return 0;
  return sinirla(toplam(kriterler.map((k, i) => Math.max(0, k.agirlik) * sinirla(puan[i] ?? 0, 0, 100))) / agirlik / 100, 0, 1);
}

export type Bolge = 'yesil' | 'ogrenme' | 'yetkin' | 'ileri' | 'kirmizi';

export const BOLGELER: Record<Bolge, { ad: string; aralik: string; eylem: string; durum: Durum }> = {
  yesil: { ad: 'Yeşil daire', aralik: '< 0,80', eylem: 'Piyasanın altında: zam döneminde öncelikli düzeltme', durum: 'uyari' },
  ogrenme: { ad: 'Öğrenme bölgesi', aralik: '0,80–0,90', eylem: 'Role yeni: bandın içinde hızlı ilerleme alanı', durum: 'gecti' },
  yetkin: { ad: 'Tam yetkin', aralik: '0,90–1,10', eylem: 'Piyasa orta noktası çevresi: çoğunluk burada olmalı', durum: 'gecti' },
  ileri: { ad: 'İleri düzey', aralik: '1,10–1,20', eylem: 'Çok kıdemli: kalıcı zam sınırlı, terfiye hazırlık', durum: 'gecti' },
  kirmizi: { ad: 'Kırmızı daire', aralik: '> 1,20', eylem: 'Bandı deldi: zam tek seferlik prim olur ya da terfi', durum: 'kaldi' },
};

export function bolge(compa: number): Bolge {
  if (compa < 0.8) return 'yesil';
  if (compa < 0.9) return 'ogrenme';
  if (compa <= 1.1) return 'yetkin';
  if (compa <= 1.2) return 'ileri';
  return 'kirmizi';
}

/* ---------- Liyakat zam matrisi ---------- */

/** Compa-ratio sütun sınırları: < 0,85 | 0,85–0,95 | 0,95–1,05 | 1,05–1,15 | ≥ 1,15 */
export const COMPA_SINIRLARI = [0.85, 0.95, 1.05, 1.15];
export const COMPA_ETIKETLERI = ['< 0,85', '0,85–0,95', '0,95–1,05', '1,05–1,15', '≥ 1,15'];
export const PERF_ADLARI = ['1 · Karşılamıyor', '2 · Kısmen', '3 · Karşılıyor', '4 · Üstünde', '5 · Olağanüstü'];

/** Satır: performans puanı 1…5, sütun: compa-ratio bandı; değer: zam yüzdesi. Ravio örneği gibi en yüksek %14. */
export const VARSAYILAN_MERIT: number[][] = [
  [0, 0, 0, 0, 0],
  [3, 2, 0, 0, 0],
  [7, 5, 3.5, 2, 0],
  [11, 9, 7, 5, 2],
  [14, 12, 10, 8, 4],
];

export const compaSutunu = (compa: number) => COMPA_SINIRLARI.filter((s) => compa >= s - 1e-9).length;

export function meritOrani(matris: number[][], puan: number, compa: number) {
  const satir = matris[sinirla(Math.round(puan), 1, 5) - 1] ?? [];
  return (satir[compaSutunu(compa)] ?? 0) / 100;
}

export interface MeritKisi {
  id: string;
  ad: string;
  /** Aylık ücret (baz birimin katı). */
  ucret: number;
  /** Band orta noktası (baz birimin katı). */
  orta: number;
  puan: number;
}

export const VARSAYILAN_MERIT_KISI: MeritKisi[] = [
  { id: 'a', ad: 'Kişi A', ucret: 1.9, orta: 2.2, puan: 4 },
  { id: 'b', ad: 'Kişi B', ucret: 2.45, orta: 2.2, puan: 4 },
  { id: 'c', ad: 'Kişi C', ucret: 2.1, orta: 2.2, puan: 3 },
  { id: 'd', ad: 'Kişi D', ucret: 1.7, orta: 2.2, puan: 5 },
  { id: 'e', ad: 'Kişi E', ucret: 2.7, orta: 2.2, puan: 5 },
  { id: 'f', ad: 'Kişi F', ucret: 2.95, orta: 2.7, puan: 2 },
  { id: 'g', ad: 'Kişi G', ucret: 2.55, orta: 2.7, puan: 3 },
  { id: 'h', ad: 'Kişi H', ucret: 3.1, orta: 2.7, puan: 4 },
];

export interface MeritSatir {
  kisi: MeritKisi;
  compa: number;
  oran: number;
  /** Bütçe ölçeği uygulanmış aylık artış (baz birim katı). */
  artis: number;
  kalici: number;
  yeni: number;
  tavan: number;
  /** Bandı aşan kısım: yıllık tek seferlik ödeme (12 ay). */
  tekSeferlik: number;
}

export function meritDagit(g: { kisiler: MeritKisi[]; matris: number[][]; havuzOrani: number; olcekle: boolean; yariGenislik: number }) {
  const ham = g.kisiler.map((k) => {
    const compa = k.orta > 0 ? k.ucret / k.orta : 0;
    const oran = meritOrani(g.matris, k.puan, compa);
    return { kisi: k, compa, oran, artis: k.ucret * oran };
  });
  const bordro = toplam(g.kisiler.map((k) => k.ucret));
  const havuz = bordro * g.havuzOrani;
  const hamToplam = toplam(ham.map((h) => h.artis));
  const olcek = g.olcekle && hamToplam > havuz && hamToplam > 0 ? havuz / hamToplam : 1;
  const satirlar: MeritSatir[] = ham.map((h) => {
    const artis = h.artis * olcek;
    const tavan = h.kisi.orta * (1 + g.yariGenislik);
    const kalici = Math.min(artis, Math.max(0, tavan - h.kisi.ucret));
    return { ...h, artis, kalici, yeni: h.kisi.ucret + kalici, tavan, tekSeferlik: (artis - kalici) * 12 };
  });
  return { satirlar, bordro, havuz, hamToplam, olcek, dagitilan: toplam(satirlar.map((s) => s.artis)) };
}

/* ---------- Yıllık zam motoru ---------- */

export interface ZamGirdi {
  ucret: number;
  orta: number;
  yariGenislik: number;
  /** Band (yapı) düzeltmesi: bantların piyasa/enflasyonla kayması. */
  yapi: number;
  /** Genel zam: herkese aynı oran. */
  genel: number;
  piyasaEsik: number;
  piyasaTavan: number;
  puan: number;
  kidemVar: boolean;
  kidemOrani: number;
  terfi: boolean;
  /** Terfi edilen seviyenin bugünkü orta noktası (baz birim katı). */
  terfiOrta: number;
  terfiMin: number;
  terfiMax: number;
  terfiCompa: number;
}

export interface ZamAdim {
  id: 'yapi' | 'genel' | 'piyasa' | 'merit' | 'kidem' | 'terfi';
  ad: string;
  tutar: number;
  aciklama: string;
}

export function yillikZam(g: ZamGirdi, matris: number[][]) {
  const adimlar: ZamAdim[] = [];
  let orta = g.orta * (1 + g.yapi);
  let ucret = g.ucret;
  const yuz = (v: number) => `%${yuvarla(v * 100, 1).toLocaleString('tr-TR')}`;

  const min = orta * (1 - g.yariGenislik);
  const yapiTutar = Math.max(0, min - ucret);
  adimlar.push({ id: 'yapi', ad: 'Yapı düzeltmesi', tutar: yapiTutar, aciklama: yapiTutar > 0 ? `Band ${yuz(g.yapi)} kaydı; ücret yeni band en azına çekildi` : `Band ${yuz(g.yapi)} kaydı; ücret bandın içinde, artış yok` });
  ucret += yapiTutar;

  const genelTutar = ucret * g.genel;
  adimlar.push({ id: 'genel', ad: 'Genel zam', tutar: genelTutar, aciklama: g.genel > 0 ? `Herkese ${yuz(g.genel)}` : 'Uygulanmadı' });
  ucret += genelTutar;

  const compa1 = bol(ucret, orta);
  const piyasaTutar = compa1 < g.piyasaEsik ? Math.max(0, Math.min(orta * g.piyasaEsik - ucret, ucret * g.piyasaTavan)) : 0;
  adimlar.push({
    id: 'piyasa',
    ad: 'Piyasa düzeltmesi',
    tutar: piyasaTutar,
    aciklama: piyasaTutar > 0 ? `Compa ${ondalik(compa1)} < ${ondalik(g.piyasaEsik)}: eşiğe kadar (en çok ${yuz(g.piyasaTavan)})` : `Compa ${ondalik(compa1)} ≥ eşik ${ondalik(g.piyasaEsik)}`,
  });
  ucret += piyasaTutar;

  const compa2 = bol(ucret, orta);
  const oran = meritOrani(matris, g.puan, compa2);
  const meritTutar = ucret * oran;
  adimlar.push({ id: 'merit', ad: 'Liyakat zammı', tutar: meritTutar, aciklama: `Puan ${g.puan} × compa ${ondalik(compa2)} → matris ${yuz(oran)}` });
  ucret += meritTutar;

  const kidemTutar = g.kidemVar ? ucret * g.kidemOrani : 0;
  adimlar.push({ id: 'kidem', ad: 'Kıdem adımı', tutar: kidemTutar, aciklama: g.kidemVar ? `Seviye değişmeden kademe: ${yuz(g.kidemOrani)}` : 'Bu yıl kademe yok' });
  ucret += kidemTutar;

  let terfiTutar = 0;
  let terfiNot = 'Terfi yok';
  if (g.terfi) {
    const yeniOrta = g.terfiOrta * (1 + g.yapi);
    const y = terfiYerlesimi({ ucret, yeniOrta, yariGenislik: g.yariGenislik, minArtis: g.terfiMin, maxArtis: g.terfiMax, hedefCompa: g.terfiCompa });
    terfiTutar = y.yeni - ucret;
    terfiNot = y.not;
    orta = yeniOrta;
  }
  adimlar.push({ id: 'terfi', ad: 'Terfi artışı', tutar: terfiTutar, aciklama: terfiNot });
  ucret += terfiTutar;

  const tavan = orta * (1 + g.yariGenislik);
  const kalici = Math.min(ucret, Math.max(tavan, g.ucret));
  const tasma = ucret - kalici;
  return { adimlar, yeniUcret: kalici, tekSeferlik: tasma * 12, orta, tavan, compa: bol(kalici, orta), artis: g.ucret > 0 ? kalici / g.ucret - 1 : 0 };
}

/* ---------- Dengeli performans karnesi ---------- */

export type Kapi = 'kalite' | 'uyum';

export interface KarneBoyut {
  id: string;
  ad: string;
  agirlik: number;
  kapi?: Kapi;
}

export interface KarneSablon {
  id: string;
  ad: string;
  boyutlar: KarneBoyut[];
}

export const KARNE_SABLONLARI: KarneSablon[] = [
  {
    id: 'genel',
    ad: 'Genel (her meslek)',
    boyutlar: [
      { id: 'sonuc', ad: 'İş sonucu', agirlik: 30 },
      { id: 'kalite', ad: 'Kalite ve yeniden iş', agirlik: 25, kapi: 'kalite' },
      { id: 'teslim', ad: 'Teslim güvenilirliği', agirlik: 20 },
      { id: 'isbirligi', ad: 'İşbirliği', agirlik: 15 },
      { id: 'gelisim', ad: 'Yetkinlik gelişimi', agirlik: 10 },
    ],
  },
  {
    id: 'yazilim',
    ad: 'Yazılım',
    boyutlar: [
      { id: 'sonuc', ad: 'Takım / iş sonucu', agirlik: 25 },
      { id: 'teslim', ad: 'Teslim ve öngörülebilirlik', agirlik: 20 },
      { id: 'kalite', ad: 'Kalite ve güvenilirlik', agirlik: 25, kapi: 'kalite' },
      { id: 'isbirligi', ad: 'İşbirliği ve sahiplenme', agirlik: 15 },
      { id: 'gelisim', ad: 'Yetkinlik gelişimi', agirlik: 15 },
    ],
  },
  {
    id: 'tasarim',
    ad: 'Tasarım ve video',
    boyutlar: [
      { id: 'sonuc', ad: 'Brief / iş sonucu', agirlik: 25 },
      { id: 'kalite', ad: 'Kalite ve revizyon', agirlik: 25, kapi: 'kalite' },
      { id: 'teslim', ad: 'Teslim güvenilirliği', agirlik: 20 },
      { id: 'yaratici', ad: 'Yaratıcı problem çözme', agirlik: 15 },
      { id: 'isbirligi', ad: 'İşbirliği', agirlik: 15 },
    ],
  },
  {
    id: 'ik',
    ad: 'İnsan kaynakları',
    boyutlar: [
      { id: 'sonuc', ad: 'Hizmet / iş sonucu', agirlik: 25 },
      { id: 'uyum', ad: 'Doğruluk ve uyum', agirlik: 25, kapi: 'uyum' },
      { id: 'paydas', ad: 'Paydaş sonucu', agirlik: 20 },
      { id: 'surec', ad: 'Süreç iyileştirme', agirlik: 15 },
      { id: 'isbirligi', ad: 'İşbirliği ve yetkinlik', agirlik: 15 },
    ],
  },
  {
    id: 'satis',
    ad: 'Satış',
    boyutlar: [
      { id: 'sonuc', ad: 'Gelir hedefi', agirlik: 35 },
      { id: 'tahsilat', ad: 'Kârlılık ve tahsilat', agirlik: 20 },
      { id: 'kalite', ad: 'Müşteri kalitesi (iptal, şikâyet)', agirlik: 20, kapi: 'kalite' },
      { id: 'surec', ad: 'Fırsat hattı disiplini', agirlik: 15 },
      { id: 'isbirligi', ad: 'İşbirliği', agirlik: 10 },
    ],
  },
];

export const VARSAYILAN_KARNE_PUAN: Record<string, number[]> = {
  genel: [105, 96, 110, 100, 95],
  yazilim: [104, 112, 92, 108, 100],
  tasarim: [110, 78, 105, 120, 100],
  ik: [100, 76, 104, 110, 100],
  satis: [126, 104, 98, 90, 100],
};

/** Skor bantları: 90–109 beklenen; prim/liyakat çarpanı (ChatGPT raporundaki örnek politika). */
export const SKOR_BANTLARI: { alt: number; ad: string; faktor: number; durum: Durum }[] = [
  { alt: -Infinity, ad: 'Çok düşük', faktor: 0, durum: 'kaldi' },
  { alt: 80, ad: 'Beklenti altı', faktor: 0.5, durum: 'uyari' },
  { alt: 90, ad: 'Beklenen', faktor: 1, durum: 'gecti' },
  { alt: 110, ad: 'Güçlü', faktor: 1.15, durum: 'gecti' },
  { alt: 120, ad: 'Olağanüstü', faktor: 1.3, durum: 'gecti' },
];

export const skorBandi = (skor: number) => [...SKOR_BANTLARI].reverse().find((b) => skor >= b.alt) ?? SKOR_BANTLARI[0];

export type PrimDurumu = 'uygun' | 'yok' | 'inceleme';

export function karneSkoru(boyutlar: KarneBoyut[], puanlar: number[], kritikOlay: boolean) {
  const agirlik = toplam(boyutlar.map((b) => Math.max(0, b.agirlik)));
  const katki = boyutlar.map((b, i) => (agirlik ? (Math.max(0, b.agirlik) / agirlik) * (puanlar[i] ?? 0) : 0));
  const ham = toplam(katki);
  const kaliteKaldi = boyutlar.some((b, i) => b.kapi === 'kalite' && (puanlar[i] ?? 0) < 80);
  const uyumKaldi = boyutlar.some((b, i) => b.kapi === 'uyum' && (puanlar[i] ?? 0) < 80);
  const skor = kaliteKaldi ? Math.min(ham, 100) : ham;
  const prim: PrimDurumu = kritikOlay ? 'inceleme' : uyumKaldi ? 'yok' : 'uygun';
  const bant = skorBandi(skor);
  return { katki, ham, skor, kaliteKaldi, uyumKaldi, prim, bant, faktor: prim === 'uygun' ? bant.faktor : 0 };
}

/* ---------- Sprint teslim skoru ---------- */

export interface Sprint {
  id: string;
  ad: string;
  taahhut: number;
  kabul: number;
  geriDonen: number;
  kacanHata: number;
  hedef: boolean;
  /** Story point: yalnız şişme denetimi için; skora girmez. */
  sp: number;
}

export interface SprintAyar {
  wTeslim: number;
  wKalite: number;
  wTakim: number;
  hataAgirligi: number;
  hedefYoksa: number;
  teslimTavan: number;
  sismeEsik: number;
  akisEsik: number;
  pencere: number;
}

export const VARSAYILAN_SPRINT_AYAR: SprintAyar = {
  wTeslim: 50,
  wKalite: 30,
  wTakim: 20,
  hataAgirligi: 2,
  hedefYoksa: 60,
  teslimTavan: 120,
  sismeEsik: 0.25,
  akisEsik: 0.1,
  pencere: 3,
};

export const VARSAYILAN_SPRINTLER: Sprint[] = [
  { id: 's1', ad: 'Sprint 1', taahhut: 12, kabul: 11, geriDonen: 1, kacanHata: 0, hedef: true, sp: 34 },
  { id: 's2', ad: 'Sprint 2', taahhut: 12, kabul: 12, geriDonen: 0, kacanHata: 1, hedef: true, sp: 36 },
  { id: 's3', ad: 'Sprint 3', taahhut: 13, kabul: 11, geriDonen: 2, kacanHata: 0, hedef: false, sp: 35 },
  { id: 's4', ad: 'Sprint 4', taahhut: 12, kabul: 12, geriDonen: 1, kacanHata: 0, hedef: true, sp: 37 },
  { id: 's5', ad: 'Sprint 5', taahhut: 12, kabul: 12, geriDonen: 1, kacanHata: 0, hedef: true, sp: 48 },
  { id: 's6', ad: 'Sprint 6', taahhut: 14, kabul: 14, geriDonen: 0, kacanHata: 0, hedef: true, sp: 47 },
];

export function sprintSkoru(s: Sprint, a: SprintAyar) {
  const teslim = Math.min(a.teslimTavan, (s.kabul / Math.max(1, s.taahhut)) * 100);
  const kalite = Math.max(0, 100 - (100 * (s.geriDonen + a.hataAgirligi * s.kacanHata)) / Math.max(1, s.kabul));
  const takim = s.hedef ? 100 : a.hedefYoksa;
  const w = Math.max(0, a.wTeslim) + Math.max(0, a.wKalite) + Math.max(0, a.wTakim);
  const skor = w ? (Math.max(0, a.wTeslim) * teslim + Math.max(0, a.wKalite) * kalite + Math.max(0, a.wTakim) * takim) / w : 0;
  return { teslim, kalite, takim, skor };
}

export function sprintSerisi(sprintler: Sprint[], a: SprintAyar) {
  const pencere = Math.max(1, Math.round(a.pencere));
  const skorlar = sprintler.map((s) => sprintSkoru(s, a));
  return sprintler.map((s, i) => {
    const onceki = sprintler.slice(Math.max(0, i - pencere), i);
    const yeter = onceki.length >= pencere;
    const spOrt = ortalama(onceki.map((x) => x.sp));
    const kabulOrt = ortalama(onceki.map((x) => x.kabul));
    const spArtis = yeter && spOrt > 0 ? s.sp / spOrt - 1 : null;
    const akisArtis = yeter && kabulOrt > 0 ? s.kabul / kabulOrt - 1 : null;
    const sisme = spArtis !== null && akisArtis !== null && spArtis > a.sismeEsik && akisArtis < a.akisEsik;
    const son = skorlar.slice(Math.max(0, i - pencere + 1), i + 1).map((x) => x.skor);
    return { sprint: s, ...skorlar[i], kayan: ortalama(son), spArtis, akisArtis, sisme };
  });
}

/* ---------- Prim ödeme eğrisi ---------- */

export interface PrimEgrisi {
  /** Hedef prim: aylık tabanın yüzdesi (0,15 = %15). */
  hedefPrim: number;
  esik: number;
  /** Eşikte ödeme: hedef primin oranı (0,5 = %50). */
  esikOdeme: number;
  hedef: number;
  tavan: number;
  tavanOdeme: number;
  /** 0 = doğrusal; > 0 = bu adımla kademeli (skor aşağı yuvarlanır). */
  kademe: number;
}

export const EGRI_ONAYARLARI: Record<string, { ad: string; dayanak: string; egri: PrimEgrisi }> = {
  onerilen: {
    ad: 'Önerilen (hedef %15, tavan 2 ×)',
    dayanak: '%90 altı prim yok, %100 hedef, %130’da 2 ×: en çok tabanın %30’u (ilk modeldeki üst sınır)',
    egri: { hedefPrim: 0.15, esik: 90, esikOdeme: 0.5, hedef: 100, tavan: 130, tavanOdeme: 2, kademe: 0 },
  },
  ilk: {
    ad: 'İlk model (%110 üstü, en çok %30)',
    dayanak: 'Şirketin ilk taslağı: %90–110 normal, %110’dan sonra prim, %30 tavan; kesinti yerine prim sıfır',
    egri: { hedefPrim: 0.3, esik: 110, esikOdeme: 0, hedef: 140, tavan: 140, tavanOdeme: 1, kademe: 0 },
  },
  genis: {
    ad: 'Geniş aralık (%0–200)',
    dayanak: 'Microsoft’ta beyan edilen %0–200 ödeme aralığına benzer örnek eğri',
    egri: { hedefPrim: 0.15, esik: 80, esikOdeme: 0.25, hedef: 100, tavan: 150, tavanOdeme: 2, kademe: 0 },
  },
  kademeli: {
    ad: 'Kademeli (10 puanlık basamak)',
    dayanak: 'Aynı eğri, skor 10’un katına aşağı yuvarlanır: küçük oynamalar ödemeyi değiştirmez',
    egri: { hedefPrim: 0.15, esik: 90, esikOdeme: 0.5, hedef: 100, tavan: 130, tavanOdeme: 2, kademe: 10 },
  },
};

const ara = (x: number, x0: number, x1: number, y0: number, y1: number) => (x1 <= x0 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0));

/** Hedef primin oranı (0…tavanOdeme). Kalite kapısı kaldıysa en çok %50. */
export function primOrani(e: PrimEgrisi, skorHam: number, kaliteGecti = true) {
  const skor = e.kademe > 0 ? Math.floor(skorHam / e.kademe) * e.kademe : skorHam;
  const hedef = Math.max(e.esik, e.hedef);
  const tavan = Math.max(hedef, e.tavan);
  let oran: number;
  if (skor < e.esik) oran = 0;
  else if (skor < hedef) oran = ara(skor, e.esik, hedef, e.esikOdeme, 1);
  else if (skor < tavan) oran = ara(skor, hedef, tavan, 1, e.tavanOdeme);
  else oran = e.tavanOdeme;
  return kaliteGecti ? oran : Math.min(oran, 0.5);
}

/* ---------- Şirket × takım × birey prim havuzu ---------- */

export interface Basamak {
  alt: number;
  carpan: number;
}

export const SIRKET_BASAMAK: Basamak[] = [
  { alt: 0, carpan: 0 },
  { alt: 80, carpan: 0.5 },
  { alt: 90, carpan: 0.8 },
  { alt: 100, carpan: 1 },
  { alt: 110, carpan: 1.2 },
  { alt: 120, carpan: 1.5 },
];

export const TAKIM_BASAMAK: Basamak[] = [
  { alt: 0, carpan: 0.8 },
  { alt: 90, carpan: 0.9 },
  { alt: 100, carpan: 1 },
  { alt: 110, carpan: 1.1 },
  { alt: 120, carpan: 1.2 },
];

export const basamakCarpani = (basamaklar: Basamak[], sonuc: number) => [...basamaklar].sort((a, b) => b.alt - a.alt).find((b) => sonuc >= b.alt)?.carpan ?? 0;

export interface PrimKisi {
  id: string;
  ad: string;
  ucret: number;
  takim: string;
  skor: number;
}

export const VARSAYILAN_PRIM_KISI: PrimKisi[] = [
  { id: 'a', ad: 'Kişi A', ucret: 2.2, takim: 'Ürün', skor: 104 },
  { id: 'b', ad: 'Kişi B', ucret: 2.6, takim: 'Ürün', skor: 118 },
  { id: 'c', ad: 'Kişi C', ucret: 1.8, takim: 'Ürün', skor: 86 },
  { id: 'd', ad: 'Kişi D', ucret: 2.4, takim: 'Kreatif', skor: 112 },
  { id: 'e', ad: 'Kişi E', ucret: 1.9, takim: 'Kreatif', skor: 95 },
  { id: 'f', ad: 'Kişi F', ucret: 3, takim: 'Kreatif', skor: 124 },
];

export function primHavuzu(g: { kisiler: PrimKisi[]; hedefPrim: number; sirketSonuc: number; takimSonuc: Record<string, number>; bireyTavan: number; sabitHavuz: boolean; havuz: number }) {
  const sirket = basamakCarpani(SIRKET_BASAMAK, g.sirketSonuc);
  const ham = g.kisiler.map((k) => {
    const yillik = k.ucret * 12;
    const hedef = yillik * g.hedefPrim;
    const takim = basamakCarpani(TAKIM_BASAMAK, g.takimSonuc[k.takim.trim()] ?? 100);
    const birey = Math.min(skorBandi(k.skor).faktor, g.bireyTavan);
    return { kisi: k, hedef, sirket, takim, birey, ham: hedef * sirket * takim * birey };
  });
  const hamToplam = toplam(ham.map((h) => h.ham));
  const olcek = g.sabitHavuz && hamToplam > 0 ? g.havuz / hamToplam : 1;
  const satirlar = ham.map((h) => ({ ...h, odeme: h.ham * olcek }));
  return { satirlar, sirket, hedefToplam: toplam(ham.map((h) => h.hedef)), hamToplam, olcek, odenen: toplam(satirlar.map((s) => s.odeme)) };
}

/* ---------- Terfi kapısı ---------- */

/** SFIA sorumluluk faktörleri: seviyeyi otonomi, etki, karmaşıklık, bilgi ve iletişim belirler. */
export const TERFI_KRITERLERI = ['Otonomi', 'Etki', 'Karmaşıklık', 'Bilgi', 'İletişim ve liderlik'];

export interface TerfiGirdi {
  donem1: boolean[];
  donem2: boolean[];
  gerekenKriter: number;
  seviyedeAy: number;
  gerekenAy: number;
  perf1: number;
  perf2: number;
  perfAlt: number;
  perfUst: number;
  kaliteGecti: boolean;
  acikPozisyon: boolean;
}

export type Durum = 'gecti' | 'uyari' | 'kaldi';

export function terfiKapisi(g: TerfiGirdi, hat: Hat) {
  const d1 = g.donem1.filter(Boolean).length;
  const d2 = g.donem2.filter(Boolean).length;
  const kosullar: { ad: string; deger: string; gecti: boolean }[] = [
    { ad: 'Yazılı rubrik: iki ardışık dönemde gösterildi', deger: `${d1} / ${d2} kriter (gereken ${g.gerekenKriter})`, gecti: d1 >= g.gerekenKriter && d2 >= g.gerekenKriter },
    { ad: 'Seviyede en az süre', deger: `${g.seviyedeAy} ay (gereken ${g.gerekenAy})`, gecti: g.seviyedeAy >= g.gerekenAy },
    { ad: 'Son iki dönem performansı', deger: `${g.perf1} ve ${g.perf2} (ikisi ≥ ${g.perfAlt}, biri ≥ ${g.perfUst})`, gecti: Math.min(g.perf1, g.perf2) >= g.perfAlt && Math.max(g.perf1, g.perf2) >= g.perfUst },
    { ad: 'Kalite kapısı', deger: g.kaliteGecti ? 'Geçti' : 'Kaldı', gecti: g.kaliteGecti },
  ];
  if (hat === 'M') kosullar.push({ ad: 'Yönetici hattında açık pozisyon', deger: g.acikPozisyon ? 'Var' : 'Yok', gecti: g.acikPozisyon });
  const eksik = kosullar.filter((k) => !k.gecti).length;
  const karar: Durum = eksik === 0 ? 'gecti' : eksik === 1 ? 'uyari' : 'kaldi';
  return { kosullar, eksik, karar };
}

/** Yeni banda yerleşim: en az terfi artışı, yeni band en azı ve hedef compa’nın büyüğü; en çok terfi artışıyla sınırlı. */
export function terfiYerlesimi(g: { ucret: number; yeniOrta: number; yariGenislik: number; minArtis: number; maxArtis: number; hedefCompa: number }) {
  const yeniMin = g.yeniOrta * (1 - g.yariGenislik);
  const teklif = Math.max(g.ucret * (1 + g.minArtis), yeniMin, g.yeniOrta * g.hedefCompa);
  const tavan = g.ucret * (1 + g.maxArtis);
  const yeni = Math.max(Math.min(teklif, tavan), yeniMin, g.ucret);
  const compa = bol(yeni, g.yeniOrta);
  const not =
    tavan < yeniMin
      ? 'En çok terfi artışı yeni bandın en azına yetmiyor: band en azı uygulandı'
      : teklif > tavan
        ? `Teklif en çok terfi artışıyla sınırlandı (compa ${ondalik(compa)})`
        : `Yeni bandın alt-orta bölgesine yerleşti (compa ${ondalik(compa)})`;
  return { yeni, yeniMin, teklif, tavan, artis: g.ucret > 0 ? yeni / g.ucret - 1 : 0, compa, not };
}

/* ---------- Kademe adımları (zamana bağlı ilerleme) ---------- */

export interface AdimGirdi {
  adet: number;
  /** Adım oranı: 1. kademe tutarının yüzdesi (sabit tutar) ya da bir önceki kademenin (bileşik). */
  oran: number;
  bilesik: boolean;
  /** Kademeler arası bekleme (ay); i. öğe i+1 → i+2 geçişi. */
  bekleme: number[];
  /** Üstün performans: bu geçişte bekleme yok. */
  hizli: boolean[];
}

/** ABD General Schedule: 1–4 arası 52, 4–7 arası 104, 7–10 arası 156 hafta (toplam 18 yıl). */
export const GS_BEKLEME = [12, 12, 12, 24, 24, 24, 36, 36, 36];

export function kademeAdimlari(g: AdimGirdi) {
  const adet = sinirla(Math.round(g.adet), 2, 15);
  let ay = 0;
  let carpan = 1;
  return Array.from({ length: adet }, (_, i) => {
    if (i > 0) {
      const bekle = g.hizli[i - 1] ? 0 : (g.bekleme[i - 1] ?? g.bekleme[g.bekleme.length - 1] ?? 12);
      ay += bekle;
      carpan = g.bilesik ? carpan * (1 + g.oran) : 1 + g.oran * i;
    }
    return { kademe: i + 1, ay, carpan, adimArtis: i > 0 ? (g.bilesik ? g.oran : g.oran / (1 + g.oran * (i - 1))) : null, hizli: i > 0 && !!g.hizli[i - 1] };
  });
}

/* ---------- Kâr paylaşımı ve akran ödülü ---------- */

export interface KarKisi {
  id: string;
  ad: string;
  ucret: number;
  kidem: number;
}

export const VARSAYILAN_KAR_KISI: KarKisi[] = [
  { id: 'a', ad: 'Kişi A', ucret: 2.2, kidem: 3.5 },
  { id: 'b', ad: 'Kişi B', ucret: 2.6, kidem: 1.2 },
  { id: 'c', ad: 'Kişi C', ucret: 1.8, kidem: 2 },
  { id: 'd', ad: 'Kişi D', ucret: 2.4, kidem: 4 },
  { id: 'e', ad: 'Kişi E', ucret: 1.9, kidem: 0.8 },
  { id: 'f', ad: 'Kişi F', ucret: 3, kidem: 6 },
];

export type KarYontemi = 'oransal' | 'esit' | 'karma';

/**
 * Havuz uygun kişilere ağırlıkla dağıtılır; tavanı aşan pay tavanda sabitlenir ve fazlası kalanlara yeniden dağıtılır
 * (herkes tavandaysa kalan devreder).
 */
export function karPaylasimi(g: { kisiler: KarKisi[]; havuz: number; kidemSarti: number; yontem: KarYontemi; tavan: number }) {
  const uygun = g.kisiler.filter((k) => k.kidem >= g.kidemSarti);
  const yillik = (k: KarKisi) => k.ucret * 12;
  const tabanToplam = toplam(uygun.map(yillik));
  const agirlik = (k: KarKisi) => {
    const oransal = tabanToplam ? yillik(k) / tabanToplam : 0;
    const esit = uygun.length ? 1 / uygun.length : 0;
    return g.yontem === 'oransal' ? oransal : g.yontem === 'esit' ? esit : (oransal + esit) / 2;
  };
  const pay = new Map<string, number>();
  const sabit = new Set<string>();
  let kalan = g.havuz;
  for (let tur = 0; tur < uygun.length + 1 && kalan > 1e-9; tur++) {
    const acik = uygun.filter((k) => !sabit.has(k.id));
    const w = toplam(acik.map(agirlik));
    if (!acik.length || w <= 0) break;
    let tasma = false;
    const dagit = kalan;
    for (const k of acik) {
      const onceki = pay.get(k.id) ?? 0;
      const ek = (dagit * agirlik(k)) / w;
      const tavan = yillik(k) * g.tavan;
      if (onceki + ek >= tavan - 1e-9) {
        pay.set(k.id, tavan);
        sabit.add(k.id);
        kalan -= tavan - onceki;
        tasma = true;
      } else {
        pay.set(k.id, onceki + ek);
        kalan -= ek;
      }
    }
    if (!tasma) break;
  }
  const satirlar = g.kisiler.map((k) => ({ kisi: k, uygun: k.kidem >= g.kidemSarti, pay: pay.get(k.id) ?? 0, tavanda: sabit.has(k.id), tabanOrani: bol(pay.get(k.id) ?? 0, yillik(k)) }));
  return { satirlar, dagitilan: toplam(satirlar.map((s) => s.pay)), kalan: Math.max(0, kalan) };
}

/* ---------- Yapı denetimi ---------- */

export interface Kontrol {
  ad: string;
  deger: string;
  durum: Durum;
  aciklama: string;
  dayanak: string;
}

const yuzde = (v: number) => `%${yuvarla(v * 100, 1).toLocaleString('tr-TR')}`;
const kat = (v: number) => `${yuvarla(v).toLocaleString('tr-TR')} ×`;
const derecele = (v: number, iyi: [number, number], kabul: [number, number]): Durum =>
  v >= iyi[0] - 1e-9 && v <= iyi[1] + 1e-9 ? 'gecti' : v >= kabul[0] - 1e-9 && v <= kabul[1] + 1e-9 ? 'uyari' : 'kaldi';

export function yapiDenetimi(g: { meslekler: Meslek[]; seviyeler: Seviye[]; kademe: KademeGirdi; tabanCarpani: number }): Kontrol[] {
  const hucreler = g.meslekler.flatMap((m) => (m.uzmanliklar.length ? m.uzmanliklar : [undefined]).flatMap((u) => g.seviyeler.map((s) => hucreCarpani(m, u, s))));
  const enAz = hucreler.length ? Math.min(...hucreler) : 0;
  const enCok = hucreler.length ? Math.max(...hucreler) : 0;
  const ic = g.seviyeler.filter((s) => s.hat === 'IC');
  const yonetim = g.seviyeler.filter((s) => s.hat === 'M');
  const adimlar = ic.slice(1).map((s, i) => (ic[i].carpan > 0 ? s.carpan / ic[i].carpan - 1 : 0));
  const enBuyukAdim = adimlar.length ? Math.max(...adimlar) : 0;
  const girisKidemli = ic.length >= 3 && ic[0].carpan > 0 ? ic[2].carpan / ic[0].carpan : null;
  const enUstUzman = ic[ic.length - 1];
  const hedefYonetici = yonetim[Math.min(1, yonetim.length - 1)];
  const enBuyukUzmanlik = Math.max(1, ...g.meslekler.flatMap((m) => m.uzmanliklar.map((u) => u.carpan)));
  const h = g.kademe.yariGenislik;
  const kontroller: Kontrol[] = [
    {
      ad: 'En yüksek / en düşük ücret oranı',
      deger: enAz > 0 ? `${yuvarla(enCok / enAz, 1).toLocaleString('tr-TR')} : 1` : '—',
      durum: enAz > 0 ? derecele(enCok / enAz, [0, 6], [0, 9]) : 'kaldi',
      aciklama: 'Katalogdaki tüm hücreler (meslek × uzmanlık × seviye) arasında',
      dayanak: 'Mondragon kooperatifleri 1:6 (bazı üst yöneticilerde 9:1)',
    },
    {
      ad: 'Uzman hattında en büyük seviye sıçraması',
      deger: adimlar.length ? yuzde(enBuyukAdim) : '—',
      durum: adimlar.length ? derecele(enBuyukAdim, [0, 0.25], [0, 0.35]) : 'uyari',
      aciklama: 'Bir seviyeden diğerine çarpan artışı; büyük sıçrama terfiyi pahalı ve tartışmalı yapar',
      dayanak: 'GitLab, Buffer, 37signals: seviye başına %13–25',
    },
    {
      ad: 'Girişten kıdemliye (1. → 3. seviye)',
      deger: girisKidemli === null ? 'Üç seviye yok' : kat(girisKidemli),
      durum: girisKidemli === null ? 'uyari' : derecele(girisKidemli, [0, 1.6], [0, 2]),
      aciklama: 'İlk modelde yazılım için 2,5 ×',
      dayanak: 'GitLab 1,5 × · Buffer 1,3 × · 37signals ≈ 1,36 ×',
    },
    {
      ad: 'Uzman hattı yönetici hattına yetişiyor',
      deger: enUstUzman && hedefYonetici ? `${enUstUzman.kod} ${kat(enUstUzman.carpan)} · ${hedefYonetici.kod} ${kat(hedefYonetici.carpan)}` : 'Yönetici hattı yok',
      durum: enUstUzman && hedefYonetici && enUstUzman.carpan >= hedefYonetici.carpan - 1e-9 ? 'gecti' : 'uyari',
      aciklama: 'En üst uzman seviyesi en az ikinci yönetici seviyesi kadar ödemeli: iyi bir uzman daha çok kazanmak için yönetici olmak zorunda kalmamalı',
      dayanak: 'Radford / WTW paralel P ve M hatları; Google, Meta staff/principal seviyeleri',
    },
    {
      ad: 'En büyük uzmanlık çarpanı',
      deger: kat(enBuyukUzmanlik),
      durum: derecele(enBuyukUzmanlik, [0, 1.2], [0, 1.3]),
      aciklama: 'Uzmanlık primi gizli bir seviyeye dönüşmemeli; büyük fark ayrı seviye ister',
      dayanak: 'Buffer rol çarpanı (+%10); full stack örneği +%12–15',
    },
    {
      ad: 'Taban sınırı',
      deger: `${kat(enAz)} ≥ ${kat(g.tabanCarpani)}`,
      durum: enAz >= g.tabanCarpani - 1e-9 ? 'gecti' : 'kaldi',
      aciklama: 'En düşük hücre baz birimin taban katının altına düşmemeli (asgari ücret yalnız taban sınırı)',
      dayanak: 'Asgari ücret çarpan birimi değil, alt sınır olarak',
    },
    {
      ad: 'Dereceler arası orta nokta ilerlemesi',
      deger: yuzde(g.kademe.oran),
      durum: derecele(g.kademe.oran, [0.1, 0.2], [0.05, 0.25]),
      aciklama: 'Kademe serisi applet’indeki geometrik ilerleme',
      dayanak: 'Mercer %10–20; WorldatWork en yaygın %10–14',
    },
    {
      ad: 'Band genişliği (yayılım)',
      deger: yuzde(yayilim(h)),
      durum: derecele(yayilim(h), [0.4, 0.6], [0.3, 0.7]),
      aciklama: 'En az → en çok; profesyonel işler',
      dayanak: 'Mercer %40–60; profesyonel işlerde %40–50',
    },
    {
      ad: 'Komşu bant örtüşmesi',
      deger: yuzde(ortusme(h, g.kademe.oran)),
      durum: derecele(ortusme(h, g.kademe.oran), [0.25, 0.5], [0.15, 0.65]),
      aciklama: `Örtüşme %50 için ilerleme ${yuzde(Math.max(0, ilerlemeIcin(h, 0.5)))} olmalı`,
      dayanak: 'Yaygın aralık %25–50',
    },
  ];
  return kontroller;
}

/* ---------- Toplam hedef nakit ---------- */

/** Değişken payı: toplam hedef nakdin yüzdesi (85 sabit + 15 prim = 100 örneği). */
export const VARSAYILAN_KARISIM: Record<string, number> = { P1: 5, P2: 8, P3: 10, P4: 12, P5: 15, P6: 18, M1: 12, M2: 15, M3: 20, M4: 25 };

export function toplamOdul(g: { meslek: Meslek; uzmanlik: Uzmanlik | undefined; seviyeler: Seviye[]; karisim: Record<string, number>; egitim: number; ekipman: number; saglik: number }) {
  return g.seviyeler.map((s) => {
    const aylik = hucreCarpani(g.meslek, g.uzmanlik, s);
    const yillik = aylik * 12;
    const degisken = sinirla(g.karisim[s.kod] ?? 10, 0, 90) / 100;
    const ttc = yillik / (1 - degisken);
    const prim = ttc - yillik;
    const yanHak = g.egitim * s.carpan + g.ekipman + g.saglik;
    return { seviye: s, aylik, yillik, degisken, prim, primTabanOrani: yillik ? prim / yillik : 0, ttc, yanHak, toplam: ttc + yanHak };
  });
}

/* ---------- Varsayılan durum (tüm applet’ler) ---------- */

export interface AppletDurum {
  ortak: {
    bazKaynak: BazKaynak;
    ozelTutar: number;
    paraBirimi: ParaBirimi;
    tabanCarpani: number;
    meslekler: Meslek[];
    seviyeSeti: SeviyeSeti | 'ozel';
    seviyeler: Seviye[];
    lokasyonlar: Secenek[];
    lokasyonTaban: number;
    sozlesmeler: Secenek[];
  };
  matris: { gorunum: 'carpan' | 'tutar'; uzmanlik: Record<string, string> };
  kademe: KademeGirdi;
  degerleme: { faktorler: Faktor[]; pozisyonlar: Pozisyon[]; esikler: number[] };
  zincir: { meslekId: string; uzmanlikId: string; seviyeKod: string; lokasyonId: string; sozlesmeId: string; insanaOde: boolean; bandKonumu: number; saat: number };
  kbf: { meslekId: string; uzmanlikId: string; seviyeKod: string; yariGenislik: number; kriterler: KbfKriter[]; kisiler: KbfKisi[] };
  merit: { matris: number[][]; kisiler: MeritKisi[]; havuzOrani: number; olcekle: boolean; yariGenislik: number };
  zam: ZamGirdi;
  karne: { sablonId: string; puanlar: Record<string, number[]>; agirliklar: Record<string, number[]>; kritikOlay: boolean };
  sprint: { sprintler: Sprint[]; ayar: SprintAyar };
  egri: PrimEgrisi & { onayar: string; skor: number; kaliteGecti: boolean; ucret: number };
  ekip: { kisiler: PrimKisi[]; hedefPrim: number; sirketSonuc: number; takimSonuc: Record<string, number>; bireyTavan: number; sabitHavuz: boolean; havuz: number };
  terfi: TerfiGirdi & { meslekId: string; uzmanlikId: string; seviyeKod: string; compa: number; minArtis: number; maxArtis: number; hedefCompa: number };
  adim: AdimGirdi & { baslangic: number };
  kar: { kisiler: KarKisi[]; kar: number; havuzOrani: number; kidemSarti: number; yontem: KarYontemi; tavan: number; akranTutar: number; akranKota: number };
  odul: { meslekId: string; uzmanlikId: string; karisim: Record<string, number>; egitim: number; ekipman: number; saglik: number };
}

export const VARSAYILAN: AppletDurum = {
  ortak: {
    bazKaynak: 'net',
    ozelTutar: 1000,
    paraBirimi: '€',
    tabanCarpani: 1,
    meslekler: VARSAYILAN_MESLEKLER,
    seviyeSeti: 'kademeli',
    seviyeler: SEVIYE_SETLERI.kademeli.seviyeler,
    lokasyonlar: VARSAYILAN_LOKASYONLAR,
    lokasyonTaban: 0.7,
    sozlesmeler: VARSAYILAN_SOZLESMELER,
  },
  matris: { gorunum: 'carpan', uzmanlik: { yazilim: 'backend', tasarim: 'grafik', ik: 'operasyon', satis: 'saha', pazarlama: 'icerik' } },
  kademe: { k1: 1.2, artim: 0.25, oran: 0.2, adet: 9, yariGenislik: 0.2 },
  degerleme: { faktorler: VARSAYILAN_FAKTORLER, pozisyonlar: VARSAYILAN_POZISYONLAR, esikler: VARSAYILAN_ESIKLER },
  zincir: { meslekId: 'yazilim', uzmanlikId: 'fullstack', seviyeKod: 'P3', lokasyonId: 'c', sozlesmeId: 'freelancer', insanaOde: false, bandKonumu: 1, saat: 160 },
  kbf: { meslekId: 'tasarim', uzmanlikId: 'video', seviyeKod: 'P2', yariGenislik: 0.2, kriterler: VARSAYILAN_KBF_KRITER, kisiler: VARSAYILAN_KBF_KISI },
  merit: { matris: VARSAYILAN_MERIT, kisiler: VARSAYILAN_MERIT_KISI, havuzOrani: 0.05, olcekle: true, yariGenislik: 0.2 },
  zam: {
    ucret: 2.05,
    orta: 2.3,
    yariGenislik: 0.2,
    yapi: 0.05,
    genel: 0,
    piyasaEsik: 0.9,
    piyasaTavan: 0.08,
    puan: 3,
    kidemVar: true,
    kidemOrani: 0.02,
    terfi: false,
    terfiOrta: 2.8,
    terfiMin: 0.08,
    terfiMax: 0.2,
    terfiCompa: 0.9,
  },
  karne: { sablonId: 'yazilim', puanlar: VARSAYILAN_KARNE_PUAN, agirliklar: Object.fromEntries(KARNE_SABLONLARI.map((s) => [s.id, s.boyutlar.map((b) => b.agirlik)])), kritikOlay: false },
  sprint: { sprintler: VARSAYILAN_SPRINTLER, ayar: VARSAYILAN_SPRINT_AYAR },
  egri: { ...EGRI_ONAYARLARI.onerilen.egri, onayar: 'onerilen', skor: 112, kaliteGecti: true, ucret: 2.2 },
  ekip: { kisiler: VARSAYILAN_PRIM_KISI, hedefPrim: 0.1, sirketSonuc: 102, takimSonuc: { Ürün: 96, Kreatif: 108 }, bireyTavan: 1.3, sabitHavuz: false, havuz: 30 },
  terfi: {
    meslekId: 'yazilim',
    uzmanlikId: 'backend',
    seviyeKod: 'P2',
    compa: 1.08,
    donem1: [true, true, true, false, true],
    donem2: [true, true, true, true, true],
    gerekenKriter: 4,
    seviyedeAy: 14,
    gerekenAy: 18,
    perf1: 112,
    perf2: 104,
    perfAlt: 100,
    perfUst: 110,
    kaliteGecti: true,
    acikPozisyon: false,
    minArtis: 0.08,
    maxArtis: 0.2,
    hedefCompa: 0.9,
  },
  adim: { adet: 10, oran: 0.0333, bilesik: false, bekleme: GS_BEKLEME, hizli: GS_BEKLEME.map(() => false), baslangic: 2 },
  kar: { kisiler: VARSAYILAN_KAR_KISI, kar: 120, havuzOrani: 0.1, kidemSarti: 2, yontem: 'karma', tavan: 0.5, akranTutar: 0.1, akranKota: 2 },
  odul: { meslekId: 'yazilim', uzmanlikId: 'backend', karisim: VARSAYILAN_KARISIM, egitim: 0.5, ekipman: 0.4, saglik: 0.6 },
};

/* ---------- Applet dizini ---------- */

export type Motor = 'rutbe' | 'zam' | 'efor' | 'denetim';

export const MOTORLAR: Record<Motor, string> = {
  rutbe: 'Rütbe motoru · sabit ücret',
  zam: 'Zam motoru · yıllık artış',
  efor: 'Efor motoru · performans ve prim',
  denetim: 'Denetim ve toplam ödül',
};

export const APPLETLER: { id: string; ad: string; soru: string; motor: Motor }[] = [
  { id: 'katalog', ad: 'Meslek ve seviye kataloğu', soru: 'Hangi meslekler, hangi seviyeler, hangi baz birim?', motor: 'rutbe' },
  { id: 'rutbe-matrisi', ad: 'Rütbe matrisi', soru: 'Meslek × seviye hücresi kaç baz birim eder?', motor: 'rutbe' },
  { id: 'kademe-serisi', ad: 'Kademe serisi ve bantlar', soru: 'Sabit +0,25 × mı, yüzde ilerleme mi? Bantlar ne kadar örtüşüyor?', motor: 'rutbe' },
  { id: 'is-degerleme', ad: 'İş değerleme puanı', soru: 'Pozisyon unvandan bağımsız hangi dereceye düşer?', motor: 'rutbe' },
  { id: 'taban-ucret', ad: 'Taban ücret zinciri', soru: 'Bir kişinin oranı hangi çarpanlardan oluşur?', motor: 'rutbe' },
  { id: 'band-konumu', ad: 'Band içi konum', soru: 'Aynı seviyedeki iki kişi bandın neresinde durmalı?', motor: 'rutbe' },
  { id: 'liyakat-matrisi', ad: 'Liyakat zam matrisi', soru: 'Zam bütçesi kime, hangi oranda gider?', motor: 'zam' },
  { id: 'yillik-zam', ad: 'Yıllık zam motoru', soru: 'Zam hangi bileşenlerden oluştu?', motor: 'zam' },
  { id: 'terfi-kapisi', ad: 'Terfi kapısı', soru: 'Terfiye hazır mı, yeni banda nereden girer?', motor: 'zam' },
  { id: 'kademe-adimlari', ad: 'Kademe adımları', soru: 'Seviye değişmeden zamanla nasıl ilerler?', motor: 'zam' },
  { id: 'performans-karnesi', ad: 'Dengeli performans karnesi', soru: 'Mesleğe göre performans nasıl puanlanır?', motor: 'efor' },
  { id: 'sprint-skoru', ad: 'Sprint teslim skoru', soru: 'Story point yerine ne ölçülür, şişme nasıl yakalanır?', motor: 'efor' },
  { id: 'prim-egrisi', ad: 'Prim ödeme eğrisi', soru: 'Skor primin yüzde kaçını öder?', motor: 'efor' },
  { id: 'prim-havuzu', ad: 'Şirket × takım × birey', soru: 'Ekip primi nasıl çarpılır ve havuza sığdırılır?', motor: 'efor' },
  { id: 'kar-paylasimi', ad: 'Kâr paylaşımı ve akran ödülü', soru: 'Kâr havuzu kıdemle kime, nasıl dağılır?', motor: 'efor' },
  { id: 'yapi-denetimi', ad: 'Yapı denetimi', soru: 'Model global örneklerin aralığında mı?', motor: 'denetim' },
  { id: 'toplam-odul', ad: 'Toplam hedef nakit', soru: 'Sabit, değişken ve yan haklar seviyeye göre nasıl karışır?', motor: 'denetim' },
];
