# Thoptan iş ortaklığı tanıtım seti

Bu klasör üç belgeyi üretir. Belgelerin asıl markası Thoptan'dır. Web adresi `thoptan.com` adresidir. Bu karar kullanıcının 25 Kasım 2026 Çarşamba günkü kararıdır.

El kitapçığının adı "Thoptan iş ortaklığı kılavuzu" olur. Görsel sunumun ve PPTX'in adı "Thoptan iş ortaklığı tanıtım sunumu" olur.

iStoc belgelerde ikinci sırada durur. "Connect to iStoc" imzası yalnız kapakta ve son sayfada durur. İlk geçtiği yerde Türkçesi yazar: "Thoptan ile istoc.com ağına bağlanırsınız." Ürün ve hizmet cümlelerinde özne Thoptan olur. "İSTOÇ" adı kullanılmaz.

Klasör adı ve dosya adları `istoc` olarak kalır. Sitedeki bağlantılar bu adlara bağlıdır.

| Dosya | Biçim | Sayfa |
| --- | --- | --- |
| `public/indir/istoc/istoc-is-ortakligi-sunum.pptx` | 16:9 sunum | 10 slayt |
| `public/indir/istoc/istoc-is-ortakligi-el-kitapcigi.pdf` | A4 dikey | 9 sayfa |
| `public/indir/istoc/istoc-is-ortakligi-gorsel-sunum.pdf` | A4 yatay | 9 sayfa |

## Üretim komutu

Önce depo kökünde `npm ci` çalıştırın. Sonra şu komutu çalıştırın:

```bash
cd brosur/istoc && npm ci && node uret.mjs
```

Komut üç belgeyi yeniden yazar. Önizleme görsellerini `onizleme/` klasörüne koyar. PDF önizlemesi gerçek PDF dosyasından çizilir. Slayt önizlemesi Arial ile yapılan bir benzetimdir. `sunum-quicklook-kapak.png` gerçek PPTX'in kapağıdır. Denetimlerden biri başarısız olursa komut hata koduyla biter.

## Dosyalar

| Dosya | Ne işe yarar? |
| --- | --- |
| `metin.md` | Belgelerin düz metnidir. Metni önce burada düzeltin. |
| `veri.mjs` | Oranlar, fiyatlar ve örnek hesaplar buradadır. |
| `tokenlar.mjs` | Renk, yazı ve boşluk değerleri buradadır. |
| `sablon.mjs` | Ortak sayfa iskeleti ve grafikler buradadır. |
| `kitapcik.mjs` | El kitapçığının sayfalarıdır. |
| `gorsel.mjs` | Görsel PDF sunumunun sayfalarıdır. |
| `sunum.mjs` | Sunumun slaytlarıdır. |
| `kontrol.mjs` | Kontrast ve metin denetimleri buradadır. |
| `uret.mjs` | Belgeleri üretir ve denetler. |
| `gorsel/` | Thoptan logo dosyaları buradadır. |
| `pdfgorsel.mjs` | PDF metnini çıkarır ve PDF sayfalarını görüntüye çevirir. |

## Denetimler

Üretim komutu şu denetimleri yapar:

1. Örnek hesapların sağlamasını yapar.
2. Oran ve fiyatları depodaki kaynak dosyalarla karşılaştırır.
3. Renk çiftlerinin kontrastını ölçer. Her çift en az 4,5:1 olmalıdır.
4. Sayfa dışına çıkan öğeyi ve taşan metin kutusunu arar.
5. En küçük yazı boyunu ölçer. A4 belgede koşul ve açıklama metni en az 11 pt olur. Dipnot, üst bilgi ve grafik etiketi en az 9 pt olur. Slaytta sınır 24 pikseldir.
6. Yasak kelimeleri ve öteki markanın adını arar. "İSTOÇ" adını ve iStoc ile başlayan cümleyi de arar.
7. Belgelerde iStoc turuncusunu arar. Turuncu bulunursa üretim durur.
8. Belgedeki her tam cümlenin `metin.md` içinde olduğunu denetler.
9. PDF sayfa sayısını ve Outfit yazı tipinin gömüldüğünü denetler.
10. PDF'te Type3 yazı tipi arar. Type3 varsa metin doğru kopyalanmaz.
11. PDF metnini çıkarır. Metinde "müşteri", "Thoptan" ve "Connect to iStoc" gibi kelimeleri arar.

## Renkler ve logo

Renkler thoptan.com sitesindeki `brand.css` dosyasından alındı. Ana renk lacivert `#23488d` rengidir. Koyu tonu `#1c3a72` rengidir. Vurgu rengi sarı `#fcde00` rengidir.

Sarı açık zeminde metin rengi olmaz. Sarı zeminde yazı lacivert olur. Açık zemindeki sarı grafik çubuğunun ince lacivert kenarı vardır.

Sitedeki logo dosyası yalnız 250 × 64 pikseldir. Bu boyut baskıda bulanık durur. Bu yüzden logo yeniden çizildi.

Örnek logo thoptan.com sitesindeki dosyadır: https://thoptan.com/images/thoptan-logo.png

Logo Poppins Bold Italic yazı tipiyle çizildi. Harf aralığı yazı boyunun yüzde 2'si kadar daraltıldı. SemiBold ağırlığı asıl logodan ince durdu. Poppins, SIL Open Font License 1.1 lisanslı bir Google Fonts yazı tipidir.

- `gorsel/thoptan-logo.png`: lacivert `#23488d` logo, açık zeminde kullanılır.
- `gorsel/thoptan-logo-beyaz.png`: sarı `#fcde00` logo, koyu zeminde kullanılır.

İki dosya da 2500 × 640 pikseldir ve zemini saydamdır. Oran eski dosyayla aynıdır. Logoyu yeniden çizmek için şu komutu çalıştırın:

```bash
cd brosur/istoc && node logo-ciz.mjs
```

Logo PDF'te en çok 42 mm genişlikte basılır. PPTX'te en çok 2,2 inç genişlikte durur. Üretici daha geniş logoyu reddeder. Logo esnetilmez ve rengi değiştirilmez.

## Yazı tipleri

PDF belgeleri sabit ağırlıklı Outfit dosyalarını kullanır. Değişken Outfit dosyası PDF'e Type3 olarak girer. Bu yüzden değişken dosya kullanılmaz.

Sunum Arial kullanır. PPTX dosyasına yazı tipi gömülemez. Outfit kurulu olmayan bilgisayarda sunum başka bir yazı tipiyle açılır.

Para birimi "TL" diye yazılır. Outfit yazı tipinde "₺" işareti yoktur.

## Kaynak değişirse

Kazanç planı, paket fiyatı ya da kur değişebilir. Bu durumda üretim komutu durur ve değişen değeri yazar. `veri.mjs` dosyasını güncelleyin. Sonra `metin.md` dosyasındaki sayıları düzeltin. En son komutu yeniden çalıştırın.
