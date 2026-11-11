import type { Politika } from './types';

export const politika: Politika = {
  "id": "tavsiye",
  "ad": "Mevcut müşteri",
  "amac": "Memnun kaldığınız hizmeti uygun bir işletmeye önerin.",
  "iliski": "Siz mevcut müşterisiniz. Tanıştırma yaparsınız. Satış, sözleşme ve desteği şirket yürütür.",
  "gorev": [
    "Yalnız yaşadığınız deneyimi anlatın. Kesin kazanç veya sonuç vaat etmeyin.",
    "İşletme ilgilenirse kendi iletişim bilgilerini şirkete göndermesini önerin.",
    "Tavsiye kaydınızın size bağlandığını müşteri sorumlusundan doğrulayın."
  ],
  "sinir": [
    "İşletmenin izni olmadan telefonunu veya çalışan bilgilerini paylaşmayın.",
    "Ürün gösterimi, tahsilat veya müşteri desteği vermek zorunda değilsiniz.",
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
      "baslik": "Uygun işletmeyi seçin",
      "metin": [
        "Tanıdığınız işletmenin ihtiyacını sorun.",
        "İhtiyaç hizmete uyuyorsa tanıştırmayı teklif edin.",
        "İşletme istemezse konuyu kapatın."
      ]
    },
    {
      "baslik": "Tanıştırmayı kaydettirin",
      "metin": [
        "İşletme kabul ederse şirketin onaylı başvuru yolunu paylaşın.",
        "Müşteri sorumlusu tavsiyenin size bağlı olduğunu doğrulasın.",
        "Daha önce kayıt varsa sorumlu uygunluğu incelesin."
      ]
    },
    {
      "baslik": "Satışı şirkete bırakın",
      "metin": [
        "Satış uzmanı işletmenin ihtiyacını değerlendirir ve teklif verir.",
        "Şirketin yetkili kişisi sözleşmeyi hazırlar.",
        "Siz müşteri adına karar vermezsiniz."
      ]
    },
    {
      "baslik": "Ödül koşulunu kontrol edin",
      "metin": [
        "Müşteri sorumlusu geçerli kampanya koşulunu size açıklasın.",
        "Koşullar sağlanırsa ücretsiz kullanım hesabınıza işlenir.",
        "Kullanımın hangi faturaya yansıdığını finans sorumlusundan öğrenin."
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
      "mesaj": "İlgilenenlerle kullanım deneyimimi paylaşabilirim.",
      "uygunluk": "Üyelerin listesini şirketle paylaşmayın.",
      "sonrasi": "İlgilenen kişi kendi isteğiyle başvursun."
    }
  ],
  "sorunlar": [
    {
      "kosul": "Tavsiye size bağlanmamışsa",
      "islem": "Müşteri sorumlusuna başvuru bilgisini ve tanıştırma tarihini iletin.",
      "sonuc": "Sorumlu kaydı inceler. Sonucu size açıklar."
    },
    {
      "kosul": "İşletme zaten müşteri veya kayıtlı aday ise",
      "islem": "Müşteri sorumlusu yeni müşteri koşulunu kontrol etsin.",
      "sonuc": "Uygunluk doğrulanmadan ödül sözü verilmez."
    },
    {
      "kosul": "Kampanya sınırına ulaştıysanız",
      "islem": "Müşteri sorumlusundan kalan hakkınızı öğrenin.",
      "sonuc": "Yeni tavsiye kendiliğinden nakit komisyona dönüşmez."
    },
    {
      "kosul": "Yeni müşteri ödemezse veya hizmeti iptal ederse",
      "islem": "Finans sorumlusu ilgili ödülün koşullarını yeniden incelesin.",
      "sonuc": "Kullanılmış ücretsiz sürenin nasıl ele alınacağı size açıklansın."
    },
    {
      "kosul": "Tavsiyeden vazgeçmek isterseniz",
      "islem": "Müşteri sorumlusuna pazarlama iletişimini durdurma talebinizi bildirin.",
      "sonuc": "Talep kaydedilir. Mevcut hizmetiniz tavsiye vermeye bağlı tutulmaz."
    }
  ],
  "anlasma": [
    {
      "baslik": "Kampanya koşulları",
      "metin": [
        "Şirket hangi müşterilerin katılabileceğini açıkça yazmalıdır.",
        "Yeni müşteri tanımı, kayıt tarihi ve sınırın dönemi belirtilmelidir."
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
      "baslik": "Veri ve iletişim",
      "metin": [
        "Şirket tavsiye kaydında hangi bilgiyi tutacağını açıklamalıdır.",
        "Tanıştırılan işletme iletişim tercihini kendisi bildirebilmelidir."
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
    }
  ],
  "haftalik": [
    "Müşteri sorumlusu bekleyen tavsiyeleri ve eksik kayıtları kontrol etsin.",
    "Finans sorumlusu ödül koşulu tamamlananları uygun tavsiyelere bölsün.",
    "Gecikme varsa sorumlu müşteriye nedeni ve sonraki adımı bildirsin.",
    "Sizin satış hedefiniz veya haftalık çalışma zorunluluğunuz yoktur."
  ],
  "programlar": {
    "ana": [
      "Varsayılan ödül ücretsiz kullanımdır. Satışı ve desteği şirket yürütür."
    ],
    "tek-sefer": [
      "Bu ayrı seçenek yalnız Segika içindir. Ödül ilk faturadan hesaplanan nakit komisyondur.",
      "Aynı tavsiye için ücretsiz kullanım ve komisyon kendiliğinden birleşmez.",
      "Finans sorumlusu ödeme belgesini ve vergi işlemini önceden netleştirmelidir."
    ]
  }
};
