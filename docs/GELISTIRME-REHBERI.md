# 19ekim — Geliştirme rehberi

Bu belge yönlendirmedir, kural kaynağı değildir. Kalıcı kararlar, komutlar ve sınırlar [AGENTS.md](../AGENTS.md)
içindedir; çelişkide AGENTS.md kazanır. Buradaki amaç, repoya ilk kez bakan bir geliştiricinin, bir vibecoder’ın ya da
bir yapay zekâ ajanının (Codex, Claude, Cursor…) on dakikada doğru zihin modelini kurmasıdır.

## 1. Proje nedir?

İstoc’un (marka: Türksab) 19 Ekim 2026 tarihli saha ve pazarlama kararlarının **yatırımcı sunum sitesi**. Statik bir
site; GitHub Pages’te yayında: <https://karacaismail.github.io/19ekim/>.

Sayfalar bir sunum sırası izler (`SEQUENCE`): organizasyon şeması → rol sayfaları → istihdam takvimi → 90 gün
hedefleri → gelir planı → eylem planı → iş ortaklığı programı → karar yetkisi → karar bekleyenler → parametreler. Ayrıca iki büyük
bağımsız modül vardır:

- **Giderler (OPEX)**: veri repoda değil, Google Sheets’te. Apps Script web uygulaması sayfaya canlı veri verir; aynı
  hesap motoru (`apps-script/src/Motor.js`) hem Sheets’teki panoyu hem sayfayı besler.
- **Applet’ler** (`/applet/`): ücret ve performans modelleri, menüde yok, yalnız adresle açılır.
- **Gelir planı** (`/gelir-plani/`, Pazarlama menüsünde): sayfanın başında senaryo kurucu (hazır senaryolar + ayrıntılı
  seçenekler; tek durum, adres çubuğunda paylaşılabilir) ve kaydırırken üstte kalan yapışkan özet; kadro kapasitesinden
  hedef zinciri, kadronun görev/gider/gelir katkısı, dijital pazarlama stratejisi (gider → gelir), aylık ve kümülatif
  gelir, hazır senaryolar üst üste, başabaş (öngörülü). Takvim 19 Ekim 2026 → Aralık 2027, ilk satış 6 Kasım. Veri
  `src/data/revenue.ts`, `src/data/staffing.ts`, `src/data/digitalStrategy.ts`, `src/data/breakeven.ts`; durum
  `src/lib/scenarioOptions.ts`; temel senaryo `src/lib/scenario.ts` ile nakit akış tablosu ve istihdam takvimiyle ortak.
- **Nakit akış tablosu** (`/nakit-akisi/`, Giderler menüsünde): çıkışlar Sheets’ten canlı, girişler gelir planının
  seçili senaryosundan; basit/ayrıntılı anahtar, üç senaryo karşılaştırması. Veri `src/data/cashflow.ts`.
- **İş ortaklığı programı** (`/partnership/`): Segika ve iStoc için iki sekmeli 90 günlük program; sekiz bölüm, grafikler,
  geçitler ve haftalık takvim. Veri `src/data/partnership.ts`; tarihler program başlangıcından kayar.

Site bir **giriş kapısı** arkasındadır (kullanıcı adı `turksab`, parola repoda yok). Kapı robotlara karşıdır, gerçek
erişim denetimi değildir; bunu güvenlik önlemi sanıp üzerine bir şey inşa etmeyin.

## 2. Zihin modeli: üç katman

```
params.ts  ──buildModel()──▶  model (program, roles, digital, growth, org)  ──▶  views/*.tsx  ──▶  Astro sayfası
   ▲                                                                                    │
   └──── /parametreler/ sayfası + localStorage ──────────────────────────────────────────┘
```

1. **Veri** (`src/data/`): tek gerçek kaynak `params.ts`. Tarih, kişi sayısı, ücret, kota, bütçe buradan türer.
   `model.ts → buildModel(params)` her sayfanın verisini üretir. Metinlerdeki tarihler bile parametreden kayar
   (`shiftText`, `src/lib/dates.ts`).
2. **Görünüm** (`src/views/`): her sayfa tek bir React ağacıdır. `AppFrame` içinde `MantineProvider` + `ModelProvider`
   vardır; Mantine bileşeni ve `useModel()` yalnızca `AppFrame` içinde çalışır.
3. **Sayfa** (`src/pages/*.astro`): yalnız `AppFrame` + görünüm bileşenini döndürür. Mantık buraya yazılmaz.

Bu üç katmanı ihlal eden değişiklik (sayfaya sabit sayı yazmak, Astro dosyasına mantık koymak, Mantine’i
`AppFrame` dışında kullanmak) testlerde ya da çalışma anında patlar.

## 3. Yığın

| Katman | Teknoloji | Not |
|---|---|---|
| Site | Astro 7.4 (statik çıktı) | Taban yol `/19ekim/` |
| UI | React 19, Mantine 9 (core + dates), Tabler ikonları | Emoji yok |
| Grafik | ECharts 6 | Görünür olunca dinamik yüklenir; aria kapalı, özet metin `role="img"` |
| Stil | Tek token dosyası `src/styles/tokens.css` | Bileşen içinde sabit renk, boyut, süre yazılmaz |
| Test | Playwright (Chromium, Firefox, WebKit), 820 test (üç tarayıcı toplamı) | Testler girişli başlar; `npx playwright install` ile tarayıcılar iner |
| Kapı | `scripts/check-ui-gates.mjs` | CI’da ve `npm run check` ile koşar |
| OPEX | Google Apps Script (V8) | Node testleri aynı dosyayı çalıştırır |

Node ≥ 22.22 gerekir.

## 4. Komutlar

```sh
npm ci
npm run dev       # http://localhost:4321/19ekim/
npm run check     # astro check + UI kapısı
npm run build
npm test          # önce build gerekir
npm run verify    # hepsi
```

## 5. Nasıl geliştirilmeli?

**Küçük paket, tek amaç.** Repo tarihi tek konulu commit’lerden oluşur ve commit mesajları Türkçe, kararı anlatır
(“Giderler: yıl sekmeleri…”). Aynı düzeni sürdürün.

**Önce veriyi değiştir, görünümü sonra.** Bir tarih, sayı ya da hedef değişecekse `src/data/` içinde değişir;
`tests/data.spec.ts` tutarlılığı (600 kayıt / 100 aktif, 136 satıcı-ay, kontrol noktaları) denetler. Görünümde
sabit sayı görürseniz o bir hatadır, düzeltme fırsatıdır.

**Tasarım kuralları makine kapısındadır.** Şunlar reddedilir, tartışılmaz:
- token dışı renk, yazı boyutu, hareket süresi ve easing;
- `transition: all`;
- çevreleyen odak halkası (odak tek kenarla gösterilir: alt çizgi ya da sol çubuk);
- 14 px altı yazı (Giderler’de 15 px) ve 300 altı yazı ağırlığı;
- kavisli köşeye değen renkli vurgu kenarı (yalnız `[data-edge]` sistemi);
- hareket: `cubic-bezier(.65, 0, .35, 1)`, 120–320 ms; tek istisna Giderler yükleyicisi;
- **köşe sözleşmesi (27 Ekim 2026, `docs/ux.md` §6.3):** yüzey, kontrol ve kaplama köşeleri 0; yalnız hap (kısa durum
  etiketi) ve anahtar (iz + topuz) yuvarlak, yazısız nokta işareti 50 %. Yeni bir yuvarlak yüzey istisna kaydı ister
  (AGENTS.md → köşe istisna kaydı); `radius="xl"` gibi yerel kaçış kapıda düşer.

**UX sözleşmesi (`docs/ux.md`).** 27 Ekim 2026’da bağımsız bir UX eleştirisi kabul edildi ve paketler hâlinde
uygulanıyor (durum tablosu AGENTS.md’de). Üç kural artık kodun parçasıdır:
- **Tablo dar ekranda kaymaz, kayıt listesine dönüşür.** Ortak `DataTable` 48em altında (sütunlar sığmıyorsa) her satırı
  bir kayıt yapar: başlıkta ad + tek özet alan, açılınca bütün alanlar etiketli (`dl`). Ay sütunlu tablolarda
  (`kayit="sutun"`) her ay bir kayıttır. Aynı veri, iki kabuk; test 1280 px tablosuyla 320 px listesini karşılaştırır.
  Giderler kalemler tablosu da aynı kalıbı kullanır (`useKabuk` + `KayitListesi`; başlıkta kalem adı + rapor ayı tutarı,
  panelde etiketli alanlar, alt satırlar özet kayıtları). Yalnız geniş grafikler (Gantt, şemalar) kayıtlı istisnadır:
  kendi kutusunda kayar.
- **Dar ekranda gezinme çekmecede.** 48em altında marka satırının altında “Menü” düğmesi; tam gezinme sağdan açılan
  çekmecede (Escape kapatır, odak düğmeye döner). Yatay kayan menü şeridi yalnız 48em’den geniş ekranda.
- **Yeni test önce yazılır (TDD-first).** Önce ux.md’deki kabul senaryosu Playwright testi olur ve kırmızı düşer, sonra
  en küçük uygulama onu yeşile çevirir; eski kabulle çelişen test gerekçesiyle yeniden yazılır, sessizce silinmez.

**Dar ekran tabandır.** Önce 320 px genişlik ve 320×480 ekran için yazılır, geniş ekran onun üzerine eklenir. Testler
320 ve 390 px’te her grafiği görünür alana getirip kesilme, taşma ve çakışma arar. “Masaüstünde güzel, telefonda
düzeltiriz” kabul edilmez.

**Gizlilik.** Repo herkese açıktır. Üçüncü kişi adı, maaş, bütçe tutarı, hesap e-postası, PDF ve fotoğraf repoya
girmez. Yatırımcı “Yatırımcı” olarak anılır. OPEX verisi yalnız Sheets’te kalır. Parola koda, belgeye ve commit
mesajına yazılmaz. Lisans seçilmedi; kullanıcı onayı olmadan eklenmez.

**Değişiklik bitti sayılmaz** şunlar olmadan: `npm run check` yeşil, `npm run build` yeşil, ilgili Playwright testi
yeşil, ve arayüz değişikliğiyse gerçek tarayıcıda 320 px’te bakılmış.

## 6. Yapay zekâ ajanı (Codex, Claude, Cursor…) neye dikkat etmeli?

1. **AGENTS.md’yi baştan sona oku, özetleme.** 300 satırlık dosya kullanıcı kararlarını tarihleriyle kaydeder
   (“kullanıcı kararı 2026-10-21”). Bir kararı geri almak için yeni bir kullanıcı kararı gerekir; “daha iyi olur”
   diye değiştirme.
2. **Dosya başına değil, karar başına değiştir.** `OpexPage.tsx` 1.900 satır, `AppletPage.tsx` 1.600 satır. Bu
   dosyalarda geniş yeniden yazma yapma; küçük, yerel düzenleme yap ve ilgili testi çalıştır.
3. **Kapıyı aşmaya çalışma.** `check-ui-gates.mjs` bir hata verdiğinde kuralı gevşetmek yerine tokenı kullan. Yeni bir
   tokena gerçekten gerek varsa `tokens.css`’e ekle ve nedenini commit mesajına yaz.
4. **Sayı uydurma.** Ücret, kota, tarih gibi değerler parametreden gelir. Örnek veri gerekiyorsa
   `apps-script/ornek/tohum.ornek.js` gibi kurgusal veri kullan; gerçek tohumdaki tutarları asla testlere taşıma.
5. **Sheets tarafını CI test etmez.** `Kurulum.js` ve `Sheets.js` değişiklikleri Node testlerinde sahte nesnelerle
   geçer ama gerçek Sheets davranışı yalnız canlı tabloda görülür. Bu dosyalara dokunduysan “doğrulanmadı” de,
   “çalışıyor” deme.
6. **Grafik ipucuna gelen metni kaçışla** (`esc`). Sheets’ten gelen metin HTML ipucuna giriyor;
   `tests/giderler.spec.ts` enjeksiyonu reddeder.
7. **Emoji kullanma, ikon için Tabler.** Logo metin değil SVG’dir (`BrandMark.tsx`), “/” karakteriyle yazılmaz.
8. **Referans yolu `/Users/w6x/...` bu makinede yok.** AGENTS.md ve CLAUDE.md kullanıcı kurallarını o yoldan bağlar;
   dosya başka makinede yazılmış. Yolun yokluğu kuralların geçersizliği değildir.
9. **Raporunda ne çalıştırdığını söyle.** “Testler geçti” yerine hangi komut, hangi tarayıcı, kaç test. Çalıştırmadığın
   şeyi “bilinmiyor” olarak bırak.

## 7. Vibecoder için kısa yol

Kod bilmeden ilerlemek istiyorsan şu sırayı izle:

1. Siteyi yerelde aç: `npm run dev`, giriş yap, değişmesini istediğin şeyi **sayfada** göster (ekran görüntüsü
   veya sayfa + bölüm adı).
2. İsteği bir cümlede, karar olarak yaz: “Saha satış maaşı 50.000 yerine 55.000 olsun”, “Giderler tablosunda
   kategori sütunu en başa gelsin”. Nasıl yapılacağını değil, ne olacağını söyle.
3. Ajan değişikliği yapınca üç şeyi iste: `npm run verify` sonucu, 320 px ekran görüntüsü, AGENTS.md’de güncellenen
   satır. Üçü yoksa iş bitmemiştir.
4. Sayı ve tarih değişikliğini önce `/parametreler/` sayfasında dene; çoğu zaman kod gerekmeden sonucu görürsün.
   Kalıcı olsun istiyorsan `params.ts` değişir.
5. Repo herkese açık: gerçek isim, maaş, tutar, parola ve belge verme. Verirsen ajan reddetmeli; reddetmezse bu bir
   hata.

## 8. Bilinen sınırlar (kısa)

- Giriş kapısı gerçek güvenlik değildir; tarayıcı paketi ve OPEX ucu veriyi kapıdan bağımsız taşır.
- Apps Script CI’da çalışmaz; Sheets tarafı canlıda doğrulanır.
- Sheets’te satır ekleme/silme hesapları hemen güncellemez (basit `onEdit` tetiklenmez).
- 2027 yasal değerleri (asgari ücret, dilimler, teşvik) varsayımdır; mali müşavirle doğrulanmalı.
- Görsel snapshot testi yok; gerçek iOS/Android cihaz testi yapılmadı.
- WebKit’te klavye kaydırma testleri `not_run`.

## 9. Nereden başlamalı?

| İstek | Dosya |
|---|---|
| Bir tarih, sayı, hedef | `src/data/params.ts`, sonra `tests/data.spec.ts` |
| Rol görevleri, KPI | `src/data/roles.ts`, `src/data/program.ts` |
| Dijital pazarlama planı | `src/data/digital.ts` |
| Organizasyon şeması | `src/data/tree.ts` |
| Başlık, gezinme (şerit ve dar ekran çekmecesi), tema | `src/components/AppFrame.tsx` |
| Tablo / kayıt görünümü (dar ekran), grafik kutusu, seçim anahtarı | `src/components/ui.tsx` (`DataTable`, `Chart`, `Choice`) |
| UX sözleşmesi, kabul senaryoları, istisna kayıtları | `docs/ux.md`, AGENTS.md → “UX yeniden tasarım sözleşmesi” |
| Renk, boşluk, yazı, hareket | `src/styles/tokens.css` (sadece burası) |
| Giderler sayfası | `src/views/OpexPage.tsx`, veri ucu `src/data/opex.ts` |
| Bordro ve teşvik hesabı | `apps-script/src/Motor.js` + `tests/opex-motor.spec.ts` |
| Sheets kurulumu | `apps-script/src/Kurulum.js`, `apps-script/README.md` |
| Applet’ler | `src/data/applet.ts` (hesap), `src/views/AppletPage.tsx` (görünüm) |
| İş ortaklığı programı | `src/data/partnership.ts` (içerik ve tarihler), `src/views/PartnershipPage.tsx` (sekmeler, bölümler) |
| Nakit akış tablosu | `src/data/cashflow.ts` (senaryo girişleri, Sheets çıkışları, nakit zinciri), `src/views/CashflowPage.tsx` |
| Gelir planı | `src/data/revenue.ts` (kapasite, `simulate`, senaryolar, büyüme modeli: kur, temsilci ağı, reklam ölçeği, saha büyümesi; 24 ay), `src/views/RevenuePage.tsx` |
| Başabaş | `src/data/breakeven.ts` (filtreler, gider kaynakları, kesişimler, adet noktası, duyarlılık, filtre etkisi); gelir planı sayfasının bölümü |
| İstihdam planı × senaryo | `src/data/staffing.ts` (rol, görev, maliyet, ayıklamayla gelire katkı; Sheets tablosu); gelir planı 2. bölüm ve `/istihdam/` 3. bölüm |
| Dijital pazarlama stratejisi | `src/data/digitalStrategy.ts` (kanallar, bütçe → kayıt → aktif → gelir zinciri, kademeler, LTV ÷ CAC kuralı); gelir planı 3. bölüm |
| Senaryo seçimi | `src/lib/scenario.ts` (`useScenario`, localStorage `istoc-plan-senaryo`), `src/lib/scenarioOptions.ts` (hazır kümeler, seçenekler, adres çubuğu), `src/components/SenaryoKurucu.tsx` (kurucu, yapışkan özet), `src/components/Senaryo.tsx` (`SenaryoSecimi`, `ModSecimi`, `Araclar`) |
