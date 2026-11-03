/**
 * Satış ortaklığı programı (/satis-ortakligi/; kullanıcı kararı 2026-11-03): iStoc ve Segika için beş ortak rolü.
 * Standart e-ticaret affiliate’i değil, profesyonellerle ortaklık. Yıllık paket satışında hakediş peşin ödenir.
 * Fiyatlar: iStoc 399 €/ay (kullanıcı); Segika segika.com/program-ozellikleri/fiyatlandirma (25 çalışana kadar, aylık;
 * 3 Kasım 2026). Kur kullanıcının verdiği günlük değerdir.
 */

export type Marka = 'istoc' | 'segika';

export interface Satir {
  ad: string;
  deger: string;
}

export interface Rol {
  id: string;
  ad: string;
  /** Kim: rolün tanımı. */
  kim: string;
  /** Role söylenecek mesaj. */
  mesaj: string;
  hedefler: Satir[];
  kazanc: Satir[];
  /** Ortak olabilecek kurumlar (profesyonel danışman rolü). */
  liste?: { baslik: string; ogeler: Satir[] };
}

export const KUR = 56.02;
const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;
const eur = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v)} €`;
const yakl = (v: number) => `≈ ${tl(Math.round(v / 50) * 50)}`;

/* Ortak kurallar */
const SATIS_PRIMI = 2_500;
const GUN = 26;
const MAAS = 50_000;
const KOTA = MAAS * 2 * 1.2;

/* iStoc */
const ISTOC_AY_EUR = 399;
const ISTOC_YIL_AY = 10;
const ISTOC_YIL_EUR = ISTOC_AY_EUR * ISTOC_YIL_AY;

/* Segika (25 çalışana kadar, aylık) */
const SEGIKA = { tesvik: 1_850, otomasyon: 1_600, ikisi: 2_600 };
const SEGIKA_YIL = SEGIKA.ikisi * 12;

const kademeler = (gunluk: number[]): Satir[] =>
  gunluk.map((g, i) => ({
    ad: `${['Başlangıç', 'Gelişen', 'Usta'][i]} · günde ${g} satış`,
    deger: `ayda ${g * GUN} satış → ${tl(g * GUN * SATIS_PRIMI)}`,
  }));

const genc = (marka: Marka): Rol => ({
  id: 'genc-temsilci',
  ad: 'Genç satış temsilcisi',
  kim:
    marka === 'istoc'
      ? 'Persona: Deniz, 23 · üniversite öğrencisi ya da yeni mezun, 30 yaş altı. Henüz bir mesleğe yerleşmemiş; kazancını kendi temposuyla belirlemek, satışla kariyere başlamak istiyor. İstoç’ta dükkân dükkân dolaşabilir.'
      : 'Persona: Deniz, 23 · üniversite öğrencisi ya da yeni mezun, 30 yaş altı. Henüz bir mesleğe yerleşmemiş; kazancını kendi temposuyla belirlemek, satışla kariyere başlamak istiyor. OSB, sanayi sitesi ve muhasebe bürolarını telefonla ve yerinde arar.',
  mesaj: `Kazancın senin performansın: her yıllık paket satışında ${tl(SATIS_PRIMI)}, satış onaylanınca peşin. Pazartesi–cumartesi, ayda ${GUN} gün; hedefini sen seçersin.`,
  hedefler: [
    ...kademeler([2, 3, 5]),
    marka === 'istoc'
      ? { ad: 'Günlük iş', deger: '25 dükkân ziyareti → 6 tanıtım → 2 satış' }
      : { ad: 'Günlük iş', deger: '30 arama / ziyaret → 6 demo → 2 satış' },
  ],
  kazanc: [
    { ad: 'Yıllık paket satışı başına', deger: `${tl(SATIS_PRIMI)}, peşin` },
    { ad: 'Günde 2 satış (ayda 52)', deger: tl(2 * GUN * SATIS_PRIMI) },
    { ad: 'Günde 5 satış (ayda 130)', deger: tl(5 * GUN * SATIS_PRIMI) },
    { ad: 'Sabit ücret', deger: 'Yok; kazanç yalnız satıştan' },
  ],
});

const maasli = (marka: Marka): Rol => ({
  id: 'maasli-temsilci',
  ad: 'Maaşlı satış temsilcisi',
  kim: 'Bizimle sabit maaşla çalışan, düzenli ve öngörülebilir gelir isteyen satış temsilcisi. Kotayı aşınca primle kazancını artırır.',
  mesaj: `Her ay ${tl(MAAS)} maaşın güvence. ${tl(KOTA)} cironun üstündeki her satış ayrıca ${tl(SATIS_PRIMI)} prim.`,
  hedefler: [
    { ad: 'Aylık ciro kotası', deger: `${tl(KOTA)} (maaş × 2 + %20)` },
    marka === 'istoc'
      ? { ad: 'Kotaya ulaşmak için', deger: `6 aylık abonelik (${eur(ISTOC_AY_EUR)} ${yakl(ISTOC_AY_EUR * KUR)}) ya da 1 yıllık paket` }
      : { ad: 'Kotaya ulaşmak için', deger: `4 yıllık paket (Teşvik ve Otomasyon, 25 çalışan: ${tl(SEGIKA_YIL)})` },
  ],
  kazanc: [
    { ad: 'Maaş', deger: `${tl(MAAS)} / ay` },
    { ad: 'Kotaya kadar', deger: 'Prim yok' },
    { ad: 'Kota üstü her satış', deger: tl(SATIS_PRIMI) },
    { ad: 'Örnek: kota + 10 satış', deger: tl(MAAS + 10 * SATIS_PRIMI) },
  ],
});

const danisman = (marka: Marka): Rol =>
  marka === 'istoc'
    ? {
        id: 'cozum-ortagi',
        ad: 'Profesyonel danışman (çözüm ortağı)',
        kim: 'Toptancı ve üreticiye zaten hizmet veren, müşterisi güvenen profesyonel. iStoc’u kendi hizmetinin parçası olarak önerir; biz kurulumu ve desteği veririz.',
        mesaj: 'Müşterine yeni alıcı ve ihracat kanalı getir; her yıllık pakette komisyonun peşin, yenilemede de kazanırsın.',
        hedefler: [
          { ad: 'İlk 90 gün', deger: '5 müşteri yönlendirme, 2 yıllık paket' },
          { ad: 'Yıl sonu', deger: '20 aktif müşteri' },
        ],
        kazanc: [
          { ad: 'Yıllık paket (ilk yıl)', deger: `%25 · ${eur(ISTOC_YIL_EUR * 0.25)} ${yakl(ISTOC_YIL_EUR * 0.25 * KUR)}, peşin` },
          { ad: 'Yenileme (ikinci yıl)', deger: `%15 · ${eur(ISTOC_YIL_EUR * 0.15)} ${yakl(ISTOC_YIL_EUR * 0.15 * KUR)}, peşin` },
          { ad: 'Örnek: 10 müşteri, ilk yıl', deger: yakl(ISTOC_YIL_EUR * 0.25 * KUR * 10) },
        ],
        liste: {
          baslik: 'Kimlerle ortaklık kurulur',
          ogeler: [
            { ad: 'Gümrük müşavirleri', deger: 'İhracat yapan ya da yapmak isteyen toptancıyı tanır' },
            { ad: 'Dış ticaret ve e-ihracat danışmanları', deger: 'Yeni pazar arayan üreticiye kanal olarak önerir' },
            { ad: 'Lojistik ve kargo firmaları', deger: 'Çarşıdaki gönderici esnafla her gün temas' },
            { ad: 'Esnafın mali müşavirleri', deger: 'Toptancının ciro ve büyüme derdini bilir' },
            { ad: 'İstoç esnaf dernekleri ve site yönetimleri', deger: 'Toplu üyelik, çarşı içi duyuru' },
            { ad: 'Meslek odaları ve sektör dernekleri', deger: 'Üyelerine ihracat ve satış programı olarak sunar' },
            { ad: 'Fuar organizatörleri', deger: 'Fuar katılımcısına yıl boyu dijital vitrin' },
            { ad: 'Banka KOBİ ve dış ticaret temsilcileri', deger: 'Kredi müşterisine satış kanalı önerir' },
          ],
        },
      }
    : {
        id: 'cozum-ortagi',
        ad: 'Profesyonel danışman (çözüm ortağı)',
        kim: 'İşverene SGK, bordro, İK ya da iş güvenliği hizmeti veren profesyonel. Segika’yı kendi hizmetinin parçası olarak önerir; kurulum ve destek bizde.',
        mesaj: 'Müşterine teşvik kazandır, SGK işlerini otomatikleştir; her yıllık pakette komisyonun peşin, yenilemede de kazanırsın.',
        hedefler: [
          { ad: 'İlk 90 gün', deger: '10 firma yönlendirme, 4 yıllık paket' },
          { ad: 'Yıl sonu', deger: '30 aktif firma' },
        ],
        kazanc: [
          { ad: 'Yıllık paket (ilk yıl)', deger: `%25 · ${tl(SEGIKA_YIL * 0.25)}, peşin (Teşvik ve Otomasyon, 25 çalışan)` },
          { ad: 'Yenileme (ikinci yıl)', deger: `%15 · ${tl(SEGIKA_YIL * 0.15)}, peşin` },
          { ad: 'Örnek: 20 firma, ilk yıl', deger: tl(SEGIKA_YIL * 0.25 * 20) },
        ],
        liste: {
          baslik: 'Kimlerle ortaklık kurulur',
          ogeler: [
            { ad: 'Mali müşavirler (SMMM) ve serbest muhasebeciler', deger: 'Bordro ve SGK bildirgesini zaten yapar; teşvik kaçağını görür' },
            { ad: 'İnsan kaynakları müdürleri', deger: 'Kendi şirketi ve sektördeki meslektaşlarına önerir' },
            { ad: 'Bölgesel İK dernekleri (Gaziantep, Konya, Kayseri, Bursa …)', deger: 'Sanayileşmiş bölgede üye işverenlere toplu sunum' },
            { ad: 'Çalışma hayatı dernekleri', deger: 'Mevzuat eğitimlerinde çözüm olarak' },
            { ad: 'OSGB’ler (iş sağlığı ve güvenliği firmaları)', deger: 'Her ay aynı işverenleri ziyaret eder; iş kazası ve vizite takibi ortak konu' },
            { ad: 'Bordro ve puantaj hizmet büroları', deger: 'Toplu müşteri, tek seferde çok firma' },
            { ad: 'İş ve sosyal güvenlik hukuku avukatları, arabulucular', deger: 'İdari para cezası ve uyuşmazlık sonrası önleyici araç' },
            { ad: 'SGK teşvik ve yatırım teşvik danışmanları', deger: 'Teşvik hesabını yazılımla ölçekler' },
            { ad: 'Muhasebe ve ERP yazılım bayileri (Luca, Mikro, ETA)', deger: 'Segika bu yazılımlarla entegre; bayinin müşterisine ek modül' },
            { ad: 'OSB müdürlükleri, sanayi ve ticaret odaları', deger: 'Üye işverenlere duyuru ve eğitim' },
            { ad: 'SMMM odalarının eğitim birimleri', deger: 'Meslek içi eğitimde uygulama ortağı' },
            { ad: 'Özel istihdam büroları', deger: 'İşe alınan çalışanın teşvikini işverene kazandırır' },
            { ad: 'Kalkınma ajansı ve KOSGEB danışmanları', deger: 'Destek alan işletmeye maliyet düşürme aracı' },
          ],
        },
      };

const arkadas = (marka: Marka): Rol =>
  marka === 'istoc'
    ? {
        id: 'arkadasini-getir',
        ad: 'Arkadaşını getir, komşuna söyle',
        kim: 'İstoç toptancılar çarşısında üye esnaf. Arkadaşına, komşu dükkâna iStoc’u söyler.',
        mesaj: `Getirdiğin her esnaf üyeliğini başlatınca sen 2 ay kazanırsın: ${eur(ISTOC_AY_EUR * 2)} ${yakl(ISTOC_AY_EUR * 2 * KUR)}.`,
        hedefler: [
          { ad: 'Her üye esnaf', deger: 'Ayda 1 komşu ya da arkadaş' },
          { ad: 'Çarşı hedefi', deger: 'Her blokta en az 3 getiren üye' },
        ],
        kazanc: [
          { ad: '1 ay', deger: `${eur(ISTOC_AY_EUR)} ${yakl(ISTOC_AY_EUR * KUR)}` },
          { ad: 'Getirilen her üye için', deger: `2 ay · ${eur(ISTOC_AY_EUR * 2)} ${yakl(ISTOC_AY_EUR * 2 * KUR)}` },
          { ad: 'Örnek: 3 komşu', deger: `${eur(ISTOC_AY_EUR * 6)} ${yakl(ISTOC_AY_EUR * 6 * KUR)}` },
        ],
      }
    : {
        id: 'arkadasini-getir',
        ad: 'Arkadaşını getir, komşuna söyle',
        kim: 'Segika kullanan işletme sahibi, İK ya da muhasebe sorumlusu. Aynı OSB’deki, sanayi sitesindeki ya da çarşıdaki komşu işletmeye Segika’yı söyler.',
        mesaj: 'Getirdiğin her işletme aboneliğini başlatınca sen 2 ay kazanırsın.',
        hedefler: [
          { ad: 'Her müşteri işletme', deger: 'Çeyrekte 1 komşu işletme' },
          { ad: 'Bölge hedefi', deger: 'Her OSB’de en az 3 getiren müşteri' },
        ],
        kazanc: [
          { ad: 'SGK Teşvik ve Otomasyon', deger: `2 ay · ${tl(SEGIKA.ikisi * 2)}` },
          { ad: 'SGK Teşvik', deger: `2 ay · ${tl(SEGIKA.tesvik * 2)}` },
          { ad: 'SGK Otomasyon', deger: `2 ay · ${tl(SEGIKA.otomasyon * 2)}` },
          { ad: 'Fiyat esası', deger: '25 çalışana kadar, aylık (segika.com)' },
        ],
      };

const elci = (marka: Marka): Rol => {
  const yillik = marka === 'istoc' ? ISTOC_YIL_EUR * KUR : SEGIKA_YIL;
  return {
    id: 'marka-elcisi',
    ad: 'Marka elçisi ve referans bağlantısı',
    kim:
      marka === 'istoc'
        ? 'Toptan ticaret, ihracat ve girişimcilik üzerine paylaşım yapan içerik üreticisi; kendi ağına iStoc’u kişisel bağlantı ve kodla önerir.'
        : 'İK, muhasebe, SGK ve çalışma hayatı üzerine paylaşım yapan içerik üreticisi ya da uzman; kendi ağına Segika’yı kişisel bağlantı ve kodla önerir.',
    mesaj: 'Paylaş, bağlantından gelen her yıllık paketten komisyonun peşin.',
    hedefler: [
      { ad: 'Paylaşım', deger: 'Ayda 4 içerik (video, gönderi, hikâye)' },
      { ad: 'Ölçüt', deger: 'Bağlantı tıklaması → deneme → yıllık paket' },
      { ad: 'Kademe', deger: 'Mikro (1–10 bin takipçi) · Orta (10–100 bin) · Büyük (100 bin+)' },
    ],
    kazanc: [
      { ad: 'Bağlantıdan gelen yıllık paket', deger: `%10 · ${marka === 'istoc' ? `${eur(ISTOC_YIL_EUR * 0.1)} ${yakl(yillik * 0.1)}` : tl(yillik * 0.1)}, peşin` },
      { ad: 'Örnek: ayda 5 satış', deger: marka === 'istoc' ? yakl(yillik * 0.1 * 5) : tl(yillik * 0.1 * 5) },
      { ad: 'Takip', deger: 'Kişisel bağlantı ve indirim kodu' },
    ],
  };
};

export const MARKALAR: { id: Marka; ad: string; fiyat: string }[] = [
  { id: 'istoc', ad: 'iStoc', fiyat: `${eur(ISTOC_AY_EUR)} / ay ${yakl(ISTOC_AY_EUR * KUR)} · yıllık paket ${ISTOC_YIL_AY} ay bedeli` },
  { id: 'segika', ad: 'Segika', fiyat: `25 çalışana kadar aylık: Teşvik ${tl(SEGIKA.tesvik)} · Otomasyon ${tl(SEGIKA.otomasyon)} · Teşvik ve Otomasyon ${tl(SEGIKA.ikisi)}` },
];

export const rolleri = (marka: Marka): Rol[] => [genc(marka), maasli(marka), danisman(marka), arkadas(marka), elci(marka)];
