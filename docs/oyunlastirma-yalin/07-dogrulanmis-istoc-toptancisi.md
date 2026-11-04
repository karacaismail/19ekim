# Strateji 7: Doğrulanmış İstoç Toptancısı

**Tek cümle:** Satıcının vergi kaydı ve çarşıdaki fiziksel dükkânı yerinde doğrulanır. Doğrulanan satıcı, yalnız
online çalışan satıcıların veremeyeceği bir güven rozeti alır.

[Girişe dön](00-giris.md)

## Hangi sorunu çözer?

Güven sorununu çözer. Şehir dışındaki alıcı, tanımadığı bir toptancıya para göndermekten çekinir. istoc.com'un
rakiplerinden farkı, satıcıların gerçek ve ziyaret edilebilir bir dükkânının olmasıdır. Bu fark görünür kılınırsa alıcı
platforma güvenir.

Proje bu rozeti zaten anar: "Doğrulanmış İstoç Toptancısı" (`src/data/degerOnerisi.ts:398`). Ücretli bir doğrulanmış
tedarikçi rozeti de yılda 150 € varsayımıyla gelir modeli olarak yazılmıştır (`src/data/gelirModelleri.ts:153-164`).

## İki rozet birbirinden ayrıdır

| Rozet | Neyi gösterir? | Nasıl kazanılır? | Kaybedilir mi? |
| --- | --- | --- | --- |
| Doğrulanmış İstoç Toptancısı | Satıcı gerçektir ve çarşıda dükkânı vardır. | Belge ve yerinde ziyaret | Dükkân kapanırsa ya da belge geçersizse |
| Hızlı cevap (Strateji 6) | Satıcı son 90 günde iyi çalıştı. | Performans ölçütü | Ölçüt düşerse her hafta |

Doğrulama rozeti kimliği gösterir. Performans rozeti davranışı gösterir. İkisi karıştırılmaz. Bir satıcı performans
puanı toplayarak doğrulama rozeti alamaz.

## Kurallar

1. Satıcı vergi levhasını ve imza sirkülerini yükler.
2. Saha ekibi dükkânı ziyaret eder. Dükkânın adresi, tabelası ve vergi kaydındaki unvan eşleşirse doğrulama
   tamamlanır.
3. Rozet mağaza sayfasında, arama sonuçlarında ve teklif cevaplarında görünür. Rozete tıklayan alıcı doğrulamanın
   tarihini ve neyi kapsadığını görür.
4. Doğrulama yılda bir yenilenir. Dükkân kapanır ya da taşınırsa rozet kalkar.
5. Rozet bir garanti değildir. Rozetin yanındaki açıklama, rozetin ürün kalitesini değil satıcının kimliğini
   doğruladığını söyler.

## Ödül

| Kim | Ödül | Maliyet |
| --- | --- | --- |
| Satıcı | Alıcının güvenini kazanmak, aramada "yalnız doğrulanmış satıcılar" süzgecinde görünmek | Saha ekibinin ziyaret süresi |
| Alıcı | Gerçek bir dükkânla çalıştığını bilmek | Yok |

## Ücret konusu

Gelir modelleri sayfası rozet için yıllık 150 € varsayar. Ücret alınacaksa iki kural korunur:

1. Ücret doğrulamanın maliyetini karşılar. Rozetin kendisi satılmaz. Koşulu sağlamayan satıcı ücret ödese de rozet
   alamaz.
2. İlk sektörde ve kurucu satıcılarda doğrulama ücretsiz yapılır. Böylece ilk ağda güven bedava kurulur. Kurucu
   satıcı koşulu [Strateji 1](01-kurucu-saticilar.md) dosyasındadır.

## Neden işe yarar?

- Ziyaret edilebilir dükkân, istoc.com'a özgü bir avantajdır. Online pazaryerlerinin çoğu bunu doğrulayamaz.
- Alibaba'nın doğrulanmış tedarikçi rozetleri, alıcının tedarikçi seçerken baktığı ilk işaretlerdendir. Genel
  raporda da bu örnek geçer.
- Rozetler yalnız rozeti taşıyanı değil, bütün pazaryerini canlandırabilir. Bir serbest çalışan platformundaki saha
  deneyinde, rozetin yarattığı ek siparişlerin %66,7'si rozetsiz hizmetlere gitti (190researchblog, ikincil kaynak).

## Hile ve risk

| Risk | Önlem |
| --- | --- |
| Başkasının dükkânını göstermek | Ziyarette tabela, vergi unvanı ve yetkili kişi birlikte kontrol edilir. |
| Rozetin garanti sanılması | Rozet açıklaması neyi doğrulayıp neyi doğrulamadığını yazar. |
| Rozetin çarşının resmî onayı sanılması | Rozet adı ve görünümü çarşı yönetimiyle netleşmeden kullanılmaz (`src/data/degerOnerisi.ts:433`). |

## Ölçüm

- **Doğrulanmış satıcıların teklif talebi alma oranı:** Doğrulanmamış satıcılarla karşılaştırılır.
- **Alıcının "yalnız doğrulanmış" süzgecini kullanma oranı.**
- **Doğrulama süresi:** Belge yüklemeden rozete kadar geçen gün.

## İlk 30 günde elle nasıl başlar?

1. Saha ekibi, vitrine hazır mağaza ziyaretinde doğrulamayı da yapar. Ayrı bir ziyaret gerekmez.
2. Doğrulama bir tabloda tutulur: tarih, ziyaret eden kişi, eşleşen belgeler.
3. Rozet başta mağaza sayfasına elle eklenir.
