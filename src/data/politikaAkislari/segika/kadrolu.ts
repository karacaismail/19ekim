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
    : `Kotayı dolduran satıştan sonraki her satış için ${tl(a.sabit)} prim hesaplanır.`;
  const ornek = k.prim > 0
    ? `Örnek ayarda ${sayi(a.kadroluSatis)} satışla prim ${tl(k.prim)} olur.`
    : `Örnek ayardaki ${sayi(a.kadroluSatis)} satış kotayı aşmaz. Kota için ${sayi(k.kotaIcinSatis)} satış gerekir. Satış işi yine aynı sürer.`;

  const adimlar: AkisAdimi[] = [
    {
      id: 'gorev',
      ad: 'Görevinizi ve prim ekinizi alın',
      sorumlu: 'İnsan kaynakları sorumlusu',
      yap: [
        'Yazılı görev tanımınızı alın.',
        'Prim ekinde başlangıç dönemi kuralını okuyun.',
        'Maaşın net mi brüt mü olduğunu sorun.',
      ],
      dikkat: 'Kaynak bu rol için kotasız başlangıç dönemi tanımlamaz. Böyle bir dönem varsaymayın.',
      soru: 'Görev tanımınız ve prim ekiniz hazır mı?',
      ek: 'anlasma',
      secenekler: [
        devam('hazir', 'Görev tanımı ve prim eki elimde', 'kayit'),
        son('bekle', 'ek-yok', 'Görev tanımı var, prim eki yok', 'Prim eki bekleniyor', [
          'İnsan kaynakları ve finans ekibi prim ekini yazsın.',
          'Ek gelene kadar kendinize prim hesabı yapmayın.',
          'Ek gelince bu adıma dönün.',
        ]),
        son('bekle', 'sozlesme-yok', 'Henüz iş sözleşmem yok', 'İş sözleşmesi bekleniyor', [
          'İnsan kaynakları iş sözleşmesini hazırlasın.',
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
        'Mali müşavir veya danışman kaydı olabilir.',
        'Kişinin iletişim tercihini kontrol edin.',
      ],
      soru: 'Kayıt aramasında ne buldunuz?',
      ek: 'kitle',
      secenekler: [
        devam('bos', 'İşveren kayıtlı değil, görüşmeyi kabul etti', 'ihtiyac'),
        son('bekle', 'kayitli', 'İşveren başka çalışana, mali müşavire veya danışmana kayıtlı', 'Kayıt kararı bekleniyor', [
          'Satış yöneticisi kayıt tarihlerine bakarak karar versin.',
          'Karar yazılana kadar teklif göndermeyin.',
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
        'Teşvik tutarı veya sonucu sözü vermeyin.',
      ],
      soru: 'Gösterimden sonra işveren ne dedi?',
      ek: 'sinir',
      secenekler: [
        devam('teklif-istedi', 'İşveren teklif istedi', 'teklif'),
        son('bitir', 'tesvik-tutari', 'İşveren kesin teşvik tutarı istiyor', 'Tutar sözü verilemez', [
          'Tutar sözü veremeyeceğinizi açıkça söyleyin.',
          'İşveren tutarsız devam etmezse görüşmeyi kapatın.',
        ]),
        son('bekle', 'gercek-dosya', 'İşveren gerçek çalışan dosyası gönderdi', 'Kişisel veri kararı bekleniyor', [
          'Dosyayı açmayın ve saklamayın.',
          'Satış yöneticisi kişisel veri sorumlusuyla sonraki işlemi belirlesin.',
          'Karar gelince bu adıma dönün.',
        ]),
      ],
    },
    {
      id: 'teklif',
      ad: 'Paket ve çalışan sayısıyla teklif hazırlayın',
      sorumlu: 'Siz ve satış yöneticisi',
      yap: [
        `Örnek hesap ${sayi(a.calisan)} çalışan için ${PAKET[a.segikaPaket]} kullanır.`,
        `Bu örneğin yıllık paket bedeli ${tl(yillikFiyat(a))} tutarındadır.`,
        'Çalışan sayısını teklife yazın.',
      ],
      dikkat: `Fiyat ${sayi(a.blok)} çalışanlık bloklarla hesaplanır. Örnekte ${sayi(fiyat.kisi)} kişilik blok kullanılır. Sayı aynı blokta kalırsa fiyat değişmeyebilir.`,
      soru: 'Teklifin durumu nedir?',
      ek: 'kazanc',
      secenekler: [
        devam('kabul', 'İşveren onaylı teklifi kabul etti', 'sozlesme'),
        son('bekle', 'sayi-degisti', 'Çalışan sayısı teklif sonrası değişti', 'Yeni hesap bekleniyor', [
          'Yeni sayıyı finans ekibine bildirin.',
          'Fiyat değişirse satış yöneticisi yeni teklifi onaylasın.',
          'Onaylı teklif gelince bu adıma dönün.',
        ]),
        son('bekle', 'indirim', 'İşveren onaysız indirim istiyor', 'İndirim kararı bekleniyor', [
          'Talebi satış yöneticisine yazılı iletin.',
          'Onay gelmezse liste fiyatı geçerli kalır.',
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
        'Paketi, çalışan sayısını ve fiyatı sözleşmeye ekleyin.',
        'Şirketin kişisel veri metinlerini sözleşmeyle verin.',
        'Ödeme yalnız şirket hesabına yapılır.',
      ],
      soru: 'Sözleşme ve ödeme ne durumda?',
      ek: 'anlasma',
      secenekler: [
        devam('odendi', 'Sözleşme imzalı, işveren ödemeyi yaptı', 'devir'),
        son('bekle', 'odeme-bekliyor', 'Sözleşme imzalı, ödeme gelmedi', 'Ödeme bekleniyor', [
          'Finans ekibine bildirin.',
          'Hatırlatmayı kimin yapacağını finans ekibi belirlesin.',
          'Ödeme gelince bu adıma dönün.',
        ]),
        son('bekle', 'imza-yok', 'İmza yetkilisi belli değil', 'İmza yetkilisi bekleniyor', [
          'Satış yöneticisi imza yetkilisini yazılı belirlesin.',
          'Yetkili belli olunca bu adıma dönün.',
        ]),
      ],
    },
    {
      id: 'devir',
      ad: 'Kuruluma ve desteğe devredin',
      sorumlu: 'Kurulum ekibi',
      yap: [
        'Paketi, çalışan sayısını ve iletişim kişisini yazılı iletin.',
        'Çalışan verisinin aktarımını kurulum ekibine bırakın.',
        'Desteği şirketin destek uzmanı verir.',
      ],
      soru: 'Kurulum ekibi devri aldı mı?',
      ek: 'plan',
      secenekler: [
        devam('kabul', 'Kurulum ekibi devri kabul etti', 'prim'),
        son('bekle', 'aktarim-usulu', 'Veri aktarım usulü yazılı değil', 'Aktarım usulü bekleniyor', [
          'Kişisel veri sorumlusu ve kurulum ekibi usulü yazsın.',
          'Usul yazılmadan çalışan verisi istemeyin.',
          'Usul gelince bu adıma dönün.',
        ]),
        son('bekle', 'kapasite', 'Kurulum ekibi şimdi yeni işveren alamıyor', 'Kurulum takvimi bekleniyor', [
          'Satış yöneticisine kapasite sorununu bildirin.',
          'Takvim belli olmadan kurulum tarihi vermeyin.',
        ]),
      ],
    },
    {
      id: 'prim',
      ad: 'Prim sonucunu kontrol edin',
      sorumlu: 'Finans ekibi',
      yap: [
        `Örnek kota ${tl(k.kota)} tutarındadır. Kota, prim eşiğidir.`,
        primKurali,
        odemeKurali,
      ],
      dikkat: ornek,
      soru: 'Bu satışın prim durumu nedir?',
      ek: 'kazanc',
      secenekler: [
        son('tamamla', 'asti', 'İade süresi geçti, bu ay kota aşıldı', 'Prim dökümüne geçer', [
          'Finans ekibi dönem sonunda prim dökümünü hazırlar.',
          'Kesin tutarı yazılı prim eki belirler.',
          'Döküm hatalıysa satış kaydıyla yazılı itiraz edin.',
        ]),
        son('tamamla', 'asmadi', 'Bu ay kota aşılmadı', 'Satış geçerli, prim oluşmayabilir', [
          'Satış kaydınız geçerli kalır.',
          'Bu rehber maaşta kesinti öngörmez.',
          'Yöneticinizle iş yükünü birlikte inceleyin.',
        ]),
        son('bekle', 'iade', 'İade süresi henüz geçmedi', 'İade süresi bekleniyor', [
          'Finans ekibi iade süresini izlesin.',
          'Süre bitince bu adıma dönün.',
        ]),
        son('bekle', 'sayi-farki', 'Kurulumda çalışan sayısı farklı çıktı', 'Bedel ve prim incelemesi bekleniyor', [
          'Finans ekibi bedeli prim ekine göre yeniden incelesin.',
          'İnceleme sonucu yazılınca bu adıma dönün.',
        ]),
      ],
    },
  ];

  return {
    baslik: 'Kadrolu satış uzmanı: ana program',
    ozet: 'İşverene teşvik ve bordro işini gösterirsiniz. Prim, kotayı aşan satıştan doğar.',
    hedef: 'İşveren kuruluma devredilsin ve prim durumu netleşsin.',
    ilk: 'gorev',
    adimlar,
  };
};
