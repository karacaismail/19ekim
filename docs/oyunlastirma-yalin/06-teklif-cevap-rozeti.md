# Strateji 6: Teklif talebi ve 24 saat cevap rozeti

**Tek cümle:** Alıcının teklif talebi en çok üç satıcıya gider. Son 90 günde talepleri 24 saat içinde cevaplayan
satıcı "Hızlı cevap" rozeti alır ve sonraki taleplerde öne çıkar.

[Girişe dön](00-giris.md)

## Hangi sorunu çözer?

Alıcı ile satıcıyı eşleştirir. Teklif talebi, alıcının "şu üründen şu miktarda istiyorum" diye platforma yazmasıdır.
İngilizcede RFQ, yani request for quotation denir. Alıcı talebine cevap alamazsa bir daha talep göndermez. Satıcı da
talep gelmezse platformu boş sanır. Talebin hızlı ve doğru cevaplanması, iki tarafın da platformda kalmasını sağlar.

Proje, talebin en çok üç satıcıya gönderilmesini zaten önerir (`src/data/degerOnerisi.ts:188-194, 576`).

## Kim oynar?

- **Alıcı:** Teklif talebi gönderen her alıcı.
- **Satıcı:** Talebin kategorisinde vitrine hazır mağazası olan satıcılar.

## Kurallar

1. Alıcı talebini ürün, miktar, teslim şehri ve istenen tarihle gönderir. Eksik talep gönderilmez.
2. Talep, kategoriye uyan en çok üç satıcıya gider. Satıcı sayısını sınırlamak, alıcıyı teklif yağmurundan, satıcıyı
   da boşa uğraşmaktan korur.
3. Satıcı talebe fiyat, en az sipariş adedi ve teslim süresiyle cevap verir. Yalnız "arayın" yazmak cevap sayılmaz.
4. **Hızlı cevap rozeti:** Son 90 günde gelen taleplerin en az %90'ına 24 saat içinde eksiksiz cevap veren satıcı
   rozeti alır. Rozet için son 90 günde en az 5 talep gelmiş olmalıdır.
5. Rozet her hafta yeniden hesaplanır. Oran düşerse rozet kaybolur. Satıcı panelinde "Rozetini korumak için bu
   haftaki 2 talebe yarına kadar cevap ver" gibi bir uyarı çıkar.
6. Rozetli satıcı, talep dağıtımında öncelik alır. Uygun satıcı üçten fazlaysa talep önce rozetli satıcılara gider.

## Ödül

| Kim | Ödül | Maliyet |
| --- | --- | --- |
| Satıcı | Rozet ve talep dağıtımında öncelik | Yok |
| Alıcı | 24 saat içinde gelen, karşılaştırılabilir en çok üç teklif | Yok |

Rozet satın alınamaz. Yalnız ölçütü sağlayan satıcı alır.

## Talep az olursa ne yapılır?

İlk aylarda talep az olacaktır. Proje, aynı anda alıcıya ve satıcıya teklif talebi reklamı vermeyi tavuk yumurta
sorununun çözümü olarak önerir (`src/data/program.ts:494-499`). Satış ortaklığı programında da talep toplayıcı ortak
türü vardır. Bu ortak, en az 10 nitelikli talep getirmekle yükümlüdür (`src/data/kosullarV2.ts:322-326`).

Rozet ölçütü, talep sayısı az olan satıcıyı cezalandırmaz. En az 5 talep koşulu bu yüzden vardır. Talebi az gelen
satıcıya rozet yerine "Henüz yeterli talep yok" yazılır.

Talep sayıları platformda gerçek sayılar oluşana kadar satıcıya söylenmez. Projede şişirilmiş talep sayısı vermek
yasaktır (`src/data/degerOnerisi.ts:568-579`).

## Neden işe yarar?

- Taobao'da satıcı rozetini kazanmak sonraki 15 günde satışı %4,43 artırdı. Rozeti korumak sonraki dönemlerde %9,28
  artırdı. Rozeti kaybetmek ise satışı %7,97 düşürdü (JMIS, 2020). Kaybetme korkusu, satıcıyı ölçütü korumaya iter.
- Etsy'nin Star Seller rozeti de benzer biçimde çalışır: ilk mesajların %95'ine 24 saatte cevap, siparişlerin %95'ini
  zamanında gönderme ve 4,8 üzeri değerlendirme. Ölçüm son 3 ay üzerinden yapılır.
- Trendyol satıcı puanı haftalık hesaplanır ve soruya cevap süresini de içerir. Türk esnafı bu mantığı tanır
  (birfatura.com, Mart 2025, ikincil kaynak).

## Hile ve risk

| Risk | Önlem |
| --- | --- |
| Talebe anlamsız hızlı cevap vermek | Cevapta fiyat, adet ve teslim süresi zorunludur. Alıcı cevabı "işe yaramadı" diye işaretleyebilir. |
| Sahte talep göndererek rozet kasmak | Yalnız vergi numarasıyla doğrulanmış alıcının talebi sayılır. İlişkili hesapların talebi sayılmaz. |
| Büyük satıcıların bütün talepleri alması | Talep dağıtımında aynı satıcıya üst üste gönderim sınırlanır. Rozet öncelik verir, tekel vermez. |

## Ölçüm

- **Talebin 24 saatte en az bir cevap alma oranı.**
- **Talepten görüşmeye ya da siparişe dönüşme oranı:** Sipariş platformda değilken alıcıya bir hafta sonra kısa bir
  soru sorulur: "Bu tekliflerden biriyle anlaştınız mı?"
- **Alıcının ikinci talebi gönderme oranı.**

## İlk 30 günde elle nasıl başlar?

1. Talepler bir formla toplanır. Platform ekibi talebi elle üç satıcıya iletir.
2. Cevap süreleri tabloda tutulur. Rozet ilk ayda elle verilir.
3. Cevap gelmeyen talepte ekip satıcıyı arar. Bu, satıcıya talebin gerçek olduğunu gösterir.
