import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * Satış ortaklığı sürüm ayrımı (kullanıcı kararı 2026-11-03): v2'de yapılan değişiklik v1'i bozmamalı. v1 dosyaları
 * hiçbir *V2 modülünü, v2 dosyaları da v1'e özel modülleri import etmez. v2 stilleri yalnız v2- önekli sınıfları kullanır.
 */

const V1 = ['views/SatisOrtakligiPage.tsx', 'data/satisOrtakligi.ts', 'data/kosullar.ts', 'data/affilate.ts', 'data/affilateKurgu.ts', 'components/sadeKit.tsx', 'components/AgDiyagrami.tsx', 'components/AffilateMotoru.tsx'];
const V2 = ['views/SatisOrtakligiV2.tsx', 'data/satisOrtakligiV2.ts', 'data/kosullarV2.ts', 'data/affilateV2.ts', 'data/affilateKurguV2.ts', 'components/sadeKitV2.tsx', 'components/AgDiyagramiV2.tsx', 'components/AffilateMotoruV2.tsx'];
const oku = (f: string) => readFileSync(`src/${f}`, 'utf8');
const importlar = (f: string) => [...oku(f).matchAll(/from '([^']+)'|import '([^']+)'/g)].map((m) => m[1] ?? m[2]);
const ad = (f: string) => f.replace(/^.*\//, '').replace(/\.tsx?$/, '');

test('v1 dosyaları v2 modüllerini import etmez', () => {
  for (const f of V1) expect(importlar(f).filter((i) => /V2(\.css)?$/.test(i)), f).toEqual([]);
});

test('v2 dosyaları v1’e özel modülleri import etmez', () => {
  const v1Adlari = new Set(V1.map(ad));
  for (const f of V2) expect(importlar(f).filter((i) => v1Adlari.has(i.replace(/^.*\//, ''))), f).toEqual([]);
});

test('v2 sınıfları önekli, v1 sınıflarıyla çakışmaz', () => {
  const css = readFileSync('src/styles/satisOrtakligiV2.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(css.match(/\.(so2|ag|am)(?![\w])/g) ?? []).toEqual([]);
  expect(css.match(/(?<![\w-])--so2-/g) ?? []).toEqual([]);
  for (const f of V2.filter((x) => x.endsWith('.tsx'))) expect(oku(f).match(/className="(so2|ag|am)\b[^"]*"/g) ?? [], f).toEqual([]);
});
