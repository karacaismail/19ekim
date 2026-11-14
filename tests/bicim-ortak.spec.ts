import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from './fixtures/persona';

/**
 * Bütün sayı ve para metinleri tek kuraldan geçer (src/lib/format.ts). Yerel kopya eksi yarım değeri sıfıra doğru
 * yuvarlar ve ekrana "-0 ₺" yazabilir. Bu test kaynak kodda yerel sayı biçimi arar:
 * - `Intl.NumberFormat(` yalnız src/lib/format.ts içinde olabilir. `new` olmadan çağrı da sayılır.
 * - Sayıların `toLocaleString(` biçimi kullanılmaz. Tarih için `Intl.DateTimeFormat` ya da src/lib/dates.ts kullanılır.
 * Sayfa açılmaz. Bu yüzden test yalnız Chromium projesinde bir kez çalışır.
 */
test.skip(({ browserName }) => browserName !== 'chromium', 'Kaynak denetimi bir kez çalışır.');

const KOK = join(process.cwd(), 'src');
const IZINLI = new Set(['lib/format.ts']);

const dosyalar = (dir: string): string[] =>
  readdirSync(dir).flatMap((ad) => {
    const yol = join(dir, ad);
    if (statSync(yol).isDirectory()) return dosyalar(yol);
    return /\.(ts|tsx|astro)$/.test(ad) ? [yol] : [];
  });

test('sayı biçimi yalnız src/lib/format.ts içinde tanımlanır', () => {
  const bulunan: string[] = [];
  for (const yol of dosyalar(KOK)) {
    const ad = relative(KOK, yol);
    if (IZINLI.has(ad)) continue;
    readFileSync(yol, 'utf8')
      .split('\n')
      .forEach((satir, i) => {
        if (/Intl\.NumberFormat\(|\.toLocaleString\(/.test(satir)) bulunan.push(`${ad}:${i + 1}`);
      });
  }
  expect(bulunan, 'Yerel sayı biçimi bulundu. Bunun yerine src/lib/format.ts içindeki işlevi kullanın.').toEqual([]);
});
