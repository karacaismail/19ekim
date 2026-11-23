/**
 * Segika iş ortaklığı setinin ortak içeriği ve hesapları.
 * Metin `metin.md` dosyasından gelir. Sayılar aşağıdaki kaynaklardan gelir ve burada yeniden hesaplanır:
 * - Oranlar ve eşikler: src/data/kazancPlani.ts (projeVarsayilani('segika'), SABIT_KURALLAR, PROJE_VARSAYILANI).
 * - Paket fiyatları: src/data/satisOrtakligi.ts (segikaFiyat) ve segika.com/program-ozellikleri/fiyatlandirma.
 * - Eğitim, tavsiye ödülü, kadrolu prim: src/data/satisOrtakligi.ts VARSAYILAN_AYAR ve src/data/politikalar/hesap.ts.
 * - Ölçek sayıları: segika.com ana sayfa ve "Hakkımızda", 23 Kasım 2026 Pazartesi günü okundu.
 * Her hesap `sagla` ile denetlenir. Sağlama tutmazsa üretim durur.
 */

export const TARIH = '23 Kasım 2026 Pazartesi günü';

const sayi = (n) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n);
export const tl = (n) => `${sayi(n)} TL`;
export const yuzde = (o) => `%${sayi(Math.round(o * 1000) / 10)}`;
function sagla(kosul, ne) { if (!kosul) throw new Error(`Sağlama tutmadı: ${ne}`); }

/* ---------- Kaynak değerler ---------- */
export const PAKETLER = [
  { ad: 'SGK Teşvik', fiyat: 1850, kisa: 'Teşvik hesabı ve raporları' },
  { ad: 'SGK Otomasyon', fiyat: 1600, kisa: 'Her ay tekrarlanan bildirimler' },
  { ad: 'SGK Teşvik ve Otomasyon', fiyat: 2600, kisa: 'İkisi birlikte' },
];
export const PLAN = {
  kapatir: { taban: 0.15, esik: [30000, 70000, 120000], artis: [0.05, 0.05, 0.05], yillar: [0.10, 0.07, 0.05] },
  tanistir: { taban: 0, esik: [30000, 70000, 100000], artis: [0.07, 0.03, 0.05], yillar: [0.05, 0.025] },
  tanistirmaSuresiAy: 6,
};
export const EGITIM = { ucretsizSaat: 8, saatUcreti: 1500 };
export const TAVSIYE = { krediAy: 2, yeniKrediAy: 1, yillikSinir: 3, gun: 60 };
export const KADROLU = { maas: 50000, kotaCarpan: 2, primOrani: 0.10, ornekPaket: 5 };
export const OLCEK = [
  { sayi: '20.000+', birim: 'firma', metin: 'Her ay 20.000\'den fazla firma Segika ile işlem yapıyor.' },
  { sayi: '1,7 milyon+', birim: 'çalışan', metin: 'Her ay 1.700.000\'den fazla çalışan için işlem yapılıyor.' },
  { sayi: '8.000+', birim: 'sağlık raporu', metin: 'Her ay 8.000\'den fazla sağlık raporu kendiliğinden onaylanıyor.' },
];

/* ---------- Hesaplar ---------- */
export function basamaklar(tur) {
  const p = PLAN[tur];
  const liste = [{ ad: 'Başlangıç', esik: 0, oran: p.taban }];
  let oran = p.taban;
  p.esik.forEach((e, i) => { oran = Math.round((oran + p.artis[i]) * 10000) / 10000; liste.push({ ad: `K${i + 1}`, esik: e, oran }); });
  return liste;
}
export function oranBul(tur, ciro) {
  return basamaklar(tur).filter((b) => ciro >= b.esik).at(-1).oran;
}
const KAP = basamaklar('kapatir');
const TAN = basamaklar('tanistir');
sagla(KAP.map((b) => b.oran).join() === '0.15,0.2,0.25,0.3', 'kapatma basamakları %15 %20 %25 %30');
sagla(TAN.map((b) => b.oran).join() === '0,0.07,0.1,0.15', 'tanıştırma basamakları %0 %7 %10 %15');

const paket = PAKETLER[2].fiyat;
const yillik = paket * 12;
sagla(yillik === 31200, 'yıllık paket 31.200');
const ciro2 = yillik * 2;
const oran2 = oranBul('kapatir', ciro2);
const kazanc2 = Math.round(ciro2 * oran2);
sagla(ciro2 === 62400 && oran2 === 0.2 && kazanc2 === 12480, 'örnek 2 işveren');
const yilTutarlari = PLAN.kapatir.yillar.map((o) => Math.round(ciro2 * o));
sagla(yilTutarlari.join() === '6240,4368,3120', 'sonraki yıllar');
const dortYil = kazanc2 + yilTutarlari.reduce((a, b) => a + b, 0);
sagla(dortYil === 26208, 'dört yıl toplamı');

export const ORNEK = {
  paket, yillik, isveren: 2, ciro: ciro2, oran: oran2, kazanc: kazanc2,
  yillar: [
    { ad: '1. yıl', oran: oran2, tutar: kazanc2 },
    ...PLAN.kapatir.yillar.map((o, i) => ({ ad: `${i + 2}. yıl`, oran: o, tutar: yilTutarlari[i] })),
  ],
  toplam: dortYil,
};

export const ISVEREN_SAYISI = [1, 2, 3, 4].map((n) => {
  const ciro = yillik * n;
  const oran = oranBul('kapatir', ciro);
  return { n, ciro, oran, kazanc: Math.round(ciro * oran) };
});
sagla(ISVEREN_SAYISI.map((x) => x.kazanc).join() === '6240,12480,23400,37440', 'işveren sayısına göre kazanç');

const tOran = oranBul('tanistir', ciro2);
const tanistiran = Math.round(ciro2 * tOran);
const kapatanOran = Math.round((oran2 - tOran) * 10000) / 10000;
const kapatan = Math.round(ciro2 * kapatanOran);
sagla(tanistiran === 4368 && kapatan === 8112 && tanistiran + kapatan === kazanc2, 'bölüşme');
export const BOLUSME = { ciro: ciro2, tOran, tanistiran, kapatanOran, kapatan, toplam: tanistiran + kapatan };

const elciYillar = PLAN.tanistir.yillar.map((o) => Math.round(ciro2 * o));
sagla(elciYillar.join() === '3120,1560', 'elçi sonraki yıllar');
export const ELCI = { ciro: ciro2, oran: tOran, kazanc: tanistiran, yillar: elciYillar, toplam: tanistiran + elciYillar[0] + elciYillar[1] };
sagla(ELCI.toplam === 9048, 'elçi üç yıl toplamı');

const kota = KADROLU.maas * KADROLU.kotaCarpan;
const kCiro = yillik * KADROLU.ornekPaket;
const asan = Math.max(0, kCiro - kota);
const prim = Math.round(asan * KADROLU.primOrani);
sagla(kota === 100000 && kCiro === 156000 && asan === 56000 && prim === 5600, 'kadrolu prim');
export const KADROLU_ORNEK = { maas: KADROLU.maas, kota, ciro: kCiro, asan, prim, toplam: KADROLU.maas + prim };

const kredi = paket * TAVSIYE.krediAy;
sagla(kredi === 5200 && kredi * TAVSIYE.yillikSinir === 15600, 'tavsiye ödülü');
export const TAVSIYE_ORNEK = { kredi, yillik: kredi * TAVSIYE.yillikSinir };

/* ---------- Metin parçaları (metin.md ile aynı) ---------- */
export const M = {
  kapak: {
    kanca: 'Müşteriniz her ay bordrosunu size getiriyor.',
    kanca2: 'Teşvik kontrolünü de aynı görüşmede yapabilirsiniz.',
    davet: 'Segika iş ortaklığı programına davetlisiniz.',
    kitle: 'Bu davet mali müşavirler ve insan kaynakları danışmanları içindir.',
    tesvik: 'Teşvik, devletin işverene verdiği destektir. Sigorta prim desteği buna bir örnektir.',
  },
  neden: {
    kanca: 'Hangi işi her ay yeniden yapıyorsunuz?',
    p: [
      'Mali müşavir her ay bordro hazırlar.',
      'İnsan kaynakları danışmanı her ay işe giriş ve çıkış izler.',
      'Bu işin içinde teşvik kontrolü de vardır.',
    ],
    siz: [
      'Müşterinizi zaten tanıyorsunuz.',
      'Çalışan sayısını ve bordro düzenini biliyorsunuz.',
      'Segika\'yı en doğru anlatacak kişi sizsiniz.',
    ],
    soru: '“Bu yeni çalışan için teşvik alabilir miyiz?”',
    soruAlt: 'Bu soru her ay bordroyla birlikte gelir. Segika teşvik hesabını dakikalar içinde yapar.',
    sizinIcin: [
      { b: 'Portföyünüz', m: 'Bordrosunu yaptığınız her işveren Segika kullanabilir. Bu işverenleri zaten tanıyorsunuz.' },
      { b: 'Her ayki işiniz', m: 'Teşvik sorusunu aylık bordro kapanışında sorabilirsiniz. Bu konuşma mevcut hizmet ilişkiniz içinde olur.' },
      { b: 'Ek hizmetiniz', m: 'Kurulum, eğitim ve destek sizin hizmetinizdir. Kendi hizmet bedeliniz varsa teklifte ayrı gösterilir.' },
    ],
    kimler: [
      'Ofisinize bordro yaptıran 10 ile 50 çalışanlı mükellef',
      'Yaz sezonunda 20 ile 100 işçi alan otel',
      '3 ile 10 şubeli temizlik veya güvenlik şirketi',
      'Organize sanayi bölgesindeki 50 ile 250 çalışanlı fabrika',
    ],
    kimlerBaslik: 'Kimlere anlatabilirsiniz? Örnekler:',
    mukellef: 'Mükellef, mali müşavirin hizmet verdiği firmadır.',
    olcekGiris: 'Segika bu işleri her ay büyük ölçekte yapıyor.',
    kaynak: 'Sayılar segika.com sitesinde yazıyor. Site 23 Kasım 2026 Pazartesi günü okundu.',
  },
  urun: {
    kanca: 'Müşteriniz bu işleri her ay elle mi yapıyor?',
    tanim: 'Segika, Sosyal Güvenlik Kurumu (SGK) işlerini kolaylaştıran bir programdır. Paket adlarındaki SGK bu kurumu anlatır.',
    isler: [
      { b: 'Teşvik hesabı', m: 'SGK Teşvik paketi teşvik hesabını dakikalar içinde yapar. Raporları da hazırlar.' },
      { b: 'Sağlık raporu', m: 'Sağlık raporları elle onay beklemez. Segika onları kendiliğinden onaylar.' },
      { b: 'Kimlik bildirimi', m: 'Kimlik bildirimi Emniyete ve Jandarmaya kendiliğinden gider.' },
      { b: 'İŞKUR çizelgesi', m: 'İŞKUR işgücü çizelgesi de kendiliğinden bildirilir.' },
    ],
    entegrasyon: 'Segika Luca, Mikro ve ETA programlarıyla birlikte çalışır.',
    entegrasyonPaket: 'Bu bağlantı Teşvik ve Otomasyon paketindedir.',
    kanca2: 'Segika dört işi kendiliğinden yapar.',
    paketAyrimi: 'Teşvik hesabı SGK Teşvik paketindedir. Bildirimler SGK Otomasyon paketindedir. İkisi birlikte Teşvik ve Otomasyon paketindedir.',
    fiyatNot: 'Fiyatlar segika.com sitesindedir. Fiyatlar 25 çalışan için aylıktır. Bu belgede fiyatlar KDV hariç sayılır.',
    kdv: 'KDV, katma değer vergisinin kısa adıdır.',
    teklif: '500\'den fazla çalışan için Segika ayrıca teklif verir.',
    ayni: 'Fiyat herkes için aynıdır. Siz fiyatı değiştiremezsiniz.',
  },
  surec: {
    kanca: 'İlk görüşmeden ilk ödemeye 6 adım.',
    adimlar: [
      { b: 'Programı seçin', m: 'Ortaklık sorumlusu yapacağınız işi sizinle belirler.', kim: 'Siz ve ortaklık sorumlusu' },
      { b: 'Meslek kuralını doğrulatın', m: 'Hukuk danışmanı ortaklığın uygunluğunu inceler.', kim: 'Hukuk danışmanı' },
      { b: 'İhtiyacı sorun', m: 'Bunu aylık bordro kapanışında yapabilirsiniz.', kim: 'Siz' },
      { b: 'Kaydı açtırın', m: 'Segika her firmayı yalnız bir ortağın kaydına yazar.', kim: 'Ortaklık sorumlusu' },
      { b: 'Gösterin ve satışı kapatın', m: 'Örnek veri kullanın. Gerçek çalışan bilgisi kullanmayın.', kim: 'Siz' },
      { b: 'Kurulumu yapın, destek verin', m: 'Kazancınız için Segika\'ya fatura kesin.', kim: 'Siz' },
    ],
    kayit: [
      'Kayıt kabul edilmeden müşteriyi kendinize ait saymayın.',
      'Tanıştırma, müşteri takip sistemine kaydedilir. Bu kayıt 6 ay geçerlidir.',
    ],
  },
  kazanc: {
    kanca: 'Oranınızı aylık cironuz belirler.',
    ciro: 'Ciro, getirdiğiniz müşterilerin ödediği paket bedelidir. Ciro KDV hariç sayılır.',
    kapatir: 'Satışı kapatırsanız taban oranınız %15\'tir. Satışı kapatan kişi ürünü gösterir. Kurulumu ve ilk eğitimi de yapar.',
    tanistir: 'Yalnız tanıştırırsanız 30.000 TL altındaki aylık cirodan pay oluşmaz.',
    tamami: 'Ulaştığınız oran cironun tamamına uygulanır.',
    esik: 'Bu oranlar ve eşikler bugünkü plandır. Kesin değerler yazılı anlaşmada belirlenir.',
    surer: 'Müşteri sonraki yıllarda da öderse pay sürer. Satışı kapattıysanız müşteriye destek vermeyi sürdürmelisiniz. Destek vermediğiniz ay için pay oluşmaz.',
    hakDegil: 'Yıllara yayılan tutar örnektir. Kazanılmış hak sayılmaz.',
    yilKapatir: 'Satışı kapatanın payı 2. yılda %10, 3. yılda %7, 4. yılda %5 olur.',
    yilTanistir: 'Tanıştıranın payı 2. yılda %5, 3. yılda %2,5 olur.',
    k1: 'İlk 12 ayda K1 basamağına ulaşmazsanız 13. aydan sonra pay almazsınız.',
  },
  ornek: {
    kanca: '2 işveren, 1 ay: 12.480 TL.',
    uyari: 'Bu bölüm bir örnektir. Gerçek satış ya da kazanç sözü değildir.',
    esikNot: 'Oran, bugünkü plandaki eşiklere göre hesaplandı. Kesin eşikler yazılı anlaşmada belirlenir.',
    durum: 'Bir ayda 2 işverene yıllık paket sattığınızı düşünün. Her işverenin 25 çalışanı var. İki işveren de Teşvik ve Otomasyon paketini alıyor.',
    yenile: 'Paket yenilenir ve destek sürerse',
    saglama: 'Sağlama: 12.480 + 6.240 + 4.368 + 3.120 = 26.208.',
    daha: 'Aynı ayda daha çok işveren sattığınızı düşünün. Her işveren yine 31.200 TL öder.',
    bolusme: 'Tanıştıran ve satışı kapatan farklı kişi olabilir. Bu durumda tanıştıranın payı, kapatanın payından düşülür.',
  },
  roller: {
    kanca: 'Dört ortaklık yolu var. Siz hangisisiniz?',
    liste: [
      {
        id: 'cozum', ad: 'Çözüm ortağı',
        kim: 'Mali müşavir, insan kaynakları danışmanı, bordro bürosu',
        ne: 'Gösterir, satışı kapatır, kurar ve destek verir.',
        kazanc: 'Satışı kapatma oranı: %15 ile %30 arası',
        ilk: 'Ortaklık sorumlusuyla programınızı seçin.',
      },
      {
        id: 'kadrolu', ad: 'Kadrolu uzman',
        kim: 'Segika\'nın maaşlı ve sigortalı satış çalışanı',
        ne: 'Gösterir, teklif hazırlar, kurulumu ekibe devreder.',
        kazanc: 'Maaş ve kotayı aşan cironun %10\'u',
        ilk: 'Yazılı görev tanımınızı insan kaynaklarından alın.',
      },
      {
        id: 'tavsiye', ad: 'Mevcut müşteri',
        kim: 'Segika\'yı zaten kullanan firma',
        ne: 'Tanıdığı bir firmaya Segika\'yı önerir.',
        kazanc: 'Uygun tavsiye başına 2 ay ücretsiz kullanım',
        ilk: 'Geçerli koşulu müşteri sorumlusundan yazılı isteyin.',
      },
      {
        id: 'elci', ad: 'Marka elçisi',
        kim: 'İnsan kaynakları ve bordro içeriği üreten kişi',
        ne: 'İçerikle tanıtır, özel bağlantısını paylaşır.',
        kazanc: 'Tanıştırma oranı: %7 ile %15 arası',
        ilk: 'Pazarlama sorumlusundan özel bağlantınızı alın.',
      },
    ],
  },
  ucYol: {
    kanca: 'Satış sizin işiniz değilse de bir yol var.',
    not: 'Tutarlar örnektir. Oranlar ve süreler bugünkü plandır. Kesin değerler yazılı anlaşmada belirlenir.',
    liste: [
      { id: 'kadrolu', ad: 'Kadrolu uzman', kanca: 'Maaşınız var. Kotayı aşınca prim başlar.',
        sayi: tl(KADROLU_ORNEK.prim), sayiAlt: `Bu bir örnektir. Net maaş ${tl(KADROLU_ORNEK.maas)} olsun. Kota ${tl(KADROLU_ORNEK.kota)} olur. Ciro ${tl(KADROLU_ORNEK.ciro)} olursa prim bu kadardır.`,
        ilk: 'Yazılı görev tanımınızı insan kaynaklarından alın.' },
      { id: 'tavsiye', ad: 'Mevcut müşteri', kanca: 'Kullandığınız programı tanıdığınız bir firmaya önerin.',
        sayi: '2 ay', sayiAlt: 'Uygun her tavsiye için ücretsiz kullanım. Nakit değildir. Yeni müşteri yıllık paket alır ve 60 gün kullanır.',
        ilk: 'Geçerli koşulu müşteri sorumlusundan yazılı isteyin.' },
      { id: 'elci', ad: 'Marka elçisi', kanca: 'Kitlenize bordroyu anlatıyor musunuz?',
        sayi: tl(ELCI.kazanc), sayiAlt: `Bu bir örnektir. Bağlantınızdan 2 işveren gelsin. Aylık ciro ${tl(ELCI.ciro)} olur. Oran %7 olur.`,
        ilk: 'Pazarlama sorumlusundan özel bağlantınızı alın.' },
    ],
  },
  kosullar: {
    kanca: 'Kim ne yapar? Sınırlar baştan yazılıdır.',
    biz: [
      'Ürünü, fiyat tablosunu ve teklifi hazırlar.',
      'Müşteri kaydını tek ortağa yazar.',
      'Müşteri takip sistemini sağlar.',
      'Teknik sorunları çözer.',
      'Bugünkü planda yılda 8 saat ücretsiz eğitim verir.',
      'Tahsilatı doğrular ve payınızı öder.',
    ],
    siz: [
      'Müşterinizin ihtiyacını öğrenirsiniz.',
      'Kaydı ortaklık sorumlusuna açtırırsınız.',
      'Ürünü örnek veriyle gösterirsiniz.',
      'Kurulumu ve ilk eğitimi yaparsınız.',
      'Müşteri desteğini verirsiniz.',
      'Kazancınız için fatura kesersiniz.',
    ],
    sinirlar: [
      'Fiyatı değiştirmeyin. İndirim sözü vermeyin.',
      'Teşvik tutarı için söz vermeyin.',
      'Müşterinin SGK ya da bordro şifresini istemeyin.',
      'Yasal dayanak yoksa çalışan bilgisini paylaşmayın.',
      'İletişim izni olmayan kişiye ileti göndermeyin.',
    ],
    musavir: 'Mali müşavirler meslek kurallarına bağlıdır. Hukuk danışmanı komisyonun uygunluğunu inceler. Uygunluk yazılmadan müşteriye ortaklıktan söz etmeyin.',
    nakitsiz: 'Mali müşavir ofisleri için nakitsiz bir yol da planlanıyor. Bu yolda ofis komisyon almaz. Ofis Segika\'yı toptan fiyatla kullanır.',
    bekliyor: 'Bu yol hukuk görüşünü bekliyor. Toptan fiyat bantları yazılı anlaşmada belirlenir. Bu kabul edilmeden müşteriye teklif vermeyin.',
    sartlar: 'Ofis bordro hizmeti vermelidir. Ofis Luca, Mikro ya da ETA kullanmalıdır. Ofis sertifika eğitimini bitirmelidir.',
    seviyeler: [
      { ad: 'Kayıtlı ortak', kosul: 'Ücretsiz', m: 'Ofis 2 saatlik canlı eğitim ve panel alır.' },
      { ad: 'Gümüş', kosul: 'En az 10 aktif mükellef', m: 'Ofis toptan fiyatın 1. kademesini alır.' },
      { ad: 'Altın', kosul: 'En az 50 aktif mükellef', m: 'Ofis toptan fiyatın 2. kademesini alır.' },
    ],
    panel: 'Panel, ofisin getirdiği müşterileri gördüğü ekrandır.',
    ikiYol: 'İki yol birlikte uygulanmaz. Ortaklık sorumlusu size uygun yolu belirler.',
    odeme: 'Müşteri ödemezse pay oluşmaz. Müşteri iade alırsa pay geri alınır. Ödeme günleri yazılı anlaşmada yer alır.',
    egitim: 'Ücretsiz eğitimin fazlası ücretlidir. Bugünkü planda ek eğitimin bir saati 1.500 TL tutar.',
  },
  ilk: {
    kanca: 'İlk adım tek bir görüşmedir.',
    adimlar: [
      'segika.com adresinden Segika’ya ulaşın.',
      'Ortaklık sorumlusuyla görüşün.',
      'Size uyan yolu birlikte seçin.',
      'Yazılı anlaşmayı inceleyin.',
    ],
    not: 'Bu belge bir sözleşme değildir. Koşullar yazılı anlaşmada kesinleşir.',
  },
};
