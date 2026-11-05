import { expect, test } from '@playwright/test';
import { AYLAR_2027, SECENEKLER, aylikGider } from '../src/data/istihdamV2';
import { FIYATLAR, SHEETSTE_OLAN, VARSAYILAN_AYAR, butce, eklenenPozisyonlar, fiyat, tabanOf, toplam, yeniKisiler } from '../src/data/butce2027';
import { buildModel } from './opex-fixture';

/**
 * 2027 bütçesi modeli (kullanıcı kararı 2026-11-05). Taban kurgusal örnek Sheets verisinden gelir (gerçek tutar yok).
 * Toplamlar kalemlerin toplamıdır, Sheets'te olan roller iki kez sayılmaz, 2027 öncesi başlayana 2027'de ekipman
 * alınmaz, politika anahtarları yalnız kendi kalemini ekler. Veri testi: yalnız Chromium (playwright.config).
 */

const TABAN = tabanOf(buildModel());

test('toplamlar kalemlerin toplamı; taban Sheets aylarıyla aynı', () => {
  for (const s of SECENEKLER) {
    const b = butce(TABAN, s);
    for (let i = 0; i < 12; i++) {
      const opex = b.kalemler.filter((k) => k.tur === 'opex').reduce((t, k) => t + k.aylik[i], 0);
      expect(b.opex[i], `${s} ${AYLAR_2027[i]}`).toBeCloseTo(opex, 2);
    }
    const tabanToplam = b.kalemler.filter((k) => k.grup === 'mevcut').reduce((t, k) => t + toplam(k.aylik), 0);
    expect(tabanToplam).toBeCloseTo(TABAN.aylar.reduce((t, a) => t + a.teknoloji + a.insan + a.ofis, 0), 2);
  }
});

test('Sheets’te olan roller eklenmez; yeni kadro maliyeti v2 ile aynı', () => {
  for (const s of SECENEKLER) {
    const eklenen = eklenenPozisyonlar(s);
    expect(eklenen.some((p) => SHEETSTE_OLAN.has(p.id)), s).toBe(false);
    expect(eklenen.map((p) => p.id)).toEqual(expect.arrayContaining(['etkinlik-organizatoru', 'ucuncu-saha-personeli']));
    const b = butce(TABAN, s);
    const kadro = toplam(b.kalemler.find((k) => k.id === 'kadro-maas')!.aylik) + toplam(b.kalemler.find((k) => k.id === 'kadro-hizmet')!.aylik);
    const v2 = eklenen.reduce((t, p) => t + toplam(aylikGider(p, s)), 0);
    expect(kadro, s).toBeCloseTo(v2, 2);
  }
});

test('2027 öncesi başlayana 2027’de ekipman alınmaz; 2027’de başlayan masa başı kişiye bilgisayar alınır', () => {
  const s = 'medyan';
  const b = butce(TABAN, s);
  const pc = b.kalemler.find((k) => k.id === 'bilgisayar')!;
  const masaBasi2027 = yeniKisiler(s).filter((y) => !y.oncedenBasladi && !['istoc-saha-ekibi', 'ucuncu-saha-personeli', 'ek-saha-personeli'].includes(y.pozisyon.id));
  expect(masaBasi2027.length).toBeGreaterThan(0);
  expect(toplam(pc.aylik)).toBeGreaterThanOrEqual(masaBasi2027.length * fiyat('laptop-ofis'));
  // Aralık 2026'da başlayan organizatör ve 3. saha personeli 2027 yatırımına girmez.
  const once = yeniKisiler(s).filter((y) => y.oncedenBasladi);
  expect(once.map((y) => y.pozisyon.id).sort()).toEqual(['etkinlik-organizatoru', 'ucuncu-saha-personeli']);
});

test('seçenekler büyüdükçe bütçe artar; anahtarlar yalnız kendi kalemini ekler', () => {
  const t = (s: (typeof SECENEKLER)[number]) => {
    const b = butce(TABAN, s);
    return toplam(b.opex) + toplam(b.capex);
  };
  expect(t('ekonomik')).toBeLessThan(t('medyan'));
  expect(t('medyan')).toBeLessThan(t('guclu'));
  const kapali = butce(TABAN, 'medyan', VARSAYILAN_AYAR);
  const yemekli = butce(TABAN, 'medyan', { ...VARSAYILAN_AYAR, yemek: true });
  const yemek = yemekli.kalemler.find((k) => k.id === 'yemek')!;
  expect(kapali.kalemler.find((k) => k.id === 'yemek')).toBeUndefined();
  // Öngörülemeyen pay eklemelere bağlı olduğundan fark, yemek kalemi ile onun yüzde 5'idir.
  expect(toplam(yemekli.opex) - toplam(kapali.opex)).toBeCloseTo(toplam(yemek.aylik) * 1.05, 0);
  expect(yemek.aylik[0]).toBeCloseTo((TABAN.bordrolu + yeniKisiler('medyan').filter((y) => y.ay === 0).reduce((t, y) => t + (y.yari ? 0.5 : 1), 0)) * fiyat('yemek-karti-aylik'), 2);
});

test('Sheets verisi yoksa taban kalemleri çizilmez, eklemeler hesaplanır', () => {
  const b = butce(null, 'medyan');
  expect(b.tabanVar).toBe(false);
  expect(b.kalemler.filter((k) => k.grup === 'mevcut')).toHaveLength(0);
  expect(toplam(b.opex)).toBeGreaterThan(0);
});

test('fiyatlar kaynaklı ya da tahmin işaretli; yatırımda KDV dahil fiyat KDV hariçe çevrilir; metin kuralı', () => {
  for (const f of FIYATLAR) {
    // Kaynağı olmayan fiyat açıkça tahmin olarak işaretlidir.
    expect(f.kaynaklar.length > 0 || f.tahmin, f.id).toBe(true);
    expect(f.fiyat2027, f.id).toBeCloseTo(f.fiyat2026 * 1.2973, 0);
  }
  const laptop = FIYATLAR.find((f) => f.id === 'laptop-ofis')!;
  expect(fiyat('laptop-ofis')).toBeCloseTo(laptop.fiyat2027 / 1.2, 2);
  expect(JSON.stringify(FIYATLAR.map((f) => [f.ad, f.dayanak])).match(/[;—·→]/g) ?? []).toEqual([]);
});
