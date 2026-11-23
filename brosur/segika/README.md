# Segika iş ortaklığı tanıtım seti

Bu klasör Segika iş ortaklığı setinin kaynağıdır. Set üç dosyadan oluşur.

1. `public/indir/segika/segika-is-ortakligi-sunum.pptx`: 16:9 sunum, 10 slayt.
2. `public/indir/segika/segika-is-ortakligi-el-kitapcigi.pdf`: A4 dikey el kitapçığı, 9 sayfa.
3. `public/indir/segika/segika-is-ortakligi-gorsel-sunum.pdf`: A4 yatay görsel sunum, 9 sayfa.

## Üretim komutu

Önce depo kökünde `npm ci` çalışmış olmalıdır. Sonra bu klasörde şu komutu çalıştırın:

```sh
npm install && npm run uret
```

Komut üç dosyayı üretir. Önizlemeleri de `onizleme/` klasörüne yazar.

- PDF önizlemeleri PDF'in kendisinden çizilir. Çizimi pdf.js (`pdfjs-dist`) yapar.
- `sunum-01-quicklook.png` gerçek PPTX'in ilk slaytıdır. Bu resmi macOS Quick Look verir.
- `sunum-yerlesim-*.png` resimleri PPTX ile aynı yerleşim verisinden, Arial ile çizilir. Bunlar PPTX'in kendisi değildir.

## Dosyalar

- `metin.md`: Bütün metnin düz yazı hâli. Metin önce burada yazılır ve denetlenir.
- `icerik.mjs`: Üç belgenin ortak metni ve hesapları. Hesaplar üretim sırasında sağlanır. Sağlama tutmazsa üretim durur.
- `tokens.json`: Renk, yazı boyutu ve boşluk değerleri. Bütün belgeler bu dosyayı kullanır. Yeşil yalnız örnekteki durumu gösterir.
- `yazi-tipi/`: Outfit'in resmî sabit ağırlıklı TTF dosyaları ve lisansı (OFL). Kaynak github.com/Outfitio/Outfit-Fonts deposudur.
- `sablon/`: El kitapçığı, görsel sunum ve PPTX şablonları.
- `uret.mjs`: Üretim betiği.

## Kaynaklar

- Oranlar ve eşikler `src/data/kazancPlani.ts` dosyasından gelir. Segika için `projeVarsayilani('segika')` kullanılır.
- Rol bilgileri `src/data/politikalar/segika/` klasöründen gelir.
- Paket fiyatları ve örnek ayarlar `src/data/satisOrtakligi.ts` dosyasından gelir.
- Paket fiyatları, entegrasyonlar ve ölçek sayıları segika.com sitesinde yazar. Site 23 Kasım 2026 Pazartesi günü okundu.
- Rol verisindeki daha sıkı koşul geçerlidir. Örneğin sonraki yılların payı için destek vermek gerekir.
- Kaynakta oran değişirse `icerik.mjs` dosyasını da güncelleyin. Sonra seti yeniden üretin.

## Üretim sırasında yapılan denetimler

- Outfit yazı tipi yüklenmezse üretim durur.
- PDF sayfasında taşan ya da alt bilgiye binen öğe varsa üretim durur.
- A4 belgelerde gövde, koşul ve grafik yazısı 11 pt altındaysa üretim durur. Kaynak notu ve alt bilgi 9 pt altındaysa da üretim durur.
- Slaytta taşan ya da üst üste binen metin varsa üretim durur. Bu denetim Arial ölçüsüyle yapılır.

## Bilinen sınırlar

- PPTX'te bütün metin Arial'dir. Outfit PPTX'e gömülemiyor. Outfit'i olmayan görüntüleyici Times'a düşüyordu.
- PDF'lerde Outfit sabit ağırlıklı TTF olarak gömülür. Metin kopyalanabilir ve aranabilir.
- Outfit'te "₺" işareti yok. Bu yüzden tutarlar "TL" ile yazılır.
- Bu Mac'te PowerPoint ve Keynote yok. PPTX'in bütün slaytları gerçek bir görüntüleyiciyle görülemedi.
