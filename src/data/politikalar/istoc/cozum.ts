import type { ProjePolitika } from '../types';

export const politika: ProjePolitika = {
  "id": "cozum",
  "proje": "istoc",
  "ad": "Danışman ve hizmet firması",
  "amac": "Hizmet verdiğiniz işletmeyi iStoc ile buluşturun. Ürün bilgisi ve alıcı görüşmesi ihtiyacını doğru aktarın.",
  "iliski": "Bağımsız hizmet ortağısınız. Şirketin çalışanı değilsiniz. İşletme size zaten güvenir. iStoc’u bu güvene dayanarak önerirsiniz. Kurulumu ve desteği şirket yapar. Kazancınızı şirkete fatura keserek alırsınız.",
  "gorev": [
    "Müşterinizin satış, katalog ve alıcı görüşmesi ihtiyacını öğrenin.",
    "Katkı düzeyinizi ortaklık sorumlusuyla yazılı belirleyin.",
    "Müşteri kaydını ortaklık sorumlusuna açtırın.",
    "Kurulum ve destek için müşteriyi şirkete devredin."
  ],
  "sinir": [
    "Müşteri adına yetkiniz yoksa sözleşme kabul edemezsiniz.",
    "Fiyat, fiyat tablosundaki fiyattır. Fiyat herkes için aynıdır.",
    "Ürün fiyatını değiştiremezsiniz. Müşteriden ürün bedeli alamazsınız.",
    "Alıcı bulma, sipariş veya satış garantisi veremezsiniz.",
    "Müşterinin izni olmadan ürün görselini veya kataloğunu paylaşmayın.",
    "Kendi adınıza iStoc kurulum veya destek sözü vermeyin. Bu işleri şirket yapar."
  ],
  "adimlar": [
    {
      "baslik": "Katkı düzeyinizi belirleyin",
      "metin": [
        "Ortaklık sorumlusu yapacağınız işi sizinle belirler.",
        "Yalnız tanıştırma, ürün gösterimi ve satışı kapatma farklı katkılardır.",
        "Komisyon hesabı bu katkı seviyesine bağlıdır.",
        "Katkı seviyesi yazılmadan müşteri işine başlamayın."
      ]
    },
    {
      "baslik": "İşletmenin ticari ihtiyacını konuşun",
      "metin": [
        "Mevcut hizmet ilişkiniz içinde ürün satışı ihtiyacını sorun.",
        "Ürün bilgisinin hazır olup olmadığını öğrenin.",
        "Ulaşmak istediği alıcı türünü not edin.",
        "Müşteri ileti istemezse yeni ileti göndermeyin."
      ]
    },
    {
      "baslik": "Müşteri kaydını kabul ettirin",
      "metin": [
        "Şirket her firmayı yalnız bir ortağın kaydına yazar.",
        "Kayıtta işletmenin ürün grubunu ve hedef alıcısını belirtin.",
        "Ortaklık sorumlusu aynı işletmenin başka kaydını kontrol eder.",
        "Kayıt kabul edilmeden müşteriyi kendinize ait saymayın.",
        "Kabul yanıtını saklayın. Sonra ürün bilgisi hazırlığına geçin."
      ]
    },
    {
      "baslik": "Ürün bilgisinin sahibini netleştirin",
      "metin": [
        "Ürün bilgisi ve görsellerin hak sahibini öğrenin.",
        "Hak sahibinin kullanım iznini kontrol edin ve yazılı kaydedin.",
        "Ürün bilgisinin doğruluğunu işletmenin yetkilisi onaylasın."
      ]
    },
    {
      "baslik": "Ürün gösterimini yapın veya devredin",
      "metin": [
        "Katkınız ürün gösterimini kapsıyorsa gösterimi siz yapın.",
        "Katkınız gösterimi kapsamıyorsa ürün uzmanıyla birlikte bir görüşme planlayın.",
        "Gösterimde işletmenin kendi ürünlerinden izinli örnek kullanın.",
        "Görüşme notunu kayda ekleyin."
      ]
    },
    {
      "baslik": "Teklifi ve sözleşmeyi tamamlayın",
      "metin": [
        "Yetkili satış sorumlusu teklifi fiyat tablosundaki fiyatla hazırlar.",
        "Kendi danışmanlık bedeliniz varsa teklifte ayrı gösterin.",
        "İşletme indirim isterse fiyatın herkes için aynı olduğunu söyleyin. Talebi kimseye iletmeyin.",
        "Müşteri sözleşmeyi kabul edince kurulum devrine geçin."
      ]
    },
    {
      "baslik": "Kurulumu şirkete devredin",
      "metin": [
        "Kurulumu ve desteği şirket yürütür.",
        "Devir notuna müşterinin ihtiyacını ve hazır ürün bilgisini yazın.",
        "Müşteri destek için size gelirse talebi şirkete yönlendirin."
      ]
    },
    {
      "baslik": "Tahsilatı ve ödemenizi izleyin",
      "metin": [
        "Finans ekibi işletmenin ödemesini ve iade durumunu doğrular.",
        "Finans ekibi komisyonu yazılı katkı seviyenize göre hesaplar.",
        "Ödeme doğrulanınca kazancınız için şirkete fatura kesersiniz.",
        "Fatura, vergi ve stopaj uygulamasını mali müşaviriniz doğrulasın. Stopaj, ödemeden yapılan vergi kesintisidir.",
        "Şirketin komisyon listesindeki katkı seviyesini kendi kaydınızla karşılaştırın."
      ]
    },
    {
      "baslik": "Yenilemeyi veya ayrılığı yönetin",
      "metin": [
        "Yenileme öncesinde işletmenin alıcı görüşmelerini birlikte değerlendirin.",
        "Müşteri yenilemezse gerekçeyi kayda yazın.",
        "Ortaklık biterse bekleyen işleri ortaklık sorumlusuna devredin."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "iStoc",
      "ad": "Katalog stüdyosundan hizmet alan toptancı",
      "ihtiyac": "Örneğin bu toptancı her sezon 50 ile 300 ürünlük yeni katalog çektirebilir. Toptancı hazırlanan ürün bilgisini alıcılarla düzenli paylaşmak isteyebilir.",
      "ulasim": "Katalog teslim toplantısında işletme sahibine sorun.",
      "mesaj": "Hazırladığımız kataloğu alıcılarınızla nasıl paylaşıyorsunuz?",
      "uygunluk": "Katalog hizmetini iStoc’u alma şartına bağlamayın.",
      "sonrasi": "Toptancı ilgilenirse ürün uzmanıyla birlikte bir görüşme planlayın."
    },
    {
      "urun": "iStoc",
      "ad": "İnternetten ihracat danışmanlığı alan üretici",
      "ihtiyac": "Örneğin bu üretici 10 ile 50 çalışanla ilk yurt dışı müşterilerini arıyor olabilir. Üretici yurt dışı alıcılarla ürün bilgisini düzenli paylaşmak isteyebilir.",
      "ulasim": "Danışmanlık görüşmesinde ihracat sorumlusuna sorun.",
      "mesaj": "Alıcıların istediği ürün bilgisi sizde hazır mı?",
      "uygunluk": "İhracat veya alıcı bulma başarısını garanti etmeyin.",
      "sonrasi": "Ürün bilgisi hazırsa kaydı açtırın. Hazır değilse önce hazırlığı konuşun."
    },
    {
      "urun": "iStoc",
      "ad": "İşletme yazılımı veya kasa sistemi bayisinin toptancı müşterisi",
      "ihtiyac": "Örneğin bu toptancı 3 ile 20 çalışanla stoğunu bir ön muhasebe programında tutabilir. İşletme mevcut stok bilgisini ürün sunumunda kullanmak isteyebilir.",
      "ulasim": "Yazılım bakım ziyaretinde işletmenin yetkilisine sorun.",
      "mesaj": "Stok listenizi alıcılara nasıl gönderiyorsunuz?",
      "uygunluk": "Teknik ekip doğrulamadan otomatik bağlantı sözü vermeyin.",
      "sonrasi": "Teknik ekip uygun bulursa kapsamı kayda yazın."
    },
    {
      "urun": "iStoc",
      "ad": "Lojistik veya gümrük hizmeti alan ihracatçı",
      "ihtiyac": "Örneğin bu ihracatçı ayda birkaç kez yurt dışına palet veya konteyner gönderebilir. İhracatçı yeni alıcılarla ürün görüşmesini düzenlemek isteyebilir.",
      "ulasim": "Sevkiyat planlama görüşmesinde dış ticaret sorumlusuna sorun.",
      "mesaj": "Yeni alıcılarla ürün görüşmelerini nasıl takip ediyorsunuz?",
      "uygunluk": "Sevkiyat hizmetinizi iStoc kullanımına bağlamayın.",
      "sonrasi": "İhracatçı ilgilenirse kaydı açtırın ve ürün gösterimi planlayın."
    }
  ],
  "programKitleleri": {
    "gelistirme": [
      {
        "urun": "iStoc",
        "ad": "Satışa ilk kez hazırlanan küçük üretici",
        "ihtiyac": "Örneğin bu atölye 1 ile 10 çalışanla çalışabilir. Ürün fotoğrafları hazır olmayabilir. Atölye ürün bilgisini satışa hazır hâle getirmek için yardım isteyebilir.",
        "ulasim": "Katalog veya fotoğraf hizmeti verdiğiniz müşterilerinize sorun.",
        "mesaj": "Ürünlerinizi satışa hazır göstermek için en çok neye ihtiyacınız var?",
        "uygunluk": "Satıcının yetkilisi ürün bilgisini onaylamazsa satıcıyı hazır saymayın.",
        "sonrasi": "Satıcıyı ortaklık sorumlusuna aday olarak bildirin."
      },
      {
        "urun": "iStoc",
        "ad": "Siparişi telefonla alan aile toptancısı",
        "ihtiyac": "Örneğin bu toptancı 5 ile 20 çalışanla uzun yıllardır aynı çarşıda çalışabilir. Ürün listesini dijital kataloğa ilk kez taşıyor olabilir.",
        "ulasim": "E-ticaret ajansınızın tanıtım toplantısında işletme sahibine sorun.",
        "mesaj": "Ürün listenizi dijital kataloğa taşımak ister misiniz?",
        "uygunluk": "Eksikleri listelemeden hazırlık için tarih sözü vermeyin.",
        "sonrasi": "Hazırlık bitince kanıtları ortaklık sorumlusuna gönderin."
      }
    ],
    "arz": [
      {
        "urun": "iStoc",
        "ad": "Sektör derneğine üye üretici",
        "ihtiyac": "Örneğin bu üye 5 ile 50 çalışanla mobilya veya tekstil üretebilir. Üye ürünlerini derneğin dışındaki toptancılara göstermek isteyebilir.",
        "ulasim": "Dernek bülteninde tanıtım olduğu açık bir duyuru yayımlayın.",
        "mesaj": "Ürünlerinizi yeni toptan alıcılara göstermek ister misiniz?",
        "uygunluk": "Üye listesini şirketle paylaşmayın. İlgilenen üye kendisi başvursun.",
        "sonrasi": "Şirket başvuran üyenin mağaza sayfasını kontrol eder."
      },
      {
        "urun": "iStoc",
        "ad": "Ticaret merkezi yönetimine bağlı dükkân",
        "ihtiyac": "Örneğin bu dükkân bir toptan ticaret merkezinde 2 ile 10 çalışanla kiracı olabilir. Dükkân merkeze gelmeyen alıcılara da ulaşmak isteyebilir.",
        "ulasim": "Merkez yönetiminin dükkân toplantısında kısa bilgi verin.",
        "mesaj": "Merkeze gelemeyen alıcılarınız ürünlerinizi nasıl görüyor?",
        "uygunluk": "Başvuruyu kira veya üyelik şartı yapmayın.",
        "sonrasi": "İlgilenen dükkân şirketin başvuru yolunu kendisi kullansın."
      }
    ],
    "talep": [
      {
        "urun": "iStoc",
        "ad": "Otel veya restoranın satın alma sorumlusu",
        "ihtiyac": "Örneğin bu işletme 10 ile 50 çalışanla her hafta toptan gıda ve temizlik ürünü alabilir. Satın alma sorumlusu yeni tedarikçi arayabilir.",
        "ulasim": "Mevcut iş ilişkiniz içinde satın alma sorumlusuyla görüşün.",
        "mesaj": "Bu ay hangi ürünler için yeni tedarikçi arıyorsunuz?",
        "uygunluk": "Alıcının paylaşım izni yoksa talebi kimseyle paylaşmayın.",
        "sonrasi": "İzinli talebi kayda yazın ve sonucunu takip edin."
      },
      {
        "urun": "iStoc",
        "ad": "Yerel market veya kırtasiye zinciri",
        "ihtiyac": "Örneğin bu zincirin 5 ile 30 mağazası olabilir. Zincir yeni bir ürün grubu için toptan satıcı arayabilir.",
        "ulasim": "Zincirle zaten çalışıyorsanız satın alma toplantısında sorun.",
        "mesaj": "Yeni ürün grubunuz için iStoc’taki toptancılara talep göndermemi ister misiniz?",
        "uygunluk": "Yalnız kayıt toplamak için görüşme yapmayın.",
        "sonrasi": "Alıcı izin verirse talebi kayda yazın."
      }
    ],
    "hizmet": [
      {
        "urun": "iStoc",
        "ad": "Şehir dışına sevkiyat yapan toptancı",
        "ihtiyac": "Örneğin bu toptancı 3 ile 20 çalışanla haftada birkaç kez başka illere koli gönderebilir. Toptancı sevkiyatı siparişle birlikte izlemek isteyebilir.",
        "ulasim": "Önce şirketten “iStoc Onaylı Hizmet” rozetini kullanma izni alın. Sonra iStoc’taki hizmet sayfanızda tanıtım yapın.",
        "mesaj": "Şehir dışı siparişlerinizin sevkiyatını nasıl planlıyorsunuz?",
        "uygunluk": "Hizmetinizi iStoc’u kullanma şartına bağlamayın.",
        "sonrasi": "Satıcı isterse hizmeti iStoc üzerinden sunun. Sonucu kayda yazın."
      },
      {
        "urun": "iStoc",
        "ad": "İlk yurt dışı siparişini alan üretici",
        "ihtiyac": "Örneğin bu üretici 10 ile 50 çalışanla ilk ihracat siparişini hazırlıyor olabilir. Gümrük, kalite belgesi veya ödeme için destek isteyebilir.",
        "ulasim": "Önce rozet iznini alın. Sonra iStoc’taki hizmet sayfanızda hangi işlemi yaptığınızı anlatın.",
        "mesaj": "İlk ihracat siparişinizde hangi işlem için desteğe ihtiyacınız var?",
        "uygunluk": "Gümrük veya ödeme sonucunu garanti etmeyin.",
        "sonrasi": "Satıcı isterse hizmeti iStoc üzerinden sunun. Sonucu kayda yazın."
      }
    ],
    "teknoloji": [
      {
        "urun": "iStoc",
        "ad": "Stok programı kullanan toptancı",
        "ihtiyac": "Örneğin bu toptancı 5 ile 30 çalışanla ürün kodlarını ve stoğunu programınızda tutabilir. Aynı ürün bilgisini iki yere ayrı ayrı girmek istemeyebilir.",
        "ulasim": "Kendi müşteri duyurunuzda iStoc ile yazılım bağlantısını tanıtın. Duyuruda reklam olduğunu belirtin.",
        "mesaj": "Stok listeniz iStoc kataloğunuza kendiliğinden aktarılsın ister misiniz?",
        "uygunluk": "Teknik ekip onay vermeden bu özelliği duyurmayın. Müşteri fiyat tablosundaki fiyatı öder.",
        "sonrasi": "İlgilenen müşteri iStoc’a kendisi başvursun."
      },
      {
        "urun": "iStoc",
        "ad": "Şubelerinde aynı kasa sistemini kullanan toptancı",
        "ihtiyac": "Örneğin bu toptancının 3 ile 10 şubesi olabilir. Merkez şubelerin stoğunu tek katalogda göstermek isteyebilir.",
        "ulasim": "Bakım ziyaretinde merkezdeki yetkiliyle konuşun.",
        "mesaj": "Şubelerinizin stoğunu tek katalogda göstermek ister misiniz?",
        "uygunluk": "Müşteriye indirim sözü vermeyin. Müşteri fiyat tablosundaki fiyatı öder.",
        "sonrasi": "Merkez ilgilenirse teknik ekiple örnek veriyle deneme planlayın."
      }
    ],
    "bolge": [
      {
        "urun": "iStoc",
        "ad": "Üretim ağırlıklı ildeki sanayi sitesi işletmeleri",
        "ihtiyac": "Örneğin Kayseri, Denizli ya da Gaziantep’teki üreticiler olabilir. Bu üreticilerde 5 ile 30 çalışan olabilir. Bu işletmeler büyük şehirdeki toptancılara ulaşmak isteyebilir.",
        "ulasim": "İl ticaret odasının veya sanayi sitesi yönetiminin tanıştırmasıyla ziyaret edin.",
        "mesaj": "Ürünlerinizi büyük şehirlerdeki alıcılara nasıl ulaştırıyorsunuz?",
        "uygunluk": "Bölgede tek yetkili olduğunuzu söylemeyin.",
        "sonrasi": "Satıcıları ortaklık sorumlusuna bildirin."
      },
      {
        "urun": "iStoc",
        "ad": "İlçe çarşısındaki toptancı",
        "ihtiyac": "Örneğin bu toptancı ilçe merkezinde 2 ile 10 çalışanla çevredeki küçük marketlere mal verebilir. İlçe dışındaki alıcılara da ürün göstermek isteyebilir.",
        "ulasim": "İlçe esnaf odasının toplantısında kısa tanıtım isteyin.",
        "mesaj": "İlçe dışındaki alıcılara ürün listenizi nasıl gönderiyorsunuz?",
        "uygunluk": "Program başlamadan bölge yetkisi vaat etmeyin.",
        "sonrasi": "Satıcı aktif olunca aktif satıcı listesine yazın."
      }
    ]
  },
  "ortakBulma": [
    "Yeni hizmet ortaklarını meslek ağlarından, çarşı derneklerinden veya fuarlardan bulabilirsiniz.",
    "Yeni ortağa ulaşırken de iletişim izni kuralları geçerlidir.",
    "Ortaklık sorumlusu yeni firmanın uygunluğunu incelesin.",
    "Şirket ortak getirmeye para ödemez. Yeni ortağı müşteri satışı saymayın."
  ],
  "sorunlar": [
    {
      "kosul": "Aynı işletme başka ortağa kayıtlıysa",
      "islem": "Ortaklık sorumlusu kayıt tarihini ve katalog hazırlık kanıtlarını karşılaştırsın.",
      "sonuc": "Ortaklık sorumlusu kararı iki tarafa yazılı bildirir. Karar çıkmadan komisyon vaat etmeyin."
    },
    {
      "kosul": "Katalogdaki ürün bilgisi hatalıysa",
      "islem": "İşletmenin yetkilisi doğru bilgiyi yazılı versin.",
      "sonuc": "Şirket kaydı düzeltir. Düzeltmeden önce alıcıya yeni bilgi göndermez."
    },
    {
      "kosul": "Biri bir görselin kullanım hakkına itiraz ederse",
      "islem": "Ortaklık sorumlusu görseli yayından kaldırtsın ve izin kaydını istesin.",
      "sonuc": "Şirket izin kanıtlanmadan görseli yeniden kullanmaz."
    },
    {
      "kosul": "İşletme alıcı görüşmesinden sonuç alamazsa",
      "islem": "Ürün uzmanı işletmeyle ürün bilgisini ve hedef alıcıları gözden geçirsin.",
      "sonuc": "Ürün uzmanı sonuç garantisi olmadığını müşteriye açıkça hatırlatır."
    },
    {
      "kosul": "Müşteri destek için size gelirse",
      "islem": "Talebi şirketin destek ekibine yönlendirin ve kayda yazın.",
      "sonuc": "Destek ekibi talebi yanıtlar. Siz yeni destek sözü vermezsiniz."
    },
    {
      "kosul": "Müşteri indirim veya farklı fiyat isterse",
      "islem": "Fiyatın herkes için aynı olduğunu söyleyin. Talebi kimseye iletmeyin.",
      "sonuc": "Fiyat tablosundaki fiyat geçerli kalır. Şirket yeni teklif hazırlamaz."
    },
    {
      "kosul": "Katkı düzeyinize veya komisyon tutarına itiraz ederseniz",
      "islem": "Finans sorumlusu katkı kaydını ve tahsilatı incelesin.",
      "sonuc": "Finans sorumlusu ödeme kararını imzalı sözleşmeye göre yazılı açıklar."
    },
    {
      "kosul": "Müşteri iade isterse",
      "islem": "Finans sorumlusu iade talebini ve komisyon kaydını birlikte incelesin.",
      "sonuc": "Finans sorumlusu komisyonun durumunu imzalı sözleşmeye göre yazılı bildirir."
    },
    {
      "kosul": "Ortaklık sona ererse",
      "islem": "Bekleyen kayıtları ve katalog işlerini ortaklık sorumlusuna devredin.",
      "sonuc": "Şirket erişimleri kapatsın. Finans sorumlusu açık ödemeleri sözleşmeye göre sonuçlandırsın."
    }
  ],
  "anlasma": [
    {
      "baslik": "Taraflar ve katkı seviyesi",
      "metin": [
        "Sözleşmede şirketin ve firmanızın unvanı yer alır.",
        "Katkı düzeyinizi ve komisyonun hangi katkıya bağlı olduğunu yazın.",
        "Ürün satışıyla kendi danışmanlık hizmetinizi ayrı tanımlayın."
      ]
    },
    {
      "baslik": "Müşteri kaydı ve yetki",
      "metin": [
        "Hangi katkının hangi kanıtla kabul edileceğini yazın.",
        "Teklif onayının kimde olduğunu yazın. Fiyat, fiyat tablosundaki fiyattır.",
        "Tek yetkili olma hakkı verilip verilmediğini yazın. Şirket özel programlarda bu hakkı vermez."
      ]
    },
    {
      "baslik": "Ürün bilgisi ve içerik hakları",
      "metin": [
        "Katalog içeriğinin sahibini ve kullanım iznini yazın.",
        "Ürün bilgisinin doğruluğundan kimin sorumlu olduğunu yazın.",
        "Şirket markasını hangi izinle kullanacağınızı yazın."
      ]
    },
    {
      "baslik": "Geçerli sürüm ve ödeme",
      "metin": [
        "Anlaşmanın hangi hesap sürümüne bağlı olduğunu yazın.",
        "Satış ortaklığı hesabındaki bir değişiklik imzalı anlaşmayı kendiliğinden değiştirmez.",
        "Finans sorumlusu, ödemenin hangi olaydan sonra yapılacağını yazsın. Ödeme gününü de yazsın.",
        "Finans ekibi fatura, vergi ve döviz uygulamasını açıklasın."
      ]
    },
    {
      "baslik": "Alıcı ve müşteri verisi",
      "metin": [
        "Hukuk danışmanı alıcı iletişim bilgisinin hangi yasal izinle kullanılacağını yazsın.",
        "Hukuk danışmanı bilgilendirme metnini ve açık rıza metnini ayrı değerlendirsin.",
        "Hukuk danışmanı müşteri verisinin başka amaçla kullanılmasını ayrıca değerlendirsin."
      ]
    },
    {
      "baslik": "Değişiklik, sona erme ve itiraz",
      "metin": [
        "Değişikliğin nasıl kabul edileceğini yazın.",
        "Ortaklık biterse katalog içeriğinin kimde kalacağını yazın.",
        "İtirazın hangi kanala yapılacağını ve kimin yanıtlayacağını yazın.",
        "Şirket sözleşmeyi onaylayacak kişiyi henüz belirlemedi. Bu iş için ortaklık yöneticisi görevini öneriyoruz.",
        "Bu metin imzalı veya hukuken onaylı bir sözleşme değildir."
      ]
    }
  ],
  "acikKonular": [
    {
      "baslik": "Katkı düzeyiniz nasıl kanıtlanacak?",
      "mevcut": "Komisyon, tanıştırma, ürün gösterimi veya satışı kapatma katkısına göre değişir.",
      "eksik": "Şirket hangi kaydın hangi katkıyı kanıtladığını henüz yazmadı.",
      "islem": "Ortaklık sorumlusu her katkı için kanıt türünü belirlesin.",
      "kanit": "Örnek bir müşteride iki taraf katkı seviyesini aynı okusun.",
      "firsat": "Net bir kanıt ödeme günündeki katkı tartışmasını azaltır. Danışman komisyonunu beklemeden alır ve yeni müşteri getirmeye devam eder.",
      "durdur": "Kanıt türü belirlenmeden ortaklık sorumlusu üst katkı seviyesi vaat etmesin."
    },
    {
      "baslik": "Ürün bilgisinin doğruluğundan kim sorumlu?",
      "mevcut": "Şirket katalog içeriğinin sorumluluğunu henüz tanımlamadı.",
      "eksik": "Hatalı ürün bilgisinde sorumluluk ve düzeltme yolu açık değildir.",
      "islem": "Hukuk danışmanı içerik sorumluluğu için ek madde önersin.",
      "kanit": "Her işletme için ürün bilgisi onay kaydı bulunsun.",
      "firsat": "Onaylı ürün bilgisi alıcı güvenini artırabilir.",
      "durdur": "Onay kaydı yoksa ürün bilgisini yayına almayın."
    },
    {
      "baslik": "Mali müşavir seçeneği burada nasıl uygulanır?",
      "mevcut": "Satış ortaklığı hesabında iStoc seçilince mali müşavir seçeneği de görünür. Bu, tamamlanmış bir uygulama kararı değildir.",
      "eksik": "Şirket seçeneğin iStoc müşterisinde nasıl uygulanacağını henüz yazmadı.",
      "islem": "Finans sorumlusu seçeneğin uygulanıp uygulanmayacağını yazılı belirlesin.",
      "kanit": "Karar kaydı ve meslek kuralı değerlendirmesi bulunsun.",
      "firsat": "Net bir karar mali müşavir ofislerini yeni bir ortak kanalı yapar. Ofisler müşterilerine iStoc’u güvenle önerebilir.",
      "durdur": "Karar yazılmadan mali müşavire komisyon veya indirim sözü vermeyin."
    },
    {
      "baslik": "Genel plan yeterli kurulum kapasitesi ayırıyor mu?",
      "mevcut": "Parametreler sayfası personel ve bütçe planını gösterir.",
      "eksik": "Planlanan kapasite gerçek kurulum kapasitesini kanıtlamaz.",
      "islem": "Operasyon yöneticisi mevcut kurulum kapasitesini ayrı doğrulasın.",
      "kanit": "Kabul edilen her müşteriye bir kurulum sorumlusu atanmış olsun.",
      "firsat": "Kapasite görünürse danışman müşterisine doğru başlangıç tarihi verir. Müşteri tarihi bilerek sözleşmeyi imzalar.",
      "durdur": "Kurulum sorumlusu yoksa yeni müşteriye başlangıç tarihi vermeyin."
    }
  ],
  "kesifler": [
    {
      "baslik": "Aynı katalog birden çok yerde mi dolaşıyor?",
      "sinyal": "Aynı ürün bilgisi farklı ortaklardan gelebilir.",
      "kontrol": "Ortaklık sorumlusu yeni kaydı mevcut kayıtlarla karşılaştırsın.",
      "tepki": "Çakışma varsa ortaklık sorumlusu kaydı karar çıkana kadar bekletsin.",
      "kayit": "Ortaklık sorumlusu karşılaştırmayı ve kararı kayda yazsın."
    },
    {
      "baslik": "Alıcı görüşmesi beklentisi gerçekçi mi?",
      "sinyal": "İşletme kısa sürede sipariş bekleyebilir.",
      "kontrol": "Ürün uzmanı ilk görüşmede beklentiyi işletmeye sorsun.",
      "tepki": "Beklenti gerçekçi değilse ürün uzmanı sonuç garantisi olmadığını yazılı açıklasın.",
      "kayit": "Ürün uzmanı açıklamayı ve işletmenin yanıtını kayda eklesin."
    },
    {
      "baslik": "Kurulum devrinde bilgi kayboluyor mu?",
      "sinyal": "Kurulum ekibi aynı soruları işletmeye yeniden sorabilir.",
      "kontrol": "Operasyon yöneticisi örnek bir devir notunu incelesin.",
      "tepki": "Not eksikse operasyon yöneticisi devir notu biçimini sizinle düzeltsin.",
      "kayit": "Operasyon yöneticisi eksik alanları ve düzeltmeyi kayda yazsın."
    }
  ],
  "firsatlar": [
    {
      "baslik": "Katalog teslim toplantısında iStoc’u konuşun",
      "neden": "Katalog stüdyosu müşterisine hazır ürün bilgisi teslim eder. Bu bilgi alıcılara ulaşmadan dosyada kalabilir.",
      "ilkAdim": "Ortaklık sorumlusu stüdyoyla teslim toplantısında iStoc’u kısaca anlatma kuralını yazar. Stüdyo bunu zorunlu paket yapmaz.",
      "olcu": "Ortaklık sorumlusu iStoc’u konuşan teslim toplantılarını ve açılan müşteri kayıtlarını sayar."
    },
    {
      "baslik": "Yazılım bayilerini teknoloji ortaklığına hazırlayın",
      "neden": "Yazılım ve kasa sistemi bayileri ana programda müşteri getirir. Bugün kimse otomatik bağlantı sözü veremez. Teknoloji programı ikinci aşamada başlar.",
      "ilkAdim": "Ortaklık sorumlusu ana programdaki yazılım bayilerini listeler. Teknoloji programı başlayınca teknik ekip önce bu bayilerle görüşür.",
      "olcu": "Ortaklık sorumlusu listedeki bayileri ve teknik incelemeye alınan bağlantıları sayar."
    },
    {
      "baslik": "Lojistik firmalarını iki programda değerlendirin",
      "neden": "Lojistik ve gümrük firmaları hem müşteri getirebilir hem onaylı hizmet sunabilir. Hizmet programının ödeme modeli henüz yazılı değildir.",
      "ilkAdim": "Ortaklık sorumlusu ana programdaki lojistik firmalarına hizmet ortağı programını da anlatır. Finans sorumlusu ödeme modelini yazınca ilk anlaşmayı yapar.",
      "olcu": "Ortaklık sorumlusu iki programda da kaydı olan firmaları ve bu firmaların getirdiği müşterileri sayar."
    },
    {
      "baslik": "Çarşı dernekleriyle kurumsal satıcı programını başlatın",
      "neden": "Çarşı dernekleri ve üretici birlikleri rehberde yeni ortak kaynağıdır. Kurumsal satıcı programı satıcı üyeleri olan kurumlar içindir.",
      "ilkAdim": "Ortaklık sorumlusu bir çarşı derneğiyle iş birliği anlaşması (protokol) için görüşme planlar. Dernek üyelerine duyuruyu kendisi yapar.",
      "olcu": "Ortaklık sorumlusu iş birliği anlaşması imzalayan kurumları ve bu kurumlardan açılan mağaza sayfalarını sayar."
    },
    {
      "baslik": "Mali müşavirleri bordro ürününe yönlendirin",
      "neden": "Mali müşavir seçeneğinin iStoc’ta nasıl uygulanacağı belli değildir. Mali müşavirler, şirketin SGK teşvik ve bordro ürünü için daha uygun bir yol olabilir.",
      "ilkAdim": "Finans sorumlusu mali müşavir seçeneğinin hangi üründe uygulanacağını yazar. Ortaklık sorumlusu iStoc’a gelen müşavirleri bordro ürünü ekibiyle tanıştırır.",
      "olcu": "Ortaklık sorumlusu tanıştırılan müşavir ofislerini ve açılan ortaklık kayıtlarını sayar."
    }
  ],
  "haftalik": [
    "Her hafta bekleyen müşteri kayıtlarınızı ve kararları inceleyin.",
    "Ortaklık sorumlusu o hafta kabul edilen kayıtları açılan kayıtlarla karşılaştırsın.",
    "Operasyon ekibi o hafta tamamlanan kurulumları devredilen müşterilerle karşılaştırsın.",
    "Finans ekibi uygun tahsilatı ve itirazlı tutarı ayrı göstersin.",
    "Bir oran iki hafta düşerse ortaklık sorumlusu nedeni sizinle konuşsun.",
    "Anlaşmadan önce görevinizi, ödemeyi ve durma koşulunu kendi sözlerinizle anlatın. Ortaklık sorumlusu anlatımınızı dinlesin."
  ],
  "programlar": {
    "ana": [
      "İşletmeyi iStoc ile tanıştırırsınız. Kurulumu ve desteği şirket yapar.",
      "Finans ekibi komisyonu yazılı katkı seviyenize göre hesaplar.",
      "Şirket ortak getirmeye para ödemez."
    ],
    "gelistirme": [
      "Bu programda aday satıcıları iStoc’ta satışa hazır hâle getirirsiniz.",
      "Şirket komisyonu satıcının ilk aylarda ödediği ücretten hesaplar.",
      "Oran örnektir. Finans sorumlusu oranı kesinleştirmeden iş kabul etmeyin.",
      "Satıcının ne zaman “satışa hazır” sayılacağını önceden yazın. Bunu kimin onaylayacağını da yazın."
    ],
    "arz": [
      "Bu program satıcı üyeleri olan kurum içindir.",
      "Kuruma bağlı satıcıları iStoc’a getirirsiniz. Bu programda şirket nakit ödeme yapmaz.",
      "Program, şirket yeterli sayıda mağaza sayfasını doğrulayınca başlar. Gereken sayı program koşullarında yazar.",
      "Üye sonuç raporunu ve veri sınırını iş birliği anlaşmasına yazın."
    ],
    "talep": [
      "Bu programda alıcıların satın alma taleplerini toplarsınız.",
      "Yalnız kayıt açtığınız için ücret almazsınız.",
      "Talep sahibinin paylaşım izni yoksa talebi kimseyle paylaşmayın.",
      "Şirket görev ücretini iki parçada öder. İlk parçayı kapsam kabulünde, ikincisini sonuç takibinde öder.",
      "Görev kapsamını ve sonuç kabulünü yetkili kişiyle belirleyin."
    ],
    "hizmet": [
      "Bu programda iStoc satıcısına lojistik, ödeme veya benzeri hizmet sunarsınız.",
      "Şirket gelir paylaşımı oranını henüz belirlemedi.",
      "Gelir payını, sorumluluğu ve rozeti ayrı ayrı yazılı kabul edin."
    ],
    "teknoloji": [
      "Bu program iStoc’a doğrudan bağlanan yazılım firması içindir.",
      "Program ikinci aşamada başlar.",
      "Teknik kabul ve ticari koşullar kesinleşmeden bağlantı sözü vermeyin.",
      "Müşterilerinize indirim sözü vermeyin. Müşteri fiyat tablosundaki fiyatı öder."
    ],
    "bolge": [
      "Bu programda belirli bir bölgede satıcı ağı kurarsınız.",
      "Bölge temsilciliği tek yetkili olma hakkı vermez.",
      "Programın pazar ve başlama koşulu sağlanmadan bölge yetkisi vaat etmeyin."
    ]
  }
};
