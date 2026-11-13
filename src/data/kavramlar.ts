/**
 * Kavramlar (kullanıcı kararı 13 Kasım 2026, karar listesi 7.1 ve 2.1): rol sayfalarındaki “Kavramlar” kutusu. Kutuda
 * yalnız o sayfanın metninde geçen terimler görünür. Tanımlar kaynakta yazar ya da kullanıcı onaylamıştır. Tanımı
 * kaynakta olmayan terim buraya eklenmez, kullanıcıya sorulur (karar listesi 2. konu).
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
];

/** Metinde geçen kavramlar, listedeki sırayla. */
export const metindekiKavramlar = (metin: string) => KAVRAMLAR.filter((k) => k.ara.test(metin));
