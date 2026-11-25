/**
 * Segika iş ortaklığı setinin ortak içeriği ve hesapları. 2. revizyon, 24 Kasım 2026 Salı günü.
 * Metin `metin.md` dosyasından gelir. Sayılar aşağıdaki kaynaklardan gelir ve burada yeniden hesaplanır:
 * - Oranlar ve eşikler: src/data/kazancPlani.ts (projeVarsayilani('segika'), SABIT_KURALLAR, PROJE_VARSAYILANI).
 * - 100 çalışan fiyatları: kullanıcının 24 Kasım 2026 Salı günkü kararı. Bu fiyatlar src/data/satisOrtakligi.ts
 *   içindeki segikaFiyat değerlerinden (25 çalışan) farklıdır. Fark README.md dosyasında yazar. src/ değişmedi.
 * - Eğitim ve tavsiye ödülü: src/data/satisOrtakligi.ts VARSAYILAN_AYAR ve src/data/politikalar/segika/.
 * - Ölçek sayıları: Segika tanıtım broşürü, Temmuz 2025 verileri.
 * Her hesap `sagla` ile denetlenir. Sağlama tutmazsa üretim durur.
 */

export const TARIH = '24 Kasım 2026 Salı günü';

const sayi = (n) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n);
export const tl = (n) => `${sayi(n)} TL`;
export const yuzde = (o) => `%${sayi(Math.round(o * 1000) / 10)}`;
function sagla(kosul, ne) { if (!kosul) throw new Error(`Sağlama tutmadı: ${ne}`); }

/* ---------- Kaynak değerler ---------- */
export const CALISAN = 100;
export const PAKETLER = [
  { ad: 'SGK Teşvik', fiyat: 6250, kisa: 'Teşvik hesabı ve raporları' },
  { ad: 'SGK Otomasyon', fiyat: 5400, kisa: 'Her ay tekrarlanan bildirimler' },
  { ad: 'SGK Teşvik ve Otomasyon', fiyat: 8900, kisa: 'İkisi birlikte' },
];
/** segika.com ve segikaFiyat: 25 çalışan için aylık fiyat. Yalnız karşılaştırma için tutulur, belgede yazmaz. */
export const SITE_25 = [1850, 1600, 2600];
sagla(PAKETLER.every((p, i) => p.fiyat < SITE_25[i] * 4), '100 çalışan fiyatı, 25 çalışan fiyatının 4 katından azdır');

export const PLAN = {
  kapatir: { taban: 0.15, esik: [30000, 70000, 120000], artis: [0.05, 0.05, 0.05], yillar: [0.10, 0.07, 0.05] },
  tanistir: { taban: 0, esik: [30000, 70000, 100000], artis: [0.07, 0.03, 0.05], yillar: [0.05, 0.025] },
  tanistirmaSuresiAy: 6,
};
export const EGITIM = { ucretsizSaat: 8, saatUcreti: 1500 };
export const TAVSIYE = { krediAy: 2, yeniKrediAy: 1, yillikSinir: 3, gun: 60 };
export const OLCEK = [
  { sayi: '20.000+', metin: 'Her ay 20.000\'den fazla firma için işlem yapılıyor.' },
  { sayi: '61.000+', metin: 'Her ay 61.000\'den fazla sicil için işlem yapılıyor.' },
  { sayi: '1,7 milyon+', metin: 'Her ay 1.700.000\'den fazla çalışan için işlem yapılıyor.' },
  { sayi: '16.000+', metin: 'Her ay 16.000\'den fazla sicil için otomatik onay yapılıyor.' },
  { sayi: '21.000+', metin: 'Her ay 21.000\'den fazla sicil için iş kazası takip ediliyor.' },
];

/* ---------- Basamaklar ---------- */
export function basamaklar(tur) {
  const p = PLAN[tur];
  const liste = [{ ad: '1. seviye', esik: 0, oran: p.taban }];
  let oran = p.taban;
  p.esik.forEach((e, i) => { oran = Math.round((oran + p.artis[i]) * 10000) / 10000; liste.push({ ad: `${i + 2}. seviye`, esik: e, oran }); });
  return liste;
}
export function oranBul(tur, ciro) {
  return basamaklar(tur).filter((b) => ciro >= b.esik).at(-1).oran;
}
const KAP = basamaklar('kapatir');
const TAN = basamaklar('tanistir');
sagla(KAP.map((b) => b.oran).join() === '0.15,0.2,0.25,0.3', 'kapatma basamakları %15 %20 %25 %30');
sagla(TAN.map((b) => b.oran).join() === '0,0.07,0.1,0.15', 'tanıştırma basamakları %0 %7 %10 %15');

/* ---------- Yıllık satış örneği: 2 işveren, 1 ay ---------- */
const paket = PAKETLER[2].fiyat;
const yillik = paket * 12;
sagla(yillik === 106800, 'yıllık paket 8.900 × 12 = 106.800');
const ciro2 = yillik * 2;
const oran2 = oranBul('kapatir', ciro2);
const kazanc2 = Math.round(ciro2 * oran2);
sagla(ciro2 === 213600 && oran2 === 0.3 && kazanc2 === 64080, 'örnek 2 işveren: 213.600 × %30 = 64.080');
const yilTutarlari = PLAN.kapatir.yillar.map((o) => Math.round(ciro2 * o));
sagla(yilTutarlari.join() === '21360,14952,10680', 'sonraki yıllar 21.360, 14.952, 10.680');
const dortYil = kazanc2 + yilTutarlari.reduce((a, b) => a + b, 0);
sagla(dortYil === 111072, 'dört yıl toplamı 111.072');

export const ORNEK = {
  paket, yillik, isveren: 2, ciro: ciro2, oran: oran2, kazanc: kazanc2,
  yillar: [
    { ad: '1. yıl', oran: oran2, tutar: kazanc2 },
    ...PLAN.kapatir.yillar.map((o, i) => ({ ad: `${i + 2}. yıl`, oran: o, tutar: yilTutarlari[i] })),
  ],
  toplam: dortYil,
};

/* ---------- Oyunlaştırma: seviyeler ---------- */
const ciro1 = yillik;
const seviye1 = KAP.findIndex((b) => b.oran === oranBul('kapatir', ciro1));
const kalan = KAP[seviye1 + 1].esik - ciro1;
sagla(seviye1 === 2 && kalan === 13200, '1 işveren 3. seviyede, sonraki seviyeye 13.200 TL kalır');
sagla(oranBul('kapatir', ciro1 + yillik) === 0.3, '1 işveren daha, oran %30 olur');
const seviye2 = KAP.findIndex((b) => b.oran === oran2);
sagla(seviye2 === 3, 'örnek 2 işveren 4. seviyededir');
export const SEVIYE = {
  liste: KAP.map((b, i) => ({ no: i + 1, ad: b.ad, esik: b.esik, oran: b.oran })),
  /** "Siz buradasınız" işareti sayfanın örneğine aittir: 2 işveren, 4. seviye. */
  ornek: seviye2 + 1,
  bir: { ciro: ciro1, seviye: seviye1 + 1, oran: oranBul('kapatir', ciro1), kalan, sonraki: KAP[seviye1 + 1].oran },
};

/* ---------- Aylık satış örneği: her ay 2 yeni işveren ---------- */
/*
 * Varsayım: aylık ödeyen işverenin o ay ödediği paket bedeli o ayın cirosuna yazılır.
 * kazancPlani.ts aylık ödemeyi iş ortakları için ayrıca tanımlamaz. Kod yalnız "aylık ciro" ve
 * "ulaşılan oran cironun tamamına uygulanır" kuralını tanımlar (KUMULATIF_KURALI). Hiçbir işveren ayrılmaz.
 */
const AYLIK_YENI = 2;
let birikim = 0;
export const AYLIK = Array.from({ length: 12 }, (_, i) => {
  const ay = i + 1;
  const isveren = AYLIK_YENI * ay;
  const ciro = isveren * paket;
  const oran = oranBul('kapatir', ciro);
  const kazanc = Math.round(ciro * oran);
  birikim += kazanc;
  return { ay, isveren, ciro, oran, kazanc, birikim };
});
sagla(AYLIK[0].ciro === 17800 && AYLIK[0].kazanc === 2670, '1. ay: 2 işveren, 17.800 × %15 = 2.670');
sagla(AYLIK[1].oran === 0.2 && AYLIK[3].oran === 0.25 && AYLIK[6].oran === 0.3, 'oran 2. ayda %20, 4. ayda %25, 7. ayda %30');
sagla(AYLIK[11].ciro === 213600 && AYLIK[11].kazanc === 64080, '12. ay: 24 işveren, 213.600 × %30 = 64.080');
sagla(AYLIK[11].birikim === 391600, '12 ayın birikimi 391.600');
sagla(AYLIK.every((a, i) => i === 0 || (a.kazanc > AYLIK[i - 1].kazanc && a.birikim > AYLIK[i - 1].birikim)), 'çubuklar aydan aya yükselir');

/* ---------- Bölüşme ve marka elçisi ---------- */
const tOran = oranBul('tanistir', ciro2);
const tanistiran = Math.round(ciro2 * tOran);
const kapatanOran = Math.round((oran2 - tOran) * 10000) / 10000;
const kapatan = Math.round(ciro2 * kapatanOran);
sagla(tOran === 0.15 && tanistiran === 32040 && kapatan === 32040 && tanistiran + kapatan === kazanc2, 'bölüşme 32.040 + 32.040 = 64.080');
export const BOLUSME = { ciro: ciro2, tOran, tanistiran, kapatanOran, kapatan, toplam: tanistiran + kapatan };

const elciCiro = yillik;
const elciOran = oranBul('tanistir', elciCiro);
const elciKazanc = Math.round(elciCiro * elciOran);
sagla(elciOran === 0.15 && elciKazanc === 16020, 'elçi: 106.800 × %15 = 16.020');
export const ELCI = { ciro: elciCiro, oran: elciOran, kazanc: elciKazanc };

/* ---------- Mevcut müşteri ---------- */
const kredi = paket * TAVSIYE.krediAy;
const yillikAy = TAVSIYE.krediAy * TAVSIYE.yillikSinir;
sagla(kredi === 17800 && yillikAy === 6 && paket * yillikAy === 53400, 'tavsiye: 3 tavsiye 6 ay, 53.400 TL');
export const TAVSIYE_ORNEK = { kredi, ay: yillikAy, yillik: paket * yillikAy, yeni: paket * TAVSIYE.yeniKrediAy };
sagla(TAVSIYE_ORNEK.yeni === 8900, 'tavsiye edilen firma 1 ay: 8.900 TL');

/* ---------- Metin parçaları (metin.md ile aynı) ---------- */
export const M = {
  kapak: {
    baslik: 'Segika iş ortaklığı programı',
    kitapcik: 'İş ortaklığı el kitapçığı',
    sunum: 'İş ortaklığı tanıtım sunumu',
    alt: 'SGK işlerini otomatik yapan programı müşterinize siz tanıtın.',
  },
  acilis: {
    kanca: 'Müşterinizin SGK işleri her ay otomatik yürür.',
    kanca2: 'Teşvik hesabı dakikalar içinde hazır olur.',
    tanim: 'Segika, Sosyal Güvenlik Kurumu (SGK) işlerini otomatik yapan bir programdır.',
    isler: [
      { b: 'Teşvik hesabı', m: 'Segika teşvik hesabını dakikalar içinde yapar. Raporları da hazırlar.' },
      { b: 'Sağlık raporu', m: 'Segika sağlık raporlarını otomatik onaylar. SMS onayı beklemez.' },
      { b: 'Kimlik bildirimi', m: 'Segika kimlik bildirimini Emniyete ve Jandarmaya otomatik gönderir.' },
      { b: 'İŞKUR ve iş kazası', m: 'Segika İŞKUR çizelgesini otomatik bildirir. İş kazasını da takip eder.' },
    ],
    tesvik: 'Teşvik, devletin işverene verdiği destektir. Sigorta prim desteği buna bir örnektir.',
    serit: '12 ay, 12 bordro. Her bordroda bir teşvik kontrolü vardır.',
    cubuk: 'Kazancınız da ay ay birikir. Çubuklar kümülatif kazancı gösterir.',
    kumulatif: 'Kümülatif, üst üste eklenen demektir.',
    cubukNot: `Örnekte her ay 2 yeni işveren aylık paket alır. 12. ayın sonunda birikim ${tl(AYLIK[11].birikim)} olur. Bu bir örnektir. Kazanç sözü değildir.`,
    davet: 'Segika iş ortaklığı programına davetlisiniz.',
  },
  neden: {
    kanca: 'Hangi işi her ay yeniden yapıyorsunuz?',
    p: [
      'Mali müşavir her ay bordro hazırlar.',
      'Danışman her ay işe giriş ve çıkışları izler.',
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
    kimlerBaslik: 'Kimlere anlatabilirsiniz? Örnekler:',
    kimler: [
      'Ofisinize bordro yaptıran 10 ile 100 çalışanlı mükellef',
      'Yaz sezonunda 20 ile 100 işçi alan otel',
      '3 ile 10 şubeli temizlik veya güvenlik şirketi',
      'Organize sanayi bölgesindeki 50 ile 250 çalışanlı fabrika',
    ],
    mukellef: 'Mükellef, mali müşavirin hizmet verdiği firmadır.',
    olcekGiris: 'Segika bu işleri her ay büyük ölçekte yapıyor.',
    sicil: 'Sicil, işyerinin SGK\'daki kaydıdır.',
    kaynak: 'Kaynak: Segika tanıtım broşürü, Temmuz 2025 verileri.',
    beyan: 'Segika broşüründe her ay 360 milyon TL\'den fazla teşvik sağladığını yazıyor. Bu sayı Segika\'nın kendi beyanıdır. Müşterinize teşvik tutarı için söz vermeyin.',
  },
  plan: {
    kanca: 'Şirketinize uygun planı seçin.',
    paketAyrimi: 'Teşvik hesabı SGK Teşvik paketindedir. Bildirimler SGK Otomasyon paketindedir. İkisi birlikte Teşvik ve Otomasyon paketindedir.',
    fiyatNot: 'Fiyatlar 100 çalışan için aylıktır ve KDV hariçtir. Güncel fiyatı Segika\'dan yazılı isteyin.',
    kdv: 'KDV, katma değer vergisinin kısa adıdır.',
    teklif: '500\'den fazla çalışan için Segika ayrıca teklif verir.',
    ayni: 'Fiyat herkes için aynıdır. Siz fiyatı değiştiremezsiniz.',
    kazaNot: 'İş kazası SGK\'ya 3 iş günü içinde bildirilmelidir. Segika bu süreyi takip eder ve e-postayla hatırlatır.',
  },
  surec: {
    kanca: 'İlk görüşmeden ilk ödemeye kadar 6 adım vardır.',
    adimlar: [
      { b: 'Programı seçin', m: 'Ortaklık sorumlusu yapacağınız işi sizinle belirler.', kim: 'Siz ve ortaklık sorumlusu' },
      { b: 'Meslek kuralınızı doğrulatın', m: 'Hukuk danışmanı ortaklığın uygunluğunu inceler.', kim: 'Hukuk danışmanı' },
      { b: 'İhtiyacı sorun', m: 'Bunu aylık bordro kapanışında yapabilirsiniz.', kim: 'Siz' },
      { b: 'Kaydı açtırın', m: 'Segika her firmayı yalnız bir ortağın kaydına yazar.', kim: 'Ortaklık sorumlusu' },
      { b: 'Gösterin ve satışı kapatın', m: 'Örnek veri kullanın. Gerçek çalışan bilgisi kullanmayın.', kim: 'Siz' },
      { b: 'Kurulumu yapın ve destek verin', m: 'Kazancınız için Segika\'ya fatura kesin.', kim: 'Siz' },
    ],
    kayit: [
      'Kayıt kabul edilmeden müşteriyi kendinize ait saymayın.',
      'Ortaklık sorumlusu tanıştırmayı müşteri takip sistemine kaydeder. Bu kayıt 6 ay geçerlidir.',
      'Kurulumdan önce çalışan verisine erişimin yasal dayanağı yazılır.',
    ],
    musavir: 'Mali müşavirler meslek kurallarına bağlıdır. Hukuk danışmanı komisyonun uygunluğunu inceler. Uygunluk yazılmadan müşteriye ortaklıktan söz etmeyin.',
    nakitsizBaslik: 'Mali müşavir ofisleri için nakitsiz yol',
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
  },
  kazanc: {
    kanca: 'Oranınızı aylık cironuz belirler.',
    kancaKisa: 'Aylık cironuz büyüdükçe oranınız %15\'ten %30\'a çıkar.',
    ciro: 'Ciro, getirdiğiniz müşterilerin ödediği paket bedelidir. Ciro KDV hariç sayılır.',
    kapatir: 'Satışı kapatırsanız taban oranınız %15\'tir. Satışı kapatan kişi ürünü gösterir. Kurulumu ve ilk eğitimi de yapar.',
    tamami: 'Ulaştığınız oran cironun tamamına uygulanır.',
    tablo: 'Tablodaki tutarlar aylık cirodur.',
    esik: 'Bu oranlar ve eşikler bugünkü plandır. Kesin değerler yazılı anlaşmada belirlenir.',
    surer: 'Müşteri sonraki yıllarda da öderse pay sürer. Satışı kapattıysanız müşteriye destek vermeyi sürdürmelisiniz. Destek vermediğiniz ay için pay oluşmaz.',
    hakDegil: 'Yıllara yayılan tutar örnektir. Kazanılmış hak sayılmaz.',
    yilKapatir: 'Satışı kapatanın payı 2. yılda %10, 3. yılda %7, 4. yılda %5 olur.',
    yilTanistir: 'Tanıştıranın payı 2. yılda %5, 3. yılda %2,5 olur.',
    k1: 'İlk 12 ayda 2. seviyeye ulaşmazsanız 13. aydan sonra pay almazsınız.',
    bolusme: 'Tanıştıran ve satışı kapatan farklı kişi olabilir. Bu durumda tanıştıranın payı, kapatanın payından düşülür.',
    bolusmeToplam: `Toplam oran ${yuzde(ORNEK.oran)} kalır.`,
  },
  yillik: {
    ust: 'Yıllık satış',
    kanca: `2 işveren, 1 ay: ${tl(ORNEK.kazanc)}.`,
    uyari: 'Bu sayfa bir örnektir. Gerçek satış ya da kazanç sözü değildir.',
    durum: `Bir ayda 2 işverene yıllık paket sattığınızı düşünün. Her işverenin ${CALISAN} çalışanı var. İki işveren de Teşvik ve Otomasyon paketini alıyor.`,
    hesap: `Hesap şöyledir: ${tl(paket)} × 12 = ${tl(yillik)}. Sonra ${tl(yillik)} × 2 = ${tl(ciro2)}. Sonra ${tl(ciro2)} × ${yuzde(oran2)} = ${tl(kazanc2)}.`,
    seviyeBaslik: 'Her seviye oranınızı artırır.',
    buradasiniz: 'Siz buradasınız',
    yol: '1. işveren sizi 3. seviyeye taşır. 2. işveren sizi 4. seviyeye taşır.',
    birIsveren: `1. işverenin cirosu ${tl(ciro1)} olur. 4. seviyeye ${tl(kalan)} kalır.`,
    varsayim: 'Yıllık paketin bütün bedeli satışın yapıldığı ayın cirosuna yazılır. Kesin kural yazılı anlaşmada belirlenir.',
    dortYil: '4 yıla kadar süren pay',
    dortYilAlt: 'Pay, müşteri ödedikçe ve siz destek verdikçe sürer.',
    toplam: `Dört yılın toplamı ${tl(dortYil)} olur.`,
    saglama: `Sağlama şöyledir: ${[kazanc2, ...yilTutarlari].map(sayi).join(' + ')} = ${sayi(dortYil)}.`,
    esikNot: 'Oran, bugünkü plandaki eşiklere göre hesaplandı. Kesin eşikler yazılı anlaşmada belirlenir.',
  },
  aylik: {
    ust: 'Aylık satış',
    kanca: 'Aylık satışta kazancınız kümülatif büyür.',
    kumulatif: 'Kümülatif, üst üste eklenen demektir.',
    uyari: 'Bu sayfa bir örnektir. Gerçek satış ya da kazanç sözü değildir.',
    durum: `Her ay 2 yeni işveren aylık paket alsın. Her işverenin ${CALISAN} çalışanı var. Her işveren Teşvik ve Otomasyon paketini alır ve her ay ${tl(paket)} öder.`,
    neden: 'Önceki ayların işverenleri ödemeye devam eder. Yeni işverenler bunların üstüne eklenir. Bu yüzden aylık ciro her ay büyür.',
    oran: 'Ciro büyüdükçe oran da artar. Oran 2. ayda %20, 4. ayda %25, 7. ayda %30 olur.',
    sonuc: `12. ayda 24 işveren olur. O ayın kazancı ${tl(AYLIK[11].kazanc)} olur. 12 ayın birikimi ${tl(AYLIK[11].birikim)} olur.`,
    varsayim: 'Örnek bir varsayıma dayanır. Aylık ödeyen işverenin o ay ödediği bedel o ayın cirosuna yazılır. Kazanç planı aylık ödemeyi ayrıca tanımlamıyor. Örnekte hiçbir işveren ayrılmaz. Kesin kural yazılı anlaşmada belirlenir.',
  },
  roller: {
    kanca: 'Üç ortaklık yolu var. Siz hangisisiniz?',
    baslik: 'Üç ortaklık yolu',
    liste: [
      {
        id: 'cozum', ad: 'Çözüm ortağı',
        kim: 'Mali müşavir, danışman, bordro bürosu',
        ne: 'Gösterir, satışı kapatır, kurar ve destek verir.',
        kazanc: 'Satışı kapatma oranı: %15 ile %30 arası',
        ilk: 'Ortaklık sorumlusuyla programınızı seçin.',
      },
      {
        id: 'tavsiye', ad: 'Mevcut müşteri',
        kim: 'Segika\'yı zaten kullanan firma',
        ne: 'Tanıdığı bir firmayı Segika ile tanıştırır.',
        kazanc: 'Yılda 3 uygun tavsiye ile 6 ay ücretsiz kullanım',
        ilk: 'Geçerli koşulu müşteri sorumlusundan yazılı isteyin.',
      },
      {
        id: 'elci', ad: 'Marka elçisi',
        kim: 'Bordro ve çalışma hayatı içeriği üreten kişi',
        ne: 'İçerikle tanıtır, özel bağlantısını paylaşır.',
        kazanc: 'Tanıştırma oranı: %7 ile %15 arası',
        kazancNot: '30.000 TL cironun altında pay oluşmaz.',
        ilk: 'Pazarlama sorumlusundan özel bağlantınızı alın.',
      },
    ],
    cozum: 'Siz işverene bordro, danışmanlık ya da iş güvenliği hizmeti verirsiniz. Segika\'yı müşterinize gösterirsiniz. Satışı kapatırsınız. Kurulumu ve müşteri desteğini siz verirsiniz.',
    cozumEgitim: 'Bugünkü planda Segika size ve destek personelinize her yıl 8 saat ücretsiz eğitim verir.',
    elci: 'Siz Segika\'yı kitlenize anlatırsınız. Her ticari paylaşımın başına “reklam” yazarsınız. İlgilenen işveren size özel bağlantıyla başvurur.',
    elciHesap: `Bağlantınızdan 1 işveren yıllık paket alsın. Ciro ${tl(elciCiro)} olur. Bu ciro 100.000 TL eşiğini geçer. Oran ${yuzde(elciOran)} olur.`,
    not: 'Bu sayfadaki tutarlar örnektir. Oranlar ve süreler bugünkü plandır. Kesin değerler yazılı anlaşmada belirlenir.',
  },
  musteri: {
    ust: 'Mevcut müşteri',
    kanca: 'Yılda 3 tavsiye, 6 ay ücretsiz Segika.',
    giris: 'Firmanız Segika\'yı zaten kullanıyor. Memnunsanız bunu tanıdığınız bir firmaya söyleyin.',
    satisYok: 'Siz satış yapmazsınız. Yalnız tanıştırırsınız. Satışı, kurulumu ve desteği Segika yürütür.',
    kural: 'Uygun her tavsiye için 2 ay ücretsiz kullanım alırsınız. Yılda en çok 3 tavsiye sayılır. 3 tavsiye 6 ay eder.',
    hesap: `Firmanızda ${CALISAN} çalışan olsun. Teşvik ve Otomasyon paketini kullanın. Aylık bedel ${tl(paket)} olur. 6 ay ücretsiz kullanım ${tl(paket * yillikAy)} eder.`,
    yeni: `Tavsiye ettiğiniz firma da 1 ay ücretsiz kullanır. 100 çalışanlı bir firma için bu ${tl(paket)} eder.`,
    kosul: 'Tavsiyenin uygun sayılması için iki koşul vardır. Yeni müşteri yıllık paket alır. Yeni müşteri 60 gün kullanmaya devam eder.',
    nakit: 'Ödülünüz nakit değildir. Ödülünüz ücretsiz kullanımdır.',
    yazili: 'Mevcut müşterinin geçerli koşulunu müşteri sorumlusu tavsiyeden önce yazılı bildirir.',
    ilk: 'Geçerli koşulu müşteri sorumlusundan yazılı isteyin.',
    ilkAdim: 'İlk adımda geçerli koşulu müşteri sorumlusundan yazılı isteyin.',
  },
  sozler: {
    kanca: 'Birbirimize verdiğimiz sözler.',
    giris: 'Bu sayfa ilişkimizin kurallarını anlatır. Her iki taraf da sözünü tutar.',
    segika: [
      'Segika ürünü, fiyat tablosunu ve teklifi hazırlar.',
      'Segika her müşteriyi yalnız bir ortağın kaydına yazar.',
      'Segika müşteri takip sistemini sağlar.',
      'Segika teknik sorunları çözer.',
      'Segika bugünkü planda yılda 8 saat ücretsiz eğitim verir.',
      'Segika tahsilatı doğrular ve payınızı öder.',
    ],
    siz: [
      'Siz müşterinin ihtiyacını öğrenir ve kaydı açtırırsınız.',
      'Siz ürünü örnek veriyle gösterirsiniz.',
      'Siz kurulumu, ilk eğitimi ve desteği verirsiniz.',
      'Siz fiyatı değiştirmez ve indirim sözü vermezsiniz.',
      'Siz teşvik tutarı için söz vermezsiniz.',
      'Siz müşterinin SGK ya da bordro şifresini istemezsiniz.',
      'Siz yasal dayanak olmadan çalışan bilgisini paylaşmazsınız.',
      'Siz iletişim izni olmayan kişiye ileti göndermezsiniz.',
      'Siz kazancınız için fatura kesersiniz.',
    ],
    ortakBaslik: 'İkimiz için de geçerli kurallar',
    ortak: [
      'Müşteri ödemezse pay oluşmaz. Müşteri iade alırsa pay geri alınır.',
      'Ödeme günleri yazılı anlaşmada yer alır.',
      'Ücretsiz eğitimin fazlası ücretlidir. Bugünkü planda ek eğitimin bir saati 1.500 TL tutar.',
      'Destek vermediğiniz ay için pay oluşmaz.',
      'Kayıt kabul edilmeden müşteri size ait sayılmaz.',
      'Mali müşavir, uygunluk yazılmadan müşteriye ortaklıktan söz etmez.',
    ],
    bag: 'Bu taahhütler yazılı anlaşmanın özüdür. Taahhütler, imzalanan anlaşmayla bağlayıcı olur. Bu belge tek başına sözleşme değildir.',
  },
  ilk: {
    kanca: 'İlk adım tek bir görüşmedir.',
    adimlar: [
      'segika.com adresinden Segika\'ya ulaşın.',
      'Ortaklık sorumlusuyla görüşün.',
      'Size uyan yolu birlikte seçin.',
      'Yazılı anlaşmayı inceleyin.',
    ],
    not: 'Bu belge bir sözleşme değildir. Koşullar yazılı anlaşmada kesinleşir.',
  },
};
