import { expect, test } from '@playwright/test';
import { SECENEKLER } from '../src/data/istihdamV2';
import { BASLANGIC_ODEYEN, IS_GUNU, KAYNAKLAR, MEDYAN_SAAT, RISKLER, monteCarlo, ongoru, reglKaybi, tekHesap, toplam, yillikDokum } from '../src/data/gelir2027';

/**
 * 2027 gelir öngörüsü modeli (kullanıcı kararı 2026-11-05). Takvim 249 iş günüdür, saat dökümü kendi içinde tutarlıdır,
 * öngörüler sıralıdır (kötümser ≤ ortanca ≤ iyimser), simülasyon tekrarlanabilirdir, riskler sırayla geliri düşürür.
 * Veri testi: yalnız Chromium (playwright.config).
 */

test('takvim: 249 iş günü; plan 40, yasal 45 saat; döküm toplamları tutarlı', () => {
  expect(toplam(IS_GUNU)).toBe(249);
  const d = yillikDokum();
  expect(d.plan).toBe(249 * 8);
  expect(d.yasal).toBe(249 * 9);
  expect(d.cavusPayi).toBe(249);
  expect(d.calisilan).toBeCloseTo(d.plan - d.izin - d.hastalik - d.grip - d.regl - d.mazeret, 6);
  expect(d.verimli).toBeCloseTo(d.calisilan * MEDYAN_SAAT.verim, 6);
  expect(d.carpan).toBeGreaterThan(0.8);
  expect(d.carpan).toBeLessThan(1);
});

test('regl politikası: kaynaktaki 8,9 gün politika yokken kullanılır; evden çalışma kaybı azaltır', () => {
  expect(reglKaybi('yok')).toBeCloseTo(8.9, 6);
  expect(reglKaybi('evden')).toBeLessThan(reglKaybi('yok'));
  expect(reglKaybi('ikisi')).toBeLessThan(reglKaybi('izin'));
});

test('öngörüler sıralı; simülasyon aynı tohumla aynı sonucu verir; risk payı pozitif', () => {
  for (const s of SECENEKLER) {
    const o = ongoru(s);
    expect(o.gelir.kotumser, s).toBeLessThan(o.gelir.ortanca);
    expect(o.gelir.ortanca, s).toBeLessThan(o.gelir.iyimser);
    expect(o.gelir.medyan, s).toBeLessThan(o.gelir.risksiz);
    expect(o.riskPayi, s).toBeGreaterThan(0);
    expect(o.dolaylisizMedyan, s).toBeLessThan(o.gelir.medyan);
  }
  expect(monteCarlo('medyan', 'ikisi', 50).gelir).toEqual(monteCarlo('medyan', 'ikisi', 50).gelir);
  const e = ongoru('ekonomik').gelir.medyan;
  const g = ongoru('guclu').gelir.medyan;
  expect(e).toBeLessThan(ongoru('medyan').gelir.medyan);
  expect(ongoru('medyan').gelir.medyan).toBeLessThan(g);
});

test('riskler sırayla eklenince gelir düşer; başlangıç ödeyen sayısı gelir planından gelir', () => {
  const sira = (['risksiz', 'saat', 'gecikme', 'devir', 'mevsim'] as const).map((a) => toplam(tekHesap('medyan', a).gelir));
  for (let i = 1; i < sira.length; i++) expect(sira[i]).toBeLessThanOrEqual(sira[i - 1]);
  expect(BASLANGIC_ODEYEN).toBeGreaterThan(0);
});

test('risk listesi geçerli; kaynaklar kaynaklı ya da tahmin; metin kuralı', () => {
  for (const r of RISKLER) {
    expect(r.olasilik).toBeGreaterThanOrEqual(1);
    expect(r.etki).toBeLessThanOrEqual(5);
    expect(r.aylar.every((a) => a >= 0 && a < 12)).toBe(true);
  }
  for (const k of KAYNAKLAR) expect(k.kaynaklar.length > 0 || k.tahmin, k.id).toBe(true);
  const metin = JSON.stringify([RISKLER, KAYNAKLAR.map((k) => [k.konu, k.aciklama])]);
  expect(metin.match(/[;—–·→]/g) ?? []).toEqual([]);
});
