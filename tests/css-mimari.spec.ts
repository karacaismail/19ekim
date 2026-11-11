import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import { expect, test } from '@playwright/test';

/**
 * Stil mimarisi (kullanıcı kararı 2026-11-05: yeni ya da güncellenen sayfa diğer sayfaları bozmamalı).
 * 1. Sayfaya özel stil dosyası kendi önekiyle yazılır ve aşağıdaki tabloya kaydedilir. Dosyadaki her seçici en az bir
 *    önekli sınıfa bağlıdır. `:is()` ve `:where()` içindeki her seçenek de ayrıca bağlı olmalıdır. Böylece bir sayfanın
 *    stili başka bir sayfadaki öğeyi seçemez. Kayıtsız yeni stil dosyası testi düşürür.
 * 2. Kaynakta hiç geçmeyen sınıf için stil yazılmaz. Ölü kural birikmez ve aynı adı yeniden kullanan yeni bir sayfa
 *    eski kurala yakalanmaz.
 * Veri testi: yalnız Chromium projesinde bir kez çalışır (playwright.config testIgnore).
 */

const SRC = join(process.cwd(), 'src');
/** Ortak stiller: tüm sayfalarda yüklenir. Diğer her stil dosyası sayfaya özeldir ve öneki bu tabloda yazılıdır. */
const ORTAK = ['tokens.css', 'global.css'];
const SAYFA_ONEKI: Record<string, string> = {
  'satisOrtakligiV2.css': 'v2-',
  'ozetPaneliV2.css': 'v2-',
  'istihdamV2.css': 'iv2-',
  'butce2027.css': 'b27-',
  'gelirOngorusu.css': 'go27-',
  'onboarding.css': 'ob-',
  'politikalar.css': 'pol-',
};

function dosyalar(klasor: string): string[] {
  return readdirSync(klasor, { withFileTypes: true }).flatMap((g) => (g.isDirectory() ? dosyalar(join(klasor, g.name)) : [join(klasor, g.name)]));
}
const TUMU = dosyalar(SRC);
const CSS = TUMU.filter((f) => f.endsWith('.css'));

/** Bir stil dosyasındaki sınıf adları (anahtar kare adımları hariç). */
function siniflar(dosya: string): Set<string> {
  const out = new Set<string>();
  postcss.parse(readFileSync(dosya, 'utf8')).walkRules((r) => {
    if (r.parent?.type === 'atrule' && /keyframes/.test((r.parent as postcss.AtRule).name)) return;
    for (const m of r.selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) out.add(m[1]);
  });
  return out;
}

/** Seçici önekli bir sınıfa bağlı mı: dışarıda önek varsa evet. Yoksa her `:is()`/`:where()` seçeneğinde önek aranır. */
function bagli(secici: string, onek: string): boolean {
  const sinif = new RegExp(`\\.${onek}`);
  // `:not()` içindeki önek seçiciyi bağlamaz (`.secim:not(.v2-x)` her sayfadaki `.secim`i seçer). `:has()` ise bağlar.
  secici = secici.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, '');
  const dis = secici.replace(/:(?:is|where)\(([^()]*)\)/g, '');
  if (sinif.test(dis)) return true;
  const listeler = [...secici.matchAll(/:(?:is|where)\(([^()]*)\)/g)].map((m) => m[1].split(','));
  return listeler.length > 0 && listeler.some((l) => l.every((x) => sinif.test(x)));
}

test('her sayfa stil dosyası önek tablosunda kayıtlı; her seçici o önekli bir sınıfa bağlı', () => {
  for (const f of CSS) {
    const ad = f.replace(/^.*\//, '');
    if (ORTAK.includes(ad)) continue;
    const onek = SAYFA_ONEKI[ad];
    expect(onek, `${ad}: sayfa stil dosyası önek tablosunda yok (tests/css-mimari.spec.ts SAYFA_ONEKI)`).toBeTruthy();
    const bagsiz: string[] = [];
    postcss.parse(readFileSync(f, 'utf8')).walkRules((r) => {
      if (r.parent?.type === 'atrule' && /keyframes/.test((r.parent as postcss.AtRule).name)) return;
      for (const s of r.selectors) if (!bagli(s, onek)) bagsiz.push(s);
    });
    expect(bagsiz, `${ad}: önekli sınıfa bağlı olmayan seçici`).toEqual([]);
  }
});

test('kaynakta geçmeyen sınıf için stil kuralı yok', () => {
  const kaynak = TUMU.filter((f) => /\.(tsx?|astro|mjs)$/.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  const kullanilmayan: string[] = [];
  for (const f of CSS) {
    for (const c of siniflar(f)) {
      // Sınır Unicode harfleriyle kurulur: “ayrıcalık” içindeki “cal” bir sınıf adı sayılmaz. Sınıf adı yalnız harf,
      // rakam, alt çizgi ve tire taşır, bu yüzden kaçış gerekmez.
      if (new RegExp(`(^|[^\\p{L}\\p{N}_-])${c}(?![\\p{L}\\p{N}_-])`, 'u').test(kaynak)) continue;
      // Çalışırken kurulan ad: `oy-kart-${x}` gibi önek ve şablon ifadesi.
      const parca = c.split('-');
      if (parca.some((_, i) => i > 0 && kaynak.includes(`${parca.slice(0, i).join('-')}-\${`))) continue;
      kullanilmayan.push(`${f.replace(`${SRC}/`, '')} .${c}`);
    }
  }
  expect(kullanilmayan).toEqual([]);
});
