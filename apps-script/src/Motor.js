/**
 * Türksab OPEX motoru: saf hesap. Google Apps Script (V8) ve Node testleri aynı dosyayı çalıştırır.
 *
 * Girdi: Google Sheets girdi sayfalarının ham değerleri (başlık satırı dahil 2B diziler): Parametreler,
 * Personel, Giderler, Teşvikler. Çıktı: sayfa (GitHub Pages) ve Sheets panosu için tek model.
 * Apps Script hizmeti (SpreadsheetApp vb.) kullanılmaz; kişisel veri bu dosyada yoktur.
 *
 * Bordro: aylık kümülatif gelir vergisi matrahı, asgari ücret gelir ve damga vergisi istisnası, SGK prime esas
 * kazanç üst sınırı (tavan) ve işveren teşvikleri. Net ücretten brüte geçiş her ay için ikiye bölme ile çözülür
 * (net, brütün azalmayan fonksiyonudur); sonuç kuruşa yuvarlanır.
 */
var OpexMotor = (function () {
  'use strict';

  var SEMA = 1;
  var SURUM = '2026-10-20.5';
  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var KISA_AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var YILLAR = [2026, 2027];

  /** Kümeler: OPEX'i besleyen iki ana küme (teknoloji, insan) ve ofis/işletme giderleri. */
  var KUMELER = [
    { kod: 'teknoloji', ad: 'Teknoloji' },
    { kod: 'insan', ad: 'Personel' },
    { kod: 'ofis', ad: 'Ofis ve işletme' },
  ];

  var ENFLASYON_KAYNAGI = 'https://www.google.com/search?q=enflasyon+2026+toplam+ortalama+tefe+t%C3%BCfe';

  /**
   * Parametre tanımları: Kurulum bu satırlarla Parametreler sayfasını kurar; `formul` varsa hücre formül olur
   * (adlandırılmış aralıklar `p_<anahtar>`). Sayfada olmayan anahtar için motor `deger` ile çalışır ve uyarı verir.
   * tur: oran (kesir, %29,73 = 0,2973), tutar (₺), kur, sayi, metin, liste.
   */
  var PARAMETRE_TANIMLARI = [
    { grup: 'Dönem', ad: 'Rapor yılı', anahtar: 'rapor_yili', deger: 2026, birim: 'yıl', tur: 'sayi', formul: '=YEAR(TODAY())', aciklama: '“Bu ay” ve 12 aylık planın başlangıç yılı; hesap 2026 ve 2027’yi kapsar.' },
    { grup: 'Dönem', ad: 'Rapor ayı', anahtar: 'rapor_ayi', deger: 10, birim: 'ay', tur: 'sayi', formul: '=MONTH(TODAY())', aciklama: 'Varsayılan bugünün ayı; sabit bir ay için 1–12 yazın.' },

    { grup: 'Döviz', ad: 'USD/TRY', anahtar: 'kur_usd', deger: 48.9889, birim: '₺', tur: 'kur', formul: '=IFERROR(GOOGLEFINANCE("CURRENCY:USDTRY"),p_kur_usd_yedek)', aciklama: 'Canlı kur (Google Finance); okunamazsa yedek kur.' },
    { grup: 'Döviz', ad: 'EUR/TRY', anahtar: 'kur_eur', deger: 55.731, birim: '₺', tur: 'kur', formul: '=IFERROR(GOOGLEFINANCE("CURRENCY:EURTRY"),p_kur_eur_yedek)', aciklama: 'Canlı kur (Google Finance); okunamazsa yedek kur.' },
    { grup: 'Döviz', ad: 'USD/TRY yedek', anahtar: 'kur_usd_yedek', deger: 48.9889, birim: '₺', tur: 'kur', aciklama: 'Gider takibindeki kur.' },
    { grup: 'Döviz', ad: 'EUR/TRY yedek', anahtar: 'kur_eur_yedek', deger: 55.731, birim: '₺', tur: 'kur', aciklama: 'Gider takibindeki kur.' },

    { grup: 'Enflasyon 2026', ad: 'Yıllık TÜFE', anahtar: 'tufe_yillik', deger: 0.2973, birim: '%', tur: 'oran', aciklama: 'TÜİK, Eylül 2026. Kaynak: enflasyon_kaynak.' },
    { grup: 'Enflasyon 2026', ad: 'Aylık TÜFE', anahtar: 'tufe_aylik', deger: 0.0184, birim: '%', tur: 'oran', aciklama: 'TÜİK, Eylül 2026.' },
    { grup: 'Enflasyon 2026', ad: '12 aylık ortalama TÜFE', anahtar: 'tufe_ort12', deger: 0.3149, birim: '%', tur: 'oran', aciklama: 'Ekim 2026 kira artış tavanı.' },
    { grup: 'Enflasyon 2026', ad: 'Yİ-ÜFE aylık (eski TEFE)', anahtar: 'yiufe_aylik', deger: 0.0207, birim: '%', tur: 'oran', aciklama: 'TÜİK, Eylül 2026.' },
    { grup: 'Enflasyon 2026', ad: 'Enflasyon dönemi', anahtar: 'enflasyon_donemi', deger: 'Eylül 2026', birim: '', tur: 'metin', aciklama: 'Yukarıdaki oranların ait olduğu ay.' },
    { grup: 'Enflasyon 2026', ad: 'Enflasyon kaynağı', anahtar: 'enflasyon_kaynak', deger: ENFLASYON_KAYNAGI, birim: '', tur: 'metin', aciklama: 'Parametrelerden arındırılmış arama adresi.' },

    { grup: '2027 zam ve artışlar', ad: 'Zam esası', anahtar: 'zam_esasi', deger: 'Yıllık TÜFE', birim: '', tur: 'liste', secenekler: ['Yıllık TÜFE', '12 aylık ortalama TÜFE', 'Elle'], aciklama: 'Personel sayfasında “2027 zam: Evet” olan herkese uygulanır.' },
    { grup: '2027 zam ve artışlar', ad: 'Elle zam oranı', anahtar: 'zam_elle', deger: 0.3, birim: '%', tur: 'oran', aciklama: 'Zam esası “Elle” ise kullanılır.' },
    { grup: '2027 zam ve artışlar', ad: 'Ek zam (refah payı)', anahtar: 'zam_ek_puan', deger: 0, birim: '%', tur: 'oran', aciklama: 'Esasa eklenen puan.' },
    { grup: '2027 zam ve artışlar', ad: 'Uygulanan zam oranı', anahtar: 'zam_orani', deger: 0.2973, birim: '%', tur: 'oran', formul: '=IFS(p_zam_esasi="Yıllık TÜFE",p_tufe_yillik,p_zam_esasi="12 aylık ortalama TÜFE",p_tufe_ort12,TRUE,p_zam_elle)+p_zam_ek_puan', aciklama: 'Hesaplanır: esas + ek zam.' },
    { grup: '2027 zam ve artışlar', ad: 'Kira artışı', anahtar: 'kira_artis_2027', deger: 0.3149, birim: '%', tur: 'oran', formul: '=p_tufe_ort12', aciklama: 'Varsayılan: 12 aylık ortalama TÜFE (kira artış tavanı).' },
    { grup: '2027 zam ve artışlar', ad: 'Genel artış (fatura, ofis)', anahtar: 'genel_artis_2027', deger: 0.2973, birim: '%', tur: 'oran', formul: '=p_tufe_yillik', aciklama: '“Genel” artış esaslı kalemler; varsayılan yıllık TÜFE.' },
    { grup: '2027 zam ve artışlar', ad: 'Döviz kalemlerinde ₺ artışı', anahtar: 'kur_artis_2027', deger: 0, birim: '%', tur: 'oran', aciklama: '“Kur” esaslı kalemler. Varsayım: kur sabit (%0).' },

    { grup: 'Bordro 2026', ad: 'Brüt asgari ücret 2026', anahtar: 'asgari_brut_2026', deger: 33030, birim: '₺', tur: 'tutar', aciklama: 'Aylık; net 28.075,50 ₺.' },
    { grup: 'Bordro 2026', ad: 'SGK tavanı katsayısı', anahtar: 'sgk_tavan_kat', deger: 9, birim: '×', tur: 'sayi', aciklama: 'Prime esas kazanç üst sınırı = brüt asgari × katsayı (2026: 297.270 ₺).' },
    { grup: 'Bordro 2026', ad: 'SGK işçi payı', anahtar: 'sgk_isci', deger: 0.14, birim: '%', tur: 'oran', aciklama: 'Malullük-yaşlılık-ölüm %9 + genel sağlık %5.' },
    { grup: 'Bordro 2026', ad: 'İşsizlik işçi payı', anahtar: 'issizlik_isci', deger: 0.01, birim: '%', tur: 'oran', aciklama: '' },
    { grup: 'Bordro 2026', ad: 'SGK işveren payı', anahtar: 'sgk_isveren', deger: 0.2175, birim: '%', tur: 'oran', aciklama: 'MYÖ %12 + kısa vade %2,25 + GSS %7,5 (7566 sayılı Kanun, 2026).' },
    { grup: 'Bordro 2026', ad: 'İşsizlik işveren payı', anahtar: 'issizlik_isveren', deger: 0.02, birim: '%', tur: 'oran', aciklama: '' },
    { grup: 'Bordro 2026', ad: 'Damga vergisi', anahtar: 'damga', deger: 0.00759, birim: '%', tur: 'oran', aciklama: 'Binde 7,59.' },
    { grup: 'Bordro 2026', ad: 'GV 1. dilim üst sınırı', anahtar: 'gv_d1_2026', deger: 190000, birim: '₺', tur: 'tutar', aciklama: 'Ücretliler tarifesi (GVK 103), 2026.' },
    { grup: 'Bordro 2026', ad: 'GV 2. dilim üst sınırı', anahtar: 'gv_d2_2026', deger: 400000, birim: '₺', tur: 'tutar', aciklama: '' },
    { grup: 'Bordro 2026', ad: 'GV 3. dilim üst sınırı', anahtar: 'gv_d3_2026', deger: 1500000, birim: '₺', tur: 'tutar', aciklama: 'Ücret gelirleri.' },
    { grup: 'Bordro 2026', ad: 'GV 4. dilim üst sınırı', anahtar: 'gv_d4_2026', deger: 5300000, birim: '₺', tur: 'tutar', aciklama: '' },
    { grup: 'Bordro 2026', ad: 'GV oranı 1. dilim', anahtar: 'gv_o1', deger: 0.15, birim: '%', tur: 'oran', aciklama: '' },
    { grup: 'Bordro 2026', ad: 'GV oranı 2. dilim', anahtar: 'gv_o2', deger: 0.2, birim: '%', tur: 'oran', aciklama: '' },
    { grup: 'Bordro 2026', ad: 'GV oranı 3. dilim', anahtar: 'gv_o3', deger: 0.27, birim: '%', tur: 'oran', aciklama: '' },
    { grup: 'Bordro 2026', ad: 'GV oranı 4. dilim', anahtar: 'gv_o4', deger: 0.35, birim: '%', tur: 'oran', aciklama: '' },
    { grup: 'Bordro 2026', ad: 'GV oranı 5. dilim', anahtar: 'gv_o5', deger: 0.4, birim: '%', tur: 'oran', aciklama: '' },

    { grup: 'Bordro 2027 (varsayım)', ad: 'Brüt asgari ücret 2027', anahtar: 'asgari_brut_2027', deger: 42849.82, birim: '₺', tur: 'tutar', formul: '=ROUND(p_asgari_brut_2026*(1+p_zam_orani),2)', aciklama: 'Açıklanana kadar 2026 × (1 + zam oranı); açıklanınca tutarı yazın.' },
    { grup: 'Bordro 2027 (varsayım)', ad: 'Vergi dilimi artışı', anahtar: 'dilim_artis_2027', deger: 0.2973, birim: '%', tur: 'oran', formul: '=p_tufe_yillik', aciklama: 'Yeniden değerleme varsayımı; dilimler bininci liraya yuvarlanır.' },
    { grup: 'Bordro 2027 (varsayım)', ad: 'GV 1. dilim üst sınırı 2027', anahtar: 'gv_d1_2027', deger: 246000, birim: '₺', tur: 'tutar', formul: '=ROUND(p_gv_d1_2026*(1+p_dilim_artis_2027),-3)', aciklama: '' },
    { grup: 'Bordro 2027 (varsayım)', ad: 'GV 2. dilim üst sınırı 2027', anahtar: 'gv_d2_2027', deger: 519000, birim: '₺', tur: 'tutar', formul: '=ROUND(p_gv_d2_2026*(1+p_dilim_artis_2027),-3)', aciklama: '' },
    { grup: 'Bordro 2027 (varsayım)', ad: 'GV 3. dilim üst sınırı 2027', anahtar: 'gv_d3_2027', deger: 1946000, birim: '₺', tur: 'tutar', formul: '=ROUND(p_gv_d3_2026*(1+p_dilim_artis_2027),-3)', aciklama: '' },
    { grup: 'Bordro 2027 (varsayım)', ad: 'GV 4. dilim üst sınırı 2027', anahtar: 'gv_d4_2027', deger: 6876000, birim: '₺', tur: 'tutar', formul: '=ROUND(p_gv_d4_2026*(1+p_dilim_artis_2027),-3)', aciklama: 'SGK oranları ve tavan katsayısı 2027’de aynı varsayılır.' },

    { grup: 'Teşvik ve OPEX ayarları', ad: 'Sektör', anahtar: 'sektor', deger: 'İmalat dışı', birim: '', tur: 'liste', secenekler: ['İmalat dışı', 'İmalat'], aciklama: 'Genel prim indirimi puanını belirler.' },
    { grup: 'Teşvik ve OPEX ayarları', ad: 'Genel indirim (imalat)', anahtar: 'tesvik_puan_imalat', deger: 0.05, birim: '%', tur: 'oran', aciklama: '5510/81-ı, 2026: 5 puan.' },
    { grup: 'Teşvik ve OPEX ayarları', ad: 'Genel indirim (imalat dışı)', anahtar: 'tesvik_puan_diger', deger: 0.02, birim: '%', tur: 'oran', aciklama: '5510/81-ı, 2026: 2 puan (2025: 4 puan).' },
    { grup: 'Teşvik ve OPEX ayarları', ad: 'Freelancer KDV oranı', anahtar: 'kdv_orani', deger: 0.2, birim: '%', tur: 'oran', aciklama: 'Fatura tutarı KDV dahil girilir.' },
    { grup: 'Teşvik ve OPEX ayarları', ad: 'Freelancer OPEX tutarı', anahtar: 'opex_kdv', deger: 'KDV dahil', birim: '', tur: 'liste', secenekler: ['KDV dahil', 'KDV hariç'], aciklama: 'KDV dahil = nakit çıkışı; KDV hariç = gider (KDV indirilir).' },

    { grup: 'Yayın', ad: 'Sayfa erişimi', anahtar: 'erisim', deger: 'Anahtarla', birim: '', tur: 'liste', secenekler: ['Anahtarla', 'Herkese açık'], aciklama: 'Herkese açık: Giderler sayfası veriyi anahtarsız okur; isimler, ücretler, hesaplar ve tutarlar adresi bilen herkese görünür. Anahtarla: yalnız erişim anahtarını girenler.' },
  ];

  /**
   * Teşvik ve destek tanımları. “Standart” olanlar uygun her kişiye parametreyle uygulanır; “Koşullu” olanlar yalnız
   * Personel sayfasında “Ek teşvik” sütununa kodu yazılan kişiye uygulanır. Birlikte uygulanabilirlik ve yürürlük
   * mali müşavirle doğrulanmalıdır; değerler Teşvikler sayfasında değiştirilebilir.
   */
  var TESVIK_TURLERI = ['Puan indirimi', 'Aylık tutar', 'Asgari ücret üzerinden işveren payı', 'İşveren payı oranı'];
  var TESVIK_TANIMLARI = [
    {
      kod: 'STD-PUAN', ad: '5510/81-ı genel prim indirimi', tur: 'Puan indirimi', deger2026: 0.02, deger2027: 0.02,
      formul2026: '=IF(p_sektor="İmalat",p_tesvik_puan_imalat,p_tesvik_puan_diger)', formul2027: '=IF(p_sektor="İmalat",p_tesvik_puan_imalat,p_tesvik_puan_diger)',
      kapsam: 'Standart', birlikte: 'Evet', etkin: true,
      kosul: '4/a sigortalılar; vadesi geçmiş SGK borcu olmaması, bildirgelerin süresinde verilmesi. 2026: imalat 5 puan, imalat dışı 2 puan (7566 sayılı Kanun).',
    },
    {
      kod: 'ASGARI-DESTEK', ad: 'Asgari ücret desteği', tur: 'Aylık tutar', deger2026: 1269.9, deger2027: 0,
      kapsam: 'Standart', birlikte: 'Evet', etkin: true,
      kosul: 'Özel sektör, 4/a, emekli olmayan sigortalı; günlük 42,33 ₺ × 30 gün (SGK 2026/8 Genelgesi). 2025’in aynı ayında günlük PEK ≤ 1.300 ₺ bildirilen gün sayısıyla sınırlı. 2027 tutarı açıklanmadı (0).',
    },
    {
      kod: 'ENGELLI', ad: 'Engelli istihdamı (4857/30)', tur: 'Asgari ücret üzerinden işveren payı', deger2026: 1, deger2027: 1,
      kapsam: 'Koşullu', birlikte: 'Evet', etkin: true,
      kosul: 'Engelli sigortalı; işveren SGK hissesinin asgari ücret üzerinden tamamı Hazine’den.',
    },
    {
      kod: 'ARGE-5746', ad: 'Ar-Ge / tasarım merkezi personeli (5746)', tur: 'İşveren payı oranı', deger2026: 0.5, deger2027: 0.5,
      kapsam: 'Koşullu', birlikte: 'Evet', etkin: true,
      kosul: 'Ar-Ge veya tasarım merkezi belgesi; işveren SGK hissesinin yarısı. Gelir vergisi stopaj teşviki bu hesapta yok.',
    },
    {
      kod: 'TEKNOKENT-4691', ad: 'Teknokent Ar-Ge / yazılım personeli (4691)', tur: 'İşveren payı oranı', deger2026: 0.5, deger2027: 0.5,
      kapsam: 'Koşullu', birlikte: 'Evet', etkin: true,
      kosul: 'Teknoloji geliştirme bölgesinde çalışma; işveren SGK hissesinin yarısı. Gelir vergisi istisnası bu hesapta yok.',
    },
  ];

  /** Girdi sayfalarının başlıkları: sütun sırası değişse de başlık adıyla okunur. */
  var BASLIKLAR = {
    parametreler: { grup: 'Grup', ad: 'Parametre', deger: 'Değer', birim: 'Birim', anahtar: 'Anahtar', aciklama: 'Açıklama ve kaynak' },
    personel: {
      ad: 'Ad soyad', tur: 'Tür', esas: 'Ücret esası', tutar: 'Tutar (₺/ay)', zam: '2027 zam', tesvik: 'Ek teşvik',
      asgariDestek: 'Asgari ücret desteği', dahil: 'Dahil', not: 'Not',
    },
    giderler: {
      kalem: 'Kalem', hesap: 'Hesap', kume: 'Küme', kategori: 'Kategori', para: 'Para birimi', tutar: 'Tutar (aylık)',
      artis: '2027 artış esası', odendi: 'Bu ay ödendi', dahil: 'Dahil', fatura: 'Fatura bağlantısı', not: 'Not',
    },
    tesvikler: {
      kod: 'Kod', ad: 'Teşvik / destek', tur: 'Tür', deger2026: 'Değer 2026', deger2027: 'Değer 2027', kapsam: 'Kapsam',
      birlikte: 'Standartla birlikte', etkin: 'Etkin', kosul: 'Koşul ve dayanak',
    },
  };
  var ZORUNLU = {
    parametreler: ['anahtar', 'deger'],
    personel: ['ad', 'tur', 'esas', 'tutar'],
    giderler: ['kalem', 'kume', 'kategori', 'para', 'tutar'],
    tesvikler: ['kod', 'tur', 'deger2026', 'kapsam'],
  };
  var SECENEKLER = {
    personelTur: ['Bordrolu', 'Freelancer'],
    esas: ['Net', 'Brüt', 'Asgari ücret', 'Fatura (KDV dahil)'],
    evetHayir: ['Evet', 'Hayır'],
    asgariDestek: ['Otomatik', 'Evet', 'Hayır'],
    kume: ['Teknoloji', 'Ofis ve işletme'],
    kategori: ['Yapay Zekâ', 'Sunucu & Bulut', 'Ofis & Lisans', 'Kira', 'Faturalar', 'Ofis ihtiyaçları'],
    para: ['TRY', 'USD', 'EUR'],
    artis: ['Kur', 'Kira', 'Genel', 'Yok'],
    kapsam: ['Standart', 'Koşullu'],
  };

  /* ---------- Yardımcılar ---------- */

  function r2(x) {
    return Math.round((x + (x >= 0 ? 1 : -1) * 1e-9) * 100) / 100;
  }
  function metin(v) {
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v.toISOString();
    return String(v).trim();
  }
  /** Sayı: Sheets sayı döndürür; elle yazılmış “1.234,56” veya “%29,73” metni de okunur. Okunamazsa NaN. */
  function sayi(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    var s = metin(v).replace(/[₺$€\s]/g, '');
    if (!s) return NaN;
    var yuzde = /%/.test(s);
    s = s.replace(/%/g, '');
    if (/,/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    var n = Number(s);
    return yuzde ? n / 100 : n;
  }
  function evet(v) {
    if (v === true || v === 1) return true;
    var s = metin(v).toLocaleLowerCase('tr-TR');
    return s === 'evet' || s === 'true' || s === 'doğru' || s === 'dogru' || s === 'x' || s === '✓' || s === '1';
  }
  function topla(dizi) {
    return dizi.reduce(function (a, b) { return a + b; }, 0);
  }
  function kumeKodu(ad) {
    var s = metin(ad).toLocaleLowerCase('tr-TR');
    if (s.indexOf('tekno') === 0) return 'teknoloji';
    if (s.indexOf('ofis') === 0 || s.indexOf('işletme') >= 0) return 'ofis';
    return '';
  }

  function dolu(x) {
    return [x, x, x, x, x, x, x, x, x, x, x, x];
  }

  var KISA_AYLAR_KUCUK = KISA_AYLAR.map(function (a) { return a.toLocaleLowerCase('tr-TR'); });
  var tarihMi = function (v) { return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime()); };

  /**
   * Aylık ızgara (Giderler P:AS, Personel Q:AT; 15 aylık plan, Ekim 2026 → Aralık 2027; ızgarada olmayan ay varsayılan
   * olarak etkindir): “Eki 2026” başlıklı sütun o ayın etkinliği
   * (onay kutusu), “Eki 2026 tutar” başlıklı sütun o ayın tutarı. Satırlar girdi tablosuyla aynı satırdadır (ikisi de
   * 1. satırdan okunur). Sheets başlığı tarihe çevirmişse (ör. “Mar 2027”) tarih de o ayın etkinlik sütunu sayılır.
   */
  function ayIzgarasi(degerler) {
    var rows = Array.isArray(degerler) ? degerler : [];
    for (var b = 0; b < Math.min(rows.length, 6); b++) {
      var sutunlar = [];
      (rows[b] || []).forEach(function (h, j) {
        if (tarihMi(h)) {
          if (h.getFullYear() === 2026 || h.getFullYear() === 2027) sutunlar.push({ j: j, yil: h.getFullYear(), ay: h.getMonth(), tutar: false });
          return;
        }
        var m = metin(h).match(/^(\S+)\s+(2026|2027)(\s+(?:tutar|₺))?$/i);
        if (!m) return;
        var ay = KISA_AYLAR_KUCUK.indexOf(m[1].slice(0, 3).toLocaleLowerCase('tr-TR'));
        if (ay >= 0) sutunlar.push({ j: j, yil: Number(m[2]), ay: ay, tutar: !!m[3] });
      });
      if (sutunlar.length) return { rows: rows, sutunlar: sutunlar };
    }
    return null;
  }

  /** Alt toplam satırı (ilk sütun “Toplam …”) kalem/kişi değildir. */
  function toplamSatiri(ad) {
    return metin(ad).toLocaleLowerCase('tr-TR').indexOf('toplam') === 0;
  }

  /** Ayın tutarı varsayılandan farklı mı (Sheets formülü varsayılanı yazar; elle yazılan farklı tutar özeldir). */
  function farkli(v, varsayilan) {
    return v !== null && Math.abs(v - varsayilan) > 0.005;
  }

  /** Bir satırın ayları: aktif (boş = aktif) ve yazılı tutar (boş = null, varsayılan kullanılır). */
  function satirAylari(izgara, satir) {
    var sonuc = { aktif: { 2026: dolu(true), 2027: dolu(true) }, tutar: { 2026: dolu(null), 2027: dolu(null) } };
    if (!izgara) return sonuc;
    var r = izgara.rows[satir - 1] || [];
    // Satırda açıkça doldurulmuş onay kutusu varsa boş kutu işaretsizdir (kullanıcı ayları tek tek seçmiştir);
    // hiç doldurulmamış satırda her ay etkindir.
    var acik = izgara.sutunlar.some(function (c) { return !c.tutar && metin(r[c.j]) !== ''; });
    if (acik) izgara.sutunlar.forEach(function (c) { if (!c.tutar) sonuc.aktif[c.yil][c.ay] = false; });
    izgara.sutunlar.forEach(function (c) {
      var v = r[c.j];
      if (metin(v) === '') return;
      if (c.tutar) {
        var n = sayi(v);
        if (Number.isFinite(n)) sonuc.tutar[c.yil][c.ay] = n;
      } else sonuc.aktif[c.yil][c.ay] = evet(v);
    });
    // Başlangıç ayı (kullanıcı kararı 2026-10-20: yeni pozisyonlar ilk maaşı 1 Aralık’ta alır): planın ilk ayında etkin
    // olmayan satır, ilk etkin (işaretli ve 0’dan büyük) ayında başlar; önceki aylar — ızgarada olmayan Ocak–Eylül 2026
    // dahil — yoktur (bordroda matrah birikmez). Planın ilk ayında etkin satır yıl başından beri vardır.
    var aylar = [];
    izgara.sutunlar.forEach(function (c) {
      var k = c.yil * 12 + c.ay;
      if (aylar.indexOf(k) < 0) aylar.push(k);
    });
    aylar.sort(function (x, y) { return x - y; });
    var etkin = function (k) {
      var yil = Math.floor(k / 12);
      var t = sonuc.tutar[yil][k % 12];
      return sonuc.aktif[yil][k % 12] && !(t !== null && t <= 0);
    };
    var bas = null;
    for (var i = 0; i < aylar.length && bas === null; i++) if (etkin(aylar[i])) bas = aylar[i];
    if (bas !== aylar[0]) {
      [2026, 2027].forEach(function (yil) {
        for (var ay = 0; ay < 12; ay++) if (bas === null || yil * 12 + ay < bas) sonuc.aktif[yil][ay] = false;
      });
    }
    return sonuc;
  }

  /** Başlık satırını ilk 6 satırda arar; bulunca satırları nesneye çevirir. */
  function tabloyuOku(degerler, ad, uyarilar) {
    var basliklar = BASLIKLAR[ad];
    var zorunlu = ZORUNLU[ad];
    var rows = Array.isArray(degerler) ? degerler : [];
    for (var b = 0; b < Math.min(rows.length, 6); b++) {
      var satir = rows[b].map(metin);
      var sutun = {};
      Object.keys(basliklar).forEach(function (k) {
        sutun[k] = satir.indexOf(basliklar[k]);
      });
      var eksik = zorunlu.filter(function (k) { return sutun[k] < 0; });
      if (eksik.length) continue;
      var sonuc = [];
      for (var i = b + 1; i < rows.length; i++) {
        var r = rows[i];
        var nesne = { satir: i + 1 };
        var bos = true;
        Object.keys(sutun).forEach(function (k) {
          var v = sutun[k] >= 0 ? r[sutun[k]] : '';
          nesne[k] = v === undefined ? '' : v;
          if (sutun[k] >= 0 && metin(v) !== '') bos = false;
        });
        if (!bos) sonuc.push(nesne);
      }
      // Hizalı hesap sütunları (Sheets) başlığın sayfadaki satırını bilmelidir; isteğe bağlı sütunların varlığı da.
      sonuc.baslikSatiri = b + 1;
      sonuc.sutunlar = sutun;
      return sonuc;
    }
    if (rows.length) uyarilar.push(ad + ' sayfasında başlık satırı bulunamadı (' + zorunlu.map(function (k) { return '“' + basliklar[k] + '”'; }).join(', ') + ').');
    return null;
  }

  /* ---------- Parametreler ---------- */

  function parametreleriOku(satirlar, uyarilar) {
    var tanim = {};
    PARAMETRE_TANIMLARI.forEach(function (t) { tanim[t.anahtar] = t; });
    var deger = {};
    var liste = [];
    var gorulen = {};
    (satirlar || []).forEach(function (s) {
      var k = metin(s.anahtar);
      if (!k) return;
      gorulen[k] = true;
      var t = tanim[k];
      var ham = s.deger;
      var v;
      if (t && (t.tur === 'metin' || t.tur === 'liste')) v = metin(ham);
      else if (t) {
        v = sayi(ham);
        // %29,73 yerine 29,73 yazılmışsa (yüzde biçimi yoksa) kesire çevrilir.
        if (t.tur === 'oran' && Number.isFinite(v) && Math.abs(v) > 1.5) {
          uyarilar.push('“' + (t.ad || k) + '” oranı ' + v + ' okundu; yüzde olarak alındı (%' + v + ').');
          v = v / 100;
        }
        if (!Number.isFinite(v)) {
          if (!(t.tur === 'kur' || /_2027$/.test(k))) uyarilar.push('“' + (t.ad || k) + '” sayı değil; varsayılan kullanıldı.');
          v = undefined;
        }
      } else v = typeof ham === 'number' ? ham : metin(ham);
      if (v !== undefined) deger[k] = v;
      liste.push({ grup: metin(s.grup) || (t ? t.grup : ''), ad: metin(s.ad) || (t ? t.ad : k), anahtar: k, deger: v === undefined ? (t ? t.deger : '') : v, birim: metin(s.birim) || (t ? t.birim : ''), tur: t ? t.tur : (typeof ham === 'number' ? 'sayi' : 'metin'), aciklama: metin(s.aciklama) || (t ? t.aciklama : '') });
    });
    PARAMETRE_TANIMLARI.forEach(function (t) {
      if (!gorulen[t.anahtar] && satirlar) uyarilar.push('Parametre “' + t.anahtar + '” sayfada yok; varsayılan (' + t.deger + ') kullanıldı.');
      if (!gorulen[t.anahtar]) liste.push({ grup: t.grup, ad: t.ad, anahtar: t.anahtar, deger: t.deger, birim: t.birim, tur: t.tur, aciklama: t.aciklama });
    });
    var p = {};
    PARAMETRE_TANIMLARI.forEach(function (t) { p[t.anahtar] = t.deger; });
    Object.keys(deger).forEach(function (k) { p[k] = deger[k]; });

    // Kur: canlı değer okunamazsa yedek.
    var kur = {};
    [['USD', 'kur_usd'], ['EUR', 'kur_eur']].forEach(function (c) {
      var canli = deger[c[1]];
      var yedek = sayi(p[c[1] + '_yedek']);
      if (Number.isFinite(canli) && canli > 0) kur[c[0]] = { deger: canli, kaynak: canli === yedek ? 'yedek' : 'canlı' };
      else {
        kur[c[0]] = { deger: yedek, kaynak: 'yedek' };
        if (satirlar) uyarilar.push(c[0] + '/TRY canlı kuru okunamadı; yedek kur (' + yedek + ') kullanıldı.');
      }
    });
    kur.TRY = { deger: 1, kaynak: 'sabit' };

    // Zam: sayfadaki hesaplanmış değer; yoksa esastan.
    var esas = metin(p.zam_esasi) || 'Yıllık TÜFE';
    var zam = sayi(deger.zam_orani);
    if (!Number.isFinite(zam)) {
      var taban = esas === '12 aylık ortalama TÜFE' ? p.tufe_ort12 : esas === 'Elle' ? p.zam_elle : p.tufe_yillik;
      zam = taban + (p.zam_ek_puan || 0);
    }
    p.zam_orani = zam;

    // 2027 türetilenleri: boşsa 2026 değerinden.
    if (!Number.isFinite(sayi(deger.asgari_brut_2027))) p.asgari_brut_2027 = r2(p.asgari_brut_2026 * (1 + zam));
    if (!Number.isFinite(sayi(deger.dilim_artis_2027))) p.dilim_artis_2027 = p.tufe_yillik;
    ['gv_d1', 'gv_d2', 'gv_d3', 'gv_d4'].forEach(function (d) {
      if (!Number.isFinite(sayi(deger[d + '_2027']))) p[d + '_2027'] = Math.round((p[d + '_2026'] * (1 + p.dilim_artis_2027)) / 1000) * 1000;
    });
    if (!Number.isFinite(sayi(deger.kira_artis_2027))) p.kira_artis_2027 = p.tufe_ort12;
    if (!Number.isFinite(sayi(deger.genel_artis_2027))) p.genel_artis_2027 = p.tufe_yillik;

    var ay = Math.round(sayi(p.rapor_ayi));
    if (!(ay >= 1 && ay <= 12)) {
      uyarilar.push('Rapor ayı 1–12 arasında değil; 1 kullanıldı.');
      ay = 1;
    }
    p.rapor_ayi = ay;
    p.rapor_yili = Math.round(sayi(p.rapor_yili)) === 2027 ? 2027 : 2026;

    // Görüntü listesi hesaplanmış değerleri gösterir.
    liste.forEach(function (row) {
      if (row.anahtar in p && typeof p[row.anahtar] !== 'undefined') row.deger = p[row.anahtar];
    });
    return { p: p, kur: kur, liste: liste };
  }

  /* ---------- Teşvikler ---------- */

  function tesvikleriOku(satirlar, uyarilar) {
    var kaynak = satirlar || TESVIK_TANIMLARI.map(function (t) {
      return { kod: t.kod, ad: t.ad, tur: t.tur, deger2026: t.deger2026, deger2027: t.deger2027, kapsam: t.kapsam, birlikte: t.birlikte, etkin: t.etkin, kosul: t.kosul };
    });
    var liste = [];
    kaynak.forEach(function (s) {
      var kod = metin(s.kod);
      if (!kod) return;
      var tur = metin(s.tur);
      if (TESVIK_TURLERI.indexOf(tur) < 0) {
        uyarilar.push('Teşvik “' + kod + '” türü tanınmadı (' + tur + '); uygulanmadı.');
        return;
      }
      var d26 = sayi(s.deger2026);
      var d27 = sayi(s.deger2027);
      if (tur !== 'Aylık tutar') {
        if (Number.isFinite(d26) && d26 > 1.5) d26 = d26 / 100;
        if (Number.isFinite(d27) && d27 > 1.5) d27 = d27 / 100;
      }
      liste.push({
        kod: kod,
        ad: metin(s.ad) || kod,
        tur: tur,
        deger: { 2026: Number.isFinite(d26) ? d26 : 0, 2027: Number.isFinite(d27) ? d27 : Number.isFinite(d26) ? d26 : 0 },
        kapsam: metin(s.kapsam) === 'Standart' ? 'Standart' : 'Koşullu',
        birlikte: metin(s.birlikte) === '' ? true : evet(s.birlikte),
        etkin: metin(s.etkin) === '' ? true : evet(s.etkin),
        kosul: metin(s.kosul),
      });
    });
    return liste;
  }

  /* ---------- Bordro ---------- */

  function yilAyari(p, yil, tesvikler) {
    var s = '_' + yil;
    var asgariBrut = sayi(p['asgari_brut' + s]);
    var cfg = {
      yil: yil,
      asgariBrut: asgariBrut,
      tavan: r2(asgariBrut * p.sgk_tavan_kat),
      sgkIsci: p.sgk_isci,
      issizlikIsci: p.issizlik_isci,
      sgkIsveren: p.sgk_isveren,
      issizlikIsveren: p.issizlik_isveren,
      damga: p.damga,
      dilimler: [
        { ust: p['gv_d1' + s], oran: p.gv_o1 },
        { ust: p['gv_d2' + s], oran: p.gv_o2 },
        { ust: p['gv_d3' + s], oran: p.gv_o3 },
        { ust: p['gv_d4' + s], oran: p.gv_o4 },
        { ust: Infinity, oran: p.gv_o5 },
      ],
      tesvikler: tesvikler.filter(function (t) { return t.etkin; }).map(function (t) {
        return { kod: t.kod, ad: t.ad, tur: t.tur, deger: t.deger[yil], kapsam: t.kapsam, birlikte: t.birlikte };
      }),
    };
    // Asgari ücretin aylık gelir vergisi istisnası, asgari ücretin kendi kümülatif matrahı üzerinden hesaplanır.
    var asgariMatrah = r2(asgariBrut - r2(asgariBrut * cfg.sgkIsci) - r2(asgariBrut * cfg.issizlikIsci));
    cfg.istisnaGv = [];
    var kum = 0;
    for (var ay = 0; ay < 12; ay++) {
      cfg.istisnaGv.push(r2(vergi(kum + asgariMatrah, cfg.dilimler) - vergi(kum, cfg.dilimler)));
      kum = r2(kum + asgariMatrah);
    }
    cfg.istisnaDv = r2(asgariBrut * cfg.damga);
    cfg.asgariNet = bordroSatiri(asgariBrut, 0, 0, cfg).net;
    return cfg;
  }

  /** Kümülatif matraha göre toplam gelir vergisi (artan oranlı tarife). */
  function vergi(matrah, dilimler) {
    var toplam = 0;
    var alt = 0;
    for (var i = 0; i < dilimler.length && matrah > alt; i++) {
      var ust = dilimler[i].ust;
      toplam += (Math.min(matrah, ust) - alt) * dilimler[i].oran;
      alt = ust;
    }
    return toplam;
  }

  /** Bir ayın bordrosu: brüt ve yıl içindeki önceki kümülatif matrahtan kesintiler ve net. ay: 0–11 */
  function bordroSatiri(brut, ay, kumOnce, cfg) {
    var pek = Math.min(brut, cfg.tavan);
    var sgkIsci = r2(pek * cfg.sgkIsci);
    var issizlikIsci = r2(pek * cfg.issizlikIsci);
    var matrah = r2(brut - sgkIsci - issizlikIsci);
    var gvHam = r2(vergi(kumOnce + matrah, cfg.dilimler) - vergi(kumOnce, cfg.dilimler));
    var gvIstisna = Math.min(gvHam, cfg.istisnaGv[ay]);
    var gv = r2(gvHam - gvIstisna);
    var dvHam = r2(brut * cfg.damga);
    var dvIstisna = Math.min(dvHam, cfg.istisnaDv);
    var dv = r2(dvHam - dvIstisna);
    return {
      brut: r2(brut),
      pek: r2(pek),
      sgkIsci: sgkIsci,
      issizlikIsci: issizlikIsci,
      gvMatrahi: matrah,
      kumulatifMatrah: r2(kumOnce + matrah),
      gvHam: gvHam,
      gvIstisna: r2(gvIstisna),
      gv: gv,
      dvHam: dvHam,
      dvIstisna: r2(dvIstisna),
      dv: dv,
      net: r2(brut - sgkIsci - issizlikIsci - gv - dv),
    };
  }

  /** Hedef nete en yakın brüt (kuruş). Net, brütün azalmayan fonksiyonu olduğundan ikiye bölme yakınsar. */
  function nettenBrute(hedefNet, ay, kumOnce, cfg) {
    var netOf = function (b) { return bordroSatiri(b, ay, kumOnce, cfg).net; };
    var alt = 0;
    var ust = Math.max(hedefNet * 2, 1000);
    while (netOf(ust) < hedefNet) ust *= 1.5;
    for (var i = 0; i < 100 && ust - alt > 0.001; i++) {
      var orta = (alt + ust) / 2;
      if (netOf(orta) < hedefNet) alt = orta;
      else ust = orta;
    }
    var en = r2(ust);
    var fark = Math.abs(netOf(en) - hedefNet);
    [-0.02, -0.01, 0.01, 0.02].forEach(function (d) {
      var aday = r2(en + d);
      var f = Math.abs(netOf(aday) - hedefNet);
      if (aday > 0 && f < fark - 1e-9) {
        en = aday;
        fark = f;
      }
    });
    return en;
  }

  /** İşveren payları ve teşvikler. Standart puan önce uygulanır; koşullu teşvik kalan işveren SGK payı üzerinden. */
  function isverenPayi(satir, kisi, cfg) {
    var sgkIsveren = r2(satir.pek * cfg.sgkIsveren);
    var issizlikIsveren = r2(satir.pek * cfg.issizlikIsveren);
    var ozel = null;
    if (kisi.tesvik) {
      cfg.tesvikler.forEach(function (t) {
        if (t.kod === kisi.tesvik && t.kapsam === 'Koşullu') ozel = t;
      });
    }
    var kalemler = [];
    var kalanSgk = sgkIsveren;
    var kalanToplam = sgkIsveren + issizlikIsveren;
    var ekle = function (t, tutar) {
      tutar = r2(Math.max(0, Math.min(tutar, kalanToplam)));
      if (!tutar) return;
      kalanToplam = r2(kalanToplam - tutar);
      kalanSgk = r2(Math.max(0, kalanSgk - tutar));
      kalemler.push({ kod: t.kod, tutar: tutar });
    };
    cfg.tesvikler.forEach(function (t) {
      if (t.kapsam !== 'Standart' || t.tur !== 'Puan indirimi') return;
      if (ozel && !ozel.birlikte) return;
      ekle(t, Math.min(satir.pek * t.deger, kalanSgk));
    });
    if (ozel) {
      var tutar = 0;
      if (ozel.tur === 'Puan indirimi') tutar = Math.min(satir.pek * ozel.deger, kalanSgk);
      else if (ozel.tur === 'Aylık tutar') tutar = ozel.deger;
      else if (ozel.tur === 'Asgari ücret üzerinden işveren payı') tutar = Math.min(Math.min(satir.pek, cfg.asgariBrut) * cfg.sgkIsveren * ozel.deger, kalanSgk);
      else if (ozel.tur === 'İşveren payı oranı') tutar = kalanSgk * ozel.deger;
      ekle(ozel, tutar);
    }
    if (kisi.asgariDestek) {
      cfg.tesvikler.forEach(function (t) {
        if (t.kapsam === 'Standart' && t.tur === 'Aylık tutar' && (!ozel || ozel.birlikte)) ekle(t, t.deger);
      });
    }
    var tesvik = r2(topla(kalemler.map(function (k) { return k.tutar; })));
    return {
      sgkIsveren: sgkIsveren,
      issizlikIsveren: issizlikIsveren,
      tesvik: tesvik,
      tesvikler: kalemler,
      maliyet: r2(satir.brut + sgkIsveren + issizlikIsveren - tesvik),
    };
  }

  var SATIR_ALANLARI = [
    'brut', 'pek', 'sgkIsci', 'issizlikIsci', 'gvMatrahi', 'gvHam', 'gvIstisna', 'gv', 'dvHam', 'dvIstisna', 'dv', 'net',
    'sgkIsveren', 'issizlikIsveren', 'tesvik', 'fatura', 'kdvHaric', 'kdv', 'maliyet',
  ];

  function bosSatir(ay) {
    var s = { ay: ay, kumulatifMatrah: 0 };
    SATIR_ALANLARI.forEach(function (k) { s[k] = 0; });
    return s;
  }

  function yilToplami(aylar) {
    var t = bosSatir(0);
    aylar.forEach(function (a) {
      SATIR_ALANLARI.forEach(function (k) { t[k] = r2(t[k] + a[k]); });
    });
    t.kumulatifMatrah = aylar.length ? aylar[aylar.length - 1].kumulatifMatrah : 0;
    return t;
  }

  /**
   * Kişinin bir yılı, ay ay. aylik[ay]: null = o ay pasif (gider yok, kümülatif matrah birikmez), 'asgari' = asgari ücret,
   * sayı = o ayın tutarı (Net esası: net, Brüt: brüt, Freelancer: KDV dahil fatura; asgari ücretlide yazılı tutar net sayılır).
   */
  function kisiYili(kisi, aylik, cfg, p) {
    var aylar = [];
    var tesvikToplam = {};
    var kum = 0;
    for (var ay = 0; ay < 12; ay++) {
      var v = aylik[ay];
      var satir = bosSatir(ay + 1);
      satir.kumulatifMatrah = kum;
      if (v === null) {
        aylar.push(satir);
        continue;
      }
      if (kisi.tur === 'Freelancer') {
        satir.fatura = r2(v);
        satir.kdvHaric = r2(satir.fatura / (1 + p.kdv_orani));
        satir.kdv = r2(satir.fatura - satir.kdvHaric);
        satir.maliyet = p.opex_kdv === 'KDV hariç' ? satir.kdvHaric : satir.fatura;
        aylar.push(satir);
        continue;
      }
      var brut = v === 'asgari' ? cfg.asgariBrut : kisi.esas === 'Brüt' ? v : nettenBrute(v, ay, kum, cfg);
      var s = bordroSatiri(brut, ay, kum, cfg);
      kum = s.kumulatifMatrah;
      var e = isverenPayi(s, kisi, cfg);
      Object.keys(s).forEach(function (k) { satir[k] = s[k]; });
      satir.sgkIsveren = e.sgkIsveren;
      satir.issizlikIsveren = e.issizlikIsveren;
      satir.tesvik = e.tesvik;
      satir.maliyet = e.maliyet;
      e.tesvikler.forEach(function (t) { tesvikToplam[t.kod] = r2((tesvikToplam[t.kod] || 0) + t.tutar); });
      satir.tesvikKalemleri = e.tesvikler;
      aylar.push(satir);
    }
    return { aylar: aylar, toplam: yilToplami(aylar), tesvikler: tesvikToplam };
  }

  /* ---------- Model ---------- */

  function hesapla(girdi, secenek) {
    var uyarilar = [];
    var simdi = (secenek && secenek.simdi) || new Date();
    var parametreSatirlari = girdi && girdi.parametreler ? tabloyuOku(girdi.parametreler, 'parametreler', uyarilar) : null;
    var ps = parametreleriOku(parametreSatirlari, uyarilar);
    var p = ps.p;
    var tesvikler = tesvikleriOku(girdi && girdi.tesvikler ? tabloyuOku(girdi.tesvikler, 'tesvikler', uyarilar) : null, uyarilar);
    var cfg = {};
    YILLAR.forEach(function (y) { cfg[y] = yilAyari(p, y, tesvikler); });

    var tesvikKodlari = {};
    var ayP = girdi && girdi.personelAylari ? ayIzgarasi(girdi.personelAylari) : null;
    tesvikler.forEach(function (t) { tesvikKodlari[t.kod] = t; });

    // Personel
    var kisiler = [];
    var gorulenAd = {};
    (girdi && girdi.personel ? tabloyuOku(girdi.personel, 'personel', uyarilar) || [] : []).forEach(function (s) {
      var ad = metin(s.ad);
      if (!ad || toplamSatiri(ad)) return;
      if (gorulenAd[ad]) uyarilar.push('Personel “' + ad + '” birden çok satırda (' + gorulenAd[ad] + ' ve ' + s.satir + '); ayırt etmek için adı değiştirin.');
      gorulenAd[ad] = gorulenAd[ad] || s.satir;
      if (metin(s.dahil) !== '' && !evet(s.dahil)) return;
      var tur = metin(s.tur) === 'Freelancer' ? 'Freelancer' : 'Bordrolu';
      var esas = metin(s.esas);
      if (SECENEKLER.esas.indexOf(esas) < 0) esas = tur === 'Freelancer' ? 'Fatura (KDV dahil)' : 'Net';
      if (tur === 'Freelancer') esas = 'Fatura (KDV dahil)';
      var tutar = sayi(s.tutar);
      var pa = satirAylari(ayP, s.satir);
      // Tutar boş ama ay ay tutar yazılmışsa kişi yalnız o aylarda vardır.
      var ayTutari = [2026, 2027].some(function (y) { return pa.tutar[y].some(function (v) { return v !== null && v > 0; }); });
      if (esas !== 'Asgari ücret' && !(tutar > 0)) {
        if (!ayTutari) {
          uyarilar.push('Personel “' + ad + '” için tutar yok; Tutar sütununa veya ay sütunlarına net/brüt/fatura tutarını yazın.');
          return;
        }
        tutar = 0;
      }
      var tesvik = metin(s.tesvik);
      if (tesvik && !tesvikKodlari[tesvik]) {
        uyarilar.push('Personel “' + ad + '”: teşvik kodu “' + tesvik + '” Teşvikler sayfasında yok.');
        tesvik = '';
      }
      var destek = metin(s.asgariDestek) || 'Otomatik';
      var kisi = {
        ad: ad,
        tur: tur,
        esas: esas,
        // Boş bırakılırsa zam uygulanır; yalnız “Hayır” yazılan kişi hariç tutulur.
        zam: metin(s.zam) === '' ? true : evet(s.zam),
        tesvik: tur === 'Bordrolu' ? tesvik : '',
        asgariDestek: tur === 'Bordrolu' && (destek === 'Otomatik' ? esas === 'Asgari ücret' : evet(destek)),
        not: metin(s.not),
      };
      var tutar26 = esas === 'Asgari ücret' ? cfg[2026].asgariNet : tutar;
      var tutar27 = esas === 'Asgari ücret' ? cfg[2027].asgariNet : kisi.zam ? r2(tutar * (1 + p.zam_orani)) : tutar;
      // Aylık ızgara: işaretsiz ay pasif; varsayılandan farklı yazılan tutar o ayın tutarı (özel); 0 yazılan ay ödeme yok;
      // boş ya da varsayılana eşit (Sheets formülü) ay varsayılan (2027’de zamlı, asgari ücretlide o yılın asgarisi).
      var kisiOzel = { 2026: [], 2027: [] };
      var kisiTutar = { 2026: [], 2027: [] };
      var aylikTutar = function (yil, varsayilan) {
        var asgari = esas === 'Asgari ücret';
        var deger = asgari ? cfg[yil].asgariNet : varsayilan;
        return pa.aktif[yil].map(function (on, i) {
          var v = pa.tutar[yil][i];
          var ozel = on && farkli(v, deger);
          kisiOzel[yil][i] = ozel;
          var ayTutar = !on ? null : ozel ? (v > 0 ? v : null) : asgari ? 'asgari' : deger > 0 ? deger : null;
          kisiTutar[yil][i] = ayTutar === null ? 0 : ayTutar === 'asgari' ? deger : ayTutar;
          return ayTutar;
        });
      };
      var y26 = kisiYili(kisi, aylikTutar(2026, tutar), cfg[2026], p);
      var y27 = kisiYili(kisi, aylikTutar(2027, tutar27), cfg[2027], p);
      kisiler.push({
        satir: s.satir,
        ad: ad,
        tur: tur,
        esas: esas,
        tutar: r2(tutar26),
        tutar2027: r2(tutar27),
        zam: kisi.zam,
        zamOrani: esas === 'Asgari ücret' ? r2((cfg[2027].asgariNet / cfg[2026].asgariNet - 1) * 10000) / 10000 : kisi.zam ? p.zam_orani : 0,
        tesvik: kisi.tesvik ? { kod: kisi.tesvik, ad: tesvikKodlari[kisi.tesvik].ad } : null,
        asgariDestek: kisi.asgariDestek,
        not: kisi.not,
        aktif: { y2026: pa.aktif[2026], y2027: pa.aktif[2027] },
        ozel: { y2026: kisiOzel[2026], y2027: kisiOzel[2027] },
        // Ayın yazılan (veya varsayılan) tutarı: ücret esasına göre net/brüt/fatura; işaretsiz ay 0.
        aylikTutar: { y2026: kisiTutar[2026], y2027: kisiTutar[2027] },
        y2026: { aylar: y26.aylar, toplam: y26.toplam, tesvikler: y26.tesvikler },
        y2027: { aylar: y27.aylar, toplam: y27.toplam, tesvikler: y27.tesvikler },
      });
    });

    // Giderler
    var artisOrani = { Kur: p.kur_artis_2027, Kira: p.kira_artis_2027, Genel: p.genel_artis_2027, Yok: 0 };
    var giderler = [];
    // Gider sayfaları (kullanıcı kararı 2026-10-20): Giderler TEKNOLOJİ (giderler) ve Giderler OFİS (giderler2); her
    // birinin kendi ızgarası vardır. Küme boşsa sayfanın grubu sayılır. Ayrılmamış eski sayfa birinci kaynaktır.
    var giderKaynaklari = [
      { tablo: girdi && girdi.giderler, aylar: girdi && girdi.giderAylari, kume: 'teknoloji' },
      { tablo: girdi && girdi.giderler2, aylar: girdi && girdi.giderAylari2, kume: 'ofis' },
    ];
    // “Bu ay ödendi” sütunu kaldırılmışsa ödeme takibi yoktur (sayfa ve pano ödenen/bekleyen göstermez).
    var odemeTakibi = false;
    giderKaynaklari.forEach(function (kaynak) {
      if (!kaynak.tablo) return;
      var giderTablosu = tabloyuOku(kaynak.tablo, 'giderler', uyarilar);
      if (giderTablosu && giderTablosu.sutunlar && giderTablosu.sutunlar.odendi >= 0) odemeTakibi = true;
      var ayG = kaynak.aylar ? ayIzgarasi(kaynak.aylar) : null;
      (giderTablosu || []).forEach(function (s) {
        var kalem = metin(s.kalem);
        if (!kalem || toplamSatiri(kalem)) return;
        if (metin(s.dahil) !== '' && !evet(s.dahil)) return;
        var kume = metin(s.kume) === '' ? kaynak.kume : kumeKodu(s.kume);
        if (!kume) {
          uyarilar.push('Gider “' + kalem + '” kümesi tanınmadı (' + metin(s.kume) + '); ' + KUME_ADI[kaynak.kume] + ' sayıldı.');
          kume = kaynak.kume;
        }
        var para = metin(s.para).toUpperCase() || 'TRY';
        if (!ps.kur[para]) {
          uyarilar.push('Gider “' + kalem + '” para birimi tanınmadı (' + para + '); TRY sayıldı.');
          para = 'TRY';
        }
        var tutar = sayi(s.tutar);
        var eksik = !(tutar > 0);
        if (!Number.isFinite(tutar)) tutar = 0;
        var artis = metin(s.artis) || (para === 'TRY' ? 'Genel' : 'Kur');
        if (!(artis in artisOrani)) artis = 'Genel';
        var tl = r2(tutar * ps.kur[para].deger);
        var tl2027 = r2(tl * (1 + artisOrani[artis]));
        var fatura = metin(s.fatura);
        // Aylık ızgara: işaretsiz ay 0; tutar satırın para biriminde. Varsayılan (Sheets formülü de bunu yazar): 2026 Tutar;
        // 2027 Kur esaslı döviz kalemi aynı döviz tutarı (₺ artışı kur varsayımıyla), diğerleri Tutar × (1 + artış).
        var ga = satirAylari(ayG, s.satir);
        var kurDoviz = para !== 'TRY' && artis === 'Kur';
        var tutarYil = { 2026: tutar, 2027: kurDoviz ? tutar : r2(tutar * (1 + artisOrani[artis])) };
        var giderOzel = { 2026: [], 2027: [] };
        var aylikTl = function (yil, varsayilan) {
          var kur = ps.kur[para].deger * (yil === 2027 && kurDoviz ? 1 + p.kur_artis_2027 : 1);
          return ga.aktif[yil].map(function (on, i) {
            var v = ga.tutar[yil][i];
            var ozel = on && farkli(v, tutarYil[yil]);
            giderOzel[yil][i] = ozel;
            return !on ? 0 : ozel ? r2(v * kur) : varsayilan;
          });
        };
        giderler.push({
          satir: s.satir,
          // Satır numarası sayfaya göredir; hangi gider sayfasından geldiği (teknoloji / ofis).
          kaynak: kaynak.kume,
          kalem: kalem,
          hesap: metin(s.hesap),
          kume: kume,
          kategori: metin(s.kategori) || 'Diğer',
          para: para,
          tutar: tutar,
          tl: tl,
          tl2027: tl2027,
          aylikTl: { y2026: aylikTl(2026, tl), y2027: aylikTl(2027, tl2027) },
          aktif: { y2026: ga.aktif[2026], y2027: ga.aktif[2027] },
          ozel: { y2026: giderOzel[2026], y2027: giderOzel[2027] },
          artis: artis,
          artisOrani: artisOrani[artis],
          odendi: evet(s.odendi),
          eksik: eksik,
          fatura: /^https:\/\//.test(fatura) ? fatura : '',
          not: metin(s.not),
        });
      });
    });

    // Aylık seriler
    var ayGider = function (y, kume, a) {
      return r2(topla(giderler.filter(function (g) { return g.kume === kume; }).map(function (g) { return g.aylikTl[y][a]; })));
    };
    var aylik = [];
    for (var a = 0; a < 12; a++) {
      var insan26 = r2(topla(kisiler.map(function (k) { return k.y2026.aylar[a].maliyet; })));
      var insan27 = r2(topla(kisiler.map(function (k) { return k.y2027.aylar[a].maliyet; })));
      aylik.push({
        ay: a + 1,
        ad: AYLAR[a],
        kisa: KISA_AYLAR[a],
        y2026: kume3(ayGider('y2026', 'teknoloji', a), insan26, ayGider('y2026', 'ofis', a)),
        y2027: kume3(ayGider('y2027', 'teknoloji', a), insan27, ayGider('y2027', 'ofis', a)),
      });
    }
    var yil26 = yilKume(aylik, 'y2026');
    var yil27 = yilKume(aylik, 'y2027');
    var ayIdx = p.rapor_ayi - 1;
    var yilAnahtar = p.rapor_yili === 2027 ? 'y2027' : 'y2026';
    var buAy = aylik[ayIdx][yilAnahtar];

    // 12 aylık plan: rapor ayından başlayarak ay ay (2027 ayları zamlı 2027 hesabı); 2027 sonrası hesaplanmaz.
    var plan = [];
    for (var n = 0; n < 12; n++) {
      var sira = p.rapor_ayi - 1 + n;
      var planYil = p.rapor_yili + Math.floor(sira / 12);
      if (planYil > 2027) break;
      var planAy = sira % 12;
      var pk = aylik[planAy][planYil === 2027 ? 'y2027' : 'y2026'];
      plan.push({ yil: planYil, ay: planAy + 1, ad: AYLAR[planAy] + ' ' + planYil, kisa: KISA_AYLAR[planAy] + ' ' + String(planYil).slice(2), teknoloji: pk.teknoloji, insan: pk.insan, ofis: pk.ofis, toplam: pk.toplam });
    }

    // Kategoriler (bu ay ve 2027 aylık ortalama)
    var kategoriler = [];
    var kategoriEkle = function (kume, kategori, buAyTutar, tutar27) {
      var mevcut = kategoriler.filter(function (k) { return k.kume === kume && k.kategori === kategori; })[0];
      if (mevcut) {
        mevcut.buAy = r2(mevcut.buAy + buAyTutar);
        mevcut.aylik2027 = r2(mevcut.aylik2027 + tutar27);
      } else kategoriler.push({ kume: kume, kategori: kategori, buAy: r2(buAyTutar), aylik2027: r2(tutar27) });
    };
    giderler.forEach(function (g) { kategoriEkle(g.kume, g.kategori, g.aylikTl[yilAnahtar][ayIdx], topla(g.aylikTl.y2027) / 12); });
    kisiler.forEach(function (k) {
      var y = k[yilAnahtar];
      kategoriEkle('insan', k.tur === 'Freelancer' ? 'Freelancer (fatura)' : 'Bordrolu personel', y.aylar[ayIdx].maliyet, k.y2027.toplam.maliyet / 12);
    });
    kategoriler.sort(function (x, y) { return y.buAy - x.buAy; });

    // Bordro köprüsü (bu ay, bordrolu toplam)
    var kopru = bosSatir(p.rapor_ayi);
    kisiler.filter(function (k) { return k.tur === 'Bordrolu'; }).forEach(function (k) {
      var s = k[yilAnahtar].aylar[ayIdx];
      SATIR_ALANLARI.forEach(function (f) { kopru[f] = r2(kopru[f] + s[f]); });
    });

    // Teşvik özetleri
    var tesvikOzet = tesvikler.map(function (t) {
      var kim = kisiler.filter(function (k) { return (k.y2026.tesvikler[t.kod] || 0) > 0 || (k.y2027.tesvikler[t.kod] || 0) > 0; }).map(function (k) { return k.ad; });
      var buAyTutar = 0;
      kisiler.forEach(function (k) {
        (k[yilAnahtar].aylar[ayIdx].tesvikKalemleri || []).forEach(function (x) {
          if (x.kod === t.kod) buAyTutar += x.tutar;
        });
      });
      return {
        kod: t.kod,
        ad: t.ad,
        tur: t.tur,
        deger2026: t.deger[2026],
        deger2027: t.deger[2027],
        kapsam: t.kapsam,
        birlikte: t.birlikte,
        etkin: t.etkin,
        kosul: t.kosul,
        uygulananlar: kim,
        buAy: r2(buAyTutar),
        yil2026: r2(topla(kisiler.map(function (k) { return k.y2026.tesvikler[t.kod] || 0; }))),
        yil2027: r2(topla(kisiler.map(function (k) { return k.y2027.tesvikler[t.kod] || 0; }))),
      };
    });

    var buAyAktif = giderler.filter(function (g) { return g.aktif[yilAnahtar][ayIdx]; });
    var odenen = buAyAktif.filter(function (g) { return g.odendi; });
    var bekleyen = buAyAktif.filter(function (g) { return !g.odendi; });
    var aylikOrt26 = bolKume(yil26, 12);
    var aylikOrt27 = bolKume(yil27, 12);

    return {
      sema: SEMA,
      surum: SURUM,
      hesaplandi: simdi.toISOString(),
      donem: { yil: p.rapor_yili, ay: p.rapor_ayi, ayAdi: AYLAR[ayIdx], etiket: AYLAR[ayIdx] + ' ' + p.rapor_yili },
      kur: ps.kur,
      enflasyon: {
        yillik: p.tufe_yillik,
        aylik: p.tufe_aylik,
        ortalama12: p.tufe_ort12,
        yiufeAylik: p.yiufe_aylik,
        donem: metin(p.enflasyon_donemi),
        kaynak: /^https:\/\//.test(metin(p.enflasyon_kaynak)) ? metin(p.enflasyon_kaynak) : ENFLASYON_KAYNAGI,
      },
      erisim: metin(p.erisim) === 'Herkese açık' ? 'Herkese açık' : 'Anahtarla',
      zam: { esas: metin(p.zam_esasi), oran: p.zam_orani, ekPuan: p.zam_ek_puan || 0 },
      artis2027: { kira: p.kira_artis_2027, genel: p.genel_artis_2027, kur: p.kur_artis_2027, dilim: p.dilim_artis_2027 },
      asgari: {
        y2026: { brut: cfg[2026].asgariBrut, net: cfg[2026].asgariNet, tavan: cfg[2026].tavan },
        y2027: { brut: cfg[2027].asgariBrut, net: cfg[2027].asgariNet, tavan: cfg[2027].tavan },
      },
      ozet: {
        buAy: buAy,
        aylikOrt2026: aylikOrt26,
        aylikOrt2027: aylikOrt27,
        yil2026: yil26,
        yil2027: yil27,
        degisim: aylikOrt26.toplam ? aylikOrt27.toplam / aylikOrt26.toplam - 1 : 0,
        odeme: {
          takip: odemeTakibi,
          odenen: r2(topla(odenen.map(function (g) { return g.aylikTl[yilAnahtar][ayIdx]; }))),
          bekleyen: r2(topla(bekleyen.map(function (g) { return g.aylikTl[yilAnahtar][ayIdx]; }))),
          adetOdenen: odenen.length,
          adetBekleyen: bekleyen.length,
        },
      },
      plan: { aylar: plan, toplam: yilKume(plan.map(function (x) { return { k: x }; }), 'k') },
      kumeler: KUMELER,
      kategoriler: kategoriler,
      aylik: aylik,
      giderler: giderler,
      kisiler: kisiler.map(function (k) {
        [k.y2026, k.y2027].forEach(function (y) {
          y.aylar.forEach(function (s) { delete s.tesvikKalemleri; });
        });
        return k;
      }),
      bordroKopru: kopru,
      tesvikler: tesvikOzet,
      parametreler: ps.liste,
      uyarilar: uyarilar,
    };
  }

  /** Web uygulaması kimlik denetiminden önce okunur: Parametreler → “Sayfa erişimi” = “Herkese açık” mı? */
  function erisimAcik(parametreTablosu) {
    var satirlar = tabloyuOku(parametreTablosu || [], 'parametreler', []) || [];
    return satirlar.some(function (s) { return metin(s.anahtar) === 'erisim' && metin(s.deger) === 'Herkese açık'; });
  }

  function kume3(t, i, o) {
    return { teknoloji: r2(t), insan: r2(i), ofis: r2(o), toplam: r2(t + i + o) };
  }
  function yilKume(aylik, y) {
    return kume3(
      topla(aylik.map(function (a) { return a[y].teknoloji; })),
      topla(aylik.map(function (a) { return a[y].insan; })),
      topla(aylik.map(function (a) { return a[y].ofis; })),
    );
  }
  function bolKume(k, n) {
    return kume3(k.teknoloji / n, k.insan / n, k.ofis / n);
  }

  /* ---------- Sheets raporları (özel işlev OPEX) ---------- */

  var KUME_ADI = { teknoloji: 'Teknoloji', insan: 'Personel', ofis: 'Ofis ve işletme' };

  /** Sheets hücrelerine yayılan 2B tablolar. Başlık satırı ilk satırdır. */
  function rapor(model, ad, girdi) {
    var m = model;
    var bu = m.donem.etiket;
    var yilAnahtar = m.donem.yil === 2027 ? 'y2027' : 'y2026';
    var ayIdx = m.donem.ay - 1;
    switch (ad) {
      case 'kpi':
        return [
          ['Gösterge', 'Değer'],
          ['Rapor dönemi', bu],
          ['Bu ay toplam OPEX', m.ozet.buAy.toplam],
          ['Teknoloji', m.ozet.buAy.teknoloji],
          ['Personel', m.ozet.buAy.insan],
          ['Ofis ve işletme', m.ozet.buAy.ofis],
          ['2026 yıllık OPEX', m.ozet.yil2026.toplam],
          ['2027 aylık ortalama', m.ozet.aylikOrt2027.toplam],
          ['2027 yıllık OPEX', m.ozet.yil2027.toplam],
          ['2027 değişim', m.ozet.degisim],
          ['Uygulanan zam', m.zam.oran],
          ['Zam esası', m.zam.esas],
          ['USD/TRY', m.kur.USD.deger],
          ['EUR/TRY', m.kur.EUR.deger],
          ['Bu ay ödenen', m.ozet.odeme.takip === false ? '—' : m.ozet.odeme.odenen],
          ['Bu ay bekleyen', m.ozet.odeme.takip === false ? '—' : m.ozet.odeme.bekleyen],
          ['Hesaplandı', m.hesaplandi],
          ['Uyarı sayısı', m.uyarilar.length],
        ];
      case 'ozet':
        return [['Küme', bu, '2026 aylık ort.', '2026 yıllık', '2027 aylık ort.', '2027 yıllık', 'Değişim']].concat(
          ['teknoloji', 'insan', 'ofis', 'toplam'].map(function (k) {
            var o26 = m.ozet.aylikOrt2026[k];
            var o27 = m.ozet.aylikOrt2027[k];
            return [k === 'toplam' ? 'Toplam OPEX' : KUME_ADI[k], m.ozet.buAy[k], o26, m.ozet.yil2026[k], o27, m.ozet.yil2027[k], o26 ? o27 / o26 - 1 : 0];
          }),
        );
      case 'kategori':
        return [['Küme', 'Kategori', bu, '2027 aylık ort.', 'Pay']].concat(
          m.kategoriler.map(function (k) {
            return [KUME_ADI[k.kume], k.kategori, k.buAy, k.aylik2027, m.ozet.buAy.toplam ? k.buAy / m.ozet.buAy.toplam : 0];
          }),
        );
      case 'aylik':
        return [['Ay', 'Teknoloji 2026', 'Personel 2026', 'Ofis 2026', 'Toplam 2026', 'Toplam 2027']].concat(
          m.aylik.map(function (a) {
            return [a.kisa, a.y2026.teknoloji, a.y2026.insan, a.y2026.ofis, a.y2026.toplam, a.y2027.toplam];
          }),
        );
      case 'kisi':
        return [['Kişi', 'Tür', 'Ücret esası', 'Tutar (aylık)', bu + ' brüt', bu + ' maliyet', '2026 yıllık maliyet', '2027 tutar', '2027 aylık ort. maliyet', 'Zam']].concat(
          m.kisiler.map(function (k) {
            var s = k[yilAnahtar].aylar[ayIdx];
            return [k.ad, k.tur, k.esas, k.tutar, k.tur === 'Freelancer' ? '' : s.brut, s.maliyet, k.y2026.toplam.maliyet, k.tutar2027, r2(k.y2027.toplam.maliyet / 12), k.zamOrani];
          }),
        );
      case 'bilesen':
        return [['Kişi', 'Net ücret', 'Gelir ve damga vergisi', 'SGK ve işsizlik (işçi)', 'İşveren payı (teşvik sonrası)']].concat(
          m.kisiler.filter(function (k) { return k.tur === 'Bordrolu'; }).map(function (k) {
            var s = k[yilAnahtar].aylar[ayIdx];
            return [k.ad, s.net, r2(s.gv + s.dv), r2(s.sgkIsci + s.issizlikIsci), r2(s.sgkIsveren + s.issizlikIsveren - s.tesvik)];
          }),
        );
      case 'teknoloji': {
        var saglayici = {};
        m.giderler.filter(function (g) { return g.kume === 'teknoloji'; }).forEach(function (g) {
          var key = g.kalem;
          saglayici[key] = saglayici[key] || { kalem: g.kalem, kategori: g.kategori, tl: 0 };
          saglayici[key].tl = r2(saglayici[key].tl + g.aylikTl[yilAnahtar][ayIdx]);
        });
        return [['Sağlayıcı', 'Kategori', bu]].concat(
          Object.keys(saglayici).map(function (k) { return saglayici[k]; }).sort(function (a, b) { return b.tl - a.tl; }).map(function (x) {
            return [x.kalem, x.kategori, x.tl];
          }),
        );
      }
      case 'kopru': {
        var b = m.bordroKopru;
        return [
          ['Adım', 'Tutar'],
          ['Net ücretler', b.net],
          ['Gelir vergisi', b.gv],
          ['Damga vergisi', b.dv],
          ['SGK ve işsizlik (işçi)', r2(b.sgkIsci + b.issizlikIsci)],
          ['Brüt ücretler', b.brut],
          ['SGK ve işsizlik (işveren)', r2(b.sgkIsveren + b.issizlikIsveren)],
          ['Teşvik ve destekler', -b.tesvik],
          ['İşveren maliyeti', b.maliyet],
        ];
      }
      case 'bordro-2026':
      case 'bordro-2027': {
        var y = ad === 'bordro-2027' ? 'y2027' : 'y2026';
        var basliklar = ['Kişi', 'Ay', 'Brüt', 'SGK işçi', 'İşsizlik işçi', 'GV matrahı', 'Kümülatif matrah', 'Gelir vergisi', 'GV istisnası', 'Damga vergisi', 'Net', 'SGK işveren', 'İşsizlik işveren', 'Teşvik', 'İşveren maliyeti'];
        var satirlar = [basliklar];
        m.kisiler.filter(function (k) { return k.tur === 'Bordrolu'; }).forEach(function (k) {
          k[y].aylar.forEach(function (s) {
            satirlar.push([k.ad, AYLAR[s.ay - 1], s.brut, s.sgkIsci, s.issizlikIsci, s.gvMatrahi, s.kumulatifMatrah, s.gv, s.gvIstisna, s.dv, s.net, s.sgkIsveren, s.issizlikIsveren, s.tesvik, s.maliyet]);
          });
          var t = k[y].toplam;
          satirlar.push([k.ad, 'Yıl toplamı', t.brut, t.sgkIsci, t.issizlikIsci, t.gvMatrahi, t.kumulatifMatrah, t.gv, t.gvIstisna, t.dv, t.net, t.sgkIsveren, t.issizlikIsveren, t.tesvik, t.maliyet]);
        });
        return satirlar;
      }
      case 'personel-sutun':
      case 'gider-sutun':
      case 'tesvik-sutun':
        return hizaliSutunlar(m, ad, girdi);
      case 'plan':
        return [['Ay', 'Teknoloji', 'Ofis ve işletme', 'Personel', 'Toplam']].concat(
          m.plan.aylar.map(function (a) { return [a.ad, a.teknoloji, a.ofis, a.insan, a.toplam]; }),
          [[m.plan.aylar.length + ' ay toplamı', m.plan.toplam.teknoloji, m.plan.toplam.ofis, m.plan.toplam.insan, m.plan.toplam.toplam]],
        );
      case 'gider-toplam':
      case 'personel-toplam':
        return altToplam(m, ad, girdi);
      case 'hepsi':
        return hepsiTablosu(m);
      case 'asgari-net-2026':
      case 'asgari-net-2027':
        return [[m.asgari[ad === 'asgari-net-2027' ? 'y2027' : 'y2026'].net]];
      case 'uyari':
        return [['Uyarılar']].concat(m.uyarilar.length ? m.uyarilar.map(function (u) { return [u]; }) : [['Uyarı yok.']]);
      default:
        return [['Bilinmeyen rapor: ' + ad + '. Geçerli: kpi, ozet, kategori, aylik, kisi, bilesen, teknoloji, kopru, plan, bordro-2026, bordro-2027, personel-sutun, gider-sutun, tesvik-sutun, gider-toplam, personel-toplam, hepsi, asgari-net-2026, asgari-net-2027, uyari.']];
    }
  }

  /**
   * Aylık ızgaranın alt toplam satırı (tek satır, ızgara genişliğinde): her “… tutar” sütununa o ayın toplamı.
   * Gider: ₺ (satırın kuru, işaretli ay, özel tutar; sayfadaki toplamlarla aynı). Personel: yazılan tutarların toplamı.
   */
  function altToplam(m, ad, girdi) {
    var personel = ad === 'personel-toplam';
    var izgara = ayIzgarasi(girdi && (personel ? girdi.personelAylari : girdi.giderAylari));
    if (!izgara) return [['']];
    var genislik = 0;
    izgara.rows.forEach(function (r) { genislik = Math.max(genislik, (r || []).length); });
    var satir = [];
    for (var j = 0; j < genislik; j++) satir.push('');
    izgara.sutunlar.forEach(function (c) {
      if (!c.tutar) return;
      var y = 'y' + c.yil;
      var toplam = personel
        ? topla(m.kisiler.map(function (k) { return k.aylikTutar[y][c.ay]; }))
        : topla(m.giderler.map(function (g) { return g.aylikTl[y][c.ay]; }));
      satir[c.j] = r2(toplam);
    });
    return [satir];
  }

  /**
   * Giderler Hepsi sayfası: bütün kalemler gruplara göre (Ofis, Teknoloji, Personel) planın ayları boyunca ₺ (gider:
   * satırın kuruyla, işaretli ay; personel: işveren maliyeti, freelancer fatura), grup ara toplamları ve genel toplam.
   */
  function hepsiTablosu(m) {
    var aylar = [];
    for (var k = (m.donem.yil * 12 + m.donem.ay - 1); k <= 2027 * 12 + 11; k++) aylar.push({ yil: Math.floor(k / 12), ay: k % 12 });
    var bas = ['Grup', 'Kalem', 'Ayrıntı'].concat(aylar.map(function (a) { return KISA_AYLAR[a.ay] + ' ' + a.yil; }), ['Toplam']);
    var satirlar = [bas];
    var genel = aylar.map(function () { return 0; });
    var satirYaz = function (grup, kalem, ayrinti, degerler) {
      satirlar.push([grup, kalem, ayrinti].concat(degerler.map(r2), [r2(topla(degerler))]));
    };
    [
      { kume: 'ofis', ad: 'Ofis' },
      { kume: 'teknoloji', ad: 'Teknoloji' },
      { kume: 'insan', ad: 'Personel' },
    ].forEach(function (grup) {
      var ara = aylar.map(function () { return 0; });
      var ekle = function (kalem, ayrinti, degerler) {
        degerler.forEach(function (v, i) { ara[i] += v; genel[i] += v; });
        satirYaz(grup.ad, kalem, ayrinti, degerler);
      };
      if (grup.kume === 'insan') {
        m.kisiler.forEach(function (kisi) {
          ekle(kisi.ad, kisi.tur === 'Freelancer' ? 'Freelancer · fatura' : kisi.tur + ' · ' + kisi.esas, aylar.map(function (a) { return kisi['y' + a.yil].aylar[a.ay].maliyet; }));
        });
      } else {
        m.giderler.filter(function (g) { return g.kume === grup.kume; }).forEach(function (g) {
          ekle(g.kalem, (g.hesap ? g.hesap + ' · ' : '') + g.para, aylar.map(function (a) { return g.aylikTl['y' + a.yil][a.ay]; }));
        });
      }
      satirYaz(grup.ad, grup.ad + ' toplamı', '', ara);
    });
    satirYaz('Hepsi', 'Hepsi toplamı', '', genel);
    return satirlar;
  }

  /** Girdi sayfasının satırlarıyla hizalı hesap sütunları (aynı satır numarası). */
  function hizaliSutunlar(m, ad, girdi) {
    var kaynakAdi = ad === 'personel-sutun' ? 'personel' : ad === 'gider-sutun' ? 'giderler' : 'tesvikler';
    var ham = girdi && girdi[kaynakAdi] ? girdi[kaynakAdi] : [];
    var satirlar = tabloyuOku(ham, kaynakAdi, []) || [];
    var yilAnahtar = m.donem.yil === 2027 ? 'y2027' : 'y2026';
    var ayIdx = m.donem.ay - 1;
    var baslikSatiri = satirlar.baslikSatiri || 1;
    var cikti = [];
    for (var i = 0; i < baslikSatiri - 1; i++) cikti.push(ad === 'personel-sutun' ? ['', '', '', '', ''] : ad === 'gider-sutun' ? ['', ''] : ['', '', '']);
    if (ad === 'personel-sutun') {
      cikti.push([m.donem.ayAdi + ' brüt', m.donem.ayAdi + ' maliyet', '2026 aylık ort. maliyet', '2027 tutar', '2027 aylık ort. maliyet']);
      var kisiSatir = {};
      m.kisiler.forEach(function (k) { kisiSatir[k.satir] = k; });
      var son = satirlar.length ? satirlar[satirlar.length - 1].satir : baslikSatiri;
      for (var r = baslikSatiri + 1; r <= son; r++) {
        var k = kisiSatir[r] || null;
        if (!k) cikti.push(['', '', '', '', '']);
        else {
          var a = k[yilAnahtar].aylar[ayIdx];
          cikti.push([k.tur === 'Freelancer' ? '' : a.brut, a.maliyet, r2(k.y2026.toplam.maliyet / 12), k.tutar2027, r2(k.y2027.toplam.maliyet / 12)]);
        }
      }
      return cikti;
    }
    if (ad === 'gider-sutun') {
      cikti.push([m.donem.ayAdi + ' ₺', '2027 ort. ₺']);
      var giderSatir = {};
      m.giderler.filter(function (x) { return x.kaynak !== 'ofis'; }).forEach(function (x) { giderSatir[x.satir] = x; });
      var sonG = satirlar.length ? satirlar[satirlar.length - 1].satir : baslikSatiri;
      for (var g = baslikSatiri + 1; g <= sonG; g++) {
        var gider = giderSatir[g] || null;
        cikti.push(gider ? [gider.aylikTl[yilAnahtar][ayIdx], r2(topla(gider.aylikTl.y2027) / 12)] : ['', '']);
      }
      return cikti;
    }
    cikti.push(['Uygulanan kişi', m.donem.ayAdi + ' tutar', '2026 yıllık']);
    var tKod = {};
    m.tesvikler.forEach(function (t) { tKod[t.kod] = t; });
    var sonT = satirlar.length ? satirlar[satirlar.length - 1].satir : baslikSatiri;
    for (var t = baslikSatiri + 1; t <= sonT; t++) {
      var ts = satirlar.filter(function (x) { return x.satir === t; })[0];
      var tv = ts ? tKod[metin(ts.kod)] : null;
      cikti.push(tv ? [tv.uygulananlar.length ? tv.uygulananlar.join(', ') : '—', tv.buAy, tv.yil2026] : ['', '', '']);
    }
    return cikti;
  }

  return {
    SEMA: SEMA,
    SURUM: SURUM,
    AYLAR: AYLAR,
    BASLIKLAR: BASLIKLAR,
    SECENEKLER: SECENEKLER,
    PARAMETRE_TANIMLARI: PARAMETRE_TANIMLARI,
    TESVIK_TANIMLARI: TESVIK_TANIMLARI,
    TESVIK_TURLERI: TESVIK_TURLERI,
    ENFLASYON_KAYNAGI: ENFLASYON_KAYNAGI,
    hesapla: hesapla,
    kumeKodu: kumeKodu,
    rapor: rapor,
    erisimAcik: erisimAcik,
    // Testler için iç işlevler
    _ic: { vergi: vergi, bordroSatiri: bordroSatiri, nettenBrute: nettenBrute, yilAyari: yilAyari, parametreleriOku: parametreleriOku, tesvikleriOku: tesvikleriOku },
  };
})();
