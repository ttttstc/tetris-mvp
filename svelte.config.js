import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    // Svelte 5 runes are enabled by default; we keep it explicit for clarity.
    runes: true,
  },
};
