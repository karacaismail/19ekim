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
  segikaFiyat: Record<SegikaPaket, number>;
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
  cozumSeviye: Seviye;
  cozumMusteri: number;
  musavirModel: 'komisyon' | 'indirim';
  musavirOran: number;
  musavirIndirim: number;
  krediAy: number;
  yeniKrediAy: number;
  tavsiyeSinir: number;
  elciSeviye: Seviye;
  elciSatis: number;
}

export const VARSAYILAN_AYAR: Ayar = {
  marka: 'istoc',
  model: 'oran',
  istocAyEur: 399,
  kur: 56,
  istocYilAy: 10,
  segikaPaket: 'ikisi',
  segikaFiyat: { ikisi: 2_600, tesvik: 1_850, otomasyon: 1_600 },
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
  cozumMusteri: 10,
  musavirModel: 'indirim',
  musavirOran: 0.08,
  musavirIndirim: 0.2,
  krediAy: 2,
  yeniKrediAy: 1,
  tavsiyeSinir: 3,
  elciSeviye: 'A',
  elciSatis: 2,
};

export const SEVIYE_ADI: Record<Seviye, string> = { A: 'Tanıştırır', B: 'Demo yapar', C: 'Satışı kapatır' };
export const PAKET_ADI: Record<SegikaPaket, string> = { ikisi: 'Teşvik ve Otomasyon', tesvik: 'SGK Teşvik', otomasyon: 'SGK Otomasyon' };

/** Aylık liste fiyatı (₺). */
export const aylikFiyat = (a: Ayar) => (a.marka === 'istoc' ? a.istocAyEur * a.kur : a.segikaFiyat[a.segikaPaket]);
/** Yıllık paket bedeli (₺, KDV hariç). iStoc: yıllık ay bedeli; Segika: 12 ay. */
export const yillikFiyat = (a: Ayar) => (a.marka === 'istoc' ? a.istocAyEur * a.kur * a.istocYilAy : a.segikaFiyat[a.segikaPaket] * 12);
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
    },
    {
      id: 'kadrolu',
      ad: 'Kadrolu satış uzmanı',
      kisa: 'Sabit maaş ve kota üstü prim',
      kim: `Bizimle maaşlı çalışır. Müşteri listesini yönetir ve satışı kapatır. Kotayı aşınca prim kazanır.`,
      kurallar: ['İlk iki ay kota yoktur, işi öğrenir.', 'Prim, müşteri ödeyince ve iade süresi geçince ödenir.'],
    },
    {
      id: 'cozum',
      ad: 'Profesyonel çözüm ortağı',
      kisa: marka === 'istoc' ? 'Danışmanlar ve hizmet firmaları' : 'Müşavirler, OSGB ve İK çevresi',
      kim:
        marka === 'istoc'
          ? 'İşletme sahibinin zaten güvendiği danışman ya da firmadır. iStoc’u müşterisine önerir. Kurulumu ve desteği biz yaparız.'
          : 'İşverene bordro, İK ya da iş güvenliği hizmeti veren profesyoneldir. Segika’yı müşterisine önerir. Kurulumu ve desteği biz yaparız.',
      kurallar: ['Sözleşmeyle çalışır, faturalı öder.', 'Ortak getirmeye para ödemeyiz.', 'Her firma tek ortağa yazılır.'],
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
    },
    {
      id: 'elci',
      ad: 'Marka elçisi',
      kisa: 'İçerik üreticileri ve eğitmenler',
      kim: `Sosyal medyada ${urun}’u kendi bağlantısıyla tanıtır. Bağlantıdan gelen müşteri ödeme yaparsa komisyon alır.`,
      kurallar: ['Paylaşımda “reklam” yazar.', 'Sahte yorum ve toplu mesaj yasaktır.'],
    },
  ];
}

export const ORTAK_TURLERI: Record<Marka, string[]> = {
  istoc: ['E-ihracat danışmanı', 'Katalog ve fotoğraf stüdyosu', 'E-ticaret ajansı', 'ERP ve POS bayisi', 'Lojistik firması', 'Gümrük müşaviri', 'Çarşı derneği', 'Fuar organizatörü', 'Üretici birlikleri'],
  segika: ['Mali müşavir', 'Bordro bürosu', 'OSGB', 'Bağımsız İK danışmanı', 'İK dernekleri', 'OSB yönetimi', 'Sanayi ve ticaret odası', 'ERP bayisi (Luca, Mikro, ETA)', 'Özel istihdam bürosu', 'İş hukuku avukatı'],
};

export const ASAMA_ADI = ['Öğrenir', 'İlk müşteri', 'Portföy', 'Usta'];
export const ASAMA_SURE = ['0–14. gün', '15–45. gün', '46–90. gün', '90. gün sonrası'];
