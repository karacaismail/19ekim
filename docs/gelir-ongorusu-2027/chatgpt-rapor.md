# 2027 gelir öngörüsü: ChatGPT analizi

Bu rapor ChatGPT tarafından, Codex CLI ile terminalden, 5 Kasım 2026 tarihinde üretildi. ChatGPT, Claude analizinin sonuçlarını görmeden yalnız ortak girdi paketiyle (kadro, işe alım tarihleri, gelir parametreleri) çalıştı. Metin değiştirilmeden aktarılmıştır. Karşılaştırma için `README.md` dosyasına bakın.

---

**Medyan kadro planı, 2027’de yaklaşık 554 yeni ücretli satıcı ve bu müşterilerden 37,09 milyon TL abonelik geliri üretiyor.** Belirsizlikleri içeren simülasyonun ortancası **33,07 milyon TL**. Kötümser ve iyimser sonuçlar **24,95 milyon TL ile 41,71 milyon TL** arasında.

Bu sonuçlar, aşağıda açıklanan varsayımlara bağlıdır. Dosyadaki hazır gelir sonuçlarını kullanmadım. Hesabı kadro, işe alım tarihleri ve satış kapasitesi üzerinden yeniden kurdum.

Ana hesap, **2027’de kazanılan müşterilerin gelirini** kapsıyor. Dosyadaki 2026 sonu müşteri sayısı bir senaryo tahminidir. Devreden müşterilerin paketleri ve ödeme tarihleri bilinmediği için onların gelirini ayrıca değerlendirdim.

| Medyan kadro için sonuç | Kötümser | Medyan adı verilen plan | Ortanca | İyimser |
|---|---:|---:|---:|---:|
| 2027 abonelik geliri | 24,95 milyon TL | 37,09 milyon TL | 33,07 milyon TL | 41,71 milyon TL |
| Yeni ücretli satıcı | 400 satıcı | 554 satıcı | 509 satıcı | 613 satıcı |
| Tanım | Dağılımın yüzde 10 noktası | Sabit plan varsayımları | Dağılımın yüzde 50 noktası | Dağılımın yüzde 90 noktası |

İstatistikte **medyan ve ortanca aynı kavramdır**. İstenen dört sütunu korumak için “medyan” kelimesini bütçe planının adı olarak kullandım. Gelir ve satıcı sayısının yüzdelikleri ayrı hesaplandı.

Tutarları **katma değer vergisi (KDV) hariç** kabul ettim. Bu, fiyatın vergi durumunun dosyada açıklanmaması nedeniyle kullandığım bir varsayımdır. Abonelik geliri kâr değildir. Pazar yerinden geçen mal satışlarının toplamı, sipariş ve sepet verisi bulunmadığı için hesaplanamaz.

**Kadrodan satışa geçişi şöyle hesapladım.** Medyan seçenekte yıl sonunda 38 tam zamanlı ve 2 yarı zamanlı çalışan bulunuyor. Serbest çalışanlar ve dış hizmetler bunlara dahil değildir. Segika satış çalışanını istoc.com gelirinden çıkardım.

Kadro listesi ile eski gelir tablosu farklı saha büyümesi kullanıyor. İşe alım tarihleri bulunan kadro listesini esas aldım. Böylece medyan seçenekte üçüncü saha çalışanı, Aralık 2026 başlangıcıyla hesaba girdi.

Aşağıdaki değerler, yıllık beklenen satış adetleridir. Ondalıklar gerçekleşmiş müşteri sayısını değil, model beklentisini gösterir.

| Kazanım kanalı | Medyan planda yeni ücretli satıcı | Hesabın dayanağı |
|---|---:|---|
| Saha satışları | 248,5 satıcı | Dosyadaki kişi başına aylık 8 satıcı kapasitesi kullanıldı. |
| Masa başı satışları | 71,2 satıcı | Dosyadaki aylık 4 satıcı kapasitesi ve nisan işe alımı kullanıldı. |
| Kurumsal satış | 22,6 satıcı | Haziran başlangıcı ve aylık 4 satıcı kapasitesi varsayıldı. |
| Etkinlikler | 61,7 satıcı | Dosyadaki organizatör başına aylık 6 satıcı kapasitesi kullanıldı. |
| Dijital kanallar | 71,6 satıcı | Reklam bütçesi, dönüşüm ve aşağıdaki içerik varsayımları kullanıldı. |
| Bağımsız temsilciler | 78,6 satıcı | Dosyadaki büyüme hedeflerinin yüzde 50 gerçekleşmesi varsayıldı. |
| **Toplam** | **Yaklaşık 554 satıcı** | Yuvarlamalar nedeniyle satır toplamı küçük fark gösterebilir. |

Dijital hesapta dosyadaki haftalık **5.000 TL reklam bütçesi**, müşteri adayı başına **600 TL maliyet**, yüzde **8 ücretli müşteriye dönüşüm** ve aylık **2 organik müşteri** kullanıldı. Performans pazarlama uzmanının reklam dönüşümünü yüzde **25 artırması**, arama motoru optimizasyonu ve içerik uzmanının tam kapasitede aylık **2 ek organik müşteri** sağlaması benim varsayımımdır.

Yönetim, yazılım, destek, finans ve insan kaynaklarına ayrıca satış adedi yazmadım. Bu rollerin katkısı sistemi çalışır tutma, müşteriyi kullanıma başlatma ve yenileme üzerinden gelir. Satıcı uyum uzmanının yeni bir müşteriye ortalama **2,5 üretken saat** ayırdığını varsaydım. Bu kapasite özellikle yılın başında satışların gerçekleşmesini sınırlıyor.

**Çalışma süresinin doğrudan cevabı kişi başına yıllık 1.880 saattir.** Bu sonuç, pazartesiden cumaya günde 8 saat çalışma ve 14 hafta içi işgünü yıllık izin varsayımına dayanır.

4857 sayılı İş Kanunu’ndaki haftalık **45 saat üst sınırdır**. Ara dinlenmeleri çalışma süresinden sayılmaz. Modelde 40 saati, ara dinlenmeleri hariç çalışma süresi kabul ettim. Ayırdığınız 5 saatlik “çavuş payını” ikinci kez düşmedim. [Türkiye Büyük Millet Meclisi, 2003, maddeler 63 ve 68](https://cdn.tbmm.gov.tr/KKBSPublicFile/D22/Y1/T1/KanunMetni/359dee72-3cd1-4131-8597-48c58658e326.html)

2027 takviminde **261 hafta içi gün** bulunuyor. Resmî tatillerin çalışma gününe etkisi şöyle:

| Tatil | 2027 tarihi | Çalışmadan düşen süre |
|---|---|---:|
| Yılbaşı | 1 Ocak Cuma | 1 işgünü |
| Ramazan Bayramı arifesi | 8 Mart Pazartesi | 0,5 işgünü |
| Ramazan Bayramı | 9, 10 ve 11 Mart | 3 işgünü |
| Ulusal Egemenlik ve Çocuk Bayramı | 23 Nisan Cuma | 1 işgünü |
| Emek ve Dayanışma Günü | 1 Mayıs Cumartesi | 0 işgünü |
| Kurban Bayramı arifesi | 15 Mayıs Cumartesi | 0 işgünü |
| Kurban Bayramı | 16, 17, 18 ve 19 Mayıs | 3 işgünü |
| Atatürk’ü Anma, Gençlik ve Spor Bayramı | 19 Mayıs Çarşamba | Çakıştığı için ek kayıp yoktur. |
| Demokrasi ve Millî Birlik Günü | 15 Temmuz Perşembe | 1 işgünü |
| Zafer Bayramı | 30 Ağustos Pazartesi | 1 işgünü |
| Cumhuriyet Bayramı | 28 Ekim öğleden sonra ve 29 Ekim | 1,5 işgünü |
| **Toplam** | Hafta sonları ve çakışmalar ayıklandı. | **12 işgünü, 96 saat** |

Tarihlerin kaynağı [Diyanet İşleri Başkanlığı, 2027 takvimi](https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=159). Yarım günlerin hukuki dayanağı [2429 sayılı Kanun, 1981, değişiklikler işlenmiş metin](https://vakithesaplama.diyanet.gov.tr/2429_kanun.php).

Hesap şöyledir:

- Takvim kapasitesi **261 gün × 8 saat = 2.088 saat**.
- Resmî tatillerden sonra **1.992 saat** kalır.
- Varsayılan yıllık izin **14 işgünü × 8 saat = 112 saat** tutar.
- Tatil ve izin sonrası çalışma süresi **1.880 saat** olur.
- Ayrıca varsayılan **5 hastalık işgünü** çıkarılınca beklenen fiilî çalışma **1.840 saat** olur.

Kanundaki yıllık izin alt sınırları kıdeme göre **14, 20 ve 26 gündür**. Yaş istisnaları da vardır. Kanuni izin günü ile pazartesiden cumaya planlanan işgünü her durumda aynı değildir. Bu nedenle kullandığım **14 hafta içi işgünü**, açık bir şirket planlama varsayımıdır. Yeni başlayanların çalıştıkları aylara da izin payı ayırdım. [Çalışma ve Sosyal Güvenlik Bakanlığı, tarihsiz, erişim 2026](https://www.csgb.gov.tr/sikca-sorulan-sorular/calisma-genel-mudurlugu/%C4%B1s-kanunu/)

Aynı yöntemle izin 20 hafta içi işgünü olursa yıllık süre **1.832 saate**, 26 işgünü olursa **1.784 saate** iner. Bunlar hastalık öncesi sürelerdir.

**40 saatin yaklaşık 32 saatini üretken kabul ettim.** Yüzde 80 üretkenlik oranı şirket ölçümü değil, varsayımdır. Kalan süreye sonuç üretmeyen koordinasyon, bekleme, tekrar iş yapma ve mesai içindeki ulaşım kayıpları dahildir.

Sağlık etkileriyle birlikte normal çalışma haftasının üretken karşılığı yaklaşık **31,8 saat** olur. Tatiller, izinler ve hastalıklar dahil edildiğinde yıllık toplam **1.462,7 üretken saattir**. Bu, izin sonrası kullanılabilir 1.880 saatin **yüzde 77,8’i** demektir.

Dosyadaki tam kapasite zaten **aylık 125 net üretken saat** olarak tanımlanmış. Bu nedenle satış kapasitesine yeniden yüzde 80 indirim uygulamadım. Her ayın hesaplanan üretken saatini 125 saate böldüm. Tam yıl çalışan için sonuç, yıllık **1.500 saatlik hedefin yaklaşık yüzde 97,5’idir**. Yeni çalışanların ilk ay yüzde 50, ikinci ay yüzde 75 kapasitede olması ayrıca uygulandı.

**Hastalık için kullandığım dış referanslar ve varsayım birbirinden farklıdır.**

| Konu | Kaynaklı bilgi | Modele aktarımı |
|---|---|---|
| Soğuk algınlığı | Yetişkinler yılda ortalama 2 veya 3 kez geçirir. | Hastalık sayısı doğrudan izin günü sayılmadı. |
| Mevsimsel grip | Yetişkinler için yıllık yaklaşık yüzde 5 ile yüzde 10 dış referansı bulunuyor. | Türkiye’deki bu ekibin kesin olasılığı kabul edilmedi. |
| Semptomatik grip | ABD’de sezon başına ortalama yüzde 8, sezonlar arasında yüzde 3 ile yüzde 11 bildirilmiştir. | Bu oran her kış ayına ayrı uygulanmadı. |
| Hastalık devamsızlığı | Birleşik Krallık’ta 2025 için çalışma saatlerinin yüzde 2’si kaybolmuştur. | Plan için 5 işgünü, belirsizlik için 2 ile 10 işgünü kullanıldı. |

Kaynaklar sırasıyla [ABD Hastalık Kontrol ve Önleme Merkezleri, 2026, soğuk algınlığı](https://www.cdc.gov/common-cold/about/index.html), [Avrupa Hastalık Önleme ve Kontrol Merkezi, tarihsiz, erişim 2026](https://www.ecdc.europa.eu/en/influenza-humans), [ABD Hastalık Kontrol ve Önleme Merkezleri, 2026, grip](https://www.cdc.gov/flu/about/index.html) ve [Birleşik Krallık Ulusal İstatistik Ofisi, 2026 yayını, 2025 verisi](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/labourproductivity/articles/sicknessabsenceinthelabourmarket/2025).

Türkiye’de grip genellikle ekimden itibaren artar ve aralık ile şubat arasında zirve yapar. Bu nedenle hastalık kaybını kış aylarında yoğunlaştırdım. **2027 İstanbul çalışanları için doğrulanmış özel bir grip olasılığı bulunmuyor.** [Sağlık Bakanlığı, 2023](https://adanaism.saglik.gov.tr/TR-269577/mevsimsel-grip-hastaligi-ve-grip-asisi.html)

Planın 5 hastalık günü, regl dışındaki nedenler için varsayımdır. Nezle ve grip günlerini bunun üzerine ayrıca eklemedim.

**Regl etkisini yalnız toplam kadro düzeyinde hesapladım.** Kadın oranını yüzde **40**, bu grubun ilgili dönemde regl yaşayan bölümünü yüzde **80** varsaydım. Böylece hesaplanan pay toplam kadronun yüzde **32’si** oldu.

BMJ Open’da yayımlanan 2019 araştırması, 32.748 katılımcıda belirtili günlerde ortalama yüzde **33 üretkenlik düşüşü** bildirmiştir. Ancak örneklem Hollanda’dan, öz bildirime dayalı ve öğrencileri de kapsıyor. Bu oran bütün ayın kaybı değildir. Araştırma evden çalışmanın kaybı ne kadar azaltacağını ölçmez. [BMJ Open, 2019](https://pubmed.ncbi.nlm.nih.gov/31248919/)

Benim varsayımım yılda **12 dönem**, dönem başına **2 belirtili takvim günü** ve bu günlerde yüzde **30 verim kaybıdır**. Tatil, izin ve diğer hastalık günleriyle çakışan süreleri ayıkladım. Bu hesap toplam kadroda kişi başına yılda **9,3 üretken saat kaybı** oluşturuyor.

Aşağıdaki duyarlılık tablosundaki bütün politika etkileri varsayımdır:

| Kadında oran varsayımı | Mevcut düzende üretken süre | Evden çalışma kaybı yarıya indirirse | Belirtili işgünlerinin tamamı ücretli izin olursa |
|---|---:|---:|---:|
| Yüzde 20 | 1.467,4 saat | 1.469,7 saat | 1.456,5 saat |
| Yüzde 40 | 1.462,7 saat | 1.467,4 saat | 1.441,0 saat |
| Yüzde 60 | 1.458,1 saat | 1.465,0 saat | 1.425,5 saat |

Tablo, **toplam kadrodaki ortalama kişi başına yıllık üretken saati** gösterir.

Yüzde 40 kadın oranında, uygun işlerin evden yapılması belirtili gün kaybını yarıya indirirse toplam üretken kapasite yaklaşık **yüzde 0,32 artar**. Model geliri **37,19 milyon TL** olur. İyileşme kanıtlanmadığı için bu kazancı ana plana eklemedim.

Belirtili işgünlerinin tamamı ücretli izin olursa doğrudan üretken kapasite yaklaşık **yüzde 1,48 azalır**. Model geliri **36,61 milyon TL** olur. Maaş değişmez. Çalışan bağlılığı, iyileşme ve işten ayrılmadaki olası olumlu etkiler için veri bulunmadığından ek kazanç yazmadım. İzin günlerini mevcut belirti kaybının yerine koydum, üzerine eklemedim.

**Gelir hesabında tahsilat ile kazanılmış geliri ayırdım.** Dosyadaki aylık fiyat **399 avro**, yıllık peşin fiyat **3.990 avro**, yıllık paket payı yüzde **20** olarak kullanıldı.

Dosyadaki **55,31 TL avro kurunu ocak başlangıcı**, yüzde **25 artışı ocaktan aralığa değişim** kabul ettim. Böylece aylık paket fiyatı ocakta yaklaşık **22.069 TL**, aralıkta **27.586 TL** olur. Kurun başlangıç dönemi bu modelin açık varsayımıdır.

Yeni aboneliklerin ay ortasında başladığını varsaydım. Yıllık bedeli hizmet verilen aylara dağıttım. Yıllık peşin müşterilere aylık yüzde 30 müşteri kaybı uygulamadım. Sürekli hizmette bedelin hizmet dönemi boyunca gelirleşmesi, Türkiye Finansal Raporlama Standardı 15 yaklaşımıyla uyumludur. [Kamu Gözetimi Kurumu, 2026, paragraflar 35 ve 106](https://www.kgk.gov.tr/Portalv2Uploads/files/Duyurular/v2/TMS_TFRS_Setleri/2026/Mavi_Kitap/TFRS/TFRS%2015.pdf)

Medyan planda sonuçlar şöyledir:

- **554 yeni ücretli satıcı** kazanılır.
- Aralık sonunda bu yeni müşterilerden yaklaşık **269 aktif abonelik** kalır.
- **56,37 milyon TL tahsilat** oluşur.
- Bunun **37,09 milyon TL’si 2027 abonelik geliridir**.
- Yaklaşık **19,28 milyon TL**, sonraki dönemde verilecek hizmetlere aittir.

Devreden müşteri etkisine örnek olarak, Aralık 2026’da ödeme yapmış **18 aylık abone** varsayılırsa, onların 2027 yenilemeleri yaklaşık **0,95 milyon TL ek gelir** oluşturur. Bu hesap, önceki yılda tahsil edilmiş bedellerden 2027’ye devreden hizmet gelirini içermez. Açılış müşteri listesi olmadan bu tutarı kesin toplamın içine koymadım.

**En büyük gelir riski müşteri yenilemesidir.** Aylık yüzde 70 yenileme, 12 yenileme sonunda yüzde **1,38 müşteri kalması** demektir. Yeni satış sayısı aynı tutulduğunda kendi modelimde:

| Aylık yenileme varsayımı | Medyan kadronun 2027 geliri |
|---|---:|
| Yüzde 60 | 32,64 milyon TL |
| Yüzde 70 | 37,09 milyon TL |
| Yüzde 80 | 43,42 milyon TL |

Bu karşılaştırma, yenilemedeki iyileşmenin toplam gelir üzerindeki etkisinin sağlık politikasındaki küçük kapasite farklarından daha büyük olduğunu gösteriyor.

**Risk payını yüzde 32,7 hesapladım.** Tanımı, plan gelirini simülasyonun yüzde 10 noktasına indiren paydır:

**1 − 24,946 milyon TL ÷ 37,091 milyon TL = yüzde 32,74.**

Parasal karşılığı yaklaşık **12,15 milyon TL gelir tamponudur**. Bu payı tabloda verilen riskli sonuçlardan tekrar düşmemek gerekir. Nakit rezervi hesabı için ayrıca gider ve ödeme takvimi gerekir.

Aşağıdaki risk haritasında olasılık ve etki **1 ile 5 arasında yönetim puanlarıdır**. Puanlar şirket geçmişinden hesaplanan istatistikler değildir. Olasılıkta 1 çok düşük, 5 çok yüksek değerlendirmesidir. Etkide 5, büyük gelir kaybı veya işin durması anlamına gelir.

| Risk | Olasılık | Etki | Çarpım | Önlem |
|---|---:|---:|---:|---|
| Müşteri kaybı ve düşük yenileme | 5 | 5 | 25 | İlk kullanım, alıcı talebi ve aylık müşteri gruplarının yenilemesi izlenmelidir. |
| Satış dönüşümünün tutmaması | 4 | 5 | 20 | Ücretli müşteriye dönüşüm kanal bazında ölçülmelidir. |
| İşe alım gecikmesi | 4 | 4 | 16 | Kritik işe alımlar için aday havuzu ve geçici görev paylaşımı hazırlanmalıdır. |
| Müşteriyi kullanıma başlatma darboğazı | 4 | 4 | 16 | Satış ile uyum ekibinin kapasitesi birlikte planlanmalıdır. |
| Kur artışı ve ödeme gücü | 4 | 4 | 16 | TL fiyatın dönüşüm ve yenilemeye etkisi izlenmelidir. |
| İşten ayrılma | 5 | 3 | 15 | Süreçler belgelenmeli ve kritik işlerde yedek sorumlu bulunmalıdır. |
| Mevsimsellik ve izin yoğunluğu | 5 | 3 | 15 | Hedefler aylara eşit dağıtılmamalıdır. |
| Platform, siber güvenlik ve veri kaybı | 3 | 5 | 15 | Yedekleme, erişim kontrolü ve geri dönüş tatbikatı yapılmalıdır. |
| Genel üretkenliğin düşük kalması | 4 | 3 | 12 | Saat yerine tamamlanan iş ve müşteri sonucu ölçülmelidir. |
| İstanbul trafiği | 5 | 2 | 10 | Saha ziyaretleri bölgelere göre gruplanmalıdır. |
| Afet ve uzun süreli kesinti | 2 | 5 | 10 | Alternatif çalışma ve iletişim düzeni hazırlanmalıdır. |
| Temsilci ve reklam hedeflerinin tutmaması | 3 | 3 | 9 | Tekrarlanan müşteri kayıtları ayıklanmalı ve kanal başına ödeme ölçülmelidir. |
| Hastalık kaynaklı kapasite kaybı | 4 | 2 | 8 | Görev devri ve uygun işlerde esnek çalışma sağlanmalıdır. |

İstanbul trafiği için TomTom’un **2025 verileri** somut bir operasyon riski gösteriyor. Ancak ulaşımda kaybedilen süreyi bütün çalışanların mesaisinden doğrudan düşmedim. Genel üretkenlik varsayımıyla tekrar sayılmasını önledim. [TomTom, 2025 veri yılı](https://www.tomtom.com/traffic-index/city/istanbul/)

Afet puanı, **2027 deprem olasılığı tahmini değildir**. Afet ve Acil Durum Yönetimi Başkanlığının haritası, işletmenin yıllık kapanma ihtimalini vermez. Bu risk ana simülasyonda kalibre edilmiş bir olay olarak bulunmuyor. [AFAD, 2018 haritası, 2019 yürürlüğü](https://www.afad.gov.tr/kurumlar/afad.gov.tr/39499/xfiles/deprem_haritasi.pdf)

Ayrı bir stres hesabında, **temmuzdan eylüle kadar yeni satışların tamamen durduğu**, mevcut abonelik hizmetinin sürdüğü varsayıldı. Medyan plan geliri **25,94 milyon TL’ye** indi. Uzun kesintide müşteri kaybı ve hasar giderleri de oluşursa sonuç daha kötü olabilir.

**Aylık zaman tüneli**, takvim etkisini ve ticari riski birlikte gösteriyor. Aşağıdaki satış ve gelir değerleri sabit medyan planın model sonuçlarıdır.

| Ay | Öne çıkan risk ve iş | Yeni satıcı | Abonelik geliri |
|---|---|---:|---:|
| Ocak | Grip, yılbaşı ve uyum uzmanının işe alışması kapasiteyi sınırlar. | 13,8 satıcı | 0,15 milyon TL |
| Şubat | Grip sürer. Ramazan 8 Şubat’ta başlar. Yeni işe alımlar takip edilmelidir. | 27,7 satıcı | 0,56 milyon TL |
| Mart | Ramazan Bayramı 3,5 işgünü azaltır. Satış ve pazarlama işe alımları önemlidir. | 34,1 satıcı | 1,11 milyon TL |
| Nisan | Masa başı satış ve operasyon kadrosu büyür. Eğitim yükü artar. | 43,6 satıcı | 1,73 milyon TL |
| Mayıs | Kurban Bayramı ve 19 Mayıs çakışır. İkinci uyum uzmanı başlar. | 35,8 satıcı | 2,25 milyon TL |
| Haziran | Kurumsal satış başlar. Yaz öncesi müşteri kurulumu hızlanır. | 52,7 satıcı | 2,79 milyon TL |
| Temmuz | İzinler ve 15 Temmuz kapasiteyi azaltır. Görev devri gerekir. | 46,0 satıcı | 3,37 milyon TL |
| Ağustos | İzin yoğunluğu ve müşteri erişilebilirliği öne çıkar. | 44,5 satıcı | 3,77 milyon TL |
| Eylül | Ticari hareketlilik artar. Biriken müşterilerin yenilemesi izlenmelidir. | 62,7 satıcı | 4,34 milyon TL |
| Ekim | Cumhuriyet Bayramı 1,5 işgünü azaltır. Grip dönemi başlar. | 58,1 satıcı | 5,01 milyon TL |
| Kasım | Kampanya rekabeti ve reklam maliyeti artabilir. | 66,8 satıcı | 5,65 milyon TL |
| Aralık | Grip, yıl sonu tahsilatı ve yenilemeler birlikte yönetilmelidir. | 68,3 satıcı | 6,36 milyon TL |

Ramazan başlangıcının kaynağı [Diyanet İşleri Başkanlığı, 2027 dinî günler](https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=154). Diğer aylık ticari etkiler model varsayımlarıdır. Ticaret Bakanlığının raporu genel pazar yerlerinde bayram ve kampanya mevsimselliğini gösterir, ancak istoc.com’un işletmeler arası abonelik dönüşümünü ölçmez. [Ticaret Bakanlığı, 2026 yayını, 2025 verisi](https://ticaret.gov.tr/data/6a02f2c7269de183c0b98bc4/T%C3%BCrkiye%27de%20E-Ticaretin%20G%C3%B6r%C3%BCn%C3%BCm%C3%BC%20Raporu%202025.pdf)

**Olasılık hesabını her kadro için 20.000 olası yıl üreterek yaptım.** Toplam 60.000 model yılı hesaplandı. Rastgele sayı başlangıç değeri 20271105 olarak sabitlendi.

Aşağıdaki dağılımlar benim varsayımlarımdır. Üçgensel dağılım, alt sınırın, en olası değerin ve üst sınırın tanımlandığı bir olasılık dağılımıdır.

| Değişken | Simülasyonda kullanılan varsayım |
|---|---|
| Üretken saat oranı | Üçgensel dağılım yüzde 70, yüzde 80 ve yüzde 88 aldı. |
| Genel hastalık kaybı | Üçgensel dağılım yılda 2, 5 ve 10 işgünü aldı. |
| Satış dönüşüm çarpanı | Üçgensel dağılım 0,60, 1,00 ve 1,25 aldı. |
| Medyan kadro yenilemesi | Temel dağılım yüzde 55, yüzde 70 ve yüzde 80 aldı. |
| Avro kurunun yıllık artışı | Üçgensel dağılım yüzde 5, yüzde 25 ve yüzde 50 aldı. |
| Temsilci hedeflerinin gerçekleşmesi | Üçgensel dağılım yüzde 20, yüzde 50 ve yüzde 90 aldı. |
| İşe alım gecikmesi | Sıfır ay yüzde 60, bir ay yüzde 30, iki ay yüzde 10 olasılıkla kullanıldı. |
| İşten ayrılma | Tam yıl için yüzde 15 olasılık, çalışılan süreye göre azaltılarak uygulandı. |
| Boş pozisyon süresi | 2 ay beklendi, ardından yeni kişinin kapasiteye alışması uygulandı. |
| Küçük operasyon kesintisi | Her ay yüzde 15 olasılıkla yeni satış kapasitesi yüzde 10 azaltıldı. |
| Ek talep şoku | Yılda yüzde 15 olasılıkla 3 ay boyunca yeni satış talebi yüzde 20 azaltıldı. |

Satış sayıları için Poisson dağılımı, yani beklenen satış adedi çevresindeki rastlantısal değişim kullanıldı. Gerçekleşen yeni satış sayısı uyum ekibinin kapasitesiyle sınırlandı. Yenilemeler ve yıllık paket seçimi müşteri düzeyinde olasılıklı hesaplandı.

Kur yükselirken dönüşümün ve yenilemenin zayıflayabilmesini modele bağladım. Böylece kur artışı yalnızca TL gelirini artıran bir değişken olmadı. Aylık müşteri grupları ayrı izlendi. Satış kanallarının aynı müşteriyi iki kez saymadığı varsayıldı.

Sabit plan, merkezi varsayımlarla beklenen işe alım ve kapasite kayıplarını kullanır. Simülasyon ayrıca dağılımların asimetrisini, rastlantısal ayrılıkları ve talep şoklarını içerir. Bu nedenle plan ile ortanca eşit çıkmaz. Sonuç aralığı, **seçilmiş varsayımlara bağlıdır ve geçmiş satış verisinden doğrulanmış bir güven aralığı değildir**.

**Diğer kadro seçeneklerinin kısa karşılaştırması** aşağıdadır. Ekonomik seçenekte aylık yüzde 65, güçlü seçenekte yüzde 75 yenileme varsaydım. Bu fark, destek kapasitesinin olası etkisini temsil eder ve ölçülmüş bir sonuç değildir.

| Kadro | Planın yeni satıcısı | Plan geliri | Simülasyon ortancası | Yüzde 10 ile yüzde 90 gelir aralığı |
|---|---:|---:|---:|---:|
| Ekonomik | 471 satıcı | 30,43 milyon TL | 26,54 milyon TL | 19,83 ile 33,23 milyon TL |
| **Medyan** | **554 satıcı** | **37,09 milyon TL** | **33,07 milyon TL** | **24,95 ile 41,71 milyon TL** |
| Güçlü | 640 satıcı | 45,36 milyon TL | 41,07 milyon TL | 31,00 ile 51,92 milyon TL |

Bu karşılaştırma gelir farkını gösterir. Kadro seçeneklerinin kârlılık sıralaması için işveren maliyetleri ve diğer giderler ayrıca hesaplanmalıdır.

Aşağıdaki JSON medyan kadroyu özetler. Gelirler en yakın 1.000 TL’ye yuvarlandı. `verimliSaatOrani`, üretken saatin tatil ve izin sonrası 1.880 saate oranıdır. Kayıp günleri, gerektiğinde 8 saatlik tam gün eşdeğeridir.

```json
{
  "yillikCalismaSaati": 1880,
  "verimliSaatOrani": 0.778,
  "kayipKalemleri": [
    {
      "ad": "Resmi tatiller",
      "gunYil": 12,
      "aciklama": "2027 takviminde hafta sonları ve 19 Mayıs çakışması ayıklandı. Kayıp 96 saattir. Kaynak Diyanet İşleri Başkanlığı 2027 takvimidir."
    },
    {
      "ad": "Yıllık izin",
      "gunYil": 14,
      "aciklama": "14 hafta içi işgünü şirket planlama varsayımıdır. Kayıp 112 saattir. Kanuni izin hesabı kıdem, yaş ve sözleşmeye göre ayrıca değerlendirilmelidir."
    },
    {
      "ad": "Regl dışındaki hastalıklar",
      "gunYil": 5,
      "aciklama": "40 saat kayıp varsayıldı. Grip ve nezle bu toplamın içindedir. Hastalık sonrası fiili çalışma 1840 saattir."
    },
    {
      "ad": "Çalışma içindeki üretken olmayan süre",
      "gunYil": 46,
      "aciklama": "1840 saatin yüzde 20'si olan 368 saat varsayıldı. Mesai içindeki ulaşım, bekleme ve tekrar iş yapma bu kaleme dahildir."
    },
    {
      "ad": "Regl belirtilerinin toplam kadro etkisi",
      "gunYil": 1.1615,
      "aciklama": "Kadın oranı yüzde 40, ilgili grubun regl yaşayan payı yüzde 80, yılda 24 belirtili takvim günü ve bu günlerde yüzde 30 kayıp varsayıldı. Tatil, izin ve diğer hastalık çakışmaları ayıklandı. Genel üretkenlik oranından sonra kalan ek kayıp yaklaşık 9.29 saattir."
    }
  ],
  "riskPayi": 0.3274,
  "riskler": [
    {
      "ad": "Müşteri kaybı ve düşük yenileme",
      "olasilik": 5,
      "etki": 5,
      "aylar": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "onlem": "Müşteri gruplarının kullanımını ve aylık yenilemesini takip et."
    },
    {
      "ad": "Satış dönüşümünün tutmaması",
      "olasilik": 4,
      "etki": 5,
      "aylar": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "onlem": "Her kanalda ilk ödemeye dönüşümü ölç ve hedefleri gerçekleşmelere göre güncelle."
    },
    {
      "ad": "İşe alım gecikmesi",
      "olasilik": 4,
      "etki": 4,
      "aylar": [1, 2, 3, 4, 5, 6, 7, 8],
      "onlem": "Kritik roller için aday havuzu ve geçici görev paylaşımı hazırla."
    },
    {
      "ad": "Müşteriyi kullanıma başlatma darboğazı",
      "olasilik": 4,
      "etki": 4,
      "aylar": [1, 2, 3, 4, 5, 9, 10, 11, 12],
      "onlem": "Satış hedefini uyum uzmanlarının üretken saat kapasitesiyle birlikte planla."
    },
    {
      "ad": "Kur ve ödeme gücü",
      "olasilik": 4,
      "etki": 4,
      "aylar": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "onlem": "TL fiyat değişiminin dönüşüm ve yenilemeye etkisini birlikte izle."
    },
    {
      "ad": "İşten ayrılma",
      "olasilik": 5,
      "etki": 3,
      "aylar": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "onlem": "Süreçleri belgele ve kritik görevler için yedek sorumlu belirle."
    },
    {
      "ad": "Mevsimsellik ve izin yoğunluğu",
      "olasilik": 5,
      "etki": 3,
      "aylar": [2, 3, 5, 7, 8, 10, 11, 12],
      "onlem": "Aylık hedefleri çalışma takvimine ve müşteri erişilebilirliğine göre dağıt."
    },
    {
      "ad": "Platform ve siber güvenlik",
      "olasilik": 3,
      "etki": 5,
      "aylar": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "onlem": "Yedekleme, erişim kontrolü ve geri dönüş tatbikatı uygula."
    },
    {
      "ad": "Genel üretkenlik kaybı",
      "olasilik": 4,
      "etki": 3,
      "aylar": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "onlem": "Tamamlanan işleri, tekrar iş yapmayı ve müşteri sonuçlarını ölç."
    },
    {
      "ad": "İstanbul trafiği",
      "olasilik": 5,
      "etki": 2,
      "aylar": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "onlem": "Saha ziyaretlerini bölgelere göre grupla ve ilk görüşmelerde uygun çevrim içi seçenekleri kullan."
    },
    {
      "ad": "Afet ve uzun süreli kesinti",
      "olasilik": 2,
      "etki": 5,
      "aylar": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "onlem": "Alternatif çalışma, iletişim ve yedekleme düzeni hazırla. Olasılık puanı bilimsel deprem tahmini değildir."
    },
    {
      "ad": "Temsilci ve reklam hedefleri",
      "olasilik": 3,
      "etki": 3,
      "aylar": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "onlem": "Tekrarlanan müşteri kayıtlarını ayıkla ve kanal başına ilk ödemeyi ölç."
    },
    {
      "ad": "Hastalık kaynaklı kapasite kaybı",
      "olasilik": 4,
      "etki": 2,
      "aylar": [1, 2, 3, 10, 11, 12],
      "onlem": "Görev devri ve uygun işlerde esnek çalışma sağla."
    }
  ],
  "gelir2027": {
    "kotumser": 24946000,
    "medyan": 37091000,
    "ortanca": 33071000,
    "iyimser": 41709000,
    "TL": "Türk lirası, KDV hariç, 2027 içinde kazanılmış abonelik geliri"
  },
  "yeniAktif2027": {
    "kotumser": 400,
    "medyan": 554,
    "ortanca": 509,
    "iyimser": 613
  },
  "yontem": {
    "kadro": "Medyan",
    "kaynak": "girdi.json içindeki kadro, işe alım tarihleri ve kapasite parametreleri",
    "gelirKapsami": "2027 yılında ilk ödemesini yapan yeni müşterilerin 2027 hizmet geliri",
    "devreden2026MusteriKohortu": null,
    "devreden2026Aciklama": "Dosyadaki açılış müşteri tahmini doğrulanmış müşteri kohortu olarak kullanılmadı. Devreden müşterilerin geliri ana sonuçlara dahil değildir.",
    "calismaDuzeni": "Pazartesiden cumaya günde 8 saat, haftada 40 saat",
    "cavusPayi": "45 saatten 40 saate ayrılan 5 saat tekrar düşülmedi.",
    "hastalikSonrasiFiiliSaat": 1840,
    "uretimOncesiVerimliSaatOraniVarsayimi": 0.8,
    "netUretkenSaatKisiYil": 1462.7,
    "kapasitePaydasiSaatAy": 125,
    "yeniCalisanKapasitesi": [0.5, 0.75, 1],
    "uyumSaatiYeniMusteri": 2.5,
    "aylikPaketAvro": 399,
    "yillikPaketAvro": 3990,
    "yillikPaketPayi": 0.2,
    "ocakAvroTlVarsayimi": 55.31,
    "planKurArtisi": 0.25,
    "planAylikYenileme": 0.7,
    "hizmetBaslangici": "Yeni kayıtlar ve aylık yenilemeler ay ortasında varsayıldı.",
    "gelirMuhasebesi": "Aylık ödemeler hizmet aylarına dağıtıldı. Yıllık peşin bedel 12 aylık hizmete dağıtıldı. Yıllık abonelere aylık müşteri kaybı uygulanmadı.",
    "planTahsilatTl": 56374000,
    "planAralikAktifAbonelik": 269,
    "simulasyon": "Her kadro için 20000 Monte Carlo örneklemi",
    "rastgeleBaslangicDegeri": 20271105,
    "kotumserTanimi": "Yüzde 10 noktası",
    "medyanTanimi": "Sabit varsayımlı bütçe planı",
    "ortancaTanimi": "Simülasyonun yüzde 50 noktası",
    "iyimserTanimi": "Yüzde 90 noktası",
    "riskPayiTanimi": "1 eksi kötümser gelirin plan gelirine oranı",
    "uretimOraniUcgensel": [0.7, 0.8, 0.88],
    "hastalikIsgunuUcgensel": [2, 5, 10],
    "satisDonusumCarpaniUcgensel": [0.6, 1, 1.25],
    "yenilemeSapmasiUcgensel": [-0.15, 0, 0.1],
    "kurArtisiUcgensel": [0.05, 0.25, 0.5],
    "temsilciGerceklesmeUcgensel": [0.2, 0.5, 0.9],
    "iseAlimGecikmesiAy": [0, 1, 2],
    "iseAlimGecikmesiOlasilik": [0.6, 0.3, 0.1],
    "yillikAyrilmaOlasiligiVarsayimi": 0.15,
    "pozisyonDoldurmaAy": 2,
    "aylikKucukKesintiOlasiligi": 0.15,
    "kucukKesintiSatisKaybi": 0.1,
    "yillikTalepSokuOlasiligi": 0.15,
    "talepSokuSuresiAy": 3,
    "talepSokuSatisKaybi": 0.2,
    "aylikMevsimsellikCarpanlari": [0.95, 0.9, 0.9, 1.02, 0.92, 1.03, 0.93, 0.88, 1.08, 1.1, 1.08, 1.04],
    "aylikIzinIsgunuPaylari": [0.5, 0.5, 0.5, 1, 1, 1.5, 2.5, 3, 1.5, 1, 0.5, 0.5],
    "aylikHastalikAgirliklari": [2, 1.7, 1.3, 0.8, 0.6, 0.4, 0.3, 0.3, 0.6, 1, 1.4, 1.6],
    "kadinOraniVarsayimi": 0.4,
    "ilgiliGruptaReglYasayanPayiVarsayimi": 0.8,
    "belirtiliTakvimGunuYilVarsayimi": 24,
    "belirtiliGunVerimKaybiVarsayimi": 0.3,
    "evdenCalismaKazanciAnaPlanaDahil": false,
    "riskPuaniAciklamasi": "Olasılık ve etki 1 ile 5 arasında yönetim varsayımlarıdır.",
    "sinir": "Satış geçmişiyle kalibrasyon yapılmadı. Afet ve ağır siber olay olasılıkları ana dağılımda ölçülmedi. Sonuçlar koşullu model tahminleridir."
  }
}
```