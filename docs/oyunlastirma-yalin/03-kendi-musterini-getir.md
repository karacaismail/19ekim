# Strateji 3: Kendi müşterini getir

**Tek cümle:** Satıcı, kendi düzenli alıcılarını istoc.com mağazasına davet eder. Bu alıcılar satıcıda kalır. Davet
ettiği her aktif alıcı satıcıya ödül kazandırır.

[Girişe dön](00-giris.md)

## Hangi sorunu çözer?

Alıcı tarafını çözer. Platformun ilk alıcılarını reklamla bulmak pahalıdır. Oysa her toptancının telefonla ya da
WhatsApp'la sipariş veren düzenli alıcıları vardır. 100 satıcının her biri 10 alıcı getirirse platformda reklamsız
1.000 alıcı olur. Bu alıcılar ilk kez gerçek tedarikçileriyle platforma girer.

Projede bu fikrin parçaları vardır. Değer önerisi, satıcının kendi müşterisinden komisyon alınmayacağını söyler
(`src/data/degerOnerisi.ts:158-175`). Satıcının mevcut müşterilerinin alıcı olarak çekileceği de yazılıdır
(`src/data/degerOnerisi.ts:143, 161, 287`).

## Örnek: Faire Direct

Faire, ABD'deki büyük bir toptan pazaryeridir. Markanın kendi bağlantısıyla, QR koduyla ya da sitesindeki araçla
getirdiği perakendeciden komisyon almaz. Pazaryerinde ilk siparişte bu oran %25, sonraki siparişlerde %15'tir. Faire
ayrıca getirilen perakendeciye ilk siparişinde, kendi bütçesinden %50 indirim verir. Bu indirimin üst sınırı 150
dolardır. (Kaynak: faire.com destek sayfaları. Sayfalar doğrudan açılamadı, arama özetlerinden alındı.)

Bir ev dekorasyonu markasının vaka çalışmasında, markanın Faire siparişlerinin %21'i bu yolla geldi (Faire, Ocak
2024). Platformun tamamı için bir oran yayımlanmamıştır.

## Esnafın asıl korkusu

Satıcı kendi alıcısını getirmekten çekinir. Çünkü platformun bu alıcıya rakip dükkânları göstereceğinden korkar. Bu
korku giderilmeden strateji çalışmaz. Bu yüzden ilk kural müşteri korumasıdır.

## Kurallar

1. **Senin müşterin sende kalır.** Satıcının bağlantısıyla kaydolan alıcı, o satıcının "kendi müşterisi" olarak
   işaretlenir. Bu alıcı satıcının mağazasındayken ona başka satıcı önerilmez.
2. Alıcı platformda kendi araması yaparsa diğer satıcıları görebilir. Bu, satıcıya kayıt sırasında açıkça söylenir.
   Verilen söz şudur: "Senin mağazandan gelen müşteriyi rakibine yönlendirmeyiz." Satıcıya "müşterin başka kimseyi
   görmez" denmez, çünkü bu doğru olmaz.
3. Alıcı, satıcının bağlantısıyla ya da dükkândaki QR levhayla kaydolur. Kaydın ilk 12 ayı içinde o satıcıya en az
   bir teklif talebi ya da sipariş gönderirse "aktif alıcı" sayılır.
4. Satıcı panelinde bir sayaç bulunur: "Getirdiğin aktif alıcı: 4. Bir sonraki ödüle 1 alıcı kaldı."
5. Ödül eşikleri önceden ilan edilir. Eşikler sabittir, çekiliş ya da şans yoktur.

## Ödül

Ödülün biçimi, projedeki açık K1 kararına bağlıdır: platform abonelikle mi, işlem payıyla mı para kazanacak?

| Gelir modeli | Satıcıya ödül | Alıcıya ödül |
| --- | --- | --- |
| Abonelik (bugünkü model) | Her 5 aktif alıcı için 1 ay ücretsiz abonelik, yılda en çok 3 ay | İlk teklif talebine öncelikli cevap ve ilk siparişte ücretsiz kargo desteği |
| İşlem payı (ileride) | Getirdiği alıcıdan hiç işlem payı alınmaz | İlk siparişte platformun ödediği indirim |

Örnek maliyet (abonelik modeli): Standart paket ayda 399 €'dur. Bir satıcı yılda 15 aktif alıcı getirirse 3 ay ücretsiz
kullanır. Platform bu satıcıdan 1.197 € daha az alır. Karşılığında reklam harcamadan 15 aktif alıcı kazanır. Bu
alıcılar başka satıcılardan da alım yapabilir.

Rakamlar örnektir. Eşik ve tavan, pilotta alıcı başına edinme maliyetiyle karşılaştırılarak ayarlanır. Projedeki
dijital kanal kuralı, alıcı başına değerin edinme maliyetinin en az 3 katı olmasıdır (`src/data/digitalStrategy.ts:55-86`).

## Satış ortaklığı programıyla farkı

Satış ortaklığı sayfasındaki "Arkadaşını getir" kampanyası, mevcut müşterinin başka bir **satıcı** getirmesini
ödüllendirir. Bu strateji ise satıcının kendi **alıcısını** getirmesini ödüllendirir. İkisi aynı anda çalışabilir.
Aynı kişi iki ödülü aynı davranış için almaz.

## Neden işe yarar?

- Alıcı, zaten tanıdığı ve güvendiği tedarikçisiyle platforma girer. Güven sorunu baştan çözülür.
- Satıcı, kendi işini kolaylaştırdığı için alıcıyı getirir. Platform reklam bütçesi harcamaz.
- Platformdaki alıcı sayısı, satıcı sayısıyla birlikte artar. Tavuk yumurta sorunu tek hamlede iki taraftan çözülür.
- Ankorstore'un iş ilanına göre, markanın kodlarıyla gelen perakendecilere verilen teklifler şirketin alıcı edinme
  bütçesinin büyük kısmıdır (ikincil kaynak).

## Hile ve risk

| Risk | Önlem |
| --- | --- |
| Sahte alıcı hesabı açmak | Alıcı vergi numarasıyla doğrulanır. Ödül yalnız aktif alıcı için verilir. |
| Satıcının kendine alıcı hesabı açması | Aynı vergi numarası, telefon ve cihaz eşleşmeleri kontrol edilir. |
| İki satıcının birbirinin alıcısı olması | İlişkili hesaplar ayrı işaretlenir. Bu alıcılar eşiğe sayılmaz. |
| Platformun müşteri koruma sözünü çiğnemesi | Satıcı mağazasındaki öneri alanları, kendi müşterisi için kapalıdır. Bu kural kodda test edilir. |

## Ölçüm

- **Satıcı başına getirilen aktif alıcı sayısı.**
- **Getirilen alıcının başka bir satıcıya da teklif talebi gönderme oranı.** Bu oran, platformun ağ etkisinin
  başladığını gösterir.
- **Alıcı başına edinme maliyeti:** Ödülün maliyeti ile reklamla gelen alıcının maliyeti karşılaştırılır.

## İlk 30 günde elle nasıl başlar?

1. Her satıcıya kendi kodunu içeren bir mağaza bağlantısı verilir.
2. Saha ekibi satıcıyla birlikte WhatsApp'ta hazır bir mesaj gönderir: "Fiyat listemiz artık burada, buradan teklif
   isteyebilirsiniz."
3. Getirilen alıcılar bir tabloda sayılır. Ödül ay sonunda elle tanımlanır.
