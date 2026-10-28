# İçerik mimarisi — iStoc ve Segika planlama çalışma alanı

28 Ekim 2026 · İçerik denetimi ve uygulama yönergesi · İncelenen kaynak: `61fd2ff`

**Bu proje, mevcut içeriğiyle iStoc ve Segika'nın büyüme, operasyon ve finans kararlarını hazırlamak için kullanılan bir planlama çalışma alanıdır.** Organizasyon şeması bunun yalnız bir görünümüdür. Sayfalar; kimlerin çalışacağını, müşterinin nasıl kazanılacağını, ortakların nasıl katkı vereceğini, hangi varsayımlarla gelir beklendiğini, giderlerin nasıl oluştuğunu ve hangi kararların alınacağını anlatır.

İçeriğin ana sorunu sayfa sayısı değildir. **Aynı iş nesnesinin farklı sayfalarda farklı anlamlarla sunulması; strateji, hedef, tahmin, politika ve eğitim örneğinin birbirine karışmasıdır.** Bunu yalnız başlıkları kısaltarak veya sayfalara sekme ekleyerek çözemeyiz. Her içerik için bir ana adres, anlam, kapsam, sahip ve kanıt durumu tanımlamalıyız.

Bu belge uygulama kodunu değiştirmez. Aşağıdaki yeni yollar, bileşen birleşimleri ve testler **önerilen hedef mimaridir**; mevcut özellik veya tamamlanmış iş değildir. Uygulayıcı önce güncel kaynakla farkı kontrol eder, kabul testini yazar, sonra ilgili dönüşümü yapar.

**Okuma yolları:** Karar vermek için [kritik bulgular](#3-kritik-bulgular-yerleşim-sorununun-arkasındaki-anlam-sorunu) ve [sayfa envanteri](#6-bütün-mevcut-sayfalar-için-karar-envanteri); içerik taşımak için [blok haritası](#7-bölüm-ve-blok-taşıma-planı); tasarlamak için [bileşen kataloğu](#10-içerik--master-component-eşleştirmesi); uygulamak için [kabul testleri](#13-tdd-first-içerik-ve-navigasyon-kabul-sözleşmesi) ve [göç yönergeleri](#14-uygulama-ve-içerik-göçü-yönergeleri).

## 1. İnceleme kapsamı ve kanıt sınırı

- İnceleme öncesi `git pull --ff-only origin main` çalıştırıldı; kaynak `d5e6ed9` → `61fd2ff` güncellendi.
- `src/pages` altında 18 sabit Astro sayfası ve 7 rol üreten bir dinamik şablon vardır: **404 dahil 25 sayfa çıktısı**, 24 normal içerik sayfası. Bu sayı URL parametresi ve hash durumlarını ayrı sayfa saymaz.
- `/applet/` içinde 17 model; `/partnership/` içinde 2 programın her birinde 8 ana bölüm vardır. Sayfa dosyası sayısı içerik hacmini tek başına açıklamaz.
- `affilate.md` bir görev tanımıdır. `/affilate/` sayfası bu kaynakta henüz yoktur.
- Sayfa şablonları, veri dosyaları, navigasyon, ortak bileşenler ve önceki UX belgeleri incelendi. Bu inceleme canlı kullanıcı araştırması, güncel ekran görüntüsü incelemesi, tarayıcı testi veya ekran okuyucu testi değildir.
- Finansal ve hukuki ifadelerin dış dünyadaki doğruluğu bu görevde araştırılmadı. Kaynak kodunda bulunmaları, bunları doğrulanmış şirket gerçeği yapmaz.
- OPEX'in canlı kaynağına bu inceleme için bağlanılmadı. Kaynak ve hesap ilişkisi koddan incelendi; gerçek gider verileri bu rapora kopyalanmadı.
- Kullanıcıya ait mevcut `ux.md`, `ux_v2.md`, `ifade.md`, `gorsel_algi.md`, `affilate.md` korundu. Bu görevdeki yeni çıktı yalnız `contents.md` dosyasıdır.

### 1.1 Önceki raporlardan sonra yapılmış olanlar

Son kaynakta `Choice`, kısa değer etiketleri, kaynak/detay ayrımı, mobil kayıt özetleri, karşılaştırma görünümleri ve bazı sayfa türlerine özel alt bilgi metinleri bulunuyor. Bunları yeniden “hiç yok” diye raporlamak yanlış olur. Güncel problem, bu araçların üzerinde taşınan içeriğin sahipliği ve anlamıdır.

Örneğin alt bilgi artık Applet'i örnek, bazı finans sayfalarını tahmin olarak tanımlar; fakat kalan sayfalar için kullanılan “Tutarlar kesinleşen kararlardır” varsayılanı, ortaklık önerileri ve eğitim örnekleri için hâlâ fazla geneldir. İyileşme vardır; içerik türü modeli henüz yeterli değildir.

### 1.2 Belge ailesindeki görevi

| Belge | Yanıtladığı soru | Bu belgeyle ilişkisi |
|---|---|---|
| `ux.md`, `ux_v2.md` | Akış, etkileşim ve deneyim nasıl kurulmalı? | Kullanıcı görevleri ve erişilebilirlik korunur |
| `ifade.md` | İfade nasıl anlaşılır yazılmalı? | Başlık ve açıklamalar o dil kurallarıyla yazılır |
| `docs/gorsel_algi.md` | Bileşenler görsel olarak nasıl okunmalı? | Son uygulamadaki görsel kararlar dikkate alınır |
| `affilate.md` | Segika komisyon simülasyonu nasıl çalışmalı? | Hesap sözleşmesi buradan alınır; oranlar input kalır |
| **`contents.md`** | Hangi içerik neden var, nerede yaşar, neyle ilişkilidir, nasıl sunulur? | Sayfa ve blokların anlam/sahiplik sözleşmesidir |

Çelişkide doğrudan kullanıcı kararı önceliklidir. Buradaki öneri, önceki açık kararı kendiliğinden yürürlükten kaldırmaz. `MUST / zorunlu`, belirtilen dönüşüm uygulanırken sağlanacak koşuldur; `SHOULD / öneri` gerekçeyle uyarlanabilir; `MAY / seçenek` sonraya bırakılabilir.

## 2. Projenin kimliği ve sınırları

### 2.1 İçeriğin anlattığı altı farklı şey

| İçerik sınıfı | Kullanıcının sorusu | Mevcut örnek | Doğru durum ifadesi |
|---|---|---|---|
| Strateji | Kime, hangi sorunu çözerek, nasıl ulaşacağız? | Ortaklık programının teşhis ve segmentleri | Öneri / seçilmiş yaklaşım / sınanacak hipotez |
| Operasyon planı | Kim, hangi çıktıyı, ne zaman teslim edecek? | Roller, işe alım, eylemler | Planlandı / yürütülüyor / kanıtla tamamlandı |
| Ticari veya organizasyonel politika | Hangi koşulda hangi kural geçerli? | Ücret, prim, ortaklık koşulları | Taslak / onaylandı / yürürlükte / yerini yeni sürüm aldı |
| Finansal model | Bu girdilerle sonuç ne olabilir? | Gelir, başabaş, nakit akışı | Tahmin; senaryo ve hesap kapsamı belirtilir |
| Kaynak veri | Hesapta hangi kayıt kullanıldı? | Sheets gider planı, parametreler | Kaynak tarihi ve niteliği; plan veya gerçekleşen ayrıca belirtilir |
| Yöntem ve kişisel çalışma | Bir modeli nasıl kurarım; kendi notum ne? | Applet, BCG, Notlar | Örnek model / eğitim / bu tarayıcıdaki kişisel taslak |

**“Canlı kaynaktan geldi” ile “gerçekleşti” aynı şey değildir.** Güncel bir Sheets dosyasında gelecek ayın gider planı bulunabilir. **“Onaylandı” ile “gerçekleşti” de aynı şey değildir.** Onaylanan işe alım, kişinin işe başladığına kanıt oluşturmaz.

### 2.2 Ürün vaadi

Önerilen kısa tanım:

> iStoc ve Segika için hedefleri, müşteri kazanım planını, ekip sorumluluklarını ve finansal senaryoları birlikte inceleyin. Bir sonucun hangi varsayıma dayandığını ve hangi kararı gerektirdiğini görün.

Bu içerik bir CRM'in gerçek müşteri kayıtlarını, muhasebenin gerçekleşmiş defterini veya çalışanların gerçek performansını henüz temsil etmez. Arayüz bunların var olduğu izlenimini üretmemelidir. “Dashboard” görünümü yalnız gerçek, izlenebilir ölçüm verisi olan yerde kullanılmalıdır.

### 2.3 Önce hangi kullanıcı işini desteklemeli?

Aşağıdaki gruplar görev hipotezidir; kullanıcı araştırması yapılmış gibi sunulmaz.

| Okuyucu / görev | İlk ihtiyaç | Sonraki ihtiyaç | Başlangıçta gereksiz yük |
|---|---|---|---|
| Yönetici / yatırımcı | Hedef, kritik belirsizlik, gerekli karar | Nakit etkisi ve sorumlu eylem | Bütün günlük çalışma saatleri |
| Operasyon sorumlusu | Bu haftanın teslimleri ve bağımlılıkları | Rol ve kontrol ölçütü | Bütün ücret formülleri |
| Pazarlama sorumlusu | Segment, teklif, kanal, müşteri geçişi | İçerik planı, deney, ölçüm | Bordro ayrıntıları |
| Finans sorumlusu | Dönem, kapsam, gelir-gider-nakit ilişkisi | Varsayım ve kaynak izi | Genel BCG eğitimi |
| İşe alım sorumlusu | Rol ihtiyacı, başlangıç koşulu, bütçe etkisi | Görev profili ve teklif politikası | Pazarlama otomasyonunun bütün teknik işleri |
| Ortaklık programı sorumlusu | Ortak tipi, koşul, destek yükü, başarı olayı | Komisyon senaryosu ve takvim | Başka markanın ilgisiz ticari koşulları |
| Yeni ekip üyesi | Benden hangi çıktı bekleniyor, kime devrediyorum? | Günlük düzen ve ölçüm tanımı | Tüm şirket karar geçmişi |
| Modeli inceleyen yönetici | Hangi varsayım sonucu değiştiriyor? | Hassasiyet, karşılaştırma ve karar taslağı | Modelin şirket kararı gibi sunulması |

İçerik önceliği kurumun departman şemasından değil bu görevlerden çıkar. Bir içerik birden fazla göreve hizmet edebilir; bunun için metin kopyalanmaz, aynı kaydın farklı özeti gösterilir. Bu yaklaşım, içeriği gerçek kullanıcı ihtiyacına bağlayan [GOV.UK içerik tasarımı rehberiyle](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/identify-user-needs/) uyumludur; tablodaki görevler projeye özgü önerilerdir.

## 3. Kritik bulgular: yerleşim sorununun arkasındaki anlam sorunu

Öncelikler: **P0** yanlış ticari/finansal yoruma yol açabilecek anlam çelişkisi; **P1** ana görevi zorlaştıran mimari eksik; **P2** destekleyici iyileştirme. Bunlar kullanıcı testinden çıkan etki puanları değil, kaynak incelemesine dayalı tasarım öncelikleridir.

| ID | Öncelik | Güncel kanıt | Neden önemli? | Mimari kararı |
|---|---|---|---|---|
| F01 | P1 | `src/data/tree.ts`: yönetim, finans, kanal ve ayarlar Pazarlama altında birlikte | Kullanıcı bölüm adından varış yerini tahmin edemiyor | Göreve göre alanlar; mevcut adresleri koruyan yeniden gruplama |
| F02 | P0 | `src/data/revenue.ts` abonelik; `src/data/partnership.ts` iStoc yaklaşımı işlem başarı ücreti → hizmet → üyelik | Farklı para kazanma stratejileri tek şirket planı gibi okunabilir | Strateji sürümü ve model kimliği; iki yaklaşımın ilişkisi karara bağlanır |
| F03 | P0 | `partnership.ts` Segika yönlendirme modeli ilk 6 ücretli ay; `affilate.md` ilk/ikinci dönem alternatifleri | Ortağa birbirini tutmayan vaatler gösterilebilir | Ortak tipi + politika sürümü + yürürlük durumu; eski ve yeni model ayrı |
| F04 | P0 | `RevenuePage` özel seçenekleri `inputsOf` ile kullanıyor; `CashflowPage` `useScenario()` kimliği ve `m.cashflow` kullanıyor | Aynı senaryo adı bütün özel girdilerin taşındığı izlenimi verebilir | Etkin girdi özeti; taşınmayan değişikliği açık gösterme veya ortak snapshot |
| F05 | P1 | `OtherPages.tsx`: Karar bekleyenler içinde ücret, CRM, mesai | Karar listesini arayan kişi politika kılavuzunda kayboluyor | Karar kaydı ile yürürlükteki politika içeriğini ayır |
| F06 | P1 | `RolePage.tsx`: dijital rolde entegrasyon, araç, içerik ve kanal planı | Rol profili bütün pazarlama operasyonunu taşımış | Operasyonun ana adresi Pazarlama; rol sayfası görev ve filtrelenmiş teslim görünümü |
| F07 | P1 | `RevenuePage.tsx #dijital`: reklam ekonomisinin yanında kanal/takvim/kural ayrıntıları | Finans hesabı, uygulanacak pazarlama kılavuzuyla karışıyor | Hesap girdileri burada; kanal uygulama planı kendi ana adresinde |
| F08 | P1 | Marka ve ürün açıklamaları `partnership.ts` içinde | Projeyi tanımak için ileri düzey ortaklık sayfasına girmek gerekiyor | Marka/teklif bağlamını Strateji'ye, kısa özetini Genel bakış'a çıkar |
| F09 | P1 | Genel plan `managerPlan` ve rol planlarından; ortaklıkta ayrı iş paketleri | “Eylem planı” kapsamı bütün programı içeriyormuş gibi algılanabilir | Kapsamı görünür yap; ortak iş kimlikleriyle genel ve filtrelenmiş plan üret |
| F10 | P0 | `AppFrame.tsx altBilgiNotu`: türlere göre ayrım var, kalanlarda kesin karar varsayımı sürüyor | Öneri, eğitim ve taslak içerik gereğinden kesinleşiyor | Blok düzeyinde durum; sayfa genelinde yalnız kapsamı doğru özetleyen cümle |
| F11 | P1 | `program.ts calendarEvents`: istihdam yanında reklam, temsilci toplantısı, program kontrolleri | İşe alım takviminin sınırı belirsiz | İstihdamda işe alım olayları; bütün olaylar genel Eylem planı görünümü |
| F12 | P1 | `src/pages/email.astro`, `EmailPage`, `data/email.ts`: kişisel görüşme/e-posta taslağı | Ortak operasyon dokümanının amacı ve hedef kitlesiyle uyuşmuyor | Paylaşılan site içeriğinden ayırma önerisi; kişisel belgeyi kaybetmeden koruma |
| F13 | P1 | Applet örnekleri, yerel parametreler, Sheets planı farklı kaynak ve durumlarda | Bir yerde yapılan değişiklik bütün şirket verisine uygulandı sanılabilir | Her düzenleyicide kapsam, kaynak, değişiklik ve kalıcılık açıklaması |
| F14 | P1 | Metrikler çeşitli sayfalarda var; ortak hedef–tahmin–gerçekleşen görünümü yok | “Aktif”, “üye”, “ödeyen” farklı olaylar olarak izlenemiyor | Tek metrik sözlüğü; aynı metrik kimliğinin hedef ve gerçekleşen kayıtları |
| F15 | P2 | `SEQUENCE` sunum sırası ve breadcrumb bağlamını birlikte taşıyor | Sunumdaki sıra içerik hiyerarşisi gibi görünüyor | Ana adres, menü, breadcrumb ve sunum akışı ayrı tanımlanır |
| F16 | P0 | OPEX kaynak belgelerinde “Türksab” adı var; gelir modeli iStoc kapsamlı | Ortak giderin hangi markaya/programa ait olduğu açıklanmadan birleştirme yapılabilir | Kaynak kurum, gider kapsamı ve varsa dağıtım kuralı açık; yalnız ad farkından yanlış veri sonucu çıkarılmaz |

F04 bir kaynak-kod çıkarımıdır; bu görevde tarayıcıda yeniden üretilmiş hata değildir. Uygulama öncesi özel fiyat değişikliğiyle Gelir planı → Nakit akışı geçişi test edilmelidir.

### 3.1 F02 nasıl çözülecek?

Abonelik tahminini silmek veya ortaklık stratejisini ona uydurmak çözüm değildir. Önce `iStoc / abonelik planı` ile `iStoc / likidite pilotu` farklı strateji kayıtları olarak tanımlanır. Her kayıt; hedef müşteri, başarı olayı, gelir modeli, dönemi, varsayımı ve karar durumuyla gösterilir. Birlikte yürütüleceklerse kapsam ve geçiş koşulu yazılır; alternatiflerse karşılaştırma yapılır.

Mevcut gelir motoru aboneliği hesaplar. İşlem gelirine ait model bulunmadan “likidite pilotu” seçeneği aynı formüle bağlanamaz. Desteklenmeyen model için “Henüz hesap modeli yok; gereken girdiler…” görünür. Yapay sıfır gelir grafiği çizilmez.

### 3.2 F03 nasıl çözülecek?

Segika'nın toptan fiyat/hizmet marjı modeli, ticari yönlendirme modeli ve destek sağlayan çözüm ortağı aynı sözleşme değildir. Bunlar tek “partner” etiketi altında oran farkına indirgenemez. Ortak tipi, müşteri sahibi, destek sorumlusu, komisyon baz tutarı, kazanma olayı ve ödeme takvimi ayrı alanlar olur.

`affilate.md` içindeki bütün yüzdeler ve dönemler düzenlenebilir simülasyon girdisidir. Örnekteki `%10`, `%15`, `%25`, `%0` yürürlükteki ticari politika iddiası değildir. Ortaklık sayfası onaylanan politikayı ve simülasyona bağlantıyı gösterir; Affilate bir politikayı denediğinde diğer metinleri kendiliğinden değiştirmez.

## 4. İçerik sözleşmesi: tek ana kayıt, birden fazla bağlamsal görünüm

### 4.1 Ana ilişki modeli

```text
Marka → Program → Strateji → Hedef müşteri + Teklif + Kanal
                              ↓
                  Müşteri / ortak yolculuğu
                              ↓
                      Eylem → Sorumlu rol
                              ↓
                    Çıktı + Başarı ölçütü
                              ↓
                     Ölçüm + Kanıt + Karar

Politika sürümü + Varsayım seti + Dönem → Senaryo → Finansal tahmin
Karar → Politika / strateji değişikliği → Etkilenen plan ve tahmin
```

Burada “tek ana kayıt” her şeyi tek büyük `params.ts` dosyasına koymak anlamına gelmez. Parametre, kaynak veri, rol metni, politika ve senaryo farklı içerik türleridir. Aynı iş kuralının iki bağımsız ve çelişen kopyası olmaması anlamına gelir. Mevcut Astro/React/Mantine mimarisi korunur; bunun için yeni CMS veya backend zorunlu değildir.

### 4.2 Her içerik türünün ana adresi

| İçerik nesnesi | Ana adres | Başka yerde gösterilebilecek görünüm |
|---|---|---|
| Marka, problem, segment, teklif, para kazanma yaklaşımı | Önerilen Strateji | Genel bakış özeti; ortaklıkta programa özgü tercih |
| Hedef | Hedefler | Rol KPI'sı, kontrol noktası, gelir tahminiyle fark |
| Ölçüm tanımı ve kanıt kaydı | Önerilen Ölçüm | Hedef/kanal/rolün aynı metrik kimliğine bağlı sonucu |
| Eylem, teslim, bağımlılık | Eylem planı | Role, kanala veya ortaklık programına filtrelenmiş liste |
| Rol sorumluluğu | İlgili rol sayfası | Organizasyon düğümü, görevde sorumlu etiketi |
| İşe alım ihtiyacı ve koşulu | İstihdam takvimi | Nakit etkisi veya genel plan bağımlılığı |
| Müşteri aşaması ve devir koşulu | Önerilen Müşteri yolculuğu | Rolün üstlendiği adımlar; ortak kanala özgü giriş |
| Kanal çalışması, içerik üretimi, deney | Önerilen Pazarlama operasyonu | Gelir modelinde edinim varsayımı; rolde teslim sorumluluğu |
| Ortaklık türü, seçimi ve ticari politika | İş ortaklığı | Affilate'e yüklenebilen sürümlü başlangıç politikası |
| Çalışan/serbest çalışan ücret politikası | Önerilen Ücret ve çalışma modeli | Rol özeti; OPEX'te ilgili maliyet girdisi |
| Politika tasarlama örnekleri | Applet | Ücret politikasında yöntem bağlantısı; otomatik yürürlüğe alma yok |
| Gelir ve edinim ekonomisi | Gelir planı | Hedeflerde tahmin özeti; nakitte uyumlu tahsilat senaryosu |
| Gider kalemi | OPEX'in mevcut kaynak modeli | Gelir ve nakitte kapsamı belirtilmiş gider snapshot'ı |
| Nakit ihtiyacı | Nakit akışı | Genel bakış finansman uyarısı; karar talebi |
| Karar, gerekçe, durum ve geçmiş | Kararlar | İlgili politikada karar referansı; genel bakışta bekleyen karar |
| Yetki ve eskalasyon | Karar yetkisi | Karar kaydında karar sahibi; görevde yetki sınırı |
| Değiştirilebilir varsayım | İlgili kaynak/düzenleyici | Varsayımlar dizininde etki ve kaynağa bağlantı |
| Kişisel not | Notlar | Yalnız kullanıcının taslağı; resmi duruma otomatik dönüşmez |

### 4.3 Asgari içerik alanları

Zorunlu ortak alanlar: `id`, `type`, `title`, `userQuestion`, `canonicalLocation`, `brandScope`, `programId`, `owner`, `status`, `source`, `asOf`, `reviewTrigger`, `relatedIds`. Sahip veya kaynak bilinmiyorsa alan “belirlenmedi” olur; hayali kişi/kaynak üretilmez.

Türlere bağlı alanlar:

- **Metrik:** olay tanımı, birim, pay/payda, dönem, kohort, toplama yöntemi, başlangıç değeri, hedef, gerçekleşen, ölçüm kaynağı. Kümülatif ve dönemsel değer ayrı olur.
- **Politika:** sürüm, uygulanacağı kişi/ortak tipi, başlangıç-bitiş, koşul, istisna, karar kaydı. Geriye etkisi ayrıca tanımlanır.
- **Senaryo:** model sürümü, marka/program, varsayım sürümü, özel değişiklikler, fiyat/kur/dönem, maliyet kapsamı, kaynak snapshot'ları. Senaryo adı tek başına kimlik değildir.
- **Eylem:** teslim çıktısı, tek hesap veren sorumlu, katkı verenler, başlangıç/bitiş, bağımlılık, tamamlanma kanıtı, ilgili hedef.
- **Kaynak:** iddianın hangi kısmını desteklediği, kaynak türü, tarih, doğrulama durumu, kapsam. Arama bağlantısı doğrulanmış belge yerine geçmez.
- **Simülasyon sonucu:** girdi izleri, formül, birim, hesap zamanı, kapsam dışı tutarlar ve yuvarlama. Hesaplanan değer ayrıca düzenlenebilir kaynak gibi gösterilmez.

Bu alanların tamamı aynı anda kullanıcıya gösterilmez. Ana görünüm karar için gerekenleri, ayrıntı paneli izlenebilirliği taşır.

### 4.4 Birbirine karıştırılmayacak durum eksenleri

| Eksen | Örnek değerler | Örnek yanlış birleşim |
|---|---|---|
| İçerik yaşam döngüsü | Taslak, inceleniyor, onaylandı, yürürlükte, arşiv | Onaylanan planı “tamamlandı” göstermek |
| Kanıt niteliği | Ölçülmüş, kaynaklı, hesaplanmış, varsayılmış, örnek, bilinmiyor | Hesaplanmış tahmini ölçülmüş sonuç saymak |
| İş ilerlemesi | Planlandı, başladı, engelli, tamamlandı | Tarihi geçti diye görevi tamamlamak |
| Düzenleme kapsamı | Yayın varsayılanı, bu tarayıcı, bu senaryo, dış kaynak | Yerel değişikliği şirket kararı saymak |
| Güncellik | Kaynak tarihi, son kontrol, sonraki kontrol nedeni | Sayfanın derlenme tarihini veri tarihi saymak |

Renk bu ayrımları destekler; yerine geçmez. Her blok beş rozetle doldurulmaz: örneğin “Tahmin · iStoc abonelik planı · 24 ay” görünür, kalan detay “Hesabın dayanakları” altında açılır.

## 5. Hedef navigasyon ve adres sözleşmesi

### 5.1 Korunacak doğrudan kullanıcı kararları

- `/` organizasyon şeması olarak kalır. Genel bakış ihtiyacı yeni bir sayfayla karşılanır; ana sayfa sessizce değiştirilmez.
- `/applet/`, **İstihdam → Applet** altında kalır; aynı anda tek model görünür.
- Yeni `/affilate/`, **Pazarlama → Affilate** olarak planlanır; ad kendiliğinden düzeltilmez.
- `/partnership/` iki programlı yapıyı korur. İlgili hash ile doğrudan giriş ve geri/ileri çalışmalıdır.
- `/bcg/` genel eğitimdir, iStoc'a uygulanmış analiz değildir; mevcut karar gereği ana menüye ve sunum sırasına eklenmez.
- `/arsiv/` ikincil erişimde kalır. İçeriği silmek, geçmişi kaybetmek veya Git geçmişini değiştirmek bu belgenin talimatı değildir.
- OPEX'in kendi kaynak ve çalışma modeli korunur. Bu rapor veri kaynağı taşımaya yetki vermez.

### 5.2 Önerilen bilgi ağacı

Aşağıdaki gruplama bir öneridir. Mevcut menü etiketlerini değiştirmek uygulanacak kapsam olarak kabul edildiğinde yapılır; eski bağlantılar korunur. Yıldız yeni sayfa önerisini belirtir, yayımlanmış sayfa anlamına gelmez.

```text
Genel bakış *                         /genel-bakis/

Pazarlama
  Strateji ve teklif *                /strateji/
  Müşteri yolculuğu *                 /musteri-yolculugu/
  Pazarlama operasyonu *              /pazarlama-operasyonu/
  Temsilci ağı                        /buyume-modeli/  (mevcut MLM ağı)
  İş ortaklığı                        /partnership/
  Affilate *                          /affilate/

İstihdam
  Organizasyon şeması                 /
  Mevcut yedi rol profili             /roller/<rol>/
  İstihdam takvimi                    /istihdam/
  Ücret ve çalışma modeli *           /ucret-politikasi/
  Applet                             /applet/

Finans  (mevcut Giderler grubunun önerilen kapsam adı)
  Gelir planı                         /gelir-plani/
  Giderler                            /giderler/
  Nakit akışı                         /nakit-akisi/

Yönetim
  Hedefler                            /hedefler/
  Eylem planı                         /eylem-plani/
  Ölçüm ve sonuçlar *                  /olcum/
  Kararlar                            /karar-bekleyenler/
  Karar yetkisi                       /karar-yetkisi/

Yardımcı erişim
  Varsayımlar ve ayarlar              /parametreler/
  Kaynaklar ve tanımlar *             /kaynaklar/
  Notlar                             /notlar/
  Arşiv                              /arsiv/
```

Bu yapı **sekiz yeni sayfa adayıdır**; sekizini birden boş kabuk olarak yayımlamak gerekmez. Önce mevcut içeriği taşıyacak Strateji, Müşteri yolculuğu, Pazarlama operasyonu ve Ücret politikası ayrıştırılır. Ölçüm ve kaynak ihtiyacı ilk aşamada ilgili sayfaların anlamlı bölümleriyle başlayabilir; ortak kullanım oluşunca dizinleri açılır. Affilate ayrı mevcut görev tanımıyla uygulanır.

### 5.3 Gezinme kuralları

1. Bir sayfanın **bir ana ebeveyni** olur. Gelir planına Pazarlama'dan bağlamsal kısayol verilebilir; bu ikinci bir içerik kopyası değildir.
2. Menü sırası ekranlar arasında değişmez. Göreve bağlı kısayollar ana menünün yerini sessizce değiştirmez. Bu, [WCAG 2.2 tutarlı gezinme ilkesini](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html) destekler.
3. Sayfa hiyerarşisi, rol hiyerarşisi ve sunum sırası ayrı tutulur. `SEQUENCE` sunum rotasıdır; breadcrumb'ın tek otoritesi olmamalıdır.
4. “Önceki / sonraki” yalnız anlamlı sıralı çalışma veya sunum modunda kullanılır. Bütün sitede komşu sayfaya gitmek görev tamamlamak değildir.
5. Program/marka seçimi yalnız seçilen markanın içeriği gerçekten varsa sunulur. iStoc gelir modeline Segika etiketi takılmaz. Desteklenmeyen kapsam açıklanır.
6. Arama, sayfa başlığı yanında nesne adı ve eş anlamlıları bulur: “prim”, “komisyon”, “nakit ihtiyacı”, “görev”, “müşteri devri”. Sonuçta tür ve marka görünür. Arşiv varsayılan güncel sonuçlarla karıştırılmaz; kişisel e-posta indekslenmez. BCG'nin doğrudan erişim kararı korunur.
7. Uzun menüyü otuz eşdeğer bağlantı olarak açma. Anlamlı grup başlıkları kullan; var olan yedi rolün doğrudan erişimini kaybetme. Rol kataloğu için yeni sayfa zorunlu değildir.
8. Başlıklar aynı dil düzeyinde olur: “Gelir planı / Giderler / Nakit akışı”; “Hedefler / Eylem planı / Kararlar”. “Ağaç 3” içerik adı değildir; gerekiyorsa sunum sırası metadata'sıdır.

## 6. Bütün mevcut sayfalar için karar envanteri

“Taşı” çoğunlukla ana menü konumunu veya bölüm sahipliğini değiştirmek demektir; URL silme talimatı değildir. Aynı şablonu kullanan roller ayrı ayrı değerlendirilmiştir.

| ID | Mevcut yol | Karar ve ana görevi | Sayfadan çıkacak / bağlantıya dönüşecek | Eksik olan içerik |
|---|---|---|---|---|
| P01 | `/` | Koru: organizasyon ilişkileri | Şemaya tüm strateji metni ekleme | Rolün karar/işe alım durumu, ilgili profile ve Genel bakış'a açık geçiş |
| P02 | `/roller/dijital-pazarlama/` | Koru: rolün teslimleri ve sorumlulukları | Kanal, araç, üretim ve içerik planının tam metni → Pazarlama operasyonu | Kimin brief verdiği, kime ne devredildiği, kabul kanıtı |
| P03 | `/roller/pazarlamaci/` | Koru: iStoc CRM rolü | Ortak CRM süreç kılavuzu → Müşteri yolculuğu | Aday/ödeyen/aktif tanımları ve aşama giriş-çıkış koşulları |
| P04 | `/roller/saha-uzmani/` | Koru: saha teslimi | Kanalın bütün büyüme stratejisi → Temsilci ağı / Strateji | Saha → CRM devir paketi, tekrar kayıt kuralı, başarı olayının kanıtı |
| P05 | `/roller/ekip-lideri/` | Koru: ekibin koordinasyonu | Genel ağ modeli → Temsilci ağı | Hangi kararı alır, hangi durumda üst role taşır; role doğrudan erişim |
| P06 | `/roller/organizator/` | Koru: eğitim/organizasyon çıktısı | Kanalın genel toplantı programı → Eylem planında ortak olay | Katılım ile aktivasyon ayrımı; toplantı sonrası devrin sahibi |
| P07 | `/roller/segika/` | Koru: Segika satış/CRM sorumluluğu | Diğer rolün ürüne uymayan açıklamaları kopyalanmaz | Segika'nın müşteri, demo, ilk değer ve destek devir bağlamı |
| P08 | `/roller/asistan/` | Koru: operasyonel destek rolü | Şirketin bütün karar listesi → Kararlar | Talebi kim verir, tamamlanma kanıtı, yetki sınırı |
| P09 | `/istihdam/` | Koru: ihtiyaç, işe alım sırası ve başlangıç koşulu | Genel reklam/program takvimi → Eylem planı; ayrıntılı gelir hesabı → Gelir planı | Planlanan/gerçekleşen başlangıç ayrımı, bağımlılık ve maliyet kapsamı |
| P10 | `/hedefler/` | Koru; Yönetim'de ana adres öner | Ayrıntılı finansal tahminler → Gelir planı | Başlangıç, hedef, tahmin, gerçekleşen, veri yok durumu, sorumlu |
| P11 | `/eylem-plani/` | Koru; Yönetim'de bütünleşik teslim planı öner | Ayrı kaynaklarda bağımsız yazılan aynı görevler kaldırılır | Ortak görev kimliği, bağımlılık, teslim/kabul, program kapsamı |
| P12 | `/karar-yetkisi/` | Koru; Yönetim'de yetki ve eskalasyon | Kontrol noktalarının finansal hesapları → Hedef/Ölçüm bağlantısı | Karar sahibi, hazırlayan, danışılan, süre ve eskalasyon koşulu |
| P13 | `/karar-bekleyenler/` | Koru; görünen adı “Kararlar” öner | Ücret, CRM, mesai politika metinleri → kendi ana adresleri | Seçenekler, gerekçe, etki, karar tarihi, yürürlükteki politika bağlantısı |
| P14 | `/buyume-modeli/` | Koru: iStoc temsilci kanalı | Genel şirket büyümesi vaadi ve Segika ortaklık kuralları burada olmaz | Temsilci edinme hunisi ile müşteri edinme hunisinin ayrımı |
| P15 | `/partnership/` | Koru: iki marka için ortaklık programı | Marka düzeyi strateji → Strateji; genel müşteri akışı → Müşteri yolculuğu | Politika sürümü, maliyet/komisyon kapsamı, hipotez ve kanıt bağlantıları |
| P16 | `/gelir-plani/` | Koru; Finans'ta ana adres öner | Kanal uygulama kılavuzu → Pazarlama operasyonu | Para kazanma modeli, özel senaryo kapsamı, gider kapsamı, hedef/tahmin farkı |
| P17 | `/giderler/` | Koru: gider planı ve kaynak inceleme | Başka yerde aynı gider kalemlerinin bağımsız kopyası tutulmaz | Plan/ödeme ayrımı; kaynak güncelliği ve kapsamı blokta görünür |
| P18 | `/nakit-akisi/` | Koru: tahsilat/çıkış ve finansman ihtiyacı | Kâr veya ciro gibi adlandırılmaz | Kullanılan etkin gelir girdileri, açığın başladığı dönem, ilgili karar |
| P19 | `/parametreler/` | Koru; yardımcı “Varsayımlar ve ayarlar” öner | Politikayı onaylamış izlenimi veren sunum kaldırılır | Her grubun marka/model kapsamı, etkilediği sonuçlar ve kaynak |
| P20 | `/applet/` | Koru: İstihdam'da örnek model laboratuvarı | Onaylı şirket ücreti veya gerçek performans kaydı gibi sunum olmaz | Model seçme rehberi, ortak baz bilgisi, örnekten politika önerisine açık ayrım |
| P21 | `/bcg/` | Koru: yalnız doğrudan erişilen genel eğitim | Şirket stratejisi gibi konumlandırma yok | Kurgusal veri etiketi, uygulama için gereken gerçek veri açıklaması |
| P22 | `/notlar/` | Koru: kişisel çalışma aracı | Resmi görev ve kararların alternatif otoritesi olmaz | Yerel kapsam, taslağı ilgili resmi kayda dönüştürme yönergesi |
| P23 | `/arsiv/` | Koru: tarihsel kaynak ve karar izi | Güncel politika gibi sunum olmaz | Sürüm, geçerlilik dönemi, yerine geçen güncel içerik bağlantısı |
| P24 | `/email/` | Paylaşılan içerikten ayırma öner: kişisel görüşme taslağı | Kişisel metin ve kişi özelindeki koşullar ortak planın parçası olmamalı | Kişisel dosyada korunma; gerekiyorsa anonim genel görüşme şablonu |
| P25 | `/404/` | Koru: sistem sayfası | Eski sayfayı ana sayfaya gerekçesiz yönlendirme yok | Güncel geçerli bağlantılar; bilinen eski adres için anlamlı yeni hedef |

**Burada olmaması gereken tek belirgin bağımsız sayfa, paylaşılan operasyon içeriği açısından kişisel `/email/` taslağıdır.** Bu öneri gerçek kişisel ayrıntıları rapora taşımayı, dosyayı şimdi silmeyi veya geçmişi yeniden yazmayı gerektirmez. Menüde bulunmaması erişim kontrolü değildir. Uygulayıcı önce koruma yerini ve paylaşılacak kapsamı somutlaştırmalıdır.

BCG ve Applet'i “ana işe yabancı” diye silmek doğru değildir: biri kullanıcı kararıyla eğitim, diğeri ücret modeli tasarım aracıdır. Sorun varlıkları değil, operasyonel planla aynı kanıt/yürürlük düzeyinde sunulmalarıdır.

## 7. Bölüm ve blok taşıma planı

Tablolarda `/.../` site tabanına göre mantıksal yoldur; üretimde `/19ekim` tabanı uygulanır. “Yeni” hedefler henüz yoktur. Hedef oluşmadan mevcut içerik ve bağlantı kaldırılmaz. “Özet” aynı kayıttan türeyen görünüm anlamına gelir; bağımsız metin kopyası anlamına gelmez.

### 7.1 Yönetim, istihdam ve rol içerikleri

| Kaynak blok | Ana içerik nereye ait? | Kaynak sayfada ne kalmalı? | Hedefte eklenecek anlam |
|---|---|---|---|
| `/istihdam/#sira` | Aynı yerde | İşe alım sırası | İhtiyaç → onay → teklif → başlama durumları; bilinmeyenler açık |
| `/istihdam/#takvim` | İşe alım olayları burada; genel olaylar `/eylem-plani/` | İşe alım ve ilgili bağımlılık tarihleri | Reklam başlangıcı, temsilci toplantısı ve genel kontrol günü genel takvimde |
| `/istihdam/#katki` | Maliyet özeti burada; ayrıntılı karşı-olgusal gelir `/gelir-plani/#kadro` | Kadro adedi, dönemi, personel maliyeti ve hesap kapsamı | “Bu rol olmasaydı model sonucu” gerçek kişi performansı değildir |
| `/hedefler/#kopru` | Hedef farkı burada; hesap `/gelir-plani/` | Hedefe uzaklık ve ilgili senaryonun sonucu | Aynı dönem ve kapsam olmadan fark hesaplanmaz |
| `/hedefler/#acik` | Hedefe bağlı eylemler `/eylem-plani/`; finansal seçenek Gelir planı | Açığı kapatabilecek seçeneklerin kısa özeti | Seçenek, karar ve uygulanmış eylem farklı durumlar |
| `/hedefler/#aylik` | Tahmin dizisi `/gelir-plani/#gelir` | Hedef–tahmin karşılaştırması | Gerçekleşen veri yoksa ayrı “ölçülmedi” alanı |
| `/hedefler/#kaynak` | Kanal kapasitesi `/gelir-plani/`; kanal hedefi `/olcum/` | Hedefe hangi kaynağın ne katkı vermesi beklendiği | Katkı varsayımı ile ölçülen atıf ayrılır |
| `/eylem-plani/#gantt` ve `#tablo` | Aynı yerde, aynı eylem kayıtları | Zaman görünümü ve teslim listesi | İki görünüme ayrı görev yazılmaz; filtrelenmiş kapsam görünür |
| `/karar-yetkisi/#yetki` | Aynı yerde | Yetki ilişkisi | Karar türüne göre rol; yalnız ast-üst çizgisiyle yetinilmez |
| `/karar-yetkisi/#kontrol` | Kontrol kararı burada; ölçüm `/olcum/`, hedef `/hedefler/` | Koşul → değerlendiren → alınacak karar | Sayısal eşik ortak hedef kaydından gelir |
| `/karar-bekleyenler/#bekleyen` | Aynı yerde | Karar talebi listesi | Karar sorusu, seçenekler, etkiler, son tarih, karar sahibi |
| `/karar-bekleyenler/#kesin` | Aynı yerde, karar geçmişi | Karar özeti ve politika bağlantısı | Karar tarihi ile yürürlük tarihi ayrılır |
| `/karar-bekleyenler/#ucret` | Yeni `/ucret-politikasi/#ucret-ve-prim` | Kararın adı, durumu, ilgili sürüm bağlantısı | Kim için hangi koşulla geçerli olduğu |
| `/karar-bekleyenler/#crm` | Yeni `/musteri-yolculugu/#asamalar` | CRM kararının özeti | Aşamalar ve devir; prim uygunluğu ücret politikasına referans |
| `/karar-bekleyenler/#mesai` | Yeni `/ucret-politikasi/#calisma-duzeni` | İlgili karar bağlantısı | Çalışma koşulu ve maliyet hesabı ayrılır; mevcut iddialar doğrulama durumuyla |
| Rol başlığı / ücret özeti | İlgili rol sayfası; tam politika Ücret modeli | Misyon, sorumlu olduğu çıktı, başlangıç koşulu, politika özeti | Rolün organizasyonel değeri ile kişinin gerçekleşmiş performansı karıştırılmaz |
| Rol `#gorevler` | Rolün sorumluluk tanımı burada | Görev → çıktı → ölçüt | Sorumluluk ile tarihli tekil eylem ayrımı |
| Rol `#kpi` | Tanım `/olcum/`; role bağlı hedef görünümü burada | Az sayıda görevle ilişkili ölçüt | Payda, dönem, veri kaynağı; yalnız sayı listesi olmaz |
| Rol `#eylem-plani` | Ana kayıt `/eylem-plani/`; filtrelenmiş görünüm burada | Rolün teslimleri | Bağımlılık ve tamamlanma kanıtı |
| Rol `#gun` | Günlük operasyon ayrıntısı olarak rolde | Açılabilir günlük düzen | Örnek rutin mi bağlayıcı plan mı; ilgili çalışma politikası |

**Segika rolü için sınır:** Mevcut kullanıcı kararı rol şablonunu masa başı CRM rolünden türetmiştir. Ortak şablon korunabilir. Ancak kullanıcıya “başka rolün kopyası” demek görev tanımı değildir. Segika'ya özgü müşteri, demo ve destek devri henüz tanımlı değilse “netleştirilecek” alanlar olarak gösterilir; iStoc'un satıcı/ürün olayları otomatik kopyalanmaz.

### 7.2 Dijital pazarlama ve gelir planı

| Kaynak blok | Ana hedef | Kaynakta kalacak görünüm | Dönüşüm kuralı |
|---|---|---|---|
| Dijital rol `#olcum` | `/pazarlama-operasyonu/#olcum-kurulumu` | Rolün teslim tarihi ve kabul ölçütü | GA/GTM vb. araç kurulumu, iş metriğinin kendisi değildir |
| Dijital rol `#otomasyon` | `/pazarlama-operasyonu/#otomasyon` | Bakım ve teslim sorumluluğu | Araç → süreç → beklenen çıktı → insan kontrolü ilişkisi |
| Dijital rol `#uretim` | `/pazarlama-operasyonu/#uretim` | Role atanmış üretim hedefleri | Üretim adedi ile müşteri sonucu ayrı katmanlar |
| Dijital rol `#icerik-plani` | `/pazarlama-operasyonu/#icerik` | Bu role düşen üretim işleri | Segment → soru → mesaj → format → dağıtım → sonuç |
| Dijital rol `#eylem-plani` | Eylem planındaki kanal işleri | Rol filtresi | Genel planla aynı kimlik ve tarih |
| Dijital rol `#gun` | Rol sayfası | Günlük görev akışı | Kanal stratejisinin yerine geçmez |
| Gelir `#hedefler` | Finansal tahmin burada; hedef kaydı Hedefler'de | Seçili varsayımla hedefe ulaşma tahmini | “Hedef tarihi” ile “modelin öngördüğü tarih” farklı alanlar |
| Gelir `#kadro` | Kapasite ve ekonomik katkı burada | Modelde rol/kaynak etkisi | Organizasyon hiyerarşisi veya maaş pazarlığı eklenmez |
| Gelir `#dijital` edinim zinciri ve CAC/LTV | Gelir planı | Edinim ekonomisi ve bütçe hassasiyeti | Hesap varsayımı kaynaklı; gerçekleşmiş verimlilik iddiası yok |
| Gelir `#dijital` kanal planı, takvim, uygulama kuralları | `/pazarlama-operasyonu/#kanallar` ve `#deneyler` | Bir sonuç özeti ve “Kanal planını aç” | Tam operasyon kılavuzu burada tekrarlanmaz |
| Gelir `#gelir` | Aynı yerde | Aylık/kümülatif tahmin | Tahakkuk, tahsilat, yıllık peşin ve dönemsellik tanımı açıklanır |
| Gelir `#senaryo` | Aynı yerde | Ortak temel üzerinden karşılaştırma | Farklı iş modelleri aynı presetmiş gibi kıyaslanmaz |
| Gelir `#fiyat` | Senaryo fiyatı burada; onaylı teklif `/strateji/#teklif` | Düzenlenebilir fiyat ve yıllık ödeme etkisi | Yerel fiyat denemesi yayın tarifesini değiştirmez |
| Gelir `#huni` | Sayısal dönüşüm modeli burada; olay sözlüğü Müşteri yolculuğu/Ölçüm | Varsayılan dönüşümler ve sonuç | Üyelik, ilk ödeme, devam eden ödeme ayrı olay kimlikleri |
| Gelir `#basabas` | Aynı yerde | Kapsamı belirtilmiş başabaş ve hassasiyet | Nakit finansman açığıyla aynı sonuç diye adlandırılmaz |
| Gelir `#varsayim` | Aynı yerde bağlamsal; dizin `/parametreler/` ve `/kaynaklar/` | Etkin girdi ve kaynak açıklaması | Kaynak, varsayılan ve özel değer ayrı |

Finansal sayfanın her pazarlama açıklamasını kaldırmak da yanlış olur. Sonucu anlamak için gereken “bir yeni müşteri nasıl hesaplandı?” açıklaması Gelir planında kalır. Başka sayfaya taşınacak olan, hesabı açıklamayan uzun operasyon kılavuzudur.

### 7.3 İş ortaklığı: iki programdaki bütün bölüm aileleri

`{p}` = `segika` veya `istoc`. Örneğin `#segika-program` bölümüne giriş ile içerideki `#segika-kural` blok kimliği aynı adres düzeyi değildir. Geçişte ikisi de eşlenmelidir. Programın sekiz bölümü korunabilir; içerik sahipliği değiştiğinde bölümde özet ve bağlantı kullanılır. Bu tablo aynı stratejiyi iki yerde yeniden yazmayı önler.

| Mevcut blok ailesi | İçeriğin ana sahibi / hedef | Ortaklık sayfasında kalacak |
|---|---|---|
| `{p}-ozet` | Marka tanımı Strateji; ortaklık amacı burada | Programın amacı, hedef kitlesi, kritik seçim ve durum |
| `{p}-kaskad` | Marka düzeyi seçim `/strateji/#secimler` | Ortaklık kanalına düşen stratejik seçim |
| `{p}-eylem` | `/eylem-plani/` | Ortaklık programına filtrelenmiş kritik teslimler |
| `{p}-kacin` | Stratejinin tercih/kaçınma gerekçesi | Sadece ortaklık kararına etki eden kısa uyarılar |
| `{p}-durum` | Kaynak/kanıt kaydı; Strateji teşhisi | Programa ilişkin kanıt özeti, tarihi ve sınırı |
| `{p}-icveri` | Ölçüm hazırlığı / Eylem planı veri toplama işi | Bu program için eksik veri ve sahibi |
| `{p}-hipotez` | Strateji hipotez kayıtları | Programın sınadığı hipotezler |
| `{p}-gorusme` | Strateji doğrulama planı; görüşme görevi Eylem planı | Ortak keşfine özgü sorular ve kanıt beklentisi |
| `{p}-segment` | Son müşteri segmenti Strateji; ortak segmenti burada | Ortak profili ve seçilme gerekçesi |
| `{p}-hucre` | iStoc Strateji'de kategori/koridor seçimi | Ortağın seçilen hücreye katkısı; Segika'ya yapay hücre eklenmez |
| `{p}-ortak-tip` | Burada | Tür, müşteri erişimi, sorumluluk, uygun olmayan durum |
| `{p}-ortak-puan` | Burada | Puan kartı, ağırlık, kanıt ve uygunluk eşiği |
| `{p}-katman` | Burada, politika sürümü altında | Katmanın giriş/çıkış koşulu ve sağlanan haklar |
| `{p}-yolculuk` | Ortak kazanım/aktivasyon yolculuğu burada | Ortak başvurusu → aktif katkı → yenileme |
| `{p}-akis` | Genel müşteri akışı `/musteri-yolculugu/` | Ortağın getirdiği müşteriye özgü giriş ve devir adımları |
| `{p}-kural` | Burada sürümlü ortaklık politikası | Şart, kapsam, istisna, karar durumu |
| `{p}-ekonomi` | Ortak ekonomisi burada; Segika hesap denemesi Affilate | Baz tutar, oran/dönem politikası, destek maliyeti kapsamı |
| `{p}-kanal` | Kanalın ortak edinme planı burada; ortak platform işleri Pazarlama operasyonu | Ortakları nasıl bulacağız sorusunun yanıtı |
| `{p}-giris` | Marka satın alma bağlamları Strateji | Ortak kanalında hangi bağlamla yaklaşılacağı |
| `{p}-kpi` | Tanım Ölçüm; hedef program kaydı | Bu programa ait hedef ve veri durumu |
| `{p}-huni` | Ortak dönüşüm modeli burada | Müşteri hunisiyle karıştırılmayan ortak hunisi |
| `{p}-gecit-hedef` | Hedef/Ölçüm + karar geçidi | Eşik, kontrol tarihi ve karar sonucu |
| `{p}-asama` | Programın yaşam döngüsü burada | Aşamaların amacı ve çıkış koşulu |
| `{p}-gantt` | Ana görevler Eylem planı | Programa filtrelenmiş zaman görünümü |
| `{p}-gecit` | Karar geçidi; yetki Karar yetkisi'nde | Devam / düzelt / durdur koşulu ve karar sahibi |
| `{p}-ritim` | Ortaklık çalışma ritmi burada | Toplantının çıktısı ve hangi kaydı güncellediği |
| `{p}-ceyrek` | Eylem planı / strateji değerlendirmesi | Sonraki dönemin hipotezleri; kesin sonuç gibi yazılmaz |
| `{p}-risk` | Program risk kaydı burada; genel bakışta kritik özeti | Tetikleyici, etki, önlem, sahip, ilgili karar |
| `{p}-pivot` | Strateji alternatifleri + Kararlar | Programa özgü yön değiştirme koşulu |
| `{p}-kapasite` | Program kaynak ihtiyacı; finans bağlantısı | Saat/kapasite varsayımı ve sorumlu; gerçekleşmiş efor değildir |

Mevcut ortaklık sayfasında düşünür adı/akademik kaynakça gösterilmemesine ilişkin proje kararı korunur. İçeride kaynağın izi ve tarihi tutulabilir; kullanıcıya “Bu gözlem şirket verisi değildir” gibi gerekli kanıt sınırı gösterilir. Bu rapor akademik kaynakçayı ürün ekranına zorla ekleme talimatı değildir.

### 7.4 Diğer sayfaların bölüm kararları

| Kaynak | Korunacak içerik / ana adres | Ayrılacak veya eklenecek bağlam |
|---|---|---|
| Temsilci ağı `#kademe` | Ağa katılım ve sorumluluk katmanları | Organizasyon çalışan hiyerarşisinden ayrı ilişki türü |
| Temsilci ağı `#huni` | Temsilci edinme/aktivasyon hunisi | Müşteri edinme sayılarıyla aynı toplama girmez |
| Temsilci ağı `#hedef` | Kanal hedefleri | Başarı olayı, dönem, kaynak ve genel hedef bağlantısı |
| Nakit `#ozet` | İlk açık, en düşük bakiye, finansman ihtiyacı | Açılış nakdi ve yatırım ile faaliyet tahsilatı ayrı |
| Nakit `#tablo` | Ay bazında giriş/çıkış/bakiye | Kullanılan senaryo snapshot'ı ve gider kapsamı |
| Nakit `#varsayimlar` | Kaynak ve kapsam açıklaması | Veriye ulaşılamaması ile gerçek sıfır ayrımı |
| OPEX `#plan-bolum` | Dönemsel gider planı | Kaynağın plan olduğu; gerçek ödeme takibi varmış gibi sunulmaz |
| OPEX `#kalemler-bolum` | Kanonik gider kalemleri | Süzülmüş toplam/genel toplam ve seçili ay anlamı korunur |
| OPEX `#ozet-{yıl}` | Yıl özeti | 15 aylık plan ile seçili yılın farklı dönem kapsamı |
| OPEX `#ucretler-{yıl}-bolum` | Personel maliyeti özeti | Ücret politikasına bağlantı; kişisel performans yorumu yok |
| OPEX `#bordro-{yıl}-bolum` | Ayrıntı incelemesi olarak bordro hesabı | Ana gider okumasından sonra isteğe bağlı ayrıntı; ayrı sayfa şart değil |
| OPEX `#varsayimlar-2027` | İlgili yılın hesap varsayımları | Kaynak ve güncellik; burada ikinci bağımsız ayar seti oluşturulmaz |
| OPEX `#tesvikler-{yıl}-bolum` | Hesabın ilgili ayrıntısı | Uygunluk varsayımı ve doğrulama durumu; yeni hukuki iddia eklenmez |
| Parametreler görev grupları | Düzenlenebilir parametreler aynı yerde | Hangi programa ve sonuca etki ettiğini ekle |
| Parametreler `#turetilen` | Hesaplanmış değerler | Input görünümü verilmez; kaynak girdilere git |
| Notlar listeleri | Kişisel taslaklar aynı yerde | Tamam işareti şirketin resmi eylemini tamamlamaz |
| Arşiv eşleştirmeleri | Tarihsel kayıtlar | “Bu kaydın güncel karşılığı” bağlantısı |
| BCG: amaç, eksenler, kutular, stratejiler, adımlar | Eğitim akışı aynı yerde | Şirket verisi iddiası yok |
| BCG: örnek, hatalar, sınırlar, sınav | Eğitim akışı aynı yerde | Kurgusal örnek ve öğrenme geri bildirimi; şirket değerlendirmesi yok |
| Applet'in 17 modeli | Tek sayfanın anlamlı alt modelleri | Model seçme amacı, input–sonuç–dayanak ayrımı; §10.3 |

## 8. Eksik sayfaların içerik brief'leri

Bir sayfanın açılması için **ayrı kullanıcı görevi, yeterli içerik, içerik sahibi ve bağlantılı devam adımı** bulunmalıdır. Yalnız yeni menü öğesi üretmek için sayfa açılmaz. Aşağıdaki başlık ve adresler öneridir; içerik taşınırken kullanılacak hedef sözleşmesini somutlaştırır.

### N01 — Genel bakış · `/genel-bakis/`

**Soru:** “Bu çalışma neyi planlıyor, şu an hangi kararı vermeliyim?”

İçerik sırası: proje/marka açıklaması → incelenen program ve dönem → en önemli hedef ile veri durumu → yakın teslimler → bekleyen kritik kararlar → finansal ihtiyaç özeti → ilgili ayrıntıya geçiş. İlk ekranda projenin ne olduğu ve seçili kapsam anlaşılır; bütün KPI'lar dökülmez.

Birleşim: sade editoryal giriş + `FactsRow` + kanıt durumu belirtilmiş `ResultSummary` + teslim/karar listesi. 320'de aynı öncelik sırası korunur. “Gerçekleşen bulunmuyor” boşluğu, ölçüm toplama işine bağlanır. Örnek veya varsayılan veri başarı göstergesine dönüştürülmez. Ana sayfanın yerini almaz.

### N02 — Strateji ve teklif · `/strateji/`

**Soru:** “Hangi müşterinin hangi problemini, hangi teklifle, hangi iş modeliyle çözüyoruz?”

Bölümler: `#marka`, `#problem`, `#segmentler`, `#teklif`, `#secimler`, `#hipotezler`, `#dogrulama`, `#alternatifler`. Marka başına; müşteri/kullanıcı/ödeyen taraf, mevcut alternatif, temel değer, kapsam dışı müşteri, fiyatlandırma mantığı, kazanma yaklaşımı ve kanıtı ayrı yazılır.

iStoc'ta alıcı ve tedarikçi iki ayrı taraftır. Segika'da ürünü kullanan, satın alan ve yönlendiren aynı kişi olmayabilir. Aynı “müşteri” metni hepsine yapıştırılmaz. iStoc abonelik ve likidite yaklaşımları F02 çözülene kadar açık alternatiflerdir. Ticari koşulu kesinleştirmez; ilgili karar kaydını açar.

Sunum: segment karşılaştırması + teklif kapsamı listesi + seçim/gerekçe matrisi + hipotez/kanıt listesi. Kurgusal pazar payıyla BCG matrisi çizilmez. Eksik veri: strateji sahibi, seçilmiş model, doğrulama sonuçları. Eksiklik açık kayıt olur; iddialı tanıtım metniyle doldurulmaz.

### N03 — Müşteri yolculuğu · `/musteri-yolculugu/`

**Soru:** “Bir kişi nasıl müşteriye dönüşür; her aşamada kimin ne yapması gerekir?”

Bölümler: `#asamalar`, `#devirler`, `#ilk-deger`, `#yenileme`, `#istisnalar`, `#olcum`. Her aşama: müşteri amacı → giriş koşulu → şirketin işi → sorumlu → teslim/kanıt → çıkış koşulu → sonraki sahip. “CRM aşaması” arayüzde bir etiket olmaktan çıkar, somut bir olay olur.

iStoc alıcı talebi/teklif/işlem yolu ile tedarikçinin kayıt/ürün/ödeme yolu ayrılır. Segika görüşme/teklif/tahsilat/aktivasyon/ilk fayda/yenileme yolu ayrı profil olur. Ortak tarafından getirilen müşterinin başlangıç ve devir noktası işaretlenir. Ortak adayının aktivasyonu müşteri aktivasyonuyla karıştırılmaz.

Sunum: masaüstünde sorumluluk şeritli akış; telefonda sıra numaralı aşama listesi, her aşamada sorumlu ve çıkış kanıtı görünür. Ayrıntı açılabilir. Tam CRM geliştirmek veya gerçek müşteri verisi yaratmak bu sayfanın önkoşulu değildir.

### N04 — Pazarlama operasyonu · `/pazarlama-operasyonu/`

**Soru:** “Hangi kanalda ne üreteceğiz, kim yürütecek, neyi sınayacağız?”

Bölümler: `#kanallar`, `#icerik`, `#uretim`, `#olcum-kurulumu`, `#otomasyon`, `#deneyler`. İçerik planı şu zinciri kurar: hedef segment → müşterinin sorusu → mesaj → format → kanal → çağrı → beklenen müşteri olayı. Yalnız “ayda şu kadar video” listesi yeterli değildir.

Kanal kaydı: amaç, hedef kitle, teklif, owner, bütçe kaynağı, üretim ritmi, deney hipotezi, devam/durdurma ölçütü. Araç listesi destekleyici ayrıntıdır; araç almak strateji veya sonuç sayılmaz. Buradaki teslimler Eylem planından, sorumlular rol kayıtlarından, maliyetler ilgili finans kaynağından gelir.

Sunum: kanal karşılaştırması + üretim takvimi/listesi + mesaj örneği + deney kaydı + otomasyonun insan kontrol noktaları. Gelir sayfası yalnız bu kanalların hesap girdilerini ve ekonomik sonuçlarını gösterir.

### N05 — Ücret ve çalışma modeli · `/ucret-politikasi/`

**Soru:** “Bu rol/çalışma biçimi için hangi ücret ve prim koşulu geçerli?”

Bölümler: `#kapsam`, `#ucret-ve-prim`, `#uygunluk`, `#calisma-duzeni`, `#degisiklikler`. Çalışan, serbest çalışan ve satış ortağı kapsamları ayrılır. Segika ortak komisyonu bu sayfanın ücret politikası içine gömülmez; İş ortaklığına bağlanır.

Politika: durum, sürüm, hangi rol/kontrat türüne uygulandığı, sabit/değişken bileşen, hak kazanma olayı, ödeme dönemi, değişiklik gerekçesi. Applet'teki örnek rakamlar otomatik “şirket politikası” olmaz. Mevcut mesai/hukuki ifadelerin kaynağı ve doğrulama ihtiyacı korunur; bu çalışma yeni yasal değerlendirme eklemez.

Sunum: politika özeti + koşul matrisi + örnek hesap + değişiklik geçmişi. “Örneği Applet'te dene” bağlantısı uygundur; “Uygula” diyerek gerçek ücretleri sessizce değiştirmek uygun değildir.

### N06 — Ölçüm ve sonuçlar · `/olcum/`

**Soru:** “Başarıyı nasıl tanımlıyoruz, elimizde hangi veri var, hedefe göre neredeyiz?”

Bölümler: `#sozluk`, `#hedef-tahmin-gerceklesen`, `#veri-hazirligi`, `#deney-sonuclari`. Önce metrik sözlüğü ve veri hazır olma durumu kurulur; gerçekleşen veri yokken dashboard dekoru yapılmaz.

Asgari tanımlar: üye/kayıt, ilk ödeme yapan, ödemeye devam eden, aktif temsilci, aktif ortak, nitelikli talep, geçerli teklif, teyitli işlem, gelir, tahsilat, komisyon, personel maliyeti, toplam gider, dönem sonu nakit. Her metrik marka/program bazında tanımlanır; aynı kelime farklı olay ise aynı ID kullanılmaz.

Sunum: tanım kaydı + hedef/tahmin/gerçekleşen karşılaştırması + kaynak/eksik veri listesi. Kohort ve trend ancak dayanak kayıtlar varsa gösterilir. Eksik veri “0” olarak çizilmez. Hedefi tutturma durumu kaynak güncelliğine bağlıdır.

### N07 — Kaynaklar ve tanımlar · `/kaynaklar/`

**Soru:** “Bu bilgi hangi kaynaktan geliyor ve hangi kararı etkiliyor?”

Bölümler: `#kaynaklar`, `#terimler`, `#celiskiler`, `#guncellik`. Kaynak türü ve iddia ilişkisi kaydedilir: yayın varsayılanı, yerel değişiklik, model çıktısı, dış gözlem, karar kaydı, Sheets planı. Kayıt başına tarih, kapsam, ilgili içerik ve doğrulama sınırı bulunur.

Bu bir bütün belgeleri yığma sayfası değildir. Kullanıcı bir sonuçtan ilgili kaynağa, kaynaktan etkilenen hesap/karara gidebilir. Kişisel e-posta, erişim anahtarı, gizli kaynak içerikleri burada listelenmez. Ortaklık ekranının kaynakça göstermeme kararı korunur; iç izlenebilirlik bununla karıştırılmaz.

### N08 — Affilate · `/affilate/`

**Soru:** “Aynı satış koşullarında farklı ortaklık modelleri ne kazandırır, hangi ayda ödenir?”

Hesap ve kabul sözleşmesi `affilate.md` dosyasındadır. İçerik sırası: kapsam/örnek uyarısı → ortak profilleri → düzenlenebilir koşullar → ortakların aynı satış üzerinden karşılaştırılması → aylık hakediş/ödeme → istisna olayları → açıklamalı hesap → senaryo farkı.

İlk fatura, ilk yıl, hizmet süresi, tahsilat ve ortağa taksit ödemesi ayrı anlatılır. Bütün oranlar input; hesap çıktıları türetilmiş sonuçtur. Üçüncü dönem `%0` da input kalır. Müşteri toplamından alınan yüzde, her ay yeniden aynı tutara uygulanmaz. Ortaklık sayfasındaki mevcut politika bu simülasyonla aynı sürümde değilse fark görünür olur.

### 8.1 Şimdilik ayrı sayfa açılmayacak konular

Riskler, fiyatlandırma, destek, bordro ayrıntısı, araştırma görüşmeleri ve otomasyon araçları için hemen altı yeni menü öğesi açılmaz. Bunlar sırasıyla program/strateji, teklif, müşteri yolculuğu, OPEX, doğrulama ve pazarlama operasyonu içinde başlar. Ayrı sahip, sık bağımsız kullanım ve yeterli içerik oluşursa ayrı adres değerlendirilir.

**Segika finans planı** içerik açısından eksiktir; ancak iStoc motorunun etiketini değiştirerek üretilemez. Önce Segika fiyat, müşteri birimi, destek maliyeti, ortak komisyonu ve tahsilat modelinin kapsamı belirlenir. Yeni finans görünümü bu verilerle kurulabilir. Bu eksiklik “sıfır gider/gelir” diye kapatılmaz.

## 9. Sayfa iskeletleri: aynı hiyerarşi, içeriğe göre farklı sunum

### 9.1 Bütün ana sayfalarda bulunacak anlam katmanları

1. **Konum:** anlamlı breadcrumb ve tek H1. Sunum numarası başlığın yerine geçmez.
2. **Amaç:** bu sayfada hangi soruya yanıt bulunacağı; gerekiyorsa kapsam sınırı.
3. **Bağlam:** marka/program, dönem, model/politika sürümü ve veri niteliğinden gerekli olanlar.
4. **Öncelikli yanıt:** en önemli sonuç, karar veya teslim. Önce araç çubuğu ve uzun açıklama gelmez.
5. **İnceleme alanı:** göreve uygun karşılaştırma, akış, liste, matris veya zaman çizgisi.
6. **Dayanak:** yöntem, formül, kaynak, varsayım, eksik veri; ilgili yerde açılabilir ayrıntı.
7. **Devam:** kullanıcının bir sonraki anlamlı adımı. Rastgele sonraki sayfa bağlantısı değildir.

Bu katmanlar yedi ayrı kart değildir. Boşluk, tipografi ve hizalama ile tek okunabilir akış oluşturur. Kısa sayfada amaç ve bağlam aynı girişte çözülebilir.

### 9.2 Dört sayfa ailesi

| Sayfa ailesi | Esas akış | Örnek | Saklanmaması gereken bilgi |
|---|---|---|---|
| Karar / strateji | Soru → seçenek → kanıt → sonuç/karar → sorumlu adım | Strateji, Kararlar | Çelişki, bilinmeyen, kapsam ve karar durumu |
| Operasyon | Amaç → teslim → sahip → sıra/bağımlılık → kabul | Rol, Eylem planı, Yolculuk | Teslim ve devir koşulu |
| Hesap / simülasyon | Sonuç → etkin girdiler → karşılaştırma → ayrıntı → kaynak | Gelir, Nakit, Affilate, Applet | Sonucu değiştiren etkin özel girdi ve hesap kapsamı |
| Referans / kaynak | Tanım → kullanım bağlamı → dayanak → ilişkili içerik | Kaynaklar, Ölçüm sözlüğü, Arşiv | Geçerlilik, sürüm ve örnek/gerçek ayrımı |

### 9.3 İlk ekran için editoryal sınır

İlk görünüm şu üç soruyu cevaplamalı: **Neredeyim? Burada neyi anlayacağım/değiştireceğim? Gördüğüm sonucun kapsamı ne?** “Üç kart” veya sabit piksel yüksekliği zorunluluğu yoktur. 320 px ve büyütülmüş metinde içerik doğal akmalıdır. Kritik kapsam açıklaması accordion içinde saklanmaz.

Her bölüm başlığı bir bilgi vaadi taşır. “Özet”, “Durum”, “Diğer” gibi başlıklar bağlamla tamamlanır: “Ortaklık programının amacı”, “Ölçülmesi gereken veriler”, “Bu ayın nakit açığı”. Ancak form seçenekleri başlık cümlesine dönüştürülmez: grup etiketi bağlamı verir; seçeneklerde `%100`, `399 €`, `Mart 2027` gibi paralel değerler bulunur.

### 9.4 Simülasyon açıklamasının örnek iskeleti

```text
Başlık: İlk müşteriden kazanacağınız komisyon
Bağlam: Segika · Örnek senaryo · İlk fatura modeli
Sonuç: [hesaplanan toplam]
Neye göre: [tahsil edilen uygun tutar] × [girilen oran]
Ne zaman: [seçilen kazanma ve ödeme takvimi]
Koşul: [ödeme / destek / uygunluk koşulu]
Ayrıntı: Aylık dağılımı ve hesap yöntemini aç
Devam: Aynı satışı diğer ortak modelleriyle karşılaştır
```

Buradaki parantezler dinamik alanları gösterir. Aynı açıklamanın içindeki rakamlar bir kez daha elle yazılmaz. “Toplam”, “bu ay”, “müşteri yaşı” ve “hizmet süresi” birbirinin yerine kullanılmaz.

## 10. İçerik → master component eşleştirmesi

### 10.1 Mevcut parçaları temel al

Kaynakta bulunan `PageHeader`, `ResultSummary`, `Section`, `FactsRow`, `DataTable`, `KayitListesi`, `Stats`, `KpiGrid`, `Note`, `Chart`, `Choice`, `SenaryoSecimi`, `SenaryoKurucu`, `YapiskanOzet` ve `appletKit` parçaları ilk başvuru noktasıdır. Ortaklıkta program/bölüm sekmeleri ve puan kartı; OPEX'te filtreli tablo/kayıt kabukları zaten vardır.

Yeni desenler önce bunların bileşimleri olarak tasarlanır. Aşağıda kullanılan “karar kaydı”, “kanıt paneli”, “yolculuk şeridi” gibi adlar **önerilen desenlerdir**, projede bugün var olan export adları değildir. Mantine sürümünü veya teknoloji yığınını bu rapor için değiştirme. Resmi doküman o gün 9.7.4 gösterse de incelenen projede 9.7.3 kaydı vardır; API uyumu uygulama aşamasında mevcut manifest/lockfile ile doğrulanır.

### 10.2 Sunum kataloğu

| ID | İçerik / kullanıcı işi | Önerilen zengin sunum | 320 px karşılığı | Tasarımın bozulacağı kullanım |
|---|---|---|---|---|
| C01 | Programı anlamak | Editoryal giriş + kısa `FactsRow` + ilgili karar özeti | Tek akış; önce amaç ve kapsam | Her cümleyi farklı karta bölmek |
| C02 | Sonucu ve nedenini görmek | `ResultSummary` + girdi farkı + hesap dayanağı | Önce ana sonuç, sonra karşılaştırma ve kapsam | Kaynaksız büyük sayı; üç farklı para birimini karıştırmak |
| C03 | Hedefe yakınlığı anlamak | Başlangıç/hedef/tahmin/gerçekleşen karşılaştırması; uygun durumda bullet chart | Aynı dört anlamı taşıyan etiketli değer listesi | Bilinmeyen gerçekleşeni sıfır veya yüzde tamamlanma yapmak |
| C04 | Segment seçmek | Eş alanlı karşılaştırma matrisi; sorun/uygunluk/erişim/kanıt | İki segment seçip ölçüt bazında karşılaştırma; ayrıntı kayıtları | Sadece marka logoları veya persona fotoğrafları |
| C05 | Stratejik seçenek tartmak | Seçenek–gerekçe–kanıt–bedel matrisi | Seçenek özeti + ölçüte göre karşılaştırma | Verisiz 100 üzerinden başarı puanı |
| C06 | Müşteri akışını anlamak | Sorumluluk şeritleri ve devir noktaları olan yolculuk | Sıralı aşama listesi; sahip/çıkış koşulu sürekli görünür | Telefonda bütün diyagramı küçültmek |
| C07 | Ortak yolculuğunu izlemek | Aşama + uygunluk + sonraki adım çizgisi | Mantine Timeline / semantik sıralı liste | Planı gerçek ilerleme gibi yeşile boyamak |
| C08 | Organizasyonu okumak | İlişki türü belirgin şema + rol bağlantıları | Hiyerarşik liste ve role giriş | Çalışan, dış ortak ve müşteri ilişkisini aynı ast-üst çizgisiyle göstermek |
| C09 | Rolü değerlendirmek | Misyon → çıktılar → sorumluluk → ölçüt → günlük ayrıntı | Aynı sıra, kısa `dl`, açılabilir rutin | Maaş veya unvanı rolün tek açıklaması yapmak |
| C10 | Teslimleri planlamak | Gantt + aynı veriden teslim listesi; bağımlılık gösterimi | Yaklaşan teslim listesi, tarih/sahip/engel; Gantt eşdeğeri | “Tamamlandı” kanıtı olmadan dolu ilerleme çubuğu |
| C11 | Takvimi incelemek | Aylık takvim + seçili günün olay listesi | Yaklaşan olaylar varsayılan; takvim ikincil | Gün hücresine bütün olay metinlerini sıkıştırmak |
| C12 | Karar vermek | Karar kaydı: soru/seçenek/etki/owner/durum; gerektiğinde fark görünümü | Kritik karar özeti açık, seçenekler sırayla; karşılaştırma korunur | Tek “bekliyor” rozeti; seçenek ve etkisi yok |
| C13 | Politikayı uygulamak | Koşul → uygunluk → sonuç tablosu + sürüm/değişiklik geçmişi | Koşul kartı/listesi; aktif sürüm görünür | Uzun politika metnini genel karar kuyruğuna gömmek |
| C14 | Hipotezi sınamak | Hipotez / sınama / kanıt / sonuç kaydı | Kısa kayıtlar; eksik kanıt için açık durum | Kanıt kartının dekoratif güven yüzdesi |
| C15 | Kanalı yönetmek | Kanal karşılaştırması + kampanya/deney listesi | Kanal seçimi ve aynı ölçütlerle kayıt karşılaştırması | Takipçi, reklam gideri, tahsilatı tek “başarı” eksenine yığmak |
| C16 | İçerik üretmek | Segment–soru–mesaj–format–dağıtım matrisi + örnek içerik önizlemesi | Üretim işi bazında kayıt; brief ve yayın koşulu | Yalnız format sayısı listesi |
| C17 | Gelir/gider bileşimini anlamak | Bar/waterfall ve uzlaşan toplamlar + açıklamalı tablo | Bileşen listesi, toplam/fark; gerekirse küçük yatay barlar | Farklı dönemleri toplamak; 3B grafik; oranı belirsiz pasta |
| C18 | Nakit riskini görmek | Dönem sonu bakiye çizgisi + ilk açık işareti + aylık mutabakat | Seçili ayın açılış/giriş/çıkış/kapanışı; komşu ay karşılaştırması | Nakit bakiyesini kâr adıyla göstermek |
| C19 | Çok satırlı veriyi incelemek | `DataTable` filtre/sıra/görünür alanlar | `KayitListesi`: kimlik + ana değer kapalıyken görünür | Her kaydı açmadan hangi kaydın önemli olduğunun anlaşılmaması |
| C20 | Senaryoları kıyaslamak | Aynı kapsamlı senaryolarda ortak baz + fark tablosu + çizgi | Önce iki senaryo seçimi, ölçüt bazlı farklar | Birbirinden farklı iş modellerine tek ortak sonuç etiketi |
| C21 | İki değişkenin etkisini görmek | Hassasiyet ısı haritası; seçili hücre açıklaması ve eksen birimleri | İki sayı input'u + seçili sonuç; komşu senaryolar listesi | Metinsiz renk ölçeği; tabloyu küçültüp okunamaz yapmak |
| C22 | Fiyat veya oran değiştirmek | Mantine tabanlı `NumberInput` / mevcut `Sayi`, birim ve hata | Tek sütun, büyük hedef, açıklama ayrı satırda | Hesap sonucu ve input'un aynı görünmesi; boş alanı sessizce 0 saymak |
| C23 | Tek seçenek belirlemek | Mevcut `Choice` veya uygun radio grubu; paralel değer etiketleri | Kısa seçenek grubu; sığmıyorsa markalı erişilebilir seçici | Değer seçimini sayfa sekmesi semantiğiyle sunmak |
| C24 | Aynı düzeyde içerik değiştirmek | Mantine Tabs / mevcut bölüm sekmeleri, yalnız ilgili panel | Seçili bölüm açık; tümüne erişilen gruplu navigasyon | Sekmeyle sayfanın kilometre aşağısına atlamak |
| C25 | Ayrıntıyı açmak | Accordion / açıklama paneli; başlıkta yeterli özet | Aynı davranış; işlem bağlantısı başlık düğmesinin içinde olmaz | Ana şartı, hata durumunu veya toplamı gizlemek |
| C26 | Kaynağı incelemek | Kaynak/kanıt paneli + etkilenen içerik bağlantıları | Bölüm içinde açılan detay; gerektiğinde tam ekran inceleme | Kaynağı yalnız hover tooltip'e koymak |
| C27 | Varsayım etkisini anlamak | Varsayılan → özel değer farkı + etkilenen sonuçlar | Alan grubu ve değişiklik listesi | “Kaydedildi” deyip yerel kapsamı saklamak |
| C28 | Risk değerlendirmek | Risk kaydı: olay/tetikleyici/etki/önlem/owner | Öncelikli risk listesi ve karar bağlantısı | Gerekçesiz kırmızı-sarı-yeşil matris |
| C29 | Eski-yeni politikayı anlamak | Sürüm farkı, yürürlük aralığı, gerekçe, karar bağlantısı | Değişen koşullar listesi | Eski metni güncel gibi bırakan arşiv |
| C30 | Verisi olmayan sonucu anlamak | Amaca özel boş/hata durumu + gereken veri + yapılacak iş | Metin ve tek anlamlı devam bağlantısı | Sahte grafik, sonsuz skeleton veya 0 toplam |

Tabs bir görünüm kümesinde panel değiştirir; Accordion ayrıntıyı açıp kapatır. İkisi aynı problem için gelişigüzel değiştirilemez. Semantik ve klavye sözleşmesi için [WAI-ARIA APG desenleri](https://www.w3.org/WAI/ARIA/apg/patterns/), bileşen davranışı için [Mantine Tabs](https://mantine.dev/core/tabs/) ve [Mantine Accordion](https://mantine.dev/core/accordion/) temel alınır. Projenin görünür odak, radius ve hareket kararları kütüphane demosuyla değiştirilmez.

### 10.3 Applet'lerin her biri için içerik ve gösterim kararı

| Model ID | Açılışta yanıtlanacak soru | Esas bileşen / ayrıntı | Diğer sayfayla ilişki |
|---|---|---|---|
| `katalog` | Hangi meslek, uzmanlık ve seviye setiyle çalışıyorum? | Düzenlenebilir katalog + bağlantılı seviye listesi | Gerçek organizasyon şeması değildir |
| `rutbe-matrisi` | Meslek × seviye hangi oranı verir? | Düzenlenebilir matris; telefonda iki profil karşılaştırması | Ücret politikası için örnek yapı |
| `kademe-serisi` | Artış ve bant örtüşmesi nasıl değişir? | Seri grafiği + bant çizgileri + değer listesi | Sayısal varsayım, piyasa doğruluğu iddiası yok |
| `is-degerleme` | İş kapsamı hangi dereceyi üretir? | Ağırlıklı ölçüt formu + hesap açıklaması | Kişisel performans değerlendirmesi değildir |
| `taban-ucret` | Tutar hangi çarpanlarla oluştu? | Çarpan zinciri + ara sonuçlar + toplam | Onaylı ücretle karıştırılmayacak örnek |
| `band-konumu` | Kişi örneği bantta nerede? | `BandCizgi` + compa/range açıklaması | Rol ve kişi örneği ayrı tutulur |
| `liyakat-matrisi` | Aynı performansta bant konumu sonucu nasıl değiştirir? | Isı haritası/matris + seçili hücre hesabı | Kalıcı zam politika taslağına girdi |
| `yillik-zam` | Hangi artış bileşeni toplamı oluşturdu? | Artış köprüsü + önce/sonra + bileşen listesi | Genel zam, piyasa ve terfi iki kez sayılmaz |
| `terfi-kapisi` | Hangi koşul sağlanıyor, hangisi eksik? | Koşul listesi + durum + yeni bandın önizlemesi | Otomatik gerçek kişi terfisi üretmez |
| `kademe-adimlari` | Seviye değişmeden hangi adım ne zaman gelir? | Zaman çizgisi + koşullu adımlar | Örnek kıdem kuralı; mevcut sözleşme değildir |
| `performans-karnesi` | Ağırlıklar ve eşikler sonucu nasıl etkiler? | Boyut tablosu + yatay katkı barları + kapı koşulları | Tek sayıyla gerçek çalışan yargısı kurulmaz |
| `sprint-skoru` | Kabul, teslim ve kalite skora nasıl yansır? | Girdi → kabul edilen çıktı → koşul → sonuç | Katılım/devamsızlık verisiyle eşitlenmez |
| `prim-egrisi` | Eşik/hedef/tavan arasında ödeme nasıl değişir? | Eğri + seçili skor açıklaması + sonuç | Hedef prim oranı ile ödeme çarpanı ayrı |
| `prim-havuzu` | Şirket/takım/birey ve bütçe tavanı ne yapar? | Çarpan zinciri + havuz dağılımı + uzlaşan toplam | Şirketin gerçek kârıymış gibi sunulmaz |
| `kar-paylasimi` | Havuz hangi koşulla nasıl dağılır? | Paylaştırma tablosu + kalan/bütçe kontrolü | Kâr girdisi, varsayım niteliğiyle |
| `yapi-denetimi` | Hangi yapısal koşul sağlanmıyor? | Gerekçeli bulgu listesi + etkilenen model bağlantısı | Dünya standardına uyum sertifikası gibi gösterilmez |
| `toplam-odul` | Sabit, değişken ve diğer bileşenler nasıl birleşir? | Yığılmış bar + tutar tablosu + toplam | Örnek hedef toplam; gerçekleşmiş fatura değildir |

17 modelin her biri: amaç → input → sonuç → koşul/sınır → yöntem/dayanak → ilgili modele devam yapısını taşımalıdır. Kullanıcıyı 17 panelin tamamına zorlayan eğitim turu gerekmez. Meslek seti ortaktır; model değişiminde seçili katalog ve kullanıcı girdisi korunur.

### 10.4 Mobilde içerik kaybını engelleyen sözleşme

- **Kayıt inceleme** için accordion/kayıt listesi uygundur. **Karşılaştırma** için tüm değerleri ayrı kapalı kayıtlara saklamak uygun değildir. İki kayıt seçme ve ölçüt bazında yan yana/ardışık fark görünümü sunulur.
- Özet satırda kimlik, karar için ana değer ve gerekliyse durum bulunur. Açılmadan görülemeyen toplam, tarih veya para birimi kötü özettir.
- Gerçek iki boyutlu matris için içerik önce dilimlenir: seçili dönem, seçili iki profil, seçili satır/sütun. Kaçınılmaz uzman tablosunda okunabilir sütun minimumlarıyla yalnız kapsayıcı içinde yatay kaydırma kullanılabilir; bu ana mobil yolculuğun yerine geçmez.
- Sayfa yatay taşmaz. Sözcük ortasından bölme veya 14 CSS px altına inme çözüm değildir. Ekran daralınca sütun sayısı değil kullanıcı işi yeniden düzenlenir.
- Masaüstü/mobil kabuk aynı veriyi ve durumu kullanır. Filtre, seçili dönem, açık kayıt, yazılmış girdi ve odak yeniden boyutlandırmada korunur.
- Harita, Gantt, matris ve grafik için metinsel eşdeğer aynı hesap kaynağından üretilir. Başka sonuç veren “mobil özet” oluşturulmaz.

## 11. İçerik estetiğinin altında çalışacak UX ilkeleri

Bu ilkeler slogan değildir; içerik yerleşimini belirleyen karar araçlarıdır. Her ilkeye somut ihlal ve kabul kanıtı atanır.

| İlke | Bu projedeki mekanizma | Uygulama yönergesi | Nasıl sınanır? |
|---|---|---|---|
| Bilgi kokusu / bulunabilirlik | Menü etiketi kullanıcının beklentisini kurar | Ücret koşulu Kararlar kuyruğunda saklanmaz; başlık kullanıcı sorusuyla eşleşir | Başlıkları görerek doğru ana adresi seçme görevi |
| Kullanılabilirlik ve estetik algısı | Düzenli görünüm güveni yükseltebilir; yanlış kesinliği de büyütebilir | Güçlü görsellik, veri niteliğini gizlememeli | Kullanıcı güzel görünen tahmini gerçekleşen sanıyor mu? |
| Visceral tasarım | İlk bakışta sakinlik, önem ve çalışma alanının kimliği hissedilir | Tek ana odak; kontrollü sayı hiyerarşisi; tutarlı yüzey ve boşluk | İlk bakışta amaç ve ana sonuç doğru tarif ediliyor mu? |
| Davranışsal tasarım | Kullanıcı işi yaparken sebep-sonuç ve kontrol hissi ister | Input değişince hangi sonuçların değiştiği izlenir; kapsam kaybolmaz | Girdi→sonuç ve geri alma görevi |
| Yansıtıcı tasarım | Kararın neden alındığını sonradan anlayabilmek gerekir | Karar gerekçesi, sürüm ve kanıt izi saklanır | Bir ay önceki kararı yeni biri açıklayabiliyor mu? |
| White space / negative space | Yakınlık ve okuma ritmini düzenler | Bölümler arasında belirgin, ilişki içinde daha küçük boşluk; iç içe kart padding'i biriktirme | İlişkili input ve açıklama ayrışıyor mu, ilgisiz bloklar birleşiyor mu? |
| Görsel hiyerarşi | Önce karar bilgisi, sonra yöntem okunur | Başlık → bağlam → sonuç → dayanak sırası; her sayı dev başlık olmaz | Kullanıcı ilk gördüğü üç öğeyle doğru durumu anlayabiliyor mu? |
| Tutarlılık ve standardizasyon | Aynı nesneyi yeniden öğrenme yükünü azaltır | “Aktif satıcı” ve “ödeyen satıcı” tanımları ID ile bağlı; aynı para biçimi | Aynı nesne farklı sayfada farklı anlam taşıyor mu? |
| Yakınlık yasası | Fiziksel yakınlık anlam ilişkisi varsaydırır | Birim ve dönem sonucun yanında; kaynak uzak footer'a bırakılmaz | Değere bakarken kapsamı yanlış eşleştirme oluyor mu? |
| Benzerlik yasası | Aynı görünüm aynı işlev beklentisi yaratır | Input, sonuç, gezinme sekmesi ve durum rozeti ayrışır | Okunur sonucu kullanıcı düzenleyici sanıyor mu? |
| Süreklilik | Akışın yönü ve sırası zihinsel modeli destekler | Müşteri aşaması ve para akışı anlamlı sırada; mobilde sıra korunur | Başlangıçtan sonuca yolculuk anlatılabiliyor mu? |
| Ortak bölge | Bir yüzey içindekiler aynı kapsama ait sanılır | Marka, senaryo ve dönem sınırı ortak yüzeyle açık; ilgisiz politikalar aynı kutuda değil | Segika koşulu iStoc'a ait sanılıyor mu? |
| Fitts yasası | Sık eylemin hedefi ve mesafesi erişimi etkiler | Ana seçim/karşılaştırma erişilebilir hedef; yalnız küçük ikon kullanılmaz | Dokunma ve klavye ile asıl iş tamamlanıyor mu? |
| Hick–Hyman yaklaşımı | Belirsiz/eşdeğer seçenekler seçim yükünü artırır | Seçenekleri iş amacına göre grupla; gerekli seçeneği sırf sayı azaltmak için gizleme | Kullanıcı yanlış grup seçiyor veya sürekli geri dönüyor mu? |
| Çalışma belleği / Miller bağlamı | Çok farklı kavramın aynı anda tutulması zordur | İlişkili bilgiyi parçala; karşılaştırılan değerleri birlikte göster | İki poliçe koşulunu hatırlayarak mı, görerek mi kıyaslıyor? |
| Tanıma, hatırlamadan kolaydır | Kullanıcı önceki sayfanın girdi setini ezberlemek zorunda kalmamalı | Etkin bağlam ve değişiklik özeti; kaynak bağlantısında bağlam korunur | Gelirden nakde geçince fiyat/dönem yeniden tahmin ediliyor mu? |
| Aşamalı açıklama | İhtiyaç duyulmayan ayrıntı ana okumayı boğar | Formül ve yöntem açılabilir; kritik şart ve belirsizlik açıkta | Kullanıcı şartı görmeden yanlış karara varıyor mu? |
| Dışsal biliş / karşılaştırma maliyeti | Yan yana görülen fark, bellekte tutulan farktan güvenilirdir | Karşılaştırma modunda aynı alanları hizala | İki ortak/model arasındaki fark doğru söyleniyor mu? |
| Peak–End yaklaşımı | En zor an ve kapanış deneyimi hatırlamayı etkileyebilir | Çelişki/eksik veri anında yol göster; sonunda sonuç, kapsam ve devam açık | Görev sonunda kullanıcı ne öğrendiğini ve sıradaki işi biliyor mu? |
| Hata önleme ve geri dönüş | Yanlış kapsamda değişiklik sessizce yayılmamalı | Yerel değişiklik, reset kapsamı, öncesi/sonrası ve geri alma | Model denemesi gerçek politika sanılıyor mu? |

“En fazla yedi öğe”, “üç tıklama” veya bütün gruplara aynı sabit kart sayısı bu ilkelerin zorunlu sonucu değildir. Test, somut kullanıcı işinin anlaşılmasına ve tamamlanmasına bakar.

### 11.1 Görsel ve erişilebilir sunumun değişmez sınırları

- Mevcut markadan türetilen semantik renk, tipografi, boşluk, kenarlık ve durum tokenları kullanılır. Her içerik türüne yeni renk icat edilmez.
- Outfit varsayılandır. OPEX için kaynakta kayıtlı Roboto ve 15 px özel kararı bu içerik çalışmasıyla değiştirilmez. Diğer bütün okunabilir metinler en az 14 CSS px; kullanıcı kök boyutu korunur.
- Pill/switch ve açıkça kabul edilmiş istisnalar dışında radius yoktur. Kütüphane varsayılanı istisna sayılmaz. Kart/çerçeve yerine önce boşluk, hizalama ve yüzey hiyerarşisi kullanılır.
- Normal temalarda çevreleyen odak halkası yoktur. Tab/Shift+Tab ile açılan merkezi mod, `:focus-visible` ve çevrelemeyen görünür gösterge korunur. Forced-colors istisnası ortak kullanıcı politikasına göre uygulanır. Odağı görünmez yapmak çözüm değildir.
- Dropdown hem kapalı kontrolü hem paneliyle markalı ve erişilebilir olur; native menü görünümüne bırakılmaz. Gerçek radio/tabs/switch/link semantiği işlevle eşleşir.
- 320 → 360 → 375 → 390 → yatay telefon → tablet → masaüstü sırası; büyütülmüş metin ve zoom, klavye/dokunma, kısa yükseklik ve reduced motion kabul kapsamındadır.
- Hareket merkezi pozitif sürelerle iki yönlü simetrik `cubic-bezier(.65, 0, .35, 1)`; yalnız belgeli profilde Quart. Semantik durum anında güncellenir; reduced-motion istisnası korunur. Hareket yanlış bilgi sırasını telafi etmez.
- WCAG 2.2 AA hedefi: başlık ve ilişkiler, anlamlı sıra, renk dışı anlam, kontrast, reflow, metin aralığı, klavye, odak sırası/görünürlüğü/örtülmemesi, tutarlı gezinme, hedef boyutu, etiket/hata, ad-rol-değer ve durum mesajları test edilir. Projedeki 44 px dokunma hedefi korunur; bu değeri WCAG AA'nın bütün kontroller için birebir metni diye sunma.
- Canlı sonuç değişimlerinde her tuş vuruşuyla uzun sayı listesi okutulmaz; uygun zamanda kısa durum duyurulur. Açılır ayrıntı, seçili panel ve hata semantik olarak ilişkilendirilir.
- Mantine kullanılması veya otomatik tarama geçmesi tam erişilebilirlik kanıtı değildir. Gerçek klavye, ekran okuyucu ve hedef cihaz katmanı ayrıca raporlanır.

## 12. Sayısal içerikte anlam bütünlüğü

### 12.1 Bir sonuç başka sayfaya taşınmadan önce

Bir sayı şu kimliklerle birlikte taşınır: **marka/program + metrik + iş modeli + dönem + birim + varsayım sürümü + kaynak kapsamı + kanıt niteliği**. Bunlardan biri farklıysa “aynı sonuç” denmez. Kullanıcıya fark açıklanır; uygun dönüşüm yoksa karşılaştırma yapılamaz.

| İlişki | Gereken sözleşme | Yanlış kısa yol |
|---|---|---|
| 90 gün hedefi ↔ 24 ay gelir tahmini | Aynı olay tanımı ve ortak tarih aralığı; farklı plan varsayımı görünür | Farklı dönem toplamlarını yan yana koyup başarı oranı hesaplamak |
| Gelir ↔ 15 aylık OPEX/nakit dönemi | Ortak aylar, para birimi, kur ve tahsilat zamanlaması | 24 ay geliri 15 ay giderle karşılaştırmak |
| Kadro katkısı ↔ toplam şirket sonucu | Personel gideri ile ofis/teknoloji/diğer gider kapsamı ayrılır | Personel sonrası farkı şirket net kârı saymak |
| iStoc gelir ↔ OPEX kaynağı | Kaynak kurum ve markaya/programa dağıtım kapsamı | “Dosya bağlı” diye bütün gideri tek markaya mal etmek |
| Yıllık fatura ↔ aylık gelir/hakediş | Hizmet dönemi, tahsilat, kazanma ve ödeme ayrı olaylar | Yıllık komisyon toplamını her ay yeniden kazanmak |
| Ortaklık politikası ↔ Affilate | Aynı politika sürümü veya görünür özel değişiklik | Örnekteki input değerini yürürlükteki sözleşme sanmak |
| Applet ↔ rol ücreti ↔ OPEX | Örnek modelden politika önerisi, karar ve yürürlük aşaması | Laboratuvarda yapılan değişikliği gerçek maliyete otomatik yazmak |
| Kaynak toplam ↔ filtrelenmiş tablo | Kapsam ve sayım aynı; genel toplam ayrıca etiketli | Filtre sonrası toplamı şirketin bütün gideri saymak |

Para anlatımında “ciro”, “gelir”, “tahsilat”, “hakediş”, “ödenecek”, “ödenmiş” ve “nakit” için alan bazında tek tanım gerekir. Hangi hesap tanımının kullanıldığı sayfada görülebilir olmalıdır; bu belge muhasebe yöntemi seçmez. Gelecek ödeme planı gerçek banka hareketi değildir.

### 12.2 Tarih ve sürüm

“90. gün” tek başına yeterli değildir: program başlangıcına bağlı olduğu görünür olmalı. Kullanıcı başlangıç tarihini değiştirdiğinde aynı eylemin rol görünümü, genel planı ve kontrol tarihi aynı kayıt üzerinden güncellenmelidir. Sabit mali takvimle kayan program takvimi ayrılır; OPEX'in mevcut sabit plan aralığı sessizce kaydırılmaz.

İçerik sürümü ile hesap sürümü ayrı tutulur. Açıklamayı düzeltmek geçmişteki ticari politikanın oranını değiştirmek anlamına gelmez. Kaynak yenilendiğinde hesap snapshot'ı eski kaldıysa kullanıcının karşılaştırdığı durum açıklanır.

### 12.3 Örnek: tek görev, beş sayfa, tek anlam zinciri

“İkinci saha kişisini daha erken başlatırsak ne olur?” sorusu şu yolu izlemelidir:

1. İstihdam'da rol ihtiyacı ve başlangıç koşulu görülür.
2. Gelir planında başlangıç tarihi input olarak değiştirilir; bunun özel senaryo olduğu görünür.
3. Personel ve diğer gider kapsamı korunarak gelir ve başabaş etkisi incelenir.
4. Aynı etkin girdi seti Nakit akışına taşınır veya taşınamayan fark açıkça bildirilir.
5. Sonuç uygun görülürse Kararlar'da bir **öneri** hazırlanır; mevcut plan kendiliğinden onaylanmış olmaz.

Bu geçişlerde kullanıcı tarihi üç sayfada tekrar girmek veya hangi girdinin taşındığını tahmin etmek zorunda kalmamalıdır. Bu akış bugün bütünüyle çalışıyor iddiası değildir; hedef kabul yolculuğudur.

## 13. TDD-first içerik ve navigasyon kabul sözleşmesi

### 13.1 Test önce neyi kanıtlamalı?

Önce bir kullanıcının yapacağı işi ve yanlış anlayabileceği sonucu yaz. Sonra bunu yakalayan veri/etkileşim testini kur. Hedefli başarısızlık görülmeden davranışın düzeldiğini iddia etme. Yalnız dosyada bir başlığın bulunmasını test etmek, içeriğin doğru yerde ve doğru anlamda olduğunu kanıtlamaz.

Test katmanları:

- **İçerik/veri sözleşmesi:** kimlik, referans, kapsam, kaynak, sürüm, toplam ve aynı kayıttan türetme.
- **Etkileşim:** doğru içerik bulma, bağlam taşıma, eski link, geri/ileri, karşılaştırma ve düzenleme.
- **Algısal/erişilebilir sunum:** içerik sırası, okunabilir özet, etiket, odak, zoom ve dar görünüm.
- **Anlama:** kullanıcı sonucun anlamını kendi cümlesiyle doğru açıklayabiliyor mu? Otomatik testin yerine geçemeyeceği katman.

Aşağıdaki testler **taslaktır; bu rapor hazırlanırken çalıştırılmadı**. İlgili dönüşümün kabul kapsamına alınmalıdır; her belge değişikliğinde bütün suite'i çalıştırma talimatı değildir.

### 13.2 Test kataloğu

| Test | Senaryo / işlem | Kabul koşulu |
|---|---|---|
| IA-01 | Her mevcut normal sayfayı içerik envanteriyle eşleştir | 24 normal sayfanın amacı ve sahibi/eksik sahip durumu var; sistem 404 ayrıca |
| IA-02 | Her yayımlanacak blok için ana adresi çöz | Tek kanonik kayıt; ikincil görünümler kimlikle bağlı |
| IA-03 | Taşınan blokların önce/sonra envanterini karşılaştır | Her blok korundu, özetlendi, taşındı veya gerekçeyle emekli edildi; sessiz kayıp yok |
| IA-04 | Yeni sayfanın ana sorusunu içerikle karşılaştır | Ayrı görev, anlamlı içerik ve devam yolu mevcut; boş kabuk yok |
| IA-05 | Ücret koşulunu bulma görevi | Kullanıcı Kararlar listesini taramadan ücret politikasına ulaşır |
| IA-06 | Pazarlama planını bulma görevi | Dijital rol profilinden bağımsız kanal/içerik planına erişilir |
| IA-07 | Gelir planını bulma görevi | Finans grubu anlamlı ana adres; bağlamsal kısayol aynı sayfaya gider |
| IA-08 | Ekip lideri rolünü aç | Yedi rolün tamamına erişilir; mevcut `also` ilişkisi rolü kaybettirmez |
| IA-09 | Sunum sırası değiştir | Ana breadcrumb ve sayfa sahipliği kendiliğinden değişmez |
| IA-10 | Applet ve BCG navigasyonunu kontrol et | Applet İstihdam'da; BCG mevcut doğrudan erişim sınırında |
| IA-11 | Affilate uygulandığında menüden aç | Pazarlama → Affilate; doğru `/19ekim/affilate/` yolu |
| IA-12 | iStoc ve Segika arasında kapsam değiştir | Yalnız gerçekten desteklenen içerik/model gösterilir; etiket değiştirme ile veri kopyalama yok |
| IA-13 | Gelir modelinin iş yaklaşımını incele | Abonelik modeli açık; likidite pilotunun başka varsayımı varsa gösterilir |
| IA-14 | İki Segika ortak politikası aç | Tip/sürüm/durum ayrımı var; çelişen dönemler tek onaylı kural gibi görünmez |
| IA-15 | Affilate'de başlangıç yüzdelerini değiştir | `%0` dahil tüm oranlar input; sonuçlar yeniden türetilir |
| IA-16 | Hedefte gerçekleşen veri yok | “Ölçülmedi/bilinmiyor”; 0 ve başarı yüzdesi üretilmez |
| IA-17 | Sheets'ten gelecek ay planı yükle | Veri güncel olabilir ama “ödendi/gerçekleşti” yazılmaz |
| IA-18 | Ortaklık önerisi veya BCG örneği aç | Alt bilgi/blok durumu “kesinleşen tutar” iddiası taşımaz |
| IA-19 | Aynı hedefi rol, kontrol ve Hedefler'de göster | Metrik kimliği, birim, dönem ve değer tutarlı |
| IA-20 | Genel plan ile role/programa göre planı karşılaştır | Aynı eylem tarihi, sahibi ve durumu; kapsam dışı işler açık |
| IA-21 | Program başlangıcını değiştir | Bağlı program tarihleri tutarlı kayar; sabit OPEX aralığı bozulmaz |
| IA-22 | İstihdam takvimini incele | İlgisiz reklam/genel kontrol olayları ana işe alım görünümüne karışmaz |
| IA-23 | Gelirde özel fiyat/tarih oluştur, nakde geç | Aynı etkin girdiler veya açık kapsam farkı; yalnız aynı preset adı yeterli değil |
| IA-24 | 90 gün, 15 ay ve 24 ay sonuçlarını karşılaştır | Ortak dönem seçilir; olmayan dönem için sahte veri yok |
| IA-25 | Personel katkısı sonucunu oku | Bunun toplam şirket kârı veya gerçek çalışan performansı olmadığı anlaşılır |
| IA-26 | OPEX kaynak kapsamı belirsiz | Markaya dağıtım belirsizliği görünür; onaylanmış dağıtım uydurulmaz |
| IA-27 | Özel parametreyi değiştir, yeniden aç | Kayıt gerçekten olduysa yerel kayıt durumu doğru; yayın politikası değişmez |
| IA-28 | Applet örnek ücretini değiştir | Gerçek rol/OPEX tutarı yetkisiz veya sessiz değişmez |
| IA-29 | Notlar'da görevi tamamla | Resmi eylem/karar durumu kendiliğinden değişmez |
| IA-30 | Eski `#crm`, `#ucret`, dijital rol blok linklerini aç | Yeni içerik bulunur; anlamlı hedef ve gerekirse taşınma açıklaması |
| IA-31 | Ortaklık program/bölüm/blok hash'lerini aç | Doğru marka ve panel açılır; hedef gizli panelde kalmaz |
| IA-32 | Geri/ileri ve yenileme | Seçili panel ve gerekli bağlam kararlı; alakasız sayfa altına sıçrama yok |
| IA-33 | Kişisel e-posta ayrıştırması uygulanırsa | İçerik korunduğu yerde doğrulanır; paylaşılan build/arama onu taşımıyor; geçmiş temizlendi iddiası yok |
| IA-34 | Eski karar ve güncel politikayı incele | Geçerlilik dönemi ve yerine geçen sürüm erişilebilir |
| IA-35 | İki senaryoyu 320 px'te karşılaştır | Aynı ölçütlerin farkı görülebilir; ezber veya sürekli panel aç/kapa gerekmez |
| IA-36 | Bir gider kaydı kapalı | Kimlik ve ana tutar/dönem anlamlı; doğru kaydı seçmek için hepsini açmak gerekmez |
| IA-37 | Tablo → kayıt kabuğuna geç | Filtre, sıralama, açık kayıt, girdi ve anlam korunur; aynı toplam |
| IA-38 | Grafik yüklenmiyor veya JS gecikiyor | Temel sonuç ve anlamlı eşdeğer okunabilir; boş görsel kutu bilgi yerine geçmez |
| IA-39 | Sekme/radio/accordion'u klavyeyle kullan | Gerçek işlevin semantiği, etiketleri ve uygun klavye modeli doğru |
| IA-40 | 320 px, büyütülmüş metin ve uzun Türkçe etiket | Sayfa taşması/kırpma yok; metin ≥14 px, doğal sözcük sarımı |
| IA-41 | Input, sonuç ve durum rozetine bak | Birbirine benzeyen farklı işlevler yok; değer seçenekleri paralel |
| IA-42 | Fokus ve panel geçişi | Görünür çevrelemeyen gösterge; doğru odak sırası ve geri dönüş; seçili durumdan ayrı |
| IA-43 | Sonuç değişimi ve hata | Durum duyurusu anlamlı; hata input'la ilişkili; kritik bilgi tooltip'e hapsolmaz |
| IA-44 | Kaynak yok/eski/çelişkili | Üç durum ayrı açıklanır; yanlış kesin toplam veya yeşil başarı yok |
| IA-45 | Bağlantıyla paylaşılan özel senaryo | Paylaşılabilen kapsam doğru; alıcıda aynı girdiler yoksa “aynı senaryo” iddiası yok |
| IA-46 | Menü ve sayfa önceliğini farklı ekranlarda incele | Aynı mantıksal sıra; yalnız yerleşim uyarlanır |
| IA-47 | Bir bölümün formülünü aç/kapat | Ana sonuç ve koşul korunur; ayrıntı kapanınca kritik anlam kaybolmaz |
| IA-48 | Görev sonunda sonucu kendi cümlesiyle anlat | Kullanıcı karar/tahmin/gerçekleşen ve sonraki adımı doğru ayırır |

### 13.3 Mevcut test altyapısına yerleştirme

- İçerik referansları ve model kapsamı: mevcut `tests/data.spec.ts`; gerekirse odaklı yeni içerik-sözleşmesi testi.
- Ortaklık türü/sürüm/derin bağlantı: `tests/partnership.spec.ts`.
- Gelir–nakit bağlamı: `tests/gelir.spec.ts`, `tests/nakit.spec.ts`; örnek girdi değişikliği iki sayfada birlikte sınanır.
- Applet ayrımı ve 17 model: `tests/applet-model.spec.ts`, `tests/applet.spec.ts`.
- Kayıt görünümü/kapsam: `tests/giderler.spec.ts` ve mevcut fixture.
- Navigasyon, kelime anlamı ve görünür sunum: `tests/ui.spec.ts`, `tests/ifade.spec.ts`, `tests/gorsel-algi.spec.ts`.
- Kişisel sayfa kapsamı değişecekse mevcut `tests/email.spec.ts` davranışı inceleme paketine alınır; testi silmek içeriğin doğru ayrıştırıldığını kanıtlamaz.

Mevcut `package.json` komutları: `npm run check`, `npm run gates`, `npm run build`, `npm test`, birleşik `npm run verify`. `check` zaten UI gate betiğini çağırır; aynı değişiklik için gerekçesiz tekrar yapılmaz. Uygulama paketinin riskine uygun hedefli testlerden sonra gerekli proje kontrolleri çalıştırılır. Bu belge için uygulama suite'i çalıştırılmış sayılmaz.

### 13.4 İnsanla bulunabilirlik ve anlama testi

Önerilen araştırma: görevleri gerçekten yapan farklı okuyucu gruplarıyla küçük bir pilot; “sizce menü güzel mi?” yerine görev ver. Pilot sonuçlarını geniş kullanıcı kitlesi hakkında istatistiksel kesinlik olarak sunma.

| Görev | Yanlış anlamanın kritik işareti | Testte aranacak kanıt |
|---|---|---|
| Şirketin ne planladığını açıklama | İki marka tek ürün sanılıyor; örnek araç gerçek kayıt sanılıyor | Amaç, kapsam ve veri niteliğini kendi cümlesiyle anlatma |
| İkinci saha kişisinin bütçe etkisini inceleme | Personel katkısı net kâr sanılıyor | Doğru kapsamlı gelir/nakit sonucuna ulaşma |
| Yeni ortağın kazancını bulma | İlk fatura yüzdesi her ay tekrar kazanılıyor sanılıyor | Baz tutar, dönem, kazanma ve ödeme ayrımını doğru anlatma |
| Yeni çalışanın görevini öğrenme | Çıktı yerine yalnız saat/adet ezberleniyor | Teslim, sorumlu devir ve kabul koşulunu bulma |
| Bir rakamın kaynağını bulma | Arama bağlantısı doğrulanmış kanıt sanılıyor | Kaynak türü/tarihi ve sınırını söyleme |
| Bekleyen kararı sonuçlandırmaya hazırlama | Politika metniyle karar sorusu karıştırılıyor | Seçenek, etki ve karar sahibini bulma |

Ölç: ilk seçim, doğru hedefe ulaşma, geri dönüş sayısı, yardım ihtiyacı, yanlış anlamanın türü ve açıklama doğruluğu. Süreyi görevin zorluğuyla birlikte yorumla. Başarı eşiği pilotta baz ölçüm alındıktan sonra belirlenir; burada uydurma “%95 kullanılabilir” puanı verilmez. Yanlış para/komisyon/kapsam yorumu, ortalama hız iyi olsa da ayrı kritik hata olarak tutulur.

## 14. Uygulama ve içerik göçü yönergeleri

### 14.1 Aşama A — Anlam ve kapsamı sabitle

1. Güncel repo ve doğrudan kullanıcı kararlarını tekrar karşılaştır. Bu belge `61fd2ff` anının denetimidir.
2. F02/F03/F04/F16 için çelişki kaydı aç: ne farklı, hangi kaynaktan geliyor, hangi hesapları etkiliyor, kim karara bağlayacak? Model veya ticari politika seçimini metin düzenlemesi içinde gizleme.
3. Metrik sözlüğünü ve kapsam kimliklerini tanımla. Eksik sahibi “belirlenmedi” bırak; gerçek onay veya gerçekleşen veri üretme.
4. Sayfa/blok envanterini makineyle okunabilir bir manifestte tutmayı değerlendir. Uygulamaya girecek ilk taşımadan önce eski→yeni eşlemesi ve testleri hazır olsun.

### 14.2 Aşama B — Ana içerik adreslerini kur

İlk paket: Kararlar'dan ücret/CRM/mesaiyi, dijital rol ve Gelir planından operasyon planını ayır. Yeni hedefleri içerikleriyle tamamla; sonra kaynakta özet ve bağlantı bırak. Ortaklık içindeki marka stratejisini ikinci paket olarak ana Strateji kaydına bağla. Bu sırada görsel master parçalar yeniden kullanılmalı; gereksiz yeni framework/component paketi kurulmaz.

Bir taşınan blok için teslim kaydı:

```text
Eski sayfa + eski hash
İçerik kimliği + türü + mevcut kaynak dosyası
Yeni ana sayfa + hedef bölüm
Kaynak sayfada kalacak özet ve bağlantı
Taşınan / yeniden yazılan / emekli edilen parçalar ve gerekçe
Örnek/varsayım/karar durumu ve yeni durumla farkı
Etki: hesap, arama, menü, sunum, yerel kayıt, test
Kanıt: içerik kaybı kontrolü + hedefli davranış testi
```

### 14.3 Aşama C — Bağlantıları ve ortak görünümü tamamla

- Eski URL'leri mümkün olduğunca koru. Menü taşıması URL değişikliği gerektirmez.
- Hash sunucuya gönderilmez. Eski bölüm adresleri için istemcide eski hash → yeni sayfa/panel eşlemesi veya eski yerde kısa yönlendirme köprüsü gerekir; yalnız sunucu redirect'i bütün eski bölüm linklerini çözmez.
- `/19ekim` tabanı, query, hash, geri/ileri ve seçili program birlikte sınanır. Bütün eski adresleri ana sayfaya yönlendirme.
- Yeni breadcrumb ana içerik ebeveynini; sunum akışı sunum sırasını; organizasyon şeması rol ilişkisini gösterir. Üçünü ayrı tut.
- Arama indeksi kanonik kayıttan üretilir. Tek metnin beş kopyası beş bağımsız sonuç olarak üst sıraları doldurmaz.
- Ortak içerik referansları güncellendiğinde rol ve program görünümleri aynı değişikliği alır. Başka ekip/ajanın eşzamanlı çalışmasına ait kaynaklar körlemesine üzerine yazılmaz.
- Yerel parametre, not ve Applet depoları farklı amaçlara aittir. İsimleri taşımak veya bütününü sıfırlamak içerik göçünün otomatik sonucu değildir; gerekiyorsa ayrı geçiş planı ve geri dönüş hazırlanır.

### 14.4 Aşama D — Genel bakış, ölçüm ve kanıt

Genel bakış gerçek kanonik içerikten türetilir; ikinci bir bağımsız hedef/karar listesi olmaz. Ölçüm verisi yoksa öncelik veri toplama tanımıdır. Kaynaklar dizini referansları toplar; genel bir dosya mezarlığına dönüşmez. Affilate kendi görevindeki saf hesap ve input kabul ölçütleriyle ayrı teslim edilir.

### 14.5 Sorumluluk ve içerik bakımı

| Alan | Önerilen görev sahibi türü | Güncelleme tetikleyicisi | Kabul eden rol |
|---|---|---|---|
| Strateji / teklif | Program veya ürün sorumlusu | Yeni kanıt, segment/iş modeli kararı | İlgili karar yetkilisi |
| Rol / istihdam | Operasyon ve işe alım sorumlusu | Kadro/görev/başlangıç koşulu değişikliği | Rolün bağlı olduğu yönetici |
| Kanal / müşteri akışı | Pazarlama-satış operasyon sorumlusu | Kanal deneyi, devir veya müşteri olayı değişikliği | Program sorumlusu |
| Ortak politika | Ortaklık programı sorumlusu | Oran, süre, destek veya uygunluk değişikliği | Ticari karar yetkilisi |
| Finans / senaryo | Finansal model sorumlusu | Fiyat, maliyet, kur, tahsilat veya dönem değişikliği | Finans/iş kararı yetkilisi |
| Metrik / kanıt | Veriyi üreten süreç sahibi | Kaynak tanımı, yöntem veya veri güncelliği değişikliği | Metrik sahibi |
| Yayın ve tutarlılık | İçerik sorumlusu | Kanonik kayıt taşınması veya sürüm değişikliği | İlgili içerik sahibi |

Bu tablo gerçek kişilere yapılmış atama değildir; isimler mevcut yetki modelinden doğrulanarak bağlanır. Planlama belgesi otomatik mesaj, hesap değişikliği veya deploy yetkisi vermez.

## 15. Teslim kapısı: mimari ne zaman yeterli sayılır?

Üç ayrı inceleme birlikte yapılmalıdır:

1. **Anlam denetimi:** proje kimliği, müşteri/ortak/çalışan ayrımı, hedef–tahmin–gerçekleşen ve politika sürümleri tutarlı mı? Finans ve ticari koşuldaki P0 çelişkiler çözülmüş veya açık alternatif olarak mı tutulmuş?
2. **Yerleşim denetimi:** bütün mevcut sayfa ve bloklar kapsandı mı; taşınan her içeriğin ana adresi var mı; hiçbir kullanıcı işi açıklamasız kayboldu mu? Yeni sayfa gereksiz parçalanma yaratıyor mu?
3. **Gösterim ve yolculuk denetimi:** içerik türüne uygun bileşen seçildi mi; 320'de anlam ve karşılaştırma korunuyor mu; kullanıcı sonucu ve sonraki adımı doğru anlatabiliyor mu?

Uygulama tesliminde zorunlu kanıt paketi:

- Önce/sonra sayfa ve blok eşlemesi; çözülen veya açık bırakılan anlam çelişkileri.
- Korunan kullanıcı kararları ve öneriden uygulama kararına geçen değişiklikler.
- TDD testinde hedeflenen başarısızlık, düzeltme ve son sonuç; çalıştırılan gerçek komut/ortam.
- İlgili tarayıcı/viewport/giriş koşulları; otomasyon, gerçek cihaz ve insan anlama testi ayrı durumlarda.
- `pass / fail / not_run / not_applicable`; planlanan kontrol geçirilmiş sayılmaz.
- Anlamlı UI tesliminde bağımsız QA; önemli ortak model/sözleşme dönüşümünde bağımsız standart incelemesi. Bu yalnız dokümantasyon teslimi böyle bir uygulama incelemesi yapıldı iddiası taşımaz.
- Gerçek kullanıcı verisi, kişisel görüşme ayrıntıları veya erişim bilgileri kanıt paketine kopyalanmaz.

## 16. Kaynak haritası ve bu belgenin doğrulanma durumu

### 16.1 Yerel inceleme kaynakları

| Konu | İncelenen kaynak |
|---|---|
| Sayfa yolları, rol üretimi | `src/pages/*.astro`, `src/pages/roller/[slug].astro`, `src/data/roles.ts` |
| Navigasyon, sunum sırası, organizasyon | `src/data/tree.ts`, `src/views/HomePage.tsx` |
| Ortak kabuk, alt bilgi, içerik durumu | `src/components/AppFrame.tsx` |
| İstihdam, hedefler, kararlar, ağ, arşiv | `src/views/OtherPages.tsx`, `src/data/program.ts`, `src/data/growth.ts` |
| Rol ve dijital operasyon | `src/views/RolePage.tsx`, `src/data/roles.ts`, `src/data/digital.ts` |
| Gelir, kadro ve dijital ekonomi | `src/views/RevenuePage.tsx`, `src/data/revenue.ts`, `src/data/staffing.ts`, `src/data/digitalStrategy.ts` |
| Nakit ve senaryo ilişkisi | `src/views/CashflowPage.tsx`, `src/data/cashflow.ts`, `src/data/model.ts`, `src/lib/scenario.ts` |
| Gider planı ve kaynak kapsamı | `src/views/OpexPage.tsx`, `src/data/opex.ts`, `apps-script/src/Sheets.js`, `AGENTS.md` |
| Ortaklık | `src/views/PartnershipPage.tsx`, `src/data/partnership.ts` |
| Varsayım düzenleme | `src/views/ParamsPage.tsx`, `src/data/params.ts` |
| Applet modelleri | `src/views/AppletPage.tsx`, `src/data/applet.ts`, `src/components/appletKit.tsx`, `src/lib/appletStore.ts` |
| Eğitim, kişisel taslak ve notlar | `src/views/BcgPage.tsx`, `src/views/EmailPage.tsx`, `src/views/NotesPage.tsx`; kişisel ayrıntılar rapora alınmadı |
| Ortak gösterim ve regresyon kapsamı | `src/components/ui.tsx`, `tests/`, `package.json`, `docs/gorsel_algi.md` |
| Önceki içerik/UX kararları | `ux.md`, `ux_v2.md`, `ifade.md`, `affilate.md`; güncel kullanıcı talimatlarıyla birlikte |

### 16.2 Bu teslimin durumu

| Katman | Durum |
|---|---|
| Güncel kaynak öncesi pull | Tamamlandı; `61fd2ff` |
| Sayfa, blok, model ve bileşen envanteri | Kaynak üzerinden değerlendirildi |
| İçerik mimarisi ve taşıma yönergeleri | Bu belgede önerildi |
| Yeni uygulama sayfaları / kod değişikliği | Yapılmadı |
| Tarayıcı, ekran okuyucu, gerçek cihaz testi | `not_run` — bu dokümantasyon tesliminin dışında |
| Gerçek kullanıcı kart gruplama / ağaç testi | `not_run` — uygulanacak araştırma olarak tanımlandı |
| Canlı finans verisi / dış ticari iddia doğrulama | `not_run` |
| Uygulama test suite'i / CI / deploy | `not_run` — belge üretimi bunların kanıtı değildir |
| Bağımsız inceleme | Yapılmadı; bu belge öz incelemeyle kontrol edildi |

### 16.3 Belge üzerinde yapılan son kontroller

- **Anlam turu:** iStoc para kazanma alternatifleri, Segika politika süreleri, senaryo aktarımı ve gider kapsamı ayrı sorunlar olarak kontrol edildi. OPEX kaynağındaki kurum adı nedeniyle kapsam/dağıtım belirsizliği F16 olarak eklendi; isim farkı tek başına yanlış hesap kanıtı sayılmadı.
- **Envanter turu:** kaynak yollarıyla karşılaştırmada 25/25 sayfa, Applet kataloğuyla karşılaştırmada 17/17 model ve `PartnershipPage` bölüm tanımlarıyla karşılaştırmada 30/30 blok ailesi belgede bulundu. Kaynak dosyası referanslarında bulunamayan dosya çıkmadı. Bu kontrol, içeriğin tamamının kullanıcı tarafından anlaşılacağına kanıt değildir.
- **Yolculuk ve sınır turu:** ana sayfa, Applet, Affilate, BCG ve OPEX'e ilişkin mevcut özel kararlar korunarak öneriler gözden geçirildi. Mobil karşılaştırma ile kayıt açma ayrıldı; yeni sayfaların boş kabuk olarak topluca açılması engellendi; eski hash'lerin korunması ve yerel senaryo kapsamı kabul testlerine bağlandı.
- **Yapısal kontrol:** 25 sayfa, 16 bulgu, 30 sunum deseni ve 48 test kimliği tekil; Markdown kod blokları dengeli; satır sonu boşluk kontrolü temiz. Bunlar belge kontrolleridir, uygulama test sonucu değildir.

**Uygulayıcıya son yönerge:** Önce içeriğin anlamını ve ana adresini düzelt. Ardından doğru karşılaştırma, akış, matris ve açıklama bileşimini seç. Çözümlenmemiş ticari çelişkiyi güzel bir grafiğin arkasına saklama; veri olmayan yere sahte sonuç koyma; mevcut kullanıcı kararını yeniden tasarım gerekçesiyle sessizce değiştirme.
