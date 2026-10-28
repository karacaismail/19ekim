# Affilate — Segika satış ortaklığı simülasyonu görev tanımı

Tarih: 28 Ekim 2026. Belge durumu: uygulama için görev tanımı; sayfa geliştirilmiş veya yayımlanmış değildir.

İncelenen proje: `site/`, `git pull --ff-only origin main` sonrasında `d5e6ed9`. Uygulamaya başlanırken güncel kaynak ve talimatlar yeniden kontrol edilir. Bu belge hazırlanırken uygulama kaynakları değiştirilmez.

**Son kullanıcı kararı:** Yüzde olarak belirtilen değerlerin tamamı düzenlenebilir input olmalıdır. `%10`, `%15`, `%25` ve `%0` dahil hiçbir komisyon oranı değiştirilemez iş kuralı olarak gömülmez. Fiyatlar, indirimler, süreler ve taksit sayıları da düzenlenebilir model girdileridir. Belgede verilen rakamlar başlangıç örnekleri ve test verileridir. Hesaplanan sonuçlar, bu girdilerden türetilir.

## 1. Görev

Segika'nın üç satış ortağı modelini aynı müşteri ve aynı satış koşulları üzerinden karşılaştıran, komisyonun nasıl hesaplandığını ve hangi ayda kazanılıp ödendiğini açıklayan bir simülasyon geliştir.

Sayfa, **Pazarlama → Affilate** menü öğesinden açılmalıdır. Sayfa adı ve menü etiketi kullanıcının istediği biçimde **Affilate**; yol `/affilate/`, mevcut site tabanıyla `/19ekim/affilate/` olmalıdır. Hedef yayın adresi `https://karacaismail.github.io/19ekim/affilate/` şeklindedir.

Kullanıcı aşağıdaki sorulara aritmetiği kendisi tamamlamadan yanıt bulmalıdır:

1. Bu müşterinin satışından hangi ortak, hangi koşulla komisyon kazanır?
2. Komisyon hangi tutarın yüzdesidir; bir faturaya mı, belirli aylara mı uygulanır?
3. Müşteri aylık veya yıllık ödediğinde toplam komisyon nasıl değişir?
4. Komisyonun ne kadarı kazanılmıştır; hangi tutar gelecekteki koşullara bağlıdır?
5. Ortağa bu ay ne kadar ödeme planlanır; sonraki aylara ne kalır?
6. İkinci dönemde oran değişirse eski satışın taksitleri ve yeni satışlar nasıl etkilenir?
7. Müşteri ödemez, geç öder, kısmen öder, ayrılır veya iade alırsa sonuç ne olur?
8. Çözüm ortağı müşteri desteğini sağlamazsa hangi tutar etkilenir?
9. Segika'nın tahsilatı, komisyon yükü ve komisyon sonrası tutarı nasıl değişir?

Bu bir varsayım ve karar simülasyonudur. Gerçek fatura düzenleme, banka ödemesi, otomatik tahsilat, canlı CRM entegrasyonu veya mevcut gelir planının mali verilerini değiştirme bu görevin kapsamına girmez. Arayüz, simüle edilen hareketleri gerçek işlem gibi sunmamalıdır.

## 2. Kararların kaynağı ve değiştirilebilirliği

| Konu | Başlangıç modeli | Kaynak / yorum | Arayüz sözleşmesi |
|---|---|---|---|
| Ayşe modeli | İlk faturanın komisyona esas tahsilatından %10 | Kullanıcının yazılı tarifi | Oran input; ilk fatura / süreli model seçilebilir |
| Satış ortağı | İlk 12 ay %15, sonraki 12 ay %10, ardından %0 | Kullanıcının birinci, ikinci, üçüncü yıl tarifi | Her oran ve dönem uzunluğu input |
| Çözüm ortağı | İlk 12 ay %25, sonraki 12 ay %15 | Yazılı tarif; destek ortağa ait | Her oran ve dönem uzunluğu input |
| Çözüm ortağı ikinci dönem | Başlangıç %15 | Fotoğrafta %10, yazıda %15 var; kullanıcı ikisinin de varsayılan olabileceğini, alanın değiştirileceğini netleştirdi | %10 veya başka oran girilebilir; onay bekleyen karar sayılmaz |
| Çözüm ortağı üçüncü dönem | Başlangıç %0 | Kullanıcı bu dönemi belirtmedi; bu belge için önerilen örnek | Düzenlenebilir input; “Örnek başlangıç değeri” açıklaması |
| Müşterinin ödeme koşulu | Fatura var ve Segika tahsilat yapmış | Kullanıcının koşulu | Fatura ile ödeme ayrı olaylar; tutarları ve zamanları ayrı girilir |
| Yıllık ödemede ortak takvimi | Aylık hakediş ve aylık ödeme | Satış ortağı tarifini somutlaştıran önerilen başlangıç | Alternatif kazanma/ödeme modelleri seçilebilir |
| “10 y / 12 ay” | 10 aylık fiyat karşılığında 12 aylık hizmet | 100 / 1.000 örneğiyle uyumlu yorum; kesinleşmiş anlam diye sunulmaz | Fiyatın kaç aylık ücrete eşit olduğu ve hizmet süresi ayrı input |
| Tahtadaki “12 satış”, kırmızı yüzdeler ve piramit | Çekirdek hesapta kullanılmaz | Yazılı görevde şart olarak açıklanmamış notlar | Kendiliğinden satış kotası, ağ primi veya alt ortak komisyonu üretilmez |

Fotoğraf üç ayrı ortak profili fikrini destekler. Fotoğraftan yeni ticari zorunluluk çıkarılmaz. Kullanıcının son düzeltmesi gereği bütün oranlar başlangıç değeridir; profil kartlarında yalnız okunabilir metin olarak bırakılmaz, ilgili düzenleme alanına erişilir.

“Zorunlu” ifadeler bu görevde teslim koşuludur. “Önerilen başlangıç” ürünün ilk açılış davranışıdır; onaylanmış ticari sözleşme iddiası değildir. “İsteğe bağlı” maddeler temel teslimin önüne geçmez.

## 3. Personalar: kişinin mesleği değil, üstlendiği sorumluluk

Bu personalar araştırmayla doğrulanmış gerçek kişiler değil, kullanıcı tarifinden oluşturulmuş kullanım senaryolarıdır. Meslek, yaş, cinsiyet veya eğitim düzeyi ortaklık türüne giriş koşulu yapılmaz.

### P01 — Ayşe: tek satıştan kazancını görmek isteyen kişi

- **Rolü:** Ürünü çevresine anlatır, müşteri kazandırır. Evden çalışan, esnaf, öğrenci veya başka bir meslekten olabilir.
- **Başarı olayı:** Kazandırdığı müşterinin ilk uygun faturası için Segika'ya ödeme gelmesi.
- **Başlangıç kazancı:** İlk faturanın tahsil edilen komisyon bazının %10'u. Aylık faturada bir ayın, yıllık faturada yıllık tutarın yüzdesi.
- **Destek sorumluluğu:** Başlangıç modelinde Segika'da.
- **Temel sorusu:** “Bu müşteriden toplam ne kazanacağım ve ne zaman alacağım?”
- **Yanlış anlama riski:** İlk faturadan %10 kazanmayı her ay sürecek %10 olarak yorumlamak.
- **Arayüz ihtiyacı:** İlk faturanın tutarı, tahsil edilen kısmı, oran, toplam komisyon ve ödeme zamanı yan yana açıklanır. Yenilemelerin kazanç oluşturmadığı görünür olmalıdır.
- **Kabul örneği:** 100 TL ilk aylık faturanın tamamı ödendiğinde 10 TL; aynı müşteri sonraki ay 100 TL daha ödediğinde yeni komisyon 0 TL. 1.000 TL ilk yıllık fatura ödendiğinde toplam 100 TL.

### P02 — Satış ortağı: müşteri portföyünün dönemsel kazancını izleyen kişi

- **Rolü:** Düzenli müşteri kazanımı yürütür; satış ve yenileme ilişkisini takip eder.
- **Başlangıç kazancı:** Müşterinin ilk 12 ayında %15, sonraki 12 ayında %10; daha sonraki dönemde %0.
- **Destek sorumluluğu:** Başlangıç modelinde Segika'da.
- **Temel sorusu:** “Portföyümden bu ay ne kazanacağım; ikinci döneme geçen müşteriler toplamı nasıl değiştiriyor?”
- **Yanlış anlama riski:** Yıllık faturanın %15'ini her ay yeniden kazanmak veya taksiti yeni bir komisyon sanmak.
- **Arayüz ihtiyacı:** Müşteri yaşı, geçerli dönem, faturanın toplam komisyonu ve bu ayki hakediş ayrı gösterilir.
- **Kabul örneği:** Aylık 100 TL tahsilatta 15 TL; yıllık 1.000 TL tahsilatta ilk dönem toplam 150 TL, 12 ay dağılımında aylık 12,50 TL.

### P03 — Çözüm ortağı: satışla birlikte müşteri desteği sağlayan kişi / kuruluş

- **Rolü:** Satış yapar ve kendisine atanmış müşterinin desteğini üstlenir.
- **Başlangıç kazancı:** İlk 12 ay %25, sonraki 12 ay %15; üçüncü dönem için örnek %0.
- **Temel sorusu:** “Destek verdiğim müşterilerin komisyonu ne kadar; destek kesintisi veya devir kazancımı nasıl etkiliyor?”
- **Yanlış anlama riski:** Destek sorumluluğunun yalnız tanıtım metninde kalması, hesapta hiçbir koşulu değiştirmemesi.
- **Arayüz ihtiyacı:** Desteğin kimde olduğu, dönemlik destek durumu ve bunun hakedişe etkisi görünürdür. Kullanıcı destek maliyeti de girebilir.
- **Kabul örneği:** Yıllık 1.000 TL, %25 ve koşulları sağlanan 12 ay için toplam 250 TL. Aylık dağılım kuruş dengelemesiyle yapılır; toplam 250 TL kalır.

### P04 — Segika yöneticisi: üç modeli aynı ölçekte karşılaştıran kişi

Üç ortak tipine aynı müşteri fiyatı, ödeme düzeni, başlangıç tarihi, tahsilat olayları ve inceleme dönemi uygulanır. Oran dışında destek yükü ve zamanlama farkı da görünürdür. Kullanıcının amacı yalnız en düşük komisyonu bulmak değildir; müşteri edinme ve destek sorumluluğuna karşılık hangi ödeme modelinin daha uygun olduğunu değerlendirmektir.

Persona seçmek sözleşme kurallarını yükleyen bir başlangıç kısayoludur. Kullanıcının değiştirdiği oran, süre veya koşul kaybolmaz; farklı profile geçişte değişiklik kapsamı görünür olur ve geri alınabilir.

## 4. Matematikteki karışıklığı çözen sözlük

| Terim | Kesin anlamı | Aynı anlamda kullanılmayacak terim |
|---|---|---|
| Fatura tutarı | Müşteriye düzenlenen faturanın tutarı | Tahsilat |
| Tahsilat | Müşteriden gerçekten geldiği varsayılan ödeme | Fatura, hakediş |
| Komisyona esas tutar | Seçili politika uyarınca tahsilatın komisyon hesabına giren bölümü | Ortağa ödenecek tutar |
| Planlanan toplam komisyon | Bütün ödeme ve hizmet koşulları gerçekleşirse oluşacak toplam | Kesin kazanılmış hakediş |
| Kazanılan komisyon / hakediş | Seçili kazanma koşulları sağlanmış tutar | Henüz koşula bağlı gelecek tutar |
| Ödeme planı | Hakedişin ortağa hangi tarihlerde aktarılacağının simülasyonu | Yeni kazanç |
| Ödeme hareketi | Simülasyonda gerçekleşti olarak işaretlenen ortak ödemesi | Banka transferi kanıtı |
| Aylık eşdeğer | Paket tutarının kapsadığı hizmet aylarına bölümü | Aylık tahsilat veya aylık komisyon |
| Komisyon sonrası tutar | Komisyona esas net tahsilat eksi ilgili komisyon | Şirketin net kârı |
| Dönem | Müşterinin abonelik başlangıcından itibaren tanımlanan süre | Otomatik olarak takvim yılı |

Faturanın düzenlenmesi, müşterinin ödeme yapması, ortağın hakediş kazanması ve ortağa ödeme yapılması ayrı olaylardır. Hesap ve arayüz bunları tek “ödendi” alanına sıkıştırmamalıdır.

### 4.1 100 TL / 1.000 TL / 12 ay örneği

Örnek girişler: aylık fiyat 100 TL, paket hizmet süresi 12 ay, yıllık paket fiyatı 1.000 TL, oran %10.

| Hesap | Sonuç | Ne anlatır? |
|---|---:|---|
| 100 × 12 | 1.200 TL | İndirim olmadan 12 aylık toplam fiyat |
| 1.000 ÷ 100 | 10 ay | Yıllık paketin fiyatı, 10 adet aylık ücrete eşit |
| 1 − 1.000 ÷ 1.200 | yaklaşık %16,67 | Yıllık paketin 12 aylık liste toplamına göre indirimi |
| 1.000 ÷ 12 | yaklaşık 83,33 TL | Yıllık paket fiyatının aylık eşdeğeri |
| 100 × %10 | 10 TL | 100 TL'lik aylık faturanın komisyonu |
| 1.000 × %10 | 100 TL | 1.000 TL'lik yıllık faturanın toplam komisyonu |
| 100 ÷ 12 | yaklaşık 8,33 TL | 100 TL komisyon 12 taksite bölünürse aylık ödeme |
| 1.000 × %15 ÷ 12 | 12,50 TL | Satış ortağının yıllık paket komisyonunun aylık dağılımı |

**83,33 TL komisyon değildir.** Paketin aylık fiyat eşdeğeridir. %10 uygulandığında aylık komisyon eşdeğeri yaklaşık 8,33 TL olur. “Yaklaşık” değerler hesap motoruna geri beslenmez; kuruş dağıtımı §8'de tanımlanır.

İlk faturadan ödeme modelinde Ayşe'nin aylık satıştan 10 TL, yıllık satıştan 100 TL kazanması matematik hatası değildir. İlk faturanın kapsamı farklıdır. Ticari olarak istenmiyorsa komisyonun kapsadığı satışlar değiştirilir; yüzde veya bölme işlemi gizlice değiştirilmez.

### 4.2 Birbirinden bağımsız dört süre

| Düzenlenebilir girdi | Başlangıç örneği | Etkisi |
|---|---:|---|
| Paket fiyatının karşılığı olan aylık ücret sayısı | 10 | Yıllık fiyatı hesaplar: 100 × 10 |
| Paketin hizmet süresi | 12 ay | Müşterinin aldığı hizmet ve aylık eşdeğer |
| Komisyon oranının geçerli olduğu dönem | 12 ay | Birinci oranın hangi ayda biteceği |
| Komisyonun ödeme taksiti sayısı | 12 | Önceden kazanılan komisyonun ödeme planı |

Bunların hiçbirine tek başına “ay sayısı” etiketi verilmez. Biri değişince diğerleri gerekçesiz değiştirilmez. Hizmet süresi 12'den farklı yapıldığında arayüz “yıllık paket” yerine “N aylık paket” yazar. Oran dönemi değiştirilirse “1. yıl” yerine “1. dönem · N ay” denir.

## 5. Seçilebilir model seçenekleri

### 5.1 Paket fiyatını belirleme

Bir anda yalnız bir fiyat kaynağı aktiftir. Kaynak değişimi eski girdileri silmez; hangi girdinin hesapta kullanıldığı görünürdür.

| Seçenek | Düzenlenebilir girdi | Formül |
|---|---|---|
| Paket fiyatını gir | Paket tutarı `A` | `A` doğrudan kullanılır |
| Aylık fiyatın katı | Aylık fiyat `P`, ücret sayısı `K` | `A = P × K` |
| İndirim oranıyla hesapla | `P`, hizmet ayı `H`, indirim `%d` | `A = P × H × (1 − d/100)` |
| İndirimsiz hesapla | `P`, `H` | `A = P × H` |

Başlangıç örneği `P=100`, `K=10`, `H=12` olabilir. `%16,67` bu modda türetilen bir sonuçtur. Kullanıcı indirimi doğrudan değiştirmek isterse “İndirim oranıyla hesapla” moduna geçer. Aynı anda hem paket fiyatını hem indirimi bağımsız doğru değerler gibi tutarak çelişkili hesap kurulmaz.

### 5.2 Hangi satışlar komisyon kazandırır?

| Seçenek | Davranış | Başlangıçta kullanıldığı model |
|---|---|---|
| İlk fatura | İlk uygun faturanın tahsil edilen komisyon bazına bir kez uygulanır; o faturanın kısmi ödemeleri aynı hakka bağlıdır | Ayşe |
| Belirli süre boyunca | Müşterinin başlangıcından itibaren oran-dönem matrisine göre uygun faturaları kapsar | Satış ortağı, çözüm ortağı |

Ayşe için süreli seçenek açılırsa kullanıcı artık farklı bir ticari model denediğini görür: “İlk fatura yerine seçtiğiniz dönemlerdeki ödemeler komisyon kazandırır.” Örneğin ilk 12 ay boyunca %10 seçmek, aylık 100 TL'nin düzenli ödendiği müşteriden 120 TL; yıllık 1.000 TL'den 100 TL üretir. Aradaki 20 TL fark paket indiriminden kaynaklanır.

**Karşılaştırma seçeneği:** Aylık/yıllık faturalandırmanın etkisini izole etmek için kullanıcı “eşit toplam müşteri fiyatı” örneğini seçebilir; 12 × 100 = 1.200 TL ile yıllık 1.200 TL karşılaştırılır. Bu kısayol fiyat girdisini görünür biçimde değiştirir. 1.000 TL'lik tahsilatı gizlice 1.200 TL gibi fiyatlamaz. Tek fatura kuralı ile süreli kuralın etkisi ayrıca gösterilir.

### 5.3 Komisyon ne zaman kazanılır ve ne zaman ödenir?

Tek bir “aylık / yıllık” anahtarı bu üç seçimi temsil edemez. Aşağıdaki politika seçicisi, birbiriyle tutarlı kazanma ve ödeme çiftleri sunar.

| Politika | Hakedişin doğduğu an | Ortağa ödeme planı | Önerilen kullanım |
|---|---|---|---|
| Tahsilatta kazan, aynı ay öde | Uygun fatura tahsilatı geldiğinde | Aynı ay; varsa ayrıca girilmiş gecikme sonrasında | Ayşe başlangıcı |
| Her hizmet ayı sonunda kazan ve öde | Tahsil edilmiş tutardan ilgili hizmet ayına düşen bölüm, ay tamamlanınca | Kazanılan tutar o ay; varsa gecikme sonrasında | Satış ve çözüm ortağı başlangıcı |
| Tahsilatta kazan, taksitlerle öde | Uygun tahsilat geldiğinde toplam hakediş | Kullanıcının girdiği `N` taksit | Peşin hak + vadeli ortak ödemesi alternatifi |

Ödeme gecikmesi ayrı inputtur; başlangıç `0 ay`. Taksit sayısı üçüncü politikada inputtur. İkinci politikada dağıtım, faturanın hizmet ayları üzerinden yapılır; aylık hakedişi yeniden 12 taksite bölerek yanlışlıkla 144 parçalık takvim oluşturulmaz.

Yıllık 1.000 TL ve %15 için ikinci politikada 150 TL **planlanan toplam**, ilk hizmet ayı sonunda 12,50 TL **kazanılan tutar** oluşur. Üçüncü politikada tahsilat anında 150 TL kazanılır, 12 taksitte aylık 12,50 TL ödenir. Nakit akışı benzer görünse de kazanılmış borç ve geleceğe bağlı tutar aynı değildir.

### 5.4 Oran-dönem matrisi

Her hücre gerçek sayısal inputtur; rozet veya sabit metin değildir. `%0` da düzenlenebilir. Temel tabloda oranlar ve süreler her ortak için ayrı değiştirilebilir; ortak varsayılan süreleri kullanma seçeneği olabilir.

| Model | 1. dönem süresi | 1. dönem oranı | 2. dönem süresi | 2. dönem oranı | 3. dönem süresi | 3. dönem oranı | Sonraki dönemler |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ayşe / ilk fatura | Uygulanmaz | %10 | Uygulanmaz | Uygulanmaz | Uygulanmaz | Uygulanmaz | Yeni faturaya hak yok |
| Satış ortağı | 12 ay | %15 | 12 ay | %10 | 12 ay | %0 | Örnek %0; input |
| Çözüm ortağı | 12 ay | %25 | 12 ay | %15 | 12 ay | %0 | Örnek %0; input |

Ayşe süreli modele geçirilirse kendi dönem matrisi açılır. İlk fatura modunda anlamsız yıl alanları gösterilmez. “Uygulanmaz” ile sıfır oran aynı şey değildir.

İlk üç dönem ilk sürümde zorunludur. Ek dönem ekleme ve kaldırma desteklenmelidir; dönemler ardışık hesaplanır, çakışan tarih aralıkları oluşturulmaz. Sonrasının oranı açık bir inputtur; son satırın sonsuza kadar kendiliğinden tekrar ettiği varsayılmaz.

## 6. Düzenlenebilir girdilerin tam sözleşmesi

**Bir iş kuralını etkileyen örnek sayı, yalnız metinde kalamaz.** Kart, açıklama, grafik, tablo ve hesap dökümü aynı durumdan türetilir. Kullanıcı bir değeri değiştirince eski varsayılanı anlatan açıklama ekranda kalmamalıdır.

| Girdi grubu | Kullanıcının değiştireceği alanlar | Koşul / doğrulama |
|---|---|---|
| Model | Ortak türü, ilk fatura / süreli kapsam, destek sorumlusu | Model seçimi oranları düzenleme hakkını kapatmaz |
| Oranlar | Her dönemin komisyon yüzdesi, sonraki dönemlerin oranı | Sonlu sayı, 0–100 arası, yüzde için iki ondalığa kadar |
| Dönemler | Her oran döneminin ay sayısı | Pozitif tam sayı; toplam simülasyon sınırı görünür |
| Fiyat | Para birimi, aylık fiyat, paket fiyatı veya katsayı/indirim | Negatif olamaz; seçilen fiyat moduna göre etkin alanlar |
| Hizmet | Paket hizmet süresi, abonelik başlangıç tarihi | Süre pozitif tam ay; geçerli tarih |
| Fatura | Aylık / paket, fatura tarihi, hizmet başlangıcı ve kapsamı, tutar | Hizmet dönemleri ve yenilemeler izlenebilir |
| Tahsilat | Ödeme tarihi, ödenen tutar, ödenmemiş veya kısmi durum | Toplam ödeme faturayı aşamaz; fazla tahsilat bu sürümde hata |
| Komisyon bazı | Tahsil edilmiş toplam / hariç kalemler düşülmüş tutar | Hariç kalemlerin tutarı input; net baz negatif olamaz |
| Kazanma ve ödeme | §5.3 politikası, taksit sayısı, ödeme gecikmesi | Taksit pozitif tam sayı; gecikme negatif olmayan tam ay |
| Destek | Desteği sağlayan taraf, ay bazında aktif / sağlanmadı / belirsiz | Durum seçilmediyse başarılı destek varsayılmaz |
| Destek ihlali | İlgili ay kazanma / bekletme seçeneği | Başlangıç: sağlanmayan ay hak kazandırmaz; belirsiz ay bekler |
| Destek maliyeti | Segika'nın ve çözüm ortağının müşteri başına aylık destek maliyeti | Başlangıçta maliyet hesabı kapalı; açıldığında input. Girilmemiş tutar ile açıkça girilmiş 0 ayrı |
| İptal | İptal tarihi, hizmetin biteceği ay | İptal, otomatik para iadesi değildir |
| İade | İlgili tahsilat/fatura, tarih, tutar | Net tahsilatı aşamaz; bağlantılı komisyon yeniden hesaplanır |
| Portföy | Müşteri grubu adedi, başlangıç ayı, aylık/paket ödeme dağılımı | Adet tam sayı; aynı müşteri iki kez sayılmaz |
| İnceleme | Görüntülenen ay, simülasyon ufku | Örnek 36 ay; input; daha sonraki yükümlülükler saklanmaz |

Sayısal alanlarda Türkçe virgüllü giriş desteklenir. `%12,5` ile `12,5` hangi kontrol biçiminde kabul ediliyorsa açık ve tutarlı işlenir. Yüzde değeri `15`, motor oranı `0,15` olabilir; dönüşüm tek yerde yapılır. `15` doğrudan 15 kat olarak kullanılamaz.

Boş giriş sıfıra çevrilmez. Kullanıcı `1,` yazarken hesap motoruna bozuk değer gönderilmez; son geçerli hesap ve “Giriş tamamlanmadı” durumu korunur. Sınır dışı değer sessizce en yakın sayıya çekilmez. Hata alanla ilişkilendirilir ve düzeltme anlatılır.

Başlangıç senaryosu için 36 ay, en fazla 120 ay; en fazla 100 müşteri grubu önerilen teknik çalışma sınırlarıdır. Bunlar ticari kural değildir. Uygulayıcı bu sınırları gerçek performans kontrolüyle doğrular veya gerekçesiyle değiştirir; sessiz kesme yapmaz. Gerçek müşteriler yerine adetsel gruplar kullanmak büyük portföylerde hesap yükünü sınırlar.

## 7. Hesap motorunun iş kuralları

### 7.1 Sıralı hesap

1. Girdiyi doğrula; para birimini, tarihleri ve hangi fiyat kaynağının etkin olduğunu belirle.
2. Müşteri veya aynı koşulları paylaşan müşteri grubunun faturalarını ve hizmet aylarını oluştur.
3. Tahsilatları faturayla ilişkilendir; iade ve hariç kalemleri ayırarak komisyon bazını hesapla.
4. Müşterinin abonelik başlangıcına göre her hizmet ayının komisyon dönemini bul.
5. İlk fatura / süreli kapsam koşulunu uygula; destek uygunluğunu değerlendir.
6. Planlanan komisyonu ve tahsilata bağlı kısmı ayrı hesapla.
7. Seçilen kazanma politikasıyla hakedişi, ödeme politikasıyla takvimini oluştur.
8. Simüle edilen ödeme hareketlerini uygula; ödenecek bakiye ve varsa geri alınacak tutarı bul.
9. Aynı hareket defterinden müşteri, ortak, dönem ve Segika özetlerini üret.
10. Her sonuç için girdilere kadar izlenebilen kısa hesap açıklaması oluştur.

Bir yüzdeyi değiştirmek bütün kurgusal senaryoyu yeni varsayımla yeniden hesaplar; kullanıcı “önce / sonra” farkını görür. Bu, gerçek geçmiş hakedişleri değiştiren operasyon olarak sunulmaz. Senaryodaki tarihli tahsilat ve iade olayları korunur; bunlardan türetilen hareketler yeniden üretilir. Kaydedilmiş karşılaştırma senaryosu kendi girdileriyle sabit kalır.

### Komisyon bazının açık hesabı

Fatura tutarı `F`, komisyon dışında tutulan fatura kalemleri toplamı `X`, iadeler sonrası net müşteri tahsilatı `Q` olsun. Başlangıçta `X=0` örneği kullanılabilir; bu da düzenlenebilir inputtur.

```text
faturanın komisyon bazı = F − X
tahsil edilmiş komisyon bazı = (F − X) × Q / F
```

Koşullar: `0 ≤ X ≤ F`, `0 ≤ Q ≤ F`. `F=0` ise baz ve komisyon sıfırdır; bölme yapılmaz. Kısmi ödeme ve iade, başlangıç politikasında fatura kalemlerine oransal dağıtılır. Örneğin 120 TL fatura, 20 TL hariç tutar ve 60 TL tahsilat için komisyon bazı 50 TL'dir; %15 komisyon 7,50 TL olur. Özellikle bir hariç kalemin iadesini ayrı ele almak istenirse kalem bazında eşleme gerekir; desteklenmeyen bu ayrıntı sessizce oransal sonuç gibi doğrulanmış sayılmaz.

Ödeme parçaları için ayrı ayrı yuvarlanmış yüzdeleri toplama. Fatura bazında kümülatif tahsilata ait komisyonu hesapla; yeni hakediş adayını önceki kümülatif sonuçtan fark alarak üret. Böylece ödemenin iki veya on parçaya bölünmesi toplam komisyonu değiştirmez.

### 7.2 Dönem sınırı ve oran

Komisyon yaşı müşteri bazlıdır. 15 Mart'ta başlayan bir müşteri, takvim 1 Ocak olduğunda ikinci yıla geçmez. Varsayılan 12 aylık dönem, başlangıç tarihinin 12 ay sonraki yıldönümünde biter. Aralıklar başlangıcı içerir, bitişi içermez.

Ay ekleme, ilk tarihin gününe göre hesaplanır; ay sonu gerekiyorsa o ayın son geçerli günü kullanılır. 31 Ocak → Şubat sonu → 31 Mart; Şubat'tan tekrar ay ekleyip bütün sonraki ayları 28'e kaydırma. Saat dilimi nedeniyle tarih bir gün geriye taşınmamalıdır.

Hizmet ayı ile raporun takvim ayı ayrı tutulur. 15 Mart–15 Nisan hizmet dönemi için ay sonunda kazanma olayının tarihi 15 Nisan'dır; hareket Nisan takvim raporuna girer. Döküm, kazancın hangi hizmet aralığına ait olduğunu ayrıca gösterir. Aynı tarihte olay işleme sırası deterministiktir: fatura ve düzeltmeleri → tahsilat/iade → destek/hizmet durumu → hakediş farkı → simüle edilen ortak ödemesi. Ödeme, o ana kadar kazanılmamış bir tutarı kendiliğinden avans olarak ödeyemez.

Oran, **ödemenin bankaya geldiği aya veya ortağa taksit ödendiği aya değil, ilgili hizmet dönemine** bağlıdır. Birinci dönemde kazanılmış komisyonun ikinci dönemde ödenen taksiti ikinci dönem oranıyla yeniden hesaplanmaz. Tahsilat gecikirse uygun hizmet döneminin oranı korunur.

Faturanın hizmeti iki oran dönemini kapsıyorsa baz hizmet aylarına eşit dağıtılır ve her ayın oranı uygulanır. Eşit olmayan ücretli hizmet ayları ilk sürümde desteklenmiyorsa giriş açıkça reddedilir; sessiz yaklaşık hesap yapılmaz. Gün bazında kısmi hizmet hesabı bu sürümün varsayılanı değildir; başlangıç, yenileme ve iptal hizmet ayı sınırlarıyla modellenir.

### 7.3 İlk fatura kimliği

Ayşe için ilk uygun fatura, müşterinin ilk pozitif tutarlı, geçerli abonelik faturasıdır. Ücretsiz deneme faturası hakkı tüketmez. Daha sonraki fatura önce ödendi diye “ilk fatura” kimliği değişmez. İlk faturanın kısmi tahsilatları birleştirilir; her parça yeni satış sayılmaz.

Komisyon oluştuktan sonra yapılan iade, bir sonraki faturayı yeni bir ilk faturaya dönüştürmez. Tahsilat öncesi tamamen iptal edilmiş faturanın yerine kesilen düzeltme faturası aynı ilk satış bağlantısını korur. Yeni bir müşteriyle aynı müşterinin yeniden aboneliğe başlaması ayrıdır; yeniden abonelik komisyon yaşını başlangıçta sıfırlamaz.

### 7.4 Kısmi ve gecikmiş tahsilat

Başlangıç önerisi: yalnız tahsil edilmiş komisyon bazının yüzdesi hesaba katılır; ödenmemiş kısım kazanılmış tutara girmez.

- İlk fatura 100 TL, tahsilat 40 TL, oran %10 → tahsilatta kazanma politikasında 4 TL. Kalan 60 TL geldiğinde ek 6 TL.
- Paket 1.000 TL, tahsilat 400 TL, oran %15 → bu tahsilata bağlı toplam komisyon 60 TL.
- Aylık hakediş politikasında bu 60 TL, 12 hizmet ayına dağıtılır: her tamamlanan uygun ay için 5 TL. Kalan ödeme geldiğinde geçmiş uygun ayların farkı o tarihte ek hakediş olarak doğar; geçmişte para gelmiş gibi tarih değiştirilmez.
- Tahsilatta kazanma + taksit politikasında her yeni tahsilatın komisyonu kendi `N` taksitli planını başlatır. Planlar üst üste gelebilir; toplam ve hangi tahsilata ait oldukları görünürdür.

### 7.5 Destek koşulu

Destek durumu müşteri ve hizmet ayı bazında kaydedilir. Başlangıç politikası: `aktif` ay uygundur, `sağlanmadı` ay uygun değildir, `belirsiz` ay bekletilir. Destek sağlanmadığı için kendiliğinden %25 yerine %15 uygulanmaz; böyle bir indirim kullanıcı tarafından ayrıca seçilmedikçe yeni oran icat edilmez.

“Beklet” alternatifi seçilirse ilgili tutar kazanılmış ödeme borcuna eklenmez; açıklama “Destek sonucu bekleniyor” olur. Kullanıcı durumu çözdüğünde hangi geçmiş ayın tutarının serbest bırakıldığı görünürdür.

Önce bütün hizmet aylarının komisyon paylarını oluştur, sonra ayın uygunluk koşulunu uygula. Uygun olmayan ayın payını kalan aylara dağıtma. Örneğin 250 TL'nin 12 aylık takvimindeki ilk ayın 20,83 TL payı destek sağlanmadığı için kazanılmıyorsa kalan 11 ayın toplamı 229,17 TL'dir; yeniden 250 TL'ye tamamlanmaz. Bekleyen ayın payı ise ayrı durumda tutulur.

Gelecek destek koşulu olan çözüm ortağı için başlangıç kazanma politikası aylık olmalıdır. Kullanıcı “tahsilatta kazan” seçerse gelecekte sağlanmayacak desteğin komisyonu geri alma düzeltmesi oluşturabileceği seçim yanında açıklanır. Bu politika sadece ödeme takvimini değiştiren masum bir görünüm seçeneği gibi sunulmaz.

Destek maliyeti girilirse çözüm ortağının komisyonundan kendi destek maliyeti düşülerek “destek maliyeti sonrası tutar” hesaplanır. Vergi, personel, altyapı ve diğer giderler modellenmediyse sonuç “net kâr” olarak adlandırılmaz.

### 7.6 İptal, iade ve geçmiş kayıtlar

- Abonelik iptali gelecek faturaları durdurur. Önceden tahsil edilmiş parayı kendiliğinden iade etmez.
- Aylık kazanma politikasında hizmetin bittiği aydan sonraki koşullu hakediş oluşmaz. Geçmiş uygun ayların hakkı, iade veya düzeltme yoksa korunur.
- Tahsilatta kazanılmış ve taksitlenen komisyon, sırf abonelik iptal edildi diye sıfırlanmaz; bağlantılı iade veya açık destek düzeltmesi gerekir.
- İade, faturanın net komisyon bazını azaltır. İlgili politika ve hizmet aylarıyla yeni toplam hesaplanır; fark, iade tarihli düzeltme hareketidir.
- Ödenmiş ortak tutarı yeni net hakedişi aşarsa fark “Geri alınacak / sonraki ödemelerden mahsup edilecek” olarak ayrı görünür. Negatif tutar sıfıra kırpılıp kaybedilmez; gerçek tahsilat yapılmış sayılmaz.
- İade hareketi, fatura/tahsilat ve ilgili komisyon hareketine kimlikle bağlıdır. Aynı olay iki kez içeri alınırsa ikinci kez uygulanmaz.

Örnek: yıllık 1.000 TL, %15, aylık kazanma; üç ay sonunda 37,50 TL kazanılmış ve simülasyonda ödenmiş olsun. Hizmet devam ederken 200 TL kısmi iade gelirse net baz 800 TL, yeni aylık hakediş 10 TL, ilk üç ayın toplamı 30 TL olur. İade ayında −7,50 TL düzeltme ve 7,50 TL geri alınacak bakiye görünür. İptal ayrıca girilmedikçe gelecek hizmet ayları devam eder.

### 7.7 Tek müşteri, tek atıf

Başlangıç modeli bir müşteriyi bir ortağa bağlar. Karşılaştırma görünümünde üç model, **aynı satışın alternatifleri** olarak hesaplanır; %10 + %15 + %25 toplanıp tek müşteriden %50 komisyon çıkmaz.

Portföy görünümünde farklı müşteriler farklı ortaklara atanabilir. Ortak türü değişimi için bu sürümde en açık başlangıç, yeni politika ile ayrı senaryo karşılaştırmaktır. Geçmiş hareketleri sessizce yeni profile taşımak veya kendiliğinden alt ortak/sponsor primi hesaplamak kapsam dışıdır.

## 8. Para hesabı, yuvarlama ve değişmezler

Para hesabında kuruş / sent gibi en küçük para birimini tut veya mevcut yığına uygun kesin ondalık yöntem kullan. İkili kayan noktayla biriken farkı ekranda iki haneye yuvarlayarak gizleme. Bu sürümün desteklediği para birimlerini ve ondalık basamaklarını açık belirle; başlangıç TRY ve EUR, iki basamak. Aynı toplamda farklı para birimleri toplanmaz; kur dönüşümü eklenirse ayrıca görünür kur girdisi gerekir.

Oran iki ondalık basamaklı yüzde olarak girilebilir; `15,25% = 1.525 baz puan`. Temel dönüşüm tam sayı oranıyla yapılabilir. Matematikteki yüzde üst sınırı, başlangıçtaki ticari %15 ile aynı türden bir parametre değildir.

### 8.1 Taksit dağıtımı

Toplam komisyonu önce kesin para birimine yuvarla. Toplam `C`, taksit sayısı `N` için kümülatif dağıtım kullan:

```text
kümülatif(k) = roundHalfUp(C × k / N)
taksit(k) = kümülatif(k) − kümülatif(k − 1)
k = 1 … N
```

Bu formülde `C` en küçük para birimindedir; her adım aynı yuvarlama sözleşmesini kullanır. Tam iade, özgün hareketlerin kuruşlarını ters çevirir; negatif sayılar için farklı yuvarlama davranışına güvenilmez.

| Toplam / taksit | Dağıtım | Kontrol |
|---|---|---|
| 150 TL / 12 | 12 × 12,50 TL | 150 TL |
| 100 TL / 12 | 8 × 8,33 TL ve 4 × 8,34 TL | 100 TL |
| 250 TL / 12 | 8 × 20,83 TL ve 4 × 20,84 TL | 250 TL |

100 TL / 12 örneğinde ikinci, beşinci, sekizinci ve on birinci taksitler 8,34 TL olur. UI “Her ay 8,33 TL” diye kesin söz vermemeli; “Aylık yaklaşık 8,33 TL; kuruş farkları takvimde dengelenir” diyebilir.

Bir faturanın oranı hizmet aylarına göre değişiyorsa her ayın kesin teorik komisyonunu hesapla, toplamı bir kez yuvarla ve kümülatif yuvarlama farklarıyla aylara dağıt. Önce 83,33 TL aylık eşdeğere yuvarlayıp sonra her ay %15 almak yasaktır. Birbirinden bağımsız faturalar kendi içinde yuvarlanır; müşteri grubu toplamı kişi başına yuvarlanmış sonucun adetle çarpımıdır.

### 8.2 Zorunlu hesap değişmezleri

1. Aynı girdi ve aynı olaylar aynı sonucu üretir; saat veya rastgele sayı sonucu değiştirmez.
2. Taksitlerin toplamı toplam komisyona eşittir. Son taksit arayüzde saklanmaz.
3. Tahsilat yoksa kazanılmış komisyon yoktur; gelecek tahmini ayrı gösterilebilir.
4. Yeni hakediş, eski taksitin ödenmesinden doğmaz. Kazanç ve ödeme iki kez toplanmaz.
5. `Net hakediş = kazanılan tutar + düzeltmeler`.
6. `Net bakiye = net hakediş − simüle edilen ödemeler + simüle edilen geri alımlar`.
7. `Ödenecek = max(net bakiye, 0)`; `geri alınacak = max(−net bakiye, 0)`. İki değer ayrı görünür.
8. Gelecekteki hizmet/tahsilat koşullarına bağlı tutarlar, ödenecek bakiyeye eklenmez.
9. `Komisyon sonrası tahsilat = net komisyon bazı − net hakediş`. Bu, henüz oluşmamış gelecek komisyonu içermez; yanında gelecek koşullu yük ayrıca belirtilir.
10. `Komisyon ödemeleri sonrası nakit = net müşteri tahsilatı − simüle edilen ortak ödemeleri + simüle edilen geri alımlar`. Burada hariç fatura kalemleri de nakitte bulunabilir; nakit, komisyon bazı veya kâr değildir. Örneğin 120 TL tahsilat, 20 TL hariç kalem, 15 TL ortak ödemesi: nakit 105 TL; hakediş sonrası komisyon bazı 85 TL.
11. Portföy toplamı, alt müşteri/grup kayıtlarının toplamına eşittir. Karşılaştırma alternatifleri portföy toplamına eklenmez.
12. Görüntülenen dönem dışındaki kazanılmış borç ve gelecek taksitler kaybolmaz; “Bu dönemden sonra” özeti vardır.
13. %0 geçerli girdidir. Eksik veri veya uygulanmayan alan %0 gibi sunulmaz.

## 9. Aynı müşteri üzerinden karşılaştırma örnekleri

Bu tablolar değiştirilebilir girdilerle üretilen başlangıç örnekleridir; uygulamaya sabit sonuç metni olarak yazılmaz.

### 9.1 İlk 12 ay, bütün ödemeler ve destek koşulları tamamlandığında

| Alternatif ortak modeli | Aylık 100 TL; 12 ödeme | Yıllık 1.000 TL; tek ödeme | Farkın nedeni |
|---|---:|---:|---|
| Ayşe, ilk fatura %10 | Toplam 10 TL | Toplam 100 TL | Komisyon yalnız ilk faturaya uygulanır |
| Satış ortağı, %15 | Toplam 180 TL | Toplam 150 TL | Yıllık paketin müşteri fiyatı 200 TL daha düşük |
| Çözüm ortağı, %25 | Toplam 300 TL | Toplam 250 TL | Aynı fiyat farkı; destek koşulu sağlanmış |

### 9.2 Müşteri 36 ay devam ettiğinde

Her yıllık yenileme 1.000 TL; aylık model her ay 100 TL; fiyat değişimi yok. Üçüncü dönem oranı iki süreli modelde örnek %0. Her dönem 12 ay.

| Model | Aylık model 1. / 2. / 3. dönem | Aylık model toplamı | Yıllık model 1. / 2. / 3. dönem | Yıllık model toplamı |
|---|---|---:|---|---:|
| Ayşe, ilk fatura | 10 / 0 / 0 TL | 10 TL | 100 / 0 / 0 TL | 100 TL |
| Satış ortağı | 180 / 120 / 0 TL | 300 TL | 150 / 100 / 0 TL | 250 TL |
| Çözüm ortağı | 300 / 180 / 0 TL | 480 TL | 250 / 150 / 0 TL | 400 TL |

Çözüm ortağının ikinci dönem oranı %15'ten %10'a indirilince bu son satır aylık modelde `300 + 120 = 420 TL`, yıllık modelde `250 + 100 = 350 TL` olur. Bu değişiklik inputla yapılmalı; tablo, açıklama, aylık takvim ve şirket özeti birlikte güncellenmelidir.

### 9.3 Portföy örneği

Birer farklı müşteri: Ayşe'ye atanmış bir yıllık müşteri, satış ortağına atanmış bir yıllık müşteri, çözüm ortağına atanmış bir yıllık müşteri. Her biri 1.000 TL ödemiştir. Üç müşterinin ilk yıl koşulları tamamlanırsa toplam komisyon `100 + 150 + 250 = 500 TL`, komisyon sonrası tutar `3.000 − 500 = 2.500 TL` olur.

İlk hizmet ayı sonunda, Ayşe tahsilatta; diğerleri aylık kazanma modelinde ve ödemeler aynı ay planlanmışsa o ana kadar kazanılan/ödenen toplam `100 + 12,50 + 20,83 = 133,33 TL` olur. 500 TL'yi ilk ayın ödemesi olarak göstermek hatadır. Geleceğe bağlı kalan toplam `366,67 TL` olarak ayrı gösterilir.

## 10. Sayfa deneyimi ve master component sözleşmeleri

Mevcut Mantine ve proje bileşenlerini kullan. Ortaklık türleri bir rütbe hiyerarşisi değildir; büyük komisyon oranını “daha iyi kişi” veya “daha üst seviye” gibi görselleştirme.

### 10.1 Kullanıcı akışı

1. **Anla:** “Müşteri ödeme yaptığında ortak ne kazanır?” amacı ve kurgusal başlangıç örneği.
2. **Seç:** Ortak modeli, müşteri ödeme düzeni, fiyat.
3. **Düzenle:** Bütün oranları ve süreleri inputlardan değiştir.
4. **Gör:** Toplam komisyon, bu ay kazanılan tutar, ödeme planı ve şirket tarafı.
5. **Karşılaştır:** Aynı müşteri için üç model veya iki kaydedilmiş senaryo.
6. **İncele:** Bir sonucun hesabını ve ay ay hareketlerini aç.
7. **Bitir:** Seçilen politikayı, değiştirilen değerleri ve varsayımları özetleyen çıktı al.

Ana bölümler önerisi: **Model**, **Karşılaştırma**, **Aylık döküm**, **Varsayımlar**. Aynı anda bir ana panel görünür; diğerleri uzun sayfanın altında birikmez. Aktif bölüm adresle izlenir, geri/ileri gezinme ve panel değişimi girdileri korur. Sayısal değer seçicileri sayfa sekmesi gibi sunulmaz: bölüm değiştirmek ile oran seçmek ayrı semantik davranışlardır.

### 10.2 Bileşenler

| Bileşen / sorumluluk | Zorunlu içerik | Kabul davranışı |
|---|---|---|
| Model seçici | Üç ortak tipi, kısa sorumluluk farkı | Seçim belirgin; mevcut değişiklikleri sessiz silmez |
| Oran-dönem editörü | Oran inputları, süre inputları, sonraki dönem oranı | Her oran düzenlenebilir; satırın ait olduğu ortak/dönem açık |
| Fiyat kurucu | Aylık/paket seçimi, aktif fiyat kaynağı, ilgili inputlar | Sadece etkin girdiler hesapta; türetilen tutarın kaynağı görülebilir |
| Kazanma/ödeme seçici | §5.3 üç politika, taksit/gecikme inputu | Kazanma ve ödeme açıklamaları birbirine karışmaz |
| Destek koşulu | Sorumlu taraf, aylık durum, etki, isteğe bağlı maliyet | Destek sağlanmayan ay hesap ve dökümde aynı sonucu verir |
| Sonuç özeti | Dönem + para birimi + toplam/bu ay ayrımı | Büyük sayı her zaman “neyin, hangi dönemin tutarı?” sorusunu yanıtlar |
| Hesap açıklaması | Kullanılan baz, oran, süre, koşul ve sonuç | “Neden bu tutar?” ile açılır; tek yüzdelik rozetle yetinmez |
| Karşılaştırma | Ortak koşullar, değişen koşullar, toplam ve aylık fark | Aynı satışın alternatifleri olduğu anlaşılır |
| Ay gezgini | Seçili ay, önceki/sonraki, doğrudan ay seçimi | Ay değişince filtre/model/odak kaybolmaz |
| Hareket dökümü | Tarih, müşteri grubu, fatura, tahsilat, hakediş, düzeltme, ödeme | Toplamlardan kayda, kayıttan formüle iz vardır |
| Varsayım ve değişiklik özeti | Başlangıç → yeni değer, etkilenen sonuç | Gerçek kayıt ile örnek politika ayrıdır |
| Kaydet / geri al / dışa aktar | İşlemin kapsamı ve sonucu | Başarı yalnız gerçekten gerçekleşirse bildirilir |

Üç ortak modelinin oranlarını aynı karşılaştırma bağlamında düzenleyebilmek zorunludur. Yalnız seçili personanın oranını düzenleyip diğer iki kartı sabit bırakmak bu görevi karşılamaz.

### 10.3 Değer etiketleri ve açıklama

Kısa seçimlerde yalnız değer bulunur: `%10`, `%15`, `12 ay`, `1.000 ₺`. `(parametre)`, `Senaryonun`, `Varsayılan oran` gibi açıklamalar seçenek etiketine eklenmez. Özel oran için sayısal input bulunur; kullanıcı yalnız önceden yazılmış yüzdelerle sınırlandırılmaz.

Alan adı kontrolün üstünde, kısa açıklama altında, başlangıç/özel durum bilgisi ayrı satırdadır. Bu ayrım tek satıra sığdırmak için anlamı kaldırmak değildir. Örnek:

```text
İkinci dönem komisyon oranı
[ 15 ] %
Bu oran, müşterinin ikinci dönemine ait uygun ödemelere uygulanır.
```

Dar alana sığmayan uzun seçenekler iki satıra taşan bir segment şeridine zorlanmaz; alan genişliğine göre markalı Select veya dikey radio grubu kullanılır. Yazı küçültülmez, yatay taşma veya anlamı saklayan üç nokta çözüm sayılmaz.

### 10.4 320 CSS px ile başla

Telefon görünümünde önce seçili müşteri/model ve karar için gerekli sonuç görünür. Üç ayrı büyük ayar paneli üst üste açılmaz. Desktop oran matrisi mobilde ortak başlığı altında düzenlenebilir dönem kayıtlarına dönüşebilir.

Aylık hareket tablosu mobilde ay başlığı + kazanılan tutar + ödeme durumu özetli accordion kayıtlarına dönüşür. Açılan kayıtta etiket–değer çiftleri bulunur. Kayıt sayısı ve toplamlar filtreye göre güncellenir; kayıtlar kapalıyken kritik toplam saklanmaz.

Karşılaştırmada üç alternatifi üç kapalı accordion'a bölüp kullanıcının değerleri hafızada tutmasını isteme. Seçili ölçüt için üç modelin değerleri kısa, eşzamanlı görünen satırlarda gösterilir; ayrıntılar ayrıca açılır. Mobilde tabloyu kaldırmak karşılaştırma görevini kaldırmak değildir.

Genişlik ve yön değişirken girişler, açık kayıt, seçili ay ve klavye odağı korunur. Sayfa düzeyinde yatay kaydırma yoktur. Bu yeni sayfanın temel matris ve takvim görevleri 320 px'te yatay kaydırma gerektirmemelidir.

### 10.5 UX ilkelerini somutlaştır

| Yaklaşım | Bu görevde uygulanacak karar | Başarısızlık göstergesi |
|---|---|---|
| Görsel kullanılabilirlik etkisi ve visceral tasarım | Sakin sayı hiyerarşisi, tutarlı birimler, açık durumlar; büyük yüzde yerine anlamlı sonuç öne çıkar | Şık kartlar var ama kullanıcı toplam ile taksiti karıştırıyor |
| White space / proximity | Fiyat, hizmet süresi ve aylık eşdeğer birbirine yakın; komisyon ve ödeme takvimi ayrı, ilişkili gruplar | Hangi açıklamanın hangi inputa ait olduğu belirsiz |
| Similarity / consistency | Aynı tür oran inputları aynı görsel ve davranış sözleşmesinde | Bir oran input, diğeri sabit rozet veya farklı birim |
| Continuity | Girdi → formül → sonuç → hareket kaydı sırası korunur | Kullanıcı 12,50 TL'nin nereden geldiğini başka sayfada arıyor |
| Common region | Bir modelin alanları açık başlıkla gruplanır; her satıra kart çerçevesi eklenmez | Alanlar ya birleşip okunamıyor ya gereksiz kutularla parçalanıyor |
| Hick–Hyman | Önce model/fiyat/oran; iade, destek istisnası ve taksit ayrıntısı gerektiğinde açılır | İlk ekranda bütün koşullar eşit ağırlıkta listeleniyor |
| Miller / tanıma | Dönem, oran ve ilgili tutar birlikte görünür; ezberlenecek kod yok | Kullanıcı bir önceki paneldeki oranı hatırlamak zorunda |
| Fitts | Input, stepper, accordion ve geri alma yeterli hedef alanına sahip | Küçük yüzde metnine dokunmak gerekiyor |
| Gulf of Evaluation | Değişiklikten sonra hangi sonucun neden değiştiği açıklanır | Yalnız sayı animasyonu var; hangi kuralın uygulandığı görünmüyor |
| Error prevention / recovery | Geçersiz girdi modele gitmez; sıfırlama kapsamlı, vazgeçilebilir ve geri alınabilir | Yazarken sayı sessiz düzeltiliyor veya ayarlar kayboluyor |
| Peak–End | Son görünüm seçili politika, tutarlar, belirsizlikler ve dışa aktarımla kapanır | Kullanıcı ekran görüntüsünden hesap koşullarını çıkaramıyor |

### 10.6 Görsel ve erişilebilirlik sözleşmesi

- Outfit, merkezi semantik tokenlar, minimum **14 CSS px**; başlık/gövde hiyerarşisi korunur. Kullanıcının kök font tercihi küçültülmez.
- Kart, input, sekme ve düğmede radius 0. Yalnız mevcut onaylı pill/switch ve belgeli proje istisnaları geçerlidir.
- Normal temalarda çevreleyen odak halkası yoktur; merkezi klavye modu ile görünür, çevrelemeyen alternatif odak göstergesi zorunludur. Seçili durumdan ayrılır; ortak forced-colors istisnası korunur.
- Mevcut hareket tokenları; simetrik Cubic `cubic-bezier(.65, 0, .35, 1)`, iki yönlü geçiş ve reduced-motion. Input, ARIA ve hesap doğruluğu animasyon beklemez.
- Etiketler programatik bağlıdır. Tab/Shift+Tab, widgeta uygun oklar, Enter/Space, Escape ve panel dönüş odağı sınanır.
- Tablo başlıkları, accordion başlıkları, birimler ve alan hata ilişkileri semantik olarak tanımlıdır. Renk tek bilgi kanalı değildir.
- Hesap güncellemesi her tuşta bütün ekranı ekran okuyucuya okutmaz; kısa durum bildirimi kullanır. Hata mesajı düzeltme yolunu belirtir.
- WCAG 2.2 AA kapsamı mevcut UX belgelerindeki tam süreç matrisiyle değerlendirilir. Zoom, reflow, kontrast, hedef boyutu, görünür ve örtülmeyen odak, isim/rol/değer ve durum bildirimleri ölçülür. Otomatik taramanın geçmesi tek başına AA uygunluğu diye sunulmaz.

## 11. Senaryo, kayıt ve dışa aktarım

Başlangıç örnekleri uygulamada adlandırılmış hazır senaryolar olarak bulunmalıdır: **İlk satış**, **Aylık müşteri**, **Yıllık peşin**, **10 aylık fiyat / 12 aylık hizmet**, **İkinci döneme geçiş**, **Kısmi ödeme**, **Destek kesintisi**, **İade**, **Üç ortaklı portföy**. Bunlar aynı motoru kullanır; ayrı hardcoded sonuçlar değildir.

Kullanıcı en az iki senaryoyu adlandırıp yan yana karşılaştırabilmelidir. Kaydedilen senaryo model girdilerinin tam anlık görüntüsünü ve şema sürümünü taşır. Başlangıç şablonunun ileride değiştirilmesi eski kayıtları sessizce değiştirmez.

Durum sayfaya özel ad alanında saklanır; mevcut genel parametreleri, gelir planı senaryosunu, notları veya temayı değiştirmez. Örnek anahtar `segika-affilate-v1`; mevcut depolama alışkanlıkları uygulama sırasında kontrol edilir. Saklama başarısızsa “kaydedildi” denmez. Sıfırlama kapsamı, Vazgeç ve Geri al içerir; süreye bağlı kaybolan onay kullanılmaz.

Temel teslimde senaryo girdileri için sürümlü JSON dışa/içe aktarımı ve aylık hareketler için CSV dışa aktarımı bulunmalıdır. JSON içe aktarma şema, oran, tarih, tutar ve kimlik doğrulamasından geçer. Hatalı dosya mevcut durumu bozmaz. CSV'de para birimi ve dönem ayrı sütunlardır; kullanıcı metni formül olarak çalıştırılabilecek biçimde aktarılmaz.

Adres aktif bölümü taşıyabilir. Gerçek müşteri adı, e-posta, kişisel veri veya ödeme bilgisi URL'ye konmaz. Bu simülasyonda kurgusal “Müşteri A / Grup A” etiketleri yeterlidir. Kaynak fotoğraf ve dosyaları repoya kopyalanmaz.

## 12. Test önce: sayısal ve davranışsal kabul senaryoları

Önce aşağıdaki anlamlı örneklerden başarısız testler yaz; sonra saf modeli geliştir; sonrasında arayüzü bağla. Testler hesap fonksiyonunun satırlarını tekrar etmemeli, bağımsız beklenen sonuçları sınamalıdır. Bu belge testlerin yazıldığı veya geçtiği anlamına gelmez.

### 12.1 Hesap testleri

| ID | Girdi / olay | Beklenen sonuç |
|---|---|---|
| M01 | İlk fatura 100 TL; %10; tamamı tahsil | Ayşe 10 TL |
| M02 | Aynı müşterinin ikinci 100 TL faturası | Ayşe ek 0 TL |
| M03 | İlk yıllık fatura 1.000 TL; %10 | Toplam 100 TL; 83,33 TL değildir |
| M04 | Satış ortağı; aylık 100 TL; %15 | İlgili uygun ay 15 TL |
| M05 | Satış ortağı; yıllık 1.000 TL; %15; 12 uygun ay | Toplam 150 TL; aylık 12,50 TL |
| M06 | Çözüm ortağı; yıllık 1.000 TL; %25; 12 uygun ay | Toplam 250 TL; kuruş dengeli dağıtım |
| M07 | Satış ortağı; ikinci dönem aylık 100 TL; %10 | 10 TL; birinci dönem oranı sürmez |
| M08 | Satış ortağı; üçüncü dönem oranı %0 | Yeni hakediş 0 TL; eski ödenecek bakiye silinmez |
| M09 | Çözüm ortağı ikinci oran %15 → %10; yıllık 1.000 TL | İkinci dönem toplamı 150 → 100 TL; 36 aylık toplam 400 → 350 TL |
| M10 | 100 TL; 12 ay; 10 aylık fiyat | Paket 1.000 TL; indirim yaklaşık %16,67 |
| M11 | 100 TL; 12 ay; indirim %0 | Paket 1.200 TL; süreli %15 toplamı iki fatura düzeninde de 180 TL |
| M12 | 100 TL; ilk faturadan %10 yerine 12 ay boyunca %10 | Aylık model toplamı 10 → 120 TL |
| M13 | 100 TL toplam komisyon; 12 taksit | 8 adet 8,33 + 4 adet 8,34; toplam 100 TL |
| M14 | Aynı 100 TL komisyon; taksit sayısı 10 | 10 adet 10 TL; toplam değişmez |
| M15 | Fatura var; ödeme yok | Kazanılan ve ödenebilir tutar 0; tahmin ayrı |
| M16 | Ayşe; 100 TL ilk fatura; 40 TL ve 60 TL kısmi tahsilat | 4 TL ve ek 6 TL; toplam 10 TL |
| M17 | Yıllık 1.000 TL; tahsilat 400 TL; %15; 12 aylık kazanma | Tahsilata bağlı toplam 60 TL; ilk uygun ay 5 TL |
| M18 | M17'nin üçüncü hizmet ayı sonunda kalan 600 TL gelir; ilk üç ay uygun | Önceden 10 TL kazanıldıysa üçüncü ay ek 27,50 TL; toplam 37,50 TL |
| M19 | Yıllık 1.000 TL; %15; tahsilatta kazan / 12 taksit | Başta hakediş 150 TL; ilk taksit 12,50 TL; kalan 137,50 TL |
| M20 | Aynı örnek aylık kazanma politikasında | İlk ay 12,50 TL hakediş; 137,50 TL gelecek koşullara bağlı |
| M21 | Müşteri 15 Mart'ta başlar; dönem 12 ay | 1 Ocak oran değiştirmez; sonraki 15 Mart ikinci dönem başlar |
| M22 | Birinci dönem hizmeti; tahsilat veya taksit ikinci dönemde | Birinci dönem oranı korunur |
| M23 | 1.200 TL paket; 12 ayın 6'sı %15, 6'sı %10 | Toplam 150 TL; bütün faturaya tek oran uygulanmaz |
| M24 | Çözüm ortağı; aylık 100 TL; %25; destek sağlanmadı | İlgili ay 0 TL; gerekçe görünür |
| M25 | M24'te destek belirsiz ve bekletme seçili | 25 TL koşullu/bekleyen; kazanılmış borç değildir |
| M26 | Yıllık 1.000 TL; %15; üç aylık hakediş 37,50 TL ödenmiş; 200 TL iade | Net hakediş 30 TL; −7,50 TL düzeltme; 7,50 TL geri alınacak |
| M27 | Komisyonu ödenmiş ilk fatura tamamen iade edilir | Net hakediş 0; ödenmiş tutar geri alınacak; yeni ilk fatura hakkı oluşmaz |
| M28 | Abonelik iptal; iade yok; tahsilatta kazanma modeli | Gelecek faturalar yok; mevcut kazanılmış taksitler korunur |
| M29 | Abonelik üç ay sonunda biter; aylık kazanma; yıllık 1.000 TL/%15 | Üç ayın 37,50 TL hakkı korunur; sonraki hizmet ayları kazandırmaz |
| M30 | Aynı tahsilat veya iade kimliği iki kez işlenir | İlk uygulamadan sonra toplam değişmez |
| M31 | %0 → %7,5; ilk fatura 100 TL | 0 → 7,50 TL; sıfır input düzenlenebilir |
| M32 | Üç ayrı yıllık müşteri, üç farklı ortak; §9.3 | İlk yıl toplam 500 TL; ilk ay 133,33 TL |
| M33 | Aynı tek müşteri, üç alternatif ortak | Üç ayrı sonuç; toplam %50 ödeme üretilmez |
| M34 | 31 Ocak başlangıcı; iki ay ilerleme | Şubat sonu ve 31 Mart; kalıcı 28'e kayma yok |
| M35 | Taksitlerin son ayı görünüm ufkundan sonra | Sonraki dönem borcu özette korunur |
| M36 | 120 TL tahsilat; 20 TL hariç tutar; %15 | Komisyon bazı 100 TL; komisyon 15 TL |
| M37 | Negatif tutar, %101, boş giriş, sıfır taksit veya geçersiz tarih | Alan hatası; geçersiz değer hesap motoruna gitmez |
| M38 | TRY ve EUR müşteri grupları | Ayrı toplamlar veya açık kur dönüşümü; doğrudan toplama yok |
| M39 | İlk pozitif fatura ödenmemiş; ikinci fatura önce ödenmiş | Ayşe için ikinci fatura ilk sayılmaz; ilk tahsil edilene kadar hak yok |
| M40 | %15 oranı %20 yap; diğer bütün uygun koşullar sabit | Komisyon %15 modeline göre 20/15 oranında artar; tek kaynaklı bütün çıktılar güncellenir |
| M41 | Yıllık 1.000 TL; %25; ilk hizmet ayında destek sağlanmadı, diğer 11 ay uygun | İlk ay 0; toplam 229,17 TL; kalan aylar 250 TL'ye tamamlanmaz |
| M42 | 120 TL fatura; 20 TL hariç kalem; 60 TL tahsilat; %15 | Tahsil edilmiş komisyon bazı 50 TL; komisyon 7,50 TL |
| M43 | 0,10 TL fatura; %15; ödeme bir kerede veya 0,05 + 0,05 TL | Her iki biçimde toplam komisyon 0,02 TL; parçalı tahsilat toplamı değiştirmez |
| M44 | 120 TL tahsilat; 20 TL hariç kalem; 15 TL hakediş ödenmiş | Nakit 105 TL; hakediş sonrası komisyon bazı 85 TL; iki metrik farklı |

### 12.2 Arayüz ve anlam testleri

| ID | Kullanıcı görevi | Kabul |
|---|---|---|
| U01 | Pazarlama menüsünden Affilate aç | Doğru taban yol, aktif menü ve sayfa başlığı; desktop/mobil aynı hedef |
| U02 | Üç ortağın bütün oranlarını değiştir | %0 dahil her oran gerçek input; karşılaştırma ve metinler güncel |
| U03 | İkinci oranı %15'ten %10'a değiştir | Girdi korunur; sonuç §9.2 ile uyumlu; yeniden yükleme kayıt politikasına uygun |
| U04 | Fiyat katsayısı 10, hizmet süresi 12, taksit sayısı 6 gir | Üç farklı süre/katsayı doğru etiketle ve bağımsız davranır |
| U05 | Oran veya ay seçicisine bak | Etikette yalnız değer; “parametre” / “Senaryonun” eki yok |
| U06 | 320 px'te dönem matrisi ve aylık dökümü aç | Temel iş yatay kaydırma, kesik metin veya küçülen yazı gerektirmez |
| U07 | Mobilde üç ortak sonucunu karşılaştır | Seçili ölçütün üç değeri aynı bağlamda; hafızadan karşılaştırma gerektirmez |
| U08 | Ana bölüm değiştir, geri/ileri kullan | Tek ana panel; girdiler, seçili ay ve kaydedilmiş senaryo korunur |
| U09 | Tab, oklar, Enter/Space, Escape kullan | Klavye işlemleri ve görünür çevrelemeyen odak çalışır; seçili durumla karışmaz |
| U10 | Zoom, büyük kök font, yatay telefon ve kısa yükseklik | Okunabilirlik ve temel eylemler korunur; yapışkan özet odağı örtmez |
| U11 | `1,` yaz, alanı boşalt, %101 gir | Sessiz düzeltme yok; açıklayıcı hata; son geçerli sonuç taslak durumuyla ayrılır |
| U12 | “Neden bu tutar?” aç | Baz, oran, dönem, koşul ve yuvarlama bağlantısı eksiksiz |
| U13 | JSON dışa aktar, içe al | Aynı girdiler aynı sonuç; bozuk JSON mevcut senaryoyu bozmaz |
| U14 | Yerel depolama kapalıyken değiştir | Değişiklik çalışır; kaydedildi iddiası yok; dışa aktarma yolu var |
| U15 | Sıfırla, Vazgeç, uygula, Geri al | Kapsam açıklanır; süreli onay yok; ilgisiz sayfa verisi değişmez |
| U16 | Destek sağlanmadı / belirsiz / aktif arasında değiştir | Üç farklı durum ve neden hesap açıklamasında görünür |
| U17 | Tutar filtresi veya ayı değiştir | Görünüm toplamı ile bütün dönem toplamı ayrıdır; yükümlülük kaybolmaz |
| U18 | Reduced-motion ve forced-colors aç | Ortak proje davranışı korunur; işlev animasyona bağlı değildir |
| U19 | İlk/sonuç ekranını oku | “Simülasyon”, dönem ve para birimi görünür; gerçek ödeme veya net kâr iddiası yok |
| U20 | Ayşe ile yıllık satış örneğini açıkla | Kullanıcı 100 TL toplam ile yaklaşık 8,33 TL taksiti ve 83,33 TL fiyat eşdeğerini ayırabilir |

U20 gibi anlama testleri otomatik metin eşleşmesiyle geçmiş sayılmaz. P01–P04 ihtiyaçlarını temsil eden kişilerle görev testi önerilir. “Ne anladınız?” yerine “Bu satıştan toplam ne kazanılır, bu ay ne ödenir, müşteri ödemezse ne olur?” soruları sorulur. İnsan testi yapılmadıysa sonucu `not_run` kaydet.

### 12.3 Özellik tabanlı / dönüşümsel kontroller

- Taksit sayısını değiştirmek toplam hakedişi değiştirmez; yalnız dağılım değişir.
- Tahsilat tarihini ötelemek geçmişe nakit eklemez; hizmet dönemi oranını değiştirmez.
- Sıfır oran bütün uygun komisyonları sıfırlar; müşteri tahsilatını sıfırlamaz.
- Aynı koşullu iki müşteri, tek müşterinin kuruş düzeyindeki sonucunun iki katını üretir.
- Olayları kimlik ve tarih sırasıyla normalleştirdikten sonra girdi dizisinin sırası sonucu değiştirmez.
- Tam iade + ilgili geri alma hareketi, bağlantılı komisyon bakiyesini sıfıra getirir.
- Başka bir ana sekmeyi açmak, pencereyi daraltmak veya tema değiştirmek hesap sonucunu değiştirmez.

## 13. Projeye entegrasyon

Mevcut `src/data/tree.ts` içindeki `MARKETING_NAV`, Pazarlama menüsünü besler. **İş ortaklığı** öğesinin yanına **Affilate** eklenmesi önerilir. Masaüstü ve mobil için ayrı, zamanla ayrışacak menü listeleri oluşturulmaz. Mevcut `/partnership/` sayfası korunur; yeni sayfa komisyon simülasyonudur. `/buyume-modeli/` içindeki MLM hesapları kendiliğinden bu sayfaya taşınmaz.

Olası dosya dağılımı aşağıdadır; bunlar henüz oluşturulmuş dosyalar değildir:

| Sorumluluk | Önerilen konum |
|---|---|
| Sayfa kabuğu | `src/pages/affilate.astro` |
| React sayfa görünümü | `src/views/AffilatePage.tsx` |
| Saf hesaplar ve tipler | `src/data/affilate.ts` veya aynı sorumluluğu bölen küçük modüller |
| Başlangıç değerleri | Projenin merkezi parametre düzeninde ayrı Affilate bölümü; canlı senaryo durumuyla karıştırılmaz |
| Sayfaya özel senaryo durumu | `src/lib/affilateStore.ts` |
| Sayfaya özgü tekrar kullanılan kontroller | İhtiyaç varsa `src/components/affilateKit.tsx`; ortak kontroller kopyalanmaz |
| Model testleri | `tests/affilate-model.spec.ts` |
| Sayfa ve anlam testleri | `tests/affilate.spec.ts` |

Proje tek React ağacı ve `AppFrame` / MantineProvider düzenini kullanır. Yeni sayfa aynı çerçeveyi izler. Manifestte Astro 7.4.0, React 19.3.1, Mantine 9.7.3 ve Playwright 1.64.1 belirtilidir; bunlar bu görev için kurulu runtime doğrulaması değildir. Uygulayıcı lockfile ve çalışma ortamını doğrular, sırf bu sayfa için paket yükseltmez.

Oran, süre ve fiyatın varsayılanları tek merkezi kaynaktan gelir. Affilate sayfasındaki deneme değişiklikleri genel `ModelContext` üzerinden bütün projenin fiyatlarını değiştirmez. Başlangıç değerleri ile sayfaya özgü senaryo override'ları ayrı tutulur. Mevcut 399 € iStoc aboneliği Segika örneğine otomatik bağlanmaz; bir kaynak bağlantısı sunulursa kullanıcı açıkça seçer ve kaynak görünür olur.

Hesap motoru DOM, React, localStorage ve ağdan bağımsız olmalıdır. Görünüm motorun sonuçlarını kullanır; grafik ve CSV için ikinci hesap sistemi kurulmaz. Grafik varsa mevcut tembel yüklenen Chart altyapısı kullanılır; tabloyu veya erişilebilir metin eşdeğerini kaldırmaz.

Geliştirici, bu belgeyi şu mevcut raporlarla birlikte uygular: [UX temel kuralları](docs/ux.md), [UX V2](docs/ux_v2.md), [anlaşılır ifade kuralları](docs/ifade.md), [görsel algı denetimi](gorsel_algi.md). Tarihsel raporlardaki bulgu durumlarını güncel kod kanıtı sanmaz; `AGENTS.md` ve doğrudan kullanıcı kararlarıyla çelişen eski öneriyi tekrarlamaz.

## 14. Uygulama sırası ve teslim kanıtı

1. Güncel kaynakları al; çalışma ağacını ve başkalarının değişikliklerini kontrol et. Ayrı uygulama branch/worktree'sinde çalış. Bu görev tanımı hazırlanırken yapılan pull, gelecekteki uygulama için güncellik kanıtı değildir.
2. Başlangıç kurallarını ve önerilen varsayımları tek veri modeline dök; metinlerin de bu modelden üretileceğini göster.
3. M01–M44 içinden çekirdek kuralları önce başarısız testlerle kur. Özellikle ilk fatura, dönem değişimi, yıllık dağıtım, kısmi tahsilat ve iade sınırlarını bitir.
4. 320 px temel akışı kur: model seç → oran/fiyat değiştir → toplamı ve bu ayı anla → hesabı aç. U01–U12 ile doğrula.
5. Aylık döküm, koşullar ve karşılaştırmayı aynı motorla bağla; ardından senaryo kayıt/dışa aktarım ve portföyü tamamla.
6. Geniş ekran görünümünü ekle; mobildeki görev, veri ve durumları koru. 320, 360, 375, 390 px, tablet ve masaüstü kapsamını riske göre doğrula.
7. Proje komutlarını çalıştır; anlamlı UI tesliminde bağımsız QA incelemesi yaptır. Çalıştırılan tarayıcı ve cihazları doğru adlandır; WebKit'i gerçek Safari diye sunma.
8. Gerçek uygulama davranışını, yeni komut veya kalıcı kararı proje belgelerine işle. Bu planın tamamlandı kutularını kanıt olmadan işaretleme.
9. Yayın kapsamı kullanıcı tarafından uygulama aşamasında etkinleştirildiğinde, mevcut GitHub Pages akışında branch/commit ve yayın adresini doğrula; yerel build başarısını yayın başarısı sayma.

Repo içindeki mevcut kontrol komutları:

```sh
# Çalışma dizini: site/
npm run check
npm run build
npm test
# Toplu karşılığı:
npm run verify
```

Hedefli testler ilk aşamada mevcut Playwright düzeni üzerinden çalıştırılır; testler derlenmiş çıktıyı kullandığından güncel build gerekir. Paralel worktree testinde projedeki `PW_PORT` kuralı izlenir; başka ağacın sunucusuna bağlanıp yanlış paketi doğrulama. Yeni test aracı veya tarayıcı kurulumu bu belgenin otomatik gereği değildir.

Yeni commitlerin yazar ve committer kimliği `karacaismail <35493655+karacaismail@users.noreply.github.com>` olmalı; Git guard korunmalı; AI/bot ortak yazar veya üretici imzası eklenmemelidir. Bu belge tek başına mevcut aşamada commit, push veya yayın yapıldığı anlamına gelmez.

### Tamamlandı sayılması için

- [ ] Pazarlama altında Affilate öğesi ve doğrudan sayfa yolu çalışıyor.
- [ ] Üç persona ayrı kapsam, sorumluluk ve kazanç biçimiyle açıklanıyor.
- [ ] **Bütün komisyon oranları, %0 dahil, düzenlenebilir input.** Metindeki örnek oranlar da aynı durumu izliyor.
- [ ] Fiyat, indirim, hizmet süresi, oran dönemi ve taksit sayısı birbirinden bağımsız ve doğru etiketli.
- [ ] 83,33 TL aylık fiyat eşdeğeri, 100 TL toplam komisyon ve yaklaşık 8,33 TL taksit karışmıyor.
- [ ] Tahsilat, kazanılan hakediş, gelecek koşullu tutar, ödeme ve bakiye ayrı izleniyor.
- [ ] İkinci/üçüncü dönem, destek koşulu, kısmi ödeme, iptal ve iade örnekleri hesaplanıyor.
- [ ] Aynı müşteri alternatifleri ile farklı müşterilerden oluşan portföy birbirine eklenmiyor.
- [ ] Kuruş toplamları ve olay kimlikleri değişmezleri sağlanıyor.
- [ ] 320 px görevleri, minimum yazı, odak, klavye, zoom ve dar ekran karşılaştırması doğrulanıyor.
- [ ] Test sonuçları, bilinen sınırlar ve bağımsız QA durumu kanıtlarıyla teslim ediliyor.
- [ ] Yayın istenmişse gerçek hedef sayfa kontrol edilmiş; istenmemişse teslim durumu bunu açıkça söylüyor.

## 15. Belgenin kendi kontrolü

Bu dosya bir geliştirme talimatıdır. Hazırlanırken kullanıcı mesajı, ekli tahta fotoğrafı, güncel menü/veri mimarisi ve mevcut UX yönergeleri karşılaştırıldı. İlk/ikinci/üçüncü dönem toplamları ve 12 taksitli kuruş dağılımları bağımsız ondalık aritmetikle kontrol edildi.

Uygulayıcı özellikle üç belirsizliği görünür tutmalıdır: çözüm ortağının üçüncü dönemindeki örnek oran, hakedişin tahsilatta mı hizmet ayı sonunda mı doğduğu ve destek/iptal koşullarının gelecekteki tutara etkisi. Bunlar bu belgede çalışabilir başlangıç politikalarıyla tanımlanmıştır; kullanıcının son kararı gereği oranlar ve süreler değiştirilebilir. Varsayılan seçimi, bütün alternatifleri tek davranışa kilitleme gerekçesi değildir.

Bu aşamada uygulama kodu, tarayıcı testleri, bağımsız QA ve yayın yapılmamıştır. Sayısal örnek kontrolü bunların yerine geçmez.
