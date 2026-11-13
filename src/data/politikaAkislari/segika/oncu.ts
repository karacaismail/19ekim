import type { AkisAdimi, AkisOlustur, AkisSecenegi } from '../types';
import { satisKazanci, segikaAylik, yillikFiyat, type Ayar, type Seviye } from '../../satisOrtakligi';
import { affilateHesabi, seciliKosul } from '../../kosullar';

const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n))} TL`;
const yuzde = (n: number) => `%${sayi(n * 100)}`;

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const son = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, ...aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

const SEVIYE_METNI: Record<Seviye, string> = {
  A: 'Katkınız yalnız tanıştırmadır. Gösterimi ve satışı satış uzmanı yürütür.',
  B: 'Katkınız tanıştırma ve ürün gösterimidir. Satışı satış uzmanı kapatır.',
  C: 'Katkınız tanıştırma, gösterim ve onaylı teklifle satışı kapatmaktır.',
};

const ODEME_ZAMANI: Record<Ayar['affPolitika']['satis'], string> = {
  tahsilatta: 'İşveren ödeyince komisyonu hak edersiniz. Şirket komisyonu aynı ay öder.',
  'hizmet-ayi': 'Her hizmet ayı bitince o ayın komisyonunu hak edersiniz. Şirket komisyonu aynı ay öder.',
  'tahsilatta-taksit': 'İşveren ödeyince komisyonu hak edersiniz. Şirket komisyonu taksitle öder.',
};

/** Fiyat kuralı: fiyat tablodaki fiyattır ve herkes için aynıdır. */
function fiyatNotu(a: Ayar): string {
  return `Şirket fiyatı, çalışan sayısını ${sayi(a.blok)} kişilik gruplara yukarı yuvarlayarak hesaplar. Bu örnek ${sayi(segikaAylik(a).kisi)} çalışana göredir. Fiyat herkes için aynıdır.`;
}

const kayitAdimi = (sonraki: string): AkisAdimi => ({
  id: 'kayit', ad: 'İşvereni kaydedin', sorumlu: 'Siz',
  yap: ['İşverenin kayıtlı olup olmadığını sorun.', 'Kayıt yoksa işvereni adınıza bildirin.', 'Kayda sektörü ve yaklaşık çalışan sayısını yazın.'],
  soru: 'Kayıt sonucu ne oldu?',
  secenekler: [
    devam('acik', 'Kayıt benim adıma açıldı', sonraki),
    son('bekle', 'cakisma', 'Başka ortak bu işvereni bildirmiş', 'Kayıt kararını bekleyin',
      'Ortaklık sorumlusu kayıt tarihlerini ve randevu kayıtlarını karşılaştırır.', 'Ortaklık sorumlusu kararı size yazılı bildirir.',
      'Karar yazılana kadar görüşmeye başlamayın.'),
    son('bekle', 'kullanici', 'İşveren ürünü zaten kullanıyor', 'Kayıt incelemesini bekleyin',
      'Ortaklık sorumlusu kaydı inceler.', 'Ortaklık sorumlusu komisyon hakkını anlaşmaya göre belirler.', 'Karar gelince bu adıma dönün.'),
  ],
});

const gorusmeAdimi = (sonraki: string, ilgiliMetni: string): AkisAdimi => ({
  id: 'gorusme', ad: 'Bordro sürecini sorun', sorumlu: 'Siz', ek: 'kitle',
  yap: ['İşverene genel iletişim kanalından ulaşın.', 'Bordroyu ve teşvik takibini kimin yaptığını sorun.', 'Çalışan adı veya kimlik bilgisi istemeyin.'],
  soru: 'İşveren ne yanıt verdi?',
  dikkat: 'Mesaj göndermeden önce iletişim iznini kontrol edin.',
  secenekler: [
    devam('ilgili', ilgiliMetni, sonraki),
    son('bekle', 'buro', 'Bordroyu dış büro hazırlıyor', 'Karar vereni öğrenin',
      'Büronun karardaki rolünü kayda yazın.', 'Satış uzmanı büroyla görüşme planlar.', 'Karar veren belli olunca bu adıma dönün.'),
    son('bekle', 'liste', 'İşveren çalışan listesi göndermek istedi', 'Çalışan listesini almayın',
      'Listeyi almayın.', 'Kurulum ekibi veri aktarım yolunu yazılı belirler.', 'Görüşmeye örnek süreçle devam edin.'),
    son('bitir', 'ret', 'İşveren görüşmek istemedi', 'Görüşme kapandı',
      'Ret bilgisini kayda yazın.', 'Bu kişiye yeniden ulaşmayın.'),
  ],
});

const gosterimAdimi = (sonraki: string): AkisAdimi => ({
  id: 'gosterim', ad: 'Ürün gösterimi', sorumlu: 'Siz', ek: 'sinir',
  yap: ['Gösterimde yalnız örnek veri kullanın.', 'Teşvik tutarı veya sonucu söylemeyin.', 'Görüşme notunu kayda ekleyin.'],
  soru: 'Gösterimden sonra ne oldu?',
  secenekler: [
    devam('teklif', 'İşveren teklif istedi', sonraki),
    son('bekle', 'tesvik', 'İşveren kesin teşvik tutarı sordu', 'Satış uzmanının yanıtını bekleyin',
      'Tutar söylemeyin.', 'Satış uzmanı uygunluğu şirketin yöntemiyle değerlendirir.', 'Satış uzmanı yanıtlayınca bu adıma dönün.'),
    son('bitir', 'uygunsuz', 'Ürün ihtiyacı karşılamıyor', 'Görüşme kapandı',
      'Uyumsuzluk nedenini kayda yazın.', 'Satış ısrarı yapmayın.'),
  ],
});

const teklifAdimi = (sonraki: string): AkisAdimi => ({
  id: 'teklif', ad: 'Onaylı teklifle görüşme', sorumlu: 'Siz ve satış yöneticisi (önerilen görev)', ek: 'sinir',
  yap: ['Onaylı teklifi satış yöneticisinden isteyin.', 'Görüşmeyi yalnız bu teklifle yürütün.', 'Fiyat tablodaki fiyattır. İndirim ve teşvik sözü vermeyin.'],
  soru: 'Teklif görüşmesi nasıl sonuçlandı?',
  secenekler: [
    devam('kabul', 'İşveren onaylı teklifi kabul etti', sonraki),
    son('bekle', 'sayi', 'Çalışan sayısı değişti', 'Güncel teklifi bekleyin',
      'Satış yöneticisi teklifi yeni çalışan sayısıyla günceller.', 'Sayı aynı blokta kalırsa fiyat değişmez.', 'Güncel teklif gelince bu adıma dönün.'),
    son('bekle', 'indirim', 'İşveren indirim istedi', 'İşverenin kararını bekleyin',
      'Fiyatın herkes için aynı olduğunu söyleyin.', 'Talebi kimseye iletmeyin. Şirket yeni teklif hazırlamaz.',
      'İşveren onaylı teklifi kabul ederse bu adıma dönün.'),
    son('bitir', 'red', 'İşveren teklifi reddetti', 'Satış kapandı',
      'Gerekçeyi kayda yazın.', 'Israr etmeyin.'),
  ],
});

function anaAkis(a: Ayar): AkisAdimi[] {
  const s = a.oncuSeviye;
  const tutar = tl(satisKazanci(a, s));
  const adimlar: AkisAdimi[] = [
    {
      id: 'anlasma', ad: 'Yazılı anlaşma', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
      yap: ['Ortaklık sorumlusu katkı seviyenizi sizinle yazılı belirler.', SEVIYE_METNI[s],
        'Ortaklık sorumlusu teşvik için onaylı cümleleri size verir.'],
      soru: 'Çalışma anlaşmanız ne durumda?',
      secenekler: [
        devam('var', 'Yazılı anlaşmam var', 'kayit'),
        son('bekle', 'taslak', 'Anlaşma henüz taslak', 'Anlaşma bekleniyor',
          'Ortaklık sorumlusu seviyenizi ve ödeme koşulunu yazar.', 'Anlaşma metni hazır olunca bu adıma dönün.'),
        son('bekle', 'belge', 'Ödeme belgesi belli değil', 'Ödeme belgesini bekleyin',
          'Şirketin mali müşaviri uygun belgeyi ve olası kesintileri belirler.', 'Belge türü yazılınca bu adıma dönün.'),
      ],
    },
    kayitAdimi('gorusme'),
    gorusmeAdimi(s === 'A' ? 'devir' : 'gosterim', 'İşveren bordro yükünü anlattı'),
  ];
  if (s !== 'A') adimlar.push(gosterimAdimi(s === 'C' ? 'teklif' : 'devir'));
  if (s === 'C') adimlar.push(teklifAdimi('odeme'));
  else adimlar.push({
    id: 'devir', ad: 'Satış uzmanına devir', sorumlu: 'Siz ve satış uzmanı (önerilen görev)',
    yap: s === 'A'
      ? ['Görüşme notunu satış uzmanına iletin.', 'Gösterimi ve teklifi satış uzmanı yürütür.', 'Satış uzmanı devri kabul edince işverene bilgi verin.']
      : ['Teşvik ve bordro sorularını satış uzmanına iletin.', 'Teklifi ve satışı satış uzmanı kapatır.', 'Satış uzmanı devri kabul edince işverene bilgi verin.'],
    soru: 'Satış uzmanı devri aldı mı?',
    secenekler: [
      devam('aldi', 'Satış uzmanı devri kabul etti', 'odeme'),
      son('bekle', 'uzman', 'Henüz uzman belirlenmedi', 'Satış uzmanını bekleyin',
        'Satış yöneticisi uygun satış uzmanını belirler.', 'Bu sırada randevu sözü vermeyin.', 'Satış uzmanı belli olunca bu adıma dönün.'),
      son('bitir', 'vazgecti', 'İşveren devirden önce vazgeçti', 'Görüşme kapandı', 'Vazgeçme nedenini kayda yazın.'),
    ],
  });
  adimlar.push(
    {
      id: 'odeme', ad: 'Sözleşme ve ödeme', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
      yap: ['Şirket sözleşmeyi hazırlar. İşveren ödemeyi şirkete yapar.', 'İşveren ödemezse komisyon doğmaz.',
        a.model === 'oran' ? `Bu örnekte bir yıllık paketin komisyonu ${tutar} olur.` : `Bu örnekte her satışın sabit komisyonu ${tutar} olur.`],
      soru: 'İşverenin ödeme durumu nedir?',
      dikkat: fiyatNotu(a),
      secenekler: [
        devam('odedi', 'İşveren ödemeyi yaptığını bildirdi', 'kurulum'),
        son('bekle', 'odemedi', 'Ödeme henüz yapılmadı', 'Tahsilat bekleniyor',
          'Tahsilat olmadan komisyon doğmaz.', 'Finans sorumlusu tahsilatı izler ve size yazılı bildirir.'),
        son('bekle', 'hesap', 'İşveren ödemeyi hesabıma göndermek istedi', 'Ödeme şirkete yapılmalı',
          'Ödemeyi kabul etmeyin.', 'Finans sorumlusu işverene şirketin ödeme yolunu iletir.'),
      ],
    },
    {
      id: 'kurulum', ad: 'Kurulum ve veri aktarımı', sorumlu: 'Kurulum ekibi (önerilen görev)',
      yap: ['Kurulum ekibi çalışan verisini işverenden kendisi alır.', 'Kurulum ekibi devri alınca teslim notu ekler.',
        'Siz destek isteklerini şirketin destek kanalına yönlendirin.'],
      soru: 'Kurulum ne durumda?',
      secenekler: [
        devam('basladi', 'Kurulum ekibi devri aldı', 'iade'),
        son('bekle', 'yol', 'Veri aktarım yolu henüz belli değil', 'Aktarım yolunu bekleyin',
          'Kurulum ekibi aktarım yolunu ve zamanını yazılı belirler.', 'Bu sırada çalışan verisi almayın.', 'Yol belli olunca bu adıma dönün.'),
        son('bekle', 'kaza', 'Bana yanlışlıkla çalışan verisi geldi', 'Veriyi hemen bildirin',
          'Veriyi paylaşmayın.', 'Durumu hemen veri koruma sorumlusuna bildirin.', 'Veri koruma sorumlusu silme işlemini yönetir.'),
      ],
    },
    {
      id: 'iade', ad: 'İade ve itiraz', sorumlu: 'Finans sorumlusu (önerilen görev)',
      yap: ['Finans sorumlusu iade tutarını ve tarihini kayda yazar.', 'Siz itirazınızı kanıtıyla finans sorumlusuna yazın.',
        'Finans sorumlusu kararı imzalı anlaşmaya göre verir.'],
      soru: 'Komisyon için son durum nedir?',
      secenekler: [
        son('tamamla', 'temiz', 'İade veya itiraz yok', 'Bu satışın rehber işi bitti',
          'Ortaklık sorumlusu yenileme görüşmesini kimin yapacağını yazar.'),
        son('bekle', 'iade', 'İşveren ilk bordro döneminden sonra iptal istedi', 'İade incelemesini bekleyin',
          'Finans sorumlusu komisyonu iade kuralına göre değerlendirir.', 'Kural yazılı değilse finans sorumlusu kuralı sizinle yazar.',
          'Karar gelince bu adıma dönün.'),
        son('bekle', 'itiraz', 'Komisyon hesabına itiraz ediyorum', 'İtiraz incelemesini bekleyin',
          'Finans sorumlusu itirazı inceler.', 'Finans sorumlusu kararı imzalı anlaşmaya göre yazılı açıklar.'),
      ],
    },
  );
  return adimlar;
}

function yillaraAkisi(a: Ayar): AkisAdimi[] {
  const sonuc = affilateHesabi(a, 'satis');
  const toplam = sonuc.ortaklar.reduce((n, o) => n + o.planlanan, 0) / 100;
  const yillik = yillikFiyat(a);
  const oranlar = a.yillaraOncu.map((o, i) => `${i + 1}. yıl ${yuzde(o)}`).join(', ');
  return [
    {
      id: 'anlasma', ad: 'Program anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
      yap: ['Bu programda satışı siz kapatırsınız. Müşteri desteğini şirket verir.', 'Komisyon müşterinin hizmet yıllarına yayılır.',
        'Ortaklık sorumlusu yıllık oranları anlaşmaya yazar.'],
      soru: 'Program anlaşmanız ne durumda?',
      secenekler: [
        devam('var', 'Yazılı program anlaşmam var', 'kayit'),
        son('bekle', 'taslak', 'Anlaşma henüz taslak', 'Anlaşma bekleniyor',
          'Ortaklık sorumlusu yıllık oranları ve ödeme zamanını yazar.', 'Anlaşma metni hazır olunca bu adıma dönün.'),
        son('bekle', 'belge', 'Ödeme belgesi belli değil', 'Ödeme belgesini bekleyin',
          'Şirketin mali müşaviri uygun belgeyi ve olası kesintileri belirler.', 'Belge türü yazılınca bu adıma dönün.'),
      ],
    },
    kayitAdimi('gorusme'),
    gorusmeAdimi('gosterim', 'İşveren uzun süreli kullanım düşünüyor'),
    gosterimAdimi('teklif'),
    teklifAdimi('odeme'),
    {
      id: 'odeme', ad: 'Ödeme ve hizmet ayları', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
      yap: [a.affOdeme === 'paket' ? 'Bu örnekte işveren yıllık paketi peşin öder.' : 'Bu örnekte işveren her ay öder.',
        ODEME_ZAMANI[a.affPolitika.satis], 'İşveren ödemezse komisyon doğmaz.'],
      soru: 'İşverenin ödeme durumu nedir?',
      dikkat: `Bu örnekte yıllık paket ${tl(yillik)} eder. Komisyon oranı ${oranlar} olur.`,
      secenekler: [
        devam('odedi', 'İşveren ilk ödemeyi yaptığını bildirdi', 'yenileme'),
        son('bekle', 'odemedi', 'Ödeme henüz yapılmadı', 'Tahsilat bekleniyor',
          'Ödeme olmadan komisyon doğmaz.', 'Finans sorumlusu tahsilatı izler ve size yazılı bildirir.'),
        son('bekle', 'hesap', 'İşveren ödemeyi hesabıma göndermek istedi', 'Ödeme şirkete yapılmalı',
          'Ödemeyi kabul etmeyin.', 'Finans sorumlusu işverene şirketin ödeme yolunu iletir.'),
      ],
    },
    {
      id: 'yenileme', ad: 'Yıllık yenileme', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
      yap: ['Bu örnek, işverenin her yıl yenilediğini varsayar.', 'İşveren yenilemezse sonraki yılın komisyonu oluşmaz.',
        !sonuc.hatalar.length ? `Bir işverenden ${a.affUfukAy} ayda örnek kazancınız ${tl(toplam)} olur. Bu tutar garanti değildir.` : 'Bu koşullarla örnek hesap çıkmıyor.'],
      soru: 'Yenileme durumu nedir?',
      secenekler: [
        devam('yeniledi', 'İşveren aboneliği yeniledi', 'iade'),
        son('bekle', 'zaman', 'Yenileme zamanı henüz gelmedi', 'Yenileme bekleniyor',
          'Ortaklık sorumlusu yenileme tarihini kayda yazar.', 'Yenileme tarihi gelince bu adıma dönün.'),
        son('tamamla', 'yenilemedi', 'İşveren yenilemedi', 'Bu müşterinin yıllara yayılan işi bitti',
          'Sonraki yılın komisyonu oluşmaz.', 'Finans sorumlusu geçmiş hizmet aylarının komisyonunu anlaşmaya göre hesaplar.'),
      ],
    },
    {
      id: 'iade', ad: 'İade ve itiraz', sorumlu: 'Finans sorumlusu (önerilen görev)',
      yap: ['İşveren iade alırsa şirket komisyonu geri alır.', 'Finans sorumlusu iade tutarını ve tarihini kayda yazar.',
        'Siz itirazınızı kanıtıyla finans sorumlusuna yazın.'],
      soru: 'Komisyon için son durum nedir?',
      secenekler: [
        son('tamamla', 'temiz', 'İade veya itiraz yok', 'Bu yılın rehber işi bitti',
          'Sonraki yenileme tarihinde “Yıllık yenileme” adımına dönün.'),
        son('bekle', 'iade', 'İşveren iade aldı', 'İade incelemesini bekleyin',
          'Finans sorumlusu geri alınacak komisyonu yazılı açıklar.', 'Yöntem yazılı değilse finans sorumlusu yöntemi sizinle yazar.'),
        son('bekle', 'itiraz', 'Komisyon hesabına itiraz ediyorum', 'İtiraz incelemesini bekleyin',
          'Finans sorumlusu itirazı inceler.', 'Finans sorumlusu kararı imzalı anlaşmaya göre yazılı açıklar.'),
      ],
    },
  ];
}

export const akisOlustur: AkisOlustur = (a) => {
  const program = seciliKosul(a, 'oncu').id;
  if (program === 'yillara') return {
    baslik: 'Öncü satış ortağı için yıllara yayılan komisyon',
    ozet: 'Satışı siz kapatırsınız. Komisyon müşterinin hizmet yıllarına yayılır.',
    hedef: 'İşveren ödeme yapsın ve yenileme takibi kayda geçsin.',
    ilk: 'anlasma',
    adimlar: yillaraAkisi(a),
  };
  return {
    baslik: 'Öncü satış ortağının ana programı',
    ozet: SEVIYE_METNI[a.oncuSeviye],
    hedef: 'Bu programın amacı, uygun işverenin onaylı teklifle satın almasıdır. Satıştan sonra kurulum başlar.',
    ilk: 'anlasma',
    adimlar: anaAkis(a),
  };
};
