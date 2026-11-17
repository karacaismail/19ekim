import { belgeAdimlariniCikar } from '../motor';
import type { AkisAdimi, AkisOlustur, AkisSecenegi, IsAkisi } from '../types';
import { cozumKazanci, segikaAylik, type Ayar, type SegikaPaket } from '../../satisOrtakligi';
import { kosulSonucu, seciliKosul, affilateHesabi } from '../../kosullar';
import { num, tl } from '../../../lib/format';

const sayi = num;
const yuzde = (n: number) => `yüzde ${sayi(n * 100)}`;

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const son = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, ...aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

function sonucu(a: Ayar, program: string) {
  return kosulSonucu({ ...a, kosul: { ...a.kosul, cozum: program } }, 'cozum');
}
/** Programın kendi kuralı (kosullar.ts). Bulunamazsa sayısız genel cümle döner. */
function kural(a: Ayar, program: string, anahtar: string, yedek: string): string {
  return sonucu(a, program)?.kurallar.find((k) => k.includes(anahtar)) ?? yedek;
}

const PAKET: Record<SegikaPaket, string> = {
  ikisi: 'teşvik ve otomasyon paketi',
  tesvik: 'Sosyal Güvenlik Kurumu teşvik paketi',
  otomasyon: 'Sosyal Güvenlik Kurumu otomasyon paketi',
};

const itiraz = son('bekle', 'itiraz', 'Ödenen tutarın yanlış olduğunu düşünüyorum', 'İtiraz incelemesini bekleyin',
  'Finans sorumlusu destek kayıtlarını ve tahsilatı inceler.',
  'Finans sorumlusu kararı imzalı sözleşmeye göre yazılı açıklar.',
  'Yazılı yanıt gelince bu adıma dönün.');

/** İkinci aşamada açılacak programların ilk adımı. */
function baslangicAdimi(sonraki: string, aciklama: string, ek?: AkisAdimi['ek']): AkisAdimi {
  return {
    id: 'baslangic', ad: 'Başlangıcı doğrulayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek,
    yap: ['Şirket bu programı ikinci aşamada açacak.', aciklama, 'Ortaklık sorumlusu başlangıç tarihini size yazılı bildirir.'],
    soru: 'Programın başlama tarihi size yazıldı mı?',
    secenekler: [
      devam('basladi', 'Başlama tarihi bana yazıyla geldi', sonraki),
      son('bekle', 'yok', 'Başlama tarihi bana henüz gelmedi', 'Program başlamadı',
        'Şirket başlangıç tarihini henüz bildirmedi.', 'Ortaklık sorumlusu tarihi yazılı bildirir.', 'Tarih gelene kadar bu programla teklif vermeyin.'),
    ],
  };
}

function kayitAdimi(a: Ayar, program: string, sonraki: string): AkisAdimi {
  return {
    id: 'kayit', ad: 'İşvereni kaydettirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kitle',
    terimler: ['İşveren, Segika’yı satın alacak firmadır.', 'Ortak, Segika’yı işverene öneren kişi ya da firmadır.'],
    yap: [ 'Siz işvereni ortaklık sorumlusuna bildirin.', 'Siz kayda çalışan sayısını ve istenen paketi yazın.',
      program === 'ana' ? 'Şirket her firmayı yalnız bir ortağın kaydına yazar.' : kural(a, program, 'korunur', 'Şirket her firmayı yalnız bir ortağın kaydına yazar.')],
    soru: 'İşverenin kaydı ne oldu?',
    secenekler: [
      devam('acik', 'Ortaklık sorumlusu kaydı benim adıma açtı', sonraki),
      son('bitir', 'baska', 'Ortaklık sorumlusu işverenin başka ortakta olduğunu söyledi', 'Bu işveren için iş kapandı',
        'Kayıt başka ortakta olduğu için görüşmeye başlamayın.', 'Karara itirazınız varsa ortaklık sorumlusuna yazın.'),
      son('bekle', 'yanit', 'Kayıt için bana henüz yanıt gelmedi', 'Kayıt yanıtı bekleniyor',
        'Ortaklık sorumlusu kaydı kontrol eder.', 'Yanıt gelene kadar işvereni kendinize ait saymayın.', 'Yanıt gelince bu adıma dönün.'),
    ],
  };
}

function anaAkis(a: Ayar): IsAkisi {
  const fiyat = segikaAylik(a);
  const ekGider = a.ekEgitimSaat * a.egitimSaatUcret;
  const odemeMetni = a.model === 'oran'
    ? `Komisyonunuz yıllık paket bedelinin ${yuzde(a.cozumOran)} kadarıdır.`
    : 'Bu örnekte şirket her satış için sabit tutar öder.';
  const egitim: AkisAdimi = ekGider > 0
    ? {
        id: 'egitim', ad: 'Ek eğitimi onaylatın', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        terimler: ['Ek eğitim, ücretsiz saatlerden sonra verilen eğitimdir.'],
        yap: [ `Şirket yılda ${sayi(a.egitimSaat)} saat program eğitimini ücretsiz verir.`,
          `Bu örnekte ${sayi(a.ekEgitimSaat)} saat ek eğitim ${tl(ekGider)} tutar.`,
          'Finans sorumlusu bu gideri komisyonunuzdan düşer.'],
        soru: 'Ek eğitimin ücreti için ne oldu?',
        secenekler: [
          devam('kabul', 'Ek eğitim ücretini yazıyla kabul ettim', 'odeme'),
          devam('istemiyorum', 'Ek eğitim istemiyorum', 'odeme'),
          son('bekle', 'onay', 'Ücret için bana henüz onay gelmedi', 'Eğitim onayını bekleyin',
            'Finans sorumlusu gideri ve komisyondan nasıl düşeceğini yazar.', 'Onay gelmeden eğitim siparişi vermeyin.', 'Onay gelince bu adıma dönün.'),
        ],
      }
    : {
        id: 'egitim', ad: 'Ücretsiz eğitimi planlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [`Şirket yılda ${sayi(a.egitimSaat)} saat program eğitimini ücretsiz verir.`, 'Bu süreden fazlası ücretlidir.',
          'Siz ek eğitimi önceden finans sorumlusuna onaylatın.'],
        soru: 'Eğitim günü belli oldu mu?',
        secenekler: [
          devam('plan', 'Eğitim günü belli oldu', 'odeme'),
          son('bekle', 'tarih', 'Eğitim günü henüz belli değil', 'Eğitim tarihi bekleniyor', 'Ortaklık sorumlusu tarih önerir.', 'Eğitim tarihi kesinleşince bu adıma dönün.'),
        ],
      };
  return {
    baslik: 'Desteği veren danışman',
    ozet: 'Hizmet verdiğiniz işverene Segika’yı önerirsiniz. Müşteri desteğini siz verirsiniz.',
    hedef: 'İşveren doğru paketi alsın. Verdiğiniz destek kayda geçsin. Komisyonunuz da izlensin.',
    ilk: 'anlasma',
    adimlar: [
      {
        id: 'anlasma', ad: 'Destek anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Ortaklık sorumlusu desteği sizin vereceğinizi anlaşmaya yazar.', 'Destek kapsamını ve yedek sorumluyu birlikte belirlersiniz.',
          'Şirket müşteri takip sistemini sağlar.'],
        soru: 'Şirketle yazılı anlaşmanız var mı?',
        secenekler: [
          devam('var', 'Yazılı anlaşma elimde', 'meslek'),
          son('bekle', 'yok', 'Elimde henüz anlaşma yok', 'Anlaşma bekleniyor',
            'Ortaklık sorumlusu destek kapsamını ve ödemeyi yazar.', 'Bu sırada işverene ortaklıktan söz etmeyin.', 'Anlaşma gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'meslek', ad: 'Meslek kurallarını kontrol edin', sorumlu: 'Hukuk danışmanı (önerilen görev)', ek: 'sinir',
        terimler: ['Hukuk danışmanı, yasal konularda görüş veren kişidir.', 'Komisyon, satıştan size ödenen paydır.'],
        yap: ['Bazı meslekler kendi kurallarına uymak zorundadır.', 'Mali müşavir ve avukat meslek kurallarına bağlıdır.',
          a.musavirModel === 'indirim' ? 'Bu örnekte mali müşavir komisyon yerine programın müşteri indirimini seçer.' : 'Bu örnekte mali müşavir komisyon seçeneğini seçer.',
          'Hukuk danışmanı bu seçeneğin meslek kurallarına uyduğunu kontrol eder.',
          'Bu seçenek komisyonunuzla kendiliğinden birleşmez.'],
        soru: 'Meslek kuralları size engel mi?',
        secenekler: [
          devam('uygun', 'Hukuk danışmanı engel olmadığını yazdı', 'kayit'),
          devam('gerekmez', 'Mesleğimin uymam gereken özel kuralları yok', 'kayit'),
          son('bekle', 'bekliyor', 'Hukuk danışmanı henüz bir şey yazmadı', 'Hukuk görüşünü bekleyin', 'Hukuk danışmanı uygunluğu yazılı bildirir.', 'Görüş gelmeden komisyon sözü vermeyin.'),
          son('bitir', 'engel', 'Meslek kuralı komisyon almamı engelliyor', 'Ana program uygun değil', 'Uygun programı ortaklık sorumlusuyla seçin.'),
        ],
      },
      kayitAdimi(a, 'ana', 'ihtiyac'),
      {
        id: 'ihtiyac', ad: 'Teşvik ve bordro ihtiyacını konuşun', sorumlu: 'Siz',
        terimler: ['İşveren, Segika’yı satın alacak firmadır.', 'Teşvik, devletin işverene verdiği destektir.', 'Bordro, çalışanların maaş listesidir.'],
        yap: [ 'Teşvik takibini ve bordro adımlarını sorun.', 'Mesaj göndermeden önce kişinin iznini kontrol edin.'],
        soru: 'İşveren ne dedi?',
        secenekler: [
          devam('var', 'İşveren teşvik ya da bordro için yardım istedi', 'gosterim'),
          son('bitir', 'ilgisiz', 'İşveren ilgilenmediğini söyledi', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
          son('bitir', 'ileti', 'İşveren mesaj almak istemediğini söyledi', 'İletişim durduruldu', 'Tercihini kayda yazın.', 'Yeni ileti göndermeyin.'),
        ],
      },
      {
        id: 'gosterim', ad: 'Ürün gösterimi yapın', sorumlu: 'Siz',
        terimler: ['Teklif, fiyatı ve koşulları yazan öneridir.'],
        yap: [ 'Gerçek çalışan bilgisi kullanmayın.', `Bu örnek ${PAKET[a.segikaPaket]} içindir.`,
          `Bu örnekte şirket fiyatı ${sayi(fiyat.kisi)} çalışana göre hesaplar.`, 'Teşvik tutarı için söz vermeyin.'],
        dikkat: 'Çalışan sayısı aynı blokta kalırsa fiyat değişmez. Fiyat herkes için aynıdır.',
        soru: 'Programı gösterdikten sonra işveren ne dedi?',
        secenekler: [
          devam('teklif', 'İşveren teklif istedi', 'teklif'),
          son('bekle', 'gercek', 'İşveren kendi çalışan bilgileriyle görmek istedi', 'Hukuk görüşünü bekleyin',
            'Hukuk danışmanı gerçek verinin yasal dayanağını değerlendirir.', 'Dayanak yazılmadan çalışan verisi almayın.', 'Görüş gelince bu adıma dönün.'),
          son('bitir', 'vazgecti', 'İşveren vazgeçtiğini söyledi', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'teklif', ad: 'Onaylı teklif ve sözleşme', sorumlu: 'Yetkili satış sorumlusu',
        terimler: ['Teklif, fiyatı ve koşulları yazan öneridir.'],
        yap: [ 'Yetkili satış sorumlusu teklifi tablo fiyatıyla hazırlar.', 'Siz fiyatı değiştirmeyin. Fiyat herkes için aynıdır.',
          'Siz kendi hizmet bedelinizi tekliften ayrı gösterin.'],
        soru: 'Teklif için ne oldu?',
        secenekler: [
          devam('kabul', 'İşveren sözleşmeyi kabul ettiğini söyledi', 'egitim'),
          son('bekle', 'onay', 'Onaylı teklif bana henüz gelmedi', 'Teklif bekleniyor', 'Yetkili satış sorumlusu teklifi hazırlar.', 'Teklif gelince bu adıma dönün.'),
          son('bitir', 'red', 'İşveren teklifi istemediğini söyledi', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      egitim,
      {
        id: 'odeme', ad: 'Desteği verin ve ödemeyi izleyin', sorumlu: 'Siz ve finans sorumlusu (önerilen görev)', ek: 'kazanc',
        terimler: ['Komisyon, satıştan size ödenen paydır.', 'Fatura, aldığınız para için kestiğiniz resmi belgedir.'],
        yap: [ odemeMetni, `Bu örnekte bir işverenden komisyonunuz ${tl(cozumKazanci(a))} olur.`,
          'Şirketin komisyon listesini destek kayıtlarınızla karşılaştırın.'],
        soru: 'Destek ve ödeme konusunda ne oldu?',
        secenekler: [
          son('tamamla', 'odendi', 'Müşteri ödedi ve ben faturamı kestim', 'Bu işin rehberi tamamlandı',
            'Desteği kayıtlı biçimde sürdürün.', 'Vergi uygulamasını mali müşaviriniz doğrulasın.'),
          son('bekle', 'odemedi', 'Müşteri henüz ödemedi', 'Tahsilat bekleniyor', 'Müşteri ödemeden komisyon kesinleşmez.', 'Finans sorumlusu tahsilatı izler.',
            'Ödeme gelince bu adıma dönün.'),
          son('bekle', 'kapasite', 'Bütün desteğe yetişemiyorum', 'Destek devrini planlayın',
            'Ortaklık sorumlusuna bekleyen işleri bildirin.', 'Ortaklık sorumlusu devir planını sizinle yazar.', 'Plan yazılmadan yeni destek sözü vermeyin.'),
          itiraz,
        ],
      },
    ],
  };
}

const POLITIKA: Record<Ayar['affPolitika']['cozum'], string> = {
  tahsilatta: 'Bu örnekte işveren ödeyince komisyonu hak edersiniz. Şirket komisyonu aynı ay öder.',
  'hizmet-ayi': 'Bu örnekte komisyonu her hizmet ayının sonunda hak edersiniz.',
  'tahsilatta-taksit': 'Bu örnekte işveren ödeyince komisyonu hak edersiniz. Şirket komisyonu taksitle öder.',
};

function yillaraAkis(a: Ayar): IsAkisi {
  const s = affilateHesabi(a, 'cozum');
  const toplam = s.ortaklar.reduce((n, o) => n + o.planlanan, 0) / 100;
  const hizmetAyi = a.affPolitika.cozum === 'hizmet-ayi';
  return {
    baslik: 'Yıllara yayılan destek ortağı',
    ozet: 'Desteği siz verirsiniz. Komisyon destek verdiğiniz aylara göre yıllara yayılır. Kişi ilk 12 ayda K1 kotasını tamamlamazsa 13. aydan sonra pay almaz.',
    hedef: 'Her ayın desteği kayıtlı olsun ve dönem komisyonu doğru izlensin.',
    ilk: 'anlasma',
    adimlar: [
      {
        id: 'anlasma', ad: 'Program anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Bu program müşteri desteğini kendisi veren ortak içindir.', 'Ortaklık sorumlusu hangi kaydın destek sayılacağını yazar.'],
        soru: 'Şirketle yazılı anlaşmanız var mı?',
        secenekler: [
          devam('var', 'Yazılı anlaşma elimde', 'kayit'),
          son('bekle', 'yok', 'Elimde henüz anlaşma yok', 'Anlaşma bekleniyor', 'Ortaklık sorumlusu destek ölçütünü yazar.', 'Anlaşma metni hazır olunca bu adıma dönün.'),
        ],
      },
      kayitAdimi(a, 'ana', 'sozlesme'),
      {
        id: 'sozlesme', ad: 'Müşteri sözleşmesi', sorumlu: 'Yetkili satış sorumlusu', ek: 'sinir',
        yap: ['Yetkili satış sorumlusu teklifi tablo fiyatıyla hazırlar.', 'Siz destek kapsamınızı sözleşme ekine yazın.'],
        soru: 'İşveren sözleşmeye ne dedi?',
        secenekler: [
          devam('kabul', 'İşveren sözleşmeyi kabul ettiğini söyledi', 'bicim'),
          son('bekle', 'karar', 'İşveren henüz karar vermediğini söyledi', 'Karar bekleniyor', 'İşverenin sorularını yetkili satış sorumlusuna iletin.', 'Karar gelince bu adıma dönün.'),
          son('bitir', 'red', 'İşveren sözleşmeyi istemediğini söyledi', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'bicim', ad: 'Ödeme biçimini netleştirin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [a.affOdeme === 'paket' ? 'Bu örnekte işveren yıllık paketi peşin öder.' : 'Bu örnekte işveren her ay öder.',
          POLITIKA[a.affPolitika.cozum]],
        dikkat: hizmetAyi ? undefined : 'Bu ödeme biçimi, destek vermediğiniz ayı hesaba katmayabilir.',
        soru: 'Ödeme şekli konusunda ne oldu?',
        secenekler: hizmetAyi
          ? [
              devam('yazili', 'Ödeme şeklini sözleşmede yazılı gördüm', 'destek'),
              son('bekle', 'yok', 'Sözleşmede ödeme şekli yazmıyor', 'Ödeme biçimi bekleniyor', 'Finans sorumlusu ödeme biçimini sözleşmeye yazar.',
                'Ödeme biçimi yazılınca bu adıma dönün.'),
            ]
          : [
              devam('karar', 'Finans sorumlusu geçerli kuralı bana yazdı', 'destek'),
              son('bekle', 'celiski', 'Ödeme kuralı ile destek ayı kuralı hâlâ çelişiyor', 'Finans kararını bekleyin',
                'Finans sorumlusu hangi kuralın geçerli olduğunu yazar.', 'Karar gelince bu adıma dönün.'),
            ],
      },
      {
        id: 'destek', ad: 'Her ay desteği kaydedin', sorumlu: 'Siz',
        yap: ['Destek vermediğiniz ay için komisyon doğmaz.', 'Destek kaydında konu ve çözüm durumunu tutun.'],
        soru: 'Bu ay destek konusunda ne oldu?',
        secenekler: [
          devam('verdim', 'Bu ay destek verdim ve kaydını tuttum', 'odeme'),
          son('bekle', 'veremedim', 'Bu ay destek veremedim', 'Bu ay komisyon doğmaz',
            'Ortaklık sorumlusuna durumu bildirin.', 'Gerekirse ortaklık sorumlusu devir planı yapar.', 'Sonraki ay bu adıma dönün.'),
          son('bekle', 'olcut', 'Neyin destek sayılacağı bana yazılmadı', 'Ölçüt bekleniyor', 'Ortaklık sorumlusu ölçütü yazılı bildirir.', 'Ölçüt gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'odeme', ad: 'Dönem komisyonunu izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        terimler: ['Dönem, komisyonun hesaplandığı zaman aralığıdır.', 'Fatura, aldığınız para için kestiğiniz resmi belgedir.'],
        yap: [ !s.hatalar.length ? `Bir işverenden ${a.affUfukAy} ayda örnek kazancınız ${tl(toplam)} olur.` : 'Bu koşullarla örnek hesap çıkmıyor.',
          'Bu tutar örnektir. Kazanılmış hak sayılmaz.', 'Müşteri ödemezse komisyon doğmaz.'],
        soru: 'Bu dönemin ödemesi için ne oldu?',
        secenekler: [
          son('tamamla', 'odendi', 'Dönem ödemesi geldi ve faturamı kestim', 'Bu dönemin rehberi tamamlandı', 'Sonraki ay destek kaydına dönün.'),
          son('bekle', 'odemedi', 'Müşteri henüz ödemedi', 'Tahsilat bekleniyor', 'Finans sorumlusu tahsilatı izler.', 'Ödeme gelince bu adıma dönün.'),
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
        yap: [kural(a, p, 'Ortak puanı', 'Ortak sayısının üst sınırı var. Ortak puanının da alt sınırı var.'), kural(a, p, 'fiyatı değiştiremez', 'Fiyatı değiştiremez ve tahsilat yapamazsınız.'),
          'Ortaklık sorumlusu puanınızı değerlendirir.'],
        soru: 'Programa girip giremeyeceğiniz belli oldu mu?',
        secenekler: [
          devam('uygun', 'Programa girebileceğim bana yazıldı', 'kayit'),
          son('bekle', 'suruyor', 'Ortaklık sorumlusu henüz karar vermedi', 'Uygunluk bekleniyor', 'Ortaklık sorumlusu puanınızı değerlendirir.', 'Sonuç gelince bu adıma dönün.'),
          son('bitir', 'dolu', 'Programda ortak yeri kalmadı', 'Bu program şu an kapalı', 'Ana programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      kayitAdimi(a, p, 'yonlendir'),
      {
        id: 'yonlendir', ad: 'Satış ekibine yönlendirin', sorumlu: 'Siz ve satış ekibi',
        terimler: ['İşveren, Segika’yı satın alacak firmadır.'],
        yap: [ 'İşvereni satış ekibiyle tanıştırın.', 'Teklif ve fiyat konuşmayın.', 'Satış ekibi tablo fiyatıyla teklif verir.'],
        soru: 'Satış ekibiyle tanışma nasıl geçti?',
        secenekler: [
          devam('devraldi', 'Satış ekibi işverenle ilgilenmeye başladı', 'destek'),
          son('bekle', 'erteleme', 'İşveren görüşmeyi sonraya bıraktı', 'Görüşme bekleniyor', 'Satış ekibi işverenle yeni tarih belirler.', 'Yeni tarihte bu adıma dönün.'),
          son('bitir', 'ilgisiz', 'İşveren ilgilenmediğini söyledi', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'destek', ad: 'Destek sorumlusunu netleştirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Şirket bu programda destek sorumlusunu henüz belirlemedi.', 'Ortaklık sorumlusu destek sorumlusunu sözleşmeye yazar.'],
        soru: 'Müşteriye kimin destek vereceği belli mi?',
        secenekler: [
          devam('yazili', 'Destek verecek kişi yazıyla belli oldu', 'aylar'),
          son('bekle', 'belirsiz', 'Destek verecek kişi henüz belli değil', 'Destek kararı bekleniyor', 'Ortaklık sorumlusu destek sorumlusunu yazar.', 'Karar gelmeden destek sözü vermeyin.'),
        ],
      },
      {
        id: 'aylar', ad: 'Ödenen ayları izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)',
        yap: [`Finans sorumlusu komisyonu işverenin ödediği ilk ${sayi(a.yonlendirmeAy)} aydan hesaplar.`,
          kural(a, p, 'Ücretsiz aylar', 'Ödenmeyen aylar komisyona girmez.')],
        soru: 'Müşteri ödemeye başladı mı?',
        secenekler: [
          devam('basladi', 'Müşteri aylık ödemeye başladı', 'odeme'),
          son('bekle', 'ucretsiz', 'Müşteri henüz ücret ödemiyor', 'İlk ödemeyi bekleyin', 'Ödenmeyen aylar komisyona girmez.', 'İlk ödemeden sonra bu adıma dönün.'),
          son('bekle', 'yok', 'Müşteri hiç ödeme yapmadı', 'Tahsilat bekleniyor', 'Finans sorumlusu tahsilatı izler.', 'Ödeme gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'odeme', ad: 'Komisyonu izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        terimler: ['Komisyon, satıştan size ödenen paydır.', 'Fatura, aldığınız para için kestiğiniz resmi belgedir.'],
        yap: [ kural(a, p, 'vergi ve iadeler', 'Komisyon, müşterinin ödediği tutardan vergi ve iadeler düşülerek hesaplanır.'), kural(a, p, 'Ödeme, takip eden', 'Finans sorumlusu ödeme gününü yazılı bildirir.')],
        soru: 'Komisyonunuz geldi mi?',
        secenekler: [
          son('tamamla', 'odendi', 'Komisyon geldi ve faturamı kestim', 'Bu işin rehberi tamamlandı', 'Ödemeyi kendi kaydınızla karşılaştırın.'),
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
        id: 'uygunluk', ad: 'Ofis koşullarını kontrol edin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kitle',
        terimler: ['Bordro, çalışanların maaş listesidir.', 'Sertifika, eğitimi bitirince verilen belgedir.'],
        yap: [ kural(a, p, 'bordro hizmeti vermeli', 'Ofis bordro hizmeti vermeli ve sertifika eğitimini bitirmelidir.'),
          'Ortaklık sorumlusu bu koşulları ofisinizle kontrol eder.'],
        soru: 'Ofisiniz bu koşulları sağlıyor mu?',
        secenekler: [
          devam('sagliyor', 'Ofisimiz bütün koşullara uyuyor', 'model'),
          son('bekle', 'egitim', 'Sertifika eğitimini henüz bitirmedik', 'Eğitim bekleniyor', 'Sertifika eğitimini tamamlayın.', 'Eğitim bitince bu adıma dönün.'),
          son('bitir', 'bordro-yok', 'Ofisimiz bordro hizmeti vermiyor', 'Bu program uygun değil', 'Başka programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      {
        id: 'model', ad: 'Ödeme modelini anlayın', sorumlu: 'Siz', ek: 'sinir',
        terimler: ['Toptan fiyat, çok alana yapılan indirimli fiyattır.', 'Komisyon, satıştan size ödenen paydır.'],
        yap: [ kural(a, p, 'nakit, hediye', 'Bu modelde nakit veya hediye verilmez.'), 'Ofisiniz toptan fiyattan yararlanır.'],
        soru: 'Bu ödeme şekli size uyuyor mu?',
        secenekler: [
          devam('kabul', 'Toptan fiyatla çalışmayı kabul ediyoruz', 'meslek'),
          son('bitir', 'nakit', 'Komisyon ya da müşteri indirimi istiyoruz', 'Bu program uygun değil', 'Ana programı ortaklık sorumlusuyla değerlendirin.', 'İki model birlikte uygulanmaz.'),
        ],
      },
      {
        id: 'meslek', ad: 'Meslek kurallarını kontrol edin', sorumlu: 'Hukuk danışmanı (önerilen görev)',
        terimler: ['Hukuk danışmanı, yasal konularda görüş veren kişidir.'],
        yap: [ 'Hukuk danışmanı mali müşavirlik meslek kurallarını ayrıca kontrol eder.', 'Bu kontrolü sistem kendiliğinden yapmaz.'],
        soru: 'Hukuk danışmanı meslek kuralları için ne dedi?',
        secenekler: [
          devam('uygun', 'Hukuk danışmanı engel olmadığını yazdı', 'seviye'),
          son('bekle', 'bekliyor', 'Hukuk danışmanı henüz bir şey yazmadı', 'Hukuk görüşünü bekleyin', 'Hukuk danışmanı görüşünü yazılı bildirir.', 'Görüş gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'seviye', ad: 'Seviyenizi belirleyin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kazanc',
        terimler: ['Mükellef, ofisinizin hizmet verdiği firmadır.'],
        yap: [ s ? `Bu örnekte ${sayi(a.smmmMukellef)} aktif mükellefle seviyeniz ${s.deger} olur.` : 'Ortaklık sorumlusu seviyeyi aktif mükellef sayısına göre belirler.',
          'Ortaklık sorumlusu mükellef sayısının hangi kayıtla kanıtlanacağını yazar.'],
        soru: 'Mükellef sayınızı nasıl gösterdiniz?',
        secenekler: [
          devam('kanit', 'Mükellef sayımızı kayıtla gösterdik', 'veri'),
          son('bekle', 'olcut', 'Hangi kaydın geçerli olduğu bize yazılmadı', 'Kanıt kararını bekleyin', 'Ortaklık sorumlusu kanıt türünü yazar.', 'Karar gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'veri', ad: 'Mükellef verisinin dayanağı', sorumlu: 'Hukuk danışmanı (önerilen görev)', ek: 'anlasma',
        terimler: ['Yasal dayanak, veriyi paylaşmaya izin veren hukuk kuralıdır.'],
        yap: ['Siz mükellef verisini yasal dayanak olmadan paylaşmayın.',
          'Hukuk danışmanı aydınlatma metnini ve açık rızayı ayrı değerlendirir.'],
        soru: 'Yasal dayanak belli oldu mu?',
        secenekler: [
          devam('yazili', 'Yasal dayanak bize yazıyla bildirildi', 'fiyat'),
          son('bekle', 'belirsiz', 'Yasal dayanak henüz belli değil', 'Hukuk kararını bekleyin', 'Hukuk danışmanı dayanağı yazar.', 'Karar gelene kadar veri paylaşmayın.'),
        ],
      },
      {
        id: 'fiyat', ad: 'Toptan fiyatı netleştirin', sorumlu: 'Finans sorumlusu (önerilen görev)',
        terimler: ['Fiyat bandı, mükellef sayısına göre değişen fiyat basamağıdır.'],
        yap: [ kural(a, p, 'bantları', 'Fiyat bantları mükellef sayısına göre belirlenir.'), 'Şirket bant tutarlarını henüz yayımlamadı.',
          'Finans sorumlusu ofisinizin bant fiyatını yazılı bildirir. Bu fiyat pazarlıkla değişmez.'],
        soru: 'Fiyat bandınız size yazıldı mı?',
        secenekler: [
          son('tamamla', 'yazili', 'Finans sorumlusu fiyat bandımızı yazıyla bildirdi', 'Bu işin rehberi tamamlandı', 'Bant fiyatını kayda ekleyin.'),
          son('bekle', 'yok', 'Fiyat bandımız bize henüz yazılmadı', 'Fiyat bandını bekleyin', 'Finans sorumlusu bandı yazar.', 'Bant fiyatı gelene kadar müşterilerinize fiyat söylemeyin.'),
        ],
      },
    ],
  };
}

function entegrasyonAkis(): IsAkisi {
  return {
    baslik: 'Bordro yazılımı ortağı',
    ozet: 'Bordro veya insan kaynakları yazılımınızı Segika’ya bağlarsınız. Şirketle birlikte pazarlama yaparsınız.',
    hedef: 'Bağlantı doğrulansın ve ortak pazarlama yazılı olsun.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Yazılımınızı tanımlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        terimler: ['Bordro, çalışanların maaş listesidir.'],
        yap: [ 'Bu program bordro veya insan kaynakları yazılımı geliştiren firma içindir.'],
        soru: 'Firmanızın böyle bir yazılımı var mı?',
        secenekler: [
          devam('var', 'Bordro ya da insan kaynakları yazılımımız var', 'teknik'),
          son('bitir', 'yok', 'Böyle bir yazılımımız yok', 'Bu program uygun değil', 'Başka programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      {
        id: 'teknik', ad: 'Bağlantıyı doğrulatın', sorumlu: 'Teknik ekip',
        yap: ['Teknik ekip doğrudan yazılım bağlantısını test eder.', 'Siz testte gerçek çalışan verisi kullanmayın.'],
        soru: 'Teknik ekip ne dedi?',
        secenekler: [
          devam('kabul', 'Teknik ekip bağlantıyı uygun bulduğunu söyledi', 'veri'),
          son('bekle', 'suruyor', 'Teknik ekip incelemeye devam ediyor', 'Teknik sonuç bekleniyor', 'Teknik ekip sonucu yazılı bildirir.', 'Sonuç gelince bu adıma dönün.'),
          son('bitir', 'uygun-degil', 'Teknik ekip bağlantıyı uygun bulmadı', 'Bu program kapandı', 'Teknik gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'veri', ad: 'Veri erişimini yazın', sorumlu: 'Hukuk danışmanı (önerilen görev)',
        terimler: ['Yasal dayanak, bilgiyi paylaşmaya izin veren hukuk kuralıdır.'],
        yap: [ 'Hukuk danışmanı hangi çalışan verisinin aktarılacağını yazar.', 'Hukuk danışmanı erişimin yasal dayanağını belirler.'],
        soru: 'Hangi bilgilerin aktarılacağı yazıldı mı?',
        secenekler: [
          devam('yazili', 'Bilgilerin kapsamı ve yasal dayanağı yazıldı', 'anlasma'),
          son('bekle', 'belirsiz', 'Yasal dayanak henüz belli değil', 'Hukuk kararını bekleyin', 'Hukuk danışmanı dayanağı yazar.', 'Karar gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'anlasma', ad: 'Ortak pazarlama anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        terimler: ['Ortak pazarlama, iki firmanın birlikte tanıtım yapmasıdır.'],
        yap: [ 'Ortaklık sorumlusu bağlantı ve ortak pazarlama anlaşmasını hazırlar.', 'Şirket bu programın komisyon tutarını henüz belirlemedi.'],
        soru: 'Ortak pazarlama anlaşması imzalandı mı?',
        secenekler: [
          devam('imza', 'Anlaşma imzalandı', 'tanitim'),
          son('bekle', 'odeme', 'Bize ne ödeneceği anlaşmaya henüz yazılmadı', 'Ödeme kararını bekleyin', 'Finans sorumlusu ödeme modelini yazar.', 'Karar gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'tanitim', ad: 'Ortak tanıtımı başlatın', sorumlu: 'Siz ve pazarlama sorumlusu (önerilen görev)', ek: 'kitle',
        yap: ['Tanıtımda reklam olduğunu açıkça belirtin.', 'Destek görevlerini tanıtımdan önce yazın.'],
        soru: 'Tanıtım planı hazır mı?',
        secenekler: [
          son('tamamla', 'hazir', 'Tanıtım planı hazır', 'Bu işin rehberi tamamlandı', 'Planı ve onayı kayda ekleyin.'),
          son('bekle', 'yok', 'Plan henüz hazır değil', 'Plan bekleniyor', 'Pazarlama sorumlusu taslağı hazırlar.', 'Taslak gelince bu adıma dönün.'),
        ],
      },
    ],
  };
}

function osgbAkis(): IsAkisi {
  return {
    baslik: 'Ortak sağlık ve güvenlik birimi',
    ozet: 'Kurumunuz iş sağlığı ve güvenliği hizmeti verir. Müşterilerinizi şirkete yönlendirirsiniz.',
    hedef: 'Program başlayınca meslek ve veri kuralları yazılı olsun.',
    ilk: 'baslangic',
    adimlar: [
      baslangicAdimi('meslek', 'Bu ortaklık yönlendirme anlaşmasıyla çalışır.'),
      {
        id: 'meslek', ad: 'Meslek kurallarını kontrol edin', sorumlu: 'Hukuk danışmanı (önerilen görev)', ek: 'sinir',
        terimler: ['Hukuk danışmanı, yasal konularda görüş veren kişidir.'],
        yap: [ 'Hukuk danışmanı kurumunuzun meslek kurallarını değerlendirir.'],
        soru: 'Hukuk danışmanı meslek kuralları için ne dedi?',
        secenekler: [
          devam('uygun', 'Hukuk danışmanı engel olmadığını yazdı', 'veri'),
          son('bekle', 'bekliyor', 'Hukuk danışmanı henüz bir şey yazmadı', 'Hukuk görüşünü bekleyin', 'Hukuk danışmanı görüşünü yazılı bildirir.', 'Görüş gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'veri', ad: 'Sağlık kayıtlarını ayırın', sorumlu: 'Siz',
        yap: ['Çalışanların sağlık kayıtlarını yönlendirme için paylaşmayın.', 'Yalnız işverenin iletişim izni olan bilgisini iletin.'],
        soru: 'Hangi bilgileri paylaşacağınız yazıldı mı?',
        secenekler: [
          devam('yazili', 'Paylaşılacak bilgiler bize yazıldı', 'anlasma'),
          son('bekle', 'belirsiz', 'Paylaşılacak bilgiler henüz belli değil', 'Hukuk kararını bekleyin', 'Hukuk danışmanı sınırı yazar.', 'Sınır yazılınca bu adıma dönün.'),
        ],
      },
      {
        id: 'anlasma', ad: 'Yönlendirme anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        terimler: ['Yönlendirme, işvereni şirketin satış ekibine götürmektir.'],
        yap: [ 'Ortaklık sorumlusu yönlendirme anlaşmasını hazırlar.', 'Şirket yönlendirme ücretini henüz belirlemedi.'],
        soru: 'Yönlendirme anlaşması ve ücret yazıldı mı?',
        secenekler: [
          devam('imza', 'Anlaşmayı ve ücreti yazılı gördüm', 'yonlendir'),
          son('bekle', 'ucret', 'Ücret henüz yazılmadı', 'Ücret kararını bekleyin', 'Finans sorumlusu ücret modelini yazar.', 'Ücret yazılınca bu adıma dönün.'),
        ],
      },
      {
        id: 'yonlendir', ad: 'İşvereni yönlendirin', sorumlu: 'Siz', ek: 'kitle',
        terimler: ['İşveren, Segika’yı satın alacak firmadır.'],
        yap: [ 'İşvereni şirketin satış ekibiyle tanıştırın.', 'Teklif ve fiyatı satış ekibi verir.', 'Fiyat herkes için aynıdır.'],
        soru: 'Satış ekibiyle tanışma nasıl geçti?',
        secenekler: [
          son('tamamla', 'devraldi', 'Satış ekibi işverenle ilgilenmeye başladı', 'Bu işin rehberi tamamlandı', 'Yönlendirmeyi kayda yazın.'),
          son('bitir', 'ilgisiz', 'İşveren ilgilenmediğini söyledi', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
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
        yap: ['Kurumunuzun yönetimi ortak eğitimi onaylar.', 'Siz eğitimin konusunu ve tarihini yazın.'],
        soru: 'Yönetim eğitimi onayladı mı?',
        secenekler: [
          devam('onay', 'Yönetim eğitimi onayladı', 'duyuru'),
          son('bekle', 'yok', 'Yönetimden henüz onay gelmedi', 'Onay bekleniyor', 'Kurum yönetimi kararını bildirir.', 'Onay gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'duyuru', ad: 'Üyelere duyurun', sorumlu: 'Siz', ek: 'kitle',
        yap: ['Üye listesini topluca paylaşmayın.', 'İlgilenen üyeler kendileri başvursun.', 'Duyuruda tanıtım olduğunu açıkça yazın.'],
        soru: 'Duyurudan sonra üyeler başvurdu mu?',
        secenekler: [
          devam('basvuru', 'Üyeler başvurmaya başladı', 'egitim'),
          son('bekle', 'yok', 'Henüz başvuru gelmedi', 'Başvuru bekleniyor', 'Duyuruyu yenileyin.', 'Başvuru gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'egitim', ad: 'Eğitimi yapın', sorumlu: 'Siz ve ürün uzmanı',
        yap: ['Eğitimde gerçek çalışan bilgisi kullanmayın.', 'İlgilenen üyeleri satış ekibine yönlendirin.'],
        soru: 'Eğitim yapıldı mı?',
        secenekler: [
          son('tamamla', 'yapildi', 'Eğitimi yaptık ve ilgilenenleri yönlendirdik', 'Bu işin rehberi tamamlandı', 'Katılımı kişisel veri olmadan kaydedin.'),
          son('bekle', 'ertelendi', 'Eğitim sonraya kaldı', 'Yeni tarih bekleniyor', 'Yeni tarihi ürün uzmanına bildirin.', 'Yeni tarihte bu adıma dönün.'),
        ],
      },
    ],
  };
}

function franchiseAkis(): IsAkisi {
  return {
    baslik: 'Zincir işletme merkezi',
    ozet: 'Şirket bütün şubeleriniz için merkezinizle tek sözleşme yapar.',
    hedef: 'Program başlayınca merkez ve şube sorumlulukları yazılı olsun.',
    ilk: 'baslangic',
    adimlar: [
      baslangicAdimi('merkez', 'Bu ortaklık merkez sözleşmesiyle çalışır.', 'kitle'),
      {
        id: 'merkez', ad: 'Merkez sözleşmesi', sorumlu: 'Yetkili satış sorumlusu', ek: 'anlasma',
        terimler: ['Merkez, bütün şubeleri yöneten ana işletmedir.'],
        yap: [ 'Yetkili satış sorumlusu sözleşmeyi merkezinizle yapar.', 'Yetkili satış sorumlusu teklifi tablo fiyatıyla hazırlar.'],
        soru: 'Merkez sözleşmeye ne dedi?',
        secenekler: [
          devam('imza', 'Merkez sözleşmeyi kabul ettiğini söyledi', 'sube'),
          son('bekle', 'karar', 'Merkez henüz karar vermediğini söyledi', 'Karar bekleniyor', 'Yetkili satış sorumlusu merkezin sorularını yanıtlar.', 'Karar gelince bu adıma dönün.'),
          son('bitir', 'red', 'Merkez sözleşmeyi istemediğini söyledi', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'sube', ad: 'Şube yetkilerini yazın', sorumlu: 'Siz', ek: 'sinir',
        yap: ['Her şubenin yetkisini ayrı yazın.', 'Ödeme sorumlusunu ve destek kapsamını belirleyin.'],
        soru: 'Şubelerin yetkileri yazıldı mı?',
        secenekler: [
          devam('yazili', 'Şube yetkilerini yazdım', 'veri'),
          son('bekle', 'belirsiz', 'Yetkiler henüz belli değil', 'Yetki kararı bekleniyor', 'Yetki listesini tamamlayın.', 'Liste bitince bu adıma dönün.'),
        ],
      },
      {
        id: 'veri', ad: 'Şube veri sınırını yazın', sorumlu: 'Teknik ekip',
        terimler: ['Kurulum, programın şubelerde çalışır hale getirilmesidir.'],
        yap: [ 'Teknik ekip her şubenin yalnız kendi verisini görmesini sağlar.', 'Teknik ekip erişim sınırını kurulumdan önce test eder.'],
        soru: 'Teknik ekibin testi nasıl geçti?',
        secenekler: [
          son('tamamla', 'test', 'Test geçti ve kurulum başlayabilir', 'Bu işin rehberi tamamlandı', 'Test sonucunu kayda yazın.'),
          son('bekle', 'hata', 'Testte yetki hatası çıktı', 'Düzeltme bekleniyor', 'Teknik ekip yetkileri düzeltir.', 'Teknik ekip düzeltmeden kurulum başlamaz.',
            'Düzeltme bitince bu adıma dönün.'),
        ],
      },
    ],
  };
}

const akisOlusturTam: AkisOlustur = (a) => {
  switch (seciliKosul(a, 'cozum').id) {
    case 'yillara': return yillaraAkis(a);
    case 'yonlendirme': return yonlendirmeAkis(a);
    case 'smmm': return smmmAkis(a);
    case 'entegrasyon': return entegrasyonAkis();
    case 'osgb': return osgbAkis();
    case 'dernek': return dernekAkis();
    case 'franchise': return franchiseAkis();
    default: return anaAkis(a);
  }
};

/** Rehberde belge adımları sorulmaz (motor.ts → belgeAdimlariniCikar). */
export const akisOlustur: AkisOlustur = (a) => belgeAdimlariniCikar(akisOlusturTam(a));
