# Eksikler ve doğruluk denetimi — iStoc / Segika planlama alanı

28 Ekim 2026 · Ana inceleme: `5b3453eb021cef90a7f2aba971f362d4f7c7ceeb` · Son değişiklik denetimi ve tekrar hesap: **`fa58509ddeee602e0ecdf7011ade0b34a41cbacb`** · Çıktı: inceleme ve uygulama yönergesi.

**Hayır, istenenlerin tamamı yapılmış değil. Buna karşılık yapılan iş yalnızca görünüş düzenlemesi de değil:** ortak bileşenler, mobil veri sunumları, seçenek etiketleri, komisyon motoru, içerik envanteri ve gezinme üzerinde somut ilerleme var. Eksik kalan temel bağ, **aynı kararın metinde, hesapta, sayfalar arasında ve kaydedilmiş veride aynı anlamı koruması**. Mevcut otomatik kontroller bu bağı bütünüyle sınamıyor.

En önemli sonuçlar:

1. **İnceleme sırasında gelen B2.1 düzeltmesi işe yarıyor:** eski sürümde ölçülen **1.800.000 TL** ilave kadro gideri farkı, `fa58509` üzerinde aynı kontrollü örnekte **0 TL** oldu. Bu bulgu artık “halen eksik maliyet” diye açık tutulmuyor; gerçek Sheets kapsamı ve mükerrer maliyet kabulü ayrıca kalıyor.
2. Özel gelir seçeneklerinin aktarımı da ilerlemiş. Ancak gider kaynağı seçimi bilinçli olarak uygulanmıyor; buna rağmen bazı metinler “aynen / aynı etkin girdiler” diyor. Sürümlü, yeniden üretilebilir senaryo kaydı da henüz tamamlanmış değil.
3. Nakit modeli geçici toparlanmayı, ekrandaki ifadeye aykırı biçimde “kalıcı” toparlanma diye sunabiliyor. Karşı örnek son sürümde de başarısız.
4. Affilate kaydı bozuk veya uygulamanın tanımadığı bir sürümdeyse, sayfa açılışındaki kayıt akışı ham verinin üzerine başlangıç değerlerini yazabiliyor. Son commit bu alanı değiştirmedi. Bu kalıp başka kayıt alanlarına örnek alınmamalı.
5. İçerik mimarisinin CA-0 ve CA-1 bölümleri gerçekleşmiş; kalan içerik, karar, kaynak ve mimari sözleşmelerin tamamlanması henüz kanıtlanmış değil.
6. Yeni upstream commit’lerinde hem yazar/committer hem AI ortak yazar satırı kalıcı kullanıcı talimatıyla uyuşmuyor. Birleşik plandaki K8 bunu yeniden seçilebilir tercih yapamaz.

Bu belge Claude’un kişiliğini veya niyetini değerlendirmez. Teslim edilen davranışı, kabul kapsamını ve iddiaların kanıtını değerlendirir. Uygulama kaynakları bu denetimde değiştirilmedi.

## 1. Kanıt sınırı ve güncel durum

### 1.1 Hangi sürüm incelendi?

İlk mesajdaki Claude özeti ile sonraki ekran görüntüleri aynı anı anlatmıyor. İlk özet CA-1 öncesine ait; sonraki görüntüler CA-1’in tamamlandığını ve birleşik planın yazıldığını gösteriyor. İnceleme başlangıcında yerel repo `15011e9` idi. `git fetch origin` ve `git pull --ff-only origin main` ile önce `5b3453e`, teslim öncesi yeniden kontrolle **`fa58509`** sürümüne getirildi. Var olan yerel, izlenmeyen raporlar korundu.

**Hareketli kaynak notu:** diğer bilgisayarda çalışma sürüyor. `fa58509` bu denetim devam ederken geldi; 12 dosyalık farkı incelendi ve değişen hesap yolları yeniden çalıştırıldı. Aşağıdaki eski bulgular bu nedenle tarihçesiyle tutuluyor, güncel açıklarla karıştırılmıyor. Daha sonraki commit’ler bu raporun kapsamı değildir. Aksi belirtilmeyen satır numaraları ilk denetim tabanı `5b3453e` içindir; son sürüm değişikliği ayrıca yazılır.

| Kanıt | Bu denetimde görülen | İddianın sınırı |
|---|---|---|
| Kaynak kod ve commit geçmişi | `7101a9d` Affilate motoru; `c28b5de` arayüz/kayıt; `265f9ea` CA-0; `6e7799b` CA-1; `c0ada54` birleşik plan; `5b3453e` plan kaydı; **`fa58509` B2.1** | Bir dosyanın varlığı, kullanıcı kabulünün tamamlandığını kanıtlamaz |
| CI, `6e7799b` | [40703427316 numaralı koşu](https://github.com/karacaismail/19ekim/actions/runs/40703427316): kontrol, üretim derlemesi, tarayıcı testleri ve Pages işi başarılı | Log: **1109 passed, 22 skipped**, toplam 1131; “1131 test geçti” değil |
| CI, `5b3453e` | [40704202457 numaralı koşu](https://github.com/karacaismail/19ekim/actions/runs/40704202457): kontrol/test ve Pages işleri başarılı | `6e7799b..5b3453e` arasında yalnız AGENTS ve birleşik plan değişmiş; yeni B2.1 bu koşuya dahil değil |
| CI, `fa58509` | [40711134288 numaralı koşu](https://github.com/karacaismail/19ekim/actions/runs/40711134288): son sorguda **in_progress** | Commit yerel 1115 geçti / 22 atlandı bildiriyor; bu sayı bu tur CI logundan doğrulanmadı; son sürüm yayını henüz doğrulanmış sayılmaz |
| Tarayıcı kapsamı | CI yapılandırmasında Chromium, Firefox, WebKit; saf model testleri tek projede | Playwright WebKit, gerçek macOS/iOS Safari testi yerine geçmez |
| Paket sürümleri | Manifest ve lockfile: Astro 7.4.0, React 19.3.1, Mantine 9.7.3, ECharts 6.1.0, TypeScript 6.0.3, Playwright 1.64.1 | Bu makinedeki uygulama bağımlılıklarının tamamı çalıştırılarak doğrulanmadı |
| Yerel çalışma zamanı | Node `v24.21.0`; saf TypeScript modelleri Node ile çalıştırıldı | Diğer bilgisayarın Node’u değil. Bildirilen `24.6.0`, `>=22.22.0` koşulunu karşılar |
| Diğer bilgisayar | Kullanıcı tarafından verilen ekran görüntüleri ve durum metni | O bilgisayardaki güncel dirty dosyalar, süreçler, stash ve worktree durumları **NOT_VERIFIED** |
| Ürün ve UX kanıtı | Kaynaklar, test tanımları, CI logu ve önceki raporların kabul maddeleri | Bu turda yeni ekran taraması, gerçek kişi testi veya tam WCAG denetimi yapılmadı |

GitHub bağlayıcısının commit koşusu sorgusu PR koşularıyla sınırlı olduğundan push koşuları GitHub CLI ile bulundu; iş ve log sonuçları GitHub bağlayıcısından okundu. HTTP 200, hangi commit’in yayımlandığının tek başına kanıtı sayılmadı.

### 1.2 Kullanılan durumlar

- **Uygulandı:** kaynakta mekanizma var; belirtilen test/CI katmanı destekliyor.
- **Kısmi:** gereksinimin bir bölümü var, diğer bölümü yok veya çelişkili.
- **Eksik:** gereken davranışın incelenen kaynakta karşılığı yok.
- **Hatalı:** belirli girdide sözleşmeyle çelişen davranış kaynak veya deneyle gösterildi.
- **NOT_RUN / NOT_VERIFIED:** deney çalıştırılmadı / iddiayı doğrulayacak kanıt yok. Bunlar otomatik olarak kusur demek değildir.
- **Ertelenmiş:** açık listede sonraya bırakılmış. Ertelenen madde tamamlanmış sayılmaz; kapsamı azaltmak için kullanıcı kararı gerekir.

Öncelik: **P0**, karar veya veri doğruluğunu bozan ve ilgili tamamlanma iddiasını durduran bulgu; **P1**, önemli davranış/kabul/yönetişim açığı; **P2**, izlenebilirlik ve plan düzeltmesi. Bu sınıflandırma mevcut siteyi kapatma veya yayını geri alma talimatı değildir.

## 2. İstenenler ile teslim arasındaki fark

| Talep / belge | Doğru yapılan | Kalan fark | Hüküm |
|---|---|---|---|
| Meslekten bağımsız, koşullu ve matrisli Applet modelleri | 17 model, düzenlenebilir rol/seviye/katsayı yapıları; ayrı applet paneli ve kalıcı hash; İstihdam menüsünde erişim | Örnek şirket uyarlaması ile doğrulanmış global uygulama kanıtı yeterince ayrışmıyor; kaynak tarihi/sürümü yapılandırılmamış | Uygulandı + içerik kanıtı kısmi |
| Bir öğeye basınca aşağı kaymak yerine tek panel | Applet ve Affilate bölüm seçimi; aktif panel, hash ve geri/ileri davranış testleri | Tüm alternatif giriş/uzun içerik/yardımcı teknoloji katmanı bu turda yeniden sınanmadı | Uygulandı; tam erişilebilirlik ayrı |
| `ux.md`: Mantine, 320 önce, 14 px, sınırlı radius | Ortak tokenlar, radius kapısı, mobil çekmece, tablo→kayıt, grafik eşdeğerleri, sonuç özeti, parametre grupları | Kullanıcı görevi başarısı ve tam WCAG kabulü tamamlanmış değil | Teknik temel güçlü, kabul kısmi |
| `ux_v2.md`: bilgi ilişkilerinin korunması | Özet/editör ayrımı, matris sunumu, süresiz onay ve bazı kıyas davranışları | V2-E nakit ay gezgini; V2-G canlı kaynak geçişleri; V2-F durum kaydı çelişkisi; insan kanıtı | Kısmi |
| `ifade.md`: 40 persona, yüzlerce kriter, anlama | Belgenin 40 persona ve 240 kriter yapısı mevcut; C01–C32 metin düzeltmeleri ve 12 otomatik senaryo var | Yeni içerik için güncel uzman vektörleri ve persona-görev anlama kanıtı yok; yeni metinler örneklemin dışında kalıyor | Metin paketi uygulanmış, değerlendirme döngüsü kapanmamış |
| Değer seçeneğinde yalnız `%100`, `399 €`, tarih | GA-1’de kaynak bilgisi seçenekten ayrılmış; sığmayan kontrol başka sunuma geçiyor; seçili ağırlık geometriyi değiştirmiyor | Tüm ürünün görsel algı borcu bununla bitmiyor | İlgili somut istek karşılanmış |
| `gorsel_algi.md` | GA-0…GA-6 kapsamında kontrol ritmi, araç çubuğu, eksik/sıfır ayrımı, mobil özet ve durum iyileştirmeleri | F03/F06/F11/F18/F21/F22/F24’ün ertelenen parçaları; gerçek cihaz, zoom ve yardımcı teknoloji kabulü | Paket kapanışı var, tüm bulgular kapanmış değil |
| `affilate.md`: bütün oranlar input | Üç ortak tipi; değiştirilebilir oran/dönem/süre; fiyat, hizmet süresi ve ödeme taksitinin ayrımı; dokuz hazır senaryo; para motoru | Kayıt dayanıklılığı; politika sürümü bağı; U20 ve persona anlama kabulü | İşlevsel teslim önemli ölçüde var, tamamen bitmiş değil |
| `contents.md` | İçerik envanteri, beş menü grubu, breadcrumb’ın sunum sırasından ayrılması; CA-0/CA-1; B2.1’de finans aktarımına ek ilerleme | CA-2…CA-8’in hedefleri, blok taşıma, karar kayıtları, kaynak/ölçüt yaşam döngüsü | Eski sayaç **2/9**; birleşik planda B2 aktif, bütünü tamamlanmış değil |
| `archetype.md` | Saf hesap çekirdeğine uygun mevcut modüller; Affilate motorunda iyi bir örnek | AR-01…AR-42’nin sistematik uygulanması, kayıt migration’ı, sınır kapıları, senaryo anlık görüntüsü ve görsel regresyon | Program uygulanmış değil; bazı mevcut davranışlar gereksinimlerle örtüşüyor |
| TDD-first | Anlamlı model, etkileşim ve UI sözleşme testleri; commit’lerde RED→GREEN kaydı; CI çalışıyor | Her paket için arşivlenmiş ilk başarısız test kanıtı yok; yanlış davranışı koruyan test de var | Testler gerçek; bütün sürecin test önce yapıldığı bağımsız olarak kanıtlanmış değil |

“Yedi rapor uygulandı” ile “yedi rapordaki bütün kabul koşulları sağlandı” farklı iddialardır. Mevcut kaynak ikinci iddiayı desteklemiyor.

## 3. Doğru yapılanlar korunmalı

1. **Affilate matematiği ayrı bir çekirdeğe alınmış.** `src/data/affilate.ts` React/DOM’dan bağımsız; kuruş, baz puan, bölme/yuvarlama, kısmi tahsilat, iade, destek koşulu ve dönem sınırları açık modellerle temsil ediliyor. Bu motor, katmanlı mimari için korunabilecek bir temel.
2. **“10 aylık fiyat / 12 aylık hizmet / N taksit” tek sayı olmaktan çıkarılmış.** Yıllık fatura tutarı, toplam komisyon ve aylık ödeme birbirine karıştırılmıyor. Kullanıcının bütün oranları değiştirme isteği başlangıç değerlerine indirgenmemiş.
3. **Aynı satışın üç alternatif modeli toplanmıyor.** `karsilastir()` ayrı senaryolar hesaplıyor. Kayıtlı senaryoların yan yana kıyası da var (`AffilatePage.tsx:567`, `:734`). Bu özelliğe “hiç yapılmadı” denmemeli.
4. **Mobil çözüm yalnız küçültme değil.** `DataTable` kayıt/matris sunumları; OPEX mobil kayıtları; Gantt/şema eşdeğerleri ve tam gezinme çekmecesi mevcut. Hesapla sunumun aynı anlamı taşıması yine ayrıca sınanmalı.
5. **Seçenekler temizlenmiş.** Değer, kaynak, otomatik güncelleme ve açıklama farklı alanlarda; “Senaryonun / parametre” eki kaldırılmış. Bu, benzerlik ve görsel hiyerarşi açısından gerçek bir düzeltme.
6. **Kullanıcıya geri bildirim iyileştirilmiş.** Süresiz onay, Vazgeç, bazı alanlarda Geri al, kayıt başarısızlığında hata ve sessiz sayı düzeltmesi yerine açıklama var. Bütün kayıt hata yollarının güvenli olduğu anlamına gelmiyor.
7. **İçerik için tek kayıt kurulmuş.** `icerik.ts` 26 yayımlanan rota ve 7 planlı rota tanımlıyor; menü/kırıntı bu kayda bağlanmış. Boş sayfa kabuklarının hemen yayımlanmaması doğru.
8. **Test ve yayın zinciri gerçek.** CA-1 için CI ve Pages işinin başarısı doğrulandı. Atlanan testler ayrıntılı kayıtların çoğunda açıkça belirtilmiş; her eksik için “gizlenmiş” demek haksız olur.
9. **Diğer belgelerin çelişkileri fark edilmiş.** Birleşik plan abonelik/likidite, ortaklık politikası, marka gider kapsamı ve senaryo aktarımı sorunlarını doğru gündeme getiriyor. Aşağıdaki düzeltmeler bu analizi güçlendirmek içindir.
10. **B2.1 eski sayısal eksikliği düzeltmiş.** `cashSeriesOf`, ortak `scenarioLabel`, eklenen saha gideri, ek sabit gider ve prim seçeneği bağlanmış; eski yalnız preset kontrolü genişletilmiş. Son kaynakta varsayılan ve özel örneğin gider eşitliği bu denetimde yeniden doğrulandı. B2.2’nin açık bırakılması doğru bir durum bildirimi.

## 4. Kritik bulgular: hesap, kayıt ve karar doğruluğu

### MS-01 — İlave saha gideri eksikliği · Eski P0 · B2.1 ile hedefli örnekte düzeldi

**Eski sürüm kanıtı (`5b3453e`):** `src/data/cashflow.ts:179` çıkışları Sheets kalemleri, Meta, satıcı kazanım reklamı ve satış primi olarak kuruyordu. `src/data/breakeven.ts:170` ise Sheets giderine `addedSahaCosts()` ekliyordu. `src/data/staffing.ts:237` ikinci/ek/büyüme saha personelini hesaplıyor. Nakit girişleri aynı kadronun ürettiği gelir serisini içeriyordu.

**Bu denetimdeki deney:** gerçek Sheets kullanılmadı. Sıfır tutarlı kurmaca Sheets modeli, mevcut varsayılan parametreler, medyan senaryo ve iki modelin ortak ayları kullanıldı. Başabaşın prim hariç gideri ile nakdin prim hariç gideri karşılaştırıldı:

| Dönem | Aylık fark | Ay sayısı | Toplam fark |
|---|---:|---:|---:|
| Ekim–Aralık 2026 | 0 TL | 3 | 0 TL |
| Ocak–Haziran 2027 | 100.000 TL | 6 | 600.000 TL |
| Temmuz–Aralık 2027 | 200.000 TL | 6 | 1.200.000 TL |
| Toplam | | 15 | **1.800.000 TL** |

Bu bulgu Claude’un tahminini model düzeyinde doğruluyor. **Gerçek finansman açığı tam 1,8 milyon TL artacak** sonucu çıkarılamaz: başlangıç nakdi, girişlerin zamanlaması, kaynağın hangi çalışanları içerdiği ve açığın oluştuğu ay sonucu değiştirir.

**Son sürüm sonucu (`fa58509`):** `CashSeries.sahaEk` ve “Eklenen saha personeli (plan)” çıkışı eklenmiş. Aynı deney tekrarlandı: aylık gider farklarının mutlak en büyüğü **0 TL**, eklenen saha satırı toplamı **1.800.000 TL**. Ayrıca 449 € fiyat, Aralık 2026 ikinci saha, iki ek saha, iki kat reklam, 30.000 TL ek sabit gider ve prim hariç özel örnekte de gider farkı **0 TL**. Bu nedenle önceki hata için “halen düzeltilmedi” denemez.

**Kalan kabul:** yeni kod, Sheets’te tek saha personeli olduğu varsayımını sürdürüyor. Bu sözleşme kaynakta doğrulanmalı veya mevcut kadro ile simülasyonun eklediği kadro kimlikle ayrılmalı; aynı kişi iki kere eklenmemeli. Bu, gerçek Sheets’te bugün çift sayım bulunduğu iddiası değildir.

**Kabul:** aynı girdi/sürüm/kaynak/ay için karşılaştırılabilir gider kalemleri eşit; fark varsa kaynağı ve kapsamı açıklanmış. İkinci saha yok, bir kişi, ek kişiler, büyüme kapalı/açık, farklı başlangıç ayı ve Sheets’te zaten mevcut kişi örnekleri sınanmalı. `B2` altında kapatılmalı.

### MS-02 — Senaryo aktarımı ilerledi; kaynak istisnası ve sürüm sözleşmesi açık · P1 · Kısmi

**Eski kanıt (`5b3453e`):** `scenarioOptions.ts:42` 13 seçenek taşıyordu; nakit yalnız `useScenario()` preset kimliğini okuyordu. `tests/gelir.spec.ts:113` özel URL’den nakde geçince yalnız “İyimser” seçimini doğruluyordu.

**Son değişiklik (`fa58509`):** Nakit `useScenarioOptions()` ve `inputsOf()` kullanıyor. Kapasite, yenileme, yıllık pay, fiyat, ikinci saha tarihi, ek saha, reklam çarpanı, reklam ölçeği, kur büyümesi, saha büyümesi, ek sabit gider ve prim seçeneği bağlanmış. Bunlar hesap girdileridir. On üçüncü alan **gider kaynağı**: gelirde plan/Sheets seçilebiliyor; nakit bu seçeneği izlemiyor. Sheets hazırsa temel gider kalemlerini oradan alıyor; hazır değilse bu kalemler hesaba girmiyor. Ek kadro, reklam, prim ve ek sabit gider gibi plan kalemleri ayrıca hesaplanıyor. Kaynak yokken yalnız plan kalemleri gösterildiğine dair not var; sürümlü snapshot B2.2’ye kalmış.

**Güncel sorun:** `SenaryoKurucu.tsx` yeni metni “Seçenekler Nakit akışı sayfasına da aynen uygulanır (aynı etkin girdiler)” diyor. Nakit notu gider kaynağını istisna tutarken sonunda yine “iki sayfa aynı etkin girdileri kullanır” diyor. `kaynak=plan` veya Sheets’in okunamadığı durumda gider tabanı eşit değil. Mutlak eşitlik iddiası kapsam cümlesiyle düzeltilmeli; “plan gideriyle gelir sonucu / Sheets gideriyle nakit sonucu” ayrımı ana kıyasta görünür olmalı.

**Düzeltme:** tek çözülmüş senaryo kaydı: model/politika sürümü, etkin girdiler, kaynak sürümü, kapsam ve revizyon. Nakit o kaydın desteklenen alanlarını kullanmalı. Parametre, preset, URL ve yerel değişikliğin önceliği tek yerde çözülmeli.

“N seçenek taşınmadı” mesajı geçici kapsam açıklamasıdır. Dürüstlük sağlar; **birleşik senaryo hedefinin tamamlandığı anlamına gelmez**. Model kapsamları bilinçli farklı bırakılacaksa bu ürün kararı kaydedilmeli; kapsamı farklı sonuçlar doğrudan kıyaslanmamalı.

**Kabul:** fiyat/tarih/kadro/reklam/kur/yıllık pay/ek gider/prim/kaynak dahil etkin seçenekler için sayfalar arası sözleşme; URL, yeniden açılış ve geri/ileri varyantları. B2.1’in yeni testleri ilerlemedir; kaynak=plan, kaynak yokluğu ve farklı baz/snapshot durumlarıyla tamamlanmalı. Sheets yokken eksik gider kapsamı, ana sonuçta tam maliyet/finansman hesabı gibi sunulmamalı. “Çıkışlar Sheets’ten” gibi tek kaynak anlatımı da plan kalemlerini dışarıda bıraktığı için kullanılmamalı; mevcut başlığın “Sheets + plan kalemleri” ayrımı korunmalı. `B2.2/B6`.

### MS-03 — “Kalıcı toparlanma” hesabı küresel minimumdan sonraki ilk negatif olmayan ayı buluyor · P1 · Hatalı

**Kanıt:** `cashflow.ts:206` global en düşük bakiyeden sonraki ilk `>= 0` ayını seçiyor. `CashflowPage.tsx:92` bunu “kalıcı olarak sıfırın üstüne çıkar” diye anlatıyor.

**Çalıştırılan karşı örnek:** dört ayın dönem sonu bakiyesi `[-100, 50, -30, 50]`. Fonksiyon Kasım 2026’yı döndürüyor; sonraki ay tekrar açık var. Bu ufukta kalıcı olarak negatif olmayan ilk dönem Ocak 2027.

`fa58509` üzerinde `sahaEk` serisi sıfır olan aynı sentetik örnek tekrar çalıştırıldı; hata devam ediyor. Buradaki “kalıcı”, yalnız incelenen ufkun kalanını ifade eder.

**Düzeltme:** “ilk toparlanma” ve “incelenen dönemin kalanında yeniden negatife düşmeme” iki ayrı ölçüt. Hangisi gösterilecekse hesap ve metin birlikte tanımlanmalı. “Sıfırın üstü” ile `>=0` sınırı da eşleştirilmeli. Ufuk sonrasına garanti verilmemeli.

Fonksiyon her dizide ilk toparlanmayı da seçmiyor. Koddan türetilen ikinci örnek `[-100,50,-200,50]`: ilk toparlanma Kasım, küresel minimum Aralık, fonksiyonun seçeceği ay Ocak. Bu ikinci örnek ayrıca çalıştırılmadı; kabul testine adaydır. Yalnız etiketi “ilk toparlanma” yapmak yeterli düzeltme olmaz.

**Kabul:** geçici toparlanma, daha sonra daha derin açık, tam sıfır, son ay toparlanma, hiç toparlanmama ve hiç negatif olmama. Bu bulgu birleşik planda yok; `B2` kapsamına eklenmeli.

### MS-04 — Affilate uyumsuz kaydı korumuyor · P0 · Kaynakta doğrulanan hata yolu

**Kanıt zinciri:** `affilateStore.ts:25–45` bozuk JSON veya `v !== 1` için boş sonuç döndürüyor. `:58–62` yüklemeyi tamamlandı sayıyor. `:73–85` yalnız `yuklendi` koşuluyla başlangıç kurgusunu aynı anahtara yazıyor. Kullanıcının değişiklik yapması gerekmiyor. Geçersiz kayıtlı senaryolar da filtrelenerek sonraki yazımdan düşüyor.

**Etki:** yeni sürümde oluşturulmuş kayıt eski bir uygulama sekmesinde açıldığında veya yerel JSON bozulduğunda özgün veri kaybolabilir. JSON dosyası içe aktarmadaki doğrulama bu açılış yolunu korumaz.

**Düzeltme:** `empty / valid / corrupt / unsupported-version / unavailable` durumları ayrılmalı. Yalnız geçerli yükleme veya açık kurtarma kararı sonrasında otomatik kayıt açılmalı. Ham kaynak korunmalı; kısmen okunabilen kayıtlar sessiz silinmemeli. Kurtarma, dışa aktarma ve başlangıçla devam etme birbirinden ayrılmalı.

**Kabul:** uygulamadan yeni sürüm ve bozuk JSON, hiçbir alan değiştirilmeden açılıp kapatıldığında byte düzeyinde korunur. Kurtarma seçilmedikçe üzerine yazım yok. Kısmi geçersiz kayıt, kota dolması ve yazım kesilmesi sınanır. Bu tur tarayıcı reproduksiyonu **NOT_RUN**; hata yolu kaynak üzerinden doğrulandı. `B6`, Affilate’ı da kapsamalı.

### MS-05 — Diğer kalıcı kayıt sınırları da tamamlanmamış · P1 · Kısmi

`params.ts:250` temel `typeof` kontrolü yapıyor. Bu denetimde sahte localStorage ile `subscriptionEur=-1`, `startDate='not-a-date'` yüklendi; `loadParams()` ikisini de kabul etti. Alan bileşeninin kullanıcı yazımını sınırlaması, depolama girişini doğrulamaz.

Parametreler yalnız değişen alanları saklıyor (`:266`); baz sürüm yok. Yeni varsayılan eski senaryonun saklanmamış alanını değiştirebilir. Applet `{v:1,d}` içeriyor ama uyumsuz sürümde başlangıca dönüyor; **Affilate’tan farklı olarak** üzerine yazma riski sonraki düzenlemede doğuyor. Dizi biçimini kabul etmek, içindeki kayıtları doğrulamak değildir. Notlar’ın kayıt/referans bütünlüğü de ortak kurtarma sözleşmesine dahil edilmeli.

Güncel varsayılanı takip eden **tercih kaydı** için fark saklamak bilinçli ve geçerli olabilir. Sorun bu kaydın değişmez senaryo anlık görüntüsü gibi kullanılmasıdır. `affilate.md §11` ve `archetype.md AR-15/27` eski senaryonun anlamının korunmasını ister. Tercih ve yeniden üretilebilir senaryo ayrı sözleşme taşımalı; her yerel ayarı tarihsel snapshot’a dönüştürmek zorunlu değil.

**Düzeltme/kabul:** etkilenen kayıtlarda tür ve alanın anlamına uygun doğrulama uygulanmalı. Yeniden üretilebilir senaryolarda etkin girdiler ve gerekli model/baz sürümleri korunmalı. Uyumsuz veya bozuk kayıtlar sessizce üzerine yazılmadan korunmalı; migration ve export/import kabulü ilgili kayıt sözleşmesine göre belirlenmeli. Ham veriyi korumak, bozuk verinin tamamını başarıyla dönüştürebilmek demek değildir. Eski varsayılanla kaydedilmiş senaryo ya aynı etkin girdilerle açılmalı ya da açık migration farkı göstermeli. `B6`; `ar-AR-15`, `21`, `23–27`, `41`.

### MS-06 — Sekmeler arası yansıma, çakışma çözümü değildir · P1 · Eksik

`storage` olayı diğer sekmenin kaydını yansıtıyor; güncelleme revizyonu ve çatışmayı tespit eden yazım sözleşmesi yok. Kullanıcının iki sekmedeki ayrı değişiklikleri son yazımla kaybolabilir.

**Kabul:** aynı revizyondan başlayan iki taslak farklı alanları düzenlesin. İkinci yazım ilkini sessiz ezmesin; birleşme veya çatışma kararı görünür olsun, yerel taslak korunsun. Yeni `v2` anahtarı tek başına çözüm değildir; eski açık sekmenin yazması migration testine dahil edilmeli. `B6`.

### MS-07 — State updater içinde kayıt ve geçmiş yan etkisi var · P1 · Kaynak sözleşmesi açığı

`ModelContext.tsx:45–52` updater içinde `saveParams()` ve `setSaved()` çağırıyor. `affilateStore.ts:87–94` updater içinde geçmiş ref’ini değiştiriyor. React’in updater sözleşmesi saf fonksiyon ister; geliştirme Strict Mode’u tekrar çağırarak saflığı sınayabilir. Bu, üretimde her zaman iki yazım olduğu iddiası değildir. [React useState referansı](https://react.dev/reference/react/useState#setstate).

**Düzeltme/kabul:** durum geçişi ve undo kaydı saf reducer/model geçişinde; persistence ayrı, tekrar çalıştırmaya dayanıklı akışta. Aynı geçişin tekrar değerlendirilmesi iki undo adımı veya yanlış kayıt başarısı üretmemeli. `B6`.

### MS-08 — İş modeli kararı cevapsızken varsayılanla onaylanamaz · P1 · Anlam ve karar açığı

`partnership.ts` iStoc için önce likidite ve işlem/hizmet yaklaşımı anlatıyor; `revenue.ts` abonelik üzerinden hesaplıyor. İki alternatifin varlığı tek başına hata değil; aynı onaylı plan gibi anlaşılması sorun. Birleşik plan K1, cevap gelmezse aboneliği esas kabul ediyor. **Yeni `fa58509` commit mesajı S0 ve K1–K13 varsayılanları için kullanıcı onayı alındığını bildiriyor. Bu onayın insan mesajı bu denetimde görülmedi:** onay yok diye de var diye de kesin hüküm verilmiyor; kararın tarihli kayda bağlanması gerekiyor. Kalıcı Git yasağının değiştiği, bu genel commit ifadesinden çıkarılamaz.

**Düzeltme:** önce bildirilen insan onayının tarihli kaydı ve kapsamı bağlanmalı. Doğrulanırsa karar korunmalı; doğrulanamazsa bu denetimde onay durumu NOT_VERIFIED kalmalı. Yanıtsızlık gerçekten karar gerekçesiyse, bundan strateji onayı üretilmemeli. Karar henüz verilmediyse alternatifler ve kapsamları görünür kalmalı; verilmişse seçilen model ile tarihsel alternatif ayrılmalı. Bu denetimin onay mesajına erişememesi, geçerli bir kararı yeniden açma gerekçesi değildir. `B0/B1/B5`.

### MS-09 — Ortaklık politikası ile komisyon örneği bağlanmamış · P1 · Kısmi

`partnership.ts:324`, `:361`, `:398` ilk altı ücretli ay için %15 yönlendirme politikasını anlatıyor. Affilate varsayılanı 12 ay %15, sonraki 12 ay %10; çözüm ortağı modeli de ayrı destek ve nakit komisyon koşulları içeriyor. Kullanıcı Affilate oranlarının hepsinin input olmasını açıkça istemiştir; bu varsayılanları sırf başka metne uydurmak için sabitlemek yanlış olur.

**Düzeltme:** model kimliği, politika kimliği/sürümü ve “örnek / taslak / onaylı” ayrımı. Mevcut politika yüklenebilen ayrı preset olabilir; özel değişiklik o politikanın onayını taşımaz. Aynı “çözüm ortağı” adının farklı sorumluluk ve ödeme biçimlerini gizlemesi önlenmeli; otomatik yeniden adlandırma yerine açık alt tür kullanılabilir.

**Kabul:** kullanıcı aynı satışın hangi politika sürümüyle hesaplandığını ve hangi alanı değiştirdiğini görebilir. İkinci/üçüncü yıl dahil bütün oranlar, `%0` dahil input kalır. `B1/B5`.

### MS-10 — Giderin marka kapsamı sonuç başlığından anlaşılmıyor · P1 · Kısmi

Nakit hesabı iStoc abonelik girişlerini Sheets giderlerinin tamamıyla karşılaştırıyor. Envanter alt bilgisinde Türksab ve dağıtım belirsizliği yazıyor; bu bilgi ana sonucun yorumunu değiştirdiği için yalnız sayfa sonunda kalmamalı.

**Düzeltme:** “iStoc girişleri × mevcut ortak gider planı; markaya dağıtım belirlenmedi” gibi hesap kapsamını doğru anlatan başlık/bağlam. K3’ün “Türksab toplam” etiketi, başka markaların girişleri yokken konsolide toplam izlenimi yaratır; kullanılmamalı. Dağıtım kararı yoksa oran uydurulmaz. `B1/B2/B5`.

## 5. İçerik ve UX tarafında eksik kalanlar

### MS-11 — CA-0 bazı alt bilgi cümlelerinde geleceği olmuş gibi anlatıyor · P1

`icerik.ts:364`, özel gelir değişikliklerinin hangilerinin nakde taşındığının gösterildiğini söylüyor; `5b3453e` arayüzü bunu yapmıyordu. `fa58509` değişiklik sayısını ve gider kaynağı istisnasını ekledi; bu parça ilerledi, alan bazlı etkin fark/snapshot açıklaması hâlâ sınırlı. Kararlar’a yönlendiren kapsam cümleleri, henüz bulunmayan marka/iş modeli karar kayıtlarını çağrıştırıyor. `AppFrame.tsx:406` bütün sayfalara aynı 19 Ekim/iki haftada kalibrasyon ön cümlesini ekliyor; BCG eğitimi, kişisel not ve örnek model aynı kaynak statüsünde değil.

**Kabul:** her cümle mevcut davranıştan türesin. Planlanan yetenek gelecek hedefi diye ayrı işaretlensin; bir özelliğin varlığını metin testiyle taklit etmek kabul edilmesin. `B1`.

### MS-12 — Envanterde olmak, kaynak ve yaşam döngüsünü kullanıcıya göstermek değil · P1

`icerik.ts` kaynak, tarih, kanıt, sahibi, durum ve ilişkileri tutuyor; mevcut görünür tüketim ağırlıkla menü/kırıntı/alt bilgi. Blok düzeyinde karar/tahmin/örnek ilişkisi henüz kurulmuş değil. Affilate kaydında `durum: 'yururlukte'`, `kanit: 'ornek'` ve “onaylanmış sözleşme değil” birlikte bulunuyor.

Son örnek tek başına yanlış komisyon ödenmesi kanıtı değildir. **Sayfanın yayımlanmış olması ile politikanın yürürlüğe girmesi aynı alanla anlatılmamalı.** `publicationStatus` ve `policyStatus` gibi iki farklı anlam gerekiyorsa ayrılmalı; yalnız `taslak` yazıp semantik belirsizliği taşımaya devam edilmemeli.

**Kabul:** kritik blokta kaynak, kapsam, sürüm ve durum anlaşılır; kaynakta “bilinmiyor” olan UI’de onaylı görünmez. Her bloğa büyük rozet duvarı eklemek yerine önemi kadar bağlam gösterilir. `B1/B5`.

### MS-13 — “Kararlar” gerçek karar yaşam döngüsünü taşımıyor · P1

`program.ts:491` iki açık soru tutuyor; varsayılan tarihler 26 Ekim. Mevcut yapı seçenek, sonuç, gerekçe, yürürlükteki politika ve yerine geçen karar ilişkilerini kapsamıyor. Tarihi geçen açık kararın ayrı gecikme durumu da yok.

**Kabul:** soru → seçenekler/etki → karar sahibi → son tarih → sonuç → yürürlük tarihi → ilgili politika sürümü. Plan tarihi değişirse bağlı tarihler aynı sözleşmeyle değişsin. Gerçek karar girilmediyse “verildi” üretilmesin. Statik sitede karar kaydının kaynak dosyadan yönetilmesi geçerli olabilir; çok kullanıcılı onay servisi kendiliğinden kapsam değildir. `B1`.

### MS-14 — Menü gruplanmış; içerik bloklarının ana adresi henüz taşınmamış · P1

`contents.md` yalnız beş menü istemiyordu. Dijital rol içindeki kanal/üretim planı, Kararlar içindeki ücret/CRM/mesai metinleri ve tekrar eden hedeflerin sahipliği de değişmeliydi. CA-1 bunları gerçekleştirdiğini iddia etmiyor; genel tamamlanma değerlendirmesinde yine de eksik kalıyorlar.

**Kabul:** her blok için eski kimlik, yeni ana adres, korundu/özetlendi/taşındı/gerekçeyle emekli edildi kararı. Kaynak yerde kısa özet ve bağlantı; eski hash çalışır. Ortak içerik kopyalanarak iki ayrı güncelleme alanı oluşturulmaz. `B4`; `ct-IA-03/05/06/30`.

### MS-15 — Ortak metrik sözlüğü ve gerçekleşen veri sınırı tamamlanmamış · P1

“Aktif” sözcüğü farklı akışlarda ilk ödeme, devam eden müşteri, aktif temsilci veya aktif ortak anlamına geliyor. “Gelir” bazı yerlerde tahsilat varsayımını taşıyor. C01–C32 düzeltmeleri faydalı; bütün programın metrik kimliğini birleştirmiyor.

**Kabul:** metrik kimliği, nesne, olay, birim, dönem, toplama biçimi, kaynak, model/gerçekleşen niteliği. Her “aktif” aynı tanıma zorlanmaz; farklı olaylara farklı ad verilir. Gerçekleşen veri yoksa hedef/plan üzerinden başarı oranı üretilmez. `B3`.

### MS-16 — Applet dayanakları doğrulanmış global örnek standardını bütünüyle karşılamıyor · P1

`src/data/applet.ts:41`, `:775`, `:1022` çevresinde dayanaklar metin olarak tutuluyor. Şirket adı, örnek oran, tarihsel uygulama ve bizim uyarlamamız aynı cümlede birleşebiliyor. Örneğin “benzer örnek eğri” ile gerçekten yayımlanmış şirket politikası farklı kanıt türüdür.

**Düzeltme:** model başına kaynak URL’si, kurum, tarih/sürüm, doğrulanan iddia ve şirket uyarlaması ayrı alanlar. Doğrulanamayan oran kaldırılmak zorunda değil; “şirket örneği / doğrulanmadı” diye doğru konumlandırılmalı. Tüm meslekler için evrensel ücret standardı olduğu ima edilmemeli.

**Kabul:** “Bu hücreyi neden seçtik?” sorusuna gerçek kaynak ile örnek karar ayrı yanıt verir. Bu denetim eski HR iddialarının tamamını yeniden araştırmadı; onları yanlış ilan etmiyor. `ga-F18`, `B5`.

### MS-17 — İfade düzeltmesi ile anlaşılırlık değerlendirmesi birbirine karışmış · P1

`ifade.md` 24 boyut × 10 kriter = 240 ayrı uzman puanı, 40 persona ve C01–C32 için 12 çekirdek soruluk karşılaştırma tanımlıyor. Bunlar yok değil. Eksik olan, değişen kaynak üzerinde aynı ölçütlerle **sonraki değerlendirme** ve bağımsız anlama kanıtı.

AGENTS kaydı “sonra puanı insan testi olmadan doldurulmaz” diyor. Bu gereğinden dar bir yorum: belgenin §10.4’ü, yeni metin bağlamda gerçekten incelendiyse uzman son puanını doldurmaya izin veriyor; insan testi sonucu ayrı kalıyor. Uzman puanı insan başarısı diye sunulmamalı, ama insan beklenirken uzman inceleme de atlanmamalı.

**Kabul çıktısı:** kimlik → güncel metin/bağlam → kriter vektörü → gerekçe/kanıt → ham boyut ortalaması → kapsam/U/N/A → kritik kapı → persona-görev sonucu. Affilate, CA-0 alt bilgileri ve yeni gezinme metinleri de örnekleme eklenmeli. Eski başlangıç puanları güncel site puanı sayılamaz.

40 persona 40 gerçek katılımcı zorunluluğu değildir; farklı ihtiyaç hipotezleridir. Sentetik persona yanıtı gerçek kullanıcı araştırması değildir. “Daha kısa” otomatik daha anlaşılır demek değildir. `B3/B7`.

### MS-18 — UX ekollerinin mekanik kısmı var; görev sonuçları henüz gösterilmedi · P1

Derinlik eksiği, ilke isimlerinin azlığı değil; **ilke → karar → kullanıcı görevi → yanlış sonuç → kabul kanıtı** zincirinin tamamlanmaması. Aşağıdaki tablo kalan tasarım incelemesinin kapsamıdır; yeni bir tema veya her şeyi yeniden yazma emri değildir.

| Yaklaşım | Mevcut ilerleme | Açık soru / uygulanacak kabul |
|---|---|---|
| Kullanılabilirlik–estetik etkisi | Tutarlı kontrol, token ve sonuç sunumu | Düzenli görünüm yanlış finans sonucuna gereksiz güven veriyor mu? Önce anlam ve sayı doğruluğu; sonra güven yorumu |
| Visceral / behavioral / reflective tasarım | Görsel yüzey ve davranış düzeltmeleri | İlk izlenim “güvenilir” derken kullanıcı kaynak/taslak ayrımını yapabiliyor mu; işlemin sonunda neyi değiştirdiğini anlatabiliyor mu? |
| White space / negative space | Kontrol içi ve gruplar arası ritim | 320’de ilişkili alanlar birlikte bulunuyor mu; çok sayıda iç içe boşluk ana soruyu aşağı itiyor mu? Yalnız ilk metrik görünürlüğüyle kapanmaz |
| Visual hierarchy | ResultSummary, kısa seçenekler | Kaynak hatası, eksik gider veya uyumsuz senaryo ana tutardan kopmuş mu; en baskın sayı gerçekten karar için en önemli sayı mı? |
| Consistency | Choice ve temel bileşenler | Aynı sözcük aynı olay mı; aynı görünüş aynı eylem mi? “Aynı preset adı/farklı girdiler” tutarlılık ihlalidir |
| Proximity | Alan–kontrol–bağlam–yardım sırası | Para birimi, dönem ve kaynak tutarın yakınında mı; açıklama hangi kontrole ait kolay bulunuyor mu? |
| Similarity | Değer seçeneklerinin paralelliği | Input, sonuç, seçili durum, uyarı ve klavye odağı birbirinin yerine algılanıyor mu? |
| Continuity | Araç çubuğu yerinin korunması, geri/ileri | Panel/ekran yönü/kaynak yenilemesi sırasında düzenlenen nesne ve odak korunuyor mu? |
| Common region | Görev grupları ve paneller | Ortak koşula bağlı bilgiler aynı bölgede mi; bağımsız kurallar aynı kutuda yanlış nedensellik yaratıyor mu? Her şeye kart eklemek çözüm değil |
| Fitts | Dokunma alanları ve mobil kontroller | Yanlış komşu eylem riski, sık kullanılan kontrolün erişimi ve sanal klavye altında kullanım; yalnız piksel boyutu yetmez |
| Hick | Görev grupları, aşamalı ayrıntı | Seçenek sayısını azaltırken sonucu belirleyen seçenek gizleniyor mu? “7 öğe sınırı” gibi evrensel sayı üretme |
| Miller / çalışma belleği | Matris kıyası ve tanısal özet | İki senaryonun aynı ölçütünü ezberlemeden kıyaslayabilme; bütün tabloları accordion yapmak bu görevi tek başına çözmez |
| Bilişsel yük / dağıtılmış biliş | Neden bu tutar, kaynak ve varsayım notları | Tutar–oran–dönem–koşul zinciri ekranlar arasında zihinden birleştirilmek zorunda mı? |
| Bilgi arama ve tanıma | Beş menü, breadcrumb | “Komisyon hangi koşulla kazanılır?” görevi ilk kez gelen kişi tarafından doğru yere götürülüyor mu? Menü sayısı bulunabilirlik kanıtı değildir |
| Peak-End / hata sonrası deneyim | Vazgeç, Geri al, durum mesajları | En kritik an olan kayıt hatası/migration/sıfırlama veri güvenini koruyor mu; son mesaj gerçekte olmayan kayıt başarısı söylüyor mu? |

`ux_v2.md` içindeki kaynak ve sınırlamalar korunmalı. Bu ilkeler evrensel piksel reçetesi veya başarı garantisi sayılmamalı. `B7` kabulü görsel kanaat yerine görev gözlemi ve ilgili mekanik kanıtı birlikte toplamalı.

### MS-19 — WCAG 2.2 AA kapanışı henüz yok · P1 · NOT_VERIFIED

AA hedefi ile AA uygunluk iddiası ayrı tutulmalı. Kaynakta birçok erişilebilirlik önlemi ve test var; gerçek yardımcı teknoloji, bütün kontrast/durumlar, 200% metin, 400% zoom ve tam süreç kanıtı tamamlanmış değil. W3C açıklaması uygunluğu tam sayfa ve tam süreç üzerinden ele alır; otomatik ve insan değerlendirmesinin birlikte gerektiğini belirtir. [W3C uygunluk açıklaması](https://www.w3.org/WAI/WCAG22/Understanding/conformance).

**Kapanış kaydı:** uygulanabilir A/AA kriteri → etkilenen sayfa/süreç/durum → yöntem → tarayıcı/OS/giriş → bulgu → PASS/FAIL/NOT_RUN/N/A gerekçesi. “22 skip var” tek başına 22 erişilebilirlik kusuru değildir; her skip’in kapsamı ve alternatif kanıtı ayrı tutulmalı.

Özellikle: klavye sırası/geri dönüş, görünür ve örtülmeyen odak; kontrol adı/rolü/değeri; hata ve durum duyurusu; metin ve kontrol kontrastı; reflow/zoom; dokunma ve sürüklemesiz alternatifler; kimlik doğrulama ekranının uygulanabilir kriterleri. **14 CSS px, Outfit, 320-first, radius ve çevrelemeyen odak bu projenin ek kararlarıdır; tek başlarına AA kanıtı değildir.**

Eski proje kararı dar veri tablolarında kayıt/matris eşdeğeri istiyor. Daha sonraki genel tablo kuralı gerektiğinde kapsayıcı içi kaydırmaya izin veriyor. Bu, mevcut işlevsel mobil kayıt görünümünü geri almak için gerekçe değildir. Büyük iki boyutlu görünümde ihtiyaç varsa belgeli kapsayıcı istisnası; sayfa düzeyi yatay taşma yine yok. `B7`.

## 6. Sürdürülebilirlik ve süreç açıkları

### MS-20 — Görsel değişiklikleri yakalayan onaylı referans katmanı eksik · P1

Testlerde konum, taşma, yazı boyutu ve durum kontrolleri var. İncelenen `tests`, `scripts`, `.github` ve paket tanımlarında `toHaveScreenshot` / `toMatchSnapshot` ya da başka bir deterministik görüntü karşılaştırma mekanizması için kanıt bulunmadı. Bu, bütün bilgisayarlarda hiç görsel inceleme yapılmadığı iddiası değildir. Sunulan kanıt “UI bozulmasın” isteğinin görsel referans katmanını henüz karşılamıyor.

**Düzeltme:** az sayıda kritik master ve gerçek tüketici için sabit ortamlı önce/sonra/fark görüntüsü. Açık/kapalı, seçili/odak/hata, uzun içerik ve 320/masaüstü kapsamı. Her route’un her durumunu pahalı bir piksel matrisine çevirmek gerekmez. Baseline sessizce yenilenmez; uygulayıcı tek onaylayıcı olmaz. `B7` ve mimari kapılar.

### MS-21 — Sözleşmelerin çoğu hâlâ talimat; mimari kapı değil · P1

Ana inceleme tabanında `global.css` 6708, `ui.tsx` 1150 satırdı. Satır sayısı hata değildir; ortak seçici ve geniş bileşen sözleşmesinin birçok tüketiciyi etkilemesi risktir. Ekran görüntülerindeki CSS kaynak sırası düzeltmesi bu riskin somut örneği; yapılan hedefli düzeltmenin kendisi yanlış sayılmaz.

UI kapısı belirli stil ve DataTable kurallarını gerçekten denetliyor. Buna karşılık domain→React/storage/ağ sınırını alias/re-export yollarıyla yakalayan import kapısı, ortak bileşen tüketici kapsamı ve grafik projeksiyonu sözleşmeleri tamamlanmış değil. “Her sayı params.ts’de” açıklaması da gerçeği aşırı sadeleştiriyor: Affilate ve Applet’ın ayrı model varsayılanları var.

**Düzeltme:** bütün sayıları tek dosyaya taşımak yerine **her iş kuralının bir yetkili kaynağı** olsun. Saf çekirdek, etkin girdi çözümleme, görünüm projeksiyonu, persistence/ağ ve UI sınırları iş ihtiyacına göre kurulmalı. MVVM kullanmak için bütün fonksiyonları sınıfa dönüştürmek; OOP/MVC/DDD/CQRS’yi aynı anda uygulamak gerekmez. Astro, React, Mantine ve ECharts’ı topluca değiştirme gerekçesi bulunmadı.

**Kabul:** yasak bağımlılık fixture’ı FAIL, geçerli fixture PASS; tablo/grafik/CSV aynı kayıt/birim/değer projeksiyonunu tüketir; yeni grafik türü adapter olmadan kabul edilmez. `B0/B2/B6/B7` içinde açık sahip ve test bağlantısı verilmeli; Y8’de sözü edilen import kapısı paketsiz bırakılmamalı.

### MS-22 — Test edilen build’in kimliği ve eşzamanlı koşu izolasyonu eksik · P1

`playwright.config.ts` farklı portu destekliyor; yerelde `reuseExistingServer: !CI` kullanıyor. Yanlış worktree veya eski `dist` için commit/build kimliği doğrulaması görünmüyor. AF-2/3 commit açıklamasında eşzamanlı koşunun `test-results` dizinini silmesinden doğan hata kaydı var. Ayrı worktree’ler normalde ayrı dosya dizinlerine sahip olsa da aynı checkout içindeki eşzamanlı koşular ayrıca korunmalı.

**Kabul:** test başlamadan hedef build kimliği beklenen commit/dirty kimliğiyle eşleşir. Koşuya özgü port, çıktı/rapor/trace dizini ve aynı checkout’ta build kilidi veya açık sıralama kullanılır. Port ayrımı tek başına tüm kaynakları izole etmez. `ar-AR-38`, `B7/B8`.

### MS-23 — Git kimliği ve AI trailer kuralı uygulanmamış · P1 · Kesin süreç ihlali

`15011e9..5b3453e` arasındaki yedi upstream commit’in author/committer alanları kalıcı istenen kimlikle eşleşmiyor; yedisinde de Claude `Co-Authored-By` trailer’ı var. Sonradan gelen `fa58509` aynı uygunsuzluğu sürdürüyor: toplam **sekiz**. Bunlar denetçinin yazdığı commit’ler değil, korunarak alınan upstream tarihçesidir. Yeni çalışma için zorunlu kimlik **`karacaismail <35493655+karacaismail@users.noreply.github.com>`**; başka ortak yazar veya üretim imzası eklenmemeli.

**Düzeltme:** birleşik plan K8 “varsayılan kalsın” maddesi kaldırılıp bağlayıcı kullanıcı kararı yazılmalı. Diğer bilgisayar ve kullanılan araçta eşdeğer enforcement doğrulanmalı; bu Mac’in guard’ının orayı koruduğu varsayılmamalı. Guard devre dışı bırakılamaz.

**Kabul:** sonraki yeni commit’in iki kimlik alanı ve mesajı kontrol edilir. Fetched geçmiş korunur; bu rapor tarihçe değiştirme veya başka kişiye ait işi yeniden imzalama izni vermez. Önceki commit’ler için sonradan açıklama gerekiyorsa history rewrite yerine kullanıcıyla ayrıca kararlaştırılır. `B0/B8`.

### MS-24 — Daraltılmış v1, bütün isteğin tamamlanması gibi kapatılamaz · P1

Kullanıcının 13/14 numaralı ekran görüntülerinde `archetype.md` için “sonra, bunu uygula” talebi ve Claude’un kabulü var. Birleşik plan Y8/§5.2 daha sonra yalnız üç parçayı gerekli sayıp kalanını `deneysel`/v1 dışı bırakıyor. Son commit genel varsayılan onayı bildiriyor; bu denetimde kapsam değişikliğini açıklayan insan karar kaydı yok. Kullanıcı gerçekten dar v1’i kabul ettiyse ona göre teslim yapılabilir; yine de kalan mimari maddeler “tamamlandı” değil “kabul edilmiş erteleme” olarak korunmalı.

Tam dizin taşıması veya her isteğe yeni katman eklemek şart değil. Fakat gereksinimi karşılayan **eşdeğer çözüm** ile henüz yapılmayan işi **kapsam dışına atmak** aynı şey değildir. Kayıt güvenliği, senaryo bütünlüğü, bağımlılık kapısı, ortak projeksiyon ve regresyon kabulü için karşılık gösterilmeden tam kapanış yapılamaz.

**Kabul:** her eski kabul kimliği için mevcut çözüm, yeni paketteki karşılık, kullanıcı tarafından kabul edilmiş erteleme veya gerekçeli uygulanamazlık. “V1 tamam / bütün program tamam” durumları ayrı. `B0/B7`.

### MS-25 — OPEX ödeme durumu şüphesi mevcut kodda doğrulanmıyor · P2 · Birleşik plan düzeltmesi

Birleşik plan Ç13, ödeme takibi kapalıyken “Ödendi/Bekliyor” gösterildiğini öne sürüyor. `OpexPage.tsx:944–961` bu iki etiketi `odemeTakibi` koşulunun içine alıyor; `takip=false` ise “Bu ay var” üretiyor. **Mevcut koşullu dal göz ardı edilmiş.** B1’den kesin hata kaydı olarak çıkarılmalı; iyi çalışan davranış korunmalı.

`takip` alanı eksikse `!== false` nedeniyle açık kabul edilmesi ayrı bir sınır sorusudur. Bu denetimde gerçek veri sözleşmesinin bu alanı eksik gönderdiği gösterilmedi; mevcut canlı hata diye yazılamaz. Gerekirse şema testiyle araştırılır.

### MS-26 — Doküman dağıtımı ve kaynakların taşınabilirliği eksik · P2

Bu makinede eski raporların kök kopyaları izlenmiyor; `docs/` altında kanonik raporlar var. `archetype.md` ise yalnız kökte bulunuyor; depodaki plan `docs/archetype.md` yoluna atıf yapıyor. İçinde üçüncü kişi isimleri bulunduğu gerekçesiyle bütün belgenin paylaşım dışında kalması, başka bilgisayardaki ajanın ortak yönergeye ulaşmasını engelliyor.

**Düzeltme:** kullanıcı talimatları korunarak role dayalı, yayınlanabilir mimari rehber; gerekiyorsa ayrı ve yayımlanmayan kişi/erişim devir kaydı. Public repo tercihi korunur; private repo önerisi çözüm değildir. Secret, kişisel veri ve ham yedek Git’e konmaz. Lisans ayrıca kullanıcı kararıdır.

Kök kopyalar sessiz silinmemeli; kanonik kaynak ve tarihsel kopya ilişkisi açıklanmalı. Belgelerdeki başka bilgisayara özgü mutlak yollar, taşınabilir repo bağlantısı veya kalıcı commit bağlantısıyla desteklenmeli. `B0/B7`.

### MS-27 — “Yeşil suite” ile davranışın doğru olması eşitlenmemeli · P1

CA-1 CI sonucu gerçek ve olumlu. Ancak MS-01/MS-03 karşı örnekleri eski yeşil suite’in gözden kaçırdığı alanları gösterdi. B2.1 MS-01’i ve MS-02 test kapsamını ilerletti; MS-03 devam ediyor. TDD, yalnız uygulamanın ürettiği sonucu beklenen sonuç diye tekrar etmek değildir.

**Kabul:** bağımsız iş sözleşmesinden beklenen değer çıkar; küçük karşı örneğin eski sürümde başarısız olduğunu kaydet; sonra düzelt. Hesap, içerik, görsel ilişki ve kullanıcı anlaması ayrı test katmanları. “Herkes anlıyor” veya “%100 bozulmaz” iddiası üretme. `B2/B6/B7`.

## 7. Sayfa ve master bileşen kapsamı

Bu matris bütün rota ailelerini kapsar; her pikselin bu tur yeniden incelendiği iddiası değildir. `contents.md` P01–P25 eski envanterinin yanına artık Affilate da eklenmiştir: toplam 26 yayımlanan rota.

| Yüzey | Korunacak yapı | Eksik / düzeltilmesi gereken bağ |
|---|---|---|
| Ana sayfa, organizasyon | Şema ve rol erişimi | Şirketin neyi planladığı, hangi kapsamın taslak olduğu ve Genel bakış’a geçiş; organizasyonu tüm stratejinin tek sayfası yapma |
| Yedi rol sayfası | Rol teslimleri ve ortak profil | Rol işi ile kanal/şirket politikasını ayır; devir/kabul koşulları; Segika’ya iStoc rolünü uyarlama kararı açık olmalı |
| İstihdam | Kadro takvimi ve gelir katkısı | İşe alım ile genel pazarlama olayı ayrımı; aynı kadro maliyetinin gelir/nakitte eşitliği |
| Hedefler | Hedef ve tahmin sunumu | Metrik kimliği, başlangıç, gerçekleşen yok durumu ve kaynak |
| Eylem planı | Takvim/ajanda eşdeğeri | Aynı işin ortak kimliği, bağımlılık ve kabul kanıtı; planlanmış tarih tamamlanma değildir |
| Karar yetkisi | Yetki ve kontrol noktaları | Hazırlayan/karar veren/eskalasyon ayrımı; ilgili karar kaydına bağ |
| Kararlar | Açık sorular | Yaşam döngüsü, gecikme, seçenek/etki; ücret/CRM/mesai için ana adres |
| Temsilci ağı | Kanal modeli ve senaryolar | Şirket stratejisiyle kapsam ayrımı; temsilci ile müşteri aktivasyonunun farklı olayları |
| İş ortaklığı | Marka/program ayrımı | Strateji ve politika sürümü; Affilate preset bağı; alternatifler açık |
| Affilate | Üç model, hesap açıklaması, kıyas, dönem dökümü | Kayıt kurtarma, sürüm/çatışma; gerçek ödeme/onaylı politika sanılmaması; insan anlama testi |
| Gelir planı | Kurucu, sonuç, kıyas, filtreler; B2.1 hesap girdisi aktarımı | Aktarılan girdilerin regresyonunu koruma; kalan gider kaynağı/kapsam farkı ve sürümlü snapshot; gelir türü |
| Giderler | Kaynak okuma, masaüstü tablo, mobil kayıt | Kaynak yenilenirken odak/filtre/sıra; tutarların hangi plan/kapsamdan geldiği; ödeme dalı korunmalı |
| Nakit akışı | Nakit giriş/çıkış ve finansman özeti; B2.1 ilave kadro ve seçenek bağlantısı | MS-01’in gerçek kaynak kapsamı kabulü, MS-02’nin kaynak/snapshot farkı, MS-03; seçili ay incelemesi |
| Parametreler | Görev grupları, değişiklik listesi | Etki alanı, etkin baz sürüm, kayıt doğrulama/migration; global/yerel değişiklik ayrımı |
| Applet | 17 ayrı model, katalog ve düzenleyiciler | Kaynaklı uygulama ile şirket örneği ayrımı; veri kurtarma; göreve göre kıyas |
| Notlar | Kişisel çalışma ve onaylı silme | Resmi karar/görev kaydı gibi görünmemesi; kayıt şeması ve kurtarma |
| BCG | Doğrudan erişilen eğitim | Şirketin gerçek strateji sonucu olmadığı ve örnek veri kaynağı |
| Arşiv | Tarihsel materyal | Yerine geçen karar/politika bağlantısı; güncel talimat gibi sunulmaması |
| E-posta | Mevcut kişisel taslak korunmalı | Ortak yayın kapsamı kararı; `noindex` erişim denetimi değildir; sessiz silme yok |
| 404 | Sistem ve geri dönüş yolları | Taşınan içeriğin bilinen eski linkleri için anlamlı köprü; her şeyi anasayfaya gönderme |

Planlı yedi rota: `/genel-bakis/`, `/strateji/`, `/musteri-yolculugu/`, `/pazarlama-operasyonu/`, `/ucret-politikasi/`, `/olcum/`, `/kaynaklar/`. Bunların eksikliği aynı türden değil: bazıları mevcut içeriğin taşınmasıyla kurulabilir, bazıları iş kararı/yeni içerik ister. Kaynaklar başlangıçta bölüm olabilir; ölçüm kaynağı yokken gerçek performans dashboard’u üretilemez. Sadece dosya sayısını yedi artırmak kabul değildir.

| Master / ortak mekanizma | Mevcut dayanak | Kalan sözleşme |
|---|---|---|
| AppFrame / PageHeader / gezinme | Ortak kayıt, beş grup, drawer, breadcrumb | Yayın/politika durumu; her sayfaya aynı kaynak cümlesi basılmaması; bulunabilirlik |
| Choice / Anahtar / görünüm seçici | Kısa değer ve uygun semantik; sığmaya göre sunum | Aynı değer–farklı kaynak durumu; uzun içerik/zoom; tüm tüketicilerde seçili ve odak ayrımı |
| Sayi / form alanları | Taslak yazım ve düzeltme açıklaması | Domain/depolama sınırında aynı doğrulama; geçersiz taslağın son geçerli sonuçtan ayrımı |
| DataTable / kayıt / MatrisKiyas | Mobil sunum ve anlamlı özet | Kıyas görevi, komşu eşikler, filtre-toplam eşitliği, yeniden sıralamada kimlik |
| Chart / ECharts adapter / grafik eşdeğeri | Ortak seçenekler ve dar görünüm | Aynı projeksiyon, seri kimliği, geç gelen çizim, gizli panel/unmount; hangi sorunun yanıtlandığı |
| ResultSummary / yapışkan özet / Stats | Ana sonuç öne alınmış | Sayı, kaynak, dönem, eksiklik ve model sınırının aynı bağlamda olması |
| Takvim / Gantt / ajanda | Dar ekranda farklı sunum | Ortak olay kimliği ve kapsam; tekrarlanan zaman görünümünün gerekçesi |
| Dayanak / kaynak notu | Açıklayıcı metinler | İddia, gerçek kaynak, tarih, şirket uyarlaması ve doğrulama durumu |
| Onay / Eylem / geri alma | Süresiz onay ve Vazgeç | Bütün veri kaybettiren yollar; işlemin gerçek kapsamı; kurtarma ve tekrar çağrı |
| OPEX canlı durum / yerel kayıt durumu | Durum ve hata mesajları | Eski/uyumsuz/kısmi/çakışan kayıt ayrı; yanlış başarı yok |

## 8. Mimari kabul haritası: 42 kabul maddesini kaybetmeden birleştirme

Bu tablo ayrıntılı `archetype.md` yerine yeni bir standart icat etmez. Eski kabul kimliklerinin birleşik planda kaybolmasını önler. “Kısmi” mevcut bazı testlerin aynı davranışa dokunduğu, bütün kimliklerin geçtiğinin gösterilmediği anlamına gelir.

| Eski kabul | Güncel durum | Birleşik planda gerekli karşılık |
|---|---|---|
| AR-01…03 bağımlılık/grafik kapsam kapıları | Sistematik kapı eksik | B0’da sınır kararı; B7’ye bırakılmadan ilgili teknik pakette negatif fixture |
| AR-04…12 saf hesap, para, dönem, eşikler | Affilate ve mevcut model testlerinde önemli kapsam var; B2.1 personel gideri düzeldi | MS-01 regresyonunu koru, MS-03’ü kapat; bütün alanlar için geçti deme |
| AR-13…15 etkin senaryo ve eski baz | B2.1 aktarımı ilerletti; MS-02 kaynak/snapshot, MS-05 eski baz açık | B2.2 + B6 |
| AR-16…20 ortak projeksiyon ve grafik yaşam döngüsü | Kısmi; kapsamlı sözleşme kapanışı yok | B3/ilgili ortak bileşen işi + B7; yalnız dizin taşımasıyla kapanmaz |
| AR-21…28 hydrate, saflık, migration, export, çatışma | MS-04…07 açık; bazı import/export davranışları var | B6 bütün store’ları kapsar |
| AR-29 kaynak yanıtı | Bazı hata/eski veri davranışları var; tam geçiş kabulü yok | OPEX fixture ile gecikme/sıra/silinme ve odak koruma |
| AR-30…36 input, metin, 320, odak/hareket, kabuk geçişi | Birçok uygulama ve CI testi var | Mevcut kazanımları koru; gerçek AT/zoom/cihaz ve durum boşluklarını B7’de raporla |
| AR-37…39 tüketici kapsamı/build kimliği/skip | MS-20/21/22; skip kaydı kısmen doğru | Değişiklik etki haritası, build eşleştirme, doğru test sayacı |
| AR-40 statik giriş/veri erişimi | Sınır AGENTS’ta açıkça belgeli | Public veri sınıflandırmasını koru; istemci kapısından gerçek yetkilendirme sonucu çıkarma |
| AR-41 eski sekme migration’ı | Uygulanmış sözleşme yok | B6 geçiş deneyi |
| AR-42 gereksiz kaynak yüklememe | Lazy grafik altyapısı var | Manifest + ağ isteği kanıtı; gizlemek ile indirmemeyi ayır |

Veri kaybı, yanlış finans sonucu veya sürüm kırılması “kullanıcı arayüzü güzel” ortalamasıyla telafi edilemez. Bütün mimariyi yeniden yazmak da bu riskleri kendiliğinden çözmez.

## 9. Birleşik planda yapılması gereken revizyon

### 9.1 K1–K13 için karar sınırı

| Madde | Revizyon |
|---|---|
| K1 İş modeli | Kullanıcı seçmedikçe strateji onayı üretme. Mevcut hesap koşullu abonelik modeli olarak çalışabilir |
| K2 Ortak politikası | İki örnek/taslak sürümü ayır; bütün oranların input olması kesin kullanıcı talimatıdır, yeniden oylanmaz |
| K3 Gider kapsamı | Dağıtım belirsizliğini görünür kıl; yalnız iStoc girişleriyle “Türksab toplam” deme |
| K4 İsimler | Menü etiketi, h1 ve erişilebilir ad arasında kanonik kavram ilişkisi zorunlu; birebir aynı uzun cümle her yerde şart değil |
| K5 Kırıntı | 320’de göreve ve dikey alana göre karar ver; üç satır tek başına başarısızlık ölçütü değil |
| K6 Önceki/sonraki | Sunum akışı ile bilgi mimarisi ayrımı korunmalı; önceki karar değişecekse sapma kaydı |
| K7 Arşiv | Ulaşılabilirliği koru; ana görevle rekabet edip etmediğini sınayarak yerleştir |
| K8 Git trailer | Soru olmaktan çıkar: kalıcı kullanıcı talimatını uygula |
| K9 Archetype paylaşımı | İsimlerden arındırılmış rol tabanlı kanonik belge öner; talebin tamamını sessizce dışarıda bırakma |
| K10 E-posta | İçerik/yayın kapsamı kararıdır; noindex gizlilik sağlamaz; kaynak taslağı koru |
| K11 Terimler | Uygulayıcı sözlüğü kod/formülle doğrular; belirsiz iş tanımı kullanıcı kararıdır |
| K12 İnsan testi | Sahip + bir kişi bir **pilot** olabilir; bütün persona ihtiyaçları ve erişilebilirlik için kapanış kanıtı diye sunma |
| K13 Sayısal hata | Diğer bilgisayardaki mevcut uygulama yetkisi kapsamında hedefli düzeltme ilerleyebilir; bu rapor kendi başına o bilgisayarı veya yayını değiştirmez |

### 9.2 B0–B8 korunarak kapsamı düzeltme

| Paket | Gerekli değişiklik | Kapanış kanıtı |
|---|---|---|
| B0 | Tek backlog; `ct-`, `ga-`, `if-`, `ar-` önekleri; kesin kullanıcı kararlarını varsayılan soru listesinden çıkar; bütün eski maddelerin akıbeti | Kabul kimliği → görev → kanıt veya açık erteleme |
| B1 | Karar yaşam döngüsü; yanlış alt bilgi; politika/yayın durumu; MS-25 yanlış pozitifini çıkar | Doğru sınıflandırma ve karar geçişi; kaynakla tutarlı metin |
| B2 | B2.1’i koru; MS-01 gerçek kaynak/çift sayım kabulü, MS-02 kaynak/snapshot, MS-03 toparlanma; istisnaya rağmen “aynen” deme | Bağımsız sayısal oracle + karşılaştırılabilir kapsamda aynı senaryo |
| B3 | Metrik kimliği, birim/dönem/olay, sözlük ve ifade değerlendirme kapsamı | Aynı metrik tüketicileri arasında değer/anlam eşitliği |
| B4 | Mevcut blokları kayıpsız taşı; eski hash; tablodaki bağımlılığa B3’ü de ekle | Önce/sonra blok envanteri; link ve kapsam kontrolleri |
| B5 | Genel bakış/Kaynaklar ve politika sürümü; B3’ün metrik sözlüğüne bağımlılığı görünür olsun | Kaynak/karar/sonuç birbirine bağlı; boş kabuk yok |
| B6 | Parametre, senaryo, seçenek, Notlar **ve Applet/Affilate**; doğrulama/migration/çatışma/ham kaydı koruma | AR-21…28/41; iyi kayıt kadar bozuk/gelecek sürüm ve kesinti |
| B7 | Uzman tekrar puanlama, hedefli insan pilotu, bağımsız QA, görsel regresyon ve WCAG matrisi; kalanlar açık | Aynı kaynak sürümüne bağlı kanıt; ortalamayla kritik hata örtülmez |
| B8 | Build→CI→artifact→Pages izini doğrula; kimlik kuralını uygula; branch birleştirme yöntemini gerçek Git grafiğine göre seç | Hedef commit yayımlandı; rollback referansı; kalan doğrulama açık |

“B2 ve B1 ayrı dosyalar” tek başına paralellik gerekçesi değildir: ortak senaryo/karar/sürüm sözleşmesi önce anlaşılmalı. Ayrı dosyalara yazılan uyumsuz anlam da çatışmadır. B6, B2’nin şema kararına dayanır. B3→B4 ilişkisi metinde var ama paket tablosunda eksik; tablo ve sıra aynı olmalı.

`ff-only` yalnız uygun commit grafiğinde mümkündür. Gerçekten ayrışmış dallar için kör `ff-only` veya zorla reset önerilmemeli. Fetch edilmiş geçmişin kimliği korunmalı. Birleşmiş branch/worktree temizliği, kullanıcı onayıyla yapılabilen bakım işidir; ürünün çalışmasının önkoşulu değildir. Bu rapor temizlik yapmaz.

### 9.3 Planın sekiz inceleme sorusuna doğrudan yanıt

1. **Altı yolculuk yeterli mi?** Ürün vaadi için iyi başlangıç. Kaydet→yeniden aç→başka sürümde kurtar ve başka kişiye aynı senaryoyu aktar görevleri de gerekli; erişilebilir giriş ve kaynak yokluğu bütün yolculuklara çapraz koşul.
2. **1,8 milyon tahmini doğru mu?** Eski sürümde belirtilen varsayılan ve ortak dönem için doğrulandı; B2.1’de aynı fark 0 oldu. Gerçek Sheets ve maksimum finansman açığına doğrudan genellenemez. Toparlanma hesabı hâlâ düzeltilmeli.
3. **Yanlış/eksik bulgu var mı?** Ç13 mevcut `takip=false` dalı için yanlış pozitif. Affilate kayıt kaybı, updater saflığı, yeni sürüm/değişen baz, build kimliği ve güncel uzman puanlaması eksik ele alınmış.
4. **Karar varsayılanları uygun mu?** K8 bağlayıcı kural; K1/K3/K10’da yanıtsızlığı onay saymak uygun değil. Teknik doğruluk ve veri koruma düzeltmeleri keyfî ürün oylamasına bağlanmamalı.
5. **Paket sırası uygun mu?** Genel yaklaşım kullanılabilir; B3→B4/B5, B2→B6 ve ortak şema bağımlılıkları netleşmeli. 9 ana başlık/17 alt paket takvim veya tamamlanma oranı kanıtı değil.
6. **Yanlış ertelenen var mı?** Veri koruma, etkin senaryo, ortak projeksiyon ve gerçek kapılar tam kapanıştan çıkarılamaz. Büyük klasör taşıması veya yeni framework şart değil.
7. **Pilot yeterli mi?** İlk ciddi yanlış anlamaları bulmak için değerli; bütün kullanıcı ihtiyaçlarını, gerçek yardımcı teknolojiyi veya WCAG AA uygunluğunu kanıtlamaz.
8. **Plan yanlış anlamayı artırıyor mu?** “1131 test yeşil”, “Türksab toplam”, “taşımak ya da uyarmak aynı kabul” ve varsayılan iş modeli onayı bu riski taşıyor. Açık kabul seviyeleriyle düzeltilmeli.

## 10. Önce başarısız olması gereken hedefli regresyonlar

Bu liste kabul sözleşmesidir; yalnız hâlâ hatalı/eksik davranışlarda yeni başarısızlık beklenir. Bu tur test dosyası yazılmadı. T01/T03’ün hesap karşı örnekleri ve T05’in yükleme girdisi mevcut fonksiyonlarla ayrıca çalıştırıldı. B2.1 sonrasında T01’in varsayılan ve bir özel varyantı hedefli kontrolde geçti; korunması gereken regresyondur.

| ID | İşlem / karşı örnek | Kabul |
|---|---|---|
| T01 | Aynı medyan kadro, aynı aylar, sıfır kurmaca Sheets | Nakit ve başabaşın karşılaştırılabilir giderleri eşit; B2.1’de giderilen 1.800.000 fark geri gelmez |
| T02 | Sheets’e zaten ikinci saha kişisini ekle | Aynı maliyet iki kez sayılmaz; eşleştirme kaydı görünür |
| T03 | Dönem sonu `[-100,50,-30,50]` | İlk toparlanma ile ufukta kalıcı toparlanma ayrılır; yanlış Kasım iddiası reddedilir |
| T04 | 13 özel seçenekten her birini değiştir, nakde geç ve yeniden aç | B2.1’in bağladığı girdiler korunur; B2.2’de etkin girdiler/sürümler yeniden üretilebilir. Kaynak istisnası ancak kayda bağlı ürün kararıyla kabul edilir; uyarı tek başına B2.2 geçişi değildir |
| T05 | Saklanan negatif fiyat/geçersiz tarih | Domain’e geçmez; ham kaynak ve son iyi senaryo korunur |
| T06 | Affilate `v=99`, bozuk JSON, kısmen bozuk kayıt | Açılış/yenileme ham kaydı değiştirmez; uyumsuzluk ve kurtarma yolu görünür |
| T07 | Eski bazla adlandırılmış senaryo; yeni default | Aynı girdiler korunur veya migration farkı onaydan önce gösterilir |
| T08 | Aynı revision’dan iki sekme yazımı | Sessiz veri ezme yok; taslak korunur |
| T09 | Migration sırasında kota/işlem kesilmesi ve eski sekme yazımı | Eski veya tamamlanan yeni kayıt kurtarılır; kayıp “başarılı kayıt” diye gösterilmez |
| T10 | Tek geçişin tekrar değerlendirilmesi | Çift undo veya yinelenen yan etki yok |
| T11 | `%0`, farklı ikinci/üçüncü yıl oranı, 10 fiyat ayı/12 hizmet ayı/6 taksit | Ayrı girdiler bağımsız; toplam ve dağılım aynı motorla doğru |
| T12 | Fiyat/politika değişirken tablo, grafik, CSV, açıklama | Aynı kayıt/birim/dönem/sürüm; eski yüzde metinde kalmaz |
| T13 | `takip=false` ve takip açık iki OPEX fixture’ı | Kapalıyken ödeme iddiası yok; açıkken doğru ödeme etiketi korunur |
| T14 | Geç yanıt B’den sonra eski yanıt A gelir; seçili kayıt silinir | Güncel kaynak eskiyle ezilmez; odak ve kayıp kayıt durumu anlaşılır |
| T15 | Eski sayfa hash’i ve yeni ana adres | İçerik kaybolmaz, yanlış panel açılmaz, kaynak kopyalanmaz |
| T16 | 320’de aynı ölçütle iki senaryo / üç ortak kıyası | Değerler aynı bağlamda; ezber zorunluluğu yok; 14 px altına inilmez |
| T17 | Tab ile odak, panel değişimi, dokunma→Tab, zoom | Odak görünür ve örtülmez; selected ile karışmaz; girdiler korunur |
| T18 | Yanlış worktree/eski dist aynı portta | Build kimliği tutmadığı için test başlamaz |
| T19 | Kritik master değişikliği | Davranış + deterministik görüntü farkı + tüketici etkisi incelenir; baseline kör yenilenmez |
| T20 | Aylık referans fiyat 100 TL; fiyatlandırılan süre 10 ay; hizmet 12 ay; tek tahsilat 1.000 TL; oran %10; komisyon 12 taksitte; iade/indirim/vergi ve ek kesinti yok | Toplam komisyon 100 TL, yuvarlama öncesi taksit 100/12 ≈ 8,33 TL, aylık fiyat eşdeğeri 1.000/12 ≈ 83,33 TL. Kuruş dağıtımı toplamı tam 100 TL korur. İlk kullanıcı bu üç anlamı ayırır; yanıt/gerekçe/yardım ayrı kaydedilir |

TDD sırası: iş sözleşmesi ve karşı örnek → eski davranışta hedefli başarısızlık → en küçük düzeltme → hedefli geçiş → etkilenen tüketiciler → ilgili zorunlu kapılar. Her belge düzenlemesinde bütün suite’i koşmak gerekmez; ortak model/UI değişikliğinde kapsam etki haritasından seçilir. Başarısız beklenti uygulamaya uydurularak yeşile çevrilmez.

## 11. Benim önceki yönergelerimde de düzeltilmesi gerekenler

- İlk UX belgesinde mekanik kurallar güçlü, ilişkisel kabul zayıftı; V2 bunu açıkça kabul etmişti. Yeni kapanış yine yalnız radius/taşma testine indirgenirse aynı eksik tekrarlanır.
- Ayrı raporlarda aynı `F`, `C`, `M` kimlikleri kullanılması takip maliyeti yarattı. Tek backlog ve belge önekleri daha önce netleştirilmeliydi. Bu, uygulayıcının tek başına oluşturduğu sorun değil.
- İçerik envanteri için önerdiğim kapsam cümlesi, nakde seçenek aktarımının “gösterildiği” izlenimini yaratıyorsa bu önerinin de mevcut davranışla uyumu eksiktir. Uygulayıcı plan metnini olduğu gibi kullanıcı metnine çevirmemeli; rapor yazarı da mevcut/hedef ayrımını açık tutmalıydı.
- `archetype.md` içindeki gerçek kişiyle devir bilgisi, public dağıtım için ayrı role dayalı sürümle verilmeliydi. Bu benim belge paketleme eksiğimdir; mimari yönergenin tümünü kaybetmek doğru telafi olmaz.
- 240 kriter güçlü bir inceleme aracı olabilir; her uygulama teslimine tek başına binlerce satır puanlama yüklemek sürdürülebilir değildir. Değişen görevlerin vektörleri güncellenmeli, geniş yeniden denetim sürüm/risk eşiklerinde yapılmalı. Kritik kapı her zaman ayrıca kalmalı.
- “Bütün metinler ≥14 px” gibi proje kararları ile WCAG ölçütleri, uzman puanı ile insan başarısı, tarihli kaynak incelemesi ile güncel runtime kanıtı her belgede daha kolay ayırt edilmeliydi.

## 12. Tamamlanma kaydı ve teslim sınırı

Tek bir genel yüzde vermiyorum: kapsamı farklı yedi programı paket sayısına göre ortalamak, veri kaybı ve hesap hatasını yüzeysel tamamlanmalarla örter. Takip kaydı en az şu alanları ayrı taşımalı:

```text
gereksinim_id | kaynak/sürüm | kullanıcı görevi | mevcut davranış
beklenen davranış | görev sahibi rol | uygulama durumu
model testi | etkileşim testi | görsel kanıt | erişilebilirlik
insan anlama sonucu | CI/artifact/commit | erteleme kararı
```

Tam kapanış için dört ayrı soru cevaplanmalı: **İş ve içerik anlamı doğru mu? Hesap ve kayıt doğru mu? Kullanıcı görevi tamamlanıyor mu? Aynı sürüm doğrulanıp yayımlandı mı?** Birindeki başarı diğerinin yerine yazılamaz.

Bu denetimde yapılanlar:

| Kontrol | Sonuç |
|---|---|
| Güncel kaynağı alma | PASS — iki ff-only pull; son kaynak `fa58509` |
| Manifest/lock sürüm eşleştirme | PASS — yukarıdaki altı temel sürüm eşleşiyor |
| CA-1 CI/deploy kanıtını okuma | PASS — `6e7799b`: 1109 geçti, 22 atlandı; `5b3453e` kontrol/test ve Pages işleri de başarılı |
| Son B2.1 CI/deploy | Son sorguda IN_PROGRESS; son sürümün yayında çalışması NOT_VERIFIED |
| İlave kadro gideri karşı örneği | ÇALIŞTIRILDI — eski sürüm 1.800.000 TL fark; `fa58509` varsayılan + özel örnekte fark 0, hedefli PASS |
| Geçici toparlanma karşı örneği | İki sürümde ÇALIŞTIRILDI — Kasım/Ocak farkı; “kalıcı” kabulü FAIL |
| Geçersiz yerel parametre girdisi | ÇALIŞTIRILDI — negatif fiyat ve geçersiz tarih kabul edildi; sınır kabulü FAIL |
| Affilate bozuk/gelecek sürüm açılışı | Kaynak yolu doğrulandı; yeni tarayıcı deneyi NOT_RUN |
| OPEX ödeme etiketi şüphesi | Kaynakta `false` dalı korunuyor; Claude’un kesin hata atfı REDDEDİLDİ |
| Bu tur tam uygulama suite’i / yeni build | NOT_RUN — uygulama değişikliği yapılmadı; commit kapsamı belirtilen CI kanıtları okundu |
| Yeni ekran görüntüsü / gerçek Safari-iOS-Android / ekran okuyucu / insan testi | NOT_RUN |
| Diğer bilgisayarın güncel yerel dosyaları ve worktree’leri | NOT_VERIFIED |
| Bağımsız standards-reviewer incelemesi | Tam rapor ve ilgili güncel kaynak parçaları salt okunur incelendi; altı düzeltme işlendi. İnceleyici komut çalıştırmadı; ham deney/CI çıktısını yeniden doğrulamadı; bağımsız tarayıcı veya görsel QA değildir |

Yerel model deneyleri Node’un TypeScript desteğiyle mevcut `makeProgram`, `makeRevenue`, `makeCashflow`, `buildCashflow`, `inputsOf`, `fixedCosts`, `addedSahaCosts` ve `loadParams` fonksiyonlarını çağırdı; uygulama dosyasına test kopyası yazılmadı. İlk esbuild tabanlı çalıştırma yaklaşımı yerel modül bulunamadığı için kullanılamadı; paket kurulmadan Node ile tamamlandı. Gerçek Sheets, müşteri veya personel kayıtları okunmadı.

**Uygulayıcıya devir:** B2.1’in giderdiği hatayı yeniden açma; kalan kayıt güvenliği, toparlanma ve kapsam açıklarını, ayrıca Git kimliği kuralını iş listesine işle. Mevcut B0–B8 planını yukarıdaki kabul sınırlarıyla düzelt. Önceki UX kazanımlarını koru. İş kararlarını tahmin ederek onaylama, ertelenmiş işi bitmiş sayma, hatalı şüpheyi düzeltme işi açmak için kullanma. Raporun gerektirdiği yeni kanıtı üretmeden “tüm istekler tamamlandı” deme.
