/**
 * Satış ortaklığı programı (/satis-ortakligi/; kullanıcı kararları 2026-11-03): iStoc ve Segika için beş ortak rolü.
 * Ödeme iki modelle hesaplanır: işe göre oran (tanıştırma A, demo B, kapanış C) ya da satış başı sabit tutar.
 * iStoc yıllık paket 10 ay bedelidir; tavsiye ödülü hizmet kredisidir; mali müşavir için komisyon ya da indirim seçilir.
 * Bütün sayılar değiştirilebilir başlangıç değeridir (`VARSAYILAN_AYAR`); kaynak docs: satis-ortakligi-programi.md.
 */

export type Marka = 'istoc' | 'segika';
export type Model = 'oran' | 'sabit';
export type Seviye = 'A' | 'B' | 'C';
export type SegikaPaket = 'ikisi' | 'tesvik' | 'otomasyon';
export type RolId = 'oncu' | 'kadrolu' | 'cozum' | 'tavsiye' | 'elci';

export interface Ayar {
  marka: Marka;
  model: Model;
  /* Fiyat */
  istocAyEur: number;
  kur: number;
  istocYilAy: number;
  segikaPaket: SegikaPaket;
  /** Paket fiyatı: blok başına aylık (₺). */
  segikaFiyat: Record<SegikaPaket, number>;
  /** Müşterinin çalışan sayısı. */
  calisan: number;
  /** Fiyat bloğu: kaç çalışan için bir paket fiyatı (sitede 25). */
  blok: number;
  /** Kademeli indirim: çalışan sayısı bu sınıra kadar olan kısma indirim uygulanır (son kademe sınırsız). */
  kademeler: { ust: number; indirim: number }[];
  /* Ödeme */
  oran: Record<Seviye, number>;
  sabit: number;
  ilkOdeme: number;
  ilkGun: number;
  kalanGun: number;
  /* Roller */
  oncuSeviye: Seviye;
  oncuAsama: [number, number, number, number];
  maas: number;
  kotaCarpan: number;
  kotaEk: number;
  kadroluPrim: Record<Marka, number>;
  kadroluSatis: number;
  /** iStoc çözüm ortağı: yaptığı işe göre oran (tanıştırır / demo / kapanış). */
  cozumSeviye: Seviye;
  /** Segika çözüm ortağı komisyonu: müşteri desteğini ortak verir (kullanıcı kararı 2026-11-03). */
  cozumOran: number;
  cozumMusteri: number;
  /** Yılda ücretsiz program eğitimi (saat); fazlası saat başı ücretlidir. */
  egitimSaat: number;
  egitimSaatUcret: number;
  ekEgitimSaat: number;
  musavirModel: 'komisyon' | 'indirim';
  musavirOran: number;
  musavirIndirim: number;
  krediAy: number;
  yeniKrediAy: number;
  tavsiyeSinir: number;
  elciSeviye: Seviye;
  elciSatis: number;
  /*
   * Koşul setleri (kullanıcı kararı 2026-11-03: dört Pazarlama sayfası tek sayfada). Rol başına seçili set; boşsa ana
   * program. Setlerin tanımı ve hesabı src/data/kosullar.ts içindedir.
   */
  kosul: Partial<Record<RolId, string>>;
  /**
   * Temsilci ağı (kullanıcı kararı 2026-11-03: kademeli ağ). Satış yapan komisyon alır; üstündeki kişiler kademe
   * derinliğine kadar kademe payı alır, aşağı indikçe pay küçülür. Kazanç yalnız gerçek satıştan doğar.
   */
  agKomisyon: number;
  /** 1., 2. ve 3. kademe payı (satış başı ₺). */
  agKademePay: [number, number, number];
  /** Kaç kademe yukarıya pay gider (1–3). */
  agDerinlik: number;
  /** Her temsilcinin getirdiği temsilci sayısı. */
  agAltTemsilci: number;
  /** Her temsilcinin aylık satışı. */
  agAltSatis: number;
  /** Bir satış için ödenen toplam tutarın üst sınırı. */
  agTavan: number;
  /** Affilate: yıllara yayılan komisyon oranları (1., 2., 3. yıl). */
  yillaraOncu: [number, number, number];
  yillaraCozum: [number, number, number];
  /** Temsilci ağı: saha personeli kotası maaşın katı; kota sonrası satış başı prim. */
  sahaKotaCarpan: number;
  sahaPrim: number;
  /** Temsilci ağı: ekip lideri maaş farkı, ekip satışı başına pay ve ekibin aylık satışı. */
  liderEk: number;
  liderPay: number;
  liderEkipSatis: number;
  /** İş ortaklığı (Segika P2): ilk ödenmiş aylardan oran. */
  yonlendirmeOran: number;
  yonlendirmeAy: number;
  /** İş ortaklığı (Segika P1): mali müşavirin aktif mükellef sayısı. */
  smmmMukellef: number;
  /** İş ortaklığı (iStoc): satıcı geliştirme oranı ve süresi. */
  gelistirmeOran: number;
  gelistirmeAy: number;
  /** Affilate: tek seferlik tavsiye, ilk faturadan oran. */
  tekSeferOran: number;
}

export const VARSAYILAN_AYAR: Ayar = {
  marka: 'istoc',
  model: 'oran',
  istocAyEur: 399,
  kur: 56,
  istocYilAy: 10,
  segikaPaket: 'ikisi',
  segikaFiyat: { ikisi: 2_600, tesvik: 1_850, otomasyon: 1_600 },
  calisan: 25,
  blok: 25,
  kademeler: [
    { ust: 500, indirim: 0 },
    { ust: 2_000, indirim: 0.2 },
    { ust: 10_000, indirim: 0.35 },
    { ust: 0, indirim: 0.5 },
  ],
  oran: { A: 0.08, B: 0.12, C: 0.18 },
  sabit: 2_500,
  ilkOdeme: 0.7,
  ilkGun: 14,
  kalanGun: 60,
  oncuSeviye: 'B',
  oncuAsama: [0, 1, 2, 4],
  maas: 50_000,
  kotaCarpan: 2,
  kotaEk: 0.2,
  kadroluPrim: { istoc: 0.05, segika: 0.1 },
  kadroluSatis: 2,
  cozumSeviye: 'C',
  cozumOran: 0.25,
  cozumMusteri: 10,
  egitimSaat: 8,
  egitimSaatUcret: 1_500,
  ekEgitimSaat: 4,
  musavirModel: 'indirim',
  musavirOran: 0.08,
  musavirIndirim: 0.2,
  krediAy: 2,
  yeniKrediAy: 1,
  tavsiyeSinir: 3,
  elciSeviye: 'A',
  elciSatis: 2,
  kosul: {},
  agKomisyon: 2_500,
  agKademePay: [500, 250, 100],
  agDerinlik: 2,
  agAltTemsilci: 2,
  agAltSatis: 2,
  agTavan: 3_250,
  yillaraOncu: [0.15, 0.1, 0],
  yillaraCozum: [0.25, 0.15, 0],
  sahaKotaCarpan: 2,
  sahaPrim: 2_500,
  liderEk: 10_000,
  liderPay: 250,
  liderEkipSatis: 10,
  yonlendirmeOran: 0.15,
  yonlendirmeAy: 6,
  smmmMukellef: 10,
  gelistirmeOran: 0.1,
  gelistirmeAy: 6,
  tekSeferOran: 0.1,
};

export const SEVIYE_ADI: Record<Seviye, string> = { A: 'Yalnız tanıştırır', B: 'Demo da yapar', C: 'Satışı kendisi kapatır' };
export const PAKET_ADI: Record<SegikaPaket, string> = { ikisi: 'Teşvik ve Otomasyon', tesvik: 'SGK Teşvik', otomasyon: 'SGK Otomasyon' };

/**
 * Segika aylık fiyatı: çalışan sayısı blok katına yuvarlanır; her kademedeki çalışanlar o kademenin indirimiyle
 * fiyatlanır (kademeli, sıçramasız). 1–500 sitedeki liste fiyatı; üst kademe indirimleri teklif varsayımıdır.
 */
export function segikaAylik(a: Ayar) {
  const blok = Math.max(1, a.blok);
  const kisi = Math.max(blok, Math.ceil(Math.max(1, a.calisan) / blok) * blok);
  const kisiBasi = a.segikaFiyat[a.segikaPaket] / blok;
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

/** Aylık fiyat (₺). */
export const aylikFiyat = (a: Ayar) => (a.marka === 'istoc' ? a.istocAyEur * a.kur : segikaAylik(a).toplam);
/** Yıllık paket bedeli (₺, KDV hariç). iStoc: yıllık ay bedeli; Segika: 12 ay. */
export const yillikFiyat = (a: Ayar) => (a.marka === 'istoc' ? a.istocAyEur * a.kur * a.istocYilAy : segikaAylik(a).toplam * 12);
/**
 * Çözüm ortağının bir müşteriden kazancı. Segika: oran modelinde kendi oranı (%25); iStoc: yaptığı işin oranı.
 * Tutar modelinde satış başı tutar.
 */
export const cozumKazanci = (a: Ayar) =>
  a.model === 'sabit' ? a.sabit : a.marka === 'segika' ? yillikFiyat(a) * a.cozumOran : yillikFiyat(a) * a.oran[a.cozumSeviye];

/** Bir yıllık paket satışında ortağın kazancı. */
export const satisKazanci = (a: Ayar, s: Seviye) => (a.model === 'oran' ? yillikFiyat(a) * a.oran[s] : a.sabit);

export const kota = (a: Ayar) => a.maas * a.kotaCarpan * (1 + a.kotaEk);

export function kadrolu(a: Ayar) {
  const yillik = yillikFiyat(a);
  const ciro = a.kadroluSatis * yillik;
  const k = kota(a);
  const kotaIcinSatis = yillik > 0 ? Math.ceil(k / yillik) : 0;
  const prim = a.model === 'oran' ? Math.max(0, ciro - k) * a.kadroluPrim[a.marka] : Math.max(0, a.kadroluSatis - kotaIcinSatis) * a.sabit;
  return { ciro, kota: k, kotaIcinSatis, prim, toplam: a.maas + prim, doluluk: k > 0 ? ciro / k : 0 };
}

/** Aşama süreleri (gün): ilk 14 gün, 15–45, 46–90, 91–365. İlk yıl kazancı bu sürelerle hesaplanır. */
const ASAMA_GUN = [14, 31, 45, 275];
const GUN_AY = 365 / 12;

export interface DonemSatiri {
  ad: string;
  yillik: number;
  /** Yıllık tutarın nasıl hesaplandığı (kısa formül). */
  formul: string;
}

/**
 * Dönemsel kazanç (kullanıcı kararı 2026-11-03): her rolün seçili ayarlarla yaklaşık yıllık kazancı. Günlük = yıllık ÷ 365,
 * haftalık = yıllık ÷ 52, aylık = yıllık ÷ 12. Satış adetleri her ay aynı kabul edilir; öncü ortakta ilk yıl aşamalarla hesaplanır.
 */
export function donemKazanci(a: Ayar, rol: RolId): DonemSatiri[] {
  const n = (v: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v);
  const t = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))}\u00a0₺`;
  if (rol === 'oncu') {
    const birim = satisKazanci(a, a.oncuSeviye);
    const ilkYilSatis = a.oncuAsama.reduce((top, adet, i) => top + (adet * ASAMA_GUN[i]) / GUN_AY, 0);
    return [
      { ad: 'İlk yıl', yillik: ilkYilSatis * birim, formul: `${n(ilkYilSatis)} satış × ${t(birim)}` },
      { ad: '2. yıldan sonra', yillik: a.oncuAsama[3] * 12 * birim, formul: `${a.oncuAsama[3]} satış × 12 ay × ${t(birim)}` },
    ];
  }
  if (rol === 'kadrolu') {
    const k = kadrolu(a);
    return [
      { ad: 'Maaş', yillik: a.maas * 12, formul: `${t(a.maas)} × 12 ay` },
      { ad: 'Prim', yillik: k.prim * 12, formul: `${t(k.prim)} × 12 ay` },
      { ad: 'Toplam', yillik: k.toplam * 12, formul: `${t(k.toplam)} × 12 ay` },
    ];
  }
  if (rol === 'cozum') {
    const birim = cozumKazanci(a);
    const brut = birim * a.cozumMusteri;
    const satirlar: DonemSatiri[] = [{ ad: 'Komisyon', yillik: brut, formul: `${a.cozumMusteri} müşteri × ${t(birim)}` }];
    const egitim = a.marka === 'segika' ? a.ekEgitimSaat * a.egitimSaatUcret : 0;
    if (egitim > 0) satirlar.push({ ad: 'Ek eğitim düşülünce', yillik: brut - egitim, formul: `${t(brut)} − ${t(egitim)}` });
    return satirlar;
  }
  if (rol === 'tavsiye') {
    const kredi = aylikFiyat(a) * a.krediAy;
    return [{ ad: `Yılda ${a.tavsiyeSinir} tavsiye (kredi)`, yillik: kredi * a.tavsiyeSinir, formul: `${a.tavsiyeSinir} × ${t(kredi)}` }];
  }
  const birim = satisKazanci(a, a.elciSeviye);
  return [{ ad: 'Elçi', yillik: birim * a.elciSatis * 12, formul: `${a.elciSatis} satış × 12 ay × ${t(birim)}` }];
}

export function musavir(a: Ayar) {
  const yillik = yillikFiyat(a);
  return a.musavirModel === 'komisyon'
    ? { tur: 'komisyon' as const, musteriBasina: yillik * a.musavirOran, toplam: yillik * a.musavirOran * a.cozumMusteri }
    : { tur: 'indirim' as const, musteriBasina: yillik * a.musavirIndirim, toplam: yillik * a.musavirIndirim * a.cozumMusteri };
}

export interface RolMetni {
  id: RolId;
  ad: string;
  kisa: string;
  kim: string;
  kurallar: string[];
  /** Kimlerle çalışırız: persona başlıkları. */
  kimler: string[];
}

/** Kısa, tam cümleli metinler (yalın Türkçe talimatı). Ayrıntı eylem planındadır. */
export function rolMetinleri(marka: Marka): RolMetni[] {
  const urun = marka === 'istoc' ? 'iStoc' : 'Segika';
  return [
    {
      id: 'oncu',
      ad: 'Öncü satış ortağı',
      kisa: 'Satışa yeni başlayan gençler',
      kim:
        marka === 'istoc'
          ? 'Deniz 22 yaşında, son sınıf öğrencisi. Gerçek işletmelerle görüşerek satış öğrenmek istiyor. Kazancı, ödeme yapan müşteri sayısıyla artar.'
          : 'Ece 23 yaşında, İK ya da muhasebe öğrencisi. Doğru işletmeyi bulur ve demo ayarlar. Teşvik sonucu hakkında söz vermez.',
      kurallar: ['Kazanç garantisi verilmez.', 'Başarılı olanı kadro görüşmesine çağırırız.', 'Tahsilat yapmaz, indirim veremez.'],
      kimler:
        marka === 'istoc'
          ? ['Üniversite öğrencisi', 'Yeni mezun', 'İşletme ve pazarlama öğrencisi', 'Yarı zamanlı çalışmak isteyen', 'Ticarete ilgi duyan genç']
          : ['İK öğrencisi', 'Muhasebe öğrencisi', 'Çalışma ekonomisi mezunu', 'İşletme öğrencisi', 'Yeni mezun'],
    },
    {
      id: 'kadrolu',
      ad: 'Kadrolu satış uzmanı',
      kisa: marka === 'segika' ? 'SGK’lı, kota sonrası %10 prim' : 'Sabit maaş ve kota üstü prim',
      kim:
        marka === 'segika'
          ? 'Bizim SGK’lı çalışanımızdır. Satışı yapar ve müşteri listesini yönetir. Kotayı aşınca cironun %10’unu prim olarak alır.'
          : 'Bizimle maaşlı çalışır. Müşteri listesini yönetir ve satışı kapatır. Kotayı aşınca prim kazanır.',
      kurallar:
        marka === 'segika'
          ? ['Müşteri desteğini biz veririz. Müşteri, destek uzmanımıza WhatsApp, e-posta ya da telefonla ulaşır.', 'Müşteri ilişkileri için CRM yazılımını biz sağlarız.', 'Prim, müşteri ödeyince ve iade süresi geçince ödenir.']
          : ['İlk iki ay kota yoktur, işi öğrenir.', 'Prim, müşteri ödeyince ve iade süresi geçince ödenir.'],
      kimler:
        marka === 'istoc'
          ? ['Deneyimli saha satışçısı', 'B2B satış temsilcisi', 'Toptan sektöründen satışçı', 'Bayi satış sorumlusu', 'Öncü ortaklardan yükselen']
          : ['Yazılım satış temsilcisi', 'Bordro yazılımı satışçısı', 'Muhasebe yazılımı satışçısı', 'SGK bilgili satış uzmanı', 'Öncü ortaklardan yükselen'],
    },
    {
      id: 'cozum',
      ad: 'Profesyonel çözüm ortağı',
      kisa: marka === 'segika' ? 'Desteği kendisi verir, %25 alır' : 'Danışmanlar ve hizmet firmaları',
      kim:
        marka === 'istoc'
          ? 'İşletme sahibinin zaten güvendiği danışman ya da firmadır. iStoc’u müşterisine önerir. Kurulumu ve desteği biz yaparız.'
          : 'İşverene bordro, İK ya da iş güvenliği hizmeti veren profesyoneldir. Segika’yı müşterisine önerir ve müşterinin desteğini kendisi verir.',
      kurallar:
        marka === 'segika'
          ? ['Müşteri ilişkileri için CRM yazılımını biz sağlarız.', 'Sözleşmeyle çalışır, faturalı öder.', 'Her firma tek ortağa yazılır.']
          : ['Sözleşmeyle çalışır, faturalı öder.', 'Ortak getirmeye para ödemeyiz.', 'Her firma tek ortağa yazılır.'],
      kimler:
        marka === 'istoc'
          ? ['E-ihracat danışmanı', 'Katalog ve fotoğraf stüdyosu', 'E-ticaret ajansı', 'ERP ve POS bayisi', 'Lojistik firması', 'Gümrük müşaviri', 'Çarşı derneği', 'Fuar organizatörü', 'Üretici birlikleri']
          : ['Mali müşavir', 'Bordro bürosu', 'OSGB', 'Bağımsız İK danışmanı', 'İK dernekleri', 'OSB yönetimi', 'Sanayi ve ticaret odası', 'ERP bayisi (Luca, Mikro, ETA)', 'Özel istihdam bürosu', 'İş hukuku avukatı'],
    },
    {
      id: 'tavsiye',
      ad: 'Arkadaşını getir',
      kisa: 'Mevcut müşterinin tavsiyesi',
      kim:
        marka === 'istoc'
          ? 'İstoç’taki müşterimiz komşu dükkâna iStoc’u söyler. Komşu yıllık alırsa iki taraf da ücretsiz kullanım kazanır.'
          : 'Segika müşterisi, başka firmadaki İK ya da muhasebe yöneticisine Segika’yı önerir. Firma yıllık alırsa iki taraf da kazanır.',
      kurallar: ['Ödül nakit değil, ücretsiz kullanımdır.', 'Yeni müşteri 60 gün devam edince kredi yazılır.'],
      kimler:
        marka === 'istoc'
          ? ['Mevcut iStoc satıcısı', 'Çarşıdaki komşu dükkân', 'Aynı bloktaki toptancı', 'Tedarikçi esnaf', 'Müşteri esnaf']
          : ['Mevcut Segika müşterisi', 'İK yöneticisi', 'Muhasebe yöneticisi', 'Aynı OSB’deki firma', 'Grup şirketleri'],
    },
    {
      id: 'elci',
      ad: 'Marka elçisi',
      kisa: 'İçerik üreticileri ve eğitmenler',
      kim: `Sosyal medyada ${urun}’u kendi bağlantısıyla tanıtır. Bağlantıdan gelen müşteri ödeme yaparsa komisyon alır.`,
      kurallar: ['Paylaşımda “reklam” yazar.', 'Sahte yorum ve toplu mesaj yasaktır.'],
      kimler:
        marka === 'istoc'
          ? ['Toptan ticaret eğitmeni', 'E-ihracat içerik üreticisi', 'LinkedIn yazarı', 'Sektör YouTube kanalı', 'Girişimcilik topluluğu']
          : ['İK içerik üreticisi', 'Bordro eğitmeni', 'SGK mevzuat yazarı', 'LinkedIn İK topluluğu', 'Muhasebe YouTube kanalı'],
    },
  ];
}

export const ASAMA_ADI = ['Eğitim dönemi', 'İlk müşteri', 'Düzenli satış', 'Deneyimli'];
export const ASAMA_SURE = ['İlk 14 gün', '15–45. gün', '46–90. gün', '90. günden sonra'];
