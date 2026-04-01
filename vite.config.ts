import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Cloudflare Pages: build to ./dist (default)
    // Local dev server with proxy to ERPNext
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts: ['stock.mte.vn', 'lt.th.io.vn'],
      proxy: {
        '/api': {
          target: 'https://erp.mte.vn',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    // Set base for Cloudflare Pages deployment
    // If deploying to a custom domain (e.g., stock.mte.vn), use '/'
    // If deploying to a subdirectory, change to '/sub-path/'
    base: '/',
  };
});
