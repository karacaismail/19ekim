# Persona eşitleme servisi

Bu servis satış hesaplayıcısının persona ayarlarını Google Sheets'te tutar. iStoc ve Segika ayarları ayrıdır. Servis OPEX web uygulamasından ayrı bir Apps Script projesinde çalışır. OPEX koduna ve OPEX sekmelerine dokunmaz.

## Dosyalar

| Dosya | Görevi |
| --- | --- |
| `src/PersonaSync.js` | Okuma, yama, doğrulama ve erişim modunu yönetir. Kilit ve işlem kimliği de bu dosyadadır. |
| `persona-web.js` | Ayrı projenin `doGet` ve `doPost` girişidir. |
| `persona-build.mjs` | Şemayı `src/data/personaFields.ts` dosyasından üretir. Paketi bir klasöre yazar. |
| `test-persona-sync.mjs` | Sunucu testleridir. `node --test apps-script/test-persona-sync.mjs` komutuyla çalışır. |

## Erişim modu

Mod, sunucu özelliği `PERSONA_ACCESS` ile açıkça seçilir.

- `key` modunda her istek erişim anahtarı ister. Bu mod varsayılandır. Özellik tanımsızsa ya da bilinmeyen bir değer taşıyorsa servis bu modda çalışır. Anahtar `PERSONA_ERISIM_ANAHTARI` özelliğinde durur. Anahtar yanlışsa veri dönmez.
- `development-public` modu geliştirme dönemi içindir. Bu modda okuma ve yazma anahtarsız yapılır. Yazma yine yalnız şemadaki alanlara, doğrulanmış değerlerle yapılır. Bu mod gizlilik sağlamaz.

Sağlık yanıtı ve her veri yanıtı `access` alanını taşır. Arayüz bu alanı kullanıcıya gösterir.

## Paylaşım kararı

Kullanıcı bu kararı 11 Kasım 2026 tarihinde verdi. Geliştirme bitene kadar tabloyu bağlantıyı bilen herkes düzenleyebilir. Erişimi sonradan kullanıcı daraltacak. Bu yüzden servis şimdilik `development-public` modunda kurulur. Bu kurulum gizli erişim iddiası taşımaz.

Erişim daraltılınca şu adımlar uygulanır:

1. Sahip, düzenleyicide `personaAnahtariniUret` işlevini çalıştırır.
2. Sahip, proje ayarlarında `PERSONA_ACCESS` değerini `key` yapar.
3. Anahtar kullanıcılara özel bir kanaldan iletilir. Anahtar sayfa koduna gömülmez.

## Yazma kuralları

- Her yama tek bir Sheets API toplu isteğiyle yazılır. İstek değişen hücreleri ve işlem kaydını birlikte taşır. İsteğin bir parçası geçersizse hiçbir parça uygulanmaz.
- Her işlem "Persona İşlemleri" sekmesine kaydedilir. Kayıtlar silinmez. Böylece eski bir işlem bir daha yazılmaz.
- Defter 50000 kayıtla sınırlıdır. Defter dolunca yeni yazı reddedilir. Hiçbir alan yazılmaz.
- Yazma sonucu belirsiz kalabilir. Örneğin bağlantı kopabilir. Bu durumda istemci aynı `operationId` ile yeniden dener. Sunucu işlemi defterden tanır. Değişikliği iki kez yazmaz. Yanıt tablonun güncel halini taşır.

## Paketleme

Kurulum değerleri tablo kimliğini taşır. Bu yüzden paket repo dışına yazılır:

```bash
node apps-script/persona-build.mjs --cikti <repo dışı klasör>/src --tablo <tablo kimliği> --erisim development-public
```

Sunucu ilk istekte bu değerleri bir kez sunucu özelliklerine aktarır. İstekten hiçbir yapılandırma alınmaz.
