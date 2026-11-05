Sen bağımsız bir iş analistisin. Bu klasördeki `girdi.json` dosyası, istoc.com adlı Türk B2B pazar yerinin 2027 kadro planını ve gelir modelini içerir. Dosyayı oku ve aşağıdaki soruları kendi yöntemle, kendi araştırmanla yanıtla. Başka bir analizin sonucunu görmüyorsun, kendi rakamlarını üret.

Kullanıcının sorusu:
1. İstihdam edilen bu kişilerin satışa doğrudan ve dolaylı katkısıyla 2027'de ne kadar satış ve ne kadar ciro (abonelik geliri) elde edilir?
2. Çalışma süresi: yasal haftalık 45 saati planlamada 40 saat say. Aradaki 5 saat "çavuş payı", yani verimsizlik payıdır. Kişilerin haftada 40 saat çalışmasını istiyoruz. Bu 40 saatin ne kadarı gerçekten verimli olur?
3. 2027 resmî tatillerini (dini bayramlar ve arife yarım günleri dahil) ve yıllık izni çıkarınca bir kişi 2027'de toplam kaç saat çalışır? Haftalık 40 saat üzerinden hesapla.
4. Kadın çalışanlar ayda bir regl dönemi yaşar. Bu dönemde verim ne kadar düşer? Şirket bu günlerde evden çalışma ya da ücretli izin verirse (maaştan düşülmez) toplam performansa etkisi ne olur? Kadroda kadın oranı bilinmiyor, bunu açık bir varsayım olarak al ve duyarlılığını göster. Kimseyi cinsiyetine göre tek tek değerlendirme, yalnız toplam etkiyi hesapla.
5. Hastalık: bir kişi yılda ne kadar hasta olur? Kışın grip olasılığı nedir? Bu olasılıkları kaynakla ver.
6. Diğer riskler nelerdir? (işten ayrılma, işe alım gecikmesi, verim düşüklüğü, satış dönüşümü, elde tutma, kur, mevsimsellik, İstanbul'a özgü riskler ve benzerleri)
7. Bunların hepsiyle şunları hazırla: (a) risk payı, (b) risk haritası (olasılık 1-5 × etki 1-5), (c) risklerin 2027 zaman tüneli (ay ay), (d) riskler hesaba katılınca ciro ve gelir öngörüsü.
8. Gelir öngörüsünü dört biçimde tanımla: kötümser, medyan (plan), ortanca (dağılımın yüzde 50 noktası) ve iyimser. Mümkünse bir Monte Carlo ya da benzeri olasılık hesabı yap ve yöntemini yaz.

Kurallar:
- Türkçe yaz. Kısa ama tam cümlelerle yaz. Noktalı virgül, uzun çizgi, orta nokta ve ok işareti kullanma. Kısaltmaları ilk geçtiği yerde aç.
- Her sayının birimini ve dayanağını yaz. Kaynaksız rakamı "varsayım" diye işaretle. Kaynak verirken yayıncıyı ve yılı yaz.
- Medyan kadro seçeneğini ana sonuç olarak ver, ekonomik ve güçlü seçenekler için de kısa sonuç ver.
- Raporun sonunda tek bir JSON kod bloğu ver. Alanlar: yillikCalismaSaati, verimliSaatOrani, kayipKalemleri (dizi: ad, gunYil, aciklama), riskPayi, riskler (dizi: ad, olasilik, etki, aylar, onlem), gelir2027 (kotumser, medyan, ortanca, iyimser, TL), yeniAktif2027 (aynı dört alan), yontem.
- Dosya yazma, yalnız raporu son mesaj olarak ver.
