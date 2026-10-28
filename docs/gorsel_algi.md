# Görsel algı, okunabilirlik ve belge takibi — bileşen denetimi

**Tarih:** 28 Ekim 2026  
**İncelenen sürüm:** `34a4bd2` — incelemeden önce `git pull --ff-only origin main` ile güncellendi.  
**Çıktı:** Eleştiri ve uygulama yönergesi. Uygulama kaynakları değiştirilmedi.  
**Önceki belgeler:** `ux.md`, `ux_v2.md`, `docs/ux_v2.md`, `ifade.md`. Bu rapor bunların üzerine, özellikle **bilginin hangi görsel alana ait olduğunu** tanımlar. Önceki belgelerdeki bir işin planlanmış olması, uygulanmış veya test edilmiş olduğu anlamına gelmez.

**Okuma haritası:** Karar veren için §1–3; uygulayıcı için §5–7; tek tek bileşen incelemesi için §8; grafikler için §9.

- [1. Teşhis](#bolum-1)
- [2. Kapsam ve kanıt sınırı](#bolum-2)
- [3. Öncelikli bulgular ve düzeltme sözleşmeleri](#bolum-3)
- [4. UX yaklaşımlarının bu projedeki karşılığı](#bolum-4)
- [5. Master component ve içerik alanı sözleşmeleri](#bolum-5)
- [6. Test önce: uygulanacak kabul senaryoları](#bolum-6)
- [7. Uygulama sırası ve teslim sınırı](#bolum-7)
- [8. Bütün proje bileşenleri: tek tek değerlendirme](#bolum-8)
- [9. Grafik türleri: 28 ayrı temsil kontrolü](#bolum-9)
- [10. Kabuk, Mantine parçaları ve bileşen dışında kalan sunum](#bolum-10)
- [11. Raporun üç kontrol geçişi](#bolum-11)

<a id="bolum-1"></a>

## 1. Teşhis

Ekran görüntüsündeki sorun yalnızca satır sayısı değildir. **Eşdeğer seçeneklerin farklı türde bilgi taşımasıdır.** `%60` bir değerken `Senaryonun (%100)` değer ile kaynak ilişkisini, `399 € (parametre)` değer ile yapılandırma bilgisini aynı düğmede taşır. Kullanıcı sayıları karşılaştırmak için her etiketin içinden aynı bilgiyi yeniden ayıklamak zorunda kalır.

Bu, üç kayba yol açar:

1. **Görsel eşdeğerlik:** Aynı işi yapan seçeneklerden bazıları daha büyük ve daha önemli görünür.
2. **Okuma ritmi:** Sayı → açıklama → sayı biçimindeki değişken dil, hızlı taramayı bozar.
3. **İlişki takibi:** Satıra sığmayan seçenekler ikinci/üçüncü sıraya düşünce aynı kontrol parçalanmış görünür; komşu kontrolün açıklaması ve sonraki başlıkla yakınlık ilişkisi zayıflar.

Doğru ilke: **Değer seçenek alanına; ölçülen şey grup etiketine; kaynak ve otomatik güncelleme davranışı ayrı bağlam alanına; neden ve yöntem yardım alanına yazılır.** Açıklık, her metni uzatmakla sağlanmaz. Düğmenin eksik bağlamını düğmenin içine paragraf ekleyerek kapatmak da açıklık değildir.

### Bu raporun önceki raporlara düzeltmesi

`ifade.md` cümlelerin anlam bütünlüğünü ve düğme–yardım ayrımını ele aldı; ancak kısa değer seçenekleri için kaynak metnini dışlayan, otomatik/sabit değer çakışmasını çözen somut bir kabul sözleşmesi vermedi. Daha açıklayıcı yazma hedefi, seçeneklere ek sözcük doldurularak uygulanabiliyordu. `ux_v2.md` ilişkiyi korumayı vurguladı; mevcut uygulamada tabloyu accordion'a dönüştürmek bazı yerlerde hâlâ ilişkinin kendisini korumak sanılıyor. Bu rapor iki açığı kapatır: **metnin doğru yerde olması** ve **karşılaştırmanın aynı anda yapılabilmesi**.

Kullanıcının istediği değer etiketleri bağlayıcıdır: `%100`, `399 €`, `Mart 2027`. Seçeneklerin içine `Senaryonun`, `(parametre)`, kaynak adı veya açıklama cümlesi konulmayacak. Bu kural, alan başlığını ve gerekli açıklamayı tamamen kaldırma talimatı değildir.

<a id="bolum-2"></a>

## 2. Kapsam ve kanıt sınırı

### Ne incelendi?

- `src/components` ve `src/views` altındaki **22 TSX dosyada 166 proje bileşeni**. Her biri §8'de ayrı satırdır. İşlevin JSX ağacı, görünür metinleri, etiketleri ve çağırdığı ortak parçalar incelendi; kritik ortak bileşenlerin durum/yerleşim kodu ayrıca okundu.
- `BaseLayout.astro`, merkezi CSS/tokenlar, tüketilen Mantine parçaları ve `ChartSpec` içindeki **28 grafik türü** ayrıca ele alındı.
- **56 adres/durum × iki genişlik = 112 sayfa gözlemi:** 320×900 ve 1440×900 CSS px, Chromium `156.0.8078.4`, Türkçe yerel ayar, koyu tema. 23 temel/rol adresi + 17 applet + 16 iş ortaklığı program/bölüm adresi.
- Ayrıntılı seçeneklerin açılması, Liyakat matrisi kaydının açılması, iş ortaklığı sekme şeridi ve Notlar silme onayının süre davranışı ayrıca incelendi.
- Kullanıcının ekran görüntüsü başlangıç kanıtıdır. Güncellenen kaynakta bazı yardımcı cümleler görüntüdekinden farklıdır; aynı etiket karışımı mevcut kaynakta ve yeni ekranlarda doğrulandı.

**Kanıt düzeyleri:** `R` = bu incelemede tarayıcıda görülen/ölçülen; `S` = kaynak kodunda doğrulanan; `H` = kullanıcı testi veya ek durum deneyi gerektiren tasarım çıkarımı. `H` bir hata ispatı değildir. “Koru” tam WCAG uygunluk sertifikası değildir.

**Sınırlar:** Tüm hover/focus/error/disabled kombinasyonları denenmedi. Açık tema, Firefox, WebKit, gerçek Safari/iOS/Android, 200% metin, 400% zoom ve ekran okuyucu bu turda `not_run`. Grafikler görünür olunca yükleniyor; bütün grafiklerin bütün veri/tooltip durumları tarayıcıda doğrulandı denmiyor. Grafik eki kaynak ve temsil düzeyindeki incelemedir. OPEX için mevcut test fixture'ından **kurgusal yanıt** kullanıldı; canlı finansal tutar, Sheets veya hesap doğruluğu denetlenmedi. Bağımsız ikinci değerlendirici/kullanıcı testi yapılmadı. Uygulama değişmediği için tam test suite, build ve CI yeniden çalıştırılmadı.

İlk 320 px filtre ekranı çekimi panel kapalıyken zaman aşımına uğradı; ayrı durum incelemesinde panel açılarak çekim tamamlandı. Ham kayıttaki 113. kayıt bu çekim hatasıdır; 113 başarılı kontrol gibi sayılmamalı.

### Ölçülen mevcut durum

| Ölçüm | 320 px | 1440 px | Yorum |
|---|---:|---:|---|
| Açık ayrıntılı seçenekte kullanılabilir grup genişliği | 256 px | yaklaşık 339 px | Ekran genişliği ile kontrolün kullanılabilir genişliği aynı değil. |
| Kapasite çarpanı seçenek sırası | 2 | 2 | Masaüstünde de kırılıyor. |
| Aylık elde tutma seçenek sırası | 2 | 2 | Uzun kaynak etiketi karşılaştırma ritmini bozuyor. |
| İkinci saha personeli seçenek sırası | 3 | 2 | Tarihler ve kaynak bilgisi aynı düğmede. |
| Saha büyümesi seçenek sırası | 4 | 3 | Basit segmentli kontrolün kapasitesi aşılmış. |
| Satıcı kazanım reklamı seçenek sırası | 4 | 3 | Tutar, dönem ve parametre notu etiketlere yüklenmiş. |
| Kur artışı seçenek sırası | 3 | 2 | Yıllık birim ve kaynak bilgisi tekrar ediyor. |
| Gelir sayfası başlangıç durumundaki belge yüksekliği | 30.679 px | 22.454 px | Tek başına kusur değil; bölüm konumu ve dönüş yolu gerektiren uzunluk. |
| Yapışkan özetin görünür/içerik genişliği | 205 / 530 px | — | Sayfa taşmıyor; fakat kritik değerler ilk bakışta görünmüyor. |
| İş ortaklığı bölüm şeridi görünür/içerik genişliği | 296 / 909 px | — | Sekiz bölümün çoğu yatay kaydırmayla bulunuyor. |
| Notlar silme onayı | 4 saniye sonra kayboluyor | Aynı | `Silinsin mi?` tekrar `Sil` oluyor; hiçbir not silinmedi. |

112 başlangıç gözleminde **belge düzeyinde yatay taşma**, görünür DOM metinlerinde **14 CSS px altı yazı** veya birden fazla/eksik h1 saptanmadı. Bu, bütün kapalı panellerin, SVG etiketlerin, temaların ve hata durumlarının geçtiği anlamına gelmez. Yatay kaydırılan bölge ile sayfa taşması farklıdır. Masaüstündeki çok sütunlu tablo kaydırmaları ayrıca kayıtlıdır; otomatik WCAG ihlali olarak etiketlenmedi.

Kanıt dosyaları repo dışında `../research_notes/ui-algi-2026-10-28/` altındadır: `inventory.json`, `source-cards.txt`, `runtime.json`, `states.json` ve PNG'ler. Rapor bu dosyalar olmadan da okunabilir; yeniden denetim için `runtime.mjs` ve `states.mjs` aynı klasördedir. Hiçbiri üretim uygulamasına eklenmedi.

<a id="bolum-3"></a>

## 3. Öncelikli bulgular ve düzeltme sözleşmeleri

Öncelik: **P1** yanlış seçim/yanlış yorum veya belirgin görev engeli; **P2** tekrarlanan okuma ve takip maliyeti; **P3** kontrollü iyileştirme. Öncelik estetik beğeni puanı değildir. Her bulgudaki kabul, gelecekteki uygulamanın koşuludur; bu raporda geçmiş test sonucu olarak sunulmaz.

<a id="f01"></a>

### F01 — Seçenek etiketinde farklı bilgi türleri karışıyor · P1 · R/S

**Kaynak:** `SenaryoKurucu.tsx:80–134`, `ui.tsx:880`; ekran: `filters-expanded-1440.png`.

| Mevcut | İstenen seçenek | Bilginin yeni yeri |
|---|---|---|
| Senaryonun (%100) | %100 | Otomatik/sabit davranış ayrı kontrol veya kaynak satırı; F02. |
| Senaryonun (%70) | %70 | Aynı. |
| %20 (parametre) | %20 | Gerekliyse grubun altında başlangıç değeri bilgisi. |
| 399 € (parametre) | 399 € | Değerin geldiği parametreye ayrı bağlantı. |
| Ocak 2027 (parametre) | Ocak 2027 | Tarihin kaynağı yardım/bağlam alanı. |
| %25 / yıl (parametre) | %25 | Grup etiketi: Yıllık kur artışı. |
| 30.000 ₺ / ay (parametre) | 30.000 ₺ | Grup etiketi: Aylık reklam bütçesi. |
| Özel (Medyan + 3 değişiklik) | Özel | Ayrı durum: Medyan temelinde 3 değişiklik. |

**Yönerge:** Bir grubun seçenekleri aynı bilgi şemasına sahip olmalı. Para grubunda tüm seçeneklerde para birimi, yüzde grubunda yüzde, tarih grubunda ay+yıl bulunur. `Gelmez` gibi kategorik istisna gerçek alternatifse açık adla korunur; 0 veya sahte tarih gösterilmez. Her kaynak bilgisini kaldırmak değil, onu doğru yere taşımak gerekir.

**Kabul:** Seçenek metninde kaynak/parametre açıklaması yok; görünür değer ile erişilebilir ad çelişmiyor; bilgi yalnız hover tooltip'ine taşınmıyor. Üç fiyat seçeneği aynı biçimde okunuyor. Seçili etikete fazladan sözcük eklenmiyor.

<a id="f02"></a>

### F02 — Sadeleştirme iki aynı etiketli, farklı davranışlı seçenek yaratabilir · P1 · S

Kapasitede `null → senaryoyu izle` ile sabit `1 → %100` aynı anda var. Elde tutmada otomatik `%70` ve sabit `%70`; büyümede otomatik “her 6 ayda +1” ve sabit 6 ay aynı riskte. **Yalnız “Senaryonun” sözcüğünü silmek yanlış düzeltmedir.**

Önerilen davranış sözleşmesi:

1. Sayı grubunda aynı etkili değer bir kez görünür.
2. “Planla birlikte güncelle” gibi ayrı, açık bir kaynak bağlantısı/anahtarı otomatik davranışı belirtir. “Plan” sözcüğünün burada hazır senaryo mu genel parametre mi olduğu alan açıklamasında netleştirilir.
3. Sayısal bir değeri elle seçmek sabit moda geçirir; otomatiğe dönme eylemi ayrı ve anlaşılırdır. Bu geçişin sonucu kısa durum satırında bildirilir.
4. Özel parametre değeri hazır listede yoksa kaybolmaz; örneğin 449 € tek ve gerçek seçenek olarak gösterilir.
5. Mevcut adres, localStorage, geri/ileri ve sıfırlama sözleşmeleri korunur. Aynı görünen iki değer, iç anahtarları silinerek körlemesine birleştirilmez.

`(parametre)` yazan her alan otomatik izleme yapmıyor. `priceEur`, `annualShare`, tarih ve `null` kullanılan alanlar ayrı incelenmeli. Tümüne aynı davranışı varsaymak yasak. Hazır senaryo uygulamanın mevcut seçenekleri sıfırladığı durumlarda bu davranışı testten önce belgele; bağımsız kaynak güncellemesiyle karıştırma.

**Kabul:** Kaynak 100 → 130 olduğunda otomatik değer 130'a geçer; kullanıcı tarafından sabitlenmiş 100 aynı kalır **eğer mevcut ürün sözleşmesi o olayda seçenekleri koruyorsa**. Hazır senaryoyu tamamen yeniden uygulayan olayda beklenen sıfırlama ayrı test edilir. Değer, bağlanma modu ve kaynak ayrı kayıtlardır.

<a id="f03"></a>

### F03 — Aynı görünüm üç farklı işi anlatıyor · P2 · S/H

`Choice`, `Dugmeler`, OPEX `Toggles`, gerçek `ProgramSekmeleri`/`YearTabs`, `Anahtar` varyantları birbirine yakın görünüyor; ama değer seçimi, görünüm seçimi, bölüm gezintisi ve açık/kapalı kural farklı işler.

**Yönerge:** Ortak tokenlar kullan; semantik görevleri tek mega bileşene zorlama. Değer seçimi için tek seçim modeli, navigasyon için tab/bağlantı, boolean için switch, işlem için button. “Sekme gibi görünmesi” bütün kontrollere `role=tab` eklemek için gerekçe değildir. Mevcut `aria-pressed` düğme grubu kendiliğinden uygunsuz sayılmaz; değiştirilecekse klavye ve rol sözleşmesi birlikte değiştirilir.

**Kabul:** Kullanıcı tıklamadan önce “değer değişir / başka bölüm açılır / işlem yapılır” ayrımını yapabilir. Görünür etiket, rol ve klavye davranışı aynı işi anlatır. [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) yalnız gerçek panel gezintisine uygulanır.

<a id="f04"></a>

### F04 — Kontrol, açıklama ve bölüm sınırı aynı ritimde değil · P2 · R/S/H

Seçenek kutuları 1–4 satır, alt açıklamalar değişken uzunlukta. Izgara satırı en yüksek hücreye göre açılıyor; kısa hücrelerin altında artık boşluk oluşuyor. Her şeyi aynı yüksekliğe zorlamak da boşluğu artırır.

**Yönerge:** Grup etiketi → kontrol → zorunlu kısa yardım → isteğe bağlı yöntem ayrıntısı sırası sabit olsun. İç grup boşluğu, farklı görev grupları arası boşluktan küçük olmalı. Yardım bir önceki kontrolün hemen altında, sonraki grubun başlığından açıkça ayrılmalı. Ayrıntı kutuları açıldığında komşu kontrolün konusu sanılmamalı. Sayısal kontroller ve uzun kurallı kontroller gerekirse farklı satır/grup düzeni kullansın.

**Kabul:** Göz hangi açıklamanın hangi kontrolü anlattığını çizgiyle takip etmeden bulur. 320'de iç içe padding metni dar bir sütuna sıkıştırmaz. Karşılaştırma gereken gruplar sırf masonry ile boşluk kapatmak için okuma sırasını değiştirmez.

<a id="f05"></a>

### F05 — Bağlam ve özet tekrarları dikkati tüketiyor · P2 · R/S

Gelir sayfasında yapışkan özet, Sonuç senaryo hapı, karşılaştırma satırı, ikincil değerler ve kurucu aynı senaryoyu tekrar ediyor. `Section` başlığı altında benzer tablo/grafik başlıkları da tekrar ediyor. Bu tekrarların bazıları kaydırma sırasında gereklidir; ilk ekranda hepsi gerekli değildir.

**Yönerge:** Başlangıçta bir ana sonuç, bir kritik durum ve bir aktif bağlam. Yapışkan özet ana sonuç görünümden çıktıktan sonra anlamlı hâle gelebilir; davranış ekran yüksekliği ve klavye odağıyla test edilir. Bölüm başlığı soruyu, grafik başlığı ölçümü, not yöntem istisnasını anlatmalı; üçü aynı cümlenin varyantı olmamalı.

**Kabul:** Hangi senaryonun etkin olduğu hep bulunabilir; ilk ekranda aynı tarihin/tutarın gereksiz kopyaları bulunmaz. Tekrarı kaldırmak, bölüm bağlantısıyla gelen kullanıcının bağlamını kaldırmaz.

<a id="f06"></a>

### F06 — Tipografik hiyerarşi “hepsi kısa ve kalın” düzeyinde kalabiliyor · P2 · R/S/H

`.secim-etiket` büyük harf ve harf aralığı kullanıyor; bunun yanındaki seçili değer de güçlü. Uzun alan başlıkları, küçük gri açıklamalar ve çok sayıda kalın sayı aynı alanda yarışıyor. Mevcut minimum boyut kontrolünün başarılı olması tek başına okunabilirlik değildir.

**Yönerge:** Metin rollerini ayrı yönet: bölüm başlığı, alan etiketi, seçilebilir değer, açıklama, kaynak, durum. Her rolün tek görevi olsun. Gövde için 14 px'i otomatik hedef yapma; bu yalnız alt sınırdır. Büyük harf uzun ifadelerde varsayılan olmasın. Seçili durumu yalnız ağırlık değişimine bırakma; ağırlık değişince kutu/satır geometrisi oynamasın.

**Kabul:** Metni küçültmeden kontrol sığar veya sunum değişir. Outfit genel tercih; OPEX'in mevcut Roboto ve 15 px kararı korunur. Kullanıcı harf/kelime/satır aralığını artırınca kırpılma olmaz. [WCAG 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) bu değerleri varsayılan tipografi yapmayı değil, kullanıcı ayarına dayanmayı gerektirir.

<a id="f07"></a>

### F07 — Mobil kaydın özeti her zaman iş açısından doğru seçilmiyor · P1 · S/H

`DataTable` açık `summary` yoksa ilk düzenlenmeyen sütunu; sütun eksenli kayıtta açık `ozetSatir` yoksa son satırı seçebiliyor. Bu teknik kolaylık, iş açısından önemli ölçütü garanti etmez. Yeni sürüm gelir/nakit/kadro tablolarının bazılarını düzeltiyor; bu iyileştirmeler korunmalı.

**Yönerge:** Her tablo kullanımında kapalı kaydın sorusu tanımlansın: kişi → gelire katkı, ay → net/gelir, karar → son tarih/karar veren gibi. Özet sözleşmesi kolon sırasından türemesin. Düzenleyiciler accordion başlığına geri konulmasın; bu sorun güncel sürümde ele alınmış.

**Kabul:** Kolonların masaüstü sırası değiştiğinde mobil özetin anlamı değişmez. Kaydı açmadan kim/ne + kritik ölçüt anlaşılır. Düzenlenebilir kontrol accordion düğmesinin içinde bulunmaz.

<a id="f08"></a>

### F08 — Accordion taşmayı çözüyor, karşılaştırma komşuluğunu her zaman korumuyor · P1 · R/S/H

Liyakat ve rütbe matrisinde kullanıcının görevi tek satırı okumak değil, bir eksen sabitken komşu hücrelerin farkını görmektir. Her satırı kapalı kayıt yapmak bu görevi ardışık hafıza testine dönüştürür.

**Yönerge:** Mobilde bir ekseni seçtir, diğer eksenin değerlerini kısa açık karşılaştırma listesinde sun. Alternatif: iki kayıt seç → aynı ölçütlerin hizalı karşılaştırması. Kaydın içinde düzenleyici ve sonucu aynı bağlamda tut. Genel accordion'u kaldırma; karşılaştırma gerektiren kullanım için ayrı sunum profili tanımla.

**Kabul:** “Aynı performansta düşük ve yüksek compa arasındaki zam farkı nedir?” sorusu, kapat/aç ile değer ezberlemeden cevaplanır. Masaüstü ve mobil aynı veri/sıra/birim/ekseni kullanır; veri kaybı olmaz.

<a id="f09"></a>

### F09 — Mobil OPEX bazı masaüstü araçlarını devralmıyor · P1 · S

Kayıt görünümünde kalem arama ve genel filtreler mevcut; sütun bazlı sıralama/filtre kontrolü yok. Masaüstünden kalan durumun korunması, mobilde o durumu değiştirebilmekle aynı değildir. Bu sınır proje talimatında da kayıtlı.

**Yönerge:** Mobil araç alanında sıralama ölçütü+yön ve etkin filtrelerin kapsamı düzenlenebilir olsun. “N seçili” özetinin içeriği açılabilsin. Mevcut kullanıcı kararına göre seçim kutusuna hap doldurulmasın. Genel ve süzülmüş toplam ayrımı korunmalı.

**Kabul:** 320'de kullanıcı toplam tutara göre sıralar, etkin filtreyi görür ve kaldırır; masaüstüne geçmeden tamamlar. Araç yeni içerik kabuğuna geçtiğinde veri, açık kayıt ve odak kaybolmaz.

<a id="f10"></a>

### F10 — Sayfa taşmıyor ama kritik bilgi yatay alan dışında kalıyor · P1/P2 · R/S

Yapışkan özet 205 px içinde 530 px, bölüm sekmeleri 296 px içinde 909 px içerik taşıyor. Bu, “overflow yok” testinin kullanıcı açısından yeterli olmadığını gösterir.

**Yönerge:** Kritik özeti gizli yatay kaydırmaya bağlama. Dar ekran bölüm gezgininde seçili bölüm adı, örneğin “6 / 8”, ve tüm bölümlere erişim açık olsun; Applet seçicisinin ilkesinden yararlan. Bu, iş ortaklığının önceki yatay şerit kararına değişiklik önerisidir; mevcut hâli talimata aykırı uygulanmış diye sunulmaz. Kaydırmalı geniş tablo istisnası ile temel gezinme farklı değerlendirilir.

**Kabul:** İlk kez gelen kişi görünmeyen devamı tahmin etmek zorunda kalmaz. Kritik değer/sonraki bölüm erişimi yatay hareket gerektirmez. Yeniden boyutlandırma ve bölüm değişimi seçimi korur.

<a id="f11"></a>

### F11 — Zaman bilgisi birden fazla sunumda tekrar ederken ilişki zayıflıyor · P2 · S/H

Timeline, takvim, Gantt, ajanda ve görev tablosu aynı olayları farklı amaçlarla gösteriyor. Sırf hepsi mevcut diye beşini arka arkaya sunmak özellikle telefonda takip maliyeti doğuruyor.

**Yönerge:** “Ne zaman?”, “kim yapıyor?”, “hangi teslimden sonra?” sorularına göre ana görünüm seç. Diğer görünüm aynı olay kimliğine bağlı alternatif olsun. Tarih başlangıcı, dönem, gün/hafta göreli sayısı ve geçit eşiği birbirinden ayrı gösterilsin.

**Kabul:** Bir olayın tarihini veya sorumlusunu iki görünüm arasında bulmak için yeniden arama yapılmaz. Mobil sıra, masaüstü grafiğindeki kronolojiyle tutarlıdır.

<a id="f12"></a>

### F12 — Uzun içerik kısa alanlara sıkıştırılıyor · P2 · S/H

Not düzenleyicisi tek satır; uzun meslek/rol adları Select'te; uzun teknik uyarı onay kutusunun etiketinde; çok koşullu form aynı düz ızgarada. Bunlar cümle kısaltılarak tek başına çözülemez.

**Yönerge:** Uzun notu çok satırlı alanla düzenle; kısa etiket + kalıcı bağlı açıklama kullan; bağımlı alanları iş adımıyla grupla. Gerekli uyarıyı yalnız tooltip'e saklama. Kullanıcının yazdığı uzun adı anlamsız kısaltma.

**Kabul:** Gerçek uzun ad ve üç cümlelik notla metin kaybı/baş-son unutma oluşmaz. Etiket, birim, yardım ve hata her alan türünde aynı sıradadır. Açıklama ilişkisinin `aria-describedby` gibi semantik bağı kurulmuştur; `Choice.note` şu an bu bağlantıyı açıkça kurmuyor.

<a id="f13"></a>

### F13 — Sessiz otomatik düzeltme okurun gördüğü değere güvenini azaltıyor · P1/P2 · S

Applet `Sayi`/`Metin` ve Parametreler `SayiAlani` odak çıkışında düzeltme yapıyor. Geçersiz taslağın modele gitmemesi iyi; görünür bir neden olmadan değişmesi başka sorun.

**Yönerge:** Alan “en az/en çok” bilgisini önceden taşısın. Otomatik sınıra çekme korunacaksa “150 yerine üst sınır 100 uygulandı” gibi kısa geri bildirim gösterilsin. Hata için sadece renk veya geçici yanıp sönme kullanma.

**Kabul:** Kullanıcı ne yazdığını, hangi geçerli değerin kullanıldığını ve nedenini anlayabilir. Geçici taslak hesap sonucu gibi gösterilmez. Hata düzeltilince eski hata metni kalmaz.

<a id="f14"></a>

### F14 — Onay ve geri alma deneyimi sayfalar arasında farklı · P1 · R/S

Parametreler'de süre sınırı kaldırılmış, kapsam/Vazgeç/Geri al var. `appletKit.Eylem` ve `NotesPage.ConfirmButton` dört saniyede onayı kapatıyor. Applet hata ekranı da genel bir render hatasına kayıt bozulması teşhisi verebiliyor.

**Yönerge:** Onay sorusu nesneyi ve kapsamı içersin; uygulama düğmesi “3 alanı sıfırla” gibi açık olsun. Onay okumaya ayrılan zamana bağlı kapanmasın. Geri al gerçekten mümkünse sun; değilse varmış gibi yazma. Hata nedeni bilinmiyorsa nedeni kesinleştirme.

**Kabul:** İlk tıklama veriyi değiştirmez; 4/10/30 saniye beklemek onayı yok etmez; Vazgeç güvenilir biçimde kapatır. Yeniden açılınca hedef aynı ve açık. Parametreler'deki uygulanmış iyileştirme yeniden yazılmaz, diğer tüketicilere uygun biçimde genişletilir.

<a id="f15"></a>

### F15 — Durum mesajı eylem düğmesinin yerini oynatabiliyor · P2 · S/H

Senaryo bağlantısını kopyalama başarısız olduğunda uzun açıklama düğmenin içine giriyor. Email `CopyButton` ise durum etiketleri için yer ayırarak genişliği koruyor ve hatayı ayrı alanda gösteriyor.

**Yönerge:** Eylem adı kısa ve sabit; başarı kısa, hata/çözüm yakın ayrı durum alanında. Yerleşim için gerçek en uzun gerekli durum metniyle test et. Kopyalanamadı mesajını 2,5 saniyede yok etmek, çözümü okuyamayan kullanıcıyı cezalandırmamalı.

**Kabul:** Durum değişince komşu düğmeler yeni satıra kaçmaz, odak/tıklama hedefi oynamaz. Hata metni çözüm uygulanana veya kullanıcı kapatana kadar bulunabilir. Email'deki iyi kalıp örnek alınır; kör kopya yapılmaz.

<a id="f16"></a>

### F16 — Birim, işaret, dönem ve yüzde tabanı eşit görünümün arkasında farklı · P1 · R/S

Örnek: Gelir özeti “Fon ihtiyacı”nı negatif tutar olarak sunuyor; Nakit akışı ek nakit ihtiyacını pozitif tutarla anlatıyor. Applet'lerde yüzde bazen tabanın, bazen toplam nakdin, bazen hedef primin yüzdesi. Yıl toplamları farklı uzunlukta dönemleri karşılaştırabiliyor.

**Yönerge:** “En düşük kümülatif net: −969.835 ₺” ile “Gerekli ek fon: 969.835 ₺” ayrı ölçütlerdir. Etiket ve sayı işaretini birlikte düzelt; yalnız eksi işaretini silme. Modelin muhasebe kavramlarını değiştirmeden sunum sözlüğü kur. Her oran için payda; her tutar için para birimi+dönem; her tarih için gerektiğinde yıl bulunur. Sütun/grup başlığı tekrar eden ortak bağlamı taşıyabilir; bağlamdan kopan kopya/CSV'de tekrar eklenir.

**Kabul:** Aynı ölçüt farklı sayfada aynı ad/birim/işaretle okunur. Hedef primin %130'u ile tabanın %30'u eşdeğer sanılmaz. Kısmi yıl ve tam yıl kıyasında süre açık; yuvarlama farkı görünür değerin anlamını değiştirmez.

<a id="f17"></a>

### F17 — “—” birden fazla anlama geliyor · P1 · S

Nakit tablosunda sıfır; OPEX'te o ay gider yok; senaryo karşılaştırmasında o senaryoda satır yok; başka bağlamda ulaşılamayan tarih. Bu kadar farklı anlamı tek sembole bağlamak belge takibini bozar.

**Yönerge:** Sıfır = `0 ₺`; veri eksik = `Veri yok`; uygulanmıyor = `Uygulanmıyor`; modellenen dönemde oluşmuyor = `Dönem içinde yok`. Yoğun tabloda kısa sembol korunacaksa görünür, yerel ve tek anlamlı efsane şart; erişilebilir ve dışa aktarılan karşılık tam olmalı.

**Kabul:** Kullanıcı sıfır, bilinmeyen ve hesaplanmayanı ayırt eder. Hiçbiri ortalama/toplam hesabına yanlışlıkla sıfır diye sokulmaz; bu rapor hesap değişikliği değil gösterim sözleşmesi ister.

<a id="f18"></a>

### F18 — Kaynak, varsayım ve doğrulanmış sonuç aynı tonda okunuyor · P1/P2 · S/H

Applet Dayanak metinleri kaynak+yorum+şirket katsayısını tek paragrafta; OPEX'te “Kaynak araması” doğrulanmış belge gibi algılanabilir; footer “tutarlar kesinleşen kararlar” diyor. Örnek, tahmin, karar, dış kaynak ve canlı veri birbirine karışmamalı.

**Yönerge:** Kaynak türü, tarih, sürüm ve uyarlama ayrı alanlar olsun. Arama bağlantısı “kaynak bulundu/doğrulandı” sayılmaz. “Canlı” bağlantı durumu verinin doğruluğunu veya bütün varsayımların güncelliğini kanıtlamaz. Teknik motor sürümü kullanıcı kararının önüne geçmesin; ayrıntıdan erişilsin.

**Kabul:** Bir tutarın gerçek mi örnek mi olduğu, hangi dönemi kapsadığı ve son doğrulama durumu anlaşılır. Kaynak için gereken metin değer düğmesine konulmaz. Finansal/hukuki doğruluk bu raporda ayrıca doğrulanmış sayılmaz.

<a id="f19"></a>

### F19 — Gezinti adları, yer bilgisi ve numaralar aynı sözlüğü paylaşmıyor · P2 · S/H

Menüde “Applet”, sayfada “Ücret ve performans applet'leri”; OPEX kırıntısında “OpEx”, h1'de “Operasyonel Giderler”. Bazı sayfalarda numara rol sırası, bazılarında bölüm sırası, bazılarında model numarası.

**Yönerge:** Menü kısa adı ve tam sayfa adı için açık eşleme sözlüğü tut. Numarayı yalnız anlamlı sıra varsa kullan; rastgele dekoratif rozet yapma. Uzun sayfada bölüme doğrudan bağlantı ve geri dönüş konumu sağla. İş ortaklığı sonunda diğer programa geçiliyorsa sonraki hedefte marka adını yaz.

**Kabul:** Kullanıcı menü, başlık ve belge bağlantısının aynı yere işaret ettiğini anlayabilir. Seçili görünüm ve klavye odağı farklıdır; bölüm değişimi odağı ve adresi tutarlı günceller.

<a id="f20"></a>

### F20 — Dokümanın hangi sürümünün bağlayıcı olduğu izlenmiyor · P1/P2 · S

Kökte `ux_v2.md`, takip edilen `docs/ux_v2.md` ve birden çok önceki rapor var. Bu incelemede kökteki üç rapor untracked. Aynı belgenin kopyaları ayrı ayrı değişirse uygulayıcı güncel kuralı kaçırabilir. Bu henüz kesin içerik çelişkisi saptandı iddiası değildir; sürüm yönetimi açığıdır.

**Yönerge:** Tek kanonik kaynak ve kısa indeks seç; onaysız dosya silme/taşıma yapma. Her yönergeye kimlik, kullanıcı kararı/öneri ayrımı, kapsam, değişiklik tarihi, bileşen, test, kanıt ve uygulama durumu ver. Kaynak yorumunun eski “4 sn” kuralı ile yeni sıfırlama sözleşmesi gibi ayrışmaları takip et.

**Kabul:** “Bu karar nerede, hangi bileşene uygulanıyor, hangi test ispatlıyor?” sorularının üçü de cevapsız kalmaz. `planlandı`, `uygulandı`, `yerelde doğrulandı`, `CI doğrulandı`, `yayında doğrulandı` ayrı statülerdir.

<a id="f21"></a>

### F21 — Grafik şekli korunurken okuma sorusu kaybolabiliyor · P2 · S/H

Dar ekran eşdeğerleri uygulanmış; koru. Ancak çizgi listesine dönüşürken eğilim, matris kayda dönüşürken komşuluk, kırpılmış çubukta üst sınır bilgisi kaybolabilir. Bütün 28 tür §9'da ayrı ele alındı.

**Yönerge:** Her grafiğe “hangi soruyu cevaplıyor?” tanımı, birim, karşılaştırma tabanı ve metinsel/veri karşılığı ekle. Özet yalnız bütün sayıları arka arkaya okumamalı; kritik sonuç ve dönemi taşımalı. Renk dışında seri adı, çizgi deseni veya doğrudan etiket kullan; küçük alanda her noktaya etiket basma.

**Kabul:** Tooltip açamayan kullanıcı da aynı karar sorusunu cevaplayabilir. Sayılar korunurken ilişki kaybolmaz. Üst sınırın dışındaki değer “tavana eşit” sanılmaz.

<a id="f22"></a>

### F22 — Kimlik, seçim, durum ve odak için ayrı görsel dil gerekiyor · P2 · S/H

Rol rengi, senaryo rengi, iyi/kötü durum, aktif seçim ve veri değişim vurgusu farklı anlamlar. Aynı yeşil tek başına hem Medyan hem başarılı hem kaydedildi anlatmamalı.

**Yönerge:** Semantik token ve görünür metin sözlüğü: identity / selected / status / changed / focus. Yeni renk yığını yerine mevcut marka içinde biçim, konum ve sözcüklerle ayrım yap. Çevreleyen odak halkası ekleme; mevcut tek merkezi, çevrelemeyen görünür odak politikasını koru. Pill/switch dışı radius yasağını ve kayıtlı istisnaları koru.

**Kabul:** Renk kaldırıldığında seçili, uyarı ve odak ayırt edilir. Tema, forced-colors ve reduced-motion ayrı test edilir. Bu turda kontrastın tüm varyantları ölçülmedi; AA geçti iddiası yok.

<a id="f23"></a>

### F23 — Bekleme, hata, boşluk ve eski veri de okunabilir içeriktir · P1/P2 · S/H

Mutlu yol güzel olsa bile disabled düğme, uzun bekleme, kayıt başarısızlığı ve eski veri farklı anlam taşır. “Canlı” veya “Kaydedildi” yalnız gerçekten olan olayı anlatmalı. Görsel hata ile kaynak veri hatasını aynı kelimeyle geçiştirme.

**Yönerge:** Her durumda ne oldu → ne etkileniyor → ne yapabilirim. Yanıtı olmayan teknik ayrıntıyı ilk cümle yapma. Çıktı eksikse ana sonuçta kapsam görünür; boş arama sıfır sonuçtur, sistem hatası değildir.

**Kabul:** Boş, 0, yükleniyor, başarısız ve son alınan veri birbirinden ayırt edilir. Yardımcı teknolojiye status doğru anda bildirilir; her sayı değişiminde bütün uzun özeti yeniden okutma.

<a id="f24"></a>

### F24 — Uzun sayfa belge olarak takip edilemiyor · P2 · R/S/H

Gelir planı mobil başlangıç durumunda yaklaşık 30,7 bin px. Çok sayıda tablo ve grafik aynı terimleri tekrar ederek devam ediyor. Sorun yalnız uzunluk değildir: kullanıcı nerede olduğunu, önceki varsayımın hangi sonucu etkilediğini ve hangi bölüme geri döneceğini yeniden kuruyor.

**Yönerge:** Karar odaklı bölüm dizini; kalıcı bölüm adresi; kısa bölüm sorusu; aynı model/girdi/çıktı kimlikleri. Önerilen gelir akışı: Sonuç → Senaryo → Hedef tarihleri → Kadro katkısı → Kanal ekonomisi → Aylık sonuç → Başabaş → Varsayımlar. Bölümü bölmek görev bağını koparmamalı. Her açıklamaya daha fazla accordion ekleme; önce tekrarları kaldır.

**Kabul:** Kullanıcı bir sonucu ilgili varsayıma ve geri sonuca izleyebilir; bölümün adresi paylaşılabilir; geri/ileri seçim ve yer bağlamını korur. Sayfa yüksekliğine keyfi üst sınır konulmaz.

<a id="bolum-4"></a>

## 4. UX yaklaşımlarının bu projedeki karşılığı

Aşağıdaki tablo ekolleri süs başlığı olarak kullanmaz: her yaklaşımı bir tasarım kararı, gözlenebilir sonuç ve aşırı uygulama sınırına bağlar. Bunlar kullanıcı testinin yerine geçen evrensel puan formülleri değildir. Özellikle “7 öğe sınırı”, “her şey bir satır olmalı” veya “her zaman daha çok boşluk” gibi kestirme kurallar çıkarılmamalıdır.

| Yaklaşım | Bu projede uygulanacak karar | Gözlenecek sonuç | Yanlış uygulama / denge |
|---|---|---|---|
| Estetik–kullanılabilirlik etkisi | Tutarlı değer etiketleri, kontrollü vurgu ve ritim; F01/F06. | Güzel bulma ile doğru seçim ayrı sorulur. | Beğeni yüksek diye yanlış seçimi kabul etme. |
| Visceral tasarım | İlk bakışta düzgün hizalar, aynı tür seçenekler, açık bir ana sonuç. | Kullanıcı ilk bakışta ana değer ve seçili durumu gösterebilir. | Büyük kutular ve güçlü renkler tek başına güven kanıtı değildir. |
| Behavioral tasarım | Seçim, onay, hata ve geri alma davranışları öngörülebilir; F02/F14/F23. | Kullanıcı sonucu doğru tahmin eder, hata sonrası devam eder. | Sadece ilk ekranı değerlendirip gerçek görevi atlama. |
| Reflective tasarım | Kaynak, sürüm ve karar izi; F18/F20. | Kullanıcı sonucun nasıl oluştuğunu başkasına anlatabilir. | Teknik sürüm numarasını temel görevin önüne koyma. |
| White/negative space | İlişkili öğeler yakın, farklı görevler ayrık; F04. | Kontrolün yardımını yanlış grupla eşleştirme azalır. | Her satırı eşit yüksekliğe uzatıp mobilde boş koridor üretme. |
| Visual hierarchy | Ana sonuç → kritik durum → karşılaştırma → yöntem; F05. | İlk cevap bulunduğunda ayrıntıya giden yol açık. | Her sayı büyük, her başlık kalın, her not renkli olmasın. |
| Consistency | Aynı görev aynı etiket, birim ve davranış; F03/F16/F22. | Öğrenilen kalıp diğer sayfada da çalışır. | İşlevi farklı tab, switch ve işlem düğmesini tek kalıba zorlamak tutarlılık değildir. |
| Proximity | Yardım kontrolle, birim sayıyla, kaynak iddiayla yakın; F04/F16/F18. | Gözün açıklama aramak için grup değiştirmesine gerek kalmaz. | Mobilde alt alta dizmek karşılaştırılan iki değeri birbirinden uzaklaştırabilir. |
| Similarity | Eşdeğer seçenek aynı bilgi şemasında; kimlik ve durum farklı sözlükte. | `%60`, `%80`, `%100` aynı düzeyde algılanır. | Bir seçenek uzun kaynak paragrafı taşıyıp diğerlerinden önemli görünmesin. |
| Continuity | Seçimden sonuca ve sonuçtan varsayıma iz sürülebilir; F11/F24. | Kullanıcı işlem sırasını ve yerini kaybetmez. | Dinamik yer değiştirme, yeni sıraya atlayan düğme, yeniden sıralanan kayıt sürekliliği bozar. |
| Common region | Ortak yüzey yalnız ortak görevi gruplayacak; F04. | Kullanıcı bölgenin hangi tek işi yaptığını adlandırır. | Her paragrafı kart yapıp gerçek grup sınırlarını silikleştirme. |
| Figure–ground | Seçili durum arka plandan ayrılır; kaynak metni ikincil kalır. | Seçim ve uyarı renksiz görünümde de ayrışır. | Seçili dışındakileri okunmaz derecede soluklaştırma. |
| Fitts yaklaşımı | Tıklama hedefi, görünür kutu ve boşluk ayrı yönetilir; F03/F15. | Eylem düğmesi durum değişirken kaçmaz; yanlış komşuya tıklanmaz. | Kontrolü tek satıra sığdırmak için hedefi küçültme. |
| Hick–Hyman yaklaşımı | Önce görev grubu, sonra anlamlı seçenek; F01/F12. | Gereksiz seçenek ve terim ayıklama işi azalır. | Seçenek sayısını azaltmak adına gereken alternatifi gizleme; süre için bilimsel olmayan tahmin üretme. |
| Miller / çalışma belleği | Sayı ezberletmek yerine ilişkili değerleri birlikte göster; F08. | Kullanıcı iki compa hücresini kapat/aç ile aklında tutmaz. | Menüleri mekanik olarak 7'ye bölme; görünür öğe sayısı bellek kapasitesiyle aynı şey değildir. |
| Recognition over recall | Birim, dönem, aktif kaynak bulunduğu yerde; F16/F18. | Üstteki açıklamayı hatırlamadan kayıt anlaşılır. | Tüm uzun bağlamı her satıra tekrar yazma. |
| Information scent | Menü/bölüm/bağlantı adı varıştaki içerikle uyuşur; F19. | Kullanıcı doğru bölümü tahmin ederek bulur. | Sırf kısa diye anlamı olmayan jargon kısaltması üretme. |
| Progressive disclosure | Karar için gerekli bilgi açık; yöntem ve seyrek kullanılan ayrıntı isteğe bağlı. | Başlangıç yoğunluğu düşer, eksik bağlam oluşmaz. | Kritik uyarıyı veya karşılaştırma değerini accordion içine saklama. |
| Peak–end yaklaşımı | Hata/onay/kopyalama ve görev sonu net; F14/F15/F23. | Kullanıcı ne yaptığını ve kaydın durumunu bilir. | Başarı animasyonu gerçek kayıt veya doğru sonuç yerine geçmez. |
| Change blindness / süreklilik | Değişen değer kısa işaret + kalıcı önce/sonra iziyle anlaşılır. | Kaynak veya senaryo değişiminin etkisi bulunabilir. | Yanıp sönen her sayı dikkat çeker ama sebebi anlatmaz. |

Estetik beğeninin küçük kullanılabilirlik sorunlarını örtebilmesi nedeniyle beğeni ve görev başarısını ayrı değerlendirmek gerekir; [NN/g açıklaması](https://www.nngroup.com/articles/aesthetic-usability-effect/). İlişkiyi boşlukla kurma ve mobilde yeniden değerlendirme için [yakınlık](https://www.nngroup.com/articles/gestalt-proximity/); eşdeğer öğelere tutarlı görsel özellik verme için [benzerlik](https://www.nngroup.com/articles/gestalt-similarity/) yararlıdır. Tablodaki uygulama kararları bu projeye yönelik çıkarımlardır; kaynakların yayımladığı kesin piksel veya başarı yüzdeleri değildir.

<a id="bolum-5"></a>

## 5. Master component ve içerik alanı sözleşmeleri

Bu bölüm yeni bir framework veya gereksiz bileşen katmanı kurma talimatı değildir. Kurulu Astro/React/Mantine yığını korunur. Önce mevcut ortak parçaların sorumlulukları netleştirilir; ancak gerçek farklı davranış varsa yeni parça açılır.

### 5.1 Kontrolün altı ayrı bilgi alanı

| Alan | Örnek | Nerede görünür? | İçine girmemesi gereken |
|---|---|---|---|
| Grup adı | Aylık abonelik fiyatı | Kontrolün kalıcı etiketi | Uzun hesap yöntemi |
| Seçilebilir değer | 399 € | Seçenek düğmesi/Select seçeneği | Parametre, varsayılan, senaryonun |
| Etkin bağlam | Değer sabit / planla güncellenir | Ayrı kısa durum veya açık davranış kontrolü | Rakamın yerine geçen belirsiz ikon |
| Gerekli yardım | Satıcı başına aylık bedel | Hemen altındaki bağlı açıklama | Bütün finans modelinin açıklaması |
| Kaynak/yöntem | Başlangıç fiyatı parametresi | Yakın ayrıntı/bağlantı | Seçenek etiketinde parantez |
| Geri bildirim | 449 € uygulandı | Değişim/hata durum alanı | Bütün seçenek adlarını uzatma |

Aynı bilgi aynı anda altı alanda tekrarlanmaz. Birim hem grupta hem değerde bulunabilir; bunun gerekçesi bağlamdan kopunca okunabilmektir. Tekrarlama kararını otomatik karakter sayacı vermemeli.

### 5.2 İçerik genişliğine göre sunum

1. Sayısal seçenekler, yeterli alan varken tek satırda eşdeğer kısa değerler olarak sunulur.
2. Sığmıyorsa önce kaynak metni ve gereksiz tekrar kaldırılır; sonra kapsayıcının gereksiz iç boşluğu değerlendirilir.
3. Yine sığmıyorsa görev türüne göre markalı Select, kısa açık liste veya odaklı karşılaştırma kabuğu kullanılır. **Dört tarihi 256 px'e metni küçülterek veya kırparak zorla sığdırma.**
4. Aynı sunum içinde rastgele iki/üç sıralı segment kırılması kabul edilmez. Daha uygun sunuma geçmek, kullanıcının “iki satıra dönüşmesin” isteğinin çözümüdür. Gruplar arasında alt alta akış ayrı konudur.
5. 200% metin veya özel aralık ayarında tek satır zorunluluğu içerik kaybına neden olamaz. Değer/birim mümkünse atomik tutulur; tüm arayüze `white-space: nowrap` konulmaz.
6. Karşılaştırma görevi varsa Select ile tüm alternatifleri görünmez yapmak da otomatik doğru değildir. Matris için açık kıyas görünümü tercih edilir.

Breakpoint, cihaz adına veya sırf 320/390 test değerlerine göre seçilmez; gerçek etiketlerin, tokenların ve etkileşim alanlarının sığdığı kapsayıcı genişliğinden türetilir. Font yüklendikten sonra ve büyütülmüş metinle tekrar doğrulanır.

### 5.3 Ortak parçaların görev haritası

| Mevcut parça | Netleştirilecek sorumluluk | Ortak tüketiciler |
|---|---|---|
| Choice / Dugmeler / Toggles | Kısa değer seçimi, benzersiz görünen değer, yardım ilişkisi, dar alan sunumu | Senaryo, applet, OPEX |
| SenaryoKurucu | Değer ile kaynak bağlanma modunu ayırma; bağımlı seçenekler | Gelir planı |
| PageHeader / FactsRow | Tek sayfa kimliği, kısa amaç, metadata ve araçların ayrımı | Tüm sayfalar |
| ResultSummary / Stats / Ozet / Overview | Ölçüt, değer, birim, dönem, durum; ana/ikincil ayrımı | Finans ve applet |
| DataTable / KayitListesi | Açık özet ölçütü, kayıt ekseni, karşılaştırma profili | Bütün veri tabloları |
| Eylem / ConfirmButton / Sifirla | Süresiz onay, nesne/kapsam, iptal ve mümkünse geri al | Applet, Notlar, Parametreler |
| Kopyalama eylemleri | Yer değiştirmeyen eylem, ayrı kalıcı hata çözümü | Email ve senaryo paylaşımı |
| Chart / Ajanda / Hiyerarsi / Degerler | Ortak veri, aynı karar sorusu, erişilebilir dar ekran eşdeğeri | Grafik tüketicileri |
| Gezinme parçaları | Menü/başlık eşleme, bölüm konumu, adres ve odak sürekliliği | AppFrame, Applet, Partnership |
| Kaynak/durum sunumu | Karar/örnek/tahmin/canlı/eski veri ayrımı | Dayanak, LiveStrip, footer, ParamsNotice |

### 5.4 Uygulamada korunacak ürün kararları

- 320 CSS px önce; daha geniş ekranlarda tablo/karşılaştırma avantajı korunur. Tabloyu her genişlikte kayıt listesine dönüştürme.
- Bütün okunabilir metin en az 14 CSS px; OPEX'in 15 px istisnası korunur. Tarayıcı kök yazı boyutunu küçültme.
- Outfit genel font; OPEX'in kayıtlı Roboto tercihini bu audit değiştirmez.
- Pill, switch ve açıkça kayıtlı istisnalar dışında radius 0; gereksiz kart ve kenarlık ekleme.
- Odak görünür ve seçili durumdan farklı; çevreleyen halka yok. Yalnız mevcut forced-colors istisnası geçerli. Global `outline:none` ile alternatifsiz odak gizleme yok.
- Hareket merkezi tokenlarla iki yönlü simetrik Cubic; semantik durum anında güncellenir. Reduced-motion hareketi azaltır. Görsel ölçüm animasyon ortasında yapılmaz.
- Seçim/klavye/odak, tek `isMobile` veya hover tespitiyle devre dışı bırakılmaz. Markalı mevcut Mantine kontrolleri korunur; native dropdown ile değiştirilmez.

<a id="bolum-6"></a>

## 6. Test önce: uygulanacak kabul senaryoları

Aşağıdaki **30 test taslağı** gelecekte uygulayıcı içindir; bu turda test dosyası yazılmış veya 30 test geçmiş değildir. Önce mevcut kusuru yakalayan anlamlı test, sonra ortak parçada düzeltme, sonra gerçek tüketici örnekleri. Salt “bu metin kaynakta var mı?” kontrolü davranışın yerine geçmez.

| ID | Ön koşul ve işlem | Beklenen kabul / regresyon |
|---|---|---|
| V01 | Medyan senaryosunda ayrıntıları aç. | Kapasite/elde tutma seçeneklerinde yalnız değer; Senaryonun/parametre seçenekte yok. |
| V02 | Otomatik ve sabit değer aynı sayıya eşit. | Tek görünen değer; bağlanma modu ayrı ve anlaşılır. |
| V03 | Sabit değer korunması gereken kaynak güncellemesini yap. | Otomatik değer güncellenir, sabit değer korunur; ayrı model alanları doğrulanır. |
| V04 | Hazır senaryoyu yeniden uygula, sıfırla, geri/ileri yap. | Mevcut reset/history sözleşmesi korunur; yanlış otomatik/sabit geçiş yok. |
| V05 | Fiyat parametresini 449 € gibi liste dışı geçerli değere değiştir. | Tek, tam okunur 449 €; tekrar eden 399/parametre etiketleri yok. |
| V06 | 320 ve mevcut masaüstü konteynerinde seçenekleri aç. | Segment modundaki değer grubu bir satır; sığmayan sunum kontrollü değişir; sayfa taşmaz. |
| V07 | Uzun ay/yıl ve meslek adı, font yüklenmesi, yeniden boyutlandırma. | Etiket/numara/birim kesilmez; seçim geometrisi doğru öğeyi gösterir. |
| V08 | Seçili, seçilmemiş, hover, disabled ve klavye odağına geç. | Seçili sözcük eklenmez; hedef konumu değişmez; odak ayrı görünür. |
| V09 | 200% metin ve WCAG metin aralığı ayarlarını uygula. | İçerik/işlev kaybı yok; tek satır hedefi için kırpma/küçültme yok. |
| V10 | Normal 1280 genişlikte 400% zoom veya eşdeğer 320 CSS px akış. | İki boyutlu kaydırma gerektirmeyen içerik yeniden akar; istisna kapsamı belgeli. |
| V11 | Yardımlı Choice alanına yardımcı teknolojiyle gel. | Grup etiketi, değer ve gerekli açıklama ilişkili; açıklama yalnız görsel konuma bağlı değil. |
| V12 | Tablonun masaüstü kolon sırasını değiştir. | Mobil özet ölçütü değişmez; tanısal seçim açık sözleşmeden gelir. |
| V13 | Liyakat matrisinde aynı puan için iki compa değerini karşılaştır. | Değerleri ezberlemeden fark okunur; birim ve eksen aynı yerde. |
| V14 | Mobil kayıtta girdi düzenle, sonra başlığı kapat/aç. | Başlık içinde etkileşimli torun yok; değer, odak ve açık kayıt kimliği korunur. |
| V15 | OPEX'i 320'de toplam tutara göre sırala ve filtreyi kaldır. | Kontrol erişilebilir; süzülmüş/genel toplam ve veri sırası doğru. |
| V16 | Gelir sayfasında ilk ekran ve aşağı kaydırma. | Ana sonuç görünür; gereksiz özet tekrarı yok; sabit özet önemli içeriği örtmez. |
| V17 | 320'de iş ortaklığı Ölçüm bölümünden Risk'e git. | Tüm bölümlere açık erişim; görünmeyen yatay devamı tahmin etmek gerekmiyor. |
| V18 | Aynı görevde programın sonundan diğer programa ilerle. | Hedef marka/bölüm açık; adres, odak, geri/ileri tutarlı. |
| V19 | Üç cümlelik notu düzenle. | Metin tamamı takip edilebilir; kaydet/vazgeç ve hedef not bağlamı açık. |
| V20 | Sayı alanına üst sınırı aşan taslak gir, odaktan çık. | Modele geçersiz değer gitmez; uygulanmış düzeltme ve nedeni görünür. |
| V21 | Not/Applet/Parametre sıfırlama onayını aç; 30 sn bekle. | Onay sürer, hedef/kapsam görünür, iptal mümkündür; ilk tıklama mutasyon yapmaz. |
| V22 | Parametreleri sıfırla ve geri al. | Belgelenen önceki değerler geri gelir; başka modüller etkilenmez; durum mesajı doğrudur. |
| V23 | Clipboard başarısını ve reddini kontrollü taklit et. | Düğme/komşu eylemler konum değiştirmez; hata çözümü okunabilir ve kalıcı erişilebilir. |
| V24 | Aynı finans ölçütünü gelir, nakit, özet, tablo ve CSV'de izle. | Ad, birim, dönem ve işaret tutarlı; ek fon ile negatif bakiye ayrı kavramdır. |
| V25 | 0, eksik veri, uygulanmayan satır ve ulaşılamayan tarih ver. | Dört durum farklı okunur; hepsi — veya 0 olmaz. |
| V26 | Ağ gecikmesi, hata, eski veri ve yeniden bağlantı üret. | Doğru kapsam/tarih/sonraki adım; eski veri canlı veya eksiksiz sanılmaz. |
| V27 | Aynı grafiği dar/geniş kabukta aynı veriyle göster. | Veri, toplam, eksen ve soruya cevap eşdeğer; komşuluk/eğilim kaybı ayrıca değerlendirilir. |
| V28 | Klavye, dokunma ve karma girişle kontrol et; reduced-motion/forced-colors uygula. | Merkezi odak/hareket sözleşmesi; renk tek kanıt değil; hover tek erişim yolu değil. |
| V29 | Bir bölüm bağlantısını yeni sekmede aç, bir sonucu varsayıma ve geri izle. | Aktif bağlam ve belge konumu bulunur; bölüm adresi kararlı. |
| V30 | Yönerge → bileşen → test → kanıt bağlantılarını doğrula. | Güncel sürüm ve uygulama durumu belli; kanonik belge kopyalarla çatışmıyor. |

**Ölçüm yöntemi:** Fontların hazır olmasını ve geçişin tamamlanmasını bekle. Seçenek grubu satır sayısını düğme üst koordinatlarının toleranslı kümelenmesiyle ölç; yalnız screenshot'a göz kararı bakma. Metnin gerçekten görünürlüğünü, kırpılmayı, anlamlı accessible name'i ve hedef alanını da doğrula. Tek bir normal ekran görüntüsü “tüm durumlar geçti” değildir.

**Doğrulama sırası:** İlgili değişiklik için 320 → 360 → 375 → 390 → yatay/kısa yükseklik → tablet → masaüstü. Bunlar zorunlu breakpoint değil test örnekleridir. Geçiş eşiğinde N−1/N/N+1 ayrıca. Chromium/Firefox/WebKit mevcut araçlarla; gerçek Safari/iOS/Android ayrı kanıt. Uygulayıcı önce etkilenen testleri ve gerçek proje kapılarını çalıştırır, gerekçesiz bütün kombinasyonları her metin değişiminde tekrar etmez.

WCAG, 320 px yeniden akış için iki boyutlu anlam taşıyan içeriklere istisna tanır; **her yatay tablo otomatik ihlal değildir**, [1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Bu projenin karşılaştırmayı koruyan mobil kayıt yaklaşımı ek ürün hedefidir. 44/48 px hedef alanı mevcut proje tercihidir; AA'nın genel minimum hedef ölçüsüyle aynı şey değildir, [2.5.8](https://www.w3.org/TR/WCAG22/#target-size-minimum). Süreye bağlı onay için [2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html); yeterli ama gereksiz yığılmayan alan açıklaması için [3.3.2](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) dikkate alınır. Bu dört kontrol bütün WCAG 2.2 AA denetiminin yerine geçmez.

<a id="bolum-7"></a>

## 7. Uygulama sırası ve teslim sınırı

1. **Etiket + davranış:** F01/F02/F03. Önce otomatik/sabit değer modelini anla; sonra etiketleri sadeleştir. Salt arama/değiştirme yapma.
2. **Kritik anlam:** F16/F17/F18. Fon ihtiyacı, yüzde tabanı, boş değer ve kaynak statüsü. Bu konuların anlaşılması, görsel makyajdan önce gelir.
3. **Ortak durumlar:** F13/F14/F15/F23. Sessiz düzeltme, onay ve kopya/hata davranışlarını ortaklaştır.
4. **Mobil karar görevleri:** F07/F08/F09/F10. Kayıt özeti, matris kıyası, filtre araçları ve görünmeyen gezinme.
5. **Görsel ritim ve belge akışı:** F04/F05/F06/F11/F19/F21/F22/F24. Tekrarlanan bağlamı azalt; iş sırasını belirginleştir.
6. **İzlenebilirlik:** F20 her adımda. Kanonik yönerge, ilgili test ve gerçek doğrulama kanıtı aynı kayıtta güncellenir.

### Claude için uygulama sözleşmesi

- Başlamadan güncel Git durumunu ve bu raporun baz commit'ini karşılaştır. Kullanıcının/başka ajanın değişikliklerini geri alma. Kaynak değiştiyse ilgili bulgunun hâlâ geçerli olduğunu doğrula.
- Bu raporu “166 bileşeni yeniden yaz” talimatı sayma. Aynı kusur ortak bileşende bir kez çözülür; bütün ilgili tüketicilerde doğrulanır. “Koru” kayıtlarını dekoratif standartlaştırmayla bozma.
- Kullanıcı uygulamayı ayrıca istediğinde seçilen paket için başarısız testi yaz; düzelt; testin geçtiğini ve yeni davranışın anlamını doğrula. Bu rapor kendi başına yayın/push veya toplu refactor yetkisi vermez.
- Varsayılan değer, birim, finans modeli, storage ve URL sözleşmesi tasarım değişikliği sırasında sessizce değiştirilemez.
- Önce/sonra/fark ve gerçek test sonucunu kaydet. Görsel referansı körlemesine güncelleme. Anlamlı UI tesliminde bağımsız QA gerekir; yapılamadıysa `not_run` yaz.
- MUST: açık kullanıcı kuralları ve kritik sözleşmeler. SHOULD: bu rapordaki iyileştirmeler; bağlama göre gerekçeli alternatif olabilir. MAY: seçici/kıyas paneli gibi uygulama alternatifleri. Öneriyi bilimsel zorunluluk gibi sunma.

İz kaydı örneği:

```text
Kural: VA-01 — değer seçeneğinde kaynak metni bulunmaz
Kaynak: Kullanıcı isteği, 28 Ekim 2026; bu rapor F01/F02
Kapsam: SenaryoKurucu → Choice; OPEX ve applet benzer kullanımlar
Beklenen: %100 / 399 € / Mart 2027; bağlanma modu ayrı
Test: V01–V07
Kanıt: commit + tarayıcı/viewport + önce/sonra + test sonucu
Durum: bu raporda planlandı; uygulama ve yayın doğrulanmadı
İstisna: yok; alan etiketi ve gerekli birim kaldırılmaz
```

<a id="bolum-8"></a>

## 8. Bütün proje bileşenleri: tek tek değerlendirme

**Okuma:** Satır başındaki `C` kimliği bu raporun envanter kimliğidir. Kaynak konumu `34a4bd2` içindir; satır numarası daha sonra değişebilir. “İyileştir” bir doğrulanmış runtime arızası demek değildir; somut tasarım değerlendirmesidir. İlgili `F` başlığında kanıt düzeyi ve kabul ölçütü bulunur. Aynı adlı bileşenler dosyasıyla ayrılmıştır. Sarmalayıcılara görsel kusur uydurulmamıştır.


**Bileşen dosyaları:** [AppFrame](#dosya-1) · [BrandMark](#dosya-2) · [Giris](#dosya-3) · [ModelContext](#dosya-4) · [PageHeader](#dosya-5) · [ResultSummary](#dosya-6) · [Senaryo](#dosya-7) · [SenaryoKurucu](#dosya-8) · [appletKit](#dosya-9) · [ui](#dosya-10) · [AppletPage](#dosya-11) · [BcgPage](#dosya-12) · [CashflowPage](#dosya-13) · [EmailPage](#dosya-14) · [HomePage](#dosya-15) · [NotesPage](#dosya-16) · [OpexPage](#dosya-17) · [OtherPages](#dosya-18) · [ParamsPage](#dosya-19) · [PartnershipPage](#dosya-20) · [RevenuePage](#dosya-21) · [RolePage](#dosya-22)


<a id="dosya-1"></a>

### src/components/AppFrame.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C001 · `ThemeToggle` · L50 | Koru | İkonlu tema anahtarı mevcut kullanıcı kararıdır; sırf diğer kontroller metinli diye etiket ekleme. Tema değişince seçili ve odak durumlarının ayrımını koru. | [F22](#f22) |
| C002 · `ParamsNotice` · L99 | İyileştir | Değişiklik sayısı ve Parametreler bağlantısı yararlı. Her sayfada uzun açıklamayı tekrar etmek yerine kısa durum + kapsam ayrıntısı kullan; yerel değişiklik uyarısını kaldırma. | [F05](#f05),[F18](#f18) |
| C003 · `NavItem` · L119 | Koru | Rol numarası, ikon ve başlık üç farklı işaret taşıyor. Numara gerçekten organizasyon sırasıysa koru; menü sırasıyla karışmamasını açıklığa kavuştur. | [F19](#f19) |
| C004 · `NavMenu` · L178 | İyileştir | Rol numaralarıyla numarasız yardımcı sayfalar aynı menüde. Rol/sayfa ayrımını grup başlığıyla kur; fazladan her öğeye rozet ekleme. | [F19](#f19) |
| C005 · `CekmeceGezinme` · L230 | İyileştir | Masaüstü menüsünün içerik adları korunuyor. Uzun rol adlarını kesmeden aç; alt grupların başlangıcını yalnız boş noktayla anlatma. | [F04](#f04),[F19](#f19) |
| C006 · `AppFrame` · L303 | Düzelt | Alt bilgi tüm tutarları kesinleşmiş karar gibi anlatıyor; sayfalar örnek ve tahmin de içeriyor. Sayfa türüne göre kaynak/statü metni üret; uzun standart paragrafı her ekranın sonuna yükleme. | [F18](#f18),[F20](#f20) |

<a id="dosya-2"></a>

### src/components/BrandMark.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C007 · `BrandMark` · L11 | Koru | Marka geometrisi işlevsel gezinmeyle yarışacak ek slogan/rozet almamalı. Dar ekranda marka + menü + tema sırasını koru. | [F04](#f04) |

<a id="dosya-3"></a>

### src/components/Giris.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C008 · `GirisEkrani` · L12 | İyileştir | Alan adları ve hata ilişkisi mevcut. İşlem sürerken pasif düğmenin nedenini görünür kısa durumla anlat; bekleme ile yanlış parola durumunu karıştırma. | [F23](#f23) |
| C009 · `CikisDugmesi` · L99 | Koru | Çıkış yap açık fiil/nesne kalıbı. Alt bilgide diğer gezinme bağlantıları arasında kaybolmaması yeterli; yeni ikon zorunlu değil. | [F03](#f03) |

<a id="dosya-4"></a>

### src/components/ModelContext.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C010 · `ModelProvider` · L24 | Görsel yüzey yok | Bağlam sağlayıcısını kart/renk ölçütüyle puanlama. Parametre kaynağı ve kayıt durumunun tüm tüketicilere aynı anlamla taşınması sözleşmesini doğrula. | [F18](#f18),[F20](#f20) |

<a id="dosya-5"></a>

### src/components/PageHeader.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C011 · `PageHeader` · L30 | Koru ve daralt | Tek h1, amaç, breadcrumb ve dt/dd metadata uygulanmış. Çok uzun amacı görev cümlesi + ayrı açıklamaya böl; OPEX kur aracının başlık yoluna karışmasını engelle. | [F04](#f04),[F05](#f05) |

<a id="dosya-6"></a>

### src/components/ResultSummary.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C012 · `ResultSummary` · L30 | İyileştir | Ana sonuç, karşılaştırma ve kritik durum artık ayrılmış. Yapışkan özetle aynı değerlerin ilk ekranda tekrarını azalt; negatif net ile gereken pozitif fon tutarını açık adlandır. | [F05](#f05),[F16](#f16) |

<a id="dosya-7"></a>

### src/components/Senaryo.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C013 · `SenaryoSecimi` · L13 | İyileştir | Senaryo adı seçenek, senaryo açıklaması grup yardımında kalmalı. Adı kaynak veya sonuç bilgisiyle uzatan tüketiciye izin verme. | [F01](#f01),[F03](#f03) |
| C014 · `ModSecimi` · L18 | İyileştir | Görünüm adı bir değer filtresi değil sunum tercihidir. Seçili / Üçü üst üste ifadelerinin hangi serileri etkilediğini grup başlığında belirt. | [F03](#f03) |
| C015 · `Araclar` · L37 | İyileştir | Seçici ve eylem aynı taşıyıcıda yer alabilir; aradaki görev farkını hizalama ve boşlukla koru. Her araca ayrıca gri kutu ekleme. | [F04](#f04) |

<a id="dosya-8"></a>

### src/components/SenaryoKurucu.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C016 · `SenaryoKurucu` · L20 | Düzelt | Değer + kaynak karışımı, aynı etkili değerin otomatik/sabit kopyaları, uzun Özel etiketi ve araç durumları birlikte çözülmeli. Önce F01/F02 sözleşmesi. | [F01](#f01),[F02](#f02),[F04](#f04),[F15](#f15) |
| C017 · `YapiskanOzet` · L175 | Düzelt | 320 px görünümünde sağdaki sonuçlar yatay alan dışında. Bir öncelikli sonuç görünür kalsın, diğerleri adlandırılmış ayrıntıda erişilsin; ilk ekranda ResultSummary tekrarını azalt. | [F05](#f05),[F10](#f10) |

<a id="dosya-9"></a>

### src/components/appletKit.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C018 · `Sayi` · L17 | İyileştir | Taslak sayı odak çıkışında sınırlandırılıyor. Değer değiştirildiyse eski → geçerli değer ve sınır nedeni alan yanında görünmeli; küçük rakam hareketiyle yetinme. | [F13](#f13) |
| C019 · `Metin` · L91 | İyileştir | Boş metni odak çıkışında eski ada döndürmek sessiz düzeltmedir. Gerekli alanı ve neden kaydedilmediğini belirt; uzun meslek adı girişinin görünür düzenleme alanını test et. | [F12](#f12),[F13](#f13) |
| C020 · `Secim` · L117 | İyileştir | Markalı Select korunmalı. Grup adı seçenek adına yapıştırılmamalı; seçilen uzun meslek/uzmanlık okunabilmeli, yalnız tooltip çözümü kullanılmamalı. | [F01](#f01),[F12](#f12) |
| C021 · `Anahtar` · L162 | Koru | Görünür etiket ve açıklama ilişkisi var. Anahtar açık/kapalı bir kural içindir; sayısal değer seçimi için çoğaltılmamalı. | [F03](#f03) |
| C022 · `Onay` · L182 | Koru | Gizli etiketli hücrede erişilebilir ad ve geniş etkileşim alanı var. Mobil panelde satır/sütun bağlamı adın içinde kalmalı. | [F07](#f07) |
| C023 · `Dugmeler` · L196 | İyileştir | Choice ile benzer seçim işi ikinci bir görsel sözleşmeyle yürütülüyor. Seçim/ön ayar türünü ayıran ortak içerik ve durum kuralları kullan. | [F03](#f03),[F22](#f22) |
| C024 · `Eylem` · L214 | Düzelt | Dört saniyelik onay ve Emin misiniz? etiketi nesneyi kaybettiriyor. Süresiz kapsamlı onay, açık uygulama fiili ve Vazgeç kullan. | [F14](#f14) |
| C025 · `DurumHapi` · L244 | Koru ve açıklaştır | Geçti/Uyarı/Kaldı yazısı renge eşlik ediyor. Neyin geçtiği yakın satır adında kalmalı; renk rol kimliği gibi kullanılmamalı. | [F22](#f22) |
| C026 · `Cubuk` · L253 | İyileştir | Oran 1 üstünde görsel olarak tavana kırpılıyor. Yanındaki sayıda gerçek değer ve tavan aşımı korunmalı; bütün yüksek değerler eşit görünmemeli. | [F21](#f21) |
| C027 · `BandCizgi` · L267 | İyileştir | İşaret açıklaması üst tablo notuna bağlı; mobilde uzaklaşıyor. Mevcut/hedef/orta değerlerini kaydın yanında, çizgi örnekleriyle eşleştir. | [F08](#f08),[F21](#f21) |
| C028 · `Dayanak` · L282 | Düzelt | Uzun kaynak paragrafı işlemden önce yüksek dikkat tüketiyor. Kısa kaynak kimliği + tarih + bağlantı; şirket uyarlamasını kaynak iddiasından ayır. | [F18](#f18) |
| C029 · `Girdiler` · L290 | İyileştir | Aynı ızgara basit ve çok koşullu girişleri taşıyor. Hesap sırasına göre anlamlı alt gruplar oluştur; her alanın etrafına yeni kart koyma. | [F04](#f04),[F12](#f12) |
| C030 · `Araclar` · L299 | İyileştir | Ekle/sil/örneğe dön eylemlerini aynı ağırlıkla dizme. Oluşturma, düzenleme ve yıkıcı işlemi düzen ve açık kapsamla ayır. | [F03](#f03),[F14](#f14) |
| C031 · `Ozet` · L304 | İyileştir | Stats ile aynı düzeni ikinci uygulamada sürdürmek zamanla ayrıştırır. Birim, dönem, durum ve not için ortak sonuç sözleşmesi kullan. | [F05](#f05),[F16](#f16) |

<a id="dosya-10"></a>

### src/components/ui.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C032 · `RoleChip` · L44 | İyileştir | Rol ve senaryo kimliği aynı hapı kullanıyor. Hapın kimlik anlattığı sabit kalsın; başarı/uyarı anlamı yüklenmesin. | [F22](#f22) |
| C033 · `StatusChip` · L52 | Koru ve ayrıştır | Durum metni görünür kalmalı. RoleChip ile aynı geometri tek başına sorun değil; anlam ve renk sözlüğü ayrı olmalı. | [F22](#f22) |
| C034 · `Avatar` · L60 | Koru | Dekoratif ikon aria-hidden; görünür rol adıyla birlikte kullanımı koru. İkonun tek başına yeni eylem gibi algılanmasını önle. | [F19](#f19) |
| C035 · `TextLink` · L69 | Koru | Alt çizgili metin bağlantısı keşfedilebilir. Bağlantı metni hedefi anlatsın; genel Buraya/Tıkla etiketlerine dönme. | [F19](#f19) |
| C036 · `FactsRow` · L78 | İyileştir | dt/dd ilişkisi doğru. Uzun açıklamayla kısa tarihin aynı satır ritmini bozduğu kullanımlarda metadata ve anlatıyı ayır. | [F04](#f04),[F16](#f16) |
| C037 · `Section` · L96 | İyileştir | Bölüm numarası + başlık + açıklama + tablo başlığı tekrarlanabiliyor. Her seviye ayrı soruya cevap versin; aynı başlığı iki defa okutma. | [F05](#f05),[F24](#f24) |
| C038 · `KayitListesi` · L255 | İyileştir | Başlık ile salt okunur özet ayrımı uygulanmış. Kapalı kayıtta karar verdiren ölçüt ve birimi görünür tut; bütün kayıtlar aynı anlamsız özeti kullanmasın. | [F07](#f07),[F08](#f08) |
| C039 · `DataTable` · L319 | Düzelt | Özet verilmezse ilk uygun sütun/son satır seçiliyor. Her iş tablosu açık özet sözleşmesi vermeli; kolon sırası değişince mobil anlam değişmemeli. | [F07](#f07) |
| C040 · `Target` · L463 | İyileştir | Kilometre taşı alt yazısı yararlı; her satırda aynı ibareyi tekrar etmek yerine gerçek tarih/ölçüt farkını öne çıkar. | [F05](#f05),[F11](#f11) |
| C041 · `Stats` · L474 | İyileştir | Büyük sayılar eşit vurgu alıyor. Bir ana karar değeri seç; diğerlerini ölçüt/birim/dönem sırasıyla ikincil yap. | [F05](#f05),[F16](#f16) |
| C042 · `KpiGrid` · L490 | İyileştir | Değer, birim ve artış ayrı alanlarda. Mobilde sayı ile birim ayrılmasın; hedef ile gerçekleşme etiketleri karışmasın. | [F16](#f16),[F23](#f23) |
| C043 · `Note` · L507 | İyileştir | Genel not kutusu yöntem, uyarı ve eylem kuralını aynı görünümde sunabiliyor. Kritik karar koşulunu sıradan açıklamadan ayır. | [F04](#f04),[F22](#f22) |
| C044 · `Chart` · L527 | Koru ve tamamla | Dar ekran eşdeğerleri ve yüklenme fallback'i var. Eşdeğer görünümde aynı sorunun cevabı, birim ve seçim bağlamı korunmalı; her grafik ayrıca G tablosunda. | [F08](#f08),[F21](#f21) |
| C045 · `Ajanda` · L685 | İyileştir | Gantt yerine tarihli kayıt doğru başlangıç. Ay başlıkları arasında sorumlu/tarih karşılaştırmasını koru; aynı işin iki görünümünde farklı sıra üretme. | [F11](#f11) |
| C046 · `Hiyerarsi` · L795 | Koru | Dikey ağaç mobilde ilişkileri erişilebilir kılıyor. Çocuk sayısı ve üst ilişki kaybolmasın; organizasyon anlamını düz listeye indirgeme. | [F19](#f19) |
| C047 · `HiyerarsiDugum` · L803 | İyileştir | Derin dallarda girinti kullanılabilir metin alanını tüketir. 320 px'te uzun rol adlarıyla girinti bütçesi ve geri üst bağlamı test et. | [F12](#f12),[F19](#f19) |
| C048 · `Degerler` · L832 | İyileştir | BCG mobil değerleri var. Kutu etiketi + büyüme + göreli pay aynı kayıtta; logaritmik eksendeki anlamı listede yalnız sıralamaya bırakma. | [F08](#f08),[F21](#f21) |
| C049 · `Choice` · L880 | Düzelt | İçerik türü, uzunluk/adaptasyon ve yardım ilişkisi sözleşmesi yok; bütün seçenekler düğme grubu. Değer seçimi ile gezinmeyi ayır; küçük ekranda kör nowrap uygulama. | [F01](#f01),[F02](#f02),[F03](#f03),[F04](#f04) |

<a id="dosya-11"></a>

### src/views/AppletPage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C050 · `Bolum` · L87 | İyileştir | Applet adı + sorusu iyi. Üst sayfa amacı ve Dayanak ile üç kez aynı açıklamayı kurma; görev sorusunu kısa tut. | [F05](#f05) |
| C051 · `HucreSecimi` · L99 | İyileştir | Meslek, uzmanlık, seviye bağımlı seçimler. Üst seçim değişince alt seçimin değiştiğini yakın yerde bildir; uzun birleşik başlık üretme. | [F01](#f01),[F23](#f23) |
| C052 · `KatalogApplet` · L113 | İyileştir | Seviye/meslek/uzmanlık editörleri aynı uzun sayfada. Etki kapsamını başta özetle; her tabloya ayrı ekle/sil kapsamı ver. | [F12](#f12),[F14](#f14),[F18](#f18) |
| C053 · `RutbeMatrisi` · L319 | Düzelt | Meslek × seviye karşılaştırması mobil kayıtlarda parçalanıyor. Aynı meslek için iki komşu seviyeyi yan yana anlamca eşleştiren odaklı karşılaştırma ver. | [F08](#f08) |
| C054 · `KademeSerisi` · L390 | İyileştir | Aritmetik ve geometrik sonuçların yalnız alt satır oranlarıyla izlenmesi zor. Aynı dereceyi iki modelle karşılaştıran görünür fark satırı kullan. | [F08](#f08),[F16](#f16) |
| C055 · `IsDegerleme` · L442 | İyileştir | Faktör/ağırlık/pozisyon/eşik dört düzey. Hangi girişin puanı, hangisinin dereceyi değiştirdiğini ayır; normalizasyonu kaynakla karıştırma. | [F12](#f12),[F18](#f18) |
| C056 · `TabanUcret` · L517 | İyileştir | Çarpan zincirinde ara sonuç ve nihai sonuç farklı görsel roller taşımalı. Birim, saatlik/aylık dönüşüm ve taban düzeltmesini yakın sonuçta açıkla. | [F16](#f16),[F24](#f24) |
| C057 · `BandKonumu` · L599 | Düzelt | Compa, mevcut ve çizgi efsanesi farklı yerlere dağılıyor. Her kişide mevcut → hedef → fark, aynı ortak ölçekte ve yerel açıklamayla göster. | [F08](#f08),[F16](#f16),[F21](#f21) |
| C058 · `LiyakatMatrisi` · L668 | Düzelt | Mobilde puan satırları kapanıyor, komşu compa hücreleri görünmüyor. Puan + mevcut band konumu + önerilen zamı beraber okunur yap; matris keşfini koru. | [F08](#f08) |
| C059 · `YillikZam` · L735 | İyileştir | Çok sayıda yüzde girişinin hangi tabana uygulandığı başlıklardan tek bakışta ayrılmıyor. Sırayla işlem, önceki ara toplam ve artış tutarını eşleştir. | [F12](#f12),[F16](#f16) |
| C060 · `TerfiKapisi` · L808 | İyileştir | Önceki/son dönem ve tüm koşullar birlikte. Kaldı sonucunda hangi koşulun eksik olduğunu ilk sonuçta adlandır; uzun rubrik açılınca ayrıntı ver. | [F04](#f04),[F23](#f23) |
| C061 · `KademeAdimlari` · L898 | İyileştir | Bekleme süresi ile toplam kıdem farklı. Girişin hangi geçişi etkilediğini satır başlığında göster; GS sıfırlaması kapsamı açık olsun. | [F11](#f11),[F14](#f14) |
| C062 · `PerformansKarnesi` · L948 | İyileştir | Ağırlık, ham puan ve kapı etkisi ayrı kavramlar. Sonuçta ham skor → kapı → geçerli skor zinciriyle yüksek skor/prim yok durumunu açıkla. | [F16](#f16),[F23](#f23) |
| C063 · `SprintSkoru` · L1002 | İyileştir | Taahhüt/kabul/hata/SP yan yana çok yoğun. SP inceleme uyarısını ödeme skoru alanından görsel olarak ayır; oranların paydasını yakın tut. | [F12](#f12),[F16](#f16) |
| C064 · `Egri` · L1076 | İyileştir | Skor ekseni ve hedef prim yüzdesi farklı ölçüler. Geçerli skor/ödeme çiftini grafiğin yanında ver; sadece çizgi ve renk okutma. | [F21](#f21) |
| C065 · `PrimEgrisiApplet` · L1117 | İyileştir | Eşik/hedef/tavan ile taban/hedef prim karışabilir. Üç eşik aynı kolon yapısında, parasal sonuç ayrı; yüzdelerin tabanı açık. | [F12](#f12),[F16](#f16) |
| C066 · `PrimHavuzu` · L1173 | İyileştir | Şirket/takım/birey çarpanı ve bütçe ölçeklemesi ayrı basamaklar. Havuz öncesi ve sonrası ödemeyi aynı kişinin kaydında göster. | [F16](#f16),[F24](#f24) |
| C067 · `KarPaylasimi` · L1241 | İyileştir | Uygun/kıdem yetmiyor/tavanda durumlarını sayısal paydan ayır; kalan havuzun yeniden dağıtımı sonucu görünür olmalı. | [F16](#f16),[F23](#f23) |
| C068 · `YapiDenetimi` · L1298 | Düzelt | Global aralık ifadesi şirket politikasını evrensel standarda dönüştürebilir. Kontrolde kaynaklı eşik / örnek politika / sonuç etiketlerini ayrı tut. | [F18](#f18) |
| C069 · `ToplamOdul` · L1335 | İyileştir | Değişken pay toplam nakdin yüzdesi, diğer primler tabanın yüzdesi. Aynı yüzde biçimi aynı payda sanılmamalı; yıllıklaştırma ve yan hak ayrımını koru. | [F16](#f16) |
| C070 · `Gezgin` · L1411 | İyileştir | 17 öğe motorlara ayrılmış; iyi. Grup başlığı ile madde adı farklı ağırlıkta kalsın, seçili öğe konumu uzun listede izlenebilsin. | [F19](#f19) |
| C071 · `Secici` · L1440 | İyileştir | Mobil Select ve Önceki/Sonraki var. Seçilen tam applet adı, bölüm konumu ve geri dönülen yer kaybolmasın. | [F19](#f19),[F24](#f24) |
| C072 · `Sira` · L1463 | Koru | Önceki/sonraki hedef adı yazılıyor. Üstteki kısa oklara tutarlı hedef ve sınır davranışı sağla. | [F19](#f19) |
| C073 · `AppletHata` · L1492 | Düzelt | Her render hatasını kayıtlı değer bozulması diye açıklamak yanlış teşhis riski. Gerçek hata türüne göre kurtarma; kapsamı bilinmeyen toplu sıfırlama önermeme. | [F14](#f14),[F23](#f23) |
| C074 · `AppletAraclari` · L1519 | İyileştir | Kayıt durumu ve bütün örneklere dönüş tek araç satırında. Hangi appletlerin sıfırlanacağını açıkça söyle; görünür alanla sınırlı sanılmasın. | [F14](#f14),[F18](#f18) |
| C075 · `AppletIcerik` · L1537 | İyileştir | Tek applet görünmesi uygulanmış. Genel Tasarım ilkesi her geçişte ana işi geriye itmemeli; kalıcı kısa özet + ayrıntı kullan. | [F05](#f05),[F24](#f24) |
| C076 · `AppletPage` · L1620 | Görsel yüzey yok | AppFrame sarmalayıcısı; ayrı kart/yerleşim kusuru yok. İçerik ve kabuk kabulünü miras alır. | [F20](#f20) |

<a id="dosya-12"></a>

### src/views/BcgPage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C077 · `BcgMatrix` · L37 | İyileştir | Yüksek pay solda; alışılmış artan eksenden farklı. Yön açıklamasını gözün eksene gittiği yerde tut, yalnız uzun üst nota yükleme. | [F21](#f21) |
| C078 · `CashCycle` · L79 | İyileştir | Ok ve kutular nakit yönünü anlatıyor. Dar ekranda kaynak → hedef → neden sırasını koru; rozetleri tıklanır sanılacak biçimde sunma. | [F03](#f03),[F21](#f21) |
| C079 · `BcgContent` · L100 | İyileştir | Öğretici belge çok sayıda benzer başlık taşıyor. Öğrenme sırası, örneğe atlama ve çözüme dönüş bağlantıları kur; cevabı sorudan ayrı aç. | [F24](#f24) |
| C080 · `BcgPage` · L278 | Görsel yüzey yok | Sarmalayıcı; BcgContent ve AppFrame sözleşmesi yeterli. Bu eğitim sayfasını şirketin gerçek finansal teşhisi gibi sunma. | [F18](#f18) |

<a id="dosya-13"></a>

### src/views/CashflowPage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C081 · `Anahtar` · L22 | İyileştir | Ayrıntı anahtarı ortak anahtarlarla aynı durum ve etiket sözleşmesini paylaşmalı; farklı geometrik yorum üretme. | [F03](#f03) |
| C082 · `Icerik` · L58 | Düzelt | Mobil karşılaştırmada tanısal özet uygulanmış; koru. — burada sıfır diye açıklanırken diğer sayfalarda başka anlamlar taşıyor; sayısal sıfırı 0 ₺ göster. | [F07](#f07),[F17](#f17) |
| C083 · `CashflowPage` · L251 | Görsel yüzey yok | Sarmalayıcı; kaynak yüklenmesi ve gerçek hesap doğruluğu görsel auditin dışında. İçerik kabulünü miras alır. | [F20](#f20) |

<a id="dosya-14"></a>

### src/views/EmailPage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C084 · `CopyButton` · L87 | Koru ve örnek al | İki durum etiketi yer tuttuğu için genişlik sabitleniyor. Senaryo kopyalama eylemine bu davranış sözleşmesini taşı; erişilebilir ad yalnız etkin etiketi içersin. | [F15](#f15) |
| C085 · `Status` · L117 | Koru | Hata görünür kalıyor, başarı status ile bildiriliyor. Hata mesajını düğme içine uzatma; çözüm önerisini yanında tut. | [F15](#f15),[F23](#f23) |
| C086 · `EmailContent` · L127 | İyileştir | Konu/ileti iki adımı açık. Uzun klavye kısayolu ve font notunu yöntem ayrıntısına al; temel kopyala → yapıştır akışı önce gelsin. | [F04](#f04),[F24](#f24) |
| C087 · `EmailPage` · L205 | Görsel yüzey yok | Sarmalayıcı; mail gönderme veya alıcıdaki gerçek render doğrulandı sayılmaz. Önizleme ve kopya çıktısı ayrı test edilir. | [F20](#f20) |

<a id="dosya-15"></a>

### src/views/HomePage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C088 · `OrgChart` · L20 | Koru ve açıklaştır | Kimin kime bağlı olduğu ana görev; kutular bağlantı. Ağaç kelimesi yerine gerçek bölüm adlarıyla açıklama ve ilişki sürekliliği sağla. | [F19](#f19) |
| C089 · `HomePage` · L38 | Görsel yüzey yok | Sarmalayıcı; OrgChart ve AppFrame kabulünü miras alır. | [F20](#f20) |

<a id="dosya-16"></a>

### src/views/NotesPage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C090 · `ConfirmButton` · L42 | Düzelt | Silinsin mi? dört saniyede kayboluyor; inceleme ritmi bozuluyor. Parametreler'deki süresiz onay modelini kapsam belirterek ortaklaştır. | [F14](#f14) |
| C091 · `NoteRow` · L67 | İyileştir | Uzun not tek satırlık TextInput ile düzenleniyor; metni takip zor. Uygun çok satırlı editör; sil düğmesinin erişilebilir adında hedef notun kısa tanımı. | [F12](#f12),[F14](#f14) |
| C092 · `NotesContent` · L152 | İyileştir | Liste sayacı, açık/tamamlanan ve yeni liste farklı görevler. Not ekleme birincil olsun; varsayılanlara dönüş kalıcı kayıt bilgisiyle ayrı konumlansın. | [F04](#f04),[F18](#f18) |
| C093 · `NotesPage` · L274 | Görsel yüzey yok | Sarmalayıcı; not verisini başka tarayıcıyla paylaşılmış gibi göstermeme sözleşmesi içerikten gelir. | [F18](#f18) |

<a id="dosya-17"></a>

### src/views/OpexPage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C094 · `Num` · L83 | Koru | Tabular sayı ve değişen-değer işareti yararlı. Geçici vurgu kalıcı seçili durum veya kırmızı zarar anlamına gelmemeli. | [F16](#f16),[F22](#f22) |
| C095 · `Value` · L93 | Koru | Büyük tutarın biçimini Num ile aynı birim/yuvarlama sözlüğünde tut; dekoratif büyük sayı yapma. | [F16](#f16) |
| C096 · `Dot` · L100 | Koru | Dekoratif nokta tek başına bilgi taşımaz. Yanındaki metin olmadan canlı/uyarı sonucu üretme. | [F22](#f22) |
| C097 · `Loader` · L278 | İyileştir | Geçen saniye ve iskelet var. Sürenin hesap ilerleme yüzdesi olmadığı açık kalsın; uzun beklemede kullanıcıya uygulanabilir sonraki adım ver. | [F23](#f23) |
| C098 · `ConnectForm` · L316 | İyileştir | Hatırla onay kutusu uzun teknik uyarıyı etiketin içine yığıyor. Kısa etiket + kalıcı ilişkili açıklama; risk bilgisini gizleme. | [F01](#f01),[F12](#f12) |
| C099 · `LiveStrip` · L402 | İyileştir | Canlı, saat, nokta ve üç ikon üstte yoğun. Yenileme bağlantısı ile finansal verinin güncelliğini ayır; title içindeki ayrıntı dokunmada erişilebilir olsun. | [F18](#f18),[F23](#f23) |
| C100 · `Kurlar` · L438 | İyileştir | USD/TRY ve EUR/TRY başlık araç alanına geliyor. Yedek kaynağı ve para birimini koruyarak kur bilgisini başlık yolundan ayrı grupla. | [F04](#f04),[F18](#f18) |
| C101 · `Toggles` · L457 | İyileştir | OPEX seçimlerinin üçüncü ayrı düğme kalıbı. Choice/Dugmeler ile etiket ve selected/focus sözleşmesini ortaklaştır; görsel özelleştirme marka istisnasına uysun. | [F03](#f03) |
| C102 · `YearTabs` · L472 | Koru ve dengele | Büyük yıl sekmeleri kullanıcı kararı, kaldırma. Eşit dönem değil 2026 kısmi / 2027 tam yıl; toplam karşılaştırmasını alt bağlamda açık tut. | [F16](#f16),[F22](#f22) |
| C103 · `ShareBar` · L515 | İyileştir | Renkli pay çubuğunda yüzde ve paydanın görünür karşılığı kalmalı. Kırpılan oran gerçek değer gibi okunmamalı. | [F21](#f21) |
| C104 · `Overview` · L544 | İyileştir | Toplam/ortalama/gruplar/kategoriler farklı kararlar. Öncelikli sonuç sonrası sıralı ayrıntı ver; her metriği aynı büyük blokla sunma. | [F05](#f05) |
| C105 · `Plan` · L604 | İyileştir | 15 aylık toplam ile yıllık sekme kapsamı farklı. Dönem başlıkta kalıcı olsun; yıl değişiminde üst planın değişmediği anlaşılabilsin. | [F16](#f16),[F24](#f24) |
| C106 · `Anahtar` · L703 | İyileştir | Filtre anahtarı ile diğer anahtarlar aynı on/off dilini paylaşmalı. Başlıktaki teknik title görünür açıklamanın yerini tutmasın. | [F03](#f03),[F12](#f12) |
| C107 · `KolonFiltresi` · L751 | İyileştir | Değer + adet okunabilir ama filtre kapsamı net olmalı. Seçenek adında açıklama paragrafı kullanma; Tümü/Hiçbiri kapsamını sütun adıyla bağla. | [F01](#f01),[F09](#f09) |
| C108 · `SecimKutusu` · L846 | Koru ve tamamla | Hepsi/değer/N seçili özeti kullanıcı kararı, kutuya hap ekleme. N seçili iken hangi seçimin sonucu daralttığı panelde ve filtre özetinde bulunabilsin. | [F09](#f09) |
| C109 · `KalemTablosu` · L915 | Düzelt | Mobil kayıtlar, kalem arama ve süzülmüş/genel toplam ayrımı var. Sıralama ve sütun filtreleri mobilde düzenlenemiyor; ortak erişilebilir araç sağla. | [F09](#f09),[F17](#f17) |
| C110 · `TechVendors` · L1595 | İyileştir | Sağlayıcı adları uzadıkça grafik etiket alanı büyür. Dönem/toplanmış hesap kapsamını koru; yüksek değer sırası ve tam ad veri görünümünde bulunmalı. | [F21](#f21) |
| C111 · `People` · L1612 | İyileştir | Bordro bileşenleri ve maliyet köprüsü aynı tutarı farklı soruyla anlatır. Net/brüt/işveren toplamı hangi grafikte neyi cevaplıyor kısa başlıkla ayrışsın. | [F16](#f16),[F21](#f21) |
| C112 · `Payroll` · L1675 | İyileştir | Kişi seçimi uzun adlara açık. Aylık değer ve dönem toplamını ayrı etiketle; boş kişi durumundaki Bordrolu kişi yok mesajını koru. | [F12](#f12),[F16](#f16) |
| C113 · `Assumptions` · L1745 | Düzelt | Kaynak araması kaynak belgesine eşdeğer değildir. Varsayımın tarih/sürüm/onay statüsünü ayır; 2026 kısmi dönem ve 2027 aylık ortalamayı açık yaz. | [F18](#f18) |
| C114 · `Incentives` · L1810 | İyileştir | Kod, koşul ve tutar ayrı okunmalı. Teknik kodu rozetle büyütmek yerine uygulanma koşulunu önceliklendir; politika doğrulaması bu auditin dışında. | [F04](#f04),[F18](#f18) |
| C115 · `YearPanel` · L1848 | İyileştir | Tek yıl altında çok bölüm var. Seçili yıl ve bölüm konumu uzun kaydırmada kaybolmasın; bölüm başlıklarına kalıcı adres sağla. | [F19](#f19),[F24](#f24) |
| C116 · `Content` · L1878 | İyileştir | Tüm dönem planı → kalemler → seçili yıl iki farklı kapsam içeriyor. Kapsam geçişini sadece yatay ayırıcıya bırakma. | [F16](#f16),[F24](#f24) |
| C117 · `Body` · L1924 | Koru ve tamamla | Yükleniyor/hata/son veri/bağlantı ayarı ayrılmış. Son veri gösterilirken tarih, eksik güncelleme ve yeniden deneme aynı yerde bulunmalı. | [F18](#f18),[F23](#f23) |
| C118 · `OpexPage` · L2011 | Görsel yüzey yok | Sarmalayıcı. Roboto/15 px istisnası bilinçli; diğer sayfalara zorla taşınmamalı. Canlı servis doğrulaması ayrıca gerekir. | [F20](#f20) |

<a id="dosya-18"></a>

### src/views/OtherPages.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C119 · `HiringContent` · L40 | İyileştir | Timeline, takvim ve katkı tablosu aynı kişileri farklı amaçla tekrarlar. Sıra/tarih/gelir etkisi başlıklarını ayır, takvimde renk dışında olay adı tut. | [F05](#f05),[F11](#f11) |
| C120 · `GoalsContent` · L179 | İyileştir | 90 gün, aylık ve kümülatif değerler peş peşe. Her sonucun zaman tabanı görünür; açığı kapatan alternatifler birlikte uygulanacak görevler sanılmasın. | [F16](#f16),[F24](#f24) |
| C121 · `PlanContent` · L309 | İyileştir | Gantt ve eylem tablosu aynı kayıtlar. Mobilde iki tam listeyi üst üste okutmak yerine ilişkilendirilmiş tek görev görünümü seç. | [F05](#f05),[F11](#f11) |
| C122 · `AuthorityContent` · L366 | İyileştir | Karar hiyerarşisi ile kontrol tarihleri ayrı ilişkiler. Hazırlayan/karar veren/sorumlu aynı ad kalıbında tek role indirgenmesin. | [F19](#f19),[F24](#f24) |
| C123 · `PendingContent` · L422 | İyileştir | Bekleyen karar, kesinleşen karar, ücret ve CRM ayrı okuma işleri. Bekleyenlerin karar/son tarih/sonraki adımını ilk katmanda tut. | [F04](#f04),[F24](#f24) |
| C124 · `GrowthContent` · L599 | İyileştir | Piramit kişi sayısı, huni dönüşüm, hedef tablosu dönem anlatıyor. Aynı renk/numarayla eşdeğer kademe izlenimi vermesin. | [F16](#f16),[F21](#f21) |
| C125 · `ArchivePage` · L662 | Koru ve tamamla | Tahta → karar → sayfa izi var. Güncellenen kararda eski notu silmeden sürüm ve geçerlilik tarihi ekle; güncel plan gibi okunmasın. | [F18](#f18),[F20](#f20) |
| C126 · `NotFoundPage` · L680 | Koru | Başlık + ana sayfaya dönüş açık. Hedef linki gerçek sayfa adıyla koru; dekoratif hata kodunu ana mesaj yapma. | [F23](#f23) |
| C127 · `HiringPage` · L693 | Görsel yüzey yok | AppFrame + HiringContent sarmalayıcısı; bu ikisinin kabul ölçütlerini miras alır. | [F20](#f20) |
| C128 · `GoalsPage` · L701 | Görsel yüzey yok | AppFrame + GoalsContent sarmalayıcısı; ayrı görsel varyant oluşturmamalı. | [F20](#f20) |
| C129 · `PlanPage` · L709 | Görsel yüzey yok | AppFrame + PlanContent sarmalayıcısı; tarih/rol bağlamı ortak veriden gelmeli. | [F20](#f20) |
| C130 · `AuthorityPage` · L717 | Görsel yüzey yok | AppFrame + AuthorityContent sarmalayıcısı; ayrı durum standardı gerektirmez. | [F20](#f20) |
| C131 · `PendingPage` · L725 | Görsel yüzey yok | AppFrame + PendingContent sarmalayıcısı; karar statüsü içerik düzeyinde korunur. | [F20](#f20) |
| C132 · `GrowthPage` · L733 | Görsel yüzey yok | AppFrame + GrowthContent sarmalayıcısı; ortak ölçüt sözlüğünü miras alır. | [F20](#f20) |

<a id="dosya-19"></a>

### src/views/ParamsPage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C133 · `Field` · L37 | Koru ve tamamla | Türe göre alan seçimi ortak. Etiket, birim, açıklama ve hata sırası bütün türlerde aynı; zorunlu bağlam placeholder'a bırakılmamalı. | [F12](#f12) |
| C134 · `SayiAlani` · L75 | İyileştir | Geçersiz taslak artık modele gitmiyor; iyi. Odak çıkışında sınıra çekme görünür gerekçe gerektirir; otomatik değişim sessiz kalmasın. | [F13](#f13) |
| C135 · `Sifirla` · L110 | Koru ve açıklaştır | Süresiz onay, kapsam ve geri al uygulanmış. Emin misiniz? yerine X alanı varsayılana döndür gibi açık fiil; diğer modüller bu davranışa yaklaşmalı. | [F14](#f14) |
| C136 · `SaveStatus` · L161 | Koru | Gerçek kayıt sonrası nereye/ne zaman bilgisi veriliyor. Depolama hatası başarıyla aynı tonda gösterilmemeli; teknik yerel depolama ayrıntısı ikincil. | [F18](#f18),[F23](#f23) |
| C137 · `Degisiklikler` · L181 | Koru | Alan/grup/eski → yeni/Alana git/Bu alanı geri al güçlü iz. Uzun adlarda eylemleri başlığa sıkıştırma; eski/yeni birimini eşleştir. | [F12](#f12),[F16](#f16) |
| C138 · `Derived` · L214 | İyileştir | Hesaplanan değerler düzenlenebilir girişlerden farklı görünmeli. Hangi parametrelerden türediğine bağlantı ver; sonuç alanı input gibi sunulmasın. | [F03](#f03),[F24](#f24) |
| C139 · `Gruplar` · L250 | Koru ve tamamla | Arama, alan/değişiklik sayısı ve accordion uygulanmış. Sonuçsuz arama ve uzun grup adlarında sayaç ikincil kalsın; grup adına sayaç gömme. | [F01](#f01),[F12](#f12) |
| C140 · `ParamsContent` · L326 | Koru ve sadeleştir | Kayıt kapsamı, değişiklik özeti ve görev grupları iyi sıralanmış. Amaç/kayıt/yayın/durum satırlarının aynı bilgiyi tekrarını azalt. | [F05](#f05),[F18](#f18) |
| C141 · `ParamsPage` · L388 | Görsel yüzey yok | Sarmalayıcı; kayıt başarısı testini içerik/durum katmanından miras alır. | [F20](#f20) |

<a id="dosya-20"></a>

### src/views/PartnershipPage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C142 · `Maddeler` · L72 | İyileştir | Liste maddeleri tek tek eylem veya iddia olmalı. Çoklu koşulu uzun noktalı virgül dizisinde saklama; kritik eşiği ayrı satıra çıkar. | [F12](#f12),[F24](#f24) |
| C143 · `Kartlar` · L82 | İyileştir | Başlık + açıklama kartları her içeriği eşit ağırlıkta yapabilir. Yalnız gerçek karşılaştırma kümelerini kartlaştır; diğerlerini düz belge akışında bırak. | [F04](#f04) |
| C144 · `PuanKarti` · L96 | İyileştir | Puan eşiği ve puandan bağımsız ret beraber görünmeli. Yüksek toplamın ret koşulunu örtemeyeceği görsel olarak açık olsun. | [F16](#f16),[F23](#f23) |
| C145 · `Ozet` · L121 | İyileştir | Yönetici özeti içinde birçok alt tablo tekrar detay yaratıyor. Önce karar/90 gün ölçütü, sonra gerekçe; özeti küçük rapora dönüştürme. | [F05](#f05),[F24](#f24) |
| C146 · `Teshis` · L170 | Koru ve tamamla | Dış gözlem/iç veri/hipotez ayrımı doğru. Kaynak tarihi ve doğrulama statüsü sabit biçimde görünmeli; boş veri sıfır olmamalı. | [F17](#f17),[F18](#f18) |
| C147 · `Kime` · L212 | İyileştir | Segment/ortak tipi/ilk dalga/eleme dört sınıflama. Ortak adayının bunlar arasında nasıl ilerlediğini göster; eşdeğer olmayan listeleri aynı sıra numarasıyla birleştirme. | [F19](#f19),[F24](#f24) |
| C148 · `ProgramTasarimi` · L271 | İyileştir | Katman/yolculuk/iş akışı/ekonomi uzun zincir. Aynı ortağın koşul → görev → karşılık ilişkisini koru; model örneğini gerçek tarife gibi sunma. | [F18](#f18),[F24](#f24) |
| C149 · `Kanal` · L348 | İyileştir | Halka, kanal ve giriş noktası farklı kavramlar. Kullanıcı önce hangi kanalı ne zaman deneyeceğini görsün; yöntem terimleri açıklamada kalsın. | [F04](#f04),[F24](#f24) |
| C150 · `Olcum` · L383 | İyileştir | Altı sütunlu gösterge tanımı mobilde ayrılıyor. Gösterge + hedef/dönem kapalı kayıtta, kaynak/tanım/karar panelde; birbirine bağlı sayıların komşuluğu korunsun. | [F07](#f07),[F16](#f16) |
| C151 · `Takvim` · L432 | İyileştir | Timeline/Gantt/geçit/ritim dört zaman görünümü. Aynı işin dört tekrarı yerine aşama → teslim → karar akışı kur; geçit eşiği tarihi gölgelememeli. | [F05](#f05),[F11](#f11) |
| C152 · `RiskBolumu` · L515 | İyileştir | Risk, pivot ve durdurma farklı ciddiyet taşır. Renkten bağımsız açık sonuç/eylem etiketi; kapasite saatleri ayrı kanıt bloğu. | [F16](#f16),[F22](#f22) |
| C153 · `ProgramSekmeleri` · L565 | Koru | Gerçek program sekmeleri, APG rol/ok davranışı var. Büyük iki seçenek mevcut karar; alt başlık uzunluğu eşdeğer olmalı, sayı filtrelerine bu kart görünümünü taşıma. | [F03](#f03) |
| C154 · `BolumSekmeleri` · L605 | Düzelt | 320 px'te sekiz bölüm yatay şeritte gizleniyor. Seçili bölüm + konum + tüm bölümlere erişim sunan dar ekran gezgini planla; geçmiş kararı belgeleyerek güncelle. | [F10](#f10),[F19](#f19) |
| C155 · `Sira` · L652 | İyileştir | Program sonunda diğer programa geçiyor. Sonraki hedefte marka adı da görünmeli; aynı programın devamı sanılmamalı. | [F19](#f19) |
| C156 · `Icerik` · L690 | İyileştir | Program/sekme/bölüm/rozet bağlamı tekrarlanıyor. Bir kalıcı program bağlamı, bir bölüm başlığı; her katmanda tekrar marka etiketi kullanma. | [F05](#f05),[F24](#f24) |
| C157 · `PartnershipPage` · L786 | Görsel yüzey yok | AppFrame sarmalayıcısı; program ve bölüm gezinmesinin durum kabulünü miras alır. | [F20](#f20) |

<a id="dosya-21"></a>

### src/views/RevenuePage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C158 · `HedefKartlari` · L37 | İyileştir | Hedef sayısı, tarih, başlangıçtan/öncekinden süre ve iki gelir değeri aynı kartta. Ana cevap tarih; diğerleri ayrı tanımlı ikincil düzey. | [F04](#f04),[F16](#f16) |
| C159 · `Icerik` · L78 | Düzelt | Uzun bölüm/tablo başlıkları senaryo ve formül bağlamını tekrar ediyor. Karar odaklı bölüm dizini ve tek bağlam satırı; karşılaştırma ölçütleri açık. | [F05](#f05),[F16](#f16),[F24](#f24) |
| C160 · `RevenuePage` · L821 | Görsel yüzey yok | Sarmalayıcı; aynı finansal modelin farklı sayfalarda farklı terimle anlatılmaması içerik sözleşmesi. | [F16](#f16),[F20](#f20) |

<a id="dosya-22"></a>

### src/views/RolePage.tsx

| ID / bileşen | Karar | Gözlem ve somut yönerge | İlgili bulgu |
|---|---|---|---|
| C161 · `RoleHero` · L63 | Koru | Ortak PageHeader kullanılmış. Rol misyonunu ücret/tarih metadata'sıyla aynı cümleye yığma; başlık tam rol adı olsun. | [F04](#f04) |
| C162 · `DaySection` · L81 | İyileştir | İki dönem, günlük saatler, cumartesi ve yasal neden tek açıklamada. Dönemleri tarihli iki blokta; zaman payı grafiği ile günlük programı ilişkilendir. | [F11](#f11),[F12](#f12) |
| C163 · `DigitalSections` · L137 | İyileştir | İş akışı sırası iyi, uzun bölümde araç/kanal/üretim/plan tekrarları var. Her başlıkta çıktı ve sonraki adım belli; jargon yalnız yöntem açıklamasında. | [F04](#f04),[F24](#f24) |
| C164 · `GenericSections` · L334 | İyileştir | Görev/KPI/eylem planı aynı işi tekrar anlatabilir. Ölçüt ile görev kimliğini ilişkilendir; mobilde yeniden aynı uzun açıklamayı gösterme. | [F05](#f05),[F24](#f24) |
| C165 · `RoleContent` · L394 | Görsel yüzey yok | Dijital/generic içerik seçen bileşim; farklı rol şablonlarında başlık ve birim sözlüğü ayrışmamalı. | [F20](#f20) |
| C166 · `RolePage` · L404 | Görsel yüzey yok | AppFrame + rol içeriği sarmalayıcısı; her rolün uzun gerçek metniyle kabul örneği gerekir. | [F20](#f20) |

<a id="bolum-9"></a>

## 9. Grafik türleri: 28 ayrı temsil kontrolü

**Kaynak:** `src/lib/chartSpec.ts`, `src/scripts/charts.ts`, `ui.tsx → Chart/grafikEsdegeri`. Bu tablo grafik motorunun bütün varyantlarına ait **kaynak/temsil değerlendirmesidir**; her tooltip, seri kombinasyonu veya gerçek veriyle ekran testi yapıldı anlamına gelmez. Ortak çözüm F21; matris/karşılaştırmada ayrıca F08, sayı bağlamında F16 uygulanır.

| ID / tür | Okurun cevaplaması gereken soru | Temsil riski ve düzeltme yönergesi |
|---|---|---|
| G01 `org` | Kim kime bağlı, hangi rol açılır? | Mobil hiyerarşide üst/alt ilişki ve rol bağlantısı korunmalı; girinti uzun adı daraltmamalı. |
| G02 `gov` | Hangi kararı kim veriyor? | Organizasyon ağacıyla karar yetkisini aynı şeymiş gibi anlatma; karar adı/sahibi birlikte. |
| G03 `gantt` | İş ne zaman başlıyor/bitiyor, hangi işle örtüşüyor? | Ajanda başlangıç/bitişi korur ama örtüşmeyi gizleyebilir; kritik çakışmalar ayrıca görünür olsun. |
| G04 `ramp` | Hangi ölçüt aylar içinde ne kadar artıyor? | Birimi farklı seriler ortak büyüklük sanılmasın; mobilde ay ve seri kimliği tekrarlanmalı. |
| G05 `pay` | Günlük zaman hangi işe ayrılıyor? | Saat ile pay yüzdesini karıştırma; toplam çalışma süresi ve en büyük payın görevi görünür. |
| G06 `kopru` | İlk ödeme ve yenileme hedefi nasıl tamamlıyor? | Toplamın parçaları ile hedef çizgisi ayrışsın; senaryo adı yalnız renk olmamalı. |
| G07 `gelir-ay` | Aylık gelir ve biriken gelir nasıl değişiyor? | Aylık çubuk ile kümülatif çizgi aynı kavram değil; seri adında ve veri karşılığında açık. |
| G08 `kaynak-ay` | Hangi kaynak hangi ay kaç sonuç üretiyor? | Çok seri/ay etiketi yoğunluğu; seçilen kaynak ve toplam korunarak odaklı kıyas. |
| G09 `checkpoint` | Kontrol gününde aktif satıcı ve ciro hangi seviyede? | Çift ölçü/eksen nedeniyle birinin artışı diğerinin ölçeğiyle okunmamalı; iki birim açık. |
| G10 `deadlines` | Hangi karar ne zaman verilmek zorunda? | Ajandada karar veren, son tarih ve hazırlayan ayrımı kaybolmamalı; sırf tarihe indirgeme. |
| G11 `piramit` | Her kademede kaç kişi hedefleniyor? | Şekil alanını kişi sayısıyla matematiksel orantı varmış gibi okutmama; adetler görünür. |
| G12 `huni` | Hangi aşamada kaç kişi kalıyor? | Kümülatif adet/dönüşüm oranı ayrımı; farklı örneklem ve dönemleri tek huniye yığmama. |
| G13 `chain` | Hangi adımın ardından hangi adım geliyor? | Sıra ile bağımlılık ayrımı; otomatik atlanabilen adımları zorunlu sanılacak oklarla anlatmama. |
| G14 `mix` | Toplam üretim/iş hangi parçalardan oluşuyor? | Halka dilimi renginin yanında ad, adet, birim; küçük dilimin tek erişimi hover olmamalı. |
| G15 `bcg-num` | Ürün hangi kutuda, pay/büyüme/ciro ne? | Log ekseni ve yüksek payın yönü açık; balon büyüklüğü ciro, konumu başka iki ölçü. Mobil değer kaydı bunu korumalı. |
| G16 `cumulative` | Birikim hangi tarihte tavana yaklaşıyor/aşıyor? | Hedef/tavan/fiili veya varsayımsal çizgi ayrı isim ve desen; tavan aşımını gizleyen eksen kırpması olmamalı. |
| G17 `hedef-adim` | 30/60/90 gün hedefleri nasıl ilerliyor? | Geçit günleri ile seri adları karışmamalı; hedef değerleri gerçekleşmiş sonuç gibi sunmama. |
| G18 `kumulatif-tl` | Senaryoların birikmiş tutarları nasıl ayrılıyor? | Çizgi kesişimi ve negatif alan önemli; ana özet yalnız son toplam değil, gerekiyorsa en düşük nokta. |
| G19 `seri-cizgi` | Adet serileri hangi ayda ayrışıyor? | Ortak ay ve tam sayı birimi; kayıtta seriler birbirinden çok uzağa düşmemeli. |
| G20 `grup-ay` | Aynı ayın alternatifleri ne kadar farklı? | Dar ekranda yön değişse de ay içi seri sırası ve birim sabit; aylık kıyas korunmalı. |
| G21 `basabas` | Gelir gideri ilk ne zaman geçiyor? | Aylık kesişim ile kümülatif geri ödeme aynı başlık olamaz; nokta yoksa sahte tarih üretme. |
| G22 `basabas-adet` | Kaç ödeyen satıcı gideri karşılıyor? | Kararlı dönem varsayımı ve satıcı başı gelir ayrı; bu sonuç takvim tarihi gibi gösterilmemeli. |
| G23 `nakit-ay` | Giriş/çıkış ile dönem sonu nakit nasıl ilişkili? | Akışlar toplanır, bakiye toplanmaz. Mobil işaretin dönem sonu bakiye olduğu görünür. |
| G24 `opex-bar` | Hangi kalem/grup en büyük gider? | Uzun ad etiketini kesmeme; tutar ve payın dönemi açık. Sıralama değişince kimlik/renk sabit. |
| G25 `opex-stack` | Ay toplamını hangi gruplar oluşturuyor? | Dar ekranda yataya dönüşte ay sırası korunmalı; yığın segmenti ile toplam çizgi ayrı okunmalı. |
| G26 `opex-stack-h` | Her kategori/kişide bileşenler nasıl dağılıyor? | Sabit yatay sunum uzun adı rahatlatır; küçük bileşenlerin verisi açıklama/listede erişilebilir kalmalı. |
| G27 `opex-group` | Aynı kişi/grubun iki dönemi nasıl farklı? | Kısmi yıl/tam yıl veya aylık ortalama/yıllık toplam kıyası açık; aynı renk aynı dönemi anlatsın. |
| G28 `opex-bilesim` | Bir toplamın parçaları neler? | Tek çubukta küçük paylar okunmayabilir; parça adı+tutar+pay açık listede. Toplam ile parçalar aynı dönem. |

Ortak `Chart` için minimum kontrast, eksen metni, tooltip sınırı, klavye karşılığı, reduced-motion ve yüklenmeyen grafik fallback'i ayrı kabul kayıtları olmalıdır. SVG etiketlerini yalnız DOM gövde font testinden geçmiş sayma. `hideOverlap` bir etiketi kaldırabilir; önemli ölçütün görünür alternatifini kontrol et. Ölçek/hikâye doğruluğu ekran görüntüsünden tek başına anlaşılmaz.

<a id="bolum-10"></a>

## 10. Kabuk, Mantine parçaları ve bileşen dışında kalan sunum

| Yüzey/parça | Değerlendirme ve yönerge |
|---|---|
| `src/layouts/BaseLayout.astro` | Dil, başlangıç tema/giriş ve merkezi klavye modu mevcut. Hydration öncesi/sonrası içerik atlaması, font fallback'i ve JS kapalı mesajı ayrıca kontrol edilir. Bu rapor giriş güvenliği denetimi değildir. |
| `tokens.css`, `global.css`, Mantine tema ayarı | Boyut/satır aralığı/boşluk/durum tokenları ortak. Aynı CSS sınıfına farklı anlamlar eklemek yerine semantik sözleşmeyi düzelt. 14 px altına inmeme, tek başına iyi hiyerarşi değildir. |
| `MantineProvider`, `DatesProvider` | Görsel yüzeyi olmayan ortak yapılandırma. Yerel varyantların kök tipografi/yerel tarih tercihlerini sessizce ezmemesi gerekir. |
| `TextInput` | Notlar, giriş ve arama farklı içerik uzunluğuna sahip. Label/description/error sözleşmesi ortak; uzun not için doğru alan türü seçilmeli. |
| `NumberInput` | Taslak/geçerli değer/birim/sınır ayrımı; F13. Formatlama sayının anlamını veya caret konumunu bozmamalı. |
| `Select` | Kapalı alan ve portal panel aynı markalı sözleşmede. Uzun seçili ad, grup başlığı, arama/boş sonuç ve klavye davranışı birlikte incelenmeli. |
| `Checkbox` | Kısa etiket + gerekli açıklama; uzun risk cümlesini tek tıklama etiketi içine yığmama. Etiket alanı ve gerçek hedef boyutu korunmalı. |
| `Accordion` | Başlık salt okunur özet; iç panelde alanlar/eylemler. Düzenleyici düğme torunu olmamalı. Matris kıyasının yerine tek başına geçmez. |
| `Table` | Masaüstünde okunur sütun minimumları, doğal sözcük sarması; dar ekran eşdeğeri görev bazlı. `—` ve toplam satırı sözlüğü tutarlı olmalı. |
| `Menu` | Menü öğesi hedef adı, seçili sayfa, grup ayrımı; odağın görünen yeri ve kapanınca dönüşü korunmalı. |
| `Drawer` | Menü içi uzun adlar ve alt gruplar; kapatma/geri odak, kısa yükseklik ve sanal klavye ayrı doğrulanır. |
| `Popover` | Sütun filtrelerinde panelin kime ait olduğu başlıkta; boş seçimin anlamı açık. Panel ekran dışında veya erişilemeyen alan altında kalmamalı. |
| `Timeline` | Numara, tarih, sorumlu, çıktı rolleri ayrılmalı; dekoratif işaretle metin bilgisi yarışmamalı. |
| `Month` | Renkli tarihin olayı metinsel listede de var. Ay/yıl, seçilen gün ve olay adı tutarlı; renk tek işaret değil. |
| `DateInput` | Yerel tarih biçimi, açık ay/yıl ve geçersiz tarih geri bildirimi. Tarayıcıya göre belirsiz 03/04 biçimi oluşturma. |
| `Anchor` | Hedefi anlatan ad, metinsel bağlantı görünümü; tüm bağlantıları ikonlaştırma. |
| `Badge` | Kimlik/durum anlamı ayrık; metin gerekli. Sayısal değeri sırf dekor için badge içine alma. |
| `Text`, `Title` | Görsel büyüklük ile HTML başlık düzeyi ayrı değerlendirilir; uzun başlık için hiyerarşiyi bozup font küçültme. |
| Tabler ikonları | Paket içindeki her ikon ayrı proje bileşeni sayılmadı; kullanıldığı kontrolde dekoratif/anlamlı oluşu incelenir. İkon-only tema anahtarı mevcut kullanıcı istisnasıdır. |
| JSX render callback'leri ve hücre şablonları | 166 sayısı adlandırılmış proje bileşenleridir. Hücre içi şablonlar tablo ve ilgili tüketici satırında ele alındı; `node_modules` içinin her bileşeni tek tek denetlendi iddiası yok. |
| Veri kaynaklarından gelen metinler | `src/data/*` etiket/açıklama/rol adları tüketici bağlamında gözden geçirildi. Her satırın içerik doğruluğu ve tüm kombinasyonları bu görsel audit kapsamında doğrulanmış değildir; anlam denetiminde `ifade.md` kullanılır. |

<a id="bolum-11"></a>

## 11. Raporun üç kontrol geçişi

Bu üç geçiş aynı değerlendirmeyi bağımsız üç kişi yapmış demek değildir; yazarın üç farklı derinlikte öz denetimidir.

| Geçiş | Kontrol sorusu | Bulunan eksik ve rapora etkisi |
|---|---|---|
| 1 — Kapsam ve kaynak | Gerçekten bütün proje bileşenlerine ayrı kayıt var mı, güncel sürüm mü? | AST envanterinde ok işleviyle yazılan `Num` ve `Dot` da dahil edildi; 166 kayıt, 22 dosya. Yeni PageHeader/ResultSummary/Parametreler iyileştirmeleri yapılmamış sayılmadı. |
| 2 — Davranış ve kanıt | Görüntüden çıkan yorum kaynak davranışıyla uyuşuyor mu? | Senaryonun ifadesini silmenin duplicate değer oluşturması, otomatik/sabit farkı, masaüstü kırılmaları ve 4 sn onay saptandı. İlk gizli panel çekimi düzeltilerek açık durum ayrıca kaydedildi. |
| 3 — Yan etki ve devir | Öneri uygulanırsa başka ne bozulabilir? | Kör nowrap, font küçültme, bütün şeyleri tab yapma, parametre modlarını birleştirme, matris karşılaştırmasını gizleme, eski kararları kusur sayma ve raporu implement edilmiş sayma tehlikeleri açık sınırlarla engellendi. |

### Belgeyi kullananın kapatması gereken kayıtlar

- **P1 tamamlandı** demek için yalnız etiketler kısalmış olması yetmez: F02'deki kaynak davranışı, F16/F17'deki anlam ve F07–F10'daki karar görevleri doğrulanmalıdır.
- Her bulgu `uygulandı / ertelendi / bağlam nedeniyle uygulanmadı` olarak kapanır; ertelenenin gerekçesi ve etkilenen görev yazılır. “Genel olarak daha temiz oldu” kapanış kanıtı değildir.
- Kullanıcı araştırması gerektiği belirtilen `H` kayıtları, uygulayıcının beğenisiyle “kanıtlandı” statüsüne geçmez. Testte katılımcıya “daha güzel mi?” kadar “hangi değer seçili, bu sayı neyin yüzdesi, bu işlem neyi değiştirecek?” soruları da yöneltilir.
- Bir uygulama tesliminde en az önce/sonra görseli, etkilenen durumların test sonucu ve açık `not_run` listesi bulunur. Bu raporun mevcut ekran incelemesi, gelecekteki düzeltmenin kabul kanıtı değildir.
