import { belgeAdimlariniCikar } from '../motor';
import type { AkisAdimi, AkisOlustur, AkisSecenegi } from '../types';
import { kadrolu, rolMetinleri, segikaAylik, yillikFiyat, type SegikaPaket } from '../../satisOrtakligi';
import { pct, sayiBicimi, tl } from '../../../lib/format';

const yuzde = pct;
const sayi = sayiBicimi(1);

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const son = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

/** Paket adları kısaltmasız, yalın biçimde yazılır. */
const PAKET: Record<SegikaPaket, string> = {
  ikisi: 'teşvik ve otomasyon paketi',
  tesvik: 'sigorta teşviki paketi',
  otomasyon: 'sigorta otomasyonu paketi',
};

const akisOlusturTam: AkisOlustur = (a) => {
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
      terimler: ['Görev tanımı, işte yapacağınız işleri yazan belgedir.'],
      yap: [
        'İnsan kaynakları size yazılı görev tanımı verir.', 'Prim eki, iş sözleşmenize eklenen prim belgesidir. Primin nasıl hesaplanacağını ve ne zaman ödeneceğini yazar.',
        'Prim ekindeki başlangıç dönemi kuralını okuyun.',
        'Maaşın net mi brüt mü olduğunu sorun.',
      ],
      dikkat: 'Şirket bu rol için kotasız başlangıç dönemi belirlemedi. Böyle bir dönem varsaymayın.',
      soru: 'Görev tanımı ve prim eki size verildi mi?',
      ek: 'anlasma',
      secenekler: [
        devam('hazir', 'Görev tanımını ve prim ekini aldım', 'kayit'),
        son('bekle', 'ek-yok', 'Görev tanımını aldım ama prim ekini almadım', 'Prim eki bekleniyor', [
          'İnsan kaynakları ve finans ekibi prim ekini yazar.',
          'Ek gelene kadar kendinize prim hesabı yapmayın.',
          'Prim eki gelince bu adıma dönün.',
        ]),
        son('bekle', 'sozlesme-yok', 'Bana henüz iş sözleşmesi verilmedi', 'İş sözleşmesi bekleniyor', [
          'İnsan kaynakları iş sözleşmesini hazırlar.',
          'Sözleşme imzalanınca bu adıma dönün.',
        ]),
      ],
    },
    {
      id: 'kayit',
      ad: 'İşveren kaydını kontrol edin',
      sorumlu: 'Siz',
      terimler: ['İşveren, programı satın alabilecek firmadır.', 'Mali müşavir, firmanın muhasebe işlerini yapan kişidir.'],
      yap: [
        'İşvereni müşteri takip sisteminde arayın.',
        'İşverenin mali müşaviri kaydı önceden açmış olabilir.',
        'Kişinin iletişim tercihini kontrol edin.',
      ],
      soru: 'Kayıtta ne gördünüz?',
      ek: 'kitle',
      secenekler: [
        devam('bos', 'İşveren kayıtta yok ve görüşmeye evet dedi', 'ihtiyac'),
        son('bekle', 'kayitli', 'Kayıtta işverende başka çalışanın, mali müşavirin veya danışmanın adı var', 'Kayıt kararını bekleyin', [
          'Satış yöneticisi kayıt tarihlerine bakıp karar verir.',
          'Karar yazılana kadar teklif göndermeyin.',
          'Karar gelince bu adıma dönün.',
        ]),
        son('bitir', 'ret', 'Kişi bizden ileti almak istemiyor', 'Görüşme kapandı', [
          'Tercihini müşteri kaydına yazın.',
          'Bu kişiye pazarlama iletisi göndermeyin.',
        ]),
      ],
    },
    {
      id: 'ihtiyac',
      ad: 'Teşvik ve bordro sürecini öğrenin',
      sorumlu: 'Siz',
      terimler: ['Teşvik, devletin işverene verdiği destektir.', 'Bordro, çalışanların maaş listesidir.', 'Mali müşavir, firmanın muhasebe işlerini yapan kişidir.'],
      yap: [
        'Teşvik kontrolünü kimin yaptığını sorun.',
        'Bordroyu kimin hazırladığını öğrenin.',
        'Yaklaşık çalışan sayısını sorun.',
      ],
      soru: 'İşverenle konuşunca ne öğrendiniz?',
      secenekler: [
        devam('uygun', 'İşveren teşvik veya bordro sorununu anlattı, karar verenle tanıştım', 'gosterim'),
        son('bekle', 'musavir', 'İşveren kararı mali müşavirinin verdiğini söyledi', 'Mali müşavirle görüşme bekleniyor', [
          'İşverene mali müşavirini görüşmeye çağırmasını önerin.',
          'Ortak görüşme tarihi belli olunca bu adıma dönün.',
        ]),
        son('bitir', 'ilgisiz', 'İşveren ilgilenmediğini söyledi', 'Görüşme kapandı', [
          'Ret nedenini müşteri kaydına yazın.',
        ]),
      ],
    },
    {
      id: 'gosterim',
      ad: 'Gerçek kişi bilgisi olmayan örnekle gösterim yapın',
      sorumlu: 'Siz',
      terimler: ['Teşvik, devletin işverene verdiği destektir.'],
      yap: [
        'Yalnız gerçek kişi bilgisi olmayan örnek veri kullanın.',
        'Gerçek çalışan dosyası istemeyin.',
        'Teşvik tutarı veya sonuç sözü vermeyin.',
      ],
      soru: 'Örneği gösterdikten sonra işveren ne dedi?',
      ek: 'sinir',
      secenekler: [
        devam('teklif-istedi', 'İşveren fiyat teklifi istedi', 'teklif'),
        son('bitir', 'tesvik-tutari', 'İşveren kesin teşvik tutarı söylememi istedi', 'Tutar sözü veremezsiniz', [
          'Tutar sözü veremeyeceğinizi açıkça söyleyin.',
          'İşveren tutar olmadan devam etmezse görüşmeyi bitirin.',
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
      terimler: ['Teklif, işverene yazılı verilen fiyat belgesidir.'],
      yap: [
        `Bu örnekte işverenin ${sayi(a.calisan)} çalışanı vardır. Örnek ${PAKET[a.segikaPaket]} için hesaplanır.`,
        `Bu örnekte yıllık paket ${tl(yillikFiyat(a))} eder.`,
        'Teklife paketi ve çalışan sayısını yazın.',
        'Fiyat tablodaki fiyattır. İndirim yoktur.',
      ],
      dikkat: `Şirket fiyatı, çalışan sayısını ${sayi(a.blok)} kişilik gruplara yukarı yuvarlayarak hesaplar. Bu örnek ${sayi(fiyat.kisi)} çalışana göredir. Sayı aynı grupta kalırsa fiyat değişmez.`,
      soru: 'Tekliften sonra ne oldu?',
      ek: 'kazanc',
      secenekler: [
        devam('kabul', 'İşveren onaylı teklife evet dedi', 'sozlesme'),
        son('bekle', 'sayi-degisti', 'Tekliften sonra çalışan sayısı değişti', 'Güncel teklifi bekleyin', [
          'Yeni sayıyı finans ekibine bildirin.',
          'Fiyat değişirse satış yöneticisi teklifi tablo fiyatıyla günceller.',
          'Güncel teklif gelince bu adıma dönün.',
        ]),
        son('bekle', 'indirim', 'İşveren indirim istedi', 'İşverenin kararını bekleyin', [
          'Fiyatın herkes için aynı olduğunu söyleyin.',
          'Talebi kimseye iletmeyin. Şirket yeni teklif hazırlamaz.',
          'İşveren teklifi kabul ederse bu adıma dönün.',
        ]),
        son('bitir', 'red', 'İşveren teklife hayır dedi', 'Teklif kapandı', [
          'Ret nedenini müşteri kaydına yazın.',
        ]),
      ],
    },
    {
      id: 'sozlesme',
      ad: 'Sözleşmeyi ve veri metinlerini tamamlayın',
      sorumlu: 'Yetkili imza sahibi ve finans ekibi',
      terimler: ['Sözleşme, iki tarafın imzaladığı anlaşma belgesidir.'],
      yap: [
        'Finans ekibi paketi, çalışan sayısını ve fiyatı sözleşmeye yazar.',
        'Yetkili imza sahibi sözleşmeyi şirket adına imzalar.',
        'Siz şirketin kişisel veri metinlerini sözleşmeyle işverene verin.',
        'İşveren ödemeyi yalnız şirket hesabına yapar.',
      ],
      soru: 'Sözleşme imzalandı mı ve ödeme geldi mi?',
      ek: 'anlasma',
      secenekler: [
        devam('odendi', 'Sözleşme imzalandı ve işveren ödemeyi yaptı', 'devir'),
        son('bekle', 'odeme-bekliyor', 'Sözleşme imzalandı ama ödeme gelmedi', 'Ödeme bekleniyor', [
          'Durumu finans ekibine bildirin.',
          'Hatırlatmayı kimin yapacağını finans ekibi belirler.',
          'Ödeme gelince bu adıma dönün.',
        ]),
        son('bekle', 'imza-yok', 'Kimin imza atacağı belli değil', 'İmza yetkilisi bekleniyor', [
          'Satış yöneticisi imza yetkilisini yazılı belirler.',
          'İmza yetkilisi belli olunca bu adıma dönün.',
        ]),
      ],
    },
    {
      id: 'devir',
      ad: 'Kuruluma ve desteğe devredin',
      sorumlu: 'Siz ve kurulum ekibi',
      terimler: ['Devretmek, işi kurulum ekibine yazılı olarak vermektir.'],
      yap: [
        'Paketi, çalışan sayısını ve iletişim kişisini yazılı iletin.',
        'Çalışan verisinin aktarımını kurulum ekibine bırakın.',
        'Desteği şirketin destek uzmanı verir.',
      ],
      soru: 'Kurulum ekibi işi sizden aldı mı?',
      ek: 'plan',
      secenekler: [
        devam('kabul', 'Kurulum ekibi işi aldığını söyledi', 'prim'),
        son('bekle', 'aktarim-usulu', 'Çalışan bilgilerinin nasıl aktarılacağı yazılmadı', 'Aktarım yöntemini bekleyin', [
          'Kişisel veri sorumlusu ve kurulum ekibi yöntemi yazar.',
          'Yöntem yazılmadan çalışan verisi istemeyin.',
          'Yöntem yazılınca bu adıma dönün.',
        ]),
        son('bekle', 'kapasite', 'Kurulum ekibi şu an yeni işveren alamadığını söyledi', 'Kurulum takvimi bekleniyor', [
          'Satış yöneticisine kurulum ekibinin dolu olduğunu bildirin.',
          'Takvim belli olmadan kurulum tarihi vermeyin.',
          'Takvim belli olunca bu adıma dönün.',
        ]),
      ],
    },
    {
      id: 'prim',
      ad: 'Prim sonucunu kontrol edin',
      sorumlu: 'Finans ekibi',
      terimler: ['İade süresi, müşterinin satıştan vazgeçebildiği süredir.'],
      yap: [
        `Bu örnekte kota ${tl(k.kota)} olur. Kota, prim eşiğidir.`,
        primKurali,
        odemeKurali,
      ],
      dikkat: ornek,
      soru: 'Bu satışın primi ne durumda?',
      ek: 'kazanc',
      secenekler: [
        son('tamamla', 'asti', 'İade süresi bitti ve bu ay kotayı aştım', 'Prim listesine geçer', [
          'Finans ekibi dönem sonunda prim listesini hazırlar.',
          'Kesin tutarı yazılı prim eki belirler.',
          'Liste hatalıysa satış kaydıyla yazılı itiraz edin.',
        ]),
        son('tamamla', 'asmadi', 'Bu ay kotayı aşmadım', 'Satış geçerli, prim oluşmayabilir', [
          'Satış kaydınız geçerli kalır.',
          'Bu rehber maaşta kesinti öngörmez.',
          'Yöneticinizle iş yükünü birlikte inceleyin.',
        ]),
        son('bekle', 'iade', 'İade süresi daha bitmedi', 'İade süresi bekleniyor', [
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

/** Rehberde belge adımları sorulmaz (motor.ts → belgeAdimlariniCikar). */
export const akisOlustur: AkisOlustur = (a) => belgeAdimlariniCikar(akisOlusturTam(a));
