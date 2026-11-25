// Büyüyen müşteri senaryosu (kullanıcı kararı 25 Kasım 2026 Çarşamba). Çalıştırma: `npm run birim`.
// Beklenen sayılar elle hesaplandı. Hesap `veri.mjs` içindeki `senaryo` işlevidir.
// Varsayım: her ay aynı sayıda yeni müşteri gelir. Her müşteri Basic paket için ayda 399 € öder ve 48 ay kalır.
import test from 'node:test';
import assert from 'node:assert/strict';
import { plan, fiyat, senaryo, ANLAR, SENARYOLAR, kurKutusu } from './veri.mjs';

const yakin = (a, b) => assert.ok(Math.abs(a - b) < 0.005, `${a} ≠ ${b}`);
const ay = (s, n) => s.aylar[n - 1];
// `seviyeAyi`: K1, K2 ve K3 seviyesine ilk ulaşılan ay.

test('eşikler euro olur, oranlar değişmez', () => {
  assert.deepEqual(plan.tanistir.esik, [798, 1_596, 3_192]);
  assert.deepEqual(plan.kapatir.esik, [798, 1_596, 3_192]);
  assert.deepEqual(plan.kapatir.gecmis, [0.1, 0.07, 0.05, 0]);
  assert.equal(plan.musteriAy, 48);
  assert.equal(fiyat.basicAyEur, 399);
});

test('zaman anları ve üç senaryo', () => {
  assert.deepEqual(ANLAR, [1, 3, 6, 12, 24, 48]);
  assert.deepEqual(SENARYOLAR.map((s) => s.yeniMusteri), [1, 2, 4]);
  assert.equal(SENARYOLAR.find((s) => s.ana).yeniMusteri, 2);
});

test('gerçekçi senaryo, satışı kapatma: ayda 2 yeni müşteri', () => {
  const s = senaryo('kapatir', 2);
  assert.equal(s.aylar.length, 48);
  assert.equal(s.kotaTamam, true);
  assert.deepEqual(s.seviyeAyi, [1, 2, 4]);
  assert.equal(ay(s, 1).musteri, 2);
  yakin(ay(s, 1).ciro, 798);
  yakin(ay(s, 1).kazanc, 159.6);
  yakin(ay(s, 3).kazanc, 598.5);
  yakin(ay(s, 3).toplam, 1_157.1);
  yakin(ay(s, 4).kazanc, 957.6);
  yakin(ay(s, 6).kazanc, 1_436.4);
  yakin(ay(s, 12).kazanc, 2_872.8);
  yakin(ay(s, 12).toplam, 18_393.9);
  // 24. ay: ilk yılındaki 24 müşteri %30, 13. ile 24. ayındaki 24 müşteri %10.
  yakin(ay(s, 24).kazanc, 3_830.4);
  yakin(ay(s, 24).toplam, 59_091.9);
  yakin(ay(s, 36).toplam, 109_413.78);
  yakin(ay(s, 48).kazanc, 4_979.52);
  yakin(ay(s, 48).toplam, 166_534.62);
});

test('gerçekçi senaryo, yalnız tanıştırma', () => {
  const s = senaryo('tanistir', 2);
  assert.deepEqual(s.seviyeAyi, [1, 2, 4]);
  yakin(ay(s, 1).kazanc, 55.86);
  yakin(ay(s, 12).kazanc, 1_436.4);
  yakin(ay(s, 12).toplam, 9_073.26);
  yakin(ay(s, 24).kazanc, 1_915.2);
  yakin(ay(s, 48).kazanc, 2_154.6);
});

test('temkinli senaryoda 1. ay K1 altında kalır, 13. aydan sonra pay yoktur', () => {
  const s = senaryo('kapatir', 1);
  assert.equal(s.kotaTamam, false);
  assert.deepEqual(s.seviyeAyi, [2, 4, 8]);
  yakin(ay(s, 1).kazanc, 59.85);
  yakin(ay(s, 12).kazanc, 1_436.4);
  // 24. ayda yalnız ilk yılındaki 12 müşterinin payı kalır.
  yakin(ay(s, 24).kazanc, 1_436.4);
});

test('güçlü senaryo: ayda 4 yeni müşteri', () => {
  const s = senaryo('kapatir', 4);
  assert.deepEqual(s.seviyeAyi, [1, 1, 2]);
  yakin(ay(s, 1).kazanc, 399);
  yakin(ay(s, 12).kazanc, 5_745.6);
  yakin(ay(s, 48).kazanc, 9_959.04);
  // İlk üç ayda seviye daha erken yükselir: 79,8 + 159,6 + 239,4 = 478,8 € fark. Sonrası gerçekçi senaryonun 2 katıdır.
  yakin(ay(s, 48).toplam, 166_534.62 * 2 + 478.8);
});

test('kur kutusu euro tutarı TL karşılığına çevirir ve tarih yazar', () => {
  const k = kurKutusu(2_872.8);
  assert.equal(k.kur, 55.31);
  assert.equal(k.eur, 2_873);
  assert.equal(k.tl, 158_906);
  assert.equal(k.tarih, '25 Kasım 2026 Çarşamba');
});
