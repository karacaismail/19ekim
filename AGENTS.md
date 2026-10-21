# Proje talimatları — iStoc saha ve pazarlama planı

Bu repo, iStoc için hazırlanan satış ve pazarlama operasyon planının herkese açık sitesidir:
<https://karacaismail.github.io/19ekim/>. Kullanıcı düzeyindeki kurallar
([/Users/w6x/AGENTS.md](/Users/w6x/AGENTS.md), [/Users/w6x/AGENT.md](/Users/w6x/AGENT.md)) geçerlidir; bu dosya
yalnız projeye özgü kararları ve gerçek komutları kaydeder.

## Yığın ve mimari

- Astro 7.4.0 (statik), @astrojs/react 7.1.0, React 19.3.1, @mantine/core 9.7.3, @mantine/dates 9.7.3 (dayjs 1.11),
  ECharts 6.1.0, TypeScript 6. Giderler sayfası ayrıca @fontsource-variable/roboto 5.3.0 ve Google Apps Script (V8) kullanır.
- Her sayfa tek bir React ağacıdır (`src/views/*`), `AppFrame` içinde `MantineProvider` + `ModelProvider` ile sunucuda
  çizilir ve `client:load` ile hidrasyon alır. Astro’da React bağlamı sayfa sınırını geçmez; Mantine bileşenleri ve
  `useModel()` her zaman `AppFrame` içinde kalır (sayfa bileşeni yalnız `AppFrame` + içerik bileşenini döndürür).
- **Tek veri kaynağı: parametreler.** Kararlaştırılan tarih, kişi sayısı, ücret, prim, kota, bütçe, hedef ve yasal tavan
  `src/data/params.ts` içindedir (`DEFAULT_PARAMS`, `PARAM_GROUPS`). `src/data/model.ts` → `buildModel(params)` tüm
  sayfaların verisini türetir (`makeProgram`, `makeRoles`, `makeDigital`, `makeGrowth`, `makeOrg`). Sayı ve tarih
  içeren yeni metin, parametreden üretilir; sabit yazılmaz.
- Takvim kayması: program başlangıcı tüm planı, Aralık başlangıcı organizatör / ekip lideri / Aralık saha kohortunu
  kaydırır. Metindeki “13 Kasım” gibi tarihler `shiftText` ile aynı gün sayısı kadar kayar (`src/lib/dates.ts`).
- `/parametreler/` değerleri düzenler; değişiklik anında tüm sayfaların modeline yansır ve `localStorage`
  (`istoc-plan-parametreler`, yalnız varsayılandan farklı anahtarlar) içinde saklanır. Yayındaki site herkes için
  varsayılanları gösterir; değişiklik varsa her sayfada not görünür. Varsayılanı kalıcı değiştirmek için `params.ts`.
- İstemci JavaScript’i: React adaları, `BaseLayout.astro` içindeki satır içi betikler (ilk renk şeması, merkezi klavye
  odak modu, gezinme şeridi) ve grafikler. `Chart` bileşeni ECharts’ı (`src/scripts/charts.ts` → `echarts-setup.ts`)
  yalnız grafik görünür olunca dinamik yükler; spec değişince aynı grafiği yeniden çizer. İstihdam, arşiv ve
  Parametreler sayfaları ECharts indirmez. Tema düğmesi Mantine `colorSchemeManager` ile `istoc-plan-tema` anahtarını
  kullanır.
- Site, İsmail Karaca ile yatırımcı arasındaki toplantı içindir: yalnız SMART (tarihli, ölçülebilir) veri, kısa bağlam.
  Sayfalar:
  - `/` yalnız ECharts organizasyon şeması (`src/data/tree.ts` → `ORG`).
  - `/roller/<rol>/` görevler ve ölçüt, KPI, aylık artış grafiği, rol Gantt’ı + adımlar, günlük zaman payı + program.
    `segika` rolü masa başı (CRM) rolünün kopyasıdır (kullanıcı kararı 2026-10-19).
  - `/roller/dijital-pazarlama/` veri türüne göre değil iş akışına göre kümelenir (kullanıcı kararı 2026-10-19):
    1 Ölçüm ve entegrasyonlar (GA4, Yandex Metrica, GTM…) → 2 AI-first paylaşım otomasyonu → 3 Üretim ve paylaşım
    otomasyonu → 4 İçerik planı (ne üretileceği) → 5 90 günlük plan → 6 Günlük düzen. Veri: `src/data/digital.ts`.
  - `/istihdam/` yalnız Mantine `Timeline` (işe alım sırası) ve Mantine dates `Month` takvimi.
  - `/hedefler/` 90 gün hedefleri, ciro köprüsü, açığı kapatma, aylık ciro, kaynak × ay.
  - `/eylem-plani/` istoc.com genel planı: Gantt + tablo (İsmail Karaca ve her rolün tarihli adımları).
  - `/karar-yetkisi/`, `/karar-bekleyenler/`, `/buyume-modeli/` (MLM: piramit, huni, hedefler, uyum).
  - `/arsiv/` tahtadan karara eşlemesi; ana gezinmede yok, alt bilgiden bağlanır (veri kaybı olmasın diye).
  - `/parametreler/` karar parametreleri (yukarıda) ve türetilen değerler.
  - `/giderler/` OPEX (kullanıcı kararı 2026-10-20). Sıra: önce yıl ayrımı olmayan bölümler (`planOfModel`: Sheets ızgarasının 15
    ayı, Ekim 2026 – Aralık 2027; rapor ayıyla kaymaz — `PLAN_ILK_AY`) — aylık plan (yatay yığın grafik + 15 ay, yıl toplamları ve genel
    toplam tablosu) ve kalemler (kalem bilgisi ve ay ay tutarlar tek tabloda: Kalem · Kategori · Tutar · Bu ay · 15 ay ·
    2026 ₺ · 2027 ₺ · Toplam ₺ · 2027 artışı; altta — eski aylık gider planı tablosu — grup ara toplamları (yalnız
    “Hepsi”), toplam ve önceki aya göre değişim; Kalem sütunu ≥ 48em’de kaydırırken sabit; üç grup süzgeci; teknoloji
    sağlayıcıları); sonra yıl seçici (iki büyük sekme, APG Tabs: **2026** rapor ayından Aralık’a, **2027** 12 ay) ve
    seçili yılın bölümleri (`donemOf`, `kisiDonem`): özet, personel giderleri, netten brüte aylık bordro (kümülatif GV,
    asgari ücret istisnası, SGK tavanı), 2027 varsayımları, SGK teşvikleri. Sayfada Parametreler bölümü yok (değerler
    Sheets → Parametreler’de); sayfa sonunda yalnız hesap damgası (zaman, motor sürümü, özet). Veri repoda yoktur: Google Sheets → Apps Script web
    uygulaması (`apps-script/`, POST + erişim anahtarı) → sayfa (`src/data/opex.ts`). Canlı bağlantı (kullanıcı kararı
    2026-10-20, “anlık, yalnız değişen değer”): sayfa görünürken bekleyen istek (`bekle: true`, uzun yoklama) gönderir;
    `doPost` önbellekteki özet değişene ya da ≈20 sn dolana kadar bekler, yanıt `bekledi: true` taşır, sayfa hemen yeniden
    sorar (en az 1,5 sn arayla). Bekletmeyen (eski) sunucuda 15 sn aralık. Yeni model aynı bileşenlere verilir (sayfa
    yeniden kurulmaz); grafikler `replaceMerge` + sıra kimliğiyle yerinde güncellenir, değişen değer kısa süre
    `data-changed` ile vurgulanır (yalnız veri özeti değişince; süzgeç/yıl değişince değil).
    Sheets’teki Pano/Bordro aynı motorla (`apps-script/src/Motor.js`) hesaplanır ve **düz değer** olarak yazılır
    (kullanıcı kararı 2026-10-20: “Yükleniyor…” olmasın; özel işlev `=OPEX(...)` kurulmaz, eski çağrılar çevrilir):
    `hesaplariYaz_` (Sheets.js) basit `onEdit` (girdi sayfası; hesaplanan sayfada elle değişiklik geri yazılır), `onOpen`,
    OPEX → Hesapları yenile, Kurulum `hesaplar` adımı ve kur değişince (GOOGLEFINANCE onEdit tetiklemez) `doPost`’tan
    çalışır; betik kilidi, girdi kilitle okunur, yalnız içeriği değişen blok yazılır (iz: konum + değer), metin kesme
    işaretiyle (tarih sanılmaz; yazılan alanlarda `@` biçimi yok). Kullanıcı kararı 2026-10-20: ayrı **Hesap** ve
    **Teşvikler** sayfası yok; Pano blokları (gösterge kutuları, küme özeti, köprü, plan, kişiler, grafik verileri,
    uyarılar; `OPEX_PANO`, en çok satırla sınırlı) doğrudan Pano’ya yazılır, grafikler bunlardan çizilir; teşvik
    tablosu hesapta kullanıldığı için Parametreler `H:P`’de (`OPEX_TESVIK_SUTUN`; Kurulum taşır, kodlarla doğrular,
    sonra eski sayfayı siler). Parametreler’de formül olan her hücre mavi. Kodun yazdığı hücreler (Toplam satırı, Personel `K:O`) girdi
    özetine girmez. Zamanlanmış/kurulu tetikleyici yoktur. Döviz kuru Parametreler’de canlı GOOGLEFINANCE formülüdür.
    Sayfalar (kullanıcı kararı 2026-10-20): “Giderler Hepsi” (kod hesaplar: `hepsi` raporu, gruplar Ofis / Teknoloji /
    Personel ay ay ₺), “Giderler OFİS” ve “Giderler TEKNOLOJİ” (ikisi de girdi `A:G`, `H` boşluk, ızgara `I:AL`; motorda
    `giderler2` ve `giderler` kaynakları; grubu sayfa belirler, kurulum Küme sütununu sayfayla eşitler; birleşik eski
    sayfada Küme sütunu) ve “Giderler PERSONEL” (girdi `A:I`, hesap `K:O`,
    ızgara `Q:AT`). Eski “Düzenli Giderler” (eski “Bu ay ödendi / Dahil / Fatura / Not” ve hesap sütunları kaldırıldı →
    ödeme takibi yok, `odeme.takip=false`) Küme’ye göre ikiye ayrılır (`giderSayfalariniAyir_`: önce değerlerden gizli
    yedek sekme, kopya geçici adla temizlenir, yarıda kalırsa yeniden çalıştırınca sürer; girdisi dolu “Toplam…” satırında
    durur); ayırma bitmeden OFİS okunmaz (çift sayım yok); eski adlar da okunur. Kurulum adımlıdır
    (`OPEX_KURULUM_ADIMLARI`, ~3,5 dk bütçe, ilerleme DocumentProperties’te; yeniden çalıştırınca sürer). Sheets’te marka
    “Türksab” (Pano başlığı). Kilit yok: kurulum hiçbir koruma eklemez, son adım (`korumalar`) mevcutları kaldırır; tablo
    “bağlantıya sahip herkes: görüntüleyen” paylaşılır (kullanıcı kararı 2026-10-20).
    Sayfadaki kalem süzgeci: Hepsi, Ofis, Teknoloji, Personel. Veri ucu sayfanın
    tamamını okur (sütunlar başlıkla, ızgara ay başlıklarıyla bulunur). Son veri satırının altında “Toplam (₺)” satırı:
    hesap yazımı düz değer yazar (`OpexMotor.kaynakToplami`: yalnız o sayfanın kalemleri); motor “Toplam…” satırını
    kalem/kişi saymaz. Asgari ücretlinin Tutar’ı yerel formül (`asgariNetFormulu_`). Gider tutarları satırın dövizinde görünür (`paraBicimi_`, `onEdit`);
    formül/kod sonucu hücreler mavi `#0000ff`; Pano gösterge kutuları sol hizalı, aralarında zemin boşluğu.
    Aylık ızgara (kullanıcı kararı 2026-10-20: 15 aylık plan = Ekim–Aralık 2026 + 2027’nin 12 ayı): her ay yan yana
    bir onay kutusu (“Eki 2026”; işaretsiz ay = o ay gider yok, bordroda matrah birikmez) ve bir tutar (“Eki 2026 tutar”).
    Kurulum her satırın tutar hücresine varsayılan formülü yazar (her ayda rakam görünür; 2027 zamlı/artışlı, adlandırılmış
    `p_*` parametrelerle); elle yazılan farklı tutar o aya özeldir, 0 = o ay ödeme yok. Izgarada olmayan ay (Ocak–Eylül
    2026) Ekim’de etkin satır için etkindir; Ekim’de etkin olmayan satır ilk etkin (>0) ayında başlar, öncesi yoktur
    (yeni işe giriş: matrah sıfırdan). Başlıklar metin biçimindedir (tarihe dönmez); motor tarihe dönmüş başlığı da okur. Izgara alanında yabancı
    içerik varsa Kurulum durur. Motor `aylikTl`/`aktif`/`ozel` üretir; sayfa bunu kalemler tablosunun ay sütunlarında
    gösterir (— = o ay gider yok, “özel” = o aya ayrı tutar); ızgarasız eski yanıt her ay etkin sayılır (`parseReply → aylariTamamla`). Yıl sekmelerinde seçim
    durumunu sağ üstte 3rem SVG radyo işareti gösterir (seçili yeşil `--radio-checked`, iki temada ≥ 3:1; dar ekranda rakamın
    üstüne sarılır); odak göstergesi değildir. Yalnız bu sayfa Roboto ve en küçük metin 15 CSS px kullanır (`:root[data-page='giderler']`, BaseLayout `page`);
    grafik ad etiketleri (kişi, kategori) Roboto Condensed (`--font-condensed`, `@fontsource-variable/roboto-condensed`,
    çizimden önce `document.fonts.load` ile yüklenir; uzun ad sözcük arasından sarılır, telefonda etiket sütunu ≥ %42).
  - `/notlar/` basit not ve görev listesi (TickTick benzeri): listeler, ekle, işaretle, düzenle, iki adımlı sil. Varsayılan
    notlar `src/data/notes.ts` (kullanıcının 19 Ekim notları: partner ağı, İK yönetimi); değişiklikler `istoc-plan-notlar`
    anahtarıyla yalnız o tarayıcıda saklanır.
  - `/bcg/` genel BCG matrisi eğitimi (Türkçe; kullanıcı kararı 2026-10-19: iStoc’a uygulanmaz; menüde ve sunum sırasında yok, yalnız adresle açılır): eksenler, dört kutu ve
    nakit döngüsü, stratejiler, adımlar, kurgusal çalışılmış örnek (balon matrisi), hatalar, sınırlar, alıştırmalar (`src/data/bcg.ts`).
- `SEQUENCE` sunum sırasını ve önceki/sonraki gezinmesini belirler. İçerik `src/data/*` içindedir; görünümler veriyi
  çizer. Tarih, hedef ve sayı değişiklikleri veriden yapılır; `tests/data.spec.ts` sayıların her yerde tutarlı olduğunu
  denetler (600 kayıt / 100 aktif, 136 satıcı-ay, kontrol noktaları, temsilci ve saha sayıları).
- Geniş grafikler (organizasyon, karar yetkisi, Gantt) dar ekranda kendi kaydırma bölgesinde kayar; en küçük
  genişlikler `--chart-*-min` tokenlarındadır.

## Tasarım kuralları (kaynakta uygulanmış)

- Tek token kaynağı `src/styles/tokens.css`; bileşenler sabit renk, yazı boyutu veya hareket değeri yazmaz.
- Marka: iStoc turuncusu `#FF8600` + mürekkep; varsayılan font Outfit; açık ve koyu tema, tema düğmesiyle seçilir.
- **Kavisli vurgu kenarı yasak.** Renkli vurgu çizgisi yalnız `[data-edge="start" | "top"]` kenar sistemiyle çizilir.
  Kural, çizgiyi düz pseudo-element olarak çizer ve yalnız çizginin değdiği iki köşeyi radiussuz yapar; diğer köşeler
  ve diğer bileşenlerin radiusu korunur. Vurgu için önce gölge (`--shadow-soft`) kullanılır.
- Odak: çevreleyen halka yok; yalnız Tab/Shift+Tab görünür odak modunu açar; gösterge tek kenardır (metin alt çizgisi
  veya düz sol çubuk). Tablo bölgelerinde çubuk `.table-frame` üzerinde çizilir.
- Hareket: `--motion-ease-standard: cubic-bezier(.65, 0, .35, 1)`, süre 120–320 ms; tek belgeli istisna
  `--motion-duration-loop` (800–2000 ms, Giderler yükleyicisi: sonsuz + alternate + aynı eğri; hareket azaltmada 0; kapı
  geçişte kullanımını reddeder); ECharts’ta `cubicInOut`
  ve token süresi seri, işaret çizgisi, durum (`stateAnimation`), ipucu işaretçisi ve açıklamaya ayrı ayrı yazılır
  (ECharts varsayılanları doğrusal/1000 ms’dir); hareket azaltma tercihinde animasyon kapanır. Test, çizilen
  grafiklerin modelini okuyarak bunu doğrular.
- Grafik seçenekleri kapsayıcı genişliğine göre kurulur (açıklama satır sayısı, eksen etiket genişliği); pay ve
  karma grafikleri yatay çubuktur (halka grafik dar ekranda etiketleri keser). Yazı boyutu `--text-sm` tokenından
  okunur (en az 14 CSS px, kullanıcının kök boyutunu izler); ilk çizim Outfit yüklenince yapılır. İpuçları grafik
  kutusunda kalır (`confine`). Grafik yüklenemezse kutu küçülür ve “Grafik yüklenemedi” + özet görünür.
- Grafiklerin ekran okuyucu metni kapsayıcıdaki Türkçe özettir (`role="img"`); ECharts `aria` kapalıdır. Özet, JS yoksa
  veya grafik yüklenemezse görünür yedek metindir.
- Başlık ve gezinme (kullanıcı kararları 2026-10-20/21): üst bantta logo (“iStoc”) ve altında “Pazarlama & Finansal
  Planlama”; ≥ 64em gezinme aynı satırda logo ile tema düğmesi arasında, dar ekranda logonun altında kendi satırında
  (bant ≥ 48em üstte sabit). Tema düğmesi: görünür yazı yok (adı “Koyu tema”), büyük anahtar; simge izin boş tarafında —
  açık temada beyaz izde ay, koyu temada turuncu izde güneş. Plan tarihi başlıkta yok. Kırıntı “19 Ekim” ile başlar;
  `AppFrame titleInCrumbs` ile son kırıntı sayfa başlığıdır (h1, `--text-2xl`; Giderler: 19 Ekim › Finans › OpEx ›
  Operasyonel Giderler, ayrı başlık alanı yok). Bölüm başlığı ≥ 64em’de tek satır: numara · başlık · açıklama
  (dar ekranda açıklama başlığın altında). Gezinme tek satır: “İstihdam” (organizasyon,
  rol sayfaları, istihdam takvimi) ve “Pazarlama” (90 gün hedefleri, eylem planı, MLM ağı, karar yetkisi, karar
  bekleyenler, parametreler; `MARKETING_NAV`) açılır menüleri, Giderler (OPEX), Notlar. Menüler tek bileşen (`NavMenu`,
  `NAV_MENUS`; Mantine Menu, markalı panel, oklar/Escape, odak alt çizgiyle, işaretçi modunda odak zemini yok; alçak
  ekranda panel kendi içinde kayar; JavaScript yoksa menüler yerine düz bağlantılar). Sayfa başlıkları sıkışık (`--text-title`, geniş
  ekranda üst etiket başlıkla aynı satırda): her sayfa için önceki yüksekliğe göre rol ≥ %75, diğerleri ≥ %50 az
  (`tests/ui.spec.ts → ONCEKI`, 1280 px). Rol başlığı: ad + durum, sağda görev, altta tek akışta bilgiler. Kırıntı
  satırının sağında sayfa araçları yeri (`PAGE_TOOLS_ID`).
- Giderler ilk ekranı (kullanıcı kararı 2026-10-20, yıl seçici plan ve kalemlerin altına alındı): canlı durum kırıntı
  satırında küçük şerit (nokta, kısa metin, simge düğmeler); ilk ekranda 15 aylık plan; 2026/2027 sekmeleri yıl
  bölümlerinin başında, aynı şablonda (seçim radyo noktasıyla). Aylık plan grafiği masaüstünde dikey ve alçak
  (`opex-stack`, 16rem, her ay yazılı), telefonda (grafik < 600 px) yatay ve satır sayısına göre; diğer grafikler yatay
  çubuk. Kategori ekseninde her ad yazılır (`interval: 0`); etiket sütunu adlar sığıyorsa en uzun ad kadar (ECharts
  ölçer), sığmıyorsa üst sınırda ve ad sarılır; grafik kutusu satır sayısına göre uzar (`rows`, `--chart-row-h*`: tek satır
  20 px, dar grafikte 44 px, telefonda 68 px; kısa ad — ay — için `shortLabels` 28 px; iç pay `--chart-row-pad`,
  açıklama ve değer ekseni payını `charts.ts → legendPad` hesaplar). Netten işveren maliyetine (köprü): tam genişlik,
  her adımın değeri çubuk ucunda (dar grafikte kısa “1,3 Mn ₺”), değer ekseni yok, ölçek en yüksek ara toplamda biter,
  küçük adım en az 4 px. Bordro bileşenleri ve köprü tam genişlikte (yan yana yarım genişlikte etiketler gizleniyordu).
- En küçük metin 14 CSS px, Giderler sayfasında 15 CSS px (grafik SVG metinleri dahil); en ince yazı ağırlığı 300 (kullanıcı kararı 2026-10-19); tablolar kendi kapsayıcılarında kayar; sayfa yatay taşmaz;
  bağımsız kontrol ve bağlantılar en az 44 CSS px (kaba işaretçide 48).

## Gizlilik ve yayın

- Repo herkese açıktır. Kaynak PDF’ler ve fotoğraflar repoya girmez (`.gitignore`). Üçüncü kişi adları, maaş ve bütçe
  tutarları yazılmaz. Kullanıcının açıkça siteye eklettiği değerler: İsmail Karaca adı, haftalık 5.000 ₺ Meta reklam
  bütçesi, 90 gün ≥ 3.000.000 ₺ ciro hedefi, aktif satıcı aboneliği 399 € / ay.
  19 Ekim 2026 kararlarıyla ayrıca: işveren maliyeti = maaş × 2, saha satış maaşı 60.000 ₺, saha kotası (prim eşiği)
  aylık 120.000 ₺ satış, satış başına prim 2.500 ₺, sponsor payı 500 ₺, ekip lideri liderlik farkı 10.000 ₺ ve ekip payı
  250 ₺, yapay zekâ araç bütçesi aylık en çok 7.500 ₺; asgari ücret (net, 2026: 28.075,50 ₺) çarpanları: masa başı ve
  Segika 1,25, dijital 1,25, asistan 1,5, organizatör 2. Yatırımcının adı yazılmaz (rol: “Yatırımcı”). Tahtadaki
  “Pazarlama çözümleri 30K / 90K / 500K” notu yalnız değerlendirmeydi; kullanıcı kararıyla yok sayılır, sitede yer almaz.
  Kur yalnız oran olarak (≈ 55,31 ₺/€) tutulur; kaynağındaki toplam tutarlar yazılmaz.
- Asistan kararı netleşmemiştir; asistansız senaryoda dijital pazarlama 1 Ocak 2027’de başlar. Bu koşul kişi adı
  verilmeden yazılır.
- Mesai modeli 4857 sayılı İş Kanunu tavanlarına göre (`workPeriods`, `LEGAL_LIMITS`): Dönem 1 (2 Kasım–30 Ocak)
  haftada 60 sa, Dönem 2 (1 Şubat’tan) haftada 45 sa; yıllık fazla çalışma ≤ 270 sa, günlük ≤ 11 sa. Rol saatleri
  değişirse `tests/data.spec.ts` tavanları denetler.
- Giderler (OPEX): kişi adları, ücretler, hesap e-postaları ve gider tutarları yalnız Google Sheets’tedir; sayfa onları
  çalışma anında okur ve hiçbir yere yazmaz. Kullanıcı kararı 2026-10-20: sayfa **herkese açık, anahtarsız** ve bilgiler
  eksiksiz (Sheets → Parametreler → “Sayfa erişimi: Herkese açık”; “Anahtarla” seçilirse anahtar istenir). Yayındaki
  veri ucu `src/data/opex.ts → OPEX_ENDPOINT`. Veriler yine repoya yazılmaz (kullanıcı “repoya da yazılsın”ı seçmedi). Anahtar Apps Script
  Komut dosyası özelliklerinde (`OPEX_ERISIM_ANAHTARI`); koda, repoya ve adrese yazılmaz. İlk kurulum verisi repo
  dışındaki `../opex-google/Tohum.js`; tohumlu paket `../opex-google/OPEX.gs` (`build.mjs` repo içine yazmayı reddeder,
  `.gitignore`: `Tohum.js`, `*.gs`). Testler yalnız kurgusal `apps-script/ornek/tohum.ornek.js` ile çalışır; testlerde
  gerçek tohumdaki tutarlar kullanılmaz. Anahtar varsayılan sessionStorage’da (“Bu cihazda hatırla” localStorage;
  `karacaismail.github.io` kökü paylaşıldığı için önerilmez). Sheets’ten gelen metin ECharts HTML ipucunda kaçışlanır
  (`esc`); yeni grafik biçimlendiricileri de kaçışlamalıdır (`tests/giderler.spec.ts` enjeksiyonu reddeder).
- Lisans henüz seçilmedi; kullanıcının onayı olmadan lisans eklenmez.

## Komutlar

| Amaç | Komut |
|---|---|
| Geliştirme sunucusu | `npm run dev` (adres: `http://localhost:4321/19ekim/`) |
| Tip, Astro ve UI kapısı | `npm run check` (`astro check` + `scripts/check-ui-gates.mjs`) |
| Yalnız UI kapısı | `npm run gates` |
| Üretim derlemesi | `npm run build` |
| Tarayıcı testleri | `npm test` (önce derleme; Chromium, Firefox, WebKit; `scripts/serve-dist.mjs` ile) |
| Hepsi | `npm run verify` |
| Apps Script paketi (OPEX) | `node apps-script/build.mjs --cikti ../opex-google/OPEX.gs --tohum ../opex-google/Tohum.js` (kurulum: `apps-script/README.md`) |

`scripts/check-ui-gates.mjs` şunları reddeder: token dışı hareket, `transition: all`, çevreleyen odak halkası,
14 px altı yazı, 300 altı yazı ağırlığı (CSS, tokenlar, JS ve satır içi HTML), zorlayıcı kelime bölme, radiuslu öğede iç gölge çubuğu veya renkli vurgu kenarı, eksik kenar
sistemi köşe sıfırlaması ve JS içinde sabit easing/süre. Kenarlık rengi ve kalınlığı (kısaltma ve uzun biçimler)
yalnız nötr tokenlarla yazılır: `--rule`, `--rule-strong`, `--hairline`, `--text-primary`. Tarayıcı testi ayrıca tüm sayfalarda yuvarlak köşeye değen
tek kenarlıkları, dört kenarlı kutuda farklı renkli tek kenarı ve yuvarlak öğe kenarındaki sözde öğe çubuklarını
reddeder. 320 ve 390 px’te her grafik görünür alana getirilip SVG metinlerinde kesilme (…), taşma ve çakışma aranır.
Karar bekleyenlerde karar veren yalnız İsmail Karaca veya yatırımcıdır; hazırlayan ayrı alandır (`preparer`). CI (`.github/workflows/pages.yml`) aynı kontrolleri
Pages yayınından önce çalıştırır.

## Bilinen sınırlar

- Apps Script (Sheets kurulumu, hesap yazımı, web uygulaması) CI’da çalışmaz; motor (`tests/opex-motor.spec.ts`) ve veri
  ucu (`tests/opex-script.spec.ts`) Node’da, sayfa sahte yanıtla (`tests/giderler.spec.ts`) denetlenir. Kurulum/Sheets API çağrıları Node
  testlerinde sahte nesnelerle denetlenir (tip denetimi yok); gerçek Sheets davranışı (kurulum, basit tetikleyicide
  kilit/önbellek, kesme işaretli metin, koşullu biçim) yalnız canlı tabloda çalıştırılarak doğrulanır.
- Hesaplar düz değer olduğundan satır ekleme/silme/sıralama (basit `onEdit` tetiklenmez; `onChange` kurulu tetikleyici
  ister, kullanılmaz) hesapları hemen güncellemez: sonraki değer düzenlemesi, Sheets’in açılması, açık sayfanın veri
  isteği ya da OPEX → Hesapları yenile günceller. Elle değiştirilen kod hücresi (hesap sütunu, Toplam satırı,
  hesaplanan sayfa) o düzenlemede geri yazılır. Bir düzenlemenin hesap yazımı canlıda ≈2–4 sn sürer (Apps Script
  çağrı gecikmesi); bu sırada eski değer görünür.
- Teşvik koşulları ve birlikte uygulanabilirlik mali müşavirle doğrulanmalı; 2027 yasal değerleri (asgari ücret,
  dilimler, destek) varsayımdır ve Parametreler sayfasında (teşvikler `H:P`) güncellenir. Varsayılan modelde 2027 asgari ücreti
  şirket zam oranını izler; dilimler yeniden değerleme oranı yerine yıllık TÜFE ile artar (parametreyle değişir).
- Giderler sayfasında dokunmatik/kaba işaretçi, yatay telefon ve kısa yükseklik profilleri ayrıca test edilmedi.

- Playwright WebKit ok tuşlarıyla varsayılan kaydırmayı uygulamaz; tablo ve Gantt klavye kaydırması WebKit’te `not_run`.
- Forced-colors yalnız Chromium’da emüle edilir; Firefox mobil emülasyonu yoktur.
- Görsel referans (snapshot) testleri kurulmadı; gerçek Safari/iOS/Android cihaz kontrolleri yapılmadı.
- `astro preview` Astro 7’de etkileşimsiz ortamda arka plana geçer; testler bu yüzden `scripts/serve-dist.mjs` kullanır.
