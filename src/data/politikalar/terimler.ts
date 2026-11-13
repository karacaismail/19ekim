/**
 * Rehber metinlerindeki kısaltmalar açık yazılır. Okur kısaltmayı bilmek zorunda kalmaz. Örneğin “OSGB” yerine “ortak
 * sağlık ve güvenlik birimi” yazılır. Bu modül küçüktür, çünkü akış görünümü de onu ilk yüklemede kullanır.
 *
 * Ekli biçim (“OSB’deki”) değiştirilmez, çünkü ek Türkçe ada uymaz. Bu biçim kaynakta düz yazılır. Yasaklı ifade
 * (“MLM fırsatı”) silinmez, çünkü kural tam olarak o ifadeyi yasaklar. İfadenin anlamı yanına parantezle eklenir.
 * Düzenli ifadede geriye bakış kullanılmaz, eski Safari sürümleri onu okuyamaz.
 */
const kisaltma = (ad: string, acik: string) => (metin: string) =>
  metin.replace(new RegExp(`(^|[^\\p{L}])${ad}(?![\\p{L}’'])`, 'gu'), `$1${acik}`);

const DONUSUMLER = [
  (m: string) => m.replaceAll('OSGB, yani ortak sağlık ve güvenlik birimi', 'ortak sağlık ve güvenlik birimi'),
  kisaltma('OSGB', 'ortak sağlık ve güvenlik birimi'),
  kisaltma('İK', 'insan kaynakları'),
  kisaltma('OSB', 'organize sanayi bölgesi'),
  (m: string) => m.replaceAll('SGK’lı', 'sigortalı'),
  (m: string) => m.replaceAll('“MLM fırsatı”', '“MLM fırsatı” (MLM, yani çok katmanlı pazarlama)'),
];

export const acikTerimler = (metin: string) => DONUSUMLER.reduce((m, f) => f(m), metin);

/** Program adı cümle başında durur. Bu yüzden kısaltma açıldıktan sonra ilk harf büyük yazılır. */
export const acikAd = (ad: string) => {
  const metin = acikTerimler(ad);
  return metin.charAt(0).toLocaleUpperCase('tr-TR') + metin.slice(1);
};
