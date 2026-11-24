# Segika iş ortaklığı tanıtım seti

Bu klasör Segika iş ortaklığı setinin kaynağıdır. Set üç dosyadan oluşur.

1. `public/indir/segika/segika-is-ortakligi-sunum.pptx`: 16:9 sunum, 12 slayt.
2. `public/indir/segika/segika-is-ortakligi-el-kitapcigi.pdf`: A4 dikey el kitapçığı, 12 sayfa.
3. `public/indir/segika/segika-is-ortakligi-gorsel-sunum.pdf`: A4 yatay görsel sunum, 12 sayfa.

Set 24 Kasım 2026 Salı günü 2. revizyonla yenilendi. Üç dosyanın ilk sayfası fotoğraflı kapaktır.

## Üretim komutu

Önce depo kökünde `npm ci` çalışmış olmalıdır. Sonra bu klasörde şu komutu çalıştırın:

```sh
npm install && npm run uret
```

Komut üç dosyayı üretir. Önizlemeleri de `onizleme/` klasörüne yazar. En sonda içerik denetimini çalıştırır.

- PDF önizlemeleri PDF'in kendisinden çizilir. Çizimi pdf.js (`pdfjs-dist`) yapar.
- `sunum-01-quicklook.png` gerçek PPTX'in ilk slaytıdır. Bu resmi macOS Quick Look verir.
- `sunum-yerlesim-*.png` resimleri PPTX ile aynı yerleşim verisinden, Arial ile çizilir. Bunlar PPTX'in kendisi değildir.

İçerik denetimini tek başına çalıştırmak için `npm run denetle` komutunu kullanın.

## Dosyalar

- `metin.md`: Bütün metnin düz yazı hâli. Metin önce burada yazılır ve denetlenir.
- `icerik.mjs`: Üç belgenin ortak metni ve hesapları. Hesaplar üretim sırasında sağlanır. Sağlama tutmazsa üretim durur.
- `denetim.mjs`: Üretilen dosyaların içerik denetimi. Kurallar aşağıda yazar.
- `tokens.json`: Renk, yazı boyutu ve boşluk değerleri. Bütün belgeler bu dosyayı kullanır. Yeşil yalnız örnekteki durumu gösterir.
- `gorsel/`: Kapak fotoğrafının küçültülmüş üç kesimi. Kaynak bilgisi aşağıdadır.
- `yazi-tipi/`: Outfit'in resmî sabit ağırlıklı TTF dosyaları ve lisansı (OFL). Kaynak github.com/Outfitio/Outfit-Fonts deposudur.
- `sablon/`: El kitapçığı, görsel sunum ve PPTX şablonları.
- `uret.mjs`: Üretim betiği.

## Kapak fotoğrafı

- Adres: https://www.pexels.com/photo/man-in-black-suit-sitting-at-his-desk-8353835/
- Fotoğrafçı: Kampus Production (https://www.pexels.com/@kampus/)
- Lisans: Pexels lisansı (https://www.pexels.com/license/). Ticari kullanım serbesttir. Kaynak göstermek zorunlu değildir.
- İndirme tarihi: 24 Kasım 2026 Salı günü.
- Asıl dosya 2400 × 1602 piksel JPEG'dir. Asıl dosya depoya girmez.
- `gorsel/kapak-dikey.jpg` el kitapçığı içindir. Boyutu 1309 × 1602 pikseldir.
- `gorsel/kapak-yatay.jpg` görsel sunum içindir. Boyutu 1800 × 1201 pikseldir.
- `gorsel/kapak-sunum.jpg` sunum içindir. Boyutu 1800 × 884 pikseldir. Fotoğraf kutusuyla aynı en-boy oranındadır.
- Pexels lisansının bir sınırı vardır. Fotoğraftaki kişi ürünü öneriyormuş gibi gösterilmez. Kapakta kişiye söz ya da alıntı yazılmaz.

## Kaynaklar

- Oranlar ve eşikler `src/data/kazancPlani.ts` dosyasından gelir. Segika için `projeVarsayilani('segika')` kullanılır.
- Rol bilgileri `src/data/politikalar/segika/` klasöründen gelir.
- 100 çalışan için aylık fiyatlar kullanıcının 24 Kasım 2026 Salı günkü kararıdır: SGK Teşvik 6.250 TL, SGK Otomasyon 5.400 TL, SGK Teşvik ve Otomasyon 8.900 TL.
- Bu fiyatlar `src/data/satisOrtakligi.ts` içindeki `segikaFiyat` değerlerinden farklıdır. `segikaFiyat` 25 çalışan içindir: 1.850 TL, 1.600 TL ve 2.600 TL. segika.com fiyat sayfası da 24 Kasım 2026 Salı günü aynı 25 çalışan fiyatlarını gösterdi. `src/` altındaki fiyat verisi değişmedi.
- 25 çalışan fiyatının 4 katı 7.400 TL, 6.400 TL ve 10.400 TL eder. Kullanıcının 100 çalışan fiyatları bunlardan yaklaşık %15 düşüktür. Site 100 çalışan fiyatı yazmıyor.
- Ölçek sayıları Segika tanıtım broşüründen gelir. Bunlar Temmuz 2025 verileridir.
- "500'den fazla çalışan için Segika ayrıca teklif verir." cümlesinin kaynağı segika.com fiyat sayfasıdır. Adres https://www.segika.com/program-ozellikleri/fiyatlandirma/ şeklindedir. Sayfada "500’den fazla çalışan için fiyat teklifi alınız." yazıyor. Bu bilgi 24 Kasım 2026 Salı günü doğrulandı.
- Belgede fiyat kaynağı olarak şu cümle yazar: "Fiyatlar 100 çalışan için aylıktır ve KDV hariçtir. Güncel fiyatı Segika'dan yazılı isteyin."
- Mali müşavir ofisleri için nakitsiz yol üç dosyada da yazar. El kitapçığında 5. sayfadadır. Görsel sunumda ve sunumda son sayfadadır.
- "Her ay 360 milyon TL teşvik" sayısı yalnız Segika'nın beyanı olarak ve kaynağıyla yazılır.
- Rol verisindeki daha sıkı koşul geçerlidir. Örneğin sonraki yılların payı için destek vermek gerekir.
- Kaynakta oran değişirse `icerik.mjs` dosyasını da güncelleyin. Sonra seti yeniden üretin.

## Aylık satış örneğindeki varsayım

`kazancPlani.ts` aylık ödeyen müşterinin cirosunu iş ortakları için ayrıca tanımlamıyor. Kod yalnız aylık ciroyu ve "ulaşılan oran cironun tamamına uygulanır" kuralını tanımlar.

Bu yüzden örnek şunu varsayar: aylık ödeyen işverenin o ay ödediği bedel o ayın cirosuna yazılır. Örnekte hiçbir işveren ayrılmaz. Varsayım belgelerde de yazar.

## Yıllık satış örneğindeki varsayım

Yıllık paketin bütün bedeli satışın yapıldığı ayın cirosuna yazılır. Bu yüzden 2 işverenin cirosu 213.600 TL olur ve oran %30'a çıkar. `kazancPlani.ts` bunu iş ortakları için ayrıca tanımlamıyor. Kesin kural yazılı anlaşmada belirlenir. Varsayım belgelerde de yazar.

Yıllık sayfanın örneği 2 işverendir. "Siz buradasınız" işareti 4. seviyede durur. 1. işveren okuru 3. seviyeye, 2. işveren 4. seviyeye taşır.

## Basamak adları

Okura görünen her yerde basamaklar "1. seviye" ile "4. seviye" arasında adlandırılır. Eski kısa adlar okura görünmez. İçerik denetimi bu adları arar ve bulursa üretimi durdurur.

## Üretim sırasında yapılan denetimler

- Outfit yazı tipi yüklenmezse üretim durur.
- PDF sayfasında taşan ya da alt bilgiye binen öğe varsa üretim durur.
- Kapsayıcısı tarafından gizlenen öğe varsa üretim durur.
- A4 belgelerde gövde, koşul ve grafik yazısı 11 pt altındaysa üretim durur. Kaynak notu ve alt bilgi 9 pt altındaysa da üretim durur.
- Slaytta taşan ya da üst üste binen metin varsa üretim durur. Bu denetim Arial ölçüsüyle yapılır.
- İçerik denetimi gerçek çıktıyı okur. Şu durumlarda üretim durur:
  - Bir dosyada 12'den çok sayfa vardır.
  - İlk sayfada belge türü ya da kapak fotoğrafı yoktur.
  - "Kadrolu", "insan kaynakları danışman", "Bu davet mali müşavir", "Dört ortaklık yolu", "25 çalışan" ya da "Fırsat" geçer.
  - Eski fiyat kaynağı cümlesi geçer. Eski basamak adları geçer.
  - Yıllık sayfada "%25 olur" yazar. Okur o sayfada iki farklı oran görmemelidir.
  - Yeni fiyat cümlesi ya da dört seviye adı geçmez.
  - Nakitsiz yolun koşulları geçmez.
  - Marka elçisinin 30.000 TL sınırı geçmez.
  - Yıllık varsayım ya da "Kazanılmış hak sayılmaz" notu geçmez.
  - "kümülatif", "100 çalışan", yeni fiyatlar, "Şirketinize uygun planı seçin." ya da iki taahhüt başlığı geçmez.
  - PDF'te Outfit dışında yazı tipi ya da Type3 yazı tipi vardır. PPTX'te Arial dışında yazı tipi vardır.

## Bilinen sınırlar

- PPTX'te bütün metin Arial'dir. Outfit PPTX'e gömülemiyor. Outfit'i olmayan görüntüleyici Times'a düşüyordu.
- PDF'lerde Outfit sabit ağırlıklı TTF olarak gömülür. Metin kopyalanabilir ve aranabilir.
- Outfit'te "₺" işareti yok. Bu yüzden tutarlar "TL" ile yazılır.
- Bu Mac'te PowerPoint ve Keynote yok. PPTX'in bütün slaytları gerçek bir görüntüleyiciyle görülemedi.
