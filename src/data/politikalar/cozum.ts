import type { Politika } from './types';

export const politika: Politika = {
  "id": "cozum",
  "ad": "Danışman ve hizmet firması",
  "amac": "Müşterinizin ihtiyacını ürüne bağlayın ve üstlendiğiniz hizmeti tamamlayın.",
  "iliski": "Bağımsız hizmet ortağısınız. Kendi hizmetiniz ile ürünün sorumluluğu sözleşmede ayrı yazılır.",
  "gorev": [
    "Müşterinizin ihtiyacını ve ürünle uyumunu değerlendirin.",
    "Yapacağınız tanıtım, kurulum veya destek işini yazılı belirleyin.",
    "Müşteri kaydını ortaklık sorumlusuyla doğrulayın."
  ],
  "sinir": [
    "Müşteri adına yetkiniz yoksa sözleşme kabul edemezsiniz.",
    "Meslek kuralları değerlendirilmeden komisyon veya müşteri indirimi teklif etmeyin.",
    "Müşteri şifresi istemeyin. Erişimler yetkili kişi tarafından sınırlandırılsın."
  ],
  "adimlar": [
    {
      "baslik": "Ortaklık türünü seçin",
      "metin": [
        "Ortaklık sorumlusu yapacağınız işi sizinle belirler.",
        "Tanıştırma ile kurulum ve destek aynı kapsam değildir.",
        "Seçilen programın ücret ve sorumluluk eki hazırlanır."
      ]
    },
    {
      "baslik": "Müşterinin ihtiyacını doğrulayın",
      "metin": [
        "Mevcut hizmet ilişkiniz kapsamında ürün ihtiyacını konuşun.",
        "İletişim veya veri paylaşımı gerekiyorsa uygun dayanağı doğrulayın.",
        "Müşteri ilgilenirse ortaklık sorumlusuna kayıt açtırın."
      ]
    },
    {
      "baslik": "Kaydı ve kapsamı kabul ettirin",
      "metin": [
        "Ortaklık sorumlusu çakışan müşteri kaydını kontrol eder.",
        "Kayıt kabul edilince satış ve hizmet katkınızı yazın.",
        "Teknik bağlantı gerekiyorsa teknik ekip uygunluğu değerlendirsin."
      ]
    },
    {
      "baslik": "Teklifi ve sözleşmeyi tamamlayın",
      "metin": [
        "Yetkili satış sorumlusu ürün teklifini onaylasın.",
        "Kendi hizmet bedeliniz varsa ayrı ve açık gösterin.",
        "Müşteri iki tarafın da görevini anlamadan işe başlamayın."
      ]
    },
    {
      "baslik": "Kurulumu ve desteği devredin",
      "metin": [
        "iStoc ana programında kurulumu ve desteği şirket yürütür.",
        "Segika ana programında müşteri desteğini siz üstlenirsiniz.",
        "Destek kaydında konuyu, sorumluyu ve çözüm durumunu tutun."
      ]
    },
    {
      "baslik": "Hizmeti ve ödemeyi kontrol edin",
      "metin": [
        "Finans ekibi uygun tahsilatı ve hizmet koşulunu doğrular.",
        "Belirlenen belgeyi hazırlayın. Hakediş dökümünü kontrol edin.",
        "Yenileme öncesinde kapsamı ve destek yükünü müşteriyle değerlendirin."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "iStoc",
      "ad": "Katalog hizmeti alan toptancı",
      "ihtiyac": "Müşteri hazırlanan ürün bilgisini düzenli kullanmak isteyebilir.",
      "ulasim": "Mevcut hizmet toplantısında işletme sahibine ihtiyacını sorun.",
      "mesaj": "Hazırladığımız ürün bilgisini alıcılarla nasıl paylaşmak istiyorsunuz?",
      "uygunluk": "Katalog hizmetiyle ürün satışını zorunlu paket yapmayın.",
      "sonrasi": "Müşteri kabul ederse ürün uzmanıyla ortak görüşme yapın."
    },
    {
      "urun": "iStoc",
      "ad": "İhracata hazırlanan üretici",
      "ihtiyac": "Üretici ürün bilgisi ve alıcı iletişimini düzenlemek isteyebilir.",
      "ulasim": "Danışmanlık görüşmesinde satış yöneticisine uygulama ihtiyacını sorun.",
      "mesaj": "Alıcıların istediği ürün bilgisi sizde hazır mı?",
      "uygunluk": "İhracat veya satış başarısını garanti etmeyin.",
      "sonrasi": "Kapsam uygunsa ürün ve danışmanlık görevlerini ayrı yazın."
    },
    {
      "urun": "iStoc",
      "ad": "Yazılım veya lojistik müşterisi",
      "ihtiyac": "Müşteri mevcut hizmetini ürün sunumuyla birleştirmek isteyebilir.",
      "ulasim": "Hizmet toplantısına işletmenin yetkili kişisini dahil edin.",
      "mesaj": "Mevcut sisteminizle hangi bilgilerin birlikte çalışmasını istiyorsunuz?",
      "uygunluk": "Teknik uyum doğrulanmadan otomatik bağlantı sözü vermeyin.",
      "sonrasi": "Teknik ekip sonucu kabul ederse kapsamı kesinleştirin."
    },
    {
      "urun": "Segika",
      "ad": "Bordro hizmeti alan firma",
      "ihtiyac": "Müşteri bordro kontrolünü daha düzenli izlemek isteyebilir.",
      "ulasim": "Hizmet verdiğiniz firmanın insan kaynakları sorumlusuyla süreç görüşmesi yapın.",
      "mesaj": "Kontrolleri hangi aşamada tekrar yapmak zorunda kalıyorsunuz?",
      "uygunluk": "Mesleki ve veri erişim yetkisini doğrulamadan veri almayın.",
      "sonrasi": "Uygunluk varsa kimliksiz örnekle gösterim yapın."
    },
    {
      "urun": "Segika",
      "ad": "Bordro yazılımı kullanan işletme",
      "ihtiyac": "Firma kullandığı sistemle uyumlu takip isteyebilir.",
      "ulasim": "Yazılım desteği görüşmesinde muhasebe sorumlusuyla ihtiyacı değerlendirin.",
      "mesaj": "Mevcut yazılımınızda hangi adım eksik kalıyor?",
      "uygunluk": "Teknik ekip desteklenen bağlantıyı doğrulamadıkça entegrasyon satmayın.",
      "sonrasi": "Uygun kapsamı teknik ek ve destek planına yazın."
    },
    {
      "urun": "Segika",
      "ad": "Çok şubeli hizmet müşterisi",
      "ihtiyac": "Merkez şubelerin takibini birleştirmek isteyebilir.",
      "ulasim": "Merkez insan kaynakları ve muhasebe yöneticilerinden kapsam görüşmesi isteyin.",
      "mesaj": "Merkezde hangi bilgileri birlikte izlemek istiyorsunuz?",
      "uygunluk": "Şube yetkileri ve veri sınırları belirsizse kurulumu bekletin.",
      "sonrasi": "Merkez sözleşmesi ve şube kapsamı kabul edilince ilerleyin."
    }
  ],
  "ortakBulma": [
    "Hizmet tamamlayacak ortakları meslek ağlarından veya mevcut tedarikçilerden bulabilirsiniz.",
    "Ortaklık sorumlusu yeni firmanın yetkinliğini ve mesleki uygunluğunu incelesin.",
    "Yeni ortak bulmayı müşteri satışı veya otomatik kazanç saymayın."
  ],
  "sorunlar": [
    {
      "kosul": "Aynı müşteri başka ortağa kayıtlıysa",
      "islem": "Ortaklık sorumlusu kayıt ve hizmet kanıtlarını karşılaştırsın.",
      "sonuc": "Paylaşım kabul edilmeden iki tarafa ayrı komisyon vaat edilmesin."
    },
    {
      "kosul": "Teknik bağlantı çalışmıyorsa",
      "islem": "Teknik ekip etkilenen işlemi durdursun ve sorunu kaydetsin.",
      "sonuc": "Müşteri verisini koruyan geçici çalışma yolu kararlaştırılsın."
    },
    {
      "kosul": "Destek yükünü karşılayamıyorsanız",
      "islem": "Ortaklık sorumlusuna açık işleri ve kapasite sorununu bildirin.",
      "sonuc": "Yeni destek taahhüdü verilmeden devir planı kabul edilsin."
    },
    {
      "kosul": "Müşteri iade veya hizmet itirazı yaparsa",
      "islem": "Finans ve hizmet sorumluları ilgili kaydı birlikte incelesin.",
      "sonuc": "Ürün bedeliyle sizin hizmet bedeliniz ayrı değerlendirilir."
    },
    {
      "kosul": "Ortaklık sona ererse",
      "islem": "Müşteri işlerini kabul eden yeni sorumluya devredin.",
      "sonuc": "Şirket erişimleri kapatsın. Açık ödemeler sözleşmeye göre sonuçlansın."
    }
  ],
  "anlasma": [
    {
      "baslik": "İki hizmeti ayırın",
      "metin": [
        "Ürün satışıyla kendi danışmanlık hizmetinizi ayrı tanımlayın.",
        "Her işin kabulünü ve müşteriye karşı sorumlusunu yazın."
      ]
    },
    {
      "baslik": "Destek ve veri erişimi",
      "metin": [
        "Destek saatleri ve yanıt süresi karşılıklı kararlaştırılmalıdır.",
        "Teknik ekip erişim kapsamını ve veri silme yöntemini yazmalıdır.",
        "Müşteri verisinin başka amaçla kullanılması ayrıca değerlendirilmelidir."
      ]
    },
    {
      "baslik": "Ticari ve mesleki koşullar",
      "metin": [
        "Finans ekibi fatura, vergi ve döviz uygulamasını açıklamalıdır.",
        "Meslek kurallarına uygunluk ilgili uzman tarafından değerlendirilmelidir.",
        "Kendi marka kullanımı ve teknik bağlantı ayrı ek gerektirir."
      ]
    }
  ],
  "acikKonular": [
    {
      "baslik": "Destek kimin üzerinde kalacak?",
      "mevcut": "Segika ana programında desteği ortak üstlenir.",
      "eksik": "Yanıt süresi ve yedek sorumlu kesinleşmemiştir.",
      "islem": "Ortaklık sorumlusu destek kapsamını sizinle yazılı belirlesin.",
      "kanit": "Örnek destek talebi doğru kişiye ulaşsın ve kapatılsın.",
      "firsat": "Ortak destek kaydı tekrar eden sorunu azaltabilir.",
      "durdur": "Yedek sorumlu yoksa yeni destek taahhüdü vermeyin."
    },
    {
      "baslik": "Özel modelin fiyatı nedir?",
      "mevcut": "Bazı programlar yalnız ödeme modelinin adını verir.",
      "eksik": "Hacim fiyatı, hizmet bedeli veya paylaşım oranı açık değildir.",
      "islem": "Finans sorumlusu seçilen program için ticari ek hazırlasın.",
      "kanit": "Taraflar aynı örnek işin bedelini aynı şekilde hesaplasın.",
      "firsat": "Sınırlı kapsamla başlamak hizmet maliyetini öğrenmeyi sağlayabilir.",
      "durdur": "Fiyat ve kabul ölçütü belirlenmeden ücretli işe başlamayın."
    },
    {
      "baslik": "Mesleki çıkar çatışması var mı?",
      "mevcut": "Bazı hedef ortaklar düzenlenmiş mesleklerde çalışır.",
      "eksik": "Komisyon veya indirim uygunluğu otomatik doğrulanmaz.",
      "islem": "Ortaklık sorumlusu ilgili meslek kuralları için uzman görüşü alsın.",
      "kanit": "Seçilen model için değerlendirme ve karar kaydı bulunsun.",
      "firsat": "Uygun ortaklık biçimi güveni koruyabilir.",
      "durdur": "Uygunluk netleşmeden komisyon sözü vermeyin."
    },
    {
      "baslik": "Genel plan yeterli kaynak ayırıyor mu?",
      "mevcut": "Parametreler sayfası personel ve bütçe planını gösterir.",
      "eksik": "Planlanan kapasite gerçek destek kapasitesini kanıtlamaz.",
      "islem": "Operasyon yöneticisi mevcut kapasiteyi ayrı doğrulasın.",
      "kanit": "Kabul edilen müşteriye atanmış destek sorumlusu bulunsun.",
      "firsat": "Boş kapasite uygun ortaklarla tamamlanabilir.",
      "durdur": "Personel veya onaylı bütçe yoksa kapsamı genişletmeyin."
    }
  ],
  "kesifler": [
    {
      "baslik": "Bir ortağa aşırı bağımlılık oluşuyor mu?",
      "sinyal": "Müşteri bilgisi yalnız bir kişinin elinde kalabilir.",
      "kontrol": "Operasyon yöneticisi örnek bir müşteri devrini denesin.",
      "tepki": "Devir yapılamıyorsa yeni müşteri kabulünü sınırlandırsın.",
      "kayit": "Erişim ve kabul eksiklerini ortak kayıt sisteminde tutun."
    },
    {
      "baslik": "Veri sınırları karışıyor mu?",
      "sinyal": "Farklı müşterilerin kayıtları aynı dosyada birikebilir.",
      "kontrol": "Teknik sorumlu örnek erişim yetkilerini müşteri bazında kontrol etsin.",
      "tepki": "Yetkisiz erişim görülürse ilgili erişimi kapatıp inceleme başlatsın.",
      "kayit": "Olayı ve düzeltmeyi gereksiz kişisel veri olmadan kaydedin."
    },
    {
      "baslik": "Hizmet maliyeti kazancı aşıyor mu?",
      "sinyal": "Destek talepleri artarken yenilemeler düşebilir.",
      "kontrol": "Ortaklık sorumlusu hizmet süresini yenilenen müşteri sayısıyla karşılaştırsın.",
      "tepki": "Kapsam sürdürülemiyorsa yeni sözleşmelerin kapsamını yeniden belirlesin.",
      "kayit": "Mevcut müşterinin kabul edilmiş haklarını koruyarak karar kaydedin."
    }
  ],
  "haftalik": [
    "Siz açık destek işlerini ve bekleyen müşteri kararlarını gözden geçirin.",
    "Ortaklık sorumlusu kabul edilen devirleri toplam devirlere bölsün.",
    "Finans ekibi uygun tahsilatı ve itirazlı tutarı ayrı göstersin.",
    "Yenileme döneminde yenileyenleri süresi dolan müşterilere göre değerlendirin."
  ],
  "programlar": {
    "ana": [
      "iStoc ana programında kurulumu ve desteği şirket yürütür.",
      "Segika ana programında desteği siz verirsiniz. Katkı kapsamını sözleşmeye yazın."
    ],
    "yillara": [
      "Segika için hizmet sürdükçe dönemsel komisyon hesaplanır.",
      "Destek verilmeyen ayın koşulunu finans sorumlusu ayrıca kontrol eder."
    ],
    "yonlendirme": [
      "Segika müşterisini uygun ekibe yönlendirirsiniz. Fiyatı değiştiremez veya tahsilat yapamazsınız.",
      "Finans ekibi uygun net tahsilatı ve ortaklar arasındaki paylaşımı doğrular."
    ],
    "smmm": [
      "Bu Segika seçeneği mali müşavir ofisine yöneliktir.",
      "Nakit komisyon yerine toptan çalışma modeli kullanılır.",
      "Fiyat bandı ve mesleki uygunluk kabul edilmeden müşteriye teklif vermeyin."
    ],
    "altyapi": [
      "Segika hizmetini kendi markanızla sunmak isterseniz ayrı sözleşme gerekir.",
      "Yıllık hacmi, destek sorumlusunu ve hizmet sürekliliğini birlikte belirleyin."
    ],
    "entegrasyon": [
      "Bordro yazılımıyla Segika bağlantısını teknik ekip doğrulamalıdır.",
      "Ortak tanıtım başlamadan veri erişimini ve destek görevlerini yazın."
    ],
    "osgb": [
      "İş sağlığı ve güvenliği hizmeti veren kurum müşterilerini Segika’ya yönlendirebilir.",
      "Programın başlama koşulu sağlanmadan kurum adına teklif vermeyin."
    ],
    "dernek": [
      "Dernek, oda veya sanayi bölgesi üyeleriyle ortak eğitim düzenlenebilir.",
      "Üye listesini topluca paylaşmayın. İlgilenen kişiler kendileri başvursun."
    ],
    "franchise": [
      "Şubeli işletmede merkez sözleşmesiyle Segika kapsamı belirlenir.",
      "Şubelerin yetkisini, ödeme sorumlusunu ve destek kapsamını ayrı yazın."
    ],
    "gelistirme": [
      "iStoc için satıcıyı satışa hazır hâle getirirsiniz.",
      "Hazır sayılma ölçütünü ve kabul eden kişiyi önceden belirleyin."
    ],
    "arz": [
      "Kuruma bağlı satıcıları iStoc’a getirirsiniz. Bu program nakit komisyon vaat etmez.",
      "Üye sonuç raporu ile veri paylaşımı sınırını protokole yazın."
    ],
    "talep": [
      "iStoc için uygun alım taleplerini toplarsınız. Sırf kayıt açmak ücret doğurmaz.",
      "Görev kapsamını ve sonuç kabulünü yetkili kişiyle belirleyin."
    ],
    "hizmet": [
      "iStoc müşterisine lojistik veya benzeri hizmet sunabilirsiniz.",
      "Gelir paylaşımı, sorumluluk ve rozet kullanımı ayrı kabul edilmelidir."
    ],
    "teknoloji": [
      "iStoc ile yazılım bağlantısı ve ortak tanıtım planlanır.",
      "Teknik kabul ve indirim koşulları kesinleşmeden bağlantı sözü vermeyin."
    ],
    "bolge": [
      "iStoc için belirli bölgede satıcı ağı kurabilirsiniz.",
      "Programın pazar ve başlama koşulu sağlanmadan bölge yetkisi vaat etmeyin."
    ]
  }
};
