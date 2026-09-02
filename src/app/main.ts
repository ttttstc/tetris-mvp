/**
 * app/main.ts
 *
 * Composition root — the ONLY file in the project that knows about Svelte
 * (for mount) and DOM APIs (for the canvas). Everything else is framework-
 * agnostic pure TypeScript.
 */
import { mount } from 'svelte';
import App from '../ui/App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Missing #app mount point in index.html');
mount(App, { target });
