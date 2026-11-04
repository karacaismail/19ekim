# Strateji 2: Önce araç, vitrine hazır mağaza

**Tek cümle:** Satıcı, platformda hiç alıcı yokken bile işine yarayan bir dijital katalog alır. Bir ilerleme çubuğu
onu "vitrine hazır" mağazaya kadar adım adım götürür.

[Girişe dön](00-giris.md)

## Hangi sorunu çözer?

Satıcı tarafını çözer. Boş bir pazaryerinde satıcı "burada alıcı yok" diye ayrılır. Satıcıya ağdan bağımsız bir fayda
verilirse alıcı gelene kadar kalır. Bu yaklaşımın adı "tek kişilik mod"dur. Alıcı yokken de çalışan bir araç
demektir.

OpenTable önce restoranlara rezervasyon yazılımı sattı. Bir şehirde yüzlerce restoran olunca yemek yiyenlere gitti
(Andrew Chen, 2019). JOOR da önce markaların mevcut perakendecileriyle kullandığı bir toptan satış yazılımıydı.

## Satıcı alıcı yokken ne kazanır?

Toptancı bugün fiyat listesini WhatsApp'ta fotoğrafla, sesli mesajla ya da telefonla gönderir. istoc.com mağazası
bunun yerine geçer:

- Tek bağlantıyla paylaşılan, güncel fiyatlı bir katalog.
- Dükkâna asılan ve bu kataloğa açılan basılı bir QR levha.
- Stok ya da fiyat değişince bütün müşterilerine ayrı ayrı yazmak yerine tek yerden güncelleme.

Bu araç, alıcı platformu hiç bilmese de satıcının zamanını kurtarır. Saha araştırması, satıcının bugün siparişi nasıl
aldığını doğrulamalıdır. Bkz. [giriş, 2. soru](00-giris.md#2-neler-araştırılmalıydı).

## Kurallar

1. Mağaza panelinde bir ilerleme çubuğu bulunur. Çubuk beş adımdan oluşur:

   | Adım | Koşul |
   | --- | --- |
   | 1 | Firma bilgileri ve vergi numarası girildi. |
   | 2 | Dükkânın adresi ve fotoğrafı eklendi. |
   | 3 | En az 20 ürün fotoğraf, fiyat ve en az sipariş adediyle yayında. |
   | 4 | Katalog bağlantısı en az 5 müşteriyle paylaşıldı. |
   | 5 | Son 14 gün içinde en az bir kez fiyat ya da stok güncellendi. |

2. Beş adımı tamamlayan mağaza "vitrine hazır" olur. Bu tanım, projede önerilen aktif satıcı tanımıyla aynıdır:
   abonelik, en az 20 ürün ve son 14 günde giriş (`src/data/kararAnketi.ts:255-263`).
3. Çubuk her adımda bir sonraki adımı ve süresini gösterir. Örnek: "Sıradaki adım: 8 ürün daha ekle. Yaklaşık
   15 dakika sürer."
4. Vitrine hazır mağaza, sektör sayfasında ve alıcı aramalarında görünür. Hazır olmayan mağaza aramada görünmez.
5. 14 gün güncelleme yapılmazsa beşinci adım geri düşer. Mağaza vitrinden çıkmaz, ama "güncel" işareti kaybolur.

## Ödül

| Ödül | Değeri | Maliyeti |
| --- | --- | --- |
| Aramada görünmek | Alıcı geldiğinde ilk görülen mağazalardan olmak | Yok |
| Basılı QR levha | Dükkânda dijital kataloğa açılan levha | Levha başına baskı maliyeti |
| Kurucu satıcı numarası | Bkz. [Strateji 1](01-kurucu-saticilar.md) | Yok |
| Ürün fotoğrafı desteği | İlk 20 ürünün fotoğrafını saha ekibi çeker | Saha ekibinin zamanı |

Ürün fotoğrafı desteği, düşük dijital becerili satıcıyı üçüncü adımda kaybetmemek içindir. Projede düşük dijital beceri
açıkça risk olarak yazılıdır (`src/data/degerOnerisi.ts:316, 477`).

## Neden işe yarar?

- İlerleme çubuğu, yarım kalan işi tamamlatır. Satıcı neyin eksik olduğunu ve ne kadar süreceğini görür.
- Ödül, platformun zaten istediği davranıştır: dolu ve güncel katalog. Ayrı bir puan sistemine gerek yoktur.
- Beşinci adımın geri düşmesi, katalogların bayatlamasını önler. Alıcı, güncel olmayan fiyatla karşılaşmaz.

## Hile ve risk

| Risk | Önlem |
| --- | --- |
| 20 ürünü tek fotoğrafla doldurmak | Saha ekibi ya da içerik denetimi ilk 20 ürünü kontrol eder. |
| Paylaşım adımını sahte numaralarla geçmek | Paylaşım, katalog bağlantısının farklı cihazlardan açılmasıyla ölçülür. |
| Güncelleme adımını anlamsız değişiklikle geçmek | Fiyat ya da stok değişikliği sayılır. Açıklama düzeltmesi sayılmaz. |

## Ölçüm

- **Adım bazında düşüş:** Satıcılar en çok hangi adımda takılıyor?
- **Kayıttan vitrine hazıra geçen süre:** Projede onboarding için 48 saat hedefi vardır (`src/data/program.ts:116-125`).
- **Vitrine hazır mağazaların 30 gün sonra hâlâ güncel olma oranı.**

## İlk 30 günde elle nasıl başlar?

1. İlerleme çubuğu yazılmadan önce saha ekibi beş adımı basılı bir kontrol listesiyle takip eder.
2. QR levhalar, katalog bağlantısına yönlenen basit QR kodlarla basılır.
3. Takılan satıcılar haftalık listeden bulunur. Saha ekibi bu satıcılara geri döner.
