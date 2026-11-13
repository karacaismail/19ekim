import type { AkisAdimi, AkisOlustur, AkisSecenegi } from '../types';
import { kadrolu, yillikFiyat, type Ayar } from '../../satisOrtakligi';
import { kosulSonucu, seciliKosul } from '../../kosullar';

const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
/** Tutar ile birim arasında bölünmez boşluk bulunur. */
const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n))} TL`;
const avro = (n: number) => `${sayi(n)} €`;
const yuzde = (n: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n * 100)}`;

/** iStoc fiyatı avroyla belirlenir. TL karşılığı örnek kura bağlıdır. */
const yillikPaket = (a: Ayar) =>
  `Yıllık paket ${sayi(a.istocYilAy)} aylık bedeldir: ${avro(a.istocAyEur * a.istocYilAy)}. Bu örnekte kur ${sayi(a.kur)} TL olduğu için ${tl(yillikFiyat(a))} eder.`;

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const son = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

type Program = 'ana' | 'saha' | 'lider';

/** Ana programın başlangıç ve ödeme kuralı. Satış ortaklığı hesabındaki iStoc kadrolu kurallarıyla aynıdır. */
const BASLANGIC = 'İlk iki ay kota yoktur. Bu sürede işi öğrenirsiniz.';
const ODEME = 'Şirket primi müşteri ödeyince ve iade süresi geçince öder.';

function primBilgisi(a: Ayar, p: Program) {
  if (p === 'ana') {
    const k = kadrolu(a);
    const kural = a.model === 'oran'
      ? `Kotayı aşan satış tutarının ${yuzde(a.kadroluPrim.istoc)} kadarı prim olur.`
      : `Kotayı dolduran satıştan sonraki her satış için ${tl(a.sabit)} prim olur.`;
    return {
      kota: `Bu örnekte kota ${tl(k.kota)} olur. Kota, prim almak için aşmanız gereken satış tutarıdır.`,
      kural,
      ornek: a.kadroluSatis >= k.kotaIcinSatis && k.prim > 0
        ? `Bu örnekte ${sayi(a.kadroluSatis)} satışla prim ${tl(k.prim)} olur.`
        : `Bu örnekteki ${sayi(a.kadroluSatis)} satış kotayı aşmaz. Satış işiniz yine aynı sürer.`,
    };
  }
  const s = kosulSonucu(a, 'kadrolu')!;
  const v = s.veri as Record<string, number>;
  return {
    kota: `Bu örnekte kota ${tl(v.kota)} olur. Kota ${sayi(v.kotayaGerekenSatis)} satışla dolar.`,
    kural: p === 'lider'
      ? `Kendi satışlarınızın primi saha kuralıyla hesaplanır. Ekibin her satışından size ${tl(a.liderPay)} pay düşer.`
      : `Kota dolduktan sonra her satıştan ${tl(a.sahaPrim)} prim alırsınız.`,
    ornek: v.prim > 0 || v.ekipPayi > 0
      ? `Bu örnekte priminiz ${tl(v.prim)} olur.${p === 'lider' ? ` Ekip payınız ${tl(v.ekipPayi)} olur.` : ''}`
      : 'Bu örnekteki satışlar kotayı doldurmaz. Satış işiniz yine aynı sürer.',
  };
}

export const akisOlustur: AkisOlustur = (a) => {
  const p = seciliKosul(a, 'kadrolu').id as Program;
  const prim = primBilgisi(a, p);
  const saha = p !== 'ana';
  const programAdi = p === 'ana' ? 'ana program' : p === 'saha' ? 'saha personeli seçeneği' : 'ekip lideri seçeneği';

  const gorev: AkisAdimi = {
    id: 'gorev',
    ad: 'Görevinizi ve prim ekinizi alın',
    sorumlu: 'İnsan kaynakları sorumlusu',
    yap: [
      'İnsan kaynakları sorumlusu yazılı görev tanımınızı size verir.', 'Prim eki, iş sözleşmenize eklenen prim belgesidir. Primin nasıl hesaplanacağını ve ne zaman ödeneceğini yazar.',
      `İnsan kaynakları sorumlusu prim ekine “${programAdi}” adını yazar.`,
      'Siz maaşın net mi brüt mü olduğunu sorun.',
    ],
    dikkat: p === 'ana' ? BASLANGIC : 'Şirket bu seçenek için başlangıç dönemi kuralını henüz yazmadı.',
    soru: 'Görev tanımınız ve prim ekiniz hazır mı?',
    ek: 'anlasma',
    secenekler: [
      devam('hazir', 'Görev tanımı ve prim eki elimde', p === 'lider' ? 'ekip' : saha ? 'bolge' : 'kayit'),
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
  };

  const ekip: AkisAdimi = {
    id: 'ekip',
    ad: 'Ekip listenizi alın',
    sorumlu: 'Satış yöneticisi',
    yap: [
      'Satış yöneticisi ekibinizdeki saha çalışanlarını yazılı listeye alır.',
      'Satış yöneticisi görev değişikliğinin tarihini listeye yazar.',
      'Siz ekip satışını kendi satışınızdan ayrı kaydedin.',
    ],
    soru: 'Ekibiniz yazılı olarak belirlendi mi?',
    ek: 'sinir',
    secenekler: [
      devam('liste-var', 'Ekip listesi yazılı ve tarihli', 'bolge'),
      son('bekle', 'liste-yok', 'Ekip henüz belirlenmedi', 'Ekip listesi bekleniyor', [
        'Satış yöneticisi ekibi ve başlangıç tarihini yazar.',
        'Liste gelene kadar ekip payı hesaplamayın.',
        'Kendi satışlarınıza devam edebilirsiniz. Liste gelince bu adıma dönün.',
      ]),
    ],
  };

  const bolge: AkisAdimi = {
    id: 'bolge',
    ad: 'Saha ziyaretini planlayın',
    sorumlu: 'Siz ve satış yöneticisi',
    yap: [
      'Satış yöneticisi ziyaret bölgenizi size yazılı verir.',
      'Siz satıcıyı firma adı ve adresiyle kayıtta arayın.',
      'Satıcının ileti almayı kabul edip etmediğini kontrol edin.',
    ],
    soru: 'Kayıt aramasında ne buldunuz?',
    ek: 'kitle',
    secenekler: [
      devam('bos', 'Satıcı kayıtlı değil, görüşmeyi kabul etti', 'ihtiyac'),
      son('bekle', 'kayitli', 'Satıcı başka çalışana veya ortağa kayıtlı', 'Kayıt kararı bekleniyor', [
        'Satış yöneticisi kayıt tarihlerine bakarak karar verir.',
        'Karar yazılana kadar teklif göndermeyin.',
      ]),
      son('bitir', 'ret', 'Satıcı iletişim istemiyor', 'Görüşme kapandı', [
        'Satıcının tercihini müşteri kaydına yazın.',
        'Bu satıcıya pazarlama mesajı göndermeyin.',
      ]),
    ],
  };

  const kayit: AkisAdimi = {
    ...bolge,
    id: 'kayit',
    ad: 'Satıcı kaydını kontrol edin',
    sorumlu: 'Siz',
    yap: [
      'Satıcıyı müşteri takip sisteminde arayın.',
      'Satıcının ileti almayı kabul edip etmediğini kontrol edin.',
    ],
  };

  const ihtiyac: AkisAdimi = {
    id: 'ihtiyac',
    ad: 'Satıcının ihtiyacını öğrenin',
    sorumlu: 'Siz',
    yap: [
      'Satıcıya alıcılarla nasıl çalıştığını sorun.',
      'Ürün listesini kimin hazırladığını öğrenin.',
      'Görüşme sonucunu müşteri kaydına yazın.',
    ],
    soru: 'Satıcının durumu nedir?',
    secenekler: [
      devam('uygun', 'Düzenli ürün listesi var, karar vereni tanıdım', 'gosterim'),
      son('bekle', 'liste-sahibi-yok', 'Ürün listesini güncelleyecek kişi yok', 'Satıcının sorumlu belirlemesi bekleniyor', [
        'Satıcı ürün listesinden sorumlu kişiyi belirler.',
        'Sorumlu belli olunca görüşmeyi yeniden planlayın.',
      ]),
      son('bitir', 'ilgisiz', 'Satıcı ilgilenmiyor', 'Görüşme kapandı', [
        'Ret nedenini müşteri kaydına yazın.',
      ]),
    ],
  };

  const gosterim: AkisAdimi = {
    id: 'gosterim',
    ad: 'Satıcının ürünleriyle gösterim yapın',
    sorumlu: 'Siz',
    yap: [
      'Satıcının bir ürün grubunu örnek alın.',
      'Üründe olmayan özelliği göstermeyin.',
      'Alıcı veya sipariş sözü vermeyin.',
    ],
    soru: 'Gösterimden sonra satıcı ne dedi?',
    ek: 'sinir',
    secenekler: [
      devam('teklif-istedi', 'Satıcı teklif istedi', 'teklif'),
      son('bitir', 'garanti', 'Satıcı sipariş garantisi istiyor', 'Garanti veremezsiniz', [
        'Garanti veremeyeceğinizi açıkça söyleyin.',
        'Satıcı garanti olmadan devam etmezse görüşmeyi bitirin.',
      ]),
      son('bekle', 'dusunecek', 'Satıcı daha sonra düşünecek', 'Satıcının kararı bekleniyor', [
        'Satıcıyla yeni görüşme tarihi belirleyin.',
        'Görüşme gününde bu adıma dönün.',
      ]),
    ],
  };

  const teklif: AkisAdimi = {
    id: 'teklif',
    ad: 'Katalog kapsamıyla teklif hazırlayın',
    sorumlu: 'Siz ve satış yöneticisi',
    yap: [
      `Teklifi fiyat tablosundaki fiyatla hazırlayın. ${yillikPaket(a)}`,
      'Katalogdaki ürün gruplarını teklife yazın.',
      'Teklifteki TL tutarı için kuru finans ekibinden öğrenin.',
    ],
    dikkat: `Fiyat avroyla belirlenir. Aylık bedel ${avro(a.istocAyEur)} olur. Fiyat herkes için aynıdır ve kimse değiştiremez.`,
    soru: 'Teklifin durumu nedir?',
    ek: 'kazanc',
    secenekler: [
      devam('kabul', 'Satıcı onaylı teklifi kabul etti', 'sozlesme'),
      son('bekle', 'indirim', 'Satıcı indirim istiyor', 'Fiyat herkes için aynı', [
        'Satıcıya fiyatın herkes için aynı olduğunu söyleyin.',
        'İndirim yoktur ve fiyat pazarlıkla değişmez.',
        'Talebi kimseye iletmeyin. Yeni teklif hazırlamayın.',
        'Satıcı tablodaki fiyatı kabul ederse bu adıma dönün.',
      ]),
      son('bitir', 'red', 'Satıcı teklifi reddetti', 'Teklif kapandı', [
        'Ret nedenini müşteri kaydına yazın.',
      ]),
    ],
  };

  const sozlesme: AkisAdimi = {
    id: 'sozlesme',
    ad: 'Sözleşmeyi ve ödemeyi izleyin',
    sorumlu: 'Siz ve finans ekibi',
    yap: [
      'Kapsamı ve fiyat tablosundaki fiyatı sözleşmeye ekleyin.',
      'Şirketin imza yetkilisi sözleşmeyi imzalar. Satıcı ödemeyi yalnız şirket hesabına yapar.',
      'İmzalı sözleşmeyi müşteri kaydına ekleyin.',
    ],
    soru: 'Sözleşme ve ödeme ne durumda?',
    ek: 'anlasma',
    secenekler: [
      devam('odendi', 'Sözleşme imzalı, satıcı ödemeyi yaptı', 'devir'),
      son('bekle', 'odeme-bekliyor', 'Sözleşme imzalı, ödeme gelmedi', 'Ödeme bekleniyor', [
        'Siz durumu finans ekibine bildirin.',
        'Finans ekibi satıcıya kimin hatırlatma yapacağını belirler.',
        'Ödeme gelince bu adıma dönün.',
      ]),
      son('bekle', 'imza-yok', 'İmza yetkilisi belli değil', 'İmza yetkilisi bekleniyor', [
        'Satış yöneticisi imza yetkilisini yazılı belirler.',
        'Yetkili belli olunca bu adıma dönün.',
      ]),
    ],
  };

  const devir: AkisAdimi = {
    id: 'devir',
    ad: 'Katalog kurulumuna devredin',
    sorumlu: 'Siz ve kurulum ekibi',
    yap: [
      'Siz ürün gruplarını ve iletişim kişisini kurulum ekibine yazılı iletin.',
      'Kurulum ekibi ürün bilgisini kimin gireceğini sizinle netleştirir.',
      'Siz ürün görsellerinin sahibini satıcıya sorun.',
    ],
    soru: 'Kurulum ekibi devri aldı mı?',
    ek: 'plan',
    secenekler: [
      devam('kabul', 'Kurulum ekibi devri kabul etti', p === 'lider' ? 'ekip-satis' : 'prim'),
      son('bekle', 'kapasite', 'Kurulum ekibi şimdi yeni katalog alamıyor', 'Kurulum takvimi bekleniyor', [
        'Satış yöneticisine kapasite sorununu bildirin.',
        'Takvim belli olmadan kurulum tarihi vermeyin.',
        'Takvim gelince bu adıma dönün.',
      ]),
    ],
  };

  const ekipSatis: AkisAdimi = {
    id: 'ekip-satis',
    ad: 'Ekip satışlarını ayırın',
    sorumlu: 'Finans ekibi',
    yap: [
      'Finans ekibi ekip satışlarını sizin satışlarınızdan ayrı listeler.',
      'Finans ekibi aynı satışın iki listede olmadığını kontrol eder.',
      'Siz iki listeyi kendi kaydınızla karşılaştırın.',
    ],
    soru: 'Ekip ve kendi satış listeniz ne durumda?',
    secenekler: [
      devam('ayri', 'Ekip ve kendi satışlarım ayrı', 'prim'),
      son('bekle', 'cakisma', 'Bir satış iki listede görünüyor', 'Satış kaydı düzeltmesi bekleniyor', [
        'Satış yöneticisi satışın kime yazılacağına karar verir.',
        'Karar yazılınca bu adıma dönün.',
      ]),
    ],
  };

  const primAdim: AkisAdimi = {
    id: 'prim',
    ad: 'Prim sonucunu kontrol edin',
    sorumlu: 'Finans ekibi',
    yap: [prim.kota, prim.kural, ODEME],
    dikkat: prim.ornek,
    soru: 'Bu satışın prim durumu nedir?',
    ek: 'kazanc',
    secenekler: [
      son('tamamla', 'asti', 'İade süresi geçti, bu ay kota aşıldı', 'Satış prim listesine geçer', [
        'Finans ekibi dönem sonunda prim listesini hazırlar.',
        'Kesin tutarı yazılı prim eki belirler.',
        'Liste hatalıysa siz satış kaydıyla yazılı itiraz edin.',
      ]),
      son('tamamla', 'asmadi', 'Bu ay kota aşılmadı', 'Satış geçerli, prim oluşmayabilir', [
        'Satış kaydınız geçerli kalır.',
        'Bu rehber maaşta kesinti öngörmez.',
        'Yöneticinizle iş yükünü birlikte inceleyin.',
      ]),
      son('bekle', 'iade', 'İade süresi henüz geçmedi', 'İade süresi bekleniyor', [
        'Finans ekibi iade süresini izler.',
        'Süre bitince bu adıma dönün.',
      ]),
      son('bekle', 'baslangic', p === 'ana' ? 'Kotasız başlangıç dönemindeyim' : 'İşe yeni başladım, başlangıç kuralı yazılmadı', 'Başlangıç dönemi prim kuralı bekleniyor', [
        'Şirket bu dönemin prim kuralını henüz yazmadı.',
        'İnsan kaynakları ve finans ekibi kuralı yazar.',
        'Kural gelince bu adıma dönün.',
      ]),
    ],
  };

  const adimlar = p === 'ana'
    ? [gorev, kayit, ihtiyac, gosterim, teklif, sozlesme, devir, primAdim]
    : p === 'saha'
      ? [gorev, bolge, ihtiyac, gosterim, teklif, sozlesme, devir, primAdim]
      : [gorev, ekip, bolge, ihtiyac, gosterim, teklif, sozlesme, devir, ekipSatis, primAdim];

  return {
    baslik: p === 'ana' ? 'Kadrolu satış uzmanının ana programı' : p === 'saha' ? 'Kadrolu satış uzmanı olarak saha personeli' : 'Kadrolu satış uzmanı olarak ekip lideri',
    ozet: p === 'lider'
      ? 'Ekibinizi yönetirsiniz. Kendi satışınızı ve ekip satışını ayrı izlersiniz.'
      : saha
        ? 'Bölgenizdeki satıcıları ziyaret edersiniz. Kota dolduktan sonra her satış prim getirir.'
        : 'Satıcıya iStoc kataloğunu satarsınız. Kotayı aşan satış prim getirir.',
    hedef: 'Satıcının kataloğu kuruluma devredilsin ve prim durumu netleşsin.',
    ilk: 'gorev',
    adimlar,
  };
};
