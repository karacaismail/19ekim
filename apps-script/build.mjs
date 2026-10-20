#!/usr/bin/env node
/**
 * Apps Script tek dosya paketi: src/Motor.js + src/Sheets.js + src/Kurulum.js (+ isteğe bağlı tohum) → tek .gs.
 * Google Sheets → Uzantılar → Apps Script → Kod.gs içeriğinin yerine yapıştırılır.
 *
 *   node apps-script/build.mjs --cikti <dosya.gs> [--tohum <Tohum.js>]
 *
 * Tohum kişisel veri içerir (ad, ücret, hesap); tohumlu paket repo içine yazılamaz.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const PARCALAR = ['src/Motor.js', 'src/Sheets.js', 'src/Kurulum.js'];

function arg(ad) {
  const i = process.argv.indexOf(`--${ad}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

const cikti = arg('cikti');
const tohum = arg('tohum');
if (!cikti) {
  console.error('Kullanım: node apps-script/build.mjs --cikti <dosya.gs> [--tohum <Tohum.js>]');
  process.exit(2);
}
const hedef = resolve(process.cwd(), cikti);
const repoIci = (yol) => {
  const r = relative(REPO, yol);
  return r === '' || (!r.startsWith('..') && !isAbsolute(r));
};
if (tohum && repoIci(hedef)) {
  console.error(`Tohumlu paket kişisel veri içerir; repo dışına yazın (verilen: ${hedef}).`);
  process.exit(2);
}

const bolumler = PARCALAR.map((p) => `// ===== ${p} =====\n${readFileSync(resolve(HERE, p), 'utf8')}`);
if (tohum) bolumler.push(`// ===== Tohum (kişisel veri; repoya girmez) =====\n${readFileSync(resolve(process.cwd(), tohum), 'utf8')}`);

const ust = `/**
 * Türksab OPEX — Google Apps Script paketi (${new Date().toISOString().slice(0, 10)}).
 * Kaynak: github.com/karacaismail/19ekim → apps-script/. Bu dosyayı düzenlemeyin; kaynaktan yeniden üretin.
 * Kurulum: OPEX menüsü → Kurulum / onarım. Ayrıntı: apps-script/README.md
 */
`;
mkdirSync(dirname(hedef), { recursive: true });
writeFileSync(hedef, `${ust}\n${bolumler.join('\n\n')}`);
console.log(`Apps Script paketi: ${hedef}${tohum ? ' (tohumlu)' : ''}`);
