import { expect, test } from '@playwright/test';
import { rehberHesabi, tl } from '../src/data/politikalar/hesap';
import { VARSAYILAN_AYAR, kadrolu } from '../src/data/satisOrtakligi';
import { affilateHesabi } from '../src/data/kosullar';

test('seçili nakitsiz program ana komisyonu göstermez', () => {
  const a = { ...VARSAYILAN_AYAR, kosul: { cozum: 'arz' } };
  const h = rehberHesabi('cozum', 'istoc', a);
  expect(h.ornekler[0].satirlar.some((s) => s.deger.includes('Nakit ödeme yok'))).toBeTruthy();
  expect(h.odeme.join(' ')).not.toContain('ilk ödeme için komisyonun');
});
test('sabit kadrolu primi satış adediyle açıklanır', () => {
  const a = { ...VARSAYILAN_AYAR, model: 'sabit' as const };
  const h = rehberHesabi('kadrolu', 'istoc', a);
  const row = h.ornekler[0].satirlar.find((s) => s.ad === 'Örnek prim')!;
  expect(row.deger).toContain('satış');
  expect(row.deger).not.toContain('%');
  expect(row.deger).toContain(tl(kadrolu(a).prim));
});
test('tek seferlik tavsiyede seçili ödeme biçimi ortak motoru kullanır', () => {
  const a = { ...VARSAYILAN_AYAR, marka: 'segika' as const, affOdeme: 'aylik' as const, kosul: { tavsiye: 'tek-sefer' } };
  const h = rehberHesabi('tavsiye', 'segika', a);
  const expected = affilateHesabi(a, 'ayse').ortaklar.reduce((sum, o) => sum + o.planlanan, 0) / 100;
  expect(h.ornekler[0].satirlar.find((s) => s.ad === 'Bir müşteri için planlanan komisyon')?.deger).toBe(tl(expected));
  expect(h.ornekler[0].aciklama.join(' ')).not.toContain('nakit ödeme değildir');
});
