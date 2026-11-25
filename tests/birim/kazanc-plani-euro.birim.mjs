// Kullanıcı kararı 25 Kasım 2026 Çarşamba: iStoc kazanç planı euro olur. Segika TL kalır.
// Çalıştırma: `npm run birim`. Bu test tarayıcı açmaz.
import './ts-yukle.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

const k = await import('../../src/data/kazancPlani.ts');

test('iStoc kota eşikleri iki yolda da 798, 1.596 ve 3.192 € olur', () => {
  const p = k.projeVarsayilani('istoc');
  assert.deepEqual(p.tanistir.kotaEsik, [798, 1_596, 3_192]);
  assert.deepEqual(p.kapatir.kotaEsik, [798, 1_596, 3_192]);
  assert.equal(p.ornekCiro, 3_192);
});

test('iStoc oranları, artışları ve 13. aydan sonraki oranları değişmez', () => {
  const p = k.projeVarsayilani('istoc');
  assert.deepEqual([0, 798, 1_596, 3_192].map((c) => k.katkiOrani(p, 'tanistir', c).oran), [0, 0.07, 0.1, 0.15]);
  assert.deepEqual([0, 797, 798, 1_596, 3_192].map((c) => k.katkiOrani(p, 'kapatir', c).oran), [0.15, 0.15, 0.2, 0.25, 0.3]);
  assert.deepEqual(p.tanistir.gecmis, [0.05, 0.025, 0, 0]);
  assert.deepEqual(p.kapatir.gecmis, [0.1, 0.07, 0.05, 0]);
});

test('Segika eşikleri ve örnek cirosu TL olarak aynen kalır', () => {
  const p = k.projeVarsayilani('segika');
  assert.deepEqual(p.tanistir.kotaEsik, [30_000, 70_000, 100_000]);
  assert.deepEqual(p.kapatir.kotaEsik, [30_000, 70_000, 120_000]);
  assert.equal(p.ornekCiro, 50_000);
});

test('para birimi projeye göre seçilir', () => {
  assert.equal(k.paraBirimi('istoc'), '€');
  assert.equal(k.paraBirimi('segika'), '₺');
  assert.equal(k.paraMetni('istoc')(3_192), '3.192 €');
  assert.equal(k.paraMetni('segika')(30_000), '30.000 ₺');
});

test('iStoc kural metinleri euro tutar kullanır, TL tutar kullanmaz', () => {
  const metin = `${k.kotaKurali('istoc')} ${k.kumulatifKurali('istoc')}`;
  assert.match(metin, /798 €/);
  assert.doesNotMatch(metin, /₺/);
  assert.match(k.kumulatifKurali('segika'), /₺/);
});

test('kalıcı kural listesinde iStoc eşiği euro, kadrolu maaşı TL gösterilir', () => {
  const liste = k.kuralListesi(k.projeVarsayilani('istoc'), 'istoc');
  assert.equal(liste.find((x) => x.id === 'kapatir.kotaEsik.0').gosterim, '798 €');
  assert.equal(liste.find((x) => x.id === 'kadrolu.maas').gosterim, '50.000 ₺');
  const segika = k.kuralListesi(k.projeVarsayilani('segika'), 'segika');
  assert.equal(segika.find((x) => x.id === 'kapatir.kotaEsik.0').gosterim, '30.000 ₺');
});
