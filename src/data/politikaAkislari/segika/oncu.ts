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
  tahsilatta: 'Seçili ayarda komisyon tahsilatta kazanılır ve aynı ay ödenir.',
  'hizmet-ayi': 'Seçili ayarda komisyon her hizmet ayı sonunda kazanılır ve ödenir.',
  'tahsilatta-taksit': 'Seçili ayarda komisyon tahsilatta kazanılır ve taksitlerle ödenir.',
};

function fiyatNotu(a: Ayar): string {
  return `Fiyat ${sayi(a.blok)} çalışanlık bloklarla hesaplanır. Örnek ${sayi(segikaAylik(a).kisi)} çalışanı esas alır.`;
}

const kayitAdimi = (sonraki: string): AkisAdimi => ({
  id: 'kayit', ad: 'İşvereni kaydedin', sorumlu: 'Siz',
  yap: ['İşverenin kayıtlı olup olmadığını sorun.', 'Kayıt yoksa işvereni adınıza bildirin.', 'Kayda sektörü ve yaklaşık çalışan sayısını yazın.'],
  soru: 'Kayıt sonucu ne oldu?',
  secenekler: [
    devam('acik', 'Kayıt benim adıma açıldı', sonraki),
    son('bekle', 'cakisma', 'Başka ortak bu işvereni bildirmiş', 'Kayıt kararı bekleniyor',
      'Ortaklık sorumlusu kayıt tarihlerini ve randevu kayıtlarını karşılaştırır.', 'Karar yazılana kadar görüşmeye başlamayın.'),
    son('bekle', 'kullanici', 'İşveren ürünü zaten kullanıyor', 'Hak durumu incelenmeli',
      'Ortaklık sorumlusu kaydı inceler.', 'Komisyon hakkı kabul edilen anlaşmaya göre belirlenir.'),
  ],
});

const gorusmeAdimi = (sonraki: string, ilgiliMetni: string): AkisAdimi => ({
  id: 'gorusme', ad: 'Bordro sürecini sorun', sorumlu: 'Siz', ek: 'kitle',
  yap: ['İşverene genel iletişim kanalından ulaşın.', 'Bordroyu ve teşvik takibini kimin yaptığını sorun.', 'Çalışan adı veya kimlik bilgisi istemeyin.'],
  soru: 'İşveren ne yanıt verdi?',
  dikkat: 'Mesaj göndermeden önce iletişim iznini kontrol edin.',
  secenekler: [
    devam('ilgili', ilgiliMetni, sonraki),
    son('bekle', 'buro', 'Bordroyu dış büro hazırlıyor', 'Karar veren netleşmeli',
      'Büronun karardaki rolünü kayda yazın.', 'Satış uzmanı büroyla görüşme planlar.', 'Karar veren belli olunca devam edin.'),
    son('bekle', 'liste', 'İşveren çalışan listesi göndermek istedi', 'Çalışan verisi alınmaz',
      'Listeyi almayın.', 'Veri aktarımının yolunu şirket yazılı belirlemelidir.', 'Görüşmeye örnek süreçle devam edin.'),
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
    son('bekle', 'tesvik', 'İşveren kesin teşvik tutarı sordu', 'Uzman değerlendirmesi bekleniyor',
      'Tutar söylemeyin.', 'Satış uzmanı uygunluğu şirketin yöntemiyle değerlendirir.', 'Uzman yanıtlayınca görüşmeye dönün.'),
    son('bitir', 'uygunsuz', 'Ürün ihtiyacı karşılamıyor', 'Görüşme kapandı',
      'Uyumsuzluk nedenini kayda yazın.', 'Satış ısrarı yapmayın.'),
  ],
});

const teklifAdimi = (sonraki: string): AkisAdimi => ({
  id: 'teklif', ad: 'Onaylı teklifle görüşme', sorumlu: 'Siz ve satış yöneticisi (önerilen görev)', ek: 'sinir',
  yap: ['Teklifi yetkili kişiden isteyin.', 'Görüşmeyi yalnız onaylı teklifle yürütün.', 'Fiyat, indirim ve teşvik sözü vermeyin.'],
  soru: 'Teklif görüşmesi nasıl sonuçlandı?',
  secenekler: [
    devam('kabul', 'İşveren onaylı teklifi kabul etti', sonraki),
    son('bekle', 'sayi', 'Çalışan sayısı değişti', 'Teklif yeniden kontrol edilmeli',
      'Satış yöneticisi teklifi yeniden kontrol eder.', 'Sayı aynı blokta kalırsa fiyat değişmeyebilir.'),
    son('bekle', 'indirim', 'İşveren indirim istedi', 'Fiyat kararı bekleniyor',
      'Talebi satış yöneticisine iletin.', 'Yetkili kişi onaylarsa yeni teklifi şirket gönderir.'),
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
      yap: ['Katkı seviyenizi yazılı olarak belirleyin.', SEVIYE_METNI[s], 'Teşvik konusunda söyleyebileceğiniz cümleleri öğrenin.'],
      soru: 'Çalışma anlaşmanız ne durumda?',
      secenekler: [
        devam('var', 'Yazılı anlaşmam var', 'kayit'),
        son('bekle', 'taslak', 'Anlaşma henüz taslak', 'Anlaşma bekleniyor',
          'Ortaklık sorumlusu seviyenizi ve ödeme koşulunu yazmalı.', 'Metin hazır olunca bu adıma dönün.'),
        son('bekle', 'belge', 'Ödeme belgesi belli değil', 'Ödeme belgesi netleşmeli',
          'Mali müşavir uygun belgeyi ve olası kesintileri belirlemeli.', 'Belge türü yazılınca anlaşmaya dönün.'),
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
      ? ['Görüşme notunu satış uzmanına iletin.', 'Gösterimi ve teklifi satış uzmanı yürütür.', 'Uzman kabul edince işverene bilgi verin.']
      : ['Teşvik ve bordro sorularını uzmana iletin.', 'Teklifi ve satışı satış uzmanı kapatır.', 'Uzman kabul edince işverene bilgi verin.'],
    soru: 'Satış uzmanı devri aldı mı?',
    secenekler: [
      devam('aldi', 'Satış uzmanı devri kabul etti', 'odeme'),
      son('bekle', 'uzman', 'Henüz uzman belirlenmedi', 'Uzman bekleniyor',
        'Satış yöneticisi uygun uzmanı belirlemeli.', 'Bu sırada randevu sözü vermeyin.'),
      son('bitir', 'vazgecti', 'İşveren devirden önce vazgeçti', 'Görüşme kapandı', 'Vazgeçme nedenini kayda yazın.'),
    ],
  });
  adimlar.push(
    {
      id: 'odeme', ad: 'Sözleşme ve ödeme', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
      yap: ['Sözleşmeyi şirket hazırlar. İşveren ödemeyi şirkete yapar.', 'Komisyon için işverenin ödemesi gerekir.',
        a.model === 'oran' ? `Seçili seviyede bir yıllık paket için örnek komisyon ${tutar} olur.` : `Seçili ayarda satış başı sabit örnek tutar ${tutar} olur.`],
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
      yap: ['Çalışan verisini yalnız kurulum ekibine yönlendirin.', 'Kurulum ekibi devri alınca teslim notu ekler.', 'Destek isteğini şirketin destek kanalına yönlendirin.'],
      soru: 'Kurulum ne durumda?',
      secenekler: [
        devam('basladi', 'Kurulum ekibi devri aldı', 'iade'),
        son('bekle', 'yol', 'Veri aktarım yolu henüz belli değil', 'Aktarım yolu bekleniyor',
          'Şirket aktarım yolunu ve zamanını yazılı belirlemeli.', 'Bu sırada çalışan verisi almayın.'),
        son('bekle', 'kaza', 'Bana yanlışlıkla çalışan verisi geldi', 'Veri bildirimi',
          'Veriyi paylaşmayın.', 'Durumu hemen veri koruma sorumlusuna bildirin.', 'Silme işlemini o görev yönetir.'),
      ],
    },
    {
      id: 'iade', ad: 'İade ve itiraz', sorumlu: 'Finans sorumlusu (önerilen görev)',
      yap: ['İade olursa tutarı ve tarihi kayda yazın.', 'İtirazınızı kanıtıyla yazılı iletin.', 'Karar kabul edilen anlaşmaya göre verilir.'],
      soru: 'Komisyon için son durum nedir?',
      secenekler: [
        son('tamamla', 'temiz', 'İade veya itiraz yok', 'Bu satışın rehber işi bitti',
          'Yenileme görüşmesini kimin yapacağı yazılı olmalıdır.'),
        son('bekle', 'iade', 'İşveren ilk bordro döneminden sonra iptal istedi', 'İade incelemesi',
          'Finans sorumlusu komisyonu iade kuralına göre değerlendirir.', 'Kural eksikse taraflar yazılı netleştirmeli.'),
        son('bekle', 'itiraz', 'Komisyon hesabına itiraz ediyorum', 'İtiraz incelemesi',
          'Finans sorumlusu itirazı inceler.', 'Kararı kabul edilen anlaşmaya göre yazılı açıklar.'),
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
      yap: ['Bu programda satışı siz kapatırsınız.', 'Müşteri desteğini şirket verir.', 'Komisyon müşterinin hizmet yıllarına yayılır.'],
      soru: 'Program anlaşmanız ne durumda?',
      secenekler: [
        devam('var', 'Yazılı program anlaşmam var', 'kayit'),
        son('bekle', 'taslak', 'Anlaşma henüz taslak', 'Anlaşma bekleniyor',
          'Ortaklık sorumlusu yıllık oranları ve ödeme zamanını yazmalı.', 'Metin hazır olunca bu adıma dönün.'),
        son('bekle', 'belge', 'Ödeme belgesi belli değil', 'Ödeme belgesi netleşmeli',
          'Mali müşavir uygun belgeyi ve olası kesintileri belirlemeli.', 'Belge türü yazılınca anlaşmaya dönün.'),
      ],
    },
    kayitAdimi('gorusme'),
    gorusmeAdimi('gosterim', 'İşveren uzun süreli kullanım düşünüyor'),
    gosterimAdimi('teklif'),
    teklifAdimi('odeme'),
    {
      id: 'odeme', ad: 'Ödeme ve hizmet ayları', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
      yap: [a.affOdeme === 'paket' ? 'Seçili ayarda işveren yıllık paketi peşin öder.' : 'Seçili ayarda işveren her ay öder.',
        ODEME_ZAMANI[a.affPolitika.satis], 'Müşteri ödemezse komisyon doğmaz.'],
      soru: 'İşverenin ödeme durumu nedir?',
      dikkat: `Yıllık paket ${tl(yillik)} olarak hesaplanır. Oranlar ${oranlar} şeklindedir.`,
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
      yap: ['Hesap müşterinin her yıl yenilediğini varsayar.', 'Yenileme olmazsa sonraki yıl kazancı oluşmaz.',
        !sonuc.hatalar.length ? `Bir müşteri için ${a.affUfukAy} aylık örnek ${tl(toplam)} olur. Bu tutar garanti değildir.` : 'Örnek hesap bu ayarda üretilemedi.'],
      soru: 'Yenileme durumu nedir?',
      secenekler: [
        devam('yeniledi', 'İşveren aboneliği yeniledi', 'iade'),
        son('bekle', 'zaman', 'Yenileme zamanı henüz gelmedi', 'Yenileme bekleniyor',
          'Ortaklık sorumlusu yenileme tarihini kayda yazar.', 'Tarih gelince bu adıma dönün.'),
        son('tamamla', 'yenilemedi', 'İşveren yenilemedi', 'Bu müşterinin yıllara yayılan işi bitti',
          'Sonraki yıl kazancı oluşmaz.', 'Geçmiş hizmet ayları kabul edilen anlaşmaya göre hesaplanır.'),
      ],
    },
    {
      id: 'iade', ad: 'İade ve itiraz', sorumlu: 'Finans sorumlusu (önerilen görev)',
      yap: ['İade olursa komisyon geri alınır.', 'İade tutarını ve tarihini kayda yazın.', 'İtirazınızı kanıtıyla yazılı iletin.'],
      soru: 'Komisyon için son durum nedir?',
      secenekler: [
        son('tamamla', 'temiz', 'İade veya itiraz yok', 'Bu yılın rehber işi bitti',
          'Bir sonraki yenilemede yenileme adımına dönün.'),
        son('bekle', 'iade', 'İşveren iade aldı', 'İade incelemesi',
          'Finans sorumlusu geri alınacak komisyonu yazılı açıklar.', 'Yöntem eksikse taraflar yazılı netleştirmeli.'),
        son('bekle', 'itiraz', 'Komisyon hesabına itiraz ediyorum', 'İtiraz incelemesi',
          'Finans sorumlusu itirazı inceler.', 'Kararı kabul edilen anlaşmaya göre yazılı açıklar.'),
      ],
    },
  ];
}

export const akisOlustur: AkisOlustur = (a) => {
  const program = seciliKosul(a, 'oncu').id;
  if (program === 'yillara') return {
    baslik: 'Öncü satış ortağı: yıllara yayılan komisyon',
    ozet: 'Satışı siz kapatırsınız. Komisyon müşterinin hizmet yıllarına yayılır.',
    hedef: 'İşveren ödeme yapsın ve yenileme takibi kayda geçsin.',
    ilk: 'anlasma',
    adimlar: yillaraAkisi(a),
  };
  return {
    baslik: 'Öncü satış ortağı: ana program',
    ozet: SEVIYE_METNI[a.oncuSeviye],
    hedef: 'Uygun işveren onaylı teklifle satışa ve kuruluma ulaşsın.',
    ilk: 'anlasma',
    adimlar: anaAkis(a),
  };
};
