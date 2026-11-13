/**
 * Persona eşitleme sunucusunun Node testleri. Apps Script hizmetleri bellekte taklit edilir; gerçek tabloya bağlanmaz.
 *
 *   node --test apps-script/test-persona-sync.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { personaSemasi } from './persona-build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const KAYNAK = readFileSync(resolve(HERE, 'src/PersonaSync.js'), 'utf8');
const WEB = readFileSync(resolve(HERE, 'persona-web.js'), 'utf8');
const SEMA = await personaSemasi();
const ANAHTAR = 'a'.repeat(43);
const BASLIK = ['Proje', 'Alan', 'Açıklama', 'Değer', 'Son değişiklik', 'İşlem kimliği'];

let sekmeSayaci = 100;
function sahteSekme(satirlar, baslik = BASLIK) {
  const kimlik = sekmeSayaci++;
  const h = [baslik.slice(), ...satirlar.map((r) => r.slice())];
  const aralik = (r, c, nr, nc) => ({
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (h[r - 1 + i] || [])[c - 1 + j] ?? '')),
    setValues: (v) => { v.forEach((satir, i) => { h[r - 1 + i] = h[r - 1 + i] || []; satir.forEach((x, j) => { h[r - 1 + i][c - 1 + j] = x; }); }); return aralik(r, c, nr, nc); },
    setFontWeight: () => aralik(r, c, nr, nc),
  });
  return { kimlik, getSheetId: () => kimlik, hucreler: h, getRange: aralik, getLastRow: () => h.length, setFrozenRows: () => {}, hideSheet: () => {}, deleteRows: (bas, n) => { h.splice(bas - 1, n); } };
}

function ortam({ satirlar = [], anahtar = ANAHTAR, kilitHazir = true, sekmeYok = false, mod, kurulum, topluHata = false } = {}) {
  const sekmeler = new Map(sekmeYok ? [] : [['Persona Ayarları', sahteSekme(satirlar)]]);
  const ozellik = new Map([['PERSONA_TABLO_KIMLIGI', 'tablo']]);
  if (anahtar) ozellik.set('PERSONA_ERISIM_ANAHTARI', anahtar);
  if (mod) ozellik.set('PERSONA_ACCESS', mod);
  if (kurulum) ozellik.delete('PERSONA_TABLO_KIMLIGI');
  const onbellek = new Map();
  const yazimlar = [];
  const toplu = { hata: topluHata, istekler: [] };
  const hucreDegeri = (c) => { const u = c.userEnteredValue; return 'numberValue' in u ? u.numberValue : u.stringValue; };
  // Sheets API v4 batchUpdate taklidi: önce bütün istekler denetlenir, sonra hepsi birlikte uygulanır (atomik).
  const topluYaz = (govde, tabloKimligi) => {
    assert.equal(tabloKimligi, 'tablo-kimligi');
    toplu.istekler.push(govde);
    const bul = (id) => [...sekmeler.values()].find((x) => x.kimlik === id);
    for (const r of govde.requests) {
      const k = r.updateCells || r.appendCells;
      const id = r.updateCells ? r.updateCells.start.sheetId : r.appendCells.sheetId;
      if (!bul(id) || k.fields !== 'userEnteredValue') throw new Error('geçersiz istek');
    }
    if (toplu.hata) throw new Error('Sheets API geçici hata');
    for (const r of govde.requests) {
      if (r.updateCells) {
        const { start, rows } = r.updateCells;
        const h = bul(start.sheetId).hucreler;
        rows.forEach((row, i) => row.values.forEach((c, j) => { h[start.rowIndex + i][start.columnIndex + j] = hucreDegeri(c); }));
      } else {
        const h = bul(r.appendCells.sheetId).hucreler;
        r.appendCells.rows.forEach((row) => h.push(row.values.map(hucreDegeri)));
      }
    }
    return {};
  };
  const ctx = {
    console: { log: () => {} },
    PERSONA_SEMASI: SEMA,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => ozellik.get(k) ?? null, setProperty: (k, v) => { ozellik.set(k, v); }, setProperties: (o) => { Object.entries(o).forEach(([k, v]) => ozellik.set(k, v)); } }) },
    CacheService: { getScriptCache: () => ({ get: (k) => onbellek.get(k) ?? null, put: (k, v) => { onbellek.set(k, v); } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => kilitHazir, waitLock: () => {}, releaseLock: () => {} }) },
    SpreadsheetApp: {
      openById: () => ({
        getId: () => 'tablo-kimligi',
        getSheetByName: (ad) => sekmeler.get(ad) ?? null,
        insertSheet: (ad) => {
          assert.ok(['Persona Ayarları', 'Persona İşlemleri'].includes(ad), ad);
          const yeni = sahteSekme([]);
          yeni.hucreler.length = 0;
          sekmeler.set(ad, yeni);
          return yeni;
        },
      }),
      getActiveSpreadsheet: () => null,
      flush: () => { yazimlar.push('flush'); },
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (_a, metin) => [...createHash('sha256').update(metin, 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b)),
    },
    Sheets: { Spreadsheets: { batchUpdate: topluYaz } },
    ContentService: { createTextOutput: (m) => ({ metin: m, setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
  };
  if (kurulum) ctx.PERSONA_KURULUM = kurulum;
  vm.createContext(ctx);
  vm.runInContext(`${KAYNAK}\n${WEB}`, ctx);
  return { ctx, toplu, get sekme() { return sekmeler.get('Persona Ayarları'); }, get defter() { return sekmeler.get('Persona İşlemleri'); }, ozellik, onbellek, yanit: (istek) => JSON.parse(JSON.stringify(ctx.personaYanit_(istek))) };
}

const oku = (proje = 'istoc', ek = {}) => ({ service: 'persona', action: 'read', project: proje, key: ANAHTAR, ...ek });
const yama = (changes, ek = {}) => ({ service: 'persona', action: 'patch', project: 'istoc', key: ANAHTAR, operationId: 'islem-0001', changes, ...ek });
const varsayilan = (proje, alan) => SEMA.find((t) => t.projects[0] === proje && t.field === alan).default[proje];

test('şema: iki proje ayrı, marka yok, iç içe alanlar yaprak adıyla', () => {
  const istoc = SEMA.filter((t) => t.projects[0] === 'istoc').map((t) => t.field);
  const segika = SEMA.filter((t) => t.projects[0] === 'segika').map((t) => t.field);
  assert.ok(istoc.includes('oran.A') && istoc.includes('kosul.oncu') && istoc.includes('kademeler.0.ust'));
  assert.ok(!istoc.includes('marka') && !segika.includes('marka'));
  for (const rol of ['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci']) assert.equal(varsayilan('istoc', `kosul.${rol}`), 'ana');
  assert.doesNotThrow(() => ortam().ctx.personaSema_());
});

test('yetki: anahtarsız, yanlış anahtarlı ve anahtarı tanımsız istek veri döndürmez', () => {
  const o = ortam();
  for (const istek of [oku('istoc', { key: '' }), oku('istoc', { key: 'b'.repeat(43) }), oku('istoc', { key: ANAHTAR.slice(1) })]) {
    const r = o.yanit(istek);
    assert.equal(r.ok, false);
    assert.equal(r.code, 'auth');
    assert.equal(r.fields, undefined);
    assert.equal(r.revision, undefined);
  }
  const t = ortam({ anahtar: null }).yanit(oku());
  assert.equal(t.code, 'unavailable');
  assert.equal(t.fields, undefined);
});

test('okuma: satırı olmayan alan varsayılanı alır, revizyon elle düzenlemede değişir', () => {
  const o = ortam({ satirlar: [['istoc', 'kur', 'Kur', 60, '', '']] });
  const r = o.yanit(oku());
  assert.equal(r.ok, true);
  assert.equal(r.fields.kur, 60);
  assert.equal(r.updatedAt, '');
  assert.ok(!Number.isNaN(Date.parse(r.readAt)));
  assert.equal(r.fields['kosul.oncu'], 'ana');
  assert.equal(o.yanit(oku('istoc', { knownRevision: r.revision })).unchanged, true);
  o.sekme.hucreler[1][3] = 61;
  const r2 = o.yanit(oku('istoc', { knownRevision: r.revision }));
  assert.notEqual(r2.revision, r.revision);
  assert.equal(r2.unchanged, undefined);
});

test('okuma: projeler birbirinin satırını görmez', () => {
  const o = ortam({ satirlar: [['segika', 'kur', 'Kur', 70, '', '']] });
  assert.equal(o.yanit(oku('istoc')).fields.kur, varsayilan('istoc', 'kur'));
  assert.equal(o.yanit(oku('segika')).fields.kur, 70);
});

test('okuma: şemaya uymayan hücre açık hata verir ve veri döndürmez', () => {
  const r = ortam({ satirlar: [['istoc', 'oran.A', 'Oran', 'yüzde on', '', ''], ['istoc', 'model', 'Model', 'karma', '', '']] }).yanit(oku());
  assert.equal(r.code, 'invalid');
  assert.deepEqual([...r.invalidFields].sort(), ['model', 'oran.A']);
  assert.equal(r.fields, undefined);
});

test('yama: farklı alanlar birleşir, başka alan ezilmez', () => {
  const o = ortam({ satirlar: [['istoc', 'kur', 'Kur', 60, '', '']] });
  const a = o.yanit(yama([{ field: 'kur', before: 60, value: 62 }], { operationId: 'islem-A001' }));
  assert.equal(a.ok, true);
  const b = o.yanit(yama([{ field: 'oran.A', before: varsayilan('istoc', 'oran.A'), value: 0.2 }], { operationId: 'islem-B001' }));
  assert.equal(b.ok, true);
  assert.equal(b.fields.kur, 62);
  assert.equal(b.fields['oran.A'], 0.2);
  const yeni = o.sekme.hucreler.find((r) => r[1] === 'oran.A');
  assert.deepEqual([yeni[0], yeni[3], yeni[5]], ['istoc', 0.2, 'islem-B001']);
});

test('yama: aynı alanda eski before açık çakışmadır, hiçbir alan yazılmaz', () => {
  const o = ortam({ satirlar: [['istoc', 'kur', 'Kur', 61, '', '']] });
  const r = o.yanit(yama([{ field: 'kur', before: 60, value: 65 }, { field: 'calisan', before: varsayilan('istoc', 'calisan'), value: 30 }]));
  assert.equal(r.ok, false);
  assert.equal(r.code, 'conflict');
  assert.deepEqual(r.conflicts, ['kur']);
  assert.equal(r.snapshot.fields.kur, 61);
  assert.equal(o.sekme.hucreler[1][3], 61);
  assert.ok(!o.sekme.hucreler.some((x) => x[1] === 'calisan'));
});

test('yama: değer zaten hedefteyse çakışma değildir', () => {
  const r = ortam({ satirlar: [['istoc', 'kur', 'Kur', 65, '', '']] }).yanit(yama([{ field: 'kur', before: 60, value: 65 }]));
  assert.equal(r.ok, true);
  assert.equal(r.unchanged, true);
});

test('yama: aynı işlem kimliği tekrarı yazmaz, güncel tabloyu döndürür, farklı içerik reddedilir', () => {
  const o = ortam({ satirlar: [['istoc', 'kur', 'Kur', 60, '', '']] });
  const ilk = o.yanit(yama([{ field: 'kur', before: 60, value: 62 }]));
  assert.equal(ilk.fields.kur, 62);
  o.sekme.hucreler[1][3] = 70; // Başkası sonradan değiştirdi; tekrar bu değeri geri almamalı.
  const tekrar = o.yanit(yama([{ field: 'kur', before: 60, value: 62 }]));
  assert.equal(tekrar.ok, true);
  assert.equal(tekrar.duplicate, true);
  assert.equal(tekrar.operationId, 'islem-0001');
  assert.equal(tekrar.fields.kur, 70);
  assert.notEqual(tekrar.revision, ilk.revision);
  assert.equal(o.sekme.hucreler[1][3], 70);
  assert.ok(!JSON.stringify([...o.onbellek.values()]).includes('fields'));
  const farkli = o.yanit(yama([{ field: 'kur', before: 60, value: 63 }]));
  assert.equal(farkli.code, 'invalid');
});

test('yama: önbellek kaybolsa da tekrar defterden tanınır ve yazmaz', () => {
  const o = ortam({ satirlar: [['istoc', 'kur', 'Kur', 60, '', '']] });
  o.yanit(yama([{ field: 'kur', before: 60, value: 62 }]));
  o.onbellek.clear();
  const r = o.yanit(yama([{ field: 'kur', before: 60, value: 62 }]));
  assert.equal(r.ok, true);
  assert.equal(r.duplicate, true);
  assert.equal(r.fields.kur, 62);
  assert.equal(o.toplu.istekler.length, 1);
});

test('doğrulama: bilinmeyen alan, prototip anahtarı, sınır dışı ve sonsuz değer reddedilir', () => {
  const o = ortam();
  const kotu = [
    [{ field: 'yokAlan', before: 1, value: 2 }],
    [{ field: '__proto__.x', before: 1, value: 2 }],
    [{ field: 'kosul.constructor', before: 'ana', value: 'ag' }],
    [{ field: 'oran.A', before: varsayilan('istoc', 'oran.A'), value: 1.5 }],
    [{ field: 'kur', before: varsayilan('istoc', 'kur'), value: Infinity }],
    [{ field: 'kur', before: varsayilan('istoc', 'kur'), value: '60' }],
    [{ field: 'model', before: 'oran', value: 'karma' }],
    [{ field: 'marka', before: 'istoc', value: 'segika' }],
    [{ field: 'kur', before: 1, value: 2 }, { field: 'kur', before: 2, value: 3 }],
  ];
  for (const changes of kotu) {
    const r = o.yanit(yama(changes));
    assert.equal(r.code, 'invalid', JSON.stringify(changes));
  }
  assert.equal(o.yanit(yama([{ field: 'kur', before: 1, value: 2 }], { operationId: 'kısa' })).code, 'invalid');
  assert.equal(o.yanit(yama([])).code, 'invalid');
  assert.equal(o.sekme.hucreler.length, 1);
});

test('doğrulama: son kademenin üst sınırı 0 geçerlidir', () => {
  const son = SEMA.filter((t) => t.projects[0] === 'segika' && /^kademeler\.\d+\.ust$/.test(t.field)).at(-1);
  assert.equal(son.default.segika, 0);
  const r = ortam().yanit({ ...yama([{ field: son.field, before: 0, value: 0 }]), project: 'segika' });
  assert.equal(r.ok, true);
});

test('kilit: alınamazsa busy döner ve işlem kaydedilmez', () => {
  const o = ortam({ kilitHazir: false });
  const r = o.yanit(yama([{ field: 'kur', before: varsayilan('istoc', 'kur'), value: 61 }]));
  assert.equal(r.code, 'busy');
  assert.equal(o.onbellek.size, 0);
});

test('sekme yoksa okuma varsayılanları döner, ilk yazma persona sekmesini şema varsayılanlarıyla açar', () => {
  const o = ortam({ sekmeYok: true });
  const once = o.yanit(oku());
  assert.equal(once.ok, true);
  const r = o.yanit(yama([{ field: 'kur', before: varsayilan('istoc', 'kur'), value: 61 }]));
  assert.equal(r.ok, true);
  assert.deepEqual(o.sekme.hucreler[0], BASLIK);
  assert.equal(o.sekme.hucreler.length, 1 + SEMA.length);
  assert.equal(o.sekme.hucreler.find((x) => x[0] === 'istoc' && x[1] === 'kur')[3], 61);
  assert.equal(o.sekme.hucreler.find((x) => x[0] === 'segika' && x[1] === 'kur')[3], varsayilan('segika', 'kur'));
  assert.ok(!Number.isNaN(Date.parse(r.updatedAt)));
  const sonra = o.yanit(oku());
  assert.deepEqual({ ...sonra.fields, kur: once.fields.kur }, once.fields);
});

test('geliştirme modu: anahtarsız okuma ve yazma açık, şema dışı yazma yine reddedilir', () => {
  const o = ortam({ anahtar: null, mod: 'development-public', satirlar: [['istoc', 'kur', 'Kur', 60, '', '']] });
  const r = o.yanit(oku('istoc', { key: '' }));
  assert.equal(r.ok, true);
  assert.equal(r.access, 'development-public');
  const y = o.yanit(yama([{ field: 'kur', before: 60, value: 61 }], { key: undefined }));
  assert.equal(y.ok, true);
  assert.equal(y.access, 'development-public');
  assert.equal(o.yanit(yama([{ field: 'yokAlan', before: 1, value: 2 }], { key: '', operationId: 'islem-0002' })).code, 'invalid');
  assert.equal(JSON.parse(o.ctx.doGet().metin).access, 'development-public');
});

test('erişim modu kapalı başlar: tanımsız ya da bilinmeyen mod anahtar ister', () => {
  for (const mod of [undefined, 'public', 'Development-Public', ' development-public']) {
    const o = ortam({ mod });
    const r = o.yanit(oku('istoc', { key: '' }));
    assert.equal(r.code, 'auth', String(mod));
    assert.equal(r.access, 'key');
    assert.equal(r.fields, undefined);
  }
});

test('kurulum değerleri bir kez özelliklere geçer, istek yapılandırmayı değiştiremez', () => {
  const o = ortam({ anahtar: null, kurulum: { access: 'development-public', spreadsheetId: 'x'.repeat(44) } });
  assert.equal(o.yanit(oku('istoc', { access: 'key', PERSONA_ACCESS: 'key' })).ok, true);
  assert.equal(o.ozellik.get('PERSONA_ACCESS'), 'development-public');
  assert.equal(o.ozellik.get('PERSONA_TABLO_KIMLIGI'), 'x'.repeat(44));
  o.ozellik.set('PERSONA_ACCESS', 'key');
  const kapali = o.yanit(oku('istoc', { key: '' }));
  assert.equal(kapali.ok, false);
  assert.equal(kapali.fields, undefined);
  const kotu = ortam({ anahtar: null, kurulum: { access: 'herkes', spreadsheetId: '../x' } });
  const k = kotu.yanit(oku('istoc', { key: '' }));
  assert.equal(k.ok, false);
  assert.equal(k.access, 'key');
  assert.equal(k.fields, undefined);
  assert.equal(kotu.ozellik.get('PERSONA_ACCESS'), undefined);
  assert.equal(kotu.ozellik.get('PERSONA_TABLO_KIMLIGI'), undefined);
});

test('web girişi: bozuk JSON ve sağlık denetimi veri sızdırmaz', () => {
  const o = ortam();
  const bozuk = JSON.parse(o.ctx.doPost({ postData: { contents: '{' } }).metin);
  assert.equal(bozuk.code, 'invalid');
  const saglik = JSON.parse(o.ctx.doGet().metin);
  assert.deepEqual(Object.keys(saglik).sort(), ['access', 'ok', 'service']);
  assert.equal(saglik.access, 'key');
});

test('kurulum: yalnız eksik satırlar eklenir, var olan değer korunur', () => {
  const o = ortam({ satirlar: [['istoc', 'kur', 'Kur', 61, '', '']] });
  const eklenen = o.ctx.personaSekmesiniKur();
  assert.equal(eklenen, SEMA.length - 1);
  assert.equal(o.sekme.hucreler[1][3], 61);
  assert.equal(o.ctx.personaSekmesiniKur(), 0);
});

test('regresyon: sayı alanında seçenek listesi denetlenir (yama ve tablo okuması)', () => {
  const tanim = SEMA.find((t) => t.projects[0] === 'istoc' && t.field === 'affUfukAy');
  assert.deepEqual(tanim.options, [12, 24, 36]);
  const once = varsayilan('istoc', 'affUfukAy');
  const o = ortam();
  const red = o.yanit(yama([{ field: 'affUfukAy', before: once, value: 13 }], { operationId: 'islem-ufuk13' }));
  assert.equal(red.code, 'invalid');
  assert.deepEqual(red.invalidFields, ['affUfukAy']);
  assert.equal(ortam({ satirlar: [['istoc', 'affUfukAy', 'Ufuk', 13, '', '']] }).yanit(oku()).code, 'invalid');
  for (const v of [12, 24, 36]) {
    assert.equal(ortam({ satirlar: [['istoc', 'affUfukAy', 'Ufuk', v, '', '']] }).yanit(oku()).fields.affUfukAy, v);
    const r = ortam().yanit(yama([{ field: 'affUfukAy', before: once, value: v }], { operationId: `islem-ufuk${v}` }));
    assert.equal(r.ok, true, String(v));
  }
});

test('kalıcı işlem defteri: önbellek silinip tablo elle geri alınsa da eski işlem yeniden yazmaz', () => {
  const o = ortam({ satirlar: [['istoc', 'kur', 'Kur', 60, '', '']] });
  const ilk = o.yanit(yama([{ field: 'kur', before: 60, value: 62 }], { operationId: 'islem-defter1' }));
  assert.equal(ilk.ok, true);
  assert.ok(o.defter, 'Persona İşlemleri sekmesi açılmalı');
  assert.ok(o.defter.hucreler.some((r) => r.includes('islem-defter1')));
  o.onbellek.clear();
  o.sekme.hucreler[1][3] = 60; // Biri elle eski değere döndü (A → B → A).
  const tekrar = o.yanit(yama([{ field: 'kur', before: 60, value: 62 }], { operationId: 'islem-defter1' }));
  assert.equal(tekrar.ok, true);
  assert.equal(tekrar.duplicate, true);
  assert.equal(tekrar.fields.kur, 60);
  assert.equal(o.sekme.hucreler[1][3], 60);
  const farkli = o.yanit(yama([{ field: 'kur', before: 60, value: 63 }], { operationId: 'islem-defter1' }));
  assert.equal(farkli.code, 'invalid');
  assert.equal(o.sekme.hucreler[1][3], 60);
});

test('kalıcı işlem defteri: kayıt silinmez, doluysa yeni yazı güvenle reddedilir, eski kimlik tanınır', () => {
  const o = ortam({ satirlar: [['istoc', 'calisan', 'Çalışan', 1, '', ''], ['segika', 'calisan', 'Çalışan', 1, '', '']] });
  for (let i = 0; i < 3; i++) assert.equal(o.yanit(yama([{ field: 'calisan', before: i + 1, value: i + 2 }], { operationId: `islem-sinir${i}` })).ok, true);
  o.ctx.PERSONA_DEFTER_SINIRI = 3;
  const dolu = o.yanit(yama([{ field: 'calisan', before: 4, value: 5 }], { operationId: 'islem-sinir3' }));
  assert.equal(dolu.ok, false);
  assert.equal(dolu.code, 'unavailable');
  assert.equal(o.sekme.hucreler[1][3], 4);
  assert.equal(o.defter.hucreler.length - 1, 3);
  assert.ok(o.defter.hucreler.some((r) => r.includes('islem-sinir0')));
  o.onbellek.clear();
  o.sekme.hucreler[1][3] = 1; // Elle ilk değere dönüldü: en eski işlem yeniden uygulanmamalı.
  const eski = o.yanit(yama([{ field: 'calisan', before: 1, value: 2 }], { operationId: 'islem-sinir0' }));
  assert.equal(eski.duplicate, true);
  assert.equal(o.sekme.hucreler[1][3], 1);
  o.ctx.PERSONA_DEFTER_SINIRI = 100;
  const s = o.yanit({ ...yama([{ field: 'calisan', before: 1, value: 2 }], { operationId: 'islem-sinir0' }), project: 'segika' });
  assert.equal(s.ok, true);
  assert.equal(s.duplicate, undefined);
});

test('atomik yazım: toplu istek başarısız olursa hiçbir alan ve defter kaydı yazılmaz', () => {
  const o = ortam({ satirlar: [['istoc', 'kur', 'Kur', 60, '', ''], ['istoc', 'calisan', 'Çalışan', 1, '', '']], topluHata: true });
  const once = JSON.stringify(o.sekme.hucreler);
  const r = o.yanit(yama([{ field: 'kur', before: 60, value: 61 }, { field: 'calisan', before: 1, value: 2 }, { field: 'blok', before: varsayilan('istoc', 'blok'), value: 30 }], { operationId: 'islem-atomik' }));
  assert.equal(r.code, 'unavailable');
  assert.equal(r.message, 'Kayıt sonucu doğrulanamadı. Aynı işlem kimliğiyle yeniden deneyin.');
  assert.equal(JSON.stringify(o.sekme.hucreler), once);
  assert.equal(o.defter.hucreler.length, 1);
  assert.equal(o.onbellek.size, 0);
  o.toplu.hata = false;
  const yeniden = o.yanit(yama([{ field: 'kur', before: 60, value: 61 }, { field: 'calisan', before: 1, value: 2 }, { field: 'blok', before: varsayilan('istoc', 'blok'), value: 30 }], { operationId: 'islem-atomik' }));
  assert.equal(yeniden.ok, true);
  assert.equal(yeniden.duplicate, undefined);
  assert.deepEqual([yeniden.fields.kur, yeniden.fields.calisan, yeniden.fields.blok], [61, 2, 30]);
});

test('atomik yazım: tek toplu istek yalnız değişen hücreleri, yeni satırı ve defter kaydını taşır', () => {
  const o = ortam({ satirlar: [['istoc', 'kur', 'Kur', 60, '', ''], ['segika', 'kur', 'Kur', 70, '', '']] });
  o.yanit(yama([{ field: 'kur', before: 60, value: 61 }, { field: 'blok', before: varsayilan('istoc', 'blok'), value: 30 }], { operationId: 'islem-tektoplu' }));
  assert.equal(o.toplu.istekler.length, 1);
  const istekler = o.toplu.istekler[0].requests;
  const guncelle = istekler.filter((r) => r.updateCells);
  assert.equal(guncelle.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(guncelle[0].updateCells.start)), { sheetId: o.sekme.kimlik, rowIndex: 1, columnIndex: 3 });
  assert.equal(guncelle[0].updateCells.rows[0].values.length, 3);
  assert.equal(istekler.filter((r) => r.appendCells).length, 2);
  assert.equal(o.sekme.hucreler[2][3], 70);
});

test('defter: günler sonraki tekrar, aradaki elle değişikliği bozmaz', () => {
  const o = ortam({ satirlar: [['istoc', 'kur', 'Kur', 60, '', '']] });
  o.yanit(yama([{ field: 'kur', before: 60, value: 61 }], { operationId: 'islem-gunler' }));
  o.onbellek.clear();
  o.sekme.hucreler[1][3] = 75;
  const r = o.yanit(yama([{ field: 'kur', before: 60, value: 61 }], { operationId: 'islem-gunler' }));
  assert.equal(r.duplicate, true);
  assert.equal(r.fields.kur, 75);
  assert.equal(o.sekme.hucreler[1][3], 75);
  assert.equal(o.toplu.istekler.length, 1);
});
