import { expect, test } from '@playwright/test';
import { PLAN_ROLLERI } from '../src/data/istihdamPlani';
import { KUMELER, POZISYONLAR, SECENEKLER, SECENEK_OZETI, aylikGider, takvim2027 } from '../src/data/istihdamV2';

/**
 * İstihdam takvimi v2 verisi (kullanıcı kararı 2026-11-05). Mevcut takvimdeki her rol v2'de “eski” olarak, aynı kişi
 * sayısı ve başlangıç tarihiyle, üç seçenekte de bulunur. Aylık giderlerin toplamı yıllık gidere, pozisyonların toplamı
 * seçenek özetine eşittir. Metinler yalın Türkçe kuralına uyar. Veri testi: yalnız Chromium (playwright.config).
 */

test('mevcut takvimdeki her rol v2’de eski olarak, aynı kişi ve tarihle, üç seçenekte de var', () => {
  for (const r of PLAN_ROLLERI) {
    const p = POZISYONLAR.find((x) => x.unvan === r.ad);
    expect(p, r.ad).toBeDefined();
    expect(p!.eski, r.ad).toBe(true);
    expect(p!.planTarihi, r.ad).toBe(r.tarih);
    for (const s of SECENEKLER) expect(p!.secenekler[s].kisi, `${r.ad} ${s}`).toBe(r.kisi);
  }
  expect(POZISYONLAR.filter((p) => p.eski)).toHaveLength(PLAN_ROLLERI.length);
});

test('her pozisyonun kümesi tanımlı; kimlikler tekil', () => {
  const kumeler = new Set(KUMELER.map((k) => k.id));
  for (const p of POZISYONLAR) expect(kumeler.has(p.kume), p.id).toBe(true);
  expect(new Set(POZISYONLAR.map((p) => p.id)).size).toBe(POZISYONLAR.length);
});

test('aylık giderlerin toplamı yıllık gidere, pozisyon toplamı seçenek özetine eşit', () => {
  for (const s of SECENEKLER) {
    let toplam = 0;
    for (const p of POZISYONLAR) {
      const yil = aylikGider(p, s).reduce((t, v) => t + v, 0);
      expect(Math.abs(yil - p.secenekler[s].yillikMaliyet2027), `${p.id} ${s}`).toBeLessThanOrEqual(2);
      toplam += p.secenekler[s].yillikMaliyet2027;
    }
    expect(Math.abs(toplam - SECENEK_OZETI[s].toplamMaliyet2027), s).toBeLessThanOrEqual(5);
    const takvim = takvim2027(s);
    expect(Math.abs(takvim.reduce((t, a) => t + a.gider, 0) - toplam), `${s} takvim`).toBeLessThanOrEqual(5);
    expect(takvim[11].kadro, `${s} Aralık kadrosu`).toBe(SECENEK_OZETI[s].toplamKisi);
  }
  // Seçenekler büyüklük sırasındadır.
  expect(SECENEK_OZETI.ekonomik.toplamKisi).toBeLessThan(SECENEK_OZETI.medyan.toplamKisi);
  expect(SECENEK_OZETI.medyan.toplamKisi).toBeLessThan(SECENEK_OZETI.guclu.toplamKisi);
});

test('metinler yalın Türkçe kuralına uyar: noktalı virgül, uzun çizgi, orta nokta ve ok yok; kişi adı yok', () => {
  const metin = JSON.stringify({ KUMELER, POZISYONLAR: POZISYONLAR.map(({ gerekce, nitelikler, maasDayanagi, unvan }) => ({ gerekce, nitelikler, maasDayanagi, unvan })) });
  expect(metin.match(/[;—·→]/g) ?? []).toEqual([]);
  expect(metin).not.toMatch(/Erdursun/);
});
