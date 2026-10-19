// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// GitHub Pages: https://karacaismail.github.io/19ekim/
export default defineConfig({
  site: 'https://karacaismail.github.io',
  base: '/19ekim',
  trailingSlash: 'always',
  integrations: [react()],
});
