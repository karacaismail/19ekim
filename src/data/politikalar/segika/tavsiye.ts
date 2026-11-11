import type { ProjePolitika } from '../types';

export const politika: ProjePolitika = {
  "id": "tavsiye",
  "proje": "segika",
  "ad": "Mevcut müşteri",
  "amac": "Kullandığınız Segika hizmetini başka bir firmaya önerin.",
  "iliski": "Firmanız Segika ile teşvik ve bordro işlerini yürütür. Siz yalnız tanıştırma yaparsınız. Satış, sözleşme, kurulum ve desteği şirket yürütür.",
  "gorev": [
    "Firmanızda Segika kullanımını kendi deneyiminizle anlatın.",
    "Teşvik tutarı veya bordro sonucu vaat etmeyin.",
    "Tavsiye karşılığı ödül alabileceğinizi karşı firmaya açıkça söyleyin.",
    "Firma ilgilenirse şirketin başvuru yolunu kendisi kullansın.",
    "Tavsiyenin firmanıza bağlandığını müşteri sorumlusundan doğrulayın."
  ],
  "sinir": [
    "Firmanızın çalışan veya bordro verisini örnek olarak paylaşmayın.",
    "Firmanızın teşvik tutarını başka firmaya göstermeyin.",
    "Karşı firmanın teşvik uygunluğunu kendiniz değerlendirmeyin.",
    "Ürün gösterimi, kurulum ve destek sizin göreviniz değildir.",
    "Şirket adına fiyat, indirim veya süre sözü vermeyin.",
    "Ana programın ödülü ücretsiz kullanımdır. Nakit ödeme değildir."
  ],
  "adimlar": [
    {
      "baslik": "Önce kendi deneyiminizi değerlendirin",
      "metin": [
        "Firmanız Segika ile doğrulanmış sonuç aldıysa deneyiminizi paylaşabilirsiniz.",
        "Teşvik veya bordroda sorun sürüyorsa önce müşteri sorumlusuna bildirin.",
        "Tavsiye yapmak mevcut hizmeti almanızın şartı değildir."
      ]
    },
    {
      "baslik": "Firmanızda yetkiyi netleştirin",
      "metin": [
        "Ödülün hangi hesaba işleneceğini müşteri sorumlusu yazılı bildirsin.",
        "Firmanızın yetkilisi tavsiye yapmanıza onay versin.",
        "Onay yoksa tavsiye başvurusu yapmayın."
      ]
    },
    {
      "baslik": "Geçerli koşulu tavsiyeden önce öğrenin",
      "metin": [
        "Müşteri sorumlusu geçerli hesap sürümünü size yazılı bildirsin.",
        "Bu yazıda ödül koşulu ve yıllık tavsiye sınırı bulunsun.",
        "Ayrı komisyon seçeneği sunulduysa hangisinin geçerli olduğu yazılsın.",
        "Yazılı koşul gelmeden ödül beklentisiyle tavsiye yapmayın."
      ]
    },
    {
      "baslik": "Uygun firmayı seçin",
      "metin": [
        "Tanıdığınız yöneticiye teşvik ve bordro takibini nasıl yaptığını sorun.",
        "Takip ihtiyacı varsa tanıştırmayı teklif edin.",
        "Ödül alabileceğinizi bu konuşmada açıkça söyleyin.",
        "Firma istemezse konuyu kapatın. Bilgisini kimseye iletmeyin."
      ]
    },
    {
      "baslik": "Tanıştırmayı kaydettirin",
      "metin": [
        "Firma kabul ederse şirketin onaylı başvuru yolunu paylaşın.",
        "Başvuruyu karşı firmanın yetkili yöneticisi yapsın.",
        "Başvuruda firmanızın adı tavsiye eden olarak yazılsın.",
        "Müşteri sorumlusu tavsiyenin firmanıza bağlandığını yazılı bildirsin.",
        "Başvuruya çalışan listesi eklenmesin."
      ]
    },
    {
      "baslik": "Satışı ve teşvik değerlendirmesini şirkete bırakın",
      "metin": [
        "Satış uzmanı firmanın ihtiyacını değerlendirir ve teklif verir.",
        "Teşvik sonucu için kimse söz vermez. Değerlendirmeyi satış uzmanı yapar.",
        "Şirketin yetkili kişisi sözleşmeyi hazırlar.",
        "Bordro verisinin aktarımını şirket firmayla kendisi planlar.",
        "Siz firma adına karar vermezsiniz. Görüşmeleri takip etmek zorunda değilsiniz."
      ]
    },
    {
      "baslik": "Ödül koşulunu kontrol edin",
      "metin": [
        "Birinci sürümde yeni müşterinin yıllık paket alması gerekir.",
        "Birinci sürümde yeni müşteri 60 gün kullanmaya devam etmelidir.",
        "Bu iki koşul sağlanırsa ücretsiz kullanım firmanızın hesabına yazılır.",
        "İkinci sürüm seçildiyse ödeme belirlenen süre içinde alınmalıdır.",
        "Ödeme bu sürede alınmazsa ikinci sürümde ödül hakkı oluşmaz.",
        "Yeni müşterinin kendi ödülünü şirket ona ayrıca bildirir."
      ]
    },
    {
      "baslik": "Ödülün uygulandığını görün",
      "metin": [
        "Finans sorumlusu ücretsiz sürenin firmanızın hangi faturasına yansıdığını bildirsin.",
        "Firmanızın muhasebe birimi faturayı kontrol etsin.",
        "Yansıma görünmüyorsa muhasebe birimi müşteri sorumlusuna yazsın.",
        "İş burada biter. Yeni tavsiye için aynı sıra yeniden başlar."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "Segika",
      "ad": "Aynı organize sanayi bölgesindeki firma",
      "ihtiyac": "Firma teşvik başvurularını ve bordroyu elle takip ediyor olabilir.",
      "ulasim": "Tanıdığınız insan kaynakları yöneticisiyle izinli birebir görüşün.",
      "mesaj": "Teşvik ve bordro takibini nasıl yaptığımızı anlatmamı ister misiniz?",
      "uygunluk": "Çalışan verisini veya teşvik tutarınızı örnek olarak göstermeyin.",
      "sonrasi": "İlgilenirse şirketle kendisi iletişim kursun."
    },
    {
      "urun": "Segika",
      "ad": "Aynı gruptaki başka şirket",
      "ihtiyac": "Grup şirketi benzer bordro ve teşvik takibi sorunları yaşıyor olabilir.",
      "ulasim": "Muhasebe yöneticisiyle şirket yetkilerini gözeterek konuşun.",
      "mesaj": "Sizde de teşvik takibi için ayrı bir yöntem gerekiyor mu?",
      "uygunluk": "Ayrı şirketin kampanyaya uygunluğunu kendiniz kararlaştırmayın.",
      "sonrasi": "Müşteri sorumlusu şirket ilişkisini ve uygunluğu kontrol etsin."
    },
    {
      "urun": "Segika",
      "ad": "Tanıdığınız muhasebe yöneticisinin firması",
      "ihtiyac": "Muhasebe ekibi bordro hazırlığında zaman kaybediyor olabilir.",
      "ulasim": "Mesleki tanışıklığınız içinde birebir ve izinli konuşun.",
      "mesaj": "Tavsiye ödülü alabilirim. Bordro deneyimimizi duymak ister misiniz?",
      "uygunluk": "Firmanın bordro dosyasını sizin üzerinizden istemeyin.",
      "sonrasi": "İlgilenirse satış uzmanıyla doğrudan görüşsün."
    },
    {
      "urun": "Segika",
      "ad": "Tedarikçi veya müşteri firma",
      "ihtiyac": "Çalışanı çok olan iş ortağınız teşvikleri kaçırıyor olabilir.",
      "ulasim": "Mevcut iş görüşmenizin uygun bir anında izin isteyin.",
      "mesaj": "Teşvik takibinde kullandığımız yöntemi merak eder misiniz?",
      "uygunluk": "İş ilişkinizi tavsiye kabulüne bağlamayın.",
      "sonrasi": "İhtiyaç uygunsa şirketin başvuru yolunu paylaşın."
    }
  ],
  "sorunlar": [
    {
      "kosul": "Tavsiye firmanıza bağlanmamışsa",
      "islem": "Müşteri sorumlusuna başvuru bilgisini ve tanıştırma tarihini iletin.",
      "sonuc": "Sorumlu kaydı inceler. Sonucu size yazılı açıklar."
    },
    {
      "kosul": "Firma zaten Segika müşterisi veya kayıtlı aday ise",
      "islem": "Müşteri sorumlusu yeni müşteri koşulunu kontrol etsin.",
      "sonuc": "Uygunluk doğrulanmadan ödül sözü verilmez."
    },
    {
      "kosul": "Aynı firmayı iki kişi tavsiye ettiyse",
      "islem": "Müşteri sorumlusu iki kaydın tarihini karşılaştırsın.",
      "sonuc": "Karar ve gerekçesi iki tarafa da yazılı bildirilir."
    },
    {
      "kosul": "Firma ne kadar teşvik alacağını sorarsa",
      "islem": "Tahmin vermeyin. Soruyu satış uzmanına yönlendirin.",
      "sonuc": "Satış uzmanı teşvik konusunu firmayla kendisi konuşur. Sonuç için söz vermez."
    },
    {
      "kosul": "Firma size bordro veya çalışan dosyası gönderirse",
      "islem": "Dosyayı başkasına iletmeyin. Firmadan şirkete doğrudan göndermesini isteyin.",
      "sonuc": "Kendi firmanızın veri kuralına göre dosyayı silin."
    },
    {
      "kosul": "Yıllık tavsiye sınırına ulaştıysanız",
      "islem": "Müşteri sorumlusundan kalan hakkınızı öğrenin.",
      "sonuc": "Hesaplayıcı yalnız sınır kadar tavsiyeyi ödüle çevirir. Fazlasının sonucunu sorumlu yazılı açıklasın."
    },
    {
      "kosul": "Yeni müşteri 60 gün dolmadan bırakırsa veya ödemezse",
      "islem": "Finans sorumlusu ilgili ödülün koşullarını yeniden incelesin.",
      "sonuc": "Kaynakta iptal kuralı yoktur. Finans sorumlusu kararı size yazılı açıklasın."
    },
    {
      "kosul": "Bir tavsiyenin ödülüne itiraz ederseniz",
      "islem": "Müşteri sorumlusuna itirazınızı ve tavsiye tarihini yazılı iletin.",
      "sonuc": "Finans sorumlusu ilgili ödülü inceler. Kararını kabul edilen tavsiye koşullarına göre yazılı açıklar."
    },
    {
      "kosul": "Tanıştırdığınız firma iletişim istemezse",
      "islem": "Müşteri sorumlusu bu firmaya pazarlama iletisi göndermeyi durdursun.",
      "sonuc": "Ret kaydedilir. Firmaya yeniden pazarlama iletisi gönderilmez."
    },
    {
      "kosul": "Tavsiyeden vazgeçmek isterseniz",
      "islem": "Müşteri sorumlusuna vazgeçtiğinizi bildirin.",
      "sonuc": "Açık tavsiyelerin durumu size yazılı açıklanır. Mevcut hizmetiniz bundan etkilenmez."
    }
  ],
  "anlasma": [
    {
      "baslik": "Taraflar ve kapsam",
      "metin": [
        "Şirket firmanızı tanıştırma yapan Segika müşterisi olarak yazmalıdır.",
        "Firmanız adına tavsiye yapabilecek yetkili kişi yazılmalıdır.",
        "Satış, sözleşme, kurulum ve desteğin şirkette olduğu yazılmalıdır.",
        "Size çalışan veya satış görevi verilmediği açıkça belirtilmelidir."
      ]
    },
    {
      "baslik": "Kampanya koşulları",
      "metin": [
        "Şirket hangi firmaların katılabileceğini açıkça yazmalıdır.",
        "Yeni müşteri tanımı, kayıt tarihi ve sınırın dönemi belirtilmelidir.",
        "Geçerli hesap sürümü ve yürürlük tarihi yazılmalıdır.",
        "Birinci sürümde yıllık paket ve 60 gün kullanım koşulu yazılmalıdır."
      ]
    },
    {
      "baslik": "Tavsiyenin firmanıza bağlanması",
      "metin": [
        "Şirket tavsiyenin hangi kayıtla firmanıza bağlanacağını yazmalıdır.",
        "Aynı firma için birden çok kayıt varsa karar kuralı yazılmalıdır.",
        "Grup şirketlerinin nasıl sayılacağı yazılmalıdır."
      ]
    },
    {
      "baslik": "Ödülün türü",
      "metin": [
        "Finans sorumlusu ücretsiz sürenin hangi pakete uygulanacağını yazmalıdır.",
        "Paket değişimi, iptal ve kullanılmayan süre ayrıca açıklanmalıdır.",
        "Komisyon seçeneği seçilirse bu ayrı ve yazılı kabul edilmelidir."
      ]
    },
    {
      "baslik": "Vergi ve fatura",
      "metin": [
        "Ücretsiz kullanımın faturada nasıl görüneceği henüz karar verilmemiş konudur.",
        "Komisyon seçeneğinde ödeme belgesi de karar verilmemiş konudur.",
        "Finans sorumlusu mali müşavirle bu işlemleri yazılı belirlemelidir."
      ]
    },
    {
      "baslik": "Tanıtım ve içerik",
      "metin": [
        "Tavsiye ilişkisini açıkça belirtme kuralı yazılmalıdır.",
        "Firmanızın adını kullanma izni ayrıca yazılmalıdır.",
        "Tanıtımda teşvik tutarı veya çalışan bilgisi yer almamalıdır."
      ]
    },
    {
      "baslik": "Veri ve iletişim",
      "metin": [
        "Şirket tavsiye kaydında hangi bilgiyi tutacağını açıklamalıdır.",
        "Tavsiye kaydına çalışan verisi girilmemelidir.",
        "Tanıştırılan firma iletişim tercihini kendisi bildirebilmelidir."
      ]
    },
    {
      "baslik": "Değişiklik, ayrılma ve itiraz",
      "metin": [
        "Şirket koşulları değiştirirse yeni koşulu önceden yazılı bildirmelidir.",
        "Açık tavsiyelerin hangi koşulla sonuçlanacağı yazılmalıdır.",
        "İtirazı inceleyecek rol yazılmalıdır. Önerilen rol müşteri sorumlusudur."
      ]
    }
  ],
  "acikKonular": [
    {
      "baslik": "Hangi kampanya sürümü geçerli?",
      "mevcut": "İki hesap sürümü ödül koşulunu farklı anlatır.",
      "eksik": "Her firmanın kabul ettiği sürüm kayıtlı olmayabilir.",
      "islem": "Müşteri sorumlusu geçerli sürümü tavsiye öncesinde yazılı bildirsin.",
      "kanit": "Tavsiye kaydında kabul edilen koşulun tarihi bulunsun.",
      "firsat": "Kısa koşul özeti yanlış beklentiyi azaltabilir.",
      "durdur": "Sürüm seçilmeden ödül tarihi vaat etmeyin."
    },
    {
      "baslik": "Ücretsiz kullanım mı, komisyon mu?",
      "mevcut": "Ana program ücretsiz kullanım verir. Ayrı bir seçenek nakit komisyon verir.",
      "eksik": "Seçimin ne zaman ve kimin onayıyla yapılacağı yazılmamıştır.",
      "islem": "Müşteri sorumlusu seçimi tavsiye öncesinde yazılı kaydetsin.",
      "kanit": "Tavsiye kaydında seçilen program ve tarihi bulunsun.",
      "firsat": "Tek seçim, çifte ödül karışıklığını önleyebilir.",
      "durdur": "Program seçilmeden ödül türü söylemeyin."
    },
    {
      "baslik": "Grup şirketleri sayılıyor mu?",
      "mevcut": "Program yeni müşterinin tavsiyesini ödüllendirir.",
      "eksik": "Bağlı şirket ve yinelenen başvuru ölçütü net değildir.",
      "islem": "Müşteri sorumlusu yeni müşteri kontrolünü yazılı tanımlasın.",
      "kanit": "Aynı başvurunun tekrar sayılmadığı örnekle doğrulansın.",
      "firsat": "Düzgün kayıt ödül itirazlarını azaltabilir.",
      "durdur": "Çakışan kayıtta ödül uygulamasını inceleme bitene kadar bekletin."
    },
    {
      "baslik": "60 gün ne zaman başlar?",
      "mevcut": "Birinci sürüm 60 gün kullanmaya devam etme koşulunu koyar.",
      "eksik": "Sürenin kurulumla mı, ilk bordroyla mı başladığı yazılmamıştır.",
      "islem": "Müşteri sorumlusu başlangıç olayını yazılı tanımlasın.",
      "kanit": "Tavsiye kaydında başlangıç ve bitiş tarihi görülsün.",
      "firsat": "Açık tarih, ödül sorularını azaltabilir.",
      "durdur": "Başlangıç belirsizse ödül tarihi söylemeyin."
    },
    {
      "baslik": "Vergi ve fatura işlemi nasıl olacak?",
      "mevcut": "Kaynak ana ödülün nakit olmadığını söyler. Vergi işlemini açıklamaz.",
      "eksik": "Ücretsiz kullanımın ve komisyonun belge işlemi belirlenmemiştir.",
      "islem": "Finans sorumlusu bu konuyu mali müşavirle yazılı karara bağlasın.",
      "kanit": "Karar, örnek bir faturayla birlikte saklansın.",
      "firsat": "Tek bir açıklama, firma sorularını azaltabilir.",
      "durdur": "Karar yazılmadan ödülün vergi sonucunu anlatmayın."
    },
    {
      "baslik": "Yeni müşteri bırakırsa ne olacak?",
      "mevcut": "Kaynak, ana programda iptal ve iade kuralı vermez.",
      "eksik": "Kullanılmış ücretsiz sürenin geri alınıp alınmayacağı belli değildir.",
      "islem": "Finans sorumlusu bu kuralı tavsiye başlamadan yazsın.",
      "kanit": "Kural, firmaya verilen koşul yazısında bulunsun.",
      "firsat": "Açık kural sonradan çıkacak itirazları azaltabilir.",
      "durdur": "Kural yazılmadan kullanılmış süreyi geri almayın."
    }
  ],
  "kesifler": [
    {
      "baslik": "Çalışan verisi tavsiyeyle mi dolaşıyor?",
      "sinyal": "Başvuruda bordro dosyası veya çalışan listesi görülebilir.",
      "kontrol": "Müşteri sorumlusu başvuru eklerini ilk gün kontrol etsin.",
      "tepki": "Çalışan verisi varsa eki kullanmasın. Veri sorumlusuna bildirsin.",
      "kayit": "Bildirim tarihini kişisel veri çoğaltmadan kaydedin."
    },
    {
      "baslik": "Teşvik beklentisi abartılıyor mu?",
      "sinyal": "Yeni firma, belirli bir teşvik tutarı sözü verildiğini söyleyebilir.",
      "kontrol": "Satış uzmanı ilk görüşmede firmanın beklentisini sorsun.",
      "tepki": "Söz verilmişse firmaya bunun geçerli olmadığını açıklasın.",
      "kayit": "Düzeltme tarihini tavsiye kaydına yazın."
    },
    {
      "baslik": "Ödül yanlış hesaba mı gidiyor?",
      "sinyal": "Tavsiye yapan kişi ile firma hesabının yetkilisi farklı olabilir.",
      "kontrol": "Müşteri sorumlusu firma hesabının yetkilisini doğrulasın.",
      "tepki": "Yetki belirsizse ödülü başka hesaba taşımayı durdursun.",
      "kayit": "Kararı kişisel veri çoğaltmadan hesap kaydında saklayın."
    },
    {
      "baslik": "Tavsiye ilişkisi gizleniyor mu?",
      "sinyal": "Mesleki toplulukta paylaşım, ödül ilişkisini belirtmeden bağımsız görüş gibi görünebilir.",
      "kontrol": "Müşteri sorumlusu açık paylaşımlardan küçük bir örneğe baksın.",
      "tepki": "İlişki belirtilmemişse firmadan paylaşımı düzeltmesini istesin.",
      "kayit": "İstek tarihini ve düzeltme sonucunu kaydedin."
    }
  ],
  "haftalik": [
    "Müşteri sorumlusu o hafta gelen tavsiyeleri saysın.",
    "Bu tavsiyelerden kaçının firmanıza bağlandığını ayrıca saysın.",
    "Ücretsiz kullanım ve komisyon seçen tavsiyeleri ayrı saysın.",
    "Finans sorumlusu koşulu tamamlanan tavsiyeleri saysın.",
    "Ödülü faturaya yansıyan tavsiyeleri de ayrıca saysın.",
    "Bağlanmayan veya bekleyen tavsiye artarsa sorumlu nedenini incelesin.",
    "Gecikme varsa sorumlu firmaya nedeni ve sonraki adımı bildirsin.",
    "Sizin satış hedefiniz veya haftalık çalışma zorunluluğunuz yoktur."
  ],
  "programlar": {
    "ana": [
      "Varsayılan ödül ücretsiz kullanımdır. Nakit ödeme değildir.",
      "Satışı, kurulumu ve desteği şirket yürütür."
    ],
    "tek-sefer": [
      "Bu ayrı seçenek isteğe bağlıdır.",
      "Ödül, yeni müşterinin ilk faturasından hesaplanan nakit komisyondur.",
      "Hesaplayıcı koşuluna göre komisyon müşteri ödeyince doğar.",
      "Aynı koşula göre iade olursa komisyon geri alınır.",
      "Bu seçenekte de yalnız tanıştırma yaparsınız. Satışı şirket yürütür.",
      "Aynı tavsiye için ücretsiz kullanım ve komisyon kendiliğinden birleşmez.",
      "Finans sorumlusu ödeme belgesini ve vergi işlemini önceden netleştirmelidir."
    ]
  }
};
