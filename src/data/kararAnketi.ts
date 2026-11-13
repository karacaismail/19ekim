/**
 * Karar seçimleri (kullanıcı kararı 2026-11-03): son kararlar, belirsizler ve isteklerle çelişen konular. Sahip seçenekleri
 * Karar bekleyenler sayfasında seçer; seçimler JSON olarak dışa aktarılır ve sistem bu dosyayla güncellenir.
 * Ajanın verdiği kararlar uygulandı ama sahibin onayını bekler; sahip başka seçeneği seçebilir.
 */

export interface Secenek {
  id: string;
  metin: string;
}

export interface AnketSorusu {
  id: string;
  baslik: string;
  soru: string;
  /** Neden soruluyor: çelişki ya da belirsizlik. */
  neden: string;
  secenekler: Secenek[];
  /** Önerilen seçenek. */
  oneri: string;
  /** Ajanın uyguladığı seçenek (yalnız ajan kararlarında). */
  uygulanan?: string;
  etki: string;
  ilgili: string[];
}

/** Ajanın verdiği ve sisteme uyguladığı kararlar: sahip onaylar ya da değiştirir. */
export const AJAN_KARARLARI: AnketSorusu[] = [
  {
    id: 'saha-kotasi',
    baslik: 'Saha kotası',
    soru: 'Kadrolu satış uzmanının kotası hangi kurala göre hesaplanır?',
    neden: 'Satış ortaklığı sayfası kotayı maaşın 2 katına %20 ekleyerek bulur (120.000 ₺). Temsilci ağı sayfası ise maaşın 2 katını kullanıyordu (100.000 ₺).',
    secenekler: [
      { id: 'ana', metin: 'Kota, maaşın 2 katının %20 fazlasıdır (satış ortaklığı ana programı)' },
      { id: 'ag', metin: 'Kota, maaşın 2 katıdır (eski Temsilci ağı kuralı)' },
    ],
    oneri: 'ana',
    uygulanan: 'ana',
    etki: 'Kadrolu satış uzmanının kotası ve primi. Temsilci ağı kuralı ayrı bir koşul seti olarak seçilebilir kalır.',
    ilgili: ['/satis-ortakligi/'],
  },
  {
    id: 'musavir-catisma',
    baslik: 'Mali müşavire ödeme',
    soru: 'Mali müşavire komisyon ödenebilir mi?',
    neden: 'İş ortaklığı sayfasında müşavire nakit verilmiyordu. Sizin 3 Kasım Salı kararınızla satış ortaklığında komisyon ve müşteri indirimi seçilebilir.',
    secenekler: [
      { id: 'ikisi', metin: 'Ana programda komisyon ya da indirim seçilir, nakitsiz model ayrı seçenek olarak kalır' },
      { id: 'nakitsiz', metin: 'Müşavire hiçbir zaman nakit ödenmez, yalnız toptan fiyat ve indirim verilir' },
    ],
    oneri: 'ikisi',
    uygulanan: 'ikisi',
    etki: 'Profesyonel çözüm ortağı rolündeki mali müşavir kuralı.',
    ilgili: ['/satis-ortakligi/'],
  },
  {
    id: 'kapasite-saati',
    baslik: 'Kapasite hesabı',
    soru: 'Bir kişinin aylık iş kapasitesi kaç saat sayılır?',
    neden: 'Kadro kapasite planı net 125 saat kullanıyor. GAP planı brüt 160 saat kullanıyor.',
    secenekler: [
      { id: '125', metin: 'Net 125 saat (toplantı, eğitim ve kayıp düşülür)' },
      { id: '160', metin: 'Brüt 160 saat' },
    ],
    oneri: '125',
    uygulanan: '125',
    etki: 'Kadro kapasitesi sayfasındaki rol yükleri.',
    ilgili: ['/kadro-kapasitesi/'],
  },
  {
    id: 'odeme-zamani',
    baslik: 'Ortağa ödeme zamanı',
    soru: 'Ortağa ödeme zamanı bütün koşul setlerinde aynı mı olacak?',
    neden: 'Ana program ödemenin %70’ini 14. günde, kalanını 60. günde yapar. İş ortaklığı ayın 15’ini, Affilate hizmet ayını kullanıyordu.',
    secenekler: [
      { id: 'setine-gore', metin: 'Ana programda ödeme 14. ve 60. günde yapılır. Diğer koşul setleri kendi kuralıyla öder.' },
      { id: 'hepsi-ana', metin: 'Bütün koşul setleri ana programın 14. ve 60. gün kuralına geçer' },
    ],
    oneri: 'setine-gore',
    uygulanan: 'setine-gore',
    etki: 'Satış ortaklığındaki hakediş ve ödeme takvimi.',
    ilgili: ['/satis-ortakligi/'],
  },
  {
    id: 'koruma-suresi',
    baslik: 'Müşteri koruma süresi',
    soru: 'Ortağın getirdiği firma ne kadar süre onun adına korunur?',
    neden: 'Segika kuralı 12 ay, iStoc kuralı 90 gün.',
    secenekler: [
      { id: 'markaya-gore', metin: 'Segika 12 ay, iStoc 90 gün' },
      { id: 'hepsi-12', metin: 'İki markada da 12 ay' },
      { id: 'hepsi-90', metin: 'İki markada da 90 gün' },
    ],
    oneri: 'markaya-gore',
    uygulanan: 'markaya-gore',
    etki: 'Koşul setlerindeki koruma kuralı.',
    ilgili: ['/satis-ortakligi/'],
  },
  {
    id: 'kadrolu-prim-tabani',
    baslik: 'Kadrolu prim tabanı',
    soru: 'Kadrolu satış uzmanının primi neyin üzerinden hesaplanır?',
    neden: 'Sayfa metni primi cironun tamamı üzerinden anlatıyordu. Hesap ise yalnız kotayı aşan ciroyu kullanıyor. Metin hesapla uyumlu hale getirildi.',
    secenekler: [
      { id: 'asan', metin: 'Yalnız kotayı aşan ciro üzerinden' },
      { id: 'tum', metin: 'Kota aşılınca cironun tamamı üzerinden' },
    ],
    oneri: 'asan',
    uygulanan: 'asan',
    etki: 'Kadrolu satış uzmanının primi.',
    ilgili: ['/satis-ortakligi/'],
  },
];

/** Sahibin seçmesi gereken sorular: isteklerle ya da belgeler arasında çelişen veya belirsiz konular. */
export const SORULAR: AnketSorusu[] = [
  {
    id: 'baslangic-tarihi',
    baslik: 'Programın başlangıç tarihi',
    soru: 'Sitenin bütün hesaplarındaki başlangıç tarihi ne olsun?',
    neden: 'Site bütün hesapları 1 Kasım 2026 Pazar gününden başlatıyor. 3 Kasım 2026 Salı tarihli plan ise henüz kimsenin başlamadığını varsayıyor. Bu plan ilk işe alım grubunu 23 Kasım 2026 Pazartesi günü başlatıyor.',
    secenekler: [
      { id: '23-kasim', metin: 'Başlangıç 23 Kasım 2026 Pazartesi olsun. Bütün tarihler aynı süre ileri alınsın.' },
      { id: '1-kasim', metin: '1 Kasım Pazar kalsın, yalnız istihdam takvimi yeni planı göstersin' },
      { id: 'kisi-bazinda', metin: 'Her kişinin gerçek işe başlama tarihi ayrı girilsin' },
    ],
    oneri: '23-kasim',
    etki: 'Gelir planı, nakit akışı, hedefler, eylem planı, roller ve istihdam takvimi.',
    ilgili: ['/parametreler/', '/istihdam/'],
  },
  {
    id: 'temsilci-agi-sayfasi',
    baslik: 'Temsilci ağı sayfası',
    soru: 'Temsilci ağı sayfası ne olsun?',
    neden: 'Bu sayfadaki personalar ve ağ diyagramı artık satış ortaklığında. Pazarlama menüsünde ikinci bir kaynak olarak duruyor.',
    secenekler: [
      { id: 'kaldir', metin: 'Kaldırılsın, kalan verisi satış ortaklığına taşınsın' },
      { id: 'kalsin', metin: 'Reklam hunisi ve ağ hedefleri için kalsın' },
    ],
    oneri: 'kaldir',
    etki: 'Pazarlama menüsü ve satış ortaklığı.',
    ilgili: ['/buyume-modeli/', '/satis-ortakligi/'],
  },
  {
    id: 'kademe-sayisi',
    baslik: 'Temsilci ağında kademe sayısı',
    soru: 'Bir satıştan kaç kademe yukarıya pay gitsin?',
    neden: 'Eski Temsilci ağı kuralı tek kademeydi. Sizin Ahmet, Mehmet, Ayşe örneğiniz 2 kademe istiyor. Kademe sayısı hukuk kontrolünden geçmeli.',
    secenekler: [
      { id: '1', metin: '1 kademe' },
      { id: '2', metin: '2 kademe, aşağı indikçe pay azalır' },
      { id: '3', metin: '3 kademe' },
    ],
    oneri: '2',
    etki: 'Temsilci ağı koşul seti, ödeme tavanı ve sözleşme.',
    ilgili: ['/satis-ortakligi/'],
  },
  {
    id: 'kayit-hedefi',
    baslik: 'Saha kayıt hedefi',
    soru: 'Ayda 45 kayıt ve 8 aktif satıcı hedefi kimin hedefi?',
    neden: 'Kadro planı bunu ekibin toplamı olarak okudu. Kişi başı hedefse iş yükü üç katına çıkar.',
    secenekler: [
      { id: 'ekip', metin: 'Saha ekibinin toplam hedefi' },
      { id: 'kisi', metin: 'Her saha personelinin kendi hedefi' },
    ],
    oneri: 'ekip',
    etki: 'Saha hedefleri, prim ve kadro kapasitesi.',
    ilgili: ['/kadro-kapasitesi/', '/hedefler/'],
  },
  {
    id: 'etkinlik-sikligi',
    baslik: 'Etkinlik sıklığı',
    soru: 'Etkinlikler hangi sıklıkla yapılsın?',
    neden: 'Hedef haftada 5 etkinlik. Kadro planına göre bu iş tek kişiye sığmıyor ve 50 kişilik salonu doldurmak ayda yaklaşık 1.000 koltuk ister.',
    secenekler: [
      { id: 'hemen-5', metin: 'Hemen haftada 5 etkinlik' },
      { id: 'pilot-3', metin: 'Önce 20 ile 25 kişilik 2 deneme etkinliği, sonra haftada 3 etkinlik' },
      { id: 'pilot-karar', metin: 'Önce 2 deneme etkinliği yapılsın. Sıklık deneme sonucuna göre belirlensin.' },
    ],
    oneri: 'pilot-3',
    etki: 'Organizatörün hedefi ve iş yükü.',
    ilgili: ['/kadro-kapasitesi/', '/roller/organizator/'],
  },
  {
    id: 'etkinlik-katilim',
    baslik: 'Etkinlik katılımı',
    soru: '50 kişi hedefi neyi anlatıyor?',
    neden: 'Hedefin etkinlik başına mı, haftalık toplam mı olduğu yazılmamış.',
    secenekler: [
      { id: 'etkinlik-basi', metin: 'Her etkinlikte en az 50 kişi' },
      { id: 'haftalik', metin: 'Haftada toplam 50 kişi' },
    ],
    oneri: 'etkinlik-basi',
    etki: 'Organizatörün katılım hedefi ve salon ihtiyacı.',
    ilgili: ['/roller/organizator/'],
  },
  {
    id: 'asistan',
    baslik: 'Asistan',
    soru: 'Yönetici ve operasyon asistanı alınsın mı?',
    neden: 'Plan bu kararı ilk 72 saate koyuyor. Asistan alınmazsa yöneticinin 206 saatlik Kasım yükü zor azalır.',
    secenekler: [
      { id: 'evet', metin: 'Evet, ilk işe alım grubuyla 23 Kasım Pazartesi günü başlasın' },
      { id: 'hayir', metin: 'Hayır, bu bütçeyle dijital uzman erken başlasın' },
      { id: 'sonra', metin: 'İlk işe alımlardan sonra karar verilsin' },
    ],
    oneri: 'evet',
    etki: 'İstihdam takvimi, kadro kapasitesi ve gider planı.',
    ilgili: ['/istihdam/', '/kadro-kapasitesi/'],
  },
  {
    id: 'isveren',
    baslik: 'İşveren şirket',
    soru: 'Personel hangi şirketin çalışanı olacak?',
    neden: 'Sözleşme, SGK ve maliyet paylaşımı buna bağlı. 28 Ekim Çarşamba kararına göre Mogem (Segika) ve iStoc Company ayrı şirketler.',
    secenekler: [
      { id: 'markaya-gore', metin: 'iStoc personeli iStoc Company’de, Segika personeli Mogem’de' },
      { id: 'tek-sirket', metin: 'Bütün personel tek şirkette, maliyet markalara dağıtılır' },
      { id: 'musavir', metin: 'Mali müşavirle görüşüldükten sonra karar verilsin' },
    ],
    oneri: 'markaya-gore',
    etki: 'İş sözleşmeleri, SGK kaydı ve gider dağılımı.',
    ilgili: ['/kadro-kapasitesi/', '/giderler/'],
  },
  {
    id: 'ucuncu-saha',
    baslik: '3. saha personeli',
    soru: '3. saha personeli ne zaman alınsın?',
    neden: 'Kadro planı 1 Aralık Salı gününü koruyor. GAP planı ise 10 iş günü verisi ve olumlu net katkı görülmeden alınmamasını öneriyor.',
    secenekler: [
      { id: '1-aralik', metin: '1 Aralık Salı günü kesin başlasın' },
      { id: 'kosullu', metin: '10 iş günlük veride olumlu net katkı görülürse 2. ayda başlasın' },
    ],
    oneri: 'kosullu',
    etki: 'İstihdam takvimi, saha hedefleri ve gider planı.',
    ilgili: ['/istihdam/'],
  },
  {
    id: 'organizator-baslangic',
    baslik: 'Organizatörün başlangıcı',
    soru: 'Organizatör ne zaman tam zamanlı çalışmaya başlasın?',
    neden: 'Kadro planı 1 Aralık Salı diyor. GAP planı önce 2 deneme etkinliği yapılmasını öneriyor.',
    secenekler: [
      { id: '1-aralik', metin: '1 Aralık Salı günü tam zamanlı başlasın, ilk ay deneme etkinliği yapsın' },
      { id: 'pilot-sonrasi', metin: 'İki deneme etkinliğinden sonra tam zamanlı başlasın' },
    ],
    oneri: '1-aralik',
    etki: 'İstihdam takvimi ve etkinlik planı.',
    ilgili: ['/istihdam/'],
  },
  {
    id: 'aktif-satici',
    baslik: 'Aktif satıcı tanımı',
    soru: 'Bir satıcı ne zaman aktif sayılır?',
    neden: 'Kadro planı en az 20 ürün ve son 14 günde panel girişi istiyor. GAP planı en az 10 ürün ve firma doğrulaması istiyor.',
    secenekler: [
      { id: '20-urun', metin: 'Abone oldu, en az 20 ürün yayında, son 14 günde panele girdi' },
      { id: '10-urun', metin: 'Abone oldu, en az 10 ürün yayında, firma doğrulandı' },
    ],
    oneri: '20-urun',
    etki: 'Aktif satıcı hedefi, prim kriterleri ve CRM aşamaları.',
    ilgili: ['/hedefler/', '/karar/'],
  },
  {
    id: 'ekip-lideri',
    baslik: 'Ekip lideri',
    soru: 'Satış ekip lideri ne zaman belirlensin?',
    neden: 'Eski plan 27 Kasım Cuma günü karar verip 1 Aralık Salı günü başlatıyordu. Kadro planı 5 satış personeline ulaşınca ya da 60. günde belirlemeyi öneriyor.',
    secenekler: [
      { id: 'tetikleyici', metin: 'Satış ekibi 5 kişiye ulaşınca ya da programın 60. gününde' },
      { id: '1-aralik', metin: 'Eski plandaki gibi 1 Aralık Salı günü' },
    ],
    oneri: 'tetikleyici',
    etki: 'Organizasyon şeması, istihdam takvimi ve ücret kuralları.',
    ilgili: ['/istihdam/', '/roller/ekip-lideri/'],
  },
  {
    id: 'cozum-ikinci-yil',
    baslik: 'Çözüm ortağı 2. yıl oranı',
    soru: 'Destek veren çözüm ortağı 2. yılda yüzde kaç alsın?',
    neden: 'Affilate belgesinde fotoğrafta %10, metinde %15 yazıyor. Hesap şimdi %15 kullanıyor.',
    secenekler: [
      { id: '15', metin: '%15' },
      { id: '10', metin: '%10' },
    ],
    oneri: '15',
    etki: 'Satış ortaklığındaki yıllara yayılan çözüm ortağı seti.',
    ilgili: ['/satis-ortakligi/'],
  },
  {
    id: 'segika-komisyon-suresi',
    baslik: 'Segika komisyon süresi',
    soru: 'Segika satış ortağı komisyonu ne kadar süre ödenir?',
    neden: '28 Ekim Çarşamba kararı oranı belirledi ama sürenin ilk yıl mı, her ödemede mi olduğu açık kaldı.',
    secenekler: [
      { id: 'ilk-yil', metin: 'Yalnız ilk yıl' },
      { id: 'azalan', metin: 'Her ödemede, yıllar geçtikçe azalan oranla' },
      { id: 'sabit', metin: 'Müşteri kaldıkça her ödemede aynı oranla' },
    ],
    oneri: 'azalan',
    etki: 'Satış ortaklığı koşul setleri ve ödeme takvimi.',
    ilgili: ['/satis-ortakligi/'],
  },
  {
    id: 'egitmen',
    baslik: 'Etkinlik eğitmeni',
    soru: 'Etkinliklerde eğitimi kim verecek?',
    neden: 'Organizatör etkinliği yönetir ama uzman eğitimini tek başına üretemez. Görev hiçbir role yazılmamış.',
    secenekler: [
      { id: 'dis-uzman', metin: '3 ile 5 sözleşmeli dış eğitmen' },
      { id: 'yonetici', metin: 'İsmail Karaca' },
      { id: 'organizator', metin: 'Organizatör' },
    ],
    oneri: 'dis-uzman',
    etki: 'Etkinlik bütçesi ve organizatörün iş yükü.',
    ilgili: ['/kadro-kapasitesi/'],
  },
  {
    id: 'dijital-kapsam',
    baslik: 'Dijital uzmanın kapsamı',
    soru: 'Dijital pazarlama uzmanı hangi markalar için çalışacak?',
    neden: 'Görev tanımında kapsam yazılmamış. Segika dahil edilirse iş yükü 147 saatin üstüne çıkar.',
    secenekler: [
      { id: 'istoc', metin: 'Yalnız istoc.com' },
      { id: 'ikisi', metin: 'istoc.com ve Segika' },
    ],
    oneri: 'istoc',
    etki: 'Dijital uzmanın hedefleri ve kapasitesi.',
    ilgili: ['/roller/dijital-pazarlama/', '/kadro-kapasitesi/'],
  },
];
