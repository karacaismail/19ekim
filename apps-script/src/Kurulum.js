/**
 * Türksab OPEX — Google Sheets kurulumu ve onarımı (OPEX menüsü → Kurulum / onarım).
 *
 * Tekrar çalıştırılabilir: girdi sayfalarındaki veriye dokunmaz; eksik sayfa, başlık, parametre, biçim, açılır liste,
 * adlandırılmış aralık, hesap formülü ve pano grafiklerini tamamlar. Boş Personel/Giderler sayfası yalnız
 * `OPEX_TOHUM` tanımlıysa (repo dışındaki Tohum.js) doldurulur.
 *
 * Görsel kimlik: mürekkep + turuncu; grafik renkleri sayfadaki ECharts paletiyle aynı (mavi, turuncu, aqua, sarı).
 */

var OPEX_STIL = {
  font: 'Roboto',
  boyut: 12,
  murekkep: '#16181a',
  ikincil: '#555a5f',
  zemin: '#f7f6f2',
  yuzey: '#ffffff',
  cizgi: '#e2dfd7',
  hesap: '#f1efe9',
  vurgu: '#ff8600',
  vurguYuzey: '#fff3e3',
  uyari: '#fde8e8',
  // Formül (veya kod) sonucu olan hücrelerin yazı rengi (kullanıcı kararı 2026-10-20: Sheets “mavi” #0000ff).
  formul: '#0000ff',
  seri: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
};
/** Gider tutarı satırın para birimiyle görünür (kullanıcı kararı 2026-10-20). */
var OPEX_PARA_BICIMI = { USD: '[$$]#,##0.00', EUR: '[$€]#,##0.00', TRY: '#,##0.00 "₺"' };
var OPEX_BICIM = {
  tl: '#,##0.00 "₺"',
  tlYuvarlak: '#,##0 "₺"',
  kur: '#,##0.0000 "₺"',
  oran: '0.00%',
  binde: '0.000%',
  sayi: '#,##0.##',
  tamsayi: '0',
};

/** Kurulum adımları (sırayla). Her adım tek başına tekrar çalıştırılabilir. */
var OPEX_KURULUM_ADIMLARI = [
  ['sayfalar', function (ss) {
    // Eski adla duran personel sayfası yeni ada taşınır; Düzenli Giderler Küme’ye göre iki gider sayfasına ayrılır
    // (gizli eski sütunlar ayırmadan önce kaldırılır).
    var eskiPersonel = opexSayfasi_(ss, 'personel');
    if (eskiPersonel && eskiPersonel.getName() !== OPEX_SAYFA.personel) eskiPersonel.setName(OPEX_SAYFA.personel);
    var birlesik = !ss.getSheetByName(OPEX_SAYFA.teknoloji) ? opexSayfasi_(ss, 'teknoloji') : null;
    if (birlesik) eskiGiderSutunlariniKaldir_(birlesik);
    giderSayfalariniAyir_(ss);
    var sira = [OPEX_SAYFA.pano, OPEX_SAYFA.hepsi, OPEX_SAYFA.ofis, OPEX_SAYFA.teknoloji, OPEX_SAYFA.personel, OPEX_SAYFA.bordro, OPEX_SAYFA.parametreler];
    sira.forEach(function (ad, i) {
      var sh = ss.getSheetByName(ad) || ss.insertSheet(ad, i);
      ss.setActiveSheet(sh);
      ss.moveActiveSheet(i + 1);
    });
    // Yeni dosyanın boş varsayılan sayfası kaldırılır.
    ss.getSheets().forEach(function (sh) {
      if (sira.indexOf(sh.getName()) < 0 && !sh.isSheetHidden() && sh.getLastRow() === 0 && sh.getLastColumn() === 0) ss.deleteSheet(sh);
    });
    // Aylık ızgara sütunları formüllerden önce açılır; yoksa OPEX(...) aralığı #REF! olur.
    OPEX_GIDER_SAYFALARI.concat(['personel']).forEach(function (k) {
      sutunGarantile_(ss.getSheetByName(OPEX_SAYFA[k]), OPEX_IZGARA[k] + OPEX_IZGARA.genislik - 1);
    });
  }],
  // Teşvik tablosu Parametreler’de (eski Teşvikler sayfası taşınıp silinir).
  ['parametreler', function (ss) { parametreleriKur_(ss); tesvikleriKur_(ss); parametreBicimleri_(ss); }],
  ['personel', function (ss) { personeliKur_(ss); }],
  ['ofis', function (ss) { giderleriKur_(ss, 'ofis'); }],
  ['teknoloji', function (ss) { giderleriKur_(ss, 'teknoloji'); }],
  ['hepsi', function (ss) { hepsiKur_(ss); }],
  ['bordro', function (ss) { bordroyuKur_(ss); }],
  // Pano kodun yazacağı alanlarla kurulur (Hesap sayfası silinir); sonra hesaplar düz değer yazılır, en son grafikler.
  ['pano', function (ss) { panoyuKur_(ss); }],
  ['hesaplar', function () { hesaplariYaz_({ zorla: true, kilitli: true }); }],
  ['grafikler', function () { SpreadsheetApp.flush(); panoyuCiz(); }],
  ['korumalar', function (ss) { ss.getSheets().forEach(korumalariKaldir_); }],
];
var OPEX_KURULUM_OZELLIGI = 'OPEX_KURULUM';
/** Apps Script bir çalıştırmayı 6 dakikada keser; kurulum ~3,5 dakika dolunca durur, ilerlemesini kaydeder. */
var OPEX_KURULUM_BUTCE = 3.5 * 60 * 1000;

/**
 * Kurulum / onarım. Adımlar süre bütçesi içinde sırayla çalışır; bütçe dolarsa kalan adım kaydedilir ve Kurulum yeniden
 * çalıştırılınca oradan sürer (6 saatten eski kayıt yok sayılır). Formüller virgül ayraçlı yazılır: her çalıştırma
 * en_US ile başlar ve hata olsa da tr_TR ile biter (Sheets formülleri “;” ile gösterir). Zamanlanmış görev kurulmaz.
 */
function kurulum() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Kurulum sürerken düzenleme tetikleyicisi hesap yazmaz (aynı betik kilidi).
  var kilit = kilitAl_(30000);
  if (kilit === false) {
    var mesgul = 'Hesaplar yazılıyor; Kurulum’u birkaç saniye sonra yeniden çalıştırın.';
    console.log(mesgul);
    try {
      ss.toast(mesgul, 'OPEX', 10);
    } catch (hata) {
      // Düzenleyiciden çalıştırılınca bildirim gösterilemeyebilir.
    }
    return;
  }
  try {
    kurulumAdimlari_(ss);
  } finally {
    if (kilit) kilit.releaseLock();
  }
}

function kurulumAdimlari_(ss) {
  var props = PropertiesService.getDocumentProperties();
  // Kurulum kodun yazdığı alanları temizler (Giderler Hepsi, Toplam satırları): blok izlerine artık güvenilmez.
  PropertiesService.getScriptProperties().deleteProperty(OPEX_YAZIM_OZELLIGI);
  var bas = opexSimdi_();
  var kayit = {};
  try {
    kayit = JSON.parse(props.getProperty(OPEX_KURULUM_OZELLIGI) || '{}');
  } catch (hata) {
    kayit = {};
  }
  var ilk = kayit.zaman && bas - kayit.zaman < 6 * 3600 * 1000 ? Math.max(0, Math.min(kayit.adim || 0, OPEX_KURULUM_ADIMLARI.length)) : 0;
  var i = ilk;
  ss.setSpreadsheetLocale('en_US');
  ss.setSpreadsheetTimeZone('Europe/Istanbul');
  SpreadsheetApp.flush();
  try {
    for (; i < OPEX_KURULUM_ADIMLARI.length; i++) {
      if (i > ilk && opexSimdi_() - bas > OPEX_KURULUM_BUTCE) break;
      OPEX_KURULUM_ADIMLARI[i][1](ss);
      props.setProperty(OPEX_KURULUM_OZELLIGI, JSON.stringify({ adim: i + 1, zaman: opexSimdi_() }));
    }
  } finally {
    ss.setSpreadsheetLocale('tr_TR');
    SpreadsheetApp.flush();
  }
  if (i < OPEX_KURULUM_ADIMLARI.length) {
    var mesaj = 'Kurulum sürüyor: ' + i + '/' + OPEX_KURULUM_ADIMLARI.length + ' adım tamam. Kalanlar için OPEX → Kurulum / onarım’ı yeniden çalıştırın.';
    console.log(mesaj);
    try {
      ss.toast(mesaj, 'OPEX', 10);
    } catch (hata) {
      // Düzenleyiciden çalıştırılınca bildirim gösterilemeyebilir.
    }
    return;
  }
  props.deleteProperty(OPEX_KURULUM_OZELLIGI);
  // Kurulum sürerken yapılan düzenlemeler (tetikleyici kilidi alamadı) burada yazılır; değişiklik yoksa yalnız okunur.
  hesaplariYaz_({ kilitli: true });
  ss.setActiveSheet(ss.getSheetByName(OPEX_SAYFA.pano));
  anahtariSagla_();
  // Düzenleyiciden çalıştırılınca Sheets arayüzü yoktur (getUi hata verir); bilgi OPEX menüsünden de açılır.
  try {
    baglantiBilgisi();
  } catch (hata) {
    console.log('Kurulum tamam. Web bağlantısı bilgisi: Sheets → OPEX → Web bağlantısı bilgisi.');
  }
  console.log('Kurulum tamam.');
}

/* ---------- Ortak yardımcılar ---------- */

function sutunHarfi_(n) {
  var s = '';
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Net asgari ücret, yerel formül ifadesi (Parametreler’in adlı aralıkları; GV/DV istisnalı asgaride net = brüt − SGK −
 * işsizlik işçi payı). Asgari ücretlinin Tutar hücresi ve eski =OPEX("asgari-net-…") çağrılarının yerine geçer.
 */
function asgariNetIfadesi_(yil) {
  return 'ROUND(p_asgari_brut_' + yil + '*(1-p_sgk_isci-p_issizlik_isci),2)';
}

function asgariNetFormulu_(yil) {
  return '=' + asgariNetIfadesi_(yil);
}

/**
 * Girdi sayfasındaki eski özel işlev çağrıları (=OPEX("asgari-net-2026",…), ör. “× 1,5” ile) aynı değeri veren yerel
 * ifadeye çevrilir: her değişiklikte “Yükleniyor…” olmaz. Formülün geri kalanı korunur. Çevrilen hücre sayısını döner.
 */
function ozelIslevleriCevir_(sh) {
  if (!sh || sh.getLastRow() < 1) return 0;
  var formuller = sh.getDataRange().getFormulas();
  var n = 0;
  formuller.forEach(function (satir, i) {
    satir.forEach(function (f, j) {
      if (!/OPEX\(/i.test(f)) return;
      var yeni = f.replace(/OPEX\(\s*"asgari-net-(2026|2027)"[^)]*\)/gi, function (_, yil) { return asgariNetIfadesi_(yil); });
      if (yeni === f) return;
      sh.getRange(i + 1, j + 1).setFormula(yeni);
      n += 1;
    });
  });
  return n;
}

function paraBicimi_(para) {
  return OPEX_PARA_BICIMI[String(para || '').trim().toUpperCase()] || OPEX_PARA_BICIMI.TRY;
}

/**
 * Düzenli Giderler: tutar hücreleri (Tutar ve ay tutarları) satırın para birimiyle biçimlenir; onay kutusu sütunlarına
 * dokunulmaz.
 */
function paraBiciminiUygula_(sh, satir, n) {
  if (!(n > 0)) return;
  var paralar = sh.getRange(satir, 5, n, 1).getValues();
  sh.getRange(satir, 6, n, 1).setNumberFormats(paralar.map(function (r) { return [paraBicimi_(r[0])]; }));
  var blok = sh.getRange(satir, OPEX_IZGARA.teknoloji, n, OPEX_IZGARA.genislik);
  blok.setNumberFormats(blok.getNumberFormats().map(function (r, i) {
    return r.map(function (f, j) { return j % 2 === 1 ? paraBicimi_(paralar[i][0]) : f; });
  }));
}

/**
 * Basit tetikleyici: hesaplar düz değer olarak yeniden yazılır (Sheets.js → hesaplariTetikle_); gider sayfalarında Para
 * birimi değişince o satırların tutarları yeni dövizle görünür.
 */
function onEdit(e) {
  try {
    paraBiciminiDuzenle_(e);
  } catch (hata) {
    console.log('onEdit biçim: ' + hata);
  }
  try {
    hesaplariTetikle_(e);
  } catch (hata) {
    console.log('onEdit hesap: ' + hata);
  }
}

function paraBiciminiDuzenle_(e) {
  var r = e && e.range;
  if (!r) return;
  var sh = r.getSheet();
  var ad = sh.getName();
  var giderSayfasi = OPEX_GIDER_SAYFALARI.some(function (k) { return ad === OPEX_SAYFA[k]; }) || OPEX_ESKI_AD.teknoloji.indexOf(ad) >= 0;
  if (!giderSayfasi) return;
  // Önce yalnız Para sütunu (E) değdiyse sürer: başlık okuması (bir Sheets çağrısı) diğer düzenlemeleri yavaşlatmaz.
  var ilk = Math.max(r.getRow(), 4);
  var son = r.getRow() + r.getNumRows() - 1;
  if (son < ilk || r.getColumn() > 5 || r.getLastColumn() < 5) return;
  // Yalnız yeni yerleşimde (ızgara I’den başlar); kurulumdan önceki eski yerleşime dokunmaz.
  if (sh.getRange(3, OPEX_IZGARA.teknoloji).getDisplayValue() !== izgaraBasliklari_()[0]) return;
  paraBiciminiUygula_(sh, ilk, son - ilk + 1);
}

/**
 * Kullanıcı kararı (2026-10-20): Düzenli Giderler’de gizlenmiş H:N sütunları (Bu ay ödendi, Dahil, Fatura bağlantısı,
 * Not, boşluk, eski hesap sütunları) kaldırılır. Yalnız beklenen başlıklar görülürse siler; zaten kaldırılmışsa dokunmaz;
 * başka içerik varsa durur. Motor bu sütunları başlık adıyla, isteğe bağlı okur.
 */
function eskiGiderSutunlariniKaldir_(sh) {
  if (!sh || sh.getMaxColumns() < 14) return false;
  var b = OpexMotor.BASLIKLAR.giderler;
  var h = sh.getRange(3, 8, 1, 7).getDisplayValues()[0];
  if (h[0] !== b.odendi) return false;
  var beklenen = [b.odendi, b.dahil, b.fatura, b.not, ''];
  var hesap = sh.getRange(1, 13).getFormula();
  var n = Math.max(sh.getLastRow() - 3, 0);
  var bosluk = !n || sh.getRange(4, 12, n, 1).getValues().every(function (r) { return r[0] === ''; });
  var uygun = beklenen.every(function (x, i) { return h[i] === x; }) && (hesap === '' || /gider-sutun/.test(hesap)) && bosluk;
  if (!uygun) {
    throw new Error(sh.getName() + ': H:N beklenen eski sütunlar değil (' + h.join(' | ') + (bosluk ? '' : '; L sütununda veri var') + '); dokunulmadı. İçeriği taşıyıp Kurulum’u yeniden çalıştırın.');
  }
  // “Dahil = hayır” satırı hariç kalmalı: Dahil sütunu silinmeden önce o satırın bütün ay kutuları işaretsiz yapılır
  // (eski ızgara P’den başlar; tutar hücrelerindeki formüller korunur).
  if (n) {
    sh.getRange(4, 9, n, 1).getValues().forEach(function (r, i) {
      var v = r[0];
      if (!(v === false || String(v).trim().toLocaleLowerCase('tr-TR') === 'hayır')) return;
      var hucre = sh.getRange(4 + i, 16, 1, OPEX_IZGARA.genislik);
      var f = hucre.getFormulas()[0];
      hucre.setValues([hucre.getValues()[0].map(function (x, j) { return j % 2 === 0 ? false : f[j] || x; })]);
    });
  }
  sh.deleteColumns(8, 7);
  return true;
}

/**
 * Alt toplam satırı (“Toplam (₺)”): son veri satırının hemen altında; ızgara hücreleri temizlenir (elle yazılmış eski
 * toplamlar dahil). Değerleri hesap yazımı (hesaplariYaz_) düz değer olarak yazar; kod sonucu mavi.
 */
function toplamSatiriKur_(sh, k, n) {
  var hedef = 4 + n;
  var ilk = OPEX_IZGARA[k];
  var g = OPEX_IZGARA.genislik;
  // Son veri satırının altında girdi sütunlarında içerik varsa toplam için yeni satır açılır (içerik silinmez).
  if (sh.getRange(hedef, 2, 1, OPEX_GIRDI_SUTUN[k] - 1).getValues()[0].some(function (v) { return v !== ''; })) sh.insertRowAfter(hedef - 1);
  sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) { if (p.getDescription() === OPEX_TOPLAM_KORUMA) p.remove(); });
  sh.getRange(hedef, ilk, 1, g).clearContent().clearDataValidations();
  // Toplam satırında girdi açılır listeleri (Küme, Kategori…) görünmesin.
  sh.getRange(hedef, 2, 1, OPEX_GIRDI_SUTUN[k] - 1).clearContent().clearDataValidations();
  sh.getRange(hedef, 1).setValue('Toplam (₺)').setFontWeight('bold');
  sh.getRange(hedef, ilk, 1, g).setNumberFormat(OPEX_BICIM.tl).setFontWeight('bold').setFontColor(OPEX_STIL.formul).setBackground(OPEX_STIL.hesap);
  sh.getRange(hedef, 1, 1, OPEX_GIRDI_SUTUN[k]).setBackground(OPEX_STIL.hesap);
}

var OPEX_TOPLAM_KORUMA = 'OPEX toplam satırı (kod hesaplar)';

/**
 * Eski “Toplam” satırları silinir (kurulum toplamı her zaman son veri satırının altına yeniden yazar). Girdi
 * sütunlarında elle yazılmış değer olan “Toplam” satırına dokunulmaz; kurulum durur.
 */
function toplamSatirlariniSil_(sh, k) {
  var son = sh.getLastRow();
  if (son < 4) return;
  var a = sh.getRange(4, 1, son - 3, 1).getValues();
  for (var i = a.length - 1; i >= 0; i--) {
    if (!toplamSatiriMi_(a[i][0])) continue;
    var girdi = sh.getRange(4 + i, 2, 1, OPEX_GIRDI_SUTUN[k] - 1);
    var f = girdi.getFormulas()[0];
    if (girdi.getValues()[0].some(function (v, j) { return v !== '' && !f[j]; })) {
      throw new Error(sh.getName() + ': ' + (4 + i) + '. satır “' + a[i][0] + '” ama girdi sütunlarında değer var; dokunulmadı. Satırı yeniden adlandırın veya temizleyin.');
    }
    sh.deleteRow(4 + i);
  }
}

/** Aylık ızgaranın ayları: 15 aylık plan, Ekim 2026 → Aralık 2027 (kullanıcı kararı; OPEX_IZGARA.genislik = 15 × 2). */
function izgaraAylari_() {
  var aylar = [];
  for (var i = 9; i < 24; i++) aylar.push(OpexMotor.AYLAR[i % 12].slice(0, 3) + ' ' + (2026 + Math.floor(i / 12)));
  return aylar;
}

/** Izgara başlıkları: her ay yan yana “Eki 2026” (onay kutusu) ve “Eki 2026 tutar”. */
function izgaraBasliklari_() {
  var b = [];
  izgaraAylari_().forEach(function (a) { b.push(a, a + ' tutar'); });
  return b;
}

/**
 * Aylık ızgara: her ay bir onay kutusu (işaretsiz = o ay gider yok) ve bir tutar hücresi. Tutar hücresi boşsa ya da
 * formülse varsayılan formülü alır (her satırda her ay rakam görünür; 2027 ayları zamlı/artışlı); elle yazılmış tutar ve
 * işaretler korunur, boş onay kutusu işaretli olur. Izgara alanında başka içerik varsa dokunmadan durur.
 * `varsayilan(satir, yil)` o satırın varsayılan formülünü (en_US yazımıyla) döner. Koşullu biçim kurallarını döner.
 */
function ayIzgarasiKur_(sh, ilk, n, alan, tutarAciklama, tutarBicimi, varsayilan) {
  var basliklar = izgaraBasliklari_();
  var g = basliklar.length;
  var mevcut = sh.getRange(3, ilk, 1, g).getDisplayValues()[0];
  var yabanci = mevcut.filter(function (h, j) { return h !== '' && h !== basliklar[j]; });
  var bos = mevcut.every(function (h) { return h === ''; });
  var veriVar = n && sh.getRange(4, ilk, n, g).getValues().some(function (r) { return r.some(function (v) { return v !== ''; }); });
  if (yabanci.length || (bos && veriVar)) {
    throw new Error(sh.getName() + ': ' + sutunHarfi_(ilk) + ':' + sutunHarfi_(ilk + g - 1) + ' aylık ızgara alanında başka içerik var (' +
      (yabanci[0] || 'başlıksız veri') + '). Taşıyın veya silin, sonra Kurulum’u yeniden çalıştırın.');
  }
  sh.getRange(2, ilk).setValue('Ay ay: onay kutusu = o ay etkin (işaretsiz ayda gider yok). Tutar: formül varsayılandır; üzerine yazılan tutar o aya özeldir (' + tutarAciklama + ').').setFontColor(OPEX_STIL.ikincil);
  // Metin biçimi: “Mar 2027”, “May 2027” gibi başlıklar tarihe çevrilmez.
  sh.getRange(3, ilk, 1, g).setNumberFormat('@').setValues([basliklar])
    .setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff').setWrap(true).setHorizontalAlignment('center');
  var onay = [];
  var tutar = [];
  for (var j = 0; j < g; j += 2) {
    onay.push(sh.getRange(4, ilk + j, alan, 1));
    tutar.push(sh.getRange(4, ilk + j + 1, alan, 1));
  }
  if (n) {
    var blok = sh.getRange(4, ilk, n, g);
    var degerler = blok.getValues();
    var formuller = blok.getFormulas();
    var cikti = degerler.map(function (satir, r) {
      var onaylar = onaySatiri_(satir.filter(function (_, j) { return j % 2 === 0; }));
      return satir.map(function (v, j) {
        var ay = Math.floor(j / 2);
        if (j % 2 === 0) return onaylar[ay];
        return formuller[r][j] || v === '' ? varsayilan(4 + r, ay < 3 ? 2026 : 2027) : v;
      });
    });
    // Eski doğrulamalar yazımı reddetmesin diye önce kaldırılır (sayı kuralı aşağıda yeniden konur); insertCheckboxes
    // tüm değerleri FALSE yapar, işaretler ve tutarlar hemen ardından geri yazılır.
    blok.clearDataValidations();
    sh.getRangeList(onay.map(function (o) { return o.offset(0, 0, n, 1).getA1Notation(); })).insertCheckboxes();
    blok.setValues(cikti);
  }
  var sayiKurali = SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build();
  tutar.forEach(function (t) { t.setDataValidation(sayiKurali); });
  sh.getRangeList(tutar.map(function (t) { return t.getA1Notation(); })).setNumberFormat(tutarBicimi);
  for (var k = 0; k < g; k += 2) {
    sh.setColumnWidth(ilk + k, 76);
    sh.setColumnWidth(ilk + k + 1, 118);
  }
  sh.setColumnWidth(ilk - 1, 24);
  var h = sutunHarfi_(ilk);
  var t = sutunHarfi_(ilk + 1);
  // Veri satırı: A dolu ve “Toplam” değil (alt toplam satırı kendi biçimini taşır).
  var veri = '$A4<>"",LEFT(LOWER($A4),6)<>"toplam"';
  var kural = function (f) { return SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(f); };
  return [
    // Yalnız açıkça işaretsiz (FALSE) ay grileşir; boş hücre gri değil, uyarı rengindedir (motor boşu etkin sayar).
    kural('=AND(' + veri + ',ISLOGICAL(' + h + '4),' + h + '4=FALSE)').setBackground('#e6e3dc').setFontColor(OPEX_STIL.ikincil).setRanges(onay).build(),
    kural('=AND(' + veri + ',ISLOGICAL(' + h + '4),' + h + '4=FALSE)').setBackground('#e6e3dc').setFontColor(OPEX_STIL.ikincil).setRanges(tutar).build(),
    kural('=AND(' + veri + ',' + h + '4="")').setBackground(OPEX_STIL.uyari).setRanges(onay).build(),
    // Elle yazılmış (formül olmayan) tutar: o aya özel (turuncu zemin, siyah yazı).
    kural('=AND(' + veri + ',' + t + '4<>"",NOT(ISFORMULA(' + t + '4)))').setBackground(OPEX_STIL.vurguYuzey).setRanges(tutar).build(),
    // Formülle gelen tutar mavi yazılır.
    kural('=ISFORMULA(' + t + '4)').setFontColor(OPEX_STIL.formul).setRanges(tutar).build(),
  ];
}

/** Personel ayının varsayılan tutarı: ücret esasına göre (asgari ücretlide o yılın net asgarisi), 2027’de zamlı. */
/**
 * Bir satırın onay kutusu değerleri: metinler (evet, x, ✓…) mantıksal değere çevrilir. Satırda açıkça doldurulmuş kutu
 * varsa boş kutu işaretsiz olur (ör. Şubat’ta başlayan kişide Ekim–Ocak boş); hiç doldurulmamış satırda hepsi işaretli.
 */
function onaySatiri_(r) {
  var acik = r.some(function (v) { return v === true || v === false || String(v).trim() !== ''; });
  return r.map(function (v) {
    if (v === true || v === false) return v;
    var t = String(v).trim().toLocaleLowerCase('tr-TR');
    if (t === '') return !acik;
    return t === 'evet' || t === 'true' || t === 'doğru' || t === 'dogru' || t === 'x' || t === '✓' || t === '1';
  });
}

function personelVarsayilani_(r, yil) {
  var asgari = 'ROUND(p_asgari_brut_' + yil + '*(1-p_sgk_isci-p_issizlik_isci),2)';
  // N(): Tutar boşsa sayı 0 (boş metin “sayı ≥ 0” doğrulamasını bozar).
  var d = 'N($D' + r + ')';
  var tutar = yil === 2026 ? d : 'IF($E' + r + '="Hayır",' + d + ',ROUND(' + d + '*(1+p_zam_orani),2))';
  return '=IF($C' + r + '="Asgari ücret",' + asgari + ',' + tutar + ')';
}

/** Gider ayının varsayılan tutarı (satırın para biriminde): 2026 Tutar; 2027 artış esasına göre (Kur esaslı dövizde aynı). */
function giderVarsayilani_(r, yil) {
  if (yil === 2026) return '=N($F' + r + ')';
  var para = 'IF(OR($E' + r + '="",$E' + r + '="TRY"),"TRY",$E' + r + ')';
  var esas = 'IF($G' + r + '="",IF(' + para + '="TRY","Genel","Kur"),$G' + r + ')';
  return '=LET(p,' + para + ',a,' + esas + ',ROUND(N($F' + r + ')*(1+IFS(a="Kira",p_kira_artis_2027,a="Genel",p_genel_artis_2027,a="Kur",IF(p="TRY",p_kur_artis_2027,0),a="Yok",0,TRUE,p_genel_artis_2027)),2))';
}

/** Yeni sayfa 26 sütunla açılır; hesap blokları daha geniştir. */
function sutunGarantile_(sh, n) {
  if (sh.getMaxColumns() < n) sh.insertColumnsAfter(sh.getMaxColumns(), n - sh.getMaxColumns());
}

function temelStil_(sh) {
  var tum = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns());
  tum.setFontFamily(OPEX_STIL.font).setFontSize(OPEX_STIL.boyut).setFontColor(OPEX_STIL.murekkep).setVerticalAlignment('middle');
}

/** Açıklama A2’ye; kullanıcı açıklamayı B2’ye taşımışsa (B2 dolu) B2’ye yazılır, A2 boşaltılır (biçimi korunur). */
function aciklamaYaz_(sh, aciklama) {
  if (sh.getRange('B2').getValue() !== '') {
    sh.getRange('A2').clearContent();
    sh.getRange('B2').setValue(aciklama);
  } else {
    sh.getRange('A2').setValue(aciklama).setFontColor(OPEX_STIL.ikincil);
  }
}

/** Satır 1 başlık, satır 2 açıklama, satır 3 tablo başlıkları. */
function girdiBasligi_(sh, baslik, aciklama, basliklar, hesapBasliklari, hesapSutunu) {
  temelStil_(sh);
  sh.getRange('A1').setValue(baslik).setFontSize(18).setFontWeight('bold');
  aciklamaYaz_(sh, aciklama);
  sh.setRowHeight(1, 40);
  sh.setRowHeight(2, 28);
  var bas = sh.getRange(3, 1, 1, basliklar.length);
  bas.setValues([basliklar]).setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff').setWrap(true);
  sh.setRowHeight(3, 36);
  if (hesapBasliklari) {
    sh.getRange(3, hesapSutunu, 1, hesapBasliklari).setBackground(OPEX_STIL.ikincil).setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
  }
  sh.setFrozenRows(3);
}

function bantla_(sh, satirSayisi, sutunSayisi) {
  sh.getBandings().forEach(function (b) { b.remove(); });
  var band = sh.getRange(3, 1, Math.max(satirSayisi, 2) + 1, sutunSayisi).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  band.setHeaderRowColor(OPEX_STIL.murekkep).setFirstRowColor(OPEX_STIL.yuzey).setSecondRowColor('#faf9f6');
}

function liste_(degerler, gecersizeIzin) {
  return SpreadsheetApp.newDataValidation().requireValueInList(degerler, true).setAllowInvalid(!!gecersizeIzin).build();
}

function veriSatiriSayisi_(sh) {
  var son = sh.getLastRow();
  if (son < 4) return 0;
  var ilk = sh.getRange(4, 1, son - 3, 1).getValues();
  var n = 0;
  ilk.forEach(function (r, i) { if (String(r[0]).trim() !== '' && !toplamSatiriMi_(r[0])) n = i + 1; });
  return n;
}

/**
 * Onay kutusu doğrulaması mevcut değerleri korur (insertCheckboxes() tüm hücreleri FALSE yapar ve “Dahil”i siler).
 * “Evet”, “x” gibi metinler mantıksal değere çevrilir; boş hücre `bosIse` olur.
 */
function onayKutusu_(aralik, bosIse) {
  var degerler = aralik.getValues().map(function (satir) {
    return satir.map(function (v) {
      if (v === true || v === false) return v;
      var s = String(v).trim().toLocaleLowerCase('tr-TR');
      if (s === '') return bosIse;
      return s === 'evet' || s === 'true' || s === 'doğru' || s === 'dogru' || s === 'x' || s === '✓' || s === '1';
    });
  });
  aralik.setValues(degerler);
  aralik.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
}

/** Kullanıcı kararı (2026-10-20): kilit yok; sayfa ve aralık korumaları kaldırılır (hesaplanan sayfalar dahil). */
function korumalariKaldir_(sh) {
  [SpreadsheetApp.ProtectionType.SHEET, SpreadsheetApp.ProtectionType.RANGE].forEach(function (tur) {
    sh.getProtections(tur).forEach(function (p) { p.remove(); });
  });
}

/* ---------- Parametreler ---------- */

/** Parametre Değer hücresinin sayı biçimi. Yıl binlik ayraçsız (tr_TR’de “2.026” değil “2026”). */
function parametreBicimi_(t) {
  if (t.tur === 'oran') return t.anahtar === 'damga' ? OPEX_BICIM.binde : OPEX_BICIM.oran;
  if (t.tur === 'tutar') return OPEX_BICIM.tl;
  if (t.tur === 'kur') return OPEX_BICIM.kur;
  if (t.tur === 'sayi') return t.birim === 'yıl' ? OPEX_BICIM.tamsayi : OPEX_BICIM.sayi;
  return '@';
}

function parametreleriKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.parametreler);
  var b = OpexMotor.BASLIKLAR.parametreler;
  girdiBasligi_(sh, 'Parametreler', 'Beyaz hücreler değiştirilebilir. Değişiklik tüm hesaplara, panoya ve sayfaya birkaç saniyede yansır. Oranlar yüzde biçimindedir.', [b.grup, b.ad, b.deger, b.birim, b.anahtar, b.aciklama]);

  // Mevcut anahtarlar (onarımda değerler korunur).
  var son = Math.max(sh.getLastRow(), 3);
  var mevcut = {};
  if (son > 3) {
    sh.getRange(4, 5, son - 3, 1).getValues().forEach(function (r, i) {
      var k = String(r[0]).trim();
      if (k) mevcut[k] = i + 4;
    });
  }
  var eklenecek = OpexMotor.PARAMETRE_TANIMLARI.filter(function (t) { return !mevcut[t.anahtar]; });
  var yeni = son <= 3;
  var satir = son + 1;
  var sonGrup = '';
  var formulBekleyen = [];
  // Tohumdaki parametre kararları (ör. erisim) yalnız parametre ilk kez yazılırken uygulanır; onarım değeri korur.
  var tohumParam = typeof OPEX_TOHUM !== 'undefined' && OPEX_TOHUM.parametreler ? OPEX_TOHUM.parametreler : {};
  eklenecek.forEach(function (t) {
    if (yeni && t.grup !== sonGrup) {
      sh.getRange(satir, 1, 1, 6).setValues([[t.grup, '', '', '', '', '']]).setFontWeight('bold').setBackground(OPEX_STIL.vurguYuzey);
      sonGrup = t.grup;
      satir += 1;
    }
    var karar = Object.prototype.hasOwnProperty.call(tohumParam, t.anahtar);
    sh.getRange(satir, 1, 1, 6).setValues([[t.grup, t.ad, karar ? tohumParam[t.anahtar] : t.formul ? '' : t.deger, t.birim, t.anahtar, t.aciklama]]);
    mevcut[t.anahtar] = satir;
    if (t.formul && !karar) formulBekleyen.push({ satir: satir, formul: t.formul });
    satir += 1;
  });

  // Adlandırılmış aralıklar: p_<anahtar> → Değer hücresi.
  var adlar = {};
  ss.getNamedRanges().forEach(function (n) { adlar[n.getName()] = n; });
  OpexMotor.PARAMETRE_TANIMLARI.forEach(function (t) {
    var r = mevcut[t.anahtar];
    if (!r) return;
    var ad = 'p_' + t.anahtar;
    if (adlar[ad]) adlar[ad].setRange(sh.getRange(r, 3));
    else ss.setNamedRange(ad, sh.getRange(r, 3));
    var hucre = sh.getRange(r, 3);
    hucre.setNumberFormat(parametreBicimi_(t)).setFontWeight('bold').setHorizontalAlignment(t.tur === 'metin' || t.tur === 'liste' ? 'left' : 'right');
    if (t.tur === 'liste') hucre.setDataValidation(liste_(t.secenekler));
    if (t.formul) hucre.setBackground(OPEX_STIL.hesap);
  });
  SpreadsheetApp.flush();
  formulBekleyen.forEach(function (f) { sh.getRange(f.satir, 3).setFormula(f.formul); });
  // Onarım: hücrede hâlâ formül varsa (kullanıcı değer yazmadıysa) güncel formül yeniden yazılır.
  OpexMotor.PARAMETRE_TANIMLARI.forEach(function (t) {
    var r = mevcut[t.anahtar];
    if (!t.formul || !r || eklenecek.indexOf(t) >= 0) return;
    var hucre = sh.getRange(r, 3);
    if (hucre.getFormula() || hucre.getValue() === t.deger) hucre.setFormula(t.formul);
  });

  var sonSatir = Math.max(sh.getLastRow(), 4);
  sh.getRange(4, 5, sonSatir - 3, 1).setFontColor(OPEX_STIL.ikincil);
  sh.getRange(4, 6, sonSatir - 3, 1).setWrap(true).setFontColor(OPEX_STIL.ikincil);
  var kaynak = mevcut.enflasyon_kaynak;
  if (kaynak) sh.getRange(kaynak, 3).setWrap(true).setFontWeight('normal');
  [180, 260, 170, 70, 170, 520].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setFrozenColumns(2);
  sh.setTabColor(OPEX_STIL.ikincil);
}

/* ---------- Teşvikler (Parametreler sayfasında, H:P) ---------- */

/**
 * Kullanıcı kararı (2026-10-20): ayrı Teşvikler sayfası yok; teşvik tablosu hesapta kullanıldığı için Parametreler’in
 * H:P alanına taşınır (değer, formül, biçim, liste ve onay kutularıyla). Güvenlik: hedef alan tümüyle boş olmalı; eski
 * sayfada A:I tablosu ve kodun yazdığı K:M sütunları dışında içerik olmamalı; taşınan değer ve formüller kaynakla aynı
 * olmalı. Bunlardan biri tutmazsa hiçbir şey silinmez, kurulum açıklamayla durur. Tutarsa eski sayfa silinir (dosya
 * sürüm geçmişinde kalır).
 */
function tesvikleriTasi_(ss, sh) {
  var eski = ss.getSheetByName(OPEX_KALDIRILAN.tesvikler);
  if (!eski) return false;
  var son = Math.max(eski.getLastRow(), 3);
  var g = OPEX_TESVIK_GENISLIK;
  var ekSutun = Math.max(eski.getLastColumn() - g, 0);
  if (ekSutun > 0) {
    // J ve N+ boş olmalı (K:M eski hesap sütunları: kod yazardı, yeniden üretilir).
    var ek = eski.getRange(1, g + 1, son, ekSutun).getValues();
    var yabanci = ek.some(function (r) { return r.some(function (v, j) { return v !== '' && !(j >= 1 && j <= 3); }); });
    if (yabanci) throw new Error('Teşvikler sayfasında tablo dışında (J veya N sonrası) içerik var; taşınmadı, sayfa korunuyor. İçeriği taşıyıp Kurulum’u yeniden çalıştırın.');
  }
  var hedef = sh.getRange(3, OPEX_TESVIK_SUTUN, son - 2, g);
  var kaynak = eski.getRange(3, 1, son - 2, g);
  var hedefBos = hedef.getValues().every(function (r) { return r.every(function (v) { return v === ''; }); });
  if (hedefBos) kaynak.copyTo(hedef);
  SpreadsheetApp.flush();
  var ayni = JSON.stringify(kaynak.getValues()) === JSON.stringify(hedef.getValues()) && JSON.stringify(kaynak.getFormulas()) === JSON.stringify(hedef.getFormulas());
  if (!ayni) {
    throw new Error('Teşvik tablosu Parametreler’e taşınamadı (H:P dolu ya da farklı); Teşvikler sayfası korunuyor. Parametreler H:P’yi boşaltıp Kurulum’u yeniden çalıştırın.');
  }
  ss.deleteSheet(eski);
  return true;
}

function tesvikleriKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.parametreler);
  var b = OpexMotor.BASLIKLAR.tesvikler;
  var c = OPEX_TESVIK_SUTUN;
  sutunGarantile_(sh, c + OPEX_TESVIK_GENISLIK - 1);
  tesvikleriTasi_(ss, sh);
  sh.getRange(1, c).setValue('SGK teşvik ve destekleri').setFontSize(18).setFontWeight('bold');
  sh.getRange(2, c).setValue('Standart: uygun herkese. Koşullu: yalnız Personel → Ek teşvik sütununa kodu yazılan kişiye. Mali müşavirle doğrulayın.').setFontColor(OPEX_STIL.ikincil);
  sh.getRange(3, c, 1, OPEX_TESVIK_GENISLIK).setValues([[b.kod, b.ad, b.tur, b.deger2026, b.deger2027, b.kapsam, b.birlikte, b.etkin, b.kosul]])
    .setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff').setWrap(true);
  var ilk = sh.getRange(4, c, Math.max(sh.getLastRow() - 3, 1), 1).getValues();
  var n = 0;
  ilk.forEach(function (r, i) { if (String(r[0]).trim() !== '') n = i + 1; });
  if (n === 0) {
    var satirlar = OpexMotor.TESVIK_TANIMLARI.map(function (t) {
      return [t.kod, t.ad, t.tur, t.formul2026 ? '' : t.deger2026, t.formul2027 ? '' : t.deger2027, t.kapsam, t.birlikte, t.etkin, t.kosul];
    });
    sh.getRange(4, c, satirlar.length, OPEX_TESVIK_GENISLIK).setValues(satirlar);
    OpexMotor.TESVIK_TANIMLARI.forEach(function (t, i) {
      if (t.formul2026) sh.getRange(4 + i, c + 3).setFormula(t.formul2026);
      if (t.formul2027) sh.getRange(4 + i, c + 4).setFormula(t.formul2027);
    });
    n = satirlar.length;
  } else {
    // Onarım: tanımlı teşviklerin formül hücreleri (kullanıcı değer yazmadıysa) yeniden yazılır.
    var kodlar = sh.getRange(4, c, n, 1).getValues().map(function (r) { return String(r[0]).trim(); });
    OpexMotor.TESVIK_TANIMLARI.forEach(function (t) {
      var i = kodlar.indexOf(t.kod);
      if (i < 0) return;
      [[c + 3, t.formul2026], [c + 4, t.formul2027]].forEach(function (x) {
        var hucre = sh.getRange(4 + i, x[0]);
        if (x[1] && hucre.getFormula()) hucre.setFormula(x[1]);
      });
    });
  }
  var alan = n + 10;
  sh.getRange(4, c + 2, alan, 1).setDataValidation(liste_(OpexMotor.TESVIK_TURLERI));
  sh.getRange(4, c + 5, alan, 1).setDataValidation(liste_(OpexMotor.SECENEKLER.kapsam));
  sh.getRange(4, c + 6, alan, 1).setDataValidation(liste_(OpexMotor.SECENEKLER.evetHayir));
  onayKutusu_(sh.getRange(4, c + 7, n, 1), true);
  // Personel → Ek teşvik listesi teşvik kodlarından (taşımayla aynı adımda: eski sayfaya bağlı kalmaz).
  var personel = opexSayfasi_(ss, 'personel');
  if (personel) {
    var kodlar = sh.getRange(4, c, alan, 1);
    personel.getRange(4, 6, Math.max(veriSatiriSayisi_(personel), 1) + 15, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(kodlar, true).setAllowInvalid(false).build());
  }
  sh.getRange(4, c + 3, alan, 2).setNumberFormat('#,##0.00##');
  sh.getRange(4, c + 8, alan, 1).setWrap(true).setFontColor(OPEX_STIL.ikincil);
  sh.setColumnWidth(c - 1, 24);
  [150, 300, 260, 120, 120, 110, 130, 80, 520].forEach(function (w, i) { sh.setColumnWidth(c + i, w); });
}

/**
 * Parametreler sayfasında formül olan her hücre mavi (kod/formül sonucu), elle girilen değer siyah kalır (kullanıcı
 * kararı 2026-10-20): parametre değerleri (C) ve teşvik değerleri (K:L) dahil tüm tablo alanı.
 */
function parametreBicimleri_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.parametreler);
  var son = Math.max(sh.getLastRow(), 4) + 20;
  var genislik = OPEX_TESVIK_SUTUN + OPEX_TESVIK_GENISLIK - 1;
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=ISFORMULA(A4)').setFontColor(OPEX_STIL.formul).setRanges([sh.getRange(4, 1, son - 3, genislik)]).build(),
  ]);
}

/* ---------- Personel ---------- */

function personeliKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.personel);
  var b = OpexMotor.BASLIKLAR.personel;
  ozelIslevleriCevir_(sh);
  toplamSatirlariniSil_(sh, 'personel');
  girdiBasligi_(
    sh,
    'Personel ve ücret giderleri',
    'Bordrolu: Net/Brüt/Asgari ücret; brüt ve işveren maliyeti aylık kümülatif vergiyle hesaplanır (gri sütunlar). Freelancer: KDV dahil fatura.',
    [b.ad, b.tur, b.esas, b.tutar, b.zam, b.tesvik, b.asgariDestek, b.dahil, b.not],
    5,
    11,
  );
  var n = veriSatiriSayisi_(sh);
  if (n === 0 && typeof OPEX_TOHUM !== 'undefined' && OPEX_TOHUM.personel && OPEX_TOHUM.personel.length) {
    sh.getRange(4, 1, OPEX_TOHUM.personel.length, 9).setValues(OPEX_TOHUM.personel);
    n = OPEX_TOHUM.personel.length;
  }
  var alan = Math.max(n, 1) + 15;
  var s = OpexMotor.SECENEKLER;
  sh.getRange(4, 2, alan, 1).setDataValidation(liste_(s.personelTur));
  sh.getRange(4, 3, alan, 1).setDataValidation(liste_(s.esas));
  sh.getRange(4, 4, alan, 1).setNumberFormat(OPEX_BICIM.tl);
  sh.getRange(4, 5, alan, 1).setDataValidation(liste_(s.evetHayir));
  // Ek teşvik: Parametreler’deki teşvik kodlarından (H sütunu; satır sayısına göre, ek satır payıyla).
  var parametre = ss.getSheetByName(OPEX_SAYFA.parametreler);
  var kodAlani = parametre.getRange(4, OPEX_TESVIK_SUTUN, Math.max(parametre.getLastRow() - 3, 1) + 10, 1);
  sh.getRange(4, 6, alan, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(kodAlani, true).setAllowInvalid(false).build());
  sh.getRange(4, 7, alan, 1).setDataValidation(liste_(s.asgariDestek));
  if (n) onayKutusu_(sh.getRange(4, 8, n, 1), true);
  // Asgari ücretlinin Tutar hücresi net asgari ücrete bağlanır (yerel formül, Parametreler’den); elle yazılmış tutar korunur.
  if (n) {
    var esasTutar = sh.getRange(4, 3, n, 2);
    var et = esasTutar.getValues();
    var ef = esasTutar.getFormulas();
    et.forEach(function (r, i) {
      if (String(r[0]).trim() === 'Asgari ücret' && (r[1] === '' || /asgari-net|p_asgari_brut_/.test(ef[i][1]))) sh.getRange(4 + i, 4).setFormula(asgariNetFormulu_(2026));
    });
  }
  sh.getRange(4, 9, alan, 1).setFontColor(OPEX_STIL.ikincil).setWrap(true);
  // Hesap sütunları kod sonucudur (hesap yazımı düz değer yazar): mavi.
  sh.getRange(4, 11, alan, 5).setBackground(OPEX_STIL.hesap).setNumberFormat(OPEX_BICIM.tl).setFontColor(OPEX_STIL.formul);
  bantla_(sh, n, 9);
  var izgaraKurallari = ayIzgarasiKur_(sh, OPEX_IZGARA.personel, n, alan, 'Net: net, Brüt: brüt, Asgari ücret: net, Freelancer: KDV dahil fatura; 0 = o ay ödeme yok', OPEX_BICIM.tl, personelVarsayilani_);
  toplamSatiriKur_(sh, 'personel', n);
  var rules = [
    SpreadsheetApp.newConditionalFormatRule().setGradientMinpoint('#ffffff').setGradientMaxpoint('#fbd3c2').setRanges([sh.getRange(4, 12, alan, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A4<>"",LEFT(LOWER($A4),6)<>"toplam",$C4<>"Asgari ücret",OR($D4="",$D4=0))').setBackground(OPEX_STIL.uyari).setRanges([sh.getRange(4, 4, alan, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=ISFORMULA($D4)').setFontColor(OPEX_STIL.formul).setRanges([sh.getRange(4, 4, alan, 1)]).build(),
  ].concat(izgaraKurallari);
  sh.setConditionalFormatRules(rules);
  [230, 120, 170, 150, 100, 150, 170, 80, 280, 24, 150, 150, 170, 150, 170].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setFrozenColumns(1);
  sh.setTabColor(OPEX_STIL.seri[1]);
}

/* ---------- Giderler (OFİS, TEKNOLOJİ) ---------- */

var OPEX_GIDER_METNI = {
  teknoloji: {
    baslik: 'Giderler TEKNOLOJİ: yazılım, yapay zekâ, sunucu, API, AWS vb. (aylık)',
    kume: 'Teknoloji',
  },
  ofis: {
    baslik: 'Giderler OFİS: kira ve aidat, internet, telefon, elektrik, ofis ihtiyaçları (aylık)',
    kume: 'Ofis ve işletme',
  },
};

/** Küme sütunu → 'teknoloji' / 'ofis' (motorla aynı kural; boş ya da tanınmayan teknoloji sayılır). */
function kumeAdi_(v) {
  return OpexMotor.kumeKodu(v) === 'ofis' ? 'ofis' : 'teknoloji';
}

var OPEX_GECICI_OFIS = 'Giderler OFİS (hazırlanıyor)';
var OPEX_YEDEK = 'Yedek: Düzenli Giderler (2026-10-20)';

/**
 * Bir gider sayfasının veri satırları: boş (A:G hepsi boş), “Toplam…” satırı ve Küme. Başlıklar beklenen değilse ya da
 * adı “Toplam” ile başlayan bir satırın girdi sütunlarında elle yazılmış değer varsa hiçbir şeye dokunmadan durur.
 */
function giderSatirlari_(sh) {
  var son = sh.getLastRow();
  if (son < 4) return [];
  var b = OpexMotor.BASLIKLAR.giderler;
  var bas = sh.getRange(3, 1, 1, 7).getDisplayValues()[0];
  if (bas[0] !== b.kalem || bas[2] !== b.kume) {
    throw new Error(sh.getName() + ': 3. satır başlıkları beklenen değil (A3 “' + b.kalem + '”, C3 “' + b.kume + '”); ayırma yapılmadı.');
  }
  var aralik = sh.getRange(4, 1, son - 3, 7);
  var f = aralik.getFormulas();
  return aralik.getValues().map(function (r, i) {
    var toplam = toplamSatiriMi_(r[0]);
    if (toplam && r.slice(1).some(function (v, j) { return v !== '' && !f[i][j + 1]; })) {
      throw new Error(sh.getName() + ': ' + (4 + i) + '. satır “' + r[0] + '” toplam satırı gibi adlandırılmış ama girdisi var; ayırma yapılmadı. Satırı yeniden adlandırın.');
    }
    return { satir: 4 + i, bos: r.every(function (v) { return v === ''; }), toplam: toplam, kume: kumeAdi_(r[2]) };
  });
}

/** Sayfada yalnız `kalan` kümesinin satırları kalır; öbür kümenin satırları ve toplam satırı alttan üste silinir. */
function giderSatirlariniTemizle_(sh, satirlar, kalan) {
  for (var i = satirlar.length - 1; i >= 0; i--) {
    var s = satirlar[i];
    if (!s.bos && (s.toplam || s.kume !== kalan)) sh.deleteRow(s.satir);
  }
}

/**
 * Kullanıcı kararı (2026-10-20): Düzenli Giderler (teknoloji + ofis birlikte) Küme sütununa göre Giderler TEKNOLOJİ ve
 * Giderler OFİS’e ayrılır. İşaretler, elle yazılmış tutarlar, formüller ve biçimler kopyayla korunur. Önce değerlerden
 * gizli bir yedek sekme alınır. Sıra yarıda kesilse de yeniden çalıştırılınca kaldığı yerden sürer: kopya geçici adla
 * temizlenir, sonra “Giderler OFİS” olur; en son kaynak temizlenip “Giderler TEKNOLOJİ” olur. TEKNOLOJİ varsa dokunmaz.
 */
function giderSayfalariniAyir_(ss) {
  if (ss.getSheetByName(OPEX_SAYFA.teknoloji)) return false;
  var kaynak = null;
  OPEX_ESKI_AD.teknoloji.forEach(function (ad) { kaynak = kaynak || ss.getSheetByName(ad); });
  if (!kaynak) return false;
  var satirlar = giderSatirlari_(kaynak);
  if (!ss.getSheetByName(OPEX_YEDEK)) {
    var yedek = kaynak.copyTo(ss).setName(OPEX_YEDEK);
    var hepsi = yedek.getDataRange();
    hepsi.copyTo(hepsi, { contentsOnly: true });
    yedek.hideSheet();
  }
  var ofis = ss.getSheetByName(OPEX_SAYFA.ofis);
  if (ofis && giderSatirlari_(ofis).every(function (s) { return s.bos; })) {
    ss.deleteSheet(ofis);
    ofis = null;
  }
  if (!ofis) {
    var gecici = ss.getSheetByName(OPEX_GECICI_OFIS);
    if (gecici) ss.deleteSheet(gecici);
    gecici = kaynak.copyTo(ss).setName(OPEX_GECICI_OFIS);
    giderSatirlariniTemizle_(gecici, satirlar, 'ofis');
    gecici.setName(OPEX_SAYFA.ofis);
  }
  giderSatirlariniTemizle_(kaynak, giderSatirlari_(kaynak), 'teknoloji');
  kaynak.setName(OPEX_SAYFA.teknoloji);
  return true;
}

function giderleriKur_(ss, k) {
  var sh = ss.getSheetByName(OPEX_SAYFA[k]) || ss.insertSheet(OPEX_SAYFA[k]);
  var b = OpexMotor.BASLIKLAR.giderler;
  ozelIslevleriCevir_(sh);
  toplamSatirlariniSil_(sh, k);
  girdiBasligi_(
    sh,
    OPEX_GIDER_METNI[k].baslik,
    'Döviz kalemleri Parametreler → USD/EUR kuruyla ₺’ye çevrilir. 2027 artış esası: Kur, Kira, Genel veya Yok. Küme boşsa “' +
      OPEX_GIDER_METNI[k].kume + '” sayılır. Tüm giderler “' + OPEX_SAYFA.hepsi + '” sayfasında, personel “' + OPEX_SAYFA.personel + '” sayfasındadır.',
    [b.kalem, b.hesap, b.kume, b.kategori, b.para, b.tutar, b.artis],
  );
  var n = veriSatiriSayisi_(sh);
  if (n === 0 && typeof OPEX_TOHUM !== 'undefined' && OPEX_TOHUM.giderler && OPEX_TOHUM.giderler.length) {
    // Tohumun eski 11 sütunundan yalnız girdi sütunları (A:G), bu sayfanın kümesi; “Dahil = hayır” satırları alınmaz.
    var tohum = OPEX_TOHUM.giderler
      .filter(function (r) { return r[8] !== false && kumeAdi_(r[2]) === k; })
      .map(function (r) { return r.slice(0, OPEX_GIRDI_SUTUN[k]); });
    if (tohum.length) sh.getRange(4, 1, tohum.length, OPEX_GIRDI_SUTUN[k]).setValues(tohum);
    n = tohum.length;
  }
  var alan = Math.max(n, 1) + 20;
  var s = OpexMotor.SECENEKLER;
  // Grubu sayfa belirler: Küme sütunu sayfanın grubuyla eşitlenir (çelişki görünmesin).
  if (n) {
    var ak = sh.getRange(4, 1, n, 3).getValues();
    var kume = sh.getRange(4, 3, n, 1);
    kume.setValues(ak.map(function (r) { return [String(r[0]).trim() === '' || toplamSatiriMi_(r[0]) ? r[2] : OPEX_GIDER_METNI[k].kume]; }));
  }
  sh.getRange(4, 3, alan, 1).setDataValidation(liste_([OPEX_GIDER_METNI[k].kume]));
  sh.getRange(4, 4, alan, 1).setDataValidation(liste_(s.kategori, true));
  sh.getRange(4, 5, alan, 1).setDataValidation(liste_(s.para));
  sh.getRange(4, 7, alan, 1).setDataValidation(liste_(s.artis));
  bantla_(sh, n, OPEX_GIRDI_SUTUN[k]);
  var izgaraKurallari = ayIzgarasiKur_(sh, OPEX_IZGARA[k], n, alan, 'satırın para biriminde, Para sütunu', '#,##0.00', giderVarsayilani_);
  paraBiciminiUygula_(sh, 4, n);
  toplamSatiriKur_(sh, k, n);
  var rules = [
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A4<>"",LEFT(LOWER($A4),6)<>"toplam",OR($F4="",$F4=0))').setBackground(OPEX_STIL.uyari).setRanges([sh.getRange(4, 6, alan, 1)]).build(),
  ].concat(izgaraKurallari);
  sh.setConditionalFormatRules(rules);
  [230, 230, 150, 160, 110, 140, 140].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setFrozenColumns(1);
  sh.setTabColor(k === 'teknoloji' ? OPEX_STIL.seri[0] : OPEX_STIL.seri[2]);
}

/* ---------- Giderler Hepsi (hesaplanır) ---------- */

/** Tüm kalemler (Ofis, Teknoloji, Personel) ay ay ₺, grup ara toplamları ve genel toplam: motorun “hepsi” raporu. */
function hepsiKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.hepsi) || ss.insertSheet(OPEX_SAYFA.hepsi);
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) { p.remove(); });
  sh.clear();
  // Ay sayısı rapor ayından Aralık 2027’ye: en çok 24 ay (+ 3 başlık + toplam).
  sutunGarantile_(sh, 3 + 24 + 1);
  temelStil_(sh);
  sh.getRange('A1').setValue('Giderler Hepsi: ofis, teknoloji ve personel (ay ay, ₺)').setFontSize(18).setFontWeight('bold');
  sh.getRange('A2').setValue('Kod hesaplar; değişiklik “' + OPEX_SAYFA.ofis + '”, “' + OPEX_SAYFA.teknoloji + '” ve “' + OPEX_SAYFA.personel +
    '” sayfalarından yapılır. Gider: satırın kuruyla ₺, yalnız işaretli aylar; personel: işveren maliyeti (freelancer: fatura).').setFontColor(OPEX_STIL.ikincil);
  sh.setRowHeight(1, 40);
  sh.getRange(3, 1, 1, 28).setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff').setWrap(true);
  sh.getRange(3, 4, 1, 25).setHorizontalAlignment('right');
  sh.getRange(4, 4, 300, 25).setNumberFormat(OPEX_BICIM.tl).setFontColor(OPEX_STIL.formul);
  sh.getRange(4, 1, 300, 3).setFontColor(OPEX_STIL.formul);
  sh.setFrozenRows(3);
  sh.setFrozenColumns(2);
  sh.setColumnWidth(1, 110);
  sh.setColumnWidth(2, 260);
  sh.setColumnWidth(3, 170);
  for (var c = 4; c <= 28; c++) sh.setColumnWidth(c, 120);
  // Grup ara toplamı ve genel toplam satırları (Ayrıntı boş): kalın, yüzey tonu.
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($C4="",REGEXMATCH($B4," toplamı$"))').setBold(true).setBackground(OPEX_STIL.hesap).setRanges([sh.getRange(4, 1, 300, 28)]).build(),
  ]);
  korumalariKaldir_(sh);
  sh.setTabColor(OPEX_STIL.murekkep);
}

/* ---------- Bordro (hesaplanır) ---------- */

function bordroyuKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.bordro);
  sutunGarantile_(sh, 32);
  temelStil_(sh);
  sh.getRange('A1').setValue('Bordro: netten brüte, aylık kümülatif').setFontSize(18).setFontWeight('bold');
  sh.getRange('A2').setValue('Hesaplanır (düzenlemeyin). Gelir vergisi kümülatif matrahla; asgari ücret GV/DV istisnası ve SGK tavanı uygulanır.').setFontColor(OPEX_STIL.ikincil);
  sh.getRange('A3').setValue('2026').setFontSize(14).setFontWeight('bold');
  sh.getRange('Q3').setValue('2027 (zam ve varsayımlarla)').setFontSize(14).setFontWeight('bold');
  [1, 17].forEach(function (c) {
    sh.getRange(4, c, 1, 15).setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff').setWrap(true);
    sh.getRange(5, c + 2, 200, 13).setNumberFormat(OPEX_BICIM.tl);
    sh.setColumnWidth(c, 200);
    sh.setColumnWidth(c + 1, 100);
    for (var i = 2; i < 15; i++) sh.setColumnWidth(c + i, 120);
  });
  sh.setColumnWidth(16, 24);
  var rules = [
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$B5="Yıl toplamı"').setBold(true).setBackground(OPEX_STIL.vurguYuzey).setRanges([sh.getRange('A5:O300')]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$R5="Yıl toplamı"').setBold(true).setBackground(OPEX_STIL.vurguYuzey).setRanges([sh.getRange('Q5:AE300')]).build(),
  ];
  sh.setConditionalFormatRules(rules);
  sh.setFrozenRows(4);
  sh.setRowHeight(4, 36);
  korumalariKaldir_(sh);
  sh.setTabColor(OPEX_STIL.seri[1]);
}

/* ---------- Pano ---------- */

/** Pano bloğunun aralığı (OPEX_PANO): bloğun `ilk` sütunundan `kac` sütun, `satir` satır (başlık dahil). */
function panoAraligi_(sh, ad, ilk, kac, satir) {
  var b = OPEX_PANO[ad];
  return sh.getRange(b.satir, b.sutun + (ilk || 0), satir || b.enCok, kac || b.genislik);
}

/** Pano tablo başlığı ve gövde biçimi: başlık satırı mürekkep zeminde, gövde yüzeyde, kod sonucu mavi. */
function panoTablosu_(sh, ad, baslik, sayiSutunlari) {
  var b = OPEX_PANO[ad];
  sh.getRange(b.satir - 1, b.sutun).setValue(baslik).setFontSize(14).setFontWeight('bold');
  sh.getRange(b.satir, b.sutun, 1, b.genislik).setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff').setWrap(true);
  sh.getRange(b.satir + 1, b.sutun, b.enCok - 1, b.genislik).setBackground(OPEX_STIL.yuzey).setFontColor(OPEX_STIL.formul);
  (sayiSutunlari || []).forEach(function (x) {
    sh.getRange(b.satir, b.sutun + x[0]).setHorizontalAlignment('right');
    sh.getRange(b.satir + 1, b.sutun + x[0], b.enCok - 1, 1).setNumberFormat(x[1] || OPEX_BICIM.tlYuvarlak);
  });
}

/**
 * Pano: gösterge kutuları, küme özeti, bordro köprüsü, grafikler, 12 aylık plan, kişiler, grafik verileri ve uyarılar.
 * Değerleri hesap yazımı düz değer olarak yazar (OPEX_PANO, Sheets.js); ayrı Hesap sayfası yoktur (kullanıcı kararı
 * 2026-10-20: eski Hesap sayfası silinir). Kod sonucu mavi.
 */
function panoyuKur_(ss) {
  var eski = ss.getSheetByName(OPEX_KALDIRILAN.hesap);
  if (eski) ss.deleteSheet(eski);
  var sh = ss.getSheetByName(OPEX_SAYFA.pano);
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
  sh.clear();
  if (sh.getMaxRows() < 300) sh.insertRowsAfter(sh.getMaxRows(), 300 - sh.getMaxRows());
  temelStil_(sh);
  sh.setHiddenGridlines(true);
  var sutun = 12;
  for (var c = 1; c <= sutun; c++) sh.setColumnWidth(c, 112);
  sh.getRange(1, 1, 300, sutun).setBackground(OPEX_STIL.zemin);

  sh.getRange('A1:L1').merge().setValue('Türksab · OPEX panosu').setFontSize(22).setFontWeight('bold');
  sh.getRange('A2:H2').merge().setValue('Teknoloji ve insan kümeleri + ofis/işletme. Google Sheets değişince GitHub Pages sayfası birkaç saniyede güncellenir.').setFontColor(OPEX_STIL.ikincil);
  sh.getRange('I2:L2').merge().setFontColor(OPEX_STIL.ikincil).setHorizontalAlignment('right');
  sh.setRowHeight(1, 46);
  sh.setRowHeight(2, 30);

  /*
   * Gösterge kutusu: etiket, değer ve açıklama aynı sol hizada (hangi rakamın hangi kümeye ait olduğu tek bakışta);
   * kutular arasında zemin renginde boşluk (kenarlık vurgu değil, aralıktır). Metin ve değeri hesap yazımı yazar.
   */
  var kpi = function (satir, sutunBas, bicim) {
    var genis = 3;
    var kutu = sh.getRange(satir, sutunBas, 3, genis);
    kutu.setBackground(OPEX_STIL.yuzey).setHorizontalAlignment('left').setVerticalAlignment('middle');
    sh.getRange(satir, sutunBas, 1, genis).merge().setFontColor(OPEX_STIL.ikincil).setFontWeight('bold');
    sh.getRange(satir + 1, sutunBas, 1, genis).merge().setFontSize(22).setFontWeight('bold')
      .setFontColor(OPEX_STIL.formul).setNumberFormat(bicim || OPEX_BICIM.tlYuvarlak).setHorizontalAlignment('left');
    sh.getRange(satir + 2, sutunBas, 1, genis).merge().setFontColor(OPEX_STIL.ikincil).setVerticalAlignment('top');
    kutu.setBorder(true, true, true, true, null, null, OPEX_STIL.zemin, SpreadsheetApp.BorderStyle.SOLID_THICK);
  };
  kpi(4, 1);
  kpi(4, 4);
  kpi(4, 7);
  kpi(4, 10);
  kpi(8, 1);
  kpi(8, 4, '+0.0%;-0.0%;0.0%');
  kpi(8, 7, '0.00%');
  kpi(8, 10, '#,##0.0000');
  [4, 8].forEach(function (r) { sh.setRowHeight(r, 30); });
  [5, 9].forEach(function (r) { sh.setRowHeight(r, 44); });
  [6, 10].forEach(function (r) { sh.setRowHeight(r, 30); });

  panoTablosu_(sh, 'ozet', 'Küme özeti', [[1], [2], [3], [4], [5], [6, '+0.0%;-0.0%;0.0%']]);
  sh.getRange('A17:G17').setFontWeight('bold');
  panoTablosu_(sh, 'kopru', 'Bordro köprüsü (bu ay)', [[1]]);
  sh.getRange('I18:J18').setFontWeight('bold');
  sh.getRange('I21:J21').setFontWeight('bold');
  sh.setColumnWidth(9, 200);

  sh.getRange('A24').setValue('Grafikler').setFontSize(14).setFontWeight('bold');
  // 12 aylık plan tablosu: 9. grafiğin (plan) yanında.
  panoTablosu_(sh, 'plan', '12 aylık plan', [[1], [2], [3], [4]]);
  sh.getRange(OPEX_PANO.plan.satir + 13, 7, 1, 5).setFontWeight('bold');
  panoTablosu_(sh, 'kisi', 'Kişiler: bu ay ve 2027', [[3], [4], [5], [6], [7], [8], [9, '0.0%']]);
  sh.setRowHeight(OPEX_PANO.kisi.satir, 40);
  sh.getRange(OPEX_PANO.kategori.satir - 3, 1).setValue('Grafik verileri (kod yazar)').setFontSize(16).setFontWeight('bold');
  panoTablosu_(sh, 'kategori', 'Kategoriler', [[2], [3], [4, '0.0%']]);
  panoTablosu_(sh, 'aylik', 'Aylık OPEX', [[1], [2], [3], [4], [5]]);
  panoTablosu_(sh, 'bilesen', 'Bordro bileşenleri (bu ay)', [[1], [2], [3], [4]]);
  panoTablosu_(sh, 'teknoloji', 'Teknoloji sağlayıcıları (bu ay)', [[2]]);
  panoTablosu_(sh, 'uyari', 'Uyarılar');
  sh.getRange(OPEX_PANO.uyari.satir + 1, 1, OPEX_PANO.uyari.enCok - 1, 1).setFontColor(OPEX_STIL.ikincil);
  korumalariKaldir_(sh);
  sh.setTabColor(OPEX_STIL.vurgu);
}

/** Pano grafiklerini siler ve Pano bloklarından (OPEX_PANO) yeniden çizer (Google Sheets grafikleri). */
function panoyuCiz() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(OPEX_SAYFA.pano);
  if (!sh) return;
  sh.getCharts().forEach(function (c) { sh.removeChart(c); });
  var aralik = function (ad, ilk, kac, satir) { return panoAraligi_(sh, ad, ilk, kac, satir); };
  var genislik = 660;
  var yukseklik = 420;
  var konum = function (i) { return { satir: 25 + Math.floor(i / 2) * 21, sutun: i % 2 === 0 ? 1 : 7 }; };
  var ortak = function (builder, baslik, renkler) {
    return builder
      .setNumHeaders(1)
      .setOption('title', baslik)
      .setOption('width', genislik)
      .setOption('height', yukseklik)
      .setOption('fontName', OPEX_STIL.font)
      .setOption('fontSize', 13)
      .setOption('titleTextStyle', { color: OPEX_STIL.murekkep, fontSize: 15, bold: true })
      .setOption('legend', { position: 'top', textStyle: { color: OPEX_STIL.ikincil, fontSize: 13 } })
      .setOption('backgroundColor', OPEX_STIL.yuzey)
      .setOption('colors', renkler || OPEX_STIL.seri)
      .setOption('hAxis', { textStyle: { color: OPEX_STIL.ikincil, fontSize: 12 }, gridlines: { color: OPEX_STIL.cizgi }, format: 'short' })
      .setOption('vAxis', { textStyle: { color: OPEX_STIL.ikincil, fontSize: 12 }, gridlines: { color: OPEX_STIL.cizgi }, format: 'short' });
  };
  var ekle = function (i, builder) {
    var k = konum(i);
    sh.insertChart(builder.setPosition(k.satir, k.sutun, 0, 0).build());
  };

  ekle(0, ortak(sh.newChart().setChartType(Charts.ChartType.PIE).addRange(aralik('ozet', 0, 2, 4)), 'Küme dağılımı (bu ay)').setOption('pieHole', 0.55).setOption('pieSliceText', 'percentage').setOption('pieSliceBorderColor', OPEX_STIL.yuzey).setOption('legend', { position: 'right', textStyle: { color: OPEX_STIL.ikincil, fontSize: 13 } }));
  ekle(1, ortak(sh.newChart().setChartType(Charts.ChartType.BAR).addRange(aralik('kategori', 1, 2, 20)), 'Kategoriler (bu ay, ₺)', [OPEX_STIL.seri[1]]).setOption('legend', { position: 'none' }));
  ekle(2, ortak(sh.newChart().setChartType(Charts.ChartType.COLUMN).addRange(aralik('aylik', 0, 4, 13)), 'Aylık OPEX 2026 (kümelere göre, ₺)').setOption('isStacked', true));
  ekle(
    3,
    ortak(
      sh.newChart().setChartType(Charts.ChartType.LINE).addRange(aralik('aylik', 0, 1, 13)).addRange(aralik('aylik', 4, 2, 13)).setMergeStrategy(Charts.ChartMergeStrategy.MERGE_COLUMNS),
      'Aylık toplam: 2026 ve 2027 (₺)',
    )
      .setOption('lineWidth', 3)
      .setOption('pointSize', 7),
  );
  ekle(
    4,
    ortak(
      sh.newChart().setChartType(Charts.ChartType.COLUMN).addRange(aralik('ozet', 0, 1, 4)).addRange(aralik('ozet', 2, 1, 4)).addRange(aralik('ozet', 4, 1, 4)).setMergeStrategy(Charts.ChartMergeStrategy.MERGE_COLUMNS),
      'Aylık ortalama: 2026 → 2027 (₺)',
    ),
  );
  ekle(5, ortak(sh.newChart().setChartType(Charts.ChartType.BAR).addRange(aralik('bilesen', 0, 5, 20)), 'Bordro bileşenleri (bu ay, ₺)').setOption('isStacked', true));
  ekle(
    6,
    ortak(
      sh.newChart().setChartType(Charts.ChartType.BAR).addRange(aralik('kisi', 0, 1, 30)).addRange(aralik('kisi', 5, 1, 30)).addRange(aralik('kisi', 8, 1, 30)).setMergeStrategy(Charts.ChartMergeStrategy.MERGE_COLUMNS),
      'Kişi maliyeti: bu ay ve 2027 ortalaması (₺)',
    ),
  );
  ekle(7, ortak(sh.newChart().setChartType(Charts.ChartType.BAR).addRange(aralik('teknoloji', 0, 1, 25)).addRange(aralik('teknoloji', 2, 1, 25)).setMergeStrategy(Charts.ChartMergeStrategy.MERGE_COLUMNS), 'Teknoloji sağlayıcıları (bu ay, ₺)', [OPEX_STIL.seri[0]]).setOption('legend', { position: 'none' }));
  ekle(8, ortak(sh.newChart().setChartType(Charts.ChartType.COLUMN).addRange(aralik('plan', 0, 4, 13)), '12 aylık plan (ay ay, ₺)', [OPEX_STIL.seri[0], OPEX_STIL.seri[2], OPEX_STIL.seri[1]]).setOption('isStacked', true));
}
