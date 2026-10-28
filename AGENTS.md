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
  **Sayfa düzeni (kullanıcı kararı 2026-10-27, ux.md §3/§9, M13 ParameterGroup, M23 ReviewAndReset, UX-14/15; paket
  P6.3):** başlık (amaç; Kayıt: yalnız bu tarayıcı · Yayın: varsayılanlar) → kayıt durumu (`.param-status`:
  “N değer varsayılandan farklı; bu tarayıcıda kaydedildi ss:dd:ss (yerel depolama)”, önceki oturumdan geliyorsa
  “kayıtlı”, depolama kapalıysa “Bu tarayıcıda kaydedilemedi (depolama kapalı): değişiklikler yalnız bu sekme açıkken
  geçerli” — “kaydedildi” yalnız gerçekten yapılan kayıt için) ve **varsayılana dön** (iki adım; onay basılınca kapsam
  yazılır `.param-reset-kapsam`: kaç alan, yalnız bu tarayıcı, senaryo seçenekleri / notlar / tema değişmez; uygulanınca
  **Geri al** düğmesi önceki değerleri geri getirir — `ModelContext.restore` —, bir sonraki değişikliğe kadar) →
  **değişiklik özeti** (`.param-degisiklikler`: alan · grup, varsayılan → yeni, “Alana git” grubu açıp alanı odaklar,
  “Bu alanı geri al”) → **arama** (`role="search"`, “Parametre ara”: etiket, yardım, birim ve grup adında; eşleşen
  gruplar açılır, eşleşmeyenler gizlenir; sonuç sayısı `aria-live`) → **görev grupları** (`PARAM_GROUPS` → Mantine
  `Accordion`, h2 içinde düğme, `aria-expanded`, panel `region`; başlıkta “n alan · k değişiklik”; hepsi kapalı gelir,
  açılışta değiştirilmiş alanı olan gruplar açık; panelde grup açıklaması ve `fieldset`) → Türetilen değerler. Grup
  numarası yok. 320×480’de belge 12.683 px’ten ≈ 2.000 px’e indi, kapalı grupta görünür girdi yok
  (`ui.spec.ts → parametreler: görev grupları…`).
- İstemci JavaScript’i: React adaları, `BaseLayout.astro` içindeki satır içi betikler (ilk renk şeması, giriş işareti,
  merkezi klavye odak modu) ve grafikler; gezinme şeridinde etkin bağlantıyı görünür alana getirme `AppFrame`’de. `Chart` bileşeni ECharts’ı (`src/scripts/charts.ts` → `echarts-setup.ts`)
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
    ayı, Ekim 2026 – Aralık 2027; rapor ayıyla kaymaz — `PLAN_ILK_AY`) — aylık plan (özet ve yığın grafik; ay ay
    toplamlar kalemler tablosunun alt satırlarında) ve kalemler (veri tablosu `KalemTablosu`, kullanıcı kararı 2026-10-21: sayfanın %90’ı genişlikte;
    başlıktan sıralama — `aria-sort` —, her sütunda arama — metin veya “>50000”, “<=1.000” sayı koşulu —, her sütunda filtre
    (başlıktaki huni, `KolonFiltresi`: metin sütunlarında sayılı değer listesi — içinde arama, Tümü / Hiçbiri —, sayı
    sütunlarında en az / en çok ve boş “—” olanlar), ayrıca tablo filtreleri paneli (kullanıcı kararı:
    sütun filtrelerinden ayrı; seçimler yalnız onay kutulu `SecimKutusu`, kutuda hap/etiket yok, özet “Hepsi” / değer /
    “N seçili”): grup, kategori, bu ay, tür, para birimi, 2027 artışı, Toplam ₺ aralığı, boş aylı ve
    özel tutarlı kalemler; ikisi birlikte uygulanır;
    “Sütunlar” panelinde ay, yıl ve personel sütun grupları gizlenir; alt satırlar — `tfoot` — süzülmüş satırlardan, gövdeden
    belirgin ayrı (kalın koyu ayırıcı, farklı zemin); eski
    personel tablosunun brüt, kesinti, işveren payı, teşvik ve fatura KDV’si plan dönemi toplamı olarak sütunlarda;
    kalem bilgisi ve ay ay tutarlar tek tabloda: Kalem · Kategori · Tutar · Bu ay · 15 ay ·
    2026 ₺ · 2027 ₺ · Toplam ₺ · 2027 artışı; altta — eski aylık gider planı tablosu — grup ara toplamları (birden çok
    grup listelenirken), toplam ve önceki aya göre değişim; Kalem sütunu ≥ 48em’de kaydırırken sabit; üç grup süzgeci; teknoloji
    sağlayıcıları). **48em altında kalemler kayıt listesidir** (P4, kullanıcı kararı 2026-10-27; ux.md §8.2 “320 px kayıt
    örneği: gider kalemi”): aynı süzülmüş, sıralı satır ve görünen sütun modeli — kabuk `useKabuk`, liste `KayitListesi`
    (`src/components/ui.tsx`), iki kabuk aynı anda mount edilmez, `.opex-veri[data-kabuk]`. Her kalem bir kayıt
    (`.opex-kayitlar .kayit`): başlıkta kalem adı + **seçili ay** tutarı — seçili ay rapor ayıdır (“Bu ay”); ay alanları
    gizliyse ya da rapor ayı ızgara dışındaysa Toplam ₺ —; açılan panelde Kategori, Tür, Tutar (kaynak para birimi), Bu
    ay, 2027 artışı, Toplam ₺, yıl toplamları, 15 ay (— = o ay gider yok), uygulanabilen personel alanları (— olanlar
    sunulmaz) ve “Faturayı aç” bağlantısı (başlık düğmesinin içinde bağlantı olmaz). Alt satırlar listenin sonunda özet
    kayıtları (`.opex-kayitlar-ozet`: grup ara toplamları, Toplam · n kalem `data-tone="total"`, Önceki aya göre; kalın
    koyu ayırıcı, gövdeden ayrı zemin). Tepsi (grup, hızlı filtreler, tablo filtreleri, Sütunlar, sayaç, Filtreleri
    temizle) iki kabukta ortak; kayıt kabuğunda ayrıca “Kalem ara” kutusu (Kalem sütunu aramasıyla aynı durum). Süzgeç
    kalemleri azaltınca durum satırında kapsam notu `.opex-veri-kapsam` “Süzülmüş toplam … (n kalem) · Genel toplam …
    (m kalem)” (dönem toplamı, iki kabukta; UX-12); boş sonuçta “Bu filtrelerle kalem yok.” ve Filtreleri temizle
    (UX-13). Açık kayıtlar kalıcı kimlikle saklanır (`kimlik`: id güvenli anahtar); kabuk değişince süzgeç, sıra, arama
    ve açık kayıtlar korunur (UX-02). Sıralama ve sütun filtreleri/aramaları yalnız tablo başlığındadır (dar ekranda
    yalnız durum korunur; bilinen sınır). “Tabloyu yatay kaydırabilirsiniz” ipucu kaldırıldı; sonra yıl seçici (iki büyük sekme, APG Tabs: **2026** rapor ayından Aralık’a, **2027** 12 ay) ve
    seçili yılın bölümleri (`donemOf`, `kisiDonem`): özet, personel giderleri (özet ve bordro grafikleri; kişi tablosu kalemlerde), netten brüte aylık bordro (kümülatif GV,
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
    durumunu sağ üstte 2.125rem SVG radyo işareti gösterir (2026-10-21: 3rem’den ≈ %30 küçük) (seçili yeşil `--radio-checked`, iki temada ≥ 3:1; dar ekranda rakamın
    üstüne sarılır); odak göstergesi değildir. Yalnız bu sayfa Roboto ve en küçük metin 15 CSS px kullanır (`:root[data-page='giderler']`, BaseLayout `page`);
    grafik ad etiketleri (kişi, kategori) Roboto Condensed (`--font-condensed`, `@fontsource-variable/roboto-condensed`,
    çizimden önce `document.fonts.load` ile yüklenir; uzun ad sözcük arasından sarılır, telefonda etiket sütunu ≥ %42).
  - `/notlar/` basit not ve görev listesi (TickTick benzeri): listeler, ekle, işaretle, düzenle, iki adımlı sil. Varsayılan
    notlar `src/data/notes.ts` (kullanıcının 19 Ekim notları: partner ağı, İK yönetimi); değişiklikler `istoc-plan-notlar`
    anahtarıyla yalnız o tarayıcıda saklanır.
  - `/bcg/` genel BCG matrisi eğitimi (Türkçe; kullanıcı kararı 2026-10-19: iStoc’a uygulanmaz; menüde ve sunum sırasında yok, yalnız adresle açılır): eksenler, dört kutu ve
    nakit döngüsü, stratejiler, adımlar, kurgusal çalışılmış örnek (balon matrisi), hatalar, sınırlar, alıştırmalar (`src/data/bcg.ts`).
  - `/applet/` ücret ve performans applet’leri (kullanıcı kararı 2026-10-27: İstihdam menüsünde takvimden sonra
    numarasız “Applet” öğesi; `APPLET_NAV`; sunum sırasında yok): fatura kesen serbest çalışan ağı için meslekten bağımsız 17 örnek model, iki motor — rütbe (sabit
    ücret: katalog, rütbe matrisi, kademe serisi, iş değerleme, taban ücret zinciri, band içi konum), zam (liyakat
    matrisi, yıllık zam, terfi kapısı, kademe adımları), efor (performans karnesi, sprint skoru, prim eğrisi, şirket ×
    takım × birey, kâr paylaşımı) ve denetim (yapı denetimi, toplam hedef nakit). Kullanıcı kısıtı: yasal çerçeve
    yazılmaz, yalnız global gerçek örnekler (GitLab, Buffer, 37signals, Codacy, Mercer, WTW, Hay, SFIA, GS, Mondragon)
    “Dayanak” satırında. İlke: sabit oran performansla düşmez; düşük performansın karşılığı prim sıfır. Tutarlar baz
    birimin katıdır (varsayılan Parametreler’deki net asgari ücret; brüt veya özel birim/döviz seçilebilir); kişiler
    kurgusal (Kişi A…). Hesaplar saf işlevlerde `src/data/applet.ts` (`tests/applet-model.spec.ts`); durum
    `src/lib/appletStore.ts` (dilim başına abonelik, yalnız varsayılandan farklı dilimler `turksab-applet` anahtarıyla bu
    tarayıcıda; “Örnek değerlere dön” iki adımlı). Katalog (meslek, uzmanlık, seviye seti) tüm applet’leri besler.
    Kullanıcı kararı 2026-10-21: bir anda tek applet görünür (sekme gibi; diğerleri çizilmez). ≥ 64em solda yapışık,
    motorlara göre gruplu yan menü (`nav` “Applet’ler”, bağlantı + `aria-current`, numara rozeti; bant gizlenince
    üste kayar), dar ekranda gruplu seçim + Önceki/Sonraki; altında sunum sayfalarındaki gibi önceki/sonraki. Her
    applet’in adresi `#<id>` (derin bağlantı, geri/ileri; #’siz adres ilk applet); menüden seçilince odak panele taşınır.
    Form parçaları `src/components/appletKit.tsx`: açılır seçim Mantine Select (markalı panel `navmenu`, açılma/kapanma
    hareket tokenıyla; `Combobox.layer.css` BaseLayout’ta), anahtar `role="switch"`. Tablo hücresindeki etiketsiz
    alanın klavye odağı sol kenarda düz çubuk (değdiği köşeler o an radiussuz), etiketsiz onay kutusunda kutunun altında
    düz çizgi; etiketli alanda etiketin alt çizgisi.
  - `/partnership/` iş ortaklığı programı (kullanıcı kararı 2026-10-27; adres İngilizce `partnership`, Pazarlama
    menüsünde “İş ortaklığı”, sunum sırasında Eylem planı ile Karar yetkisi arasında): Segika ve iStoc için iki ayrı
    90 günlük program; iki ana sekme (APG tablist, Giderler yıl sekmesi kalıbı: seçili sekme panele bitişik, radyo
    işareti) ve her programda sekiz bölüm sekmesi (Özet, Teşhis, Kime, Program, Kanal, Ölçüm, Takvim, Risk; yatay
    şerit, dar ekranda kayar, geniş ekranda sarılır). Bir anda tek program ve tek bölüm çizilir; adres
    `#<program>-<bölüm>` (derin bağlantı, geri/ileri; #’siz adres Segika · Özet); bölüm sonunda önceki/sonraki,
    programın sonunda diğer programın Özet’i. Veri `src/data/partnership.ts` → `makePartnership(params, program)`
    (model üzerinden; tarihler program başlangıcından kayar: T0 = ilk iş günü, 13 hafta, geçitler 14/30/60/90. gün =
    `startDate + 13`, `dates.day30/60/90`). İçerik dört kaynak araştırmanın (Segika ve iStoc için Claude ve ChatGPT
    web araştırmaları, 27 Ekim 2026) sentezidir; akademik atıf, kaynakça, düşünür adı ve bağlantı YOK
    (`tests/data.spec.ts` ve `tests/partnership.spec.ts` reddeder). Sayılar başlangıç tasarımıdır (14. günde gerçek
    veriyle yazılır); tutar örnekleri yalnız hesap yöntemini gösterir, gerçek tarife değildir; Segika liste fiyatı ve
    hacmi kamuya açık siteden. Grafikler: `mix` (ilk dalga ortak karması), `chain` (Segika: başvurudan yenilemeye;
    iStoc: likidite oyun kitabı), `opex-bilesim` (ekonomi örneği), `huni`, `hedef-adim` (yeni tür: geçit hedefleri,
    yatay gruplanmış çubuk, değer etiketi uçta), `gantt` (iş paketleri; geçit işaretleri; eksen sonuna yakın biten
    kısa çubukta tarih etiketi solda) ve `pay` (kapasite; `Capacity.short` kısa etiket); Mantine `Timeline` (beş
    aşama, `hire-*` sınıfları). Stil `.ortak-*` (global.css). Testler: her programın her bölümü 320/390/1280 px’te
    taşma, 14 px, 44 px hedef ve grafik metni; sekme/adres/klavye; veri tutarlılığı (huni azalan, geçit hedefleri
    artan, puan kartları 100, kapasite 52 ve 83 saat/hafta, takvim bitişik, tarih kayması).
  - `/nakit-akisi/` nakit akış tablosu (kullanıcı kararı 2026-10-27; “Giderler” açılır menüsünde — kullanıcı kararı
    2026-10-27: üst gezinmede Giderler artık bir menüdür, `FINANCE_NAV`: Giderler (OPEX), Nakit akış tablosu; `COMMON_NAV`
    yalnız Notlar —, sunum sırasında Giderler’den sonra, kırıntı “Finans › Nakit akış tablosu”, başlık kırıntıda). Klasik
    düzen: nakit girişleri, nakit çıkışları, net nakit akışı, dönem başı ve dönem sonu nakit; Sheets ızgarasının 15 ayı
    (Ekim 2026 – Aralık 2027, `CASH_MONTHS`). İki kaynak: **çıkışlar** Google Sheets’ten (sayfa açılınca tek istek,
    `useOpexOnce` (`src/lib/useOpex.ts`) → `requestOpex`; Giderler’deki canlı yoklama yok) kategori bazında — kalemlerin
    `aylikTl` toplamı, bordrolu personel `maliyet` (teşvik düşülmüş), freelancer faturaları — artı plan parametrelerinden
    Meta reklam bütçesi ve satış primi (seçili senaryonun yeni aktif satıcısı × prim: üst sınır); **girişler** gelir
    planının senaryo serilerinden (kullanıcı kararı 2026-10-27: kötümser · medyan · iyimser her yerde): ilk ödemeler
    (aylık + yıllık peşin) ve yenilemeler aynı simülasyondan, Ekim 2026 boş (program Kasım’da başlar); yatırım girişi
    (`investmentAmount`, `investmentDate`) ve başlangıç nakdi (`openingCash`; Parametreler → “Nakit akışı” grubu). Veri
    `src/data/cashflow.ts` → `makeCashflow(params, program, revenue)` (model gelir planını önce kurar; `seri[senaryo]`) +
    `buildCashflow(plan, opexModel | null, senaryo = 'medyan')` (Sheets yoksa yalnız plan kalemleri; durum notu Giderler
    sayfasına bağlar; `toparlanma`: negatife düşen nakdin sıfırın üstüne çıktığı ay). Senaryo seçici (`SenaryoSecimi`,
    `src/components/Senaryo.tsx`; `useScenario` → localStorage `istoc-plan-senaryo`, gelir planıyla ortak) özet,
    karşılaştırma tablosu, grafik ve tablo başında; “Üç senaryo: 15 ayın özeti” tablosu (seçili satır
    `data-tone="secili"`); grafik görünümü `ModSecimi`: seçili senaryo (`nakit-ay`) ya da üçü üst üste (`kumulatif-tl`:
    üç senaryonun dönem sonu nakdi, sıfır çizgisi; seçili olmayanlar kesikli). Basit görünüm dört satır; “Ayrıntılı
    görünüm” anahtarı (`role="switch"`, `.nakit-anahtar`) kalemleri, ara toplamları ve dönem başı nakdi açar; Kalem sütunu
    sabit. Özet: 15 ay toplam giriş/çıkış/net, en düşük nakit ve ayı, nakit açığı tavanı (dönem sonu nakdi sıfırın
    altına düşürmeyen en küçük ek nakit). Grafik `nakit-ay` (geniş ekranda dikey giriş/çıkış çubukları + dönem sonu
    nakit çizgisi; dar ekranda yatay çubuk + işaret; dar ekranda kutu `--chart-h-xxl`). KDV, SGK/vergi ödeme gecikmesi ve
    sponsor/ekip lideri payı modellenmez (varsayımlar bölümünde yazılı). Testler: `tests/nakit.spec.ts` (sahte Sheets
    yanıtı, anahtar, senaryo seçici ve karşılaştırma, üst üste görünüm, menü, 320/390/1280, grafik) ve
    `tests/data.spec.ts` (girişler senaryo serileriyle aynı, Sheets kategori toplamları = aylık toplamlar, nakit zinciri,
    senaryo yalnız giriş ve primi değiştirir, yatırım/başlangıç nakdi). **Ana sonuç** (P6.2, M05; `ResultSummary`):
    sayfa başlığının altında, Özet bölümünden önce — “Sonuç · [senaryo]”, dönem, **nakit açığı tavanı** (₺) ve
    açıklaması, durum (iyi: hiç negatife düşmüyor; uyarı: en düşük ay + toparlanma ayı + gereken ek nakit; risk: dönem
    sonuna kadar sıfırın üstüne çıkmıyor), ardından senaryo seçici (eylem), üç senaryoda aynı ölçü (seçili işaretli),
    ikincil göstergeler (en düşük nakit, toparlanma, dönem sonu nakit, 15 ay net) ve kaynak satırı (Sheets okunamadıysa
    “yalnız plan kalemleri … tablo eksiktir”: eksik veri tam plan gibi görünmez). Değer özet kutusu ve karşılaştırma
    tablosuyla aynıdır (`nakit.spec.ts → ana sonuç`); 320×480’de kaydırmadan görünür.
  - `/gelir-plani/` gelir planı (kullanıcı kararı 2026-10-27; Pazarlama menüsünde 90 gün hedeflerinden sonra, sunum
    sırasında da). **UX-first yeniden kurulum (kullanıcı kararı 2026-10-27: “seçenekleri en başta seçeyim, kalan tüm veri
    tek seferde değişsin; hazır seçenek kümeleri; seçili senaryonun özeti kaydırırken üstte sabit; enterprise olgunluk”):**
    sayfanın başında **senaryo kurucu** (`src/components/SenaryoKurucu.tsx`: hazır senaryolar — kötümser · medyan ·
    iyimser ve dört örnek bileşim saha ağırlıklı / dijital ağırlıklı / tutumlu / yatırımlı büyüme (`presetsOf`,
    `src/lib/scenarioOptions.ts`) — tek dokunuşla tüm seçenekleri kurar; “ayrıntılı seçenekler” ızgarası (geniş ekranda
    açık, dar ekranda kapalı gelir; `aria-expanded`): kapasite çarpanı, elde tutma, yıllık peşin payı, aylık ücret, ikinci
    saha ayı, ek saha, saha büyümesi, satıcı kazanım reklamı, reklam ölçeklenmesi, kur artışı, gider kaynağı, ek sabit
    gider, satış primi; bir seçenek değişince senaryo “Özel: temel + n değişiklik” olur; “Seçenekleri sıfırla”;
    “Bağlantıyı kopyala”). **Tek durum** `useScenarioOptions` (temel senaryo `istoc-plan-senaryo` nakit akışı ve istihdam
    takvimiyle ortak; seçenekler `istoc-plan-senaryo-secenekler`; adres çubuğu `?senaryo=…&kapasite=…&eksaha=…`
    paylaşılabilir bağlantı, açılışta adres > saklanan > varsayılan; `history.replaceState`). **Ana sonuç** (kullanıcı kararı 2026-10-27, ux.md §5.4/M05, paket P6.2;
    `ResultSummary`, `src/components/ResultSummary.tsx`, `.sonuc`): sayfa başlığının hemen altında, kurucudan **önce**
    (sıra: amaç → bağlam/senaryo + sonuç → eylem → veri; seçenek değişince şerit ve blok anında değişir) — başında
    **yapışkan özet** (`YapiskanOzet`, `.yapiskan`: `position: sticky`, geniş ekranda `--bant-h` altında; `role="status"`
    `aria-live`; senaryo adı rol tonunda + 100 aktif, ciro hedefi, ufuk sonu gelir, başabaş, geri ödeme, fon ihtiyacı
    çipleri; dar ekranda yatay kayar; `.wrap` içinde doğrudan durur, bloğun içine alınmaz), altında blok: “Sonuç ·
    [senaryo hapı]”, dönem (19 Ekim 2026 – Aralık 2027 · 15 ay), öncelikli değer **en çok fon ihtiyacı** (₺, sol kenar
    senaryo tonu) ve açıklaması (en düşük ay, ufuk gelir/gider/net, gider kaynağı), **durum** (`.sonuc-durum[data-ton]`:
    iyi = aylık başabaş tarihi + geri ödeme; uyarı = eğilimle ≈ tarih; risk = “Kapanmıyor… sürdürülebilir değil”) —
    kritik risk hiçbir zaman gizlenmez —, kıyas (hazır senaryolarda aynı ölçü, seçili işaretli; özel senaryo dördüncü
    satır), ikincil göstergeler (şeritteki çiplerle aynı dizi: tek kaynak). 320×480’de değer kaydırmadan tam görünür
    (`gelir.spec.ts → ana sonuç`); bu yüzden başlıkta Paket satırı yok (fiyat “Fiyat” bölümünde). Kurucu sonucun
    altındadır (kullanıcı kararı 2026-10-27 “seçenekler en başta” korunur: ilk bölümden önce). Bütün bölümler, tablolar ve grafikler bu tek durumdan `computeBreakeven`
    (`inputsOf`) ile hesaplanır; bölüm/tablo/grafik çubuklarında seçici değil senaryo etiketi (`.araclar-etiket`) ve
    görünüm anahtarları (`ModSecimi`, Eksen) vardır. **Takvim** (kullanıcı kararı 2026-10-27): tüm senaryolar
    `simStartDate` (19 Ekim 2026) ile başlar, `firstSaleDate` (6 Kasım 2026) öncesi satışa bağlı gelir 0 ₺ (`saleFactor`:
    o ay kalan gün oranı), ufuk `simEndDate` ayı sonu (Aralık 2027): `horizonOf` = 15 ay, nakit akış tablosuyla aynı
    ızgara; hedef günleri 19 Ekim’den; “Ufuk dışında” yerine “2027 sonuna kadar değil”. CSV dışa aktarma
    (`src/lib/csv.ts`, noktalı virgül, BOM): aylık tablo ve kadro tablosu. Hedefler sayfası 90 günde 100 aktif satıcıyı
    hedef koyar; bu sayfa aynı hedefe kadro kapasitesinden bakar: 1 saha personeli (ikincisi “sistem oturunca”,
    `secondSahaDate`), 1 CRM masa başı, organizatör (Aralık’tan), dijital pazarlama (satıcı kazanım reklamı + organik
    içerik) ve bağımsız temsilciler (ayda `repPerMonth` yeni, en çok `repCap`) ayda kaç yeni aktif satıcı getirir
    (`sahaActivesMonthly`, `crmActivesMonthly`, `organizatorActivesMonthly`; her kişinin ilk ayı %50, ikinci ayı %75,
    kendi başlangıç ayından). Üç temel senaryo (adları sabit): **kötümser** (`pessimisticFactor`,
    `pessimisticRetention`, büyüme yok), **medyan** (tam kapasite, plan elde tutma, her 6 ayda +1 saha), **iyimser**
    (%130, +10 puan, her 4 ayda +1 saha). Segmentli anahtar `Choice` (tek iz, ölçülerek kayan topuz, rol tonlu, `title`
    yok, görünür not) ve araç çubuğu `Araclar` (`data-edge="bottom"`, alt köşeler düz, `check-ui-gates` tanır).
    Grafik görünümü (`ModSecimi`: seçili / hazır senaryolar üst üste — kötümser, medyan, iyimser kendi seçenekleriyle,
    özel senaryo dördüncü eğri): kaynak × ay ↔ `seri-cizgi`, `gelir-ay` ↔ `grup-ay`, `huni` ↔ `hedef-adim`; “Hazır
    senaryolar üst üste” bölümü (`kumulatif-tl` + hedef çizgisi, `seri-cizgi` ödemeye devam eden; seçili olmayanlar
    kesikli, tabloda seçili satır `data-tone="secili"`). Hedef zinciri (ilk 10 → 50 → 100 aktif → 500 üye → 1 M₺ → ciro
    hedefi → 200 aktif): tarih (ay içinde doğrusal), başlangıçtan ve önceki hedeften süre (`sure`), o ayın geliri,
    kümülatif, hazır senaryoların tarihi kartta. Gelir = yıllık peşin ödeyenler (`annualShare`) × yıllık ücret + aylık
    ödeyen satıcı-ay × aylık ücret (o ayın ₺ fiyatıyla); aktif satıcı = ilk ödeme (hedefler sayfasıyla aynı tanım),
    “ödemeye devam eden” ayrı. Veri `src/data/revenue.ts` → `makeRevenue(params, program)` (`revMonths(params)`;
    `simulate(params, program, months, inputs)` serbest girdili simülasyon: kapasite çarpanı, elde tutma, yıllık payı, €
    ücret, ikinci saha ayı, `extraSaha`, `dijitalBudget`, `dijitalScale`, `fxGrowth`, `sahaGrowthEvery`, `exclude`
    kaynak ayıklama; `buildSources(p, prog, months, inputs)`, `adSchedule`, `priceSeries`, `growthHires`,
    `adCapacity`, `ltvOf`; `funnels`, `monthlyOnly`, `first3` senaryo başına; `inputsFor`, `sourcesFor(sc)`).
    Kaynaklar: saha1, saha2, (sahaEk), (sahaBuyume), crm, org, dijital (reklam + organik tek kaynak), rep.
    **Büyüme modeli** (kullanıcı kararı 2026-10-27: “gelirin artmadığı işletme batar; ya ileri ya geri”, düz çizgi
    yok): ₺ fiyat kurla her ay bileşik büyür (`eurTryGrowth` %/yıl; € sabit), temsilci ağı her ay `repPerMonth` büyür
    (`repCap`’e kadar), satıcı kazanım reklam bütçesi LTV ÷ CAC ≥ 3 ise her 3 ayda ×1,5 ölçeklenir (`SCALE_RULE`,
    tavan `dijitalScaleMax`; kayıt ve aktif bütçeyle orantılı), kârlı senaryolarda ikinci sahadan sonra periyodik ek
    saha personeli gelir (`Scenario.sahaGrowthEvery`: kötümser 0, medyan 6, iyimser 4; üst sınır `sahaMaxCount`; kaynak
    `sahaBuyume`, kadro tablosunda “Büyüme” satırı). Parametreler → “Büyüme” grubu. Nakit akışında reklam satırı
    senaryonun ölçeklenmiş bütçesidir (`CashSeries.reklam`).
    **Kadro: görev, gider, gelir katkısı** (kullanıcı kararı 2026-10-27: istihdam planı görevlerine göre giderler ve
    gelirler senaryolara yedirilir): `src/data/staffing.ts` → `makeStaffing(params, program, revenue, girdi?)`;
    `staffRoles` on rol (saha 1, saha 2, [ek saha], CRM, organizatör, dijital pazarlama uzmanı, satıcı kazanım reklamı,
    asistan, Segika CRM, ekip lideri farkı, temsilciler) ile görev, katkı yolu, aylık net maaş, aylık sabit maliyet
    (maaş × `costFactor`; reklam: bütçe), başlangıç; `staffScenario` her senaryoda 18 ay gider, yeni aktif ve **katkı =
    ayıklama** (o kaynak olmasaydı kaybedilecek gelir: `exclude`, reklam için `dijitalBudget: 0`, organik = dijital −
    reklam; model doğrusal → katkılar toplamı = 18 ay gelir), net ve katkı ÷ gider; dolaylı roller (asistan, Segika,
    lider) katkısız, giderli (`data-tone="total"`); `staffCosts` plan kadrosu gideri (başabaş); `staffingSheet` Google
    Sheets için düz tablo. Gelir planı 2. bölümde (tablo seçili / üç senaryo sütunları, `hedef-adim` rol × senaryo bin
    ₺) ve `/istihdam/` 3. bölümde (aynı tablo, ortak seçim).
    **Dijital pazarlama stratejisi: gider → gelir** (kullanıcı kararı 2026-10-27): `src/data/digitalStrategy.ts` →
    `makeDigitalStrategy`; parametreler “Dijital pazarlama: gider → gelir” grubu (`dijitalAdBudgetMonthly`,
    `dijitalCostPerLead`, `dijitalLeadToActive`, `dijitalAdStartDate`, `dijitalOrganicActivesMonthly`,
    `dijitalOrganicStartDate`). Zincir: bütçe ÷ kayıt maliyeti = kayıt; × dönüşüm × kapasite çarpanı = yeni aktif; CAC =
    bütçe ÷ yeni aktif; LTV = (1 − yıllık pay) × aylık ücret ÷ (1 − elde tutma) + yıllık pay × yıllık ücret; karar kuralı
    LTV ÷ CAC (≥ 3 bütçeyi artır, 1,5–3 koru, < 1,5 durdur). Altı kanal (Meta lead formu, Google Arama, organik içerik,
    CRM yaşam döngüsü, alıcı tarafı SEO, Meta işe alım), bütçe kademeleri (0 / 15 / 30 / 60 / 120 bin ₺ + parametre; 12
    ayda kayıt, aktif, gider, bütçe ayıklamasıyla katkı, net, CAC, LTV ÷ CAC; `hedef-adim` üç senaryo), takvim (kurulum →
    test → içerik makinesi → ölçek kararı), haftalık/aylık KPI, kurallar. Reklam bütçesi nakit akışında “Satıcı kazanım
    reklamı (plan)” çıkışı ve başabaşta giderdir; içerik üretim hattı /dijital/ sayfasında kalır.
    **Başabaş** bölümü (kullanıcı kararı 2026-10-27: “çok ayrıntılı, çok koşullu; üstünde filtreler”):
    `src/data/breakeven.ts` → `computeBreakeven(params, program, revenue, senaryo, filtreler, opexModel | null)`;
    filtreler sayfa durumudur (parametre değil): senaryo, kapasite çarpanı, elde tutma, yıllık peşin payı, aylık ücret,
    ikinci saha ayı (“Gelmez” dahil), **ek saha personeli** (0–3; ikinciyle aynı ay; hem kapasite hem maliyet), **satıcı
    kazanım reklamı** (yok / ½ / parametre / 2× / 4×; hem kayıt hem gider), gider kaynağı (Sheets canlı — `useOpexOnce`,
    2028 ayları 2027 ortalaması; Sheets’te olmayan Meta işe alım reklamı, satıcı kazanım reklamı ve ikinci/ek saha
    personelinin işveren maliyeti seçilen aydan eklenir (kullanıcı geri bildirimi 2026-10-27: “ikinci saha seçince gider
    çizgisi değişmiyordu”) — ya da plan kadrosu: `staffCosts` + YZ + Meta + reklam; Sheets okunamazsa plana düşer), ek
    sabit gider, satış primi; “Varsayılana dön”. Çıktılar: aylık başabaş (`crossing`), geri ödeme, en çok fon ihtiyacı,
    klasik başabaş noktası (adet) ve ulaşma ayı, duyarlılık ızgarası (`sensitivity`), **öngörü** (`ongoru`: ufuk
    içinde kesişim yoksa son 6 ayın en küçük kareler eğimiyle tahmini başabaş tarihi ve son ayın netiyle geri ödeme
    tarihi; `yon` ileri/geri/sabit — “Ufukta yok” yazılmaz, kullanıcı kararı 2026-10-27: ya “≈ tarih” ya “Kapanmıyor:
    aylık açık X, büyüyor/daralmıyor, sürdürülebilir değil”), ek filtreler reklam ölçeklenmesi, kur artışı, saha
    büyümesi (`inputsOf(p, rev, senaryo, f)` filtreleri simülasyon girdisine çevirir), **filtrelerin etkisi** tablosu
    (varsayılan girdilere göre ufuk (24 ay) gelir/gider/net, yeni aktif, başabaş, geri ödeme, fon ihtiyacı farkı: bir saha
    personeli gideri ve kapasiteyi birlikte değiştirir). Grafikler `basabas`, `kumulatif-tl` (sıfır çizgisi; seçili /
    üçü üst üste), `basabas-adet` (etiketler `markPoint`; `MarkPointComponent` `src/lib/echarts-setup.ts`’de kayıtlı —
    kayıtsız bileşen sessizce çizilmez). Aylık gelir/gider grafiğinin çubuğunda sağda **Eksen** anahtarı (kullanıcı
    kararı 2026-10-27): Aylık ↔ Kümülatif (`basabas` spec `names`; kümülatif eğriler kesişince geri ödeme
    işaretlenir); `.araclar > .secim + .secim` sağa yaslanır. Görünüm: hedef kartları (`.gelir-hedef`), Mantine `Timeline`, `.secim*`,
    `.araclar`, `.filtreler`. Testler: `tests/gelir.spec.ts` (dokuz bölüm, on grafik, seçici her bölüm/tablo/grafikte,
    segmentli topuz konumu ve hareketi, araç çubuğu kenarı, seçim sayfa geneli + saklama + nakit akışı ve istihdam
    takvimine yansıma, üst üste görünümleri, başabaş filtreleri ve filtre etkisi, dijital strateji ve kadro katkısı,
    320 px), `tests/data.spec.ts` (rampa, gelir formülü, hedef sırası, senaryo adları, dijital kanal; başabaş: plan/Sheets
    gider kaynakları ek saha ve reklamla, kesişimler, filtre ezme, adet noktası, duyarlılık; istihdam planı: on rol,
    katkıların toplamı = gelir, dolaylı roller, Sheets tablosu; dijital strateji: zincir, kademeler).
- `SEQUENCE` sunum sırasını ve önceki/sonraki gezinmesini belirler. İçerik `src/data/*` içindedir; görünümler veriyi
  çizer. Tarih, hedef ve sayı değişiklikleri veriden yapılır; `tests/data.spec.ts` sayıların her yerde tutarlı olduğunu
  denetler (600 kayıt / 100 aktif, 136 satıcı-ay, kontrol noktaları, temsilci ve saha sayıları).
- Geniş grafikler (`Chart wide`: organizasyon ve karar yetkisi şemaları, Gantt’lar, son tarih grafikleri, BCG örnek
  matrisi) dar ekranda (< 48em) **kaymaz** (P5, kullanıcı kararı 2026-10-27, ux.md §8.1, M20/M21): `Chart` kapsayıcıyı
  `DataTable` kalıbıyla ölçer ve aynı spec’ten eşdeğer listeyi çizer — ikinci bir hesap yok; iki kabuk aynı anda mount
  edilmez, ölçülmeden hiçbiri mount edilmez (`figure.chart[data-kabuk="grafik" | "esdeger"]`). Eşdeğerler
  (`src/components/ui.tsx → grafikEsdegeri`): `gantt` ve `deadlines` → **tarihli ajanda** (`Ajanda`, `.ajanda`: görevler
  başlangıç tarihine göre, ay başlıkları yıl taşır, kontrol noktaları — Gantt’ın kesikli çizgileri — kesikli ayraç olarak
  araya girer, her maddede tarih aralığı + sorumlu çipi + kilometre taşı, açıklama açılır panelde (kayıt sözleşmesi: h4
  içinde düğme, `dl` alanları Tarih · Sorumlu · Açıklama); açıklaması olmayan tek tarihli maddeler düz liste
  `data-tur="tarih"`); `org` ve `gov` → **dikey hiyerarşi** (`Hiyerarsi`, `.hiyerarsi`: iç içe `ul`, alt düğümler üst
  düğümün `li`’si içinde, rol tonlu kutu `data-edge="start"`, bağlantılı düğüm rol sayfasına gider, ≥ 44 px); `bcg-num` →
  **kutuya göre değerler** (`Degerler`, `.degerler`). Ölçü kapsayıcıdır (DataTable gibi): 768 px dikey tablette sayfa
  kenar boşlukları düşülünce kapsayıcı 48em’den dardır, eşdeğer liste çizilir; kapsayıcı ≥ 48em’de (≈ ≥ 850 px görünüm)
  ECharts aynen, grafik asgari genişliğinden darsa yalnız kendi kutusunda kayar (`.chart-scroll`, `role="region"`, ok
  tuşları); en küçük genişlikler `--chart-*-min` tokenlarındadır. “Grafiği yatay kaydırabilirsiniz” notu kaldırıldı. Olağan iş tabloları da dar ekranda kaymaz, kayıt
  listesine dönüşür.

## Tasarım kuralları (kaynakta uygulanmış)

- Tek token kaynağı `src/styles/tokens.css`; bileşenler sabit renk, yazı boyutu veya hareket değeri yazmaz.
- Marka: iStoc turuncusu `#FF8600` + mürekkep; varsayılan font Outfit; açık ve koyu tema, tema düğmesiyle seçilir.
- **Kavisli vurgu kenarı yasak.** Renkli vurgu çizgisi yalnız `[data-edge="start" | "top" | "bottom"]` kenar sistemiyle
  çizilir; kural çizgiyi düz pseudo-element olarak çizer, değdiği iki köşe her durumda radiussuzdur. Vurgu için önce gölge
  (`--shadow-soft`) kullanılır.
- **Köşe sözleşmesi (kullanıcı kararı 2026-10-27, `docs/ux.md` §6.3):** yüzey, kontrol ve kaplama köşeleri 0
  (`--radius-surface`, `--radius-control`, `--radius-overlay`; Mantine `theme.radius` xs–lg bunlara bağlı,
  `defaultRadius` md). Yalnız **hap** (kısa durum etiketi: `.chip`, `.opex-state`, `.opex-pill`, `.yapiskan-ad`,
  `.bcg-flow-chip`, `.ortak-bolum-program`) `--radius-pill`, **anahtar** izi ve topuzu (`.theme-track/thumb`,
  `.*-anahtar-iz/top`) `--radius-switch`, yazısız **nokta işareti** (sözde öğe, `.opex-dot`, `.opex-live-dot`) `50%`
  kullanır. Eski “diğer radiuslar korunur” kabulü kalktı (ux.md §1.3): numara rozetleri, avatarlar, segmentli anahtar,
  gezinme öğeleri, sekmeler ve kartlar köşelidir; Mantine `Timeline` `radius={0}`. Başka yüzey için köşe istisna kaydı
  (aşağıdaki sözleşme bölümü) ve kullanıcı onayı gerekir; kapı (`check-ui-gates`) kaynağı, `tests/ui.spec.ts → köşe
  sözleşmesi` hesaplanmış stilleri 320 ve 1280 px’te denetler.
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
- Başlık ve gezinme (kullanıcı kararları 2026-10-20/21): üst bantta logo (Türksab yazı imi “TURKS/AB”, ekran okuyucuya
  “Türksab”; kullanıcı kararı 2026-10-21). Logo metin değil, turksab.com logosu ölçülerek çizilmiş SVG’dir
  (`BrandMark.tsx`): harfler Roboto 900 dış hatları (orijinal gövde kalınlığı büyük harf yüksekliğinin ≈ %24’ü), her harf
  orijinaldeki ağırlık merkezinde; kırmızı eğik çizgi kalın paralelkenar (yatay kalınlık ≈ %24, eğim ≈ %35, renk
  `--brand-slash`, açık temada orijinalin #fe0000’ı). Boyut `--brand-mark-h` (büyük harf yüksekliği); “/” karakteri veya
  site fontuyla yazı imi kullanılmaz (ince ve orijinale aykırı) ve altında “Pazarlama & Finansal
  Planlama”; ≥ 64em gezinme aynı satırda, başlığın tam ortasında (üç sütunlu ızgara:
  logo · gezinme · tema düğmesi), 48–64em logonun altında güvenli ortalamayla (`safe center`) kendi satırında
  (bant ≥ 48em üstte sabit). **Dar ekranda (< 48em; kullanıcı kararı 2026-10-27, ux.md §3, M01/M02) yatay kayan şerit
  yok:** markanın altında “Menü” düğmesi (`.cekmece-tetik`, `aria-haspopup="dialog"`), tam gezinme sağdan açılan
  çekmecede (`CekmeceGezinme`, Mantine `Drawer`: `size="min(20rem, 100%)"`, odak tuzağı, Escape, kapanınca odak
  düğmeye döner, sayfa kaydırması kilitli; süre `--motion-duration-base`, eğri hareket tokenı; stil `.cekmece*`,
  BaseLayout `Overlay/ModalBase/CloseButton/Drawer.layer.css`). İçerik üç grup (İstihdam 1–7 + takvim + Applet, Pazarlama,
  Giderler) ve Notlar = 20 bağlantı; etkin sayfa `aria-current`, bölümü `data-section`. Kabuk `useMediaQuery('(min-width:
  48em)')` ile seçilir; şerit ve çekmece aynı anda mount edilmez. Testler `tests/ui.spec.ts` (320–390 px çekmece,
  768 px şerit, dokunmatik 48 px, 667×375 alçak ekran), `tests/giderler.spec.ts` (canlı durum Menü düğmesinin altında). Tema düğmesi: görünür yazı yok (adı “Koyu tema”), büyük anahtar; simge izin boş tarafında —
  açık temada beyaz izde ay, koyu temada turuncu izde güneş. Plan tarihi başlıkta yok. **Sayfa başlığı tek kalıp (kullanıcı kararı 2026-10-27, ux.md §3/§5.4, M03; paket P6.1):**
  `PageHeader` (`src/components/PageHeader.tsx`) kırıntı satırını ve başlığı birlikte çizer — kırıntı “19 Ekim” ile
  başlar, son kırıntı sayfanın **tek h1**’idir (`.crumbs-title`, `--text-crumb-title`; Giderler için verilen 2026-10-21
  kararı — 19 Ekim › Finans › OpEx › Operasyonel Giderler, ayrı başlık alanı yok — sayfa geneline yayıldı; eski hero,
  turuncu üst etiket ve `AppFrame titleInCrumbs` kalktı). Altında **bir cümlelik amaç** (`purpose`, `.page-purpose`) ve
  **dönem/kaynak satırı** (`meta`, `.page-meta`: Dönem, İlk satış, Paket, Kaynak, Kayıt…); ≥ 48em’de sığarsa amaç ve dönem
  satırı yan yana. Rol sayfasında simge + ad + durum hapı aynı kırıntı öğesinde, görev (`role.mission`, veri) amaç
  satırında, kişi/başlangıç/bağlı/ücret/aranan dönem satırında. SEQUENCE dışı sayfalarda (BCG, applet, e-posta, arşiv,
  404) ve ana sayfada kırıntı yolu yok, h1 satırda tek başına. Giderler’de amaç satırı yok (ilk ekran kararı 2026-10-21).
  Kırıntı satırı `.wrap` içinde doğrudan durur (yapışkan kalması için ayrı kapsayıcı yok); iki kutu `data-page-header`
  taşır ve testler ikisini birlikte ölçer. Kullanıcı kararı 2026-10-21: kırıntılar %10–20 büyük (`--text-crumb`: 1rem,
  Giderler 1.0625rem), başlık %10–20 küçük (`--text-crumb-title`, en çok 1.7rem). **Bölüm başlığı** (ux.md §3, P6.1):
  tek ana başlık + açıklama; üst çizgi hairline (`--rule`; kalın mürekkep çizgisi yok), numara ikincil renkte
  (`--text-secondary`) ve yalnız sırası anlamlı bölümlerde (`Section index` isteğe bağlı; Parametreler grupları ve nakit
  akışı bölümleri numarasız); ≥ 64em’de tek satır: [numara ·] başlık · açıklama (dar ekranda açıklama başlığın altında).
  Gezinme tek satır: “İstihdam” (organizasyon,
  rol sayfaları, istihdam takvimi) ve “Pazarlama” (90 gün hedefleri, eylem planı, MLM ağı, karar yetkisi, karar
  bekleyenler, parametreler; `MARKETING_NAV`) ve Giderler (OPEX, nakit akış tablosu; `FINANCE_NAV`, kullanıcı kararı 2026-10-27) açılır menüleri, Notlar. Menüler tek bileşen (`NavMenu`,
  `NAV_MENUS`; Mantine Menu, markalı panel, oklar/Escape, odak alt çizgiyle, işaretçi modunda odak zemini yok; alçak
  ekranda panel kendi içinde kayar). Sayfa başlıkları sıkışık: her sayfa için önceki
  yüksekliğe göre rol ≥ %75, diğerleri ≥ %50 az (`tests/ui.spec.ts → ONCEKI`, 1280 px; 2026-10-27’den beri kırıntı
  satırı + amaç/dönem satırı birlikte ölçülür ve eski hero değerine o günkü 44 px kırıntı satırı eklenir). Kırıntı
  satırının sağında sayfa araçları yeri (`PAGE_TOOLS_ID`; Giderler döviz kurları), üst bantta tema düğmesinin solunda
  bant araçları yeri (`HEADER_TOOLS_ID`; Giderler canlı durumu). Bant araçları telefonda (< 48em) gezinmenin altında
  kendi satırında (marka ile tema düğmesi ilk satırda kalır), tablette ilk satırda; ≥ 64em’de üç sütunlu ızgaranın sağ
  sütununda (yan sütunlar `minmax(max-content, 1fr)`: sığdıkça gezinme tam ortada, sığmazsa üst üste binmez); bant
  araçları varken 64–80em’de gezinme kendi satırına iner.
- Kullanıcı kararları 2026-10-21 (başlık ve menü): üst gezinme öğelerinde simge (`mainnav-icon`; İstihdam, Pazarlama,
  Giderler, Notlar) ve aralarında ince dikey ayırıcı; simgeli etkin öğede nokta yok. İstihdam menüsü 1–7 sıralı
  numaralı, roller pozisyon adıyla (Organizasyon şeması — şema sayfası, pozisyon değil —, Dijital pazarlama uzmanı, İstoç Pazarlama CRM uzmanı, Saha satış
  uzmanı, Organizatör, Segika CRM, Asistan; `TREE_NAV`); numarasız öğelerde aynı sade nokta (`navmenu-bullet`, rozet
  genişliğinde, yazılar hizalı); numara ile yazı arası `--space-3` (Mantine öğe etiketinde, `navmenu-item-label`).
  Bant yapışıkken (≥ 48em ve ≥ 40em yükseklik) aşağı kaydırınca gizlenir, yukarı kaydırınca veya odak banda girince
  görünür (`data-bant-gizli`, `--bant-h`, AppFrame); kırıntı satırı (sayfa başlığı, Giderler kurları) üstte yapışık,
  zemini tam genişlikte, kaydırılınca tam genişlikte alt çizgi. Tema değişimi ani değil: görünüm geçişiyle çapraz
  solma (`--motion-duration-theme` 320 ms, simetrik eğri), anahtar canlı kalır ve kayar (Mantine `keepTransitions`);
  `aria-pressed` anında; görünüm geçişi yoksa veya hareket azaltılmışsa anında değişir.
- Giderler ilk ekranı (kullanıcı kararı 2026-10-20, yıl seçici plan ve kalemlerin altına alındı): canlı durum küçük
  şerit (nokta, kısa metin, simge düğmeler), kullanıcı kararı 2026-10-21 ile üst bantta tema düğmesinin solunda;
  gezinme ortalı kalsın diye ≥ 64em’de “Sheets ss:dd:ss · anlık” yazısı görünmez (ipucunda ve ekran okuyucuda), tablette
  görünür, telefonda düğmeler tek satırda ve en dar ekranda “Sheets” sözcüğü gizli. Döviz kurları (USD/TRY, EUR/TRY)
  kırıntı satırının sağında, başlık hizasında (`.opex-kur`); Kalemler veri tablosunun üstünde başlık ve açıklama yok
  (kalıcı), yalnız ayırıcı (`.opex-ayrac`; tablonun adı bölgede `aria-label`); tablo ile Teknoloji sağlayıcıları grafiği
  arasında ayırıcı (`.opex-ayrac-arada`). Filtre tepsisi (`.opex-tepsi`) tablonun eklentisi: hemen üstüne bitişik,
  çökük yüzeyde, birleşen köşeler düz; içindeki düğmeler yükseltilmiş yüzeyde. Araç satırında grup düğmeleri, hızlı
  filtreler (`HIZLI`: anahtar — Dövizli, Teşvikli, Bekleyen [bu ay ödeme takibi varken]; onay kutusu — Boş ay, Özel
  tutar, Artışlı; kısa ad, açıklama ipucunda; anahtar `role="switch"`, `Anahtar`) ve Sütunlar; dar ekranda sarar.
  Yıl kümesi (kullanıcı kararı 2026-10-21, `.opex-yil-kume`): 2026/2027 sekmeleri ve yıla göre değişen bölümler
  (`#yil-paneli`) tek küme; panel çökük yüzeyde, seçili sekme panelle aynı zeminde ve ona bitişik (klasör sekmesi),
  seçili olmayan sekme yükseltilmiş yüzeyde, kenarlıklı, boş halkayla açıkça seçilebilir; iki sekme aynı şablon
  (seçim değişince görünümler yer değiştirir); dar ekranda açıklama sekmelerin üstünde;
  ilk ekranda 15 aylık plan; 2026/2027 sekmeleri yıl
  bölümlerinin başında, aynı şablonda (seçim radyo noktasıyla). Aylık plan grafiği masaüstünde dikey ve alçak
  (`opex-stack`, 16rem, her ay yazılı), telefonda (grafik < 600 px) yatay ve satır sayısına göre; diğer grafikler yatay
  çubuk. Kategori ekseninde her ad yazılır (`interval: 0`); etiket sütunu adlar sığıyorsa en uzun ad kadar (ECharts
  ölçer), sığmıyorsa üst sınırda ve ad sarılır; grafik kutusu satır sayısına göre uzar (`rows`, `--chart-row-h*`: tek satır
  20 px, dar grafikte 44 px, telefonda 68 px; kısa ad — ay — için `shortLabels` 28 px; iç pay `--chart-row-pad`,
  açıklama ve değer ekseni payını `charts.ts → legendPad` hesaplar). Netten işveren maliyetine (kullanıcı kararı 2026-10-21: köprü
  yerine tek yığılmış çubuk, `opex-bilesim`): işveren maliyetinin parçaları soldan sağa (net, gelir ve damga vergisi,
  işçi SGK, işveren payı teşvik sonrası), tutar ve pay açıklamada (dar grafikte iki satır, sayı bölünmez), toplam ve
  teşvik notta. Sabit Kalem sütunu yatay kaydırılınca sağ kenarında ince çizgi ve yumuşak gölge (kaymayan çerçevede tek
  katman, `--sabit-genislik`; birleşik kenarlıklı hücre gölge çizmez); sütun arama kutusunun üstü ve altı eşit boşluklu. Grafik vurgu bandı (axisPointer gölgesi) çubukların arkasında (`z: 0`). Kalemler tablosundaki
  durum etiketleri tam yuvarlak hap (`.opex-state`), her durum ayrı pastel zemin (`--pill-*`: var, off, paid, due,
  missing, bordro, fatura; iki temada yazı ≥ 6,7:1). Kategori sütunu da hap (`.opex-pill`): 8 pastel çift
  (`--pill-cat-1…8`), kategoriye ilk görünüş sırasıyla, süzgeçten bağımsız. Bordro bileşenleri ve köprü tam genişlikte (yan yana yarım genişlikte etiketler gizleniyordu).
- En küçük metin 14 CSS px, Giderler sayfasında 15 CSS px (grafik SVG metinleri dahil); en ince yazı ağırlığı 300 (kullanıcı kararı 2026-10-19); sayfa yatay taşmaz;
  bağımsız kontrol ve bağlantılar en az 44 CSS px (kaba işaretçide 48).
- **Uyarlanır veri görünümü (kullanıcı kararı 2026-10-27, ux.md §8; M08 `AdaptiveDataView` + M09 `RecordAccordion`):**
  ortak `DataTable` (`src/components/ui.tsx`) aynı sütun/satır modelini iki kabukta sunar, iki kabuk aynı anda mount
  edilmez. Taban dar ekrandır: kapsayıcı 48em’den darsa ve sütunların okunabilir toplam genişliği (`Column.minWidth`,
  yoksa 7rem) sığmıyorsa — ya da tablo ölçülünce taşıyorsa (güvenlik ağı) — **kayıt listesi** çizilir: Mantine
  `Accordion` (`multiple`, `order={4}`, süre `--motion-duration-base`, eğri `--motion-ease-standard`; kapalı paneller
  `keepMountedMode="display-none"` ile DOM’da kalır — varsayılan `activity` kipi React 19 Activity ile ertelenmiş
  çizer ve CI’daki Linux WebKit’te denetim kayıt alanlarını 0 saymıştı, 2026-10-28); her kayıt başlığı
  h4 içinde düğme (`aria-expanded`, `aria-controls` → `role="region"` panel), içinde kayıt adı (`.kayit-ad`, satır başlığı
  sütunu; başlık sütunu düzenleyiciyse `Column.text` düz metni) ve tek özet alan (`.kayit-ozet`: `Column.summary` —
  tanısal alan — ya da ilk düzenleyici olmayan veri sütunu); `Column.editor` sütunlar (girdi, seçim, onay, düğme) yalnız
  açılan paneldedir, başlığa taşınmaz (ux_v2 §3.2 MUST); açılan panelde diğer alanlar
  `dl.kayit-alanlar` (dt = sütun başlığı ya da `Column.label`, dd = hücre). Birden çok kayıt açık kalabilir; açık
  kayıtlar `rowKey` kimliğiyle saklanır (kabuk değişince kaybolmaz). Kayıt ekseni `kayit="sutun"` ay sütunlu tablolarda
  (nakit akış tablosu, hedefler kaynak × ay): sütun = kayıt, satırlar alan, özet son satır (dönem sonu / toplam) — ux.md
  §8.5 PeriodExplorer; senaryo kıyas tablolarında (nakit üç senaryo, gelir planı senaryolar) `ozetSatir` seçili senaryoyu
  özet yapar ve panel üç senaryoyu art arda gösterir (ux_v2 §3.1 ölçüt bazlı kıyas; nakit kıyasında ölçüt sırası riske
  göre: en düşük nakit, açık tavanı, toparlanma, dönem sonu, sonra akışlar). Geniş alanda semantik tablo; yalnız ≥ 48em’de gerekirse kendi kutusunda kayar (sabit Kalem
  sütunu). “Tabloyu yatay kaydırabilirsiniz” ipucu kaldırıldı. Kabuk seçimi (`useKabuk`) ve kayıt listesi (`KayitListesi`,
  `Kayit` modeli) dışa açıktır: Giderler kalemler tablosu (`KalemTablosu`, `.opex-veri`) kendi süzgeç/sıra/sütun
  durumuyla aynı kalıbı kullanır (P4; davranış `/giderler/` maddesinde). Testler: `tests/ui.spec.ts` (320/360/375/390’da
  kayan tablo yok — `.opex-veri` dışlanmaz —, kayıt sözleşmesi, Enter/Space/Tab, 1280 ↔ 320 bilgi eşdeğerliği),
  `tests/nakit.spec.ts` (ay başına kayıt, 15 ay + Toplam, tablo ile aynı değerler), `tests/gelir.spec.ts` (320 px kadro
  kayıtları), `tests/giderler.spec.ts → kalemler kayıt listesi` (320/390 kayıt sözleşmesi ve özet kayıtları, panel
  alanları, 1280 ↔ 320 süzgeç/sıra eşdeğerliği ve açık kayıt korunumu, kapsam notu, Sütunlar, boş sonuç; 375 px).

## UX yeniden tasarım sözleşmesi (docs/ux.md, kullanıcı kararı 2026-10-27)

Bağımsız (Codex) UX eleştirisi `docs/ux.md` içindedir; kullanıcı 2026-10-27’de “risk almadan, TDD-first, verileri
koruyarak uygula” kararı verdi. Uygulama paketler hâlinde, her paket önce kırmızı test (RED), sonra en küçük uygulama
(GREEN), tam yerel QA ve yayın. Veri modeli (`src/data/*`) ve hesaplar hiçbir pakette değişmez; `tests/data.spec.ts`
bunu denetler.

| Paket | ux.md | Durum | Kanıt |
|---|---|---|---|
| P1 Köşe sözleşmesi: radius tokenları, Mantine ölçeği, hap/anahtar/nokta istisnaları | §6.3, UX-26 | **Tamam** (2026-10-27) | `check-ui-gates` köşe kuralı; `ui.spec.ts → köşe sözleşmesi` (320, 1280) |
| P2 Uyarlanır veri görünümü: `DataTable` kayıt listesi (RecordAccordion, PeriodExplorer ekseni) | §8.1–8.6, UX-01/02/03/07 | **Tamam** (2026-10-27) | `ui.spec.ts → uyarlanır veri görünümü`, 320–390 px kayan tablo yok; `nakit.spec.ts`; `gelir.spec.ts` |
| P3 Gezinme: < 48em’de yatay kayan şerit yerine tam gezinme çekmecesi (Drawer) | §3, M01/M02 | **Tamam** (2026-10-27) | `ui.spec.ts` çekmece testleri (320–390, dokunmatik, 667×375); `giderler.spec.ts` 320 px |
| P4 Giderler kalemler tablosu (`.opex-veri`) kayıt/filtre görünümü | §8.2 örnek, M08/M12 | **Tamam** (2026-10-27) | `giderler.spec.ts → kalemler kayıt listesi` (320/390, panel, 1280 ↔ 320 eşdeğerlik, kapsam, özet kayıtları), 375 px; `ui.spec.ts` dar ekran denetimi `.opex-veri`yi dışlamaz |
| P5 Grafiklerin dar ekran eşdeğeri (Gantt/son tarih → ajanda, şema → dikey hiyerarşi, BCG → değerler) | §8.1, M20/M21, UX-29/30 | **Tamam** (2026-10-27) | `ui.spec.ts → grafiklerin dar ekran eşdeğeri` (320/390’da hiçbir sayfada `.chart-scroll` yok; hiyerarşi ↔ ECharts ağacı, ajanda ↔ Gantt spec’i, son tarih ve BCG eşdeğerliği; kabuk geçişi; 768 px tablet kaydırma), genişlik denetimi `chartScroll = 0`; `partnership.spec.ts` (Takvim: dar ekranda 12 grafik + 2 ajanda) |
| P6.1 Sayfa başlığı tek kalıp (`PageHeader`: kırıntıda tek h1, bir cümlelik amaç, dönem/kaynak satırı) ve bölüm başlığı sadeleşmesi (hairline, numara yalnız sıralı bölümlerde) | §3, §5.4, M03 | **Tamam** (2026-10-27) | `ui.spec.ts → sayfa başlığı ve bölüm başlığı` (320), `ONCEKI` (1280, kırıntı satırı dahil), kırıntı testi; `gelir.spec.ts` dönem satırı |
| P6.2 `ResultSummary` (M05): gelir planı (en çok fon ihtiyacı, başabaş durumu) ve nakit akışında (nakit açığı tavanı) seçili senaryonun ana sonucu dönem, birim ve kıyasla 320×480 ilk ekranda; durum/risk gizlenmez; yapışkan özet şerit olarak bloğun başında (tek kaynak); gelirde sonuç kurucudan önce (§5.4 sırası) | §5.4, §5.15, §9, M05 | **Tamam** (2026-10-27) | `gelir.spec.ts → ana sonuç` (320×480, kıyas, risk, tek kaynak) ve sıra testi; `nakit.spec.ts → ana sonuç` (özet kutusu ve tabloyla aynı değer, seçici, kaynak uyarısı) |
| P6.3 Parametreler: aranabilir/daraltılabilir görev grupları (M13; kapalı gelir, arama grupları açar), değişiklik özeti (alan · grup, varsayılan → yeni, alana git, tek alanı geri al), “bu tarayıcıda kaydedildi/kaydedilemedi” açık yazımı (UX-15), “varsayılana dön” kapsamı onaydan önce + geri al (UX-14) | §3, §9, M13/M23, UX-14/15 | **Tamam** (2026-10-27) | `ui.spec.ts → parametreler: görev grupları…` (320×480 belge yüksekliği ve görünür girdi, arama, özet, kapsam + geri al, depolama kapalı); eski parametre testleri grupları açarak sürer |

### ux_v2.md: ilişki kabul birimi (kullanıcı kararı 2026-10-28)

İkinci belge `docs/ux_v2.md` (27 Ekim 2026, taban 5f15b62) biçim kurallarını değil **bilgi ilişkilerini** kabul birimi
yapar: tutar–ay–kaynak, faktör–katkı–eşik, kayıt–filtre–sürüm, girdi–kapsam–etki. Uygulanan paketler (TDD-first, veri
modeli değişmedi):

| Paket | ux_v2.md | Durum | Kanıt |
|---|---|---|---|
| V2-A Kayıt başlığında düzenleyici yok (MUST): `Column.editor` yalnız panelde, `Column.text` düz başlık; applet tabloları işaretli | §3.2, §5.2 | **Tamam** (2026-10-28) | `ui.spec.ts` audit `basliktaGirdi = 0` (her sayfa/genişlik); `applet.spec.ts` 17 applet 320 px |
| V2-B Tanısal özet ve ölçüt bazlı kıyas: `Column.summary` (nakit en düşük nakit, kadro gelire katkı, aylık gelir, net); senaryo kıyas tabloları `kayit="sutun"` + `ozetSatir` (seçili senaryo) | §3.1, §4.1 | **Tamam** (2026-10-28) | `nakit.spec.ts` ölçüt başına kayıt; `gelir.spec.ts` 320 px senaryolar/kadro |
| V2-C Bakiye toplanmaz ama boş kalmaz: nakit tablosu Toplam sütununda “Toplanmaz (bakiye)” | §3.1 | **Tamam** (2026-10-28) | `nakit.spec.ts` Toplam kaydı |
| V2-D Parametre alanında taslak ↔ geçerli değer ayrımı (`clampBehavior="blur"`, sınır dışı taslak modele gitmez), sıfırlama onayı süreye bağlı değil + “Vazgeç” | §3.4, WCAG 2.2.1 | **Tamam** (2026-10-28) | `ui.spec.ts → parametreler: ara yazım ve süreye bağlı olmayan sıfırlama onayı` |
| V2-E Ay gezgini (M10: seçili ay, önceki/sonraki, ay özeti) | §3.1 B/C | Bekliyor | ay başına kayıt listesi (P2) geçerli |
| V2-F Matris komşuluğu (seçili kesişim + komşu eşikler + katkı açıklaması) | §3.2 C | Bekliyor | — |
| V2-G OPEX canlı veride sunum sabitleme kararı, silinen kayıt/gecikmiş yanıt durumları | §3.3 | Bekliyor (ürün kararı) | — |
| Kullanıcı araştırması, gerçek yardımcı teknoloji, kontrast ölçümü | §5.1–5.3 | NOT_RUN | — |

### ifade.md: anlaşılır arayüz dili (kullanıcı kararı 2026-10-28)

Üçüncü belge `docs/ifade.md` (27 Ekim 2026, taban 1950925) arayüz metinlerini inceler: metin bilgiyi değil, okurun o
bilgiyle ne yapacağını ve anlam sınırını taşımalı (§2 dört bozukluk: anlamsal sıkıştırma, etiket çakışması, iddia düzeyi
kayması, bağlam borcu). Uygulama 2026-10-28: C01–C32’nin tamamı, önce `tests/ifade.spec.ts` (RED), sonra metin; hesap,
model ve davranış değişmedi (C32 davranışı V2-D ile zaten süresiz onay + Vazgeç). Terim kaydı (§7.1): “aktif satıcı” =
ilk abonelik ödemesini yapan satıcı (toplam; aboneliği devam edenle aynı değil); “gelir” = modeldeki abonelik ödemesi
toplamı (muhasebe dönemine dağıtılmış gelir değil; yıllık peşin ödendiği ayda bütünüyle); “birikmiş açık” = kümülatif net
(gelir − seçili gider) en düşük noktası, gereken finansman bunun büyüklüğü; “açığın kapanışı” = kümülatif netin ilk kez
sıfır/pozitif olduğu tarih (kredi ya da yatırımcı ödemesi değil); “katkı” = kaynak çıkarılınca tahmini ödemedeki fark
(performans ölçümü değil). Türkçe üretim kuralı (§7.3): dinamik sayıya apostrof eki eklenmez (`%20’i` yasak → “yüzde 20
kadarı”); `tests/ifade.spec.ts → C23` gelir planı sayfasında `%\d+’` arar. Teslim tablosu (ifade §10.4; “sonra” puanı
insan testi olmadan doldurulmaz — NOT_RUN):

| Kimlik | Önceki ifade | Yeni ifade (özet) | Anlam farkı | Kaynak / test |
|---|---|---|---|---|
| C01 | “… ne zaman gelir; kadro katkısı, dijital strateji ve başabaş.” | “Koşullu tahmin: seçtiğiniz senaryoya göre …” | Gelecek tahmini olduğu ve ilk adımın senaryo seçimi olduğu söylenir; 320×480 ilk ekranı korur | `RevenuePage.tsx` purpose; ifade.spec C01, gelir.spec M05 |
| C02 | “Kaynakların aylık yeni aktif satıcısı bu oranla çarpılır.” | “Her satış kanalından ayda kazanılması beklenen yeni satıcı sayısı bu oranla çarpılır; yeni satıcı = ilk ödeme …” | Kaynak = satış kanalı; çarpılan beklenen adet; oranın bazı | `SenaryoKurucu.tsx` |
| C03/C14/C25 | “Tam kapasite, elde tutma %70, her 6 ayda +1 saha …”, “+10 puan” | Plan senaryosu (ad Medyan; varsayım kümesi, istatistiksel medyan değil); yenileme oranı; “10 yüzde puan (%70 yerine %80)” | Sayaç başlangıcı, kişi, yüzde puan ile yüzde ayrımı | `scenarioOptions.ts`, `revenue.ts` desc; ifade.spec C03 |
| C04 | “Yıllık peşin payı” | + not: “Yıllık peşin ödeyen yeni satıcıların oranı: %20 → her 100 yeni satıcının 20’si” | Payda yeni satıcılar | `SenaryoKurucu.tsx` |
| C05/C06/C12 | “Aktif satıcı = ilk ödemesini yapan satıcı.”, “Her hedef: …” | Tarih + süre; tutarlar ayın tamamı; yıllık peşin ilk ayda bütünüyle; aktif toplamı ≠ devam eden | Toplam/ay ve stok/akış ayrımı | `RevenuePage.tsx` hedefler desc; ifade.spec C08 |
| C07 | “Hem işveren maliyeti hem kapasite; Sheets kaynağında da eklenir …” | “İkinci saha çalışanı başladığında model maliyetini gider, yeni satıcılarını satış hesabına ekler; Sheets dosyasını değiştirmez.” | Ne, nereye, dış dosya değişmez | `SenaryoKurucu.tsx` |
| C08/C09 | “O ayın geliri”, “Kümülatif gelir” (hedef kartı) | “Hedef ayının toplam abonelik ödemesi”, “Başlangıçtan ay sonuna kadar birikmiş ödeme” | Hedef günü ≠ ay toplamı; tahsilat varsayımı | `RevenuePage.tsx` HedefKartlari; ifade.spec C08 |
| C10 | “Geri ödeme” | “Açığın kapanışı” / “Birikmiş açığın kapanışı” + not: kredi ya da yatırımcıya ödeme değil | Nesne açık | yapışkan özet, başabaş Stats, filtre etkisi; ifade.spec C11 |
| C11 | “Fon ihtiyacı” (negatif) | “En yüksek birikmiş açık” (negatif değer) + “gereken finansman X ₺ (gider kaynağı …)” | İşaret ve kapsam | ResultSummary, Stats, çipler; ifade.spec C11 |
| C13 | “Aylık ücret” | “Aylık abonelik fiyatı” + not: personel maaşı değil | Çalışan maaşı ile abonelik ayrımı | `SenaryoKurucu.tsx`; ifade.spec C01 |
| C15/C29 | “…ayıklanarak ölçülür”, “modelde doğrudan gelir yok” | “kaynak çıkarılınca … ne kadar azaldığını gösterir; performans ölçümü değildir”, “ayrı satış katkısı hesaplamıyor; katkısı yok demek değildir” | Model karşıolgusu ≠ ölçüm; kapsam | `RevenuePage.tsx`; ifade.spec C15 |
| C16/C17/C27 | “Sheets (canlı)”, “…o ana kadar plan kadrosu…”, “…okunamadı …; plan kadrosu kullanılır.” | “Sheets gider verisi (açılışta okunur)”; okunuyor/okundu/okunamadı üç durum, yedek kapsamı (ofis, yazılım ekibi hariç), teknik neden ayrı | İstenen/kullanılan kaynak; tazelik | `SenaryoKurucu.tsx`, `RevenuePage.tsx` sheetsNotu; ifade.spec C16 |
| C18/C19/C20 | “Seçenekleri sıfırla”, “Bağlantıyı kopyala”, düğmede “Kopyalanamadı: …” | “Sayfa seçeneklerini sıfırla”, “Senaryo bağlantısını kopyala”, kapsam notu `.kurucu-kapsam`, sonuç `.kurucu-durum` (role=status) | Kapsam ve nesne; kopyalama ≠ paylaşım; durum düğmede değil | `SenaryoKurucu.tsx`; ifade.spec C18 |
| C21 | “…bu tarayıcıda kaydedildi …” | “bu tarayıcıya son kayıt …; başka cihaza aktarılmaz, Sheets dosyasını değiştirmez” (varsayılan durumda da) | Kayıt yeri ve sınırı | `ParamsPage.tsx` SaveStatus; ifade.spec C21 |
| C22 | “Bu tarihe kadar satışa bağlı gelir 0 ₺; o ay kalan gün oranıyla” | “…ödemeler bu tarihten önce sıfır kabul edilir; ilk ayın satış kapasitesi ayda kalan günlerin oranıyla hesaplanır” | Eksiltisiz | `params.ts`; ifade.spec C22 |
| C23 | “%20’i yıllık peşin” | “yüzde 20 kadarının yıllık peşin ödediği varsayılır” | Ek yok; varsayım kipi | `RevenuePage.tsx`, `revenue.ts`, `cashflow.ts`; ifade.spec C23 |
| C24 | “LTV ÷ CAC kuralı” notu | “satıcı değeri (LTV) ÷ satıcı edinme maliyeti (CAC) … LTV abonelik ödemesi tahminidir, kâr değildir; formül dijital strateji bölümünde” | Model tanımı ve sınır | `SenaryoKurucu.tsx` |
| C26/C30 | “Yeni aktif satıcı: hazır senaryolar üst üste”, “Kaynak, başlangıç, düzen, kapasite” | “Senaryolara göre aylık yeni satıcı tahmini: aynı aylar yan yana …”, “Satış kanalları: başlangıç, düzen ve ayda beklenen yeni satıcı” | Ölçüt, dönem, birim | `RevenuePage.tsx`; ifade.spec C26 |
| C28 | “Kapanmıyor” | “{ufuk} sonuna kadar kapanmıyor” (+ eğilim notu) | Dönem içi sonuç ≠ hiç | `RevenuePage.tsx` tarihYaz, Stats, sonucDurum; ifade.spec C28 |
| C31 | “Sistem kuruldu: ilk 10 aktif satıcı” | “İlk 10 satıcının ödeme yapması” | Hedef ≠ sistemin kurulduğu hükmü | `revenue.ts` milestone adı (veri etiketi, hesap değil) |
| C32 | “Emin misiniz? Tekrar basın” | “Genel ayarları sıfırla (onayla)” + kapsam cümlesi (alan sayısı, yalnız bu tarayıcı, değişmeyenler) + Vazgeç | Nesne ve kapsam; süresiz onay (V2-D) | `ParamsPage.tsx`; ifade.spec C32, ui.spec |

Kabul: `tests/ifade.spec.ts` (12 senaryo, Chromium/Firefox/WebKit) içerik ve ilişki denetimi; insanla anlama testi
(ifade §8.4) ve kalan uzman puanlaması **NOT_RUN**. Açık karar: “gelir” sözcüğünün üründe toptan “ödeme” yapılması
(ifade §7.1) alan terminolojisi kararıdır, yapılmadı.

**Köşe istisna kaydı** (ux.md §6.3 şablonu: kimlik · bileşen/slot · kullanıcı yararı · neden köşeli yetersiz · izinli
durum · erişilebilirlik · onay · doğrulama). Kayıtlı olanlar: **K-01** hap (`StatePill`: `.chip`, `.opex-state`,
`.opex-pill`, `.yapiskan-ad`, `.bcg-flow-chip`, `.ortak-bolum-program`) — kısa durum/kategori etiketi, pill şekli etiketi
eylemden ayırır; yalnız metin etiketi; onay ux.md §1.1; kapı + tarayıcı testi. **K-02** anahtar izi/topuzu (`Switch`:
tema anahtarı, `Anahtar` role="switch" bileşenleri) — ikili durum göstergesi; onay ux.md §1.1. **K-03** yazısız nokta
işareti (rol noktası, menü noktası, legend/durum noktası ≤ 16 px) — semantik çizim geometrisi; sözde öğe ya da `.opex-dot`
/ `.opex-live-dot`. Başka yüzey (avatar, numara rozeti, kart, sekme, düğme) kayıtsızdır ve köşelidir.

**Yatay kaydırma istisna kaydı** (ux.md §8.7): **Y-01 (daraltıldı, P5 2026-10-27)** geniş grafikler (`Chart wide`;
`.chart-scroll`) — yalnız kapsayıcı **≥ 48em** iken (≈ ≥ 850 px görünüm; yatay tablet / dar masaüstü), grafik asgari
genişliğinden dar kapsayıcıda ECharts grafiği (Gantt, şemalar) kendi kutusunda kayar (`role="region"`, `tabIndex=0`, ok
tuşları; `ui.spec.ts` 900 px testi). Dar kapsayıcıda (< 48em; 768 px dikey tablet dahil) istisna yoktur: her geniş grafiğin yerinde aynı spec’ten eşdeğer liste çizilir (ajanda / hiyerarşi / değerler; yukarıda), 320 ve
390 px’te hiçbir sayfada `.chart-scroll` bulunmaz (`ui.spec.ts` genişlik denetimi ve eşdeğer testleri). Eski kayıt (“iki
boyutlu şema başka düzende aynı ilişkiyi vermiyor”, görünür “Grafiği yatay kaydırabilirsiniz” notu) kapandı. **Y-02** Giderler kalemler tablosu istisnası P4 ile 2026-10-27’de kapandı: tablo 48em altında kayıt
listesidir; `ui.spec.ts` dar ekran denetimi `.opex-veri`yi dışlamaz.

### gorsel_algi.md: görsel algı, okunabilirlik ve belge takibi (kullanıcı kararı 2026-10-28)

Dördüncü belge `docs/gorsel_algi.md` (28 Ekim 2026, taban 34a4bd2; kanonik kopya depodaki bu dosyadır) bilginin hangi
görsel alana ait olduğunu tanımlar: değer seçenek alanına, ölçülen şey grup etiketine, kaynak ve otomatik güncelleme
davranışı ayrı bağlam alanına, neden ve yöntem yardım alanına (§1, §5.1); karşılaştırma aynı anda yapılabilmeli (F08).
Uygulama sırası belgenin §7’sidir: GA-1 etiket + davranış (F01/F02/F03) → GA-2 kritik anlam (F16/F17/F18) → GA-3 ortak
durumlar (F13/F14/F15/F23) → GA-4 mobil karar görevleri (F07/F08/F09/F10) → GA-5 görsel ritim ve belge akışı
(F04/F05/F06/F11/F19/F21/F22/F24); F20 izlenebilirlik her adımda. Her paket test önce; hesap, model, varsayılan değer,
birim, depolama ve adres sözleşmeleri değişmez (§7 uygulama sözleşmesi). Durum sözlüğü (F20): planlandı · uygulandı ·
yerelde doğrulandı · CI doğrulandı · yayında doğrulandı · ertelendi (gerekçe) · bağlam nedeniyle uygulanmadı (gerekçe).
`H` düzeyi kayıtlar insan testi olmadan “kanıtlandı” olmaz (NOT_RUN).

**GA-0** (kullanıcı isteği 2026-10-28, ekran görüntüsü; F15 ve §4 süreklilik satırı): gelir planı kadro ve ay
tablolarında görünüm varyantı değişince araç çubuğu bileşenleri yer değiştirmez — iki varyant aynı araç çubuğunu paylaşır
(`katkiAraclar`, `aylikAraclar`: Dışa aktar + Görünüm; görünüm anahtarı her çubukta en sağda), başlık varyantla değişmez ve
senaryo adını tekrar etmez (`katkiBaslik`, `aylikBaslik`; senaryo adı `.araclar-etiket`’te), varyanta bağlı yöntem notu
tablonun altında (`DataTable.altNot`, `.table-note-alt`); “Üçü üst üste” görünümünde de CSV indirilir (`csvKadroUc`,
`csvAylikUc`: `gelir-plani-{kadro|aylik}-senaryolar-*.csv`, görünen sütunlar). `.araclar` dar ekran tabanı sola hizalı
akış; ≥ 48em etiketten sonraki ilk araç grubu sağa yaslanır, sonrakiler ona bitişik (serbest alan gruplar arasında
bölüşülmez; etiketsiz çubukta ikinci grup sağda kalır). Test: `gelir.spec.ts → "görünüm değişince araç çubuğu
bileşenleri yerinde kalır"` (320 ve 1280 px; konumlar blok içinde ±1 px, başlık sabit, CSV içeriği hazır senaryo sütunlu).

**GA-1** (F01/F02/F03 ve F06/F12 parçaları; kullanıcı kararı 2026-10-28): senaryo kurucu seçenekleri yalnız değer taşır
(`%100`, `399 €`, `Ocak 2027`, `%25`, `30.000 ₺`, `Özel`); grup etiketi ölçülen şeyi söyler (“Aylık reklam bütçesi”,
“Yıllık kur artışı”, “Aylık ek sabit gider”); kaynak bilgisi seçenekte değil: başlangıç değeri genel parametreden gelen
gruplarda (yıllık peşin payı, abonelik fiyatı, ikinci saha, reklam bütçesi) `ParametreKaynagi` satırı (`.secim-kaynak`,
Parametreler bağlantısı); kaynağı izleyebilen gruplarda (kapasite, elde tutma, saha büyümesi → temel senaryo; kur artışı →
genel parametre) `Baglanti` anahtarı (`ui.tsx Anahtar`, `role="switch"`, “Senaryoyla / Genel parametreyle birlikte
güncellenir”, `.anahtar-aciklama` durum satırı): aynı etkili değer bir kez görünür, değer seçmek sabitler (`null → sayı`),
anahtarı açmak kaynağa bağlar (`→ null`); iç anahtarlar, adres (`kapasite=1` / anahtar yok) ve saklama sözleşmesi
değişmedi. Saklama okuması düzeltildi: varsayılanı `null` olan alanda sabitlenmiş sayı yeniden açılışta ve başka
sayfadan senaryo değişince artık korunur (önceden tür denetimi onu düşürüyordu; V03). Liste dışı geçerli değer
(ör. `?ucret=449`) tek gerçek seçenek. `Choice`: yardım gruba `aria-describedby` ile bağlı (F12), `baglam` yuvası (§5.1
sırası: etiket → kontrol → etkin bağlam / kaynak → yardım), sunum içerik genişliğinden türer (§5.2: tek satır segment;
sığmazsa ≤ 5 seçenek kısa açık liste `data-sunum="liste"`, daha çoğu markalı Mantine `Select` `data-sunum="secim"`;
gereken genişlik düğme yazı tipinden ölçülür, yazı tipi yüklenince yeniden; seçim kutusu kipinde son ölçüm korunur,
salınım yok); `.filtreler` sütunu en az 28rem (1280 px’te iki sütun, bütün gruplar tek satır; 320 px’te hazır senaryolar
seçim kutusu, sayısal gruplar liste). Seçili düğmenin ağırlığı değişmez (F06 / V08: seçim geometriyi oynatmaz). Görünüm
anahtarı neyi etkilediğini söyler (F03 / C014: “Grafik görünümü”, “Tablo görünümü”, “Grafik ve tablo görünümü”); grafik
başlıkları varyanta göre değişmez, varyant açıklaması grafiğin altında (`Chart.altNot`, `.chart-altnot`; ifade C26 metni
orada korunur). `Dugmeler` / OPEX `Toggles` ortak sözleşmesi GA-5’e kaldı (F03 kalan). Test: `tests/gorsel-algi.spec.ts`
(V01, V02/V03, V04, V05, V06/V08 320 + 1280, V11); `gelir.spec.ts` araç çubuğu testi grafikleri de kapsar.

**GA-2** (F16/F17/F18; kullanıcı kararı 2026-10-28): **İşaret ve ad sözlüğü (F16):** aynı ölçüt her yerde aynı adla —
“En yüksek birikmiş açık” (negatif değer: en düşük kümülatif net; yapışkan özet çipi, ana sonuç, başabaş Stats, senaryo
tablosu sütunu ve başlığı, filtre etkisi satırı; “fon ihtiyacı” adı kalktı), “gereken finansman” onun büyüklüğü (pozitif);
nakit akışındaki “nakit açığı tavanı” ayrı ölçüttür (başlangıç nakdi ve yatırım girişini sayar) ve iki sayfa bunu birbirine
atıfla söyler (gelir ana sonuç kıyas başlığı, nakit “Okuma” notu). Applet yüzde başlıkları paydayı taşır (“Ağırlık payı”,
“Başlangıç ücretine göre”, “Matris (tabanın yüzdesi)”; “Hedef primin” / “Tabanın” / “Yıllık tabanın” zaten). OPEX yıl
kapsamı zaten görünür (sekmede ay aralığı, özet kutusunda ay sayısı); sekme metni değiştirilmedi (gezinme ortalama
kararı, giderler.spec). **“—” sözlüğü (F17):** sıfır `0 ₺` (nakit tablosu; eski “— sıfır demektir” notu kalktı), veri
eksik “Veri yok”, geçerli değil “Uygulanmıyor” (kadro dolaylı rollerde yeni aktif ve katkı ÷ gider, CAC / LTV ÷ CAC,
başabaş noktası, hedef kartı süreleri, OPEX “Önceki aya göre” ve 2027 değişim sütunu, applet kademe/terfi/sprint
alanları), ulaşılmayan tarih “Dönem içinde yok” (`kisaGun`), senaryo kıyasında “Senaryoda yok” (tablo ve CSV), “Yok”
(kapı/şişme), “Son seviye”; yoğun OPEX kalemler tablosunda kısa sembol korunur ve görünür efsanesi vardır
(`.opex-sembol-efsanesi`: o ay gider yok = 0 ₺; personel sütunlarında bordrosuz kalem için uygulanmıyor). **Kaynak tonu
(F18):** alt bilgi cümlesi sayfa türüne göre (`AppFrame altBilgiNotu`: karar sayfaları “kesinleşen karar”, gelir / nakit /
hedefler / büyüme “koşullu tahmin”, applet “örnek veri”, Giderler “Sheets dosyasından açılışta okunur; varsayım kaynakları
arama bağlantısıdır”); OPEX varsayımlarında “Kaynak arama bağlantısı (arama sonucu; doğrulanmış kaynak değildir, tarih ve
sürümü kullanıcı denetler)”; üst bant şeridi “Canlı” demez: “Sheets” + Sheets’teki son değişiklik saati + güncelleme
ritmi (genişlik aynı; gezinme ortalı kalır). `Dayanak` yapısal ayrımı (kaynak kimliği / tarih / şirket uyarlaması; 17
applet metni) GA-5’e kaldı. Test: `tests/gorsel-algi.spec.ts` GA-2 (V24, V25, F18); `giderler.spec` “Önceki aya göre”
beklentisi “Uygulanmıyor”.

**GA-3** (F13/F14/F15/F23 ve F12 parçası; kullanıcı kararı 2026-10-28): **Sessiz düzeltme yok (F13):** applet `Sayi`
sınırı önceden yazar (“En az 2, en çok 15.” açıklamada), odaktan çıkınca sınıra çekilen ya da geri alınan değer
nedeniyle bildirilir (`.param-duzeltme`, `role="status"`, açıklama tonu — hata rengi ve `aria-invalid` değil; yeni
yazımda kalkar: “40 yerine üst sınır 15 uygulandı.”, “Geçersiz yazım; son geçerli değer 7 korundu.”); `Metin` boş ad
geri dönüşünü söyler; Parametreler `SayiAlani` aynı kalıp. **Süresiz onay (F14, WCAG 2.2.1):** `appletKit.Eylem` ve
Notlar `ConfirmButton` 4 sn zamanlayıcısı kalktı; onay etiketi nesne ve kapsamı taşır (“Notu sil (onayla)” + gizli
“Not: …”, “Varsayılan notlara dön (onayla)”, “N applet’i örnek değerlere döndür (onayla)”, `Eylem.onay` /
`{eylem}: {ad} (onayla)`), yanında “Vazgeç”; ilk basış veri değiştirmez; applet çizim hatası (`AppletHata`) gerçek
nedeni yazar, kayıt bozulması teşhisini kesinleştirmez ve toplu sıfırlamanın kapsamını (bütün applet’ler) açık ve
onaylı sunar. **Durum mesajı (F15):** senaryo bağlantısı kopyalama hatası durum satırında kalır (başarı 2,5 sn),
düğmeler yer değiştirmez (V23). **Bekleme (F23):** Giderler yüklenirken “N sn geçti · ilerleme oranı değil”, 20 sn
sonra sonraki adım (Bağlantı / Şimdi yenile). **Uzun içerik (F12):** not düzenleyici çok satırlı Mantine `Textarea`
(autosize; Enter satır, Kaydet ya da Ctrl/Cmd+Enter kaydeder, Esc vazgeçer), sil düğmesinin erişilebilir adı notun kısa
tanımını taşır. Kalan: `GirisEkrani` bekleme nedeni, OPEX eski veri / yeniden bağlanma ekranı (F23) ve `Secim` /
`ConnectForm` uzun içerik (F12) GA-5’e. Test: `tests/gorsel-algi.spec.ts` GA-3 (V20 ×2, V21 ×2, V23, F12, F23);
`applet.spec` / `ui.spec` onay ve düzenleme beklentileri güncel.

İz tablosu (F20; bulgu → kapsam → test taslağı (belge §6) → durum):

| Bulgu | Kapsam (bileşen) | Test | Durum (2026-10-28) |
|---|---|---|---|
| F01 Seçenek etiketinde tek bilgi türü | `SenaryoKurucu.tsx`, `Choice` | V01, V05–V08 | uygulandı (GA-1), yerelde doğrulandı |
| F02 Otomatik/sabit değer ayrımı | `scenarioOptions.ts`, `SenaryoKurucu.tsx` (`Baglanti`), `ui.tsx Anahtar` | V02–V04 | uygulandı (GA-1), yerelde doğrulandı |
| F03 Kontrol görevi (değer / görünüm / gezinti / anahtar / işlem) | `Choice`, `ModSecimi`, `Dugmeler`, OPEX `Toggles` | V08, V28 | GA-1: görünüm anahtarı adı, ikili kural = `Anahtar` (switch); `Dugmeler` / `Toggles` ortaklaştırma planlandı (GA-5) |
| F04 Kontrol–yardım–bölüm ritmi | `SenaryoKurucu.tsx`, `Choice.note` → `aria-describedby`, `Girdiler` | V11 | planlandı (GA-5) |
| F05 Bağlam/özet tekrarları | `YapiskanOzet`, `ResultSummary`, `Section`, `ParamsNotice` | V16 | planlandı (GA-5) |
| F06 Tipografik hiyerarşi | `.secim-etiket`, `.secim-dugme` seçili ağırlık, `Stats` | V07, V09 | GA-1: seçili ağırlık sabit (V08); kalan roller planlandı (GA-5) |
| F07 Mobil kayıt özeti sözleşmesi | `DataTable` tüketicileri (`summary` / `ozetSatir`) | V12 | planlandı (GA-4) |
| F08 Karşılaştırma komşuluğu (matris) | `DataTable` kıyas profili; `LiyakatMatrisi`, `RutbeMatrisi`, `BandKonumu`, `KademeSerisi` | V13 | planlandı (GA-4; ux_v2 V2-F) |
| F09 Mobil OPEX araçları (sıralama, filtre) | `OpexPage.tsx` `KalemTablosu` | V15 | planlandı (GA-4) |
| F10 Kritik bilgi yatay alan dışında | `YapiskanOzet` (320), `PartnershipPage` `BolumSekmeleri` | V17 | planlandı (GA-4) |
| F11 Zaman görünümleri tekrarı | `HiringContent`, `PlanContent`, `Takvim` | — | planlandı (GA-5) |
| F12 Uzun içerik kısa alanda | `NoteRow`, `Secim`, `ConnectForm`, `Choice.note` | V19 | GA-1: `Choice.note` aria-describedby (V11); GA-3: `NoteRow` çok satırlı; `Secim` / `ConnectForm` planlandı (GA-5) |
| F13 Sessiz otomatik düzeltme | `SayiAlani`, applet `Sayi` / `Metin` | V20 | uygulandı (GA-3), yerelde doğrulandı |
| F14 Süresiz onay her yerde | `appletKit.Eylem`, `NotesPage.ConfirmButton`, `AppletHata` | V21, V22 | uygulandı (GA-3), yerelde doğrulandı (V22 geri al: yalnız Parametreler’de mümkün, diğerlerinde sunulmaz) |
| F15 Durum mesajı / varyant değişimi düğmeyi oynatmaz | `SenaryoKurucu` kopyalama durumu (GA-3); gelir planı tablo (GA-0) ve grafik (GA-1) araç çubukları | V23; `gelir.spec` araç çubuğu | uygulandı (GA-0/GA-1/GA-3), yerelde doğrulandı |
| F16 Birim / işaret / dönem / yüzde tabanı | gelir ↔ nakit açık/finansman adı ve işareti; applet yüzde paydası; OPEX yıl kapsamı (zaten görünür) | V24 | uygulandı (GA-2), yerelde doğrulandı |
| F17 “—” sözlüğü | nakit, gelir, applet, OPEX (efsane), senaryo kıyası, tarih alanları | V25 | uygulandı (GA-2), yerelde doğrulandı; OPEX hücreleri sembol + efsane |
| F18 Kaynak / varsayım / sonuç tonu | `AppFrame` alt bilgi, OPEX `Assumptions`, `LiveStrip` (GA-2); `Dayanak` yapısı (GA-5) | V26, F18 testi | GA-2 uygulandı, yerelde doğrulandı; `Dayanak` planlandı (GA-5) |
| F19 Gezinti sözlüğü | menü / kırıntı / h1 eşlemesi; Partnership `Sira` | V18, V29 | planlandı (GA-5) |
| F20 Sürüm ve izlenebilirlik | bu tablo; kanonik `docs/*.md` | V30 | uygulanıyor (her pakette güncellenir) |
| F21 Grafik okuma sorusu | `Chart` eşdeğerleri, `Cubuk`, `ShareBar` | V27 | planlandı (GA-5) |
| F22 Kimlik / seçim / durum / odak dili | tokenlar; `RoleChip` / `StatusChip` | V28 | planlandı (GA-5) |
| F23 Bekleme / hata / boş / eski veri | OPEX `Loader` / `Body`, `GirisEkrani`, `AppletHata` | V26 | GA-3: `Loader` süre notu, `AppletHata` gerçek neden; `GirisEkrani` bekleme nedeni ve OPEX eski veri ekranı planlandı (GA-5) |
| F24 Uzun sayfa belge takibi | gelir planı bölüm dizini, bölüm soruları, kalıcı adres | V29 | planlandı (GA-5) |

## Gizlilik ve yayın

- Repo herkese açıktır. Kaynak PDF’ler ve fotoğraflar repoya girmez (`.gitignore`). Üçüncü kişi adları, maaş ve bütçe
  tutarları yazılmaz. Kullanıcının açıkça siteye eklettiği değerler: İsmail Karaca adı, haftalık 5.000 ₺ Meta reklam
  bütçesi, 90 gün ≥ 3.000.000 ₺ ciro hedefi, aktif satıcı aboneliği 399 € / ay.
  19 Ekim 2026 kararlarıyla ayrıca: işveren maliyeti = maaş × 2, satış başına prim 2.500 ₺, sponsor payı 500 ₺, ekip
  lideri liderlik farkı 10.000 ₺ ve ekip payı 250 ₺, yapay zekâ araç bütçesi aylık en çok 7.500 ₺. Maaşlar (net,
  kullanıcı kararı 2026-10-27; 19 Ekim’deki 60.000 ₺ ve çarpanların yerine): saha satış 50.000 ₺ (kota = maaş × 2 =
  100.000 ₺), organizatör 50.000 ₺, masa başı (CRM iStoç) 35.000 ₺, Segika masa başı 35.000 ₺; asgari ücret (net,
  2026: 28.075,50 ₺) çarpanı yalnız dijital 1,25 ve asistan 1,5 için sürer. Yatırımcının adı yazılmaz (rol: “Yatırımcı”). Tahtadaki
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
- Giriş kapısı (kullanıcı kararı 2026-10-21; `src/lib/giris.ts`, `src/components/Giris.tsx`): sunucusuz, çok basit;
  yalnız robotlara ve rastgele ziyaretçilere karşı. Giriş yoksa `AppFrame` gezinme, sayfa içeriği ve alt bilgiyi çizmez;
  statik HTML’de yalnız marka, tema düğmesi ve giriş formu vardır; sayfa açıklaması tüm sayfalarda geneldir (veri
  taşımaz), `noindex, nofollow`. Kullanıcı adı büyük/küçük harf ve Türkçe karakterden bağımsız (`kullaniciAdiNormal`:
  “turksab”, “TURKSAB”, “Türksab”, “TürksAB” …). **Parola repoya, koda, belgeye yazılmaz**; yalnız SHA-256 özeti
  (`GIRIS_OZETI`) karşılaştırılır; parola değişirse özet `19ekim:turksab:<parola>` metninden yeniden hesaplanır. Giriş
  localStorage’da (`turksab-giris`) kalır, başka sekmeye yansır; alt bilgide “Çıkış yap”. Girişliyken ilk boyamada
  formu head betiği gizler (`html[data-giris]`). Form alanlarının `name`’i yok ve düğme hidrasyona kadar kapalı (parola
  adres çubuğuna düşmez); JavaScript yoksa form yerine not. **Sınır:** tarayıcı paketleri (`/_astro/*.js`), herkese açık
  repo ve Giderler’in Sheets/Apps Script ucu veriyi kapıdan bağımsız taşır; kapı gerçek erişim denetimi değildir. Kısa
  sayısal parola özetten saniyeler içinde bulunabilir ve kayıtlı özet aynı zamanda giriş işaretidir; parola başka yerde
  kullanılmamalı. Giriş süresizdir (çıkışa kadar). `GIRIS_PAROLA` CI sırrı yapılırsa hata izleri/HTML raporu yazılan
  parolayı içerebilir.
- Lisans henüz seçilmedi; kullanıcının onayı olmadan lisans eklenmez.

## Komutlar

| Amaç | Komut |
|---|---|
| Geliştirme sunucusu | `npm run dev` (adres: `http://localhost:4321/19ekim/`) |
| Tip, Astro ve UI kapısı | `npm run check` (`astro check` + `scripts/check-ui-gates.mjs`) |
| Yalnız UI kapısı | `npm run gates` |
| Üretim derlemesi | `npm run build` |
| Tarayıcı testleri | `npm test` (önce derleme; Chromium, Firefox, WebKit; `scripts/serve-dist.mjs` ile). Testler girişli başlar (`playwright.config.ts → storageState`); doğru parolayla giriş testi `GIRIS_PAROLA` ortam değişkeniyle çalışır, yoksa (CI) atlanır |
| Hepsi | `npm run verify` |
| Paralel çalışma ağacında test | `PW_PORT=4333 npm test` — aynı makinede ikinci bir worktree test koşuyorsa port çakışmasın: `reuseExistingServer` komşu ağacın 4322 sunucusunu (başka bir `dist`) kullanır ve yanlış paketi test eder (`playwright.config.ts`) |
| Apps Script paketi (OPEX) | `node apps-script/build.mjs --cikti ../opex-google/OPEX.gs --tohum ../opex-google/Tohum.js` (kurulum: `apps-script/README.md`) |

`scripts/check-ui-gates.mjs` şunları reddeder: token dışı hareket, `transition: all`, çevreleyen odak halkası,
14 px altı yazı, 300 altı yazı ağırlığı (CSS, tokenlar, JS ve satır içi HTML), zorlayıcı kelime bölme, iç gölge çubuğu veya renkli vurgu kenarı, eksik kenar
sistemi köşe sıfırlaması, JS içinde sabit easing/süre ve **köşe sözleşmesi dışı radius** (yüzeyde 0 dışı değer; `--radius-pill` yalnız hap,
`--radius-switch` yalnız anahtar, `50%` yalnız nokta seçicilerinde; `--radius-sm/md/lg` gibi tanımsız token; Mantine `radius=` yalnız `{0}`). Kenarlık rengi ve kalınlığı (kısaltma ve uzun biçimler)
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
- Giderler kalemleri kayıt kabuğunda (< 48em) sıralama ve sütun filtreleri/aramaları için kontrol yok (durum korunur;
  tepsi filtreleri ve “Kalem ara” var). Dar ekran sıralama seçici sonraki paket.

- Playwright WebKit ok tuşlarıyla varsayılan kaydırmayı uygulamaz; tablo ve Gantt klavye kaydırması WebKit’te `not_run`.
- Forced-colors yalnız Chromium’da emüle edilir; Firefox mobil emülasyonu yoktur.
- Görsel referans (snapshot) testleri kurulmadı; gerçek Safari/iOS/Android cihaz kontrolleri yapılmadı.
- `astro preview` Astro 7’de etkileşimsiz ortamda arka plana geçer; testler bu yüzden `scripts/serve-dist.mjs` kullanır.
