/**
 * İş ortaklığı programı (/partnership/; kullanıcı kararı 2026-10-27): Segika ve iStoc için iki ayrı 90 günlük program.
 * Dört kaynak araştırmanın sentezidir; akademik atıf ve kaynakça yoktur, yalnız karar, ölçüt ve tarih vardır.
 *
 * Tarihler program başlangıcından türer (params.startDate → ilk iş günü = T0; 13 hafta, 90. günde karar).
 * Sayıların statüsü: pilot hedefleri başlangıç tasarımıdır; 14. günde gerçek veriyle yeniden belirlenir ve sonradan
 * başarı görünümü yaratmak için değiştirilmez. Tutar örnekleri yalnız hesap yöntemini gösterir; gerçek tarife değildir.
 */
import { addDays, shortDate } from '../lib/dates';
import type { OpexTone } from '../lib/chartSpec';
import type { Params } from './params';
import type { Program as ProgramModel } from './program';
import type { RoleKey } from './types';

export type ProgramId = 'segika' | 'istoc';

export interface Hypothesis {
  id: string;
  hypothesis: string;
  signal: string;
  response: string;
}
export interface Interview {
  group: string;
  count: number;
  evidence: string;
}
export interface Cascade {
  question: string;
  answer: string;
}
export interface Action {
  name: string;
  what: string;
  measure: string;
  weeks: string;
}
export interface Segment {
  segment: string;
  why: string;
  priority: string;
}
export interface PartnerType {
  type: string;
  brings: string;
  entry: string;
  wave: string;
}
export interface ScoreRow {
  criterion: string;
  points: number;
}
export interface Scorecard {
  title: string;
  note: string;
  rows: ScoreRow[];
  threshold: number;
  veto: string;
}
export interface CellOption {
  name: string;
  job: string;
  risk: string;
}
export interface Tier {
  tier: string;
  condition: string;
  gets: string;
}
export interface Journey {
  stage: string;
  duration: string;
  criterion: string;
  owner: string;
}
export interface Channel {
  ring: string;
  channel: string;
  test: string;
  metric: string;
}
export interface EntryPoint {
  moment: string;
  trigger: string;
  prep: string;
}
export interface Metric {
  metric: string;
  definition: string;
  source: string;
  period: string;
  decision: string;
  target: string;
}
export interface Gate {
  day: number;
  date: string;
  title: string;
  required: string[];
  ifNot: string;
}
export interface Phase {
  no: number;
  weeks: string;
  from: string;
  to: string;
  title: string;
  work: string[];
  output: string;
  owner: string;
  role: RoleKey;
}
export interface WorkItem {
  name: string;
  from: string;
  to: string;
  role: RoleKey;
  text: string;
  milestone?: boolean;
}
export interface Quarter {
  quarter: string;
  focus: string;
  target: string;
}
export interface Risk {
  risk: string;
  probability: string;
  impact: string;
  response: string;
}
export interface Capacity {
  role: string;
  /** Grafik etiketi: dar ekranda en çok iki satır */
  short: string;
  hours: number;
  duty: string;
}
export interface EconRow {
  item: string;
  value: string;
  note: string;
}
export interface Example {
  title: string;
  note: string;
  total: { name: string; value: number };
  parts: { name: string; value: number; tone: OpexTone }[];
  rows: EconRow[];
}
export interface Funnel {
  title: string;
  note: string;
  items: { name: string; value: number }[];
}
export interface GateSeries {
  name: string;
  role: RoleKey;
  values: number[];
}

export interface Program {
  id: ProgramId;
  name: string;
  role: RoleKey;
  title: string;
  what: string;
  summary: { ask: string; need: string; diagnosis: string; approach: string };
  headline: { label: string; value: string; note: string }[];
  cascade: Cascade[];
  actions: Action[];
  avoid: string[];
  verified: string[];
  internalData: string[];
  hypotheses: Hypothesis[];
  interviews: Interview[];
  interviewRules: string[];
  segments: Segment[];
  segmentNote: string;
  cellOptions?: { title: string; note: string; rows: CellOption[] };
  cellScorecard?: Scorecard;
  partnerTypes: PartnerType[];
  firstWave: string;
  partnerMix: { unit: string; items: { name: string; value: number; role: RoleKey }[] };
  partnerScorecard: Scorecard;
  tierHeaders: [string, string, string];
  tiers: Tier[];
  rules: string[];
  journey: Journey[];
  workflow: { title: string; summary: string; steps: { name: string; sub: string }[] };
  economics: EconRow[];
  example: Example;
  channels: Channel[];
  entryPoints: EntryPoint[];
  assets: string;
  kpis: Metric[];
  funnel: Funnel;
  gateSeries: GateSeries[];
  gates: Gate[];
  phases: Phase[];
  work: WorkItem[];
  rhythm: string[];
  quarters: Quarter[];
  risks: Risk[];
  pivots: string[];
  stop: string[];
  capacity: Capacity[];
  capacityNote: string;
  dont: string[];
}

/** Haftalar T0’dan (ilk iş günü) 7 gün; 13 hafta. */
interface Ctx {
  t0: string;
  day14: string;
  day30: string;
  day60: string;
  day90: string;
  /** a–b haftalarının başlangıç ve bitiş tarihi */
  w: (a: number, b?: number) => { from: string; to: string; weeks: string };
}

export const GATE_STEPS = ['Gün 30', 'Gün 60', 'Gün 90'];

/* ---------- Segika ---------- */

function makeSegika(c: Ctx): Program {
  const { day14, day30, day60, day90, w } = c;
  return {
    id: 'segika',
    name: 'Segika',
    role: 'segika',
    title: 'SGK teşvik ve otomasyon',
    what: 'Segika, SGK teşviklerini hesaplayan, hatalı teşvikleri sorgulayan, vizite ve bildirim işlerini otomatikleştiren bir abonelik yazılımıdır. Sitedeki liste fiyatına göre 25 çalışan için aylık paketler 1.600–2.600 ₺ arasındadır. Ücretsiz deneme sunulur.',
    summary: {
      ask: '“Pazarlama yapalım, müşteri edinelim, iş ortaklığı programı dokümanı olsun.”',
      need: 'Şirketin önce müşteri kaybını durduran, sonra muhasebe ve bordro ofisleri üzerinden büyüyen bir gelir düzenine ihtiyacı var. Program bir doküman değildir. Ekonomisi, aracı, süreci ve sorumlusu olan, işleyen bir sistemdir. Başarı, imzalanan ortak sayısıyla ölçülmez. Uygun müşterinin ilk değeri görmesi, ödeme yapması ve hizmette kalmasıyla ölçülür.',
      diagnosis: 'Ürünün değeri her ay oluşuyor ama müşteri bunu görmüyor. Firma başına gelir düşük. Satış, kimsenin sahiplenmediği bir kanal olan muhasebe ofisleri üzerinden yapılıyor. Pazar da genel prim indiriminin daraldığı bir dönemde. Bu dört koşul birleşince müşteri kaybı artar, yeni müşteri kazanımı durur. Bu teşhis bir hipotezdir. 14. güne kadar görüşmeler ve kohort verisiyle (aynı dönemde gelen müşteri grupları) sınanır.',
      approach: 'Muhasebe ve bordro ofisleri hem satış kanalı hem de müşteriyi elde tutan birim olur. Motor A kanaldır: ofislerle ortaklık kurulur. Ofis toptan fiyattan alır, kâr marjı ofiste kalır ve meslek mensubuna nakit komisyon ödenmez. Motor B elde tutmadır: Aylık Değer Raporu gönderilir, müşterinin ilk 30 günde kurulumu tamamlaması beklenir ve müşterinin muhasebecisi ortağa dönüştürülür. İki motor aynı gün başlar. Hizmet kalitesinde sorun çıkarsa yeni müşteri sayısı kapasiteye göre azaltılır.',
    },
    headline: [
      { label: 'Aylık logo kaybı', value: '−%30', note: `Mevcut seviyeye göre · ${shortDate(day90)}` },
      { label: 'Aktif ortak', value: '≥ 10', note: `${shortDate(day60)}: ≥ 6 · ${shortDate(day90)}: ≥ 10` },
      { label: 'Ortak kaynaklı yeni firma', value: '≥ 50', note: `Hizmet verilen firma · ${shortDate(day90)}` },
      { label: 'Yeni ödeme yapan hesap', value: '≥ 6', note: `Sözleşme yapan ticari hesap · ${shortDate(day90)}` },
      { label: 'İlk rapora kadar süre', value: '< 7 gün', note: 'Ortanca değer. Eksiksiz yetki alındıktan sonra ilk rapor en geç 10 iş gününde gider' },
      { label: 'Rapor açılma', value: '≥ %60', note: 'Aylık Değer Raporu · her ay' },
      { label: 'Ceza ve itiraz olayı', value: '0', note: 'Hatalı teşvik tespitleri kayda geçirilir' },
    ],
    cascade: [
      { question: 'Kazanma hedefi', answer: '2027 sonunda muhasebe ofislerinin SGK teşvik ve otomasyonu için ilk tercih ettiği altyapı olmak. Net gelir tutma oranı (NRR, mevcut müşterilerden gelen gelirin bir yıl sonraki oranı) en az %100 olmalı.' },
      {
        question: 'Nerede oynayacağız',
        answer: 'Hedef, 30’dan fazla mükellefi olan, bordro hizmeti veren ve Luca, Mikro veya ETA kullanan muhasebe ofisleridir. Çalışma, müşteri yoğunluğu en yüksek üç il veya bölgede yapılır ve bunlar 1. haftada seçilir. İşveren tarafında imalat KOBİ’leri (5 puan indirim ve 6111 teşvik potansiyeli) ile mavi yaka çalışan değişimi yüksek hizmet ve perakende firmaları hedeflenir.',
      },
      {
        question: 'Nasıl kazanacağız',
        answer: 'Segika, ortağına kazandıran araç olur. Bunu derin entegrasyon, her ay gösterilen değer kanıtı, hatalı teşviki yakalayan risk kalkanı ve ofis markalı raporla sağlar. Kalıcı üstünlük iki kaynaktan gelir: veri, entegrasyon ve aylık alışkanlık nedeniyle yüksek olan değiştirme maliyeti ve büyük ölçekte işletilen otomasyon.',
      },
      { question: 'Gerekli yetkinlikler', answer: 'API ve entegrasyon, sertifika eğitimiyle ortakları işe başlatma, müşteri başarısı, mevzuat izleme ve içerik.' },
      { question: 'Yönetim sistemleri', answer: 'Ortak CRM ve ortak yönetim sistemi (PRM), haftalık gösterge (KPI) panosu, aylık kayıp kurulu ve çeyreklik ortak iş planı kullanılır. Karar noktaları 14, 30, 60 ve 90. gündeki geçitlerdir.' },
    ],
    actions: [
      { name: 'Kayıp teşhisi ve kurtarma adımları', what: 'Kohort tablosu hazırlanır, 30 görüşme yapılır ve kayıp nedenleri kodlanır. En büyük iki kayıp nedenine karşı iki müşteri kurtarma adımı (save play) tasarlanır.', measure: `Tek sayfalık teşhis ${shortDate(day14)} tarihinde hazır. İki kurtarma adımı ${shortDate(day30)} tarihinde uygulamada.`, weeks: 'Hafta 1–4' },
      { name: 'Aylık Değer Raporu', what: 'Rapor her ay hem işverene hem de muhasebecisine gider ve ofis markasını taşır. Raporda “ödenen 1 ₺’ye karşılık X ₺ teşvik” oranı gösterilir.', measure: 'İlk sürüm (v0) 2. haftada hazır. 8. haftada bütün aktif müşterilere gidiyor. Açılma oranı en az %60.', weeks: 'Hafta 2–8' },
      { name: 'Ofis ortaklığı programı v1 ve 10 ofis pilotu', what: 'Katmanlar, toptan fiyat, kurallar, sözleşme ve sertifika eğitimi hazırlanır. Pilot 5 mevcut ve 5 yeni ofisle yapılır. Her ofisin ilk iki müşteri görüşmesine ortakla birlikte gidilir.', measure: `${shortDate(day60)} tarihinde en az 6, ${shortDate(day90)} tarihinde en az 10 aktif ortak.`, weeks: 'Hafta 3–8' },
      { name: 'Ocak lansmanı: “yeni mevzuat teşvik taraması”', what: 'Kampanya, asgari ücretin ve 2 puanlık indirimin etkisini anlatır. Ortaklara kampanya kiti, çevrim içi seminer (webinar) ve hesaplayıcı içeriği verilir.', measure: `${shortDate(day90)} tarihinde ortaklardan gelen en az 50 firma.`, weeks: 'Hafta 9–12' },
      { name: 'Ölçüm ve karar düzeni', what: 'Göstergeler haftalık izlenir, kayıp kurulu ayda bir toplanır ve 14, 30, 60 ve 90. günlerde geçit kararı verilir. Harcama bütçe tavanının %70’ine ulaşınca plan gözden geçirilir.', measure: 'Her geçitte yazılı karar verilir. Kanıt olmadan genişleme yapılmaz.', weeks: 'Hafta 1–13' },
    ],
    avoid: [
      'Hedefi strateji sanmak. “Kaybı düşür, müşteri kazan” bir hedeftir, strateji değildir.',
      'Her kanalı aynı anda açmak. İç halkada yalnız üç kanal vardır.',
      'Kabarık söylem kullanmak. “360 derece dijital dönüşüm” yerine “her ay teşviğinizi eksiksiz alın, bildirim cezası yemeyin” denmeli.',
      'Ölçmeden büyümek, yani pilot sonuçları gelmeden programı 100 ortağa açmak.',
      'Sitedeki işlem hacmini ücretli müşteri sayısı sanmak. Bir ortağın 100 işyerini bağlaması 100 ödeyen müşteri demek değildir.',
    ],
    verified: [
      'Ürün şunları yapar: teşvik hesaplama, raporlama ve simülasyon, hatalı teşvik sorgulama, SGK vizite, otomatik kimlik bildirimi ve İŞKUR çizelgesi. Luca, Mikro ve ETA ile entegre çalışır.',
      'Sitedeki fiyatlar 25 çalışan için aylıktır: SGK Teşvik 1.850 ₺, SGK Otomasyon 1.600 ₺, ikisi birlikte 2.600 ₺. 500’den fazla çalışan için teklif verilir. Ücretsiz deneme vardır.',
      'Sitedeki hacim bilgisine göre altyapı verilen iş ortaklarıyla birlikte her ay 20.000’den fazla firmaya, 61.000’den fazla sicile ve 1,7 milyondan fazla çalışana hizmet veriliyor. Bu, adı konmamış bir ortaklık modelinin zaten çalıştığını gösterir. Bu yüzden program sıfırdan kurulmaz, var olan model resmîleştirilir. Bu hacim ücretli müşteri sayısı değildir.',
      '2026 mevzuatına göre imalat dışı sektörlerde genel prim indirimi 2 puana düştü. İmalatta 5 puanlık indirim yıl sonuna kadar sürüyor. Genel indirim daraldıkça 6111 gibi kişiye özel teşvikleri doğru bulmanın değeri arttı. Aynı zamanda müşterilerin “neden ödüyoruz” sorusu da çoğaldı.',
      'Değerin dayanağı şudur: 6111 teşvikinden tam yararlanan tek bir çalışan, 2.600 ₺’lik paketin yaklaşık üç aylık bedelini karşılar. Hesap, 2026 asgari ücreti üzerinden işveren payının ayda yaklaşık 7.800 ₺ olmasına dayanır ve mali müşavirle doğrulanır. Yani değer vardır. Eksik olan, bu değerin müşteriye kanıtlanmasıdır.',
    ],
    internalData: [
      'Aktif firma, sicil ve ortak sayısı, doğrudan ve ortak kaynaklı dağılımıyla. Ödeme yapan hesap ile hizmet verilen işletme ayrı alanlarda tutulur.',
      'Aylık müşteri sayısı kaybı (logo kaybı), gelir kaybı, net gelir tutma (NRR) ve brüt gelir tutma (GRR). Son 12 ay, kohort bazında.',
      'Firma başına ortalama gelir ve brüt marj',
      'Kayıp nedeni kodları ve kaybın ilk 90 günde ya da 12. ayda nerede yoğunlaştığı',
      'Altyapı verilen iş ortaklarının sayısı, firma hacmi, sözleşmesi, ticari koşulları ve fesih şartları',
      'Entegrasyon kullanan müşterilerin oranı ve SGK bağlantısı kurulmamış hesapların oranı',
      'Önceki marka ve alan adı değişikliğinde müşteriyle iletişimin koptuğunu gösteren izler (bildirim, giriş ve fatura kayıtları)',
    ],
    hypotheses: [
      { id: 'H1', hypothesis: 'Değer görünmüyor. Müşteri, her ay elde ettiği teşviki ve otomasyon çıktısını görmüyor.', signal: '“Ne aldığımızı bilmiyorduk”', response: 'Aylık Değer Raporu' },
      { id: 'H2', hypothesis: 'Muhasebeciyle çatışma var. Müşterinin mali müşaviri (SMMM) ürünü tehdit veya ek yük olarak görüyor. Muhasebeci değişince müşteri de ayrılıyor.', signal: 'Kayıp tarihleri muhasebeci değişimiyle örtüşüyor', response: 'Muhasebeciye ücretsiz ortak kullanıcı hesabı ve ofis merkezli program' },
      { id: 'H3', hypothesis: 'Genel indirim 2 puana düştüğü için teşvik havuzu daraldı. Müşteri “artık değmez” diye düşünüyor.', signal: '2026’nın ilk çeyreğinden sonra kayıp artıyor', response: 'Otomasyon değerine dayanan paket ve 6111 taraması' },
      { id: 'H4', hypothesis: 'Kurulum yarım kaldı. SGK ve e-Bildirge bağlantısı ile entegrasyon tamamlanmadı.', signal: 'Kayıp ilk 60 günde oluyor. Bazı hesaplar hiç rapor üretmemiş.', response: 'Kurulum için 30 günlük başarı kriteri' },
      { id: 'H5', hypothesis: 'Fiyat basamakları uygun değil. 25 çalışanlık bloklar küçük firmaya pahalı geliyor.', signal: '25–40 çalışanlı firmalarda kayıp var', response: 'Çalışan başına fiyat testi ve ortaklar için toptan fiyat' },
      { id: 'H6', hypothesis: 'Kaybın nedeni yapısal. Firma kapandı veya küçüldü.', signal: 'SGK sicili kapanmış', response: 'Hedef müşteri tanımı düzeltilir. Bu kayıp başarısızlık sayılmaz ama izlenir.' },
      { id: 'H7', hypothesis: 'Müşteri yanlış teşvikten ve SGK itirazından, yani hata ve cezadan korkuyor.', signal: 'Şikâyet kayıtları', response: 'Hatalı teşviki sorgulayan “risk kalkanı” öne çıkarılır' },
      { id: 'H8', hypothesis: 'Müşteri “SGK’nın ücretsiz potansiyel sorgulaması yeter” diye düşünüyor.', signal: 'Sisteme az giriliyor, tek modül kullanılıyor', response: 'Toplu, aylık ve otomatik çalışmanın farkı kanıtlanır' },
    ],
    interviews: [
      { group: 'Kaybedilen hesap', count: 10, evidence: 'Son kullanılan rapor, son yaşanan sorun, ayrılma kararının tarihi, geçilen alternatif ve muhasebeci değişimi' },
      { group: 'Riskli hesap (hâlâ müşteri ama kullanımı düşüyor)', count: 5, evidence: 'Beklenti ile sonuç arasındaki fark, çözülemeyen iş ve yaklaşan yenilemenin önündeki engel' },
      { group: 'Düzenli kullanan ve ödeyen hesap', count: 5, evidence: 'Değeri kim görüyor, hangi işlem tekrar ediyor, ürünü kaç kişiye önerdi ve neden önerdi' },
      { group: 'Muhasebe ofisi (aday ortak)', count: 10, evidence: 'Geçen ay kaç mükellef için teşvik kontrolü yapıldığı ve kaç saat sürdüğü, teşvik yüzünden kazanılan veya kaybedilen mükellef ve pilot için verilen tarih' },
    ],
    interviewRules: [
      'Görüşmede kendi fikrimizi anlatmayız. Geçmişteki somut olayları sorarız: “En son ne zaman oldu, kim yaptı, kaç saat sürdü?”',
      'İltifat ve “kullanırdım” gibi cümleler veri değildir. Her görüşme somut bir taahhütle biter, örneğin veri paylaşımı veya pilot tarihi.',
      'Ulaşılamayan ve görüşmeyi reddeden hesaplar da kaydedilir. Yalnız konuşmaya istekli, memnun müşterilerle konuşarak karar verilmez.',
      'Müşterinin ifadesi, kanıt ve bizim yorumumuz ayrı alanlarda tutulur. “Henüz bilinmiyor” da geçerli bir sonuçtur.',
    ],
    segments: [
      { segment: 'S1 İmalat KOBİ’si (50–500 çalışan)', why: '5 puanlık indirim sürüyor ve 6111 teşvik havuzu büyük. Kimlik bildirimi, İŞKUR çizelgesi ve sağlık raporu yükü yüksek.', priority: '1' },
      { segment: 'S2 Hizmet ve perakende zincirleri', why: 'Çalışan değişimi yüksek olduğu için 6111 ve vizite işlemleri yoğun. Çoğu çok şubeli.', priority: '2' },
      { segment: 'S3 İnşaat ve alt işveren', why: 'Değerli ama denetim ve iş kazası nedeniyle riskli. Risk kalkanı bu grupta satış getirir.', priority: '3' },
      { segment: 'S4 Mikro firmalar (< 25 çalışan)', why: 'Bu gruba doğrudan satış yapılmaz, yalnız muhasebe ofisi kanalıyla ulaşılır.', priority: 'Kanal' },
    ],
    segmentNote: 'Çalışan sayısı tek başına ölçüt değildir. İşlem yükü, karar vericiye erişim, elde edilebilir fayda ve hizmet verme maliyeti birlikte puanlanır. Eşik 100 üzerinden 70 puandır. Kişisel veri veya yetki sorunu varsa puan ne olursa olsun süreç durur.',
    partnerTypes: [
      { type: 'P1 Muhasebe ve bordro ofisi (SMMM), ana kanal', brings: '30–300 mükellef getirir. Her ay bordro ve MUHSGK beyannamesi işlemi yapar ve mükellefin güvenini taşır.', entry: 'Bordro hizmeti vermeli, Luca, Mikro veya ETA kullanmalı ve sertifika eğitimini tamamlamalı. Toptan fiyattan alır, nakit komisyon almaz.', wave: '1. dalga · 10 ofis' },
      { type: 'P2 Ticari yönlendirme ve ortak satış (bordro dış kaynak, İK danışmanlığı, uyumlu yazılım)', brings: 'Müşterinin izniyle tanıştırma yapar ve ihtiyaç görüşmesi ayarlar. İlk iki görüşmeye birlikte gidilir.', entry: 'İlk 6 ücretli ay boyunca uygun net tahsilatın %15’ini alır. Fiyat değiştiremez, garanti veremez, para toplayamaz.', wave: '1. dalga · en çok 6' },
      { type: 'P3 Altyapı ve beyaz etiket (teşvik danışmanlık firmaları)', brings: 'Hacim getirir. Bugün fiilen çalışan “altyapı” ortakları bu gruptadır.', entry: 'Yıllık en az firma sayısı taahhüdü, kalite kuralları ve hizmet düzeyi sözleşmesi (SLA) gerekir. Mevcut sözleşmeler tek taraflı değiştirilmez.', wave: '1. dalga · resmîleştirme' },
      { type: 'P4 Bordro/İK yazılımı ve bordro dış kaynak (entegrasyon)', brings: 'Ürün, entegrasyonla kendi yazılımlarının içinde dağıtılır.', entry: 'API entegrasyonu ve ortak pazarlama. Hedef 2 görüşme ve 1 imza.', wave: '1. dalga · görüşme' },
      { type: 'P5 OSGB (ortak sağlık ve güvenlik birimi)', brings: 'Aynı işverenle her ay temas eder. İş kazası ve sağlık raporu konularına yakındır.', entry: 'Referans anlaşması', wave: '2. dalga' },
      { type: 'P6 Dernek, organize sanayi bölgesi (OSB), oda', brings: 'Etkinlik, üye iletişimi ve referans', entry: 'Ortak eğitim programı', wave: '2. dalga' },
      { type: 'P7 Franchise ve zincir merkezi', brings: 'Bütün bayilere tek standartla toplu kullanım', entry: 'Merkez sözleşmesi', wave: '2. dalga' },
      { type: 'P8 Mevcut müşteriler', brings: 'Referans', entry: 'Doğrulanmış hizmet sonucundan sonra istenir', wave: '2. dalga' },
    ],
    firstWave: 'İlk 90 günde yalnız şu işler yapılır: P1 ile 10 ofislik pilot (5 mevcut ve 5 yeni ofis), mevcut P3 ortaklarının resmîleştirilmesi, en çok 6 P2 ortağı ve 2 P4 görüşmesi. Diğer ortak tipleri ikinci dalgada gelir. İlk 30 günde az ama uygun ortak bulmak, hedefe ulaşmak için uyumsuz ortak kabul etmekten daha değerlidir.',
    partnerMix: {
      unit: 'kurum',
      items: [
        { name: 'Pilot muhasebe ofisi', value: 10, role: 'segika' },
        { name: 'Ticari yönlendirme ortağı', value: 6, role: 'pazarlamaci' },
        { name: 'Entegrasyon ortağı görüşmesi', value: 2, role: 'saha-uzmani' },
        { name: 'İmzalı entegrasyon ortağı', value: 1, role: 'yatirimci' },
      ],
    },
    partnerScorecard: {
      title: 'Ortak eleme puan kartı (100 üzerinden)',
      note: '30 aday kurumdan en fazla 12 keşif görüşmesi, bunlardan 8 pilot teklifi ve sonunda 6–10 işleyen ortaklık beklenir. Eşik bir yönetim kuralıdır, bilimsel bir eşik değildir.',
      rows: [
        { criterion: 'Seçilen müşteri grubuyla örtüşme (mükellef tabanı, imalat ve mavi yaka ağırlığı)', points: 25 },
        { criterion: 'Gerçek karar verici ilişkisi: ofis sahibi görüşmede somut bir mükellef sorunu anlattı', points: 25 },
        { criterion: 'Hizmet ve itibar uyumu. Luca, Mikro, ETA veya entegre edilebilir başka bir yazılım kullanımı.', points: 20 },
        { criterion: 'Haftalık zaman ayırıyor, sorumlu kişinin adını verdi ve pilot için tarih belirledi', points: 15 },
        { criterion: 'Kayıt ve veri disiplini (izinli tanıştırma, KVKK)', points: 15 },
      ],
      threshold: 70,
      veto: 'Müşteri verisini izinsiz aktarma, garantili teşvik vaadi, gizli ödeme veya yetkisiz tahsilat talebi puandan bağımsız ret nedenidir.',
    },
    tierHeaders: ['Katman', 'Koşul', 'Ortağa sağlanan'],
    tiers: [
      { tier: 'Kayıtlı Ortak', condition: 'Ücretsiz ortak hesabı açar ve sertifika eğitimini tamamlar. Eğitim 2 saat canlı ders, kayıt ve vaka kontrolünden oluşur.', gets: 'Ortak paneli, 2 mükellef için ücretsiz deneme, kampanya kiti ve mevzuat bülteni' },
      { tier: 'Çözüm Ortağı (Gümüş)', condition: '≥ 10 aktif mükellef', gets: 'Toptan fiyat kademesi 1, ofis markalı Aylık Değer Raporu ve 4 saat içinde yanıt veren öncelikli destek' },
      { tier: 'Çözüm Ortağı (Altın)', condition: '≥ 50 aktif mükellef', gets: 'Toptan fiyat kademesi 2, yalnız bu ortakla ilgilenen ortak başarı yöneticisi, ortak pazarlama fonu ve API erişimi' },
      { tier: 'Altyapı Ortağı (beyaz etiket)', condition: 'Teşvik danışmanlığı veya dış kaynaklı bordro hizmeti verir ve yıllık taahhütte bulunur.', gets: 'Kendi markasıyla kullanım, hacim fiyatı, SLA ve ortak ürün yol haritası' },
      { tier: 'Ticari yönlendirme ortağı (P2)', condition: 'En az 70 puan alır, eğitimi ve vaka kontrolünü tamamlar.', gets: 'İlk 6 ücretli ay boyunca uygun net tahsilatın %15’i. Şirket bazında hak ediş özeti verilir. Ödeme, izleyen ayın 15’ine kadar yapılır.' },
    ],
    rules: [
      'Mükellef kaydı: Ortağın kaydettiği firmaya 12 ay boyunca doğrudan satış yapılmaz. Kaydın kabul veya ret gerekçesi 1 iş günü içinde ortağa gösterilir. 60 gün içinde belgeli ilerleme olmazsa kayıt gözden geçirilir.',
      'Son 90 günde üzerinde aktif çalışılan fırsat veya hâlâ ödeme yapan hesap yeni kazanım sayılmaz. Eski müşteriyi yeniden kaydetmek, yalnız firma adı vermek, toplantı yapmak, ücretsiz deneme ve tahsil edilmemiş fatura ödül kazandırmaz.',
      'Kanal çatışması: Doğrudan müşteri olan bir firmanın muhasebecisi ortak olursa hesap ortağa devredilir. Gelir paylaşımı önceden yazılı olarak belirlenir. Birden çok ortak katkı verirse %15’lik bütçe teklif öncesinde aralarında bölüşülür. Oranlar üst üste eklenmez.',
      'Marka ve beyan: Ortaklar “Segika Sertifikalı Çözüm Ortağı” adını kullanır. Teşvik tutarı vaat edilmez, yalnız “potansiyel” ifadesi kullanılır. “Türkiye’nin en büyüğü”, “hatasız” ve “kesin tasarruf” gibi iddialar satış materyaline girmez.',
      'Sorumluluk: Teşvik kodu kararı ve beyan, işverene ve meslek mensubuna aittir. Segika hesaplamanın doğruluğunu ve KVKK kapsamında veri güvenliğini taahhüt eder. Hatalı teşvik uyarıları kayda geçirilir.',
      'Fiyat tabanı: Ortak, mükellefe liste fiyatının altında lisans satamaz. Kâr marjını kendi hizmet bedeli içinde oluşturur. Ortak fiyat değiştiremez ve Segika adına para toplayamaz.',
      'Meslek mensubuna (SMMM) nakit, hediye veya yönlendirmeye bağlı indirim verilmez. Mesleki iş birliği, müşterinin yetkisiyle yapılan teknik koordinasyon ve genel eğitimle sınırlıdır. Model, 1. haftada istenen hukuk görüşüyle doğrulanmadan yayımlanmaz.',
      'Veri: Ham müşteri listesi sisteme yüklenmez. SGK parolası, bordro, çalışan kimliği ve sağlık raporu ortak satış kaydına girmez. Ortak yalnız kendi başvurularının aşamasını ve hak edişini görür.',
    ],
    journey: [
      { stage: 'Kazanım', duration: '—', criterion: 'Puan kartı ≥ 70/100', owner: 'Program yöneticisi' },
      { stage: 'İşe başlatma', duration: '14 gün', criterion: 'Sertifika alındı ve ilk 5 mükellef bağlandı', owner: 'Ortak başarı' },
      { stage: 'Aktivasyon', duration: '45 gün', criterion: 'İlk Aylık Değer Raporu mükellefe gitti', owner: 'Ortak başarı' },
      { stage: 'Büyüme', duration: 'Çeyreklik', criterion: 'Ortak iş planında hedef mükellef sayısı ve kampanya takvimi var', owner: 'Program yöneticisi' },
      { stage: 'Elde tutma', duration: 'Yıllık', criterion: 'Ortakların tavsiye puanı (NPS) en az 40 ve ortaklık yenilendi', owner: 'Program yöneticisi' },
    ],
    workflow: {
      title: 'Başvurudan yenilemeye standart iş akışı',
      summary: 'İş akışı dokuz adımdan oluşur: izinli tanıştırma, bir iş günü içinde kontrol, ihtiyaç görüşmesi, sınırlı ön inceleme, fayda ve kapsam raporu, teklif, tahsilat ve kullanıma açma, ilk değer görüşmesi, aylık takip ve yenileme.',
      steps: [
        { name: '1. İzinli tanıştırma', sub: 'Ortak, firmanın talebini ve ilişki bağlamını kaydeder' },
        { name: '2. Bir iş gününde kontrol', sub: 'Mükerrer hesap, mevcut fırsat, statü, kapsam' },
        { name: '3. İhtiyaç görüşmesi', sub: 'Karar verici, kullanıcı, mevcut yöntem, takvim' },
        { name: '4. Sınırlı ön inceleme', sub: 'Yetkiyle en az veri, SGK parolası kayda yazılmaz' },
        { name: '5. Fayda ve kapsam raporu', sub: 'Potansiyel, doğrulanmış ve belirsiz ayrı' },
        { name: '6. Teklif', sub: 'Kapsam, görevler, kurulum, ücret, kontrol takvimi, çıkış' },
        { name: '7. Tahsilat ve aktivasyon', sub: 'Erişim, sorumlular, ilk rapor teslim alındı' },
        { name: '8. İlk değer görüşmesi', sub: 'Ne elde edildi, ne kaldı, yapay aktivasyon yok' },
        { name: '9. Aylık takip ve yenileme', sub: 'Değer raporu, açık iş, kullanım, ödeme' },
      ],
    },
    economics: [
      { item: 'Kanal ve model uyumu', value: 'Firma başına gelir küçükse kanal, çok sayıda firmayı bir araya getirmeli', note: 'Aylık 2.600 ₺’lik bir ürün için satış temsilcisi tutulamaz ve ürün kendiliğinden de yayılmaz. Bu yüzden onlarca firmayı tek kararla getiren muhasebe ofisi şarttır.' },
      { item: 'Muhasebe ofisi (SMMM)', value: 'Toptan fiyat ve hizmet marjı. Nakit komisyon yok.', note: 'Marj ofise aittir. Model hukuk görüşüyle doğrulanır.' },
      { item: 'Ticari yönlendirme ortağı', value: 'İlk 6 ücretli ayda uygun net tahsilatın %15’i', note: 'Vergiler ve iadeler hariç tutulur. Bu altı ay, ilk kullanıma açılıştan sonraki 9 takvim ayı içinde başlamalıdır. Ücretsiz aylar komisyon ayı sayılmaz.' },
      { item: 'Toptan fiyat kademeleri', value: '10–49, 50–199 ve 200’den fazla mükellef. Yıllık peşin ödemede ek indirim var.', note: 'Oranlar pilotta belirlenir. Toptan fiyat yalnız sertifikalı ortağa verilir, böylece fiyatlar birbirine karışmaz.' },
      { item: 'Değer temelli fiyat', value: 'Raporda her ay “Ödediğiniz 1 ₺’ye karşılık X ₺ teşvik” oranı gösterilir', note: '6111 teşvikinden tam yararlanan tek bir çalışan, aylık paketin bedelini birkaç ay boyunca karşılar' },
      { item: 'Paket', value: 'Varsayılan paket Teşvik ve Otomasyon birlikte', note: 'Otomasyon aylık alışkanlık kurar, teşvik ise ödemeyi haklı kılar. Ayrılmak isteyen müşteri kaybedilmek yerine 1.600 ₺’lik Otomasyon paketinde tutulur. Aboneliği duraklatma seçeneği de sunulur.' },
      { item: 'Politika', value: 'İndirim yalnız yıllık taahhütte ve ortak kademesine göre verilir', note: 'Keyfî indirim yapılmaz, çünkü indirimle tutulan müşteri sonunda yine kaybedilir. Başarıya göre ücretlenen danışmanlık yalnız ortaklar üzerinden verilir.' },
    ],
    example: {
      title: 'Hesap yöntemi örneği (gerçek tarife değil)',
      note: 'Tutarlar yalnız hesap yöntemini gösterir. Gerçek fiyat, maliyet ve komisyon 14. günde finans ekibi tarafından doğrulanır. Aynı maliyet iki kez yazılmaz. Tekrar eden komisyon katkıdan düşülür, müşteri kazanım maliyetine (CAC) ikinci kez eklenmez.',
      total: { name: 'Aylık net hizmet bedeli', value: 4000 },
      parts: [
        { name: 'Doğrudan hizmet maliyeti', value: 1400, tone: 'office' },
        { name: 'Ortak payı (%15, ilk 6 ay)', value: 600, tone: 'people' },
        { name: 'Müşteri katkısı', value: 2000, tone: 'tech' },
      ],
      rows: [
        { item: 'Aylık katkı (ilk 6 ay)', value: '4.000 − 1.400 − 600 = 2.000 ₺', note: '7. aydan itibaren komisyon biter ve katkı 2.600 ₺ olur' },
        { item: 'Edinim ve kullanıma açma', value: '6.000 + 1.000 = 7.000 ₺', note: 'Yalnız müşteri kazanımının işletme maliyeti. Program kurulumu hariç.' },
        { item: 'Katkıyla geri kazanım', value: '7.000 / 2.000 ≈ 3,5 ay', note: 'Hedef ≤ 6 ay' },
        { item: 'Bütün maliyetlerle (40.000 ₺ kurulum, 6 müşteri)', value: '(40.000 + 6 × 6.000) / 6 ≈ 12.667 ₺', note: 'Kullanıma açma maliyetiyle ≈ 13.667 ₺. Maliyet ≈ 6,6 ayda geri kazanılır, yani 7. ayın sonunda.' },
        { item: 'Duyarlılık', value: 'Gelir 3.000 ₺ ve maliyet 1.800 ₺ olursa katkı 750 ₺ olur', note: 'Bu durumda geri kazanım 8–9 ay sürer. Hacim artırılmaz. Oran, kapsam, maliyet veya kanal düzeltilir.' },
      ],
    },
    channels: [
      { ring: 'İç 1', channel: 'İş geliştirme: muhasebe ofisi ortaklığı', test: '10 ofis pilotu (5 mevcut + 5 yeni)', metric: '≥ 6 ofis aktif, ≥ 50 firma' },
      { ring: 'İç 2', channel: 'Mevcut platformlar: bordro ve muhasebe yazılımı ekosistemleri', test: '2 entegrasyon ortağı görüşmesi, 1 ortak webinar', metric: '1 imzalı entegrasyon ortağı' },
      { ring: 'İç 3', channel: 'Pazarlama aracı olarak ücretsiz yazılım: 3 dakikada teşvik potansiyelini gösteren, ortak markalı “Teşvik Kaçak Tarayıcı”', test: 'Tarayıcı yayına alınır ve içerikler ona bağlanır', metric: '≥ 100 tarama, ≥ 15 nitelikli görüşme' },
      { ring: 'Kontrol', channel: 'Doğrudan: mevcut müşterinin kurumsal referansı ve seçilen sorun için talep yakalayan sayfa', test: 'Ortak katkısını kıyaslamak için korunur', metric: 'Kaynak bazlı CAC karşılaştırması' },
      { ring: 'Dış', channel: 'Oda ve meslek örgütü eğitimlerinde konuşmacılık, kurucunun hazırladığı içerikler, OSGB referansı ve fuar', test: 'Takvime alınır, bütçe gerektirmez', metric: '—' },
      { ring: 'Sonra', channel: 'Ücretli reklam', test: 'Yalnız kanal ile modelin uyumu kanıtlandıktan sonra başlar', metric: '—' },
    ],
    entryPoints: [
      { moment: 'Ocak asgari ücret şoku', trigger: 'Yeni yıl maliyet artışı', prep: 'Ocak kampanyası ve hesaplayıcı' },
      { moment: 'Mevzuat değişimi', trigger: '2 puanlık indirim, yeni teşvik veya genelge', prep: '48 saat içinde bülten' },
      { moment: 'Yeni işe alım dalgası', trigger: 'Sezon veya yeni şube', prep: '“6111 kontrolü” içeriği' },
      { moment: 'SGK denetimi veya ceza', trigger: 'İdari para cezası', prep: 'Risk kalkanı sayfası' },
      { moment: 'Muhasebeci değişimi', trigger: 'Ofis devri', prep: 'Ofis ortaklığı sayesinde müşteri kaybedilmez' },
      { moment: 'Sağlık raporu ve iş kazası yoğunluğu', trigger: 'Kış ayları ve vardiyalı çalışma', prep: 'Vizite otomasyonu içeriği' },
      { moment: 'Mevcut çözümün yenileme dönemi', trigger: 'Sözleşme bitişi', prep: 'Kapsam, geçiş ve destek karşılaştırması' },
    ],
    assets: 'Markayı ayırt eden varlıklar şunlardır: SGK’yı çağrıştıran ad (“Se-Gi-Ka”), logo ve renk, “Aylık Değer Raporu” şablonu. Bunlar her temas noktasında aynı kullanılır. Ürünün kolay bulunması için Luca, Mikro ve ETA ekosistemlerinde listelenir. Ortak panelinden tek tıkla mükellef açılır ve ücretsiz deneme sunulur. Satış sonuçları haftalık, markanın seçilen ihtiyaçla ne kadar ilişkilendirildiği üç ayda bir değerlendirilir. Sabit bir bütçe oranı dayatılmaz.',
    kpis: [
      { metric: 'Logo kaybı', definition: 'Ay içinde iptal eden hesap / dönem başındaki aktif hesap. Yeni hesaplar paydaya girmez.', source: 'CRM, fatura', period: 'Aylık', decision: 'Kurtarma adımlarının önceliği, hedef müşteri tanımı', target: 'Mevcut seviyeden %30 az' },
      { metric: 'GRR (brüt gelir tutma)', definition: '(Başlangıç geliri − kayıp − küçülme) / başlangıç geliri. Fiyat artışı kaybı gizlemez.', source: 'Fatura', period: 'Aylık', decision: 'Fiyat yapısı, paket', target: '≥ %95, 12 ayda NRR ≥ %100' },
      { metric: 'Ortak kaynaklı yeni firma payı', definition: 'Ortak kayıtlı yeni firma / tüm yeni firma', source: 'Ortak paneli', period: 'Haftalık', decision: 'Kanal yatırımı', target: '≥ %60' },
      { metric: 'Ortak aktivasyon oranı', definition: '60 günde en az 5 mükellef bağlayan ortak / kabul edilen ortak. Yalnız 60 günü dolmuş grup sayılır.', source: 'PRM', period: 'Aylık', decision: 'Ortağı işe başlatma içeriği, puan kartı', target: '≥ %50' },
      { metric: 'İlk değere kadar süre', definition: 'Eksiksiz yetki ve veri alındıktan ilk rapora kadar geçen gün. Ortanca değer ve en yavaş %10 izlenir.', source: 'Ürün', period: 'Haftalık', decision: 'Kurulum süreci', target: '< 7 gün, en çok 10 iş günü' },
      { metric: 'Zamanında teslim', definition: 'Söz verilen tarihte teslim edilen dönem raporu / teslimi gereken rapor', source: 'Hizmet kayıtları', period: 'Haftalık', decision: 'Yeni kurulum kapasitesi', target: '≥ %95' },
      { metric: 'Rapor açılma oranı', definition: 'Açılan Aylık Değer Raporu / gönderilen', source: 'E-posta, ürün', period: 'Aylık', decision: 'Rapor tasarımı, kanal', target: '≥ %60' },
      { metric: 'Kanal bazlı CAC geri ödeme', definition: 'Bütün maliyetleri içeren kazanım maliyeti (CAC) / aylık brüt katkı, ay olarak. Kurulum dâhil ve hariç iki değer birlikte gösterilir.', source: 'Finans', period: 'Çeyrek', decision: 'Kanal bütçesi', target: '< 6 ay (ortak), < 12 ay (doğrudan)' },
      { metric: 'Programın net katkısı', definition: 'Yeni müşteri katkısı − edinim − kurulum − kullanıma açma − koruma gideri. Her maliyet bir kez yazılır.', source: 'Finans', period: 'Aylık', decision: 'Devam veya durdurma', target: 'Pozitif. Gerçekleşen ve tahmin ayrı gösterilir.' },
      { metric: 'Kalite: hatalı teşvik tespiti ve ceza olayı', definition: 'Tespit edilen hatalı kod sayısı ile SGK itiraz ve ceza olayları', source: 'Ürün, destek', period: 'Aylık', decision: 'Risk kalkanı mesajı, eğitim', target: 'Ceza olayı 0' },
    ],
    funnel: {
      title: 'Ortak üzerinden edinim hunisi (90 gün hipotezi)',
      note: 'Hesap, 6 ortağın her birinin 10 izinli tanıştırma yapmasına dayanır. Aşamalar arası dönüşüm sırasıyla %67, %60, %50 ve %50 varsayılır. Gerçek oranlar bilinmiyor. İlk 20 başvurudan sonra oranlar güncellenir ve ortak başına dağılım gösterilir.',
      items: [
        { name: 'İzinli başvuru', value: 60 },
        { name: 'Uygun başvuru', value: 40 },
        { name: 'Ön inceleme', value: 24 },
        { name: 'Teklif', value: 12 },
        { name: 'Ödeme yapan hesap', value: 6 },
      ],
    },
    gateSeries: [
      { name: 'Aktif ortak', role: 'segika', values: [3, 6, 10] },
      { name: 'Ortak kaynaklı firma', role: 'pazarlamaci', values: [0, 15, 50] },
      { name: 'Ödeme yapan yeni hesap', role: 'saha-uzmani', values: [0, 3, 6] },
    ],
    gates: [
      {
        day: 14,
        date: day14,
        title: 'Teşhis ve seçim',
        required: [
          'Hesap ve gelir kaybı kohort tablosunda görünüyor. Ödeyen hesap ile hizmet verilen firma ayrı tutuluyor.',
          '30 görüşme tamamlandı. En fazla üç ana kayıp nedeni ve her birinin etkilediği hesap ile gelir belirlendi.',
          'İlk müşteri grubu ve kapsam seçildi (puan ≥ 70)',
          'Hukuk görüşü istendi. Konular: SMMM modeli, KVKK, SGK yetkilendirmesi ve sorumluluk sınırı.',
          'Ekip üyelerinin adları ve haftada 52 saatlik kapasite yazıya geçirildi',
        ],
        ifNot: 'Geniş ortak kazanımı ertelenir. Önce veri ve hizmet teşhisi tamamlanır.',
      },
      {
        day: 30,
        date: day30,
        title: 'Program v1',
        required: [
          'Program v1 paketi hazır: katman, toptan fiyat, kurallar ve sözleşme',
          'En az 3 ortak eğitildi. İzinli kayıt akışı CRM’de çalışıyor.',
          'Aylık Değer Raporu v1 örnek müşteriyle çalışıyor',
          'İlk hizmet düzeltmesi teslim edildi. Kritik bir vaat veya veri sorunu yok.',
          'İki kurtarma adımı tanımlandı ve uygulamada',
        ],
        ifNot: 'Ortak sayısı artırılmaz. Önce kayıt, eğitim veya hizmetteki darboğaz düzeltilir.',
      },
      {
        day: 60,
        date: day60,
        title: 'Pilot',
        required: [
          'En az 6 aktif ortak, ortaklardan gelen en az 15 firma ve en az 3 yeni ödeme yapan hesap var',
          'Rapor bütün aktif müşterilere gitti. Açılma oranı ölçülüyor.',
          'İki hafta boyunca teslimlerin en az %95’i zamanında yapıldı',
          'Müşteri katkısı pozitif. Maliyetler kanal bazında etiketlendi.',
          'Kayıpta düşüş eğilimi görülüyor',
        ],
        ifNot: 'Katkı negatifse yeni tekliflerin oranı ve kapsamı düzeltilir. Kazanılmış paylar korunur. Teslim sorunu varsa yeni müşterileri kullanıma açma hızı düşürülür.',
      },
      {
        day: 90,
        date: day90,
        title: 'Karar',
        required: [
          'En az 10 aktif ortak, ortaklardan gelen en az 50 firma ve en az 6 ödeme yapan hesap var',
          'Aylık müşteri kaybı, mevcut seviyenin en az %30 altında',
          'Rapor açılma oranı en az %60. İlk rapora kadar geçen süre 7 günden kısa.',
          'Hiç ceza olayı yok. Ortaklardan kaynaklanan düzeltilmemiş hizmet sorunu yok.',
          'Kazanım maliyetinin geri dönüş süresi 6 aylık hedefe yaklaşıyor',
        ],
        ifNot: 'Kanıt yetersizse program en fazla 30 gün uzatılır. Aynı belirsizlik süresiz sürdürülmez. Devam, ekonomiyi yeniden düzenleme veya segment değiştirme kararı yazılı verilir.',
      },
    ],
    phases: [
      {
        no: 1,
        ...w(1, 2),
        title: 'Teşhis',
        work: [
          'İç veri toplanır ve kohort tablosu hazırlanır. Tablo ay, segment, kanal ve çalışan sayısı aralığına göre ayrılır.',
          '30 görüşme başlar. Mevcut altyapı ortaklarıyla görüşülür ve envanter çıkarılır.',
          'Hukuk görüşü istenir. Gösterge panosunun ve Aylık Değer Raporunun ilk sürümleri (v0) tasarlanır.',
        ],
        output: `Kayıp teşhisi taslağı, görüşme notları ve hukuk soruları listesi. 14. gün geçidi (${shortDate(day14)})`,
        owner: 'Program yöneticisi + ürün',
        role: 'yonetici',
      },
      {
        no: 2,
        ...w(3, 4),
        title: 'Program v1',
        work: [
          'Tek sayfalık teşhis yazılır. Program v1 (katman, toptan fiyat, kurallar, sözleşme) ve ortaklar için tek sayfalık değer belgesi hazırlanır.',
          'Sertifika eğitimi içeriği, müşteri sağlık puanının tanımı ve kurtarma adımları rehberi hazırlanır. En önemli hizmet düzeltmesi yapılır.',
          'Puan kartıyla 10 pilot ofis seçilir. 12 adayla görüşülür ve ilk izinli başvurular alınır.',
        ],
        output: `Program v1 paketi ve pilot listesi. 30. gün geçidi (${shortDate(day30)})`,
        owner: 'Program yöneticisi',
        role: 'segika',
      },
      {
        no: 3,
        ...w(5, 8),
        title: 'Pilot',
        work: [
          '10 ofis (5 mevcut, 5 yeni) işe başlatılır. İlk iki müşteri görüşmesine ortakla birlikte gidilir ve müşteriler destekle kullanıma başlar.',
          '2 entegrasyon ortağıyla görüşülür. Aylık Değer Raporu bütün aktif müşterilere gönderilir. Geri kazanım listesindeki 30 firmayla temas kurulur.',
          '“Teşvik Kaçak Tarayıcı” deneme sürümü (beta) ve Ocak kampanya kiti hazırlanır. Başvuru kalitesi ve teklif engelleri en fazla iki değişiklikle düzeltilir.',
        ],
        output: `En az 6 aktif ortak, ilk rapor dalgası ve tarayıcının deneme sürümü. 60. gün geçidi (${shortDate(day60)})`,
        owner: 'Ortak başarı + ürün',
        role: 'saha-uzmani',
      },
      {
        no: 4,
        ...w(9, 12),
        title: 'Lansman',
        work: [
          'Ocak lansmanı “yeni mevzuat teşvik taraması” ortaklar üzerinden yapılır. Ortaklarla çevrim içi seminer düzenlenir ve asgari ücret hesaplayıcı içeriği yayınlanır.',
          'İyi çalışan ortaklarla ikinci başvuru dalgası başlar. İzin alınarak ve isim verilmeden ilk müşteri vaka özeti yazılır.',
          'Göstergeler her hafta gözden geçirilir ve kurtarma adımları uygulanır. Yenilemeler, ikinci ödemeler ve oranlardaki değişimin etkisi incelenir.',
        ],
        output: 'Ortaklardan gelen en az 50 firma, kayıp verisi ve 4–6. aylar için kapasite teklifi',
        owner: 'Tüm ekip',
        role: 'dijital-pazarlama',
      },
      {
        no: 5,
        ...w(13),
        title: 'Karar',
        work: ['90 gün raporu hazırlanır: kanıt, maliyet, olgunlaşmış müşteri grupları ve açık riskler.', 'Devam, ekonomiyi yeniden düzenleme veya segment değişikliği kararı verilir ve 2. çeyrek planı yapılır.'],
        output: `Yazılı karar (${shortDate(day90)})`,
        owner: 'Program yöneticisi + yönetim',
        role: 'yatirimci',
      },
    ],
    work: [
      { name: 'İç veri ve kohort tablosu', ...w(1, 2), role: 'yonetici', text: 'Hesap, fatura, tahsilat ve iptal verisi. Ödeyen hesap ve firma ayrı tutulur.' },
      { name: '30 görüşme', ...w(1, 3), role: 'yonetici', text: '10 kaybedilen, 5 riskli, 5 aktif, 10 muhasebe ofisi' },
      { name: 'Hukuk görüşü: SMMM modeli', ...w(1, 4), role: 'yatirimci', text: 'Meslek mevzuatı, KVKK, SGK yetkilendirme, sözleşme' },
      { name: 'Aylık Değer Raporu v0 → v1', ...w(2, 5), role: 'pazarlamaci', text: 'Örnek müşteriyle çalışan rapor. Potansiyel ve gerçekleşen teşvik ayrı gösterilir.' },
      { name: 'Program v1 paketi', ...w(3, 4), role: 'segika', text: 'Katman, toptan fiyat, kurallar, sözleşme, puan kartı' },
      { name: 'Sertifika eğitimi ve kitler', ...w(4, 8), role: 'segika', text: 'Grup eğitimi ve bireysel vaka kontrolü. Ocak kampanya kiti.' },
      { name: '10 ofis pilotu', ...w(5, 8), role: 'saha-uzmani', text: '5 mevcut ve 5 yeni ofis işe başlatılır. Her ofiste ilk 5 mükellef bağlanır.' },
      { name: 'Rapor tüm aktif müşterilere', ...w(6, 8), role: 'pazarlamaci', text: 'Rapor işverene ve muhasebeciye gider. Açılma oranı ölçülür.' },
      { name: 'Entegrasyon ortağı görüşmeleri', ...w(5, 10), role: 'yatirimci', text: '2 görüşme, 1 çevrim içi seminer ve 1 imza hedefi' },
      { name: 'Teşvik Kaçak Tarayıcı', ...w(6, 9), role: 'dijital-pazarlama', text: 'Ücretsiz ve ortak markalı. En az 100 tarama.' },
      { name: 'Geri kazanım: 30 firma', ...w(7, 12), role: 'pazarlamaci', text: 'Çözülmüş sorun ve yeni kapsamla geri kazanım. İndirim verilmez.' },
      { name: 'Ocak lansmanı', ...w(9, 12), role: 'dijital-pazarlama', text: '“Yeni mevzuat teşvik taraması”, çevrim içi seminer ve hesaplayıcı' },
      { name: '90. gün kararı', ...w(13), role: 'yatirimci', text: 'Devam, ekonomiyi yeniden düzenleme veya segment değişikliği', milestone: true },
    ],
    rhythm: [
      'Pazartesi gösterge toplantısı (30 dk): Kayıp ve açık sorunlar, ortak hattı, kapasite ve katkı ile deney sonuçları konuşulur. Toplantı, her biri bir kişiye verilen en fazla üç eylemle biter.',
      'Perşembe ortak hattı toplantısı: Başvuru kalitesi, teklif engelleri ve kullanıma açılmayı bekleyen müşteriler konuşulur.',
      'Ayın son cuması kayıp kurulu toplanır: Kayıp nedenleri, kurtarma adımlarının sonuçları ve geri kazanım listesi konuşulur.',
      'Her hafta tek bir darboğaz seçilir. Ön inceleme kuyruğu uzuyorsa uzmana daha çok zaman ayrılır. Teklifler bekliyorsa karar vericiye erişim güçlendirilir. Kurulum gecikiyorsa başlangıç desteği artırılır.',
    ],
    quarters: [
      { quarter: '4. çeyrek 2026 – 1. çeyrek 2027', focus: 'Kayıp teşhisi, program v1, 10 ofis pilotu ve Ocak lansmanı', target: 'Kayıpta %30 azalma, 10 aktif ortak, 50 firma' },
      { quarter: '2. çeyrek 2027', focus: 'Program 50 ortağa genişletilir ve ilk entegrasyon ortağı devreye girer. Müşteri sağlık puanı otomatikleşir. En iyi sonuç veren müşteri grubuna ve ortaklık türüne odaklanılır.', target: 'NRR ≥ %100. Ortak ve firma hedefi gerçek veriyle yazılır.' },
      { quarter: '3. çeyrek 2027', focus: 'OSGB, franchise ve zincir katmanı açılır. Meslek örgütleriyle eğitim takvimi kurulur. Ortağın kendi markasıyla satabileceği (beyaz etiket) ürün hazırlanır. İki dönem hedef tutturan ortağa görev devredilir.', target: 'Sertifikalı çözüm ortaklığı yalnız yeterlik kanıtlanınca verilir' },
      { quarter: '4. çeyrek 2027', focus: 'Bölgesel genişleme yapılır. Markaya yatırım olarak “Türkiye’de kaçan teşvik” araştırma raporu yayımlanır. 2028 planı hazırlanır.', target: 'İlk grubun ekonomisi bozulursa genişleme durur' },
    ],
    risks: [
      { risk: 'Teşvik havuzu daha da daralır', probability: 'Orta', impact: 'Yüksek', response: 'Otomasyon değerine dayanan paket sunulur ve teşvik dışı modüllerin payı büyütülür' },
      { risk: 'SMMM mevzuatına aykırı ortak modeli', probability: 'Düşük–orta', impact: 'Yüksek', response: 'Hukuk görüşü alınmadan yayın yapılmaz. Komisyon yerine hizmet marjına dayanan model kullanılır.' },
      { risk: 'SGK sistem ve erişim değişiklikleri', probability: 'Orta', impact: 'Yüksek', response: 'Entegrasyon ekibi değişiklikleri izler ve müşteriye açıkça bilgi verir' },
      { risk: 'Ortaklar kaydolur ama çalışmaya başlamaz', probability: 'Yüksek', impact: 'Orta', response: '14 günlük işe başlatma, puan kartıyla eleme ve aktivasyon göstergesi kullanılır. İki dönem hareketsiz kalan ortakla düzeltme yapılır veya ortaklık sonlandırılır.' },
      { risk: 'Doğrudan satış ile ortak çatışması', probability: 'Orta', impact: 'Orta', response: 'Mükellef kaydı, 12 aylık koruma ve yazılı gelir paylaşımı' },
      { risk: 'Kayıp nedeni yapısal (kapanış) çıkar', probability: 'Orta', impact: 'Orta', response: 'Hedef müşteri büyük firmalara kaydırılır. Mikro firmalara yalnız ortak kanalından ulaşılır.' },
    ],
    pivots: [
      'Ortak aktivasyonu %30’un ve ortaklardan gelen firma sayısı 20’nin altındaysa, büyümeden önce ekonomi yeniden tasarlanır.',
      'Kayıp düşmediyse ve nedenlerin en az %50’si H1 veya H4 ise sorun üründe ve kurulum sürecindedir. Bu durumda kanal genişlemesi durdurulur.',
      'Kayıp nedenlerinin en az %50’si H6 ise segment değiştirilir.',
      'Her çeyrek şu soru sorulur: “Bunu bugün yapmıyor olsaydık, başlar mıydık?” Cevap hayırsa o modül veya kanal bırakılır.',
    ],
    stop: [
      'Büyük müşteri kaybı, yanlış teşvik vaadi, izinsiz veri aktarımı veya gizli menfaat tespit edilirse ilgili ortak ve işlem beklemeden incelenir. Programın güvenli olan diğer işleri sürer.',
      'Zamanında teslim oranı iki hafta boyunca %95’in altında kalırsa yeni kurulum sayısı azaltılır. Mevcut müşteriye hizmet, yeni müşteri kazanımından önce gelir.',
      'Harcama kesilirse müşteriler sahipsiz bırakılmaz. Açık işler kapatılır ve hak edilmiş ödemeler yapılır.',
    ],
    capacity: [
      { role: 'Program sorumlusu', short: 'Program sorumlusu', hours: 8, duty: 'Segment, ortak kabulü, haftalık kararlar ve engellerin çözümü' },
      { role: 'Ortak kazanımı ve satış', short: 'Ortak ve satış', hours: 16, duty: 'Aday görüşmeleri, ilk müşteri görüşmeleri ve teklif takibi' },
      { role: 'Müşteri koruma ve başlangıç', short: 'Müşteri koruma', hours: 12, duty: 'Kayıp görüşmeleri, değer raporu, yenileme ve ilk kullanım desteği' },
      { role: 'SGK ve ürün teknik uzmanı', short: 'Teknik uzman', hours: 8, duty: 'Uygunluk, kapsam, veri kontrolü ve zor vakalar' },
      { role: 'Kayıt ve içerik desteği', short: 'Kayıt ve içerik', hours: 4, duty: 'CRM kayıtlarının eksiksizliği, materyal ve rapor hazırlığı' },
      { role: 'Finans ve hukuk koordinasyonu', short: 'Finans ve hukuk', hours: 4, duty: 'Maliyet, tahsilat, sözleşme ve hak ediş takibi' },
    ],
    capacityNote: 'Haftada 52 saat × 13 hafta ile en çok 676 saat ayrılır. Bu bir işe alım kararı değil, ayrılması önerilen kapasitedir. Aynı saat iki rolde sayılmaz. Mevcut müşterilere verilen hizmet bu kapasitenin dışında tutulur. İki marka birlikte yürürse haftada 52 + 83 = 135 saat (≈ 3,4 tam zamanlı kişi) tek çizelgede izlenir. Bu süre yetmezse pilotlar aşamalara bölünür veya küçültülür ve hedefler 14. günde yeniden yazılır.',
    dont: [
      '90 günlük kanıt olmadan programı 100 ortağa açmak, bölgesel hak, geniş bayilik kademesi veya özel markalı hizmet vermek.',
      'Reklam, arama motoru optimizasyonu (SEO), fuar ve sosyal medyayı aynı anda açmak. Talep ve teklif yeterli değilken büyük reklam bütçesi harcamak.',
      'Herkese otomatik indirim vermek ve indirimle sağlanan geçici geri dönüşü kazanım saymak.',
      'Mevcut iş ortaklarını yeni aday gibi yeniden kaydetmek. Korunan gelirin tamamını programın sağladığı kazanç saymak.',
    ],
  };
}

/* ---------- iStoc ---------- */

function makeIstoc(c: Ctx): Program {
  const { day14, day30, day60, day90, w } = c;
  return {
    id: 'istoc',
    name: 'iStoc',
    role: 'ekip-lideri',
    title: 'B2B toptan pazaryeri',
    what: 'iStoc, işletmeden işletmeye (B2B) toptan ticaret pazaryeridir. Alıcı talebini girer, doğrulanmış tedarikçiler teklif verir. Program, geniş pazaryeri vaadini tek bir kategoride ve tek bir ticaret koridorunda işleyen bir alım satım döngüsüne indirir.',
    summary: {
      ask: '“Alibaba’nın Türkiye modelini kuralım. Alıcı ile satıcıdan hangisinin önce geleceği sorununu (tavuk-yumurta problemi) çözelim. İş ortaklığı programıyla müşteri edinelim.”',
      need: 'Asıl ihtiyaç likiditedir, yani talebin kısa sürede teklifle karşılanmasıdır. Bir pazaryerinin tek ürünü eşleşmedir: Alıcı talep girdiğinde kısa sürede karşılaştırılabilir gerçek teklifler almalıdır. Bu olmazsa her yeni kullanıcı ilk ziyarette kaybedilir ve edinim harcaması boşa gider. Çözüm bir kopya değildir. Türkiye’nin kimsenin ürüne dönüştürmediği avantajı kullanılır: yakınlık (hız, küçük parti, esneklik) ve insan destekli eşleşme.',
      diagnosis: 'Alıcı ve tedarikçi tarafı yeterince yoğun değil. “Global ve bütün kategoriler” vaadi bu yoğunluğu imkânsız kılıyor. Alıcı güven ve hız kanıtı, tedarikçi de gerçek alıcı kanıtı bulamadan ayrılıyor. Geçmişteki B2B üyelik desteği dönemi tedarikçide “boş üyeliğe para ödedim” izlenimi bıraktı. Bu teşhis bir hipotezdir ve ilk 14 günde görüşmeler ile gerçek talep kanıtıyla sınanır.',
      approach: 'Dar başlanır, eşleşmeler önce elle yapılır, taraflar güvenle bağlanır ve ortaklarla büyünür. 14. günde puan kartıyla tek bir hücre seçilir. Hücre, 1 kategori ile 1 alıcı koridorunun birleşimidir. Önce talep toplanır: Ekip, alıcı adına tedarikçi arayan bir aracı gibi çalışan elle eşleştirme masası (concierge) kurar. Arz tarafında kurumsal ortaklarla 100 seçilmiş vitrin açılır. Doğrulama, güvenli ödeme, numune, lojistik ve uyuşmazlık çözümünden oluşan güven katmanları ürünü tamamlar. Para kazanma sırası işlem başarı ücreti, hizmet paketleri ve üyeliktir. Üyelik yalnız likidite kanıtlandıktan sonra satılır.',
    },
    headline: [
      { label: 'Teklif karşılama', value: '≥ %70', note: `72 saatte ≥ 2 geçerli teklif · ${shortDate(day30)}: ≥ %60` },
      { label: 'Kabul edilmiş nitelikli talep', value: '≥ 30', note: `50 toplanan talepten · ${shortDate(day90)}` },
      { label: 'Teyitli işlem', value: '≥ 10', note: '≥ 8 farklı alıcı, ≥ 5 güvenli ödemeli' },
      { label: 'Doğrulanmış vitrin', value: '100', note: `Son 30 günde yanıt veren ≥ %40 · ${shortDate(day60)}` },
      { label: 'Tekrar alım', value: '≥ %40', note: `Doğal çevrimi dolan alıcılarda · ${shortDate(day90)}` },
      { label: 'İlk oturumda sonuç bulamayan', value: '< %30', note: 'Haftalık ölçülür. Sınır aşılırsa yeni kullanıcı akışı azaltılır.' },
    ],
    cascade: [
      { question: 'Kazanma hedefi', answer: '12 ay içinde seçilen koridorda “en hızlı ve en güvenli eşleşen B2B kanal” olmak. Bu, 48 saatte en az 3 teklif, güvenli ödemeyle tamamlanan işlem ve tekrar alım demektir.' },
      {
        question: 'Nerede oynayacağız',
        answer: `Kategori ve koridor ${shortDate(day14)} tarihinde puan kartıyla seçilir. Alıcılar küçük ve orta ölçekli ithalatçılar, toptancılar ve küçük parti alan e-ticaret satıcılarıdır. Yurt içinde düzenli yenileme alımı yapan küçük işletmeler de alıcı olabilir. Tedarikçiler kataloğu olan, 48 saatte teklif verebilen, küçük parti kabul eden ve ihracata hazır KOBİ’lerdir.`,
      },
      {
        question: 'Nasıl kazanacağız',
        answer: 'Yakın tedarik (3–7 günde teslim, küçük parti), güven katmanları ve insan destekli eşleşmeyle kazanılır. Kalıcı üstünlük üç kaynaktan gelir: yoğunluk arttıkça güçlenen ağ etkisi, üyelik modeline karşı başarı ücreti ve elle eşleştirme hizmeti ile farklı konumlanma, güvenilir marka.',
      },
      { question: 'Gerekli yetkinlikler', answer: 'Kategoride tedarikçi bulma uzmanlığı, çok dilli içerik, ödeme ve güvenli ödeme operasyonu, lojistik ortaklığı, ortak yönetimi ve firma doğrulama.' },
      { question: 'Yönetim sistemleri', answer: 'Haftalık likidite panosu, talep yanıt süresi takibi, tedarikçi kalite puanı, ortak CRM ve aylık likidite kurulu kullanılır. Karar noktaları 14, 30, 60 ve 90. gündeki geçitlerdir.' },
    ],
    actions: [
      { name: 'Hücre seçimi ve kanıt', what: '25 görüşme yapılır, aday hücreler puanlanır ve platformun yetenekleri gerçek bir işlemle doğrulanır.', measure: `${shortDate(day14)} tarihinde tek hücre seçilir. En az 5 gerçek alım ihtiyacı ve cevap verebilecek en az 6 satıcı bulunur.`, weeks: 'Hafta 1–2' },
      { name: 'Elle eşleştirme masası (concierge)', what: 'Talep formu alınır, 24 saat içinde nitelik kontrolü yapılır ve talep 3–5 satıcıya yönlendirilir. Toplam maliyet karşılaştırılır ve kapanış kaydı tutulur. Süreç işleyince ürüne dönüştürülür.', measure: 'Taleplerin en az %70’i 72 saatte en az 2 geçerli teklif alır. İlk teklif 24 saatten önce gelir.', weeks: 'Hafta 3–12' },
      { name: 'Arz tohumlama ve çapa kullanıcılar', what: 'Arz ortakları ve katalog aktarımıyla 100 vitrin açılır. Platformu sürükleyecek 5 çapa tedarikçiye ve 3 çapa alıcıya birebir yakın destek verilir.', measure: `${shortDate(day60)} tarihinde 100 doğrulanmış vitrin açık ve en az %40’ı aktif.`, weeks: 'Hafta 5–8' },
      { name: 'Güven katmanları', what: 'Firma doğrulama (KYB), güvenli ödeme, numune programı, lojistik ve gümrük paketi ile uyuşmazlık süreci kurulur.', measure: `${shortDate(day90)} tarihinde en az 5 güvenli ödemeli işlem.`, weeks: 'Hafta 3–8' },
      { name: 'Davetli alıcı kulübü ve tekrar', what: '50 üyeli bir kulüp kurulur. Her hafta tedarikçiye talep özeti, alıcıya fırsat bülteni gönderilir. Üreticiler kendi alıcılarını platforma taşımaya teşvik edilir ve ilk 6 ay komisyon alınmaz.', measure: 'En az 20 aktif üye. Alım döngüsü dolan alıcıların en az %40’ı tekrar alım yapar.', weeks: 'Hafta 9–12' },
      { name: 'Ölçüm ve karar düzeni', what: 'Likidite panosu ve anti-ağ göstergesi izlenir. 14, 30, 60 ve 90. günlerde geçit kararı verilir. Her hafta tek bir darboğaz seçilir.', measure: 'Her geçitte yazılı karar verilir. Kanıt olmadan genişleme yapılmaz.', weeks: 'Hafta 1–13' },
    ],
    avoid: [
      '“Türkiye’nin Alibaba’sı olacağız” demek. Bu bir hedeftir, strateji değildir.',
      'Bütün kategorilerde aynı anda lansman yapmak ve markayı tanımayan kitleye “pazaryeri” reklamı vermek.',
      'Talep ve teklif yeterli değilken tedarikçiye üyelik satmak. Tedarikçiler geçmişteki boş üyelikleri hatırlıyor.',
      'Sonucu ölçülmeyen “ortaklık protokolü” imzalamak. İmza, ortağın çalışmaya başladığını göstermez.',
      'Profil ve katalog tamamlamayı aktivasyon saymak. Aktivasyon, gerçek bir talebe geçerli teklif verilmesidir.',
    ],
    verified: [
      'Site, iStoc’u “global B2B toptan satış ve ticaret pazaryeri” olarak tanıtıyor ve doğrulanmış tedarikçi ile güvenli ödeme vaat ediyor. Bu gözlem, aktif alıcı sayısını ya da güvenli ödeme ve lojistik kapasitesini doğrulamaz. Ürün sorumlusu bunları 1. haftada gerçek bir işlemle doğrular. Satış ekibi yalnız doğrulanmış yetenekleri anlatır.',
      'Asıl rakipler WhatsApp, Instagram, telefon, fuarlar ve Laleli, Merter, İSTOÇ gibi fiziksel toptan merkezleridir. Global portallar ve yerli B2B platformları ikinci planda kalır.',
      '2017–2022 döneminde B2B site üyeliklerine verilen desteklerden sonra fırsatçı fiyat artışları yaşandı. Bu, tedarikçilerde “boş üyeliğe para ödedim” izlenimi bıraktı. Bu yüzden önce likidite sağlanır, üyelik sonra satılır.',
      'Devlet desteği için gerçekçi yol, 5986 sayılı e-ihracat destekleri kapsamında “B2B platformu” statüsüdür. Pazaryeri statüsü ise en az 1.000 hizmet sağlayıcı ve en az 100.000 ürün ister. Ön şartlar ihracatçı birliği üyeliği, Destek Yönetim Sistemi (DYS) kaydı, Türk ürünü ve marka tescilidir. Destek ek bir kazanç sayılır ve plan ona bağlı kurulmaz.',
      'Güven ve finansman ortağı adayları, tedarikçiye tahsilat garantisi ve alıcıya vade sunan tedarik zinciri finansmanı ürünleridir. Yurt içi B2B güven katmanı için 2. haftada kısa listeye alınırlar.',
      'İSTOÇ ticaret merkezine erişim bir dağıtım fırsatıdır. Merkezin yönetimiyle veya kooperatifiyle resmî bir ilişki olduğu varsayılmaz. Logo yalnız yazılı izinle kullanılır.',
    ],
    internalData: [
      'Listelenen tedarikçi, ürün ve kategori sayısı ile son 30 günde yanıt veren tedarikçilerin oranı',
      'Kayıtlı alıcılar, ülke ve şehir dağılımları ve son 30 günde talep girenler',
      'Talep sayısı, teklif alma oranı, ilk teklife kadar geçen süre ve işleme dönüşme oranı',
      'Güvenli ödemeyle tamamlanan işlemler, toplam işlem hacmi (GMV) ve platformun aldığı pay',
      'Ziyaretçi kaynakları ve ilk ziyarette “sonuç yok” görenlerin oranı',
      'Mevcut ortaklık ve üyelik gelirleri ile şikâyetler',
    ],
    hypotheses: [
      { id: 'H1', hypothesis: 'Alıcı için asıl engel fiyat değil, ödeme ve kaliteye duyulan güvendir.', signal: 'Görüşmelerde dolandırıcılık ve numune hikâyeleri', response: 'Güven katmanları' },
      { id: 'H2', hypothesis: 'Tedarikçi “boş pazaryeri” deneyimi yaşıyor. Talep gelmiyor ya da gelen talep sahte.', signal: 'Yanıt oranı düşük ve ayrılan tedarikçiler bunu söylüyor', response: 'Önce talep toplayan masa ve talep kalite kuralı' },
      { id: 'H3', hypothesis: 'Kategori sayısı çok olduğu için hiçbir kategoride yeterli yoğunluk oluşmuyor.', signal: 'Her kategoride 10’dan az aktif tedarikçi var', response: 'Tek hücreyle başlanır' },
      { id: 'H4', hypothesis: 'Alıcının gerçek alternatifi uzak tedarik değil, WhatsApp’tan çalıştığı mevcut tedarikçisidir.', signal: '“Zaten tanıdığım var” cevabı', response: '“Yeni tedarikçi” yerine “yedek ve yakın tedarikçi” mesajı verilir ve numune sunulur' },
      { id: 'H5', hypothesis: 'Küçük parti ve 3–7 günde teslim, yurt dışındaki alıcı için satın alma nedenidir.', signal: 'En az sipariş miktarı (MOQ) ve teslim süresi şikâyetleri', response: 'Yakın tedarik olarak konumlanma' },
      { id: 'H6', hypothesis: 'Tedarikçi ihracat bürokrasisinden çekiniyor.', signal: '“Gümrük, evrak, ödeme” kaygıları', response: 'Hizmet ortaklarından oluşan paket' },
      { id: 'H7', hypothesis: 'Üyelik erken satılırsa müşteri ve itibar kaybı doğuruyor.', signal: 'Üyelik iptalleri', response: 'Başarıya göre ücretlenen model. Üyelik 6. aydan sonra satılır.' },
      { id: 'H8', hypothesis: 'Kurumsal ortaklar üyelerine kazandırmak ister ama somut sonuç raporu bekler.', signal: 'Görüşmelerde “ne kazandıracak?” sorusu', response: 'Ortak panosu ve üye sonuç raporu' },
    ],
    interviews: [
      { group: 'Alıcı', count: 10, evidence: 'Son yeni tedarikçi deneyimi, en pahalıya mal olan tedarik sorunu, en küçük sipariş miktarı, ilk ödemedeki risk, son numunenin ne kadar sürede geldiği ve 48 saatte 3 teklif için gerçek talep taahhüdü' },
      { group: 'Tedarikçi', count: 10, evidence: 'Son 12 ayda kazanılan ve kaybedilen yurt dışı alıcılar, en son para ödenen B2B platform ve sonucu, son talebe cevap süresi, tahsilat sorunları ve kataloğu bu hafta yükleme taahhüdü' },
      { group: 'Kurumsal ortak (birlik, OSB, dernek, ajans)', count: 5, evidence: 'Son dijital veya ihracat programı ve raporu, üyelerin en sık ihracat şikâyeti, tipik katılım oranı ve üyeleri platforma başlatma günü için tarih' },
    ],
    interviewRules: [
      'Görüşmede platformu anlatmayız. Geçmişteki somut olayları sorarız: “En son ne zaman, kimden, kaç teklif aldınız, sonuç ne oldu?”',
      '“Kullanırdım” demek veri değildir. Her görüşme somut bir taahhütle biter: gerçek talep, katalog veya pilot tarihi.',
      'Ulaşılamayan ve katılmayan işletmeler de kaydedilir. Yalnız olumlu konuşanlara bakarak sonuç çıkarılmaz.',
      'Her görüşme için tek bir kayıt tutulur. Kayıtta sorun, geçmiş davranış, mevcut alternatif, karar verici, satın alma zamanı, kanıt, açık varsayım, sonraki eylem ve tarih yer alır.',
    ],
    segments: [
      { segment: 'Alıcı (kazanılması zor taraf): yurt dışında Türkçe konuşan toptancı ve ithalatçılar', why: 'Dil ve güven engeli düşük. Yakın tedarik ve küçük parti onlar için satın alma nedeni.', priority: '1' },
      { segment: 'Alıcı: Avrupa, Orta Doğu ve Kuzey Afrika (MENA) e-ticaret satıcıları', why: 'Küçük parti ve hızlı yenileme istiyorlar. Uzak tedarikte en az sipariş miktarı ve teslim süresi sorun oluyor.', priority: '2' },
      { segment: 'Alıcı: yurt içi küçük işletme ve e-ticaret satıcısı (yenileme alımı)', why: 'Ambalaj, temizlik ve kırtasiye sarf malzemesi gibi düzenli tüketim yapıyorlar. Önceliği hücre seçimine bağlı.', priority: '2' },
      { segment: 'Alıcı: perakende zincirlerinin satın alma birimleri ve Anadolu perakendecileri', why: 'Hacimleri büyük ama kararları yavaş. İkinci dalgada ele alınır.', priority: '3' },
      { segment: 'Tedarikçi: kataloğu hazır, ihracat yapmış ya da ihracata hazır KOBİ üretici ve toptancılar', why: '48 saatte teklif verebilir ve küçük parti kabul eder', priority: '1' },
      { segment: 'Tedarikçi: fiziksel toptan merkezlerinde (Laleli, Merter, İSTOÇ) ihracata yönelik satıcılar', why: 'Onlara ulaşmak kolay ama katalog ve dil desteğine ihtiyaç duyarlar', priority: '2' },
    ],
    segmentNote: 'Alıcı az bulunan ve kazanılması zor taraftır. Bu yüzden günlük operasyon alıcıya öncelik verir, şirketin misyonu ise tedarikçiye hizmettir. Hedef “Türkiye’deki bütün toptancılar” değildir. Hedef, örneğin “seçilen koridorda ayda en az bir kez yenileme alımı yapan küçük işletmeler”dir. Bu eşikler gerçek satın alma örnekleriyle doğrulanır.',
    cellOptions: {
      title: 'Aday hücreler (kategori × koridor)',
      note: 'Bu adayların hiçbiri seçilmiş pazar değildir. 14. günde görüşmeler ve gerçek talep kanıtıyla puanlanırlar. Üçü yurt içi yenileme alımı, ikisi ihracat koridorudur.',
      rows: [
        { name: 'Standart ambalaj sarfları → İstanbul e-ticaret işletmeleri (yurt içi)', job: 'Düzenli sevkiyat malzemesini uygun miktar ve tarihte yenilemek', risk: 'Nakliye maliyeti, ölçü ve kalite farkı, çok düşük sipariş katkısı' },
        { name: 'Temizlik sarfları → küçük işletmeler (yurt içi)', job: 'Tekrarlayan işletme tüketimini kesintisiz karşılamak', risk: 'Aynı ürün adı altında farklı teknik özellikler ve mevcut tedarikçinin alışkanlık avantajı' },
        { name: 'Seçilmiş kırtasiye sarfları → küçük perakendeciler (yurt içi)', job: 'Hızlı dönen ürün grubunda stok yenilemek', risk: 'Mevsimsellik, marka ve ürün kodu farkı, çok sayıda küçük sipariş' },
        { name: 'Ev tekstili (Denizli, Bursa) → Avrupa’da Türkçe konuşan toptancılar', job: 'Sezon öncesi küçük parti, 3–7 gün teslim', risk: 'Numune ve lojistik maliyeti, kalitenin tutarlı olması' },
        { name: 'Plastik ev eşyası ve hırdavat (İstanbul) → Kuzey Afrika ithalatçıları', job: 'Kargoya uygun standart ürün yenilemesi', risk: 'Gümrük ve evrak işleri, ödeme güvenliği' },
      ],
    },
    cellScorecard: {
      title: 'Hücre puan kartı (ağırlıklı, 100 üzerinden)',
      note: 'Her ölçüte 0–5 arasında puan verilir. Ağırlıklı puan = ölçüt puanı / 5 × ağırlık. Veri yoksa puan verilmez, önce kanıt toplanır.',
      rows: [
        { criterion: 'Satın alma ihtiyacının yakınlığı ve tekrar sıklığı (son alım, sipariş örneği, sonraki alım zamanı)', points: 25 },
        { criterion: 'Gerçek alıcıya doğrudan veya ortak üzerinden erişim (görüşmeye katılan yetkili, pilot talep taahhüdü)', points: 20 },
        { criterion: 'Cevap verebilen uygun satıcı yoğunluğu (deneme teklifi verilmiş)', points: 20 },
        { criterion: 'Teklifleri karşılaştırabilme (ortak teknik alanlar, teslimat, toplam maliyet)', points: 15 },
        { criterion: 'Hizmetten katkı üretme ihtimali (ödeme davranışı, hizmet süresi)', points: 10 },
        { criterion: 'Teslimat, iade ve uzmanlık karmaşıklığının yönetilebilirliği', points: 10 },
      ],
      threshold: 70,
      veto: 'Puan, temel koşulların yerine geçmez. En az 5 gerçek ve yakın alım ihtiyacı, bunları karşılayabilecek en az 6 satıcı ve 90 gün içinde tekrarı görülebilecek bir alım döngüsü şarttır. Hiçbir aday bu koşulları sağlamıyorsa iki hafta daha dar bir araştırma yapılır. Aynı anda üç pilot açılmaz.',
    },
    partnerTypes: [
      { type: 'Arz toplayıcı (kurumsal)', brings: 'İhracatçı birlikleri, OSB müdürlükleri, ticaret ve sanayi odaları, sektör dernekleri, e-ticaret altyapı ve katalog sağlayıcıları, ERP firmaları ve ana şirketin dijital ajans ağı. Seçilmiş tedarikçi listesi, üyeleri platforma başlatma günü ve katalog verisi getirirler.', entry: 'Program protokolü imzalanır ve üyelere sonuç raporu sözü verilir. Nakit ödenmez. Karşılığında ortak markalı program, üye panosu ve çeyreklik rapor alırlar.', wave: '1. dalga · 3' },
      { type: 'Talep toplayıcı', brings: 'Yurt dışındaki Türk iş dernekleri ve odaları, iş konseyleri, ticaret müşavirliği etkinlikleri, tedarikçi bulma ajanları, satın alma hizmeti şirketleri, e-ticaret satıcı toplulukları ve işletme ağları. Gerçek talep ve alıcı kulübü üyeleri getirirler.', entry: 'Ayda en az 2 izinli satın alma talebi özeti (brif) getirmeleri gerekir. İşlem başına pay veya tanımlı görev bedeli alırlar. Bedelin %50’si kapsam kabulünde, %50’si sonuç takibinde ödenir. Kayıt başına ödeme yapılmaz.', wave: '1. dalga · 1–2' },
      { type: 'Satıcı geliştirme (ticari)', brings: 'Kategoride bağlantısı olan kişiler ve toptancılara hizmet veren ajanslar. En fazla 5 aday satıcı getirirler. Bunların en az 3’ünün yetkili kişisi, kapsamı ve teklif şartları tamamdır.', entry: 'Sınırlı süreli gelir payı alırlar, örneğin en çok 6 ay boyunca %10. Oran 14. günde finans tarafından onaylanır.', wave: '1. dalga · 2' },
      { type: 'Hizmet (bütün ürün)', brings: 'Lojistik ve e-ihracat kargosu, gümrük müşavirliği, ödeme ve güvenli ödeme, tedarik zinciri finansmanı, kalite kontrol, ürün fotoğrafı, çeviri ve katalog. Alıcıya güven, tedarikçiye kolaylık sağlarlar.', entry: '“iStoc Onaylı Hizmet” sözleşmesi imzalanır. Gelir paylaşımı veya referans ücreti alırlar. Aynı emek için iki kez ödeme yapılmaz.', wave: '1. dalga · ödeme ve lojistik' },
      { type: 'Teknoloji', brings: 'E-ticaret altyapıları, ERP firmaları ve pazaryeri entegratörleri. Katalogları otomatik eşitler ve ortak pazarlama yaparlar.', entry: 'API bağlantısı ve karşılıklı liste fiyatı indirimi', wave: '2. dalga' },
      { type: 'Kanal: bölge temsilcileri', brings: 'Tedarikçileri şehir bazında platforma başlatan temsilciler. Tedarikçinin çalışmaya başlamasını sağlarlar.', entry: 'Aktif tedarikçi başına ödeme alırlar. Bu tip yalnız likidite kanıtlandıktan sonra açılır.', wave: '6. aydan sonra' },
    ],
    firstWave: `İlk dalgada 4 ortak olur: 1 talep toplayıcı, 2 arz veya satıcı geliştirme ortağı ve 1 ödeme hizmeti ortağı. 60. gün geçidinden (${shortDate(day60)}) sonra ortak sayısı en çok 7’ye çıkar: 3 arz, 2 talep ve 2 hizmet ortağı (ödeme ve lojistik). İlk 30 günde sonuç üretmeyen ortağa düzeltme görevi verilir. İkinci 30 günde de kanıt yoksa bu ortağa yeni fırsat verilmez. Sertifikalı bayi, otomatik bölge hakkı ve alt bayi ağı ilk pilotta açılmaz.`,
    partnerMix: {
      unit: 'ortak',
      items: [
        { name: 'Arz toplayıcı', value: 3, role: 'saha-uzmani' },
        { name: 'Talep toplayıcı', value: 2, role: 'ekip-lideri' },
        { name: 'Hizmet: ödeme ve lojistik', value: 2, role: 'yatirimci' },
      ],
    },
    partnerScorecard: {
      title: 'Ortak eleme puan kartı (100 üzerinden)',
      note: 'İlk aday listesi 20 kurumla sınırlıdır. Ortak olmak için en az 70 puan ve doğrulanabilir iki ilişki örneği gerekir.',
      rows: [
        { criterion: 'Seçilen kategori ve koridora erişim (üye veya alıcı tabanı)', points: 30 },
        { criterion: 'Gerçek ilişki kanıtı: iki doğrulanabilir örnek var ve karar vericiyle görüşüldü', points: 25 },
        { criterion: 'Zaman ayırma taahhüdü, sorumlu kişinin adı ve üyeleri başlatma günü için tarih', points: 20 },
        { criterion: 'Görev yetkinliği: talep özeti (brif), katalog ve teklif takibi', points: 15 },
        { criterion: 'Kayıt ve uyum disiplini (izinli erişim, KVKK ve GDPR)', points: 10 },
      ],
      threshold: 70,
      veto: 'İzinli erişim kuralına uymamak veya temel bir dürüstlük sorunu, puan ne olursa olsun eleme nedenidir. Alıcı işletmenin çalışanına gizli kişisel ödeme yapılmaz.',
    },
    tierHeaders: ['Ortak', 'Ne verir', 'Ne alır ve ekonomi'],
    tiers: [
      { tier: 'Arz ortağı (kurumsal)', condition: 'Üye listesi, üyeleri platforma başlatma günü ve iletişim desteği', gets: 'Ortak markalı program sayfası, üye panosu, çeyreklik sonuç raporu ve üyelere özel avantaj. Nakit ödeme yok.' },
      { tier: 'Talep ortağı', condition: 'Gerçek talep ve alıcı kulübü üyeleri', gets: 'Başarıya bağlı işlem başına pay veya görev bedeli. Kapalı alıcı kulübüne erişim.' },
      { tier: 'Satıcı geliştirme ortağı', condition: 'En fazla 5 aday satıcı, en az 3 hazır satıcı ve gerçek talebe ilk cevap', gets: 'Uygun satıcının gerçekten satın aldığı hizmetten sınırlı süreli pay, örneğin en çok 6 ay boyunca %10' },
      { tier: 'Hizmet ortağı', condition: 'Lojistik, ödeme, gümrük, kalite veya katalog hizmeti', gets: '“iStoc Onaylı Hizmet” rozeti ve iş akışı. Gelir paylaşımı veya referans ücreti.' },
      { tier: 'Teknoloji ortağı', condition: 'Katalogların otomatik eşitlenmesi', gets: 'Karşılıklı ortak pazarlama' },
      { tier: 'Bölge temsilcisi (6. ay+)', condition: 'Tedarikçileri platforma başlatma', gets: 'Aktif tedarikçi başına ödeme ve işlem payı. Yalnız likidite kanıtlandıktan sonra.' },
    ],
    rules: [
      'Firma doğrulama (KYB) standardı: Vergi ve ticaret sicili, ihracatçı birliği üyeliği ve referans kontrol edilir. Rozet yalnız doğrulanan firmalara verilir.',
      'Talep kalite kuralı: Talepte miktar, hedef fiyat, teslim yeri, süre, ödeme beklentisi ve teklif son tarihi bulunur. Eksik talep yayınlanmaz. Aynı ihtiyaç için gelen kopyalar birleştirilir, örneğin üç form tek talep sayılır.',
      'Geçerli teklif: Teknik şartı karşılar. Miktarı, vergi durumunu, nakliyeyi, teslim zamanını ve geçerlilik süresini açıklar. Yalnız fiyat yazılmış cevap geçerli değildir. Teklifler toplam satın alma maliyetine göre karşılaştırılır.',
      'Yanıt süresi sözü (SLA): Tedarikçi 48 saat içinde yanıt verir. Bu süreyi aşan tedarikçi listede daha az görünür. İlk üç talebe hiç dönmeyen satıcı geçici olarak listeden çıkarılır ve kapasite sorununun nedeni öğrenilir.',
      'Doğrulanmış işlem: Alıcı ve satıcı işlemi onaylar ve kişisel bilgileri gizlenmiş sipariş veya teslimat kanıtı sunulur. Platform dışında tamamlanan ticaret eşleşmenin sonucudur ama iStoc geliri değildir. Önceden var olan bir sipariş, ağın katkısı sayılmaz.',
      'Fırsat sahipliği: Fırsat 2 iş günü içinde kabul edilir ve 90 gün korunur. 30 gün ilerleme olmazsa fırsat incelenir. Son 90 günde aktif olan fırsat veya ücretli müşteri yeni yönlendirme sayılmaz. Aynı fatura için ikinci ödeme yapılmaz. Segika müşteri listesi kendiliğinden iStoc listesi olmaz.',
      'Ortaklık münhasır değildir ve ortaklar “iStoc Program Ortağı” adını kullanır. “En büyük”, “garantili satış” ve “her üründe en ucuz” gibi iddialar ortak materyaline girmez. Doğrulanmamış ödeme veya uyuşmazlık hizmeti vaat edilmez.',
      'Veri: KVKK ve Avrupalı alıcılar için GDPR kurallarına uyulur. Alıcının iletişim bilgisi doğrulanmadan bütün satıcılara dağıtılmaz. Kartvizit vermek, sınırsız iletişime izin vermek anlamına gelmez.',
      'Uyuşmazlık: Güvenli ödeme kuralları, numune onayı, iade ve itiraz süreci yazılıdır. İlk işlemler ekip tarafından birebir yakından takip edilir.',
    ],
    journey: [
      { stage: 'Kazanım', duration: '—', criterion: 'Puan kartında en az 70/100 ve iki doğrulanabilir ilişki örneği', owner: 'Program yöneticisi' },
      { stage: 'İşe başlatma', duration: '21 gün', criterion: 'Ortak markalı sayfa açıldı ve üyeleri başlatma günü için tarih verildi. 60 dakikalık eğitim ve örnek talep çalışması yapıldı.', owner: 'Ortak başarı' },
      { stage: 'Aktivasyon', duration: '60 gün', criterion: 'Arz ortağı en az 20 doğrulanmış vitrin, talep ortağı en az 10 nitelikli talep getirdi. Hizmet ortağının ilk işi tamamlandı.', owner: 'Ortak başarı' },
      { stage: 'Büyüme', duration: 'Çeyreklik', criterion: 'Üye, talep ve işlem sonuçlarını gösteren rapor hazırlandı ve yeni hedef konuldu', owner: 'Program yöneticisi' },
      { stage: 'Elde tutma', duration: 'Yıllık', criterion: 'Ortakların tavsiye puanı (NPS) en az 40 ve ortaklık yenilendi', owner: 'Program yöneticisi' },
    ],
    workflow: {
      title: 'Likidite oyun kitabı (sıralı)',
      summary: 'Likidite dokuz adımda kurulur: tek hücre, önce talep (elle eşleştirme), arz tohumlama, çapa kullanıcılar, araç için gelip ağ için kalma, güven katmanları, davetli alıcı kulübü, üreticinin kendi alıcılarını getirmesi ve komşu hücre.',
      steps: [
        { name: '1. Tek hücre', sub: `1 kategori × 1 koridor, ${shortDate(day14)}` },
        { name: '2. Talep önce (concierge)', sub: 'Talep topla, 3 teklifi elle bul, kapat, 50 talep' },
        { name: '3. Arz tohumlama', sub: 'Ortaklar ve katalog aktarımıyla 100 vitrin' },
        { name: '4. Çapa kullanıcılar', sub: '5 tedarikçi, 3 alıcı, birebir destek' },
        { name: '5. Araç için gel, ağ için kal', sub: 'Ücretsiz vitrin + teklif şablonu' },
        { name: '6. Güven katmanları', sub: 'KYB, güvenli ödeme, numune, lojistik, ≥ 5 güvenli işlem' },
        { name: '7. Davetli alıcı kulübü', sub: '50 üye, ≥ 20 aktif, haftalık bülten' },
        { name: '8. Üretici alıcı getirir', sub: 'Mevcut alıcılarını taşır, ilk 6 ay komisyonsuz' },
        { name: '9. Komşu hücre', sub: 'Likidite eşiği aşılınca, 6. ay' },
      ],
    },
    economics: [
      { item: 'Gelir modeli sırası', value: 'Sıra şöyledir: (1) güvenli ödemeden alınan %3–8 işlem başarı ücreti, (2) hizmet paketlerinin marjı, (3) öne çıkma, analitik ve talep önceliği sunan tedarikçi Pro üyeliği. (4) Alıcı tarafı ücretsizdir.', note: 'Pro üyelik yalnız aylık talep hacmi kanıtlanan kategoride açılır. Üyelik ancak likidite sağlandıktan sonra satılır.' },
      { item: 'Vaat', value: '“Satmadan ödemezsiniz.” “İlk 90 günde nitelikli talep gelmezse ücret yok.”', note: 'Fiyat artış kuralı sözleşmede açıkça yazılır. Üyelik indirimi yapılmaz, kampanya yerine komisyonsuz dönem sunulur.' },
      { item: 'Fiyat P', value: 'Onaylı paketin tahsil edilen bedelidir. Vergiler hariç tutulur, iade ve düzeltmeler bir kez düşülür.', note: 'Eski 399 € ve 599 €’luk paket örnekleri onaylı fiyat sayılmaz. 15. ve 30. günler arasında en az 5 satıcıya gerçek kapsam ve fiyatla teklif verilir. Sözlü beğeni, ödeme yapılacağının kanıtı değildir.' },
      { item: 'Ortak payı (oran r, süre s)', value: 'Tek bir toplam havuz vardır, örneğin en çok 6 ay boyunca %10. Oranı finans ekibi 14. güne kadar belirler.', note: 'Beklenen tahsilat − hizmet maliyeti − hedef katkı ≥ ortak payı olmalıdır. İkinci bir ortak varsa aynı havuz bölüşülür.' },
      { item: 'Talep ortağı emeği', value: 'Sınırlı bir çalışma bedeli ödenir: %50’si kapsam kabulünde, %50’si sonuç takibinde.', note: 'Bu bir edinim gideridir, komisyon gibi gösterilmez. Her talep özeti (brif) ödeme hakkı doğurmaz.' },
      { item: 'GMV (toplam işlem hacmi)', value: 'Teslimatı onaylanmış malların bedelidir. KDV ve ayrı fiyatlanan nakliye hariç tutulur, iadeler ayrı izlenir.', note: 'GMV gelir veya komisyon matrahı değildir. Örneğin 15 sipariş × 20.000 ₺ = 300.000 ₺ GMV, iStoc’un geliri anlamına gelmez.' },
      { item: 'Geri kazanım', value: 'Birikimli katkı / (edinim + ayrı kurulum). Üst sınır 6 aydır.', note: 'Süre 14. günde nakit kapasitesine göre kesinleşir. Üç aylık veri, müşterinin altı ay kalacağını kanıtlamaz.' },
    ],
    example: {
      title: 'Hesap yöntemi örneği (gerçek tarife değil)',
      note: 'Örnekte aylık fiyat P = 10.000 ₺, doğrudan hizmet maliyeti 3.000 ₺, ortak payı %10 ve ilk edinim maliyeti 18.000 ₺’dir. Tutarlar iStoc’un tarifesi veya öngörüsü değildir. Gerçek veriler gelince değişir.',
      total: { name: 'Aylık uygun net tahsilat', value: 10000 },
      parts: [
        { name: 'Doğrudan hizmet maliyeti', value: 3000, tone: 'office' },
        { name: 'Ortak payı (%10)', value: 1000, tone: 'people' },
        { name: 'Müşteri katkısı', value: 6000, tone: 'tech' },
      ],
      rows: [
        { item: 'Aylık müşteri katkısı', value: '10.000 − 3.000 − 1.000 = 6.000 ₺', note: 'Dönemsel teşvik yok' },
        { item: 'Edinimin geri kazanımı', value: '18.000 / 6.000 = 3 ay', note: 'Hedef ≤ 6 ay' },
        { item: 'On müşterinin aylık katkısı', value: '10 × 6.000 = 60.000 ₺', note: 'Sabit gider 100.000 ₺ ise faaliyet sonucu −40.000 ₺ olur' },
        { item: 'Faaliyet başabaş noktası', value: '100.000 / 6.000 ≈ 17 müşteri', note: 'Büyüme yatırımları hariçtir. Bu, şirketin bütününün başabaş noktası değildir.' },
      ],
    },
    channels: [
      { ring: 'İç 1', channel: 'İş geliştirme: kurumsal arz ve talep ortakları', test: '3 arz ve 2 talep ortağı, üyeleri başlatma günleri', metric: '100 doğrulanmış tedarikçi, 50 talep' },
      { ring: 'İç 2', channel: 'Mevcut platform ve topluluklar: diaspora iş dernekleri, satıcı grupları, mesleki ağlar, toptancı mesaj grupları', test: 'Davetli alıcı kulübü ve haftalık bülten', metric: '50 kulüp üyesi, ≥ 20 aktif' },
      { ring: 'İç 3', channel: 'Pazarlama aracı olarak ücretsiz yazılım ve içerik: “ihracata hazırlık skoru” ve “yakın tedarik maliyet karşılaştırma” araçları, çok dilli kategori rehberleri', test: 'Araçlar yayına alınır ve aramalarda görünmeye başlar', metric: '≥ 200 kullanım, ≥ 20 nitelikli kayıt' },
      { ring: 'Kontrol', channel: 'Doğrudan alıcı geliştirme: seçili hücrede 30 uygun işletmeyle kişiselleştirilmiş temas', test: 'Ortak katkısını kıyaslamak ve müşterinin dilini öğrenmek için korunur', metric: 'Uygun talep başına süre taşınabilir' },
      { ring: 'Dış', channel: 'Fuarlar, 2027 e-ihracat zirvesi, ticaret müşavirliği etkinlikleri ve basın. 10–15 işletmeyle gerçek satın alma dosyası üzerinde çalışılan küçük kategori etkinliği.', test: 'Takvime alınır. Etkinlik yalnız geçit koşulları sağlandıysa yapılır.', metric: 'Etkinlik sonrası uygun talep ve işlem' },
      { ring: 'Sonra', channel: 'Ücretli arama ve reklam', test: '60. gün geçidinden sonra, dar kategoride ve koridor bazında', metric: 'Edinim maliyeti ve gerçek satın alma' },
    ],
    entryPoints: [
      { moment: 'Teslimat ve sezon', trigger: 'Uzak tedarik gecikti ve sezon yaklaşıyor. Tedarikçide boş kapasite var.', prep: '“Sezon öncesi yakın tedarik” bülteni' },
      { moment: 'Sipariş miktarı (MOQ)', trigger: 'Alıcı büyük parti alamıyor. Tedarikçi küçük parti kabul ediyor.', prep: 'Küçük parti filtresi ve mesajı' },
      { moment: 'Güven', trigger: 'Alıcı ödeme ve kaliteden, tedarikçi tahsilattan endişe ediyor', prep: 'Güvenli ödeme ve doğrulama anlatımı' },
      { moment: 'Stok, ilk alım, yenileme', trigger: '“Mevcut satıcıda stok yok”, “ilk kez alıyorum”, “yenileme öncesi karşılaştırmak istiyorum”', prep: 'Aynı marka, aynı talep yolu, aynı temel vaat' },
      { moment: 'Fuar ve seyahat', trigger: 'Türkiye ziyareti veya fuar sonrası takip', prep: 'Fuar ziyaretçi listesinin müşteriye dönüştürülmesi' },
      { moment: 'Destek', trigger: 'E-ihracat desteği duyurusu', prep: '5986 bilgilendirme webinarı' },
      { moment: 'Kur', trigger: 'Fiyat avantajı', prep: 'Dönemsel kampanya' },
    ],
    assets: 'Markayı ayırt eden varlıklar şunlardır: turuncu kimlik, “yakın tedarik” ifadesi, “48 saatte 3 teklif” vaadi ve doğrulama rozeti. Bunlar her temas noktasında aynı kullanılır. Platformun kolay bulunması için İngilizce, Almanca, Arapça ve Rusça kategori sayfaları, satıcı toplulukları ve fuarlar kullanılır. Tedarikçi, ortak panelinden tek tıkla vitrin açar. Kısa vadede kullanıcılar ortaklar ve elle eşleştirme hizmetiyle kazanılır. Güvene dayalı marka ise kanıt vakaları, rozet ve tutarlı kimlikle kurulur. Bütçe oranı dayatılmaz ve 6. ayda yeniden değerlendirilir.',
    kpis: [
      { metric: 'Eşleşme süresi (SLA)', definition: '72 saatte en az 2 geçerli teklif alan talep / 72 saati dolmuş kabul edilmiş talep. Hafta sonu etkisi ayrı gösterilir, süre sonradan durdurulmaz.', source: 'Ürün, masa', period: 'Haftalık', decision: 'Tohumlama, elle eşleştirme kapasitesi', target: `${shortDate(day30)} tarihinde ≥ %60, sonra ≥ %70` },
      { metric: 'İlk geçerli teklife kadar süre', definition: 'Talebin kabulünden ilk geçerli teklife kadar geçen saat. Ortanca değer ve %90 dilimi, cevapsız kalan taleplerin sayısıyla birlikte gösterilir.', source: 'Ürün', period: 'Haftalık', decision: 'Yönlendirme ve cevap standardı', target: '< 24 saat (ortanca)' },
      { metric: 'Aktif tedarikçi oranı ve satıcı aktivasyonu', definition: 'Son 30 günde geçerli teklif veren / listelenen tedarikçi. Ayrıca ilk talebinden sonraki 14 gün içinde teklif veren / aynı satıcı grubu.', source: 'Ürün', period: 'Aylık', decision: 'Pasif vitrinlerin temizlenmesi, hatırlatma, ortak kalitesi', target: '≥ %40' },
      { metric: 'Gerçek sonucu olan benzersiz alıcı ve tekrar', definition: 'Son 30 günde teslimatı onaylanmış alım yapan farklı işletme sayısı. Tekrar oranı: doğal alım döngüsü ve 14 gün dolan alıcılardan ikinci alım yapanlar / bu grup.', source: 'Talep ve sipariş kayıtları', period: 'Aylık', decision: 'Kalıcı yarar, doğru kategori', target: '≥ 8 alıcı, tekrar ≥ %40' },
      { metric: 'Teyitli işlem ve GMV', definition: 'Teslimatı onaylanmış işlem sayısı. GMV (KDV ve nakliye hariç, iadeler ayrı) ve güvenli ödemeli işlemler ayrı gösterilir.', source: 'Ödeme, operasyon', period: 'Haftalık', decision: 'Güven katmanları', target: '≥ 10 işlem, ≥ 5 güvenli ödemeli' },
      { metric: 'Gerçekleşen ticaret oranı', definition: 'Beklenen teslim tarihinden 7 gün geçmiş taleplerden teslimatı onaylananlar / aynı grup. Siparişe dönmeyen talepler paydada kalır.', source: 'Ürün', period: 'Aylık', decision: 'Fiyat, güven veya eşleşme engeli', target: `Ölçülür. Eşik ${shortDate(day60)} tarihinde konur.` },
      { metric: 'Ortak kaynaklı pay ve ortak üretkenliği', definition: 'Ortaklar üzerinden gelen tedarikçi ve talep payı. Ayrıca en az 30 gün önce eğitilmiş ortaklardan son 30 günde sonuç üretenlerin oranı.', source: 'PRM', period: 'Aylık', decision: 'Ortak yatırımı, devam kararı', target: 'Tedarikçi ≥ %70, talep ≥ %50, üretken ortak ≥ %50' },
      { metric: 'Anti-ağ etkisi', definition: 'İlk ziyaretinde sonuç bulamayan yeni kullanıcı / bütün yeni kullanıcılar.', source: 'Analitik', period: 'Haftalık', decision: 'Yeni kullanıcı akışını azaltma, önce yoğunluğu artırma', target: '< %30' },
      { metric: 'Yenileme, katkı ve geri kazanım', definition: 'Yenileme tarihi geçmiş sözleşmelerden tahsil edilenler / aynı grup. Müşteri katkısı ve geri kazanım süresi doğrudan kanal ve ortak kanalı için ayrı gösterilir.', source: 'Finans', period: 'Aylık', decision: 'Paket değeri, komisyon, kanal, bütçe', target: 'Pozitif katkı, geri kazanım ≤ 6 ay' },
      { metric: 'İşlem kalitesi ve yoğunlaşma', definition: 'Şikâyetli, iptal edilen ve iade edilen işlemler / onaylanmış işlemler. Ayrıca en büyük 3 alıcının talep payı ve en büyük 3 satıcının işlem payı.', source: 'Operasyon', period: 'Haftalık', decision: 'Tek işletmeye bağımlılık, hizmet riski', target: 'Sonucun çoğu tek bir alıcıdan geliyorsa kanıt sayılmaz' },
    ],
    funnel: {
      title: 'Talep hunisi (90 gün hipotezi)',
      note: '80 hedefli temastan 30 görüşme, bunlardan da 20 gerçek alıcıdan toplanan 50 talep beklenir. Dönüşüm oranları tahmin değildir, kapasiteyi ve darboğazları konuşmak için kullanılır. 15 işlem ile 10 farklı alıcı ayrı sayılır.',
      items: [
        { name: 'Toplanan talep', value: 50 },
        { name: 'Kabul edilmiş nitelikli talep', value: 30 },
        { name: '72 saatte ≥ 2 geçerli teklif', value: 21 },
        { name: 'Teyitli işlem', value: 10 },
        { name: 'Güvenli ödemeli işlem', value: 5 },
      ],
    },
    gateSeries: [
      { name: 'Olgun talep', role: 'ekip-lideri', values: [10, 20, 30] },
      { name: 'İki teklifli talep', role: 'pazarlamaci', values: [6, 14, 21] },
      { name: 'Teyitli işlem', role: 'saha-uzmani', values: [3, 8, 10] },
    ],
    gates: [
      {
        day: 14,
        date: day14,
        title: 'Hücre seçimi',
        required: [
          'Kategori ve koridor seçildi. Puan en az 70, en az 5 gerçek ve yakın alım ihtiyacı ile cevap verebilecek en az 6 satıcı var. Alım döngüsünün 90 gün içinde tekrarı görülebiliyor.',
          '25 görüşme (10 alıcı, 10 tedarikçi, 5 kurumsal ortak) kayda geçirildi. İlk 10 satın alma durumu listelendi.',
          'Platformun ödeme, güvenli ödeme, lojistik ve uyuşmazlık yetenekleri gerçek bir işlemle doğrulandı. Desteklenmeyen vaatler satış materyalinden çıkarıldı.',
          'Fiyat P ve ortak payı hesabı finans ekibinde. İhracatçı birliği üyeliği ve DYS başvurusu için takvim hazır.',
          'İş birimi sahibi ve ticaret operasyon sorumlusu adıyla belirlendi. Haftada 83 saatlik kapasite iki markayla birlikte doğrulandı.',
        ],
        ifNot: 'İki hafta daha dar bir araştırma yapılır. Aynı anda üç pilot açılmaz.',
      },
      {
        day: 30,
        date: day30,
        title: 'Masa ve ortaklar',
        required: [
          'Elle eşleştirme masası çalışıyor. 72 saati dolmuş en az 10 talep var ve bunların en az %60’ı iki geçerli teklif aldı.',
          'En az 3 onaylanmış işlem var. Kaybedilen ve satın alınmayan taleplerin nedenleri açıklandı.',
          '4 ortağın görev kartı imzalandı. Ödeme ve lojistik için 2 hizmet ortağıyla ön anlaşma yapıldı.',
          '10–15 satıcının uygunluğu kontrol edildi. Ulaşılabilecek 20–30 alıcıdan oluşan bir havuz hazır.',
          'Güven katmanları için güvenli ödeme sağlayıcısı, lojistik protokolü ve doğrulama standardı seçildi.',
        ],
        ifNot: 'Ürün veya satıcı sorunu varsa, yeni kullanıcı kazanımı artırılmadan sorun düzeltilir. Alıcı ihtiyacı yoksa kategori hipotezi yeniden değerlendirilir.',
      },
      {
        day: 60,
        date: day60,
        title: 'Pilot ticaret',
        required: [
          'En az 20 olgun talep var ve bunların en az %70’i iki geçerli teklif aldı. İlk teklif 24 saatten önce geliyor.',
          'En az 5 farklı alıcıyla en az 8 onaylanmış işlem yapıldı. İlk güvenli ödemeli işlemler gerçekleşti.',
          '100 doğrulanmış vitrin açık ve en az %40’ı aktif. 5 çapa tedarikçi ve 3 çapa alıcı var.',
          'En az 3 gerçek ücretli hizmet müşterisi var ya da fiyat ve model düzeltmesi belgelendi',
          'İlk ortak hak edişi kayıtlara göre hesaplandı. Katkı ve edinim maliyeti ayrı gösteriliyor.',
        ],
        ifNot: 'Katkı, hizmet ve tekrar alım kanıtı gelişiyorsa mevcut hücreyle devam edilir. Yalnız üyelik satılıyorsa pazaryeri büyütülmez.',
      },
      {
        day: 90,
        date: day90,
        title: 'Karar',
        required: [
          'En az 30 olgun talep var ve taleplerin en az %70’i teklifle karşılanıyor',
          'En az 8 farklı alıcıyla en az 10 onaylanmış işlem yapıldı. Bunların en az 5’i güvenli ödemeli.',
          'Alım döngüsü dolan alıcıların en az %40’ı tekrar aldı. Alıcı kulübünde 50 üye var ve en az 20’si aktif.',
          'Müşteri katkısı pozitif ve maliyet en çok 6 ayda geri kazanılıyor. Anti-ağ etkisi %30’un altında.',
          'Sonucun tamamı tek bir büyük alıcıdan veya satıcıdan gelmiyor',
        ],
        ifNot: 'Bütün alanlar yeterliyse komşu hücre denenir. Veriler henüz olgunlaşmadıysa program aynı kapsamda 30–45 gün uzatılır. Talepte veya katkıda yapısal bir sorun varsa model daraltılır, tedarikçi bulma hizmetine geçilir ya da program durdurulur.',
      },
    ],
    phases: [
      {
        no: 1,
        ...w(1, 2),
        title: 'Keşif ve hücre',
        work: [
          'İç veri denetlenir. 10 alıcı, 10 tedarikçi ve 5 kurumsal ortakla toplam 25 görüşme yapılır ve aday hücreler puanlanır.',
          'Platformun mevcut yetenekleri gerçek bir işlemle doğrulanır. Desteklenmeyen vaatler satış materyalinden çıkarılır.',
          '5986 desteğinin ön şartları için ihracatçı birliği üyeliği ve DYS kaydı başlatılır. Güvenli ödeme ve lojistik ortağı için kısa liste yapılır. Fiyat P ve ortak payı hesaplanır.',
        ],
        output: `Hücre kararı, görüşme kayıtları ve ilk 10 satın alma durumu. 14. gün geçidi (${shortDate(day14)})`,
        owner: 'İş birimi yöneticisi',
        role: 'yonetici',
      },
      {
        no: 2,
        ...w(3, 4),
        title: 'Masa ve ortaklar',
        work: [
          'Elle eşleştirme masası kurulur: form, 24 saat içinde nitelik kontrolü, 48–72 saatlik yanıt süresi sözü ve tedarikçi arama listesi. Tedarikçi hazırlık listesi de hazırlanır.',
          'Ortak kiti ve üç ortak tipi için tek sayfalık belgeler hazırlanır. 10 ortak adayıyla görüşülür ve ilk 4 ortağın görev kartı imzalanır. Güven katmanları için güvenli ödeme sağlayıcısı, lojistik protokolü ve doğrulama standardı seçilir.',
          'İlk 5 gerçek talep kabul edilir. 10–15 satıcının uygunluğu kontrol edilir ve ulaşılabilecek 20–30 alıcıdan bir havuz oluşturulur.',
        ],
        output: `Masa çalışıyor ve 2 hizmet ortağıyla ön anlaşma var. 30. gün geçidi (${shortDate(day30)})`,
        owner: 'Kanal ve operasyon',
        role: 'ekip-lideri',
      },
      {
        no: 3,
        ...w(5, 8),
        title: 'Pilot ticaret',
        work: [
          'Arz ortaklarıyla tedarikçileri başlatma günleri yapılır ve 100 vitrin açılır. Ana şirketin ajans ağından katalog aktarılır.',
          'Talep ortakları ve topluluklardan 50 talep toplanır. Talepler elle eşleştirilir ve sonuçlandırılır. 5 çapa tedarikçi ve 3 çapa alıcı kazanılır, ilk güvenli ödemeli işlemler yapılır.',
          'İlk ortak hak edişi kayıtlara göre hesaplanır. Kaybedilen alıcı ve satıcılarla görüşülür. “İhracata hazırlık skoru” aracının deneme sürümü çıkar ve ilk izinli vaka yazılır. Teklif veya karar aşamasındaki en büyük engel düzeltilir.',
        ],
        output: `100 vitrin, 50 talep ve en az 8 onaylanmış işlem. 60. gün geçidi (${shortDate(day60)})`,
        owner: 'Ticaret operasyonu + ortak başarı',
        role: 'saha-uzmani',
      },
      {
        no: 4,
        ...w(9, 12),
        title: 'Kulüp ve tekrar',
        work: [
          '50 üyeli davetli alıcı kulübü açılır ve haftalık bültenler başlar. 1 ortakla ortak markalı çevrim içi etkinlik yapılır.',
          'Üreticiler kendi alıcılarını komisyonsuz olarak platforma taşır. Başarılı ortak tipine sınırlı sayıda ortak eklenir ve toplam en çok 7 olur. Tekrar eden elle yapılan iş, küçük bir ürün düzeltmesiyle azaltılır.',
          'Geçit koşulları sağlandıysa küçük bir kategori etkinliği veya dar kapsamlı ücretli kanal denemesi yapılır. Olgun müşteri grupları, katkı ve yoğunlaşma analiz edilir.',
        ],
        output: 'Eşleşme oranı ≥ %70, en az 10 onaylanmış işlem, 50 kulüp üyesi ve tekrar alım verisi',
        owner: 'Tüm ekip',
        role: 'dijital-pazarlama',
      },
      {
        no: 5,
        ...w(13),
        title: 'Karar',
        work: ['90 gün raporu hazırlanır. Komşu hücreye genişleme, koridoru daraltma veya tedarikçi bulma hizmetine yön değiştirme (pivot) kararı verilir.', '4–6. aylar için kaynak planı yapılır. Açık talepler devredilir, korunacak ve durdurulacak işler belirlenir.'],
        output: `Yazılı karar (${shortDate(day90)})`,
        owner: 'Yönetim sponsoru',
        role: 'yatirimci',
      },
    ],
    work: [
      { name: 'İç veri denetimi ve 25 görüşme', ...w(1, 2), role: 'yonetici', text: '10 alıcı, 10 tedarikçi ve 5 kurumsal ortak. Tek kayıt şablonu kullanılır.' },
      { name: 'Hücre puan kartı ve seçim', ...w(1, 2), role: 'yonetici', text: 'Beş aday. Puan en az 70 ve üç koşul sağlanmalı.', milestone: true },
      { name: 'Platform yetenek doğrulaması', ...w(1, 2), role: 'yazilim', text: 'Ödeme, güvenli ödeme, lojistik ve uyuşmazlık yetenekleri gerçek bir işlemle sınanır' },
      { name: 'E-ihracat desteği ön şartları', ...w(1, 6), role: 'yatirimci', text: 'İhracatçı birliği üyeliği, DYS kaydı ve B2B platformu statüsü için başvuru takvimi. Destek ek kazanç sayılır.' },
      { name: 'Eşleştirme masası kurulumu', ...w(3, 4), role: 'ekip-lideri', text: 'Form, nitelik kontrolü, yanıt süresi sözü, tedarikçi arama listesi ve karşılaştırma tablosu' },
      { name: 'Güven katmanları', ...w(3, 6), role: 'yatirimci', text: 'Doğrulama standardı, güvenli ödeme sağlayıcısı, lojistik protokolü, numune ve uyuşmazlık süreci' },
      { name: 'Ortak seçimi ve görev kartları', ...w(3, 4), role: 'pazarlamaci', text: '10 görüşmeden 4 ortak seçilir. 60 dakikalık eğitim ve örnek talep çalışması yapılır.' },
      { name: 'Arz tohumlama: 100 vitrin', ...w(5, 8), role: 'saha-uzmani', text: 'Tedarikçileri başlatma günleri, katalog aktarımı ve hazırlık listesi' },
      { name: 'Talep toplama ve elle eşleştirme', ...w(5, 12), role: 'ekip-lideri', text: '50 talep toplanır. Her talep 72 saatte en az 2 geçerli teklif almalı. Kapanış kaydı tutulur.' },
      { name: 'Çapa kullanıcılar', ...w(5, 8), role: 'saha-uzmani', text: '5 tedarikçi ve 3 alıcıya birebir yakın destek. İlk güvenli ödemeli işlemler.' },
      { name: 'Araçlar ve içerik', ...w(6, 11), role: 'dijital-pazarlama', text: 'İhracata hazırlık skoru, maliyet karşılaştırma aracı ve kategori rehberleri' },
      { name: 'İkinci ortak dalgası', ...w(9, 10), role: 'pazarlamaci', text: 'Başarılı ortak tipine sınırlı ekleme. Toplam en çok 7 ortak.' },
      { name: 'Davetli alıcı kulübü ve bültenler', ...w(9, 12), role: 'dijital-pazarlama', text: '50 üye, en az 20’si aktif. Haftalık talep özeti ve fırsat bülteni.' },
      { name: '90. gün kararı', ...w(13), role: 'yatirimci', text: 'Genişleme, daraltma veya yön değiştirme', milestone: true },
    ],
    rhythm: [
      'Ticaret operasyon sorumlusu her iş günü 15 dakikalık toplantı yapar. Süresi dolmak üzere olan talepler, cevap vermeyen satıcılar, karar bekleyen alıcılar ve açık teslimat sorunları konuşulur.',
      'Haftada bir 45 dakikalık toplantıda bir başarı, bir kayıp ve tekrarlanan bir engel konuşulur. Göstergeler adet ve oranla birlikte sunulur. En fazla üç düzeltme kararı alınır ve her birinin sorumlusu ile tarihi yazılır.',
      'Likidite kurulu ayda bir 60 dakika toplanır. Net tahsilat, hizmet maliyeti, ortak hak edişi, edinim maliyeti ve olgun müşteri grupları konuşulur.',
      'Her hafta tek bir darboğaza odaklanılır. Talep yoksa alıcılara erişim güçlendirilir. Talep var ama teklif yoksa satıcı kapsamı ve yanıt hızı ele alınır. Teklif var ama karar yoksa fiyat, güven ve şartlara bakılır. İşlem var ama tekrar yoksa alıcının sürekli fayda görmesi sağlanır.',
    ],
    quarters: [
      { quarter: '4. çeyrek 2026 – 1. çeyrek 2027', focus: 'Tek hücrede likidite, elle eşleştirme hizmeti, güven katmanları, 4–7 ortak ve 5986 statü başvurusu hazırlığı', target: 'Eşleşme oranı ≥ %70, en az 10 işlem, 100 tedarikçi, 50 talep' },
      { quarter: '2. çeyrek 2027', focus: 'Elle eşleştirme süreci ürüne dönüştürülür. Bir seferde tek değişken değiştirilerek ikinci koridor ya da komşu kategori denenir. Bölge temsilcisi pilotu ve Pro üyelik testi yapılır.', target: 'GMV ve aktif tedarikçi hedefi gerçek veriyle yazılır' },
      { quarter: '3. çeyrek 2027', focus: 'Fuar ve e-ihracat zirvesi temasları müşteriye dönüştürülür. 5986 destekleri alınmaya başlanır. Hizmet ortağı paketleri satılır ve ortaklara görev bazlı yetkinlik belgesi verilir.', target: 'Farklı ortaklar benzer sonuçlar alıyor, uyuşmazlık az' },
      { quarter: '4. çeyrek 2027', focus: '3 kategori ve 2 koridora çıkılır. Markaya yatırım olarak vaka raporu yayımlanır. 2028 planı yapılır ve sınırlı bir uluslararası hücre seçeneği değerlendirilir.', target: 'Her hücrenin geliri ve gideri ayrı izlenir. Bir hücrenin açığı diğerinin geliriyle kapatılmaz.' },
    ],
    risks: [
      { risk: 'Seçilen koridorda talep toplanamaz', probability: 'Orta', impact: 'Yüksek', response: 'Elle eşleştirme verisine bakılarak 6. haftada koridor değiştirilir' },
      { risk: 'Dolandırıcılık veya kalite olayı güveni zedeler', probability: 'Orta', impact: 'Yüksek', response: 'Doğrulama, güvenli ödeme, numune ve uyuşmazlık süreci kurulur. İlk işlemler birebir yakından takip edilir.' },
      { risk: 'Kurumsal ortaklar yavaş', probability: 'Yüksek', impact: 'Orta', response: 'Özel dernekler ve ajans ağıyla başlanır. Kamu kurumları ve birlikler ikinci dalgada gelir.' },
      { risk: '5986 statüsü ve destekler gecikir', probability: 'Orta', impact: 'Orta', response: 'Destek ek kazanç sayılır ve plan ona bağlı kurulmaz' },
      { risk: 'Global ve yerli pazaryerlerinin B2B hamleleri', probability: 'Orta', impact: 'Orta', response: 'Farklı konumlanılır: elle eşleştirme hizmeti, yakınlık ve güçlü güven katmanları' },
      { risk: 'Elle eşleştirme hizmeti büyüyemez', probability: 'Orta', impact: 'Orta', response: 'Süreç 3. ayda ürüne dönüştürülür ve süreç verisi şablon olur. El emeğine ne kadar bağımlı kalındığı, sonraki yatırımı belirler.' },
      { risk: 'E-ihracat beyanı, KDV ve fatura karmaşıklığı', probability: 'Orta', impact: 'Orta', response: 'Gümrük ve muhasebe hizmet ortağıyla çalışılır ve rehber içerik hazırlanır' },
    ],
    pivots: [
      'Eşleşme oranı %40’ın ve tamamlanan işlem sayısı 3’ün altındaysa koridor veya kategori değiştirilir. Platform yatırımı dondurulur.',
      'Talep var ama tedarikçiler yanıt vermiyorsa, yani aktif tedarikçi oranı %25’in altındaysa, arz ortağı değiştirilir. Tedarikçi hazırlık eşiği yükseltilir.',
      'Tedarikçi var ama talep yoksa “tedarikçi bulma hizmeti” modeline geçilir. Önce hizmet geliri elde edilir, platform sonra gelir.',
      'Her çeyrek şu soru sorulur: “Bunu bugün yapmıyor olsaydık, başlar mıydık?”',
    ],
    stop: [
      'İki araştırma döngüsünde yakın döneme ait gerçek talep bulunamazsa ya da uygun satıcılar olmasına rağmen teklif karşılaştırması işleme dönüşmezse program durdurulur.',
      'Fiyat ve kapsam düzeltilmesine rağmen doğrudan katkı sürekli negatifse, satış vaatleri gerçek hizmetle desteklenemiyorsa veya açık talepleri takip edecek kapasite kalmadıysa program durdurulur.',
      'Harcama kesilirse müşteriler sahipsiz bırakılmaz. Açık talepler sonuçlandırılır ya da neden durdurulduğu bildirilir. Hak edilmiş ödemeler yapılır.',
    ],
    capacity: [
      { role: 'Program ve kategori kararları', short: 'Program kararları', hours: 8, duty: 'İş birimi yöneticisi' },
      { role: 'Alıcı ihtiyacı, eşleştirme ve sonuç takibi', short: 'Eşleştirme ve takip', hours: 35, duty: 'Ticaret operasyon sorumlusu' },
      { role: 'Satıcı ve ortak saha geliştirme', short: 'Satıcı ve ortak sahası', hours: 20, duty: 'Kanal ve saha sorumlusu' },
      { role: 'İçerik, küçük etkinlik ve edinim denemeleri', short: 'İçerik ve edinim', hours: 10, duty: 'Pazarlama sorumlusu' },
      { role: 'Kayıt, ölçüm ve ürün akışı düzeltmeleri', short: 'Kayıt ve ölçüm', hours: 6, duty: 'Operasyon ve veri sorumlusu' },
      { role: 'Finans, sözleşme koordinasyonu ve hak ediş', short: 'Finans ve hak ediş', hours: 4, duty: 'Şirket içi finans ve operasyon' },
    ],
    capacityNote: 'Haftada 83 saat, yaklaşık 2,1 tam zamanlı kişiye eşittir. 13 haftada toplam 1.079 saat eder. Roller farklı kişilerde olabilir veya paylaşılabilir. Kişilerin adları ilk gün yazılır. 83 saat ayrılamıyorsa pilottaki işletme sayısı azaltılır. Takip yükü, mevcut ekibe fark edilmeden eklenmez. Segika ile birlikte haftada 135 saat tek çizelgede izlenir. Şirket ilk 14 günün kaynağını ayırır. Sonraki kaynakları 14, 30 ve 60. gündeki kanıtlara göre açar.',
    dont: [
      'Likidite sağlanmadan üyelik satmak, bütün kategorilerde lansman yapmak ve markayı tanımayan kitleye reklam vermek.',
      'İhtiyaç kanıtlanmadan kapsamlı ortak portalı, yeni entegrasyon programı veya büyük yazılım projesi başlatmak.',
      'Sertifikalı bayi, otomatik bölge hakkı ve alt bayi ağı kurmak. İmza sayısını başarı saymak.',
      'Platform dışındaki ticareti iStoc geliri saymak, GMV’den gelir hesaplamak ve önceki siparişleri ağın katkısı saymak.',
    ],
  };
}

/* ---------- Fabrika ---------- */

export function makePartnership(p: Params, prog: ProgramModel) {
  const { firstDay, day30, day60, day90 } = prog.dates;
  const day14 = addDays(p.startDate, 13);
  const weekFrom = (n: number) => addDays(firstDay, (n - 1) * 7);
  const weekTo = (n: number) => addDays(firstDay, n * 7 - 1);
  const w = (a: number, b: number = a) => ({
    from: weekFrom(a),
    to: weekTo(b),
    weeks: a === b ? `Hafta ${a}` : `Hafta ${a}–${b}`,
  });
  const ctx: Ctx = { t0: firstDay, day14, day30, day60, day90, w };
  const segika = makeSegika(ctx);
  const istoc = makeIstoc(ctx);
  const programs: Program[] = [segika, istoc];
  /** İki programın ortak disiplini: yönetim bunları tek toplam satış rakamıyla değerlendirmez. */
  const shared = [
    'Her program tek segment ya da tek hücreyle başlar. 14, 30, 60 ve 90. günlerde geçit vardır. Her geçitte devam, düzeltme veya durdurma kararı yazılı verilir.',
    'Başarı imzayla değil sonuçla ölçülür. Segika’da sonuç, ödeyen ve kalan müşteridir. iStoc’ta sonuç, onaylanmış ve tekrar eden ticarettir.',
    `Kapasite birlikte izlenir: haftada 52 + 83 = 135 saat, 13 haftada 1.755 saat (≈ 3,4 tam zamanlı kişi). Mevcut hizmet işleri bu kapasitenin dışında tutulur.`,
    'Aynı firma iki markayı da kullanabilir. Hedef, fırsat, izin ve tahsilat her marka için ayrı kaydedilir. Aynı gelir için ikinci ödeme yapılmaz. Segika listesi kendiliğinden iStoc listesi olmaz.',
    'Her maliyet bir kez yazılır. Korunan gelirin tamamı programın sağladığı kazanç sayılmaz. Gerçekleşen ve tahmin edilen değerler ayrı gösterilir.',
  ];
  return { programs, byId: { segika, istoc }, shared, dates: { t0: firstDay, day14, day30, day60, day90, end: weekTo(13) }, weeks: 13 };
}

export type Partnership = ReturnType<typeof makePartnership>;
