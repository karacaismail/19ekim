# Strateji 8: Geri gelen müşteri ve yenileme

**Tek cümle:** Satıcının panelinde, platformdan ikinci kez teklif isteyen ya da sipariş veren müşterilerin sayısı
görünür. Bu sayı belirli bir eşiği geçen satıcı, aboneliğini yenilerken ödül alır.

[Girişe dön](00-giris.md)

## Hangi sorunu çözer?

Sürdürülebilirliği sağlar. İlk dört strateji platformu doldurur. Ama satıcı, platformdan gelen işin tekrar ettiğini
görmezse aboneliğini yenilemez. Plan hedefi %70 yenileme oranıdır (`src/data/params.ts:14-20`). Bu strateji, satıcının
yenileme kararını vereceği bilgiyi önüne koyar ve tekrar ticareti ödüllendirir.

## Kim oynar?

- **Satıcı:** Aboneliği süren bütün satıcılar.
- **Alıcı:** Bir satıcıdan ikinci kez alım yapan alıcılar.

## Kurallar

1. Satıcı panelinde üç sayı görünür:
   - Bu ay platformdan gelen yeni alıcı.
   - Bu ay geri gelen alıcı. Geri gelen alıcı, aynı satıcıya ikinci kez teklif talebi ya da sipariş gönderen
     alıcıdır.
   - Aboneliğin başından beri platformdan gelen toplam alıcı.
2. Abonelik bitimine 30 gün kala satıcıya bir özet gösterilir: "Bu yıl istoc.com'dan 34 alıcı geldi. 12'si geri
   geldi."
3. **Yenileme ödülü:** Yıl içinde en az 10 geri gelen alıcısı olan satıcı, aboneliğini yenilerken bir ay ücretsiz
   kullanım kazanır. Eşik örnektir.
4. Alıcıya tekrar sipariş kolaylığı verilir: "Son siparişini tekrarla" düğmesi ve tedarikçi defterindeki güncel
   fiyatlar. Tedarikçi defteri [Strateji 5](05-dukkan-qr-tedarikci-defteri.md) dosyasındadır.
5. Alıcıyı ihtiyacı olmayan alıma iten seri ya da zincir ödülü verilmez. Örneğin "üç ay üst üste sipariş ver" gibi
   bir görev konmaz. B2B alıcısı için gereksiz stok, kazançtan çok zarardır.

## Ödül

| Kim | Ödül | Maliyet |
| --- | --- | --- |
| Satıcı | Yenilemede bir ay ücretsiz kullanım | Standart pakette 399 € |
| Alıcı | Tekrar sipariş kolaylığı | Yok |

Örnek hesap: Ödülü alan satıcı yılın 12 ayından birini ücretsiz kullanır. Yıllık peşin ödemede fiyat zaten 10 aylık
bedeldir (`src/data/params.ts:19`). Bu ödül, yıllık peşin ödeme indirimiyle birleşirse satıcı 9 aylık bedel öder. İki
indirimin birleşip birleşmeyeceği ayrıca karar verilmelidir.

Yenilemeyen bir satıcının yerine yenisini bulmak saha ekibinin günlerini alır. Bir aylık ödül bu maliyetten
düşükse ödül kendini öder.

## Neden işe yarar?

- Satıcı, aboneliğin karşılığını sayıyla görür. "Bu platform bana ne kazandırdı?" sorusunun cevabı paneldedir.
- Geri gelen alıcı, platformun gerçek değer ürettiğini gösterir. Bir kez gelip kaybolan alıcı göstermez.
- Ödül, platformun en çok istediği şeye bağlıdır: yenileme. Ayrı bir puan sistemi gerekmez.

## Hile ve risk

| Risk | Önlem |
| --- | --- |
| Aynı alıcıya sahte ikinci talep açtırmak | Yalnız doğrulanmış alıcının, cevaplanmış ve alıcının onayladığı talepleri sayılır. |
| Satıcının kendi ilişkili hesabından talep göndermesi | İlişkili hesaplar sayılmaz. Strateji 3'teki kontrol kullanılır. |
| Sayıların düşük çıkıp satıcıyı küstürmesi | Sayı düşükse panel neden düşük olduğunu ve ne yapılabileceğini söyler: "Kataloğun 21 gündür güncellenmedi." |

## Ölçüm

- **Abonelik yenileme oranı:** Hedef %70.
- **Satıcı başına geri gelen alıcı sayısı.**
- **Ödül alan ve almayan satıcıların ertesi yıl yenileme oranı.** Ödülün etkisi bu karşılaştırmayla görülür.

## İlk 30 günde elle nasıl başlar?

1. Geri gelen alıcılar teklif talebi tablosundan sayılır.
2. Abonelik bitimine 30 gün kalan satıcılara özet, saha ekibi tarafından telefonla ya da WhatsApp'la verilir.
3. Panel yazılımı, bu konuşmalarda satıcının en çok sorduğu sayılara göre tasarlanır.

## Sipariş ve ödeme platforma gelince

Bugün geri gelen alıcı, teklif talebiyle ölçülür. Sipariş ve ödeme platformda çalışmaya başlayınca ölçüt ikinci
siparişe geçer. Kurallar değişmez, yalnız sayılan olay değişir.
