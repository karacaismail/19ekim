# Strateji 4: Sektör doluluk hedefi

**Tek cümle:** Bir sektörün satıcıları ortak bir hedefe birlikte ilerler. Sektör dolunca platform alıcı reklamını o
sektöre yoğunlaştırır ve bütün satıcılar birlikte kazanır.

[Girişe dön](00-giris.md)

## Hangi sorunu çözer?

İki tarafı birlikte çözer. Alıcı, aradığı ürün için yalnız iki satıcı görürse geri dönmez. Bir sektörde yeterli satıcı
ve ürün olmadan alıcı reklamı yapmak bütçeyi boşa harcar. Bu strateji, alıcı reklamını ancak sektör dolunca başlatır.
Satıcılar da sektörü doldurmak için birbirini davet eder.

Andrew Chen bunu "atomik ağ" diye adlandırır. Atomik ağ, herkesin kalmasına yetecek kadar katılımcının olduğu en küçük
ağdır. Bank of America ilk kredi kartını 1958'de yalnız Fresno'da, 60.000 kişiye çıkardı. Rachitsky'nin incelediği
pazaryerlerinde de ilk adım pazarı şehir ya da kategoriyle daraltmaktır.

Proje aynı yönü gösterir: "Önce tek sektörde ve tek blokta yoğunlaşmak gerekir." (`src/data/degerOnerisi.ts:442`).

## Kim oynar?

Seçilen ilk sektördeki bütün satıcılar oynar. Sektör seçimi saha araştırmasına bağlıdır. Tekrar siparişin sık, ürünün
standart ve şehir dışı alıcının çok olduğu bir sektör seçilmelidir.

## Kurallar

1. Sektör için bir doluluk hedefi ilan edilir. Örnek: "Kırtasiye sektörü: 30 vitrine hazır mağaza ve 1.500 ürün."
2. Sektör sayfasında herkese açık bir ilerleme çubuğu bulunur: "Kırtasiye: 18 / 30 mağaza hazır."
3. Yalnız vitrine hazır mağazalar sayılır. Koşul [Strateji 2](02-vitrine-hazir-magaza.md) dosyasındadır.
4. Hedefe ulaşılınca platform önceden ilan edilen ödülü verir. Ödül bütün sektöre aynı anda verilir.
5. Sektör hedefi aşamalıdır. İlk hedef dolunca ikinci hedef açılır. Örnek: 50 mağaza ve 100 aktif alıcı.
6. Sıralama tablosu yoktur. Satıcılar birbirine karşı değil, birlikte oynar.

## Ödül

| Aşama | Sektöre ödül | Kim öder? |
| --- | --- | --- |
| 1. hedef | O sektör için 30 günlük alıcı reklam kampanyası | Platformun pazarlama bütçesi |
| 2. hedef | Sektör için şehir dışı perakendecilere yönelik toplu tanıtım ve teklif günü | Platform ve isteyen satıcıların ortak bütçesi |
| 3. hedef | Sektöre özel ana sayfa vitrini | Yok |

Bu ödül, platformun zaten yapacağı bir harcamadır. Fark, harcamanın ne zaman yapılacağıdır. Reklam, sektörde yeterli
arz oluşunca yapılır. Böylece reklamla gelen alıcı boş bir sektörle karşılaşmaz.

## Satıcıyı davet etmeye ne iter?

Hedefe yaklaşan sektörde satıcı, komşu dükkânı davet etmekte çıkar görür. Çünkü sektör dolmadan reklam başlamaz.
Projedeki satış ortaklığı programında arz toplayıcı ortak türü vardır. Bu ortak, en az 20 doğrulanmış mağaza
getirmekle yükümlüdür (`src/data/kosullarV2.ts:322-326`). Sektör hedefi, bu ortağın işini görünür kılar.

## Neden işe yarar?

- Alıcı reklamı boşa gitmez. Reklamla gelen alıcı yeterli seçenek bulur.
- Ortak hedef, rakip esnafı karşı karşıya getirmez. Büyük ve küçük dükkân aynı çubuğa katkı yapar.
- Satıcı, neden beklediğini görür: "12 mağaza daha hazır olunca reklam başlıyor."

## Hile ve risk

| Risk | Önlem |
| --- | --- |
| Hedefi doldurmak için boş mağaza açtırmak | Yalnız vitrine hazır ve güncel mağazalar sayılır. |
| Hedefe ulaşıp reklamdan sonra mağazayı bırakmak | Reklam dönemi boyunca güncel olmayan mağaza sayıdan düşer. |
| Hedefin hiç dolmaması | Hedef küçük başlar. 30 gün içinde dolmazsa hedef gözden geçirilir, sebebi satıcılara açıklanır. |

## Ölçüm

- **Sektörün dolma süresi.**
- **Reklam döneminde alıcının bulduğu satıcı sayısı:** Bir alıcının aramasında kaç farklı satıcı çıkıyor?
- **Alıcının ikinci kez gelme oranı:** Dolu sektör ile dolmamış sektör karşılaştırılır.

## İlk 30 günde elle nasıl başlar?

1. Saha araştırmasıyla ilk sektör seçilir.
2. Sektördeki dükkânlar bir listeye yazılır. Saha ekibi aynı sektörde yoğunlaşır.
3. İlerleme çubuğu başta sektör sayfasında elle güncellenir. Dükkânlara haftalık durum mesajı gönderilir. Mesajlar
   İYS kaydı ve ret kontrolü yapılarak gönderilir.
