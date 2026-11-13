import kaynakVerisi from './gelir2027Kaynak.json' with { type: 'json' };
import { buildModel } from './model';
import { DEFAULT_PARAMS } from './params';
import { AYLAR_2027, POZISYONLAR, type Pozisyon, type SecenekId } from './istihdamV2';

/**
 * 2027 gelir öngörüsü: kadronun çalışma saati, verimi, riskleri ve satışa katkısı (kullanıcı kararı 2026-11-05).
 *
 * 1. Saat: 2027'de 249 iş günü vardır (261 hafta içi gün, 12 gün resmî tatil). Yasal üst sınır haftada 45 saattir. Plan
 *    40 saat sayar, aradaki 5 saat “çavuş payı”dır (verimsizlik payı). Yıllık izin, hastalık, grip, regl dönemi ve
 *    mazeret izinleri düşülür. Kalan sürenin bir kısmı verimli çalışmadır.
 * 2. Kapasite çarpanı: kişinin aylık verimli saati ÷ projenin tam kapasite tanımı (ayda net 125 saat, istihdamPlani.ts).
 * 3. Satış: doğrudan katkı (saha, masa başı, organizatör, kurumsal satış, dijital) yeni aktif satıcı getirir. Dolaylı
 *    katkı (satıcı başarısı, destek, alıcı talebi) aylık elde tutmayı artırır. Gelir motoru gelir planıyla aynıdır
 *    (revenue.ts simulate: aylık ve yıllık peşin ödeme, aylık yenileme, kurla büyüyen ₺ fiyat).
 * 4. Risk: Monte Carlo (sabit tohumlu, tekrarlanabilir). Kötümser = yüzde 10 noktası, ortanca = yüzde 50 noktası,
 *    iyimser = yüzde 90 noktası. Medyan (plan) = risklerin beklenen değeriyle tek hesap.
 * Kaynaklar `gelir2027Kaynak.json` içindedir. Kaynağı olmayan katkı oranları açıkça varsayım olarak yazılır.
 */

export interface KaynakKalemi {
  id: string;
  konu: string;
  deger: number | string;
  /** Okura gösterilen değer: yalın Türkçe, tarih “1 Mayıs 2027, Cumartesi” biçiminde, ondalık virgülle. */
  metin: string;
  birim?: string;
  aralik?: string;
  kaynaklar: { ad: string; url: string; tarih: string }[];
  aciklama: string;
  tahmin: boolean;
}
export const KAYNAKLAR: KaynakKalemi[] = (kaynakVerisi as unknown as { kalemler: KaynakKalemi[] }).kalemler;

/* ---------- 1. Takvim ve saat ---------- */

/** 2027 iş günleri (hafta içi günler eksi resmî tatil, yarım gün 0,5). Toplam 249. */
export const IS_GUNU = [20, 20, 19.5, 21, 18, 22, 21, 21, 22, 19.5, 22, 23];
export const HAFTA_ICI = 261;
export const YASAL_HAFTA = 45;
export const PLAN_HAFTA = 40;
/** Projenin tam kapasite tanımı: ayda net 125 verimli saat (istihdamPlani.ts NET_SAAT). */
export const REFERANS_SAAT = 125;
/** Yıllık izin (4857 sayılı Kanun, 1 ile 5 yıl: 14 iş günü) ayların payı: yaz yoğun. Toplam 14. */
const IZIN_DAGILIMI = [0.5, 0.5, 1, 1, 1, 1.5, 2.5, 3, 1, 0.5, 0.5, 1];
/** Grip vakalarının sezona dağılımı (Aralık ile Mart). */
const GRIP_DAGILIMI = [0.35, 0.25, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0.3];

export type ReglPolitikasi = 'yok' | 'evden' | 'izin' | 'ikisi';
export const REGL_POLITIKA_ADI: Record<ReglPolitikasi, string> = {
  yok: 'Politika yok',
  evden: 'Evden çalışma',
  izin: 'Ücretli izin',
  ikisi: 'Evden çalışma ya da ücretli izin',
};

/** Varsayımlar: medyan değer ve olası aralık. Kaynaklı olanların kimliği `kaynak` alanındadır. */
export interface Aralik {
  dusuk: number;
  medyan: number;
  yuksek: number;
}
export const VARSAYIM = {
  /** 40 saatin verimli çalışmaya giden payı (toplantı, mesaj, ara ve kesintiler dışı). */
  verim: { dusuk: 0.65, medyan: 0.75, yuksek: 0.85 } as Aralik,
  /** Hastalık günü, kişi başı yıl (grip hariç). Kaynak: hastalik.turkiye_gun, öneri 4 ile 8. */
  hastalik: { dusuk: 4, medyan: 6, yuksek: 8 } as Aralik,
  /** Grip sezonu atak oranı (yetişkin yüzde 5,1, işyeri ve müşteri teması için daha yüksek alınır). */
  grip: { dusuk: 0.05, medyan: 0.08, yuksek: 0.15 } as Aralik,
  /** Grip vakası başına kayıp gün eşdeğeri: 2,5 gün devamsızlık ve hasta çalışılan günlerin verim kaybı. */
  gripGun: 3.5,
  /** Mazeret izinleri (evlilik, ölüm, babalık ve benzeri), kişi başı yıl ortalaması. Varsayım. */
  mazeret: 1,
  /** Planlama varsayımı: kadroda kadın oranı. Gerçek oran bilinmiyor, kişi bazında değerlendirme yapılmaz. */
  kadinOrani: 0.5,
  /** Yıllık işten ayrılma oranı: satış, saha ve destek rolleri (çağrı merkezi yüzde 45, genel yüzde 25 ile 30). */
  devirSatis: { dusuk: 0.2, medyan: 0.3, yuksek: 0.45 } as Aralik,
  devirDiger: { dusuk: 0.1, medyan: 0.15, yuksek: 0.25 } as Aralik,
  /** Ayrılan kişinin yerine yenisi bulunana kadar boş ay (ortalama 44 gün). */
  bosAy: 1.5,
  /** 2027'de işe alınacak kişinin gecikme olasılığı: 0, 1 ve 2 ay. */
  gecikme: [0.55, 0.3, 0.15],
  /** Satış etkinliği belirsizliği (dönüşüm, pazar tepkisi): log normal standart sapma. */
  satisSigma: 0.2,
  /** Elde tutma sapması (yüzde puan). */
  eldeTutmaSapma: { dusuk: -0.08, medyan: 0, yuksek: 0.05 } as Aralik,
  /** Büyük kesinti (deprem ve benzeri) yıllık olasılığı: İstanbul için 30 yılda yüzde 35 ile 47. */
  buyukKesinti: 0.015,
};

/**
 * Regl dönemine bağlı kişi başı yıllık kayıp gün eşdeğeri (yalnız kadın çalışanlar, toplam etkiye oranla girer).
 * Kaynak: Schoep 2019, kadın başı yılda 1,3 gün devamsızlık ve 8,9 gün toplam verim kaybı (23,2 gün yüzde 33 düşük
 * verim). Politikaların etkisi varsayımdır: evden çalışmada belirtili günlerdeki verim kaybı yüzde 33'ten 20'ye iner.
 * Ücretli izinde kadınların dörtte biri ayda 1 gün izin kullanır, o günler tam kayıp sayılır, kalan günlerde kayıp sürer.
 * İzin ve evden çalışma maaştan düşülmez, yalnız kapasiteye girer.
 */
export function reglKaybi(p: ReglPolitikasi, carpan = 1): number {
  const gun = 23.2;
  const izinGunu = 0.25 * 12;
  switch (p) {
    case 'yok':
      return 8.9 * carpan;
    case 'evden':
      return (0.65 + gun * 0.2) * carpan;
    case 'izin':
      return (izinGunu + (gun - izinGunu) * 0.33) * carpan;
    case 'ikisi':
      return (izinGunu + (gun - izinGunu) * 0.2) * carpan;
  }
}

export interface SaatGirdisi {
  verim: number;
  hastalik: number;
  grip: number;
  regl: ReglPolitikasi;
  reglCarpani: number;
}
export const MEDYAN_SAAT: SaatGirdisi = { verim: VARSAYIM.verim.medyan, hastalik: VARSAYIM.hastalik.medyan, grip: VARSAYIM.grip.medyan, regl: 'ikisi', reglCarpani: 1 };

export interface AySaati {
  isGunu: number;
  planSaat: number;
  izin: number;
  hastalik: number;
  grip: number;
  regl: number;
  mazeret: number;
  calisilan: number;
  verimli: number;
  /** Kapasite çarpanı: verimli saat ÷ 125. */
  carpan: number;
}

/** Ortalama bir çalışanın 2027 aylık saatleri (kayıplar ortalama, kadın oranıyla ağırlıklı). */
export function aySaatleri(g: SaatGirdisi = MEDYAN_SAAT): AySaati[] {
  const regl = (reglKaybi(g.regl, g.reglCarpani) * VARSAYIM.kadinOrani) / 12;
  return IS_GUNU.map((gun, i) => {
    const planSaat = gun * (PLAN_HAFTA / 5);
    const saat = PLAN_HAFTA / 5;
    const izin = IZIN_DAGILIMI[i] * saat;
    const hastalik = (g.hastalik / 12) * saat;
    const grip = g.grip * VARSAYIM.gripGun * GRIP_DAGILIMI[i] * saat;
    const reglS = regl * saat;
    const mazeret = (VARSAYIM.mazeret / 12) * saat;
    const calisilan = Math.max(0, planSaat - izin - hastalik - grip - reglS - mazeret);
    const verimli = calisilan * g.verim;
    return { isGunu: gun, planSaat, izin, hastalik, grip, regl: reglS, mazeret, calisilan, verimli, carpan: verimli / REFERANS_SAAT };
  });
}

export const toplam = (a: number[]) => a.reduce((t, v) => t + v, 0);

/** Yıllık saat dökümü: yasal üst sınır, çavuş payı, tatil, izin, hastalık, grip, regl, mazeret, verimsiz süre. */
export function yillikDokum(g: SaatGirdisi = MEDYAN_SAAT) {
  const a = aySaatleri(g);
  const isGunu = toplam(IS_GUNU);
  const yasal = isGunu * (YASAL_HAFTA / 5);
  const plan = toplam(a.map((x) => x.planSaat));
  const tatil = (HAFTA_ICI - isGunu) * (PLAN_HAFTA / 5);
  const sum = (k: keyof AySaati) => toplam(a.map((x) => x[k]));
  return {
    isGunu,
    yasal,
    cavusPayi: yasal - plan,
    tatil,
    plan,
    izin: sum('izin'),
    hastalik: sum('hastalik'),
    grip: sum('grip'),
    regl: sum('regl'),
    mazeret: sum('mazeret'),
    calisilan: sum('calisilan'),
    verimsiz: sum('calisilan') - sum('verimli'),
    verimli: sum('verimli'),
    aylikVerimli: sum('verimli') / 12,
    carpan: sum('verimli') / 12 / REFERANS_SAAT,
  };
}

/* ---------- 2. Kadro ve katkı ---------- */

const P = DEFAULT_PARAMS;
export type KatkiTuru = 'dogrudan' | 'dijital' | 'lider' | 'elde-tutma' | 'yok';
export interface Katki {
  tur: KatkiTuru;
  /** Tam kapasitede ayda yeni aktif satıcı (doğrudan) ya da aylık elde tutmaya puan (elde tutma). */
  deger: number;
  dayanak: string;
  varsayim: boolean;
}
/** Pozisyonların satışa katkısı. Listede olmayan pozisyonun doğrudan satış katkısı yoktur (destek ve yönetim). */
export const KATKI: Record<string, Katki> = {
  'istoc-saha-ekibi': { tur: 'dogrudan', deger: P.sahaActivesMonthly, dayanak: `Her saha personeli tam kapasitede ayda ${P.sahaActivesMonthly} yeni aktif satıcı getirir. Bu sayı “Parametreler” sayfasından gelir. Yan sütundaki sayı 2027 toplamıdır.`, varsayim: false },
  'ucuncu-saha-personeli': { tur: 'dogrudan', deger: P.sahaActivesMonthly, dayanak: 'Hesap, saha personeliyle aynı kurala dayanır.', varsayim: false },
  'ek-saha-personeli': { tur: 'dogrudan', deger: P.sahaActivesMonthly, dayanak: 'Hesap, saha personeliyle aynı kurala dayanır.', varsayim: false },
  'istoc-masa-basi': { tur: 'dogrudan', deger: P.crmActivesMonthly, dayanak: `Bu rol tam kapasitede ayda ${P.crmActivesMonthly} yeni aktif satıcı getirir. Bu sayı “Parametreler” sayfasından gelir. Yan sütundaki sayı 2027 toplamıdır.`, varsayim: false },
  'masa-basi-satis-uzmani-ek': { tur: 'dogrudan', deger: P.crmActivesMonthly, dayanak: 'Hesap, İstoç Pazarlama CRM uzmanı rolüyle aynı kurala dayanır.', varsayim: false },
  'etkinlik-organizatoru': { tur: 'dogrudan', deger: P.organizatorActivesMonthly, dayanak: `Organizatör ayda ${P.organizatorActivesMonthly} yeni aktif satıcı getirir. Bu sayı “Parametreler” sayfasından gelir. Yan sütundaki sayı 2027 toplamıdır.`, varsayim: false },
  'kurumsal-satis-yoneticisi': { tur: 'dogrudan', deger: 2, dayanak: 'Büyük müşterilerde satışın tamamlanması uzun sürer. Bu rol tam kapasitede ayda 2 yeni aktif satıcı getirir. Yan sütundaki sayı 2027 toplamıdır. Toplam, işe başlama ayına ve kapasiteye göre hesaplanır.', varsayim: true },
  'dijital-pazarlama-uzmani': { tur: 'dijital', deger: 1, dayanak: '“Gelir planı” sayfasındaki dijital satış kaynağı reklamdan ve ücretsiz içerikten oluşur. Bu kaynağın getirdiği satış bu kişinin çalışma saatine bağlıdır.', varsayim: false },
  'performans-pazarlama-uzmani': { tur: 'dijital', deger: 0.2, dayanak: 'Reklam verimini %20 artırır.', varsayim: true },
  'seo-icerik-uzmani': { tur: 'dogrudan', deger: 2, dayanak: 'İşe başladıktan 3 ay sonra ücretsiz arama sonuçlarından ayda 2 yeni aktif satıcı gelir.', varsayim: true },
  'satis-ekip-lideri': { tur: 'lider', deger: 0.1, dayanak: 'Saha satış uzmanlarının ve İstoç Pazarlama CRM uzmanının çıktısını %10 artırır.', varsayim: true },
  'satici-uyum-uzmani': { tur: 'elde-tutma', deger: 0.01, dayanak: 'Aylık elde tutma oranını 1 yüzde puanı artırır. Örneğin %70 oranı %71 olur.', varsayim: true },
  'katalog-operatoru': { tur: 'elde-tutma', deger: 0.01, dayanak: 'Aylık elde tutma oranını 1 yüzde puanı artırır. Örneğin %70 oranı %71 olur.', varsayim: true },
  'satici-basari-yoneticisi': { tur: 'elde-tutma', deger: 0.01, dayanak: 'Aylık elde tutma oranını 1 yüzde puanı artırır. Örneğin %70 oranı %71 olur.', varsayim: true },
  'musteri-hizmetleri-temsilcisi': { tur: 'elde-tutma', deger: 0.01, dayanak: 'Aylık elde tutma oranını 1 yüzde puanı artırır. Örneğin %70 oranı %71 olur.', varsayim: true },
  'alici-talep-sorumlusu': { tur: 'elde-tutma', deger: 0.01, dayanak: 'Satıcıya alıcı getirir. Aylık elde tutma oranını 1 yüzde puanı artırır. Örneğin %70 oranı %71 olur.', varsayim: true },
  'teklif-operasyon-uzmani': { tur: 'elde-tutma', deger: 0.01, dayanak: 'Aylık elde tutma oranını 1 yüzde puanı artırır. Örneğin %70 oranı %71 olur.', varsayim: true },
  'kurumsal-alici-yoneticisi': { tur: 'elde-tutma', deger: 0.01, dayanak: 'Aylık elde tutma oranını 1 yüzde puanı artırır. Örneğin %70 oranı %71 olur.', varsayim: true },
};
/** Dolaylı katkının üst sınırı: aylık elde tutmaya en çok 8 puan. */
export const ELDE_TUTMA_TAVAN = 0.08;

export interface Kisi {
  pozisyon: Pozisyon;
  /** 2027 ay sırasına göre işe başlama (negatif: 2027 öncesi; Kasım 2026 = -2). */
  basla: number;
}
export function kisiler(s: SecenekId): Kisi[] {
  return POZISYONLAR.filter((p) => KATKI[p.id] && p.secenekler[s].kisi > 0).flatMap((p) =>
    p.secenekler[s].iseAlim.map((iso) => ({ pozisyon: p, basla: (Number(iso.slice(0, 4)) - 2027) * 12 + Number(iso.slice(5, 7)) - 1 })),
  );
}

/* ---------- 3. Gelir motoru (gelir planıyla aynı kurallar) ---------- */

const MODEL = buildModel(DEFAULT_PARAMS);
const REV = MODEL.revenue;
const OCAK = REV.months.findIndex((m) => m.iso === '2027-01-01');
const MEDYAN_SIM = REV.byId.medyan;
const dilim = (xs: number[]) => xs.slice(OCAK, OCAK + 12);
/** 2027 ₺ fiyatlar (kurla büyüyen), gelir planı medyan senaryosundan. */
export const FIYAT = { aylik: dilim(MEDYAN_SIM.fiyat.abonelik), yillik: dilim(MEDYAN_SIM.fiyat.yillik) };
/** Aralık 2026 sonunda aylık ödeyen satıcı (gelir planı medyan senaryosu). */
export const BASLANGIC_ODEYEN = MEDYAN_SIM.aylikOdeyen[OCAK - 1];
const kaynak = (id: string) => dilim(REV.sources.find((x) => x.id === id)?.values ?? AYLAR_2027.map(() => 0));
/** Dijital (reklam ve organik) ve temsilci ağı: gelir planındaki çarpansız 2027 değerleri. */
export const DIJITAL = kaynak('dijital');
export const TEMSILCI = kaynak('rep');
export const PLAN_ELDE_TUTMA = P.planRetention / 100;
export const YILLIK_PAY = P.annualShare / 100;
/**
 * 2026'da yıllık peşin ödeyenlerin 2027'ye düşen kazanılmış geliri: yıllık bedel 12 aya yayılır (TFRS 15 yaklaşımı).
 * Gelir planı medyan senaryosundaki 2026 yıllık ödemelerinden.
 */
export const DEVREDEN_YILLIK = AYLAR_2027.map((_, i) => {
  let t = 0;
  for (let k = 0; k < OCAK; k++) {
    const ay = k - OCAK; // 2027 Ocak'a göre (negatif)
    if (i <= ay + 11) t += (MEDYAN_SIM.yillik[k] * MEDYAN_SIM.fiyat.yillik[k]) / 12;
  }
  return t;
});
/** Gelir planı medyan senaryosunun 2027 geliri (karşılaştırma için). */
export const GELIR_PLANI_2027 = toplam(dilim(MEDYAN_SIM.gelir));

/** Mevsim etkisi (satış dönüşümüne): Ramazan ve bayram (Şubat, Mart), yaz durgunluğu (Temmuz, Ağustos). Varsayım. */
export const MEVSIM = [1, 0.95, 0.9, 1, 0.97, 1, 0.95, 0.85, 1, 1, 1, 1];

const RAMP = [0.5, 0.75];
const ramp = (k: number) => (k < 0 ? 0 : k < RAMP.length ? RAMP[k] : 1);

export interface Kosu {
  /** Kişi ve ay başına kapasite (çarpan × rampa × devir), sırası `kisiler()` ile aynı. */
  kapasite: (k: Kisi, i: number) => number;
  satis: number;
  mevsim: number[];
  eldeTutmaSapma: number;
  temsilci: number;
  /** Dolaylı katkı (destek rollerinin elde tutmaya etkisi) açık mı. Duyarlılık için kapatılabilir. */
  dolayli?: boolean;
}

export interface Sonuc {
  yeniAktif: number[];
  odeyen: number[];
  /** Ciro (tahsilat): ödeme alındığı ay. Yıllık peşin ödeme tek seferde sayılır, gelir planıyla aynı. */
  gelir: number[];
  /** Kazanılmış gelir: yıllık peşin bedel hizmet verilen 12 aya yayılır, 2026'dan devreden pay eklenir. */
  kazanilan: number[];
  eldeTutma: number[];
  dogrudan: Record<string, number>;
}

export function gelirHesabi(ks: Kisi[], k: Kosu): Sonuc {
  const yeniAktif: number[] = [];
  const gelir: number[] = [];
  const kazanilan: number[] = [];
  let yillikBirikim = 0;
  const odeyen: number[] = [];
  const eldeTutma: number[] = [];
  const dogrudan: Record<string, number> = {};
  let onceki = BASLANGIC_ODEYEN;
  for (let i = 0; i < 12; i++) {
    let yeni = 0;
    let ekip = 0;
    let lider = 0;
    let dijital = 0;
    let dijitalEk = 0;
    let et = 0;
    for (const x of ks) {
      const c = k.kapasite(x, i);
      if (c <= 0) continue;
      const kt = KATKI[x.pozisyon.id];
      if (kt.tur === 'dogrudan') {
        const gecikme = x.pozisyon.id === 'seo-icerik-uzmani' ? 3 : 0;
        const v = i - x.basla >= gecikme ? c * kt.deger : 0;
        yeni += v;
        if (['saha', 'masa'].some((r) => x.pozisyon.id.includes(r))) ekip += v;
        dogrudan[x.pozisyon.id] = (dogrudan[x.pozisyon.id] ?? 0) + v * k.satis * k.mevsim[i];
      } else if (kt.tur === 'dijital') {
        if (kt.deger === 1) dijital = Math.max(dijital, c);
        else dijitalEk += c * kt.deger;
      } else if (kt.tur === 'lider') lider = Math.max(lider, c * kt.deger);
      else if (kt.tur === 'elde-tutma') et += c * kt.deger;
    }
    const dij = DIJITAL[i] * dijital * (1 + dijitalEk);
    dogrudan['dijital'] = (dogrudan['dijital'] ?? 0) + dij * k.satis * k.mevsim[i];
    dogrudan['lider'] = (dogrudan['lider'] ?? 0) + ekip * lider * k.satis * k.mevsim[i];
    dogrudan['temsilci'] = (dogrudan['temsilci'] ?? 0) + TEMSILCI[i] * k.temsilci * k.mevsim[i];
    const toplamYeni = (yeni + ekip * lider + dij) * k.satis * k.mevsim[i] + TEMSILCI[i] * k.temsilci * k.mevsim[i];
    const r = Math.min(0.95, Math.max(0, PLAN_ELDE_TUTMA + (k.dolayli === false ? 0 : Math.min(ELDE_TUTMA_TAVAN, et)) + k.eldeTutmaSapma));
    const y = onceki * r;
    const m = toplamYeni * (1 - YILLIK_PAY) + y;
    const aylikKisim = toplamYeni * (1 - YILLIK_PAY) * FIYAT.aylik[i] + y * FIYAT.aylik[i];
    const yillikOdeme = toplamYeni * YILLIK_PAY * FIYAT.yillik[i];
    yillikBirikim += yillikOdeme / 12;
    gelir.push(yillikOdeme + aylikKisim);
    kazanilan.push(aylikKisim + yillikBirikim + DEVREDEN_YILLIK[i]);
    yeniAktif.push(toplamYeni);
    odeyen.push(m);
    eldeTutma.push(r);
    onceki = m;
  }
  return { yeniAktif, odeyen, gelir, kazanilan, eldeTutma, dogrudan };
}

/* ---------- 4. Tek hesaplar: risksiz ve medyan (beklenen) ---------- */

const satisRolu = (p: Pozisyon) => ['satis', 'satici-basarisi', 'alici-talep'].includes(p.kume) || p.id === 'musteri-hizmetleri-temsilcisi';
const aylikDevir = (r: number) => 1 - Math.pow(1 - r, 1 / 12);
/** Devrin beklenen kapasite kaybı: ayrılan kişinin boş kaldığı ve yeni kişinin rampada geçen süresi (0,75 ay). */
const devirKaybi = (r: number) => Math.min(0.5, (r * (VARSAYIM.bosAy + 0.75)) / 12);
const beklenenGecikme = VARSAYIM.gecikme.reduce((t, p, i) => t + p * i, 0);

export type Asama = 'risksiz' | 'saat' | 'gecikme' | 'devir' | 'mevsim';
export const ASAMA_ADI: Record<Asama, string> = {
  risksiz: 'Risksiz plan (tam kapasite)',
  saat: 'Çalışma saati ve verim',
  gecikme: 'İşe alım gecikmesi',
  devir: 'İşten ayrılma',
  mevsim: 'Mevsim etkisi',
};

/** Riskleri sırayla ekleyerek tek hesap. `asama` dahil olmak üzere önceki bütün riskler uygulanır. */
export function tekHesap(s: SecenekId, asama: Asama, saat: SaatGirdisi = MEDYAN_SAAT, dolayli = true): Sonuc {
  const sira: Asama[] = ['risksiz', 'saat', 'gecikme', 'devir', 'mevsim'];
  const n = sira.indexOf(asama);
  const carpan = n >= 1 ? aySaatleri(saat).map((a) => a.carpan) : AYLAR_2027.map(() => 1);
  const ks = kisiler(s);
  return gelirHesabi(ks, {
    kapasite: (x, i) => {
      const gec = n >= 2 && x.basla >= 0 ? beklenenGecikme : 0;
      const k = i - x.basla - gec;
      const r = k < 0 ? Math.max(0, 1 + k) * 0.5 : k < 1 ? 0.5 + k * 0.25 : k < 2 ? 0.75 + (k - 1) * 0.25 : 1;
      const devir = n >= 3 ? 1 - devirKaybi(satisRolu(x.pozisyon) ? VARSAYIM.devirSatis.medyan : VARSAYIM.devirDiger.medyan) : 1;
      return (n >= 2 ? r : ramp(i - x.basla)) * carpan[i] * devir;
    },
    satis: 1,
    mevsim: n >= 4 ? MEVSIM : AYLAR_2027.map(() => 1),
    eldeTutmaSapma: 0,
    temsilci: 1,
    dolayli,
  });
}

/* ---------- 5. Monte Carlo ---------- */

/** Sabit tohumlu üreteç (mulberry32): aynı girdiyle aynı sonuç. */
function uretec(tohum: number) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ucgen = (u: number, a: Aralik) => {
  const { dusuk: l, medyan: m, yuksek: h } = a;
  const f = (m - l) / (h - l || 1);
  return u < f ? l + Math.sqrt(u * (h - l) * (m - l)) : h - Math.sqrt((1 - u) * (h - l) * (h - m));
};
const normal = (rnd: () => number) => Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());

export interface Dagilim {
  n: number;
  gelir: number[];
  kazanilan: number[];
  yeniAktif: number[];
  odeyenAralik: number[];
  aylikGelir: number[][];
}
export const KOSU_SAYISI = 1000;

export function monteCarlo(s: SecenekId, regl: ReglPolitikasi = 'ikisi', n = KOSU_SAYISI, tohum = 2027): Dagilim {
  const rnd = uretec(tohum);
  const ks = kisiler(s);
  const sonuc: Dagilim = { n, gelir: [], kazanilan: [], yeniAktif: [], odeyenAralik: [], aylikGelir: [] };
  for (let j = 0; j < n; j++) {
    const saat: SaatGirdisi = {
      verim: ucgen(rnd(), VARSAYIM.verim),
      hastalik: ucgen(rnd(), VARSAYIM.hastalik),
      grip: ucgen(rnd(), VARSAYIM.grip),
      regl,
      reglCarpani: ucgen(rnd(), { dusuk: 0.7, medyan: 1, yuksek: 1.3 }),
    };
    const carpan = aySaatleri(saat).map((a) => a.carpan);
    const devirS = aylikDevir(ucgen(rnd(), VARSAYIM.devirSatis));
    const devirD = aylikDevir(ucgen(rnd(), VARSAYIM.devirDiger));
    // Büyük kesinti: yılda küçük olasılık, olursa 2 ay kapasitenin yüzde 30'u.
    const kesintiAy = rnd() < VARSAYIM.buyukKesinti ? Math.floor(rnd() * 11) : -1;
    // Kişi bazında: işe alım gecikmesi, ayrılma ve boş ay, yeni kişinin rampası.
    const plan = ks.map((x) => {
      const u = rnd();
      const gec = x.basla >= 0 ? (u < VARSAYIM.gecikme[0] ? 0 : u < VARSAYIM.gecikme[0] + VARSAYIM.gecikme[1] ? 1 : 2) : 0;
      const h = satisRolu(x.pozisyon) ? devirS : devirD;
      const aylar: number[] = [];
      let bas = x.basla + gec;
      let bos = 0;
      for (let i = 0; i < 12; i++) {
        if (bos > 0) {
          bos--;
          aylar.push(0);
          if (bos === 0) bas = i + 1;
          continue;
        }
        if (i >= bas && rnd() < h) {
          bos = rnd() < 0.5 ? 1 : 2;
          aylar.push(0.5);
          continue;
        }
        aylar.push(ramp(i - bas));
      }
      return aylar;
    });
    const indeks = new Map(ks.map((x, i) => [x, i]));
    const mevsimGucu = ucgen(rnd(), { dusuk: 0.5, medyan: 1, yuksek: 1.5 });
    const r = gelirHesabi(ks, {
      kapasite: (x, i) => plan[indeks.get(x)!][i] * carpan[i] * (kesintiAy >= 0 && (i === kesintiAy || i === kesintiAy + 1) ? 0.3 : 1),
      satis: Math.exp(VARSAYIM.satisSigma * normal(rnd) - (VARSAYIM.satisSigma * VARSAYIM.satisSigma) / 2),
      mevsim: MEVSIM.map((m) => 1 - (1 - m) * mevsimGucu),
      eldeTutmaSapma: ucgen(rnd(), VARSAYIM.eldeTutmaSapma),
      temsilci: ucgen(rnd(), { dusuk: 0.5, medyan: 1, yuksek: 1.2 }),
    });
    sonuc.gelir.push(toplam(r.gelir));
    sonuc.kazanilan.push(toplam(r.kazanilan));
    sonuc.yeniAktif.push(toplam(r.yeniAktif));
    sonuc.odeyenAralik.push(r.odeyen[11]);
    sonuc.aylikGelir.push(r.gelir);
  }
  return sonuc;
}

export function yuzdelik(xs: number[], p: number) {
  const s = [...xs].sort((a, b) => a - b);
  const k = (s.length - 1) * p;
  const a = Math.floor(k);
  return s[a] + (s[Math.min(a + 1, s.length - 1)] - s[a]) * (k - a);
}
export const ortalama = (xs: number[]) => toplam(xs) / Math.max(1, xs.length);
export const standartSapma = (xs: number[]) => {
  const m = ortalama(xs);
  return Math.sqrt(ortalama(xs.map((x) => (x - m) ** 2)));
};

/** Dört öngörü: kötümser (yüzde 10), medyan (plan, beklenen), ortanca (yüzde 50), iyimser (yüzde 90). */
export function ongoru(s: SecenekId, regl: ReglPolitikasi = 'ikisi') {
  const d = monteCarlo(s, regl);
  const medyan = tekHesap(s, 'mevsim', { ...MEDYAN_SAAT, regl });
  const risksiz = tekHesap(s, 'risksiz');
  const g = (p: number) => yuzdelik(d.gelir, p);
  return {
    dagilim: d,
    risksiz,
    medyan,
    gelir: { kotumser: g(0.1), medyan: toplam(medyan.gelir), ortanca: g(0.5), iyimser: g(0.9), risksiz: toplam(risksiz.gelir), ortalama: ortalama(d.gelir), sapma: standartSapma(d.gelir) },
    kazanilan: { kotumser: yuzdelik(d.kazanilan, 0.1), medyan: toplam(medyan.kazanilan), ortanca: yuzdelik(d.kazanilan, 0.5), iyimser: yuzdelik(d.kazanilan, 0.9), risksiz: toplam(risksiz.kazanilan) },
    yeniAktif: { kotumser: yuzdelik(d.yeniAktif, 0.1), medyan: toplam(medyan.yeniAktif), ortanca: yuzdelik(d.yeniAktif, 0.5), iyimser: yuzdelik(d.yeniAktif, 0.9), risksiz: toplam(risksiz.yeniAktif) },
    riskPayi: 1 - toplam(medyan.gelir) / toplam(risksiz.gelir),
    /** Duyarlılık: destek rollerinin elde tutma katkısı olmadan medyan gelir. */
    dolaylisizMedyan: toplam(tekHesap(s, 'mevsim', { ...MEDYAN_SAAT, regl }, false).gelir),
  };
}

/* ---------- 6. Risk listesi, harita ve zaman tüneli ---------- */

export interface Risk {
  id: string;
  ad: string;
  /** 1 (çok düşük) ile 5 (çok yüksek). */
  olasilik: number;
  etki: number;
  /** Etkili olduğu aylar (0 = Ocak 2027). */
  aylar: number[];
  /** Modelde nasıl yer aldığı. */
  modelde: string;
  onlem: string;
}
const HER_AY = AYLAR_2027.map((_, i) => i);
export const RISKLER: Risk[] = [
  { id: 'R1', ad: 'Mevsimsel grip', olasilik: 4, etki: 2, aylar: [0, 1, 2, 11], modelde: 'Her grip sezonunda çalışanların %5 ile %15’i grip olur. Her grip 3,5 tam iş gününe denk kayıp sayılır.', onlem: 'Ekim ve Kasım’da grip aşısı yapılır. Hasta olan çalışan işe gelmez. Gerekirse evden çalışılır.' },
  { id: 'R2', ad: 'Hastalık izni', olasilik: 5, etki: 2, aylar: HER_AY, modelde: 'Her çalışan yılda 4 ile 8 gün hastalık izni kullanır.', onlem: 'Yedek kişi belirlenir ve devir notu yazılır. Rapor süreci tanımlanır.' },
  { id: 'R3', ad: 'Regl dönemine bağlı verim düşüşü', olasilik: 4, etki: 1, aylar: HER_AY, modelde: 'Kayıp, seçilen politikaya göre kadın başı yılda 5,3 ile 9,7 gün eşdeğeridir. Bu kayıp, kadın çalışanların oranıyla çarpılıp toplama eklenir.', onlem: 'Esnek çalışma ve ücretli izin politikası uygulanır. Maaştan kesinti yapılmaz.' },
  { id: 'R4', ad: 'İşten ayrılma', olasilik: 4, etki: 4, aylar: HER_AY, modelde: 'Satış ve destek rollerinde her yıl çalışanların %20 ile %45’i ayrılır. Diğer rollerde bu oran %10 ile %25’tir. Ayrılan kişinin yeri bir süre boş kalır. Yeni gelen kişi tam verime zamanla ulaşır.', onlem: 'Prim ve kariyer basamağı sunulur. Yeni kişiye ilk 90 günde koçluk verilir. Aday havuzu hazır tutulur.' },
  { id: 'R5', ad: 'İşe alım gecikmesi', olasilik: 3, etki: 3, aylar: [0, 1, 2, 3, 4, 5], modelde: 'Yeni kişinin işe başlaması %30 olasılıkla 1 ay, %15 olasılıkla 2 ay gecikir.', onlem: 'İlan, işe alım ayından 6 hafta önce açılır.' },
  { id: 'R6', ad: 'Satış dönüşümünün beklenenden düşük olması', olasilik: 3, etki: 5, aylar: HER_AY, modelde: 'Satış verimi her olası yılda rastgele bir çarpanla artar ya da azalır. Bu çarpan log normal dağılır. Standart sapması 0,2’dir.', onlem: 'Satış dönüşümü her hafta ölçülür. 30., 60. ve 90. günde karar verilir.' },
  { id: 'R7', ad: 'Elde tutmanın düşük kalması', olasilik: 3, etki: 5, aylar: HER_AY, modelde: 'Aylık elde tutma oranı en çok 8 yüzde puanı düşebilir. Oran en çok 5 yüzde puanı artabilir.', onlem: 'Satıcı başarı ekibi kurulur. Yeni satıcıya ilk 90 günde uyum programı uygulanır. Satıcıya alıcı talebi getirilir.' },
  { id: 'R8', ad: 'Bayram ve köprü günleri', olasilik: 5, etki: 2, aylar: [2, 4, 9], modelde: 'Takvimde 12 iş günü tatil vardır. Köprü günleri bilinmiyor ve modelde yok.', onlem: 'Bayramdan önce kampanya yapılır. İzinler önceden planlanır.' },
  { id: 'R9', ad: 'Ramazan ayı', olasilik: 4, etki: 2, aylar: [1, 2], modelde: 'Şubat ve Mart 2027’de satış dönüşümü %5 ile %10 düşer.', onlem: 'Ziyaret saatleri öğlene kaydırılır.' },
  { id: 'R10', ad: 'Yaz durgunluğu', olasilik: 3, etki: 3, aylar: [6, 7], modelde: 'Satış dönüşümü Temmuz’da %5, Ağustos’ta %15 düşer. Ölçülmüş veri yoktur. Bu oranlar varsayımdır.', onlem: 'Yaz aylarında uyum ve katalog işlerine ağırlık verilir.' },
  { id: 'R11', ad: 'İstanbul trafiği ve ulaşım', olasilik: 4, etki: 1, aylar: HER_AY, modelde: 'Trafik kaybı ayrı hesaplanmaz. Bu kayıp verim varsayımının içinde sayılır.', onlem: 'Saha için rota planlanır. Saha personeline toplu taşıma kartı verilir.' },
  { id: 'R12', ad: 'Deprem ya da büyük kesinti', olasilik: 1, etki: 5, aylar: HER_AY, modelde: 'Deprem ya da büyük kesinti olasılığı yılda %1,5’tir. Böyle bir olay olursa 2 ay boyunca kapasitenin yalnız %30’u kalır.', onlem: 'Uzaktan çalışma ve yedekleme planı hazırlanır. Acil durum tatbikatı yapılır.' },
  { id: 'R13', ad: 'Kur ve fiyat', olasilik: 3, etki: 3, aylar: HER_AY, modelde: 'Kurdaki beklenmedik değişim modelde yok. Modelde ₺ fiyatı yalnız “Gelir planı” sayfasındaki kur artışı kadar artar.', onlem: 'Fiyat avro olarak korunur. Yıllık peşin ödeme özendirilir.' },
  { id: 'R14', ad: 'Sipariş ve ödeme altyapısının gecikmesi', olasilik: 3, etki: 3, aylar: HER_AY, modelde: 'Modelde yok. Gelir yalnız aboneliktir.', onlem: 'Teslim tarihi ürün yol haritasına bağlanır.' },
  { id: 'R15', ad: 'Kurucuya bağımlılık', olasilik: 3, etki: 4, aylar: HER_AY, modelde: 'Modelde yok.', onlem: 'Kurucu yetkilerinin bir kısmını devreder. Satış müdürü ve operasyon müdürü rolleri açılır.' },
];
export const riskPuani = (r: Risk) => r.olasilik * r.etki;
export const riskDuzeyi = (puan: number) => (puan >= 15 ? 'Yüksek' : puan >= 8 ? 'Orta' : 'Düşük');
