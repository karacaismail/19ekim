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
/** Programın kendi kuralı (kosullar.ts). Bulunamazsa sayısız genel cümle döner. */
function kural(a: Ayar, program: string, anahtar: string, yedek: string): string {
  return sonucu(a, program)?.kurallar.find((k) => k.includes(anahtar)) ?? yedek;
}

const PAKET: Record<SegikaPaket, string> = {
  ikisi: 'teşvik ve otomasyon paketi',
  tesvik: 'Sosyal Güvenlik Kurumu teşvik paketi',
  otomasyon: 'Sosyal Güvenlik Kurumu otomasyon paketi',
};

const itiraz = son('bekle', 'itiraz', 'Tutara itirazım var', 'İtiraz incelemesini bekleyin',
  'Finans sorumlusu destek kayıtlarını ve tahsilatı inceler.',
  'Finans sorumlusu kararı imzalı sözleşmeye göre yazılı açıklar.',
  'Yazılı yanıt gelince bu adıma dönün.');

/** İkinci aşamada açılacak programların ilk adımı. */
function baslangicAdimi(sonraki: string, aciklama: string, ek?: AkisAdimi['ek']): AkisAdimi {
  return {
    id: 'baslangic', ad: 'Başlangıcı doğrulayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek,
    yap: ['Şirket bu programı ikinci aşamada açacak.', aciklama, 'Ortaklık sorumlusu başlangıç tarihini size yazılı bildirir.'],
    soru: 'Program başlangıcı bildirildi mi?',
    secenekler: [
      devam('basladi', 'Başlangıç yazılı bildirildi', sonraki),
      son('bekle', 'yok', 'Başlangıç henüz bildirilmedi', 'Program başlamadı',
        'Şirket başlangıç tarihini henüz bildirmedi.', 'Ortaklık sorumlusu tarihi yazılı bildirir.', 'Tarih gelene kadar bu programla teklif vermeyin.'),
    ],
  };
}

function kayitAdimi(a: Ayar, program: string, sonraki: string): AkisAdimi {
  return {
    id: 'kayit', ad: 'İşvereni kaydettirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kitle',
    yap: ['Siz işvereni ortaklık sorumlusuna bildirin.', 'Siz kayda çalışan sayısını ve istenen paketi yazın.',
      program === 'ana' ? 'Şirket her firmayı yalnız bir ortağın kaydına yazar.' : kural(a, program, 'korunur', 'Şirket her firmayı yalnız bir ortağın kaydına yazar.')],
    soru: 'Kayıt sonucu ne oldu?',
    secenekler: [
      devam('acik', 'Kayıt benim adıma açıldı', sonraki),
      son('bitir', 'baska', 'İşveren başka ortağa kayıtlı', 'Bu işveren için iş kapandı',
        'Kayıt başka ortakta olduğu için görüşmeye başlamayın.', 'Karara itirazınız varsa ortaklık sorumlusuna yazın.'),
      son('bekle', 'yanit', 'Kayıt yanıtı gelmedi', 'Kayıt yanıtı bekleniyor',
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
        yap: [`Şirket yılda ${sayi(a.egitimSaat)} saat program eğitimini ücretsiz verir.`,
          `Bu örnekte ${sayi(a.ekEgitimSaat)} saat ek eğitim ${tl(ekGider)} tutar.`,
          'Finans sorumlusu bu gideri komisyonunuzdan düşer.'],
        soru: 'Ek eğitim gideri ne durumda?',
        secenekler: [
          devam('kabul', 'Ek eğitim giderini yazılı kabul ettim', 'odeme'),
          devam('istemiyorum', 'Ek eğitim istemiyorum', 'odeme'),
          son('bekle', 'onay', 'Gider henüz onaylanmadı', 'Eğitim onayını bekleyin',
            'Finans sorumlusu gideri ve komisyondan nasıl düşeceğini yazar.', 'Onay gelmeden eğitim siparişi vermeyin.', 'Onay gelince bu adıma dönün.'),
        ],
      }
    : {
        id: 'egitim', ad: 'Ücretsiz eğitimi planlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [`Şirket yılda ${sayi(a.egitimSaat)} saat program eğitimini ücretsiz verir.`, 'Bu süreden fazlası ücretlidir.',
          'Siz ek eğitimi önceden finans sorumlusuna onaylatın.'],
        soru: 'Eğitim planı ne durumda?',
        secenekler: [
          devam('plan', 'Eğitim tarihi planlandı', 'odeme'),
          son('bekle', 'tarih', 'Eğitim tarihi yok', 'Eğitim tarihi bekleniyor', 'Ortaklık sorumlusu tarih önerir.', 'Eğitim tarihi kesinleşince bu adıma dönün.'),
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
        soru: 'Ortaklık anlaşmanız ne durumda?',
        secenekler: [
          devam('var', 'Yazılı anlaşmam var', 'meslek'),
          son('bekle', 'yok', 'Henüz anlaşma yok', 'Anlaşma bekleniyor',
            'Ortaklık sorumlusu destek kapsamını ve ödemeyi yazar.', 'Bu sırada işverene ortaklıktan söz etmeyin.', 'Anlaşma gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'meslek', ad: 'Meslek kurallarını kontrol edin', sorumlu: 'Hukuk danışmanı (önerilen görev)', ek: 'sinir',
        yap: ['Mali müşavir ve avukat meslek kurallarına bağlıdır.',
          a.musavirModel === 'indirim' ? 'Bu örnekte mali müşavir komisyon yerine programın müşteri indirimini seçer.' : 'Bu örnekte mali müşavir komisyon seçeneğini seçer.',
          'Hukuk danışmanı bu seçeneğin meslek kurallarına uyduğunu kontrol eder.',
          'Bu seçenek komisyonunuzla kendiliğinden birleşmez.'],
        soru: 'Meslek kuralı değerlendirmesi ne durumda?',
        secenekler: [
          devam('uygun', 'Hukuk danışmanı engel olmadığını yazdı', 'kayit'),
          devam('gerekmez', 'Düzenlenmiş bir meslekte değilim', 'kayit'),
          son('bekle', 'bekliyor', 'Hukuk danışmanının görüşü bekleniyor', 'Hukuk görüşünü bekleyin', 'Hukuk danışmanı uygunluğu yazılı bildirir.', 'Görüş gelmeden komisyon sözü vermeyin.'),
          son('bitir', 'engel', 'Kural komisyonu engelliyor', 'Ana program uygun değil', 'Uygun programı ortaklık sorumlusuyla seçin.'),
        ],
      },
      kayitAdimi(a, 'ana', 'ihtiyac'),
      {
        id: 'ihtiyac', ad: 'Teşvik ve bordro ihtiyacını konuşun', sorumlu: 'Siz',
        yap: ['Teşvik takibini ve bordro adımlarını sorun.', 'Mesaj göndermeden önce kişinin iznini kontrol edin.'],
        soru: 'İşveren ne dedi?',
        secenekler: [
          devam('var', 'Teşvik veya bordro ihtiyacı var', 'gosterim'),
          son('bitir', 'ilgisiz', 'İşveren ilgilenmiyor', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
          son('bitir', 'ileti', 'İşveren ileti istemiyor', 'İletişim durduruldu', 'Tercihini kayda yazın.', 'Yeni ileti göndermeyin.'),
        ],
      },
      {
        id: 'gosterim', ad: 'Ürün gösterimi yapın', sorumlu: 'Siz',
        yap: ['Gerçek çalışan bilgisi kullanmayın.', `Bu örnek ${PAKET[a.segikaPaket]} içindir.`,
          `Bu örnekte şirket fiyatı ${sayi(fiyat.kisi)} çalışana göre hesaplar.`, 'Teşvik tutarı için söz vermeyin.'],
        dikkat: 'Çalışan sayısı aynı blokta kalırsa fiyat değişmez. Fiyat herkes için aynıdır.',
        soru: 'Gösterimden sonra durum nedir?',
        secenekler: [
          devam('teklif', 'İşveren teklif istedi', 'teklif'),
          son('bekle', 'gercek', 'İşveren gerçek veriyle görmek istiyor', 'Hukuk görüşünü bekleyin',
            'Hukuk danışmanı gerçek verinin yasal dayanağını değerlendirir.', 'Dayanak yazılmadan çalışan verisi almayın.', 'Görüş gelince bu adıma dönün.'),
          son('bitir', 'vazgecti', 'İşveren vazgeçti', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'teklif', ad: 'Onaylı teklif ve sözleşme', sorumlu: 'Yetkili satış sorumlusu',
        yap: ['Yetkili satış sorumlusu teklifi tablo fiyatıyla hazırlar.', 'Siz fiyatı değiştirmeyin. Fiyat herkes için aynıdır.',
          'Siz kendi hizmet bedelinizi tekliften ayrı gösterin.'],
        soru: 'Teklif ne durumda?',
        secenekler: [
          devam('kabul', 'İşveren sözleşmeyi kabul etti', 'egitim'),
          son('bekle', 'onay', 'Teklif onayı bekleniyor', 'Teklif bekleniyor', 'Yetkili satış sorumlusu teklifi hazırlar.', 'Teklif gelince bu adıma dönün.'),
          son('bitir', 'red', 'İşveren teklifi reddetti', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      egitim,
      {
        id: 'odeme', ad: 'Desteği verin ve ödemeyi izleyin', sorumlu: 'Siz ve finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [odemeMetni, `Bu örnekte bir işverenden komisyonunuz ${tl(cozumKazanci(a))} olur.`,
          'Şirketin komisyon listesini destek kayıtlarınızla karşılaştırın.'],
        soru: 'Destek ve ödeme durumunuz nedir?',
        secenekler: [
          son('tamamla', 'odendi', 'Müşteri ödedi, faturamı kestim', 'Bu işin rehberi tamamlandı',
            'Desteği kayıtlı biçimde sürdürün.', 'Vergi uygulamasını mali müşaviriniz doğrulasın.'),
          son('bekle', 'odemedi', 'Müşteri henüz ödemedi', 'Tahsilat bekleniyor', 'Müşteri ödemeden komisyon kesinleşmez.', 'Finans sorumlusu tahsilatı izler.',
            'Ödeme gelince bu adıma dönün.'),
          son('bekle', 'kapasite', 'Destek yükünü karşılayamıyorum', 'Destek devrini planlayın',
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
    ozet: 'Desteği siz verirsiniz. Komisyon destek verdiğiniz aylara göre yıllara yayılır.',
    hedef: 'Her ayın desteği kayıtlı olsun ve dönem komisyonu doğru izlensin.',
    ilk: 'anlasma',
    adimlar: [
      {
        id: 'anlasma', ad: 'Program anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Bu program müşteri desteğini kendisi veren ortak içindir.', 'Ortaklık sorumlusu hangi kaydın destek sayılacağını yazar.'],
        soru: 'Program anlaşması ne durumda?',
        secenekler: [
          devam('var', 'Yazılı program anlaşması var', 'kayit'),
          son('bekle', 'yok', 'Henüz anlaşma yok', 'Anlaşma bekleniyor', 'Ortaklık sorumlusu destek ölçütünü yazar.', 'Anlaşma metni hazır olunca bu adıma dönün.'),
        ],
      },
      kayitAdimi(a, 'ana', 'sozlesme'),
      {
        id: 'sozlesme', ad: 'Müşteri sözleşmesi', sorumlu: 'Yetkili satış sorumlusu', ek: 'sinir',
        yap: ['Yetkili satış sorumlusu teklifi tablo fiyatıyla hazırlar.', 'Siz destek kapsamınızı sözleşme ekine yazın.'],
        soru: 'İşveren sözleşmeyi ne yaptı?',
        secenekler: [
          devam('kabul', 'İşveren sözleşmeyi kabul etti', 'bicim'),
          son('bekle', 'karar', 'İşveren henüz karar vermedi', 'Karar bekleniyor', 'İşverenin sorularını yetkili satış sorumlusuna iletin.', 'Karar gelince bu adıma dönün.'),
          son('bitir', 'red', 'İşveren reddetti', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'bicim', ad: 'Ödeme biçimini netleştirin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [a.affOdeme === 'paket' ? 'Bu örnekte işveren yıllık paketi peşin öder.' : 'Bu örnekte işveren her ay öder.',
          POLITIKA[a.affPolitika.cozum]],
        dikkat: hizmetAyi ? undefined : 'Bu ödeme biçimi, destek vermediğiniz ayı hesaba katmayabilir.',
        soru: 'Ödeme biçimi sözleşmede nasıl yazıldı?',
        secenekler: hizmetAyi
          ? [
              devam('yazili', 'Ödeme biçimi sözleşmede yazılı', 'destek'),
              son('bekle', 'yok', 'Ödeme biçimi yazılmadı', 'Ödeme biçimi bekleniyor', 'Finans sorumlusu ödeme biçimini sözleşmeye yazar.',
                'Ödeme biçimi yazılınca bu adıma dönün.'),
            ]
          : [
              devam('karar', 'Finans sorumlusu geçerli kuralı yazılı bildirdi', 'destek'),
              son('bekle', 'celiski', 'Destek ayı kuralı ile çelişki çözülmedi', 'Finans kararını bekleyin',
                'Finans sorumlusu hangi kuralın geçerli olduğunu yazar.', 'Karar gelince bu adıma dönün.'),
            ],
      },
      {
        id: 'destek', ad: 'Her ay desteği kaydedin', sorumlu: 'Siz',
        yap: ['Destek vermediğiniz ay için komisyon doğmaz.', 'Destek kaydında konu ve çözüm durumunu tutun.'],
        soru: 'Bu ayın destek durumu nedir?',
        secenekler: [
          devam('verdim', 'Bu ay destek verdim, kayıt var', 'odeme'),
          son('bekle', 'veremedim', 'Bu ay destek veremedim', 'Bu ay komisyon doğmaz',
            'Ortaklık sorumlusuna durumu bildirin.', 'Gerekirse ortaklık sorumlusu devir planı yapar.', 'Sonraki ay bu adıma dönün.'),
          son('bekle', 'olcut', 'Destek ölçütü yazılı değil', 'Ölçüt bekleniyor', 'Ortaklık sorumlusu ölçütü yazılı bildirir.', 'Ölçüt gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'odeme', ad: 'Dönem komisyonunu izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [!s.hatalar.length ? `Bir işverenden ${a.affUfukAy} ayda örnek kazancınız ${tl(toplam)} olur.` : 'Bu koşullarla örnek hesap çıkmıyor.',
          'Bu tutar örnektir. Kazanılmış hak sayılmaz.', 'Müşteri ödemezse komisyon doğmaz.'],
        soru: 'Bu dönemin ödeme durumu nedir?',
        secenekler: [
          son('tamamla', 'odendi', 'Dönem ödemesi geldi, faturamı kestim', 'Bu dönemin rehberi tamamlandı', 'Sonraki ay destek kaydına dönün.'),
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
        soru: 'Uygunluk değerlendirmesi ne durumda?',
        secenekler: [
          devam('uygun', 'Uygunluğum yazılı bildirildi', 'kayit'),
          son('bekle', 'suruyor', 'Değerlendirme sürüyor', 'Uygunluk bekleniyor', 'Ortaklık sorumlusu puanınızı değerlendirir.', 'Sonuç gelince bu adıma dönün.'),
          son('bitir', 'dolu', 'Ortak kontenjanı dolu', 'Bu program şu an kapalı', 'Ana programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      kayitAdimi(a, p, 'yonlendir'),
      {
        id: 'yonlendir', ad: 'Satış ekibine yönlendirin', sorumlu: 'Siz ve satış ekibi',
        yap: ['İşvereni satış ekibiyle tanıştırın.', 'Teklif ve fiyat konuşmayın.', 'Satış ekibi tablo fiyatıyla teklif verir.'],
        soru: 'Yönlendirme nasıl sonuçlandı?',
        secenekler: [
          devam('devraldi', 'Satış ekibi işvereni devraldı', 'destek'),
          son('bekle', 'erteleme', 'İşveren görüşmeyi erteledi', 'Görüşme bekleniyor', 'Satış ekibi işverenle yeni tarih belirler.', 'Yeni tarihte bu adıma dönün.'),
          son('bitir', 'ilgisiz', 'İşveren ilgilenmiyor', 'Görüşme kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'destek', ad: 'Destek sorumlusunu netleştirin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Şirket bu programda destek sorumlusunu henüz belirlemedi.', 'Ortaklık sorumlusu destek sorumlusunu sözleşmeye yazar.'],
        soru: 'Destek sorumlusu belli mi?',
        secenekler: [
          devam('yazili', 'Destek sorumlusu yazılı belirlendi', 'aylar'),
          son('bekle', 'belirsiz', 'Destek sorumlusu belirsiz', 'Destek kararı bekleniyor', 'Ortaklık sorumlusu destek sorumlusunu yazar.', 'Karar gelmeden destek sözü vermeyin.'),
        ],
      },
      {
        id: 'aylar', ad: 'Ödenen ayları izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)',
        yap: [`Finans sorumlusu komisyonu işverenin ödediği ilk ${sayi(a.yonlendirmeAy)} aydan hesaplar.`,
          kural(a, p, 'Ücretsiz aylar', 'Ödenmeyen aylar komisyona girmez.')],
        soru: 'Müşterinin ödeme durumu nedir?',
        secenekler: [
          devam('basladi', 'Müşteri aylık ödemeye başladı', 'odeme'),
          son('bekle', 'ucretsiz', 'Müşteri henüz ücret ödemiyor', 'İlk ödemeyi bekleyin', 'Ödenmeyen aylar komisyona girmez.', 'İlk ödemeden sonra bu adıma dönün.'),
          son('bekle', 'yok', 'Müşteri hiç ödeme yapmadı', 'Tahsilat bekleniyor', 'Finans sorumlusu tahsilatı izler.', 'Ödeme gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'odeme', ad: 'Komisyonu izleyin', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [kural(a, p, 'vergi ve iadeler', 'Komisyon, müşterinin ödediği tutardan vergi ve iadeler düşülerek hesaplanır.'), kural(a, p, 'Ödeme, takip eden', 'Finans sorumlusu ödeme gününü yazılı bildirir.')],
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
        id: 'uygunluk', ad: 'Ofis koşullarını kontrol edin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kitle',
        yap: [kural(a, p, 'bordro hizmeti vermeli', 'Ofis bordro hizmeti vermeli ve sertifika eğitimini bitirmelidir.'),
          'Ortaklık sorumlusu bu koşulları ofisinizle kontrol eder.'],
        soru: 'Ofisiniz bu koşulları sağlıyor mu?',
        secenekler: [
          devam('sagliyor', 'Bütün koşulları sağlıyoruz', 'model'),
          son('bekle', 'egitim', 'Sertifika eğitimi bitmedi', 'Eğitim bekleniyor', 'Sertifika eğitimini tamamlayın.', 'Eğitim bitince bu adıma dönün.'),
          son('bitir', 'bordro-yok', 'Bordro hizmeti vermiyoruz', 'Bu program uygun değil', 'Başka programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      {
        id: 'model', ad: 'Ödeme modelini anlayın', sorumlu: 'Siz', ek: 'sinir',
        yap: [kural(a, p, 'nakit, hediye', 'Bu modelde nakit veya hediye verilmez.'), 'Ofisiniz toptan fiyattan yararlanır.'],
        soru: 'Bu model size uyuyor mu?',
        secenekler: [
          devam('kabul', 'Toptan fiyat modelini kabul ediyoruz', 'meslek'),
          son('bitir', 'nakit', 'Komisyon veya müşteri indirimi istiyoruz', 'Bu program uygun değil', 'Ana programı ortaklık sorumlusuyla değerlendirin.', 'İki model birlikte uygulanmaz.'),
        ],
      },
      {
        id: 'meslek', ad: 'Meslek kurallarını kontrol edin', sorumlu: 'Hukuk danışmanı (önerilen görev)',
        yap: ['Hukuk danışmanı mali müşavirlik meslek kurallarını ayrıca kontrol eder.', 'Bu kontrolü sistem kendiliğinden yapmaz.'],
        soru: 'Meslek değerlendirmesi ne durumda?',
        secenekler: [
          devam('uygun', 'Hukuk danışmanı engel olmadığını yazdı', 'seviye'),
          son('bekle', 'bekliyor', 'Hukuk danışmanının görüşü bekleniyor', 'Hukuk görüşünü bekleyin', 'Hukuk danışmanı görüşünü yazılı bildirir.', 'Görüş gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'seviye', ad: 'Seviyenizi belirleyin', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: [s ? `Bu örnekte ${sayi(a.smmmMukellef)} aktif mükellefle seviyeniz ${s.deger} olur.` : 'Ortaklık sorumlusu seviyeyi aktif mükellef sayısına göre belirler.',
          'Ortaklık sorumlusu mükellef sayısının hangi kayıtla kanıtlanacağını yazar.'],
        soru: 'Mükellef sayısı nasıl kanıtlandı?',
        secenekler: [
          devam('kanit', 'Mükellef sayısını kayıtla gösterdik', 'veri'),
          son('bekle', 'olcut', 'Kanıt türü belirlenmedi', 'Kanıt kararını bekleyin', 'Ortaklık sorumlusu kanıt türünü yazar.', 'Karar gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'veri', ad: 'Mükellef verisinin dayanağı', sorumlu: 'Hukuk danışmanı (önerilen görev)', ek: 'anlasma',
        yap: ['Siz mükellef verisini yasal dayanak olmadan paylaşmayın.', 'Yasal dayanak, veriyi paylaşmaya izin veren hukuk kuralıdır.',
          'Hukuk danışmanı aydınlatma metnini ve açık rızayı ayrı değerlendirir.'],
        soru: 'Veri dayanağı ne durumda?',
        secenekler: [
          devam('yazili', 'Yasal dayanak yazılı belirlendi', 'fiyat'),
          son('bekle', 'belirsiz', 'Yasal dayanak belirsiz', 'Hukuk kararını bekleyin', 'Hukuk danışmanı dayanağı yazar.', 'Karar gelene kadar veri paylaşmayın.'),
        ],
      },
      {
        id: 'fiyat', ad: 'Toptan fiyatı netleştirin', sorumlu: 'Finans sorumlusu (önerilen görev)',
        yap: [kural(a, p, 'bantları', 'Fiyat bantları mükellef sayısına göre belirlenir.'), 'Şirket bant tutarlarını henüz yayımlamadı.',
          'Finans sorumlusu ofisinizin bant fiyatını yazılı bildirir. Bu fiyat pazarlıkla değişmez.'],
        soru: 'Fiyat bandı ne durumda?',
        secenekler: [
          son('tamamla', 'yazili', 'Finans sorumlusu fiyat bandını yazılı bildirdi', 'Bu işin rehberi tamamlandı', 'Bant fiyatını kayda ekleyin.'),
          son('bekle', 'yok', 'Fiyat bandı yazılmadı', 'Fiyat bandını bekleyin', 'Finans sorumlusu bandı yazar.', 'Bant fiyatı gelene kadar müşterilerinize fiyat söylemeyin.'),
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
    hedef: 'Taahhüt, fiyat tablosu ve hizmet seviyesi yazılı olsun.',
    ilk: 'uygunluk',
    adimlar: [
      {
        id: 'uygunluk', ad: 'Hizmetinizi tanımlayın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'kitle',
        yap: [kural(a, p, 'teşvik danışmanlığı', 'Ortak teşvik danışmanlığı ya da dış kaynaklı bordro hizmeti verir.'),
          'Ortaklık sorumlusu hizmetinizi bu koşula göre değerlendirir.'],
        soru: 'Bu hizmeti veriyor musunuz?',
        secenekler: [
          devam('veriyoruz', 'Bu hizmeti veriyoruz', 'taahhut'),
          son('bitir', 'vermiyoruz', 'Bu hizmeti vermiyoruz', 'Bu program uygun değil', 'Başka programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      {
        id: 'taahhut', ad: 'Yıllık taahhüdü yazın', sorumlu: 'Ortaklık sorumlusu (önerilen görev)',
        yap: [kural(a, p, 'taahhüt eder', 'Ortak yıllık firma taahhüdü verir.'), 'Ortaklık sorumlusu taahhüt karşılanmazsa ne olacağını yazar.'],
        soru: 'Taahhüt ne durumda?',
        secenekler: [
          devam('yazili', 'Taahhüt sayısı yazılı', 'fiyat'),
          son('bekle', 'yok', 'Taahhüt belirlenmedi', 'Taahhüt bekleniyor', 'Ortaklık sorumlusu sizinle sayıyı belirler.', 'Sayı yazılınca bu adıma dönün.'),
        ],
      },
      {
        id: 'fiyat', ad: 'Hacim fiyatını alın', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
        yap: ['Bu programda fiyat iş hacmine göre belirlenir.', 'Şirket bu programın fiyat tablosunu henüz yayımlamadı.',
          'Finans sorumlusu tabloyu yazılı verir. Fiyat pazarlıkla değişmez.'],
        soru: 'Fiyat ne durumda?',
        secenekler: [
          devam('teklif', 'Finans sorumlusu fiyat tablosunu yazılı verdi', 'sla'),
          son('bekle', 'yok', 'Fiyat belirlenmedi', 'Fiyat tablosunu bekleyin', 'Finans sorumlusu fiyat tablosunu hazırlar.', 'Tablo gelmeden müşteriye fiyat söylemeyin.'),
        ],
      },
      {
        id: 'sla', ad: 'Hizmet seviyesi sözleşmesi', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Ortaklık sorumlusu hizmet seviyesi sözleşmesini hazırlar.', 'Bu sözleşme destek süresini ve hizmet kalitesini yazar.',
          'Ortaklık sorumlusu destek sorumlusunu sözleşmeye yazar.'],
        soru: 'Sözleşme ne durumda?',
        secenekler: [
          devam('imza', 'Sözleşme imzalandı', 'yol'),
          son('bekle', 'taslak', 'Sözleşme taslakta', 'Sözleşme bekleniyor', 'Ortaklık sorumlusu taslağı tamamlar.', 'Sözleşme imzalanınca bu adıma dönün.'),
        ],
      },
      {
        id: 'yol', ad: 'Yol haritasını hazırlayın', sorumlu: 'Siz ve ürün sorumlusu',
        yap: ['Ürün yol haritasını ürün sorumlusuyla birlikte hazırlayın.', 'Yol haritası, ürünün sıradaki işlerini gösteren plandır.',
          'Markanızın kullanım kurallarını da yazın.'],
        soru: 'Yol haritası ne durumda?',
        secenekler: [
          son('tamamla', 'hazir', 'Yol haritası hazır', 'Bu işin rehberi tamamlandı', 'Haritayı sözleşmeye ek olarak saklayın.'),
          son('bekle', 'yok', 'Yol haritası hazır değil', 'Yol haritası bekleniyor', 'Ürün sorumlusu taslağı hazırlar.', 'Taslak gelince bu adıma dönün.'),
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
        yap: ['Bu program bordro veya insan kaynakları yazılımı geliştiren firma içindir.'],
        soru: 'Firmanızın böyle bir yazılımı var mı?',
        secenekler: [
          devam('var', 'Bordro veya insan kaynakları yazılımımız var', 'teknik'),
          son('bitir', 'yok', 'Böyle bir yazılımımız yok', 'Bu program uygun değil', 'Başka programı ortaklık sorumlusuyla konuşun.'),
        ],
      },
      {
        id: 'teknik', ad: 'Bağlantıyı doğrulatın', sorumlu: 'Teknik ekip',
        yap: ['Teknik ekip doğrudan yazılım bağlantısını test eder.', 'Siz testte gerçek çalışan verisi kullanmayın.'],
        soru: 'Teknik ekip ne dedi?',
        secenekler: [
          devam('kabul', 'Teknik ekip bağlantıyı kabul etti', 'veri'),
          son('bekle', 'suruyor', 'Teknik inceleme sürüyor', 'Teknik sonuç bekleniyor', 'Teknik ekip sonucu yazılı bildirir.', 'Sonuç gelince bu adıma dönün.'),
          son('bitir', 'uygun-degil', 'Bağlantı uygun bulunmadı', 'Bu program kapandı', 'Teknik gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'veri', ad: 'Veri erişimini yazın', sorumlu: 'Hukuk danışmanı (önerilen görev)',
        yap: ['Hukuk danışmanı hangi çalışan verisinin aktarılacağını yazar.', 'Hukuk danışmanı erişimin yasal dayanağını belirler.'],
        soru: 'Veri erişimi ne durumda?',
        secenekler: [
          devam('yazili', 'Veri kapsamı ve yasal dayanak yazılı', 'anlasma'),
          son('bekle', 'belirsiz', 'Yasal dayanak belirsiz', 'Hukuk kararını bekleyin', 'Hukuk danışmanı dayanağı yazar.', 'Karar gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'anlasma', ad: 'Ortak pazarlama anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Ortaklık sorumlusu bağlantı ve ortak pazarlama anlaşmasını hazırlar.', 'Şirket bu programın komisyon tutarını henüz belirlemedi.'],
        soru: 'Anlaşma ne durumda?',
        secenekler: [
          devam('imza', 'Anlaşma imzalandı', 'tanitim'),
          son('bekle', 'odeme', 'Ödeme beklentimiz yazılmadı', 'Ödeme kararını bekleyin', 'Finans sorumlusu ödeme modelini yazar.', 'Karar gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'tanitim', ad: 'Ortak tanıtımı başlatın', sorumlu: 'Siz ve pazarlama sorumlusu (önerilen görev)', ek: 'kitle',
        yap: ['Tanıtımda reklam olduğunu açıkça belirtin.', 'Destek görevlerini tanıtımdan önce yazın.'],
        soru: 'Tanıtım planı ne durumda?',
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
        yap: ['Hukuk danışmanı kurumunuzun meslek kurallarını değerlendirir.'],
        soru: 'Meslek değerlendirmesi ne durumda?',
        secenekler: [
          devam('uygun', 'Hukuk danışmanı engel olmadığını yazdı', 'veri'),
          son('bekle', 'bekliyor', 'Hukuk danışmanının görüşü bekleniyor', 'Hukuk görüşünü bekleyin', 'Hukuk danışmanı görüşünü yazılı bildirir.', 'Görüş gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'veri', ad: 'Sağlık kayıtlarını ayırın', sorumlu: 'Siz',
        yap: ['Çalışanların sağlık kayıtlarını yönlendirme için paylaşmayın.', 'Yalnız işverenin iletişim izni olan bilgisini iletin.'],
        soru: 'Veri sınırı ne durumda?',
        secenekler: [
          devam('yazili', 'Veri sınırı yazılı', 'anlasma'),
          son('bekle', 'belirsiz', 'Veri sınırı belirsiz', 'Hukuk kararını bekleyin', 'Hukuk danışmanı sınırı yazar.', 'Sınır yazılınca bu adıma dönün.'),
        ],
      },
      {
        id: 'anlasma', ad: 'Yönlendirme anlaşması', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
        yap: ['Ortaklık sorumlusu yönlendirme anlaşmasını hazırlar.', 'Şirket yönlendirme ücretini henüz belirlemedi.'],
        soru: 'Anlaşma ne durumda?',
        secenekler: [
          devam('imza', 'Anlaşma ve ücret yazılı', 'yonlendir'),
          son('bekle', 'ucret', 'Ücret yazılmadı', 'Ücret kararını bekleyin', 'Finans sorumlusu ücret modelini yazar.', 'Ücret yazılınca bu adıma dönün.'),
        ],
      },
      {
        id: 'yonlendir', ad: 'İşvereni yönlendirin', sorumlu: 'Siz', ek: 'kitle',
        yap: ['İşvereni şirketin satış ekibiyle tanıştırın.', 'Teklif ve fiyatı satış ekibi verir.', 'Fiyat herkes için aynıdır.'],
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
        yap: ['Kurumunuzun yönetimi ortak eğitimi onaylar.', 'Siz eğitimin konusunu ve tarihini yazın.'],
        soru: 'Yönetim onayı ne durumda?',
        secenekler: [
          devam('onay', 'Yönetim eğitimi onayladı', 'duyuru'),
          son('bekle', 'yok', 'Onay henüz yok', 'Onay bekleniyor', 'Kurum yönetimi kararını bildirir.', 'Onay gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'duyuru', ad: 'Üyelere duyurun', sorumlu: 'Siz', ek: 'kitle',
        yap: ['Üye listesini topluca paylaşmayın.', 'İlgilenen üyeler kendileri başvursun.', 'Duyuruda tanıtım olduğunu açıkça yazın.'],
        soru: 'Duyuru ne durumda?',
        secenekler: [
          devam('basvuru', 'Üyeler başvurmaya başladı', 'egitim'),
          son('bekle', 'yok', 'Başvuru gelmedi', 'Başvuru bekleniyor', 'Duyuruyu yenileyin.', 'Başvuru gelince bu adıma dönün.'),
        ],
      },
      {
        id: 'egitim', ad: 'Eğitimi yapın', sorumlu: 'Siz ve ürün uzmanı',
        yap: ['Eğitimde gerçek çalışan bilgisi kullanmayın.', 'İlgilenen üyeleri satış ekibine yönlendirin.'],
        soru: 'Eğitim nasıl sonuçlandı?',
        secenekler: [
          son('tamamla', 'yapildi', 'Eğitim yapıldı, ilgilenenler yönlendirildi', 'Bu işin rehberi tamamlandı', 'Katılımı kişisel veri olmadan kaydedin.'),
          son('bekle', 'ertelendi', 'Eğitim ertelendi', 'Yeni tarih bekleniyor', 'Yeni tarihi ürün uzmanına bildirin.', 'Yeni tarihte bu adıma dönün.'),
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
        yap: ['Yetkili satış sorumlusu sözleşmeyi merkezinizle yapar.', 'Yetkili satış sorumlusu teklifi tablo fiyatıyla hazırlar.'],
        soru: 'Merkez sözleşmesi ne durumda?',
        secenekler: [
          devam('imza', 'Merkez sözleşmeyi kabul etti', 'sube'),
          son('bekle', 'karar', 'Merkez henüz karar vermedi', 'Karar bekleniyor', 'Yetkili satış sorumlusu merkezin sorularını yanıtlar.', 'Karar gelince bu adıma dönün.'),
          son('bitir', 'red', 'Merkez reddetti', 'Satış kapandı', 'Gerekçeyi kayda yazın.'),
        ],
      },
      {
        id: 'sube', ad: 'Şube yetkilerini yazın', sorumlu: 'Siz', ek: 'sinir',
        yap: ['Her şubenin yetkisini ayrı yazın.', 'Ödeme sorumlusunu ve destek kapsamını belirleyin.'],
        soru: 'Şube yetkileri ne durumda?',
        secenekler: [
          devam('yazili', 'Şube yetkileri yazılı', 'veri'),
          son('bekle', 'belirsiz', 'Yetkiler belirsiz', 'Yetki kararı bekleniyor', 'Yetki listesini tamamlayın.', 'Liste bitince bu adıma dönün.'),
        ],
      },
      {
        id: 'veri', ad: 'Şube veri sınırını yazın', sorumlu: 'Teknik ekip',
        yap: ['Teknik ekip her şubenin yalnız kendi verisini görmesini sağlar.', 'Teknik ekip erişim sınırını kurulumdan önce test eder.'],
        soru: 'Veri sınırı testi nasıl geçti?',
        secenekler: [
          son('tamamla', 'test', 'Sınır test edildi, kurulum başlayabilir', 'Bu işin rehberi tamamlandı', 'Test sonucunu kayda yazın.'),
          son('bekle', 'hata', 'Testte yetki hatası çıktı', 'Düzeltme bekleniyor', 'Teknik ekip yetkileri düzeltir.', 'Teknik ekip düzeltmeden kurulum başlamaz.',
            'Düzeltme bitince bu adıma dönün.'),
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
