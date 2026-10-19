/**
 * Çok Katmanlı Pazarlama (Multi-Level Marketing, MLM) — doğrudan satış ağı.
 * Aday bulma Meta reklamlarıyla, haftalık 5.000 ₺ bütçeyle ve sürekli. Kazanç planı oranları karar bekliyor.
 */

export const META_WEEKLY_BUDGET = 5000;

/** Kademe yapısı (piramit grafik): 90. gün hedefi; tepede strateji, tabanda bağımsız satış temsilcileri. */
export const levels = [
  { level: 'Seviye 0', name: 'İsmail Karaca', role: 'Strateji ve operasyon yönetimi', count: 1 },
  { level: 'Seviye 1', name: 'Ekip lideri', role: 'Ağın sponsoru ve koçu (1 Aralık)', count: 1 },
  { level: 'Seviye 2', name: 'Çekirdek ekip', role: 'Pazarlamacı, saha uzmanı, organizatör, dijital pazarlama', count: 4 },
  { level: 'Seviye 3', name: 'Bağımsız satış temsilcileri', role: '1. kuşak; Meta reklamlarıyla ayda ~2', count: 5 },
];

export const tiers = [
  { tier: 'Seviye 0', role: 'Strateji ve operasyon yönetimi', who: 'İsmail Karaca', when: 'Şimdi', earning: '—' },
  { tier: 'Seviye 1', role: 'Ekip lideri (sponsor)', who: 'İşe alınanlar arasından seçilir', when: '1 Aralık 2026', earning: 'Maaş + liderlik farkı + ekip ve ağ satış primi' },
  { tier: 'Seviye 2', role: 'Çekirdek ekip', who: 'Pazarlamacı, saha uzmanı, organizatör, dijital pazarlama', when: 'Kasım–Aralık 2026', earning: 'Maaş + prim + fazla çalışma ücreti' },
  { tier: 'Seviye 3', role: 'Bağımsız satış temsilcisi (1. kuşak)', who: 'Meta reklamlarından gelen adaylar, mentor programı mezunu satıcılar', when: '23 Kasım’dan itibaren, sürekli', earning: 'Yalnız kendi gerçekleşen satışından komisyon (kişisel satış hacmi)' },
  { tier: 'Seviye 4', role: 'Alt hat (2. kuşak)', who: 'Seviye 3 temsilcilerin sponsor olduğu temsilciler', when: 'Şubat–Mart 2027', earning: 'Kendi satışı; sponsoruna alt hattın gerçek satışından tavanlı kademe primi' },
];

export const glossary = [
  { term: 'Çok katmanlı pazarlama (MLM, network marketing)', meaning: 'Bağımsız temsilcilerin ürün sattığı ve kendi alt hatlarını kurduğu doğrudan satış modeli.', here: 'iStoc pazarlama çözümü paketlerinin satıcılara satışı' },
  { term: 'Doğrudan satış', meaning: 'Mağaza dışında, temsilci aracılığıyla yapılan satış.', here: 'Modelin yasal adı ve çerçevesi' },
  { term: 'Bağımsız satış temsilcisi (distribütör)', meaning: 'Maaşlı olmayan, kendi satışından komisyon alan satış ortağı.', here: 'Seviye 3 ve 4' },
  { term: 'Sponsor / üst hat (upline)', meaning: 'Temsilciyi ağa kazandıran ve ilk satışlarına eşlik eden kişi.', here: 'Ekip lideri, deneyimli temsilciler' },
  { term: 'Alt hat (downline)', meaning: 'Bir temsilcinin kazandırdığı temsilciler ve onların kazandırdıkları.', here: '2. kuşak (Şubat–Mart 2027)' },
  { term: 'Kişisel satış hacmi (PV)', meaning: 'Temsilcinin kendi gerçekleşen satışları.', here: 'Komisyonun tek esası' },
  { term: 'Grup satış hacmi (GV)', meaning: 'Temsilci ve alt hattının toplam gerçekleşen satışı.', here: 'Kademe priminin esası' },
  { term: 'Kademe primi (override)', meaning: 'Alt hattın gerçek satışından sponsora verilen sınırlı pay.', here: 'Tavanlı; kayıt başına ödeme yok' },
  { term: 'Kazanç planı (compensation plan)', meaning: 'Komisyon, kademe primi ve kariyer seviyelerinin kuralları.', here: 'Karar bekliyor (14 Kasım)' },
  { term: 'Unilevel plan', meaning: 'Her temsilcinin doğrudan alt hattının tek seviyede genişlediği, derinliği sınırlı plan.', here: 'Öneri: en çok 2 seviye derinlik' },
  { term: 'Piramit satış sistemi', meaning: 'Kazancın satıştan değil yeni üye kaydından geldiği yapı.', here: 'Yasak; uyum ilkeleri bunu önler' },
];

/** Meta reklam → aktif temsilci hunisi (haftalık; ilk 2 hafta ölçülerek kalibre edilir). */
export const recruitmentFunnel = [
  { stage: 'Meta reklamından başvuru', value: 50, note: 'En fazla ~50; başvuru başına ≥ 100 ₺' },
  { stage: 'Telefonla ön eleme', value: 25, note: '48 saat içinde' },
  { stage: 'Bilgilendirme toplantısı (ofis)', value: 12, note: 'Haftada 1 oturum' },
  { stage: 'Temsilci onboarding’ine başlayan', value: 6, note: 'Sözleşme + eğitim' },
  { stage: 'İlk satışını yapan', value: 2, note: 'Sponsor eşliğinde' },
  { stage: 'Aktif kalan (ayrılmayan)', value: 0.5, note: 'Haftada ~0,5 → ayda ~2 aktif temsilci' },
];

export const earningPrinciples = [
  'Kazanç yalnız tahsil edilmiş gerçek satıştan doğar (kişisel ve grup satış hacmi).',
  'Temsilci kazandırmak tek başına para kazandırmaz; kayıt başına prim yoktur.',
  'Temsilciden giriş ücreti, zorunlu alım, stok yükleme veya eğitim ücreti istenmez.',
  'Kademe primi alt hattın gerçek satışına bağlıdır, tavanlıdır ve en çok 2 seviye derinliktedir.',
  'Temsilci istediği zaman, cezasız ayrılabilir.',
];

export const compliance = [
  'Piramit satış sistemleri 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında yasaktır; kazancın ağırlığı yeni katılımcı getirmekten geliyorsa model piramide döner.',
  'Kazanç planı ve temsilci sözleşmesi, ilk reklamdan önce hukuk danışmanı ve mali müşavire teyit ettirilir.',
  'Meta reklamlarında ürün ve iş açıkça anlatılır; “az emekle hızlı kazanç” vaadi ve MLM fırsatı reklamı yapılmaz (Meta reklam standartları bunu kısıtlar). İş ilanlarında “İstihdam” özel reklam kategorisi gerekebilir; bu durumda yaş ve cinsiyet hedeflemesi yapılamaz.',
  'Temsilcinin statüsü (bağımsız temsilci, komisyon sözleşmesi) ve vergi yükümlülükleri yazılı olarak netleşir.',
  'Başvuru formundaki kişisel veriler için KVKK aydınlatma metni; adaylar yalnız işe alım amacıyla aranır.',
  'Ekip lideri ayda bir uyum kontrolü yapar: kayıt başına ödeme, zorunlu alım veya gelir vaadi olmamalıdır.',
];

export const growthTimeline = [
  { period: '20 Ekim – 14 Kasım', step: 'Kazanç planı, temsilci sözleşmesi, hukuk ve mali müşavir teyidi; Meta reklam hesabı ve başvuru formu', owner: 'İsmail Karaca (Meta reklamlarının sorumlusu)', output: 'Onaylı model' },
  { period: '16 Kasım → sürekli', step: 'Meta temsilci reklamları: haftalık 5.000 ₺', owner: 'Dijital pazarlama (asistansız senaryoda 1 Ocak’a kadar İsmail Karaca)', output: 'Haftada en fazla ~50 başvuru' },
  { period: '23 Kasım', step: 'İlk bilgilendirme toplantısı (ofis toplantı salonu) ve ilk temsilci grubu', owner: 'İsmail Karaca, saha ekibi', output: 'İlk 10 aday onboarding’de' },
  { period: '1 Aralık', step: 'Ekip lideri ağı devralır', owner: 'Ekip lideri', output: 'Haftalık bilgilendirme ve ilk satış eşlikleri' },
  { period: '30 Aralık', step: '60. gün kontrolü', owner: 'Ekip lideri, asistan', output: '~3 aktif temsilci' },
  { period: '30 Ocak 2027', step: '90. gün değerlendirmesi', owner: 'İsmail Karaca', output: '~5 aktif temsilci · ağdan 45 kayıt ve 9 aktif satıcı' },
  { period: 'Şubat–Mart 2027', step: '2. kuşak alt hat (sponsorluk)', owner: 'Ekip lideri', output: '~10 aktif temsilci (ayda ~2)' },
];

export const growthKpis = [
  { metric: 'Meta reklam bütçesi', target: '5.000 ₺ / hafta (~20.000 ₺ / ay), sürekli', note: '20 Ekim – 30 Ocak: 15 hafta ≈ 75.000 ₺ (işe alım + temsilci)' },
  { metric: 'Aktif temsilci başına maliyet', target: '~10.000 ₺', note: 'Ayda 20.000 ₺ ile en fazla ~2 aktif temsilci' },
  { metric: 'Başvuru', target: 'Haftada en fazla ~50', note: 'Başvuru başına ≥ 100 ₺; ilk 2 haftada ölçülür, kreatifler haftalık yenilenir' },
  { metric: 'Aktif temsilci', target: 'Aralık sonu ~3 · Ocak sonu ~5', note: 'Son 30 günde en az 1 gerçek satış; ayrılmayan' },
  { metric: 'Ağdan gelen kayıt ve aktif satıcı', target: '45 kayıt · 9 aktif satıcı (90 gün)', note: 'CRM’de kaynak alanı zorunlu' },
  { metric: 'Uyum ihlali', target: '0', note: 'Kayıt başına ödeme, zorunlu alım, gelir vaadi yok' },
];
