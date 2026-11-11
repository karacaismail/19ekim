import type { AkisAdimi, AkisOlustur, AkisSecenegi, IsAkisi } from '../types';
import { cozumKazanci, type Ayar, type Seviye } from '../../satisOrtakligi';
import { kosulSonucu, seciliKosul } from '../../kosullar';

const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n))} TL`;
const yuzde = (n: number) => `yüzde ${sayi(n * 100)}`;

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const son = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, ...aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

/** Seçili programın kaynak kuralı. Bulunamazsa sayısız genel cümle döner. */
function kural(a: Ayar, program: string, anahtar: string, yedek: string): string {
  const s = kosulSonucu({ ...a, kosul: { ...a.kosul, cozum: program } }, 'cozum');
  return s?.kurallar.find((k) => k.includes(anahtar)) ?? yedek;
}

const itiraz = son('bekle', 'itiraz', 'Tutara itirazım var', 'İtiraz inceleniyor',
  'Finans sorumlusu itirazı kaydeder ve belgeleri inceler.',
  'Karar kabul edilen sözleşmeye göre yazılı açıklanır.',
  'Yazılı yanıt gelince bu adıma dönün.');

function odemeAdimi(yap: string[], ek: AkisAdimi['ek'] = 'kazanc'): AkisAdimi {
  return {
    id: 'odeme', ad: 'Ödemenizi izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek, yap,
    soru: 'Ödeme durumunuz nedir?',
    secenekler: [
      son('tamamla', 'odendi', 'Müşteri ödedi, faturamı kestim', 'Bu işin rehberi tamamlandı',
        'Hakediş dökümünü kendi kaydınızla karşılaştırın.', 'Vergi uygulamasını mali müşaviriniz doğrulasın.'),
      son('bekle', 'odemedi', 'Müşteri henüz ödemedi', 'Tahsilat bekleniyor',
        'Müşteri ödemeden komisyon kesinleşmez.', 'Finans sorumlusu tahsilatı izler.', 'Tahsilat bildirilince bu adıma dönün.'),
      itiraz,
    ],
  };
}

const SEVIYE_METNI: Record<Seviye, string> = {
  A: 'Katkınız yalnız tanıştırmadır. Gösterimi ve satışı ürün uzmanı yürütür.',
  B: 'Katkınız tanıştırma ve ürün gösterimidir. Satışı satış ekibi kapatır.',
  C: 'Katkınız gösterim ve onaylı teklifle satışı kapatmaktır.',
};

function anaAkis(a: Ayar): IsAkisi {
  const s = a.cozumSeviye;
  const odemeMetni = a.model === 'oran'
    ? `Komisyon yıllık paket bedelinin ${yuzde(a.oran[s])} oranıdır.`
    : 'Seçili ayarda satış başına sabit tutar ödenir.';
  const adimlar: AkisAdimi[] = [
    {
      id: 'anlasma', ad: 'Katkı anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
      yap: ['Katkı düzeyinizi yazılı belirleyin.', SEVIYE_METNI[s], 'Kurulumu ve desteği şirket yapar.'],
      soru: 'Ortaklık anlaşmanız ne durumda?',
      secenekler: [
        devam('var', 'Yazılı anlaşmam var', 'kayit'),
        son('bekle', 'yok', 'Henüz anlaşma yok', 'Anlaşma bekleniyor',
          'Ortaklık sorumlusu katkı düzeyinizi ve ödeme koşulunu yazmalı.', 'Bu sırada işletmeye ortaklıktan söz etmeyin.', 'Metin hazır olunca bu adıma dönün.'),
      ],
    },
    {
      id: 'kayit', ad: 'İşletmeyi kaydettirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
      yap: ['İşletmeyi ortaklık sorumlusuna bildirin.', 'Kayda ürün grubunu ve hedef alıcıyı yazın.', 'Her firma yalnız bir ortağa yazılır.'],
      soru: 'Kayıt sonucu ne oldu?',
      secenekler: [
        devam('acik', 'Kayıt benim adıma açıldı', 'ihtiyac'),
        son('bitir', 'baska', 'İşletme başka ortağa kayıtlı', 'Bu işletme için iş kapandı',
          'Kayıt başka ortakta olduğu için görüşmeye başlamayın.', 'Kayıt kararına itirazınız varsa ortaklık sorumlusuna yazın.'),
        son('bekle', 'yanit', 'Kayıt yanıtı gelmedi', 'Kayıt yanıtı bekleniyor',
          'Ortaklık sorumlusu kaydı kontrol eder.', 'Yanıt gelene kadar işletmeyi kendinize ait saymayın.', 'Yanıt gelince bu adıma dönün.'),
      ],
    },
    {
      id: 'ihtiyac', ad: 'Ticari ihtiyacı konuşun', sorumlu: 'Siz', ek: 'kitle',
      yap: ['Ürün bilgisinin hazır olup olmadığını sorun.', 'Ulaşmak istediği alıcı türünü not edin.', 'İleti için uygun dayanağınız olsun.'],
      soru: 'İşletme ne dedi?',
      secenekler: [
        devam('var', 'Ürün satışı ve alıcı ihtiyacı var', s === 'A' ? 'tanistirma' : 'gosterim'),
        son('bitir', 'ilgisiz', 'İşletme ilgilenmiyor', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.', 'Israr etmeyin.'),
        son('bitir', 'ileti', 'İşletme ileti istemiyor', 'İletişim durduruldu', 'Yeni ileti göndermeyin.', 'Ret kararını kayda yazın.'),
      ],
    },
  ];
  if (s === 'A') {
    adimlar.push({
      id: 'tanistirma', ad: 'Ürün uzmanıyla tanıştırın', sorumlu: 'Siz ve ürün uzmanı', ek: 'sinir',
      yap: ['Ortak bir görüşme planlayın.', 'Ürün gösterimini ürün uzmanı yapar.', 'Fiyat ve teklif konuşmayın.'],
      soru: 'Tanıştırma görüşmesi nasıl geçti?',
      secenekler: [
        devam('devraldi', 'Görüşme yapıldı, uzman işi devraldı', 'satis'),
        son('bekle', 'erteleme', 'İşletme görüşmeyi erteledi', 'Görüşme tarihi bekleniyor', 'Yeni tarihi işletmeyle kararlaştırın.', 'Tarih kesinleşince bu adıma dönün.'),
        son('bitir', 'vazgecti', 'İşletme vazgeçti', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
      ],
    });
  } else {
    adimlar.push({
      id: 'gosterim', ad: 'Ürün gösterimini yapın', sorumlu: 'Siz', ek: 'sinir',
      yap: ['İşletmenin izin verdiği ürünlerle gösterim yapın.', 'Görsellerin sahibini işletmeye sorun.', 'Görüşme notunu kayda ekleyin.'],
      soru: 'Gösterimden sonra durum nedir?',
      secenekler: [
        s === 'B'
          ? devam('devir', 'Gösterim yapıldı, satış ekibi devraldı', 'satis')
          : devam('teklif', 'Gösterim yapıldı, işletme teklif istedi', 'teklif'),
        son('bekle', 'bilgi', 'Ürün bilgisi henüz hazır değil', 'Ürün bilgisi bekleniyor',
          'İşletmenin yetkilisi ürün bilgisini ve görsel iznini hazırlamalı.', 'Bilgi hazır olunca gösterime dönün.'),
        son('bitir', 'uygun-degil', 'İşletme uygun bulmadı', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
      ],
    });
  }
  if (s === 'C') {
    adimlar.push(
      {
        id: 'teklif', ad: 'Onaylı teklifle görüşün', sorumlu: 'Siz ve yetkili satış sorumlusu',
        yap: ['Teklifi yetkili satış sorumlusundan isteyin.', 'Yalnız onaylı teklifi işletmeye iletin.', 'Fiyatı kendiniz değiştirmeyin.'],
        soru: 'Teklif ne durumda?',
        secenekler: [
          devam('onayli', 'Onaylı teklifi işletmeye ilettim', 'sozlesme'),
          son('bekle', 'onay', 'Teklif henüz onaylanmadı', 'Teklif onayı bekleniyor', 'Yetkili satış sorumlusu teklifi hazırlar.', 'Onaylı teklif gelince bu adıma dönün.'),
          son('bekle', 'fiyat', 'İşletme farklı fiyat istiyor', 'Fiyat kararı bekleniyor', 'Talebi yetkili satış sorumlusuna iletin.', 'Fiyat kararını yalnız o verir.', 'Yanıt gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'sozlesme', ad: 'Sözleşmeyi tamamlayın', sorumlu: 'Yetkili satış sorumlusu', ek: 'anlasma',
        yap: ['Sözleşme işletme ile şirket arasında yapılır.', 'Kendi danışmanlık bedelinizi ayrı gösterin.'],
        soru: 'İşletme sözleşmeyi ne yaptı?',
        secenekler: [
          devam('kabul', 'İşletme sözleşmeyi kabul etti', 'kurulum'),
          son('bekle', 'dusunuyor', 'İşletme henüz karar vermedi', 'Karar bekleniyor', 'İşletmenin sorularını yetkili satış sorumlusuna iletin.', 'Karar gelince bu adıma dönün.'),
          son('bitir', 'red', 'İşletme sözleşmeyi reddetti', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
    );
  } else {
    adimlar.push({
      id: 'satis', ad: 'Satış sonucunu izleyin', sorumlu: 'Satış ekibi',
      yap: ['Satışı ve sözleşmeyi satış ekibi yürütür.', 'İşletmenin sorularını satış ekibine iletin.'],
      soru: 'Satış ekibinden ne haber aldınız?',
      secenekler: [
        devam('imza', 'İşletme sözleşmeyi imzaladı', 'kurulum'),
        son('bekle', 'karar', 'İşletme henüz karar vermedi', 'Karar bekleniyor', 'Satış ekibi işletmeyle görüşmeyi sürdürür.', 'Karar gelince bu adıma dönün.'),
        son('bitir', 'almadi', 'İşletme satın almadı', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
      ],
    });
  }
  adimlar.push(
    {
      id: 'kurulum', ad: 'Kurulumu şirkete devredin', sorumlu: 'Kurulum ekibi', ek: 'plan',
      yap: ['Devir notuna ihtiyacı ve hazır ürün bilgisini yazın.', 'Destek taleplerini şirkete yönlendirin.'],
      soru: 'Kurulum devri ne durumda?',
      secenekler: [
        devam('devraldi', 'Kurulum ekibi işi devraldı', 'odeme'),
        son('bekle', 'tarih', 'Kurulum için tarih verilmedi', 'Kurulum tarihi bekleniyor', 'Operasyon yöneticisi kurulum kapasitesini doğrular.', 'İşletmeye kendiniz tarih vermeyin.', 'Tarih bildirilince bu adıma dönün.'),
      ],
    },
    odemeAdimi([odemeMetni, `Seçili ayarda bir yıllık paket için örnek komisyon ${tl(cozumKazanci(a))} olur.`,
      `Hesaplayıcı ilk ödemeyi ${a.ilkGun}. günde, kalanını ${a.kalanGun}. günde gösterir.`]),
  );
  return {
    baslik: s === 'A' ? 'Tanıştıran danışman' : s === 'B' ? 'Gösterim yapan danışman' : 'Satışı kapatan danışman',
    ozet: 'Hizmet verdiğiniz işletmeyi iStoc ile buluşturursunuz. Kurulumu ve desteği şirket yapar.',
    hedef: 'İşletmenin satış ihtiyacı doğru ekibe ulaşsın ve komisyonunuz kayıtlı olsun.',
    ilk: 'anlasma', adimlar,
  };
}

function gelistirmeAkis(a: Ayar): IsAkisi {
  const p = 'gelistirme';
  return {
    baslik: 'Satıcı geliştirme ortağı',
    ozet: 'Aday satıcıları iStoc’ta satışa hazır hâle getirirsiniz.',
    hedef: 'Hazır sayılan satıcılar kabul edilsin ve komisyon dönemi izlensin.',
    ilk: 'ek',
    adimlar: [
      {
        id: 'ek', ad: 'Program ekini hazırlatın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: [kural(a, p, 'aday', 'Aday ve hazır satıcı sayısı program koşullarındadır.'), 'Hazır sayılma ölçütünü ekte yazın.'],
        soru: 'Program eki ne durumda?',
        secenekler: [
          devam('imza', 'Program eki imzalandı', 'oran'),
          son('bekle', 'yok', 'Ek henüz hazırlanmadı', 'Program eki bekleniyor', 'Ortaklık sorumlusu ölçütü ve kabul eden kişiyi yazar.', 'Ek hazır olunca bu adıma dönün.'),
        ],
      },
      {
        id: 'oran', ad: 'Oranı kesinleştirin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [kural(a, p, 'Oran örnektir', 'Oran örnektir. Finans sorumlusu kesinleştirir.'),
          `Hesaplayıcı ilk ${a.gelistirmeAy} ay için ${yuzde(a.gelistirmeOran)} oranı gösterir.`],
        soru: 'Oran yazılı olarak bildirildi mi?',
        secenekler: [
          devam('yazili', 'Finans oranı yazılı bildirdi', 'aday'),
          son('bekle', 'yok', 'Oran henüz kesinleşmedi', 'Oran bekleniyor', 'Finans sorumlusu oranı yazılı bildirir.', 'Oran gelmeden iş kabul etmeyin.', 'Bildirim gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'aday', ad: 'Aday satıcıları bildirin', sorumlu: 'Siz', ek: 'kitle',
        yap: ['Aday satıcıları ortaklık sorumlusuna bildirin.', 'Kabul ve koruma süreleri program koşullarındadır.'],
        soru: 'Adaylar için ne yanıt aldınız?',
        secenekler: [
          devam('kabul', 'Adaylar kabul edildi', 'hazirlik'),
          son('bekle', 'yanit', 'Kabul yanıtı gelmedi', 'Kabul bekleniyor', 'Ortaklık sorumlusu adayları kontrol eder.', 'Yanıt gelince bu adıma dönün.'),
          son('bitir', 'red', 'Adaylar reddedildi', 'Bu adaylar için iş kapandı', 'Ret gerekçesini kayda yazın.', 'Yeni adayla bu rehberi baştan başlatın.'),
        ],
      },
      {
        id: 'hazirlik', ad: 'Satıcıyı hazırlayın', sorumlu: 'Siz',
        yap: ['Ürün bilgisini satıcının yetkilisi onaylasın.', 'Görsellerin sahibini satıcıyla yazılı belirleyin.'],
        soru: 'Satıcının hazırlığı ne durumda?',
        secenekler: [
          devam('hazir', 'Satıcı ölçüte göre hazır', 'kabul'),
          son('bekle', 'eksik', 'Ürün bilgisi veya görsel izni eksik', 'Hazırlık sürüyor', 'Satıcının yetkilisi eksikleri tamamlar.', 'Tamamlanınca bu adıma dönün.'),
          son('bitir', 'birakti', 'Satıcı hazırlığı bıraktı', 'Bu satıcı için iş kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'kabul', ad: 'Hazırlığı kabul ettirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: ['Hazırlık kanıtlarını ortaklık sorumlusuna gönderin.'],
        soru: 'Ortaklık sorumlusu ne yanıt verdi?',
        secenekler: [
          devam('kabul', 'Hazırlık kabul edildi', 'odeme'),
          son('bekle', 'eksik', 'Eksikler bildirildi', 'Düzeltme bekleniyor', 'Bildirilen eksikleri satıcıyla tamamlayın.', 'Sonra kabul için yeniden başvurun.'),
        ],
      },
      odemeAdimi([`Komisyon satıcının ilk ${a.gelistirmeAy} aylık ücretinden hesaplanır.`, 'Satıcı ödemeden komisyon kesinleşmez.']),
    ],
  };
}

function arzAkis(a: Ayar): IsAkisi {
  const p = 'arz';
  return {
    baslik: 'Kurumsal satıcı getiren kurum',
    ozet: 'Kurumunuza bağlı satıcıları iStoc’a getirirsiniz. Bu programda nakit ödeme yoktur.',
    hedef: 'Üyeler kendi isteğiyle başvursun ve kurum sonuç raporunu alsın.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Kurumunuzu tanımlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'sinir',
        yap: ['Bu program satıcı üyeleri olan kurumlar içindir.', kural(a, p, 'Nakit', 'Bu programda nakit ödeme yapılmaz.')],
        soru: 'Kurumunuz bu tanıma uyuyor mu?',
        secenekler: [
          devam('uygun', 'Kurumumuzun satıcı üyeleri var', 'protokol'),
          son('bitir', 'uye-yok', 'Satıcı üyemiz yok', 'Bu program uygun değil', 'Başka programı ortaklık sorumlusuyla konuşun.'),
          son('bitir', 'nakit', 'Nakit ödeme bekliyoruz', 'Bu program uygun değil', 'Bu programda nakit ödeme yoktur.', 'Ana programı ortaklık sorumlusuyla değerlendirin.'),
        ],
      },
      {
        id: 'protokol', ad: 'Protokolü imzalayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Kurum ile şirket protokol imzalar.', 'Veri paylaşım sınırını protokole yazın.'],
        soru: 'Protokol ne durumda?',
        secenekler: [
          devam('imza', 'Protokol imzalandı', 'duyuru'),
          son('bekle', 'taslak', 'Protokol taslakta', 'Protokol bekleniyor', 'Ortaklık sorumlusu taslağı tamamlar.', 'İmzadan sonra bu adıma dönün.'),
        ],
      },
      {
        id: 'duyuru', ad: 'Üyelere duyurun', sorumlu: 'Kurum yetkilisi', ek: 'kitle',
        yap: ['Üye listesini topluca paylaşmayın.', 'İlgilenen üyeler kendileri başvursun.', 'Duyuruda tanıtım olduğunu belirtin.'],
        soru: 'Duyuru ne durumda?',
        secenekler: [
          devam('basvuru', 'Üyeler başvurmaya başladı', 'vitrin'),
          son('bekle', 'izin', 'Duyuru için kurum onayı yok', 'Kurum onayı bekleniyor', 'Kurum yönetimi duyuruyu onaylamalı.', 'Onay gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'vitrin', ad: 'Etkinleşme eşiğini izleyin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: [kural(a, p, 'vitrin', 'Etkinleşme eşiği program koşullarındadır.'), 'Vitrinleri şirket doğrular.'],
        soru: 'Vitrin sayısı nerede?',
        secenekler: [
          devam('esik', 'Gerekli sayıda vitrin açıldı', 'rapor'),
          son('bekle', 'az', 'Vitrin sayısı eşiğin altında', 'Etkinleşme bekleniyor', 'Kurum yeni üye başvurularını destekler.', 'Ortaklık sorumlusu sayıyı yeniden kontrol eder.'),
        ],
      },
      {
        id: 'rapor', ad: 'Sonuç raporunu alın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [kural(a, p, 'sonuç raporu', 'Kurum dönemsel sonuç raporu alır.')],
        soru: 'Sonuç raporu geldi mi?',
        secenekler: [
          son('tamamla', 'geldi', 'Sonuç raporunu aldık', 'Bu işin rehberi tamamlandı', 'Raporu protokoldeki veri sınırıyla kontrol edin.'),
          son('bekle', 'gelmedi', 'Rapor henüz gelmedi', 'Rapor bekleniyor', 'Ortaklık sorumlusu rapor tarihini bildirir.', 'Tarih gelince bu adıma dönün.'),
        ],
      },
    ],
  };
}

function talepAkis(a: Ayar): IsAkisi {
  const p = 'talep';
  return {
    baslik: 'Alım talebi toplayan ortak',
    ozet: 'Alıcıların satın alma taleplerini iStoc’a getirirsiniz. Sırf kayıt açmak ücret doğurmaz.',
    hedef: 'İzinli ve nitelikli talepler kabul edilsin ve sonuçları takip edilsin.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Rolünüzü netleştirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'sinir',
        yap: [kural(a, p, 'Kayıt başına', 'Kayıt başına ödeme yapılmaz.'), 'Alıcılarla gerçek bir iş ilişkiniz olmalı.'],
        soru: 'Alıcılarla nasıl bir bağınız var?',
        secenekler: [
          devam('bag', 'Alıcılarla düzenli iş bağımız var', 'kapsam'),
          son('bitir', 'kayit', 'Yalnız kayıt toplayabiliriz', 'Bu program uygun değil', 'Kayıt toplamak ücret doğurmaz.'),
        ],
      },
      {
        id: 'kapsam', ad: 'Görev kapsamını yazın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: [kural(a, p, 'Görev ücretinin', 'Görev ücreti iki parçada ödenir.'), 'Görev ücreti tutarı kaynakta yazmıyor.'],
        soru: 'Görev kapsamı ne durumda?',
        secenekler: [
          devam('kabul', 'Kapsam ve ücret yazılı kabul edildi', 'izin'),
          son('bekle', 'ucret', 'Ücret tutarı yazılmadı', 'Ücret kararı bekleniyor', 'Finans sorumlusu tutarı yazılı bildirmeli.', 'Tutar gelmeden talep toplamayın.'),
        ],
      },
      {
        id: 'izin', ad: 'Alıcıdan izin alın', sorumlu: 'Siz',
        yap: ['Alıcının paylaşım iznini kayda yazın.', 'İzin yoksa talebi iletmeyin.'],
        soru: 'Alıcı ne dedi?',
        secenekler: [
          devam('izin', 'Alıcı paylaşım izni verdi', 'esik'),
          son('bitir', 'red', 'Alıcı izin vermedi', 'Bu talep için iş kapandı', 'Talebi kimseyle paylaşmayın.', 'Ret kararını kayda yazın.'),
        ],
      },
      {
        id: 'esik', ad: 'Etkinleşme eşiğini izleyin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: [kural(a, p, 'Aktivasyon', 'Etkinleşme eşiği program koşullarındadır.'), kural(a, p, 'ayda en az', 'Aylık talep sayısı program koşullarındadır.')],
        soru: 'Talep sayısı nerede?',
        secenekler: [
          devam('yeter', 'Gerekli sayıda nitelikli talep var', 'sonuc'),
          son('bekle', 'az', 'Talep sayısı yetersiz', 'Etkinleşme bekleniyor', 'Yeni izinli talepleri kayda ekleyin.', 'Ortaklık sorumlusu sayıyı yeniden kontrol eder.'),
        ],
      },
      {
        id: 'sonuc', ad: 'Sonucu takip edin', sorumlu: 'Siz ve finans sorumlusu', ek: 'kazanc',
        yap: ['Her talebin sonucunu kayda yazın.', 'Kalan görev ücreti sonuç takibinde ödenir.'],
        soru: 'Sonuç takibi ne durumda?',
        secenekler: [
          son('tamamla', 'kayitli', 'Sonuçlar kayıtlı, faturamı kestim', 'Bu işin rehberi tamamlandı', 'Ödemeyi kendi kaydınızla karşılaştırın.'),
          son('bekle', 'belirsiz', 'Sonuç henüz belli değil', 'Sonuç bekleniyor', 'Alıcı kararını verince kayda yazın.'),
          itiraz,
        ],
      },
    ],
  };
}

function hizmetAkis(a: Ayar): IsAkisi {
  const p = 'hizmet';
  return {
    baslik: 'Onaylı hizmet ortağı',
    ozet: 'iStoc satıcılarına lojistik, ödeme veya benzeri hizmet sunarsınız.',
    hedef: 'Hizmetiniz onaylı biçimde sunulsun ve ödeme modeli yazılı olsun.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Hizmetinizi tanımlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: [kural(a, p, 'Lojistik', 'Lojistik, ödeme veya benzeri hizmet verebilirsiniz.')],
        soru: 'Hangi hizmeti veriyorsunuz?',
        secenekler: [
          devam('uygun', 'Bu hizmetlerden birini veriyoruz', 'model'),
          son('bekle', 'baska', 'Başka bir hizmet veriyoruz', 'Uygunluk inceleniyor', 'Ortaklık sorumlusu hizmetinizi değerlendirir.', 'Yanıt gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'model', ad: 'Ödeme modelini yazın', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [kural(a, p, 'Gelir paylaşımı', 'Gelir paylaşımı ya da yönlendirme ücreti alınır.'), 'Oran ve tutar kaynakta yazmıyor.'],
        soru: 'Ödeme modeli ne durumda?',
        secenekler: [
          devam('yazili', 'Model ve tutar yazılı kabul edildi', 'rozet'),
          son('bekle', 'yok', 'Tutar henüz belirlenmedi', 'Ödeme kararı bekleniyor', 'Finans sorumlusu modeli ve tutarı yazar.', 'Tutar gelmeden hizmete başlamayın.'),
        ],
      },
      {
        id: 'rozet', ad: 'Rozet iznini alın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'sinir',
        yap: ['“iStoc Onaylı Hizmet” rozetini yalnız izinli biçimde kullanın.', 'Hizmet sorumluluğunu anlaşmaya yazın.'],
        soru: 'Rozet izni ne durumda?',
        secenekler: [
          devam('izin', 'Rozet kullanım izni yazılı', 'is'),
          son('bekle', 'yok', 'İzin henüz verilmedi', 'Rozet izni bekleniyor', 'Ortaklık sorumlusu izni yazılı verir.', 'İzin gelmeden rozeti kullanmayın.'),
        ],
      },
      {
        id: 'is', ad: 'İlk hizmeti verin', sorumlu: 'Siz',
        yap: ['Hizmeti satıcıya iş akışı üzerinden sunun.', 'Hizmet sonucunu kayda yazın.'],
        soru: 'İlk hizmet nasıl sonuçlandı?',
        secenekler: [
          devam('tamam', 'Hizmeti verdik, sonuç kayıtlı', 'odeme'),
          son('bitir', 'vazgecti', 'Satıcı hizmetten vazgeçti', 'Bu iş kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      odemeAdimi(['Ödeme yazılı ödeme modeline göre yapılır.', 'Satıcı ödemeden paylaşım kesinleşmez.']),
    ],
  };
}

function teknolojiAkis(): IsAkisi {
  return {
    baslik: 'Teknoloji ortağı',
    ozet: 'Yazılımınızı iStoc’a doğrudan bağlarsınız. Kataloglar otomatik eşitlenir.',
    hedef: 'Bağlantı doğrulansın ve ortak tanıtım yazılı plana bağlansın.',
    ilk: 'baslangic',
    adimlar: [
      {
        id: 'baslangic', ad: 'Başlangıcı doğrulayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: ['Bu program ikinci dalgada başlar.', 'Başlangıcı ortaklık sorumlusu yazılı bildirir.'],
        soru: 'Program başlangıcı bildirildi mi?',
        secenekler: [
          devam('basladi', 'Başlangıç yazılı bildirildi', 'teknik'),
          son('bekle', 'yok', 'Başlangıç henüz bildirilmedi', 'Program başlamadı', 'Ortaklık sorumlusu başlangıcı yazılı bildirir.', 'O zamana kadar müşteriye bağlantı sözü vermeyin.'),
        ],
      },
      {
        id: 'teknik', ad: 'Bağlantıyı doğrulatın', sorumlu: 'Teknik ekip',
        yap: ['Teknik ekip yazılım bağlantısını test eder.', 'Katalog eşitlemesini örnek veriyle deneyin.'],
        soru: 'Teknik ekip ne dedi?',
        secenekler: [
          devam('kabul', 'Teknik ekip bağlantıyı kabul etti', 'indirim'),
          son('bekle', 'suruyor', 'Teknik inceleme sürüyor', 'Teknik sonuç bekleniyor', 'Teknik ekip sonucu yazılı bildirir.'),
          son('bitir', 'uygun-degil', 'Bağlantı uygun bulunmadı', 'Bu program kapandı', 'Teknik gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'indirim', ad: 'Karşılıklı indirimi yazın', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Liste fiyatında karşılıklı indirim uygulanır.', 'İndirim oranı kaynakta yazmıyor.'],
        soru: 'İndirim ne durumda?',
        secenekler: [
          devam('yazili', 'İndirim yazılı anlaşmada', 'tanitim'),
          son('bekle', 'yok', 'İndirim belirlenmedi', 'İndirim kararı bekleniyor', 'Finans sorumlusu oranı yazılı bildirir.'),
        ],
      },
      {
        id: 'tanitim', ad: 'Ortak tanıtımı planlayın', sorumlu: 'Siz ve pazarlama sorumlusu',
        yap: ['Tanıtımda reklam olduğunu açıkça belirtin.', 'Doğrulanmayan özellik anlatmayın.'],
        soru: 'Tanıtım planı ne durumda?',
        secenekler: [
          son('tamamla', 'hazir', 'Ortak tanıtım planı hazır', 'Bu işin rehberi tamamlandı', 'Planı ve onayı kayda ekleyin.'),
          son('bekle', 'yok', 'Plan henüz hazır değil', 'Plan bekleniyor', 'Pazarlama sorumlusu taslağı hazırlar.'),
        ],
      },
    ],
  };
}

function bolgeAkis(a: Ayar): IsAkisi {
  const p = 'bolge';
  return {
    baslik: 'Bölge temsilcisi',
    ozet: 'Belirli bir bölgede iStoc satıcı ağı kurarsınız. Tek yetkili olma hakkı verilmez.',
    hedef: 'Program başladığında aktif satıcılar kayıtlı ve doğrulanmış olsun.',
    ilk: 'baslangic',
    adimlar: [
      {
        id: 'baslangic', ad: 'Başlangıcı doğrulayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: [kural(a, p, 'başlar', 'Program, pazar kanıtlanınca başlar.')],
        soru: 'Program başlangıcı bildirildi mi?',
        secenekler: [
          devam('basladi', 'Başlangıç yazılı bildirildi', 'yetki'),
          son('bekle', 'yok', 'Başlangıç henüz bildirilmedi', 'Program başlamadı', 'Şirket pazar kanıtını değerlendirir.', 'O zamana kadar bölge yetkisi vaat etmeyin.'),
        ],
      },
      {
        id: 'yetki', ad: 'Bölge kapsamını yazın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'sinir',
        yap: ['Bölge sınırını yazılı belirleyin.', 'Size tek yetkili olma hakkı verilmez.'],
        soru: 'Bölge sınırı yazılı mı?',
        secenekler: [
          devam('yazili', 'Bölge sınırı yazılı', 'odeme-model'),
          son('bekle', 'belirsiz', 'Sınır henüz belirsiz', 'Bölge kararı bekleniyor', 'Ortaklık sorumlusu sınırı yazılı bildirir.'),
        ],
      },
      {
        id: 'odeme-model', ad: 'Ödemeyi netleştirin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: ['Aktif satıcı başına ödeme ve işlem payı alınır.', 'Tutarlar kaynakta yazmıyor.'],
        soru: 'Ödeme tutarları yazıldı mı?',
        secenekler: [
          devam('yazili', 'Tutarlar yazılı kabul edildi', 'satici'),
          son('bekle', 'yok', 'Tutarlar henüz yok', 'Ödeme kararı bekleniyor', 'Finans sorumlusu tutarları yazar.', 'Tutar gelmeden satıcı toplamayın.'),
        ],
      },
      {
        id: 'satici', ad: 'Satıcıları bildirin', sorumlu: 'Siz', ek: 'kitle',
        yap: ['Satıcıları ortaklık sorumlusuna bildirin.', 'Dayanak olmadan ileti göndermeyin.'],
        soru: 'Bildirdiğiniz satıcılar ne durumda?',
        secenekler: [
          devam('kabul', 'Satıcılar kabul edildi', 'aktif'),
          son('bekle', 'yanit', 'Kabul yanıtı gelmedi', 'Kabul bekleniyor', 'Ortaklık sorumlusu kayıtları kontrol eder.'),
        ],
      },
      {
        id: 'aktif', ad: 'Aktif satıcıları izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)',
        yap: ['Aktif sayılma ölçütünü yazılı isteyin.', 'Aktif satıcı listesini ayda bir karşılaştırın.'],
        soru: 'Aktif satıcı durumu nedir?',
        secenekler: [
          son('tamamla', 'kayitli', 'Aktif satıcılar kayıtlı, faturamı kestim', 'Bu işin rehberi tamamlandı', 'Ödemeyi kendi listenizle karşılaştırın.'),
          son('bekle', 'olcut', 'Aktif sayılma ölçütü belirsiz', 'Ölçüt bekleniyor', 'Finans sorumlusu ölçütü yazılı bildirir.'),
          itiraz,
        ],
      },
    ],
  };
}

export const akisOlustur: AkisOlustur = (a) => {
  switch (seciliKosul(a, 'cozum').id) {
    case 'gelistirme': return gelistirmeAkis(a);
    case 'arz': return arzAkis(a);
    case 'talep': return talepAkis(a);
    case 'hizmet': return hizmetAkis(a);
    case 'teknoloji': return teknolojiAkis();
    case 'bolge': return bolgeAkis(a);
    default: return anaAkis(a);
  }
};
