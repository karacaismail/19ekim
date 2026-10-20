/**
 * Türksab OPEX — Google Sheets bağlantısı: hesap yazımı, menü ve web uygulaması (GitHub Pages veri ucu).
 *
 * Hesaplar Sheets’e düz değer olarak yazılır (özel işlev yok): bir girdi hücresi değişince basit onEdit tetikleyicisi
 * modeli bir kez hesaplar ve yalnız içeriği değişen tabloları yazar; hücre “Yükleniyor…” olmaz, eski değer yenisi
 * gelene kadar görünür. Döviz kuru Parametreler’de canlı GOOGLEFINANCE formülüdür; kur değişince (onEdit tetiklenmez)
 * hesaplar Sheets açılınca ya da sayfa veri istediğinde güncellenir. Zamanlanmış görev kurulmaz.
 *
 * Web uygulaması: Dağıt → Yeni dağıtım → Web uygulaması; “Şu kullanıcı olarak çalıştır: Ben”, “Erişimi olanlar: Herkes”.
 * Veri yalnız POST gövdesindeki erişim anahtarıyla döner (anahtar adreste taşınmaz). Anahtar Komut dosyası
 * özelliklerinde (OPEX_ERISIM_ANAHTARI) saklanır, koda ve repoya yazılmaz; OPEX menüsünden gösterilir/yenilenir.
 */

var OPEX_SAYFA = {
  pano: 'Pano',
  // Kullanıcı kararı 2026-10-20: [Giderler Hepsi, Giderler OFİS, Giderler TEKNOLOJİ, Giderler PERSONEL].
  hepsi: 'Giderler Hepsi',
  ofis: 'Giderler OFİS',
  teknoloji: 'Giderler TEKNOLOJİ',
  personel: 'Giderler PERSONEL',
  parametreler: 'Parametreler',
  tesvikler: 'Teşvikler',
  bordro: 'Bordro',
  hesap: 'Hesap',
};
/**
 * Eski adlar (yeniden adlandırmalar, 2026-10-20): eski adla duran tablo da okunur; kurulum yeni ada taşır. Ayrılmamış
 * “Düzenli Giderler” (teknoloji + ofis birlikte) teknoloji kaynağı olarak okunur, kurulum onu iki sayfaya ayırır.
 */
var OPEX_ESKI_AD = { teknoloji: ['Düzenli Giderler', 'Giderler'], personel: ['Personel Giderleri', 'Personel'] };

/**
 * Aylık ızgara: ilk sütun (gider sayfaları I — A:G girdi, H boşluk; Giderler PERSONEL Q — A:I girdi, K:O hesap);
 * 15 aylık plan (Ekim 2026 → Aralık 2027), her ay yan yana onay kutusu + tutar (30 sütun).
 */
var OPEX_IZGARA = { teknoloji: 9, ofis: 9, personel: 17, genislik: 30 };
/** Girdi sütun sayısı (A’dan): gider sayfaları A:G, Giderler PERSONEL A:I. */
var OPEX_GIRDI_SUTUN = { teknoloji: 7, ofis: 7, personel: 9 };
/** Gider girdi sayfaları (motorda birinci ve ikinci gider kaynağı). */
var OPEX_GIDER_SAYFALARI = ['teknoloji', 'ofis'];

/** Sayfa: yeni adıyla, yoksa eski adlarından biriyle. */
function opexSayfasi_(ss, anahtar) {
  var sh = ss.getSheetByName(OPEX_SAYFA[anahtar]);
  (OPEX_ESKI_AD[anahtar] || []).forEach(function (ad) { sh = sh || ss.getSheetByName(ad); });
  return sh;
}
var OPEX_ANAHTAR_OZELLIGI = 'OPEX_ERISIM_ANAHTARI';
var OPEX_DEGISIM_OZELLIGI = 'OPEX_SON_DEGISIM';
/** Sheets’e son yazılan hesapların anahtarı (girdi özeti + ay) ve blok izleri. */
var OPEX_YAZIM_OZELLIGI = 'OPEX_YAZIM';
/** Önbellekte son girdi özeti: hesap yazımı günceller, bekleyen web isteği izler. */
var OPEX_OZET_ONBELLEK = 'opex_ozet';
/** Web isteği Sheets değişikliğini en çok bu kadar bekler; sayfa yanıt gelince hemen yeniden sorar. */
var OPEX_BEKLEME_MS = 20000;
var OPEX_BEKLEME_ADIM_MS = 400;
/** Aylık ızgaranın ilk başlığı (yeni yerleşim): Toplam satırı yalnız bu yerleşimde yazılır. */
var OPEX_IZGARA_ILK = 'Eki 2026';
/** Girdi sayfasındaki hesap sütunları (1’den): okunurken girdi sayılmaz. */
var OPEX_HESAP_SUTUNLARI = { personel: [11, 15], tesvikler: [11, 13] };

/** Hesap sayfası blokları: rapor, başlangıç sütunu, sütun sayısı. Yan yana durur; satır sayısı değişse de çakışmaz. */
var OPEX_BLOKLAR = [
  { rapor: 'kpi', sutun: 1, genislik: 2 },
  { rapor: 'ozet', sutun: 4, genislik: 7 },
  { rapor: 'kategori', sutun: 12, genislik: 5 },
  { rapor: 'aylik', sutun: 18, genislik: 6 },
  { rapor: 'kisi', sutun: 25, genislik: 10 },
  { rapor: 'bilesen', sutun: 36, genislik: 5 },
  { rapor: 'teknoloji', sutun: 42, genislik: 3 },
  { rapor: 'kopru', sutun: 46, genislik: 2 },
  { rapor: 'uyari', sutun: 49, genislik: 1 },
  { rapor: 'plan', sutun: 51, genislik: 5 },
];

function opexSimdi_() {
  return Date.now();
}

function toplamSatiriMi_(v) {
  return String(v).trim().toLocaleLowerCase('tr-TR').indexOf('toplam') === 0;
}

/**
 * Eski formüller için özel işlev (kurulum artık kullanmaz; hesaplar düz değer yazılır). Girdi aralıkları argümandır.
 *
 * @param {string} rapor kpi, ozet, kategori, aylik, kisi, bilesen, teknoloji, kopru, plan, bordro-2026, bordro-2027,
 *   personel-sutun, gider-sutun, tesvik-sutun, gider-toplam, personel-toplam, asgari-net-2026, asgari-net-2027, uyari
 * @param {A1:F200} parametreler Parametreler!A:F
 * @param {A1:I200} personel 'Giderler PERSONEL'!A:I
 * @param {A1:G400} giderler 'Giderler TEKNOLOJİ'!A:G
 * @param {A1:I100} tesvikler 'Teşvikler'!A:I
 * @param {I1:AL400} giderAylari Giderler TEKNOLOJİ aylık ızgarası (ay ay etkin / tutar)
 * @param {Q1:AT200} personelAylari Giderler PERSONEL aylık ızgarası (ay ay etkin / tutar)
 * @param {A1:G400} giderler2 'Giderler OFİS'!A:G
 * @param {I1:AL400} giderAylari2 Giderler OFİS aylık ızgarası
 * @return Tablo (ilk satır başlık)
 * @customfunction
 */
function OPEX(rapor, parametreler, personel, giderler, tesvikler, giderAylari, personelAylari, giderler2, giderAylari2) {
  var girdi = {
    parametreler: parametreler, personel: personel, giderler: giderler, tesvikler: tesvikler, giderAylari: giderAylari,
    personelAylari: personelAylari, giderler2: giderler2, giderAylari2: giderAylari2,
  };
  var model = OpexMotor.hesapla(girdi, { simdi: new Date() });
  return OpexMotor.rapor(model, String(rapor || ''), girdi);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('OPEX')
    .addItem('Kurulum / onarım', 'kurulum')
    .addItem('Hesapları yenile', 'hesaplariYenile')
    .addItem('Panoyu yeniden çiz', 'panoyuCiz')
    .addSeparator()
    .addItem('Web bağlantısı bilgisi', 'baglantiBilgisi')
    .addItem('Yeni erişim anahtarı üret', 'anahtariYenile')
    .addToUi();
  // Açılışta kur (GOOGLEFINANCE) ya da ay değiştiyse hesaplar yazılır; güncelse yalnız okunur. Meşgulse beklenmez.
  try {
    hesaplariYaz_({ bekleme: 0 });
  } catch (hata) {
    console.log('onOpen: ' + hata);
  }
}

/* ---------- Hesap yazımı (özel işlev yok) ---------- */

function onbellek_() {
  try {
    return CacheService.getScriptCache();
  } catch (hata) {
    return null;
  }
}

/** Son girdi özetini önbelleğe yazar: bekleyen web istekleri değişikliği hemen görür. */
function ozetDuyur_(ozet) {
  var c = onbellek_();
  if (!c) return;
  try {
    c.put(OPEX_OZET_ONBELLEK, ozet, 21600);
  } catch (hata) {
    console.log('önbellek: ' + hata);
  }
}

/** Betik kilidi: alınırsa kilit, meşgulse false; kilit hizmeti yoksa null (kilitsiz sürer). */
function kilitAl_(ms) {
  var kilit;
  try {
    kilit = LockService.getScriptLock();
  } catch (hata) {
    return null;
  }
  return kilit.tryLock(ms) ? kilit : false;
}

/** Yazım anahtarı: girdi özeti + rapor ayı (ay dönünce “bu ay” değerleri yeniden yazılır). */
function yazimAnahtari_(ozet, simdi) {
  return ozet + '|' + simdi.getFullYear() + '-' + (simdi.getMonth() + 1);
}

function yazimKaydi_() {
  try {
    return JSON.parse(PropertiesService.getScriptProperties().getProperty(OPEX_YAZIM_OZELLIGI) || '{}') || {};
  } catch (hata) {
    return {};
  }
}

/** Hücre değeri: metin kesme işaretiyle yazılır (tarih/sayı/formül sanılmasın, ör. “Eki 2026”); sayı olduğu gibi. */
function hucreDegeri_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return isFinite(v) ? v : '';
  if (typeof v === 'string') return v === '' ? '' : "'" + v;
  return v;
}

function blokDegerleri_(tablo, genislik) {
  return (tablo || []).map(function (r) {
    var satir = [];
    for (var j = 0; j < genislik; j++) satir.push(hucreDegeri_(r ? r[j] : ''));
    return satir;
  });
}

/**
 * Yazılacak bloklar: Giderler Hepsi, Bordro, Hesap sayfası blokları, Giderler PERSONEL ve Teşvikler hesap sütunları,
 * her girdi sayfasının “Toplam (₺)” satırı (yalnız o sayfanın kalemleri). Değerler istenince üretilir.
 */
function hesapBloklari_(ss, girdi, model) {
  var rapor = function (ad) {
    return function () { return OpexMotor.rapor(model, ad, girdi); };
  };
  var bloklar = [];
  var ekle = function (ad, sh, satir, sutun, genislik, uret, tekSatir) {
    if (sh) bloklar.push({ ad: ad, sh: sh, satir: satir, sutun: sutun, genislik: genislik, uret: uret, tekSatir: !!tekSatir });
  };
  ekle('hepsi', ss.getSheetByName(OPEX_SAYFA.hepsi), 3, 1, 28, rapor('hepsi'));
  var bordro = ss.getSheetByName(OPEX_SAYFA.bordro);
  ekle('bordro-2026', bordro, 4, 1, 15, rapor('bordro-2026'));
  ekle('bordro-2027', bordro, 4, 17, 15, rapor('bordro-2027'));
  var hesap = ss.getSheetByName(OPEX_SAYFA.hesap);
  OPEX_BLOKLAR.forEach(function (b) { ekle('hesap-' + b.rapor, hesap, 1, b.sutun, b.genislik, rapor(b.rapor)); });
  var hs = OPEX_HESAP_SUTUNLARI;
  ekle('personel-sutun', opexSayfasi_(ss, 'personel'), 1, hs.personel[0], hs.personel[1] - hs.personel[0] + 1, rapor('personel-sutun'));
  ekle('tesvik-sutun', ss.getSheetByName(OPEX_SAYFA.tesvikler), 1, hs.tesvikler[0], hs.tesvikler[1] - hs.tesvikler[0] + 1, rapor('tesvik-sutun'));
  [['personel', girdi.personel], ['teknoloji', girdi.giderler], ['ofis', girdi.giderler2]].forEach(function (x) {
    var k = x[0];
    var rows = x[1] || [];
    var ilk = OPEX_IZGARA[k];
    if (String((rows[2] || [])[ilk - 1]) !== OPEX_IZGARA_ILK) return;
    var satir = 0;
    rows.forEach(function (r, i) { if (i >= 3 && toplamSatiriMi_(r[0])) satir = i + 1; });
    if (!satir) return;
    ekle('toplam-' + k, opexSayfasi_(ss, k), satir, ilk, OPEX_IZGARA.genislik, function () {
      return [OpexMotor.kaynakToplami(model, k, rows).slice(ilk - 1, ilk - 1 + OPEX_IZGARA.genislik)];
    }, true);
  });
  return bloklar;
}

/**
 * Bloğu yazar; blok kısaldıysa altındaki eski satırlar (yalnız bloğun sütunları) temizlenir. `son`: sayfanın yazımdan
 * önceki son dolu satırı (okumalar yazımlardan önce yapılır: araya okuma girmeyince Sheets yazımları toplu gönderir).
 */
function blokYaz_(b, degerler, son) {
  if (degerler.length) b.sh.getRange(b.satir, b.sutun, degerler.length, b.genislik).setValues(degerler);
  if (b.tekSatir) return;
  var bas = b.satir + degerler.length;
  if (son >= bas) b.sh.getRange(bas, b.sutun, son - bas + 1, b.genislik).clearContent();
}

/**
 * Hesapları Sheets’e düz değer olarak yazar. Girdi değişmediyse (aynı özet ve ay) yazmaz; değiştiyse yalnız içeriği
 * değişen blokları yazar. Aynı anda tek yazım (betik kilidi); girdi kilit alındıktan sonra okunur, son düzenleme kazanır.
 * Seçenek: zorla (tüm bloklar), bekleme (kilit için ms; 0 = meşgulse atla), kilitli (çağıran kilidi tutuyor).
 */
function hesaplariYaz_(secenek) {
  var s = secenek || {};
  var sure = { bas: opexSimdi_() };
  var gecen = function (ad) { sure[ad] = opexSimdi_() - sure.bas; };
  var kilit = s.kilitli ? null : kilitAl_(s.bekleme === undefined ? 20000 : s.bekleme);
  if (kilit === false) return { durum: 'mesgul', yazilan: [] };
  try {
    gecen('kilit');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var simdi = new Date();
    var girdi = girdileriOku_();
    var ozet = ozetAl_(girdi);
    ozetDuyur_(ozet);
    gecen('oku');
    var anahtar = yazimAnahtari_(ozet, simdi);
    var kayit = yazimKaydi_();
    if (!s.zorla && kayit.anahtar === anahtar) return { durum: 'guncel', yazilan: [] };
    var model = OpexMotor.hesapla(girdi, { simdi: simdi });
    var izler = s.zorla ? {} : kayit.izler || {};
    // Önce değişen bloklar ve sayfaların son satırı (okumalar), sonra yalnız yazımlar.
    var degisen = [];
    hesapBloklari_(ss, girdi, model).forEach(function (b) {
      var degerler = blokDegerleri_(b.uret(), b.genislik);
      // Konum da ize girer: satır eklenip Toplam satırı kayınca aynı değerler yeni yerine yazılır.
      var iz = ozetMetni_(b.satir + ':' + b.sutun + ':' + JSON.stringify(degerler), 16);
      if (izler[b.ad] !== iz) degisen.push({ b: b, degerler: degerler, iz: iz });
    });
    gecen('hesap');
    var sonSatir = {};
    degisen.forEach(function (x) {
      var ad = x.b.sh.getName();
      if (!x.b.tekSatir && !Object.prototype.hasOwnProperty.call(sonSatir, ad)) sonSatir[ad] = x.b.sh.getLastRow();
    });
    degisen.forEach(function (x) {
      blokYaz_(x.b, x.degerler, sonSatir[x.b.sh.getName()] || 0);
      izler[x.b.ad] = x.iz;
    });
    SpreadsheetApp.flush();
    gecen('yaz');
    PropertiesService.getScriptProperties().setProperty(OPEX_YAZIM_OZELLIGI, JSON.stringify({ anahtar: anahtar, izler: izler, zaman: simdi.toISOString() }));
    degisimiKaydet_(ozet);
    var yazilan = degisen.map(function (x) { return x.b.ad; });
    gecen('son');
    console.log('hesap yazımı ' + JSON.stringify({ ms: sure, bloklar: yazilan }));
    return { durum: 'yazildi', yazilan: yazilan };
  } finally {
    if (kilit) kilit.releaseLock();
  }
}

/** Düzenleme tetikleyicisi (onEdit): girdi sayfasında hesaplar yazılır; hesaplanan sayfada elle değişiklik geri alınır. */
function hesaplariTetikle_(e) {
  var r = e && e.range;
  if (!r) return null;
  var ad = r.getSheet().getName();
  var girdiler = [OPEX_SAYFA.parametreler, OPEX_SAYFA.tesvikler, OPEX_SAYFA.personel, OPEX_SAYFA.ofis, OPEX_SAYFA.teknoloji].concat(OPEX_ESKI_AD.teknoloji, OPEX_ESKI_AD.personel);
  if (girdiler.indexOf(ad) >= 0) return hesaplariYaz_({});
  if ([OPEX_SAYFA.hepsi, OPEX_SAYFA.bordro, OPEX_SAYFA.hesap].indexOf(ad) >= 0) return hesaplariYaz_({ zorla: true });
  return null;
}

/** OPEX menüsü → Hesapları yenile: tüm hesap tabloları yeniden yazılır. */
function hesaplariYenile() {
  var sonuc = hesaplariYaz_({ zorla: true });
  var mesaj = sonuc.durum === 'mesgul' ? 'Başka bir hesap yazımı sürüyor; birkaç saniye sonra yeniden deneyin.' : 'Hesaplar yenilendi (' + sonuc.yazilan.length + ' tablo).';
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(mesaj, 'OPEX', 5);
  } catch (hata) {
    console.log(mesaj);
  }
}

/**
 * Bekleyen web isteği: önbellekteki özet değişene (düzenleme hesapları yazınca) ya da OPEX_BEKLEME_MS dolana kadar
 * bekler. Önbellek yoksa beklemez.
 */
function degisimiBekle_(ozet) {
  var c = onbellek_();
  if (!c) return { bekledi: false, degisti: false };
  var bas = opexSimdi_();
  do {
    var son = c.get(OPEX_OZET_ONBELLEK);
    if (son && son !== ozet) return { bekledi: true, degisti: true };
    Utilities.sleep(OPEX_BEKLEME_ADIM_MS);
  } while (opexSimdi_() - bas < OPEX_BEKLEME_MS);
  return { bekledi: true, degisti: false };
}

/* ---------- Web uygulaması ---------- */

/** Sağlık denetimi: veri döndürmez. */
function doGet() {
  return json_({ ok: true, hizmet: 'istoc-opex', sema: OpexMotor.SEMA, surum: OpexMotor.SURUM, mesaj: 'Veri için POST gövdesinde {"anahtar":"…"} gönderin.' });
}

/**
 * Veri ucu. Gövde (text/plain JSON): {"anahtar": "...", "ozet": "<son özet>", "bekle": true}; erişim “Herkese açık” ise
 * anahtar gerekmez. Girdi değişmediyse yalnız {degismedi: true} döner; değiştiyse tüm model. `bekle` ile özet aynıysa
 * yanıt Sheets değişene (düzenleme hesapları yazınca) ya da ≈20 sn dolana kadar bekletilir (uzun yoklama; yanıt
 * `bekledi: true` taşır). Sheets hesapları güncel değilse (ör. kur değişti) burada yazılır.
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
  var simdi = new Date();
  // Kur (GOOGLEFINANCE) değişince onEdit tetiklenmez: Sheets hesapları burada yazılır (girdi kilitle yeniden okunur;
  // başka yazım sürüyorsa beklenmez).
  if (yazimKaydi_().anahtar !== yazimAnahtari_(ozet, simdi)) {
    try {
      hesaplariYaz_({ bekleme: 0 });
    } catch (hata) {
      console.log('doPost hesap yazımı: ' + hata);
    }
  }
  var bekledi = false;
  if (istek.bekle === true && istek.ozet && istek.ozet === ozet) {
    var b = degisimiBekle_(ozet);
    bekledi = b.bekledi;
    if (b.degisti) {
      girdi = girdileriOku_();
      ozet = ozetAl_(girdi);
      simdi = new Date();
    }
  }
  var degisti = degisimiKaydet_(ozet);
  var temel = { ok: true, sema: OpexMotor.SEMA, ozet: ozet, denetlendi: new Date().toISOString(), degisti: degisti, bekledi: bekledi };
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

/**
 * Kodun yazdığı hücreler girdi sayılmaz: “Toplam…” satırında yalnız ad kalır, hesap sütunları (`sutunlar`, 1’den) boş
 * okunur. Böylece hesap yazımı girdi özetini değiştirmez (sayfa boşuna yeniden istemez, yazım kendini tetiklemez).
 */
function hesapAlanlariniAyikla_(rows, sutunlar) {
  return rows.map(function (r) {
    if (toplamSatiriMi_(r[0])) return r.map(function (v, j) { return j === 0 ? v : ''; });
    if (!sutunlar) return r;
    return r.map(function (v, j) { return j >= sutunlar[0] - 1 && j <= sutunlar[1] - 1 ? '' : v; });
  });
}

/** Girdi sayfalarının ham değerleri (motorun beklediği biçim). */
function girdileriOku_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Sayfa başına tek okuma (dolu alan): her Sheets çağrısı bir gidiş-dönüştür.
  var oku = function (sh, sutun) {
    if (!sh) return [];
    var v = sh.getDataRange().getValues();
    return sutun ? v.map(function (r) { return r.slice(0, sutun); }) : v;
  };
  // Giderler ve personel tüm sayfa okunur: motor sütunları başlık adıyla, ızgarayı ay başlıklarıyla bulur
  // (sütun silinse veya yer değişse de doğru okunur).
  var tekSayfa = opexSayfasi_(ss, 'teknoloji');
  var teknoloji = hesapAlanlariniAyikla_(oku(tekSayfa));
  // Ayırma bitmeden (teknoloji hâlâ eski adlı birleşik sayfa) OFİS okunmaz: ofis satırları iki kez sayılmasın.
  var ayrildi = !(tekSayfa && tekSayfa.getName() !== OPEX_SAYFA.teknoloji);
  var ofis = ayrildi ? hesapAlanlariniAyikla_(oku(ss.getSheetByName(OPEX_SAYFA.ofis))) : undefined;
  var personel = hesapAlanlariniAyikla_(oku(opexSayfasi_(ss, 'personel')), OPEX_HESAP_SUTUNLARI.personel);
  return {
    parametreler: oku(ss.getSheetByName(OPEX_SAYFA.parametreler), 6),
    personel: personel,
    giderler: teknoloji,
    tesvikler: oku(ss.getSheetByName(OPEX_SAYFA.tesvikler), 9),
    giderAylari: teknoloji,
    personelAylari: personel,
    giderler2: ofis,
    giderAylari2: ofis,
  };
}

/** Girdi ve motor sürümünün SHA-256 özeti (sayfa yalnız değişince tüm modeli ister). */
function ozetAl_(girdi) {
  // Sondaki boş hücre ve satırlar özete girmez: sayfanın dolu alanı genişleyince (ör. hesap sütunu yazıldı) özet aynı.
  var sade = {};
  Object.keys(girdi).forEach(function (k) {
    var t = girdi[k];
    if (!Array.isArray(t)) {
      sade[k] = t;
      return;
    }
    var satirlar = t.map(function (r) {
      var n = r.length;
      while (n && r[n - 1] === '') n--;
      return r.slice(0, n);
    });
    while (satirlar.length && !satirlar[satirlar.length - 1].length) satirlar.pop();
    sade[k] = satirlar;
  });
  return ozetMetni_(OpexMotor.SURUM + JSON.stringify(sade), 24);
}

/** Metnin SHA-256 özeti, ilk `n` onaltılık hane. */
function ozetMetni_(metin, n) {
  var bayt = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, metin, Utilities.Charset.UTF_8);
  return bayt.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('').slice(0, n);
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
