import type { AkisAdimi, AkisOlustur, AkisSecenegi } from '../types';
import { aylikFiyat, rolMetinleri } from '../../satisOrtakligi';

const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
const tl = (n: number) => `${sayi(n)} TL`;

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const sonlu = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, ...aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

/** iStoc mevcut müşteri tavsiyesi. Bu projede yalnız ana program vardır. */
export const akisOlustur: AkisOlustur = (a) => {
  const kredi = aylikFiyat(a) * a.krediAy;
  const odulVar = a.krediAy > 0 && a.tavsiyeSinir > 0;
  const kural = rolMetinleri('istoc').find((r) => r.id === 'tavsiye')!.kurallar;
  const kullanimKurali = kural[1];

  const kosulAdimi: AkisAdimi = odulVar
    ? {
        id: 'kosul', ad: 'Yazılı koşulu alın', sorumlu: 'Müşteri sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [
          `Her uygun tavsiye için ${sayi(a.krediAy)} ay ücretsiz kullanım alırsınız.`,
          `Yılda en çok ${sayi(a.tavsiyeSinir)} tavsiye ödüle çevrilir.`,
          'Müşteri sorumlusu bu koşulu size yazılı göndersin.',
        ],
        dikkat: 'Ödül ücretsiz iStoc kullanımıdır. Nakit ödeme değildir.',
        soru: 'Ödül koşulu elinize yazılı ulaştı mı?',
        secenekler: [
          devam('yazili', 'Yazılı koşul elimde', 'isletme'),
          sonlu('bekle', 'sozlu', 'Koşul yalnız çarşıda sözlü anlatıldı', 'Yazılı koşulu bekleyin',
            'Sözlü duyulan koşul esas alınmaz.', 'Müşteri sorumlusundan yazılı koşulu isteyin.', 'Yazı gelince bu adımı yeniden açın.'),
          sonlu('bekle', 'surum', 'Bana farklı bir sürüm koşulu bildirildi', 'Geçerli sürümü netleştirin',
            'Bu rehber birinci sürüm koşulunu izler.', 'Müşteri sorumlusu geçerli sürümü yazılı açıklasın.', 'Açıklama gelince adımı yeniden değerlendirin.'),
        ],
      }
    : {
        id: 'kosul', ad: 'Yazılı koşulu alın', sorumlu: 'Müşteri sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [
          'Seçili ayarlarda tavsiye eden için ödül yoktur.',
          'Müşteri sorumlusu bu durumu size yazılı bildirsin.',
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
      id: 'deneyim', ad: 'Deneyiminizi değerlendirin', sorumlu: 'Siz (mevcut müşteri)', ek: 'sinir',
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
      id: 'isletme', ad: 'Uygun işletmeyi seçin', sorumlu: 'Siz (mevcut müşteri)', ek: 'kitle',
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
          'İşletmenin bilgisini kimseye iletmeyin.', 'Konuyu yeniden açmayın.'),
      ],
    },
    {
      id: 'basvuru', ad: 'Başvuruyu kaydettirin', sorumlu: 'İşletme ve müşteri sorumlusu', ek: 'sinir',
      yap: [
        'Şirketin onaylı başvuru yolunu işletmeye verin.',
        'İşletme başvuruda sizin dükkânınızı yazsın.',
        'Müşteri sorumlusu bağlantıyı size yazılı bildirsin.',
      ],
      soru: 'Tavsiyenin dükkânınıza bağlandığını bildiren yazı geldi mi?',
      secenekler: [
        devam('bagli', 'Bağlantı yazısı elime ulaştı', 'satis'),
        sonlu('bekle', 'yazi-yok', 'Henüz yazı gelmedi', 'Bağlantıyı bekleyin',
          'Müşteri sorumlusuna dükkân adını ve tarihi iletin.', 'Yazı gelince bu adımı yeniden açın.'),
        sonlu('bekle', 'cakisma', 'İşletme zaten kayıtlı veya başkası tavsiye etmiş', 'Uygunluk incelemesini bekleyin',
          'Müşteri sorumlusu kayıtların tarihini karşılaştırsın.', 'Sonucu size yazılı açıklasın.', 'İnceleme bitmeden ödül sözü verilmez.'),
      ],
    },
    {
      id: 'satis', ad: 'Satışı şirkete bırakın', sorumlu: 'Satış uzmanı (önerilen görev)',
      yap: [
        'Satış uzmanı işletmeye teklif verir.',
        'Ürün bilgisinin nasıl yükleneceğini satış uzmanı anlatır.',
        'Siz işletme adına karar vermezsiniz.',
      ],
      dikkat: 'Birinci sürümde yeni müşterinin yıllık paket alması gerekir.',
      soru: 'İşletme hangi ödemeyi seçti?',
      secenekler: [
        devam('yillik', 'İşletme yıllık paket aldı', 'kullanim'),
        sonlu('bitir', 'aylik', 'İşletme aylık ödemeyi seçti', 'Ödül koşulu oluşmadı',
          'Birinci sürüm koşulu yıllık pakettir.', 'Müşteri sorumlusu durumu size yazılı açıklasın.'),
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
        'Sürenin başladığı tarihi müşteri sorumlusu yazılı bildirsin.',
      ],
      soru: 'Yeni müşterinin kullanım süresi ne durumda?',
      secenekler: [
        devam('doldu', 'Süre doldu, işletme kullanmaya devam ediyor', 'sinir'),
        sonlu('bekle', 'dolmadi', 'Süre henüz dolmadı', 'Süre dolana kadar bekleyin',
          'Müşteri sorumlusu bitiş tarihini size bildirsin.', 'Bitiş tarihinde bu adımı yeniden açın.'),
        sonlu('bekle', 'birakti', 'İşletme süre dolmadan bıraktı', 'Finans incelemesini bekleyin',
          'Kaynakta bu durum için kural yoktur.', 'Finans sorumlusu kararını size yazılı açıklasın.'),
      ],
    },
    {
      id: 'sinir', ad: 'Yıllık sınırı kontrol edin', sorumlu: 'Müşteri sorumlusu (önerilen görev)',
      yap: [
        `Yılda en çok ${sayi(a.tavsiyeSinir)} tavsiye ödüle çevrilir.`,
        'Müşteri sorumlusu bu yılki sayınızı size bildirsin.',
      ],
      soru: 'Bu yıl ödül alan tavsiyeleriniz sınıra ulaştı mı?',
      secenekler: [
        devam('altinda', 'Sınır henüz dolmadı', 'odul'),
        sonlu('bitir', 'doldu', 'Bu yılki sınır doldu', 'Bu tavsiye ödüle çevrilmez',
          'Hesaplayıcı yalnız sınır kadar tavsiyeyi ödüle çevirir.', 'Müşteri sorumlusu sonucu size yazılı açıklasın.'),
        sonlu('bekle', 'bilmiyor', 'Sayımı bilmiyorum', 'Sayımı öğrenin',
          'Müşteri sorumlusundan bu yılki sayınızı isteyin.', 'Cevap gelince bu adımı yeniden açın.'),
      ],
    },
    {
      id: 'odul', ad: 'Ücretsiz kullanımı görün', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
      yap: odulVar
        ? [
            `Örnek ayarda ödülünüzün karşılığı ${tl(kredi)} kullanımdır.`,
            `Yeni müşteri ${sayi(a.yeniKrediAy)} ay ücretsiz kullanım alır.`,
            'Finans sorumlusu ödülün yansıdığı faturayı bildirsin.',
          ]
        : [
            'Seçili ayarlarda tavsiye eden için ödül yoktur.',
            `Yeni müşteri ${sayi(a.yeniKrediAy)} ay ücretsiz kullanım alır.`,
          ],
      dikkat: 'Ücretsiz kullanımın vergi ve fatura işlemi henüz karar verilmemiş konudur.',
      soru: 'Dükkân faturanızda ne görüyorsunuz?',
      secenekler: [
        sonlu('tamamla', 'gorunuyor', 'Ücretsiz süre faturamda görünüyor', 'Tavsiye işi bitti',
          'Bu tavsiye için rehberin işi tamamlandı.', 'Yeni tavsiye için rehberi baştan başlatın.'),
        sonlu('bekle', 'gorunmuyor', 'Ücretsiz süre faturamda görünmüyor', 'Fatura düzeltmesini bekleyin',
          'Müşteri sorumlusuna dükkân adını ve tarihi iletin.', 'Finans sorumlusu sonucu size yazılı bildirsin.'),
        sonlu('bekle', 'vergi', 'Ödülün vergi sonucunu soruyorum', 'Vergi kararını bekleyin',
          'Bu konu henüz karara bağlanmadı.', 'Finans sorumlusu mali müşavirle kararı yazsın.', 'Karar gelince bu adımı yeniden açın.'),
      ],
    },
  ];

  return {
    baslik: 'iStoc tavsiyesi',
    ozet: 'Komşu işletmeyi şirketle tanıştırırsınız. Satışı ve desteği şirket yürütür.',
    hedef: odulVar
      ? 'Yeni müşteri koşulları sağlarsa ücretsiz iStoc kullanımı alırsınız.'
      : 'Seçili ayarlarda ödülsüz bir tanıştırma yaparsınız.',
    ilk: 'deneyim',
    adimlar,
  };
};
