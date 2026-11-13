#!/usr/bin/env node
/**
 * Persona eşitleme servisi paketi. OPEX paketinden ayrıdır ve OPEX koduna dokunmaz.
 *
 *   node apps-script/persona-build.mjs --cikti <klasör>
 *
 * Klasöre üç dosya yazar: PersonaSema.js (src/data/personaFields.ts → alanTanimlari'ndan üretilir),
 * PersonaSync.js ve PersonaWeb.js, ayrıca appsscript.json. Klasör `clasp push` ile ayrı bir Apps Script projesine
 * gönderilir. Şema elle yazılmaz: tek kaynak personaFields.ts dosyasıdır.
 *
 * Paket kişisel veri veya anahtar içermez. İsteğe bağlı kurulum dosyası (PersonaKurulum.js) yalnız repo dışına yazılır:
 *
 *   node apps-script/persona-build.mjs --cikti <repo dışı klasör> --tablo <tablo kimliği> --erisim development-public|key
 *
 * Sunucu ilk istekte bu değerleri bir kez ScriptProperties'e (PERSONA_TABLO_KIMLIGI, PERSONA_ACCESS) aktarır.
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

// Kaynak TypeScript dosyaları uzantısız göreli içe aktarım kullanır: yalnız .ts karşılığı varsa çözülür.
registerHooks({
  resolve(spec, ctx, next) {
    if ((spec.startsWith('./') || spec.startsWith('../')) && !/\.[a-z]+$/i.test(spec)) {
      const aday = new URL(`${spec}.ts`, ctx.parentURL);
      if (existsSync(fileURLToPath(aday))) return next(aday.href, ctx);
    }
    return next(spec, ctx);
  },
});

/** personaFields.ts → sunucu şeması. Her proje kendi tanımlarını alır (kosul seçenekleri projeye göre değişir). */
export async function personaSemasi() {
  const { alanTanimlari } = await import(pathToFileURL(resolve(REPO, 'src/data/personaFields.ts')).href);
  const liste = [];
  for (const proje of ['istoc', 'segika']) {
    for (const t of alanTanimlari(proje)) {
      const tur = typeof t.value === 'number' ? 'number' : 'string';
      const o = { field: t.field, label: t.label, type: tur, projects: [proje], default: { [proje]: t.value } };
      if (typeof t.min === 'number') o.min = t.min;
      if (typeof t.max === 'number') o.max = t.max;
      if (Array.isArray(t.options)) o.options = [...t.options];
      liste.push(o);
    }
  }
  return liste;
}

function arg(ad) {
  const i = process.argv.indexOf(`--${ad}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

const MANIFEST = {
  timeZone: 'Europe/Istanbul',
  runtimeVersion: 'V8',
  exceptionLogging: 'STACKDRIVER',
  oauthScopes: ['https://www.googleapis.com/auth/spreadsheets'],
  // Tek atomik toplu yazım için Sheets API v4 gelişmiş hizmeti.
  dependencies: { enabledAdvancedServices: [{ userSymbol: 'Sheets', serviceId: 'sheets', version: 'v4' }] },
  webapp: { executeAs: 'USER_DEPLOYING', access: 'ANYONE_ANONYMOUS' },
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cikti = arg('cikti');
  if (!cikti) {
    console.error('Kullanım: node apps-script/persona-build.mjs --cikti <klasör>');
    process.exit(2);
  }
  const hedef = resolve(process.cwd(), cikti);
  const tablo = arg('tablo');
  const erisim = arg('erisim');
  const repoIci = (() => { const r = relative(REPO, hedef); return r === '' || (!r.startsWith('..') && !isAbsolute(r)); })();
  if ((tablo || erisim) && repoIci) {
    console.error(`Kurulum dosyası tablo kimliği taşır; repo dışına yazın (verilen: ${hedef}).`);
    process.exit(2);
  }
  if (erisim && erisim !== 'development-public' && erisim !== 'key') {
    console.error('--erisim development-public ya da key olmalı.');
    process.exit(2);
  }
  if (tablo && !/^[A-Za-z0-9_-]{20,100}$/.test(tablo)) {
    console.error('--tablo geçerli bir tablo kimliği olmalı.');
    process.exit(2);
  }
  mkdirSync(hedef, { recursive: true });
  if (tablo || erisim) {
    const kurulum = { ...(tablo ? { spreadsheetId: tablo } : {}), ...(erisim ? { access: erisim } : {}) };
    writeFileSync(resolve(hedef, 'PersonaKurulum.js'), `/** Repo dışı kurulum değerleri. İlk istekte ScriptProperties'e aktarılır. */\nvar PERSONA_KURULUM = ${JSON.stringify(kurulum)};\n`);
  }
  const sema = await personaSemasi();
  writeFileSync(resolve(hedef, 'PersonaSema.js'), `/** Üretilmiş dosya: src/data/personaFields.ts → apps-script/persona-build.mjs. Düzenlemeyin. */\nvar PERSONA_SEMASI = ${JSON.stringify(sema)};\n`);
  copyFileSync(resolve(HERE, 'src/PersonaSync.js'), resolve(hedef, 'PersonaSync.js'));
  copyFileSync(resolve(HERE, 'persona-web.js'), resolve(hedef, 'PersonaWeb.js'));
  writeFileSync(resolve(hedef, 'appsscript.json'), `${JSON.stringify(MANIFEST, null, 2)}\n`);
  console.log(`Persona paketi: ${hedef} (${sema.length} alan)`);
}
