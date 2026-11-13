import { expect, test } from './fixtures/persona';
import { toCsv } from '../src/lib/csv';
import { int, num, pct, times, tl, tlExact } from '../src/lib/format';

/**
 * Sayı biçimi (src/lib/format.ts) ve CSV dosyası (src/lib/csv.ts) için birim testleri.
 * Beklenen değerler Türkçe yazım kurallarından elle çıkarıldı:
 * - Binlik ayırıcı nokta, ondalık ayırıcı virgüldür. Örnek: 1.234,5.
 * - Yüzde işareti sayıdan önce gelir. Örnek: %5. Eksi yüzde "-%5" yazılır.
 * - Eksi ve artı tutar aynı kuralla yuvarlanır. Yarım değer sıfırdan uzağa gider.
 * - Sıfıra yuvarlanan değer eksi işareti almaz. "-0 ₺" yazılmaz.
 * - Sayı olmayan değer ekrana "NaN" ya da "∞" olarak çıkmaz.
 * Sayfa açılmaz. Bu yüzden test yalnız Chromium projesinde bir kez çalışır.
 */
test.skip(({ browserName }) => browserName !== 'chromium', 'Veri denetimi bir kez çalışır.');

test.describe('sayı biçimi', () => {
  test('artı değerler Türkçe ayırıcılarla yazılır', () => {
    expect.soft(tl(60000)).toBe('60.000 ₺');
    expect.soft(tl(0)).toBe('0 ₺');
    expect.soft(tl(1234.4)).toBe('1.234 ₺');
    expect.soft(tl(1234.5)).toBe('1.235 ₺');
    expect.soft(tl(999999.6)).toBe('1.000.000 ₺');
    expect.soft(tlExact(28075.5)).toBe('28.075,50 ₺');
    expect.soft(tlExact(0)).toBe('0,00 ₺');
    expect.soft(tlExact(1234.565)).toBe('1.234,57 ₺');
    expect.soft(tlExact(0.005)).toBe('0,01 ₺');
    expect.soft(num(1234.567)).toBe('1.234,57');
    expect.soft(num(0.5)).toBe('0,5');
    expect.soft(num(3)).toBe('3');
    expect.soft(int(1234.4)).toBe('1.234');
    expect.soft(int(1234.5)).toBe('1.235');
    expect.soft(int(0)).toBe('0');
    expect.soft(times(1.25)).toBe('1,25 ×');
    expect.soft(times(3)).toBe('3 ×');
    expect.soft(times(1234.5)).toBe('1.234,5 ×');
  });

  test('yüzde işareti sayıdan önce gelir', () => {
    expect.soft(pct(0.7)).toBe('%70');
    expect.soft(pct(0.123)).toBe('%12,3');
    expect.soft(pct(0.12345)).toBe('%12,3');
    expect.soft(pct(1.5)).toBe('%150');
    expect.soft(pct(0)).toBe('%0');
  });

  test('eksi yüzde "-%5" biçiminde yazılır', () => {
    // Türkçede eksi işareti yüzde işaretinin önüne gelir: "-%5". "%-5" yanlıştır.
    expect.soft(pct(-0.05)).toBe('-%5');
    expect.soft(pct(-0.123)).toBe('-%12,3');
    expect.soft(pct(-1)).toBe('-%100');
  });

  test('eksi tutar artı tutarla aynı kuralla yuvarlanır', () => {
    // 1234,5 yukarı yuvarlanıp 1.235 olur. Bu yüzden -1234,5 de -1.235 olmalı.
    expect.soft(tl(-1234.5)).toBe('-1.235 ₺');
    expect.soft(tl(-2.5)).toBe('-3 ₺');
    expect.soft(tl(-0.5)).toBe('-1 ₺');
    expect.soft(tl(-1234.4)).toBe('-1.234 ₺');
    expect.soft(int(-1234.5)).toBe('-1.235');
    expect.soft(int(-2.5)).toBe('-3');
    expect.soft(tlExact(-1234.565)).toBe('-1.234,57 ₺');
    expect.soft(tlExact(-0.005)).toBe('-0,01 ₺');
    expect.soft(num(-1.25)).toBe('-1,25');
  });

  test('sıfıra yuvarlanan eksi değer eksi işareti almaz', () => {
    expect.soft(tl(-0.4)).toBe('0 ₺');
    expect.soft(tl(-0.49)).toBe('0 ₺');
    expect.soft(tl(-0)).toBe('0 ₺');
    expect.soft(tlExact(-0.001)).toBe('0,00 ₺');
    expect.soft(tlExact(-0.004)).toBe('0,00 ₺');
    expect.soft(num(-0.001)).toBe('0');
    expect.soft(int(-0.4)).toBe('0');
    expect.soft(pct(-0.0001)).toBe('%0');
    expect.soft(times(-0.001)).toBe('0 ×');
  });

  test('sayı olmayan değer "NaN" ya da "∞" yazmaz', () => {
    // Hesap bozulursa ekranda "NaN ₺" görünmemeli. Doğru metin projenin kararıdır. Burada yalnız bozuk metin aranır.
    const bozuk = /NaN|∞|Infinity/;
    for (const v of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect.soft(tl(v), `tl(${v})`).not.toMatch(bozuk);
      expect.soft(tlExact(v), `tlExact(${v})`).not.toMatch(bozuk);
      expect.soft(num(v), `num(${v})`).not.toMatch(bozuk);
      expect.soft(int(v), `int(${v})`).not.toMatch(bozuk);
      expect.soft(pct(v), `pct(${v})`).not.toMatch(bozuk);
      expect.soft(times(v), `times(${v})`).not.toMatch(bozuk);
    }
  });
});

test.describe('CSV dosyası', () => {
  test('dosya BOM ile başlar, satırlar CRLF ile, hücreler ";" ile ayrılır', () => {
    const metin = toCsv([
      ['Ay', 'Gelir'],
      ['Ekim 2026', 0],
      ['Kasım 2026', 1500],
    ]);
    // Türkçe Excel UTF-8 dosyayı BOM ile tanır. BOM yalnız bir kez, en başta olmalı.
    expect(metin.charCodeAt(0)).toBe(0xfeff);
    expect(metin.slice(1)).not.toContain('﻿');
    expect(metin).toBe('﻿Ay;Gelir\r\nEkim 2026;0\r\nKasım 2026;1500');
    // Tek başına "\n" satır sonu yok.
    expect(metin.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  test('tırnak, noktalı virgül ve satır sonu içeren değer tırnağa alınır', () => {
    expect(toCsv([['düz metin']])).toBe('﻿düz metin');
    expect(toCsv([['a"b']])).toBe('﻿"a""b"');
    expect(toCsv([['a;b']])).toBe('﻿"a;b"');
    expect(toCsv([['a\nb']])).toBe('﻿"a\nb"');
    expect(toCsv([['a\rb']])).toBe('﻿"a\rb"');
    expect(toCsv([['"']])).toBe('﻿""""');
    // Birden çok özel karakter aynı hücrede: hücre bir kez tırnağa alınır, iç tırnak ikilenir.
    expect(toCsv([['x', 'Görev; "saha"\nziyaret', 'y']])).toBe('﻿x;"Görev; ""saha""\nziyaret";y');
  });

  test('boş değer boş hücre olur, sıfır boş kalmaz', () => {
    expect(toCsv([[null, undefined, '', 0, 'son']])).toBe('﻿;;;0;son');
    expect(toCsv([['a', null], [undefined, 'b']])).toBe('﻿a;\r\n;b');
  });

  test('sayı hücresi Türkçe Excel için virgüllü ondalıkla yazılır', () => {
    // Noktalı virgülle ayrılan dosyada Türkçe Excel ondalığı virgülle okur. Binlik ayırıcı yazılmaz.
    expect(toCsv([[26.5, -0.5, 1500, 70188.75]])).toBe('﻿26,5;-0,5;1500;70188,75');
    // Sayı olmayan değer boş hücre olur.
    expect(toCsv([[Number.NaN, Number.POSITIVE_INFINITY, 'son']])).toBe('﻿;;son');
  });
});
