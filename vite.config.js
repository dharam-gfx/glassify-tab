import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths are required when served from chrome-extension://<id>/
  base: './',
  server: {
    proxy: {
      '/__rss/tech': {
        target: 'https://feeds.bbci.co.uk',
        changeOrigin: true,
        rewrite: () => '/news/technology/rss.xml',
      },
      '/__rss/world': {
        target: 'https://feeds.bbci.co.uk',
        changeOrigin: true,
        rewrite: () => '/news/world/rss.xml',
      },
      '/__rss/business': {
        target: 'https://feeds.bbci.co.uk',
        changeOrigin: true,
        rewrite: () => '/news/business/rss.xml',
      },
      '/__rss/hn': {
        target: 'https://hnrss.org',
        changeOrigin: true,
        rewrite: () => '/frontpage',
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: { polyfill: false },
  },
});
