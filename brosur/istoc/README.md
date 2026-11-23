# iStoc iş ortaklığı tanıtım seti

Bu klasör üç belgeyi üretir. Belgeler yalnız iStoc (istoc.com) içindir.

| Dosya | Biçim | Sayfa |
| --- | --- | --- |
| `public/indir/istoc/istoc-is-ortakligi-sunum.pptx` | 16:9 sunum | 10 slayt |
| `public/indir/istoc/istoc-is-ortakligi-el-kitapcigi.pdf` | A4 dikey | 9 sayfa |
| `public/indir/istoc/istoc-is-ortakligi-gorsel-sunum.pdf` | A4 yatay | 8 sayfa |

## Üretim komutu

Önce depo kökünde `npm ci` çalıştırın. Sonra şu komutu çalıştırın:

```bash
cd brosur/istoc && npm ci && node uret.mjs
```

Komut üç belgeyi yeniden yazar. Önizleme görsellerini `onizleme/` klasörüne koyar. Denetimlerden biri başarısız olursa komut hata koduyla biter.

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

## Denetimler

Üretim komutu şu denetimleri yapar:

1. Örnek hesapların sağlamasını yapar.
2. Oran ve fiyatları depodaki kaynak dosyalarla karşılaştırır.
3. Renk çiftlerinin kontrastını ölçer. Her çift en az 4,5:1 olmalıdır.
4. Sayfa dışına çıkan öğeyi ve taşan metin kutusunu arar.
5. En küçük yazı boyunu ölçer. A4 belgede sınır 9 pt, slaytta 24 pikseldir.
6. Yasak kelimeleri ve öteki markanın adını arar.
7. Belgedeki her tam cümlenin `metin.md` içinde olduğunu denetler.
8. PDF sayfa sayısını ve Outfit yazı tipinin gömüldüğünü denetler.

Sunum, Outfit yazı tipiyle ve Arial yedek yazı tipiyle ayrı ayrı ölçülür. Outfit kurulu değilse PowerPoint başka bir yazı tipi kullanır.

## Kaynak değişirse

Kazanç planı, paket fiyatı ya da kur değişebilir. Bu durumda üretim komutu durur ve değişen değeri yazar. `veri.mjs` dosyasını güncelleyin. Sonra `metin.md` dosyasındaki sayıları düzeltin. En son komutu yeniden çalıştırın.
