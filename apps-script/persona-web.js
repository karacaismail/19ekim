/**
 * Ayrı persona web uygulamasının giriş noktası. Yalnız persona-build.mjs paketine girer, OPEX paketine girmez.
 * OPEX doPost işlevine dokunmaz: bu dosya ayrı bir Apps Script projesinde çalışır.
 */

/** Sağlık ve hazır olma denetimi: yalnız hizmet adı ve erişim modu; veri, alan adı veya revizyon döndürmez. */
function doGet() {
  try {
    return personaJson_(personaHazirlik_());
  } catch (hata) {
    console.log('Persona hazırlık: ' + hata);
    return personaJson_(personaHata_('unavailable', 'Servis geçici olarak yanıt veremedi.'));
  }
}

function doPost(e) {
  var istek;
  try {
    istek = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (hata) {
    return personaJson_(personaHata_('invalid', 'İstek gövdesi JSON değil.'));
  }
  try {
    return personaJson_(personaYanit_(istek));
  } catch (hata) {
    console.log('Persona isteği: ' + hata);
    return personaJson_(personaHata_('unavailable', 'Servis geçici olarak yanıt veremedi.'));
  }
}

/** Ayrı projede kurulum menüsü yoktur; işlevler düzenleyiciden çalıştırılır. */
