import type { AkisAdimi, AkisOlustur } from '../types';
import { satisKazanci, yillikFiyat, type Ayar, type Seviye } from '../../satisOrtakligi';

const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
/** Tutar ile birim arasında bölünmez boşluk bulunur. */
const para = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n))} TL`;
const avro = (n: number) => `${sayi(n)} €`;
const oranMetni = (n: number) => `%${sayi(n * 100)}`;

/** iStoc fiyatı avroyla belirlenir. TL karşılığı örnek kura bağlıdır. */
const yillikPaket = (a: Ayar) =>
  `Yıllık paket ${sayi(a.istocYilAy)} aylık bedeldir: ${avro(a.istocAyEur * a.istocYilAy)}. Bu örnekte kur ${sayi(a.kur)} TL olduğu için ${para(yillikFiyat(a))} eder.`;

const SEVIYE_OZET: Record<Seviye, string> = {
  A: 'Siz yalnız tanıştırırsınız. Ürün gösterimini ve satışı şirket yapar.',
  B: 'Siz ürün gösterimi de yaparsınız. Satışı şirket kapatır.',
  C: 'Siz şirketin onayladığı teklifle satış görüşmesini yürütürsünüz.',
};

export const akisOlustur: AkisOlustur = (a) => {
  const seviye = a.elciSeviye;
  const komisyon = satisKazanci(a, seviye);
  const odemeMetni = a.model === 'oran'
    ? [
        yillikPaket(a),
        `Şirket yıllık paket bedelinin ${oranMetni(a.oran[seviye])} kadarını size komisyon olarak öder.`,
        `Bu örnekte bir satışın komisyonu ${para(komisyon)} olur.`,
      ]
    : [
        'Bu örnekte şirket satış başına sabit komisyon öder.',
        `Bu örnekte bir satışın komisyonu ${para(komisyon)} olur.`,
        'Sabit tutar yetkinizi değiştirmez.',
      ];
  const fiyatCevabi = 'Fiyat sorulursa yalnız fiyat tablosundaki fiyatı söyleyin.';
  /** Adımı başka biri yürütürken okurun kendi işi "siz" ile ayrıca söylenir. */
  const fiyatCevabiSiz = 'Fiyat sorulursa siz yalnız fiyat tablosundaki fiyatı söyleyin.';

  const adimlar: AkisAdimi[] = [
    {
      id: 'anlasma',
      ad: 'Anlaşmayı ve onaylı bilgiyi alın',
      sorumlu: 'Pazarlama sorumlusu (önerilen görev)',
      yap: [
        'Pazarlama sorumlusu yazılı anlaşmayı size gönderir.',
        'Pazarlama sorumlusu onaylı iStoc bilgi listesini size gönderir.',
        'Siz tanıtım yapacağınız kanalları anlaşmaya yazdırın.',
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
      ad: 'Satıcılar için içerik hazırlayın',
      sorumlu: 'Siz',
      yap: [
        'Toptan satıcıların katalog ihtiyacını anlatın.',
        'Yalnız onaylı bilgiyi kullanın.',
        'Gerçek satıcı kataloğu yerine örnek ürün kullanın.',
      ],
      soru: 'İçerikte ne var?',
      dikkat: 'Satıcıya alıcı, sipariş veya ciro artışı vaat etmeyin.',
      ek: 'kitle',
      secenekler: [
        { id: 'onayli', metin: 'Yalnız onaylı bilgi ve örnek ürün var', tur: 'devam', sonraki: 'baglanti' },
        { id: 'vaat', metin: 'Alıcı veya sipariş vaadi var', tur: 'bekle', sonuc: { baslik: 'Vaadi çıkarın', metin: [
          'Sonuç vaadi yanlış beklenti yaratır.',
          'Siz bu cümleyi içerikten çıkarın.',
          'İçeriği düzeltince bu adıma dönün.',
        ] } },
        { id: 'gercek-katalog', metin: 'Gerçek bir satıcının kataloğu var', tur: 'bekle', sonuc: { baslik: 'Satıcının iznini bekleyin', metin: [
          'Kataloğun ve görsellerin sahibi o satıcı olabilir.',
          'Siz satıcıdan yazılı izin isteyin.',
          'İzin yoksa içeriği örnek ürünle yeniden hazırlayın.',
        ] } },
      ],
    },
    {
      id: 'baglanti',
      ad: 'Bağlantıyı ve kodu deneyin',
      sorumlu: 'Pazarlama sorumlusu (önerilen görev)',
      yap: [
        'Pazarlama sorumlusu size özel bir bağlantı veya kod verir.',
        'Siz bağlantıyı başka bir tarayıcı penceresinde açın. Sonra siz deneme başvurusu yapın.',
        'Pazarlama sorumlusu deneme başvurusunun size yazıldığını kontrol eder.',
      ],
      soru: 'Deneme başvurusu ne oldu?',
      secenekler: [
        { id: 'yazildi', metin: 'Deneme başvurusu benim kaydıma yazıldı', tur: 'devam', sonraki: 'yayin' },
        { id: 'dusmedi', metin: 'Deneme başvurusu kayda düşmedi', tur: 'bekle', sonuc: { baslik: 'Kaydı düzeltin', metin: [
          'Kayıt çalışmazsa şirket satışı size yazamayabilir.',
          'Pazarlama sorumlusu bağlantıyı düzeltir.',
          'Yeni denemeden sonra bu adıma dönün.',
        ] } },
        { id: 'kod-yok', metin: 'Henüz bağlantı veya kod verilmedi', tur: 'bekle', sonuc: { baslik: 'Bağlantıyı bekleyin', metin: [
          'Bağlantı olmadan başvuru size bağlanmaz.',
          'Pazarlama sorumlusu bağlantıyı veya kodu hazırlar.',
          'Bağlantı gelince bu adıma dönün.',
        ] } },
      ],
    },
    {
      id: 'yayin',
      ad: 'Reklam ibaresiyle yayımlayın',
      sorumlu: 'Siz',
      yap: [
        '“Reklam” ibaresini metnin başına yazın.',
        'Video ve fuarda iş birliğini sözle de söyleyin.',
        'Fuarda kodu yazılı olarak verin.',
      ],
      soru: 'Reklam ibaresi nasıl görünüyor?',
      ek: 'sinir',
      secenekler: [
        { id: 'gorunuyor', metin: 'İbare ilk bakışta görünüyor', tur: 'devam', sonraki: 'basvuru' },
        { id: 'gizli', metin: 'İbare gizli veya eksik', tur: 'bekle', sonuc: { baslik: 'İbareyi düzeltin', metin: [
          'Ticari tanıtımın reklam olduğu açıkça görünmelidir.',
          'Siz ibareyi ekleyin. Ekleyemiyorsanız paylaşımı kaldırın.',
          'Paylaşımı düzeltince bu adıma dönün.',
        ] } },
      ],
    },
    {
      id: 'basvuru',
      ad: 'Gelen başvuruyu kontrol edin',
      sorumlu: 'Pazarlama sorumlusu (önerilen görev)',
      yap: [
        'Pazarlama sorumlusu başvuranın toptan satış yapıp yapmadığını kaydeder.',
        'Pazarlama sorumlusu satıcının şirketle önceden görüşüp görüşmediğine bakar.',
        'Pazarlama sorumlusu sonucu size bildirir.',
      ],
      soru: 'Başvuran satıcı için hangisi doğru?',
      secenekler: [
        { id: 'yeni', metin: 'Yeni bir toptan satıcı başvurdu', tur: 'devam', sonraki: seviye === 'A' ? 'devir' : 'gosterim' },
        { id: 'cakisma', metin: 'Satıcı şirketle zaten görüşüyor', tur: 'bekle', sonuc: { baslik: 'Kaydın sahibini netleştirin', metin: [
          'Satışın kime yazılacağını imzalı anlaşma belirler.',
          'Pazarlama sorumlusu kayıt tarihlerini karşılaştırır.',
          'Karar yazılı gelince bu adıma dönün.',
        ] } },
        { id: 'uygun-degil', metin: 'Başvuran toptan satış yapmıyor', tur: 'bitir', sonuc: { baslik: 'Başvuru uygun değil', metin: [
          'Bu kişi iStoc için uygun satıcı değildir.',
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
      sorumlu: 'Siz',
      yap: [
        'Şirketin gösterim hesabını ve örnek kataloğu kullanın.',
        'Satıcının ürün bilgisi sorunlarını not edin.',
        fiyatCevabi,
      ],
      soru: 'Gösterim nasıl sonuçlandı?',
      secenekler: [
        { id: 'teklif-istedi', metin: 'Satıcı teklif istedi', tur: 'devam', sonraki: seviye === 'B' ? 'devir' : 'teklif' },
        { id: 'egitim-yok', metin: 'Gösterim eğitimini henüz almadım', tur: 'bekle', sonuc: { baslik: 'Eğitimi bekleyin', metin: [
          'Eğitimsiz gösterim yanlış bilgi verebilir.',
          'Ortaklık sorumlusu eğitim tarihini bildirir.',
          'Eğitimden sonra bu adıma dönün.',
        ] } },
        { id: 'ilgisiz', metin: 'Satıcı ilgilenmedi', tur: 'bitir', sonuc: { baslik: 'Görüşme kapandı', metin: [
          'Satıcının kararına saygı gösterin.',
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
      sorumlu: 'Siz',
      yap: [
        'Yalnız şirketin onayladığı teklifi kullanın.',
        'Fiyatı ve paket koşulunu değiştirmeyin.',
        'Sözleşmeyi şirket hazırlar.',
      ],
      soru: 'Teklif için hangisi doğru?',
      ek: 'sinir',
      secenekler: [
        { id: 'kabul', metin: 'Satıcı onaylı teklifi kabul etti', tur: 'devam', sonraki: 'odeme' },
        { id: 'teklif-yok', metin: 'Onaylı teklif henüz gelmedi', tur: 'bekle', sonuc: { baslik: 'Teklifi bekleyin', metin: [
          'Onaysız teklif vermeyin.',
          'Satış sorumlusu teklifi fiyat tablosundaki fiyatla hazırlar.',
          'Teklif gelince bu adıma dönün.',
        ] } },
        { id: 'fiyat', metin: 'Satıcı farklı fiyat istiyor', tur: 'bekle', sonuc: { baslik: 'Fiyat herkes için aynı', metin: [
          'Satıcıya fiyatın herkes için aynı olduğunu söyleyin.',
          'Fiyat pazarlıkla değişmez.',
          'Talebi kimseye iletmeyin. Şirket yeni teklif hazırlamaz.',
          'Satıcı tablodaki fiyatı kabul ederse bu adıma dönün.',
        ] } },
        { id: 'red', metin: 'Satıcı teklifi reddetti', tur: 'bitir', sonuc: { baslik: 'Teklif reddedildi', metin: [
          'Gerekçeyi kayda yazın.',
          'Israr etmeyin.',
          'Bu satıcı için iş burada biter.',
        ] } },
      ],
    });
  } else {
    adimlar.push({
      id: 'devir',
      ad: seviye === 'A' ? 'Başvuruyu satış ekibine bırakın' : 'Kapanışı şirkete devredin',
      sorumlu: 'Satış uzmanı (önerilen görev)',
      yap: seviye === 'A'
        ? ['Satış uzmanı başvuruyu devralır ve ürün gösterimini yapar.', 'Siz ürün gösterimi yapmazsınız.', fiyatCevabiSiz]
        : ['Siz gösterim notlarını satış uzmanına iletin.', 'Satış uzmanı teklifi ve sözleşmeyi hazırlar.', fiyatCevabiSiz],
      soru: 'Satış görüşmesi ne durumda?',
      secenekler: [
        { id: 'satis-oldu', metin: 'Satıcı paketi satın almayı kabul etti', tur: 'devam', sonraki: 'odeme' },
        { id: 'donus-yok', metin: 'Satış uzmanı henüz dönmedi', tur: 'bekle', sonuc: { baslik: 'Satış ekibini bekleyin', metin: [
          'Satış görüşmesini şirket yürütür.',
          'Pazarlama sorumlusu durumu satış uzmanına sorar.',
          'Haber gelince bu adıma dönün.',
        ] } },
        { id: 'vazgecti', metin: 'Satıcı satın almadı', tur: 'bitir', sonuc: { baslik: 'Satış olmadı', metin: [
          'Satış olmadığı için komisyon oluşmaz.',
          'Satış uzmanı gerekçeyi kayda yazar.',
          'Bu satıcı için iş burada biter.',
        ] } },
      ],
    });
  }

  adimlar.push(
    {
      id: 'odeme',
      ad: 'Ödeme sonucunu izleyin',
      sorumlu: 'Finans sorumlusu (önerilen görev)',
      yap: odemeMetni,
      soru: 'Satıcının ödemesi için hangisi doğru?',
      dikkat: 'Bu hesap örnektir. Kazanç garantisi değildir.',
      ek: 'kazanc',
      secenekler: [
        { id: 'odedi', metin: 'Satıcı ödemeyi yaptı', tur: 'devam', sonraki: 'kapanis' },
        { id: 'odemedi', metin: 'Satıcı henüz ödemedi', tur: 'bekle', sonuc: { baslik: 'Ödemeyi bekleyin', metin: [
          'Satıcı ödemeden komisyon oluşmaz.',
          'Finans sorumlusu ödeme durumunu izler.',
          'Ödeme gelince bu adıma dönün.',
        ] } },
        { id: 'kural-yok', metin: 'Ödeme günü kuralı yazılı değil', tur: 'bekle', sonuc: { baslik: 'Ödeme kuralını netleştirin', metin: [
          'Şirket gün sayımının hangi olayla başladığını henüz yazmadı.',
          'Finans sorumlusu kuralı anlaşmaya yazar.',
          'Kural yazılınca bu adıma dönün.',
        ] } },
        { id: 'iade', metin: 'Satıcı iade istedi', tur: 'bekle', sonuc: { baslik: 'İade kararını bekleyin', metin: [
          'İadede komisyonun durumunu imzalı anlaşma belirler.',
          'Finans sorumlusu kararı size yazılı bildirir.',
          'Karar gelince bu adıma dönün.',
        ] } },
      ],
    },
    {
      id: 'kapanis',
      ad: 'İçeriği güncel tutun',
      sorumlu: 'Siz',
      yap: [
        'Eski fiyat veya kampanya varsa içeriği güncelleyin.',
        'Satıcı şikâyet ederse içeriği kaldırın.',
        'Anlaşma biterse yayın listesini pazarlama sorumlusuyla çıkarın.',
      ],
      soru: 'Anlaşmanız ne durumda?',
      ek: 'anlasma',
      secenekler: [
        { id: 'suruyor', metin: 'Anlaşma sürüyor', tur: 'tamamla', sonuc: { baslik: 'Bu satışın işi bitti', metin: [
          'Yeni satıcılar için içerik hazırlamaya devam edebilirsiniz.',
          'Her yeni içerikte reklam ibaresini kullanın.',
        ] } },
        { id: 'bitti', metin: 'Anlaşma bitti', tur: 'tamamla', sonuc: { baslik: 'Anlaşma kapandı', metin: [
          'İçeriği anlaşmadaki sürede kaldırın.',
          'Şirket gösterim hesabınızı kapatabilir.',
          'Finans sorumlusu açık başvuruların sonucunu yazılı bildirir.',
        ] } },
      ],
    },
  );

  return {
    baslik: 'iStoc marka elçisi akışı',
    ozet: SEVIYE_OZET[seviye],
    hedef: 'Toptan satıcıları doğru bilgiyle iStoc’a yönlendirin.',
    ilk: 'anlasma',
    adimlar,
  };
};
