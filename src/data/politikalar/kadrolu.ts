import type { Politika } from './types';

export const politika: Politika = {
  "id": "kadrolu",
  "ad": "Kadrolu satış uzmanı",
  "amac": "Müşteri görüşmesini satışa ve doğru kurulum devrine kadar yönetin.",
  "iliski": "Bu modelde şirket sizi maaşlı ve sigortalı çalıştırır. Göreviniz ve prim koşullarınız iş sözleşmesinin ekinde açıklanır.",
  "gorev": [
    "Size verilen müşteri listesini düzenli takip edin.",
    "Müşterinin ihtiyacını anlayın. Uygun ürünü gösterin.",
    "Satış sonrası kurulumu ilgili ekibe devredin. Devrin kabul edildiğini kontrol edin."
  ],
  "sinir": [
    "Onaysız indirim, teslim tarihi veya özellik sözü vermeyin.",
    "Müşteri ödemesini kişisel hesabınıza alamazsınız.",
    "Çalışma saatleri, izinler ve yan haklar bu hesaplayıcıda belirlenmez."
  ],
  "adimlar": [
    {
      "baslik": "Görevinizi yöneticinizle netleştirin",
      "metin": [
        "Satış yöneticisi bölgenizi, ürününüzü ve müşteri listenizi belirler.",
        "Öğrenme dönemindeki görevleri yöneticinizle yazılı olarak planlayın.",
        "Prim dönemi ve başlangıç koşulları açıklanmadan kazanç sözü vermeyin."
      ]
    },
    {
      "baslik": "Görüşmeleri önceliklendirin",
      "metin": [
        "Önce müşteriye verilmiş sözleri ve açık işleri kontrol edin.",
        "İhtiyacı doğrulanmış işletmelere öncelik verin.",
        "Aynı firma başka çalışanda görünüyorsa yöneticinizden karar isteyin."
      ]
    },
    {
      "baslik": "İhtiyacı ve yetkiyi doğrulayın",
      "metin": [
        "Karar veren kişiyle mevcut süreci konuşun.",
        "İhtiyaç uygunsa ürün gösterimi yapın.",
        "Uyum yoksa ret nedenini kaydedin ve görüşmeyi kapatın."
      ]
    },
    {
      "baslik": "Teklifi hazırlayın",
      "metin": [
        "Müşteri isterse onaylı fiyatla teklif hazırlayın.",
        "Özel şart gerekiyorsa yetkili kişiye onaylatın.",
        "Kabul edilen kapsamı ve fiyatı sözleşmeye ekleyin."
      ]
    },
    {
      "baslik": "Satışı kuruluma devredin",
      "metin": [
        "Sözleşme kabul edilince ödeme durumunu finans ekibinden doğrulayın.",
        "Kurulum ekibine kapsamı, iletişim kişisini ve açık soruları iletin.",
        "Ekip devri kabul edince müşteriye sonraki adımı bildirin."
      ]
    },
    {
      "baslik": "Priminizi kontrol edin",
      "metin": [
        "Dönem sonunda finans ekibinin prim dökümünü inceleyin.",
        "Eksik satış varsa satış kaydıyla birlikte itiraz edin.",
        "Yönetici ve finans ekibi sonucu yazılı açıklasın."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "iStoc",
      "ad": "Düzenli sipariş alan toptancı",
      "ihtiyac": "Firma ürünlerini ve fiyatlarını tek yerde göstermek isteyebilir.",
      "ulasim": "Atanan bölgedeki işletme sahibinden randevu alın.",
      "mesaj": "Müşterileriniz güncel ürün listenize nasıl ulaşıyor?",
      "uygunluk": "Katalog sorumlusu yoksa önce bu görevi netleştirin.",
      "sonrasi": "Uygunsa gerçek ürün grubuyla gösterim yapın."
    },
    {
      "urun": "iStoc",
      "ad": "Kurumsal alıcıya satış yapan üretici",
      "ihtiyac": "Alıcıların ürün ve teslim bilgisi talebi artabilir.",
      "ulasim": "Satış yöneticisiyle şirketin kurumsal iletişim kanalından görüşün.",
      "mesaj": "Teklif öncesinde alıcılar hangi bilgileri istiyor?",
      "uygunluk": "Ürün desteği yoksa satışın gerçekleşeceğini garanti etmeyin.",
      "sonrasi": "Beklenen iş akışını teklif kapsamına yazın."
    },
    {
      "urun": "iStoc",
      "ad": "Çok şubeli ticaret firması",
      "ihtiyac": "Merkez ürün bilgisini şubelerle tutarlı paylaşmak isteyebilir.",
      "ulasim": "Merkez satış sorumlusundan ortak değerlendirme toplantısı isteyin.",
      "mesaj": "Şubeler aynı ürün bilgisini nereden alıyor?",
      "uygunluk": "Merkez yetkisi doğrulanmazsa tüm şubelere teklif vermeyin.",
      "sonrasi": "Yetkili kişiye uygun kapsamı hazırlayın."
    },
    {
      "urun": "Segika",
      "ad": "Büyüyen insan kaynakları ekibi",
      "ihtiyac": "Ekip işlemleri daha düzenli takip etmek isteyebilir.",
      "ulasim": "insan kaynakları yöneticisine onaylı tanıtım kanalıyla ulaşın.",
      "mesaj": "Hangi işlem yeniden kontrol gerektiriyor?",
      "uygunluk": "Örnek gösterimde gerçek çalışan dosyası istemeyin.",
      "sonrasi": "Kimliksiz örnekle ürünün uygunluğunu gösterin."
    },
    {
      "urun": "Segika",
      "ad": "Muhasebe ağırlıklı işletme",
      "ihtiyac": "Bordro takibi muhasebe ekibinin iş yükünü artırabilir.",
      "ulasim": "Muhasebe yöneticisiyle planlanmış görüşme yapın.",
      "mesaj": "Bordro bilgilerini hangi araçlarla hazırlıyorsunuz?",
      "uygunluk": "Mevcut yazılımla uyum bilinmiyorsa teknik kontrol isteyin.",
      "sonrasi": "Teknik sonuç uygunsa teklifi tamamlayın."
    },
    {
      "urun": "Segika",
      "ad": "Birden fazla işyeri olan firma",
      "ihtiyac": "Merkez farklı işyerlerinin kayıtlarını izlemek isteyebilir.",
      "ulasim": "insan kaynakları ve muhasebe sorumlularını aynı görüşmeye çağırın.",
      "mesaj": "İşyeri bilgilerini ortak olarak nasıl takip ediyorsunuz?",
      "uygunluk": "Kapsam ve erişim yetkileri açıklanmadan kurulum tarihi vermeyin.",
      "sonrasi": "İşyeri kapsamını kurulum ekibine yazılı devredin."
    }
  ],
  "sorunlar": [
    {
      "kosul": "Kota altında kalırsanız",
      "islem": "Yöneticiniz görüşme kalitesini ve iş yükünü sizinle incelesin.",
      "sonuc": "Hesapta prim azalabilir. Maaşın kendiliğinden azalacağı varsayılmaz."
    },
    {
      "kosul": "İlk öğrenme dönemindeyseniz",
      "islem": "Yöneticiniz prim uygulamasını insan kaynaklarıyla yazılı netleştirsin.",
      "sonuc": "Kotasız dönem için normal ay hesabı kullanılmaz."
    },
    {
      "kosul": "Müşteri satışı iptal ederse",
      "islem": "Finans ekibi ilgili primi ve iptal nedenini incelesin.",
      "sonuc": "Ücretten otomatik kesinti yapılacağı varsayılmaz. Uygulanacak kural açıklanır."
    },
    {
      "kosul": "Kurulum ekibi yeni müşteri kabul edemiyorsa",
      "islem": "Satış yöneticisine kapasite sorununu bildirin.",
      "sonuc": "Kabul edilmiş takvim olmadan teslim tarihi vermeyin."
    },
    {
      "kosul": "Göreviniz değişirse veya işten ayrılırsanız",
      "islem": "Açık müşteri işleri için yöneticinizle devir listesi hazırlayın.",
      "sonuc": "İnsan kaynakları ve finans ekibi kalan hakları ayrıca hesaplar."
    }
  ],
  "anlasma": [
    {
      "baslik": "İş sözleşmesi ve görev",
      "metin": [
        "İnsan kaynakları görev, ücret, çalışma düzeni ve yan hakları yazmalıdır.",
        "Hesaplayıcıdaki maaşın net veya brüt olduğu ayrıca belirtilmelidir."
      ]
    },
    {
      "baslik": "Prim eki",
      "metin": [
        "Finans ekibi kota dönemini ve prime giren satışları açıklamalıdır.",
        "Tahsilat, iade, izin ve görev değişikliği ayrı ele alınmalıdır.",
        "İlk öğrenme dönemindeki prim kuralı yazılı belirlenmelidir."
      ]
    },
    {
      "baslik": "Yetki ve müşteri devri",
      "metin": [
        "Yönetici indirim ve sözleşme yetkisini açıklamalıdır.",
        "Müşteri listesi ile erişimler şirketin belirlediği usulle devredilmelidir."
      ]
    }
  ],
  "acikKonular": [
    {
      "baslik": "İlk dönemde prim nasıl işleyecek?",
      "mevcut": "iStoc ana programı ilk iki ay kota uygulamaz.",
      "eksik": "Kotasız dönemin prim hesabı kaynakta açıklanmamıştır.",
      "islem": "İnsan kaynakları ve finans ekibi prim ekini hazırlasın.",
      "kanit": "Çalışan örnek bordrodaki hesabı kendi sözleriyle anlatsın.",
      "firsat": "Eğitim hedefiyle satış hedefini ayırmak öğrenmeyi kolaylaştırabilir.",
      "durdur": "Normal ay primini öğrenme dönemine otomatik uygulamayın."
    },
    {
      "baslik": "Tahsilat hangi aya yazılacak?",
      "mevcut": "Prim için tahsilat ve iade koşulları aranır.",
      "eksik": "Geç ödeme ve kısmi ödeme dönemi açık değildir.",
      "islem": "Finans ekibi örnek ödeme durumlarıyla dönem kuralını belirlesin.",
      "kanit": "Aynı satışın iki ayda sayılmadığı gösterilsin.",
      "firsat": "Düzenli döküm prim itirazlarını erken çözebilir.",
      "durdur": "Uyuşmazlıkta yalnız ilgili satış ayrı incelensin."
    },
    {
      "baslik": "Satış yükü kuruluma sığıyor mu?",
      "mevcut": "Satış sonrası kurulum ekibine devir gerekir.",
      "eksik": "Güncel ekip kapasitesi hesabın içinde yer almaz.",
      "islem": "Satış ve kurulum yöneticileri kabul edilebilir iş yükünü belirlesin.",
      "kanit": "Her kabul edilen işin sorumlusu ve planı olsun.",
      "firsat": "Bekleyen işleri görünür kılmak gerçekçi teklif vermeyi sağlayabilir.",
      "durdur": "Kurulum kabul etmeden kesin tarih vermeyin."
    }
  ],
  "kesifler": [
    {
      "baslik": "Kota davranışı bozuyor mu?",
      "sinyal": "Ay sonunda erken satış kaydı veya aşırı indirim görülebilir.",
      "kontrol": "Finans ekibi satış tarihini tahsilat ve sözleşmeyle karşılaştırsın.",
      "tepki": "Uyumsuzluk varsa ilgili primi incelemeye alsın.",
      "kayit": "Düzeltmenin nedenini ve onaylayan kişiyi kaydedin."
    },
    {
      "baslik": "Satış sonrası sorunlar saklanıyor mu?",
      "sinyal": "Satış tamam görünürken müşteri ürünü kullanamıyor olabilir.",
      "kontrol": "Yönetici destek taleplerini satış kayıtlarıyla karşılaştırsın.",
      "tepki": "Tekrarlayan sorun varsa ilgili satış anlatımını düzeltsin.",
      "kayit": "Devir kabulünü ve ilk kullanım sorununu birlikte saklayın."
    }
  ],
  "haftalik": [
    "Siz açık teklifleri ve geciken müşteri sözlerini gözden geçirin.",
    "Yönetici tahsil edilen satışları kabul edilen tekliflere bölsün.",
    "Finans ekibi iptal edilen satışları aynı dönemin satışlarıyla karşılaştırsın.",
    "Oran düşerse yönetici nedenleri ve yapılacak işi kaydetsin."
  ],
  "programlar": {
    "ana": [
      "Varsayılan prim yalnız kotanın üzerindeki cirodan hesaplanır."
    ],
    "saha": [
      "Bu ayrı iStoc seçeneği kota sonrası satış başı prim kullanır.",
      "Ana programın yüzdelik primiyle birlikte uygulanmaz. Prim eki hangi modeli kullandığını belirtmelidir."
    ],
    "lider": [
      "Bu iStoc seçeneğinde yönetici görevi ve ekip payı bulunur.",
      "Ekip satışının kabulü ve görev değişikliğinin tarihi yazılı belirlenmelidir.",
      "Kendi satışınız ile ekip satışı ayrı kaydedilmelidir."
    ]
  }
};
