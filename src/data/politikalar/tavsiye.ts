import type { Politika } from './types';

export const politika: Politika = {
  "id": "tavsiye",
  "ad": "Mevcut müşteri",
  "amac": "Memnun kaldığınız hizmeti uygun bir işletmeye önerin.",
  "iliski": "Siz mevcut müşterisiniz. Yalnız tanıştırma yaparsınız. Satış, sözleşme ve desteği şirket yürütür.",
  "gorev": [
    "Yalnız yaşadığınız deneyimi anlatın. Kesin kazanç veya sonuç vaat etmeyin.",
    "Tavsiye karşılığı ödül alabileceğinizi işletmeye açıkça söyleyin.",
    "İşletme ilgilenirse şirketin başvuru yolunu kendisi kullansın.",
    "Tavsiye kaydınızın size bağlandığını müşteri sorumlusundan doğrulayın."
  ],
  "sinir": [
    "İşletmenin izni olmadan telefonunu veya çalışan bilgilerini paylaşmayın.",
    "Ürün gösterimi, teklif, tahsilat veya destek sizin göreviniz değildir.",
    "Şirket adına fiyat, indirim veya süre sözü vermeyin.",
    "Ana programın ödülü ücretsiz kullanımdır. Nakit ödeme değildir."
  ],
  "adimlar": [
    {
      "baslik": "Önce kendi deneyiminizi değerlendirin",
      "metin": [
        "Hizmetten doğrulanmış sonuç aldıysanız deneyiminizi paylaşabilirsiniz.",
        "Çözülmemiş sorununuz varsa önce müşteri sorumlusuna bildirin.",
        "Tavsiye yapmak mevcut hizmeti almanızın şartı değildir."
      ]
    },
    {
      "baslik": "Geçerli koşulu tavsiyeden önce öğrenin",
      "metin": [
        "Müşteri sorumlusu geçerli hesap sürümünü size yazılı bildirsin.",
        "Bu yazıda ödül koşulu ve yıllık tavsiye sınırı bulunsun.",
        "Yazılı koşul gelmeden ödül beklentisiyle tavsiye yapmayın."
      ]
    },
    {
      "baslik": "Uygun işletmeyi seçin",
      "metin": [
        "Tanıdığınız işletmenin ihtiyacını sorun.",
        "İhtiyaç hizmete uyuyorsa tanıştırmayı teklif edin.",
        "Ödül alabileceğinizi bu konuşmada açıkça söyleyin.",
        "İşletme istemezse konuyu kapatın. Bilgisini kimseye iletmeyin."
      ]
    },
    {
      "baslik": "Tanıştırmayı kaydettirin",
      "metin": [
        "İşletme kabul ederse şirketin onaylı başvuru yolunu paylaşın.",
        "İşletme başvurusunda sizin adınızı tavsiye eden olarak yazsın.",
        "Müşteri sorumlusu tavsiyenin size bağlandığını size yazılı bildirsin.",
        "Daha önce kayıt varsa müşteri sorumlusu uygunluğu incelesin."
      ]
    },
    {
      "baslik": "Satışı şirkete bırakın",
      "metin": [
        "Satış uzmanı işletmenin ihtiyacını değerlendirir ve teklif verir.",
        "Şirketin yetkili kişisi sözleşmeyi hazırlar.",
        "Kurulum ve destek işlerini şirket yürütür.",
        "Siz müşteri adına karar vermezsiniz. Görüşmeleri takip etmek zorunda değilsiniz."
      ]
    },
    {
      "baslik": "Ödül koşulunu kontrol edin",
      "metin": [
        "Birinci sürümde yeni müşterinin yıllık paket alması gerekir.",
        "Birinci sürümde yeni müşteri 60 gün kullanmaya devam etmelidir.",
        "İkinci sürüm seçildiyse ödeme belirlenen süre içinde alınmalıdır.",
        "Ödeme bu sürede alınmazsa ikinci sürümde ödül hakkı oluşmaz.",
        "Koşul sağlanırsa finans sorumlusu ücretsiz kullanımı hesabınıza işler.",
        "Yeni müşterinin kendi ödülünü şirket ona ayrıca bildirir."
      ]
    },
    {
      "baslik": "Ödülün uygulandığını görün",
      "metin": [
        "Finans sorumlusu ücretsiz sürenin hangi faturaya yansıdığını bildirsin.",
        "Yansıma görünmüyorsa müşteri sorumlusuna tavsiye tarihini iletin.",
        "İş burada biter. Yeni tavsiye için aynı sıra yeniden başlar."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "iStoc",
      "ad": "Aynı çarşıdaki toptancı",
      "ihtiyac": "Komşu işletme ürünlerini düzenli sunmak isteyebilir.",
      "ulasim": "İşletme sahibiyle mevcut ilişkiniz içinde konuşun.",
      "mesaj": "İsterseniz kullandığım ürün gösterme yöntemini anlatabilirim.",
      "uygunluk": "İlgilenmiyorsa iletişim bilgisini şirkete vermeyin.",
      "sonrasi": "İsterse şirketin başvuru yolunu kendisi kullansın."
    },
    {
      "urun": "iStoc",
      "ad": "Düzenli çalıştığınız tedarikçi",
      "ihtiyac": "Tedarikçi güncel katalog paylaşmakta zorlanabilir.",
      "ulasim": "Sipariş görüşmesinin uygun bir anında izin isteyin.",
      "mesaj": "Ürün listenizi paylaşmak için başka bir yöntem arıyor musunuz?",
      "uygunluk": "Siparişinizi tavsiye kabulüne bağlamayın.",
      "sonrasi": "İhtiyaç uygunsa tanıştırma yapın."
    },
    {
      "urun": "iStoc",
      "ad": "İş çevrenizdeki üretici",
      "ihtiyac": "Üretici yeni satış kanallarını değerlendirmek isteyebilir.",
      "ulasim": "Mevcut iş toplantısında deneyiminizi paylaşmayı teklif edin.",
      "mesaj": "Kendi kullanım deneyimimi duymak ister misiniz?",
      "uygunluk": "Kazanmadığınız geliri kazanmış gibi anlatmayın.",
      "sonrasi": "İlgilenirse satış uzmanıyla doğrudan görüşsün."
    },
    {
      "urun": "Segika",
      "ad": "Aynı sanayi bölgesindeki firma",
      "ihtiyac": "Firma bordro takibini geliştirmek isteyebilir.",
      "ulasim": "Tanıdığınız insan kaynakları yöneticisiyle izinli birebir görüşün.",
      "mesaj": "Bordro takibi için kullandığımız yöntemi paylaşmamı ister misiniz?",
      "uygunluk": "Çalışan verisini örnek olarak göndermeyin.",
      "sonrasi": "İlgilenirse şirketle kendisi iletişim kursun."
    },
    {
      "urun": "Segika",
      "ad": "Grup içindeki başka şirket",
      "ihtiyac": "Diğer şirket benzer takip sorunları yaşıyor olabilir.",
      "ulasim": "Muhasebe sorumlusuyla şirket yetkilerini gözeterek konuşun.",
      "mesaj": "Sizin süreçte de benzer bir takip ihtiyacı var mı?",
      "uygunluk": "Ayrı şirketin kampanyaya uygunluğunu kendiniz kararlaştırmayın.",
      "sonrasi": "Müşteri sorumlusu şirket ilişkisini ve uygunluğu kontrol etsin."
    },
    {
      "urun": "Segika",
      "ad": "Mesleki çevrenizdeki işletme",
      "ihtiyac": "İşletme insan kaynakları işlemlerini düzenlemek isteyebilir.",
      "ulasim": "Toplulukta genel deneyiminizi paylaşın. Toplu özel mesaj göndermeyin.",
      "mesaj": "Tavsiye ödülü alabilirim. İlgilenenlerle deneyimimi paylaşabilirim.",
      "uygunluk": "Üyelerin listesini şirketle paylaşmayın.",
      "sonrasi": "İlgilenen kişi kendi isteğiyle başvursun."
    }
  ],
  "sorunlar": [
    {
      "kosul": "Tavsiye size bağlanmamışsa",
      "islem": "Müşteri sorumlusuna başvuru bilgisini ve tanıştırma tarihini iletin.",
      "sonuc": "Sorumlu kaydı inceler. Sonucu size yazılı açıklar."
    },
    {
      "kosul": "İşletme zaten müşteri veya kayıtlı aday ise",
      "islem": "Müşteri sorumlusu yeni müşteri koşulunu kontrol etsin.",
      "sonuc": "Uygunluk doğrulanmadan ödül sözü verilmez."
    },
    {
      "kosul": "Aynı işletmeyi iki kişi tavsiye ettiyse",
      "islem": "Müşteri sorumlusu iki kaydın tarihini karşılaştırsın.",
      "sonuc": "Karar ve gerekçesi iki tarafa da yazılı bildirilir."
    },
    {
      "kosul": "Yıllık tavsiye sınırına ulaştıysanız",
      "islem": "Müşteri sorumlusundan kalan hakkınızı öğrenin.",
      "sonuc": "Sınırı aşan tavsiye ödül doğurmaz. Nakit komisyona da dönüşmez."
    },
    {
      "kosul": "Yeni müşteri ödemezse veya hizmeti iptal ederse",
      "islem": "Finans sorumlusu ilgili ödülün koşullarını yeniden incelesin.",
      "sonuc": "Kaynakta iptal kuralı yoktur. Finans sorumlusu kararı size yazılı açıklasın."
    },
    {
      "kosul": "Bir tavsiyenin ödülüne itiraz ederseniz",
      "islem": "Müşteri sorumlusuna itirazınızı ve tavsiye tarihini yazılı iletin.",
      "sonuc": "Finans sorumlusu ilgili ödülü inceler. Kararını kabul edilen tavsiye koşullarına göre yazılı açıklar."
    },
    {
      "kosul": "Tanıştırdığınız işletme iletişim istemezse",
      "islem": "Müşteri sorumlusu bu işletmeye pazarlama iletisi göndermeyi durdursun.",
      "sonuc": "Ret kaydedilir. İşletmeye yeniden pazarlama iletisi gönderilmez."
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
        "Şirket sizi tanıştırma yapan mevcut müşteri olarak yazmalıdır.",
        "Satış, sözleşme, kurulum ve desteğin şirkette olduğu yazılmalıdır.",
        "Size çalışan veya satış görevi verilmediği açıkça belirtilmelidir."
      ]
    },
    {
      "baslik": "Kampanya koşulları",
      "metin": [
        "Şirket hangi müşterilerin katılabileceğini açıkça yazmalıdır.",
        "Yeni müşteri tanımı, kayıt tarihi ve sınırın dönemi belirtilmelidir.",
        "Geçerli hesap sürümü ve yürürlük tarihi yazılmalıdır."
      ]
    },
    {
      "baslik": "Tavsiyenin size bağlanması",
      "metin": [
        "Şirket tavsiyenin hangi kayıtla size bağlanacağını yazmalıdır.",
        "Aynı işletme için birden çok kayıt varsa karar kuralı yazılmalıdır."
      ]
    },
    {
      "baslik": "Ücretsiz kullanım",
      "metin": [
        "Finans sorumlusu ücretsiz sürenin hangi pakete uygulanacağını yazmalıdır.",
        "Paket değişimi, iptal ve kullanılmayan süre ayrıca açıklanmalıdır.",
        "Nakit dönüşüm varsa ayrı onaylı program gerekir."
      ]
    },
    {
      "baslik": "Vergi ve fatura",
      "metin": [
        "Ücretsiz kullanımın faturada nasıl görüneceği henüz karar verilmemiş konudur.",
        "Finans sorumlusu mali müşavirle bu işlemi yazılı belirlemelidir."
      ]
    },
    {
      "baslik": "Tanıtım ve içerik",
      "metin": [
        "Tavsiye ilişkisini açıkça belirtme kuralı yazılmalıdır.",
        "Şirket adını veya görselini kullanma izni ayrıca yazılmalıdır."
      ]
    },
    {
      "baslik": "Veri ve iletişim",
      "metin": [
        "Şirket tavsiye kaydında hangi bilgiyi tutacağını açıklamalıdır.",
        "Tanıştırılan işletme iletişim tercihini kendisi bildirebilmelidir."
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
      "eksik": "Her müşterinin kabul ettiği sürüm kayıtlı olmayabilir.",
      "islem": "Müşteri sorumlusu geçerli sürümü tavsiye öncesinde yazılı bildirsin.",
      "kanit": "Tavsiye kaydında kabul edilen koşulun tarihi bulunsun.",
      "firsat": "Kısa koşul özeti yanlış beklentiyi azaltabilir.",
      "durdur": "Sürüm seçilmeden ödül tarihi vaat etmeyin."
    },
    {
      "baslik": "Ücretsiz süre nereye yazılacak?",
      "mevcut": "Hesaplayıcı ücretsiz kullanım tutarını gösterir.",
      "eksik": "Paket değişimi ve kullanılmayan süre açıklanmamıştır.",
      "islem": "Finans sorumlusu fatura örneğiyle uygulamayı belirlesin.",
      "kanit": "Örnek faturada ücretsiz süre ve kalan ödeme görülsün.",
      "firsat": "Hesap özeti müşterinin kalan hakkını kolayca görmesini sağlayabilir.",
      "durdur": "Belirsiz tutarı kesin kazanılmış hak gibi göstermeyin."
    },
    {
      "baslik": "Vergi ve fatura işlemi nasıl olacak?",
      "mevcut": "Kaynak ödülün nakit olmadığını söyler. Vergi işlemini açıklamaz.",
      "eksik": "Ücretsiz kullanımın faturadaki karşılığı belirlenmemiştir.",
      "islem": "Finans sorumlusu bu konuyu mali müşavirle yazılı karara bağlasın.",
      "kanit": "Karar, örnek bir faturayla birlikte saklansın.",
      "firsat": "Tek bir açıklama, müşteri sorularını azaltabilir.",
      "durdur": "Karar yazılmadan ödülün vergi sonucunu anlatmayın."
    },
    {
      "baslik": "İptal veya iade olursa ne olacak?",
      "mevcut": "Kaynak, ana programda iptal ve iade kuralı vermez.",
      "eksik": "Kullanılmış ücretsiz sürenin geri alınıp alınmayacağı belli değildir.",
      "islem": "Finans sorumlusu bu kuralı tavsiye başlamadan yazsın.",
      "kanit": "Kural, müşteriye verilen koşul yazısında bulunsun.",
      "firsat": "Açık kural sonradan çıkacak itirazları azaltabilir.",
      "durdur": "Kural yazılmadan kullanılmış süreyi geri almayın."
    },
    {
      "baslik": "Aynı firma yeniden sayılıyor mu?",
      "mevcut": "Program yeni müşterinin tavsiyesini ödüllendirir.",
      "eksik": "Bağlı şirket ve yinelenen başvuru ölçütü net değildir.",
      "islem": "Müşteri sorumlusu yeni müşteri kontrolünü yazılı tanımlasın.",
      "kanit": "Aynı başvurunun tekrar sayılmadığı örnekle doğrulansın.",
      "firsat": "Düzgün kayıt ödül itirazlarını azaltabilir.",
      "durdur": "Çakışan kayıtta ödül uygulamasını inceleme bitene kadar bekletin."
    }
  ],
  "kesifler": [
    {
      "baslik": "Tavsiye baskıya dönüşüyor mu?",
      "sinyal": "Müşteri hizmet almak için tavsiye vermesi gerektiğini düşünebilir.",
      "kontrol": "Müşteri sorumlusu katılmayan müşterilerin deneyimini de dinlesin.",
      "tepki": "Baskı işareti varsa kullanılan çağrıyı durdurup düzeltsin.",
      "kayit": "Gönüllü katılımın nasıl açıklandığını kaydedin."
    },
    {
      "baslik": "Ödül yanlış kişiye mi gidiyor?",
      "sinyal": "Şirket hesabı ile başvuran kişinin yetkisi farklı olabilir.",
      "kontrol": "Müşteri sorumlusu hesap yetkilisini doğrulasın.",
      "tepki": "Yetki belirsizse ödülü başka hesaba taşımayı durdursun.",
      "kayit": "Kararı kişisel veri çoğaltmadan hesap kaydında saklayın."
    },
    {
      "baslik": "İletişim bilgisi izinsiz mi geliyor?",
      "sinyal": "Başvuruda işletmenin bilmediği bir iletişim bilgisi görülebilir.",
      "kontrol": "Müşteri sorumlusu ilk görüşmede işletmenin onayını sorsun.",
      "tepki": "Onay yoksa görüşmeyi kapatsın. Bilgiyi kayıttan silsin.",
      "kayit": "Silme tarihini ve nedenini kaydedin."
    },
    {
      "baslik": "Tavsiye ilişkisi gizleniyor mu?",
      "sinyal": "Paylaşım, ödül ilişkisini belirtmeden bağımsız görüş gibi görünebilir.",
      "kontrol": "Müşteri sorumlusu açık paylaşımlardan küçük bir örneğe baksın.",
      "tepki": "İlişki belirtilmemişse müşteriden paylaşımı düzeltmesini istesin.",
      "kayit": "İstek tarihini ve düzeltme sonucunu kaydedin."
    }
  ],
  "haftalik": [
    "Müşteri sorumlusu o hafta gelen tavsiyeleri saysın.",
    "Bu tavsiyelerden kaçının size bağlandığını ayrıca saysın.",
    "Finans sorumlusu koşulu tamamlanan tavsiyeleri saysın.",
    "Ödülü faturaya yansıyan tavsiyeleri de ayrıca saysın.",
    "Bağlanmayan veya bekleyen tavsiye artarsa sorumlu nedenini incelesin.",
    "Gecikme varsa sorumlu müşteriye nedeni ve sonraki adımı bildirsin.",
    "Sizin satış hedefiniz veya haftalık çalışma zorunluluğunuz yoktur."
  ],
  "programlar": {
    "ana": [
      "Varsayılan ödül ücretsiz kullanımdır. Satışı ve desteği şirket yürütür."
    ],
    "tek-sefer": [
      "Bu ayrı seçenek isteğe bağlıdır ve yalnız Segika içindir.",
      "Ödül, yeni müşterinin ilk faturasından hesaplanan nakit komisyondur.",
      "Bu seçenekte de yalnız tanıştırma yaparsınız. Satışı şirket yürütür.",
      "Aynı tavsiye için ücretsiz kullanım ve komisyon kendiliğinden birleşmez.",
      "Finans sorumlusu ödeme belgesini ve vergi işlemini önceden netleştirmelidir."
    ]
  }
};
