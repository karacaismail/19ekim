import { belgeAdimlariniCikar } from '../motor';
import type { AkisAdimi, AkisOlustur, AkisSecenegi, IsAkisi } from '../types';
import { aylikFiyat, cozumKazanci, yillikFiyat, type Ayar, type Seviye } from '../../satisOrtakligi';
import { kosulSonucu, seciliKosul } from '../../kosullar';
import { num, tlBitisik } from '../../../lib/format';

const sayi = num;
/** Tutar ile birim arasında bölünmez boşluk bulunur. */
const tl = tlBitisik;
const avro = (n: number) => `${sayi(n)} €`;
const yuzde = (n: number) => `yüzde ${sayi(n * 100)}`;

/** iStoc fiyatı avroyla belirlenir. TL karşılığı örnek kura bağlıdır. */
const yillikPaket = (a: Ayar) =>
  `Yıllık paket ${sayi(a.istocYilAy)} aylık bedeldir: ${avro(a.istocAyEur * a.istocYilAy)}. Bu örnekte kur ${sayi(a.kur)} ₺ olduğu için ${tl(yillikFiyat(a))} eder.`;
const aylikBedel = (a: Ayar) =>
  `Satıcının aylık bedeli ${avro(a.istocAyEur)} olur. Bu örnekte kur ${sayi(a.kur)} ₺ olduğu için ${tl(aylikFiyat(a))} eder.`;

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const son = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, ...aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

/** Programın kural cümlesi. Bulunamazsa sayısız genel cümle döner. */
function kural(a: Ayar, program: string, anahtar: string, yedek: string): string {
  const s = kosulSonucu({ ...a, kosul: { ...a.kosul, cozum: program } }, 'cozum');
  return s?.kurallar.find((k) => k.includes(anahtar)) ?? yedek;
}
/** Program kuralındaki sayılar. Sayılar program tanımından gelir, bu dosyada yazılmaz. */
function kuralSayilari(a: Ayar, program: string, anahtar: string): string[] {
  return kural(a, program, anahtar, '').match(/\d+/g) ?? [];
}
const kuralSayisi = (a: Ayar, program: string, anahtar: string): string | null => kuralSayilari(a, program, anahtar)[0] ?? null;

const itiraz = son('bekle', 'itiraz', 'Bana ödenen tutarı yanlış buldum', 'İtirazınıza bakılıyor',
  'Finans sorumlusu itirazı kaydeder ve belgeleri inceler.',
  'Finans sorumlusu kararı imzalı sözleşmeye göre yazılı açıklar.',
  'Yazılı yanıt gelince bu adıma dönün.');

function odemeAdimi(yap: string[], ek: AkisAdimi['ek'] = 'kazanc'): AkisAdimi {
  return {
    id: 'odeme', ad: 'Ödemenizi izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek,
    terimler: ['Fatura, aldığınız para için kestiğiniz resmi belgedir.'], yap,
    soru: 'Ödemeniz geldi mi?',
    secenekler: [
      son('tamamla', 'odendi', 'Müşteri ödedi ve ben faturamı kestim', 'Bu işin rehberi tamamlandı',
        'Şirketin komisyon listesini kendi kaydınızla karşılaştırın.', 'Vergi işlerini mali müşaviriniz kontrol etsin.'),
      son('bekle', 'odemedi', 'Müşteri henüz ödemedi', 'Müşterinin ödemesi bekleniyor',
        'Müşteri ödemeden komisyon kesinleşmez.', 'Finans sorumlusu müşterinin ödemesini izler.', 'Ödemenin geldiği bildirilince bu adıma dönün.'),
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
    ? `Şirket yıllık paket bedelinin ${yuzde(a.oran[s])} kadarını size komisyon olarak öder. Bu örnekte bir yıllık paketin komisyonu ${tl(cozumKazanci(a))} olur.`
    : `Bu örnekte şirket satış başına sabit komisyon öder. Bir satışın komisyonu ${tl(cozumKazanci(a))} olur.`;
  const adimlar: AkisAdimi[] = [
    {
      id: 'anlasma', ad: 'Katkı anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
      terimler: ['Ortaklık anlaşması, şirketle aranızdaki yazılı sözleşmedir.'],
      yap: [ 'Ortaklık sorumlusu katkı seviyenizi sizinle yazılı belirler.', SEVIYE_METNI[s], 'Kurulumu ve desteği şirket yapar.'],
      soru: 'Ortaklık anlaşmanız yazılı mı?',
      secenekler: [
        devam('var', 'Elimde yazılı anlaşma var', 'kayit'),
        son('bekle', 'yok', 'Henüz anlaşma yapmadık', 'Anlaşma bekleniyor',
          'Ortaklık sorumlusu katkı seviyenizi ve ödeme koşulunu yazar.', 'Bu sırada işletmeye ortaklıktan söz etmeyin.', 'Metin hazır olunca bu adıma dönün.'),
      ],
    },
    {
      id: 'kayit', ad: 'İşletmeyi kaydettirin', sorumlu: 'Siz ve ortaklık sorumlusu (önerilen görev)',
      terimler: ['Ortak, şirketle birlikte çalışan kişi ya da firmadır.'],
      yap: [ 'Siz işletmeyi ortaklık sorumlusuna bildirin.', 'Kayda ürün grubunu ve hedef alıcıyı yazın.', 'Şirket her firmayı yalnız bir ortağın kaydına yazar.'],
      soru: 'İşletmenin kaydı ne oldu?',
      secenekler: [
        devam('acik', 'Ortaklık sorumlusu işletmeyi benim adıma yazdı', 'ihtiyac'),
        son('bitir', 'baska', 'İşletmenin başka ortağa kayıtlı olduğunu öğrendim', 'Bu işletme için iş kapandı',
          'Kayıt başka ortakta olduğu için görüşmeye başlamayın.', 'Kayıt kararına itirazınız varsa ortaklık sorumlusuna yazın.'),
        son('bekle', 'yanit', 'Kayıt için henüz yanıt gelmedi', 'Kayıt yanıtı bekleniyor',
          'Ortaklık sorumlusu kaydı kontrol eder.', 'Yanıt gelene kadar işletmeyi kendinize ait saymayın.', 'Yanıt gelince bu adıma dönün.'),
      ],
    },
    {
      id: 'ihtiyac', ad: 'Ticari ihtiyacı konuşun', sorumlu: 'Siz', ek: 'kitle',
      yap: ['Ürün bilgisinin hazır olup olmadığını sorun.', 'Ulaşmak istediği alıcı türünü not edin.', 'Mesaj göndermeden önce kişinin iznini kontrol edin.'],
      soru: 'İşletme ne dedi?',
      secenekler: [
        devam('var', 'İşletme ürün satmak ve alıcı bulmak istedi', s === 'A' ? 'tanistirma' : 'gosterim'),
        son('bitir', 'ilgisiz', 'İşletme ilgilenmediğini söyledi', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.', 'Israr etmeyin.'),
        son('bitir', 'ileti', 'İşletme mesaj almak istemediğini söyledi', 'İletişim durduruldu', 'Yeni mesaj göndermeyin.', 'Ret kararını kayda yazın.'),
      ],
    },
  ];
  if (s === 'A') {
    adimlar.push({
      id: 'tanistirma', ad: 'Ürün uzmanıyla tanıştırın', sorumlu: 'Siz ve ürün uzmanı', ek: 'sinir',
      terimler: ['Ürün uzmanı, ürünü işletmeye gösteren kişidir.'],
      yap: [ 'Ortak bir görüşme planlayın.', 'Ürün gösterimini ürün uzmanı yapar.', 'Fiyat sorulursa fiyat tablosundaki fiyatı söyleyin. Teklif konuşmayın.'],
      soru: 'Tanıştırma görüşmesi nasıl geçti?',
      secenekler: [
        devam('devraldi', 'Görüşme oldu ve ürün uzmanı işi üstlendi', 'satis'),
        son('bekle', 'erteleme', 'İşletme görüşmeyi ileri bir güne attı', 'Görüşme tarihi bekleniyor', 'Yeni tarihi işletmeyle kararlaştırın.', 'Tarih kesinleşince bu adıma dönün.'),
        son('bitir', 'vazgecti', 'İşletme bu işten vazgeçtiğini söyledi', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
      ],
    });
  } else {
    adimlar.push({
      id: 'gosterim', ad: 'Ürün gösterimini yapın', sorumlu: 'Siz', ek: 'sinir',
      terimler: ['Gösterim, iStoc’un nasıl çalıştığını işletmeye göstermektir.'],
      yap: [ 'İşletmenin izin verdiği ürünlerle gösterim yapın.', 'Görsellerin sahibini işletmeye sorun.', 'Görüşme notunu kayda ekleyin.'],
      soru: 'Ürünü gösterdikten sonra ne oldu?',
      secenekler: [
        s === 'B'
          ? devam('devir', 'Ürünü gösterdim ve satış ekibi işi üstlendi', 'satis')
          : devam('teklif', 'Ürünü gösterdim ve işletme teklif istedi', 'teklif'),
        son('bekle', 'bilgi', 'İşletme ürün bilgisinin hazır olmadığını söyledi', 'Ürün bilgisi bekleniyor',
          'İşletmenin yetkilisi ürün bilgisini ve görsel iznini hazırlar.', 'Bilgi hazır olunca gösterime dönün.'),
        son('bitir', 'uygun-degil', 'İşletme bu işi uygun bulmadığını söyledi', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
      ],
    });
  }
  if (s === 'C') {
    adimlar.push(
      {
        id: 'teklif', ad: 'Onaylı teklifle görüşün', sorumlu: 'Siz ve yetkili satış sorumlusu',
        terimler: ['Teklif, işletmeye yazılı verilen fiyat önerisidir.'],
        yap: [ 'Yetkili satış sorumlusu teklifi fiyat tablosundaki fiyatla hazırlar.', 'Siz yalnız bu onaylı teklifi işletmeye iletin.', 'Fiyatı değiştirmeyin. İndirim sözü vermeyin.'],
        soru: 'Teklifte ne oldu?',
        secenekler: [
          devam('onayli', 'Onaylı teklifi işletmeye verdim', 'sozlesme'),
          son('bekle', 'onay', 'Teklif henüz onaylanmadı', 'Teklif onayı bekleniyor', 'Yetkili satış sorumlusu teklifi hazırlar.', 'Onaylı teklif gelince bu adıma dönün.'),
          son('bekle', 'fiyat', 'İşletme başka bir fiyat istediğini söyledi', 'Fiyat herkes için aynı',
            'İşletmeye fiyatın herkes için aynı olduğunu söyleyin.', 'Fiyat pazarlıkla değişmez.',
            'Talebi kimseye iletmeyin. Şirket yeni teklif hazırlamaz.', 'İşletme tablodaki fiyatı kabul ederse bu adıma dönün.'),
        ],
      },
      {
        id: 'sozlesme', ad: 'Sözleşmeyi tamamlayın', sorumlu: 'Yetkili satış sorumlusu', ek: 'anlasma',
        terimler: ['Sözleşme, işletme ile şirket arasındaki yazılı anlaşmadır.'],
        yap: [ 'Yetkili satış sorumlusu sözleşmeyi işletme ile şirket arasında hazırlar.', 'Danışmanlık bedeliniz varsa siz bu bedeli teklifte ayrı gösterin.'],
        soru: 'İşletme sözleşme için ne dedi?',
        secenekler: [
          devam('kabul', 'İşletme sözleşmeyi kabul etti', 'kurulum'),
          son('bekle', 'dusunuyor', 'İşletme henüz karar vermedi', 'Karar bekleniyor', 'İşletmenin sorularını yetkili satış sorumlusuna iletin.', 'Karar gelince bu adıma dönün.'),
          son('bitir', 'red', 'İşletme sözleşmeyi istemediğini söyledi', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
    );
  } else {
    adimlar.push({
      id: 'satis', ad: 'Satış sonucunu izleyin', sorumlu: 'Satış ekibi',
      terimler: ['Sözleşme, işletme ile şirket arasındaki yazılı anlaşmadır.'],
      yap: [ 'Satış ekibi satışı ve sözleşmeyi fiyat tablosundaki fiyatla yürütür.', 'Siz işletmenin sorularını satış ekibine iletin.'],
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
      id: 'kurulum', ad: 'Kurulumu şirkete devredin', sorumlu: 'Siz ve kurulum ekibi', ek: 'plan',
      terimler: ['Kurulum, programın işletme için hazırlanıp açılmasıdır.'],
      yap: [ 'Siz devir notuna işletmenin ihtiyacını ve hazır ürün bilgisini yazın.', 'Kurulum ekibi işi devralır ve kurulumu yapar.', 'İşletme destek isterse siz onu şirketin destek ekibine yönlendirin.'],
      soru: 'Kurulum ekibi işi aldı mı?',
      secenekler: [
        devam('devraldi', 'Kurulum ekibi işi üstlendi', 'odeme'),
        son('bekle', 'tarih', 'Kurulum için tarih verilmedi', 'Kurulum tarihi bekleniyor', 'Operasyon yöneticisi kurulum kapasitesini doğrular.', 'İşletmeye kendiniz tarih vermeyin.', 'Tarih bildirilince bu adıma dönün.'),
      ],
    },
    odemeAdimi([yillikPaket(a), odemeMetni,
      `Bu örnekte şirket komisyonun ${yuzde(a.ilkOdeme)} kadarını ${a.ilkGun}. günde öder. Kalanını ${a.kalanGun}. günde öder. Günler müşterinin ödeme gününden sayılır.`]),
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
  const saticiBasi = aylikFiyat(a) * a.gelistirmeAy * a.gelistirmeOran;
  const [enCokAday, enAzHazir] = kuralSayilari(a, p, 'aday');
  const adayKurali = enCokAday && enAzHazir
    ? `Siz en çok ${enCokAday} aday satıcıyla başlarsınız. Bunlardan en az ${enAzHazir} satıcıyı satışa hazır hâle getirirsiniz.`
    : 'Ortaklık sorumlusu aday ve hazır satıcı sayısını program ekine yazar.';
  const oranGunu = kuralSayisi(a, p, 'Oran örnektir');
  const oranKurali = oranGunu
    ? `Bu oran örnektir. Finans sorumlusu oranı ${oranGunu}. günde kesinleştirir. Gün, müşterinin ödeme gününden sayılır.`
    : 'Bu oran örnektir. Finans sorumlusu oranı kesinleştirir.';
  const [kabulGunu, korumaGunu] = kuralSayilari(a, p, 'iş günü');
  const kabulKurali = kabulGunu && korumaGunu
    ? `Ortaklık sorumlusu bildirdiğiniz adayı ${kabulGunu} iş günü içinde yanıtlar. Şirket kabul edilen adayı ${korumaGunu} gün boyunca sizin adınıza korur.`
    : 'Ortaklık sorumlusu kabul ve koruma süresini yazılı bildirir.';
  return {
    baslik: 'Satıcı geliştirme ortağı',
    ozet: 'Aday satıcıları iStoc’ta satışa hazır hâle getirirsiniz.',
    hedef: 'Hazır sayılan satıcılar kabul edilsin ve komisyon dönemi izlensin.',
    ilk: 'ek',
    adimlar: [
      {
        id: 'ek', ad: 'Program ekini hazırlatın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        terimler: ['Program eki, anlaşmaya eklenen yazılı kurallardır.'],
        yap: [ adayKurali, 'Ortaklık sorumlusu hazır sayılma ölçütünü ekte yazar.'],
        soru: 'Program eki imzalandı mı?',
        secenekler: [
          devam('imza', 'Program ekini imzaladık', 'oran'),
          son('bekle', 'yok', 'Program eki henüz hazır değil', 'Program eki bekleniyor', 'Ortaklık sorumlusu ölçütü ve kabul eden kişiyi yazar.', 'Ek hazır olunca bu adıma dönün.'),
        ],
      },
      {
        id: 'oran', ad: 'Oranı kesinleştirin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        terimler: ['Oran, satıcının ödediği ücretten size düşen paydır.'],
        yap: [ oranKurali, aylikBedel(a),
          `Bu örnekte oran, satıcının ilk ${a.gelistirmeAy} aylık ücretinde ${yuzde(a.gelistirmeOran)} olur. Bir satıcıdan komisyonunuz ${tl(saticiBasi)} olur.`],
        soru: 'Oran size yazılı bildirildi mi?',
        secenekler: [
          devam('yazili', 'Finans sorumlusu oranı bana yazılı bildirdi', 'aday'),
          son('bekle', 'yok', 'Oran henüz belli olmadı', 'Oran bekleniyor', 'Finans sorumlusu oranı yazılı bildirir.', 'Oran gelmeden iş kabul etmeyin.', 'Bildirim gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'aday', ad: 'Aday satıcıları bildirin', sorumlu: 'Siz', ek: 'kitle',
        terimler: ['Aday satıcı, iStoc’ta satış yapmaya başlayabilecek firmadır.'],
        yap: [ 'Aday satıcıları ortaklık sorumlusuna bildirin.', kabulKurali],
        soru: 'Adaylar için ne yanıt aldınız?',
        secenekler: [
          devam('kabul', 'Adaylar kabul edildi', 'hazirlik'),
          son('bekle', 'yanit', 'Adaylar için henüz yanıt gelmedi', 'Kabul bekleniyor', 'Ortaklık sorumlusu adayları kontrol eder.', 'Yanıt gelince bu adıma dönün.'),
          son('bitir', 'red', 'Adaylar reddedildi', 'Bu adaylar için iş kapandı', 'Ret gerekçesini kayda yazın.', 'Yeni adayla bu rehberi baştan başlatın.'),
        ],
      },
      {
        id: 'hazirlik', ad: 'Satıcıyı hazırlayın', sorumlu: 'Siz',
        terimler: ['Ölçüt, satıcının hazır sayılması için gerekenlerin listesidir.', 'Görsel izni, ürün resimlerini kullanma iznidir.'],
        yap: [ 'Ürün bilgisini satıcının yetkilisine onaylatın.', 'Görsellerin sahibini satıcıyla yazılı belirleyin.'],
        soru: 'Satıcı satışa hazır mı?',
        secenekler: [
          devam('hazir', 'Satıcı ölçütteki her şeyi tamamladı', 'kabul'),
          son('bekle', 'eksik', 'Ürün bilgisi veya görsel izni eksik', 'Hazırlık sürüyor', 'Satıcının yetkilisi eksikleri tamamlar.', 'Eksikler tamamlanınca bu adıma dönün.'),
          son('bitir', 'birakti', 'Satıcı hazırlanmayı bıraktığını söyledi', 'Bu satıcı için iş kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'kabul', ad: 'Hazırlığı kabul ettirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: ['Siz hazırlık kanıtlarını ortaklık sorumlusuna gönderin.', 'Ortaklık sorumlusu hazırlığı ölçüte göre kontrol eder.'],
        soru: 'Ortaklık sorumlusu ne yanıt verdi?',
        secenekler: [
          devam('kabul', 'Hazırlık kabul edildi', 'odeme'),
          son('bekle', 'eksik', 'Ortaklık sorumlusu eksikleri bildirdi', 'Düzeltme bekleniyor', 'Bildirilen eksikleri satıcıyla tamamlayın.', 'Sonra kabul için yeniden başvurun.'),
        ],
      },
      odemeAdimi([`Şirket komisyonu satıcının ilk ${a.gelistirmeAy} aylık ücretinden hesaplar.`, 'Satıcı ödemeden komisyon kesinleşmez.']),
    ],
  };
}

function arzAkis(a: Ayar): IsAkisi {
  const p = 'arz';
  const esik = kuralSayisi(a, p, 'vitrin');
  return {
    baslik: 'Kurumsal satıcı getiren kurum',
    ozet: 'Kurumunuza bağlı satıcıları iStoc’a getirirsiniz. Bu programda nakit ödeme yoktur.',
    hedef: 'Üyeler kendi isteğiyle başvursun ve kurum sonuç raporunu alsın.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Kurumunuzu tanımlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'sinir',
        yap: ['Bu program satıcı üyeleri olan kurumlar içindir.', 'Bu programda şirket nakit ödeme yapmaz. Kurum ile şirket protokol imzalar.'],
        soru: 'Kurumunuz bu programa uyuyor mu?',
        secenekler: [
          devam('uygun', 'Kurumumuzun satıcı üyeleri var', 'protokol'),
          son('bitir', 'uye-yok', 'Satıcı üyemiz yok', 'Bu program uygun değil', 'Başka programı ortaklık sorumlusuyla konuşun.'),
          son('bitir', 'nakit', 'Nakit ödeme bekliyoruz', 'Bu program uygun değil', 'Bu programda nakit ödeme yoktur.', 'Ana programı ortaklık sorumlusuyla değerlendirin.'),
        ],
      },
      {
        id: 'protokol', ad: 'Protokolü imzalayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        terimler: ['Protokol, kurumunuzla şirket arasındaki yazılı anlaşmadır.', 'Taslak, henüz bitmemiş ilk metindir.'],
        yap: ['Ortaklık sorumlusu veri paylaşım sınırını protokole yazar.'],
        soru: 'Protokol imzalandı mı?',
        secenekler: [
          devam('imza', 'Protokol imzalandı', 'duyuru'),
          son('bekle', 'taslak', 'Protokol henüz taslak hâlinde', 'Protokol bekleniyor', 'Ortaklık sorumlusu taslağı tamamlar.', 'İmzadan sonra bu adıma dönün.'),
        ],
      },
      {
        id: 'duyuru', ad: 'Üyelere duyurun', sorumlu: 'Siz', ek: 'kitle',
        yap: ['Üye listesini topluca paylaşmayın.', 'İlgilenen üyeler kendileri başvursun.', 'Duyuruda tanıtım olduğunu belirtin.'],
        soru: 'Duyurudan sonra ne oldu?',
        secenekler: [
          devam('basvuru', 'Üyeler başvurmaya başladı', 'vitrin'),
          son('bekle', 'izin', 'Kurum yönetimi duyuruyu henüz onaylamadı', 'Kurum onayı bekleniyor', 'Kurum yönetimi duyuruyu onaylar.', 'Onay gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'vitrin', ad: 'Açılan mağaza sayısını izleyin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        terimler: ['Mağaza sayfası, satıcının iStoc’taki kendi sayfasıdır.'],
        yap: [ esik ? `Program, şirketin doğruladığı en az ${esik} mağaza sayfası açılınca başlar.` : 'Ortaklık sorumlusu programın başlaması için gereken mağaza sayısını yazılı bildirir.',
          'Şirket açılan mağaza sayfalarını kontrol eder.'],
        soru: 'Yeterli mağaza sayfası açıldı mı?',
        secenekler: [
          devam('esik', 'Gerekli sayıda mağaza sayfası açıldı', 'rapor'),
          son('bekle', 'az', 'Açılan mağaza sayfaları henüz yeterli değil', 'Yeni mağazalar bekleniyor', 'Kurumunuz yeni üye başvurularını desteklemeye devam etsin.', 'Ortaklık sorumlusu sayıyı yeniden kontrol eder.'),
        ],
      },
      {
        id: 'rapor', ad: 'Sonuç raporunu alın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kazanc',
        terimler: ['Sonuç raporu, üyelerin iStoc’taki sonuçlarını gösterir.'],
        yap: [ 'Ortaklık sorumlusu üyelerin sonuç raporunu üç ayda bir kurumunuza gönderir.', 'Raporda yalnız protokolde izin verilen bilgiler bulunur.'],
        soru: 'Sonuç raporu geldi mi?',
        secenekler: [
          son('tamamla', 'geldi', 'Sonuç raporunu aldık', 'Bu işin rehberi tamamlandı', 'Raporu protokoldeki veri sınırıyla kontrol edin.'),
          son('bekle', 'gelmedi', 'Rapor henüz gelmedi', 'Rapor bekleniyor', 'Ortaklık sorumlusu rapor tarihini bildirir.', 'Rapor tarihi gelince bu adıma dönün.'),
        ],
      },
    ],
  };
}

function talepAkis(a: Ayar): IsAkisi {
  const p = 'talep';
  const esik = kuralSayisi(a, p, 'başlaması için');
  const aylik = kuralSayisi(a, p, 'ayda en az');
  const [ilkPay, kalanPay] = kuralSayilari(a, p, 'Görev ücretinin');
  const ucretKurali = ilkPay && kalanPay
    ? `Şirket görev ücretinin %${ilkPay} kadarını kapsam kabul edilince öder. Kalan %${kalanPay} kadarını sonuç takibinde öder.` // sayi-yazimi: atla. Sayı kural metninden alınmış yazıdır.
    : 'Şirket görev ücretini iki parçada öder.';
  return {
    baslik: 'Alım talebi toplayan ortak',
    ozet: 'Alıcıların satın alma taleplerini iStoc’a getirirsiniz. Yalnız kayıt açtığınız için ücret almazsınız.',
    hedef: 'İzinli ve nitelikli talepler kabul edilsin ve sonuçları takip edilsin.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Rolünüzü netleştirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'sinir',
        yap: ['Şirket kayıt başına ödeme yapmaz.', 'Alıcılarla gerçek bir iş ilişkiniz olmalı.'],
        soru: 'Alıcılarla nasıl bir bağınız var?',
        secenekler: [
          devam('bag', 'Alıcılarla düzenli olarak iş yapıyoruz', 'kapsam'),
          son('bitir', 'kayit', 'Biz yalnız alıcı kaydı toplayabiliriz', 'Bu program uygun değil', 'Yalnız kayıt topladığınız için ücret almazsınız.'),
        ],
      },
      {
        id: 'kapsam', ad: 'Görev kapsamını yazın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        terimler: ['Görev kapsamı, yapacağınız işlerin yazılı listesidir.'],
        yap: [ ucretKurali, 'Şirket görev ücretinin tutarını henüz belirlemedi.'],
        soru: 'Görev ve ücret yazılı kabul edildi mi?',
        secenekler: [
          devam('kabul', 'Görev ve ücret yazılı olarak kabul edildi', 'izin'),
          son('bekle', 'ucret', 'Ücretin tutarı henüz yazılmadı', 'Ücret kararı bekleniyor', 'Finans sorumlusu tutarı yazılı bildirir.', 'Tutar gelmeden talep toplamayın.'),
        ],
      },
      {
        id: 'izin', ad: 'Alıcıdan izin alın', sorumlu: 'Siz',
        yap: ['Alıcının paylaşım iznini kayda yazın.', 'İzin yoksa talebi kimseyle paylaşmayın.'],
        soru: 'Alıcı ne dedi?',
        secenekler: [
          devam('izin', 'Alıcı talebini paylaşmama izin verdi', 'esik'),
          son('bitir', 'red', 'Alıcı paylaşım izni vermedi', 'Bu talep için iş kapandı', 'Talebi kimseyle paylaşmayın.', 'Ret kararını kayda yazın.'),
        ],
      },
      {
        id: 'esik', ad: 'Talep sayısını izleyin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        terimler: ['Talep, alıcının bir ürünü satın alma isteğidir.', 'Nitelikli talep, işe yarar ve gerçek bir alım isteğidir.'],
        yap: [ esik ? `Ortaklığınız en az ${esik} nitelikli talep gelince başlar.` : 'Ortaklık sorumlusu ortaklığın başlaması için gereken talep sayısını yazılı bildirir.',
          aylik ? `Siz ayda en az ${aylik} izinli alım talebi getirirsiniz.` : 'Ortaklık sorumlusu aylık talep sayısını yazılı bildirir.'],
        soru: 'Yeterli talep geldi mi?',
        secenekler: [
          devam('yeter', 'Gerekli sayıda nitelikli talep var', 'sonuc'),
          son('bekle', 'az', 'Talep sayısı henüz yeterli değil', 'Yeni talepler bekleniyor', 'Yeni izinli talepleri kayda ekleyin.', 'Ortaklık sorumlusu sayıyı yeniden kontrol eder.'),
        ],
      },
      {
        id: 'sonuc', ad: 'Sonucu takip edin', sorumlu: 'Siz ve finans sorumlusu (önerilen görev)', ek: 'kazanc',
        terimler: ['Fatura, aldığınız para için kestiğiniz resmi belgedir.'],
        yap: [ 'Her talebin sonucunu kayda yazın.', 'Şirket görev ücretinin kalanını sonuç takibinde öder.'],
        soru: 'Taleplerin sonucu belli oldu mu?',
        secenekler: [
          son('tamamla', 'kayitli', 'Sonuçları kaydettim ve faturamı kestim', 'Bu işin rehberi tamamlandı', 'Ödemeyi kendi kaydınızla karşılaştırın.'),
          son('bekle', 'belirsiz', 'Sonuç henüz belli değil', 'Sonuç bekleniyor', 'Alıcı kararını verince siz sonucu kayda yazın.'),
          itiraz,
        ],
      },
    ],
  };
}

function hizmetAkis(): IsAkisi {
  return {
    baslik: 'Onaylı hizmet ortağı',
    ozet: 'iStoc satıcılarına lojistik, ödeme veya benzeri hizmet sunarsınız.',
    hedef: 'Hizmetiniz onaylı biçimde sunulsun ve ödeme modeli yazılı olsun.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Hizmetinizi tanımlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: ['Bu program lojistik, ödeme, gümrük, kalite veya katalog hizmeti veren firmalar içindir.', 'Ortaklık sorumlusu hizmetinizin uygun olup olmadığını değerlendirir.'],
        soru: 'Hangi hizmeti veriyorsunuz?',
        secenekler: [
          devam('uygun', 'Bu hizmetlerden birini veriyoruz', 'model'),
          son('bekle', 'baska', 'Başka bir hizmet veriyoruz', 'Uygunluk inceleniyor', 'Ortaklık sorumlusu hizmetinizi değerlendirir.', 'Yanıt gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'model', ad: 'Ödeme modelini yazın', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        terimler: ['Ödeme modeli, size paranın nasıl ödeneceğini gösterir.'],
        yap: [ 'Bu programda gelir paylaşımı veya yönlendirme ücreti alırsınız.', 'Şirket oranı ve tutarı henüz belirlemedi.'],
        soru: 'Ödeme şekli ve tutarı yazıldı mı?',
        secenekler: [
          devam('yazili', 'Ödeme şekli ve tutar yazılı kabul edildi', 'rozet'),
          son('bekle', 'yok', 'Tutar henüz belirlenmedi', 'Ödeme kararı bekleniyor', 'Finans sorumlusu modeli ve tutarı yazar.', 'Tutar gelmeden hizmete başlamayın.'),
        ],
      },
      {
        id: 'rozet', ad: 'Rozet iznini alın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'sinir',
        terimler: ['Rozet, hizmetinizin iStoc onaylı olduğunu gösteren işarettir.'],
        yap: ['Ortaklık sorumlusu hizmet sorumluluğunu anlaşmaya yazar.', 'Siz “iStoc Onaylı Hizmet” rozetini yalnız izin verilen biçimde kullanın.'],
        soru: 'Rozeti kullanma izni aldınız mı?',
        secenekler: [
          devam('izin', 'Rozet iznini yazılı olarak aldık', 'is'),
          son('bekle', 'yok', 'İzin henüz verilmedi', 'Rozet izni bekleniyor', 'Ortaklık sorumlusu izni yazılı verir.', 'İzin gelmeden rozeti kullanmayın.'),
        ],
      },
      {
        id: 'is', ad: 'İlk hizmeti verin', sorumlu: 'Siz',
        yap: ['Hizmeti satıcıya iStoc üzerinden sunun.', 'Hizmet sonucunu kayda yazın.'],
        soru: 'İlk hizmet nasıl sonuçlandı?',
        secenekler: [
          devam('tamam', 'Hizmeti verdik ve sonucu kaydettik', 'odeme'),
          son('bitir', 'vazgecti', 'Satıcı hizmetten vazgeçti', 'Bu iş kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      odemeAdimi(['Şirket ödemeyi yazılı ödeme modeline göre yapar.', 'Satıcı ödemeden gelir payınız kesinleşmez.']),
    ],
  };
}

function teknolojiAkis(): IsAkisi {
  return {
    baslik: 'Teknoloji ortağı',
    ozet: 'Yazılımınızı iStoc’a doğrudan bağlarsınız. Kataloglar otomatik eşitlenir.',
    hedef: 'Bağlantı doğrulansın. Birlikte yapılacak tanıtım yazılı bir plana bağlansın.',
    ilk: 'baslangic',
    adimlar: [
      {
        id: 'baslangic', ad: 'Başlangıcı doğrulayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: ['Bu program ilk dönemde açılmaz. Şirket programı ikinci aşamada başlatır.', 'Ortaklık sorumlusu başlangıcı size yazılı bildirir.'],
        soru: 'Programın başladığı size bildirildi mi?',
        secenekler: [
          devam('basladi', 'Programın başladığı yazılı bildirildi', 'teknik'),
          son('bekle', 'yok', 'Başlangıç için henüz bildirim gelmedi', 'Program başlamadı', 'Ortaklık sorumlusu başlangıcı yazılı bildirir.', 'Başlangıç bildirilene kadar müşteriye bağlantı sözü vermeyin.'),
        ],
      },
      {
        id: 'teknik', ad: 'Bağlantıyı doğrulatın', sorumlu: 'Teknik ekip',
        terimler: ['Bağlantı, yazılımınızın iStoc ile bilgi alışverişidir.'],
        yap: [ 'Teknik ekip yazılım bağlantısını test eder.', 'Siz katalog eşitlemesini teknik ekiple örnek veriyle deneyin.'],
        soru: 'Teknik ekip ne dedi?',
        secenekler: [
          devam('kabul', 'Teknik ekip bağlantıyı kabul etti', 'indirim'),
          son('bekle', 'suruyor', 'Teknik ekip incelemenin sürdüğünü söyledi', 'Teknik sonuç bekleniyor', 'Teknik ekip sonucu yazılı bildirir.'),
          son('bitir', 'uygun-degil', 'Teknik ekip bağlantıyı uygun bulmadı', 'Bu program kapandı', 'Teknik gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'indirim', ad: 'Ticari koşulları yazın', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'anlasma',
        terimler: ['Ticari koşullar, ortaklıktaki para ve ödeme kurallarıdır.'],
        yap: [ 'Finans sorumlusu ortaklığın ticari koşullarını anlaşmaya yazar.', 'Siz müşterilere indirim sözü vermeyin. Müşteri fiyat tablosundaki fiyatı öder.'],
        soru: 'Ticari koşullar yazıldı mı?',
        secenekler: [
          devam('yazili', 'Ticari koşullar yazılı anlaşmaya girdi', 'tanitim'),
          son('bekle', 'yok', 'Koşullar henüz yazılmadı', 'Ticari koşullar bekleniyor', 'Finans sorumlusu koşulları yazılı bildirir.', 'Koşullar yazılınca bu adıma dönün.'),
        ],
      },
      {
        id: 'tanitim', ad: 'Ortak tanıtımı planlayın', sorumlu: 'Siz ve pazarlama sorumlusu (önerilen görev)',
        yap: ['Tanıtımda reklam olduğunu açıkça belirtin.', 'Doğrulanmayan özellik anlatmayın.', 'Tanıtımda fiyat tablosundaki fiyatı kullanın. İndirim duyurmayın.'],
        soru: 'Tanıtım planı hazır mı?',
        secenekler: [
          son('tamamla', 'hazir', 'Ortak tanıtım planı hazır', 'Bu işin rehberi tamamlandı', 'Planı ve onayı kayda ekleyin.'),
          son('bekle', 'yok', 'Plan henüz hazır değil', 'Plan bekleniyor', 'Pazarlama sorumlusu taslağı hazırlar.', 'Taslak gelince bu adıma dönün.'),
        ],
      },
    ],
  };
}

function bolgeAkis(a: Ayar): IsAkisi {
  const p = 'bolge';
  const baslangicAyi = kuralSayisi(a, p, 'başlar');
  const baslangicKurali = baslangicAyi
    ? `Bu ortaklık en erken ${baslangicAyi}. aydan sonra başlar. Şirket önce pazarın çalıştığını kanıtlar.`
    : 'Şirket önce pazarın çalıştığını kanıtlar. Program bundan sonra başlar.';
  return {
    baslik: 'Bölge temsilcisi',
    ozet: 'Belirli bir bölgede iStoc satıcı ağı kurarsınız. Şirket size tek yetkili olma hakkı vermez.',
    hedef: 'Program başladığında aktif satıcılar kayıtlı ve doğrulanmış olsun.',
    ilk: 'baslangic',
    adimlar: [
      {
        id: 'baslangic', ad: 'Başlangıcı doğrulayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: [baslangicKurali, 'Ayların hangi tarihten sayılacağını ortaklık sorumlusu yazılı bildirir.'],
        soru: 'Programın başladığı size bildirildi mi?',
        secenekler: [
          devam('basladi', 'Programın başladığı yazılı bildirildi', 'yetki'),
          son('bekle', 'yok', 'Başlangıç için henüz bildirim gelmedi', 'Program başlamadı', 'Şirket pazar kanıtını değerlendirir.', 'Başlangıç bildirilene kadar bölge yetkisi vaat etmeyin.'),
        ],
      },
      {
        id: 'yetki', ad: 'Bölge kapsamını yazın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'sinir',
        yap: ['Ortaklık sorumlusu bölge sınırını yazılı belirler.', 'Şirket size tek yetkili olma hakkı vermez.'],
        soru: 'Bölge sınırı yazılı mı?',
        secenekler: [
          devam('yazili', 'Bölge sınırı yazılı olarak belirlendi', 'odeme-model'),
          son('bekle', 'belirsiz', 'Bölge sınırı henüz belli değil', 'Bölge kararı bekleniyor', 'Ortaklık sorumlusu sınırı yazılı bildirir.'),
        ],
      },
      {
        id: 'odeme-model', ad: 'Ödemeyi netleştirin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: ['Bu programda aktif satıcı başına ödeme ve işlem payı alırsınız.', 'Şirket bu tutarları henüz belirlemedi.'],
        soru: 'Ödeme tutarları yazıldı mı?',
        secenekler: [
          devam('yazili', 'Tutarlar yazılı kabul edildi', 'satici'),
          son('bekle', 'yok', 'Tutarlar henüz belirlenmedi', 'Ödeme kararı bekleniyor', 'Finans sorumlusu tutarları yazar.', 'Tutar gelmeden satıcı toplamayın.'),
        ],
      },
      {
        id: 'satici', ad: 'Satıcıları bildirin', sorumlu: 'Siz', ek: 'kitle',
        yap: ['Satıcıları ortaklık sorumlusuna bildirin.', 'Mesaj göndermeden önce kişinin iznini kontrol edin.', `Satıcı fiyat tablosundaki fiyatı öder. Aylık bedel ${avro(a.istocAyEur)} olur.`],
        soru: 'Bildirdiğiniz satıcılar kabul edildi mi?',
        secenekler: [
          devam('kabul', 'Satıcılar kabul edildi', 'aktif'),
          son('bekle', 'yanit', 'Satıcılar için henüz yanıt gelmedi', 'Kabul bekleniyor', 'Ortaklık sorumlusu kayıtları kontrol eder.'),
        ],
      },
      {
        id: 'aktif', ad: 'Aktif satıcıları izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)',
        terimler: ['Aktif satıcı, finans sorumlusunun ölçütüne uyan satıcıdır.', 'Fatura, aldığınız para için kestiğiniz resmi belgedir.'],
        yap: [ 'Finans sorumlusu aktif sayılma ölçütünü yazılı bildirir.', 'Siz aktif satıcı listesini ayda bir kendi listenizle karşılaştırın.'],
        soru: 'Aktif satıcılarda ne oldu?',
        secenekler: [
          son('tamamla', 'kayitli', 'Aktif satıcılar kayıtlı ve faturamı kestim', 'Bu işin rehberi tamamlandı', 'Ödemeyi kendi listenizle karşılaştırın.'),
          son('bekle', 'olcut', 'Aktif sayılma ölçütü henüz belli değil', 'Ölçüt bekleniyor', 'Finans sorumlusu ölçütü yazılı bildirir.'),
          itiraz,
        ],
      },
    ],
  };
}

const akisOlusturTam: AkisOlustur = (a) => {
  switch (seciliKosul(a, 'cozum').id) {
    case 'gelistirme': return gelistirmeAkis(a);
    case 'arz': return arzAkis(a);
    case 'talep': return talepAkis(a);
    case 'hizmet': return hizmetAkis();
    case 'teknoloji': return teknolojiAkis();
    case 'bolge': return bolgeAkis(a);
    default: return anaAkis(a);
  }
};

/** Rehberde belge adımları sorulmaz (motor.ts → belgeAdimlariniCikar). */
export const akisOlustur: AkisOlustur = (a) => belgeAdimlariniCikar(akisOlusturTam(a));
