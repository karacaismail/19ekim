#!/usr/bin/env node
/**
 * Testler için ön plan statik sunucu: dist/ klasörünü /19ekim/ altında sunar.
 * (Astro 7 `astro preview` etkileşimsiz ortamda arka plana geçtiği için Playwright bunu kullanır.)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const BASE = '/19ekim';
const DIST = new URL('../dist/', import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 4322);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

async function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const safe = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, safe);
  const info = await stat(file).catch(() => null);
  if (info?.isDirectory()) file = join(file, 'index.html');
  return file;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith(`${BASE}/`) && url.pathname !== BASE) {
    res.writeHead(302, { location: `${BASE}/` }).end();
    return;
  }
  const file = await resolveFile(url.pathname.slice(BASE.length) || '/');
  if (!file) {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('Bad request');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    const notFound = await readFile(join(DIST, '404.html')).catch(() => 'Not found');
    res.writeHead(404, { 'content-type': TYPES['.html'] }).end(notFound);
  }
}).listen(PORT, '127.0.0.1', () => console.log(`dist → http://127.0.0.1:${PORT}${BASE}/`));
