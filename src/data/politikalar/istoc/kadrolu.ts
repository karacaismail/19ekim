import type { ProjePolitika } from '../types';

export const politika: ProjePolitika = {
  "id": "kadrolu",
  "proje": "istoc",
  "ad": "Kadrolu satış uzmanı",
  "amac": "Satıcı işletmeleri bulun, iStoc'u gösterin ve satışı katalog kurulumuna devredin.",
  "iliski": "Bu modelde şirket sizi maaşlı çalıştırır. Maaşınızı insan kaynakları bordroyla öder. Göreviniz ve prim koşullarınız iş sözleşmesinin ekinde yazılmalıdır.",
  "gorev": [
    "Bölgenizdeki satıcıları ziyaret listenize göre takip edin.",
    "Satıcının ürünlerini alıcılara nasıl tanıttığını öğrenin.",
    "iStoc'u satıcının kendi ürün grubuyla gösterin.",
    "Onaylı teklif ve sözleşmeyle satışı tamamlayın.",
    "Satıştan sonra katalog kurulumunu ilgili ekibe devredin. Devrin kabul edildiğini kontrol edin."
  ],
  "sinir": [
    "Alıcı sayısı, sipariş veya satış artışı sözü vermeyin.",
    "Onaysız indirim, kurulum tarihi veya özellik sözü vermeyin.",
    "Müşteri ödemesini kişisel hesabınıza alamazsınız.",
    "Şirket adına imza yetkiniz yazılı verilmediyse sözleşme imzalamayın.",
    "İletişim dayanağı olmayan kişiye pazarlama iletisi göndermeyin.",
    "Çalışma saatleri, izinler ve yan haklar bu rehberde belirlenmez. Bunları iş sözleşmeniz belirler."
  ],
  "adimlar": [
    {
      "baslik": "Görevinizi ve bölgenizi netleştirin",
      "metin": [
        "Yazılı görev tanımınızı insan kaynaklarından alın.",
        "Satış yöneticisi ziyaret bölgenizi ve satıcı listenizi belirler.",
        "İlk iki ay kota uygulanmaz. Bu sürede işi öğrenirsiniz.",
        "Bu dönemin prim kuralı kaynakta yazılı değildir. Kendinize prim hesabı yapmayın."
      ]
    },
    {
      "baslik": "Satıcı kaydını kontrol edin",
      "metin": [
        "Satıcıyı firma adı ve adresiyle müşteri takip sisteminde arayın.",
        "Bölgedeki bir satış ortağı bu satıcıyla daha önce görüşmüş olabilir.",
        "Satıcı başka çalışana veya bir ortağa kayıtlıysa görüşmeyi başlatmayın.",
        "Bu durumda satış yöneticisinden yazılı karar isteyin.",
        "Kayıt size verilirse iletişim dayanağını ve kişinin tercihini kontrol edin."
      ]
    },
    {
      "baslik": "Ziyaretleri önceliklendirin",
      "metin": [
        "Önce satıcıya verilmiş sözleri ve açık işleri kontrol edin.",
        "Sonra düzenli ürün listesi olan satıcılara öncelik verin.",
        "Kişi ileti istemezse tercihini kayda yazın. Pazarlama iletisini durdurun."
      ]
    },
    {
      "baslik": "Satıcının ihtiyacını öğrenin",
      "metin": [
        "İşletme sahibine alıcılarla nasıl çalıştığını sorun.",
        "Ürün bilgisini ve fiyat listesini kimin hazırladığını öğrenin.",
        "Görüşmenin sonucunu müşteri kaydına yazın.",
        "Satıcının düzenli ürün listesi yoksa ret nedenini kaydedin."
      ]
    },
    {
      "baslik": "Satıcının ürünleriyle gösterim yapın",
      "metin": [
        "Satıcı ilgilenirse ürün gösterimi için randevu alın.",
        "Gösterimde satıcının bir ürün grubunu örnek olarak kullanın.",
        "Üründe bulunmayan özelliği varmış gibi göstermeyin.",
        "Alıcıların sipariş vereceğini garanti etmeyin.",
        "Satıcı ilgilenirse teklif için sonraki görüşmeyi belirleyin."
      ]
    },
    {
      "baslik": "Katalog kapsamıyla teklif hazırlayın",
      "metin": [
        "Satıcı isterse onaylı fiyat listesiyle teklif hazırlayın.",
        "Fiyat avro üzerinden hesaplanır.",
        "Hangi kurun kullanılacağına finans sorumlusu karar vermelidir.",
        "Teklife katalogda yer alacak ürün gruplarını yazın.",
        "Özel şart gerekiyorsa satış yöneticisine yazılı onaylatın. Onayı teklif kaydına ekleyin."
      ]
    },
    {
      "baslik": "Satıcıyla sözleşmeyi tamamlayın",
      "metin": [
        "Satıcı teklifi kabul ederse kapsamı ve fiyatı sözleşmeye ekleyin.",
        "Şirket adına imzayı yetkili kişi atar.",
        "İmzalı sözleşmeyi müşteri kaydına ekleyin. Sonra finans ekibine haber verin."
      ]
    },
    {
      "baslik": "Satıcının ödemesini izleyin",
      "metin": [
        "Satıcı ödemeyi yalnız şirket hesabına yapar.",
        "Ödeme durumunu finans ekibinden doğrulayın.",
        "Satıcı lira tutarını sorarsa kuru finans ekibinden öğrenin.",
        "Satıcının ödemesi gecikirse finans ekibine bildirin.",
        "Satıcıya kimin hatırlatma yapacağını finans ekibi belirler."
      ]
    },
    {
      "baslik": "Katalog kurulumunu devredin",
      "metin": [
        "Kurulum ekibine ürün gruplarını ve iletişim kişisini yazılı iletin.",
        "Ürün bilgisini kimin gireceğini kurulum ekibiyle netleştirin.",
        "Ekip devri kabul edince satıcıya sonraki adımı bildirin.",
        "Ekip devri kabul etmezse satıcıya kurulum tarihi vermeyin."
      ]
    },
    {
      "baslik": "Satıcının destek yolunu kontrol edin",
      "metin": [
        "Satış yöneticisi destek sorumlusunu yazılı belirlemelidir.",
        "Satıcı size destek sorusu sorarsa talebi destek ekibine iletin.",
        "Talep kayda geçince satıcıya bilgi verin."
      ]
    },
    {
      "baslik": "Katalog yenilemesini hazırlayın",
      "metin": [
        "Yenileme görüşmesinin sorumlusunu satış yöneticisi belirler.",
        "Görev size verildiyse paket bitmeden kataloğun kullanımını sorun.",
        "Satıcı yenilemek istemezse nedenini kayda yazın.",
        "Yenilemenin prime girip girmediğini prim eki belirlemelidir."
      ]
    },
    {
      "baslik": "Priminizi kontrol edin",
      "metin": [
        "Kota uygulanan aylarda prim, kotayı aşan satış tutarından doğar. Kota, prim eşiğidir.",
        "Saha veya ekip lideri seçeneği yazıldıysa o seçeneğin hesabı uygulanır.",
        "Satıcı ödemeden ve iade süresi geçmeden prim ödenmez.",
        "Dönem sonunda prim dökümündeki satıcıları ziyaret kayıtlarınızla karşılaştırın.",
        "Eksik satış varsa satış kaydıyla birlikte yazılı itiraz edin.",
        "Finans ekibi, itirazı kabul edilen prim ekine göre değerlendirsin.",
        "Yönetici ve finans ekibi sonucu yazılı açıklasın."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "iStoc",
      "ad": "Ticaret merkezindeki toptancı dükkânı",
      "ihtiyac": "Dükkân ürünlerini ve fiyatlarını alıcılara tek yerde göstermek isteyebilir.",
      "ulasim": "Atanan bölgedeki dükkân sahibinden yüz yüze görüşme randevusu alın.",
      "mesaj": "Alıcılarınız güncel ürün listenize nasıl ulaşıyor?",
      "uygunluk": "Ürün listesini güncelleyecek kişi yoksa önce bu görevi netleştirin.",
      "sonrasi": "Uygunsa dükkânın bir ürün grubuyla gösterim yapın."
    },
    {
      "urun": "iStoc",
      "ad": "Bayilere satış yapan üretici",
      "ihtiyac": "Bayiler ürün ve teslim bilgisini sık sık sorabilir.",
      "ulasim": "Üreticinin satış yöneticisiyle kurumsal iletişim kanalından görüşün.",
      "mesaj": "Bayileriniz sipariş öncesinde hangi bilgileri istiyor?",
      "uygunluk": "Ürün bilgisi düzenli değilse satış olacağını garanti etmeyin.",
      "sonrasi": "Bayilere gösterilecek ürün gruplarını teklif kapsamına yazın."
    },
    {
      "urun": "iStoc",
      "ad": "Ürün çeşidi geniş ithalatçı veya dağıtıcı",
      "ihtiyac": "Çok sayıda ürünün bilgisini alıcılara düzenli vermek isteyebilir.",
      "ulasim": "Ürün veya satış sorumlusundan planlı görüşme isteyin.",
      "mesaj": "Yeni ürün geldiğinde alıcılarınıza nasıl haber veriyorsunuz?",
      "uygunluk": "Ürün bilgisinin kaynağı belirsizse kurulum ekibinden kontrol isteyin.",
      "sonrasi": "Kontrol uygunsa ürün gruplarıyla teklifi tamamlayın."
    },
    {
      "urun": "iStoc",
      "ad": "Çok şubeli ticaret firması",
      "ihtiyac": "Merkez ürün bilgisini şubelerle tutarlı paylaşmak isteyebilir.",
      "ulasim": "Merkez satış sorumlusundan ortak değerlendirme toplantısı isteyin.",
      "mesaj": "Şubeler aynı ürün bilgisini nereden alıyor?",
      "uygunluk": "Merkez yetkisi doğrulanmazsa bütün şubelere teklif vermeyin.",
      "sonrasi": "Yetkili kişiye uygun kapsamı hazırlayın."
    }
  ],
  "sorunlar": [
    {
      "kosul": "Satıcı başka çalışana veya bölgedeki bir ortağa kayıtlıysa",
      "islem": "Satış yöneticisi kayıt tarihlerine ve görüşme notlarına bakarak karar versin.",
      "sonuc": "Karar yazılana kadar bu satıcıya teklif göndermeyin."
    },
    {
      "kosul": "Satıcı alıcı veya sipariş garantisi isterse",
      "islem": "Garanti veremeyeceğinizi açıkça söyleyin. Talebi görüşme kaydına yazın.",
      "sonuc": "Satıcı garanti olmadan devam etmezse görüşmeyi kapatın."
    },
    {
      "kosul": "Satıcı onaysız indirim veya özel şart isterse",
      "islem": "Talebi satış yöneticisine yazılı iletin.",
      "sonuc": "Onay gelmezse onaylı fiyat listesi geçerli kalır."
    },
    {
      "kosul": "Kişi pazarlama iletisi istemezse",
      "islem": "Tercihini müşteri kaydına yazın. Pazarlama iletisini durdurun.",
      "sonuc": "Şirket bu kişiye yeni pazarlama iletisi göndermez."
    },
    {
      "kosul": "İlk iki aydaysanız",
      "islem": "Satış yöneticisi prim uygulamasını insan kaynaklarıyla yazılı netleştirsin.",
      "sonuc": "Yazılı kural gelene kadar normal ay hesabını bu döneme uygulamayın."
    },
    {
      "kosul": "Kota altında kalırsanız",
      "islem": "Yöneticiniz ziyaret kalitesini ve iş yükünü sizinle incelesin.",
      "sonuc": "O ay prim oluşmayabilir. Bu rehber maaşta kesinti öngörmez."
    },
    {
      "kosul": "Satıcı ödemeyi geciktirirse",
      "islem": "Finans ekibine bildirin. Hatırlatmayı kimin yapacağını finans ekibi belirlesin.",
      "sonuc": "Bu satışın primi için satıcının ödeme yapması gerekir."
    },
    {
      "kosul": "Satıcı satışı iptal ederse",
      "islem": "Finans ekibi ilgili primi ve iptal nedenini incelesin.",
      "sonuc": "Ücretten otomatik kesinti yapılacağı varsayılmaz. Uygulanacak kuralı insan kaynakları yazılı açıklar."
    },
    {
      "kosul": "Prim dökümüne itiraz ederseniz",
      "islem": "Satış kaydını ekleyerek finans ekibine yazılı itiraz edin.",
      "sonuc": "Finans ekibi prim ekini inceler. İnsan kaynakları ve finans ekibi ödeme kararını yazılı açıklar."
    },
    {
      "kosul": "Kurulum ekibi yeni katalog kabul edemiyorsa",
      "islem": "Satış yöneticisine kapasite sorununu bildirin.",
      "sonuc": "Kabul edilmiş takvim olmadan kurulum tarihi vermeyin."
    },
    {
      "kosul": "Göreviniz değişirse veya işten ayrılırsanız",
      "islem": "Açık satıcı işleri için yöneticinizle devir listesi hazırlayın.",
      "sonuc": "İnsan kaynakları ve finans ekibi kalan hakları ayrıca hesaplar."
    }
  ],
  "anlasma": [
    {
      "baslik": "Taraflar ve görev",
      "metin": [
        "İş sözleşmesinde şirket ve çalışan açıkça yazılmalıdır.",
        "İnsan kaynakları görev, ücret, çalışma düzeni ve yan hakları yazmalıdır.",
        "Hesaplayıcıdaki maaşın net veya brüt olduğu ayrıca belirtilmelidir.",
        "Saha ziyaretinin bölgesi ve yol giderinin kuralı yazılmalıdır."
      ]
    },
    {
      "baslik": "Geçerli sürüm ve program",
      "metin": [
        "Prim eki hangi hesap sürümünün geçerli olduğunu yazmalıdır.",
        "Bir program seçin. Seçenekler ana program, saha personeli ve ekip lideridir."
      ]
    },
    {
      "baslik": "Prim eki",
      "metin": [
        "Finans ekibi kota dönemini ve prime giren satışları açıklamalıdır.",
        "Ödeme günü ile iade süresi prim ekinde yazılmalıdır.",
        "İlk iki ayın prim kuralı yazılı belirlenmelidir.",
        "Kurun hangi tarihte belirleneceği yazılmalıdır.",
        "Yenilemenin prime girip girmediği yazılmalıdır."
      ]
    },
    {
      "baslik": "Satıcı kaydı ve yetki",
      "metin": [
        "Satış yöneticisi satıcının hangi çalışana yazılacağını belirleyen kuralı açıklamalıdır.",
        "Yönetici indirim ve sözleşme yetkisini yazılı açıklamalıdır."
      ]
    },
    {
      "baslik": "Bordro ve vergi",
      "metin": [
        "Primin bordroya nasıl yansıyacağını insan kaynakları açıklamalıdır.",
        "Bu rehber bordro kesintisi veya vergi oranı belirlemez."
      ]
    },
    {
      "baslik": "Veri, içerik ve destek",
      "metin": [
        "Hangi satıcı verisine erişeceğiniz yazılı belirlenmelidir.",
        "Satıcının ürün fotoğrafı ve bilgisi için kullanım izni yazılmalıdır.",
        "Kurulum ve destek ekibinin sorumluluğu yazılmalıdır."
      ]
    },
    {
      "baslik": "Değişiklik, ayrılma ve itiraz",
      "metin": [
        "Prim ekindeki değişiklik yalnız yazılı kabulle geçerli olmalıdır.",
        "Ayrılmada satıcı listesi ve erişimler şirket usulüyle devredilmelidir.",
        "Prim itirazının hangi ekibe yapılacağı yazılmalıdır."
      ]
    }
  ],
  "acikKonular": [
    {
      "baslik": "İlk iki ayda prim nasıl işleyecek?",
      "mevcut": "Ana program ilk iki ay kota uygulamaz.",
      "eksik": "Kotasız dönemin prim hesabı kaynakta açıklanmamıştır.",
      "islem": "İnsan kaynakları ve finans ekibi prim ekini hazırlasın.",
      "kanit": "Çalışan örnek bordrodaki hesabı kendi sözleriyle anlatsın.",
      "firsat": "Eğitim hedefiyle satış hedefini ayırmak öğrenmeyi kolaylaştırabilir.",
      "durdur": "Normal ay primini ilk iki aya otomatik uygulamayın."
    },
    {
      "baslik": "Hangi prim modeli geçerli?",
      "mevcut": "Ana program yüzdelik prim, saha seçeneği satış başı prim kullanır.",
      "eksik": "Çalışana hangi modelin uygulanacağı yazılı değildir.",
      "islem": "Satış yöneticisi ve insan kaynakları modeli prim ekine yazsın.",
      "kanit": "Prim ekinde yalnız bir model adı bulunsun.",
      "firsat": "Tek model, prim dökümünü okumayı kolaylaştırabilir.",
      "durdur": "Model yazılmadan iki hesabı birlikte uygulamayın."
    },
    {
      "baslik": "Kur hangi tarihte belirlenecek?",
      "mevcut": "Teklif fiyatı avro üzerinden hesaplanır.",
      "eksik": "Teklif, sözleşme ve tahsilat tarihlerinden hangisinin kuru kullanacağı yazılı değildir.",
      "islem": "Finans sorumlusu kur tarihini teklif ve prim ekine yazsın.",
      "kanit": "Aynı satışın teklif ve prim dökümü aynı kuru göstersin.",
      "firsat": "Açık kur kuralı fiyat sorularını azaltabilir.",
      "durdur": "Kur kuralı yoksa satıcıya kesin lira tutarı yazmayın."
    },
    {
      "baslik": "Maaş net mi, brüt mü?",
      "mevcut": "Hesaplayıcı örnek bir maaş tutarı kullanır.",
      "eksik": "Bu tutarın net veya brüt olduğu kaynakta belirtilmemiştir.",
      "islem": "İnsan kaynakları maaşın niteliğini iş sözleşmesine yazsın.",
      "kanit": "Çalışan örnek bordroyu iş sözleşmesiyle karşılaştırabilsin.",
      "firsat": "Açık bordro örneği ilk maaş günündeki soruları azaltabilir.",
      "durdur": "Nitelik yazılmadan hesaplayıcı tutarını sözleşmeye taşımayın."
    },
    {
      "baslik": "Satıcıya desteği kim verecek?",
      "mevcut": "Satıştan sonra kurulum ekibine devir gerekir.",
      "eksik": "Kadrolu satışta destek sorumlusu kaynakta yazılı değildir.",
      "islem": "Satış yöneticisi destek ekibini ve iletişim kanalını yazsın.",
      "kanit": "Her satıcının destek sorumlusu müşteri kaydında görünsün.",
      "firsat": "Açık destek yolu ilk kullanım sorunlarını erken çözebilir.",
      "durdur": "Destek sorumlusu yoksa satıcıya destek sözü vermeyin."
    },
    {
      "baslik": "Katalog yükü kuruluma sığıyor mu?",
      "mevcut": "Satıştan sonra katalog kurulumu ilgili ekibe devredilir.",
      "eksik": "Kurulum ekibinin güncel kapasitesi hesapta yer almaz.",
      "islem": "Satış ve kurulum yöneticileri kabul edilebilir iş yükünü belirlesin.",
      "kanit": "Her kabul edilen kataloğun sorumlusu ve planı olsun.",
      "firsat": "Bekleyen işleri görünür kılmak gerçekçi teklif vermeyi sağlayabilir.",
      "durdur": "Kurulum ekibi kabul etmeden kesin tarih vermeyin."
    }
  ],
  "kesifler": [
    {
      "baslik": "Satıcılar alıcı beklentisiyle mi alıyor?",
      "sinyal": "Satıcı ilk aylarda sipariş gelmediği için iptal isteyebilir.",
      "kontrol": "Satış yöneticisi iptal nedenlerini görüşme notlarıyla karşılaştırsın.",
      "tepki": "Notlarda alıcı sözü varsa ilgili satış anlatımını düzeltsin.",
      "kayit": "İptal nedenini ve görüşmede söylenenleri birlikte saklayın."
    },
    {
      "baslik": "Katalog kurulumu satıştan sonra bekliyor mu?",
      "sinyal": "Ödeme alınmış ama satıcının ürünleri görünmüyor olabilir.",
      "kontrol": "Kurulum ekibi ödenmiş satışları yayımlanan kataloglarla karşılaştırsın.",
      "tepki": "Bekleyen katalog varsa satış yöneticisi yeni teklifleri yavaşlatsın.",
      "kayit": "Devir tarihini ve kataloğun yayımlandığı tarihi saklayın."
    },
    {
      "baslik": "Kota davranışı bozuyor mu?",
      "sinyal": "Ay sonunda erken satış kaydı veya aşırı indirim görülebilir.",
      "kontrol": "Finans ekibi satış tarihini tahsilat ve sözleşmeyle karşılaştırsın.",
      "tepki": "Uyumsuzluk varsa ilgili primi incelemeye alsın.",
      "kayit": "Düzeltmenin nedenini ve onaylayan görevi kaydedin."
    },
    {
      "baslik": "Ekip satışı ile kendi satış karışıyor mu?",
      "sinyal": "Ekip lideri seçeneğinde aynı satış iki kişide görünebilir.",
      "kontrol": "Finans ekibi ekip payı listesini kişisel satış listesiyle karşılaştırsın.",
      "tepki": "Aynı satış iki listede varsa satış yöneticisi kaydı düzeltsin.",
      "kayit": "Satışın kime yazıldığını ve kararı veren görevi saklayın."
    }
  ],
  "haftalik": [
    "Haftada bir açık teklifleri ve geciken sözleri gözden geçirin.",
    "Satış yöneticisi geçen hafta yapılan ziyaretleri saysın. Bunlardan gösterime geçenleri ayrıca saysın.",
    "Satış yöneticisi kabul edilen teklifleri saysın. Bunlardan tahsil edilenleri ayrıca saysın.",
    "Kurulum ekibi o hafta yayımlanan katalogları ödenmiş satışlarla karşılaştırsın.",
    "Oran önceki haftadan düşükse yönetici nedeni ve çözümü kaydetsin.",
    "Başlamadan kotayı, prim ödemesini ve durma nedenini kendi sözlerinizle anlatın. Satış yöneticisi farklı anlaşılan yeri metinde düzeltsin."
  ],
  "programlar": {
    "ana": [
      "Varsayılan prim yalnız kotanın üzerindeki cirodan hesaplanır.",
      "İlk iki ay kota uygulanmaz. Bu dönemin prim kuralı ayrıca yazılmalıdır."
    ],
    "saha": [
      "Bu ayrı seçenek kota sonrası satış başı prim kullanır.",
      "Ana programın yüzdelik primiyle birlikte uygulanmaz. Prim eki hangi modeli kullandığını belirtmelidir."
    ],
    "lider": [
      "Bu seçenekte yönetici görevi ve ekip payı bulunur.",
      "Kendi satışlarınız saha personeli kuralıyla hesaplanır.",
      "Ekip satışının kabulü ve görev değişikliğinin tarihi yazılı belirlenmelidir.",
      "Kendi satışınız ile ekip satışı ayrı kaydedilmelidir."
    ]
  }
};
