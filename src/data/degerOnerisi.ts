/**
 * Değer önerisi (kullanıcı kararı 2026-11-03): saha ekibinin esnafa söyleyeceği sözler ve her sözü tutmak için
 * platformun yapması gerekenler. Kaynak: kullanıcının paylaştığı araştırma raporu (bölüm 1, 5 ve 6). Sözler tek hitapla
 * (“siz”) yazıldı; açıklamalar tam cümledir. Persona kodları (P1–P7) raporun 3. bölümündeki esnaf tipleridir.
 *
 * Kullanıcı kararları 13 Kasım 2026 (karar listesi 5.1, 5.2 ve 9.7): satıcı Basic paket için aylık ücret öder. Kurulum
 * ücretlidir, bir kez 150 €. Satıştan komisyon alınmaz. Bu üç olguyla çelişen söz yazılmaz (`tests/deger-onerisi.spec.ts`).
 */
import { CANLI_DENEME_GUN, CANLI_PAKETLER } from './canliPaketler';
import { ILK_FIYAT_EUR, eur } from './gelirModelleri';

const BASIC_PAKET = CANLI_PAKETLER.find((p) => p.id === 'basic')!;
const BASIC_AYLIK = eur(BASIC_PAKET.aylikEur ?? 0);
const KURULUM = eur(ILK_FIYAT_EUR.kurulum);

export interface GucluSoz {
  baslik: string;
  soz: string;
  gucluTarafi: string;
}

export type IlkGun = 'evet' | 'ortakla' | 'kismen';

export interface Oneri {
  no: number;
  soz: string;
  persona: string[];
  sikinti: string;
  platform: string;
  ilkGun: IlkGun;
  risk: string;
  dayanak: string;
}

export interface Kategori {
  id: string;
  harf: string;
  ad: string;
  giris?: string;
  oneriler: Oneri[];
}

export const ILK_GUN_ADI: Record<IlkGun, string> = {
  evet: 'İlk günden verilir',
  ortakla: 'Bir ortakla verilir',
  kismen: 'Kısmen verilir',
};

export const GUCLU_SOZLER: GucluSoz[] = [
  {
    baslik: 'Gerçek alıcılardan hazır sipariş fırsatları',
    soz: 'Ürünlerinizi satın almak isteyen işletmelerin taleplerini size ulaştıralım. Fiyatı siz verin, müşteriyi siz kazanın.',
    gucluTarafi: 'Ürün listelemesi veya reklam gösterimi değil, somut ticari fırsat sunar.',
  },
  {
    baslik: 'Sizin için çalışan dış satış ekibi',
    soz: 'Siz dükkânınızla ilgilenin. Biz Türkiye’de yeni müşteriler arayalım, satın alma taleplerini toplayalım ve size getirelim.',
    gucluTarafi: 'Esnaf bir platform aboneliği değil, ek bir satış personeli edinmiş gibi hisseder.',
  },
  {
    baslik: 'Satılmayan stoklarınızı nakde çevirin',
    soz: 'Deponuzda bekleyen ürünleri, bunları toplu satın alabilecek işletmelere özel fiyatlarla sunalım.',
    gucluTarafi: 'Bu söz, satılmadan depoda bekleyen mala yöneliktir. Alıcı çıkarsa esnafın eline hemen para geçer.',
  },
  {
    baslik: 'Ödemenizi güvence altına alın',
    soz: 'Yeni müşteriye mal satarken paranızı alamama riskinizi azaltalım. Güvenli ödeme ve doğrulanmış alıcılarla çalışın.',
    gucluTarafi: 'Tahsilat riskini azaltmak, yalnız daha fazla müşteri bulmaktan daha değerli olabilir. Bu güvence için ödeme altyapısı ve sözleşme gerekir.',
  },

  {
    baslik: 'Türkiye genelinde yeni bayiler kazanın',
    soz: 'İstanbul dışında size düzenli sipariş verebilecek nalbur, kırtasiye, market ve perakendecilere ulaşalım.',
    gucluTarafi: 'Tek seferlik satış yerine tekrar eden bir müşteri ilişkisi kurar.',
  },
  {
    baslik: 'Büyük kurumsal satın alma taleplerine erişin',
    soz: 'Kurumların toplu alım ihtiyaçlarına teklif verin. Oteller, restoran zincirleri, fabrikalar, okullar ve şirketler bu kurumlardandır.',
    gucluTarafi: 'Esnafı tek başına ulaşamadığı, yüksek hacimli kurumsal müşterilerle buluşturur.',
  },
  {
    baslik: 'Ürünlerinizi biz dijital satışa hazırlayalım',
    soz: 'Personel ayırmayın. Ürün listenizi bize verin. Fotoğraf, açıklama, kategori ve toptan fiyat düzenini biz hazırlayalım.',
    gucluTarafi: 'Dijital ticarete girmek isteyen ama teknik personeli olmayan esnafın ilk engelini kaldırır.',
  },
  {
    baslik: 'Herkese açık fiyat, müşteri grubuna özel fiyat',
    soz: 'Standart fiyatınızı ve adede göre değişen fiyatınızı herkes görsün. Kendi müşterileriniz ve gruplarınız yalnız kendi özel fiyatını görsün.',
    gucluTarafi: 'Alıcı fiyatı görünce karar verir, bu yüzden platform alıcı kaybetmez. Satıcı da bayilerini ve sadık müşterilerini özel fiyatla korur.',
  },
  {
    baslik: 'Satış sonucu alamazsanız üyelik bedelini iade edelim',
    soz: 'Belirlediğimiz süre ve koşullar içinde ölçülebilir sonuç üretemezsek hizmet bedelinizi iade edelim.',
    gucluTarafi: 'Başlangıç riskini satıcıdan alır. Açık bir sözleşme, ölçüt ve bütçe olmadan bu söz verilmemelidir.',
  },
];

export const ORTAK_NOKTA = 'Esnafı yazılım satın almaya değil, ticari sonuç elde etmeye davet ediyoruz.';

export const KATEGORILER: Kategori[] = [
  {
    id: 'para',
    harf: 'A',
    ad: 'Para ve tahsilat',
    giris: 'Bu sözler iki soruna cevap verir: karşılıksız çek ve elde para kalmaması. P1 ve P5 tipindeki esnafla ilk görüşmede en etkili sözler bunlardır.',
    oneriler: [
      {
        no: 1,
        soz: 'Platformdan gelen siparişin parası garanti. Alıcı parayı öder. Para, mal teslim edilene kadar güvenli bir hesapta bekler. Teslimden sonra en geç 5 iş günü içinde para hesabınıza geçer.',
        persona: ['P1', 'P5', 'P6'],
        sikinti: 'Karşılıksız çek ve tahsil edilemeyen alacak',
        platform: 'Lisanslı bir ödeme kuruluşuyla güvenli havuz ödeme (escrow) kurmalı. Güvenli ödeme alıcıyı da platforma çeker.',
        ilkGun: 'ortakla',
        risk: 'Düşük ile orta. Ödeme kuruluşu komisyon alır. Elektronik ticaret kanunu (ETK) pazar yerine bir ödeme süresi koyar. Bu kural kanunun Ek 1. maddesinin 2. fıkrasının (a) bendindedir. Pazar yeri satış bedelini 5 iş günü içinde satıcıya öder. Süre, sipariş alıcıya ulaştıktan sonra başlar.',
        dayanak: 'Alibaba Trade Assurance, Faire, ETK Ek 1',
      },
      {
        no: 2,
        soz: 'Alıcınız vadeli ödese bile siz paranızı peşin alırsınız. Vadenin riskini biz değil, anlaşmalı finans kuruluşu üstlenir.',
        persona: ['P1', 'P3', 'P4'],
        sikinti: 'Vadeli satışta nakit sıkışması',
        platform: 'Banka, finansman ya da fatura karşılığı finansman (faktoring) şirketiyle ortaklık kurmalı. Bu ortaklıkla işletmeler “şimdi al, sonra öde” (BNPL) imkânı bulur. Vade imkânı alıcıyı çeker, alıcı da satıcıyı çeker.',
        ilkGun: 'ortakla',
        risk: 'Orta. Finans kuruluşu bu hizmet için bir ücret keser. Bu ücreti satıcı ya da alıcı öder. Türkiye’de bu hizmeti yalnız bankalar ve finansman şirketleri sunabilir. istoc.com vadeyi kendi parasıyla vermemeli.',
        dayanak: 'Faire Net 60, Ankorstore, Kredim Business',
      },
      {
        no: 3,
        soz: 'Müşterilerinize kestiğiniz vadeli faturayı isterseniz birkaç günde nakde çevirin.',
        persona: ['P1', 'P3', 'P4'],
        sikinti: 'Mevcut alacakların uzun vadesi',
        platform: 'Figopara gibi fatura finansmanı platformlarına yazılım bağlantısı kurmalı. Platformda alıcı olmasa da bu hizmet işe yarar.',
        ilkGun: 'ortakla',
        risk: 'Düşük. Riski finansman ortağı taşır.',
        dayanak: 'Figopara genel müdürü (CEO) Koray Bahar’a göre platform aylık 2,5 milyar ₺ işlem hacmi yönetiyor. İştiraki Figofinans’ın müşterileri arasında toptan ticaret önde geliyor.',
      },
      {
        no: 4,
        soz: 'Yeni bir alıcıya mal vermeden önce ödeme geçmişine bir bakın.',
        persona: ['P1', 'P5'],
        sikinti: 'Tanımadığı alıcıya vade verme riski',
        platform: 'Alıcı doğrulama ve kredi bürosu raporu gibi mevcut hizmetlere yazılım bağlantısı kurmalı. Platformdaki ödeme geçmişini alıcı profiline yansıtmalı.',
        ilkGun: 'ortakla',
        risk: 'Düşük. Kişisel veri kuralına (KVKK) uyum gerekir.',
        dayanak: 'Öneri',
      },
      {
        no: 5,
        soz: 'Cari hesap ekstresini ve ödeme hatırlatmasını müşterinize WhatsApp’tan otomatik gönderin.',
        persona: ['P1', 'P2', 'P5'],
        sikinti: 'Tahsilat takibine harcanan zaman',
        platform: 'Basit bir cari takip ve otomatik hatırlatma aracı sunmalı. Esnafın mevcut müşterileri böylece platforma alıcı olarak girer.',
        ilkGun: 'evet',
        risk: 'Düşük. Yazılım geliştirme maliyeti vardır.',
        dayanak: 'Dış kaynak yok. Bu bir öneridir. Bu araç, platformda başka alıcı ve satıcı olmasa da işe yarar.',
      },
    ],
  },
  {
    id: 'talep',
    harf: 'B',
    ad: 'Yeni müşteri ve talep',
    giris: 'Bu sözler satış vaadini tutulabilir kılar. “Satış garantisi” yerine “satış olursa ödersiniz” denir.',
    oneriler: [
      {
        no: 6,
        soz: 'Satışlarınızdan komisyon almayız. Kendi müşterilerinizi de platforma getirebilirsiniz.',
        persona: ['Hepsi'],
        sikinti: 'Platforma para kaptırma korkusu',
        platform: 'Satıcıya özel davet bağlantısı ve kodu vermeli. Esnaf kendi bayilerini platforma getirir. Böylece platformda ilk günden alıcı olur.',
        ilkGun: 'evet',
        risk: 'istoc.com satışlardan gelir elde etmez. Gelir paketten ve ek hizmetlerden gelir. Ama zamanla platforma çok sayıda alıcı gelir.',
        dayanak: 'Faire Direct %0, Ankorstore Lift %0',
      },
      {
        no: 7,
        soz: `Paketi ${CANLI_DENEME_GUN} gün ücretsiz deneyin. Sonra ${BASIC_PAKET.ad} paket için ayda ${BASIC_AYLIK} ödersiniz. Satışlarınızdan komisyon almayız.`,
        persona: ['P5', 'P1'],
        sikinti: 'Sabit gider korkusu',
        platform: 'Deneme süresini ve aylık ücreti açıkça yazmalı. Ücretsiz paket açılınca satıcı ücretsiz başlayabilir.',
        ilkGun: 'evet',
        risk: 'Aylık ücret küçük esnafı korkutabilir. Ücretsiz paket bu korkuyu azaltır, ama yazılım işi bitmeden açılamaz.',
        dayanak: 'istoc.com satıcı paketleri ve 13 Kasım 2026 Cuma kararları',
      },
      {
        no: 8,
        soz: 'Dükkânınızdan ilk kez alacak işletmeye ilk siparişte indirimi biz veriyoruz. Sizin fiyatınız değişmiyor.',
        persona: ['P2', 'P3', 'P4'],
        sikinti: 'Yeni müşteri kazanma maliyeti',
        platform: 'Alıcı kazanma bütçesinden ilk sipariş indirimi vermeli. Bu indirim alıcı tarafını büyütür.',
        ilkGun: 'evet',
        risk: 'Orta. Nakit harcar, bu yüzden üst sınırı olmalı.',
        dayanak: 'Faire’in kendi bütçesinden verdiği ilk sipariş indirimi',
      },
      {
        no: 9,
        soz: 'Anadolu’daki perakendecilerin ve kurumsal alıcıların (otel, okul, belediye) taleplerini ekibimiz topluyor. Talep size uyarsa en fazla 3 satıcıdan biri olarak size iletiyoruz.',
        persona: ['P3', 'P4'],
        sikinti: 'Yeni bölgede ve kurumlarda müşteri bulmak',
        platform: 'Ekip talepleri telefonla toplamalı ve gerçek talebi az sayıda satıcıya iletmeli. Bu, teklif isteğinin (RFQ) dürüst biçimidir.',
        ilkGun: 'kismen',
        risk: 'Orta. Ekip maliyeti vardır. Talep sayısı abartılırsa itibar zarar görür.',
        dayanak: 'IndiaMART bir talebi ortalama 3,2 satıcıya iletiyor.',
      },
      {
        no: 10,
        soz: 'Ürünleriniz Google’da “toptan çorap İstoç” gibi aramalarda sizin adınızla çıksın.',
        persona: ['P2', 'P4'],
        sikinti: 'Dijitalde görünmemek',
        platform: 'Arama motoruna uygun (SEO) ürün ve mağaza sayfaları kurmalı. Alıcılar bu sayfaları Google’da ücretsiz aramayla bulur. Böylece platforma alıcı gelir.',
        ilkGun: 'evet',
        risk: 'Düşük. Etkisi birkaç ay içinde görünür.',
        dayanak: 'IndiaMART’a gelen ziyaretçilerin yaklaşık %100’ü ücretsiz aramadan geliyor.',
      },
      {
        no: 11,
        soz: 'Yeni müşteri size gelmeden önce kimliği ve vergi numarası doğrulanmış olur.',
        persona: ['P1'],
        sikinti: 'Sahte veya riskli alıcı',
        platform: 'Alıcı kaydında vergi numarasını doğrulamalı. Alıcının kalitesi satıcının güvenini artırır.',
        ilkGun: 'evet',
        risk: 'Düşük.',
        dayanak: 'Öneri',
      },
    ],
  },
  {
    id: 'ihracat',
    harf: 'C',
    ad: 'İhracat ve yabancı alıcı',
    giris: 'Bu alan P4 ve P6 için en güçlü, P2 için en heyecan verici alandır. Ancak istoc.com’un ihracat altyapısı ve süreçleri henüz hazır değildir. Bu öneriler ileride yapılacak işlerdir. Saha ekibi bunları esnafa söz olarak vermez. Bugün kullanılacak sözler “İhracata hazırlık” bölümündedir.',
    oneriler: [
      {
        no: 12,
        soz: 'Yurt dışındaki alıcınıza küçük gönderileri kargoyla gönderin. Buna mikro ihracat denir. Gümrük müşaviri tutmanız gerekmez. Evrakı biz hazırlıyoruz.',
        persona: ['P4', 'P6', 'P2'],
        sikinti: 'Gümrük işlemlerinin karmaşası',
        platform: 'Hızlı kargo şirketleriyle elektronik ticaret gümrük beyannamesi (ETGB) anlaşması yapmalı. Fatura ve beyan şablonu hazırlamalı.',
        ilkGun: 'ortakla',
        risk: 'Düşük ile orta.',
        dayanak: 'Elektronik ticaret gümrük beyannamesinin (ETGB) sınırı yükseltildi. Artık bir gönderi en çok 30.000 avro (KDV hariç) ve 600 kg (brüt) olabilir.',
      },
      {
        no: 13,
        soz: 'Devletin e-ihracat desteklerine başvuruyu birlikte hazırlayalım. Destek reklam, komisyon ve depolama giderinin %50’sini karşılar. Hedef ülkelerde destek %70’e kadar çıkar.',
        persona: ['P4', 'P6'],
        sikinti: 'Pazarlama bütçesinin olmaması',
        platform: 'Destek başvurusunda danışmanlık vermeli. istoc.com da işletmeler arası platformlara verilen e-ihracat tanıtım desteğine başvurabilir. Bu destek yurt dışından alıcı kazanmayı finanse eder.',
        ilkGun: 'kismen',
        risk: 'Düşük. Kesin destek sözü verilmemeli, çünkü onayı Bakanlık verir.',
        dayanak: 'Bu destek 5986 sayılı Karara dayanır. Kararın 2026 tablosu, işletmeler arası platformlara verilecek desteğe üst sınır koyar. E-ihracat tanıtım desteğinin yıllık üst sınırı 19.728.673 ₺’dır. Hedef ülke sayısı 35’tir.',
      },
      {
        no: 14,
        soz: 'Kataloğunuz Arapça, Rusça, Fransızca ve İngilizce olarak tek tıkla hazır.',
        persona: ['P6', 'P4'],
        sikinti: 'Dil engeli',
        platform: 'Otomatik çeviri ve çok dilli mağaza sayfası sunmalı.',
        ilkGun: 'evet',
        risk: 'Düşük. Çeviri kalitesi kontrol edilmeli.',
        dayanak: 'Öneri',
      },
      {
        no: 15,
        soz: 'Dükkânınıza gelen yabancı tüccar artık telefondan sipariş versin. Parayı güvenle ödesin, malı kolide alsın.',
        persona: ['P6'],
        sikinti: 'Bavul ticaretinin düşmesi',
        platform: 'Mevcut yabancı müşteriler için uzaktan sipariş, döviz tahsilatı ve toplu kargo sunmalı. Yabancı alıcılar böylece ağa katılır.',
        ilkGun: 'ortakla',
        risk: 'Orta. Uluslararası ödeme ve kargo ortakları gerekir.',
        dayanak: 'Bavul ticareti 2026’nın ilk çeyreğinde %32 düştü. Lonca’nın toplu kargo modeli bir örnektir.',
      },
      {
        no: 16,
        soz: 'Fiyatınızı dolar veya avro olarak girin. Alıcı kendi para biriminde görsün.',
        persona: ['P3', 'P6'],
        sikinti: 'Kur dalgalanması',
        platform: 'Birden çok para birimiyle fiyat girmeye izin vermeli.',
        ilkGun: 'evet',
        risk: 'Düşük. Kur farkı riski satıcıdadır. Platform kur garantisi vermemeli.',
        dayanak: 'Öneri',
      },
    ],
  },
  {
    id: 'operasyon',
    harf: 'D',
    ad: 'Operasyon, zaman kazancı ve ücretsiz araçlar',
    giris: 'Esnaf platforma önce ücretsiz araçlar için gelir. Sonra platformdaki yeni alıcılar için kalır. Bu sözlerin hiçbiri alıcı gerektirmez.',
    oneriler: [
      {
        no: 17,
        soz: 'WhatsApp’tan gelen siparişleri tek ekranda toplayın. Müşterinize katalog bağlantısını gönderin, o da sepetini kendisi doldursun.',
        persona: ['P1', 'P2', 'P5'],
        sikinti: 'Dağınık sipariş ve hata',
        platform: 'WhatsApp katalog bağlantısı ve sipariş formu sunmalı. Esnafın müşterisi böylece platformda alıcı hesabı açmış olur.',
        ilkGun: 'evet',
        risk: 'Düşük ile orta.',
        dayanak: 'Dış kaynak yok. Bu bir öneridir. OpenTable da pazara önce yazılımla girdi.',
      },
      {
        no: 18,
        soz: 'Kur değişince yüzlerce ürünün fiyatını tek tuşla, yüzde ile güncelleyin.',
        persona: ['P3', 'P1'],
        sikinti: 'Fiyat listesini güncelleme yükü',
        platform: 'Toplu fiyat güncelleme aracı sunmalı.',
        ilkGun: 'evet',
        risk: 'Düşük.',
        dayanak: 'Öneri',
      },
      {
        no: 19,
        soz: 'Siparişin faturası e-fatura ve e-arşiv olarak otomatik kesilsin. Logo, Mikro veya Paraşüt’e kendiliğinden aktarılsın.',
        persona: ['Hepsi'],
        sikinti: 'E-belge yükümlülüğü ve çift kayıt',
        platform: 'E-fatura hizmeti veren firmalara ve muhasebe programlarına yazılım bağlantısı kurmalı.',
        ilkGun: 'ortakla',
        risk: 'Orta. Bu yazılım bağlantılarını geliştirmek gerekir.',
        dayanak: '2026’da e-arşiv tutar sınırı kalkıyor. E-fatura eşiği 3 milyon ₺’dır.',
      },
      {
        no: 20,
        soz: `Ürünlerinizin fotoğrafını ekibimiz dükkânınızda çeksin, mağazanızı bir günde açalım. Bu hizmet bir kez ${KURULUM} tutar.`,
        persona: ['P1', 'P5'],
        sikinti: 'Zaman ve dijital beceri eksikliği',
        platform: 'Dükkânda mağaza kuran bir saha ekibi kurmalı. İçeriği dolu mağaza alıcıyı çeker.',
        ilkGun: 'evet',
        risk: 'Orta. Ekip maliyeti vardır, ama satıcı kazanmanın en etkili yoludur.',
        dayanak: 'Lenny Rachitsky (2019): Görüşülen şirketlerin yaklaşık %60’ında doğrudan satış kritik rol oynadı. Bu yöntem, en yaygın ikinci yöntemden iki kat daha yaygındı.',
      },
      {
        no: 21,
        soz: 'Anlaşmalı kargo tarifesiyle koli ve palet gönderimini daha ucuza yapın.',
        persona: ['P5', 'P3'],
        sikinti: 'Kargo maliyeti',
        platform: 'Toplu kargo anlaşması yapmalı. Satıcıların hacmi arttıkça tarife iyileşir.',
        ilkGun: 'ortakla',
        risk: 'Düşük. Kargo firmasına belirli sayıda gönderi sözü vermek risklidir.',
        dayanak: 'Ankorstore’un UPS anlaşması',
      },
      {
        no: 22,
        soz: 'Müşterinize 2 dakikada fiyat teklifi PDF’i hazırlayın.',
        persona: ['P4', 'P2'],
        sikinti: 'Teklif hazırlamaya giden zaman',
        platform: 'Teklif oluşturma aracı sunmalı. Teklif bağlantısı alıcıyı platforma çeker.',
        ilkGun: 'evet',
        risk: 'Düşük.',
        dayanak: 'Öneri',
      },
      {
        no: 23,
        soz: 'Stokunuzu ve hangi ürünün ne kadar sattığını telefondan görün.',
        persona: ['P2', 'P3'],
        sikinti: 'Stoku görememek',
        platform: 'Basit bir stok paneli sunmalı.',
        ilkGun: 'evet',
        risk: 'Düşük ile orta.',
        dayanak: 'Öneri',
      },
    ],
  },
  {
    id: 'stok',
    harf: 'E',
    ad: 'Stok eritme',
    oneriler: [
      {
        no: 24,
        soz: 'Parti malınızı kapalı vitrinde yalnız doğrulanmış toptan alıcılara satın. Böylece açık piyasada fiyat düşmez.',
        persona: ['P7', 'P3'],
        sikinti: 'Ölü stok ve fiyatın bozulması korkusu',
        platform: 'Kapalı bir “parti mal” vitrini açmalı. Bu vitrin fırsat arayan alıcıları çeker.',
        ilkGun: 'kismen',
        risk: 'Düşük. Alıcı yoksa satış olmaz, bu yüzden satış sözü verilmemeli.',
        dayanak: 'Öneri',
      },
      {
        no: 25,
        soz: 'Okul ve bayram sezonu öncesinde kampanya takvimine katılın. Sezon sonunda kalanı erken eritin.',
        persona: ['P7'],
        sikinti: 'Sezonluk stok riski',
        platform: 'Sektöre göre kampanya takvimi hazırlamalı. Kampanyaya katılım gönüllü olmalı.',
        ilkGun: 'kismen',
        risk: 'Düşük. ETK’ya göre satıcıyı kampanyaya zorlamak haksız uygulamadır. Bu kural Ek 1. maddenin 2. fıkrasının (b) bendindedir.',
        dayanak: 'ETK Ek 1',
      },
      {
        no: 26,
        soz: 'Standart ve adede göre fiyatınızı herkes görsün. Onayladığınız müşteri grupları ise kendilerine özel fiyatı görsün.',
        persona: ['P1', 'P3'],
        sikinti: 'Özel fiyatın herkese açık olması',
        platform: 'Standart ve adede bağlı fiyatı herkese göstermeli. Müşteri grubuna özel fiyatı yalnız o gruba göstermeli.',
        ilkGun: 'evet',
        risk: 'Düşük. Fiyat tamamen gizlenirse alıcı platformdan ayrılır, bu yüzden standart fiyat her zaman görünür kalmalıdır.',
        dayanak: 'İşletmeler arası platformlarda yaygın bir uygulama (Shopify B2B rehberi)',
      },
    ],
  },
  {
    id: 'guven',
    harf: 'F',
    ad: 'Güven, risk azaltma ve statü',
    oneriler: [
      {
        no: 27,
        soz: 'Dükkânınız yerinde denetlensin ve “Doğrulanmış İstoç Toptancısı” rozeti alsın. Alıcı sizi sahte satıcılardan ayırsın.',
        persona: ['P1', 'P4', 'P6'],
        sikinti: 'Sahte satıcılarla aynı rafta durmak',
        platform: 'Satıcıyı yerinde ve belgeyle doğrulamalı. Rozet alıcıya güven verir.',
        ilkGun: 'evet',
        risk: 'Orta. Denetim gevşek yapılırsa alıcılar rozete güvenmez.',
        dayanak: 'Alibaba Gold Supplier ve 2011’deki sahte satıcı skandalı',
      },
      {
        no: 28,
        soz: 'Alıcıyla anlaşmazlık olursa çözümü biz yönetiriz. İade edilen malın taşınmasını belirli kurallarla biz üstleniriz.',
        persona: ['P1', 'P5'],
        sikinti: 'İade ve uyuşmazlık yükü',
        platform: 'Aracılık sözleşmesine açık bir iade ve uyuşmazlık politikası yazmalı. İlk siparişte iade riskini üstlenmek alıcıyı denemeye cesaretlendirir.',
        ilkGun: 'kismen',
        risk: 'Orta ile yüksek. İade maliyeti vardır, üst sınır şarttır.',
        dayanak: 'Faire ilk siparişte iade riskini kendisi üstleniyor.',
      },
      {
        no: 29,
        soz: 'Sizinle yaptığımız sözleşme sade. Komisyonu tek taraflı değiştiremeyiz. Değişiklik olursa 30 gün önceden yazılı bildiririz.',
        persona: ['P1'],
        sikinti: 'Platforma güvenmemek',
        platform: 'ETK’ya uygun, sade bir aracılık sözleşmesi hazırlamalı.',
        ilkGun: 'evet',
        risk: 'Düşük. Bu zaten yasal bir yükümlülüktür.',
        dayanak: 'ETK Ek 1. madde, 2. fıkranın (c) ve (ç) bentleri ve Yönetmelik 16. madde',
      },
      {
        no: 30,
        soz: 'İstoç’taki dükkânınız dijitalde de İstoç adresiyle, çarşının itibarıyla görünsün.',
        persona: ['P1', 'P2'],
        sikinti: 'Dijitalde kimliksiz kalmak',
        platform: 'Çarşı ve blok bazında dijital adres vermeli. Çarşının markası alıcı çeker.',
        ilkGun: 'evet',
        risk: 'Düşük. Marka kullanımı İstoç yönetimiyle netleştirilmeli.',
        dayanak: 'Öneri',
      },
    ],
  },
  {
    id: 'topluluk',
    harf: 'G',
    ad: 'Çarşı içi topluluk ve ortak güç',
    giris: 'Bu sözlerin yaklaşımı şudur: Önce tek bir sektörde ve tek bir blokta çok satıcı toplanır. Platform bu küçük gruptan başlayarak büyür.',
    oneriler: [
      {
        no: 31,
        soz: 'Aynı bloktaki komşularınızla birlikte açılın. Alıcı tek siparişte birkaç dükkândan alsın, tek koliyle teslim alsın.',
        persona: ['P3', 'P5', 'P7'],
        sikinti: 'Küçük siparişte yüksek kargo maliyeti',
        platform: 'Birden çok satıcıdan tek sepet ve toplu teslimat sunmalı. Ürün çeşitliliği alıcıyı çeker.',
        ilkGun: 'kismen',
        risk: 'Orta. Depo ve toplama operasyonu gerekir.',
        dayanak: 'Ankorstore’un çok markalı tek siparişi ve Lonca',
      },
      {
        no: 32,
        soz: 'Getirdiğiniz her komşu esnaf için komisyon indirimi kazanın.',
        persona: ['Hepsi'],
        sikinti: 'Ek gelir isteği ve tanıdığa duyulan güven',
        platform: 'Satıcı referans programı kurmalı. Böylece satıcılar başka satıcıları getirir.',
        ilkGun: 'evet',
        risk: 'Düşük ile orta. İndirim maliyeti vardır.',
        dayanak: 'Lenny Rachitsky (2019): Referans programları görüşülen pazar yerlerinin yaklaşık üçte birinde büyük başarı sağladı. Uber’de ilk yolculukların yaklaşık üçte biri referanstan geldi.',
      },
      {
        no: 33,
        soz: 'Kargo, ambalaj, POS ve sigortada çarşı olarak toplu indirim alalım.',
        persona: ['P5'],
        sikinti: 'Tek başına pazarlık gücünün olmaması',
        platform: 'Toplu alım anlaşmaları yapmalı. Satıcı sayısı arttıkça indirim büyür.',
        ilkGun: 'ortakla',
        risk: 'Düşük.',
        dayanak: 'Öneri',
      },
      {
        no: 34,
        soz: 'Çarşı derneği ve İstoç yönetimiyle birlikte esnaf eğitimleri düzenleyelim: e-ihracat, e-fatura, dijital satış.',
        persona: ['P1', 'P2'],
        sikinti: 'Dijital beceri eksikliği',
        platform: 'Dernek ve yönetimle ortak bir eğitim programı kurmalı. Bu program topluluğun güvenini artırır.',
        ilkGun: 'evet',
        risk: 'Düşük.',
        dayanak: 'Öneri',
      },
      {
        no: 35,
        soz: 'Platform kurallarını ve yeni özellikleri ilk kullanan 100 esnafla birlikte belirleyelim. Kurucu satıcı olun.',
        persona: ['P2', 'P4'],
        sikinti: 'Söz hakkı ve statü isteği',
        platform: 'Kurucu satıcılardan bir kurul oluşturmalı. İlk katılan satıcılara ömür boyu düşük komisyon gibi haklar vermeli.',
        ilkGun: 'evet',
        risk: 'Düşük. Verilen avantaj geri alınamaz, bu yüzden sınırlı tutulmalı.',
        dayanak: 'Öneri',
      },
    ],
  },
  {
    id: 'ihracat-hazirlik',
    harf: 'H',
    ad: 'İhracata hazırlık',
    giris: 'İhracat altyapısı ve süreçleri henüz hazır değil, ama hedefimiz var. Bu sözler ihracat vaadi vermeden yönü gösterir. Kapıda bugün bunlar kullanılır.',
    oneriler: [
      {
        no: 36,
        soz: 'İhracat hedefimiz var. Bugün katılan satıcılar, ihracat altyapımız hazır olduğunda ilk sırada yer alır.',
        persona: ['P4', 'P6', 'P2'],
        sikinti: 'İhracat isteyip nereden başlayacağını bilmemek',
        platform: 'İhracata ilgi duyan satıcıları kaydetmeli. Altyapı hazır olduğunda önce bu satıcılarla başlamalı.',
        ilkGun: 'evet',
        risk: 'Düşük. Tarih verilmemeli. Altyapı hazır olmadan ihracat sözü verilmemeli.',
        dayanak: 'Öneri',
      },
      {
        no: 37,
        soz: 'Ürün bilgilerinizi bugünden eksiksiz tutalım: ölçü, ağırlık, malzeme ve üretildiği ülke. Eksiksiz ürün bilgisi her pazarda daha kolay satar.',
        persona: ['P2', 'P3', 'P4'],
        sikinti: 'Eksik ürün bilgisi yüzünden satış kaçırmak',
        platform: 'Ürün kartına ölçü, ağırlık, malzeme ve üretildiği ülke alanlarını eklemeli. Bu alanlar ileride ihracat için de kullanılır.',
        ilkGun: 'kismen',
        risk: 'Düşük. Alanların yazılıma eklenmesi gerekir.',
        dayanak: 'Öneri',
      },
      {
        no: 38,
        soz: 'Yurt dışından gelen alıcı ilgisini kaydedelim. Altyapı hazır olduğunda bu alıcılarla sizi ilk biz buluşturalım.',
        persona: ['P6', 'P4'],
        sikinti: 'Yabancı alıcının ilgisini değerlendirememek',
        platform: 'Yabancı alıcıdan gelen talepleri kayda almalı ve bekleme listesine yazmalı. Teslim ya da tarih sözü vermemeli.',
        ilkGun: 'kismen',
        risk: 'Orta. Kaydedilen alıcıya teslim tarihi sözü verilirse itibar zarar görür.',
        dayanak: 'Öneri',
      },
      {
        no: 39,
        soz: 'Etkinliklerimizde ihracata hazırlığın ilk adımlarını birlikte konuşalım: ürün, belge ve fiyat.',
        persona: ['P1', 'P2', 'P4'],
        sikinti: 'İhracat bilgisinin dağınık ve pahalı olması',
        platform: 'Etkinlik takvimine ihracata hazırlık konusunu eklemeli ve konuyu uzman bir eğitmene anlattırmalı.',
        ilkGun: 'kismen',
        risk: 'Düşük. Eğitim bir ihracat hizmeti sözü değildir, bu ayrım açıkça söylenmelidir.',
        dayanak: 'Dış kaynak yok. Bu bir öneridir. Etkinlik ve eğitmen kararlarıyla birlikte uygulanır.',
      },
      {
        no: 40,
        soz: 'Bugün Türkiye’nin her yerine satış yapın. İhracata da şimdiden hazırlanın.',
        persona: ['Hepsi'],
        sikinti: 'Büyümenin yönünü görememek',
        platform: 'Yurt içi büyümeyi ihracat hedefine bağlayan bir yol haritası paylaşmalı.',
        ilkGun: 'evet',
        risk: 'Düşük. Yol haritasında kesin tarih verilmemeli.',
        dayanak: 'Öneri',
      },
    ],
  },
];

/** Esnaf kapısında ilk 30 saniye: kaynaklı acı noktalarına ve ilk günden verilebilirliğe göre sıra. */
export const ILK_30_SANIYE: { ad: string; oneriler: number[]; soz: string }[] = [
  { ad: 'Açılış', oneriler: [6, 7], soz: `Kendi müşterilerinizden siparişi burada alın. Satışlarınızdan komisyon almayız. Paketi ${CANLI_DENEME_GUN} gün ücretsiz deneyin.` },
  { ad: 'Para', oneriler: [1], soz: 'Platformdan gelen siparişin parası güvende. Çek ve senet derdi yok.' },
  { ad: 'Zaman', oneriler: [17, 18, 19], soz: 'WhatsApp’tan gelen siparişleri tek ekranda görürsünüz. Fiyatları tek tuşla güncellersiniz. Faturalar kendiliğinden kesilir.' },
  { ad: 'Kurulum', oneriler: [20], soz: `Fotoğrafı biz çekeriz, mağazanız bugün açılır. Kurulum bir kez ${KURULUM} tutar.` },
  { ad: 'İhracata ilgi duyan esnafa', oneriler: [36, 40], soz: 'İhracat hedefimiz var. Bugün katılırsanız, altyapımız hazır olduğunda ilk sırada siz olursunuz.' },
];

export const BASLANGIC_NOTU =
  'P1 ve P5 esnafına para sözleriyle ve ücretsiz denemeyle başlayın. P2 esnafına araç ve ihracata hazırlık sözleriyle başlayın. P4 ve P6 esnafına ihracata hazırlık sözleriyle başlayın. İhracat altyapısı hazır olmadığı için ihracat hizmeti vaat edilmez. Bütün esnaf için ortak açılış sözü “sıfır komisyonla kendi müşteriniz” olmalı. Bu söz ilk günden tutulabilir ve alıcı tarafını esnafın kendi müşterileriyle doldurur.';

export const ESKI_SOZLER: { eski: string; yeni: string; neden: string; not?: string }[] = [
  {
    eski: '%100 satış garantisi',
    yeni: 'Platformdan gelen siparişin parası garanti. Yeni alıcıdan ilk 90 günde sipariş gelmezse hiçbir ücret ödemezsiniz.',
    neden: 'Bu söz tutulabilir. Risk, ödeme ortağında ve platformun kendi gelirinde kalır. Faire’in “her sipariş garantili satış” anlayışına denk düşer.',
  },
  {
    eski: 'RFQ ile gelmiş alıcı teklifleri',
    yeni: 'Ekibimizin topladığı gerçek alıcı talepleri size uygunsa, en fazla 3 satıcıdan biri olarak size iletilir. Şu ana kadar bu sektörde [gerçek talep sayısı] talep topladık.',
    neden: 'Talep kalitelidir ve rakip azdır. IndiaMART satıcılarını bu yöntemle elinde tutar. Dürüst bir sayı itibarı korur.',
    not: 'Köşeli ayraçlı yere gerçek talep sayısı yazılmalı.',
  },
];

export const KISALTMALAR: { kisa: string; acik: string }[] = [
  { kisa: 'B2B', acik: 'İşletmeden işletmeye satış.' },
  { kisa: 'BNPL', acik: '“Şimdi al, sonra öde.” Alıcı malı bugün alır, bedelini vadede öder.' },
  { kisa: 'Escrow', acik: 'Güvenli havuz ödeme. Alıcının parası teslimata kadar aracı kuruluşta bekler.' },
  { kisa: 'ETGB', acik: 'Elektronik ticaret gümrük beyannamesi. Mikro ihracatta kullanılan basit beyandır.' },
  { kisa: 'ETK', acik: '6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun. Ek 1. madde pazar yerlerinin satıcıya karşı yükümlülüklerini düzenler.' },
  { kisa: 'KVKK', acik: '6698 sayılı Kişisel Verilerin Korunması Kanunu.' },
  { kisa: 'POS', acik: 'Kartla ödeme alan cihaz.' },
  { kisa: 'RFQ', acik: 'Teklif isteği. Alıcı ihtiyacını yazar, satıcılar fiyat verir.' },
  { kisa: 'SEO', acik: 'Arama motoru uyumu. Sayfaların Google aramalarında üst sıralarda çıkması için yapılan düzenlemedir.' },
];
