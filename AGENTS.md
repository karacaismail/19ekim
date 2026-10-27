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
    sağlayıcıları); sonra yıl seçici (iki büyük sekme, APG Tabs: **2026** rapor ayından Aralık’a, **2027** 12 ay) ve
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
  - `/applet/` ücret ve performans applet’leri (kullanıcı kararı 2026-10-21; menüde ve sunum sırasında yok, yalnız adresle
    açılır, BCG gibi): fatura kesen serbest çalışan ağı için meslekten bağımsız 17 örnek model, iki motor — rütbe (sabit
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
    senaryo yalnız giriş ve primi değiştirir, yatırım/başlangıç nakdi).
  - `/gelir-plani/` gelir planı (kullanıcı kararı 2026-10-27; Pazarlama menüsünde 90 gün hedeflerinden sonra, sunum
    sırasında da). Hedefler sayfası 90 günde 100 aktif satıcıyı hedef koyar; bu sayfa aynı hedefe kadro kapasitesinden
    bakar: 1 saha personeli (ikincisi “sistem oturunca”, `secondSahaDate`), 1 CRM masa başı, organizatör (Aralık’tan),
    dijital pazarlama (satıcı kazanım reklamı + organik içerik) ve bağımsız temsilciler (ayda 2 yeni, en çok 10, temsilci
    başına 1 ilk ödeme) ayda kaç yeni aktif satıcı getirir (`sahaActivesMonthly`, `crmActivesMonthly`,
    `organizatorActivesMonthly`; her kişinin ilk ayı %50, ikinci ayı %75). Üç senaryo (kullanıcı kararı 2026-10-27, adları
    sabit): **kötümser** (`pessimisticFactor`, `pessimisticRetention`), **medyan** (tam kapasite, plan elde tutma),
    **iyimser** (%130, +10 puan). Senaryo her bölümün, her tablonun ve her grafiğin başındaki **segmentli anahtarla**
    seçilir (`Choice`: tek iz `.secim-iz`, seçili düğmenin altında ölçülerek kayan topuz `.secim-top` — hareket
    tokenlarıyla —, rol tonlu; sunucu çiziminde topuz ölçülmeden seçili düğme aynı görünümü alır; `title` ipucu yok —
    dokunmada hover yoktur —, seçimin açıklaması görünür not `.secim-not`; iz, düğme ve çubuk açık alanlı: kullanıcı
    kararı 2026-10-27 “clear space önemli”) ve anahtar **araç
    çubuğunda** durur (`Araclar`, `.araclar`: yükseltilmiş zemin, üst köşeler yuvarlak, altta seçili senaryonun tonunda
    çizgi `data-edge="bottom"` — kenar sistemi: alt köşeler düz; `scripts/check-ui-gates.mjs` `EDGE_CORNERS` bu türü tanır —, altındaki grafik kutusu/tablo/kartlar bitişik:
    kullanıcı kararı 2026-10-27 “tek zemin, kayarak geçen, wrapper içinde, altındaki bölüme bağlı”). `Section`, `Chart`
    ve `DataTable` `tools` düğümünü olduğu gibi çizer; sayfa `Araclar` ile sarar. Seçim `useScenario`
    (`src/lib/scenario.ts`: localStorage `istoc-plan-senaryo`, varsayılan medyan, nakit akış tablosu ve istihdam
    takvimiyle ortak, `storage` olayıyla sekmeler arası). Hero istatistikleri, hedef kartları (diğer iki senaryonun
    tarihi kartta), zaman çizelgesi, tablolar ve notlar seçili senaryoyu anlatır. Grafik görünümü (`ModSecimi`: seçili
    senaryo / üçü üst üste): kaynak × ay ↔ `seri-cizgi`, `gelir-ay` ↔ `grup-ay` (tablo da üç senaryonun sütunlarına
    döner), `huni` ↔ `hedef-adim`; “Üç senaryo üst üste” bölümü her zaman üst üste (`kumulatif-tl` + hedef çizgisi,
    `seri-cizgi` ödemeye devam eden; seçili olmayanlar kesikli, tabloda seçili satır `data-tone="secili"`). Hedef
    zinciri (ilk 10 → 50 → 100 aktif → 500 üye → 1 M₺ → ciro hedefi → 200 aktif): tarih (ay içinde doğrusal),
    başlangıçtan ve önceki hedeften süre (`sure`), o ayın geliri, kümülatif. Gelir = yıllık peşin ödeyenler
    (`annualShare`) × yıllık ücret + aylık ödeyen satıcı-ay × aylık ücret; aktif satıcı = ilk ödeme (hedefler
    sayfasıyla aynı tanım), “ödemeye devam eden” ayrı. Veri `src/data/revenue.ts` → `makeRevenue(params, program)`
    (`HORIZON` 24 ay — kullanıcı kararı 2026-10-27: 2026, 2027, 2028 görünsün; `simulate(params, program, months,
    inputs)` serbest girdili simülasyon: kapasite çarpanı, elde tutma, yıllık payı, € ücret, ikinci saha ayı,
    `extraSaha`, `dijitalBudget`, `dijitalScale`, `fxGrowth`, `sahaGrowthEvery`, `exclude` kaynak ayıklama;
    `buildSources(p, prog, months, inputs)`, `adSchedule`, `priceSeries`, `growthHires`, `adCapacity`, `ltvOf`;
    `funnels`, `monthlyOnly`, `first3` senaryo başına; `inputsFor`, `sourcesFor(sc)`). Kaynaklar: saha1, saha2,
    (sahaEk), (sahaBuyume), crm, org, dijital (reklam + organik tek kaynak), rep.
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
- Başlık ve gezinme (kullanıcı kararları 2026-10-20/21): üst bantta logo (Türksab yazı imi “TURKS/AB”, ekran okuyucuya
  “Türksab”; kullanıcı kararı 2026-10-21). Logo metin değil, turksab.com logosu ölçülerek çizilmiş SVG’dir
  (`BrandMark.tsx`): harfler Roboto 900 dış hatları (orijinal gövde kalınlığı büyük harf yüksekliğinin ≈ %24’ü), her harf
  orijinaldeki ağırlık merkezinde; kırmızı eğik çizgi kalın paralelkenar (yatay kalınlık ≈ %24, eğim ≈ %35, renk
  `--brand-slash`, açık temada orijinalin #fe0000’ı). Boyut `--brand-mark-h` (büyük harf yüksekliği); “/” karakteri veya
  site fontuyla yazı imi kullanılmaz (ince ve orijinale aykırı) ve altında “Pazarlama & Finansal
  Planlama”; ≥ 64em gezinme aynı satırda, başlığın tam ortasında (üç sütunlu ızgara:
  logo · gezinme · tema düğmesi), dar ekranda logonun altında güvenli ortalamayla (`safe center`), dar ekranda logonun altında kendi satırında
  (bant ≥ 48em üstte sabit). Tema düğmesi: görünür yazı yok (adı “Koyu tema”), büyük anahtar; simge izin boş tarafında —
  açık temada beyaz izde ay, koyu temada turuncu izde güneş. Plan tarihi başlıkta yok. Kırıntı “19 Ekim” ile başlar;
  `AppFrame titleInCrumbs` ile son kırıntı sayfa başlığıdır (h1, `--text-crumb-title`; Giderler: 19 Ekim › Finans › OpEx ›
  Operasyonel Giderler, ayrı başlık alanı yok). Kullanıcı kararı 2026-10-21: kırıntılar %10–20 büyük (`--text-crumb`:
  1rem, Giderler 1.0625rem), başlık %10–20 küçük (`--text-crumb-title`, en çok 1.7rem). Bölüm başlığı ≥ 64em’de tek satır: numara · başlık · açıklama
  (dar ekranda açıklama başlığın altında). Gezinme tek satır: “İstihdam” (organizasyon,
  rol sayfaları, istihdam takvimi) ve “Pazarlama” (90 gün hedefleri, eylem planı, MLM ağı, karar yetkisi, karar
  bekleyenler, parametreler; `MARKETING_NAV`) ve Giderler (OPEX, nakit akış tablosu; `FINANCE_NAV`, kullanıcı kararı 2026-10-27) açılır menüleri, Notlar. Menüler tek bileşen (`NavMenu`,
  `NAV_MENUS`; Mantine Menu, markalı panel, oklar/Escape, odak alt çizgiyle, işaretçi modunda odak zemini yok; alçak
  ekranda panel kendi içinde kayar). Sayfa başlıkları sıkışık (`--text-title`, geniş
  ekranda üst etiket başlıkla aynı satırda): her sayfa için önceki yüksekliğe göre rol ≥ %75, diğerleri ≥ %50 az
  (`tests/ui.spec.ts → ONCEKI`, 1280 px). Rol başlığı: ad + durum, sağda görev, altta tek akışta bilgiler. Kırıntı
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
- En küçük metin 14 CSS px, Giderler sayfasında 15 CSS px (grafik SVG metinleri dahil); en ince yazı ağırlığı 300 (kullanıcı kararı 2026-10-19); tablolar kendi kapsayıcılarında kayar; sayfa yatay taşmaz;
  bağımsız kontrol ve bağlantılar en az 44 CSS px (kaba işaretçide 48).

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
