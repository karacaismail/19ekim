# istoc.com için yalın oyunlaştırma: giriş

4 Kasım 2026 tarihli çalışma notudur. Bu klasör, istoc.com'un tavuk yumurta sorununu çözmek ve platformu
sürdürülebilir kılmak için uygulanabilecek oyunlaştırma stratejilerini anlatır. Her strateji ayrı bir dosyadadır.
Bu dosya üç soruya cevap verir: soru nasıl sorulmalıydı, neler araştırılmalıydı ve oyunlaştırma nasıl daha pragmatik
olur.

Bu belgeler öneridir. Rakamlar, aksi yazmıyorsa pilotta ayarlanacak örnek başlangıç değerleridir. Hukuki notlar
avukat görüşünün yerine geçmez.

## Tavuk yumurta sorunu istoc.com'da nasıl görünür?

Satıcı, platformda alıcı görmezse abonelik ödemez ve ürün yüklemez. Alıcı da ürün ve satıcı görmezse platforma
gelmez. Projenin kendi risk listesi bunu kritik risk olarak yazar: satıcıya alıcı gelmezse abonelik yenilenmez
(`src/data/istihdamPlani.ts:188`).

istoc.com'un elinde başka pazaryerlerinde olmayan iki varlık vardır:

1. **Fiziksel çarşı.** İSTOÇ'ta yaklaşık 7.200 iş yeri ve 42 meslek grubu vardır. Yönetim, çarşıya günde yaklaşık
   500.000 kişinin girip çıktığını söyler (Posta, 12 Haziran 2025, İSTOÇDER başkanının açıklaması). Satıcılar tek
   yerde toplu durur. Saha ekibi onlara günde yüz yüze ulaşabilir.
2. **Satıcıların mevcut müşterileri.** Her toptancının telefonla ya da WhatsApp ile sipariş veren düzenli alıcıları
   vardır. Bu alıcılar platformun ilk talep tarafı olabilir. Reklam bütçesi gerekmez.

Pragmatik oyunlaştırma bu iki varlığı kullanır. Alıcıyı dışarıdan satın almaya çalışmaz. Önce satıcıyı tek başına
fayda gördüğü bir araçla platforma bağlar. Sonra satıcının kendi alıcısını platforma taşımasını ödüllendirir.

## Platformun bugünkü durumu oyunları sınırlar

Projedeki veriler şunu söyler (`src/data/gelirModelleri.ts:88-113`, `src/data/istihdamPlani.ts:185`):

- Gelir modeli bugün yalnız aboneliktir. Standart paket ayda 399 €, Pro paket 599 €, Kurumsal paket teklifle
  satılır.
- Sipariş ve ödeme henüz platform üzerinden yürümez. Ödeme sisteminin hazır olup olmadığı açık sorudur.
- İhracat altyapısı hazır değildir. Kapıda söz olarak verilmez.

Bu yüzden "ilk siparişte puan" gibi ödüller bugün doğrulanamaz. Ödüller, platformun bugün kaydedebildiği olaylara
bağlanmalıdır: mağaza açıldı, ürün yayına girdi, satıcının bağlantısıyla alıcı kaydoldu, alıcı teklif istedi, satıcı
teklife cevap verdi, alıcı satıcıyı kaydetti. Sipariş ve ödeme platforma gelince aynı oyunlar sipariş olayına
bağlanır.

## 1. Soru nasıl sorulmalıydı?

İlk soru oyun fikri istedi. Bu yüzden 50 oyunluk genel bir katalog geldi. Oysa asıl ihtiyaç, en az sayıda mekanikle
ilk ağın kendi kendine dönmesidir. İyi bir soru bağlamı, hedefi, sınırı ve beklenen çıktıyı birlikte verir.

Örnek soru:

> istoc.com, İstanbul'daki İSTOÇ Toptancılar Çarşısı'na bağlı bir B2B toptan pazaryeridir. Satıcılar çarşıdaki
> esnaf ve toptancılardır, ayda 399 € ya da 599 € abonelik öder. Alıcılar, İstanbul dışındaki perakendeciler ve
> otel, okul, fabrika gibi kurumsal alıcılardır. Bugün katalog ve teklif talebi çalışıyor, sipariş ve ödeme henüz
> platformda değil. İlk 90 günde 100 aktif satıcı hedefliyoruz. Saha ekibimiz var, reklam bütçemiz sınırlı.
>
> Tek bir sektörde alıcı ve satıcıyı aynı anda harekete geçirecek en az sayıda oyun mekaniğini öner. Her mekanik
> yalnız platformun bugün kaydedebildiği olaylara bağlansın. Her biri için kuralları, ödülü, ödülün maliyetini ve
> kimin ödediğini, hile önlemini, başarı ölçütünü ve ilk 30 günde elle nasıl başlatılacağını yaz. Şansa dayalı ödül
> önerme. Kanıtı olmayan iddiayı varsayım diye işaretle.

Bu soru dört şeyi değiştirir:

- **Bağlam verir.** Platformun aşaması, gelir modeli ve fiziksel çarşı bilinir.
- **Hedefi daraltır.** Oyun sayısı değil, ilk ağın kendi kendine dönmesi istenir.
- **Sınır koyar.** Doğrulanabilir olay, bütçe, şans yasağı ve ekip büyüklüğü bellidir.
- **Çıktıyı biçimlendirir.** Her öneri aynı başlıklarla gelir. Böylece öneriler karşılaştırılabilir.

## 2. Neler araştırılmalıydı?

### Masa başı araştırma: başka pazaryerleri ilk alıcıyı ve satıcıyı nasıl buldu?

| Soru | Bulunan cevap | Kaynak |
| --- | --- | --- |
| Pazaryerleri önce hangi tarafı topladı? | 17 pazaryerinin 14'ü önce satıcıyı topladı. En sık yöntem birebir satıştı. | Lenny Rachitsky, Kasım 2019 |
| Satıcı, alıcı yokken neden kalır? | Ağdan bağımsız fayda veren bir araç alırsa kalır. OpenTable önce restoranlara rezervasyon yazılımı sattı. | Andrew Chen, 2019 |
| Satıcı kendi alıcısını nasıl getirir? | Faire, markanın getirdiği perakendeciden komisyon almaz. Perakendeciye ilk siparişte indirim verir. | faire.com destek sayfaları (ikincil kaynak) |
| Rozetler satışı değiştirir mi? | Taobao'da rozeti kazanmak satışı %4,43 artırdı, rozeti kaybetmek %7,97 düşürdü. | JMIS, 2020 |
| Türkiye'de satıcı puanı nasıl çalışır? | Trendyol satıcı puanı haftalık hesaplanır. Teslim süresi, iade, cevap süresi ve değerlendirmeye bakar. | birfatura.com, Mart 2025 (ikincil kaynak) |
| Çekilişli kampanya serbest mi? | Nakit olmayan ödüllü çekiliş için önce Milli Piyango İdaresi'nden izin gerekir. | Resmî Gazete, 2006 yönetmeliği |
| Esnafa ticari ileti atılabilir mi? | Tacir ve esnafa önceden onay gerekmez, ama adres İYS'ye kaydedilmeli ve ret kontrol edilmelidir. | 6563 sayılı Kanun yönetmeliği, madde 6 |

İYS, İleti Yönetim Sistemi demektir. Ticari ileti onaylarının ve retlerinin tutulduğu ulusal kayıttır.

### Saha araştırması: bizim çarşımız nasıl çalışıyor?

Masa başı araştırma genel kalıbı verir. Hangi oyunun istoc.com'da işe yarayacağını ise saha verisi belirler. Bu
sorular henüz cevaplanmadı:

1. **Satıcı tipleri.** Projede P1'den P7'ye kadar satıcı tipleri anılır, ama tanımları depoda yoktur
   (`src/views/DegerOnerisiPage.tsx:146`). Her tipin yaşı, dijital becerisi, müşteri sayısı ve sipariş alma yolu
   yazılmalıdır.
2. **Sipariş nasıl geliyor?** Satıcı siparişi bugün telefonla mı, WhatsApp'la mı, yüz yüze mi alıyor? Kendi
   strateji dosyalarımız buna dayanır.
3. **Düzenli alıcı sayısı.** Ortalama bir dükkânın kaç düzenli alıcısı var? Bu alıcılar ayda kaç kez sipariş
   veriyor?
4. **Hangi sektör önce?** Hangi sektörde tekrar sipariş sık, ürün standart ve fiyat karşılaştırması kolay? İlk ağ o
   sektörde kurulmalıdır. İSTOÇ'un ada ve sektör dağılımı resmî kaynakta doğrulanamadı. İSTOÇDER'den alınmalıdır.
5. **Şehir dışı alıcı.** Çarşıya gelen şehir dışı perakendeci yılda kaç kez geliyor? Arada siparişi nasıl
   veriyor?
6. **Marka izni.** Çarşı yönetimi kapı kapı ziyarete, afişe ve dükkânlara QR levha asılmasına izin veriyor mu?
   İstoç adının kullanımı yönetimle netleşmeli (`src/data/degerOnerisi.ts:433`).

Önerilen en küçük saha çalışması: 20 satıcıyla ve bu satıcıların verdiği 10 alıcıyla 20'şer dakikalık görüşme
yapılır. Bu görüşmeler iki haftada biter ve yukarıdaki altı sorunun çoğuna cevap verir.

## 3. Daha pragmatik ve etkili oyunlaştırma nasıl olur?

Genel rapor bir oyun ekosistemi kurmayı önerdi. Yalın yaklaşım ise platformda zaten olması gereken birkaç davranışı
görünür ve ödüllü kılar. On ilke:

1. **Ayrı oyun ürünü kurma.** Oyun, mağaza panelindeki bir ilerleme çubuğu, bir rozet ve bir sayaçtır. Ayrı bir
   oyun motoru ilk 90 günde gerekmez.
2. **Puan para birimi kurma.** TradePoint gibi bir puan, sonra bir ödül mağazası, sonra bir muhasebe ister. Ödül
   doğrudan ticari değer olsun: abonelik süresi, vitrin görünürlüğü, talep önceliği.
3. **Yalnız doğrulanabilir olayı ödüllendir.** Bugün sipariş ve ödeme platformda değildir. Ödüller kayıt, ürün,
   teklif ve cevap olaylarına bağlanır.
4. **Önce satıcı, tek sektör.** İlk ağ bir sektörde ve mümkünse tek bir blokta kurulur. Alıcı reklamı ancak o sektör
   doluysa başlar.
5. **Satıcının alıcısı satıcıda kalır.** Esnafın en büyük korkusu, platformun müşterisini rakibe göstermesidir. Bu
   korku giderilmeden satıcı kendi alıcısını getirmez.
6. **İki taraf birlikte kazanır.** Alıcı bir şey kazandığında satıcı da kazanır. Tersi de geçerlidir.
7. **Kaybetme korkusunu kullan.** Rozet, son 90 günün performansına bağlı olur. Rozeti korumak, kazanmaktan daha
   güçlü bir motivasyondur.
8. **Genel sıralama tablosu kurma.** Büyük toptancı ile küçük dükkânı aynı listede yarıştırmak küçükleri soğutur.
   Kişisel eşik ve ortak hedef kullan.
9. **Şansa dayalı ödül verme.** Çark ve çekiliş, Milli Piyango İdaresi izni ister. Kurala bağlı ve önceden ilan
   edilmiş ödüller yeterlidir.
10. **Önce elle başla.** Her strateji ilk 30 günde tabloyla ve saha ekibiyle yürütülebilir. Yazılım, işe yaradığı
    görülünce yapılır.

## Stratejiler

Dosyalar uygulama sırasına göre numaralanmıştır. İlk dört dosya tavuk yumurta sorununu çözer. Son dört dosya
platformun sürdürülebilir olmasını sağlar.

| Sıra | Strateji | Hangi tarafı çözer? | Dosya |
| --- | --- | --- | --- |
| 1 | Kurucu satıcılar | Satıcı | [01-kurucu-saticilar.md](01-kurucu-saticilar.md) |
| 2 | Önce araç: vitrine hazır mağaza | Satıcı | [02-vitrine-hazir-magaza.md](02-vitrine-hazir-magaza.md) |
| 3 | Kendi müşterini getir | Alıcı | [03-kendi-musterini-getir.md](03-kendi-musterini-getir.md) |
| 4 | Sektör doluluk hedefi | İki taraf | [04-sektor-doluluk-hedefi.md](04-sektor-doluluk-hedefi.md) |
| 5 | Dükkândaki QR ile tedarikçini kaydet | Alıcı | [05-dukkan-qr-tedarikci-defteri.md](05-dukkan-qr-tedarikci-defteri.md) |
| 6 | Teklif talebi ve 24 saat cevap rozeti | Eşleşme | [06-teklif-cevap-rozeti.md](06-teklif-cevap-rozeti.md) |
| 7 | Doğrulanmış İstoç Toptancısı | Güven | [07-dogrulanmis-istoc-toptancisi.md](07-dogrulanmis-istoc-toptancisi.md) |
| 8 | Geri gelen müşteri ve yenileme | Sürdürülebilirlik | [08-geri-gelen-musteri.md](08-geri-gelen-musteri.md) |

## Genel rapordan neler çıkarıldı?

| Genel rapordaki öneri | Karar | Neden? |
| --- | --- | --- |
| 50 oyunluk katalog | Çıkarıldı | Ekip ve bütçe 8 mekaniği bile ancak taşır. |
| TradePoint puan para birimi ve ödül mağazası | Çıkarıldı | Ödül doğrudan ticari değer olunca puana gerek kalmaz. |
| 5 seviyeli alıcı ve satıcı üyeliği | Ertelendi | Önce tek rozet ve tek eşik yeterlidir. |
| Genel sıralama tabloları | Çıkarıldı | Küçük satıcıyı soğutur. Ticari bilgiyi açığa çıkarabilir. |
| Mağaza damgası toplama pasaportu | Değiştirildi | Yürümeyi değil ticari bağı ödüllendirmek gerekir. Strateji 5 buna dönüştü. |
| GPS ile konum doğrulama | Çıkarıldı | QR yeterlidir. Konum verisi KVKK yükü getirir. |
| İlk siparişte puan | Ertelendi | Sipariş ve ödeme platformda değildir. Şimdilik doğrulanamaz. |
| İhracat ve global oyunlar | Ertelendi | İhracat altyapısı hazır değildir. Söz verilmez. |
| Ticaret festivali | Ertelendi | İSTOÇ FEST zaten vardır. Ağ dolunca ona katılmak daha ucuzdur. |

KVKK, 6698 sayılı Kişisel Verilerin Korunması Kanunu demektir.

## Açık kararlar

Bu stratejilerin bazı ayrıntıları, projede henüz verilmemiş kararlara bağlıdır:

- **Abonelik mi, işlem payı mı?** Bu çatışma `docs/birlesik_plan.md` içinde K1 olarak açıktır. Strateji 3 iki
  modelde de çalışır, ama ödülün biçimi değişir.
- **Ödeme sistemi ne zaman hazır olacak?** Sipariş olayına bağlı ödüller buna bağlıdır.
- **İstoç adı ve çarşıda QR levha izni.** Strateji 5 ve 7 için çarşı yönetiminin izni gerekir.
- **Değer önerisi ile fiyat planı çelişiyor.** Değer önerisi sayfası "satış yoksa ücret yok" der
  (`src/data/degerOnerisi.ts:158-175`). Fiyat planı ise aylık abonelik öngörür. Strateji 1 ve 8 bu çelişki çözülünce
  netleşir.

## Kaynaklar

- İSTOÇ rakamları: Posta, 12 Haziran 2025. https://www.posta.com.tr/ekonomi/1-5-milyar-dolarlik-ticaret-festivali-2872900
- Pazaryerlerinin ilk arzı: Lenny Rachitsky, 2019. https://www.lennysnewsletter.com/p/how-to-kickstart-and-scale-a-marketplace-911
- Tek başına fayda veren araç: Andrew Chen, 2019. https://andrewchen.com/grow-marketplace-supply/
- Faire Direct koşulları (ikincil kaynak): https://www.faire.com/support/articles/20178862736539
- Taobao rozet çalışması: https://jmis-web.org/articles/1506
- Etsy Star Seller ölçütleri: https://www.etsy.com/seller-handbook/article/1020956976086
- Trendyol satıcı puanı (ikincil kaynak): https://birfatura.com/trendyol-satici-puani-trendyol-magaza-puani/
- Çekiliş izni: https://www.resmigazete.gov.tr/eskiler/2006/10/20061004-10.htm
- Ticari ileti yönetmeliği: https://www.lexpera.com.tr/mevzuat/yonetmelikler/ticari-iletisim-ve-ticari-elektronik-iletiler-hakkinda-yonetmelik
