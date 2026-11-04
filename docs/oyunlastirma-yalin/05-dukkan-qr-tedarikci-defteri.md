# Strateji 5: Dükkândaki QR ile tedarikçini kaydet

**Tek cümle:** Çarşıya gelen alıcı, beğendiği dükkânın QR levhasını okutup o satıcıyı kendi tedarikçi defterine
ekler. Şehrine dönünce aynı satıcıdan platform üzerinden teklif ister.

[Girişe dön](00-giris.md)

## Hangi sorunu çözer?

Alıcı tarafını çözer ve fiziksel çarşıyı platforma bağlar. Yönetimin açıklamasına göre İSTOÇ'a günde yaklaşık
500.000 kişi girip çıkar (Posta, 12 Haziran 2025). Şehir dışından gelen perakendeci yılda birkaç kez gelir. Arada
siparişi telefonla verir ya da başka tedarikçiye geçer. Bu strateji, çarşıdaki tek ziyareti kalıcı bir dijital bağa
çevirir.

## Genel rapordaki pasaporttan farkı

Genel rapor, mağazalardan damga toplayan bir ticaret pasaportu önerdi. Damga toplamak yürümeyi ödüllendirir.
Alıcı 20 dükkâna uğrayıp hiçbirinden alım yapmayabilir. Bu strateji ise yalnız ticari bir bağı sayar: alıcı bir
satıcıyı kaydeder ve sonra ondan teklif ister.

## Kim oynar?

- **Alıcı:** Çarşıya gelen şehir dışı perakendeci ve kurumsal satın almacı.
- **Satıcı:** QR levhası olan, vitrine hazır mağazalar.

## Kurallar

1. Vitrine hazır her mağazaya basılı bir QR levha verilir. Koşul [Strateji 2](02-vitrine-hazir-magaza.md)
   dosyasındadır.
2. Alıcı QR'ı okutunca satıcının kataloğu açılır. Tek dokunuşla "Tedarikçi defterime ekle" seçeneği çıkar.
3. Kaydolmamış alıcı telefon numarasıyla hızlı kayıt olur. Vergi numarası ilk teklif talebinde istenir.
4. QR ile gelen alıcı, [Strateji 3](03-kendi-musterini-getir.md) kuralına göre o satıcının kendi müşterisi
   sayılır.
5. Satıcı panelinde iki sayaç bulunur: "Bu ay seni kaydeden alıcı" ve "Seni kaydedip sonra teklif isteyen alıcı".
6. Alıcının defterinde kaydettiği satıcılar ve son fiyatları durur. Alıcı fiyat değişince bildirim almayı seçebilir.

## Ödül

| Kim | Ödül | Maliyet |
| --- | --- | --- |
| Alıcı | Çarşıdan ayrıldıktan sonra da tedarikçisinin güncel fiyatını görmek ve teklif isteyebilmek | Yok |
| Satıcı | QR ile gelip sonra teklif isteyen her alıcı, Strateji 3'teki aktif alıcı sayacına eklenir | Strateji 3'teki ödül |

Ayrı bir puan ya da hediye yoktur. Alıcının ödülü işinin kolaylaşmasıdır. Satıcının ödülü Strateji 3'e bağlanır.
Böylece aynı davranış iki kez ödüllendirilmez.

## Neden işe yarar?

- Çarşıya gelen alıcı zaten satın almaya niyetlidir. Ona yeni bir şey öğretmek gerekmez, yalnız bağı saklamak gerekir.
- QR, konum verisi toplamaz. GPS kullanılmadığı için KVKK yükü azdır.
- Satıcı, dükkânına gelen alıcıyı kaybetmemek için levhayı görünür yere asar. Platform, çarşıdaki trafiği reklamsız
  kullanır.

## Hile ve risk

| Risk | Önlem |
| --- | --- |
| QR'ın kopyalanıp başka yerde dağıtılması | QR yalnız kataloğa açılır. Kopyalanması zarar vermez, çünkü ödül teklif talebine bağlıdır. |
| Satıcının kendi personeline QR okutması | Ödül, vergi numarasıyla doğrulanmış alıcının teklif talebine bağlıdır. |
| Levha asmanın çarşı kurallarına aykırı olması | Levha ve afiş için çarşı yönetiminden yazılı izin alınır (`src/data/istihdamPlani.ts:183-184`). |
| Alıcının İstoç adını çarşının resmî sitesi sanması | Levhada istoc.com'un kim olduğu açıkça yazılır. Ad kullanımı yönetimle netleşir (`src/data/degerOnerisi.ts:433`). |

## Ölçüm

- **QR okutma sayısı** ve bunun **kayda dönüşme oranı**.
- **Kaydettiği satıcıdan 60 gün içinde teklif isteyen alıcı oranı.** Bu, stratejinin asıl ölçütüdür.
- **Kontrol grubu:** Levhası olan ve olmayan benzer dükkânların şehir dışı alıcı sayısı karşılaştırılır.

## İlk 30 günde elle nasıl başlar?

1. İlk sektördeki 20 dükkâna basit QR levha basılır. QR, mağaza bağlantısına yönlenir.
2. "Tedarikçi defterime ekle" özelliği yoksa ilk ayda QR doğrudan mağazanın teklif formunu açar.
3. Saha ekibi hafta sonu çarşıda alıcıyla konuşup okutma deneyimini gözlemler.
