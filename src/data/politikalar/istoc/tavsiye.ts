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
    "İşletmenin izni olmadan telefon numarasını şirkete vermeyin.",
    "Başka işletmenin ürün bilgisini kendi kataloğunuza yüklemeyin.",
    "Kendi alıcı listenizi ve fiyatlarınızı tavsiye için paylaşmayın.",
    "Katalog kurulumu, ürün gösterimi ve destek sizin göreviniz değildir.",
    "Fiyat herkes için aynıdır. Şirket adına indirim veya ek süre sözü vermeyin.",
    "Ödül ücretsiz iStoc kullanımıdır. Nakit ödeme değildir. Ödülü fiyat avantajı gibi anlatmayın."
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
        "İşletme istemezse konuyu kapatın. Bilgisini kimseye vermeyin."
      ]
    },
    {
      "baslik": "Başvuruyu kaydettirin",
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
        "Satış uzmanı işletmenin ürün yapısını değerlendirir. Teklifi fiyat tablosundaki fiyatla verir.",
        "Şirketin yetkili kişisi sözleşmeyi hazırlar.",
        "Satış uzmanı ürün bilgisinin nasıl yükleneceğini işletmeye açıklar.",
        "Siz işletme adına karar vermezsiniz. Görüşmeleri takip etmek zorunda değilsiniz."
      ]
    },
    {
      "baslik": "Ödül koşulunu kontrol edin",
      "metin": [
        "Birinci sürümde yeni müşterinin yıllık paket alması gerekir.",
        "Birinci sürümde yeni müşteri iStoc’u 60 gün kullanmaya devam etmelidir. Müşteri sorumlusu 60 günün hangi tarihten sayılacağını yazar.",
        "Bu iki koşul sağlanırsa şirket ücretsiz kullanımı hesabınıza yazar.",
        "İkinci sürüm seçildiyse şirket ödemeyi tavsiyeden sonraki belirli bir süre içinde tahsil etmelidir. Süre, “İkinci hesap sürümü seçilirse” bölümünde yazar.",
        "Şirket ödemeyi bu sürede tahsil edemezse ikinci sürümde ödül hakkı oluşmaz.",
        "Şirket yeni müşterinin kendi ödülünü ona ayrıca bildirir."
      ]
    },
    {
      "baslik": "Ödülün uygulandığını görün",
      "metin": [
        "Finans sorumlusu ödülün yansıdığı dükkân faturasını size bildirsin.",
        "Ödül görünmüyorsa müşteri sorumlusuna dükkân adını ve tarihi iletin.",
        "Ödül görününce bu tavsiyenin işi biter. Yeni tavsiye için aynı sıra yeniden başlar."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "iStoc",
      "ad": "Çarşıdaki komşu dükkân",
      "ihtiyac": "Örneğin bu dükkân aynı çarşıda 1 ile 5 çalışanla sizinle benzer ürün grubunu satabilir. Komşu dükkân ürünlerini alıcılara düzenli göstermek isteyebilir.",
      "ulasim": "Dükkân sahibiyle mevcut komşuluk ilişkiniz içinde yüz yüze konuşun.",
      "mesaj": "Ürünlerimi iStoc ile nasıl sunduğumu görmek ister misiniz?",
      "uygunluk": "İlgilenmiyorsa iletişim bilgisini şirkete vermeyin.",
      "sonrasi": "İsterse şirketin başvuru yolunu kendisi kullansın."
    },
    {
      "urun": "iStoc",
      "ad": "Aynı bloktaki toptancı",
      "ihtiyac": "Örneğin bu toptancı aynı blokta 2 ile 10 çalışanla çok sayıda ürün kalemi satabilir. Ürünlerinin bilgisini güncel tutmakta zorlanabilir.",
      "ulasim": "Uygun bir anda dükkânında kısa bir görüşme isteyin.",
      "mesaj": "Ürün listemi güncel tutmak için iStoc kullanıyorum. Anlatmamı ister misiniz?",
      "uygunluk": "Kendi fiyatlarınızı veya alıcılarınızı örnek olarak göstermeyin.",
      "sonrasi": "İlgilenirse satış uzmanıyla doğrudan görüşsün."
    },
    {
      "urun": "iStoc",
      "ad": "Mal aldığınız tedarikçi esnaf",
      "ihtiyac": "Örneğin bu tedarikçi başka bir ilde atölye veya depo işletebilir. Birçok dükkâna mal verebilir. Güncel kataloğunu alıcılarına ulaştırmakta zorlanabilir.",
      "ulasim": "Sipariş görüşmesinin uygun bir anında izin isteyin.",
      "mesaj": "Kataloğunuzu paylaşmak için başka bir yöntem arıyor musunuz?",
      "uygunluk": "Siparişinizi tavsiye kabulüne bağlamayın.",
      "sonrasi": "İşletmenin ihtiyacı ürüne uyuyorsa şirketin başvuru yolunu paylaşın."
    },
    {
      "urun": "iStoc",
      "ad": "Sizden mal alan esnaf",
      "ihtiyac": "Örneğin bu esnaf ilçede veya başka bir ilde küçük bir toptancı ya da perakendeci olabilir. Kendi ürünlerini başka alıcılara sunmak isteyebilir.",
      "ulasim": "Alışveriş sonrasında, baskı kurmadan deneyiminizi anlatın.",
      "mesaj": "Ürünlerinizi göstermek için kullandığım yöntemi merak eder misiniz?",
      "uygunluk": "Kendi satış fiyatınızı tavsiye kabulüne bağlamayın.",
      "sonrasi": "İlgilenirse şirketle kendisi iletişim kursun."
    }
  ],
  "sorunlar": [
    {
      "kosul": "Tavsiye size bağlanmamışsa",
      "islem": "Müşteri sorumlusuna başvuru bilgisini ve tanıştırma tarihini iletin.",
      "sonuc": "Müşteri sorumlusu kaydı inceler. Sonucu size yazılı açıklar."
    },
    {
      "kosul": "İşletme zaten iStoc müşterisi veya kayıtlı aday ise",
      "islem": "Müşteri sorumlusu yeni müşteri koşulunu kontrol etsin.",
      "sonuc": "Müşteri sorumlusu uygunluğu doğrulamadan ödül sözü vermez."
    },
    {
      "kosul": "Aynı dükkânı iki kişi tavsiye ettiyse",
      "islem": "Müşteri sorumlusu iki kaydın tarihini karşılaştırsın.",
      "sonuc": "Müşteri sorumlusu kararı ve gerekçesini iki tarafa da yazılı bildirir."
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
      "kosul": "İşletme indirim veya ek süre isterse",
      "islem": "Fiyatın herkes için aynı olduğunu söyleyin. Talebi kimseye iletmeyin.",
      "sonuc": "İşletme fiyat tablosundaki fiyatla başvurur. Şirket yeni teklif hazırlamaz."
    },
    {
      "kosul": "Yıllık tavsiye sınırına ulaştıysanız",
      "islem": "Müşteri sorumlusundan kalan hakkınızı öğrenin.",
      "sonuc": "Şirket yalnız sınır kadar tavsiyeyi ödüle çevirir. Müşteri sorumlusu fazlasının sonucunu yazılı açıklasın."
    },
    {
      "kosul": "Yeni müşteri 60 gün dolmadan bırakırsa veya ödemezse",
      "islem": "Finans sorumlusu ilgili ödülün koşullarını yeniden incelesin.",
      "sonuc": "Şirket bu durum için henüz iptal kuralı koymadı. Finans sorumlusu kararı size yazılı açıklasın."
    },
    {
      "kosul": "Bir tavsiyenin ödülüne itiraz ederseniz",
      "islem": "Müşteri sorumlusuna itirazınızı ve tavsiye tarihini yazılı iletin.",
      "sonuc": "Finans sorumlusu ilgili ödülü inceler. Kararını yazılı tavsiye koşullarına göre açıklar."
    },
    {
      "kosul": "Tanıştırdığınız işletme iletişim istemezse",
      "islem": "Müşteri sorumlusu bu işletmeye pazarlama iletisi göndermeyi durdursun.",
      "sonuc": "Müşteri sorumlusu reddi kaydeder. Şirket işletmeye yeniden pazarlama iletisi göndermez."
    },
    {
      "kosul": "Tavsiyeden vazgeçmek isterseniz",
      "islem": "Müşteri sorumlusuna vazgeçtiğinizi bildirin.",
      "sonuc": "Müşteri sorumlusu açık tavsiyelerin durumunu size yazılı açıklar. Mevcut hizmetiniz bundan etkilenmez."
    }
  ],
  "anlasma": [
    {
      "baslik": "Taraflar ve kapsam",
      "metin": [
        "Şirket sizi tanıştırma yapan iStoc müşterisi olarak yazar.",
        "Şirket satışın, sözleşmenin ve desteğin kendisinde olduğunu yazar.",
        "Şirket yeni işletmenin ürün bilgisini kimin yükleyeceğini yazar.",
        "Şirket size çalışan veya satış görevi vermediğini açıkça yazar."
      ]
    },
    {
      "baslik": "Kampanya koşulları",
      "metin": [
        "Şirket hangi satıcıların katılabileceğini açıkça yazar.",
        "Şirket yeni müşteri tanımını, kayıt tarihini ve sınırın dönemini yazar.",
        "Şirket geçerli hesap sürümünü ve yürürlük tarihini yazar.",
        "Birinci sürümde şirket yıllık paket ve 60 gün kullanım koşulunu yazar."
      ]
    },
    {
      "baslik": "Tavsiyenin size bağlanması",
      "metin": [
        "Şirket tavsiyenin hangi kayıtla size bağlanacağını yazar.",
        "Şirket aynı dükkân için birden çok kayıt varsa karar kuralını yazar.",
        "Şirket aynı sahibin başka dükkânının nasıl sayılacağını yazar."
      ]
    },
    {
      "baslik": "Ücretsiz kullanım",
      "metin": [
        "Finans sorumlusu ücretsiz sürenin hangi pakete uygulanacağını yazar.",
        "Finans sorumlusu paket değişimini, iptali ve kullanılmayan süreyi ayrıca açıklar.",
        "Ödülü nakde çevirmek için ayrı bir onaylı program gerekir."
      ]
    },
    {
      "baslik": "Vergi ve fatura",
      "metin": [
        "Finans sorumlusu ücretsiz kullanımın faturada nasıl görüneceğine henüz karar vermedi.",
        "Finans sorumlusu bu işlemi mali müşavirle yazılı belirler."
      ]
    },
    {
      "baslik": "Tanıtım ve ürün bilgisi",
      "metin": [
        "Şirket tavsiye ilişkisini açıkça belirtme kuralını yazar.",
        "Şirket kendi katalog görünümünüzü örnek gösterme iznini ayrıca yazar.",
        "Başka işletmenin ürün bilgisini siz toplamazsınız."
      ]
    },
    {
      "baslik": "Veri ve iletişim",
      "metin": [
        "Şirket tavsiye kaydında hangi bilgiyi tutacağını açıklar.",
        "Tanıştırılan işletme iletişim tercihini kendisi bildirebilir."
      ]
    },
    {
      "baslik": "Değişiklik, ayrılma ve itiraz",
      "metin": [
        "Şirket koşulları değiştirirse yeni koşulu önceden yazılı bildirir.",
        "Şirket açık tavsiyelerin hangi koşulla sonuçlanacağını yazar.",
        "Şirket itirazı inceleyecek görevi yazar. Önerilen görev müşteri sorumlusudur."
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
      "firsat": "Kısa koşul özeti yanlış beklentiyi azaltır. Satıcı koşulu bildiği için tavsiyeyi güvenle yapar.",
      "durdur": "Sürüm seçilmeden ödül tarihi vaat etmeyin."
    },
    {
      "baslik": "60 gün ne zaman başlar?",
      "mevcut": "Birinci sürüm 60 gün kullanmaya devam etme koşulunu koyar.",
      "eksik": "Şirket sürenin hangi tarihte başladığını henüz yazmadı.",
      "islem": "Müşteri sorumlusu başlangıç olayını yazılı tanımlasın.",
      "kanit": "Tavsiye kaydında başlangıç ve bitiş tarihi görülsün.",
      "firsat": "Net bir tarih ödül sorularını azaltır. Müşteri sorumlusu bu zamanı yeni tavsiye çağrısına ayırır.",
      "durdur": "Başlangıç belirsizse ödül tarihi söylemeyin."
    },
    {
      "baslik": "Aynı sahibin başka dükkânı sayılıyor mu?",
      "mevcut": "Program yeni müşterinin tavsiyesini ödüllendirir.",
      "eksik": "Şirket şube, birden çok sahibi olan dükkân ve yinelenen başvuru için ölçüt koymadı.",
      "islem": "Müşteri sorumlusu yeni müşteri kontrolünü yazılı tanımlasın.",
      "kanit": "Müşteri sorumlusu aynı işletmenin tekrar sayılmadığını bir örnekle doğrulasın.",
      "firsat": "Düzgün kayıt ödül itirazlarını azaltır. Ödülünü sorunsuz alan satıcı yeniden tavsiye yapabilir.",
      "durdur": "Çakışan kayıtta ödül uygulamasını inceleme bitene kadar bekletin."
    },
    {
      "baslik": "Ücretsiz süre nereye yazılacak?",
      "mevcut": "Satış ortaklığı hesabı ücretsiz kullanımın tutarını gösterir.",
      "eksik": "Şirket paket değişimini ve kullanılmayan süreyi henüz açıklamadı.",
      "islem": "Finans sorumlusu fatura örneğiyle uygulamayı belirlesin.",
      "kanit": "Örnek faturada ücretsiz süre ve kalan ödeme görülsün.",
      "firsat": "Hesap özeti satıcının kalan tavsiye hakkını gösterir. Hakkı kalan satıcı yeni tavsiye yapabilir.",
      "durdur": "Belirsiz tutarı kesin kazanılmış hak gibi göstermeyin."
    },
    {
      "baslik": "Vergi ve fatura işlemi nasıl olacak?",
      "mevcut": "Şirket ödülün nakit olmadığını söyler. Vergi işlemini henüz açıklamadı.",
      "eksik": "Finans sorumlusu ücretsiz kullanımın faturadaki karşılığını henüz belirlemedi.",
      "islem": "Finans sorumlusu bu konuyu mali müşavirle yazılı karara bağlasın.",
      "kanit": "Karar, örnek bir faturayla birlikte saklansın.",
      "firsat": "Tek açıklama satıcı sorularını azaltır. Müşteri sorumlusu vergi sorusu yerine yeni tavsiyelerle ilgilenir.",
      "durdur": "Karar yazılmadan ödülün vergi sonucunu anlatmayın."
    },
    {
      "baslik": "Yeni müşteri bırakırsa ne olacak?",
      "mevcut": "Şirket ana programda iptal ve iade kuralı koymadı.",
      "eksik": "Kullanılmış ücretsiz sürenin geri alınıp alınmayacağı belli değildir.",
      "islem": "Finans sorumlusu bu kuralı tavsiye başlamadan yazsın.",
      "kanit": "Kural, satıcıya verilen koşul yazısında bulunsun.",
      "firsat": "Net bir kural sonradan çıkacak itirazları azaltır. Satıcı ödül kuralını önceden bildiği için tavsiyeye daha istekli olur.",
      "durdur": "Kural yazılmadan kullanılmış süreyi geri almayın."
    }
  ],
  "kesifler": [
    {
      "baslik": "Tavsiye komşuluk ilişkisini bozuyor mu?",
      "sinyal": "Tanıştırılan komşu dükkân, sizinle aynı alıcılara satış yapıyor olabilir.",
      "kontrol": "Müşteri sorumlusu tavsiye eden satıcıya memnuniyetini sorsun.",
      "tepki": "Çatışma işareti varsa müşteri sorumlusu bu satıcıdan yeni tavsiye istemesin.",
      "kayit": "Müşteri sorumlusu görüşme tarihini ve kısa sonucu kaydetsin."
    },
    {
      "baslik": "Tavsiye alıcıya baskıya dönüşüyor mu?",
      "sinyal": "Sizden mal alan esnaf, sipariş verebilmek için tavsiyenizi kabul etmek zorunda olduğunu düşünebilir.",
      "kontrol": "Müşteri sorumlusu ilk görüşmede işletmenin gönüllü geldiğini sorsun.",
      "tepki": "Baskı işareti varsa müşteri sorumlusu başvuruyu bekletsin. Tavsiye edenle konuşsun.",
      "kayit": "Müşteri sorumlusu gönüllü katılımın nasıl doğrulandığını kaydetsin."
    },
    {
      "baslik": "Ürün bilgisi izinsiz mi geliyor?",
      "sinyal": "Başvuruda işletmenin bilmediği ürün listesi veya fiyat görülebilir.",
      "kontrol": "Müşteri sorumlusu ürün bilgisinin işletmeden geldiğini doğrulasın.",
      "tepki": "Doğrulanmazsa müşteri sorumlusu bilgiyi kullanmasın. Kayıttan silsin.",
      "kayit": "Müşteri sorumlusu silme tarihini ve nedenini kaydetsin."
    },
    {
      "baslik": "Tavsiye ilişkisi gizleniyor mu?",
      "sinyal": "Dükkândaki tanıtım, ödül ilişkisini belirtmeden bağımsız görüş gibi görünebilir.",
      "kontrol": "Müşteri sorumlusu herkese açık tanıtımlardan küçük bir örneğe baksın.",
      "tepki": "İlişki belirtilmemişse müşteri sorumlusu satıcıdan tanıtımı düzeltmesini istesin.",
      "kayit": "Müşteri sorumlusu istek tarihini ve düzeltme sonucunu kaydetsin."
    }
  ],
  "firsatlar": [
    {
      "baslik": "Memnun satıcılardan zamanında tavsiye isteyin",
      "neden": "Rehbere göre tavsiye, müşteri doğrulanmış bir sonuç aldıktan sonra istenir. Bugün bu anı kimse izlemez.",
      "ilkAdim": "Müşteri sorumlusu kataloğunu düzenli kullanan satıcıları ayda bir listeler. Tavsiye çağrısını yalnız bu satıcılara yapar.",
      "olcu": "Müşteri sorumlusu çağrı yapılan satıcıları ve bu satıcılardan gelen tavsiyeleri sayar."
    },
    {
      "baslik": "Bir blokta tanıtım günü düzenleyin",
      "neden": "Tavsiye bugün tek tek dükkânlar üzerinden ilerler. Aynı bloktaki komşu dükkânlar en doğal kitledir.",
      "ilkAdim": "Müşteri sorumlusu gönüllü bir satıcıyla bloğunda kısa bir tanıtım günü planlar. Katılım isteğe bağlıdır.",
      "olcu": "Müşteri sorumlusu tanıtım gününe katılan dükkânları ve başvuran dükkânları sayar."
    },
    {
      "baslik": "Tedarikçi esnafı tanıştırma kanalı yapın",
      "neden": "Satıcıların mal aldığı tedarikçiler çok sayıda dükkâna mal verir. Bu tedarikçilerin katalogları büyük olabilir. Yıllık paket bu tedarikçilere uygun olabilir.",
      "ilkAdim": "Müşteri sorumlusu tavsiye eden satıcıya tedarikçi tanıştırması için kısa bir bilgi notu verir. Satıcı siparişini tavsiyeye bağlamaz.",
      "olcu": "Müşteri sorumlusu tedarikçiden gelen başvuruları ve yıllık paket alan tedarikçileri sayar."
    },
    {
      "baslik": "Çalışanı olan müşterileri bordro ürünüyle tanıştırın",
      "neden": "Mevcut iStoc müşterilerinin çalışanı olup olmadığı kayıtlı değildir. Şirketin SGK teşvik ve bordro ürünü bu müşterilere uyabilir.",
      "ilkAdim": "Müşteri sorumlusu memnuniyet görüşmesinde müşteriye bordro ürünü hakkında bilgi isteyip istemediğini sorar. Çalışan adı veya kişisel bilgi istemez.",
      "olcu": "Müşteri sorumlusu bilgi isteyen müşterileri ve bordro ürünü ekibine devredilen müşterileri sayar."
    }
  ],
  "haftalik": [
    "Müşteri sorumlusu o hafta gelen tavsiyeleri saysın.",
    "Müşteri sorumlusu bu tavsiyelerden kaçının size bağlandığını ayrıca saysın.",
    "Müşteri sorumlusu 60 günü dolmayan tavsiyeleri ayrı saysın.",
    "Finans sorumlusu koşulu tamamlanan tavsiyeleri saysın.",
    "Finans sorumlusu ödülü faturaya yansıyan tavsiyeleri de ayrıca saysın.",
    "Bağlanmayan veya bekleyen tavsiye artarsa müşteri sorumlusu nedenini incelesin.",
    "Gecikme varsa müşteri sorumlusu satıcıya nedeni ve sonraki adımı bildirsin.",
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
