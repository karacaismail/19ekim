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
    "Ürün fiyatını değiştiremezsiniz. Müşteriden ürün bedeli alamazsınız.",
    "Alıcı bulma, sipariş veya satış garantisi veremezsiniz.",
    "Müşterinin izni olmadan ürün görselini veya katalogunu paylaşmayın.",
    "Kendi adınıza iStoc kurulum veya destek sözü vermeyin. Bu işleri şirket yapar."
  ],
  "adimlar": [
    {
      "baslik": "Katkı düzeyinizi belirleyin",
      "metin": [
        "Ortaklık sorumlusu yapacağınız işi sizinle belirler.",
        "Yalnız tanıştırma, ürün gösterimi ve satışı kapatma farklı katkılardır.",
        "Komisyon hesabı bu katkı düzeyine bağlıdır.",
        "Katkı düzeyi yazılmadan müşteri işine başlamayın."
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
        "Her firma yalnız bir ortağa yazılır.",
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
        "Kapsamıyorsa ürün uzmanıyla ortak görüşme planlayın.",
        "Gösterimde işletmenin kendi ürünlerinden izinli örnek kullanın.",
        "Görüşme notunu kayda ekleyin."
      ]
    },
    {
      "baslik": "Teklifi ve sözleşmeyi tamamlayın",
      "metin": [
        "Ürün teklifini yetkili satış sorumlusu onaylar.",
        "Kendi danışmanlık bedeliniz varsa teklifte ayrı gösterin.",
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
        "Komisyon, yazılı katkı düzeyinize göre hesaplanır.",
        "Ödeme doğrulanınca kazancınız için şirkete fatura kesersiniz.",
        "Fatura, vergi ve stopaj uygulamasını mali müşaviriniz doğrulasın.",
        "Hakediş dökümündeki katkı düzeyini kendi kaydınızla karşılaştırın."
      ]
    },
    {
      "baslik": "Yenilemeyi veya ayrılığı yönetin",
      "metin": [
        "Yenileme öncesinde işletmenin alıcı görüşmelerini birlikte değerlendirin.",
        "Müşteri yenilemezse gerekçeyi kayda yazın.",
        "Ortaklık biterse açık işleri ortaklık sorumlusuna devredin."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "iStoc",
      "ad": "Katalog stüdyosundan hizmet alan toptancı",
      "ihtiyac": "Toptancı hazırlanan ürün bilgisini alıcılarla düzenli paylaşmak isteyebilir.",
      "ulasim": "Katalog teslim toplantısında işletme sahibine sorun.",
      "mesaj": "Hazırladığımız katalogu alıcılarınızla nasıl paylaşıyorsunuz?",
      "uygunluk": "Katalog hizmetini iStoc satışına bağlı zorunlu paket yapmayın.",
      "sonrasi": "Toptancı ilgilenirse ürün uzmanıyla ortak görüşme planlayın."
    },
    {
      "urun": "iStoc",
      "ad": "İnternetten ihracat danışmanlığı alan üretici",
      "ihtiyac": "Üretici yurt dışı alıcılarla ürün bilgisini düzenli paylaşmak isteyebilir.",
      "ulasim": "Danışmanlık görüşmesinde ihracat sorumlusuna sorun.",
      "mesaj": "Alıcıların istediği ürün bilgisi sizde hazır mı?",
      "uygunluk": "İhracat veya alıcı bulma başarısını garanti etmeyin.",
      "sonrasi": "Ürün bilgisi hazırsa kaydı açtırın. Hazır değilse önce hazırlığı konuşun."
    },
    {
      "urun": "iStoc",
      "ad": "İşletme yazılımı veya kasa sistemi bayisinin toptancı müşterisi",
      "ihtiyac": "İşletme mevcut stok bilgisini ürün sunumunda kullanmak isteyebilir.",
      "ulasim": "Yazılım bakım ziyaretinde işletmenin yetkilisine sorun.",
      "mesaj": "Stok listenizi alıcılara nasıl gönderiyorsunuz?",
      "uygunluk": "Teknik ekip doğrulamadan otomatik bağlantı sözü vermeyin.",
      "sonrasi": "Teknik ekip uygun bulursa kapsamı kayda yazın."
    },
    {
      "urun": "iStoc",
      "ad": "Lojistik veya gümrük hizmeti alan ihracatçı",
      "ihtiyac": "İhracatçı yeni alıcılarla ürün görüşmesini düzenlemek isteyebilir.",
      "ulasim": "Sevkiyat planlama görüşmesinde dış ticaret sorumlusuna sorun.",
      "mesaj": "Yeni alıcılarla ürün görüşmelerini nasıl takip ediyorsunuz?",
      "uygunluk": "Sevkiyat hizmetinizi iStoc kullanımına bağlamayın.",
      "sonrasi": "İhracatçı ilgilenirse kaydı açtırın ve ürün gösterimi planlayın."
    }
  ],
  "ortakBulma": [
    "Yeni hizmet ortaklarını meslek ağlarından, çarşı derneklerinden veya fuarlardan bulabilirsiniz.",
    "Yeni ortağa ulaşırken de iletişim dayanağı kuralları geçerlidir.",
    "Ortaklık sorumlusu yeni firmanın uygunluğunu incelesin.",
    "Şirket ortak getirmeye para ödemez. Yeni ortağı müşteri satışı saymayın."
  ],
  "sorunlar": [
    {
      "kosul": "Aynı işletme başka ortağa kayıtlıysa",
      "islem": "Ortaklık sorumlusu kayıt tarihini ve katalog hazırlık kanıtlarını karşılaştırsın.",
      "sonuc": "Karar iki tarafa yazılı bildirilir. Karar çıkmadan komisyon vaat edilmez."
    },
    {
      "kosul": "Katalogdaki ürün bilgisi hatalıysa",
      "islem": "İşletmenin yetkilisi doğru bilgiyi yazılı versin.",
      "sonuc": "Şirket kaydı düzeltir. Düzeltmeden önce alıcıya yeni bilgi gönderilmez."
    },
    {
      "kosul": "Bir görselin kullanım hakkına itiraz edilirse",
      "islem": "Ortaklık sorumlusu görseli yayından kaldırtsın ve izin kaydını istesin.",
      "sonuc": "İzin kanıtlanmadan görsel yeniden kullanılmaz."
    },
    {
      "kosul": "İşletme alıcı görüşmesinden sonuç alamazsa",
      "islem": "Ürün uzmanı işletmeyle ürün bilgisini ve hedef alıcıları gözden geçirsin.",
      "sonuc": "Sonuç garantisi verilmediği müşteriye açıkça hatırlatılır."
    },
    {
      "kosul": "Müşteri destek için size gelirse",
      "islem": "Talebi şirketin destek ekibine yönlendirin ve kayda yazın.",
      "sonuc": "Destek ekibi talebi yanıtlar. Siz yeni destek sözü vermezsiniz."
    },
    {
      "kosul": "Katkı düzeyinize veya hakediş tutarına itiraz ederseniz",
      "islem": "Finans sorumlusu katkı kaydını ve tahsilatı incelesin.",
      "sonuc": "Finans sorumlusu ödeme kararını kabul edilen sözleşmeye göre yazılı açıklar."
    },
    {
      "kosul": "Müşteri iade isterse",
      "islem": "Finans sorumlusu iade talebini ve komisyon kaydını birlikte incelesin.",
      "sonuc": "Komisyonun durumu kabul edilen sözleşmeye göre yazılı bildirilir."
    },
    {
      "kosul": "Ortaklık sona ererse",
      "islem": "Açık kayıtları ve katalog işlerini ortaklık sorumlusuna devredin.",
      "sonuc": "Şirket erişimleri kapatsın. Açık ödemeler sözleşmeye göre sonuçlansın."
    }
  ],
  "anlasma": [
    {
      "baslik": "Taraflar ve katkı düzeyi",
      "metin": [
        "Sözleşmede şirketin ve firmanızın unvanı yazılır.",
        "Katkı düzeyinizi ve komisyonun hangi katkıya bağlı olduğunu yazın.",
        "Ürün satışıyla kendi danışmanlık hizmetinizi ayrı tanımlayın."
      ]
    },
    {
      "baslik": "Müşteri kaydı ve yetki",
      "metin": [
        "Hangi katkının hangi kanıtla kabul edileceğini yazın.",
        "Fiyat ve teklif onayının kimde olduğunu yazın.",
        "Tek yetkili olma hakkı verilip verilmediğini yazın. Özel programlarda bu hak verilmez."
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
        "Hesaplayıcıdaki değişiklik anlaşmayı kendiliğinden değiştirmez.",
        "Finans sorumlusu ödemeyi doğuran olayı ve ödeme gününü yazsın.",
        "Finans ekibi fatura, vergi ve döviz uygulamasını açıklamalıdır."
      ]
    },
    {
      "baslik": "Alıcı ve müşteri verisi",
      "metin": [
        "Alıcı iletişim bilgisinin hangi dayanakla işleneceği yazılmalıdır.",
        "Aydınlatma metni ile açık rıza ayrı değerlendirilmelidir.",
        "Müşteri verisinin başka amaçla kullanılması ayrıca değerlendirilmelidir."
      ]
    },
    {
      "baslik": "Değişiklik, sona erme ve itiraz",
      "metin": [
        "Değişikliğin nasıl kabul edileceğini yazın.",
        "Ortaklık biterse katalog içeriğinin kimde kalacağını yazın.",
        "İtirazın hangi kanala yapılacağını ve kimin yanıtlayacağını yazın.",
        "Sözleşme onay sorumlusu kaynakta belli değildir. Bu iş için ortaklık yöneticisi rolünü öneriyoruz.",
        "Bu metin imzalı veya hukuken onaylı bir sözleşme değildir."
      ]
    }
  ],
  "acikKonular": [
    {
      "baslik": "Katkı düzeyiniz nasıl kanıtlanacak?",
      "mevcut": "Komisyon, tanıştırma, ürün gösterimi veya satışı kapatma katkısına göre değişir.",
      "eksik": "Hangi kaydın hangi katkıyı kanıtladığı yazılı değildir.",
      "islem": "Ortaklık sorumlusu her katkı için kanıt türünü belirlesin.",
      "kanit": "Örnek bir müşteride katkı düzeyi iki tarafça aynı okunsun.",
      "firsat": "Açık kanıt, sonradan çıkan katkı tartışmasını azaltabilir.",
      "durdur": "Kanıt türü belirlenmeden üst katkı düzeyi vaat edilmesin."
    },
    {
      "baslik": "Ürün bilgisinin doğruluğundan kim sorumlu?",
      "mevcut": "Kaynak, katalog içeriğinin sorumluluğunu tanımlamaz.",
      "eksik": "Hatalı ürün bilgisinde sorumluluk ve düzeltme yolu açık değildir.",
      "islem": "Hukuk danışmanı içerik sorumluluğu için ek madde önersin.",
      "kanit": "Her işletme için ürün bilgisi onay kaydı bulunsun.",
      "firsat": "Onaylı ürün bilgisi alıcı güvenini artırabilir.",
      "durdur": "Onay kaydı yoksa ürün bilgisini yayına almayın."
    },
    {
      "baslik": "Mali müşavir seçeneği burada nasıl uygulanır?",
      "mevcut": "Hesaplayıcının iStoc görünümü de mali müşavir seçeneğini gösterir. Bu, tamamlanmış bir uygulama kararı değildir.",
      "eksik": "Seçeneğin iStoc müşterisinde nasıl uygulanacağı yazılı değildir.",
      "islem": "Finans sorumlusu seçeneğin uygulanıp uygulanmayacağını yazılı belirlesin.",
      "kanit": "Karar kaydı ve meslek kuralı değerlendirmesi bulunsun.",
      "firsat": "Açık karar, mali müşavirlerle güvenli çalışmayı sağlayabilir.",
      "durdur": "Karar yazılmadan mali müşavire komisyon veya indirim sözü vermeyin."
    },
    {
      "baslik": "Genel plan yeterli kurulum kapasitesi ayırıyor mu?",
      "mevcut": "Parametreler sayfası personel ve bütçe planını gösterir.",
      "eksik": "Planlanan kapasite gerçek kurulum kapasitesini kanıtlamaz.",
      "islem": "Operasyon yöneticisi mevcut kurulum kapasitesini ayrı doğrulasın.",
      "kanit": "Kabul edilen müşteriye kurulum sorumlusu atanmış olsun.",
      "firsat": "Kapasite görünürse müşteriye doğru başlangıç tarihi verilebilir.",
      "durdur": "Kurulum sorumlusu yoksa yeni müşteriye başlangıç tarihi vermeyin."
    }
  ],
  "kesifler": [
    {
      "baslik": "Aynı katalog birden çok yerde mi dolaşıyor?",
      "sinyal": "Aynı ürün bilgisi farklı ortaklardan gelebilir.",
      "kontrol": "Ortaklık sorumlusu yeni kaydı mevcut kayıtlarla karşılaştırsın.",
      "tepki": "Çakışma varsa kaydı karar çıkana kadar bekletsin.",
      "kayit": "Karşılaştırmayı ve kararı kayda yazın."
    },
    {
      "baslik": "Alıcı görüşmesi beklentisi gerçekçi mi?",
      "sinyal": "İşletme kısa sürede sipariş bekleyebilir.",
      "kontrol": "Ürün uzmanı ilk görüşmede beklentiyi işletmeye sorsun.",
      "tepki": "Beklenti gerçekçi değilse sonuç garantisi olmadığını yazılı açıklasın.",
      "kayit": "Açıklamayı ve işletmenin yanıtını kayda ekleyin."
    },
    {
      "baslik": "Kurulum devrinde bilgi kayboluyor mu?",
      "sinyal": "Kurulum ekibi aynı soruları işletmeye yeniden sorabilir.",
      "kontrol": "Operasyon yöneticisi örnek bir devir notunu incelesin.",
      "tepki": "Not eksikse devir notu biçimini sizinle düzeltsin.",
      "kayit": "Eksik alanları ve düzeltmeyi kayda yazın."
    }
  ],
  "haftalik": [
    "Her hafta açık müşteri kayıtlarınızı ve bekleyen kararları inceleyin.",
    "Ortaklık sorumlusu o hafta kabul edilen kayıtları açılan kayıtlarla karşılaştırsın.",
    "Operasyon ekibi o hafta tamamlanan kurulumları devredilen müşterilerle karşılaştırsın.",
    "Finans ekibi uygun tahsilatı ve itirazlı tutarı ayrı göstersin.",
    "Bir oran iki hafta düşerse ortaklık sorumlusu nedeni sizinle konuşsun.",
    "Anlaşmadan önce görevinizi, ödemeyi ve durma koşulunu kendi sözlerinizle anlatın. Ortaklık sorumlusu anlatımınızı dinlesin."
  ],
  "programlar": {
    "ana": [
      "İşletmeyi iStoc ile tanıştırırsınız. Kurulumu ve desteği şirket yapar.",
      "Komisyon, yazılan katkı düzeyinize göre hesaplanır.",
      "Şirket ortak getirmeye para ödemez."
    ],
    "gelistirme": [
      "Bu programda aday satıcıları iStoc’ta satışa hazır hâle getirirsiniz.",
      "Komisyon, satıcının ilk aylarda ödediği ücretten hesaplanır.",
      "Oran örnektir. Finans sorumlusu oranı kesinleştirmeden iş kabul etmeyin.",
      "Hazır sayılma ölçütünü ve kabul eden kişiyi önceden belirleyin."
    ],
    "arz": [
      "Bu program satıcı üyeleri olan kurum içindir.",
      "Kuruma bağlı satıcıları iStoc’a getirirsiniz. Bu program nakit ödeme vaat etmez.",
      "Program, belirli sayıda doğrulanmış vitrin oluşunca etkinleşir.",
      "Üye sonuç raporu ile veri paylaşımı sınırını protokole yazın."
    ],
    "talep": [
      "Bu programda alıcıların satın alma taleplerini toplarsınız.",
      "Sırf kayıt açmak ücret doğurmaz.",
      "Talep sahibinin paylaşım izni yoksa talebi iletmeyin.",
      "Görev ücreti iki parçada ödenir. Biri kapsam kabulünde, diğeri sonuç takibindedir.",
      "Görev kapsamını ve sonuç kabulünü yetkili kişiyle belirleyin."
    ],
    "hizmet": [
      "Bu programda iStoc satıcısına lojistik, ödeme veya benzeri hizmet sunarsınız.",
      "Kaynakta gelir paylaşımı oranı tanımlı değildir.",
      "Gelir paylaşımı, sorumluluk ve rozet kullanımı ayrı kabul edilmelidir."
    ],
    "teknoloji": [
      "Bu program iStoc’a doğrudan bağlanan yazılım firması içindir.",
      "Program ikinci dalgada başlar.",
      "Teknik kabul ve indirim koşulları kesinleşmeden bağlantı sözü vermeyin."
    ],
    "bolge": [
      "Bu programda belirli bir bölgede satıcı ağı kurarsınız.",
      "Bölge temsilciliği tek yetkili olma hakkı vermez.",
      "Programın pazar ve başlama koşulu sağlanmadan bölge yetkisi vaat etmeyin."
    ]
  }
};
