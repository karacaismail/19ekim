/** Mesai: kararlaştırılan günde 11 saat çalışma ve Cumartesi yarım gün. */
export const shifts = [
  { role: 'Pazarlamacı, saha uzmanı, dijital pazarlama, asistan, ekip lideri', weekday: '08:00–20:00', saturday: '08:00–13:30', breaks: '60 dk hafta içi · 30 dk Cumartesi', weekly: '60 saat', overtime: '15 saat', quarter: '≈195 saat' },
  { role: 'Organizatör', weekday: '08:00–20:00', saturday: '08:00–15:30', breaks: '60 dk hafta içi · 30 dk Cumartesi', weekly: '62 saat', overtime: '17 saat', quarter: '≈221 saat' },
];

/** 4857 sayılı İş Kanunu çerçevesi. Uygulama öncesi İK ve mali müşavirle teyit edilir. */
export const legal = [
  { rule: 'Günlük çalışma 11 saati aşamaz (md. 63).', impact: 'Plan tam sınırda: ek toplantı veya etkinlik 11 saatin içinden düşülür, üstüne eklenmez.' },
  { rule: 'Haftalık 45 saati aşan çalışma fazla çalışmadır; her saat %50 zamlı ödenir (md. 41).', impact: 'Haftada 15 saat (organizatör 17 saat) fazla çalışma bordroya yansır.' },
  { rule: 'Fazla çalışma yılda 270 saati geçemez (md. 41).', impact: 'Bu tempo yaklaşık 16–18 hafta sürdürülebilir; 90. günde yeni mesai modeli gerekir.' },
  { rule: 'Fazla çalışma için işçinin yazılı onayı alınır (Fazla Çalışma Yönetmeliği).', impact: 'Onay, sözleşmeyle birlikte işe başlamadan imzalanır.' },
  { rule: 'Ara dinlenme: 7,5 saatten uzun işte en az 1 saat, 4–7,5 saat arası en az 30 dakika; çalışma süresinden sayılmaz (md. 68).', impact: 'Hafta içi 12:30–13:30; Cumartesi 30 dakika.' },
  { rule: 'Gece dönemi en geç 20:00’de başlar (md. 69).', impact: 'Mesai 20:00’de biter; gece çalışması planlanmadı.' },
  { rule: 'Haftada kesintisiz 24 saat hafta tatili (md. 46).', impact: 'Pazar tatil.' },
  { rule: 'Deneme süresi en çok 2 ay (md. 15).', impact: 'Adım 1 için 2 Ocak 2027’ye kadar.' },
  { rule: 'Genel tatilde çalışma ayrıca ücretlendirilir (md. 47).', impact: '1 Ocak 2027 Cuma resmî tatil; çalışılmaz olarak planlandı.' },
];

export const channelRules = [
  { channel: 'Soğuk arama', rule: 'Kendini ve şirketi tanıt; aramayı istemeyeni listeden çıkar.', why: 'Güven ve şikâyet riski.' },
  { channel: 'WhatsApp (günde 20)', rule: 'WhatsApp Business; kişiye özel mesaj; her mesajda “istemiyorsanız ‘HAYIR’ yazın” gibi ret yolu.', why: 'Toplu mesaj hesap kısıtlamasına yol açar.' },
  { channel: 'WhatsApp ve sosyal medya grupları', rule: 'İzinsiz gruba ekleme yok; grup kurallarına uy; reklam yerine tam makale ve eğitim duyurusu.', why: 'Platform kuralları; gruptan çıkarılma ve itibar riski.' },
  { channel: 'E-posta', rule: 'Her iletide çıkış bağlantısı; ret talebi en geç 3 iş günü içinde uygulanır.', why: '6563 sayılı Kanun: ticari elektronik ileti ve ret hakkı.' },
  { channel: 'Ticari ileti onayı', rule: 'Esnaf ve tacire önceden onaysız ticari ileti gönderilebilir; ret hakkı korunur. İYS kaydı ihtiyacı hukukçuyla teyit edilir.', why: 'Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik.' },
  { channel: 'Otomatik paylaşım ve yapay zekâ içerik', rule: 'Yalnız resmî planlayıcı veya platform API’si; toplu takip ve toplu yorum otomasyonu yok. Yapay zekâ çıktısı yayından önce insan kontrolünden geçer; kişi görüntüsü ve sesi için yazılı izin; lisanslı müzik ve görsel.', why: 'Platform kuralları, KVKK, fikrî mülkiyet.' },
  { channel: 'Data oluşturma', rule: 'Her kayıtta kaynak notu; kişisel cep telefonları için aydınlatma metni ve saklama süresi.', why: 'KVKK: kişisel verilerin işlenmesi.' },
];

export const rhythm = [
  { ritual: 'Pazarlama stand-up', when: 'Pzt–Cum 08:00', length: '15 dk', who: 'Saha ekibi; 1 Aralık’tan ekip lideri yönetir', output: 'Günün hedefleri' },
  { ritual: 'Daily Scrum', when: 'Pzt–Cum 09:30', length: '15 dk', who: 'Yazılım ekibi, yönetici, asistan (not)', output: 'Engel listesi' },
  { ritual: 'Günlük senkron', when: 'Pzt–Cum 19:30', length: '15 dk', who: 'Pazarlamacı, saha uzmanı, organizatör', output: 'Yarının randevuları' },
  { ritual: 'Gün sonu özeti', when: 'Pzt–Cum 19:45', length: 'Yazılı', who: 'Asistan → yönetici; ekip lideri → yönetici', output: 'Özet ve karar bekleyenler' },
  { ritual: 'MLM bilgilendirme toplantısı', when: 'Çarşamba 18:00 (Ocak’tan haftada 2)', length: '45 dk', who: 'Ekip lideri, organizatör; Meta adayları', output: 'Temsilci onboarding’ine başlayanlar' },
  { ritual: 'Karar toplantısı', when: 'Perşembe 18:00', length: '45 dk', who: 'Yönetici, asistan', output: 'Kararlar, karar günlüğü' },
  { ritual: 'Haftalık kapanış', when: 'Cumartesi 08:00', length: '30 dk', who: 'Saha ekibi, asistan', output: 'KPI, kayıp nedenleri, gelecek hafta' },
  { ritual: 'Sprint Planning', when: '2 haftada bir, Pazartesi 10:00', length: '2 saat', who: 'Yönetici, yazılım ekibi, asistan', output: 'Sprint hedefi' },
  { ritual: 'Sprint Review ve Retro', when: '2 haftada bir, Cuma 14:00', length: '2 saat', who: 'Yönetici, yazılım ekibi, asistan', output: 'Changelog, aksiyonlar' },
  { ritual: 'Aylık değerlendirme', when: 'Ayın son Cumartesisi 11:00', length: '1 saat', who: 'Yönetici, ekip lideri, asistan', output: 'Ay raporu; 30/60/90. gün kontrolü' },
  { ritual: 'Planlama toplantısı', when: 'Harcama sınırı aşıldığında; 60. ve 90. gün', length: '—', who: 'Yatırımcı, yönetici', output: 'Sürdür / iyileştir / durdur' },
];

export const scrumRhythm = [
  { ritual: 'Sprint Planning', when: '2 haftada bir, Pazartesi 10:00', length: '2 saat', task: 'Gündem, kapasite tablosu, sprint hedefi ve kararların notu.' },
  { ritual: 'Daily Scrum', when: 'Her iş günü 09:30', length: '15 dk', task: 'Engel listesi; 24 saati aşan engeli yöneticiye iletir.' },
  { ritual: 'Backlog Refinement', when: 'Sprintin 2. Çarşambası 16:00', length: '1 saat', task: 'Story taslakları, kabul kriterleri, açık sorular.' },
  { ritual: 'Sprint Review', when: 'Sprintin son Cuması 14:00', length: '1 saat', task: 'Demo listesi, paydaş notları, changelog taslağı.' },
  { ritual: 'Retrospektif', when: 'Sprintin son Cuması 15:00', length: '1 saat', task: 'Aksiyonlar ve sahipleri; bir sonraki retroda takip.' },
];

export const decisionTemplate = [
  { part: 'Karar sorusu', content: 'Tek cümle; “hangisi?” sorusu.' },
  { part: 'Bağlam', content: 'Neden şimdi; ilgili KPI veya olay.' },
  { part: 'Kısıtlar', content: 'Harcama yetki sınırı, bütçe, süre, kayıp tavanı, mevzuat.' },
  { part: 'Seçenekler', content: 'A / B / C: tanım, maliyet, süre, beklenen etki, risk, geri dönüş maliyeti.' },
  { part: 'Karşılaştırma', content: 'Ölçüt × seçenek tablosu.' },
  { part: 'Bilinmeyenler', content: 'Varsayımlar ve nasıl doğrulanacağı.' },
  { part: 'Karar', content: 'Yönetici doldurur: seçim, gerekçe, sahip, tarih.' },
  { part: 'Takip', content: 'Ölçüt ve kontrol tarihi.' },
];
