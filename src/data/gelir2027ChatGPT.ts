/**
 * ChatGPT'nin (Codex CLI, terminalden, 5 Kasım 2026) aynı girdi paketiyle yaptığı bağımsız 2027 gelir öngörüsü
 * (kullanıcı kararı 2026-11-05). ChatGPT bu sayfanın sonuçlarını görmeden çalıştı. Tam rapor:
 * docs/gelir-ongorusu-2027/chatgpt-rapor.md. Claude değerleri `gelir2027.ts` modelinden gelir (medyan kadro,
 * evden çalışma ya da ücretli izin politikası). Rakamlar 5 Kasım 2026 hesabıdır, model değişirse güncellenmelidir.
 */
export const CHATGPT = {
  ozet: 'İki hesap çalışma saatinde neredeyse aynı sonucu buldu. Gelirde bu sayfanın tahmini daha yüksektir. ChatGPT aynı bilgilerle ayrı bir hesap yaptı. ChatGPT bu sayfanın sonuçlarını görmedi. ChatGPT her kadro için 20.000 olası yıl hesapladı. Gelirdeki fark üç varsayımdan gelir. Birincisi, temsilci ağından beklenen satışın ne kadarının gerçekleşeceğidir. İkincisi destek rollerinin elde tutmaya katkısıdır. Üçüncüsü uyum ekibinin kapasite sınırıdır.',
  satirlar: [
    { ad: 'İzin sonrası yıllık çalışma', claude: '1.880 saat', chatgpt: '1.880 saat', not: 'İki analiz aynıdır: 249 iş günü × 8 saat, eksi 14 gün izin.' },
    { ad: 'Verimli saat (yıl)', claude: '1.345 saat', chatgpt: '1.463 saat', not: 'Claude, işte geçen sürenin %75’ini verimli sayar. ChatGPT haftalık 40 saatin %80’ini verimli sayar.' },
    { ad: 'Hastalık', claude: '6 gün ve ayrıca grip', chatgpt: '5 gün, grip dahil', not: 'İkisi de varsayımdır. Türkiye için güncel resmî veri yok.' },
    { ad: 'Regl politikasının etkisi', claude: 'Gelirde %1’in altında', chatgpt: 'Gelirde %1’in altında', not: 'İki hesap aynı sonucu buldu. Kadın oranı Claude’da %50, ChatGPT’de %40 varsayıldı.' },
    { ad: 'Yeni aktif satıcı (plan)', claude: '680', chatgpt: '554', not: 'ChatGPT temsilci ağının yüzde 50 gerçekleşeceğini varsayar ve uyum kapasitesiyle sınırlar.' },
    { ad: 'Ciro, tahsilat (plan)', claude: '78,2 milyon ₺', chatgpt: '56,4 milyon ₺', not: 'Claude 2026’dan devreden aylık ödeyenleri de sayar. ChatGPT yalnız 2027’de kazanılan müşterileri sayar.' },
    { ad: 'Kazanılmış gelir (plan)', claude: '58,7 milyon ₺', chatgpt: '37,1 milyon ₺', not: 'İkisi de yıllık peşin bedeli 12 aya yayar. Kalan fark temsilci ağı ve elde tutma varsayımlarından gelir.' },
    { ad: 'Kazanılmış gelir, kötümser ve iyimser', claude: '43,6 ile 70,0 milyon ₺', chatgpt: '24,9 ile 41,7 milyon ₺', not: 'ChatGPT hesabında elde tutma %55 ile %80 arasında değişir. Satış çarpanı 0,6 ile 1,25 arasında değişir. Claude’un aralığı daha dardır.' },
    { ad: 'Aylık elde tutma (plan)', claude: '%70 ile %78', chatgpt: '%70', not: 'Claude destek rollerine en çok 8 yüzde puanı katkı verir. Bu katkı bir varsayımdır.' },
    { ad: 'Risk payı', claude: '%16,7 (ChatGPT tanımıyla %25)', chatgpt: '%32,7', not: 'İki hesap risk payını farklı tanımlar. Claude, Plan öngörüsünü risksiz planla karşılaştırır. ChatGPT, kötümser öngörüyü planla karşılaştırır. ChatGPT’nin tanımıyla Claude’un risk payı %25 olur.' },
    { ad: 'En büyük risk', claude: 'Satış dönüşümü ve elde tutma', chatgpt: 'Müşteri kaybı ve düşük yenileme', not: 'İki analiz de sağlık ve izin etkisinin, yenileme ve dönüşüm etkisinden çok küçük olduğunu bulur.' },
  ],
};
