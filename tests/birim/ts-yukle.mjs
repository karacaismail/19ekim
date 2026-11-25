// Node'un kendi test aracı için küçük yükleyici. Uzantısız göreli TypeScript içe aktarmalarına `.ts` ekler.
// Node 24 tür bilgisini kendisi siler. Böylece `src/data` dosyaları tarayıcı ve Playwright olmadan denenir.
import { registerHooks } from 'node:module';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(belirtec, baglam, sonraki) {
    if (/^\.\.?\//.test(belirtec) && !/\.[a-z]+$/i.test(belirtec)) {
      const aday = new URL(`${belirtec}.ts`, baglam.parentURL);
      if (fs.existsSync(fileURLToPath(aday))) return sonraki(aday.href, baglam);
    }
    return sonraki(belirtec, baglam);
  },
});
