// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const BASE = '/19ekim';

/** @type {import('vite').Connect.NextHandleFunction} */
const kokYonlendirme = (req, res, next) => {
  const yol = (req.url ?? '').split('?')[0];
  if (yol === '/' || yol === '/index.html' || yol === BASE) {
    res.statusCode = 302;
    res.setHeader('Location', `${BASE}/`);
    res.end();
    return;
  }
  next();
};

/**
 * Yalnız geliştirme sunucusu (`astro dev`): kök adres `http://localhost:4321/` site tabanına yönlenir.
 * Taban `/19ekim` olduğu için kök adres aksi hâlde 404 verir. Üretim derlemesini ve GitHub Pages'i etkilemez.
 * @type {import('vite').Plugin}
 */
const kokuTabanaYonlendir = {
  name: 'kok-tabana-yonlendir',
  apply: 'serve',
  // Astro taban denetimini kendi son kancasında yığının başına ekler (astro/dist/vite-plugin-astro-server/plugin.js).
  // Bu kanca ondan sonra çalışıp kendini en başa koyar. Aksi hâlde kök adres Astro'nun 404 sayfasına düşer.
  enforce: 'post',
  configureServer(server) {
    return () => {
      server.middlewares.stack.unshift({ route: '', handle: kokYonlendirme });
    };
  },
};

/**
 * Yalnız üretim derlemesi: rehber parçaları önyükleme bağlantısı olmadan, doğrudan yüklenir.
 * Bağımlılıklarını sayfa zaten yükler. WebKit başarısız önyüklemeyi önbellekte tutar.
 * Bağlantı olursa yükleme hatasından sonra "yeniden yükle" düğmesi de başarısız olur.
 * Astro istemci derlemesinin `modulePreload` ayarını kendisi yazar. Bu yüzden ayar eklenti kancasıyla eklenir.
 * @type {import('vite').Plugin}
 */
const rehberOnyuklemesi = {
  name: 'rehber-onyuklemesi',
  apply: 'build',
  configEnvironment(ad) {
    if (ad !== 'client') return;
    return {
      build: {
        modulePreload: {
          polyfill: false,
          resolveDependencies: (dosya, bagimliliklar) =>
            /(^|\/)(oncu|kadrolu|cozum|tavsiye|elci|PolitikaAkisAyrinti)\.[\w-]+\.js$/.test(dosya) ? [] : bagimliliklar,
        },
      },
    };
  },
};

// GitHub Pages: https://karacaismail.github.io/19ekim/
export default defineConfig({
  site: 'https://karacaismail.github.io',
  base: BASE,
  trailingSlash: 'always',
  integrations: [react()],
  vite: { plugins: [kokuTabanaYonlendir, rehberOnyuklemesi] },
});
