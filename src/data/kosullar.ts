/**
 * Koşul setleri (kullanıcı kararı 2026-11-03: “4 sayfa → tek sayfa”). Temsilci ağı, İş ortaklığı ve Affilate
 * sayfalarındaki personalar ve koşulları, satış ortaklığı sayfasındaki beş rolün altında seçilebilir set olarak durur.
 * Ana program (`ana`) satış ortaklığı sayfasının kendi hesabıdır ve değişmez; burada yalnız diğer setler hesaplanır.
 * Kaynaklar: src/data/growth.ts ve program.ts (Temsilci ağı), partnership.ts (İş ortaklığı), affilate.ts (Affilate).
 */
import { karsilastir, type OrtakId, type Sonuc as MotorSonuc } from './affilate';
import { baslangicKurgu, senaryoKur } from './affilateKurgu';
import { aylikFiyat, yillikFiyat, type Ayar, type DonemSatiri, type Marka, type RolId } from './satisOrtakligi';

export type KaynakSayfa = 'Satış ortaklığı' | 'Temsilci ağı' | 'İş ortaklığı' | 'Affilate';

export interface KosulTanim {
  id: string;
  ad: string;
  kaynak: KaynakSayfa;
  marka: Marka[];
}

export interface KosulSonuc {
  etiket: string;
  deger: string;
  aciklama: string;
  bize?: string;
  ozet: string;
  ozetBirim: string;
  donemler: DonemSatiri[];
  hesap: { ad: string; formul: string; sonuc: string }[];
  kurallar: string[];
  /** Karar verisine (JSON) giden sayılar. */
  veri: Record<string, number | string>;
}

const IKISI: Marka[] = ['istoc', 'segika'];
const ANA: KosulTanim = { id: 'ana', ad: 'Ana program', kaynak: 'Satış ortaklığı', marka: IKISI };

export const KOSULLAR: Record<RolId, KosulTanim[]> = {
  oncu: [
    ANA,
    { id: 'ag', ad: 'Bağımsız temsilci, kademeli ağ', kaynak: 'Temsilci ağı', marka: ['istoc'] },
    { id: 'yillara', ad: 'Yıllara yayılan komisyon', kaynak: 'Affilate', marka: ['segika'] },
  ],
  kadrolu: [
    ANA,
    { id: 'saha', ad: 'Saha personeli, satış başı prim', kaynak: 'Temsilci ağı', marka: ['istoc'] },
    { id: 'lider', ad: 'Ekip lideri', kaynak: 'Temsilci ağı', marka: ['istoc'] },
  ],
  cozum: [
    ANA,
    { id: 'yillara', ad: 'Destek veren çözüm ortağı, yıllara yayılan', kaynak: 'Affilate', marka: ['segika'] },
    { id: 'yonlendirme', ad: 'Ticari yönlendirme ortağı', kaynak: 'İş ortaklığı', marka: ['segika'] },
    { id: 'smmm', ad: 'Mali müşavir ofisi, seviyeli', kaynak: 'İş ortaklığı', marka: ['segika'] },
    { id: 'altyapi', ad: 'Altyapı ve kendi markası', kaynak: 'İş ortaklığı', marka: ['segika'] },
    { id: 'entegrasyon', ad: 'Bordro ve İK yazılımı', kaynak: 'İş ortaklığı', marka: ['segika'] },
    { id: 'osgb', ad: 'OSGB', kaynak: 'İş ortaklığı', marka: ['segika'] },
    { id: 'dernek', ad: 'Dernek, OSB ve oda', kaynak: 'İş ortaklığı', marka: ['segika'] },
    { id: 'franchise', ad: 'Franchise ve zincir', kaynak: 'İş ortaklığı', marka: ['segika'] },
    { id: 'gelistirme', ad: 'Satıcı geliştirme ortağı', kaynak: 'İş ortaklığı', marka: ['istoc'] },
    { id: 'arz', ad: 'Kurumsal arz toplayıcı', kaynak: 'İş ortaklığı', marka: ['istoc'] },
    { id: 'talep', ad: 'Talep toplayıcı', kaynak: 'İş ortaklığı', marka: ['istoc'] },
    { id: 'hizmet', ad: 'Hizmet ortağı', kaynak: 'İş ortaklığı', marka: ['istoc'] },
    { id: 'teknoloji', ad: 'Teknoloji ortağı', kaynak: 'İş ortaklığı', marka: ['istoc'] },
    { id: 'bolge', ad: 'Bölge temsilcisi', kaynak: 'İş ortaklığı', marka: ['istoc'] },
  ],
  tavsiye: [ANA, { id: 'tek-sefer', ad: 'Tek seferlik tavsiye komisyonu', kaynak: 'Affilate', marka: ['segika'] }],
  elci: [ANA],
};

/* ---------- Kademeli temsilci ağı ---------- */

/** Örnek zincir: Haydar ve Ömer üst kademe, Ahmet odak kişi, Mehmet, Ayşe ve Fatma alt kademeler. */
export const AG_ISIMLER = ['Haydar', 'Ömer', 'Ahmet', 'Mehmet', 'Ayşe', 'Fatma'];
export const AG_ODAK = 2;
export const agDerinlik = (a: Ayar) => Math.min(3, Math.max(1, Math.round(a.agDerinlik)));

/** Bir satışın dağılımı: [satış yapana, 1. kademe üstüne, 2. kademe üstüne, …]. */
export const agSatisPayi = (a: Ayar) => [a.agKomisyon, ...a.agKademePay.slice(0, agDerinlik(a))];

/**
 * Zincirde r. sıradaki kişinin aylık kazancı. Herkes ayda aynı sayıda satış yapar ve aynı sayıda temsilci getirir.
 * Ağ Fatma’nın kuşağında biter: L. kademede dal^L kişi vardır, kuşak bittiyse ya da kademe derinliği aşıldıysa pay yoktur.
 */
export function agKisiKazanci(a: Ayar, r: number) {
  const dal = Math.max(0, Math.round(a.agAltTemsilci));
  const kendi = a.agAltSatis * a.agKomisyon;
  const kademeler = a.agKademePay.slice(0, agDerinlik(a)).map((pay, i) => {
    const L = i + 1;
    const kisi = r + L < AG_ISIMLER.length ? dal ** L : 0;
    return { kisi, pay, tutar: kisi * a.agAltSatis * pay };
  });
  return { kendi, kademeler, toplam: kendi + kademeler.reduce((s, x) => s + x.tutar, 0) };
}

/* ---------- Affilate hesap motoru (Affilate sayfasından taşındı) ---------- */

/** Affilate kaynaklı koşul setinin motor modeli: satış ortağı, çözüm ortağı ya da tek seferlik tavsiye. */
export function affilateModeli(a: Ayar, rol: RolId): OrtakId | null {
  const k = a.kosul?.[rol];
  if (rol === 'oncu' && k === 'yillara') return 'satis';
  if (rol === 'cozum' && k === 'yillara') return 'cozum';
  if (rol === 'tavsiye' && k === 'tek-sefer') return 'ayse';
  return null;
}

/**
 * Bir müşteri için ay ay hakediş ve ödeme: aylık fiyat ve oranlar satış ortaklığı ayarlarından, ödeme biçimi, süre ve
 * ödeme zamanı Affilate ayarlarından gelir. Tutarlar kuruştur.
 */
export function affilateHesabi(a: Ayar, id: OrtakId): MotorSonuc {
  const k = baslangicKurgu();
  k.ufukAy = a.affUfukAy;
  k.fiyat = { ...k.fiyat, kaynak: 'kat', aylik: Math.round(aylikFiyat(a) * 100), kat: a.marka === 'istoc' ? a.istocYilAy : 12, hizmetAy: 12, paraBirimi: 'TRY' };
  const o = k.ortaklar[id];
  const oranlar = id === 'satis' ? a.yillaraOncu : id === 'cozum' ? a.yillaraCozum : [a.tekSeferOran];
  o.donemler = o.donemler.map((d, i) => ({ ...d, oranBp: Math.round((oranlar[i] ?? 0) * 10_000) }));
  if (id !== 'ayse') o.sonrakiOranBp = Math.round(a.affSonraki[id] * 10_000);
  o.politika = a.affPolitika[id];
  k.musteriler = [{ ...k.musteriler[0], adet: 1, odeme: a.affOdeme, ortak: id }];
  return karsilastir(senaryoKur(k), k.musteriler[0].id)[id];
}

/** Hakedişin müşterinin hizmet yıllarına dağılımı (kuruş). */
export function affilateYillari(r: MotorSonuc, ufukAy: number) {
  const dizi = Array.from({ length: Math.max(1, Math.ceil(ufukAy / 12)) }, () => 0);
  for (const h of r.hareketler) {
    if (h.tur !== 'hakedis' && h.tur !== 'duzeltme') continue;
    const i = Math.floor((h.hizmetAyi ?? 0) / 12);
    if (i >= 0 && i < dizi.length) dizi[i] += h.tutar;
  }
  return dizi;
}

/** Ürüne uygun setler; seçili set ürüne uymuyorsa ana program. */
export const kosulListesi = (a: Ayar, rol: RolId) => KOSULLAR[rol].filter((k) => k.marka.includes(a.marka));
export function seciliKosul(a: Ayar, rol: RolId): KosulTanim {
  const liste = kosulListesi(a, rol);
  return liste.find((k) => k.id === a.kosul?.[rol]) ?? ANA;
}

const t = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;
const yuzde = (v: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v * 100)}`;
const sayi = (v: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v);

/* ---------- Yıllara yayılan komisyon: ay ay satış takvimi ve hizmet ayında hakediş ---------- */

const GUN_AY = 365 / 12;
const ASAMA_SINIR = [0, 14, 45, 90, Infinity];

/** Aşamalı satış hızından (ayda adet) 36 aylık satış takvimi: her ay, o aya düşen günlerin satışı. */
export function satisTakvimi(asama: readonly number[], ay = 36): number[] {
  return Array.from({ length: ay }, (_, m) => {
    const bas = m * GUN_AY;
    const son = (m + 1) * GUN_AY;
    let adet = 0;
    for (let i = 0; i < 4; i++) {
      const a0 = Math.max(bas, ASAMA_SINIR[i]);
      const a1 = Math.min(son, ASAMA_SINIR[i + 1]);
      if (a1 > a0) adet += (asama[i] * (a1 - a0)) / GUN_AY;
    }
    return adet;
  });
}

/** Her müşteri her yıl yeniler; ortak, müşterinin k. yılında yıllık paketin oran[k]’sini 12 aya bölünmüş alır. */
export function yillaraAylik(satis: readonly number[], yillik: number, oranlar: readonly number[]): number[] {
  const kazanc = new Array<number>(satis.length).fill(0);
  satis.forEach((adet, m) => {
    for (let ay = m; ay < satis.length; ay++) kazanc[ay] += (adet * yillik * (oranlar[Math.floor((ay - m) / 12)] ?? 0)) / 12;
  });
  return kazanc;
}

const yilToplami = (seri: readonly number[], yil: number) => seri.slice(yil * 12, yil * 12 + 12).reduce((s, x) => s + x, 0);

function yillaraSonuc(a: Ayar, satis: number[], oranlar: readonly number[], kim: string, kosulCumlesi: string, ekKural: string[]): KosulSonuc {
  const yillik = yillikFiyat(a);
  const seri = yillaraAylik(satis, yillik, oranlar);
  const yillar = [0, 1, 2].map((y) => yilToplami(seri, y));
  const toplam = yillar[0] + yillar[1] + yillar[2];
  const ciro = satis.reduce((s, adet, m) => s + (adet * yillik * (satis.length - m)) / 12, 0);
  const musteri = satis.reduce((s, x) => s + x, 0);
  return {
    etiket: `${kim} 3 yıllık kazancı`,
    deger: t(toplam),
    aciklama: `${kosulCumlesi} Her müşterinin yıllık paket bedelinden 1. yıl ${yuzde(oranlar[0])}, 2. yıl ${yuzde(oranlar[1])}, 3. yıl ${yuzde(oranlar[2])} alır.`,
    bize: `Aynı müşterilerden 3 yılda bize ${t(ciro - toplam)} kalır.`,
    ozet: t(toplam),
    ozetBirim: '/ 3 yıl',
    donemler: yillar.map((y, i) => ({ ad: `${i + 1}. yıl`, yillik: y, formul: `Müşteri başı ${t(yillik * oranlar[i])}, aylara bölünür` })),
    hesap: [
      ...oranlar.map((o, i) => ({ ad: `Müşteri başı ${i + 1}. yıl`, formul: `${t(yillik)} × ${yuzde(o)}`, sonuc: t(yillik * o) })),
      { ad: '3 yılda gelen müşteri', formul: 'Aylık satışların toplamı', sonuc: sayi(musteri) },
    ],
    kurallar: ['Komisyon hizmet ayında kazanılır ve o ay ödenir.', 'Müşteri ödemezse komisyon doğmaz. İade olursa komisyon geri alınır.', 'Hesap, müşterilerin aboneliği her yıl yenilediğini varsayar.', ...ekKural],
    veri: { yil1: Math.round(yillar[0]), yil2: Math.round(yillar[1]), yil3: Math.round(yillar[2]), toplam3Yil: Math.round(toplam), musteri3Yil: Math.round(musteri * 10) / 10 },
  };
}

/* ---------- Ortak kurallar ---------- */

const SEGIKA_ORTAK_KURALLARI = [
  'Şirket kaydı 1 iş günü içinde kabul eder ya da reddeder. Kabul edilen firma 12 ay boyunca ortak adına korunur.',
  '60 gün boyunca ilerleme olmazsa kayıt yeniden incelenir. Son 90 günde Segika ile teması olan firma yeni müşteri sayılmaz.',
  '%15’lik bütçe ortaklar arasında paylaştırılır. Her ortak için ayrıca %15 eklenmez.',
  'Liste fiyatının altında satış yapılmaz.',
  'Ortak programa 14 günlük başlangıç süresiyle girer. Ortak bu sürede sertifika eğitimini bitirir. Aynı sürede ilk 5 mükellefini ekler. Aktivasyon 45 gün içinde beklenir.',
  'Ortaklık her yıl değerlendirilir. Ortakların tavsiye puanı (NPS) en az 40 olmalıdır.',
];

const ISTOC_ORTAK_KURALLARI = [
  'Ortağın bildirdiği iş fırsatı 2 iş günü içinde kabul edilir. Fırsat 90 gün boyunca ortak adına korunur.',
  '30 gün boyunca ilerleme olmazsa fırsat gözden geçirilir.',
  'Ortağa münhasırlık, yani tek yetkili olma hakkı verilmez. Ortak, “iStoc Program Ortağı” adını kullanır.',
  'Ortak programa 21 günlük başlangıç süresiyle girer. Ortak bu sürede 60 dakikalık bir eğitim alır. Aktivasyon süresi 60 gündür.',
  'Ortaklık her yıl değerlendirilir. Ortakların tavsiye puanı (NPS) en az 40 olmalıdır.',
];

/** Nakit hesabı olmayan sözleşmeli ortaklık: sonuç, ödeme modelinin adıdır. */
function sozlesmeli(deger: string, aciklama: string, kurallar: string[]): KosulSonuc {
  return { etiket: 'Ödeme modeli', deger, aciklama, ozet: deger, ozetBirim: '', donemler: [], hesap: [], kurallar, veri: { model: deger } };
}

/** Seçili koşul setinin sonucu; ana program için null (sayfanın kendi hesabı kullanılır). */
export function kosulSonucu(a: Ayar, rol: RolId): KosulSonuc | null {
  const k = seciliKosul(a, rol).id;
  const yillik = yillikFiyat(a);
  const aylik = aylikFiyat(a);
  if (k === 'ana') return null;

  if (rol === 'oncu' && k === 'ag') {
    const odak = agKisiKazanci(a, AG_ODAK);
    const pay = agSatisPayi(a);
    const birSatis = pay.reduce((s2, x) => s2 + x, 0);
    const asar = birSatis > a.agTavan;
    const d = agDerinlik(a);
    return {
      etiket: `${AG_ISIMLER[AG_ODAK]}’in aylık kazancı`,
      deger: t(odak.toplam),
      aciklama: `${AG_ISIMLER[AG_ODAK]} ayda ${sayi(a.agAltSatis)} satış yapar ve her satıştan ${t(a.agKomisyon)} alır. Altındaki ${d} kademenin satışlarından da kademe payı alır. Daha alttaki kişilerin satışlarından pay almaz.`,
      bize: `Bir satıştan bize ${t(yillik - birSatis)} kalır.`,
      ozet: t(odak.toplam),
      ozetBirim: '/ ay',
      donemler: [
        { ad: 'Kendi satışı', yillik: odak.kendi * 12, formul: `${sayi(a.agAltSatis)} satış × 12 ay × ${t(a.agKomisyon)}` },
        ...odak.kademeler.map((x, L) => ({ ad: `${L + 1}. kademe`, yillik: x.tutar * 12, formul: `${sayi(x.kisi)} kişi × ${sayi(a.agAltSatis)} satış × ${t(x.pay)} × 12 ay` })),
        { ad: 'Toplam', yillik: odak.toplam * 12, formul: `${t(odak.toplam)} × 12 ay` },
      ],
      hesap: [
        { ad: 'Satış yapana', formul: 'Satış başı komisyon', sonuc: t(a.agKomisyon) },
        ...pay.slice(1).map((x, L) => ({ ad: `${L + 1}. kademe üstüne`, formul: 'Satış başı kademe payı', sonuc: t(x) })),
        { ad: 'Bir satışta toplam ödeme', formul: `Tavan ${t(a.agTavan)}`, sonuc: t(birSatis) },
      ],
      kurallar: [
        ...(asar ? [`Bu ayarlarla bir satışta ${t(birSatis)} ödenir ve ${t(a.agTavan)} tavanı aşılır.`] : []),
        `Satış yapanın üstündeki ${d} kademe pay alır. Daha üstteki kişi o satıştan pay almaz.`,
        'Kazanç yalnız gerçek satıştan doğar. Üye getirmek tek başına para kazandırmaz. Aksi durumda sistem, 6502 sayılı Kanun’a göre yasak olan saadet zinciri sayılır.',
        'Giriş ücreti, zorunlu alım, kayıt ya da üye getirme primi yoktur.',
        'Temsilci, kendi şirketi olan bağımsız bir iş insanıdır. Maaş almaz, hizmet faturası keser.',
        'Temsilci iki koşul sağlanınca kazancını hak eder. Şirket müşterinin ilk ödemesini tahsil etmiş olmalıdır. Satıcı da aktif olmalıdır.',
        'Reklamda kazanç vaadi ve “MLM fırsatı” ifadesi kullanılmaz.',
        `“Temsilci ağı” sayfasında ağ tek kademeliydi. Bu hesap ${d} kademe kullanır. Kademe sayısı sözleşmeden ve hukuk kontrolünden önce kesinleşmelidir.`,
      ],
      veri: {
        satisBasina: a.agKomisyon,
        derinlik: d,
        kademePaylari: pay.slice(1).join(' / '),
        birSatistaToplamOdeme: birSatis,
        tavan: a.agTavan,
        tavanAsildi: asar ? 'evet' : 'hayir',
        ...Object.fromEntries(AG_ISIMLER.map((ad, r) => [`aylik_${ad}`, Math.round(agKisiKazanci(a, r).toplam)])),
      },
    };
  }

  if (rol === 'oncu' && k === 'yillara')
    return yillaraSonuc(a, satisTakvimi(a.oncuAsama), a.yillaraOncu, 'Ortağın', `Ortak ayda ${a.oncuAsama[3]} satışa ulaşırsa bu tutarı kazanır.`, ['Müşteriyi getirir ve satışı kapatır. Müşteri desteğini Segika verir.']);

  if (rol === 'kadrolu' && (k === 'saha' || k === 'lider')) {
    const lider = k === 'lider';
    const maas = a.maas + (lider ? a.liderEk : 0);
    const kotaTl = maas * a.sahaKotaCarpan;
    const kotaIcin = yillik > 0 ? Math.ceil(kotaTl / yillik) : 0;
    const prim = Math.max(0, a.kadroluSatis - kotaIcin) * a.sahaPrim;
    const ekip = lider ? a.liderEkipSatis * a.liderPay : 0;
    const toplam = maas + prim + ekip;
    return {
      etiket: lider ? 'Ekip liderinin bu ayki kazancı' : 'Saha personelinin bu ayki kazancı',
      deger: t(toplam),
      aciklama: `${lider ? 'Ekip lideri' : 'Saha personeli'} ${t(maas)} maaş alır. Kotayı ${kotaIcin} satış doldurur. Sonraki her satıştan ${t(a.sahaPrim)} prim alır.${lider ? ` Ekibinin her satışından ${t(a.liderPay)} pay alır. Ekip ${a.liderEkipSatis} satış yaparsa bu pay ${t(ekip)} eder.` : ''}`,
      bize: `Bu ay bu kişinin kendi satışlarından gelen ciromuz ${t(a.kadroluSatis * yillik)}.`,
      ozet: t(toplam),
      ozetBirim: '/ ay',
      donemler: [
        { ad: 'Maaş', yillik: maas * 12, formul: `${t(maas)} × 12 ay` },
        { ad: 'Prim', yillik: prim * 12, formul: `${t(prim)} × 12 ay` },
        ...(lider ? [{ ad: 'Ekip payı', yillik: ekip * 12, formul: `${t(ekip)} × 12 ay` }] : []),
        { ad: 'Toplam', yillik: toplam * 12, formul: `${t(toplam)} × 12 ay` },
      ],
      hesap: [
        { ad: 'Kota', formul: `${t(maas)} × ${sayi(a.sahaKotaCarpan)}`, sonuc: t(kotaTl) },
        { ad: 'Kotaya gereken satış', formul: `${t(kotaTl)} ÷ ${t(yillik)} (yukarı yuvarlanır)`, sonuc: `${kotaIcin}` },
        { ad: 'Prim', formul: `${Math.max(0, a.kadroluSatis - kotaIcin)} satış × ${t(a.sahaPrim)}`, sonuc: t(prim) },
        ...(lider ? [{ ad: 'Ekip payı', formul: `${a.liderEkipSatis} satış × ${t(a.liderPay)}`, sonuc: t(ekip) }] : []),
      ],
      kurallar: [
        `${lider ? 'Ekip lideri' : 'Saha personeli'} şirketin sigortalı çalışanıdır.`,
        ...(lider ? [`Maaşı saha maaşından ${t(a.liderEk)} fazladır.`, `Ekibindeki saha personeli ve temsilcilerin her satışından ${t(a.liderPay)} alır.`, 'Kendi satışları saha personeli kuralıyla hesaplanır.'] : []),
        `Kota, maaşın ${sayi(a.sahaKotaCarpan)} katı tutarında satıştır. Ana programdaki kota ise maaşın ${sayi(a.kotaCarpan)} katına %${sayi(a.kotaEk * 100)} eklenerek bulunur.`,
      ],
      veri: { maas, kota: Math.round(kotaTl), kotayaGerekenSatis: kotaIcin, prim: Math.round(prim), ekipPayi: Math.round(ekip), toplam: Math.round(toplam) },
    };
  }

  if (rol === 'cozum' && k === 'yillara')
    return yillaraSonuc(
      a,
      new Array(36).fill(a.cozumMusteri / 12),
      a.yillaraCozum,
      'Çözüm ortağının',
      `Çözüm ortağı yılda ${a.cozumMusteri} müşteri getirirse bu tutarı kazanır.`,
      ['Müşteri desteğini ortak verir. Ortak, destek vermediği ay komisyon kazanmaz.'],
    );

  if (rol === 'cozum' && (k === 'yonlendirme' || k === 'gelistirme')) {
    const yon = k === 'yonlendirme';
    const oran = yon ? a.yonlendirmeOran : a.gelistirmeOran;
    const ay = yon ? a.yonlendirmeAy : a.gelistirmeAy;
    const birim = aylik * ay * oran;
    const n = a.cozumMusteri;
    return {
      etiket: yon ? 'Yönlendirme ortağının yıllık kazancı' : 'Satıcı geliştirme ortağının yıllık kazancı',
      deger: t(birim * n),
      aciklama: yon
        ? `Yönlendirme ortağı yılda ${n} müşteri getirirse bu tutarı kazanır. Her müşterinin ödediği ilk ${ay} aylık ücretten ${yuzde(oran)} alır. Bu, müşteri başına ${t(birim)} eder.`
        : `Satıcı geliştirme ortağı yılda ${n} satıcı geliştirirse bu tutarı kazanır. Her satıcının ilk ${ay} aylık ücretinden ${yuzde(oran)} alır. Bu, satıcı başına ${t(birim)} eder.`,
      bize: `Aynı müşterilerin ilk yılından bize ${t(n * (yillik - birim))} kalır.`,
      ozet: t(birim * n),
      ozetBirim: '/ yıl',
      donemler: [{ ad: 'Komisyon', yillik: birim * n, formul: `${n} × ${t(birim)}` }],
      hesap: [{ ad: 'Müşteri başı', formul: `${t(aylik)} × ${ay} ay × ${yuzde(oran)}`, sonuc: t(birim) }],
      kurallar: yon
        ? [
            'Komisyon, müşterinin şirkete ödediği tutardan hesaplanır. Bu tutardan önce vergi ve iadeler düşülür. Yalnız komisyona uygun ödemeler sayılır.',
            `Komisyon, müşterinin ödediği ilk ${ay} aydan hesaplanır. Bu ayların ilki, aktivasyondan sonraki 9 takvim ayı içinde olmalıdır. Ücretsiz aylar bu ${ay} aya girmez.`,
            'Ödeme, takip eden ayın 15’ine kadar yapılır.',
            'Ortak puanı en az 70 olmalıdır. En çok 6 yönlendirme ortağıyla çalışılır.',
            'Ortak fiyatı değiştiremez, garanti veremez ve tahsilat yapamaz.',
            ...SEGIKA_ORTAK_KURALLARI,
          ]
        : ['Ortak en çok 5 aday satıcıyla başlar ve en az 3’ünü satışa hazır hâle getirir.', 'Oran örnektir. Finans sorumlusu oranı 14. gün kesinleştirir. Günün hangi olaydan sonra sayılacağını finans sorumlusu yazacak.', ...ISTOC_ORTAK_KURALLARI],
      veri: { oran, ay, musteriBasina: Math.round(birim), yillikMusteri: n, yillikKazanc: Math.round(birim * n) },
    };
  }

  if (rol === 'cozum' && k === 'smmm') {
    const m = a.smmmMukellef;
    const seviye = m >= 50 ? 'Altın' : m >= 10 ? 'Gümüş' : 'Kayıtlı Ortak';
    return {
      etiket: 'Mali müşavirin ortaklık seviyesi',
      deger: seviye,
      aciklama: `Ofis, ${m} aktif mükellefle ${seviye} seviyesindedir. Nakit komisyon almaz, bunun yerine toptan fiyattan yararlanır.`,
      ozet: seviye,
      ozetBirim: '',
      donemler: [],
      hesap: [{ ad: 'Seviye', formul: `Ofisin ${m} aktif mükellefi var. Gümüş seviye için en az 10, Altın seviye için en az 50 aktif mükellef gerekir.`, sonuc: seviye }],
      kurallar: [
        'Kayıtlı Ortak seviyesi ücretsizdir. Ofis 2 saatlik canlı eğitimi ve bu eğitimin kaydını alır. Ayrıca paneli alır. 2 mükellef için ücretsiz deneme ve tanıtım malzemeleri de alır.',
        'Gümüş seviyesi için en az 10 aktif mükellef gerekir. Bu seviyede ofis toptan fiyatın 1. kademesini ve ofis markalı Aylık Değer Raporunu alır. Destek taleplerine 4 saat içinde yanıt verilir.',
        'Altın seviyesi için en az 50 aktif mükellef gerekir. Bu seviyede ofis 2. kademe fiyatı, yalnız onunla ilgilenen bir ortak başarı yöneticisini, ortak pazarlama fonunu ve API erişimini, yani yazılımını doğrudan bağlama imkânını alır.',
        'Toptan fiyat bantları mükellef sayısına göre üçe ayrılır. Birinci bant 10 ile 49, ikinci bant 50 ile 199 mükellef içindir. Üçüncü bant 200 ve daha çok mükellef içindir. Yıllık peşin ödemede ek indirim vardır.',
        'Ofisin bu programa girmesi için üç koşul var. Ofis bordro hizmeti vermelidir. Ofis Luca, Mikro ya da ETA kullanmalıdır. Ofis sertifika eğitimini bitirmelidir.',
        'Şirket ilk aşamada 10 ofisle çalışır. Bunların 5’i şirketle zaten çalışan ofislerdir. 5’i yeni ofistir.',
        'Bu modelde müşavire nakit, hediye ya da indirim verilmez. Komisyon ya da müşteri indirimi isteniyorsa ana program seçilir.',
        ...SEGIKA_ORTAK_KURALLARI,
      ],
      veri: { aktifMukellef: m, seviye },
    };
  }

  if (rol === 'tavsiye' && k === 'tek-sefer') {
    const birim = yillik * a.tekSeferOran;
    return {
      etiket: 'Tavsiye edenin kazancı',
      deger: t(birim),
      aciklama: `Tavsiye ettiği müşterinin ilk faturasından bir kez ${yuzde(a.tekSeferOran)} alır. Bu tutar para olarak ödenir.`,
      bize: `Yeni müşterinin yıllık paketinden bize ${t(yillik - birim)} kalır.`,
      ozet: t(birim),
      ozetBirim: '',
      donemler: [{ ad: `Yılda ${a.tavsiyeSinir} tavsiye`, yillik: birim * a.tavsiyeSinir, formul: `${a.tavsiyeSinir} × ${t(birim)}` }],
      hesap: [{ ad: 'İlk faturadan', formul: `${t(yillik)} × ${yuzde(a.tekSeferOran)}`, sonuc: t(birim) }],
      kurallar: ['Komisyon, müşteri ödeyince kazanılır ve aynı ay ödenir.', 'Komisyon yalnız ilk fatura için ödenir.', 'Müşteri ödemezse komisyon doğmaz. İade olursa komisyon geri alınır.', 'Müşteri desteğini Segika verir.'],
      veri: { oran: a.tekSeferOran, tavsiyeBasina: Math.round(birim) },
    };
  }

  const nakitsiz: Record<string, [string, string, string[]]> = {
    altyapi: ['Yıllık taahhüt', 'Ortak, Segika’yı kendi markasıyla sunar. İş hacmine göre fiyat alır.', ['Ortak, yılda en az kaç firma getireceğini taahhüt eder.', 'Ortak ile şirket bir hizmet seviyesi sözleşmesi (SLA) imzalar. Bu sözleşme hizmetin hangi sürede ve hangi kalitede verileceğini yazar.', 'Fiyat, iş hacmine göre belirlenir.', 'Ortak, teşvik danışmanlığı ya da dış kaynaklı bordro hizmeti verir.', 'Ortak ile şirket, ürünün ileride nasıl gelişeceğini birlikte planlar.']],
    entegrasyon: ['Ortak pazarlama', 'Ortak, bir bordro ya da İK yazılımıdır. Bu yazılım Segika’ya doğrudan yazılım bağlantısıyla (API) bağlanır. İki taraf birlikte pazarlama yapar.', ['İki yazılım birbirine bağlanır. Taraflar ayrıca ortak pazarlama anlaşması yapar.', 'İlk hedef, 2 görüşme yapmak ve 1 anlaşma imzalamaktır.']],
    osgb: ['Yönlendirme anlaşması', 'Bu ortaklıkta karşı taraf bir OSGB, yani ortak sağlık ve güvenlik birimidir. Müşterilerini Segika’ya yönlendirir.', ['Yönlendirme anlaşmasıyla çalışır.', 'Bu ortaklık ikinci aşamada başlar.']],
    dernek: ['Ortak eğitim', 'Bu ortaklıkta karşı taraf bir dernek, organize sanayi bölgesi ya da odadır. Üyelerine Segika ile birlikte eğitim düzenler.', ['Ortak eğitim programıyla çalışır.', 'Bu ortaklık ikinci aşamada başlar.']],
    franchise: ['Merkez sözleşmesi', 'Ortak, bayilik (franchise) sistemiyle çalışan ya da zincir olan bir işletmedir. Bütün şubeler için merkezle tek sözleşme yapılır.', ['Merkezle sözleşme yapılır.', 'Bu ortaklık ikinci aşamada başlar.']],
    arz: ['Nakit ödeme yok', 'Ortak, satıcı üyeleri olan bir kurumdur. Bu kurum üyelerini iStoc’a satıcı olarak getirir.', ['Nakit ödeme yapılmaz. Protokol imzalanır ve üyelerin sonuç raporu paylaşılır.', 'Ortak kendi markasını taşıyan bir program sayfası alır. Üyelerini izleyeceği bir ekran da alır. Üç ayda bir sonuç raporu alır. Üyeleri için özel avantaj da alır.', 'Platform, başarılı satışlardan %3 ile %8 arasında komisyon alır. Kendi alıcılarını getiren üretici ilk 6 ay komisyon ödemez.', 'İlk dönemde 3 ortakla çalışılır.', 'Ortağın aktif sayılması için şirketin doğruladığı en az 20 mağaza sayfası, yani vitrin gerekir.', ...ISTOC_ORTAK_KURALLARI]],
    talep: ['Görev ücreti', 'Ortak, alıcıların satın alma taleplerini toplar. İşlem payı ya da görev ücreti alır.', ['Görev ücretinin %50’sini şirket, görevin kapsamı kabul edilince öder. Kalan %50’sini sonuç takibi yapılınca öder.', 'Ortak ayda en az 2 izinli alım talebi getirir.', 'Kayıt başına ödeme yapılmaz.', 'Ortak, kapalı alıcı kulübüne erişir.', 'Ortağın aktif sayılması için en az 10 nitelikli talep gerekir.', 'İlk dönemde 1 ya da 2 ortakla çalışılır.', ...ISTOC_ORTAK_KURALLARI]],
    hizmet: ['Gelir paylaşımı', 'Ortak, ödeme ya da lojistik gibi bir hizmet verir. Hizmetini “iStoc Onaylı Hizmet” adıyla sunar.', ['Lojistik, ödeme, gümrük, kalite ya da katalog hizmeti verebilir.', 'Gelir paylaşımı ya da yönlendirme ücreti alır.', '“iStoc Onaylı Hizmet” rozetini ve şirketin belirlediği iş adımlarını kullanır.', ...ISTOC_ORTAK_KURALLARI]],
    teknoloji: ['Karşılıklı indirim', 'Ortak, iStoc’a doğrudan yazılım bağlantısıyla (API) bağlanan bir yazılımdır.', ['Kataloglar otomatik eşitlenir ve iki taraf birlikte pazarlama yapar.', 'Liste fiyatında karşılıklı indirim uygulanır.', 'Bu ortaklık ikinci aşamada başlar.']],
    bolge: ['Aktif satıcı başı ödeme', 'Ortak, bir bölgede satıcı ağı kurar. Aktif satıcı başına ödeme ve işlem payı alır.', ['Bu ortaklık iki koşul sağlanınca başlar. Birincisi, 6. ay geçmiş olmalıdır. İkincisi, pazarın çalıştığı kanıtlanmış olmalıdır.', ...ISTOC_ORTAK_KURALLARI]],
  };
  const n = nakitsiz[k];
  return n ? sozlesmeli(...n) : null;
}

/** Karar verisi için: bütün rollerin seçili koşul seti. */
export const kosulOzeti = (a: Ayar) =>
  Object.fromEntries((Object.keys(KOSULLAR) as RolId[]).map((rol) => [rol, { kosul: seciliKosul(a, rol).id, ad: seciliKosul(a, rol).ad, kaynak: seciliKosul(a, rol).kaynak, sonuc: kosulSonucu(a, rol)?.veri ?? null }]));

