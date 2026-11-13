/**
 * Kararlaştırılan parametreler: tüm sayfaların verisi bunlardan türetilir (src/data/model.ts).
 * Parametreler sayfasında değiştirilen değerler yalnız o tarayıcıda saklanır (localStorage); yayındaki site
 * herkes için varsayılanları gösterir.
 */

export const DEFAULT_PARAMS = {
  /* Takvim */
  startDate: '2026-11-01',
  decStartDate: '2026-12-01',
  metaStartDate: '2026-10-20',
  dijitalAltDate: '2027-01-01',
  /* 90 gün hedefleri */
  ciroTarget: 3_000_000,
  activeTarget: 100,
  memberTarget: 500,
  subscriptionEur: 399,
  eurTry: 55.31,
  annualMonths: 10,
  planRetention: 70,
  /* Kadro */
  sahaCount: 2,
  sahaDecCount: 1,
  masaCount: 1,
  segikaCount: 1,
  dijitalCount: 1,
  organizatorCount: 1,
  asistanCount: 1,
  softwareCount: 4,
  /* Ücret */
  minWage: 28_075.5,
  minWageGross: 33_030,
  costFactor: 2,
  /* Kullanıcı kararı 2026-10-27: saha, organizatör, masa başı ve Segika net ₺ (19 Ekim: 60.000 ve asgari ücret çarpanları) */
  sahaSalary: 50_000,
  masaSalary: 35_000,
  segikaSalary: 35_000,
  organizatorSalary: 50_000,
  dijitalMultiplier: 1.25,
  asistanMultiplier: 1.5,
  leadUplift: 10_000,
  /* Prim */
  commission: 2_500,
  sponsorShare: 500,
  leadTeamShare: 250,
  /* Bütçe */
  metaWeekly: 5_000,
  aiToolsMonthly: 7_500,
  /* Meta hunisi (haftalık) */
  applicationsWeekly: 50,
  activeRepsWeekly: 0.5,
  /* Mesai */
  overtimeCap: 270,
  /* Simülasyon takvimi (kullanıcı kararı 2026-10-27): senaryolar 19 Ekim 2026’da başlar, ilk satış 6 Kasım, ufuk 2027 sonu */
  simStartDate: '2026-10-19',
  firstSaleDate: '2026-11-06',
  simEndDate: '2027-12-31',
  /* Gelir planı (kullanıcı kararı 2026-10-27): kadro kapasitesi, ikinci saha, yıllık peşin payı, kötümser senaryo */
  sahaActivesMonthly: 8,
  crmActivesMonthly: 4,
  organizatorActivesMonthly: 6,
  secondSahaDate: '2027-01-01',
  annualShare: 20,
  pessimisticFactor: 60,
  pessimisticRetention: 50,
  /* Dijital pazarlama stratejisi (kullanıcı kararı 2026-10-27: gider → gelir paradigması): satıcı kazanım reklamı ve organik içerik */
  dijitalAdBudgetMonthly: 30_000,
  dijitalCostPerLead: 600,
  dijitalLeadToActive: 8,
  dijitalAdStartDate: '2026-12-01',
  dijitalOrganicActivesMonthly: 2,
  dijitalOrganicStartDate: '2027-01-01',
  /* Büyüme (kullanıcı kararı 2026-10-27: “ya ileri ya geri”; gelir düz çizgi olamaz): kur, temsilci ağı, reklam ölçeği, saha büyümesi */
  eurTryGrowth: 25,
  repPerMonth: 2,
  repCap: 24,
  sahaMaxCount: 5,
  dijitalScaleMax: 4,
  /* Nakit akışı (kullanıcı kararı 2026-10-27: nakit akış tablosu) */
  openingCash: 0,
  investmentAmount: 0,
  investmentDate: '2026-11-01',
};

export type Params = typeof DEFAULT_PARAMS;
export type ParamKey = keyof Params;

export type ParamKind = 'date' | 'money' | 'count' | 'number' | 'multiplier' | 'percent' | 'rate';

export interface ParamDef {
  key: ParamKey;
  label: string;
  kind: ParamKind;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
}

export interface ParamGroup {
  id: string;
  title: string;
  desc: string;
  fields: ParamDef[];
}

export const PARAM_GROUPS: ParamGroup[] = [
  {
    id: 'takvim',
    title: 'Takvim',
    desc: 'Program başlangıcı değişirse tüm plan kayar. Aralık’ta başlayanların tarihi değişirse organizatör, ekip lideri ve 3. saha personelinin planı kayar.',
    fields: [
      { key: 'startDate', label: 'Program başlangıcı (5 kişi ve Segika)', kind: 'date', help: 'Program başlangıcı, ekibin işe başladığı gündür. 60. ve 90. gün kontrolleri bu tarihe göre yapılır.' },
      { key: 'decStartDate', label: 'Aralık’ta başlayanların başlangıç tarihi', kind: 'date', help: 'Organizatör, ekip lideri ve 3. saha satış uzmanı bu tarihte başlar.' },
      { key: 'metaStartDate', label: 'Meta işe alım reklamları başlangıcı', kind: 'date' },
      { key: 'dijitalAltDate', label: 'Asistan yoksa dijital pazarlama başlangıcı', kind: 'date' },
    ],
  },
  {
    id: 'hedef',
    title: '90 gün hedefleri',
    desc: 'Hedefler değişirse kaynak dağılımı yeni toplamlara orantılı olarak yeniden hesaplanır.',
    fields: [
      { key: 'ciroTarget', label: 'Ciro hedefi', kind: 'money', unit: '₺', min: 0, step: 50_000 },
      { key: 'activeTarget', label: 'Aktif satıcı hedefi', kind: 'count', unit: 'satıcı', min: 1 },
      { key: 'memberTarget', label: 'Üye satıcı hedefi', kind: 'count', unit: 'satıcı', min: 0 },
      { key: 'subscriptionEur', label: 'Aktif satıcı aboneliği', kind: 'number', unit: '€ / ay', min: 0 },
      { key: 'eurTry', label: 'Kur', kind: 'rate', unit: '₺ / €', min: 0, step: 0.01 },
      { key: 'annualMonths', label: 'Yıllık peşin ödemede ücreti alınan ay sayısı', kind: 'count', unit: 'ay', min: 1, max: 12, help: '“2 ay bedava” kampanyasında bu değer 10 olur.' },
      { key: 'planRetention', label: 'Plan senaryosu: aylık elde tutma', kind: 'percent', unit: '%', min: 0, max: 100 },
    ],
  },
  {
    id: 'kadro',
    title: 'Kadro (kişi sayısı)',
    desc: 'İşe alım sırası, organizasyon şeması ve maliyet hesapları bu sayılara göre hazırlanır.',
    fields: [
      { key: 'sahaCount', label: 'Saha satış: program başında', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'sahaDecCount', label: 'Saha satış: Aralık’ta eklenen', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'masaCount', label: 'İstoç Pazarlama CRM uzmanı', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'segikaCount', label: 'Segika CRM', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'dijitalCount', label: 'Dijital pazarlama', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'organizatorCount', label: 'Organizatör', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'asistanCount', label: 'Asistan', kind: 'count', unit: 'kişi', min: 0 },
      { key: 'softwareCount', label: 'Yazılım ekibi (Scrum)', kind: 'count', unit: 'kişi', min: 0 },
    ],
  },
  {
    id: 'ucret',
    title: 'Ücret',
    desc: 'İşveren maliyeti, bir çalışanın şirkete aylık toplam maliyetidir. Hesap bu maliyeti maaşı bir çarpanla çarparak bulur. Çarpan SGK primini, yemeği, bilgisayarı, vergileri ve diğer giderleri kapsar. Örneğin çarpan 2 ise 50.000 ₺ maaşın maliyeti 100.000 ₺ olur.',
    fields: [
      { key: 'minWage', label: 'Asgari ücret (net, aylık)', kind: 'money', unit: '₺', min: 0, step: 0.5, help: '2026’da asgari ücret net 28.075,50 ₺, brüt 33.030 ₺’dır. Ocak 2027 zammı açıklanınca bu değeri güncelleyin.' },
      { key: 'minWageGross', label: 'Asgari ücret (brüt, aylık)', kind: 'money', unit: '₺', min: 0, step: 0.5, help: '2026’da brüt asgari ücret 33.030 ₺’dır. Ücret hesap araçlarında bu tutarı temel tutar olarak seçebilirsiniz.' },
      { key: 'costFactor', label: 'İşveren maliyeti çarpanı', kind: 'multiplier', unit: '× maaş', min: 1, step: 0.05 },
      { key: 'sahaSalary', label: 'Saha satış maaşı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000 },
      { key: 'masaSalary', label: 'İstoç Pazarlama CRM uzmanı maaşı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000, help: 'Net tutardır. Bu tutara 27 Ekim 2026 Salı günü karar verildi.' },
      { key: 'segikaSalary', label: 'Segika CRM maaşı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000, help: 'Net tutardır. Bu tutara 27 Ekim 2026 Salı günü karar verildi.' },
      { key: 'dijitalMultiplier', label: 'Dijital pazarlama maaşı (asgari ücretin katı)', kind: 'multiplier', unit: '× asgari ücret', min: 0, step: 0.05 },
      { key: 'asistanMultiplier', label: 'Asistan maaşı (asgari ücretin katı)', kind: 'multiplier', unit: '× asgari ücret', min: 0, step: 0.05 },
      { key: 'organizatorSalary', label: 'Organizatör maaşı', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000, help: 'Net tutardır. Bu tutara 27 Ekim 2026 Salı günü karar verildi.' },
      { key: 'leadUplift', label: 'Ekip liderine ek ücret', kind: 'money', unit: '₺ / ay', min: 0, step: 1_000 },
    ],
  },
  {
    id: 'prim',
    title: 'Prim ve kota',
    desc: 'Saha satış uzmanı bir ayda belli bir tutarın üstünde satış yaparsa prim alır. Bu tutara kota denir. Kota, uzmanın şirkete aylık maliyetine eşittir. Örneğin maliyet 100.000 ₺ ise kota ayda 100.000 ₺ satıştır.',
    fields: [
      { key: 'commission', label: 'Satış başına prim', kind: 'money', unit: '₺', min: 0, step: 100 },
      { key: 'sponsorShare', label: 'Sponsor payı (1. kademe)', kind: 'money', unit: '₺ / satış', min: 0, step: 50, help: 'MLM (çok katmanlı pazarlama) ağında temsilci satış yapınca bir üstündeki kişiye de pay ödenir. Bu kişiye sponsor denir. Pay en çok 2 kademe yukarı gider. İkinci kademenin tutarı henüz belirlenmedi.' },
      { key: 'leadTeamShare', label: 'Ekip lideri ekip payı', kind: 'money', unit: '₺ / satış', min: 0, step: 50 },
    ],
  },
  {
    id: 'butce',
    title: 'Bütçe ve temsilci başvuruları',
    desc: 'Meta işe alım reklamları bağımsız temsilci bulmak içindir. Reklamlar başvuru getirir. Başvuranların bir kısmı temsilci olarak kalır. Başvuru sayısı değişirse sonraki sayılar da aynı oranda değişir.',
    fields: [
      { key: 'metaWeekly', label: 'Meta reklam bütçesi', kind: 'money', unit: '₺ / hafta', min: 0, step: 500 },
      { key: 'aiToolsMonthly', label: 'Yapay zekâ ve otomasyon araçları (ayda en çok)', kind: 'money', unit: '₺ / ay', min: 0, step: 500 },
      { key: 'applicationsWeekly', label: 'Başvuru (en fazla)', kind: 'count', unit: '/ hafta', min: 0 },
      { key: 'activeRepsWeekly', label: 'Aktif kalan temsilci', kind: 'number', unit: '/ hafta', min: 0, step: 0.1, help: 'Örneğin 0,5, her 2 haftada 1 temsilci demektir.' },
    ],
  },
  {
    id: 'gelir',
    title: 'Gelir planı',
    desc: 'Bu gruptaki değerler gelir planının tarihlerini, kadro kapasitesini ve senaryolarını belirler. Kadro kapasitesi, tam kapasitede kişi başına ayda kazanılan yeni aktif satıcı sayısıdır. İlk ay bu kapasitenin yüzde 50’si, ikinci ay yüzde 75’i kullanılır.',
    fields: [
      { key: 'simStartDate', label: 'Senaryo başlangıcı', kind: 'date', help: 'Senaryo başlangıcı, hesabın başladığı gündür. Tüm senaryolar, tablolar ve grafikler bu tarihten başlar. Bu tarihe 27 Ekim 2026 Salı günü karar verildi.' },
      { key: 'firstSaleDate', label: 'İlk satış', kind: 'date', help: 'İlk satışın başlangıç tarihidir. Satışa bağlı ödemeler bu tarihten önce sıfır kabul edilir. İlk satış ayında satış yalnız kalan günler için sayılır. Örneğin satış 6 Kasım Cuma günü başlarsa hesap Kasım’ın kalan günlerini sayar.' },
      { key: 'simEndDate', label: 'Plan bitiş tarihi', kind: 'date', help: 'Senaryolar bu ayın sonuna kadar sürer. Plan sonu olarak 2027 sonu seçildi.' },
      { key: 'sahaActivesMonthly', label: 'Aylık yeni aktif satıcı (saha personeli)', kind: 'count', unit: 'satıcı / ay, kişi başına', min: 0, help: 'Günde yaklaşık 8 ziyaretle haftada yaklaşık 10 kayıt ve ayda 8 ilk ödeme varsayılır.' },
      { key: 'crmActivesMonthly', label: 'Aylık yeni aktif satıcı (İstoç Pazarlama CRM uzmanı)', kind: 'count', unit: 'satıcı / ay', min: 0, help: 'Günde yaklaşık 40 arama ve 100 e-postayla haftada yaklaşık 5 kayıt varsayılır.' },
      { key: 'organizatorActivesMonthly', label: 'Aylık yeni aktif satıcı (organizatör)', kind: 'count', unit: 'satıcı / ay', min: 0, help: 'Ayda 2 etkinlik ve etkinlik başına yaklaşık 25 katılımcıyla yaklaşık 30 kayıt varsayılır.' },
      { key: 'secondSahaDate', label: 'İkinci saha personelinin başlangıcı (sistem oturunca)', kind: 'date', help: 'Tarih olarak ayın ilk gününü yazın.' },
      { key: 'annualShare', label: 'Yıllık peşin ödeyen yeni satıcı payı', kind: 'percent', unit: '%', min: 0, max: 100, help: 'Yıllık peşin ödeme 3.990 €’dur. Bu tutar 10 aylık ücrete eşittir. Diğer yeni satıcılar ayda 399 € öder.' },
      { key: 'pessimisticFactor', label: 'Kötümser senaryo: kapasite çarpanı', kind: 'percent', unit: '%', min: 10, max: 100 },
      { key: 'pessimisticRetention', label: 'Kötümser senaryo: aylık elde tutma', kind: 'percent', unit: '%', min: 0, max: 100 },
    ],
  },
  {
    id: 'dijital',
    title: 'Dijital pazarlama: giderden gelire',
    desc: 'Satıcı kazanım reklamının getirdiği yeni aktif satıcı iki adımda bulunur. Önce bütçe, bir kaydın maliyetine bölünür. Bu, kayıt sayısını verir. Sonra kayıt sayısı, ödemeye geçenlerin oranıyla çarpılır. Örneğin 30.000 ₺ bütçeyle 50 kayıt gelir. Her 100 kayıttan 8’i ödeme yaparsa 50 kayıttan 4 yeni satıcı gelir. İlk ay bu sayının yüzde 50’si, ikinci ay yüzde 75’i gerçekleşir. Organik içerik, dijital pazarlama uzmanının ürettiği videolardan gelir. Meta işe alım reklamı ayrı bir kalemdir. Bu kalem “Bütçe ve temsilci başvuruları” grubundadır.',
    fields: [
      { key: 'dijitalAdBudgetMonthly', label: 'Satıcı kazanım reklam bütçesi', kind: 'money', unit: '₺ / ay', min: 0, step: 5_000, help: 'Meta ve Google Arama reklamlarını kapsar. 0 yazılırsa reklam verilmez.' },
      { key: 'dijitalCostPerLead', label: 'Kayıt başına reklam maliyeti', kind: 'money', unit: '₺ / kayıt', min: 1, step: 50, help: 'Kayıt, reklamdaki formu dolduran toptancıdır. Bu kişi işletmeler arası satışta (B2B) potansiyel müşteridir.' },
      { key: 'dijitalLeadToActive', label: 'Kayıttan ilk ödemeye dönüşüm', kind: 'percent', unit: '%', min: 0, max: 100, help: 'Kayıtlar CRM üzerinden arama ve WhatsApp ile takip edilir. Bu dönüşüm saha ziyaretindekinden düşüktür.' },
      { key: 'dijitalAdStartDate', label: 'Reklam başlangıcı', kind: 'date', help: 'Reklam, ölçüm araçları kurulduktan sonra başlar. Bu araçlar Meta Pixel, bağlantı etiketi (UTM) ve CRM kaynak alanıdır. Tarih olarak ayın ilk gününü yazın.' },
      { key: 'dijitalOrganicActivesMonthly', label: 'Aylık yeni aktif satıcı (organik içerik)', kind: 'count', unit: 'satıcı / ay', min: 0, help: 'Günde 3 video üretildiği ve haftada 10 CRM talebi geldiği varsayılır.' },
      { key: 'dijitalOrganicStartDate', label: 'Organik içerik başlangıcı', kind: 'date', help: 'Video üretimi bu tarihte tam hıza ulaşır. Ocak’ta günde 3 video üretilir. Tarih olarak ayın ilk gününü yazın.' },
    ],
  },
  {
    id: 'buyume',
    title: 'Büyüme',
    desc: 'Gelir planı zamanla büyür veya küçülür. Plan düz bir çizgi olarak kalmaz. Bu karar 27 Ekim 2026 Salı günü verildi. Fiyatın ₺ karşılığı kurla birlikte artar. Temsilci ağı her ay genişler. Reklam bütçesi, satıcıdan beklenen toplam gelirin (LTV) satıcıyı kazanma maliyetine (CAC) oranına göre büyür. Plan ve iyimser senaryolarda saha kadrosu belirli aralıklarla büyür. Kötümser senaryoda büyüme olmaz.',
    fields: [
      { key: 'eurTryGrowth', label: 'Kur artışı (₺/€, yıllık)', kind: 'percent', unit: '% / yıl', min: 0, max: 200, help: 'Abonelik fiyatı euro olarak değişmez. Euro kuru her ay biraz artar ve artış bir önceki ayın kuruna eklenir. Bu yüzden fiyatın ₺ karşılığı her ay yükselir. 2026 TÜFE (tüketici fiyat endeksi) yaklaşık yüzde 30’dur.' },
      { key: 'repPerMonth', label: 'Temsilci ağına her ay eklenen temsilci', kind: 'count', unit: 'kişi / ay', min: 0 },
      { key: 'repCap', label: 'Temsilci ağı: üst sınır', kind: 'count', unit: 'temsilci', min: 0 },
      { key: 'sahaMaxCount', label: 'Saha personeli üst sınırı (büyüme kuralıyla)', kind: 'count', unit: 'kişi', min: 1, help: 'İlk iki saha personeli bu sayıya dahildir. Plan senaryosunda her 6 ayda, iyimser senaryoda her 4 ayda 1 kişi eklenir.' },
      { key: 'dijitalScaleMax', label: 'Reklam bütçesinin en çok kaç katına çıkacağı', kind: 'multiplier', unit: '× başlangıç', min: 1, step: 0.5, help: 'LTV ÷ CAC en az 3 ise bütçe her 3 ayda 1,5 katına çıkar.' },
    ],
  },
  {
    id: 'nakit',
    title: 'Nakit akışı',
    desc: 'Bu grup “Nakit akışı” sayfasının başlangıç nakdini ve yatırım girişini belirler. Tablodaki girişler gelir planı senaryosundan, giderler ise Sheets’ten gelir.',
    fields: [
      { key: 'openingCash', label: 'Başlangıç nakdi (Ekim 2026)', kind: 'money', unit: '₺', min: 0, step: 100_000 },
      { key: 'investmentAmount', label: 'Yatırım girişi', kind: 'money', unit: '₺', min: 0, step: 500_000, help: '0 yazılırsa yatırım girişi olmaz ve tablo nakit açığını gösterir.' },
      { key: 'investmentDate', label: 'Yatırım girişi ayı', kind: 'date', help: 'Tarih olarak ayın ilk gününü yazın. Tarih Ekim 2026 ile Aralık 2027 arasında değilse yatırım tabloda görünmez.' },
    ],
  },
  {
    id: 'mesai',
    title: 'Mesai (yasal tavan)',
    desc: '4857 sayılı İş Kanunu’na göre normal çalışma haftada 45 saattir. Günlük çalışma en çok 11 saat olabilir.',
    fields: [{ key: 'overtimeCap', label: 'Yıllık fazla çalışma tavanı', kind: 'count', unit: 'saat', min: 0, help: '4857 sayılı kanunun 41. maddesine göre fazla çalışma yılda en çok 270 saat olabilir.' }],
  },
];

export const PARAMS_KEY = 'istoc-plan-parametreler';

/** Kayıtlı değerleri okur; bilinmeyen anahtar ve tür uyuşmazlığı varsayılanla değişir. */
/** Alan tanımları anahtara göre (doğrulama için). */
const DEFS: Partial<Record<ParamKey, ParamDef>> = Object.fromEntries(PARAM_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f])));
const ISO_GUN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Saklanan değerin alanın anlamına uygunluğu (docs/missings.md MS-05 / T05): tür eşleşmesi yetmez — tarih alanı geçerli bir
 * ISO gün olmalı; sayı sonlu ve alan tanımındaki min–max içinde olmalı. Geçersiz değer domain’e geçmez (varsayılan kalır).
 */
export function gecerliParametre(key: ParamKey, value: unknown): boolean {
  const d = DEFAULT_PARAMS[key];
  if (typeof value !== typeof d) return false;
  const def = DEFS[key];
  if (typeof value === 'string') {
    if (def?.kind === 'date' || ISO_GUN.test(d as string)) {
      if (!ISO_GUN.test(value)) return false;
      const t = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === value;
    }
    return true;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return false;
    if (def?.min !== undefined && value < def.min) return false;
    if (def?.max !== undefined && value > def.max) return false;
  }
  return true;
}

/**
 * Tarayıcı kaydını doğrulayarak yükler (MS-05): geçersiz alanlar varsayılana döner ve `gecersiz` listesinde bildirilir; ham
 * metin korunur (kayıt sessizce yeniden yazılmaz — ilk kullanıcı kaydında geçersizler düşer). Kayıt yoksa `params: null`.
 */
export function loadParamsDetay(): { params: Params | null; gecersiz: ParamKey[]; ham: string | null } {
  let ham: string | null = null;
  try {
    ham = localStorage.getItem(PARAMS_KEY);
    if (!ham) return { params: null, gecersiz: [], ham: null };
    const stored = JSON.parse(ham) as Partial<Record<string, unknown>> | null;
    if (!stored || typeof stored !== 'object') return { params: null, gecersiz: [], ham };
    const merged = { ...DEFAULT_PARAMS } as Record<string, unknown>;
    const gecersiz: ParamKey[] = [];
    for (const key of Object.keys(DEFAULT_PARAMS) as ParamKey[]) {
      if (!(key in stored)) continue;
      const value = stored[key];
      if (gecerliParametre(key, value)) merged[key] = value;
      else gecersiz.push(key);
    }
    return { params: merged as Params, gecersiz, ham };
  } catch {
    return { params: null, gecersiz: [], ham };
  }
}

export function loadParams(): Params | null {
  return loadParamsDetay().params;
}

/** Alanın görünen adı (bildirimler için); tanımı yoksa anahtar. */
export const paramEtiketi = (key: ParamKey) => DEFS[key]?.label ?? key;

export function saveParams(params: Params) {
  try {
    const changed = Object.fromEntries(
      (Object.keys(DEFAULT_PARAMS) as ParamKey[]).filter((k) => params[k] !== DEFAULT_PARAMS[k]).map((k) => [k, params[k]]),
    );
    if (Object.keys(changed).length) localStorage.setItem(PARAMS_KEY, JSON.stringify(changed));
    else localStorage.removeItem(PARAMS_KEY);
    return true;
  } catch {
    return false;
  }
}

export const changedKeys = (params: Params) => (Object.keys(DEFAULT_PARAMS) as ParamKey[]).filter((k) => params[k] !== DEFAULT_PARAMS[k]);
