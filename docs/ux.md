# UX yönergeleri: Türksab / iStoc planlama arayüzünün yeniden tasarımı

> Durum: planlama sözleşmesi ve tasarım eleştirisi. Uygulama bu belgenin kabulünden sonra paketler hâlinde başladı
> (uygulama kaydı: `AGENTS.md` → “UX yeniden tasarım sözleşmesi (ux.md)” bölümü).
> Tarih: 27 Ekim 2026. İncelenen main: `8af879d`. Belge bağımsız (Codex) incelemeden geldi; kullanıcı 27 Ekim 2026’da
> “risk almadan, TDD-first, verileri koruyarak uygula” kararı verdi.
> Kapsam: bütün mevcut sayfalar, ortak Mantine bileşenleri, mobil ve masaüstü görev akışları.
> Bu belgenin teslimi: yalnız `ux.md`. Uygulama kodu, tema, testler, veri modeli veya yayın bu çalışma kapsamında değiştirilmez.

## 1. Tasarım kararı ve belgenin kullanım biçimi

Yeni arayüzün karakteri **sakin, köşeli, okunaklı ve karar odaklı bir iş çalışma alanı** olmalıdır. Kullanıcı önce bulunduğu bağlamı, sonra önemli sonucu, sonra yapabileceği eylemi görmelidir. Hesap ayrıntıları ve açıklamalar bu sıranın arkasından gelmelidir.

320 CSS px, küçültülmüş masaüstü değildir. Önce dar alanda görevi tamamlayan bilgi mimarisi tasarlanmalıdır. Geniş alan; daha çok karşılaştırmayı, aynı anda daha çok bağlamı ve daha verimli veri girişini mümkün kılmalıdır. İş kuralı ve veri anlamı iki görünümde aynı kalmalıdır.

### 1.1 Kesin kullanıcı kararları

- Ön yüz Mantine üzerinden planlanacaktır. Mevcut React + Astro yapısı ve hesap motorları korunabilecek temeldir; bu belge framework değişikliği talimatı değildir.
- Bütün okunabilir metinler en az **14 CSS px** olacaktır. Bu alt sınırdır; bütün metinler 14 px'e indirilmeyecektir.
- Pill ve switch bileşenleri dışında arayüz yüzeylerinde radius **0** olacaktır. Diğer istisnalar §6.3'teki kayıt sürecine tabidir.
- Dar ekranın standart kayıt görünümü yatay kaydırılan tablo olmayacaktır. Özetli kayıt listesi + accordion, ay seçimi, görev formu veya karşılaştırma görünümü kullanılacaktır.
- Bilgi saklanarak, tutar kesilerek, yazı küçültülerek veya `overflow: hidden` ile sorun örtülmeyecektir.
- Normal temalarda çevreleyen odak halkası yasaktır. Görünür, çevrelemeyen klavye göstergesi zorunludur.
- WCAG 2.2 A ve AA uygulanabilir başarı ölçütlerinin tamamı hedeflenir. Ürün kuralları WCAG'den daha güçlü olabilir; bunlar ayrı etiketlenir.
- Geliştirmede TDD-first uygulanacaktır. Bu belge testleri **tarif eder**; henüz yazılmış veya çalıştırılmış yeni test anlamına gelmez.

### 1.2 Yönerge düzeyleri

**MUST / Zorunlu:** kullanıcı kararı, uygulanabilir erişilebilirlik ölçütü veya veri doğruluğu sözleşmesi. **SHOULD / Güçlü öneri:** göreve ilişkin kanıtla aksi gerekçelendirilebilir. **MAY / Seçenek:** ancak kullanıcı yararı gösterilebiliyorsa eklenir.

UX ilkeleri evrensel sayısal yasaklar olarak uygulanmaz. Örneğin Miller yaklaşımından “menü en fazla yedi öğe olmalı” sonucu çıkarılmaz. İlkeler tasarım hipotezi üretir; görev gözlemiyle sınanır. Kullanıcı tercihi, WCAG yükümlülüğü ve tasarım hipotezi aynı şey değildir.

### 1.3 Önceki proje kararlarıyla ilişki

Bu yeni plan, eski “tablolar dar ekranda kendi içinde kayar” ve “yuvarlak karşı köşeler korunur” kabullerinin yerini **gelecekteki UI yenilemesi için** alır. Eski kod veya testler bu belge yazılırken değiştirilmedi. Uygulama başladığında kabul sözleşmeleri gerekçeli olarak yeniden yazılmalıdır; eski testi rastgele silmek veya snapshot güncellemek çözüm değildir.

Outfit genel fonttur. Giderler sayfasındaki daha önce açıkça belirlenmiş Roboto / Roboto Condensed ve 15 px alt sınır, ayrı bir değişiklik kararı alınana kadar korunur. Böylece yeni 14 px taban kuralı mevcut daha güçlü sınırı düşürmez.

### 1.4 Okuma haritası

Karar veren kişi önce §3 eleştiriyi, §8 mobil veri dönüşümünü ve §15 kabul ölçütlerini okumalıdır. Tasarımcı §5–9'u; erişilebilirlik sorumlusu §10'u; gelecekte uygulayacak kişi §7, §11 ve §13'ü birlikte kullanmalıdır. İlke, master, sayfa ve test arasında izlenebilirlik kurulmadan görsel örnek tek başına onaylanmış sayılmaz.

## 2. İnceleme sınırı ve kanıt

### 2.1 Ne incelendi?

- GitHub main `git pull --ff-only origin main` ile kontrol edildi; inceleme anında günceldi.
- Kaynaklar: `src/components/AppFrame.tsx`, `ui.tsx`, `Senaryo.tsx`, `SenaryoKurucu.tsx`, `appletKit.tsx`; `src/lib/theme.ts`; `src/styles/tokens.css`, `global.css`; bütün `src/views` aileleri; sayfa ve gezinme verileri; mevcut Playwright kabul örnekleri.
- İzole Chromium **156.0.8078.4**, Türkçe yerel ayar, açık tema, **320×900 ve 1280×900 CSS px**: 25 rota, toplam 50 açılış ve DOM ölçümü. Varsayılan applet ve iş ortaklığı paneli incelendi; bütün alt paneller için tam durum matrisi çalıştırılmadı.
- Ayrıntılı örnekler: Gelir planı, Nakit akışı, Giderler, Applet kataloğu ve İş değerleme, Parametreler, Organizasyon, İş ortaklığı; ilk ekran görüntüleri ve bazı tablo bölgeleri.
- Giderler ve ona bağlı kaynaklar, repodaki **kurgusal OPEX fixture** yanıtıyla incelendi. Gerçek Sheets verisi okunmadı. Görülen tutarlar şirket verisi olarak yorumlanamaz.
- Ana tarama açık tema ve temel açılış durumudur. Gerçek Safari/iOS/Android, ekran okuyucu, kullanıcı testi, kapsamlı kontrast ölçümü ve bütün hata durumları bu incelemede **not_run**.

Bu inceleme geliştirme sunucusu üzerindedir; üretim performansı, güncel canlı yayın veya bütün WCAG ölçütlerine uygunluk kanıtı değildir. Erken alınan grafik ekranında yedek metnin görünmesi tek başına grafik hatası kabul edilmedi; yükleme zamanlaması ayrıca doğrulanmalıdır.

### 2.2 Gözlenen durum

| Kanıt | Gözlem | Tasarım anlamı |
|---|---|---|
| 320 px, 25 rota | Sayfa düzeyinde yatay taşma ölçülmedi | Mevcut kapsayıcı koruması çalışıyor; görev ergonomisini kanıtlamıyor |
| 320 px, `.table-scroll` bölgeleri | 91 bölgenin 91'i kendi içinde yatay taşma üretiyor; bu sayı tablo ve grafik kapsayıcılarını birlikte içerir | İç kaydırmayı başarı sayan kabul, yeni mobil hedefi karşılamıyor |
| Gelir planı, 320 px | İlk ayrıntılı ölçümde 296 px kullanılabilir alanda 1050 px veri bölgesi; yaklaşık 30.300 px sayfa yüksekliği | Çok bölüm ve çok sütun birlikte keşif maliyetini büyütüyor |
| Nakit akışı, 320 px | İlk karşılaştırma bölgesi 296 px alanda 1076 px genişlik istiyor | Aynı senaryonun giriş/çıkış/sonuç değerlerini birlikte okumak zorlaşıyor |
| Applet / iş değerleme, 320 px | İlk tablo bölgesi 296 px alanda 644 px genişlik istiyor | Faktör adları, puanlar ve sonuç farklı yatay konumlara ayrılıyor |
| Parametreler, 320 px | Temel açılışta 61 görünür girdi, yaklaşık 12.900 px belge yüksekliği | Gruplama var; görev bazlı daraltma ve etki görünürlüğü yetersiz kalabilir |
| `theme.ts`, `tokens.css`, `global.css` | Varsayılan radius `md`; 6/12/18 px yüzey tokenları ve çok sayıda tüketici var | Radius yasağı tek tek ekran düzeltmesiyle değil ortak sözleşmeyle uygulanmalı |
| `ui.tsx` / `DataTable` | “Tabloyu yatay kaydırabilirsiniz” metni ve sütun minimumları ortak davranış | Yeni `AdaptiveDataView` bütün tablo ailelerinde ortak çözüm olmalı |
| `tests/ui.spec.ts` | Sayfa taşması ölçülüyor; bazı testler yuvarlak köşenin korunmasını özellikle istiyor | Eski görsel kabulün yeni kullanıcı kararıyla çelişen bölümü açıkça değişmeli |

Ölçümler tek oturum örnekleridir; grafiklerin sonradan yüklenmesi ve açılan paneller belge yüksekliğini değiştirebilir. Yükseklik tek başına kullanılabilirlik hatası değildir. Sorun, bu uzunluk içinde kararın, bağlamın ve ilgili işlemin birbirinden kopmasıdır.

Yerel kanıtlar: `/tmp/19ekim-ux-audit/survey.json`, `details.json` ve ekran görüntüleri. Bu geçici dosyalar kalıcı belge eki veya repoya eklenmiş teslim değildir; yeniden ölçümde aynı senaryo ve fixture kullanılmalıdır.

### 2.3 Sürüm ve branch ayrımı

Plan mevcut main'i esas alır. Önceki görevdeki `feat/applet-istihdam-menu` / `04ad951` değişikliği Applet'i İstihdam menüsüne ekler; inceleme anındaki main'de birleşmiş değildir. Yeni tasarımda bu onaylanmış yön korunmalıdır. Bu belge branch birleştirme veya yayın yetkisi vermez.

## 3. Güncel UI'nin estetik ve kullanılabilirlik eleştirisi

Öncelik tanımı: **P0** görevi durduran veya kritik bilgi/erişilebilirlik kaybı; **P1** sık görevin maliyetini belirgin artıran sorun; **P2** güven, tarama ve tutarlılığı zayıflatan sorun. Aşağıdaki sonuçlar uzman değerlendirmesidir; kullanıcı araştırmasıyla doğrulanmış hata oranları değildir.

| Bulgu | Öncelik / kanıt | UX etkisi | Yönerge |
|---|---|---|---|
| Mobilde aynı veriyi görmek için yatay konum hatırlama gerekiyor | P1; ölçülmüş iç taşma | Satır adı, değer ve karşılaştırma ilişkisi kopuyor; çalışma belleğine gereksiz yük | Kayıt/ay odaklı accordion, sabit kimlik özeti, etiketli değerler; §8 |
| Applet'in ilk işi uzun giriş metni ve açıklama kutusunun altında kalıyor | P1; 320 ekran görüntüsü | Kullanıcı seçim veya hesap yerine önce açıklama okumak zorunda | Sayfa amacı bir cümle; seçici ve ilk yararlı sonuç üst sırada; yöntem isteğe bağlı açılır |
| Gelir planında senaryo kurucu, tekrar eden seçimler, grafik ve tablolar çok uzun bir yüzey oluşturuyor | P1; kaynak + ölçüm | Araştırma ve karar verme akışları birbirine karışıyor | “Sonuç / Varsayımlar / Karşılaştırma / Ayrıntı” görev düzeni; bağlam tek kaynaktan |
| Parametre grupları aynı anda çok fazla düzenleme alanı sunuyor | P1; DOM ölçümü | Yanlış alanı değiştirme ve etkisini görememe riski | Aranabilir görev grupları, değişiklik özeti, etkilenen sayfalar ve görünür kapsam |
| Giderlerde plan, araçlar, filtreler, yıl ve toplamların kapsamı çok katmanlı | P1; kaynak | Toplamın filtreye mi yıla mı bütün plana mı ait olduğu anlaşılmayabilir | Her toplamda dönem + kapsam; genel toplam ile filtreli toplam ayrımı |
| Üst gezinme 320 px'te yatay kaydırılıyor | P1; kaynak + görüntü | Bölümlerin bir kısmı görünmeyebilir; menü keşfi kaydırma bilgisine bağlı | Mantine Drawer içinde tam gezinme; mevcut sayfa ve geri dönüş bağlamı görünür |
| Pill şekli gezinme, seçenek grubu ve eylemlerde fazla yayılıyor | P2; görüntü + kaynak | Durum etiketi ile eylem birbirine benziyor; görsel gramer bulanık | Pill yalnız sınırlı etiket/filtre kullanımında; buton ve segmentler köşeli |
| Radius, çoklu kart ve renkli rol işaretleri birlikte fazla görsel nesne oluşturuyor | P2; kaynak + görüntü | Hiyerarşi yerine eşit önemde kutular algılanıyor | Düz yüzey, hizalama, boşluk ve az sayıda anlamlı vurgu |
| İçerik numarası, kalın bölüm çizgisi, başlık, açıklama ve tablo başlığı üst üste geliyor | P2; görüntü | Asıl bilgiye kadar çok sayıda görsel durak oluşuyor | Bir bölüm için tek ana başlık; numara yalnız sıralama gerçekten anlamlıysa |
| Benzer seçimler `Choice`, yerel `Toggles`, `Anahtar`, sekmeler ve applet yardımcılarında ayrışıyor | P2; kaynak | Aynı anlam farklı görünüm ve klavye beklentisi yaratıyor | Kullanıcı amacına göre ortak seçim bileşeni sözlüğü; §7 |
| Sayfa başlığı bazen hero'da, bazen breadcrumb içinde; canlı durum ve kur bilgisi üst alana ekleniyor | P2; kaynak | “Neredeyim / ne güncel / neye bakıyorum” öğeleri rekabet ediyor | Tek `PageHeader`; breadcrumb yardımcı konum; `SourceStatus` ayrı hiyerarşi |
| Önceki/sonraki sunum sırası ile uygulama gezinmesi aynı alanda | P2; kaynak | Çalışma görevi ile toplantı anlatımı karışabilir | Sunum gezinmesini isteğe bağlı görev olarak ayır; ana gezinme tek |
| İlk grafik yüklenişi, yedek anlatım ve uzun grafik kutusu birlikte görünebiliyor | Araştırılacak; erken görüntü | Yüklenme mi hata mı olduğu belirsizleşebilir | `ChartPanel` durumları açık sözleşmeli; zamanlama sabitlenmeden bug ilan etme |

### 3.1 Korunacak güçlü taraflar

- Marka rengi, tipografi ve merkezi token altyapısı var; yeniden tasarımın hammaddesi hazır.
- Sayfa düzeyinde taşma kontrolü ve 14 px alt sınır düşünülmüş; daha güçlü görev kabulüne genişletilebilir.
- Parametreler, senaryolar ve hesaplar ortak modelden türetiliyor. Görsel yenileme sırasında bu doğruluk omurgası korunmalı.
- Applet ve İş ortaklığı tek aktif panel, URL ve geri/ileri bağlamına sahip; uzun içeriğin görev bazlı bölünmesi için kullanılabilir.
- Klavye odak modu ve simetrik hareket tokenları merkezi; Mantine adaptörleri bunlarla bütünleşebilir.
- Giderlerin kaynak, bağlantı ve güncelleme durumu tanımlı; “sonuç nereden geliyor?” sorusunu cevaplayan bir temel var.

### 3.2 Hedef estetik

“Daha modern” yerine şu sıfatlar sınanmalıdır: **düzenli, güvenilir, açık, ölçülü, hızlı taranabilir**. Köşeli yüzey tek başına bu sonucu üretmez. Çok sayıda köşeli çerçeve de gürültü yaratır. Estetik; doğru bilgi sırası, sayısal hizalama, dengeli boşluk ve durumların anlaşılmasıyla kurulmalıdır.

## 4. Kullanıcı görevleri ve deneyim omurgası

Kullanıcı rolleri aşağıda ürün hipotezidir; araştırmada doğrulanmalıdır. Kişilerin gerçek verileri veya hesapları bu belgeye taşınmaz.

| Görev bağlamı | İlk soru | İlk görünür yanıt | Ayrıntıya geçiş | Tamamlanma işareti |
|---|---|---|---|---|
| Yönetim / yatırım kararı | Hangi senaryo ne kadar finansman istiyor? | Dönem, seçili senaryo, nakit açığı ve hedef sapması | Senaryo karşılaştırma, kaynak ve varsayımlar | Seçim ve gerekçe özeti; paylaşılabilir bağlam |
| Operasyon / rol sorumlusu | Şimdi ne yapmalıyım? | Yakın görev, tarih, sorumlu ve ölçüt | Görev ayrıntısı, bağımlılık, rutin | Sonraki adım ve ilgili sayfaya bağlantı |
| Finans / plan gözden geçirme | Bu tutar hangi dönem ve kalemlerden oluşuyor? | Kapsamlı toplam, kaynak durumu, dönem | Ay veya kalem ayrıntıları | Hesap açıklaması ve dışa aktarma kapsamı |
| İK / model tasarımı | Bu seviyeyi veya faktörü değiştirirsem ne olur? | Seçili meslek/seviye ve sonuç | Faktör formu ve karşılaştırma | Önce/sonra farkı ve kaydın nerede olduğu |
| Toplantı sunumu | Bu kararı kısa biçimde nasıl anlatırım? | Bir cümlelik çıkarım ve kanıt | Gerektiğinde detay | Sonraki karar; aynı görev bağlamı |

Her sayfa için tasarım brifi şu altı alanı içermelidir: kullanıcı amacı, başlangıç bağlamı, kritik veri, ana eylem, yanlış karar riski, tamamlanma durumu. Bunları dolduramayan bölüm doğrudan arayüze eklenmemelidir.

## 5. UX ilkelerini uygulanabilir yönergelere çevirme

Her ilke için zincir: **algısal/bilişsel neden → tasarım davranışı → sınır ve kötü kullanım → doğrulama**. Aşağıdaki sayılar araştırma sonucu değil, bu ürün için başlangıç tasarım hipotezleridir.

### 5.1 Aesthetic–Usability Effect: algılanan kullanılabilirlik

Düzenli bir arayüz ilk güveni artırabilir; aynı etki gerçek hataları gizleyebilir. Temiz ekranı başarılı görevle karıştırmamak gerekir. [Aesthetic–Usability Effect](https://lawsofux.com/aesthetic-usability-effect/)

- **Yönerge:** aynı sınıftaki değerleri hizala, başlık ve eylem sayısını azalt, para birimi/dönemi görünür tut. Dekorasyon yerine okunabilirlik üret.
- **Kaçın:** bütün rakamları büyük göstermek; başarısız veya eksik veriyi güzel KPI ile “tamamlanmış” hissettirmek.
- **Kabul:** kullanıcı hem görsel netliği değerlendirir hem belirli senaryonun finansman ihtiyacını doğru bulur. Beğeni ile görev doğruluğu ayrı ölçülür.

### 5.2 Visceral, behavioral ve reflective design

İlk izlenim, kullanım sırasında kontrol hissi ve kullanım sonrasında güven ayrı katmanlardır. [Don Norman: Emotional Design](https://jnd.org/emotional-design-people-and-things/)

- **Visceral:** köşeli yapı, iyi boşluk, berrak tipografi ve sınırlı vurgu ilk bakışta disiplin ve sakinlik hissettirmeli. Açılışta dev açıklama veya dekoratif animasyon yerine ana bağlam görünmeli.
- **Behavioral:** kontrolün neyi değiştirdiği, sonucun ne zaman güncellendiği ve geri alma yolu anlaşılır olmalı. Hız algısı için veriyi veya ARIA durumunu geciktirme.
- **Reflective:** kullanıcı daha sonra hangi varsayımla karar verdiğini açıklayabilmeli; senaryo, kaynak ve değişiklik kapsamı hatırlanabilir bir özet bırakmalı.
- **Kabul:** ilk bakış görüşmesi, gerçek görev gözlemi ve oturum sonu “neye karar verdiniz, hangi bilgiyle?” sorusu ayrı ele alınır. Bir katmanın başarısı diğerlerini kanıtlamaz.

### 5.3 White Space / Negative Space

Boşluk ilişkiyi tarif eden bir araçtır. Her yerde eşit veya büyük boşluk kullanmak da bilgi bağını koparır.

- **Yönerge:** alan etiketi ile alan arasında küçük; aynı karar grubunda orta; bağımsız karar grupları arasında daha büyük aralık kullan. Başlangıç ritmi §6'da.
- **Yönerge:** 320 px'te sayfa gutter + panel padding + iç panel padding yığılmasını engelle. Bir işi çevreleyen tek ana iç boşluk katmanı olsun.
- **Kaçın:** içerik az diye dev boş grafik kutusu; her değer için ayrı kart; yer kazanmak için başlık–değer bağını yok etmek.
- **Kabul:** renksiz görünümde bile gruplar anlaşılır; uzun açıklama büyüyünce ilişki bozulmaz. Görev için gerekli alanlar aynı bağlamda kalır.

### 5.4 Visual Hierarchy

Bütün öğeler güçlü görünürse hiçbirinin önceliği kalmaz. Hiyerarşi işin önemini aktarmalıdır.

- **Yönerge:** sayfa amacı → bağlam/senaryo → karar sonucu → ilgili eylem → destekleyici veri → yöntem/kaynak sırası.
- **Yönerge:** aynı bölümde tek ana eylem vurgusu. Başlık hiyerarşisi semantik h1/h2/h3 ile görsel sırayı desteklesin.
- **Kaçın:** bölüm numarası, dev sayı, turuncu etiket, dolu buton ve kalın çizginin hepsini aynı anda öne çıkarmak.
- **Kabul:** beş saniyelik algı çalışmasında kullanıcı “neye bakıyorum?” ve “önemli sonuç ne?” sorularına cevap verebilmeli; sonuç araştırmada ölçülür.

### 5.5 Consistency and Standardization

Tutarlılık aynı CSS değil, aynı anlamın aynı etkileşimi üretmesidir. [Nielsen heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)

- **Yönerge:** sekme içerik görünümünü; switch ikili durumu; radio tek seçimi; checkbox çoklu seçimi; buton eylemi; link gezinmeyi temsil eder.
- **Yönerge:** “Uygula”, “Sıfırla”, “Değişiklikleri geri al”, “Bağlantıyı kopyala” her sayfada aynı kapsama sahip olmalı; kapsam değişiyorsa etikette belirtilmeli.
- **Kaçın:** aynı görünümlü pill'in bir yerde etiket, başka yerde ana eylem, başka yerde sekme olması.
- **Kabul:** bir sayfada öğrenilen kontrol ikinci sayfada açıklama gerektirmeden doğru kullanılır. Uygulama registry dışı varyant üretemez.

### 5.6 Law of Proximity

Yakınlık, kullanıcının hangi etiketin hangi veri veya eyleme ait olduğunu çıkarmasını sağlar. [Proximity](https://lawsofux.com/law-of-proximity/)

- Alan etiketi, birimi, yardım ve hata aynı grup içinde kalmalı. Hata başka panelin altına taşınmamalı.
- Filtreler sonuç başlığının yanında veya hemen öncesinde; filtreli toplam sonuçların sonunda/özetinde bulunmalı.
- Aynı bölgedeki “Sıfırla”nın hangi grubu sıfırladığı belli değilse yakınlık yetersizdir.
- **Kabul:** ekran büyütüldüğünde, Türkçe metin uzadığında ve mobilde satırlar sarıldığında etiket–değer ilişkisi korunur.

### 5.7 Law of Similarity

Benzer öğeler aynı sınıf veya davranış olarak algılanır. Bu hem öğrenmeyi hızlandırır hem yanlış benzerlikte hata üretir. [Similarity](https://lawsofux.com/law-of-similarity/)

- Rol rengi ile başarı/uyarı rengi ayrı token aileleri olmalı. Bir kişinin rol rengi hesap sonucunun olumlu olduğu anlamına gelmemeli.
- Tüm negatif tutarlar aynı biçimle, tüm seçili seçenekler aynı durum diliyle gösterilmeli. Renk yanında metin veya şekil bulunmalı.
- **Kabul:** gri tonlama ve renk görme farklılığı simülasyonunda seçim, uyarı ve rol hâlâ ayırt edilebilir.

### 5.8 Law of Continuity

Göz, hizalı ve devamlı dizileri bir akış olarak okur. Yönerge yalnız “çizgi eklemek” değildir.

- Masaüstü tablo değerleri basamak/ondalık hizasıyla; mobil etiket–değer dizisi aynı alan sırasıyla devam etmeli.
- Senaryo değişince sonuç bloğu aynı yerde kalmalı; tekrar çizim odağı ve açılmış kaydı sıfırlamamalı.
- Kırılan çizgi grafik ekseni veya Gantt devamı varsa kapsam açık yazılmalı. Veri olmayan dönem çizgiyle tamamlanmış gibi sunulmamalı.
- **Kabul:** önce/sonra görevinde kullanıcı sonuç konumunu yeniden aramıyor; DOM/odak ve seçili kayıt sürekliliği sınanıyor.

### 5.9 Common Region

Ortak bölge aidiyet kurar; her aidiyet için kenarlık şart değildir. [Common Region](https://lawsofux.com/law-of-common-region/)

- Senaryo girdileri ve o senaryonun kısa özeti tek bölge; açıklama ve kaynak ayrı ikincil bölge olmalı.
- Bölgeyi önce boşluk ve gerekirse tek yüzey tonu kurmalı. Kart içinde kart içinde kart kullanılmamalı.
- Accordion paneli açıldığında başlıkla görsel bağı sürmeli; bağımsız bir modal gibi görünmemeli.
- **Kabul:** bağlam grupları çizgisiz taslakta da anlaşılır. Panelin hangi kayda ait olduğu uzun içerikte kaybolmaz.

### 5.10 Fitts's Law

Hedefin boyutu ve uzaklığı erişim maliyetini etkiler; motor beceri, hata sonucu ve tek elle kullanım ayrıca düşünülmelidir. [Fitts](https://lawsofux.com/fittss-law/)

- Bağımsız etkileşim alanları hassas işaretçide en az 44×44, kaba işaretçi kullanılabiliyorsa 48×48 CSS px olmalı. Görsel ikon küçük kalabilir.
- Accordion başlığının tüm uygun alanı hedef olsun; yalnız ok ikonu tıklanabilir olmasın. Ayrı satır işlemleri bu başlığın içine iç içe buton olarak konmamalı.
- Silme/sıfırlama ana eyleme bitişik sıkıştırılmamalı; yüksek hata maliyeti olan eylemlerde ayrım ve geri dönüş olmalı.
- **Kabul:** hedefler arası çakışma yok; dokunma testi gerçek hit area'yı kapsıyor. WCAG AA'nın 24 px tabanı ürünün 44/48 px kararını düşürmez.

### 5.11 Hick–Hyman ve Choice Overload

Karar süresi yalnız seçenek sayısına değil, seçeneklerin tanıdıklığına, benzerliğine ve görev karmaşıklığına bağlıdır. [Hick](https://lawsofux.com/hicks-law/)

- Hazır senaryolar amaçlarına göre gruplanmalı; seçili senaryonun neyi değiştirdiği görünmeli. Çok seçenek varsa aranabilir Select kullanılmalı.
- Her küçük görünüm için modal açma veya seçenekleri anlamsız alt menülere gömme; ek karar maliyeti de ölçülmeli.
- **Kabul:** kullanıcı uygun seçeneği açıklama okumadan seçebiliyor mu, yanlış başlangıç ne sıklıkta oluyor? “Daha az buton” tek başarı ölçütü değildir.

### 5.12 Miller, chunking ve recognition over recall

Çalışma belleği sınırlıdır; bu durum görünür menüler için sabit yedi sınırı oluşturmaz. [Miller: gereksiz sınırlardan kaçınma](https://lawsofux.com/millers-law/)

- Değerlerin birimi, dönemi, senaryosu ve kayıt kimliği görünür tutulmalı. Kullanıcı önceki ekranın başlığını hatırlamaya zorlanmamalı.
- Faktörleri anlamlı gruplara böl: bilgi, sorumluluk, kapsam; gruplar kullanıcının zihinsel modeliyle doğrulanmalı.
- **Kabul:** accordionlar arasında karşılaştırmada önceki tutarı ezberleme gerekmiyor; çoklu açma veya §8.4 karşılaştırma var.

### 5.13 Peak–End Rule

Yoğun ve son anlar deneyim hatırasını etkileyebilir; kötü bir akışın sonuna kutlama eklemek yeterli değildir. [Peak–End](https://lawsofux.com/peak-end-rule/)

- Kritik sonuçta “Nakit açığı var; hangi ay ve hangi kaynağa göre?” açık olmalı. Görev sonunda “Neler değişti, nerede saklandı, sonraki adım ne?” görülmeli.
- Senaryo değişikliği gerçek dünyada tasarruf sağlamış gibi kutlanmamalı. Tahmin ile gerçekleşen sonuç ayrılmalı.
- **Kabul:** kullanıcı oturum sonunda kararını ve kaydın kapsamını doğru açıklayabiliyor; yapay başarı bildirimi yok.

### 5.14 Jakob's Law ve signifiers / affordances

Tanıdık desenler öğrenme maliyetini azaltır; ürünün amacıyla çelişen taklit fayda sağlamaz.

- Ok işareti genişlemeyi, altı çizili metin gezinmeyi, ayrı buton eylemi anlatmalı. Bütün yüzeyler tıklanabilir gibi görünmemeli.
- Masaüstünde semantik tablo; mobilde başlığı ve açılma işareti belirgin kayıt listesi. Menü ve select aynı görev sanılmamalı.
- **Kabul:** kullanıcı ilk etkileşimde hangi öğenin açılacağını/düzenleneceğini doğru tahmin edebiliyor.

### 5.15 Tesler ve progressive disclosure

Görevin gerçek karmaşıklığı yok edilemez; uygun noktaya taşınabilir.

- Bordro veya puan hesabının ayrıntısı görünür sonucu açıklamak için erişilebilir olmalı. İlk ekranda bütün yöntem açık olmak zorunda değil.
- Kritik istisna, eksik veri veya finansman riski accordion içine saklanmamalı.
- **Kabul:** hem hızlı karar hem ayrıntılı doğrulama yolu mevcut; “tümünü aç” tek keşif yolu değil.

### 5.16 Visibility, feedback ve Gulf of Evaluation

Bir eylemin sistemde neye yol açtığını yorumlamak da iştir. Kullanıcıya aynı anda çok sayıda değişen sayı göstermek sonuç açıklaması değildir.

- Parametre değişince sonuçla birlikte değişim farkını ve kapsamını göster: “Bu senaryoda; bu tarayıcıda”. Polling eski veriyi yeniymiş gibi etiketlememeli.
- “Kaydedildi” yalnız gerçekten yapılan saklamayı adlandırsın. Sunucu kaydı, tarayıcı kaydı ve kopyalanan bağlantı ayrı metinlerdir.
- **Kabul:** ağ kesintisi, depolama hatası ve gecikmiş yanıt durumlarında kullanıcı son güvenilir veriyi ve sonraki adımı ayırt eder.

### 5.17 Error Prevention ve reversible interaction

İyi tasarım yalnız hatayı bildirmez; oluşma ihtimalini ve düzeltme maliyetini azaltır.

- Sayı alanı yazarken ara değerleri kabul etmeli; boş, `0,`, negatif işaret gibi taslaklar otomatik atılmamalı. İş kuralı doğrulaması kullanıcı girdisini yok etmemeli.
- Sıfırlama kapsamını söyle; geri alınabiliyorsa geri alma sun. Finansal/veri etkili taahhütte inceleme ve düzeltme adımı koy.
- **Kabul:** yanlış girişten sonra diğer alanlar korunuyor; kullanıcı hatalı alanı bularak toparlanabiliyor.

### 5.18 Prägnanz, closure ve signal-to-noise

Kullanıcı düzeni tamamlamaya çalışır; eksik bırakılan kritik değerleri zihnen doldurmasına neden olmamak gerekir.

- `0`, “veri yok”, “hesaplanmadı”, “bu kapsamda uygulanmaz” ayrı durumlar olmalı. Sıfır göstererek veri boşluğu örtülmemeli.
- Tüm başlıkları çerçevelemek yerine aynı hizalama ve tipografi grameri kullanılmalı.
- **Kabul:** filtre boşluğu ile gerçek sıfır gider kullanıcı tarafından karıştırılmıyor; ekranın anlamı yalnız dekorasyon kaldırılınca da korunuyor.

### 5.19 Serial Position ve information scent

Listelerin başı/sonu hatırlanabilir; bu durum orta öğeleri saklamaya gerekçe değildir. Kullanıcı, bağlantı adından hedefte ne bulacağını anlayabilmelidir.

- Ana menüde iş sözlüğü kullan: “İstihdam”, “Pazarlama”, “Finans” gibi mevcut adlar görev gözlemiyle sınanmalı. “Araçlar” altında her şeyi toplama.
- Applet'te yalnız sayı veya teknik ID yerine model adı ve amaç birlikte erişilebilir olmalı. Seçilen modelin menü konumu korunmalı.
- **Kabul:** hedef sayfa görevinden bağlantı seçimine ilk tıklama çalışması; yanlış kategoride arama davranışı kaydedilir.

### 5.20 Ekolojik geçerlilik ve etik

İlkeler düşük sadakatli taslak, gerçek içerik ve gerçek görevle sınanmalıdır. Uzman görüşü kullanıcı davranışı yerine geçmez. Yavaş ağ, tek elle kullanım, uzun ad, büyük font, negatif tutar ve eksik veri ideal ekran kadar önemlidir. Varsayılanlar kullanıcıyı gizlice daha pahalı veya iyimser senaryoya yönlendirmemelidir.

## 6. Görsel gramer ve semantik token planı

### 6.1 Renk ve yüzey

- Marka: mevcut Türksab/iStoc kimliği, turuncu vurgu ve mürekkep tonları. Yeni marka veya genel bir admin teması önerilmez.
- İşlevsel tokenlar: `surface.canvas`, `surface.section`, `surface.overlay`, `text.primary`, `text.secondary`, `text.link`, `border.control`, `border.separator`, `action.primary`, `state.selected`, `status.warning/error/success/info`.
- Rol, kategori ve senaryo renkleri `data.*` ailesinde ayrı tutulmalı; aynı yeşil hem “Medyan” hem “başarılı” anlamına gelmemeli.
- Beyaz yazı marka turuncusu üzerinde otomatik kabul edilmez; son token çifti ölçülür. Açık/koyu/hover/selected/invalid/disabled/portal durumları ayrı değerlendirilir.
- İçerik ayrımı önce boşluk ve hizalama, sonra gerekirse yüzey tonu; sınır yalnız form, ayırıcı, veri ilişkisi veya gerçek overlay için.

### 6.2 Tipografi, sayılar ve boşluk

| Token amacı | Başlangıç önerisi | Kabul |
|---|---|---|
| Yardım / metadata / badge | 14 px alt sınır; Giderler'de 15 px | Hesaplanmış değer, SVG ve portal metni dahil |
| Gövde / form | 16 px başlangıç | Kullanıcı font büyütmesi korunur; mobil formda okunurluk |
| Bölüm başlığı | 20–24 px akışkan | 320 px'te doğal satır; sabit yükseklik yok |
| Sayfa başlığı | 24–32 px akışkan | Tek semantik h1; içerik önüne duvar oluşturmaz |
| Sonuç sayısı | Görevdeki önemine göre 24–36 px | Yanında dönem, birim ve karşılaştırma temeli |
| Mikro ilişki | 4–8 px | Etiket–yardım–alan ilişkisi |
| Grup içi ritim | 12–16 px | Birlikte okunan nesneler |
| Bölümler arası ritim | 24–40 px | 320 px'te gereksiz dikey duvar yok |
| 320 px gutter | Mevcut 12 px başlangıç | 296 px içerik alanı tekrar tekrar iç padding ile yenmez |
| Okuma satırı | Açıklamada yaklaşık 45–75 karakter hedefi | Dar ekranda zorunlu minimum satır uzunluğu yok |

Bunlar WCAG sayısal yükümlülükleri değildir; merkezi token için başlangıç tasarım değerleridir. Kök font küçültülmez. Metin için sabit blok yüksekliği kullanılmaz. Tutarlar Türkçe biçimde, aynı hassasiyet ve tabular numerals ile gösterilir; negatif işareti, para birimi ve yüzde kaybolmaz. Kritik miktarlar ellipsis ile kesilmez.

### 6.3 Radius politikası ve istisna kaydı

| Yüzey | Karar |
|---|---|
| Page, section, panel, card, modal, drawer, popover, tooltip | Radius 0 |
| Button, ActionIcon gövdesi, Input, Select, Checkbox kutusu | Radius 0 |
| Accordion item/control/panel, table, row, chart container | Radius 0 |
| Tabs, SegmentedControl rayı ve seçili yüzeyi, navigation item | Radius 0; pill'e dönüştürülerek yasak aşılmaz |
| Pill / durum veya seçili filtre etiketi | İzinli; içeriğin anlamı gerçekten kısa etiket ise |
| Switch rayı ve hareketli thumb | İzinli; ikili durum kontrolü ise |
| Grafik noktası, radyo işaretinin iç şekli, marka SVG geometrisi | Yüzey radius'u değil, semantik çizim geometrisi; dekoratif konteyner istisnası sayılmaz |
| Avatar veya başka yuvarlak dekoratif yüzey | Otomatik izin yok; gerekçeli istisna kaydı gerekir |

Planlanan tokenlar: `radius.surface = 0`, `radius.control = 0`, `radius.overlay = 0`, `radius.pill`, `radius.switch`. Mantine `defaultRadius` ve bileşen default prop/Styles API adaptörleri bu sözleşmeye bağlanmalıdır. `radius="xl"` gibi yerel kaçışlar registry dışı olmamalı. Bu çalışma tokenları değiştirmez.

İstisna şablonu: `ID | component/slot | kullanıcı yararı | neden köşeli biçim yetersiz | izinli durum | erişilebilirlik etkisi | açık onay | doğrulama`. Pill/switch dışındaki bir yüzey için kayıt ve açık onay olmadan radius uygulanmaz. Geçiş sırasında mevcut kodun yuvarlak olması yeni izin oluşturmaz.

### 6.4 Hareket ve odak grameri

- Simetrik `cubic-bezier(.65, 0, .35, 1)`; 120–320 ms mevcut merkezi sözleşme. Yeni belgeli istisna olmadan kütüphane easing'i kullanılmaz.
- Hover giriş/çıkışı, selected/unselected, accordion açılma/kapanma aynı token düzenini kullanır. Hızlı ters tıklamada eski animasyon kuyruğu oynatılmaz.
- `value`, `checked`, `aria-expanded`, hata ve gerçek hesap anında değişir; sunum geçişi bunları geciktirmez.
- Reduced motion'da gereksiz hareket kalkar; işlev korunur. Yükleme için sahte gecikme konmaz.
- Klavye modu yalnız Tab/Shift+Tab ile açılır; pointer/touch görsel modu kapatır. Widget okları modu kendiliğinden açmaz; açıkken APG gezinmesini sürdürür.
- Metin kontrolünde tek alt çizgi veya uygun tek kenar işareti; ikon kontrolünde net düz işaret. Seçili durum odak göstergesi yerine geçmez.
- `forced-colors: active` + klavye modu + `:focus-visible` için mevcut dar `2px solid CanvasText` istisnası korunur.
- Programatik odak, dialog dönüşü ve görünüm değişiminde odak kaybolmamalı; odaklanan öğe görünür olmalı. `blur()` ile odak gizlemek yasaktır.

## 7. Mantine tabanlı master component planı

### 7.1 Master component'in anlamı

Master component yalnız yeniden kullanılan bir JSX parçası değildir. Her biri **amaç + veri sözleşmesi + semantik + durumlar + dar/geniş görünüm + tokenlar + erişilebilirlik + test oracle'ı** sahibi olmalıdır. Sayfa yalnız bu bileşenleri görev sırasına dizer; kendi başına yeni buton, radius, dropdown veya tablo davranışı üretmez.

Katmanlar:

1. **Foundation:** renk, tipografi, spacing, radius, motion, focus, hit area ve responsive tokenlar.
2. **Mantine adaptörleri:** mevcut sürümde doğrulanmış `Button`, `Input`, `Select`, `Accordion`, `Drawer`, `Tabs`, `Menu`, `Switch` vb. Proje kimliği bu katmanda uygulanır.
3. **Görev örüntüleri:** `AdaptiveDataView`, `ScenarioWorkbench`, `FilterWorkbench`, `ResultSummary`, `ChartPanel`.
4. **Sayfa şablonları:** rol, finans, model, karar, bilgi, basit araç.
5. **Domain:** mevcut hesap motorları, senaryo ve parametre deposu; görünüm bunları yeniden hesaplayan ikinci motor oluşturmaz.

Tek React ağacında tek MantineProvider; Astro'nun birbirinden bağımsız adaları arasında React context varmış gibi davranılmaz. Sayfa sınırı değişecekse durum ve provider sözleşmesi önceden kanıtlanır.

### 7.2 Component registry

Adlar öneridir; yeni dosya veya API oluşturulduğu anlamına gelmez. Mantine eşleşmeleri uygulanırken mevcut **9.7.3** kurulu kaynak ve tiplerinden doğrulanmalıdır; çevrimiçi doküman inceleme anında 9.7.4 gösterir.

| ID / Master | Mantine temeli | Sorumluluk | 320 px davranışı / kritik kabul |
|---|---|---|---|
| M01 `WorkspaceShell` | AppShell veya mevcut AppFrame + Box | Marka, gezinme, ana içerik, skip link | Drawer gezinme; tek çalışma yüzeyi; menü yatay kaymaz |
| M02 `WorkspaceNavigation` | NavLink, Menu, Drawer, Breadcrumbs | Gerçek rota ve etkin konum | Tam erişilebilir kategori listesi; aç-kapa ve odak dönüşü |
| M03 `PageHeader` | Title, Text, Group, Stack | Tek h1, amaç, dönem, kaynak ve ana eylem | Kısa bağlam; ana görevi aşağı iten dev giriş yok |
| M04 `TaskSection` | Box, Title, Stack | Başlık, sonuç ve ilişkili araçları grupla | İlişki için boşluk; kart içinde kart yok |
| M05 `ResultSummary` | Text, Stack, SimpleGrid | Değer, birim, dönem, kıyas ve durum | Öncelikli sonuç; ikincil metrikler açılır; kritik risk gizlenmez |
| M06 `ContextBar` | Group, Text, Badge | Seçili senaryo, dönem ve veri kapsamı | Sarılır; kısa yükseklikte sabitlenmez; odak örtmez |
| M07 `ScenarioWorkbench` | Select/Radio.Group, Accordion, NumberInput | Hazır/özel senaryo, fark ve sıfırlama | Önce sonuç + hazır senaryo; ayrıntılı girdi isteğe bağlı |
| M08 `AdaptiveDataView` | Table / Accordion + List + dl | Aynı kayıtları uygun görev görünümüne taşı | Yatay kaydırmasız kayıtlar; filtre/sıra/ID eşdeğerliği |
| M09 `RecordAccordion` | Accordion | Kayıt özeti + etiketli ayrıntı | 48 px başlık alanı, uzun ad, çoklu açık kayıt, odak doğruluğu |
| M10 `PeriodExplorer` | Select, Button, Stack | Ay/dönem seçerek zaman serisi okuma | Bir ayın giriş/çıkış/sonucu birlikte; tüm aylar erişilir |
| M11 `ComparisonWorkspace` | Select, Checkbox, dl / Table | 2–3 seçili kaydı alan alan kıyasla | Kayıtları ayrı panellerde gezdirip ezberletmez; §8.4 |
| M12 `FilterWorkbench` | TextInput, Select, Checkbox, Drawer | Arama, filtre, aktif kapsam, sıfırlama | Tek filtre tetikleyici ve aktif kapsam özeti; uygulama modeli açık |
| M13 `ParameterGroup` | Fieldset, Input.Wrapper, Accordion | İşlevsel girdi grubu ve etki özeti | Tek sütun form; hatalı grup otomatik bulunabilir |
| M14 `Field` | TextInput, NumberInput, Textarea | Etiket, yardım, hata, taslak, birim | Yazım taslağı korunur; 14/15 px; hata ilişkilendirmesi |
| M15 `OptionControl` | Radio.Group, Checkbox.Group, Select, SegmentedControl | Anlama uygun seçim türü | Uzun seçenekler sarılır/aranır; native select kullanılmaz |
| M16 `Action` | Button, ActionIcon, Anchor | Eylem ve gezinme grameri | 44/48 hedef; ikonun erişilebilir adı; tek ana vurgu |
| M17 `StatePill` / `Switch` | Badge/Pill, Switch | Kısa durum ve ikili tercih | Yüzey radius istisnası; §6.3 geometrileri ayrıca ayrılır; metin/durum tutarlı |
| M18 `SourceStatus` | Alert, Text, Status region | Kaynak, son güvenilir veri, eskilik ve hata | Canlı bölge gürültüsüz; eski veri yeni diye gösterilmez |
| M19 `ChartPanel` | Box, Text, Select + ECharts adaptörü | Sonuç, grafik, veri alternatifi, durum | Göreve uygun kısa grafik ve tam değer listesi; hover zorunlu değil |
| M20 `HierarchyExplorer` | Accordion/Tree, Breadcrumbs | Organizasyon ve yetki ilişkileri | Dallanmış dikey liste; rol ayrıntısı; şema olmadan ilişki anlaşılır |
| M21 `TimelineExplorer` | Timeline, Accordion, Select | Tarih, görev, sorumlu ve eşik | Agenda listesi; ay/rol filtresi; geniş Gantt bağımlılığı yok |
| M22 `FeedbackState` | Alert, Skeleton, Loader, Text | Loading/empty/error/stale/offline/partial | Uygun kurtarma eylemi; hata ile boş veri farklı |
| M23 `ReviewAndReset` | Modal/Drawer, Button | Önce/sonra, etki, iptal ve geri alma | Açık kapsam, klavye erişimi, kaynak durumu |
| M24 `ExportShare` | Button, Menu, Alert | Kopyala/CSV/yazdır ve kapsamı | Mobil veri erişiminin yerine geçmez; başarı ve hata gerçek |
| M25 `NotesWorkspace` | Checkbox, List, Textarea, Drawer | Liste, not, tamamlama ve düzenleme | Tam kayıt hedefi; düzenleme formu ve odak dönüşü |
| M26 `LearningPanel` | Accordion, Stepper gerekirse, Text | Yöntem, örnek ve eğitim içeriği | Ana görevin arkasında; açık adımlarla bilgi keşfi |

### 7.3 Her master için zorunlu sözleşme kartı

Her tasarım dosyası şu alanlarla değerlendirilmelidir:

1. Kullanıcı hangi görevi tamamlıyor, component neyi üstlenmiyor?
2. Girdi alanları, kalıcı kayıt ID'si ve görünür kapsam nedir?
3. Varsayılan, hover, focus-visible, selected, checked, disabled, loading, empty, invalid, error, stale, partial durumları hangileri uygulanabilir?
4. Dar ve geniş görünüm aynı görev için hangi alanları ne sırada gösterir?
5. Link/button/heading/table/list/dl semantiği; ARIA yalnız ihtiyaç kadar.
6. Klavye, dokunma ve pointer hit area; açma/kapama sonrası odak.
7. Türkçe sayı, uzun ad, büyük yazı, çoklu para birimi ve eksik değer kuralları.
8. Token, radius istisnası, portal ve hareket adaptörü.
9. Kaybolmaması gereken durum ve biçim değiştirmede odak eşlemesi.
10. Kabul senaryosu, bağımsız oracle ve hangi kanıtla onaylanacağı.

### 7.4 Mantine sürüm ve kaynak sözleşmesi

Manifestte Astro 7.4.0, React 19.3.1, Mantine 9.7.3, TypeScript 6.0.3 ve Playwright 1.64.1 sabitlenmiş; bu plan yeni sürüme geçiş önermez. Gerçek kurulu paketler ve API uyumluluğu uygulama başlangıcında yeniden doğrulanmalıdır.

MantineProvider, Styles API ve theme defaultProps temel uyarlama yoludur. Global `* { border-radius:0 }` veya CSS ile her kontrolü aynılaştıran bir katman kullanılmamalı; slot bazlı semantik tokenlar kurulmalı. Accordion/Drawer/Select/Menu portalları ve iç öğeleri ayrıca kapsanmalı. FocusRing'i kapatmak tek başına erişilebilir odak sağlamaz.

Mantine Table bir tam veri-grid motoru değildir. Sıralama/filtre, satır seçimi ve dönem transpozisyonu domain görünüm modelinde açıkça tariflenmelidir; kütüphanede varmış gibi varsayılmaz. Yeni bir data-grid bağımlılığı bu belgenin kararı değildir.

## 8. 320-first veri deneyimi: tabloyu göreve dönüştürme

### 8.1 Görünüm seçme kararı

| Veri / görev | 320 px temel görünüm | Geniş alan görünümü | Korunacak anlam |
|---|---|---|---|
| Kişi, rol, gider kalemi, karar kaydı | Özet + RecordAccordion | Semantik tablo / liste-detay | Kayıt ID'si, tüm alanlar, sıra, kapsam |
| 15 aylık dönem tablosu | PeriodExplorer, ay başına accordion | Dönem tablosu + grafik | Aylar, birimler, toplamların kapsamı |
| Çok senaryolu sonuç | Seçili senaryo özeti + alan bazlı karşılaştırma | Yan yana karşılaştırma | Aynı metrik/dönem ve varsayım |
| Liyakat/puan matrisi | Satır ve sütun bağlamını seç → kesişim değeri; yakın seçenek kıyası | İki boyutlu matris | Satır/sütun etiketi, eşik ve uygulanan hücre |
| İş değerleme veya parametre girişi | Pozisyon seç → tek sütun faktör formu | Form / satır içi düzenleme | Geçici yazım, puan, ağırlık ve hesap sonucu |
| Organizasyon / karar yetkisi | Dikey hiyerarşi, rol ayrıntısı | Şema + detay paneli | Üst/alt ilişki ve bağlantı |
| Gantt / takvim | Tarihli agenda + rol/ay seçimi | Gantt / takvim | Başlangıç, bitiş, bağımlılık, sahip |
| Grafik | Kısa çıkarım + küçük grafik + değerler | Ayrıntılı grafik + değerler | Kritik değer, ölçek, veri boşluğu |
| Kısa eğitim karşılaştırması | Başlıklara göre açıklama grupları | Tablo / açıklamalı şekil | Kavram eşleşmesi, kaynak |

Mobilde hiçbir standart iş tablosu yatay kaydırmayı zorunlu kılmamalıdır. Aynı kayıt türü için otomatik “ilk üç sütunu göster” yaklaşımı yeterli değildir; özet alanlarını görev belirler.

### 8.2 RecordAccordion ayrıntılı sözleşmesi

- Dış yapı anlamlı bir kayıt listesi; başlıkta kayıt adı, tek önemli değer ve gerekli durum metni.
- İçerik `dl/dt/dd` düzeninde; her değer görünür alan etiketi taşır. Sütun başlığının başka ekranda kalmasına dayanmaz.
- Para birimi, zaman, kaynak ve toplam türü açık yazılır; kritik risk kapalı özette de görünür.
- İlk açılışta özetler görünür. Yalnız ilgili ayrıntılar açılır; karşılaştırma görevi için birden çok panel açık kalabilir.
- Accordion başlığı semantik heading içindeki butondur; `aria-expanded` ve panel ilişkisi doğru olmalı. Link/switch/sil butonu aynı butonun içine yerleştirilmez.
- Enter/Space açar/kapatır; Tab sırası gerçek kontrolleri izler. Opsiyonel ok/Home/End davranışı seçilen Mantine sürümünün sözleşmesiyle tutarlı olur.
- Kapalı panelin alanları Tab veya erişilebilirlik ağacında dolaşılamaz. Açık paneldeki hata, ilgili kayıt özetine de yansır.
- Filtre/sıra değişince açık kayıtlar ID ile korunur; kaybolan odak en yakın anlamlı kontrol/sonuç özetine güvenli taşınır. Sıra indeksi kayıt kimliği olamaz.
- İç içe accordion rutin çözüm değildir. Ay × kategori × kişi gibi üç düzey için önce tek görünüm ekseni seçilir; ikinci ayrıntı düz bir bölüm veya odaklı detay yüzeyinde gösterilir.
- “Tümünü aç” uzun sayfada varsayılan değildir. Uzun kayıtlarda arama, bölüm seçimi ve özete dön bağlantısı sunulur.

#### 320 px kayıt örneği: gider kalemi

Bu bir ekran uygulaması değil, bilgi sırası tarifidir. Bütün değerler kurgusal yer tutuculardır.

```text
Giderler
Dönem: seçili ay · Kaynak: örnek veri
Filtre: Teknoloji · Sonuç: 3 kayıt
[Filtreleri düzenle]

Örnek hizmet A
Seçili ay: [tutar ve para birimi]
Dönem toplamı: [tutar ve dönem]
[Ayrıntıları aç]

Açık ayrıntı:
Kategori          Teknoloji
Kaynak tutarı     [özgün para birimi]
Ay tutarı         [görüntülenen para birimi]
Artış varsayımı   [oran ve geçerli tarih]
Aylık kırılım     [ay seç + etiketli değer]
Kaynak durumu     [zaman / güncel veya eski]
```

Geniş ekranda bu alanlar uygun sütunlara yerleşebilir; mobilde hiçbir alanın anlamı yalnız sütun konumundan çıkarılmaz. Örnek başlık ve alanlar kullanıcının gerçek görevine göre değiştirilir. Aynı şablon her tabloya körlemesine uygulanmaz.

### 8.3 Aynı veri, farklı sunum

`AdaptiveDataView` iki ayrı hesap sonucu üretmez. Tek view model şu bilgileri taşır: kayıt ID'si, alan anahtarı, alan adı, değer, birim, dönem, kritikliği, biçimleyici, erişilebilir açıklama ve uygulanan filtre/sıra. Table ve accordion bunu tüketir.

Her kayıttaki alanlar sınıflanır: **kimlik**, **özet**, **kritik durum**, **ayrıntı**, **eylem**. Mobilde ayrıntının kapalı olması bilgi kaybı değildir; alanın hiç sunulmaması bilgi kaybıdır. CSV sunmak ekrandaki eksikliği telafi etmez.

Bir form iki kez mount edilerek CSS ile saklanmaz. Yinelenmiş ID, iki ayrı taslak, gizli Tab hedefi ve çift `aria-live` oluşmamalı. Rota/dönem/filtre/açık kayıt/draft state görünüm kabuğunun dışında yaşamalı; görünüm değişimi bunları sıfırlamamalı.

### 8.4 Karşılaştırmanın accordion ile zayıflamasını önleme

Accordion satır taraması için iyidir; sütunlar arası kıyası tek başına çözmez.

- Kullanıcı en fazla üç kaydı başlangıç kıyas grubuna alabilir; bu ürün hipotezidir, evrensel sınır değildir.
- Mobil karşılaştırma **alan bazlı** düzenlenir: örneğin “Net nakit” başlığının altında Kötümser / Medyan / İyimser değerleri aynı blokta art arda görünür. Sonraki metrik yeni bloktur.
- Kritik fark, baz senaryo ve farkın yönü açık metinle gösterilir. Bütün değerler aynı dönem/para birimindeyse gruplanır; farklıysa eşitmiş gibi kıyaslanmaz.
- Sık kıyaslanan iki kayıt aynı anda açık tutulabilir. Tek-açık panel zorunluluğu ile ezberleme yaratılmaz.
- Masaüstünde karşılaştırma tablosu, kayda dönme ve seçili kayıtlar aynı state'i kullanır.
- **Kabul:** kullanıcı finansman açığı en büyük senaryoyu önceki tutarı ezberlemeden bulur; hangi metrik nedeniyle seçtiğini açıklayabilir.

### 8.5 PeriodExplorer: finans için özel örüntü

320 px'te 15 ayı yatay uzatmak yerine seçili ay ve önceki/sonraki kontrolleriyle dönem gezilir. Ay özeti: dönem başı nakit, giriş, çıkış, net değişim, dönem sonu nakit. Açılan panel kaynak kırılımını gösterir. Ayrıca ayların özet listesi bulunur; kullanıcı yalnız tek ayda hapsolmaz.

“Toplam dönem” ile “seçili ay” aynı başlık altında karışmaz. Yıllık peşin tahsilat, gelir ve nakit aynı metrikmiş gibi yeniden adlandırılmaz. Finans motorunun hesap tanımları aynen korunur. Tüm ayların toplamı bağımsız test fixture'ı ile doğrulanır.

### 8.6 Uyarlama koşulları ve süreklilik

- Breakpoint'ler cihaz adıyla değil, alanların okunabilir genişliği ve görev başarısıyla belirlenir; ilk adaylar prototipte doğrulanır.
- Mobil yatay olduğunda sırf genişlik arttı diye masaüstü ızgarasına geçilmez. Kısa yükseklik, font ölçeği ve kontrol alanı birlikte değerlendirilir.
- Container query görsel düzen için tercih edilir; semantik kabuk seçimi gerekiyorsa deterministik, erişilebilir ve state koruyan mekanizma kullanılır.
- Kullanıcı düzenlerken odaklı formun kabuğu aniden değiştirilmez. Uyumlu geçiş veya düzenleme bitene kadar aynı görev kabuğu korunur.
- Masaüstü tabloya dönünce aynı kayıt ve mümkünse aynı alan odağı sürer; karşılık yoksa kayıt başlığına anlamlı odak verilir. Rastgele sayfa başına atılmaz.
- Modal/drawer açıldığında safe area, sanal klavye ve görünür alan hesaba katılır. Bir sayfada iç içe dikey kaydırma alanları çoğaltılmaz.

### 8.7 Yatay kaydırma istisnası

W3C Reflow bazı iki boyutlu içeriklere istisna tanır; bu ürünün daha güçlü mobil hedefi olağan tablolarda o istisnayı kullanmamaktır. [Reflow açıklaması](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

Özgün bir şema/çok boyutlu analiz için istisna önerilecekse zorunlu kayıt: görev neden başka düzende korunamıyor, mobil eşdeğer erişim nasıl sağlanıyor, kaydırma sınırı/etiketi/klavyesi nasıl çalışıyor, hangi durumlar onaylı? İlk sürüm planında olağan iş tablosu için onaylı istisna **yoktur**. Bu alanı boş bırakıp örtülü izin varsayma.

## 9. Sayfa ailelerinin yeni deneyim planı

Her satır bir görsel yeniden tasarım yönüdür; iş mantığı değişikliği değildir.

| Sayfa / aile | Mobil ilk görev | Masaüstü kazanımı | Master'lar / kabul odağı |
|---|---|---|---|
| `/` Organizasyon | Dikey üst/alt rol gezgini, rol seç ve sorumluluğu oku | Şema ile yan detay | M20; çizgiyi takip edemeyen kullanıcı da ilişkiyi okuyabilmeli |
| Yedi `/roller/*` sayfası | Rol özeti → sıradaki görev → KPI → rutin ayrıntısı; görev accordionları | Aynı rolün görev–ölçüt–takvimini yan yana gör | M03/M05/M08/M21; yedi ayrı UI dili oluşmamalı |
| Dijital pazarlama rolü | Ölçüm, üretim, paylaşım ve sonuç zincirinde görev seç | Süreç ve takvim kıyası | Teknik araç listeleri ana görevin önünü kapatmamalı |
| `/istihdam/` | Sıradaki işe alım, tarih, görev, maliyet; agenda | Takvim + görev/gider/katkı tablosu | M21/M08; senaryo kapsamı ve başlangıç tarihleri korunur |
| `/hedefler/` | Hedefe kalan fark ve açık kapatma seçenekleri | Kaynaklar ve ayların kıyası | M05/M11/M19; dönem ve hedef türü açık |
| `/gelir-plani/` | Seçili senaryo ve ana sonuç → varsayım → karşılaştırma → detay | Sonuç ve girdiyi aynı görüşte tut | M07/M10/M11; hazır/özel kapsamı, kaynak ve veri doğruluğu |
| `/nakit-akisi/` | Nakit açığı ve risk ayı → aylık kayıtlar | Üç senaryo ve ay serisi birlikte | M10/M11; eksik Sheets verisi tam plan gibi görünmez |
| `/giderler/` | Kapsamlı toplam → arama/filtre → gider kalemi → ay kırılımı | Güçlü filtreli tablo, görünür toplamlar | M08/M12/M18; filtreli/genel toplam ve canlı güncelleme ayrımı |
| `/eylem-plani/` | Yakın tarih/sorumluya göre görev listesi | Gantt + seçili görev ayrıntısı | M21; Gantt olmadan bütün görevlere erişim |
| `/karar-yetkisi/` | Karar konusu → yetkili → eşik/sonraki adım | Yetki şeması + kontrol noktası kıyası | M20/M08; ilişki ve hazırlayan/karar veren ayrımı |
| `/karar-bekleyenler/` | Açık kararlar ve sahipleri; kesinleşenler ayrı | Konu, öneri, etki ve kaynak birlikte | M08/M23; “öneri” yanlışlıkla onaylanmış karar gibi görünmez |
| `/buyume-modeli/` | Kademe, sorumluluk, kazanım koşulu ve kaynak | Ağ modeli ve kapasite kıyası | M20/M19; piramidin metinsel eşdeğeri |
| `/partnership/` | Program seç → görev/konu seç → sonuç | Programlar arası kontrollü kıyas | M02/M26/M11; iki seviyeli seçimin bağlamı korunur |
| `/applet/` 17 model | Model seç → ilgili girdi → sonuç → yöntem | Girdi/sonuç aynı anda; gerektiğinde matris | M07/M08/M13; model değişimi, draft ve URL/geri dönüş kaybolmaz |
| `/parametreler/` | Göreve göre grup ara → alan değiştir → etkiyi gör | Grup gezgini + form + etki özeti | M13/M14/M23; çok alan ve hata yükü yönetilir |
| `/notlar/` | Liste seç, not ekle/tamamla, düzenle | Liste-detay çalışma yüzeyi | M25; gerçek kayıt alanı ve geri alma |
| `/email/` | Konu ve iletiyi düzenle, önizle, kopyala | Form ile önizleme yan yana | M14/M24; kopyalama/sending ayrımı; istemsiz gönderim yok |
| `/bcg/` | İki soruyu öğren → örnek seç → sonucu yorumla | Matris ve açıklama birlikte | M26/M19; eğitim amaçlı içerik operasyon ekranını taklit etmez |
| `/arsiv/` | Kaynak notu ara ve karar karşılığını aç | İzlenebilir kaynak–karar tablosu | M08; içerik kaybı ve eski bağlam karışıklığı yok |
| `/404/` | Nerede hata oldu, güvenli dönüş neresi? | Aynı işlev | M22; önceki bağlama/ana göreve anlamlı dönüş |
| Giriş / çıkış / depolama engeli | Yapıştırma ve parola yöneticisi destekli giriş | Aynı işlev | M14/M22; giriş kapısını gerçek güvenlik iddiasıyla sunma |

### 9.1 Applet alt aileleri

Katalog ve kişi listeleri → kayıt accordionları; iş değerleme → pozisyon başına faktör formu; rütbe ve liyakat matrisi → bağlam seç + hücre sonucu + kıyas; prim eğrisi → girdi ve kısa sonuç + anlaşılır grafik; sprint → sprint kayıt listesi; terfi → kriter checklist'i ve gerekçe; yapı denetimi → önem sıralı bulgu listesi. Hepsini tek genel “tabloların satırlarını aç” kalıbına zorlamak yasaktır.

## 10. Erişilebilirlik planı: WCAG 2.2 AA ve ürünün daha güçlü hedefleri

### 10.1 Uygunluk yaklaşımı

Hedef yalnız otomatik taramada ihlal olmaması değildir. Tam sayfalar, bütün işlem adımları, portallar, yardım metinleri, hata durumları ve desteklenen uyarlamalar birlikte değerlendirilir. Aşağıdaki seçili ölçütler ayrıntılı planlanır; §10.4 bütün A/AA kapsam kaydını zorunlu kılar.

WCAG normatif gereksinim; Understanding ve APG uygulama rehberidir. Bir Mantine bileşeninin erişilebilir dokümante edilmesi, projenin ona verdiği etiket/renk/odak/veri düzeninin uygun olduğu anlamına gelmez. [WCAG 2.2 standardı](https://www.w3.org/TR/WCAG22/)

### 10.2 Kritik kabul matrisi

| Alan / ölçüt | Planlanan yönerge | Kanıt / oracle |
|---|---|---|
| 1.1.1, 1.3.1; anlam ve yapı | Grafik/şema metin ve veri alternatifi; table başlık ilişkileri; mobilde dl/list/heading yapısı | Semantik inceleme + ekran okuyucuyla etiket/değer görevi |
| 1.3.2; anlamlı sıra | DOM sırası mobil iş sırasını izler; CSS ile tersine çevrilmiş odak yok | CSS kapalı/sıralı DOM ve Tab kontrolü |
| 1.3.3, 1.4.1; duyusal işaretler | “Sağdaki yeşil” yerine kayıt adı ve durum; tek başına renk yok | Gri ton + metin erişimi |
| 1.3.4; yön | Dikey/yatay kilidi yok; döndürme girdiyi veya açık paneli kaybettirmez | Geçiş testi; gerçek cihaz ayrıca |
| 1.3.5; girdi amacı | Uygulanabilir kişisel bilgi alanlarında autocomplete/amaç | DOM ve yardımcı teknoloji kontrolü |
| 1.4.3; metin kontrastı | Normal metin 4,5:1; büyük metin koşullarında 3:1; küçük kritik metinde 7:1 ürün hedefi önerisi | Son renk çiftleri, iki tema ve bütün durumlar; 7:1 ayrı hedef |
| 1.4.11; kontrol/grafik kontrastı | Ayırt etmek için gerekli sınır, durum ve grafik öğeleri 3:1; ince gri kenar varsayılanı ölçülür | Hesaplanmış renkler ve görsel inceleme |
| 1.4.4; büyütme | %200 metin büyütmede kesilme, üst üste binme ve işlem kaybı yok | Tarayıcı/font büyütme senaryosu |
| 1.4.10; reflow | 320 px'te genel ve standart veri yüzeyi yatay kaydırmasız; %400 zoom görevi ayrıca | İç/dış taşma + görevin tamamlanması; istisna kaydı |
| 1.4.12; text spacing | Satır 1,5; paragraf 2; harf 0,12; kelime 0,16 × font ayarında içerik/işlev kaybı yok | Kullanıcı stil override'ı ve açık panel/form durumları |
| 1.4.13; hover/focus içeriği | Tooltip/popover kapatılabilir, üstüne gidilebilir ve gerektiği kadar kalıcı; kritik bilgi yalnız tooltip'te değil | Hover → portal → Escape; klavye eşdeğeri |
| 2.1.1, 2.1.2, 2.1.4 | Tam klavye; tuzak yok; tek karakter kısayolları kapalı veya uygun korumalı | Tab/Shift+Tab/Enter/Space/oklar/Home/End/Escape |
| 2.2.1, 2.2.2 | Zaman sınırı varsa ayarlanabilirlik; otomatik hareket/güncelleme gerektiğinde kontrol edilebilir | Polling, yeniden bağlanma ve otomatik yenileme davranışı |
| 2.3.1 | Yanıp sönme eşiği ihlali yok | Değişen tutar, tema ve yükleme animasyonları |
| 2.4.1–2.4.6 | Skip link, anlamlı başlık, mantıklı odak sırası, link amacı, çoklu bulma yolu, açıklayıcı etiket | Rota/başlık ve görev bazlı gezinme |
| 2.4.7; görünür odak | Çevrelemeyen tek gösterge; her kontrol ve portalda görünür | Hesaplanmış stil + görsel klavye kanıtı |
| 2.4.11; örtülmeyen odak | AA: odak öğesi yazar içeriğiyle tamamen örtülmez; ürün hedefi: tamamı görünür | Sticky header, drawer alt eylemi, kısa yükseklik ve zoom |
| 2.5.1–2.5.4 | Karmaşık jest alternatifi, iptal edilebilir pointer eylemi, visible label/name eşleşmesi, motion actuation alternatifi | Tek pointer, pointerup/cancel, konuşmayla adlandırma |
| 2.5.7; dragging | Sürükleme gerektiren her görevde tek pointer ile sürüklemesiz yol; klavye de korunur | Örneğin sıralama için yukarı/aşağı kontrolleri |
| 2.5.8; hedef boyutu | AA ölçütü 24×24 veya tanımlı istisnaları; ürünümüz 44/48 hit area hedefler | Gerçek tıklanabilir bölge ve komşu hedeflerin örtüşmesi |
| 3.1.1, 3.1.2 | Sayfa dili Türkçe, dil değişen parçalar gerektiğinde işaretli | HTML ve okuyucu telaffuzu |
| 3.2.1–3.2.4, 3.2.6 | Odak/girdi beklenmedik bağlam değişimi üretmez; tutarlı gezinme/kimlik ve varsa yardım konumu | Aynı master'ın farklı sayfalarda kontrolü |
| 3.3.1–3.3.3 | Hata nedeni metinle, alanla ilişkili, düzeltme önerili; yalnız kırmızı sınır yok | Hata listesi → alan; form state korunumu |
| 3.3.4 | Finansal/veri taahhütlerinde uygun geri alınabilirlik, kontrol veya onay; kapsamına göre | Önce/sonra inceleme ve düzeltme görevi |
| 3.3.7 | Aynı süreçte bilinen bilgi tekrar istenmez; uygun otomatik doldurma/seçim | Başka adımda aynı verinin korunması |
| 3.3.8 | Parola yöneticisi/yapıştırma desteklenir; bilişsel teste zorlayan engeller konmaz | Girişte yapıştırma, otomatik doldurma ve hata akışı |
| 4.1.2 | Doğru name/role/value; expanded/selected/checked anında | Accessibility snapshot ve gerçek okuyucu |
| 4.1.3 | Sonuç sayısı/kayıt/hata doğru live bölgesinde; her tuş ve polling duyurulmaz | Ekran okuyucu konuşma günlüğü, anlamlı olay sınırı |

Ayrıntı kaynakları: [Metin kontrastı](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [metin dışı kontrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), [hover/focus içeriği](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), [odak görünürlüğü](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [odak örtülmesi](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [hedef boyutu](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [dragging](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), [yeniden veri girişi](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html), [erişilebilir kimlik doğrulama](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html), [durum mesajları](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [hata önleme](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html).

### 10.3 AA üstü ürün hedefleri

- Kritik küçük metinde mümkünse 7:1 kontrast; AA'nın her metin için 7:1 istediği söylenmez.
- Odaklanan kontrolün tamamını görünür tutmak hedeflenir; 2.4.11 AA'nın “tamamen örtülmeme” tabanından güçlüdür.
- 44/48 px hedef alanı ürün standardıdır; 24 px AA eşiğiyle karıştırılmaz.
- AA'nın iki boyutlu içerik istisnasına rağmen standart mobil tablolarda yatay scroll yoktur.
- Yöntem, veri alternatifi, açık dil ve geri alma; biçimsel uygunluğun yanında karar kalitesini güçlendirir.
- 14 px minimum, Outfit ve radius yasağı kullanıcı/ürün kararıdır; WCAG'nin bunları aynen zorunlu kıldığı iddia edilmez.
- 2.4.13 Focus Appearance AAA'dır; bu projede AA zorunluluğu diye etiketlenmez. Daha güçlü odak tasarımı kendi sözleşmesiyle doğrulanır.

### 10.4 Tam A/AA kapsam kaydı

Her sayfa ve tam süreç için şu ölçütler `PASS / FAIL / not_run / not_applicable + gerekçe + kanıt` ile izlenmelidir. Ortak component kanıtı sayfa birleşimindeki sorunların yerine geçmez.

| İlke | A/AA kapsamı |
|---|---|
| Algılanabilir | 1.1.1; 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5; 1.3.1, 1.3.2, 1.3.3, 1.3.4, 1.3.5; 1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.5, 1.4.10, 1.4.11, 1.4.12, 1.4.13 |
| Çalıştırılabilir | 2.1.1, 2.1.2, 2.1.4; 2.2.1, 2.2.2; 2.3.1; 2.4.1, 2.4.2, 2.4.3, 2.4.4, 2.4.5, 2.4.6, 2.4.7, 2.4.11; 2.5.1, 2.5.2, 2.5.3, 2.5.4, 2.5.7, 2.5.8 |
| Anlaşılabilir | 3.1.1, 3.1.2; 3.2.1, 3.2.2, 3.2.3, 3.2.4, 3.2.6; 3.3.1, 3.3.2, 3.3.3, 3.3.4, 3.3.7, 3.3.8 |
| Sağlam | 4.1.2, 4.1.3 |

Video/ses veya hareketle kontrol mevcut değilse ilgili ölçütler kanıtla `not_applicable` olabilir; ileride eklendiğinde yeniden değerlendirilir. 4.1.1 Parsing WCAG 2.2'den kaldırılmıştır; HTML doğruluğu yine iyi mühendislik gereğidir. Eski otomatik araç raporunun bunu 2.2 şartı olarak sunması kabul kaydını değiştirmez.

## 11. TDD-first planı: test önce, tasarım kararı izlenebilir

### 11.1 Tasarım TDD'si ve yazılım TDD'si

Bu planlama aşamasında her örüntü için önce başarısız olacak **gözlenebilir görev** yazılır; taslak o görevi çözmek üzere üretilir. Uygulama başladığında aynı sözleşme davranış testine dönüşür. Estetik yargının bütünü otomatik teste indirgenmez.

Döngü:

1. **Önce kapsam:** görev, fixture, durum, alan kaybı riski ve UX ilkesi.
2. **RED:** mevcut sürümde testin hedef nedenle başarısız olduğu gösterilir. Sunucu açılamaması veya paket eksikliği geçerli RED değildir.
3. **Tasarım kararı:** görev akışı ve master contract; 320 px örneği, hata/boş durum ve karşılaştırma.
4. **GREEN:** en küçük uygulama ilgili davranış ve bilgiyi korur. Değerler bağımsız oracle ile karşılaştırılır.
5. **REFACTOR:** görsel/etkileşim tekrarları master'a alınır; testler davranışı izlemeye devam eder.
6. **Bağımsız inceleme:** kullanılabilirlik, görsel denge ve erişilebilirlik kanıtı eleştirilir. Testin geçmesi estetik onayı yerine geçmez.

Bu çalışma kapsamında RED/GREEN çalıştırılmadı; aşağıdaki testler **önerilen kabul senaryolarıdır**. Mevcut 50 açılış ölçümü baseline gözlemidir.

### 11.2 Test oracle'ları

- **Bilgi eşdeğerliği:** sabit fixture'daki alan anahtarları, değerler, birimler ve dönemler; table ve accordion aynı oracle ile kıyaslanır. İkisinin birbirini kopyalaması bağımsız doğruluk kanıtı değildir.
- **Durum:** kayıt ID'si, filtre/sıra, seçili dönem/senaryo, açık panel, taslak ve odak hedefi.
- **Geometri:** scrollWidth/clientWidth; hedef alanları; odak görünürlüğü; hesaplanmış metin boyutu/radius.
- **Semantik:** heading, name/role/value, dl/table ilişkileri, expanded/selected ve gizli panel erişimi.
- **Algısal:** aynı ortamda önce/sonra/fark; gri tonlama ve tam durumlar; bağımsız yorum.
- **Görev:** doğru sonuç, tamamlanma, yanlış yorum ve toparlanma; gerçek kullanıcıyla ölçüm.

### 11.3 Kabul senaryoları kataloğu

| ID | Given / bağlam | When / eylem | Then / doğrulanabilir sonuç |
|---|---|---|---|
| UX-01 | 320 px, çok alanlı gider fixture'ı | Gider kaydı açılır | Sayfa ve kayıt içinde yatay scroll yok; bütün alanlar etiketleriyle erişilir |
| UX-02 | Aynı fixture, aynı filtre/sıra | 320 → geniş → 320 | Kayıt kimliği, filtre, sıra ve açık kayıtlar korunur; toplam değişmez |
| UX-03 | 15 aylık nakit fixture'ı | Her ay ve toplam dönem gezilir | Bütün aylar erişilir; toplam ve ay kapsamı karışmaz; tutarlar oracle ile aynı |
| UX-04 | Üç farklı senaryo | Mobil karşılaştırma açılır | Aynı metrik altında üç değer görünür; en büyük açığı ezberlemeden bulma yolu var |
| UX-05 | Applet iş değerleme | Bir pozisyonun faktörü değiştirilir | Taslak, ağırlık, puan ve sonuç bağlamı korunur; eşik uygulaması aynı |
| UX-06 | Liyakat matrisi | Performans ve compa seçilir | Uygulanan hücre ve iki eksen etiketi açık; matrix ile aynı sonuç |
| UX-07 | Accordion kapalı | Tab, Enter/Space ve geri kapatma | Tek doğru expanded durumu; gizli alanlara Tab yok; odak başlıkta kalır |
| UX-08 | Kayıt formunda hata var | Grup kapalıyken hata özeti seçilir | İlgili kayıt açılır, alan görünür ve odağı alır; diğer girişler korunur |
| UX-09 | 320 px, uzun Türkçe ad ve negatif tutar | Aç/kapat, filtrele | Metin doğal sarılır; tutar/işaret/birim kesilmez; alan sınırını aşmaz |
| UX-10 | Sayı alanı min değeri 0'dan büyük | Boş → `0,` → `0,85` yazılır | Ara yazım engellenmez; geçerli değer işlenir; blur doğrulaması açıklıdır |
| UX-11 | Veri yok / gerçek 0 / hesaplanmadı fixture'ı | Sonuç görüntülenir | Üç durum farklı etiketlidir; 0 ile bilinmeyen aynılaşmaz |
| UX-12 | Gider filtresi etkin | Kalem seçimi değiştirilir | Sonuç sayısı, filtreli toplam ve genel toplam doğru kapsamla gösterilir |
| UX-13 | Filtrede sonuç sıfır | Filtre sıfırlanır | “Veri yok” yerine filtre boşluğu anlaşılır; filtre kaldırma yolu çalışır |
| UX-14 | Senaryo özel, değişiklik var | Sıfırla seçilir | Hangi kapsamın sıfırlanacağı görünür; geri dönüş politikası uygulanır |
| UX-15 | Tarayıcı kaydı kapalı | Parametre değiştirilir | “Kaydedildi” yalanı yok; oturum içi geçerlilik ve kaydetme sorunu anlaşılır |
| UX-16 | Eski iyi veri, ağ kesildi | Yeni yanıt gelmez | Son güvenilir veri korunur; eskilik açık; sahte “Canlı” başarısı yok |
| UX-17 | Ekran okuyucu ve hızlı girdi | Birkaç karakter yazılır, polling gelir | Her tuşta bütün tablo okunmaz; anlamlı sonuç/işlem durumu bir kez duyurulur |
| UX-18 | İki tema, bütün component durumları | Kontroller ve portal açılır | Metin ve gerekli sınır kontrastı ölçütleri sağlanır; renk tek taşıyıcı değil |
| UX-19 | Normal tema, keyboard/pointer | Tab ile gezin, sonra tıkla | Klavyede tek görünür çevrelemeyen gösterge; pointer'da halka yok; işlev korunur |
| UX-20 | Forced colors | Tab ve pointer arasında geç | Dar outline istisnası yalnız izinli koşulda; değerler/seçim anlaşılır |
| UX-21 | Sticky header / drawer alt eylemi | Son alana Tab ile gidilir | Odak örtülmez; kısa yükseklikte ana eyleme erişilir |
| UX-22 | Kaba + hassas giriş kullanılabilir | Dokun, fareyle kullan, klavyeye geç | 48 px hedef korunur; hover tek erişim yolu değildir; modlar karışmaz |
| UX-23 | 200% metin, 400% zoom, text spacing | Temel görev tamamlanır | Etiket/alan/eylem kesilmez; görünüm doğru uyarlanır; içerik kaybı yok |
| UX-24 | Açık form ve seçili kayıt | Yatay/dikey ve bölünmüş alan geçişi | Taslak ve odak kaybolmaz; ikinci form mount edilmez |
| UX-25 | Reduced motion | Hızlı aç/kapat ve seçim değiştir | İşlev/ARIA anında; gereksiz hareket yok; eski animasyon kuyruğu yok |
| UX-26 | Master registry dışı radius | Kaynak ve runtime gate çalışır | Yüzey slotlarında pill/switch/onaylı istisna dışı pozitif border-radius FAIL; §6.3 semantik çizim geometrileri ayrı sınıflanır |
| UX-27 | Tüm readable slot'lar | Font ölçümü yapılır | 14 px altı FAIL; Giderler'de 15 px altı FAIL; chart/portal dahil |
| UX-28 | Derin applet/ortaklık URL'si | Yenile, geri/ileri kullan | Doğru panel, rota ve gezinme durumu; hash'siz geri dönüş de doğru |
| UX-29 | Mobil organizasyon | Bir rolün üstünü ve görevini bul | Şema kaydırmadan ilişki ve rol sayfasına erişim |
| UX-30 | Mobil Gantt eşdeğeri | Bir sorumlunun gelecek görevleri aranır | Tarih, sahip, bağımlılık ve hedef listeden erişilir |
| UX-31 | Grafik yüklenemiyor | Kullanıcı ana metrik ve değeri arar | Anlamlı yedek veri ve kurtarma yolu; boş dev alan yok |
| UX-32 | Veri güncellemesi geldi | Kullanıcı bir kaydı inceliyor | Kayıt/odak zıplamaz; değişimin kapsamı anlaşılır; eski yanıt yeniyi ezmez |
| UX-33 | CSV / kopyalama başarısız | Dışa aktarma istenir | Açık hata ve alternatif; yanlış başarı bildirimi yok; kapsam açıklıdır |
| UX-34 | Tek karakter kısayol / drag özelliği varsa | Yardımcı girişle görev yapılır | Kısayol koruması, sürüklemesiz pointer yolu ve klavye erişimi |
| UX-35 | Giriş formu | Parola yöneticisi ve yapıştırma kullanılır | Engellenmez; hatada hangi alanın düzeltileceği anlaşılır |
| UX-36 | Uzun liste, sonuç sayısı büyük | Arama/sayfa değişimi yapılır | Kimlik, sıra ve kapsam korunur; büyüyen DOM kritik görevi engellemez |

### 11.4 Fixture sözlüğü

Sabit kurgusal kayıtlar şu sınırları içermelidir: çok uzun Türkçe ad, büyük/negatif/ondalıklı tutar, sıfır ve null, farklı para birimleri, aynı görünen ad ama farklı ID, 15 ay, kategori alt toplamı, bekleyen karar, devre dışı alan, birden fazla hata, kötü veri/bozuk kayıt, gecikmeli/yanlış sıralı yanıt ve depolama reddi. Gerçek kişi/ücret/Sheets verileri snapshot'a veya public repoya yazılmaz.

## 12. Tasarım değerlendirme ve kullanıcı araştırması planı

### 12.1 Yöntem

Önce yönetim, operasyon ve finans/İK görev bağlamlarından temsilci kullanıcılarla mevcut akış gözlemi yapılmalı. Bunlar ürün hipotezleri olduğundan örneklem sadece unvana göre seçilmemeli; cihaz, görme/okuma ve giriş becerisi çeşitliliği de dikkate alınmalı.

İlk tur için 5–8 katılımcı bir **nitel araştırma başlangıç önerisidir**, istatistiksel yeterlilik veya bütün sorunları bulma garantisi değildir. Ekran okuyucu/klavye kullanıcılarının görevleri ayrı uzman incelemesiyle desteklenmeli. Bulgular doygunlaşmazsa yeni tur planlanmalı.

Görev örnekleri:

1. Seçili planda en yüksek nakit ihtiyacını ve ayını bul.
2. İki senaryonun maliyet farkını ve nedenini açıkla.
3. Bir gider kaleminin ilgili ay tutarını ve dönem toplamını bul.
4. Bir rolün ilk görevini, sorumlusunu ve tarihini bul.
5. Bir applet faktörünü değiştir, sonucu yorumla ve geri dön.
6. Yanlış parametre/hata/bağlantı kopması sonrasında çalışmanı kaybetmeden toparlan.

### 12.2 Metrikler ve karar

| Boyut | Ölçüm | Yorum |
|---|---|---|
| Görev başarısı | Doğru sonuç / yardım gereksinimi / vazgeçme | Görsel beğeniden bağımsız değerlendirilir |
| Doğruluk | Tutar, dönem, kaynak ve senaryo yorumunun doğruluğu | Kritik yanlış yorum ayrı blocker olabilir |
| Verim | Tamamlama süresi, gereksiz geri dönüş ve aç/kapat sayısı | İçerik/öğrenme farkları kaydedilir; evrensel süre eşiği yok |
| Zihinsel yük | Tek görev sonrası kolaylık sorusu + gözlenen tereddüt | Salt toplam tıklama sayısına indirgenmez |
| Visceral etki | Kısa gösterim sonrası sıfatlar ve amaç algısı | Görev performansının yerine geçmez |
| Güven | Sonucun kaynağını ve saklama kapsamını açıklayabilme | Süs veya “canlı” etiketi güven kanıtı sayılmaz |
| Toparlanma | Hata sonrası başarı ve veri kaybı | Yeniden giriş ve kaybolan bağlam kaydedilir |
| Estetik denge | Hiyerarşi, boşluk, gruplama ve tutarlılığa bağımsız eleştiri | Tek öznel puanla PASS verilmez |

Başlangıç ölçümü alınmadan “%30 daha hızlı” gibi hedef yazılmaz. Önce mevcut akışla aynı görev ve fixture üzerinde karşılaştırılır. Kritik bilgi kaybı, yanlış finansal yorum, görünmeyen odak ve erişilemeyen eylem herhangi bir beğeni puanıyla telafi edilemez.

## 13. QA ve kanıt planı

### 13.1 Kapsam katmanları

| Katman | Ne doğrular? | Ne doğrulamaz? |
|---|---|---|
| Saf model testleri | Hesap, eşik ve veri dönüşümü | Kullanıcı algısı veya ekran erişilebilirliği |
| Master component testleri | State, semantik ve etkileşim sözleşmesi | Bütün sayfa birleşimleri |
| Playwright görev testleri | Rota, görünüm, klavye, hit area, reflow, state geçişi | Gerçek iOS/Android veya her yardımcı teknoloji |
| Hesaplanmış stil kapısı | Font/radius/focus/motion token ihlalleri | Otomatik tam estetik veya WCAG onayı |
| Otomatik a11y tarama | Makineyle bulunabilen semantik ihlaller | Bütün WCAG ölçütleri; araç kurulu değilse mevcutmuş gibi raporlanmaz |
| Deterministik görsel fark | Aynı ortamda görünüm değişimi | Değişikliğin iyi veya kullanılabilir olduğu |
| Bağımsız tasarım/QA | Hiyerarşi, boşluk, örüntü ve kanıt yorumlama | Çalıştırılmamış runtime testi |
| Gerçek kullanıcı / yardımcı teknoloji | Görev, zihinsel model, toparlanma | Başka bütün kullanıcı ve cihazlar |

### 13.2 Matris ve sıra

1. 320 CSS px kritik görev; ardından 360, 375, 390 px.
2. Yatay telefon ve kısa yükseklik; tablet/bölünmüş alan; dizüstü/masaüstü; ürünün gerektirdiği büyük ekran.
3. Değişen breakpoint için N−1/N/N+1; görev açısından değişmeyen her piksel için test çoğaltılmaz.
4. Mevcut Chromium, Firefox ve WebKit; mouse, touch ve keyboard; karma giriş ayrıca.
5. Gerçek macOS Safari + VoiceOver, Windows NVDA ile desteklenen tarayıcı, iOS Safari ve Android tarayıcı; erişilemiyorsa açık `not_run`.
6. Açık/koyu, reduced motion, forced colors uygulanabilir ortamı; zoom ve text spacing; loading/empty/error/stale/partial/invalid.
7. Aynı profile sıcak/soğuk yükleme; yön/resize sırasında state, açık panel, form taslağı ve odak.

Chromium sonucu Chrome, WebKit sonucu Safari diye adlandırılmaz. Sanal klavye ve fiziksel yön değişimi yalnız viewport resize ile doğrulanmış sayılmaz. Kullanıcı daha sonra smoke kapsamı isterse kalıcı sınırlı test politikası öncelik kazanır.

### 13.3 Ağ ve kaynak bütçesi

Ortak tasarım için gerekli hafif CSS/JS'nin paylaşılması geçerlidir. Sadece masaüstünde gereken büyük grafik veya başka özel kaynak mobilde indirilip gizlenmemelidir. Yeni iki kabuk tasarımı iki tam uygulama paketi indirmek anlamına gelmemeli.

Planlanan ağ kabulü: üretim build manifest'i ve istek başlangıçları gözlenir; mobil ilk yüklemede seçilmeyen büyük özellik kaynakları istenmez; grafiğe ihtiyaç olduğunda doğru kaynak sonradan yüklenir. Cache, prefetch ve başarısız istekler ölçümden dışlanmaz. Sayfa açılması, yalnız indirilen byte veya `display:none` kaynak izolasyonu kanıtı değildir.

Sayısal performans bütçeleri mevcut ölçüm alınarak ve ürün kararıyla belirlenmelidir. Bu belgede uydurma bütün sayfalara ortak byte bütçesi ilan edilmez. Ölçümler sıkıştırılmış/açılmış veri, cache durumu, donanım ve görev penceresini açıklamalıdır.

### 13.4 Kanıt kaydı

Her kabul: commit, master ID, görev/fixture, rota/state, tarayıcı sürümü, OS, CSS viewport, DPR, input, tema/tercih, koşan komut, sonuç ve artefakt konumu. Durumlar `PASS`, `FAIL`, `not_run`, `not_applicable`.

Bir UI snapshot'ı tek başına tamamlanma değildir. Önce/sonra/fark ve gerekçe hazırlanır; uygulayıcı kendi değişikliğinin tek görsel onaylayıcısı olmaz. Bağımsız inceleme yoksa açıkça `not_run` yazılır.

## 14. Planlama sırası ve karar kapıları

Bu bölüm bir sprint takvimi veya geliştirme iş emri değildir; hangi tasarım kararının hangi kanıt olmadan geçemeyeceğini tanımlar.

| Kapı | Planlama çıktısı | Geçiş koşulu |
|---|---|---|
| K0: görev ve içerik | Rota, kullanıcı görevi, kritik alan ve mevcut sorun haritası | Bütün sayfa aileleri; kaybolmaması gereken veri ve bağlam belli |
| K1: görsel gramer | Token niyetleri, radius kayıtları, tipografi ve hiyerarşi örnekleri | 320 px ve geniş ekranda aynı kimlik; açık/koyu değerlendirme planı |
| K2: master contract | §7 registry'sinin bileşen sözleşmeleri ve durum örnekleri | Her master'ın semantiği, uyarlaması ve kabul oracle'ı var |
| K3: veri dönüşümü | Gider kaydı, ay tablosu, puan matrisi, hiyerarşi için örnek akış | Bütün alanlara erişim, karşılaştırma ve state sürekliliği çözülmüş |
| K4: görev prototipi | Gelir/Nakit/Giderler/Applet/Parametreler kritik yol taslakları | Kritik görev yanlış yorum ve yatay scroll olmadan tamamlanabiliyor |
| K5: erişilebilirlik tasarımı | A/AA applicability kaydı, odak haritası, hata ve portal sözleşmeleri | Zorunlu kriterde tasarım açığı yok; test yöntemi belli |
| K6: TDD kabul paketi | RED görevleri, fixture ve bağımsız oracle, görsel inceleme koşulları | Uygulamaya başlamadan başarı/başarısızlık ayırt edilebilir |
| K7: bağımsız plan eleştirisi | Sorunlar, uyuşmazlıklar, açık kararlar ve gerekçeler | Geçerli bulgular işlendi; doğrulanmamış katmanlar gizlenmedi |

Daha sonra geliştirmeye geçilirse önerilen öncelik master'ların veri/odak doğruluğuna göre belirlenir; yalnız ekranların görünüşünü sırayla boyamakla başlanmaz. Bu belge tek başına geliştirmeye geçme, toplu refactor, yeni paket, merge veya deploy talimatı değildir.

## 15. Tamamlanma ve reddetme ölçütleri

Yeni UI tasarımı aşağıdaki koşullarla kabul edilebilir:

- 320 px'te bir kullanıcı ana görevleri yatay kaydırma gerektirmeden tamamlayabilir; tabloyu saklayıp veri erişimini kaybetmez.
- Accordion ile okuma kolaylaşırken karşılaştırma yolu ayrıca korunur; kullanıcı önceki değeri ezberlemek zorunda değildir.
- Masaüstünde veri yoğunluğu ve karşılaştırma gücü gereksiz yere mobil form düzeyine indirilmez.
- Her sayfa master registry ile açıklanır; aynı anlam farklı yerel kontrol üretmez.
- Pill/switch ve açık onaylı kayıt dışında yüzey radius'u yoktur; tüm okunabilir metinler 14 px veya ilgili daha güçlü tabanın üzerindedir.
- Filtre, senaryo, dönem, kaynak ve toplam kapsamı hem görünür hem programatik olarak anlaşılırdır.
- Normal temada çevreleyen odak halkası yok; görünür alternatif ve tam klavye görevi vardır.
- Uygulanabilir WCAG 2.2 A/AA ölçütlerinde açık FAIL kalmaz; uygunluk iddiası gerçek tamamlanmış kapsamı aşmaz.
- Finansal/İK anlamları, bütün alanlar ve hesap sonuçları bağımsız oracle ile korunur.
- Estetik değerlendirmede hiyerarşi, boşluk, yakınlık, benzerlik ve ortak bölge kararlarının gerekçesi somuttur; yalnız “daha güzel” denmez.
- Loading/error/stale ve kaydetme durumları gerçek durumu söyler; kritik hata süslü başarı bildirimiyle örtülmez.
- Kanıtı olmayan tarayıcı, kullanıcı testi, bağımsız QA veya yayın yapılmış sayılmaz.

**Reddetme örnekleri:** mobil tabloyu kesmek; satır başlığını gizlemek; fontu 12 px yapmak; bütün sayfaya `overflow-x:hidden` koymak; nested accordion labirenti kurmak; bütün butonları pill saymak; focus'u `blur()` ile yok etmek; eski rounded snapshot'ları açıklamasız yenilemek; iki ayrı formu indirip CSS ile gizlemek; kullanıcı görmeden senaryo/filtre sıfırlamak.

## 16. Açık tasarım kararları ve araştırılacak varsayımlar

Aşağıdakiler bu belgede karara bağlanmış uygulamalar değildir:

- Ana gezinmede mevcut “Giderler” adının “Finans”a dönüşmesinin bulunabilirliği; ilk tıklama çalışması gerekir.
- Her kayıt türünde mobil özete alınacak alanlar; işlem riski ve gerçek görev önceliğiyle seçilmelidir.
- Hangi karşılaştırmalarda iki, hangilerinde üç kayıt sınırının yararlı olduğu; görev gözlemiyle doğrulanır.
- Giderler'deki Roboto istisnasının uzun vadede sürmesi; mevcut açık karar korunur, font birleştirme ayrı değerlendirilir.
- Büyük masaüstü tablolarının sayfalama/virtualization ihtiyacı; gerçek kayıt sayısı ve okuyucu desteği ölçülmeden yeni bağımlılık önerilmez.
- Mobil grafik ve hiyerarşilerde özgün iki boyutlu görünüm için gerçekten gerekli istisna olup olmadığı; varsayılan alternatif akış önce sınanır.
- Gerçek yardımcı teknoloji, fiziksel cihaz ve yavaş ağda sonuçlar; bugün bu belgenin kanıtı değildir.

## 17. Kaynaklar ve uygulama notları

### 17.1 Normatif ve örüntü kaynakları

- [WCAG 2.2 — W3C Recommendation](https://www.w3.org/TR/WCAG22/): uygunluk hedefi ve başarı ölçütleri. Understanding belgeleri açıklayıcıdır.
- [WAI-ARIA APG Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/): başlık, panel ve klavye örüntüsü.
- [WAI-ARIA APG Table](https://www.w3.org/WAI/ARIA/apg/patterns/table/): tablo semantiği; her etkileşimli tablo otomatik grid olmaz.
- [Mantine Accordion](https://mantine.dev/core/accordion/), [MantineProvider](https://mantine.dev/theming/mantine-provider/): kullanılan sürümle karşılaştırılacak resmi referanslar.
- [Nielsen'in kullanılabilirlik ilkeleri](https://www.nngroup.com/articles/ten-usability-heuristics/): durum görünürlüğü, tutarlılık, hata önleme, tanıma ve kullanıcı kontrolü için değerlendirme çerçevesi.
- [Don Norman — Emotional Design: People and Things](https://jnd.org/emotional-design-people-and-things/): visceral / behavioral / reflective ayrımı.
- [Laws of UX](https://lawsofux.com/): değerlendirme diline yardımcı ilke derlemesi; tek başına nicel deney kanıtı veya ürün şartnamesi değildir. İlgili ilke bağlantıları §5'te verilmiştir.

### 17.2 Yerel ortak yönergeler

`AGENTS.md`, `/Users/w6x/AGENT.md`, `/Users/w6x/.claude/skills/coding-standards/SKILL.md` ve `references/{adaptive-ui,adaptive-qa,ui-motion,ai-first-ui}.md` ortak başvuru kaynaklarıdır. Bu belgede yeni radius ve mobil veri sunumu kararı açıkça belirtilmiştir; diğer kalıcı güvenlik, Git yazarlığı ve kullanıcı verisi kuralları korunur.

Bu metin yeni bir çalışma standardı önerir; uygulandığı veya mevcut projenin bütünüyle uygun olduğu iddiası taşımaz.

### 17.3 Bu belgenin son kontrol kaydı

- Bağımsız salt okunur plan incelemesi yapıldı. Radius kabulünün semantik geometriyle çelişmesi bulgusu düzeltildi: yüzey slotu ve iç çizim geometrisi ayrı sınıflandırılır.
- Reviewer manifest/lockfile uyumunu ve plan sözleşmelerini kaynak üzerinden inceledi; runtime, gerçek cihaz veya bağımsız ekran görüntüsü QA yapmış sayılmaz.
- Master ve kabul senaryosu kimlikleri tekillik/sıra açısından kontrol edildi; 26 master ve 36 kabul senaryosu var. Resmi WCAG/APG/Mantine ve ilgili UX kaynakları çevrimiçi incelendi.
- Kaynak/test/yapılandırma dosyalarında bu görevden değişiklik yoktur. Yeni kabul testleri yazılmadı ve uygulama doğrulaması iddia edilmedi. Yalnız `ux.md` üretildi.
