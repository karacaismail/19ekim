/**
 * Yeni kayıt iş akışları (kullanıcı kararları 2026-11-10): sayfa CRM masası sorumlusu içindir. Ana akış dört aşamadır.
 * Her aşamanın başlama koşulu, bitiş koşulları ve sonraki aşaması yazılıdır (kullanıcı kararı: “hangi aşama ne zaman
 * bitiyor, sonra hangisi başlıyor belli olsun”). Kayıt kartındaki durum, kaydın hangi aşamada olduğunu gösterir. Her
 * aşamada olabilen durumlar ayrı tutulur. Her durum için yalın, sıralı adımlar ve kayıt kartına yazılacak sonuç verilir. Yöneticiye yönelik açıklama, gerekçe ve öğretici metin
 * yazılmaz (kullanıcı kararı: “bana öğretme, CRM sorumlusuna öğret, uzun metin değil yalın adımlar”). Adımlar kısa ve
 * tam cümledir, noktalı virgül ve uzun çizgi kullanılmaz. Paket ücretleri Parametreler’den gelir.
 * Fiyat, fiyat tablosundaki fiyattır (`paketler(params)`). Kullanıcı kararları 2026-11-10: fiyat pazarlıkla değişmez,
 * “indirim söz konusu değil”, fiyat sorusu “söz vermeyin” ya da “birine sorun” diye ertelenmez. CRM sorumlusu fiyatı
 * tablodan söyler. Ücretsiz ay, ek süre, özel fiyat ve tablo dışı ödeme koşulu da önerilmez. Benzer fiyat durumlarının
 * her biri kendi akışıyla karşılanır (fiyat, indirim, ucretsiz-sure, rakip-ucuz, odeme-kosulu, soz-verilmis). Ürün bir
 * SaaS aboneliğidir. Hiçbir adım satıcıya satış ya da sipariş sözü vermez.
 */
import type { Params } from './params';
import { eur, paketler } from './gelirModelleri';

export const tl = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`;

/** Süreç bittiğinde kayıt kartında kalan durumlar. “Şimdi değil” kapanış değildir, bekleyen kayıttır. */
export const KAPANIS_DURUMLARI = ['Ücretli', 'Uygun değil', 'Ulaşılamadı', 'Alıcı'];
export const BEKLEME_NOTU = 'Şimdi değil diyen kayıt bekler. Hatırlatma tarihinde Aşama 4’e döner.';

/** Her durumda geçerli kurallar. */
export const HER_DURUMDA: string[] = [
  'Her temastan sonra kayıt kartını güncelleyin.',
  'Sonraki adım alanını tarihiyle doldurun. Bu alan boş kalmaz.',
  'Fiyat, fiyat tablosundaki fiyattır. İndirim yoktur ve pazarlık yapılmaz.',
  'Ücretsiz ay, ek süre, özel fiyat ya da tablo dışında bir ödeme koşulu önermeyin.',
  'Satıcıya satış ya da sipariş sözü vermeyin.',
  'Fiyat dışında bilmediğiniz bir konu olursa tahmin etmeyin. İsmail Karaca’ya sorun.',
  'İzin olmayan kanaldan aramayın ve yazmayın.',
  'Uygun arama saati: 10.00 ile 12.00 ve 14.00 ile 17.00 arası. Satıcı başka bir saat söylediyse onu kullanın.',
];

/** Ana akışın aşaması (1–4) ya da her aşamada olabilen durum. */
export type AsamaNo = 1 | 2 | 3 | 4;
export type Yer = AsamaNo | 'her-an';

export interface Cikis {
  /** Aşamayı bitiren koşul. */
  kosul: string;
  /** Kayıt kartına yazılacak durum. */
  kart: string;
  /** Sonra ne olur. */
  sonra: string;
  /** Sonraki aşama (varsa). */
  git?: AsamaNo;
  /** Sonra uygulanacak durum akışı (varsa). */
  durum?: string;
  /** Kayıt kapanmaz, bekler (Şimdi değil). */
  bekler?: true;
}

export interface Asama {
  no: AsamaNo;
  ad: string;
  gun: string;
  /** Bu aşamadayken kayıt kartındaki durum. */
  kartDurumu: string;
  baslar: string;
  cikislar: Cikis[];
}

export const ASAMALAR: Asama[] = [
  {
    no: 1,
    ad: 'İlk temas',
    gun: 'Gün 0 ile Gün 5 arası',
    kartDurumu: 'Yeni',
    baslar: 'Yeni bir kayıt geldiğinde başlar.',
    cikislar: [
      { kosul: 'Kurulum görüşmesi için gün ve saat alındı.', kart: 'Ulaşıldı', sonra: 'Aşama 2 başlar.', git: 2 },
      { kosul: 'Üç arama ve bir e-postaya cevap gelmedi.', kart: 'Ulaşılamadı', sonra: 'Kayıt kapanır.' },
      { kosul: 'Kayıt alıcı çıktı.', kart: 'Alıcı', sonra: 'Bu akışı uygulayın:', durum: 'alici' },
    ],
  },
  {
    no: 2,
    ad: 'Kurulum',
    gun: 'Gün 1 ile Gün 3 arası',
    kartDurumu: 'Ulaşıldı, kurulum görüşmesi başlayınca Kurulumda',
    baslar: 'Kurulum görüşmesi için gün ve saat alındığında başlar.',
    cikislar: [
      { kosul: 'Profil tamam ve en az 10 ürün yayında.', kart: 'Etkin', sonra: 'Aşama 3 başlar.', git: 3 },
      { kosul: 'Satıcı vazgeçti.', kart: 'Uygun değil', sonra: 'Kayıt kapanır.' },
    ],
  },
  {
    no: 3,
    ad: 'Takip',
    gun: 'Gün 3 ile Gün 12 arası',
    kartDurumu: 'Etkin',
    baslar: 'Profil tamam ve en az 10 ürün yayında olduğunda başlar.',
    cikislar: [
      { kosul: 'Karar görüşmesi için gün ve saat alındı.', kart: 'Karar bekliyor', sonra: 'Aşama 4 başlar.', git: 4 },
      { kosul: 'Satıcının ilgisi kalmadı.', kart: 'Uygun değil', sonra: 'Kayıt kapanır.' },
    ],
  },
  {
    no: 4,
    ad: 'Karar',
    gun: 'Gün 12 ile Gün 14 arası',
    kartDurumu: 'Karar bekliyor',
    baslar: 'Karar görüşmesi için gün ve saat alındığında başlar.',
    cikislar: [
      { kosul: 'Ödeme geldi.', kart: 'Ücretli', sonra: 'Süreç biter. Ayda bir arayın.' },
      { kosul: 'Satıcı “şimdi değil” dedi.', kart: 'Şimdi değil', sonra: 'Kayıt bekler. Hatırlatma tarihi gelince bu akışı uygulayın:', durum: 'hatirlatma', bekler: true },
      { kosul: 'Satıcı “hayır” dedi.', kart: 'Uygun değil', sonra: 'Kayıt kapanır.' },
    ],
  },
];

/** Adım: düz metin ya da başka bir duruma geçiş. */
export type Adim = string | { metin: string; git: string };

export interface Durum {
  id: string;
  yer: Yer;
  ad: string;
  adimlar: Adim[];
  /** Kayıt kartına yazılacak sonuç. */
  kart: string;
  /** Bu durumda gönderilecek hazır metin (`sablonlar` kimliği). */
  sablon?: string;
}

export function durumlar(p: Pick<Params, 'subscriptionEur' | 'annualMonths' | 'eurTry'>): Durum[] {
  const std = paketler(p).find((k) => k.id === 'standart')!;
  const aylik = std.aylikEur!;
  const yillik = std.yillikEur!;
  // Fiyat tablosu: fiyatı yazılı paketler (Standart, Pro). Liste “A ve B” biçiminde yazılır.
  const tablo = paketler(p).filter((k) => k.aylikEur !== null);
  const ve = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ve ${xs.at(-1)}`);
  const tabloAylik = ve(tablo.map((k) => `${k.ad} paket aylık ${eur(k.aylikEur!)}`));
  const tabloYillik = ve(tablo.map((k) => `${k.ad} ${eur(k.yillikEur!)}`));
  return [
    {
      id: 'yeni-kayit',
      yer: 1,
      ad: 'Yeni kayıt geldi',
      adimlar: [
        'Kayıt kartını açın.',
        'Türü, işletmeyi, yetkiliyi, telefonu, e-postayı, sektörü, şehri ve iletişim izinlerini yazın.',
        { metin: 'Kayıt alıcıysa bu akışa geçin:', git: 'alici' },
        'Hoş geldin e-postasını gönderin.',
        'Bir iki saat sonra arayın.',
        'Kayıt birkaç gün önce geldiyse de bugün başlayın.',
      ],
      kart: 'Durum: Yeni. Sonraki adım: ilk arama, bugün.',
      sablon: 'hosgeldin',
    },
    {
      id: 'acti',
      yer: 1,
      ad: 'İlk arama: telefonu açtı',
      adimlar: [
        'Kendinizi tanıtın ve on dakikası olup olmadığını sorun.',
        { metin: 'Müsait değilse bu akışa geçin:', git: 'musait-degil' },
        'Ne sattığını sorun.',
        'Kime sattığını ve müşterilerinin hangi şehirlerden geldiğini sorun.',
        'Yeni toptan müşteriyi bugün nasıl bulduğunu sorun.',
        'Neden kaydolduğunu sorun.',
        'Ürün listesi, fotoğraflar ve toptan fiyatlar hazır mı, sorun.',
        { metin: 'Kararı başka biri veriyorsa bu akışa geçin:', git: 'karar-veren' },
        'Kurulum için iki seçenek önerin, örneğin “Yarın 11.00 mi, perşembe 15.00 mi?”',
        'WhatsApp ile yazmak için izin isteyin.',
        'Bir saat içinde görüşme özetini e-postayla gönderin.',
      ],
      kart: 'Durum: Ulaşıldı. Sonraki adım: kurulum görüşmesi, gün ve saatiyle.',
      sablon: 'ozet',
    },
    {
      id: 'acmadi',
      yer: 1,
      ad: 'Telefonu açmadı',
      adimlar: [
        'Kısa mesaj bırakın: adınızı ve istoc.com kaydı için aradığınızı yazın.',
        'Yeniden arayın: Gün 1 öğleden sonra, Gün 3 sabah.',
        'Üç arama da cevapsızsa Gün 5’te “Size ulaşamadım” e-postasını gönderin.',
        'Cevap gelmezse aramayı bırakın.',
      ],
      kart: 'Her denemeyi tarihiyle yazın. Cevap yoksa durum: Ulaşılamadı.',
      sablon: 'ulasilamadi',
    },
    {
      id: 'musait-degil',
      yer: 1,
      ad: '“Şimdi müsait değilim” dedi',
      adimlar: ['Hangi gün ve saatte aramanızı istediğini sorun.', 'Teşekkür edip kapatın.', 'O gün ve saatte arayın.'],
      kart: 'Sonraki adım: arama, söylenen gün ve saatle.',
    },
    {
      id: 'karar-veren',
      yer: 1,
      ad: 'Kararı başka biri veriyor',
      adimlar: ['Karar verenin adını ve telefonunu isteyin.', 'Kurulum ya da karar görüşmesine onu da davet edin.'],
      kart: 'Karar vereni ve telefonunu yazın.',
    },
    {
      id: 'kurulum',
      yer: 2,
      ad: 'Kurulum görüşmesi günü',
      adimlar: [
        'Bir saat önce kısa bir hatırlatma mesajı gönderin.',
        'Profili satıcıyla birlikte doldurun.',
        'İlk ürünleri birlikte yükleyin. Hedef en az 10 ürün.',
        'Eksik kalanları satıcıya yazılı olarak gönderin.',
        'Satıcı İstoç’taysa ve isterse saha satış uzmanıyla yerinde kurulum ayarlayın.',
      ],
      kart: 'Durum: Kurulumda. En az 10 ürün yayındaysa Etkin. Sonraki adım: ilk sonuç mesajı, Gün 3.',
    },
    {
      id: 'liste-gonderdi',
      yer: 2,
      ad: 'Ürün listesini gönderdi, yüklemeyi bize bıraktı',
      adimlar: [
        'Listeyi aldığınızı aynı gün yazın.',
        'Ürünleri yükleyin ya da yükleyecek kişiye iletin.',
        'Yükleme bitince vitrin bağlantısını satıcıya gönderin.',
        { metin: 'Ücret sorarsa bu akışa geçin:', git: 'fiyat' },
      ],
      kart: 'Yükleme tarihini ve ürün sayısını yazın.',
    },
    {
      id: 'gelmedi',
      yer: 2,
      ad: 'Kurulum görüşmesine gelmedi',
      adimlar: ['Aynı gün arayın ve yeni gün ve saat isteyin.', { metin: 'İkinci kez gelmezse ürün listesini istemek için bu akışa geçin:', git: 'liste-gonderdi' }],
      kart: 'Sonraki adım: yeni kurulum tarihi.',
    },
    {
      id: 'teknik',
      yer: 2,
      ad: 'Teknik sorun bildirdi',
      adimlar: [
        'Ekran görüntüsü isteyin.',
        'Çözebiliyorsanız hemen çözün.',
        'Çözemiyorsanız yazılım ekibine iletin.',
        'Satıcıya ne zaman döneceğinizi söyleyin.',
        'Söylediğiniz zamanda dönün, sorun sürse bile.',
      ],
      kart: 'Sorunu, iletildiği kişiyi ve dönüş tarihini yazın.',
    },
    {
      id: 'hareketsiz',
      yer: 2,
      ad: 'Kurulumdan sonra ürün yüklemiyor',
      adimlar: [
        'Kurulumdan iki gün sonra arayın.',
        'Neyin engel olduğunu sorun.',
        { metin: 'Zamanı yoksa ürün listesini isteyin:', git: 'liste-gonderdi' },
        'İlgisi kalmadıysa teşekkür edin ve kaydı kapatın.',
      ],
      kart: 'Engeli yazın. İlgisi kalmadıysa durum: Uygun değil.',
    },
    {
      id: 'ilk-sonuc',
      yer: 3,
      ad: 'Vitrin yayında (Gün 3 ile Gün 4 arası)',
      adimlar: [
        'Vitrin bağlantısını WhatsApp ile gönderin. İzin yoksa e-postayla gönderin.',
        'Ölçülüyorsa görüntülenme, mesaj ve talep sayısını ekleyin.',
        'Ölçülmeyen rakamı yazmayın.',
        'Eksik ürün grubunu eklemeyi önerin.',
      ],
      kart: 'Sonraki adım: ara kontrol araması, Gün 7.',
      sablon: 'ilk-sonuc',
    },
    {
      id: 'ara-kontrol',
      yer: 3,
      ad: 'Ara kontrol (Gün 7)',
      adimlar: [
        'Arayın. Görüşme on dakikayı geçmesin.',
        'Ne işe yaradığını, neyin eksik olduğunu ve sorun olup olmadığını sorun.',
        'Bir sonraki hedefi söyleyin, örneğin bütün ürün grubunu yüklemek.',
      ],
      kart: 'Notları ve bir sonraki hedefi yazın. Sonraki adım: değer özeti, Gün 10.',
    },
    {
      id: 'deger-ozeti',
      yer: 3,
      ad: 'Değer özeti (Gün 10 ile Gün 12 arası)',
      adimlar: [
        'Yayındaki ürün sayısını yazın.',
        'Ölçülüyorsa görüntülenme, mesaj ve talep sayısını yazın.',
        'Özeti e-postayla gönderin.',
        'Karar görüşmesi için gün ve saat önerin.',
        'Satıcı kabul edince saati takvime yazın.',
      ],
      kart: 'Satıcı saati kabul edince durum: Karar bekliyor. Sonraki adım: karar görüşmesi, Gün 14.',
      sablon: 'deger-ozeti',
    },
    {
      id: 'karar',
      yer: 4,
      ad: 'Karar görüşmesi (Gün 14)',
      adimlar: [
        'İlk günlerin sonucunu iki cümleyle özetleyin.',
        `${std.ad} paketi önerin: aylık ${eur(aylik)}, yaklaşık ${tl(aylik * p.eurTry)}.`,
        `Yıllık peşin seçeneğini söyleyin: ${eur(yillik)}. 12 ay için ${p.annualMonths} ayın ücreti ödenir.`,
        'Türk lirası karşılığının ödeme günündeki kurla hesaplandığını söyleyin.',
        'Doğrudan sorun: “Bu paketle devam etmek ister misiniz?”',
        { metin: 'Evet derse:', git: 'evet' },
        { metin: 'Şimdi değil derse:', git: 'simdi-degil' },
        { metin: 'Hayır derse:', git: 'hayir' },
      ],
      kart: 'Sonucu yazın: Ücretli, Şimdi değil ya da Uygun değil.',
    },
    {
      id: 'evet',
      yer: 4,
      ad: '“Evet” dedi',
      adimlar: ['Teklif e-postasını ve ödeme adımını aynı gün gönderin.', 'Ödeme gelince teşekkür edin.', 'Ayda bir arama tarihi belirleyin.'],
      kart: 'Durum: Ücretli. Sonraki adım: aylık arama.',
      sablon: 'teklif',
    },
    {
      id: 'simdi-degil',
      yer: 4,
      ad: '“Şimdi değil” dedi',
      adimlar: ['Nedenini sorun.', 'Ne zaman yeniden konuşmak istediğini sorun.', 'Teşekkür e-postasını gönderin.'],
      kart: 'Durum: Şimdi değil. Nedeni ve 30, 60 ya da 90 gün sonraki hatırlatma tarihini yazın.',
      sablon: 'simdi-degil',
    },
    {
      id: 'hayir',
      yer: 4,
      ad: '“Hayır” dedi',
      adimlar: ['Teşekkür edin ve görüşmeyi kapatın.', 'Israr etmeyin.', 'Kararı değiştirmek için indirim ya da ücretsiz süre önermeyin.'],
      kart: 'Durum: Uygun değil. Ret nedeni: fiyat, alıcı yok, ihtiyaç yok, zaman yok ya da diğer.',
    },
    {
      id: 'hatirlatma',
      yer: 4,
      ad: 'Hatırlatma tarihi geldi',
      adimlar: [
        'Karttaki notları okuyun.',
        'Arayın ve erteleme nedeninin değişip değişmediğini sorun.',
        'Geri kazanmak için indirim ya da ücretsiz süre önermeyin.',
        { metin: 'Değiştiyse bu akışa geçin:', git: 'karar' },
        'Değişmediyse yeni bir tarih isteyin ya da kaydı kapatın.',
      ],
      kart: 'Yeni tarihi ya da Uygun değil durumunu yazın.',
    },
    {
      id: 'fiyat',
      yer: 'her-an',
      ad: 'Fiyatı sordu',
      adimlar: [
        `Fiyat tablosundaki fiyatı söyleyin: ${tabloAylik}.`,
        `Yıllık peşin fiyatı söyleyin: ${tabloYillik}. Bu tutar 12 ay için ${p.annualMonths} ayın ücretidir.`,
        'Türk lirası karşılığının ödeme günündeki kurla hesaplandığını söyleyin.',
        'Kayıt Aşama 4’ten önceyse “Önce vitrininizi açalım, 14. gün sonucuna birlikte bakalım” deyin.',
      ],
      kart: 'Fiyatın söylendiğini yazın.',
    },
    {
      id: 'pahali',
      yer: 'her-an',
      ad: '“Pahalı” dedi',
      adimlar: [
        'Düzenli bir toptan müşterinin ayda ne kadar kâr bıraktığını sorun.',
        `Paketin aylık bedelini (yaklaşık ${tl(aylik * p.eurTry)}) bu kâra bölün.`,
        'Sonucu söyleyin: paket bedelini kaç müşteri karşılıyor.',
        'Yıllık peşin seçeneğini söyleyin.',
        { metin: 'İndirim isterse bu akışa geçin:', git: 'indirim' },
      ],
      kart: 'Satıcının söylediği kârı ve itirazı yazın.',
    },
    {
      id: 'indirim',
      yer: 'her-an',
      ad: 'İndirim ya da pazarlık istedi',
      adimlar: [
        '“İndirim yapmıyoruz. Fiyatlarımız herkes için aynıdır ve pazarlıkla değişmez” deyin.',
        `Fiyat tablosunu tekrar söyleyin: ${tabloAylik}.`,
        `Yıllık peşin fiyatı söyleyin: ${tabloYillik}.`,
        'Özel fiyat önermeyin. Talebi kimseye iletmeyin.',
        'Bu fiyatla devam etmek isteyip istemediğini sorun.',
        { metin: 'Evet derse:', git: 'evet' },
        { metin: 'Düşüneyim derse:', git: 'dusuneyim' },
        { metin: 'Hayır derse:', git: 'hayir' },
      ],
      kart: 'İndirim istediğini ve fiyat tablosunun söylendiğini yazın.',
    },
    {
      id: 'ucretsiz-sure',
      yer: 'her-an',
      ad: 'Ücretsiz ay ya da ek süre istedi',
      adimlar: [
        '“Ücretsiz ay ya da ek süre vermiyoruz. Fiyatlarımız herkes için aynıdır” deyin.',
        `Fiyat tablosunu söyleyin: ${tabloAylik}.`,
        'Bu fiyatla devam etmek isteyip istemediğini sorun.',
        { metin: 'Evet derse:', git: 'evet' },
        { metin: 'Düşüneyim derse:', git: 'dusuneyim' },
        { metin: 'Hayır derse:', git: 'hayir' },
      ],
      kart: 'Ücretsiz süre istediğini ve fiyat tablosunun söylendiğini yazın.',
    },
    {
      id: 'rakip-ucuz',
      yer: 'her-an',
      ad: '“Başka yer daha ucuz” dedi',
      adimlar: [
        'Diğer yeri kötülemeyin.',
        '“Fiyatımız herkes için aynıdır. Başka bir yerin fiyatına göre değişmez” deyin.',
        `Fiyat tablosunu söyleyin: ${tabloAylik}.`,
        { metin: 'Diğer platformdan söz ederse bu akışa geçin:', git: 'baska-platform' },
      ],
      kart: 'Karşılaştırdığı yeri ve söylediği fiyatı yazın.',
    },
    {
      id: 'odeme-kosulu',
      yer: 'her-an',
      ad: 'Taksit, vade ya da sonra ödeme istedi',
      adimlar: [
        'Fiyat tablosundaki seçenekleri söyleyin: aylık ödeme ya da yıllık peşin ödeme.',
        `Yıllık peşin fiyatı söyleyin: ${tabloYillik}.`,
        'Bu iki seçenekten biriyle devam etmek isteyip istemediğini sorun.',
        { metin: 'Evet derse:', git: 'evet' },
        { metin: 'Hayır derse:', git: 'hayir' },
      ],
      kart: 'İstediği ödeme koşulunu ve cevabını yazın.',
    },
    {
      id: 'soz-verilmis',
      yer: 'her-an',
      ad: '“Bana indirim sözü verilmişti” dedi',
      adimlar: [
        'Yanlış bilgi için özür dileyin.',
        '“İndirim yapmıyoruz. Fiyat, fiyat tablosundaki fiyattır” deyin.',
        `Fiyat tablosunu söyleyin: ${tabloAylik}.`,
        'Bu sözü kimin ve ne zaman verdiğini sorun.',
      ],
      kart: 'Sözü kimin ve ne zaman verdiğini yazın.',
    },
    {
      id: 'dusuneyim',
      yer: 'her-an',
      ad: '“Düşüneyim” dedi',
      adimlar: ['Kararını en çok neyin etkilediğini sorun: fiyat mı, alıcı mı, zaman mı?', 'Eksik bilgiyi verin.', 'Yeniden konuşmak için tarih alın.'],
      kart: 'Tarihsiz kapatmayın. Sonraki adımı ve tarihini yazın.',
    },
    {
      id: 'satis-gelir-mi',
      yer: 'her-an',
      ad: '“Satış gelir mi, alıcı var mı?” diye sordu',
      adimlar: ['Satış garantisi vermeyin.', 'Ölçülen rakamları söyleyin. Ölçülmeyeni söylemeyin.', '“İlk 14 günde ne olduğunu birlikte görelim” deyin.'],
      kart: 'Soruyu yazın.',
    },
    {
      id: 'siparis',
      yer: 'her-an',
      ad: '“Sipariş ve ödeme var mı?” diye sordu',
      adimlar: ['“Henüz yok” deyin.', 'Kesin tarih bilmiyorsanız tarih vermeyin.', 'Bugün platformun ne yaptığını söyleyin.'],
      kart: 'Soruyu yazın.',
    },
    {
      id: 'baska-platform',
      yer: 'her-an',
      ad: '“Başka platformdayım” ya da “Kendi müşterim var” dedi',
      adimlar: [
        'Diğer platformu kötülemeyin.',
        'istoc.com’un mevcut müşterilerin yanına yeni bir toptan alıcı kanalı eklediğini söyleyin.',
        'Bugün ulaşamadığı şehri ya da müşteri grubunu sorun.',
      ],
      kart: 'Kullandığı diğer kanalı yazın.',
    },
    {
      id: 'zaman-yok',
      yer: 'her-an',
      ad: '“Zamanım yok” dedi',
      adimlar: ['Kurulumun yarım saat sürdüğünü söyleyin.', { metin: 'Yine zamanı yoksa ürün listesini isteyin:', git: 'liste-gonderdi' }],
      kart: 'Sonraki adımı ve tarihini yazın.',
    },
    {
      id: 'alici',
      yer: 'her-an',
      ad: 'Kayıt alıcı çıktı',
      adimlar: [
        'Ne aradığını, kaç adet, hangi şehre ve ne zaman istediğini sorun.',
        'Talebi uygun satıcılara iletin.',
        'Alıcıya paket önermeyin.',
      ],
      kart: 'Durum: Alıcı. Talebi ve iletildiği satıcıları yazın.',
    },
    {
      id: 'istemiyorum',
      yer: 'her-an',
      ad: '“Beni aramayın” ya da “Mesaj istemiyorum” dedi',
      adimlar: ['Hemen kabul edin ve özür dileyin.', 'O kanaldan bir daha aramayın ve yazmayın.'],
      kart: 'İlgili iletişim iznini kapatın.',
    },
    {
      id: 'sikayet',
      yer: 'her-an',
      ad: 'Şikâyet etti ya da kızgın',
      adimlar: [
        'Sözünü kesmeden dinleyin.',
        'Sorunu kendi cümlelerinizle tekrar edin.',
        'Çözebiliyorsanız çözün.',
        'Çözemiyorsanız aynı gün İsmail Karaca’ya iletin.',
        'Satıcıya ne zaman döneceğinizi söyleyin ve o zaman dönün.',
      ],
      kart: 'Şikâyeti, iletildiği kişiyi ve dönüş tarihini yazın.',
    },
    {
      id: 'yanlis-numara',
      yer: 'her-an',
      ad: 'Yanlış numara ya da şüpheli kayıt',
      adimlar: ['Kayıttaki e-postaya bir kez yazın ve doğru numarayı isteyin.', 'Cevap gelmezse kaydı kapatın.'],
      kart: 'Durum: Ulaşılamadı. Not: yanlış numara.',
    },
  ];
}

export interface Sablon {
  id: string;
  ad: string;
  konu?: string;
  metin: string;
}

const IMZA = 'Saygılarımla,\n[Ad Soyad]\nistoc.com\n[Telefon]';

/** Hazır metinler. Köşeli parantezli yerler doldurulur. Teklif metni paket ücretini Parametreler’den alır. */
export function sablonlar(p: Pick<Params, 'subscriptionEur' | 'annualMonths'>): Record<string, Sablon> {
  const std = paketler(p).find((k) => k.id === 'standart')!;
  const liste: Sablon[] = [
    {
      id: 'hosgeldin',
      ad: 'Hoş geldin e-postası',
      konu: 'istoc.com’a hoş geldiniz',
      metin: `Merhaba [Ad] Bey ya da Hanım,\n\nistoc.com’a kaydolduğunuz için teşekkür ederim. Ben [adınız]. Hesabınızın kurulumunda size yardım edeceğim.\n\nBugün saat [saat] civarında sizi arayacağım. Görüşme on dakika sürer. Bu saat uygun değilse uygun saati bu e-postaya yazabilirsiniz.\n\n${IMZA}`,
    },
    {
      id: 'ozet',
      ad: 'Görüşme özeti',
      konu: 'Görüşmemizin özeti ve kurulum günü',
      metin: `Merhaba [Ad] Bey ya da Hanım,\n\nGörüşmemiz için teşekkür ederim. Kurulum görüşmemiz [gün] günü saat [saat].\n\nGörüşmeden önce şunları hazırlarsanız vitrininizi aynı gün açabiliriz:\n- Logo ve işletme bilgileri\n- Ürün listesi\n- Ürün fotoğrafları\n- Toptan fiyatlar ve en az sipariş adetleri\n\n${IMZA}`,
    },
    {
      id: 'ilk-sonuc',
      ad: 'Vitrin yayında mesajı',
      metin: 'Merhaba [Ad] Bey ya da Hanım, vitrininiz yayında: [bağlantı]. Şu an [n] ürününüz görünüyor. Eksik kalan [ürün grubu] ürünlerinizi de ekleyelim mi?',
    },
    {
      id: 'deger-ozeti',
      ad: 'Değer özeti',
      konu: 'istoc.com’daki ilk günlerinizin özeti',
      metin: `Merhaba [Ad] Bey ya da Hanım,\n\nİlk günlerinizin özeti:\n- Yayındaki ürün: [n]\n- Vitrin görüntülenmesi: [n]\n- Gelen mesaj ya da talep: [n]\n\nBaşlangıç döneminiz [tarih] tarihinde bitiyor. O gün on beş dakika konuşalım. [Gün] günü saat [saat] size uygun mu?\n\n${IMZA}`,
    },
    {
      id: 'teklif',
      ad: 'Teklif e-postası',
      konu: 'Konuştuğumuz paket',
      metin: `Merhaba [Ad] Bey ya da Hanım,\n\nKonuştuğumuz gibi ${std.ad} paketiyle devam ediyoruz.\n- Aylık ücret: ${eur(std.aylikEur!)}\n- Yıllık peşin: ${eur(std.yillikEur!)} (12 ay için ${p.annualMonths} ayın ücreti)\n- Türk lirası karşılığı ödeme günündeki kurla hesaplanır.\n\nBaşlamak için: [ödeme adımı]\n\n${IMZA}\n\nBu tür e-postaları almak istemiyorsanız “istemiyorum” yazmanız yeterlidir.`,
    },
    {
      id: 'simdi-degil',
      ad: 'Şimdi değil, teşekkür',
      konu: 'Görüşmemiz için teşekkürler',
      metin: `Merhaba [Ad] Bey ya da Hanım,\n\nAçık cevabınız için teşekkür ederim. Konuştuğumuz gibi [tarih] civarında size yeniden yazacağım. Fikriniz daha önce değişirse bu e-postaya cevap yazmanız yeterli.\n\n${IMZA}`,
    },
    {
      id: 'ulasilamadi',
      ad: 'Size ulaşamadım',
      konu: 'Size ulaşamadım',
      metin: `Merhaba [Ad] Bey ya da Hanım,\n\nistoc.com kaydınız için sizi birkaç kez aradım ama ulaşamadım. Yardım isterseniz uygun bir gün ve saati bu e-postaya yazın, sizi o saatte arayayım. Cevap gelmezse sizi yeniden aramayacağım.\n\n${IMZA}`,
    },
  ];
  return Object.fromEntries(liste.map((s) => [s.id, s]));
}
