# Birleşik düzenleme ve bitirme planı — B1, sürüm 3 (Codex denetimi işlendi)

28 Ekim 2026 · Hazırlayan: Claude (uygulama yazarı; salt-okunur belge analizi ve kod denetimi ayrı ajanlarla) · İncelenen
anlık görüntü: `main` `6e7799b` (CA-1) · Durum: **sürüm 3** — S0 onaylı; sahip cevapları §4.1, açık alt sorular §4.2; Codex denetimi `docs/missings.md` (28 Ekim 18:11; MS-01…MS-27, T01–T20)
§3.4 ve §9’da plana işlendi. Eleştiri turu kapandı; uygulama paketleri sürer. Codex’in uyarısı geçerlidir: ertelenen iş “tamamlandı” değil
“kabul edilmiş erteleme”dir; kullanıcı cevabı olmayan iş kararı varsayılanla onaylanmış sayılmaz.
Sürüm 1 (payda 9) sahibin K3 cevabıyla (şirket yapısı) sürüm 2’ye geçti: yeni B3 eklendi, eski B3–B8 → B4–B9 (payda 10); tamamlanmış adım yoktu, B2 numarasını korur.
Bu belge kod değiştirmez ve karar vermez; kararları soru olarak listeler, cevapsız kalırsa uygulanacak varsayılanı yazar.

## 0. Sahip için özet

**Asıl ihtiyaç (hipotez, §1):** iStoc ve Segika için 19 Ekim kararlarından doğan planı — kim ne zaman ne yapacak, hedef ne,
para nereden gelip nereye gidecek — yatırımcıyla ve ekiple **tek yerden, doğru anlam sınırlarıyla** (karar mı, tahmin mi,
örnek mi) incelemek; telefondan başlayarak (320×480). Site bir CRM, muhasebe ya da performans sistemi değildir.

**Bugün:** Site yayında, 26 sayfa, 1131 otomatik test üç tarayıcıda yeşil. Yedi Codex raporuyla yedi ayrı program
yürütüldü. Beşi kapandı, contents 2/9’da (CA-0, CA-1), archetype başlamadı. **Kod kendi içinde tutarlı; belgelerin ve
sayfaların toplamı değil:** dört P0 anlam çelişkisi (F02/F03/F04/F16) kodda çözülmemiş, bir tanesi sayısal — Nakit akışı
sayfası Gelir planı’nda eklenen saha personelinin gelirini sayıyor, maaşını saymıyor (§3.3-C). Altı temel okuma işinden
ikisi hiç karşılanmıyor (şirket neyi planlıyor; bekleyen kararı sonuçlandırma), üçü kısmen. İsim sözlüğü ikiye bölündü,
“bitti” tanımı yok, kalan işin çoğu kod değil **içerik ve karar** istiyor.

**Ne değişecek:** Yedi programın kalanı tek plana indirilir (B0–B8, payda 9). Önce sahibin kararları (§4), hemen ardından
tek teknik P0 (gelir → nakit bütünlüğü; sayısal hata dahil), sonra Kararlar sayfasının gerçek karar kaydı olması, metrik
sözlüğü, mevcut içeriğin taşınması (boş sayfa açılmaz), en sonda insan testi, bağımsız QA, birleştirme ve yayın. Kesilen ve
ertelenenler §5.2–5.3’te gerekçesiyle.

**Nasıl bitecek (§6):** sahip ve bir okur altı görevi kendi cümlesiyle doğru anlatıyor; P0 çelişkiler çözülmüş ya da açık
alternatif olarak etiketli; Gelir planı ile Nakit akışı aynı kadroyu sayıyor; tam tur + CI yeşil; 320×480 ölçümü; gizlilik
taraması; `not_run` listesi açık; her şey `main`’de, Pages güncel.

## 1. Asıl ihtiyaç ve sınırlar (sahip onaylamalı — S0)

Kaynaklar: README (“19 Ekim kararlarının toplantı özeti… tarihli eylem planı”), AGENTS.md (“yatırımcı toplantısı için; yalnız
SMART veri”), contents.md §2.2 ürün vaadi ve §2.3 görev hipotezleri, sahibin 28 Ekim mesajı (“asıl ihtiyacımı nasıl
çözeceğime odaklı… bitirelim”).

| Soru | Cevap (hipotez) |
|---|---|
| Kim okuyor? | Önce yatırımcı ve sahip; sonra operasyon/pazarlama/finans sorumluları ve yeni ekip üyesi (contents §2.3). |
| Hangi işi görüyor? | (1) Şirket neyi planlıyor, hangi karar bekliyor; (2) bir kadro/fiyat değişikliğinin nakit etkisi; (3) yeni ortağın kazancı; (4) yeni çalışanın görevi; (5) bir rakamın kaynağı; (6) bekleyen kararı sonuçlandırma. |
| Neyi iddia etmez? | Gerçek müşteri kaydı, gerçekleşmiş gelir/gider, çalışan performansı, onaylanmış politika (etiketlenmedikçe). |
| Teknik sınır | Statik site + tarayıcı yerel kaydı + Sheets canlı gider planı; giriş kapısı gerçek erişim denetimi değil (AGENTS “Gizlilik ve yayın”). |
| Ekran tabanı | 320×480 ilk ekranda ana sonuç; geniş ekran zenginleştirme (sahip kuralı). |

**S0:** Bu tanım doğru mu? Eksik ya da yanlış bir okuyucu / iş var mı? Cevap bütün planı etkiler.

## 2. Bugünkü durum

### 2.1 Programlar (AGENTS.md kayıtlarına göre)

| Belge | Amaç | Durum | Kalan |
|---|---|---|---|
| ux.md | 320 px tabanlı arayüz sözleşmesi | P1–P6.3 Tamam | İlk tıklama / insan testi yok |
| ux_v2.md | İlişki = kabul birimi | A–D Tamam | V2-E (nakit ay gezgini), V2-G (OPEX canlı veride sunumu sabitleme — ürün kararı); F iz tablosunda “bekliyor”, GA-4a kaydında “kapandı” (belge çelişkisi) |
| ifade.md | Anlaşılır arayüz dili C01–C32 | Tamam | “gelir” → tahakkuk/tahsilat/ödeme terim kararı; anlama testi `not_run` |
| gorsel_algi.md | Görsel algı F01–F24 | GA-0…GA-6 kapandı, yayında doğrulandı | Ertelenen F03/F06/F11/F18/F21/F22/F24; %200 metin, %400 zoom, gerçek cihaz, ekran okuyucu `not_run` |
| affilate.md | Segika komisyon simülasyonu | AF-1, AF-2/3 Tamam | U20 / P01–P04 anlama testi; başlangıç değerleri merkezi parametre dosyasında değil (§13 önerisinden sapma, kayıtsız) |
| contents.md | Tek ana kayıt, ana adres, sunum sözleşmesi | **2/9** (CA-0, CA-1) | CA-2…CA-8; F01–F16’nın çoğu; IA-03, IA-05…48; N01–N07 planlı sayfalar |
| archetype.md | Değişime dayanıklı mimari | Başlamadı; **depoda değil** (§11.4 üçüncü kişi adları) | Aşama 0–7; AR-01…42; A01–A18 (P0: A06–A09, A16) |

Beş belge bağımsız QA / insanla anlama testi ister; hiçbir paket için böyle bir kayıt yok.

### 2.2 Kod ve kanıt

- 26 sayfa; menü beş grup (CA-1); içerik envanteri `src/data/icerik.ts` (CA-0) her sayfanın tek ana kaydı — ama envanterdeki
  kaynak, tarih, kanıt, durum ve ilişki alanları ekranda hiç gösterilmiyor; yalnız alt bilgi kapsam cümlesi kullanılıyor
  (`AppFrame.tsx`). Envanter şimdilik testlerin ve kırıntının kaynağı.
- Test: 1131 Playwright testi (Chromium/Firefox/WebKit), yerelde ≈ 5–6 dk; CI (`pages.yml`) kontrol + derleme + test + Pages ≈ 25 dk.
- Altı okuma işinin kod kapsamı: §3.3-F.

## 3. Eleştirel bulgular

### 3.1 Yapısal (yaklaşımların toplamı)

| # | Bulgu | Kanıt | Sonuç |
|---|---|---|---|
| Y1 | **Program şişmesi.** Yedi belge, ≈ 6.000 satır, çakışan kimlik şemaları (contents F02 ≠ gorsel_algi F02; ux M01–M26 ≠ affilate M01–M44; ifade C ≠ contents C ≠ gorsel_algi C). | docs/*, AGENTS iz tabloları | Tek iş listesi ve “bitti” tanımı yok → B0: tek liste, belge önekli kimlikler (`ct-F02`, `ga-F02`). |
| Y2 | **Kalan işin çoğu içerik.** CA-3/4/5 ve N02–N05 strateji, müşteri yolculuğu, ücret politikası içeriği ister; bu içerik kararlaştırılmış hâlde yok. contents §8: boş kabuk açılmaz. | contents §7–§8; `icerik.ts` `planlandi` | Yalnız **mevcut** içerik taşınır (dijital rol blokları; Kararlar’daki ücret/CRM/mesai). Yeni içerik sahip verince, ayrı plan sürümüyle. |
| Y3 | **P0 çelişkiler karar işi.** F02, F03, F16 teknik olarak düzeltilemez; etiketlenir ya da sahip seçer. | contents §3; §3.3-A/B/D | → §4 (K1–K3); cevap gelmezse “açık alternatif” etiketi. |
| Y4 | **Teknik P0: F04 + sayısal hata.** Gelir planı seçenekleri Nakit akışı’na taşınmıyor; ayrıca eklenen saha personelinin maaşı nakit çıkışında yok. | §3.3-C | → B2, ilk kod paketi; sahip isterse Codex eleştirisini beklemeden. |
| Y5 | **CA-0 alt bilgi cümleleri kodla çelişiyor.** Nakit akışı “taşınan değişiklikler ayrıca gösterilir” diyor (gösterilmiyor); Gelir planı ve Giderler “(Kararlar)” kaydına gönderiyor (yok); her sayfada sabit ön cümle “19 Ekim tahta kararlarından türetildi… kalibre edilir” BCG/Notlar/Affilate için yanlış. | `icerik.ts:192, 345, 364`; `AppFrame.tsx:406-407` | → B1 (ön cümle de kayıttan; yanlış vaatler silinir). |
| Y6 | **İsim sözlüğü ikiye bölündü.** F19 “menü adı = başlık” derken §5.2 kısa adlar getirdi; MLM sayfasının beş adı var (Temsilci ağı / Çok katmanlı pazarlama ağı (MLM) / MLM ağı / büyüme modeli / `/buyume-modeli/`); Parametreler ↔ Varsayımlar ve ayarlar ↔ sayfa içi “Varsayımlar” bölümleri; Kararlar ↔ Karar bekleyenler. | §3.3-G | → K4; B1’de tek paket. |
| Y7 | **Metrik sözlüğü yok.** “Aktif” dört farklı olay (ilk ödeme; geçerli teklif; aktif temsilci; aktif ortak/mükellef); para serisi beş adla (gelir, abonelik ödemesi, nakit girişi, tahsilat, ciro). | §3.3-G | → B3 (K11 ile). |
| Y8 | **Archetype’ın tamamı bitirme için gerekmez.** Gereken üç parça: senaryo anlık görüntüsü (F04), yerel kayıt sürüm/kurtarma (A06–A08), import sınırı lint’i. Dizin yeniden düzeni, ViewModel katmanı, tam CI seti `deneysel`. Belge depoya giremez (adlar). | archetype §3.1, §7, §12 | → B2/B6 yalnız bu parçalar; gerisi v1 dışı (K9). |
| Y9 | **İnsan testi hiç yapılmadı.** | docs raporu | → B7 pilotu (K12). |
| Y10 | **Dar ekran bedeli birikiyor.** CA-1 kırıntısı rol sayfalarında üç satır; beş menü Giderler masaüstü bandını sıkıştırdı (CSS ile çözüldü). | CA-1 kaydı | → K5; B7 ölçüm turu. |

### 3.2 Belgeler arası çelişkiler (★ sahip kararı)

| # | Konu | A | B | Öneri |
|---|---|---|---|---|
| Ç1 | Kırıntı ↔ sunum sırası | ux P6.1: SEQUENCE’tan | contents F15: ana ebeveynden | Çözüldü (CA-1). “Sunum modu” K6. |
| Ç2 | Menü grupları | 27 Ekim: Giderler menüsü, Gelir planı Pazarlama’da | contents §5.2: Finans/Yönetim/Yardımcı | Çözüldü (CA-1). ★ Arşiv menüde: K7. |
| Ç3 | İsim sözlüğü | F19 | §5.2 | ★ K4. |
| Ç4 | Alt bilgi | GA-2 “kesinleşen karar” | F10 blok düzeyi | CA-0 çözdü; kalan Y5 → B1. |
| Ç5 | Dar ekran | P6.2/Affilate: 320×480 ana sonuç | contents §9.3 “sabit piksel şart değil”, §9.1 bağlam katmanı | Sahip kuralı geçerli; bağlam katmanı ilk ekranı itemez. |
| Ç6 | F03 ortaklık politikası | `partnership.ts`: P2 yönlendirme ortağı net tahsilatın %15’i, ilk 6 ücretli ay; Çözüm Ortağı toptan fiyat, nakit komisyon yok | Affilate varsayılanı: satış ortağı 12 ay %15 → 12 ay %10; çözüm ortağı 12 ay %25 → 12 ay %15, nakit; “Ayşe” ilk fatura %10 | ★ K2. Aynı “Çözüm ortağı” adı iki ekonomi. |
| Ç7 | F02 gelir modeli | `revenue.ts`: 399 €/ay abonelik (+ yıllık peşin) | `partnership.ts`: iStoc “işlem başarı ücreti → hizmet → üyelik, yalnız likidite kanıtından sonra”; 399 € onaylı fiyat değil; likiditeden önce üyelik satmak “yapılmayacaklar”da | ★ K1. |
| Ç8 | Yönetişim | affilate §14, archetype §10.4: commit’te AI ortak yazar olmasın | depo geleneği: `Co-Authored-By: Claude` | ★ K8. |
| Ç9 | Kişi adları | archetype §11.4 | AGENTS gizlilik | archetype depo dışı; K9. |
| Ç10 | Kimlik kodları | contents F/C | gorsel_algi F/C; ux/affilate M | B0: önek. |
| Ç11 | E-posta sayfası | ux §9 | contents F12/P24 | ★ K10. |
| Ç12 | “gelir” | ifade §: tahakkuk/tahsilat/ödeme ayrımı | ekranlarda “gelir” hem tahakkuk hem tahsilat | ★ K11 (B3). |
| Ç13 | OPEX ödeme durumu | AGENTS: ödeme takibi yok (`odeme.takip=false`) | ~~sayfa kalemlerde “Ödendi / Bekliyor” gösteriyor~~ | **Yanlış pozitif** (Codex MS-25): `OpexPage.tsx` bu etiketleri yalnız `odemeTakibi` açıkken gösteriyor, kapalıyken “Bu ay var”. B1’den çıkarıldı; `takip` alanı eksikken açık sayılma sınırı şema testiyle incelenir (B7). |

### 3.3 Kod denetimi (28 Ekim, salt-okunur; satırlar `6e7799b`)

**A. F02 — abonelik ↔ likidite.** Gelir motoru yalnız iStoc aboneliğini hesaplıyor (`revenue.ts:320-338, 379-380, 472`;
`params.ts:17`); İş ortaklığı iStoc bölümü sırayı “işlem başarı ücreti → hizmet → üyelik, likidite kanıtından sonra” koyuyor
ve 399 €’yu onaylı saymıyor (`partnership.ts:662, 696, 723, 844-846, 1054-1091`). Likidite için hesap yok; §3.1’in istediği
“henüz hesap modeli yok” bloğu yok; iki sayfa birbirine bağlantı vermiyor; açık kararlar listesinde bu soru yok
(`program.ts:491-500`). **Risk:** yatırımcı finansman ihtiyacını “100 satıcı ayda 399 € öder” varsayımıyla görür; aynı
sitedeki iStoc programı aynı çeyrekte üyelik satmamayı hedefliyor. **En küçük adım:** Gelir planı sonuç özetine “İş modeli:
abonelik planı; likidite pilotunun hesap modeli yok” + bağlantı; `program.ts` açık kararlarına K1.

**B. F03 — ortaklık politikası ↔ Affilate.** Tablo Ç6. Affilate kendini doğru biçimde simülasyon olarak tanıtıyor
(`AffilatePage.tsx:638, 678`) ama: “Çözüm ortağı” adı iki ekonomi; politikayı yükleyen hazır senaryo yok; İş ortaklığı’na
bağlantı yok; envanterde Affilate `yururlukte`, İş ortaklığı `taslak` (`icerik.ts:243, 249, 262, 268`). **Risk:** muhasebe
ofisi bir sayfada nakit komisyonsuz toptan fiyat, diğerinde %25 nakit komisyon görür (SMMM için nakit ödeme
`partnership.ts:370` yasağıyla da çatışır). **En küçük adım:** `affilateKurgu.ts` hazır senaryo “İş ortaklığı taslağı: P2
%15 × 6 ay”; `affilate.ts:798` `cozum` adı; `icerik.ts:262` `taslak`.

**C. F04 — Gelir planı → Nakit akışı (teknik P0).** Gelir planı temel senaryo + 13 seçenek (fiyat, ikinci saha ayı, ek saha,
reklam katı, kur, yıllık peşin payı, ek sabit gider, prim, gider kaynağı…) tutuyor — `istoc-plan-senaryo-secenekler` +
adres çubuğu, `inputsOf` (`RevenuePage.tsx:100, 110, 308`; `scenarioOptions.ts:16, 42`). Nakit akışı yalnız `useScenario()`
kimliğini okuyor, girişleri seçeneksiz `inputsFor(sc)` serilerinden alıyor (`CashflowPage.tsx:62, 66, 246-247`;
`cashflow.ts:85-97, 187-192`). **Özel fiyat ve tarih taşınmıyor;** “Saha ağırlıklı” gibi hazır bileşimler bile “Medyan”
görünüyor; mevcut test bu davranışı sabitlemiş (`tests/gelir.spec.ts:113-123`). Parametreler sayfası değişiklikleri ise
taşınıyor. **Sayısal asimetri:** Gelir planı ikinci saha / ek saha / büyüme sahası personelinin işveren maliyetini Sheets
giderine ekliyor (`revenue.ts:288-296, 434`; `breakeven.ts:170-173`; `staffing.ts:43, 64-76`); Nakit akışı bu maliyeti
eklemiyor ama bu kişilerin gelirini girişe katıyor. Yayın varsayılanlarıyla medyan senaryoda eksik gider kabaca
12 ay + 6 ay × aylık işveren maliyeti (maaş × 2) ≈ 1,8 M₺ — **tarayıcıda doğrulanmadı**, Sheets’te tek saha personeli
varsayımına dayanır. **Risk:** yatırımcı Gelir planı’nda “ikinci saha Aralık, +2 ek saha” seçip Nakit akışı’na geçer; sayfa
“Medyan” yazar, ikinci sahayı Ocak’ta başlatır, maaşını saymaz; nakit açığı tavanı olduğundan küçük görünür. **En küçük
adım:** `buildCashflow`’a eklenen saha maliyeti çıkış satırı; `CashflowPage` seçenek kaydını okuyup `diffCount > 0` ise
“N seçenek taşınmadı” (ya da taşır); test önce (RED: aynı seçeneklerle iki sayfanın kadro maliyeti eşit).

**D. F16 — OPEX markası.** “Türksab” ve “dağıtım belirlenmedi” yalnız alt bilgide (`icerik.ts:345, 364`); veri modelinde
marka/program alanı yok (`opex.ts:72-111, 166`); Nakit akışı Sheets’teki bütün gideri yalnız iStoc girişleriyle
karşılaştırıyor ve kapsamı yazmıyor (`cashflow.ts:161-192`; `CashflowPage.tsx:103`); plan kaynağında Segika CRM maaşı
iStoc gelir planına yükleniyor (`staffing.ts:179-187`). **Risk:** yatırımcı açığı “iStoc’un açığı” sanır. **En küçük adım:**
Nakit akışı varsayımlarına ve sayfa başına “Kapsam: iStoc girişleri × Türksab gider planının tamamı; markaya dağıtım yok”;
`program.ts` açık kararına K3.

**E. F13 — düzenleyiciler.** Altı ayrı kayıt: Parametreler (`istoc-plan-parametreler`, sürümsüz, uyarı var, hata söyler),
temel senaryo (`istoc-plan-senaryo`, sürümsüz, sessiz), Gelir planı seçenekleri (`…-senaryo-secenekler` + adres, sürümsüz,
sessiz), Applet (`turksab-applet` v1), Affilate (`segika-affilate-v1`, yazdıktan sonra geri okur), Notlar
(`istoc-plan-notlar`, sürümsüz). Paylaşılan tek senaryo anlık görüntüsü yok; ikinci saha tarihi, fiyat ve yıllık peşin payı
iki yerde düzenlenebiliyor (Parametreler bütün siteyi, senaryo kurucu yalnız Gelir planı’nı değiştiriyor). **En küçük
adım:** `scenarioOptions.ts` kayıt sonucunu döndürsün; `SenaryoKurucu` durum satırı “bu tarayıcıda kaydedildi /
kaydedilemedi; Nakit akışı’na taşınmaz”.

**F. Altı okuma işi.** (1) Şirket neyi planlıyor — **yok**: ana sayfa yalnız şema; Genel bakış/Strateji planlı; A’daki
çelişki hiçbir sayfada görünmüyor. (2) İkinci saha personelinin bütçe/nakit etkisi — **kısmen**: İstihdam + Gelir planı
çalışıyor, zincir Nakit akışı’nda kopuyor (C). (3) Yeni ortağın kazancı — **kısmen**: Segika için Affilate hesaplıyor ama
politikayla uyuşmadan (B); iStoc ortağı için hesap yok. (4) Yeni çalışanın görevi — iStoc rollerinde **çalışıyor**;
Segika rolü iStoc CRM kopyası ve `partnership.ts:396` bu üründe maaşlı satış temsilcisinin taşınamayacağını söylüyor.
(5) Bir rakamın kaynağı — **kısmen**: Nakit akışı satır kaynağı ve varsayım listeleri var; envanterin kaynak/tarih/kanıt
alanları görünmüyor; Kaynaklar planlı. (6) Bekleyen kararı sonuçlandırma — **yok**: Karar bekleyenler salt okunur; listede
iki karar, ikisinin son tarihi 26 Ekim geçmiş, “gecikti” durumu yok (`program.ts:491-500`); alt bilgi ücret/CRM/mesai
“kendi adreslerinde” derken bölümler hâlâ bu sayfada.

**G. Terimler.** Y6, Y7.

### 3.4 Codex denetimi (docs/missings.md, 28 Ekim) → plan eşlemesi

Codex B2.1’i doğruladı (1,8 M₺ fark → 0) ve 27 bulgu bıraktı. Durum sözlüğü denetimdeki gibi: uygulandı / kısmi / eksik / hatalı / NOT_RUN.

| MS | Özet | Öncelik | Paket | Durum |
|---|---|---|---|---|
| MS-01 | Eklenen saha gideri (eski P0) | — | B2 | B2.1 ile giderildi; “Sheets’te tek saha” varsayımı ve çift sayım kabulü (T02) B2c/B3’te |
| MS-02 | Seçenek aktarımı: gider kaynağı istisnası ve sürümlü anlık görüntü | P1 | B2c (metin), B6 (snapshot) | “aynen / aynı etkin girdiler” metinleri düzeltilecek; snapshot B6 |
| MS-03 | “Kalıcı toparlanma” hesabı hatalı (`[-100,50,-30,50]` → Kasım) | P1 hatalı | **B2c** | T03 ile önce kırmızı, sonra ilk/kalıcı toparlanma ayrımı |
| MS-04 | Affilate bozuk/uyumsuz kaydın üzerine yazıyor | **P0** | **B6-öncü (hemen)** | T06: ham kayıt korunur; kurtarma/üzerine yazma açık karar |
| MS-05 | Parametre yüklemede tür dışı doğrulama yok (negatif fiyat, geçersiz tarih kabul) | P1 | **B6-öncü (hemen)** | T05: alan anlamına göre doğrulama; geçersiz değer varsayılana döner, kullanıcıya yazılır |
| MS-06 | Sekmeler arası çakışma çözümü yok | P1 | B6 | T08 |
| MS-07 | Updater içinde kayıt/geçmiş yan etkisi | P1 | B6 | T10 |
| MS-08 | İş modeli (K1) varsayılanla onaylanamaz | P1 | B0/B1 | K1 “karar bekliyor” (§4.1 düzeltildi) |
| MS-09 | Ortaklık politikası ↔ Affilate örneği bağlanmamış | P1 | B1/B5 | K2 cevabı (aylık %10 / yıllık %15, girdi) politika kaydı olur; “çözüm ortağı” adı alt türle ayrılır |
| MS-10 | Giderin marka kapsamı ana sonuçta görünmüyor | P1 | **B2c** | ana sonuç bağlamı: “iStoc girişleri × ortak gider planı; markaya dağıtım belirlenmedi”; “Türksab toplam” denmez (B3 şirket yapısına kadar) |
| MS-11 | Alt bilgi cümleleri geleceği olmuş gibi anlatıyor; sabit ön cümle her sayfada | P1 | **B2c** (ön cümle, nakit cümlesi), B1 (Kararlar atıfları) | her cümle mevcut davranıştan |
| MS-12 | Envanter alanları kullanıcıya görünmüyor; yayın ↔ politika durumu aynı alanda | P1 | B1/B5 | `publicationStatus` / `policyStatus` ayrımı |
| MS-13 | Kararlar karar yaşam döngüsü taşımıyor; gecikme yok | P1 | B1 | soru → seçenek → sahip → tarih → sonuç → yürürlük |
| MS-14 | Blok taşıması yapılmadı | P1 | B5 | ct-IA-03/05/06/30 |
| MS-15 | Metrik sözlüğü yok | P1 | B4 | K11 |
| MS-16 | Applet dayanakları kaynak/örnek ayrımı | P1 | B6 (Genel bakış/Kaynaklar) | ga-F18 |
| MS-17 | İfade değerlendirme döngüsü kapanmadı | P1 | B4/B8 | uzman yeniden puanlama + pilot |
| MS-18 | UX ilkeleri: görev sonuçları gösterilmedi | P1 | B8 | görev gözlemi |
| MS-19 | WCAG 2.2 AA kapanışı yok | P1 NOT_VERIFIED | B8 | kriter matrisi, `not_run` açık |
| MS-20 | Görsel referans katmanı yok | P1 | B8 | az sayıda master için `toHaveScreenshot` |
| MS-21 | Import sınırı / tüketici kapısı yok | P1 | B8 | negatif fixture FAIL kapısı |
| MS-22 | Test edilen build kimliği doğrulanmıyor | P1 | B9 | ar-38, T18: build id ↔ HEAD |
| MS-23 | Git kimliği ve AI imzası kuralı | P1 süreç | **yapıldı** | `3d10eff`’ten itibaren `karacaismail <35493655+karacaismail@users.noreply.github.com>`, trailer yok; geçmiş yeniden yazılmaz |
| MS-24 | Dar v1 bütünün tamamlanması gibi kapatılamaz | P1 | B0/B8 | §5.2 “kabul edilmiş erteleme”; eski kabul kimlikleri → karşılık tablosu (missings §8) |
| MS-25 | Ç13 yanlış pozitif | P2 | — | geri alındı (§3.2) |
| MS-26 | archetype.md paylaşımı | P2 | **yapıldı** | `docs/archetype.md` rol sürümü (adlar rol adıyla); özgün kopya sahipte |
| MS-27 | Yeşil suite ≠ doğru davranış | P1 süreç | her paket | bağımsız karşı örnek önce kırmızı; T01–T20 |

## 4. Sahip kararları (B0 — kod yok; cevap gelmezse varsayılan)

Her karar bir yolculukla; teknik ve geri alınabilir ayrıntılar sahibe sorulmaz (onlar B paketlerinde yazarın işi).

| K | Karar | Yolculuk | Seçenekler | Varsayılan |
|---|---|---|---|---|
| K1 | iStoc gelir modeli (F02) | Yatırımcı Gelir planı’nda abonelik tahminini, İş ortaklığı’nda “önce likidite”yi okuyor; tek plan sanıyor. | (a) abonelik esas, likidite açık alternatif; (b) likidite esas (hesap modeli yok → tahmin sayfaları “model yok”); (c) ikisi birlikte, geçiş koşulu yazılır | (a): iki strateji kaydı; hesap abonelik; likidite “hesap modeli yok” etiketi + karşılıklı bağlantı |
| K2 | Segika ortak politikası (F03) | Ortak adayı İş ortaklığı’nda “ilk 6 ay %15”, Affilate’te “12 ay %15 + 12 ay %10” görüyor. | (a) İş ortaklığı metni yürürlükte, Affilate varsayılanı ona eşitlenir; (b) Affilate varsayılanı yürürlükte; (c) ikisi taslak | (c): ikisi “taslak A/B” etiketli; Affilate “politika sürümü” seçer; “Çözüm ortağı” adı Affilate’te değişir |
| K3 | OPEX kapsamı (F16) | Yatırımcı Nakit akışı’nda iStoc gelirleriyle Türksab giderlerini toplanmış görüyor. | (a) Türksab ortak gider, dağıtım yok → “Türksab toplam” etiketi; (b) markaya dağıtım oranı | (a) |
| K4 | İsim sözlüğü | Menüde “Hedefler”e basan okur “90 gün hedefleri” başlığı görüyor. | (a) başlık = menü adı (+ alt açıklama); (b) bugünkü gibi (tek kayıt, farklı ad) | (b); (a) seçilirse B1’de tek paket |
| K5 | Kırıntı derinliği | 320 px’te rol kırıntısı üç satır. | (a) grup adı kalsın; (b) yalnız bağlantılı ebeveyn | (a) |
| K6 | Önceki / sonraki | Her sayfada sunum sırası bağlantısı; contents “yalnız sunum modunda”. | (a) kalsın; (b) yalnız sunum anahtarıyla | (a) |
| K7 | Arşiv menüde | Yardımcı › Arşiv | (a) kalsın; (b) yalnız alt bilgi | (a) |
| K8 | Commit ortak yazar satırı | — | (a) kalsın; (b) kaldırılsın | (a) |
| K9 | archetype.md | Depoda değil (adlar). | (a) rol adıyla düzenlenip depoya; (b) dışarıda | (b) |
| K10 | E-posta sayfası (F12) | Paylaşılan sitede kişisel görüşme taslağı. | (a) kalsın (noindex, “kişisel”); (b) siteden çıksın | (a) |
| K11 | Para ve “aktif” terimleri | “gelir / abonelik ödemesi / nakit girişi / tahsilat / ciro” aynı seri; “aktif” dört olay. | (a) metrik sözlüğünde ayrı kimlikler; ekranda “gelir (tahakkuk)” / “tahsilat”; “aktif” olay adıyla | (a) |
| K12 | İnsan testi | Bitiş için en az bir pilot. | kim: sahip + yatırımcı benzeri bir okur; ne zaman | B7’de, §6’daki 6 görev |
| K13 | Sayısal P0’ı Codex eleştirisini beklemeden düzeltmek | Bugün yayındaki Nakit akışı kadro maliyetini eksik gösteriyor. | (a) B2’yi hemen başlat (test önce); (b) plan onayını bekle | (a) önerilir |

### 4.1 Sahip cevapları (28 Ekim akşamı)

| K | Cevap (sahibin sözleriyle, kısaltılmış) | Plana etkisi |
|---|---|---|
| S0 | “Evet.” | §1 tanımı kesinleşti. |
| K1 | Cevap yok. | **Karar bekliyor** (Codex MS-08: yanıtsızlık onay değildir). Hesap “koşullu abonelik modeli” olarak çalışır; likidite yaklaşımı alternatif olarak görünür kalır; Kararlar sayfasında açık soru (B1). Strateji onayı üretilmez. |
| K2 | “Girdi olmalı; aylık satarsa %10, yıllık satarsa %15.” | Yeni politika kaydı (28 Ekim): komisyon oranı girdi; aylık abonelik satışında %10, yıllık satışta %15. İş ortaklığı metni (“ilk 6 ay %15”) ve Affilate varsayılanları bu kayda göre güncellenir (B1 kayıt, B6 Affilate). Süre ve taban §4.2-1. |
| K3 | “Segika ve SGK aynı proje, Mogem şirketinin gideri; iStoc ile Toptan kardeş proje, iStoc şirketinin gideri; hepsinin toplamı Türksab (şirketler grubu, holding gibi; Mogem ve iStoc ayrı şirket, kendi gelir ve giderleri olmalı). Mogem’in 2026’da aylık sabit, 2027’de aylık sabit geliri var (tutar sahipte); Mogem parayı Türksab’a aktarır, Türksab iStoc’a yatırım yapar ve Mogem’in giderini öder.” | **Yeni adım B3:** şirket yapısı (Türksab → Mogem [Segika/SGK], iStoc Company [iStoc, Toptan]); tutarlar Sheets’te (repoya girmez); şirket bazlı gelir-gider-nakit, grup toplamı ve şirketler arası akış. Alt sorular §4.2-2…4. |
| K4 | “Smart Goals.” | Hedefler sayfası ve menü adı “SMART hedefler”; genel kural: menü adı = sayfa başlığı, uzun ad amaç satırında (B1). Teyit §4.2-5. |
| K5 | “Test et, karar ver.” | Ölçüldü ve karar verildi (B2.2): dar ekranda bağlantısız grup kırıntısı gizli, ebeveyn + başlık kalır; geniş ekranda tam yol. B8 ölçüm turunda yeniden bakılır. |
| K6 | “Evet ama güncelle.” | Önceki/sonraki kalır; sunum sırası beş grup düzenine ve yeni adlara göre güncellenir (B1). |
| K7 | Cevap yok → Arşiv menüde kalır; ana görevle rekabet edip etmediği B8 pilotunda sınanır. | — |
| K8 | Soru değil, **bağlayıcı kural** (Codex MS-23): commit yazar/committer `karacaismail <35493655+karacaismail@users.noreply.github.com>`; AI ortak yazar satırı yok. | `3d10eff`’ten itibaren uygulanıyor; AGENTS “Gizlilik ve yayın”. |
| K9 | Revize (MS-26): archetype.md **rol sürümü** depoda (`docs/archetype.md`, adlar rol adıyla); kişi/erişim devir kaydı sahipte. | yapıldı |
| K10 | “Evet; menüde olmasın, gizli kalsın, URL bilen girer.” | Mevcut durum korunur (`/email/`; menüde yok; noindex). Not (MS-24/K10): `noindex` gizlilik sağlamaz; sayfa herkese açık sitede ve depodadır. “Kişisel” etiketi B1. |
| K11 | İki akış: Segika SaaS satışı → faturalanan gelir → tahsilat → kasa; iStoc paket satışı → faturalanan gelir → tahsilat → kasa. | Metrik sözlüğü marka bazlı üç aşama: faturalanan / tahsil edilen / kasa (B4); nakit akışı tahsilatı kullanır. |
| K12 | “19ekim = ben; istoc.com yazılımcı ekip.” | Pilot: sahip tek başına, altı görev (B8). Pilot ilk yanlış anlamaları bulur; bütün persona ihtiyaçlarının ve WCAG AA’nın kanıtı değildir (MS-19). |
| K13 | (a) — B2.1 yapıldı (`fa58509`). | — |

### 4.2 Açık alt sorular (cevap gelmezse yazılan varsayım uygulanır)

1. **K2 süresi ve tabanı:** %10 / %15 her ödemede mi (müşteri ödedikçe), yoksa yalnız ilk yıl mı? Taban net tahsilat mı? Bütün ortak tipleri için aynı mı? *Varsayım:* her ödemede, net tahsilat üzerinden, bütün ortak tipleri; Affilate’te girdi olarak değiştirilebilir.
2. **“Toptan” projesi:** adı/yazımı ve bugün sitede içeriği var mı? *Varsayım:* yalnız yapıda yer alır, içerik yok.
3. **Mogem’in giderleri:** hangi Sheets kalemleri? Sheets’e “Şirket” sütunu (Mogem / iStoc / Türksab ortak) için kurulum adımı yazılabilir; dolduran sahip. *Varsayım:* sütun boşsa kalem “Türksab ortak” sayılır.
4. **Mogem sabit gelirleri** Sheets’e girilir (ör. “Gelirler” sayfası: şirket, ay, tutar); tutar repoya ve bu belgeye yazılmaz. Onay?
5. **K4 adı** “SMART hedefler” (menü ve başlık) ve kuralın bütün sayfalara uygulanması (Kararlar, Temsilci ağı, Varsayımlar ve ayarlar) uygun mu?

## 5. Birleşik plan B1 — sürüm 2 (payda 10; sayaç `X/10 tamamlandı, Z/10 aktif`)

CA-0 ve CA-1 bu planın öncülü (contents sayacı 2/9’da donar; ilerleme B sayacıyla yazılır). Sürüm 2: yeni B3 (şirket yapısı); eski B3–B8 → B4–B9. Her paket: RED → GREEN →
`npm run check` → `npm run build` → tam tur (üç tarayıcı) → AGENTS kaydı → tek konulu commit → push (CI + Pages). Paket
raporu: `once`, `simdi`, `fark`, `kullaniciYolculugu`, `kalanEngel`, `capability_delta`, çalışır / çalışmaz ürün iddiası.

| B | Paket | Kapsam | Kabul (test önce) | Bağımlılık | Büyüklük |
|---|---|---|---|---|---|
| B0 | **Karar kapısı ve tek liste** | §4 cevapları (**geldi, §4.1**); docs kimlik önekleri; AGENTS “Birleşik plan” bölümü ve sayaç; archetype dışarıda | belge | §4.2 alt soruları | 1 (belge) — aktif |
| B1 | **Kararlar gerçek kayıt olur; anlam temizliği** (CA-2) | Karar kaydı alanları (soru, seçenekler, etki, sahip, son tarih, durum: bekliyor/gecikti/karar verildi/yürürlükte); F02/F03/F16 kayıtları (`program.ts` → karar verisi); alt bilgi ön cümlesi ve yanlış vaatler kayıttan (Y5); envanter `durum` alanları düzeltilir (Affilate `taslak`); OPEX “Ödendi/Bekliyor” (Ç13); K4 uygulanırsa ad eşitleme; Gelir planı ↔ İş ortaklığı ↔ Affilate karşılıklı bağlantı | ct-IA-05/14/18/34; icerik.spec; ui.spec karar sayfası | K1–K4 | 2 |
| B2 | **Gelir → Nakit bütünlüğü** (F04; archetype Aşama 1–2 pilotu) | `cashflow.ts`: eklenen saha personeli maliyeti çıkış satırı; `CashflowPage`: seçenek kaydını okur — taşır ya da “N seçenek taşınmadı” yazar; tek etkin girdi anlık görüntüsü (`scenarioOptions` + `scenario`), sürümlü kayıt anahtarı; `SenaryoKurucu` kayıt durumu; “yalnız bu tarayıcı” uyarısı tek bileşen (F13) | ar-13/14/15, ct-IA-23/27; gelir+nakit spec: aynı seçeneklerle iki sayfanın kadro maliyeti ve senaryo adı eşit; T03 toparlanma | — (K13 ile hemen) | 3 — B2.1 `fa58509`, B2.2 `3d10eff`; **B2c yeniden açıldı** (Codex MS-02/03/10/11): toparlanma hesabı, kapsam ve “aynen” metinleri, alt bilgi ön cümlesi |
| B3 | **Şirket yapısı ve şirket bazlı finans** (yeni; K3, K11) | `src/data/sirketler.ts`: Türksab (grup) → Mogem (Segika/SGK) ve iStoc Company (iStoc, Toptan); Sheets’e “Şirket” sütunu (Apps Script kurulum adımı + motor; boşsa “Türksab ortak”), gider kalemleri şirkete göre; Mogem sabit gelirleri Sheets’te (“Gelirler” sayfası; tutar repoya girmez); nakit akışı: şirket bazlı giriş/çıkış, Mogem → Türksab aktarımı, Türksab → iStoc yatırımı, Türksab’ın ödediği Mogem gideri; grup toplamı görünümü; Giderler ve Nakit akışı sayfalarında şirket seçici | opex-motor/opex-script: Şirket sütunu ve Gelirler; data.spec: şirket toplamları = kalem toplamları, grup = şirketler toplamı; nakit.spec: şirket seçici ve grup satırı; 320×480 | §4.2-2…4; Sheets düzenlemesi sahip | 3 |
| B4 | **Metrik sözlüğü ve “ölçülmedi”** (CA-6) | `src/data/metrics.ts`: kimlik, birim, dönem, kaynak, olay tanımı (üye/ilk ödeme/devam eden/aktif temsilci/aktif ortak); Hedefler, rol KPI, İş ortaklığı, Temsilci ağı aynı kimliği okur; gerçekleşen yoksa “ölçülmedi” (0 çizilmez); K11 terimleri ekranda | ct-IA-16/19, ar-05 | K11, B3 (şirket/marka kapsamı) | 2 |
| B5 | **Mevcut içeriğin taşınması** (CA-3/4/5’in mevcut-içerik kısmı) | Dijital rol `#olcum/#otomasyon/#uretim/#icerik-plani` → `/pazarlama-operasyonu/`; Kararlar `#ucret/#crm/#mesai` → `/ucret-politikasi/` ve `/musteri-yolculugu/#asamalar`; kaynakta özet + bağlantı; eski hash köprüleri; envanterde `planlandi` kalkar | ct-IA-03/05/06/30; icerik.spec | B1 | 3 |
| B6 | **Genel bakış, Kaynaklar, kapsam notları, Affilate politika sürümü** (CA-7) | `/genel-bakis/` kanonik kayıtlardan (N01: amaç, kapsam, kritik karar, yakın teslim, finansman özeti; K1 çelişkisi görünür); Kaynaklar önce bölüm (envanter kaynak/tarih/kanıt alanları ekranda); F13 düzenleyici kapsam notu; Affilate “politika sürümü” (K2) | ct-IA-04/07/12/13; affilate ek U | B1, B2, B3 | 2 |
| B7 | **Yerel kayıt dayanıklılığı** (archetype Aşama 3, dar) | Parametreler / temel senaryo / seçenekler / Notlar: sürüm anahtarı, dışa/içe aktarma, bozuk kayıtta kurtarma, iki sekme çakışması (Applet ve Affilate’teki kalıp genelleştirilir) | ar-23…28, ar-41 | B2 | 2 |
| B8 | **Kapanış ve cila** (CA-8) | IA durum tablosu; 320×480 ölçüm turu (her sayfa ilk ekran, kırıntı dahil); %200 metin; gizlilik/secret taraması; rehber ve AGENTS tek liste; insan testi pilotu (§6); bağımsız QA (Codex salt-okunur, aynı anlık görüntü hash’i) | tam tur + CI; pilot raporu (sahip, K12); `not_run` listesi | B1–B7 | 2 + pilot |
| B9 | **Birleştirme ve yayın** | Worktree dalları → `main` (ff-only); birleşmiş uzak dallar ve worktree’ler temizlenir (onayla); ana klasör hizalanır; Pages doğrulanır (200, son commit) | CI yeşil; Pages; AGENTS yayın kaydı | B8 | 1 |

Toplam ≈ 20 paket + pilot. **Sayaç (sürüm 3): 0/10 tamamlandı, 2/10 aktif** (B0: alt sorular ve belge önekleri kalan; B2: B2c Codex bulgularıyla yeniden açıldı — 2a/2b yayında). B6’nın iki dar koruması (MS-04, MS-05) öne alındı.

### 5.1 Sıra gerekçesi
1. B0 önce: kararsız çelişki yeni sayfalara kopyalanır (Y3). Cevaplar geldi; alt sorular (§4.2) B1/B3 başlarken kapanır.
2. B2 B1’den bağımsız (ayrı dosyalar) ve yayındaki sayıyı düzeltir; B2.1 yapıldı.
3. B3 (şirket yapısı) B4’ten önce: metrik sözlüğü şirket/marka kapsamıyla tanımlanır; nakit akışı şirket bazlı olmadan Segika/iStoc akışları (K11) ayrışmaz.
4. B4, B5’ten önce: metrik kimliği olmadan taşınan bloklar kopya tanım üretir (Y7).
5. B5 yalnız mevcut içerik; yeni içerik (Strateji, Müşteri yolculuğu tam, Toptan) sahip verince ayrı plan sürümü.
6. B7, B2’nin kayıt modeline dayanır; B6 Genel bakış için B1’in karar kaydı ve B3’ün şirket yapısı gerekir.
7. B8/B9 en sonda; bağımsız QA değişmemiş anlık görüntüde.

### 5.2 Kabul edilmiş erteleme (tamamlandı sayılmaz; her madde için karşılık ya da gerekçe — Codex MS-24)
- archetype §3.1 dizin yeniden düzeni, ViewModel katmanı, tam CI kapı seti, branch koruması: bitirme için gerekmez; `deneysel`.
- N02 Strateji, N03 Müşteri yolculuğu (tam), N04 Pazarlama operasyonu (yeni içerik), N06 Ölçüm panosu: içerik yok → boş kabuk açılmaz; B4 yalnız mevcut blokları taşır.
- Segika finans planı: veri yok (contents §8.1); iStoc motoruna etiket değiştirerek üretilmez.
- ux_v2 V2-E/V2-G; gorsel_algi F03/F06/F11/F18/F21/F22/F24: altı okuma işini değiştirmiyor; B7 ölçüm turunda yeniden değerlendirilir.
- Arama (contents §5.3.6): 26 sayfada menü yeterli.

### 5.3 Kesilen
- Yeni Codex programı açmak: eleştiri yalnız bu plana (§7).
- “Dashboard” görünümleri: gerçekleşen veri yok (contents §2.2).

## 6. Bitiş tanımı (Definition of Done)

1. **Anlam:** F02/F03/F04/F16 çözüldü ya da “açık alternatif / taslak sürüm” etiketli; hiçbir sayfa öneri/örnek/taslağı karar gibi sunmuyor (ct-IA-18); alt bilgi cümleleri kodla uyumlu.
2. **Sayı:** Gelir planı ve Nakit akışı aynı kadro maliyetini ve aynı etkin girdileri kullanıyor ya da farkı ekranda yazıyor (ar-13); şirket bazlı gelir-gider-nakit ile grup toplamı tutarlı, Mogem/iStoc akışları ayrı (B3).
3. **Yolculuk:** §1’deki altı iş uçtan uca; pilotta (sahip + bir okur) her görev kendi cümlesiyle doğru anlatılıyor; yanlış para/komisyon/kapsam yorumu sıfır (contents §13.4).
4. **Ölçüm:** 320×480 her sayfada ilk ekranda ana sonuç, yatay taşma yok, ≥ 14 px, hedef ≥ 44 px; %200 metin büyütmede okunur.
5. **Kanıt:** tam tur üç tarayıcıda yeşil; CI yeşil; `not_run` listesi (gerçek cihaz, ekran okuyucu, forced-colors tam seti) AGENTS’ta; bağımsız QA raporu aynı anlık görüntüde; test edilen build kimliği HEAD ile eşleşir (T18); kritik master’lar için görsel referans (T19); yasak bağımlılık fixture’ı kapıda FAIL (MS-21).
5b. **Kayıt güvenliği:** bozuk / uyumsuz / kısmi yerel kayıt sessizce üzerine yazılmaz, kurtarma yolu görünür (T05–T09); “kaydedildi” yalnız gerçek yazım için.
6. **Gizlilik:** üçüncü kişi adı, tutar, anahtar yok (tarama); archetype depoda değil (K9).
7. **Belge:** AGENTS tek liste + sayaç; rehber güncel; docs kimlikleri önekli.
8. **Yayın:** `main` tek doğru kaynak; worktree ve dallar temiz; Pages son commit’te.

## 7. Codex’e eleştiri isteği

Codex Desktop MASTER’dan istenen: **yalnız bu belgenin** salt-okunur eleştirisi; yeni program/paket üretmeden. Yanıt
`docs/birlesik_plan_elestiri.md` (önek `bp-`), en çok 60 madde; her madde: bölüm · sorun · kanıt (dosya:satır / belge §) ·
öneri · öncelik (P0/P1/P2) · kim karar verir (sahip / yazar).

1. §1 ihtiyaç tanımı ve altı yolculuk doğru ve yeterli mi? Eksik okuyucu / iş var mı?
2. §3.3-C sayısal bulgu (nakit akışında eklenen saha maliyeti eksik; seçenekler taşınmıyor) doğru mu; tutar tahmini ve en küçük adım uygun mu?
3. §3.1–3.2 bulgular ve çelişkiler eksik mi; yanlış atfedilen var mı?
4. §4: sahibe sorulmaması gereken (teknik) ya da sorulması gereken (ürün / geri alınamaz) başka karar var mı? Varsayılanlar güvenli mi? K13 önerisi doğru mu?
5. §5 sıra (sürüm 2): B2’yi B1 ile paralel/önce almak riskli mi; B3 (şirket yapısı) → B4 (metrik) → B5 (taşıma) sırası; payda 10 ve ≈ 20 paket gerçekçi mi?
6. §5.2 ertelenenler: bitirme için gerekli olduğu hâlde ertelenen var mı (archetype A06–A09, A16)?
7. §6: ölçülemeyen madde var mı; pilot (sahip + 1 okur, 6 görev) yeterli mi?
8. Belge sahibin yanlış anlama riskini (karar / tahmin / örnek) bir yerde artırıyor mu?
9. §4.1 cevapları ve §4.2 alt soruları: K2 politikası (aylık %10 / yıllık %15, girdi) ve K3 şirket yapısı (Türksab → Mogem, iStoc; tutarlar Sheets’te) plana doğru işlendi mi; B3 kapsamında eksik varsayım ya da gizlilik riski var mı?

## 8. Kaynak haritası
- docs/contents.md §2, §3, §5, §7, §8, §13–§15; docs/gorsel_algi.md F19; docs/affilate.md §13–§14; docs/archetype.md §3, §7, §9.3, §12, §13 (depo dışı).
- AGENTS.md: paket kayıtları (P1–P6.3, A–D, C01–C32, GA-0–GA-6, AF-1–3, CA-0, CA-1), iz tabloları, “Bilinen sınırlar”, “Gizlilik ve yayın”.
- Salt-okunur ajan raporları (28 Ekim): belge analizi (yedi belge + AGENTS) ve kod denetimi (A–G) — bu belgeye işlendi; satır numaraları `6e7799b`.

## 9. Kabul regresyonları (docs/missings.md §10, T01–T20) → paket eşlemesi

| T | Karşı örnek (kısa) | Paket | Durum |
|---|---|---|---|
| T01 | Aynı kadro, sıfır Sheets: nakit = başabaş gideri | B2 | geçti (`tests/data.spec.ts` B2) — korunur |
| T02 | Sheets’te zaten ikinci saha kişisi: çift sayım yok | B3 | açık (şirket/kadro eşleştirme) |
| T03 | Dönem sonu `[-100,50,-30,50]`: ilk ↔ kalıcı toparlanma | **B2c** | sırada (önce kırmızı) |
| T04 | 13 seçenek ↔ nakit ↔ yeniden açılış; kaynak istisnası kayıtlı ürün kararı | B2c/B6 | kısmi (B2.1 testleri) |
| T05 | Saklanan negatif fiyat / geçersiz tarih domain’e geçmez | **B6-öncü** | sırada |
| T06 | Affilate `v=99` / bozuk JSON: açılış ham kaydı değiştirmez | **B6-öncü** | sırada |
| T07 | Eski bazla kaydedilmiş senaryo + yeni varsayılan | B6 | açık |
| T08 | Aynı revizyondan iki sekme | B6 | açık |
| T09 | Migration sırasında kesinti | B6 | açık |
| T10 | Tek geçişin tekrar değerlendirilmesi (updater saflığı) | B6 | açık |
| T11 | `%0`, farklı yıl oranları, 10 fiyat ayı / 12 hizmet / 6 taksit | Affilate | geçti (`affilate-model.spec.ts`) — korunur |
| T12 | Fiyat/politika değişince tablo/grafik/CSV/açıklama birlikte | B5/B8 | kısmi |
| T13 | `takip=false` ve açık OPEX fixture’ı | B8 | açık (MS-25 sonrası doğrulama) |
| T14 | Geç yanıt sırası, seçili kayıt silinmesi | B8 | açık |
| T15 | Eski hash → yeni ana adres | B5 | açık |
| T16 | 320’de iki senaryo / üç ortak kıyası | var | geçti (nakit/affilate 320 testleri) — korunur |
| T17 | Tab odağı, panel değişimi, zoom | B8 | kısmi |
| T18 | Yanlış worktree / eski dist aynı portta | B9 | açık (build kimliği) |
| T19 | Kritik master değişikliğinde görsel fark | B8 | açık |
| T20 | 100 ₺ × 10 ay / 12 ay hizmet / 12 taksit: üç anlam ayrı | Affilate | hesap geçti; ilk kullanıcı anlama kaydı B8 |
