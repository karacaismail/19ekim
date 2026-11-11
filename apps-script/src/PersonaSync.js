/**
 * Persona ayarları eşitlemesi (satış hesaplayıcısı, iki proje).
 *
 * Sözleşme: .pane/prompts/persona-sync-sozlesme.md. Gövde text/plain JSON:
 *   {service:'persona', action:'read'|'patch', project:'istoc'|'segika', key, knownRevision?, operationId?,
 *    changes?:[{field, before, value}]}
 * Erişim modu ScriptProperties → PERSONA_ACCESS ile açıkça seçilir:
 *   'key' (varsayılan, tanımsız ya da bilinmeyen değer de budur): PERSONA_ERISIM_ANAHTARI gerekir; anahtar yoksa ya da
 *   yanlışsa veri, revizyon veya alan adı dönmez.
 *   'development-public': geliştirme dönemi için anahtarsız okuma ve yazma. Yazma yine yalnız şemadaki alanlara,
 *   doğrulanmış değerlerle yapılır. Bu mod gizlilik sağlamaz; üretim için gizli erişim iddiası taşımaz.
 * OPEX'in “Herkese açık” ayarı burada hiç okunmaz.
 * Tablo: yalnız “Persona Ayarları” sekmesi okunur ve yazılır; OPEX sekmelerine dokunulmaz.
 *
 * Saf çekirdek (PersonaCekirdek) Apps Script hizmetlerini kullanmaz; Node testleri aynı dosyayı çalıştırır.
 * PERSONA_SEMASI paketleme sırasında src/data/personaFields.ts dosyasından üretilir (apps-script/persona-build.mjs).
 */

var PERSONA_SEKME = 'Persona Ayarları';
var PERSONA_BASLIK = ['Proje', 'Alan', 'Açıklama', 'Değer', 'Son değişiklik', 'İşlem kimliği'];
var PERSONA_ANAHTAR_OZELLIGI = 'PERSONA_ERISIM_ANAHTARI';
var PERSONA_ERISIM_MODU_OZELLIGI = 'PERSONA_ACCESS';
var PERSONA_ACIK_MOD = 'development-public';
var PERSONA_TABLO_OZELLIGI = 'PERSONA_TABLO_KIMLIGI';
var PERSONA_ZAMAN_OZELLIGI = 'PERSONA_SON_YAZIM_';
var PERSONA_ISLEM_SURESI_SN = 6 * 60 * 60;
var PERSONA_KILIT_MS = 10000;
/** Kalıcı işlem defteri: aynı tablodaki ayrı sekme. Veri yazımıyla aynı atomik toplu istekte kayıt eklenir. */
var PERSONA_DEFTER = 'Persona İşlemleri';
var PERSONA_DEFTER_BASLIK = ['Zaman', 'Proje', 'İşlem kimliği', 'İmza', 'Sonuç'];
/**
 * Defter kapasitesi. Tamamlanmış işlem kayıtları HİÇ silinmez (silmek eski kimliğin yeni işlem sayılmasına, yani ABA
 * açığına yol açar). Defter dolunca yeni yazı güvenle reddedilir; eski kimliklerin tekrarı yine tanınır.
 */
var PERSONA_DEFTER_SINIRI = 50000;

var PersonaCekirdek = (function () {
  var PROJELER = ['istoc', 'segika'];
  var YASAK_PARCA = { __proto__: true, constructor: true, prototype: true };
  var ALAN_RE = /^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)*$/;
  var ISLEM_RE = /^[A-Za-z0-9_-]{8,64}$/;
  var EN_UZUN_METIN = 80;
  var EN_COK_DEGISIKLIK = 200;

  var sahip = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  function alanAdiGecerli(ad) {
    if (typeof ad !== 'string' || ad.length > 120 || !ALAN_RE.test(ad)) return false;
    var parcalar = ad.split('.');
    for (var i = 0; i < parcalar.length; i++) if (sahip(YASAK_PARCA, parcalar[i]) || parcalar[i] === '__proto__') return false;
    return true;
  }

  /** Şema → {proje: {alan: tanım}}. Bozuk şema kurulum hatasıdır. */
  function semaKur(liste) {
    if (!Array.isArray(liste) || !liste.length) throw new Error('Persona şeması boş.');
    var sonuc = { istoc: Object.create(null), segika: Object.create(null) };
    liste.forEach(function (t) {
      if (!t || !alanAdiGecerli(t.field)) throw new Error('Şemada geçersiz alan adı.');
      if (t.type !== 'number' && t.type !== 'string') throw new Error('Şemada geçersiz tür: ' + t.field);
      (t.projects || PROJELER).forEach(function (p) {
        if (PROJELER.indexOf(p) < 0) throw new Error('Şemada geçersiz proje: ' + t.field);
        if (sonuc[p][t.field]) throw new Error('Şemada tekrar eden alan: ' + t.field);
        var v = t.default && sahip(t.default, p) ? t.default[p] : undefined;
        if (v === undefined || !degerGecerli(t, v)) throw new Error('Şemada geçersiz varsayılan: ' + p + ' ' + t.field);
        sonuc[p][t.field] = t;
      });
    });
    return sonuc;
  }

  function degerGecerli(t, v) {
    if (t.type === 'number') {
      if (typeof v !== 'number' || !isFinite(v)) return false;
      if (t.integer && Math.floor(v) !== v) return false;
      if (typeof t.min === 'number' && v < t.min) return false;
      if (typeof t.max === 'number' && v > t.max) return false;
      return !t.options || t.options.indexOf(v) >= 0;
    }
    if (typeof v !== 'string' || v.length > EN_UZUN_METIN) return false;
    return !t.options || t.options.indexOf(v) >= 0;
  }

  function esit(a, b) { return typeof a === typeof b && a === b; }

  /**
   * Tablo satırları → proje alanları. Satırı olmayan alan varsayılanı alır. Bilinmeyen satırlar yok sayılır
   * (eski alan kalıntısı veri döndürmez). Şemaya uymayan hücre `gecersiz` listesine girer.
   */
  function alanlariTopla(sema, proje, satirlar) {
    var tanimlar = sema[proje];
    var alanlar = Object.create(null);
    var konum = Object.create(null);
    var gecersiz = [];
    Object.keys(tanimlar).forEach(function (ad) { alanlar[ad] = tanimlar[ad].default[proje]; });
    satirlar.forEach(function (s) {
      if (s.proje !== proje || !tanimlar[s.alan]) return;
      if (konum[s.alan] !== undefined) { gecersiz.push(s.alan); return; }
      konum[s.alan] = s.satir;
      if (s.deger === '' || s.deger === null || s.deger === undefined) return;
      if (degerGecerli(tanimlar[s.alan], s.deger)) alanlar[s.alan] = s.deger;
      else gecersiz.push(s.alan);
    });
    return { alanlar: alanlar, konum: konum, gecersiz: gecersiz.filter(function (x, i, d) { return d.indexOf(x) === i; }) };
  }

  /** Sıralı alan değerlerinin kanonik metni (revizyon özeti için). */
  function kanonik(alanlar) {
    return JSON.stringify(Object.keys(alanlar).sort().map(function (k) { return [k, alanlar[k]]; }));
  }

  function nesne(alanlar) {
    var o = {};
    Object.keys(alanlar).sort().forEach(function (k) { o[k] = alanlar[k]; });
    return o;
  }

  /** İsteğin biçimi. Yetkiden önce yalnız zararsız biçim denetlenir; ayrıntılı alan hatası yetkiden sonra döner. */
  function istekBicimi(istek) {
    if (!istek || typeof istek !== 'object' || Array.isArray(istek)) return 'İstek gövdesi nesne olmalı.';
    if (istek.service !== 'persona') return 'Hizmet persona olmalı.';
    if (istek.action !== 'read' && istek.action !== 'patch') return 'İşlem read veya patch olmalı.';
    if (PROJELER.indexOf(istek.project) < 0) return 'Proje istoc veya segika olmalı.';
    if (istek.key !== undefined && typeof istek.key !== 'string') return 'Erişim anahtarı metin olmalı.';
    return null;
  }

  /** Yama değişikliklerini doğrular: {hata, gecersiz} ya da {degisiklikler}. */
  function degisiklikleriDogrula(sema, proje, istek) {
    var liste = istek.changes;
    if (!Array.isArray(liste) || !liste.length) return { hata: 'Değişiklik listesi boş.', gecersiz: [] };
    if (liste.length > EN_COK_DEGISIKLIK) return { hata: 'Tek istekte çok fazla değişiklik var.', gecersiz: [] };
    if (typeof istek.operationId !== 'string' || !ISLEM_RE.test(istek.operationId)) return { hata: 'İşlem kimliği geçersiz.', gecersiz: [] };
    var tanimlar = sema[proje];
    var gecersiz = [];
    var gorulen = Object.create(null);
    liste.forEach(function (d) {
      var ad = d && d.field;
      if (!d || typeof d !== 'object' || !alanAdiGecerli(ad) || !tanimlar[ad] || gorulen[ad]) {
        gecersiz.push(typeof ad === 'string' && alanAdiGecerli(ad) ? ad : '?');
        return;
      }
      gorulen[ad] = true;
      if (!sahip(d, 'before') || !sahip(d, 'value')) { gecersiz.push(ad); return; }
      if (typeof d.before !== (tanimlar[ad].type === 'number' ? 'number' : 'string')) { gecersiz.push(ad); return; }
      if (!degerGecerli(tanimlar[ad], d.value)) gecersiz.push(ad);
    });
    if (gecersiz.length) return { hata: 'Geçersiz alan veya değer.', gecersiz: gecersiz };
    return { degisiklikler: liste.map(function (d) { return { field: d.field, before: d.before, value: d.value }; }) };
  }

  /**
   * Karşılaştır ve yaz kararı. Her alan ayrı denetlenir: güncel = before → yaz, güncel = value → zaten uygulanmış,
   * başka değer → çakışma. Tek çakışma bile varsa hiçbir alan yazılmaz.
   */
  function yamaKarari(alanlar, degisiklikler) {
    var yaz = [];
    var cakisma = [];
    degisiklikler.forEach(function (d) {
      var guncel = alanlar[d.field];
      if (esit(guncel, d.value)) return;
      if (esit(guncel, d.before)) yaz.push(d);
      else cakisma.push(d.field);
    });
    return cakisma.length ? { cakisma: cakisma, yaz: [] } : { cakisma: [], yaz: yaz };
  }

  /** Aynı işlem kimliğinin aynı değişikliklerle geldiğini anlamak için kanonik metin. */
  function degisiklikImzasi(proje, degisiklikler) {
    return JSON.stringify([proje, degisiklikler.map(function (d) { return [d.field, d.before, d.value]; }).sort(function (a, b) {
      return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
    })]);
  }

  /** Sabit süreli metin karşılaştırması (eşit uzunlukta). Uzunluk gizli değildir. */
  /** Sunucu özelliğindeki mod: yalnız tam 'development-public' açık moddur; geri kalan her şey anahtarlı moddur. */
  function erisimModu(deger) {
    return deger === 'development-public' ? 'development-public' : 'key';
  }

  function anahtarEsit(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || !a.length || a.length !== b.length) return false;
    var fark = 0;
    for (var i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return fark === 0;
  }

  return {
    PROJELER: PROJELER,
    alanAdiGecerli: alanAdiGecerli,
    semaKur: semaKur,
    degerGecerli: degerGecerli,
    alanlariTopla: alanlariTopla,
    kanonik: kanonik,
    nesne: nesne,
    istekBicimi: istekBicimi,
    degisiklikleriDogrula: degisiklikleriDogrula,
    yamaKarari: yamaKarari,
    degisiklikImzasi: degisiklikImzasi,
    anahtarEsit: anahtarEsit,
    erisimModu: erisimModu,
  };
})();

/* ---------- Apps Script bağlantısı ---------- */

var personaSemasi_ = null;
function personaSema_() {
  if (!personaSemasi_) personaSemasi_ = PersonaCekirdek.semaKur(typeof PERSONA_SEMASI !== 'undefined' ? PERSONA_SEMASI : null);
  return personaSemasi_;
}

function personaJson_(nesne) {
  return ContentService.createTextOutput(JSON.stringify(nesne)).setMimeType(ContentService.MimeType.JSON);
}

function personaHata_(code, message, ek) {
  var o = { ok: false, code: code, message: message };
  if (ek) Object.keys(ek).forEach(function (k) { o[k] = ek[k]; });
  return o;
}

/** Tablo: bağlı projede etkin tablo, ayrı projede ScriptProperties'teki kimlik. Kimlik repoya yazılmaz. */
function personaTablo_() {
  var kimlik = PropertiesService.getScriptProperties().getProperty(PERSONA_TABLO_OZELLIGI);
  if (kimlik) return SpreadsheetApp.openById(kimlik);
  var etkin = SpreadsheetApp.getActiveSpreadsheet();
  if (!etkin) throw new Error('Tablo kimliği tanımlı değil.');
  return etkin;
}

function personaSekmesi_(ss) {
  var sh = ss.getSheetByName(PERSONA_SEKME);
  if (!sh) return null;
  var baslik = sh.getRange(1, 1, 1, PERSONA_BASLIK.length).getValues()[0];
  for (var i = 0; i < PERSONA_BASLIK.length; i++) if (String(baslik[i]).trim() !== PERSONA_BASLIK[i]) throw new Error('Persona sekmesinin başlığı beklenen düzende değil.');
  return sh;
}

/** Persona sekmesini açar ve şema verilirse iki projenin bütün alanlarını şemadaki varsayılanlarla yazar. */
function personaSekmeOlustur_(ss, sema) {
  var sh = ss.insertSheet(PERSONA_SEKME);
  sh.getRange(1, 1, 1, PERSONA_BASLIK.length).setValues([PERSONA_BASLIK]).setFontWeight('bold');
  sh.setFrozenRows(1);
  if (sema) personaEksikSatirlariYaz_(sh, sema);
  return sh;
}

/** Yalnız eksik persona satırlarını varsayılanlarla ekler; var olan değerlere dokunmaz. Eklenen satır sayısını döndürür. */
function personaEksikSatirlariYaz_(sh, sema) {
  var var_ = Object.create(null);
  personaSatirlari_(sh).forEach(function (s) { var_[s.proje + '|' + s.alan] = true; });
  var ekle = [];
  PersonaCekirdek.PROJELER.forEach(function (p) {
    Object.keys(sema[p]).forEach(function (ad) {
      if (!var_[p + '|' + ad]) ekle.push([p, ad, sema[p][ad].label || ad, sema[p][ad].default[p], '', '']);
    });
  });
  if (ekle.length) sh.getRange(sh.getLastRow() + 1, 1, ekle.length, PERSONA_BASLIK.length).setValues(ekle);
  return ekle.length;
}

function personaSatirlari_(sh) {
  var son = sh.getLastRow();
  if (son < 2) return [];
  return sh.getRange(2, 1, son - 1, 4).getValues().map(function (r, i) {
    return { satir: i + 2, proje: String(r[0]).trim(), alan: String(r[1]).trim(), deger: r[3] };
  });
}

function personaRevizyon_(alanlar) {
  var ozet = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, PersonaCekirdek.kanonik(alanlar), Utilities.Charset.UTF_8);
  return ozet.slice(0, 8).map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function personaAnlik_(sema, proje, sh, props) {
  var t = PersonaCekirdek.alanlariTopla(sema, proje, sh ? personaSatirlari_(sh) : []);
  return {
    toplu: t,
    // updatedAt: bu servisin bu projeye son yazdığı an (yoksa boş). Tablodaki elle düzenleme bu zamanı değiştirmez;
    // bu yüzden ayrı readAt (sunucunun okuduğu an) döner. Arayüz readAt'i “son kontrol” olarak gösterir.
    snapshot: { revision: personaRevizyon_(t.alanlar), fields: PersonaCekirdek.nesne(t.alanlar), updatedAt: props.getProperty(PERSONA_ZAMAN_OZELLIGI + proje) || '', readAt: new Date().toISOString() },
  };
}

/** Sözleşmenin tek giriş noktası: nesne döndürür (ContentService sarmalı çağırana aittir). */
function personaYanit_(istek) {
  var props = personaYapilandir_();
  var mod = PersonaCekirdek.erisimModu(props.getProperty(PERSONA_ERISIM_MODU_OZELLIGI));
  var bicim = PersonaCekirdek.istekBicimi(istek);
  if (bicim) return personaHata_(mod === PERSONA_ACIK_MOD || (istek && istek.key) ? 'invalid' : 'auth', bicim, { access: mod });
  if (mod !== PERSONA_ACIK_MOD) {
    var gercek = props.getProperty(PERSONA_ANAHTAR_OZELLIGI);
    if (!gercek) return personaHata_('unavailable', 'Persona erişim anahtarı tanımlı değil.', { access: mod });
    if (!PersonaCekirdek.anahtarEsit(istek.key || '', gercek)) return personaHata_('auth', 'Erişim anahtarı geçersiz.', { access: mod });
  }
  var sonuc = personaIslem_(istek, props);
  sonuc.access = mod;
  return sonuc;
}

/** Sağlık ve hazır olma bilgisi: yalnız hizmet adı ve erişim modu döner; veri, revizyon veya alan adı dönmez. */
function personaHazirlik_() {
  var props = personaYapilandir_();
  return { ok: true, service: 'persona', access: PersonaCekirdek.erisimModu(props.getProperty(PERSONA_ERISIM_MODU_OZELLIGI)) };
}

/**
 * Dağıtılan pakette PERSONA_KURULUM varsa ve sunucu özellikleri boşsa bir kez özelliklere yazar. Yalnız izinli
 * anahtarlar ve değerler alınır; istekten hiçbir yapılandırma alınmaz. PERSONA_KURULUM repoya girmez (persona-build.mjs).
 */
function personaYapilandir_() {
  var props = PropertiesService.getScriptProperties();
  if (typeof PERSONA_KURULUM === 'undefined' || !PERSONA_KURULUM || props.getProperty(PERSONA_ERISIM_MODU_OZELLIGI)) return props;
  var yaz = {};
  var mod = PERSONA_KURULUM.access;
  if (mod === PERSONA_ACIK_MOD || mod === 'key') yaz[PERSONA_ERISIM_MODU_OZELLIGI] = mod;
  var tablo = PERSONA_KURULUM.spreadsheetId;
  if (typeof tablo === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(tablo) && !props.getProperty(PERSONA_TABLO_OZELLIGI)) yaz[PERSONA_TABLO_OZELLIGI] = tablo;
  if (Object.keys(yaz).length) props.setProperties(yaz);
  return props;
}

function personaIslem_(istek, props) {

  var sema;
  try {
    sema = personaSema_();
  } catch (hata) {
    console.log('Persona şeması: ' + hata);
    return personaHata_('unavailable', 'Persona şeması yüklenemedi.');
  }
  var proje = istek.project;
  if (istek.action === 'read') return personaOku_(sema, proje, istek, props);
  return personaYama_(sema, proje, istek, props);
}

function personaOku_(sema, proje, istek, props) {
  var sh;
  try {
    sh = personaSekmesi_(personaTablo_());
  } catch (hata) {
    console.log('Persona okuma: ' + hata);
    return personaHata_('unavailable', 'Persona sekmesi okunamadı.');
  }
  var a = personaAnlik_(sema, proje, sh, props);
  if (a.toplu.gecersiz.length) return personaHata_('invalid', 'Tablodaki bazı hücreler geçersiz.', { invalidFields: a.toplu.gecersiz });
  var o = { ok: true, revision: a.snapshot.revision, fields: a.snapshot.fields, updatedAt: a.snapshot.updatedAt, readAt: a.snapshot.readAt };
  if (istek.knownRevision && istek.knownRevision === o.revision) o.unchanged = true;
  return o;
}

/**
 * Aynı işlem kimliğinin tekrarı: hiçbir şey yazılmaz. Yanıt, işlemin daha önce alındığını bildirir ve GÜNCEL tabloyu
 * taşır; böylece arada başka biri bir alanı değiştirdiyse istemci eski değeri geri getirmez.
 */
function personaTekrar_(sema, proje, istek, props, kayitImza, imza, sh) {
  if (kayitImza !== imza) return personaHata_('invalid', 'Bu işlem kimliği başka değişikliklerle kullanıldı.');
  if (sh === undefined) {
    try {
      sh = personaSekmesi_(personaTablo_());
    } catch (hata) {
      console.log('Persona tekrar: ' + hata);
      return personaHata_('unavailable', 'Persona sekmesi okunamadı.');
    }
  }
  var a = personaAnlik_(sema, proje, sh, props);
  if (a.toplu.gecersiz.length) return personaHata_('invalid', 'Tablodaki bazı hücreler geçersiz.', { invalidFields: a.toplu.gecersiz });
  return { ok: true, duplicate: true, operationId: istek.operationId, revision: a.snapshot.revision, fields: a.snapshot.fields, updatedAt: a.snapshot.updatedAt, readAt: a.snapshot.readAt };
}

/** Değişiklik imzasının kısa özeti (defterde ve önbellekte saklanır; değerleri açık taşımaz). */
function personaImzaOzeti_(imza) {
  return personaRevizyon_({ imza: imza });
}

function personaDefter_(ss) {
  var sh = ss.getSheetByName(PERSONA_DEFTER);
  if (!sh) {
    sh = ss.insertSheet(PERSONA_DEFTER);
    sh.getRange(1, 1, 1, PERSONA_DEFTER_BASLIK.length).setValues([PERSONA_DEFTER_BASLIK]).setFontWeight('bold');
    sh.setFrozenRows(1);
    return sh;
  }
  var baslik = sh.getRange(1, 1, 1, PERSONA_DEFTER_BASLIK.length).getValues()[0];
  for (var i = 0; i < PERSONA_DEFTER_BASLIK.length; i++) if (String(baslik[i]).trim() !== PERSONA_DEFTER_BASLIK[i]) throw new Error('Persona işlem defterinin başlığı beklenen düzende değil.');
  return sh;
}

/** Defterde bu projenin bu işlem kimliği varsa imza özetini döndürür; yoksa null. */
function personaDefterBul_(defter, proje, islem) {
  var son = defter.getLastRow();
  if (son < 2) return null;
  var satirlar = defter.getRange(2, 2, son - 1, 3).getValues();
  for (var i = satirlar.length - 1; i >= 0; i--) {
    if (String(satirlar[i][0]) === proje && String(satirlar[i][1]) === islem) return String(satirlar[i][2]);
  }
  return null;
}

function personaHucre_(v) {
  return { userEnteredValue: typeof v === 'number' ? { numberValue: v } : { stringValue: String(v) } };
}

function personaSatirVerisi_(degerler) {
  return { values: degerler.map(personaHucre_) };
}

function personaYama_(sema, proje, istek, props) {
  var d = PersonaCekirdek.degisiklikleriDogrula(sema, proje, istek);
  if (d.hata) return personaHata_('invalid', d.hata, d.gecersiz.length ? { invalidFields: d.gecersiz } : null);
  var imza = personaImzaOzeti_(PersonaCekirdek.degisiklikImzasi(proje, d.degisiklikler));
  var onbellek = CacheService.getScriptCache();
  var islemAnahtari = 'persona-islem:' + proje + ':' + istek.operationId;
  var onceki = onbellek.get(islemAnahtari);
  if (onceki) return personaTekrar_(sema, proje, istek, props, onceki, imza);

  var kilit = LockService.getScriptLock();
  if (!kilit.tryLock(PERSONA_KILIT_MS)) return personaHata_('busy', 'Başka bir kayıt sürüyor. Aynı işlem kimliğiyle yeniden deneyin.');
  try {
    var ss, sh, defter;
    try {
      ss = personaTablo_();
      // İlk yazmada persona sekmesi şema varsayılanlarıyla açılır; defter sekmesi ayrıca açılır. İkisi de yalnız
      // persona verisi taşır; OPEX sekmelerine dokunulmaz.
      sh = personaSekmesi_(ss) || personaSekmeOlustur_(ss, sema);
      defter = personaDefter_(ss);
    } catch (hata) {
      console.log('Persona yazma: ' + hata);
      return personaHata_('unavailable', 'Persona sekmesi okunamadı.');
    }
    // Kalıcı defter: önbellek silinse ve tablo elle eski değere dönse de aynı işlem bir daha yazılmaz.
    var defterImza = personaDefterBul_(defter, proje, istek.operationId);
    if (defterImza !== null) return personaTekrar_(sema, proje, istek, props, defterImza, imza, sh);

    if (defter.getLastRow() - 1 >= PERSONA_DEFTER_SINIRI) return personaHata_('unavailable', 'İşlem defteri dolu. Yeni kayıt alınmadı. Tablo sahibine bildirin.');

    var a = personaAnlik_(sema, proje, sh, props);
    if (a.toplu.gecersiz.length) return personaHata_('invalid', 'Tablodaki bazı hücreler geçersiz.', { invalidFields: a.toplu.gecersiz });
    var karar = PersonaCekirdek.yamaKarari(a.toplu.alanlar, d.degisiklikler);
    if (karar.cakisma.length) return personaHata_('conflict', 'Bazı alanlar başka bir kayıtla değişmiş.', { conflicts: karar.cakisma, snapshot: a.snapshot });

    // Tek atomik toplu istek: yalnız değişen değer, zaman ve işlem kimliği hücreleri, yeni satırlar ve defter kaydı.
    // Biri geçersizse hiçbiri uygulanmaz. Başka satırlara, projelere ve sekmelere dokunulmaz.
    var zaman = new Date().toISOString();
    var veriKimligi = sh.getSheetId();
    var istekler = [];
    var yeniSatirlar = [];
    karar.yaz.forEach(function (c) {
      var satir = a.toplu.konum[c.field];
      if (satir) {
        istekler.push({ updateCells: { start: { sheetId: veriKimligi, rowIndex: satir - 1, columnIndex: 3 }, rows: [personaSatirVerisi_([c.value, zaman, istek.operationId])], fields: 'userEnteredValue' } });
      } else {
        yeniSatirlar.push(personaSatirVerisi_([proje, c.field, sema[proje][c.field].label || c.field, c.value, zaman, istek.operationId]));
      }
    });
    if (yeniSatirlar.length) istekler.push({ appendCells: { sheetId: veriKimligi, rows: yeniSatirlar, fields: 'userEnteredValue' } });
    istekler.push({ appendCells: { sheetId: defter.getSheetId(), rows: [personaSatirVerisi_([zaman, proje, istek.operationId, imza, karar.yaz.length ? 'yazıldı' : 'değişiklik yok'])], fields: 'userEnteredValue' } });
    try {
      Sheets.Spreadsheets.batchUpdate({ requests: istekler }, ss.getId());
    } catch (hata) {
      console.log('Persona toplu yazım: ' + hata);
      // Yanıt kaybolmuş olabilir: yazım gerçekleşmiş de olabilir. Tekrar defterden tanınır, çift yazım olmaz.
      return personaHata_('unavailable', 'Kayıt sonucu doğrulanamadı. Aynı işlem kimliğiyle yeniden deneyin.');
    }
    karar.yaz.forEach(function (c) { a.toplu.alanlar[c.field] = c.value; });
    if (karar.yaz.length) props.setProperty(PERSONA_ZAMAN_OZELLIGI + proje, zaman);

    var yanit = {
      ok: true,
      revision: personaRevizyon_(a.toplu.alanlar),
      fields: PersonaCekirdek.nesne(a.toplu.alanlar),
      updatedAt: karar.yaz.length ? zaman : a.snapshot.updatedAt,
      readAt: new Date().toISOString(),
      operationId: istek.operationId,
    };
    if (!karar.yaz.length) yanit.unchanged = true;
    // Önbellekte yalnız imza özeti durur; eski anlık görüntü saklanmaz. Kalıcı kaynak defterdir.
    onbellek.put(islemAnahtari, imza, PERSONA_ISLEM_SURESI_SN);
    return yanit;
  } finally {
    kilit.releaseLock();
  }
}

/* ---------- Sahibin düzenleyicide çalıştırdığı kurulum işlevleri ---------- */

/**
 * Yeni erişim anahtarı üretir ve ScriptProperties'e kaydeder. Değer günlüğe yazılmaz, işlev değer döndürmez.
 * Eski anahtar hemen geçersiz olur. Sahip değeri yalnız düzenleyicide “Proje ayarları → Komut dosyası özellikleri”
 * ekranında görür (bu ekranı yalnız proje düzenleyicileri açabilir). Tabloya bağlı projede ayrıca pencerede gösterilir.
 */
function personaAnahtariniUret() {
  var ham = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
  var ozet = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ham, Utilities.Charset.UTF_8);
  var anahtar = Utilities.base64EncodeWebSafe(ozet).replace(/=+$/, '');
  PropertiesService.getScriptProperties().setProperty(PERSONA_ANAHTAR_OZELLIGI, anahtar);
  try {
    var html = HtmlService.createHtmlOutput('<p style="font-family:sans-serif">Yeni persona erişim anahtarı. Bu pencereyi kapatınca anahtar bir daha gösterilmez.</p><pre style="font-size:16px;user-select:all">' + anahtar + '</pre>').setWidth(520).setHeight(180);
    SpreadsheetApp.getUi().showModalDialog(html, 'Persona erişim anahtarı');
  } catch (hata) {
    console.log('Persona erişim anahtarı yenilendi. Değeri Proje ayarları → Komut dosyası özellikleri ekranında görün.');
  }
}

/**
 * Yalnız “Persona Ayarları” sekmesini kurar: yoksa ekler, başlığı ve eksik satırları (varsayılanlarla) yazar.
 * Var olan değerlere ve OPEX sekmelerine dokunmaz. Tekrar çalıştırılabilir.
 */
function personaSekmesiniKur() {
  var sema = personaSema_();
  var kilit = LockService.getScriptLock();
  kilit.waitLock(30000);
  try {
    var ss = personaTablo_();
    var sh = ss.getSheetByName(PERSONA_SEKME);
    if (sh) personaSekmesi_(ss);
    else sh = personaSekmeOlustur_(ss, null);
    return personaEksikSatirlariYaz_(sh, sema);
  } finally {
    kilit.releaseLock();
  }
}
