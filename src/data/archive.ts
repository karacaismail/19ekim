/**
 * Arşiv: tahtadaki notların plandaki karşılığı. Toplantı için gerekli değil;
 * veri kaybı olmasın diye ayrı tutulur (ana gezinmede yok, alt bilgiden ulaşılır).
 */
export interface BoardRow {
  board: string;
  decision: string;
  where: { label: string; path: string };
}

export const boardMapping: BoardRow[] = [
  { board: '1 — Masa başı pazarlama, maaşlı ×1 kişi', decision: 'Masa başı pazarlama (CRM), 1 kişi, 1 Kasım’da başlar.', where: { label: 'Masa başı', path: '/roller/pazarlamaci/' } },
  { board: 'WhatsApp günlük = 20, gruplar, e-posta, soğuk arama, sosyal medya grupları, data oluşturmak', decision: 'Masa başının görevleri ve KPI’ları. “Spam” geçen kanallar izinli ve ret seçenekli iletişim olarak kurgulandı.', where: { label: 'Masa başı', path: '/roller/pazarlamaci/#gorevler' } },
  { board: 'CRM takibi → randevu oluştur; müşteri onboard edildi mi? → toplantı almak; müşteri istihbaratı', decision: 'Randevu devri ve müşteri onboarding kontrolü masa başının günlük düzeninde.', where: { label: 'Masa başı', path: '/roller/pazarlamaci/#gun' } },
  { board: '2 — Organizatör ×1: 15 kişilik toplantı, segmentasyon, kurumsal iş birliği, eğitim verecek', decision: 'Organizatör (1 Aralık); her iş günü 17:00–18:00 eğitim, haftada iki 15 kişilik organizasyon.', where: { label: 'Organizatör', path: '/roller/organizator/' } },
  { board: 'SAHA — çat kapı rutin, randevulu git (satış hedefli)', decision: 'Saha ekibi (2 kişi); kişi başı günde 1–2 randevu + 10 çat kapı.', where: { label: 'Saha ekibi', path: '/roller/saha-uzmani/' } },
  { board: 'Kalifikasyonlar: pazarlama dili, Canva, sosyal medya / satış dili, kurumsal organizasyon deneyimi, hırslı', decision: 'Her rol sayfasının başlığındaki “Aranan” alanında.', where: { label: 'Rol sayfaları', path: '/roller/pazarlamaci/' } },
  { board: '3 — Satışçı: masa başı + randevulu; GTM funnel → talep, lead, satış', decision: 'Masa başı talep ve randevu üretir; saha satışa çevirir. CRM aşamaları karar bekliyor.', where: { label: 'Karar bekleyenler', path: '/karar-bekleyenler/' } },
  { board: 'Sıfır noktası → 101 otomasyon → 201 Like → 301 → 401 → 501 → hakkını vermek; content ← changelog', decision: 'Dijital pazarlama uzmanı (1 kişi): ölçüm (GA4, Yandex Metrica, GTM), AI-first paylaşım otomasyonu, üretim ve paylaşımın otomatikleşmesi. Basamaklar 90 günlük planın aşamaları; changelog içerik planının “Ürün yenilikleri” sütunu.', where: { label: 'Dijital pazarlama', path: '/roller/dijital-pazarlama/#icerik-plani' } },
  { board: 'Hafta ×2 organizasyon, her gün eğitim; odalar, dernekler, sektörel topluluklar', decision: 'Organizatörün görevleri ve kurumsal iş birliği hedefleri.', where: { label: 'Organizatör', path: '/roller/organizator/' } },
  { board: 'Mekân bul, personel bul → onboard → gereksinimler, oryantasyon, dokümantasyon + eğitim, task’lar, hedefler = KPI’lar', decision: 'Mekân hazır (ofis toplantı salonu); personel Meta reklamlarıyla (haftalık 5.000 ₺, sürekli); personel onboarding’i müşteri onboarding’inden ayrı.', where: { label: 'Eylem planı', path: '/eylem-plani/' } },
  { board: 'Bedava sosyal medya → tam makaleler', decision: 'Müşteri edinmede ücretli kampanya yok: organik video ve gruplarda tam makale. Meta reklamları yalnız personel ve temsilci bulmak içindir.', where: { label: 'İçerik planı', path: '/roller/dijital-pazarlama/#icerik-plani' } },
];
