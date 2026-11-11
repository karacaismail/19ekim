/** Rehber örnekleri derleme sırasında yayımlanan varsayılanlardan türetilir. Tarayıcı kaydı okunmaz. */
import * as v1 from '../satisOrtakligi';
import * as v2 from '../satisOrtakligiV2';
import { KOSULLAR, kosulSonucu } from '../kosullar';
import { DEFAULT_PARAMS } from '../params';
import type { RolId } from './types';

export const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
export const tl = (n: number) => `${sayi(n)} TL`;
export const yuzde = (n: number) => `%${sayi(n * 100)}`;
export interface HesapOrnegi { urun: string; satirlar: { ad: string; deger: string }[]; aciklama: string[] }
export interface OzelProgram { id: string; ad: string; urun: string; etiket: string; donem: string; sonuc: string; aciklama: string; hesap: { ad: string; formul: string; sonuc: string }[]; kurallar: string[] }
export interface RehberHesabi { ornekler: HesapOrnegi[]; odeme: string[]; digerSurum: HesapOrnegi[]; programlar: OzelProgram[]; plan: string[] }

function ornek(rol: RolId, marka: v1.Marka): HesapOrnegi {
  const a = { ...v1.VARSAYILAN_AYAR, marka };
  const fiyat = v1.yillikFiyat(a);
  const satirlar = [
    { ad: 'Aylık liste bedeli', deger: tl(v1.aylikFiyat(a)) },
    { ad: 'Yıllık paket bedeli', deger: `${tl(fiyat)} (KDV hariç)` },
  ];
  const aciklama = marka === 'istoc'
    ? [`Aylık liste fiyatı ${sayi(a.istocAyEur)} avrodur. Örnek kur ${tl(a.kur)} olarak alınır.`, `Yıllık paket ${sayi(a.istocYilAy)} aylık bedelle hesaplanır.`]
    : [`Örnek, ${sayi(a.calisan)} çalışan için ${v1.PAKET_ADI[a.segikaPaket]} paketini kullanır.`, `Fiyat ${sayi(a.blok)} çalışanlık bloklarla hesaplanır. Çalışan sayısı artarsa bedel değişir.`];
  if (rol === 'kadrolu') {
    const k = v1.kadrolu(a);
    aciklama.push('Kota, prim hesabındaki satış eşiğidir. Yalnız bu eşiği aşan tutar prim hesabına girer.');
    satirlar.push(
      { ad: 'Aylık örnek maaş', deger: tl(a.maas) },
      { ad: 'Bu ay satılan yıllık paket', deger: `${sayi(a.kadroluSatis)} adet` },
      { ad: 'Bu satışların paket bedeli', deger: tl(k.ciro) },
      { ad: 'Aylık kota', deger: `${tl(a.maas)} × ${sayi(a.kotaCarpan)} × ${sayi(1 + a.kotaEk)} = ${tl(k.kota)}` },
      { ad: 'Örnek prim', deger: `${tl(Math.max(0, k.ciro - k.kota))} × ${yuzde(a.kadroluPrim[marka])} = ${tl(k.prim)}` },
      { ad: 'Maaş ve prim toplamı', deger: tl(k.toplam) },
    );
    aciklama.push('Bu örnek kota uygulanan bir ayı gösterir. Satılan paket yıllık, prim dönemi aylıktır.');
    if (marka === 'istoc') aciklama.push('İlk iki ay kota uygulanmaz. Bu dönemin prim hesabı kaynakta açıklanmamıştır.');
    else aciklama.push('Birinci sürümün Segika metni kotasız başlangıç süresini açıklamaz. Başlamadan prim ekini netleştirin.');
    aciklama.push('Maaşın net veya brüt niteliği bu kaynakta belirtilmemiştir. Bordro koşulunu ayrıca yazın.');
  } else if (rol === 'tavsiye') {
    const kredi = v1.aylikFiyat(a) * a.krediAy;
    satirlar.push(
      { ad: 'Uygun tavsiye başına size', deger: `${sayi(a.krediAy)} ay ücretsiz kullanım (${tl(kredi)})` },
      { ad: 'Yeni müşteriye', deger: `${sayi(a.yeniKrediAy)} ay ücretsiz kullanım` },
      { ad: 'Yıllık tavsiye sınırı', deger: `${sayi(a.tavsiyeSinir)} uygun tavsiye` },
      { ad: 'Sınır dolarsa yıllık kullanım karşılığı', deger: tl(kredi * a.tavsiyeSinir) },
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
      { ad: 'Varsayılan katkı', deger: rol === 'cozum' && marka === 'segika' ? 'Müşteri desteğini ortak verir' : v1.SEVIYE_ADI[seviye].replace('Demo', 'Ürün gösterimi') },
      { ad: 'Bir yıllık paket için komisyon', deger: `${tl(fiyat)} × ${yuzde(oran)} = ${tl(komisyon)}` },
    );
    if (rol === 'cozum') {
      for (const donem of v1.donemKazanci(a, 'cozum')) {
        satirlar.push({ ad: `Yıllık örnek: ${donem.ad.toLocaleLowerCase('tr-TR')}`, deger: tl(donem.yillik) });
      }
      aciklama.push(`Yıllık örnek, ${sayi(a.cozumMusteri)} yeni müşteri getirdiğinizi varsayar. Bu sayı gerçekleşmiş satış değildir.`);
      if (marka === 'segika') {
        aciklama.push(`Şirket, ortağa ve destek personeline yılda ${sayi(a.egitimSaat)} saat ücretsiz program eğitimi verir.`);
        aciklama.push(`Ek eğitim saat ücreti ${tl(a.egitimSaatUcret)} tutarındadır.`);
        aciklama.push(`Örnekte ${sayi(a.ekEgitimSaat)} saat ek eğitim kullanılır. Toplam eğitim gideri ${tl(a.ekEgitimSaat * a.egitimSaatUcret)} tutarındadır.`);
        aciklama.push('Ek eğitim giderini kabul etmeden eğitim siparişi vermeyin. Vergi uygulamasını finans sorumlusu açıklasın.');
      }
      const m = v1.musavir(a);
      aciklama.push(m.tur === 'indirim'
        ? `Mali müşavir seçeneğinde müşteriye ${yuzde(a.musavirIndirim)} indirim uygulanır. Müşavir komisyon yerine panel alır.`
        : `Mali müşavir seçeneğinde müşteri başına ${tl(m.musteriBasina)} komisyon hesaplanır.`);
      aciklama.push('Mali müşavir seçeneği çözüm ortağı komisyonuyla kendiliğinden birleşmez. Mesleki uygunluk ayrıca değerlendirilmelidir.');
    }
    if (rol === 'elci') satirlar.push({ ad: 'Aylık satış örneği', deger: `${sayi(a.elciSatis)} satış × ${tl(komisyon)} = ${tl(a.elciSatis * komisyon)}` });
    aciklama.push('Bu hesap satışın gerçekleştiğini kanıtlamaz. Finans ekibi ödeme koşullarını ayrıca doğrular.');
    aciklama.push('Kesintiler sonrası elinize geçecek tutar bu hesapta belirlenmez. Vergi ve belge koşulları ayrıca yazılır.');
  }
  return { urun: marka === 'istoc' ? 'iStoc' : 'Segika', satirlar, aciklama };
}

function ikinciSurum(rol: RolId, marka: v2.Marka): HesapOrnegi {
  const a = { ...v2.VARSAYILAN_AYAR, marka };
  const satirlar: HesapOrnegi['satirlar'] = [];
  const aciklama = ['Bu bölüm ikinci sürümün yayımlanan varsayılanını gösterir. Ana örnekle birleştirilmez.'];
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
    aciklama.push('Bu sürümde ilk iki ay kota yoktur. Hesap üçüncü aydan itibaren geçerli örnektir.');
    aciklama.push('İlk iki ayın prim hesabı açıklanmamıştır. Çalışan ağ payı veya kampanya ödülü almaz.');
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
    aciklama.push(`Katkı seçimi ${v2.SEVIYE_ADI[a.katki].toLocaleLowerCase('tr-TR').replace('demo', 'ürün gösterimi')} olarak alınır.`);
  }
  aciklama.push('Model eğitim ve sözleşme koşullarını tamamlanmış varsayabilir. Gerçek kayıtları ortaklık sorumlusu kontrol etmelidir.');
  aciklama.push('Yıllık tahmin, gerçekleşmiş satış veya kazanılmış seviye değildir.');
  return { urun: marka === 'istoc' ? 'iStoc' : 'Segika', satirlar, aciklama };
}

export function rehberHesabi(rol: RolId): RehberHesabi {
  const a = v1.VARSAYILAN_AYAR;
  const programlar = KOSULLAR[rol].filter((k) => k.id !== 'ana').map((k) => {
    const sonuc = kosulSonucu({ ...a, marka: k.marka[0], kosul: { [rol]: k.id } }, rol)!;
    // Eski ağ örneğinin kişi adları ve kategorik hukuk iddiası rehbere taşınmaz.
    const kurallar = sonuc.kurallar.map((kural) => kural.includes('6502')
      ? 'Kazanç yalnız gerçek satıştan doğar. Kişi eklemek tek başına kazanç sağlamaz. Hukuki uygunluk ayrıca değerlendirilir.'
      : kural.replace('kademe fiyatı, yalnız onunla ilgilenen bir ortak başarı yöneticisini, ortak pazarlama fonunu ve API erişimini, yani yazılımını doğrudan bağlama imkânını alır.', 'kademe fiyatı alır. Ofise bir ortak başarı yöneticisi atanır. Ofis ortak pazarlama fonunu da kullanır. API erişimiyle yazılımını doğrudan bağlayabilir.'));
    return { id: k.id, ad: k.ad, urun: k.marka[0] === 'istoc' ? 'iStoc' : 'Segika', etiket: k.id === 'ag' ? 'Aylık örnek ağ kazancı' : sonuc.etiket,
      donem: sonuc.ozetBirim.replace(/^\/\s*/, ''), sonuc: sonuc.deger,
      aciklama: k.id === 'ag'
        ? `Örnekte her ortak ayda ${a.agAltSatis} satış yapar. Her ortak ${a.agAltTemsilci} yeni ortak getirir. Ağ payı ${a.agDerinlik} kademe için hesaplanır.`
        : sonuc.aciklama,
      hesap: sonuc.hesap, kurallar };
  });
  const odeme = rol === 'tavsiye'
    ? ['Ücretsiz kullanımın hangi faturaya uygulanacağını finans sorumlusu bildirmelidir.', 'İptal, paket değişimi ve kullanılmayan süre için yazılı kural gerekir.']
    : rol === 'kadrolu'
      ? ['Prim için tahsilat ve iade koşullarının tamamlanması gerekir.', 'Ödeme günü ile iade süresini finans ekibi prim ekinde belirtmelidir.']
      : [`Hesaplayıcı ilk ödeme için komisyonun ${yuzde(a.ilkOdeme)} oranını kullanır.`,
         `İlk ödeme ${a.ilkGun}. gün, kalan ödeme ${a.kalanGun}. gün olarak gösterilir.`,
         'Gün sayımının hangi olayla başlayacağı açık değildir. Finans sorumlusu başlangıç olayını sözleşmeye yazmalıdır.',
         'Tahsilat ve iade koşulları doğrulanmadan ödeme kesinleşmiş sayılmaz.'];
  return {
    ornekler: (['istoc', 'segika'] as const).map((m) => ornek(rol, m)), odeme,
    digerSurum: (['istoc', 'segika'] as const).map((m) => ikinciSurum(rol, m)), programlar,
    plan: [
      `Genel planda saha satış ekibi ${DEFAULT_PARAMS.sahaCount} kişi olarak başlar. Bu sayı işe alındığını kanıtlamaz.`,
      `Satıcı kazanımı için aylık reklam planı ${tl(DEFAULT_PARAMS.dijitalAdBudgetMonthly)} tutarındadır. Bu tutar harcama izni değildir.`,
      'Bütçe sıfırsa ücretli reklam başlatmayın. Onaylı bütçe varsa harcama sınırını sorumluyla belirleyin.',
      'Görevi devralacak çalışan yoksa yeni teslim tarihi vermeyin. Operasyon yöneticisi kabul edecek kişiyi belirlesin.',
      `Genel planın avro kuru ${tl(DEFAULT_PARAMS.eurTry)} tutarındadır. Satış hesabı ${tl(a.kur)} kullanır.`,
      'Bu iki kaynağı aynı ödeme hesabında karıştırmayın. Finans sorumlusu sözleşmede kullanılacak kuru belirlesin.',
      'Başlangıç tarihi veya kapasite değişirse açık işlerin takvimini yeniden değerlendirin.',
    ],
  };
}
