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
    rule: 'Hızlı pazar, yüksek pay',
    short: 'Yatırım yapın, liderliği koruyun',
    growth: 'Hızlı',
    share: 'Yüksek (lideriz)',
    cash: 'Çok kazanır, büyümek için çok harcar',
    action: 'Yatırıma devam edin, liderliği koruyun',
    next: 'Pazar yavaşlayınca Nakit ineği olur',
  },
  {
    key: 'soru',
    name: 'Soru işareti',
    english: 'Question mark',
    rule: 'Hızlı pazar, düşük pay',
    short: 'Yatırım yapın ya da bırakın',
    growth: 'Hızlı',
    share: 'Düşük (henüz küçüğüz)',
    cash: 'Çok harcar, az kazanır',
    action: 'Ürün pay kazanabiliyorsa yatırım yapın. Kazanamıyorsa ürünü bırakın.',
    next: 'Ya Yıldız ya da Köpek olur',
  },
  {
    key: 'inek',
    name: 'Nakit ineği',
    english: 'Cash cow',
    rule: 'Yavaş pazar, yüksek pay',
    short: 'Nakit toplayın, diğer ürünlere aktarın',
    growth: 'Yavaş',
    share: 'Yüksek (lideriz)',
    cash: 'Çok kazanır, az harcar',
    action: 'Ürünü verimli işletin. Kazandığı nakdi Soru işaretlerine aktarın.',
    next: 'Uzun süre nakit üretir',
  },
  {
    key: 'kopek',
    name: 'Köpek',
    english: 'Dog',
    rule: 'Yavaş pazar, düşük pay',
    short: 'Küçültün ya da satıştan çekin',
    growth: 'Yavaş',
    share: 'Düşük',
    cash: 'Az kazanır, az harcar',
    action: 'Ürüne yeni para yatırmayın. Ürünü küçük tutun ya da satıştan çekin.',
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
  '“Hangi ürüne para koyalım, hangisinden nakit toplayalım, hangisinden çıkalım?” sorusunu tek resimde yanıtlar.',
  'Bütün ürünleri aynı iki ölçüyle karşılaştırır. Böylece tartışmayı “hissiyat”tan sayılara taşır.',
  'Portföyün, yani ürünlerin bütününün dengesini gösterir. Yarın para kazandıracak ürünler var mı? Bugün para kazandıran ürünler var mı?',
];

export const AXES = [
  {
    axis: 'Dikey eksen',
    name: 'Pazar büyüme hızı',
    question: 'Ürünün satıldığı pazar yılda ne kadar büyüyor?',
    rule: 'Eşik genelde yıllık %10’dur. Üstü “hızlı”, altı “yavaş” sayılır.',
  },
  {
    axis: 'Yatay eksen',
    name: 'Göreli pazar payı',
    question: 'Bu pazarda en büyük rakibe göre ne kadar büyüğüz?',
    rule: 'Göreli pay, bizim payımızın en büyük rakibin payına bölümüdür. Eşik 1’dir. Üstü lider, altı takipçi sayılır.',
  },
];

/** Göreli pazar payı hesap örnekleri */
export const SHARE_EXAMPLES = [
  { case: 'Biz %12, en büyük rakip %8', calc: '12 ÷ 8 = 1,5', result: 'Lideriz (1’in üstü)' },
  { case: 'Biz %6, en büyük rakip %24', calc: '6 ÷ 24 = 0,25', result: 'Takipçiyiz: rakip bizim 4 katımız' },
  { case: 'Biz %30 ile lideriz, ikinci büyük şirket %15', calc: '30 ÷ 15 = 2,0', result: 'Lider, kendini ikinciyle karşılaştırır' },
];

export const STRATEGIES = [
  { name: 'Büyütün', meaning: 'Payı artırmak için yatırım yapın. Kısa vadede kârdan vazgeçin.', where: 'Umut veren Soru işareti' },
  { name: 'Koruyun', meaning: 'Bugünkü payı savunun. Yeterli yatırımla konumu koruyun.', where: 'Yıldız, güçlü Nakit ineği' },
  { name: 'Hasat edin', meaning: 'Yatırımı kısın ve nakdi toplayın. Pay yavaş yavaş düşebilir.', where: 'Zayıflayan Nakit ineği, bazı Köpekler' },
  { name: 'Pazardan çıkın', meaning: 'Ürünü elden çıkarın ya da kapatın. Kaynağı başka ürüne aktarın.', where: 'Köpek, umutsuz Soru işareti' },
];

export const STEPS = [
  { name: '1. Ürünleri listeleyin', sub: 'Ürün ya da iş birimi' },
  { name: '2. Pazarı tanımlayın', sub: 'Kime ne sattığınızı yazın' },
  { name: '3. Pazar büyümesini bulun', sub: 'Son 1 ile 3 yılın yıllık büyümesi' },
  { name: '4. Payları bulun', sub: 'Bizim ve en büyük rakibin payı' },
  { name: '5. Göreli payı hesaplayın', sub: 'Bizim payın en büyük rakibin payına bölümü' },
  { name: '6. Matrise yerleştirin', sub: 'Balon büyüklüğü ciroyu gösterir' },
  { name: '7. Strateji seçin', sub: 'Büyütün, koruyun, hasat edin ya da pazardan çıkın' },
  { name: '8. Dengeyi kontrol edin', sub: 'Nakit ineği olup olmadığına bakın' },
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
  { name: 'Akıllı saat', growth: 18, ourShare: 12, rivalShare: 8, revenue: 40, strategy: 'Koruyun. Liderliği savunun ve büyümeye yatırımı sürdürün.' },
  { name: 'Kahve makinesi', growth: 3, ourShare: 30, rivalShare: 15, revenue: 90, strategy: 'Koruyun ve nakit toplayın. Kazancı Soru işaretlerine aktarın.' },
  { name: 'Elektrikli scooter', growth: 25, ourShare: 2, rivalShare: 20, revenue: 8, strategy: 'Seçim yapın. Lider 10 kat büyük. Ya büyük yatırım yapın ya da pazardan çıkın.' },
  { name: 'Akıllı termostat', growth: 14, ourShare: 6, rivalShare: 10, revenue: 12, strategy: 'Büyütün. Ürün lidere yakın (0,6) ve pay kazanabilir.' },
  { name: 'DVD oynatıcı', growth: -6, ourShare: 4, rivalShare: 25, revenue: 5, strategy: 'Hasat edin ya da pazardan çıkın. Pazar küçülüyor.' },
];

export const relativeShare = (p: ExampleProduct) => p.ourShare / p.rivalShare;

export function quadrantOf(growth: number, share: number): QuadrantKey {
  if (growth >= GROWTH_SPLIT) return share >= SHARE_SPLIT ? 'yildiz' : 'soru';
  return share >= SHARE_SPLIT ? 'inek' : 'kopek';
}

export const MISTAKES = [
  { mistake: 'Pazarı yanlış tanımlamak', fix: 'Pazar, rakiplerin gerçekten yarıştığı alan olarak tanımlanır. Örneğin “içecek” değil, “Türkiye’de kapsül kahve makinesi” seçilir.' },
  { mistake: 'Mutlak payı göreli pay sanmak', fix: '%20 pay tek başına bir şey söylemez. En büyük rakibin payı %60 ise göreli pay 0,33’tür.' },
  { mistake: 'Enflasyonlu büyümeyi gerçek büyüme sanmak', fix: '₺ cinsinden ciro enflasyonla şişer. Bu yüzden satılan adedin büyümesine bakın. Ya da fiyat artışının etkisini çıkarıp büyümeyi hesaplayın.' },
  { mistake: 'Köpek’i düşünmeden kapatmak', fix: 'Köpek başka bir ürünün satışına yardım ediyor, müşteriyi tutuyor veya sabit gideri paylaşıyor olabilir. Bu yüzden ürünü kapatmadan önce bu etkileri inceleyin.' },
  { mistake: 'Matrisi bir kez yapıp bırakmak', fix: 'Pazarlar değişir. Bu yüzden matris en az yılda bir yeniden çizilir.' },
];

export const LIMITS = [
  'Matris yalnız iki ölçüye bakar. Kârlılık, marka gücü ve rekabet yoğunluğu görünmez.',
  'Yüksek pay her zaman yüksek kâr demek değildir. Çünkü çok üretmenin maliyet avantajı her sektörde aynı değildir.',
  'Yeni ürünlerde pazar payını ölçmek zordur. Bu yüzden sonuç tahminlere dayanabilir.',
  'Başka yöntemler de var. GE–McKinsey matrisi pazarın çekiciliğini ve şirketin gücünü birçok ölçüyle değerlendirir. Ansoff matrisi büyüme yönünü mevcut veya yeni pazara ve ürüne göre seçer.',
];

export const QUIZ = [
  { situation: 'Pazar yılda %20 büyüyor. Payımız %5, en büyük rakibin payı %25.', answer: 'Soru işareti', why: 'Pazar hızlı büyüyor, çünkü büyüme %10 ya da üstünde. Göreli pay 5’in 25’e bölümüdür, yani 0,2. Bu sayı 1’den küçüktür.' },
  { situation: 'Pazar yılda %2 büyüyor. Payımız %40, ikinci büyük şirketin payı %10.', answer: 'Nakit ineği', why: 'Pazar yavaş büyüyor. Göreli pay 40’ın 10’a bölümüdür, yani 4. Ürün lider.' },
  { situation: 'Pazar yılda %15 büyüyor. Payımız %18, en büyük rakibin payı %12.', answer: 'Yıldız', why: 'Pazar hızlı büyüyor. Göreli pay 18’in 12’ye bölümüdür, yani 1,5. Ürün lider.' },
  { situation: 'Pazar yılda %4 küçülüyor. Payımız %3, en büyük rakibin payı %30.', answer: 'Köpek', why: 'Pazar küçülüyor, bu yüzden yavaş pazar sayılır. Göreli pay 3’ün 30’a bölümüdür, yani 0,1.' },
];
