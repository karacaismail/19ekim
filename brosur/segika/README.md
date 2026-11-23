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

Komut üç dosyayı üretir. Her sayfanın önizlemesini de `onizleme/` klasörüne yazar.

## Dosyalar

- `metin.md`: Bütün metnin düz yazı hâli. Metin önce burada yazılır ve denetlenir.
- `icerik.mjs`: Üç belgenin ortak metni ve hesapları. Hesaplar üretim sırasında sağlanır. Sağlama tutmazsa üretim durur.
- `tokens.json`: Renk, yazı boyutu ve boşluk değerleri. Bütün belgeler bu dosyayı kullanır.
- `sablon/`: El kitapçığı, görsel sunum ve PPTX şablonları.
- `uret.mjs`: Üretim betiği.

## Kaynaklar

- Oranlar ve eşikler `src/data/kazancPlani.ts` dosyasından gelir. Segika için `projeVarsayilani('segika')` kullanılır.
- Rol bilgileri `src/data/politikalar/segika/` klasöründen gelir.
- Paket fiyatları ve örnek ayarlar `src/data/satisOrtakligi.ts` dosyasından gelir.
- Paket fiyatları ve ölçek sayıları segika.com sitesinde de yazar. Site 23 Kasım 2026 Pazartesi günü okundu.
- Kaynakta oran değişirse `icerik.mjs` dosyasını da güncelleyin. Sonra seti yeniden üretin.

## Üretim sırasında yapılan denetimler

- Outfit yazı tipi yüklenmezse üretim durur.
- PDF sayfasında taşan ya da alt bilgiye binen öğe varsa üretim durur.
- PDF'te 9 pt altında yazı varsa üretim durur.
- Slaytta taşan ya da üst üste binen metin varsa üretim durur. Bu denetim Outfit ile ve yedek yazı tipi Arial ile iki kez yapılır.

## Bilinen sınırlar

- PPTX yazı tipi adı Outfit'tir. Outfit kurulu değilse PowerPoint ve Keynote benzer bir yazı tipi kullanır. Yerleşim Arial ile denendi.
- Sunum önizlemesi PPTX'in kendisi değildir. Önizleme aynı yerleşim verisinden çizilir.
- Chromium, PDF'e gömdüğü Outfit yazı tipine "Helvetica" adını verir. Harf şekilleri Outfit'tir.
