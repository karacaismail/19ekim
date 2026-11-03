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
      { type: 'P6 Dernek, OSB, oda', brings: 'Etkinlik, üye iletişimi ve referans', entry: 'Ortak eğitim programı', wave: '2. dalga' },
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
        { name: '4. Sınırlı ön inceleme', sub: 'Yetkiyle en az veri; SGK parolası kayda yazılmaz' },
        { name: '5. Fayda ve kapsam raporu', sub: 'Potansiyel, doğrulanmış ve belirsiz ayrı' },
        { name: '6. Teklif', sub: 'Kapsam, görevler, kurulum, ücret, kontrol takvimi, çıkış' },
        { name: '7. Tahsilat ve aktivasyon', sub: 'Erişim, sorumlular, ilk rapor teslim alındı' },
        { name: '8. İlk değer görüşmesi', sub: 'Ne elde edildi, kalan işler; yapay aktivasyon yok' },
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
      { ring: 'İç 3', channel: 'Mühendislik olarak pazarlama: ücretsiz “Teşvik Kaçak Tarayıcı” (3 dakikada potansiyel, ortak markalı)', test: 'Tarayıcı yayına alınır ve içerikler ona bağlanır', metric: '≥ 100 tarama, ≥ 15 nitelikli görüşme' },
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
      { label: 'Teyitli işlem', value: '≥ 10', note: '≥ 8 farklı alıcı; ≥ 5 güvenli ödemeli' },
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
      { name: 'Concierge talep masası', what: 'Talep formu alınır, 24 saat içinde nitelik kontrolü yapılır ve talep 3–5 satıcıya yönlendirilir. Toplam maliyet karşılaştırılır ve kapanış kaydı tutulur. Süreç işleyince ürüne dönüştürülür.', measure: 'Taleplerin en az %70’i 72 saatte en az 2 geçerli teklif alır. İlk teklif 24 saatten önce gelir.', weeks: 'Hafta 3–12' },
      { name: 'Arz tohumlama ve çapa kullanıcılar', what: 'Arz ortakları ve katalog aktarımıyla 100 vitrin açılır. Platformu sürükleyecek 5 çapa tedarikçiye ve 3 çapa alıcıya birebir yakın destek verilir.', measure: `${shortDate(day60)} tarihinde 100 doğrulanmış vitrin açık ve en az %40’ı aktif.`, weeks: 'Hafta 5–8' },
      { name: 'Güven yığını', what: 'Firma doğrulama (KYB), güvenli ödeme, numune programı, lojistik ve gümrük paketi ile uyuşmazlık süreci kurulur.', measure: `${shortDate(day90)} tarihinde en az 5 güvenli ödemeli işlem.`, weeks: 'Hafta 3–8' },
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
      'Konumlandırma (site): “global B2B toptan satış ve ticaret pazaryeri”; doğrulanmış tedarikçi ve güvenli ödeme vaadi. Bu gözlem aktif alıcı sayısını, güvenli ödeme ve lojistik kapasitesini doğrulamaz; 1. haftada ürün sorumlusu çalışan bir işlem üzerinden doğrular, satış yalnız doğrulanmış yetenekleri anlatır.',
      'Fiilî rakip: WhatsApp, Instagram, telefon, fuar ve Laleli–Merter–İSTOÇ tipi fiziksel toptan merkezleri; global portallar ve yerli B2B platformları ikincil.',
      'Piyasa hafızası: 2017–2022 B2B site üyelik destekleri sonrasındaki fırsatçı fiyat artışları “boş üyeliğe para ödedim” hafızası bıraktı. Sıra: önce likidite, sonra üyelik.',
      'Devlet desteği: e-ihracat destekleri (5986) kapsamında “B2B platformu” statüsü gerçekçi yol (pazaryeri statüsü ≥ 1.000 hizmet sağlayıcı ve ≥ 100.000 ürün ister); ön şartlar ihracatçı birliği üyeliği, DYS kaydı, Türk ürünü, marka tescili. Destek bonus sayılır; plan ona bağlı kurulmaz.',
      'Güven ve finansman ortağı adayı: tedarikçiye tahsilat garantisi, alıcıya vade sunan tedarik zinciri finansmanı ürünleri; yurt içi B2B güven katmanı için 2. hafta kısa listede.',
      'İSTOÇ ticaret merkezi erişimi bir dağıtım fırsatıdır; yönetimi veya kooperatifiyle resmî ilişki varsayılmaz; logo kullanımı yalnız yazılı yetkiyle.',
    ],
    internalData: [
      'Listelenen tedarikçi, ürün ve kategori; son 30 günde yanıt veren tedarikçi oranı',
      'Kayıtlı alıcı; ülke ve şehir; son 30 günde talep girenler',
      'Talep sayısı, teklif alma oranı, ilk teklife kadar süre, işleme dönüşme',
      'Güvenli ödeme ile tamamlanan işlem, GMV, alınan pay',
      'Trafik kaynakları ve ilk oturumda “sonuç yok” oranı',
      'Mevcut ortaklık ve üyelik gelirleri ile şikâyetler',
    ],
    hypotheses: [
      { id: 'H1', hypothesis: 'Alıcı için asıl engel güven (ödeme, kalite), fiyat değil', signal: 'Görüşmelerde dolandırıcılık ve numune hikâyeleri', response: 'Güven yığını' },
      { id: 'H2', hypothesis: 'Tedarikçi “boş pazaryeri” deneyimi yaşıyor; talep gelmiyor ya da sahte', signal: 'Yanıt oranı düşük, çıkış görüşmeleri', response: 'Talep öncelikli masa; talep kalite kuralı' },
      { id: 'H3', hypothesis: 'Kategori genişliği yoğunluğu öldürüyor', signal: 'Her kategoride < 10 aktif tedarikçi', response: 'Tek hücre' },
      { id: 'H4', hypothesis: 'Alıcının gerçek alternatifi uzak tedarik değil, WhatsApp’taki mevcut tedarikçi', signal: '“Zaten tanıdığım var”', response: '“Yeni tedarikçi” değil “yedek ve yakın tedarikçi” mesajı; numune' },
      { id: 'H5', hypothesis: 'Küçük parti + 3–7 gün teslim, yurt dışı alıcı için satın alma nedeni', signal: 'MOQ ve teslim şikâyeti', response: 'Yakın tedarik konumlandırması' },
      { id: 'H6', hypothesis: 'Tedarikçi ihracat bürokrasisinden korkuyor', signal: '“Gümrük, evrak, ödeme”', response: 'Hizmet ortakları paketi' },
      { id: 'H7', hypothesis: 'Üyelik satışı erken yapıldığında kayıp ve itibar kaybı doğuruyor', signal: 'Üyelik iptalleri', response: 'Başarı ücretli model; üyelik 6. aydan sonra' },
      { id: 'H8', hypothesis: 'Kurumsal ortaklar üye kazandırmak ister ama somut sonuç raporu bekler', signal: 'Görüşmelerde “ne kazandıracak?”', response: 'Ortak panosu, üye sonuç raporu' },
    ],
    interviews: [
      { group: 'Alıcı', count: 10, evidence: 'Son yeni tedarikçi deneyimi; en pahalı tedarik sorunu; en küçük sipariş miktarı; ilk ödeme riski; son numune süresi; 48 saatte 3 teklif için gerçek talep taahhüdü' },
      { group: 'Tedarikçi', count: 10, evidence: 'Son 12 ayda kazanılan ve kaybedilen yurt dışı alıcı; en son para ödenen B2B platform ve sonucu; son talebe cevap süresi; tahsilat sorunu; kataloğu bu hafta yükleme taahhüdü' },
      { group: 'Kurumsal ortak (birlik, OSB, dernek, ajans)', count: 5, evidence: 'Son dijital veya ihracat programı ve raporu; üyelerin en sık ihracat şikâyeti; tipik katılım oranı; onboarding günü için tarih' },
    ],
    interviewRules: [
      'Platformu anlatmayız; geçmiş, somut olayları sorarız: “en son ne zaman, kimden, kaç teklif, ne oldu?”',
      '“Kullanırdım” veri değildir; her görüşme bir bağlılıkla biter: gerçek talep, katalog, pilot tarihi.',
      'Ulaşılamayan ve katılmayan işletmeler de kaydedilir; yalnız olumlu konuşanlardan sonuç çıkarılmaz.',
      'Her görüşmeden tek kayıt: sorun, geçmiş davranış, mevcut alternatif, karar verici, satın alma zamanı, kanıt, açık varsayım, sonraki eylem ve tarih.',
    ],
    segments: [
      { segment: 'Alıcı (zor taraf): yurt dışı Türkçe konuşan toptancı ve ithalatçılar', why: 'Dil ve güven engeli düşük; yakın tedarik ve küçük parti satın alma nedeni', priority: '1' },
      { segment: 'Alıcı: Avrupa ve MENA e-ticaret satıcıları', why: 'Küçük parti, hızlı yenileme; uzak tedarikin MOQ ve süre acısı', priority: '2' },
      { segment: 'Alıcı: yurt içi küçük işletme ve e-ticaret satıcısı (yenileme alımı)', why: 'Ambalaj, temizlik, kırtasiye sarfları gibi tekrar eden tüketim; hücre seçimine bağlı', priority: '2' },
      { segment: 'Alıcı: perakende zinciri satın alma, Anadolu perakendecileri', why: 'Hacimli ama yavaş karar; ikinci dalga', priority: '3' },
      { segment: 'Tedarikçi: kataloğu hazır, ihracat yapmış ya da hazır KOBİ üretici ve toptancı', why: '48 saatte teklif verebilir; küçük parti kabul eder', priority: '1' },
      { segment: 'Tedarikçi: fiziksel toptan merkezlerinde (Laleli, Merter, İSTOÇ) ihracata yönelik satıcılar', why: 'Erişim kolay; katalog ve dil desteği gerekir', priority: '2' },
    ],
    segmentNote: 'Alıcı kıt ve zor taraftır; operasyon alıcı öncelikli, misyon tedarikçi öncelikli yürür. Hedef “Türkiye’deki bütün toptancılar” değil, örneğin “seçilen koridorda ayda en az bir kez yenileme alımı yapan küçük işletmeler”dir; eşikler gerçek satın alma örnekleriyle doğrulanır.',
    cellOptions: {
      title: 'Aday hücreler (kategori × koridor)',
      note: 'Hiçbiri seçilmiş pazar değildir; 14. günde görüşme ve gerçek talep kanıtıyla puanlanır. Üçü yurt içi yenileme alımı, ikisi ihracat koridorudur.',
      rows: [
        { name: 'Standart ambalaj sarfları → İstanbul e-ticaret işletmeleri (yurt içi)', job: 'Düzenli sevkiyat malzemesini uygun miktar ve tarihte yenilemek', risk: 'Nakliye maliyeti, ölçü ve kalite farkı, çok düşük sipariş katkısı' },
        { name: 'Temizlik sarfları → küçük işletmeler (yurt içi)', job: 'Tekrarlayan işletme tüketimini kesintisiz karşılamak', risk: 'Aynı ürün adında farklı teknik özellik; mevcut tedarikçinin alışkanlık avantajı' },
        { name: 'Seçilmiş kırtasiye sarfları → küçük perakendeciler (yurt içi)', job: 'Hızlı dönen ürün grubunda stok yenilemek', risk: 'Mevsimsellik, marka ve ürün kodu farkı, çok sayıda küçük sipariş' },
        { name: 'Ev tekstili (Denizli, Bursa) → Avrupa’da Türkçe konuşan toptancılar', job: 'Sezon öncesi küçük parti, 3–7 gün teslim', risk: 'Numune ve lojistik maliyeti; kalite tutarlılığı' },
        { name: 'Plastik ev eşyası ve hırdavat (İstanbul) → Kuzey Afrika ithalatçıları', job: 'Kargoya uygun standart ürün yenilemesi', risk: 'Gümrük ve evrak; ödeme güvenliği' },
      ],
    },
    cellScorecard: {
      title: 'Hücre puan kartı (ağırlıklı, 100 üzerinden)',
      note: 'Her ölçüte 0–5 verilir; ağırlıklı puan = ölçüt puanı / 5 × ağırlık. Veri yoksa puan verilmez, kanıt toplanır.',
      rows: [
        { criterion: 'Satın alma ihtiyacının yakınlığı ve tekrar sıklığı (son alım, sipariş örneği, sonraki alım zamanı)', points: 25 },
        { criterion: 'Gerçek alıcıya doğrudan veya ortak üzerinden erişim (görüşmeye katılan yetkili, pilot talep taahhüdü)', points: 20 },
        { criterion: 'Cevap verebilen uygun satıcı yoğunluğu (deneme teklifi verilmiş)', points: 20 },
        { criterion: 'Teklifleri karşılaştırabilme (ortak teknik alanlar, teslimat, toplam maliyet)', points: 15 },
        { criterion: 'Hizmetten katkı üretme ihtimali (ödeme davranışı, hizmet süresi)', points: 10 },
        { criterion: 'Teslimat, iade ve uzmanlık karmaşıklığının yönetilebilirliği', points: 10 },
      ],
      threshold: 70,
      veto: 'Puan koşulların yerine geçmez: ≥ 5 gerçek yakın alım ihtiyacı, bunları karşılayabilen ≥ 6 satıcı ve 90 günde tekrar gözlenebilir bir çevrim şarttır. Hiçbir aday karşılamıyorsa iki hafta daraltılmış araştırma yapılır; aynı anda üç pilot açılmaz.',
    },
    partnerTypes: [
      { type: 'Arz toplayıcı (kurumsal)', brings: 'İhracatçı birlikleri, OSB müdürlükleri, ticaret ve sanayi odaları, sektör dernekleri, e-ticaret altyapı ve katalog sağlayıcıları, ERP, ana şirketin dijital ajans ağı: seçilmiş tedarikçi listesi, onboarding günü, katalog verisi', entry: 'Program protokolü + üye sonuç raporu taahhüdü; nakit yok (ortak markalı program, üye panosu, çeyreklik rapor)', wave: '1. dalga · 3' },
      { type: 'Talep toplayıcı', brings: 'Yurt dışı Türk iş dernekleri ve odaları, iş konseyleri, ticaret müşavirliği etkinlikleri, sourcing ajanları, satın alma hizmeti şirketleri, e-ticaret satıcı toplulukları, işletme ağları: gerçek talep, alıcı kulübü üyeleri', entry: 'Ayda ≥ 2 izinli satın alma brifi; işlem başına pay veya tanımlı görev bedeli (%50 kapsam kabulü + %50 sonuç takibi); kayıt başına ödeme yok', wave: '1. dalga · 1–2' },
      { type: 'Satıcı geliştirme (ticari)', brings: 'Kategori içi bağlantı sahipleri, toptancılara hizmet veren ajanslar: en fazla 5 aday satıcı; ≥ 3 satıcının yetkili kişi, kapsam ve teklif şartları tamam', entry: 'Sınırlı süreli gelir payı (örnek %10, ≤ 6 ay); 14. günde finans onayı', wave: '1. dalga · 2' },
      { type: 'Hizmet (bütün ürün)', brings: 'Lojistik ve e-ihracat kargo, gümrük müşavirliği, ödeme ve güvenli ödeme, tedarik zinciri finansmanı, kalite kontrol, ürün fotoğrafı, çeviri ve katalog: alıcı güveni, tedarikçi kolaylığı', entry: '“iStoc Onaylı Hizmet” sözleşmesi; gelir paylaşımı veya referans ücreti; aynı emek iki kez ödenmez', wave: '1. dalga · ödeme + lojistik' },
      { type: 'Teknoloji', brings: 'E-ticaret altyapıları, ERP, pazaryeri entegratörleri: katalog senkronu, ortak pazarlama', entry: 'API; karşılıklı liste fiyatı indirimi', wave: '2. dalga' },
      { type: 'Kanal: bölge temsilcileri', brings: 'Şehir bazlı onboarding ajanları: tedarikçi aktivasyonu', entry: 'Aktif tedarikçi başına ödeme; yalnız likidite kanıtı sonrası', wave: '6. aydan sonra' },
    ],
    firstWave: `İlk dalga 4 ortak: 1 talep toplayıcı, 2 arz/satıcı geliştirme, 1 hizmet (ödeme). 60. gün geçidinden (${shortDate(day60)}) sonra en çok 7: 3 arz + 2 talep + 2 hizmet (ödeme + lojistik). İlk 30 günde sonuç üretmeyen ortağa düzeltme görevi verilir; ikinci 30 günde kanıt yoksa yeni fırsat dağıtımı durur. Sertifikalı bayi, otomatik bölge hakkı ve alt bayi ağı ilk pilotta açılmaz.`,
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
      note: 'İlk aday listesi 20 kurumla sınırlıdır; en az 70 puan ve doğrulanabilir iki ilişki örneği gerekir.',
      rows: [
        { criterion: 'Seçilen kategori ve koridora erişim (üye veya alıcı tabanı)', points: 30 },
        { criterion: 'Gerçek ilişki kanıtı (iki doğrulanabilir örnek; karar vericiyle görüşüldü)', points: 25 },
        { criterion: 'Taahhüt edilen zaman ve isimli kişi; onboarding günü için tarih', points: 20 },
        { criterion: 'Görev yetkinliği (brif, katalog, teklif takibi)', points: 15 },
        { criterion: 'Kayıt ve uyum disiplini (izinli erişim, KVKK/GDPR)', points: 10 },
      ],
      threshold: 70,
      veto: 'İzinli erişim veya temel dürüstlük sorunu puandan bağımsız eleme nedenidir; alıcı işletmenin çalışanına gizli kişisel ödeme yapılmaz.',
    },
    tierHeaders: ['Ortak', 'Ne verir', 'Ne alır ve ekonomi'],
    tiers: [
      { tier: 'Arz ortağı (kurumsal)', condition: 'Üye listesi, onboarding günü, iletişim', gets: 'Ortak markalı program sayfası, üye panosu, çeyreklik sonuç raporu, üye avantajı; nakit yok' },
      { tier: 'Talep ortağı', condition: 'Gerçek talep, alıcı kulübü üyeleri', gets: 'İşlem başına pay (başarı bazlı) veya görev bedeli; kapalı alıcı kulübü erişimi' },
      { tier: 'Satıcı geliştirme ortağı', condition: '≤ 5 aday satıcı; ≥ 3 hazır satıcı; gerçek talebe ilk cevap', gets: 'Uygun satıcının gerçekten satın aldığı hizmetten sınırlı süreli pay (örnek %10, ≤ 6 ay)' },
      { tier: 'Hizmet ortağı', condition: 'Lojistik, ödeme, gümrük, kalite, katalog', gets: '“iStoc Onaylı Hizmet” rozeti ve akış; gelir paylaşımı veya referans ücreti' },
      { tier: 'Teknoloji ortağı', condition: 'Katalog senkronu', gets: 'Ortak pazarlama; karşılıklı' },
      { tier: 'Bölge temsilcisi (6. ay+)', condition: 'Tedarikçi onboarding', gets: 'Aktif tedarikçi başına ödeme + işlem payı; yalnız likidite kanıtı sonrası' },
    ],
    rules: [
      'Firma doğrulama (KYB) standardı: vergi ve ticaret sicili, ihracatçı birliği üyeliği, referans; rozet yalnız doğrulananlara.',
      'Talep kalite kuralı: miktar, hedef fiyat, teslim yeri, süre, ödeme beklentisi, teklif son tarihi; eksik talep yayınlanmaz; aynı ihtiyacın kopyaları birleştirilir (üç form tek talep sayılır).',
      'Geçerli teklif: teknik şartı karşılayan; miktarı, vergi durumunu, nakliyeyi, teslim zamanını ve geçerlilik süresini açıklayan. Yalnız fiyat yazılmış cevap geçerli değildir; karşılaştırma toplam satın alma maliyeti üzerinden yapılır.',
      'Yanıt SLA: tedarikçi 48 saat; aşanın görünürlüğü düşer; ilk üç talebe hiç dönmeyen satıcı geçici olarak listeden çıkar ve kapasite nedeni öğrenilir.',
      'Doğrulanmış işlem: alıcı ve satıcı teyidi + maskelenmiş sipariş veya teslimat kanıtı. Platform dışında sonuçlanan ticaret eşleşme sonucudur, iStoc geliri değildir; önceden var olan sipariş ağ katkısı sayılmaz.',
      'Fırsat sahipliği: kabul 2 iş günü; koruma 90 gün; 30 gün ilerleme yoksa inceleme. Son 90 günde aktif fırsat veya ücretli müşteri yeni yönlendirme değildir; aynı fatura üzerinde ikinci ödeme yoktur; Segika müşteri listesi otomatik iStoc listesi olmaz.',
      'Münhasırlık yok; marka “iStoc Program Ortağı”. “En büyük”, “garantili satış”, “her üründe en ucuz” iddiaları ortak materyaline girmez; doğrulanmamış ödeme veya uyuşmazlık hizmeti vaat edilmez.',
      'Veri: KVKK ve GDPR (Avrupa alıcıları); alıcı iletişim bilgisi doğrulanmadan bütün satıcı havuzuna dağıtılmaz; kartvizit sınırsız iletişim yetkisi değildir.',
      'Uyuşmazlık: güvenli ödeme kuralları, numune onayı, iade ve itiraz süreci yazılı; ilk işlemler beyaz eldivenle yürür.',
    ],
    journey: [
      { stage: 'Kazanım', duration: '—', criterion: 'Puan kartı ≥ 70/100; iki doğrulanabilir ilişki örneği', owner: 'Program yöneticisi' },
      { stage: 'Onboarding', duration: '21 gün', criterion: 'Ortak markalı sayfa + 1 onboarding günü tarihlendi; 60 dk eğitim ve örnek talep çalışması', owner: 'Ortak başarı' },
      { stage: 'Aktivasyon', duration: '60 gün', criterion: 'Arz: ≥ 20 doğrulanmış vitrin; talep: ≥ 10 nitelikli talep; hizmet: ilk akış', owner: 'Ortak başarı' },
      { stage: 'Büyüme', duration: 'Çeyreklik', criterion: 'Sonuç raporu (üye, talep, işlem), yeni hedef', owner: 'Program yöneticisi' },
      { stage: 'Elde tutma', duration: 'Yıllık', criterion: 'Ortak NPS ≥ 40, yenileme', owner: 'Program yöneticisi' },
    ],
    workflow: {
      title: 'Likidite oyun kitabı (sıralı)',
      summary: 'Dokuz sıra: tek hücre; talep önce (concierge); arz tohumlama; çapa kullanıcılar; araç için gel ağ için kal; güven yığını; davetli alıcı kulübü; üretici evangelizmi; komşu hücre.',
      steps: [
        { name: '1. Tek hücre', sub: `1 kategori × 1 koridor; ${shortDate(day14)}` },
        { name: '2. Talep önce (concierge)', sub: 'Talep topla, 3 teklifi elle bul, kapat; 50 talep' },
        { name: '3. Arz tohumlama', sub: 'Ortaklar + katalog aktarımı → 100 vitrin' },
        { name: '4. Çapa kullanıcılar', sub: '5 tedarikçi + 3 alıcı; beyaz eldiven' },
        { name: '5. Araç için gel, ağ için kal', sub: 'Ücretsiz vitrin + teklif şablonu' },
        { name: '6. Güven yığını', sub: 'KYB, güvenli ödeme, numune, lojistik; ≥ 5 güvenli işlem' },
        { name: '7. Davetli alıcı kulübü', sub: '50 üye, ≥ 20 aktif; haftalık bülten' },
        { name: '8. Üretici evangelizmi', sub: 'Mevcut alıcıları taşı; ilk 6 ay komisyonsuz' },
        { name: '9. Komşu hücre', sub: 'Likidite eşiği aşılınca; 6. ay' },
      ],
    },
    economics: [
      { item: 'Gelir modeli sırası', value: '(1) İşlem başına başarı ücreti (%3–8, güvenli ödemeden) → (2) hizmet paketleri marjı → (3) tedarikçi Pro üyeliği (öne çıkma, analitik, talep önceliği) → (4) alıcı tarafı ücretsiz', note: 'Pro yalnızca aylık talep hacmi kanıtlanan kategoride açılır; üyelik ancak likiditeyle satılır' },
      { item: 'Vaat', value: '“Satmadan ödemezsiniz”; “ilk 90 günde nitelikli talep gelmezse ücret yok”', note: 'Fiyat artış kuralı sözleşmede şeffaf; üyelik indirimi yok, kampanya yerine komisyonsuz dönem' },
      { item: 'Fiyat P', value: 'Onaylı paketin tahsil edilmiş, vergiler hariç, iade ve düzeltmesi bir kez işlenmiş bedeli', note: 'Eski 399 € / 599 € paket örnekleri onaylı fiyat sayılmaz; 15–30. günlerde ≥ 5 satıcıya gerçek kapsam ve fiyatla teklif; sözlü beğeni ödeme kanıtı değildir' },
      { item: 'Ortak payı (oran r, süre s)', value: 'Tek toplam havuz; örnek %10 × en çok 6 ay; finans 14. güne kadar belirler', note: 'Beklenen tahsilat − hizmet maliyeti − hedef katkı ≥ ortak payı; ikinci ortak varsa aynı havuz bölüşülür' },
      { item: 'Talep ortağı emeği', value: 'Sınırlı çalışma bedeli: kapsam kabulünde %50, sonuç takibinde %50', note: 'Edinim gideridir, komisyon gibi gösterilmez; her brif para doğurmaz' },
      { item: 'GMV', value: 'Teslimatı teyitli mal bedeli; KDV ve ayrı fiyatlanan nakliye hariç; iade ayrı', note: 'Otomatik gelir veya komisyon matrahı değildir: 15 sipariş × 20.000 ₺ = 300.000 ₺ GMV örneği iStoc geliri değildir' },
      { item: 'Geri kazanım', value: 'Birikimli katkı / (edinim + ayrı kurulum); üst sınır 6 ay', note: '14. günde nakit kapasitesiyle kesinleşir; üç aylık veriyle altı aylık müşteri ömrü kanıtlanmış sayılmaz' },
    ],
    example: {
      title: 'Hesap yöntemi örneği (gerçek tarife değil)',
      note: 'P = 10.000 ₺/ay; doğrudan hizmet maliyeti 3.000 ₺; ortak payı %10; ilk edinim maliyeti 18.000 ₺. Tutarlar iStoc tarifesi veya öngörüsü değildir; gerçek veriler gelince değişir.',
      total: { name: 'Aylık uygun net tahsilat', value: 10000 },
      parts: [
        { name: 'Doğrudan hizmet maliyeti', value: 3000, tone: 'office' },
        { name: 'Ortak payı (%10)', value: 1000, tone: 'people' },
        { name: 'Müşteri katkısı', value: 6000, tone: 'tech' },
      ],
      rows: [
        { item: 'Aylık müşteri katkısı', value: '10.000 − 3.000 − 1.000 = 6.000 ₺', note: 'Dönemsel teşvik yok' },
        { item: 'Edinimin geri kazanımı', value: '18.000 / 6.000 = 3 ay', note: 'Hedef ≤ 6 ay' },
        { item: 'On müşterinin aylık katkısı', value: '10 × 6.000 = 60.000 ₺', note: 'Sabit gider havuzu 100.000 ₺ ise işletim sonucu −40.000 ₺' },
        { item: 'İşletim başabaşı', value: '100.000 / 6.000 → 17 müşteri', note: 'Büyüme yatırımları hariç; şirket başabaşı değil' },
      ],
    },
    channels: [
      { ring: 'İç 1', channel: 'İş geliştirme: kurumsal arz ve talep ortakları', test: '3 arz + 2 talep ortağı; onboarding günleri', metric: '100 doğrulanmış tedarikçi, 50 talep' },
      { ring: 'İç 2', channel: 'Mevcut platform ve topluluklar: diaspora iş dernekleri, satıcı grupları, mesleki ağlar, toptancı mesaj grupları', test: 'Davetli alıcı kulübü; haftalık bülten', metric: '50 kulüp üyesi, ≥ 20 aktif' },
      { ring: 'İç 3', channel: 'Mühendislik olarak pazarlama + içerik: “ihracata hazırlık skoru”, “yakın tedarik maliyet karşılaştırma” aracı; çok dilli kategori rehberleri', test: 'Araçlar yayında, arama görünürlüğü başlar', metric: '≥ 200 kullanım, ≥ 20 nitelikli kayıt' },
      { ring: 'Kontrol', channel: 'Doğrudan alıcı geliştirme: seçili hücrede 30 uygun işletmeyle kişiselleştirilmiş temas', test: 'Ortak katkısını kıyaslamak ve müşterinin dilini öğrenmek için korunur', metric: 'Uygun talep başına süre taşınabilir' },
      { ring: 'Dış', channel: 'Fuarlar ve 2027 e-ihracat zirvesi, ticaret müşavirliği etkinlikleri, basın; küçük kategori etkinliği (10–15 işletmeyle gerçek satın alma dosyası)', test: 'Takvim; etkinlik yalnız geçit karşılandıysa', metric: 'Etkinlik sonrası uygun talep ve işlem' },
      { ring: 'Sonra', channel: 'Ücretli arama ve reklam', test: '60. gün geçidi sonrası; dar kategori, koridor bazlı', metric: 'Edinim maliyeti ve gerçek satın alma' },
    ],
    entryPoints: [
      { moment: 'Teslimat ve sezon', trigger: 'Uzak tedarik gecikti, sezon yaklaşıyor; tedarikçide boş kapasite', prep: '“Sezon öncesi yakın tedarik” bülteni' },
      { moment: 'Sipariş miktarı (MOQ)', trigger: 'Büyük parti alamıyor; küçük parti kabul eden tedarikçi', prep: 'Küçük parti filtresi ve mesajı' },
      { moment: 'Güven', trigger: 'Ödeme ve kalite korkusu; tahsilat korkusu', prep: 'Güvenli ödeme ve doğrulama anlatımı' },
      { moment: 'Stok, ilk alım, yenileme', trigger: '“Mevcut satıcıda stok yok”, “ilk kez alıyorum”, “yenileme öncesi karşılaştırmak istiyorum”', prep: 'Aynı marka, aynı talep yolu, aynı temel vaat' },
      { moment: 'Fuar ve seyahat', trigger: 'Türkiye ziyareti; fuar sonrası takip', prep: 'Fuar listesi dönüştürme' },
      { moment: 'Destek', trigger: 'E-ihracat desteği duyurusu', prep: '5986 bilgilendirme webinarı' },
      { moment: 'Kur', trigger: 'Fiyat avantajı', prep: 'Dönemsel kampanya' },
    ],
    assets: 'Ayırt edici varlıklar: turuncu kimlik, “yakın tedarik” ifadesi, “48 saatte 3 teklif” vaadi, doğrulama rozeti; her temas noktasında aynı. Fiziksel bulunurluk: çok dilli (EN/DE/AR/RU) kategori sayfaları, satıcı toplulukları, fuar; tedarikçi için ortak panelinden tek tıkla vitrin. Kısa vadede aktivasyon ortaklar ve concierge ile; marka (güven) kanıt vakaları, rozet ve tutarlı kimlikle; oran dayatılmaz, 6. ayda yeniden değerlendirilir.',
    kpis: [
      { metric: 'Eşleşme SLA', definition: '72 saatte ≥ 2 geçerli teklif alan talep / 72 saati dolmuş kabul edilmiş talep; hafta sonu etkisi ayrı, saat sonradan durdurulmaz', source: 'Ürün, masa', period: 'Haftalık', decision: 'Tohumlama, concierge kapasitesi', target: `≥ %60 (${shortDate(day30)}) → ≥ %70` },
      { metric: 'İlk geçerli teklife kadar süre', definition: 'Kabulden ilk geçerli teklife saat; ortanca ve %90 dilim, cevapsızların sayısıyla', source: 'Ürün', period: 'Haftalık', decision: 'Yönlendirme ve cevap standardı', target: '< 24 saat (ortanca)' },
      { metric: 'Aktif tedarikçi oranı ve satıcı aktivasyonu', definition: 'Son 30 günde geçerli teklif veren / listelenen; ilk talebinden 14 gün içinde teklif veren / aynı satıcı grubu', source: 'Ürün', period: 'Aylık', decision: 'Pasif vitrin temizliği, hatırlatma, ortak kalitesi', target: '≥ %40' },
      { metric: 'Gerçek sonucu olan benzersiz alıcı ve tekrar', definition: 'Son 30 günde teslimi teyitli alım yapan farklı işletme; doğal çevrim + 14 gün dolanlarda ikinci alım / olgun grup', source: 'Talep ve sipariş kayıtları', period: 'Aylık', decision: 'Kalıcı yarar, doğru kategori', target: '≥ 8 alıcı; tekrar ≥ %40' },
      { metric: 'Teyitli işlem ve GMV', definition: 'Teslimatı teyitli işlem sayısı; GMV ayrı (KDV ve nakliye hariç, iade ayrı); güvenli ödemeli işlem ayrı', source: 'Ödeme, operasyon', period: 'Haftalık', decision: 'Güven yığını', target: '≥ 10 işlem; ≥ 5 güvenli ödemeli' },
      { metric: 'Gerçekleşen ticaret oranı', definition: 'Beklenen teslim tarihi + 7 gün dolan taleplerden teslimatı teyitli olanlar / aynı grup; siparişe dönmeyen talep paydada kalır', source: 'Ürün', period: 'Aylık', decision: 'Fiyat, güven veya eşleşme engeli', target: `Ölçülür; eşik ${shortDate(day60)}’de konur` },
      { metric: 'Ortak kaynaklı pay ve ortak üretkenliği', definition: 'Ortak üzerinden gelen tedarikçi ve talep payı; 30 gündür eğitimli ortaklar içinde son 30 günde sonuç üretenler', source: 'PRM', period: 'Aylık', decision: 'Ortak yatırımı, devam kararı', target: 'Tedarikçi ≥ %70, talep ≥ %50; üretken ortak ≥ %50' },
      { metric: 'Anti-ağ etkisi', definition: 'İlk oturumda sonuç bulamayan yeni kullanıcı / yeni kullanıcı', source: 'Analitik', period: 'Haftalık', decision: 'Edinim akışını kısma; önce yoğunluk', target: '< %30' },
      { metric: 'Yenileme, katkı ve geri kazanım', definition: 'Yenileme tarihi geçmiş sözleşmelerden tahsil edilen / aynı grup; müşteri katkısı ve geri kazanım (doğrudan ve ortak kanalı ayrı)', source: 'Finans', period: 'Aylık', decision: 'Paket değeri, komisyon, kanal, bütçe', target: 'Pozitif katkı; geri kazanım ≤ 6 ay' },
      { metric: 'İşlem kalitesi ve yoğunlaşma', definition: 'Şikâyetli, iptal ve iadeli işlemler / teyitli işlem; ilk 3 alıcının talep ve ilk 3 satıcının işlem payı', source: 'Operasyon', period: 'Haftalık', decision: 'Tek işletmeye bağımlılık, hizmet riski', target: 'Tek alıcı sonucun çoğunu taşıyorsa kanıt sayılmaz' },
    ],
    funnel: {
      title: 'Talep hunisi (90 gün hipotezi)',
      note: '80 hedefli temas → 30 görüşme → 20 gerçek alıcıdan toplanan 50 talep. Dönüşümler tahmin değildir; kapasite ve darboğazı konuşmak içindir. 15 işlem ile 10 benzersiz alıcı ayrı sayılır.',
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
          'Kategori × koridor seçildi: puan ≥ 70; ≥ 5 gerçek yakın alım ihtiyacı; ≥ 6 cevap verebilir satıcı; 90 günde tekrar gözlenebilir çevrim',
          '25 görüşme (10 alıcı, 10 tedarikçi, 5 kurumsal ortak) kayıtlı; ilk 10 satın alma durumu listelendi',
          'Platform yetenekleri (ödeme, güvenli ödeme, lojistik, uyuşmazlık) çalışan bir işlemle doğrulandı; desteklenmeyen vaat satıştan çıktı',
          'Fiyat P ve ortak payı hesabı finansta; ihracatçı birliği üyeliği ve DYS başvuru takvimi',
          'İsimli iş birimi sahibi ve ticaret operasyon sorumlusu; 83 saat/hafta kapasite iki markayla birlikte doğrulandı',
        ],
        ifNot: 'İki haftalık daraltılmış araştırma; aynı anda üç pilot açılmaz.',
      },
      {
        day: 30,
        date: day30,
        title: 'Masa ve ortaklar',
        required: [
          'Concierge talep masası çalışıyor: ≥ 10 adet 72 saati dolmuş talep, ≥ %60’ı iki geçerli teklif',
          '≥ 3 teyitli işlem; kayıp ve alınmama nedenleri açıklanmış',
          '4 ortak görev kartı imzalı; 2 hizmet ortağı (ödeme, lojistik) ön anlaşması',
          '10–15 satıcının uygunluğu tamam; 20–30 alıcı erişim havuzu',
          'Güven yığını kararı: güvenli ödeme sağlayıcısı, lojistik protokolü, doğrulama standardı',
        ],
        ifNot: 'Ürün veya satıcı sorunu varsa edinimi büyütmeden düzelt; alıcı ihtiyacı yoksa kategori hipotezini yeniden değerlendir.',
      },
      {
        day: 60,
        date: day60,
        title: 'Pilot ticaret',
        required: [
          '≥ 20 olgun talep; ≥ %70 iki geçerli teklif; ilk teklif < 24 saat',
          '≥ 8 teyitli işlem; ≥ 5 farklı alıcı; ilk güvenli ödemeli işlemler',
          '100 doğrulanmış vitrin, aktif ≥ %40; 5 çapa tedarikçi + 3 çapa alıcı',
          '≥ 3 gerçek ücretli hizmet müşterisi veya belgelenmiş fiyat ve model düzeltmesi',
          'İlk partner hak edişi kayıtla hesaplandı; katkı ve edinim ayrı',
        ],
        ifNot: 'Katkı, hizmet ve tekrar kanıtı gelişiyorsa mevcut hücreyi sürdür; yalnız üyelik satılıyorsa pazaryeri ölçeklemesini açma.',
      },
      {
        day: 90,
        date: day90,
        title: 'Karar',
        required: [
          '≥ 30 olgun talep; ≥ %70 teklif karşılama',
          '≥ 10 teyitli işlem; ≥ 8 farklı alıcı; ≥ 5 güvenli ödemeli',
          'Olgun alıcıların ≥ %40’ı tekrar aldı; alıcı kulübü 50 üye, ≥ 20 aktif',
          'Pozitif müşteri katkısı; görünür geri kazanım (≤ 6 ay); anti-ağ etkisi < %30',
          'Tek büyük alıcı veya satıcı sonucun tamamını taşımıyor',
        ],
        ifNot: 'Bütün alanlar yeterliyse komşu hücre denemesi; eksik olgunlukta 30–45 gün aynı kapsamda uzatma; yapısal talep veya katkı sorunu varsa modeli daralt, sourcing hizmetine geç ya da durdur.',
      },
    ],
    phases: [
      {
        no: 1,
        ...w(1, 2),
        title: 'Keşif ve hücre',
        work: [
          'İç veri denetimi; 25 görüşme (10 alıcı, 10 tedarikçi, 5 kurumsal ortak); aday hücrelerin puanlanması',
          'Mevcut platform yeteneklerinin çalışan bir işlemle doğrulanması; desteklenmeyen vaat satış materyalinden çıkar',
          'İhracatçı birliği üyeliği ve DYS kaydı başlatma (5986 ön şartları); güvenli ödeme ve lojistik ortağı kısa listesi; fiyat P ve ortak payı hesabı',
        ],
        output: `Hücre kararı, görüşme kayıtları, ilk 10 satın alma durumu; 14. gün geçidi (${shortDate(day14)})`,
        owner: 'İş birimi yöneticisi',
        role: 'yonetici',
      },
      {
        no: 2,
        ...w(3, 4),
        title: 'Masa ve ortaklar',
        work: [
          'Concierge talep masası kurulumu: form, 24 saat nitelik kontrolü, 48–72 saat SLA, sourcing listesi; tedarikçi hazırlık listesi',
          'Ortak kiti ve üç tip tek sayfalık belge; 10 ortak görüşmesi → ilk 4 ortak görev kartı; güven yığını kararı (güvenli ödeme sağlayıcısı, lojistik protokolü, doğrulama standardı)',
          'İlk 5 kabul edilmiş gerçek talep; 10–15 satıcının uygunluğu; 20–30 alıcı erişim havuzu',
        ],
        output: `Masa çalışır; 2 hizmet ortağı ön anlaşması; 30. gün geçidi (${shortDate(day30)})`,
        owner: 'Kanal ve operasyon',
        role: 'ekip-lideri',
      },
      {
        no: 3,
        ...w(5, 8),
        title: 'Pilot ticaret',
        work: [
          'Arz ortaklarıyla onboarding günleri → 100 vitrin; ana şirket ajans ağından katalog aktarımı',
          'Talep ortakları ve topluluklar → 50 talep; elle eşleştirme ve kapatma; 5 çapa tedarikçi + 3 çapa alıcı; ilk güvenli ödemeli işlemler',
          'İlk partner hak edişi kayıtla; alıcı ve satıcı kayıp görüşmeleri; “ihracata hazırlık skoru” beta; ilk izinli vaka; en büyük teklif veya karar engelinin düzeltilmesi',
        ],
        output: `100 vitrin, 50 talep, ≥ 8 teyitli işlem; 60. gün geçidi (${shortDate(day60)})`,
        owner: 'Ticaret operasyonu + ortak başarı',
        role: 'saha-uzmani',
      },
      {
        no: 4,
        ...w(9, 12),
        title: 'Kulüp ve tekrar',
        work: [
          'Davetli alıcı kulübü açılışı (50 üye); haftalık bültenler; 1 ortakla ortak markalı çevrim içi etkinlik',
          'Üretici evangelizmi (komisyonsuz taşınma); başarılı ortak tipinde sınırlı ekleme (en çok 7); tekrar eden manuel işi tek küçük ürün düzeltmesiyle azaltma',
          'Küçük kategori etkinliği veya dar ücretli kanal deneyi (yalnız geçit karşılandıysa); olgun müşteri grupları, katkı ve yoğunlaşma analizi',
        ],
        output: 'SLA ≥ %70; ≥ 10 teyitli işlem; 50 kulüp üyesi; tekrar verisi',
        owner: 'Tüm ekip',
        role: 'dijital-pazarlama',
      },
      {
        no: 5,
        ...w(13),
        title: 'Karar',
        work: ['90 gün raporu; genişle (komşu hücre) / daralt (koridor) / pivot (sourcing hizmeti)', '4–6. ay kaynak planı; açık taleplerin devri; korunacak ve durdurulacak işler'],
        output: `Yazılı karar (${shortDate(day90)})`,
        owner: 'Yönetim sponsoru',
        role: 'yatirimci',
      },
    ],
    work: [
      { name: 'İç veri denetimi ve 25 görüşme', ...w(1, 2), role: 'yonetici', text: '10 alıcı, 10 tedarikçi, 5 kurumsal ortak; tek kayıt şablonu' },
      { name: 'Hücre puan kartı ve seçim', ...w(1, 2), role: 'yonetici', text: 'Beş aday; puan ≥ 70 + üç koşul', milestone: true },
      { name: 'Platform yetenek doğrulaması', ...w(1, 2), role: 'yazilim', text: 'Ödeme, güvenli ödeme, lojistik, uyuşmazlık: çalışan bir işlemle' },
      { name: 'E-ihracat desteği ön şartları', ...w(1, 6), role: 'yatirimci', text: 'İhracatçı birliği üyeliği, DYS kaydı; B2B platformu statüsü başvuru takvimi; destek bonus sayılır' },
      { name: 'Concierge masası kurulumu', ...w(3, 4), role: 'ekip-lideri', text: 'Form, nitelik kontrolü, SLA, sourcing listesi, karşılaştırma tablosu' },
      { name: 'Güven yığını', ...w(3, 6), role: 'yatirimci', text: 'Doğrulama standardı, güvenli ödeme sağlayıcısı, lojistik protokolü, numune ve uyuşmazlık süreci' },
      { name: 'Ortak seçimi ve görev kartları', ...w(3, 4), role: 'pazarlamaci', text: '10 görüşme → 4 ortak; 60 dk eğitim; örnek talep çalışması' },
      { name: 'Arz tohumlama → 100 vitrin', ...w(5, 8), role: 'saha-uzmani', text: 'Onboarding günleri; katalog aktarımı; hazırlık listesi' },
      { name: 'Talep toplama ve elle eşleştirme', ...w(5, 12), role: 'ekip-lideri', text: '50 talep; 72 saatte ≥ 2 geçerli teklif; kapanış kaydı' },
      { name: 'Çapa kullanıcılar', ...w(5, 8), role: 'saha-uzmani', text: '5 tedarikçi + 3 alıcı; beyaz eldiven; ilk güvenli ödemeli işlemler' },
      { name: 'Araçlar ve içerik', ...w(6, 11), role: 'dijital-pazarlama', text: 'İhracata hazırlık skoru, maliyet karşılaştırma, kategori rehberleri' },
      { name: 'İkinci ortak dalgası', ...w(9, 10), role: 'pazarlamaci', text: 'Başarılı tipte sınırlı ekleme; en çok 7 ortak' },
      { name: 'Davetli alıcı kulübü ve bültenler', ...w(9, 12), role: 'dijital-pazarlama', text: '50 üye, ≥ 20 aktif; haftalık talep özeti ve fırsat bülteni' },
      { name: '90. gün kararı', ...w(13), role: 'yatirimci', text: 'Genişle / daralt / pivot', milestone: true },
    ],
    rhythm: [
      'Her iş günü 15 dk: süresi yaklaşan talepler, cevapsız satıcılar, karar bekleyen alıcılar, açık teslimat sorunları (ticaret operasyon sorumlusu).',
      'Haftada bir 45 dk: bir başarı, bir kayıp, bir tekrarlanan engel; göstergeler adet ve oranla; en fazla üç düzeltme, sahibi ve tarihi yazılı.',
      'Ayda bir 60 dk likidite kurulu: net tahsilat, hizmet maliyeti, partner hak edişi, edinim maliyeti, olgun müşteri grupları.',
      'Haftada tek darboğaz: talep yoksa alıcı erişimi; talep var teklif yoksa satıcı kapsamı ve yanıt; teklif var karar yoksa fiyat, güven, şartlar; işlem var tekrar yoksa devam eden yarar.',
    ],
    quarters: [
      { quarter: '4. çeyrek 2026 – 1. çeyrek 2027', focus: 'Tek hücrede likidite; concierge; güven yığını; 4–7 ortak; 5986 statü başvurusu hazırlığı', target: 'SLA ≥ %70; ≥ 10 işlem; 100 tedarikçi; 50 talep' },
      { quarter: '2. çeyrek 2027', focus: 'Concierge sürecinin ürünleşmesi; ikinci koridor ya da komşu kategori (tek değişken); bölge temsilcisi pilotu; Pro üyelik testi', target: 'GMV ve aktif tedarikçi hedefi gerçek veriyle yazılır' },
      { quarter: '3. çeyrek 2027', focus: 'Fuar ve e-ihracat zirvesi dönüşümü; 5986 desteklerinin akışı; hizmet ortağı paketlerinin satışı; görev bazlı ortak yetkinlik belgesi', target: 'Ortaklar arası sonuç tekrarı, düşük uyuşmazlık' },
      { quarter: '4. çeyrek 2027', focus: '3 kategori × 2 koridor; marka yatırımı (vaka raporu); 2028 planı; sınırlı uluslararası hücre seçeneği', target: 'Her hücrenin gelir ve gideri ayrı; bir hücre diğerini sübvanse etmez' },
    ],
    risks: [
      { risk: 'Seçilen koridorda talep toplanamaz', probability: 'Orta', impact: 'Yüksek', response: '6. haftada koridor değiştir; concierge verisiyle karar' },
      { risk: 'Dolandırıcılık veya kalite olayı güveni zedeler', probability: 'Orta', impact: 'Yüksek', response: 'Doğrulama, güvenli ödeme, numune, uyuşmazlık süreci; ilk işlemler beyaz eldiven' },
      { risk: 'Kurumsal ortaklar yavaş', probability: 'Yüksek', impact: 'Orta', response: 'Özel dernekler ve ajans ağıyla başla; kamu ve birlik ikinci dalga' },
      { risk: '5986 statüsü ve destekler gecikir', probability: 'Orta', impact: 'Orta', response: 'Destek bonus sayılır; plan ona bağlı kurulmaz' },
      { risk: 'Global ve yerli pazaryerlerinin B2B hamleleri', probability: 'Orta', impact: 'Orta', response: 'Karşı konumlanma: concierge + yakınlık + güven derinliği' },
      { risk: 'Concierge ölçeklenmez', probability: 'Orta', impact: 'Orta', response: '3. ayda ürünleştirme; süreç verisi şablon olur; el emeğine bağımlılık sonraki yatırımı belirler' },
      { risk: 'E-ihracat beyanı, KDV ve fatura karmaşıklığı', probability: 'Orta', impact: 'Orta', response: 'Gümrük ve muhasebe hizmet ortağı; rehber içerik' },
    ],
    pivots: [
      'Eşleşme SLA < %40 ve tamamlanan işlem < 3 → koridoru veya kategoriyi değiştir; platform yatırımını dondur.',
      'Talep var, arz yanıt vermiyor (aktif tedarikçi < %25) → tohumlama ortağını değiştir; tedarikçi hazırlık eşiğini yükselt.',
      'Arz var, talep yok → “sourcing hizmeti” modeline geçiş: önce hizmet geliri, sonra platform.',
      'Her çeyrek sorulur: “Bunu bugün yapmıyor olsaydık, başlar mıydık?”',
    ],
    stop: [
      'İki araştırma çevriminde gerçek yakın dönem talep bulunamaması; uygun satıcı havuzuna rağmen teklif karşılaştırmasının işlem üretmemesi.',
      'Fiyat ve kapsam düzeltmesine rağmen doğrudan katkının sürekli negatif olması; gerçek hizmet kapsamıyla desteklenmeyen satış vaatleri; açık talepleri takip edecek kapasitenin kalmaması.',
      'Harcama kesilirse müşteriler sahipsiz bırakılmaz: açık talepler sonuçlandırılır veya neden durdurulduğu bildirilir; hak edilmiş ödemeler kapatılır.',
    ],
    capacity: [
      { role: 'Program ve kategori kararları', short: 'Program kararları', hours: 8, duty: 'İş birimi yöneticisi' },
      { role: 'Alıcı ihtiyacı, eşleştirme ve sonuç takibi', short: 'Eşleştirme ve takip', hours: 35, duty: 'Ticaret operasyon sorumlusu' },
      { role: 'Satıcı ve ortak saha geliştirme', short: 'Satıcı ve ortak sahası', hours: 20, duty: 'Kanal ve saha sorumlusu' },
      { role: 'İçerik, küçük etkinlik ve edinim denemeleri', short: 'İçerik ve edinim', hours: 10, duty: 'Pazarlama sorumlusu' },
      { role: 'Kayıt, ölçüm ve ürün akışı düzeltmeleri', short: 'Kayıt ve ölçüm', hours: 6, duty: 'Operasyon ve veri sorumlusu' },
      { role: 'Finans, sözleşme koordinasyonu ve hak ediş', short: 'Finans ve hak ediş', hours: 4, duty: 'Şirket içi finans ve operasyon' },
    ],
    capacityNote: '83 saat/hafta ≈ 2,1 tam zaman eşdeğeri; 13 hafta = 1.079 saat. Roller farklı kişilerde veya paylaşımlı olabilir; isimler ilk gün yazılır. 83 saat ayrılamıyorsa pilot işletme sayısı küçültülür; takip yükü mevcut ekibin üzerine görünmez biçimde eklenmez. Segika ile birlikte 135 saat/hafta tek çizelgede kontrol edilir; şirket ilk 14 günün kaynağını ayırır, sonraki dilimleri 14, 30 ve 60. gün kanıtlarıyla serbest bırakır.',
    dont: [
      'Likidite öncesi üyelik satışı; tüm kategorilerde lansman; soğuk kitleye reklam.',
      'İhtiyaç kanıtlanmadan kapsamlı ortak portalı, yeni entegrasyon programı veya büyük yazılım projesi.',
      'Sertifikalı bayi, otomatik bölge hakkı ve alt bayi ağı; imza sayısını başarı saymak.',
      'Platform dışı ticareti iStoc geliri saymak; GMV’den gelir türetmek; önceki siparişleri ağ katkısı saymak.',
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
    'Tek segment ya da tek hücre; 14/30/60/90. gün geçitleri; her geçitte yazılı devam, düzeltme veya durdurma kararı.',
    'Başarı imza değil sonuçtur: ödeyen ve kalan müşteri (Segika), teyitli ve tekrar eden ticaret (iStoc).',
    `Kapasite birlikte kontrol edilir: 52 + 83 = 135 saat/hafta, 13 haftada 1.755 saat (≈ 3,4 tam zaman eşdeğeri); mevcut hizmet işleri bu kapasitenin dışında korunur.`,
    'Aynı firma iki markayı kullanabilir; hedef, fırsat, izin ve tahsilat ayrı kayıtlanır; aynı gelir üzerinde ikinci ödeme yoktur; Segika listesi otomatik iStoc listesi olmaz.',
    'Her maliyet bir kez yazılır; korunan gelirin tamamı nedensel kazanç sayılmaz; gerçek ve tahmin ayrı gösterilir.',
  ];
  return { programs, byId: { segika, istoc }, shared, dates: { t0: firstDay, day14, day30, day60, day90, end: weekTo(13) }, weeks: 13 };
}

export type Partnership = ReturnType<typeof makePartnership>;
