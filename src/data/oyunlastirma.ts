/**
 * Oyunlaştırma stratejileri (kullanıcı kararı 2026-11-04): istoc.com'un tavuk yumurta sorununu çözen ve platformu
 * sürdürülebilir kılan 8 yalın strateji. Uzun metin docs/oyunlastirma-yalin/ içindedir. Bu dosya sayfadaki kartları
 * ve pencerelerdeki adım adım uygulama yol haritasını verir. Rakamlar pilotta ayarlanacak örnek değerlerdir.
 *
 * Aynı gün ikinci karar: ChatGPT'nin ayrı analizindeki 8 strateji (docs/oyunlastirma/, S01–S08) de aynı kart ve pencere
 * biçiminde eklenir. Kartlar öneri sahibini “Claude” ya da “ChatGPT” etiketiyle gösterir. ChatGPT stratejilerinin
 * adımları kaynak dosyalardaki görev sırasından ve altı haftalık başlangıç planından (09-olcum-butce-ve-deneme.md)
 * özetlendi. Kaynakta adım adım yazılmayan bitiş ölçütleri, kaynağın ilerleme durumlarından türetildi.
 */

export type Kaynak = 'claude' | 'chatgpt' | 'gemini';
export const KAYNAK_ADI: Record<Kaynak, string> = { claude: 'Claude', chatgpt: 'ChatGPT', gemini: 'Gemini' };
export const KAYNAKLAR: Kaynak[] = ['claude', 'chatgpt', 'gemini'];
export type StratejiGrubu = 'tavuk-yumurta' | 'surdurulebilirlik' | 'chatgpt' | 'gemini';
export type Taraf = 'Satıcı' | 'Alıcı' | 'İki taraf' | 'Eşleşme' | 'Güven';
export type Sorumlu = 'Yönetim' | 'Saha ekibi' | 'Pazarlama' | 'Yazılım ekibi' | 'Talep sorumlusu' | 'Saha sorumlusu' | 'Alıcı' | 'Satıcı' | 'Alıcı ve satıcı';

export interface Adim {
  ad: string;
  /** Takvimde ne zaman: “Hafta 1”, “Hedef dolunca” gibi. */
  zaman: string;
  kim: Sorumlu;
  /** Ne yapılır: tek ya da iki cümle. */
  yapilan: string;
  /** Adım ne zaman bitmiş sayılır. */
  bitti: string;
}

export interface Strateji {
  id: string;
  kaynak: Kaynak;
  /** Kartın üst satırındaki kısa kimlik: “Strateji 3” ya da “S03”. */
  etiket: string;
  /** Yalnız ChatGPT stratejilerinde: ne zaman devreye girdiği (“İlk deneme”, “Engel görülünce”). */
  /** Uygulama zamanı, kısa bir cümle olarak: “Engel görülünce uygulanır”. Sonuna nokta konmaz. */
  asama?: string;
  no: number;
  grup: StratejiGrubu;
  ad: string;
  taraf: Taraf;
  ozet: string;
  amac: string;
  odul: string;
  adimlar: Adim[];
  olcut: string;
  dikkat: string;
}

export const GRUP_BASLIGI: Record<StratejiGrubu, { baslik: string; aciklama: string }> = {
  'tavuk-yumurta': {
    baslik: 'Claude: ilk alıcıyı ve ilk satıcıyı bulmak',
    aciklama: 'İlk dört strateji, alıcı ile satıcının birbirini beklediği başlangıç sorununu çözmeyi amaçlar. Önce satıcı gelir. Sonra satıcı kendi alıcısını getirir.',
  },
  surdurulebilirlik: {
    baslik: 'Claude: alıcıyı ve satıcıyı platformda tutmak',
    aciklama: 'Son dört strateji, gelen alıcının ve satıcının platformda kalmasını amaçlar. Aboneliğin yenilenmesini de amaçlar.',
  },
  chatgpt: {
    baslik: 'ChatGPT: gerçek talepten başlayan sekiz görev',
    aciklama: 'ChatGPT önce S01, S02 ve S03’ü aynı küçük ticaret grubunda birlikte denemeyi önerir. Diğer stratejiler belirli bir engel görülünce birer birer eklenir.',
  },
  gemini: {
    baslik: 'Gemini: komisyon, vade ve kargoyla çalışan beş strateji',
    aciklama: 'Gemini, puan ve rozet yerine doğrudan ticari teşvik önerir. Bu teşvikler komisyon, vade, lojistik, teklif önceliği ve çarşıdaki ada rekabetidir. Birinci amaç ilk alıcıyı ve satıcıyı bulmaktır. İkinci amaç, ilk eşleşmeden sonra ticaretin WhatsApp’a ve elden ödemeye kaymasını önlemektir. Gemini ilk adım olarak iki meslek grubuyla küçük bir deneme yapmayı önerir. Oranlar bu grupların kâr marjına göre ayarlanır. Stratejilerin çoğu, sipariş ve ödemenin platformda çalışmasını gerektirir.',
  },
};

export const ILKELER: string[] = [
  'Ayrı bir oyun ürünü kurulmaz. Oyun, mağaza panelindeki bir ilerleme çubuğu, bir rozet ve bir sayaçtır.',
  'Biriktirilen puan yoktur. Ödül doğrudan ticari değerdir: abonelik süresi, görünürlük ya da talep önceliği.',
  'Yalnız platformun bugün kaydedebildiği olay ödüllendirilir. Sipariş ve ödeme henüz platformda olmadığı için ödüller kayıt, ürün, teklif ve cevap olaylarına bağlıdır.',
  'Genel sıralama tablosu kurulmaz. Büyük toptancı ile küçük dükkân aynı listede yarışmaz.',
  'Şansa dayalı ödül verilmez. Çekiliş için Milli Piyango İdaresi izni gerekir.',
  'Her strateji ilk ayda tabloyla ve saha ekibiyle elle başlar. Yazılım, işe yaradığı görülünce yapılır.',
];

export const STRATEJILER: Strateji[] = [
  {
    id: 'kurucu-saticilar',
    kaynak: 'claude',
    etiket: 'Strateji 1',
    no: 1,
    grup: 'tavuk-yumurta',
    ad: 'Kurucu satıcılar',
    taraf: 'Satıcı',
    ozet: 'İlk 100 satıcıya numaralı “kurucu satıcı” unvanı verilir. Bu satıcılar, abonelik kesintisiz sürdükçe katıldıkları günün fiyatını öder. Erken katılan satıcı daha kârlı çıkabilir.',
    amac: 'Platform boşken satıcıya katılmak için somut bir neden vermek. Kontenjan dolunca aynı fırsat bir daha açılmaz.',
    odul: 'Satıcı numaralı kurucu satıcı unvanı alır. Abonelik kesintisiz sürdükçe katıldığı günün fiyatını öder. Ayda bir yapılan danışma toplantısına katılma hakkı da alır.',
    adimlar: [
      { ad: 'Kuralları yaz', zaman: 'Hafta 1', kim: 'Yönetim', yapilan: 'Kontenjan, sıra numarası koşulu ve fiyat güvencesinin bitiş koşulları tek sayfada yazılır.', bitti: 'Saha ekibi kuralları kapıda iki cümleyle anlatabiliyor.' },
      { ad: 'Kontenjan sayacını hazırla', zaman: 'Hafta 1', kim: 'Pazarlama', yapilan: 'Kalan kontenjanı gösteren bir sayfa ve basılı kart hazırlanır.', bitti: 'Sayaç her gün güncelleniyor.' },
      { ad: 'Sahada sun', zaman: 'Hafta 2–6', kim: 'Saha ekibi', yapilan: 'Saha ekibi seçilen sektördeki dükkânlara kurucu satıcılığı anlatır ve her ziyareti CRM kaydına işler.', bitti: 'Sektördeki her dükkân en az bir kez ziyaret edildi.' },
      { ad: 'Numarayı ver', zaman: 'Her gün', kim: 'Saha ekibi', yapilan: 'Mağaza vitrine hazır olunca sıra numarası tabloya ve mağaza sayfasına yazılır. Vergi numarası başına tek numara verilir.', bitti: 'Numara yalnız vitrine hazır mağazalarda görünüyor.' },
      { ad: 'İlk danışma toplantısını yap', zaman: '20 kurucu satıcıda', kim: 'Yönetim', yapilan: 'Kurucu satıcılarla toplanılır. Platformda önce neyin düzeltileceğine birlikte karar verilir.', bitti: 'Toplantı notu ve öncelik listesi kurucu satıcılarla paylaşıldı.' },
    ],
    olcut: '100 numaranın kaç günde dolduğu ve kurucu satıcıların abonelik yenileme oranı. Bu oran plan hedefi olan %70’in üstünde olmalı.',
    dikkat: 'Değer önerisi “satış yoksa ücret yok” der, fiyat planı ise aylık abonelik öngörür. Fiyat güvencesinin hangi fiyatı koruduğu bu çelişki çözülünce yazılır.',
  },
  {
    id: 'vitrine-hazir-magaza',
    kaynak: 'claude',
    etiket: 'Strateji 2',
    no: 2,
    grup: 'tavuk-yumurta',
    ad: 'Önce araç: vitrine hazır mağaza',
    taraf: 'Satıcı',
    ozet: 'Satıcı, platformda hiç alıcı yokken de işine yarayan bir dijital katalog alır. Satıcı panelinde 5 adımlık bir ilerleme çubuğu görünür. Satıcı 5 adımı bitirince mağazası alıcıya açılmaya hazır olur. Buna vitrine hazır mağaza denir.',
    amac: 'Satıcıyı alıcı gelene kadar platformda tutmak. Fiyat listesini WhatsApp’ta tek tek göndermek yerine tek bağlantıyla paylaşmak, satıcının zamanını hemen kurtarır.',
    odul: 'Satıcı alıcı aramalarında görünür. Dükkâna asılacak basılı QR levha alır. Saha ekibi ilk 20 ürünün fotoğrafını çeker.',
    adimlar: [
      { ad: 'Beş adımı tanımla', zaman: 'Hafta 1', kim: 'Yönetim', yapilan: 'Beş adım şunlardır: firma bilgisi, adres ve dükkân fotoğrafı, en az 20 ürün. Katalog en az 5 müşteriyle paylaşılır. Mağaza son 14 günde güncellenir.', bitti: 'Tanım, projedeki aktif satıcı tanımıyla aynı.' },
      { ad: 'Kontrol listesiyle başla', zaman: 'Hafta 1–2', kim: 'Saha ekibi', yapilan: 'Yazılım hazır olmadan saha ekibi beş adımı basılı listeyle takip eder.', bitti: 'Her satıcının hangi adımda olduğu tabloda görünüyor.' },
      { ad: 'Takılan satıcıyı bul', zaman: 'Her hafta', kim: 'Saha ekibi', yapilan: 'En çok takılınan adım bulunur. Ürün adımında takılan satıcının fotoğrafları saha ekibi tarafından çekilir.', bitti: 'Kayıttan vitrine hazıra geçen süre ölçülüyor.' },
      { ad: 'İlerleme çubuğunu yaz', zaman: 'Hafta 3–5', kim: 'Yazılım ekibi', yapilan: 'Mağaza panelinde sıradaki adımı ve tahmini süresini gösteren çubuk yapılır.', bitti: 'Çubuk beş adımı kendiliğinden işaretliyor.' },
      { ad: 'Aramayı bağla', zaman: 'Hafta 5–6', kim: 'Yazılım ekibi', yapilan: 'Aramada yalnız vitrine hazır mağazalar görünür. 14 gün güncellenmeyen mağaza “güncel” işaretini kaybeder.', bitti: 'Hazır olmayan mağaza aramada çıkmıyor.' },
    ],
    olcut: 'Kayıt olan satıcıların vitrine hazır olma oranı ve süresi. Projedeki ilk kurulum hedefi 48 saattir.',
    dikkat: 'Ürün sayısını doldurmak için kalitesiz ürün yüklenebilir. İlk 20 ürün saha ekibi ya da içerik denetimiyle kontrol edilir.',
  },
  {
    id: 'kendi-musterini-getir',
    kaynak: 'claude',
    etiket: 'Strateji 3',
    no: 3,
    grup: 'tavuk-yumurta',
    ad: 'Kendi müşterinizi getirin',
    taraf: 'Alıcı',
    ozet: 'Satıcı, kendi düzenli alıcılarını istoc.com mağazasına davet eder. Bu alıcılar satıcıda kalır. Her aktif alıcı satıcıya ödül kazandırır.',
    amac: 'Platformun ilk alıcılarını reklam yerine satıcıların mevcut müşterilerinden kazanmak. 100 satıcı 10’ar alıcı getirirse platformda reklamsız 1.000 alıcı olur.',
    odul: 'Satıcıya her 5 aktif alıcı için 1 ay ücretsiz abonelik, yılda en çok 3 ay. Alıcıya ilk teklif talebinde öncelikli cevap. Rakamlar örnektir.',
    adimlar: [
      { ad: 'Müşteri koruma sözünü yaz', zaman: 'Hafta 1', kim: 'Yönetim', yapilan: 'Söz şudur: “Senin mağazandan gelen müşteriyi rakibine yönlendirmeyiz.” Satıcıya müşterisinin başka kimseyi görmeyeceği söylenmez.', bitti: 'Söz kayıt sözleşmesinde yazılı.' },
      { ad: 'Kişisel bağlantı ver', zaman: 'Hafta 1–2', kim: 'Yazılım ekibi', yapilan: 'Her satıcıya kendi kodunu taşıyan bir mağaza bağlantısı verilir.', bitti: 'Bağlantıyla gelen alıcı o satıcının müşterisi olarak işaretleniyor.' },
      { ad: 'Daveti birlikte gönder', zaman: 'Hafta 2–6', kim: 'Saha ekibi', yapilan: 'Saha ekibi satıcıyla birlikte hazır bir WhatsApp mesajı gönderir. Mesaj şudur: “Fiyat listemiz artık burada, buradan teklif isteyebilirsiniz.”', bitti: 'Satıcı başına gönderilen davet sayısı tabloda.' },
      { ad: 'Aktif alıcıyı say', zaman: 'Her ay', kim: 'Pazarlama', yapilan: 'Vergi numarasıyla doğrulanmış ve 12 ay içinde o satıcıya teklif talebi göndermiş alıcı aktif sayılır.', bitti: 'Satıcı aylık mesajda kaç aktif alıcı getirdiğini görüyor.' },
      { ad: 'Ödülü ver ve maliyeti karşılaştır', zaman: 'Ay sonu', kim: 'Yönetim', yapilan: 'Ödülün maliyeti, reklamla gelen bir alıcının maliyetiyle karşılaştırılır.', bitti: 'Eşik ve üst sınır ilk denemenin verisine göre güncellendi.' },
    ],
    olcut: 'Birinci ölçüt, satıcı başına getirilen aktif alıcı sayısıdır. İkinci ölçüt, bu alıcıların başka bir satıcıya da teklif talebi gönderme oranıdır.',
    dikkat: 'Ödülün biçimi, abonelik mi işlem payı mı kararına bağlıdır. İşlem payına geçilirse ödül, satıcının getirdiği alıcıdan pay alınmaması olur.',
  },
  {
    id: 'sektor-doluluk-hedefi',
    kaynak: 'claude',
    etiket: 'Strateji 4',
    no: 4,
    grup: 'tavuk-yumurta',
    ad: 'Sektör doluluk hedefi',
    taraf: 'İki taraf',
    ozet: 'Bir sektörün satıcıları ortak bir hedefe birlikte ilerler. Örnek hedef 30 vitrine hazır mağaza ve 1.500 üründür. Hedef dolunca platform o sektör için 30 günlük alıcı reklamı verir.',
    amac: 'Alıcı reklamını, sektörde yeterli satıcı ve ürün olunca başlatmak. Böylece reklamla gelen alıcı boş bir sektörle karşılaşmaz.',
    odul: 'Hedef dolunca sektöre 30 günlük alıcı reklamı verilir. İkinci hedefte teklif günü, üçüncü hedefte ana sayfa vitrini açılır.',
    adimlar: [
      { ad: 'İlk sektörü seç', zaman: 'Hafta 1', kim: 'Yönetim', yapilan: 'Saha görüşmeleriyle tekrar siparişin sık ve ürünün standart olduğu sektör seçilir. Mümkünse tek bir blokla başlanır.', bitti: 'Sektör ve blok kararı yazılı.' },
      { ad: 'Hedefi ilan et', zaman: 'Hafta 1', kim: 'Pazarlama', yapilan: 'Örnek hedef 30 vitrine hazır mağaza ve 1.500 üründür. Sektör sayfasına herkese açık bir ilerleme çubuğu konur.', bitti: 'Satıcılar hedefe kaç mağaza kaldığını görüyor.' },
      { ad: 'Sahayı tek sektöre topla', zaman: 'Hafta 2–6', kim: 'Saha ekibi', yapilan: 'Saha ekibi aynı sektörde çalışır. Satıcılara her hafta durum mesajı gönderilir. Önce İleti Yönetim Sistemi (İYS) kaydı ve ret kontrolü yapılır.', bitti: 'Sektördeki dükkânların listesi ve durumu her hafta güncel.' },
      { ad: 'Hedef dolunca reklamı başlat', zaman: 'Hedef dolunca', kim: 'Pazarlama', yapilan: '30 günlük alıcı reklamı yalnız bu sektöre yönlendirilir.', bitti: 'Reklamla gelen alıcının aramasında en az 3 satıcı çıkıyor.' },
      { ad: 'İkinci hedefi aç', zaman: 'Reklam bitince', kim: 'Yönetim', yapilan: 'Örnek ikinci hedef 50 mağaza ve 100 aktif alıcıdır.', bitti: 'Yeni hedef sektör sayfasında ilan edildi.' },
    ],
    olcut: 'Sektörün kaç günde dolduğu ve alıcının ikinci kez gelme oranı. Dolu sektör ile dolmamış sektör karşılaştırılır.',
    dikkat: 'Sıralama tablosu kurulmaz. Satıcılar birbirine karşı değil, aynı hedef için birlikte oynar.',
  },
  {
    id: 'dukkan-qr',
    kaynak: 'claude',
    etiket: 'Strateji 5',
    no: 5,
    grup: 'surdurulebilirlik',
    ad: 'Dükkândaki QR koduyla tedarikçinizi kaydedin',
    taraf: 'Alıcı',
    ozet: 'Çarşıya gelen alıcı, dükkânın QR levhasını okutup satıcıyı tedarikçi defterine ekler. Şehrine dönünce aynı satıcıdan platformda teklif ister.',
    amac: 'Çarşıdaki tek ziyareti kalıcı bir dijital bağa çevirmek. Yönetime göre İSTOÇ’a günde yaklaşık 500.000 kişi girip çıkar.',
    odul: 'Alıcı, tedarikçisinin güncel fiyatını görür ve teklif isteyebilir. Satıcı için QR ile gelip teklif isteyen her alıcı “Kendi müşterinizi getirin” sayacına eklenir.',
    adimlar: [
      { ad: 'Çarşı izni al', zaman: 'Hafta 1', kim: 'Yönetim', yapilan: 'Dükkânlara levha asmak ve İstoç adını kullanmak için çarşı yönetiminden yazılı izin alınır.', bitti: 'İzin yazılı olarak dosyada.' },
      { ad: 'Levhaları bas', zaman: 'Hafta 2', kim: 'Pazarlama', yapilan: 'İlk sektördeki 20 dükkân için QR levha basılır. Levhada istoc.com’un kim olduğu açıkça yazılır.', bitti: '20 levha dükkânlarda asılı.' },
      { ad: 'QR’ı teklif formuna bağla', zaman: 'Hafta 2–4', kim: 'Yazılım ekibi', yapilan: 'Tedarikçi defteri hazır olana kadar QR, mağazanın teklif formunu açar.', bitti: 'QR ile gelen talep o satıcıya işaretleniyor.' },
      { ad: 'Sahada gözlemle', zaman: 'Hafta sonları', kim: 'Saha ekibi', yapilan: 'Saha ekibi çarşıda alıcılarla konuşur ve QR okutma deneyimini gözlemler.', bitti: 'Gözlem notları ve düzeltme listesi hazır.' },
      { ad: 'Tedarikçi defterini yap', zaman: 'Hafta 5–8', kim: 'Yazılım ekibi', yapilan: 'Alıcı satıcıyı kaydeder, güncel fiyatı görür ve fiyat değişince bildirim almayı seçebilir.', bitti: 'Alıcı kaydettiği satıcıdan tek dokunuşla teklif isteyebiliyor.' },
    ],
    olcut: 'Kaydettiği satıcıdan 60 gün içinde teklif isteyen alıcı oranı. Levhası olan ve olmayan benzer dükkânlar karşılaştırılır.',
    dikkat: 'Mağaza damgası toplamak gibi yürümeyi ödüllendiren görev konmaz. GPS kullanılmaz. QR konum verisi toplamaz.',
  },
  {
    id: 'teklif-cevap-rozeti',
    kaynak: 'claude',
    etiket: 'Strateji 6',
    no: 6,
    grup: 'surdurulebilirlik',
    ad: 'Teklif talebi ve 24 saat cevap rozeti',
    taraf: 'Eşleşme',
    ozet: 'Alıcının teklif talebi en çok üç satıcıya gider. Talepleri 24 saatte cevaplayan satıcı “Hızlı cevap” rozeti alır ve öne çıkar.',
    amac: 'Teklif talebinin hızlı ve işe yarar biçimde cevaplanması. Cevap alamayan alıcı bir daha talep göndermez.',
    odul: 'Satıcıya rozet ve talep dağıtımında öncelik. Alıcıya 24 saat içinde karşılaştırılabilir en çok üç teklif.',
    adimlar: [
      { ad: 'Talep formunu sadeleştir', zaman: 'Hafta 1', kim: 'Yazılım ekibi', yapilan: 'Ürün, miktar, teslim şehri ve istenen tarih zorunlu alan olur. Eksik talep gönderilmez.', bitti: 'Gelen her talepte dört bilgi de var.' },
      { ad: 'Talebi elle dağıt', zaman: 'Hafta 1–4', kim: 'Pazarlama', yapilan: 'Ekip her talebi en çok üç satıcıya iletir. 24 saatte cevap gelmezse satıcıyı arar.', bitti: 'Her talebin kime gittiği ve ne zaman cevaplandığı tabloda.' },
      { ad: 'Cevap kalitesini koru', zaman: 'Hafta 1–4', kim: 'Pazarlama', yapilan: 'Cevapta fiyat, en az sipariş adedi ve teslim süresi zorunludur. Yalnız “arayın” yazmak cevap sayılmaz.', bitti: 'Eksik cevaplar satıcıya geri gönderiliyor.' },
      { ad: 'Rozeti ver', zaman: 'Hafta 5', kim: 'Yönetim', yapilan: 'Satıcı son 90 günde en az 5 talep almış olmalıdır. Bu taleplerin en az %90’ına 24 saatte cevap vermiş olmalıdır. Bu satıcı rozeti alır. Hesap her hafta yenilenir.', bitti: 'Rozetin kazanılma ve kaybedilme koşulu satıcılara yazılı olarak bildirildi.' },
      { ad: 'Dağıtımı otomatikleştir', zaman: 'Hafta 6–8', kim: 'Yazılım ekibi', yapilan: 'Talep önce rozetli satıcılara gider. Aynı satıcıya üst üste gönderim sınırlanır.', bitti: 'Talepler elle dağıtılmadan doğru satıcılara gidiyor.' },
    ],
    olcut: 'Talebin 24 saatte en az bir cevap alma oranı ve alıcının ikinci talebi gönderme oranı.',
    dikkat: 'Talep sayıları, gerçek sayılar oluşana kadar satıcıya söylenmez. Projede şişirilmiş talep sayısı vermek yasaktır.',
  },
  {
    id: 'dogrulanmis-toptanci',
    kaynak: 'claude',
    etiket: 'Strateji 7',
    no: 7,
    grup: 'surdurulebilirlik',
    ad: 'Doğrulanmış İstoç Toptancısı',
    taraf: 'Güven',
    ozet: 'Satıcının vergi kaydı ve çarşıdaki dükkânı yerinde doğrulanır. Doğrulanan satıcı, internetteki rakiplerin veremeyeceği bir güven rozeti alır.',
    amac: 'Şehir dışındaki alıcıya satıcının gerçek ve ziyaret edilebilir olduğunu göstermek. Gerçek dükkân, istoc.com’a özgü bir avantajdır.',
    odul: 'Satıcı rozet alır ve aramada “yalnız doğrulanmış satıcılar” süzgecinde görünür. Alıcı gerçek bir dükkânla çalıştığını bilir.',
    adimlar: [
      { ad: 'Rozet adını netleştir', zaman: 'Hafta 1', kim: 'Yönetim', yapilan: 'Rozet adı ve görünümü çarşı yönetimiyle konuşulur. Rozet çarşının resmî onayı gibi görünmemelidir.', bitti: 'Rozet adı yazılı olarak onaylandı.' },
      { ad: 'Belge listesini yaz', zaman: 'Hafta 1', kim: 'Yönetim', yapilan: 'Vergi levhası ve imza sirküleri istenir. Rozetin neyi doğrulayıp neyi doğrulamadığı tek cümleyle yazılır.', bitti: 'Belge listesi ve rozet açıklaması hazır.' },
      { ad: 'Ziyarette doğrula', zaman: 'Hafta 2–6', kim: 'Saha ekibi', yapilan: 'Vitrine hazır ziyaretinde tabela, vergi unvanı ve yetkili kişi birlikte kontrol edilir.', bitti: 'Her doğrulamanın tarihi ve ziyaret eden kişi tabloda.' },
      { ad: 'Rozeti göster', zaman: 'Hafta 3', kim: 'Yazılım ekibi', yapilan: 'Rozet mağaza sayfasında, aramada ve teklif cevabında görünür. Tıklayan alıcı doğrulamanın tarihini ve kapsamını görür.', bitti: 'Alıcı aramayı yalnız doğrulanmış satıcılarla süzebiliyor.' },
      { ad: 'Yılda bir yenile', zaman: '12 ay sonra', kim: 'Saha ekibi', yapilan: 'Doğrulama yılda bir tekrarlanır. Dükkân kapanır ya da taşınırsa rozet kaldırılır.', bitti: 'Süresi dolan rozet kendiliğinden kalkıyor.' },
    ],
    olcut: 'Doğrulanmış satıcıların teklif talebi alma oranı, doğrulanmamış satıcılarla karşılaştırılır.',
    dikkat: 'Rozet satılmaz. Ücret alınırsa yalnız doğrulamanın maliyetini karşılar. Performans rozeti ile karıştırılmaz. İlk sektörde doğrulama ücretsizdir.',
  },
  {
    id: 'geri-gelen-musteri',
    kaynak: 'claude',
    etiket: 'Strateji 8',
    no: 8,
    grup: 'surdurulebilirlik',
    ad: 'Geri gelen müşteri ve yenileme',
    taraf: 'Satıcı',
    ozet: 'Satıcı panelinde platformdan geri gelen müşterilerin sayısı görünür. Yıl içinde en az 10 geri gelen alıcısı olan satıcı ödül alır. Ödül, abonelik yenilenirken bir ay ücretsiz kullanımdır.',
    amac: 'Satıcıya, abonelik yenileme kararından önce platformun ona ne kazandırdığını sayıyla göstermek. Plan hedefi %70 yenilemedir.',
    odul: 'Satıcının yıl içinde en az 10 geri gelen alıcısı olabilir. Bu satıcı, aboneliği yenilenirken bir ay ücretsiz kullanım kazanır. Alıcı son siparişini tek düğmeyle tekrarlayabilir. Rakamlar örnektir.',
    adimlar: [
      { ad: 'Geri gelen alıcıyı tanımla', zaman: 'Hafta 1', kim: 'Yönetim', yapilan: 'Bugün tanım şudur: aynı satıcıya ikinci kez teklif talebi gönderen alıcı. Sipariş platforma gelince tanım ikinci sipariş olur.', bitti: 'Tanım yazılı ve tabloda uygulanıyor.' },
      { ad: 'Tablodan say', zaman: 'Her ay', kim: 'Pazarlama', yapilan: 'Her satıcı için yeni gelen, geri gelen ve toplam alıcı sayısı çıkarılır.', bitti: 'Aylık sayılar satıcı başına hazır.' },
      { ad: 'Yenilemeden önce özet ver', zaman: 'Bitime 30 gün kala', kim: 'Saha ekibi', yapilan: 'Saha ekibi satıcıya telefonla ya da WhatsApp’la özet verir. Örnek: “Bu yıl istoc.com’dan 34 alıcı geldi, 12’si geri geldi.”', bitti: 'Yenilemesi yaklaşan her satıcıya özet verildi.' },
      { ad: 'Paneli yaz', zaman: 'Ay 3', kim: 'Yazılım ekibi', yapilan: 'Satıcı panelinde üç sayı gösterilir. Sayı düşükse panel nedenini ve yapılacak işi yazar.', bitti: 'Satıcı sayıları elle mesaj beklemeden görüyor.' },
      { ad: 'İndirimlerin birleşmesine karar ver', zaman: 'Ay 3', kim: 'Yönetim', yapilan: 'Yenileme ödülünün yıllık peşin ödeme indirimiyle birleşip birleşmeyeceğine karar verilir.', bitti: 'Karar yazılı ve satıcılara duyuruldu.' },
    ],
    olcut: 'Abonelik yenileme oranı ve ödül alan ile almayan satıcıların ertesi yıl yenileme oranı.',
    dikkat: '“Üç ay üst üste sipariş ver” gibi seri ödülü verilmez. Gereksiz stok, toptan alıcı için kazanç değil zarardır.',
  },
];

/** ChatGPT'nin ayrı analizi (docs/oyunlastirma/, S01–S08). Rakamlar kaynaktaki örnek deneme parametreleridir. */
export const CHATGPT_STRATEJILERI: Strateji[] = [
  {
    id: 'gpt-gercek-talep',
    kaynak: 'chatgpt',
    etiket: 'S01',
    asama: 'İlk deneme olarak uygulanır',
    no: 1,
    grup: 'chatgpt',
    ad: 'Gerçek talebi birlikte sonuçlandır',
    taraf: 'İki taraf',
    ozet: 'Tek ürün grubunda gerçek alım ihtiyaçları toplanır. Alıcı ihtiyacını bir kez anlatır, en çok üç uygun satıcı teklif verir.',
    amac: 'Satıcıya gerçek ve doğrulanmış bir alım ihtiyacı göstermek. Alıcının ihtiyacını her satıcıya yeniden anlatmasını önlemek.',
    odul: 'Nakit ve genel puan yoktur. Sonucunu bildiren alıcı isterse alım listesini düzenletir. Satıcı, talebin nerede kaybedildiğini gösteren kısa bir geri bildirim alır.',
    adimlar: [
      { ad: 'Talebi al', zaman: 'Hafta 2', kim: 'Alıcı', yapilan: 'Alıcı ürünü, miktarı, teslim bölgesini ve gereken tarihi bildirir. Hedef fiyat isteğe bağlıdır.', bitti: 'Talepte dört bilgi de var.' },
      { ad: 'Talebi doğrula', zaman: 'Aynı gün', kim: 'Talep sorumlusu', yapilan: 'Eksik bilgi tamamlanır ve talebin hâlâ geçerli olduğu doğrulanır. Günde en çok dört yeni talep açılır.', bitti: 'Talep geçerli olarak işaretlendi.' },
      { ad: 'En çok üç satıcı seç', zaman: 'Aynı gün', kim: 'Talep sorumlusu', yapilan: 'Ürüne uyan ve o gün kapasitesi olan en çok üç satıcı seçilir. Talep bütün çarşıya gönderilmez.', bitti: 'Talep seçilen satıcılara iletildi.' },
      { ad: 'Teklifleri karşılaştır', zaman: 'Bir iş günü içinde', kim: 'Satıcı', yapilan: 'Hedef, iki karşılaştırılabilir tekliftir. Tek teklif varsa açıkça yazılır. Yapay ikinci teklif üretilmez.', bitti: 'Alıcı teklifleri aynı şartlarla görüyor.' },
      { ad: 'Kararı kaydet', zaman: 'Karar verilince', kim: 'Alıcı', yapilan: 'Alıcı satın alma, erteleme ya da almama kararını bildirir. Almama nedeni satıcının sonraki teklifine yardım eder.', bitti: 'Talebin sonucu ya da neden açık kaldığı kayıtlı.' },
    ],
    olcut: 'Örnek eşik şudur: İlk 20 geçerli talebin en az 14’üne iki uygun teklif verilir. Bu teklifler bir iş günü içinde verilir. Bu eşik sektör standardı değildir. İkinci ölçüt, yeni alıcı ile satıcı arasında doğrulanan ilk ticarettir.',
    dikkat: 'Eşik tutmazsa daha fazla reklam verilmez. Ürün grubu, satıcı kapasitesi ve talep kalitesi yeniden incelenir. Satıcıya örnek ya da uydurma talep gösterilmez.',
  },
  {
    id: 'gpt-hazir-satici',
    kaynak: 'chatgpt',
    etiket: 'S02',
    asama: 'İlk deneme olarak uygulanır',
    no: 2,
    grup: 'chatgpt',
    ad: 'İlk talebe hazır satıcı',
    taraf: 'Satıcı',
    ozet: 'Satıcıdan yüzlerce ürün istenmez. İlk gerçek taleplere uygun en çok beş ürün birlikte hazırlanır. Satıcı ilk teklifini kendi verebildiğinde görev biter.',
    amac: 'Kayıtlı satıcı ile iş yapmaya hazır satıcı arasındaki farkı kapatmak. Satıcı gelen talebe cevap verebilecek duruma gelir.',
    odul: 'Platform ilk beş ürünün düzenlenmesine ve kısa bir kullanım görüşmesine destek verir. Destek görevin başında verilir. Örnek sınır, satıcı başına 60 dakika ürün hazırlığı ve 20 dakika kullanım desteğidir.',
    adimlar: [
      { ad: 'Gerçek ihtiyaçla git', zaman: 'Hafta 2', kim: 'Saha sorumlusu', yapilan: 'Saha sorumlusu dükkâna kimliği gizlenmiş gerçek bir alım ihtiyacıyla gider. “Mağazanızı açalım” yerine “Bu ihtiyaca teklif verebilir misiniz?” diye sorar.', bitti: 'İlk grupta beş satıcı katılmayı kabul etti.' },
      { ad: 'Yetkiliyi belirle', zaman: 'Hafta 2', kim: 'Satıcı', yapilan: 'İrtibat kişisi ve fiyatı onaylayan kişi belirlenir. Aynı kişi olmaları gerekmez.', bitti: '“İletişim hazır” adımı tamam.' },
      { ad: 'En çok beş ürün seç', zaman: 'Hafta 2', kim: 'Saha sorumlusu', yapilan: 'Gerçek talebe uygun en çok beş ürün seçilir. Ürün sayısı başarı puanı değildir.', bitti: '“Ürünler hazır” adımı tamam.' },
      { ad: 'Koşulları tamamla', zaman: 'Hafta 2', kim: 'Satıcı', yapilan: 'Her ürün için ölçü ve paket içi adet girilir. En düşük sipariş miktarı, stok ve teslim koşulu da girilir. Fiyat değişkense teklifin geçerlilik süresi yazılır.', bitti: '“Koşullar hazır” adımı tamam.' },
      { ad: 'İlk teklifi hazırla', zaman: 'Hafta 2', kim: 'Satıcı', yapilan: 'Satıcı örnek arayüzde teklif hazırlar. Satıcının son onayı olmadan gerçek alıcıya fiyat gönderilmez.', bitti: '“Teklif verebiliyorum” adımı tamam.' },
    ],
    olcut: 'İlk uygun talebine eksiksiz cevap verebilen satıcı sayısı. Yardım alarak ve kendi başına verilen cevaplar ayrı sayılır. Hazırlanan ürün adedi tek başına aktivasyon sayılmaz.',
    dikkat: 'İlk beş satıcıdan üçü gerçek teklif veremiyorsa katılımcı sayısı artırılmaz. Önce yetki, veri ve kullanım sorunları çözülür. Hazırlık, müşteri ya da satış garantisi değildir.',
  },
  {
    id: 'gpt-eksiksiz-teklif',
    kaynak: 'chatgpt',
    etiket: 'S03',
    asama: 'İlk deneme olarak uygulanır',
    no: 3,
    grup: 'chatgpt',
    ad: 'Eksiksiz teklif sözü',
    taraf: 'Eşleşme',
    ozet: 'Satıcı karşılayabileceği talebe belirlenen sürede eksiksiz teklif verir. En hızlı yazan ya da en ucuz fiyatı veren kendiliğinden kazanmaz.',
    amac: 'Alıcının karşılaştırabileceği teklif alması. Cevapsız taleplerin ve sonuçsuz yazışmaların azalması.',
    odul: 'Satıcı son beş uygun talebin en az dördüne zamanında ve eksiksiz teklif verebilir. Bu satıcı, bir ürün grubu için teklif şablonu hazırlatma desteği alır. Örnek sınır 20 dakikadır ve hak ilk denemede bir kez açılır.',
    adimlar: [
      { ad: 'Kapasiteyi seç', zaman: 'Hafta 3', kim: 'Satıcı', yapilan: 'Satıcı çalışma saatlerini ve alabileceği yeni talep sayısını seçer.', bitti: 'Çalışma saatleri ve kapasite kayıtlı.' },
      { ad: 'Uygun talebi ata', zaman: 'Hafta 3–4', kim: 'Talep sorumlusu', yapilan: 'Yalnız ürün ve teslim bölgesi uyan talepler atanır.', bitti: 'Her atamanın gerekçesi kayıtlı.' },
      { ad: 'Süre içinde teklif ver', zaman: 'Talep gelince', kim: 'Satıcı', yapilan: 'Örnek hedef, çalışma saatlerinde dört saatte ilk anlamlı yanıt ve bir iş gününde eksiksiz tekliftir. Hafta sonu ve kapalı saatler süreye eklenmez.', bitti: 'Teklifte miktar, birim fiyat, vergi, nakliye, teslim süresi, ödeme koşulu ve geçerlilik tarihi var.' },
      { ad: 'Uygun değilse nedenini yaz', zaman: 'Talep gelince', kim: 'Satıcı', yapilan: 'Karşılayamayan satıcı nedenini bildirir. Bu eksiksiz teklif sayılmaz, ama zamanında geri dönüş olarak ayrı sayılır.', bitti: 'Hiçbir talep cevapsız kapanmadı.' },
      { ad: 'Eksikleri göster', zaman: 'Her beş talepte', kim: 'Talep sorumlusu', yapilan: 'Son beş uygun talepte eksik kalan bilgiler satıcıya özel gösterilir. Yeni satıcı boş geçmiş yüzünden düşük puan almaz.', bitti: 'Satıcı tekrar eden eksiğini biliyor.' },
    ],
    olcut: 'Zamanında ve eksiksiz tekliflerin uygun atanmış taleplere oranı. Satıcının reddettiği ya da cevapsız bıraktığı uygun talep hesaptan çıkarılmaz.',
    dikkat: 'Hız artarken hatalı fiyat ya da iptal yükseliyorsa süre hedefi gevşetilir. Satıcıya “daha çok talep alırsın” ya da “aramada üstte çıkarsın” sözü verilmez.',
  },
  {
    id: 'gpt-randevulu-rota',
    kaynak: 'chatgpt',
    etiket: 'S04',
    asama: 'Engel görülünce uygulanır',
    no: 4,
    grup: 'chatgpt',
    ad: 'Randevulu tedarik rotası',
    taraf: 'Alıcı',
    ozet: 'Alıcı İSTOÇ’a gelmeden önce ihtiyacına uygun iki ya da üç mağazayla görüşme planlar. Alıcı yalnız işine yarayacak mağazalara gider.',
    amac: 'Şehir dışından gelen alıcının işini aynı gün bitirmesi. Fiziksel çarşının yakınlık avantajını ölçülebilir bir hizmete çevirmek.',
    odul: 'Alıcı görüşmelerin ve tekliflerin derlenmiş özetini alır. Satıcı önceden hazırlanmış bir görüşme ve alıcının sonucunu alır. Seyahat parası, hediye çeki ya da QR puanı yoktur.',
    adimlar: [
      { ad: 'Ziyaret amacını seç', zaman: 'Ziyaretten önce', kim: 'Alıcı', yapilan: 'Alıcı neden geleceğini seçer, örneğin numuneyi görmek ya da paketlemeyi kontrol etmek. Tarih, ulaşım ve erişim ihtiyacı öğrenilir.', bitti: 'Ziyaret amacı ve tarihi yazılı.' },
      { ad: 'En çok üç durak öner', zaman: 'Ziyaretten önce', kim: 'Talep sorumlusu', yapilan: 'Uygun en çok üç mağaza önerilir. Tek durak yetiyorsa diğerleri zorunlu tutulmaz.', bitti: 'Rota alıcıya gönderildi.' },
      { ad: 'Randevuyu teyit et', zaman: 'Ziyaretten önce', kim: 'Saha sorumlusu', yapilan: 'Satıcı aranır. Ürün, görüşecek kişi ve saat doğrulanır. Teyit olmadan alıcıya kesin randevu gösterilmez.', bitti: 'Her durakta ürün, açık adres, görüşülecek kişi ve saat var.' },
      { ad: 'Görüşmeyi iki taraf onaylar', zaman: 'Ziyaret günü', kim: 'Alıcı ve satıcı', yapilan: 'Görüşmeden sonra iki taraf “görüşüldü” durumunu onaylar. Aynı kodun paylaşılması tek başına kanıt değildir.', bitti: 'Görüşme iki taraftan da onaylı.' },
      { ad: 'Her ürüne sonuç ver', zaman: 'Ziyaret günü', kim: 'Alıcı', yapilan: 'Alıcı her ürün için “uygun”, “uygun değil” ya da “ek bilgi gerekiyor” sonucunu verir.', bitti: 'İhtiyaç listesindeki her ürünün sonucu var.' },
      { ad: 'Günün özetini paylaş', zaman: 'Gün sonunda', kim: 'Talep sorumlusu', yapilan: 'Seçilen teklif ve sonraki adım tek kısa özetle paylaşılır.', bitti: 'Alıcı ve satıcı sonraki adımı biliyor.' },
    ],
    olcut: 'Gerçekleşen ilgili görüşmelerin teyit edilmiş randevulara oranı. Ziyaret sayısı satış sayısı değildir.',
    dikkat: 'İlk on randevunun üçünde ürün ya da yetkili kişi hazır değilse yeni rota açılmaz. Mağaza sayısı ya da yürüme mesafesi başarı puanı olmaz.',
  },
  {
    id: 'gpt-kucuk-deneme',
    kaynak: 'chatgpt',
    etiket: 'S05',
    asama: 'Engel görülünce uygulanır',
    no: 5,
    grup: 'chatgpt',
    ad: 'Küçük denemeden ilk alıma',
    taraf: 'Alıcı',
    ozet: 'Yeni tedarikçiye güvenmekte zorlanan alıcı, önce numune ya da küçük partiyle ürünü dener. Ürün uygunsa ilk ticari alımın koşulları netleşir.',
    amac: 'Teklif verilmesine rağmen kapanmayan işteki güven engelini azaltmak. Alıcı büyük tutar bağlamadan ürünün uygunluğunu sınar.',
    odul: 'Başlangıçta tek bir destek seçeneği seçilir. Taşıma desteği doğrulanmış deneme teslimine, mahsup ise önceden yazılan sonraki siparişe bağlanır. İşletme başına bir deneme hakkı vardır.',
    adimlar: [
      { ad: 'Engeli bul', zaman: 'Teklif sonrası', kim: 'Talep sorumlusu', yapilan: '“İlk alımı yapmanızı şu anda ne engelliyor?” diye sorulur. Sorun fiyat, vade ya da teslim tarihiyse numune çözüm olmayabilir.', bitti: 'Sınanacak özellik yazılı, örneğin ölçü ya da dayanım.' },
      { ad: 'Deneme koşullarını belirle', zaman: 'Deneme öncesi', kim: 'Alıcı ve satıcı', yapilan: 'Ürün, adet, fiyat ve teslim şekli belirlenir. Numune bedelinin sonraki siparişten düşülüp düşülmeyeceği açıkça yazılır.', bitti: '“Koşullar belli” adımı tamam.' },
      { ad: 'Ürünü dene', zaman: 'Deneme süresince', kim: 'Alıcı', yapilan: 'Alıcı ürünü dener. “Uygun”, “uygun değil” ya da “başka özellik gerekli” sonucunu gerekçesiyle bildirir.', bitti: '“Deneme yapıldı” adımı tamam.' },
      { ad: 'İlk ticari teklifi hazırla', zaman: 'Karar verilince', kim: 'Satıcı', yapilan: 'Ürün uygunsa ilk ticari sipariş için yeni teklif hazırlanır. Alıcı numune aldığı için satın almaya zorlanmaz.', bitti: '“Karar verildi” adımı tamam. Ret de geçerli bir karardır.' },
    ],
    olcut: 'Denemeden ilk ticari alıma geçen uygun işletmelerin oranı. Numune verilmeyen benzer talepler de karşılaştırma için izlenir.',
    dikkat: 'İlk on denemede üç ürün anlatılandan farklı çıkarsa yeni deneme açılmaz. Platformun ödeme koruma ya da iade hizmeti yoksa böyle bir güvence verilmez.',
  },
  {
    id: 'gpt-tekrar-siparis',
    kaynak: 'chatgpt',
    etiket: 'S06',
    asama: 'Tekrar alım zamanı gelince uygulanır',
    no: 6,
    grup: 'chatgpt',
    ad: 'Zamanı gelen tekrar sipariş',
    taraf: 'İki taraf',
    ozet: 'İlk ticaretten sonra alıcı kendi tekrar alım zamanını seçer. O tarih yaklaşınca ürün listesi güncel fiyat ve stokla hazırlanır.',
    amac: 'Platformun yalnız ilk tanışmada değil, sonraki ihtiyaçta da işe yaraması. Alıcı aynı listeyi yeniden yazmaz, satıcı yaklaşan talebi görüp stok hazırlar.',
    odul: 'İki sonuçlanmış ihtiyaç döneminden sonra alıcı listesinin topluca düzenlenmesini isteyebilir. Satıcı, alıcının paylaşmayı seçtiği ihtiyaç takvimini görür. Her siparişe sürekli indirim verilmez.',
    adimlar: [
      { ad: 'İlk teslimatın sonucunu öğren', zaman: 'İlk ticaretten sonra', kim: 'Talep sorumlusu', yapilan: 'Ürün ya da satıcıyla ilgili sorun varsa önce o çözülür.', bitti: 'İlk teslimatın sonucu kayıtlı.' },
      { ad: 'Tekrar alım tarihini seç', zaman: 'İlk ticaretten sonra', kim: 'Alıcı', yapilan: 'Alıcı yeniden ne zaman ihtiyaç duyabileceğini seçer. Bu tarih bir tahmindir, satın alma sözü değildir.', bitti: 'Tahmini tarih kayıtlı.' },
      { ad: 'Şartları yenile', zaman: 'Hatırlatmadan önce', kim: 'Satıcı', yapilan: 'Satıcı stok, fiyat ve teslim koşulunu günceller. Değişen alanlar açıkça gösterilir.', bitti: 'Alıcı eski fiyatı geçerli sanmıyor.' },
      { ad: 'Alıcı seçimini yapar', zaman: 'Hatırlatma gelince', kim: 'Alıcı', yapilan: '“Teklif iste”, “Tarihi değiştir” ya da “Artık gerekmiyor” seçeneklerinden biri seçilir. Erteleme başarısızlık değildir.', bitti: 'Hatırlatmanın sonucu kayıtlı.' },
      { ad: 'Yeni alımı ayrı kaydet', zaman: 'Alım olursa', kim: 'Talep sorumlusu', yapilan: 'Yeni alım önceki siparişten ayrı kaydedilir. Bir siparişi bölmek tekrar alım sayılmaz.', bitti: 'İkinci ticaret ayrı kayıt olarak görünüyor.' },
    ],
    olcut: 'Yeniden alım zamanı gelmiş işletmelerin ne kadarının ikinci gerçek ticareti tamamladığı. Tarihi henüz gelmemiş kullanıcı başarısız sayılmaz.',
    dikkat: 'Kullanıcı seriyi kaybetme korkusuyla alışveriş yapmamalıdır. İletişim şikâyeti varsa hatırlatma sıklığı hemen azaltılır. Düzenli ihtiyaç yoksa strateji bırakılır.',
  },
  {
    id: 'gpt-musterini-davet-et',
    kaynak: 'chatgpt',
    etiket: 'S07',
    asama: 'Sınırlı davet denemesiyle başlar',
    no: 7,
    grup: 'chatgpt',
    ad: 'Müşterinizi davet edin, işi kolaylaştırın',
    taraf: 'Alıcı',
    ozet: 'Satıcı, ilişkisini koruyarak uygun müşterisini platforma davet eder. Davet ancak müşteri gerçek bir ihtiyacını sonuçlandırınca başarı sayılır.',
    amac: 'Başlangıç alıcı ağını satıcının mevcut ilişkileriyle beslemek. Satıcıya teklif listesi, tekrar alım kaydı ve daha az yazışma gibi somut bir hizmet sunmak.',
    odul: 'Alıcıya ilk listesini düzenleme desteği verilir. Satıcı, sonuçlanan uygun davet için bir ek ürün grubunun teklif şablonunu hazırlatabilir. İşletme başına deneme boyunca bir hak vardır.',
    adimlar: [
      { ad: 'Kişisel davet gönder', zaman: 'Hafta 6', kim: 'Satıcı', yapilan: 'Satıcı en çok üç uygun işletmeye kişisel davet gönderir. Toplu müşteri rehberi yüklemek gerekmez.', bitti: '“Davet edildi” adımı tamam.' },
      { ad: 'Daveti kabul et', zaman: 'Davet gelince', kim: 'Alıcı', yapilan: 'Alıcı daveti kabul eder ve ne için iletişim kurulacağını seçer. Bilgileri izni olmadan diğer satıcılara açılmaz.', bitti: '“Kabul edildi” adımı tamam.' },
      { ad: 'Gerçek bir iş aç', zaman: 'Kabulden sonra', kim: 'Alıcı ve satıcı', yapilan: 'Gerçek bir teklif ya da tekrar alım işi açılır. Platforma gelmek için gereksiz sipariş istenmez.', bitti: 'Açılan iş gerçek bir ihtiyaca bağlı.' },
      { ad: 'İşi sonuçlandır', zaman: 'İş bitince', kim: 'Alıcı', yapilan: 'İş sonuçlanır. Alıcı deneyimini olumlu ya da olumsuz bildirebilir.', bitti: '“İş sonuçlandı” adımı tamam.' },
      { ad: 'Hakkı tanımla', zaman: 'Koşul sağlanınca', kim: 'Talep sorumlusu', yapilan: 'Şartlar karşılandıysa hizmet hakkı işletmeye tanımlanır. İlgili çalışan şahsen para almaz.', bitti: 'Hak işletme adına kayıtlı.' },
    ],
    olcut: 'Daveti kabul edip gerçek ihtiyacını sonuçlandıran yeni platform işletmesi. Var olan ilişkinin dijitale taşınması ile yeni ticari ilişki ayrı sayılır.',
    dikkat: 'S01 ve S03 çalışmadan açılmaz. İlk on kabul edilmiş davet yalnız kayıt oluşturup iş başlatmıyorsa ödül büyütülmez.',
  },
  {
    id: 'gpt-eksik-tedarikci',
    kaynak: 'chatgpt',
    etiket: 'S08',
    asama: 'Engel görülünce uygulanır',
    no: 8,
    grup: 'chatgpt',
    ad: 'Eksik tedarikçiyi birlikte bul',
    taraf: 'Satıcı',
    ozet: 'Platformdaki satıcılar gerçek bir talebi karşılayamazsa yeni satıcı aranır. Alıcı ya da komşu satıcı uygun bir işletme önerir. Platform bu işletmeyi o ihtiyaç için platforma davet eder.',
    amac: 'Arzı alıcının gerçek ihtiyacından hareketle büyütmek. Kataloğu talebi olmayan ürünlerle doldurmamak.',
    odul: 'Yeni satıcı gerçek talep ve sınırlı katalog hazırlama desteği alır. Öneren işletme, başarılı eşleşmeden sonra bir liste düzenleme desteği isteyebilir. Örnek sınır işletme başına ayda bir haktır.',
    adimlar: [
      { ad: 'Eksiğin nedenini kaydet', zaman: 'Talep karşılanamayınca', kim: 'Talep sorumlusu', yapilan: 'Mevcut satıcıların neden karşılayamadığı yazılır: stok, ürün özelliği, miktar ya da teslim bölgesi.', bitti: '“Açık ihtiyaç” adımı tamam.' },
      { ad: 'Alıcıya sor', zaman: 'Aynı gün', kim: 'Talep sorumlusu', yapilan: 'Alıcıya aramanın sürmesini isteyip istemediği sorulur. Süresi geçen talep yeni satıcıya gerçek fırsat gibi sunulmaz.', bitti: 'Alıcının kararı kayıtlı.' },
      { ad: 'Aday öner', zaman: 'Alıcı isterse', kim: 'Alıcı', yapilan: 'Alıcı ya da izinli komşu satıcı uygun işletmeyi önerir. İletişim bilgisini paylaşmak için izin alınır.', bitti: '“Uygun aday bulundu” adımı tamam.' },
      { ad: 'Adayı doğrula ve hazırla', zaman: 'Öneriden sonra', kim: 'Saha sorumlusu', yapilan: 'Ürün ve teklif yetkisi doğrulanır. Gerekirse S02’deki küçük hazırlık uygulanır. İlk araştırma en çok üç işletme ve 30 dakikadır.', bitti: 'Aday teklif verebilecek durumda.' },
      { ad: 'Yeni satıcı teklif verir', zaman: 'Hazırlıktan sonra', kim: 'Satıcı', yapilan: 'Yeni satıcı aynı talebe teklif verir. Alıcı kabul ya da ret sonucunu bildirir.', bitti: '“Teklif geldi” ve “Sonuçlandı” adımları tamam.' },
      { ad: 'Ağdaki eksiği kaydet', zaman: 'Sonuçlanınca', kim: 'Talep sorumlusu', yapilan: 'Kayıt, ağın hangi üründe eksik olduğunu gösterir. Aynı ihtiyaç tekrarlanıyorsa kategorideki satıcı sayısı artırılır.', bitti: 'Eksik ürün listesi güncel.' },
    ],
    olcut: 'Daha önce karşılanamayan geçerli taleplerden kaçının yeni satıcıyla uygun teklif aldığı. Yeni satıcının sonraki taleplere de cevap vermesi kalıcı arzı gösterir.',
    dikkat: 'İlk beş aramanın dördünde ürün, miktar ya da teslim koşulu uymuyorsa yeni davet sayısı büyütülmez. Sonuç çıkmazsa alıcıya açıkça söylenir, süresiz bekletilmez.',
  },
];


/**
 * Gemini'nin ayrı analizi (kullanıcının sohbete yapıştırdığı metin, 2026-11-04): 5 strateji. Gemini'nin dosyaları depoda
 * yoktur. Adımlar Gemini'nin kademe tablolarından ve saha uygulaması bölümlerinden özetlendi. “Ne zaman” ve “Dikkat”
 * alanları, önerinin projedeki bugünkü kararlarla (abonelik geliri, platformda olmayan sipariş ve ödeme, hazır olmayan
 * ihracat, istoc.com'un kendi bilançosundan vade verememesi) karşılaştırılmasıdır. Gemini'nin kaynak göstermediği
 * yüzdeler alınmadı. Gemini'nin örnek oran ve tutarları örnek olarak yazıldı.
 */
export const GEMINI_STRATEJILERI: Strateji[] = [
  {
    id: 'gemini-kendi-bayini-getir',
    kaynak: 'gemini',
    etiket: 'G1',
    asama: 'Sipariş ve ödeme platformda çalışınca uygulanır',
    no: 1,
    grup: 'gemini',
    ad: 'Kendi bayinizi getirin, komisyonsuz satın',
    taraf: 'Alıcı',
    ozet: 'Satıcı kendi bayilerini davet bağlantısıyla platforma getirir. Bu bayilere yaptığı satışlardan komisyon ödemez. Getirdiği aktif bayi arttıkça yeni ticari haklar kazanır.',
    amac: 'Satıcının yıllardır telefonla ve WhatsApp’la çalıştığı bayi ağını platforma taşıyarak alıcıyı neredeyse maliyetsiz kazanmak. Beklenen etki, bu bayilerin daha sonra başka satıcılardan komisyonlu alım yapmasıdır.',
    odul: 'Üç kademe önerilir. 1–5 aktif bayide satıcı, getirdiği bayilerden komisyon ödemez ve parasını ertesi gün alır. 15 aktif bayide aramada öne çıkar ve ayda 5 ücretsiz sponsorlu ürün hakkı alır. 30 aktif bayide teklif taleplerini erken görür ve platformun getirdiği müşterilerde %3 komisyon indirimi alır. Alıcı ilk siparişinde kargo ya da ambar desteği alır.',
    adimlar: [
      { ad: 'Davet bağlantısını ve QR kartı ver', zaman: 'Hafta 1–2', kim: 'Yazılım ekibi', yapilan: 'Her satıcıya kendi davet bağlantısı ve tezgâh üstüne konacak bir QR kart verilir. Bu bağlantıyla gelen bayi o satıcıya bağlanır.', bitti: 'Bağlantıyla gelen bayi satıcının müşterisi olarak işaretleniyor.' },
      { ad: 'Bayileri davet et', zaman: 'Hafta 2–6', kim: 'Satıcı', yapilan: 'Satıcı mevcut bayilerine bağlantıyı gönderir. Saha ekibi ilk davetlerde satıcıya yardım eder.', bitti: 'İlk kademe için 5 bayi ilk siparişini platformdan verdi.' },
      { ad: 'Kötüye kullanımı denetle', zaman: 'Her siparişte', kim: 'Yönetim', yapilan: 'Alıcının ve satıcının vergi numarası, ortaklık yapısı ve cihaz izleri karşılaştırılır. Sıfır komisyon yalnız iki tür işletme için geçerlidir. Birincisi platforma ilk kez gelen işletmedir. İkincisi son 6 aydır işlem yapmayan işletmedir.', bitti: 'Satıcının kendi kendine sipariş vermesi ödül doğurmuyor.' },
      { ad: 'Kademe çubuğunu göster', zaman: 'Sipariş geldikçe', kim: 'Yazılım ekibi', yapilan: 'Satıcı panelindeki ilerleme çubuğu aktif bayi sayısını gösterir. 15 ve 30 aktif bayide yeni kademe açılır.', bitti: 'Satıcı bir sonraki kademeye kaç bayi kaldığını görüyor.' },
      { ad: 'Çapraz alımı ölç', zaman: 'Her ay', kim: 'Pazarlama', yapilan: 'Getirilen bayinin ilk 60 gün içinde başka bir satıcıdan alım yapma oranı ölçülür.', bitti: 'Oran aylık raporda yer alıyor.' },
    ],
    olcut: 'Birinci ölçüt, satıcı kanalıyla gelen her alıcının kazanılma maliyetidir. İkinci ölçüt, bu alıcıların 60 gün içinde başka bir satıcıdan alım yapma oranıdır.',
    dikkat: 'Bu strateji işlem başına komisyona dayanır. Projede gelir bugün yalnız abonelikten gelir ve abonelik ile işlem payı arasındaki karar henüz verilmedi. Taksit ve vade için bir finansman kuruluşu gerekir. Çünkü istoc.com vadeyi kendi parasıyla veremez. İhracat taleplerine erken erişim, ihracat altyapısı hazır olmadığı için şimdilik ödül olarak verilemez.',
  },
  {
    id: 'gemini-katalogsuz-baslangic',
    kaynak: 'gemini',
    etiket: 'G2',
    asama: 'Hemen başlayabilir',
    no: 2,
    grup: 'gemini',
    ad: 'Katalogsuz başlangıç, teklif talebi ve beş teklif kontenjanı',
    taraf: 'Eşleşme',
    ozet: 'Satıcıdan katalog yüklemesi istenmez. Alıcı tek formla teklif talebi açar ve bu talebe en çok beş satıcı teklif verebilir. Hızlı ve eksiksiz teklif veren satıcı yeni talepleri daha önce görür.',
    amac: 'Çarşı esnafını yüzlerce ürün yükleme yükünden kurtarıp doğrudan hazır alıcı talepleriyle buluşturmak. Satıcı ilk gün aktif olur ve kataloğu teklif verdikçe kendiliğinden dolar.',
    odul: 'Yeni satıcı ayda 10 ücretsiz teklif hakkı alır. Taleplere ortalama 2 saatin altında eksiksiz teklif veren satıcıya “Çevik tedarikçi” denir. Bu satıcı yüksek bütçeli talepleri diğerlerinden 2 saat önce görür. Tekliflerinin en az %25’ini siparişe çeviren satıcıya “Kategori lideri” denir. Bu satıcı sınırsız teklif hakkı alır. Alıcıya önerilen ilk üç tedarikçi arasında da gösterilir. Teklifi 48 saat içinde siparişe çeviren alıcı, sonraki alımında nakliye indirimi kazanır.',
    adimlar: [
      { ad: 'Kısa kayıt al', zaman: 'Hafta 1', kim: 'Saha ekibi', yapilan: 'Satıcıdan yalnız vergi levhası ve sattığı üç alt kategori istenir. Örnek: hırdavat içinde el aletleri.', bitti: 'Satıcı kendi kategorisindeki talepleri almaya hazır.' },
      { ad: 'Tek formla talep aç', zaman: 'Hafta 1–2', kim: 'Yazılım ekibi', yapilan: 'Alıcı ürünü, adedi, hedef bütçeyi ve teslim ilini tek formla girer. Örnek: 500 adet promosyon termos, teslim Ankara.', bitti: 'Eksik bilgili talep açılamıyor.' },
      { ad: 'Beş teklif kontenjanını duyur', zaman: 'Talep açılınca', kim: 'Yazılım ekibi', yapilan: 'Kategorideki satıcılara bildirim gider ve kontenjanın ne kadarının dolduğu gösterilir. Satıcı birim fiyatı, en az sipariş adedini ve teslim süresini tek ekranda girer.', bitti: 'Talebe en çok beş teklif geldi.' },
      { ad: 'Teklifi kataloğa çevir', zaman: 'Teklif verilince', kim: 'Yazılım ekibi', yapilan: 'Satıcının teklif verdiği ürün ve fotoğraf, mağazasına “Fiyat sorunuz” durumunda taslak ürün kartı olarak eklenir.', bitti: 'Satıcının kataloğu teklif verdikçe doluyor.' },
      { ad: 'Seviyeleri hesapla', zaman: 'Her ay', kim: 'Yazılım ekibi', yapilan: 'Yanıt süresine ve tekliften siparişe dönüşüm oranına göre satıcının seviyesi belirlenir. Hiçbir teklifi onaylamadan sürekli talep açan alıcının öncelikli talep hakkı kısıtlanır.', bitti: 'Seviye kuralları satıcılara yazılı olarak bildirildi.' },
    ],
    olcut: 'Birinci ölçüt, talebe ilk geçerli teklifin gelme süresidir. Gemini’nin hedefi 30 dakikanın altıdır. İkinci ölçüt, tekliflerden oluşan ürün kartı sayısıdır. Üçüncü ölçüt, tekliften siparişe dönüşüm oranıdır.',
    dikkat: 'Gemini alıcıya “4 saat içinde en az üç tekliften” söz verilmesini önerir. İlk aylarda bu sözün tutulması zor olabilir ve projede tutulamayacak söz vermek yasaktır. Söz yerine hedef olarak sunulması daha güvenlidir. Bildirimdeki talep tutarı gerçek talepten alınmalıdır. İhracat talepleri, ihracat altyapısı hazır olana kadar gösterilmemelidir.',
  },
  {
    id: 'gemini-kademeli-vade',
    kaynak: 'gemini',
    etiket: 'G3',
    asama: 'Ödeme ve finansman ortağı hazır olunca uygulanır',
    no: 3,
    grup: 'gemini',
    ad: 'Kademeli vade ve ücretsiz lojistik hakkı',
    taraf: 'İki taraf',
    ozet: 'Alıcının vadeli alım limiti ve ücretsiz lojistik hakkı, platformdaki işlem geçmişine bağlanır. Platform dışına çıkan alıcı ve satıcı bu avantajları kaybeder.',
    amac: 'İlk eşleşmeden sonra alıcı ile satıcının WhatsApp’ta anlaşıp platformu atlamasını önlemek. Alıcının vade ve ucuz nakliye ihtiyacını, satıcının tahsilat güvencesi ihtiyacıyla birlikte karşılamak.',
    odul: 'Seviye 1’de alıcı ilk siparişte yarı fiyatına kargo ya da ambar desteği alır. Kredi kartına 3 taksit de alır. Üç sorunsuz siparişten sonra Seviye 2 açılır. Bu seviyede 30 gün açık hesap limiti ve ayda bir ücretsiz palet sevkiyatı vardır. Altı ay düzenli ve gecikmesiz alımdan sonra Seviye 3 açılır. Bu seviyede 60 gün vade ve indirimli ambar tarifesi vardır. Satıcı parasını teslimattan sonra güvenceyle alır. Satıcının komisyonu aylık satış tutarına göre düşer. Aylık 250.000 ₺’ya kadar %10, 750.000 ₺’ya kadar %7, daha üstünde %4 olur.',
    adimlar: [
      { ad: 'Finansman ortağıyla anlaş', zaman: 'Hafta 1–4', kim: 'Yönetim', yapilan: 'Vade, taksit ve satıcıya erken ödeme için bir ödeme ya da finansman kuruluşuyla anlaşılır. Gecikme riskini kimin taşıyacağı yazılır.', bitti: 'Vadenin kim tarafından finanse edildiği sözleşmede yazılı.' },
      { ad: 'Ambar ve nakliye anlaşmasını yap', zaman: 'Hafta 2–6', kim: 'Yönetim', yapilan: 'Ücretsiz palet ve indirimli ambar tarifesi için çarşıdaki nakliye ve ambar firmalarıyla anlaşılır.', bitti: 'Tarife ve kapasite yazılı.' },
      { ad: 'Alıcıyı doğrula', zaman: 'İlk siparişte', kim: 'Yazılım ekibi', yapilan: 'Vergi levhası ve ticari doğrulama yapılır. Alıcı Seviye 1’den başlar.', bitti: 'Doğrulanmamış alıcıya vade açılmıyor.' },
      { ad: 'Seviye çubuğunu göster', zaman: 'Sipariş geldikçe', kim: 'Yazılım ekibi', yapilan: 'Alıcının ekranında puan yerine açık hesap ve lojistik seviyesi görünür. Üç sorunsuz siparişte Seviye 2 açılır.', bitti: 'Alıcı bir sonraki seviyeye ne kaldığını görüyor.' },
      { ad: 'Seviye kaybını uygula', zaman: '60 gün işlem yoksa', kim: 'Yazılım ekibi', yapilan: 'Alıcıya önce hatırlatma gider. 60 gün platformdan alım yapmayan alıcı bir alt seviyeye düşer.', bitti: 'Kural alıcıya baştan yazılı olarak bildirildi.' },
    ],
    olcut: 'Birinci ölçüt, ilk siparişten sonraki 90 günde ikinci ve üçüncü siparişin platformdan verilme oranıdır. İkinci ölçüt, platform dışına çıkma oranındaki düşüştür. Üçüncü ölçüt, ortalama sepet tutarıdır.',
    dikkat: 'Sipariş ve ödeme bugün platformda çalışmıyor. istoc.com vadeyi kendi parasıyla veremez. Bu yüzden bir finansman kuruluşu şarttır. Seviye düşürme kuralı alıcıyı ihtiyacı olmayan alıma itebilir. ChatGPT’nin S06 önerisi ve Claude’un 8. stratejisi bu tür seri baskısına karşı uyarır. Komisyon kademeleri de abonelik ile işlem payı kararına bağlıdır.',
  },
  {
    id: 'gemini-tek-palet',
    kaynak: 'gemini',
    etiket: 'G4',
    asama: 'Sipariş, ödeme ve ambar anlaşması hazır olunca uygulanır',
    no: 4,
    grup: 'gemini',
    ad: 'Tek paletle gönderim ve birlikte alımla toptan fiyat',
    taraf: 'Alıcı',
    ozet: 'Alıcı farklı İSTOÇ dükkânlarından aldığı ürünleri tek palete birleştirip nakliyeden tasarruf eder. Aynı ürünü isteyen alıcılar siparişlerini birleştirip büyük alım fiyatına ulaşır.',
    amac: 'Çarşıda farklı dükkânlardan mal toplayıp tek ambarla gönderme alışkanlığını dijital sepete taşımak. Sipariş başına mağaza sayısını ve sepet tutarını artırmak.',
    odul: 'Tek palet uygulamasında iki mağazadan 25.000 ₺’lık sepette ürünler ücretsiz birleştirilir. Bu sepette nakliye %35 indirimli olur. Üç ya da daha fazla mağazadan 50.000 ₺’lık sepette ambar teslimi ücretsizdir. Bu sepete %2 ek indirim de uygulanır. Birlikte alımda 72 saat içinde toplam talep 100 koliyi geçebilir. Bu durumda bütün katılımcılar 100 koli fiyatından alır.',
    adimlar: [
      { ad: 'Toplama noktasıyla anlaş', zaman: 'Hafta 1–4', kim: 'Yönetim', yapilan: 'Çarşıdaki nakliye, hamaliye ve ambar noktalarıyla ürünleri toplayıp tek palete birleştirme anlaşması yapılır.', bitti: 'Toplama noktası, ücret ve kapasite yazılı.' },
      { ad: 'Palet çubuğunu sepete koy', zaman: 'Hafta 3–6', kim: 'Yazılım ekibi', yapilan: 'Sepette palet doluluk çubuğu görünür. Standart sepet kuralları yeterlidir, ayrı bir oyun motoru gerekmez.', bitti: 'Çubuk sepet tutarına göre doluyor.' },
      { ad: 'Tamamlayıcı ürünü öner', zaman: 'Sepet dolarken', kim: 'Yazılım ekibi', yapilan: 'Çubuk, bir sonraki indirim eşiğine ne kadar kaldığını ve komşu adadaki tamamlayıcı kategoriyi gösterir.', bitti: 'Alıcı bir sonraki eşiği görüyor.' },
      { ad: 'Barem kampanyası aç', zaman: 'Satıcı isterse', kim: 'Satıcı', yapilan: 'Satıcı ürüne kademeli fiyat ve 72 saatlik süre koyar. Örnek: 1–19 koli 1.000 ₺, 20–99 koli 900 ₺, 100 koli ve üstü 780 ₺.', bitti: 'Kampanya kuralları alıcıya baştan görünüyor.' },
      { ad: 'Baremi sonuçlandır', zaman: '72 saat sonunda', kim: 'Yazılım ekibi', yapilan: 'Hedef aşılırsa bütün katılımcılar en düşük fiyattan alır. Aşılmazsa baştan ilan edilen kural uygulanır.', bitti: 'Her katılımcı sonucu ve ödeyeceği fiyatı biliyor.' },
    ],
    olcut: 'Birinci ölçüt, sipariş başına mağaza sayısıdır. Gemini’nin hedefi bu sayıyı 1,2’den 2,5’in üstüne çıkarmaktır. İkinci ölçüt, açılan birlikte alım kampanyalarının hedefe ulaşma oranıdır.',
    dikkat: 'Sepet, ödeme ve karttan ön provizyon platformda çalışmadan bu oyun uygulanamaz. Barem tutmazsa ne olacağı kampanya açılmadan alıcıya yazılmalıdır. İndirim oranları ve tutarlar Gemini’nin örnekleridir. Maliyetleri ambar ve nakliye teklifleriyle doğrulanmalıdır.',
  },
  {
    id: 'gemini-ada-kontenjani',
    kaynak: 'gemini',
    etiket: 'G5',
    asama: 'Hemen başlayabilir',
    no: 5,
    grup: 'gemini',
    ad: 'Ada kontenjanı ve doğrulanmış İSTOÇ tedarikçisi',
    taraf: 'Satıcı',
    ozet: 'Her alt kategoride yalnız 10 kurucu tedarikçi yeri açılır. Sınırlı yer ve komşu dükkânla rekabet, ilk satıcıları hızlı katılmaya yöneltebilir.',
    amac: 'Çarşıdaki komşuluk rekabetini kullanarak ilk çekirdek satıcıları kazanmak. Sanal puan ve QR damgası yerine prestij ve sınırlı kontenjan kullanmak.',
    odul: 'Kontenjana giren satıcının 20 ürünü saha ekibi tarafından ücretsiz fotoğraflanır ve yüklenir. Satıcı 6 ay boyunca kategori sayfasındaki kurucu mağazalar vitrininde yer alır. İlk 14 gün içinde en az üç nitelikli alıcı talebiyle eşleştirilir. Dükkân camına doğrulanmış tedarikçi plaketi asılır.',
    adimlar: [
      { ad: 'Deneme kategorilerini seç', zaman: 'Hafta 1', kim: 'Yönetim', yapilan: 'Kontenjanın açılacağı alt kategoriler seçilir. Örnek: hırdavat içinde bağlantı elemanları, züccaciye içinde cam ürünleri.', bitti: 'Deneme kategorileri yazılı.' },
      { ad: 'Kontenjanı sahada sun', zaman: 'Hafta 2–6', kim: 'Saha ekibi', yapilan: 'Saha ekibi herkesi üye yapmaya çalışmaz. Her alt kategoride yalnız 10 kurucu yer olduğunu anlatır.', bitti: 'Kategori başına dolu ve boş yer sayısı güncel.' },
      { ad: 'Çekirdek kataloğu hazırla', zaman: 'Kayıttan sonra', kim: 'Saha ekibi', yapilan: 'Saha ekibi dükkânda 20 çekirdek ürünü fotoğraflar ve kataloğa girer.', bitti: '20 ürün yayında.' },
      { ad: 'Plaketi ve QR’ı as', zaman: 'Kayıttan sonra', kim: 'Pazarlama', yapilan: 'Dükkân camına plaket asılır. QR, satıcının kataloğuna ve davet bağlantısına açılır.', bitti: 'Plaket asılı ve QR doğru sayfayı açıyor.' },
      { ad: 'İlk 14 günü takip et', zaman: 'İlk 14 gün', kim: 'Pazarlama', yapilan: 'Yeni satıcı alıcı talepleriyle eşleştirilir. Saha ekibinin primi açtığı mağaza sayısına bağlanmaz. Prim, ilk 14 günde ilk siparişi ya da teklifi alan satıcı sayısına bağlanır.', bitti: 'Her yeni satıcının ilk 14 gün sonucu kayıtlı.' },
    ],
    olcut: 'Birinci ölçüt, yeni satıcının ilk siparişe ya da teklife ulaşma süresidir. Gemini’nin hedefi ilk 14 günde %75’in üstüdür. İkinci ölçüt, kategori kontenjanının dolma hızıdır.',
    dikkat: 'Bu strateji Claude’un 1. ve 7. stratejisine yakındır. “İhracat tedarikçisi” ya da “global tedarikçi” unvanı verilmemelidir, çünkü ihracat altyapısı hazır değildir. Plaketin adı çarşı yönetimiyle netleşmeden kullanılmamalıdır. “14 günde üç talep” söz olarak değil hedef olarak verilmelidir.',
  },
];

export const TUM_STRATEJILER: Strateji[] = [...STRATEJILER, ...CHATGPT_STRATEJILERI, ...GEMINI_STRATEJILERI];
