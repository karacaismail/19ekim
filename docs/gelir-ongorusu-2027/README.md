# 2027 gelir öngörüsü: raporlar ve veriler

Bu klasör, kadronun 2027'deki çalışma saati, verimi, riskleri ve satışa katkısıyla hesaplanan gelir öngörüsünü içerir. Kullanıcının 5 Kasım 2026 isteğiyle iki bağımsız analiz yapıldı: Claude analizi ve ChatGPT analizi. ChatGPT, Codex CLI ile terminalden çalıştırıldı ve Claude'un sonuçlarını görmedi. Sitedeki sayfa: Finans menüsünde “2027 gelir öngörüsü” (`/gelir-ongorusu-2027/`).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `claude-rapor.md` | Claude analizi. Rakamlar sitedeki modelden (`src/data/gelir2027.ts`) üretildi. |
| `chatgpt-rapor.md` | ChatGPT analizi, değiştirilmeden. |
| `chatgpt-istek.md` | ChatGPT'ye verilen soru metni. |
| `girdi.json` | İki analizin ortak girdi paketi: kadro, işe alım tarihleri, gelir parametreleri. Kişi adı ve gerçek ücret içermez. |
| `veriler.csv` | Claude modelinin ay ay öngörüleri (medyan kadro): kötümser, medyan, ortanca, iyimser ciro, kişi başı verimli saat ve kapasite. |

## Dört öngörünün tanımı

- **Medyan:** Risklerin beklenen değeriyle yapılan tek plan hesabıdır.
- **Kötümser, ortanca ve iyimser:** Monte Carlo simülasyonunun yüzde 10, 50 ve 90 noktalarıdır. Olası yılların yüzde 10'u kötümserin altında, yarısı ortancanın altında, yüzde 90'ı iyimserin altında kalır.
- İstatistikte medyan ve ortanca aynı kavramdır. Burada “medyan” plan hesabının adı olarak kullanılır.

## İki analizin karşılaştırması (medyan kadro)

| Ölçü | Claude | ChatGPT |
|---|---|---|
| İzin sonrası yıllık çalışma | 1.880 saat | 1.880 saat |
| Verimli saat (yıl) | 1.345 saat (yüzde 75) | 1.463 saat (yüzde 80) |
| Yeni aktif satıcı (plan) | 680 | 554 |
| Ciro, tahsilat (plan) | 78,2 milyon TL | 56,4 milyon TL |
| Kazanılmış gelir (plan) | 58,7 milyon TL | 37,1 milyon TL |
| Kazanılmış gelir, kötümser ile iyimser | 43,6 ile 70,0 milyon TL | 24,9 ile 41,7 milyon TL |
| Risk payı | Yüzde 16,7 (medyan ÷ risksiz). Kötümser ÷ plan tanımıyla yüzde 25. | Yüzde 32,7 (kötümser ÷ plan) |

## Ortak bulgular

1. Bir kişi 2027'de haftada 40 saat üzerinden, tatil ve 14 gün izinden sonra 1.880 saat çalışır. Yasal 45 saatlik üst sınırla arasındaki 249 saat çavuş payıdır.
2. Hastalık, grip ve regl dönemi kapasiteyi birkaç yüzde azaltır. Regl politikası (evden çalışma ya da ücretli izin, maaştan kesinti yok) gelire yüzde 1'den az etki eder.
3. Gelirdeki asıl belirsizlik satış dönüşümü ve aylık elde tutmadır. Elde tutmadaki 10 puanlık fark, sağlıkla ilgili bütün kayıplardan çok daha büyük gelir farkı yaratır.

## Farkın nedenleri

1. **Temsilci ağı:** ChatGPT hedefin yüzde 50'sinin gerçekleşeceğini varsayar. Claude gelir planındaki değeri kullanır ve simülasyonda yüzde 50 ile 120 arasında oynatır.
2. **Elde tutma:** Claude destek rollerine (satıcı uyumu, başarı, müşteri hizmetleri, alıcı talebi) aylık elde tutmada en çok 8 puan katkı verir. Bu kaynaksız bir varsayımdır. Katkı sayılmazsa Claude'un medyan cirosu 72,8 milyon TL olur. ChatGPT bu katkıyı vermez.
3. **Kapsam:** Claude 2026'dan devreden aylık ödeyenlerin yenilemesini de sayar. ChatGPT yalnız 2027'de kazanılan müşterileri sayar.
4. **Uyum kapasitesi:** ChatGPT yeni satışı satıcı uyum ekibinin saatiyle sınırlar. Claude bu sınırı uygulamaz.
5. **Belirsizlik aralığı:** ChatGPT elde tutmayı ve satış çarpanını daha geniş oynatır, bu yüzden kötümser sonucu daha düşüktür.

## Önerilen sonraki adım

İki analizin ayrıştığı iki varsayım, ilk 90 günün ölçümüyle netleşir: kanal başına ilk ödemeye dönüşüm ve ödeyen satıcıların aylık yenilenme oranı. Bu iki ölçü geldiğinde model yeniden çalıştırılmalıdır.
