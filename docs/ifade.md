# İfade: anlaşılır arayüz dili için eleştiri, ölçüm ve kabul sözleşmesi

**Ana tanı: metinler çoğu yerde bilgiyi taşıyor, fakat okuyucunun o bilgiyle ne yapacağını ve hangi anlam sınırında okuyacağını yeterince taşımıyor.** Sorun genellikle eksik sıfat veya zamir değil; eksik ilişki, tanımsız terim, belirsiz ölçüm kapsamı ve varsayımın sonuç gibi yazılması. Bazı cümleler gereğinden uzun; bazı etiketler ise anlamı korumayacak kadar kısa. Çözüm bir “kısaltma operasyonu” değil, anlamı ve görevi birlikte tasarlamaktır.

Bu belge Claude’a verilecek **inceleme ve uygulama yönergesidir**. Bu teslimde uygulama metinleri, bileşenler, hesaplar ve testler değiştirilmedi. Yeniden yazım örnekleri öneridir. Yeni davranış isteyen öneriler ayrıca işaretlenir; içerik düzeltmesi adı altında model değiştirilemez.

27 Ekim 2026 · Önce `git pull --ff-only origin main` çalıştırıldı: `5f15b62 → 1950925`. İncelenen kaynak sürümü `1950925`. `ux.md` ve `ux_v2.md` korundu. V2’nin eski sürümdeki eksiklerini güncel projede otomatik olarak mevcut saymadım. Son pull, özellikle ortak veri görünümü ve OPEX üzerinde değişiklik içeriyor. Bu belge dil ve anlam görevine odaklanır; bütün projenin görsel veya işlevsel denetimi değildir.

**Okuma yolu:** Önce §2’de kök nedeni, §5’te gerçek metinleri, §10’da Claude’a uygulanacak sözleşmeyi okuyun. §3 persona görevlerini; §4 ölçüm modelini ve 240 kriteri; §6 UX gerekçelerini; §8 testleri; §9 erişilebilirliği; §11 üç turun son kontrolünü içerir. Katalog bir uygulama kontrol listesi olarak kullanılabilir; ilk okumada bütün satırları ezberlemek gerekmez.

## 1. Kanıt sınırı ve üç incelemenin nasıl yapıldığı

### 1.1 İncelenen içerik

Ana görev `gelir-plani/?senaryo=medyan`; destekleyici yüzeyler Parametreler, Nakit akışı ve Applet. Gelir planının görünen etiketleri ve açıklamaları; `RevenuePage.tsx`, `SenaryoKurucu.tsx`, `scenarioOptions.ts`, `ParamsPage.tsx`, `params.ts` kaynaklarıyla karşılaştırıldı. Finans terimleri için `revenue.ts` ve `breakeven.ts` formülleri okundu. Applet’in ilk paneli örneklemde görüldü; tüm applet panellerinin içerik denetimi yapılmış sayılmaz.

İzole Playwright Chromium **156.0.8078.4**, 320×900 ve 1280×900, Türkçe yerel ayar: dört rota için sekiz metin yakalaması alındı. Gelir planının 320 ekran görüntüsü ayrıca incelendi. Harici gider istekleri testteki **kurmaca OPEX fixture** ile karşılandı; gerçek Sheets verisine erişilmedi. Burada görülen para ve tarihler üretim verisi, gerçekleşme veya şirket taahhüdü değildir. Runtime yakalamaları `/tmp/19ekim-ifade/corpus-runtime.json`, görüntüler aynı geçici dizindedir; belgeyi kullanmak için bunlara ihtiyaç yoktur. Kaynak alıntıları ve bütün puan vektörleri aşağıdadır. Geçici kanıtlar uzun vadeli arşiv değildir.

Açık seçeneklerin görünürlüğü genişliğe göre değişiyor. Bu yüzden ilk ekran metnini toplam sayfa metniyle karıştırmamak gerekir. DOM’dan alınan bütün metnin uzunluğu “kullanıcı aynı anda bu kadar okumalı” demek değildir. Hata, depolama kapalı, dinamik seçenek ve dışa aktarma durumlarının bir kısmı **kaynak incelemesine** dayanır; hepsi tarayıcıda tetiklenmiş değildir. Firefox, WebKit, gerçek cihaz, ekran okuyucu ve insan anlama testi bu teslimde **NOT_RUN**.

### 1.2 Üç tur: aynı çekirdeği farklı derinlikte yeniden değerlendirmek

Aşağıdaki C01–C32 kümesi üç turda da korundu. Tur başlıkları üç ayrı araştırmanın toplamı değildir; aynı ifadelerde ilk tanının kaçırdığı anlamlar yeniden arandı. Çalışma notları `/tmp/19ekim-ifade/` altındadır; sonuçlar burada eksiksiz özetlenir. Turlar tek inceleyicinin çalışmasıdır; bağımsız insan doğrulaması değildir.

| Tur | Aynı kümede sorulan soru | İlk turdan farklı olarak bulunan eksik | Sonuçtaki değişiklik |
|---|---|---|---|
| 1 — Dil ve önerme | Kim, neyi, hangi koşulda yapıyor; yüklem ve gönderim tamam mı? | Girişte soru ile isim listesinin birleşmesi; “kaynakların satıcısı”; kişi yerine “saha”; `%20’i` eki; genel onay ve kayıt etiketi | Türkçe eksiltiyi yasaklamak yerine belirsiz aktör/nesne testleri; sayı eki denetimi; eylem kapsamı |
| 2 — Görev ve zihinsel model | Persona bu metni okuyunca hangi yanlış ama makul sonuca varabilir? | Hedef tarihi ile ay toplamı aynı ana ait sanılabilir; aktif toplamı hâlen ödeyenlerle karışır; “geri ödeme” yatırımcı ödemesi; “katkı” kişinin gerçek performansı sanılabilir | Tarih/ay sonu sözleşmesi; finans terim sözlüğü; karşıolgusal model ile ölçüm ayrımı; persona görevleri |
| 3 — Ölçümün ve önerinin eleştirisi | İyi görünen düzeltme hâlâ yanlış mı; puan başarısızlığı gizliyor mu? | Link genel parametreleri taşımıyor; “canlı” tek seferlik okumayı gizliyor; “plan değerine dön” seçili preset’e dön demek değil; sıfır ve kapanmama farklı; açıklama uzatmak mobilde asıl eylemi itebilir | Kopya–kayıt–paylaşım ayrımı; istenen/kullanılan kaynak; düğme+yardım ayrımı; kritik kapılar; puan ile insan kanıtını ayırma |

**Kendi önceki raporlarımın eksikliği:** UX MVP çok sayıda biçim ve test kuralı koydu. V2 ilişkileri daha iyi ele aldı; fakat Türkçe önerme yapısını, terimlerin alan modelindeki sınırını, cümleler arası bağdaşıklığı ve içerik puanlarının nasıl yanlış güven üreteceğini yeterince işletmedi. “İlişkiyi görünür yap” yönergesi, ilişkinin ne olduğunu doğru ifade etmeyen metni kendiliğinden düzeltmez. Bu belge o eksikliği kapatır; önceki raporların tamamlandığı iddiasını üretmez.

## 2. Tam olarak ne eksik? Dil bilgisi ile anlam tasarımını ayırmak

### 2.1 Zamir, sıfat, yüklem, çekim: hangisi ne zaman işe yarar?

| Öğe | Eksikliği ne zaman sorun? | Ne zaman eklemek gereksiz veya zararlı? | Bu proje için kural |
|---|---|---|---|
| Özne | İşi yapan kullanıcı mı sistem mi dış servis mi anlaşılmıyorsa | Türkçede çekimden ve bağlamdan açıkça anlaşılıyorsa her cümleye “siz” eklemek yapaydır | Özneyi görünür kılma zorunluluğu değil, tek anlamlı aktör zorunluluğu |
| Zamir | Aynı adı yinelemek okumayı zorlaştırıyorsa yakın gönderimli zamir yardımcı olabilir | “Bu”, “o”, “diğer”, “aynı” birden fazla şeye dönebiliyorsa belirsizlik artar | Zamiri silip karşılık gelen adı koy; anlam değişiyor veya seçim gerekiyorsa göndergesi açık değildir |
| Nesne / tümleç | “Sıfırla”, “kapanmıyor”, “eklenir”, “geri ödeme” neyi etkiliyor belli değilse | Başlık ve kontrol tek bir nesneyi zaten açıkça bağlıyorsa tekrar şişirebilir | Eylem + etkilenen varlık + kapsam; kritik sonuçta örtük nesne bırakma |
| Yüklem | Açıklama olması gereken yerde yalnız isim zinciri varsa ilişki kurulamaz | “Aylık abonelik fiyatı” gibi etiketin cümle olmasına gerek yok | Açıklama neden/sonuç taşıyorsa tamamlanmış önerme; etiket ad öbeği olabilir |
| Sıfat | “Yeni”, “aylık”, “toplam”, “tahmini”, “seçili” doğru kümeyi ayırıyorsa gereklidir | “Güçlü”, “verimli”, “akıllı” gibi ölçüsüz sıfatlar anlam değil vaat ekler | Ayırt eden sıfatı koru; kanıtsız değerlendirme sıfatını kaldır |
| Çekim | İyelik, durum, zaman ve koşul ekleri ilişkileri yanlış kuruyorsa | Bütün isimleri fiilleştirmek veya doğal Türkçeyi İngilizce sıraya çevirmek gerekmez | Ekin taşıdığı aktör, nesne, zaman ve koşul rolünü denetle |
| Bağlaç | Sonuç, neden, karşıtlık ve istisna ilişkisinin kurulması gerekiyorsa | Arka arkaya “ve” koymak bağımsız görevleri tek cümlede sıkıştırır | Bağlaç sayısını değil, temsil ettiği gerçek ilişkiyi denetle |

Örnek: “Hem işveren maliyeti hem kapasite; Sheets kaynağında da eklenir.” Burada birkaç ek veya zamir değil, **ne eklendiği, hangi hesaba eklendiği, ne zaman eklendiği ve dış dosyanın değişip değişmediği** eksik. “Bu da eklenir” daha kısa ama daha kapalıdır.

### 2.2 Kısalık, akıcılık, okunabilirlik ve anlaşılabilirlik aynı şey değil

- **Okunabilirlik:** harfleri, sözcükleri ve satırları ayırt edebilme. 14 px tabanı, kontrast ve doğal sarım bunu destekler; doğru anlamayı kanıtlamaz.
- **Dilsel akıcılık:** cümlenin doğal Türkçe olarak izlenebilmesi. Akıcı bir yanlış hesap açıklaması yine yanlıştır.
- **Anlaşılabilirlik:** doğru zihinsel modeli kurup kendi sözcükleriyle anlatabilme. “Geri ödeme” kolay okunur; neyin geri ödendiği bilinmeyebilir.
- **Eyleme geçirilebilirlik:** sonraki adımı ve sonucunu doğru seçebilme. “Kaydedildi” anlaşılır görünebilir; nereye kaydedildiği eksikse yanlış davranış doğurur.

Bir cümleyi ikiye bölmek, aralarındaki neden/koşul bağını kaybettiriyorsa iyileştirme değildir. Tersine, on kısa kopuk cümle tek düzenli paragraftan daha yüksek ilişki kurma yükü yaratabilir. “Kaç cümle?” yerine **kaç yeni kavram, kaç bağımlılık, kaç belirsiz gönderim ve kaç karar** sorulmalıdır. Bu proje için katı kelime/cümle limiti konmaz. Uzun cümle, çoklu parantez veya sembol yoğunluğu inceleme işaretidir; otomatik ret nedeni değildir.

Türkçe eklemeli yapı nedeniyle kelime uzunluğu tek başına güçlük değildir. İngilizce okunabilirlik sınırlarını veya bir formülün okul düzeyini UI etiketlerine doğrudan uygulamak doğru olmaz. Bu rapor Türkçe okunabilirlik formülü hesaplamadı; herhangi bir okul düzeyine uygunluk iddia etmez. “Herkes anlasın” hedefi; herkesin aynı ön bilgiye sahip olduğu veya tek bir cümlenin bütün ihtiyaçları karşılayacağı iddiasına çevrilmemelidir. Amaç, ön bilgiye bağımlılığı azaltmak ve gerektiğinde erişilebilir açıklama sağlamaktır.

### 2.3 Dört ana bozukluk

**Anlamsal sıkıştırma:** “Tam kapasite, elde tutma %70, her 6 ayda +1 saha.” Teknik not olarak kullanılabilir; ilk kez gelenin anlaması için kapasitenin bazını, kimlerin elde tutulduğunu ve eklenenin kişi olduğunu açmak gerekir.

**Etiket çakışması:** “Net”, “gelir”, “aktif”, “kaynak”, “geri ödeme” gündelik, muhasebesel ve model içi anlamları farklı sözcüklerdir. Sözlük bağlantısı yetmez; karar anında doğru anlam etkinleşmelidir.

**İddia düzeyi kayması:** Modelde “o kanal çıkarılırsa sonuç ne olur” hesabı, gerçekleşmiş katkının ölçümü değildir. Bir hedefe 10 kişinin ulaşması sistemin kurulduğunu tek başına kanıtlamaz. “Tahmin”, “varsayım” ve kapsam sözcükleri süs değildir.

**Bağlam borcu:** Cümleyi kısaltmak için atılan dönem, birim, nesne ve kaynak bilgisi okuyucunun belleğine yüklenir. Masaüstünde başlıktan tamamlanan bilgi mobil accordion’da veya CSV’de kaybolur. Aynı veri, farklı kabukta aynı anlamı korumalıdır.

## 3. Persona temelli sözleşme: 40 ayrı ihtiyaç, tek ortak anlaşılır dil

Bunlar araştırmada görüşülmüş gerçek kişiler değil, **sentetik test profilleridir**. Yaş, eğitim, meslek veya engel üzerinden zekâ ve başarı varsayımı yapılmaz. Aynı insan gün içinde birkaç profile girebilir. Her profile ayrı uygulama veya ayrı dil sürümü yapılmaz; ortak metin temel ihtiyacı karşılar, ayrıntı görev noktasında açılır. Profesyonel kullanıcı da alan modelini bilmeyebilir; az deneyimli kullanıcı da doğru karar verebilir.

Tablodaki soru moderatörün vereceği cevabı ima etmeden sorulmalıdır. Sağ sütun kelimesi kelimesine ezber beklentisi değil, yanıtın taşıması gereken anlamdır. Her profil en az bir temsilî görevle eşleşir; 40 gerçek katılımcı veya 40×32 test yapıldığı iddia edilmez.

| ID | Profil / ihtiyaç | Koşul | Metinler | Anlama sorusu | Beklenen anlam |
|---|---|---|---|---|---|
| P01 | İlk kez gelen işletme sahibi | Finans terimlerine yabancı | C01 C09 | Bu ekran geçmişi mi geleceği mi gösteriyor? | Koşullu gelecek tahmini olduğunu söylemeli |
| P02 | Yeni başlayan satışçı | Üye ile müşteri aynı sanılıyor | C05 C06 | 100 aktif hâlen 100 ödeyen demek mi? | İlk ödeme yapan toplam ile devam edenleri ayırmalı |
| P03 | Deneyimli saha uzmanı | Şirketin modelini bilmiyor | C03 C07 | Bir saha neyi ifade ediyor? | Kişi ve eklenme başlangıcını söylemeli |
| P04 | Finans yöneticisi | Tahakkuk ve tahsilatı ayırır | C09 C10 | Yıllık ödemenin tümü hangi ayda? | Modelin ilk ay peşin tutarı saydığını bilmeli |
| P05 | Muhasebe asistanı | Yeni şirkette terimler yabancı | C11 C16 | Net hangi giderlerden sonra? | Dahil ve hariç kalemleri ayırmalı |
| P06 | Yatırımcı | Sunum ekranında az zamanı var | C10 C11 | Geri dönen kendi yatırımı mı? | Modelde birikmiş açığın kapanması olduğunu söylemeli |
| P07 | Operasyon sorumlusu | Kadro ve reklamı birlikte düşünür | C07 C13 | İkinci kişi ve reklam gideri nereden ekleniyor? | Aynı maliyetin iki kez sayılıp sayılmadığını sorgulamalı |
| P08 | Pazarlama uzmanı | LTV terimini biliyor model tanımını bilmiyor | C24 C15 | LTV hesaplanırken marj var mı? | Yalnız terim açılımı yetmez; model tanımını istemeli |
| P09 | İK uzmanı | Gelir projeksiyonu tecrübesi yok | C15 C29 | Dolaylı rolün geliri sıfır mı? | Modelde doğrudan atıf yapılmadığını söylemeli |
| P10 | Yönetici asistanı | Toplantı sırasında seçim yapıyor | C18 C19 | Sıfırlama hangi ayarları siler? | Sayfa seçenekleri ve genel parametreleri ayırmalı |
| P11 | Türkçeyi ikinci dil olarak kullanan | Ek ve eksiltilerde zorlanıyor | C02 C23 | Kaynakların satıcısı kim? | Kanal başına kazanılan satıcıyı anlatabilmeli |
| P12 | Okumaya az zaman ayıran kullanıcı | Uzun paragrafı atlıyor | C01 C14 | İlk seçimim ne? | Hazır senaryo seçimini bulmalı |
| P13 | Okuma güçlüğü yaşayan kullanıcı | Sembol zinciri takip etmek zor | C24 C13 | × ve ÷ neyi karşılaştırıyor? | Düz cümleyle aynı hesabı anlatmalı |
| P14 | Dikkati kolay bölünen kullanıcı | Kesintiden sonra geri dönüyor | C18 C26 | Şimdi hangi senaryodayım? | Adı kapsamı ve değişen seçenekleri bulmalı |
| P15 | Çalışma belleği sınırlanan kullanıcı | Birden fazla koşulu tutmak zor | C03 C07 | Her 6 ayda artış nereden başlıyor? | Başlangıç ve üst sınırı aynı yerde bulmalı |
| P16 | Ekran okuyucu kullanan | Tablo görsel ilişkisi yok | C08 C30 | Bu tutar hangi ay ve satıra ait? | Satır başlığı dönem birim birlikte okunmalı |
| P17 | Az gören ve büyüten kullanıcı | 200% metin veya400%zoom | C12 C30 | Yardım metni etiketten kopuyor mu? | Aynı ilişkiyi büyütmede izlemeli |
| P18 | Yalnız klavye kullanan | Açıklama hovera bağlı olamaz | C20 C24 | Açıklamaya nasıl ulaşırım? | Klavye erişilebilir yardım yolu bulmalı |
| P19 | 320px telefon kullanan | Dar alanda karşılaştırma | C12 C26 | İki senaryo aynı dönem mi? | Açıp kapatırken dönem kaybolmamalı |
| P20 | Telefonu yatay çeviren | Kabuk değişirken devam ediyor | C18 C30 | Seçimim değişti mi? | Durum ve odak korunmalı |
| P21 | Tek elle kullanan | Kısa anda işlem yapıyor | C19 C20 | Kopyala bağlantıyı gönderir mi? | Yalnız panoya kopyaladığını söylemeli |
| P22 | Yavaş ağdaki kullanıcı | Veri gecikiyor | C16 C17 | Şu an kullanılan gider hangisi? | İstenen ve kullanılan kaynağı ayırmalı |
| P23 | Depolaması kapalı kullanıcı | Kalıcı kayıt yok | C21 | Sekmeyi kapatınca ne olur? | Değişikliğin kaybolacağını bilmeli |
| P24 | Paylaşılan bağlantıyı açan | Önceki tarayıcı ayarları farklı | C19 C26 | Bu sonuç arkadaşımınkiyle aynı mı? | Genel parametre ve veri kaynağı bağımlılığını sorgulamalı |
| P25 | Eski bağlantıya dönen | Kaynak zamanla değişmiş | C16 C27 | Aynı URL aynı veriyi garanti eder mi? | Kaynak sürümü ayrı olduğunu söylemeli |
| P26 | Sunum dinleyicisi | Kontrol kendisinde değil | C09 C11 | Negatif fon iyi mi kötü mü? | Gerekli finansmanı işaretinden bağımsız anlatmalı |
| P27 | CSV inceleyen uzman | Ekran bağlamı yok | C30 C32 | Gelir sütununun dönemi nedir? | Dosyada da birim dönem tanımı bulunmalı |
| P28 | Yüzde hesabında zorlanan | Yüzde puanı bilmiyor | C04 C25 | 70ten80e artış ne kadar? | 10yüzde puan ile yaklaşık14,3% farkı ayırmalı |
| P29 | İstatistik bilen kullanıcı | Medyan teknik anlam taşır | C14 | Dağılımın medyanı hesaplanmış mı? | Senaryo adı ile istatistiksel tahmini ayırmalı |
| P30 | Şirket kısaltmalarını bilmeyen | CRM Segika YZ yabancı | C23 C29 | Hangi ekip hangi işi yapıyor? | Özel ad rol ve kısaltmayı ayırmalı |
| P31 | Yorgun akşam kullanıcısı | Çift olumsuzluğu kaçırıyor | C28 | Kapanmıyor ifadesi kesin mi? | Ufukta hesaplanmadı ile imkansızı ayırmalı |
| P32 | Hata yaptıktan sonra kaygılı kullanıcı | Veri kaybından korkuyor | C18 C20 | Tekrar deneyince ne silinir? | Kapsam ve korunacak girdiler doğrulanmalı |
| P33 | Uzman hızlı tarayıcı | Her alan için uzun açıklama istemez | C06 C24 | Tanımı biliyorsam yardımı kapatabilir miyim? | Temel bağlam kalıp ayrıntı açılabilmeli |
| P34 | Farklı sektörden yönetici | Satıcı ve temsilciyi karıştırıyor | C05 C07 | Satıcı kazanılan müşteri mi çalışan mı? | Ürün aboneliği müşterisiyle satış personelini ayırmalı |
| P35 | Yuvarlanmış rapor alan | Tam sayıya güveniyor | C25 C31 | 0,4 kişi gerçek çalışan mı? | Beklenen adet hesaplaması olduğunu söylemeli |
| P36 | Gider verisini güncelleyen | Sheets kaydettiğini düşünüyor | C16 C21 | Sitede değişiklik Sheets dosyasını değiştirir mi? | Okuma ve yerel ayarı ayırmalı |
| P37 | Yeni işe giren geliştirici | Alan modelini henüz bilmiyor | C09 C15 | Metin iyileştirirken formülü değiştirebilir miyim? | Metin önerisi ile model kararı ayrımını korumalı |
| P38 | İçerik editörü | Kısaltma baskısı altında | C01 C02 | Hangi kelimeyi silmemeliyim? | Aktör nesne birim koşul ve sonucu korumalı |
| P39 | Raporu onaylayan yönetici | Yüksek puanı yeterli sanıyor | C31 C32 | 90puan varsa yayımlar mıyız? | Kritik anlam kapısını ayrıca kontrol etmeli |
| P40 | Farklı ayda tekrar kullanan | Tarihleri ezberden biliyor | C08 C22 | 17Mart hangi yıl ve hangi senaryo? | Dinamik tarih bağlamını söylemeli |

### 3.1 Persona kurallarını metne dönüştürmek

**MUST:** Finans alanını bilmeyen için tanım; uzman için hesap sınırı; ekran okuyucu için bağımsız adlandırma; kesintiye uğrayan için görünür bağlam; hata yapan için uygulanabilir toparlanma yolu korunur. Bir grubun ihtiyacını diğerinin metnini saklayarak çözme. Kritik uyarı, “uzman zaten bilir” diye gizlenmez.

**SHOULD:** İlk satır karar bilgisini, ikinci katman tanımı ve bir sayısal örneği, üçüncü katman formül/kaynak/istisnayı taşısın. Bu katmanlar zorunlu üç paragraf değildir; basit bir alan tek etikette yeterli olabilir. Kullanıcıya otomatik “acemi/uzman” etiketi atama, hassas profil tahmini veya engel sınıflandırması yapma.

**MAY:** “Hesap nasıl yapılıyor?” ayrıntısı açılabilir. Kullanıcı yalnız bu ayrıntıyı açmadığı için temel para anlamını, kayıt kapsamını veya kritik hata sonucunu kaçırmamalıdır.

Persona çatışmasını çözme örneği: P04 muhasebe ayrıntısı ister, P12 hızlı karar ister. “Kümülatif gelir”i 80 kelimelik etikete çevirmek ikisine de zarar verir. Ana etiket “Başlangıçtan bu ay sonuna kadar toplam ödeme”; yakın yardım “Yıllık peşin ödeme, ödendiği ayda bütünüyle sayılır”; formül ayrı ayrıntıdır. P16 aynı ilişkileri görsel konuma ihtiyaç duymadan okuyabilmelidir.

## 4. Puanlama: 240 bağımsız kriter, ortalama ve ortalamanın sınırı

### 4.1 Neyi puanladım?

İki ölçek var ve birbirinin yerine sunulamaz:

1. **Küme denetimi:** C01–C32’nin birlikte taşıdığı içerik sistemi, 24 boyut × 10 kriter = **240 ayrı uzman puanı** ile değerlendirilir. Aşağıdaki katalog her kriterin ayrı değerini içerir. Kaynak işaretleri örnek kanıttır; aynı sorun birçok yerde görülebilir. Bu, bütün site puanı değildir.
2. **İfade karşılaştırması:** Her C kaydı, **aynı 12 çekirdek soruyla** ayrıca değerlendirilir. Böylece 32 ifade arasında kıyas kurulabilir. 240 kriterin her birinin her kısa etikete uygulanıp 7.680 bağımsız değerlendirme yapıldığı iddia edilmez. Her ifadeye 240 değer uydurmak kapsamı artırmaz, sahte kesinlik yaratır.

Puanlar gerçek kullanıcı başarısı, olasılık, bilimsel ölçek veya otomatik dil sınıflandırması değildir. Gerekçeli uzman ön değerlendirmesidir. Sayısal hassasiyet raporlama kolaylığı içindir; 1 puanlık farkın anlamlı olduğu kanıtlanmış değildir. Mevcut örneklem sorun odaklı seçildi; iyi çalışan metinlerin oranını veya sitenin genel kalitesini tahmin etmeye uygun değildir.

### 4.2 Ortak 0–4 çıpaları

| Puan | Karar | Gerekli kanıt |
|---:|---|---|
| 0 | Yanlış veya kritik bilgi yok | Makul yorum yanlış işlem/hesap sonucu üretir; kaynakla açık çelişki vardır |
| 1 | Ağır eksik | İki makul anlam vardır veya temel kapsamı tahmin etmek gerekir |
| 2 | Kısmen yeterli | Yakın çevrede ipucu vardır, fakat önceki bilgi veya ek çıkarım gerekir |
| 3 | Açık ve kaynakla uyumlu | İncelenen bağlamda temel anlam tamam; sınır varyantı/insan doğrulaması henüz yok |
| 4 | Kapsamlı içerik kanıtı | İncelenen kaynak ve ilgili varyantlar aynı anlamı koruyor; yine insan testi yerine geçmez |

Her kriter olumlu koşul olarak yazıldı. Eksik zorunlu bilgi **0** alır; “yok” diye N/A yapılamaz. Gerçekten uygulanamaz bir koşul varsa **N/A + gerekçe** yazılır ve paydaya girmez. İnceleme yapılmadıysa **U (unknown)** yazılır; bu da başarı değildir. N/A ve U sayıları ayrı raporlanır. Bu pilotun küme kriterleri, ifade tek başına değil ilgili görev zinciri üzerinden uygulanmıştır; katalogda 240 sayısal değer vardır. Henüz gözlenmeyen cihaz/durum davranışları bu değerlere dayanılarak PASS ilan edilemez.

“4” genel kapsamlı test başarısı değildir: örneğin kullanıcıya küçümseyici hitap bulunmaması içerik üzerinden yüksek güvenle değerlendirilebilir; ekran okuyucu kullanılabilirliği ise kaynak düzeyi ipucuyla sınırlıdır. İkinci türde yüksek puan vermek için erişilebilir ad/ilişki ve ilgili durum kanıtı gerekir. Belirsizlikte puanı yükseltmek yerine U kullan; yeni denetim bu pilotun sayılarını değiştirebilir.

### 4.3 Hesap

Kriter puanı `s∈{0,1,2,3,4}`. Boyutun bilinen ve uygulanabilir kriter kümesi `K_d`:

```text
boyut[d] = 100 × sum(s[d,k]) / (4 × len(K_d))
ana_puan = sum(boyut[d]) / bilinen_boyut_sayısı
mikro_puan = 100 × tüm_bilinen_puanlar_toplamı / (4 × bilinen_kriter_sayısı)
kapsama = bilinen_uygulanabilir / (bilinen_uygulanabilir + U)
```

Ana puan **boyutların eşit ağırlıklı aritmetik ortalamasıdır**. Bu pilotta her boyutta 10 puan olduğundan mikro ve makro ortalama aynıdır. İleride N/A dağılımı değişirse ikisini birlikte göster. Hiç kriteri değerlendirilmeyen boyut ana ortalamadan çıkar ama eksik boyut sayısı görünür; yeterli kapsam olmadan genel sonuç yayımlama. Başlangıç politika önerisi: her zorunlu boyut değerlendirilsin, kapsam en az %90 olsun. Bu oran araştırma standardı değil, değiştirilebilir proje kapısıdır.

“Bağımsız kriter”, ayrı puanlanan denetim sorusu demektir; istatistiksel bağımsızlık iddiası değildir. Boyutlar arasında ilişki olması beklenir; bu 240 maddenin doğrulanmış bir psikometrik ölçek olduğu anlamına gelmez. Aynı hatanın farklı etkileri ayrı değerlendirilebilir; aynı soruyu farklı adlarla çoğaltıp ağırlığını büyütme. Örneğin “yüzdenin paydası” sayısal anlam, “%20’si ekinin doğruluğu” biçimbilim, “bu oran”ın hangi alana döndüğü gönderimdir. Bunlar aynı hata değildir. Buna karşılık “kısa mı / öz mü / gereksiz uzun değil mi” diye üç eş soru açmak yasaktır. Yeni kriter eklenince eski puanı yeni ölçekle karşılaştırmak için eski örneklem de yeniden puanlanır.

**Ayrıca persona-görev sonucu:** Gerçek testte her görev için anlama yanıtı 0 yanlış / 1 kısmi / 2 doğru, eylem 0 yanlış / 1 yardımla / 2 bağımsız kaydedilir. Bunların ortalaması uzman içerik puanına karıştırılmaz. Persona bazında ortalama, en düşük görev, başarısız kişi sayısı ve örneklem büyüklüğü ayrıca gösterilir. Az sayıda kişinin bulgusuna yüzdelik başarı kesinliği yükleme.

### 4.4 Ortalama kritik anlam hatasını telafi edemez

Ham ana puan her durumda gösterilir; fakat yayın kararı ayrı bir durumdur. “Puanı tavana kırptık” deyip ham ortalamayı gizleme. Aşağıdakilerden biri varsa **BLOCKED**:

- Model tahmini gerçekleşmiş sonuç veya garanti gibi sunuluyor.
- Para anlamı, dönem, işaret ya da payda kritik kararı tersine çeviriyor.
- Kullanılan kaynak bilinmiyor veya yedek kaynak gerçek kaynak gibi gösteriliyor.
- Kayıt, paylaşım veya sıfırlama kapsamı yanlış anlaşılıp veri kaybı/yanlış güven doğuruyor.
- Görünür metin ile erişilebilir ad farklı eylem söylüyor.
- Sadeleştirme hesap tanımını değiştiriyor veya doğrulanmamış bilgi ekliyor.

Kapı değerlendirmesi `geçti / kaldı / bilinmiyor` ve C kimliğiyle kaydedilir. Pilot durum: **iyileştirme gerekli; yayın yeterliliği NOT_VERIFIED**. C08–C11, C16, C18–C21 anlam kapıları için öncelikli; bu, mevcut sürümün yayınını teknik olarak durdurduğumuz anlamına gelmez. Bu rapor CI veya onay sistemi kurmadı.

### 4.5 240 kriterin açık kataloğu ve mevcut puanları

Her satır ayrı bir kriterdir. Boyut başlığındaki C kimlikleri, o boyutun örnek kanıtlarını gösterir. Puan, bu belgenin kaynak ve içerik bağlamı sınırında verilmiştir. Sadece bir başlığı puanlayıp bütün boyuta aynı puanı kopyalamadım; aşağıdaki vektörler bütün değerleri açıkça taşır.

#### D01 — Anlamın çekirdeği · 57.5/100 · kanıt: C01 C02 C06

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D01.01 | Kimden söz edildiği | 2 |
| D01.02 | Neyin ölçüldüğü | 2 |
| D01.03 | Eylemin ne olduğu | 2 |
| D01.04 | Eylemin nesnesi | 2 |
| D01.05 | Sonucun ne olduğu | 3 |
| D01.06 | İşlem ile açıklama ayrımı | 2 |
| D01.07 | Asıl soruya doğrudan yanıt | 2 |
| D01.08 | Yan anlamın baskın olmaması | 3 |
| D01.09 | Tamamlanmış önerme | 2 |
| D01.10 | Başlık ile açıklama uyumu | 3 |

#### D02 — Türkçe sözdizimi · 57.5/100 · kanıt: C01 C03 C07

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D02.01 | Yüklem gerektiği yerde mevcut | 2 |
| D02.02 | Yüklemin istemi tamam | 3 |
| D02.03 | Özne yüklem uyumu | 2 |
| D02.04 | Nesne durum eki doğru | 3 |
| D02.05 | Tamlayan tamlanan bağı açık | 2 |
| D02.06 | Sıfatın bağlandığı ad açık | 3 |
| D02.07 | Zarfın kapsamı açık | 2 |
| D02.08 | Yan cümlenin ana cümle bağı açık | 2 |
| D02.09 | Eksilti bağlamdan tek biçimde tamamlanır | 1 |
| D02.10 | Edilgenlik sorumluyu gizlemez | 3 |

#### D03 — Gönderim ve bağdaşıklık · 47.5/100 · kanıt: C02 C04 C08

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D03.01 | Bu sözcüğünün göndergesi açık | 2 |
| D03.02 | O sözcüğünün göndergesi açık | 2 |
| D03.03 | Aynı sözcüğünün kıyası açık | 2 |
| D03.04 | Diğer sözcüğünün kümesi açık | 1 |
| D03.05 | Burada ifadesinin kapsamı açık | 2 |
| D03.06 | Önceki ifadesinin başlangıcı açık | 1 |
| D03.07 | Kısaltılmış adın tam karşılığı bulunur | 2 |
| D03.08 | Başlık taşınınca gönderim korunur | 3 |
| D03.09 | Paragraflar arasında konu bağı var | 2 |
| D03.10 | Ad tekrarından kaçınma anlam kaybettirmez | 2 |

#### D04 — Terimlerin sınırı · 37.5/100 · kanıt: C05 C06 C09 C10 C11 C15

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D04.01 | Aktif terimi tanımlı | 2 |
| D04.02 | Üye ile ödeme yapan ayrılır | 1 |
| D04.03 | Gelir ile tahsilat ayrılır | 1 |
| D04.04 | Net hangi işlemden çıktığını söyler | 1 |
| D04.05 | Başabaş türü belli | 1 |
| D04.06 | Geri ödemenin nesnesi belli | 2 |
| D04.07 | Katkı model tanımı belli | 1 |
| D04.08 | Kapasitenin referansı belli | 2 |
| D04.09 | Kaynak veri ve satış kanalı ayrılır | 2 |
| D04.10 | Aynı kavram aynı adla anılır | 2 |

#### D05 — Bilgi sırası · 55.0/100 · kanıt: C01 C12 C14

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D05.01 | İlk cümle amacı söyler | 2 |
| D05.02 | Sonuç ayrıntıdan önce bulunur | 3 |
| D05.03 | Koşul sonucu açıklamadan önce bilinir | 2 |
| D05.04 | Tanım ilk ihtiyaçta bulunur | 2 |
| D05.05 | Örnek tanıma yakın | 2 |
| D05.06 | İstisna etkilediği iddiaya yakın | 2 |
| D05.07 | Adımlar işlem sırasını izler | 2 |
| D05.08 | Başlık içerik için tahmin kurdurur | 2 |
| D05.09 | Karar bilgisi dipnota saklanmaz | 3 |
| D05.10 | Ayrıntı ana yolu kesmez | 2 |

#### D06 — Önerme yoğunluğu · 47.5/100 · kanıt: C01 C03 C13

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D06.01 | Bir blok tek görev taşır | 2 |
| D06.02 | Bağımsız önermeler ayrılır | 2 |
| D06.03 | İlişkili önermeler koparılmaz | 2 |
| D06.04 | Noktalı virgül zinciri sınanır | 2 |
| D06.05 | Parantez ana iddiayı taşımaz | 1 |
| D06.06 | Sembol dizisi cümle yerine geçmez | 1 |
| D06.07 | Gereksiz tekrar azaltılır | 3 |
| D06.08 | Gerekli bağlaç korunur | 2 |
| D06.09 | Liste aynı tür öğeler içerir | 2 |
| D06.10 | Kısaltma okuma yükünü gerçekten azaltır | 2 |

#### D07 — Sayı ve birim · 42.5/100 · kanıt: C03 C04 C11 C13 C25

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D07.01 | Paranın birimi görünür | 3 |
| D07.02 | Kişi ile satıcı ayrılır | 2 |
| D07.03 | Aylık ile toplam ayrılır | 2 |
| D07.04 | Yüzdenin paydası belli | 1 |
| D07.05 | Çarpanın baz değeri belli | 1 |
| D07.06 | Yüzde puan ile yüzde ayrılır | 1 |
| D07.07 | İşaretin iş anlamı açık | 1 |
| D07.08 | Yuvarlama anlamı değiştirmez | 2 |
| D07.09 | Ondalık kişi tahmin olarak açıklanır | 2 |
| D07.10 | Büyük sayı kısaltmasının karşılığı var | 2 |

#### D08 — Zaman ve ufuk · 45.0/100 · kanıt: C08 C12 C17 C28

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D08.01 | Tarihin yılı gerektiğinde var | 2 |
| D08.02 | Başlangıç tarihi belli | 2 |
| D08.03 | Bitiş tarihi belli | 2 |
| D08.04 | Hedef tarihi ile ay sonu ayrılır | 1 |
| D08.05 | İlk satış ayı ile takvim ayı ayrılır | 1 |
| D08.06 | Yenilemenin ay aralığı belli | 1 |
| D08.07 | Projeksiyon ufku dışı işaretli | 2 |
| D08.08 | Tarihe ulaşamama ile bilinmeme ayrılır | 2 |
| D08.09 | Saatin ait olduğu olay belli | 2 |
| D08.10 | Takvim değişince metin değişir | 3 |

#### D09 — Karşılaştırma · 57.5/100 · kanıt: C14 C18 C26

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D09.01 | Kıyasın baz senaryosu belli | 2 |
| D09.02 | Kıyasın metriği aynı | 3 |
| D09.03 | Kıyasın dönemi aynı | 2 |
| D09.04 | Kıyasın birimi aynı | 3 |
| D09.05 | Değişen girdiler söylenir | 2 |
| D09.06 | Sabit tutulanlar anlaşılır | 2 |
| D09.07 | Artışın iyi veya kötü oluşu açıklanır | 2 |
| D09.08 | Fark yönü açık | 2 |
| D09.09 | Yüzde farkın paydası açık | 2 |
| D09.10 | Özel senaryo hazır senaryodan ayrılır | 3 |

#### D10 — Nedensellik ve model · 47.5/100 · kanıt: C09 C10 C15 C16

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D10.01 | Tahmin gerçekleşenden ayrılır | 2 |
| D10.02 | Birliktelik neden gibi sunulmaz | 1 |
| D10.03 | Karşıolgusal katkı açık | 2 |
| D10.04 | Varsayım ölçümden ayrılır | 2 |
| D10.05 | Sabit kabul edilen davranış açıklanır | 2 |
| D10.06 | Hedef gerçekleşme garantisi değildir | 1 |
| D10.07 | Modelin dışladıkları söylenir | 2 |
| D10.08 | Sonuç koşullu ifade edilir | 2 |
| D10.09 | İstisna genelleme yapmaz | 2 |
| D10.10 | Model formülü metinle çelişmez | 3 |

#### D11 — Kaynak ve güven · 47.5/100 · kanıt: C16 C17 C27

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D11.01 | İstenen kaynak belli | 2 |
| D11.02 | Kullanılan kaynak belli | 2 |
| D11.03 | Yedek kaynağa geçiş belli | 2 |
| D11.04 | Okuma zamanı hesap zamanından ayrılır | 2 |
| D11.05 | Canlı ifadesi tazelikle uyumlu | 1 |
| D11.06 | Kısmi veri tam veri gibi sunulmaz | 1 |
| D11.07 | Veri yok sıfır değildir | 2 |
| D11.08 | Kaynak hatası sonuç yanında | 3 |
| D11.09 | Harici veri ile yerel ek ayrılır | 2 |
| D11.10 | Kaynak etiketi sunumda kalır | 2 |

#### D12 — Girdi ve etki · 47.5/100 · kanıt: C04 C07 C13 C18

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D12.01 | Alan hangi varlığı değiştirir | 2 |
| D12.02 | Birim alanla bağlı | 2 |
| D12.03 | Seçeneklerin anlamı açık | 3 |
| D12.04 | Varsayılan ile seçili ayrılır | 2 |
| D12.05 | Değişiklik kapsamı açık | 2 |
| D12.06 | Etkilenen hesap belirtilir | 2 |
| D12.07 | Anında değişim ile kayıt ayrılır | 1 |
| D12.08 | Bağımlı alanlar açıklanır | 2 |
| D12.09 | Sınır değerin anlamı belli | 2 |
| D12.10 | Örnek giriş mevcut | 1 |

#### D13 — Eylem etiketleri · 52.5/100 · kanıt: C18 C19 C20

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D13.01 | Fiil gerçek eylemi söyler | 3 |
| D13.02 | Eylemin nesnesi söylenir | 2 |
| D13.03 | Bağlantı hedefi tahmin edilir | 3 |
| D13.04 | Aç ve kapat durumu uyumlu | 3 |
| D13.05 | Kopyalamak paylaşmak sayılmaz | 2 |
| D13.06 | Sıfırlama kapsamı söylenir | 1 |
| D13.07 | Geri alma olanağı açıklanır | 2 |
| D13.08 | Benzer düğmeler ayırt edilir | 2 |
| D13.09 | Eylem sonucu etiketiyle uyumlu | 2 |
| D13.10 | Kritik işlem onayı özgül | 1 |

#### D14 — Durum ve geri bildirim · 47.5/100 · kanıt: C17 C19 C21

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D14.01 | Ne oldu anlaşılır | 2 |
| D14.02 | Hangi öğeye oldu anlaşılır | 3 |
| D14.03 | Ne zaman oldu anlaşılır | 2 |
| D14.04 | İşlem devam ediyor mu belli | 2 |
| D14.05 | Başarı gerçek işlemle sınırlı | 1 |
| D14.06 | Kayıt yeri belli | 1 |
| D14.07 | Süreklilik süresi belli | 2 |
| D14.08 | Sonraki adım belli | 2 |
| D14.09 | Hata sonrası giriş korunması açık | 2 |
| D14.10 | Mesaj kaybolmadan erişilebilir | 2 |

#### D15 — Hata ve toparlanma · 57.5/100 · kanıt: C17 C20 C27

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D15.01 | Başarısız işlem adlandırılır | 3 |
| D15.02 | Neden biliniyorsa söylenir | 2 |
| D15.03 | Bilinmeyen neden uydurulmaz | 3 |
| D15.04 | Kullanıcı suçlanmaz | 2 |
| D15.05 | Düzeltme eylemi mümkün | 3 |
| D15.06 | Teknik ayrıntı ana mesajı boğmaz | 2 |
| D15.07 | Tekrar denemenin etkisi belli | 2 |
| D15.08 | Boş durum hata sayılmaz | 2 |
| D15.09 | Sonucun güvenilirliği açıklanır | 2 |
| D15.10 | Destek yolu bağlama uygun | 2 |

#### D16 — Türkçe biçimbilim ve yazım · 57.5/100 · kanıt: C03 C22 C23

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D16.01 | Sayı eki okunuşa uygun | 2 |
| D16.02 | Yüzde eki doğru | 1 |
| D16.03 | Birim eki anlaşılır | 2 |
| D16.04 | İyelik kişi ilişkisi doğru | 3 |
| D16.05 | Çoğul tekil anlamı doğru | 2 |
| D16.06 | Zaman kipi iddia düzeyiyle uyumlu | 3 |
| D16.07 | Koşul eki sonucu kapsar | 2 |
| D16.08 | Olumsuzluk yanlış yere bağlanmaz | 2 |
| D16.09 | Noktalama mantıksal grubu korur | 2 |
| D16.10 | Türkçe harfler doğru | 4 |

#### D17 — Örnek ve öğretim · 42.5/100 · kanıt: C05 C13 C24

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D17.01 | Örnek gerçek kavramı açıklar | 1 |
| D17.02 | Örnek sayısal olarak doğru | 2 |
| D17.03 | Örneğin temsili olduğu belirtilir | 2 |
| D17.04 | Karşı örnek sınırı gösterir | 1 |
| D17.05 | Terim açıklaması eyleme yeterli | 1 |
| D17.06 | Ön bilgi açıklaştırılır | 2 |
| D17.07 | İlk kullanım açıklanır | 2 |
| D17.08 | Uzman ayrıntısı erişilebilir | 1 |
| D17.09 | Örnek güncel değere bağımlıysa üretilir | 2 |
| D17.10 | Örnek asıl görevi kesmez | 3 |

#### D18 — Ton ve saygı · 82.5/100 · kanıt: C15 C23 C29

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D18.01 | Kullanıcıya küçümseme yok | 4 |
| D18.02 | Aşırı samimiyet yok | 4 |
| D18.03 | Tehdit veya utandırma yok | 4 |
| D18.04 | Kesinlik kanıtla orantılı | 2 |
| D18.05 | Basitlik çocuklaştırma değildir | 3 |
| D18.06 | İç jargon kullanıcıya taşınmaz | 4 |
| D18.07 | Belirsiz iyimser vaat yok | 3 |
| D18.08 | Başarı abartılmaz | 3 |
| D18.09 | Yargı yerine açıklama var | 3 |
| D18.10 | Hitap tutarlı | 3 |

#### D19 — Görsel dil ilişkisi · 62.5/100 · kanıt: C08 C12 C16 C30

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D19.01 | Etiket değeriyle yakın | 3 |
| D19.02 | Açıklama kontrolüne yakın | 2 |
| D19.03 | Birim kopunca tekrar var | 2 |
| D19.04 | Renk tek anlam taşıyıcısı değil | 3 |
| D19.05 | Başlık satır grubunu açıklar | 2 |
| D19.06 | Boşluk anlam grubunu ayırır | 3 |
| D19.07 | Benzer görünüm benzer anlam taşır | 2 |
| D19.08 | Uyarı etkilediği sonuçla ortak bölgede | 2 |
| D19.09 | Gizlenen içerik başlığı yeterli | 3 |
| D19.10 | Okuma sırası görsel sırayla uyumlu | 3 |

#### D20 — Dar ekran bağlamı · 57.5/100 · kanıt: C08 C12 C26 C30

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D20.01 | 320de gerekli bağlam görünür | 3 |
| D20.02 | Açılır kayıt özeti ayırt edilir | 2 |
| D20.03 | Tablodan kayda birim taşınır | 3 |
| D20.04 | Dönem bilgisi kaybolmaz | 2 |
| D20.05 | Kaynak durumu kaybolmaz | 2 |
| D20.06 | Kıyas gerekli bilgiyi birlikte sunar | 2 |
| D20.07 | Tooltip tek açıklama yolu değil | 2 |
| D20.08 | Metin kırpılması anlam silmez | 3 |
| D20.09 | Uzun etiket doğal sarılır | 2 |
| D20.10 | Kısalık uğruna nesne silinmez | 2 |

#### D21 — Erişilebilir metin · 57.5/100 · kanıt: C13 C20 C24 C30

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D21.01 | Görünür ad erişilebilir ada dahil | 3 |
| D21.02 | Kontrol amacı addan anlaşılır | 2 |
| D21.03 | Başlık anlamlı | 3 |
| D21.04 | Form talimatı alanla bağlı | 2 |
| D21.05 | Hata alanla bağlı | 2 |
| D21.06 | Durum mesajı programatik | 2 |
| D21.07 | Sembolün metin eşdeğeri var | 2 |
| D21.08 | Dil değişimi işaretlenebilir | 2 |
| D21.09 | Ekran okuyucu sırası anlaşılır | 2 |
| D21.10 | Yalnız görsel konuma gönderme yok | 3 |

#### D22 — Bilişsel erişim · 50.0/100 · kanıt: C01 C05 C14 C18

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D22.01 | Görev önceki ekranı ezberletmez | 3 |
| D22.02 | Bir adımda amaç belli | 2 |
| D22.03 | İkili olumsuzluk yok | 2 |
| D22.04 | Soyut kavram somutlanır | 2 |
| D22.05 | Kritik koşul gizlenmez | 2 |
| D22.06 | Yardım ihtiyaç noktasında | 2 |
| D22.07 | Kesintiden sonra bağlam geri bulunur | 2 |
| D22.08 | Terim sözlüğü tek başına çözüm sayılmaz | 2 |
| D22.09 | Seçim sayısı göreve göre gruplanır | 2 |
| D22.10 | Hatalı zihinsel model yakalanır | 1 |

#### D23 — Sınır ve tutarlılık · 55.0/100 · kanıt: C16 C22 C25 C28

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D23.01 | Etiket yardım çelişmez | 3 |
| D23.02 | Özet ayrıntı çelişmez | 2 |
| D23.03 | Tablo grafik terimi eş | 3 |
| D23.04 | CSV ve ekran anlamı eş | 2 |
| D23.05 | Parametre değişince sabit sayı kalmaz | 2 |
| D23.06 | Sıfır bilinmiyor uygulanamaz ayrılır | 2 |
| D23.07 | Yıl dönümünde dil doğru | 2 |
| D23.08 | Tekil çoğul varyantı doğru | 2 |
| D23.09 | Sınır koşulu metni doğru | 2 |
| D23.10 | Geri dönüşte kapsam korunur | 2 |

#### D24 — Sınanabilirlik ve iz · 37.5/100 · kanıt: C01 C09 C15 C21 C31 C32

| Kriter | Denetim koşulu | Mevcut |
|---|---|---:|
| D24.01 | Her iddia kaynağa bağlı | 2 |
| D24.02 | Her kritik terimin oracleı var | 2 |
| D24.03 | Yanlış yorum açık yazılmış | 1 |
| D24.04 | Başarı yanıtı tarif edilmiş | 2 |
| D24.05 | İnsan testi otomasyondan ayrılır | 1 |
| D24.06 | Puan gerekçesi var | 1 |
| D24.07 | Düşük puan iyileştirmeye bağlı | 2 |
| D24.08 | Kritik hata ortalamayla gizlenmez | 1 |
| D24.09 | Bilinmeyen doğrulanmış sayılmaz | 1 |
| D24.10 | İçerik değişimi izlenebilir | 2 |

**240 kriter üzerinden ham ana puan: 52.1/100.** Boyut aralığı: 37.5–82.5. Bu değer sitenin genel başarı yüzdesi değildir; sorun odaklı C01–C32 içerik kümesinin uzman denetimidir. İyileştirilmiş uygulama henüz yok; yeni bir 240-kriter “sonra puanı” hesaplanmadı.

### 4.6 Tekrar puanlamanın güvenilirliği

İki editör aynı örnekleri birbirinin puanını görmeden puanlasın. Bir kriterde 2 veya daha fazla puan farkı varsa önce çıpa ve kapsam tartışılsın; ortalamayla anlaşmazlık örtülmesin. Örnek görev yanıtları üzerinden ortak puanlama eğitimi yapılabilir. Uygun büyüklükte veri varsa sıralı ölçeğe uygun değerlendiriciler arası uyum ölçüsü uzman desteğiyle seçilebilir; bu teslimde böyle bir ölçüm yapılmadı. Kriterlerin güvenirliği ve ayrışması ampirik olarak doğrulanmış değildir.

Otomatik puanlama yalnız yazım, terim varyantı, eksik birim, sabit sayı ve kopya metin gibi adayları işaretlesin. LLM’nin aynı metni kendisinin yeniden yazıp kendi puanını artırması bağımsız doğrulama değildir. Değerlendirici kaynak sürümünü, bağlamı, kanıtı ve gerekçeyi kaydeder. Puanı yükseltmek için metne her kavramı doldurmak da hata sayılır.

### 4.7 Çok boyutlu değerlendirme neden yalnız toplam puandan ibaret değil?

Aritmetik ortalama matematiksel olarak doğrusaldır; bu gerçeği “çok boyutlu algoritma” adıyla saklamıyorum. Kullanıcının istediği yüzlerce ayrı değerlendirme ortalamayı besler; **karar sistemi**, etkileşim ve telafi edilemeyen kapılarla bu ortalamadan ayrılır. İyi yazım, yanlış para tanımını düzeltemez. İyi kaynak açıklaması da yanlış dönem etiketini telafi etmez.

İki zayıflığın birleşmesini görünür kılmak için ek bir **etkileşim riski** tutulabilir:

```text
eksik[k] = 1 - puan[k]/4
etkilesim[a,b] = 100 × eksik[a] × eksik[b]
```

Bu çarpım bir yanlış anlama olasılığı veya doğrulanmış psikometrik ölçüm değildir; iki eksik aynı görevdeyse inceleme önceliği belirleyen proje sezgisidir. Ham ana puana eklenmez/ondan çıkarılmaz. Her çift aynı görevde gerçekten birlikte bulunuyorsa kullanılır; başka sayfalardaki ilgisiz iki eksik rastgele çarpılmaz. Çiftin kaynak C kimlikleri ve gerekçesi kaydedilir.

| Birlikte denetlenen zayıflıklar | Kriter çifti | Görev / birleşince oluşan yanlış yorum |
|---|---|---|
| Başabaş türü + hedef gün/ay ayrımı | D04.05 × D08.04 | C08/C10: bir aylık kesişimi bütün açığın kapandığı gün sanma |
| Gelir tanımı + yıllık ödeme varsayımı | D04.03 × D10.04 | C09: peşin tutarı muhasebe dönemi geliri sanma |
| İşaret + finans terimi | D07.07 × D04.06 | C10/C11: negatif fon ve geri ödeme etiketinden yanlış yatırım kararı |
| Kaynak tazeliği + yedek kapsam | D11.05 × D11.03 | C16/C17: seçili canlı etiketi altında plan gideriyle karar verme |
| Kayıt yeri + kapsam | D14.06 × D12.05 | C18/C21: yerel seçimi bütün şirkete kaydolmuş sanma |
| Zamir/gönderim + gizlenen yardım | D03.04 × D22.05 | C03/C18: diğer değerlerin hangi varsayılandan geldiğini bilememe |
| Birim + mobil bağlam | D07.02 × D20.03 | C07/C30: çalışan sayısını kazanılan satıcı sayısı sanma |
| Karşıolgusal katkı + iddia düzeyi | D10.03 × D10.01 | C15: model farkını gerçekleşmiş kişisel performans sayma |
| Yüzde paydası + yüzde puan | D07.04 × D07.06 | C04/C25: yanlış yeni satıcı/yenileme oranı seçme |
| Sıfırlama nesnesi + genel onay | D13.06 × D13.10 | C18/C32: hangi ayarların değiştiğini bilmeden onaylama |
| Erişilebilir ad + kaybolan başlık | D21.01 × D20.04 | C20/C30: kontrolü duyup hangi döneme ait olduğunu bilememe |
| Model varsayımı + örneğin gerçek sanılması | D10.04 × D17.03 | C09/C31: açıklama örneğini gerçekleşmiş sonuç sanma |

Örnek: D04.05=1 ve D08.04=1 ise etkileşim göstergesi `100×0,75×0,75=56,25` olur. Bu sayı “%56,25 kullanıcı yanılır” değildir. Başlangıç politikası olarak iki puan da≤2 ise ilgili görev, kritik anlam kapısı incelemesine zorunlu adaydır. Adaylık otomatik kesin hata hükmü değildir; kaynak ve karşı görevle karar verilir. Eşik ampirik doğrulanmış standart değildir.

Böylece raporun ana çıktısı tek skor değil: **ortalama + boyut profili + etkileşim listesi + kritik kapı + kapsam + persona-görev kanıtı** olur. Kullanıcı hangi sorunun ortalamanın altında gizlendiğini görebilir.

## 5. Gerçek ifadeler: karşılaştırma, gerekçe ve yükseltme yönergesi

Ortak 12 soru sırasıyla: **Q01 aktör/nesne; Q02 eylem veya ölçüm anlamı; Q03 gönderim; Q04 terim; Q05 kapsam; Q06 zaman; Q07 birim/payda; Q08 bilgi sırası; Q09 kaynak davranışıyla uyum; Q10 belirsizlik/iddia düzeyi; Q11 göreve yeterlilik; Q12 başka kabuğa taşınabilirlik.** Her biri 0–4. Başlık veya etiketin fiilsiz olması Q02’yi otomatik düşürmez. Q11 her ifadeye “sonraki adım” ekletmez; okurun o bilgiyle ilgili görevini tamamlamasına yeterliliği sorar.

Aşağıdaki **mevcut vektör** 12 ayrı değerdir; puan `sum(vektör)/48×100`. **Hedef vektör**, öneri doğru uygulanıp ilgili bağlam doğrulanınca beklenen kabul tabanıdır; gözlenmiş “sonra” başarısı değildir. Hedefler bilinçli olarak çoğunlukla 3 düzeyinde tutuldu. “4” insan testini otomatik geçmek anlamına gelmez. Öneri metninin kendisi hedefe ulaştı diye işaretlenmemelidir.

Alıntılar kaynakta bulunan sabit metinler veya runtime’da örnek parametrelerle oluşmuş metinlerdir. C01, C03, C11, C12, C15, C23 gibi dinamik alıntılardaki sayılar örnektir. Bazı alıntılar daha uzun mesajın parçasıdır (özellikle C27); çevresindeki açıklama yokmuş gibi puan verilmez. Kaynak konumu aşağıdaki dosya + tekil alıntıyla bulunabilir; satır numarası değişse de C kimliği korunur. Son bölümde başlangıç satırları da verilir.

### C01 — 19 Ekim 2026 – Aralık 2027: 100 aktif satıcı, 500 üye ve 3.000.000 ₺ kümüla

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “19 Ekim 2026 – Aralık 2027: 100 aktif satıcı, 500 üye ve 3.000.000 ₺ kümülatif gelir mevcut kadroyla ne zaman gelir; kadronun gelire katkısı, dijital pazarlama stratejisi ve başabaş.”

**Neden zor:** Üç hedef bir soruya, kalan üç konu yüklemsiz kuyruğa bağlanmış. “Ne zaman gelir” satıcıya da bağlanıyor.

**Düzeltme önerisi:** Bu plan, seçtiğiniz varsayımlarla satıcı sayısını ve abonelik ödemelerini tahmin eder. Önce bir senaryo seçin. Ardından hedeflerin tahmini tarihlerini, giderleri ve finansman ihtiyacını inceleyin. Dönem: 19 Ekim 2026–31 Aralık 2027.

**Mevcut:** `222122222122` → **45.8/100**. **Kabul hedefi:** `343333333333` → 77.1/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C02 — Kaynakların aylık yeni aktif satıcısı bu oranla çarpılır.

**Kaynak:** `src/components/SenaryoKurucu.tsx`.

**Mevcut ifade:** “Kaynakların aylık yeni aktif satıcısı bu oranla çarpılır.”

**Neden zor:** Kaynak veri mi kanal mı? Oran hangi bazın oranı? Satıcının kendisi çarpılmaz, beklenen adet çarpılır.

**Düzeltme önerisi:** Her satış kanalından ayda kazanılması beklenen yeni satıcı sayısını bu oranla çarpıyoruz. Burada yeni satıcı, ilk abonelik ödemesini yapan satıcıdır. %80, tam kapasite tahmininin %80’ini kullanır.

**Mevcut:** `222122122222` → **45.8/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C03 — Tam kapasite, elde tutma %70, her 6 ayda +1 saha; diğer seçenekler parametr

**Kaynak:** `src/lib/scenarioOptions.ts`.

**Mevcut ifade:** “Tam kapasite, elde tutma %70, her 6 ayda +1 saha; diğer seçenekler parametre (plan senaryosu).”

**Neden zor:** İsim zinciri; saha kişi mi ziyaret mi; sayacın başlangıcı yok; parametre göndermesi uzak.

**Düzeltme önerisi:** Plan senaryosu: satış kanallarının tanımlı tam kapasitesi kullanılır. Aylık abonelik ödeyenlerin %70’inin sonraki ay yenilemesi beklenir. İkinci saha çalışanından sonra, büyüme takvimine göre her 6 ayda bir saha çalışanı eklenir. Diğer değerler genel plan ayarlarından alınır.

**Mevcut:** `221122222122` → **43.8/100**. **Kabul hedefi:** `333333333333` → 75.0/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C04 — Yıllık peşin payı

**Kaynak:** `src/components/SenaryoKurucu.tsx`.

**Mevcut ifade:** “Yıllık peşin payı”

**Neden zor:** Oran kimlerin oranı; gelir payı mı satıcı payı mı?

**Düzeltme önerisi:** Yıllık peşin ödeyen yeni satıcıların oranı. Örnek: %20 seçerseniz, ilk ödemesini yapan her 100 yeni satıcının 20’sinin yıllık peşin ödeme yapacağı varsayılır.

**Mevcut:** `122112122122` → **39.6/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C05 — Aktif satıcı = ilk ödemesini yapan satıcı.

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Aktif satıcı = ilk ödemesini yapan satıcı.”

**Neden zor:** Tanım var; aktif sözcüğünün bugün devam eden abonelik anlamıyla çakışması ve toplam/ay ayrımı eksik.

**Düzeltme önerisi:** İlk ödemesini yapan satıcı: en az bir kez abonelik ödemesi yaptığı varsayılan satıcı. Toplam yeni satıcı sayısı, bugün aboneliği devam eden satıcı sayısıyla aynı değildir.

**Mevcut:** `332233332233` → **66.7/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C06 — 100 aktif

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “100 aktif”

**Neden zor:** Etiket; yüklem gerekmez ama aktif tanımı ve biriken adet ayrımı gerekli.

**Düzeltme önerisi:** Toplam 100 ilk ödeme yapan satıcıya ulaşma tarihi.

**Mevcut:** `122112122122` → **39.6/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C07 — Hem işveren maliyeti hem kapasite; Sheets kaynağında da eklenir (Sheets’te 

**Kaynak:** `src/components/SenaryoKurucu.tsx`.

**Mevcut ifade:** “Hem işveren maliyeti hem kapasite; Sheets kaynağında da eklenir (Sheets’te tek saha vardır).”

**Neden zor:** Neyin nereye eklendiği ve bunun dış veri dosyasına yazma olup olmadığı belirsiz.

**Düzeltme önerisi:** İkinci saha çalışanı başladığında model, bu kişinin maliyetini gider hesabına ve beklenen yeni satıcılarını satış hesabına ekler. Sheets verisi seçilse de bu ekleme modelde yapılır; Sheets dosyasını değiştirmez.

**Mevcut:** `222112222122` → **43.8/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C08 — O ayın geliri

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “O ayın geliri”

**Neden zor:** Hedef tarihindeki tutar mı ay sonu toplamı mı?

**Düzeltme önerisi:** Hedefin bulunduğu ayın toplam abonelik ödemesi. Bu tutar hedef gününe kadar olan toplam değildir; ayın tamamını kapsar.

**Mevcut:** `222122222122` → **45.8/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C09 — Kümülatif gelir

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Kümülatif gelir”

**Neden zor:** Kümülatif yabancı olabilir; model tahsilatı aylara dağıtılmış muhasebe gelirinden ayırmıyor.

**Düzeltme önerisi:** Başlangıçtan bu ayın sonuna kadar tahmini abonelik ödemesi toplamı. Yıllık peşin ödeme, ödendiği ayda bütünüyle sayılır. Bu modeldeki toplam, muhasebe dönemlerine dağıtılmış gelir olarak okunmamalıdır.

**Mevcut:** `222112222122` → **43.8/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C10 — Geri ödeme

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Geri ödeme”

**Neden zor:** Kredi ödemesi müşteri iadesi yatırımcı ödemesi sanılabilir.

**Düzeltme önerisi:** Birikmiş model açığının kapanacağı tahmini tarih. Hesaplanan kümülatif gelir eksi giderin ilk kez sıfır veya pozitif olduğu noktadır; bir kredi ya da yatırımcıya yapılan ödeme değildir.

**Mevcut:** `112112122122` → **37.5/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C11 — Fon ihtiyacı

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Fon ihtiyacı”

**Neden zor:** Negatif değer gösteriliyor; gereken para negatif olamaz yorumunu tetikler.

**Düzeltme önerisi:** En yüksek birikmiş model açığı: −969.835 ₺. Bu örnek hesapta açığı karşılamak için gereken tutar 969.835 ₺’dir. Kapsam, seçili gider kaynağına bağlıdır.

**Mevcut:** `122112122122` → **39.6/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C12 — Her hedef: seçili senaryoda tarih, 19 Ekim 2026 başlangıcından ve önceki he

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Her hedef: seçili senaryoda tarih, 19 Ekim 2026 başlangıcından ve önceki hedeften geçen süre, o ayın geliri, kümülatif gelir ve hazır senaryoların tarihi.”

**Neden zor:** Kayıtta neler var listesi, okuyucunun kararını söylemiyor; uzun ad tamlaması.

**Düzeltme önerisi:** Her kayıtta hedefe ulaşılması beklenen tarih ve geçen süre gösterilir. Para tutarları hedef gününü değil, o ayın tamamını kapsar. Diğer senaryoların tarihleri karşılaştırma içindir.

**Mevcut:** `222222222122` → **47.9/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C13 — Aylık ücret

**Kaynak:** `src/components/SenaryoKurucu.tsx`.

**Mevcut ifade:** “Aylık ücret”

**Neden zor:** Çalışan maaşı mı abonelik fiyatı mı?

**Düzeltme önerisi:** Satıcı başına aylık abonelik fiyatı (€). Bu seçim gelir hesabını değiştirir; personel maaşını değiştirmez.

**Mevcut:** `112112122122` → **37.5/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C14 — Medyan

**Kaynak:** `src/lib/scenarioOptions.ts`.

**Mevcut ifade:** “Medyan”

**Neden zor:** Dağılımdan hesaplanmış orta değer izlenimi; kaynakta hazır plan adı.

**Düzeltme önerisi:** Plan senaryosu (mevcut adı: Medyan). Bu bir varsayım kümesidir; gerçekleşme olasılığı veya ölçülmüş istatistiksel medyan değildir. Ad değiştirmek için çapraz sayfa tutarlılığı birlikte ele alınmalıdır.

**Mevcut:** `222122222122` → **45.8/100**. **Kabul hedefi:** `343333433333` → 79.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C15 — Her rolün gelire katkısı seçili senaryoda ayıklanarak ölçülür: o kaynak olm

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Her rolün gelire katkısı seçili senaryoda ayıklanarak ölçülür: o kaynak olmasaydı 15 ayda kaybedilecek gelir.”

**Neden zor:** Model karşıolgusuna ölçüm deniyor; çalışan verimlilik notu sanılabilir.

**Düzeltme önerisi:** Modelde hesaplanan katkı, ilgili satış kaynağı çıkarılınca toplam tahmini abonelik ödemesinin ne kadar azaldığını gösterir. Gerçekleşmiş kişisel performans ölçümü değildir. Dönem, seçili plan dönemidir.

**Mevcut:** `222122222122` → **45.8/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C16 — Sheets (canlı)

**Kaynak:** `src/components/SenaryoKurucu.tsx`.

**Mevcut ifade:** “Sheets (canlı)”

**Neden zor:** Bu sayfada açılışta bir kez okuma var; sürekli senkron izlenimi.

**Düzeltme önerisi:** Sheets gider verisi. Bu sayfa açılırken okunan veriye modelin ek giderleri eklenir. Son okuma zamanı ve hesapta kullanılan kaynak ayrıca gösterilmelidir.

**Mevcut:** `122112122122` → **39.6/100**. **Kabul hedefi:** `333333333333` → 75.0/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C17 — Sheets gider verisi okunuyor; o ana kadar plan kadrosu kullanılır.

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Sheets gider verisi okunuyor; o ana kadar plan kadrosu kullanılır.”

**Neden zor:** Olumlu örnek yedek kaynak söyleniyor; sonuçların değişeceği daha görünür olmalı.

**Düzeltme önerisi:** Sheets giderleri okunuyor. Şimdilik plan kadrosunun giderleriyle hesap yapılıyor. Veri gelirse sonuçlar yeniden hesaplanacak.

**Mevcut:** `333333332233` → **70.8/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C18 — Seçenekleri sıfırla

**Kaynak:** `src/components/SenaryoKurucu.tsx`.

**Mevcut ifade:** “Seçenekleri sıfırla”

**Neden zor:** Hangi varsayılan; tüm site mi bu sayfa mı; temel senaryo korunuyor.

**Düzeltme önerisi:** Bu sayfanın seçeneklerini genel plan değerlerine döndür. Seçili temel senaryo korunur. Genel Parametreler sayfasındaki değerler silinmez.

**Mevcut:** `222122122122` → **43.8/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C19 — Bağlantıyı kopyala

**Kaynak:** `src/components/SenaryoKurucu.tsx`.

**Mevcut ifade:** “Bağlantıyı kopyala”

**Neden zor:** Etiket makul ama paylaşımın aynı bütün modeli taşıdığı sanılabilir.

**Düzeltme önerisi:** Senaryo bağlantısını kopyala. Bağlantı bu sayfanın senaryo seçeneklerini taşır; genel plan parametrelerinin ve Sheets verisinin bir kopyasını içermez.

**Mevcut:** `333223332233` → **66.7/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C20 — Kopyalanamadı: adres çubuğunu kopyalayın

**Kaynak:** `src/components/SenaryoKurucu.tsx`.

**Mevcut ifade:** “Kopyalanamadı: adres çubuğunu kopyalayın”

**Neden zor:** Düzeltme yolu var; uzun hata düğmede geçici.

**Düzeltme önerisi:** Senaryo bağlantısı panoya kopyalanamadı. Tarayıcının adres çubuğundaki bağlantıyı seçip kopyalayabilirsiniz.

**Mevcut:** `333333333233` → **72.9/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C21 — Son kayıt

**Kaynak:** `src/views/ParamsPage.tsx`.

**Mevcut ifade:** “Son kayıt”

**Neden zor:** Nereye kaydedildi; sunucu veya Sheets sanılabilir.

**Düzeltme önerisi:** Bu tarayıcıya son kayıt: {saat}. Bu ayarlar başka cihazlara aktarılmaz ve Sheets dosyasını değiştirmez.

**Mevcut:** `122112122122` → **39.6/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C22 — İlk satış

**Kaynak:** `src/data/params.ts`.

**Mevcut ifade:** “İlk satış”

**Neden zor:** Alan başlığı yeterli ama yardımda o ay kalan gün oranıyla eksiltili.

**Düzeltme önerisi:** İlk satışın varsayılan tarihi. Satışa bağlı ödemeler bu tarihten önce sıfır kabul edilir. İlk ayın satış kapasitesi, ayda kalan günlerin oranına göre hesaplanır.

**Mevcut:** `233223232222` → **58.3/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C23 — yeni satıcıların %20’i yıllık peşin ödediği için

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “yeni satıcıların %20’i yıllık peşin ödediği için”

**Neden zor:** Yüzde ekinin okunuşu yanlış; nedensellik hedef tarihini garanti eder gibi.

**Düzeltme önerisi:** Bu senaryoda yeni satıcıların yüzde 20’sinin yıllık peşin ödeme yaptığı varsayılır. Peşin ödemeler nedeniyle toplam ödeme hedefine farklı bir tarihte ulaşılabilir.

**Mevcut:** `232223222122` → **52.1/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C24 — LTV ÷ CAC kuralı

**Kaynak:** `src/components/SenaryoKurucu.tsx`.

**Mevcut ifade:** “LTV ÷ CAC kuralı”

**Neden zor:** Kısaltma açılımı bile modelin LTV tanımını söylemez.

**Düzeltme önerisi:** Reklam bütçesini modeldeki satıcı değeri / satıcı edinme maliyeti oranına göre artır. Ayrıntıda LTV ve CAC formüllerini, eşiği, artış aralığını ve bütçe tavanını göster. Modelin LTV hesabını kârla eş anlamlı sunma.

**Mevcut:** `112112122122` → **37.5/100**. **Kabul hedefi:** `333333333333` → 75.0/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C25 — elde tutma +10 puan

**Kaynak:** `src/lib/scenarioOptions.ts`.

**Mevcut ifade:** “elde tutma +10 puan”

**Neden zor:** Neye göre; yüzde ile yüzde puan karışır; üst sınır olabilir.

**Düzeltme önerisi:** Aylık yenileme oranı plan senaryosuna göre 10 yüzde puan daha yüksek varsayılır. Örnek: %70 yerine %80. Gerçek seçili değer ve modelin üst sınırı ayrıca gösterilir.

**Mevcut:** `222112122122` → **41.7/100**. **Kabul hedefi:** `333333333333` → 75.0/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C26 — Yeni aktif satıcı: hazır senaryolar üst üste

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Yeni aktif satıcı: hazır senaryolar üst üste”

**Neden zor:** Üst üste görsel yerleşim, ortak varsayımlar ve özel senaryo farklılığı anlaşılmıyor.

**Düzeltme önerisi:** Senaryolara göre aylık yeni satıcı tahmini. Aynı ayların değerleri birlikte gösterilir. Hazır senaryoların kendi varsayımları kullanılır; varsa özel senaryonuz ayrıca eklenir.

**Mevcut:** `222222222222` → **50.0/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C27 — Sheets gider verisi okunamadı

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Sheets gider verisi okunamadı”

**Neden zor:** Tek başına alıntı tam hata değildir; kaynakta teknik neden ve yedek devamı var.

**Düzeltme önerisi:** Sheets giderleri okunamadı. Bu sonuçlarda plan kadrosu giderleri kullanılıyor. Bu kaynak ofis ve yazılım ekibi giderlerini içermeyebilir; kullanılan kapsamı kontrol edin. Teknik hata ayrıntısı ayrı sunulsun.

**Mevcut:** `333233332233` → **68.8/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C28 — Kapanmıyor

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Kapanmıyor”

**Neden zor:** Kısa dinamik durum; ufukta yok mu hesap hiç üretemiyor mu?

**Düzeltme önerisi:** Bu varsayımlarla gösterilen dönem için kapanış tarihi hesaplanamadı. Dönem içi sonuç ile dönem sonrasına yapılan eğilim tahminini ayrı gösterin. Hangi hesabın kapanmadığını etikette belirtin.

**Mevcut:** `112112122122` → **37.5/100**. **Kabul hedefi:** `333333333333` → 75.0/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C29 — Asistan, Segika CRM, ekip lideri: modelde doğrudan gelir yok

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Asistan, Segika CRM, ekip lideri: modelde doğrudan gelir yok”

**Neden zor:** İnsanların değeri yok yorumu; model kapsamı ile gerçek katkı karışıyor.

**Düzeltme önerisi:** Bu model, asistan, Segika CRM ve ekip lideri için ayrı bir doğrudan satış katkısı hesaplamıyor. Bu, bu rollerin işletmeye katkısı olmadığı anlamına gelmez.

**Mevcut:** `332233332233` → **66.7/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C30 — Kaynak, başlangıç, düzen, kapasite

**Kaynak:** `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Kaynak, başlangıç, düzen, kapasite”

**Neden zor:** Başlık liste; kaynak finans verisi mi kanal mı; adedin nesnesi kayıtta tekrarlanmalı.

**Düzeltme önerisi:** Satış kanalları: başlangıç tarihleri ve beklenen yeni satıcı sayıları. Her kayıtta “ayda, kişi başına” veya “kanal toplamı” birimini ilgili model alanına göre koruyun.

**Mevcut:** `222122222122` → **45.8/100**. **Kabul hedefi:** `333333333333` → 75.0/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C31 — Sistem kuruldu: ilk 10 aktif satıcı

**Kaynak:** `src/data/revenue.ts:346`; görünüm `src/views/RevenuePage.tsx`.

**Mevcut ifade:** “Sistem kuruldu: ilk 10 aktif satıcı”

**Neden zor:** 10ilk ödeme sistemin kurulmuş olduğunu kanıtlamaz.

**Düzeltme önerisi:** İlk 10 satıcının ödeme yapması hedefi. “Sistem kuruldu” kararı için gerekiyorsa ayrıca operasyonel kabul ölçütleri tanımlayın.

**Mevcut:** `232223222122` → **52.1/100**. **Kabul hedefi:** `343433433333` → 81.2/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### C32 — Emin misiniz? Tekrar basın

**Kaynak:** `src/views/ParamsPage.tsx`.

**Mevcut ifade:** “Emin misiniz? Tekrar basın”

**Neden zor:** Genel onay;4süreli; hangi kapsam kaybolacak bilinmiyor.

**Düzeltme önerisi:** Tüm genel plan ayarları varsayılan değerlere dönecek. “Genel ayarları sıfırla” ile onaylayın veya “Vazgeç”i seçin. Bu bir içerik+etkileşim önerisidir; yalnız düğme metnini uzatmakla uygulanmış sayılmaz.

**Mevcut:** `222122122122` → **43.8/100**. **Kabul hedefi:** `333333333333` → 75.0/100; NOT_VERIFIED.

**Kabul sorusu:** Persona tablosunda bu C kimliğiyle eşleşen soruyu sor; yanıt yalnız etiketi tekrar ediyorsa anlama kanıtı sayma. Yanlış yorumu yaratan terimi, kapsamı veya ilişkiyi hedefle.

### 5.1 Bu karşılaştırmayı yanlış kullanmama

C20 ve C17’de mevcut metnin doğru bir tarafı var: alternatif yol ve geçici kaynak açıkça belirtilmiş. Bunlar toptan “kötü metin” değildir; uzun mesajın nerede ve ne kadar süre görüldüğü iyileştirilmelidir. C19’un kısa düğmesi de çalışabilir; uzun açıklama düğmenin içine konmaz. C11’de negatif sayıyı gelişigüzel pozitife çevirme: model açığını negatif göster, gerekli finansman tutarını ayrı pozitif değer olarak adlandır. C14’te “Medyan”ı tek yerde değiştirme; menü, URL, CSV ve senaryo eşleştirmesi korunarak bir adlandırma kararı alınır.

C24, C28, C30 ve C32’nin önerileri yalnız son kullanıcı cümlesi değil, içerik+etkileşim tasarımı tarifidir. Son metin, hesap ve durum doğrulandıktan sonra hazırlanır. Bu yüzden hedef puanları kabul eşiğidir; bitmiş metne verilen not değildir. C15 ve C29’da da “katkı yok” cümlesini “katkısı var” diye kanıtsız tersine çevirme; **modelin neyi hesaplamadığını** söyle.

## 6. UX ekollerini metin için uygulanabilir kurala çevirmek

Buradaki ilkeler bilimsel bir “tek reçete” veya metin puanı formülü değildir. V2’nin algı ve karar ilişkileri, aşağıda metne özgü hipotez ve yanlışlama koşuluna dönüştürülür. “Gestalt uygula” gibi adı olan ama ne yapılacağı belli olmayan yönerge kabul edilmez. Kuramsal kaynakların ayrıntılı değerlendirmesi `ux_v2.md` §2’dedir; burada yapılan ürün çıkarımları projede ayrıca sınanmalıdır.

| Yaklaşım | Anlaşılmama mekanizması | İçerik yönergesi | Bu projede yanlışlama / karşı test |
|---|---|---|---|
| Kullanılabilirlik etkisi / estetik kullanılabilirlik ilişkisi | Düzenli ve güven veren görünüm belirsiz hesabı doğru sanmaya yol açabilir | Görsel kesinlikle dilsel kesinliği eşleştir; tahmin, kaynak ve kapsamı sonuç yanında söyle | Kullanıcı güzel buluyor ama fon açığını yanlış anlatıyorsa tasarım başarısız |
| Norman: visceral | İlk izlenimde “bu karmaşık; bana göre değil” algısı | İlk bakışta sayfa amacı ve ilk seçim anlaşılır olsun; ilk paragrafta bütün teknik kavramları sıralama | İlk ekranda amacı söyleyemiyorsa yalnız tipografiyi düzeltmek yetmez |
| Norman: behavioral | Kontrolün neyi değiştirdiği ve sonucun ne olduğu bilinmiyor | Etiket → giriş → sonuç → geri bildirim aynı varlığı ve kapsamı adlandırsın | P13 ücret seçince personel maaşının değiştiğini sanıyorsa başarısız |
| Norman: reflective | Kullanıcı sonradan kararı savunamıyor veya yanlış gerekçe anlatıyor | Sonucu yeniden anlatmak için varsayım ve kaynak izi sun | Toplantı sonunda tahmini gerçekleşmiş ciro diye aktarıyorsa başarısız |
| White / negative space | Metinler aynı aralıklarla dizilince hangi açıklamanın hangi değere ait olduğu silinir | Etiket, değer ve gerekli koşul bir anlam grubu olsun; bağımsız kararlar daha belirgin ayrılsın | Açıklama komşu alanın koşulu sanılıyorsa boşluk hiyerarşisi yanlış |
| Visual hierarchy | Büyük sayı bağlamı bastırır; paragraf içindeki uyarı taramada kaybolur | Başlık soruyu, ana değer yanıtı, yakın not koşulu taşısın; “tahmini” okunamaz dipnot olmasın | Sayıyı doğru okuyup dönemini yanlış söylemek başarısızlık |
| Consistency | Aynı sözcük farklı varlıklara, farklı sözcükler aynı varlığa kullanılır | Terim kimliği oluştur; eşanlamlı çeşitlilikten önce kavramsal sabitlik | Aktif = yeni ilk ödeme başka yerde aktif = devam eden ise sözlük yetmez |
| Law of Proximity | Yakın sözcük yanlış sayıya bağlanır | Dönem ve birim değeriyle aynı okuma biriminde kalsın | Mobilde “aylık” komşu toplamın etiketi sanılıyorsa başarısız |
| Law of Similarity | Benzer biçimdeki etiketler aynı hesap türü gibi okunur | Stok, akış, tahmin ve gerçekleşeni görünüş ve adlandırmada ayır | “Kümülatif net” ve “aylık net” yalnız küçük bir sıfatla ayrılıp karışıyorsa yeniden grupla |
| Law of Continuity | Satır veya ok yönü devam eden ilişki beklentisi yaratır | Liste/grafik metninin okuma yönü hesap ilişkisini izlesin | Ok çizgisi yıllık peşini aylık gelir bölüşümü sanmasına yol açıyorsa yanlış |
| Common Region | Aynı kutu içindeki değerlerin aynı kaynak ve dönemi paylaştığı varsayılır | Farklı kaynaklı değerleri tek bölgede sunuyorsan farkı açıkça etiketle | Sheets başlığı altındaki plan ekleri saf Sheets verisi sanılıyorsa başarısız |
| Fitts | Belirsiz veya dar etiket hedef bulmayı ve seçmeyi zorlaştırır | Gerçek tıklama alanı ve açık adlandırmayı birlikte çöz; daha çok metinle hedefi daraltma | Uzun düğme 320’de kırpılıyorsa yardım metnini dışarı al; etiketin nesnesini silme |
| Hick–Hyman | Seçeneklerin sayısından çok ayırt edilememe karar yükü yaratır | Senaryoların hangi varsayımlarla ayrıldığını karşılaştırılabilir yaz | “Tutumlu” ve “Dijital ağırlıklı” adlarından yalnız sezgiyle bütçe seçiliyorsa açıklama eksik |
| Miller / çalışma belleği | Kullanıcı önceki bölümden terim ve birimi aklında tutmak zorunda kalır | Gerekli bağlamı ihtiyaç noktasında tekrar et; 7±2’yi menü limiti yapma | İkinci accordion açılınca ilk kaydın dönemini hatırlaması gerekiyorsa ilişki kaybolmuş |
| Peak–End | Son mesaj “bitti/kaydedildi” yanlış hatıra bırakabilir | Gerçek tamamlanmayı, kayıt yerini ve kalan belirsizliği söyle | “Bağlantı kopyalandı” kullanıcıda “gönderdim” hatırası bırakıyorsa akış düzelt |
| Tanıma, hatırlamaya tercih | Soyut kısaltma önceki açıklamayı hatırlatmaya zorlar | Alanla bağlı tanım ve güncel örnek; tek sözlük sayfasına mecbur etme | LTV açılımını okuyup formülün kâr olup olmadığını söyleyemiyorsa yardım yetersiz |
| Bilgi kokusu | Bağlantı/düğme adı hedef içeriği öngördürmez | “Detay” yerine hangi ayrıntı olduğunu söyle; hedef adı başlıkla tutarlı olsun | “Kaynak” tıklamasının satış kanalı mı veri kaynağı mı olduğu bilinmiyorsa başarısız |
| Aşamalı açıklama | Kısalık için ana anlam gizlenir veya her açıklama açık olup görev boğulur | Kritik kapsam dışarıda, yöntem ve ayrıntı açılabilir içeride | Kullanıcı doğru para anlamı için üç panel açmak zorundaysa başarısız |
| Bilişsel yük | Hesabın zorluğuna kötü sunumun ek yükü biner | Modelin zor kısmını inkâr etme; gereksiz gönderim ve çapraz aramayı azalt | Basitleştirilmiş cümle doğru kararı artık vermiyorsa fazla sadeleşmiş |
| Eylem/değerlendirme uçurumu | Kullanıcı niyetini kontrole çeviremiyor veya değişimin sonucunu değerlendiremiyor | Seçimden önce etki, seçimden sonra değişen sonuç ve kapsam | Kontrol çalışıyor ama kullanıcı hangi sayının niçin değiştiğini bilmiyorsa başarısız |
| Hata önleme ve geri kazanım | Genel onay yanlış işlemi engellemez | Geri dönülemez/etkili eylemde nesne, kapsam, sonuç ve vazgeçme yolu | “Emin misiniz?”i onaylayıp genel parametrelerin silindiğini sonradan fark etmek başarısız |

Norman’ın üç düzeyi aynı sırayla geçilen üç ekran değildir. Metnin ilk izlenimi, kullanım sırasındaki anlaşılması ve sonradan hatırlanması ayrı sınanır. [Norman’ın açıklaması](https://jnd.org/emotional-design-people-and-things/). Web metninin taranabilir olması, kullanıcının hiçbir zaman ayrıntı okumadığı anlamına gelmez; başlık ve ilk cümle doğru ayrıntıya giriş sağlamalıdır. Eski araştırmalardaki oranlar bu şirketin kullanıcı başarı oranı olarak kullanılamaz. [Nielsen’ın kendi araştırma özeti](https://www.nngroup.com/articles/how-users-read-on-the-web/).

### 6.1 Bir paragrafı yeniden kurmak: sırayla uygulanacak yöntem

1. Kullanıcının sorusunu yaz: “Bu gider kaynağıyla ne kadar finansman gerekiyor?”
2. İddianın alan modelini çıkar: ölçüt, varlık, dönem, birim, kaynak, varsayım, kapsam dışı.
3. Önce yanlış ama makul yorumu yaz: “Negatif fon, finansman gerekmiyor demek.”
4. Yanıtı tek başına anlaşılabilen bir ana ifadeye çevir.
5. Yanıltıcı yorumu önleyen koşulu hemen yanına koy.
6. Hesap yöntemini ikinci katmana koy; kritik koşulu oraya sürme.
7. Sayı ve tarihi kaynaktan üret; örnek rakamı sabitleme.
8. Metni gerçek 320 kabuğunda, geniş ekranda, grafik eşdeğerinde ve erişilebilir adında yeniden oku.
9. Persona sorusuna metni göstermeden değil, gerçek görev içinde cevap al; ezber tekrarını değil anlamı değerlendir.
10. Formül ile metin uyuşmuyorsa cümleyi makyajlama; alan kararı gereken noktayı işaretle.

## 7. İçerik modelinin ortak sözleşmeleri

### 7.1 Terim kaydı: sözcük listesi değil anlam sınırı

| Kavram kimliği | Kullanıcıya önerilen ad | Tanım / kapsam | Karıştırılmaması gereken | Kaynak |
|---|---|---|---|---|
| seller.firstPayment.new | Yeni ödeme yapan satıcı | İlgili ay ilk ödemesi varsayılan adet | Çalışan veya hâlen abone toplamı | revenue.yeniAktif |
| seller.firstPayment.cumulative | Toplam ilk ödeme yapan satıcı | Başlangıçtan itibaren birikmiş yeni adet | Devam eden abonelik stoku | revenue.kumAktif |
| seller.subscription.current | Aboneliği devam eden satıcı | Aylık yenileyenler + modelin geçerli yıllık aboneleri | O ay ödeme işlemi yapan toplam | revenue.odeyen |
| seller.registered | Kayıtlı satıcı | Modelin kayıt/ödeme dönüşüm ilişkisiyle tahmin ettiği adet | Gözlenmiş CRM sayısı | revenue.kayit / kumKayit |
| payment.monthly | Aylık tahmini abonelik ödemesi | İlk ödeme + yenileme; yıllık peşin ilk ay bütünüyle | Dönemlere dağıtılmış muhasebe geliri | revenue.ilkOdeme + yenileme |
| payment.cumulative | Birikmiş tahmini abonelik ödemesi | Başlangıçtan seçili ay sonuna kadar toplam | Son ayın tek başına tutarı | revenue.kumulatif |
| net.monthly | Aylık model farkı | Aynı ayın model geliri eksi seçili giderleri | Vergi sonrası kâr | breakeven.net |
| net.cumulative | Birikmiş model farkı | Aylık model farklarının toplamı | Bankadaki gerçek bakiye | breakeven.kumNet |
| breakeven.monthly | Aylık gelir–gider kesişimi | Modelde aylık farkın sıfır veya pozitife geçtiği ilk nokta | Bütün geçmiş açığın kapanması | breakeven.nokta |
| deficit.recovery | Birikmiş açığın kapanışı | Model kümülatif farkının sıfır veya pozitife geçtiği nokta | Yatırımcı/kredi geri ödemesi | breakeven.geriOdeme |
| deficit.maximum | En yüksek birikmiş açık | Dönem içindeki en düşük kümülatif farkın açık büyüklüğü | Açılış kasası/finansman şartları dahil gerçek nakit planı | breakeven.enDusuk |
| contribution.counterfactual | Modeldeki satış kaynağı katkısı | Kaynak çıkarıldığında tahmini toplamda oluşan fark | Gerçek çalışanın nedensel performans ölçümü | staffing model karşılaştırması |
| retention.monthly | Aylık abonelik yenileme oranı | Aylık abonelerin sonraki ay devam etme varsayımı | Yeni satıcı kazanma oranı / yıllık abonelik kaybı | revenue aylikOdeyen döngüsü |

Bunlar toplu yeniden adlandırma yetkisi değildir. Özellikle “gelir”i bütün üründe “tahsilat” yapmak bir alan terminolojisi kararıdır: vergi, komisyon, iade ve muhasebe kapsamı ayrıca bilinmelidir. Mevcut hesap **abonelik ödemesi toplamı** olarak açıklanabilir; gerçek banka tahsilatı doğrulanmış gibi yazılamaz. “Ödeme”ye geçerken modelin kayıt varsayımları saklanmamalı.

### 7.2 Master component düzeyinde içerik sözleşmesi

Mantine varsayılan metni anlam kararı sayılmaz. Mevcut React/Mantine yapısı korunur; bu belge paket kurulumu veya yeniden yazım istemez. Ortak bileşen aşağıdaki anlam yuvalarını desteklemeli; bütün sayfalar bunları gelişi güzel doldurmamalıdır.

| Master / yüzey | Zorunlu içerik | Duruma bağlı içerik | Kabul |
|---|---|---|---|
| Metric / Stats / yapışkan özet | Ölçüt adı, değer, birim, dönem | Kaynak, tahmin, karşılaştırma, kapsam dışı | Değer tek başına kopyalanınca yanıltmamalı; gerekli bağlam erişilebilir adda da kalmalı |
| Field / Choice | Varlığı belirten etiket, birim, seçili değer | Referans değer, etki, örnek, sınır | Açılır seçenek etiketi genel “parametre” yerine aldığı değerin kaynağını söylemeli |
| Scenario chooser | Senaryo adı, varsayım kümesi, seçili durum | Özel değişiklikler, karşılaştırma bazları | Adı olasılık veya istatistiksel orta değer gibi sunma |
| DataTable / RecordAccordion | Kayıt adı, alan adı, değer, birim/dönem | Kaynak ve durum | Mobilde tablo başlığının sağladığı bağlam yeniden taşınır; sadece görünüm değişir |
| PeriodExplorer | Seçili dönem, metrik ve senaryo | Karşılaştırma dönemi, toplam kapsamı | Ayı değiştirdiğinde eski ay etiketi/tutarı kısa süreli de olsa birlikte görünmemeli |
| Source status / Note | İstenen ve kullanılan kaynak, güncellik | Yedek, kısmi veri, teknik ayrıntı | “Canlı” yalnız gerçek yenilenme sözleşmesiyle kullanılır |
| Action / confirmation | Fiil, nesne, kapsam | Sonuç, vazgeçme, geri alma | Uzun açıklama düğmeye yığılmaz; kritik nesne etiketten silinmez |
| Error / empty / loading | Ne oldu, etkisi | Bilinen neden, uygulanabilir sonraki adım | Neden bilinmiyorsa tahmin edilmez; hata ile sıfır ayrılır |
| Chart + metin eşdeğeri | Soru, ölçüt, dönem, birim | Kıyas bazları, varsayım, kaynak | Sayı dizisi tek başına açıklama değildir; grafiğe erişemeyen aynı soruyu yanıtlayabilmeli |
| Export / CSV | Sütun anlamı, dönem, birim | Senaryo, parametre/kaynak sürümü, üretim zamanı | Dosya yalnız başına açılınca yanlış bağlama düşmemeli |

Ortak şema örneği (uygulama kodu değildir):

```yaml
content_id: revenue.deficit.maximum
user_question: Bu planın en yüksek birikmiş açığı ne kadar?
entity: selected_scenario
metric: minimum_cumulative_model_difference
period: simulation_start_to_end
unit: TRY
source: actual_used_cost_source
certainty: model_estimate
label: En yüksek birikmiş model açığı
help: Gerekli finansman tutarı bu açığın büyüklüğüdür; kapsam seçili gider kaynağına bağlıdır.
prohibited_reading: Bankadaki gerçek bakiye veya onaylanmış yatırım tutarı
oracle: breakeven.enDusuk.deger ve kullanılan kaynak
variants: [normal, zero_deficit, fallback, unavailable, projected]
personas: [P04, P06, P26]
tests: [T03, T04, T07]
```

İçerik kimliği çeviri anahtarıyla eşleşebilir; her metin için yeni soyutlama katmanı kurmak gerekmez. Sorun aynı anlamın farklı yerlerde bozulmasıysa merkezileştir. Bir yerdeki sıradan paragrafı registry’ye taşımayı kendi başına başarı sayma.

### 7.3 Türkçe üretim kuralları

- Dinamik sayı eklerini düz dize birleştirmeyle üretme: `%20’i` yanlıştır. Güvenilir ek üretimi yoksa “yüzde 20 oranında” gibi eki gerektirmeyen doğal biçim kullan. Bütün sayılara aynı apostrof eki ekleme.
- Sayı biçimi Türkçe olabilir; birim kimliği yine açık olsun: `399 € / ay` kimin ücreti olduğunu tek başına söylemez.
- `+10 puan` gerekiyorsa “10 yüzde puan”; `%10 daha fazla` başka işlemdir. Kullanıcıya ikisini aynıymış gibi göstermeyi testte reddet.
- “Yok”, “—”, “0”, “hesaplanamadı”, “uygulanamaz”, “veri gelmedi” ve “ufukta ulaşılmıyor” farklı durumlar olsun.
- “İkinci”, “ek”, “yeni”, “mevcut”, “toplam” ve “devam eden” sözcüklerini dekorasyon sayma; hangi kümeyi tanımladığını kaydet.
- “Olur/gelir/ölçülür” kipini garanti veya gerçek gözlem üretmediği yerde “modelde hesaplanır / varsayılır / tahmin edilir” ile değiştir. Her cümleye “olabilir” ekleyerek belirsizlik sisine dönüştürme.
- `kayıt` fiilini CRM kaydı, tarayıcı kaydı ve Sheets’e yazma için açıklamasız ortak kullanma.
- “Üstteki/sağdaki/turuncu” yalnız yön tarifi olabilir; eylemin tek kimliği olamaz. Adlandırılmış kontrolü söyle.
- İç karar tarihi veya “kullanıcı kararı” gibi geliştirme notlarını son kullanıcı yardımına taşımadan önce gerçekten karar vermesine katkısını sorgula.
- Marka/özel ad (Segika), iş rolü (CRM operasyonu) ve yazılım aracı aynı şey değildir. Gerçek rol tanımı bilinmiyorsa bir açılım uydurma; içerik kararı olarak işaretle.

## 8. TDD-first içerik: önce yanlış anlamayı reddeden test

İçerik TDD, “metinde şu kelime geçiyor” assertion’ı değildir. Önce beklenen anlamı ve yasak yanlış yorumu tarif et; uygulama, açıklama ve test birbirinden bağımsız kaynağa dayansın. Birim testi metnin varlığını, tarayıcı testi ilişki ve görünürlüğünü, insan testi anlamayı sınar. Bu rapor yeni test yazmadı veya mevcut suite’i çalıştırmadı.

### 8.1 Kırmızı → yeşil → yeniden inceleme

**Kırmızı:** Örneğin C13’te kullanıcı aylık ücretin personel maaşı olduğunu sanıyor. İlk testin bağımsız oracle’ı modeldeki `priceEur` alanının abonelik fiyatını değiştirdiğidir. Test yalnız yeni cümleyi beklerse yanlış hesap geçebilir.

**Yeşil:** Etiket aboneliği adlandırır; yakın açıklama gelir etkisini söyler; hesap bağımsız fixture’da beklenen alanı değiştirir. Etikette, tooltip’te, erişilebilir adda ve CSV’de aynı anlam korunur.

**Yeniden inceleme:** Etiket uzadı diye 320’de kırpılmadığını, gerektiği için yardım katmanına ayrıldığını ve kullanıcıya aynı şeyi üç kez okutmadığını doğrula. Sonra aynı 12 soruyla yeniden puanla. Eski puanı veya görsel referansı yeni ifadeyi doğru saymak için sessizce değiştirme.

### 8.2 24 somut kabul senaryosu

| Test | Verilen / işlem | Beklenen anlam ve bağımsız oracle | Reddet |
|---|---|---|---|
| T01 C01 | İlk kez Medyan sayfası açılır | Bunun varsayımlara bağlı gelecek planı olduğu söylenebilir | Gerçekleşmiş ciro tablosu sanma |
| T02 C05–06 | 100 kişi ilk ödeme yapmış, 60 abonelik sürüyor | Toplam ilk ödeme 100; devam eden 60 | İki değeri “aktif” diye eşitleme |
| T03 C09 | İlk ay iki yıllık peşin ödeme, aylık ödeme yok | Model ilk ayda yıllık tutarların tamamını toplar | Yıllık tutarı 12’ye bölüp aynı metinle geçme |
| T04 C11 | Kümülatif fark `[-100,-300,-200]` | En büyük açık −300, büyüklüğü 300; kapsamlı finansman kararı ayrı | −300 gerektiği için “para gerekmez” yorumu |
| T05 C10 | Aylık fark pozitife dönerken geçmiş açık sürer | Aylık kesişim ile birikmiş açığın kapanışı ayrı | Başabaş tarihini geri ödeme diye etiketleme |
| T06 C08 | Hedef ayın 10’unda, ay sonunda daha çok ödeme var | Tarih hedef gününü; para ay toplamını gösterir | Ay toplamını hedef günündeki tutar sanma |
| T07 C16–17 | Sheets gecikir, ardından fixture gelir | Önce plan kaynağı; sonra kullanılan Sheets+ekler; güncelleme anlaşılır | Seçili kaynak etiketini kullanılan kaynak sanma |
| T08 C27 | Sheets okunamaz | Yedek gider kapsamı ve sonuç etkisi açıklanır | Hatanın 0 gider gibi görünmesi |
| T09 C18 | Özel seçenekler değişmiş; sıfırla | `reset` genel default seçenekleri kurar, temel senaryo korunur | Sayfa sıfırlamasının bütün parametreleri sildiğini sanma |
| T10 C21 | Depolama engellenir | Yalnız açık sayfa oturumu; kalıcı kayıt iddiası yok | Sunucuya kaydedildi mesajı |
| T11 C19 | Link başka tarayıcıda farklı genel parametrelerle açılır | Link seçenekleri taşır; tam model/veri snapshot’ı değildir | Aynı URL’nin her koşulda aynı sonucu garanti etmesi |
| T12 C20 | Pano izni reddedilir | Adres çubuğu alternatif yol; gerçek hata görünür | Kopyalanmış gibi başarı göstermek |
| T13 C23 | %0,%1,%10,%20,%30,%100 varyantları | Doğru Türkçe veya ek gerektirmeyen yapı | `%20’i` gibi okunuşa aykırı sabit ek |
| T14 C25 | %70 baz +10 yüzde puan | Sonuç %80; göreli artışla karışmaz | %77 sonucu aynı anlama sayma |
| T15 C24 | LTV/CAC eşiği altı, eşit, üstü | Gerçek formül/eşik/sıklık/tavan metniyle uyumlu | Sırf kısaltmayı açıp kâr garantisi üretmek |
| T16 C15 | Bir satış kanalı modelden çıkarılır | Katkı iki model sonucunun farkı olarak açıklanır | Çalışanın ölçülmüş performansı diye aktarmak |
| T17 C29 | Doğrudan atıf yapılmayan rol | “Ayrı satış katkısı hesaplanmıyor” | “Bu rol şirkete değer katmıyor” |
| T18 C22 | İlk satış ayın ortasında | İlk ay kalan gün oranı; tarihten önce satışa bağlı ödeme sıfır | Tam ay kapasitesi varmış gibi açıklama |
| T19 C28 | Ufuk içinde tarih yok, eğilim pozitif/negatif/sabit varyant | Dönem içi ve dönem dışı tahmin ayrı; bulunamama nedeni doğru | “Hiçbir zaman olmaz” kesinliği |
| T20 C30 | Aynı kayıt 320 ve1280 kabuğunda | Aynı ad, dönem, birim, kaynak ve hesap anlamı | Sütun başlığı kaybolunca çıplak adet |
| T21 C12 | Klavye/ekran okuyucuyla kayıt açılır | Başlık–değer–açıklama ilişkisi programatik ve anlamlı | Görsel sıra olmadan anlaşılmaz içerik |
| T22 C32 | Genel sıfırlama onayı | Nesne, kapsam ve vazgeçme yolu; zaman baskısı gereksizse kaldırılır | Sadece “Emin misiniz?” |
| T23 C31 | On ilk ödeme hedefi gerçekleşir | Yalnız bu hedef doğrulanır | Tüm operasyonun kurulduğu hükmü |
| T24 C26 | Hazır ve özel senaryolar karşılaştırılır | Aynı dönem/metrik; farklı varsayımlar bilinir | Aynı ay ama farklı birimi kıyaslamak |

Tablodaki sayısal fixture’lar hesap açıklaması için **bağımsız küçük örneklerdir**; üretim modelinin tüm ayrıntılarını taklit eden sahte test motoru kurulmaz. Özellikle ilk ay sıfır değer gibi sınırlar “ilk kesişim” hesabını farklı yorumlatabiliyorsa model kararı ayrı kayıt altına alınır. Metin testiyle algoritma kusuru örtülmez.

### 8.3 Metamorfik kontroller

- Dönem uzadığında son yıl/ufuk adı, toplam kapsamı ve “ulaşılmadı” ifadesi birlikte güncellenmeli.
- Aylık abonelik fiyatı değişince personel maaşı etiketi veya maaş parametresi değişmemeli; model bağımlılıklarına göre ilgili ödeme sonuçları değişmeli.
- Yıllık peşin payı 0’dan100’e giderken payda yeni ödeme yapan satıcılar olarak kalmalı; toplam gelir payına dönüşmemeli.
- Kaynak yedeğe düşünce sayı korunmuş olsa bile kaynak durumu değişmeli; “canlı” etiketi otomatik kalmamalı.
- Aynı kaydı masaüstünden320’ye taşıyınca yardım anlamı, birim ve açık durum korunmalı; metin küçültülmemeli.
- Aynı içerik export edildiğinde varsayım ve birim düşerse test başarısız olmalı.
- Sıfır, negatif, bilinmeyen ve uygulanamaz durumları aynı kısa çizgiye çevrilmemeli.
- Tekil/çoğul ve1,0,çok sayılı varyantlarda “kişi”, “satıcı”, “değişiklik” doğal kalmalı.
- Persona sorusuna cevap vermeyi engelleyen bir koşul çıkarıldığında test başarısız olmalı: örneğin “bu tarayıcıya” bilgisini kaldırmak kayıt kapsamı testini kırmalı.

### 8.4 İnsanla anlama testi

Başlangıçta kritik görevleri temsil eden farklı ihtiyaçlardan katılımcılar seç; sayı yerine kapsamı ve tekrar eden yanlış yorumları izle. 40 personayı gerçek katılımcıyla doğrulanmış sayma. Araştırma ihtiyacı ve örneklem bütçesi ayrı belirlenir; “5 kişi bütün sorunları bulur” garantisi verme.

1. Görevi ver, alan terimini açıklama. Örnek: “Bu planı ortağınıza anlatacaksınız. Ne kadar para gerektiğini ve bunun neye bağlı olduğunu bulun.”
2. İlk yanıtı müdahalesiz kaydet. “Anladınız mı?” yerine “Bu sayı neyi gösteriyor?” sor.
3. Kullanıcıdan kendi sözcükleriyle anlatmasını ve bir karşı örneği ayırmasını iste: “Gelir gideri bu ay geçti; geçmiş açık kapanmış olur mu?”
4. İlk yanıtın doğruluğunu, yardımı, güvenini ve hatanın etkisini ayrı kaydet. Kendinden emin yanlış yanıt özellikle kritiktir.
5. Önce/sonra karşılaştırmada sıra ve öğrenme etkisini azalt: eşdeğer farklı örnekler, dengelenmiş sıra veya uygun gruplar kullan. Aynı kişiye aynı sayıyı yeniden sorup ezberi başarı sayma.
6. Sesli düşünmenin görevi yavaşlatabileceğini not et; süreyi doğal kullanım ölçümü gibi sunma. Güven puanını doğruluk yerine kullanma.
7. Yanlış anlamayı kullanıcı kusuru sayma; metin, kavram, model veya kompozisyon kök nedenine bağla.
8. Kritik yanlış yorum sürüyorsa ortalama yüksek diye yayımlama önerisi verme.

Katılımcı kaydı kişisel veriyi gereksiz toplamaz; gerçek maaş, personel veya finans bilgisi yerine kurmaca görev verisi kullanılır. Sentetik persona yanıtları hipotez üretir; erişilebilirlik ihtiyacı olan gerçek katılımcının yerine geçmez.

## 9. WCAG 2.2 AA ve bunun ötesinde anlaşılabilirlik

**WCAG AA uyumu, bütün insanların bütün finans metinlerini anladığını kanıtlamaz.** [WCAG 2.2](https://www.w3.org/TR/WCAG22/) uygunluğu sayfa ve tam süreç kapsamıyla değerlendirilir. Bu belge AA sertifikası veya tam denetim değildir. Aşağıdaki eşleştirme içerik değişikliklerinin erişilebilirlikle bağını gösterir; uygulama ve test kanıtı ayrıca gerekir.

| Konu | Bağlantı | Projede içerik kabulü |
|---|---|---|
| Başlık ve ilişki | 1.3.1 A; 1.3.2 A; 2.4.6 AA | Alan/başlık ilişkisi anlamlı; mantıksal sıra korunmuş; görsel komşuluk tek taşıyıcı değil |
| Yön ve renk | 1.3.3 A; 1.4.1 A | “Turuncu/sağdaki/üstteki” tek kimlik değil; adlandırılmış kontrol ve durum var |
| Etiket ve ad | 2.5.3 A; 4.1.2 A | Görünür etiket erişilebilir adın içinde; rol ve durum doğru; farklı eylem söylenmiyor |
| Girdi açıklaması | 3.3.2 A | Alanın ne istediği ve gerekli biçimi belli; yardım etiketin yerine geçmiyor |
| Hata | 3.3.1 A; 3.3.3 AA | Hangi girdide ne sorun olduğu ve bilinen düzeltme yolu belli; her ağ hatası bu girdi kriteri değildir |
| Önemli işlem önleme | 3.3.4 AA | Yalnız kapsamına giren finansal/veri işlemlerinde geri alınabilirlik, kontrol veya onay gereği değerlendirilir; her düğmeye zorunlu modal çıkarılmaz |
| Öngörülebilirlik | 3.2.2 A; 3.2.3 AA; 3.2.4 AA | Seçim sonuçları ve yinelenen işlev adları tutarlı; yeniden hesaplama bağlamı beklenmedik değiştirmiyor |
| Durum mesajı | 4.1.3 AA | Kayıt, kopyalama ve veri kaynağı durumu uygun biçimde bildiriliyor; her sayı değişimi kesintisiz duyuruya dönmüyor |
| Dil | 3.1.1 A; 3.1.2 AA | Ana dil doğru; yabancı dil bölümleri gerektikçe tanımlı; kısaltma açılımı tek başına yeterli değil |
| Görüntüleme | 1.4.4 AA; 1.4.10 AA; 1.4.12 AA | Büyütme, 320 CSS px reflow ve metin aralığı değişince anlam ilişkisi kaybolmuyor |
| Yardım | 3.2.6 A | Uygulanabilir tutarlı yardım mekanizmaları süreç boyunca aynı yerde; bu kriter her sayfaya yeni yardım hattı zorunluluğu değildir |

[Etiket/talimat açıklaması](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html), [görünür etiket–erişilebilir ad ilişkisi](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html), [girdi hatası önerisi](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html) ve [durum mesajları](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) farklı yükümlülüklerdir; iyi yazılmış paragraf eksik programatik ilişkiyi düzeltmez. Her güncellemede odağı mesaja taşımak da çözüm değildir.

**Önemli düzey ayrımı:** Okuma düzeyi **3.1.5 AAA** kriteridir; AA gereğiymiş gibi sunulmaz. Karmaşık içeriğe daha kolay açıklama sağlama hedefi bu projenin ek kabul kararı olabilir. [W3C okuma düzeyi açıklaması](https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html). Aynı şekilde alışılmadık sözcük ve kısaltma açıklamalarıyla ilgili AAA hedefler, AA etiketinin içine gizlenmemelidir.

[W3C COGA kullanılabilir içerik notu](https://www.w3.org/TR/coga-usable/) anlaşılır dil, matematik kavramları, hatırlama yükü ve bilişsel ihtiyaçları olan kullanıcıları sürece katma için ek rehberdir; WCAG uygunluğunun zorunlu ölçüt listesi değildir. Bu belgedeki persona yaklaşımı tanı koymak için kullanılmaz.

Uygulayıcı, erişilebilir accordion/sekme anlamını yalnız metinle çözmeye çalışmamalı. Başlık, açılma durumu ve panel ilişkisi erişilebilir biçimde kurulmalıdır; [APG accordion deseni](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) bir örnek sağlar. Grafik anlatısı ve mobil kayıt metni, aynı kararın anlaşılmasını korumalıdır.

Kullanıcı kararları korunur: Outfit genel tercih; tüm okunabilir metin en az14 CSS px; Giderler’e özgü15px ve mevcut font istisnası; kullanıcı kök boyutu küçültülmez; pill/switch ve onaylı istisnalar dışında radius0. Normal temada çevreleyen odak halkası yerine ortak sözleşmedeki görünür, çevrelemeyen klavye göstergesi korunur. İçerik uzadığı için metni küçültmek, kırpmak veya odağı silmek yasaktır. Hareket sözleşmesi ve reduced-motion istisnası metin önerileriyle değiştirilmez.

## 10. Claude için uygulanabilir yönergeler

### 10.1 Çalışmaya başlarken

1. Güncel commit’i, çalışma ağacını ve talimatları oku. Bu belgenin kaynak tabanı `1950925`; farklıysa C01–C32 alıntılarını yeniden doğrula. Geçmiş raporu mevcut hata kanıtı sayma.
2. Kullanıcının verdiği uygulama kapsamını belirle. Bu dosya kendi başına toplu kod, model veya altyapı değişikliği yetkisi değildir.
3. Alan sözlüğünü `revenue.ts`, `breakeven.ts`, `staffing.ts`, kaynak durumu ve depolama akışından doğrula. Yalnız görünür metinden formül uydurma.
4. Önce kritik anlam kapıları için kabul örnekleri yaz. Testin kaynağı yeni metin değil bağımsız model tanımı olsun.
5. Bir ifade için kayıt aç: C kimliği, kaynak, kullanıcı sorusu, yanlış yorum, yeni metin, etki kapsamı, kriterler, test ve belirsizlik.

### 10.2 Öncelik sırası

**İlk grup: yanlış finans ve kayıt anlamı.** C08–C11, C15–C21, C27–C28. Önce kaynak, dönem, tahsilat varsayımı, kümülatif/aylık, kayıt yeri ve sıfırlama kapsamı. Akıcı ama yanlış anlaşılan para metni, güzel olmayan paragraftan daha önceliklidir.

**İkinci grup: görev ve terim haritası.** C01–C07, C12–C14, C24–C26, C29–C31. İlk seçim, tanımlar ve ortak etiketler; görünür isim, erişilebilir ad ve dışa aktarma birlikte ele alınır.

**Üçüncü grup: biçim ve dil ayrıntıları.** C22–C23 ve bütün dinamik varyantlar. Bu grup önemsiz değildir; aynı değişiklikte kolay ve güvenli düzeltilebilir. Ancak doğru eki eklemek anlam modelini tek başına tamamlamaz. C32, hem dil hem etkileşim kapsamı nedeniyle ayrıca tasarlanır.

Sıralama sprint veya takvim taahhüdü değildir; risk bazlı karar kılavuzudur. Birinci gruptan çözülmemiş kapı varken sırf ortalamayı hızlı artıran yüzeysel metinlerle “tamamlandı” deme.

### 10.3 Her metin için zorunlu kontrol listesi

- Okurun gerçek sorusu nedir; bu ifade onu yanıtlıyor mu?
- Kim, ne, ne zaman, ne kadar, hangi birim, hangi koşul, hangi kaynak?
- Etiketin varlığı; alan, kontrol, çalışan, müşteri veya veri kaynağı mı?
- Bu bilgi bir tahmin, girdi, hedef, ölçüm veya gerçekleşmiş kayıt mı?
- En tehlikeli makul yanlış yorum nedir? Onu hangi sözcük/ilişki engelliyor?
- Açıklama her zaman görünmeli mi; ayrıntıya alınırsa yanlış karar doğar mı?
- İlgili düğme ve kayıt mesajı gerçek davranışı söylüyor mu?
- 320de, grafik eşdeğerinde, ekran okuyucuda ve CSV’de aynı anlam korunuyor mu?
- Dinamik değer, yüzde eki, birim ve tarih kaynakla birlikte güncelleniyor mu?
- Yeni ifade doğru ama fazla tekrarlı/yoğun mu; görevi geciktiriyor mu?
- Açık model kararı gereken noktaya metinle sahte kesinlik mi verdim?
- Kullanıcı testinde ne soracağım, hangi cevabı yanlış sayacağım?

### 10.4 Çıktı sözleşmesi

Her uygulama teslimi şu tabloyu içersin:

```text
Kimlik | önceki ifade | yeni ifade | anlam farkı | kaynak/formül
uygulanan kriterler | mevcut/sonra vektörleri | ham ortalama
kritik kapı | persona görevi | test/kanıt | PASS/FAIL/NOT_RUN/NOT_VERIFIED
```

“Sonra” puanı ancak yeni metin gerçekten ilgili bağlamda incelendiyse doldurulur. Hedef vektörü “sonra” diye kopyalanamaz. Gerçek kullanıcı deneyi yapılmadıysa anlama başarısı **NOT_RUN** kalır. Otomatik denetim geçti diye “herkes anlıyor” yazılamaz.

### 10.5 Yapılmaması gerekenler

- Her ifadeyi kısaltma; her etiketi cümle yapma; her cümleye özne veya zamir ekleme.
- Terimleri yalnız sözlükte açıklayıp kritik anlamı ekran dışında bırakma.
- “Sadeleştirdim” diye finans terimini yanlış eşanlamlıya çevirme.
- “Gerizekâlı bile anlar” gibi küçümseyici dili ürün metnine, persona adına veya test raporuna taşıma. Başarı ölçütü kullanıcının niteliği değil, görevin anlaşılabilirliğidir.
- Yeni açıklamayı uzun düğme, tooltip duvarı veya tüm ekranı kaplayan onboarding’e çevirme.
- Kaynakta olmayan tarih, garanti, hata nedeni, rol açılımı veya hesap kapsamı ekleme.
- Sıfırlama davranışı düzeltilmediyse yalnız yeni onay metniyle T22’yi geçti sayma.
- Aynı sorunu çok sayıda benzer kritere bölerek puanı manipüle etme.
- Yüksek ortalamayla kritik yanlış anlamayı gizleme; düşük ortalamayı sitenin bütün kullanıcılarının başarısızlığı diye sunma.
- Bütün personları LLM’ye canlandırıp sonuçlarını insan araştırması olarak raporlama.
- Kaynak sürümü değişirken eski içerik skorunu güncel skor sayma.

## 11. Üçüncü turun son kontrolü: raporun kendi açıklarını kapatmak

Son okumada C01–C32, önerileri ve puanlama birlikte yeniden kontrol edildi. Yalnız yazım düzeltmesi yapılmadı; aşağıdaki karşı itirazlar işlendi:

| Kontrol grubu | Yeniden bulunan risk | Bu belgede alınan karar | Hâlâ gereken kanıt |
|---|---|---|---|
| C01–C04 | Her şeyi tam cümle yapınca ilk seçim aşağı itilebilir | Amaç → kontrol → yakın yardım; uzun metin düğmeye konmaz | 320 görev deneyi |
| C05–C08 | “Aktif”i açıklamak stok/kümülatif ve gün/ay farkını çözmüyor | Ayrı kavram kimlikleri ve hedef günü/ay toplamı ayrımı | Alan sahibi doğrulaması ve T02/T06 |
| C09–C12 | “Tahsilat” daha sade ama gerçek banka hareketi sanılabilir | “Tahmini abonelik ödemesi”; muhasebe/gerçekleşme iddiası yok | Finans alan doğrulaması |
| C13–C16 | İstatistik ve LTV gibi adlar yanlış güven üretebilir | Preset adı istatistik değil; katkı karşıolgusal; canlı tek okuma değil | Gerçek kaynak/tazelik testleri |
| C17–C20 | Mevcut iyi hata yolu yokmuş gibi eleştirme; linki snapshot sanma | Tam mesaj bağlamı korunur; link kapsamı açık | T07–T12 |
| C21–C24 | Yeni metin yeni davranış varmış gibi yazılabilir | Öneri, mevcut gözlem ve uygulama gereği ayrılır | Depolama, erişilebilir ad ve LTV doğrulaması |
| C25–C28 | Koşulsuz olumlu/olumsuz ifade sınırları siler | Yüzde puan, ortak kıyas ve hesaplanamama nedeni ayrı | Sınır fixture’ları |
| C29–C32 | Modelde ölçülmeyeni değersiz sayma; onayı yalnız uzatma | Rol katkısı sınırı; sistem kabulü ayrı; onay etkileşimi ayrı | Alan kararı ve T17/T22/T23 |
| Puan sistemi |240 kriter varmış gibi görünür ama tek puan tekrarı olabilir |240 bağımsız değer açık; aynı12 soruyla32 karşılaştırma; algoritma aşağıda | İkinci değerlendirici uyumu henüz yok |
| Sonra puanı | Öneri metnine kazanılmış başarı yazmak | Hedef vektörleri ayrı, bütün hedefler NOT_VERIFIED | Uygulama ve yeni değerlendirme |
| Evrensel anlama |40 persona herkes adına konuşabilir sanılabilir | Sentetik kapsam; insan deneyi ve erişim ihtiyaçları ayrı | Gerçek katılımcılar |

Bu turda açıkça kalan sınır: Dil ölçütlerinin güvenirliği ampirik doğrulanmadı, bağımsız ikinci içerik incelemesi yapılmadı. Bunun yerine bütün puanlar, kapsam ve karşı sorular görünür bırakıldı. Bu sınırı “üç analiz yapıldı” ifadesi ortadan kaldırmaz. Üç tur kaynak ve metin öz incelemesidir; üç bağımsız uzman onayı değildir.

### 11.1 Sayıları yeniden hesaplama

Bu kısa kod **yalnız bu Markdown dosyasını okur**; puan üretmez veya uygulamayı değiştirmez. Kriter kimlikleri ve açık vektörlerden ortalamayı yeniden hesaplar. Başka araca veya geçici araştırma dosyasına bağımlı değildir:

```python
from pathlib import Path
import re

text = Path('ifade.md').read_text()
rows = re.findall(r'^\| (D\d{2})\.(\d{2}) \| [^\n]*? \| ([0-4]) \|$', text, re.M)
assert len(rows) == 240
assert len({(d, k) for d, k, _ in rows}) == 240
by_dimension = {}
for d, k, score in rows:
    by_dimension.setdefault(d, []).append(int(score))
assert len(by_dimension) == 24
assert all(len(v) == 10 for v in by_dimension.values())
means = {d: 25 * sum(v) / len(v) for d, v in by_dimension.items()}
print('Ana puan:', round(sum(means.values()) / len(means), 1))

sections = re.findall(r'^### (C\d{2}) —.*?\n(.*?)(?=^### |^## |\Z)', text, re.M | re.S)
assert len(sections) == 32
for cid, body in sections:
    vector = re.search(r'\*\*Mevcut:\*\* `([0-4]{12})`', body).group(1)
    print(cid, round(100 * sum(map(int, vector)) / 48, 1))
```

### 11.2 Kaynak başlangıçları ve takip

Kaynak satırları bu sürüm için aşağıda üretilmiştir. Dinamik alıntılarda ilgili şablonun başlangıcı kullanılır. Bir metin birden fazla yerdeyse ilk eşleşme başlangıç noktasıdır; gerçek değişiklikte bütün çağrılar aranmalıdır. Kalıcı kimlik C kaydıdır, satır numarası değildir.

| Kayıt | Kaynak ve başlangıç satırı |
|---|---|
| C01 | `src/views/RevenuePage.tsx:236` |
| C02 | `src/components/SenaryoKurucu.tsx:81` |
| C03 | `src/lib/scenarioOptions.ts:32` |
| C04 | `src/components/SenaryoKurucu.tsx:91` |
| C05 | `src/views/RevenuePage.tsx:245` |
| C06 | `src/views/RevenuePage.tsx:223` |
| C07 | `src/components/SenaryoKurucu.tsx:97` |
| C08 | `src/views/RevenuePage.tsx:56` |
| C09 | `src/views/RevenuePage.tsx:60` |
| C10 | `src/views/RevenuePage.tsx:181` |
| C11 | `src/views/RevenuePage.tsx:228` |
| C12 | `src/views/RevenuePage.tsx:245` |
| C13 | `src/components/SenaryoKurucu.tsx:92` |
| C14 | `src/lib/scenarioOptions.ts:32` |
| C15 | `src/views/RevenuePage.tsx:285` |
| C16 | `src/components/SenaryoKurucu.tsx:142` |
| C17 | `src/views/RevenuePage.tsx:160` |
| C18 | `src/components/SenaryoKurucu.tsx:70` |
| C19 | `src/components/SenaryoKurucu.tsx:73` |
| C20 | `src/components/SenaryoKurucu.tsx:73` |
| C21 | `src/views/ParamsPage.tsx:104` |
| C22 | `src/data/params.ts:193` |
| C23 | `src/views/RevenuePage.tsx:256` |
| C24 | `src/components/SenaryoKurucu.tsx:125` |
| C25 | `src/lib/scenarioOptions.ts:33` |
| C26 | `src/views/RevenuePage.tsx:306` |
| C27 | `src/views/RevenuePage.tsx:163` |
| C28 | `src/views/RevenuePage.tsx:164` |
| C29 | `src/views/RevenuePage.tsx:325` |
| C30 | `src/views/RevenuePage.tsx:290` |
| C31 | `src/data/revenue.ts:346`; görünüm: `src/views/RevenuePage.tsx` |
| C32 | `src/views/ParamsPage.tsx:92` |

**Teslim sınırı:** Yeni çıktı yalnız `ifade.md`. Uygulama kodu ve mevcut UX raporları değiştirilmedi; commit/push veya yayın yapılmadı. Tarayıcı metin yakalaması ve kaynak incelemesi yapıldı; insan anlama deneyi, tam erişilebilirlik denetimi ve uygulama test suite’i çalıştırılmadı.
