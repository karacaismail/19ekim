import { VARSAYILAN_AYAR, type Ayar, type Marka, type RolId } from './satisOrtakligi';
import { kosulListesi } from './kosullar';

export type AlanDegeri = string | number;
export type Alanlar = Record<string, AlanDegeri>;
export interface AlanTanimi { field: string; label: string; value: AlanDegeri; min?: number; max?: number; options?: AlanDegeri[] }
const ROLLER: RolId[] = ['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci'];
const ADLAR: Record<string, string> = {
  model: 'Ödeme modeli', istocAyEur: 'iStoc aylık bedeli (avro)', kur: 'Avronun TL karşılığı', istocYilAy: 'Yıllık paketin ücretli ay sayısı',
  segikaPaket: 'Segika paketi', segikaFiyat: 'Segika aylık blok bedeli (TL)', ikisi: 'Teşvik ve otomasyon', tesvik: 'Teşvik', otomasyon: 'Otomasyon',
  calisan: 'Çalışan sayısı', blok: 'Fiyat bloğundaki çalışan sayısı', kademeler: 'Çalışan indirimi', ust: 'Üst sınır', indirim: 'İndirim oranı',
  oran: 'Katkı komisyonu', sabit: 'Satış başı bedel (TL)', ilkOdeme: 'İlk ödeme oranı', ilkGun: 'İlk ödeme günü', kalanGun: 'Kalan ödeme günü',
  oncuSeviye: 'Öncü ortağın katkısı', oncuAsama: 'Öncü ortağın aylık satış hedefi', maas: 'Aylık maaş (TL)', kotaCarpan: 'Kota maaş çarpanı',
  kotaEk: 'Kotaya ek oran', kadroluPrim: 'Kota üstü prim oranı', kadroluSatis: 'Kadrolu uzmanın aylık satışı', cozumSeviye: 'Çözüm ortağının katkısı',
  cozumOran: 'Çözüm ortağı komisyonu', cozumMusteri: 'Çözüm ortağının yıllık müşterisi', egitimSaat: 'Ücretsiz yıllık eğitim saati',
  egitimSaatUcret: 'Ek eğitimin saat bedeli (TL)', ekEgitimSaat: 'Ek eğitim saati', musavirModel: 'Müşavir ödeme modeli', musavirOran: 'Müşavir komisyon oranı',
  musavirIndirim: 'Müşavir müşterisinin indirim oranı', krediAy: 'Tavsiye edene ücretsiz ay', yeniKrediAy: 'Yeni müşteriye ücretsiz ay', tavsiyeSinir: 'Yıllık tavsiye sınırı',
  elciSeviye: 'Marka elçisinin katkısı', elciSatis: 'Marka elçisinin aylık satışı', kosul: 'Çalışma programı',
  oncu: 'Öncü ortak', kadrolu: 'Kadrolu uzman', cozum: 'Çözüm ortağı', tavsiye: 'Mevcut müşteri', elci: 'Marka elçisi',
  agKomisyon: 'Ağ satış komisyonu (TL)', agKademePay: 'Ağ kademe payı (TL)', agDerinlik: 'Ödeme yapılan kademe sayısı',
  agAltTemsilci: 'Kişi başı temsilci', agAltSatis: 'Kişi başı aylık satış', agTavan: 'Ağ ödeme tavanı (TL)',
  yillaraOncu: 'Öncü ortağın yıllık komisyon oranı', yillaraCozum: 'Çözüm ortağının yıllık komisyon oranı',
  sahaKotaCarpan: 'Saha kotasının maaş çarpanı', sahaPrim: 'Saha satış primi (TL)', liderEk: 'Liderlik maaş farkı (TL)',
  liderPay: 'Liderin ekip satışı payı (TL)', liderEkipSatis: 'Ekibin aylık satışı', yonlendirmeOran: 'Yönlendirme komisyon oranı',
  yonlendirmeAy: 'Yönlendirmede komisyonlu ay', smmmMukellef: 'Müşavirin aktif mükellefi', gelistirmeOran: 'Satıcı geliştirme oranı',
  gelistirmeAy: 'Satıcı geliştirmede komisyonlu ay', tekSeferOran: 'İlk fatura komisyon oranı', affOdeme: 'Müşterinin ödeme biçimi',
  affUfukAy: 'Hesap süresi (ay)', affPolitika: 'Ortağa ödeme zamanı', ayse: 'İlk fatura tavsiyesi', satis: 'Satış ortağı',
  affSonraki: 'Üçüncü yıldan sonraki oran', istoc: 'iStoc', segika: 'Segika', A: 'Yalnız tanıştırma', B: 'Ürün gösterimi', C: 'Satışı kapatma',
};

export function alanlaraAyir(value: unknown, prefix = '', result: Alanlar = {}): Alanlar {
  if (typeof value === 'string' || typeof value === 'number') { result[prefix] = value; return result; }
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    if (key === 'marka' || ['__proto__', 'constructor', 'prototype'].includes(key)) continue;
    alanlaraAyir(child, prefix ? `${prefix}.${key}` : key, result);
  }
  return result;
}

export function alanTanimlari(marka: Marka): AlanTanimi[] {
  const a: Ayar = { ...VARSAYILAN_AYAR, marka, kosul: Object.fromEntries(ROLLER.map((rol) => [rol, 'ana'])) };
  const options: Record<string, AlanDegeri[]> = {
    model: ['oran', 'sabit'], segikaPaket: ['ikisi', 'tesvik', 'otomasyon'], musavirModel: ['komisyon', 'indirim'],
    oncuSeviye: ['A', 'B', 'C'], cozumSeviye: ['A', 'B', 'C'], elciSeviye: ['A', 'B', 'C'], affOdeme: ['paket', 'aylik'], affUfukAy: [12, 24, 36],
  };
  for (const role of ROLLER) options[`kosul.${role}`] = kosulListesi(a, role).map((k) => k.id);
  for (const role of ['ayse', 'satis', 'cozum']) options[`affPolitika.${role}`] = ['tahsilatta', 'hizmet-ayi', 'tahsilatta-taksit'];
  return Object.entries(alanlaraAyir(a)).map(([field, value]) => {
    const rate = /^(oran\.|kadroluPrim\.|yillaraOncu\.|yillaraCozum\.|affSonraki\.)|\.indirim$|^(ilkOdeme|kotaEk|cozumOran|musavirOran|musavirIndirim|yonlendirmeOran|gelistirmeOran|tekSeferOran)$/.test(field);
    const min = ['blok', 'istocYilAy', 'agDerinlik'].includes(field) ? 1 : 0;
    const max = field === 'agDerinlik' ? 3 : field === 'agAltTemsilci' ? 6 : rate ? 1 : 1_000_000_000;
    return { field, label: field.split('.').map((part) => /^\d+$/.test(part) ? `${Number(part) + 1}. sıra` : ADLAR[part] ?? part).join(': '), value,
      ...(typeof value === 'number' ? { min, max } : {}), ...(options[field] ? { options: options[field] } : {}) };
  });
}

export function alanGecerli(def: AlanTanimi, value: unknown): value is AlanDegeri {
  if (typeof value !== typeof def.value) return false;
  if (def.options && !def.options.includes(value as AlanDegeri)) return false;
  return typeof value === 'string' ? value.length <= 80 : typeof value === 'number' && Number.isFinite(value) && value >= (def.min ?? 0) && value <= (def.max ?? 1_000_000_000);
}

/** Yalnız tanımlı yapraklar aktarılır. Dış kayıt nesne yapısını değiştiremez. */
export function alanlardanAyar(marka: Marka, fields: Alanlar): Ayar {
  const result = structuredClone(VARSAYILAN_AYAR);
  result.marka = marka;
  for (const def of alanTanimlari(marka)) {
    const value = Object.hasOwn(fields, def.field) ? fields[def.field] : def.value;
    if (!alanGecerli(def, value)) throw new Error(`${def.label} geçerli değil.`);
    const path = def.field.split('.');
    let target: Record<string, unknown> = result as unknown as Record<string, unknown>;
    for (const part of path.slice(0, -1)) target = target[part] as Record<string, unknown>;
    target[path.at(-1)!] = value;
  }
  return result;
}
