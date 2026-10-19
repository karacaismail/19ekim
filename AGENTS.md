# Proje talimatları — iStoc saha ve pazarlama planı

Bu repo, iStoc için hazırlanan satış ve pazarlama operasyon planının herkese açık sitesidir:
<https://karacaismail.github.io/19ekim/>. Kullanıcı düzeyindeki kurallar
([/Users/w6x/AGENTS.md](/Users/w6x/AGENTS.md), [/Users/w6x/AGENT.md](/Users/w6x/AGENT.md)) geçerlidir; bu dosya
yalnız projeye özgü kararları ve gerçek komutları kaydeder.

## Yığın ve mimari

- Astro 7.4.0 (statik), @astrojs/react 7.1.0, React 19.3.1, @mantine/core 9.7.3, ECharts 6.1.0, TypeScript 6.
- Her sayfa tek bir React ağacıdır (`src/views/*`), `AppFrame` içinde `MantineProvider` ile **hidrasyonsuz** sunucu
  tarafında çizilir. Astro’da React bağlamı sayfa sınırını geçmez; Mantine bileşenleri her zaman `AppFrame` içinde kalır.
- İstemci JavaScript’i yalnız şunlardır: `BaseLayout.astro` içindeki satır içi betikler (renk şeması ve tema düğmesi,
  merkezi klavye odak modu, gezinme şeridi) ve grafikli sayfalarda `src/scripts/charts.ts`. ECharts, `echarts-setup.ts`
  üzerinden modüler ve yalnız grafik görünür olunca yüklenir.
- Bilgi mimarisi bir ağaçtır (`src/data/tree.ts`): tepede İsmail Karaca; dört rol ağacı (1 Dijital pazarlama,
  2 Masa başı pazarlama (CRM), 3 Saha satış, 4 Organizatör); kurmay olarak asistan. Rol sayfalarındaki bölümler ağaç
  dallarıyla aynı kodu taşır (ör. 2.3 Hafta). `SEQUENCE` sunum sırasını ve önceki/sonraki gezinmesini belirler.
- İçerik `src/data/*` içindedir; görünümler veriyi çizer. Tarih, hedef ve sayı değişiklikleri veriden yapılır.

## Tasarım kuralları (kaynakta uygulanmış)

- Tek token kaynağı `src/styles/tokens.css`; bileşenler sabit renk, yazı boyutu veya hareket değeri yazmaz.
- Marka: iStoc turuncusu `#FF8600` + mürekkep; varsayılan font Outfit; açık ve koyu tema, tema düğmesiyle seçilir.
- **Kavisli vurgu kenarı yasak.** Renkli vurgu çizgisi yalnız `[data-edge="start" | "top"]` kenar sistemiyle çizilir.
  Kural, çizgiyi düz pseudo-element olarak çizer ve yalnız çizginin değdiği iki köşeyi radiussuz yapar; diğer köşeler
  ve diğer bileşenlerin radiusu korunur. Vurgu için önce gölge (`--shadow-soft`) kullanılır.
- Odak: çevreleyen halka yok; yalnız Tab/Shift+Tab görünür odak modunu açar; gösterge tek kenardır (metin alt çizgisi
  veya düz sol çubuk). Tablo bölgelerinde çubuk `.table-frame` üzerinde çizilir.
- Hareket: `--motion-ease-standard: cubic-bezier(.65, 0, .35, 1)`, süre 120–320 ms; ECharts’ta `cubicInOut`
  ve token süresi; hareket azaltma tercihinde animasyon kapanır.
- En küçük metin 14 CSS px (grafik SVG metinleri dahil); tablolar kendi kapsayıcılarında kayar; sayfa yatay taşmaz;
  bağımsız kontrol ve bağlantılar en az 44 CSS px (kaba işaretçide 48).

## Gizlilik ve yayın

- Repo herkese açıktır. Kaynak PDF’ler ve fotoğraflar repoya girmez (`.gitignore`). Üçüncü kişi adları, maaş ve bütçe
  tutarları yazılmaz. Kullanıcının açıkça siteye eklettiği değerler: İsmail Karaca adı, haftalık 5.000 ₺ Meta reklam
  bütçesi, 90 gün ≥ 3.000.000 ₺ ciro hedefi, 30K / 90K / 500K paket bantları.
- Asistan kararı netleşmemiştir; asistansız senaryoda dijital pazarlama 1 Ocak 2027’de başlar. Bu koşul kişi adı
  verilmeden yazılır.
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

`scripts/check-ui-gates.mjs` şunları reddeder: token dışı hareket, `transition: all`, çevreleyen odak halkası,
14 px altı yazı, zorlayıcı kelime bölme, radiuslu öğede iç gölge çubuğu veya renkli vurgu kenarı, eksik kenar
sistemi köşe sıfırlaması ve JS içinde sabit easing/süre. CI (`.github/workflows/pages.yml`) aynı kontrolleri
Pages yayınından önce çalıştırır.

## Bilinen sınırlar

- Playwright WebKit ok tuşlarıyla varsayılan kaydırmayı uygulamaz; tablo klavye kaydırması WebKit’te `not_run`.
- Forced-colors yalnız Chromium’da emüle edilir; Firefox mobil emülasyonu yoktur.
- Görsel referans (snapshot) testleri kurulmadı; gerçek Safari/iOS/Android cihaz kontrolleri yapılmadı.
- `astro preview` Astro 7’de etkileşimsiz ortamda arka plana geçer; testler bu yüzden `scripts/serve-dist.mjs` kullanır.
