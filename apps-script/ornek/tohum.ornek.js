/**
 * Örnek tohum: yalnız kurgusal ad ve tutarlar (testler ve deneme kurulumu için). Gerçek veri repoya girmez;
 * gerçek tohum repo dışındaki Tohum.js dosyasındadır. Sütunlar Motor.BASLIKLAR ile aynı sıradadır.
 */
var OPEX_TOHUM = {
  personel: [
    ['Örnek Yönetici', 'Bordrolu', 'Net', 120000, 'Hayır', '', 'Otomatik', true, 'Kurgusal.'],
    ['Örnek Uzman', 'Bordrolu', 'Net', 47500, 'Evet', '', 'Otomatik', true, 'Kurgusal.'],
    ['Örnek Destek', 'Bordrolu', 'Asgari ücret', '', 'Evet', '', 'Otomatik', true, 'Kurgusal.'],
    ['Örnek Ar-Ge', 'Bordrolu', 'Brüt', 60000, 'Evet', 'ARGE-5746', 'Otomatik', true, 'Kurgusal; koşullu teşvik örneği.'],
    ['Örnek Serbest A', 'Freelancer', 'Fatura (KDV dahil)', 60000, 'Evet', '', 'Hayır', true, 'Kurgusal.'],
    ['Örnek Serbest B', 'Freelancer', 'Fatura (KDV dahil)', 48000, 'Evet', '', 'Hayır', true, 'Kurgusal.'],
    ['Dahil olmayan kişi', 'Bordrolu', 'Net', 99999, 'Evet', '', 'Otomatik', false, 'Dahil = hayır; hesaba girmez.'],
  ],
  giderler: [
    ['Yapay zekâ aracı A', 'ekip-1', 'Teknoloji', 'Yapay Zekâ', 'USD', 100, 'Kur', true, true, 'https://example.com/fatura-a', ''],
    ['Yapay zekâ aracı B', 'ekip-2', 'Teknoloji', 'Yapay Zekâ', 'USD', 20, 'Kur', false, true, '', ''],
    ['Yerel yapay zekâ aboneliği', '', 'Teknoloji', 'Yapay Zekâ', 'TRY', 999.9, 'Genel', false, true, '', ''],
    ['Sunucu A', 'devops', 'Teknoloji', 'Sunucu & Bulut', 'EUR', 50, 'Kur', false, true, '', ''],
    ['Ofis paketi', '', 'Teknoloji', 'Ofis & Lisans', 'USD', 10, 'Kur', true, true, '', ''],
    ['Ofis kirası', '', 'Ofis ve işletme', 'Kira', 'TRY', 60000, 'Kira', false, true, '', ''],
    ['İnternet', '', 'Ofis ve işletme', 'Faturalar', 'TRY', 500, 'Genel', true, true, '', ''],
    ['Elektrik', '', 'Ofis ve işletme', 'Faturalar', 'TRY', '', 'Genel', false, true, '', 'Tutar girilmedi.'],
    ['Mutfak', '', 'Ofis ve işletme', 'Ofis ihtiyaçları', 'TRY', 2000, 'Genel', false, true, '', ''],
    ['Kapatılan abonelik', '', 'Teknoloji', 'Yapay Zekâ', 'USD', 500, 'Kur', false, false, '', 'Dahil = hayır.'],
  ],
};
