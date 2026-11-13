import type { AkisAdimi, AkisOlustur, AkisSecenegi } from '../types';
import { kadrolu, rolMetinleri, segikaAylik, yillikFiyat, type SegikaPaket } from '../../satisOrtakligi';

const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n))} TL`;
const yuzde = (n: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n * 100)}`;
const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n);

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const son = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

/** Paket adları kısaltmasız, yalın biçimde yazılır. */
const PAKET: Record<SegikaPaket, string> = {
  ikisi: 'teşvik ve otomasyon paketi',
  tesvik: 'sigorta teşviki paketi',
  otomasyon: 'sigorta otomasyonu paketi',
};

export const akisOlustur: AkisOlustur = (a) => {
  // Bu projede kadrolu rol için yalnız ana program vardır.
  const kurallar = rolMetinleri('segika').find((r) => r.id === 'kadrolu')!.kurallar;
  const odemeKurali = kurallar.find((k) => k.startsWith('Prim')) ?? kurallar[kurallar.length - 1];
  const k = kadrolu(a);
  const fiyat = segikaAylik(a);
  const primKurali = a.model === 'oran'
    ? `Kotayı aşan satış tutarının ${yuzde(a.kadroluPrim.segika)} kadarı prim olur.`
    : `Kota dolduktan sonraki her satış için ${tl(a.sabit)} prim alırsınız.`;
  const ornek = k.prim > 0
    ? `Bu örnekte ${sayi(a.kadroluSatis)} satışla prim ${tl(k.prim)} olur.`
    : `Bu örnekteki ${sayi(a.kadroluSatis)} satış kotayı aşmaz. Kotayı doldurmak için ${sayi(k.kotaIcinSatis)} satış gerekir. Satış işi yine aynı adımlarla ilerler.`;

  const adimlar: AkisAdimi[] = [
    {
      id: 'gorev',
      ad: 'Görevinizi ve prim ekinizi alın',
      sorumlu: 'Siz ve insan kaynakları sorumlusu',
      yap: [
        'İnsan kaynakları size yazılı görev tanımı verir.',
        'Prim ekindeki başlangıç dönemi kuralını okuyun.',
        'Maaşın net mi brüt mü olduğunu sorun.',
      ],
      dikkat: 'Şirket bu rol için kotasız başlangıç dönemi belirlemedi. Böyle bir dönem varsaymayın.',
      soru: 'Görev tanımınız ve prim ekiniz hazır mı?',
      ek: 'anlasma',
      secenekler: [
        devam('hazir', 'Görev tanımı ve prim eki elimde', 'kayit'),
        son('bekle', 'ek-yok', 'Görev tanımı var, prim eki yok', 'Prim eki bekleniyor', [
          'İnsan kaynakları ve finans ekibi prim ekini yazar.',
          'Ek gelene kadar kendinize prim hesabı yapmayın.',
          'Prim eki gelince bu adıma dönün.',
        ]),
        son('bekle', 'sozlesme-yok', 'Henüz iş sözleşmem yok', 'İş sözleşmesi bekleniyor', [
          'İnsan kaynakları iş sözleşmesini hazırlar.',
          'Sözleşme imzalanınca bu adıma dönün.',
        ]),
      ],
    },
    {
      id: 'kayit',
      ad: 'İşveren kaydını kontrol edin',
      sorumlu: 'Siz',
      yap: [
        'İşvereni müşteri takip sisteminde arayın.',
        'İşverenin mali müşaviri kaydı önceden açmış olabilir.',
        'Kişinin iletişim tercihini kontrol edin.',
      ],
      soru: 'Kayıt aramasında ne buldunuz?',
      ek: 'kitle',
      secenekler: [
        devam('bos', 'İşveren kayıtlı değil, görüşmeyi kabul etti', 'ihtiyac'),
        son('bekle', 'kayitli', 'İşveren başka çalışana, mali müşavire veya danışmana kayıtlı', 'Kayıt kararını bekleyin', [
          'Satış yöneticisi kayıt tarihlerine bakıp karar verir.',
          'Karar yazılana kadar teklif göndermeyin.',
          'Karar gelince bu adıma dönün.',
        ]),
        son('bitir', 'ret', 'Kişi iletişim istemiyor', 'Görüşme kapandı', [
          'Tercihini müşteri kaydına yazın.',
          'Bu kişiye pazarlama iletisi göndermeyin.',
        ]),
      ],
    },
    {
      id: 'ihtiyac',
      ad: 'Teşvik ve bordro sürecini öğrenin',
      sorumlu: 'Siz',
      yap: [
        'Teşvik kontrolünü kimin yaptığını sorun.',
        'Bordroyu kimin hazırladığını öğrenin.',
        'Yaklaşık çalışan sayısını sorun.',
      ],
      soru: 'İşverenin durumu nedir?',
      secenekler: [
        devam('uygun', 'Teşvik veya bordro sorunu var, karar vereni tanıdım', 'gosterim'),
        son('bekle', 'musavir', 'Kararı mali müşavirleri veriyor', 'Mali müşavirle görüşme bekleniyor', [
          'İşverene mali müşavirini görüşmeye çağırmasını önerin.',
          'Ortak görüşme tarihi belli olunca bu adıma dönün.',
        ]),
        son('bitir', 'ilgisiz', 'İşveren ilgilenmiyor', 'Görüşme kapandı', [
          'Ret nedenini müşteri kaydına yazın.',
        ]),
      ],
    },
    {
      id: 'gosterim',
      ad: 'Kimliksiz örnekle gösterim yapın',
      sorumlu: 'Siz',
      yap: [
        'Yalnız kimliksiz örnek veri kullanın.',
        'Gerçek çalışan dosyası istemeyin.',
        'Teşvik tutarı veya sonuç sözü vermeyin.',
      ],
      soru: 'Gösterimden sonra işveren ne dedi?',
      ek: 'sinir',
      secenekler: [
        devam('teklif-istedi', 'İşveren teklif istedi', 'teklif'),
        son('bitir', 'tesvik-tutari', 'İşveren kesin teşvik tutarı istiyor', 'Tutar sözü veremezsiniz', [
          'Tutar sözü veremeyeceğinizi açıkça söyleyin.',
          'İşveren tutarsız devam etmezse görüşmeyi kapatın.',
        ]),
        son('bekle', 'gercek-dosya', 'İşveren gerçek çalışan dosyası gönderdi', 'Kişisel veri kararını bekleyin', [
          'Dosyayı açmayın ve saklamayın.',
          'Satış yöneticisi kişisel veri sorumlusuyla sonraki işlemi belirler.',
          'Karar gelince bu adıma dönün.',
        ]),
      ],
    },
    {
      id: 'teklif',
      ad: 'Paket ve çalışan sayısıyla teklif hazırlayın',
      sorumlu: 'Siz ve satış yöneticisi',
      yap: [
        `Bu örnekte işverenin ${sayi(a.calisan)} çalışanı vardır. Örnek ${PAKET[a.segikaPaket]} için hesaplanır.`,
        `Bu örnekte yıllık paket ${tl(yillikFiyat(a))} eder.`,
        'Teklife paketi ve çalışan sayısını yazın.',
        'Fiyat tablodaki fiyattır. İndirim yoktur.',
      ],
      dikkat: `Şirket fiyatı ${sayi(a.blok)} çalışanlık bloklarla hesaplar. Bu örnek ${sayi(fiyat.kisi)} çalışana göredir. Sayı aynı blokta kalırsa fiyat değişmez.`,
      soru: 'Teklifin durumu nedir?',
      ek: 'kazanc',
      secenekler: [
        devam('kabul', 'İşveren onaylı teklifi kabul etti', 'sozlesme'),
        son('bekle', 'sayi-degisti', 'Çalışan sayısı teklif sonrası değişti', 'Güncel teklifi bekleyin', [
          'Yeni sayıyı finans ekibine bildirin.',
          'Fiyat değişirse satış yöneticisi teklifi tablo fiyatıyla günceller.',
          'Güncel teklif gelince bu adıma dönün.',
        ]),
        son('bekle', 'indirim', 'İşveren indirim istiyor', 'İşverenin kararını bekleyin', [
          'Fiyatın herkes için aynı olduğunu söyleyin.',
          'Talebi kimseye iletmeyin. Şirket yeni teklif hazırlamaz.',
          'İşveren teklifi kabul ederse bu adıma dönün.',
        ]),
        son('bitir', 'red', 'İşveren teklifi reddetti', 'Teklif kapandı', [
          'Ret nedenini müşteri kaydına yazın.',
        ]),
      ],
    },
    {
      id: 'sozlesme',
      ad: 'Sözleşmeyi ve veri metinlerini tamamlayın',
      sorumlu: 'Yetkili imza sahibi ve finans ekibi',
      yap: [
        'Finans ekibi paketi, çalışan sayısını ve fiyatı sözleşmeye yazar.',
        'Yetkili imza sahibi sözleşmeyi şirket adına imzalar.',
        'Siz şirketin kişisel veri metinlerini sözleşmeyle işverene verin.',
        'İşveren ödemeyi yalnız şirket hesabına yapar.',
      ],
      soru: 'Sözleşme ve ödeme ne durumda?',
      ek: 'anlasma',
      secenekler: [
        devam('odendi', 'Sözleşme imzalı, işveren ödemeyi yaptı', 'devir'),
        son('bekle', 'odeme-bekliyor', 'Sözleşme imzalı, ödeme gelmedi', 'Ödeme bekleniyor', [
          'Durumu finans ekibine bildirin.',
          'Hatırlatmayı kimin yapacağını finans ekibi belirler.',
          'Ödeme gelince bu adıma dönün.',
        ]),
        son('bekle', 'imza-yok', 'İmza yetkilisi belli değil', 'İmza yetkilisi bekleniyor', [
          'Satış yöneticisi imza yetkilisini yazılı belirler.',
          'İmza yetkilisi belli olunca bu adıma dönün.',
        ]),
      ],
    },
    {
      id: 'devir',
      ad: 'Kuruluma ve desteğe devredin',
      sorumlu: 'Siz ve kurulum ekibi',
      yap: [
        'Paketi, çalışan sayısını ve iletişim kişisini yazılı iletin.',
        'Çalışan verisinin aktarımını kurulum ekibine bırakın.',
        'Desteği şirketin destek uzmanı verir.',
      ],
      soru: 'Kurulum ekibi devri aldı mı?',
      ek: 'plan',
      secenekler: [
        devam('kabul', 'Kurulum ekibi devri kabul etti', 'prim'),
        son('bekle', 'aktarim-usulu', 'Veri aktarım yöntemi yazılı değil', 'Aktarım yöntemini bekleyin', [
          'Kişisel veri sorumlusu ve kurulum ekibi yöntemi yazar.',
          'Yöntem yazılmadan çalışan verisi istemeyin.',
          'Yöntem yazılınca bu adıma dönün.',
        ]),
        son('bekle', 'kapasite', 'Kurulum ekibi şimdi yeni işveren alamıyor', 'Kurulum takvimi bekleniyor', [
          'Satış yöneticisine kapasite sorununu bildirin.',
          'Takvim belli olmadan kurulum tarihi vermeyin.',
          'Takvim belli olunca bu adıma dönün.',
        ]),
      ],
    },
    {
      id: 'prim',
      ad: 'Prim sonucunu kontrol edin',
      sorumlu: 'Finans ekibi',
      yap: [
        `Bu örnekte kota ${tl(k.kota)} olur. Kota, prim eşiğidir.`,
        primKurali,
        odemeKurali,
      ],
      dikkat: ornek,
      soru: 'Bu satışın prim durumu nedir?',
      ek: 'kazanc',
      secenekler: [
        son('tamamla', 'asti', 'İade süresi geçti, bu ay kota aşıldı', 'Prim listesine geçer', [
          'Finans ekibi dönem sonunda prim listesini hazırlar.',
          'Kesin tutarı yazılı prim eki belirler.',
          'Liste hatalıysa satış kaydıyla yazılı itiraz edin.',
        ]),
        son('tamamla', 'asmadi', 'Bu ay kota aşılmadı', 'Satış geçerli, prim oluşmayabilir', [
          'Satış kaydınız geçerli kalır.',
          'Bu rehber maaşta kesinti öngörmez.',
          'Yöneticinizle iş yükünü birlikte inceleyin.',
        ]),
        son('bekle', 'iade', 'İade süresi henüz geçmedi', 'İade süresi bekleniyor', [
          'Finans ekibi iade süresini izler.',
          'İade süresi bitince bu adıma dönün.',
        ]),
        son('bekle', 'sayi-farki', 'Kurulumda çalışan sayısı farklı çıktı', 'Bedel ve prim incelemesi bekleniyor', [
          'Finans ekibi bedeli ve primi yeniden inceler.',
          'İnceleme sonucu yazılınca bu adıma dönün.',
        ]),
      ],
    },
  ];

  return {
    baslik: 'Kadrolu satış uzmanının ana programı',
    ozet: 'İşverene teşvik ve bordro işini gösterirsiniz. Prim, kotayı aşan satıştan doğar.',
    hedef: 'İşveren kuruluma devredilsin ve prim durumu netleşsin.',
    ilk: 'gorev',
    adimlar,
  };
};
