# Strateji 1: Kurucu satıcılar

**Tek cümle:** İlk 100 satıcıya numaralı bir kurucu satıcı unvanı ve ömür boyu sabit fiyat verilir. Böylece erken
katılmak, beklemekten daha kârlı olur.

[Girişe dön](00-giris.md)

## Hangi sorunu çözer?

Tavuk yumurta sorununun satıcı tarafını çözer. Platform boşken satıcının katılmak için bir nedeni yoktur. Kurucu
satıcı unvanı bu nedeni yaratır: geç kalan, aynı fırsatı bir daha bulamaz.

Proje bu fikri zaten önerir: ilk 100 esnaf için kurucu satıcı konseyi ve ömür boyu düşük ücret
(`src/data/degerOnerisi.ts:486-491`). Bu dosya fikri oyun kurallarına çevirir.

## Kim oynar?

İlk sektördeki satıcılar oynar. Saha ekibi bu satıcılara yüz yüze ulaşır. Hedef, 90 günlük plandaki 100 aktif
satıcıdır (`src/data/params.ts:14-20`).

## Kurallar

1. Kurucu satıcı kontenjanı 100 kişidir. Kontenjan dolunca kapanır ve bir daha açılmaz.
2. Bir satıcı, mağazası "vitrine hazır" olduğu gün sıra numarasını alır. Vitrine hazır olmanın koşulu
   [Strateji 2](02-vitrine-hazir-magaza.md) dosyasındadır. Yalnız kayıt olmak numara kazandırmaz.
3. Sıra numarası mağaza sayfasında görünür. Örnek: "Kurucu satıcı, 23 numara".
4. Kalan kontenjan herkese açık bir sayaçta gösterilir. Örnek: "Kurucu satıcılık için 41 yer kaldı."
5. Kurucu satıcı, katıldığı günkü abonelik fiyatını abonelik kesintisiz sürdükçe korur. Aboneliği bırakırsa unvan
   kalır, fiyat güvencesi biter.
6. Kurucu satıcılar ayda bir kez toplanan bir danışma grubuna katılır. Platformdaki yeni özellikleri ilk onlar dener
   ve öncelik sırasına oy verir.

## Ödül

| Ödül | Satıcıya değeri | Platforma maliyeti |
| --- | --- | --- |
| Numaralı unvan | Saygınlık, erken katılanın görünür olması | Yok |
| Fiyat güvencesi | Gelecekteki fiyat artışlarından korunma | Gelecekte kaçan fiyat farkı |
| Danışma grubu | Ürünü etkileme hakkı | Ayda bir toplantı |

Fiyat güvencesi bugün bir maliyet doğurmaz. Fiyat ileride artarsa fark platformun vazgeçtiği gelirdir. Bu fark, ilk
ağı kurmanın bedeli olarak kabul edilir.

## Neden işe yarar?

- Kıtlık ve sıra numarası, erken katılımı ödüllendirir. Beklemek kayıp olur.
- Rachitsky'nin 17 pazaryeri incelemesinde en sık ilk arz yöntemi birebir satıştı. Kurucu satıcı unvanı, saha
  ekibinin kapıda söyleyebileceği somut bir neden verir.
- Danışma grubu, satıcıyı müşteri değil ortak gibi hissettirir. İlk 100 satıcının söylediği, platformun neyi önce
  düzelteceğini gösterir.

## Hile ve risk

| Risk | Önlem |
| --- | --- |
| Boş mağaza açıp numara kapmak | Numara yalnız vitrine hazır mağazaya verilir. |
| Aynı firmanın birden çok mağaza açması | Vergi numarası başına bir kurucu numarası verilir. |
| Fiyat güvencesinin değer önerisiyle çelişmesi | Değer önerisi "satış yoksa ücret yok" der. Hangi fiyatın güvenceye alındığı, bu çelişki çözülünce yazılır. |
| Söz verilip tutulamaması | Güvencenin koşulları kayıtta yazılı verilir. Aboneliğin kesilmesi gibi bitiş koşulları açıkça yazılır. |

## Ölçüm

- **Kontenjanın dolma hızı:** 100 kurucu numarası kaç günde doldu?
- **Vitrine hazır oranı:** Kayıt olan satıcıların yüzde kaçı vitrine hazır duruma geldi?
- **Kurucu satıcı yenileme oranı:** Plan hedefi %70'tir. Kurucu satıcılarda bu oran daha yüksek olmalıdır.

## İlk 30 günde elle nasıl başlar?

1. Bir tablo açılır. Sütunlar: sıra numarası, firma, vergi numarası, vitrine hazır olduğu tarih, fiyat.
2. Saha ekibi kapıda kontenjan sayacını gösterir. Sayaç bir sayfada ya da basılı bir kartta güncellenir.
3. Mağaza sayfasındaki unvan başta elle eklenir.
4. İlk danışma toplantısı, 20 kurucu satıcıya ulaşılınca yapılır.

## Açık sorular

- Fiyat güvencesi hangi fiyatı korur: liste fiyatını mı, kampanyalı fiyatı mı?
- Kontenjan tüm platform için mi, sektör başına mı açılır? Tek sektörle başlanacağı için ilk 100 numara o sektöre
  ayrılabilir.
