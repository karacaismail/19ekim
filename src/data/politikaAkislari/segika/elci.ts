import type { AkisAdimi, AkisOlustur } from '../types';
import { satisKazanci, segikaAylik, yillikFiyat, type SegikaPaket, type Seviye } from '../../satisOrtakligi';

const para = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n))} TL`;
const oranMetni = (n: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n * 100)}`;
const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);

const PAKET: Record<SegikaPaket, string> = {
  ikisi: 'teşvik ve otomasyon paketi',
  tesvik: 'teşvik paketi',
  otomasyon: 'bordro otomasyon paketi',
};

const SEVIYE_OZET: Record<Seviye, string> = {
  A: 'Siz yalnız tanıştırırsınız. Ürün gösterimini ve satışı şirket yapar.',
  B: 'Siz ürün gösterimi de yaparsınız. Satışı şirket kapatır.',
  C: 'Siz şirketin onayladığı teklifle satış görüşmesini yürütürsünüz.',
};

export const akisOlustur: AkisOlustur = (a) => {
  const seviye = a.elciSeviye;
  const komisyon = satisKazanci(a, seviye);
  const fiyat = segikaAylik(a);
  const odemeMetni = a.model === 'oran'
    ? [
        `Örnek ${sayi(fiyat.kisi)} çalışanlık ${PAKET[a.segikaPaket]} yıllık ${para(yillikFiyat(a))} tutar.`,
        `Seçili katkı için komisyon oranı ${oranMetni(a.oran[seviye])} olarak alınır.`,
        `Bu ayarla bir satışın örnek komisyonu ${para(komisyon)} olur.`,
      ]
    : [
        'Seçili ödeme biçimi satış başına sabit tutardır.',
        `Bu ayarla bir satışın örnek komisyonu ${para(komisyon)} olur.`,
        'Sabit tutar yetkinizi değiştirmez.',
      ];

  const adimlar: AkisAdimi[] = [
    {
      id: 'anlasma',
      ad: 'Anlaşmayı ve onaylı bilgiyi alın',
      sorumlu: 'Pazarlama sorumlusu (önerilen)',
      yap: [
        'Yazılı anlaşmayı isteyin.',
        'Onaylı Segika bilgi listesini isteyin.',
        'Elçinin yasa danışmanlığı yapmadığını yazdırın.',
      ],
      soru: 'Elinizde hangi belgeler var?',
      ek: 'anlasma',
      secenekler: [
        { id: 'tam', metin: 'Yazılı anlaşma ve onaylı liste var', tur: 'devam', sonraki: 'icerik' },
        { id: 'liste-yok', metin: 'Anlaşma var, onaylı liste yok', tur: 'bekle', sonuc: { baslik: 'Onaylı listeyi bekleyin', metin: [
          'Onaylı bilgi olmadan içerik yayımlamayın.',
          'Pazarlama sorumlusu listeyi ürün sorumlusuyla hazırlar.',
          'Liste gelince bu adıma dönün.',
        ] } },
        { id: 'anlasma-yok', metin: 'Henüz yazılı anlaşma yok', tur: 'bekle', sonuc: { baslik: 'Anlaşmayı bekleyin', metin: [
          'Anlaşma olmadan tanıtım ve komisyon başlamaz.',
          'Pazarlama sorumlusu anlaşma taslağını size gönderir.',
          'İmzalı anlaşma gelince bu adıma dönün.',
        ] } },
      ],
    },
    {
      id: 'icerik',
      ad: 'Teşvik ve bordro içeriği hazırlayın',
      sorumlu: 'Marka elçisi',
      yap: [
        'Teşvik, devletin işverene sağladığı destektir.',
        'Kural anlatıyorsanız ürün sorumlusuna kontrol ettirin.',
        'İçeriğe hazırlandığı tarihi yazın.',
      ],
      soru: 'İçerikte ne var?',
      dikkat: 'İşverene teşvik tutarı veya kesin tasarruf vaat etmeyin.',
      ek: 'kitle',
      secenekler: [
        { id: 'onayli', metin: 'Yalnız kontrol edilmiş bilgi var', tur: 'devam', sonraki: 'baglanti' },
        { id: 'vaat', metin: 'Kesin teşvik veya tasarruf vaadi var', tur: 'bekle', sonuc: { baslik: 'Vaadi çıkarın', metin: [
          'Teşvik hakkı işverenin kendi durumuna bağlıdır.',
          'Siz bu cümleyi içerikten çıkarın.',
          'Düzeltince bu adıma dönün.',
        ] } },
        { id: 'calisan-verisi', metin: 'Ekranda gerçek çalışan bilgisi görünüyor', tur: 'bekle', sonuc: { baslik: 'Kaydı yayımlamayın', metin: [
          'Gerçek çalışan bilgisi kişisel veridir.',
          'Siz şirketin örnek kayıtlı gösterim ortamını isteyin.',
          'Yeni kayıtla bu adıma dönün.',
        ] } },
      ],
    },
    {
      id: 'baglanti',
      ad: 'Bağlantıyı ve kodu deneyin',
      sorumlu: 'Pazarlama sorumlusu (önerilen)',
      yap: [
        'Elçiye özel bağlantıyı veya kodu verin.',
        'Başvuru formunun çalışan bilgisi istemediğine bakın.',
        'Deneme başvurusunun elçiye yazıldığına bakın.',
      ],
      soru: 'Deneme başvurusu ne oldu?',
      secenekler: [
        { id: 'yazildi', metin: 'Deneme başvurusu elçi kaydına yazıldı', tur: 'devam', sonraki: 'yayin' },
        { id: 'dusmedi', metin: 'Deneme başvurusu kayda düşmedi', tur: 'bekle', sonuc: { baslik: 'Kaydı düzeltin', metin: [
          'Kayıt çalışmazsa satış size yazılamayabilir.',
          'Pazarlama sorumlusu bağlantıyı düzeltir.',
          'Yeni denemeden sonra bu adıma dönün.',
        ] } },
        { id: 'kod-yok', metin: 'Henüz bağlantı veya kod verilmedi', tur: 'bekle', sonuc: { baslik: 'Bağlantıyı bekleyin', metin: [
          'Bağlantı olmadan başvuru size bağlanmaz.',
          'Pazarlama sorumlusu bağlantıyı veya kodu hazırlar.',
          'Gelince bu adıma dönün.',
        ] } },
      ],
    },
    {
      id: 'yayin',
      ad: 'Reklam ibaresiyle yayımlayın',
      sorumlu: 'Marka elçisi',
      yap: [
        '“Reklam” ibaresini metnin başına yazın.',
        'Seminerde iş birliğini baştan söyleyin.',
        'Yorumlardaki kişisel bilgileri gizleyin.',
      ],
      soru: 'Reklam ibaresi nasıl görünüyor?',
      ek: 'sinir',
      secenekler: [
        { id: 'gorunuyor', metin: 'İbare ilk bakışta görünüyor', tur: 'devam', sonraki: 'basvuru' },
        { id: 'gizli', metin: 'İbare gizli veya eksik', tur: 'bekle', sonuc: { baslik: 'İbareyi düzeltin', metin: [
          'Ticari tanıtımın reklam olduğu açıkça görünmelidir.',
          'Siz ibareyi ekleyin. Ekleyemiyorsanız paylaşımı kaldırın.',
          'Düzeltince bu adıma dönün.',
        ] } },
      ],
    },
    {
      id: 'basvuru',
      ad: 'Gelen başvuruyu kontrol edin',
      sorumlu: 'Pazarlama sorumlusu (önerilen)',
      yap: [
        'Başvuranın işveren olup olmadığını kaydedin.',
        'İşverenin danışmanı da önermiş mi, bakın.',
        'Sonucu elçiye bildirin.',
      ],
      soru: 'Başvuran için hangisi doğru?',
      secenekler: [
        { id: 'yeni', metin: 'Yeni bir işveren başvurdu', tur: 'devam', sonraki: seviye === 'A' ? 'devir' : 'gosterim' },
        { id: 'cakisma', metin: 'İşverenin danışmanı da başvurdu', tur: 'bekle', sonuc: { baslik: 'Kaydın sahibini netleştirin', metin: [
          'Satışın kime yazılacağını kabul edilen anlaşma belirler.',
          'Pazarlama sorumlusu kayıt tarihlerini karşılaştırır.',
          'Karar yazılı gelince bu adıma dönün.',
        ] } },
        { id: 'uygun-degil', metin: 'Başvuran işveren değil', tur: 'bitir', sonuc: { baslik: 'Başvuru uygun değil', metin: [
          'Segika işverenler için hazırlanmıştır.',
          'Satış baskısı kurmayın.',
          'Bu başvuru için iş burada biter.',
        ] } },
      ],
    },
  ];

  if (seviye !== 'A') {
    adimlar.push({
      id: 'gosterim',
      ad: 'Ürün gösterimini yapın',
      sorumlu: 'Marka elçisi',
      yap: [
        'Yalnız örnek kayıtlı gösterim ortamını kullanın.',
        'İşverenin çalışan bilgilerini istemeyin.',
        'Teşvik hakkı sorulursa soruyu şirkete iletin.',
      ],
      soru: 'Gösterim nasıl sonuçlandı?',
      secenekler: [
        { id: 'teklif-istedi', metin: 'İşveren teklif istedi', tur: 'devam', sonraki: seviye === 'B' ? 'devir' : 'teklif' },
        { id: 'ortam-yok', metin: 'Örnek kayıtlı ortam henüz yok', tur: 'bekle', sonuc: { baslik: 'Gösterim ortamını bekleyin', metin: [
          'Gerçek kayıtla gösterim yapmayın.',
          'Ürün sorumlusu örnek kayıtlı ortamı hazırlar.',
          'Ortam gelince bu adıma dönün.',
        ] } },
        { id: 'ilgisiz', metin: 'İşveren ilgilenmedi', tur: 'bitir', sonuc: { baslik: 'Görüşme kapandı', metin: [
          'İşverenin kararına saygı gösterin.',
          'Gerekçeyi kayda yazın.',
          'Israr etmeyin.',
        ] } },
      ],
    });
  }

  if (seviye === 'C') {
    adimlar.push({
      id: 'teklif',
      ad: 'Onaylı teklifle görüşün',
      sorumlu: 'Marka elçisi',
      yap: [
        'Yalnız şirketin onayladığı teklifi kullanın.',
        `Fiyat ${sayi(a.blok)} çalışanlık bloklarla hesaplanır.`,
        'Çalışan sayısı değişirse yeni teklif isteyin.',
      ],
      soru: 'Teklif için hangisi doğru?',
      ek: 'sinir',
      secenekler: [
        { id: 'kabul', metin: 'İşveren onaylı teklifi kabul etti', tur: 'devam', sonraki: 'odeme' },
        { id: 'sayi-degisti', metin: 'İşverenin çalışan sayısı değişti', tur: 'bekle', sonuc: { baslik: 'Teklifi yeniden kontrol ettirin', metin: [
          'Sayı aynı blokta kalırsa fiyat değişmeyebilir.',
          'Satış sorumlusu teklifi yeniden kontrol eder.',
          'Yeni teklif gelince bu adıma dönün.',
        ] } },
        { id: 'fiyat', metin: 'İşveren farklı fiyat istiyor', tur: 'bekle', sonuc: { baslik: 'Kararı satış sorumlusuna bırakın', metin: [
          'Fiyatı siz veya finans tek başına değiştiremez.',
          'Satış sorumlusu talebi değerlendirir.',
          'Yazılı karar gelince bu adıma dönün.',
        ] } },
        { id: 'red', metin: 'İşveren teklifi reddetti', tur: 'bitir', sonuc: { baslik: 'Teklif reddedildi', metin: [
          'Gerekçeyi kayda yazın.',
          'Israr etmeyin.',
          'Bu işveren için iş burada biter.',
        ] } },
      ],
    });
  } else {
    adimlar.push({
      id: 'devir',
      ad: seviye === 'A' ? 'Başvuruyu satış ekibine bırakın' : 'Kapanışı şirkete devredin',
      sorumlu: 'Satış uzmanı (önerilen)',
      yap: seviye === 'A'
        ? ['Başvuruyu satış uzmanı devralır.', 'Elçi ürün gösterimi yapmaz.', 'Teşvik sorularını satış uzmanı yanıtlar.']
        : ['Gösterim notlarını satış uzmanına iletin.', 'Teklifi ve sözleşmeyi satış uzmanı hazırlar.', 'Elçi fiyat konuşmaz.'],
      soru: 'Satış görüşmesi ne durumda?',
      secenekler: [
        { id: 'satis-oldu', metin: 'İşveren paketi satın almayı kabul etti', tur: 'devam', sonraki: 'odeme' },
        { id: 'donus-yok', metin: 'Satış uzmanı henüz dönmedi', tur: 'bekle', sonuc: { baslik: 'Satış ekibini bekleyin', metin: [
          'Satış görüşmesini şirket yürütür.',
          'Pazarlama sorumlusu durumu satış uzmanına sorar.',
          'Haber gelince bu adıma dönün.',
        ] } },
        { id: 'vazgecti', metin: 'İşveren satın almadı', tur: 'bitir', sonuc: { baslik: 'Satış olmadı', metin: [
          'Satış olmadığı için komisyon oluşmaz.',
          'Satış uzmanı gerekçeyi kayda yazar.',
          'Bu işveren için iş burada biter.',
        ] } },
      ],
    });
  }

  adimlar.push(
    {
      id: 'odeme',
      ad: 'Ödeme sonucunu izleyin',
      sorumlu: 'Finans sorumlusu (önerilen)',
      yap: odemeMetni,
      soru: 'İşverenin ödemesi için hangisi doğru?',
      dikkat: 'Bu hesap örnektir. Kazanç garantisi değildir.',
      ek: 'kazanc',
      secenekler: [
        { id: 'odedi', metin: 'İşveren ödemeyi yaptı', tur: 'devam', sonraki: 'kapanis' },
        { id: 'odemedi', metin: 'İşveren henüz ödemedi', tur: 'bekle', sonuc: { baslik: 'Ödemeyi bekleyin', metin: [
          'Ödeme alınmadıysa komisyon oluşmaz.',
          'Finans sorumlusu ödeme durumunu izler.',
          'Ödeme gelince bu adıma dönün.',
        ] } },
        { id: 'kural-yok', metin: 'Ödeme günü kuralı yazılı değil', tur: 'bekle', sonuc: { baslik: 'Ödeme kuralını netleştirin', metin: [
          'Gün sayımının hangi olayla başladığı açık değildir.',
          'Finans sorumlusu kuralı anlaşmaya yazar.',
          'Kural yazılınca bu adıma dönün.',
        ] } },
        { id: 'iade', metin: 'İşveren iade istedi', tur: 'bekle', sonuc: { baslik: 'İade kararını bekleyin', metin: [
          'İadede komisyonun durumunu anlaşma belirler.',
          'Finans sorumlusu kararı size yazılı bildirir.',
          'Karar gelince bu adıma dönün.',
        ] } },
      ],
    },
    {
      id: 'kapanis',
      ad: 'Kural içeriğini güncel tutun',
      sorumlu: 'Marka elçisi',
      yap: [
        'Yasa veya yönetmelik değişirse içeriği güncelleyin.',
        'Güncelleyemiyorsanız içeriği kaldırın.',
        'Anlaşma biterse yayın listesini birlikte çıkarın.',
      ],
      soru: 'Anlaşmanız ne durumda?',
      ek: 'anlasma',
      secenekler: [
        { id: 'suruyor', metin: 'Anlaşma sürüyor', tur: 'tamamla', sonuc: { baslik: 'Bu satışın işi bitti', metin: [
          'Yeni işverenler için içerik hazırlamaya devam edebilirsiniz.',
          'Her yeni içerikte reklam ibaresini kullanın.',
        ] } },
        { id: 'bitti', metin: 'Anlaşma bitti', tur: 'tamamla', sonuc: { baslik: 'Anlaşma kapandı', metin: [
          'İçeriği anlaşmadaki sürede kaldırın.',
          'Şirket gösterim ortamı erişiminizi kapatabilir.',
          'Finans sorumlusu açık başvuruların sonucunu yazılı bildirir.',
        ] } },
      ],
    },
  );

  return {
    baslik: 'Segika marka elçisi akışı',
    ozet: SEVIYE_OZET[seviye],
    hedef: 'İşverenleri doğru bilgiyle Segika’ya yönlendirin.',
    ilk: 'anlasma',
    adimlar,
  };
};
