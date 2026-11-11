import type { ProjePolitika } from '../types';

export const politika: ProjePolitika = {
  "id": "tavsiye",
  "proje": "istoc",
  "ad": "Mevcut müşteri",
  "amac": "Kullandığınız iStoc hizmetini çevrenizdeki uygun bir ticari işletmeye önerin.",
  "iliski": "Siz iStoc kullanan bir satıcısınız. Yalnız tanıştırma yaparsınız. Satış, sözleşme ve desteği şirket yürütür. Yeni işletmenin kataloğunu siz hazırlamazsınız.",
  "gorev": [
    "Ürünlerinizi iStoc ile nasıl sunduğunuzu kendi deneyiminizle anlatın.",
    "Alıcı sayısı, sipariş veya satış artışı vaat etmeyin.",
    "Tavsiye karşılığı ödül alabileceğinizi işletmeye açıkça söyleyin.",
    "İşletme ilgilenirse şirketin başvuru yolunu kendisi kullansın.",
    "Tavsiyenin size bağlandığını müşteri sorumlusundan doğrulayın."
  ],
  "sinir": [
    "İşletmenin izni olmadan telefonunu şirkete vermeyin.",
    "Başka işletmenin ürün bilgisini kendi kataloğunuza yüklemeyin.",
    "Kendi alıcı listenizi ve fiyatlarınızı tavsiye için paylaşmayın.",
    "Katalog kurulumu, ürün gösterimi ve destek sizin göreviniz değildir.",
    "Şirket adına fiyat, indirim veya süre sözü vermeyin.",
    "Ödül ücretsiz iStoc kullanımıdır. Nakit ödeme değildir."
  ],
  "adimlar": [
    {
      "baslik": "Önce kendi deneyiminizi değerlendirin",
      "metin": [
        "Ürünlerinizi iStoc ile düzenli sunuyorsanız deneyiminizi paylaşabilirsiniz.",
        "Katalogda çözülmemiş sorununuz varsa önce müşteri sorumlusuna bildirin.",
        "Tavsiye yapmak mevcut hizmeti almanızın şartı değildir."
      ]
    },
    {
      "baslik": "Geçerli koşulu tavsiyeden önce öğrenin",
      "metin": [
        "Müşteri sorumlusu geçerli hesap sürümünü size yazılı bildirsin.",
        "Bu yazıda ödül koşulu ve yıllık tavsiye sınırı bulunsun.",
        "Çarşıda sözlü duyulan koşulu esas almayın. Yazılı koşulu esas alın.",
        "Yazılı koşul gelmeden ödül beklentisiyle tavsiye yapmayın."
      ]
    },
    {
      "baslik": "Uygun işletmeyi seçin",
      "metin": [
        "Tanıdığınız işletmeye ürünlerini nasıl sunduğunu sorun.",
        "Ürün bilgisini düzenli paylaşma ihtiyacı varsa tanıştırmayı teklif edin.",
        "Ödül alabileceğinizi bu konuşmada açıkça söyleyin.",
        "İşletme istemezse konuyu kapatın. Bilgisini kimseye iletmeyin."
      ]
    },
    {
      "baslik": "Tanıştırmayı kaydettirin",
      "metin": [
        "İşletme kabul ederse şirketin onaylı başvuru yolunu paylaşın.",
        "İşletme başvuruda dükkân adını ve sizin dükkânınızı yazsın.",
        "Müşteri sorumlusu tavsiyenin dükkânınıza bağlandığını yazılı bildirsin.",
        "Dükkân daha önce kayıtlıysa müşteri sorumlusu uygunluğu incelesin."
      ]
    },
    {
      "baslik": "Satışı ve ürün bilgisi işini şirkete bırakın",
      "metin": [
        "Satış uzmanı işletmenin ürün yapısını değerlendirir ve teklif verir.",
        "Şirketin yetkili kişisi sözleşmeyi hazırlar.",
        "Ürün bilgisinin nasıl yükleneceğini satış uzmanı işletmeye açıklar.",
        "Siz işletme adına karar vermezsiniz. Görüşmeleri takip etmek zorunda değilsiniz."
      ]
    },
    {
      "baslik": "Ödül koşulunu kontrol edin",
      "metin": [
        "Birinci sürümde yeni müşterinin yıllık paket alması gerekir.",
        "Birinci sürümde yeni müşteri 60 gün kullanmaya devam etmelidir.",
        "Bu iki koşul sağlanırsa ücretsiz kullanım hesabınıza yazılır.",
        "İkinci sürüm seçildiyse ödeme belirlenen süre içinde alınmalıdır.",
        "Ödeme bu sürede alınmazsa ikinci sürümde ödül hakkı oluşmaz.",
        "Yeni müşterinin kendi ödülünü şirket ona ayrıca bildirir."
      ]
    },
    {
      "baslik": "Ödülün uygulandığını görün",
      "metin": [
        "Finans sorumlusu ödülün yansıdığı dükkân faturasını size bildirsin.",
        "Ödül görünmüyorsa müşteri sorumlusuna dükkân adını ve tarihi iletin.",
        "İş burada biter. Yeni tavsiye için aynı sıra yeniden başlar."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "iStoc",
      "ad": "Çarşıdaki komşu dükkân",
      "ihtiyac": "Komşu dükkân ürünlerini alıcılara düzenli göstermek isteyebilir.",
      "ulasim": "Dükkân sahibiyle mevcut komşuluk ilişkiniz içinde yüz yüze konuşun.",
      "mesaj": "Ürünlerimi iStoc ile nasıl sunduğumu görmek ister misiniz?",
      "uygunluk": "İlgilenmiyorsa iletişim bilgisini şirkete vermeyin.",
      "sonrasi": "İsterse şirketin başvuru yolunu kendisi kullansın."
    },
    {
      "urun": "iStoc",
      "ad": "Aynı bloktaki toptancı",
      "ihtiyac": "Toptancı çok sayıda ürünün bilgisini güncel tutmakta zorlanabilir.",
      "ulasim": "Uygun bir anda dükkânında kısa bir görüşme isteyin.",
      "mesaj": "Ürün listemi güncel tutmak için iStoc kullanıyorum. Anlatmamı ister misiniz?",
      "uygunluk": "Kendi fiyatlarınızı veya alıcılarınızı örnek olarak göstermeyin.",
      "sonrasi": "İlgilenirse satış uzmanıyla doğrudan görüşsün."
    },
    {
      "urun": "iStoc",
      "ad": "Mal aldığınız tedarikçi esnaf",
      "ihtiyac": "Tedarikçi güncel kataloğunu alıcılarına ulaştırmakta zorlanabilir.",
      "ulasim": "Sipariş görüşmesinin uygun bir anında izin isteyin.",
      "mesaj": "Kataloğunuzu paylaşmak için başka bir yöntem arıyor musunuz?",
      "uygunluk": "Siparişinizi tavsiye kabulüne bağlamayın.",
      "sonrasi": "İhtiyaç uygunsa şirketin başvuru yolunu paylaşın."
    },
    {
      "urun": "iStoc",
      "ad": "Sizden mal alan esnaf",
      "ihtiyac": "Alıcınız kendi ürünlerini başka alıcılara sunmak isteyebilir.",
      "ulasim": "Alışveriş sonrasında, baskı kurmadan deneyiminizi anlatın.",
      "mesaj": "Ürünlerinizi göstermek için kullandığım yöntemi merak eder misiniz?",
      "uygunluk": "Alıcınıza indirimi tavsiye kabulüne bağlı sunmayın.",
      "sonrasi": "İlgilenirse şirketle kendisi iletişim kursun."
    }
  ],
  "sorunlar": [
    {
      "kosul": "Tavsiye size bağlanmamışsa",
      "islem": "Müşteri sorumlusuna başvuru bilgisini ve tanıştırma tarihini iletin.",
      "sonuc": "Sorumlu kaydı inceler. Sonucu size yazılı açıklar."
    },
    {
      "kosul": "İşletme zaten iStoc müşterisi veya kayıtlı aday ise",
      "islem": "Müşteri sorumlusu yeni müşteri koşulunu kontrol etsin.",
      "sonuc": "Uygunluk doğrulanmadan ödül sözü verilmez."
    },
    {
      "kosul": "Aynı dükkânı iki kişi tavsiye ettiyse",
      "islem": "Müşteri sorumlusu iki kaydın tarihini karşılaştırsın.",
      "sonuc": "Karar ve gerekçesi iki tarafa da yazılı bildirilir."
    },
    {
      "kosul": "İşletme ürünlerini sizin yüklemenizi isterse",
      "islem": "Müşteri sorumlusuna işletmenin yardım isteğini iletin.",
      "sonuc": "Satış uzmanı yükleme yolunu işletmeye açıklar. Siz yükleme yapmazsınız."
    },
    {
      "kosul": "İşletme kesin alıcı veya sipariş sözü isterse",
      "islem": "Böyle bir söz veremeyeceğinizi açıkça söyleyin.",
      "sonuc": "Satış uzmanı hizmetin neyi kapsadığını işletmeye kendisi anlatır."
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
        "Şirket sizi tanıştırma yapan iStoc müşterisi olarak yazmalıdır.",
        "Satış, sözleşme ve desteğin şirkette olduğu yazılmalıdır.",
        "Yeni işletmenin ürün bilgisini kimin yükleyeceği yazılmalıdır.",
        "Size çalışan veya satış görevi verilmediği açıkça belirtilmelidir."
      ]
    },
    {
      "baslik": "Kampanya koşulları",
      "metin": [
        "Şirket hangi satıcıların katılabileceğini açıkça yazmalıdır.",
        "Yeni müşteri tanımı, kayıt tarihi ve sınırın dönemi belirtilmelidir.",
        "Geçerli hesap sürümü ve yürürlük tarihi yazılmalıdır.",
        "Birinci sürümde yıllık paket ve 60 gün kullanım koşulu yazılmalıdır."
      ]
    },
    {
      "baslik": "Tavsiyenin size bağlanması",
      "metin": [
        "Şirket tavsiyenin hangi kayıtla size bağlanacağını yazmalıdır.",
        "Aynı dükkân için birden çok kayıt varsa karar kuralı yazılmalıdır.",
        "Aynı sahibin başka dükkânının nasıl sayılacağı yazılmalıdır."
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
      "baslik": "Tanıtım ve ürün bilgisi",
      "metin": [
        "Tavsiye ilişkisini açıkça belirtme kuralı yazılmalıdır.",
        "Kendi katalog görünümünüzü örnek gösterme izni ayrıca yazılmalıdır.",
        "Başka işletmenin ürün bilgisi sizin aracılığınızla toplanmamalıdır."
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
      "eksik": "Her satıcının kabul ettiği sürüm kayıtlı olmayabilir.",
      "islem": "Müşteri sorumlusu geçerli sürümü tavsiye öncesinde yazılı bildirsin.",
      "kanit": "Tavsiye kaydında kabul edilen koşulun tarihi bulunsun.",
      "firsat": "Kısa koşul özeti yanlış beklentiyi azaltabilir.",
      "durdur": "Sürüm seçilmeden ödül tarihi vaat etmeyin."
    },
    {
      "baslik": "60 gün ne zaman başlar?",
      "mevcut": "Birinci sürüm 60 gün kullanmaya devam etme koşulunu koyar.",
      "eksik": "Sürenin hangi tarihte başladığı yazılmamıştır.",
      "islem": "Müşteri sorumlusu başlangıç olayını yazılı tanımlasın.",
      "kanit": "Tavsiye kaydında başlangıç ve bitiş tarihi görülsün.",
      "firsat": "Açık tarih, ödül sorularını azaltabilir.",
      "durdur": "Başlangıç belirsizse ödül tarihi söylemeyin."
    },
    {
      "baslik": "Aynı sahibin başka dükkânı sayılıyor mu?",
      "mevcut": "Program yeni müşterinin tavsiyesini ödüllendirir.",
      "eksik": "Şube, ortak dükkân ve yinelenen başvuru ölçütü net değildir.",
      "islem": "Müşteri sorumlusu yeni müşteri kontrolünü yazılı tanımlasın.",
      "kanit": "Aynı işletmenin tekrar sayılmadığı örnekle doğrulansın.",
      "firsat": "Düzgün kayıt ödül itirazlarını azaltabilir.",
      "durdur": "Çakışan kayıtta ödül uygulamasını inceleme bitene kadar bekletin."
    },
    {
      "baslik": "Ücretsiz süre nereye yazılacak?",
      "mevcut": "Hesaplayıcı ücretsiz kullanım tutarını gösterir.",
      "eksik": "Paket değişimi ve kullanılmayan süre açıklanmamıştır.",
      "islem": "Finans sorumlusu fatura örneğiyle uygulamayı belirlesin.",
      "kanit": "Örnek faturada ücretsiz süre ve kalan ödeme görülsün.",
      "firsat": "Hesap özeti satıcının kalan hakkını kolayca görmesini sağlayabilir.",
      "durdur": "Belirsiz tutarı kesin kazanılmış hak gibi göstermeyin."
    },
    {
      "baslik": "Vergi ve fatura işlemi nasıl olacak?",
      "mevcut": "Kaynak ödülün nakit olmadığını söyler. Vergi işlemini açıklamaz.",
      "eksik": "Ücretsiz kullanımın faturadaki karşılığı belirlenmemiştir.",
      "islem": "Finans sorumlusu bu konuyu mali müşavirle yazılı karara bağlasın.",
      "kanit": "Karar, örnek bir faturayla birlikte saklansın.",
      "firsat": "Tek bir açıklama, satıcı sorularını azaltabilir.",
      "durdur": "Karar yazılmadan ödülün vergi sonucunu anlatmayın."
    },
    {
      "baslik": "Yeni müşteri bırakırsa ne olacak?",
      "mevcut": "Kaynak, ana programda iptal ve iade kuralı vermez.",
      "eksik": "Kullanılmış ücretsiz sürenin geri alınıp alınmayacağı belli değildir.",
      "islem": "Finans sorumlusu bu kuralı tavsiye başlamadan yazsın.",
      "kanit": "Kural, satıcıya verilen koşul yazısında bulunsun.",
      "firsat": "Açık kural sonradan çıkacak itirazları azaltabilir.",
      "durdur": "Kural yazılmadan kullanılmış süreyi geri almayın."
    }
  ],
  "kesifler": [
    {
      "baslik": "Tavsiye komşuluk ilişkisini bozuyor mu?",
      "sinyal": "Tanıştırılan komşu dükkân, sizinle aynı alıcılara satış yapıyor olabilir.",
      "kontrol": "Müşteri sorumlusu tavsiye eden satıcıya memnuniyetini sorsun.",
      "tepki": "Çatışma işareti varsa yeni tavsiye çağrısını o satıcıya göndermesin.",
      "kayit": "Görüşme tarihini ve kısa sonucu kaydedin."
    },
    {
      "baslik": "Tavsiye alıcıya baskıya dönüşüyor mu?",
      "sinyal": "Alıcı esnaf, sipariş için tavsiye kabul etmesi gerektiğini düşünebilir.",
      "kontrol": "Müşteri sorumlusu ilk görüşmede işletmenin gönüllü geldiğini sorsun.",
      "tepki": "Baskı işareti varsa başvuruyu bekletsin. Tavsiye edenle konuşsun.",
      "kayit": "Gönüllü katılımın nasıl doğrulandığını kaydedin."
    },
    {
      "baslik": "Ürün bilgisi izinsiz mi geliyor?",
      "sinyal": "Başvuruda işletmenin bilmediği ürün listesi veya fiyat görülebilir.",
      "kontrol": "Müşteri sorumlusu ürün bilgisinin işletmeden geldiğini doğrulasın.",
      "tepki": "Doğrulanmazsa bilgiyi kullanmasın. Kayıttan silsin.",
      "kayit": "Silme tarihini ve nedenini kaydedin."
    },
    {
      "baslik": "Tavsiye ilişkisi gizleniyor mu?",
      "sinyal": "Dükkândaki tanıtım, ödül ilişkisini belirtmeden bağımsız görüş gibi görünebilir.",
      "kontrol": "Müşteri sorumlusu açık tanıtımlardan küçük bir örneğe baksın.",
      "tepki": "İlişki belirtilmemişse satıcıdan tanıtımı düzeltmesini istesin.",
      "kayit": "İstek tarihini ve düzeltme sonucunu kaydedin."
    }
  ],
  "haftalik": [
    "Müşteri sorumlusu o hafta gelen tavsiyeleri saysın.",
    "Bu tavsiyelerden kaçının size bağlandığını ayrıca saysın.",
    "60 günlük kullanım süresi devam eden tavsiyeleri ayrı saysın.",
    "Finans sorumlusu koşulu tamamlanan tavsiyeleri saysın.",
    "Ödülü faturaya yansıyan tavsiyeleri de ayrıca saysın.",
    "Bağlanmayan veya bekleyen tavsiye artarsa sorumlu nedenini incelesin.",
    "Gecikme varsa sorumlu satıcıya nedeni ve sonraki adımı bildirsin.",
    "Sizin satış hedefiniz veya haftalık çalışma zorunluluğunuz yoktur."
  ],
  "programlar": {
    "ana": [
      "Bu proje için tek tavsiye programı budur.",
      "Ödül ücretsiz iStoc kullanımıdır. Nakit ödeme değildir.",
      "Satışı ve desteği şirket yürütür. Katalog hazırlamak sizin göreviniz değildir."
    ]
  }
};
