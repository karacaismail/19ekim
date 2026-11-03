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
  { board: 'WhatsApp günlük = 20, gruplar, e-posta, soğuk arama, sosyal medya grupları, data oluşturmak', decision: 'Bu işler masa başı pazarlamacının görevleri ve performans göstergeleri (KPI) olarak yazıldı. Tahtada “spam” denen kanallar, izinli ve ret seçeneği olan iletişim olarak kurgulandı.', where: { label: 'Masa başı', path: '/roller/pazarlamaci/#gorevler' } },
  { board: 'CRM takibi → randevu oluştur; müşteri onboard edildi mi? → toplantı almak; müşteri istihbaratı', decision: 'Randevu devri ve müşterinin sisteme alışma (onboarding) kontrolü, masa başı pazarlamacının günlük düzeninde yer alır.', where: { label: 'Masa başı', path: '/roller/pazarlamaci/#gun' } },
  { board: '2 — Organizatör ×1: 15 kişilik toplantı, segmentasyon, kurumsal iş birliği, eğitim verecek', decision: 'Organizatör 1 Aralık’ta başlar. Her iş günü 17:00–18:00 arasında eğitim verir ve haftada iki kez 15 kişilik organizasyon yapar.', where: { label: 'Organizatör', path: '/roller/organizator/' } },
  { board: 'SAHA — çat kapı rutin, randevulu git (satış hedefli)', decision: 'Saha ekibi 2 kişidir. Kişi başı günde 1–2 randevu ve 10 çat kapı ziyareti yapar.', where: { label: 'Saha ekibi', path: '/roller/saha-uzmani/' } },
  { board: 'Kalifikasyonlar: pazarlama dili, Canva, sosyal medya / satış dili, kurumsal organizasyon deneyimi, hırslı', decision: 'Bu nitelikler her rol sayfasının başlığındaki “Aranan” alanında yer alır.', where: { label: 'Rol sayfaları', path: '/roller/pazarlamaci/' } },
  { board: '3 — Satışçı: masa başı + randevulu; GTM funnel → talep, lead, satış', decision: 'Masa başı talep ve randevu üretir, saha ekibi bunları satışa çevirir. CRM aşamaları karar bekliyor.', where: { label: 'Kararlar', path: '/karar-bekleyenler/' } },
  { board: 'Sıfır noktası → 101 otomasyon → 201 Like → 301 → 401 → 501 → hakkını vermek; content ← changelog', decision: 'Bu iş 1 dijital pazarlama uzmanına verildi. Uzman ölçümü (GA4, Yandex Metrica, GTM) kurar. Ayrıca yapay zekâ öncelikli (AI-first) otomasyonla içerik üretimini ve paylaşımı otomatikleştirir. Tahtadaki basamaklar 90 günlük planın aşamalarıdır. Changelog, yani ürün değişiklik kaydı, içerik planındaki “Ürün yenilikleri” sütununa karşılık gelir.', where: { label: 'Dijital pazarlama', path: '/roller/dijital-pazarlama/#icerik-plani' } },
  { board: 'Hafta ×2 organizasyon, her gün eğitim; odalar, dernekler, sektörel topluluklar', decision: 'Bu notlar organizatörün görevlerine ve kurumsal iş birliği hedeflerine işlendi.', where: { label: 'Organizatör', path: '/roller/organizator/' } },
  { board: 'Mekân bul, personel bul → onboard → gereksinimler, oryantasyon, dokümantasyon + eğitim, task’lar, hedefler = KPI’lar', decision: 'Mekân hazır: ofisin toplantı salonu kullanılır. Personel, haftalık 5.000 ₺ bütçeli ve sürekli yayında kalan Meta reklamlarıyla bulunur. Personelin işe alışma süreci, müşterinin sisteme alışma sürecinden ayrı yürür.', where: { label: 'Eylem planı', path: '/eylem-plani/' } },
  { board: 'Bedava sosyal medya → tam makaleler', decision: 'Müşteri kazanmak için ücretli kampanya yapılmaz. Bunun yerine organik video ve gruplarda tam makale paylaşılır. Meta reklamları yalnız personel ve temsilci bulmak içindir.', where: { label: 'İçerik planı', path: '/roller/dijital-pazarlama/#icerik-plani' } },
];
