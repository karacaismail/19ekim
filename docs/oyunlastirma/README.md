# İSTOÇ ve Thoptan için ticaret görevleri

4 Kasım 2026

**İlk yatırım, gerçek bir alıcının ihtiyacını az sayıda uygun satıcıyla sonuçlandırmaya yapılmalı.** Oyunlaştırma bu işi kolaylaştırmalı. Satıcıya müşteri getirmeyen puan, boş vitrinde reklam hakkı veya alıcıyı gereksiz mağazalara gezdiren görev değer üretmez.

Bu paket, istoc.com'un alıcı ve satıcının birbirini beklediği başlangıç sorununa odaklanır. Sekiz strateji ayrı dosyadadır. İlk denemede hepsi çalıştırılmaz. Önce S01, S02 ve S03 aynı küçük ticaret grubunda uygulanır.

## Önceki soruda ne eksikti?

İlk soru mümkün olduğunca çok oyun istiyordu. Böyle bir soru, çözülmesi gereken darboğazdan önce fikir sayısını büyütür. Alıcıların nereden geleceği, satıcının neden cevap vereceği ve platformun neyi doğrulayabildiği belirtilmemişti.

Yapıştırılan metinde yararlı fikirler var. İlk ticaret, tekrar alım ve nitelikli teklif hedefleri doğru başlangıçlardır. Ancak metin bunları puan cüzdanı, lig, festival ve ortak oyun motoruyla aynı anda uygulamayı öneriyor. Bu kapsam, henüz iki tarafı buluşturabildiği gösterilmemiş bir pazaryeri için erken.

| Önceki öneri | Eksik olan düşünce | Bu paketteki karar |
|---|---|---|
| Sekiz oyunu ve ortak motoru geliştirmek | Hangi ticaret engelinin önce çözüleceği belli değil. | İlk talep grubunu mevcut araçlarla elle yürütürüz. |
| Satıcıya reklam görünürlüğü vermek | İlgili alıcı trafiği yoksa bu ödülün değeri düşüktür. | Talep düzenleme, ürün bilgisi hazırlama ve randevu desteği sunarız. |
| Üç kategoriyi keşfetmek ve beş mağaza gezmek | Alıcının gerçek ihtiyacı bu kadar geniş olmayabilir. | Alıcının istediği ürüne uygun teklif veya ziyaret yeterlidir. |
| Günlük görev ve kesintisiz alışveriş serisi | İşletmenin tedarik dönemi günlük olmayabilir. | Alıcının kendi tekrar alım tarihini kullanırız. |
| QR kodla ticareti doğrulamak | Kod taraması görüşme, sipariş veya ödeme kanıtı değildir. | Ziyaret, teklif, sipariş ve tahsilatı ayrı kaydederiz. |
| Her iki tarafa her işlemde ödül vermek | Zaten gerçekleşecek ticaret için gereksiz ödeme yapılabilir. | Yalnız çözülen engele karşılık gelen destek verilir. İki tarafın da para alması şart değildir. |
| İSTOÇ global, Thoptan yerel kabulü | İki markanın görev dağılımı bu araştırmada doğrulanmış değil. | Önce tek markada öğreniriz. İkinci markaya geçişi ayrı karar olarak ele alırız. |
| Fikirlere 98 veya 96 puan vermek | Puanın dayandığı müşteri ve maliyet verisi yok. | Başlama koşulu, ölçülebilir sonuç ve durdurma koşulu kullanırız. |

## Soruyu nasıl sormalıydık?

> istoc.com için ilk düzenli alıcı ve satıcı grubunu kurmak istiyoruz. Fiziksel İSTOÇ çarşısındaki satıcıları iş yapma biçimlerine göre ayır. Alıcıları gerçek tedarik ihtiyaçlarına göre tanımla. Önce hangi tarafı, hangi ihtiyaç üzerinden kazanacağımızı belirle. İşlem ve ödeme altyapımızı var sayma. Talep, teklif, ziyaret ve tamamlanmış ticareti ayrı ölç. Dünya örneklerinden yalnız bu soruna uygulanabilir mekanikleri seç. Her öneride iki tarafın kazanımını, platformun günlük işini, maliyeti, doğrulama yöntemini ve durdurma koşulunu açıkla. Puan motoru gerektirmeyen küçük bir denemeyle başla. Thoptan'ın rolünü doğrulanacak bir karar olarak bırak.

## Neyi biliyoruz?

Bu pakette dört bilgi türü ayrılır. **Gözlem**, okunan kaynakta bulunan bilgidir. **Hipotez**, sahada sınanacak açıklamadır. **Öneri**, bizim tasarım kararımızdır. **Örnek**, hesabı veya işleyişi anlatır ve gerçek işletme verisi değildir.

- Kullanıcı, iki B2B pazaryerini ve fiziksel İSTOÇ satıcılarını hedef olarak belirtti. B2B, işletmeler arasında ticaret demektir.
- [istoc.com'un kamuya açık sayfası](https://istoc.com/) toptan ürün ve kategori keşfini anlatıyor. Bu sayfa ödeme, sipariş takibi veya teklif sisteminin çalıştığını kanıtlamıyor.
- Thoptan ana sayfasına bu araştırmadaki erişim denemesi 503 yanıtı verdi. Bu sonuç, sitenin her kullanıcı için kapalı olduğunu göstermez. İşlevleri doğrulanamadı.
- Yerel planın `25b5e73` sürümünde alıcı talebi toplama önerisi var. `src/data/program.ts` bunu açık kararlar arasında tutuyor. `src/data/kararlar.ts` içindeki gelir modeli kararı da bekliyor.
- Bu depo bir planlama sitesidir. Depodaki bir simülasyon, gerçek pazaryerinde aynı özelliğin çalıştığı anlamına gelmez.

Bu nedenle işlem başına komisyon, satıcı aboneliği, ücretsiz ay veya ortak müşteri hesabı bu paketle onaylanmış sayılmaz. Segika'nın satış ortaklığı oranları da istoc.com'a taşınmaz.

## Sekiz strateji

| Sıra | Strateji | Önce hangi sorunu çözer? | Başlama koşulu |
|---|---|---|---|
| S01 | [Gerçek talebi birlikte sonuçlandır](01-gercek-talebi-sonuclandir.md) | Satıcı, gerçek alıcı görmeden katılmak istemiyor. | Yakın dönemde alım ihtiyacı bulunan işletmelere erişilebilir. |
| S02 | [İlk talebe hazır satıcı](02-ilk-talebe-hazir-satici.md) | Satıcı kayıtlı olsa bile doğru teklif hazırlayamıyor. | S01'de toplanmış gerçek ihtiyaç vardır. |
| S03 | [Eksiksiz teklif sözü](03-eksiksiz-teklif-sozu.md) | Alıcı geç, eksik veya karşılaştırılamayan yanıt alıyor. | Talebi karşılayabilecek satıcılar seçilmiştir. |
| S04 | [Randevulu tedarik rotası](04-randevulu-tedarik-rotasi.md) | Yerinde görme ihtiyacı ve boşa yapılan ziyaret ticareti geciktiriyor. | Alıcı ziyaret istiyor ve ürün hazırdır. |
| S05 | [Küçük denemeden ilk alıma](05-kucuk-denemeden-ilk-alima.md) | Yeni tedarikçiden toplu alım yapmak fazla riskli görünüyor. | Numune veya küçük parti kararı gerçekten etkiliyor. |
| S06 | [Zamanı gelen tekrar sipariş](06-zamani-gelen-tekrar-siparis.md) | İlk eşleşme oluyor ama sonraki ihtiyaçta platform unutuluyor. | İlk ticaret tamamlanmış ve tekrar alım dönemi öğrenilmiştir. |
| S07 | [Müşterini davet et, işi kolaylaştır](07-musterini-davet-et.md) | Başlangıçta alıcı ağı oluşturmak pahalıdır. | Satıcı ilişkiyi ve müşterisinin tercihlerini koruyarak davet etmek istiyor. |
| S08 | [Eksik tedarikçiyi birlikte bul](08-eksik-tedarikciyi-bul.md) | Gerçek talep geliyor ama doğru satıcı ağda yok. | S01'de karşılanamamış ve hâlâ geçerli bir talep vardır. |

S01, S02 ve S03 tek başlangıç programının parçalarıdır. Ayrı bütçelerle aynı satışa üç kez ödül verilmez. Diğer stratejiler, belirli bir engel görüldüğünde devreye girer.

## Buradaki oyunlaştırma nedir?

Kullanıcı küçük ve anlamlı bir hedef seçer. İlerlemeyi görür, eksik adımı öğrenir ve tamamladığında işine yarayan bir sonuç elde eder. Bazı görevlerde önceden ayrılmış hizmet desteği açılır. Rekabet, başka işletmeleri geçmekten çok verilen sözü yerine getirmek üzerinedir.

Bir talep formu veya sipariş hatırlatması tek başına oyunlaştırma değildir. Bunlar gerekli operasyon araçlarıdır. Bu paketteki oyun katmanı ortak hedef, görünür ilerleme, geri bildirim ve koşulu açık kazanımdır. Katman işe yaramazsa kaldırılır. Ticari hizmet korunur.

İlk sürümde genel puan para birimi, herkese açık sıralama ve ödül mağazası önerilmiyor. Bunların ihtiyacı ancak küçük denemede gösterilebilir. Güven doğrulaması hiçbir görev puanıyla satın alınamaz.

## İlk nereden başlamalı?

Bir **ticaret grubu**, aynı ürün ihtiyacına, teslim bölgesine ve yakın alım dönemine sahip işletmelerden oluşur. “Bütün Türkiye'deki toptancılar” böyle bir grup değildir.

Örnek aday, İstanbul'daki küçük e-ticaret işletmelerinin standart koli ve ambalaj bandı alımıdır. Bu seçim bir hipotezdir. Araştırmada talep veya uygun satıcı bulunamazsa kırtasiye ya da başka bir ürün grubu seçilir. İlk denemede tek ihtiyaç ve tek teslim bölgesi korunur.

Önerilen ilk ölçek, 5 cevap verebilir satıcı ve 12 alıcı işletmedir. Hedef, 14 günlük uygulamada 20 gerçek talep üzerinde süreci öğrenmektir. Bunlar satış hedefi veya başarı garantisi değildir. Aynı alıcının talepleri ayrı kaydedilir, alıcı sayısı şişirilmez.

Yirmi gerçek ihtiyaç oluşmazsa katılımcılardan yeni talep açmaları istenmez. Talep kıtlığı da denemenin sonucudur. Daha az taleple öğrenilenler yazılır, gerekçesi varsa süre uzatılır.

## İki marka nasıl çalışmalı?

Bu öneride ilk deneme istoc.com adıyla yürütülür. Thoptan aynı anda ikinci bir ödül ve kullanıcı havuzu açmaz. Önce iki markanın aynı ihtiyaca mı, farklı alıcı gruplarına mı hizmet edeceği kararlaştırılır. İSTOÇ çarşısına yakınlık, tek başına markalar arasında yerel ve uluslararası görev ayrımı kurmaz.

Thoptan'dan gelen uygun başvuru varsa kaynağı korunur. İşletme, talep ve destek kaydı iki kez sayılmaz. Bu, ortak giriş sistemi veya kullanıcı verilerini otomatik aktarma kararı değildir. Katılımcı hangi marka üzerinden, hangi hizmeti aldığını bilmelidir.

İkinci markada ayrı deneme ancak farklı bir ihtiyaç doğrulandığında açılır. Örneğin ziyaret isteyen alıcıyla uzaktan tekrar alım yapan alıcı farklı hizmet gerektirebilir. Bu ayrım araştırma sonucudur, başlangıç varsayımı değildir.

## Paketi kullanma sırası

1. [Araştırma ve persona dosyası](00-arastirma-ve-personalar.md) ile ürün grubunu ve gerçek engeli seçin.
2. S01, S02 ve S03'ün koşullarını, sorumlularını ve kapasitesini birlikte belirleyin.
3. [Ölçüm ve deneme planındaki](09-olcum-butce-ve-deneme.md) olay kaydını açın. Başarı ölçütünü katılımcılar gelmeden yazın.
4. Varsa ziyaret, numune veya satıcı eksikliği için ilgili stratejiyi ekleyin.
5. Tekrar alım zamanı geldiğinde S06'yı değerlendirin. Sırf takvimde 30 gün geçti diye sonuç uydurmayın.
6. [Kaynak kaydındaki](10-kaynaklar-ve-kanit-sinirlari.md) gerçek uygulamaları, önerilerimizden ayrı okuyun.

Bu dosyalar kampanya tasarımıdır. Saha görüşmesi yapılmadı, gerçek işletmeler davet edilmedi ve kampanya yayımlanmadı.
