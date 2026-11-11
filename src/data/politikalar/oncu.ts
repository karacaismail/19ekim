import type { Politika } from './types';

export const politika: Politika = {
  "id": "oncu",
  "ad": "Öncü satış ortağı",
  "amac": "Uygun işletmeyi bulun, ihtiyacını anlayın ve satış ekibiyle buluşturun.",
  "iliski": "Bağımsız satış ortağı olarak çalışırsınız. Bu çalışma maaşlı iş veya işe alınma garantisi vermez.",
  "gorev": [
    "İşletmenin ihtiyacını ve karar veren kişiyi öğrenin.",
    "Görüşmeyi müşteri takip sistemine kaydedin. Bu sistem görüşmeleri ve sonraki işleri saklar.",
    "Ürün gösterimini yapabiliyorsanız eğitimi tamamlayın. Yapamıyorsanız satış uzmanından destek isteyin."
  ],
  "sinir": [
    "Şirket adına fiyatı değiştiremezsiniz. Müşteriden para alamazsınız.",
    "Üründe bulunmayan özelliği veya kesin kazancı vaat edemezsiniz.",
    "Şirket satış, sözleşme ve kurulum için yetkili kişileri belirler."
  ],
  "adimlar": [
    {
      "baslik": "Önce çalışma biçimini belirleyin",
      "metin": [
        "Ortaklık sorumlusu yapacağınız işi sizinle yazılı olarak belirler.",
        "Yalnız tanıştırma ile ürün gösterimi aynı katkı sayılmaz.",
        "Eğitim tamamlanınca sorumlu kişi ilk görüşmenizi değerlendirir."
      ]
    },
    {
      "baslik": "İşletmeyi kontrol edin",
      "metin": [
        "Yeni işletmeyle görüşmeden önce kayıtlı olup olmadığını sorun.",
        "Kayıt varsa ortaklık sorumlusu görüşmenin kime ait olduğunu inceler.",
        "Kayıt size verilirse iletişim için uygun dayanağı doğrulayın."
      ]
    },
    {
      "baslik": "İhtiyacı sorun",
      "metin": [
        "İşletme sahibi görüşmeyi kabul ederse mevcut sorunu sorun.",
        "Karar veren kişiyi, kullanılan yöntemi ve beklenen sonucu kaydedin.",
        "İhtiyaç ürüne uygunsa ürün gösterimi için randevu alın."
      ]
    },
    {
      "baslik": "Yaptığınız işi kaydedin",
      "metin": [
        "Gösterimi siz yaptıysanız görüşme notunu kayda ekleyin.",
        "Satış uzmanı devralacaksa müşterinin sorularını uzmana iletin.",
        "Uzman devri kabul edince müşteriye görüşeceği kişiyi bildirin."
      ]
    },
    {
      "baslik": "Teklifi yetkili kişiye bırakın",
      "metin": [
        "Müşteri teklif isterse satış uzmanına yönlendirin.",
        "Yetkili kişi fiyatı, kapsamı ve sözleşmeyi müşteriye gönderir.",
        "Müşteri kabul etmezse gerekçeyi kaydedin. Israr etmeyin."
      ]
    },
    {
      "baslik": "Ödeme sonucunu takip edin",
      "metin": [
        "Finans sorumlusu tahsilatı ve komisyon koşullarını kontrol eder.",
        "Koşullar sağlanırsa finans sorumlusu ödeme hesabını sizinle paylaşır.",
        "Kurulum ekibi devri alınca satış kaydına teslim notu eklenir."
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
      "uygunluk": "Ürünün ihtiyacı karşılamadığı durumda görüşmeyi kapatın.",
      "sonrasi": "Uyum varsa işletme sahibini satış uzmanıyla buluşturun."
    },
    {
      "urun": "Segika",
      "ad": "Bordroyu elle takip eden işletme",
      "ihtiyac": "insan kaynakları ekibi tekrar eden kontrollerle zaman kaybedebilir.",
      "ulasim": "insan kaynakları yöneticisine şirketin genel iletişim kanalından randevu isteyin.",
      "mesaj": "Bordro sürecinde en çok hangi kontrol zaman alıyor?",
      "uygunluk": "Kişisel çalışan verisi istemeyin. Örnek süreci kimliksiz anlatmasını isteyin.",
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
    "Üniversite kulüpleri ve meslek etkinliklerinde çalışma biçimini anlatabilirsiniz.",
    "Aday ilgilenirse ortaklık sorumlusuna yönlendirin. Katılım için kazanç vaat etmeyin."
  ],
  "sorunlar": [
    {
      "kosul": "Aynı işletmeyi başka ortak bildirmişse",
      "islem": "Ortaklık sorumlusu kayıt zamanını ve görüşme kanıtlarını karşılaştırır.",
      "sonuc": "Sorumlu kararını yazana kadar komisyon paylaşımı sözü verilmez."
    },
    {
      "kosul": "İşletme yeniden aranmak istemezse",
      "islem": "Siz ret bilgisini kaydedin. Satış ekibine bildirin.",
      "sonuc": "Bu kanaldan pazarlama görüşmesi durur."
    },
    {
      "kosul": "Müşteri yapamayacağınız bir gösterim isterse",
      "islem": "Siz ürün uzmanına devir yapın.",
      "sonuc": "Uzman kabul edene kadar randevuyu kesinleştirmeyin."
    },
    {
      "kosul": "Ödeme gecikirse veya müşteri iade isterse",
      "islem": "Finans sorumlusu ilgili satışın durumunu açıklasın.",
      "sonuc": "İtirazlı tutar ayrı incelenir. Diğer haklar kendiliğinden silinmez."
    },
    {
      "kosul": "Çalışmayı bırakmak isterseniz",
      "islem": "Açık görüşmeleri ortaklık sorumlusuna teslim edin.",
      "sonuc": "Şirket erişimleri kapatır. Kazanılmış hakları sözleşmeye göre hesaplar."
    }
  ],
  "anlasma": [
    {
      "baslik": "İşin kapsamı",
      "metin": [
        "Sözleşme bağımsız ortaklık ilişkisini açıklamalıdır.",
        "Tanıştırma, gösterim ve satış katkısı ayrı yazılmalıdır."
      ]
    },
    {
      "baslik": "Kazanç ve masraf",
      "metin": [
        "Finans sorumlusu komisyon hesabını ve ödeme başlangıcını yazılı belirlemelidir.",
        "Yol veya reklam giderini şirketin ödeyeceğini varsaymayın.",
        "Harcama öncesinde yetkili kişiden yazılı bütçe onayı alın."
      ]
    },
    {
      "baslik": "Müşteri kaydı ve ayrılma",
      "metin": [
        "Ortaklık sorumlusu kayıt süresini ve çakışma kararını açıklamalıdır.",
        "Ayrılma sonrası açık satışların kime devredileceği yazılmalıdır."
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
      "eksik": "Ana programın kayıt koruma süresi açık değildir.",
      "islem": "Ortaklık sorumlusu süreyi ve itiraz yolunu sözleşmeye eklesin.",
      "kanit": "Taraflar aynı kayıt örneğinde aynı sonuca ulaşsın.",
      "firsat": "Çakışma nedenleri daha iyi bölge dağılımı sağlayabilir.",
      "durdur": "Karar çıkmadan ilgili kazanç iki kişiye birden vaat edilmesin."
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
    }
  ],
  "haftalik": [
    "Siz haftalık görüşmeleri ve kabul edilen gösterimleri sayın.",
    "Satış yöneticisi kabul edilen gösterimleri toplam görüşmelere bölsün.",
    "Sonuç düşerse yönetici ret nedenlerini sizinle incelesin.",
    "Açık her görüşme için sonraki işi ve sorumlusunu yazın."
  ],
  "programlar": {
    "ana": [
      "Varsayılan çalışma bu programdır. Yapılan katkı komisyon oranını belirler."
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
