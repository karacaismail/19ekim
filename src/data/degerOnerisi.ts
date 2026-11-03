/**
 * Değer önerisi (kullanıcı kararı 2026-11-03): saha ekibinin esnafa söyleyeceği sözler ve her sözü tutmak için
 * platformun yapması gerekenler. Kaynak: kullanıcının paylaştığı araştırma raporu (bölüm 1, 5 ve 6). Sözler tek hitapla
 * (“siz”) yazıldı; açıklamalar tam cümledir. Persona kodları (P1–P7) raporun 3. bölümündeki esnaf tipleridir.
 */

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
    gucluTarafi: 'Esnafın elinde atıl duran sermayeyi hedefler. Alıcı çıkarsa hemen nakit sonucu doğar.',
  },
  {
    baslik: 'Ödemenizi güvence altına alın',
    soz: 'Yeni müşteriye mal satarken paranızı alamama riskinizi azaltalım. Güvenli ödeme ve doğrulanmış alıcılarla çalışın.',
    gucluTarafi: 'Tahsilat riskini azaltmak, yalnız daha fazla müşteri bulmaktan daha değerli olabilir. Bu güvence için ödeme altyapısı ve sözleşme gerekir.',
  },
  {
    baslik: 'Mevcut müşterilerinizi getirin, komisyon ödemeyin',
    soz: 'Kendi müşterilerinize platformumuz üzerinden teklif verin, sipariş alın ve satışlarını takip edin. Bu müşterilerden satış komisyonu almayalım.',
    gucluTarafi: 'Satıcıya hemen fayda sağlar ve alıcıların platforma gelmesini hızlandırır. Ödeme hizmetinin maliyeti ayrıca tanımlanmalıdır.',
  },
  {
    baslik: 'Türkiye genelinde yeni bayiler kazanın',
    soz: 'İstanbul dışında size düzenli sipariş verebilecek nalbur, kırtasiye, market ve perakendecilere ulaşalım.',
    gucluTarafi: 'Tek seferlik satış yerine tekrar eden bir müşteri ilişkisi kurar.',
  },
  {
    baslik: 'Büyük kurumsal satın alma taleplerine erişin',
    soz: 'Otellerin, restoran zincirlerinin, fabrikaların, okulların ve şirketlerin toplu alım ihtiyaçlarına teklif verin.',
    gucluTarafi: 'Esnafı tek başına ulaşamadığı, yüksek hacimli kurumsal müşterilerle buluşturur.',
  },
  {
    baslik: 'Ürünlerinizi biz dijital satışa hazırlayalım',
    soz: 'Personel ayırmayın. Ürün listenizi bize verin. Fotoğraf, açıklama, kategori ve toptan fiyat düzenini biz hazırlayalım.',
    gucluTarafi: 'Dijital ticarete girmek isteyen ama teknik personeli olmayan esnafın ilk engelini kaldırır.',
  },
  {
    baslik: 'Toptan fiyatlarınızı rakiplerden ve perakendecilerden koruyun',
    soz: 'Fiyatınızı herkese açmayın. Her müşteriye, alım miktarına ve bayi grubuna göre farklı fiyat sunun.',
    gucluTarafi: 'Satıcının mevcut bayi ilişkilerini ve fiyat politikasını korur.',
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
    giris: 'Bu sözler karşılıksız çek ve nakit akışı sorununa doğrudan cevap verir. P1 ve P5 için en güçlü kapı açıcıdır.',
    oneriler: [
      {
        no: 1,
        soz: 'Platformdan gelen siparişin parası garanti. Alıcı öder, para teslimata kadar güvende bekler, teslimden sonra kısa sürede hesabınıza geçer.',
        persona: ['P1', 'P5', 'P6'],
        sikinti: 'Karşılıksız çek ve tahsil edilemeyen alacak',
        platform: 'Lisanslı bir ödeme kuruluşuyla güvenli havuz ödeme (escrow) kurmalı. Güvenli ödeme alıcıyı da platforma çeker.',
        ilkGun: 'ortakla',
        risk: 'Düşük ile orta. Ödeme kuruluşu komisyon alır. ETK Ek 1/2-a, pazar yerinin satış bedelini sipariş alıcıya ulaştıktan sonra 5 iş günü içinde satıcıya ödemesini zaten şart koşuyor.',
        dayanak: 'Alibaba Trade Assurance, Faire, ETK Ek 1',
      },
      {
        no: 2,
        soz: 'Alıcınız vadeli ödese bile siz paranızı peşin alırsınız. Vadeyi biz değil, anlaşmalı finans kuruluşu taşır.',
        persona: ['P1', 'P3', 'P4'],
        sikinti: 'Vadeli satışta nakit sıkışması',
        platform: 'Banka, finansman veya faktoring şirketiyle işletmeler arası “şimdi al, sonra öde” (B2B BNPL) ortaklığı kurmalı. Vade imkânı alıcıyı çeker, alıcı da satıcıyı çeker.',
        ilkGun: 'ortakla',
        risk: 'Orta. İskonto maliyeti satıcıya ya da alıcıya yansır. Türkiye’de BNPL’i yalnız bankalar ve finansman şirketleri sunabilir. istoc.com kendi bilançosuyla vade vermemeli.',
        dayanak: 'Faire Net 60, Ankorstore, Kredim Business',
      },
      {
        no: 3,
        soz: 'Bugünkü müşterilerinize kestiğiniz vadeli faturayı isterseniz birkaç gün içinde nakde çevirin.',
        persona: ['P1', 'P3', 'P4'],
        sikinti: 'Mevcut alacakların uzun vadesi',
        platform: 'Figopara gibi fatura finansmanı platformlarıyla entegrasyon kurmalı. Platformda alıcı olmasa da bu hizmet işe yarar.',
        ilkGun: 'ortakla',
        risk: 'Düşük. Riski finansman ortağı taşır.',
        dayanak: 'Figopara CEO’su Koray Bahar’a göre platform aylık 2,5 milyar TL işlem hacmi yönetiyor. İştiraki Figofinans’ın müşterileri arasında toptan ticaret önde geliyor.',
      },
      {
        no: 4,
        soz: 'Yeni bir alıcıya mal vermeden önce ödeme geçmişine bir bakın.',
        persona: ['P1', 'P5'],
        sikinti: 'Tanımadığı alıcıya vade verme riski',
        platform: 'Alıcı doğrulama ve kredi bürosu raporu gibi mevcut hizmetlerle entegrasyon kurmalı. Platformdaki ödeme geçmişini alıcı profiline yansıtmalı.',
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
        dayanak: 'Öneri. Bu araç ağ oluşmadan da tek başına değer verir.',
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
        soz: 'Kendi müşterinizi getirirseniz hiç komisyon ödemezsiniz. Komisyonu sadece bizim getirdiğimiz yeni alıcıdan alırız.',
        persona: ['Hepsi'],
        sikinti: 'Platforma para kaptırma korkusu',
        platform: 'Satıcıya özel davet bağlantısı ve kodu vermeli. Esnaf kendi bayilerini getirir ve alıcı tarafı ilk günden dolar.',
        ilkGun: 'evet',
        risk: 'Kısa vadede satış hacminden (GMV) gelir gelmez. Uzun vadede alıcı tabanı kazanılır.',
        dayanak: 'Faire Direct yüzde 0, Ankorstore Lift yüzde 0',
      },
      {
        no: 7,
        soz: 'Liste ücreti yok, aylık ücret yok. Satış olmazsa bize hiçbir şey ödemezsiniz.',
        persona: ['P5', 'P1'],
        sikinti: 'Sabit gider korkusu',
        platform: 'Yalnız başarılı satıştan komisyon almalı. Böylece satıcının giriş engeli kalkar.',
        ilkGun: 'evet',
        risk: 'Abonelik geliri gecikir.',
        dayanak: 'Alibaba’nın ilk dönemdeki ücretsiz üyeliği',
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
        soz: 'Ürünleriniz Google’da “toptan … İstoç” aramalarında sizin adınızla çıksın.',
        persona: ['P2', 'P4'],
        sikinti: 'Dijitalde görünmemek',
        platform: 'Arama motoruna uygun (SEO) ürün ve mağaza sayfaları kurmalı. Bu sayfalar ücretsiz arama trafiğiyle alıcı getirir.',
        ilkGun: 'evet',
        risk: 'Düşük. Etkisi birkaç ay içinde görünür.',
        dayanak: 'IndiaMART trafiğinin yaklaşık yüzde 100’ü ücretsiz aramadan geliyor.',
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
    giris: 'Bu alan P4 ve P6 için en güçlü, P2 için en heyecan verici alandır. Yabancı alıcının dükkâna gelmesi zorlaştıkça değeri artar.',
    oneriler: [
      {
        no: 12,
        soz: 'Yurt dışındaki alıcınıza koliyi gümrük müşaviri tutmadan, kargo şirketi üzerinden mikro ihracatla gönderin. Evrakı biz hazırlıyoruz.',
        persona: ['P4', 'P6', 'P2'],
        sikinti: 'Gümrük işlemlerinin karmaşası',
        platform: 'Hızlı kargo şirketleriyle ETGB anlaşması yapmalı. Fatura ve beyan şablonu hazırlamalı.',
        ilkGun: 'ortakla',
        risk: 'Düşük ile orta.',
        dayanak: 'ETGB sınırı gönderi başına KDV hariç 30.000 avro ve brüt 600 kg’a çıkarıldı.',
      },
      {
        no: 13,
        soz: 'Devletin e-ihracat desteklerinden (reklam, komisyon ve depolama giderinin yüzde 50’si, hedef ülkelerde yüzde 70’e kadar) yararlanmanız için başvuruyu birlikte hazırlayalım.',
        persona: ['P4', 'P6'],
        sikinti: 'Pazarlama bütçesinin olmaması',
        platform: 'Destek başvurusunda danışmanlık vermeli. istoc.com da işletmeler arası platformlara verilen e-ihracat tanıtım desteğine başvurabilir. Bu destek yurt dışından alıcı kazanmayı finanse eder.',
        ilkGun: 'kismen',
        risk: 'Düşük. Kesin destek sözü verilmemeli, çünkü onayı Bakanlık verir.',
        dayanak: '5986 sayılı Karar. 2026 tablosuna göre işletmeler arası platformlar için e-ihracat tanıtım desteğinin yıllık tavanı 19.728.673 TL, hedef ülke sayısı 35.',
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
        soz: 'Eskiden dükkânınıza gelen yabancı tüccar artık telefondan sipariş versin, parayı güvenle ödesin, malı kolide alsın.',
        persona: ['P6'],
        sikinti: 'Bavul ticaretinin düşmesi',
        platform: 'Mevcut yabancı müşteriler için uzaktan sipariş, döviz tahsilatı ve toplu kargo sunmalı. Yabancı alıcılar böylece ağa katılır.',
        ilkGun: 'ortakla',
        risk: 'Orta. Uluslararası ödeme ve kargo ortakları gerekir.',
        dayanak: 'Bavul ticareti 2026’nın ilk çeyreğinde yüzde 32 düştü. Lonca’nın toplu kargo modeli bir örnektir.',
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
    giris: 'Esnaf platforma önce araçlar için gelir, sonra ağın getirdiği müşteriler için kalır. Bu sözlerin hiçbiri alıcı gerektirmez.',
    oneriler: [
      {
        no: 17,
        soz: 'WhatsApp’tan gelen siparişleri tek ekranda toplayın. Müşterinize katalog bağlantısını gönderin, o da sepetini kendisi doldursun.',
        persona: ['P1', 'P2', 'P5'],
        sikinti: 'Dağınık sipariş ve hata',
        platform: 'WhatsApp katalog bağlantısı ve sipariş formu sunmalı. Esnafın müşterisi böylece platformda alıcı hesabı açmış olur.',
        ilkGun: 'evet',
        risk: 'Düşük ile orta.',
        dayanak: 'Öneri. OpenTable da pazara önce yazılımla girdi.',
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
        platform: 'E-belge entegratörleri ve muhasebe yazılımlarıyla entegrasyon kurmalı.',
        ilkGun: 'ortakla',
        risk: 'Orta. Entegrasyonları geliştirmek gerekir.',
        dayanak: '2026’da e-arşiv tutar sınırı kalkıyor. E-fatura eşiği 3 milyon TL.',
      },
      {
        no: 20,
        soz: 'Ürünlerinizin fotoğrafını ekibimiz dükkânınızda ücretsiz çeksin, mağazanızı bir günde açalım.',
        persona: ['P1', 'P5'],
        sikinti: 'Zaman ve dijital beceri eksikliği',
        platform: 'Dükkânda mağaza kuran bir saha ekibi kurmalı. İçeriği dolu mağaza alıcıyı çeker.',
        ilkGun: 'evet',
        risk: 'Orta. Ekip maliyeti vardır, ama satıcı kazanmanın en etkili yoludur.',
        dayanak: 'Lenny Rachitsky (2019): Görüşülen şirketlerin yaklaşık yüzde 60’ında doğrudan satış kritik rol oynadı. Bu yöntem, en yaygın ikinci yöntemden iki kat daha yaygındı.',
      },
      {
        no: 21,
        soz: 'Anlaşmalı kargo tarifesiyle koli ve palet gönderimini daha ucuza yapın.',
        persona: ['P5', 'P3'],
        sikinti: 'Kargo maliyeti',
        platform: 'Toplu kargo anlaşması yapmalı. Satıcıların hacmi arttıkça tarife iyileşir.',
        ilkGun: 'ortakla',
        risk: 'Düşük. Hacim taahhüdü risk taşır.',
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
        soz: 'Elinizde kalan parti malı, fiyat açık piyasada düşmeden yalnız doğrulanmış toptan alıcılara kapalı vitrinde satın.',
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
        risk: 'Düşük. ETK Ek 1/2-b’ye göre satıcıyı kampanyaya zorlamak haksız uygulamadır.',
        dayanak: 'ETK Ek 1',
      },
      {
        no: 26,
        soz: 'Fiyatınız yalnız onayladığınız alıcılara görünsün. Rakibiniz göremesin.',
        persona: ['P1', 'P3'],
        sikinti: 'Fiyatın rakibe açık olması',
        platform: 'Fiyatı yalnız onaylı alıcıya göstermeli.',
        ilkGun: 'evet',
        risk: 'Düşük.',
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
        risk: 'Orta. Doğrulama gevşerse marka çöker.',
        dayanak: 'Alibaba Gold Supplier ve 2011’deki sahte satıcı skandalı',
      },
      {
        no: 28,
        soz: 'Alıcıyla anlaşmazlık olursa çözümü biz yönetiriz. Belirlenen kurallarla iadenin lojistiğini biz üstleniriz.',
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
        dayanak: 'ETK Ek 1/2-c ve ç, Yönetmelik madde 16',
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
    giris: 'Bu sözler, küçük ve sıkı bir çekirdekten büyüyen ağ yaklaşımını İstoç’a uyarlar. Önce tek sektörde ve tek blokta yoğunlaşmak gerekir.',
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
        platform: 'Kurucu satıcı konseyi kurmalı ve ilk döneme ömür boyu düşük komisyon gibi avantajlar tanımalı.',
        ilkGun: 'evet',
        risk: 'Düşük. Verilen avantaj geri alınamaz, bu yüzden sınırlı tutulmalı.',
        dayanak: 'Öneri',
      },
    ],
  },
];

/** Esnaf kapısında ilk 30 saniye: kaynaklı acı noktalarına ve ilk günden verilebilirliğe göre sıra. */
export const ILK_30_SANIYE: { ad: string; oneriler: number[]; soz: string }[] = [
  { ad: 'Açılış', oneriler: [6, 7], soz: 'Kendi müşterilerinizden siparişi burada alın, komisyon sıfır. Biz yeni müşteri getirirsek sadece o satıştan pay alırız. Satış yoksa ödeme yok.' },
  { ad: 'Para', oneriler: [1], soz: 'Platformdan gelen siparişin parası güvende. Çek ve senet derdi yok.' },
  { ad: 'Zaman', oneriler: [17, 18, 19], soz: 'WhatsApp siparişleri tek ekranda, fiyatlar tek tuşla güncel, faturalar otomatik.' },
  { ad: 'Ücretsiz kurulum', oneriler: [20], soz: 'Fotoğrafı biz çekeriz, mağazanız bugün açılır.' },
  { ad: 'İhracata yatkın esnafa', oneriler: [12, 13], soz: 'Yurt dışındaki müşterinize koliyi mikro ihracatla gönderin. Devlet desteği başvurusunu birlikte hazırlayalım.' },
];

export const BASLANGIC_NOTU =
  'P1 ve P5 esnafına para ve sıfır risk sözleriyle, P2 esnafına araç ve ihracat sözleriyle, P4 ve P6 esnafına ihracat sözleriyle başlayın. Bütün esnaf için ortak açılış sözü “sıfır komisyonla kendi müşteriniz” olmalı. Bu söz ilk günden tutulabilir ve alıcı tarafını esnafın kendi müşterileriyle doldurur.';

export const ESKI_SOZLER: { eski: string; yeni: string; neden: string; not?: string }[] = [
  {
    eski: '%100 satış garantisi',
    yeni: 'Platformdan gelen siparişin parası garanti. İlk 90 günde size yeni alıcıdan sipariş gelmezse hiçbir ücret ödemezsiniz.',
    neden: 'Bu söz tutulabilir. Risk, ödeme ortağında ve platformun kendi gelirinde kalır. Faire’in “her sipariş garantili satış” anlayışına denk düşer.',
  },
  {
    eski: 'RFQ ile gelmiş alıcı teklifleri',
    yeni: 'Ekibimizin topladığı gerçek alıcı talepleri size uygunsa, en fazla 3 satıcıdan biri olarak size iletilir. Şu ana kadar bu sektörde X talep topladık.',
    neden: 'Talep kalitelidir ve rakip azdır. IndiaMART satıcı kaybını bu yöntemle yönetir. Dürüst bir sayı itibarı korur.',
    not: 'X yerine gerçek talep sayısı yazılmalı.',
  },
];

export const KISALTMALAR: { kisa: string; acik: string }[] = [
  { kisa: 'B2B', acik: 'İşletmeden işletmeye satış.' },
  { kisa: 'BNPL', acik: '“Şimdi al, sonra öde.” Alıcı malı bugün alır, bedelini vadede öder.' },
  { kisa: 'Escrow', acik: 'Güvenli havuz ödeme. Alıcının parası teslimata kadar aracı kuruluşta bekler.' },
  { kisa: 'ETGB', acik: 'Elektronik ticaret gümrük beyannamesi. Mikro ihracatta kullanılan basit beyandır.' },
  { kisa: 'ETK', acik: '6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun. Ek 1. madde pazar yerlerinin satıcıya karşı yükümlülüklerini düzenler.' },
  { kisa: 'GMV', acik: 'Platformda yapılan satışların toplam tutarı.' },
  { kisa: 'KVKK', acik: '6698 sayılı Kişisel Verilerin Korunması Kanunu.' },
  { kisa: 'POS', acik: 'Kartla ödeme alan cihaz.' },
  { kisa: 'RFQ', acik: 'Teklif isteği. Alıcı ihtiyacını yazar, satıcılar fiyat verir.' },
  { kisa: 'SEO', acik: 'Arama motoru uyumu. Sayfaların Google aramalarında üst sıralarda çıkması için yapılan düzenlemedir.' },
];
