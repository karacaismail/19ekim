import { belgeAdimlariniCikar } from '../motor';
import type { AkisAdimi, AkisOlustur, AkisSecenegi } from '../types';
import { kadrolu, yillikFiyat, type Ayar } from '../../satisOrtakligi';
import { kosulSonucu, seciliKosul } from '../../kosullar';
import { num, pct, tlBitisik } from '../../../lib/format';

const sayi = num;
/** Tutar ile birim arasında bölünmez boşluk bulunur. */
const tl = tlBitisik;
const avro = (n: number) => `${sayi(n)} €`;
const yuzde = pct;

/** iStoc fiyatı avroyla belirlenir. TL karşılığı örnek kura bağlıdır. */
const yillikPaket = (a: Ayar) =>
  `Yıllık paket ${sayi(a.istocYilAy)} aylık bedeldir: ${avro(a.istocAyEur * a.istocYilAy)}. Bu örnekte kur ${sayi(a.kur)} ₺ olduğu için ${tl(yillikFiyat(a))} eder.`;

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

const akisOlusturTam: AkisOlustur = (a) => {
  const p = seciliKosul(a, 'kadrolu').id as Program;
  const prim = primBilgisi(a, p);
  const saha = p !== 'ana';
  const programAdi = p === 'ana' ? 'ana program' : p === 'saha' ? 'saha personeli seçeneği' : 'ekip lideri seçeneği';

  const gorev: AkisAdimi = {
    id: 'gorev',
    ad: 'Görevinizi ve prim ekinizi alın',
    sorumlu: 'İnsan kaynakları sorumlusu',
    yap: [
      'Görev tanımı, işte yapacağınız işleri yazan belgedir.',
      'İnsan kaynakları sorumlusu yazılı görev tanımınızı size verir.', 'Prim eki, iş sözleşmenize eklenen prim belgesidir. Primin nasıl hesaplanacağını ve ne zaman ödeneceğini yazar.',
      `İnsan kaynakları sorumlusu prim ekine “${programAdi}” adını yazar.`,
      'Siz maaşın net mi brüt mü olduğunu sorun.',
    ],
    dikkat: p === 'ana' ? BASLANGIC : 'Şirket bu seçenek için başlangıç dönemi kuralını henüz yazmadı.',
    soru: 'Görev tanımı ve prim eki size verildi mi?',
    ek: 'anlasma',
    secenekler: [
      devam('hazir', 'Görev tanımını ve prim ekini aldım', p === 'lider' ? 'ekip' : saha ? 'bolge' : 'kayit'),
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
  };

  const ekip: AkisAdimi = {
    id: 'ekip',
    ad: 'Ekip listenizi alın',
    sorumlu: 'Satış yöneticisi',
    yap: [
      'Ekip, sizin yönettiğiniz saha çalışanlarıdır.',
      'Satış yöneticisi ekibinizdeki saha çalışanlarını yazılı listeye alır.',
      'Satış yöneticisi görev değişikliğinin tarihini listeye yazar.',
      'Siz ekip satışını kendi satışınızdan ayrı kaydedin.',
    ],
    soru: 'Ekip listeniz size yazılı verildi mi?',
    ek: 'sinir',
    secenekler: [
      devam('liste-var', 'Tarihli ve yazılı ekip listesini aldım', 'bolge'),
      son('bekle', 'liste-yok', 'Ekibim henüz belli değil', 'Ekip listesi bekleniyor', [
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
      'Satıcı, iStoc kataloğunu satın alabilecek firmadır.',
      'Satış yöneticisi ziyaret bölgenizi size yazılı verir.',
      'Siz satıcıyı firma adı ve adresiyle kayıtta arayın.',
      'Satıcının ileti almayı kabul edip etmediğini kontrol edin.',
    ],
    soru: 'Kayıtta ne gördünüz?',
    ek: 'kitle',
    secenekler: [
      devam('bos', 'Satıcı kayıtta yok ve görüşmeye evet dedi', 'ihtiyac'),
      son('bekle', 'kayitli', 'Kayıtta satıcıda başka çalışanın veya ortağın adı var', 'Kayıt kararı bekleniyor', [
        'Satış yöneticisi kayıt tarihlerine bakarak karar verir.',
        'Karar yazılana kadar teklif göndermeyin.',
      ]),
      son('bitir', 'ret', 'Satıcı bizden ileti almak istemiyor', 'Görüşme kapandı', [
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
      'Satıcı, iStoc kataloğunu satın alabilecek firmadır.',
      'Satıcıyı müşteri takip sisteminde arayın.',
      'Satıcının ileti almayı kabul edip etmediğini kontrol edin.',
    ],
  };

  const ihtiyac: AkisAdimi = {
    id: 'ihtiyac',
    ad: 'Satıcının ihtiyacını öğrenin',
    sorumlu: 'Siz',
    yap: [
      'Ürün listesi, satıcının sattığı ürünlerin listesidir.',
      'Satıcıya alıcılarla nasıl çalıştığını sorun.',
      'Ürün listesini kimin hazırladığını öğrenin.',
      'Görüşme sonucunu müşteri kaydına yazın.',
    ],
    soru: 'Satıcıyla konuşunca ne öğrendiniz?',
    secenekler: [
      devam('uygun', 'Ürün listesi düzenli ve karar verenle tanıştım', 'gosterim'),
      son('bekle', 'liste-sahibi-yok', 'Satıcı ürün listesine bakan kimse olmadığını söyledi', 'Satıcının sorumlu belirlemesi bekleniyor', [
        'Satıcı ürün listesinden sorumlu kişiyi belirler.',
        'Sorumlu belli olunca görüşmeyi yeniden planlayın.',
      ]),
      son('bitir', 'ilgisiz', 'Satıcı ilgilenmediğini söyledi', 'Görüşme kapandı', [
        'Ret nedenini müşteri kaydına yazın.',
      ]),
    ],
  };

  const gosterim: AkisAdimi = {
    id: 'gosterim',
    ad: 'Satıcının ürünleriyle gösterim yapın',
    sorumlu: 'Siz',
    yap: [
      'Gösterim, programı satıcının ürünleriyle tanıtmaktır.',
      'Satıcının bir ürün grubunu örnek alın.',
      'Üründe olmayan özelliği göstermeyin.',
      'Alıcı veya sipariş sözü vermeyin.',
    ],
    soru: 'Ürünleri gösterdikten sonra satıcı ne dedi?',
    ek: 'sinir',
    secenekler: [
      devam('teklif-istedi', 'Satıcı fiyat teklifi istedi', 'teklif'),
      son('bitir', 'garanti', 'Satıcı sipariş geleceğine söz istedi', 'Sipariş sözü veremezsiniz', [
        'Sipariş sözü veremeyeceğinizi açıkça söyleyin.',
        'Satıcı garanti olmadan devam etmezse görüşmeyi bitirin.',
      ]),
      son('bekle', 'dusunecek', 'Satıcı daha sonra düşüneceğini söyledi', 'Satıcının kararı bekleniyor', [
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
      'Teklif, satıcıya yazılı verilen fiyat belgesidir.',
      `Teklifi fiyat tablosundaki fiyatla hazırlayın. ${yillikPaket(a)}`,
      'Katalogdaki ürün gruplarını teklife yazın.',
      'Teklifteki ₺ tutarı için kuru finans ekibinden öğrenin.',
    ],
    dikkat: `Fiyat avroyla belirlenir. Aylık bedel ${avro(a.istocAyEur)} olur. Fiyat herkes için aynıdır ve kimse değiştiremez.`,
    soru: 'Satıcı teklife ne dedi?',
    ek: 'kazanc',
    secenekler: [
      devam('kabul', 'Satıcı onaylı teklife evet dedi', 'sozlesme'),
      son('bekle', 'indirim', 'Satıcı indirim istedi', 'Fiyat herkes için aynı', [
        'Satıcıya fiyatın herkes için aynı olduğunu söyleyin.',
        'İndirim yoktur ve fiyat pazarlıkla değişmez.',
        'Talebi kimseye iletmeyin. Yeni teklif hazırlamayın.',
        'Satıcı tablodaki fiyatı kabul ederse bu adıma dönün.',
      ]),
      son('bitir', 'red', 'Satıcı teklife hayır dedi', 'Teklif kapandı', [
        'Ret nedenini müşteri kaydına yazın.',
      ]),
    ],
  };

  const sozlesme: AkisAdimi = {
    id: 'sozlesme',
    ad: 'Sözleşmeyi ve ödemeyi izleyin',
    sorumlu: 'Siz ve finans ekibi',
    yap: [
      'Sözleşme, iki tarafın imzaladığı anlaşma belgesidir.',
      'Kapsamı ve fiyat tablosundaki fiyatı sözleşmeye ekleyin.',
      'Şirketin imza yetkilisi sözleşmeyi imzalar. Satıcı ödemeyi yalnız şirket hesabına yapar.',
      'İmzalı sözleşmeyi müşteri kaydına ekleyin.',
    ],
    soru: 'Sözleşme imzalandı mı ve ödeme geldi mi?',
    ek: 'anlasma',
    secenekler: [
      devam('odendi', 'Sözleşme imzalandı ve satıcı ödemeyi yaptı', 'devir'),
      son('bekle', 'odeme-bekliyor', 'Sözleşme imzalandı ama ödeme gelmedi', 'Ödeme bekleniyor', [
        'Siz durumu finans ekibine bildirin.',
        'Finans ekibi satıcıya kimin hatırlatma yapacağını belirler.',
        'Ödeme gelince bu adıma dönün.',
      ]),
      son('bekle', 'imza-yok', 'Kimin imza atacağı belli değil', 'İmza yetkilisi bekleniyor', [
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
      'Devretmek, işi kurulum ekibine yazılı olarak vermektir.',
      'Siz ürün gruplarını ve iletişim kişisini kurulum ekibine yazılı iletin.',
      'Kurulum ekibi ürün bilgisini kimin gireceğini sizinle netleştirir.',
      'Siz ürün görsellerinin sahibini satıcıya sorun.',
    ],
    soru: 'Kurulum ekibi işi sizden aldı mı?',
    ek: 'plan',
    secenekler: [
      devam('kabul', 'Kurulum ekibi işi aldığını söyledi', p === 'lider' ? 'ekip-satis' : 'prim'),
      son('bekle', 'kapasite', 'Kurulum ekibi şu an yeni katalog alamadığını söyledi', 'Kurulum takvimi bekleniyor', [
        'Satış yöneticisine kurulum ekibinin dolu olduğunu bildirin.',
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
      'Ekip satışı, ekibinizdeki çalışanların yaptığı satıştır.',
      'Finans ekibi ekip satışlarını sizin satışlarınızdan ayrı listeler.',
      'Finans ekibi aynı satışın iki listede olmadığını kontrol eder.',
      'Siz iki listeyi kendi kaydınızla karşılaştırın.',
    ],
    soru: 'İki satış listesinde ne gördünüz?',
    secenekler: [
      devam('ayri', 'Ekip satışları ve benim satışlarım ayrı', 'prim'),
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
    yap: ['İade süresi, müşterinin satıştan vazgeçebildiği süredir.', prim.kota, prim.kural, ODEME],
    dikkat: prim.ornek,
    soru: 'Bu satışın primi ne durumda?',
    ek: 'kazanc',
    secenekler: [
      son('tamamla', 'asti', 'İade süresi bitti ve bu ay kotayı aştım', 'Satış prim listesine geçer', [
        'Finans ekibi dönem sonunda prim listesini hazırlar.',
        'Kesin tutarı yazılı prim eki belirler.',
        'Liste hatalıysa siz satış kaydıyla yazılı itiraz edin.',
      ]),
      son('tamamla', 'asmadi', 'Bu ay kotayı aşmadım', 'Satış geçerli, prim oluşmayabilir', [
        'Satış kaydınız geçerli kalır.',
        'Bu rehber maaşta kesinti öngörmez.',
        'Yöneticinizle iş yükünü birlikte inceleyin.',
      ]),
      son('bekle', 'iade', 'İade süresi daha bitmedi', 'İade süresi bekleniyor', [
        'Finans ekibi iade süresini izler.',
        'Süre bitince bu adıma dönün.',
      ]),
      son('bekle', 'baslangic', p === 'ana' ? 'Kota olmayan başlangıç dönemindeyim' : 'İşe yeni başladım ama başlangıç kuralı yazılmadı', 'Başlangıç dönemi prim kuralı bekleniyor', [
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

/** Rehberde belge adımları sorulmaz (motor.ts → belgeAdimlariniCikar). */
export const akisOlustur: AkisOlustur = (a) => belgeAdimlariniCikar(akisOlusturTam(a));
