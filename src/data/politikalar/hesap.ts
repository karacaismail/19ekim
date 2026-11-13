/** Rehber hesabı seçili proje, program ve ortak parametrelerden türetilir. */
import * as v1 from '../satisOrtakligi';
import * as v2 from '../satisOrtakligiV2';
import { KOSULLAR, kosulSonucu, affilateModeli, affilateHesabi, affilateYillari } from '../kosullar';
import { DEFAULT_PARAMS } from '../params';
import type { RolId } from './types';
import { acikAd, acikTerimler } from './terimler';

export const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
export const tl = (n: number) => `${sayi(n)} TL`;
export const yuzde = (n: number) => `%${sayi(n * 100)}`;
export interface HesapOrnegi { urun: string; satirlar: { ad: string; deger: string }[]; aciklama: string[] }
export interface OzelProgram { id: string; ad: string; urun: string; etiket: string; donem: string; sonuc: string; aciklama: string; hesap: { ad: string; formul: string; sonuc: string }[]; kurallar: string[] }
export interface RehberHesabi { ornekler: HesapOrnegi[]; odeme: string[]; digerSurum: HesapOrnegi[]; programlar: OzelProgram[]; plan: string[] }

function ornek(rol: RolId, marka: v1.Marka, ayar = v1.VARSAYILAN_AYAR): HesapOrnegi {
  const a = { ...ayar, marka };
  const fiyat = v1.yillikFiyat(a);
  const satirlar = [
    { ad: 'Aylık liste fiyatı', deger: `${tl(v1.aylikFiyat(a))} (KDV hariç)` },
    { ad: 'Yıllık paket bedeli', deger: `${tl(fiyat)} (KDV hariç)` },
  ];
  const aciklama = marka === 'istoc'
    ? [`Aylık liste fiyatı ${sayi(a.istocAyEur)} avrodur. Bu örnekte 1 avro ${tl(a.kur)} sayılır.`, `Yıllık pakette 12 ay için ${sayi(a.istocYilAy)} aylık bedel ödenir.`]
    : [`Örnek, ${sayi(a.calisan)} çalışan için ${v1.PAKET_ADI[a.segikaPaket]} paketini kullanır.`, `Fiyat, çalışan sayısı ${sayi(a.blok)} kişilik gruplara yukarı yuvarlanarak hesaplanır. Örneğin ${sayi(a.blok + 1)} ile ${sayi(2 * a.blok)} arası çalışan için ${sayi(2 * a.blok)} çalışanın bedeli ödenir. Sayı başka gruba geçerse bedeli yeniden hesaplayın. Sayı aynı grupta kalırsa bedel değişmez.`];
  if (rol === 'kadrolu') {
    const k = v1.kadrolu(a);
    aciklama.push(a.model === 'oran' ? 'Kota, prim hesabındaki satış eşiğidir. Yalnız bu eşiği aşan tutar prim hesabına girer.' : 'Kota dolunca sonraki satışlar için sabit prim hesaplanır.');
    satirlar.push(
      { ad: 'Aylık örnek maaş', deger: tl(a.maas) },
      { ad: 'Bu ay satılan yıllık paket', deger: `${sayi(a.kadroluSatis)} adet` },
      { ad: 'Bu satışların paket bedeli', deger: tl(k.ciro) },
      { ad: 'Aylık kota', deger: `${tl(a.maas)} × ${sayi(a.kotaCarpan)} × ${sayi(1 + a.kotaEk)} = ${tl(k.kota)}` },
      { ad: 'Örnek prim', deger: a.model === 'sabit' ? `${sayi(Math.max(0, a.kadroluSatis - k.kotaIcinSatis))} satış × ${tl(a.sabit)} = ${tl(k.prim)}` : `Kotayı aşan tutar ${tl(Math.max(0, k.ciro - k.kota))} × ${yuzde(a.kadroluPrim[marka])} = ${tl(k.prim)}` },
      { ad: 'Maaş ve prim toplamı', deger: tl(k.toplam) },
    );
    aciklama.push(`Aylık kota, maaşın ${sayi(a.kotaCarpan)} katının ${yuzde(a.kotaEk)} fazlasıdır.`);
    aciklama.push('Bu örnek kota uygulanan bir ayı gösterir. Satılan paket yıllık, prim dönemi aylıktır.');
    if (marka === 'istoc') aciklama.push('İlk iki ay kota uygulanmaz. Şirket bu iki ayın primini henüz açıklamadı.');
    else aciklama.push('Şirket Segika için kotasız başlangıç süresi belirlemedi. Başlamadan prim ekini insan kaynakları sorumlusuyla netleştirin.');
    aciklama.push('Şirket maaşın net mi brüt mü olduğunu henüz yazmadı. İnsan kaynakları sorumlusu bunu iş sözleşmesine yazsın.');
  } else if (rol === 'tavsiye') {
    const kredi = v1.aylikFiyat(a) * a.krediAy;
    satirlar.push(
      { ad: 'Uygun tavsiye başına size', deger: `${sayi(a.krediAy)} ay ücretsiz kullanım (${tl(kredi)})` },
      { ad: 'Yeni müşteriye', deger: `${sayi(a.yeniKrediAy)} ay ücretsiz kullanım` },
      { ad: 'Yıllık tavsiye sınırı', deger: `${sayi(a.tavsiyeSinir)} uygun tavsiye` },
      { ad: 'Bir yılda alabileceğiniz en çok ücretsiz kullanım', deger: tl(kredi * a.tavsiyeSinir) },
    );
    aciklama.push('Bu tutarlar nakit ödeme değildir. Kabul edilen paket için kullanım karşılığıdır.');
    aciklama.push('Birinci sürüm, yeni müşterinin yıllık paket almasını ister.');
    aciklama.push(v1.rolMetinleri(marka).find((r) => r.id === 'tavsiye')!.kurallar[1]);
    aciklama.push('İkinci sürümün koşulu farklıdır. Şirket geçerli koşulu tavsiye öncesinde yazılı bildirmelidir.');
  } else {
    const seviye = rol === 'oncu' ? a.oncuSeviye : rol === 'cozum' ? a.cozumSeviye : a.elciSeviye;
    const oran = rol === 'cozum' && marka === 'segika' ? a.cozumOran : a.oran[seviye];
    const komisyon = rol === 'cozum' ? v1.cozumKazanci(a) : v1.satisKazanci(a, seviye);
    satirlar.push(
      { ad: 'Satıştaki katkınız', deger: rol === 'cozum' && marka === 'segika' ? 'Müşteri desteğini ortak verir' : v1.SEVIYE_ADI[seviye].replace('Demo da', 'Ürün gösterimi de') },
      { ad: 'Bir yıllık paket için komisyon', deger: a.model === 'sabit' ? tl(komisyon) : `${tl(fiyat)} × ${yuzde(oran)} = ${tl(komisyon)}` },
    );
    if (rol === 'cozum') {
      for (const donem of v1.donemKazanci(a, 'cozum')) {
        satirlar.push({ ad: `Yıllık örnek: ${donem.ad.toLocaleLowerCase('tr-TR')}`, deger: tl(donem.yillik) });
      }
      aciklama.push(`Yıllık örnek, ${sayi(a.cozumMusteri)} yeni müşteri getirdiğinizi varsayar. Bu sayı gerçekleşmiş satış değildir.`);
      if (marka === 'segika') {
        aciklama.push(`Şirket, ortağa ve destek personeline yılda ${sayi(a.egitimSaat)} saat ücretsiz program eğitimi verir.`);
        aciklama.push(`Ek eğitimin bir saati ${tl(a.egitimSaatUcret)} tutar.`);
        aciklama.push(`Örnekte ${sayi(a.ekEgitimSaat)} saat ek eğitim kullanılır. Toplam eğitim gideri ${tl(a.ekEgitimSaat * a.egitimSaatUcret)} olur.`);
        aciklama.push('Ek eğitim giderini kabul etmeden eğitim siparişi vermeyin. Vergi uygulamasını finans sorumlusu açıklasın.');
      }
      const m = v1.musavir(a);
      aciklama.push(m.tur === 'indirim'
        ? `Mali müşavir seçeneğinde müşteriye ${yuzde(a.musavirIndirim)} indirim uygulanır. Müşavir komisyon yerine panel alır.`
        : `Mali müşavir seçeneğinde müşteri başına ${tl(m.musteriBasina)} komisyon hesaplanır.`);
      aciklama.push('Mali müşavir seçeneği çözüm ortağı komisyonuyla kendiliğinden birleşmez. Hukuk danışmanı meslek kurallarına uygunluğu ayrıca kontrol etsin.');
    }
    if (rol === 'elci') satirlar.push({ ad: 'Aylık satış örneği', deger: `${sayi(a.elciSatis)} satış × ${tl(komisyon)} = ${tl(a.elciSatis * komisyon)}` });
    aciklama.push('Bu hesap satışın gerçekleştiğini kanıtlamaz. Finans ekibi ödeme koşullarını ayrıca doğrular.');
    aciklama.push('Kesintiler sonrası elinize geçecek tutar bu hesapta belirlenmez. Vergi ve belge koşulları ayrıca yazılır.');
  }
  aciklama.push('KDV, katma değer vergisinin kısa adıdır.');
  return { urun: marka === 'istoc' ? 'iStoc' : 'Segika', satirlar, aciklama };
}

function ikinciSurum(rol: RolId, marka: v2.Marka): HesapOrnegi {
  const a = { ...v2.VARSAYILAN_AYAR, marka };
  const satirlar: HesapOrnegi['satirlar'] = [];
  const aciklama = ['Bu bölüm ikinci sürümün herkes için geçerli başlangıç değerlerini gösterir. Bu değerler ana örnekle birleştirilmez.'];
  if (rol === 'tavsiye') {
    const m = v2.musteriKazanc(a);
    satirlar.push({ ad: 'Tahsilat için süre', deger: v2.sureMetni(a.tavsiyeSure) },
      { ad: 'Uygun tavsiye başına kullanım karşılığı', deger: tl(m.tavsiyeBasi) },
      { ad: 'Örnekte sayılan yıllık tavsiye', deger: `${sayi(m.sayilan)} adet` },
      { ad: 'Yıllık kullanım karşılığı', deger: tl(m.yillikKredi) });
    aciklama.push(`Ödeme tavsiyeden sonraki ${v2.sureMetni(a.tavsiyeSure)} içinde alınırsa hak oluşur.`);
    aciklama.push(`Süre hesabında bir ay ${v2.AY_GUN} gündür. Ödeme süresinde alınmazsa hak oluşmaz.`);
    aciklama.push(`Tavsiye eden ${a.krediAy} ay, yeni müşteri ${a.yeniKrediAy} ay ücretsiz kullanım kazanır.`);
    aciklama.push(`Yılda en çok ${a.tavsiyeSinir} tavsiye sayılır. Kullanım karşılığı nakit değildir.`);
  } else if (rol === 'kadrolu') {
    const k = v2.kadroluKazanc(a);
    satirlar.push({ ad: 'Örnekte ulaşılan kariyer basamağı', deger: v2.KARIYER_ADI[k.sg.seviye] },
      { ad: 'Örnek maaş', deger: tl(k.maas) }, { ad: 'Aylık kota', deger: tl(k.kota) },
      { ad: 'Örnek prim', deger: tl(k.prim) }, { ad: 'Maaş ve prim toplamı', deger: tl(k.toplam) });
    aciklama.push('Bu sürümde ilk iki ay kota yoktur. Bu örnek hesap üçüncü ay ve sonrası için geçerlidir.');
    aciklama.push('Şirket ilk iki ayın primini henüz açıklamadı. Çalışan ağ payı veya kampanya ödülü almaz.');
  } else {
    const b = v2.bagimsizKazanc(a);
    satirlar.push({ ad: 'Örnekte ulaşılan ortak seviyesi', deger: v2.SEGMENT_ADI[b.sg.seviye] },
      { ad: 'Aylık satış sayısı', deger: `${sayi(b.s.adet)} adet` },
      { ad: 'Satış komisyonu', deger: tl(b.komisyon) },
      { ad: 'Birinci ağ kademesi', deger: tl(b.k1) },
      { ad: 'İkinci ağ kademesi', deger: tl(b.k2) },
      { ad: 'Aylık örnek toplam', deger: tl(b.aylik) },
      { ad: 'İlk döneme özel ek ödül', deger: tl(b.hizli) });
    aciklama.push(v2.KAMPANYALAR.find((k) => k.id === 'hizli-baslangic')!.ozet(a));
    aciklama.push('Bu ek ödül aylık örnek toplama dahil değildir.');
    aciklama.push('Ağ payı için kendi satışınız ve gereken ortak seviyesi aranır. Kişi eklemek tek başına kazanç sağlamaz.');
    aciklama.push(`Bu hesapta katkı seviyesi olarak “${v2.SEVIYE_ADI[a.katki].replace('Demo da', 'Ürün gösterimi de')}” seçildi.`);
  }
  aciklama.push('Bu hesap eğitimin ve sözleşmenin tamamlandığını varsayar. Ortaklık sorumlusu gerçek kayıtları kontrol etsin.');
  aciklama.push('Yıllık tahmin, gerçekleşmiş satış veya kazanılmış seviye değildir.');
  return { urun: marka === 'istoc' ? 'iStoc' : 'Segika', satirlar, aciklama };
}

export function rehberHesabi(rol: RolId, marka: v1.Marka, ayar = v1.VARSAYILAN_AYAR): RehberHesabi {
  const a = { ...ayar, marka };
  const programlar = KOSULLAR[rol].filter((k) => k.id !== 'ana' && k.marka.includes(marka)).map((k) => {
    const sonuc = kosulSonucu({ ...a, marka, kosul: { [rol]: k.id } }, rol)!;
    const model = affilateModeli({ ...a, kosul: { [rol]: k.id } }, rol);
    if (model) {
      const motor = affilateHesabi(a, model);
      const toplam = motor.ortaklar.reduce((sum, o) => sum + o.planlanan, 0) / 100;
      const politika = a.affPolitika[model];
      const odemeKurali = politika === 'tahsilatta' ? 'Müşteri ödeme yapınca komisyon oluşur. Bu örnekte komisyon, müşterinin ödediği ay ödenir.'
        : politika === 'hizmet-ayi' ? 'Komisyon her hizmet ayının sonunda oluşur ve ödenir.'
          : 'Müşteri ödeme yapınca komisyon oluşur. Şirket komisyonu taksitlerle öder.';
      return { id: k.id, ad: acikAd(k.ad), urun: marka === 'istoc' ? 'iStoc' : 'Segika',
        etiket: 'Bir müşteri için planlanan komisyon', donem: `${a.affUfukAy} ay`, sonuc: motor.hatalar.length ? 'Hesaplanamadı' : tl(toplam),
        aciklama: `Örnek, bir müşterinin ${a.affOdeme === 'paket' ? 'yıllık paket' : 'aylık abonelik'} ödemesini kullanır. Hesap süresi ${a.affUfukAy} aydır.`,
        hesap: affilateYillari(motor, a.affUfukAy).map((tutar, i) => ({ ad: `${i + 1}. hizmet yılı`, formul: 'Bu örnekte o yıl ödenecek komisyon', sonuc: tl(tutar / 100) })),
        kurallar: [odemeKurali, ...(model === 'ayse' ? ['Komisyon yalnız ilk fatura için hesaplanır.'] : []),
          'Müşteri ödemezse komisyon oluşmaz. İade olursa komisyon geri alınır.',
          'Bu hesap örnektir. Gerçek tahsilatı veya ödemeyi kanıtlamaz.', ...motor.hatalar] };
    }
    // Eski ağ örneğinin kişi adları ve kategorik hukuk iddiası rehbere taşınmaz.
    const kurallar = sonuc.kurallar.map((kural) => kural.includes('6502')
      ? 'Kazanç yalnız gerçek satıştan doğar. Kişi eklemek tek başına kazanç sağlamaz. Hukuki uygunluk ayrıca değerlendirilir.'
      : kural.replace('kademe fiyatı, yalnız onunla ilgilenen bir ortak başarı yöneticisini, ortak pazarlama fonunu ve API erişimini, yani yazılımını doğrudan bağlama imkânını alır.', 'kademe fiyatı alır. Şirket ofise yalnız onunla ilgilenen bir sorumlu atar. Ofis, birlikte yapılan reklamlar için ayrılan paradan da yararlanır. Ofis yazılım bağlantısı (API) da alır. Böylece kendi yazılımını doğrudan bağlayabilir.'));
    return { id: k.id, ad: acikAd(k.ad), urun: marka === 'istoc' ? 'iStoc' : 'Segika', etiket: k.id === 'ag' ? 'Aylık örnek ağ kazancı' : sonuc.etiket,
      donem: sonuc.ozetBirim.replace(/^\/\s*/, ''), sonuc: sonuc.deger,
      aciklama: k.id === 'ag'
        ? `Örnekte her ortak ayda ${a.agAltSatis} satış yapar. Her ortak ${a.agAltTemsilci} yeni ortak getirir. Ağ payı ${a.agDerinlik} kademe için hesaplanır.`
        : acikTerimler(sonuc.aciklama),
      hesap: sonuc.hesap, kurallar: kurallar.map(acikTerimler) };
  });
  const odeme = rol === 'tavsiye'
    ? ['Ücretsiz kullanımın hangi faturaya uygulanacağını finans sorumlusu bildirmelidir.', 'İptal, paket değişimi ve kullanılmayan süre için yazılı kural gerekir.']
    : rol === 'kadrolu'
      ? ['Prim için tahsilat ve iade koşullarının tamamlanması gerekir.', 'Ödeme günü ile iade süresini finans ekibi prim ekinde belirtmelidir.']
      : [`Bu örnekte komisyonun ${yuzde(a.ilkOdeme)} kısmı ilk ödemede verilir.`,
         `Şirket ilk ödemeyi ${a.ilkGun}. gün yapar. Kalan ödemeyi ${a.kalanGun}. gün yapar.`,
         'Şirket günlerin hangi olaydan sonra sayılacağını henüz yazmadı. Finans sorumlusu bunu sözleşmeye yazsın.',
         'Tahsilat ve iade koşulları doğrulanmadan ödeme kesinleşmiş sayılmaz.'];
  const secili = programlar.find((p) => p.id === a.kosul?.[rol]);
  const seciliOrnek: HesapOrnegi | null = secili ? { urun: secili.urun,
    satirlar: [{ ad: 'Çalışma programı', deger: secili.ad }, { ad: secili.etiket, deger: secili.sonuc },
      ...secili.hesap.map((h) => ({ ad: h.ad, deger: `${h.formul} = ${h.sonuc}` }))],
    aciklama: [secili.aciklama, ...secili.kurallar] } : null;
  return {
    ornekler: [seciliOrnek ?? ornek(rol, marka, a)], odeme: secili ? ['Finans sorumlusu bu programın ödeme koşullarını yazılı anlaşmada doğrulasın.'] : odeme,
    digerSurum: [ikinciSurum(rol, marka)], programlar,
    plan: marka === 'segika' ? [
      `Genel planda Segika ekibi ${DEFAULT_PARAMS.segikaCount} kişi olarak başlar. Bu sayı işe alındığını kanıtlamaz.`,
      `Genel kadro planında net maaş ${tl(DEFAULT_PARAMS.segikaSalary)} olarak yazılıdır.`,
      'Bu tutar genel kadro planına aittir. Satış hesabındaki örnek maaşın yerine geçmez. Örnek maaşın net mi brüt mü olduğu henüz yazılmadı.',
      'Şirket Segika için ayrı reklam bütçesi belirlemedi.',
      'Finans sorumlusu yazılı bütçe vermeden ücretli tanıtım başlatmayın.',
      'Destek sorumlusu yoksa yeni müşteri için destek tarihi vermeyin.',
      'Operasyon yöneticisi hizmeti devralacak kişiyi belirlesin.',
      'Ekip kapasitesi veya başlangıç tarihi değişirse bekleyen işleri yeniden planlayın.',
    ] : [
      `Genel planda saha satış ekibi ${DEFAULT_PARAMS.sahaCount} kişi olarak başlar. Bu sayı işe alındığını kanıtlamaz.`,
      `Genel planda yeni satıcı bulmak için aylık ${tl(DEFAULT_PARAMS.dijitalAdBudgetMonthly)} reklam payı var. Bu tutar harcama izni değildir.`,
      'Bütçe sıfırsa ücretli reklam başlatmayın. Onaylı bütçe varsa harcama sınırını sorumluyla belirleyin.',
      'Görevi devralacak çalışan yoksa yeni teslim tarihi vermeyin. Operasyon yöneticisi kabul edecek kişiyi belirlesin.',
      `Genel planda 1 avro ${tl(DEFAULT_PARAMS.eurTry)} sayılır. Satış hesabında 1 avro ${tl(a.kur)} sayılır.`,
      'Bu iki kaynağı aynı ödeme hesabında karıştırmayın. Finans sorumlusu sözleşmede kullanılacak kuru belirlesin.',
      'Başlangıç tarihi veya kapasite değişirse bekleyen işlerin takvimini yeniden değerlendirin.',
    ],
  };
}
