// Belgelerdeki bütün oran, fiyat ve örnek hesaplar. Değerler depodaki kaynak dosyalardan alındı.
// `kaynakDenetimi` değerleri kaynak dosyalarla karşılaştırır. Kaynak değişirse üretim durur.
// Kullanıcı kararı 25 Kasım 2026 Çarşamba: iStoc kazanç planı euro olur. Sabit ciro örneği kalktı.
// Yerine büyüyen müşteri senaryosu geldi. ₺ karşılığı kilometre taşlarındaki hapta ve küçük kur kutusunda görünür.
// Kadrolu uzman bilgisi belgelerden çıktı. Sitedeki kadrolu uzman bölümü değişmedi.
import fs from 'node:fs';
import path from 'node:path';

export const KOK = path.resolve(import.meta.dirname, '../..');

// src/data/kazancPlani.ts → KAZANC_VARSAYILAN (oranlar) ve PROJE_VARSAYILANI.istoc (euro eşikleri).
export const plan = {
  tanistir: { esik: [798, 1_596, 3_192], taban: 0, artis: [0.07, 0.03, 0.05], gecmis: [0.05, 0.025, 0, 0] },
  kapatir: { esik: [798, 1_596, 3_192], taban: 0.15, artis: [0.05, 0.05, 0.05], gecmis: [0.1, 0.07, 0.05, 0] },
  tanistirmaSureAy: 6,
  // Brifteki varsayım: müşteri 48 ay kalır. Pay da en çok 48 ay sürer.
  musteriAy: 48,
};

// src/data/canliPaketler.ts ve src/data/gelirModelleri.ts. src/data/params.ts → eurTry.
// Kaynakta kurun tarihi yazmıyor. Bu yüzden belge üretim tarihi kur tarihi sayıldı.
export const fiyat = { basicAyEur: 399, basicYilEur: 3990, yilAy: 10, kurulumEur: 150, denemeGun: 14, kur: 55.31, kurTarihi: '25 Kasım 2026 Çarşamba' };

// src/data/satisOrtakligi.ts → VARSAYILAN_AYAR (tavsiye ödülü).
export const tavsiye = { krediAy: 2, yeniKrediAy: 1, sinir: 3 };

/** Ulaşılan kotanın oranı. Eşikler sırayla aranır (kazancPlani.ts → katkiOrani). */
export function oran(tur, ciro) {
  const p = plan[tur];
  let o = p.taban;
  let kota = 0;
  p.esik.forEach((e, i) => { if (ciro >= e && kota === i) { kota = i + 1; o += p.artis[i]; } });
  return { oran: Math.round(o * 10_000) / 10_000, kota };
}

/** Kotaların oranı (K0, K1, K2, K3). */
export const kademeler = (tur) => [0, ...plan[tur].esik].map((e) => ({ esik: e, oran: oran(tur, e).oran }));

/** Belgelerde gösterilen zaman anları: 1., 3., 6. ve 12. ay, 2. yıl sonu ve 4. yıl sonu. */
export const ANLAR = [1, 3, 6, 12, 24, 48];
export const anAdi = (n) => (n % 12 === 0 && n > 12 ? `${n / 12}. yıl sonu` : `${n}. ay`);

/** Üç senaryo. Ana görselde gerçekçi senaryo durur. Bu sayılar varsayımdır, gerçek satış verisi değildir. */
export const SENARYOLAR = [
  { ad: 'Temkinli', yeniMusteri: 1 },
  { ad: 'Gerçekçi', yeniMusteri: 2, ana: true },
  { ad: 'Güçlü', yeniMusteri: 4 },
];

/** Satış ayından sonraki dönemin oranı. Yaş, müşterinin kaçıncı ayıdır. İlk 12 ay `null` döner. */
const donemOrani = (tur, yas) => (yas <= 12 ? null : plan[tur].gecmis[Math.floor((yas - 13) / 12)] ?? 0);

/**
 * Büyüyen müşteri senaryosu (kullanıcı kararı 25 Kasım 2026 Çarşamba). Hesap sitedeki kurallarla yapılır.
 * - İş ortağı her ay `yeni` kadar yeni müşteri getirir. Her müşteri Basic paket için ayda 399 € öder ve 48 ay kalır.
 * - Aylık ciro, o ay ödeme yapan bütün müşterilerin toplamıdır. Seviye bu ciroyla bulunur.
 * - Ulaşılan seviyenin oranı, ilk 12 ayındaki müşterilerin cirosunun tamamına uygulanır.
 * - Her müşteri grubu 13. aydan sonra “13. aydan sonraki oranlar” tablosundaki orana geçer.
 * - Kota kuralı: ilk 12 ayın her birinde ciro en az K1 olmalıdır. Bir ay bile altında kalırsa 13. aydan sonra pay yoktur.
 */
export function senaryo(tur, yeni, aySayisi = plan.musteriAy) {
  const birim = fiyat.basicAyEur;
  const k1 = plan[tur].esik[0];
  const kotaTamam = Array.from({ length: 12 }, (_, i) => Math.min(i + 1, plan.musteriAy) * yeni * birim).every((c) => c >= k1);
  const seviyeAyi = [null, null, null];
  const aylar = [];
  let toplam = 0;
  for (let n = 1; n <= aySayisi; n++) {
    const yaslar = Array.from({ length: n }, (_, c) => n - c).filter((yas) => yas <= plan.musteriAy);
    const musteri = yeni * yaslar.length;
    const ciro = musteri * birim;
    const o = oran(tur, ciro);
    for (let s = 0; s < o.kota; s++) if (seviyeAyi[s] === null) seviyeAyi[s] = n;
    const kazanc = yaslar.reduce((t, yas) => {
      const d = donemOrani(tur, yas);
      return t + yeni * birim * (d === null ? o.oran : kotaTamam ? d : 0);
    }, 0);
    toplam += kazanc;
    aylar.push({ ay: n, musteri, ciro, kota: o.kota, oran: o.oran, kazanc, toplam });
  }
  return { tur, yeni, kotaTamam, seviyeAyi, aylar };
}

/** Bir senaryonun zaman anlarındaki değerleri. Tutarlar tam euroya yuvarlanır. */
export const anlar = (s) => ANLAR.map((n) => ({ n, ad: anAdi(n), ...s.aylar[n - 1], kazancEur: Math.round(s.aylar[n - 1].kazanc), toplamEur: Math.round(s.aylar[n - 1].toplam) }));

/** Kur kutusu: euro tutarın yaklaşık TL karşılığı. Önce euro tam sayıya yuvarlanır. Okur aynı çarpımı kendisi yapabilir. */
export function kurKutusu(eur) {
  const e = Math.round(eur);
  return { kur: fiyat.kur, eur: e, tl: Math.round(e * fiyat.kur), tarih: fiyat.kurTarihi };
}

export const sayi = (n) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
export const tl = (n) => `${sayi(n)} TL`;
export const yuzde = (n) => `%${sayi(Math.round(n * 1000) / 10)}`;
export const avro = (n) => `${sayi(n)} €`;
/** Tam euroya yuvarlanmış tutar. Senaryo tutarları bu biçimle yazılır. */
export const avroTam = (n) => avro(Math.round(n));
/**
 * Euro tutarın altındaki ₺ hapı (kullanıcı kararı 25 Kasım 2026 Çarşamba). Önce euro tam sayıya yuvarlanır.
 * Sonra o günün kuruyla çarpılır. Okur aynı çarpımı kendisi yapabilir.
 */
export const liraKarsilik = (eur) => Math.round(Math.round(eur) * fiyat.kur);
export const liraHap = (eur) => `≈ ${sayi(liraKarsilik(eur))} ₺`;
/** ₺ hapının dipnotu. Cümleler metin.md içinde de aynen durur. */
export const kurDipnotu = () => [
  `Euro tutarlarının ₺ karşılığı ${fiyat.kurTarihi} günkü kurla hesaplandı.`,
  `Bu kurda 1 € ${sayi(fiyat.kur)} ₺ eder.`,
  'Kur değişince ₺ karşılığı da değişir.',
].join(' ');

const ana = SENARYOLAR.find((s) => s.ana);
export const hesap = {
  kapat: senaryo('kapatir', ana.yeniMusteri),
  tanis: senaryo('tanistir', ana.yeniMusteri),
  senaryolar: SENARYOLAR.map((s) => ({ ...s, kapat: senaryo('kapatir', s.yeniMusteri), tanis: senaryo('tanistir', s.yeniMusteri) })),
  // Marka elçisi örneği: tanıttığı satıcılar ayda K3 eşiği kadar öder.
  elci: (() => { const ciro = plan.tanistir.esik[2]; const o = oran('tanistir', ciro); return { ciro, ...o, aylik: Math.round(ciro * o.oran * 100) / 100 }; })(),
  tavsiyeEur: fiyat.basicAyEur * tavsiye.krediAy,
  tavsiyeYilAy: tavsiye.krediAy * tavsiye.sinir,
};
export const kur12 = kurKutusu(hesap.kapat.aylar[11].kazanc);

/**
 * Bağımsız sağlama: aynı senaryo müşteri grubu sırasıyla yeniden toplanır. `senaryo` ay sırasıyla toplar.
 * İki toplam aynı olmalıdır.
 */
function grupSirasiyla(tur, yeni) {
  const birim = fiyat.basicAyEur;
  const kotaTamam = yeni * birim >= plan[tur].esik[0];
  let toplam = 0;
  for (let grup = 1; grup <= plan.musteriAy; grup++) {
    for (let n = grup; n <= plan.musteriAy; n++) {
      const yas = n - grup + 1;
      const d = donemOrani(tur, yas);
      toplam += yeni * birim * (d === null ? oran(tur, Math.min(n, plan.musteriAy) * yeni * birim).oran : kotaTamam ? d : 0);
    }
  }
  return toplam;
}

/** Sağlama: belgedeki sayılar elle hesaplanan değerlerle aynı olmalıdır. */
export function saglama() {
  const iki = (n) => Math.round(n * 100) / 100;
  const K = hesap.kapat.aylar, T = hesap.tanis.aylar;
  const beklenen = [
    [kademeler('kapatir').map((k) => k.oran).join(','), '0.15,0.2,0.25,0.3'], [kademeler('tanistir').map((k) => k.oran).join(','), '0,0.07,0.1,0.15'],
    [oran('kapatir', 797).oran, 0.15], [oran('kapatir', 798).oran, 0.2], [oran('kapatir', 1_595).oran, 0.2], [oran('kapatir', 3_192).oran, 0.3], [oran('tanistir', 797).oran, 0],
    // Gerçekçi senaryo, satışı kapatma. 1. ay: 2 × 399 € × %20. 12. ay: 24 × 399 € × %30.
    [iki(K[0].kazanc), 159.6], [iki(K[2].kazanc), 598.5], [iki(K[5].kazanc), 1_436.4], [iki(K[11].kazanc), 2_872.8], [iki(K[23].kazanc), 3_830.4], [iki(K[47].kazanc), 4_979.52],
    [iki(K[2].toplam), 1_157.1], [iki(K[5].toplam), 4_748.1], [iki(K[11].toplam), 18_393.9], [iki(K[23].toplam), 59_091.9], [iki(K[47].toplam), 166_534.62],
    // 48. ay: 2 × 399 € × 12 ay × (%30 + %10 + %7 + %5).
    [iki(K[47].kazanc), iki(2 * 399 * 12 * (0.3 + 0.1 + 0.07 + 0.05))],
    [hesap.kapat.seviyeAyi.join(','), '1,2,4'], [hesap.kapat.kotaTamam, true],
    [iki(T[0].kazanc), 55.86], [iki(T[11].kazanc), 1_436.4], [iki(T[11].toplam), 9_073.26], [iki(T[47].kazanc), 2_154.6],
    [hesap.senaryolar[0].kapat.kotaTamam, false], [hesap.senaryolar[0].kapat.seviyeAyi.join(','), '2,4,8'],
    [iki(hesap.senaryolar[2].kapat.aylar[47].toplam), iki(166_534.62 * 2 + 478.8)],
    [kur12.eur, 2_873], [kur12.tl, 158_906],
    [hesap.elci.oran, 0.15], [hesap.elci.aylik, 478.8],
    [hesap.tavsiyeEur, 798], [hesap.tavsiyeYilAy, 6], [fiyat.basicAyEur * fiyat.yilAy, fiyat.basicYilEur],
  ];
  // Her senaryo ve iki yol için ay sırası ile grup sırası aynı toplamı verir.
  for (const s of hesap.senaryolar) for (const tur of ['kapatir', 'tanistir']) {
    const ay = s[tur === 'kapatir' ? 'kapat' : 'tanis'].aylar.at(-1).toplam;
    beklenen.push([iki(ay), iki(grupSirasiyla(tur, s.yeniMusteri))]);
  }
  const hatalar = beklenen.filter(([a, b]) => String(a) !== String(b)).map(([a, b]) => `${a} ≠ ${b}`);
  if (hatalar.length) throw new Error(`Sağlama tutmadı: ${hatalar.join(' | ')}`);
  return beklenen.length;
}

/** Kaynak dosyalardaki değerler değişmiş mi? Değişmişse belge eski kalır, üretim durur. */
export function kaynakDenetimi() {
  const oku = (f) => fs.readFileSync(path.join(KOK, f), 'utf8');
  const kp = oku('src/data/kazancPlani.ts');
  const paket = oku('src/data/canliPaketler.ts');
  const so = oku('src/data/satisOrtakligi.ts');
  const prm = oku('src/data/params.ts');
  const gm = oku('src/data/gelirModelleri.ts');
  const aranan = [
    [kp, 'taban: 0, kotaArtis: [0.07, 0.03, 0.05], gecmis: [0.05, 0.025, 0, 0] }'],
    [kp, 'taban: 0.15, kotaArtis: [0.05, 0.05, 0.05], gecmis: [0.1, 0.07, 0.05, 0] }'],
    [kp, "'tanistir.kotaEsik.0': 798, 'tanistir.kotaEsik.1': 1_596, 'tanistir.kotaEsik.2': 3_192,"],
    [kp, "'kapatir.kotaEsik.0': 798, 'kapatir.kotaEsik.1': 1_596, 'kapatir.kotaEsik.2': 3_192,"],
    [kp, 'sureAy: 6'],
    [paket, '"aylikEur": 399,\n    "yillikEur": 3990'],
    [paket, 'CANLI_DENEME_GUN = 14'],
    [gm, 'kurulum: 150'],
    [so, 'istocAyEur: 399'], [so, 'istocYilAy: 10'], [so, 'krediAy: 2'], [so, 'yeniKrediAy: 1'], [so, 'tavsiyeSinir: 3'],
    [prm, 'eurTry: 55.31'],
  ];
  const eksik = aranan.filter(([metin, parca]) => !metin.includes(parca)).map(([, p]) => p);
  if (eksik.length) throw new Error(`Kaynak değişti, belgeyi güncelleyin: ${eksik.join(' | ')}`);
  return aranan.length;
}
