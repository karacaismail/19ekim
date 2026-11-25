// Toplantı kararları (kullanıcı kararı 25 Kasım 2026 Çarşamba). Çalıştırma: `npm run birim`.
// Tavsiye ödülü %15 indirim olur. Büyüyen müşteri senaryosuna toplam kazanç grafiği gelir.
// Kaldırılan cümleler üretici denetimine girer. Böylece bu cümleler belgelere geri gelemez.
import test from 'node:test';
import assert from 'node:assert/strict';
import { tavsiye, hesap, fiyat, senaryo, toplamEgrisi } from './veri.mjs';
import { toplamGrafigi } from './sablon.mjs';
import { metinDenetimi } from './kontrol.mjs';

test('tavsiye ödülü yıllık bedelden %15 indirimdir', () => {
  assert.equal(tavsiye.indirimOrani, 0.15);
  assert.equal(tavsiye.yeniIndirimOrani, 0.15);
  assert.equal(tavsiye.sinir, 3);
  assert.equal(fiyat.basicYilEur, 3_990);
  // 3.990 € × %15 = 598,50 €.
  assert.equal(hesap.tavsiyeIndirimEur, 598.5);
  assert.equal('tavsiyeEur' in hesap, false);
});

test('toplam kazanç eğrisi 48 ayı ve 6 kilometre taşını verir', () => {
  const g = toplamEgrisi(senaryo('kapatir', 2));
  assert.equal(g.noktalar.length, 48);
  assert.ok(Math.abs(g.noktalar[47].toplam - 166_534.62) < 0.005);
  for (let i = 1; i < 48; i++) assert.ok(g.noktalar[i].toplam > g.noktalar[i - 1].toplam);
  assert.deepEqual(g.isaretler.map((x) => x.ay), [1, 3, 6, 12, 24, 48]);
  assert.deepEqual(g.isaretler.map((x) => x.toplamEur), [160, 1_157, 4_748, 18_394, 59_092, 166_535]);
  // Eksen 50.000 €'luk adımlarla en yüksek değerin üstünde biter.
  assert.equal(g.enCok, 200_000);
  assert.deepEqual(g.eksen, [0, 50_000, 100_000, 150_000, 200_000]);
});

test('toplam kazanç grafiği 48 çubuk çizer ve kilometre taşlarını işaretler', () => {
  const svg = toplamGrafigi({ egri: toplamEgrisi(senaryo('kapatir', 2)) });
  assert.equal(svg.match(/data-ay="/g).length, 48);
  assert.equal(svg.match(/data-isaret="/g).length, 6);
  assert.match(svg, /166\.535/);
  assert.match(svg, /var\(--sari\)/);
});

test('kaldırılan cümleler üretici denetiminden geçemez', () => {
  for (const cumle of [
    'Kesin değerler yazılı anlaşmada belirlenir.',
    'Bu belge sözleşme değildir.',
    'Vergi ve stopaj bu hesaba dahil değildir.',
    'Fatura, vergi ve stopajı mali müşaviriniz doğrulasın.',
    'Katkı düzeyinizi yazılı belirleyin.',
    'Uygun tavsiye başına size 2 ay ücretsiz kullanım verilir.',
    'Yeni müşteriye 1 ay ücretsiz kullanım verilir.',
    'Tavsiyenin uygun sayılması için yeni müşteri yıllık paket alır.',
    'Satışını kapattığınız müşteri size 48 aya kadar pay getirir.',
    'Bu koşul bağlayıcıdır.',
    'Hukuk birimi onaylar.',
    'Anlaşmayı imzalarsınız.',
  ]) assert.ok(metinDenetimi(cumle).length > 0, cumle);
  // Kalan doğru cümleler denetimden geçer.
  for (const cumle of ['Satışını kapattığınız müşteri size 48 aya kadar kazanç getirir.', 'Satıcı paketi 14 gün ücretsiz dener.', 'Connect to iStoc.com']) {
    assert.deepEqual(metinDenetimi(cumle), [], cumle);
  }
});
