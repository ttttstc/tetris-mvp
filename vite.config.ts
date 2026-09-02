import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $core: fileURLToPath(new URL('./src/core', import.meta.url)),
      $render: fileURLToPath(new URL('./src/render', import.meta.url)),
      $input: fileURLToPath(new URL('./src/input', import.meta.url)),
      $ui: fileURLToPath(new URL('./src/ui', import.meta.url)),
      $extensions: fileURLToPath(new URL('./src/extensions', import.meta.url)),
      $app: fileURLToPath(new URL('./src/app', import.meta.url)),
    },
  },
  server: { port: 5173, strictPort: false },
  build: { target: 'es2022', sourcemap: true },
});
