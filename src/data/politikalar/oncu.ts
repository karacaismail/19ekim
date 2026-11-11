import type { Politika } from './types';

export const politika: Politika = {
  "id": "oncu",
  "ad": "Öncü satış ortağı",
  "amac": "Uygun işletmeyi bulun, ihtiyacını anlayın ve satış ekibiyle buluşturun.",
  "iliski": "Bağımsız satış ortağı olarak çalışırsınız. Bu çalışma maaşlı iş veya işe alınma garantisi vermez. Şirket başarılı ortakları kadro görüşmesine çağırabilir. Bu davet işe alınma sözü değildir.",
  "gorev": [
    "İşletmenin ihtiyacını ve karar veren kişiyi öğrenin.",
    "Görüşmeyi müşteri takip sistemine kaydedin. Bu sistem görüşmeleri ve sonraki işleri saklar.",
    "Katkı seviyeniz yazılı olarak belirlenir. Bu seviye işinizi ve komisyon oranını belirler.",
    "Üç katkı seviyesi vardır: yalnız tanıştırma, ürün gösterimi ve satışı kapatma.",
    "Ürün gösterimi yapacaksanız önce eğitimi tamamlayın.",
    "Gösterimi yapamıyorsanız satış uzmanından destek isteyin."
  ],
  "sinir": [
    "Şirket adına fiyatı değiştiremezsiniz. İndirim veremezsiniz.",
    "Müşteriden para alamazsınız. Müşteri ödemeyi şirkete yapar.",
    "Üründe bulunmayan özelliği veya kesin kazancı vaat edemezsiniz.",
    "Şirket satış, sözleşme ve kurulum için yetkili kişileri belirler."
  ],
  "adimlar": [
    {
      "baslik": "Katkı seviyenizi yazılı belirleyin",
      "metin": [
        "Ortaklık sorumlusu katkı seviyenizi sizinle yazılı olarak belirler.",
        "Yalnız tanıştırma ile ürün gösterimi aynı katkı sayılmaz.",
        "Eğitim tamamlanınca sorumlu kişi ilk görüşmenizi değerlendirir.",
        "Seviye kaydını ve eğitim kaydını saklayın. Bu kayıtlar komisyon hesabında kanıttır."
      ]
    },
    {
      "baslik": "İşletmeyi kayda geçirin",
      "metin": [
        "Görüşmeden önce işletmenin kayıtlı olup olmadığını sorun.",
        "Kayıt yoksa işletmeyi kendi adınıza bildirin. Bildirim tarihini saklayın.",
        "Kayıt başka bir ortağa aitse görüşmeye başlamayın.",
        "Bu durumda ortaklık sorumlusu kaydın kime ait olduğuna karar verir."
      ]
    },
    {
      "baslik": "İletişim dayanağını kontrol edin",
      "metin": [
        "Kişiye ulaşmadan önce iletişim için uygun dayanağı doğrulayın.",
        "Mesaj göndermeden önce iletişim sorumlusuna izin koşulunu sorun.",
        "Kişi iletişim istemezse ret bilgisini kaydedin. Kişiye yeniden ulaşmayın."
      ]
    },
    {
      "baslik": "İhtiyacı sorun",
      "metin": [
        "İşletme görüşmeyi kabul ederse mevcut sorunu sorun.",
        "Karar veren kişiyi, kullanılan yöntemi ve beklenen sonucu kaydedin.",
        "İhtiyaç ürüne uymazsa görüşmeyi nazikçe kapatın. Nedeni kayda yazın.",
        "İhtiyaç uygunsa ürün gösterimi için randevu alın."
      ]
    },
    {
      "baslik": "Ürün gösterimini yapın veya devredin",
      "metin": [
        "Seviyeniz gösterimi kapsıyorsa gösterimi siz yapın.",
        "Gösterimden sonra görüşme notunu kayda ekleyin.",
        "Seviyeniz gösterimi kapsamıyorsa işi satış uzmanına devredin.",
        "Müşterinin sorularını da uzmana iletin.",
        "Uzman devri kabul edince müşteriye görüşeceği kişiyi bildirin."
      ]
    },
    {
      "baslik": "Onaylı teklifi bekleyin",
      "metin": [
        "Müşteri teklif isterse satış uzmanına bildirin.",
        "Yetkili kişi fiyatı ve kapsamı onaylar. Teklifi şirket gönderir.",
        "Onaylı teklif yoksa fiyat veya teslim tarihi söylemeyin.",
        "Satışı kapatma katkınız yazılıysa görüşmeyi onaylı teklifle siz yürütün.",
        "Müşteri kabul etmezse gerekçeyi kaydedin. Israr etmeyin."
      ]
    },
    {
      "baslik": "Sözleşme ve ödemeyi şirkete bırakın",
      "metin": [
        "Müşteri teklifi kabul ederse şirket sözleşmeyi hazırlar.",
        "Müşteri ödemeyi şirkete yapar. Siz ödeme almazsınız.",
        "Komisyon, müşterinin ödemesi tahsil edilince doğar. Satış kaydı tek başına yetmez.",
        "Finans sorumlusu tahsilatı ve komisyon koşullarını kontrol eder.",
        "Koşullar sağlanırsa finans sorumlusu ödeme hesabını sizinle paylaşır."
      ]
    },
    {
      "baslik": "Kurulumu ve desteği devredin",
      "metin": [
        "Satış uzmanı satış kaydını kurulum ekibine devreder.",
        "Kurulum ekibi devri alınca satış kaydına teslim notu ekler.",
        "Müşteri destek isterse şirketin destek kanalına yönlendirin.",
        "Yenileme görüşmesini kimin yapacağını ortaklık sorumlusu yazmalıdır."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "iStoc",
      "ad": "Telefonla sipariş alan toptancı",
      "ihtiyac": "Ürün bilgileri dağınıksa sipariş görüşmeleri uzayabilir.",
      "ulasim": "İşletme sahibiyle işyerinde uygun zamanda kısa görüşme isteyin.",
      "mesaj": "Ürünlerinizi müşterilere nasıl gösteriyorsunuz?",
      "uygunluk": "Ürün listesini güncelleyecek kişi yoksa kurulum sözü vermeyin.",
      "sonrasi": "İhtiyaç uygunsa örnek katalog üzerinden gösterim ayarlayın."
    },
    {
      "urun": "iStoc",
      "ad": "Yeni pazara açılmak isteyen üretici",
      "ihtiyac": "Üretici ürünlerini yeni alıcılara anlatmak istiyor olabilir.",
      "ulasim": "Sektör etkinliğinde satış yöneticisinden görüşme isteyin.",
      "mesaj": "Yeni alıcılara hangi ürünlerinizi sunmak istiyorsunuz?",
      "uygunluk": "Kapasite veya teslim şartları belirsizse satış garantisi vermeyin.",
      "sonrasi": "Satış uzmanına ürün grubu ve hedef pazar notunu iletin."
    },
    {
      "urun": "iStoc",
      "ad": "Bayi ağı kuran küçük işletme",
      "ihtiyac": "İşletme düzenli ürün ve fiyat paylaşımına ihtiyaç duyabilir.",
      "ulasim": "Tanıdığınız iş bağlantısından işletme sahibine tanıştırma isteyin.",
      "mesaj": "Bayilerinize güncel ürün bilgisini nasıl gönderiyorsunuz?",
      "uygunluk": "Ürün ihtiyacı karşılamıyorsa görüşmeyi kapatın.",
      "sonrasi": "Uyum varsa işletme sahibini satış uzmanıyla buluşturun."
    },
    {
      "urun": "Segika",
      "ad": "Bordroyu elle takip eden işletme",
      "ihtiyac": "İnsan kaynakları ekibi tekrar eden kontrollerle zaman kaybedebilir.",
      "ulasim": "İnsan kaynakları yöneticisinden şirketin genel iletişim kanalıyla randevu isteyin.",
      "mesaj": "Bordro sürecinde en çok hangi kontrol zaman alıyor?",
      "uygunluk": "Kişisel çalışan verisi istemeyin. Süreci kimlik bilgisi olmadan anlatmasını isteyin.",
      "sonrasi": "İhtiyaç uygunsa uzman eşliğinde ürün gösterimi planlayın."
    },
    {
      "urun": "Segika",
      "ad": "Çalışan sayısı artan firma",
      "ihtiyac": "İşe girişler arttığında takip yükü büyüyebilir.",
      "ulasim": "Muhasebe yöneticisine mevcut iş bağlantınız üzerinden ulaşın.",
      "mesaj": "Çalışan sayısı artınca hangi işlemleri takip etmek zorlaşıyor?",
      "uygunluk": "Kesin teşvik tutarı söylemeyin. Uygunluğu uzman değerlendirsin.",
      "sonrasi": "Çalışan sayısını ve mevcut yazılımı satış kaydına yazın."
    },
    {
      "urun": "Segika",
      "ad": "Şubeli işletme",
      "ihtiyac": "Şubeler farklı yöntemler kullanıyorsa bilgiler gecikebilir.",
      "ulasim": "Merkezdeki insan kaynakları sorumlusundan ortak görüşme isteyin.",
      "mesaj": "Şubelerden gelen bilgileri merkezde nasıl topluyorsunuz?",
      "uygunluk": "Merkezin karar yetkisi yoksa şubelere ayrı söz vermeyin.",
      "sonrasi": "Yetkili kişi belirlenirse satış uzmanına devir yapın."
    }
  ],
  "ortakBulma": [
    "Yeni ortak aramak müşteri bulmaktan ayrı bir iştir.",
    "Ana program yeni ortak getirmek için ödeme tanımlamaz.",
    "Adaydan giriş ücreti veya ürün alımı istemeyin.",
    "Üniversite kulüpleri ve meslek etkinliklerinde çalışma biçimini anlatabilirsiniz.",
    "Etkinlikte tanıtım yapmadan önce düzenleyiciden izin alın.",
    "Aday ilgilenirse ortaklık sorumlusuna yönlendirin.",
    "Adaya kazanç veya kadro sözü vermeyin.",
    "İkinci hesap sürümü ağ payı gösterir. Bu pay ana anlaşmaya kendiliğinden girmez."
  ],
  "sorunlar": [
    {
      "kosul": "Aynı işletmeyi başka bir ortak da bildirmişse",
      "islem": "Ortaklık sorumlusu kayıt tarihlerini ve görüşme kanıtlarını karşılaştırır.",
      "sonuc": "Finans sorumlusu ilgili ödemeyi kabul edilen sözleşmeye göre değerlendirir. Kararı size yazılı bildirir."
    },
    {
      "kosul": "İşletme zaten şirketin müşterisiyse",
      "islem": "Ortaklık sorumlusu kaydı kontrol eder. Sonucu size yazılı bildirir.",
      "sonuc": "Bu işletme için komisyon hakkı yazılı kurala göre belirlenir."
    },
    {
      "kosul": "İşletme yeniden aranmak istemezse",
      "islem": "Siz ret bilgisini kaydedin. Satış ekibine bildirin.",
      "sonuc": "Şirket bu kişiye pazarlama iletisi göndermeyi durdurur."
    },
    {
      "kosul": "Müşteri yapamayacağınız bir gösterim isterse",
      "islem": "Siz işi ürün uzmanına devredin.",
      "sonuc": "Uzman kabul edene kadar randevuyu kesinleştirmeyin."
    },
    {
      "kosul": "Müşteri indirim veya özel fiyat isterse",
      "islem": "Siz talebi satış uzmanına iletin. Fiyat sözü vermeyin.",
      "sonuc": "Yetkili kişi onaylarsa yeni teklifi şirket gönderir."
    },
    {
      "kosul": "Müşteri ödemeyi size yapmak isterse",
      "islem": "Siz ödemeyi kabul etmeyin. Finans sorumlusuna bildirin.",
      "sonuc": "Finans sorumlusu müşteriye şirketin ödeme yolunu iletir."
    },
    {
      "kosul": "Müşterinin ödemesi gecikirse",
      "islem": "Finans sorumlusu tahsilat durumunu size yazılı bildirir.",
      "sonuc": "Tahsilat olana kadar bu satışın komisyonu doğmaz."
    },
    {
      "kosul": "Müşteri sözleşmeyi iptal eder veya iade isterse",
      "islem": "Finans sorumlusu iadenin tutarını ve tarihini kayda yazar.",
      "sonuc": "Finans sorumlusu komisyonu kabul edilen iade kuralına göre değerlendirir. Kural eksikse taraflar yazılı netleştirmelidir."
    },
    {
      "kosul": "Komisyon hesabına itiraz ederseniz",
      "islem": "Siz itirazı kanıtlarıyla ortaklık sorumlusuna yazın.",
      "sonuc": "Finans sorumlusu itirazı inceler. Ödeme kararını kabul edilen sözleşmeye göre yazılı açıklar."
    },
    {
      "kosul": "Müşteriye yanlış bilgi verdiğinizi fark ederseniz",
      "islem": "Siz durumu hemen satış uzmanına bildirin.",
      "sonuc": "Satış uzmanı müşteriye doğru bilgiyi yazılı olarak iletir."
    },
    {
      "kosul": "Çalışmayı bırakmak isterseniz",
      "islem": "Siz açık görüşmeleri ortaklık sorumlusuna teslim edin.",
      "sonuc": "Şirket erişimleri kapatır. Kazanılmış hakları sözleşmeye göre hesaplar."
    }
  ],
  "anlasma": [
    {
      "baslik": "Taraflar ve ilişki",
      "metin": [
        "Sözleşme sizi bağımsız ortak olarak tanımlamalıdır.",
        "Ortaklık sorumlusu görevini kimin yürüteceği yazılmalıdır.",
        "Onay verecek kişi belli değilse şirket bu görevi atamalıdır."
      ]
    },
    {
      "baslik": "Katkı seviyesi ve yetki",
      "metin": [
        "Tanıştırma, ürün gösterimi ve satışı kapatma ayrı yazılmalıdır.",
        "Seviyenin hangi kanıtla değişeceği yazılmalıdır.",
        "Fiyat, indirim ve tahsilat yetkinizin olmadığı açıkça yazılmalıdır."
      ]
    },
    {
      "baslik": "Müşteri kaydı ve ayrılma",
      "metin": [
        "Ortaklık sorumlusu kayıt süresini ve çakışma kararını açıklamalıdır.",
        "Kayıt kararına itiraz yolu yazılmalıdır.",
        "Ayrılma sonrası açık satışların kime devredileceği yazılmalıdır."
      ]
    },
    {
      "baslik": "Kazanç, vergi ve masraf",
      "metin": [
        "Finans sorumlusu komisyonun hangi tahsilattan doğacağını yazmalıdır.",
        "Ödeme günleri ve gün sayımının başlangıcı yazılmalıdır.",
        "Geçerli hesap sürümü ve program adı yazılmalıdır.",
        "Komisyonu hangi belgeyle alacağınızı mali müşavir doğrulamalıdır.",
        "Yol veya reklam giderini şirketin ödeyeceğini varsaymayın.",
        "Harcama öncesinde yetkili kişiden yazılı bütçe onayı alın."
      ]
    },
    {
      "baslik": "Veri ve tanıtım içeriği",
      "metin": [
        "Müşteri takip sistemine erişiminizin kapsamı yazılmalıdır.",
        "Ayrılınca erişimin nasıl kapanacağı ve verinin nasıl silineceği yazılmalıdır.",
        "Kullanabileceğiniz tanıtım metinleri ve şirket adı kullanımı yazılmalıdır."
      ]
    },
    {
      "baslik": "Değişiklik ve anlaşmazlık",
      "metin": [
        "Koşul değişirse şirket sizi yazılı bilgilendirmelidir.",
        "Değişikliğin açık satışlara etkisi yazılmalıdır.",
        "Anlaşmazlıkta başvuracağınız görev ve kanal yazılmalıdır."
      ]
    }
  ],
  "acikKonular": [
    {
      "baslik": "Katkıyı nasıl kanıtlayacağız?",
      "mevcut": "Hesaplayıcı katkıya göre farklı oranlar kullanır.",
      "eksik": "Gösterimin kabulü için gereken kanıt tanımlı değildir.",
      "islem": "Ortaklık sorumlusu kısa görüşme kayıt şablonu hazırlasın.",
      "kanit": "Sorumlu örnek bir görüşmeyi bu şablonla değerlendirsin.",
      "firsat": "Aynı kayıt satış devrini hızlandırabilir.",
      "durdur": "Kanıt olmadan yüksek katkı oranı uygulanmasın."
    },
    {
      "baslik": "İlk görüşmeyi kim destekleyecek?",
      "mevcut": "Ortak ürünü tanıtarak işe başlar.",
      "eksik": "Eğitmen ve gösterim desteğinin kapasitesi kesinleşmemiştir.",
      "islem": "Satış yöneticisi uygun eğitmeni ve devir kişisini belirlesin.",
      "kanit": "Her açık randevunun kabul eden uzmanı kayıtlı olsun.",
      "firsat": "Birlikte görüşme yeni ortağın öğrenmesini kolaylaştırabilir.",
      "durdur": "Uzman yoksa yeni gösterim randevusu verilmesin."
    },
    {
      "baslik": "Kayıt kime ait olacak?",
      "mevcut": "Müşteri kaydı kazanç hesabını etkiler.",
      "eksik": "Ana programın kayıt koruma süresi açık değildir. Diğer programların süresi buraya kendiliğinden uygulanmaz.",
      "islem": "Ortaklık sorumlusu süreyi ve itiraz yolunu sözleşmeye eklesin.",
      "kanit": "Taraflar aynı kayıt örneğinde aynı sonuca ulaşsın.",
      "firsat": "Çakışma nedenleri daha iyi bölge dağılımı sağlayabilir.",
      "durdur": "Karar çıkmadan ilgili kazanç iki kişiye birden vaat edilmesin."
    },
    {
      "baslik": "Kazancınızı hangi belgeyle alacaksınız?",
      "mevcut": "Ağ programı hizmet faturası ister. Ana program belge türünü açıklamaz.",
      "eksik": "Şirketi olmayan ortağın ödeme yolu ve kesintileri belirsizdir.",
      "islem": "Mali müşavir uygun belgeyi ve olası kesintileri belirlesin.",
      "kanit": "Finans sorumlusu bu kurala göre örnek bir ödeme hazırlasın.",
      "firsat": "Açık kural ilk ödemenin gecikmesini önleyebilir.",
      "durdur": "Belge türü netleşmeden ortakla sözleşme imzalanmasın."
    },
    {
      "baslik": "İade olursa komisyon ne olacak?",
      "mevcut": "Ödeme, tahsilat ve iade koşulları doğrulanınca kesinleşir.",
      "eksik": "Ana programda iade süresi ve komisyonun geri alınma yöntemi yazılı değildir.",
      "islem": "Finans sorumlusu iade süresini ve geri alma yöntemini yazsın.",
      "kanit": "Taraflar örnek bir iadede aynı tutara ulaşsın.",
      "firsat": "Bölünmüş ödeme takvimi iade riskini azaltmaya yardım edebilir.",
      "durdur": "Yazılı kural yoksa başka ödemelerden kesinti yapılmasın."
    }
  ],
  "kesifler": [
    {
      "baslik": "Uygun olmayan adaylar birikiyor mu?",
      "sinyal": "Görüşmeler artarken ürün gösterimleri kabul edilmeyebilir.",
      "kontrol": "Satış yöneticisi kapanan görüşmelerin ret nedenlerini incelesin.",
      "tepki": "Aynı uyumsuzluk tekrarlanırsa hedef kitleyi daraltsın.",
      "kayit": "Ürün, ihtiyaç ve ret nedenini birlikte saklayın."
    },
    {
      "baslik": "Yeni ortak yanlış söz veriyor mu?",
      "sinyal": "Müşteri sözleşmede bulunmayan bir özellik bekleyebilir.",
      "kontrol": "Eğitmen ilk görüşmelerin müşteri özetlerini karşılaştırsın.",
      "tepki": "Yanlış vaat görülürse tanıtımı durdursun ve açıklamayı düzeltsin.",
      "kayit": "Düzeltme metnini ve müşterinin bilgilendirildiğini kaydedin."
    },
    {
      "baslik": "Aynı işletme için çakışma artıyor mu?",
      "sinyal": "Aynı işletmeyi iki ortağın bildirdiği durumlar artabilir.",
      "kontrol": "Ortaklık sorumlusu çakışan kayıtları ve nedenlerini incelesin.",
      "tepki": "Çakışma tekrarlanırsa sorumlu kişi bölge veya sektör paylaşımını değerlendirsin.",
      "kayit": "Kayıt tarihlerini ve verilen kararı saklayın."
    },
    {
      "baslik": "Ortak adayları kazanç beklentisiyle mi geliyor?",
      "sinyal": "Adaylar ilk görüşmede kesin kazanç veya kadro sorabilir.",
      "kontrol": "Ortaklık sorumlusu adaylara verilen tanıtım metinlerini incelesin.",
      "tepki": "Metinde kazanç vaadi varsa tanıtımı durdursun ve metni düzeltsin.",
      "kayit": "Eski metni, düzeltilmiş metni ve tarihini saklayın."
    },
    {
      "baslik": "İstenmeyen iletişim şikâyeti var mı?",
      "sinyal": "İşletmeler istenmeyen arama veya mesajdan şikâyet edebilir.",
      "kontrol": "İletişim sorumlusu ret kayıtlarını ve şikâyetleri karşılaştırsın.",
      "tepki": "Ret sonrası ileti gönderildiyse o kanaldan iletişimi durdursun.",
      "kayit": "Ret tarihini, kanalı ve yapılan düzeltmeyi saklayın."
    }
  ],
  "haftalik": [
    "Siz her hafta yaptığınız görüşmeleri ve gösterimleri sayın.",
    "Satış yöneticisi aynı haftanın kabul edilen gösterimlerini görüşme sayısına bölsün.",
    "Ortaklık sorumlusu aynı haftanın çakışan kayıtlarını ve ret kayıtlarını saysın.",
    "Oran düşerse yönetici ret nedenlerini sizinle incelesin.",
    "Açık her görüşme için sonraki işi ve sorumlusunu yazın."
  ],
  "programlar": {
    "ana": [
      "Varsayılan çalışma bu programdır. Yapılan katkı komisyon oranını belirler.",
      "Komisyon müşterinin ödemesine ve iade koşullarına bağlıdır."
    ],
    "ag": [
      "Bu seçenek yalnız iStoc içindir. Üye kaydetmek tek başına kazanç sağlamaz.",
      "Ortaklık sorumlusu ağ yapısını ve ödeme tavanını ayrıca onaylatmalıdır.",
      "Sözleşme ve hukuki değerlendirme bitmeden ağ payı vaat etmeyin."
    ],
    "yillara": [
      "Bu seçenek yalnız Segika içindir. Satışı siz kapatırsınız.",
      "Müşteri desteğini Segika verir. Ödeme müşterinin hizmet dönemine bağlıdır.",
      "Yenileme olmazsa sonraki yıl kazancı oluşmuş sayılmaz."
    ]
  }
};
