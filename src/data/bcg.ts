/**
 * BCG matrisi eğitimi (genel, Türkçe). Boston Consulting Group büyüme–pay matrisi: ürünleri iki soruyla dört kutuya
 * ayırır. Çalışılmış örnekteki şirket ve sayılar kurgusaldır; yalnız yöntemi göstermek içindir.
 */

export type QuadrantKey = 'yildiz' | 'soru' | 'inek' | 'kopek';

export interface Quadrant {
  key: QuadrantKey;
  name: string;
  english: string;
  /** Matris kartında: kısa durum ve kısa eylem */
  rule: string;
  short: string;
  growth: string;
  share: string;
  cash: string;
  action: string;
  next: string;
}

export const QUADRANTS: Quadrant[] = [
  {
    key: 'yildiz',
    name: 'Yıldız',
    english: 'Star',
    rule: 'Hızlı pazar · yüksek pay',
    short: 'Yatırım yap, liderliği koru',
    growth: 'Hızlı',
    share: 'Yüksek (lideriz)',
    cash: 'Çok kazanır, büyümek için çok harcar',
    action: 'Yatırıma devam et, liderliği koru',
    next: 'Pazar yavaşlayınca Nakit ineği olur',
  },
  {
    key: 'soru',
    name: 'Soru işareti',
    english: 'Question mark',
    rule: 'Hızlı pazar · düşük pay',
    short: 'Seç: yatırım ya da bırak',
    growth: 'Hızlı',
    share: 'Düşük (henüz küçüğüz)',
    cash: 'Çok harcar, az kazanır',
    action: 'Seç: pay kazanabiliyorsan yatırım yap, kazanamıyorsan bırak',
    next: 'Ya Yıldız olur ya Köpek',
  },
  {
    key: 'inek',
    name: 'Nakit ineği',
    english: 'Cash cow',
    rule: 'Yavaş pazar · yüksek pay',
    short: 'Nakit topla, diğerlerine aktar',
    growth: 'Yavaş',
    share: 'Yüksek (lideriz)',
    cash: 'Çok kazanır, az harcar',
    action: 'Verimli işlet; kazandığı nakdi Soru işaretlerine aktar',
    next: 'Uzun süre nakit üretir',
  },
  {
    key: 'kopek',
    name: 'Köpek',
    english: 'Dog',
    rule: 'Yavaş pazar · düşük pay',
    short: 'Küçült veya çık',
    growth: 'Yavaş',
    share: 'Düşük',
    cash: 'Az kazanır, az harcar',
    action: 'Para bağlama; küçük tut veya çık',
    next: 'Kapatılır ya da elden çıkarılır',
  },
];

/** Nakit döngüsü: ürünlerin ve nakdin kutular arasındaki olağan hareketi. */
export const FLOWS: { from: QuadrantKey; to: QuadrantKey; text: string }[] = [
  { from: 'inek', to: 'soru', text: 'Nakit ineğinin kazandığı nakit Soru işaretlerine yatırılır.' },
  { from: 'soru', to: 'yildiz', text: 'Pay kazanan Soru işareti Yıldız olur.' },
  { from: 'yildiz', to: 'inek', text: 'Pazarı yavaşlayan Yıldız Nakit ineğine döner.' },
  { from: 'soru', to: 'kopek', text: 'Pay kazanamayan Soru işareti Köpek olur ve bırakılır.' },
];

export const PURPOSES = [
  'Hangi ürüne para koyalım, hangisinden nakit toplayalım, hangisinden çıkalım? Sorusunu tek resimde yanıtlar.',
  'Bütün ürünleri aynı iki ölçüyle karşılaştırır; tartışmayı “hissiyat”tan sayıya taşır.',
  'Portföyün dengesini gösterir: geleceği besleyen ürünler var mı, bugünü finanse eden ürünler var mı?',
];

export const AXES = [
  {
    axis: 'Dikey eksen',
    name: 'Pazar büyüme hızı',
    question: 'Ürünün satıldığı pazar yılda ne kadar büyüyor?',
    rule: 'Genelde yıllık %10 eşik: üstü “hızlı”, altı “yavaş”.',
  },
  {
    axis: 'Yatay eksen',
    name: 'Göreli pazar payı',
    question: 'Bu pazarda en büyük rakibe göre ne kadar büyüğüz?',
    rule: 'Bizim pay ÷ en büyük rakibin payı. Eşik 1: üstü lider, altı takipçi.',
  },
];

/** Göreli pazar payı hesap örnekleri */
export const SHARE_EXAMPLES = [
  { case: 'Biz %12, en büyük rakip %8', calc: '12 ÷ 8 = 1,5', result: 'Lideriz (1’in üstü)' },
  { case: 'Biz %6, en büyük rakip %24', calc: '6 ÷ 24 = 0,25', result: 'Takipçiyiz: rakip bizim 4 katımız' },
  { case: 'Biz %30 ile lideriz, ikinci oyuncu %15', calc: '30 ÷ 15 = 2,0', result: 'Lider, kendini ikinciyle karşılaştırır' },
];

export const STRATEGIES = [
  { name: 'Büyüt', meaning: 'Payı artırmak için yatırım yap; kısa vadede kârdan vazgeç', where: 'Umut veren Soru işareti' },
  { name: 'Koru', meaning: 'Bugünkü payı savun; yeterli yatırımla konumu tut', where: 'Yıldız, güçlü Nakit ineği' },
  { name: 'Hasat et', meaning: 'Yatırımı kıs, nakdi topla; pay yavaşça düşebilir', where: 'Zayıflayan Nakit ineği, bazı Köpekler' },
  { name: 'Çık', meaning: 'Ürünü sat veya kapat; kaynağı başka ürüne aktar', where: 'Köpek, umutsuz Soru işareti' },
];

export const STEPS = [
  { name: '1. Ürünleri listele', sub: 'Ürün veya iş birimi' },
  { name: '2. Pazarı tanımla', sub: 'Kime, neyi satıyoruz?' },
  { name: '3. Pazar büyümesini bul', sub: 'Yıllık %, son 1–3 yıl' },
  { name: '4. Payları bul', sub: 'Biz ve en büyük rakip' },
  { name: '5. Göreli payı hesapla', sub: 'Bizim ÷ en büyük rakip' },
  { name: '6. Matrise yerleştir', sub: 'Balon büyüklüğü = ciro' },
  { name: '7. Strateji ata', sub: 'Büyüt, koru, hasat et, çık' },
  { name: '8. Dengeyi kontrol et', sub: 'Nakit ineği var mı?' },
];

/** Çalışılmış örnek: kurgusal “Örnek Ev Aletleri A.Ş.” (sayılar uydurmadır, yöntemi göstermek içindir). */
export interface ExampleProduct {
  name: string;
  growth: number;
  ourShare: number;
  rivalShare: number;
  revenue: number;
  strategy: string;
}

export const GROWTH_SPLIT = 10;
export const SHARE_SPLIT = 1;

export const EXAMPLE: ExampleProduct[] = [
  { name: 'Akıllı saat', growth: 18, ourShare: 12, rivalShare: 8, revenue: 40, strategy: 'Koru: liderliği savun, büyümeye yatırım sürsün' },
  { name: 'Kahve makinesi', growth: 3, ourShare: 30, rivalShare: 15, revenue: 90, strategy: 'Koru ve nakit topla: kazancı Soru işaretlerine aktar' },
  { name: 'Elektrikli scooter', growth: 25, ourShare: 2, rivalShare: 20, revenue: 8, strategy: 'Seç: lider 10 kat büyük; büyük yatırım ya da çık' },
  { name: 'Akıllı termostat', growth: 14, ourShare: 6, rivalShare: 10, revenue: 12, strategy: 'Büyüt: lidere yakın (0,6); pay kazanabilir' },
  { name: 'DVD oynatıcı', growth: -6, ourShare: 4, rivalShare: 25, revenue: 5, strategy: 'Hasat et veya çık: pazar küçülüyor' },
];

export const relativeShare = (p: ExampleProduct) => p.ourShare / p.rivalShare;

export function quadrantOf(growth: number, share: number): QuadrantKey {
  if (growth >= GROWTH_SPLIT) return share >= SHARE_SPLIT ? 'yildiz' : 'soru';
  return share >= SHARE_SPLIT ? 'inek' : 'kopek';
}

export const MISTAKES = [
  { mistake: 'Pazarı yanlış tanımlamak', fix: '“İçecek” değil “Türkiye’de kapsül kahve makinesi” gibi rakiplerin gerçekten yarıştığı pazar.' },
  { mistake: 'Mutlak payı göreli pay sanmak', fix: '%20 pay tek başına bir şey söylemez; en büyük rakip %60 ise göreli pay 0,33’tür.' },
  { mistake: 'Enflasyonlu büyümeyi gerçek büyüme sanmak', fix: 'TL cirosu enflasyonla şişer. Adet veya enflasyondan arındırılmış büyüme kullanılır.' },
  { mistake: 'Köpek’i otomatik kapatmak', fix: 'Başka ürünü satan, müşteriyi tutan veya sabit gideri paylaşan Köpek önce tartılır.' },
  { mistake: 'Matrisi bir kez yapıp bırakmak', fix: 'Pazarlar değişir; matris en az yılda bir yeniden çizilir.' },
];

export const LIMITS = [
  'Yalnız iki ölçüye bakar: kârlılık, marka gücü, rekabet yoğunluğu görünmez.',
  'Yüksek pay her zaman yüksek kâr demek değildir (ölçek avantajı her sektörde aynı değildir).',
  'Yeni ürünlerde pazar payını ölçmek zordur; sonuç tahminlere dayanabilir.',
  'Alternatifler: GE–McKinsey matrisi (çok ölçülü çekicilik × güç), Ansoff matrisi (büyüme yönü: mevcut / yeni pazar ve ürün).',
];

export const QUIZ = [
  { situation: 'Pazar yılda %20 büyüyor; payımız %5, en büyük rakip %25.', answer: 'Soru işareti', why: 'Hızlı pazar (≥ %10), göreli pay 5 ÷ 25 = 0,2 (< 1).' },
  { situation: 'Pazar yılda %2 büyüyor; payımız %40, ikinci oyuncu %10.', answer: 'Nakit ineği', why: 'Yavaş pazar, göreli pay 40 ÷ 10 = 4 (lider).' },
  { situation: 'Pazar yılda %15 büyüyor; payımız %18, en büyük rakip %12.', answer: 'Yıldız', why: 'Hızlı pazar, göreli pay 18 ÷ 12 = 1,5 (lider).' },
  { situation: 'Pazar yılda %4 küçülüyor; payımız %3, en büyük rakip %30.', answer: 'Köpek', why: 'Yavaş (küçülen) pazar, göreli pay 0,1.' },
];
