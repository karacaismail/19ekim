/**
 * Karar defteri (docs/birlesik_plan.md B1 / adım 1a; docs/contents.md F02/F03/F16, ct-IA-05/34; docs/missings.md MS-13;
 * kullanıcı kararı 2026-10-28). Tek kayıt türü: soru → seçenekler / öneri → etki → karar veren → son tarih → sonuç →
 * karar tarihi → yürürlük tarihi → ilgili politika / sayfalar. Kayıttaki durum yalnız `bekliyor` ya da `verildi`dir;
 * “gecikti” (son tarihi geçen bekleyen) ve “yürürlükte” (yürürlük tarihi gelen verilmiş karar) bugünün tarihinden
 * türetilir (`kararDurumu`). Gerçek karar girilmediyse “verildi” üretilmez; yanıtsız soru onay sayılmaz (K1).
 *
 * Kaynaklar: 19 Ekim 2026 tahta kararları (`program.ts` → `decisions`, `openDecisions`) ve 28 Ekim sahip cevapları
 * (birleşik plan §4.1). Tutar yazılmaz (gizlilik): Mogem gelirleri ve kişi adları kayıtlarda yoktur.
 */
import type { Params } from './params';
import type { Program } from './program';
import type { RoleKey } from './types';

export type KararDurum = 'bekliyor' | 'verildi';
export type KararGorunum = 'bekliyor' | 'gecikti' | 'verildi' | 'yururlukte';

export interface KararKaydi {
  /** Kalıcı kimlik (bağlantı ve test için). */
  id: string;
  /** Karar sorusu. */
  soru: string;
  /** Seçenekler (bekleyen kararda). */
  secenekler?: string[];
  /** Hazırlanan öneri (bekleyen kararda). */
  oneri?: string;
  /** Hangi hesap / sayfa etkilenir. */
  etki: string;
  /** Karar veren: yalnız İsmail Karaca (`yonetici`) ya da yatırımcı. */
  sahip: RoleKey;
  hazirlayan?: RoleKey;
  /** ISO gün; yoksa son tarih belirlenmedi. */
  sonTarih?: string;
  durum: KararDurum;
  /** Verilen karar (yalnız `verildi`). */
  sonuc?: string;
  /** ISO gün (yalnız `verildi`). */
  kararTarihi?: string;
  /** Kararın uygulamada yürürlüğe girdiği gün; yoksa uygulama bekliyor. */
  yururlukTarihi?: string;
  /** İlgili politika sürümü (örn. komisyon politikası). */
  politika?: string;
  /** Verilen karardan sonra hâlâ açık alt sorular. */
  acik?: string[];
  kaynak: string;
  /** İlgili sayfa yolları (site köküne göre). */
  ilgili: string[];
}

/** Görünen durum: son tarihi geçen bekleyen “gecikti”; yürürlük tarihi gelen verilmiş karar “yürürlükte”. */
export function kararDurumu(k: KararKaydi, bugun: string): KararGorunum {
  if (k.durum === 'verildi') return k.yururlukTarihi && bugun >= k.yururlukTarihi ? 'yururlukte' : 'verildi';
  return k.sonTarih && bugun > k.sonTarih ? 'gecikti' : 'bekliyor';
}

export const KARAR_DURUM_ADI: Record<KararGorunum, string> = { bekliyor: 'Bekliyor', gecikti: 'Gecikti', verildi: 'Verildi', yururlukte: 'Yürürlükte' };

const TR_MAP: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', İ: 'i' };
const slug = (s: string) =>
  s
    .replace(/[çğıöşüİ]/g, (c) => TR_MAP[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** 19 Ekim kararlarının kimliği, yürürlük günü, etkisi ve ilgili sayfaları (konu başlığına göre; eşleşmeyen konu genel kalır). */
function tahtaKarari(prog: Program, topic: string): Pick<KararKaydi, 'id' | 'yururlukTarihi' | 'etki' | 'ilgili'> {
  const { dates } = prog;
  if (topic.startsWith('Ücret, prim')) return { id: 'ucret-prim-kota', yururlukTarihi: dates.start, etki: 'Rol sayfalarının ücret özeti, plan kadrosu maliyeti (Gelir planı ve Nakit akışı) ve Giderler sayfasındaki plan kadrosu', ilgili: ['/roller/saha-uzmani/', '/gelir-plani/'] };
  if (topic.startsWith('Diğer rollerin maaşları')) return { id: 'diger-maaslar', yururlukTarihi: dates.start, etki: 'Rol sayfaları, plan kadrosu maliyeti ve Applet örnek değerleri', ilgili: ['/roller/dijital-pazarlama/', '/applet/'] };
  if (topic.startsWith('CRM aracı')) return { id: 'crm-asamalari', yururlukTarihi: dates.start, etki: 'CRM aşamaları, prim kriterleri ve masa başı ile saha rollerinin görevleri', ilgili: ['/roller/pazarlamaci/'] };
  if (topic.startsWith('Kazanç planı')) return { id: 'mlm-kazanc', yururlukTarihi: dates.dec, etki: 'Temsilci ağının kazanç kuralı ve satış primi (Nakit akışı plan kalemi)', ilgili: ['/buyume-modeli/', '/nakit-akisi/'] };
  if (topic.startsWith('Ekip lideri primi')) return { id: 'ekip-lideri-primi', yururlukTarihi: dates.dec, etki: 'Ekip lideri ücreti ve pay kuralı', ilgili: ['/roller/ekip-lideri/'] };
  if (topic.startsWith('Kapasite açığı')) return { id: 'kapasite-acigi', yururlukTarihi: dates.dec, etki: 'Aralık saha takviyesi, istihdam takvimi ve kadro maliyeti', ilgili: ['/istihdam/', '/hedefler/'] };
  if (topic.startsWith('Programın ilk 3 ayında ve sonrasında mesai')) return { id: 'mesai-modeli', yururlukTarihi: dates.firstDay, etki: 'Mesai dönemleri, yasal tavan ve rollerin günlük düzeni', ilgili: ['/roller/saha-uzmani/'] };
  if (topic.includes('Segika')) return { id: 'segika-plani', yururlukTarihi: dates.start, etki: 'Segika masa başı rolü (iStoc CRM rolünün kopyası) ve kadro', ilgili: ['/roller/segika/', '/satis-ortakligi/'] };
  return { id: slug(topic), yururlukTarihi: undefined, etki: 'Plan sayfaları', ilgili: ['/karar/'] };
}

function acikTahtaKarari(topic: string): Pick<KararKaydi, 'etki' | 'ilgili'> {
  if (topic.startsWith('Asistan')) return { etki: 'Bu karar kadroyu ve işveren maliyetini etkiler. Asistan alınmazsa dijital pazarlamanın başlangıcı kayar.', ilgili: ['/roller/asistan/', '/istihdam/', '/roller/dijital-pazarlama/'] };
  if (topic.includes('RFQ')) return { etki: 'Bu karar B kanalını, ilk ücretli reklamı ve dijital pazarlama planını etkiler.', ilgili: ['/roller/dijital-pazarlama/', '/gelir-plani/'] };
  return { etki: 'Plan sayfaları', ilgili: ['/karar/'] };
}

export function makeKararlar(_p: Params, prog: Program) {
  const tahta: KararKaydi[] = prog.decisions.map((d) => {
    const e = tahtaKarari(prog, d.topic);
    return { id: e.id, soru: d.topic, etki: e.etki, sahip: 'yonetici', durum: 'verildi', sonuc: d.decision, kararTarihi: '2026-10-19', yururlukTarihi: e.yururlukTarihi, kaynak: '19 Ekim 2026 tahta kararları', ilgili: e.ilgili };
  });
  const acik: KararKaydi[] = prog.openDecisions.map((d) => {
    const e = acikTahtaKarari(d.topic);
    return { id: slug(d.topic), soru: d.topic, oneri: d.proposal, etki: e.etki, sahip: d.owner, hazirlayan: d.preparer, sonTarih: d.deadline, durum: 'bekliyor', kaynak: '19 Ekim 2026 tahtası (açık soru)', ilgili: e.ilgili };
  });
  const yirmiSekizEkim: KararKaydi[] = [
    {
      id: 'is-modeli',
      soru: 'iStoc nasıl para kazanacak: satıcı aboneliği mi, işlem gelirine dayalı likidite pilotu mu?',
      secenekler: [
        'Abonelik esas alınır, likidite yaklaşımı seçenek olarak görünür kalır.',
        'Likidite pilotu esas alınır, abonelik hesabı koşullu tahmin olarak kalır. Likidite için henüz hesap modeli yok.',
        'İkisi birlikte yürütülür, kapsam ve geçiş koşulu yazılı olarak belirlenir.',
      ],
      etki: 'Bu karar şu sayfaları etkiler: “Gelir planı”, “Nakit akışı”, “Satış ortaklığı” ve “Genel bakış”. Gelir ve nakit hesabı bugün koşullu abonelik modeliyle yapılır.',
      sahip: 'yonetici',
      durum: 'bekliyor',
      kaynak: 'docs/contents.md F02; birleşik plan K1 (28 Ekim: cevap bekleniyor, cevap gelmemesi onay sayılmaz)',
      ilgili: ['/gelir-plani/', '/satis-ortakligi/', '/nakit-akisi/'],
    },
    {
      id: 'segika-komisyon',
      soru: 'Segika satış ortağına komisyon oranı ne olacak?',
      etki: 'İş ortaklığı politika metni, Affilate başlangıç değerleri ve politika sürümü seçimi',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Segika satış ortağı aylık abonelik satışında %10 komisyon alır. Yıllık abonelik satışında %15 komisyon alır. Sahip bu oranları 28 Ekim’de belirledi. Oranlar sonradan değiştirilebilir. Önceki metinlerde iki taslak örnek vardı. Bunlar “ilk 6 ay %15” ve “12 ay %15, ardından 12 ay %10” oranlarıydı.',
      kararTarihi: '2026-10-28',
      politika: 'Bu kural, 28 Ekim 2026 tarihli Segika komisyon politikasıdır. Politikanın bu sürümü taslaktır ve uygulanmayı bekliyor.',
      acik: ['Komisyon her ödemede mi ödenir, yoksa yalnız ilk yıl mı?', 'Komisyon net tahsilattan mı hesaplanır?', 'Oran bütün ortak türleri için aynı mı?'],
      kaynak: 'docs/contents.md F03; birleşik plan K2 (sahip cevabı 28 Ekim)',
      ilgili: ['/satis-ortakligi/'],
    },
    {
      id: 'gider-kapsami',
      soru: 'Sheets’teki gider planı hangi şirkete ait? Giderler markalara nasıl dağıtılacak?',
      etki: 'Giderler ve Nakit akışı kapsamı ile şirket bazında gelir, gider ve nakit görünümü (adım 3)',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Türksab bir şirketler grubudur. Mogem (Segika ve SGK projesi) ile iStoc Company (iStoc ve Toptan) ayrı şirketlerdir. Her şirketin kendi geliri ve gideri vardır, grup toplamı Türksab’da görünür. Mogem’in geliri Türksab’a aktarılır. Türksab, iStoc’a yatırım yapar ve Mogem’in giderini öder (sahip, 28 Ekim). Tutarlar Sheets dosyasında tutulur.',
      kararTarihi: '2026-10-28',
      acik: ['Toptan projesi nasıl tanımlanacak?', 'Mogem giderleri hangi Sheets kalemleridir (Şirket sütunu)?', 'Mogem gelirlerinin “Gelirler” sayfasında nasıl gösterileceğine henüz karar verilmedi.'],
      kaynak: 'docs/contents.md F16; birleşik plan K3 (sahip cevabı 28 Ekim)',
      ilgili: ['/giderler/', '/nakit-akisi/'],
    },
    {
      id: 'senaryo-aktarimi',
      soru: 'Gelir planı seçenekleri Nakit akışı’na taşınsın mı?',
      etki: 'Nakit akışı girişleri, prim, eklenen saha personeli, ek sabit gider ve senaryo adı',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Evet. Hesap seçenekleri aynen taşınır, yalnız gider kaynağı seçeneği taşınmaz. Eklenen saha personelinin maaşı nakit çıkışlarında yer alır.',
      kararTarihi: '2026-10-28',
      yururlukTarihi: '2026-10-28',
      kaynak: 'docs/contents.md F04; Codex MS-01/02; birleşik plan K13',
      ilgili: ['/gelir-plani/', '/nakit-akisi/'],
    },
    {
      id: 'hedef-adi',
      soru: 'Menü adı ile sayfa başlığı aynı olsun mu?',
      etki: 'Hedefler sayfası ve menü. Aynı kural diğer sayfalara da uygulanır.',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Menüde ve başlıkta “SMART hedefler” adı kullanılır. SMART (belirli, ölçülebilir, ulaşılabilir, ilgili ve süreli) hedefin İngilizce kısaltmasıdır. Kural bütün sayfalara uygulanır.',
      kararTarihi: '2026-10-28',
      acik: ['Kural Kararlar, Temsilci ağı ve “Varsayımlar ve ayarlar” sayfalarında da geçerli mi?'],
      kaynak: 'birleşik plan K4 (sahip cevabı 28 Ekim)',
      ilgili: ['/hedefler/'],
    },
    {
      id: 'kirinti-derinligi',
      soru: 'Telefonda, sayfanın üstündeki sayfa yolu kısaltılsın mı?',
      etki: 'Sayfa başlığı satırı (320×480 ilk ekran)',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Sahip, ölçüp karar vermeyi yazara bıraktı. Dar ekranda menü grubunun adı gizlenir. Üst sayfanın bağlantısı ve sayfa başlığı görünür kalır. Geniş ekranda sayfa yolu tam görünür.',
      kararTarihi: '2026-10-28',
      yururlukTarihi: '2026-10-28',
      kaynak: 'birleşik plan K5 (“test et, karar ver”)',
      ilgili: ['/roller/ekip-lideri/'],
    },
    {
      id: 'eposta-sayfasi',
      soru: 'E-posta sayfası sitede kalsın mı?',
      etki: 'Yayın kapsamı ve menü',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Sayfa kalır. Menüde yer almaz, yalnız adresi bilen açabilir. Arama motorlarını engelleyen noindex etiketi gizlilik sağlamaz, çünkü sayfa herkese açık sitededir.',
      kararTarihi: '2026-10-28',
      yururlukTarihi: '2026-10-28',
      kaynak: 'docs/contents.md F12; birleşik plan K10',
      // Gizli sayfaya bağlantı verilmez (kullanıcı tercihi: sayfa yalnız adresle açılır).
      ilgili: [],
    },
    {
      id: 'gelir-terimleri',
      soru: '“Gelir” hangi aşamayı anlatıyor?',
      etki: 'Metrik sözlüğü ile Gelir planı, Nakit akışı ve Hedefler etiketleri',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Segika SaaS (abonelikle sunulan yazılım) satışı ile iStoc paket satışı iki ayrı akıştır. Her akışta aşamalar sırasıyla faturalanan gelir, tahsilat ve kasa olarak adlandırılır.',
      kararTarihi: '2026-10-28',
      kaynak: 'docs/ifade.md; birleşik plan K11 (sahip cevabı 28 Ekim)',
      ilgili: ['/gelir-plani/', '/nakit-akisi/', '/hedefler/'],
    },
    {
      id: 'insan-testi',
      soru: 'Siteyi kim, ne zaman deneyecek?',
      etki: 'Kapanış kanıtı (ilk deneme)',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: '19ekim sitesini kapanışta sahip dener ve altı görevi tamamlar. istoc.com sitesinin testi yazılım ekibinin işidir.',
      kararTarihi: '2026-10-28',
      kaynak: 'birleşik plan K12',
      ilgili: [],
    },
  ];
  /** Sahibin 3 Kasım 2026’da verdiği kararlar (satış ortaklığı, istihdam ve yayın düzeni). */
  const ucKasim: KararKaydi[] = [
    {
      id: 'ortaklik-ana-kaynak',
      soru: 'Ortaklık programlarının ana kaynağı hangi sayfa olacak?',
      etki: 'Pazarlama menüsü ve bütün ortaklık hesapları',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Satış ortaklığı sayfası ana kaynaktır. Değişmez ama geliştirilebilir. “Temsilci ağı”, “İş ortaklığı” ve “Affilate” sayfalarındaki ortak türleri bu sayfaya taşındı. Her ortak türü burada kendi kurallarıyla seçilir. İş ortaklığı ve Affilate sayfaları kaldırıldı.',
      kararTarihi: '2026-11-03',
      yururlukTarihi: '2026-11-03',
      kaynak: 'Sahibin 3 Kasım 2026 talimatı',
      ilgili: ['/satis-ortakligi/'],
    },
    {
      id: 'ortak-odeme-modeli',
      soru: 'Ortağa ödeme nasıl hesaplanacak?',
      etki: 'Satış ortaklığındaki bütün rol kazançları',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'İki model de seçilebilir. Birinci modelde oran ortağın işine göre değişir. Ortak yalnız iki tarafı tanıştırırsa %8 alır. Ürünü müşteriye tanıtırsa (demo) %12 alır. Satışı kendisi tamamlarsa %18 alır. İkinci modelde ortağa her satış için 2.500 ₺ ödenir.',
      kararTarihi: '2026-11-03',
      yururlukTarihi: '2026-11-03',
      kaynak: 'Sahibin 3 Kasım 2026 cevabı',
      ilgili: ['/satis-ortakligi/'],
    },
    {
      id: 'istoc-yillik-paket',
      soru: 'iStoc yıllık paketi kaç aylık ücrete denk gelir?',
      etki: 'iStoc yıllık paket fiyatı ve bütün iStoc komisyonları',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'iStoc yıllık paketi 10 aylık ücrettir.',
      kararTarihi: '2026-11-03',
      yururlukTarihi: '2026-11-03',
      kaynak: 'Sahibin 3 Kasım 2026 cevabı',
      ilgili: ['/satis-ortakligi/'],
    },
    {
      id: 'tavsiye-odulu',
      soru: 'Mevcut müşterinin tavsiye ödülü nedir?',
      etki: 'Arkadaşını getir rolü',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Ödül para olarak verilmez. Ödül ücretsiz kullanım süresidir. Müşteriyi tavsiye eden kişi 2 ay ücretsiz kullanır. Yeni müşteri 1 ay ücretsiz kullanır. Bu süreler sonradan değiştirilebilir.',
      kararTarihi: '2026-11-03',
      yururlukTarihi: '2026-11-03',
      kaynak: 'Sahibin 3 Kasım 2026 cevabı',
      ilgili: ['/satis-ortakligi/'],
    },
    {
      id: 'musavir-modeli',
      soru: 'Mali müşavire ne verilecek?',
      etki: 'Profesyonel çözüm ortağı rolündeki mali müşavir kuralı',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Komisyon ya da müşterisine indirim seçilebilir. Oranlar ve seviyeler sayfada değiştirilebilir.',
      kararTarihi: '2026-11-03',
      yururlukTarihi: '2026-11-03',
      kaynak: 'Sahibin 3 Kasım 2026 cevabı',
      ilgili: ['/satis-ortakligi/'],
    },
    {
      id: 'segika-cozum-ortagi',
      soru: 'Segika profesyonel çözüm ortağı hangi koşulla çalışır?',
      etki: 'Segika çözüm ortağı kazancı ve eğitim bedeli',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Ortak %25 alır ve müşteri desteğini kendisi verir. CRM yazılımını biz sağlarız. Yılda 8 saat program eğitimi ücretsizdir. Fazlası saat başına ücretlidir.',
      kararTarihi: '2026-11-03',
      yururlukTarihi: '2026-11-03',
      kaynak: 'Sahibin 3 Kasım 2026 talimatı (yalnız Segika)',
      ilgili: ['/satis-ortakligi/'],
    },
    {
      id: 'segika-kadrolu',
      soru: 'Segika kadrolu satış uzmanı hangi koşulla çalışır?',
      etki: 'Segika kadrolu satış uzmanı primi',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'SGK’lı çalışandır ve kotayı aşınca %10 prim alır. Müşteri desteğini şirketin destek uzmanı verir, CRM yazılımını biz sağlarız.',
      kararTarihi: '2026-11-03',
      yururlukTarihi: '2026-11-03',
      kaynak: 'Sahibin 3 Kasım 2026 talimatı (yalnız Segika)',
      ilgili: ['/satis-ortakligi/'],
    },
    {
      id: 'temsilci-agi-kademe',
      soru: 'Temsilci ağında üst kademeler alt kademelerin satışından pay alacak mı?',
      etki: 'Temsilci ağı koşul seti ve ağ diyagramı',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Evet. Satışı yapan kişinin üstündeki kişiler de pay alır. Satışı yapana uzak olan kişi daha az pay alır. Şu an en çok 2 kademe yukarıya pay gider. Kademe sayısı ve paylar sayfada değiştirilebilir. Kazanç yalnız gerçek satıştan doğar.',
      kararTarihi: '2026-11-03',
      acik: ['Kademe sayısı kaç olacak? Bu sayı sözleşme imzalanmadan önce avukatla kesinleşmeli.'],
      kaynak: 'Sahibin 3 Kasım 2026 talimatı (Ahmet, Mehmet, Ayşe, Fatma örneği)',
      ilgili: ['/satis-ortakligi/'],
    },
    {
      id: 'istihdam-plani-3-kasim',
      soru: 'İstihdam takvimi hangi planla güncellenecek?',
      etki: 'İstihdam takvimi ve Kadro kapasitesi',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'İstihdam takvimi iki belgeye göre güncellendi. Birincisi 3 Kasım 2026 tarihli Kadro Kapasite Planıdır. İkincisi fark analizi (GAP) eylem planıdır. Bu plan eksikleri ve yapılacak işleri gösterir. Roller, kapasite ve kararlar “Kadro kapasitesi” sayfasında ayrı gösterilir.',
      kararTarihi: '2026-11-03',
      yururlukTarihi: '2026-11-03',
      acik: ['Sitenin ortak başlangıç tarihi henüz 1 Kasım. 23 Kasım’a çekilip çekilmeyeceği karar seçimlerinde soruldu.'],
      kaynak: 'Sahibin 3 Kasım 2026 talimatı',
      ilgili: ['/istihdam/', '/kadro-kapasitesi/'],
    },
    {
      id: 'yalin-turkce',
      soru: 'Site metinleri hangi yazım kuralıyla yazılacak?',
      etki: 'Bütün sayfaların metinleri',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Bütün metinler yalın Türkçe kuralıyla yazılır: tam cümle, günlük kelime ve açık özne. Sayılar ve koşullar korunur.',
      kararTarihi: '2026-11-03',
      yururlukTarihi: '2026-11-03',
      kaynak: 'Sahibin 3 Kasım 2026 kalıcı yazım talimatı',
      ilgili: [],
    },
    {
      id: 'testsiz-yayin',
      soru: 'Acil durumda yayın testleri bekleyecek mi?',
      etki: 'GitHub Pages yayın akışı',
      sahip: 'yonetici',
      durum: 'verildi',
      sonuc: 'Acil durumda site testler beklenmeden yayınlanır. Bütün testler hemen sonra çalıştırılır. Bir sorun çıkarsa site yeniden yayınlanır. Normal yayında testler yayından önce çalıştırılır.',
      kararTarihi: '2026-11-03',
      yururlukTarihi: '2026-11-03',
      kaynak: 'Sahibin 3 Kasım 2026 talimatı',
      ilgili: [],
    },
  ];
  const kayitlar = [...acik, ...yirmiSekizEkim.filter((k) => k.durum === 'bekliyor'), ...ucKasim, ...tahta, ...yirmiSekizEkim.filter((k) => k.durum === 'verildi')];
  /** Bugüne göre sayılar: bekleyen (gecikenler dahil), gecikmiş, verilen (yürürlüktekiler dahil), yürürlükte. */
  const ozet = (bugun: string) => {
    const g = kayitlar.map((k) => kararDurumu(k, bugun));
    return {
      bekleyen: g.filter((x) => x === 'bekliyor' || x === 'gecikti').length,
      gecikmis: g.filter((x) => x === 'gecikti').length,
      verilen: g.filter((x) => x === 'verildi' || x === 'yururlukte').length,
      yururlukte: g.filter((x) => x === 'yururlukte').length,
    };
  };
  return { kayitlar, ozet };
}

export type Kararlar = ReturnType<typeof makeKararlar>;
