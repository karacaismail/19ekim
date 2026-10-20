# Türksab OPEX — Google Sheets + Apps Script

Giderler sayfasının (<https://karacaismail.github.io/19ekim/giderler/>) veri kaynağı. Google Sheets tek kaynaktır:
girdiler Sheets’te düzenlenir; aynı Apps Script motoru hem Sheets’teki hesap tablolarını/panoyu hem de sayfanın
canlı verisini üretir. Sheets değişince sayfa birkaç saniyede (sayfa açık ve görünürken) güncellenir; yalnız değişen
değerler değişir.

**Hesaplar düz değerdir (özel işlev yok).** Bir girdi hücresi değişince basit `onEdit` tetikleyicisi modeli bir kez
hesaplar ve yalnız içeriği değişen tabloları (Giderler Hepsi, Bordro, Hesap, Personel ve Teşvik hesap sütunları, Toplam
satırları) yazar; hücre “Yükleniyor…” olmaz, eski değer yenisi gelene kadar görünür. Döviz kuru Parametreler’de canlı
GOOGLEFINANCE formülüdür; kur değişince hesaplar Sheets açılınca, sayfa veri istediğinde ya da OPEX → Hesapları yenile ile
yazılır. Zamanlanmış veya kurulu tetikleyici yoktur. Satır ekleyip sildikten sonra (bu işlem düzenleme tetikleyicisini
çalıştırmaz) hesaplar bir sonraki düzenlemede, Sheets açılınca ya da OPEX → Hesapları yenile ile güncellenir. Kodun
yazdığı bir hücre (hesap sütunu, Toplam satırı, Giderler Hepsi/Bordro/Hesap) elle değiştirilirse hemen geri yazılır.

## Dosyalar

| Dosya | Görev |
|---|---|
| `src/Motor.js` | Saf hesap: netten brüte bordro (2026 ücretli tarifesi, kümülatif matrah, asgari ücret GV/DV istisnası, SGK tavanı), teşvikler, 2027 zam ve artışları, raporlar. Node testleri aynı dosyayı çalıştırır. |
| `src/Sheets.js` | Hesap yazımı (`hesaplariYaz_`, onEdit/onOpen), OPEX menüsü, web uygulaması (`doGet` sağlık, `doPost` veri ve bekleyen istek). Eski formüller için `=OPEX(...)` özel işlevi durur; kurulum kullanmaz. |
| `src/Kurulum.js` | Sayfaları, biçimleri, açılır listeleri, adlandırılmış aralıkları (`p_<anahtar>`), hesap formüllerini ve pano grafiklerini kurar; tekrar çalıştırılabilir. |
| `ornek/tohum.ornek.js` | Yalnız kurgusal örnek veri (testler). |
| `build.mjs` | Tek dosya paketi üretir. |

Kişisel veri (ad, ücret, hesap e-postaları, tutarlar) bu repoda yoktur. Gerçek ilk veri repo dışındaki
`../opex-google/Tohum.js` dosyasındadır; tohumlu paket repo içine yazılamaz (`build.mjs` reddeder).

## Sayfalar (Google Sheets)

- **Pano**: KPI kutuları, küme özeti, bordro köprüsü, 8 grafik, kişi tablosu.
- **Giderler Hepsi** (hesaplanır): tüm kalemler ay ay ₺.
- **Giderler OFİS** (girdi): kira ve aidat, internet, telefon, elektrik, ofis ihtiyaçları; aylık ızgara ve “Toplam (₺)”.
- **Giderler TEKNOLOJİ** (girdi): yazılım, yapay zekâ, sunucu, API, AWS vb.; aylık ızgara ve “Toplam (₺)”.
- **Giderler PERSONEL** (girdi): Bordrolu (Net / Brüt / Asgari ücret) ve Freelancer (KDV dahil fatura); 2027 zam, ek teşvik; aylık ızgara ve “Toplam (₺)”.
- **Bordro**: kişi × ay netten brüte tablo, 2026 ve 2027.
- **Parametreler** (girdi): kur (canlı Google Finance, yedekli), 2026 enflasyonu, 2027 zam esası, bordro oranları, dilimler.
- **Teşvikler** (girdi): standart (genel prim indirimi, asgari ücret desteği) ve koşullu teşvikler.
- **Hesap**: pano ve grafik verisi (kod yazar: `kpi`, `ozet`, … blokları).

Gri sütunlar hesaplanır; beyaz hücreler düzenlenir.

**Sayfa adları ve yerleşim:** “Giderler Hepsi” (kod hesaplar; bütün kalemler Ofis / Teknoloji / Personel gruplarıyla
ay ay ₺, grup ara toplamları ve genel toplam), “Giderler OFİS” ve “Giderler TEKNOLOJİ” (girdi `A:G`, ızgara `I:AL`) ve
“Giderler PERSONEL” (girdi `A:I`, hesap `K:O`, ızgara `Q:AT`). Eski adlar (“Düzenli Giderler”, “Giderler”, “Personel
Giderleri”, “Personel”) da okunur; Kurulum Düzenli Giderler’i Küme’ye göre iki sayfaya ayırır (işaretler, elle yazılmış
tutarlar ve formüller korunur) ve eski “Bu ay ödendi / Dahil / Fatura bağlantısı / Not” sütunlarını yalnız beklenen
içerikle kaldırır. Son
veri satırının altındaki **Toplam (₺)** satırını kod hesaplayıp düz değer yazar: giderde satırın kuruyla ₺, yalnız işaretli
aylar; personelde yazılan tutarların toplamı. Gider tutarları satırın para birimiyle ($, €, ₺) görünür; para birimi
değişince biçim kendiliğinden güncellenir. Formül veya kod sonucu olan hücreler mavi yazılır.

**Aylık ızgara** (15 aylık plan: Ekim–Aralık 2026 + 2027’nin 12 ayı): her ay
yan yana iki sütun vardır. “Eki 2026” onay kutusu o ay satırın gider sayılıp sayılmadığını, “Eki 2026 tutar” o ayın
tutarını belirler. Kurulum tutar hücrelerine varsayılan formülü yazar; her satırda her ay rakam görünür (2026: Tutar; 2027:
zam veya artış esasıyla). Bir aya farklı tutar yazmak için hücrenin üzerine yazın (turuncu zemin = elle yazılmış, o aya
özel); varsayılana dönmek için hücreyi silip Kurulum’u yeniden çalıştırın. Personelde tutar ücret esasına göre yazılır
(Net: net, Brüt: brüt, Asgari ücret: net, Freelancer: KDV dahil fatura; 0 = o ay ödeme yok); giderde satırın para
biriminde (Para). İşaretsiz ayda bordro satırı sıfırdır ve kümülatif GV matrahı birikmez. Ör. bir kişinin Ekim maaşı ile
Kasım–Aralık maaşı ayrı yazılabilir; freelancer Ocak–Şubat 2027’de ayrı fatura kesebilir. **Başlangıç ayı:** planın
ilk ayında (Ekim 2026) etkin olmayan satır, ilk işaretli ve 0’dan büyük ayında başlar; önceki aylar (Ocak–Eylül 2026
dahil) yoktur ve bordroda matrah birikmez — ör. 1 Aralık’ta başlayan yeni pozisyonda Ekim/Kasım işaretsiz ya da 0.
Ekim’de etkin satır yıl başından beri var sayılır. Yeni satır eklediyseniz
**OPEX → Kurulum / onarım**’ı yeniden çalıştırın: onay kutuları ve formüller yeni satıra da yazılır; mevcut işaret ve
elle yazılmış tutarlar korunur. Izgara alanında başka içerik varsa kurulum dokunmadan durur ve uyarır.

## Kurulum (bir kez)

Komutu ajan çalıştırır; Google adımları hesap sahibinin onayını gerektirir.

1. Paketi üretin (repo kökü `site/`):

   ```bash
   node apps-script/build.mjs --cikti ../opex-google/OPEX.gs --tohum ../opex-google/Tohum.js
   ```

2. <https://sheets.new> ile yeni tablo açın (ör. “Türksab OPEX”). Uzantılar → Apps Script → `Kod.gs` içeriğini silip
   `OPEX.gs` içeriğini yapıştırın → Kaydet.
3. Tabloyu yenileyin → **OPEX** menüsü → **Kurulum / onarım** → izinleri onaylayın (kendi betiğiniz; “doğrulanmadı”
   uyarısında Gelişmiş → devam). Kurulum bitince erişim anahtarı gösterilir.
4. Apps Script → **Dağıt → Yeni dağıtım → Web uygulaması**: “Şu kullanıcı olarak çalıştır: Ben”, “Erişimi olanlar:
   Herkes” → Dağıt → `…/exec` adresini kopyalayın. (Tablo özel kalır; veri yalnız anahtarla döner.)
5. Giderler sayfasında **Bağlantı** alanına adresi ve anahtarı girin. Adres `src/data/opex.ts → OPEX_ENDPOINT`
   alanına da yazılabilir; o zaman sayfada yalnız anahtar istenir.

## Güncelleme

Kod değişince paketi yeniden üretip Apps Script’e yapıştırın; ardından Dağıt → Dağıtımları yönet → Düzenle →
Sürüm: **Yeni sürüm** (adres değişmez). Sheets yapısı için OPEX → Kurulum / onarım (girilen veri korunur; yalnız
yukarıdaki eski gider sütunları bir kez kaldırılır, kaldırmadan önce “Dahil = hayır” satırlarının bütün ayları işaretsiz
yapılır). Kurulum hata verirse dil ayarı yine tr_TR’ye döner. Apps Script bir çalıştırmayı 6 dakikada keser: Kurulum
adımları ~3,5 dakika dolunca durur, ilerlemesini kaydeder ve “Kurulum sürüyor … yeniden çalıştırın” der; yeniden
çalıştırınca kaldığı adımdan sürer (zamanlanmış görev kurulmaz).
Anahtarı değiştirmek: OPEX → Yeni erişim anahtarı üret (eski anahtar geçersiz olur; düzenli yenilemek önerilir).
Onay kutuları kurulum ve onarımda korunur; “Evet” gibi metinler kutuya çevrilir. Satırda en az bir ay işaretliyse boş
kutu işaretsiz sayılır (ör. Şubat’ta başlayan kişide Ekim–Ocak boş); hiç doldurulmamış satırda her ay işaretlidir.
Tutar boş ama ay tutarı yazılmış kişi yalnız o aylarda hesaplanır. Hiçbir sayfada kilit (koruma) yoktur (kullanıcı kararı 2026-10-20); hesaplanan sayfalar (Pano, Giderler Hepsi, Bordro, Hesap) ve toplam satırları kod yazar; Giderler Hepsi, Bordro veya Hesap’ta elle yapılan değişiklik hemen geri yazılır.

## Erişim

Parametreler → **Sayfa erişimi**: “Herkese açık” ise sayfa veriyi anahtarsız okur ve isimler, ücretler, hesaplar ve
tutarlar adresi bilen herkese görünür (kullanıcı kararı 2026-10-20, yayındaki tablo böyle). “Anahtarla” seçilirse veri
ucu erişim anahtarı ister ve sayfa Bağlantı formunu gösterir. Değişiklik birkaç saniyede geçerli olur.

## Güvenlik

- Anahtar Komut dosyası özelliklerinde (`OPEX_ERISIM_ANAHTARI`, ≈244 bit rastgele) saklanır; koda, repoya ve adrese
  yazılmaz. Sayfa onu POST gövdesinde (`text/plain`, ön kontrol isteği yok) gönderir; yanlış anahtar veya bozuk gövdede
  veri dönmez (bekleme yok: eşzamanlı çalışma kotasını tüketmesin). Her istek Apps Script kotasından düşer; açık sekme
  bekleyen istek gönderir: sunucu Sheets değişene ya da ≈20 sn dolana kadar bekler (önbellek okuması, sayfa okunmaz),
  sonra sayfa yeniden sorar. Her açık sekme bir Apps Script çalıştırmasını sürekli tutar (eşzamanlı çalıştırma sınırı
  30); sekme gizliyken sorulmaz.
- Web uygulaması “Herkes” erişimindedir ama veri döndürmez: `doGet` yalnız sağlık bilgisi, `doPost` anahtar ister.
- Sayfa anahtarı varsayılan olarak yalnız o sekmede tutar (sessionStorage). “Bu cihazda hatırla” localStorage kullanır;
  `karacaismail.github.io` kökü kullanıcının diğer Pages projeleriyle paylaşıldığından önerilmez (sunum bilgisayarında
  kullanmayın). Daha güçlü yalıtım için ayrı bir alan adı (özel domain) gerekir.
- Sheets’ten gelen adlar sayfada metin olarak çizilir; grafik ipuçlarında HTML kaçışlanır.
- Teşvik koşulları ve birlikte uygulanabilirlik mali müşavirle doğrulanmalıdır; değerler Teşvikler sayfasında değişir.
