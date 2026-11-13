import type { AkisAdimi, AkisOlustur, AkisSecenegi } from '../types';
import { aylikFiyat, rolMetinleri, yillikFiyat, type Ayar } from '../../satisOrtakligi';

const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
/** Tutar ile birim arasında bölünmez boşluk bulunur. */
const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n))} ₺`;
const avro = (n: number) => `${sayi(n)} €`;

/** iStoc fiyatı avroyla belirlenir. TL karşılığı örnek kura bağlıdır. */
const yillikPaket = (a: Ayar) =>
  `Yıllık paket ${sayi(a.istocYilAy)} aylık bedeldir: ${avro(a.istocAyEur * a.istocYilAy)}. Bu örnekte kur ${sayi(a.kur)} ₺ olduğu için ${tl(yillikFiyat(a))} eder.`;

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const sonlu = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, ...aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

/** iStoc mevcut müşteri tavsiyesi. Bu projede yalnız ana program vardır. */
export const akisOlustur: AkisOlustur = (a) => {
  const kredi = aylikFiyat(a) * a.krediAy;
  const odulVar = a.krediAy > 0 && a.tavsiyeSinir > 0;
  // Kullanım süresi satış ortaklığı hesabındaki tavsiye kuralından gelir. Sayı bu dosyada yazılmaz.
  const kullanimGunu = rolMetinleri('istoc').find((r) => r.id === 'tavsiye')!.kurallar[1].match(/\d+/)?.[0];
  const kullanimKurali = kullanimGunu
    ? `Yeni müşteri iStoc’u ${kullanimGunu} gün kullanmaya devam ederse şirket ödülü hesabınıza yazar.`
    : 'Yeni müşteri iStoc’u belirlenen süre boyunca kullanırsa şirket ödülü hesabınıza yazar.';

  const kosulAdimi: AkisAdimi = odulVar
    ? {
        id: 'kosul', ad: 'Yazılı koşulu alın', sorumlu: 'Müşteri sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [
          `Her uygun tavsiye için ${sayi(a.krediAy)} ay ücretsiz kullanım alırsınız.`,
          `Şirket yılda en çok ${sayi(a.tavsiyeSinir)} tavsiyeyi ödüle çevirir.`,
          'Müşteri sorumlusu bu koşulu size yazılı gönderir.',
        ],
        dikkat: 'Ödül ücretsiz iStoc kullanımıdır. Nakit ödeme değildir. Ödülü fiyat avantajı gibi anlatmayın.',
        soru: 'Ödül koşulu elinize yazılı ulaştı mı?',
        secenekler: [
          devam('yazili', 'Yazılı koşul elimde', 'isletme'),
          sonlu('bekle', 'sozlu', 'Koşul yalnız çarşıda sözlü anlatıldı', 'Yazılı koşulu bekleyin',
            'Sözlü duyduğunuz koşulu esas almayın.', 'Müşteri sorumlusundan yazılı koşulu isteyin.', 'Yazı gelince bu adımı yeniden açın.'),
          sonlu('bekle', 'surum', 'Bana farklı bir sürüm koşulu bildirildi', 'Geçerli sürümü netleştirin',
            'Bu rehber birinci sürüm koşulunu izler.', 'Müşteri sorumlusu geçerli sürümü yazılı açıklar.', 'Açıklama gelince bu adımı yeniden açın.'),
        ],
      }
    : {
        id: 'kosul', ad: 'Yazılı koşulu alın', sorumlu: 'Müşteri sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [
          'Şu anki koşullarda şirket tavsiye edene ödül vermez.',
          'Müşteri sorumlusu bu durumu size yazılı bildirir.',
        ],
        soru: 'Ödül olmadan tanıştırma yapmak ister misiniz?',
        secenekler: [
          devam('odulsuz', 'Ödülsüz tanıştırma yapacağım', 'isletme'),
          sonlu('bitir', 'vazgec', 'Ödül olmadan tanıştırma yapmayacağım', 'Tavsiye yapılmadı',
            'Ödül koşulu olmadığı için tanıştırma yapmadınız.', 'Mevcut hizmetiniz bundan etkilenmez.'),
        ],
      };

  const adimlar: AkisAdimi[] = [
    {
      id: 'deneyim', ad: 'Deneyiminizi değerlendirin', sorumlu: 'Siz', ek: 'sinir',
      yap: [
        'Ürünlerinizi iStoc ile nasıl sunduğunuzu düşünün.',
        'Yalnız yaşadığınız deneyimi anlatmaya hazırlanın.',
        'Alıcı veya sipariş artışı vaat etmeyin.',
      ],
      soru: 'iStoc ile ürünlerinizi düzenli sunabiliyor musunuz?',
      secenekler: [
        devam('duzenli', 'Ürünlerimi düzenli sunuyorum', 'kosul'),
        sonlu('bekle', 'sorun', 'Katalogda çözülmemiş sorunum var', 'Önce sorununuzu çözün',
          'Müşteri sorumlusuna sorununuzu bildirin.', 'Sorun çözülünce bu adıma dönün.'),
        sonlu('bitir', 'istemiyor', 'Tavsiye yapmak istemiyorum', 'Tavsiye yapılmadı',
          'Tavsiye yapmak zorunlu değildir.', 'Mevcut hizmetiniz bundan etkilenmez.'),
      ],
    },
    kosulAdimi,
    {
      id: 'isletme', ad: 'Uygun işletmeyi seçin', sorumlu: 'Siz', ek: 'kitle',
      yap: [
        'Komşu dükkâna ürünlerini nasıl sunduğunu sorun.',
        'Ödül alabileceğinizi açıkça söyleyin.',
        'Kendi alıcı listenizi ve fiyatlarınızı paylaşmayın.',
      ],
      soru: 'İşletme şirketle tanışmak istiyor mu?',
      secenekler: [
        devam('istiyor', 'İşletme tanışmak istiyor', 'basvuru'),
        sonlu('bekle', 'dusunuyor', 'İşletme düşünmek istiyor', 'İşletmenin kararını bekleyin',
          'Israr etmeyin.', 'İşletme kendisi dönerse bu adımı yeniden açın.'),
        sonlu('bitir', 'red', 'İşletme tanışmak istemiyor', 'Tanıştırma kapandı',
          'İşletmenin bilgisini kimseye vermeyin.', 'Konuyu yeniden açmayın.'),
      ],
    },
    {
      id: 'basvuru', ad: 'Başvuruyu kaydettirin', sorumlu: 'Siz ve müşteri sorumlusu (önerilen görev)', ek: 'sinir',
      yap: [
        'Şirketin başvuru yolunu işletmeye verin.',
        'İşletme başvuruda sizin dükkânınızın adını yazar.',
        'Müşteri sorumlusu tavsiyenin size bağlandığını yazılı bildirir.',
      ],
      soru: 'Tavsiyenin dükkânınıza bağlandığını bildiren yazı geldi mi?',
      secenekler: [
        devam('bagli', 'Bağlantı yazısı elime ulaştı', 'satis'),
        sonlu('bekle', 'yazi-yok', 'Henüz yazı gelmedi', 'Bağlantıyı bekleyin',
          'Müşteri sorumlusuna dükkân adını ve tarihi iletin.', 'Yazı gelince bu adımı yeniden açın.'),
        sonlu('bekle', 'cakisma', 'İşletme zaten kayıtlı veya başkası tavsiye etmiş', 'Uygunluk incelemesini bekleyin',
          'Müşteri sorumlusu kayıtların tarihini karşılaştırır.', 'Müşteri sorumlusu sonucu size yazılı açıklar.', 'İnceleme bitmeden şirket ödül sözü vermez.'),
      ],
    },
    {
      id: 'satis', ad: 'Satışı şirkete bırakın', sorumlu: 'Satış uzmanı (önerilen görev)',
      yap: [
        'Satış uzmanı işletmeye fiyat tablosundaki fiyatla teklif verir.',
        'Satış uzmanı ürün bilgisinin nasıl yükleneceğini anlatır.',
        'Siz işletme adına karar vermezsiniz.',
      ],
      dikkat: `Birinci sürümde ödül için yeni müşterinin yıllık paket alması gerekir. ${yillikPaket(a)}`,
      soru: 'İşletme hangi ödemeyi seçti?',
      secenekler: [
        devam('yillik', 'İşletme yıllık paket aldı', 'kullanim'),
        sonlu('bitir', 'aylik', 'İşletme aylık ödemeyi seçti', 'Ödül koşulu oluşmadı',
          'Birinci sürüm koşulu yıllık pakettir.', 'Müşteri sorumlusu durumu size yazılı açıklar.'),
        sonlu('bekle', 'gorusme', 'Görüşme hâlâ sürüyor', 'Satış kararını bekleyin',
          'Görüşmeyi satış uzmanı yürütür.', 'Karar çıkınca bu adımı yeniden açın.'),
        sonlu('bitir', 'vazgecti', 'İşletme almaktan vazgeçti', 'Tavsiye sonuçlanmadı',
          'Satış olmadığı için ödül koşulu oluşmadı.', 'İşletmeye yeniden baskı yapmayın.'),
      ],
    },
    {
      id: 'kullanim', ad: 'Kullanım süresini izleyin', sorumlu: 'Müşteri sorumlusu (önerilen görev)',
      yap: [
        kullanimKurali,
        'Müşteri sorumlusu sürenin başladığı tarihi size yazılı bildirir.',
      ],
      soru: 'Yeni müşterinin kullanım süresi ne durumda?',
      secenekler: [
        devam('doldu', 'Süre doldu, işletme kullanmaya devam ediyor', 'sinir'),
        sonlu('bekle', 'dolmadi', 'Süre henüz dolmadı', 'Süre dolana kadar bekleyin',
          'Müşteri sorumlusu bitiş tarihini size bildirir.', 'Bitiş tarihinde bu adımı yeniden açın.'),
        sonlu('bekle', 'birakti', 'İşletme süre dolmadan bıraktı', 'Finans incelemesini bekleyin',
          'Şirket bu durum için henüz kural koymadı.', 'Finans sorumlusu kararını size yazılı açıklar.'),
      ],
    },
    {
      id: 'sinir', ad: 'Yıllık sınırı kontrol edin', sorumlu: 'Müşteri sorumlusu (önerilen görev)',
      yap: [
        `Şirket yılda en çok ${sayi(a.tavsiyeSinir)} tavsiyeyi ödüle çevirir.`,
        'Müşteri sorumlusu bu yılki sayınızı size bildirir.',
      ],
      soru: 'Bu yıl ödül alan tavsiyeleriniz sınıra ulaştı mı?',
      secenekler: [
        devam('altinda', 'Sınır henüz dolmadı', 'odul'),
        sonlu('bitir', 'doldu', 'Bu yılki sınır doldu', 'Bu tavsiye ödüle çevrilmez',
          'Şirket yalnız sınır kadar tavsiyeyi ödüle çevirir.', 'Müşteri sorumlusu sonucu size yazılı açıklar.'),
        sonlu('bekle', 'bilmiyor', 'Sayımı bilmiyorum', 'Sayımı öğrenin',
          'Müşteri sorumlusundan bu yılki sayınızı isteyin.', 'Cevap gelince bu adımı yeniden açın.'),
      ],
    },
    {
      id: 'odul', ad: 'Ücretsiz kullanımı görün', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
      yap: odulVar
        ? [
            `Ödülünüz ${sayi(a.krediAy)} aylık iStoc kullanımıdır: ${avro(a.istocAyEur * a.krediAy)}. Bu örnekte kur ${sayi(a.kur)} ₺ olduğu için ${tl(kredi)} eder.`,
            `Yeni müşteri ${sayi(a.yeniKrediAy)} ay ücretsiz kullanım alır.`,
            'Finans sorumlusu ödülün yansıdığı faturayı size bildirir.',
          ]
        : [
            'Şu anki koşullarda şirket tavsiye edene ödül vermez.',
            `Yeni müşteri ${sayi(a.yeniKrediAy)} ay ücretsiz kullanım alır.`,
          ],
      dikkat: 'Finans sorumlusu bu ödülün vergi ve fatura işlemini henüz belirlemedi.',
      soru: 'Dükkân faturanızda ne görüyorsunuz?',
      secenekler: [
        sonlu('tamamla', 'gorunuyor', 'Ücretsiz süre faturamda görünüyor', 'Tavsiye işi bitti',
          'Bu tavsiye için rehberin işi tamamlandı.', 'Yeni tavsiye için rehberi baştan başlatın.'),
        sonlu('bekle', 'gorunmuyor', 'Ücretsiz süre faturamda görünmüyor', 'Fatura düzeltmesini bekleyin',
          'Müşteri sorumlusuna dükkân adını ve tarihi iletin.', 'Finans sorumlusu sonucu size yazılı bildirir.'),
        sonlu('bekle', 'vergi', 'Ödülün vergi sonucunu soruyorum', 'Vergi kararını bekleyin',
          'Finans sorumlusu bu konuda henüz karar vermedi.', 'Finans sorumlusu kararı mali müşavirle yazacak.', 'Karar gelince bu adımı yeniden açın.'),
      ],
    },
  ];

  return {
    baslik: 'iStoc tavsiyesi',
    ozet: 'Komşu işletmeyi şirketle tanıştırırsınız. Satışı ve desteği şirket yürütür.',
    hedef: odulVar
      ? 'Yeni müşteri koşulları sağlarsa ücretsiz iStoc kullanımı alırsınız.'
      : 'Şu anki koşullarda ödülsüz bir tanıştırma yaparsınız.',
    ilk: 'deneyim',
    adimlar,
  };
};
