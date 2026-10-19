import type { RoleKey, Status } from './types';

export const hiringPlan: {
  role: RoleKey;
  title: string;
  count: string;
  start: string;
  step: string;
  employment: string;
  status: Status;
}[] = [
  { role: 'asistan', title: '2. Asistan', count: '1', start: '1 Kasım 2026', step: 'Kurmay', employment: 'Maaşlı; fazla çalışma ücreti. Onay bekliyor.', status: 'bekliyor' },
  { role: 'pazarlamaci', title: '3. Masa başı pazarlama (CRM)', count: '1', start: '1 Kasım 2026', step: 'Ağaç 2', employment: 'Maaşlı; satış primi; fazla çalışma ücreti', status: 'karar' },
  { role: 'saha-uzmani', title: '4. Saha pazarlama ekibi', count: '2 (sonra ağla büyür)', start: '1 Kasım 2026', step: 'Ağaç 3', employment: 'Maaşlı; satış başı prim ve kota; fazla çalışma ücreti', status: 'karar' },
  { role: 'dijital-pazarlama', title: '5. Dijital pazarlama', count: '1', start: '1 Kasım 2026 (asistan yoksa 1 Ocak 2027)', step: 'Ağaç 1', employment: 'Maaşlı; kota ve prim; fazla çalışma ücreti', status: 'karar' },
  { role: 'organizator', title: '6. Organizasyoncu (organizatör)', count: '1', start: '1 Aralık 2026', step: 'Ağaç 4', employment: 'Maaşlı; aktivasyon ve etkinlik primi; fazla çalışma ücreti', status: 'karar' },
  { role: 'ekip-lideri', title: 'Ekip lideri', count: '1 (içeriden)', start: '1 Aralık 2026', step: 'Ağaç 3', employment: 'Terfi: liderlik farkı + ekip primi (oran karar bekliyor)', status: 'karar' },
  { role: 'ekip-lideri', title: 'Bağımsız satış temsilcileri (MLM)', count: 'Ayda ~2 (Ocak sonu ~5)', start: '23 Kasım’dan itibaren, sürekli', step: 'Meta reklamları', employment: 'Maaşsız; yalnız gerçekleşen satıştan komisyon', status: 'oneri' },
];

export const hiringTimeline = [
  { date: '19–20 Ekim', step: 'Meta reklamları ve ilanlar', who: 'İsmail Karaca', detail: 'Meta (Facebook/Instagram) iş reklamları haftalık 5.000 ₺ ile başlar ve sürekli döner; 1 Kasım grubunun (asistan, masa başı, 2 saha, dijital) ilanları yayında.' },
  { date: '20–23 Ekim', step: 'Ön eleme', who: 'İsmail Karaca', detail: '15 dakikalık telefon görüşmesi: tempo (günde 11 saat, Cumartesi), beklenti, uygunluk.' },
  { date: '23–27 Ekim', step: 'Mülakat ve vaka görevi', who: 'İsmail Karaca', detail: 'Rol bazlı vaka ve puan tablosu.' },
  { date: '26 Ekim', step: 'Asistan kararı', who: 'İsmail Karaca', detail: 'Asistan alınmazsa dijital pazarlamanın işe alımı Aralık’a, başlangıcı 1 Ocak’a kayar.' },
  { date: '28 Ekim', step: 'Teklif', who: 'İsmail Karaca', detail: 'Yarım gün; ücret, prim, kota ve fazla çalışma koşulları yazılı.' },
  { date: '30 Ekim', step: 'Sözleşme ve SGK', who: 'İsmail Karaca, muhasebe', detail: 'Sözleşme, fazla çalışma için yazılı onay; SGK işe giriş bildirimi işe başlamadan önce.' },
  { date: '1 Kasım (ilk iş günü 2 Kasım)', step: 'Beş kişi başlar', who: 'Ekip', detail: 'Personel onboarding’i: ilk hafta programı.' },
  { date: '2–27 Kasım', step: 'Organizatör işe alımı', who: 'İsmail Karaca, asistan', detail: 'İlan 2 Kasım; teklif 23 Kasım; başlangıç 1 Aralık.' },
  { date: '1–18 Aralık', step: 'Asistansız senaryo: dijital pazarlama işe alımı', who: 'İsmail Karaca', detail: 'Yalnız asistan alınmazsa; başlangıç 1 Ocak (resmî tatil; ilk iş günü 2 Ocak).' },
];

export const channels = [
  { channel: 'Meta (Facebook/Instagram) reklamları', fit: 'Tüm roller ve bağımsız satış temsilcileri', note: 'Haftalık 5.000 ₺, sürekli. İş ilanında “İstihdam” özel reklam kategorisi gerekebilir; gelir vaadi yok.' },
  { channel: 'İş ilanı siteleri', fit: 'Pazarlamacı, saha uzmanı, asistan', note: 'Ücret aralığı ve çalışma saatleri ilanda açık yazılır.' },
  { channel: 'LinkedIn', fit: 'Organizatör, asistan, dijital pazarlama', note: 'Kurumsal organizasyon ve etkinlik deneyimi olanlar.' },
  { channel: 'İŞKUR', fit: 'Pazarlamacı, saha uzmanı', note: 'Ücretsiz; teşvik bilgisi muhasebeyle kontrol edilir.' },
  { channel: 'İstoç çevresi ve referans', fit: 'Saha uzmanı, organizatör', note: 'Çarşıyı tanıyan adaylar; referans teyidi yapılır.' },
  { channel: 'Üniversite kariyer merkezleri', fit: 'Asistan', note: 'Yeni mezun; araştırma ve yazım vakasıyla seçilir.' },
];

export const interviewCases: { role: RoleKey; title: string; task: string; time: string; look: string }[] = [
  { role: 'pazarlamaci', title: 'Pazarlamacı', task: 'Telefonla soğuk arama rol çalışması: bir toptancıdan randevu almak. Ardından Canva’da tek WhatsApp görseli.', time: '10 + 30 dk', look: 'Açılış, ihtiyaç sorusu, itiraz yanıtı, randevu isteme; görselde netlik.' },
  { role: 'saha-uzmani', title: 'Saha uzmanı', task: 'Dükkânda yüz yüze rol çalışması. İtirazlar: “Zaten başka pazaryerindeyiz”, “İnternete gerek yok”.', time: '15 dk', look: 'Güven kurma, demo akışı, kapanış denemesi, ısrarcı olmadan takip.' },
  { role: 'organizator', title: 'Organizatör', task: '30 dakikada 15 kişilik eğitim planı: davet, ajanda, lojistik, takip. Sonra 10 dakikalık mini sunum.', time: '30 + 10 dk', look: 'Planın uygulanabilirliği, sahne rahatlığı, zaman yönetimi.' },
  { role: 'dijital-pazarlama', title: 'Dijital pazarlama', task: 'Ev ödevi: bir changelog maddesinden yapay zekâ araçlarıyla 30–45 saniyelik dikey video (senaryo, seslendirme, altyazı) ve bu videoyu otomatik paylaşıma bağlayan akışın şeması.', time: '2 gün süre, 30 dk sunum', look: 'İlk 3 saniye, netlik, marka dili, otomasyon mantığı, doğruluk kontrolü.' },
  { role: 'asistan', title: 'Asistan', task: '2 sayfalık karar dokümanı: “Hangi CRM aracı?” (3 seçenek). Kısa Scrum soruları.', time: '60 dk', look: 'Seçeneklerin dengeli sunumu, kaynak gösterme, yazım, Scrum kavramları.' },
];

export const rubric = [
  { criterion: 'Rol uygunluğu', low: 'Vakayı tamamlayamadı', mid: 'Vakayı tamamladı, eksikleri var', high: 'Vakayı ikna edici ve eksiksiz tamamladı' },
  { criterion: 'İletişim', low: 'Dağınık, dinlemiyor', mid: 'Net ama mekanik', high: 'Net, dinliyor, karşısındakine uyuyor' },
  { criterion: 'Öğrenme hızı', low: 'Geri bildirimi uygulamadı', mid: 'Kısmen uyguladı', high: 'İkinci denemede belirgin iyileşme' },
  { criterion: 'Tempo ve dayanıklılık', low: 'Saatlere itiraz', mid: 'Kabul ama tereddütlü', high: 'Yoğun dönemi kabul ediyor, örnek deneyimi var' },
  { criterion: 'Değer uyumu', low: 'Kısa vadeli, kural dışına açık', mid: 'Nötr', high: 'Dürüst satış, müşteri yararı, kurallara uyum' },
];

/** Personel onboarding’i: işe alınan kişinin ilk haftası (müşteri onboarding’inden ayrı). */
export const firstWeek = [
  { day: 'Pazartesi', items: 'Sözleşme ve onaylar; hesaplar ve ekipman; iStoc ürün eğitimi (paketler, başvuru, panel).' },
  { day: 'Salı', items: 'CRM aşamaları ve kayıt kuralları; ticari ileti ve KVKK kuralları; rol senaryoları.' },
  { day: 'Çarşamba', items: 'Gölge çalışma: saha uzmanı ve pazarlamacı birbirinin gününe eşlik eder.' },
  { day: 'Perşembe', items: 'Gerçek işle ilk gün; öğleden sonra yöneticiyle değerlendirme.' },
  { day: 'Cuma', items: 'Hedeflerin %50’siyle tam gün; akşam kısa geri bildirim.' },
  { day: 'Cumartesi', items: 'İlk haftalık kapanış toplantısı; 2. hafta hedefleri.' },
];

/** Tutarlar herkese açık sitede yayımlanmaz; yalnız yapı gösterilir. */
export const compensation: { role: RoleKey; title: string; fixed: string; variable: string; overtime: string }[] = [
  { role: 'pazarlamaci', title: 'Pazarlamacı', fixed: 'Maaş', variable: 'Randevu ve dönüşüm bazlı prim', overtime: 'Haftalık 45 saati aşan süre %50 zamlı' },
  { role: 'saha-uzmani', title: 'Saha uzmanı', fixed: 'Maaş', variable: 'Satış başı prim; kota koşulları', overtime: 'Haftalık 45 saati aşan süre %50 zamlı' },
  { role: 'organizator', title: 'Organizatör', fixed: 'Maaş', variable: 'Aktivasyon ve etkinlik primi', overtime: 'Haftalık 45 saati aşan süre %50 zamlı' },
  { role: 'dijital-pazarlama', title: 'Dijital pazarlama', fixed: 'Maaş', variable: 'Kota ve prim (talep ve yayın hedefleri)', overtime: 'Haftalık 45 saati aşan süre %50 zamlı' },
  { role: 'asistan', title: 'Asistan', fixed: 'Maaş', variable: '—', overtime: 'Haftalık 45 saati aşan süre %50 zamlı' },
  { role: 'ekip-lideri', title: 'Ekip lideri', fixed: 'Maaş + liderlik farkı', variable: 'Ekip hedef primi (oran karar bekliyor)', overtime: 'Haftalık 45 saati aşan süre %50 zamlı' },
];

export const jobAds: { role: RoleKey; title: string; lines: string[] }[] = [
  { role: 'pazarlamaci', title: 'Masa Başı Pazarlama Uzmanı (İstoç / Bağcılar)', lines: ['Toptancılarla telefon, WhatsApp ve e-postayla ilk teması kuracak', 'CRM’i düzenli tutacak, saha ekibine randevu oluşturacak', 'Canva ve sosyal medyayı etkin kullanacak', 'Pazartesi–Cuma 08:00–20:00, Cumartesi 08:00–13:30; fazla çalışma ücretli'] },
  { role: 'saha-uzmani', title: 'Saha Pazarlama Uzmanı (İstoç)', lines: ['Randevulu ve randevusuz ziyaretlerle toptancılara iStoc’u tanıtacak', 'Yerinde demo ve başvuru; ilk 48 saatte kurulum desteği', 'Satış başı prim ve kota sistemi', 'Pazartesi–Cuma 08:00–20:00, Cumartesi 08:00–13:30; fazla çalışma ücretli'] },
  { role: 'organizator', title: 'Etkinlik ve Eğitim Organizatörü (İstoç)', lines: ['Her iş günü 17:00–18:00 satıcı eğitimleri verecek', 'Haftada iki 15 kişilik organizasyon; oda ve derneklerle iş birliği', 'Satış dili ve kurumsal organizasyon deneyimi', 'Pazartesi–Cuma 08:00–20:00, Cumartesi 08:00–15:30; fazla çalışma ücretli'] },
  { role: 'dijital-pazarlama', title: 'Dijital Pazarlama Uzmanı (Yapay Zekâ ve Video)', lines: ['Yapay zekâ araçlarıyla kısa dikey video içerik üretecek', 'Otomasyon platformlarıyla otomatik paylaşım ve talep akışı kuracak', 'Ürün güncellemelerini ve saha hikâyelerini videoya çevirecek', 'Pazartesi–Cuma 08:00–20:00, Cumartesi 08:00–13:30; fazla çalışma ücretli'] },
  { role: 'asistan', title: 'Yönetici Asistanı (Araştırma ve Doküman)', lines: ['Karar dokümanı, araştırma ve eğitim sunumu hazırlayacak', '4 kişilik yazılım ekibinin Scrum düzenine destek olacak', 'Güçlü Türkçe yazım, sunum ve tablo becerisi', 'Pazartesi–Cuma 08:00–20:00, Cumartesi 08:00–13:30; fazla çalışma ücretli'] },
];
