/**
 * Yeni kayıt adımları (kullanıcı kararları 2026-11-10): sayfa CRM masası sorumlusu içindir. Süreç dört aşamadır.
 * Metin, Claude ve Codex'in ortak yalın Türkçe kural setine uyar (/Users/w6x/AGENTS.md#yalin-turkce-yazim-politikasi):
 * talimat en çok 10, açıklama en çok 15 kelime, etiket dizisi yok, geçişlerin adı her yerde “durum”.
 * Her aşamanın başlama koşulu, bitiş koşulları ve sonraki aşaması yazılıdır (kullanıcı kararı: “hangi aşama ne zaman
 * bitiyor, sonra hangisi başlıyor belli olsun”). Kayıt kartındaki durum, kaydın hangi aşamada olduğunu gösterir. Her
 * aşamada olabilen durumlar ayrı tutulur. Her durum için yalın, sıralı adımlar ve kayıt kartına yazılacak sonuç verilir. Yöneticiye yönelik açıklama, gerekçe ve öğretici metin
 * yazılmaz (kullanıcı kararı: “bana öğretme, CRM sorumlusuna öğret, uzun metin değil yalın adımlar”). Adımlar kısa ve
 * tam cümledir, noktalı virgül ve uzun çizgi kullanılmaz. Paket ücretleri Parametreler’den gelir.
 * Fiyat, fiyat tablosundaki fiyattır (`paketler(params)`). Kullanıcı kararları 2026-11-10: fiyat pazarlıkla değişmez,
 * “indirim söz konusu değil”, fiyat sorusu “söz vermeyin” ya da “birine sorun” diye ertelenmez. CRM sorumlusu fiyatı
 * tablodan söyler. Ücretsiz ay, ek süre, özel fiyat ve tablo dışı ödeme koşulu da önerilmez. Benzer fiyat durumlarının
 * her biri kendi durumuyla karşılanır (fiyat, indirim, ucretsiz-sure, rakip-ucuz, odeme-kosulu, soz-verilmis). Ürün bir
 * SaaS aboneliğidir. Hiçbir adım satıcıya satış ya da sipariş sözü vermez.
 */
import type { Params } from './params';
import { eur, paketler } from './gelirModelleri';

export const tl = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`;

/** “A, B ve C” biçiminde liste. */
export const ve = (xs: string[], baglac = 've') => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${baglac} ${xs.at(-1)}`);

/** Süreç bittiğinde kayıt kartında kalan durumlar. “Şimdi değil” kapanış değildir, bekleyen kayıttır. */
export const KAPANIS_DURUMLARI = ['Ücretli', 'Uygun değil', 'Ulaşılamadı', 'Alıcı'];
export const BEKLEME_NOTU = '“Şimdi değil” diyen satıcının kaydı kapanmaz. Hatırlatma tarihi gelince satıcıyı yeniden arayın. Sonra Aşama 4’ten devam edin.';

/** Her zaman geçerli kurallar. */
export const HER_DURUMDA: string[] = [
  'Satıcıyla her konuşmadan ve yazışmadan sonra kayıt kartını güncelleyin.',
  'Kayıt kartındaki “Sonraki adım” alanını boş bırakmayın. Bu alana sıradaki işi ve tarihini girin.',
  'Fiyat, fiyat tablosundaki fiyattır. İndirim yoktur ve pazarlık yapılmaz.',
  'Ücretsiz ay, ek süre, özel fiyat önermeyin. Tablo dışında bir ödeme koşulu da önermeyin.',
  'Satıcıya “satış yaparsınız” ya da “sipariş alırsınız” diye söz vermeyin.',
  'Fiyat dışında bilmediğiniz bir konu olursa tahmin etmeyin. İsmail Karaca’ya sorun.',
  'Satıcının izin vermediği kanaldan aramayın ve yazmayın. Örneğin WhatsApp izni yoksa WhatsApp’tan yazmayın.',
  'Satıcıyı 10.00 ile 12.00 arasında arayın. 14.00 ile 17.00 arasında da arayabilirsiniz. Satıcı başka bir saat söylediyse o saatte arayın.',
];

/** Sürecin aşaması (1–4) ya da her aşamada olabilen durum. */
export type AsamaNo = 1 | 2 | 3 | 4;
export type Yer = AsamaNo | 'her-an';

/**
 * Aşamanın bir sonu. Görünüm iki cümle kurar: “{kosul} {sonuc}.” ve “Kayıt kartında durumu “{kart}” yapın.”
 * Kullanıcı kararı 2026-11-10: etiket dizisi (“Biter:”, “Kayıt kartı:”) cümle yerine geçmez, metin yalın Türkçedir.
 */
export interface Cikis {
  /** Cümlenin başı, “-ınca” ya da “-rsa” ile biter, noktasızdır. İleri çıkışta sonraki aşamanın `baslar` alanıyla aynıdır. */
  kosul: string;
  /** Cümlenin sonu, küçük harfle başlar: “bu aşama biter”, “kayıt kapanır”. */
  sonuc: string;
  /** Kayıt kartında yapılacak durum. */
  kart: string;
  /** Ek talimat, tam cümle (varsa). */
  sonra?: string;
  /** Sonraki aşama (varsa). */
  git?: AsamaNo;
  /** Sonra geçilecek durum (varsa). */
  durum?: string;
  /** Kayıt kapanmaz, bekler (Şimdi değil). */
  bekler?: true;
}

export interface Asama {
  no: AsamaNo;
  ad: string;
  /** Kayıttan sonraki günler. */
  gun: string;
  /** Bu aşamadayken kayıt kartındaki durum. */
  kartDurumu: string;
  /** Cümlenin başı: görünüm “{baslar} başlar.” yazar. */
  baslar: string;
  cikislar: Cikis[];
}

const KURULUM_GUNU = 'Satıcıyla kurulum görüşmesinin günü ve saati belli olunca';
const VITRIN_HAZIR = 'Profil tamamlanıp en az 10 ürün yayına girince';
const KARAR_GUNU = 'Satıcıyla karar görüşmesinin günü ve saati belli olunca';

export const ASAMALAR: Asama[] = [
  {
    no: 1,
    ad: 'İlk temas',
    gun: 'Kayıt gününden kayıttan sonraki 5. güne kadar',
    kartDurumu: 'Yeni',
    baslar: 'Yeni bir kayıt gelince',
    cikislar: [
      { kosul: KURULUM_GUNU, sonuc: 'bu aşama biter', kart: 'Kurulumda', git: 2 },
      { kosul: 'Üç aramaya ve bir e-postaya cevap gelmezse', sonuc: 'kayıt kapanır', kart: 'Ulaşılamadı' },
      { kosul: 'Kaydı yapan kişi satıcı değil de alıcıysa', sonuc: 'bu süreç onun için biter', kart: 'Alıcı', durum: 'alici' },
    ],
  },
  {
    no: 2,
    ad: 'Kurulum',
    gun: 'Kayıttan sonraki 1. günden 3. güne kadar',
    kartDurumu: 'Kurulumda',
    baslar: KURULUM_GUNU,
    cikislar: [
      { kosul: VITRIN_HAZIR, sonuc: 'bu aşama biter', kart: 'Etkin', git: 3 },
      { kosul: 'Satıcı vazgeçerse', sonuc: 'kayıt kapanır', kart: 'Uygun değil' },
    ],
  },
  {
    no: 3,
    ad: 'Takip',
    gun: 'Kayıttan sonraki 3. günden 12. güne kadar',
    kartDurumu: 'Etkin',
    baslar: VITRIN_HAZIR,
    cikislar: [
      { kosul: KARAR_GUNU, sonuc: 'bu aşama biter', kart: 'Karar bekliyor', git: 4 },
      { kosul: 'Satıcının ilgisi kalmazsa', sonuc: 'kayıt kapanır', kart: 'Uygun değil' },
    ],
  },
  {
    no: 4,
    ad: 'Karar',
    gun: 'Kayıttan sonraki 12. günden 14. güne kadar',
    kartDurumu: 'Karar bekliyor',
    baslar: KARAR_GUNU,
    cikislar: [
      { kosul: 'Ödeme gelince', sonuc: 'satıcı ücretli pakete geçer ve süreç biter', kart: 'Ücretli', sonra: 'Bundan sonra satıcıyı ayda bir arayın.' },
      {
        kosul: 'Satıcı “şimdi değil” derse',
        sonuc: 'kayıt kapanmaz ve hatırlatma tarihine kadar bekler',
        kart: 'Şimdi değil',
        sonra: 'Hatırlatma tarihi gelince şu duruma geçin:',
        durum: 'hatirlatma',
        bekler: true,
      },
      { kosul: 'Satıcı “hayır” derse', sonuc: 'kayıt kapanır', kart: 'Uygun değil' },
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
  // Fiyat tablosu: fiyatı yazılı paketler (Standart, Pro). Liste “Standart 399 €, Pro 599 €” biçimindedir.
  // Kısa liste, fiyat adımını 10 kelimelik talimat hedefinin içinde tutar.
  const tablo = paketler(p).filter((k) => k.aylikEur !== null);
  const tabloAylik = tablo.map((k) => `${k.ad} ${eur(k.aylikEur!)}`).join(', ');
  const tabloYillik = tablo.map((k) => `${k.ad} ${eur(k.yillikEur!)}`).join(', ');
  return [
    {
      id: 'yeni-kayit',
      yer: 1,
      ad: 'Yeni kayıt geldi',
      adimlar: [
        'Kayıt birkaç gün önce geldiyse de bu adımlara bugün başlayın.',
        'Kayıt kartını açın.',
        'Kaydı yapanın satıcı mı alıcı mı olduğunu yazın.',
        'İşletmenin adını, yetkiliyi, telefonu, e-postayı, sektörü ve şehri yazın.',
        'Satıcının hangi kanallardan iletişime izin verdiğini yazın.',
        { metin: 'Kaydı yapan alıcıysa şu duruma geçin:', git: 'alici' },
        'Hoş geldin e-postasını gönderin.',
        'Bir iki saat sonra satıcıyı arayın.',
      ],
      kart: 'Durumu “Yeni” yapın. “Sonraki adım” alanına bugünkü ilk aramayı girin.',
      sablon: 'hosgeldin',
    },
    {
      id: 'acti',
      yer: 1,
      ad: 'İlk aramada telefonu açtı',
      adimlar: [
        'Kendinizi tanıtın ve on dakikası olup olmadığını sorun.',
        { metin: 'Müsait değilse şu duruma geçin:', git: 'musait-degil' },
        'Ne sattığını sorun.',
        'Kime sattığını ve müşterilerinin hangi şehirlerden geldiğini sorun.',
        'Yeni toptan müşterileri şu anda nasıl bulduğunu sorun.',
        'Neden kaydolduğunu sorun.',
        'Ürün listesinin, fotoğrafların ve toptan fiyatların hazır olup olmadığını sorun.',
        { metin: 'Kararı başka biri veriyorsa şu duruma geçin:', git: 'karar-veren' },
        'Kurulum için iki gün ve saat önerin.',
        'Örneğin “Yarın 11.00 mi, perşembe 15.00 mi?” diye sorun.',
        'WhatsApp ile yazmak için izin isteyin.',
        'Bir saat içinde görüşme özetini e-postayla gönderin.',
      ],
      kart: 'Kurulum günü ve saati belli olunca durumu “Kurulumda” yapın. “Sonraki adım” alanına kurulum görüşmesini gün ve saatiyle girin.',
      sablon: 'ozet',
    },
    {
      id: 'acmadi',
      yer: 1,
      ad: 'Telefonu açmadı',
      adimlar: [
        'Satıcıya SMS ile kısa bir mesaj gönderin. Mesajda adınızı ve istoc.com kaydı için aradığınızı yazın.',
        'Kayıttan sonraki 1. gün öğleden sonra yeniden arayın.',
        'Açmazsa 3. gün sabah bir kez daha arayın.',
        'Üç arama da cevapsız kalırsa 5. gün e-posta gönderin.',
        'E-postaya da cevap gelmezse aramayı bırakın.',
      ],
      kart: 'Her aramayı tarihiyle yazın. E-postaya da cevap gelmezse durumu “Ulaşılamadı” yapın.',
      sablon: 'ulasilamadi',
    },
    {
      id: 'musait-degil',
      yer: 1,
      ad: '“Şimdi müsait değilim” dedi',
      adimlar: ['Hangi gün ve saatte aramanızı istediğini sorun.', 'Teşekkür edip kapatın.', 'O gün ve saatte arayın.'],
      kart: '“Sonraki adım” alanına satıcının söylediği gün ve saatteki aramayı girin.',
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
        'İlk ürünleri birlikte yükleyin. En az 10 ürün yüklemeye çalışın.',
        'Satıcının tamamlaması gereken işlerin listesini ona yazılı olarak gönderin.',
        'Satıcının dükkânı İstoç’taysa yerinde kurulum önerin.',
        'Satıcı isterse saha satış uzmanıyla bir gün ayarlayın.',
      ],
      kart: 'Profilin tamamlandığını kontrol edin. En az 10 ürün yayına girince durumu “Etkin” yapın. “Sonraki adım” alanına 3. gün gönderilecek “Vitrin yayında” mesajını girin.',
    },
    {
      id: 'liste-gonderdi',
      yer: 2,
      ad: 'Ürün listesini gönderdi, yüklemeyi bize bıraktı',
      adimlar: [
        'Listeyi aldığınızı aynı gün yazın.',
        'Ürünleri yükleyin ya da yükleyecek kişiye iletin.',
        'Yükleme bitince vitrin bağlantısını satıcıya gönderin.',
        { metin: 'Ücret sorarsa şu duruma geçin:', git: 'fiyat' },
      ],
      kart: 'Yükleme tarihini ve ürün sayısını yazın.',
    },
    {
      id: 'gelmedi',
      yer: 2,
      ad: 'Kurulum görüşmesine gelmedi',
      adimlar: ['Aynı gün arayın ve yeni bir gün ve saat isteyin.', { metin: 'İkinci kez de gelmezse ürün listesini göndermesini isteyin. Liste gelince şu duruma geçin:', git: 'liste-gonderdi' }],
      kart: '“Sonraki adım” alanına yeni kurulum gününü ve saatini girin.',
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
        'Sorun sürse bile söylediğiniz zamanda satıcıya dönün.',
      ],
      kart: 'Sorunu, sorunu ilettiğiniz kişiyi ve dönüş tarihini yazın.',
    },
    {
      id: 'hareketsiz',
      yer: 2,
      ad: 'Kurulumdan sonra ürün yüklemiyor',
      adimlar: [
        'Kurulumdan iki gün sonra arayın.',
        'Ürün yüklemesini neyin engellediğini sorun.',
        { metin: 'Zamanı yoksa ürün listesini göndermesini isteyin. Liste gelince şu duruma geçin:', git: 'liste-gonderdi' },
        'İlgisi kalmadıysa teşekkür edin ve kaydı kapatın.',
      ],
      kart: 'Satıcının söylediği engeli yazın. İlgisi kalmadıysa durumu “Uygun değil” yapın.',
    },
    {
      id: 'ilk-sonuc',
      yer: 3,
      ad: 'Vitrin yayına girdi (3. ya da 4. gün)',
      adimlar: [
        'Vitrin bağlantısını WhatsApp ile gönderin. WhatsApp izni yoksa e-postayla gönderin.',
        'Görüntülenme, mesaj ve talep sayıları ölçülüyorsa bunları da mesaja ekleyin.',
        'Ölçülmeyen bir rakamı mesaja yazmayın.',
        'Eksik kalan ürün grubunu da eklemeyi önerin.',
      ],
      kart: '“Sonraki adım” alanına 7. gündeki kontrol aramasını girin.',
      sablon: 'ilk-sonuc',
    },
    {
      id: 'ara-kontrol',
      yer: 3,
      ad: 'Kontrol araması (7. gün)',
      adimlar: [
        'Satıcıyı arayın. Görüşme on dakikayı geçmesin.',
        'Neyin iyi gittiğini sorun.',
        'Neyin eksik kaldığını sorun.',
        'Bir sorun olup olmadığını sorun.',
        'Sıradaki hedefi birlikte belirleyin, örneğin ürün grubunun tamamını yüklemek.',
      ],
      kart: 'Notları ve sıradaki hedefi yazın. “Sonraki adım” alanına 10. gün gönderilecek özet e-postasını girin.',
    },
    {
      id: 'deger-ozeti',
      yer: 3,
      ad: 'İlk günlerin özeti (10. günden 12. güne kadar)',
      adimlar: [
        'Özet e-postasına yayındaki ürün sayısını yazın.',
        'Görüntülenme, mesaj ve talep sayıları ölçülüyorsa bunları da e-postaya ekleyin.',
        'Özeti satıcıya e-postayla gönderin.',
        'Karar görüşmesi için bir gün ve saat önerin.',
        'Satıcı kabul edince görüşmeyi takvime yazın.',
      ],
      kart: 'Satıcı gün ve saati kabul edince durumu “Karar bekliyor” yapın. “Sonraki adım” alanına 14. gündeki karar görüşmesini girin.',
      sablon: 'deger-ozeti',
    },
    {
      id: 'karar',
      yer: 4,
      ad: 'Karar görüşmesi (14. gün)',
      adimlar: [
        'İlk günlerde neler olduğunu iki cümleyle özetleyin.',
        `${std.ad} paketi önerin: aylık ${eur(aylik)}, yaklaşık ${tl(aylik * p.eurTry)}.`,
        `Yıllık peşin seçeneğini söyleyin: ${eur(yillik)}. 12 ay için ${p.annualMonths} ayın ücreti ödenir.`,
        'Türk lirası karşılığının ödeme günündeki kurla hesaplandığını söyleyin.',
        'Doğrudan sorun: “Bu paketle devam etmek ister misiniz?”',
        { metin: 'Evet derse:', git: 'evet' },
        { metin: 'Şimdi değil derse:', git: 'simdi-degil' },
        { metin: 'Hayır derse:', git: 'hayir' },
      ],
      kart: 'Satıcının cevabını yazın.',
    },
    {
      id: 'evet',
      yer: 4,
      ad: '“Evet” dedi',
      adimlar: ['Teklif e-postasını aynı gün gönderin. E-postadaki [ödeme adımı] yerine satıcının nasıl ödeyeceğini yazın.', 'Ödeme gelince satıcıya teşekkür edin.', 'Her ay için bir arama tarihi belirleyin.'],
      kart: 'Ödeme gelince durumu “Ücretli” yapın. “Sonraki adım” alanına bir ay sonraki aramayı girin.',
      sablon: 'teklif',
    },
    {
      id: 'simdi-degil',
      yer: 4,
      ad: '“Şimdi değil” dedi',
      adimlar: ['Nedenini sorun.', 'Ne zaman yeniden konuşmak istediğini sorun.', 'Teşekkür e-postasını gönderin.'],
      kart: 'Durumu “Şimdi değil” yapın. Nedenini yazın. Satıcının istediği zamana bir hatırlatma tarihi koyun. Tarih, görüşmeden 30, 60 ya da 90 gün sonra olsun.',
      sablon: 'simdi-degil',
    },
    {
      id: 'hayir',
      yer: 4,
      ad: '“Hayır” dedi',
      adimlar: ['Teşekkür edin ve görüşmeyi kapatın.', 'Israr etmeyin.', 'Kararı değiştirmek için indirim ya da ücretsiz süre önermeyin.'],
      kart: 'Durumu “Uygun değil” yapın. Satıcının neden hayır dediğini yazın. Sebep fiyat, alıcı yokluğu ya da zaman olabilir.',
    },
    {
      id: 'hatirlatma',
      yer: 4,
      ad: 'Hatırlatma tarihi geldi',
      adimlar: [
        'Kayıt kartındaki notları okuyun.',
        'Satıcıyı arayın. “Şimdi değil” dediği zamanki engelin hâlâ sürüp sürmediğini sorun.',
        'Satıcıyı ikna etmek için indirim ya da ücretsiz süre önermeyin.',
        { metin: 'Engel kalktıysa şu duruma geçin:', git: 'karar' },
        'Engel sürüyorsa yeniden konuşmak için yeni bir tarih isteyin.',
        'Satıcı artık ilgilenmediğini söylerse kaydı kapatın.',
      ],
      kart: 'Yeni hatırlatma tarihini yazın. Kaydı kapattıysanız durumu “Uygun değil” yapın.',
    },
    {
      id: 'fiyat',
      yer: 'her-an',
      ad: 'Fiyatı sordu',
      adimlar: [
        `Aylık fiyatları söyleyin: ${tabloAylik}.`,
        `Yıllık peşin fiyatları söyleyin: ${tabloYillik}.`,
        `Yıllık peşin ödemede 12 ay için ${p.annualMonths} ayın ücreti ödenir.`,
        'Türk lirası karşılığının ödeme günündeki kurla hesaplandığını söyleyin.',
        'Satıcı henüz Aşama 4’e gelmediyse önce vitrini açmayı önerin.',
        '“Kaydınızın 14. gününde sonuçlara birlikte bakalım.” deyin.',
      ],
      kart: 'Fiyatı söylediğinizi yazın.',
    },
    {
      id: 'pahali',
      yer: 'her-an',
      ad: '“Pahalı” dedi',
      adimlar: [
        'Düzenli bir toptan müşterinin ayda ne kadar kâr bıraktığını sorun.',
        `Paketin aylık bedeli yaklaşık ${tl(aylik * p.eurTry)}. Bu tutarı, bir müşterinin bıraktığı aylık kâra bölün.`,
        'Çıkan sayıyı satıcıya söyleyin. Bu sayı, paketin bedelini kaç müşterinin karşıladığını gösterir.',
        'Yıllık peşin seçeneğini söyleyin.',
        { metin: 'İndirim isterse şu duruma geçin:', git: 'indirim' },
      ],
      kart: 'Satıcının söylediği kârı ve itirazı yazın.',
    },
    {
      id: 'indirim',
      yer: 'her-an',
      ad: 'İndirim ya da pazarlık istedi',
      adimlar: [
        '“İndirim yapmıyoruz. Fiyatlarımız herkes için aynıdır ve pazarlıkla değişmez” deyin.',
        `Aylık fiyatları tekrar söyleyin: ${tabloAylik}.`,
        `Yıllık peşin fiyatları söyleyin: ${tabloYillik}.`,
        'Özel fiyat önermeyin. Talebi kimseye iletmeyin.',
        'Bu fiyatla devam etmek isteyip istemediğini sorun.',
        { metin: 'Evet derse:', git: 'evet' },
        { metin: 'Düşüneyim derse:', git: 'dusuneyim' },
        { metin: 'Hayır derse:', git: 'hayir' },
      ],
      kart: 'Satıcının indirim istediğini ve ona fiyat tablosunu söylediğinizi yazın.',
    },
    {
      id: 'ucretsiz-sure',
      yer: 'her-an',
      ad: 'Ücretsiz ay ya da ek süre istedi',
      adimlar: [
        '“Ücretsiz ay ya da ek süre vermiyoruz. Fiyatlarımız herkes için aynıdır” deyin.',
        `Aylık fiyatları söyleyin: ${tabloAylik}.`,
        'Bu fiyatla devam etmek isteyip istemediğini sorun.',
        { metin: 'Evet derse:', git: 'evet' },
        { metin: 'Düşüneyim derse:', git: 'dusuneyim' },
        { metin: 'Hayır derse:', git: 'hayir' },
      ],
      kart: 'Satıcının ücretsiz süre istediğini ve ona fiyat tablosunu söylediğinizi yazın.',
    },
    {
      id: 'rakip-ucuz',
      yer: 'her-an',
      ad: '“Başka yer daha ucuz” dedi',
      adimlar: [
        'Diğer yeri kötülemeyin.',
        '“Fiyatımız herkes için aynıdır. Başka bir yerin fiyatına göre değişmez” deyin.',
        `Aylık fiyatları söyleyin: ${tabloAylik}.`,
        { metin: 'Diğer platformdan söz ederse şu duruma geçin:', git: 'baska-platform' },
      ],
      kart: 'Karşılaştırdığı yeri ve söylediği fiyatı yazın.',
    },
    {
      id: 'odeme-kosulu',
      yer: 'her-an',
      ad: 'Taksit, vade ya da ödemeyi erteleme istedi',
      adimlar: [
        '“Aylık ödeme ya da yıllık peşin ödeme yapabilirsiniz.” deyin.',
        'Başka bir ödeme seçeneği önermeyin.',
        `Yıllık peşin fiyatları söyleyin: ${tabloYillik}.`,
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
        '“İndirim yapmıyoruz. Fiyatımız herkes için aynıdır” deyin.',
        `Aylık fiyatları söyleyin: ${tabloAylik}.`,
        'Bu sözü kimin ve ne zaman verdiğini sorun.',
      ],
      kart: 'Sözü kimin ve ne zaman verdiğini yazın.',
    },
    {
      id: 'dusuneyim',
      yer: 'her-an',
      ad: '“Düşüneyim” dedi',
      adimlar: ['Kararını en çok neyin etkilediğini sorun.', 'Örneğin “Fiyat mı, alıcı mı, zaman mı?” diye sorun.', 'Eksik kalan bilgiyi verin.', 'Yeniden konuşmak için bir gün ve saat alın.'],
      kart: '“Sonraki adım” alanına yeniden konuşacağınız günü ve saati girin.',
    },
    {
      id: 'satis-gelir-mi',
      yer: 'her-an',
      ad: '“Satış gelir mi, alıcı var mı?” diye sordu',
      adimlar: ['Satış garantisi vermeyin.', 'Yalnız ölçülen rakamları söyleyin. Ölçülmeyen bir rakamı tahminle söylemeyin.', '“İlk 14 günde ne olduğunu birlikte görelim” deyin.'],
      kart: 'Satıcının sorusunu yazın.',
    },
    {
      id: 'siparis',
      yer: 'her-an',
      ad: '“Platformdan sipariş ve ödeme alabilir miyim?” diye sordu',
      adimlar: [
        '“Platformda şu anda sipariş ve ödeme özelliği yok.” deyin.',
        'Bu özelliğin ne zaman geleceğini kesin bilmiyorsanız tarih vermeyin.',
        'Platformun şu anda ne yaptığını anlatın.',
      ],
      kart: 'Satıcının sorusunu yazın.',
    },
    {
      id: 'baska-platform',
      yer: 'her-an',
      ad: '“Başka platformdayım” ya da “Kendi müşterim var” dedi',
      adimlar: [
        'Diğer platformu kötülemeyin.',
        '“istoc.com sizi yeni toptan alıcılara da gösterir.” deyin.',
        'Şu anda hangi şehre ya da müşteri grubuna ulaşamadığını sorun.',
      ],
      kart: 'Satıcının kullandığı diğer platformu ya da satış kanalını yazın.',
    },
    {
      id: 'zaman-yok',
      yer: 'her-an',
      ad: '“Zamanım yok” dedi',
      adimlar: ['Kurulumun yarım saat sürdüğünü söyleyin.', { metin: 'Yine zamanı yoksa ürün listesini göndermesini isteyin. Liste gelince şu duruma geçin:', git: 'liste-gonderdi' }],
      kart: '“Sonraki adım” alanına sıradaki işi ve tarihini girin.',
    },
    {
      id: 'alici',
      yer: 'her-an',
      ad: 'Kaydı yapan kişi alıcı çıktı',
      adimlar: [
        'Ne aradığını ve kaç adet istediğini sorun.',
        'Hangi şehre ve ne zaman istediğini sorun.',
        'Talebi uygun satıcılara iletin.',
        'Alıcıya satıcı paketi önermeyin.',
      ],
      kart: 'Durumu “Alıcı” yapın. Talebi ve talebi ilettiğiniz satıcıları yazın.',
    },
    {
      id: 'istemiyorum',
      yer: 'her-an',
      ad: '“Beni aramayın” ya da “Mesaj istemiyorum” dedi',
      adimlar: ['Hemen kabul edin ve özür dileyin.', 'O kanaldan bir daha aramayın ve yazmayın.'],
      kart: 'O kanalın iletişim iznini kapatın.',
    },
    {
      id: 'sikayet',
      yer: 'her-an',
      ad: 'Şikâyet etti ya da kızdı',
      adimlar: [
        'Sözünü kesmeden dinleyin.',
        'Sorunu kendi cümlelerinizle tekrar edin.',
        'Çözebiliyorsanız çözün.',
        'Çözemiyorsanız aynı gün İsmail Karaca’ya iletin.',
        'Satıcıya ne zaman döneceğinizi söyleyin ve o zaman dönün.',
      ],
      kart: 'Şikâyeti, şikâyeti ilettiğiniz kişiyi ve dönüş tarihini yazın.',
    },
    {
      id: 'yanlis-numara',
      yer: 'her-an',
      ad: 'Yanlış numara ya da şüpheli kayıt',
      adimlar: ['Kayıttaki e-posta adresine bir kez yazın ve doğru numarayı isteyin.', 'Cevap gelmezse kaydı kapatın.'],
      kart: 'Durumu “Ulaşılamadı” yapın. Not olarak “yanlış numara” yazın.',
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
      ad: 'Vitrin yayında',
      metin: 'Merhaba [Ad] Bey ya da Hanım, vitrininiz yayında: [bağlantı]. Şu an [n] ürününüz görünüyor. Eksik kalan [ürün grubu] ürünlerinizi de ekleyelim mi?',
    },
    {
      id: 'deger-ozeti',
      ad: 'İlk günlerin özeti',
      konu: 'istoc.com’daki ilk günlerinizin özeti',
      metin: `Merhaba [Ad] Bey ya da Hanım,\n\nİlk günlerinizin özeti:\n- Yayındaki ürün: [n]\n- Vitrin görüntülenmesi: [n]\n- Gelen mesaj ya da talep: [n]\n\nKaydınızın ilk 14 günü [tarih] tarihinde doluyor. O gün on beş dakika konuşalım. [Gün] günü saat [saat] size uygun mu?\n\n${IMZA}`,
    },
    {
      id: 'teklif',
      ad: 'Teklif e-postası',
      konu: 'Konuştuğumuz paket',
      metin: `Merhaba [Ad] Bey ya da Hanım,\n\nKonuştuğumuz gibi ${std.ad} paketle devam ediyoruz.\n- Aylık ücret: ${eur(std.aylikEur!)}\n- Yıllık peşin: ${eur(std.yillikEur!)} (12 ay için ${p.annualMonths} ayın ücreti)\n- Türk lirası karşılığı ödeme günündeki kurla hesaplanır.\n\nÖdemeyi şöyle yapabilirsiniz: [ödeme adımı]\n\n${IMZA}\n\nBu tür e-postaları almak istemiyorsanız “istemiyorum” yazmanız yeterlidir.`,
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
      metin: `Merhaba [Ad] Bey ya da Hanım,\n\nistoc.com kaydınız için sizi birkaç kez aradım ama ulaşamadım. Yardım isterseniz uygun bir gün ve saati bu e-postaya yazın. Sizi o saatte arayayım. Cevap gelmezse sizi yeniden aramayacağım.\n\n${IMZA}`,
    },
  ];
  return Object.fromEntries(liste.map((s) => [s.id, s]));
}
