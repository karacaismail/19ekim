/**
 * iStoc OPEX — Google Sheets bağlantısı: özel işlev, menü ve web uygulaması (GitHub Pages veri ucu).
 *
 * Web uygulaması: Dağıt → Yeni dağıtım → Web uygulaması; “Şu kullanıcı olarak çalıştır: Ben”, “Erişimi olanlar: Herkes”.
 * Veri yalnız POST gövdesindeki erişim anahtarıyla döner (anahtar adreste taşınmaz). Anahtar Komut dosyası
 * özelliklerinde (OPEX_ERISIM_ANAHTARI) saklanır, koda ve repoya yazılmaz; OPEX menüsünden gösterilir/yenilenir.
 */

var OPEX_SAYFA = {
  pano: 'Pano',
  giderler: 'Düzenli Giderler',
  personel: 'Personel Giderleri',
  parametreler: 'Parametreler',
  tesvikler: 'Teşvikler',
  bordro: 'Bordro',
  hesap: 'Hesap',
};
/** Kullanıcı sayfaları yeniden adlandırdı (2026-10-20); eski adla duran tablo da okunur ve kurulumda yeni ada taşınır. */
var OPEX_ESKI_AD = { giderler: 'Giderler', personel: 'Personel' };

/**
 * Aylık ızgara: ilk sütun (Düzenli Giderler I — A:G girdi, H boşluk; Personel Giderleri Q — A:I girdi, K:O hesap);
 * 15 aylık plan (Ekim 2026 → Aralık 2027), her ay yan yana onay kutusu + tutar (30 sütun).
 */
var OPEX_IZGARA = { giderler: 9, personel: 17, genislik: 30 };
/** Girdi sütun sayısı (A’dan): Düzenli Giderler A:G, Personel Giderleri A:I. */
var OPEX_GIRDI_SUTUN = { giderler: 7, personel: 9 };

/** Sayfa: yeni adıyla, yoksa eski adıyla. */
function opexSayfasi_(ss, anahtar) {
  return ss.getSheetByName(OPEX_SAYFA[anahtar]) || (OPEX_ESKI_AD[anahtar] ? ss.getSheetByName(OPEX_ESKI_AD[anahtar]) : null);
}
var OPEX_ANAHTAR_OZELLIGI = 'OPEX_ERISIM_ANAHTARI';
var OPEX_DEGISIM_OZELLIGI = 'OPEX_SON_DEGISIM';

/**
 * OPEX raporu (tablo) üretir. Girdi aralıkları argüman olarak verilir; biri değişince rapor yeniden hesaplanır.
 *
 * @param {string} rapor kpi, ozet, kategori, aylik, kisi, bilesen, teknoloji, kopru, plan, bordro-2026, bordro-2027,
 *   personel-sutun, gider-sutun, tesvik-sutun, gider-toplam, personel-toplam, asgari-net-2026, asgari-net-2027, uyari
 * @param {A1:F200} parametreler Parametreler!A:F
 * @param {A1:I200} personel 'Personel Giderleri'!A:I
 * @param {A1:G400} giderler 'Düzenli Giderler'!A:G
 * @param {A1:I100} tesvikler 'Teşvikler'!A:I
 * @param {I1:AL400} giderAylari Düzenli Giderler aylık ızgarası (ay ay etkin / tutar)
 * @param {Q1:AT200} personelAylari Personel aylık ızgarası (ay ay etkin / tutar)
 * @return Tablo (ilk satır başlık)
 * @customfunction
 */
function OPEX(rapor, parametreler, personel, giderler, tesvikler, giderAylari, personelAylari) {
  var girdi = { parametreler: parametreler, personel: personel, giderler: giderler, tesvikler: tesvikler, giderAylari: giderAylari, personelAylari: personelAylari };
  var model = OpexMotor.hesapla(girdi, { simdi: new Date() });
  return OpexMotor.rapor(model, String(rapor || ''), girdi);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('OPEX')
    .addItem('Kurulum / onarım', 'kurulum')
    .addItem('Panoyu yeniden çiz', 'panoyuCiz')
    .addSeparator()
    .addItem('Web bağlantısı bilgisi', 'baglantiBilgisi')
    .addItem('Yeni erişim anahtarı üret', 'anahtariYenile')
    .addToUi();
}

/* ---------- Web uygulaması ---------- */

/** Sağlık denetimi: veri döndürmez. */
function doGet() {
  return json_({ ok: true, hizmet: 'istoc-opex', sema: OpexMotor.SEMA, surum: OpexMotor.SURUM, mesaj: 'Veri için POST gövdesinde {"anahtar":"…"} gönderin.' });
}

/**
 * Veri ucu. Gövde (text/plain JSON): {"anahtar": "...", "ozet": "<son özet>"}; erişim “Herkese açık” ise anahtar gerekmez.
 * Girdi değişmediyse yalnız {degismedi: true} döner; değiştiyse tüm model.
 */
function doPost(e) {
  var istek;
  try {
    istek = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (hata) {
    return json_({ ok: false, hata: 'istek', mesaj: 'İstek gövdesi JSON değil.' });
  }
  if (!istek || typeof istek !== 'object' || Array.isArray(istek)) return json_({ ok: false, hata: 'istek', mesaj: 'İstek gövdesi nesne olmalı.' });
  var girdi = girdileriOku_();
  // Parametreler → “Sayfa erişimi”: Herkese açık ise anahtar istenmez (kullanıcı kararı); değilse anahtar zorunlu.
  if (!OpexMotor.erisimAcik(girdi.parametreler)) {
    var gercek = PropertiesService.getScriptProperties().getProperty(OPEX_ANAHTAR_OZELLIGI);
    if (!gercek) return json_({ ok: false, hata: 'kurulum', mesaj: 'Erişim anahtarı tanımlı değil; Sheets’te OPEX → Kurulum / onarım çalıştırın.' });
    // Bekleme yok: anahtar ≈ 244 bit rastgeledir; bekleme yalnız eşzamanlı çalışma kotasını tüketirdi.
    if (typeof istek.anahtar !== 'string' || !sabitZamanliEsit_(istek.anahtar, gercek)) {
      return json_({ ok: false, hata: 'yetki', mesaj: 'Bu veri ucu erişim anahtarı istiyor ya da anahtar geçersiz.' });
    }
  }
  var ozet = ozetAl_(girdi);
  var degisti = degisimiKaydet_(ozet);
  var simdi = new Date();
  var temel = { ok: true, sema: OpexMotor.SEMA, ozet: ozet, denetlendi: simdi.toISOString(), degisti: degisti };
  if (istek.ozet && istek.ozet === ozet) {
    temel.degismedi = true;
    return json_(temel);
  }
  temel.tablo = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  temel.model = OpexMotor.hesapla(girdi, { simdi: simdi });
  return json_(temel);
}

function json_(nesne) {
  return ContentService.createTextOutput(JSON.stringify(nesne)).setMimeType(ContentService.MimeType.JSON);
}

function sabitZamanliEsit_(a, b) {
  if (a.length !== b.length) return false;
  var fark = 0;
  for (var i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return fark === 0;
}

/** Girdi sayfalarının ham değerleri (motorun beklediği biçim). */
function girdileriOku_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var oku = function (sh, sutun) {
    if (!sh) return [];
    var son = Math.max(sh.getLastRow(), 1);
    return sh.getRange(1, 1, son, sutun || Math.max(sh.getLastColumn(), 1)).getValues();
  };
  // Giderler ve personel tüm sayfa okunur: motor sütunları başlık adıyla, ızgarayı ay başlıklarıyla bulur
  // (sütun silinse veya yer değişse de doğru okunur).
  var gider = oku(opexSayfasi_(ss, 'giderler'));
  var personel = oku(opexSayfasi_(ss, 'personel'));
  return {
    parametreler: oku(ss.getSheetByName(OPEX_SAYFA.parametreler), 6),
    personel: personel,
    giderler: gider,
    tesvikler: oku(ss.getSheetByName(OPEX_SAYFA.tesvikler), 9),
    giderAylari: gider,
    personelAylari: personel,
  };
}

/** Girdi ve motor sürümünün SHA-256 özeti (sayfa yalnız değişince tüm modeli ister). */
function ozetAl_(girdi) {
  var bayt = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, OpexMotor.SURUM + JSON.stringify(girdi), Utilities.Charset.UTF_8);
  return bayt.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('').slice(0, 24);
}

/** Özet değiştiyse zamanı saklar; Sheets’teki son değişikliğin ilk görüldüğü an döner. */
function degisimiKaydet_(ozet) {
  var props = PropertiesService.getScriptProperties();
  var kayit = {};
  try {
    kayit = JSON.parse(props.getProperty(OPEX_DEGISIM_OZELLIGI) || '{}');
  } catch (hata) {
    kayit = {};
  }
  if (kayit.ozet !== ozet) {
    kayit = { ozet: ozet, zaman: new Date().toISOString() };
    props.setProperty(OPEX_DEGISIM_OZELLIGI, JSON.stringify(kayit));
  }
  return kayit.zaman;
}

/* ---------- Erişim anahtarı ---------- */

function anahtarUret_() {
  // İki UUID v4 (her biri 122 bit rastgele) birlikte kullanılır.
  return 'opex_' + Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function anahtariSagla_() {
  var props = PropertiesService.getScriptProperties();
  var mevcut = props.getProperty(OPEX_ANAHTAR_OZELLIGI);
  if (mevcut) return mevcut;
  var yeni = anahtarUret_();
  props.setProperty(OPEX_ANAHTAR_OZELLIGI, yeni);
  return yeni;
}

function baglantiBilgisi() {
  var anahtar = anahtariSagla_();
  var url = '';
  try {
    url = ScriptApp.getService().getUrl() || '';
  } catch (hata) {
    url = '';
  }
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Roboto,Arial,sans-serif;font-size:15px;line-height:1.5">' +
      '<p><b>Erişim anahtarı</b> (yalnız güvendiğiniz kişilerle paylaşın):</p>' +
      '<p><code style="font-size:15px;user-select:all">' + anahtar + '</code></p>' +
      '<p><b>Web uygulaması adresi</b>: ' + (url ? '<code style="font-size:15px;user-select:all">' + url + '</code>' : 'henüz dağıtılmadı — Dağıt → Yeni dağıtım → Web uygulaması (Ben olarak çalıştır, Erişim: Herkes).') + '</p>' +
      '<p>Sayfada (karacaismail.github.io/19ekim/giderler/) “Bağlantı” alanına adresi ve anahtarı girin.</p>' +
      '</div>',
  )
    .setWidth(560)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'OPEX web bağlantısı');
}


function anahtariYenile() {
  var ui = SpreadsheetApp.getUi();
  var cevap = ui.alert('Yeni erişim anahtarı', 'Eski anahtar geçersiz olur; sayfayı açan herkes yeni anahtarı girmelidir. Devam edilsin mi?', ui.ButtonSet.YES_NO);
  if (cevap !== ui.Button.YES) return;
  PropertiesService.getScriptProperties().setProperty(OPEX_ANAHTAR_OZELLIGI, anahtarUret_());
  baglantiBilgisi();
}
