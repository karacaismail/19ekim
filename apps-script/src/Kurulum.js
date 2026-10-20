/**
 * iStoc OPEX — Google Sheets kurulumu ve onarımı (OPEX menüsü → Kurulum / onarım).
 *
 * Tekrar çalıştırılabilir: girdi sayfalarındaki veriye dokunmaz; eksik sayfa, başlık, parametre, biçim, açılır liste,
 * adlandırılmış aralık, hesap formülü ve pano grafiklerini tamamlar. Boş Personel/Giderler sayfası yalnız
 * `OPEX_TOHUM` tanımlıysa (repo dışındaki Tohum.js) doldurulur.
 *
 * Görsel kimlik: iStoc mürekkep + turuncu; grafik renkleri sayfadaki ECharts paletiyle aynı (mavi, turuncu, aqua, sarı).
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
  seri: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
};
var OPEX_BICIM = {
  tl: '#,##0.00 "₺"',
  tlYuvarlak: '#,##0 "₺"',
  kur: '#,##0.0000 "₺"',
  oran: '0.00%',
  binde: '0.000%',
  sayi: '#,##0.##',
  tamsayi: '0',
};
var OPEX_SUTUN = {
  parametreler: 6,
  personel: 9,
  giderler: 11,
  tesvikler: 9,
};

function kurulum() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Formüller virgül ayraçlı yazılır: önce en_US, en sonda tr_TR (Sheets formülleri “;” ile gösterir).
  ss.setSpreadsheetLocale('en_US');
  ss.setSpreadsheetTimeZone('Europe/Istanbul');
  SpreadsheetApp.flush();

  var sira = [OPEX_SAYFA.pano, OPEX_SAYFA.giderler, OPEX_SAYFA.personel, OPEX_SAYFA.bordro, OPEX_SAYFA.parametreler, OPEX_SAYFA.tesvikler, OPEX_SAYFA.hesap];
  sira.forEach(function (ad, i) {
    var sh = ss.getSheetByName(ad) || ss.insertSheet(ad, i);
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(i + 1);
  });
  // Yeni dosyanın boş varsayılan sayfası kaldırılır.
  ss.getSheets().forEach(function (sh) {
    if (sira.indexOf(sh.getName()) < 0 && sh.getLastRow() === 0 && sh.getLastColumn() === 0) ss.deleteSheet(sh);
  });
  // Aylık ızgara sütunları formüllerden önce açılır; yoksa OPEX(...) aralığı #REF! olur.
  sutunGarantile_(ss.getSheetByName(OPEX_SAYFA.giderler), OPEX_IZGARA.giderler + OPEX_IZGARA.genislik - 1);
  sutunGarantile_(ss.getSheetByName(OPEX_SAYFA.personel), OPEX_IZGARA.personel + OPEX_IZGARA.genislik - 1);

  parametreleriKur_(ss);
  tesvikleriKur_(ss);
  personeliKur_(ss);
  giderleriKur_(ss);
  bordroyuKur_(ss);
  hesabiKur_(ss);
  panoyuKur_(ss);
  SpreadsheetApp.flush();
  panoyuCiz();

  ss.setSpreadsheetLocale('tr_TR');
  SpreadsheetApp.flush();
  ss.setActiveSheet(ss.getSheetByName(OPEX_SAYFA.pano));
  anahtariSagla_();
  // Düzenleyiciden çalıştırılınca Sheets arayüzü yoktur (getUi hata verir); bilgi OPEX menüsünden de açılır.
  try {
    baglantiBilgisi();
  } catch (hata) {
    console.log('Kurulum tamam. Web bağlantısı bilgisi: Sheets → OPEX → Web bağlantısı bilgisi.');
  }
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

/** OPEX(...) formülü: tüm girdi aralıkları argümandır, biri değişince yeniden hesaplanır. */
function opexFormulu_(rapor) {
  var izgara = function (ad, ilk) {
    return ad + '!' + sutunHarfi_(ilk) + '1:' + sutunHarfi_(ilk + OPEX_IZGARA.genislik - 1);
  };
  return '=OPEX("' + rapor + '",Parametreler!A1:F,Personel!A1:I,Giderler!A1:K,\'Teşvikler\'!A1:I,' +
    izgara('Giderler', OPEX_IZGARA.giderler) + ',' + izgara('Personel', OPEX_IZGARA.personel) + ')';
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
      return satir.map(function (v, j) {
        var ay = Math.floor(j / 2);
        if (j % 2 === 0) {
          if (v === true || v === false) return v;
          var t = String(v).trim().toLocaleLowerCase('tr-TR');
          return t === '' ? true : t === 'evet' || t === 'true' || t === 'doğru' || t === 'dogru' || t === 'x' || t === '✓' || t === '1';
        }
        return formuller[r][j] || v === '' ? varsayilan(4 + r, ay < 3 ? 2026 : 2027) : v;
      });
    });
    // insertCheckboxes tüm değerleri FALSE yapar; işaretler ve tutarlar hemen ardından geri yazılır.
    sh.getRangeList(onay.map(function (o) { return o.offset(0, 0, n, 1).getA1Notation(); })).insertCheckboxes();
    blok.setValues(cikti);
  }
  var sayiKurali = SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqual(0).setAllowInvalid(false).build();
  tutar.forEach(function (t) { t.setDataValidation(sayiKurali); });
  sh.getRangeList(tutar.map(function (t) { return t.getA1Notation(); })).setNumberFormat(tutarBicimi);
  for (var k = 0; k < g; k += 2) {
    sh.setColumnWidth(ilk + k, 76);
    sh.setColumnWidth(ilk + k + 1, 118);
  }
  sh.setColumnWidth(ilk - 1, 24);
  var h = sutunHarfi_(ilk);
  return [
    // Yalnız açıkça işaretsiz (FALSE) ay grileşir; boş hücre gri değil, uyarı rengindedir (motor boşu etkin sayar).
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A4<>"",ISLOGICAL(' + h + '4),' + h + '4=FALSE)').setBackground('#e6e3dc').setFontColor(OPEX_STIL.ikincil).setRanges(onay).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A4<>"",ISLOGICAL(' + h + '4),' + h + '4=FALSE)').setBackground('#e6e3dc').setFontColor(OPEX_STIL.ikincil).setRanges(tutar).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A4<>"",' + h + '4="")').setBackground(OPEX_STIL.uyari).setRanges(onay).build(),
    // Elle yazılmış (formül olmayan) tutar: o aya özel.
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A4<>"",' + sutunHarfi_(ilk + 1) + '4<>"",NOT(ISFORMULA(' + sutunHarfi_(ilk + 1) + '4)))').setBackground(OPEX_STIL.vurguYuzey).setRanges(tutar).build(),
  ];
}

/** Personel ayının varsayılan tutarı: ücret esasına göre (asgari ücretlide o yılın net asgarisi), 2027’de zamlı. */
function personelVarsayilani_(r, yil) {
  var asgari = 'ROUND(p_asgari_brut_' + yil + '*(1-p_sgk_isci-p_issizlik_isci),2)';
  var tutar = yil === 2026 ? '$D' + r : 'IF($E' + r + '="Hayır",$D' + r + ',ROUND($D' + r + '*(1+p_zam_orani),2))';
  return '=IF($C' + r + '="Asgari ücret",' + asgari + ',' + tutar + ')';
}

/** Gider ayının varsayılan tutarı (satırın para biriminde): 2026 Tutar; 2027 artış esasına göre (Kur esaslı dövizde aynı). */
function giderVarsayilani_(r, yil) {
  if (yil === 2026) return '=$F' + r;
  var para = 'IF(OR($E' + r + '="",$E' + r + '="TRY"),"TRY",$E' + r + ')';
  var esas = 'IF($G' + r + '="",IF(' + para + '="TRY","Genel","Kur"),$G' + r + ')';
  return '=LET(p,' + para + ',a,' + esas + ',ROUND($F' + r + '*(1+IFS(a="Kira",p_kira_artis_2027,a="Genel",p_genel_artis_2027,a="Kur",IF(p="TRY",p_kur_artis_2027,0),a="Yok",0,TRUE,p_genel_artis_2027)),2))';
}

/** Yeni sayfa 26 sütunla açılır; hesap blokları daha geniştir. */
function sutunGarantile_(sh, n) {
  if (sh.getMaxColumns() < n) sh.insertColumnsAfter(sh.getMaxColumns(), n - sh.getMaxColumns());
}

function temelStil_(sh) {
  var tum = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns());
  tum.setFontFamily(OPEX_STIL.font).setFontSize(OPEX_STIL.boyut).setFontColor(OPEX_STIL.murekkep).setVerticalAlignment('middle');
}

/** Satır 1 başlık, satır 2 açıklama, satır 3 tablo başlıkları. */
function girdiBasligi_(sh, baslik, aciklama, basliklar, hesapBasliklari, hesapSutunu) {
  temelStil_(sh);
  sh.getRange('A1').setValue(baslik).setFontSize(18).setFontWeight('bold');
  sh.getRange('A2').setValue(aciklama).setFontColor(OPEX_STIL.ikincil);
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
  ilk.forEach(function (r, i) { if (String(r[0]).trim() !== '') n = i + 1; });
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

function korumaUyari_(sh, aciklama) {
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) { p.remove(); });
  sh.protect().setDescription(aciklama).setWarningOnly(true);
}

/* ---------- Parametreler ---------- */

function parametreleriKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.parametreler);
  var b = OpexMotor.BASLIKLAR.parametreler;
  girdiBasligi_(sh, 'Parametreler', 'Beyaz hücreler değiştirilebilir. Değişiklik tüm hesaplara, panoya ve sayfaya (≈15 sn) yansır. Oranlar yüzde biçimindedir.', [b.grup, b.ad, b.deger, b.birim, b.anahtar, b.aciklama]);

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
    var bicim = t.tur === 'oran' ? (t.anahtar === 'damga' ? OPEX_BICIM.binde : OPEX_BICIM.oran) : t.tur === 'tutar' ? OPEX_BICIM.tl : t.tur === 'kur' ? OPEX_BICIM.kur : t.tur === 'sayi' ? OPEX_BICIM.sayi : '@';
    hucre.setNumberFormat(bicim).setFontWeight('bold').setHorizontalAlignment(t.tur === 'metin' || t.tur === 'liste' ? 'left' : 'right');
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

/* ---------- Teşvikler ---------- */

function tesvikleriKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.tesvikler);
  var b = OpexMotor.BASLIKLAR.tesvikler;
  girdiBasligi_(
    sh,
    'SGK teşvik ve destekleri',
    '“Standart” satırlar uygun herkese uygulanır; “Koşullu” satırlar yalnız Personel → Ek teşvik sütununa kodu yazılan kişiye. Mali müşavirle doğrulayın.',
    [b.kod, b.ad, b.tur, b.deger2026, b.deger2027, b.kapsam, b.birlikte, b.etkin, b.kosul],
    3,
    11,
  );
  var n = veriSatiriSayisi_(sh);
  if (n === 0) {
    var satirlar = OpexMotor.TESVIK_TANIMLARI.map(function (t) {
      return [t.kod, t.ad, t.tur, t.formul2026 ? '' : t.deger2026, t.formul2027 ? '' : t.deger2027, t.kapsam, t.birlikte, t.etkin, t.kosul];
    });
    sh.getRange(4, 1, satirlar.length, 9).setValues(satirlar);
    OpexMotor.TESVIK_TANIMLARI.forEach(function (t, i) {
      if (t.formul2026) sh.getRange(4 + i, 4).setFormula(t.formul2026);
      if (t.formul2027) sh.getRange(4 + i, 5).setFormula(t.formul2027);
    });
    n = satirlar.length;
  } else {
    // Onarım: tanımlı teşviklerin formül hücreleri (kullanıcı değer yazmadıysa) yeniden yazılır.
    var kodlar = sh.getRange(4, 1, n, 1).getValues().map(function (r) { return String(r[0]).trim(); });
    OpexMotor.TESVIK_TANIMLARI.forEach(function (t) {
      var i = kodlar.indexOf(t.kod);
      if (i < 0) return;
      [[4, t.formul2026], [5, t.formul2027]].forEach(function (x) {
        var hucre = sh.getRange(4 + i, x[0]);
        if (x[1] && hucre.getFormula()) hucre.setFormula(x[1]);
      });
    });
  }
  var alan = n + 10;
  sh.getRange(4, 3, alan, 1).setDataValidation(liste_(OpexMotor.TESVIK_TURLERI));
  sh.getRange(4, 6, alan, 1).setDataValidation(liste_(OpexMotor.SECENEKLER.kapsam));
  sh.getRange(4, 7, alan, 1).setDataValidation(liste_(OpexMotor.SECENEKLER.evetHayir));
  onayKutusu_(sh.getRange(4, 8, n, 1), true);
  sh.getRange(4, 4, alan, 2).setNumberFormat('#,##0.00##');
  sh.getRange(4, 9, alan, 1).setWrap(true).setFontColor(OPEX_STIL.ikincil);
  sh.getRange('K1').setFormula(opexFormulu_('tesvik-sutun'));
  sh.getRange(4, 11, alan, 3).setBackground(OPEX_STIL.hesap);
  sh.getRange(4, 12, alan, 2).setNumberFormat(OPEX_BICIM.tl);
  bantla_(sh, n, 9);
  [150, 300, 260, 120, 120, 110, 130, 80, 520, 24, 220, 140, 140].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setTabColor(OPEX_STIL.ikincil);
}

/* ---------- Personel ---------- */

function personeliKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.personel);
  var b = OpexMotor.BASLIKLAR.personel;
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
  sh.getRange(4, 6, alan, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(ss.getSheetByName(OPEX_SAYFA.tesvikler).getRange('A4:A60'), true).setAllowInvalid(false).build());
  sh.getRange(4, 7, alan, 1).setDataValidation(liste_(s.asgariDestek));
  if (n) onayKutusu_(sh.getRange(4, 8, n, 1), true);
  sh.getRange(4, 9, alan, 1).setFontColor(OPEX_STIL.ikincil).setWrap(true);
  sh.getRange('K1').setFormula(opexFormulu_('personel-sutun'));
  sh.getRange(4, 11, alan, 5).setBackground(OPEX_STIL.hesap).setNumberFormat(OPEX_BICIM.tl);
  bantla_(sh, n, 9);
  var izgaraKurallari = ayIzgarasiKur_(sh, OPEX_IZGARA.personel, n, alan, 'Net: net, Brüt: brüt, Asgari ücret: net, Freelancer: KDV dahil fatura; 0 = o ay ödeme yok', OPEX_BICIM.tl, personelVarsayilani_);
  var rules = [
    SpreadsheetApp.newConditionalFormatRule().setGradientMinpoint('#ffffff').setGradientMaxpoint('#fbd3c2').setRanges([sh.getRange(4, 12, alan, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A4<>"",$C4<>"Asgari ücret",OR($D4="",$D4=0))').setBackground(OPEX_STIL.uyari).setRanges([sh.getRange(4, 4, alan, 1)]).build(),
  ].concat(izgaraKurallari);
  sh.setConditionalFormatRules(rules);
  [230, 120, 170, 150, 100, 150, 170, 80, 280, 24, 150, 150, 170, 150, 170].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setFrozenColumns(1);
  sh.setTabColor(OPEX_STIL.seri[1]);
}

/* ---------- Giderler ---------- */

function giderleriKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.giderler);
  var b = OpexMotor.BASLIKLAR.giderler;
  girdiBasligi_(
    sh,
    'Giderler: teknoloji, ofis ve işletme (aylık)',
    'Döviz kalemleri Parametreler → USD/EUR kuruyla ₺’ye çevrilir. 2027 artış esası: Kur, Kira, Genel veya Yok. Personel giderleri Personel sayfasındadır.',
    [b.kalem, b.hesap, b.kume, b.kategori, b.para, b.tutar, b.artis, b.odendi, b.dahil, b.fatura, b.not],
    2,
    13,
  );
  var n = veriSatiriSayisi_(sh);
  if (n === 0 && typeof OPEX_TOHUM !== 'undefined' && OPEX_TOHUM.giderler && OPEX_TOHUM.giderler.length) {
    sh.getRange(4, 1, OPEX_TOHUM.giderler.length, 11).setValues(OPEX_TOHUM.giderler);
    n = OPEX_TOHUM.giderler.length;
  }
  var alan = Math.max(n, 1) + 20;
  var s = OpexMotor.SECENEKLER;
  sh.getRange(4, 3, alan, 1).setDataValidation(liste_(s.kume));
  sh.getRange(4, 4, alan, 1).setDataValidation(liste_(s.kategori, true));
  sh.getRange(4, 5, alan, 1).setDataValidation(liste_(s.para));
  sh.getRange(4, 6, alan, 1).setNumberFormat('#,##0.00');
  sh.getRange(4, 7, alan, 1).setDataValidation(liste_(s.artis));
  if (n) {
    onayKutusu_(sh.getRange(4, 8, n, 1), false);
    onayKutusu_(sh.getRange(4, 9, n, 1), true);
  }
  sh.getRange(4, 11, alan, 1).setFontColor(OPEX_STIL.ikincil).setWrap(true);
  sh.getRange('M1').setFormula(opexFormulu_('gider-sutun'));
  sh.getRange(4, 13, alan, 2).setBackground(OPEX_STIL.hesap).setNumberFormat(OPEX_BICIM.tl);
  bantla_(sh, n, 11);
  var izgaraKurallari = ayIzgarasiKur_(sh, OPEX_IZGARA.giderler, n, alan, 'satırın para biriminde, Para sütunu', '#,##0.00', giderVarsayilani_);
  var rules = [
    SpreadsheetApp.newConditionalFormatRule().setGradientMinpoint('#ffffff').setGradientMaxpoint('#cde2fb').setRanges([sh.getRange(4, 13, alan, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A4<>"",OR($F4="",$F4=0))').setBackground(OPEX_STIL.uyari).setRanges([sh.getRange(4, 6, alan, 1)]).build(),
  ].concat(izgaraKurallari);
  sh.setConditionalFormatRules(rules);
  [230, 230, 150, 160, 100, 130, 130, 100, 80, 200, 260, 24, 150, 150].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.setFrozenColumns(1);
  sh.setTabColor(OPEX_STIL.seri[0]);
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
  sh.getRange('A4').setFormula(opexFormulu_('bordro-2026'));
  sh.getRange('Q4').setFormula(opexFormulu_('bordro-2027'));
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
  korumaUyari_(sh, 'Bordro hesaplanır; değişiklik Personel ve Parametreler sayfasından yapılır.');
  sh.setTabColor(OPEX_STIL.seri[1]);
}

/* ---------- Hesap (pano ve grafik verisi) ---------- */

/** Rapor blokları: [rapor, başlangıç sütunu, sütun sayısı, biçimler]. Yan yana durur; satır sayısı değişse de çakışmaz. */
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

function blok_(rapor) {
  return OPEX_BLOKLAR.filter(function (b) { return b.rapor === rapor; })[0];
}

/** Hesap sayfasında bir bloğun A1 aralığı (ör. 'D1:J5'). */
function blokAraligi_(rapor, ilkSutun, sutunSayisi, satirSayisi) {
  var b = blok_(rapor);
  var bas = b.sutun + (ilkSutun || 0);
  var son = bas + (sutunSayisi || b.genislik) - 1;
  return sutunHarfi_(bas) + '1:' + sutunHarfi_(son) + (satirSayisi || 60);
}

function hesabiKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.hesap);
  sutunGarantile_(sh, 60);
  temelStil_(sh);
  OPEX_BLOKLAR.forEach(function (b) {
    sh.getRange(1, b.sutun).setFormula(opexFormulu_(b.rapor));
    sh.getRange(1, b.sutun, 1, b.genislik).setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff').setWrap(true);
    sh.getRange(2, b.sutun + 1, 59, Math.max(b.genislik - 1, 1)).setNumberFormat(OPEX_BICIM.tlYuvarlak);
    for (var i = 0; i < b.genislik; i++) sh.setColumnWidth(b.sutun + i, i === 0 ? 190 : 140);
    if (b.sutun + b.genislik <= sh.getMaxColumns()) sh.setColumnWidth(b.sutun + b.genislik, 24);
  });
  // Oranlar ve metinler
  var kpi = blok_('kpi').sutun + 1;
  sh.getRange(2, kpi).setNumberFormat('@');
  sh.getRange(10, kpi, 2, 1).setNumberFormat('0.00%');
  sh.getRange(12, kpi).setNumberFormat('@');
  sh.getRange(13, kpi, 2, 1).setNumberFormat(OPEX_BICIM.kur);
  sh.getRange(17, kpi).setNumberFormat('@');
  sh.getRange(18, kpi).setNumberFormat('0');
  sh.getRange(2, blok_('ozet').sutun + 6, 10, 1).setNumberFormat('0.0%');
  sh.getRange(2, blok_('kategori').sutun + 4, 40, 1).setNumberFormat('0.0%');
  sh.getRange(2, blok_('kisi').sutun + 9, 40, 1).setNumberFormat('0.0%');
  ['kisi', 'kategori', 'teknoloji'].forEach(function (r) {
    var b = blok_(r);
    sh.getRange(2, b.sutun + 1, 59, r === 'kisi' ? 2 : 1).setNumberFormat('@');
  });
  sh.setFrozenRows(1);
  korumaUyari_(sh, 'Pano ve grafik verisi; hesaplanır.');
  sh.setTabColor(OPEX_STIL.cizgi);
}

/* ---------- Pano ---------- */

function panoyuKur_(ss) {
  var sh = ss.getSheetByName(OPEX_SAYFA.pano);
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
  sh.clear();
  temelStil_(sh);
  sh.setHiddenGridlines(true);
  var sutun = 12;
  for (var c = 1; c <= sutun; c++) sh.setColumnWidth(c, 112);
  sh.getRange(1, 1, 175, sutun).setBackground(OPEX_STIL.zemin);

  sh.getRange('A1:L1').merge().setValue('iStoc · OPEX panosu').setFontSize(22).setFontWeight('bold');
  sh.getRange('A2:H2').merge().setValue('Teknoloji ve insan kümeleri + ofis/işletme. Google Sheets değişince GitHub Pages sayfası ≈15 sn içinde güncellenir.').setFontColor(OPEX_STIL.ikincil);
  sh.getRange('I2:L2').merge().setFormula('=IF(Hesap!B18>0,"⚠ "&Hesap!B18&" uyarı: Hesap sayfası, Uyarılar sütunu","Uyarı yok")').setFontColor(OPEX_STIL.ikincil).setHorizontalAlignment('right');
  sh.setRowHeight(1, 46);
  sh.setRowHeight(2, 30);

  var kpi = function (satir, sutunBas, etiket, formul, not, bicim) {
    var genis = 3;
    sh.getRange(satir, sutunBas, 3, genis).setBackground(OPEX_STIL.yuzey);
    sh.getRange(satir, sutunBas, 1, genis).merge().setValue(etiket).setFontColor(OPEX_STIL.ikincil);
    sh.getRange(satir + 1, sutunBas, 1, genis).merge().setFormula(formul).setFontSize(22).setFontWeight('bold').setNumberFormat(bicim || OPEX_BICIM.tlYuvarlak);
    var n = sh.getRange(satir + 2, sutunBas, 1, genis).merge().setFontColor(OPEX_STIL.ikincil);
    if (/^=/.test(not)) n.setFormula(not);
    else n.setValue(not);
    sh.getRange(satir, sutunBas, 1, genis).setBorder(true, null, null, null, null, null, OPEX_STIL.vurgu, SpreadsheetApp.BorderStyle.SOLID_THICK);
  };
  // Hesap!B2… = kpi bloğunun değer sütunu (satır sırası Motor.rapor('kpi') ile aynı).
  kpi(4, 1, 'Bu ay toplam OPEX', '=Hesap!B3', '=Hesap!B2');
  kpi(4, 4, 'Teknoloji', '=Hesap!B4', 'Yapay zekâ, sunucu, lisans');
  kpi(4, 7, 'Personel', '=Hesap!B5', 'Bordro işveren maliyeti + freelancer');
  kpi(4, 10, 'Ofis ve işletme', '=Hesap!B6', 'Kira, faturalar, ofis ihtiyaçları');
  kpi(8, 1, '2027 aylık ortalama', '=Hesap!B8', '="2027 yıllık: "&FIXED(Hesap!B9,0)&" ₺"');
  kpi(8, 4, '2027 değişim (aylık ort.)', '=Hesap!B10', '2026 aylık ortalamasına göre', '+0.0%;-0.0%;0.0%');
  kpi(8, 7, 'Uygulanan 2027 zammı', '=Hesap!B11', '=Hesap!B12', '0.00%');
  kpi(8, 10, 'USD/TRY · EUR/TRY', '=Hesap!B13', '="EUR/TRY "&FIXED(Hesap!B14,4)', '#,##0.0000');
  [5, 9].forEach(function (r) { sh.setRowHeight(r, 44); });

  sh.getRange('A12').setValue('Küme özeti').setFontSize(14).setFontWeight('bold');
  sh.getRange('A13').setFormula('=ARRAYFORMULA(Hesap!' + blokAraligi_('ozet', 0, 7, 5) + ')');
  sh.getRange('A13:G13').setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff').setWrap(true);
  sh.getRange('A14:G17').setBackground(OPEX_STIL.yuzey);
  sh.getRange('B14:F17').setNumberFormat(OPEX_BICIM.tlYuvarlak);
  sh.getRange('G14:G17').setNumberFormat('+0.0%;-0.0%;0.0%');
  sh.getRange('A17:G17').setFontWeight('bold');

  sh.getRange('I12').setValue('Bordro köprüsü (bu ay)').setFontSize(14).setFontWeight('bold');
  sh.getRange('I13').setFormula('=ARRAYFORMULA(Hesap!' + blokAraligi_('kopru', 0, 2, 9) + ')');
  sh.getRange('I13:J13').setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff');
  sh.getRange('I14:J21').setBackground(OPEX_STIL.yuzey);
  sh.getRange('J14:J21').setNumberFormat(OPEX_BICIM.tlYuvarlak);
  sh.getRange('I18:J18').setFontWeight('bold');
  sh.getRange('I21:J21').setFontWeight('bold');
  sh.setColumnWidth(9, 200);

  sh.getRange('A24').setValue('Grafikler').setFontSize(14).setFontWeight('bold');
  // 12 aylık plan tablosu: 9. grafiğin (plan) yanında.
  var planSatir = 25 + 4 * 21;
  sh.getRange(planSatir - 1, 7).setValue('12 aylık plan').setFontSize(14).setFontWeight('bold');
  sh.getRange(planSatir, 7).setFormula('=ARRAYFORMULA(Hesap!' + blokAraligi_('plan', 0, 5, 14) + ')');
  sh.getRange(planSatir, 7, 1, 5).setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff').setWrap(true);
  sh.getRange(planSatir + 1, 7, 13, 5).setBackground(OPEX_STIL.yuzey);
  sh.getRange(planSatir + 1, 8, 13, 4).setNumberFormat(OPEX_BICIM.tlYuvarlak);
  sh.getRange(planSatir + 13, 7, 1, 5).setFontWeight('bold');
  var kisiSatir = 24 + 5 * 21 + 2;
  sh.getRange(kisiSatir, 1).setValue('Kişiler: bu ay ve 2027').setFontSize(14).setFontWeight('bold');
  var b = blok_('kisi');
  var bas = sutunHarfi_(b.sutun);
  var son = sutunHarfi_(b.sutun + b.genislik - 1);
  sh.getRange(kisiSatir + 1, 1).setFormula('=FILTER(Hesap!' + bas + '1:' + son + '60,Hesap!' + bas + '1:' + bas + '60<>"")');
  sh.getRange(kisiSatir + 1, 1, 1, 10).setFontWeight('bold').setBackground(OPEX_STIL.murekkep).setFontColor('#ffffff').setWrap(true);
  sh.getRange(kisiSatir + 2, 1, 30, 10).setBackground(OPEX_STIL.yuzey);
  sh.getRange(kisiSatir + 2, 4, 30, 6).setNumberFormat(OPEX_BICIM.tlYuvarlak);
  sh.getRange(kisiSatir + 2, 10, 30, 1).setNumberFormat('0.0%');
  sh.setRowHeight(kisiSatir + 1, 40);
  korumaUyari_(sh, 'Pano hesaplanır; değişiklik girdi sayfalarından yapılır.');
  sh.setTabColor(OPEX_STIL.vurgu);
}

/** Pano grafiklerini siler ve Hesap bloklarından yeniden çizer (Google Sheets grafikleri). */
function panoyuCiz() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(OPEX_SAYFA.pano);
  var hs = ss.getSheetByName(OPEX_SAYFA.hesap);
  if (!sh || !hs) return;
  sh.getCharts().forEach(function (c) { sh.removeChart(c); });
  var aralik = function (rapor, ilk, kac, satir) { return hs.getRange(blokAraligi_(rapor, ilk, kac, satir)); };
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
