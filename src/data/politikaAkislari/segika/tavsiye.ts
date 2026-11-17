import { belgeAdimlariniCikar } from '../motor';
import type { AkisAdimi, AkisOlustur, AkisSecenegi } from '../types';
import { aylikFiyat, rolMetinleri } from '../../satisOrtakligi';
import { KOSULLAR, affilateHesabi } from '../../kosullar';
import { num } from '../../../lib/format';

const sayi = num;
const tl = (n: number) => `${sayi(n)} ₺`;
const yuzde = (n: number) => `%${sayi(n * 100)}`;

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const sonlu = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, ...aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

/** Segika mevcut müşteri tavsiyesi. Ana program ücretsiz kullanım, ayrı program tek seferlik komisyon verir. */
const akisOlusturTam: AkisOlustur = (a) => {
  const secili = a.kosul?.tavsiye;
  const program = KOSULLAR.tavsiye.some((k) => k.id === secili && k.marka.includes('segika')) ? secili! : 'ana';
  const komisyonYolu = program === 'tek-sefer';
  const kural = rolMetinleri('segika').find((r) => r.id === 'tavsiye')!.kurallar;

  const deneyim: AkisAdimi = {
    id: 'deneyim', ad: 'Deneyimi ve yetkiyi kontrol edin', sorumlu: 'Siz ve firmanızın yetkilisi', ek: 'sinir',
    terimler: ['Teşvik, devletin firmalara verdiği destektir.', 'Bordro, çalışanların maaş listesidir.', 'Yetkili, firmanız adına karar veren kişidir.'],
    yap: [
      'Firmanızın teşvik ve bordro deneyimini değerlendirin.',
      'Firmanızın yetkilisinden tavsiye için onay alın.',
      'Teşvik tutarı veya bordro sonucu vaat etmeyin.',
    ],
    soru: 'Firmanızın durumu hangisine uyuyor?',
    secenekler: [
      devam('hazir', 'Hizmetten sonuç aldık ve yetkili onay verdi', komisyonYolu ? 'secim' : 'kosul'),
      sonlu('bekle', 'onay-yok', 'Yetkili henüz onay vermedi', 'Firma onayını bekleyin',
        'Ödül firmanızın hesabını ilgilendirir.', 'Yetkili onay verince bu adımı yeniden açın.'),
      sonlu('bekle', 'sorun', 'Teşvik ya da bordroda sorunumuz hâlâ var', 'Önce sorunu çözün',
        'Müşteri sorumlusuna sorunu bildirin.', 'Sorun çözülünce bu adıma dönün.'),
      sonlu('bitir', 'istemiyor', 'Tavsiye yapmak istemiyoruz', 'Tavsiye yapılmadı',
        'Tavsiye yapmak zorunlu değildir.', 'Mevcut hizmetiniz bundan etkilenmez.'),
    ],
  };

  const firma: AkisAdimi = {
    id: 'firma', ad: 'Uygun firmayı seçin', sorumlu: 'Siz', ek: 'kitle',
    terimler: ['Teşvik, devletin firmalara verdiği destektir.'],
    yap: [
      'İnsan kaynakları veya muhasebe yöneticisiyle izinli konuşun.',
      'Ödül alabileceğinizi açıkça söyleyin.',
      'Çalışan verisini veya teşvik tutarınızı göstermeyin.',
    ],
    soru: 'Firma şirketle tanışmak istiyor mu?',
    secenekler: [
      devam('istiyor', 'Firma tanışmak istediğini söyledi', 'basvuru'),
      sonlu('bekle', 'tesvik-soru', 'Firma ne kadar teşvik alacağını sordu', 'Soruyu satış uzmanına bırakın',
        'Teşvik tahmini vermeyin.', 'Satış uzmanı bu konuyu firmayla kendisi konuşur.', 'Firma tanışmak isterse bu adımı yeniden açın.'),
      sonlu('bekle', 'dusunuyor', 'Firma düşünmek istediğini söyledi', 'Firmanın kararını bekleyin',
        'Israr etmeyin.', 'Firma kendisi dönerse bu adımı yeniden açın.'),
      sonlu('bitir', 'red', 'Firma tanışmak istemediğini söyledi', 'Tanıştırma kapandı',
        'Firmanın bilgisini kimseye iletmeyin.', 'Konuyu yeniden açmayın.'),
    ],
  };

  const basvuru: AkisAdimi = {
    id: 'basvuru', ad: 'Başvuruyu kaydettirin', sorumlu: 'Karşı firma ve müşteri sorumlusu (önerilen görev)', ek: 'sinir',
    terimler: ['Bordro, çalışanların maaş listesidir.', 'Grup şirketi, aynı sahibe bağlı başka bir şirkettir.'],
    yap: [
      'Karşı firmanın yetkili yöneticisi başvuruyu yapar.',
      'Karşı firma başvuruya çalışan listesi veya bordro dosyası eklemez.',
      'Müşteri sorumlusu tavsiyenin firmanıza bağlandığını yazılı bildirir.',
    ],
    soru: 'Tavsiyenin firmanız adına kaydedildiğini bildiren yazı geldi mi?',
    secenekler: [
      devam('bagli', 'Bu yazı bize geldi', 'satis'),
      sonlu('bekle', 'yazi-yok', 'Henüz yazı gelmedi', 'Bağlantıyı bekleyin',
        'Müşteri sorumlusuna firma adını ve tarihi iletin.', 'Yazı gelince bu adımı yeniden açın.'),
      sonlu('bekle', 'cakisma', 'Firma kayıtlı, grup şirketi ya da başkası tavsiye etmiş', 'Şirketin kontrolünü bekleyin',
        'Müşteri sorumlusu kayıtları karşılaştırır.', 'Müşteri sorumlusu sonucu size yazılı açıklar.', 'İnceleme bitmeden kimse ödül sözü vermez.'),
      sonlu('bekle', 'dosya', 'Firma bize bordro dosyası gönderdi', 'Dosyayı iletmeyin',
        'Dosyayı başkasına göndermeyin.', 'Firmadan şirkete doğrudan göndermesini isteyin.', 'Dosyayı kendi firmanızın veri kuralına göre silin.'),
    ],
  };

  if (!komisyonYolu) {
    const kredi = aylikFiyat(a) * a.krediAy;
    const odulVar = a.krediAy > 0 && a.tavsiyeSinir > 0;
    const adimlar: AkisAdimi[] = [
      deneyim,
      odulVar
        ? {
            id: 'kosul', ad: 'Yazılı koşulu alın', sorumlu: 'Müşteri sorumlusu (önerilen görev)', ek: 'kazanc',
            terimler: ['Sürüm, koşulların belli bir dönemdeki hâlidir.'],
            yap: [
              `Her uygun tavsiye için ${sayi(a.krediAy)} ay ücretsiz kullanım alırsınız.`,
              `Şirket yılda en çok ${sayi(a.tavsiyeSinir)} tavsiyeyi ödüle çevirir.`,
              'Müşteri sorumlusu ödülün işleneceği hesabı yazılı bildirir.',
            ],
            dikkat: 'Ödül nakit değil, ücretsiz kullanımdır. Bu ödülü karşı firmaya fiyat avantajı gibi anlatmayın.',
            soru: 'Ödül koşulu firmanıza yazılı olarak geldi mi?',
            secenekler: [
              devam('yazili', 'Koşulu yazılı olarak aldık', 'firma'),
              sonlu('bekle', 'sozlu', 'Koşulu yalnız sözle duyduk', 'Yazılı koşulu bekleyin',
                'Şirket sözlü anlatılan koşulu esas almaz.', 'Müşteri sorumlusundan yazılı koşulu isteyin.', 'Yazı gelince bu adımı yeniden açın.'),
              sonlu('bekle', 'surum', 'Bize başka bir sürümün koşulu söylendi', 'Geçerli sürümü öğrenin',
                'Bu rehber birinci sürüm koşulunu izler.', 'Müşteri sorumlusu geçerli sürümü yazılı açıklar.', 'Açıklama gelince bu adımı yeniden açın.'),
            ],
          }
        : {
            id: 'kosul', ad: 'Yazılı koşulu alın', sorumlu: 'Müşteri sorumlusu (önerilen görev)', ek: 'kazanc',
            yap: ['Şu anki koşullarda tavsiye eden firmaya ödül yoktur.', 'Müşteri sorumlusu bu durumu yazılı bildirir.'],
            soru: 'Ödül olmadan tanıştırma yapmak istiyor musunuz?',
            secenekler: [
              devam('odulsuz', 'Ödülsüz tanıştırma yapacağız', 'firma'),
              sonlu('bitir', 'vazgec', 'Ödül olmadan tanıştırma yapmayacağız', 'Tavsiye yapılmadı',
                'Ödül koşulu olmadığı için tanıştırma yapmadınız.', 'Mevcut hizmetiniz bundan etkilenmez.'),
            ],
          },
      firma,
      basvuru,
      {
        id: 'satis', ad: 'Satışı şirkete bırakın', sorumlu: 'Satış uzmanı (önerilen görev)',
        terimler: ['Yıllık paket, bir yıllık kullanım için alınan pakettir.'],
        yap: [
          'Satış uzmanı firmanın çalışan sayısına göre teklif verir.',
          `Şirket fiyatı, çalışan sayısını ${sayi(a.blok)} kişilik gruplara yukarı yuvarlayarak hesaplar.`,
          'Fiyat herkes için aynıdır.',
        ],
        dikkat: 'Birinci sürümde yeni müşterinin yıllık paket alması gerekir.',
        soru: 'Firma hangi ödeme şeklini seçti?',
        secenekler: [
          devam('yillik', 'Firmanın yıllık paket aldığını öğrendik', 'kullanim'),
          sonlu('bitir', 'aylik', 'Firmanın aylık ödemeyi seçtiğini öğrendik', 'Ödül koşulu oluşmadı',
            'Birinci sürüm koşulu yıllık pakettir.', 'Müşteri sorumlusu durumu size yazılı açıklar.'),
          sonlu('bekle', 'gorusme', 'Görüşme hâlâ sürüyor', 'Satış kararını bekleyin',
            'Görüşmeyi satış uzmanı yürütür.', 'Karar çıkınca bu adımı yeniden açın.'),
          sonlu('bitir', 'vazgecti', 'Firmanın almaktan vazgeçtiğini öğrendik', 'Tavsiye sonuçlanmadı',
            'Satış olmadığı için ödül koşulu oluşmadı.', 'Firmaya yeniden baskı yapmayın.'),
        ],
      },
      {
        id: 'kullanim', ad: 'Kullanım süresini izleyin', sorumlu: 'Müşteri sorumlusu (önerilen görev)',
        yap: [kural[1], 'Şirket bu sürenin başlangıcını henüz belirlemedi.', 'Müşteri sorumlusu başlangıcı kurulum veya ilk bordro olarak yazar.'],
        soru: 'Yeni firmanın kullanım süresi ne durumda?',
        secenekler: [
          devam('doldu', 'Süre doldu ve firma hâlâ kullanıyor', 'sinir'),
          sonlu('bekle', 'baslangic', 'Sürenin başlangıç tarihi bize yazılmadı', 'Başlangıç tarihini öğrenin',
            'Müşteri sorumlusu başlangıç olayını yazılı tanımlar.', 'Başlangıç tarihi yazılınca bu adımı yeniden açın.'),
          sonlu('bekle', 'dolmadi', 'Süre henüz dolmadı', 'Süre dolana kadar bekleyin',
            'Süre bitince bu adımı yeniden açın.'),
          sonlu('bekle', 'birakti', 'Firma süre dolmadan kullanmayı bıraktı', 'Finans sorumlusunun kararını bekleyin',
            'Şirket bu durum için henüz kural koymadı.', 'Finans sorumlusu kararını size yazılı açıklar.'),
        ],
      },
      {
        id: 'sinir', ad: 'Yıllık sınırı kontrol edin', sorumlu: 'Müşteri sorumlusu (önerilen görev)',
        yap: [`Şirket yılda en çok ${sayi(a.tavsiyeSinir)} tavsiyeyi ödüle çevirir.`, 'Müşteri sorumlusu bu yılki sayınızı bildirir.'],
        soru: 'Bu yıl ödül alan tavsiye sayınız sınıra ulaştı mı?',
        secenekler: [
          devam('altinda', 'Sınır henüz dolmadı', 'odul'),
          sonlu('bitir', 'doldu', 'Bu yılki sınır doldu', 'Bu tavsiye ödüle çevrilmez',
            'Şirket sınırı aşan tavsiyeyi ödüle çevirmez.', 'Müşteri sorumlusu sonucu yazılı açıklar.'),
          sonlu('bekle', 'bilmiyor', 'Bu yılki sayımızı bilmiyoruz', 'Sayımı öğrenin',
            'Müşteri sorumlusundan bu yılki sayıyı isteyin.', 'Cevap gelince bu adımı yeniden açın.'),
        ],
      },
      {
        id: 'odul', ad: 'Ücretsiz kullanımı görün', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: odulVar
          ? [
              `Bu örnekte ödülün değeri ${tl(kredi)} kullanımdır.`,
              `Şirket yeni müşteriye ${sayi(a.yeniKrediAy)} ay ücretsiz kullanım verir. Bunu yeni müşteriye şirket bildirir.`,
              'Siz faturanızı muhasebe biriminizle kontrol edin.',
            ]
          : ['Şu anki koşullarda tavsiye eden firmaya ödül yoktur.', `Şirket yeni müşteriye ${sayi(a.yeniKrediAy)} ay ücretsiz kullanım verir.`],
        dikkat: 'Finans sorumlusu bu ödülün faturasını henüz belirlemedi.',
        soru: 'Firmanızın faturasında ne görüyorsunuz?',
        secenekler: [
          sonlu('tamamla', 'gorunuyor', 'Ücretsiz süre faturamızda görünüyor', 'Tavsiye işi bitti',
            'Bu tavsiye için rehberin işi tamamlandı.', 'Yeni tavsiye için rehberi baştan başlatın.'),
          sonlu('bekle', 'gorunmuyor', 'Ücretsiz süre faturamızda görünmüyor', 'Fatura düzeltmesini bekleyin',
            'Muhasebe biriminiz durumu müşteri sorumlusuna yazsın.', 'Finans sorumlusu sonucu yazılı bildirir.'),
          sonlu('bekle', 'vergi', 'Ödülün vergi durumunu soruyoruz', 'Vergi kararını bekleyin',
            'Şirket bu konuda henüz karar vermedi.', 'Finans sorumlusu kararı mali müşavirle yazar.', 'Karar gelince bu adımı yeniden açın.'),
        ],
      },
    ];
    return {
      baslik: 'Segika tavsiyesi',
      ozet: 'Başka bir firmayı şirketle tanıştırırsınız. Satışı ve desteği şirket yürütür.',
      hedef: odulVar
        ? 'Yeni firma koşulları sağlarsa firmanız ücretsiz Segika kullanımı alır.'
        : 'Şu anki koşullarda ödülsüz bir tanıştırma yaparsınız.',
      ilk: 'deneyim',
      adimlar,
    };
  }

  /* Tek seferlik komisyon: tutar ve ödeme zamanı Affilate motorundan okunur. */
  const r = affilateHesabi(a, 'ayse');
  const ozet = r.ortaklar.find((o) => o.ortak === 'ayse');
  const komisyon = (ozet?.planlanan ?? 0) / 100;
  const faturaAylari = r.aylar.filter((x) => x.fatura > 0).map((x) => x.ay);
  const odemeAylari = r.aylar.filter((x) => x.odeme > 0).map((x) => x.ay);
  const ayniAy = faturaAylari.length > 0 && odemeAylari[0] === faturaAylari[0];
  const komisyonVar = a.tekSeferOran > 0 && komisyon > 0;
  const tabanMetni = a.affOdeme === 'paket'
    ? 'Bu örnekte ilk fatura yıllık paket faturasıdır.'
    : 'Bu örnekte ilk fatura bir aylık faturadır.';
  const zamanMetni = odemeAylari.length === 0
    ? 'Bu örnekte hesap süresi içinde ödeme yok.'
    : odemeAylari.length === 1
      ? (ayniAy ? 'Şirket komisyonu tahsilat ayında tek seferde öder.' : 'Şirket komisyonu hizmet ayından sonra tek seferde öder.')
      : `Şirket komisyonu ${sayi(odemeAylari.length)} aya bölerek öder.`;

  const adimlar: AkisAdimi[] = [
    deneyim,
    komisyonVar
      ? {
          id: 'secim', ad: 'Komisyon seçeneğini yazılı seçin', sorumlu: 'Müşteri sorumlusu (önerilen görev)', ek: 'anlasma',
          terimler: ['Komisyon, satıştan size ödenen paydır.'],
          yap: [
            `Ödül, ilk faturanın ${yuzde(a.tekSeferOran)} kadarı nakit komisyondur.`,
            'Bu seçenek ücretsiz kullanımla birleşmez.',
            `Şirket yılda en çok ${sayi(a.tavsiyeSinir)} tavsiyeye komisyon öder.`,
          ],
          dikkat: 'Bu seçenek isteğe bağlıdır. Müşteri sorumlusu seçiminizi yazılı kaydeder.',
          soru: 'Firmanız hangi ödülü yazılı seçti?',
          secenekler: [
            devam('komisyon', 'Komisyonu yazılı olarak seçtik', 'firma'),
            sonlu('bitir', 'kullanim', 'Ücretsiz kullanımı istiyoruz', 'Bu yol kapandı',
              'Bu rehber komisyon seçeneğini izler.', 'Ücretsiz kullanım için ana programı müşteri sorumlusuyla konuşun.'),
            sonlu('bekle', 'yazisiz', 'Seçimimiz henüz yazılı değil', 'Yazılı seçimi bekleyin',
              'Müşteri sorumlusu seçimi yazılı kaydeder.', 'Kayıt gelince bu adımı yeniden açın.'),
          ],
        }
      : {
          id: 'secim', ad: 'Komisyon seçeneğini yazılı seçin', sorumlu: 'Müşteri sorumlusu (önerilen görev)', ek: 'anlasma',
          terimler: ['Komisyon, satıştan size ödenen paydır.'],
          yap: [ 'Şu anki koşullarda komisyon tutarı oluşmuyor.', 'Müşteri sorumlusu geçerli oranı yazılı bildirir.'],
          soru: 'Komisyon oranı size yazılı olarak geldi mi?',
          secenekler: [
            sonlu('bekle', 'oran-yok', 'Oran bize henüz bildirilmedi', 'Oranı bekleyin',
              'Oran olmadan komisyon hesaplanmaz.', 'Müşteri sorumlusu oranı yazılı bildirir.', 'Oran yazılınca bu adımı yeniden açın.'),
            sonlu('bitir', 'vazgec', 'Komisyonsuz tanıştırma yapmayacağız', 'Bu yol kapandı',
              'Komisyon oluşmadığı için tanıştırma yapmadınız.', 'Mevcut hizmetiniz bundan etkilenmez.'),
          ],
        },
    firma,
    basvuru,
    {
      id: 'satis', ad: 'İlk faturayı izleyin', sorumlu: 'Satış uzmanı (önerilen görev)',
      yap: ['Satış uzmanı firmaya tablo fiyatıyla teklif verir.', tabanMetni, 'Şirket komisyonu yalnız ilk fatura için hesaplar.'],
      soru: 'Yeni firmaya ilk fatura kesildi mi?',
      secenekler: [
        devam('kesildi', 'İlk faturanın kesildiğini öğrendik', 'tahsilat'),
        sonlu('bekle', 'gorusme', 'Görüşme hâlâ sürüyor', 'Satış kararını bekleyin',
          'Görüşmeyi satış uzmanı yürütür.', 'Karar çıkınca bu adımı yeniden açın.'),
        sonlu('bitir', 'vazgecti', 'Firmanın almaktan vazgeçtiğini öğrendik', 'Tavsiye sonuçlanmadı',
          'Satış olmadığı için komisyon doğmadı.', 'Firmaya yeniden baskı yapmayın.'),
      ],
    },
    {
      id: 'tahsilat', ad: 'Tahsilatı izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)',
      yap: ['Komisyon, yeni firma ilk faturayı ödeyince doğar.', 'Finans sorumlusu tahsilat durumunu size bildirir.'],
      soru: 'Yeni firma ilk faturayı ödedi mi?',
      secenekler: [
        devam('odedi', 'Firmanın ödediğini öğrendik', 'odeme'),
        sonlu('bekle', 'bekliyor', 'Ödeme henüz yapılmadı', 'Ödemeyi bekleyin',
          'Finans sorumlusu ödeme olunca size bildirir.', 'Bildirim gelince bu adımı yeniden açın.'),
        sonlu('bitir', 'odemeyecek', 'Firma ödemeyeceğini söyledi', 'Komisyon doğmadı',
          'Yeni firma ödemezse komisyon doğmaz.', 'Finans sorumlusu sonucu yazılı açıklar.'),
      ],
    },
    {
      id: 'odeme', ad: 'Komisyon ödemesini izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
      terimler: ['Komisyon, satıştan size ödenen paydır.'],
      yap: [ `Bu örnekte komisyonunuz ${tl(komisyon)} olur.`, zamanMetni, 'Finans sorumlusu ödeme belgesini ve vergi işlemini henüz belirlemedi.'],
      dikkat: 'Ödeme zamanını yazılı tavsiye koşulu belirler.',
      soru: 'Komisyon ödemesi size geldi mi?',
      secenekler: [
        devam('geldi', 'Ödeme hesabımıza geçti', 'iade'),
        sonlu('bekle', 'plan-yok', 'Ödeme planı bize söylenmedi', 'Ödeme planını bekleyin',
          'Finans sorumlusu ödeme tarihini yazılı bildirir.', 'Ödeme tarihi gelince bu adımı yeniden açın.'),
        sonlu('bekle', 'belge', 'Bizden ödeme belgesi istendi', 'Belge kararını bekleyin',
          'Şirket belge ve vergi işlemine henüz karar vermedi.', 'Finans sorumlusu kararı mali müşavirle yazar.', 'Karar gelince bu adımı yeniden açın.'),
      ],
    },
    {
      id: 'iade', ad: 'İade durumunu bilin', sorumlu: 'Finans sorumlusu (önerilen görev)',
      terimler: ['İade, ödenen paranın geri verilmesidir.'],
      yap: [ 'Yeni firma iade alırsa şirket komisyonu geri alır.', 'Finans sorumlusu geri alma yöntemini yazılı açıklar.'],
      soru: 'Yeni firma parasını geri istedi mi?',
      secenekler: [
        sonlu('tamamla', 'iade-yok', 'Bildiğimiz bir iade isteği yok', 'Tavsiye işi bitti',
          'Bu tavsiye için rehberin işi tamamlandı.', 'Yeni tavsiye için rehberi baştan başlatın.'),
        sonlu('bekle', 'iade-var', 'Firmanın iade istediğini öğrendik', 'Finans incelemesini bekleyin',
          'Finans sorumlusu iadeyi yazılı tavsiye koşuluna göre inceler.', 'Finans sorumlusu sonucu size yazılı açıklar.'),
      ],
    },
  ];
  return {
    baslik: 'Segika tek seferlik tavsiye komisyonu',
    ozet: 'Başka bir firmayı tanıştırırsınız. Ödül ilk faturadan bir kez nakit komisyondur.',
    hedef: komisyonVar
      ? 'Yeni firma ilk faturayı öderse firmanız tek seferlik komisyon alır.'
      : 'Şu anki koşullarda komisyon oluşmuyor. Önce oranı müşteri sorumlusundan öğrenin.',
    ilk: 'deneyim',
    adimlar: komisyonVar ? adimlar : adimlar.slice(0, 2),
  };
};

/** Rehberde belge adımları sorulmaz (motor.ts → belgeAdimlariniCikar). */
export const akisOlustur: AkisOlustur = (a) => belgeAdimlariniCikar(akisOlusturTam(a));
