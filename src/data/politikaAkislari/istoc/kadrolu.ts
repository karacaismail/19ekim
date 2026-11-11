import type { AkisAdimi, AkisOlustur, AkisSecenegi } from '../types';
import { kadrolu, rolMetinleri, yillikFiyat, type Ayar } from '../../satisOrtakligi';
import { kosulSonucu, seciliKosul } from '../../kosullar';

const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n))} TL`;
const yuzde = (n: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n * 100)}`;
const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n);

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const son = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

type Program = 'ana' | 'saha' | 'lider';

/** Kaynak kurallar: iStoc kadrolu rol metni. */
function kaynakKurallari() {
  const k = rolMetinleri('istoc').find((r) => r.id === 'kadrolu')!.kurallar;
  return { baslangic: k[0], odeme: k[1] };
}

function primBilgisi(a: Ayar, p: Program) {
  if (p === 'ana') {
    const k = kadrolu(a);
    const kural = a.model === 'oran'
      ? `Kotayı aşan satış tutarının ${yuzde(a.kadroluPrim.istoc)} kadarı prim olur.`
      : `Kotayı dolduran satıştan sonraki her satış için ${tl(a.sabit)} prim hesaplanır.`;
    return {
      kota: `Örnek kota ${tl(k.kota)} tutarındadır. Kota, prim eşiğidir.`,
      kural,
      ornek: a.kadroluSatis >= k.kotaIcinSatis && k.prim > 0
        ? `Örnek ayarda ${sayi(a.kadroluSatis)} satışla prim ${tl(k.prim)} olur.`
        : `Örnek ayardaki ${sayi(a.kadroluSatis)} satış kotayı aşmaz. Satış işi yine aynı sürer.`,
    };
  }
  const s = kosulSonucu(a, 'kadrolu')!;
  const v = s.veri as Record<string, number>;
  return {
    kota: `Örnek kota ${tl(v.kota)} tutarındadır. Kota ${sayi(v.kotayaGerekenSatis)} satışla dolar.`,
    kural: p === 'lider'
      ? `Kendi satışlarınız saha kuralıyla hesaplanır. Ekibin her satışından ${tl(a.liderPay)} pay doğar.`
      : `Kota dolduktan sonra her satıştan ${tl(a.sahaPrim)} prim doğar.`,
    ornek: v.prim > 0 || v.ekipPayi > 0
      ? `Örnek ayarda prim ${tl(v.prim)}${p === 'lider' ? `, ekip payı ${tl(v.ekipPayi)}` : ''} olur.`
      : `Örnek ayardaki satışlar kotayı doldurmaz. Satış işi yine aynı sürer.`,
  };
}

export const akisOlustur: AkisOlustur = (a) => {
  const p = seciliKosul(a, 'kadrolu').id as Program;
  const kural = kaynakKurallari();
  const prim = primBilgisi(a, p);
  const saha = p !== 'ana';
  const programAdi = p === 'ana' ? 'ana program' : p === 'saha' ? 'saha personeli seçeneği' : 'ekip lideri seçeneği';

  const gorev: AkisAdimi = {
    id: 'gorev',
    ad: 'Görevinizi ve prim ekinizi alın',
    sorumlu: 'İnsan kaynakları sorumlusu',
    yap: [
      'Yazılı görev tanımınızı alın.',
      `Prim ekinde ${programAdi} yazılı olsun.`,
      'Maaşın net mi brüt mü olduğunu sorun.',
    ],
    dikkat: p === 'ana' ? kural.baslangic : 'Bu seçenek için başlangıç dönemi kuralı kaynakta yazılı değildir.',
    soru: 'Görev tanımınız ve prim ekiniz hazır mı?',
    ek: 'anlasma',
    secenekler: [
      devam('hazir', 'Görev tanımı ve prim eki elimde', p === 'lider' ? 'ekip' : saha ? 'bolge' : 'kayit'),
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
  };

  const ekip: AkisAdimi = {
    id: 'ekip',
    ad: 'Ekibinizi yazılı listeye alın',
    sorumlu: 'Satış yöneticisi',
    yap: [
      'Ekibinizdeki saha çalışanlarını yazılı listeye alın.',
      'Ekip satışını kendi satışınızdan ayrı kaydedin.',
      'Görev değişikliğinin tarihini yazılı belirleyin.',
    ],
    soru: 'Ekibiniz yazılı olarak belirlendi mi?',
    ek: 'sinir',
    secenekler: [
      devam('liste-var', 'Ekip listesi yazılı ve tarihli', 'bolge'),
      son('bekle', 'liste-yok', 'Ekip henüz belirlenmedi', 'Ekip listesi bekleniyor', [
        'Satış yöneticisi ekibi ve başlangıç tarihini yazsın.',
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
      'Ziyaret bölgenizi yöneticinizden yazılı alın.',
      'Satıcıyı firma adı ve adresiyle kayıtta arayın.',
      'Kişinin iletişim tercihini kontrol edin.',
    ],
    soru: 'Kayıt aramasında ne buldunuz?',
    ek: 'kitle',
    secenekler: [
      devam('bos', 'Satıcı kayıtlı değil, görüşmeyi kabul etti', 'ihtiyac'),
      son('bekle', 'kayitli', 'Satıcı başka çalışana veya ortağa kayıtlı', 'Kayıt kararı bekleniyor', [
        'Satış yöneticisi kayıt tarihlerine bakarak karar versin.',
        'Karar yazılana kadar teklif göndermeyin.',
      ]),
      son('bitir', 'ret', 'Satıcı iletişim istemiyor', 'Görüşme kapandı', [
        'Tercihini müşteri kaydına yazın.',
        'Bu kişiye pazarlama iletisi göndermeyin.',
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
      'İletişim dayanağını ve kişinin tercihini kontrol edin.',
    ],
  };

  const ihtiyac: AkisAdimi = {
    id: 'ihtiyac',
    ad: 'Satıcının ihtiyacını öğrenin',
    sorumlu: 'Siz',
    yap: [
      'Alıcılarla nasıl çalıştığını sorun.',
      'Ürün listesini kimin hazırladığını öğrenin.',
      'Görüşme sonucunu müşteri kaydına yazın.',
    ],
    soru: 'Satıcının durumu nedir?',
    secenekler: [
      devam('uygun', 'Düzenli ürün listesi var, karar vereni tanıdım', 'gosterim'),
      son('bekle', 'liste-sahibi-yok', 'Ürün listesini güncelleyecek kişi yok', 'Satıcının sorumlu belirlemesi bekleniyor', [
        'Satıcı ürün listesinden sorumlu kişiyi belirlesin.',
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
      son('bitir', 'garanti', 'Satıcı sipariş garantisi istiyor', 'Garanti verilemez', [
        'Garanti veremeyeceğinizi açıkça söyleyin.',
        'Satıcı garantisiz devam etmezse görüşmeyi kapatın.',
      ]),
      son('bekle', 'dusunecek', 'Satıcı daha sonra düşünecek', 'Satıcının kararı bekleniyor', [
        'Satıcıyla yeni görüşme tarihi belirleyin.',
        'O tarihte bu adıma dönün.',
      ]),
    ],
  };

  const teklif: AkisAdimi = {
    id: 'teklif',
    ad: 'Katalog kapsamıyla teklif hazırlayın',
    sorumlu: 'Siz ve satış yöneticisi',
    yap: [
      `Onaylı fiyat listesiyle teklif hazırlayın. Örnek yıllık paket ${tl(yillikFiyat(a))} tutarındadır.`,
      'Katalogdaki ürün gruplarını teklife yazın.',
      'Kur için finans sorumlusuna danışın.',
    ],
    dikkat: 'Fiyat avro üzerinden hesaplanır. Finans ekibi fiyatı tek başına değiştiremez.',
    soru: 'Teklifin durumu nedir?',
    ek: 'kazanc',
    secenekler: [
      devam('kabul', 'Satıcı onaylı teklifi kabul etti', 'sozlesme'),
      son('bekle', 'indirim', 'Satıcı onaysız indirim istiyor', 'İndirim kararı bekleniyor', [
        'Talebi satış yöneticisine yazılı iletin.',
        'Onay gelmezse liste fiyatı geçerli kalır.',
        'Karar gelince bu adıma dönün.',
      ]),
      son('bitir', 'red', 'Satıcı teklifi reddetti', 'Teklif kapandı', [
        'Ret nedenini müşteri kaydına yazın.',
      ]),
    ],
  };

  const sozlesme: AkisAdimi = {
    id: 'sozlesme',
    ad: 'Sözleşmeyi ve ödemeyi izleyin',
    sorumlu: 'Yetkili imza sahibi ve finans ekibi',
    yap: [
      'Kapsamı ve fiyatı sözleşmeye ekleyin.',
      'Ödeme yalnız şirket hesabına yapılır.',
      'İmzalı sözleşmeyi müşteri kaydına ekleyin.',
    ],
    soru: 'Sözleşme ve ödeme ne durumda?',
    ek: 'anlasma',
    secenekler: [
      devam('odendi', 'Sözleşme imzalı, satıcı ödemeyi yaptı', 'devir'),
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
  };

  const devir: AkisAdimi = {
    id: 'devir',
    ad: 'Katalog kurulumuna devredin',
    sorumlu: 'Kurulum ekibi',
    yap: [
      'Ürün gruplarını ve iletişim kişisini yazılı iletin.',
      'Ürün bilgisini kimin gireceğini netleştirin.',
      'Ürün görsellerinin sahibini satıcıya sorun.',
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
      'Ekip satışlarını kendi satışlarınızdan ayrı listeleyin.',
      'Aynı satışın iki listede olmadığını kontrol edin.',
    ],
    soru: 'Ekip ve kendi satış listeniz ne durumda?',
    secenekler: [
      devam('ayri', 'Ekip ve kendi satışlarım ayrı', 'prim'),
      son('bekle', 'cakisma', 'Bir satış iki listede görünüyor', 'Satış kaydı düzeltmesi bekleniyor', [
        'Satış yöneticisi satışın kime yazılacağına karar versin.',
        'Karar yazılınca bu adıma dönün.',
      ]),
    ],
  };

  const primAdim: AkisAdimi = {
    id: 'prim',
    ad: 'Prim sonucunu kontrol edin',
    sorumlu: 'Finans ekibi',
    yap: [prim.kota, prim.kural, kural.odeme],
    dikkat: prim.ornek,
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
      son('bekle', 'baslangic', p === 'ana' ? 'Kotasız başlangıç dönemindeyim' : 'İşe yeni başladım, başlangıç kuralı yazılmadı', 'Başlangıç dönemi prim kuralı bekleniyor', [
        'Bu dönemin prim kuralı kaynakta yazılı değildir.',
        'İnsan kaynakları ve finans ekibi kuralı yazsın.',
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
    baslik: p === 'ana' ? 'Kadrolu satış uzmanı: ana program' : p === 'saha' ? 'Kadrolu satış uzmanı: saha personeli' : 'Kadrolu satış uzmanı: ekip lideri',
    ozet: p === 'lider'
      ? 'Ekibinizi yönetirsiniz. Kendi satışınızı ve ekip satışını ayrı izlersiniz.'
      : saha
        ? 'Bölgenizdeki satıcıları ziyaret edersiniz. Prim, kota dolduktan sonra satış başına doğar.'
        : 'Satıcıya iStoc kataloğunu satarsınız. Prim, kotayı aşan satıştan doğar.',
    hedef: 'Satıcının kataloğu kuruluma devredilsin ve prim durumu netleşsin.',
    ilk: 'gorev',
    adimlar,
  };
};
