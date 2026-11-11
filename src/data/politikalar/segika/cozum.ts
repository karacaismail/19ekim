import type { ProjePolitika } from '../types';

export const politika: ProjePolitika = {
  "id": "cozum",
  "proje": "segika",
  "ad": "Danışman ve hizmet firması",
  "amac": "İşverene verdiğiniz hizmeti Segika ile tamamlayın. Bu hizmet bordro, insan kaynakları veya iş güvenliği olabilir. Müşterinin desteğini üstlenin.",
  "iliski": "Bağımsız hizmet ortağısınız. Şirketin çalışanı değilsiniz. Segika’yı hizmet verdiğiniz işverene önerirsiniz. Müşterinin desteğini siz verirsiniz. Kazancınızı şirkete fatura keserek alırsınız.",
  "gorev": [
    "İşverenin teşvik ve bordro takibi ihtiyacını öğrenin.",
    "Mesleki kurallarınızın bu ortaklığa izin verdiğini doğrulatın.",
    "Müşteri kaydını ortaklık sorumlusuna açtırın.",
    "Kabul edilen kapsamda müşteri desteğini verin."
  ],
  "sinir": [
    "Müşteri adına yetkiniz yoksa sözleşme kabul edemezsiniz.",
    "Ürün fiyatını değiştiremezsiniz. Teşvik tutarı garantisi veremezsiniz.",
    "Meslek kuralları değerlendirilmeden komisyon veya müşteri indirimi teklif etmeyin.",
    "Müşterinin Sosyal Güvenlik Kurumu veya bordro sistemi şifresini istemeyin.",
    "Hukuki dayanak yoksa çalışan bilgisini şirketle paylaşmayın."
  ],
  "adimlar": [
    {
      "baslik": "Programı ve destek kapsamını seçin",
      "metin": [
        "Ortaklık sorumlusu yapacağınız işi sizinle belirler.",
        "Ana programda müşteri desteğini siz üstlenirsiniz.",
        "Hesaplayıcı her rol için tek program gösterir. Programlar kendiliğinden birleşmez.",
        "İki programı birlikte istiyorsanız ortaklık sorumlusu yazılı karar versin."
      ]
    },
    {
      "baslik": "Mesleki uygunluğu doğrulatın",
      "metin": [
        "Mali müşavir, avukat ve ortak sağlık ve güvenlik birimi meslek kurallarına bağlıdır.",
        "İlgili uzman komisyon ve indirim uygunluğunu incelesin.",
        "Uygunluk yazılmadan müşteriye ortaklıktan söz etmeyin."
      ]
    },
    {
      "baslik": "İşverenin ihtiyacını konuşun",
      "metin": [
        "Mevcut hizmet ilişkiniz içinde teşvik ve bordro takibini sorun.",
        "Müşteriye ileti göndermek için uygun dayanağınız olmalıdır.",
        "Müşteri ileti istemezse yeni ileti göndermeyin.",
        "İşveren ilgilenirse ortaklık sorumlusuna kayıt açtırın."
      ]
    },
    {
      "baslik": "Müşteri kaydını kabul ettirin",
      "metin": [
        "Her firma yalnız bir ortağa yazılır.",
        "Kayıtta işverenin çalışan sayısını ve istediği paketi belirtin.",
        "Ortaklık sorumlusu aynı işverenin başka kaydını kontrol eder.",
        "Kayıt kabul edilmeden müşteriyi kendinize ait saymayın.",
        "Kabul yanıtını saklayın. Sonra ürün gösterimine geçin."
      ]
    },
    {
      "baslik": "Ürün gösterimini yapın",
      "metin": [
        "Gösterimde gerçek çalışan bilgisi kullanmayın.",
        "Örnek bordro verisiyle teşvik ve otomasyon adımlarını gösterin.",
        "Teşvik tutarı için söz vermeyin."
      ]
    },
    {
      "baslik": "Teklifi ve sözleşmeyi tamamlayın",
      "metin": [
        "Ürün teklifini yetkili satış sorumlusu onaylar.",
        "Fiyat paket türüne ve çalışan sayısına göre değişir.",
        "Kendi hizmet bedeliniz varsa teklifte ayrı gösterin.",
        "Çalışan verisine erişim dayanağı yazılmadan kuruluma geçmeyin."
      ]
    },
    {
      "baslik": "Eğitimi planlayın",
      "metin": [
        "Şirket size ve destek personelinize yılda belirli saat ücretsiz program eğitimi verir.",
        "Ücretsiz saatin üstündeki eğitim ücretlidir.",
        "Hesaplayıcı ek eğitim giderini kazancınızdan düşer.",
        "Ek eğitim giderini kabul etmeden eğitim siparişi vermeyin."
      ]
    },
    {
      "baslik": "Müşteri desteğini yürütün",
      "metin": [
        "Müşteri ilişkileri için müşteri takip yazılımını şirket sağlar.",
        "Destek kaydında konuyu, sorumluyu ve çözüm durumunu tutun.",
        "Çözemediğiniz teknik sorunu şirketin teknik ekibine iletin."
      ]
    },
    {
      "baslik": "Tahsilatı ve ödemenizi izleyin",
      "metin": [
        "Finans ekibi işverenin ödemesini ve iade durumunu doğrular.",
        "Ek eğitim gideri varsa hakediş dökümünde ayrı görünmesini isteyin.",
        "Ödeme doğrulanınca kazancınız için şirkete fatura kesersiniz.",
        "Fatura, vergi ve stopaj uygulamasını mali müşavir doğrulasın.",
        "Hakediş dökümünü destek kayıtlarınızla karşılaştırın."
      ]
    },
    {
      "baslik": "Yenilemeyi veya ayrılığı yönetin",
      "metin": [
        "Yenileme öncesinde çalışan sayısındaki değişikliği işverene sorun.",
        "Destek yükünü ve kapsamı işverenle değerlendirin.",
        "Ortaklık biterse müşteri desteğini kabul eden yeni sorumluya devredin."
      ]
    }
  ],
  "kitleler": [
    {
      "urun": "Segika",
      "ad": "Mali müşavirden bordro hizmeti alan işveren",
      "ihtiyac": "İşveren teşvik uygunluğunu düzenli izlemek isteyebilir.",
      "ulasim": "Aylık bordro kapanışında işverenin muhasebe sorumlusuna sorun.",
      "mesaj": "Teşvik uygunluğunu her ay nasıl kontrol ediyorsunuz?",
      "uygunluk": "Meslek kuralı değerlendirilmeden komisyon veya indirim konuşmayın.",
      "sonrasi": "İşveren ilgilenirse kaydı açtırın ve örnek veriyle gösterim yapın."
    },
    {
      "urun": "Segika",
      "ad": "Bordro bürosunun çok çalışanlı müşterisi",
      "ihtiyac": "İşveren bordro adımlarını daha az elle yapmak isteyebilir.",
      "ulasim": "Hizmet değerlendirme toplantısında insan kaynakları yöneticisine sorun.",
      "mesaj": "Bordro hazırlığında hangi adımı her ay elle tekrarlıyorsunuz?",
      "uygunluk": "Veri erişim yetkisi doğrulanmadan çalışan bilgisi almayın.",
      "sonrasi": "Uygunluk varsa otomasyon paketini ürün uzmanıyla birlikte anlatın."
    },
    {
      "urun": "Segika",
      "ad": "Muhasebe yazılımı bayisinin müşterisi olan işletme",
      "ihtiyac": "İşletme bordro takibini mevcut yazılımıyla uyumlu yürütmek isteyebilir.",
      "ulasim": "Yazılım desteği görüşmesinde muhasebe sorumlusuna sorun.",
      "mesaj": "Bordro bilgisini mevcut yazılımınıza nasıl aktarıyorsunuz?",
      "uygunluk": "Teknik ekip bağlantıyı doğrulamadan entegrasyon sözü vermeyin.",
      "sonrasi": "Teknik ekip uygun bulursa kapsamı destek planına yazın."
    },
    {
      "urun": "Segika",
      "ad": "Ortak sağlık ve güvenlik biriminden hizmet alan işveren",
      "ihtiyac": "İşveren insan kaynakları ve bordro işlerini birlikte izlemek isteyebilir.",
      "ulasim": "Dönemsel hizmet görüşmesinde işverenin insan kaynakları sorumlusuna sorun.",
      "mesaj": "Çalışan giriş ve çıkış işlemlerini nasıl takip ediyorsunuz?",
      "uygunluk": "Çalışanların sağlık kayıtlarını bu görüşmede paylaşmayın.",
      "sonrasi": "Bu birimlere özel program başlamadıysa ana program koşullarıyla ilerleyin."
    }
  ],
  "ortakBulma": [
    "Yeni ortakları meslek odalarında ve insan kaynakları derneklerinde arayın.",
    "Yeni ortağa ulaşırken de iletişim dayanağı kuralları geçerlidir.",
    "Ortaklık sorumlusu yeni firmanın mesleki uygunluğunu incelesin.",
    "Kaynakta ortak getirme ödemesi tanımlı değildir. Yeni ortağı müşteri satışı saymayın."
  ],
  "sorunlar": [
    {
      "kosul": "Aynı işveren başka ortağa kayıtlıysa",
      "islem": "Ortaklık sorumlusu kayıt tarihini ve destek kanıtlarını karşılaştırsın.",
      "sonuc": "Karar iki tarafa yazılı bildirilir. Karar çıkmadan komisyon vaat edilmez."
    },
    {
      "kosul": "Meslek kuralı komisyonu veya indirimi engellerse",
      "islem": "Ortaklık sorumlusu uzman görüşüyle uygun programı yeniden belirlesin.",
      "sonuc": "Uygun model kabul edilene kadar komisyon sözü verilmez."
    },
    {
      "kosul": "Teşvik sonucunda hata şüphesi varsa",
      "islem": "Teknik ekip hesabı incelesin. İşverenin mali müşaviri kayıtları kontrol etsin.",
      "sonuc": "Ortaklık sorumlusu düzeltme kararını işverene yazılı bildirir."
    },
    {
      "kosul": "Çalışan sayısı sözleşme dönemi içinde değişirse",
      "islem": "Yetkili satış sorumlusu yeni çalışan sayısına göre teklifi incelesin.",
      "sonuc": "Bedelin nasıl değişeceğini kabul edilen sözleşme belirler. Sözleşme değişikliği açıklamıyorsa finans sorumlusu yeni bedel önersin. Taraflar değişikliği yazılı kabul etmeden uygulamayın."
    },
    {
      "kosul": "Destek yükünü karşılayamıyorsanız",
      "islem": "Ortaklık sorumlusuna açık işleri ve kapasite sorununu bildirin.",
      "sonuc": "Yeni destek taahhüdü verilmeden devir planı kabul edilsin."
    },
    {
      "kosul": "Çalışan verisine yetkisiz erişim görülürse",
      "islem": "Teknik sorumlu erişimi kapatsın ve veri sorumlusuna bildirsin.",
      "sonuc": "Veri sorumlusu yasal bildirim gerekip gerekmediğini değerlendirir."
    },
    {
      "kosul": "Ek eğitim giderine itiraz ederseniz",
      "islem": "Finans sorumlusu eğitim kaydını ve sipariş onayını incelesin.",
      "sonuc": "Finans sorumlusu kararı kabul edilen sözleşmeye göre yazılı açıklar."
    },
    {
      "kosul": "Hakediş tutarına itiraz ederseniz",
      "islem": "Finans sorumlusu destek kayıtlarını, eğitim düşümünü ve tahsilatı incelesin.",
      "sonuc": "Finans sorumlusu ödeme kararını kabul edilen sözleşmeye göre yazılı açıklar."
    },
    {
      "kosul": "Ortaklık sona ererse",
      "islem": "Müşteri desteğini kabul eden yeni sorumluya devredin.",
      "sonuc": "Şirket çalışan verisine erişiminizi kapatsın. Açık ödemeler sözleşmeye göre sonuçlansın."
    }
  ],
  "anlasma": [
    {
      "baslik": "Taraflar ve iki hizmet",
      "metin": [
        "Sözleşmede şirketin ve firmanızın unvanı yazılır.",
        "Ürün satışıyla kendi bordro veya danışmanlık hizmetinizi ayrı tanımlayın.",
        "Teşvik başvurusunun sorumlusunu açıkça yazın."
      ]
    },
    {
      "baslik": "Müşteri kaydı ve yetki",
      "metin": [
        "Müşteri kaydının hangi kanıtla kabul edileceğini yazın.",
        "Paket ve çalışan sayısı onayının kimde olduğunu yazın.",
        "Müşteri adına imza yetkiniz yoksa bunu açıkça yazın."
      ]
    },
    {
      "baslik": "Destek, eğitim ve ödeme",
      "metin": [
        "Destek saatleri ve yanıt süresi karşılıklı kararlaştırılmalıdır.",
        "Ücretsiz eğitim hakkı ve ek eğitim gideri yazılmalıdır.",
        "Ek eğitim gideri kazançtan düşülecekse bu ayrıca yazılmalıdır.",
        "Finans sorumlusu ödemeyi doğuran olayı ve ödeme gününü yazsın.",
        "Hesaplayıcıdaki değişiklik anlaşmayı kendiliğinden değiştirmez."
      ]
    },
    {
      "baslik": "Çalışan verisi",
      "metin": [
        "Çalışan verisine erişimin hukuki dayanağı yazılmalıdır.",
        "Aydınlatma metni ile açık rıza ayrı değerlendirilmelidir.",
        "Teknik ekip erişim kapsamını ve veri silme yöntemini yazmalıdır.",
        "Sağlık verisi gibi özel nitelikli veri ayrıca değerlendirilmelidir."
      ]
    },
    {
      "baslik": "Meslek kuralları ve marka",
      "metin": [
        "Meslek kurallarına uygunluk ilgili uzman tarafından değerlendirilmelidir.",
        "Kendi markanızla sunum ayrı sözleşme gerektirir.",
        "Şirket markasını hangi izinle kullanacağınızı yazın."
      ]
    },
    {
      "baslik": "Değişiklik, sona erme ve itiraz",
      "metin": [
        "Değişikliğin nasıl kabul edileceğini yazın.",
        "Ortaklık biterse destek ve çalışan verisinin nasıl devredileceğini yazın.",
        "İtirazın hangi kanala yapılacağını ve kimin yanıtlayacağını yazın.",
        "Sözleşme onay sorumlusu kaynakta belli değildir. Bu iş için ortaklık yöneticisi rolünü öneriyoruz.",
        "Bu metin imzalı veya hukuken onaylı bir sözleşme değildir."
      ]
    }
  ],
  "acikKonular": [
    {
      "baslik": "Destek kimin üzerinde kalacak?",
      "mevcut": "Ana programda desteği ortak üstlenir. İkinci sürümde destek, rozet adaylığı için isteğe bağlıdır.",
      "eksik": "Yanıt süresi ve yedek sorumlu kesinleşmemiştir.",
      "islem": "Ortaklık sorumlusu destek kapsamını sizinle yazılı belirlesin.",
      "kanit": "Örnek destek talebi doğru kişiye ulaşsın ve kapatılsın.",
      "firsat": "Ortak destek kaydı tekrar eden sorunu azaltabilir.",
      "durdur": "Yedek sorumlu yoksa yeni destek taahhüdü vermeyin."
    },
    {
      "baslik": "Mali müşavir seçeneği nasıl uygulanacak?",
      "mevcut": "Mali müşavir için komisyon veya müşteri indirimi seçeneği vardır.",
      "eksik": "Seçeneğin meslek kurallarına uygunluğu otomatik doğrulanmaz.",
      "islem": "Ortaklık sorumlusu meslek kuralları için uzman görüşü alsın.",
      "kanit": "Seçilen model için değerlendirme ve karar kaydı bulunsun.",
      "firsat": "Uygun ortaklık biçimi müşavirin güvenini koruyabilir.",
      "durdur": "Uygunluk netleşmeden komisyon veya indirim sözü vermeyin."
    },
    {
      "baslik": "Teşvik hatasının sorumlusu kim?",
      "mevcut": "Kaynak, hatalı teşvik sonucunun sorumluluğunu tanımlamaz.",
      "eksik": "Ürün, ortak ve işverenin mali müşaviri arasındaki görev sınırı yazılı değildir.",
      "islem": "Hukuk danışmanı sorumluluk sınırı için ek madde önersin.",
      "kanit": "Her müşteri için teşvik kontrolünü yapan kişi kayıtlı olsun.",
      "firsat": "Açık görev sınırı işverenin güvenini artırabilir.",
      "durdur": "Görev sınırı yazılmadan teşvik sonucu için söz vermeyin."
    },
    {
      "baslik": "Çalışan verisine hangi dayanakla erişeceksiniz?",
      "mevcut": "Kaynak, veri erişiminin hukuki dayanağını tanımlamaz.",
      "eksik": "Erişim amacı, süresi ve silme yöntemi yazılı değildir.",
      "islem": "Hukuk danışmanı dayanağı ve aydınlatma metnini değerlendirsin.",
      "kanit": "Her müşteri için erişim amacı ve yetkili onayı kayıtlı olsun.",
      "firsat": "Sınırlı erişimle başlamak riski azaltabilir.",
      "durdur": "Dayanak belirlenmeden çalışan verisine erişmeyin."
    },
    {
      "baslik": "Özel modelin fiyatı nedir?",
      "mevcut": "Bazı programlar yalnız ödeme modelinin adını verir.",
      "eksik": "Hacim fiyatı, hizmet bedeli veya paylaşım oranı açık değildir.",
      "islem": "Finans sorumlusu seçilen program için ticari ek hazırlasın.",
      "kanit": "Taraflar aynı örnek işin bedelini aynı şekilde hesaplasın.",
      "firsat": "Sınırlı kapsamla başlamak hizmet maliyetini öğrenmeyi sağlayabilir.",
      "durdur": "Fiyat ve kabul ölçütü belirlenmeden ücretli işe başlamayın."
    }
  ],
  "kesifler": [
    {
      "baslik": "Bordro dönemi destek yükünü artırıyor mu?",
      "sinyal": "Destek talepleri ay sonunda birikebilir.",
      "kontrol": "Ortaklık sorumlusu talepleri ayın günlerine göre karşılaştırsın.",
      "tepki": "Yük birikiyorsa yedek destek planını sizinle yazsın.",
      "kayit": "Talep sayılarını kişisel veri olmadan kaydedin."
    },
    {
      "baslik": "Veri sınırları karışıyor mu?",
      "sinyal": "Farklı işverenlerin çalışan kayıtları aynı dosyada birikebilir.",
      "kontrol": "Teknik sorumlu örnek erişim yetkilerini işveren bazında kontrol etsin.",
      "tepki": "Yetkisiz erişim görülürse erişimi kapatıp inceleme başlatsın.",
      "kayit": "Olayı ve düzeltmeyi gereksiz kişisel veri olmadan kaydedin."
    },
    {
      "baslik": "Eğitim gideri kazancı aşıyor mu?",
      "sinyal": "Ek eğitim istekleri artarken yeni müşteri sayısı düşebilir.",
      "kontrol": "Finans sorumlusu eğitim giderini dönem kazancıyla karşılaştırsın.",
      "tepki": "Gider sürdürülemiyorsa eğitim planını sizinle yeniden belirlesin.",
      "kayit": "Kararı ve gerekçesini kayda ekleyin."
    }
  ],
  "haftalik": [
    "Her hafta açık destek işlerinizi ve bekleyen kararları inceleyin.",
    "Ortaklık sorumlusu o hafta kabul edilen kayıtları açılan kayıtlarla karşılaştırsın.",
    "Destek sorumlusu o hafta kapanan talepleri açılan taleplerle karşılaştırsın.",
    "Finans ekibi uygun tahsilatı ve itirazlı tutarı ayrı göstersin.",
    "Bir oran iki hafta düşerse ortaklık sorumlusu nedeni sizinle konuşsun.",
    "Anlaşmadan önce görevinizi, ödemeyi ve durma koşulunu kendi sözlerinizle anlatın. Ortaklık sorumlusu anlatımınızı dinlesin."
  ],
  "programlar": {
    "ana": [
      "Ana programda müşteri desteğini siz verirsiniz. Katkı kapsamını sözleşmeye yazın.",
      "Şirket ücretsiz eğitim saati verir. Fazlası ücretlidir.",
      "Mali müşavir komisyon veya müşteri indirimi seçeneğini kullanabilir.",
      "Mali müşavir seçeneği çözüm ortağı komisyonuyla kendiliğinden birleşmez."
    ],
    "yillara": [
      "Bu program müşteri desteğini kendisi veren ortak içindir.",
      "Destek verdiğiniz sürece dönemsel komisyon hesaplanır.",
      "Destek vermediğiniz ay için komisyon doğmaz.",
      "Hangi kaydın destek sayılacağını ortaklık sorumlusu yazılı belirlesin.",
      "Yıllara yayılan tutar örnektir. Kazanılmış hak sayılmaz."
    ],
    "yonlendirme": [
      "Bu program müşteriyi yalnız şirketin satış ekibine yönlendiren ortak içindir.",
      "Fiyatı değiştiremezsiniz. Garanti veremezsiniz. Tahsilat yapamazsınız.",
      "Ortak puanı ve ortak sayısı sınırlıdır. Ortaklık sorumlusu uygunluğu önce doğrular.",
      "Finans ekibi uygun net tahsilatı ve ortaklar arasındaki paylaşımı doğrular.",
      "Aynı müşteride birden çok ortak varsa ortak bütçesi paylaştırılır."
    ],
    "smmm": [
      "Bu seçenek bordro hizmeti veren mali müşavir ofisine yöneliktir.",
      "Ofisin uygun muhasebe yazılımını kullanması ve sertifika eğitimini bitirmesi gerekir.",
      "Bu modelde nakit komisyon, hediye veya indirim yoktur. Toptan fiyat kullanılır.",
      "Komisyon veya müşteri indirimi istiyorsanız ana program değerlendirilir. İki model birlikte uygulanmaz.",
      "Aktif mükellef sayısını hangi kaydın kanıtlayacağını ortaklık sorumlusu belirlesin.",
      "Fiyat bandı ve mesleki uygunluk kabul edilmeden müşteriye teklif vermeyin."
    ],
    "altyapi": [
      "Bu program teşvik danışmanlığı veya dış kaynaklı bordro hizmeti veren firma içindir.",
      "Hizmeti kendi markanızla sunarsınız. Bunun için ayrı sözleşme gerekir.",
      "Yıllık firma taahhüdü ve hizmet seviyesi sözleşmesi yapılır.",
      "Fiyat iş hacmine göre belirlenir. Kaynakta fiyat tablosu yoktur.",
      "Taahhüt karşılanmazsa ne olacağını sözleşmeye yazın."
    ],
    "entegrasyon": [
      "Bu program bordro veya insan kaynakları yazılımı geliştiren firma içindir.",
      "Yazılım bağlantısını teknik ekip doğrulamalıdır.",
      "Kaynakta bu program için komisyon tutarı tanımlı değildir.",
      "Ortak tanıtım başlamadan veri erişimini ve destek görevlerini yazın."
    ],
    "osgb": [
      "İş sağlığı ve güvenliği hizmeti veren kurum müşterilerini yönlendirebilir.",
      "Program ikinci dalgada başlar. Başlama tarihi kaynakta yazmıyor.",
      "Yönlendirmenin ücreti kaynakta tanımlı değildir.",
      "Kurumun meslek kurallarını ilgili uzman değerlendirsin.",
      "Çalışanların sağlık kayıtlarını yönlendirme için paylaşmayın."
    ],
    "dernek": [
      "Dernek, oda veya sanayi bölgesi üyeleriyle ortak eğitim düzenlenebilir.",
      "Program ikinci dalgada başlar.",
      "Eğitim tanıtım içeriyorsa bunu katılımcılara açıkça söyleyin.",
      "Üye listesini topluca paylaşmayın. İlgilenen kişiler kendileri başvursun."
    ],
    "franchise": [
      "Şubeli işletmede merkez sözleşmesiyle kapsam belirlenir.",
      "Program ikinci dalgada başlar.",
      "Şubelerin yetkisini, ödeme sorumlusunu ve destek kapsamını ayrı yazın."
    ]
  }
};
