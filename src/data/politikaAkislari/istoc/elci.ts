import { belgeAdimlariniCikar } from '../motor';
import type { AkisAdimi, AkisOlustur } from '../types';
import { satisKazanci, yillikFiyat, type Ayar, type Seviye } from '../../satisOrtakligi';
import { num, tlBitisik } from '../../../lib/format';

const sayi = num;
/** Tutar ile birim arasında bölünmez boşluk bulunur. */
const para = tlBitisik;
const avro = (n: number) => `${sayi(n)} €`;
const oranMetni = (n: number) => `%${sayi(n * 100)}`;

/** iStoc fiyatı avroyla belirlenir. TL karşılığı örnek kura bağlıdır. */
const yillikPaket = (a: Ayar) =>
  `Yıllık paket ${sayi(a.istocYilAy)} aylık bedeldir: ${avro(a.istocAyEur * a.istocYilAy)}. Bu örnekte kur ${sayi(a.kur)} ₺ olduğu için ${para(yillikFiyat(a))} eder.`;

const SEVIYE_OZET: Record<Seviye, string> = {
  A: 'Siz yalnız tanıştırırsınız. Ürün gösterimini ve satışı şirket yapar.',
  B: 'Siz ürün gösterimi de yaparsınız. Satışı şirket kapatır.',
  C: 'Siz şirketin onayladığı teklifle satış görüşmesini yürütürsünüz.',
};

const akisOlusturTam: AkisOlustur = (a) => {
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
      terimler: ['Onaylı liste, şirketin doğru dediği bilgilerin listesidir.'],
      yap: [
        'Pazarlama sorumlusu yazılı anlaşmayı size gönderir.',
        'Pazarlama sorumlusu onaylı iStoc bilgi listesini size gönderir.',
        'Siz tanıtım yapacağınız kanalları anlaşmaya yazdırın.',
      ],
      soru: 'Elinizde hangi belgeler var?',
      ek: 'anlasma',
      secenekler: [
        { id: 'tam', metin: 'Elimde yazılı anlaşma ve onaylı liste var', tur: 'devam', sonraki: 'icerik' },
        { id: 'liste-yok', metin: 'Anlaşma geldi ama onaylı liste gelmedi', tur: 'bekle', sonuc: { baslik: 'Onaylı listeyi bekleyin', metin: [
          'Onaylı bilgi olmadan içerik yayımlamayın.',
          'Pazarlama sorumlusu listeyi ürün sorumlusuyla hazırlar.',
          'Liste gelince bu adıma dönün.',
        ] } },
        { id: 'anlasma-yok', metin: 'Yazılı anlaşma henüz gelmedi', tur: 'bekle', sonuc: { baslik: 'Anlaşmayı bekleyin', metin: [
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
      terimler: ['Katalog, satıcının ürün listesidir.'],
      yap: [
        'Toptan satıcıların katalog ihtiyacını anlatın.',
        'Yalnız onaylı bilgiyi kullanın.',
        'Gerçek satıcı kataloğu yerine örnek ürün kullanın.',
      ],
      soru: 'Hazırladığınız içerikte ne var?',
      dikkat: 'Satıcıya alıcı, sipariş veya ciro artışı vaat etmeyin.',
      ek: 'kitle',
      secenekler: [
        { id: 'onayli', metin: 'İçerikte yalnız onaylı bilgi ve örnek ürün var', tur: 'devam', sonraki: 'baglanti' },
        { id: 'vaat', metin: 'İçerik alıcı veya sipariş sözü veriyor', tur: 'bekle', sonuc: { baslik: 'Bu sözü içerikten çıkarın', metin: [
          'Böyle bir söz satıcıda yanlış umut yaratır.',
          'Siz bu cümleyi içerikten çıkarın.',
          'İçeriği düzeltince bu adıma dönün.',
        ] } },
        { id: 'gercek-katalog', metin: 'İçerikte gerçek bir satıcının kataloğu var', tur: 'bekle', sonuc: { baslik: 'Satıcının iznini bekleyin', metin: [
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
      terimler: ['Deneme başvurusu, bağlantıyı sınamak için yaptığınız başvurudur.'],
      yap: [
        'Pazarlama sorumlusu size özel bir bağlantı veya kod verir.',
        'Siz bağlantıyı başka bir tarayıcı penceresinde açın. Sonra siz deneme başvurusu yapın.',
        'Pazarlama sorumlusu deneme başvurusunun size yazıldığını kontrol eder.',
      ],
      soru: 'Deneme başvurunuz ne oldu?',
      secenekler: [
        { id: 'yazildi', metin: 'Başvuru benim adıma kaydedildi', tur: 'devam', sonraki: 'yayin' },
        { id: 'dusmedi', metin: 'Başvuru benim adıma kaydedilmedi', tur: 'bekle', sonuc: { baslik: 'Kaydı düzeltin', metin: [
          'Kayıt çalışmazsa şirket satışı sizin adınıza yazamayabilir.',
          'Pazarlama sorumlusu bağlantıyı düzeltir.',
          'Yeni denemeden sonra bu adıma dönün.',
        ] } },
        { id: 'kod-yok', metin: 'Bana henüz bağlantı veya kod verilmedi', tur: 'bekle', sonuc: { baslik: 'Bağlantıyı bekleyin', metin: [
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
      terimler: ['İbare, metne eklenen kısa yazıdır.'],
      yap: [
        '“Reklam” ibaresini metnin başına yazın.',
        'Video ve fuarda iş birliğini sözle de söyleyin.',
        'Fuarda kodu yazılı olarak verin.',
      ],
      soru: '“Reklam” yazısı nasıl görünüyor?',
      ek: 'sinir',
      secenekler: [
        { id: 'gorunuyor', metin: '“Reklam” yazısı hemen görünüyor', tur: 'devam', sonraki: 'basvuru' },
        { id: 'gizli', metin: '“Reklam” yazısı gizli veya hiç yok', tur: 'bekle', sonuc: { baslik: '“Reklam” yazısını düzeltin', metin: [
          'Satış için yapılan tanıtımın reklam olduğu açıkça görünmeli.',
          'Siz “Reklam” yazısını ekleyin. Ekleyemiyorsanız paylaşımı kaldırın.',
          'Paylaşımı düzeltince bu adıma dönün.',
        ] } },
      ],
    },
    {
      id: 'basvuru',
      ad: 'Gelen başvuruyu kontrol edin',
      sorumlu: 'Pazarlama sorumlusu (önerilen görev)',
      terimler: ['Toptan satıcı, malı çok sayıda ve başka işyerlerine satan firmadır.'],
      yap: [
        'Pazarlama sorumlusu başvuranın toptan satış yapıp yapmadığını kaydeder.',
        'Pazarlama sorumlusu satıcının şirketle önceden görüşüp görüşmediğine bakar.',
        'Pazarlama sorumlusu sonucu size bildirir.',
      ],
      soru: 'Başvuran satıcı hakkında ne öğrendiniz?',
      secenekler: [
        { id: 'yeni', metin: 'Yeni bir toptan satıcı başvurdu', tur: 'devam', sonraki: seviye === 'A' ? 'devir' : 'gosterim' },
        { id: 'cakisma', metin: 'Satıcı şirketle zaten görüşüyor', tur: 'bekle', sonuc: { baslik: 'Satışın kime yazılacağını öğrenin', metin: [
          'Satışın kime yazılacağını imzalı anlaşma belirler.',
          'Pazarlama sorumlusu kayıt tarihlerini karşılaştırır.',
          'Karar yazılı gelince bu adıma dönün.',
        ] } },
        { id: 'uygun-degil', metin: 'Başvuran toptan satış yapmıyor', tur: 'bitir', sonuc: { baslik: 'Başvuru uygun değil', metin: [
          'Bu kişi iStoc için uygun satıcı değildir.',
          'Satın alması için ısrar etmeyin.',
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
      terimler: ['Ürün gösterimi, programı satıcıya çalışırken göstermektir.'],
      yap: [
        'Şirketin gösterim hesabını ve örnek kataloğu kullanın.',
        'Satıcının ürün bilgisi sorunlarını not edin.',
        fiyatCevabi,
      ],
      soru: 'Ürün gösterimi nasıl bitti?',
      secenekler: [
        { id: 'teklif-istedi', metin: 'Satıcı fiyat teklifi istedi', tur: 'devam', sonraki: seviye === 'B' ? 'devir' : 'teklif' },
        { id: 'egitim-yok', metin: 'Gösterim eğitimini henüz almadım', tur: 'bekle', sonuc: { baslik: 'Eğitimi bekleyin', metin: [
          'Eğitim almadan gösterim yaparsanız yanlış bilgi verebilirsiniz.',
          'Ortaklık sorumlusu eğitim tarihini bildirir.',
          'Eğitimden sonra bu adıma dönün.',
        ] } },
        { id: 'ilgisiz', metin: 'Satıcı ilgilenmedi', tur: 'bitir', sonuc: { baslik: 'Görüşme kapandı', metin: [
          'Satıcının kararına saygı gösterin.',
          'Satıcının nedenini kayda yazın.',
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
      terimler: ['Teklif, şirketin yazılı fiyat önerisidir.'],
      yap: [
        'Yalnız şirketin onayladığı teklifi kullanın.',
        'Fiyatı ve paket koşulunu değiştirmeyin.',
        'Sözleşmeyi şirket hazırlar.',
      ],
      soru: 'Teklif ne durumda?',
      ek: 'sinir',
      secenekler: [
        { id: 'kabul', metin: 'Satıcı onaylı teklifi kabul etti', tur: 'devam', sonraki: 'odeme' },
        { id: 'teklif-yok', metin: 'Onaylı teklif henüz gelmedi', tur: 'bekle', sonuc: { baslik: 'Teklifi bekleyin', metin: [
          'Şirketin onaylamadığı teklifi vermeyin.',
          'Satış sorumlusu teklifi fiyat tablosundaki fiyatla hazırlar.',
          'Teklif gelince bu adıma dönün.',
        ] } },
        { id: 'fiyat', metin: 'Satıcı farklı fiyat istiyor', tur: 'bekle', sonuc: { baslik: 'Fiyat herkes için aynı', metin: [
          'Satıcıya fiyatın herkes için aynı olduğunu söyleyin.',
          'Fiyat pazarlıkla değişmez.',
          'Bu isteği kimseye iletmeyin. Şirket yeni teklif hazırlamaz.',
          'Satıcı tablodaki fiyatı kabul ederse bu adıma dönün.',
        ] } },
        { id: 'red', metin: 'Satıcı teklifi kabul etmedi', tur: 'bitir', sonuc: { baslik: 'Teklif kabul edilmedi', metin: [
          'Nedenini kayda yazın.',
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
      terimler: ['Satış uzmanı, satışı yapan şirket çalışanıdır.'],
      yap: seviye === 'A'
        ? [ 'Satış uzmanı başvuruyu devralır ve ürün gösterimini yapar.', 'Siz ürün gösterimi yapmazsınız.', fiyatCevabiSiz]
        : [ 'Siz gösterim notlarını satış uzmanına iletin.', 'Satış uzmanı teklifi ve sözleşmeyi hazırlar.', fiyatCevabiSiz],
      soru: 'Satış görüşmesi ne durumda?',
      secenekler: [
        { id: 'satis-oldu', metin: 'Satıcı paketi satın almayı kabul etti', tur: 'devam', sonraki: 'odeme' },
        { id: 'donus-yok', metin: 'Satış uzmanı henüz haber vermedi', tur: 'bekle', sonuc: { baslik: 'Satış ekibini bekleyin', metin: [
          'Satış görüşmesini şirket yapar.',
          'Pazarlama sorumlusu durumu satış uzmanına sorar.',
          'Haber gelince bu adıma dönün.',
        ] } },
        { id: 'vazgecti', metin: 'Satıcı satın almadı', tur: 'bitir', sonuc: { baslik: 'Satış olmadı', metin: [
          'Satış olmadığı için komisyon oluşmaz.',
          'Satış uzmanı nedenini kayda yazar.',
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
      terimler: ['Komisyon, satış için size ödenen paydır.'],
      yap: odemeMetni,
      soru: 'Satıcının ödemesi ne durumda?',
      dikkat: 'Bu hesap örnektir. Kazanç garantisi değildir.',
      ek: 'kazanc',
      secenekler: [
        { id: 'odedi', metin: 'Satıcı ödemeyi yaptı', tur: 'devam', sonraki: 'kapanis' },
        { id: 'odemedi', metin: 'Satıcı henüz ödemedi', tur: 'bekle', sonuc: { baslik: 'Ödemeyi bekleyin', metin: [
          'Satıcı ödemeden komisyon oluşmaz.',
          'Finans sorumlusu ödeme durumunu izler.',
          'Ödeme gelince bu adıma dönün.',
        ] } },
        { id: 'kural-yok', metin: 'Ödeme günü kuralı anlaşmada yazmıyor', tur: 'bekle', sonuc: { baslik: 'Ödeme kuralının yazılmasını bekleyin', metin: [
          'Günler, müşterinin ödeme yaptığı günden sayılır.',
          'Finans sorumlusu kuralı anlaşmaya yazar.',
          'Kural yazılınca bu adıma dönün.',
        ] } },
        { id: 'iade', metin: 'Satıcı parasını geri istedi', tur: 'bekle', sonuc: { baslik: 'Geri ödeme kararını bekleyin', metin: [
          'Para geri verilirse komisyona ne olacağını imzalı anlaşma söyler.',
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
          'Finans sorumlusu bitmemiş başvuruların sonucunu yazılı bildirir.',
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

/** Rehberde belge adımları sorulmaz (motor.ts → belgeAdimlariniCikar). */
export const akisOlustur: AkisOlustur = (a) => belgeAdimlariniCikar(akisOlusturTam(a));
