/**
 * Kavramlar (kullanıcı kararı 13 Kasım 2026, karar listesi 7.1 ve 2.1): rol sayfalarındaki “Kavramlar” kutusu. Kutuda
 * yalnız o sayfanın metninde geçen terimler görünür. Tanımlar kaynakta yazar ya da kullanıcı onaylamıştır.
 *
 * Kullanıcı kararı 16 Kasım 2026 (“kararları sen ver”): karar listesinin 2. konusundaki terimlerin tanımını ajan
 * verdi. Her tanım terimin sitedeki kullanımından çıkarıldı. Yeni terim de aynı yolla tanımlanır. Sponsor, aktivasyon,
 * panel, ECA ve kalite kapısı gibi tek sayfada geçen terimler o sayfadaki cümlede tanımlanır.
 */
export interface Kavram {
  terim: string;
  tanim: string;
  /** Sayfa metninde bu terimi arayan desen. */
  ara: RegExp;
}

export const KAVRAMLAR: Kavram[] = [
  // Kullanıcı kararı 13 Kasım 2026 (karar listesi 2.1).
  { terim: 'Aktif satıcı', tanim: 'İlk ödemesini yapmış ve ürünleri yayında olan satıcıdır.', ara: /aktif satıcı/iu },
  // CRM aşaması “Kayıt” (program.ts → CRM aşamaları): “Satıcı istoc.com’da üye hesabı açtı”.
  { terim: 'Kayıt', tanim: 'Satıcının istoc.com’da üye hesabı açmasıdır.', ara: /(?<![\p{L}])kayıt(?![\p{L}])/iu },
  // Karar 16 Kasım 2026. Kaynak: program.ts (“Üye satıcı: Kayıtlı ama ödeme yapmayan satıcı.”).
  { terim: 'Üye satıcı', tanim: 'istoc.com’da üye hesabı açmış ama henüz ödeme yapmamış satıcıdır.', ara: /üye satıcı/iu },
  // Karar 16 Kasım 2026. Kaynak: growth.ts temsilci bulma adımları (ilk eğitim, ilk satış, “Aktif kalan”).
  { terim: 'Aktif temsilci', tanim: 'İlk eğitime katılmış ve ilk satışını yapmış temsilcidir. Temsilci ağdan ayrılınca aktif sayılmaz.', ara: /aktif temsilci/iu },
  // Karar 16 Kasım 2026. Hedef roles.ts içinde: “Günde 60 kişiyi arayın. Bunların 20’siyle nitelikli görüşme yapın.”
  { terim: 'Nitelikli görüşme', tanim: 'Karar veren kişiyle yapılan ve ihtiyacın konuşulduğu görüşmedir. Açılmayan ya da hemen kapanan arama sayılmaz.', ara: /nitelikli görüşme/iu },
  // Karar 16 Kasım 2026. Kaynak: roles.ts (“CRM’deki Segika hattını her gün güncellersiniz.”).
  { terim: 'Segika hattı', tanim: 'CRM’de Segika müşteri adaylarının ve görüşmelerinin tutulduğu ayrı listedir.', ara: /segika hatt/iu },
  // Karar 16 Kasım 2026. Modül adları satıcının istoc.com’u kullanma sırasından çıkarıldı (digital.ts “Nasıl yapılır”).
  { terim: 'Eğitim modülleri (M1–M5)', tanim: 'Satıcı eğitiminin beş bölümüdür. M1 hesap ve mağaza kurulumudur. M2 ürün yüklemedir. M3 fiyat ve tekliftir. M4 sipariş ve ödemedir. M5 reklam ve büyümedir.', ara: /(?<![\p{L}\p{N}])M[1-5](?![\p{N}])/u },
];

/** Rol sayfasının taradığı metin: rol kaydı ve dijital pazarlama sayfasındaki içerik planı. */
export const rolKavramMetni = (role: { slug: string }, ekMetin = '') => JSON.stringify(role) + (role.slug === 'dijital-pazarlama' ? ekMetin : '');

/** Metinde geçen kavramlar, listedeki sırayla. */
export const metindekiKavramlar = (metin: string) => KAVRAMLAR.filter((k) => k.ara.test(metin));
