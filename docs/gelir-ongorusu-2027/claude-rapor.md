# 2027 gelir öngörüsü: Claude analizi

Hazırlanma tarihi 5 Kasım 2026. Rakamlar sitedeki modelden (`src/data/gelir2027.ts`) üretildi ve sayfadaki “2027 gelir öngörüsü” bölümüyle aynıdır. Ana sonuç medyan kadro seçeneği ve “evden çalışma ya da ücretli izin” regl politikası içindir.

## Kısa sonuç

| Öngörü | 2027 ciro (tahsilat) | Yeni aktif satıcı |
|---|---|---|
| Kötümser (yüzde 10 noktası) | 58,6 milyon TL | 522 |
| Medyan (plan, beklenen değer) | 78,2 milyon TL | 680 |
| Ortanca (yüzde 50 noktası) | 73,5 milyon TL | 645 |
| İyimser (yüzde 90 noktası) | 93,8 milyon TL | 822 |
| Risksiz plan (karşılaştırma) | 93,9 milyon TL | 799 |

Ciro ve kazanılmış gelir ayrı ölçülür. Ciro, yıl içinde tahsil edilen abonelik ödemesidir. Kazanılmış gelir, hizmeti 2027'de verilen kısımdır: yıllık peşin bedel 12 aya yayılır ve 2026'da peşin ödeyenlerin 2027'ye düşen payı eklenir.

| Öngörü | Ciro (tahsilat) | Kazanılmış gelir |
|---|---|---|
| Kötümser | 58,6 milyon TL | 43,6 milyon TL |
| Medyan (plan) | 78,2 milyon TL | 58,7 milyon TL |
| Ortanca | 73,5 milyon TL | 55,3 milyon TL |
| İyimser | 93,8 milyon TL | 70,0 milyon TL |
| Risksiz plan | 93,9 milyon TL | 71,6 milyon TL |

Risk payı yüzde 16,7 olur. Bu, medyanın risksiz planın ne kadar altında kaldığını gösterir. 1.000 olası yılın ortalaması 74,9 milyon TL, standart sapması 13,5 milyon TL çıktı. Gelir planının medyan senaryosu 2027 için 68,2 milyon TL verir. Destek rollerinin elde tutmaya katkısı sayılmazsa medyan 72,8 milyon TL olur.

## 1. Bir kişi 2027’de kaç saat çalışır

2027’de 261 hafta içi gün vardır. Resmî tatiller 11 tam ve 2 yarım hafta içi gün tutar, bu yüzden 249 iş günü kalır. Yasal üst sınır haftada 45 saattir ve yılda 2.241 saat eder. Plan haftada 40 saat sayar. Aradaki 249 saat çavuş payıdır, yani verimsizlik payıdır.

| Kalem | Saat |
|---|---|
| Yasal üst sınır | 2.241 |
| Çavuş payı | eksi 249 |
| Plan (haftada 40 saat) | 1.992 |
| Yıllık izin (14 gün) | eksi 112 |
| Hastalık (6 gün) | eksi 48 |
| Grip | eksi 2 |
| Regl dönemi (ortalama çalışan) | eksi 28 |
| Mazeret izinleri | eksi 8 |
| İşte geçen süre | 1.794 |
| Verimsiz süre (yüzde 25) | eksi 448 |
| Verimli süre | 1.345 |

Verimli süre ayda 112 saattir. Proje tam kapasiteyi ayda net 125 saat olarak tanımlar. Bu yüzden ortalama kapasite yüzde 89,7 olur. Haftada 40 saatin yüzde 75’i verimli sayıldı (aralık yüzde 65 ile 85). Satış ekiplerinde salt satışa giden sürenin yüzde 30 dolayında olduğu bilinir (Salesforce 2024). Bu süre verimli işin içindedir, çünkü kayıt, hazırlık ve takip de verimli iştir.

## 2. Regl dönemi ve politika

Türkiye’de yasal regl izni yoktur. 32.748 kadınla yapılan bir çalışmada (Schoep ve diğerleri, BMJ Open 2019) kadın başı yılda 1,3 gün devamsızlık ve 8,9 gün toplam verim kaybı bulundu. Kaybın çoğu işe gelip düşük verimle çalışmaktan gelir. Kadroda kadın oranı bilinmediği için yüzde 50 varsayıldı. Kimse tek tek değerlendirilmedi, yalnız toplam etki hesaplandı. Hiçbir politika maaştan düşmez.

| Politika | Kadın başı yıllık kayıp (gün eşdeğeri) | Ortalama kapasite | Medyan gelir |
|---|---|---|---|
| Politika yok | 8,9 | yüzde 89,3 | 77,9 milyon TL |
| Evden çalışma | 5,3 | yüzde 90,0 | 78,5 milyon TL |
| Ücretli izin | 9,7 | yüzde 89,2 | 77,8 milyon TL |
| Evden çalışma ya da ücretli izin | 7,0 | yüzde 89,7 | 78,2 milyon TL |

Politikaların gelire etkisi yüzde 1’in altındadır. Evden çalışma kaybı en çok azaltan seçenektir. Ücretli izin, kullanılan günü tam kayıp saydığı için ölçülen saati biraz düşürür, ama hasta çalışmayı ve buna bağlı hata ve ayrılma riskini azaltır.

## 3. Risk payı ve riskler

| Aşama | 2027 geliri | Götürdüğü |
|---|---|---|
| Risksiz plan (tam kapasite) | 93,9 milyon TL | Başlangıç |
| Çalışma saati ve verim | 85,1 milyon TL | 8,8 milyon TL |
| İşe alım gecikmesi | 84 milyon TL | 1 milyon TL |
| İşten ayrılma | 80,6 milyon TL | 3,4 milyon TL |
| Mevsim etkisi | 78,2 milyon TL | 2,4 milyon TL |

### Risk listesi ve haritası

| Kod | Risk | Olasılık | Etki | Puan | Düzey | Önlem |
|---|---|---|---|---|---|---|
| R4 | İşten ayrılma | 4 | 4 | 16 | Yüksek | Prim ve kariyer basamağı, ilk 90 gün koçluk, aday havuzu. |
| R6 | Satış dönüşümünün beklenenden düşük olması | 3 | 5 | 15 | Yüksek | Haftalık dönüşüm ölçümü, 30, 60 ve 90. gün kararı. |
| R7 | Elde tutmanın düşük kalması | 3 | 5 | 15 | Yüksek | Satıcı başarı ekibi, ilk 90 gün uyum programı, alıcı talebi. |
| R15 | Kurucuya bağımlılık | 3 | 4 | 12 | Orta | Yetki devri, satış müdürü ve operasyon müdürü rolleri. |
| R2 | Hastalık izni | 5 | 2 | 10 | Orta | Yedek kişi ve devir notu, rapor süreci. |
| R8 | Bayram ve köprü günleri | 5 | 2 | 10 | Orta | Bayram öncesi kampanya, izin planı. |
| R5 | İşe alım gecikmesi | 3 | 3 | 9 | Orta | İlanı işe alım ayından 6 hafta önce açmak. |
| R10 | Yaz durgunluğu | 3 | 3 | 9 | Orta | Yazın uyum ve katalog işlerine ağırlık vermek. |
| R13 | Kur ve fiyat | 3 | 3 | 9 | Orta | Fiyatı € olarak korumak, yıllık peşin ödemeyi özendirmek. |
| R14 | Sipariş ve ödeme altyapısının gecikmesi | 3 | 3 | 9 | Orta | Teslim tarihini ürün yol haritasına bağlamak. |
| R1 | Mevsimsel grip | 4 | 2 | 8 | Orta | Ekim ve kasımda grip aşısı, hasta çalışmama kuralı, evden çalışma. |
| R9 | Ramazan ayı | 4 | 2 | 8 | Orta | Ziyaret saatlerini öğlene kaydırmak. |
| R12 | Deprem ya da büyük kesinti | 1 | 5 | 5 | Düşük | Uzaktan çalışma ve yedekleme planı, acil durum tatbikatı. |
| R3 | Regl dönemine bağlı verim düşüşü | 4 | 1 | 4 | Düşük | Esnek çalışma ve ücretli izin politikası, maaştan kesinti yok. |
| R11 | İstanbul trafiği ve ulaşım | 4 | 1 | 4 | Düşük | Saha rotası, toplu taşıma kartı. |

### Zaman tüneli

| Ay | Öne çıkan riskler | Kişi başı kayıp saat | Satış etkisi |
|---|---|---|---|
| Ocak | Mevsimsel grip, İşe alım gecikmesi | 7,8 | Yok |
| Şubat | Mevsimsel grip, İşe alım gecikmesi, Ramazan ayı | 7,6 | eksi yüzde 5,0 |
| Mart | Mevsimsel grip, İşe alım gecikmesi, Bayram ve köprü günleri, Ramazan ayı | 7,2 | eksi yüzde 10,0 |
| Nisan | İşe alım gecikmesi | 7,0 | Yok |
| Mayıs | İşe alım gecikmesi, Bayram ve köprü günleri | 7,0 | eksi yüzde 3,0 |
| Haziran | İşe alım gecikmesi | 7,0 | Yok |
| Temmuz | Yaz durgunluğu | 7,0 | eksi yüzde 5,0 |
| Ağustos | Yaz durgunluğu | 7,0 | eksi yüzde 15,0 |
| Eylül | Yıl boyu süren riskler | 7,0 | Yok |
| Ekim | Bayram ve köprü günleri | 7,0 | Yok |
| Kasım | Yıl boyu süren riskler | 7,0 | Yok |
| Aralık | Mevsimsel grip | 7,7 | Yok |

## 4. Kadro seçenekleri

| Seçenek | Kötümser | Medyan | Ortanca | İyimser | Risk payı |
|---|---|---|---|---|---|
| Ekonomik | 50,9 milyon TL | 67,2 milyon TL | 62,4 milyon TL | 79,1 milyon TL | yüzde 14,9 |
| Medyan | 58,6 milyon TL | 78,2 milyon TL | 73,5 milyon TL | 93,8 milyon TL | yüzde 16,7 |
| Güçlü | 66,3 milyon TL | 87,8 milyon TL | 82,6 milyon TL | 102,9 milyon TL | yüzde 17,3 |

## 5. Yöntem ve sınırlar

- Gelir motoru gelir planıyla aynıdır. Yeni aktif satıcıların yüzde 20’si yıllık peşin (10 aylık ücret), kalanı aylık 399 avro öder. Aylık ödeyenlerin yenilenme oranı yüzde 70’tir, destek rolleri bunu en çok 8 puan artırır (varsayım). ₺ fiyat kurla büyür. Yıllık peşin ödeme ödendiği ay gelir sayılır.
- Doğrudan katkı parametrelerden gelir: saha ayda 8, masa başı 4, organizatör 6 yeni aktif satıcı. Kurumsal satış, SEO, performans pazarlama ve ekip lideri katkıları varsayımdır.
- Monte Carlo 1.000 olası yıl üretir ve sabit tohumla tekrarlanabilir. Her yılda verim, hastalık, grip, regl kaybı, ayrılma oranı, satış etkinliği (log normal, sapma 0,2), elde tutma sapması, temsilci ağı ve mevsim gücü rastgele seçilir. Kişi bazında işe alım gecikmesi ve ayrılma olayları üretilir. Yılda yüzde 1,5 olasılıkla 2 aylık büyük kesinti vardır.
- Modelde olmayanlar: kur ve fiyat değişimi, sipariş ve ödeme altyapısının gecikmesi, kurucuya bağımlılık. Bunlar risk listesinde nitel olarak durur.
- Segika masa başı ayrı şirkete sattığı için istoc.com gelirine sayılmadı.

