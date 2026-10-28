# Archetype — değişime dayanıklı planlama yazılımı

> **Depo sürümü (28 Ekim 2026):** bu kopya herkese açık depo için hazırlandı; §11.4’teki kişi adları rol adıyla değiştirildi
> (AGENTS.md “Gizlilik ve yayın”; Codex denetimi docs/missings.md MS-26). Kişi/erişim devir kaydı sahibin bilgisayarındaki
> özgün kopyada kalır. Belge yalnız yönergedir; uygulama durumu AGENTS.md “birlesik_plan.md” bölümünde.

28 Ekim 2026 · Mimari karar ve uygulama yönergesi · Kaynak: `15011e9`

**Bu proje için önerilen yapı: özellik modüllerine ayrılmış tek uygulama + saf hesap çekirdeği + React'e uygun ViewModel katmanı + sürümlü veri sözleşmeleri + değişikliği yayımdan önce durduran kalite kapıları.** Astro, React, Mantine ve ECharts korunur. OOP yalnız durumu ve yaşam döngüsünü gerçekten kapsüllemesi gereken yerlerde kullanılır; bütün uygulama sınıf hiyerarşisine çevrilmez.

Vibe coding sırasında asıl koruma, ajana daha uzun bir prompt vermek değildir. **Yanlış katmana yapılan değişikliği, bozuk veri girişini, tutarsız gösterimi ve kayıplı veri geçişini otomatik reddeden bir sistem kurmaktır.** Talimat dosyası niyeti açıklar; tipler, şemalar, testler, import sınırları ve CI bu niyeti uygular.

“%100 bozulmaz” veya “%100 uyumlu vibe coding” garantisi verilemez. Ölçülebilir hedef; tanımlanan kritik sözleşmelerin tamamını kontrol kapsamına almak, hatanın etki alanını daraltmak, kaynağını izlemek ve güvenle geri dönebilmektir. Testlerin geçmesi yalnız sınanan koşullar için kanıttır.

**Bu teslim yalnız yönergedir.** Uygulama kaynakları bu belge için yeniden düzenlenmedi; paket kurulmadı, veri taşınmadı, yeni altyapı/deploy yapılmadı. “Önerilen” adlar ve komutlar mevcut özellik gibi sunulmaz. Bu belge `contents.md` içeriğinin nereye ait olduğunu değil, o içerik ve davranışın nasıl korunacağını tanımlar.

**Uygulayıcı için okuma sırası:** önce 1.3'teki somut riskler ve 2. bölümdeki karar; ardından 12. bölümden bir pilot dilim seç. Görevi 10.3 şablonuyla sınırla, 9.3'ten ilgili kabul koşullarını bağla. Bütün önerileri tek PR'da uygulama.

## 1. Güncel durum: ne sağlam, neresi kırılgan?

İnceleme öncesinde uzak kaynak alındı ve `git pull --ff-only origin main` ile `61fd2ff` → `15011e9` güncellendi. Yeni upstream commit'lerinin yazar kimlikleri kişisel politikadaki kimlikten farklıydı; bu durum bildirildi, geçmiş yeniden etiketlenmedi. Yeni commit üretilmedi. Önceki raporlar ve kullanıcının yerel dosyaları korundu.

### 1.1 Sürüm kanıtı

| Teknoloji | Manifest | Lockfile | Bu ortamda kurulu paket / çalışma zamanı | Karar |
|---|---|---|---|---|
| Astro | 7.4.0 | 7.4.0 | 7.4.0 | Koru |
| React | 19.3.1 | 19.3.1 | 19.3.1 | Koru |
| Mantine core | 9.7.3 | 9.7.3 | 9.7.3 | Koru; tek UI ailesi |
| ECharts | 6.1.0 | 6.1.0 | 6.1.0 | Koru; adapter sınırını güçlendir |
| TypeScript | 6.0.3 | 6.0.3 | 6.0.3 | Koru; sınır ve tip kontrollerini artır |
| Playwright | 1.64.1 | 1.64.1 | 1.64.1 | Koru; mevcut testleri küçümseme |
| Node | `>=22.22.0` | Uygulanmaz | 24.21.0; CI ana sürümü 24 | Yerel/CI araç sürümünü açık eşleştir |
| npm | Sabitleme alanı yok | npm lockfile mevcut | 11.19.0 | Tek paket yöneticisi ve tekrar üretilebilir kurulum |
| Zod | Doğrudan bağımlılık yok | 4.6.7 | 4.6.7, dolaylı bağımlılık | Kullanılacaksa doğrudan bağımlılık ve uyum kararı gerekir |

Kurulu paket sürümü, tarayıcıya yayımlanan artifact'ın sürümünü kanıtlamaz. Apps Script ayrı çalışma ortamıdır; Node testinde çalışması gerçek Apps Script dağıtımının doğrulandığı anlamına gelmez.

### 1.2 Korunacak güçlü temeller

- Astro sayfa yolları, React görünümleri, `AppFrame` ve `ModelProvider` ayrımı mevcut.
- İş hesaplarının önemli bölümü `src/data` içinde saf fonksiyonlara ayrılmış; Applet ve OPEX için model testleri var.
- `ChartSpec` ayırt edici `kind` alanıyla tiplenmiş; sayfalara doğrudan ECharts seçenekleri dağıtılmıyor.
- ECharts kullanılan modüllerle kuruluyor; görünürlükle yükleme, resize, dispose ve kopmuş DOM elemanına çizimi engelleme var.
- `DataTable` masaüstü/mobil sunumları ortak kayıttan üretiyor. Son commit'lerde açık özet alanı, matris karşılaştırması ve mobil sıralama geliştirilmiş.
- `tokens.css`, merkezi hareket/odak kuralları ve bunları kontrol eden `check-ui-gates.mjs` var.
- CI tip/kaynak kontrolü, üretim build'i ve Chromium/Firefox/WebKit testlerini yayından önce çalıştırıyor.
- Apps Script motoru Node ortamında fixture'larla test ediliyor. Bunu ikinci bir bordro motoruyla değiştirmek gerekmiyor.

Sorun “hiç mimari veya test yok” değildir. Mevcut korumaların **iş modülü, veri ömrü ve gösterimler arası eşitlik** sınırlarını tamamlaması gerekir.

### 1.3 Kaynağa dayalı riskler

Öncelikler: P0 veri kaybı/yanlış mali sonuç/yanlış güvenlik sınırı; P1 yaygın regresyon veya bakım maliyeti; P2 geliştirme ergonomisi. Tetikleyici riskler bu görevde çalışma zamanı hatası olarak yeniden üretilmiş sayılmaz.

| ID | Öncelik | Kaynakta görülen durum | Bozulma mekanizması | Hedef koruma |
|---|---|---|---|---|
| A01 | P1 | `global.css` 6.510 satır; `ui.tsx` 1.150 satır ve 13 kaynak tüketici | Ortak seçici veya davranış değişikliği çok sayfaya yayılır | Token/base/component/feature CSS sınırı; bileşen sözleşme kataloğu |
| A02 | P1 | `charts.ts` 1.322 satır; türler, ölçü, tema, format, DOM yaşam döngüsü bir arada | Bir türün düzenlemesi başka grafiklerin davranışını değiştirebilir | Saf seçenek üreticileri + ayrı runtime + tür bazlı sözleşme |
| A03 | P1 | `OpexPage.tsx` 2.076, `AppletPage.tsx` 1.636 satır | Sayfa, state, türetme ve sunum aynı düzenleme alanında | Özellik modülü ve ViewModel ayırımı; satır sayısını tek başına kalite ölçme |
| A04 | P1 | `buildModel(params)` bütün program/rol/gelir/ortaklık modellerini kuruyor | Basit parametre değişimi geniş yeniden hesap ve context güncellemesi doğurur | Açık bağımlılık grafiği, alan bazlı selector; önce ölçüm |
| A05 | P1 | `ModelContext.setParam` state updater içinde `saveParams` ve `setSaved` çağırıyor | Saf olması gereken updater yan etki taşıyor; tekrar değerlendirme ek yazım üretebilir | Saf reducer/updater; kayıt ayrı commit akışında, idempotent |
| A06 | P0 | `loadParams` yalnız temel türü denetliyor; sürümlü zarf yok | Geçersiz tarih/aralık kabulü; yeni varsayılanların eski fark kaydını sessiz değiştirmesi | Çalışma zamanı şeması + sürüm + baz sürüm/snapshot |
| A07 | P0 | Applet `{v:1,d}` kullanıyor; farklı sürümde varsayılana dönüyor; dizi içerikleri derin doğrulanmıyor | Eski/bozuk veri görünmeden yok sayılabilir; sonraki kayıt eski girdinin üstüne yazabilir | Geçiş zinciri, ham kaydı koruma, kurtarma/uyumsuz sürüm durumu |
| A08 | P0 | `notes.ts isState`, listeleri denetliyor; not kayıtlarının bütün alanlarını denetlemiyor | Bozuk not veya kopuk liste ilişkisi UI'ye geçebilir | Kayıt bazlı şema + referans bütünlüğü + kayıpsız kurtarma |
| A09 | P0 | Gelir özel seçenekleri ve nakit temel senaryo kimliği farklı katmanlarda | Aynı senaryo etiketi farklı etkin girdilerle sonuç üretir | Tek çözülmüş senaryo snapshot'ı ve tüketici sözleşmesi |
| A10 | P1 | `src/data/params.ts`, `notes.ts`, `opex.ts` içinde storage/fetch var | Veri türü, iş kuralı ve tarayıcı I/O'su birbirine bağımlı | Saf domain ile persistence/network adapter ayrımı |
| A11 | P1 | `charts.ts` seçenekleri `Record<string, unknown>`; seri kimliği yoksa sıra `s0...` | Eksik seçenek ve yeniden sıralamada seri kimlik kayması tipten kaçabilir | ECharts adapter tipleri, iş anlamına bağlı sabit seri ID'si |
| A12 | P1 | Metinler TS/TSX içinde; grafik ve UI'de farklı format yardımcıları var | Metin kısaltma anlamı/birimi değiştirebilir; tablo ve grafik farklı sayıyı anlatabilir | Tipli içerik anahtarı, ortak değer/format ve gösterim projeksiyonu |
| A13 | P1 | UI gate bazı sözleşmeleri regex ve `src/views` taramasıyla denetliyor | Alias, taşınan component veya biçim değişikliği gate kapsamından kaçabilir | AST/import tabanlı sınır; negatif örneklerle gate'in kendisini test et |
| A14 | P1 | Testlerde `toHaveScreenshot` / `toMatchSnapshot` çağrısı bulunmadı | Davranış kontrolü geçerken görsel düzen değişebilir | Kritik master durumları için deterministik görsel referans |
| A15 | P1 | TS `strict` açık; `noUncheckedIndexedAccess` ve `exactOptionalPropertyTypes` etkin değil | Eksik hücre/opsiyon varmış gibi kullanılabilir | Pilot modülden başlayarak daha sıkı tip sözleşmesi |
| A16 | P0 | `giris.ts` tarayıcıdaki durum/özetle görünümü açıyor; Pages statik dağıtım | Bu kapı gerçek sunucu yetkilendirmesi sanılırsa hassas veri yanlış yerde tutulur | Görünüm kapısı ile veri erişim kontrolünü ayır; gizli veri korumalı sunucuda |
| A17 | P1 | Applet ve parametreler sekmeler arası bildirim alıyor; revision/çatışma sözleşmesi yok | İki sekmenin düzenlemeleri son yazanın kazanmasıyla birbirini silebilir | Transaction/revision ve açık çatışma çözümü |
| A18 | P1 | `useOpexOnce` sayfa açılışında snapshot; OPEX ekranı canlı kaynağı izliyor | Aynı anda farklı tarihli giderler karşılaştırılabilir | Kaynak snapshot'ı/güncellik görünümü; yenileme politikası |

Bu ölçümler güncel kaynağın anlık fotoğrafıdır. Satır sayısına yapay üst sınır koymak veya her 200 satırda dosya bölmek çözüm değildir. Ayrım, bağımsız değişme nedenine göre yapılır.

## 2. Mimari karar: MVC, MVVM ve OOP nerede kullanılmalı?

### ADR-01 — Önerilen karar

**Durum:** Öneri. **Kapsam:** mevcut statik Astro + React planlama uygulaması. **Hedef:** iş hesabının metin/grafik/tablo düzenlemesinden korunması, açık değişiklik alanları, veri kaybına direnç.

| Yaklaşım | Bu projeye katkısı | Bedeli / yanlış kullanım | Karar |
|---|---|---|---|
| Klasik MVC'yi her yere uygulamak | Sunucu istek/yanıtı olan kısımda Controller sınırı yararlı olabilir | Statik React sayfalarına yapay Controller sınıfları eklemek | Frontend'in ana deseni değil; gelecekte backend kendi framework sözleşmesini izler |
| MVVM yaklaşımı | View ile sonuç/durum hazırlama ayrılır; aynı sonuç farklı kabukta gösterilir | Her alan için sınıf ve manuel çift yönlü binding kurmak | React'e uygun fonksiyon/hook temelli ViewModel olarak seç |
| OOP | Kaynak ömrü, adapter, transaction ve invariant kapsülleme | `BasePage`, `BaseChart`, `BaseRepository<T>` miras zincirleri | Yalnız somut ihtiyaçta; composition öncelikli |
| Saf fonksiyon çekirdeği | Hesap deterministik ve kolay test edilir | I/O'yu safmış gibi saklamak | Finans, komisyon, rütbe ve senaryo hesabında zorunlu |
| Modüler tek uygulama | Özellik sahipliği ve import sınırı; basit dağıtım | Tek dev ortak modüle geri dönmek | Ana organizasyon biçimi |
| Mikroservis / microfrontend | Gerçek bağımsız ekip/ölçek ihtiyacında anlamlı olabilir | Bugünkü kaynakta dağıtık state, sürüm ve deploy maliyeti | Mevcut sorun için ekleme |

**Seçim:** iş alanlarına göre modüler tek uygulama; dış etkiler sınırda; içeride saf iş kuralları; UI'de ViewModel ve mevcut master component'ler.

React'in state rehberi, türetilebilir veriyi tekrar state olarak tutmama ve çelişkili/tekrarlı state'ten kaçınmayı önerir. Buradaki ViewModel kararı bu ilkeyi uygulamak için projeye özgü tasarımdır; React'in zorunlu MVC/MVVM talebi değildir. [React state yapısı](https://react.dev/learn/choosing-the-state-structure)

### 2.1 OOP/SOLID kural seti

| İlke | Bu projedeki uygulanabilir kural | Yasaklanan gereksiz soyutlama |
|---|---|---|
| SRP | Hesap, kayıt ve çizim farklı değişme nedenleri; ayrı birimler | Her küçük yardımcı için sınıf |
| OCP | Yeni grafik türü kendi adapter/contract kaydıyla eklenir | Her alanı kapsayan sınırsız plugin platformu |
| LSP | Adapter aynı hata, eksik veri ve kayıt semantiğini yerine getirir | Memory adapter başarılı diye disk/network adapter'ı da başarılı varsaymak |
| ISP | Ekran ihtiyacı kadar sorgu/komut görür | Bütün şirket modelini her bileşene vermek |
| DIP | Use-case depolama/aralık/saat gibi gerçek dış sınırlara port üzerinden erişir | Bütün matematik fonksiyonlarını dependency injection container'a koymak |
| DRY | Aynı ticari bilgi bir kez tanımlanır | Benzer görünen ama farklı anlamdaki iki komisyon modelini birleştirmek |
| Encapsulation | ECharts instance, observer ve dispose bir runtime sahibindedir | Global mutable nesneyi bütün görünümlere açmak |
| Composition | Rol, politika, kapsam ve gösterim ayrı birleşir | Meslek/seviye başına miras alan sınıflar |

Örnek: `EChartsRuntime` sınıfı kaynak ömrünü yönettiği için anlamlı olabilir. `calculateCommission(inputs)` saf fonksiyonu için yalnız `new CommissionCalculator().calculate()` yazabilmek amacıyla sınıf eklenmez.

## 3. Katmanlar ve bağımlılık yönü

```text
Astro route / uygulama composition root
  ├─ Doğrulanmış içerik + page registry
  ├─ Adapter'ları use-case'lere bağlama
  └─ React feature shell
       ├─ View: render + semantik olaylar
       ├─ ViewModel: gösterime hazır veri + UI state + komutlar
       └─ Application/use-case: yükle, senaryo çöz, hesapla, kaydet
            ├─ Domain: saf hesap + invariant + kimlik/birim
            └─ Ports: dış veri/kayıt/saat sözleşmesi
                 ↑ implements
            Adapters: storage / Sheets / ileride korumalı API

ViewModel sonucu → tablo projeksiyonu
                 → grafik projeksiyonu → ECharts adapter/runtime
                 → mobil kayıt/karşılaştırma
                 → açıklama ve CSV
```

Oklar doğrudan izin verilen import/çağrı yönünü tarif eder. Domain React, Mantine, DOM, ECharts, fetch veya storage bilmez. View, hesap motorunu yeniden yazmaz. Adapter, UI bileşeni import etmez. Application somut adapter oluşturmaz; gerçek adapter composition root'ta bağlanır.

### 3.1 Önerilen dizin düzeni

Yeni klasörler yalnız ilgili dilim dönüştürülürken açılır; boş mimari iskelet üretme.

```text
src/
  pages/                         # mevcut Astro route'ları
  app/
    composition/                 # provider/adapter bağlama
    navigation/                  # page registry; sunum sırası ayrı
  features/
    finance/
      domain/                    # gelir, nakit; saf hesap
      application/               # senaryo çözme, sonuç üretme
      presentation/              # saf makeFinanceViewModel
      ui/                        # sayfa bölümleri ve React hook'ları
      contracts/                 # dış girdiler, sürümlü DTO
      index.ts                   # dar public API
    compensation/                # Applet motorları ve modeli
    partnership/                 # ortak türü/politika/Affilate
    organization/                # roller, hedefler, teslimler
    notes/                       # kişisel not use-case ve görünüm
  content/                       # tipli içerik/veri katalogları
  shared/
    domain/                      # gerçekten ortak Money, Ratio, Period
    ui/                          # Button, Field, DataTable, ChartFrame...
    presentation/                # sayı/birim/etiket sunumu
    infrastructure/              # genel adapter mekanikleri; iş kuralı yok
  adapters/
    persistence/                 # local/IndexedDB ve migration
    opex/                        # mevcut Sheets protokolü
    charts/                      # ECharts adapter + runtime
  styles/
    tokens.css                   # mevcut merkezi otorite
    base.css                     # reset, temel tipografi, odak katmanı

apps-script/                     # mevcut ayrı runtime korunur
tests/                           # sözleşme ve davranış testleri
docs/                            # ADR, değişiklik haritası ve katalog
```

Bu öneri bir monorepo zorunluluğu yaratmaz. `shared/domain` yalnız gerçekten aynı semantiği kullanan birkaç primitive taşır; şirketin bütün modeli burada toplanmaz. `utils`, `helpers`, `common`, `manager`, `engine` adıyla sorumluluğu belirsiz dev dosya oluşturma.

### 3.2 Uygulanacak import kuralları

| Kaynak katman | İzin verilen | Reddedilecek |
|---|---|---|
| Domain | Aynı domain, ortak saf primitive | React/Mantine/ECharts, browser API, storage, network, JSX |
| Application | Domain, port tipleri; diğer özelliğin dar public API'si | Başka özelliğin özel dosyasına erişim, UI import |
| Saf ViewModel | Application sonuç tipleri, saf presenter/format | fetch, localStorage, global mutable state, ECharts instance |
| UI hook/controller | Use-case, state ve enjekte edilmiş servis | Yeni finans formülü, doğrulanmamış payload'ı domain diye kullanma |
| View | ViewModel, yerel UI, shared UI | Kaynak JSON parse, network çağrısı, hesap kuralı |
| Shared UI | Semantik sunum tipleri/tokenlar | `features/*`, gerçek rol/marka/model verisi |
| Adapter | Port + vendor/runtime | Sayfa/view import |
| Composition root | Gereken katmanları birleştirme | Yeni iş kuralı veya ayrı hesap motoru |

Özellikler arası döngü yasaktır. Bir finans use-case'i birden fazla özelliği birleştirecekse orchestration katmanı dar public sonuçları tüketir. Barrel export ile bütün klasörü dışarı açmak sınır oluşturmaz. Type-only import'lar da sınır denetimine dahildir.

## 4. Veri modeli ve hesap sözleşmesi

### 4.1 Veri türlerini ayır

| Tür | Örnek | Yetkili kaynak / davranış |
|---|---|---|
| Yayın içeriği | Rol açıklaması, onaylı örnek politika | Versiyonlanan kaynak; kaynak/karar durumu |
| İş girdisi | Fiyat, oran, başlangıç, kapasite | Doğrulanmış aktif senaryo |
| Kaynak snapshot'ı | Sheets gider planı | Kaynak + alınma zamanı + kaynak sürümü |
| Hesap sonucu | Gelir serisi, komisyon, nakit | Saf motordan türetilir; ikinci bağımsız state değildir |
| Görünüm durumu | Açık accordion, seçili kolon | İlgili UI state; iş sonucu değildir |
| Kalıcı kullanıcı çalışması | Adlandırılmış senaryo, not | Sürümlü kalıcı depo + kurtarma/yedek |
| Geçici input metni | Kullanıcının henüz tamamlamadığı `12,` | Draft string; doğrulanmadan sayı/0 yapılmaz |

Türler yalnız TypeScript annotation değildir. URL, localStorage, dosya import'u ve HTTP yanıtı `unknown` kabul edilir; çalışma zamanında doğrulanır. `as Model` doğrulama değildir. Formdaki min/max kontrolü storage veya URL girdisini korumaz.

### 4.2 Saf hesap için MUST kuralları

1. Aynı normalize edilmiş girdi + model sürümü + kaynak snapshot'ı aynı sonucu verir.
2. Saat, tarih, kur ve rastgele kimlik dışarıdan verilir; domain içinde `Date.now()`, `Math.random()` ve ağ erişimi yoktur.
3. Input mutate edilmez; çıktı immutable kabul edilir. Paylaşılan varsayılan nesneye yazılmaz.
4. Para birimi ve dönem olmadan toplama/karşılaştırma yapılmaz. Aynı `number` tipi her tutarın aynı anlamda olduğu iddiasına dönüşmez.
5. `0`, bilinmiyor, kapsam dışı ve hesaplanamıyor farklı sonuç durumlarıdır. `NaN`/Infinity UI'ye ulaşmaz.
6. Oran gösterimde `%15`, hesapta örneğin `0.15` olarak tek kuralla temsil edilir. Dönüşüm UI/adapter sınırında bir kez olur. Yüzde puan ve yüzde değişim ayrılır.
7. Yuvarlama noktası politika olarak tanımlanır. Fatura/hakediş mutabakatında kuruşlar korunur; geniş ufuklu tahminde kullanılan hassasiyet ayrıca belgelenir.
8. Türetilmiş sonuç etiketli para metninden geri parse edilmez. Filtre/sıralama ham değere göre yapılır.
9. İş kuralı değişikliği `modelVersion` veya `policyVersion` değişimini gerektirip gerektirmediğiyle değerlendirilir. Sadece UI düzeltmesi model sürümünü değiştirmez.

### 4.3 Para, tarih ve bilinmeyen değer

Parasal hakediş için varsayılan öneri: küçük para birimini temsil eden güvenli tamsayı + para birimi; ara oran/kur hesabı için açık hassasiyet ve yuvarlama. Güvenli tamsayı aralığı aşılabilecek veya çok aşamalı decimal kesinlik gerektiren kapsamda tek bir decimal çözümü seçilir; rastgele kütüphaneler eklenmez. Mevcut `number` hesaplarını kontrolsüzce topluca çevirmek yerine önce bağımsız beklenen örnekler ve fark raporu hazırlanır.

Tarih sınıfları ayrılır: takvim günü `YYYY-MM-DD`, ay `YYYY-MM`, an ISO timestamp + zaman dilimi politikası. Yerel gün anlamındaki değer UTC dönüşümüyle önceki güne kaymamalıdır. Ay hesabını sabit 30 günle yapma. Mevcut tarih yardımcıları gerçek iş takvimi testleriyle taşınır.

```ts
// Hedef sözleşme örneği; bu tipler henüz uygulanmış değildir.
type Quantity<T> =
  | { kind: 'known'; value: T }
  | { kind: 'unknown'; reason: string }
  | { kind: 'not-applicable'; reason: string };

type Money = Readonly<{ minor: number; currency: 'TRY' | 'EUR' | 'USD' }>;

type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; field?: string; messageKey: string } };
```

`Money` constructor/validator'ı `Number.isSafeInteger`, izin verilen para birimi ve işleme özgü negatif tutar koşulunu denetler. Type alias tek başına invariant sağlamaz. İade/borç gibi geçerli negatif tutarları genel “negatif yasak” kuralıyla bozma.

### 4.4 Tek çözülmüş senaryo

Varsayılan parametre, preset, yerel override ve URL override dağınık useEffect'lerde birleştirilmez. Tek saf `resolveScenario` hangi kaynağın öncelikli olduğunu belirler. Önerilen sıra: doğrulanmış tam paylaşım snapshot'ı → bu senaryonun açık değişiklikleri → referans verilen baz/preset sürümü. Eski URL biçimleri adapter'da migrate edilir. Geçersiz alanlar sessizce “0” olmaz.

Snapshot asgari alanları: `id`, `revision`, `schemaVersion`, `modelVersion`, `baselineRef`, marka/program, dönem, para/kur politikası, normalize edilmiş **etkin girdiler**, kaynak snapshot referansları, oluşturma/güncelleme zamanı. Hash deterministik girdinin kimliği içindir; yetki veya doğruluk kanıtı değildir.

Gelir, nakit, personel katkısı, tablo, grafik ve CSV aynı snapshot kimliğine bağlanır. Aynı preset adı farklı özel girdileri gizleyemez. Gerçek kaynak eksikse “kısmi hesap” açıklanır. Yeni varsayılan yayımlandığında eski adlandırılmış senaryo sessizce yeni varsayılanları devralmaz.

## 5. ViewModel: metin, tablo ve grafik aynı gerçeği göstermeli

### 5.1 Sorumluluk

Saf `makeRevenueViewModel(result, content, presentationContext)` iş sonucu üzerinden gösterim verisi hazırlar. `useRevenueScreen` gibi hook ise yükleme, kullanıcı komutu ve seçimi bağlar. “ViewModel” adı altında network/storage/hesap/JSX'i tekrar tek dosyada toplama.

ViewModel bir HTML metin deposu değildir. Birim, dönem, raw değer, durum, kaynak ve kimlik korunur. Metin yalnız uygun sınırda biçimlenir. `ReactNode` içeren hücre render fonksiyonu UI katmanında kalır; kalıcı veriye React bileşeni kaydedilmez.

### 5.2 Örnek sözleşme

```ts
// Kavramsal arayüz; tam uygulama değildir.
type RevenueRow = Readonly<{
  id: string;
  period: string;
  gross: Quantity<Money>;
  sourceSnapshotId: string;
}>;

type RevenueViewModel = Readonly<{
  scenarioId: string;
  scenarioRevision: number;
  modelVersion: string;
  rows: readonly RevenueRow[];
  sourceState: 'ready' | 'stale' | 'partial' | 'unavailable';
  changedInputs: readonly string[];
}>;
```

Tablo `rows` üzerinden hücre üretir; grafik aynı `rows` üzerinden sayısal seri üretir; mobil kabuk aynı kayıtları gösterir; açıklama aynı değerden cümle kurar. Grafik ve tablo ayrı finans formülü çalıştırmaz. Dönem sonu nakit kümülatif tekrar toplanmaz; her metrikte toplama yöntemi ayrı tanımlanır.

### 5.3 React state ve yan etkiler

- Reducer/updater hesap yapar ve yeni state döndürür; storage yazmaz, başka state setter çağırmaz.
- Kaydetme akışı sıraya alınmış command veya kontrollü effect ile yürür. Kullanıcıya “kaydedildi” yalnız ilgili revision gerçekten yazıldıysa gösterilir.
- Effect çözümünde hydrate tamamlanmadan varsayılanı diske yazma. Yükleme ve yazma yarışı test edilir; StrictMode tekrarları yan etkiyi çoğaltmamalıdır.
- Sonuçları useEffect ile ikinci state'e kopyalama; selector/pure ViewModel ile türet. Memoization doğruluk mekanizması değildir.
- Tek sayfalık seçim local state'te kalabilir. Özellikler arası paylaşılan senaryo açık store/public API üzerinden yönetilir. Mevcut Context'i yalnız moda uyarak Redux/Zustand ile değiştirme.
- Astro adaları ayrı React context sınırlarıdır. Mevcut tek React ağacı/provider yaklaşımını doğrulamasız bölme. İnteraktif ve statik ayrım yalnız veri/context/ilk yük ölçümüyle yapılır. [Astro islands](https://docs.astro.build/en/concepts/islands/)

React render/updater saflığı, yan etkilerin render dışında tutulması ve immutable girdiler resmi davranış sözleşmeleriyle değerlendirilmelidir. A05'in çözümü için persistence'ı updater'dan ayırmak bu nedenle önemlidir. [React saflık kuralları](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

## 6. Master component sözleşmeleri: bir düzeltme nerelere yayılabilir?

Bir master component, yalnız tekrar kullanılan JSX değildir. **Girdi anlamı, durumları, erişilebilirliği, uyarlanan görünümü ve testleri birlikte tanımlanmış bir sözleşmedir.** Ortak bileşenin içinden belirli sayfanın iş kuralı okunmaz. Tek bir `UniversalWidget` içine tablo, grafik, form ve rapor motoru toplanmaz.

### 6.1 Sözleşme kataloğu

Her master için tek katalog kaydı: `componentId`, public prop sözleşmesi, semantik amaç, izin verilen varyantlar, desteklenen durumlar, tüketiciler, kabul testi kimlikleri, görsel örnekler ve değişiklik riski. Bu bir runtime plugin sistemi değil, doğrulanabilir geliştirme envanteridir.

| Master / sınır | Sabit tutulacak anlam | Değişiklikte zorunlu kanıt |
|---|---|---|
| PageShell / AppFrame | Sayfa kimliği, başlık hiyerarşisi, ana görev, breadcrumb | Navigasyon/geri dönüş; 320 px; odak; URL korunması |
| Field | Etiket, birim, draft değer, geçerli değer, yardım, hata | Virgüllü sayı, boş/geçersiz değer, blur/submit davranışı; kayıp girdi yok |
| ChoiceGroup | Aynı türden seçenekler, seçili değer, gruptaki anlam | Görünür seçenek yalnız değer; grup etiketi anlamı sağlar; klavye modeli |
| DataTable | Kayıt kimliği, ham değer, hücre anlamı, toplama türü | Masaüstü/mobil/CSV eşitliği; sıralama; boş/eksik kayıt |
| RecordAccordion | Aynı kaydın özet ve ayrıntısı | Kritik değer kapalı özette; açık panel kimliği; odak ve durum korunması |
| ComparisonView | Seçilen kayıtların aynı ölçütle karşılaştırılması | Kayıt/ölçüt ekseni değişince anlam ve birim korunması |
| ChartFrame | Başlık, birim, dönem, kaynak, metin eşdeğeri, durum | Grafiksiz erişim; resize; hata/boş durum; açıklama eşitliği |
| Metric / ResultSummary | Değerin ne olduğu, zaman/kapsam ve kaynak durumu | Tahmin/gerçekleşen ayrımı; negatif/sıfır/bilinmiyor ayrımı |
| SaveStatus | Hangi revision'ın nerede saklandığı | Başarısız yazımda başarı iddiası yok; son başarılı sürüm açık |
| SourceStatus | Kaynak, alınma zamanı, geçerlilik ve kapsam | Eski veri görünür; yenileme başarısızsa mevcut veri kaybolmaz |

Component API'sinde boolean çoğalması yerine birbirini dışlayan durumları union ile tanımla. `loading=true`, `error=true`, `empty=true` aynı anda mümkün olmamalı; gerekiyorsa “eski veri + yenileme hatası” ayrı, geçerli bir durumdur. Durumların render edilmesi exhaustive olmalı; yeni durum sessiz varsayılan kola düşmemeli.

### 6.2 Tablo, mobil kayıt ve dışa aktarma

**Tek veri, farklı görev sunumu.** Mevcut `DataTable`'ın `satir`, `sutun`, `matris` profillerini kaybetmeden sözleşme güçlendirilir.

- Kayıt anahtarı satır sırası değildir; filtre/sıralamada değişmeyen iş kimliğidir.
- Kolonun iş kimliği, görünür etiketi, ham değer seçicisi, birimi ve formatı ayrıdır. `ReactNode` yalnız son render aşamasındadır.
- Kolon metadata'sı; özet önceliği, karşılaştırılabilirlik, toplama yöntemi, boş değer gösterimi ve düzenlenebilirliği açık belirtir.
- Mobil görünüm desktop JSX'ini okuyup metin çıkarmaya dayanmaz; aynı semantik hücre verisini tüketir. CSS ile gizlenen ayrı kopyalara bağımsız hesap konulmaz.
- CSV/dışa aktarma DOM kazımaz; aynı filtre, sıralama ve snapshot'tan üretilir. Kullanıcının istediği “görünen satırlar” ile “tüm kayıtlar” açık seçeneklerdir.
- Türkçe yerel sayı gösterimi, CSV'nin aktarım biçimi ve makine JSON'u ayrı formatlardır. CSV hücreleri hesap tablosunda formül olarak yorumlanabilecek metinler için açık güvenli aktarım politikası kullanır.
- Satır başına ayrıntı okuma görevi 320 px'te accordion'a dönüşür. Kritik karşılaştırma görevi için seçilmiş birkaç kayıt/ölçüt gösterilir. Gerçek iki boyutlu matris zorunluysa okunabilir minimum genişliği koruyan **yalnız kapsayıcı içi kaydırma** belgeli istisnadır; tüm sayfa taşmaz.
- Görünüm değişirken filtre, seçim, açık kayıt ve draft alanlar korunur. Odaktaki öğe kaldırılacaksa anlamlı karşılığına kontrollü odak taşınır.
- Açıklama metni doğal kelime aralarından sarılır; model adı kelime ortasından parçalanmaz; sığdırmak için font küçültülmez.

“Her tabloyu accordion yap” da “her tabloyu yatay kaydır” da evrensel kural değildir. Görev tipi ve bilginin ilişkisi belirleyicidir; bu projede mobil kayıt okumada accordion varsayılandır.

### 6.3 ECharts için iki ayrı sınır

Hedef akış:

```text
domain sonucu → ViewModel serileri → tipli ChartSpec
  → saf makeOption(spec, renderContext) → ECharts runtime

renderContext = tema tokenları + ölçü + locale + motion tercihi
runtime       = load + init + update + resize + dispose + yarış denetimi
```

1. `ChartSpec` iş verisini taşıyan seri/eksen/kapsam sözleşmesidir. Vendor seçeneği domain'e sızmaz. `RoleKey`/`OpexTone` gibi alan kavramları feature adapter'da semantik seri/renk tokenına çevrilir; ortak renderer rol kataloğunu import etmez.
2. Her `kind` için küçük, saf seçenek üreticisi vardır. Renderer registry ve `assertNever`/exhaustive eşleme, yeni türün uygulanmadan derlenmesini veya testten geçmesini engeller.
3. `Record<string, unknown>` yerine kurulu ECharts paketinin desteklediği seçenek tipleri adapter sınırında kullanılır. Type cast ile hatayı susturma; gerekli dar adapter tipi belgelenir.
4. `series.id`, `dataset.id` kullanılıyorsa onun kimliği ve kayıt kimlikleri anlamdan türetilir. İsim/etiket veya sıra kimlik değildir. Filtrede kaybolup geri gelen seri yanlış renge/animasyona bağlanmamalıdır.
5. Aynı ChartSpec'in metinsel özeti, grafik verisi ve tablo karşılığı; **dönem, birim, sıralama, veri kaynağı ve eksik değer** bakımından eşit olmalıdır. Gösterim yuvarlaması gerçek farkı gizleyemez.
6. Güncelleme “son istek kazanır” generation/revision denetimi taşır. Eski async import/font/yükleme tamamlanınca yeni spec'in üstüne çizemez. Unmount ve StrictMode akışı tekrar instance/observer bırakmaz.
7. Boyut sıfır, gizli sekme, açılan accordion, tema/font değişimi ve yeniden boyutlandırma yaşam döngüsü test edilir. Resize saf hesap motorunu yeniden çalıştırmaz.
8. Tooltip yalnız hover ile erişilen tek bilgi kaynağı değildir. Klavye ve dokunma için metin/veri eşdeğeri sağlanır; grafik resmi açıklaması gerçek sonuçtan üretilir.
9. Grafik hatası sayfa hesap sonucunu silmez. Tipli hata + tablo/metin alternatifi kalır; yanlış grafiği son başarılı grafikmiş gibi göstermeme kuralı vardır.
10. Görsel değişiklik ile hesap değişikliği aynı PR'da zorunlu olmadıkça birleşmez. Seri değerleri sabitken stil değişimi, stil sabitken değer değişimi ayrı doğrulanabilir.

ECharts `dataset`, veriyle seçenek konfigürasyonunu ayırmak ve veriyi yeniden kullanmak için uygun bir mekanizmadır; bütün grafik tiplerine zorunlu değildir. Mevcut modüler kurulum `DatasetComponent` içermediğinden, seçilirse kayıt ve bundle etkisi ayrıca doğrulanır. Tree gibi özel veri yapıları kendi adapter'ında kalabilir. [ECharts veri kümesi](https://echarts.apache.org/handbook/en/concepts/dataset/)

### 6.4 Metin de bir yazılım sözleşmesidir

`ifade.md` ve `contents.md` dil/içerik rehberidir; şu sınırlar onların uygulamada bozulmasını engeller:

- Kritik iş terimlerine sabit kimlik ver: `invoiceAmount`, `earnedCommission`, `paidCommission` ayrı kavramlardır. Hepsini “kazanç” diye değiştirme.
- Kısa seçenek etiketi, açıklayıcı grup etiketi ve yardım metni ayrı alanlardır. `%100`, `399 €`, `Mart 2027` seçeneklerine “Senaryonun”/“parametre” eklenmez. Varsayılan olma bilgisi seçenek dışındaki açıklamada/metadata'da tutulur.
- Sabit açıklama ile değişken sonuç cümlesi ayrıdır. Oran değiştiğinde metindeki eski `%15` kalmamalıdır; sonuç cümlesi aynı normalize edilmiş girdiden türetilir.
- Kullanıcının değiştirilebilir istediği bütün komisyon yüzdeleri politika girdisidir. İçerik dosyasındaki örnek/default oran iş kuralı olarak ikinci kez hardcode edilmez.
- Metin anahtarı kimliktir; Türkçe görünür metin test locator'ının veya kayıt ilişkisinin tek anahtarı olamaz. Erişilebilir adla testler yine kullanıcı davranışını doğrular; iş kimliği gerektiğinde ayrıca kullanılır.
- Cümle parçası birleştirerek Türkçe çekim üretme. Tam cümle şablonu ve adlandırılmış parametreler kullan; birim ve özne açık kalır. Para sembolü/tarih/parantez gibi ayrıntılar ortak formatter'dan gelir.
- Sadece kısaltmak için anlamı silme. Etiketin ideal uzunluğu karakter sayısıyla tek başına tanımlanmaz; gerçek font, 320 px, uzun sayı ve farklı durumla sınanır.
- Kullanıcı metni HTML olarak çalıştırılmaz. Zengin içerik gerekirse izin verilen şema/render bileşenleriyle işlenir; kontrolsüz HTML bir kolaylık çözümü değildir.

İçerik çok sayfalı editoryal belgeye dönüşürse Astro Content Collections tür/şema doğrulamalı içerik için değerlendirilebilir. Bu, kullanıcı senaryosunun kalıcı deposu veya hesap motorunun yerine geçmez. Mevcut TS kataloglarını sırf farklı format kullanmak için taşıma. [Astro içerik koleksiyonları](https://docs.astro.build/en/guides/content-collections/)

### 6.5 CSS ve tasarım token sınırı

`tokens.css` semantik değerlerin tek otoritesi olarak korunur. Mantine theme ve ECharts tema context'i aynı tokenları tüketir; üç ayrı renk/font tablosu oluşturulmaz. Ortak stil kaynağı değişince bütün tüketiciler etki haritasında görünür.

Global alanda reset, temel tipografi, merkezi odak/hareket ve gerçekten ortak semantik yardımcılar kalır. Feature stilleri yerel kapsama alınır; mevcut build içinde CSS Modules veya açık sınıf kapsamı yeterlidir. Dosyanın sonuna daha yüksek specificity ile yeni override eklemek kalıcı onarım sayılmaz. Feature, başka feature'ın iç DOM sınıfına stil yazamaz. Portal açılır panelleri de marka/token sözleşmesine dahildir.

Outfit ve minimum 14 CSS px korunur; projede açıkça tanımlı OPEX Roboto/15 px istisnası belgeli kalır. Yeni istisna kendiliğinden türetilmez. Pill/switch gibi izinli roller dışında radius `0` kalır. Dar ekrana sığdırmak için metin veya etkileşim alanı küçültülmez.

Normal temalarda çevreleyen odak halkası kullanılmaz. Merkezi giriş modu ve `:focus-visible` ile tek, çevrelemeyen görünür klavye göstergesi korunur; `forced-colors` istisnası ortak kullanıcı politikasındaki sınırlarda kalır. Hareket merkezi simetrik Cubic tokenıyla, açılış/kapanış için pozitif süreyle uygulanır; reduced-motion ve anında semantik durum güncellemesi korunur. Belge yazmak bunların tarayıcıda uygulandığını kanıtlamaz.

### 6.6 Uyarlanan kabuk ve kaynak teslimi

Yerleşim alanı, giriş yöntemi, hover, kullanıcı tercihleri ve kaynak koşulları ayrı eksenlerdir. Tek `isMobile` bayrağına klavye, veri ve yükleme politikasını bağlama. Mevcut ortak kabuk yeterliyse ayrı telefon/masaüstü uygulamaları üretme; görev gerçekten değişiyorsa ortak state/domain üzerinde ayrı sunum kabuğu kullan. Aynı anda gizlenmiş iki etkileşimli kopya üretip duplicate ID, odak ve state ayrışmasına yol açma.

İsteğe bağlı ağır grafik/editör kodunu gerektiğinde yükle; `display:none` indirmeme kanıtı değildir. Ayrı kabuk kaynakları varsa üretim build manifesti → özellik/kabuk eşlemesini çıkar. Soğuk, izole test context'inde navigasyon öncesinden başlayan istekleri, preload/prefetch ve varsa service worker davranışını gözle; paylaşılan çekirdeği gereksiz özel kaynakla karıştırma. Resize/rota değişiminde yeni gerekli kaynak yüklenebilir, önceden indirilen byte geri alınmış sayılmaz. TypeScript/JSX kaynakları mevcut build zincirinde dönüştürülür; dev sunucusu kanıtı üretim artifact kanıtının yerine geçmez.

Bu kurallar için yeni örnek byte sınırı icat etme; projenin ölçülmüş tek bütçe setini kullan. Kaynak izolasyonu, yerleşim, etkileşim ve state sürekliliği ayrı kontrol sonuçlarıdır.

## 7. Sürdürülebilir veri: kayıt, kurtarma ve yeniden üretim

### 7.1 Veriyi önemine göre sakla

| Veri | Önerilen saklama | Dayanıklılık sınırı |
|---|---|---|
| Yayınlanan genel katalog/politika örnekleri | Git'te sürümlü içerik | İncelenebilir geçmiş; kişisel/gerçek hassas veri koyma |
| Görünüm tercihi | Küçük localStorage/sessionStorage kayıtları | Silinebilir tercih; kaybı iş belgesini kaybettirmemeli |
| Değerli yerel senaryo/not | Şemalı IndexedDB document store + export/import | Tarayıcı deposu tek başına yedek değildir |
| Dış kaynağın hesapta kullanılan hali | Snapshot + kaynak/sürüm/zaman | Kaynak değişse bile hangi veriyle hesaplandığı izlenir |
| Birden fazla kişinin paylaştığı gerçek çalışma | Yetkili API + sunucuda transactional veri deposu | Ayrı kapsam/kimlik/backup/restore projesi gerekir |
| OPEX Sheets verisi | Mevcut kaynağın açık yetki ve snapshot sözleşmesi | Google Sheets tüm uygulamanın sınırsız transaction deposu sayılmaz |

İlk adım backend kurmak değildir. Bugünkü yerel ihtiyacı adapter sınırı, doğrulama ve kurtarmayla güçlendir. Paylaşımlı, çok cihazlı, denetlenebilir gerçek kayıt gereksinimi doğrulandığında aynı portun korumalı sunucu adapter'ı planlanır. Public kaynak kod, gerçek kayıtları public yapma talimatı değildir.

Tarayıcı depolaması varsayılan olarak best-effort olabilir; kota, kullanıcı silmesi, özel gezinme ve tahliye koşulları vardır. `navigator.storage.persist()` talebi de harici yedek değildir. Kullanıcıya yalnız bu cihazda saklandığını açıkça söyle; değerli çalışmanın sürümlü dosya olarak dışa aktarılmasını ve yeniden yüklenmesini doğrula. [Tarayıcı depolama sınırları](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

### 7.2 Kayıt zarfı ve repository portu

Her değerli belge en az şunları taşır: `documentId`, `kind`, `schemaVersion`, `revision`, `createdAt`, `updatedAt`, `payload`. Senaryo ayrıca `modelVersion`, `baselineRef`, etkin girdiler ve kullandığı kaynak snapshot kimliklerini taşır. Kimlik/sürüm alanlarını kullanıcı tarafından girilen serbest metinlerle karıştırma.

Port, işin ihtiyacı kadar dardır: `load(id)`, `save(document, expectedRevision)`, gerektiğinde `list()` ve `export(id)`. Generic CRUD repository her kaydı aynı anlama zorlamaz. Sonuçlar en az `saved`, `conflict`, `invalid`, `unavailable`, `quota-exceeded`, `unsupported-version` durumlarını ayırır. Bir `false` bütün sorunları açıklamak için yeterli değildir.

**IndexedDB transaction'ında** beklenen revision okunur, eşleşirse yazılır, revision artırılır. localStorage üzerinde “önce oku, sonra yaz” atomik compare-and-swap değildir; yarış güvenliymiş gibi sunulmaz. Sunucu adapter'ında aynı sözleşme conditional write/transaction ile karşılanır. Sekme bildirimleri değişikliği duyurur, çatışmayı çözmez.

### 7.3 Geçiş protokolü

1. Ham veriyi oku; boyut/tür/sürüm denetimini yap. Ham kayıt henüz değiştirilmez.
2. Bozuk veya desteklenmeyen ileri sürümse mevcut veri korunur. Otomatik varsayılana dönüp üstüne yazma. Kurtarma/dışa aktarma ve açık kullanıcı kararı seçenekleri sun.
3. Desteklenen eski sürümse saf, sıralı `v1→v2→v3` dönüşümlerini çalıştır. Her adımın giriş/çıkış şeması doğrulanır. Migration saat/ağ/rasgeleliğe bağımlı değildir; ihtiyaç duyduğu bağlam açık verilir.
4. Yeni verinin referans bütünlüğünü, sayı/birim koşullarını ve beklenen kayıt adedini doğrula. Bilinmeyen alanı atmak değerli veri kaybıysa sakla veya açık raporla.
5. Aynı veri tabanında atomik transaction ile eski kopyayı/recovery kaydını ve yeni belgeyi güvenceye al. localStorage→IndexedDB geçişinde iki depo atomik değildir: kaynak anahtar korunur, idempotent aktarım kimliği ve tamamlanma işareti kullanılır; doğrulamadan kaynak silinmez.
6. Başarılı yazım sonrası tekrar oku ve bütünlük kontrolü yap. UI ilgili revision'ın kaydedildiğini ancak bundan sonra bildirir.
7. Kota/yazım hatası mevcut son başarılı kaydı silmez; düzenleme hafızada korunur, dışa aktarılabilir ve “kaydedilmedi” görünür kalır.

Migration test fixture'ları en eski desteklenen sürümü, kısmi bozulmayı, gelecekteki sürümü ve yarıda kesilen geçişi kapsar. Recovery kayıtları için saklama/temizleme politikası vardır; sonsuz kopya ile kotayı doldurma. Hiç denenmemiş restore işlemi “yedekleme var” kabul edilmez.

**Eski yazıcıların geçişi ayrı bir önkoşuldur.** Açık kalmış eski uygulama sekmesi migration sonrasında localStorage'a yazabilir. IndexedDB revision kontrolü o yazımı görmez; `BroadcastChannel`/`storage` bildirimi veya tamamlandı işareti eski kodu kendiliğinden durdurmaz.

Tercih edilen geçiş iki aşamalıdır: önce yazıcıların protokol sürümünü/aktif depo işaretini denetlediği uyumluluk sürümü; sonra koordine edilmiş depo geçişi. Bu protokolü bilmeyen eski sekmeler varsa bunların kapanması/yenilenmesi geçiş koşuludur. Koşul sağlanamıyorsa otomatik kesin geçiş ve veri kaybı olmayacağı vaadi verilmez; recovery/export yolu korunur.

Aktarım anındaki ham kaynak kopyası ve digest saklanır. Geçiş sırasında, sonraki açılışta ve yeni uygulamanın kayıt akışında eski kaynak değişimi kontrol edilir. Değişmiş kaynak yeni depoya otomatik basılmaz; ayrı recovery adayına alınır, kullanıcı taslağı ve yeni depo sürümüyle uzlaştırılır. Gecikmiş yazımın **son görünen hali** kurtarılabilir; protokolsüz eski yazıcıların kendi aralarında ezdiği ara sürümler geriye dönük garanti edilemez. Kaynağın hemen silinmemesi ve kullanıcıya aktarılan sınır bu nedenle zorunludur.

### 7.4 Eski senaryoyu yeniden açmak ne demek?

Üç davranışı ayrı tanımla:

- **Tarihsel görüntü:** kaydedildiği zamanki sonuç, girdi ve kaynak sürümünü gösterir. Saklanan sonuç, provenance'lı bir artifact'tır; güncel hesapla aynı şey değildir.
- **Aynı sürümle yeniden hesap:** ilgili model/baseline/kaynak sürümleri gerçekten mevcutsa mümkündür. Yalnız `modelVersion` etiketini saklamak eski motoru çalıştırmaz. Desteklenen motor sürümleri veya yeniden üretilebilir eski artifact politikası gerekir.
- **Güncel modele taşı:** kullanıcıya değişen varsayım/sonuç farkını gösterir; yeni revision/clone üretir. Tarihsel çalışma sessizce değişmez.

İlk uygulanacak ürün kapsamı açık seçilir. Eski motoru tutmayacaksak aynı sürümle yeniden hesaplama vaat edilmez; tarihsel artifact + açık güncelleme yeterli olabilir. UI düzenleme hakkı, bu üç davranışı birbirine karıştırmaz.

### 7.5 Eşzamanlılık ve silme

İki sekme aynı revision'ı düzenlediğinde ikinci yazım otomatik ezmez. Kullanıcıya disk sürümü, kendi taslağı ve değişen alanlar sunulur; kopya kaydetme veya açık birleştirme yapılır. Komisyon/dönem gibi ilişkili alanlarda alan bazında otomatik merge güvenli varsayılmaz.

Not/listelerde referans bütünlüğü korunur. Liste silmenin notlara etkisi açık politika olur; yanlışlıkla bağlı bütün notlar silinmez. Silme/geri alma retention'ı kaynak, ürün kapsamı ve kullanıcı kararıyla tanımlanır. Kişisel kayıtları hata loguna veya Git fixture'ına kopyalama.

### 7.6 OPEX ve Apps Script sınırı

Mevcut `parseReply`, `OPEX_SCHEMA`, motor fixture'ları ve paketleme yolu korunur. Mevcut uyumluluk davranışı karakterizasyon testine alınmadan yeniden yazılmaz.

- DTO protokol sürümü, kaynak snapshot kimliği ve timestamp ayrı alanlardır; frontend build sürümü ile karıştırılmaz.
- Frontend adapter DTO'yu doğrular ve uygulama modeline çevirir. API field adları bütün görünümlere yayılmaz.
- Apps Script'teki motor frontend'e ikinci kez kopyalanmaz. Gerçek motor fixture'ları ve protokol sözleşme testleri korunur; hesap sahibinin kim olduğu alan bazında açık olur.
- Ağ kopması, timeout, eski/eksik cevap, geçersiz yanıt ve geç gelen önceki yanıt ayrı durumdur. Yenileme son başarılı snapshot'ı anlamsızca silmez.
- `useOpexOnce` ve canlı OPEX görünümü aynı anda farklı snapshot kullanabilir; her tüketicide kaynak tarihi görünür, karşılaştırma aynı snapshot'a sabitlenebilir.
- Node testleri Apps Script servisleri, izinleri veya gerçek dağıtımın doğrulandığı anlamına gelmez. Canlı servis değişikliği ayrı onay/kapsamla yürütülür.

### 7.7 Gerçek güvenlik sınırı

`giris.ts` içindeki istemci görünüm kapısı sunucu yetkilendirmesi değildir. Hassas veri client bundle/public dosyada bulunuyorsa görünümü kapatmak erişimi korumaz. Tarayıcıya gömülü anahtar/özet gerçek sır değildir.

Gerçek kişisel/finansal kayıt için kimlik ve kapsam kontrolü verinin döndüğü sunucuda uygulanır. Mevcut statik Pages dağıtımı genel içerik için sürdürülebilir; ayrı korumalı veri API'si ancak gerçek ihtiyaç kapsamında eklenir. `.env` değerinin frontend bundle'a aktarılması onu gizli yapmaz. Repo public kalabilir; veri ve servis erişimi ayrıca korunur. Bu belge güvenlik testi veya canlı erişim doğrulaması yapıldığı iddiası taşımaz.

## 8. Teknoloji envanteri: eksik olan ve eklenmemesi gereken

### 8.1 Mevcut yığını koru

| Karar | Gerekçe / tetikleyici | Önce yapılacak |
|---|---|---|
| Astro'yu koru | Statik route, içerik ve seçili etkileşim mevcut amaca uygun | Provider/adalar ve bundle etki haritası |
| React'i koru | İnteraktif simülasyon ve formlar için mevcut yatırım | State sahipliği, pure updater, ViewModel sınırı |
| Mantine'i koru | Ortak erişilebilir UI ailesi mevcut | Proje tokenları/variant sözleşmesi; ikinci UI kit ekleme |
| ECharts'ı koru | Veri görselleştirme türleri ve mevcut yatırım | Tipli adapter/runtime ayrımı; paralel grafik kütüphanesi ekleme |
| TypeScript'i güçlendir | Build-time sözleşme zaten var | `noUncheckedIndexedAccess`, sonra `exactOptionalPropertyTypes` ve gerekli override kuralları; küçük dilimlerle |
| Runtime validation ekle | JSON, URL, storage ve ağ type annotation ile korunmuyor | Bir şema yaklaşımı seç; Zod kullanılacaksa doğrudan bağımlılık ve paket uyumu |
| Mimari lint / import kapısı ekle | Yazılı katman sınırı tek başına yaptırım değil | AST/type çözümü; alias ve type import dahil; negatif fixture |
| Formatter/lint düzenini belirle | Mevcut scriptlerde tam standartlaştırma yok | Tek araç seti, değişen dosyaya odak; tüm repo format PR'sını iş değişikliğinden ayır |
| Değerli yerel kayıt deposunu güçlendir | Not/senaryo recovery ve transaction ihtiyacı | Sürüm/migration/export sözleşmesi; sonra IndexedDB adapter |
| Component fixture sayfası/kataloğu kur | Ortak durumları sayfa sayfa aramak maliyetli | Mevcut Astro/React içinde test fixture'ı; Storybook ancak ayrı dokümantasyon ihtiyacı varsa |
| Görsel regresyon ekle | Mevcut davranış testleri pixel referansı sağlamıyor | Az sayıda kritik master durumu; sabit ortam; insan fark incelemesi |
| İçerik registry/şeması kur | Aynı bilgi farklı sayfalarda farklılaşabiliyor | `contents.md` sahiplikleri + tipli içerik/parametre ayrımı |

`noUncheckedIndexedAccess`, index üzerinden erişilen değerlerin eksik olabileceğini tipe yansıtır. Yeni hataları `!`, `as` veya `?? 0` ile topluca susturmak bu kontrolün amacını bozar; alanın gerçekten eksik olabilmesini modelle. [TypeScript index erişimi](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html)

### 8.2 Bugünkü soruna çözüm olmayan ek yükler

- Redux/Zustand: store sahibi ve çapraz özellik ihtiyacı netleşmeden yeni global state katmanı ekleme. Context'in geniş güncellemesi selector/ayrım ve ölçümle önce değerlendirilir.
- React Query benzeri cache: çok endpoint, ortak invalidation ve retry ihtiyacı oluşursa seç. Bir endpoint'in snapshot politikasını açıklamadan cache kütüphanesi eklemek yeterli değildir.
- ORM/veritabanı: yalnız statik içerik dosyaları için gerekmez. Paylaşılan gerçek kayıt, transactional sunucu ve operasyon sahibi gerektirirse ayrı karar ver.
- CMS: editör iş akışı, onay ve çoklu yazar ihtiyacı varsa değerlendir. Her metni CMS'e taşımak domain tutarlılığını çözmez.
- Monorepo, microfrontend, mikroservis, event sourcing, CQRS, DI container: somut bağımsız dağıtım/ölçek/geçmiş yeniden oynatma ihtiyacı yoksa ekleme.
- İkinci tasarım sistemi, Tailwind + CSS-in-JS + global CSS karışımı, alternatif grafik motoru: aynı sorumluluğun üç otoritesini üretme.
- Yalnız sayıyı yükselten unit testler ve her prop için wrapper: bakım yükünü artırır. Test iş sözleşmesinin ihlalini yakalamalıdır.

Mevcut pakette “şu bağımlılık kesin gereksiz” sonucuna varmak için import/build analizi gerekir. Bu inceleme bağımlılık kaldırma yetkisi veya kanıtı değildir. Fazlalık olarak görülen şey bugün daha çok **karışan sorumluluk ve tekrarlanan politika**; paket sayısı tek başına kusur değildir.

## 9. TDD: değişikliğin doğruluğunu nasıl ispatlayacağız?

### 9.1 Test sırası

**Hata düzeltme:** gerçek sorunu ifade eden başarısız test → sorunun doğru nedenle başarısız olduğunu doğrulama → en küçük düzeltme → ilgili etki alanı testleri → gereken bağımsız inceleme.

**Davranış değiştirmeyen taşıma:** mevcut davranışın karakterizasyonu + bağımsız iş örnekleri → eski/yeni sonuç eşitliği → taşıma → aynı testleri yeni sınırda çalıştırma. Sırf TDD görünümü için zaten doğru davranışı bozan yapay test yazma. Mevcut hata karakterizasyon testinde görünüyorsa “bilinen hata” olarak ayrılır; eski yanlış davranış kalıcı iş kuralı yapılmaz.

**Yeni mimari kapı:** ihlalli küçük fixture'ın reddedildiğini ve geçerli fixture'ın kabul edildiğini önce göster → gerçek kaynakta kapıyı etkinleştir. Bir regex'in çalışması, tüm ihlalleri yakaladığını kanıtlamaz.

**Veri geçişi:** eski/bozuk/ileri sürüm fixture → başarısız veya kayıplı dönüşümü göster → dönüşüm → interrupted write/restore testleri. Kaynak veriyi test adına silme.

Beklenen sonucu test edilen fonksiyonu tekrar çağırarak üretme. Hesap örneklerinin oracle'ı; bağımsız elle hesaplanmış küçük örnek, onaylı referans veya matematiksel invariant olmalıdır.

### 9.2 Katmanlara göre test

| Katman | Test edilen sözleşme | Gerekmeyen tekrar |
|---|---|---|
| Domain | Para/dönem/oran, eşik/tavan, toplam, negatif/iade, deterministik sonuç | Aynı saf hesabı her tarayıcıda çalıştırma |
| Validation/migration | Dış girdi, tüm desteklenen eski sürümler, bilinmeyen ileri sürüm, kurtarma | Yalnız başarılı JSON örneği |
| Application | Senaryo önceliği, snapshot bağımlılığı, conflict ve kayıt sonucu | React render testinde bütün hesap doğrulaması |
| ViewModel/projection | Aynı kayıtların tablo/grafik/metin/CSV eşitliği | Metnin sayı içermesine bakıp doğruluğu varsayma |
| Master component | Semantik, state, odak, form, uyarlama ve görünür durum | Her sayfada aynı Button davranışını tekrar test etme |
| Feature entegrasyonu | Gerçek kullanıcı komutu → doğru sonuç ve kayıt | Yalnız izole mock verilerle bitirme |
| Kritik uçtan uca yol | Sayfa geçişi, URL, geri dönüş, reload, kaynak hatası | Her matematik kombinasyonunu E2E yapmak |
| Görsel regresyon | Tipografi, hiyerarşi, hizalama, seçili/hata/açık durum | Ekran görüntüsünün iş hesabını kanıtlaması |
| İnsan QA | Anlam, estetik, görev tamamlama, yanlış beklenti | Otomatik erişilebilirlik kontrolünü tam WCAG uyumu sayma |

Mevcut Playwright model testleri başlangıç için yeterli çalıştırıcı olabilir. Önce saf testlerin browser/server gereksinimini ayır; ölçülmüş süre/ergonomi ihtiyacı olmadan ikinci test runner ekleme. Test dosyalarının yeni katmanlara taşınması mevcut CI kapsamını sessiz azaltmamalıdır.

### 9.3 Öncelikli kabul kataloğu

Aşağıdaki `AR-*` kimlikleri **önerilen test gereksinimleridir**; bugün geçirilmiş test listesi değildir. P0 sınıfındaki bir ihlal ortalama kalite puanıyla telafi edilemez.

| ID | Başlangıç / işlem | Beklenen kanıt |
|---|---|---|
| AR-01 | Domain'e React/storage import'u eklenen fixture | Mimari kapı FAIL; geçerli saf fixture PASS |
| AR-02 | Alias, re-export ve type import ile yasak sınır geçilir | Üçü de tespit edilir; yalnız metin aramasıyla kaçış yok |
| AR-03 | Yeni `ChartSpec.kind` eklenir, adapter eksik bırakılır | Derleme veya registry kapsam testi FAIL |
| AR-04 | Aynı input/model/source iki kez hesaplanır | Normalize edilmiş sonuç eşit; girdi değişmemiş |
| AR-05 | Bilinmeyen tutar ve gerçek sıfır birlikte gösterilir | Ayrı anlam/etiket; toplamda eksiklik açık |
| AR-06 | TRY/EUR tutarlar kur politikası olmadan toplanır | İşlem reddedilir; sessiz sayı toplamı yok |
| AR-07 | 100 birim aylık fatura, ilk fatura oranı %10 | Hakediş 10; 12 tekrar otomatik eklenmez |
| AR-08 | 1.000 birim yıllık fatura, %15, 12 eşit ödeme | Toplam 150; ödeme başına 12,50; tahakkuk/ödeme ayrımı açık |
| AR-09 | 1.000 birimin kendisi 12 takside ayrılır | 83,33… anapara taksiti; AR-08 komisyonuyla karışmaz; kalan kuruş politikası toplamı korur |
| AR-10 | 1./2./3. yıl komisyon girdileri değiştirilir | Hakediş, tablo, grafik ve açıklama birlikte güncellenir |
| AR-11 | %90/%110 veya tavanlı politika sınırları sınanır | Eşiğin hemen altı/eşiti/üstü onaylı politikayla eşleşir; sınırlar hardcode ikinci yerde yok |
| AR-12 | Ay sonu, yıl geçişi, takvim günü/saat dilimi | Dönem kaymaz; 30 gün varsayımı kaynaklı yanlış ay oluşmaz |
| AR-13 | Gelirde özel senaryo oluşturulup nakde geçilir | Senaryo revision'ı ve etkin girdiler aynı; kapsama özel fark varsa açıklanır |
| AR-14 | URL, yerel override ve preset çelişir | Tek çözümleme önceliği uygulanır; kaynak kullanıcıya izlenebilir |
| AR-15 | Yeni default ile eski adlandırılmış senaryo açılır | Eski etkin girdiler korunur veya açık migration karşılaştırması çıkar |
| AR-16 | Tablo sıralanır/filtrelenir; grafik/CSV üretilir | Aynı kapsamdaki kayıt kimlikleri, değer ve birimler eşleşir |
| AR-17 | Kümülatif dönem sonu nakit toplam satırına gelir | Yanlış dönem toplamı üretilmez; aggregation semantiği korunur |
| AR-18 | Grafik serileri yeniden sıralanır veya biri gizlenir | Seri kimliği/rengi/etiketi başka seriye taşınmaz |
| AR-19 | A çizimi beklerken B spec gelir; A geç tamamlanır | Ekranda B kalır; eski async iş yeni çizimi ezmez |
| AR-20 | Grafik gizli panelde açılır, kapanır, unmount olur | Doğru boyut; artık instance/observer yok; diğer grafik etkilenmez |
| AR-21 | local kayıt yüklenirken ilk render/effect çalışır | Default değer mevcut kaydı ezmez; hydrate bitmeden persist yok |
| AR-22 | StrictMode/tekrar render sırasında input değişir | Updater saf; kayıt komutu tekrarı veri kaybı/yanlış başarı üretmez |
| AR-23 | Bozuk not veya kopuk liste ilişkisi içe aktarılır | Hata alanı açıklanır; geçerli kayıtlar ve ham kaynak kaybolmaz |
| AR-24 | Eski sürüm → yeni sürüm migration | Beklenen kayıt kimlikleri/adedi/alan anlamları korunur |
| AR-25 | Uygulamadan yeni bir veri sürümü yüklenir | Salt okunur/kurtarma durumu; default ile üzerine yazılmaz |
| AR-26 | Migration yazımı kesilir veya kota dolar | Önceki kayıt veya tamamlanmış yeni kayıt kurtarılır; ikisi de kayıp olamaz |
| AR-27 | Export → temiz test deposuna import | Dışa aktarılan girdiler, varsa tarihsel sonuç ve provenance eşit; yeniden hesap yalnız özgün motor/baz/kaynak sürümleri destekleniyorsa zorunlu |
| AR-28 | İki sekme aynı revision'dan yazar | İkinci yazım conflict; kullanıcı taslağı korunur |
| AR-29 | OPEX yanıtı geçersiz, eski veya timeout | Son iyi snapshot korunur; güncellik/hata görünür; yanlış “canlı” iddiası yok |
| AR-30 | Formda `12,`, boş alan, çok büyük sayı | Draft korunur; geçersiz değer domain'e/kalıcı kayda geçmez |
| AR-31 | %15 girdisi %18 yapılır | Metinde/eski tooltip'te %15 kalmaz; default açıklaması ayrı |
| AR-32 | Seçenek etiketi “Senaryonun (%100)” yapılır | ChoiceGroup sözleşme kontrolü FAIL; doğru değer etiketi PASS |
| AR-33 | 320 px'te gerçek uzun içerik ve açık panel | Sayfa yatay taşmaz; metin ≥14 px; kayıt/karşılaştırma bilgisi kaybolmaz |
| AR-34 | Klavye ile sayfa/dialog/dropdown kullanılır | Görünür çevrelemeyen odak, doğru dönüş, selected/focus ayrımı |
| AR-35 | Touch/pointer ardından Tab; reduced motion | Merkezi modalite/hareket politikası doğru; kullanıcı eylemi kaybolmaz |
| AR-36 | Responsive profil/yön değişirken form doludur | Draft, filtre, seçim ve kayıt revision'ı korunur |
| AR-37 | Token/Table/ChartFrame ortak sözleşmesi değişir | Gerçek tüketici listesine bağlı testler tetiklenir |
| AR-38 | Eski dist/başka worktree sunucusu aynı porttadır | Test hedefi commit/build kimliği uyuşmaz; test durur |
| AR-39 | Test skip veya gerçek cihaz eksik | Rapor `not_run`/skip gösterir; “tüm tarayıcılar geçti” iddiası çıkmaz |
| AR-40 | Statik istemci giriş kapısı var | Veri gizliliği değerlendirmesi bu kapıya dayanmaz; public artifact'ta secret yok |
| AR-41 | Eski sekme migration sırasında veya sonrasında eski depoya yazar | Koordine geçiş önkoşulu denetlenir; kaynak değişimi recovery/çatışma olur; yeni kayıt ezilmez, tam geçmiş kurtarma iddiası yok |
| AR-42 | Başlangıç görünümünde isteğe bağlı grafik/ayrı kabuk gerekmiyor; sonra ihtiyaç oluşuyor | Manifestle eşlenen gereksiz özel istek başlangıçta yok; gerektiğinde yüklenir; ortak veri/odak korunur |

AR-07–10, kullanıcının ortaklık örneklerinden türetilmiş hesap sözleşmeleridir. Ödeme/tahakkuk politikası seçilebilir olduğu için örnek fixture hangi politikayı kullandığını açık kaydeder; tek fixture bütün seçeneklerin doğruluğunu kanıtlamaz. Ticari kural belirsizse motor davranışı sessizce icat edilmez.

### 9.4 Özellik ve invariant testleri

Çok sayıda kombinasyon için birkaç yüksek değerli ilişki kur:

- Oran sıfırsa uygun komisyon sıfırdır; başka ücret kalemi varsa ayrıca gösterilir.
- Taksitlerin toplamı dağıtılan tahakkuku yuvarlama politikasına göre tam karşılar.
- Tavanlı planda oran artırılması tavanın üstünde ödeme yaratmaz.
- Negatif/iadeli politikanın semantiği tanımlıysa toplam mutabakat korunur; bütün fonksiyonlara kör “monoton artmalı” şartı konmaz.
- Formatlamak ham değeri değiştirmez; sıralama etiketin alfabetik sırasına dönüşmez.
- Filtrelenmiş alt kümenin kayıtları kaynak kümede vardır; kimlikler benzersizdir.
- Saf migration aynı eski girdiye aynı çıktıyı verir; tamamlanmış sürüme tekrar uygulanmaz.

Property-based test aracı ancak tekrarlanan kombinasyon ihtiyacı varsa MAY. Seçilmiş kritik hesabın test duyarlılığını, bilerek eklenen tek bir hata veya sınırlı mutation denemesiyle sınamak SHOULD; tüm repoya pahalı mutation suite zorunlu değildir.

### 9.5 Görsel doğrulama ve erişilebilirlik

Kritik master fixture'larında normal/selected/invalid/loading/empty/stale/open/focused durumları göster. Önce 320 px ve ana görev; sonra 360/375/390, ilgili yatay/tablet/masaüstü kapsamı. Bütün durum × bütün genişlik kombinasyonunu körlemesine çarpmak yerine değişen bileşen ve gerçek riske göre matris kur.

Screenshot ortamı OS, tarayıcı sürümü, fontlar, locale, saat, veri ve animasyon açısından sabitlenir. Playwright ekran karşılaştırması farklı ortamların aynı raster çıktıyı üretmesini garanti etmez; baseline ortamı açık kaydedilir. [Playwright görsel karşılaştırma](https://playwright.dev/docs/test-snapshots)

Görsel diff, DOM/ARIA, klavye, hesap ve veri testlerinin yerine geçmez. Değişen görsel referansın önce/sonra/fark görüntüsü ve gerekçesi incelenir; yalnız testi yeşile döndürmek için topluca yenilenmez. Anlamlı UI değişikliğinde uygulayıcıdan bağımsız QA gerekir; yapılmadıysa açık yazılır.

WCAG 2.2 AA hedefi; semantik adlar, başlık yapısı, ilişkili yardım/hata, renk dışı anlam, kontrast, klavye, odak görünürlüğü/örtülmemesi, reflow ve uygun hedef alanlarını kapsar. Metni 14 px yapmak tek başına WCAG uyumu değildir. Otomatik kontrol yanında görev temelli klavye ve gerektiğinde gerçek ekran okuyucu denemesi kaydedilir. WebKit sonucu gerçek iOS/macOS Safari sonucu diye yazılmaz.

## 10. Vibe coding değişiklik protokolü

### 10.1 Her görevin değişiklik zarfı

Kod yazılmadan önce kısa ve somut kayıt hazırlanır:

1. Kullanıcı sorunu ve mevcut kanıt: hangi ekran/veri/durum bozuk?
2. Değişiklik türü: içerik, sunum, hesap, kayıt, API, ortak component veya altyapı.
3. Değişecek sözleşme; korunacak davranış ve etkilenen gerçek tüketiciler.
4. Yazılabilecek dosyalar/modüller; bunların dışına çıkma gerekçesi.
5. Başarısız regresyon/karakterizasyon testi ve beklenen bağımsız sonuç.
6. Veri/sürüm/migration etkisi; gerekiyorsa geri alma yöntemi.
7. Doğrulama komutları ve bağımsız inceleme gereksinimi.

Bu zarf kullanıcıdan her adımda yeniden izin istemek için değildir. Yetkili görev içinde uygulayıcı hareket eder; kapsam genişlemesi veya geri alınamaz işlem gerçekten yeni karar gerektiriyorsa somut fark sunulur. Ajana “gördüğün her şeyi düzelt” kapsamı verilmez.

### 10.2 Değişiklik sınıfları ve etki alanı

| Değişiklik | Mutlaka incelenecek tüketiciler | Ayrı tutulacak işler |
|---|---|---|
| Sabit metin/etiket | İlgili içerik anahtarları, 320 px, erişilebilir ad, anlam testleri | Hesap/default değer değiştirme |
| Token/font/odak | Ortak UI, tüm varyant fixture'ları, portal ve grafik | Rakamları ve kayıt şemasını değiştirme |
| Table/ChartFrame API | Import grafiğindeki bütün tüketiciler, mobil ve export | Feature iş kuralı ekleme |
| Finans/komisyon hesabı | Tüm sonuç tüketicileri, invariant ve referans örnekler | UI facelift ve global CSS düzenleme |
| Kalıcı şema | Eski kayıtlar, migration/export/import, conflict/recovery | Sessiz reset ve eski anahtar temizleme |
| Kaynak/API protokolü | Apps Script/HTTP adapter ve her snapshot tüketicisi | Canlı endpoint'i test ortamı gibi kullanma |
| Paket/framework yükseltme | Lockfile, desteklenen API'ler, build, ana akışlar | Aynı PR'da kapsamlı refactor |

Import grafiği etki alanının başlangıcıdır; CSS seçicileri, data-key, URL, schema ve çıktı tüketicileri de bağımlılıktır. “Bu dosyayı yalnız bir yer import ediyor” cümlesi paylaşılan verinin tek tüketicisi olduğunu kanıtlamaz.

### 10.3 Ajana verilecek uygulama şablonu

```text
Görev:
Kaynak commit/build:
Sorunun kanıtı ve yeniden üretim koşulu:
Sözleşme / ilgili AR-* testleri:
İzinli yazma alanı:
Etkilenen tüketiciler:
Korunacak veri, URL ve iş davranışı:
Beklenen değişiklik:
Önce çalışacak başarısız test veya karakterizasyon:
Sürüm/migration kararı:
Doğrulama komutları ve ortam:
Bağımsız inceleme kapsamı:
Teslim: değişiklik, kanıt, pass/fail/not_run, kalan risk.

İş hesabını UI'de yeniden yazma. Testleri zayıflatma.
Gerekli olmayan paket, global CSS veya ortak component değişikliği yapma.
Hata saklamak için as/any/!/@ts-ignore veya ?? 0 ekleme.
Kayıt okunamıyorsa varsayılanla üstüne yazma.
Bir engel varsa kanıtı ve en küçük uygulanabilir çözümü bildir.
```

### 10.4 Çok ajan ve worktree düzeni

- Her uygulama dalı güncel, doğrulanmış tabandan başlar. Kullanıcının aynı checkout'taki değişiklikleri üzerine yazılmaz.
- Aynı master component/token/schema'yı iki ajan eşzamanlı bağımsız düzenlemez. Birinin sahipliği, diğerlerinin tüketici işi açık ayrılır.
- Worktree yalnız dosya izolasyonudur; port, localStorage origin'i, test verisi, build artifact ve canlı servis izolasyonu sağlamaz.
- Test için ayrı profil/context ve uygun port kullanılır. Kişisel tarayıcı deposu temizlenmez. Aynı origin'deki başka testin kayıtlarını silme.
- Build/test kimliği worktree HEAD ve source durumuyla eşleştirilir. Başka dalın çalışan sunucusuna bağlanan suite kanıt sayılmaz.
- Birleştirmeden sonra ortak sözleşmeye bağlı kontroller güncel birleşik HEAD üzerinde çalışır. Eski branch testinin sonucu yeni birleşime otomatik taşınmaz.
- Yeni commit author ve committer kimliği kişisel Git politikasına uyar; hook atlanmaz. Upstream geçmişi başka kimlikle yeniden etiketlenmez. Push/deploy yetkisi bu belgeden çıkarılmaz.

### 10.5 Reddedilecek kısa yollar

Bir hata çıkınca bütün `global.css` sonuna override eklemek; testin beklenen sonucunu mevcut hatalı çıktıya çevirmek; bütün screenshot'ları onaylamak; veri silip “temiz kurulumda çalışıyor” demek; formatter farkı içinde iş kuralı değişikliğini gizlemek; tek test geçince bütün uygulamayı doğrulanmış saymak; güvenlik/odak kontrolünü kapatmak; `catch` içinde sessiz default döndürmek. Her biri kalıcı bakım borcu üretir ve ilgili gate tarafından reddedilmelidir.

## 11. CI ve yayımlama: belgede yazanı gerçek kapıya dönüştür

### 11.1 Bugünkü kanıt

Mevcut `pages.yml`, `npm ci` → `npm run check` → `npm run build` → Playwright üç tarayıcı kurulumu/testi → uygun main akışında Pages artifact/deploy zincirine sahip. `check`, `astro check` ve `check-ui-gates.mjs` çalıştırıyor. Bu iyi bir tabandır.

Bu inceleme branch protection ayarlarını veya güncel GitHub workflow sonucunu doğrulamadı. CI dosyasında job bulunması onun zorunlu status check olduğunu kanıtlamaz. Bazı saf model testlerinin yalnız bir projede çalışması bilinçli tekrar azaltmadır; browser gerektiren skip'ler ayrıca görünür olmalıdır.

### 11.2 Hedef kapılar

| Kapı | Reddettiği değişiklik | Kanıt |
|---|---|---|
| G1 — Sözleşme/şema | Geçersiz içerik, URL, fixture; eksik enum/kind; kırık public API | Tip/schema testleri |
| G2 — Mimari sınır | Domain'de I/O/UI, özellik iç dosyasına erişim, döngü | AST/import denetimi + negatif fixture |
| G3 — Hesap | Yanlış dönem, birim, eşik, yuvarlama, drift | Referans örnek/invariant testleri |
| G4 — Veri ömrü | Kayıplı migration, unsupported sürüme yazım, conflict ezme | Adapter/restore testleri |
| G5 — Gösterim eşitliği | Tablo/grafik/metin/mobil/CSV ayrışması | Projection sözleşme testleri |
| G6 — UI erişim/görsel | 14 px altı, taşma, görünmez odak, kritik görsel kayma | Tarayıcı + görsel fark + gerekli insan incelemesi |
| G7 — Üretim artifact | Stale dist, yanlış base path, eksik lazy modül | Build kimliği + preview/network ana akış |
| G8 — Değişiklik dürüstlüğü | Test atlayıp tam doğrulama iddiası, kaynaksız baseline onayı | Makine raporu + inceleme kaydı |

Önerilen gate adları mevcut npm script'leri değildir. Uygulayıcı önce küçük, gerçek kontrol ekler; sonra package/CI komutuna bağlar; ihlalli fixture ile CI'ı durdurabildiğini gösterir. Yalnız AGENTS.md'ye “zorunludur” yazmak G1–G8'i uygulamaz.

### 11.3 Çalıştırma katmanları

- **Yerel hızlı:** etkilenen pure/schema/contract testleri ve type kontrolü; kısa geri bildirim. Süre bütçesi mevcut ölçümden çıkarılır.
- **PR:** değişiklik etki haritasına bağlı kontroller, mevcut zorunlu kapılar ve ortak master fixture'ları. Seçimli test mekanizması kurulana kadar tam suite'in kapsamı keyfen azaltılmaz.
- **Main/sürüm:** güncel birleşik kaynak, üretim build'i, kritik tarayıcı akışları, migration/restore ve kaynak kimliği. Üretilen ve sınanan artifact yayımlanır; arada farklı artifact build edilmez.
- **Geniş tarama:** desteklenen tarayıcı/gerçek cihaz ve regresyon kombinasyonları ürün riskiyle belirlenir. Yeni zamanlanmış servis bu belgeyle otomatik kurulmaz.

Mevcut `npm run check`, `npm run build`, `npm test`, `npm run verify` komutları çalıştırılmadan önce package/config üzerinden etkileri incelenir. `verify` zaten kapsadığı işleri tekrar ettiriyorsa gereksiz ikinci suite çalıştırılmaz. Bu dokümantasyon teslimi için bütün uygulama suite'ini tekrar çalıştırmak gerekli değildir.

### 11.4 Yayın ve geri dönüş

Artifact, source commit ve model/schema sürümleri ilişkilendirilir. Yayın sonrası temel yol, base `/19ekim`, lazy asset'ler ve kaynak durumu kontrol edilir. Gerçek GitHub CI ve canlı tarayıcı sonucu ayrı yazılır.

Kod rollback'i veri rollback'i değildir. Yeni şema yazan sürümden eski uygulamaya dönüşte eski uygulama yeni kaydı okumayı bilmiyorsa güvenli salt okunur/kurtarma davranışı gerekir. Yayımdan önce desteklenen eski/yeni okuyucu-yazıcı matrisi ve dönüş yolu belirlenir. Veri kaybıyla sonuçlanan sessiz down-migration yapılmaz.

Gelecekte korumalı sunucu/deploy gerekiyorsa teknik kurulum, CI/CD, güvenlik ve rollback sahibi **Teknik kurulum sorumlusu (rol)** olarak tanımlanır. GoDaddy domain/DNS adımı varsa kayıt türü/adı/değerini Teknik kurulum sorumlusu (rol) hazırlar; **Asistan (rol)** GoDaddy'de uygular; Teknik kurulum sorumlusu (rol) servis sonucunu doğrular. Erişim bilgileri belgeye konmaz ve bu rol dağılımı canlı değişiklik yetkisi oluşturmaz.

## 12. Aşamalı dönüşüm: uygulamayı topluca yeniden yazma

Her aşama ayrı incelenebilir teslimdir. Yeni mimari “eski kötü, yeni iyi” etiketiyle değil, korunmuş davranış ve daha güçlü sınırla kabul edilir.

| Sıra | Somut teslim | Bağımlılık / çıkış ölçütü |
|---|---|---|
| 0 | Güncel route/component/veri/hesap tüketici haritası; test/build başlangıç ölçümü | Canlı veri veya kişisel tarayıcıyı değiştirmeden mevcut sınır kanıtı |
| 1 | Bir pilot özellikte saf hesap/projection sözleşmesi; öneri: gelir→nakit özel senaryo bağlantısı | AR-13–17; eski doğru örnekler korunur, bilinen farklar açıklanır |
| 2 | Aynı pilotta tam etkin girdi snapshot'ı; giriş doğrulama; saf updater | AR-14–15,21–22,30; mevcut kayıt korunarak uyumluluk |
| 3 | Değerli kayıt için recovery/export/migration ve revision portu | AR-23–28,41; eski yazıcı geçişi ve kaynak silinmeden restore; tarihsel görüntü ile yeniden hesap ayrı |
| 4 | DataTable/ChartFrame sözleşme fixture'ları; ortak ViewModel projeksiyonu | AR-16–20,33–36; sayısal sonuç ve mobil görev eşitliği |
| 5 | Grafik saf adapter/runtime ayrımı; stabil ID; CSS kapsamı | Mevcut bütün kind/tüketiciler kapsanır; yeni görsel farklar incelenir |
| 6 | Diğer özellikleri aynı sınırlarla taşı; içerik/terim kaynağını birleştir | Her taşıma bağımsız test ve gerçek public API; kopya motor yok |
| 7 | Mimari kapıları genişlet; extra TS strictness; PR/release kanıtını bağla | Negatif fixture'lar kapıyı düşürür; yanlış pozitifler anlaşılmıştır |

Mimari lint ilk pilotta G2'nin küçük haliyle başlar; son aşamaya kadar denetimsiz bırakılmaz. Aynı şekilde storage P0 kusuru gözlenirse 3. aşamayı bekleme; dar korumayı önce uygula. Sıra bir riski erteleme gerekçesi değildir.

Başlangıç pilotu tüm `ui.tsx` dosyasını bölmek olmamalıdır. Önce gerçek kullanıcı akışında hangi veri ve sözleşmenin taşındığını kanıtla. Sonra ortak parçayı en az iki gerçek tüketicinin ihtiyacıyla çıkar. Bir dosya taşınırken endpoint, model hesabı ve görsel tasarım aynı anda değişmez.

Geçişte eski public API'yi dar bir adapter koruyabilir; geçici adapter'ın sahibi, kaldırılma koşulu ve tüketici sayısı kaydedilir. Süresiz iki hesap motoru çalıştırılmaz. Eski/yeni karşılaştırma yalnız doğrulama içindir; üretimde iki bağımsız doğru kaynağı oluşmaz.

## 13. Ölçülebilir sürdürülebilirlik

### 13.1 Güvence paneli

Tek bir “kalite %98” ortalaması veri kaybını gizleyebilir. Alanları ayrı izle; P0 kapıları veto eder. Metriklerin pay/payda ve ölçüm koşulu açık olsun.

| Ölçüt | Tanım | Hedefin anlamı |
|---|---|---|
| Kritik sözleşme kapsamı | Otomatik kanıtı bulunan kritik sözleşme / onaylı kritik sözleşme envanteri | %100 hedeflenebilir; envanter dışındaki hatasızlık anlamına gelmez |
| Migration desteği | Başarılı restore testi olan desteklenen eski sürüm / desteklenen sürüm | Destek ilan edilen sürümlerin tamamı |
| Projection eşitliği | Uyuşan tablo/grafik/mobil/export fixture'ları / ilgili fixture'lar | Tüm kritik örnekler; eksik birim fail |
| Sınır ihlali | İzin verilmeyen import/I/O sayısı | Yeni ihlal sıfır; eski borç açık ve süreli |
| Regresyon kaçışı | Yayımdan sonra bulunan değişiklik kaynaklı hata / ilgili değişiklik | Trend; kullanıcı hatası veya toplam kalite puanı diye yorumlama |
| Veri kurtarılabilirliği | Denenen restore senaryoları ve sonuçları | “Yedek var” yerine gerçekten açılabilen kayıt |
| Flaky test oranı | Kaynak değişmeden tekrar sonucu değişen test / test çalıştırması | Kaynak neden giderilir; retry ile gizlenmez |
| Değişiklik etki genişliği | Değişen modül/ortak sözleşme/tüketici sayısı | Gereksiz yayılma azalmalı; yapay dosya sınırı değil |
| Geri bildirim süresi | Yerel kritik test ve PR kapısı süreleri | Başlangıç ölçümüne göre bütçe; test silerek hızlandırma yok |
| UI performansı | İlgili cihaz/viewportta etkileşim, çizim süresi, indirilen byte | Mevcut kanıta göre tek bütçe; tahmini değer başarı sayılmaz |

Bugünkü sayısal baseline bu görevde ölçülmedi. Belgeye hayali test süreleri, bundle tasarrufu veya garanti puanı yazılmaz. Profilleme gerekmeyen bir dokümantasyon işi performans benchmark projesine çevrilmez.

### 13.2 Hata izlenebilirliği

Uygulama hatası için güvenli teşhis paketi: build/model/schema sürümü, feature/operation kimliği, hata kodu, snapshot kimliği ve hassas olmayan durum. Not metni, gerçek müşteri kaydı, fatura ayrıntısı veya secret loglanmaz. İlk aşamada indirilebilir yerel teşhis yeterli olabilir; dış telemetry servisi ayrı gereksinim/izin gerektirir.

Boundary hataları “sistem hata verdi” tek cümlesine çökertilmez. Kullanıcı için neyin kaydedilmediği ve yapabileceği eylem açıklanır; teknik ayrıntı destek kaydında kalır. Hata sınırı bozuk sonucu başarılıymış gibi sunmaz.

## 14. Yeni özellik için archetype şablonu

Yeni bir simülasyon veya sayfa eklenirken şu kayıt doldurulur. Her satır için klasör açmak gerekmez; sorumluluğun nerede karşılandığını göstermek gerekir.

| Alan | Zorunlu karar |
|---|---|
| Amaç | Kullanıcının vereceği karar ve tamamlayacağı görev |
| Sahiplik | Özellik, içerik ve hesap için yetkili kaynak |
| Girdi | Tür, birim, dönem, aralık, draft/geçerli ayrımı, varsayılanın kaynağı |
| Kural | Saf fonksiyon, invariant, politika/model sürümü |
| Sonuç | Semantik kayıtlar; sıfır/bilinmiyor/eksik durumları |
| ViewModel | Tablo/grafik/metin/mobilin ortak projeksiyonu |
| Sunum | Kullanılacak master/variant; yeni master gerekçesi |
| State | Yerel seçim, paylaşılan senaryo, kalıcı belge sahipleri |
| Veri ömrü | Şema, migration, export/restore, eşzamanlılık |
| Entegrasyon | Public API, dış kaynak doğrulama, timeout/güncellik |
| Erişim | Genel içerik mi, kişisel/korumalı kayıt mı? Gerçek yetki sınırı |
| Test | Önce başarısız gereksinim; bağımsız oracle; AR-* bağlantıları |
| Görsel kabul | 320 px, gerçek içerik, durumlar, odak, tokenlar |
| Performans | Hangi işlem pahalı; ne ölçülecek; gereksiz indirme var mı? |
| Yayın | Build/source kimliği, geriye uyumluluk, rollback |
| Değişiklik alanı | Yazılabilecek modüller ve gerçek tüketiciler |

**Definition of done:** kullanıcı problemi kapanmış; değişen sözleşme testle korunmuş; ilgili tüketiciler kontrol edilmiş; değerli kayıt korunmuş; UI durumları ve erişilebilirlik kabulü sağlanmış; kontrol sonuçları doğru ortam/sürümle raporlanmış; gerekli bağımsız inceleme tamamlanmış; dokümantasyon gerçek uygulamayla eşleşmiş olmalı. Yapılmayan kontrol `not_run` kalır; tamamlandı ifadesiyle örtülmez.

## 15. Öncelik ve bağlayıcılık özeti

**MUST — her ilgili değişiklikte:** tek iş kuralı kaynağı; unknown sınır doğrulaması; saf domain/updater; birim/dönem/snapshot tutarlılığı; veri kaybını engelleyen okuma/yazma; import sınırı; anlamlı regresyon testi; kişisel Git/secret/odak/font kuralları; gerçek kanıt durumu. Önemli mimari, yetkilendirme, veri kaybı/migration, eşzamanlılık veya birden çok tüketiciyi etkileyen önemli ortak sözleşme değişikliğinde bağımsız standards-reviewer incelemesi; anlamlı UI tesliminde bağımsız QA zorunludur. İnceleme mümkün değilse bu sınır açık raporlanır; öz inceleme bağımsız inceleme sayılmaz.

**SHOULD — bu projenin kademeli hedefi:** feature modülleri; saf ViewModel; sürümlü repository adapter; IndexedDB ile değerli yerel kayıt; component sözleşme kataloğu; kritik görsel referanslar; ölçülmüş test/performance bütçesi. Yukarıdaki zorunlu risk eşiğinin altındaki işler için ek bağımsız inceleme ihtiyaca göre seçilir.

**MAY — ancak somut ihtiyaçla:** OOP runtime sınıfı, decimal kütüphanesi, schema kütüphanesi seçimi, property-based test aracı, Storybook, cache kütüphanesi, merkezi backend/CMS. Bunların varlığı tek başına mimari kalite göstergesi değildir.

## 16. Kanıt dizini ve bu teslimin sınırı

### 16.1 Kaynak haritası

Bu yollar repository köküne (`site/`) göredir; kaynak revizyonu `15011e9`.

| İnceleme alanı | Kaynak |
|---|---|
| Yığın ve komutlar | `package.json`, `package-lock.json`, `tsconfig.json`, `astro.config.mjs` |
| State/toplu model | `src/components/ModelContext.tsx`, `src/data/model.ts` |
| Parametreler/notlar | `src/data/params.ts`, `src/data/notes.ts` |
| Applet kaydı/modeli | `src/lib/appletStore.ts`, `src/data/applet.ts` |
| Senaryo ayrımı | `src/lib/scenario.ts`, `src/lib/scenarioOptions.ts`, `src/views/RevenuePage.tsx`, `src/views/CashflowPage.tsx` |
| Grafik | `src/lib/chartSpec.ts`, `src/lib/echarts-setup.ts`, `src/scripts/charts.ts` |
| Ortak UI/format | `src/components/ui.tsx`, `src/lib/format.ts` |
| Stil | `src/styles/global.css`, `src/styles/tokens.css` |
| OPEX | `src/data/opex.ts`, `src/lib/useOpex.ts`, `src/views/OpexPage.tsx`, `apps-script/src/Motor.js` |
| Görünüm kapısı | `src/lib/giris.ts` |
| Denetim/CI | `scripts/check-ui-gates.mjs`, `playwright.config.ts`, `.github/workflows/pages.yml`, `tests/` |
| Önceki yönergeler | `ux.md`, `ux_v2.md`, `ifade.md`, `gorsel_algi.md`, `contents.md`, `affilate.md` |

### 16.2 Doğrulama durumu

| Kontrol | Durum | Kanıt sınırı |
|---|---|---|
| Git güncelleme ve kaynak envanteri | Tamamlandı | İncelenen HEAD `15011e9`; alınan upstream geçmişi korundu |
| Manifest/lock/kurulu paket/runtime karşılaştırması | Tamamlandı | Bölüm 1.1; yayımlanmış artifact doğrulaması değil |
| Sorumluluk, kayıt, grafik, tablo, senaryo ve CI kaynak incelemesi | Tamamlandı | Kaynaktan çıkarım; A01–A18 canlı hata yeniden üretimi değil |
| Resmi framework referansları | Tamamlandı | İlgili bölümlerde bağlantılar; öneri mimari proje kararıdır |
| Bağımsız yönerge incelemesi | Tamamlandı | Tam belge ve gereksinimler üzerinden; eski yazıcı geçişi, restore/yeniden hesap ayrımı ve MUST/SHOULD bulguları düzeltildi. Kaynak kodu/çalışma zamanı için bağımsız QA değildir |
| Belge yapı denetimi | Tamamlandı | Kaynak yolları, tablo sütunları, kod blokları ve kabul kimlikleri kontrol edildi |
| Uygulama kodunu dönüştürme | Kapsam dışı | Bu teslim yalnız `archetype.md` yönergesi |
| Yeni gate/migration/visual test uygulama | `not_run` | AR/G kimlikleri uygulama gereksinimleridir |
| Build / tam test suite / gerçek cihaz / canlı QA | `not_run` | Belge-only teslimde yeniden çalıştırılmadı |
| GitHub branch protection / güncel workflow / prod erişimi | `not_verified` | CI konfigürasyonu okunması bu kanıtların yerine geçmez |

Uygulayıcı bu tabloyu gelecekteki gerçek çalıştırma sonuçlarıyla ayrı bir uygulama kaydında günceller; bu raporun kaynak anını geçmişe dönük değiştirmez.
