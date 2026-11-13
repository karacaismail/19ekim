/**
 * Gelir modelleri (kullanıcı kararı 3 Kasım 2026, yeniden düzen 13 Kasım 2026): istoc.com’un bugünkü tek gelir modeli
 * (abonelik, üç paket) ve bir B2B toptan pazar yerine eklenebilecek aday gelir modelleri. Sayfa modelleri hazırlık
 * durumuna göre üç grupta gösterir. Her grup okura ne yapacağını söyler (`HAZIRLIK_EYLEMI`). Örnek hesaplar yöntemi gösteren varsayımlardır, söz ya da hedef
 * değildir. İhracat altyapısı (yazılım, gümrük, mikro ihracat operasyonu) hazır değildir: ihracatla ilgili hiçbir model
 * hazır gibi sunulmaz. Açıklamalar tam cümledir, noktalı virgül ve uzun çizgi kullanılmaz (`tests/gelir-modelleri.spec.ts`).
 *
 * Kullanıcı kararları 13 Kasım 2026 (fiyat tablosu ve gelir önerisi): ücretsiz paket gelecek, Basic pakete CRM eki
 * satılır, Platinium paket teklif isteğine yanıt verir, Basic pakette beden ve renk seçeneği yoktur. Ek hizmetlerin ilk
 * fiyatları onaylandı (`ILK_FIYAT_EUR`). “Öne çıkan” kutusunu yalnız İstoç çalışanı işaretler.
 * Aynı günün ikinci kararları (karar listesi 5.3, 9.1 ile 9.7): paket adları istoc.com’daki gibidir (Basic, Platinium,
 * Enterprise). Buybox önceliği yalnız onaylı markaya satılır ve marka sahibine verilir (“Marka sahibi önceliği”). Marka
 * kendi vitrininde ürün seçebilir, bu ayrı ve ücretli bir haktır. Alıcı paketi ileri tarihli bir gelir modelidir.
 * Satıştan komisyon alınmaz. Bu yüzden işlem komisyonu modeli sayfada yoktur. Emanet ödeme ileri tarihli bir özelliktir.
 * Kararlar istoc.com’da henüz uygulanmadı.
 */
import { CANLI_PAKETLER, type PaketId } from './canliPaketler';
import type { Params } from './params';

/** Hazırlık durumu: bugün satılabilir mi? */
export type Hazirlik = 'hazir' | 'yakinda' | 'hazir-degil';
/** Öncelik: 1 = ilk denenecek üç model, 3 = altyapı hazır olunca. */
export type Oncelik = 1 | 2 | 3;

export const HAZIRLIK_ADI: Record<Hazirlik, string> = {
  hazir: 'Hazır',
  yakinda: 'Yakında',
  'hazir-degil': 'Hazır değil',
};

export const HAZIRLIK_TANIMI: Record<Hazirlik, string> = {
  hazir: 'Bugünkü ekiple ve yazılım geliştirmeden başlatılabilir.',
  yakinda: 'Küçük bir yazılım geliştirmesi ya da bir ortakla anlaşma gerekir.',
  'hazir-degil': 'Yazılım, lisans, ortak ya da operasyon eksiktir.',
};

/** Her hazırlık grubunda okurun yapacağı iş. Okur satış ekibidir, “siz” diye hitap edilir. */
export const HAZIRLIK_EYLEMI: Record<Hazirlik, string> = {
  hazir: 'Bu hizmeti esnafa bugün sunabilirsiniz.',
  yakinda: 'Bu modeller henüz satılamaz. Esnafa tarih ya da söz vermeyin.',
  'hazir-degil': 'Bu modeller bugün satılamaz. İhracat hizmetleri de bu gruptadır. Esnafa söz vermeyin.',
};

/** Öncelik etiketi: modelin ne zaman denenmesi önerilir? */
export const ONCELIK_ADI: Record<Oncelik, string> = {
  1: 'İlk denenecek',
  2: 'Sonra denenecek',
  3: 'Altyapı hazır olunca',
};

export interface Paket {
  /** İç kimlik. Onboarding bu kimliği kullanır. Görünen ad istoc.com’daki addır (`ad`). */
  id: 'standart' | 'pro' | 'kurumsal';
  ad: string;
  /** Aylık ücret (€); Enterprise için yok (teklif). */
  aylikEur: number | null;
  /** Yıllık peşin ücret (€): aylık ücret × yıllık pakette ücreti alınan ay. */
  yillikEur: number | null;
  not: string;
}

/** Paketlerin istoc.com’daki adları (kullanıcı kararı 13 Kasım 2026, 5.3). Adlar canlı paket verisinden gelir. */
const canliAd = (id: PaketId) => CANLI_PAKETLER.find((p) => p.id === id)!.ad;
export const BASIC = canliAd('basic');
export const PLATINIUM = canliAd('platinium');
export const ENTERPRISE = canliAd('enterprise');

/** Platinium paketin aylık ücreti (€). Henüz Parametreler’de değildir. */
export const PRO_AYLIK_EUR = 599;

export const eur = (n: number) => `${n.toLocaleString('tr-TR')} €`;

/** Kararların alındığı gün. */
export const KARAR_TARIHI = '13 Kasım 2026';

/** Basic pakete CRM ekinin aylık ücreti (€). Kullanıcı kararı 13 Kasım 2026. Yıllık ücret Parametreler’deki ay sayısıyla hesaplanır. */
export const CRM_EKI_AYLIK_EUR = 99;

/** Ek hizmetlerin onaylanan ilk fiyatları (€). Kullanıcı kararı 13 Kasım 2026. Esnafla denenmedi. */
export const ILK_FIYAT_EUR = { kurulum: 150, denetim: 150, ek: 30, vitrin: 150, oneCikarma: 50, teklif: 5 } as const;

/** Ücretsiz paketteki kayıtlı ürün sınırı. */
export const UCRETSIZ_URUN = 50;

/** Ücretsiz paketin sınırları (kullanıcı kararı 13 Kasım 2026). Paket bugün istoc.com’da yok. */
export const UCRETSIZ_SINIRLAR: { ad: string; deger: string }[] = [
  { ad: 'Aylık ücret', deger: eur(0) },
  { ad: 'Süre', deger: 'Süresiz' },
  { ad: 'Kayıtlı ürün', deger: String(UCRETSIZ_URUN) },
  { ad: 'Alt kullanıcı', deger: '1' },
  { ad: 'Satış bölgesi', deger: 'Türkiye' },
  { ad: 'Dosya depolama', deger: '500 MB (megabayt)' },
  { ad: 'Dosyayla toplu ürün yükleme', deger: 'Yok' },
  { ad: 'Şirket doğrulama rozeti', deger: 'Var' },
  { ad: 'Teklif isteklerini görme', deger: 'Var' },
  { ad: 'Teklif isteğine yanıt', deger: 'Yok' },
  { ad: 'CRM', deger: 'Yok' },
];

/** Paket kararını kimin uygulayacağı. */
export type KararIsi = 'ayar' | 'yazilim' | 'degisiklik-yok';
export const KARAR_ISI_ADI: Record<KararIsi, string> = {
  ayar: 'Yönetici ayarı yeter',
  yazilim: 'Yazılım işi gerekir',
  'degisiklik-yok': 'Değişiklik yok',
};

export interface PaketKarari {
  id: string;
  ad: string;
  is: KararIsi;
  metin: string[];
  /** Kararın ayrıntısını gösteren sayfa. */
  bag?: { metin: string; yol: string };
  sinirlar?: { ad: string; deger: string }[];
}

/** Paketler için alınan kararlar (kullanıcı kararı 13 Kasım 2026). istoc.com’daki paketler henüz değişmedi. */
export function paketKararlari(p: Pick<Params, 'annualMonths'>): PaketKarari[] {
  return [
    {
      id: 'ucretsiz',
      ad: 'Ücretsiz paket gelecek',
      is: 'yazilim',
      metin: [
        'Satıcı istoc.com’u ücretsiz kullanmaya başlar. Satıcı teklif isteklerini görür.',
        'Satıcı teklif vermek için ücretli paket alır.',
        'Bugün yazılım bu paketi açamaz. Yazılımcı dört işi bitirince paket açılır. Esnafa tarih vermeyin.',
      ],
      sinirlar: UCRETSIZ_SINIRLAR,
    },
    {
      id: 'teklif-yaniti',
      ad: `${PLATINIUM} paket de teklif isteğine yanıt verecek`,
      is: 'ayar',
      metin: [`Bugün yalnız ${ENTERPRISE} paket teklif isteğine yanıt verir.`, 'istoc.com yöneticisi bu ayarı paket ekranından yapar. Yazılım işi gerekmez.'],
    },
    {
      id: 'crm-eki',
      ad: `${BASIC} pakete CRM eki`,
      is: 'ayar',
      metin: [
        `${BASIC} paketi kullanan satıcı CRM’i ayda ${eur(CRM_EKI_AYLIK_EUR)} ek ücretle alır.`,
        `Satıcı yıllık peşin ödemede ${eur(CRM_EKI_AYLIK_EUR * p.annualMonths)} öder.`,
        `Satıcı ${PLATINIUM} pakete geçerse ekip ek ücreti durdurur. Çünkü ${PLATINIUM} pakette CRM zaten vardır.`,
      ],
      bag: { metin: 'CRM ekini görün', yol: '#model-crm-eki' },
    },
    {
      id: 'varyant',
      ad: `${BASIC} pakette beden ve renk seçeneği yok`,
      is: 'degisiklik-yok',
      metin: [`Beden ve renk seçeneği ${PLATINIUM} paketten başlar. Bu durum değişmeyecek.`],
    },
    {
      id: 'komisyon',
      ad: 'Satıştan komisyon alınmayacak',
      is: 'degisiklik-yok',
      metin: ['Bugün satıştan komisyon alınmıyor. Bu durum değişmeyecek.', 'Emanet ödeme ileride ayrı bir özellik olarak gelecek.'],
      bag: { metin: 'Emanet ödemeyi görün', yol: '#model-guvenli-odeme' },
    },
    {
      id: 'alici-paketi',
      ad: 'Alıcı paketi gelecek',
      is: 'yazilim',
      metin: [
        'Alıcı ek özellikler için ücretli bir paket alabilecek.',
        'Paketin özellikleri ve fiyatı henüz belirlenmedi.',
        'Yazılım işi, otomatik test ve yayın düzeni (CI/CD) bitince başlar. Alıcıya tarih vermeyin.',
      ],
      bag: { metin: 'Alıcı paketini görün', yol: '#model-alici-paketi' },
    },
    {
      id: 'tablo',
      ad: 'Paket tablosundaki karşılıksız satırlar işaretlenecek',
      is: 'ayar',
      metin: [
        'Bazı satırların yazılımda karşılığı yok. Bazı satırlar da pakete bağlı değil.',
        'istoc.com yöneticisi bu satırların yanına “Yakında” ya da “Hazır değil” yazar.',
        'Hizmetler sayfasındaki tablo bu satırları bugünden işaretler.',
      ],
      bag: { metin: 'İşaretli satırları görün', yol: '/services/#karsilastirma' },
    },
  ];
}

/** Bugünkü abonelik paketleri; Basic ücreti ve yıllık pakette ücreti alınan ay Parametreler’den gelir. */
export function paketler(p: Pick<Params, 'subscriptionEur' | 'annualMonths'>): Paket[] {
  const yillik = (aylik: number) => aylik * p.annualMonths;
  return [
    {
      id: 'standart',
      ad: BASIC,
      aylikEur: p.subscriptionEur,
      yillikEur: yillik(p.subscriptionEur),
      not: `Yıllık peşin ödemede ${eur(yillik(p.subscriptionEur))} ödenir. Bu tutar ${p.annualMonths} aylık ücrete eşittir.`,
    },
    {
      id: 'pro',
      ad: PLATINIUM,
      aylikEur: PRO_AYLIK_EUR,
      yillikEur: yillik(PRO_AYLIK_EUR),
      not: `Yıllık peşin ödemede ${eur(yillik(PRO_AYLIK_EUR))} ödenir. Bu tutar ${p.annualMonths} aylık ücrete eşittir.`,
    },
    {
      id: 'kurumsal',
      ad: ENTERPRISE,
      aylikEur: null,
      yillikEur: null,
      not: 'Fiyat, satıcının ihtiyacına göre teklifle belirlenir. Satıcı fiyat için teklif alır.',
    },
  ];
}

export interface GelirModeli {
  id: string;
  ad: string;
  /** Nasıl çalışır (1–2 cümle). */
  nasil: string;
  /** Onaylanan ilk fiyat (kullanıcı kararı 13 Kasım 2026). Kartta “İlk fiyat” adıyla görünür. */
  fiyat?: string;
  /** Örnek hesap: birimlidir, söz değildir. Kartta “Örnek hesap (varsayımdır, söz değildir)” başlığı altında görünür. */
  ornek: string;
  /** Kim öder? */
  kimOder: string;
  /** istoc.com’a uygunluk. */
  uygunluk: string;
  risk: string;
  /** Başlamak için ne gerekir? */
  gereken: string;
  hazirlik: Hazirlik;
  oncelik: Oncelik;
}

export const MODELLER: GelirModeli[] = [
  {
    id: 'guvenli-odeme',
    ad: 'Güvenli ödeme ve emanet hesabı',
    nasil:
      'Alıcının ödemesi lisanslı bir ödeme kuruluşunda bekletilir. Mal teslim edilip alıcı onaylayınca para satıcıya geçer. Bu özellik ileri tarihli bir özellik setinde gelecek.',
    ornek: 'Hizmet bedeli henüz karara bağlanmadı. Ayda 100 işlem yapılabilir. İşlem başına ortalama tutar 20.000 ₺ olabilir. Hizmet bedeli %0,5 olursa ayda 10.000 ₺ gelir olur. Ödeme kuruluşunun kesintisi bu hesaba dahil değildir.',
    kimOder: 'Satıştan komisyon alınmaz. Emanet ödemenin hizmet bedeli olacaksa bedeli kimin ödeyeceği sözleşmede belirlenir.',
    uygunluk: 'Yeni müşteriden parayı alamama riski esnafın en büyük sıkıntılarından biridir. Bu yüzden güçlü bir değer önerisidir.',
    risk: 'Platform parayı kendisi tutamaz. Lisanslı bir ödeme kuruluşuyla sözleşme, iade ve itiraz süreçleri gerekir.',
    gereken: 'Lisanslı bir ödeme kuruluşu ortağı, sözleşme ve platformda çalışan bir ödeme akışı gerekir.',
    hazirlik: 'hazir-degil',
    oncelik: 2,
  },
  {
    id: 'vadeli-satis',
    ad: 'Vadeli satış ve tedarik zinciri finansmanı',
    nasil:
      'Alıcı malı vadeli alır, satıcı ise parasını peşin alır. Aradaki finansmanı bir banka ya da finans şirketi sağlar. Platform, yönlendirdiği her işlem için ortaktan komisyon alır.',
    ornek: 'Ayda 500.000 ₺ tutarında vadeli işlem yönlendirilebilir. Ortak platforma %0,3 komisyon öderse ayda 1.500 ₺ gelir olur.',
    kimOder: 'Komisyonu finans ortağı öder. Finansman maliyetini alıcı ya da satıcı üstlenir.',
    uygunluk: 'Toptan ticarette vadeli satış yaygındır. Bu yüzden esnaf için değeri yüksektir.',
    risk: 'Kredi riski ortakta kalmalıdır. Yanlış sunulursa platform borç tahsilatına karışmış gibi görünür.',
    gereken: 'Banka ya da finans şirketiyle ortaklık, alıcı ve satıcı doğrulaması ve platformda sipariş verisi gerekir.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
  {
    id: 'sponsorlu-urun',
    ad: 'Sponsorlu ürün ve öne çıkarma',
    nasil:
      'Satıcı, ürününün arama sonuçlarında ya da kategori sayfasında üstte görünmesi için ücret öder. Ücret belirli bir süre için sabit olabilir ya da tıklama başına alınabilir.',
    fiyat: `Ayda ${eur(ILK_FIYAT_EUR.oneCikarma)}`,
    ornek: `40 satıcı ayda ${eur(ILK_FIYAT_EUR.oneCikarma)} tutarında öne çıkarma paketi alabilir. Bu durumda ayda ${eur(40 * ILK_FIYAT_EUR.oneCikarma)} ek gelir olur.`,
    kimOder: 'Satıcı öder.',
    uygunluk: 'Abonelik ödeyen satıcı tabanına eklenir. Satıcı karşılığını gösterim, tıklama ve mesaj sayısıyla görebilir.',
    risk: 'Platforma az alıcı gelirse satıcı karşılık göremez ve paketi yenilemez. Sponsorlu sonuçlar alıcıya açıkça etiketlenmelidir.',
    gereken:
      'Bugün her satıcı ürün formundaki “Öne çıkan” kutusunu kendisi işaretleyebiliyor. Karara göre bu kutuyu yalnız İstoç çalışanı işaretleyecek. Satıcı önce ücreti öder. Bu değişikliği yazılımcı yapar. “Sponsorlu” etiketi ve satıcıya gösterim ile tıklama raporu da gerekir.',
    hazirlik: 'yakinda',
    oncelik: 1,
  },
  {
    id: 'kategori-vitrini',
    ad: 'Kategori vitrini sponsorluğu',
    nasil: 'Bir kategorinin vitrin alanı belirli bir süre için tek bir satıcıya ya da markaya kiralanır. Örneğin tekstil kategorisinin üst bölümü kiralanabilir.',
    fiyat: `Vitrin başına ayda ${eur(ILK_FIYAT_EUR.vitrin)}`,
    ornek: `8 kategori vitrini olabilir. Her vitrinin aylık ücreti ${eur(ILK_FIYAT_EUR.vitrin)} olabilir. Hepsi dolarsa ayda ${eur(8 * ILK_FIYAT_EUR.vitrin)} gelir olur.`,
    kimOder: 'Satıcı, üretici ya da marka öder.',
    uygunluk: 'İstoç çarşısında kategorisinde güçlü toptancılar vardır. Vitrin onlara görünürlük sağlar.',
    risk: 'Vitrin sayısı sınırlı olduğu için gelirin tavanı düşüktür. Az satıcı alırsa vitrin boş kalır.',
    gereken: 'Kategori sayfalarında vitrin alanı ve süreli yayın yönetimi gerekir.',
    hazirlik: 'yakinda',
    oncelik: 2,
  },
  {
    id: 'marka-sahibi',
    ad: 'Marka sahibi önceliği',
    nasil:
      'Bir markanın ürününü birkaç satıcı satabilir. Markanın sahibi de bu ürünü satıyorsa ürün sayfasında ilk sırada görünür. Alıcı bu satıcının yanında “Marka sahibi” yazısını görür.',
    ornek: 'Fiyat henüz belirlenmedi. Bu yüzden gelir hesabı yapılmadı.',
    kimOder: 'Marka sahibi öder. Bu hizmet yalnız onaylı markalara satılır.',
    uygunluk: 'Alıcı ürünün gerçek olduğunu bilmek ister. Ürünü marka sahibinden almak bu güveni verir.',
    risk: 'Alıcı ilk sıradaki satıcının neden orada olduğunu bilmelidir. Bu yüzden “Marka sahibi” yazısı her zaman görünmelidir. Alıcı diğer satıcıları da görüp seçebilmelidir. Marka sahibinin stoğu biterse ilk sıra sonraki satıcıya geçmelidir.',
    gereken:
      'Bugün sıralama fiyata, teslim süresine ve satıcı puanına bakıyor. Yazılımcı marka sahibini de sıralamaya eklemelidir. Marka önce onaylı marka olmalıdır.',
    hazirlik: 'yakinda',
    oncelik: 2,
  },
  {
    id: 'marka-vitrini',
    ad: 'Marka vitrininde ürün seçimi',
    nasil:
      'Onaylı marka kendi vitrin sayfasında hangi ürünlerin öne çıkacağını seçer ve sıralar. Bu, ayrı ve ücretli bir haktır.',
    ornek: 'Fiyat henüz belirlenmedi. Bu yüzden gelir hesabı yapılmadı.',
    kimOder: 'Onaylı marka öder.',
    uygunluk: 'Marka kendi ürünlerini en iyi bilir. Vitrin markanın kendi sayfasıdır, bütün sitenin vitrini değildir.',
    risk: 'Bu hak ana sayfadaki genel “Öne çıkan” kutusuyla karıştırılmamalı. Genel kutuyu yalnız İstoç çalışanı işaretler.',
    gereken: 'Marka sayfası yazılımda var. Yazılımcı markanın ürün seçip sıralayacağı bir ekran yapmalıdır. Ücret kuralı da gerekir.',
    hazirlik: 'yakinda',
    oncelik: 2,
  },
  {
    id: 'dogrulanmis-tedarikci',
    ad: 'Doğrulanmış tedarikçi rozeti',
    nasil:
      'Satıcının vergi kaydı, adresi ve dükkânı ya da deposu ücretli bir denetimle kontrol edilir. Denetimi geçen satıcının profilinde rozet görünür.',
    fiyat: `Yılda ${eur(ILK_FIYAT_EUR.denetim)}`,
    ornek: `30 satıcı yılda bir kez ${eur(ILK_FIYAT_EUR.denetim)} denetim ücreti öderse yılda ${eur(30 * ILK_FIYAT_EUR.denetim)} gelir olur.`,
    kimOder: 'Satıcı öder.',
    uygunluk: 'Yeni alıcı güven arar. Saha ekibi denetimi dükkân ziyaretinde yapabilir.',
    risk: 'Rozet verilen satıcı sorun çıkarırsa platformun güvenilirliği zarar görür. Denetim ölçütü yazılı ve herkes için aynı olmalıdır.',
    gereken: 'Yazılı denetim listesi, profilde rozet alanı ve yıllık yenileme kuralı gerekir.',
    hazirlik: 'yakinda',
    oncelik: 2,
  },
  {
    id: 'rfq',
    ad: 'Talep toplama ve teklif talebi ücreti',
    nasil:
      'Alıcıların satın alma talepleri toplanır. Bunlara RFQ (teklif talebi) denir. Talebe teklif vermek isteyen satıcı talep başına ücret öder. Bunun yerine satıcının aboneliğine belirli sayıda talep hakkı da eklenebilir.',
    fiyat: `Her istek için ${eur(ILK_FIYAT_EUR.teklif)}`,
    ornek: `Ayda 200 talep gelebilir. Her talebe ortalama 3 satıcı ${eur(ILK_FIYAT_EUR.teklif)} ödeyerek teklif verebilir. Bu durumda ayda ${eur(200 * 3 * ILK_FIYAT_EUR.teklif)} gelir olur.`,
    kimOder:
      `Yanıt hakkı paketinde olmayan satıcı öder. Karara göre ${PLATINIUM} ve ${ENTERPRISE} paketlerde bu hak paketin içinde olacak. Alıcı talebini ücretsiz bırakır.`,
    uygunluk: '“Değer önerisi” sayfasındaki “Gerçek alıcılardan hazır sipariş fırsatları” sözüyle aynı yöndedir.',
    risk: 'Talepler zayıfsa satıcı para öder ama satış yapamaz. Bu durum aboneliği de kaybettirebilir.',
    gereken: 'Platforma yeterli alıcı gelmesi gerekir. Talep formu ve talepleri doğrulayan bir CRM (müşteri ilişkileri yönetimi) süreci de gerekir.',
    hazirlik: 'yakinda',
    oncelik: 2,
  },
  {
    id: 'eklentiler',
    ad: 'Eklentiler (ek kullanıcı, ek ürün sınırı ve yazılım bağlantısı)',
    nasil:
      'Paketin üzerine küçük ücretli ekler satılır. Ek kullanıcı hesabı ve daha yüksek ürün sınırı bunlara örnektir. Stok ve fiyatların ERP ya da muhasebe programıyla kendiliğinden aynı tutulması da bir ektir. ERP, kurumsal kaynak planlama yazılımıdır.',
    fiyat: `Her ek için ayda ${eur(ILK_FIYAT_EUR.ek)}`,
    ornek: `100 abone satıcının 25’i ayda ${eur(ILK_FIYAT_EUR.ek)} tutarında ek alabilir. Bu durumda ayda ${eur(25 * ILK_FIYAT_EUR.ek)} ek gelir olur.`,
    kimOder: 'Satıcı öder.',
    uygunluk: 'Abonelik modelinin doğal uzantısıdır. Büyüyen satıcı daha çok öder.',
    risk: 'Satıcı, temel pakette olmasını beklediği bir şey için ek ücret öderse kendini cezalandırılmış hisseder. Yazılım bağlantısının bakımı sürekli emek ister.',
    gereken: 'Paket sınırları yazılı olmalıdır. Ek satın alma ekranı gerekir. En az bir muhasebe yazılımıyla bağlantı da gerekir.',
    hazirlik: 'yakinda',
    oncelik: 1,
  },
  {
    id: 'kurulum-egitim',
    ad: 'Kurulum ve eğitim hizmeti',
    nasil:
      'Ekip satıcının ürünlerini, fotoğraflarını, açıklamalarını ve toptan fiyatlarını platforma girer. Ekip satıcıya ve çalışanına kısa bir kullanım eğitimi verir. Bu iş tek seferlik ücretle satılır.',
    fiyat: `Bir kez ${eur(ILK_FIYAT_EUR.kurulum)}`,
    ornek: `Ayda 20 yeni satıcı gelebilir. Yarısı ${eur(ILK_FIYAT_EUR.kurulum)} tutarında kurulum paketi alırsa ayda ${eur(10 * ILK_FIYAT_EUR.kurulum)} gelir olur.`,
    kimOder: 'Satıcı öder.',
    uygunluk: '“Değer önerisi” sayfasındaki “Ürünlerinizi biz dijital satışa hazırlayalım” sözüyle aynıdır. Kurulumu yapılmış satıcının aboneliği bırakma olasılığı düşebilir.',
    risk: 'Emek isteyen bir iştir. Fiyat düşük kalırsa ekibin zamanı zararına harcanır.',
    gereken: 'Yazılım gerekmez. Ekip saati, fiyat listesi ve kurulum kontrol listesi yeterlidir.',
    hazirlik: 'hazir',
    oncelik: 1,
  },
  {
    id: 'crm-eki',
    ad: `${BASIC} pakete CRM eki`,
    nasil: `${BASIC} paketi kullanan satıcı CRM bölümünü ayrı ücretle alır. CRM, gelen mesajları ve teklif isteklerini müşteri kaydına çevirir.`,
    fiyat: `Ayda ${eur(CRM_EKI_AYLIK_EUR)}`,
    ornek: `${BASIC} paketi kullanan 100 satıcının 20’si CRM eki alabilir. Bu durumda ayda ${eur(20 * CRM_EKI_AYLIK_EUR)} ek gelir olur.`,
    kimOder: `${BASIC} paketi kullanan satıcı öder. ${PLATINIUM} ve ${ENTERPRISE} paketlerde CRM zaten vardır.`,
    uygunluk: `Yalnız CRM isteyen satıcı ${PLATINIUM} pakete geçmeden CRM kullanır. ${BASIC} paket ve CRM eki birlikte ${PLATINIUM} paketten ucuzdur.`,
    risk: `Bu ayar canlıda henüz denenmedi. Satıcı ${PLATINIUM} pakete geçerse ekip ek ücreti durdurmalıdır.`,
    gereken:
      `Yönetici CRM’i mağazanın abonelik kaydında açar. ${BASIC} paketin ayarında CRM satırı “kapalı” değeriyle bulunmalıdır. Ek ücret ayrı faturayla alınır.`,
    hazirlik: 'hazir',
    oncelik: 2,
  },
  {
    id: 'lojistik',
    ad: 'Anlaşmalı ucuz kargo',
    nasil:
      'Platform kargo firmalarıyla toplu fiyat anlaşması yapar. Satıcı bu indirimli fiyatla gönderir. Platform, kargo firmasıyla anlaştığı fiyat ile satıcıdan alınan fiyat arasındaki farkı alabilir. Ya da kargo firmasından aracılık payı alabilir.',
    ornek: 'Ayda 1.000 gönderi yapılabilir. Platform gönderi başına 10 ₺ kazanırsa ayda 10.000 ₺ gelir olur.',
    kimOder: 'Satıcı öder. Pay, kargo ücretinin içindedir.',
    uygunluk: 'Toptan gönderim esnafın günlük işidir. Daha ucuz kargo kolay anlaşılan bir faydadır.',
    risk: 'Marj küçüktür ve kargo firması koşulları değiştirebilir. Gecikme ve hasar şikâyetleri platforma döner.',
    gereken: 'En az bir kargo firmasıyla sözleşme ve gönderi oluşturma ekranı ya da indirim kodu gerekir.',
    hazirlik: 'yakinda',
    oncelik: 3,
  },
  {
    id: 'veri-raporlari',
    ad: 'Veri ve pazar raporları',
    nasil:
      'Platformdaki arama, talep ve fiyat verisinden kişisel veri içermeyen raporlar hazırlanır. Örneğin hangi ürünün hangi ilde arandığı raporlanır. Rapor abonelikle ya da tek tek satılır.',
    ornek: '20 satıcı ayda 25 € tutarında rapor aboneliği alırsa ayda 500 € gelir olur.',
    kimOder: 'Satıcı, üretici ya da marka öder.',
    uygunluk: 'Esnaf neyin satacağını bilmek ister. Ancak raporun değeri platformdaki veri miktarıyla artar.',
    risk: 'Veri azken rapor yanıltıcı olur. KVKK (Kişisel Verilerin Korunması Kanunu) kurallarına uyulmalı ve kişisel veri satılmamalıdır.',
    gereken: 'Yeterli arama ve talep verisi gerekir. Verilerden kişileri tanıtan bilgiler çıkarılmalı. Bir rapor şablonu da gerekir.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
  {
    id: 'eslestirme-etkinlikleri',
    ad: 'B2B eşleştirme etkinlikleri ve sponsorluk',
    nasil:
      'Alıcılar ve satıcılar belirli bir sektör için aynı gün, çarşıda ya da çevrim içi buluşturulur. Satıcı katılım ücreti öder ve etkinliğe sponsor da alınabilir.',
    ornek: 'Üç ayda bir etkinlik yapılabilir. 30 satıcının her biri 100 € katılım ücreti ödeyebilir. Etkinliğe 1.000 € sponsorluk gelebilir. Bu durumda etkinlik başına 4.000 € gelir olur. Salon ve ikram gibi giderler düşülmemiştir.',
    kimOder: 'Satıcı ve sponsor öder.',
    uygunluk: 'İstoç çarşısı fiziksel bir buluşma yeridir. Organizatör rolü bu işi üstlenebilir.',
    risk: 'Alıcı gelmezse satıcı memnun kalmaz ve sonraki etkinliğe katılmaz. Giderler önden ödenir.',
    gereken: 'Organizatör, davet edilecek alıcı listesi ve etkinlik takvimi gerekir.',
    hazirlik: 'yakinda',
    oncelik: 2,
  },
  {
    id: 'beyaz-etiket',
    ad: 'Toptancının kendi adıyla çalışan mağaza',
    nasil:
      'Büyük bir toptancıya ya da üreticiye bir B2B sipariş mağazası kurulur. Mağaza müşterinin kendi adı ve alan adıyla çalışır. Altyapı istoc.com’dur. Kurulum ücreti ve aylık lisans alınır.',
    ornek: '3 kurumsal müşteri olabilir. Her biri 2.000 € kurulum ücreti ödeyebilir. Her biri ayda 300 € lisans da ödeyebilir. Bu durumda ilk yıl 16.800 € gelir olur.',
    kimOder: 'Kurumsal müşteri öder.',
    uygunluk: `${ENTERPRISE} paketin doğal devamıdır. Fiyatı teklifle belirlenir.`,
    risk: 'Her müşteri özel istek getirir. Ürün ekibinin yükü artar ve ana platformdaki işler gecikebilir.',
    gereken: 'Her müşteriye ayrı alan açan bir altyapı gerekir. Alan adı ve marka ayarları da gerekir. Bir destek sözleşmesi yapılmalıdır.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
  {
    id: 'alici-paketi',
    ad: 'Alıcı paketi',
    nasil: 'Alıcı ek özellikler için ücretli bir paket alır. Alıcının bugünkü ücretsiz kullanımı sürer. Paketin özellikleri henüz belirlenmedi.',
    ornek: 'Özellikler ve fiyat belirlenmedi. Bu yüzden gelir hesabı yapılmadı.',
    kimOder: 'Paketi alan alıcı öder.',
    uygunluk: 'Araştırmaya göre talebi alıcı getirir. Bu yüzden alıcının temel kullanımı ücretsiz kalmalıdır.',
    risk: 'Alıcıdan ücret almak alıcıyı platformdan uzaklaştırabilir. Paket yalnız ek özellik satmalıdır.',
    gereken: 'Paketin özellikleri belirlenmeli. Yazılım işi, otomatik test ve yayın düzeni (CI/CD) bitince başlar.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
  {
    id: 'alacak-sigortasi',
    ad: 'Ticari alacak sigortası komisyonu',
    nasil:
      'Satıcının vadeli satışta alıcıdan alacağı para bir sigorta şirketi tarafından güvenceye alınır. Platform, lisanslı bir acente ortağı üzerinden yönlendirdiği poliçelerden komisyon alır.',
    ornek: '15 satıcı yılda 1.000 € prim ödeyebilir. Platformun payı %10 olursa yılda 1.500 € gelir olur.',
    kimOder: 'Primi satıcı öder. Komisyonu sigorta şirketi ya da acente öder.',
    uygunluk: 'Vadeli satış yapan toptancı için alacak riski gerçektir.',
    risk: 'Sigorta aracılığı lisans ister ve lisanssız aracılık yapılamaz. Bu yüzden lisanslı bir acente ortağı şarttır.',
    gereken: 'Lisanslı acente ya da sigorta şirketiyle ortaklık ve satıcı için başvuru akışı gerekir.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
  {
    id: 'ihracat',
    ad: 'İhracat hizmetleri',
    nasil: 'İleride yurt dışı satış için gümrük işlemleri, mikro ihracat ve uluslararası kargo ücretli olarak sunulabilir.',
    ornek: 'Varsayım kurulmadı. Hizmet hazır olmadığı için gelir hesabı yapılmadı.',
    kimOder: 'Henüz belirlenmedi.',
    uygunluk: 'Esnafın ilgisi olabilir. Ancak bugün bu hizmet sunulamaz ve esnafa söz verilmemelidir.',
    risk: 'Hazır olmayan bir hizmeti satmak güven kaybına ve yasal soruna yol açar.',
    gereken: 'İhracat yazılımı, gümrük müşavirliği ortağı, mikro ihracat operasyonu ve uluslararası kargo anlaşması gerekir. Bunların hiçbiri bugün hazır değildir.',
    hazirlik: 'hazir-degil',
    oncelik: 3,
  },
];

/** İlk denenecek üç model ve gerekçesi (öncelik 1 olanlar, bu sırayla). */
export const ONCELIK_ONERISI: { id: string; neden: string }[] = [
  {
    id: 'kurulum-egitim',
    neden: 'Yazılım gerektirmez ve bugün başlatılabilir. Satıcı ilk günden dolu bir mağazayla başlar. Bu da aboneliği sürdürme olasılığını artırabilir.',
  },
  {
    id: 'eklentiler',
    neden: 'Bugünkü abonelik ödemesine eklenir ve yeni bir satış konuşması gerektirmez. Büyüyen satıcı daha çok öder.',
  },
  {
    id: 'sponsorlu-urun',
    neden: 'Zaten ödeme yapan satıcılardan ek gelir sağlar. Sonuç gösterim ve tıklamayla ölçülür. Platforma gelen alıcı sayısı arttıkça değeri büyür.',
  },
];

export const ONCELIK_NOTU =
  'Satıştan komisyon alınmayacak. Bu, 13 Kasım 2026 kararıdır. Emanet ödeme ileride ayrı bir özellik olarak gelecek. Sipariş ve ödeme akışı çalışmadan emanet ödeme denenemez.';

/** Araştırma notu: temkinli dil, “kaynaklara göre”. Doğrulanmış pazar verisi değildir. */
export const ARASTIRMA_NOTU: string[] = [
  'Kaynaklara göre B2B pazar yerleri gelirini çoğunlukla birkaç modelin birleşiminden elde eder. Tek bir modele dayanmaz. Başlıca gelir modelleri şunlardır: abonelik, işlem komisyonu, reklam ve gömülü finans. Gömülü finans, ödeme, vade ve sigorta gibi finans hizmetlerinin platformun içinde sunulması demektir.',
  'Bain Capital Ventures bir değerlendirme yaptı. Buna göre büyük ve seyrek B2B siparişlerinde yüzdeyle alınan komisyon satıcıya adil gelmeyebilir. Bu durumda satıcı anlaşmayı platform dışına taşımaya yönelebilir.',
  'Kaynaklara göre Hindistan’ın büyük B2B pazar yeri IndiaMART, gelirinin büyük kısmını satıcı aboneliklerinden elde eder. Bu, istoc.com’un bugünkü abonelik modelinin sektörde karşılığı olduğunu düşündürür.',
  'Bu bilgiler genel kaynaklara dayanır. Doğrulanmış pazar verisi değildir.',
];

export const KISALTMALAR: { kisa: string; acik: string }[] = [
  { kisa: 'B2B', acik: 'İşletmeden işletmeye satış. Alıcı da satıcı da işletmedir.' },
  { kisa: 'RFQ', acik: 'Teklif talebi. Alıcının satın almak istediği ürün için satıcılardan fiyat istemesidir.' },
  { kisa: 'ERP', acik: 'Kurumsal kaynak planlama. Stok, satış ve muhasebeyi tek yerde yöneten yazılımdır.' },
  { kisa: 'CRM', acik: 'Müşteri ilişkileri yönetimi. Müşteri ve görüşme kayıtlarının tutulduğu sistemdir.' },
  { kisa: 'KVKK', acik: 'Kişisel Verilerin Korunması Kanunu.' },
];
