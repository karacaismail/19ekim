import type { AkisAdimi, AkisOlustur, AkisSecenegi, IsAkisi } from '../types';
import { cozumKazanci, segikaAylik, type Ayar, type SegikaPaket } from '../../satisOrtakligi';
import { kosulSonucu, seciliKosul, affilateHesabi } from '../../kosullar';

const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n))} TL`;
const yuzde = (n: number) => `yüzde ${sayi(n * 100)}`;

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const son = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, ...aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

function sonucu(a: Ayar, program: string) {
  return kosulSonucu({ ...a, kosul: { ...a.kosul, cozum: program } }, 'cozum');
}
/** Seçili programın kaynak kuralı. Bulunamazsa sayısız genel cümle döner. */
function kural(a: Ayar, program: string, anahtar: string, yedek: string): string {
  return sonucu(a, program)?.kurallar.find((k) => k.includes(anahtar)) ?? yedek;
}

const PAKET: Record<SegikaPaket, string> = {
  ikisi: 'teşvik ve otomasyon paketi',
  tesvik: 'Sosyal Güvenlik Kurumu teşvik paketi',
  otomasyon: 'Sosyal Güvenlik Kurumu otomasyon paketi',
};

const itiraz = son('bekle', 'itiraz', 'Tutara itirazım var', 'İtiraz inceleniyor',
  'Finans sorumlusu destek kayıtlarını ve tahsilatı inceler.',
  'Karar kabul edilen sözleşmeye göre yazılı açıklanır.',
  'Yazılı yanıt gelince bu adıma dönün.');

function baslangicAdimi(sonraki: string, aciklama: string): AkisAdimi {
  return {
    id: 'baslangic', ad: 'Başlangıcı doğrulayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
    yap: ['Bu program ikinci dalgada başlar.', aciklama, 'Başlangıcı ortaklık sorumlusu yazılı bildirir.'],
    soru: 'Program başlangıcı bildirildi mi?',
    secenekler: [
      devam('basladi', 'Başlangıç yazılı bildirildi', sonraki),
      son('bekle', 'yok', 'Başlangıç henüz bildirilmedi', 'Program başlamadı',
        'Şirket başlangıç tarihini henüz bildirmedi.', 'Ortaklık sorumlusu tarihi yazılı bildirir.', 'O zamana kadar bu programla teklif vermeyin.'),
    ],
  };
}

function kayitAdimi(a: Ayar, program: string, sonraki: string): AkisAdimi {
  return {
    id: 'kayit', ad: 'İşvereni kaydettirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kitle',
    yap: ['İşvereni ortaklık sorumlusuna bildirin.', 'Kayda çalışan sayısını ve istenen paketi yazın.',
      program === 'ana' ? 'Her firma yalnız bir ortağa yazılır.' : kural(a, program, 'korunur', 'Her firma yalnız bir ortağa yazılır.')],
    soru: 'Kayıt sonucu ne oldu?',
    secenekler: [
      devam('acik', 'Kayıt benim adıma açıldı', sonraki),
      son('bitir', 'baska', 'İşveren başka ortağa kayıtlı', 'Bu işveren için iş kapandı',
        'Kayıt başka ortakta olduğu için görüşmeye başlamayın.', 'Karara itirazınız varsa ortaklık sorumlusuna yazın.'),
      son('bekle', 'yanit', 'Kayıt yanıtı gelmedi', 'Kayıt yanıtı bekleniyor',
        'Ortaklık sorumlusu kaydı kontrol eder.', 'Yanıt gelene kadar işvereni kendinize ait saymayın.'),
    ],
  };
}

function anaAkis(a: Ayar): IsAkisi {
  const fiyat = segikaAylik(a);
  const ekGider = a.ekEgitimSaat * a.egitimSaatUcret;
  const odemeMetni = a.model === 'oran'
    ? `Komisyon yıllık paket bedelinin ${yuzde(a.cozumOran)} oranıdır.`
    : 'Seçili ayarda satış başına sabit tutar ödenir.';
  const egitim: AkisAdimi = ekGider > 0
    ? {
        id: 'egitim', ad: 'Ek eğitimi onaylatın', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [`Yılda ${sayi(a.egitimSaat)} saat program eğitimi ücretsizdir.`,
          `Seçili ayarda ${sayi(a.ekEgitimSaat)} saat ek eğitim ${tl(ekGider)} tutar.`,
          'Hesaplayıcı bu gideri kazancınızdan düşer.'],
        soru: 'Ek eğitim gideri ne durumda?',
        secenekler: [
          devam('kabul', 'Ek eğitim giderini yazılı kabul ettim', 'odeme'),
          devam('istemiyorum', 'Ek eğitim istemiyorum', 'odeme'),
          son('bekle', 'onay', 'Gider henüz onaylanmadı', 'Eğitim onayı bekleniyor',
            'Finans sorumlusu gideri ve düşüm yöntemini yazmalı.', 'Onay gelmeden eğitim siparişi vermeyin.', 'Onay gelince bu adıma dönün.'),
        ],
      }
    : {
        id: 'egitim', ad: 'Ücretsiz eğitimi planlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [`Yılda ${sayi(a.egitimSaat)} saat program eğitimi ücretsizdir.`, 'Fazlası ücretlidir. Ek eğitimi önceden onaylatın.'],
        soru: 'Eğitim planı ne durumda?',
        secenekler: [
          devam('plan', 'Eğitim tarihi planlandı', 'odeme'),
          son('bekle', 'tarih', 'Eğitim tarihi yok', 'Eğitim tarihi bekleniyor', 'Ortaklık sorumlusu tarih önerir.', 'Tarih kesinleşince bu adıma dönün.'),
        ],
      };
  return {
    baslik: 'Desteği veren danışman',
    ozet: 'Hizmet verdiğiniz işverene Segika’yı önerirsiniz. Müşteri desteğini siz verirsiniz.',
    hedef: 'İşveren doğru paketi alsın, desteği kayıtlı olsun ve komisyonunuz izlensin.',
    ilk: 'anlasma',
    adimlar: [
      {
        id: 'anlasma', ad: 'Destek anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Müşteri desteğini sizin vereceğinizi yazın.', 'Destek kapsamını ve yedek sorumluyu belirleyin.', 'Müşteri takip sistemini şirket sağlar.'],
        soru: 'Ortaklık anlaşmanız ne durumda?',
        secenekler: [
          devam('var', 'Yazılı anlaşmam var', 'meslek'),
          son('bekle', 'yok', 'Henüz anlaşma yok', 'Anlaşma bekleniyor',
            'Ortaklık sorumlusu destek kapsamını ve ödemeyi yazmalı.', 'Bu sırada işverene ortaklıktan söz etmeyin.'),
        ],
      },
      {
        id: 'meslek', ad: 'Meslek kurallarını kontrol edin', sorumlu: 'Hukuk danışmanı (önerilen görev)', ek: 'sinir',
        yap: ['Mali müşavir ve avukat meslek kurallarına bağlıdır.',
          a.musavirModel === 'indirim' ? 'Hesaplayıcı mali müşavir için müşteri indirimi seçeneğini gösterir.' : 'Hesaplayıcı mali müşavir için komisyon seçeneğini gösterir.',
          'Bu seçenek komisyonunuzla kendiliğinden birleşmez.'],
        soru: 'Meslek kuralı değerlendirmesi ne durumda?',
        secenekler: [
          devam('uygun', 'Uzman engel olmadığını yazdı', 'kayit'),
          devam('gerekmez', 'Düzenlenmiş bir meslekte değilim', 'kayit'),
          son('bekle', 'bekliyor', 'Uzman görüşü bekleniyor', 'Meslek görüşü bekleniyor', 'Hukuk danışmanı uygunluğu yazılı bildirir.', 'Görüş gelmeden komisyon sözü vermeyin.'),
          son('bitir', 'engel', 'Kural komisyonu engelliyor', 'Ana program uygun değil', 'Uygun programı ortaklık sorumlusuyla seçin.'),
        ],
      },
      kayitAdimi(a, 'ana', 'ihtiyac'),
      {
        id: 'ihtiyac', ad: 'Teşvik ve bordro ihtiyacını konuşun', sorumlu: 'Siz',
        yap: ['Teşvik takibini ve bordro adımlarını sorun.', 'İleti için uygun dayanağınız olsun.'],
        soru: 'İşveren ne dedi?',
        secenekler: [
          devam('var', 'Teşvik veya bordro ihtiyacı var', 'gosterim'),
          son('bitir', 'ilgisiz', 'İşveren ilgilenmiyor', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
          son('bitir', 'ileti', 'İşveren ileti istemiyor', 'İletişim durduruldu', 'Yeni ileti göndermeyin.'),
        ],
      },
      {
        id: 'gosterim', ad: 'Ürün gösterimi yapın', sorumlu: 'Siz',
        yap: ['Gerçek çalışan bilgisi kullanmayın.', `Seçili ayar ${PAKET[a.segikaPaket]} kullanır.`,
          `Fiyat ${sayi(fiyat.kisi)} çalışanlık bloktan hesaplanır.`],
        dikkat: 'Çalışan sayısı aynı blok içinde değişirse fiyat değişmeyebilir.',
        soru: 'Gösterimden sonra durum nedir?',
        secenekler: [
          devam('teklif', 'İşveren teklif istedi', 'teklif'),
          son('bekle', 'gercek', 'İşveren gerçek veriyle görmek istiyor', 'Veri dayanağı bekleniyor',
            'Hukuk danışmanı veri dayanağını değerlendirmeli.', 'Dayanak yazılmadan çalışan verisi almayın.'),
          son('bitir', 'vazgecti', 'İşveren vazgeçti', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'teklif', ad: 'Onaylı teklif ve sözleşme', sorumlu: 'Yetkili satış sorumlusu',
        yap: ['Teklifi yetkili satış sorumlusu onaylar.', 'Fiyatı kendiniz değiştirmeyin.', 'Kendi hizmet bedelinizi ayrı gösterin.'],
        soru: 'Teklif ne durumda?',
        secenekler: [
          devam('kabul', 'İşveren sözleşmeyi kabul etti', 'egitim'),
          son('bekle', 'onay', 'Teklif onayı bekleniyor', 'Teklif bekleniyor', 'Yetkili satış sorumlusu teklifi hazırlar.'),
          son('bitir', 'red', 'İşveren teklifi reddetti', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      egitim,
      {
        id: 'odeme', ad: 'Desteği verin ve ödemeyi izleyin', sorumlu: 'Siz ve finans sorumlusu', ek: 'kazanc',
        yap: [odemeMetni, `Seçili ayarda müşteri başına örnek komisyon ${tl(cozumKazanci(a))} olur.`, 'Destek kayıtlarınızı hakediş dökümüyle karşılaştırın.'],
        soru: 'Destek ve ödeme durumunuz nedir?',
        secenekler: [
          son('tamamla', 'odendi', 'Müşteri ödedi, faturamı kestim', 'Bu işin rehberi tamamlandı',
            'Desteği kayıtlı biçimde sürdürün.', 'Vergi uygulamasını mali müşaviriniz doğrulasın.'),
          son('bekle', 'odemedi', 'Müşteri henüz ödemedi', 'Tahsilat bekleniyor', 'Müşteri ödemeden komisyon kesinleşmez.', 'Finans sorumlusu tahsilatı izler.'),
          son('bekle', 'kapasite', 'Destek yükünü karşılayamıyorum', 'Destek devri gerekiyor',
            'Ortaklık sorumlusuna açık işleri bildirin.', 'Devir planı kabul edilmeden yeni destek sözü vermeyin.'),
          itiraz,
        ],
      },
    ],
  };
}

const POLITIKA: Record<Ayar['affPolitika']['cozum'], string> = {
  tahsilatta: 'Hesaplayıcı komisyonu tahsilat ayında kazanılmış ve ödenmiş gösterir.',
  'hizmet-ayi': 'Hesaplayıcı komisyonu her hizmet ayının sonunda gösterir.',
  'tahsilatta-taksit': 'Hesaplayıcı komisyonu tahsilatta kazanılmış, taksitle ödenmiş gösterir.',
};

function yillaraAkis(a: Ayar): IsAkisi {
  const s = affilateHesabi(a, 'cozum');
  const toplam = s.ortaklar.reduce((n, o) => n + o.planlanan, 0) / 100;
  const hizmetAyi = a.affPolitika.cozum === 'hizmet-ayi';
  return {
    baslik: 'Yıllara yayılan destek ortağı',
    ozet: 'Desteği siz verirsiniz. Komisyon destek verdiğiniz aylara göre yıllara yayılır.',
    hedef: 'Her ayın desteği kayıtlı olsun ve dönem komisyonu doğru izlensin.',
    ilk: 'anlasma',
    adimlar: [
      {
        id: 'anlasma', ad: 'Program anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Bu program desteği kendisi veren ortak içindir.', 'Destek sayılacak kaydı yazılı belirleyin.'],
        soru: 'Program anlaşması ne durumda?',
        secenekler: [
          devam('var', 'Yazılı program anlaşması var', 'kayit'),
          son('bekle', 'yok', 'Henüz anlaşma yok', 'Anlaşma bekleniyor', 'Ortaklık sorumlusu destek ölçütünü yazar.', 'Metin hazır olunca bu adıma dönün.'),
        ],
      },
      kayitAdimi(a, 'ana', 'sozlesme'),
      {
        id: 'sozlesme', ad: 'Müşteri sözleşmesi', sorumlu: 'Yetkili satış sorumlusu', ek: 'sinir',
        yap: ['Teklifi yetkili satış sorumlusu onaylar.', 'Destek kapsamınızı sözleşme ekine yazın.'],
        soru: 'İşveren sözleşmeyi ne yaptı?',
        secenekler: [
          devam('kabul', 'İşveren sözleşmeyi kabul etti', 'bicim'),
          son('bekle', 'karar', 'İşveren henüz karar vermedi', 'Karar bekleniyor', 'Sorularını yetkili satış sorumlusuna iletin.'),
          son('bitir', 'red', 'İşveren reddetti', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'bicim', ad: 'Ödeme biçimini netleştirin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [a.affOdeme === 'paket' ? 'Hesaplayıcı müşterinin yıllık paketi peşin ödediğini varsayar.' : 'Hesaplayıcı müşterinin aylık ödediğini varsayar.',
          POLITIKA[a.affPolitika.cozum]],
        dikkat: hizmetAyi ? undefined : 'Seçili ödeme biçimi destek ayı kuralını hesaba katmayabilir.',
        soru: 'Ödeme biçimi sözleşmede nasıl yazıldı?',
        secenekler: hizmetAyi
          ? [
              devam('yazili', 'Ödeme biçimi sözleşmede yazılı', 'destek'),
              son('bekle', 'yok', 'Ödeme biçimi yazılmadı', 'Ödeme biçimi bekleniyor', 'Finans sorumlusu biçimi sözleşmeye yazar.'),
            ]
          : [
              devam('karar', 'Finans geçerli kuralı yazılı bildirdi', 'destek'),
              son('bekle', 'celiski', 'Destek ayı kuralı ile çelişki çözülmedi', 'Kural kararı bekleniyor',
                'Finans sorumlusu hangi kuralın geçerli olduğunu yazmalı.', 'Karar gelince bu adıma dönün.'),
            ],
      },
      {
        id: 'destek', ad: 'Her ay desteği kaydedin', sorumlu: 'Siz',
        yap: ['Destek vermediğiniz ay için komisyon doğmaz.', 'Destek kaydında konu ve çözüm durumunu tutun.'],
        soru: 'Bu ayın destek durumu nedir?',
        secenekler: [
          devam('verdim', 'Bu ay destek verdim, kayıt var', 'odeme'),
          son('bekle', 'veremedim', 'Bu ay destek veremedim', 'Bu ay komisyon doğmaz',
            'Ortaklık sorumlusuna durumu bildirin.', 'Gerekirse devir planı yapılır.', 'Sonraki ay bu adıma dönün.'),
          son('bekle', 'olcut', 'Destek ölçütü yazılı değil', 'Ölçüt bekleniyor', 'Ortaklık sorumlusu ölçütü yazılı bildirir.'),
        ],
      },
      {
        id: 'odeme', ad: 'Dönem komisyonunu izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [!s.hatalar.length ? `Bir müşteri için ${a.affUfukAy} aylık örnek kazanç ${tl(toplam)} olur.` : 'Örnek kazanç hesaplayıcıdadır.',
          'Bu tutar örnektir. Kazanılmış hak sayılmaz.', 'Müşteri ödemezse komisyon doğmaz.'],
        soru: 'Bu dönemin ödeme durumu nedir?',
        secenekler: [
          son('tamamla', 'odendi', 'Dönem ödemesi geldi, faturamı kestim', 'Bu dönemin rehberi tamamlandı', 'Sonraki ay destek kaydına dönün.'),
          son('bekle', 'odemedi', 'Müşteri henüz ödemedi', 'Tahsilat bekleniyor', 'Finans sorumlusu tahsilatı izler.'),
          itiraz,
        ],
      },
    ],
  };
}

function yonlendirmeAkis(a: Ayar): IsAkisi {
  const p = 'yonlendirme';
  return {
    baslik: 'Yönlendirme ortağı',
    ozet: 'İşvereni yalnız şirketin satış ekibine yönlendirirsiniz. Teklif ve tahsilatı şirket yapar.',
    hedef: 'Yönlendirme kayıtlı olsun ve ödenen aylar doğru izlensin.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Uygunluğu doğrulatın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'sinir',
        yap: [kural(a, p, 'Ortak puanı', 'Ortak puanı ve ortak sayısı sınırlıdır.'), kural(a, p, 'fiyatı değiştiremez', 'Fiyatı değiştiremez ve tahsilat yapamazsınız.')],
        soru: 'Uygunluk değerlendirmesi ne durumda?',
        secenekler: [
          devam('uygun', 'Uygunluğum yazılı bildirildi', 'kayit'),
          son('bekle', 'suruyor', 'Değerlendirme sürüyor', 'Uygunluk bekleniyor', 'Ortaklık sorumlusu puanınızı değerlendirir.'),
          son('bitir', 'dolu', 'Ortak kontenjanı dolu', 'Bu program şu an kapalı', 'Ana programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      kayitAdimi(a, p, 'yonlendir'),
      {
        id: 'yonlendir', ad: 'Satış ekibine yönlendirin', sorumlu: 'Siz ve satış ekibi',
        yap: ['İşvereni satış ekibiyle tanıştırın.', 'Teklif ve fiyat konuşmayın.'],
        soru: 'Yönlendirme nasıl sonuçlandı?',
        secenekler: [
          devam('devraldi', 'Satış ekibi işvereni devraldı', 'destek'),
          son('bekle', 'erteleme', 'İşveren görüşmeyi erteledi', 'Görüşme bekleniyor', 'Satış ekibi yeni tarihi kararlaştırır.'),
          son('bitir', 'ilgisiz', 'İşveren ilgilenmiyor', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'destek', ad: 'Destek sorumlusunu netleştirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Bu programda destek sorumlusu kaynakta yazılı değildir.', 'Destek kimdeyse sözleşmeye yazın.'],
        soru: 'Destek sorumlusu belli mi?',
        secenekler: [
          devam('yazili', 'Destek sorumlusu yazılı belirlendi', 'aylar'),
          son('bekle', 'belirsiz', 'Destek sorumlusu belirsiz', 'Destek kararı bekleniyor', 'Ortaklık sorumlusu destek sorumlusunu yazar.', 'Karar gelmeden destek sözü vermeyin.'),
        ],
      },
      {
        id: 'aylar', ad: 'Ödenen ayları izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)',
        yap: [`Komisyon müşterinin ödediği ilk ${sayi(a.yonlendirmeAy)} aydan hesaplanır.`, kural(a, p, 'Ücretsiz aylar', 'Ücretsiz aylar sayılmaz.')],
        soru: 'Müşterinin ödeme durumu nedir?',
        secenekler: [
          devam('basladi', 'Müşteri aylık ödemeye başladı', 'odeme'),
          son('bekle', 'ucretsiz', 'Müşteri ücretsiz dönemde', 'Ödenen ay bekleniyor', 'Ücretsiz aylar komisyona girmez.', 'İlk ödemeden sonra bu adıma dönün.'),
          son('bekle', 'yok', 'Müşteri hiç ödeme yapmadı', 'Tahsilat bekleniyor', 'Finans sorumlusu tahsilatı izler.'),
        ],
      },
      {
        id: 'odeme', ad: 'Komisyonu izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [kural(a, p, 'net tahsilat', 'Komisyon uygun net tahsilattan hesaplanır.'), kural(a, p, 'Ödeme, takip eden', 'Ödeme günü program koşullarındadır.')],
        soru: 'Komisyon ödemesi ne durumda?',
        secenekler: [
          son('tamamla', 'odendi', 'Komisyon geldi, faturamı kestim', 'Bu işin rehberi tamamlandı', 'Ödemeyi kendi kaydınızla karşılaştırın.'),
          son('bekle', 'gelmedi', 'Komisyon henüz gelmedi', 'Ödeme bekleniyor', 'Finans sorumlusu ödeme gününü bildirir.'),
          itiraz,
        ],
      },
    ],
  };
}

function smmmAkis(a: Ayar): IsAkisi {
  const p = 'smmm';
  const s = sonucu(a, p);
  return {
    baslik: 'Mali müşavir ofisi',
    ozet: 'Bordro hizmeti veren ofis Segika’yı toptan fiyatla kullanır. Nakit komisyon yoktur.',
    hedef: 'Ofisin seviyesi kanıtla belirlensin ve toptan fiyat yazılı olsun.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Ofis koşullarını kontrol edin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: [kural(a, p, 'bordro hizmeti vermeli', 'Ofis bordro hizmeti vermeli ve sertifika eğitimini bitirmelidir.')],
        soru: 'Ofisiniz bu koşulları sağlıyor mu?',
        secenekler: [
          devam('sagliyor', 'Bütün koşulları sağlıyoruz', 'model'),
          son('bekle', 'egitim', 'Sertifika eğitimi bitmedi', 'Eğitim bekleniyor', 'Ofis sertifika eğitimini tamamlar.', 'Sonra bu adıma dönün.'),
          son('bitir', 'bordro-yok', 'Bordro hizmeti vermiyoruz', 'Bu program uygun değil', 'Başka programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      {
        id: 'model', ad: 'Ödeme modelini anlayın', sorumlu: 'Siz', ek: 'sinir',
        yap: [kural(a, p, 'nakit, hediye', 'Bu modelde nakit, hediye veya indirim verilmez.'), 'Ofis toptan fiyattan yararlanır.'],
        soru: 'Bu model size uyuyor mu?',
        secenekler: [
          devam('kabul', 'Toptan fiyat modelini kabul ediyoruz', 'meslek'),
          son('bitir', 'nakit', 'Komisyon veya indirim istiyoruz', 'Bu program uygun değil', 'Ana programı ortaklık sorumlusuyla değerlendirin.', 'İki model birlikte uygulanmaz.'),
        ],
      },
      {
        id: 'meslek', ad: 'Meslek kurallarını kontrol edin', sorumlu: 'Hukuk danışmanı (önerilen görev)',
        yap: ['Mali müşavirlik meslek kuralları ayrıca değerlendirilir.', 'Uygunluk otomatik doğrulanmaz.'],
        soru: 'Meslek değerlendirmesi ne durumda?',
        secenekler: [
          devam('uygun', 'Uzman engel olmadığını yazdı', 'seviye'),
          son('bekle', 'bekliyor', 'Uzman görüşü bekleniyor', 'Meslek görüşü bekleniyor', 'Hukuk danışmanı görüşünü yazılı bildirir.'),
        ],
      },
      {
        id: 'seviye', ad: 'Seviyenizi belirleyin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [s ? `Seçili ayarda ${sayi(a.smmmMukellef)} aktif mükellefle seviye ${s.deger} olur.` : 'Seviye aktif mükellef sayısına göre belirlenir.',
          'Aktif mükellef sayısının kanıtını yazılı belirleyin.'],
        soru: 'Mükellef sayısı nasıl kanıtlandı?',
        secenekler: [
          devam('kanit', 'Mükellef sayısını kayıtla gösterdik', 'veri'),
          son('bekle', 'olcut', 'Kanıt türü belirlenmedi', 'Kanıt kararı bekleniyor', 'Ortaklık sorumlusu kanıt türünü yazar.'),
        ],
      },
      {
        id: 'veri', ad: 'Mükellef verisinin dayanağı', sorumlu: 'Hukuk danışmanı (önerilen görev)', ek: 'anlasma',
        yap: ['Mükellef verisini dayanak olmadan paylaşmayın.', 'Aydınlatma ile açık rızayı ayrı değerlendirin.'],
        soru: 'Veri dayanağı ne durumda?',
        secenekler: [
          devam('yazili', 'Dayanak yazılı belirlendi', 'fiyat'),
          son('bekle', 'belirsiz', 'Dayanak belirsiz', 'Veri kararı bekleniyor', 'Hukuk danışmanı dayanağı yazar.', 'O zamana kadar veri paylaşmayın.'),
        ],
      },
      {
        id: 'fiyat', ad: 'Toptan fiyatı netleştirin', sorumlu: 'Finans sorumlusu (önerilen görev)',
        yap: [kural(a, p, 'bantları', 'Fiyat bantları mükellef sayısına göre belirlenir.'), 'Bant tutarları kaynakta yazmıyor.'],
        soru: 'Fiyat bandı ne durumda?',
        secenekler: [
          son('tamamla', 'yazili', 'Finans fiyat bandını yazılı bildirdi', 'Bu işin rehberi tamamlandı', 'Fiyatı müşterilere teklif etmeden önce kaydedin.'),
          son('bekle', 'yok', 'Fiyat bandı yazılmadı', 'Fiyat bekleniyor', 'Finans sorumlusu bandı yazar.', 'O zamana kadar teklif vermeyin.'),
        ],
      },
    ],
  };
}

function altyapiAkis(a: Ayar): IsAkisi {
  const p = 'altyapi';
  return {
    baslik: 'Kendi markasıyla sunan ortak',
    ozet: 'Segika hizmetini kendi markanızla sunarsınız. Fiyat iş hacmine göre belirlenir.',
    hedef: 'Taahhüt, fiyat ve hizmet seviyesi yazılı olsun.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Hizmetinizi tanımlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: [kural(a, p, 'teşvik danışmanlığı', 'Ortak teşvik danışmanlığı ya da dış kaynaklı bordro hizmeti verir.')],
        soru: 'Bu hizmeti veriyor musunuz?',
        secenekler: [
          devam('veriyoruz', 'Bu hizmeti veriyoruz', 'taahhut'),
          son('bitir', 'vermiyoruz', 'Bu hizmeti vermiyoruz', 'Bu program uygun değil', 'Başka programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      {
        id: 'taahhut', ad: 'Yıllık taahhüdü yazın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: [kural(a, p, 'taahhüt eder', 'Ortak yıllık firma taahhüdü verir.'), 'Taahhüt karşılanmazsa ne olacağını yazın.'],
        soru: 'Taahhüt ne durumda?',
        secenekler: [
          devam('yazili', 'Taahhüt sayısı yazılı', 'fiyat'),
          son('bekle', 'yok', 'Taahhüt belirlenmedi', 'Taahhüt bekleniyor', 'Ortaklık sorumlusu sizinle sayıyı belirler.'),
        ],
      },
      {
        id: 'fiyat', ad: 'Hacim fiyatını alın', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: ['Fiyat iş hacmine göre belirlenir.', 'Kaynakta fiyat tablosu yoktur.'],
        soru: 'Fiyat ne durumda?',
        secenekler: [
          devam('teklif', 'Finans fiyatı yazılı teklif etti', 'sla'),
          son('bekle', 'yok', 'Fiyat belirlenmedi', 'Fiyat bekleniyor', 'Finans sorumlusu hacim fiyatını yazar.', 'Fiyat gelmeden müşteriye teklif vermeyin.'),
        ],
      },
      {
        id: 'sla', ad: 'Hizmet seviyesi sözleşmesi', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Hizmet seviyesi sözleşmesi imzalanır.', 'Destek sorumlusunu ve hizmet sürekliliğini yazın.'],
        soru: 'Sözleşme ne durumda?',
        secenekler: [
          devam('imza', 'Sözleşme imzalandı', 'yol'),
          son('bekle', 'taslak', 'Sözleşme taslakta', 'Sözleşme bekleniyor', 'Ortaklık sorumlusu taslağı tamamlar.'),
        ],
      },
      {
        id: 'yol', ad: 'Yol haritasını hazırlayın', sorumlu: 'Siz ve ürün sorumlusu',
        yap: ['Ortak ürün yol haritası birlikte hazırlanır.', 'Marka kullanım sınırını yazın.'],
        soru: 'Yol haritası ne durumda?',
        secenekler: [
          son('tamamla', 'hazir', 'Yol haritası hazır', 'Bu işin rehberi tamamlandı', 'Haritayı sözleşmeye ek olarak saklayın.'),
          son('bekle', 'yok', 'Yol haritası hazır değil', 'Yol haritası bekleniyor', 'Ürün sorumlusu taslağı hazırlar.'),
        ],
      },
    ],
  };
}

function entegrasyonAkis(): IsAkisi {
  return {
    baslik: 'Bordro yazılımı ortağı',
    ozet: 'Bordro veya insan kaynakları yazılımınızı Segika’ya bağlarsınız. Birlikte pazarlama yapılır.',
    hedef: 'Bağlantı doğrulansın ve ortak pazarlama yazılı olsun.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Yazılımınızı tanımlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: ['Bu program bordro veya insan kaynakları yazılımı geliştiren firma içindir.'],
        soru: 'Firmanızın böyle bir yazılımı var mı?',
        secenekler: [
          devam('var', 'Bordro veya insan kaynakları yazılımımız var', 'teknik'),
          son('bitir', 'yok', 'Böyle bir yazılımımız yok', 'Bu program uygun değil', 'Başka programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      {
        id: 'teknik', ad: 'Bağlantıyı doğrulatın', sorumlu: 'Teknik ekip',
        yap: ['Teknik ekip doğrudan yazılım bağlantısını test eder.', 'Testte gerçek çalışan verisi kullanmayın.'],
        soru: 'Teknik ekip ne dedi?',
        secenekler: [
          devam('kabul', 'Teknik ekip bağlantıyı kabul etti', 'veri'),
          son('bekle', 'suruyor', 'Teknik inceleme sürüyor', 'Teknik sonuç bekleniyor', 'Teknik ekip sonucu yazılı bildirir.'),
          son('bitir', 'uygun-degil', 'Bağlantı uygun bulunmadı', 'Bu program kapandı', 'Teknik gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'veri', ad: 'Veri erişimini yazın', sorumlu: 'Hukuk danışmanı (önerilen görev)',
        yap: ['Hangi çalışan verisinin aktarılacağını yazın.', 'Erişimin hukuki dayanağını belirleyin.'],
        soru: 'Veri erişimi ne durumda?',
        secenekler: [
          devam('yazili', 'Veri kapsamı ve dayanak yazılı', 'anlasma'),
          son('bekle', 'belirsiz', 'Dayanak belirsiz', 'Veri kararı bekleniyor', 'Hukuk danışmanı dayanağı yazar.'),
        ],
      },
      {
        id: 'anlasma', ad: 'Ortak pazarlama anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Yazılım bağlantısı ve ortak pazarlama anlaşması yapılır.', 'Komisyon tutarı kaynakta yazmıyor.'],
        soru: 'Anlaşma ne durumda?',
        secenekler: [
          devam('imza', 'Anlaşma imzalandı', 'tanitim'),
          son('bekle', 'odeme', 'Ödeme beklentimiz yazılmadı', 'Ödeme kararı bekleniyor', 'Finans sorumlusu ödeme modelini yazar.'),
        ],
      },
      {
        id: 'tanitim', ad: 'Ortak tanıtımı başlatın', sorumlu: 'Siz ve pazarlama sorumlusu', ek: 'kitle',
        yap: ['Tanıtımda reklam olduğunu açıkça belirtin.', 'Destek görevlerini tanıtımdan önce yazın.'],
        soru: 'Tanıtım planı ne durumda?',
        secenekler: [
          son('tamamla', 'hazir', 'Tanıtım planı hazır', 'Bu işin rehberi tamamlandı', 'Planı ve onayı kayda ekleyin.'),
          son('bekle', 'yok', 'Plan henüz hazır değil', 'Plan bekleniyor', 'Pazarlama sorumlusu taslağı hazırlar.'),
        ],
      },
    ],
  };
}

function osgbAkis(): IsAkisi {
  return {
    baslik: 'Ortak sağlık ve güvenlik birimi',
    ozet: 'İş sağlığı ve güvenliği hizmeti veren kurum müşterilerini yönlendirir.',
    hedef: 'Program başlayınca meslek ve veri kuralları yazılı olsun.',
    ilk: 'baslangic',
    adimlar: [
      baslangicAdimi('meslek', 'Bu ortaklık yönlendirme anlaşmasıyla çalışır.'),
      {
        id: 'meslek', ad: 'Meslek kurallarını kontrol edin', sorumlu: 'Hukuk danışmanı (önerilen görev)', ek: 'sinir',
        yap: ['Kurumun meslek kurallarını ilgili uzman değerlendirir.'],
        soru: 'Meslek değerlendirmesi ne durumda?',
        secenekler: [
          devam('uygun', 'Uzman engel olmadığını yazdı', 'veri'),
          son('bekle', 'bekliyor', 'Uzman görüşü bekleniyor', 'Meslek görüşü bekleniyor', 'Hukuk danışmanı görüşünü yazılı bildirir.'),
        ],
      },
      {
        id: 'veri', ad: 'Sağlık kayıtlarını ayırın', sorumlu: 'Kurum yetkilisi',
        yap: ['Çalışanların sağlık kayıtlarını yönlendirme için paylaşmayın.', 'Yalnız işverenin iletişim izni olan bilgisini iletin.'],
        soru: 'Veri sınırı ne durumda?',
        secenekler: [
          devam('yazili', 'Veri sınırı yazılı', 'anlasma'),
          son('bekle', 'belirsiz', 'Veri sınırı belirsiz', 'Veri kararı bekleniyor', 'Hukuk danışmanı sınırı yazar.'),
        ],
      },
      {
        id: 'anlasma', ad: 'Yönlendirme anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Yönlendirme anlaşması imzalanır.', 'Yönlendirmenin ücreti kaynakta yazmıyor.'],
        soru: 'Anlaşma ne durumda?',
        secenekler: [
          devam('imza', 'Anlaşma ve ücret yazılı', 'yonlendir'),
          son('bekle', 'ucret', 'Ücret yazılmadı', 'Ücret kararı bekleniyor', 'Finans sorumlusu ücret modelini yazar.'),
        ],
      },
      {
        id: 'yonlendir', ad: 'İşvereni yönlendirin', sorumlu: 'Kurum yetkilisi', ek: 'kitle',
        yap: ['İşvereni şirketin satış ekibiyle tanıştırın.', 'Teklif ve fiyatı satış ekibi verir.'],
        soru: 'Yönlendirme nasıl sonuçlandı?',
        secenekler: [
          son('tamamla', 'devraldi', 'Satış ekibi işvereni devraldı', 'Bu işin rehberi tamamlandı', 'Yönlendirmeyi kayda yazın.'),
          son('bitir', 'ilgisiz', 'İşveren ilgilenmiyor', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
    ],
  };
}

function dernekAkis(): IsAkisi {
  return {
    baslik: 'Dernek, oda veya sanayi bölgesi',
    ozet: 'Üyelerinize Segika ile birlikte eğitim düzenlersiniz.',
    hedef: 'Program başlayınca eğitim onaylı olsun ve üyeler kendileri başvursun.',
    ilk: 'baslangic',
    adimlar: [
      baslangicAdimi('kurul', 'Bu ortaklık ortak eğitim programıyla çalışır.'),
      {
        id: 'kurul', ad: 'Yönetim onayını alın', sorumlu: 'Kurum yönetimi',
        yap: ['Ortak eğitimi kurum yönetimi onaylasın.', 'Eğitimin konusunu ve tarihini yazın.'],
        soru: 'Yönetim onayı ne durumda?',
        secenekler: [
          devam('onay', 'Yönetim eğitimi onayladı', 'duyuru'),
          son('bekle', 'yok', 'Onay henüz yok', 'Onay bekleniyor', 'Kurum yönetimi kararını bildirir.'),
        ],
      },
      {
        id: 'duyuru', ad: 'Üyelere duyurun', sorumlu: 'Kurum yetkilisi', ek: 'kitle',
        yap: ['Üye listesini topluca paylaşmayın.', 'İlgilenen üyeler kendileri başvursun.', 'Tanıtım içeriğini açıkça belirtin.'],
        soru: 'Duyuru ne durumda?',
        secenekler: [
          devam('basvuru', 'Üyeler başvurmaya başladı', 'egitim'),
          son('bekle', 'yok', 'Başvuru gelmedi', 'Başvuru bekleniyor', 'Kurum duyuruyu yeniler.'),
        ],
      },
      {
        id: 'egitim', ad: 'Eğitimi yapın', sorumlu: 'Siz ve ürün uzmanı',
        yap: ['Eğitimde gerçek çalışan bilgisi kullanmayın.', 'İlgilenen üyeleri satış ekibine yönlendirin.'],
        soru: 'Eğitim nasıl sonuçlandı?',
        secenekler: [
          son('tamamla', 'yapildi', 'Eğitim yapıldı, ilgilenenler yönlendirildi', 'Bu işin rehberi tamamlandı', 'Katılımı kişisel veri olmadan kaydedin.'),
          son('bekle', 'ertelendi', 'Eğitim ertelendi', 'Yeni tarih bekleniyor', 'Kurum yeni tarihi bildirir.'),
        ],
      },
    ],
  };
}

function franchiseAkis(): IsAkisi {
  return {
    baslik: 'Zincir işletme merkezi',
    ozet: 'Bütün şubeler için merkezle tek sözleşme yapılır.',
    hedef: 'Program başlayınca merkez ve şube sorumlulukları yazılı olsun.',
    ilk: 'baslangic',
    adimlar: [
      baslangicAdimi('merkez', 'Bu ortaklık merkez sözleşmesiyle çalışır.'),
      {
        id: 'merkez', ad: 'Merkez sözleşmesi', sorumlu: 'Yetkili satış sorumlusu', ek: 'anlasma',
        yap: ['Sözleşmeyi merkezin yetkilisiyle yapın.', 'Teklifi yetkili satış sorumlusu onaylar.'],
        soru: 'Merkez sözleşmesi ne durumda?',
        secenekler: [
          devam('imza', 'Merkez sözleşmeyi kabul etti', 'sube'),
          son('bekle', 'karar', 'Merkez henüz karar vermedi', 'Karar bekleniyor', 'Satış sorumlusu soruları yanıtlar.'),
          son('bitir', 'red', 'Merkez reddetti', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'sube', ad: 'Şube yetkilerini yazın', sorumlu: 'Merkez yetkilisi', ek: 'sinir',
        yap: ['Her şubenin yetkisini ayrı yazın.', 'Ödeme sorumlusunu ve destek kapsamını belirleyin.'],
        soru: 'Şube yetkileri ne durumda?',
        secenekler: [
          devam('yazili', 'Şube yetkileri yazılı', 'veri'),
          son('bekle', 'belirsiz', 'Yetkiler belirsiz', 'Yetki kararı bekleniyor', 'Merkez yetkilisi listeyi tamamlar.'),
        ],
      },
      {
        id: 'veri', ad: 'Şube veri sınırını yazın', sorumlu: 'Teknik ekip',
        yap: ['Her şube yalnız kendi çalışan verisini görsün.', 'Erişim sınırını kurulumdan önce test edin.'],
        soru: 'Veri sınırı testi nasıl geçti?',
        secenekler: [
          son('tamamla', 'test', 'Sınır test edildi, kurulum başlayabilir', 'Bu işin rehberi tamamlandı', 'Test sonucunu kayda yazın.'),
          son('bekle', 'hata', 'Testte yetki hatası çıktı', 'Düzeltme bekleniyor', 'Teknik ekip yetkileri düzeltir.', 'Düzeltmeden kuruluma başlamayın.'),
        ],
      },
    ],
  };
}

export const akisOlustur: AkisOlustur = (a) => {
  switch (seciliKosul(a, 'cozum').id) {
    case 'yillara': return yillaraAkis(a);
    case 'yonlendirme': return yonlendirmeAkis(a);
    case 'smmm': return smmmAkis(a);
    case 'altyapi': return altyapiAkis(a);
    case 'entegrasyon': return entegrasyonAkis();
    case 'osgb': return osgbAkis();
    case 'dernek': return dernekAkis();
    case 'franchise': return franchiseAkis();
    default: return anaAkis(a);
  }
};
