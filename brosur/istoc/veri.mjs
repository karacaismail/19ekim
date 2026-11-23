// Belgelerdeki bütün oran, fiyat ve örnek hesaplar. Değerler depodaki kaynak dosyalardan alındı.
// `kaynakDenetimi` değerleri kaynak dosyalarla karşılaştırır. Kaynak değişirse üretim durur.
import fs from 'node:fs';
import path from 'node:path';

export const KOK = path.resolve(import.meta.dirname, '../..');

// src/data/kazancPlani.ts → KAZANC_VARSAYILAN (iStoc'ta sabit kural ve proje varsayılanı yoktur).
export const plan = {
  tanistir: { esik: [30_000, 60_000, 100_000], taban: 0, artis: [0.07, 0.03, 0.05], gecmis: [0.05, 0.025, 0, 0] },
  kapatir: { esik: [30_000, 70_000, 120_000], taban: 0.15, artis: [0.05, 0.05, 0.05], gecmis: [0.1, 0.07, 0.05, 0] },
  ornekCiro: 50_000,
  tanistirmaSureAy: 6,
  kadrolu: { maas: [50_000, 60_000], paketEsik: [5, 8, 12], paketOran: [0.05, 0.07, 0.1], ornekPaket: 8, tanistirmaOrani: 0.07, yenilemeOrani: 0.1 },
};

// src/data/canliPaketler.ts ve src/data/gelirModelleri.ts. src/data/params.ts → eurTry.
export const fiyat = { basicAyEur: 399, basicYilEur: 3990, yilAy: 10, kurulumEur: 150, denemeGun: 14, kur: 55.31 };

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

/** Aylık ciro sabit kabul edilir. İlk yıl kota oranı, sonraki yıllar geçmiş oranıdır. */
export function ornek(tur, ciro = plan.ornekCiro) {
  const o = oran(tur, ciro);
  const aylik = Math.round(ciro * o.oran);
  const ilkYil = aylik * 12;
  const yillar = plan[tur].gecmis.map((g, i) => ({ yil: i + 2, oran: g, ciro: ciro * 12, tutar: Math.round(ciro * 12 * g) })).filter((y) => y.oran > 0);
  return { ciro, ...o, aylik, ilkYil, yillar, toplam: ilkYil + yillar.reduce((t, y) => t + y.tutar, 0), ay: 12 * (1 + yillar.length) };
}

/** Kadrolu uzmanın paket primi (kazancPlani.ts → paketPrimi). */
export function paketPrimi(adet) {
  const k = plan.kadrolu;
  let o = 0;
  k.paketEsik.forEach((e, i) => { if (adet >= e) o = k.paketOran[i]; });
  const yillikTl = fiyat.basicAyEur * fiyat.kur * fiyat.yilAy;
  const ciro = Math.round(adet * yillikTl);
  return { adet, eur: adet * fiyat.basicYilEur, ciro, oran: o, prim: Math.round(ciro * o) };
}

export const sayi = (n) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
export const tl = (n) => `${sayi(n)}\u00a0₺`;
export const yuzde = (n) => `%${sayi(Math.round(n * 1000) / 10)}`;
export const avro = (n) => `${sayi(n)}\u00a0€`;

export const hesap = {
  kapat: ornek('kapatir'),
  tanis: ornek('tanistir'),
  elci: ornek('tanistir', 30_000),
  kadrolu: paketPrimi(plan.kadrolu.ornekPaket),
  tavsiyeEur: fiyat.basicAyEur * tavsiye.krediAy,
  tavsiyeYilAy: tavsiye.krediAy * tavsiye.sinir,
};

/** Sağlama: belgedeki sayılar elle yazılan değerlerle aynı olmalıdır. */
export function saglama() {
  const beklenen = [
    [hesap.kapat.oran, 0.2], [hesap.kapat.aylik, 10_000], [hesap.kapat.ilkYil, 120_000],
    [hesap.kapat.yillar.map((y) => y.tutar).join(','), '60000,42000,30000'], [hesap.kapat.toplam, 252_000], [hesap.kapat.ay, 48],
    [hesap.tanis.oran, 0.07], [hesap.tanis.aylik, 3_500], [hesap.tanis.ilkYil, 42_000],
    [hesap.tanis.yillar.map((y) => y.tutar).join(','), '30000,15000'], [hesap.tanis.toplam, 87_000],
    [hesap.elci.aylik, 2_100], [hesap.kadrolu.ciro, 1_765_495], [hesap.kadrolu.oran, 0.07], [hesap.kadrolu.prim, 123_585],
    [hesap.kadrolu.eur, 31_920], [hesap.tavsiyeEur, 798], [hesap.tavsiyeYilAy, 6], [fiyat.basicAyEur * fiyat.yilAy, fiyat.basicYilEur],
    [kademeler('kapatir').map((k) => k.oran).join(','), '0.15,0.2,0.25,0.3'], [kademeler('tanistir').map((k) => k.oran).join(','), '0,0.07,0.1,0.15'],
    [oran('kapatir', 69_999).oran, 0.2], [oran('kapatir', 70_000).oran, 0.25], [oran('tanistir', 29_999).oran, 0],
    [paketPrimi(4).prim, 0], [paketPrimi(5).oran, 0.05], [paketPrimi(12).oran, 0.1],
  ];
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
    [kp, 'tanistir: { kotaEsik: [30_000, 60_000, 100_000], taban: 0, kotaArtis: [0.07, 0.03, 0.05], gecmis: [0.05, 0.025, 0, 0] }'],
    [kp, 'kapatir: { kotaEsik: [30_000, 70_000, 120_000], taban: 0.15, kotaArtis: [0.05, 0.05, 0.05], gecmis: [0.1, 0.07, 0.05, 0] }'],
    [kp, 'ornekCiro: 50_000'],
    [kp, 'paketEsik: [5, 8, 12], paketOran: [0.05, 0.07, 0.1], ornekPaket: 8'],
    [kp, 'MAAS_ARALIGI = [50_000, 60_000]'],
    [kp, 'KADROLU_TANISTIRMA_ORANI = 0.07'],
    [kp, 'sureAy: 6'],
    [kp, 'istoc: {},'],
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
